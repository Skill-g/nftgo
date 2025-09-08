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

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function readNumber(v: unknown, fallback = 0): number {
    return typeof v === "number" && !Number.isNaN(v) ? v : fallback;
}

function readString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function coerceMultiplier(v: unknown): number {
    if (isRecord(v)) {
        if (typeof v.multiplier === "number") return v.multiplier;
        if (typeof v.x === "number") return v.x;
        if (typeof v.coeff === "number") return v.coeff;
        if (typeof v.payoutMultiplier === "number") return v.payoutMultiplier;
    }
    return 1;
}

function coerceStatus(v: unknown): BetStatus {
    if (v === "accepted" || v === "rejected" || v === "cashed_out" || v === "pending") return v;
    return "pending";
}

function coerceTimestamp(v: unknown): string {
    const s = readString(v);
    if (s) return s;
    return new Date().toISOString();
}

function toRoundBet(raw: unknown): RoundBet | null {
    if (!isRecord(raw)) return null;

    const betId = readNumber(raw.betId, NaN);
    const amount = readNumber(raw.amount, 0);

    // user может быть вложен
    let userId = readNumber(raw.userId, 0);
    let usernameMasked: string | undefined = undefined;
    let avatarUrl: string | undefined = undefined;

    if (isRecord(raw.user)) {
        userId = readNumber(raw.user.id, userId);
        const firstName = readString(raw.user.firstName);
        const lastName = readString(raw.user.lastName);
        usernameMasked = [firstName, lastName].filter(Boolean).join(" ").trim() || undefined;
        avatarUrl = readString(raw.user.photoUrl) || undefined;
    }

    const multiplier = coerceMultiplier(raw);
    const status = coerceStatus(raw.status);

    const timestamp = coerceTimestamp(raw.createdAt ?? raw.timestamp);

    if (!Number.isFinite(betId)) return null;

    return {
        betId,
        userId,
        amount,
        multiplier,
        status,
        timestamp,
        usernameMasked,
        avatarUrl,
    };
}

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

                const json = await res.json();

                const rawArr: unknown[] = Array.isArray(json)
                    ? json
                    : Array.isArray((json as BetsNowResponse)?.bets)
                        ? (json as BetsNowResponse).bets
                        : [];

                const mapped = rawArr
                    .map(toRoundBet)
                    .filter((v): v is RoundBet => v !== null)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                if (!aborted) setBets(mapped);
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
