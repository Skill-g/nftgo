import { NextRequest, NextResponse } from "next/server";
import {getUserIdFromInitData} from "@/shared/lib/telegramInitData";
import {createDeposit} from "@/shared/lib/cryptopayStore";


type CreateReq = {
    initData: string;
    amount: number;
    expiresIn?: number;
    idempotencyKey?: string;
};

export async function POST(req: NextRequest) {
    const body = (await req.json()) as CreateReq;
    const initData = body?.initData || "";
    const amount = Number(body?.amount);
    const expiresIn = body?.expiresIn ? Number(body.expiresIn) : undefined;
    const userId = getUserIdFromInitData(initData);
    if (!userId || !Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    const token = process.env.CRYPTOPAY_API_TOKEN || "";
    if (!token) {
        return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
    }
    const payload: Record<string, unknown> = { asset: "TON", amount };
    if (expiresIn && Number.isFinite(expiresIn)) payload.expires_in = expiresIn;
    const r = await fetch("https://pay.crypt.bot/api/createInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Crypto-Pay-API-Token": token },
        body: JSON.stringify(payload),
        cache: "no-store",
    });
    if (!r.ok) {
        const t = await r.text();
        return NextResponse.json({ error: "cryptopay_failed", details: t }, { status: 502 });
    }
    const data = await r.json();
    const result = data?.result || {};
    const invoiceId = typeof result?.invoice_id === "number" ? result.invoice_id : null;
    const invoiceUrl = result?.pay_url || result?.invoice_url || null;
    const row = await createDeposit({ userId, amount, invoiceUrl, cryptopayInvoiceId: invoiceId });
    const url = typeof invoiceUrl === "string" ? invoiceUrl : "";
    return NextResponse.json({
        id: row.id,
        status: row.status,
        miniAppInvoiceUrl: url,
        botInvoiceUrl: url,
        webAppInvoiceUrl: url,
    });
}
