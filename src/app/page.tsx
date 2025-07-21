import {Filter} from "@/feature/filter";
import {NftList} from "@/feature/grid";

export default function Home() {
  return (
    <div className={'bg-[#150f27] min-h-screen text-white mx-auto relative'}>
        <Filter/>
        <NftList isProfile={false} imgNft={'/nft-1.png'}/>
    </div>
  );
}
