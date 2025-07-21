"use client"

import {Button} from "@/shared/ui/button";
import {Input} from "@/shared/ui/input";
import {X} from "lucide-react";
import {useState} from "react";

export function CodeModal({showPromoModal, setShowPromoModal}: {showPromoModal: boolean, setShowPromoModal: (value: boolean) => void}) {


    const [promoCode, setPromoCode] = useState("")

    return (
        <div>
            {showPromoModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
                    <div className="bg-[#231c46] rounded-2xl p-6 w-full max-w-md relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-[#c2c2c2] hover:text-white"
                            onClick={() => setShowPromoModal(false)}
                        >
                            <X className="w-6 h-6" />
                        </Button>

                        <div className="text-center mb-8">
                            <h2 className="text-xl font-semibold text-white mb-6">Enter promotional code</h2>

                            <Input
                                placeholder="Enter promo-code..."
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                className="bg-transparent border-[#8845f5] border-2 text-white placeholder:text-[#969696] mb-6 h-12 rounded-lg"
                            />

                            <Button
                                className="w-full bg-gradient-to-r from-[#8845f5] to-[#984eed] hover:from-[#984eed] hover:to-[#8845f5] text-white h-12 rounded-lg font-semibold"
                                onClick={() => setShowPromoModal(false)}
                            >
                                Confirm
                            </Button>
                        </div>

                        <div className="flex items-center justify-center gap-2 mt-8">
                            <div className="text-lg font-bold text-[#c2c2c2]">NFT</div>
                            <div className="text-lg font-bold text-[#c2c2c2]">GO</div>
                            <div className="text-[#8845f5] text-lg">🚀</div>
                        </div>
                    </div>
                </div>
            )}
        </div>

    )
}