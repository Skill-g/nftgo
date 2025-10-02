"use client";

import { useLingui } from "@lingui/react";
import { msg } from "@lingui/macro";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {getBackendHost} from "@/shared/lib/host";

type QueueItem = { id: string; label: string; value: number; createdAt: number };
type HistoryRow = { roundId: number; crashMultiplier: number; endTime: string };

function formatX(v: number, frac = 2) {
    const n = Number.isFinite(v) ? v : 0;
    return `${n.toFixed(frac)}x`;
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
                                maxConcurrent: visibleCount = 8,
                                pollMs = 1000,
                                trigger
                            }: MultipliersProps) {
    const { i18n } = useLingui();
    const [visible, setVisible] = useState<QueueItem[]>([]);
    const [history, setHistory] = useState<HistoryRow[]>([]);
    const historySeen = useRef<Map<number, number>>(new Map());
    const fetching = useRef(false);
    const pollTimer = useRef<number | null>(null);
    const controllerRef = useRef(new AbortController());

    const load = useCallback(async () => {
        const host = getBackendHost()
        if (fetching.current) return;
        fetching.current = true;

        try {
            const res = await fetch(`https://${host}/api/game/history?_=${Date.now()}`, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
                signal: controllerRef.current.signal
            });
            if (!res.ok) return;
            const data: HistoryRow[] = await res.json();
            if (!Array.isArray(data)) return;
            setHistory(data);
        } catch {} finally {
            fetching.current = false;
        }
    }, []);

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
        if (trigger != null) load();
    }, [trigger, load]);

    useEffect(() => {
        const now = Date.now();
        const newBatch: QueueItem[] = [];
        const sortedHistory = [...history].sort(
            (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
        );
        for (const row of sortedHistory) {
            const prev = historySeen.current.get(row.roundId);
            if (prev === undefined || prev !== row.crashMultiplier) {
                historySeen.current.set(row.roundId, row.crashMultiplier);
                const ts = Date.parse(row.endTime);
                newBatch.push({
                    id: `history-${row.roundId}-${row.endTime}`,
                    label: formatX(row.crashMultiplier),
                    value: row.crashMultiplier,
                    createdAt: Number.isFinite(ts) ? ts : now
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
    }, [history, visibleCount]);

    const pills = useMemo(() => visible, [visible]);

    return (
        <div className="relative h-[30px] w-full overflow-hidden gap-[6px] flex" aria-label={i18n._(msg`multipliers-stream`)}>
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
