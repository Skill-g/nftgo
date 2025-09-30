"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUserContext } from "@/shared/context/UserContext";
import { useGameApi } from "@/shared/lib/game-api";
import { makeGameSocket, WSMessage } from "@/shared/lib/game-socket";
import { getBackendHost } from "@/shared/lib/host";

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

type CurrentRound = {
    roundId: number;
    currentMultiplier?: number;
    betDeadline?: string;
    gameStartTime?: string;
    isGamePhase?: boolean;
};

type ConnectedUser = {
    id: number;
    username?: string;
    firstName?: string;
};

type ServerStateLike = {
    roundId: number;
    currentMultiplier?: number;
    betDeadline?: string;
    gameStartTime?: string;
    isGamePhase?: boolean;
};

type SocketServerMessage =
    | { type: "round_start"; roundId?: number }
    | { type: "game_start"; roundId?: number }
    | { type: "multiplier_update"; multiplier: number }
    | { type: "game_crash"; crashMultiplier: number }
    | { type: "pong"; ts: number }
    | { type: "error"; message: string }
    | ({ type: "state" } & ServerStateLike)
    | ({ type: "connected"; startTime?: string } & ServerStateLike)
    | ({ event: "state" } & ServerStateLike)
    | ({ event: "connected"; startTime?: string; serverSeedHash?: string; user?: ConnectedUser } & ServerStateLike);

const WAIT_META_KEY = "game_wait_meta";

