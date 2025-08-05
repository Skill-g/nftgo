import { useEffect, useState } from 'react';
import { TonConnectUI } from '@tonconnect/ui'; // тип
import { ConnectedWallet } from '@tonconnect/ui';
import { getTonConnectUIInstance } from '@/shared/lib/tonconnect-ui-instance';

export interface UseTonConnectReturn {
    isConnected: boolean;
    initialRestored: boolean;
    walletInfo: ConnectedWallet | null;
    handleConnect: () => Promise<void>;
    tonConnectUI: TonConnectUI | null;
}

export const useTonConnect = (): UseTonConnectReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [initialRestored, setInitialRestored] = useState(false);
    const [walletInfo, setWalletInfo] = useState<ConnectedWallet | null>(null);
    const [tonConnectUI, setTonConnectUI] = useState<TonConnectUI | null>(null);

    useEffect(() => {
        const ui = getTonConnectUIInstance();
        if (!ui) return;
        setTonConnectUI(ui);
        setIsConnected(ui.connected);

        const unsubscribe = ui.onStatusChange((wallet: ConnectedWallet | null) => {
            setIsConnected(!!wallet);
            setWalletInfo(wallet);
        });

        ui.connectionRestored.then(() => {
            setInitialRestored(true);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleConnect = async () => {
        if (!tonConnectUI) return;
        if (isConnected) await tonConnectUI.disconnect();
        else await tonConnectUI.openModal();
    };

    return { isConnected, initialRestored, walletInfo, handleConnect, tonConnectUI };
};
