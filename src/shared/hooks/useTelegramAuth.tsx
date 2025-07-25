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
};

export function useTelegramAuth() {
    const [user, setUser] = useState<TelegramUser | null>(null);
    console.log("вот:", user);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        console.log("window.Telegram:", window.Telegram);
        const initData = tg?.initData || '';
        console.log("tg:", tg);
        console.log("initData:", tg?.initData);
        if (!initData) {
            setLoading(false);
            return;
        }
        authWithBackend(initData)
            .then(setUser)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    return { user, loading, error };
}
