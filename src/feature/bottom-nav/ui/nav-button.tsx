"use client"

import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";

export function NavButton({image, title, page}: {image: string; title: string, page: string}) {

    const pathname = usePathname()

    return (
        <Link href={page} className={`flex flex-col items-center gap-1 py-2 w-[71px] h-[58px] rounded-[10px] ${pathname==page && "bg-white/5" }`}>
            <Image src={image} alt={title} width={26} height={26} />
            <span className="text-white text-xs">{title}</span>
        </Link>
    )
}