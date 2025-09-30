"use client";

import { TonConnectProvider } from "@/shared/context/TonConnectContext";
import { UserProvider } from "@/shared/context/UserContext";
import { OnlineUsersProvider } from "@/shared/context/OnlineUsersContext";
import { GameProvider } from "@/shared/context/GameContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <TonConnectProvider>
            <UserProvider>
                <OnlineUsersProvider>
                    <GameProvider>{children}</GameProvider>
                </OnlineUsersProvider>
            </UserProvider>
        </TonConnectProvider>
    );
}
