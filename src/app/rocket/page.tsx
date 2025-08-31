"use client";

import { useState, useCallback } from "react";
import { Multipliers } from "@/shared/ui/multipliers";
import { NewsBanner } from "@/shared/ui/news-banner";
import { GameArea } from "@/shared/ui/gameArea/game-area";
import { BettingSection } from "@/feature/betting-section";
import { PlayersList } from "@/feature/players-list";
import { useUserContext } from "@/shared/context/UserContext";
import { getBackendHost } from "@/shared/lib/host";

type Bet = { amount: number; placed: boolean; betId?: number | null };

export default function Page() {
    const { user } = useUserContext();
    const [bets, setBets] = useState<Bet[]>([
        { amount: 20, placed: false, betId: null },
        { amount: 20, placed: false, betId: null },
    ]);
    const [gamePhase, setGamePhase] = useState("waiting");
    const [currentMultiplier, setCurrentMultiplier] = useState(1);
    const [roundId, setRoundId] = useState<number | null>(null);

    const placeBet = useCallback(
        async (index: number) => {
            if (!user?.initData || !roundId) return;
            const host = getBackendHost();
            if (!host) return;
            const res = await fetch(`https://${host}/api/game/${roundId}/bets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData: user.initData, amount: bets[index].amount }),
            });
            if (!res.ok) return;
            const json: { betId: number; roundId: number; status: string; userBalance: number } = await res.json();
            setBets((prev) => prev.map((b, i) => (i === index ? { ...b, placed: true, betId: json.betId } : b)));
        },
        [user?.initData, roundId, bets]
    );

    const resetBets = useCallback(() => {
        setBets((prev) => prev.map((b) => ({ ...b, placed: false, betId: null })));
    }, []);

    const setBetAmount = useCallback((index: number, newAmount: number) => {
        setBets((prev) => prev.map((b, i) => (i === index ? { ...b, amount: newAmount } : b)));
    }, []);

    const onCashOut = useCallback(
        async (index: number) => {
            if (!user?.initData || !roundId) return;
            const betId = bets[index].betId;
            if (!betId) return;
            const host = getBackendHost();
            if (!host) return;
            const res = await fetch(`https://${host}/api/game/${roundId}/cashout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData: user.initData, betId }),
            });
            if (!res.ok) return;
            await res.json();
            setBets((prev) => prev.map((b, i) => (i === index ? { ...b, placed: false, betId: null } : b)));
        },
        [user?.initData, roundId, bets]
    );

    return (
        <div className="flex flex-col gap-3">
            <NewsBanner />
            <Multipliers />
            <div className="bg-[#8845F533]/20 h-[2px] w-[100%]" />
            {user?.initData && (
                <GameArea
                    resetBets={resetBets}
                    setGamePhase={setGamePhase}
                    setCurrentMultiplier={setCurrentMultiplier}
                    setRoundId={setRoundId}
                />
            )}
            <BettingSection
                bets={bets}
                setBetAmount={setBetAmount}
                placeBet={placeBet}
                gamePhase={gamePhase}
                currentMultiplier={currentMultiplier}
                onCashOut={onCashOut}
            />
            <PlayersList />
        </div>
    );
}
