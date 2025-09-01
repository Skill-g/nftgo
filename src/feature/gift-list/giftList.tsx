"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import useSWR from "swr";
import { GiftCard } from "./ui/gift-card";
import { Button } from "@/shared/ui/button";
import { buildQuery, fetcher, genIdempotencyKey } from "@/shared/lib/utils";
import { useBalance } from "@/shared/hooks/useBalance";
import { Toast } from "@/shared/ui/toast";

type Gift = {
    id: number;
    title: string;
    imageKey: string;
    price: number;
    currency: "TON" | string;
    isActive: boolean;
};

type GiftsResponse = {
    items: Gift[];
    total: number;
    offset: number;
    limit: number;
};

type PurchaseItem = {
    id: number;
    code: string;
    giftId: number;
    title: string;
    imageKey: string;
    acquiredAt: string;
};

type PurchaseResp = {
    orderId: number;
    status: string;
    amount: number;
    currency: string;
    quantity: number;
    items: PurchaseItem[];
};

type ToastType = {
    type: "success" | "error" | "bot_required";
    message: string;
    botUsername?: string;
    botMessage?: string;
};

type ApiErrorBase = { error: string; message?: unknown; [k: string]: unknown };

function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function str(v: unknown): string | null {
    return typeof v === "string" ? v : null;
}

function isUserNotRegistered(v: unknown): v is ApiErrorBase {
    return isObject(v) && v.error === "USER_NOT_REGISTERED_IN_MARKETPLACE";
}

function hasGiftRelayerMention(msg: unknown): boolean {
    const s = str(msg);
    if (!s) return false;
    return /@?giftrelayer/i.test(s);
}

function extractGiftRelayerDirective(v: unknown): { username: string; displayTag: string } | null {
    if (!isObject(v)) return null;

    if (hasGiftRelayerMention(v.message)) {
        return { username: "giftrelayer", displayTag: "@giftrelayer" };
    }

    const upstream = v.upstream;
    if (isObject(upstream) && hasGiftRelayerMention(upstream.message)) {
        return { username: "giftrelayer", displayTag: "@giftrelayer" };
    }

    for (const val of Object.values(v)) {
        if (typeof val === "string" && /(t\.me\/giftrelayer|@?giftrelayer)/i.test(val)) {
            return { username: "giftrelayer", displayTag: "@giftrelayer" };
        }
    }

    return null;
}


