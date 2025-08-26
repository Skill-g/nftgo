"use client";

import { Player } from "@/feature/players-list/ui/player";
import { useUserContext } from "@/shared/context/UserContext";
import { useGame } from "@/shared/hooks/useGame";
import { useBetsNow } from "@/shared/hooks/useBetsNow";

function maskUser(userId: number, usernameMasked?: string) {
    if (usernameMasked && usernameMasked.trim()) return usernameMasked;
    const suffix = String(userId).slice(-4).padStart(4, "0");
    return `Игрок •••${suffix}`;
}

export function PlayersList() {
    const { user } = useUserContext();
    const { state } = useGame();
    const roundId = state?.roundId ?? null;
    const initData = user?.initData ?? "";
    const { bets, totalBets, loading, error } = useBetsNow(roundId, initData);

    return (
        <div className="space-y-3 mb-6">
            <div className="mt-4 text-[#969696] text-sm">
                {error ? "Не удалось загрузить ставки" : loading ? "Загружаем ставки…" : `Всего ставок: ${totalBets}`}
            </div>
            {(bets.length ? bets : []).slice(0, 50).map((b) => (
                <Player key={b.betId} name={maskUser(b.userId, b.usernameMasked)} bet={b.amount} avatarUrl={b.avatarUrl} />
            ))}
            {!loading && !error && bets.length === 0 && <div className="text-[#969696] text-sm">Пока нет ставок в этом раунде.</div>}
        </div>
    );
}
