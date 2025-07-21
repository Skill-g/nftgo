import {ChevronLeft} from "lucide-react";

export function Title () {
    return (
        <div className="bg-[#231C46] rounded-xl p-4 mb-2">
            <div className="flex justify-center items-center gap-3">
                <ChevronLeft className=" bg-[#2D2650] w-7 h-7 rounded-sm w-5 h-5 text-white"/>
                <span className="text-white font-semibold text-2xl">PEPE Marathon</span>
            </div>
        </div>
    )
}