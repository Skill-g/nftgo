"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle, X } from "lucide-react";

type ToastProps = {
    type: "success" | "error" | "bot_required";
    message: string;
    botUsername?: string;
    botMessage?: string;
    onClose: () => void;
    autoCloseMs?: number;
};

export function Toast({
                          type,
                          message,
                          botUsername,
                          botMessage,
                          onClose,
                          autoCloseMs = 6000,
                      }: ToastProps) {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => {
            setShow(false);
            setTimeout(onClose, 220);
        }, autoCloseMs);
        return () => clearTimeout(t);
    }, [autoCloseMs, onClose]);

    const tag = useMemo(() => {
        if (!botUsername) return "";
        return botUsername.startsWith("@") ? botUsername : `@${botUsername}`;
    }, [botUsername]);

    const handleOpenBot = () => {
        if (!tag) return;
        const uname = tag.replace("@", "");
        window.open(`https://t.me/${uname}`, "_blank");
    };

    const BotMessage: ReactNode = useMemo(() => {
        if (!botMessage || !tag) return botMessage ?? null;
        const uname = tag.replace("@", "");
        const rgx = new RegExp(`(@?${uname})`, "gi");
        const parts = botMessage.split(rgx);
        if (parts.length === 1) {
            return (
                <>
                    {botMessage}{" "}
                    <button
                        onClick={handleOpenBot}
                        className="font-semibold text-[#21ee43] hover:underline underline-offset-2"
                        title={`Открыть ${tag} в Telegram`}
                    >
                        {tag}
                    </button>
                </>
            );
        }
        const nodes: ReactNode[] = [];
        for (let i = 0; i < parts.length; i++) {
            const chunk = parts[i];
            if (i % 2 === 1) {
                nodes.push(
                    <button
                        key={`m-${i}`}
                        onClick={handleOpenBot}
                        className="font-semibold text-[#21ee43] hover:underline underline-offset-2"
                        title={`Открыть ${tag} в Telegram`}
                    >
                        {chunk.startsWith("@") ? chunk : `@${uname}`}
                    </button>
                );
            } else {
                nodes.push(chunk);
            }
        }
        return <>{nodes}</>;
    }, [botMessage, tag]);

    if (!show) return null;

    const baseBg =
        type === "success" ? "bg-emerald-600" : type === "error" ? "bg-rose-600" : "bg-blue-600";

    return (
        <div
            className={`fixed bottom-4 right-4 z-[9999] max-w-sm w-full p-4 rounded-lg shadow-lg text-white transition-all duration-300 ${baseBg}`}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5">
                    {type === "success" ? <CheckCircle className="w-5 h-5" /> : <span className="inline-block w-5 h-5 rounded-full bg-white/20" />}
                </div>
                <div className="flex-1">
                    <p className="font-medium leading-snug">{message}</p>
                    {botMessage && <p className="text-sm leading-snug mt-1">{BotMessage}</p>}
                </div>
                <button
                    onClick={() => {
                        setShow(false);
                        onClose();
                    }}
                    className="text-white/90 hover:text-white"
                    aria-label="Закрыть уведомление"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
