"use client";
import { Trans, t } from '@lingui/macro';
import {UserProfile} from "@/feature/user-profile";
import {Banner} from "@/shared/ui/banner";
import {LanguageSelection} from "@/feature/language-selection";
import {BetHistory} from "@/feature/bet-history";

export default function Page() {
    return (
        <div className={"flex flex-col gap-4"}>
            <UserProfile/>
            <Banner title={t`Инвентарь`} img={'/profile/lock.svg'}/>
            <LanguageSelection/>
            <div>
                <h2 className="text-xl font-bold text-white mb-4"><Trans>История игр</Trans></h2>
                <BetHistory pageSize={20} includeOrphaned={false} />
            </div>
        </div>
    );
}