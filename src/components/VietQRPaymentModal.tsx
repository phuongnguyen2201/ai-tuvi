import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { generateVietQRUrl, generateTransferContent, getFeatureLabel, PRICING, type FeatureKey } from "@/utils/vietqr";
import { Copy, Check, Loader2, ExternalLink, Sparkles, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Step = "select_plan" | "show_qr" | "pending" | "processing" | "success" | "blocked";

const BANK_DISPLAY = {
  bankName: "VPBank",
  accountNo: "238898706",
  accountName: "NGUYEN MINH PHUONG",
};

export interface VietQRPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  onSuccess?: (analysisResult?: string) => void;
  metadata?: Record<string, any>;
}


// ══════════════════════════════════════════════════════════════
// ANTI-SPAM: Max rejected payments per feature before blocking
// ══════════════════════════════════════════════════════════════
const MAX_REJECTIONS = 3;

// FIX 1: Accept BOTH "verified" and "confirmed" as success
const VERIFIED_STATUSES = ["verified", "confirmed"];

const VietQRPaymentModal = ({ open, onOpenChange, feature, onSuccess, metadata }: VietQRPaymentModalProps) => {
  const storageKey = `payment_pending_${feature}`;

  // FIX 2: Stabilize onSuccess via ref
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const getPersistedState = useCallback((): { step: Step; transferContent: string; userId: string } | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed.timestamp && Date.now() - parsed.timestamp < 2 * 60 * 60 * 1000) {
        return {
          step: parsed.step || "pending",
          transferContent: parsed.transferContent || "",
          userId: parsed.userId || "",
        };
      }
      localStorage.removeItem(storageKey);
    } catch {}
    return null;
  }, [storageKey]);

  const persisted = getPersistedState();

  const [step, setStep] = useState<Step>(persisted?.step || "show_qr");
  const [selectedPlan, setSelectedPlan] = useState<"premium_monthly" | "premium_yearly">("premium_monthly");
  const [selectedCredits, setSelectedCredits] = useState<3 | 5 | 10>(3);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState(persisted?.userId || "");
  const [transferContent, setTransferContent] = useState(persisted?.transferContent || "");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [fakeProgress, setFakeProgress] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifiedPayloadRef = useRef<any>(null);
  const { toast } = useToast();
  const prevOpenRef = useRef(false);

  // ══════════════════════════════════════════════════════════════
  // ANTI-SPAM: Track whether current flow is reusing existing pending
  // When true, "Kiểm tra thanh toán" skips DB insert
  // ══════════════════════════════════════════════════════════════
  const [existingPendingId, setExistingPendingId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);

  const isPremium = feature === "premium";
  const isLuanGiai = feature === "luan_giai";
  const activeFeature: FeatureKey = isPremium ? selectedPlan : (`credits_${selectedCredits}` as FeatureKey);
  const creditPricing: Record<number, number> = { 3: 39000, 5: 59000, 10: 99000 };
  const amount = isPremium ? (PRICING[activeFeature] || 0) : creditPricing[selectedCredits];
  const label = getFeatureLabel(activeFeature);


  const persistPendingState = useCallback(
    (pendingStep: Step, tc: string, uid: string) => {
      if (pendingStep === "pending") {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            step: "pending",
            transferContent: tc,
            userId: uid,
            timestamp: Date.now(),
          }),
        );
      }
    },
    [storageKey],
  );

  // ══════════════════════════════════════════════════════════════
  // ANTI-SPAM: Check for existing pending payment + reject count
  // Runs when modal opens — DB is source of truth
  // ══════════════════════════════════════════════════════════════
  const checkExistingPayment = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    setUserId(user.id);

    // 1) Check reject count for this feature
    const { count: rejectCount } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("feature_unlocked", activeFeature)
      .eq("status", "rejected");

    if ((rejectCount ?? 0) >= MAX_REJECTIONS) {
      console.log("[Modal] User blocked — rejected", rejectCount, "times for", activeFeature);
      return { action: "blocked" as const };
    }

    // 2) Check for existing pending payment for this feature
    const { data: pendingPayment } = await supabase
      .from("payments")
      .select("id, transfer_content")
      .eq("user_id", user.id)
      .eq("feature_unlocked", activeFeature)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingPayment) {
      console.log("[Modal] Found existing pending payment:", pendingPayment.id);
      return {
        action: "reuse" as const,
        paymentId: pendingPayment.id,
        transferContent: pendingPayment.transfer_content,
      };
    }

    // 3) No pending, no block — allow new payment
    return { action: "new" as const };
  }, [activeFeature]);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setCopied(false);
      setAnalysisResult(null);
      setFakeProgress(0);
      verifiedPayloadRef.current = null;
      setExistingPendingId(null);

      // ── ANTI-SPAM: Check DB before showing QR ──
      setInitialLoading(true);
      checkExistingPayment().then((result) => {
        setInitialLoading(false);

        if (!result) {
          // Not logged in or error
          setStep("select_plan");
          return;
        }

        if (result.action === "blocked") {
          setStep("blocked");
          return;
        }

        if (result.action === "reuse") {
          // Existing pending → show QR with same transfer content
          setExistingPendingId(result.paymentId!);
          setTransferContent(result.transferContent!);
          setStep("show_qr");
          console.log("[Modal] Re-showing QR for existing pending payment");
          return;
        }

        // New payment flow
        const saved = getPersistedState();
        if (saved && saved.step === "pending") {
          setStep("pending");
          setTransferContent(saved.transferContent);
          setUserId(saved.userId);
        } else {
          setStep("select_plan");
        }
      });
    }
    if (!open && prevOpenRef.current) {
      cleanupPolling();
    }
    prevOpenRef.current = open;
  }, [open, feature]);

  const cleanupPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  // ══════════════════════════════════════════════════════════════
  // SEC-005 FIX: Auto-create pending payment when QR is shown
  // So SePay webhook can find it immediately after bank transfer
  // ══════════════════════════════════════════════════════════════
  const loadUserId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const tc = generateTransferContent(user.id, activeFeature);
      setTransferContent(tc);

      // ── Auto-create pending payment in DB ──
      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        amount: amount,
        plan: activeFeature,
        payment_type: "vietqr",
        feature_unlocked: activeFeature,
        status: "pending",
        transfer_content: tc,
        notes: metadata ? JSON.stringify(metadata) : null,
      });

      if (error) {
        if (error.code === "23505") {
          console.log("[Modal] Payment already exists, reusing");
        } else {
          console.error("[Modal] Auto-create payment error:", error);
        }
      } else {
        console.log("[Modal] ✅ Pending payment auto-created:", tc);
      }
    }
  };

  const qrUrl = generateVietQRUrl(activeFeature, transferContent);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transferContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ══════════════════════════════════════════════════════════════
  // SEC-005 FIX: Simplified — payment already created in loadUserId
  // Button now just switches to pending step as a fallback check
  // ══════════════════════════════════════════════════════════════
  const handleConfirmTransfer = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Vui lòng đăng nhập trước" });
      return;
    }

    // Payment already exists in DB (created in loadUserId or reused from checkExistingPayment)
    // Just switch to pending step
    setStep("pending");
    persistPendingState("pending", transferContent, user.id);
  };

  // ══════════════════════════════════════════════════════════════
  // UNIFIED: Realtime + Polling for payments table (all features)
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    // Listen during BOTH show_qr and pending
    if (step !== "pending" && step !== "show_qr") return;
    if (!transferContent) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    let alreadyHandled = false;

    const handleVerified = async (uid: string, paymentId: string) => {
      if (cancelled || alreadyHandled) return;
      alreadyHandled = true;
      console.log("[Modal] ✅ Payment verified!");
      if (pollInterval) clearInterval(pollInterval);
      // Credits already added by SePay webhook — no need to add here
      localStorage.removeItem(storageKey);
      setExistingPendingId(null);
      setStep("success");
      onSuccessRef.current?.();
    };

    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      console.log("[Modal] Setup payment listener, transfer_content:", transferContent);

      channel = supabase
        .channel("payment-" + transferContent.replace(/\s/g, "-") + "-" + Date.now())
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "payments",
            filter: `transfer_content=eq.${transferContent}`,
          },
          async (payload: any) => {
            const newStatus = payload.new?.status;
            console.log("[Modal] Payment realtime UPDATE — status:", newStatus);

            if (VERIFIED_STATUSES.includes(newStatus)) {
              console.log("[Modal] ✅ Payment verified/confirmed via realtime");
              await handleVerified(user.id, payload.new.id);
            } else if (newStatus === "rejected") {
              localStorage.removeItem(storageKey);
              setExistingPendingId(null);
              setStep("show_qr");
              toast({
                title: "Giao dịch bị từ chối",
                description: "Vui lòng kiểm tra lại thông tin chuyển khoản",
                variant: "destructive",
              });
            }
          },
        )
        .subscribe((status) => {
          console.log("[Modal] Realtime subscription status:", status);
        });

      pollInterval = setInterval(async () => {
        if (cancelled) return;
        console.log("[Modal] Polling payments for transfer_content:", transferContent);

        const { data: byTransfer } = await supabase
          .from("payments")
          .select("id, status, transfer_content")
          .eq("transfer_content", transferContent)
          .in("status", VERIFIED_STATUSES)
          .maybeSingle();

        if (byTransfer && !cancelled) {
          console.log("[Modal] ✅ Polling found verified payment (by transfer_content), status:", byTransfer.status);
          await handleVerified(user.id, byTransfer.id);
          return;
        }

        const { data: byUser } = await supabase
          .from("payments")
          .select("id, status, transfer_content, created_at")
          .eq("user_id", user.id)
          .eq("feature_unlocked", activeFeature)
          .in("status", VERIFIED_STATUSES)
          .gte("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (byUser && !cancelled) {
          console.log(
            "[Modal] ✅ Polling found verified payment (by user_id fallback, recent), status:",
            byUser.status,
          );
          await handleVerified(user.id, byUser.id);
          return;
        }

        // ── ANTI-SPAM: Also detect rejection via polling ──
        const { data: rejected } = await supabase
          .from("payments")
          .select("id, status")
          .eq("transfer_content", transferContent)
          .eq("status", "rejected")
          .maybeSingle();

        if (rejected && !cancelled) {
          console.log("[Modal] Polling detected rejection");
          localStorage.removeItem(storageKey);
          setExistingPendingId(null);
          setStep("show_qr");
          toast({
            title: "Giao dịch bị từ chối",
            description: "Vui lòng kiểm tra lại thông tin chuyển khoản",
            variant: "destructive",
          });
        }
      }, 5000);
    };

    setup();

    return () => {
      cancelled = true;
      console.log("[Modal] Cleanup polling + channel");
      if (pollInterval) clearInterval(pollInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [step, transferContent, storageKey, activeFeature]);

  const handleClose = () => {
    cleanupPolling();
    if (step !== "pending") {
      localStorage.removeItem(storageKey);
    }
    onOpenChange(false);
    if (step === "success") {
      onSuccessRef.current?.(analysisResult || undefined);
    }
  };

  const formatAmount = (amount: number) => amount.toLocaleString("vi-VN") + "đ";

  // ── Step: Select Plan ──
  const renderSelectPlan = () => {
    if (isPremium) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">Chọn gói Premium phù hợp với bạn</p>
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
          <Button variant="gold" size="lg" className="w-full" onClick={() => { setStep("show_qr"); loadUserId(); }}>
            Tiếp tục thanh toán
          </Button>
        </div>
      );
    }

    // Credit package selection
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Chọn gói credits — dùng cho tất cả tính năng trả phí
        </p>
        <div className="space-y-3">
          {([3, 5, 10] as const).map((num) => {
            const prices: Record<number, number> = { 3: 39000, 5: 59000, 10: 99000 };
            const labels: Record<number, string> = { 3: "Cơ bản", 5: "Phổ biến", 10: "VIP" };
            const isSelected = selectedCredits === num;
            return (
              <button
                key={num}
                onClick={() => setSelectedCredits(num)}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all relative ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-muted-foreground"
                }`}
              >
                {num === 5 && (
                  <span className="absolute -top-2.5 right-3 bg-gold text-background text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Phổ biến
                  </span>
                )}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">{labels[num]}</p>
                    <p className="text-sm text-muted-foreground">{num} credits</p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {prices[num].toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Mỗi lần dùng Bói Kiều, Bói Quẻ, Vận Hạn, Luận Giải = 1 credit
        </p>
        <Button variant="gold" size="lg" className="w-full" onClick={() => { setStep("show_qr"); loadUserId(); }}>
          Tiếp tục thanh toán — {amount.toLocaleString("vi-VN")}đ
        </Button>
      </div>
    );
  };

  // ── Step: Show QR ──
  const renderShowQR = () => (
    <div className="space-y-4">
      <p className="text-center text-sm font-medium text-foreground">Quét QR để thanh toán</p>

      {/* ── ANTI-SPAM: Notice when re-showing existing pending ── */}
      {existingPendingId && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-center">
          <p className="text-xs text-amber-300">
            Bạn đã có giao dịch đang chờ xác nhận. Quét QR bên dưới để chuyển khoản nếu bạn chưa thanh toán.
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <div className="rounded-xl overflow-hidden border border-border bg-white p-2">
          <img src={qrUrl} alt="VietQR Payment" className="w-52 h-52 object-contain" loading="eager" />
        </div>
      </div>
      <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ngân hàng</span>
          <span className="font-medium text-foreground">{BANK_DISPLAY.bankName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Số TK</span>
          <span className="font-medium text-foreground">{BANK_DISPLAY.accountNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Chủ TK</span>
          <span className="font-medium text-foreground">{BANK_DISPLAY.accountName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Số tiền</span>
          <span className="font-bold text-primary">{formatAmount(amount)}</span>
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
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>1️⃣ Mở app ngân hàng, quét QR</p>
        <p>2️⃣ Kiểm tra đúng nội dung chuyển khoản</p>
        <p>3️⃣ Thanh toán sẽ được xác nhận tự động sau vài giây</p>
      </div>
      <Button variant="gold" size="lg" className="w-full" onClick={handleConfirmTransfer}>
        Kiểm tra thanh toán 🔄
      </Button>
    </div>
  );

  // ── Step: Pending ──
  const renderPending = () => (
    <div className="flex flex-col items-center py-6 space-y-4 text-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <div>
        <p className="font-semibold text-foreground text-lg">Đang chờ xác nhận thanh toán...</p>
        <p className="text-sm text-muted-foreground mt-1">Hệ thống sẽ tự động xác nhận sau khi nhận được tiền</p>
        <p className="text-xs text-muted-foreground mt-1">Thường trong vòng 10-30 giây</p>
      </div>
      <Button
        variant="goldOutline"
        size="default"
        className="mt-4"
        onClick={() => window.open("https://zalo.me/0702127233", "_blank")}
      >
        <ExternalLink className="w-4 h-4 mr-1" />
        Liên hệ Zalo hỗ trợ
      </Button>
    </div>
  );

  // ── Step: Processing ──
  const renderProcessing = () => (
    <div className="flex flex-col items-center py-6 space-y-5 text-center">
      <div className="relative">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-lg text-foreground">✨ Đang luận giải lá số của bạn...</p>
        <p className="text-sm text-muted-foreground">AI đang phân tích 12 cung và các sao</p>
        <p className="text-xs text-muted-foreground">Thường mất 15-30 giây</p>
      </div>
      <div className="w-full px-4">
        <Progress value={fakeProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">{Math.round(fakeProgress)}%</p>
      </div>
    </div>
  );

  // ── Step: Success ──
  const renderSuccess = () => (
    <div className="flex flex-col space-y-4">
      {analysisResult ? (
        <>
          <div className="flex items-center gap-2 justify-center">
            <span className="text-3xl">🎉</span>
            <p className="font-bold text-lg text-foreground">Luận giải hoàn tất!</p>
          </div>
          <ScrollArea className="max-h-[50vh] rounded-lg border border-border bg-muted/30 p-4">
            <div
              className="prose prose-sm prose-invert max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: renderMarkdownHTML(analysisResult) }}
            />
          </ScrollArea>
          <Button variant="gold" size="lg" className="w-full" onClick={handleClose}>
            Lưu & Đóng
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-center py-6 space-y-4 text-center">
          <div className="text-6xl animate-scale-in">🎉</div>
          <div className="space-y-1">
            <p className="font-bold text-xl text-foreground">Thanh toán thành công!</p>
            <p className="text-sm text-muted-foreground">
              {isLuanGiai ? "Kết quả luận giải sẽ hiện khi bạn quay lại trang" : `Tính năng ${label} đã được mở khóa`}
            </p>
          </div>
          <Button variant="gold" size="lg" className="w-full" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  // ANTI-SPAM: Step Blocked — too many rejected payments
  // ══════════════════════════════════════════════════════════════
  const renderBlocked = () => (
    <div className="flex flex-col items-center py-6 space-y-4 text-center">
      <ShieldAlert className="w-12 h-12 text-destructive" />
      <div>
        <p className="font-semibold text-foreground text-lg">Thanh toán tạm khoá</p>
        <p className="text-sm text-muted-foreground mt-2">
          Tài khoản của bạn đã có nhiều giao dịch bị từ chối cho tính năng này. Vui lòng liên hệ hỗ trợ để được giúp đỡ.
        </p>
      </div>
      <Button
        variant="goldOutline"
        size="default"
        className="mt-4"
        onClick={() => window.open("https://zalo.me/0702127233", "_blank")}
      >
        <ExternalLink className="w-4 h-4 mr-1" />
        Liên hệ Zalo hỗ trợ
      </Button>
      <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs text-muted-foreground">
        Đóng
      </Button>
    </div>
  );

  // ── Step: Initial Loading ──
  const renderInitialLoading = () => (
    <div className="flex flex-col items-center py-8 space-y-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Đang kiểm tra...</p>
    </div>
  );

  const stepContent: Record<Step, () => JSX.Element> = {
    select_plan: renderSelectPlan,
    show_qr: renderShowQR,
    pending: renderPending,
    processing: renderProcessing,
    success: renderSuccess,
    blocked: renderBlocked,
  };

  const stepTitle: Record<Step, string> = {
    select_plan: "Thanh toán",
    show_qr: "Thanh toán",
    pending: "Thanh toán",
    processing: "Đang xử lý",
    success: analysisResult ? "🎊 Luận giải" : "🎊 Thành công",
    blocked: "⚠️ Tạm khoá",
  };

  const stepDesc: Record<Step, string> = {
    select_plan: "Chọn gói phù hợp",
    show_qr: existingPendingId ? "Giao dịch đang chờ — quét QR để chuyển khoản" : label,
    pending: "Vui lòng chờ xác nhận",
    processing: "AI đang phân tích lá số",
    success: analysisResult ? "Kết quả phân tích chi tiết" : "Cảm ơn bạn đã ủng hộ!",
    blocked: "Vui lòng liên hệ hỗ trợ",
  };

  const isMobile = useIsMobile();

  const modalContent = (
    <>
      {initialLoading ? renderInitialLoading() : stepContent[step]()}
      {step !== "success" && step !== "blocked" && (
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground mt-2" onClick={handleClose}>
          Đóng
        </Button>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(o) => {
          if (!o) handleClose();
          else onOpenChange(o);
        }}
      >
        <DrawerContent className="border-border bg-card max-h-[95dvh] overflow-y-auto px-4 pb-6">
          <DrawerHeader className="text-center">
            <DrawerTitle className="font-display">{stepTitle[step]}</DrawerTitle>
            <DrawerDescription>{stepDesc[step]}</DrawerDescription>
          </DrawerHeader>
          {modalContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`border-border bg-card overflow-y-auto max-h-[85vh] ${
          step === "success" && analysisResult ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <DialogHeader>
          <DialogTitle className="text-center font-display">{stepTitle[step]}</DialogTitle>
          <DialogDescription className="text-center">{stepDesc[step]}</DialogDescription>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
};

function renderMarkdownHTML(md: string): string {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-primary mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-primary mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-primary mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

export default VietQRPaymentModal;
