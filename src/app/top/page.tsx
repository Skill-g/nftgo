'use client';
import { useLingui } from '@lingui/react';
import { MarathonTimer } from "@/feature/marathonTime";
import { InfoBanner } from "@/shared/ui/info-banner";
import { RewardSection } from "@/feature/reward-section";
import { Leaderboard } from "@/feature/leaderboard";
import { t, msg } from "@lingui/macro";

export default function Page() {
    const {
        i18n: i18n
    } = useLingui();

    const comingSoon = 1;

    if (comingSoon === 1) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-white text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-center">
                    {i18n._(msg`Будет доступно позже`)}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <MarathonTimer />
            <div className="flex flex-col gap-1">
                <InfoBanner />
                <RewardSection />
            </div>
            <Leaderboard />
        </div>
    );
}
