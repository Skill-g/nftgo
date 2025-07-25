"use client";
import React, { createContext, useContext } from "react";
import { useTelegramAuth } from "@/shared/hooks/useTelegramAuth";

type TelegramUser = {
    id: number;
    firstName: string;
    username: string;
    photoUrl?: string;
    telegramId: string;
    languageCode: string;
    createdAt: string;
};

type UserContextType = {
    user: TelegramUser | null;
    loading: boolean;
    error: Error | null;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const auth = useTelegramAuth();
    return <UserContext.Provider value={auth}>{children}</UserContext.Provider>;
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used within UserProvider");
    return ctx;
}
