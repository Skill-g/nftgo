import {UserProfile} from "@/feature/user-profile";
import {Banner} from "@/shared/ui/banner";
import {LanguageSelection} from "@/feature/language-selection";
import {NftList} from "@/feature/grid";

export default function Page() {
    return (
        <div className={"flex flex-col gap-4"}>
            <UserProfile/>
            <Banner title={'Инвентарь'} img={'/profile/lock.svg'}/>
            <LanguageSelection/>
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Инвентарь</h2>
                <NftList isProfile={true} imgNft={'/profile/nft-2.svg'}/>
            </div>
        </div>
    )
}