import { useEffect, useState } from "react";
import { fetchOnlineUsersCountCached } from "@/shared/lib/backendCached";

export function useOnlineUsers() {
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

    return { onlineCount, loading, error };
}
