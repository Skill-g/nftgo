"use client"
import {UserProfile} from "@/feature/user-profile";
import {Banner} from "@/shared/ui/banner";
import {LanguageSelection} from "@/feature/language-selection";
import {BetHistory} from "@/feature/bet-history";

export default function Page() {
    return (
        <div className={"flex flex-col gap-4"}>
            <UserProfile/>
            <Banner title={'Инвентарь'} img={'/profile/lock.svg'}/>
            <LanguageSelection/>
            <div>
                <h2 className="text-xl font-bold text-white mb-4">История игр</h2>
                <BetHistory pageSize={20} includeOrphaned={false} />
            </div>
        </div>
    )
}