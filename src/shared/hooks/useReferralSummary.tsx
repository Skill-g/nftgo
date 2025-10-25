import { useEffect, useState } from "react";
import { useTelegramAuth } from "./useTelegramAuth";
import { referralSummaryCached } from "@/shared/lib/referralSummary";

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

                const data = await referralSummaryCached(user.initData);
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
