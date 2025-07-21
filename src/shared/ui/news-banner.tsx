import {Card, CardContent} from "@/shared/ui/card";
import {Button} from "@/shared/ui/button";
import Image from "next/image";

export function NewsBanner() {
    return (
        <div className="flex items-center gap-3">
            <Card className="flex-1 bg-gradient-to-r from-[#984eed] p-2.5 to-[#8845f5] border-0">
                <CardContent className="flex flex-row items-center justify-between px-0">
                    <span className="text-white font-medium">Check our news</span>
                    <Button variant="secondary" size="sm" className="bg-white text-[#8845f5] hover:bg-white/90">
                        Open
                    </Button>
                </CardContent>
            </Card>

            <div className="bg-[#163200] border-1 border-white/50 rounded-lg p-3 flex items-center gap-2">
                <Image src={'/rocket/wifi.png'} alt={'wifi'} width={20} height={20} />
                <span className="text-white font-bold">68</span>
            </div>
        </div>
    )
}