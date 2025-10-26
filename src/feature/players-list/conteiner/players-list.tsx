
import { Trans } from '@lingui/macro';
import { useUserContext } from "@/shared/context/UserContext";
import { useGame } from "@/shared/hooks/useGame";
import { useBetsNow as useBetsNowReal } from "@/shared/hooks/useBetsNow";
import { useBetsNowMock } from "@/shared/hooks/useBetsNowMock";

export function PlayersList() {
    const { user } = useUserContext();
    const { state } = useGame();
    const roundId = state?.roundId ?? null;
    const initData = user?.initData ?? "";
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_BETS === "1";
    const { totalBets, error } = (useMock ? useBetsNowMock : useBetsNowReal)(roundId, initData);

    return (
        <div className="mb-6">
            <div className="mt-4 text-[#969696] text-sm">
                {error
                    ? <Trans>Не удалось загрузить ставки</Trans>
                    : <Trans>Всего ставок: {totalBets}</Trans>}
            </div>
        </div>
    );
}
