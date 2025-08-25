"use client"

import {Input} from "@/shared/ui/input"

export function DepositInput({value, onChange}: {value: string; onChange: (v: string) => void}) {
    return (
        <div>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                inputMode="decimal"
                type="number"
                min={1}
                step="0.01"
                placeholder="Amount (Min: 1 TON)"
                className="bg-[#1b1636] border-[#262352] text-white placeholder:text-[#969696] h-12 rounded-xl [appearance:textfield]"
            />
        </div>
    )
}
