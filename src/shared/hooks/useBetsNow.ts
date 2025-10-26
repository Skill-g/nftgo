"use client";

import { useEffect, useRef, useState } from "react";
import { getBackendHost } from "@/shared/lib/host";

export type BetStatus = "accepted" | "rejected" | "cashed_out" | "pending";

export type RoundBet = {
    betId: number;
    userId: number;
    amount: number;
    multiplier: number;
    status: BetStatus;
    timestamp: string;
    usernameMasked?: string;
    avatarUrl?: string;
};

type BetsNowResponse = {
    bets?: unknown[];
};

const EMPTY_BETS: RoundBet[] = [];

function isRoundBet(raw: unknown): raw is RoundBet {
    if (!raw || typeof raw !== "object") return false;
    const bet = raw as RoundBet;
    return (
        typeof bet.betId === "number" &&
        typeof bet.userId === "number" &&
        typeof bet.amount === "number" &&
        typeof bet.multiplier === "number" &&
        typeof bet.status === "string" &&
        typeof bet.timestamp === "string"
    );
}

function areBetsEqual(a: RoundBet[], b: RoundBet[]) {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
        const left = a[i];
        const right = b[i];
        if (
            left.betId !== right.betId ||
            left.userId !== right.userId ||
            left.amount !== right.amount ||
            left.multiplier !== right.multiplier ||
            left.status !== right.status ||
            left.timestamp !== right.timestamp ||
            left.usernameMasked !== right.usernameMasked ||
            left.avatarUrl !== right.avatarUrl
        ) {
            return false;
        }
    }
    return true;
}

function extractBets(raw: unknown): unknown[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && Array.isArray((raw as BetsNowResponse).bets)) {
        return (raw as BetsNowResponse).bets ?? [];
    }
    return [];
}

type UseBetsNowOptions = {
    enabled?: boolean;
};

export function useBetsNow(roundId?: number | null, initData?: string, options?: UseBetsNowOptions) {
    const [bets, setBets] = useState<RoundBet[]>(EMPTY_BETS);
    const [totalBets, setTotalBets] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const host = getBackendHost();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const totalRef = useRef(0);
    const lastRoundRef = useRef<number | null>(null);
    const lastInitDataRef = useRef<string | null>(null);
    const hasFetchedRef = useRef(false);
    const enabled = options?.enabled ?? true;

    useEffect(() => {
        let aborted = false;
        let inFlight: AbortController | null = null;

        const stopInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        const cleanup = () => {
            aborted = true;
            inFlight?.abort();
            stopInterval();
        };

        const currentRoundId = roundId ?? null;
        const lastRoundId = lastRoundRef.current;
        const lastInitData = lastInitDataRef.current;
        const currentInitData = initData ?? null;
        const roundChanged = currentRoundId !== lastRoundId;
        const initDataChanged = currentInitData !== lastInitData;

        if (roundChanged) {
            lastRoundRef.current = currentRoundId;
        }
        if (initDataChanged) {
            lastInitDataRef.current = currentInitData;
        }

        if (roundChanged || initDataChanged) {
            totalRef.current = 0;
            hasFetchedRef.current = false;
            setBets(EMPTY_BETS);
            setTotalBets(prev => (prev === 0 ? prev : 0));
        }

        if (!enabled) {
            setLoading(false);
            cleanup();
            return cleanup;
        }

        if (!roundId || !initData) {
            totalRef.current = 0;
            hasFetchedRef.current = false;
            setBets(EMPTY_BETS);
            setTotalBets(prev => (prev === 0 ? prev : 0));
            setError(prev => (prev ? null : prev));
            setLoading(false);
            cleanup();
            return cleanup;
        }

        if (roundChanged || initDataChanged) {
            setError(prev => (prev ? null : prev));
        }

        const fetchOnce = async () => {
            try {
                inFlight?.abort();
                inFlight = new AbortController();
                if (!hasFetchedRef.current) {
                    setLoading(true);
                }
                const url = `https://${host}/api/game/${roundId}/bets-now`;
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ initData }),
                    cache: "no-store",
                    signal: inFlight.signal,
                });
                if (!res.ok) throw new Error(`bets-now ${res.status}`);
                const json = await res.json();
                const parsedBets = extractBets(json)
                    .filter(isRoundBet)
                    .map(bet => ({ ...bet }));
                const nextTotal = parsedBets.length;
                if (!aborted) {
                    if (totalRef.current !== nextTotal) {
                        totalRef.current = nextTotal;
                        setTotalBets(nextTotal);
                    }
                    setBets(prev => (areBetsEqual(prev, parsedBets) ? prev : parsedBets));
                    setError(prev => (prev ? null : prev));
                }
            } catch (e) {
                if (!aborted) setError(e as Error);
            } finally {
                if (!aborted) {
                    hasFetchedRef.current = true;
                    setLoading(false);
                }
            }
        };

        fetchOnce();
        stopInterval();
        intervalRef.current = setInterval(fetchOnce, 3000);
        return cleanup;
    }, [host, roundId, initData, enabled]);

    return { bets, totalBets, loading, error };
}
