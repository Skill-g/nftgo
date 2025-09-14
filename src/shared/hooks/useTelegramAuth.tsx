"use client"
import { useEffect, useState } from "react";
import { authWithBackend, AuthedUser } from "@/feature/auth/authWithBackend";

type TelegramUser = AuthedUser & { initData: string }

export function useTelegramAuth() {
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [initData, setInitData] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        const id = tg?.initData || "";
        setInitData(id);

        if (!id) {
            setLoading(false);
            return;
        }

        authWithBackend(id)
            .then(u => setUser({ ...u, initData: id }))
            .catch(e => setError(e instanceof Error ? e : new Error("Unknown error")))
            .finally(() => setLoading(false));
    }, []);

    return { user, initData, loading, error };
}