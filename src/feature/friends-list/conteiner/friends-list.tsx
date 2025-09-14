import { Trans, t } from '@lingui/macro';
import { Thead } from "@/shared/ui/thead";
import { FriendCard } from "@/feature/friends-list/ui/friend-card";
import { useUserContext } from "@/shared/context/UserContext";

export function FriendsList() {
    const { referralData, loading, error } = useUserContext();

    if (loading) return <div className="text-white"><Trans>Загрузка...</Trans></div>;
    if (error) return <div className="text-red-400"><Trans>Error:</Trans>{error.message}</div>;

    return (
        <div>
            <h3 className="text-white text-lg font-semibold mb-4"><Trans>Invited (</Trans>{referralData?.totalReferrals || 0})
            </h3>
            <Thead fTitle={'User'} sTitle={''} tTitle={'Profit'} />
            <div className="space-y-3">
                {referralData?.invited.map((friend) => (
                    <FriendCard
                        key={friend.userId}
                        username={friend.usernameMasked}
                        profit={friend.profit}
                        avatarUrl={friend.avatarUrl}
                    />
                ))}
            </div>
        </div>
    );
}
