'use client'

import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { useMemo } from 'react'

export default function LinguiClientProvider({
                                                 locale,
                                                 messages,
                                                 children,
                                             }: {
    locale: 'ru' | 'en'
    messages: Record<string, string>
    children: React.ReactNode
}) {
    const i18nInstance = useMemo(
        () => setupI18n({ locale, messages: { [locale]: { ...messages } } }),
        [locale, messages]
    )

    return <I18nProvider i18n={i18nInstance}>{children}</I18nProvider>
}