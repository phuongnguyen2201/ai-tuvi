import React, { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, RefreshCw, BookOpen, Share2, Loader2, Lock, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useStreamingAnalysis } from "@/hooks/useStreamingAnalysis";
import { hapticImpact, hapticSuccess } from "@/utils/native";
import { useAuth } from "@/contexts/AuthContext";
import { useUpgradeModal } from "@/contexts/UpgradeModalContext";
import VietQRPaymentModal from "@/components/VietQRPaymentModal";
import { AnalysisDisclaimer } from "@/components/AnalysisDisclaimer";
import { useDemoExample } from "@/hooks/useDemoExample";
import { DemoBanner } from "@/components/DemoBanner";
import { DemoSkeleton } from "@/components/DemoSkeleton";

const fortuneStyles: Record<string, { bg: string; border: string; badge: string; badgeText: string }> = {
  excellent: {
    bg: "from-gold/20 to-gold/5",
    border: "border-gold/50",
    badge: "bg-gold text-background",
    badgeText: "Đại Cát",
  },
  good: {
    bg: "from-green-500/20 to-green-500/5",
    border: "border-green-500/50",
    badge: "bg-green-500 text-background",
    badgeText: "Cát",
  },
  neutral: {
    bg: "from-purple-deep/20 to-purple-deep/5",
    border: "border-purple-deep/50",
    badge: "bg-purple-deep text-foreground",
    badgeText: "Bình",
  },
  challenging: {
    bg: "from-destructive/20 to-destructive/5",
    border: "border-destructive/50",
    badge: "bg-destructive text-foreground",
    badgeText: "Hung",
  },
};

const FREE_PREVIEW_WORD_LIMIT = 500;

function truncateToWords(text: string, maxWords: number): { preview: string; isTruncated: boolean } {
  const lines = text.split("\n");
  let wordCount = 0;
  const previewLines: string[] = [];
  for (const line of lines) {
    const lineWords = line.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount + lineWords > maxWords && previewLines.length > 0) break;
    previewLines.push(line);
    wordCount += lineWords;
    if (wordCount >= maxWords) break;
  }
  const preview = previewLines.join("\n");
  return { preview, isTruncated: preview.length < text.length };
}

