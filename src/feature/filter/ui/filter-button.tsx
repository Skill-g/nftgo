"use client";

import {Button} from "@/shared/ui/button";
import {ReactNode} from "react";

export function FilterButton ({children, active = false, onClick}: {children: ReactNode; active?: boolean; onClick?: () => void}) {
    return (
        <Button onClick={onClick} className={`w-12 h-12 rounded-lg p-0 ${active ? "bg-[#1f2a44]" : "bg-[#231c46] hover:bg-[#231c46]/90"}`}>
            {children}
        </Button>
    );
}