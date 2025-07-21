import {Layout} from "@/feature/bottom-nav/ui/layout";
import {NavButton} from "@/feature/bottom-nav/ui/nav-button";

export function BottomNav () {
    return (
        <Layout>
            <div className="flex items-center justify-around py-2">
                <NavButton page={'/'} image={'/bottomNav/market.svg'} title={"Market"} />
                <NavButton page={'/top'} image={'/bottomNav/top.svg'} title={"Top"} />
                <NavButton page={'/rocket'} image={'/bottomNav/rocket.svg'} title={"Rocket"} />
                <NavButton page={'/friends'} image={'/bottomNav/friends.svg'} title={"Friends"} />
                <NavButton page={'/profile'} image={'/bottomNav/profile.svg'} title={"Profile"} />
            </div>
        </Layout>
    )
}