import { TonConnectUI, THEME } from '@tonconnect/ui';

let tonConnectUIInstance: TonConnectUI | null = null;

export function getTonConnectUIInstance() {
    if (typeof window === "undefined") return null;
    if (!tonConnectUIInstance) {
        tonConnectUIInstance = new TonConnectUI({
            manifestUrl: "https://nftgo.site/tonconnect-manifest.json",
            uiPreferences: {
                theme: THEME.DARK,
            },
        });
    }
    return tonConnectUIInstance;
}
