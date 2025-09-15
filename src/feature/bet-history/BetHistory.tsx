"use client";;
import { Trans, t } from '@lingui/macro';
import { useEffect, useMemo, useState, useCallback } from "react";
import { getBackendHost } from "@/shared/lib/host";
import { useUserContext } from "@/shared/context/UserContext";
type BetStatus = "pending" | "lost" | "cashed" | "cancelled" | "active" | string;

type BetItem = {
    betId: number;
    roundId: number | null;
    amount: number;
    status: BetStatus;
    createdAt: string;
    autoCashout?: number | null;
    cashedOutMultiplier?: number | null;
    winAmount?: number | null;
    isOrphaned?: boolean;
    roundExists?: boolean;
};

type BetsMeta = {
    hasNext: boolean;
    nextCursor: string | null;
    limit: number;
    order: "asc" | "desc";
    filters: {
        status: BetStatus | null;
        roundId: number | null;
        from: string | null;
        to: string | null;
        includeOrphaned: boolean;
        all: boolean;
    };
};

type BetsResponse = {
    items: BetItem[];
    meta: BetsMeta;
};

const formatDateTime = (iso: string) => {
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    } catch {
        return iso;
    }
};

const floorTo1Decimal = (n: number) => Math.floor(n * 10) / 10;

const StatusBadge = ({ label, kind }: { label: string; kind: "win" | "loss" | "pending" | "cancelled" }) => {
    const map: Record<string, string> = {
        win: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
        loss: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
        pending: "bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-500/30",
        cancelled: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30",
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[kind]}`}>{label}</span>;
};

export function BetHistory({
                               pageSize = 20,
                               includeOrphaned = false,
                           }: {
    pageSize?: number;
    includeOrphaned?: boolean;
}) {
    const { user } = useUserContext();
    const [items, setItems] = useState<BetItem[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasNext, setHasNext] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const backendUrl = useMemo(() => {
        const host = getBackendHost();
        if (!host) return null;
        return `https://${host}/api/game/user/bets/history`;
    }, []);

    const fetchPage = useCallback(
        async (cursor?: string | null) => {
            if (!backendUrl) {
                setError("NEXT_PUBLIC_BACKEND_URL не задан");
                setLoading(false);
                return;
            }
            if (!user?.initData) {
                setError("initData отсутствует. Откройте приложение в Telegram.");
                setLoading(false);
                return;
            }

            const body: Record<string, unknown> = {
                initData: user.initData,
            };

            if (pageSize) body.limit = pageSize;
            body.order = "desc";
            body.includeOrphaned = includeOrphaned;
            if (cursor) body.cursor = cursor;

            const res = await fetch(backendUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || "Не удалось получить историю ставок");
            }

            const json = (await res.json()) as BetsResponse;

            return json;
        },
        [backendUrl, user?.initData, pageSize, includeOrphaned]
    );

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchPage(null);
                if (!alive || !data) return;
                setItems(data.items);
                setHasNext(!!data.meta?.hasNext);
                setNextCursor(data.meta?.nextCursor ?? null);
            } catch (e: unknown) {
                if (!alive) return;
                if (e instanceof Error) {
                    setError(e.message);
                } else {
                    setError("Неизвестная ошибка");
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [fetchPage]);

    const loadMore = async () => {
        if (!hasNext || !nextCursor) return;
        setLoadingMore(true);
        setError(null);
        try {
            const data = await fetchPage(nextCursor);
            if (!data) return;
            setItems((prev) => [...prev, ...data.items]);
            setHasNext(!!data.meta?.hasNext);
            setNextCursor(data.meta?.nextCursor ?? null);
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("Неизвестная ошибка");
            }
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-2">
                <div className="h-12 w-full rounded bg-white/5 animate-pulse" />
                <div className="h-12 w-full rounded bg-white/5 animate-pulse" />
                <div className="h-12 w-full rounded bg-white/5 animate-pulse" />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-400 text-sm text-center"><Trans>Ошибка:</Trans>{error}</div>;
    }

    if (!items.length) {
        return <div className="text-slate-300 text-sm text-center"><Trans>Пока нет ставок.</Trans></div>;
    }

    return (
        <div className="flex flex-col gap-2">
            <ul className="divide-y divide-white/5 rounded-lg overflow-hidden ring-1 ring-white/10 bg-white/5">
                {items.map((bet) => {
                    const win = Number(bet.winAmount) > 0;
                    const rawMult = bet.cashedOutMultiplier ?? bet.autoCashout ?? null;
                    const multStr = win && rawMult ? `x${floorTo1Decimal(rawMult).toFixed(1)}` : "x-";
                    let badgeLabel = "";
                    let badgeKind: "win" | "loss" | "pending" | "cancelled" = "pending";
                    if (bet.status === "cancelled") {
                        badgeLabel = t`Отменено`;
                        badgeKind = "cancelled";
                    } else if (bet.status === "pending") {
                        badgeLabel = t`В процессе`;
                        badgeKind = "pending";
                    } else if (win || bet.status === "cashed") {
                        badgeLabel = t`Выиграл`;
                        badgeKind = "win";
                    } else {
                        badgeLabel = t`Проиграл`;
                        badgeKind = "loss";
                    }

                    return (
                        <li key={bet.betId} className="p-3 sm:p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-sm text-white/80">
                                    {multStr}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium truncate"><Trans>Раунд:</Trans>{bet.roundId ?? "—"}</span>
                                        <StatusBadge label={badgeLabel} kind={badgeKind} />
                                        {bet.isOrphaned ? (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30"><Trans>orphaned</Trans></span>
                                        ) : null}
                                    </div>
                                    <div className="text-xs text-white/60">{formatDateTime(bet.createdAt)}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-white"><Trans>Ставка:</Trans><span className="font-semibold">{bet.amount}</span>
                                </div>
                                <div className="text-xs text-white/70"><Trans>Выигрыш:</Trans>{" "}
                                    <span className={win ? "text-emerald-300 font-medium" : "text-rose-300 font-medium"}>
                    {Number(bet.winAmount ?? 0)}
                  </span>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
            {hasNext && (
                <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="mt-2 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/15 text-white ring-1 ring-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loadingMore ? t`Загрузка...` : t`Загрузить ещё`}
                </button>
            )}
        </div>
    );
}
