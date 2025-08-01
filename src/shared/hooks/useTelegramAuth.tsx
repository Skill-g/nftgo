"use client"
import { useEffect, useState } from "react";
import { authWithBackend } from "@/feature/auth/authWithBackend";

type TelegramUser = {
    id: number;
    firstName: string;
    username: string;
    photoUrl?: string;
    telegramId: string;
    languageCode: string;
    createdAt: string;
    initData: string;
};

export function useTelegramAuth() {
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [initData, setInitData] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        const initData = tg?.initData || "";
        setInitData(initData);

        if (!initData) {
            setLoading(false);
            return;
        }

        authWithBackend(initData)
            .then(setUser)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    return { user, initData, loading, error };
}
