"use client";

import {useState, useCallback, useMemo, useRef, useEffect, JSX} from "react";
import useSWRInfinite from "swr/infinite";
import { GiftCard } from "./ui/gift-card";
import { buildQuery, fetcher, genIdempotencyKey } from "@/shared/lib/utils";
import { useBalance } from "@/shared/hooks/useBalance";
import { X } from "lucide-react";

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



function parseJsonSafe<T = unknown>(text: string): T | null {
    try {
        return text ? (JSON.parse(text) as T) : null;
    } catch {
        return null;
    }
}
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
function textHasGiftrelayer(t: string): boolean {
    return /(?:^|[\s"'(])@?giftrelayer(?:$|[\s"'():,.!?/])/i.test(t);
}
function textHasUserNotRegistered(t: string): boolean {
    return /USER_NOT_REGISTERED_IN_MARKETPLACE/i.test(t);
}
function isUserNotRegisteredErr(raw: unknown): boolean {
    if (typeof raw === "string") return textHasUserNotRegistered(raw);
    if (isRecord(raw)) {
        const err = typeof raw.error === "string" ? raw.error : undefined;
        const msg = typeof raw.message === "string" ? raw.message : undefined;
        return (
            err === "USER_NOT_REGISTERED_IN_MARKETPLACE" ||
            (typeof msg === "string" && textHasUserNotRegistered(msg))
        );
    }
    return false;
}
function hasGiftRelayerInUnknown(raw: unknown): boolean {
    if (typeof raw === "string") return textHasGiftrelayer(raw);
    if (isRecord(raw)) {
        const upstream = isRecord(raw.upstream) ? (raw.upstream as Record<string, unknown>) : undefined;
        const candidates: unknown[] = [raw.message, upstream?.message, ...Object.values(raw)];
        return candidates.some((v) => (typeof v === "string" ? textHasGiftrelayer(v) : false));
    }
    return false;
}
function linkifyTelegramMentions(text: string) {
    const parts: (string | JSX.Element)[] = [];
    const re = /@([A-Za-z0-9_]+)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
        const start = m.index;
        if (start > last) parts.push(text.slice(last, start));
        const username = m[1];
        parts.push(
            <a
                key={`tg-${start}`}
                href={`https://t.me/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#229ED9] hover:underline"
            >
                @{username}
            </a>
        );
        last = start + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

type StepsModalProps = {
    open: boolean;
    onClose: () => void;
    storageKey: string;
    steps: string[];
    confirmText?: string;
    onConfirm?: () => void;
    disablePersist?: boolean;
};
function StepsModal({
                        open,
                        onClose,
                        storageKey,
                        steps,
                        confirmText = "Я понял",
                        onConfirm,
                        disablePersist = false,
                    }: StepsModalProps) {
    useEffect(() => {
        if (!open) return;
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [open, onClose]);

    if (!open) return null;

    const acknowledge = () => {
        if (!disablePersist) {
            try {
                localStorage.setItem(storageKey, "1");
            } catch {}
        }
        onConfirm?.();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 w-[calc(100vw-2rem)] sm:w-[560px] rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h3 className="text-lg font-semibold text-black">Как купить подарок?</h3>
                    <button onClick={onClose} className="p-1 rounded hover:bg-black/5" aria-label="Закрыть">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 py-4">
                    <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
                        {steps.map((s, i) => (
                            <li key={i} className="text-gray-800">
                                {linkifyTelegramMentions(s)}
                            </li>
                        ))}
                    </ol>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <a
                            href="https://t.me/Tonnel_Network_bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Открыть @Tonnel_Network_bot"
                            className="block"
                        >
                            <button className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-white">@Tonnel_Network_bot</button>
                        </a>
                        <a
                            href="https://t.me/giftrelayer"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Открыть @giftrelayer"
                            className="block"
                        >
                            <button className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-white">@giftrelayer</button>
                        </a>
                    </div>
                </div>

                <div className="px-5 pb-5">
                    <button className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-white" onClick={acknowledge}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

const PURCHASE_STEPS_ACK_KEY = "gift_purchase_steps_ack_v1";

export function GiftsList({
                              initData,
                              search,
                              minPrice,
                              maxPrice,
                              activeOnly,
                              sort,
                              forceShowSteps,
                          }: {
    initData: string;
    search: string;
    minPrice: number | null;
    maxPrice: number | null;
    activeOnly: boolean;
    sort: "newest";
    forceShowSteps?: boolean;
}) {
    const [showSteps, setShowSteps] = useState(false);

    useEffect(() => {
        const urlFlag =
            typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("showSteps") === "1";

        if (forceShowSteps || urlFlag) {
            setShowSteps(true);
            return;
        }
        try {
            const ack = typeof window !== "undefined" ? localStorage.getItem(PURCHASE_STEPS_ACK_KEY) : "1";
            if (!ack) setShowSteps(true);
        } catch {}
    }, [forceShowSteps]);

    const limit = 20;

    const getKey = (pageIndex: number, previousPageData: GiftsResponse | null) => {
        if (previousPageData && previousPageData.items.length === 0) return null;
        const offset = pageIndex * limit;
        const base: Record<string, string | number | boolean | undefined> = {
            initData,
            offset,
            limit,
            sort,
            activeOnly,
            search: search || undefined,
        };
        const qs = buildQuery(base);
        return `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gifts?${qs}`;
    };

    const { data, isLoading, isValidating, setSize, mutate } = useSWRInfinite<GiftsResponse>(getKey, fetcher, {
        revalidateFirstPage: true,
        keepPreviousData: true,
    });

    const resetOnDeps = [initData, search, activeOnly, sort].join("|");
    useEffect(() => {
        setSize(1);
    }, [resetOnDeps, setSize]);

    const allServerItems: Gift[] = useMemo(() => {
        const pages = data ?? [];
        const seen = new Set<number>();
        const acc: Gift[] = [];
        for (const p of pages) {
            for (const g of p.items) {
                if (!seen.has(g.id)) {
                    seen.add(g.id);
                    acc.push(g);
                }
            }
        }
        return acc;
    }, [data]);

    const items = useMemo(() => {
        return allServerItems.filter((g) => {
            if (typeof minPrice === "number" && g.price < minPrice) return false;
            if (typeof maxPrice === "number" && g.price > maxPrice) return false;
            return true;
        });
    }, [allServerItems, minPrice, maxPrice]);

    const total = data?.[0]?.total ?? 0;
    const loadedCount = allServerItems.length;
    const hasMore = loadedCount < total;

    const { setOptimistic, refresh } = useBalance(initData);
    const [busy, setBusy] = useState(false);

    const giftById = useMemo(() => {
        const map = new Map<number, Gift>();
        for (const g of allServerItems) map.set(g.id, g);
        return map;
    }, [allServerItems]);

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

                const text = await res.text().catch(() => "");
                const raw: unknown = parseJsonSafe(text);

                if (!res.ok) {
                    if (isUserNotRegisteredErr(raw) || isUserNotRegisteredErr(text)) {
                        setShowSteps(true);
                        return;
                    }
                    if (hasGiftRelayerInUnknown(raw) || textHasGiftrelayer(text)) {
                        setShowSteps(true);
                        return;
                    }
                    clearIdempotencyKey(gift.id);
                    await refresh();
                    return;
                }

                if (isUserNotRegisteredErr(raw) || isUserNotRegisteredErr(text)) {
                    setShowSteps(true);
                    return;
                }
                if (hasGiftRelayerInUnknown(raw) || textHasGiftrelayer(text)) {
                    setShowSteps(true);
                    return;
                }

                await refresh();
                await mutate();
                clearIdempotencyKey(gift.id);
            } catch {
                await refresh();
            } finally {
                setBusy(false);
            }
        },
        [giftById, initData, mutate, refresh, setOptimistic, busy]
    );

    const purchaseSteps = useMemo(
        () => [
            "Авторизуйтесь в Telegram-боте @Tonnel_Network_bot (это нужно для покупок).",
            "Напишите @giftrelayer — откройте бот и отправьте «Hi», либо любое другое сообщение",
            "Убедитесь, что на балансе достаточно TON",
            "Выберите подарок и купите его",
        ],
        []
    );

    useEffect(() => {
        const onScroll = () => {
            const doc = document.documentElement;
            const atBottom = Math.ceil(window.innerHeight + window.scrollY) >= doc.scrollHeight;
            if (atBottom && hasMore && !isValidating) {
                setSize((s) => s + 1);
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, [hasMore, isValidating, setSize]);

    return (
        <div className="px-4 pb-24 mt-[20px]">
            <div className="grid grid-cols-3 gap-4">
                {items.map((gift) => (
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

            {isLoading && items.length === 0 && (
                <div className="text-center py-8">Загрузка...</div>
            )}
            {!isLoading && items.length === 0 && (
                <div className="text-center py-8">Подарки не найдены</div>
            )}

            {!hasMore && allServerItems.length > 0 && (
                <div className="flex items-center justify-center py-6">
                    <span className="opacity-60">Это все подарки ({allServerItems.length})</span>
                </div>
            )}

            <StepsModal
                open={showSteps}
                onClose={() => setShowSteps(false)}
                storageKey={PURCHASE_STEPS_ACK_KEY}
                steps={purchaseSteps}
                confirmText="Я понял"
                disablePersist={forceShowSteps === true}
            />
        </div>
    );
}
