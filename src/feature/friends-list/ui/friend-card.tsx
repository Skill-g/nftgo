'use client';
import { useLingui } from '@lingui/react';
import { Trans, t, msg } from '@lingui/macro';
import {Avatar, AvatarFallback, AvatarImage} from "@/shared/ui/avatar";
import Image from "next/image";

type FriendCardProps = {
    username: string;
    profit: number;
    avatarUrl?: string;
};

export function FriendCard({username, profit, avatarUrl}: FriendCardProps) {
    const {
        i18n: i18n
    } = useLingui();

    return (
        <div className="bg-[#262352] rounded-2xl p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Avatar className="w-10 h-10 mr-3">
                        {avatarUrl ? (
                            <AvatarImage src={avatarUrl}/>
                        ) : (
                            <AvatarFallback className="bg-[#533189] text-white"><Trans>A</Trans></AvatarFallback>
                        )}
                    </Avatar>
                    <span className="text-white font-medium">{username}</span>
                </div>
                <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2">
                        <Image src={'/ton.svg'} alt={i18n._(msg`ton coin`)} width={18} height={18}/>
                    </div>
                    <span className="text-white font-bold">{profit.toFixed(1)}</span>
                </div>
            </div>
        </div>
    );
}