"use client"

import {Card, CardContent} from "@/shared/ui/card";
import {DepositHeader} from "@/feature/deposit/ui/deposit-header";
import {useState} from "react";
import {PaymentMethod} from "@/feature/deposit/ui/payment-method";
import {DepositInput} from "@/feature/deposit/ui/deposit-input";
import {Button} from "@/shared/ui/button";

export function Deposit({showDepositModal, setShowDepositModal}: {
    showDepositModal: boolean,
    setShowDepositModal: (value: boolean) => void
}) {

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)

    return (
        <div>
            {showDepositModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm absolute z-2 flex items-end justify-center">
                        <Card className="w-full max-w-md bg-[#241e44] border-[#262352] rounded-t-3xl">
                            <CardContent className=" flex flex-col gap-3">
                                <DepositHeader setShowDepositModal={setShowDepositModal}/>

                                <PaymentMethod setSelectedPaymentMethod={setSelectedPaymentMethod}
                                               selectedPaymentMethod={selectedPaymentMethod}/>

                                <DepositInput/>

                                <Button
                                    className="w-full h-12 bg-gradient-to-r from-[#984eed] to-[#8845f5] hover:from-[#8845f5] hover:to-[#984eed] text-white font-semibold rounded-xl border-none">
                                    Deposit
                                </Button>
                            </CardContent>
                        </Card>
                </div>
            )}
        </div>

    )
}