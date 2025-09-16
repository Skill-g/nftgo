'use client'
import { useEffect } from 'react'

export default function PrefetchOtherLocale({ current }: { current: 'ru' | 'en' }) {
    useEffect(() => {
        if (current === 'ru') {
            import(/* webpackPrefetch: true */ '@/locales/en/messages.js')
        } else {
            import(/* webpackPrefetch: true */ '@/locales/ru/messages.js')
        }
    }, [current])
    return null
}
