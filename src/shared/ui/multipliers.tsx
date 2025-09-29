"use client";

import { useLingui } from "@lingui/react";
import { msg } from "@lingui/macro";
import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { useBetsNow as useBetsNowReal } from "@/shared/hooks/useBetsNow";
import { v4 as uuidv4 } from "uuid";
import { getBackendHost } from "@/shared/lib/host";

type AnimeEasing = "linear" | "easeOutQuad" | string;
type AnimeParams = {
    targets: Element | Element[] | NodeList | string;
    translateX?: number | [number, number];
    translateY?: number | [number, number] | string;
    opacity?: number | Array<{ value: number; duration?: number; easing?: AnimeEasing }>;
    duration?: number;
    easing?: AnimeEasing;
    complete?: () => void;
    delay?: number;
};
type AnimeFn = (params: AnimeParams) => unknown;
type AnimeModule = { default: AnimeFn } | Record<string, unknown>;

type QueueItem = { id: string; label: string; value: number; createdAt: number };
type HistoryRow = { roundId: number; crashMultiplier: number; endTime: string };

function resolveAnime(mod: AnimeModule): AnimeFn | null {
    if (typeof (mod as { default?: unknown }).default === "function") return (mod as { default: AnimeFn }).default;
    if (typeof (mod as unknown) === "function") return mod as unknown as AnimeFn;
    return null;
}
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
                                maxConcurrent: maxConcurrentProp = 8,
                                queueLimit = 200,
                                pollMs = 1000,
                                trigger,
                            }: MultipliersProps) {
    const { i18n } = useLingui();
    const { bets: betsReal } = useBetsNowReal(roundId, initData);

    const processedHistory = useRef<Set<number>>(new Set());
    const processedBets = useRef<Set<number>>(new Set());
    const lastFetchTime = useRef<number>(0);
    const fetching = useRef(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const animeRef = useRef<AnimeFn | null>(null);
    const [animeReady, setAnimeReady] = useState(false);
    const gcTimer = useRef<number | null>(null);
    const pollTimer = useRef<number | null>(null);
    const controllerRef = useRef(new AbortController());

    const host = getBackendHost();
    const base = `https://${host}/api/game/history`;

    const maxConcurrent = maxConcurrentProp;
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [active, setActive] = useState<QueueItem[]>([]);
    const [history, setHistory] = useState<HistoryRow[]>([]);
    const nodeMapRef = useRef(new Map<string, HTMLDivElement | null>());

    const setNodeRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
        nodeMapRef.current.set(id, el);
    }, []);

    const load = useCallback(async () => {
        if (fetching.current) return;
        fetching.current = true;
        try {
            const url = `${base}?_=${Date.now()}`;
            const res = await fetch(url, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
                signal: controllerRef.current.signal
            });
            if (!res.ok) return;
            const data: HistoryRow[] = await res.json();
            if (!Array.isArray(data)) return;

            setHistory([...data]);
            lastFetchTime.current = Date.now();
        } catch {}
        finally {
            fetching.current = false;
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        import("animejs").then((m) => {
            if (!mounted) return;
            const fn = resolveAnime(m as AnimeModule);
            if (fn) {
                animeRef.current = fn;
                setAnimeReady(true);
            }
        });
        return () => {
            mounted = false;
        };
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
        if (trigger) load();
    }, [trigger, load]);

    useEffect(() => {
        if (gcTimer.current) window.clearInterval(gcTimer.current);
        gcTimer.current = window.setInterval(() => {
            const totalProcessed = processedHistory.current.size + processedBets.current.size;
            if (totalProcessed > queueLimit * 3) {
                const historyIds = Array.from(processedHistory.current).sort((a, b) => a - b);
                const betIds = Array.from(processedBets.current).sort((a, b) => a - b);

                if (historyIds.length > queueLimit) {
                    const toKeep = historyIds.slice(-queueLimit);
                    processedHistory.current = new Set(toKeep);
                }
                if (betIds.length > queueLimit) {
                    const toKeep = betIds.slice(-queueLimit);
                    processedBets.current = new Set(toKeep);
                }
            }
        }, 10000) as unknown as number;
        return () => {
            if (gcTimer.current) window.clearInterval(gcTimer.current);
            gcTimer.current = null;
        };
    }, [queueLimit]);

    useEffect(() => {
        const newItems: QueueItem[] = [];
        const now = Date.now();

        const betsArray = Array.isArray(betsReal) ? betsReal : [betsReal];
        for (const item of betsArray) {
            const bid = readBetId(item);
            if (bid === null) continue;
            if (processedBets.current.has(bid)) continue;
            processedBets.current.add(bid);
            const m = readMultiplier(item);
            newItems.push({
                id: `bet-${bid}-${uuidv4()}`,
                label: formatX(m),
                value: m,
                createdAt: now
            });
        }

        const sortedHistory = [...history].sort((a, b) =>
            new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
        );

        for (const row of sortedHistory) {
            if (processedHistory.current.has(row.roundId)) continue;
            processedHistory.current.add(row.roundId);
            newItems.push({
                id: `history-${row.roundId}-${uuidv4()}`,
                label: formatX(row.crashMultiplier),
                value: row.crashMultiplier,
                createdAt: now
            });
        }

        if (newItems.length > 0) {
            setQueue((prev) => {
                const seenIds = new Set([...prev, ...active].map((item) => item.id));
                const filtered = newItems.filter((item) => !seenIds.has(item.id));
                const combined = [...filtered, ...prev];
                return combined.length > queueLimit ? combined.slice(0, queueLimit) : combined;
            });
        }
    }, [betsReal, history, queueLimit, active]);

    useLayoutEffect(() => {
        if (!containerRef.current || !queue.length || active.length >= maxConcurrent) return;
        const toAdd = maxConcurrent - active.length;
        if (toAdd > 0) {
            setActive((prev) => [...prev, ...queue.slice(0, toAdd)]);
            setQueue((prev) => prev.slice(toAdd));
        }
    }, [queue, active.length, maxConcurrent]);

    useLayoutEffect(() => {
        if (!containerRef.current || !active.length || !animeRef.current || !animeReady) return;
        const current = active[active.length - 1];
        const el = nodeMapRef.current.get(current.id);
        if (!el) return;
        const box = containerRef.current.getBoundingClientRect();
        const pill = el.getBoundingClientRect();
        const margin = 12;
        const fromX = -pill.width - margin;
        const toX = box.width + margin;
        const fromY = (containerRef.current.clientHeight - pill.height) / 2;
        el.style.opacity = "0";
        el.style.transform = `translate(${fromX}px, ${fromY}px)`;
        const baseDuration = 6500;
        const jitter = Math.floor(Math.random() * 1000) - 500;
        const delay = 120 + Math.random() * 240;
        animeRef.current({
            targets: el,
            translateX: [fromX, toX],
            opacity: [
                { value: 0, duration: 0 },
                { value: 1, duration: 220, easing: "easeOutQuad" },
                { value: 1, duration: baseDuration - 440, easing: "linear" },
                { value: 0, duration: 220, easing: "easeOutQuad" },
            ],
            duration: Math.max(4000, baseDuration + jitter),
            easing: "linear",
            delay,
            complete: () => {
                setActive((prev) => prev.filter((p) => p.id !== current.id));
                nodeMapRef.current.delete(current.id);
            },
        });
    }, [active, queueLimit, animeReady]);

    return (
        <div ref={containerRef} className="relative h-[30px] w-full overflow-hidden gap-[6px] flex" aria-label={i18n._(msg`multipliers-stream`)}>
            {active.map((item) => (
                <div
                    key={item.id}
                    ref={setNodeRef(item.id)}
                    data-id={item.id}
                    className="inline-flex items-center px-3 py-1 rounded-md text-white text-sm font-semibold shadow-md whitespace-nowrap will-change-transform"
                    style={{ pointerEvents: "none", background: gradientFor(item.value) }}
                >
                    {item.label}
                </div>
            ))}
        </div>
    );
}