import {Player} from "@/feature/players-list/ui/player";

export function PlayersList() {
    return (
        <div className="space-y-3 mb-6">
            <div className="mt-4 text-[#969696] text-sm">Всего ставок: 100</div>
            {[1, 2, 3].map((_, index) => {
                    return <Player key={index} name={"Yasha Lava"} bet={10}/>
                }
            )}
        </div>
    )
}