const BoiKieu = () => {
  const { user, isGuest } = useAuth();
  const { openUpgrade } = useUpgradeModal();
  const { demoData, demoMode, demoLoading, fetchDemo, exitDemo } = useDemoExample();
  const [question, setQuestion] = useState("");
  const [verse, setVerse] = useState<any>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  // ── UNIFIED CREDITS ──
  const [credits, setCredits] = useState<number>(0);
  const [everPurchased, setEverPurchased] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [verses, setVerses] = useState<any[]>([]);
  const [showPayment, setShowPayment] = useState(false);

  const { isStreaming: isStreamingAI, streamedText, startStreaming } = useStreamingAnalysis();

  const hasCredits = credits > 0;
  const displayText = result || streamedText;
  const isFreePreview = !!displayText && !hasCredits && !everPurchased;
  const canGieoQue = hasCredits;

  useEffect(() => {
    supabase
      .from("kieu_verses")
      .select("*")
      .then(({ data }) => setVerses(data || []));
    if (user) {
      loadCredits();
      loadHistory();
    }
  }, [user]);

  // ── UNIFIED: Load credits from user_credits ──
  const loadCredits = async () => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) return;
    const { data } = await supabase
      .from("user_credits")
      .select("credits_remaining, credits_total")
      .eq("user_id", u.id)
      .maybeSingle();
    setCredits(data?.credits_remaining ?? 0);
    setEverPurchased((data?.credits_total ?? 0) > 0);
  };

  const loadHistory = async () => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) return;
    const { data } = await supabase
      .from("kieu_analyses")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory(data || []);
  };

  const handleGieoQue = async () => {
    if (!question.trim()) {
      toast.error("Vui lòng nhập câu hỏi");
      return;
    }
    if (verses.length === 0) {
      toast.error("Chưa tải được câu Kiều, thử lại sau");
      return;
    }
    // Guest OR registered user with 0 credits & never purchased → demo
    if (isGuest || (!canGieoQue && !everPurchased)) {
      await fetchDemo("boi_kieu");
      return;
    }
    if (!canGieoQue) {
      // Logged-in, previously purchased, ran out → QR
      setShowPayment(true);
      return;
    }
    hapticImpact();
    setIsShaking(true);
    setResult(null);
    setVerse(null);
    setViewingHistoryId(null);
    setTimeout(async () => {
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      setVerse(randomVerse);
      setIsShaking(false);
      await handleAnalyze(randomVerse);
    }, 1500);
  };

  const handleAnalyze = async (selectedVerse: any) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const fullText = await startStreaming(
        { analysisType: "boi_kieu", question, verse: selectedVerse.verse, fortune: selectedVerse.fortune },
        {
          onError: (err) => {
            console.error("[BoiKieu] Stream error:", err);
            toast.error(err || "Lỗi khi luận giải. Thử lại nhé!");
          },
        },
      );
      if (!fullText) throw new Error("Không nhận được kết quả.");
      hapticSuccess();
      setResult(fullText);
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (u) {
        try {
          await supabase.from("kieu_analyses").insert({
            user_id: u.id,
            package_id: null,
            verse_id: selectedVerse.id,
            verse: selectedVerse.verse,
            fortune: selectedVerse.fortune,
            question,
            analysis_result: fullText,
          });
        } catch (saveErr) {
          console.warn("[BoiKieu] Save error:", saveErr);
        }
        // ── UNIFIED: Deduct 1 credit via RPC ──
        const { data: creditResult } = await supabase.rpc("use_credit", {
          p_user_id: u.id,
          p_feature: "boi_kieu",
        });
        console.log("[BoiKieu] use_credit result:", creditResult);
        loadCredits();
        loadHistory();
      }
    } catch (e) {
      console.error("Bói Kiều analyze error:", e);
      toast.error("Lỗi khi luận giải. Thử lại nhé!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    loadCredits();
  };

  const openPaymentOrUpgrade = () => {
    if (isGuest) {
      openUpgrade();
      return;
    }
    if (!user) {
      window.location.href = "/auth?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }
    setShowPayment(true);
  };

  // Auto-exit demo when credits arrive
  useEffect(() => {
    if (demoMode && hasCredits) exitDemo();
  }, [demoMode, hasCredits, exitDemo]);

  const handleShare = async (type: "verse" | "full") => {
    const inDemo = demoMode && !!demoData && !verse;
    if (!verse && !inDemo) return;

    const verseText = verse?.verse;
    const questionText = inDemo ? "Câu hỏi mẫu" : question;
    const prefix = inDemo ? "🔍 Ví dụ mẫu — 📜 Bói Kiều" : "📜 Bói Kiều";

    let shareText = "";
    if (type === "verse") {
      if (verseText) {
        shareText = `${prefix}\n\n❓ ${questionText}\n\n"${verseText}"\n\n🔮 Xem tại: ai-tuvi.lovable.app`;
      } else if (inDemo && demoData) {
        // Demo without a drawn verse — share the first quoted line if present, else the intro.
        const firstQuote = demoData.demo_output.match(/"([^"\n]+)"/)?.[1];
        shareText = `${prefix}\n\n${firstQuote ? `"${firstQuote}"` : demoData.demo_output.split("\n")[0]}\n\n🔮 Xem tại: ai-tuvi.lovable.app`;
      } else {
        return;
      }
    } else {
      const fullSource = displayText || (inDemo && demoData ? demoData.demo_output : "");
      if (!fullSource) return;
      const cleaned = fullSource
        .replace(/^#{1,3} /gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/^[-•] /gm, "• ")
        .replace(/^> /gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      const versePart = verseText ? `\n\n"${verseText}"` : "";
      shareText = `${prefix}\n\n❓ ${questionText}${versePart}\n\n${cleaned}\n\n🔮 Xem tại: ai-tuvi.lovable.app`;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: inDemo ? "Bói Kiều - Ví dụ mẫu" : "Bói Kiều - Tử Vi App",
          text: shareText,
          url: "https://ai-tuvi.lovable.app",
        });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(shareText);
    toast.success(type === "verse" ? "📋 Đã sao chép câu Kiều!" : "📋 Đã sao chép luận giải!");
  };

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## "))
        return (
          <h2 key={i} className="text-lg font-bold text-primary mt-5 mb-2 border-b border-primary/20 pb-1">
            {line.replace("## ", "")}
          </h2>
        );
      if (line.startsWith("### "))
        return (
          <h3 key={i} className="text-md font-semibold text-secondary mt-4 mb-2">
            {line.replace("### ", "")}
          </h3>
        );
      if (line.startsWith("# "))
        return (
          <h1 key={i} className="text-xl font-bold text-foreground mt-5 mb-3">
            {line.replace("# ", "")}
          </h1>
        );
      if (line.startsWith("> "))
        return (
          <blockquote
            key={i}
            className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-3 bg-primary/5 py-2 rounded-r"
          >
            {line.replace("> ", "")}
          </blockquote>
        );
      if (line.startsWith("- ") || line.startsWith("* "))
        return (
          <li key={i} className="text-muted-foreground ml-4 list-disc text-sm">
            {renderBold(line.replace(/^[-*] /, ""))}
          </li>
        );
      if (/^\d+\. /.test(line))
        return (
          <li key={i} className="text-muted-foreground ml-4 list-decimal text-sm">
            {renderBold(line.replace(/^\d+\. /, ""))}
          </li>
        );
      if (line === "---" || line === "***") return <hr key={i} className="border-primary/20 my-4" />;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-muted-foreground leading-relaxed text-sm">
          {renderBold(line)}
        </p>
      );
    });
  };

  const renderBold = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return (
          <strong key={i} className="text-foreground font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      return part;
    });
  };

  const renderVerse = (verseText: string) => {
    const normalized = verseText.replace(/\\n/g, "\n");
    const parts = normalized.split("\n");
    return (
      <div className="text-center font-display italic py-2">
        <div className="text-base leading-relaxed text-foreground">"{parts[0]}</div>
        <div className="text-lg leading-relaxed text-foreground">{parts[1] || ""}"</div>
      </div>
    );
  };

  const style = verse ? fortuneStyles[verse.fortune] : null;

  // ── UNIFIED: usesLabel dùng credits ──
  const usesLabel = hasCredits
    ? `Còn ${credits} credits`
    : everPurchased
      ? "Đã hết credits"
      : "Cần mua credits";

  const renderAiResult = () => {
    if ((isAnalyzing || isStreamingAI) && !result) {
      return (
        <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-primary/20")}>
          <h3 className="font-display text-lg text-primary flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 animate-pulse" />
            Đang luận giải...
          </h3>
          {streamedText ? (
            <div className="space-y-1">
              {renderMarkdown(streamedText)}
              <div className="flex items-center gap-2 mt-4 pt-2 border-t border-primary/10">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Đang viết tiếp...</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="font-display text-lg text-foreground mb-1">Đang kết nối AI...</p>
              <p className="text-sm text-muted-foreground">AI đang phân tích câu Kiều cho bạn</p>
            </div>
          )}
        </div>
      );
    }
    if (!displayText) return null;

    if (isFreePreview) {
      const { preview } = truncateToWords(displayText, FREE_PREVIEW_WORD_LIMIT);
      return (
        <div
          className={cn(
            "rounded-2xl p-5 bg-gradient-to-br from-secondary/5 to-surface-2 border border-secondary/20 overflow-hidden",
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-secondary" />
            <h3 className="font-display text-lg text-secondary">Luận Giải AI</h3>
            <span className="text-xs font-normal text-muted-foreground ml-1">— Bản xem trước</span>
          </div>
          <div className="space-y-1">{renderMarkdown(preview)}</div>
          <div className="relative mt-0">
            <div className="h-32 bg-gradient-to-b from-transparent via-card/80 to-card relative z-10" />
            <div
              className="blur-sm select-none pointer-events-none -mt-4 max-h-40 overflow-hidden opacity-60"
              aria-hidden="true"
            >
              {renderMarkdown(displayText.slice(preview.length, preview.length + 600))}
            </div>
            <div className="relative z-20 -mt-32 pt-8 pb-2 bg-gradient-to-b from-card/90 to-card">
              <div className="text-center space-y-4 max-w-sm mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">Nội dung bị giới hạn</span>
                </div>
                <h3 className="text-lg font-bold text-foreground">Mở khóa luận giải đầy đủ</h3>
                <p className="text-sm text-muted-foreground">
                  Bạn đang xem bản rút gọn. Mua credits để xem toàn bộ luận giải chi tiết.
                </p>
                <p className="text-2xl font-bold text-primary">39.000đ</p>
                <p className="text-xs text-muted-foreground -mt-2">3 credits — dùng cho bất kỳ tính năng nào</p>
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full"
                  onClick={openPaymentOrUpgrade}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Mua Credits
                </Button>
                <p className="text-xs text-muted-foreground">Thanh toán nhanh qua ngân hàng</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button variant="ghost" size="sm" onClick={() => handleShare("verse")} className="flex-1 text-xs">
              <Share2 className="w-3.5 h-3.5 mr-1" />
              Chia sẻ câu Kiều
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-secondary/5 to-surface-2 border border-secondary/20")}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h3 className="font-display text-lg text-secondary">Luận Giải AI</h3>
        </div>
        <div className="space-y-1">{renderMarkdown(displayText)}</div>
        <AnalysisDisclaimer variant="boi_kieu" />
        <div className="flex gap-2 mt-5">
          <Button variant="ghost" size="sm" onClick={() => handleShare("verse")} className="flex-1 text-xs">
            <Share2 className="w-3.5 h-3.5 mr-1" />
            Chia sẻ câu Kiều
          </Button>
          <Button variant="goldOutline" size="sm" onClick={() => handleShare("full")} className="flex-1 text-xs">
            <Share2 className="w-3.5 h-3.5 mr-1" />
            Chia sẻ luận giải
          </Button>
        </div>
      </div>
    );
  };

  const mainContent = (
    <div className="space-y-5">
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-surface-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              Lịch sử luận giải ({history.length} lần)
            </span>
            <span>{showHistory ? "▲" : "▼"}</span>
          </button>
          {showHistory && (
            <div className="mt-2 space-y-2">
              {history.map((item) => {
                const isViewing = viewingHistoryId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setVerse({ verse: item.verse, fortune: item.fortune, id: item.verse_id });
                      setQuestion(item.question);
                      setResult(item.analysis_result);
                      setViewingHistoryId(item.id);
                      setShowHistory(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={cn(
                      "rounded-xl p-3 border cursor-pointer transition-colors",
                      isViewing
                        ? "border-secondary/50 bg-secondary/10"
                        : "border-border bg-surface-3 hover:border-gold/30",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            item.fortune === "excellent" && "bg-gold/20 text-gold",
                            item.fortune === "good" && "bg-green-500/20 text-green-400",
                            item.fortune === "neutral" && "bg-purple-500/20 text-purple-400",
                            item.fortune === "challenging" && "bg-destructive/20 text-destructive",
                          )}
                        >
                          {item.fortune === "excellent"
                            ? "Đại Cát"
                            : item.fortune === "good"
                              ? "Cát"
                              : item.fortune === "neutral"
                                ? "Bình"
                                : "Hung"}
                        </span>
                        {isViewing && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-medium">
                            Đang xem
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{item.question}</p>
                    <p className="text-xs text-muted-foreground italic truncate mt-0.5">
                      "{item.verse.split("\n")[0]}..."
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Exhausted banner */}
      {!canGieoQue && everPurchased && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-950/60 to-orange-950/40 border border-amber-500/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-amber-300 text-sm">Đã hết credits</p>
                <p className="text-xs text-amber-200/60">
                  Mua thêm credits để tiếp tục · Lịch sử luận giải vẫn xem được
                </p>
              </div>
            </div>
            <Button variant="gold" size="sm" onClick={openPaymentOrUpgrade} className="shrink-0">
              <CreditCard className="w-4 h-4 mr-1.5" />
              Mua thêm
            </Button>
          </div>
        </div>
      )}

      <div>
        <textarea
          placeholder="Nhập câu hỏi của bạn... (VD: Công việc của tôi sắp tới sẽ thế nào?)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-3 p-4 text-sm resize-none h-24 focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-col items-center gap-3 py-4">
        <button
          onClick={handleGieoQue}
          disabled={isShaking || isAnalyzing || isStreamingAI || demoLoading}
          className={cn(
            "relative w-32 h-32 rounded-full",
            "bg-gradient-to-br from-primary to-primary/70",
            "flex items-center justify-center",
            "shadow-[0_0_40px_hsl(var(--primary)/0.3)]",
            "hover:shadow-[0_0_60px_hsl(var(--primary)/0.5)]",
            "transition-all duration-300",
            "hover:scale-105 active:scale-95",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            isShaking && "animate-[shake_0.5s_ease-in-out_infinite]",
          )}
        >
          <div className="text-center">
            {isShaking ? (
              <RefreshCw className="w-10 h-10 text-background animate-spin" />
            ) : (
              <>
                <Sparkles className="w-10 h-10 text-background mx-auto" />
                <span className="text-sm font-semibold text-background mt-1 block">Gieo Quẻ</span>
              </>
            )}
          </div>
        </button>
        <p className="text-xs text-muted-foreground">{usesLabel}</p>
      </div>

      {verse && style && (
        <div className={cn("rounded-2xl p-6 animate-scale-in", "bg-gradient-to-br", style.bg, "border", style.border)}>
          <div className="flex justify-center mb-4">
            <span className={cn("px-4 py-1 rounded-full text-sm font-medium", style.badge)}>{style.badgeText}</span>
          </div>
          {renderVerse(verse.verse)}
        </div>
      )}

      {demoLoading && !demoMode ? (
        <DemoSkeleton title="Đang tải quẻ Kiều mẫu..." lines={6} />
      ) : demoMode && demoData ? (
        <div className="space-y-4">
          <DemoBanner
            data={demoData}
            isGuest={isGuest}
            onGuestCta={openUpgrade}
            onBuyCta={openPaymentOrUpgrade}
            variant="top"
          />
          <div className="rounded-2xl p-5 bg-gradient-to-br from-secondary/5 to-surface-2 border border-secondary/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-secondary" />
              <h3 className="font-display text-lg text-secondary">
                Luận giải mẫu — {demoData.demo_person_name}
              </h3>
            </div>
            <div className="space-y-1">{renderMarkdown(demoData.demo_output)}</div>
          </div>
          <DemoBanner
            data={demoData}
            isGuest={isGuest}
            onGuestCta={openUpgrade}
            onBuyCta={openPaymentOrUpgrade}
            variant="bottom"
          />
        </div>
      ) : (
        renderAiResult()
      )}

      {!verse && !isShaking && !isAnalyzing && !isStreamingAI && canGieoQue && (
        <p className="text-center text-sm text-muted-foreground">
          Tập trung vào câu hỏi trong tâm, rồi nhấn "Gieo Quẻ"
        </p>
      )}
    </div>
  );

  return (
    <PageLayout title="Bói Kiều">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Truyện Kiều - Nguyễn Du</span>
          </div>
          <h2 className="font-display text-2xl text-foreground">Bói Kiều</h2>
          <p className="text-sm text-muted-foreground">
            Gieo quẻ bằng các câu thơ trong Truyện Kiều để dự đoán vận mệnh
          </p>
        </div>

        {/* Always show main content so guests/0-credit users can preview a demo before paying */}
        {mainContent}

        <VietQRPaymentModal
          open={showPayment}
          onOpenChange={setShowPayment}
          feature="boi_kieu"
          onSuccess={handlePaymentSuccess}
        />
      </div>
      <style>{`@keyframes shake { 0%, 100% { transform: translateX(0) rotate(0deg); } 25% { transform: translateX(-5px) rotate(-5deg); } 75% { transform: translateX(5px) rotate(5deg); } }`}</style>
    </PageLayout>
  );
};

export default BoiKieu;
