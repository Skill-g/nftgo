"use client"

import {Plus} from 'lucide-react'
import {Button} from "@/shared/ui/button";
import Image from "next/image";
import {useTonConnect} from "@/shared/hooks/useTonConnect";

export function Header (){
    const { isConnected, initialRestored, walletInfo, handleConnect } = useTonConnect();

    if (!initialRestored) {
        return (
            <div className={'mb-3'}>
                <div className="flex items-center justify-between px-3 py-3 gap-1">
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center ">
                        <div className="text-xs text-center">
                            <Image src={'/logo.svg'} width={62} height={48} alt="logo"/>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="border-2 border-[#533189] rounded-lg px-2 py-1 flex items-center gap-2">
                            <Image src={'/tonCoin.svg'} alt={"ton Coin"} width={18} height={18}/>
                            <span className="text-white text-lg font-semibold">0.00</span>
                            <Button className="bg-[#21ee43] hover:bg-[#21ee43]/90 text-black w-5 h-5 p-0 mr-4">
                                <Plus className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>

                    <div className="border-2 border-[#533189] rounded-lg px-1 py-0 flex items-center">
                        <Button
                            disabled
                            className="bg-[#150f27] text-white px-6 py-2 rounded-lg text-lg opacity-50">
                            Loading...
                        </Button>
                    </div>
                </div>
                <div className={'bg-[#8845F533]/20 h-[2px] w-[100%] '}></div>
            </div>
        );
    }

    const formatAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    return (
        <div className={'mb-3'}>
            <div className="flex items-center justify-between px-3 py-3 gap-1">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center ">
                    <div className="text-xs text-center">
                        <Image src={'/logo.svg'} width={62} height={48} alt="logo"/>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="border-2 border-[#533189] rounded-lg px-2 py-1 flex items-center gap-2">
                        <Image src={'/tonCoin.svg'} alt={"ton Coin"} width={18} height={18}/>
                        <span className="text-white text-lg font-semibold">0.00</span>
                        <Button className="bg-[#21ee43] hover:bg-[#21ee43]/90 text-black w-5 h-5 p-0 mr-4">
                            <Plus className="w-4 h-4"/>
                        </Button>
                    </div>
                </div>

                <div className="border-2 border-[#533189] rounded-lg px-1 py-0 flex items-center">
                    {isConnected ? (
                        <div className="flex items-center gap-2">
                            <span className="text-white text-sm px-2">
                                {walletInfo?.account?.address && formatAddress(walletInfo.account.address)}
                            </span>
                            <Button
                                onClick={handleConnect}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
                                Disconnect
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleConnect}
                            className="bg-[#150f27] text-white px-6 py-2 rounded-lg text-lg">
                            Connect Wallet
                        </Button>
                    )}


                </div>
            </div>
            <div className={'bg-[#8845F533]/20 h-[2px] w-[100%] '}></div>
        </div>
    )
}
