"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUserContext } from "@/shared/context/UserContext";
import { useGameApi } from "@/shared/lib/game-api";
import { makeGameSocket, WSMessage } from "@/shared/lib/game-socket";

export type GamePhase = "waiting" | "running" | "crashed";
export type GameState = {
    phase: GamePhase;
    multiplier: number;
    roundId: number | null;
    connected: boolean;
    lastError: string | null;
    timeToStart: number;
};

export function useGame() {
    const { user } = useUserContext();
    const initData = user?.initData || "";
    const { fetchCurrentRound } = useGameApi();

    const [state, setState] = useState<GameState>({
        phase: "waiting",
        multiplier: 1,
        roundId: null,
        connected: false,
        lastError: null,
        timeToStart: 0,
    });

    const retryRef = useRef({ tries: 0, closing: false });
    const socketRef = useRef<ReturnType<typeof makeGameSocket> | null>(null);
    const timerRef = useRef<number | null>(null);
    const deadlineRef = useRef<number | null>(null);
    const serverOffsetRef = useRef<number>(0);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback((betDeadlineIso?: string) => {
        clearTimer();
        if (!betDeadlineIso) {
            setState(s => ({ ...s, timeToStart: 0 }));
            deadlineRef.current = null;
            return;
        }
        const dl = new Date(betDeadlineIso).getTime();
        if (!Number.isFinite(dl)) {
            setState(s => ({ ...s, timeToStart: 0 }));
            deadlineRef.current = null;
            return;
        }
        deadlineRef.current = dl;
        const tick = () => {
            const now = Date.now() + serverOffsetRef.current;
            const seconds = Math.max(0, Math.ceil((dl - now) / 1000));
            setState(s => ({ ...s, timeToStart: seconds }));
            if (seconds <= 0) clearTimer();
        };
        tick();
        timerRef.current = window.setInterval(tick, 250);
    }, [clearTimer]);

    const scheduleReconnect = useCallback(() => {
        retryRef.current.tries += 1;
        const t = Math.min(20000, 1000 * Math.pow(2, retryRef.current.tries));
        console.warn("[GAME] scheduleReconnect", { tries: retryRef.current.tries, delayMs: t });
        const id = setTimeout(() => {
            if (!retryRef.current.closing) {
                console.log("[GAME] reconnecting...");
                connect();
            }
        }, t);
        return () => clearTimeout(id);
    }, []);

    const connect = useCallback(async () => {
        if (!initData) {
            console.warn("[GAME] connect skipped: no initData");
            return;
        }
        try {
            console.log("[GAME] fetchCurrentRound start");
            const current = await fetchCurrentRound();
            console.log("[GAME] fetchCurrentRound ok", current);
            if (retryRef.current.closing) {
                console.warn("[GAME] connect aborted: closing flag");
                return;
            }
            setState(s => ({
                ...s,
                roundId: current.roundId,
                multiplier: current.currentMultiplier ?? 1,
            }));
            startTimer(current.betDeadline);
            if (socketRef.current) {
                console.log("[WS] closing previous socket");
                socketRef.current.close();
            }

            const sock = makeGameSocket(current.roundId, initData, {
                onOpen: () => {
                    console.log("[WS] open", { roundId: current.roundId });
                    retryRef.current.tries = 0;
                    setState(s => ({ ...s, connected: true, lastError: null }));
                },
                onClose: (code, reason) => {
                    console.warn("[WS] close", { code, reason });
                    setState(s => ({ ...s, connected: false }));
                    if (!retryRef.current.closing) scheduleReconnect();
                },
                onError: e => {
                    console.error("[WS] error", e);
                    setState(s => ({ ...s, lastError: e.message }));
                },
                onMessage: (msg: WSMessage) => {
                    console.log("[WS] event", msg);
                    switch (msg.type) {
                        case "round_start":
                            setState(s => ({ ...s, phase: "waiting", roundId: msg.roundId ?? s.roundId }));
                            (async () => {
                                try {
                                    const r = await fetchCurrentRound();
                                    setState(s => ({ ...s, roundId: r.roundId, multiplier: r.currentMultiplier ?? s.multiplier }));
                                    startTimer(r.betDeadline);
                                } catch (err) {
                                    console.error("[GAME] refetch on round_start failed", err);
                                }
                            })();
                            break;
                        case "game_start":
                            setState(s => ({ ...s, phase: "running", roundId: msg.roundId ?? s.roundId, timeToStart: 0 }));
                            clearTimer();
                            break;
                        case "multiplier_update":
                            setState(s => ({ ...s, multiplier: msg.multiplier, phase: "running" }));
                            break;
                        case "game_crash":
                            setState(s => ({ ...s, phase: "crashed", multiplier: msg.crashMultiplier }));
                            break;
                        case "state":
                            setState(prev => {
                                const nextMultiplier = typeof msg.multiplier === "number" ? msg.multiplier : prev.multiplier;
                                const inferredPhase: GamePhase = msg.phase ?? (nextMultiplier > 1 ? "running" : prev.phase);
                                return { ...prev, phase: inferredPhase, multiplier: nextMultiplier, roundId: msg.roundId ?? prev.roundId };
                            });
                            break;
                        case "pong":
                            if (typeof msg.ts === "number") {
                                const measured = msg.ts - Date.now();
                                serverOffsetRef.current = Math.abs(serverOffsetRef.current) < 1 ? measured : (serverOffsetRef.current * 4 + measured) / 5;
                            }
                            break;
                        case "connected":
                            break;
                        case "error":
                            setState(s => ({ ...s, lastError: msg.message }));
                            break;
                    }
                },
            });

            socketRef.current = sock;
            console.log("[WS] open() call");
            sock.open();
        } catch (e) {
            const err = e instanceof Error ? e.message : "fetch failed";
            console.error("[GAME] connect error", err);
            setState(s => ({ ...s, lastError: err }));
            scheduleReconnect();
        }
    }, [initData, fetchCurrentRound, startTimer, clearTimer, scheduleReconnect]);

    const close = useCallback(() => {
        console.log("[GAME] close()");
        retryRef.current.closing = true;
        socketRef.current?.close();
        clearTimer();
    }, [clearTimer]);

    useEffect(() => {
        console.log("[GAME] effect mount", { hasInitData: !!initData });
        if (!initData) return;
        retryRef.current.closing = false;
        connect();
        return () => {
            console.log("[GAME] effect cleanup");
            const ref = retryRef.current;
            ref.closing = true;
            socketRef.current?.close();
            clearTimer();
        };
    }, [connect, initData, clearTimer]);

    const reconnect = useCallback(() => {
        console.log("[GAME] api.reconnect()");
        return connect();
    }, [connect]);

    const api = useMemo(() => ({ reconnect, close }), [reconnect, close]);

    return { state, api };
}
