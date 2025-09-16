
import { Trans, t } from '@lingui/macro';
import { Player } from "@/feature/players-list/ui/player";
import { useUserContext } from "@/shared/context/UserContext";
import { useGame } from "@/shared/hooks/useGame";
import { useBetsNow as useBetsNowReal } from "@/shared/hooks/useBetsNow";
import { useBetsNowMock } from "@/shared/hooks/useBetsNowMock";

const maskUser = (userId: number, usernameMasked?: string) =>
    usernameMasked?.trim() || `Игрок •••${String(userId).slice(-4).padStart(4,"0")}`;

export function PlayersList() {
    const { user } = useUserContext();
    const { state } = useGame();
    const roundId = state?.roundId ?? null;
    const initData = user?.initData ?? "";
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_BETS === "1"
    const { bets, totalBets, loading, error } = (useMock ? useBetsNowMock : useBetsNowReal)(roundId, initData);

    return (
        <div className="space-y-3 mb-6">
            <div className="mt-4 text-[#969696] text-sm">
                {error
                    ? <Trans>Не удалось загрузить ставки</Trans>
                    : loading
                        ? <Trans>Загружаем ставки…</Trans>
                        : <Trans>Всего ставок: {totalBets}</Trans>}
            </div>
            {(bets.length ? bets : []).slice(0, 50).map((b) => (
                <Player key={b.betId} name={maskUser(b.userId, b.usernameMasked)} bet={b.amount} avatarUrl={b.avatarUrl} />
            ))}
            {!loading && !error && bets.length === 0 && <div className="text-[#969696] text-sm text-center"><Trans>Пока нет ставок в этом раунде.</Trans></div>}
        </div>
    );
}
