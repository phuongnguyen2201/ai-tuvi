import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import VietQRPaymentModal from "@/components/VietQRPaymentModal";

type Feature = 'luan_giai' | 'van_han' | 'boi_que' | 'boi_kieu' | 'premium';

interface PaymentGateProps {
  feature: Feature;
  children: ReactNode;
  onUnlocked?: () => void;
}

const FEATURE_CONFIG: Record<Feature, { title: string; price: string; description: string }> = {
  luan_giai: {
    title: "Luận giải chi tiết lá số",
    price: "29.000đ / lần",
    description: "Xem đầy đủ luận giải 12 cung và các sao trong lá số tử vi của bạn",
  },
  van_han: {
    title: "Xem vận hạn năm",
    price: "29.000đ / lần",
    description: "Phân tích chi tiết vận hạn, lưu niên và đại hạn trong năm",
  },
  boi_que: {
    title: "Bói quẻ Kinh Dịch",
    price: "19.000đ / lần",
    description: "Gieo quẻ và luận giải chi tiết theo Kinh Dịch",
  },
  boi_kieu: {
    title: "Bói Kiều",
    price: "19.000đ / lần",
    description: "Gieo quẻ và nhận lời giải từ truyện Kiều",
  },
  premium: {
    title: "Gói Premium trọn đời",
    price: "199.000đ",
    description: "Mở khóa tất cả tính năng, không giới hạn lượt sử dụng",
  },
};

const PaymentGate = ({ feature, children, onUnlocked }: PaymentGateProps) => {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const config = FEATURE_CONFIG[feature];

  useEffect(() => {
    checkFeatureAccess();
  }, [feature]);

  const checkFeatureAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUnlocked(false);
      return;
    }

    const { data } = await supabase
      .from('user_features')
      .select('id')
      .eq('user_id', user.id)
      .eq('feature', feature)
      .maybeSingle();

    setUnlocked(!!data);
    if (data) onUnlocked?.();
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setUnlocked(true);
    onUnlocked?.();
  };

  // Loading
  if (unlocked === null) {
    return <div className="animate-pulse rounded-lg bg-muted h-48" />;
  }

  // Unlocked
  if (unlocked) {
    return <>{children}</>;
  }

  // Locked
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
        <Card className="max-w-sm w-full mx-4 p-6 text-center border-border bg-card shadow-xl">
          <div className="text-4xl mb-3">🔮</div>
          <h3 className="text-lg font-bold text-foreground mb-1">{config.title}</h3>
          <p className="text-2xl font-bold text-primary mb-2">{config.price}</p>
          <p className="text-sm text-muted-foreground mb-5">{config.description}</p>

          <Button
            variant="gold"
            size="lg"
            className="w-full mb-3"
            onClick={() => setShowPayment(true)}
          >
            Thanh toán QR
          </Button>
          <p className="text-xs text-muted-foreground">
            Thanh toán nhanh qua ngân hàng
          </p>
        </Card>
      </div>

      <VietQRPaymentModal
        open={showPayment}
        onOpenChange={setShowPayment}
        feature={feature}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default PaymentGate;
