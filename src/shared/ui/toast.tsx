
'use client';
import { useLingui } from '@lingui/react';
import { Trans, t, msg } from '@lingui/macro';
import { useEffect, useMemo, useState } from "react";
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
    const {
        i18n: i18n
    } = useLingui();

    const [show, setShow] = useState(true);
    const [copied, setCopied] = useState<"none" | "tag" | "text">("none");

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
            setTimeout(onClose, 250);
        }, autoCloseMs);
        return () => clearTimeout(timer);
    }, [onClose, autoCloseMs]);

    const tag = useMemo(() => {
        if (!botUsername) return "";
        return botUsername.startsWith("@") ? botUsername : `@${botUsername}`;
    }, [botUsername]);

    const handleOpenBot = () => {
        if (botUsername) {
            window.open(`https://t.me/${botUsername.replace("@", "")}`, "_blank", "noopener,noreferrer");
        }
    };

    const copyText = async (text: string, kind: "tag" | "text") => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(kind);
            setTimeout(() => setCopied("none"), 1500);
        } catch {}
    };

    if (!show) return null;

    const baseBg =
        type === "success" ? "bg-emerald-600" : type === "error" ? "bg-rose-600" : "bg-blue-600";

    return (
        <div
            className={`fixed bottom-4 right-4 z-[9999] w-[calc(100vw-2rem)] sm:w-auto max-w-[calc(100vw-2rem)] sm:max-w-sm p-4 rounded-lg shadow-lg text-white ${baseBg}`}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5">
                    {type === "success" ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <span className="inline-block w-5 h-5 rounded-full bg-white/20" />
                    )}
                </div>

                <div className="flex-1">
                    <p className="font-medium leading-snug text-white break-words whitespace-pre-wrap">
                        {message}
                    </p>

                    {!!tag && (
                        <div className="mt-2 bg-black/20 p-2 rounded">
                            {botMessage && (
                                <p className="text-sm leading-snug text-white/90 break-words whitespace-pre-wrap">
                                    {botMessage}
                                </p>
                            )}

                            <button
                                onClick={handleOpenBot}
                                className="mt-2 font-semibold text-[#21ee43] hover:underline underline-offset-2 break-words"
                                title={`Открыть ${tag} в Telegram`}
                            >
                                {tag}
                            </button>

                            <div className="mt-2 flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-3 text-xs bg-white/10 text-white border border-white/30 hover:bg-white/15"
                                    onClick={() => copyText(tag, "tag")}
                                    aria-label={i18n._(msg`Скопировать тег`)}
                                >
                                    <Copy className="w-3 h-3 mr-1" />
                                    {copied === "tag" ? "Скопировано" : "Скопировать тег"}
                                </Button>

                                {botMessage && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-3 text-xs bg-white/10 text-white border border-white/30 hover:bg-white/15"
                                        onClick={() => copyText(botMessage, "text")}
                                        aria-label={i18n._(msg`Скопировать текст`)}
                                    >
                                        <Copy className="w-3 h-3 mr-1" />
                                        {copied === "text" ? "Скопировано" : "Скопировать текст"}
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-3 text-xs bg-white/10 text-white border border-white/30 hover:bg-white/15"
                                    onClick={handleOpenBot}
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" /><Trans>Открыть</Trans></Button>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => {
                        setShow(false);
                        onClose();
                    }}
                    className="text-white hover:text-white"
                    aria-label={i18n._(msg`Закрыть уведомление`)}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
