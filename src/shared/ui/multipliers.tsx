import {Button} from "@/shared/ui/button";

export function Multipliers({}) {

    const multipliers = ["2x", "1.15x", "2x", "1.15x", "2x", "1.15x", "2x"]

    return (
        <div className="flex gap-2 overflow-x-auto">
            {multipliers.map((mult, index) => (
                <Button
                    key={index}
                    variant="secondary"
                    size="sm"
                    className=" bg-gradient-to-l from-[#4F288F] to-[#8845F5] text-white hover:bg-[#533189]/80 min-w-[40px]"
                >
                    {mult}
                </Button>
            ))}
        </div>
    )
}