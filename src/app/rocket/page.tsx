"use client";

import { useState } from "react";
import { Multipliers } from "@/shared/ui/multipliers";
import { NewsBanner } from "@/shared/ui/news-banner";
import { GameArea } from "@/shared/ui/gameArea/game-area";
import { BettingSection } from "@/feature/betting-section";
import { PlayersList } from "@/feature/players-list";

export default function Page() {
    const [bets, setBets] = useState([
        { amount: 20, placed: false },
        { amount: 20, placed: false }
    ]);
    const [gamePhase, setGamePhase] = useState("waiting");
    const [currentMultiplier, setCurrentMultiplier] = useState(1);

    const placeBet = (index: number) => {
        setBets(prev => prev.map((b, i) =>
            i === index ? { ...b, placed: true } : b
        ));
    };

    const resetBets = () => {
        setBets(prev => prev.map(b => ({ ...b, placed: false })));
    };

    const setBetAmount = (index: number, newAmount: number) => {
        setBets(prev => prev.map((b, i) =>
            i === index ? { ...b, amount: newAmount } : b
        ));
    };

    const onCashOut = (i: number) => {
        setBets(prev => prev.map((b, idx) => idx === i ? { ...b, placed: false } : b));
    };

    return (
        <div className="flex flex-col gap-3">
            <NewsBanner/>
            <Multipliers/>
            <div className={'bg-[#8845F533]/20 h-[2px] w-[100%] '}></div>
            <GameArea
                 // bets={bets}
                resetBets={resetBets}
                setGamePhase={setGamePhase}
                setCurrentMultiplier={setCurrentMultiplier}
            />
            <BettingSection
                bets={bets}
                setBetAmount={setBetAmount}
                placeBet={placeBet}
                // resetBet={resetBets}
                gamePhase={gamePhase}
                currentMultiplier={currentMultiplier}
                onCashOut={onCashOut}
            />
            <PlayersList/>
        </div>
    )
}
