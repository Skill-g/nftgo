"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { useEffect, useRef } from "react";

type BalanceResponse = number | string | { balance?: number | string };

function hasBalanceField(obj: unknown): obj is { balance?: number | string } {
    return typeof obj === "object" && obj !== null && "balance" in obj;
}

const fetcher = async ([url, initData]: [string, string]) => {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ initData }),
    });
    if (!res.ok) throw new Error("balance fetch failed");

    const data: BalanceResponse = await res.json();

    if (typeof data === "number") return data;
    if (typeof data === "string" && Number.isFinite(Number(data))) return Number(data);

    if (hasBalanceField(data)) {
        const v = data.balance;
        if (typeof v === "number") return v;
        if (typeof v === "string" && Number.isFinite(Number(v))) return Number(v);
    }

    return 0;
};


export function useBalance(initData: string | null | undefined) {
    const key = initData ? [`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/game/user/balance`, initData] as const : null;

    const lastVisibility = useRef<DocumentVisibilityState>(document.visibilityState);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        keepPreviousData: true,
        refreshInterval: (latestData?: number) => {
            if (document.visibilityState === "hidden") return 0;
            return typeof latestData === "number" ? 15000 : 20000;
        },
    });

    useEffect(() => {
        const onVis = () => {
            if (lastVisibility.current === "hidden" && document.visibilityState === "visible") {
                mutate();
            }
            lastVisibility.current = document.visibilityState;
        };
        window.addEventListener("visibilitychange", onVis);
        return () => window.removeEventListener("visibilitychange", onVis);
    }, [mutate]);

    useEffect(() => {
        const handler = () => mutate();
        window.addEventListener("balance:refresh", handler as EventListener);
        return () => window.removeEventListener("balance:refresh", handler as EventListener);
    }, [mutate]);

    const setOptimistic = (delta: number) => {
        if (!key) return;
        globalMutate(
            key,
            (current?: number) => (typeof current === "number" ? Math.max(0, current + delta) : current),
            { revalidate: false }
        );
    };

    const refresh = () => mutate();

    return {
        balance: typeof data === "number" ? data : 0,
        loading: isLoading,
        error: error ? String(error) : null,
        setOptimistic,
        refresh,
    };
}
