"use client"
import { createContext, useContext, useState, useEffect } from "react";
import { fetchOnlineUsersCountCached } from "@/shared/lib/backendCached";

type OnlineUsersContextType = {
    onlineCount: number | null;
    loading: boolean;
    error: Error | null;
};

const OnlineUsersContext = createContext<OnlineUsersContextType | undefined>(undefined);

export function OnlineUsersProvider({ children }: { children: React.ReactNode }) {
    const [onlineCount, setOnlineCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const count = await fetchOnlineUsersCountCached();
                if (!active) return;
                setOnlineCount(count);
            } catch (err) {
                if (!active) return;
                setError(err as Error);
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, []);

    return (
        <OnlineUsersContext.Provider value={{ onlineCount, loading, error }}>
            {children}
        </OnlineUsersContext.Provider>
    );
}

export const useOnlineUsersContext = () => {
    const context = useContext(OnlineUsersContext);
    if (context === undefined) {
        throw new Error("useOnlineUsersContext must be used within an OnlineUsersProvider");
    }
    return context;
};
