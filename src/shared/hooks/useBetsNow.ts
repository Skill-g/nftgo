"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type BetsNowItem = {
    betId?: unknown;
    userId?: unknown;
    amount?: unknown;
    multiplier?: unknown;
    status?: unknown;
    timestamp?: unknown;
    usernameMasked?: unknown;
    avatarUrl?: unknown;
};

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function toString(value: unknown): string | undefined {
    if (typeof value === "string") return value;
    return undefined;
}

function toBetStatus(value: unknown): BetStatus | undefined {
    if (value === "accepted" || value === "rejected" || value === "cashed_out" || value === "pending") {
        return value;
    }
    return undefined;
}

function mapBet(raw: unknown): RoundBet | null {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as BetsNowItem;

    const betId = toNumber(item.betId);
    const userId = toNumber(item.userId);
    const amount = toNumber(item.amount);
    const multiplier = toNumber(item.multiplier);
    const timestamp = toString(item.timestamp);
    const status = toBetStatus(item.status);

    if (betId == null || userId == null || amount == null || multiplier == null || !timestamp || !status) {
        return null;
    }

    return {
        betId,
        userId,
        amount,
        multiplier,
        status,
        timestamp,
        usernameMasked: toString(item.usernameMasked),
        avatarUrl: toString(item.avatarUrl),
    };
}

function sanitizeBets(rawBets: unknown[]): RoundBet[] {
    return rawBets
        .map(mapBet)
        .filter((bet): bet is RoundBet => bet != null);
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
    const [totalBets, setTotalBets] = useState(0);
    const [bets, setBets] = useState<RoundBet[]>(EMPTY_BETS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const host = getBackendHost();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const totalRef = useRef(0);
    const enabled = options?.enabled ?? true;

    const shouldFetch = useMemo(() => enabled && !!roundId && !!initData, [enabled, roundId, initData]);

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

        if (!shouldFetch) {
            totalRef.current = 0;
            setBets(() => []);
            setTotalBets(0);
            setLoading(false);
            setError(null);
            cleanup();
            return cleanup;
        }
        totalRef.current = 0;
        setTotalBets(0);
        setBets(() => []);
        setLoading(true);
        setError(null);
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
                const extracted = extractBets(json);
                const sanitized = sanitizeBets(extracted);
                const nextTotal = sanitized.length;
                if (!aborted) {
                    setBets(sanitized);
                }
                if (!aborted && totalRef.current !== nextTotal) {
                    totalRef.current = nextTotal;
                    setTotalBets(nextTotal);
                }
                if (!aborted) {
                    setLoading(false);
                    setError(null);
                }
            } catch (e) {
                if (!aborted) {
                    setLoading(false);
                    setError(e as Error);
                }
            }
        };
        fetchOnce();
        stopInterval();
        intervalRef.current = setInterval(fetchOnce, 3000);
        return cleanup;
    }, [host, shouldFetch, roundId, initData]);

    return { bets, totalBets, loading, error };
}
