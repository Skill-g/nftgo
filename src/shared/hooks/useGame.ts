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
    });

    const retryRef = useRef({ tries: 0, closing: false });
    const socketRef = useRef<ReturnType<typeof makeGameSocket> | null>(null);

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
            setState(s => ({ ...s, roundId: current.roundId, multiplier: current.currentMultiplier ?? 1 }));
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
                        case "game_start":
                            setState(s => ({ ...s, phase: "running", roundId: msg.roundId ?? s.roundId }));
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
                            console.log("[WS] pong");
                            break;
                        case "connected":
                            console.log("[WS] connected ack");
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
    }, [initData, fetchCurrentRound, scheduleReconnect]);

    const close = useCallback(() => {
        console.log("[GAME] close()");
        retryRef.current.closing = true;
        socketRef.current?.close();
    }, []);

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
        };
    }, [connect, initData]);

    const reconnect = useCallback(() => {
        console.log("[GAME] api.reconnect()");
        return connect();
    }, [connect]);

    const api = useMemo(() => ({ reconnect, close }), [reconnect, close]);

    return { state, api };
}
