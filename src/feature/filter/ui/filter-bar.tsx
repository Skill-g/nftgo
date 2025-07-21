"use client"

import Image from "next/image";
import {Input} from "@/shared/ui/input";
import {useEffect, useState} from "react";

export function FilterBar({min, max, type, onValueChange}: {min: number, max: number, onValueChange?: (value: number) => void, type: "min" | "max";}) {

    const [value, setValue] = useState<string>("");

    useEffect(() => {
        if (value === "") {
            return;
        }

        let newValue = Number(value);
        if (isNaN(newValue)) {
            newValue = type === "min" ? min : max;
            setValue(newValue.toString());
        } else if (newValue < min) {
            newValue = min;
            setValue(newValue.toString());
        } else if (newValue > max) {
            newValue = max;
            setValue(newValue.toString());
        }
        if (onValueChange && !isNaN(newValue)) {
            onValueChange(newValue);
        }
    }, [min, max, type, onValueChange, value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        let newValue: string = inputValue;

        if (inputValue !== "" && !isNaN(Number(inputValue))) {
            const numValue = Number(inputValue);
            if (numValue < min) {
                newValue = min.toString();
            } else if (numValue > max) {
                newValue = max.toString();
            }
        }

        setValue(newValue);
        if (onValueChange && !isNaN(Number(newValue))) {
            onValueChange(Number(newValue));
        }
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
                    <Image src={'/tonCoin.svg'} alt={"ton Coin"} width={15} height={15} />
                </div>
            </div>
        </div>
    )
}