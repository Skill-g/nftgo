import { Trans, t } from '@lingui/macro';
import { Layout } from "@/feature/user-profile/conteiner/layout";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { useUserContext } from "@/shared/context/UserContext";

export function UserProfile() {
    const { user, loading, error } = useUserContext();
    if (loading) {
        return (
            <Layout>
                <div className="text-white text-xl"><Trans>Загрузка профиля...</Trans></div>
            </Layout>
        );
    }

    if (error || !user) {
        return (
            <Layout>
                <div className="text-red-400 text-xl text-center w-full"><Trans>Ошибка Авторизации</Trans></div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="w-20 h-20 rounded-xl overflow-hidden">
                <Avatar className="w-[80px] h-[80px] object-cover bg-white rounded-xl">
                    <AvatarImage src={user.photoUrl} alt={user.firstName} />
                    <AvatarFallback>{user.firstName[0]}</AvatarFallback>
                </Avatar>
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">{user.firstName}</h1>
                <p className="text-[#c2c2c2] text-lg"><Trans>User ID:</Trans>{user.id}</p>
                {user.username && (
                    <p className="text-[#aaa] text-md">@{user.username}</p>
                )}
            </div>
        </Layout>
    );
}
