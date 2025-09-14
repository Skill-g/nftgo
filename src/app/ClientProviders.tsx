'use client'

import '@/i18n'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@/i18n'
import { AppProviders } from '@/app/AppProviders'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider i18n={i18n}>
            <AppProviders>
                <div className="bg-[#150f27] min-h-screen text-white px-[15px] mx-auto relative">
                    {children}
                </div>
            </AppProviders>
        </I18nProvider>
    )
}
