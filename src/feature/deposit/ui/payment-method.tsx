"use client"

import Image from "next/image"

export function PaymentMethod({
                                  selectedPaymentMethod,
                                  setSelectedPaymentMethod
                              }: {
    selectedPaymentMethod: string | null
    setSelectedPaymentMethod: (value: string) => void
}) {
    return (
        <div className="gap-4 flex bg-[#262352] rounded-[12px] justify-center items-center h-[120px] px-2">
            <div
                onClick={() => setSelectedPaymentMethod("ton")}
                className={`w-[191px] h-[100px] flex justify-center p-4 rounded-xl border-2 transition-all ${
                    selectedPaymentMethod === "ton" ? "border-[#1B1636] bg-[#1B1636]" : "border-[#262352] bg-[#262352]"
                }`}
            >
                <Image src={'/tonCoin.svg'} alt={'tonCoin'} width={45} height={45}/>
            </div>
            <div />
            <div
                onClick={() => setSelectedPaymentMethod("method2")}
                className={`w-[191px] h-[100px] flex justify-center p-4 rounded-xl border-2 transition-all ${
                    selectedPaymentMethod === "method2" ? "border-[#1B1636] bg-[#1B1636]" : "border-[#262352] bg-[#262352]"
                }`}
            >
                <Image src={'/deposit.svg'} alt={'deposit-2'} width={45} height={45}/>
            </div>
        </div>
    )
}
