import {BoardItem} from "@/feature/leaderboard/ui/board-item";
import {Thead} from "@/shared/ui/thead";


export function Leaderboard() {

    const leaderboardData = [
        { rank: 1, name: "Al***", games: 45, score: 320.8, gradient: "from-[#8845f5] to-[#984eed]" },
        { rank: 2, name: "Al***", games: 45, score: 320.8, gradient: "from-[#0098ea] to-[#533189]" },
        { rank: 3, name: "Al***", games: 45, score: 320.8, gradient: "from-[#0098ea] to-[#8845f5]" },
        { rank: 4, name: "Al***", games: 45, score: 320.8, gradient: "from-[#984eed] to-[#8845f5]" },
    ]

    return (
        <div className={'space-y-3 mb-20'}>
            <Thead fTitle={'Place'} sTitle={'User'} tTitle={'Turnover'}/>
            {leaderboardData.map((player) => {
                return (
                    <BoardItem player={player} key={player.rank} />
                )
            })}
        </div>
    )
}