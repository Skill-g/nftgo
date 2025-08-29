"use client"
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authWithBackend } from "@/feature/auth/authWithBackend";

type TelegramUser = {
    id: number;
    firstName: string;
    username: string;
    photoUrl?: string;
    telegramId: string;
    languageCode: "ru" | "en";
    createdAt: string;
    initData: string;
};

type ReferralSummary = {
    totalReferrals: number;
    referralBalance: number;
    invited: Array<{
        userId: number;
        usernameMasked: string;
        profit: number;
        avatarUrl?: string;
    }>;
};

type UserContextType = {
    user: TelegramUser | null;
    referralData: ReferralSummary | null;
    loading: boolean;
    error: Error | null;
    setPreferredLanguage: (lang: "ru" | "en") => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [referralData, setReferralData] = useState<ReferralSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;
        const initData = tg?.initData || "";
        if (!initData) {
            setLoading(false);
            return;
        }

        const fetchUserAndReferralData = async () => {
            try {
                const authedUser = await authWithBackend(initData);
                setUser({ ...authedUser, initData });

                const referralResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/referral/summary`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ initData }),
                });

                if (!referralResponse.ok) throw new Error("Failed to fetch referral summary");
                const referralJson = await referralResponse.json();
                setReferralData(referralJson);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndReferralData();
    }, []);

    const setPreferredLanguage = useCallback(
        async (lang: "ru" | "en") => {
            if (!user?.initData) throw new Error("initData is missing");

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/language`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    initData: user.initData,
                    language: lang,
                }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || "Failed to update language");
            }

            setUser((prev) => (prev ? { ...prev, languageCode: lang } : prev));
        },
        [user?.initData]
    );

    if (loading) {
        return <div className="text-white text-center"></div>;
    }

    if (error) {
        return <div className="text-red-400 text-center">Ошибка: {error.message}</div>;
    }

    return (
        <UserContext.Provider value={{ user, referralData, loading, error, setPreferredLanguage }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUserContext must be used within a UserProvider");
    }
    return context;
};
