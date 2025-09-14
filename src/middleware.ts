import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_FILE = /\.(.*)$/
const LOCALES = ['ru','en']

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    if (
        PUBLIC_FILE.test(pathname) ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next')
    ) return

    const hasLocale = LOCALES.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
    if (!hasLocale) {
        const url = req.nextUrl.clone()
        url.pathname = `/ru${pathname}`
        return NextResponse.redirect(url)
    }
}

export const config = {
    matcher: ['/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|assets).*)'],
}