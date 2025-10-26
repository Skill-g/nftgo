"use client";

import { useEffect, useRef, useState } from "react";
import type { RoundBet } from "./useBetsNow";

const EMPTY_BETS: RoundBet[] = [];

const MOCK_USERS = [
    { userId: 101001, usernameMasked: "Игрок •••1001", avatarUrl: "/profile/placeholder.png" },
    { userId: 102002, usernameMasked: "Игрок •••2002", avatarUrl: "/profile/placeholder.png" },
    { userId: 103003, usernameMasked: "Игрок •••3003", avatarUrl: "/profile/placeholder.png" },
    { userId: 104004, usernameMasked: "Игрок •••4004", avatarUrl: "/profile/placeholder.png" },
    { userId: 105005, usernameMasked: "Игрок •••5005", avatarUrl: "/profile/placeholder.png" },
];

type UseBetsNowMockOptions = {
    enabled?: boolean;
};

export function useBetsNowMock(roundId?: number | null, initData?: string, options?: UseBetsNowMockOptions) {
    const [bets, setBets] = useState<RoundBet[]>(EMPTY_BETS);
    const [totalBets, setTotalBets] = useState(0);
    const [loading, setLoading] = useState(false);
    const error: Error | null = null;

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const betIdRef = useRef(1);
    const lastRoundRef = useRef<number | null>(null);
    const lastInitDataRef = useRef<string | null>(null);
    const enabled = options?.enabled ?? true;

    useEffect(() => {
        const stopInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        stopInterval();

        const currentRoundId = roundId ?? null;
        const currentInitData = initData ?? null;
        const roundChanged = currentRoundId !== lastRoundRef.current;
        const initChanged = currentInitData !== lastInitDataRef.current;

        if (roundChanged) {
            lastRoundRef.current = currentRoundId;
        }
        if (initChanged) {
            lastInitDataRef.current = currentInitData;
        }
        if (roundChanged || initChanged) {
            betIdRef.current = 1;
            setBets(EMPTY_BETS);
            setTotalBets(0);
        }

        if (!enabled) {
            setLoading(false);
            return stopInterval;
        }

        if (!roundId || !initData) {
            setLoading(false);
            setBets(EMPTY_BETS);
            setTotalBets(0);
            return stopInterval;
        }

        const createMockBet = (): RoundBet => {
            const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
            const amount = 5 + Math.floor(Math.random() * 95);
            const multiplier = Number((1 + Math.random() * 4).toFixed(2));
            return {
                betId: betIdRef.current++,
                userId: user.userId,
                amount,
                multiplier,
                status: "accepted",
                timestamp: new Date().toISOString(),
                usernameMasked: user.usernameMasked,
                avatarUrl: user.avatarUrl,
            };
        };

        setLoading(true);
        const initialBets = Array.from({ length: 8 }, createMockBet);
        setBets(initialBets);
        setTotalBets(initialBets.length);
        setLoading(false);

        intervalRef.current = setInterval(() => {
            setBets(prev => {
                const nextBet = createMockBet();
                const nextBets = [nextBet, ...prev].slice(0, 50);
                setTotalBets(prevTotal => prevTotal + 1);
                return nextBets;
            });
        }, 2000);

        return stopInterval;
    }, [roundId, initData, enabled]);

    return { bets, totalBets, loading, error };
}
