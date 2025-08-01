import Image from "next/image";
import { Button } from "@/shared/ui/button";
import { useUserContext } from "@/shared/context/UserContext";

export function ReferralBalance() {
    const { referralData, loading, error } = useUserContext();

    if (loading) return <div className="text-white">Загрузка...</div>;
    if (error) return <div className="text-red-400">Error: {error.message}</div>;

    return (
        <div className="bg-[#262352] rounded-2xl p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[#929292] text-sm mb-1">Referral balance</div>
                    <div className="flex items-center">
                        <div className="w-5 h-5 bg-[#8845f5] rounded-full flex items-center justify-center mr-2">
                            <Image src={'/tonCoin.svg'} alt={"ton Coin"} width={18} height={18} />
                        </div>
                        <span className="text-white text-xl font-bold">
              {referralData?.referralBalance.toFixed(2) || "0.00"}
            </span>
                    </div>
                </div>
                <Button className="bg-[#8845f5] hover:bg-[#533189] text-white rounded-[10px] px-6 py-2">Withdraw</Button>
            </div>
        </div>
    );
}
