"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Bet = { amount: number; placed: boolean; betId: number | null };

type BetsState = { bets: Bet[] };
type BetsActions = {
    setBetAmount: (index: number, value: number) => void;
    setBetPlaced: (index: number, betId: number | null) => void;
    resetBets: () => void;
    setAllBets: (next: Bet[]) => void;
};

export type BetsStore = BetsState & BetsActions;

const defaultBets: Bet[] = [
    { amount: 20, placed: false, betId: null },
    { amount: 20, placed: false, betId: null },
];

export const useBetsStore = create<BetsStore>()(
    persist(
        (set) => ({
            bets: defaultBets,
            setBetAmount: (index, value) =>
                set((s) => ({ bets: s.bets.map((b, i) => (i === index ? { ...b, amount: value } : b)) })),
            setBetPlaced: (index, betId) =>
                set((s) => ({ bets: s.bets.map((b, i) => (i === index ? { ...b, placed: !!betId, betId } : b)) })),
            resetBets: () =>
                set((s) => ({ bets: s.bets.map((b) => ({ ...b, placed: false, betId: null })) })),
            setAllBets: (next) => set({ bets: next }),
        }),
        { name: "bets-state", storage: createJSONStorage(() => sessionStorage) }
    )
);
