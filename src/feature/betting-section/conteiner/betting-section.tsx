"use client";
import { Trans } from "@lingui/macro";
import { Card, CardContent } from "@/shared/ui/card";
import { useCallback, useMemo } from "react";
import { BetControl } from "@/feature/betting-section/ui/bet-control";

type Bet = { amount: number; betId: number | null };
type BettingSectionProps = {
    bets: Bet[];
    setBetAmount: (index: number, value: number) => void;
    placeBet: (index: number) => void;
    gamePhase: "waiting" | "running" | "crashed" | string;
    currentMultiplier: number;
    onCashOut: (index: number) => void;
};

export function BettingSection({
                                   bets,
                                   setBetAmount,
                                   placeBet,
                                   gamePhase,
                                   currentMultiplier,
                                   onCashOut,
                               }: BettingSectionProps) {
    const presetAmounts = [1, 5, 10, 20, 50];
    const isWaiting = useMemo(() => gamePhase === "waiting", [gamePhase]);
    const isRunning = useMemo(() => gamePhase === "running", [gamePhase]);

    const onSetBetAmount = useCallback((i: number, v: number) => setBetAmount(i, v), [setBetAmount]);

    return (
        <Card className="bg-[#231c46] border-none py-4">
            <CardContent className="px-4 gap-[1px]">
                <div className="mb-2">
          <span className="text-[#BCBCBC] text-sm">
            <Trans>Выбрать тип ставки</Trans>
          </span>
                </div>
                <div className="flex gap-2 mb-2" />
                <div className="space-y-2">
                    {bets.map((bet, i) => (
                        <BetControl
                            key={i}
                            presetAmounts={presetAmounts}
                            betAmount1={bet.amount}
                            setBetAmount1={(value: number) => onSetBetAmount(i, value)}
                            placed={bet.betId != null}
                            waiting={isWaiting}
                            isActive={isRunning}
                            multiplier={currentMultiplier}
                            onPlaceBet={() => placeBet(i)}
                            onCashOut={() => onCashOut(i)}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
