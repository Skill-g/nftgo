"use client"

import Image from "next/image";
import {ReferralBalance} from "@/feature/referral-balance";
import {Banner} from "@/shared/ui/banner";
import {FriendsList} from "@/feature/friends-list";
import {Button} from "@/shared/ui/button";
import {SquaresUnite} from "lucide-react";
import {useState} from "react";
import {CodeModal} from "@/feature/code-modal";

export default function Page() {

    const [showPromoModal, setShowPromoModal] = useState(false)

    return (
        <div className={'flex flex-col gap-3'}>
            <div className="px-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-white text-xl font-bold mb-1">
                            Получи 10% от депозита
                            <br/>
                            вашего друга
                        </h2>
                    </div>
                    <div className="w-16 h-16 opacity-60">
                        <Image src={'/friends/nftGoLogo.png'} alt={'nft go logo'} width={91} height={100} />
                    </div>
                </div>
            </div>
            <ReferralBalance />
            <div onClick={() => {setShowPromoModal(true)}} className="flex items-center justify-center">
                <Banner img={'/friends/ticket.png'} title={'Активировать промокод'} />
            </div>

            <FriendsList/>
            <div className={"flex mb-30 justify-between"}>
                <Button className="w-[85%] bg-gradient-to-r from-[#6100FF] to-[#B384FF] hover:bg-[#533189] text-white rounded-[12px] py-2 h-[45px] text-lg font-semibold mb-4">
                    Пригласить друга
                </Button>

                <div className="flex justify-end">
                    <Button className="bg-gradient-to-r from-[#6100FF] to-[#B384FF] hover:bg-[#533189] text-white rounded-[12px] p-4 w-[45px] h-[45px]">
                        <SquaresUnite className="w-12 h-12" />
                    </Button>
                </div>
            </div>
            <CodeModal showPromoModal={showPromoModal} setShowPromoModal={setShowPromoModal}/>
        </div>
    )
}