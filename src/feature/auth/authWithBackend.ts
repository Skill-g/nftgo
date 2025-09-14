import { cached, simpleHash } from '@/shared/lib/cached'

export type AuthedUser = {
    id: number
    firstName: string
    username: string
    photoUrl?: string
    telegramId: string
    languageCode: 'ru' | 'en'
    createdAt: string
}

async function fetchAuth(initData: string): Promise<AuthedUser> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
    })
    if (!res.ok) throw new Error('Auth failed')
    return (await res.json()) as AuthedUser
}

export async function authWithBackend(initData: string): Promise<AuthedUser> {
    const key = simpleHash(initData)
    return cached<AuthedUser>('auth', key, 10 * 60 * 1000, () => fetchAuth(initData))
}
