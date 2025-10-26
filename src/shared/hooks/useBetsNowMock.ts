"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RoundBet } from "./useBetsNow";

const EMPTY_BETS: RoundBet[] = [];

type GamePhase = "waiting" | "running" | "crashed";

type UseBetsNowMockOptions = {
    enabled?: boolean;
    phase?: GamePhase;
};

const MOCK_USERS = [
    { id: 10101, name: "Алиса", avatar: undefined },
    { id: 20202, name: "Борис", avatar: undefined },
    { id: 30303, name: "Светлана", avatar: undefined },
    { id: 40404, name: "Дмитрий", avatar: undefined },
    { id: 50505, name: "Екатерина", avatar: undefined },
];

function generateMockBets(): RoundBet[] {
    const now = Date.now();
    return MOCK_USERS.map((user, index) => ({
        betId: now + index,
        userId: user.id,
        amount: 10 + Math.floor(Math.random() * 90),
        multiplier: Number((1 + Math.random() * 4).toFixed(2)),
        status: "accepted",
        timestamp: new Date(now - index * 1000).toISOString(),
        usernameMasked: user.name,
        avatarUrl: user.avatar,
    }));
}

export function useBetsNowMock(roundId?: number | null, initData?: string, options?: UseBetsNowMockOptions) {
    const [totalBets, setTotalBets] = useState(0);
    const [bets, setBets] = useState<RoundBet[]>(EMPTY_BETS);
    const [loading, setLoading] = useState(false);
    const error: Error | null = null;

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const enabled = options?.enabled ?? true;
    const phase = options?.phase;
    const hasCredentials = useMemo(() => enabled && !!roundId && !!initData, [enabled, roundId, initData]);
    const shouldSkipForPhase = phase === "running";

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!hasCredentials) {
            setBets(() => []);
            setTotalBets(0);
            setLoading(false);
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            };
        }

        if (shouldSkipForPhase) {
            setLoading(false);
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            };
        }

        setLoading(true);
        const update = () => {
            const next = generateMockBets();
            setBets(next);
            setTotalBets(next.length);
            setLoading(false);
        };

        update();
        intervalRef.current = setInterval(update, 1500);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [roundId, initData, hasCredentials, shouldSkipForPhase]);

    return { bets, totalBets, loading, error };
}
