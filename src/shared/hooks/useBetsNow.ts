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
    const [totalBets, setTotalBets] = useState(0);
    const [error, setError] = useState<Error | null>(null);
    const host = getBackendHost();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const totalRef = useRef(0);
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

        if (!enabled) {
            cleanup();
            return cleanup;
        }

        if (!roundId || !initData) {
            totalRef.current = 0;
            setTotalBets(prev => (prev === 0 ? prev : 0));
            setError(prev => (prev ? null : prev));
            cleanup();
            return cleanup;
        }
        totalRef.current = 0;
        setTotalBets(prev => (prev === 0 ? prev : 0));
        setError(prev => (prev ? null : prev));
        const fetchOnce = async () => {
            try {
                inFlight?.abort();
                inFlight = new AbortController();
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
                const nextTotal = extractBets(json).length;
                if (!aborted && totalRef.current !== nextTotal) {
                    totalRef.current = nextTotal;
                    setTotalBets(nextTotal);
                }
                if (!aborted) {
                    setError(prev => (prev ? null : prev));
                }
            } catch (e) {
                if (!aborted) setError(e as Error);
            }
        };
        fetchOnce();
        stopInterval();
        intervalRef.current = setInterval(fetchOnce, 3000);
        return cleanup;
    }, [host, roundId, initData, enabled]);

    return { bets: EMPTY_BETS, totalBets, loading: false, error };
}
