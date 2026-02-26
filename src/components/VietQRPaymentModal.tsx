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
  const [step, setStep] = useState<Step>("show_qr");
  const [selectedPlan, setSelectedPlan] = useState<"premium_monthly" | "premium_yearly">("premium_monthly");
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState("");
  const [transferContent, setTransferContent] = useState("");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [fakeProgress, setFakeProgress] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifiedPayloadRef = useRef<any>(null);
  const { toast } = useToast();

  const isPremium = feature === "premium";
  const isLuanGiai = feature === "luan_giai";
  const activeFeature: FeatureKey = isPremium ? selectedPlan : (feature as FeatureKey);
  const amount = PRICING[activeFeature] || 0;
  const label = getFeatureLabel(activeFeature);

  useEffect(() => {
    if (open) {
      setStep(isPremium ? "select_plan" : "show_qr");
      setCopied(false);
      setAnalysisResult(null);
      setFakeProgress(0);
      verifiedPayloadRef.current = null;
      loadUserId();
    }
    return () => cleanupPolling();
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

    setStep("pending");
  };

  // Start polling chart_analyses for luan_giai after payment verified
  const startPollingAnalysis = useCallback((chartHash: string) => {
    console.log('[Modal] Starting analysis polling for chartHash:', chartHash);
    setStep('processing');
    setFakeProgress(0);

    // Fake progress bar: 0→90% over ~60s
    let progress = 0;
    progressRef.current = setInterval(() => {
      progress += Math.random() * 3 + 0.5;
      if (progress > 90) progress = 90;
      setFakeProgress(progress);
    }, 1000);

    // Poll chart_analyses every 3s
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('chart_analyses')
        .select('analysis_result')
        .eq('chart_hash', chartHash)
        .maybeSingle();

      if (data?.analysis_result) {
        console.log('[Modal] Analysis result received!');
        cleanupPolling();
        setFakeProgress(100);
        setAnalysisResult(data.analysis_result);
        setTimeout(() => setStep('success'), 500);
      }
    }, 3000);

    // Timeout after 2 minutes
    timeoutRef.current = setTimeout(() => {
      cleanupPolling();
      setFakeProgress(100);
      setAnalysisResult(null);
      setStep('success'); // Show success anyway, user can reload later
      toast({
        title: "Luận giải đang được xử lý",
        description: "Kết quả sẽ hiện khi bạn quay lại trang này",
      });
    }, 120000);
  }, [cleanupPolling, toast]);

  // Realtime subscription for payment/chart status
  useEffect(() => {
    if (step !== 'pending') return;
    console.log('[Modal] useEffect triggered - step:', step, 'isLuanGiai:', isLuanGiai, 'metadata:', metadata);

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        console.warn('[Modal] No user found, skipping Realtime subscription');
        return;
      }

      if (isLuanGiai) {
        const chartHash = metadata?.chartHash;
        console.log('[Modal] Props received:', { chartHash, step, userId: user.id, metadata });
        if (!chartHash) {
          console.warn('[Modal] No chartHash in metadata, cannot listen');
          return;
        }

        // LAYER 1: Realtime - lắng nghe cả INSERT và UPDATE
        console.log('[Modal] Subscribing to chart_analyses for chartHash:', chartHash, 'user_id:', user.id);
        channel = supabase
          .channel('chart-access-' + chartHash)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chart_analyses',
              filter: `user_id=eq.${user.id}`,
            },
            (payload: any) => {
              console.log('[Modal] INSERT event:', payload.new?.chart_hash);
              if (payload.new?.chart_hash === chartHash) {
                console.log('[Modal] ✅ Access granted via INSERT for:', chartHash);
                setStep('success');
                onSuccess?.();
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'chart_analyses',
              filter: `user_id=eq.${user.id}`,
            },
            (payload: any) => {
              console.log('[Modal] UPDATE event:', payload.new?.chart_hash);
              if (payload.new?.chart_hash === chartHash) {
                console.log('[Modal] ✅ Access granted via UPDATE for:', chartHash);
                setStep('success');
                onSuccess?.();
              }
            }
          )
          .subscribe((status) => {
            console.log('[Modal] Realtime channel status:', status);
            console.log('[Modal] Listening for chart_hash:', chartHash);
          });

        // LAYER 2: Polling fallback mỗi 5 giây
        pollInterval = setInterval(async () => {
          const { data } = await supabase
            .from('chart_analyses')
            .select('id')
            .eq('chart_hash', chartHash)
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            console.log('[Modal] ✅ Polling detected access for:', chartHash);
            setStep('success');
            onSuccess?.();
          }
        }, 5000);
      } else {
        // Listen payments UPDATE for other features
        channel = supabase
          .channel('payment-status-' + user.id)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'payments',
              filter: `user_id=eq.${user.id}`,
            },
            (payload: any) => {
              console.log('[Modal] Payment updated:', payload.new.status);
              if (payload.new.status === 'verified') {
                setStep('success');
              } else if (payload.new.status === 'rejected') {
                setStep('show_qr');
                toast({
                  title: "Giao dịch bị từ chối",
                  description: "Vui lòng kiểm tra lại thông tin chuyển khoản",
                  variant: "destructive",
                });
              }
            }
          )
          .subscribe();
      }
    });

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (channel) {
        console.log('[Modal] Removing Realtime channel');
        supabase.removeChannel(channel);
      }
    };
  }, [step, isLuanGiai, metadata, onSuccess, toast]);

  const handleClose = () => {
    cleanupPolling();
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
