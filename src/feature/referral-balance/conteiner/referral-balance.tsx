'use client';
import { useLingui } from '@lingui/react';
import { Trans, t, msg } from '@lingui/macro';
import Image from "next/image";
import { useUserContext } from "@/shared/context/UserContext";

export function ReferralBalance() {
    const {
        i18n: i18n
    } = useLingui();

    const { referralData, loading, error } = useUserContext();
    if (loading) return <div className="text-white"><Trans>Загрузка...</Trans></div>;
    if (error) return <div className="text-red-400"><Trans>Error:</Trans>{error.message}</div>;

    return (
        <div className="bg-[#262352] rounded-2xl p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[#929292] text-sm mb-1"><Trans>Referral balance</Trans></div>
                    <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2">
                            <Image src={'/ton.svg'} alt={i18n._(msg`ton Coin`)} width={18} height={18} />
                        </div>
                        <span className="text-white text-xl font-bold">
              {referralData?.referralBalance.toFixed(2) || "0.00"}
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
