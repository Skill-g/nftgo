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

const STORAGE_KEY = "game-state";

const defaultState: GameState = {
    bets: [
        { amount: 20, placed: false, betId: null },
        { amount: 20, placed: false, betId: null },
    ],
    gamePhase: "waiting",
    currentMultiplier: 1,
    roundId: null,
};

const noopActions: GameActions = {
    setBetAmount: () => {},
    setBetPlaced: () => {},
    resetBets: () => {},
    setGamePhase: () => {},
    setCurrentMultiplier: () => {},
    setRoundId: () => {},
    setAllBets: () => {},
};

const GameContext = createContext<Ctx>({ ...defaultState, ...noopActions });

function load(): GameState {
    if (typeof window === "undefined") return defaultState;
    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultState;
        const parsed = JSON.parse(raw) as Partial<GameState>;
        return {
            bets: Array.isArray(parsed.bets) && parsed.bets.length ? (parsed.bets as Bet[]) : defaultState.bets,
            gamePhase: typeof parsed.gamePhase === "string" ? parsed.gamePhase : defaultState.gamePhase,
            currentMultiplier: typeof parsed.currentMultiplier === "number" ? parsed.currentMultiplier : defaultState.currentMultiplier,
            roundId: typeof parsed.roundId === "number" ? parsed.roundId : defaultState.roundId,
        };
    } catch {
        return defaultState;
    }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<GameState>(() => load());

    useEffect(() => {
        try {
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {}
    }, [state]);

    const value: Ctx = useMemo(
        () => ({
            ...state,
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

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): Ctx {
    return useContext(GameContext);
}
