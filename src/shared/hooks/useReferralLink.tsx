"use client"
import { useState } from "react";
import { useTelegramAuth } from "./useTelegramAuth";

export function useReferralLink() {
    const [referralLink, setReferralLink] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { initData, loading: authLoading, error: authError } = useTelegramAuth();

    const generateReferralLink = async () => {
        if (authLoading) return null;
        if (authError) {
            setError(authError);
            return null;
        }

        try {
            setLoading(true);
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (!backendUrl) {
                throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
            }

            if (!initData) {
                throw new Error("Telegram WebApp is not initialized");
            }

            const response = await fetch(`${backendUrl}/referral/link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData }),
            });

            if (!response.ok) throw new Error("Failed to generate referral link");
            const data = await response.json();
            setReferralLink(data.shareUrl);
            return data.shareUrl;
        } catch (err) {
            setError(err as Error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { referralLink, loading, error, generateReferralLink };
}
