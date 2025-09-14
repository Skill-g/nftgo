import { NextRequest, NextResponse } from 'next/server'

const LOCALES = ['ru', 'en'] as const

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

    const seg = pathname.split('/')[1]
    if (!LOCALES.includes(seg as any)) {
        const cookieLocale = req.cookies.get('locale')?.value as 'ru' | 'en' | undefined
        const preferred = cookieLocale ?? 'ru'
        const url = req.nextUrl.clone()
        url.pathname = `/${preferred}${pathname.startsWith('/') ? '' : '/'}${pathname}`
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!.*\\.).*)'],
}
