import { Trans, t } from '@lingui/macro';
import {Button} from "@/shared/ui/button";
import {Wallet} from "lucide-react";
import Image from "next/image";

export function BetTabs({activeTab, setActiveTab}: {activeTab: string, setActiveTab: (activeTab: string) => void}) {

    return (
        <div className="flex gap-2 mb-3 bg-[#262352]" style={{ borderRadius: 10}}>
            <Button
                onClick={() => setActiveTab("balance")}
                className={`flex-1 ${
                    activeTab === "balance" ? " rounded-[10px] bg-[#8845f5] text-white" : "bg-[#262352] text-[#FFFFFF]"
                }`}
            >
                <Wallet className="w-4 h-4"/><Trans>Баланс</Trans></Button>
            <Button
                onClick={() => setActiveTab("inventory")}
                disabled={true}
                className={`flex-1 ${
                    activeTab === "inventory" ? "bg-[#8845f5] text-white" : "bg-[#262352]text-[#FFFFFF]"
                }`}
            >
                <Image src={'/lock.svg'} width={20} height={20} alt={'lock'} className="w-4 h-4"></Image><Trans>Инвентарь</Trans></Button>
        </div>
    );
}