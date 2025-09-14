import { NextResponse } from 'next/server'

type Lang = 'ru' | 'en'

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null
}

function isLang(v: unknown): v is Lang {
    return v === 'ru' || v === 'en'
}

export async function POST(req: Request) {
    let body: unknown
    try {
        body = await req.json()
    } catch {
        body = null
    }

    const raw = isRecord(body) ? (body.lang as unknown) : undefined
    const lang = isLang(raw) ? raw : undefined

    if (!lang) {
        return NextResponse.json({ error: 'bad lang' }, { status: 400 })
    }

    const res = new NextResponse(null, { status: 204 })
    res.cookies.set('locale', lang, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
    })
    return res
}
