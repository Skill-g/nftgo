'use client'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@/i18n'

export default function LinguiClientProvider({
                                                 locale,
                                                 messages,
                                                 children,
                                             }: {
    locale: 'ru' | 'en'
    messages: Record<string, string>
    children: React.ReactNode
}) {
    i18n.load(locale, messages)
    i18n.activate(locale)
    return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
