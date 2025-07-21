import {JSX} from "react";
import Image from "next/image";

export function RewardItem ({place}: {place: number}): JSX.Element {
    return (
        <div key={place} className=" bg-gradient-to-b from-[#6100FF80] to-[#B384FF80] rounded-xl p-2 text-center">
            <div className="flex bg-gradient-to-b  from-[#383838] to-[#585858] rounded-[50px] pl-2
             pr-1 pt-0.5 w-[40px] text-centeritems-center gap-1 mb-2">
                <div className="text-white text-sm mb-2">{place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"}</div>
            </div>

            <div className="relative mb-2">
                <div
                    className="w-full h-20 rounded-lg flex items-center justify-center relative overflow-hidden"
                >
                    {/* Potion bottle illustration */}
                    <Image alt={'nft'} src={'/nft-1.png'} width={88} height={95}/>
                </div>
            </div>
        </div>
    )
}