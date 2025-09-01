"use client";

import {Grid2X2, FunnelX} from "lucide-react";
import {SearchBar} from "@/feature/filter/ui/search-bar";
import {FilterBar} from "@/feature/filter/ui/filter-bar";
import {FilterButton} from "@/feature/filter/ui/filter-button";

export function Filter({
                           search,
                           onSearchChange,
                           minPrice,
                           maxPrice,
                           onMinChange,
                           onMaxChange,
                           activeOnly,
                           onToggleActive,
                           sort,
                           onSortChange,
                       }: {
    search: string;
    onSearchChange: (v: string) => void;
    minPrice: number | null;
    maxPrice: number | null;
    onMinChange: (v: number | null) => void;
    onMaxChange: (v: number | null) => void;
    activeOnly: boolean;
    onToggleActive: () => void;
    sort: "newest";
    onSortChange?: (v: "newest") => void;
}) {
    return (
        <>
            <div className="px-4">
                <SearchBar value={search} onChange={onSearchChange}/>
            </div>

            <div className="flex items-center gap-3 px-4 py-1">
                <FilterBar
                    type="min"
                    min={0.1}
                    max={500}
                    value={minPrice ?? undefined}
                    onValueChange={(v) => onMinChange(typeof v === "number" && Number.isFinite(v) ? v : null)}
                />

                <div className="w-3 h-0.5 bg-[#707579]"></div>

                <FilterBar
                    type="max"
                    min={0.1}
                    max={500}
                    value={maxPrice ?? undefined}
                    onValueChange={(v) => onMaxChange(typeof v === "number" && Number.isFinite(v) ? v : null)}
                />

                <FilterButton
                    active={sort === "newest"}
                    onClick={() => onSortChange?.("newest")}
                >
                    <Grid2X2 className="w-6 h-6 text-white"/>
                </FilterButton>

                <FilterButton active={activeOnly} onClick={onToggleActive}>
                    <FunnelX className={`w-6 h-6 ${activeOnly ? "text-[#21ee43]" : "text-[#707579]"}`}/>
                </FilterButton>
            </div>
        </>
    );
}
