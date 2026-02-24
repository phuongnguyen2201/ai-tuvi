import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import PaymentGate from "@/components/PaymentGate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Share2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

// 64 quẻ Kinh Dịch (subset representative)
const QUE_DATA = [
  { id: 1, name: "Thuần Càn", symbol: "☰☰", element: "Trời", summary: "Quẻ của sức mạnh, sáng tạo và thành công lớn. Mọi việc hanh thông nếu giữ chính đạo.", detail: "Càn tượng trưng cho Trời, cho sự cứng cỏi mạnh mẽ. Quẻ này cho thấy bạn đang trong giai đoạn đầy năng lượng, thuận lợi để khởi sự. Tuy nhiên cần tránh kiêu ngạo, giữ khiêm tốn thì mọi việc mới bền vững.", advice: "Hãy hành động quyết đoán nhưng giữ đạo đức. Thời điểm tốt để khởi nghiệp, đầu tư.", fortune: "excellent" },
  { id: 2, name: "Thuần Khôn", symbol: "☷☷", element: "Đất", summary: "Quẻ của sự bao dung, nhẫn nại. Thuận theo tự nhiên, không nên gượng ép.", detail: "Khôn tượng trưng cho Đất, cho sự nhu thuận. Quẻ khuyên bạn nên kiên nhẫn, theo người dẫn dắt tốt, không nên tự ý hành động một mình. Hợp tác và lắng nghe sẽ mang lại kết quả.", advice: "Hãy kiên nhẫn chờ đợi, hợp tác với người khác. Không phải lúc để đơn độc hành động.", fortune: "good" },
  { id: 3, name: "Thủy Lôi Truân", symbol: "☵☳", element: "Nước/Sấm", summary: "Khởi đầu gian nan nhưng sẽ thành công nếu kiên trì.", detail: "Truân là quẻ của sự khó khăn ban đầu. Như mầm cây phải xuyên qua lớp đất cứng, bạn đang gặp trở ngại nhưng đây là bước đệm cần thiết. Kiên trì sẽ được đền đáp xứng đáng.", advice: "Đừng vội vàng, từ từ xây dựng nền tảng. Tìm người giúp đỡ, đừng cố gắng một mình.", fortune: "challenging" },
  { id: 4, name: "Sơn Thủy Mông", symbol: "☶☵", element: "Núi/Nước", summary: "Quẻ của sự học hỏi và khai sáng. Cần tìm thầy chỉ đường.", detail: "Mông nghĩa là mông muội, chưa sáng tỏ. Quẻ khuyên bạn nên khiêm tốn học hỏi, tìm người hướng dẫn. Đừng tự phụ cho rằng mình biết hết, vì đó là nguồn gốc của sai lầm.", advice: "Hãy tìm cố vấn, mentor hoặc người có kinh nghiệm. Học hỏi là con đường ngắn nhất.", fortune: "neutral" },
  { id: 5, name: "Thủy Thiên Nhu", symbol: "☵☰", element: "Nước/Trời", summary: "Chờ đợi đúng thời cơ. Kiên nhẫn sẽ được thưởng.", detail: "Nhu là chờ đợi. Như mây tụ trên trời chờ mưa xuống, bạn cần đợi thời điểm chín muồi. Hành động vội vàng sẽ thất bại, nhưng chờ đợi không có nghĩa là thụ động — hãy chuẩn bị sẵn sàng.", advice: "Chuẩn bị kỹ lưỡng và chờ đợi cơ hội. Đừng nôn nóng, thời cơ sẽ đến.", fortune: "good" },
  { id: 6, name: "Thiên Thủy Tụng", symbol: "☰☵", element: "Trời/Nước", summary: "Tranh chấp, xung đột. Nên tìm trọng tài, tránh kiện cáo.", detail: "Tụng là tranh tụng, kiện cáo. Quẻ cảnh báo về mâu thuẫn, bất đồng trong các mối quan hệ hoặc công việc. Nên tìm người hòa giải, nhượng bộ một phần để giữ hòa khí.", advice: "Tránh tranh chấp, tìm cách hòa giải. Nhượng bộ đôi chút để được nhiều hơn.", fortune: "challenging" },
  { id: 7, name: "Địa Thủy Sư", symbol: "☷☵", element: "Đất/Nước", summary: "Quẻ của sự lãnh đạo và tổ chức. Cần kỷ luật để thành công.", detail: "Sư là quân đội, tượng trưng cho tổ chức và kỷ luật. Quẻ cho thấy bạn cần lãnh đạo hoặc được lãnh đạo tốt. Hành động có chiến lược, có tổ chức sẽ mang lại thắng lợi.", advice: "Hãy lên kế hoạch chi tiết, hành động có tổ chức. Kỷ luật là chìa khóa.", fortune: "good" },
  { id: 8, name: "Thủy Địa Tỷ", symbol: "☵☷", element: "Nước/Đất", summary: "Đoàn kết, hợp tác. Tìm đồng minh, liên kết sức mạnh.", detail: "Tỷ là thân cận, hợp tác. Như nước thấm vào đất, sự gắn kết tự nhiên mang lại lợi ích cho cả hai bên. Đây là thời điểm tốt để xây dựng mối quan hệ, tìm đối tác.", advice: "Mở rộng mối quan hệ, tìm đối tác đáng tin cậy. Hợp tác sẽ nhân đôi sức mạnh.", fortune: "excellent" },
  { id: 9, name: "Phong Thiên Tiểu Súc", symbol: "☴☰", element: "Gió/Trời", summary: "Tích lũy nhỏ, tiến từng bước. Chưa đủ lực để làm lớn.", detail: "Tiểu Súc là tích trữ nhỏ. Sức chưa đủ mạnh để làm việc lớn, nên tích lũy dần dần. Hãy bắt đầu từ việc nhỏ, không nên tham lam vội vàng.", advice: "Bắt đầu từ việc nhỏ, tích lũy kinh nghiệm và nguồn lực. Kiên nhẫn là vàng.", fortune: "neutral" },
  { id: 10, name: "Thiên Trạch Lý", symbol: "☰☱", element: "Trời/Hồ", summary: "Cẩn thận từng bước, như đi trên lưng hổ. Thận trọng sẽ an toàn.", detail: "Lý là bước đi, lễ nghĩa. Như đạp lên đuôi hổ mà hổ không cắn, nghĩa là dù tình huống nguy hiểm nhưng nếu cư xử đúng mực sẽ vượt qua an toàn.", advice: "Cẩn thận trong mọi việc, giữ lễ nghĩa. Đừng liều lĩnh nhưng cũng đừng sợ hãi.", fortune: "neutral" },
  { id: 11, name: "Địa Thiên Thái", symbol: "☷☰", element: "Đất/Trời", summary: "Quẻ đại cát! Thông suốt, hanh thông, vạn sự như ý.", detail: "Thái là thông thái, hanh thông. Trời đất giao hòa, âm dương cân bằng. Đây là một trong những quẻ tốt nhất, báo hiệu giai đoạn thuận lợi, thành công trong mọi lĩnh vực.", advice: "Tận dụng giai đoạn tốt đẹp này! Hành động quyết đoán, mở rộng và phát triển.", fortune: "excellent" },
  { id: 12, name: "Thiên Địa Bĩ", symbol: "☰☷", element: "Trời/Đất", summary: "Bế tắc, trì trệ. Cần ẩn nhẫn chờ thời, không nên hành động.", detail: "Bĩ là bế tắc, trái ngược với Thái. Trời đất không giao hòa, mọi việc đình trệ. Đây là lúc cần ẩn nhẫn, giữ gìn sức lực, đợi thời cơ thay đổi.", advice: "Không nên khởi sự mới. Giữ nguyên hiện trạng, tiết kiệm nguồn lực, chờ thời.", fortune: "challenging" },
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

const BoiQue = () => {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<typeof QUE_DATA[0] | null>(null);
  const [coins, setCoins] = useState<boolean[]>([]); // true = ngửa, false = sấp
  const [isAnimating, setIsAnimating] = useState(false);
  const [useCount, setUseCount] = useState(getTodayUsage);
  const needsPayment = useCount >= FREE_USES;

  const handleGieoQue = () => {
    if (!question.trim()) {
      toast.error("Vui lòng nhập câu hỏi trước khi gieo quẻ");
      return;
    }

    setIsAnimating(true);
    setResult(null);
    setCoins([]);

    // Animate coins one by one
    const newCoins: boolean[] = [];
    const flipCoin = (index: number) => {
      setTimeout(() => {
        const isHeads = Math.random() > 0.5;
        newCoins.push(isHeads);
        setCoins([...newCoins]);

        if (index === 2) {
          // All 3 coins flipped → pick a quẻ
          setTimeout(() => {
            const randomQue = QUE_DATA[Math.floor(Math.random() * QUE_DATA.length)];
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

  const handleReset = () => {
    setResult(null);
    setCoins([]);
    setQuestion("");
  };

  const handleShare = () => {
    if (!result) return;
    const text = `🎴 Bói Quẻ Dịch\nQuẻ ${result.id} - ${result.name} ${result.symbol}\n${result.summary}`;
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép quẻ!");
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
              title="Bói Quẻ Không Giới Hạn"
              price="19.000đ"
              description="Mua 1 lần, dùng mãi mãi. Gieo quẻ Kinh Dịch không giới hạn lượt."
              onUnlocked={() => { setUseCount(0); setTodayUsage(0); }}
            >
              <Button disabled variant="gold" size="lg" className="w-full">
                Gieo Quẻ 🎴
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Đã hết {FREE_USES} lượt miễn phí hôm nay
              </p>
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
            {/* Quẻ header */}
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

            {/* Locked detailed section */}
            <PaymentGate
              feature="boi_que"
              title="Bói Quẻ Không Giới Hạn"
              price="19.000đ"
              description="Mua 1 lần, dùng mãi mãi. Xem giải nghĩa chi tiết, lời khuyên hành động."
            >
              <div className="space-y-4">
                {/* Detailed interpretation */}
                <div className="rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-border">
                  <h4 className="font-display text-gold text-base mb-3 flex items-center gap-2">
                    📜 Giải Nghĩa Chi Tiết
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.detail}
                  </p>
                </div>

                {/* Advice */}
                <div className="rounded-2xl p-5 bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20">
                  <h4 className="font-display text-gold text-base mb-3 flex items-center gap-2">
                    💡 Lời Khuyên Hành Động
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {result.advice}
                  </p>
                </div>

                {/* Quẻ biến hint */}
                <div className="rounded-2xl p-5 bg-surface-3/50 border border-border">
                  <h4 className="font-display text-foreground text-base mb-3 flex items-center gap-2">
                    🔄 Quẻ Biến
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Hào động ở vị trí {coins.filter(c => c).length + 1}: Quẻ có xu hướng biến chuyển theo chiều{" "}
                    {coins.filter(c => c).length >= 2 ? "tích cực" : "cần cẩn thận"}.
                    Nên chú ý thời điểm hành động để đạt kết quả tốt nhất.
                  </p>
                </div>
              </div>
            </PaymentGate>

            {/* Action buttons */}
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
          </div>
        )}

        {/* Empty state hint */}
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
