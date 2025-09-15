import { use } from 'react'
import LocaleClient from './LocaleClient'

export default function LocaleLayout({
                                         children,
                                         params,
                                     }: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale: raw } = use(params)
    const locale: 'ru' | 'en' = raw === 'en' ? 'en' : 'ru'
    return <LocaleClient locale={locale}>{children}</LocaleClient>
}
