'use client';
import { useLingui } from '@lingui/react';
import { Trans, t, msg } from '@lingui/macro';
import {Button} from "@/shared/ui/button";
import Image from "next/image";

export function Banner ({title, img} : {title: string, img: string}) {
    const {
        i18n: i18n
    } = useLingui();

    return (
        <Button className="w-full bg-[#262352] hover:bg-[#533189] flex justify-start py-6 text-white rounded-[10px]">
            <Image src={img} alt={i18n._(msg`Ticket`)} width={25} height={25} />
            {title}
        </Button>
    );
}