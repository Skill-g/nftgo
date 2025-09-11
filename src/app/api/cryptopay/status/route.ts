import { NextRequest, NextResponse } from "next/server";
import {getUserIdFromInitData} from "@/shared/lib/telegramInitData";
import {getDepositForUser} from "@/shared/lib/cryptopayStore";

type StatusReq = { initData: string; id: number };

export async function POST(req: NextRequest) {
    const body = (await req.json()) as StatusReq;
    const initData = body?.initData || "";
    const id = Number(body?.id);
    const userId = getUserIdFromInitData(initData);
    if (!userId || !Number.isFinite(id) || id <= 0) {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    const row = await getDepositForUser(id, userId);
    if (!row) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({
        id: row.id,
        status: row.status,
        paidAsset: row.paidAsset,
        paidAmount: row.paidAmount,
        creditedAt: row.creditedAt,
    });
}