export function useGame() {
    const { user } = useUserContext();
    const initData = user?.initData || "";
    const { fetchCurrentRound } = useGameApi();
    const host = getBackendHost();

    const [state, setState] = useState<ClientGameState>({
        phase: "waiting",
        multiplier: 1,
        roundId: null,
        connected: false,
        lastError: null,
        timeToStart: 0,
        waitTotal: 0,
        deadlineMs: null,
        serverOffsetMs: 0,
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
                setState((s) => ({
                    ...s,
                    timeToStart: 0,
                    waitTotal: preferTotal ?? s.waitTotal,
                    deadlineMs: null,
                }));
                return;
            }
            const dl = Date.parse(deadlineISO);
            if (!Number.isFinite(dl)) {
                setState((s) => ({
                    ...s,
                    timeToStart: 0,
                    waitTotal: preferTotal ?? s.waitTotal,
                    deadlineMs: null,
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
                setState((s) => ({
                    ...s,
                    timeToStart: remaining,
                    waitTotal: total,
                    deadlineMs: dl,
                    serverOffsetMs: serverOffsetRef.current,
                }));
                if (remaining <= 0) clearTimer();
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

    const pullCurrentWithServerDate = useCallback(async (): Promise<CurrentRound> => {
        if (!host) return fetchCurrentRound() as Promise<CurrentRound>;
        const res = await fetch(`https://${host}/api/game/current?_=${Date.now()}`, { cache: "no-store" });
        const dateHeader = res.headers.get("date");
        if (dateHeader) {
            const srv = Date.parse(dateHeader);
            if (Number.isFinite(srv)) {
                serverOffsetRef.current = srv - Date.now();
            }
        }
        const json = (await res.json()) as CurrentRound;
        return json;
    }, [fetchCurrentRound, host]);

    const inferPhase = useCallback((snapshot: CurrentRound, existingPhase: GamePhase, existingMultiplier: number): GamePhase => {
        const m = typeof snapshot.currentMultiplier === "number" ? snapshot.currentMultiplier : existingMultiplier;
        if (snapshot.isGamePhase === true) return "running";
        if (m > 1) return "running";
        const dl = snapshot.betDeadline ? Date.parse(snapshot.betDeadline) : NaN;
        const gs = snapshot.gameStartTime ? Date.parse(snapshot.gameStartTime) : NaN;
        const now = Date.now() + serverOffsetRef.current;
        if (Number.isFinite(gs) && now >= gs && m <= 1) return "running";
        if (Number.isFinite(dl) && now < dl) return "waiting";
        if (existingPhase === "running" && m <= 1) return "crashed";
        return existingPhase;
    }, []);

    const connect = useCallback(async () => {
        if (!initData) return;
        try {
            const current = await pullCurrentWithServerDate();
            if (retryRef.current.closing) return;
            const nextPhase = inferPhase(current, "waiting", 1);
            setState((s) => ({
                ...s,
                phase: nextPhase,
                roundId: current.roundId,
                multiplier: current.currentMultiplier ?? 1,
                serverOffsetMs: serverOffsetRef.current,
            }));
            const meta = loadWaitMeta();
            const preferTotal = meta && meta.roundId === current.roundId ? meta.waitTotal : undefined;
            startTimer(current.roundId, current.betDeadline, preferTotal);
            socketRef.current?.close();
            const sock = makeGameSocket(current.roundId, initData, {
                onOpen: () => {
                    retryRef.current.tries = 0;
                    setState((s) => ({ ...s, connected: true, lastError: null }));
                },
                onClose: () => {
                    setState((s) => ({ ...s, connected: false }));
                    if (!retryRef.current.closing) scheduleReconnect();
                },
                onError: (e: ErrorEvent) => {
                    setState((s) => ({ ...s, lastError: e.message }));
                },
                onMessage: (msg: SocketServerMessage | WSMessage) => {
                    if ((msg as { event?: string }).event === "connected" || (msg as { type?: string }).type === "connected") {
                        const connectedMsg = msg as Extract<SocketServerMessage, { event: "connected" }> | Extract<SocketServerMessage, { type: "connected" }>;
                        const cr: CurrentRound = {
                            roundId: connectedMsg.roundId,
                            currentMultiplier: connectedMsg.currentMultiplier,
                            betDeadline: connectedMsg.betDeadline,
                            gameStartTime: (connectedMsg as { startTime?: string }).startTime || connectedMsg.gameStartTime,
                            isGamePhase: connectedMsg.isGamePhase,
                        };
                        const phase = inferPhase(cr, state.phase, state.multiplier);
                        setState((s) => ({
                            ...s,
                            phase,
                            roundId: cr.roundId ?? s.roundId,
                            multiplier: typeof cr.currentMultiplier === "number" ? cr.currentMultiplier : s.multiplier,
                        }));
                        const m = loadWaitMeta();
                        const prefer = m && m.roundId === cr.roundId ? m.waitTotal : undefined;
                        startTimer(cr.roundId, cr.betDeadline, prefer);
                        return;
                    }
                    if ((msg as { event?: string }).event === "state" || (msg as { type?: string }).type === "state") {
                        const stateMsg = msg as Extract<SocketServerMessage, { event: "state" }> | Extract<SocketServerMessage, { type: "state" }>;
                        const cr: CurrentRound = {
                            roundId: stateMsg.roundId,
                            currentMultiplier: stateMsg.currentMultiplier,
                            betDeadline: stateMsg.betDeadline,
                            gameStartTime: stateMsg.gameStartTime,
                            isGamePhase: stateMsg.isGamePhase,
                        };
                        const phase = inferPhase(cr, state.phase, state.multiplier);
                        setState((prev) => ({
                            ...prev,
                            phase,
                            roundId: cr.roundId ?? prev.roundId,
                            multiplier: typeof cr.currentMultiplier === "number" ? cr.currentMultiplier : prev.multiplier,
                        }));
                        const m = loadWaitMeta();
                        const prefer = m && m.roundId === (cr.roundId ?? state.roundId ?? 0) ? m.waitTotal : undefined;
                        startTimer(cr.roundId ?? state.roundId ?? 0, cr.betDeadline, prefer);
                        return;
                    }
                    if ((msg as { type?: string }).type === "round_start") {
                        const t = msg as Extract<SocketServerMessage, { type: "round_start" }>;
                        setState((s) => ({ ...s, phase: "waiting", roundId: t.roundId ?? s.roundId, multiplier: 1 }));
                        return;
                    }
                    if ((msg as { type?: string }).type === "game_start") {
                        clearWaitMeta();
                        clearTimer();
                        const t = msg as Extract<SocketServerMessage, { type: "game_start" }>;
                        setState((s) => ({ ...s, phase: "running", roundId: t.roundId ?? s.roundId, timeToStart: 0, deadlineMs: null }));
                        return;
                    }
                    if ((msg as { type?: string }).type === "multiplier_update") {
                        const t = msg as Extract<SocketServerMessage, { type: "multiplier_update" }>;
                        setState((s) => ({ ...s, multiplier: t.multiplier, phase: "running" }));
                        return;
                    }
                    if ((msg as { type?: string }).type === "game_crash") {
                        const t = msg as Extract<SocketServerMessage, { type: "game_crash" }>;
                        clearWaitMeta();
                        setState((s) => ({ ...s, phase: "crashed", multiplier: t.crashMultiplier }));
                        return;
                    }
                    if ((msg as { type?: string }).type === "pong") {
                        const t = msg as Extract<SocketServerMessage, { type: "pong" }>;
                        if (typeof t.ts === "number") {
                            const measured = t.ts - Date.now();
                            serverOffsetRef.current = Math.abs(serverOffsetRef.current) < 1 ? measured : (serverOffsetRef.current * 4 + measured) / 5;
                            setState((s) => ({ ...s, serverOffsetMs: serverOffsetRef.current }));
                        }
                        return;
                    }
                    if ((msg as { type?: string }).type === "error") {
                        const t = msg as Extract<SocketServerMessage, { type: "error" }>;
                        setState((s) => ({ ...s, lastError: t.message }));
                        return;
                    }
                },
            });
            socketRef.current = sock;
            sock.open();
        } catch (e) {
            const err = e instanceof Error ? e.message : "fetch failed";
            setState((s) => ({ ...s, lastError: err }));
            scheduleReconnect();
        }
    }, [initData, pullCurrentWithServerDate, inferPhase, loadWaitMeta, startTimer, scheduleReconnect, clearTimer, state.phase, state.multiplier]);

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
                setState((s) => ({
                    ...s,
                    phase: "waiting",
                    roundId: meta.roundId,
                    timeToStart: remaining,
                    waitTotal: meta.waitTotal,
                    deadlineMs: dl,
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
