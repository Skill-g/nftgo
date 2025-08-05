"use client";

import { FC, useEffect, useState } from "react";
import { Card } from "@/shared/ui/card";
import { ModalContent } from "@/feature/connect-modal/ui/modal-content";
import { ShortOption } from "@/feature/connect-modal/ui/short-option";
import Image from "next/image";
import { AllOption } from "@/feature/connect-modal/ui/all-option";
import { Button } from "@/shared/ui/button";

import { THEME, TonConnectUI } from "@tonconnect/ui";
const tonConnectUI = new TonConnectUI({
    manifestUrl: "https://nftgo.site/tonconnect-manifest.json",
    uiPreferences: {
        theme: THEME.DARK,
    },
});

interface ConnectModalProps {
    showModal: boolean;
    setShowModal: (value: boolean) => void;
}

export const ConnectModal: FC<ConnectModalProps> = ({ showModal, setShowModal }) => {
    const [allOptions, setAllOptions] = useState(true);
    const [isConnected, setIsConnected] = useState<boolean>(tonConnectUI.connected);
    const [initialRestored, setInitialRestored] = useState(false);

    useEffect(() => {
        const unsubscribe = tonConnectUI.onStatusChange((walletOrNull) => {
            setIsConnected(!!walletOrNull);
        });

        tonConnectUI.connectionRestored.then(() => {
            setInitialRestored(true);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleConnect = async () => {
        if (isConnected) {
            await tonConnectUI.disconnect();
            setIsConnected(false);
        } else {
            await tonConnectUI.openModal();
        }
    };

    if (!initialRestored) {
        return null;
    }

    return (
        <>
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
                    <Card className="w-full max-w-md bg-gradient-to-b from-[#372d6b] to-[#262352] border-[#533189] rounded-t-3xl p-6 relative">
                        <ModalContent setShowModal={setShowModal} />

                        {allOptions ? (
                            <div>
                                {isConnected ? (
                                    <Button
                                        className="w-full bg-gradient-to-r from-[#8845f5] to-[#533189] hover:from-[#9955ff] hover:to-[#6441a5] text-white font-medium py-4 rounded-2xl mb-8"
                                        onClick={handleConnect}
                                    >
                                        Disconnect Wallet
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full bg-gradient-to-r from-[#8845f5] to-[#533189] hover:from-[#9955ff] hover:to-[#6441a5] text-white font-medium py-4 rounded-2xl mb-8"
                                        onClick={handleConnect}
                                    >
                                        Connect Wallet
                                    </Button>
                                )}

                                <ShortOption setAllOptions={setAllOptions} />

                                <div className="flex items-center justify-center gap-2 pt-4">
                                    <Image
                                        src="/profile/nftGoLogo.svg"
                                        alt="NFT Go Logo"
                                        width={66}
                                        height={48}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-4 gap-x-14 p-4">
                                {["Tonkeeper", "Tonhub"].map((wallet, idx) => (
                                    <AllOption key={idx} wallet={wallet} />
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </>
    );
};
