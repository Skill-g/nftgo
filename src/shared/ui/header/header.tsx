
'use client';
import { useLingui } from '@lingui/react';
import { Trans, t, msg } from '@lingui/macro';
import {Plus} from 'lucide-react'
import {Button} from "@/shared/ui/button"
import Image from "next/image"
import { useTonConnect } from "@/shared/context/TonConnectContext"
import {useMemo, useState} from "react"
import {Deposit} from "@/feature/deposit"
import {useUserContext} from "@/shared/context/UserContext"
import { useBalance } from "@/shared/hooks/useBalance"

export function Header (){
    const {
        i18n: i18n
    } = useLingui();

    const { isConnected, initialRestored, walletInfo, handleConnect } = useTonConnect()
    const { user } = useUserContext()
    const initData = useMemo(() => user?.initData ?? "", [user])
    const { balance, refresh } = useBalance(initData)
    const [showDepositModal, setShowDepositModal] = useState(false)
    const balanceText = useMemo(() => balance.toFixed(2), [balance])
    const formatAddress = (address: string) => (!address ? "" : `${address.slice(0,4)}...${address.slice(-4)}`)

    if (!initialRestored) {
        return (
            <div className={'mb-3'}>
                <div className="flex items-center justify-between px-3 py-3 gap-1">
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center ">
                        <div className="text-xs text-center">
                            <Image src={'/logo.svg'} width={62} height={48} alt={i18n._(msg`logo`)}/>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="border-2 border-[#533189] rounded-lg px-2 py-1 flex items-center gap-2">
                            <Image src={'/tonCoin.svg'} alt={i18n._(msg`ton Coin`)} width={18} height={18}/>
                            <span className="text-white text-lg font-semibold">{balanceText}</span>
                            <Button
                                onClick={() => setShowDepositModal(true)}
                                className="bg-[#21ee43] hover:bg-[#21ee43]/90 text-black w-5 h-5 p-0 mr-4"
                                style={{ borderRadius: '5px' }}
                            >
                                <Plus className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>
                    <div className="border-2 border-[#533189] rounded-lg px-1 py-0 flex items-center">
                        <Button disabled className="bg-[#150f27] text-white px-6 py-2 rounded-lg text-lg opacity-50"><Trans>Loading...</Trans></Button>
                    </div>
                </div>
                <div className={'bg-[#8845F533]/20 h-[2px] w-[100%] '}></div>
                <Deposit showDepositModal={showDepositModal} setShowDepositModal={(v) => { setShowDepositModal(v); if(!v) refresh(); }}/>
            </div>
        );
    }

    return (
        <div className={'mb-3'}>
            <div className="flex items-center justify-between px-3 py-3 gap-1">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center ">
                    <div className="text-xs text-center">
                        <Image src={'/logo.svg'} width={62} height={48} alt={i18n._(msg`logo`)}/>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="border-2 border-[#533189] rounded-lg px-2 py-1 flex items-center gap-2">
                        <Image src={'/tonCoin.svg'} alt={i18n._(msg`ton Coin`)} width={18} height={18}/>
                        <span className="text-white text-lg font-semibold">{balanceText}</span>
                        <Button
                            onClick={() => setShowDepositModal(true)}
                            className="bg-[#21ee43] hover:bg-[#21ee43]/90 text-black w-5 h-5 p-0 mr-4"
                            style={{ borderRadius: '5px' }}
                        >
                            <Plus className="w-4 h-4"/>
                        </Button>
                    </div>
                </div>

                <div className="border-2 border-[#533189] rounded-lg px-1 py-0 flex items-center min-h-[40px]">
                    {isConnected ? (
                        <div className="flex items-center gap-2">
              <span className="text-white text-sm px-2">
                {walletInfo?.account?.address && formatAddress(walletInfo.account.address)}
              </span>
                            <Button onClick={handleConnect} className="bg-red-600 hover:bg-red-700 text-white rounded-md text-xs h-[30px]"><Trans>Disconnect</Trans></Button>
                        </div>
                    ) : (
                        <Button onClick={handleConnect} className="bg-[#150f27] text-white px-6 py-2 rounded-lg text-lg"><Trans>Connect Wallet</Trans></Button>
                    )}
                </div>
            </div>
            <div className={'bg-[#8845F533]/20 h-[2px] w-[100%] '}></div>
            <Deposit showDepositModal={showDepositModal} setShowDepositModal={(v) => { setShowDepositModal(v); if(!v) refresh(); }}/>
        </div>
    );
}
