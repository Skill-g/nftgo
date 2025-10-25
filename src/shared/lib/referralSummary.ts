import { cached, simpleHash } from '@/shared/lib/cached'

export type ReferralSummary = {
    totalReferrals: number
    referralBalance: number
    invited: Array<{
        userId: number
        usernameMasked: string
        profit: number
        avatarUrl?: string
    }>
}

type ReferralLinkResponse = {
    shareUrl: string
}

async function fetchReferralSummary(initData: string): Promise<ReferralSummary> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/referral/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
    })
    if (!res.ok) throw new Error('Failed to fetch referral summary')
    return (await res.json()) as ReferralSummary
}

export async function referralSummaryCached(initData: string): Promise<ReferralSummary> {
    const key = simpleHash(initData)
    return cached<ReferralSummary>('referral', key, 5 * 60 * 1000, () => fetchReferralSummary(initData))
}

async function fetchReferralLink(initData: string): Promise<string> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/referral/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
    })
    if (!res.ok) throw new Error('Failed to fetch referral link')
    const data = (await res.json()) as ReferralLinkResponse
    if (!data.shareUrl) throw new Error('Referral link payload is malformed')
    return data.shareUrl
}

export async function referralLinkCached(initData: string): Promise<string> {
    const key = simpleHash(`link:${initData}`)
    return cached<string>('referral-link', key, 5 * 60 * 1000, () => fetchReferralLink(initData))
}
