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

    const connect = useCallback(async () => {
        if (!initData) return;
        try {
            const current = await fetchCurrentRound();
            if (retryRef.current.closing) return;
            setState(s => ({ ...s, roundId: current.roundId, multiplier: current.currentMultiplier ?? 1 }));
            socketRef.current?.close();

            const sock = makeGameSocket(current.roundId, initData, {
                onOpen: () => {
                    console.log("[WS] open", current.roundId);
                    retryRef.current.tries = 0;
                    setState(s => ({ ...s, connected: true, lastError: null }));
                },
                onClose: () => {
                    console.warn("[WS] close");
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
                            setState(s => ({ ...s, phase: "crashed", multiplier: msg.multiplier }));
                            break;
                        case "state":
                            setState(s => ({
                                ...s,
                                phase: msg.phase ?? s.phase,
                                multiplier: msg.multiplier ?? s.multiplier,
                                roundId: msg.roundId ?? s.roundId,
                            }));
                            break;
                        case "error":
                            setState(s => ({ ...s, lastError: msg.message }));
                            break;
                    }
                },
            });

            socketRef.current = sock;
            sock.open();
        } catch (e) {
            const err = e instanceof Error ? e.message : "fetch failed";
            setState(s => ({ ...s, lastError: err }));
            scheduleReconnect();
        }
    }, [initData, fetchCurrentRound]);

    const scheduleReconnect = useCallback(() => {
        retryRef.current.tries += 1;
        const t = Math.min(20000, 1000 * Math.pow(2, retryRef.current.tries));
        const id = setTimeout(() => {
            if (!retryRef.current.closing) connect();
        }, t);
        return () => clearTimeout(id);
    }, [connect]);

    const close = useCallback(() => {
        retryRef.current.closing = true;
        socketRef.current?.close();
    }, []);

    useEffect(() => {
        if (!initData) return;
        retryRef.current.closing = false;
        connect();
        return () => {
            const ref = retryRef.current;
            ref.closing = true;
            socketRef.current?.close();
        };
    }, [connect, initData]);

    const api = useMemo(() => ({ reconnect: connect, close }), [connect, close]);

    return { state, api };
}
