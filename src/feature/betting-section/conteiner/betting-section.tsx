"use client";
import { Trans } from "@lingui/macro";
import { Card, CardContent } from "@/shared/ui/card";
import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { BetControl } from "@/feature/betting-section/ui/bet-control";

type Bet = { amount: number; placed: boolean };
type BettingSectionProps = {
    bets: Bet[];
    setBetAmount: (index: number, value: number) => void;
    placeBet: (index: number) => void;
    gamePhase: string;
    currentMultiplier: number;
    onCashOut: (index: number) => void;
};

function useHysteresisBool(value: boolean, holdMs: number) {
    const [stable, setStable] = useState(value);
    const toRef = useRef<number | null>(null);
    useEffect(() => {
        if (value) {
            if (toRef.current) window.clearTimeout(toRef.current);
            setStable(true);
        } else {
            if (toRef.current) window.clearTimeout(toRef.current);
            toRef.current = window.setTimeout(() => setStable(false), holdMs) as unknown as number;
        }
        return () => {
            if (toRef.current) window.clearTimeout(toRef.current);
            toRef.current = null;
        };
    }, [value, holdMs]);
    return stable;
}

export function BettingSection({
                                   bets,
                                   setBetAmount,
                                   placeBet,
                                   gamePhase,
                                   currentMultiplier,
                                   onCashOut,
                               }: BettingSectionProps) {
    const presetAmounts = [1, 5, 10, 20, 50];
    const [activeTab, setActiveTab] = useState("balance");

    const isActiveRaw = useMemo(() => gamePhase !== "waiting", [gamePhase]);
    const isActive = useHysteresisBool(isActiveRaw, 220);
    const waitingGame = !isActive;

    const onSetBetAmount = useCallback((i: number, v: number) => setBetAmount(i, v), [setBetAmount]);

    return (
        <Card className="bg-[#231c46] border-none py-4">
            <CardContent className="px-4 gap-[1px]">
                <div className="mb-2">
          <span className="text-[#BCBCBC] text-sm">
            <Trans>Выбрать тип ставки</Trans>
          </span>
                </div>
                <div className="flex gap-2 mb-2">
                    {/* BetTabs можно оставить как есть */}
                </div>
                <div className="space-y-2">
                    {bets.map((bet, i) => (
                        <BetControl
                            key={i}
                            presetAmounts={presetAmounts}
                            betAmount1={bet.amount}
                            setBetAmount1={(value: number) => onSetBetAmount(i, value)}
                            placed={bet.placed}
                            waiting={bet.placed && waitingGame}
                            isActive={isActive}
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
