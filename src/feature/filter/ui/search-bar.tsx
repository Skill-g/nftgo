import {Search} from "lucide-react";
import {Input} from "@/shared/ui/input";

export function SearchBar () {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#707579]"/>
            <Input
                placeholder="Find your gift..."
                className="bg-[#231c46] border-none h-[49px] text-white placeholder:text-[#707579] pl-10 py-3 rounded-lg"
            />
        </div>
    )
}