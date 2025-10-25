"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUserContext } from "@/shared/context/UserContext";
import { makeGameSocket, WSMessage } from "@/shared/lib/game-socket";
import {
    mergeCurrentRound,
    setKnownRoundId,
    useCurrentRoundStore
} from "@/shared/lib/current-round-store";
import type { CurrentRound } from "@/shared/types/current-round";

export type GamePhase = "waiting" | "running" | "crashed";

export type ClientGameState = {
    phase: GamePhase;
    multiplier: number;
    roundId: number | null;
    connected: boolean;
    lastError: string | null;
    timeToStart: number;
    waitTotal: number;
    deadlineMs: number | null;
    serverOffsetMs: number;
};

type WaitMeta = {
    roundId: number;
    deadlineISO: string;
    waitTotal: number;
};

const WAIT_META_KEY = "game_wait_meta";

export function useGame() {
    const { user } = useUserContext();
    const initData = user?.initData || "";
    const { getCurrentRound } = useCurrentRoundStore();

    const [state, setState] = useState<ClientGameState>({
        phase: "waiting",
        multiplier: 1,
        roundId: null,
        connected: false,
        lastError: null,
        timeToStart: 0,
        waitTotal: 0,
        deadlineMs: null,
        serverOffsetMs: 0
    });

    const retryRef = useRef<{ tries: number; closing: boolean }>({ tries: 0, closing: false });
    const socketRef = useRef<ReturnType<typeof makeGameSocket> | null>(null);
    const timerRef = useRef<number | null>(null);
    const serverOffsetRef = useRef<number>(0);

    const clearTimer = useCallback(() => {
        if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const saveWaitMeta = useCallback((meta: WaitMeta) => {
        try {
            sessionStorage.setItem(WAIT_META_KEY, JSON.stringify(meta));
        } catch {}
    }, []);

    const loadWaitMeta = useCallback((): WaitMeta | null => {
        try {
            const raw = sessionStorage.getItem(WAIT_META_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as WaitMeta;
            if (!parsed.deadlineISO) return null;
            return parsed;
        } catch {
            return null;
        }
    }, []);

    const clearWaitMeta = useCallback(() => {
        try {
            sessionStorage.removeItem(WAIT_META_KEY);
        } catch {}
    }, []);

    const startTimer = useCallback(
        (roundId: number, deadlineISO?: string, preferTotal?: number) => {
            clearTimer();
            if (!deadlineISO) {
                setState(s => ({
                    ...s,
                    timeToStart: 0,
                    waitTotal: preferTotal ?? s.waitTotal,
                    deadlineMs: null
                }));
                return;
            }
            const dl = Date.parse(deadlineISO);
            if (!Number.isFinite(dl)) {
                setState(s => ({
                    ...s,
                    timeToStart: 0,
                    waitTotal: preferTotal ?? s.waitTotal,
                    deadlineMs: null
                }));
                return;
            }
            const nowFixed = Date.now() + serverOffsetRef.current;
            const firstRemaining = Math.max(0, Math.ceil((dl - nowFixed) / 1000));
            const total = Math.max(preferTotal ?? firstRemaining, 0);
            saveWaitMeta({ roundId, deadlineISO, waitTotal: total });

            const tick = () => {
                const tNow = Date.now() + serverOffsetRef.current;
                const remaining = Math.max(0, Math.ceil((dl - tNow) / 1000));
                setState(s => ({
                    ...s,
                    timeToStart: remaining,
                    waitTotal: total,
                    deadlineMs: dl,
                    serverOffsetMs: serverOffsetRef.current
                }));
                if (remaining <= 0) {
                    clearTimer();
                    setState(s => ({
                        ...s,
                        phase: "running"
                    }));
                }
            };

            tick();
            timerRef.current = window.setInterval(tick, 250) as unknown as number;
        },
        [clearTimer, saveWaitMeta]
    );

    const scheduleReconnect = useCallback(() => {
        retryRef.current.tries += 1;
        const t = Math.min(20000, 1000 * Math.pow(2, retryRef.current.tries));
        const id = window.setTimeout(() => {
            if (!retryRef.current.closing) connect();
        }, t);
        return () => window.clearTimeout(id);
    }, []);

    const pullCurrentWithServerDate = useCallback(
        async ({ force = false }: { force?: boolean } = {}): Promise<CurrentRound> => {
            const snapshot = await getCurrentRound({ force });
            const dateHeader = snapshot.serverDate;
            if (dateHeader) {
                const srv = Date.parse(dateHeader);
                if (Number.isFinite(srv)) {
                    serverOffsetRef.current = srv - Date.now();
                }
            }
            return snapshot.round;
        },
        [getCurrentRound]
    );

    const connect = useCallback(async () => {
        if (!initData) return;
        try {
            const current = await pullCurrentWithServerDate();
            if (retryRef.current.closing) return;

            setState(s => ({
                ...s,
                roundId: current.roundId,
                multiplier: current.currentMultiplier ?? 1,
                phase: current.isGamePhase ? "running" : "waiting",
                serverOffsetMs: serverOffsetRef.current
            }));

            const meta = loadWaitMeta();
            const preferTotal = meta && meta.roundId === current.roundId ? meta.waitTotal : undefined;
            startTimer(current.roundId, current.betDeadline, preferTotal);

            socketRef.current?.close();
            const sock = makeGameSocket(current.roundId, initData, {
                onOpen: () => {
                    retryRef.current.tries = 0;
                    setState(s => ({ ...s, connected: true, lastError: null }));
                },
                onClose: () => {
                    setState(s => ({ ...s, connected: false }));
                    if (!retryRef.current.closing) scheduleReconnect();
                },
                onError: (e: ErrorEvent) => {
                    setState(s => ({ ...s, lastError: e.message }));
                },
                onMessage: (msg: WSMessage) => {
                    switch (msg.type) {
                        case "connected": {
                            setState(s => ({
                                ...s,
                                roundId: typeof msg.roundId === "number" ? msg.roundId : s.roundId,
                                multiplier: typeof msg.currentMultiplier === "number" ? msg.currentMultiplier : s.multiplier,
                                phase: msg.isGamePhase ? "running" : "waiting"
                            }));
                            if (typeof msg.roundId === "number") {
                                mergeCurrentRound({
                                    roundId: msg.roundId,
                                    currentMultiplier: msg.currentMultiplier,
                                    betDeadline: msg.betDeadline,
                                    gameStartTime: msg.gameStartTime,
                                    isGamePhase: msg.isGamePhase,
                                    serverSeedHash: msg.serverSeedHash
                                });
                            }
                            if (typeof msg.roundId === "number" && typeof msg.betDeadline === "string") {
                                const m = loadWaitMeta();
                                const prefer = m && m.roundId === msg.roundId ? m.waitTotal : undefined;
                                startTimer(msg.roundId, msg.betDeadline, prefer);
                            }
                            break;
                        }
                        case "round_start": {
                            setKnownRoundId(msg.roundId);
                            if (typeof msg.serverSeedHash === "string") {
                                mergeCurrentRound({
                                    roundId: msg.roundId,
                                    serverSeedHash: msg.serverSeedHash
                                });
                            }
                            setState(s => ({
                                ...s,
                                phase: "waiting",
                                roundId: msg.roundId,
                                multiplier: 1
                            }));
                            (async () => {
                                try {
                                    const r = await pullCurrentWithServerDate({ force: true });
                                    const m = loadWaitMeta();
                                    const prefer = m && m.roundId === r.roundId ? m.waitTotal : undefined;
                                    startTimer(r.roundId, r.betDeadline, prefer);
                                } catch {}
                            })();
                            break;
                        }
                        case "game_start": {
                            setKnownRoundId(msg.roundId);
                            clearWaitMeta();
                            clearTimer();
                            setState(s => ({
                                ...s,
                                phase: "running",
                                roundId: msg.roundId,
                                timeToStart: 0,
                                deadlineMs: null
                            }));
                            break;
                        }
                        case "multiplier_update": {
                            setState(s => ({ ...s, multiplier: msg.multiplier, phase: "running" }));
                            break;
                        }
                        case "game_crash": {
                            clearWaitMeta();
                            setState(s => ({ ...s, phase: "crashed", multiplier: msg.crashMultiplier }));
                            break;
                        }
                        case "state": {
                            setState(prev => {
                                const nextMultiplier = typeof msg.multiplier === "number" ? msg.multiplier : prev.multiplier;
                                const byFlag: GamePhase | undefined =
                                    typeof msg.isGamePhase === "boolean" ? (msg.isGamePhase ? "running" : "waiting") : undefined;
                                const inferredPhase: GamePhase =
                                    (msg.phase as GamePhase | undefined) ?? byFlag ?? (nextMultiplier > 1 ? "running" : prev.phase);
                                if (typeof msg.roundId === "number" && typeof msg.betDeadline === "string") {
                                    const m = loadWaitMeta();
                                    const prefer = m && m.roundId === msg.roundId ? m.waitTotal : undefined;
                                    startTimer(msg.roundId, msg.betDeadline, prefer);
                                }
                                return {
                                    ...prev,
                                    phase: inferredPhase,
                                    multiplier: nextMultiplier,
                                    roundId: typeof msg.roundId === "number" ? msg.roundId : prev.roundId
                                };
                            });
                            if (typeof msg.roundId === "number") {
                                mergeCurrentRound({
                                    roundId: msg.roundId,
                                    currentMultiplier: msg.multiplier,
                                    betDeadline: msg.betDeadline,
                                    gameStartTime: msg.gameStartTime,
                                    isGamePhase: msg.isGamePhase
                                });
                            }
                            break;
                        }
                        case "pong": {
                            if (typeof msg.ts === "number") {
                                const measured = msg.ts - Date.now();
                                serverOffsetRef.current = Math.abs(serverOffsetRef.current) < 1 ? measured : (serverOffsetRef.current * 4 + measured) / 5;
                                setState(s => ({ ...s, serverOffsetMs: serverOffsetRef.current }));
                            }
                            break;
                        }
                        case "error": {
                            setState(s => ({ ...s, lastError: msg.message }));
                            break;
                        }
                    }
                }
            });

            socketRef.current = sock;
            sock.open();
        } catch (e) {
            const err = e instanceof Error ? e.message : "fetch failed";
            setState(s => ({ ...s, lastError: err }));
            scheduleReconnect();
        }
    }, [initData, loadWaitMeta, scheduleReconnect, startTimer, clearTimer, clearWaitMeta, pullCurrentWithServerDate]);

    const close = useCallback(() => {
        retryRef.current.closing = true;
        socketRef.current?.close();
        clearTimer();
    }, [clearTimer]);

    useEffect(() => {
        const meta = loadWaitMeta();
        if (meta) {
            const now = Date.now();
            const dl = Date.parse(meta.deadlineISO);
            if (Number.isFinite(dl) && dl > now) {
                const remaining = Math.max(0, Math.ceil((dl - now) / 1000));
                setState(s => ({
                    ...s,
                    phase: "waiting",
                    roundId: meta.roundId,
                    timeToStart: remaining,
                    waitTotal: meta.waitTotal,
                    deadlineMs: dl
                }));
                startTimer(meta.roundId, meta.deadlineISO, meta.waitTotal);
            } else {
                clearWaitMeta();
            }
        }
    }, [loadWaitMeta, startTimer, clearWaitMeta]);

    useEffect(() => {
        if (!initData) return;
        retryRef.current.closing = false;
        connect();
        return () => {
            const ref = retryRef.current;
            ref.closing = true;
            socketRef.current?.close();
            clearTimer();
        };
    }, [connect, initData, clearTimer]);

    const reconnect = useCallback(() => {
        connect();
    }, [connect]);

    const api = useMemo(() => ({ reconnect, close }), [reconnect, close]);

    return { state, api };
}
