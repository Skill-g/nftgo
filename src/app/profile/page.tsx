'use client';
import { useLingui } from '@lingui/react';
import { Trans, msg } from '@lingui/macro';
import { UserProfile } from '@/feature/user-profile';
import { Banner } from '@/shared/ui/banner';
import { LanguageSelection } from '@/feature/language-selection';
import { BetHistory } from '@/feature/bet-history';
import { ConnectWallet } from '@/feature/connect-wallet';

export default function Page() {
    const { i18n } = useLingui();

    return (
        <div className="flex flex-col gap-4">
            <UserProfile />
            <ConnectWallet />

            <Banner title={i18n._(msg`Вывести подарок`)} img="/profile/lock.svg" />
            <LanguageSelection />
            <div>
                <h2 className="text-xl font-bold text-white mb-4">
                    <Trans>История игр</Trans>
                </h2>
                <BetHistory pageSize={20} includeOrphaned={false} />
            </div>
        </div>
    );
}
