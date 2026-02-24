import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateVietQRUrl, generateTransferContent, BANK_INFO } from "@/utils/vietqr";
import { Copy, Check, Loader2, ExternalLink } from "lucide-react";

type Feature = "luan_giai" | "van_han" | "boi_que" | "boi_kieu" | "premium_monthly" | "premium_yearly" | "premium";
type Step = "select_plan" | "show_qr" | "pending" | "success";

interface VietQRPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  onSuccess: () => void;
}

const FEATURE_PRICES: Record<string, { label: string; amount: number }> = {
  luan_giai: { label: "Luận giải chi tiết", amount: 29000 },
  van_han: { label: "Xem vận hạn năm", amount: 29000 },
  boi_que: { label: "Bói quẻ Kinh Dịch", amount: 19000 },
  boi_kieu: { label: "Bói Kiều", amount: 19000 },
  premium_monthly: { label: "Premium 1 tháng", amount: 49000 },
  premium_yearly: { label: "Premium 1 năm", amount: 399000 },
  premium: { label: "Premium trọn đời", amount: 199000 },
};

const VietQRPaymentModal = ({ open, onOpenChange, feature, onSuccess }: VietQRPaymentModalProps) => {
  const [step, setStep] = useState<Step>("show_qr");
  const [selectedPlan, setSelectedPlan] = useState<"premium_monthly" | "premium_yearly">("premium_monthly");
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState("");
  const [transferContent, setTransferContent] = useState("");

  const isPremium = feature === "premium";
  const activeFeature = isPremium ? selectedPlan : feature;
  const priceInfo = FEATURE_PRICES[activeFeature] || FEATURE_PRICES["luan_giai"];

  useEffect(() => {
    if (open) {
      setStep(isPremium ? "select_plan" : "show_qr");
      setCopied(false);
      loadUserId();
    }
  }, [open, feature]);

  const loadUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      setTransferContent(generateTransferContent(user.id));
    }
  };

  const qrUrl = generateVietQRUrl(priceInfo.amount, transferContent);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transferContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmTransfer = async () => {
    setStep("pending");

    // Save payment record
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("payments").insert({
        user_id: user.id,
        amount: priceInfo.amount,
        plan: activeFeature,
        status: "pending",
        payment_type: "bank_transfer",
        transfer_content: transferContent,
        feature_unlocked: activeFeature,
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (step === "success") {
      onSuccess();
    }
  };

  const formatAmount = (amount: number) =>
    amount.toLocaleString("vi-VN") + "đ";

  // ── Step: Select Plan (Premium only) ──
  const renderSelectPlan = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Chọn gói Premium phù hợp với bạn
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSelectedPlan("premium_monthly")}
          className={`rounded-xl border-2 p-4 text-center transition-all ${
            selectedPlan === "premium_monthly"
              ? "border-primary bg-primary/10 glow-gold"
              : "border-border bg-card hover:border-muted-foreground"
          }`}
        >
          <p className="font-semibold text-foreground">1 tháng</p>
          <p className="text-lg font-bold text-primary mt-1">49.000đ</p>
        </button>

        <button
          onClick={() => setSelectedPlan("premium_yearly")}
          className={`rounded-xl border-2 p-4 text-center transition-all relative ${
            selectedPlan === "premium_yearly"
              ? "border-primary bg-primary/10 glow-gold"
              : "border-border bg-card hover:border-muted-foreground"
          }`}
        >
          <span className="absolute -top-2.5 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            -32%
          </span>
          <p className="font-semibold text-foreground">1 năm</p>
          <p className="text-lg font-bold text-primary mt-1">399.000đ</p>
        </button>
      </div>

      <Button variant="gold" size="lg" className="w-full" onClick={() => setStep("show_qr")}>
        Tiếp tục thanh toán
      </Button>
    </div>
  );

  // ── Step: Show QR ──
  const renderShowQR = () => (
    <div className="space-y-4">
      <p className="text-center text-sm font-medium text-foreground">
        Quét QR để thanh toán
      </p>

      {/* QR Image */}
      <div className="flex justify-center">
        <div className="rounded-xl overflow-hidden border border-border bg-white p-2">
          <img
            src={qrUrl}
            alt="VietQR Payment"
            className="w-52 h-52 object-contain"
            loading="eager"
          />
        </div>
      </div>

      {/* Bank Info */}
      <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ngân hàng</span>
          <span className="font-medium text-foreground">{BANK_INFO.bankName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Số TK</span>
          <span className="font-medium text-foreground">{BANK_INFO.accountNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Chủ TK</span>
          <span className="font-medium text-foreground">{BANK_INFO.accountName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Số tiền</span>
          <span className="font-bold text-primary">{formatAmount(priceInfo.amount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Nội dung</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{transferContent}</span>
            <button
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Sao chép"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Steps guide */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>1️⃣ Mở app ngân hàng, quét QR</p>
        <p>2️⃣ Kiểm tra đúng nội dung chuyển khoản</p>
        <p>3️⃣ Nhấn "Tôi đã chuyển khoản"</p>
      </div>

      <Button variant="gold" size="lg" className="w-full" onClick={handleConfirmTransfer}>
        Tôi đã chuyển khoản ✓
      </Button>
    </div>
  );

  // ── Step: Pending ──
  const renderPending = () => (
    <div className="flex flex-col items-center py-6 space-y-4 text-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <div>
        <p className="font-semibold text-foreground text-lg">Đang xác nhận giao dịch...</p>
        <p className="text-sm text-muted-foreground mt-1">
          Thường mất 5-15 phút (8:00 - 22:00)
        </p>
      </div>

      <Button
        variant="goldOutline"
        size="default"
        className="mt-4"
        onClick={() => window.open("https://zalo.me/0373329042", "_blank")}
      >
        <ExternalLink className="w-4 h-4 mr-1" />
        Liên hệ hỗ trợ Zalo
      </Button>
    </div>
  );

  // ── Step: Success ──
  const renderSuccess = () => (
    <div className="flex flex-col items-center py-6 space-y-4 text-center">
      <div className="text-6xl animate-scale-in">🎉</div>
      <div>
        <p className="font-bold text-xl text-foreground">Đã mở khóa thành công!</p>
        <p className="text-sm text-muted-foreground mt-1">{priceInfo.label}</p>
      </div>

      <Button variant="gold" size="lg" className="w-full" onClick={handleClose}>
        Bắt đầu ngay
      </Button>
    </div>
  );

  const stepContent: Record<Step, () => JSX.Element> = {
    select_plan: renderSelectPlan,
    show_qr: renderShowQR,
    pending: renderPending,
    success: renderSuccess,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-center font-display">
            {step === "success" ? "🎊 Thành công" : "Thanh toán"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "select_plan" && "Chọn gói phù hợp"}
            {step === "show_qr" && priceInfo.label}
            {step === "pending" && "Vui lòng chờ xác nhận"}
            {step === "success" && "Cảm ơn bạn đã ủng hộ!"}
          </DialogDescription>
        </DialogHeader>

        {stepContent[step]()}
      </DialogContent>
    </Dialog>
  );
};

export default VietQRPaymentModal;
