import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { generateVietQRUrl, generateTransferContent, getFeatureLabel, PRICING, type FeatureKey } from "@/utils/vietqr";
import { Copy, Check, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Step = "select_plan" | "show_qr" | "pending" | "processing" | "success";

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

const VietQRPaymentModal = ({ open, onOpenChange, feature, onSuccess, metadata }: VietQRPaymentModalProps) => {
  const storageKey = `payment_pending_${feature}`;

  // Restore persisted pending state from localStorage
  const getPersistedState = useCallback((): { step: Step; transferContent: string; userId: string } | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Validate: must have timestamp within 2 hours
      if (parsed.timestamp && Date.now() - parsed.timestamp < 2 * 60 * 60 * 1000) {
        return {
          step: parsed.step || 'pending',
          transferContent: parsed.transferContent || '',
          userId: parsed.userId || '',
        };
      }
      // Expired — clean up
      localStorage.removeItem(storageKey);
    } catch {}
    return null;
  }, [storageKey]);

  const persisted = getPersistedState();

  const [step, setStep] = useState<Step>(persisted?.step || "show_qr");
  const [selectedPlan, setSelectedPlan] = useState<"premium_monthly" | "premium_yearly">("premium_monthly");
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

  const isPremium = feature === "premium";
  const isLuanGiai = feature === "luan_giai";
  const activeFeature: FeatureKey = isPremium ? selectedPlan : (feature as FeatureKey);
  const amount = PRICING[activeFeature] || 0;
  const label = getFeatureLabel(activeFeature);

  // Persist pending state to localStorage whenever step becomes pending
  const persistPendingState = useCallback((pendingStep: Step, tc: string, uid: string) => {
    if (pendingStep === 'pending') {
      localStorage.setItem(storageKey, JSON.stringify({
        step: 'pending',
        transferContent: tc,
        userId: uid,
        timestamp: Date.now(),
      }));
    }
  }, [storageKey]);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Only reset when modal just opened (false → true)
      const saved = getPersistedState();
      if (saved && saved.step === 'pending') {
        setStep('pending');
        setTransferContent(saved.transferContent);
        setUserId(saved.userId);
      } else {
        setStep(isPremium ? "select_plan" : "show_qr");
        loadUserId();
      }
      setCopied(false);
      setAnalysisResult(null);
      setFakeProgress(0);
      verifiedPayloadRef.current = null;
    }
    if (!open && prevOpenRef.current) {
      // Modal just closed → cleanup
      cleanupPolling();
    }
    prevOpenRef.current = open;
  }, [open, feature]);

  const cleanupPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
  }, []);

  const loadUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      setTransferContent(generateTransferContent(user.id, activeFeature));
    }
  };

  const qrUrl = generateVietQRUrl(activeFeature, transferContent);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transferContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmTransfer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Vui lòng đăng nhập trước" });
      return;
    }

    // Insert payment record
    const { error } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        amount: amount,
        plan: activeFeature,
        payment_type: 'vietqr',
        feature_unlocked: activeFeature,
        status: 'pending',
        transfer_content: transferContent,
        notes: metadata ? JSON.stringify(metadata) : null,
      });

    if (error) {
      console.error('Payment insert error:', error);
      toast({ title: "Lỗi", description: error.message });
      return;
    }

    // For luan_giai, also create a pending package
    if (isLuanGiai) {
      const { error: pkgError } = await supabase
        .from('luan_giai_packages')
        .insert({
          user_id: user.id,
          total_uses: 3,
          remaining_uses: 3,
          amount: amount,
          payment_status: 'pending',
          session_id: transferContent,
          transfer_content: transferContent,
        });

      if (pkgError) {
        console.error('luan_giai_packages insert error:', pkgError);
      }
    }

    setStep("pending");
    persistPendingState('pending', transferContent, user.id);
  };

  // (startPollingAnalysis removed - luan_giai now uses package-based access)

  // Realtime subscription for payment/chart status
  useEffect(() => {
    if (step !== 'pending') return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      if (isLuanGiai) {
        console.log('[Modal] Setup luan_giai listener for user:', user.id);

        // LAYER 1: Realtime - listen for luan_giai_packages confirmation
        channel = supabase
          .channel('luan-giai-access-' + user.id)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'luan_giai_packages',
            filter: `user_id=eq.${user.id}`,
          }, (payload: any) => {
            console.log('[Modal] luan_giai_packages UPDATE:', payload.new?.payment_status);
            if (payload.new?.payment_status === 'confirmed') {
              console.log('[Modal] ✅ luan_giai package confirmed');
              localStorage.removeItem(storageKey);
              setStep('success');
              onSuccess?.();
            }
          })
          .subscribe((status) => {
            console.log('[Modal] Realtime status:', status);
          });

        // LAYER 2: Polling fallback mỗi 5 giây
        console.log('[Modal] Starting polling for luan_giai_packages');
        pollInterval = setInterval(async () => {
          if (cancelled) return;
          const { data } = await supabase
            .from('luan_giai_packages')
            .select('id')
            .eq('user_id', user.id)
            .eq('payment_status', 'confirmed')
            .gt('remaining_uses', 0)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data && !cancelled) {
            console.log('[Modal] ✅ Polling detected confirmed luan_giai package');
            if (pollInterval) clearInterval(pollInterval);
            localStorage.removeItem(storageKey);
            setStep('success');
            onSuccess?.();
          }
        }, 5000);
      } else {
        // Listen payments UPDATE for other features
        channel = supabase
          .channel('payment-status-' + user.id)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'payments',
            filter: `user_id=eq.${user.id}`,
          }, (payload: any) => {
            console.log('[Modal] Payment updated:', payload.new.status);
            if (payload.new.status === 'verified') {
              localStorage.removeItem(storageKey);
              setStep('success');
              onSuccess?.();
            } else if (payload.new.status === 'rejected') {
              localStorage.removeItem(storageKey);
              setStep('show_qr');
              toast({
                title: "Giao dịch bị từ chối",
                description: "Vui lòng kiểm tra lại thông tin chuyển khoản",
                variant: "destructive",
              });
            }
          })
          .subscribe();

        // Polling fallback mỗi 5s
        pollInterval = setInterval(async () => {
          if (cancelled) return;
          const { data } = await supabase
            .from('payments')
            .select('status')
            .eq('user_id', user.id)
            .eq('status', 'verified')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data && !cancelled) {
            console.log('[Modal] Polling detected verified payment');
            if (pollInterval) clearInterval(pollInterval);
            localStorage.removeItem(storageKey);
            setStep('success');
            onSuccess?.();
          }
        }, 5000);
      }
    };

    setup();

    return () => {
      cancelled = true;
      console.log('[Modal] Cleanup polling + channel');
      if (pollInterval) clearInterval(pollInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [step, isLuanGiai, metadata, onSuccess, toast]);

  const handleClose = () => {
    cleanupPolling();
    if (step !== 'pending') {
      localStorage.removeItem(storageKey);
    }
    onOpenChange(false);
    if (step === 'success') {
      onSuccess?.(analysisResult || undefined);
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
      <p className="text-center text-sm font-medium text-foreground">Quét QR để thanh toán</p>
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
            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors" title="Sao chép">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
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
        <p className="font-semibold text-foreground text-lg">Đang chờ xác nhận thanh toán...</p>
        <p className="text-sm text-muted-foreground mt-1">Tự động cập nhật khi admin xác nhận</p>
        <p className="text-xs text-muted-foreground mt-1">Thường trong vòng 5-30 phút (8:00 - 22:00)</p>
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

  // ── Step: Processing (luan_giai - waiting for AI analysis) ──
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
              dangerouslySetInnerHTML={{ __html: renderMarkdown(analysisResult) }}
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
              {isLuanGiai
                ? "Kết quả luận giải sẽ hiện khi bạn quay lại trang"
                : `Tính năng ${label} đã được mở khóa`}
            </p>
          </div>
          <Button variant="gold" size="lg" className="w-full" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      )}
    </div>
  );

  const stepContent: Record<Step, () => JSX.Element> = {
    select_plan: renderSelectPlan,
    show_qr: renderShowQR,
    pending: renderPending,
    processing: renderProcessing,
    success: renderSuccess,
  };

  const stepTitle: Record<Step, string> = {
    select_plan: "Thanh toán",
    show_qr: "Thanh toán",
    pending: "Thanh toán",
    processing: "Đang xử lý",
    success: analysisResult ? "🎊 Luận giải" : "🎊 Thành công",
  };

  const stepDesc: Record<Step, string> = {
    select_plan: "Chọn gói phù hợp",
    show_qr: label,
    pending: "Vui lòng chờ xác nhận",
    processing: "AI đang phân tích lá số",
    success: analysisResult ? "Kết quả phân tích chi tiết" : "Cảm ơn bạn đã ủng hộ!",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`border-border bg-card ${step === 'success' && analysisResult ? 'max-w-2xl' : 'max-w-md'}`}>
        <DialogHeader>
          <DialogTitle className="text-center font-display">{stepTitle[step]}</DialogTitle>
          <DialogDescription className="text-center">{stepDesc[step]}</DialogDescription>
        </DialogHeader>
        {stepContent[step]()}
      </DialogContent>
    </Dialog>
  );
};

// Simple markdown → HTML renderer
function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-primary mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-primary mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-primary mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default VietQRPaymentModal;
