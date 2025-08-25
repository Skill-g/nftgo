export function getBackendHost(): string {
    const raw = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!raw) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
    return raw.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}
