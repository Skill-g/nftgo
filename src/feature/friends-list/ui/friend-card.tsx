import {Avatar, AvatarFallback, AvatarImage} from "@/shared/ui/avatar";
import Image from "next/image";

export function FriendCard() {
    return (
        <div className="bg-[#262352] rounded-2xl p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Avatar className="w-10 h-10 mr-3">
                        <AvatarImage src={`/placeholder.svg?height=40&width=40`}/>
                        <AvatarFallback className="bg-[#533189] text-white">A</AvatarFallback>
                    </Avatar>
                    <span className="text-white font-medium">Al***</span>
                </div>
                <div className="flex items-center">
                    <div className="w-5 h-5 bg-[#8845f5] rounded-full flex items-center justify-center mr-2">
                        <Image src={'/tonCoin.svg'} alt={'ton coin'} width={18} height={18}/>
                    </div>
                    <span className="text-white font-bold">320.8</span>
                </div>
            </div>
        </div>
    )
}