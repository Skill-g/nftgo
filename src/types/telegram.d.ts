export {};

declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                initData: string;
                openTelegramLink: (url: string) => void;
                shareURL: (url: string, text?: string) => void;
            };
        };
    }
}
