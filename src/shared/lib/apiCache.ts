"use client";

import { cached, simpleHash } from "@/shared/lib/cached";

type CachedJsonInit = RequestInit & {
    ttlMs?: number;
    namespace?: string;
    revalidateIfStale?: boolean;
    cacheKeyExtras?: string[];
};

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        const suffix = text ? ` - ${text.slice(0, 200)}` : "";
        throw new Error(`Request failed: ${res.status} ${res.statusText}${suffix}`);
    }
    return (await res.json()) as T;
}

function bodyToString(body: BodyInit | null | undefined): string {
    if (!body) return "";
    if (typeof body === "string") return body;
    if (body instanceof URLSearchParams) return body.toString();
    if (body instanceof FormData) {
        try {
            const entries: string[] = [];
            body.forEach((value, key) => {
                entries.push(`${key}=${String(value)}`);
            });
            return entries.sort().join("&");
        } catch {
            return "formdata";
        }
    }
    try {
        return JSON.stringify(body);
    } catch {
        return String(body);
    }
}

export async function cachedJsonFetch<T>(url: string, init: CachedJsonInit = {}): Promise<T> {
    const {
        ttlMs = 30_000,
        namespace = "api-json",
        revalidateIfStale = true,
        cacheKeyExtras = [],
        ...requestInit
    } = init;

    const method = (requestInit.method ?? "GET").toUpperCase();
    const bodyKey = bodyToString(requestInit.body);
    const keySource = [namespace, method, url, bodyKey, ...cacheKeyExtras].join("|");
    const keyPart = simpleHash(keySource);

    return cached<T>(namespace, keyPart, ttlMs, () => fetchJson<T>(url, requestInit), revalidateIfStale);
}
