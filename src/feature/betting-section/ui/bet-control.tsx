import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Deposit } from "@/feature/deposit";
import { CSSProperties, ReactNode } from "react";

type BetControlProps = {
    presetAmounts: number[];
    betAmount1: number;
    setBetAmount1: (value: number) => void;
    placed: boolean;
    waiting: boolean;
    isActive: boolean;
    multiplier: number;
    onPlaceBet: () => void;
    onCashOut: () => void;
};

export function BetControl({
                               presetAmounts,
                               betAmount1,
                               setBetAmount1,
                               placed,
                               waiting,
                               isActive,
                               multiplier,
                               onPlaceBet,
                               onCashOut,
                           }: BetControlProps) {
    const [showDepositModal, setShowDepositModal] = useState(false);

    let buttonStyle: CSSProperties = {};
    let winSum = 0;
    if (typeof betAmount1 === "number" && typeof multiplier === "number") {
        winSum = Math.floor(betAmount1 * multiplier);
    }

    let buttonContent: ReactNode = "СТАВИТЬ";
    let buttonClass = "bg-gradient-to-r from-[#8845f5] to-[#B384FF] hover:bg-[#8845f5]/80 text-white";
    let buttonDisabled = false;
    let buttonOnClick: (() => void) | undefined = onPlaceBet;

    if (placed && waiting) {
        buttonContent = "ОЖИДАНИЕ";
        buttonClass = "bg-[#1B1636] text-white";
        buttonDisabled = true;
        buttonOnClick = undefined;
    }

    if (placed && !waiting) {
        buttonContent = (
            <div className="flex flex-col items-center leading-tight">
                <span className="text-lg font-bold mb-1 text-white">{winSum} TON</span>
                <span className="text-white">ЗАБРАТЬ</span>
            </div>
        );
        buttonClass = "text-black";
        buttonStyle = {
            background: "linear-gradient(137deg, #18CD00 5.88%, #54BA39 46.39%, #067200 92.75%)",
        };
        buttonDisabled = false;
        buttonOnClick = onCashOut;
    }

    if (!placed && isActive) {
        buttonContent = "СТАВКИ ЗАКРЫТЫ";
        buttonClass = "bg-[#1B1636] text-[#969696]";
        buttonDisabled = true;
        buttonOnClick = undefined;
    }

    const controlsDisabled = placed || (!placed && isActive);

    return (
        <div className="flex bg-[#262352] rounded-[20px] p-2">
            <div className="flex flex-col bg-[#1B1636] rounded-[20px] items-center p-2 my-2 ml-0.5 gap-3">
                <div className="flex bg-[#1B1636] items-center rounded-lg gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-[#969696] hover:text-white"
                        onClick={() => setBetAmount1(Math.max(1, betAmount1 - 1))}
                        disabled={controlsDisabled}
                    >
                        <div className="flex justify-center items-center bg-[#241E44] rounded-[10px] w-[35px] h-[35px]">
                            <Minus className="bg-[#241E44] w-4 h-4" />
                        </div>
                    </Button>
                    <Input
                        type="number"
                        value={betAmount1}
                        onChange={(event) => setBetAmount1(Number(event.target.value))}
                        className="border-none text-white font-bold text-xl min-w-[40px] text-center [appearance:textfield]"
                        disabled={controlsDisabled}
                    />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-[#969696] hover:text-white"
                        onClick={() => setBetAmount1(betAmount1 + 1)}
                        disabled={controlsDisabled}
                    >
                        <div className="flex justify-center items-center bg-[#241E44] rounded-[10px] w-[35px] h-[35px]">
                            <Plus className="w-4 h-4" />
                        </div>
                    </Button>
                </div>
                <div className="flex gap-1">
                    {presetAmounts.map((amount: number) => (
                        <Button
                            key={amount}
                            size="sm"
                            variant="ghost"
                            className="text-[#969696] hover:text-white bg-[#241E44] rounded-[5px] w-[30px] h-[20px] text-xs"
                            onClick={() => setBetAmount1(amount)}
                            disabled={controlsDisabled}
                        >
                            {amount}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="w-[100%] py-2 px-1">
                <Button
                    onClick={buttonOnClick}
                    className={`rounded-[20px] font-bold w-[100%] h-[100%] ${buttonClass}`}
                    style={buttonStyle}
                    disabled={buttonDisabled}
                >
                    {buttonContent}
                </Button>
            </div>
            <Deposit showDepositModal={showDepositModal} setShowDepositModal={setShowDepositModal} />
        </div>
    );
}
