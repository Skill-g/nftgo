"use client";
import { useCallback, useState } from "react";
import { useUserContext } from "@/shared/context/UserContext";

export function useReferralLink() {
    const { getReferralLink } = useUserContext();
    const [referralLink, setReferralLink] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const generateReferralLink = useCallback(async () => {
        if (referralLink) return referralLink;
        try {
            setLoading(true);
            const link = await getReferralLink();
            setReferralLink(link);
            setError(null);
            return link;
        } catch (err) {
            setError(err as Error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [getReferralLink, referralLink]);

    return { referralLink, loading, error, generateReferralLink };
}
