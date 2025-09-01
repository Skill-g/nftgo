"use client";

import {useState, useMemo} from "react";
import {Filter} from "@/feature/filter";
import {useUserContext} from "@/shared/context/UserContext";
import {GiftsList} from "@/feature/gift-list";

export default function Home() {
    const { user } = useUserContext();
    const initData = useMemo(() => user?.initData ?? "", [user]);

    const [search, setSearch] = useState("");
    const [minPrice, setMinPrice] = useState<number | null>(null);
    const [maxPrice, setMaxPrice] = useState<number | null>(null);
    const [activeOnly, setActiveOnly] = useState(true);
    const [sort, setSort] = useState<"newest">("newest");

    return (
        <div className="bg-[#150f27] min-h-screen text-white mx-auto relative">
            <Filter
                search={search}
                onSearchChange={setSearch}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onMinChange={setMinPrice}
                onMaxChange={setMaxPrice}
                activeOnly={activeOnly}
                onToggleActive={() => setActiveOnly(v => !v)}
                sort={sort}
                onSortChange={setSort}
            />
            <GiftsList
                initData={initData}
                search={search}
                minPrice={minPrice}
                maxPrice={maxPrice}
                activeOnly={activeOnly}
                sort={sort}
            />
        </div>
    );
}
