"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useUserContext } from "@/shared/context/UserContext";
import { useGame } from "@/shared/hooks/useGame";
import { useBetsNow as useBetsNowReal } from "@/shared/hooks/useBetsNow";
import { v4 as uuidv4 } from "uuid";

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
    mode?: Mode;
    maxConcurrent?: number;
    mockRateMs?: [number, number];
    queueLimit?: number;
};

export function Multipliers({
                                mode,
                                maxConcurrent: maxConcurrentProp = 8,
                                mockRateMs = [200, 400],
                                queueLimit = 200,
                            }: MultipliersProps) {
    const { user } = useUserContext();
    const { state } = useGame();
    const roundId = state?.roundId ?? null;
    const initData = user?.initData ?? "";

    const envMock = process.env.NEXT_PUBLIC_USE_MOCK_BETS === "1";
    const resolvedMode: Mode = mode ?? (envMock ? "mock" : "live");

    const { bets: betsReal } = useBetsNowReal(roundId, initData);

    const processed = useRef<Set<number>>(new Set());
    const containerRef = useRef<HTMLDivElement | null>(null);
    const animeRef = useRef<AnimeFn | null>(null);
    const rafId = useRef<number | null>(null);
    const timers = useRef<number[]>([]);
    const maxConcurrent = maxConcurrentProp;

    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [active, setActive] = useState<QueueItem[]>([]);

    const nodeMapRef = useRef(new Map<string, HTMLDivElement | null>());
    const setNodeRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
        nodeMapRef.current.set(id, el);
    }, []);

    useEffect(() => {
        let mounted = true;
        import("animejs").then((m) => {
            if (!mounted) return;
            const fn = resolveAnime(m as AnimeModule);
            if (fn) animeRef.current = fn;
        });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        processed.current.clear();
    }, [roundId]);


    const realItems = useMemo(() => {
        if (resolvedMode === "mock") return [] as QueueItem[];
        const arr: QueueItem[] = [];
        for (const b of betsReal) {
            if (!processed.current.has(b.betId)) {
                processed.current.add(b.betId);
                const id = `${b.betId}-${uuidv4()}`;
                arr.push({ id, label: formatX(b.multiplier), createdAt: Date.now() });
            }
        }
        return arr;
    }, [betsReal, resolvedMode]);

    useEffect(() => {
        if (!realItems.length) return;
        setQueue((prev) => {
            const seenIds = new Set([...prev, ...active].map((item) => item.id));
            const newItems = realItems.filter((item) => !seenIds.has(item.id));
            const next = [...prev, ...newItems];
            return next.length > queueLimit ? next.slice(-queueLimit) : next;
        });
    }, [realItems, queueLimit, active]);

    useEffect(() => {
        if (resolvedMode !== "mock" && resolvedMode !== "hybrid") return;

        let cancelled = false;

        const tick = () => {
            if (cancelled) return;

            setQueue((prev) => {
                const need = Math.max(0, maxConcurrent * 2 - prev.length);
                if (need === 0) return prev;

                const seenIds = new Set([...prev, ...active].map((item) => item.id));
                const batch: QueueItem[] = [];
                for (let i = 0; i < need; i++) {
                    const id = uuidv4();
                    if (!seenIds.has(id)) {
                        seenIds.add(id);
                        batch.push({ id, label: formatX(randomMultiplier()), createdAt: Date.now() });
                    }
                }
                const next = [...prev, ...batch];
                return next.length > queueLimit ? next.slice(-queueLimit) : next;
            });

            const [a, b] = mockRateMs;
            const delay = a + Math.random() * Math.max(0, b - a);
            const t = window.setTimeout(tick, delay);
            timers.current.push(t);
        };

        tick();
        return () => {
            cancelled = true;
            timers.current.forEach((t) => clearTimeout(t));
            timers.current = [];
        };
    }, [maxConcurrent, queueLimit, mockRateMs, active, resolvedMode]);

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
        if (!containerRef.current || !active.length || !animeRef.current) return;

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
                        const next = [
                            ...prev,
                            {
                                id: newId,
                                label: formatX(randomMultiplier()),
                                createdAt: Date.now(),
                            },
                        ];
                        return next.length > queueLimit ? next.slice(-queueLimit) : next;
                    });
                }
            },
        });
     }, [active, queueLimit, resolvedMode]);

    return (
        <div
            ref={containerRef}
            className="relative h-[30px] w-full overflow-hidden gap-[6px] flex"
            aria-label="multipliers-stream"
        >
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
