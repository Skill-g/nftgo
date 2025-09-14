'use client'

import { Trans } from '@lingui/macro'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { useState, startTransition } from 'react'
import { useUserContext } from '@/shared/context/UserContext'
import { usePathname, useRouter } from 'next/navigation'

function swapLocaleInPath(pathname: string, next: 'ru' | 'en') {
    const parts = pathname.split('/')
    if (parts.length > 1 && (parts[1] === 'ru' || parts[1] === 'en')) {
        parts[1] = next
        return parts.join('/') || '/'
    }
    return `/${next}${pathname.startsWith('/') ? '' : '/'}${pathname}`
}

export function LanguageSelection() {
    const { user, setPreferredLanguage } = useUserContext()
    const [saving, setSaving] = useState<null | 'ru' | 'en'>(null)
    const pathname = usePathname() || '/'
    const router = useRouter()

    const selected = user?.languageCode === 'ru' ? 'russian' : 'english'

    const handleClick = async (lang: 'ru' | 'en') => {
        if (!user) return
        try {
            setSaving(lang)
            await setPreferredLanguage(lang)
            try {
                await fetch('/api/locale', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lang }),
                    keepalive: true,
                })
            } catch {}
            const nextPath = swapLocaleInPath(pathname, lang)
            startTransition(() => {
                router.replace(nextPath)
                router.refresh()
            })
        } finally {
            setSaving(null)
        }
    }

    return (
        <Card className="bg-[#231C46] p-4 flex gap-3 mb-6 border-none">
            <h3 className="text-[#CECECE] text-sm"><Trans>Выбрать язык</Trans></h3>
            <div className="flex gap-3 bg-[#262352] rounded-2xl">
                <Button
                    onClick={() => handleClick('ru')}
                    disabled={saving === 'ru'}
                    className={`flex-1 py-3 rounded-xl font-medium ${selected === 'russian' ? 'bg-gradient-to-r from-[#6100FF] to-[#B384FF]' : 'bg-[#262352]'}`}
                >
                    {saving === 'ru' ? 'Сохраняю...' : 'Русский'}
                </Button>
                <Button
                    onClick={() => handleClick('en')}
                    disabled={saving === 'en'}
                    className={`flex-1 py-3 rounded-xl font-medium ${selected === 'english' ? 'bg-gradient-to-r from-[#6100FF] to-[#B384FF]' : 'bg-[#262352]'}`}
                >
                    {saving === 'en' ? 'Saving...' : 'English'}
                </Button>
            </div>
        </Card>
    )
}
