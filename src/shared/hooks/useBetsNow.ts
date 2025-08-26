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
    bets: RoundBet[];
};

export function useBetsNow(roundId?: number | null, initData?: string) {
    const [bets, setBets] = useState<RoundBet[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const host = getBackendHost();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!roundId || !initData) {
            setBets([]);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        let aborted = false;
        let inFlight: AbortController | null = null;

        const fetchOnce = async () => {
            try {
                setLoading(true);
                setError(null);
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

                const data = (await res.json()) as BetsNowResponse;

                if (!aborted) {
                    const sorted = [...(data?.bets ?? [])].sort(
                        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );
                    setBets(sorted);
                }
            } catch (e) {
                if (!aborted) setError(e as Error);
            } finally {
                if (!aborted) setLoading(false);
            }
        };

        fetchOnce();
        intervalRef.current = setInterval(fetchOnce, 2000);

        return () => {
            aborted = true;
            inFlight?.abort();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [host, roundId, initData]);

    const totalBets = bets.length;

    return { bets, totalBets, loading, error };
}
