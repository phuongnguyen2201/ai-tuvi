import React, { useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import PaymentGate from "@/components/PaymentGate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Share2, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// 64 quẻ Kinh Dịch (subset representative)
const QUE_DATA = [
  { id: 1, name: "Thuần Càn", symbol: "☰☰", element: "Trời", summary: "Quẻ của sức mạnh, sáng tạo và thành công lớn. Mọi việc hanh thông nếu giữ chính đạo.", fortune: "excellent" },
  { id: 2, name: "Thuần Khôn", symbol: "☷☷", element: "Đất", summary: "Quẻ của sự bao dung, nhẫn nại. Thuận theo tự nhiên, không nên gượng ép.", fortune: "good" },
  { id: 3, name: "Thủy Lôi Truân", symbol: "☵☳", element: "Nước/Sấm", summary: "Khởi đầu gian nan nhưng sẽ thành công nếu kiên trì.", fortune: "challenging" },
  { id: 4, name: "Sơn Thủy Mông", symbol: "☶☵", element: "Núi/Nước", summary: "Quẻ của sự học hỏi và khai sáng. Cần tìm thầy chỉ đường.", fortune: "neutral" },
  { id: 5, name: "Thủy Thiên Nhu", symbol: "☵☰", element: "Nước/Trời", summary: "Chờ đợi đúng thời cơ. Kiên nhẫn sẽ được thưởng.", fortune: "good" },
  { id: 6, name: "Thiên Thủy Tụng", symbol: "☰☵", element: "Trời/Nước", summary: "Tranh chấp, xung đột. Nên tìm trọng tài, tránh kiện cáo.", fortune: "challenging" },
  { id: 7, name: "Địa Thủy Sư", symbol: "☷☵", element: "Đất/Nước", summary: "Quẻ của sự lãnh đạo và tổ chức. Cần kỷ luật để thành công.", fortune: "good" },
  { id: 8, name: "Thủy Địa Tỷ", symbol: "☵☷", element: "Nước/Đất", summary: "Đoàn kết, hợp tác. Tìm đồng minh, liên kết sức mạnh.", fortune: "excellent" },
  { id: 9, name: "Phong Thiên Tiểu Súc", symbol: "☴☰", element: "Gió/Trời", summary: "Tích lũy nhỏ, tiến từng bước. Chưa đủ lực để làm lớn.", fortune: "neutral" },
  { id: 10, name: "Thiên Trạch Lý", symbol: "☰☱", element: "Trời/Hồ", summary: "Cẩn thận từng bước, như đi trên lưng hổ. Thận trọng sẽ an toàn.", fortune: "neutral" },
  { id: 11, name: "Địa Thiên Thái", symbol: "☷☰", element: "Đất/Trời", summary: "Quẻ đại cát! Thông suốt, hanh thông, vạn sự như ý.", fortune: "excellent" },
  { id: 12, name: "Thiên Địa Bĩ", symbol: "☰☷", element: "Trời/Đất", summary: "Bế tắc, trì trệ. Cần ẩn nhẫn chờ thời, không nên hành động.", fortune: "challenging" },
];

const fortuneConfig = {
  excellent: { bg: "from-gold/20 to-gold/5", border: "border-gold/40", badge: "bg-gold text-background", label: "Đại Cát 大吉" },
  good: { bg: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/40", badge: "bg-emerald-500 text-background", label: "Cát 吉" },
  neutral: { bg: "from-blue-400/20 to-blue-400/5", border: "border-blue-400/40", badge: "bg-blue-400 text-background", label: "Bình 平" },
  challenging: { bg: "from-red-500/20 to-red-500/5", border: "border-red-500/40", badge: "bg-red-500 text-foreground", label: "Hung 凶" },
};

const FREE_USES = 3;
const STORAGE_KEY = "boique_usage";

function getTodayUsage(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    return data.date === today ? data.count : 0;
  } catch { return 0; }
}

function setTodayUsage(count: number) {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count }));
}

function getQuestionHash(question: string, hexNum: number): string {
  return `${question.length}${hexNum}`;
}

function getCacheKey(hexNum: number, question: string): string {
  return `boi_que_${hexNum}_${getQuestionHash(question, hexNum)}`;
}

