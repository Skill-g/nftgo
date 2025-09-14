import { Trans, t } from '@lingui/macro';

export function Thead() {
    return (
        <div className="flex justify-between items-center bg-[#231C46] text-[#979797] text-sm mb-4 h-[50px] px-4 rounded-lg">
            <div className="flex gap-4">
                <span><Trans>Place</Trans></span>
                <span><Trans>User</Trans></span>
            </div>
            <span><Trans>Turnover</Trans></span>
        </div>
    );
}