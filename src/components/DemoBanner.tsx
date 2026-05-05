import { Sparkles, CreditCard, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildDemoBannerText, type DemoData } from "@/hooks/useDemoExample";

interface DemoBannerProps {
  data: DemoData;
  isGuest: boolean;
  /** CTA for guests — should open UpgradeModal (Đăng ký) */
  onGuestCta: () => void;
  /** CTA for logged-in users with 0 credits — should open VietQRPaymentModal */
  onBuyCta: () => void;
  variant?: "top" | "bottom";
}

/**
 * Shows the amber "đây là ví dụ mẫu" banner above demo AI output
 * and the prominent CTA below it.
 */
export function DemoBanner({ data, isGuest, onGuestCta, onBuyCta, variant = "top" }: DemoBannerProps) {
  if (variant === "top") {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/50 to-orange-950/30 p-4 flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-lg">
          🔍
        </div>
        <div className="min-w-0 text-sm text-amber-100/90 leading-relaxed">
          <span className="font-semibold text-amber-300">Ví dụ mẫu</span> · {buildDemoBannerText(data, isGuest)}
        </div>
      </div>
    );
  }

  // bottom CTA
  if (isGuest) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-surface-3 to-surface-2 p-6 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-gold mx-auto" />
        <h3 className="font-display text-lg text-foreground">Xem luận giải cho lá số của bạn</h3>
        <p className="text-sm text-muted-foreground">
          Đăng ký miễn phí để lập lá số riêng và nhận luận giải AI dành cho bạn.
        </p>
        <Button variant="gold" size="lg" className="w-full" onClick={onGuestCta}>
          <UserPlus className="w-4 h-4 mr-2" />
          Đăng ký để xem cho lá số của bạn
        </Button>
        <p className="text-xs text-muted-foreground">Miễn phí · Mất chưa tới 1 phút</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-surface-3 to-surface-2 p-6 text-center space-y-3">
      <Sparkles className="w-8 h-8 text-gold mx-auto" />
      <h3 className="font-display text-lg text-foreground">Mở khóa luận giải cho lá số của bạn</h3>
      <p className="text-sm text-muted-foreground">
        Mua credit để nhận luận giải AI chi tiết cho lá số của riêng bạn.
      </p>
      <p className="text-2xl font-bold text-primary">39.000đ</p>
      <Button variant="gold" size="lg" className="w-full" onClick={onBuyCta}>
        <CreditCard className="w-4 h-4 mr-2" />
        Mua credit ngay
      </Button>
      <p className="text-xs text-muted-foreground">
        1 credit = 1 lần luận giải · Gói 3 credits = 39.000đ
      </p>
    </div>
  );
}

export default DemoBanner;
export const DemoBannerTop = (props: Omit<DemoBannerProps, 'variant'>) => 
  <DemoBanner {...props} variant="top" />;

export const DemoBannerBottom = (props: Omit<DemoBannerProps, 'variant'>) =>
  <DemoBanner {...props} variant="bottom" />;
