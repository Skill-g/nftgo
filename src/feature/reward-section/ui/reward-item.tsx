'use client';
'use client';
import { useLingui } from '@lingui/react';
import { t, msg } from '@lingui/macro';
import { JSX } from 'react'
import Image from 'next/image'

export function RewardItem({ place }: { place: number }): JSX.Element {
    const {
        i18n: i18n
    } = useLingui();

    const label = place === 1 ? i18n._(msg`1st`) : place === 2 ? i18n._(msg`2nd`) : i18n._(msg`3rd`)

    return (
        <div className="bg-gradient-to-b from-[#6100FF80] to-[#B384FF80] rounded-xl p-2 text-center">
            <div className="flex justify-center items-center bg-gradient-to-b from-[#383838] to-[#585858] rounded-[50px] pl-2 pr-1 pt-0.5 w-[40px] gap-1 mb-2">
                <div className="text-white text-sm mb-2">{label}</div>
            </div>
            <div className="relative mb-2">
                <div className="w-full h-20 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <Image alt={i18n._(msg`nft`)} src="/nft-1.png" width={88} height={95} />
                </div>
            </div>
        </div>
    );
}