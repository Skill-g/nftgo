"use client";

import Image from "next/image";

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
            className={`relative w-full text-left bg-gradient-to-br rounded-[20px] from-[#8845f5] to-[#533189] p-3 pl-1 pt-1 transition-all ${
                disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
        >
            <div className="flex bg-[#383838] rounded-[50px] pl-2 pr-2 pt-1 pb-1 text-center w-[90px] items-center gap-1 mb-2">
                <span className="text-white text-center text-xs font-semibold">{price.toFixed(3)}</span>
                <div className="w-4 h-4 rounded-full flex items-center justify-center">
                    <Image src={"/tonCoin.svg"} alt="ton coin" width={18} height={18} />
                </div>
            </div>

            <div className="relative mb-2">
                <div className="w-full h-24 rounded-lg flex items-center justify-center relative overflow-hidden bg-[#150f27]">
                    <img
                        src={imageUrl}
                        alt={title}
                        loading="lazy"
                        className="w-[88px] h-[95px] object-contain select-none pointer-events-none"
                    />
                </div>
            </div>

            <div className="px-1 pb-1">
                <div className="text-white text-sm font-medium line-clamp-1">{title}</div>
            </div>
        </button>
    );
}
