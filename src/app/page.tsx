"use client";

import { useMemo, useCallback } from "react";
import { Multipliers } from "@/shared/ui/multipliers";
import { NewsBanner } from "@/shared/ui/news-banner";
import { GameArea } from "@/shared/ui/gameArea/game-area";
import { BettingSection } from "@/feature/betting-section";
import { PlayersList } from "@/feature/players-list";
import { useUserContext } from "@/shared/context/UserContext";
import { getBackendHost } from "@/shared/lib/host";
import { useBalance } from "@/shared/hooks/useBalance";
import { useGame } from "@/shared/context/GameContext";

export default function Page() {
    const { user } = useUserContext();
    const initData = useMemo(() => user?.initData ?? "", [user]);
    const { setOptimistic, refresh } = useBalance(initData);

    const {
        bets,
        setBetAmount,
        setBetPlaced,
        resetBets,
        gamePhase,
        setGamePhase,
        currentMultiplier,
        setCurrentMultiplier,
        roundId,
        setRoundId,
    } = useGame();

    const placeBet = useCallback(
        async (index: number) => {
            if (!user?.initData || !roundId) return;
            const host = getBackendHost();
            if (!host) return;
            const amount = bets[index].amount;
            setOptimistic(-amount);
            try {
                const res = await fetch(`https://${host}/api/game/${roundId}/bets`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ initData: user.initData, amount }),
                });
                if (!res.ok) {
                    await refresh();
                    return;
                }
                const json: { betId: number } = await res.json();
                setBetPlaced(index, json.betId);
                await refresh();
            } catch {
                await refresh();
            }
        },
        [user?.initData, roundId, bets, setOptimistic, refresh, setBetPlaced]
    );

    const onCashOut = useCallback(
        async (index: number) => {
            if (!user?.initData || !roundId) return;
            const betId = bets[index].betId;
            if (!betId) return;
            const host = getBackendHost();
            if (!host) return;
            try {
                const res = await fetch(`https://${host}/api/game/${roundId}/cashout`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ initData: user.initData, betId }),
                });
                if (!res.ok) return;
                await res.json();
                setBetPlaced(index, null);
                await refresh();
            } catch {
                await refresh();
            }
        },
        [user?.initData, roundId, bets, refresh, setBetPlaced]
    );

    return (
        <div className="flex flex-col gap-3">
            <NewsBanner />
            <Multipliers roundId={roundId} initData={initData} />
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
