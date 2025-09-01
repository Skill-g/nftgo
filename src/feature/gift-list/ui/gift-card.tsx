"use client";

import Image from "next/image";
import {ShoppingCart} from "lucide-react";

export function GiftCard({
                             title,
                             price,
                             imageUrl,
                             disabled,
                             onClick,
                         }: {
    title: string;
    price: number;
    imageUrl: string;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative w-full text-left rounded-[20px] p-3 pl-1 pt-1 w-[130px] h-[130px] transition-all bg-[linear-gradient(214deg,_rgba(97,0,255,0.5)_20.44%,_rgba(179,132,255,0.5)_96.63%)] ${
                disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
        >
            <div className="flex bg-[#383838] rounded-[50px] pl-2 pr-2 pt-1 pb-1 text-center w-max items-center gap-1 mb-2 ml-[-14px]">
                <span className="text-white text-center text-xs font-semibold">{price.toFixed(3)}</span>
                <div className="w-4 h-4 rounded-full flex items-center justify-center">
                    <Image src={"/tonCoin.svg"} alt="ton coin" width={18} height={18} />
                </div>
            </div>

            <div className="relative mb-2">
                <div className="w-full rounded-lg flex items-end justify-center relative overflow-hidden w-[88px] h-[95px]">
                    <img
                        src={imageUrl}
                        alt={title}
                        loading="lazy"
                        className="w-[88px] h-[95px] object-contain select-none pointer-events-none"
                    />
                    <div className="px-1 pb-1 bg-[#0098EA] rounded-[6px] flex p-[3px] items-end gap-[10px]">
                        <Image src={"/shopping-cart.svg"} alt="ton coin" width={18} height={18} />
                    </div>
                </div>

            </div>


        </button>
    );
}
