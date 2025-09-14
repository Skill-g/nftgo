import { Trans, t } from '@lingui/macro';
import {Layout} from "@/feature/bottom-nav/ui/layout";
import {NavButton} from "@/feature/bottom-nav/ui/nav-button";

export function BottomNav () {
    return (
        <Layout>
            <div className="flex items-center justify-around py-2">
                <NavButton page={'/gift'} image={'/bottomNav/market.svg'} title={t`Market`} />
                <NavButton page={'/top'} image={'/bottomNav/top.svg'} title={t`Top`} />
                <NavButton page={'/rocket'} image={'/bottomNav/rocket.svg'} title={t`Rocket`} />
                <NavButton page={'/friends'} image={'/bottomNav/friends.svg'} title={t`Friends`} />
                <NavButton page={'/profile'} image={'/bottomNav/profile.svg'} title={t`Profile`} />
            </div>
        </Layout>
    );
}