import { useEffect, useState } from "react";
import { useTelegramAuth } from "./useTelegramAuth";

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

export function useReferralSummary() {
    const [referralData, setReferralData] = useState<ReferralSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { user, loading: authLoading, error: authError } = useTelegramAuth();

    useEffect(() => {
        if (!user || authLoading || authError) return;

        const fetchReferralSummary = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
                if (!backendUrl) {
                    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
                }

                const response = await fetch(`${backendUrl}/referral/summary`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ initData: user.initData }),
                });

                if (!response.ok) throw new Error("Failed to fetch referral summary");
                const data = await response.json();
                setReferralData(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchReferralSummary();
    }, [user, authLoading, authError]);

    return { referralData, loading, error };
}
