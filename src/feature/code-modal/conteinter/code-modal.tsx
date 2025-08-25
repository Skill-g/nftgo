"use client"

import {Button} from "@/shared/ui/button"
import {Input} from "@/shared/ui/input"
import {X} from "lucide-react"
import {useMemo, useState} from "react"
import Image from "next/image"
import {useUserContext} from "@/shared/context/UserContext"

export function CodeModal({showPromoModal, setShowPromoModal}: {showPromoModal: boolean, setShowPromoModal: (value: boolean) => void}) {
    const { user } = useUserContext()
    const initData = useMemo(() => user?.initData ?? "", [user])

    const [promoCode, setPromoCode] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [invalid, setInvalid] = useState(false)

    const buttonText = submitting ? "Processing..." : invalid ? "Код неверный" : "Confirm"
    const buttonClass = invalid
        ? "w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-lg font-semibold"
        : "w-full bg-gradient-to-r from-[#8845f5] to-[#984eed] hover:from-[#984eed] hover:to-[#8845f5] text-white h-12 rounded-lg font-semibold"

    const redeem = async () => {
        if (submitting) return
        setSubmitting(true)
        setInvalid(false)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/promo/redeem`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ initData, code: promoCode })
            })
            if (!res.ok) {
                setInvalid(true)
                return
            }
            setInvalid(false)
            setShowPromoModal(false)
        } catch (e: unknown) {
            setInvalid(true)
        } finally {
            setSubmitting(false)
        }
    }

    if (!showPromoModal) return null

    return (
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
                        onKeyDown={(e) => { if (e.key === "Enter") redeem() }}
                        className="bg-transparent border-[#8845f5] border-2 text-white placeholder:text-[#969696] mb-6 h-12 rounded-lg"
                    />
                    <Button
                        className={`${buttonClass} ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={submitting}
                        onClick={redeem}
                    >
                        {buttonText}
                    </Button>
                </div>

                <div className="flex items-center justify-center gap-2 mt-8">
                    <Image src="/promo.png" width={66} height={48} alt="promo" />
                </div>
            </div>
        </div>
    )
}
