"use client";

import useSWR from "swr";
import {useMemo, useState, useCallback, useEffect, useRef} from "react";
import {Button} from "@/shared/ui/button";
import {useBalance} from "@/shared/hooks/useBalance";
import {GiftCard} from "./ui/gift-card";

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
    meta?: { stale?: boolean; cacheAt?: string };
};

type PurchaseResp = {
    orderId: number;
    status: string;
    amount: number;
    currency: string;
    quantity: number;
    items: { id: number; code: string; giftId: number; title: string; imageKey: string; acquiredAt: string }[];
};

const genIdempotencyKey = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `idemp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const buildQuery = (p: Record<string, string | number | boolean | undefined>) =>
    Object.entries(p)
        .filter(([, v]) => v !== undefined && v !== "" && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");

const fetcher = async (url: string) => {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Failed to load gifts");
    const json = (await res.json()) as GiftsResponse;
    return json;
};

const normalizeCdnUrl = (u: string) => {
    if (!u) return u;
    try {
        const once = u.includes("%25") ? decodeURIComponent(u) : u;
        return once.replace(/ /g, "%20");
    } catch {
        return u;
    }
};

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
    const { data, error, isLoading, mutate } = useSWR(url, fetcher, { keepPreviousData: true });

    const itemsServer = data?.items ?? [];
    const items = useMemo(() => {
        return itemsServer.filter((g) => {
            if (typeof minPrice === "number" && g.price < minPrice) return false;
            if (typeof maxPrice === "number" && g.price > maxPrice) return false;
            return true;
        });
    }, [itemsServer, minPrice, maxPrice]);

    const total = data?.total ?? 0;
    const hasMore = offset + limit < total;

    const { setOptimistic, refresh } = useBalance(initData);

    const [confirmId, setConfirmId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        if (!toast) return;
        const id = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(id);
    }, [toast]);

    const giftById = useMemo(() => {
        const map = new Map<number, Gift>();
        for (const g of itemsServer) map.set(g.id, g);
        return map;
    }, [itemsServer]);

    const openConfirm = (id: number) => setConfirmId(id);
    const closeConfirm = () => setConfirmId(null);

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

                if (!res.ok) {
                    clearIdempotencyKey(gift.id);
                    await refresh();
                    setToast({ type: "error", message: "Покупка не выполнена" });
                    return;
                }

                const resp = (await res.json()) as PurchaseResp;
                const delivered = String(resp?.status ?? "").toLowerCase() === "delivered";

                await refresh();
                await mutate();

                if (delivered) {
                    const title = resp.items?.[0]?.title ?? gift.title;
                    const amount = typeof resp.amount === "number" ? resp.amount : gift.price;
                    setToast({ type: "success", message: `Успешная покупка: ${title} — ${amount.toFixed(3)} TON` });
                    clearIdempotencyKey(gift.id);
                } else {
                    setToast({ type: "error", message: "Покупка не выполнена" });
                    clearIdempotencyKey(gift.id);
                }
            } catch {

                await refresh();
                setToast({ type: "error", message: "Покупка не выполнена" });
            } finally {
                setBusy(false);
                closeConfirm();
            }
        },
        [giftById, initData, mutate, refresh, setOptimistic, busy]
    );

    return (
        <div className="px-4 pb-24">
            {isLoading && !data ? (
                <div className="grid grid-cols-3 gap-3 mt-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-40 bg-white/5 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="text-center text-red-400 mt-6">Не удалось загрузить подарки</div>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        {items.map((g) => (
                            <GiftCard
                                key={g.id}
                                title={g.title}
                                price={g.price}
                                imageUrl={normalizeCdnUrl(g.imageKey)}
                                disabled={!g.isActive || busy}
                                onClick={() => openConfirm(g.id)}
                            />
                        ))}
                    </div>

                    {hasMore && (
                        <div className="flex justify-center">
                            <Button
                                onClick={() => setOffset((o) => o + limit)}
                                className="mt-4 bg-white/10 hover:bg-white/15 text-white"
                            >
                                Загрузить ещё
                            </Button>
                        </div>
                    )}
                </>
            )}

            {confirmId !== null && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                    onClick={closeConfirm}
                >
                    <div
                        className="w-full max-w-sm bg-[#241e44] rounded-2xl border border-[#2b2550] p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center text-white text-lg font-semibold mb-2">Подтверждение</div>
                        <div className="text-center text-white/80 mb-5">
                            Вы уверены что хотите приобрести этот товар?
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={closeConfirm}
                                className="flex-1 h-11 bg-[#3b2d66] hover:bg-[#45307a] text-white rounded-lg"
                                disabled={busy}
                            >
                                Нет
                            </Button>
                            <Button
                                onClick={() => purchase(confirmId)}
                                className="flex-1 h-11 bg-gradient-to-r from-[#18CD00] to-[#067200] text-white rounded-lg"
                                disabled={busy}
                            >
                                Да
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-50">
                    <div
                        className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
                            toast.type === "success"
                                ? "bg-emerald-600/90 text-white ring-1 ring-emerald-400/40"
                                : "bg-rose-600/90 text-white ring-1 ring-rose-400/40"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span>{toast.message}</span>
                            <button
                                className="ml-2 text-white/80 hover:text-white"
                                onClick={() => setToast(null)}
                                aria-label="Закрыть уведомление"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
