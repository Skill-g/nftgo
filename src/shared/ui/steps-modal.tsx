"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/shared/ui/button";

type StepsModalProps = {
    open: boolean;
    onClose: () => void;
    storageKey: string;
    steps: string[];
    confirmText?: string;
    onConfirm?: () => void;
};

export function StepsModal({
                               open,
                               onClose,
                               storageKey,
                               steps,
                               confirmText = "Я понял",
                               onConfirm,
                           }: StepsModalProps) {
    useEffect(() => {
        if (!open) return;
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [open, onClose]);

    if (!open) return null;

    const acknowledge = () => {
        try {
            localStorage.setItem(storageKey, "1");
        } catch {}
        onConfirm?.();
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center"
            aria-modal="true"
            role="dialog"
        >
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />
            <div className="relative z-10 w-[calc(100vw-2rem)] sm:w-[560px] rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h3 className="text-lg font-semibold">Как получить подарок</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-black/5"
                        aria-label="Закрыть"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 py-4">
                    <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
                        {steps.map((s, i) => (
                            <li key={i} className="text-gray-800">{s}</li>
                        ))}
                    </ol>
                </div>

                <div className="px-5 pb-5">
                    <Button className="w-full" onClick={acknowledge}>
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
