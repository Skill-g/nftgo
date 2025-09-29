'use client';
import { useLingui } from '@lingui/react';
import { Trans, t, msg } from '@lingui/macro';
import {Avatar, AvatarFallback, AvatarImage} from "@/shared/ui/avatar"
import Image from "next/image"

interface PlayerProps {
    rank: number
    gradient: string
    name: string
    games: number
    score: number
}

export function BoardItem({player}: {player: PlayerProps}) {
    const {
        i18n: i18n
    } = useLingui();

    return (
        <div
            className={`bg-gradient-to-r ${player.gradient} rounded-xl p-4 flex items-center justify-between`}
        >
            <div className="flex items-center gap-3">
                <span className="text-white font-bold text-lg">#{player.rank}</span>
                <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder.svg?height=40&width=40"/>
                    <AvatarFallback>{player.name?.slice(0,2) || "??"}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="text-white font-semibold">{player.name}</div>
                    <div className="text-white/80 text-sm"><Trans>Played</Trans>{player.games}<Trans>games</Trans></div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-[#0098ea] rounded-full flex items-center justify-center">
                    <Image src={'/ton.svg'} alt={i18n._(msg`ton coin`)} width={18} height={18}/>
                </div>
                <span className="text-white font-bold">{player.score}</span>
            </div>
        </div>
    );
}
