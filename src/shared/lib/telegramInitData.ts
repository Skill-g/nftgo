export function getUserIdFromInitData(initData: string): number | null {
    try {
        const params = new URLSearchParams(initData);
        const userRaw = params.get("user");
        if (!userRaw) return null;
        const user = JSON.parse(userRaw);
        if (typeof user?.id === "number") return user.id;
        return null;
    } catch {
        return null;
    }
}
