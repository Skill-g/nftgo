type CacheEntry<T> = { ts: number; data: T }
type Fetcher<T> = () => Promise<T>

const mem = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()
const LS_PREFIX = 'cache:'

function lsGet<T>(key: string): CacheEntry<T> | null {
    try {
        const raw = localStorage.getItem(LS_PREFIX + key)
        if (!raw) return null
        return JSON.parse(raw) as CacheEntry<T>
    } catch {
        return null
    }
}

function lsSet<T>(key: string, entry: CacheEntry<T>) {
    try {
        localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry))
    } catch {}
}

function now() {
    return Date.now()
}

export function simpleHash(input: string): string {
    let h = 5381
    for (let i = 0; i < input.length; i++) h = (h * 33) ^ input.charCodeAt(i)
    return (h >>> 0).toString(16)
}

export async function cached<T>(
    ns: string,
    keyPart: string,
    ttlMs: number,
    fetcher: Fetcher<T>,
    revalidateIfStale = true
): Promise<T> {
    const key = `${ns}:${keyPart}`
    const m = mem.get(key) as CacheEntry<T> | undefined
    if (m && now() - m.ts < ttlMs) return m.data

    const ls = lsGet<T>(key)
    if (ls && now() - ls.ts < ttlMs) {
        const fresh = ls.data
        if (!inflight.has(key) && revalidateIfStale) {
            const p = (async () => {
                try {
                    const data = await fetcher()
                    const entry: CacheEntry<T> = { ts: now(), data }
                    mem.set(key, entry)
                    lsSet(key, entry)
                    return data
                } finally {
                    inflight.delete(key)
                }
            })()
            inflight.set(key, p)
        }
        mem.set(key, ls)
        return fresh
    }

    const running = inflight.get(key) as Promise<T> | undefined
    if (running) return running

    const p = (async () => {
        try {
            const data = await fetcher()
            const entry: CacheEntry<T> = { ts: now(), data }
            mem.set(key, entry)
            lsSet(key, entry)
            return data
        } finally {
            inflight.delete(key)
        }
    })()
    inflight.set(key, p)
    return p
}