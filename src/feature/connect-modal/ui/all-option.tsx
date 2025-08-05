// src/feature/connect-modal/ui/all-option.tsx
import Image from "next/image";

export function AllOption({ wallet }: { wallet: string }) {
    const walletImages: Record<string, string> = {
        "Tonkeeper": "/tonkeeper.svg",
        "Tonhub": "/tonhub.svg",
    };

    return (
        <div
            className="flex flex-col items-center gap-1 rounded-lg cursor-pointer transition-colors"
        >
            <div className="w-20 h-20 rounded-lg flex items-center justify-center">
                <Image
                    src={walletImages[wallet] || "/default-wallet.svg"}
                    alt={wallet}
                    width={65}
                    height={65}
                />
            </div>
            <span className="text-sm text-[#c2c2c2]">{wallet}</span>
        </div>
    );
}
