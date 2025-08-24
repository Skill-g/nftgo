export type CurrentRound = {
    roundId: number;
    serverSeedHash: string;
    startTime: string;
    betDeadline: string;
    currentMultiplier: number;
};

export async function fetchCurrentRound(initData?: string): Promise<CurrentRound> {
    const host = process.env.NEXT_PUBLIC_GAME_HOST!;
    const url = `https://${host}/api/game/current`;
    const res = await fetch(url, { cache: "no-store", headers: initData ? { "x-telegram-init-data": initData } : {} });
    if (!res.ok) throw new Error(`fetchCurrentRound failed ${res.status}`);
    return res.json();
}
