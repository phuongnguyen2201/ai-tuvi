import { ConnectWallet, useAddress, useDisconnect } from "@thirdweb-dev/react";
import { Wallet, LogOut } from 'lucide-react';

export function WalletStatus() {
  const address = useAddress();
  const disconnect = useDisconnect();

  if (!address) {
    return (
      <ConnectWallet
        theme="dark"
        btnTitle="Kết nối ví"
        modalTitle="Chọn ví"
        className="!h-8 !text-xs !px-3 !rounded-lg"
      />
    );
  }

  return (
    <div className="flex items-center gap-2 bg-surface-3 border border-border rounded-lg px-3 py-1.5">
      <Wallet className="h-4 w-4 text-gold" />
      <span className="text-xs text-foreground font-medium">
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
      <button
        onClick={() => disconnect()}
        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
        title="Ngắt kết nối"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
