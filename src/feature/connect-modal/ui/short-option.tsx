import Image from "next/image";

export function ShortOption({setAllOptions}: {setAllOptions: (value: boolean) => void}) {
    return (
        <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                    <Image src={'/tonkeeper.svg'} alt={'tonkeeper'} width={65} height={65} />
                    <span className="text-xs text-[#c2c2c2]">Tonkeeper</span>
                </div>
            ))}
            <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 flex items-center justify-center">
                    <div onClick={() => {setAllOptions(false)}} className="grid grid-cols-2 gap-1">
                        {[1, 2, 3, 4].map((i) => (
                            <Image key={i} src={'/tonkeeper.svg'} alt={'tonkeeper'} width={21} height={21} />
                        ))}
                    </div>
                </div>
                <span className="text-xs text-[#c2c2c2]">View all</span>
            </div>
        </div>
    )
}