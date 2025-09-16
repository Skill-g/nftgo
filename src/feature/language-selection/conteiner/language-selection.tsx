'use client';
'use client';
import { useLingui } from '@lingui/react';
import { Trans, t, msg } from '@lingui/macro';
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { useState } from 'react'
import { useUserContext } from '@/shared/context/UserContext'
import { usePathname, useRouter } from 'next/navigation'
type Locale = 'ru' | 'en'

function swapLocaleInPath(pathname: string, next: Locale) {
    const parts = pathname.split('/')
    if (parts.length > 1 && (parts[1] === 'ru' || parts[1] === 'en')) {
        parts[1] = next
        return parts.join('/') || '/'
    }
    return `/${next}${pathname.startsWith('/') ? '' : '/'}${pathname}`
}

function getLocaleFromPath(pathname: string): Locale {
    const seg = (pathname || '/').split('/')[1]
    return seg === 'en' ? 'en' : 'ru'
}

export function LanguageSelection() {
    const {
        i18n: i18n
    } = useLingui();

    const { user, setPreferredLanguage } = useUserContext()
    const [saving, setSaving] = useState<null | Locale>(null)
    const pathname = usePathname() || '/'
    const router = useRouter()
    const current = getLocaleFromPath(pathname)
    const selected = current === 'ru' ? 'russian' : 'english'

    const handleClick = async (lang: Locale) => {
        if (lang === current) return
        setSaving(lang)
        try {
            try {
                localStorage.setItem('locale', lang)
            } catch {}
            try {
                document.cookie = `locale=${lang}; Max-Age=31536000; Path=/; SameSite=Lax`
            } catch {}

            if (user) {
                void setPreferredLanguage(lang)
            }

            const nextPath = swapLocaleInPath(pathname, lang)
            if (nextPath !== pathname) {
                router.replace(nextPath)
            }
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
                    disabled={saving === 'ru' || current === 'ru'}
                    aria-pressed={current === 'ru'}
                    className={`flex-1 py-3 rounded-xl font-medium ${
                        selected === 'russian'
                            ? 'bg-gradient-to-r from-[#6100FF] to-[#B384FF]'
                            : 'bg-[#262352]'
                    }`}
                >
                    {saving === 'ru' ? i18n._(msg`Сохраняю...`) : i18n._(msg`Русский`)}
                </Button>

                <Button
                    onClick={() => handleClick('en')}
                    disabled={saving === 'en' || current === 'en'}
                    aria-pressed={current === 'en'}
                    className={`flex-1 py-3 rounded-xl font-medium ${
                        selected === 'english'
                            ? 'bg-gradient-to-r from-[#6100FF] to-[#B384FF]'
                            : 'bg-[#262352]'
                    }`}
                >
                    {saving === 'en' ? i18n._(msg`Saving...`) : i18n._(msg`English`)}
                </Button>
            </div>
        </Card>
    );
}
