"use client";

import { useLingui } from "@lingui/react";
import { msg } from "@lingui/macro";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBetsNow as useBetsNowReal } from "@/shared/hooks/useBetsNow";
import { v4 as uuidv4 } from "uuid";
import { getBackendHost } from "@/shared/lib/host";

type QueueItem = { id: string; label: string; value: number; createdAt: number };
type HistoryRow = { roundId: number; crashMultiplier: number; endTime: string };

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}
function readMultiplier(v: unknown): number {
    if (isRecord(v)) {
        if (typeof v.multiplier === "number") return v.multiplier;
        if (typeof v.crashMultiplier === "number") return v.crashMultiplier;
        if (typeof v.multiplier === "string") return parseFloat(v.multiplier) || 1;
        if (typeof v.crashMultiplier === "string") return parseFloat(v.crashMultiplier) || 1;
    }
    return 1;
}
function readBetId(v: unknown): number | null {
    if (isRecord(v)) {
        if (typeof v.betId === "number") return v.betId;
        if (typeof v.roundId === "number") return v.roundId;
        if (typeof v.betId === "string") return parseInt(v.betId, 10) || null;
        if (typeof v.roundId === "string") return parseInt(v.roundId, 10) || null;
    }
    return null;
}
function formatX(v: number) {
    const s = v.toFixed(2);
    const trimmed = s.replace(/\.?0+$/, "");
    return `${trimmed}x`;
}
function gradientFor(value: number) {
    if (value > 5) return "linear-gradient(85deg, rgba(255, 204, 0, 0.80) -9.64%, rgba(132, 214, 255, 0.80) 72.06%)";
    if (value > 2) return "linear-gradient(85deg, rgba(0, 200, 255, 0.80) -9.64%, rgba(136, 132, 255, 0.80) 63.91%)";
    return "linear-gradient(85deg, rgba(97, 0, 255, 0.80) -9.64%, rgba(179, 132, 255, 0.80) 72.06%)";
}

type MultipliersProps = {
    roundId: number | null;
    initData: string;
    maxConcurrent?: number;
    queueLimit?: number;
    pollMs?: number;
    trigger?: number;
};

export function Multipliers({
                                roundId,
                                initData,
                                maxConcurrent: visibleCount = 8,
                                queueLimit: _queueLimit = 200,
                                pollMs = 1000,
                                trigger,
                            }: MultipliersProps) {
    const { i18n } = useLingui();
    const { bets: betsReal } = useBetsNowReal(roundId ?? undefined, initData);

    const host = getBackendHost();
    const base = `https://${host}/api/game/history`;

    const [visible, setVisible] = useState<QueueItem[]>([]);
    const [history, setHistory] = useState<HistoryRow[]>([]);

    const historySeen = useRef<Map<number, number>>(new Map());
    const betsSeen = useRef<Map<number, number>>(new Map());
    const fetching = useRef(false);
    const pollTimer = useRef<number | null>(null);
    const controllerRef = useRef(new AbortController());

    const load = useCallback(async () => {
        if (fetching.current) return;
        fetching.current = true;
        try {
            const res = await fetch(`${base}?_=${Date.now()}`, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
                signal: controllerRef.current.signal,
            });
            if (!res.ok) return;
            const data: HistoryRow[] = await res.json();
            if (!Array.isArray(data)) return;
            setHistory(data);
        } catch {} finally {
            fetching.current = false;
        }
    }, [base]);

    useEffect(() => {
        controllerRef.current = new AbortController();
        load();
        if (pollTimer.current) window.clearInterval(pollTimer.current);
        pollTimer.current = window.setInterval(load, Math.max(500, pollMs)) as unknown as number;
        const onVis = () => {
            if (!document.hidden) load();
        };
        const onFocus = () => load();
        document.addEventListener("visibilitychange", onVis);
        window.addEventListener("focus", onFocus);
        return () => {
            controllerRef.current.abort();
            if (pollTimer.current) window.clearInterval(pollTimer.current);
            pollTimer.current = null;
            document.removeEventListener("visibilitychange", onVis);
            window.removeEventListener("focus", onFocus);
        };
    }, [pollMs, load]);

    useEffect(() => {
        if (trigger) load();
    }, [trigger, load]);

    useEffect(() => {
        const now = Date.now();
        const newBatch: QueueItem[] = [];

        const betsArray = Array.isArray(betsReal) ? betsReal : [betsReal];
        for (const item of betsArray) {
            const bid = readBetId(item);
            if (bid === null) continue;
            const m = readMultiplier(item);
            const prev = betsSeen.current.get(bid);
            if (prev === undefined || prev !== m) {
                betsSeen.current.set(bid, m);
                newBatch.push({
                    id: `bet-${bid}-${uuidv4()}`,
                    label: formatX(m),
                    value: m,
                    createdAt: now,
                });
            }
        }

        const sortedHistory = [...history].sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
        for (const row of sortedHistory) {
            const prev = historySeen.current.get(row.roundId);
            if (prev === undefined || prev !== row.crashMultiplier) {
                historySeen.current.set(row.roundId, row.crashMultiplier);
                const ts = Date.parse(row.endTime);
                newBatch.push({
                    id: `history-${row.roundId}-${uuidv4()}`,
                    label: formatX(row.crashMultiplier),
                    value: row.crashMultiplier,
                    createdAt: Number.isFinite(ts) ? ts : now,
                });
            }
        }

        if (newBatch.length) {
            const orderedDesc = newBatch.sort((a, b) => b.createdAt - a.createdAt);
            setVisible((prev) => {
                const merged = [...orderedDesc, ...prev];
                const trimmed = merged.slice(0, visibleCount);
                return trimmed;
            });
        }
    }, [betsReal, history, visibleCount]);

    const pills = useMemo(() => visible, [visible]);

    return (
        <div
            className="relative h-[30px] w-full overflow-hidden gap-[6px] flex"
            aria-label={i18n._(msg`multipliers-stream`)}
        >
            {pills.map((item) => (
                <div
                    key={item.id}
                    className="inline-flex items-center px-3 py-1 rounded-md text-white text-sm font-semibold shadow-md whitespace-nowrap"
                    style={{ background: gradientFor(item.value) }}
                >
                    {item.label}
                </div>
            ))}
        </div>
    );
}
