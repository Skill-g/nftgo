import {Layout} from "@/feature/user-profile/conteiner/layout";
import {Avatar} from "@/shared/ui/avatar";

export function UserProfile () {
    return (
        <Layout >
            <div className="w-20 h-20 rounded-xl overflow-hidden">
                <Avatar
                    className="w-[80px] h-[80px] object-cover bg-white rounded-xl"
                />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Yasha Lava</h1>
                <p className="text-[#c2c2c2] text-lg">User ID: 4546</p>
            </div>
        </Layout>
    )
}