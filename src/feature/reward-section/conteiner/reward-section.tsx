import {RewardInfo} from "@/feature/reward-section/ui/reward-info";
import {RewardItem} from "@/feature/reward-section/ui/reward-item";

export function RewardSection () {
    return (
        <>
            <RewardInfo/>
            <div className={'grid grid-cols-3 gap-3 mb-4'}>
                {[1,2,3].map((place) => {
                    return <RewardItem place={place} key={place} />
                })}
            </div>

        </>
    )
}