// Simple markdown renderer for AI results
function renderMarkdown(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-gold mt-5 mb-2 border-b border-gold/20 pb-1">{line.replace('## ', '')}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} className="text-md font-semibold text-gold/80 mt-4 mb-2">{line.replace('### ', '')}</h3>;
    if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-gold mt-5 mb-3">{line.replace('# ', '')}</h1>;
    if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-gold/40 pl-4 italic text-muted-foreground my-3 bg-gold/5 py-2 rounded-r">{line.replace('> ', '')}</blockquote>;
    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="text-muted-foreground ml-4 list-disc text-sm">{renderBold(line.replace(/^[-*] /, ''))}</li>;
    if (/^\d+\. /.test(line)) return <li key={i} className="text-muted-foreground ml-4 list-decimal text-sm">{renderBold(line.replace(/^\d+\. /, ''))}</li>;
    if (line === '---' || line === '***') return <hr key={i} className="border-gold/20 my-4" />;
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return <p key={i} className="text-muted-foreground leading-relaxed text-sm">{renderBold(line)}</p>;
  });
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

const BoiQue = () => {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<typeof QUE_DATA[0] | null>(null);
  const [hexLines, setHexLines] = useState<string[]>([]);
  const [coins, setCoins] = useState<boolean[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [useCount, setUseCount] = useState(getTodayUsage);
  const needsPayment = useCount >= FREE_USES;

  // AI state
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleGieoQue = () => {
    if (!question.trim()) {
      toast.error("Vui lòng nhập câu hỏi trước khi gieo quẻ");
      return;
    }

    setIsAnimating(true);
    setResult(null);
    setAiResult(null);
    setHexLines([]);
    setCoins([]);

    // Animate coins one by one
    const newCoins: boolean[] = [];
    const flipCoin = (index: number) => {
      setTimeout(() => {
        const isHeads = Math.random() > 0.5;
        newCoins.push(isHeads);
        setCoins([...newCoins]);

        if (index === 2) {
          setTimeout(() => {
            const randomQue = QUE_DATA[Math.floor(Math.random() * QUE_DATA.length)];
            // Generate 6 lines for the hexagram
            const lines = Array.from({ length: 6 }, () => Math.random() > 0.5 ? 'yang' : 'yin');
            setHexLines(lines);
            setResult(randomQue);
            setIsAnimating(false);
            const newCount = useCount + 1;
            setUseCount(newCount);
            setTodayUsage(newCount);
          }, 600);
        }
      }, (index + 1) * 500);
    };

    flipCoin(0);
    flipCoin(1);
    flipCoin(2);
  };

  const handleAnalyze = useCallback(async () => {
    if (!result) return;

    // Check cache
    const cacheKey = getCacheKey(result.id, question);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setAiResult(cached);
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: {
          analysisType: "hexagram",
          question: question.trim(),
          hexagramNumber: result.id,
          hexagramName: result.name,
          hexagramSymbol: result.symbol,
          lines: hexLines,
        },
      });

      if (error) throw error;
      const analysis = data?.analysis || "Không nhận được kết quả.";
      setAiResult(analysis);
      localStorage.setItem(cacheKey, analysis);
    } catch (err) {
      console.error("AI analysis error:", err);
      toast.error("Lỗi khi phân tích. Vui lòng thử lại.");
    } finally {
      setAiLoading(false);
    }
  }, [result, question, hexLines]);

  const handleReset = () => {
    setResult(null);
    setCoins([]);
    setHexLines([]);
    setQuestion("");
    setAiResult(null);
  };

  const handleShare = () => {
    if (aiResult) {
      navigator.clipboard.writeText(aiResult);
    } else if (result) {
      const text = `🎴 Bói Quẻ Dịch\nQuẻ ${result.id} - ${result.name} ${result.symbol}\n${result.summary}`;
      navigator.clipboard.writeText(text);
    }
    toast.success("Đã sao chép!");
  };

  const style = result ? fortuneConfig[result.fortune as keyof typeof fortuneConfig] : null;

  return (
    <PageLayout title="Bói Quẻ Dịch">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-surface-3 to-surface-2 border border-border">
          <div className="text-5xl mb-3">🎴</div>
          <h2 className="font-display text-xl text-foreground mb-2">
            Bói Quẻ 卦
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Gieo quẻ Kinh Dịch — Hỏi về một điều bạn muốn biết
          </p>
        </div>

        {/* Question Input */}
        <div className="space-y-3">
          <Textarea
            placeholder="Nhập câu hỏi của bạn... (VD: Tôi có nên đầu tư lúc này?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[80px] bg-surface-2 border-border text-foreground placeholder:text-muted-foreground resize-none"
            disabled={isAnimating}
          />

          {/* Coins animation */}
          {(isAnimating || coins.length > 0) && (
            <div className="flex justify-center gap-4 py-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-500",
                    coins[i] !== undefined
                      ? coins[i]
                        ? "bg-gold/30 border-2 border-gold text-gold scale-100"
                        : "bg-muted/50 border-2 border-muted-foreground/30 text-muted-foreground scale-100"
                      : "bg-surface-3 border-2 border-border text-muted-foreground/30 animate-bounce"
                  )}
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  {coins[i] !== undefined ? (coins[i] ? "陽" : "陰") : "?"}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {needsPayment && !result ? (
            <PaymentGate
              feature="boi_que"
              title="Bói Quẻ Không Giới Hạn - 19.000đ"
              description="Mua 1 lần, dùng mãi mãi. Gieo quẻ Kinh Dịch không giới hạn lượt."
              onUnlocked={() => { setUseCount(0); setTodayUsage(0); }}
            >
              <div className="text-center space-y-2">
                <Button disabled variant="gold" size="lg" className="w-full">
                  Gieo Quẻ 🎴
                </Button>
                <p className="text-xs text-destructive font-medium">
                  ⚠️ Bạn đã dùng hết {FREE_USES} lần miễn phí hôm nay
                </p>
              </div>
            </PaymentGate>
          ) : !result ? (
            <>
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                onClick={handleGieoQue}
                disabled={isAnimating || !question.trim()}
              >
                {isAnimating ? "Đang gieo quẻ..." : "Gieo Quẻ 🎴"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Còn {FREE_USES - useCount}/{FREE_USES} lượt miễn phí hôm nay
              </p>
            </>
          ) : null}
        </div>

        {/* Result */}
        {result && style && (
          <div className="space-y-4 animate-fade-in">
            {/* Quẻ header - FREE */}
            <div className={cn(
              "rounded-2xl p-6 border bg-gradient-to-br",
              style.bg, style.border
            )}>
              <div className="flex justify-center mb-3">
                <span className={cn("px-4 py-1 rounded-full text-xs font-bold", style.badge)}>
                  {style.label}
                </span>
              </div>
              <h3 className="text-center font-display text-2xl text-foreground mb-1">
                Quẻ {String(result.id).padStart(2, "0")} — {result.name}
              </h3>
              <p className="text-center text-3xl tracking-widest text-gold mb-4">
                {result.symbol}
              </p>
              <p className="text-sm text-muted-foreground text-center italic">
                Ngũ hành: {result.element}
              </p>

              {/* Free summary */}
              <div className="mt-4 p-4 rounded-xl bg-surface-2/60">
                <p className="text-sm text-foreground leading-relaxed">
                  {result.summary}
                </p>
              </div>
            </div>

            {/* Action buttons - above PaymentGate so they're always clickable */}
            <div className="flex gap-3">
              <Button variant="goldOutline" className="flex-1" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Chia Sẻ
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Gieo Lại
              </Button>
            </div>

            {/* Locked AI detailed section */}
            <PaymentGate
              feature="boi_que"
              title="Bói Quẻ Không Giới Hạn - 19.000đ"
              description="Mua 1 lần, dùng mãi mãi. Xem giải nghĩa chi tiết AI, lời khuyên hành động."
              onUnlocked={handleAnalyze}
            >
              <div className="space-y-4">
                {aiLoading ? (
                  <div className={cn("rounded-2xl p-8 text-center bg-gradient-to-br from-surface-3 to-surface-2 border border-gold/20")}>
                    <div className="relative inline-block mb-4">
                      <Sparkles className="w-10 h-10 text-gold animate-spin" />
                    </div>
                    <p className="font-display text-lg text-foreground mb-1">Đang luận giải quẻ...</p>
                    <p className="text-sm text-muted-foreground">AI đang phân tích quẻ {result.name} theo câu hỏi của bạn</p>
                  </div>
                ) : aiResult ? (
                  <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-gold/20")}>
                    <div className="space-y-1">
                      {renderMarkdown(aiResult)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Button variant="gold" size="lg" onClick={handleAnalyze}>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Luận Giải AI Quẻ {result.name}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Phân tích chuyên sâu bằng AI dựa trên câu hỏi của bạn
                    </p>
                  </div>
                )}
              </div>
            </PaymentGate>
          </div>
        )}

        {!result && !isAnimating && (
          <p className="text-center text-xs text-muted-foreground opacity-60">
            Tập trung vào câu hỏi, thành tâm rồi nhấn "Gieo Quẻ"
          </p>
        )}
      </div>
    </PageLayout>
  );
};

export default BoiQue;
