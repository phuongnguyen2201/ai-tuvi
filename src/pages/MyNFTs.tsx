import PageLayout from '@/components/PageLayout';
import { NFTGallery } from '@/components/NFTGallery';
import { ConnectWallet } from '@thirdweb-dev/react';

export default function MyNFTs() {
  return (
    <PageLayout title="NFT của tôi">
      <div className="space-y-6">
        <div className="flex justify-center">
          <ConnectWallet
            theme="dark"
            btnTitle="Kết nối ví"
            modalTitle="Chọn ví"
          />
        </div>
        <NFTGallery />
      </div>
    </PageLayout>
  );
}
