"use client";

import { useEffect, useRef, useState } from "react";
import type { RoundBet } from "./useBetsNow";

export function useBetsNowMock(roundId?: number | null, initData?: string) {
    const [bets, setBets] = useState<RoundBet[]>([]);
    const [loading] = useState(false);
    const [error] = useState<Error | null>(null);

    const idRef = useRef(1);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        const genBet = (): RoundBet => {
            const id = idRef.current++;
            const amountPool = [5, 10, 15, 20, 25, 50, 100];
            const amount = amountPool[Math.floor(Math.random() * amountPool.length)];
            const mult = Number((1 + Math.random() * 8).toFixed(2));
            const userId = 100000 + Math.floor(Math.random() * 900000);
            return {
                betId: id,
                userId,
                amount,
                multiplier: mult,
                status: "accepted",
                timestamp: new Date().toISOString(),
                usernameMasked: `Игрок •••${String(userId).slice(-4)}`,
            };
        };

        intervalRef.current = setInterval(() => {
            setBets(prev => {
                const addCount = 1 + Math.floor(Math.random() * 3);
                const next = Array.from({ length: addCount }, genBet);
                return [...next, ...prev].slice(0, 200);
            });
        }, 700);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [roundId, initData]);

    const totalBets = bets.length;
    return { bets, totalBets, loading, error };
}
