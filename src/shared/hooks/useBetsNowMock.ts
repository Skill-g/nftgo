"use client";

import { useEffect, useRef, useState } from "react";
import type { RoundBet } from "./useBetsNow";

type UseBetsNowMockOptions = {
    pause?: boolean;
};

const EMPTY_BETS: RoundBet[] = [];

export function useBetsNowMock(roundId?: number | null, initData?: string, options: UseBetsNowMockOptions = {}) {
    const [totalBets, setTotalBets] = useState(0);
    const error: Error | null = null;

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { pause = false } = options;

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!roundId || !initData) {
            setTotalBets(0);
            return;
        }

        if (pause) {
            return;
        }

        setTotalBets(0);
        intervalRef.current = setInterval(() => {
            setTotalBets(prev => prev + 1 + Math.floor(Math.random() * 3));
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [roundId, initData, pause]);

    return { bets: EMPTY_BETS, totalBets, loading: false, error };
}
