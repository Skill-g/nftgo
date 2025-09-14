'use client'

import { Trans } from '@lingui/macro'
import { Info } from 'lucide-react'

export function InfoBanner() {
    return (
        <div className="bg-[#8845f5] rounded-xl p-4 flex items-center gap-3">
            <Info className="w-5 h-5 text-white flex-shrink-0" />
            <span className="text-white text-sm">
        <Trans>Only Scratch games are counted for this Raffle</Trans>
      </span>
        </div>
    )
}