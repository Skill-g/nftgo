"use client"

import {Card, CardContent} from "@/shared/ui/card"
import {DepositHeader} from "@/feature/deposit/ui/deposit-header"
import {useState, useMemo} from "react"
import {PaymentMethod} from "@/feature/deposit/ui/payment-method"
import {DepositInput} from "@/feature/deposit/ui/deposit-input"
import {Button} from "@/shared/ui/button"
import {useTonConnect} from "@/shared/context/TonConnectContext"
import {useUserContext} from "@/shared/context/UserContext"

type TonConnectTxMessage = { address: string; amount: string; payload?: string }
type TonConnectTransaction = { validUntil: number; messages: TonConnectTxMessage[] }
type PaymentIntent = { tonConnectTx?: TonConnectTransaction; deeplink?: string }

export function Deposit({showDepositModal, setShowDepositModal}: {
    showDepositModal: boolean
    setShowDepositModal: (value: boolean) => void
}) {
    const { tonConnectUI, isConnected } = useTonConnect()
    const { user } = useUserContext()
    const initData = useMemo(() => user?.initData ?? "", [user])

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
    const [amount, setAmount] = useState<string>("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const numericAmount = useMemo(() => {
        const n = Number(amount)
        return Number.isFinite(n) ? n : NaN
    }, [amount])

    const validAmount = numericAmount >= 1
    const disabled = !isConnected || !validAmount || !selectedPaymentMethod || submitting

    const buttonText = isConnected ? "Deposit" : "Please connect your wallet"

    const handleDeposit = async () => {
        if (disabled) return
        setSubmitting(true)
        setError(null)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deposit/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ initData, amount: numericAmount })
            })
            if (!res.ok) {
                if (res.status === 429) throw new Error("Too many requests. Try again later.")
                const text = await res.text()
                throw new Error(text || `Request failed: ${res.status}`)
            }
            const intentUnknown: unknown = await res.json()
            const intent = intentUnknown as PaymentIntent

            if (intent.tonConnectTx && tonConnectUI) {
                await tonConnectUI.sendTransaction(intent.tonConnectTx)
                setShowDepositModal(false)
                return
            }

            if (intent.deeplink) {
                window.location.href = intent.deeplink
                return
            }

            throw new Error("Unsupported payment intent format")
        } catch (e: unknown) {
            if (e instanceof Error) setError(e.message)
            else setError("Unknown error")
        } finally {
            setSubmitting(false)
        }
    }

    if (!showDepositModal) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm absolute z-2 flex items-end justify-center" onClick={() => setShowDepositModal(false)}>
            <Card className="w-full max-w-md bg-[#241e44] border-[#262352] rounded-t-3xl" onClick={(e) => e.stopPropagation()}>
                <CardContent className="flex flex-col gap-3">
                    <DepositHeader setShowDepositModal={setShowDepositModal}/>
                    <PaymentMethod setSelectedPaymentMethod={setSelectedPaymentMethod} selectedPaymentMethod={selectedPaymentMethod}/>
                    <DepositInput value={amount} onChange={setAmount} />
                    {error ? <div className="text-red-400 text-sm">{error}</div> : null}
                    <Button
                        onClick={handleDeposit}
                        disabled={disabled}
                        className="w-full h-12 bg-gradient-to-r from-[#984eed] to-[#8845f5] hover:from-[#8845f5] hover:to-[#984eed] text-white font-semibold rounded-xl border-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Processing..." : buttonText}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
