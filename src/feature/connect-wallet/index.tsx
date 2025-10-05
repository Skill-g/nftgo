'use client';

import { useLingui } from '@lingui/react';
import { Trans, msg } from '@lingui/macro';
import { useTonConnect } from '@/shared/context/TonConnectContext';
import { useMemo, useCallback } from 'react';

export function ConnectWallet() {
    const { i18n } = useLingui();
    const { isConnected, initialRestored, walletInfo, handleConnect } = useTonConnect();

    const shortAddress = useMemo(() => {
        const address = walletInfo?.account?.address ?? '';
        return address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
    }, [walletInfo?.account?.address]);

    const onKeyUp = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleConnect();
            }
        },
        [handleConnect]
    );

    if (!initialRestored) {
        return (
            <div
                className="border-2 border-[#533189] rounded-lg px-1 py-0 flex items-center min-h-[40px] opacity-70 cursor-not-allowed"
                aria-busy="true"
            >
        <span className="bg-[#150f27] text-white px-6 py-2 rounded-lg text-lg">
          <Trans>Loading...</Trans>
        </span>
            </div>
        );
    }

    return (
        <div
            className="border-2 border-[#533189] rounded-lg px-1 py-0 flex items-center min-h-[40px] cursor-pointer select-none"
            onClick={handleConnect}
            onKeyUp={onKeyUp}
            role="button"
            tabIndex={0}
            aria-label={
                isConnected
                    ? i18n._(msg`Disconnect wallet`)
                    : i18n._(msg`Connect wallet`)
            }
            title={
                isConnected
                    ? i18n._(msg`Disconnect`)
                    : i18n._(msg`Connect Wallet`)
            }
        >
            {isConnected ? (
                <div className="flex items-center gap-2 w-full justify-between px-2">
                    <span className="text-white text-sm">{shortAddress}</span>
                    <span className="bg-red-600 hover:bg-red-700 text-white rounded-md text-xs h-[30px] px-3 flex items-center">
            <Trans>Disconnect</Trans>
          </span>
                </div>
            ) : (
                <span className="bg-[#150f27] text-white px-3 py-2 rounded-lg text-lg">
          <Trans>Connect Wallet</Trans>
        </span>
            )}
        </div>
    );
}

export default ConnectWallet;
