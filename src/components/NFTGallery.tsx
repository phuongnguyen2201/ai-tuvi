import { useState, useEffect } from 'react';
import { useAddress } from "@thirdweb-dev/react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NFTData {
  token_id: number;
  wallet_address: string;
  metadata_uri: string;
  image_uri: string | null;
  tx_hash: string;
  chart_data: any;
  created_at: string;
}

export function NFTGallery({ refreshTrigger }: { refreshTrigger?: number }) {
  const address = useAddress();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);

  useEffect(() => {
    console.log("Address changed:", address);
    if (address) {
      fetchUserNFTs();
    } else {
      setNfts([]);
    }
  }, [address, refreshTrigger]);

  const fetchUserNFTs = async () => {
    if (!address) {
      setNfts([]);
      return;
    }
    setLoading(true);
    console.log("Fetching NFTs for wallet:", address.toLowerCase());

    const { data, error } = await supabase
      .from('minted_nfts')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .order('created_at', { ascending: false });

    console.log("Query result:", data, error);
    console.log('Fetched NFTs:', data);
    console.log('Image URIs:', data?.map(n => n.image_uri));

    if (error) {
      console.error("Error fetching NFTs:", error);
      setNfts([]);
    } else {
      setNfts((data || []) as NFTData[]);
    }
    setLoading(false);
  };

  const getGatewayUrl = (ipfsUrl: string) => {
    if (!ipfsUrl) return '';
    if (ipfsUrl.startsWith('ipfs://')) {
      return ipfsUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    return ipfsUrl;
  };

  if (!address) return null;

  if (loading) {
    return (
      <Card className="bg-slate-900/80 border-amber-600/30">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400 mr-2" />
          <span className="text-gray-400">Đang tải NFT...</span>
        </CardContent>
      </Card>
    );
  }

  if (nfts.length === 0) {
    return (
      <Card className="bg-slate-900/80 border-amber-600/30">
        <CardContent className="py-8 text-center">
          <p className="text-amber-200 font-medium">Bạn chưa có NFT nào.</p>
          <p className="text-sm text-gray-400 mt-1">Lập lá số và mint NFT đầu tiên của bạn!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/80 border-amber-600/30">
      <CardHeader>
        <CardTitle className="text-amber-300 flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          NFT của bạn ({nfts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {nfts.map((nft) => (
            <div
              key={nft.token_id}
              className="rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden"
            >
              {/* NFT Image placeholder */}
              <div 
                className="aspect-square bg-slate-700/50 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedNFT(nft)}
              >
                {nft.image_uri ? (
                  <img 
                    src={getGatewayUrl(nft.image_uri)} 
                    alt={`Mệnh NFT #${nft.token_id}`}
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <ImageIcon className={`h-12 w-12 text-slate-500 ${nft.image_uri ? 'hidden' : ''}`} />
              </div>

              {/* NFT Info */}
              <div className="p-3 space-y-1">
                <p className="font-semibold text-amber-200 text-sm">
                  Mệnh NFT #{nft.token_id}
                </p>
                <p className="text-xs text-gray-400">
                  Cục: {(nft.chart_data as any)?.cuc?.name || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  Mint: {new Date(nft.created_at).toLocaleDateString('vi-VN')}
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href={`https://sepolia.basescan.org/tx/${nft.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Basescan <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={getGatewayUrl(nft.metadata_uri)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Metadata <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* NFT Preview Modal */}
      <Dialog open={!!selectedNFT} onOpenChange={(open) => !open && setSelectedNFT(null)}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-amber-600/30">
          <DialogHeader>
            <DialogTitle className="text-amber-300">
              Mệnh NFT #{selectedNFT?.token_id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedNFT?.image_uri && (
              <img
                src={getGatewayUrl(selectedNFT.image_uri)}
                alt={`Mệnh NFT #${selectedNFT.token_id}`}
                className="w-full rounded-lg"
              />
            )}
            <div className="space-y-2">
              <p className="text-sm text-amber-200">
                Cục: {(selectedNFT?.chart_data as any)?.cuc?.name || 'N/A'}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://sepolia.basescan.org/tx/${selectedNFT?.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline flex items-center gap-1"
                >
                  Xem trên Basescan <ExternalLink className="h-3 w-3" />
                </a>
                {selectedNFT?.image_uri && (
                  <a
                    href={getGatewayUrl(selectedNFT.image_uri)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Mở ảnh gốc <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
