import {Button} from "@/shared/ui/button";
import {X} from "lucide-react";

export function DepositHeader({setShowDepositModal}: {setShowDepositModal: (value: boolean) => void}) {
    return (
        <div className="flex flex-col">
            <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDepositModal(false)}
            className="text-[#bcbcbc] hover:text-white hover:bg-[#262352] self-end"
        >
            <X className="w-5 h-5" />
        </Button>
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">Deposit</h2>
                <p className="text-[#bcbcbc] text-sm">Select the method of deposit</p>
            </div>

        </div>
    )
}