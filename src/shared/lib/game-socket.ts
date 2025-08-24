export type WSMessage =
    | { type: "connected" }
    | { type: "round_start"; roundId: number; startTime?: string }
    | { type: "game_start"; roundId: number }
    | { type: "multiplier_update"; multiplier: number }
    | { type: "game_crash"; multiplier: number }
    | { type: "state"; phase?: "waiting" | "running" | "crashed"; multiplier?: number; roundId?: number }
    | { type: "error"; message: string };

export type SocketHandlers = {
    onOpen?: () => void;
    onClose?: (code: number, reason?: string) => void;
    onError?: (e: ErrorEvent) => void;
    onMessage?: (msg: WSMessage) => void;
};

export function makeGameSocket(host: string, roundId: number, initData: string, handlers: SocketHandlers) {
    const scheme = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${scheme}://${host}/ws/game/${roundId}?initData=${encodeURIComponent(initData)}`;
    let ws: WebSocket | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;

    function open() {
        ws = new WebSocket(url);
        ws.onopen = () => {
            handlers.onOpen?.();
            pingTimer = setInterval(() => {
                if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
            }, 15000);
        };
        ws.onmessage = ev => {
            try {
                const data = JSON.parse(ev.data as string) as WSMessage;
                handlers.onMessage?.(data);
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
