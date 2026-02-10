import { useState, useEffect } from 'react';
import { useAddress } from "@thirdweb-dev/react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ExternalLink, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface NFTData {
  token_id: number;
  wallet_address: string;
  metadata_uri: string;
  tx_hash: string;
  chart_data: any;
  created_at: string;
}

export function NFTGallery() {
  const address = useAddress();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      fetchUserNFTs();
    } else {
      setNfts([]);
    }
  }, [address]);

  const fetchUserNFTs = async () => {
    if (!address) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('minted_nfts')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .order('created_at', { ascending: false });

    if (data) {
      setNfts(data as NFTData[]);
    }
    if (error) {
      console.error('Fetch NFTs error:', error);
    }
    setLoading(false);
  };

  const getGatewayUrl = (ipfsUrl: string) => {
    if (!ipfsUrl) return '';
    return ipfsUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
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

  if (nfts.length === 0) return null;

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
              <div className="aspect-square bg-slate-700/50 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-slate-500" />
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
    </Card>
  );
}
