"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Phase = "waiting" | "running" | "crashed";

export type GameState = {
    phase: Phase;
    multiplier: number;
    roundId: number | null;
    timeToStartMs: number | null;
    startedAtMs: number | null;
    crashMultiplier: number | null;
};

type Actions = {
    setFromServer: (p: Partial<GameState>) => void;
    setPhase: (v: Phase) => void;
    setMultiplier: (v: number) => void;
    setRoundId: (v: number | null) => void;
    setTimeToStartMs: (v: number | null) => void;
    setStartedAtMs: (v: number | null) => void;
    setCrashMultiplier: (v: number | null) => void;
    tick: (dt: number) => void;
};

export type GameStore = GameState & Actions;

const initial: GameState = {
    phase: "waiting",
    multiplier: 1,
    roundId: null,
    timeToStartMs: null,
    startedAtMs: null,
    crashMultiplier: null,
};

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            ...initial,
            setFromServer: (p) =>
                set((s) => ({
                    phase: p.phase ?? s.phase,
                    multiplier: typeof p.multiplier === "number" ? p.multiplier : s.multiplier,
                    roundId: p.roundId === undefined ? s.roundId : p.roundId,
                    timeToStartMs: p.timeToStartMs === undefined ? s.timeToStartMs : p.timeToStartMs,
                    startedAtMs: p.startedAtMs === undefined ? s.startedAtMs : p.startedAtMs,
                    crashMultiplier: p.crashMultiplier === undefined ? s.crashMultiplier : p.crashMultiplier,
                })),
            setPhase: (v) => set({ phase: v }),
            setMultiplier: (v) => set({ multiplier: v }),
            setRoundId: (v) => set({ roundId: v }),
            setTimeToStartMs: (v) => set({ timeToStartMs: v }),
            setStartedAtMs: (v) => set({ startedAtMs: v }),
            setCrashMultiplier: (v) => set({ crashMultiplier: v }),
            tick: (dt) => {
                const s = get();
                if (s.phase === "waiting" && s.timeToStartMs !== null && s.timeToStartMs > 0) {
                    set({ timeToStartMs: Math.max(0, s.timeToStartMs - dt) });
                }
            },
        }),
        {
            name: "game-runtime",
            storage: createJSONStorage(() => sessionStorage),
            partialize: (s) => ({
                phase: s.phase,
                multiplier: s.multiplier,
                roundId: s.roundId,
                timeToStartMs: s.timeToStartMs,
                startedAtMs: s.startedAtMs,
                crashMultiplier: s.crashMultiplier,
            }),
        }
    )
);
