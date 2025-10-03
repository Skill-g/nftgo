'use client';

import { useLingui } from '@lingui/react';
import { Trans, msg } from '@lingui/macro';
import { useUserContext } from "@/shared/context/UserContext";
import { useEffect, useState } from "react";
import { CodeModal } from "@/feature/code-modal";
import { Button } from "@/shared/ui/button";
import { SquaresUnite } from "lucide-react";
import { Banner } from "@/shared/ui/banner";
import Image from "next/image";
import { ReferralBalance } from "@/feature/referral-balance";
import { FriendsList } from "@/feature/friends-list";

type NavigatorWithShare = Navigator & {
    share?: (data: ShareData) => Promise<void>;
};

type CopyOkVia = 'clipboard' | 'execCommand';
type CopyResult =
    | { ok: true; via: CopyOkVia }
    | { ok: false; error: unknown };

function isiOSUserAgent(ua: string) {
    return /iP(hone|ad|od)/.test(ua);
}

async function copyTextRobust(text: string): Promise<CopyResult> {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return { ok: true, via: 'clipboard' };
        } catch {}
    }
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '-9999px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(ta);
        sel?.removeAllRanges();
        ta.select();
        sel?.addRange(range);
        const ok = document.execCommand('copy');
        sel?.removeAllRanges();
        document.body.removeChild(ta);
        if (!ok) throw new Error('execCommand failed');
        return { ok: true, via: 'execCommand' };
    } catch (e) {
        return { ok: false, error: e };
    }
}

export default function Page() {
    const { i18n } = useLingui();
    const [showPromoModal, setShowPromoModal] = useState(false);
    const { user, loading, error } = useUserContext();
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        setIsIOS(isiOSUserAgent(navigator.userAgent));
    }, []);

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

            const shareText = i18n._(msg`Присоединяйся по моей ссылке`);
            const tmeShare = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

            const webApp = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;

            if (webApp?.openTelegramLink) {
                webApp.openTelegramLink(tmeShare);
                return;
            }

            const nav = navigator as NavigatorWithShare;
            if (nav.share) {
                try {
                    await nav.share({ url: shareUrl, text: shareText, title: "Invite" });
                    return;
                } catch {}
            }

            window.open(tmeShare, "_blank");

            const r = await copyTextRobust(shareUrl);
            if (r.ok) {
                alert(i18n._(msg`Ссылка скопирована!`));
            }
        } catch {
            alert(i18n._(msg`Не удалось сгенерировать ссылку. Попробуйте ещё раз.`));
        }
    };

    const handleCopyLink = async () => {
        if (!user) return;
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            if (!backendUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
            const response = await fetch(`${backendUrl}/referral/link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData: user.initData }),
            });
            if (!response.ok) throw new Error("Failed to generate referral link");
            const { shareUrl } = await response.json();
            const r = await copyTextRobust(shareUrl);
            if (r.ok) {
                alert(i18n._(msg`Ссылка скопирована!`));
            } else {
                window.open(shareUrl, '_blank');
            }
        } catch {
            alert(i18n._(msg`Не удалось скопировать ссылку. Попробуйте ещё раз.`));
        }
    };

    if (loading) {
        return <div className="text-white text-center"><Trans>Загрузка...</Trans></div>;
    }

    if (error) {
        return <div className="text-red-400 text-center"><Trans>Ошибка:</Trans> {error.message}</div>;
    }

    const rowClass = isIOS ? "flex mb-30" : "flex mb-30 justify-between";

    return (
        <div className="flex flex-col gap-3">
            <div className="px-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-white text-xl font-bold mb-1">
                            <Trans>Получи 10% от депозита</Trans><br /><Trans>вашего друга</Trans>
                        </h2>
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
            <div className={rowClass}>
                <Button
                    type="button"
                    className={`${isIOS ? "w-full" : "w-[85%]"} bg-gradient-to-r from-[#6100FF] to-[#B384FF] hover:bg-[#533189] text-white rounded-[12px] py-2 h-[45px] text-lg font-semibold mb-4`}
                    onClick={handleInvite}
                    onTouchEnd={(e) => { e.preventDefault(); handleInvite(); }}
                    style={isIOS ? { width: "100%" } : undefined}
                >
                    <Trans>Пригласить друга</Trans>
                </Button>
                <div className="flex justify-end">
                    {!isIOS && (
                        <Button
                            type="button"
                            className="bg-gradient-to-r from-[#6100FF] to-[#B384FF] hover:bg-[#533189] text-white rounded-[12px] p-4 w-[45px] h-[45px]"
                            onClick={handleCopyLink}
                            onTouchEnd={(e) => { e.preventDefault(); handleCopyLink(); }}
                        >
                            <SquaresUnite className="w-12 h-12" />
                        </Button>
                    )}
                </div>
            </div>
            <CodeModal showPromoModal={showPromoModal} setShowPromoModal={setShowPromoModal} />
        </div>
    );
}