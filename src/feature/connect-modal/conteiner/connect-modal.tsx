"use client"

import {Card} from "@/shared/ui/card";
import {ModalContent} from "@/feature/connect-modal/ui/modal-content";
import {useState} from "react";
import {ShortOption} from "@/feature/connect-modal/ui/short-option";
import Image from "next/image";
import {AllOption} from "@/feature/connect-modal/ui/all-option";
import {Button} from "@/shared/ui/button";

export function ConnectModal({showModal, setShowModal}: {showModal: boolean, setShowModal: (value: boolean) => void}) {

    const [allOptions, setAllOptions] = useState(true)

    const walletOptions = Array(20).fill("Tonkeeper")

    return (
        <div>
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
                    <Card
                        className="w-full max-w-md bg-gradient-to-b from-[#372d6b] to-[#262352] border-[#533189] rounded-t-3xl p-6 relative">
                        <ModalContent setShowModal={setShowModal}/>
                        {allOptions ? (
                            <div>
                                <Button className="w-full bg-gradient-to-r from-[#8845f5] to-[#533189] hover:from-[#9955ff] hover:to-[#6441a5] text-white font-medium py-4 rounded-2xl mb-8">
                                    Open Wallet in Telegram
                                </Button>
                                <ShortOption setAllOptions={setAllOptions}/>
                                <div className="flex items-center justify-center gap-2 pt-4">
                                    <Image src={'/profile/nftGoLogo.svg'} alt="NFT Go Logo" width={66} height={48}/>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-4 gap-x-14 p-4">
                                {walletOptions.map((wallet, index) => {
                                    return <AllOption key={index} wallet={wallet} />
                                })}
                            </div>
                        )}

                    </Card>
                </div>
            )}
        </div>

    )
}