export type CurrentRound = {
    roundId: number;
    currentMultiplier?: number;
    betDeadline?: string;
    gameStartTime?: string;
    startTime?: string;
    isGamePhase?: boolean;
    serverSeedHash?: string;
};
