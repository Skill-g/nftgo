import { NextRequest, NextResponse } from 'next/server'

const LOCALES = ['ru', 'en'] as const
type Locale = typeof LOCALES[number]

function isLocale(v: string): v is Locale {
    return (LOCALES as readonly string[]).includes(v)
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next()
    }

    const seg = pathname.split('/')[1] ?? ''

    if (!isLocale(seg)) {
        const cookieRaw = req.cookies.get('locale')?.value
        const preferred: Locale = cookieRaw && isLocale(cookieRaw) ? cookieRaw : 'ru'
        const url = req.nextUrl.clone()
        url.pathname = `/${preferred}${pathname}`
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!.*\\.).*)'],
}
