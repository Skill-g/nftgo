"use client";
import { Trans, t } from '@lingui/macro';
import {useEffect, useMemo, useState} from "react"
import {BoardItem} from "@/feature/leaderboard/ui/board-item"
import {Thead} from "@/shared/ui/thead"
import {useUserContext} from "@/shared/context/UserContext"

type TopBettor = {
    initials: string
    games: number
    sum: number
}

type Player = {
    rank: number
    name: string
    games: number
    score: number
    gradient: string
}

function gradientByRank(rank: number) {
    if (rank === 1) return "from-[#8845f5] to-[#984eed]"
    if (rank === 2) return "from-[#0098ea] to-[#533189]"
    if (rank === 3) return "from-[#0098ea] to-[#8845f5]"
    return "from-[#1f2937] to-[#111827]"
}

export function Leaderboard() {
    const { user, loading: userLoading } = useUserContext()
    const [players, setPlayers] = useState<Player[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const initData = useMemo(() => user?.initData ?? "", [user])

    useEffect(() => {
        let ignore = false
        async function load() {
            if (!initData) {
                setPlayers([])
                setLoading(false)
                return
            }
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/game/top-bettors`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ initData })
                })
                if (!res.ok) {
                    if (res.status === 429) {
                        throw new Error("Too many requests. Try again later.")
                    }
                    throw new Error(`Request failed: ${res.status}`)
                }
                const data: TopBettor[] = await res.json()
                const mapped: Player[] = (Array.isArray(data) ? data : []).slice(0, 20).map((item, idx) => ({
                    rank: idx + 1,
                    name: item.initials,
                    games: item.games,
                    score: item.sum,
                    gradient: gradientByRank(idx + 1)
                }))
                if (!ignore) setPlayers(mapped)
            } catch (e: unknown) {
                if (!ignore) {
                    if (e instanceof Error) {
                        setError(e.message)
                    } else {
                        setError("Unknown error")
                    }
                }
            } finally {
                if (!ignore) setLoading(false)
            }
        }
        load()
        return () => { ignore = true }
    }, [initData])

    if (userLoading || loading) {
        return (
            <div className={'space-y-3 mb-20'}>
                <Thead fTitle={'Place'} sTitle={'User'} tTitle={'Turnover'}/>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-3 mb-20">
                <Thead fTitle={'Place'} sTitle={'User'} tTitle={'Turnover'}/>
                <div className="text-red-400 text-center">{error}</div>
            </div>
        )
    }

    if (!players.length) {
        return (
            <div className="space-y-3 mb-20">
                <Thead fTitle={'Place'} sTitle={'User'} tTitle={'Turnover'}/>
                <div className="text-white/70 text-center"><Trans>No data yet</Trans></div>
            </div>
        );
    }

    return (
        <div className={'space-y-3 mb-20'}>
            <Thead fTitle={'Place'} sTitle={'User'} tTitle={'Turnover'}/>
            {players.map((player) => (
                <BoardItem player={player} key={player.rank} />
            ))}
        </div>
    )
}
