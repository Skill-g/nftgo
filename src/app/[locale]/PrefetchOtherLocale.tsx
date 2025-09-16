'use client'
import { useEffect } from 'react'

export default function PrefetchOtherLocale({ current }: { current: 'ru' | 'en' }) {
    useEffect(() => {
        if (current === 'ru') {
            void import(/* webpackPrefetch: true */ '@/locales/en/messages')
        } else {
            void import(/* webpackPrefetch: true */ '@/locales/ru/messages')
        }
    }, [current])

    return null
}
