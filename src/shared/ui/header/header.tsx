"use client"

import {Plus} from 'lucide-react'
import {Button} from "@/shared/ui/button";
import Image from "next/image";
import {ConnectModal} from "@/feature/connect-modal";
import {useState} from "react";


export function Header (){

    const [showModal, setShowModal] = useState(false)

    return (
        <div className={'mb-3'}>
            <div className="flex items-center justify-between px-3 py-3 gap-1">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center ">
                    <div className="text-xs text-center">
                        <Image src={'/logo.svg'} width={62} height={48} alt="logo"/>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div
                        className="border-2 border-[#533189] rounded-lg px-2 py-1 flex items-center gap-2">
                        <Image src={'/tonCoin.svg'} alt={"ton Coin"} width={18} height={18}/>
                        <span className="text-white text-lg font-semibold">0.00</span>
                        <Button className="bg-[#21ee43] hover:bg-[#21ee43]/90 text-black w-5 h-5 p-0 mr-4">
                            <Plus className="w-4 h-4"/>
                        </Button>
                    </div>

                </div>
                <div className="border-2 border-[#533189] rounded-lg px-1 py-0 flex items-center">
                    <Button
                        onClick={() => setShowModal(true)}
                        className="bg-[#150f27] text-white px-6 py-2 rounded-lg text-lg">
                        Connect Wallet
                    </Button>
                </div>
            </div>
            <div className={'bg-[#8845F533]/20 h-[2px] w-[100%] '}></div>
            <ConnectModal showModal={showModal} setShowModal={setShowModal} />
        </div>
    )
}