"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useBetsNow as useBetsNowReal } from "@/shared/hooks/useBetsNow";
import { v4 as uuidv4 } from "uuid";
import { getBackendHost } from "@/shared/lib/host";

type QueueItem = { id: string; label: string; createdAt: number };
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
type Mode = "mock" | "live" | "hybrid";

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
    }
    return 1;
}

function readBetId(v: unknown): number | null {
    if (isRecord(v)) {
        if (typeof v.betId === "number") return v.betId;
        if (typeof v.roundId === "number") return v.roundId;
    }
    return null;
}

function formatX(v: number) {
    const s = v.toFixed(2);
    const trimmed = s.replace(/\.?0+$/, "");
    return `${trimmed}x`;
}

function randomMultiplier() {
    const r = Math.random();
    if (r < 0.8) return 1 + Math.random() * 2;
    if (r < 0.98) return 3 + Math.random() * 7;
    return 10 + Math.random() * 90;
}

type MultipliersProps = {
    roundId: number | null;
    initData: string;
    mode?: Mode;
    maxConcurrent?: number;
    mockRateMs?: [number, number];
    queueLimit?: number;
};

type HistoryRow = { roundId: number; crashMultiplier: number; endTime: string };

export function Multipliers({
                                roundId,
                                initData,
                                mode,
                                maxConcurrent: maxConcurrentProp = 8,
                                queueLimit = 200,
                            }: MultipliersProps) {
    const envMock = process.env.NEXT_PUBLIC_USE_MOCK_BETS === "1";
    const resolvedMode: Mode = mode ?? (envMock ? "mock" : "live");

    const { bets: betsReal } = useBetsNowReal(roundId, initData);

    const processed = useRef<Set<number>>(new Set());
    const lastSeenEndTs = useRef<number>(0);
    const fetching = useRef(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const animeRef = useRef<AnimeFn | null>(null);
    const [animeReady, setAnimeReady] = useState(false);
    const rafId = useRef<number | null>(null);
    const gcTimer = useRef<number | null>(null);
    const maxConcurrent = maxConcurrentProp;

    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [active, setActive] = useState<QueueItem[]>([]);
    const [history, setHistory] = useState<HistoryRow[]>([]);

    const nodeMapRef = useRef(new Map<string, HTMLDivElement | null>());
    const setNodeRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
        nodeMapRef.current.set(id, el);
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
        let cancelled = false;
        const host = getBackendHost();
        const base = `https://${host}/api/game/history`;
        const controller = new AbortController();
        async function load() {
            if (cancelled || fetching.current) return;
            fetching.current = true;
            try {
                const url = `${base}?_=${Date.now()}`;
                const res = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }, signal: controller.signal });
                if (!res.ok) return;
                const data: HistoryRow[] = await res.json();
                if (!Array.isArray(data) || !data.length) return;
                const sortedByTimeDesc = [...data].sort((a, b) => Date.parse(b.endTime) - Date.parse(a.endTime));
                const fresh = sortedByTimeDesc.filter((r) => {
                    const t = Date.parse(r.endTime);
                    return t > lastSeenEndTs.current && !processed.current.has(r.roundId);
                });
                if (fresh.length) {
                    const maxTs = fresh.reduce((m, r) => Math.max(m, Date.parse(r.endTime)), lastSeenEndTs.current);
                    lastSeenEndTs.current = maxTs;
                    setHistory((prev) => {
                        const all = [...prev, ...fresh];
                        return all.length > queueLimit ? all.slice(-queueLimit) : all;
                    });
                }
            } catch {}
            finally {
                fetching.current = false;
            }
        }
        load();
        const id = window.setInterval(load, 1000);
        const onVis = () => {
            if (!document.hidden) load();
        };
        const onFocus = () => load();
        document.addEventListener("visibilitychange", onVis);
        window.addEventListener("focus", onFocus);
        return () => {
            cancelled = true;
            controller.abort();
            clearInterval(id);
            document.removeEventListener("visibilitychange", onVis);
            window.removeEventListener("focus", onFocus);
        };
    }, [queueLimit]);

    useEffect(() => {
        if (gcTimer.current) window.clearInterval(gcTimer.current);
        gcTimer.current = window.setInterval(() => {
            if (processed.current.size > queueLimit * 3) {
                const ids = Array.from(processed.current).sort((a, b) => a - b);
                const keepFrom = Math.max(0, ids.length - queueLimit * 2);
                const toRemove = ids.slice(0, keepFrom);
                for (const id of toRemove) processed.current.delete(id);
            }
        }, 10000) as unknown as number;
        return () => {
            if (gcTimer.current) window.clearInterval(gcTimer.current);
            gcTimer.current = null;
        };
    }, [queueLimit]);

    const incomingItems = useMemo(() => {
        if (resolvedMode === "mock") return [] as QueueItem[];
        const out: QueueItem[] = [];
        const now = Date.now();
        for (const item of betsReal as unknown as ReadonlyArray<unknown>) {
            const bid = readBetId(item);
            if (bid === null) continue;
            if (processed.current.has(bid)) continue;
            processed.current.add(bid);
            const m = readMultiplier(item);
            out.push({ id: `${bid}-${uuidv4()}`, label: formatX(m), createdAt: now });
        }
        const sortedHistoryDesc = [...history].sort((a, b) => Date.parse(b.endTime) - Date.parse(a.endTime));
        for (const row of sortedHistoryDesc) {
            const idNum = row.roundId;
            if (processed.current.has(idNum)) continue;
            processed.current.add(idNum);
            out.push({ id: `${idNum}-${uuidv4()}`, label: formatX(row.crashMultiplier), createdAt: now });
        }
        return out;
    }, [betsReal, history, resolvedMode]);

    useEffect(() => {
        if (!incomingItems.length) return;
        setQueue((prev) => {
            const seenIds = new Set([...prev, ...active].map((item) => item.id));
            const newItems = incomingItems.filter((item) => !seenIds.has(item.id));
            const next = [...newItems, ...prev].slice(0, queueLimit);
            return next;
        });
    }, [incomingItems, queueLimit, active]);

    useEffect(() => {
        if (!containerRef.current || !queue.length || active.length >= maxConcurrent) return;
        rafId.current = requestAnimationFrame(() => {
            setActive((prev) => {
                if (queue.length && prev.length < maxConcurrent) {
                    const nextItem = queue[0];
                    if (!prev.some((item) => item.id === nextItem.id)) {
                        return [...prev, nextItem];
                    }
                }
                return prev;
            });
            setQueue((prev) => (prev.length ? prev.slice(1) : prev));
        });
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
            rafId.current = null;
        };
    }, [queue, active.length, maxConcurrent]);

    useEffect(() => {
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
                if (resolvedMode === "mock" || resolvedMode === "hybrid") {
                    setQueue((prev) => {
                        const seenIds = new Set([...prev, ...active].map((item) => item.id));
                        const newId = uuidv4();
                        if (seenIds.has(newId)) return prev;
                        const next = [...prev, { id: newId, label: formatX(randomMultiplier()), createdAt: Date.now() }];
                        return next.length > queueLimit ? next.slice(-queueLimit) : next;
                    });
                }
            },
        });
    }, [active, queueLimit, resolvedMode, animeReady]);

    return (
        <div ref={containerRef} className="relative h-[30px] w-full overflow-hidden gap-[6px] flex" aria-label="multipliers-stream">
            {active.map((item) => (
                <div
                    key={item.id}
                    ref={setNodeRef(item.id)}
                    data-id={item.id}
                    className="inline-flex items-center px-3 py-1 rounded-md bg-gradient-to-l from-[#4F288F] to-[#8845F5] text-white text-sm font-semibold shadow-md whitespace-nowrap will-change-transform"
                    style={{ pointerEvents: "none" }}
                >
                    {item.label}
                </div>
            ))}
        </div>
    );
}