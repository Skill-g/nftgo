import { useEffect, useState } from "react";

export function useOnlineUsers() {
    const [onlineCount, setOnlineCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchOnlineUsers = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/online-users`);
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

    return { onlineCount, loading, error };
}
