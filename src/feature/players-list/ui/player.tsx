"use client";;
import { Trans, t } from '@lingui/macro';
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import Image from "next/image";

export function Player({ name, bet, avatarUrl }: { name: string; bet: number; avatarUrl?: string }) {
    const initials = name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex items-center justify-between bg-[#231c46] rounded-lg p-3">
            <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={avatarUrl || "/profile/placeholder.png"} />
                    <AvatarFallback className="bg-[#533189] text-white">{initials || "PL"}</AvatarFallback>
                </Avatar>
                <span className="text-white font-medium">{name}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-white font-bold">{bet}</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center">
                    <Image src={"/tonCoin.svg"} alt={t`ton coin`} width={20} height={20} />
                </div>
            </div>
        </div>
    );
}
