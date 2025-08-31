"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { useState } from "react";
import { BetTabs } from "@/feature/betting-section/ui/bet-tabs";
import { BetControl } from "@/feature/betting-section/ui/bet-control";

type Bet = {
    amount: number;
    placed: boolean;
};

type BettingSectionProps = {
    bets: Bet[];
    setBetAmount: (index: number, value: number) => void;
    placeBet: (index: number) => void;
    gamePhase: string;
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
    const [activeTab, setActiveTab] = useState("balance");
    const waitingGame = gamePhase === "waiting";
    const isActive = gamePhase !== "waiting";

    return (
        <Card className="bg-[#231c46] border-none py-4">
            <CardContent className="px-4 gap-[1px]">
                <div className="mb-2">
                    <span className="text-[#969696] text-sm">Выбрать тип ставки</span>
                </div>
                <BetTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="space-y-2">
                    {bets.map((bet, i) => (
                        <BetControl
                            key={i}
                            presetAmounts={presetAmounts}
                            betAmount1={bet.amount}
                            setBetAmount1={(value: number) => setBetAmount(i, value)}
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
