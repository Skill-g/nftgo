export {};

declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                initData: string;
                openTelegramLink: (url: string) => void;
                shareURL: (url: string, text?: string) => void;
                openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
                initDataUnsafe?: Record<string, unknown>;
                ready?: () => void;
                close?: () => void;
                expand?: () => void;
            };
        };
    }
}
