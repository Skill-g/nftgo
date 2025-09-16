import { use } from 'react'
import LinguiClientProvider from './LinguiClientProvider'
import PrefetchOtherLocale from './PrefetchOtherLocale'
import { AppProviders } from '@/app/AppProviders'
import { Header } from '@/shared/ui/header'
import { BottomNav } from '@/feature/bottom-nav'

export default function LocaleLayout({
                                         children,
                                         params,
                                     }: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale: raw } = use(params)
    const locale: 'ru' | 'en' = raw === 'en' ? 'en' : 'ru'

    const mod = use(import(`@/locales/${locale}/messages`)) as {
        messages: Record<string, string>
    }

    const messages = { ...mod.messages }

    return (
        <LinguiClientProvider locale={locale} messages={messages}>
            <PrefetchOtherLocale current={locale} />
            <AppProviders>
                <Header />
                {children}
                <BottomNav />
            </AppProviders>
        </LinguiClientProvider>
    )
}
