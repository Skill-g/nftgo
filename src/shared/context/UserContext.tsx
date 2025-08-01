"use client"
import { createContext, useContext, useState, useEffect } from "react";
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

        const fetchUserAndReferralData = async () => {
            try {
                const user = await authWithBackend(initData);
                setUser({ ...user, initData });

                const referralResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/referral/summary`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ initData }),
                });

                if (!referralResponse.ok) throw new Error("Failed to fetch referral summary");
                const referralData = await referralResponse.json();
                setReferralData(referralData);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndReferralData();
    }, []);

    if (loading) {
        return <div className="text-white text-center">Загрузка данных...</div>;
    }

    if (error) {
        return <div className="text-red-400 text-center">Ошибка: {error.message}</div>;
    }

    return (
        <UserContext.Provider value={{ user, referralData, loading, error }}>
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
