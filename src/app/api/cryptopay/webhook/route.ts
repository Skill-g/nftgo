import { NextRequest, NextResponse } from "next/server";
import {findByCryptoPayInvoiceId, updateDeposit} from "@/shared/lib/cryptopayStore";

export async function POST(req: NextRequest) {
    const token = process.env.CRYPTOPAY_API_TOKEN || "";
    const hdr = req.headers.get("crypto-pay-api-token") || req.headers.get("Crypto-Pay-API-Token") || "";
    if (!token || hdr !== token) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }
    const body = await req.json();
    const type = body?.update_type || body?.type || "";
    const payload = body?.payload || body?.update || body?.result || body || {};
    if (type === "invoice_paid" || payload?.invoice_paid) {
        const inv = payload?.invoice || payload;
        const invoiceId = Number(inv?.invoice_id);
        const asset = inv?.asset || inv?.paid_asset || null;
        const amount = Number(inv?.amount) || Number(inv?.paid_amount) || null;
        if (Number.isFinite(invoiceId)) {
            const row = await findByCryptoPayInvoiceId(invoiceId);
            if (row) {
                await updateDeposit(row.id, { status: "paid", paidAsset: asset, paidAmount: typeof amount === "number" ? amount : null });
            }
        }
    }
    if (type === "invoice_expired" || payload?.invoice_expired) {
        const inv = payload?.invoice || payload;
        const invoiceId = Number(inv?.invoice_id);
        if (Number.isFinite(invoiceId)) {
            const row = await findByCryptoPayInvoiceId(invoiceId);
            if (row) {
                await updateDeposit(row.id, { status: "expired" });
            }
        }
    }
    return NextResponse.json({ ok: true });
}
