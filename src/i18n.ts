import { i18n as core } from '@lingui/core'
import { messages as ruMessages } from '@/locales/ru/messages'

export const i18n = core

i18n.load('ru', ruMessages)
i18n.activate('ru')

const catalogs = {
    ru: () => import('@/locales/ru/messages').then(m => m.messages),
    en: () => import('@/locales/en/messages').then(m => m.messages),
} as const

export async function activate(locale: 'ru' | 'en') {
    const loader = catalogs[locale] ?? catalogs.ru
    const messages = await loader()
    i18n.load(locale, messages)
    i18n.activate(locale)
}