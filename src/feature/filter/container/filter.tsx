import {Grid2X2, FunnelX} from "lucide-react";
import {SearchBar} from "@/feature/filter/ui/search-bar";
import {FilterBar} from "@/feature/filter/ui/filter-bar";
import {FilterButton} from "@/feature/filter/ui/filter-button";

export function Filter() {
    return (
        <>
            <div className="px-4">
                <SearchBar/>
            </div>
            <div className="flex items-center gap-3 px-4 py-1">
                <FilterBar type={"min"} min={0.1} max={500}/>

                <div className="w-3 h-0.5 bg-[#707579]"></div>

                <FilterBar type={'max'} min={0.1} max={500}/>

                <FilterButton>
                    <Grid2X2 className="w-6 h-6 text-white"/>
                </FilterButton>

                <FilterButton>
                    <FunnelX className="w-6 h-6 text-[#942123]"/>
                </FilterButton>

            </div>
        </>

    )
}