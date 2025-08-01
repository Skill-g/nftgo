"use client"
import { createContext, useContext, useState, useEffect } from "react";

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
        const fetchOnlineUsers = async () => {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
                if (!backendUrl) {
                    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
                }

                const response = await fetch(`${backendUrl}/api/online-users`);
                if (!response.ok) throw new Error("Failed to fetch online users");
                const data = await response.json();
                setOnlineCount(data.count);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchOnlineUsers();
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
