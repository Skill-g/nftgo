"use client";

import { TonConnectProvider } from "@/shared/context/TonConnectContext";
import { UserProvider } from "@/shared/context/UserContext";
import { OnlineUsersProvider } from "@/shared/context/OnlineUsersContext";
import GameRuntime from "@/shared/runtime/GameRuntime";

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <TonConnectProvider>
            <UserProvider>
                <OnlineUsersProvider>
                    <GameRuntime />
                    {children}
                </OnlineUsersProvider>
            </UserProvider>
        </TonConnectProvider>
    );
}
