'use client'

import {Trans} from '@lingui/macro'
import {Card, CardContent} from "@/shared/ui/card"
import {Button} from "@/shared/ui/button"
import Image from 'next/image'
import {useOnlineUsersContext} from "@/shared/context/OnlineUsersContext"

export function NewsBanner() {
    const {onlineCount, loading, error} = useOnlineUsersContext()

    const openNews = () => {
        const url = 'https://t.me/NFTgo777'
        const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
        if (tg?.openTelegramLink) tg.openTelegramLink(url)
        else if (tg?.openLink) tg.openLink(url)
        else window.open(url, '_blank', 'noopener,noreferrer')
    }

    return (
        <div className="flex items-center gap-3">
            <Card className="flex-1 bg-gradient-to-r from-[#984eed] p-2.5 to-[#8845f5] border-0">
                <CardContent className="flex flex-row items-center justify-between px-0">
                    <span className="text-white font-medium"><Trans>Check our news</Trans></span>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white text-[#8845f5] hover:bg-white/90"
                        onClick={openNews}
                    >
                        <Trans>Open</Trans>
                    </Button>
                </CardContent>
            </Card>

            <div className="bg-[#163200] border-1 border-white/50 rounded-lg p-3 flex items-center gap-2">
                <div className="flex gap-1 text-[#23c265]">
                    <Image src={'/user.svg'} width={20} height={20} alt={'user'}></Image>
                </div>
                {loading ? (
                    <span className="text-white font-bold">0</span>
                ) : error ? (
                    <span className="text-red-400 font-bold">0</span>
                ) : onlineCount === null ? (
                    <span className="text-white font-bold">0</span>
                ) : (
                    <span className="text-white font-bold">{onlineCount}</span>
                )}
            </div>
        </div>
    )
}
