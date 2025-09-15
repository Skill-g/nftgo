import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_FILE = /\.(.*)$/

function isLang(v: unknown): v is 'ru' | 'en' {
    return v === 'ru' || v === 'en'
}

function getPathLocale(pathname: string): 'ru' | 'en' | null {
    const seg = pathname.split('/')[1]
    return isLang(seg) ? seg : null
}

function swapLocaleInPath(pathname: string, next: 'ru' | 'en') {
    const parts = pathname.split('/')
    if (parts.length > 1 && (parts[1] === 'ru' || parts[1] === 'en')) {
        parts[1] = next
        return parts.join('/') || '/'
    }
    return `/${next}${pathname.startsWith('/') ? '' : '/'}${pathname}`
}

export function middleware(req: NextRequest) {
    const { nextUrl } = req
    const pathname = nextUrl.pathname

    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname === '/favicon.ico' ||
        PUBLIC_FILE.test(pathname)
    ) {
        return NextResponse.next()
    }

    const cookieLocale = req.cookies.get('locale')?.value
    const pathLocale = getPathLocale(pathname)

    if (!isLang(cookieLocale)) {
        const defaultLocale: 'ru' | 'en' = pathLocale ?? 'ru'
        if (!pathLocale) {
            const url = nextUrl.clone()
            url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`
            const res = NextResponse.redirect(url)
            res.cookies.set('locale', defaultLocale, { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' })
            return res
        }
        const res = NextResponse.next()
        res.cookies.set('locale', defaultLocale, { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' })
        return res
    }

    if (!pathLocale) {
        const url = nextUrl.clone()
        url.pathname = `/${cookieLocale}${pathname === '/' ? '' : pathname}`
        const res = NextResponse.redirect(url)
        res.cookies.set('locale', cookieLocale, { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' })
        return res
    }

    if (pathLocale !== cookieLocale) {
        const url = nextUrl.clone()
        url.pathname = swapLocaleInPath(pathname, cookieLocale as 'ru' | 'en')
        const res = NextResponse.redirect(url)
        res.cookies.set('locale', cookieLocale, { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' })
        return res
    }

    const res = NextResponse.next()
    res.cookies.set('locale', cookieLocale, { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' })
    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)'],
}
