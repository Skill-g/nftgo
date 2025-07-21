export function Thead({fTitle, sTitle, tTitle} : {fTitle: string, sTitle: string, tTitle: string}) {
    return (
        <div className="flex justify-between items-center bg-[#231C46] text-[#979797] text-sm mb-4 h-[50px] px-4 rounded-lg">
            <div className="flex gap-4">
                <span>{fTitle}</span>
                <span>{sTitle}</span>
            </div>
            <span>{tTitle}</span>
        </div>
    )
}