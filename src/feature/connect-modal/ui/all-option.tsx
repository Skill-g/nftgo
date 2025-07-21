import Image from "next/image";


export function AllOption({wallet}: {wallet: string}) {
    return (
        <div
            className="flex flex-col items-center gap-1 rounded-lg cursor-pointer transition-colors"
        >
            <div className="w-20 h-20  rounded-lg flex items-center justify-center">
                <Image src={'/tonkeeper.svg'} alt={'tonkeeper'} width={65} height={65} />
            </div>
            <span className="text-sm text-[#c2c2c2]">{wallet}</span>
        </div>
    )
}