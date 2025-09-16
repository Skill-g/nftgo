'use client';
'use client';
import { useLingui } from '@lingui/react';
import { t, msg } from '@lingui/macro';
import { Layout } from '@/feature/bottom-nav/ui/layout'
import { NavButton } from '@/feature/bottom-nav/ui/nav-button'

export function BottomNav() {
    const {
        i18n: i18n
    } = useLingui();

    return (
        <Layout>
            <div className="flex items-center justify-around py-2">
                <NavButton page="/gift" image="/bottomNav/market.svg" title={i18n._(msg`Market`)} />
                <NavButton
                    page="/top"
                    image="/bottomNav/top.svg"
                    leftIcon="/bottomNav/lock.svg"
                    comingSoon={i18n._(msg`Будет доступно позже`)}
                    title={i18n._(msg`Top`)}
                />
                <NavButton page="/" image="/bottomNav/rocket.svg" title={i18n._(msg`Rocket`)} />
                <NavButton page="/friends" image="/bottomNav/friends.svg" title={i18n._(msg`Friends`)} />
                <NavButton page="/profile" image="/bottomNav/profile.svg" title={i18n._(msg`Profile`)} />
            </div>
        </Layout>
    );
}