export function GiftsList({
                              initData,
                              search,
                              minPrice,
                              maxPrice,
                              activeOnly,
                              sort,
                          }: {
    initData: string;
    search: string;
    minPrice: number | null;
    maxPrice: number | null;
    activeOnly: boolean;
    sort: "newest";
}) {
    const [offset, setOffset] = useState(0);
    const limit = 20;

    const qs = useMemo(() => {
        const base: Record<string, string | number | boolean | undefined> = {
            initData,
            offset,
            limit,
            sort,
            activeOnly,
            search: search || undefined,
        };
        return buildQuery(base);
    }, [initData, offset, limit, sort, activeOnly, search]);

    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gifts?${qs}`;
    const { data, isLoading, mutate } = useSWR<GiftsResponse>(url, fetcher, {
        keepPreviousData: true,
    });

    const itemsServer = data?.items ?? [];
    const items = useMemo(() => {
        return itemsServer.filter((g: Gift) => {
            if (typeof minPrice === "number" && g.price < minPrice) return false;
            if (typeof maxPrice === "number" && g.price > maxPrice) return false;
            return true;
        });
    }, [itemsServer, minPrice, maxPrice]);

    const total = data?.total ?? 0;
    const hasMore = offset + limit < total;

    const { setOptimistic, refresh } = useBalance(initData);
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState<ToastType | null>(null);

    const giftById = useMemo(() => {
        const map = new Map<number, Gift>();
        for (const g of itemsServer) map.set(g.id, g);
        return map;
    }, [itemsServer]);

    const idempMapRef = useRef<Map<number, string>>(new Map());
    const getIdempotencyKey = (giftId: number) => {
        const ex = idempMapRef.current.get(giftId);
        if (ex) return ex;
        const fresh = genIdempotencyKey();
        idempMapRef.current.set(giftId, fresh);
        return fresh;
    };
    const clearIdempotencyKey = (giftId: number) => {
        idempMapRef.current.delete(giftId);
    };

    const purchase = useCallback(
        async (id: number) => {
            const gift = giftById.get(id);
            if (!gift || !initData || busy) return;

            setBusy(true);
            const idempotencyKey = getIdempotencyKey(gift.id);

            try {
                setOptimistic(-gift.price);

                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gifts/purchase`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({
                        initData,
                        giftId: gift.id,
                        idempotencyKey,
                    }),
                });

                const raw: unknown = await res.json().catch(() => null);

                if (!res.ok) {
                    if (isUserNotRegistered(raw)) {
                        setToast({
                            type: "bot_required",
                            message: "Требуется авторизация в боте",
                            botUsername: "Tonnel_Network_bot",
                            botMessage:
                                "Пожалуйста, авторизуйтесь в боте: @Tonnel_Network_bot, для последующей покупки подарка",
                        });
                        return;
                    }

                    const relayer = extractGiftRelayerDirective(raw);
                    if (relayer) {
                        setToast({
                            type: "bot_required",
                            message: "Требуется действие в боте",
                            botUsername: relayer.username,
                            botMessage: "Напишите Hi в бот @giftrelayer, чтобы вам можно было отправить подарок",
                        });
                        return;
                    }

                    clearIdempotencyKey(gift.id);
                    await refresh();
                    setToast({ type: "error", message: "Покупка не выполнена" });
                    return;
                }

                if (isUserNotRegistered(raw)) {
                    setToast({
                        type: "bot_required",
                        message: "Требуется авторизация в боте",
                        botUsername: "Tonnel_Network_bot",
                        botMessage:
                            "Пожалуйста, авторизуйтесь в боте: @Tonnel_Network_bot, для последующей покупки подарка",
                    });
                    return;
                }
                const relayer = extractGiftRelayerDirective(raw);
                if (relayer) {
                    setToast({
                        type: "bot_required",
                        message: "Требуется действие в боте",
                        botUsername: relayer.username,
                        botMessage: "Напишите Hi в бот @giftrelayer, чтобы вам можно было отправить подарок",
                    });
                    return;
                }

                const resp = raw as PurchaseResp;
                const delivered = String(resp?.status ?? "").toLowerCase() === "delivered";

                await refresh();
                await mutate();

                if (delivered) {
                    const title = resp.items?.[0]?.title ?? gift.title;
                    const amount = typeof resp.amount === "number" ? resp.amount : gift.price;
                    setToast({
                        type: "success",
                        message: `Успешная покупка: ${title} — ${amount.toFixed(3)} TON`,
                    });
                    clearIdempotencyKey(gift.id);
                } else {
                    setToast({ type: "error", message: "Покупка не выполнена" });
                    clearIdempotencyKey(gift.id);
                }
            } catch (error: unknown) {
                console.error("Purchase error:", error);
                await refresh();
                setToast({ type: "error", message: "Произошла ошибка при покупке" });
            } finally {
                setBusy(false);
            }
        },
        [giftById, initData, mutate, refresh, setOptimistic, busy]
    );

    return (
        <div className="px-4 pb-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((gift: Gift) => (
                    <GiftCard
                        key={gift.id}
                        title={gift.title}
                        price={gift.price}
                        imageUrl={gift.imageKey}
                        onClick={() => purchase(gift.id)}
                        disabled={busy || !gift.isActive}
                    />
                ))}
            </div>

            {isLoading && <div className="text-center py-8">Загрузка...</div>}
            {!isLoading && items.length === 0 && <div className="text-center py-8">Подарки не найдены</div>}

            {hasMore && (
                <div className="flex justify-center mt-8">
                    <Button
                        onClick={() => setOffset((prev) => prev + limit)}
                        disabled={isLoading}
                        className="px-8"
                    >
                        Загрузить еще
                    </Button>
                </div>
            )}

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    botUsername={toast.botUsername}
                    botMessage={toast.botMessage}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
