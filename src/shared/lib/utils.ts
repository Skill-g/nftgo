"use client";

export const buildQuery = (p: Record<string, string | number | boolean | undefined>) =>
    Object.entries(p)
        .filter(([, v]) => v !== undefined && v !== "" && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");

export async function fetcher<T = unknown>(url: string): Promise<T> {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Fetch failed: ${res.status} ${res.statusText} - ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
}

export const genIdempotencyKey = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `idemp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
