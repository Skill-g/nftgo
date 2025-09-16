
'use client';
import { useLingui } from '@lingui/react';
import { Trans, t, msg } from '@lingui/macro';
import {Search} from "lucide-react";
import {Input} from "@/shared/ui/input";

export function SearchBar ({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const {
        i18n: i18n
    } = useLingui();

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#707579]"/>
            <Input
                placeholder={i18n._(msg`Find your gift...`)}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-[#231c46] border-none h-[49px] text-white placeholder:text-[#707579] pl-10 py-3 rounded-lg"
            />
        </div>
    );
}