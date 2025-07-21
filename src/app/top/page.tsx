import {MarathonTimer} from "@/feature/marathonTime";
import {InfoBanner} from "@/shared/ui/info-banner";
import {RewardSection} from "@/feature/reward-section";
import {Leaderboard} from "@/feature/leaderboard";

export default function Page() {
    return (
        <div className={'flex flex-col gap-2'}>
            <MarathonTimer/>
            <div className={'flex flex-col gap-1'}>
                <InfoBanner/>
                <RewardSection/>
            </div>
            <Leaderboard/>
        </div>
    )
}