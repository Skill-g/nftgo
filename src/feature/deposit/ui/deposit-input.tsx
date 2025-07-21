import {Input} from "@/shared/ui/input";

export function DepositInput() {
    return (
        <div className="">
            <Input
                type={'number'}
                placeholder="Amount (Min: 1 TON)"
                className="bg-[#1b1636] border-[#262352] text-white placeholder:text-[#969696] h-12 rounded-xl [appearance:textfield]"
            />
        </div>
    )
}