'use client'

import { useEffect, useState } from 'react'
import { I18nProvider } from '@lingui/react'
import { i18n, activate } from '@/i18n'
import { AppProviders } from '@/app/AppProviders'
import { Header } from '@/shared/ui/header'
import { BottomNav } from '@/feature/bottom-nav'
import { usePathname, useRouter } from 'next/navigation'

function isLang(v: unknown): v is 'ru' | 'en' {
    return v === 'ru' || v === 'en'
}

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
    const [phase, setPhase] = useState<'boot' | 'redirect' | 'ready'>('boot')
    const pathname = usePathname() || '/'
    const router = useRouter()

    useEffect(() => {
        let alive = true
        ;(async () => {
            let desired: 'ru' | 'en' = locale
            try {
                const ls = localStorage.getItem('locale')
                if (isLang(ls)) {
                    desired = ls
                } else {
                    localStorage.setItem('locale', locale)
                }
            } catch {
            }

            if (desired !== locale) {
                setPhase('redirect')
                const nextPath = swapLocaleInPath(pathname, desired)
                if (nextPath !== pathname) {
                    router.replace(nextPath)
                }
                return
            }

            await activate(locale)
            if (alive) setPhase('ready')
        })()

        return () => {
            alive = false
        }
    }, [locale])

    if (phase !== 'ready') {
        return <div style={{ minHeight: '100vh' }} />
    }

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
