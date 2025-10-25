"use client";

import { cachedJsonFetch } from "@/shared/lib/apiCache";

type OnlineUsersResponse = { count?: number | string } | undefined;

export type TopBettor = {
    initials: string;
    games: number;
    sum: number;
};

function ensureBackendUrl(): string {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!url) {
        throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
    }
    return url.replace(/\/$/, "");
}

function coerceCount(value: number | string | undefined): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    throw new Error("Invalid online users payload");
}

export async function fetchOnlineUsersCountCached(): Promise<number> {
    const base = ensureBackendUrl();
    const data = await cachedJsonFetch<OnlineUsersResponse>(`${base}/api/online-users`, {
        namespace: "online-users",
        ttlMs: 15_000,
        cacheKeyExtras: [base],
    });
    const count = data?.count;
    return coerceCount(count);
}

export async function fetchTopBettorsCached(initData: string): Promise<TopBettor[]> {
    if (!initData) return [];
    const base = ensureBackendUrl();
    const body = JSON.stringify({ initData });
    const data = await cachedJsonFetch<TopBettor[]>(`${base}/api/game/top-bettors`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body,
        namespace: "top-bettors",
        ttlMs: 60_000,
        cacheKeyExtras: [base],
    });
    return Array.isArray(data) ? data : [];
}
