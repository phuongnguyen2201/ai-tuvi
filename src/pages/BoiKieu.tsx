import React, { useState, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import PaymentGate from "@/components/PaymentGate";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, RefreshCw, BookOpen, Share2, History, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

const FREE_USES = 3;
const STORAGE_KEY = "boikieu_count";

const BoiKieu = () => {
  const [question, setQuestion] = useState("");
  const [verse, setVerse] = useState<any>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [kieuPackage, setKieuPackage] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [verses, setVerses] = useState<any[]>([]);
  const [useCount, setUseCount] = useState(() =>
    parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10)
  );

  const needsPayment = useCount >= FREE_USES && !kieuPackage;

  // Load verses, package, history on mount
  useEffect(() => {
    supabase.from("kieu_verses").select("*").then(({ data }) => {
      setVerses(data || []);
    });
    loadKieuPackage();
    loadHistory();
  }, []);

  const loadKieuPackage = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("kieu_packages")
      .select("*")
      .eq("user_id", user.id)
      .gt("uses_remaining", 0)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setKieuPackage(data);
  };

  const loadHistory = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("kieu_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setHistory(data || []);
  };

  // Gieo quẻ
  const handleGieoQue = async () => {
    if (!question.trim()) {
      toast.error("Vui lòng nhập câu hỏi");
      return;
    }
    if (verses.length === 0) {
      toast.error("Chưa tải được câu Kiều, thử lại sau");
      return;
    }

    setIsShaking(true);
    setResult(null);
    setVerse(null);

    setTimeout(async () => {
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      setVerse(randomVerse);
      setIsShaking(false);

      // Tăng free count
      if (!kieuPackage) {
        const newCount = useCount + 1;
        setUseCount(newCount);
        localStorage.setItem(STORAGE_KEY, String(newCount));
      }

      // Gọi Claude
      await handleAnalyze(randomVerse);
    }, 1500);
  };

  // Analyze with Claude
  const handleAnalyze = async (selectedVerse: any) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: {
          analysisType: "boi_kieu",
          question,
          verse: selectedVerse.verse,
          fortune: selectedVerse.fortune,
        },
      });

      if (error) throw error;
      const analysisResult = data?.analysis || "";
      setResult(analysisResult);

      // Lưu DB nếu có package
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && kieuPackage) {
        await supabase.from("kieu_analyses").insert({
          user_id: user.id,
          package_id: kieuPackage.id,
          verse_id: selectedVerse.id,
          verse: selectedVerse.verse,
          fortune: selectedVerse.fortune,
          question,
          analysis_result: analysisResult,
        });

        await supabase
          .from("kieu_packages")
          .update({ uses_remaining: kieuPackage.uses_remaining - 1 })
          .eq("id", kieuPackage.id);

        loadKieuPackage();
        loadHistory();
      }
    } catch (e) {
      console.error("Bói Kiều analyze error:", e);
      toast.error("Lỗi khi luận giải. Thử lại nhé!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Share
  const handleShare = async (type: "verse" | "full") => {
    if (!verse) return;

    let shareText = "";
    if (type === "verse") {
      shareText = `📜 Bói Kiều\n\n❓ ${question}\n\n"${verse.verse}"\n\n🔮 Xem tại: ai-tuvi.lovable.app`;
    } else {
      if (!result) return;
      const cleaned = result
        .replace(/^#{1,3} /gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/^[-•] /gm, "• ")
        .replace(/^> /gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      shareText = `📜 Bói Kiều\n\n❓ ${question}\n\n"${verse.verse}"\n\n${cleaned}\n\n🔮 Xem tại: ai-tuvi.lovable.app`;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: "Bói Kiều - Tử Vi App", text: shareText, url: "https://ai-tuvi.lovable.app" });
        return;
      } catch {}
    }

    await navigator.clipboard.writeText(shareText);
    toast.success(type === "verse" ? "📋 Đã sao chép câu Kiều!" : "📋 Đã sao chép luận giải!");
  };

  // Markdown renderer (same as VanHan)
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
          <blockquote key={i} className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-3 bg-primary/5 py-2 rounded-r">
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
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="text-foreground font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderVerse = (verseText: string) => {
    const lines = verseText.split('\n');
    return (
      <div className="text-center font-display italic py-2">
        <div className="text-base leading-relaxed text-foreground">
          "{lines[0]}
        </div>
        <div className="text-lg leading-relaxed text-foreground">
          {lines[1]}"
        </div>
      </div>
    );
  };

  const style = verse ? fortuneStyles[verse.fortune] : null;

  const usesLabel = kieuPackage
    ? `Còn ${kieuPackage.uses_remaining}/${kieuPackage.uses_total} lần trong gói`
    : `Còn ${FREE_USES - useCount}/${FREE_USES} lần miễn phí`;

  const mainContent = (
    <div className="space-y-5">
      {/* Question input */}
      <div>
        <textarea
          placeholder="Nhập câu hỏi của bạn... (VD: Công việc của tôi sắp tới sẽ thế nào?)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-3 p-4 text-sm resize-none h-24 focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Gieo Que Button */}
      <div className="flex flex-col items-center gap-3 py-4">
        <button
          onClick={handleGieoQue}
          disabled={isShaking || isAnalyzing}
          className={cn(
            "relative w-32 h-32 rounded-full",
            "bg-gradient-to-br from-primary to-primary/70",
            "flex items-center justify-center",
            "shadow-[0_0_40px_hsl(var(--primary)/0.3)]",
            "hover:shadow-[0_0_60px_hsl(var(--primary)/0.5)]",
            "transition-all duration-300",
            "hover:scale-105 active:scale-95",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            isShaking && "animate-[shake_0.5s_ease-in-out_infinite]"
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

      {/* Verse result */}
      {verse && style && (
        <div
          className={cn(
            "rounded-2xl p-6 animate-scale-in",
            "bg-gradient-to-br",
            style.bg,
            "border",
            style.border
          )}
        >
          <div className="flex justify-center mb-4">
            <span className={cn("px-4 py-1 rounded-full text-sm font-medium", style.badge)}>
              {style.badgeText}
            </span>
          </div>
          {renderVerse(verse.verse)}
        </div>
      )}

      {/* Analyzing spinner */}
      {isAnalyzing && (
        <div className={cn("rounded-2xl p-8 text-center bg-gradient-to-br from-surface-3 to-surface-2 border border-primary/20")}>
          <div className="relative inline-block mb-4">
            <Sparkles className="w-10 h-10 text-primary animate-spin" />
          </div>
          <p className="font-display text-lg text-foreground mb-1">Đang luận giải...</p>
          <p className="text-sm text-muted-foreground">AI đang phân tích câu Kiều cho bạn</p>
        </div>
      )}

      {/* Claude result */}
      {result && !isAnalyzing && (
        <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-secondary/5 to-surface-2 border border-secondary/20")}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-secondary" />
            <h3 className="font-display text-lg text-secondary">Luận Giải AI</h3>
          </div>
          <div className="space-y-1">{renderMarkdown(result)}</div>
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
      )}

      {/* Hint */}
      {!verse && !isShaking && !isAnalyzing && (
        <p className="text-center text-sm text-muted-foreground">
          Tập trung vào câu hỏi trong tâm, rồi nhấn "Gieo Quẻ"
        </p>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-surface-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              Lịch sử luận giải ({history.length} lần)
            </span>
            <span>{showHistory ? '▲' : '▼'}</span>
          </button>

          {showHistory && (
            <div className="mt-2 space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setVerse({
                      verse: item.verse,
                      fortune: item.fortune,
                      id: item.verse_id,
                    });
                    setQuestion(item.question);
                    setResult(item.analysis_result);
                    setShowHistory(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="rounded-xl p-3 border border-border bg-surface-3 cursor-pointer hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      item.fortune === 'excellent' && "bg-gold/20 text-gold",
                      item.fortune === 'good' && "bg-green-500/20 text-green-400",
                      item.fortune === 'neutral' && "bg-purple-500/20 text-purple-400",
                      item.fortune === 'challenging' && "bg-destructive/20 text-destructive",
                    )}>
                      {item.fortune === 'excellent' ? 'Đại Cát' :
                       item.fortune === 'good' ? 'Cát' :
                       item.fortune === 'neutral' ? 'Bình' : 'Hung'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.question}
                  </p>
                  <p className="text-xs text-muted-foreground italic truncate mt-0.5">
                    "{item.verse.split('\n')[0]}..."
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <PageLayout title="Bói Kiều">
      <div className="space-y-6">
        {/* Header */}
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

        {/* Main content with payment gate when needed */}
        {needsPayment ? (
          <PaymentGate
            feature="boi_kieu"
            title="Bói Kiều"
            price="39.000đ"
            description="Gói 10 lần luận giải - 39.000đ"
            onUnlocked={() => loadKieuPackage()}
          >
            {mainContent}
          </PaymentGate>
        ) : (
          mainContent
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-5px) rotate(-5deg); }
          75% { transform: translateX(5px) rotate(5deg); }
        }
      `}</style>
    </PageLayout>
  );
};

export default BoiKieu;
