"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { TonConnectUI, THEME, ConnectedWallet } from "@tonconnect/ui";

type TonConnectContextType = {
    isConnected: boolean;
    walletInfo: ConnectedWallet | null;
    handleConnect: () => Promise<void>;
    tonConnectUI: TonConnectUI | null;
    initialRestored: boolean;
};

const TonConnectContext = createContext<TonConnectContextType | undefined>(undefined);

let tonConnectUIInstance: TonConnectUI | null = null;

function getTonConnectUIInstance() {
    if (typeof window === "undefined") return null;
    if (!tonConnectUIInstance) {
        tonConnectUIInstance = new TonConnectUI({
            manifestUrl: "https://nftgo.site/tonconnect-manifest.json",
            uiPreferences: { theme: THEME.DARK },
        });
    }
    return tonConnectUIInstance;
}

export const TonConnectProvider = ({ children }: { children: React.ReactNode }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [walletInfo, setWalletInfo] = useState<ConnectedWallet | null>(null);
    const [initialRestored, setInitialRestored] = useState(false);
    const [tonConnectUI, setTonConnectUI] = useState<TonConnectUI | null>(null);

    useEffect(() => {
        const ui = getTonConnectUIInstance();
        if (!ui) return;
        setTonConnectUI(ui);
        setIsConnected(ui.connected);

        const unsubscribe = ui.onStatusChange((wallet) => {
            setIsConnected(!!wallet);
            setWalletInfo(wallet);
        });

        ui.connectionRestored.then(() => setInitialRestored(true));

        if (ui.connected) setInitialRestored(true);

        return () => unsubscribe();
    }, []);

    const handleConnect = async () => {
        if (!tonConnectUI) return;
        if (isConnected) await tonConnectUI.disconnect();
        else await tonConnectUI.openModal();
    };

    return (
        <TonConnectContext.Provider value={{
            isConnected,
            walletInfo,
            handleConnect,
            tonConnectUI,
            initialRestored
        }}>
            {children}
        </TonConnectContext.Provider>
    );
};

export const useTonConnect = () => {
    const ctx = useContext(TonConnectContext);
    if (!ctx) throw new Error("useTonConnect must be used within TonConnectProvider");
    return ctx;
};
