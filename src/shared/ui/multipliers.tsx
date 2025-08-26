"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUserContext } from "@/shared/context/UserContext";
import { useGame } from "@/shared/hooks/useGame";
import { useBetsNow } from "@/shared/hooks/useBetsNow";

type QueueItem = {
    id: string;
    label: string;
    createdAt: number;
};

type AnimeEasing = "linear" | "easeOutQuad" | string;

type AnimeParams = {
    targets: Element | Element[] | NodeList | string;
    translateX?: number | [number, number];
    opacity?:
        | number
        | Array<{
        value: number;
        duration?: number;
        easing?: AnimeEasing;
    }>;
    duration?: number;
    easing?: AnimeEasing;
    complete?: () => void;
};

type AnimeFn = (params: AnimeParams) => unknown;
type AnimeModule = { default: AnimeFn } | Record<string, unknown>;

function resolveAnime(mod: AnimeModule): AnimeFn | null {
    if (typeof (mod as { default?: unknown }).default === "function") {
        return (mod as { default: AnimeFn }).default;
    }
    if (typeof (mod as unknown) === "function") {
        return mod as unknown as AnimeFn;
    }
    return null;
}

function formatX(v: number) {
    const s = v.toFixed(2);
    const trimmed = s.replace(/\.?0+$/,"");
    return `${trimmed}x`;
}

export function Multipliers() {
    const { user } = useUserContext();
    const { state } = useGame();
    const roundId = state?.roundId ?? null;
    const initData = user?.initData ?? "";
    const { bets } = useBetsNow(roundId, initData);

    const processed = useRef<Set<number>>(new Set());
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [active, setActive] = useState<QueueItem[]>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const animeRef = useRef<AnimeFn | null>(null);
    const maxConcurrent = 8;

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

    const newItems = useMemo(() => {
        const arr: QueueItem[] = [];
        for (const b of bets) {
            if (!processed.current.has(b.betId)) {
                arr.push({ id: String(b.betId), label: formatX(b.multiplier), createdAt: Date.now() });
            }
        }
        return arr;
    }, [bets]);

    useEffect(() => {
        if (!newItems.length) return;
        const ids = newItems.map((i) => Number(i.id));
        ids.forEach((id) => processed.current.add(id));
        setQueue((prev) => [...prev, ...newItems]);
    }, [newItems]);

    useEffect(() => {
        if (!containerRef.current) return;
        if (!queue.length) return;
        if (active.length >= maxConcurrent) return;
        const next = queue[0];
        setQueue((prev) => prev.slice(1));
        setActive((prev) => [...prev, next]);
    }, [queue, active.length]);

    useEffect(() => {
        if (!containerRef.current) return;
        if (!active.length) return;
        if (!animeRef.current) return;

        const el = document.getElementById(`mult-${active[active.length - 1].id}`);
        if (!el) return;

        const box = containerRef.current.getBoundingClientRect();
        const pill = el.getBoundingClientRect();
        const fromX = box.width + 12;
        const toX = -pill.width - 12;
        const laneHeight = 36;
        const lanes = Math.max(1, Math.min(3, Math.floor((containerRef.current.clientHeight || 0) / laneHeight)));
        const laneIndex = active.length % lanes;

        el.style.transform = `translate(${fromX}px, ${laneIndex * laneHeight}px)`;
        el.style.opacity = "0";

        animeRef.current({
            targets: el,
            translateX: [fromX, toX],
            opacity: [
                { value: 0, duration: 0 },
                { value: 1, duration: 200, easing: "easeOutQuad" },
                { value: 1, duration: 0 }
            ],
            duration: 7000,
            easing: "linear",
            complete: () => {
                setActive((prev) => prev.filter((p) => p.id !== el.dataset.id));
            }
        });
    }, [active]);

    useEffect(() => {
        if (active.length < maxConcurrent && queue.length) {
            const id = requestAnimationFrame(() => {
                setActive((prev) => (queue.length && prev.length < maxConcurrent ? [...prev, queue[0]] : prev));
                setQueue((prev) => (prev.length ? prev.slice(1) : prev));
            });
            return () => cancelAnimationFrame(id);
        }
    }, [active.length, queue.length]);

    return (
        <div ref={containerRef} className="relative h-28 w-full overflow-hidden">
            {active.map((item) => (
                <div
                    key={item.id}
                    id={`mult-${item.id}`}
                    data-id={item.id}
                    className="absolute inline-flex items-center px-3 py-1 rounded-md bg-gradient-to-l from-[#4F288F] to-[#8845F5] text-white text-sm font-semibold shadow-md whitespace-nowrap will-change-transform"
                    style={{ pointerEvents: "none" }}
                >
                    {item.label}
                </div>
            ))}
        </div>
    );
}
