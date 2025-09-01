"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/shared/ui/button";

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
    const [copied, setCopied] = useState<"none" | "tag" | "text">("none");

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
            setTimeout(onClose, 250);
        }, autoCloseMs);
        return () => clearTimeout(timer);
    }, [onClose, autoCloseMs]);

    const copyText = async (text: string, kind: "tag" | "text") => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(kind);
            setTimeout(() => setCopied("none"), 1500);
        } catch {
        }
    };

    const handleOpenBot = () => {
        if (botUsername) {
            window.open(`https://t.me/${botUsername.replace("@", "")}`, "_blank");
        }
    };

    if (!show) return null;

    const baseBg =
        type === "success" ? "bg-emerald-600" : type === "error" ? "bg-rose-600" : "bg-blue-600";

    const tag = botUsername ? (botUsername.startsWith("@") ? botUsername : `@${botUsername}`) : "";

    return (
        <div
            className={`fixed bottom-4 right-4 z-[9999] max-w-sm w-full p-4 rounded-lg shadow-lg text-white transition-all duration-300 transform ${baseBg}`}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        {type === "success" && <CheckCircle className="w-5 h-5" />}
                        <p className="font-medium">{message}</p>
                    </div>

                    {tag && (
                        <div className="mt-2 bg-black/20 p-2 rounded">
                            {botMessage && <p className="text-sm mb-2">{botMessage}</p>}

                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    onClick={handleOpenBot}
                                    className="underline underline-offset-2 hover:opacity-90"
                                    title={`Открыть ${tag} в Telegram`}
                                >
                                    {tag}
                                </button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    onClick={() => copyText(tag, "tag")}
                                    aria-label="Скопировать тег"
                                >
                                    <Copy className="w-3 h-3 mr-1" />
                                    {copied === "tag" ? "Скопировано" : "Скопировать тег"}
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    onClick={handleOpenBot}
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Открыть в TG
                                </Button>
                            </div>


                        </div>
                    )}
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