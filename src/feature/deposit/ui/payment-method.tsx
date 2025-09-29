
'use client';
import { useLingui } from '@lingui/react';
import { Trans, t, msg } from '@lingui/macro';
import Image from "next/image";

export function PaymentMethod({
                                  selectedPaymentMethod,
                                  setSelectedPaymentMethod
                              }: {
    selectedPaymentMethod: string | null;
    setSelectedPaymentMethod: (value: string) => void;
}) {
    const {
        i18n: i18n
    } = useLingui();

    return (
        <div className="gap-4 flex bg-[#262352] rounded-[12px] justify-center items-center h-[120px] px-2">
            <div
                onClick={() => setSelectedPaymentMethod("ton")}
                className={`w-[191px] h-[100px] flex justify-center p-4 rounded-xl border-2 transition-all ${selectedPaymentMethod === "ton" ? "border-[#1B1636] bg-[#1B1636]" : "border-[#0098ea] bg-[#0098ea]"}`}
            >
                <div className="flex flex-col text-white items-center text-center gap-1">
                    <Image src="/ton.svg" alt={i18n._(msg`tonCoin`)} width={45} height={45} />
                    <p><Trans>TON</Trans></p>
                </div>
            </div>
            <div />
            <div
                onClick={() => setSelectedPaymentMethod("cryptopay")}
                className={`w-[191px] h-[100px] flex justify-center p-4 rounded-xl border-2 transition-all ${selectedPaymentMethod === "cryptopay" ? "border-[#1B1636] bg-[#1B1636]" : "border-[#11b4ec] bg-[#11b4ec]"}`}
            >
                <div className="flex flex-col text-white items-center text-center gap-1">
                    <Image src="/deposit.svg" alt={i18n._(msg`deposit-2`)} width={45} height={45} />
                    <p><Trans>CryptoBot</Trans></p>
                </div>
            </div>
        </div>
    );
}
