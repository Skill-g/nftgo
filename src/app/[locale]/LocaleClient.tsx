'use client'

import { useEffect, useState, startTransition } from 'react'
import { I18nProvider } from '@lingui/react'
import { i18n, activate } from '@/i18n'
import { AppProviders } from '@/app/AppProviders'
import { Header } from '@/shared/ui/header'
import { BottomNav } from '@/feature/bottom-nav'
import { useUserContext } from '@/shared/context/UserContext'
import { usePathname, useRouter } from 'next/navigation'

function swapLocaleInPath(pathname: string, next: 'ru' | 'en') {
    const parts = pathname.split('/')
    if (parts.length > 1 && (parts[1] === 'ru' || parts[1] === 'en')) {
        parts[1] = next
        return parts.join('/') || '/'
    }
    return `/${next}${pathname.startsWith('/') ? '' : '/'}${pathname}`
}

export default function LocaleClient({
                                         locale,
                                         children,
                                     }: {
    locale: 'ru' | 'en'
    children: React.ReactNode
}) {
    const [ready, setReady] = useState(false)
    const { user, loading } = useUserContext()
    const pathname = usePathname() || '/'
    const router = useRouter()

    useEffect(() => {
        let alive = true
        ;(async () => {
            await activate(locale === 'en' ? 'en' : 'ru')
            if (alive) setReady(true)
        })()
        return () => {
            alive = false
        }
    }, [locale])

    useEffect(() => {
        if (loading) return
        const pref = user?.languageCode
        if (!pref) return
        if (pref !== locale) {
            try {
                localStorage.setItem('locale', pref)
                void fetch('/api/locale', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lang: pref }),
                    keepalive: true,
                })
            } catch {}
            const nextPath = swapLocaleInPath(pathname, pref)
            startTransition(() => {
                router.replace(nextPath)
                router.refresh()
            })
        }
    }, [loading, user?.languageCode, locale, pathname, router])

    if (!ready) return null

    return (
        <I18nProvider i18n={i18n}>
            <AppProviders>
                <Header />
                {children}
                <BottomNav />
            </AppProviders>
        </I18nProvider>
    )
}
