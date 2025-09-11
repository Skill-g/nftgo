"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { DepositHeader } from "@/feature/deposit/ui/deposit-header";
import { useMemo, useState, useEffect } from "react";
import { PaymentMethod } from "@/feature/deposit/ui/payment-method";
import { DepositInput } from "@/feature/deposit/ui/deposit-input";
import { Button } from "@/shared/ui/button";
import { useTonConnect } from "@/shared/context/TonConnectContext";
import { useUserContext } from "@/shared/context/UserContext";

type TonConnectTxMessage = { address: string; amount: string; payload?: string };
type TonConnectTransaction = { validUntil: number; messages: TonConnectTxMessage[] };

type DepositCreateResponseCryptoPay = {
    id: number;
    status: string;
    miniAppInvoiceUrl: string;
    botInvoiceUrl: string;
    webAppInvoiceUrl: string;
};

type DepositStatusResponse = {
    id: number;
    status: "active" | "paid" | "credited" | "expired";
    paidAsset: string | null;
    paidAmount: number | null;
    creditedAt: string | null;
};

type DepositCreateResponseTon = {
    orderId: string;
    depositAddress: string;
    amount: number;
    expiry: string;
    payment: {
        network: string;
        validUntil: number;
        messages: Array<{
            address: string;
            amountNano: string;
            text?: string;
            payloadB64?: string;
        }>;
    };
};

export function Deposit({ showDepositModal, setShowDepositModal }: { showDepositModal: boolean; setShowDepositModal: (value: boolean) => void }) {
    const { tonConnectUI, isConnected } = useTonConnect();
    const { user } = useUserContext();
    const initData = useMemo(() => user?.initData ?? "", [user]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [amount, setAmount] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastDepositId, setLastDepositId] = useState<number | null>(null);
    const numericAmount = useMemo(() => {
        const n = Number(amount);
        return Number.isFinite(n) ? n : NaN;
    }, [amount]);
    const validAmount = numericAmount >= 0.1;
    const disabled = !validAmount || !selectedPaymentMethod || submitting;
    const buttonText = selectedPaymentMethod === "cryptopay" ? "Pay via CryptoBot" : isConnected ? "Deposit" : "Please connect your wallet";

    const toTonConnectTx = (resp: DepositCreateResponseTon): TonConnectTransaction => {
        return {
            validUntil: resp.payment.validUntil,
            messages: resp.payment.messages.map((m) => ({
                address: m.address,
                amount: m.amountNano,
                ...(m.payloadB64 ? { payload: m.payloadB64 } : {}),
            })),
        };
    };

    const fallbackDeeplink = (resp: DepositCreateResponseTon): string | null => {
        const m = resp.payment.messages[0];
        if (!m) return null;
        const params = new URLSearchParams();
        params.set("amount", m.amountNano);
        if (m.text) params.set("text", m.text);
        return `ton://transfer/${m.address}?${params.toString()}`;
    };

    useEffect(() => {
        if (!lastDepositId) return;
        let stop = false;
        const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
        const url = `${base}/api/cryptopay/deposits/status`;
        const tick = async () => {
            if (stop) return;
            try {
                const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ initData, id: lastDepositId }) });
                if (r.ok) {
                    const s = (await r.json()) as DepositStatusResponse;
                    if (s.status === "paid" || s.status === "credited") {
                        setShowDepositModal(false);
                        setLastDepositId(null);
                        return;
                    }
                    if (s.status === "expired") {
                        setError("Invoice expired");
                        setLastDepositId(null);
                        return;
                    }
                }
            } catch {}
            setTimeout(tick, 2500);
        };
        tick();
        return () => {
            stop = true;
        };
    }, [lastDepositId, initData, setShowDepositModal]);

    const handleDeposit = async () => {
        if (disabled) return;
        setSubmitting(true);
        setError(null);
        try {
            if (selectedPaymentMethod === "cryptopay") {
                const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
                const r = await fetch(`${base}/api/cryptopay/deposits`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ initData, amount: numericAmount, expiresIn: 900, idempotencyKey: `user-${Date.now()}` }),
                });
                if (!r.ok) {
                    const t = await r.text();
                    throw new Error(t || "Create invoice failed");
                }
                const data = (await r.json()) as DepositCreateResponseCryptoPay;
                const link = data.miniAppInvoiceUrl || data.webAppInvoiceUrl || data.botInvoiceUrl;
                if (link) {
                    setLastDepositId(data.id);
                    const w = window.open(link, "_blank");
                    if (!w) window.location.href = link;
                    return;
                }
                throw new Error("No invoice link");
            } else {
                if (!isConnected || !tonConnectUI) throw new Error("Connect wallet");
                const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deposit/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ initData, amount: numericAmount }),
                });
                if (!r.ok) {
                    if (r.status === 429) throw new Error("Too many requests. Try again later.");
                    const t = await r.text();
                    throw new Error(t || `Request failed: ${r.status}`);
                }
                const data = (await r.json()) as DepositCreateResponseTon;
                if (data?.payment?.messages?.length && tonConnectUI) {
                    const tx = toTonConnectTx(data);
                    await tonConnectUI.sendTransaction(tx);
                    setShowDepositModal(false);
                    return;
                }
                const link = fallbackDeeplink(data);
                if (link) {
                    window.location.href = link;
                    return;
                }
                throw new Error("Unsupported payment intent format");
            }
        } catch (e: unknown) {
            if (e instanceof Error) setError(e.message);
            else setError("Unknown error");
        } finally {
            setSubmitting(false);
        }
    };

    if (!showDepositModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm absolute z-2 flex items-end justify-center" onClick={() => setShowDepositModal(false)}>
            <Card className="w-full max-w-md bg-[#241e44] border-[#262352] rounded-t-3xl" onClick={(e) => e.stopPropagation()}>
                <CardContent className="flex flex-col gap-3">
                    <DepositHeader setShowDepositModal={setShowDepositModal} />
                    <PaymentMethod setSelectedPaymentMethod={setSelectedPaymentMethod} selectedPaymentMethod={selectedPaymentMethod} />
                    <DepositInput value={amount} onChange={setAmount} />
                    {error ? <div className="text-red-400 text-sm">{error}</div> : null}
                    <Button onClick={handleDeposit} disabled={disabled} className="w-full h-12 bg-gradient-to-r from-[#984eed] to-[#8845f5] hover:from-[#8845f5] hover:to-[#984eed] text-white font-semibold rounded-xl border-none disabled:opacity-50 disabled:cursor-not-allowed">
                        {submitting ? "Processing..." : buttonText}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
