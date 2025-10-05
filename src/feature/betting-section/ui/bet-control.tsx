"use client";

import { useLingui } from "@lingui/react";
import { Trans, msg } from "@lingui/macro";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Minus, Plus } from "lucide-react";
import { useMemo, useState, useCallback, useEffect } from "react";
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

function cn(...xs: Array<string | false>) {
    return xs.filter(Boolean).join(" ");
}

const normalize = (s: string) => s.replace(",", ".");
const toNumberSafe = (s: string) => {
    const n = Number(normalize(s.trim()));
    return Number.isFinite(n) ? n : 0;
};

export const BetControl = ({
                               presetAmounts,
                               betAmount1,
                               setBetAmount1,
                               placed,
                               waiting,
                               isActive,
                               multiplier,
                               onPlaceBet,
                               onCashOut
                           }: BetControlProps) => {
    const { i18n } = useLingui();
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [inputValue, setInputValue] = useState<string>(String(betAmount1 ?? 0));
    useEffect(() => {
        setInputValue(String(betAmount1 ?? 0));
    }, [betAmount1]);

    const commitInput = useCallback(() => {
        const num = toNumberSafe(inputValue);
        const safe = Math.max(0, num);
        setBetAmount1(safe);
        return safe;
    }, [inputValue, setBetAmount1]);

    const winSum = useMemo(() => betAmount1 * multiplier, [betAmount1, multiplier]);
    const canPlace = useMemo(() => !placed && waiting, [placed, waiting]);
    const canCashOut = useMemo(() => placed && isActive, [placed, isActive]);
    const isClosed = useMemo(() => !placed && !waiting, [placed, waiting]);
    const isWaitingPlaced = useMemo(() => placed && waiting, [placed, waiting]);
    const buttonDisabled = useMemo(() => !(canCashOut || canPlace), [canCashOut, canPlace]);
    const buttonStyle: CSSProperties = canCashOut ? { backgroundColor: "#FFCC00" } : {};
    const fixedButtonBox = "h-[64px] min-h-[64px] w-full rounded-[20px] font-bold";
    const buttonClass = cn(
        fixedButtonBox,
        canCashOut && "text-black",
        !canCashOut && canPlace && "bg-gradient-to-r from-[#8845f5] to-[#B384FF] hover:bg-[#8845f5]/80 text-white",
        isClosed && !canCashOut && !canPlace && "bg-[#1B1636] text-[#969696]",
        isWaitingPlaced && !canCashOut && "bg-[#1B1636] text-white"
    );

    const onButtonClick = useCallback(() => {
        if (canCashOut) {
            onCashOut();
            return;
        }
        if (canPlace) {
            commitInput();
            onPlaceBet();
        }
    }, [canCashOut, canPlace, onCashOut, onPlaceBet, commitInput]);

    const buttonContent = useMemo(() => {
        if (canCashOut) {
            return (
                <div className="grid place-items-center w-full h-full">
                    <div className="leading-tight text-center">
                        <div className="text-lg font-bold text-black">
                            {formatTon(winSum)} <Trans>TON</Trans>
                        </div>
                        <div className="text-black">
                            <Trans>ЗАБРАТЬ</Trans>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="grid place-items-center w-full h-full">
                <div className="leading-tight text-center">
                    <div className="text-base">
                        {isWaitingPlaced ? i18n._(msg`ОЖИДАНИЕ`) : canPlace ? i18n._(msg`СТАВИТЬ`) : i18n._(msg`СТАВКИ ЗАКРЫТЫ`)}
                    </div>
                    <div className="opacity-0 select-none text-[0px]">.</div>
                </div>
            </div>
        );
    }, [canCashOut, isWaitingPlaced, canPlace, winSum, i18n]);

    const controlsDisabled = useMemo(() => placed || !waiting, [placed, waiting]);

    const step = 0.1;
    const inc = useCallback(() => {
        const next = Math.max(0, Number((betAmount1 + step).toFixed(6)));
        setBetAmount1(next);
        setInputValue(String(next).replace(".", ","));
    }, [betAmount1, setBetAmount1]);

    const dec = useCallback(() => {
        const next = Math.max(0, Number((betAmount1 - step).toFixed(6)));
        setBetAmount1(next);
        setInputValue(String(next).replace(".", ","));
    }, [betAmount1, setBetAmount1]);

    return (
        <div className="flex bg-[#262352] rounded-[20px] p-2">
            <div className="flex flex-col bg-[#1B1636] rounded-[20px] items-center p-2 my-2 ml-0.5 gap-3">
                <div className="flex bg-[#1B1636] items-center rounded-lg gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-[#969696] hover:text-white"
                        onClick={dec}
                        disabled={controlsDisabled}
                        type="button"
                    >
                        <div className="flex justify-center items-center bg-[#241E44] rounded-[10px] w-[35px] h-[35px]">
                            <Minus className="bg-[#241E44] w-4 h-4" />
                        </div>
                    </Button>

                    <Input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        value={inputValue}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (/^[0-9]*[.,]?[0-9]*$/.test(v) || v === "") {
                                setInputValue(v);
                            }
                        }}
                        onBlur={() => {
                            const safe = commitInput();
                            setInputValue(String(safe).replace(".", ","));
                        }}
                        className="border-none text-white font-bold text-xl min-w-[60px] text-center [appearance:textfield]"
                        disabled={controlsDisabled}
                    />

                    <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-[#969696] hover:text-white"
                        onClick={inc}
                        disabled={controlsDisabled}
                        type="button"
                    >
                        <div className="flex justify-center items-center bg-[#241E44] rounded-[10px] w-[35px] h-[35px]">
                            <Plus className="w-4 h-4" />
                        </div>
                    </Button>
                </div>

                <div className="flex flex-wrap gap-1 justify-center">
                    {presetAmounts.map((amount) => (
                        <Button
                            key={amount}
                            size="sm"
                            variant="ghost"
                            className="text-[#969696] hover:text-white bg-[#241E44] rounded-[5px] min-w-[25px] h-[25px] text-xs px-0"
                            onClick={() => {
                                setBetAmount1(amount);
                                setInputValue(String(amount).replace(".", ","));
                            }}
                            disabled={controlsDisabled}
                            type="button"
                        >
                            {String(amount).replace(".", ",")}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="w-full py-2 px-1">
                <Button onClick={onButtonClick} className={`${buttonClass} h-[100%]`} style={buttonStyle} disabled={buttonDisabled} type="button">
                    {buttonContent}
                </Button>
            </div>

            <Deposit showDepositModal={showDepositModal} setShowDepositModal={setShowDepositModal} />
        </div>
    );
};
