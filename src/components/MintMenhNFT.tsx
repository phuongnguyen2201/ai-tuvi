import React, { useState, useEffect } from 'react';
import { ConnectWallet, useAddress, useDisconnect } from "@thirdweb-dev/react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MintMenhNFTProps {
  chartData: any;
  birthData: {
    solarDate: string;
    hour: number;
    gender: string;
    isLunar?: boolean;
  };
}

export function MintMenhNFT({ chartData, birthData }: MintMenhNFTProps) {
  const address = useAddress();
  const disconnect = useDisconnect();
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleMint = async () => {
    if (!address) {
      setError('Vui lòng kết nối ví trước');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'create-mint-session',
        {
          body: {
            walletAddress: address,
            birthData,
            chartData,
          },
        }
      );

      if (fnError) throw new Error(fnError.message);
      
      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;

    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.message || 'Có lỗi xảy ra');
      setStatus('error');
    }
  };

  // Check for success from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      setStatus('loading');
      
      supabase.functions.invoke('mint-menh-nft', {
        body: { sessionId }
      }).then(({ data, error }) => {
        if (error || !data?.success) {
          setError(error?.message || data?.error || 'Mint failed');
          setStatus('error');
        } else {
          setResult(data);
          setStatus('success');
        }
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      });
    }
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5" />
          Mint Mệnh NFT
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sở hữu vĩnh viễn lá số Tử Vi độc nhất của bạn
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <span className="text-sm">Giá mint:</span>
          <div className="text-right">
            <span className="text-lg font-bold">$5.00</span>
            <p className="text-xs text-muted-foreground">Bao gồm phí gas</p>
          </div>
        </div>

        {/* Success */}
        {status === 'success' && result && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
              <CheckCircle className="h-5 w-5" />
              Mint thành công!
            </div>
            <p className="text-sm text-green-600">Token ID: #{result.tokenId}</p>
            <a
              href={result.basescanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              Xem giao dịch <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Wallet & Button */}
        {!address ? (
          <ConnectWallet />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => disconnect()}>
                Ngắt
              </Button>
            </div>

            <Button
              className="w-full"
              onClick={handleMint}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang xử lý...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Mint Mệnh NFT - $5.00</>
              )}
            </Button>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          NFT này là Soulbound - không thể chuyển nhượng sau khi mint.
        </p>
      </CardContent>
    </Card>
  );
}
