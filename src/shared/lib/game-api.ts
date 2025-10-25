"use client";

import { useCallback } from "react";
import { useUserContext } from "@/shared/context/UserContext";
import { getBackendHost } from "@/shared/lib/host";
import type { CurrentRound } from "@/shared/types/current-round";

export function useGameApi() {
    const { user } = useUserContext();
    const initData = user?.initData ?? "";
    const host = getBackendHost();

    const fetchCurrentRound = useCallback(async (): Promise<CurrentRound> => {
        const url = `https://${host}/api/game/current`;
        const headers: Record<string, string> = {};
        if (initData) headers["x-telegram-init-data"] = initData;
        const res = await fetch(url, { cache: "no-store", headers });
        if (!res.ok) throw new Error(`fetchCurrentRound failed ${res.status}`);
        return res.json() as Promise<CurrentRound>;
    }, [host, initData]);

    return { fetchCurrentRound };
}
