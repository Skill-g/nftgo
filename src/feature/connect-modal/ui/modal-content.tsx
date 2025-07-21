import {Button} from "@/shared/ui/button";
import {X} from "lucide-react";

export function ModalContent ({setShowModal}: {setShowModal: (value: boolean) => void}){
    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/10"
                onClick={() => setShowModal(false)}
            >
                <X className="w-6 h-6" />
            </Button>

            <div className="text-center mb-8 pt-4">
                <h3 className="text-2xl font-semibold text-white mb-4">Connect your wallet</h3>
                <p className="text-[#c2c2c2] text-sm leading-relaxed">
                    Open Wallet in Telegram or select your wallet to connect
                </p>
            </div>
        </>
    )
}