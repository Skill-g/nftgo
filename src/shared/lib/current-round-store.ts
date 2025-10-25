"use client";

import { useCallback } from "react";
import { useUserContext } from "@/shared/context/UserContext";
import { getBackendHost } from "@/shared/lib/host";
import type { CurrentRound } from "@/shared/types/current-round";

const TTL_MS = 1500;

type CacheState = {
    round: CurrentRound | null;
    receivedAt: number | null;
    knownRoundId: number | null;
    serverDate: string | null;
    inflight: Promise<CurrentRoundSnapshot> | null;
};

export type CurrentRoundSnapshot = {
    round: CurrentRound;
    receivedAt: number;
    serverDate: string | null;
};

const cache: CacheState = {
    round: null,
    receivedAt: null,
    knownRoundId: null,
    serverDate: null,
    inflight: null
};

function shouldFetch(force: boolean): boolean {
    if (force) return true;
    if (!cache.round) return true;
    if (cache.knownRoundId !== null && cache.round.roundId !== cache.knownRoundId) return true;
    if (cache.receivedAt === null) return true;
    return Date.now() - cache.receivedAt > TTL_MS;
}

function updateCache(round: CurrentRound, serverDate: string | null, receivedAt: number) {
    cache.round = round;
    cache.receivedAt = receivedAt;
    cache.knownRoundId = round.roundId;
    cache.serverDate = serverDate;
}

export function setKnownRoundId(roundId: number) {
    cache.knownRoundId = roundId;
    if (!cache.round || cache.round.roundId !== roundId) {
        cache.receivedAt = null;
    }
}

function hasPartialData(partial: Partial<CurrentRound>): boolean {
    return (
        Object.prototype.hasOwnProperty.call(partial, "betDeadline") ||
        Object.prototype.hasOwnProperty.call(partial, "currentMultiplier") ||
        Object.prototype.hasOwnProperty.call(partial, "gameStartTime") ||
        Object.prototype.hasOwnProperty.call(partial, "startTime") ||
        Object.prototype.hasOwnProperty.call(partial, "isGamePhase") ||
        Object.prototype.hasOwnProperty.call(partial, "serverSeedHash")
    );
}

export function mergeCurrentRound(partial: Partial<CurrentRound> & { roundId: number }) {
    const prev = cache.round && cache.round.roundId === partial.roundId ? cache.round : null;

    if (!prev) {
        if (hasPartialData(partial)) {
            updateCache({ ...partial, roundId: partial.roundId } as CurrentRound, cache.serverDate, Date.now());
        } else {
            setKnownRoundId(partial.roundId);
        }
        return;
    }

    const merged: CurrentRound = { ...prev, ...partial };
    updateCache(merged, cache.serverDate, Date.now());
}

export function getCachedCurrentRound(): CurrentRound | null {
    return cache.round;
}

export function getCachedReceivedAt(): number | null {
    return cache.receivedAt;
}

export function getCachedServerDate(): string | null {
    return cache.serverDate;
}

export function useCurrentRoundStore() {
    const { user } = useUserContext();
    const initData = user?.initData ?? "";
    const host = getBackendHost();

    const getCurrentRound = useCallback(
        async ({ force = false }: { force?: boolean } = {}): Promise<CurrentRoundSnapshot> => {
            if (!shouldFetch(force) && cache.round && cache.receivedAt !== null) {
                return { round: cache.round, receivedAt: cache.receivedAt, serverDate: cache.serverDate };
            }
            if (cache.inflight) return cache.inflight;

            const headers: Record<string, string> = {};
            if (initData) headers["x-telegram-init-data"] = initData;

            const fetchPromise = fetch(
                `https://${host}/api/game/current?_=${Date.now()}`,
                { cache: "no-store", headers }
            ).then(async (res) => {
                if (!res.ok) throw new Error(`current round request failed ${res.status}`);

                const round = (await res.json()) as CurrentRound;
                const receivedAt = Date.now();
                const serverDate = res.headers.get("date");

                updateCache(round, serverDate, receivedAt);

                return { round, receivedAt, serverDate };
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
        [host, initData]
    );

    return {
        getCurrentRound,
        currentRound: cache.round,
        receivedAt: cache.receivedAt,
        serverDate: cache.serverDate
    };
}
