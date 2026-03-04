import { ReactNode, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import VietQRPaymentModal from "@/components/VietQRPaymentModal";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import type { User } from "@supabase/supabase-js";

interface PaymentGateProps {
  feature: string;
  children: ReactNode;
  onUnlocked?: () => void;
  title?: string;
  price?: string;
  description?: string;
  metadata?: Record<string, any>;
}

const DEFAULT_CONFIGS: Record<string, { title: string; price: string; description: string }> = {
  luan_giai: {
    title: "Gói Luận Giải Lá Số",
    price: "39.000đ",
    description: "3 lần luận giải AI chuyên sâu 12 cung. Thanh toán 1 lần, dùng cho nhiều lá số.",
  },
  van_han: {
    title: "Xem vận hạn năm",
    price: "39.000đ / lần",
    description: "Phân tích chi tiết vận hạn, lưu niên và đại hạn trong năm",
  },
  van_han_week: {
    title: "Luận giải tuần",
    price: "39.000đ",
    description: "Gói 3 lần phân tích - 39.000đ",
  },
  van_han_month: {
    title: "Luận giải tháng",
    price: "39.000đ",
    description: "Gói 3 lần phân tích - 39.000đ",
  },
  van_han_year: {
    title: "Luận giải năm",
    price: "39.000đ",
    description: "Gói 3 lần phân tích - 39.000đ",
  },
  boi_que: {
    title: "Gói Bói Quẻ",
    price: "39.000đ",
    description: "3 lần gieo quẻ + luận giải AI chi tiết",
  },
  boi_kieu: {
    title: "Bói Kiều",
    price: "39.000đ",
    description: "Gói 3 lần luận giải - 39.000đ",
  },
  premium: {
    title: "Gói Premium trọn đời",
    price: "199.000đ",
    description: "Mở khóa tất cả tính năng, không giới hạn lượt sử dụng",
  },
};

const PaymentGate = ({ feature, children, onUnlocked, title, price, description, metadata }: PaymentGateProps) => {
  const { hasAccess, isLoading, refresh } = useFeatureAccess(feature);
  const [showPayment, setShowPayment] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkedPending, setCheckedPending] = useState(false);
  const navigate = useNavigate();

  const defaultConfig = DEFAULT_CONFIGS[feature] || { title: "Mở khóa tính năng", price: "", description: "" };
  const config = {
    title: title || defaultConfig.title,
    price: price || defaultConfig.price,
    description: description || defaultConfig.description,
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, [feature]);

  useEffect(() => {
    if (hasAccess) onUnlocked?.();
  }, [hasAccess]);

  // ── Re-check access when window regains focus ──
  useEffect(() => {
    const handleFocus = () => {
      refresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  // ══════════════════════════════════════════════════════════════
  // AUTO-OPEN: If user has no access + has pending payment for
  // this feature → auto-open payment modal (show QR immediately)
  // Runs once after access check completes
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isLoading || hasAccess || checkedPending) return;

    const checkPending = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCheckedPending(true);
        return;
      }

      const { data: pendingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", user.id)
        .eq("feature_unlocked", feature)
        .eq("status", "pending")
        .limit(1)
        .maybeSingle();

      if (pendingPayment) {
        console.log("[PaymentGate] Found pending payment for", feature, "→ auto-opening modal");
        setShowPayment(true);
      }
      setCheckedPending(true);
    };

    checkPending();
  }, [isLoading, hasAccess, feature, checkedPending]);

  // ── Memoize onSuccess ──
  const handlePaymentSuccess = useCallback(async () => {
    console.log("[PaymentGate] onSuccess called, refreshing...");
    setShowPayment(false);
    await refresh();
    console.log("[PaymentGate] refresh done, hasAccess will update via state");
    onUnlocked?.();
  }, [refresh, onUnlocked]);

  const renderLockedOverlay = () => (
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
            onClick={() => {
              if (!currentUser) {
                navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname));
                return;
              }
              setShowPayment(true);
            }}
          >
            Mở khóa với QR
          </Button>
          <p className="text-xs text-muted-foreground">Thanh toán nhanh qua ngân hàng</p>
        </Card>
      </div>
    </div>
  );

  return (
    <>
      {/* Content area: loading / unlocked / locked */}
      {isLoading ? (
        <div className="animate-pulse rounded-lg bg-muted h-48" />
      ) : hasAccess ? (
        <>{children}</>
      ) : (
        renderLockedOverlay()
      )}

      {/* Modal is ALWAYS rendered here, outside conditional branches */}
      <VietQRPaymentModal
        open={showPayment}
        onOpenChange={setShowPayment}
        feature={feature}
        metadata={metadata}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default PaymentGate;
