"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Bet = { amount: number; placed: boolean; betId?: number | null };

type GamePhase = string;

type GameState = {
    bets: Bet[];
    gamePhase: GamePhase;
    currentMultiplier: number;
    roundId: number | null;
};

type GameActions = {
    setBetAmount: (index: number, value: number) => void;
    setBetPlaced: (index: number, betId: number | null) => void;
    resetBets: () => void;
    setGamePhase: (phase: GamePhase) => void;
    setCurrentMultiplier: (v: number) => void;
    setRoundId: (id: number | null) => void;
    setAllBets: (next: Bet[]) => void;
};

type Ctx = GameState & GameActions;

const GameContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "game-state";

function load(): GameState {
    if (typeof window === "undefined") {
        return { bets: [{ amount: 20, placed: false, betId: null }, { amount: 20, placed: false, betId: null }], gamePhase: "waiting", currentMultiplier: 1, roundId: null };
    }
    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (!raw) throw new Error();
        const parsed = JSON.parse(raw) as Partial<GameState>;
        return {
            bets: Array.isArray(parsed.bets) && parsed.bets.length ? parsed.bets as Bet[] : [{ amount: 20, placed: false, betId: null }, { amount: 20, placed: false, betId: null }],
            gamePhase: parsed.gamePhase ?? "waiting",
            currentMultiplier: typeof parsed.currentMultiplier === "number" ? parsed.currentMultiplier : 1,
            roundId: typeof parsed.roundId === "number" ? parsed.roundId : null,
        };
    } catch {
        return { bets: [{ amount: 20, placed: false, betId: null }, { amount: 20, placed: false, betId: null }], gamePhase: "waiting", currentMultiplier: 1, roundId: null };
    }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<GameState>(() => load());

    useEffect(() => {
        try {
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {}
    }, [state]);

    const api: Ctx = useMemo(
        () => ({
            bets: state.bets,
            gamePhase: state.gamePhase,
            currentMultiplier: state.currentMultiplier,
            roundId: state.roundId,
            setBetAmount: (index, value) =>
                setState((s) => ({ ...s, bets: s.bets.map((b, i) => (i === index ? { ...b, amount: value } : b)) })),
            setBetPlaced: (index, betId) =>
                setState((s) => ({ ...s, bets: s.bets.map((b, i) => (i === index ? { ...b, placed: !!betId, betId } : b)) })),
            resetBets: () => setState((s) => ({ ...s, bets: s.bets.map((b) => ({ ...b, placed: false, betId: null })) })),
            setGamePhase: (phase) => setState((s) => ({ ...s, gamePhase: phase })),
            setCurrentMultiplier: (v) => setState((s) => ({ ...s, currentMultiplier: v })),
            setRoundId: (id) => setState((s) => ({ ...s, roundId: id })),
            setAllBets: (next) => setState((s) => ({ ...s, bets: next })),
        }),
        [state]
    );

    return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error("useGame must be used within GameProvider");
    return ctx;
}
