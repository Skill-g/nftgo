"use client";
import { Trans } from '@lingui/macro';
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authWithBackend, AuthedUser } from "@/feature/auth/authWithBackend";
import { referralSummaryCached, ReferralSummary } from "@/shared/lib/referralSummary";

type TelegramUser = AuthedUser & { initData: string }

type UserContextType = {
    user: TelegramUser | null
    referralData: ReferralSummary | null
    loading: boolean
    error: Error | null
    setPreferredLanguage: (lang: "ru" | "en") => Promise<void>
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [referralData, setReferralData] = useState<ReferralSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        const initData = tg?.initData || "";
        if (!initData) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const authed = await authWithBackend(initData);
                setUser({ ...authed, initData });

                const summary = await referralSummaryCached(initData);
                setReferralData(summary);
            } catch (err: unknown) {
                setError(err instanceof Error ? err : new Error("Unknown error"));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const setPreferredLanguage = useCallback(
        async (lang: "ru" | "en") => {
            if (!user?.initData) throw new Error("initData is missing");

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/language`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData: user.initData, language: lang }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || "Failed to update language");
            }

            try {
                localStorage.setItem('locale', lang);
                void fetch('/api/locale', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lang }),
                    keepalive: true,
                });
            } catch {}

            setUser(prev => (prev ? { ...prev, languageCode: lang } : prev));
        },
        [user?.initData]
    );

    if (loading) return <div className="text-white text-center"></div>;
    if (error) return <div className="text-red-400 text-center"><Trans>Ошибка:</Trans>{error.message}</div>;

    return (
        <UserContext.Provider value={{ user, referralData, loading, error, setPreferredLanguage }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUserContext = () => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUserContext must be used within a UserProvider");
    return ctx;
};
