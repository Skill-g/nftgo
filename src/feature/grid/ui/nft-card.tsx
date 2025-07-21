import {ShoppingCart} from "lucide-react";
import Image from "next/image";

interface ItemProps {
    id: number,
    price: number | string | null,
    isSelected: boolean,
    image: string,
}

export function NftCard ({toggleItemSelection, showActionButtons, price, image, isProfile, item}: {toggleItemSelection: (value: number) => void, showActionButtons: boolean, item: ItemProps, isProfile: boolean, price: string | null, image: string}) {

    return (
        <div
            className={`relative bg-gradient-to-br rounded-[20px] from-[#8845f5] to-[#533189] border-0 p-3 pl-1 pt-1 cursor-pointer transition-all ${
                item.isSelected && isProfile ? "" : ""
            } ${showActionButtons && isProfile && !item.isSelected ? "blur-sm opacity-50" : ""}`}
            onClick={() => toggleItemSelection(item.id)}
        >
            <div className="flex bg-[#383838] rounded-[50px] pl-2
             pr-2 pt-1 pb-1 text-center w-[70px] items-center gap-1 mb-2">
                <span className="text-white text-center text-xs font-semibold">{price}</span>
                <div className="w-4 h-4  rounded-full flex items-center justify-center">
                    <Image src={'/tonCoin.svg'} alt="ton coin" width={18} height={18} />
                </div>
            </div>

            <div className="relative mb-2">
                <div
                    className="w-full h-20 rounded-lg flex items-center justify-center relative overflow-hidden"
                >
                    <Image alt={'nft'} src={image} width={88} height={95} />
                </div>
            </div>

            <div className="absolute bottom-2 right-2">
                <div className="w-6 h-6 bg-[#0098ea] rounded-lg flex items-center rounded-2xl justify-center">
                    <ShoppingCart className="w-3 h-3 text-white"/>
                </div>
            </div>
        </div>
    )
}