"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUserContext } from "@/shared/context/UserContext";
import { useGameApi } from "@/shared/lib/game-api";
import { makeGameSocket, WSMessage } from "@/shared/lib/game-socket";
import { useGameStore } from "@/shared/store/game";
import type { GameState as StoreState, Phase as StorePhase } from "@/shared/store/game";

export type GamePhase = "waiting" | "running" | "crashed";

export type ClientGameState = {
    phase: GamePhase;
    multiplier: number;
    roundId: number | null;
    connected: boolean;
    lastError: string | null;
    timeToStart: number;
    waitTotal: number;
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
};

const WAIT_META_KEY = "game_wait_meta";

export function useGame() {
    const { user } = useUserContext();
    const initData = user?.initData || "";
    const { fetchCurrentRound } = useGameApi();

    const snap = useGameStore.getState();
    const [state, setState] = useState<ClientGameState>({
        phase: (snap.phase as GamePhase) ?? "waiting",
        multiplier: typeof snap.multiplier === "number" ? snap.multiplier : 1,
        roundId: snap.roundId ?? null,
        connected: false,
        lastError: null,
        timeToStart: snap.timeToStartMs != null ? Math.max(0, Math.ceil(snap.timeToStartMs / 1000)) : 0,
        waitTotal: 0,
    });

    const retryRef = useRef<{ tries: number; closing: boolean }>({ tries: 0, closing: false });
    const socketRef = useRef<ReturnType<typeof makeGameSocket> | null>(null);
    const timerRef = useRef<number | null>(null);
    const serverOffsetRef = useRef<number>(0);

    const syncStore = useCallback((next: Partial<ClientGameState>) => {
        const cur = useGameStore.getState();
        const patch: Partial<StoreState> = {};
        if (typeof next.phase === "string") patch.phase = next.phase as StorePhase;
        if (typeof next.multiplier === "number") patch.multiplier = next.multiplier;
        if (Object.prototype.hasOwnProperty.call(next, "roundId")) patch.roundId = (next.roundId ?? null) as number | null;
        if (typeof next.timeToStart === "number") patch.timeToStartMs = Math.max(0, Math.round(next.timeToStart * 1000));
        if (Object.keys(patch).length > 0) cur.setFromServer(patch);
    }, []);

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
                setState((s) => {
                    const next: ClientGameState = { ...s, timeToStart: 0, waitTotal: preferTotal ?? s.waitTotal };
                    syncStore(next);
                    return next;
                });
                return;
            }
            const dl = Date.parse(deadlineISO);
            if (!Number.isFinite(dl)) {
                setState((s) => {
                    const next: ClientGameState = { ...s, timeToStart: 0, waitTotal: preferTotal ?? s.waitTotal };
                    syncStore(next);
                    return next;
                });
                return;
            }
            const now = Date.now() + serverOffsetRef.current;
            const firstRemaining = Math.max(0, Math.ceil((dl - now) / 1000));
            const total = Math.max(preferTotal ?? firstRemaining, 0);
            saveWaitMeta({ roundId, deadlineISO, waitTotal: total });
            const tick = () => {
                const tNow = Date.now() + serverOffsetRef.current;
                const remaining = Math.max(0, Math.ceil((dl - tNow) / 1000));
                setState((s) => {
                    const next: ClientGameState = { ...s, timeToStart: remaining, waitTotal: total };
                    syncStore(next);
                    return next;
                });
                if (remaining <= 0) clearTimer();
            };
            tick();
            timerRef.current = window.setInterval(tick, 250) as unknown as number;
        },
        [clearTimer, saveWaitMeta, syncStore]
    );

    const scheduleReconnect = useCallback((): (() => void) => {
        retryRef.current.tries += 1;
        const t = Math.min(20000, 1000 * Math.pow(2, retryRef.current.tries));
        const id = window.setTimeout(() => {
            if (!retryRef.current.closing) connect();
        }, t);
        return () => window.clearTimeout(id);
    }, []);

    const connect = useCallback(async () => {
        if (!initData) return;
        try {
            const current = (await fetchCurrentRound()) as CurrentRound;
            if (retryRef.current.closing) return;
            setState((s) => {
                const next: ClientGameState = {
                    ...s,
                    roundId: current.roundId,
                    multiplier: current.currentMultiplier ?? 1,
                };
                syncStore(next);
                return next;
            });
            const meta = loadWaitMeta();
            const preferTotal = meta && meta.roundId === current.roundId ? meta.waitTotal : undefined;
            startTimer(current.roundId, current.betDeadline, preferTotal);
            socketRef.current?.close();

            const sock = makeGameSocket(current.roundId, initData, {
                onOpen: () => {
                    retryRef.current.tries = 0;
                    setState((s) => {
                        const next: ClientGameState = { ...s, connected: true, lastError: null };
                        return next;
                    });
                },
                onClose: () => {
                    setState((s) => ({ ...s, connected: false }));
                    if (!retryRef.current.closing) scheduleReconnect();
                },
                onError: (e: ErrorEvent) => {
                    setState((s) => ({ ...s, lastError: e.message }));
                },
                onMessage: (msg: WSMessage) => {
                    switch (msg.type) {
                        case "round_start": {
                            setState((s) => {
                                const next: ClientGameState = { ...s, phase: "waiting", roundId: msg.roundId ?? s.roundId, multiplier: 1 };
                                syncStore(next);
                                return next;
                            });
                            (async () => {
                                try {
                                    const r = (await fetchCurrentRound()) as CurrentRound;
                                    const m = loadWaitMeta();
                                    const prefer = m && m.roundId === r.roundId ? m.waitTotal : undefined;
                                    startTimer(r.roundId, r.betDeadline, prefer);
                                } catch {}
                            })();
                            break;
                        }
                        case "game_start": {
                            clearWaitMeta();
                            clearTimer();
                            setState((s) => {
                                const next: ClientGameState = { ...s, phase: "running", roundId: msg.roundId ?? s.roundId, timeToStart: 0 };
                                syncStore(next);
                                return next;
                            });
                            break;
                        }
                        case "multiplier_update": {
                            setState((s) => {
                                const next: ClientGameState = { ...s, multiplier: msg.multiplier, phase: "running" };
                                syncStore(next);
                                return next;
                            });
                            break;
                        }
                        case "game_crash": {
                            clearWaitMeta();
                            setState((s) => {
                                const next: ClientGameState = { ...s, phase: "crashed", multiplier: msg.crashMultiplier };
                                syncStore(next);
                                return next;
                            });
                            break;
                        }
                        case "state": {
                            setState((prev) => {
                                const nextMultiplier = typeof msg.multiplier === "number" ? msg.multiplier : prev.multiplier;
                                const inferredPhase: GamePhase =
                                    (msg.phase as GamePhase | undefined) ?? (nextMultiplier > 1 ? "running" : prev.phase);
                                const next: ClientGameState = {
                                    ...prev,
                                    phase: inferredPhase,
                                    multiplier: nextMultiplier,
                                    roundId: msg.roundId ?? prev.roundId,
                                };
                                syncStore(next);
                                return next;
                            });
                            break;
                        }
                        case "pong": {
                            if (typeof msg.ts === "number") {
                                const measured = msg.ts - Date.now();
                                serverOffsetRef.current =
                                    Math.abs(serverOffsetRef.current) < 1 ? measured : (serverOffsetRef.current * 4 + measured) / 5;
                            }
                            break;
                        }
                        case "connected": {
                            break;
                        }
                        case "error": {
                            setState((s) => ({ ...s, lastError: msg.message }));
                            break;
                        }
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
    }, [initData, fetchCurrentRound, startTimer, loadWaitMeta, clearTimer, clearWaitMeta, scheduleReconnect, syncStore]);

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
                setState((s) => {
                    const next: ClientGameState = {
                        ...s,
                        phase: "waiting",
                        roundId: meta.roundId,
                        timeToStart: remaining,
                        waitTotal: meta.waitTotal,
                    };
                    syncStore(next);
                    return next;
                });
                startTimer(meta.roundId, meta.deadlineISO, meta.waitTotal);
            } else {
                clearWaitMeta();
            }
        }
    }, [loadWaitMeta, startTimer, clearWaitMeta, syncStore]);

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
