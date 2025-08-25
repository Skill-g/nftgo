"use client";

import { getBackendHost } from "@/shared/lib/host";

export type GamePhase = "waiting" | "running" | "crashed";

export type WSMessage =
    | { type: "connected" }
    | { type: "pong"; ts?: number }
    | { type: "round_start"; roundId: number; serverSeedHash?: string; clientSeed?: string; nonce?: number }
    | { type: "game_start"; roundId: number }
    | { type: "multiplier_update"; multiplier: number; timestamp?: number }
    | { type: "game_crash"; crashMultiplier: number; roundId?: number; serverSeed?: string; serverSeedHash?: string }
    | { type: "state"; phase?: GamePhase; multiplier?: number; roundId?: number }
    | { type: "error"; message: string };

function normalizeMessage(raw: unknown): WSMessage {
    if (!raw || typeof raw !== "object") return { type: "error", message: "invalid message" };
    const obj = raw as Record<string, unknown>;
    const t = (obj["type"] ?? obj["event"]) as string | undefined;
    switch (t) {
        case "connected":
            return { type: "connected" };
        case "pong":
            return { type: "pong", ts: typeof obj["ts"] === "number" ? (obj["ts"] as number) : undefined };
        case "round_start":
            return {
                type: "round_start",
                roundId: Number(obj["roundId"]),
                serverSeedHash: typeof obj["serverSeedHash"] === "string" ? (obj["serverSeedHash"] as string) : undefined,
                clientSeed: typeof obj["clientSeed"] === "string" ? (obj["clientSeed"] as string) : undefined,
                nonce: typeof obj["nonce"] === "number" ? (obj["nonce"] as number) : undefined
            };
        case "game_start":
            return { type: "game_start", roundId: Number(obj["roundId"]) };
        case "multiplier_update":
            return {
                type: "multiplier_update",
                multiplier: Number(obj["multiplier"]),
                timestamp: typeof obj["timestamp"] === "number" ? (obj["timestamp"] as number) : undefined
            };
        case "game_crash":
            return {
                type: "game_crash",
                crashMultiplier: Number(obj["crashMultiplier"] ?? obj["multiplier"]),
                roundId: typeof obj["roundId"] === "number" ? (obj["roundId"] as number) : undefined,
                serverSeed: typeof obj["serverSeed"] === "string" ? (obj["serverSeed"] as string) : undefined,
                serverSeedHash: typeof obj["serverSeedHash"] === "string" ? (obj["serverSeedHash"] as string) : undefined
            } as WSMessage;
        case "state":
            return {
                type: "state",
                phase: obj["phase"] as GamePhase | undefined,
                multiplier: typeof obj["multiplier"] === "number" ? (obj["multiplier"] as number) : undefined,
                roundId: typeof obj["roundId"] === "number" ? (obj["roundId"] as number) : undefined
            };
        default:
            if (typeof t === "string") return { type: "error", message: `unknown type ${t}` };
            return { type: "error", message: "unknown message" };
    }
}

export type SocketHandlers = {
    onOpen?: () => void;
    onClose?: (code: number, reason?: string) => void;
    onError?: (e: ErrorEvent) => void;
    onMessage?: (msg: WSMessage) => void;
};

export function makeGameSocket(roundId: number, initData: string, handlers: SocketHandlers) {
    const host = getBackendHost();
    const scheme = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${scheme}://${host}/ws/game/${roundId}?initData=${encodeURIComponent(initData)}`;
    let ws: WebSocket | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;

    function open() {
        ws = new WebSocket(url);
        ws.onopen = () => {
            handlers.onOpen?.();
            pingTimer = setInterval(() => {
                if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping", ts: Date.now() }));
            }, 15000);
        };
        ws.onmessage = ev => {
            try {
                const data = JSON.parse(ev.data as string);
                const msg = normalizeMessage(data);
                handlers.onMessage?.(msg);
            } catch (e) {
                if (e instanceof Error) handlers.onError?.(new ErrorEvent("error", { error: e }));
            }
        };
        ws.onerror = e => {
            handlers.onError?.(e as ErrorEvent);
        };
        ws.onclose = ev => {
            if (pingTimer) clearInterval(pingTimer);
            handlers.onClose?.(ev.code, ev.reason);
        };
    }

    function close() {
        if (pingTimer) clearInterval(pingTimer);
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) ws.close();
        ws = null;
    }

    return { open, close };
}
