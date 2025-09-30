"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Bet = { amount: number; placed: boolean; betId?: number | null };
type GamePhase = string;

type State = {
    bets: Bet[];
    gamePhase: GamePhase;
    currentMultiplier: number;
    roundId: number | null;
};

type Actions = {
    setBetAmount: (index: number, value: number) => void;
    setBetPlaced: (index: number, betId: number | null) => void;
    resetBets: () => void;
    setGamePhase: (phase: GamePhase) => void;
    setCurrentMultiplier: (v: number) => void;
    setRoundId: (id: number | null) => void;
    setAllBets: (next: Bet[]) => void;
};

export type GameStore = State & Actions;

const defaultBets: Bet[] = [
    { amount: 20, placed: false, betId: null },
    { amount: 20, placed: false, betId: null },
];

const initialState: State = {
    bets: defaultBets,
    gamePhase: "waiting",
    currentMultiplier: 1,
    roundId: null,
};

export const useGameStore = create<GameStore>()(
    persist(
        (set) => ({
            ...initialState,
            setBetAmount: (index: number, value: number) =>
                set((s: GameStore) => ({ bets: s.bets.map((b, i) => (i === index ? { ...b, amount: value } : b)) })),
            setBetPlaced: (index: number, betId: number | null) =>
                set((s: GameStore) => ({ bets: s.bets.map((b, i) => (i === index ? { ...b, placed: !!betId, betId } : b)) })),
            resetBets: () =>
                set((s: GameStore) => ({ bets: s.bets.map((b) => ({ ...b, placed: false, betId: null })) })),
            setGamePhase: (phase: GamePhase) => set({ gamePhase: phase }),
            setCurrentMultiplier: (v: number) => set({ currentMultiplier: v }),
            setRoundId: (id: number | null) => set({ roundId: id }),
            setAllBets: (next: Bet[]) => set({ bets: next }),
        }),
        {
            name: "game-state",
            storage: createJSONStorage(() => sessionStorage),
            partialize: (s) => ({
                bets: s.bets,
                gamePhase: s.gamePhase,
                currentMultiplier: s.currentMultiplier,
                roundId: s.roundId,
            }),
        }
    )
);
