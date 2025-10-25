"use client";

import { useCallback } from "react";
import { getBackendHost } from "@/shared/lib/host";

export type HistoryRow = { roundId: number; crashMultiplier: number; endTime: string };

const TTL_MS = 4000;

export type HistorySnapshot = {
    history: HistoryRow[];
    receivedAt: number;
};

type CacheState = {
    history: HistoryRow[] | null;
    receivedAt: number | null;
    inflight: Promise<HistorySnapshot> | null;
};

const cache: CacheState = {
    history: null,
    receivedAt: null,
    inflight: null
};

function shouldFetch(force: boolean): boolean {
    if (force) return true;
    if (!cache.history) return true;
    if (cache.receivedAt === null) return true;
    return Date.now() - cache.receivedAt > TTL_MS;
}

function updateCache(history: HistoryRow[], receivedAt: number) {
    cache.history = history;
    cache.receivedAt = receivedAt;
}

export function getCachedHistory(): HistoryRow[] | null {
    return cache.history;
}

export function getCachedHistoryReceivedAt(): number | null {
    return cache.receivedAt;
}

export function useHistoryStore() {
    const host = getBackendHost();

    const getHistory = useCallback(
        async ({ force = false }: { force?: boolean } = {}): Promise<HistorySnapshot> => {
            if (!shouldFetch(force) && cache.history && cache.receivedAt !== null) {
                return { history: cache.history, receivedAt: cache.receivedAt };
            }
            if (cache.inflight) return cache.inflight;

            const fetchPromise = fetch(`https://${host}/api/game/history`, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
            }).then(async (res) => {
                if (!res.ok) {
                    throw new Error(`history request failed ${res.status}`);
                }
                const receivedAt = Date.now();
                const data = await res.json();
                const history = Array.isArray(data) ? (data as HistoryRow[]) : [];
                updateCache(history, receivedAt);
                return { history, receivedAt };
            });

            const finalPromise = fetchPromise.then(
                (result) => {
                    cache.inflight = null;
                    return result;
                },
                (err) => {
                    cache.inflight = null;
                    throw err;
                }
            );

            cache.inflight = finalPromise;
            return finalPromise;
        },
        [host]
    );

    return {
        getHistory,
        history: cache.history,
        receivedAt: cache.receivedAt
    };
}
