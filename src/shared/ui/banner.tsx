import {Button} from "@/shared/ui/button";
import Image from "next/image";

export function Banner ({title, img} : {title: string, img: string}) {
    return (
        <Button className="w-full bg-[#262352] hover:bg-[#533189] flex justify-start py-6 text-white rounded-[10px]">
            <Image src={img} alt="Ticket" width={25} height={25} />
            {title}
        </Button>
    )
}