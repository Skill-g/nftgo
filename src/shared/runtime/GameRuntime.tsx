"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/shared/store/game";
import { getBackendHost } from "@/shared/lib/host";
import type { GameState as StoreState, Phase } from "@/shared/store/game";

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

function readNumber(v: unknown, fb = 0): number {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string") {
        const n = parseFloat(v);
        if (!Number.isNaN(n)) return n;
    }
    return fb;
}

function readPhase(v: unknown): Phase {
    if (v === "waiting" || v === "running" || v === "crashed") return v;
    if (v === "active") return "running";
    if (v === "idle" || v === "pending") return "waiting";
    if (v === "ended" || v === "finished") return "crashed";
    return "waiting";
}

function parseCurrent(json: unknown): Partial<StoreState> | null {
    if (!isRecord(json)) return null;
    const phase = readPhase(json.phase ?? json.status);
    const roundIdNum = readNumber(json.roundId, NaN);
    const roundId = Number.isFinite(roundIdNum) ? roundIdNum : null;
    const multiplier = readNumber(json.multiplier ?? json.x ?? json.coeff ?? 1, 1);
    const startIso =
        (typeof json.startTime === "string" && json.startTime) ||
        (typeof json.startedAt === "string" && json.startedAt) ||
        null;
    const startedAtMs = startIso ? Date.parse(startIso) : null;
    const crashMultiplierNum = readNumber(json.crashMultiplier, NaN);
    const crashMultiplier = Number.isFinite(crashMultiplierNum) ? crashMultiplierNum : null;
    const ttsSec = readNumber(json.timeToStart ?? json.nextStartIn ?? json.waitSeconds ?? 0, 0);
    const timeToStartMs = ttsSec > 1000 ? ttsSec : ttsSec > 0 ? Math.round(ttsSec * 1000) : null;
    return { phase, roundId, multiplier, startedAtMs, crashMultiplier, timeToStartMs };
}

export default function GameRuntime() {
    const setFromServer = useGameStore((s) => s.setFromServer);
    const tick = useGameStore((s) => s.tick);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef<number>(0);
    const pollRef = useRef<number | null>(null);

    useEffect(() => {
        const loop = (t: number) => {
            if (!lastRef.current) lastRef.current = t;
            const dt = t - lastRef.current;
            lastRef.current = t;
            tick(dt);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [tick]);

    useEffect(() => {
        let aborted = false;
        const host = getBackendHost();
        const url = `https://${host}/api/game/current`;
        const load = async () => {
            try {
                const res = await fetch(`${url}?_=${Date.now()}`, { cache: "no-store" });
                if (!res.ok) return;
                const json: unknown = await res.json();
                const parsed = parseCurrent(json);
                if (!parsed || aborted) return;
                setFromServer(parsed);
            } catch {}
        };
        load();
        const onFocus = () => load();
        const onVis = () => {
            if (!document.hidden) load();
        };
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = window.setInterval(load, 1000);
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVis);
        return () => {
            aborted = true;
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [setFromServer]);

    return null;
}
