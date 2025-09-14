"use client";;
import { Trans, t } from '@lingui/macro';
import Image from "next/image";
import {Input} from "@/shared/ui/input";
import {useEffect, useState} from "react";

export function FilterBar({
                              min,
                              max,
                              type,
                              onValueChange,
                              value: controlledValue,
                          }: {
    min: number;
    max: number;
    type: "min" | "max";
    onValueChange?: (value: number | null) => void;
    value?: number | null;
}) {
    const [value, setValue] = useState<string>(controlledValue != null ? String(controlledValue) : "");

    useEffect(() => {
        if (controlledValue === undefined) return;
        setValue(controlledValue == null ? "" : String(controlledValue));
    }, [controlledValue]);

    useEffect(() => {
        if (value === "") {
            onValueChange?.(null);
            return;
        }
        let next = Number(value);
        if (Number.isNaN(next)) {
            next = type === "min" ? min : max;
            setValue(String(next));
        } else if (next < min) {
            next = min;
            setValue(String(next));
        } else if (next > max) {
            next = max;
            setValue(String(next));
        }
        onValueChange?.(Number.isFinite(next) ? next : null);
    }, [min, max, type, value, onValueChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    const placeholderText = type === "min" ? "min price" : "max price";

    return (
        <div className="flex-1">
            <div className="bg-[#231c46] rounded-lg pr-2 py-1.5 flex items-center">
                <Input
                    type="number"
                    className="text-[#707579] border-none text-sm text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min={min}
                    max={max}
                    placeholder={placeholderText}
                    value={value}
                    onChange={handleInputChange}
                />
                <div className="w-4 h-2.5 bg-[#0098ea] rounded-full flex items-center justify-center">
                    <Image src={'/tonCoin.svg'} alt={t`ton Coin`} width={15} height={15} />
                </div>
            </div>
        </div>
    );
}