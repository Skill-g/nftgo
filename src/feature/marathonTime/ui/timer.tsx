import { Trans, t } from '@lingui/macro';

export function Timer ({days, hours, minutes, seconds} : {days: number, hours: number, minutes: number, seconds: number}) {
    return (
        <div className="grid grid-cols-4 gap-3">
            <div className="bg-[#231C46] rounded-xl p-3 text-center">
                <div className="text-white text-2xl font-bold">{days}</div>
                <div className="text-[#979797] text-sm"><Trans>Day</Trans></div>
            </div>
            <div className="bg-[#231C46] rounded-xl p-3 text-center">
                <div className="text-white text-2xl font-bold">{hours}</div>
                <div className="text-[#979797] text-sm"><Trans>Hours</Trans></div>
            </div>
            <div className="bg-[#231C46] rounded-xl p-3 text-center">
                <div className="text-white text-2xl font-bold">{minutes}</div>
                <div className="text-[#979797] text-sm"><Trans>Minutes</Trans></div>
            </div>
            <div className="bg-[#231C46] rounded-xl p-3 text-center">
                <div className="text-white text-2xl font-bold">{seconds}</div>
                <div className="text-[#979797] text-sm"><Trans>Seconds</Trans></div>
            </div>
        </div>
    );
}