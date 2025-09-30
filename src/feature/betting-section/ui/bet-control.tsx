"use client";
import { useLingui } from "@lingui/react";
import { Trans, msg } from "@lingui/macro";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Minus, Plus } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import type { CSSProperties } from "react";
import { Deposit } from "@/feature/deposit";

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

function formatTon(n: number, minFrac = 1, maxFrac = 6): string {
    const fixed = n.toFixed(maxFrac);
    const trimmed = fixed.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
    if (trimmed.includes(".")) return trimmed;
    return Number(n).toFixed(minFrac);
}

function classNames(...xs: Array<string | false>) {
    return xs.filter(Boolean).join(" ");
}

export const BetControl = ({
                               presetAmounts,
                               betAmount1,
                               setBetAmount1,
                               placed,
                               waiting,
                               isActive,
                               multiplier,
                               onPlaceBet,
                               onCashOut,
                           }: BetControlProps) => {
    const { i18n } = useLingui();
    const [showDepositModal, setShowDepositModal] = useState(false);

    const winSum = useMemo(() => betAmount1 * multiplier, [betAmount1, multiplier]);

    const canPlace = useMemo(() => !placed && waiting, [placed, waiting]);
    const canCashOut = useMemo(() => placed && isActive, [placed, isActive]);
    const isClosed = useMemo(() => !placed && !waiting, [placed, waiting]);
    const isWaitingPlaced = useMemo(() => placed && waiting, [placed, waiting]);

    const buttonDisabled = useMemo(() => {
        if (canCashOut) return false;
        if (canPlace) return false;
        return true;
    }, [canCashOut, canPlace]);

    const buttonStyle: CSSProperties = canCashOut ? { backgroundColor: "#FFCC00" } : {};

    const buttonClass = classNames(
        canCashOut && "text-black rounded-[20px] font-bold w-[100%] h-[100%]",
        isClosed && !canCashOut && !canPlace && "bg-[#1B1636] text-[#969696] rounded-[20px] font-bold w-[100%] h-[100%]",
        isWaitingPlaced && !canCashOut && "bg-[#1B1636] text-white rounded-[20px] font-bold w-[100%] h-[100%]",
        !canCashOut && canPlace && "bg-gradient-to-r from-[#8845f5] to-[#B384FF] hover:bg-[#8845f5]/80 text-white rounded-[20px] font-bold w-[100%] h-[100%]"
    );

    const onButtonClick = useCallback(() => {
        if (canCashOut) {
            onCashOut();
            return;
        }
        if (canPlace) {
            onPlaceBet();
        }
    }, [canCashOut, canPlace, onCashOut, onPlaceBet]);

    const buttonContent = useMemo(() => {
        if (canCashOut) {
            return (
                <div className="flex flex-col items-center leading-tight">
          <span className="text-lg font-bold mb-1 text-black">
            {formatTon(winSum)} <Trans>TON</Trans>
          </span>
                    <span className="text-black">
            <Trans>ЗАБРАТЬ</Trans>
          </span>
                </div>
            );
        }
        if (isWaitingPlaced) return i18n._(msg`ОЖИДАНИЕ`);
        if (canPlace) return i18n._(msg`СТАВИТЬ`);
        return i18n._(msg`СТАВКИ ЗАКРЫТЫ`);
    }, [canCashOut, isWaitingPlaced, canPlace, winSum, i18n]);

    const controlsDisabled = useMemo(() => placed || !waiting, [placed, waiting]);

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
                        type="button"
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
                        type="button"
                    >
                        <div className="flex justify-center items-center bg-[#241E44] rounded-[10px] w-[35px] h-[35px]">
                            <Plus className="w-4 h-4" />
                        </div>
                    </Button>
                </div>
                <div className="flex gap-1">
                    {presetAmounts.map((amount) => (
                        <Button
                            key={amount}
                            size="sm"
                            variant="ghost"
                            className="text-[#969696] hover:text-white bg-[#241E44] rounded-[5px] w-[30px] h-[20px] text-xs"
                            onClick={() => setBetAmount1(amount)}
                            disabled={controlsDisabled}
                            type="button"
                        >
                            {amount}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="w-[100%] py-2 px-1">
                <Button onClick={onButtonClick} className={buttonClass} style={buttonStyle} disabled={buttonDisabled} type="button">
                    {buttonContent}
                </Button>
            </div>
            <Deposit showDepositModal={showDepositModal} setShowDepositModal={setShowDepositModal} />
        </div>
    );
};
