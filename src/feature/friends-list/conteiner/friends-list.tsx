import {Thead} from "@/shared/ui/thead";
import {FriendCard} from "@/feature/friends-list/ui/friend-card";

export function FriendsList () {
    return (
        <div>
            <h3 className="text-white text-lg font-semibold mb-4">Invited (0)</h3>
            <Thead fTitle={'User'} sTitle={''} tTitle={'Profit'} />
            <div className="space-y-3">
                {[1,2,3].map((i) => {
                    return <FriendCard key={i}/>
                })}
            </div>
        </div>
    )
}