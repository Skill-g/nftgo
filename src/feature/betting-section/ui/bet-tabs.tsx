import {Button} from "@/shared/ui/button";
import {Wallet, Lock} from "lucide-react";

export function BetTabs({activeTab, setActiveTab}: {activeTab: string, setActiveTab: (activeTab: string) => void}) {

    return (
        <div className="flex gap-2 mb-6 bg-[#262352]" style={{ borderRadius: 10}}>
            <Button
                onClick={() => setActiveTab("balance")}
                className={`flex-1 ${
                    activeTab === "balance" ? " rounded-[10px] bg-[#8845f5] text-white" : "bg-[#262352] text-[#969696]"
                }`}
            >
                <Wallet className="w-4 h-4 mr-2"/>
                Баланс
            </Button>
            <Button
                onClick={() => setActiveTab("inventory")}
                disabled={true}
                className={`flex-1 ${
                    activeTab === "inventory" ? "bg-[#8845f5] text-white" : "bg-[#262352]text-[#969696]"
                }`}
            >
                <Lock className="w-4 h-4 mr-2"/>
                Инвентарь
            </Button>
        </div>
    )
}