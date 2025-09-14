'use client'

import { useEffect, useState } from 'react'
import { I18nProvider } from '@lingui/react'
import { i18n, activate } from '@/i18n'
import { AppProviders } from '@/app/AppProviders'
import { Header } from '@/shared/ui/header'
import { BottomNav } from '@/feature/bottom-nav'

export default function LocaleClient({
                                         locale,
                                         children,
                                     }: {
    locale: 'ru' | 'en'
    children: React.ReactNode
}) {
    const [ready, setReady] = useState(false)

    useEffect(() => {
        let alive = true
        ;(async () => {
            await activate(locale === 'en' ? 'en' : 'ru')
            if (alive) setReady(true)
        })()
        return () => { alive = false }
    }, [locale])

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
