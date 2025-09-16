
'use client';
import { useLingui } from '@lingui/react';
import { Trans, t, msg } from '@lingui/macro';
import { useUserContext } from "@/shared/context/UserContext";
import { useState } from "react";
import { CodeModal } from "@/feature/code-modal";
import { Button } from "@/shared/ui/button";
import { SquaresUnite } from "lucide-react";
import { Banner } from "@/shared/ui/banner";
import Image from "next/image";
import { ReferralBalance } from "@/feature/referral-balance";
import { FriendsList } from "@/feature/friends-list";

export default function Page() {
    const {
        i18n: i18n
    } = useLingui();

    const [showPromoModal, setShowPromoModal] = useState(false);
    const { user, loading, error } = useUserContext();

    const handleInvite = async () => {
        if (!user) return;
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;
            const response = await fetch(`${backendUrl}/referral/link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData: user.initData }),
            });
            if (!response.ok) throw new Error("Failed to generate referral link");
            const { shareUrl } = await response.json();

            const tg = window.Telegram?.WebApp;
            if (tg) {
                const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`;

                if (tg.openTelegramLink) {
                    tg.openTelegramLink(telegramShareUrl);
                } else if (tg.openLink) {
                    tg.openLink(telegramShareUrl);
                } else {
                    console.warn("Telegram WebApp openTelegramLink and openLink unavailable, falling back to window.open");
                    window.open(telegramShareUrl, "_blank");
                }
            } else {
                console.warn("Telegram WebApp API unavailable");
                await navigator.clipboard.writeText(shareUrl);
                alert("Referral link copied to clipboard!");
            }
        } catch (err) {
            console.error("Error generating or sharing referral link:", err);
            alert("Failed to generate referral link. Please try again.");
        }
    };

    const handleCopyLink = async () => {
        if (!user) return;

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (!backendUrl) {
                throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
            }

            const response = await fetch(`${backendUrl}/referral/link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData: user.initData }),
            });

            if (!response.ok) throw new Error("Failed to generate referral link");
            const data = await response.json();
            await navigator.clipboard.writeText(data.shareUrl);
            alert("Ссылка скопирована!");
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return <div className="text-white text-center"><Trans>Загрузка...</Trans></div>;
    }

    if (error) {
        return <div className="text-red-400 text-center"><Trans>Ошибка:</Trans>{error.message}</div>;
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="px-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-white text-xl font-bold mb-1"><Trans>Получи 10% от депозита</Trans><br /><Trans>вашего друга</Trans></h2>
                    </div>
                    <div className="w-16 h-16 opacity-60">
                        <Image src={"/friends/nftGoLogo.png"} alt={i18n._(msg`nft go logo`)} width={91} height={100} />
                    </div>
                </div>
            </div>
            <ReferralBalance />
            <div onClick={() => setShowPromoModal(true)} className="flex items-center justify-center">
                <Banner img={"/friends/ticket.png"} title={i18n._(msg`Активировать промокод`)} />
            </div>
            <FriendsList />
            <div className="flex mb-30 justify-between">
                <Button
                    className="w-[85%] bg-gradient-to-r from-[#6100FF] to-[#B384FF] hover:bg-[#533189] text-white rounded-[12px] py-2 h-[45px] text-lg font-semibold mb-4"
                    onClick={handleInvite}
                ><Trans>Пригласить друга</Trans></Button>

                <div className="flex justify-end">
                    <Button
                        className="bg-gradient-to-r from-[#6100FF] to-[#B384FF] hover:bg-[#533189] text-white rounded-[12px] p-4 w-[45px] h-[45px]"
                        onClick={handleCopyLink}
                    >
                        <SquaresUnite className="w-12 h-12" />
                    </Button>
                </div>
            </div>
            <CodeModal showPromoModal={showPromoModal} setShowPromoModal={setShowPromoModal} />
        </div>
    );
}