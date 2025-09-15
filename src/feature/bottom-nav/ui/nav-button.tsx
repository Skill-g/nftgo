"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

export function NavButton({
                              image,
                              title,
                              page,
                              leftIcon,
                              comingSoon,
                          }: {
    image: string;
    title: string;
    page: string;
    leftIcon?: string;
    comingSoon?: string;
}) {
    const pathname = usePathname();
    const [showHint, setShowHint] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!comingSoon) return;
        e.preventDefault();
        setShowHint(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setShowHint(false), 1500);
    };

    return (
        <Link
            href={page}
            onClick={onClick}
            className={`flex flex-col items-center gap-1 py-2 w-[71px] h-[58px] rounded-[10px] ${
                pathname === page ? "bg-white/5" : ""
            }`}
        >
            <Image src={image} alt={title} width={26} height={26} />
            <div className="relative flex items-center gap-1">
                {leftIcon ? (
                    <Image
                        src={leftIcon}
                        alt=""
                        width={14}
                        height={14}
                        aria-hidden
                        role="presentation"
                    />
                ) : null}

                <span className="text-white text-xs">{title}</span>

                {showHint && comingSoon ? (
                    <span
                        className="
              absolute -top-19 left-1/2 -translate-x-1/2
              whitespace-nowrap px-2 py-[4px]
              rounded text-[10px] font-medium
              bg-white text-[#150f27]
              shadow ring-1 ring-white/20
            "
                    >
            {comingSoon}
          </span>
                ) : null}
            </div>
        </Link>
    );
}
