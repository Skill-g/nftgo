import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const { lang } = await req.json()
    if (lang !== 'ru' && lang !== 'en') return NextResponse.json({ ok: false }, { status: 400 })
    const res = NextResponse.json({ ok: true })
    res.cookies.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
}
