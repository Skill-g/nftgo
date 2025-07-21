import {Avatar, AvatarFallback, AvatarImage} from "@/shared/ui/avatar";
import Image from "next/image";

export function Player({name, bet}: {name: string, bet: number}) {
    return (
        <div className="flex items-center justify-between bg-[#231c46] rounded-lg p-3">
            <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder.svg?height=40&width=40"/>
                    <AvatarFallback className="bg-[#533189] text-white">YL</AvatarFallback>
                </Avatar>
                <span className="text-white font-medium">{name}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-white font-bold">{bet}</span>
                <div className="w-6 h-6 bg-[#8845f5] rounded-full flex items-center justify-center">
                    <Image src={'/tonCoin.svg'} alt={'ton coin'} width={20} height={20} />
                </div>
            </div>
        </div>
    )
}