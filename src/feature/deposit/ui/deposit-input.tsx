
'use client';
import { useLingui } from '@lingui/react';
import { Trans, t, msg } from '@lingui/macro';
import {Input} from "@/shared/ui/input"

export function DepositInput({value, onChange}: {value: string; onChange: (v: string) => void}) {
    const {
        i18n: i18n
    } = useLingui();

    return (
        <div>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                inputMode="decimal"
                type="number"
                min={1}
                step="0.01"
                placeholder={i18n._(msg`Amount (Min: 0.1 TON)`)}
                className="bg-[#1b1636] border-[#262352] text-white placeholder:text-[#969696] h-12 rounded-xl [appearance:textfield]"
            />
        </div>
    );
}
