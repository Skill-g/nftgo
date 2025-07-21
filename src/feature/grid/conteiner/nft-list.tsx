"use client"

import {NftCard} from "@/feature/grid/ui/nft-card";
import {Layout} from "@/feature/grid/ui/layout";
import {Button} from "@/shared/ui/button";
import {useState} from "react";

export function NftList({imgNft, isProfile}: {isProfile: boolean, imgNft: string}) {
    const [selectedItems, setSelectedItems] = useState<number[]>([])
    const showActionButtons = selectedItems.length > 0

    const nftItems = Array.from({ length: 9 }, (_, i) => ({
        id: i,
        price: "195.89",
        isSelected: selectedItems.includes(i),
        image: imgNft,
    }))

    const toggleItemSelection = (id: number) => {
        setSelectedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
    }

    return (
        <div>
            <Layout>
                {nftItems.map((item) => (
                    <NftCard item={item} showActionButtons={showActionButtons} toggleItemSelection={toggleItemSelection} isProfile={isProfile} image={item.image} key={item.id} price={item.price}/>
                ))}
            </Layout>
            {showActionButtons && isProfile && (
                <div className="fixed bottom-16 left-0 right-0 px-4 mb-2 z-10">
                    <div className="flex gap-3  py-3">
                        <Button
                            className="flex-1 bg-gradient-to-r from-[#18CD00] to-[#067200] hover:bg-green-600 text-white font-semibold py-3 h-[54px]"
                            onClick={() => {
                                console.log("Collecting items:", selectedItems)
                                setSelectedItems([])
                            }}
                        >
                            Забрать
                        </Button>
                        <Button
                            className="flex-1 bg-gradient-to-r from-[#3900D7] to-[#8B5CD7] hover:bg-[#533189] text-white font-semibold py-3 h-[54px]"
                            onClick={() => {
                                console.log("Selling items:", selectedItems)
                                setSelectedItems([])
                            }}
                        >
                            Продать
                        </Button>
                    </div>
                </div>
            )}
        </div>

    )
}