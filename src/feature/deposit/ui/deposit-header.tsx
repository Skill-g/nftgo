import { Trans, t } from '@lingui/macro';
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
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-1"><Trans>Deposit</Trans></h2>
                <p className="text-[#bcbcbc] text-sm"><Trans>Select the method of deposit</Trans></p>
            </div>
        </div>
    );
}