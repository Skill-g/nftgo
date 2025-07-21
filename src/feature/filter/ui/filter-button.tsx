
import {Button} from "@/shared/ui/button";
import {ReactNode} from "react";

export function FilterButton ({children}: {children: ReactNode}) {
    return (
        <Button className="bg-[#231c46] hover:bg-[#231c46]/90 w-12 h-12 rounded-lg p-0">
            {children}
        </Button>
    )
}