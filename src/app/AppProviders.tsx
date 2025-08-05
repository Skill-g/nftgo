"use client";

import { TonConnectProvider } from "@/shared/context/TonConnectContext";
import { UserProvider } from "@/shared/context/UserContext";
import { OnlineUsersProvider } from "@/shared/context/OnlineUsersContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <TonConnectProvider>
            <UserProvider>
                <OnlineUsersProvider>
                    {children}
                </OnlineUsersProvider>
            </UserProvider>
        </TonConnectProvider>
    );
}
