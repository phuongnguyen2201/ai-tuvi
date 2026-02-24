import React, { useState, useCallback } from "react";
import PageLayout from "@/components/PageLayout";
import PaymentGate from "@/components/PaymentGate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Share2, RotateCcw, Sparkles, Loader2, Search, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// 64 quẻ Kinh Dịch
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
  { id: 13, name: "Thiên Hỏa Đồng Nhân", symbol: "☰☲", element: "Trời/Lửa", summary: "Hòa hợp với mọi người, đoàn kết sức mạnh. Hợp tác sẽ thành công.", fortune: "good" },
  { id: 14, name: "Hỏa Thiên Đại Hữu", symbol: "☲☰", element: "Lửa/Trời", summary: "Đại cát, sở hữu lớn. Thời kỳ thịnh vượng, tài lộc dồi dào.", fortune: "excellent" },
  { id: 15, name: "Địa Sơn Khiêm", symbol: "☷☶", element: "Đất/Núi", summary: "Khiêm tốn mang lại phúc lành. Người khiêm nhường được kính trọng.", fortune: "good" },
  { id: 16, name: "Lôi Địa Dự", symbol: "☳☷", element: "Sấm/Đất", summary: "Vui vẻ, hoan hỉ. Thời điểm tốt để hành động và mở rộng.", fortune: "good" },
  { id: 17, name: "Trạch Lôi Tùy", symbol: "☱☳", element: "Hồ/Sấm", summary: "Thuận theo hoàn cảnh, linh hoạt thích ứng sẽ thành công.", fortune: "good" },
  { id: 18, name: "Sơn Phong Cổ", symbol: "☶☴", element: "Núi/Gió", summary: "Sửa chữa sai lầm cũ, cải cách đổi mới. Cần hành động quyết đoán.", fortune: "neutral" },
  { id: 19, name: "Địa Trạch Lâm", symbol: "☷☱", element: "Đất/Hồ", summary: "Tiến đến gần, cơ hội lớn đang đến. Nắm bắt thời cơ.", fortune: "excellent" },
  { id: 20, name: "Phong Địa Quan", symbol: "☴☷", element: "Gió/Đất", summary: "Quan sát, chiêm nghiệm. Nhìn lại bản thân trước khi hành động.", fortune: "neutral" },
  { id: 21, name: "Hỏa Lôi Phệ Hạp", symbol: "☲☳", element: "Lửa/Sấm", summary: "Cần quyết đoán xử lý vấn đề. Công lý sẽ được thực thi.", fortune: "neutral" },
  { id: 22, name: "Sơn Hỏa Bí", symbol: "☶☲", element: "Núi/Lửa", summary: "Vẻ đẹp bề ngoài, trang sức. Chú trọng hình thức nhưng đừng quên nội dung.", fortune: "good" },
  { id: 23, name: "Sơn Địa Bác", symbol: "☶☷", element: "Núi/Đất", summary: "Suy tàn, bóc lột. Thời kỳ khó khăn, cần giữ gìn nguồn lực.", fortune: "challenging" },
  { id: 24, name: "Địa Lôi Phục", symbol: "☷☳", element: "Đất/Sấm", summary: "Phục hồi, quay trở lại. Sau bóng tối là ánh sáng.", fortune: "good" },
  { id: 25, name: "Thiên Lôi Vô Vọng", symbol: "☰☳", element: "Trời/Sấm", summary: "Chân thật, không vọng tưởng. Hành động theo lẽ tự nhiên.", fortune: "good" },
  { id: 26, name: "Sơn Thiên Đại Súc", symbol: "☶☰", element: "Núi/Trời", summary: "Tích lũy lớn, tiềm năng to lớn. Thời điểm tốt để đầu tư dài hạn.", fortune: "excellent" },
  { id: 27, name: "Sơn Lôi Di", symbol: "☶☳", element: "Núi/Sấm", summary: "Nuôi dưỡng, chăm sóc. Chú ý sức khỏe và dinh dưỡng tinh thần.", fortune: "neutral" },
  { id: 28, name: "Trạch Phong Đại Quá", symbol: "☱☴", element: "Hồ/Gió", summary: "Quá mức, vượt giới hạn. Cẩn thận không nên quá sức.", fortune: "challenging" },
  { id: 29, name: "Thuần Khảm", symbol: "☵☵", element: "Nước", summary: "Hiểm nguy chồng chất. Giữ vững niềm tin, vượt qua thử thách.", fortune: "challenging" },
  { id: 30, name: "Thuần Ly", symbol: "☲☲", element: "Lửa", summary: "Sáng suốt, rực rỡ. Trí tuệ soi đường, nhưng cần biết dừng đúng lúc.", fortune: "good" },
  { id: 31, name: "Trạch Sơn Hàm", symbol: "☱☶", element: "Hồ/Núi", summary: "Cảm ứng, thu hút lẫn nhau. Tình duyên tốt đẹp, mối quan hệ hài hòa.", fortune: "good" },
  { id: 32, name: "Lôi Phong Hằng", symbol: "☳☴", element: "Sấm/Gió", summary: "Bền vững, kiên định. Giữ vững lập trường sẽ thành công lâu dài.", fortune: "good" },
  { id: 33, name: "Thiên Sơn Độn", symbol: "☰☶", element: "Trời/Núi", summary: "Rút lui đúng lúc là khôn ngoan. Biết tiến biết lùi.", fortune: "neutral" },
  { id: 34, name: "Lôi Thiên Đại Tráng", symbol: "☳☰", element: "Sấm/Trời", summary: "Sức mạnh lớn, hùng tráng. Dùng sức mạnh đúng cách, tránh bạo lực.", fortune: "good" },
  { id: 35, name: "Hỏa Địa Tấn", symbol: "☲☷", element: "Lửa/Đất", summary: "Tiến bộ, thăng tiến. Sự nghiệp phát triển thuận lợi.", fortune: "excellent" },
  { id: 36, name: "Địa Hỏa Minh Di", symbol: "☷☲", element: "Đất/Lửa", summary: "Ánh sáng bị che khuất. Ẩn nhẫn chờ thời, giữ trí tuệ bên trong.", fortune: "challenging" },
  { id: 37, name: "Phong Hỏa Gia Nhân", symbol: "☴☲", element: "Gió/Lửa", summary: "Gia đình hòa thuận, nội bộ ổn định. Chăm lo gia đạo.", fortune: "good" },
  { id: 38, name: "Hỏa Trạch Khuê", symbol: "☲☱", element: "Lửa/Hồ", summary: "Đối lập, mâu thuẫn. Tìm điểm chung trong sự khác biệt.", fortune: "neutral" },
  { id: 39, name: "Thủy Sơn Kiển", symbol: "☵☶", element: "Nước/Núi", summary: "Gian nan, trở ngại. Cần sự giúp đỡ, không nên đơn độc.", fortune: "challenging" },
  { id: 40, name: "Lôi Thủy Giải", symbol: "☳☵", element: "Sấm/Nước", summary: "Giải thoát, tháo gỡ khó khăn. Vấn đề sẽ được giải quyết.", fortune: "good" },
  { id: 41, name: "Sơn Trạch Tổn", symbol: "☶☱", element: "Núi/Hồ", summary: "Giảm bớt, hy sinh. Bớt cái thừa, bù cái thiếu sẽ cân bằng.", fortune: "neutral" },
  { id: 42, name: "Phong Lôi Ích", symbol: "☴☳", element: "Gió/Sấm", summary: "Được lợi, gia tăng. Thời điểm tốt để mở rộng và phát triển.", fortune: "excellent" },
  { id: 43, name: "Trạch Thiên Quải", symbol: "☱☰", element: "Hồ/Trời", summary: "Quyết đoán, cắt đứt. Loại bỏ cái xấu, giữ cái tốt.", fortune: "neutral" },
  { id: 44, name: "Thiên Phong Cấu", symbol: "☰☴", element: "Trời/Gió", summary: "Gặp gỡ bất ngờ. Cẩn thận với những mối quan hệ mới.", fortune: "neutral" },
  { id: 45, name: "Trạch Địa Tụy", symbol: "☱☷", element: "Hồ/Đất", summary: "Tụ họp, đoàn tụ. Sức mạnh tập thể, hợp tác thành công.", fortune: "good" },
  { id: 46, name: "Địa Phong Thăng", symbol: "☷☴", element: "Đất/Gió", summary: "Đi lên, phát triển. Tiến bộ từ từ nhưng chắc chắn.", fortune: "excellent" },
  { id: 47, name: "Trạch Thủy Khốn", symbol: "☱☵", element: "Hồ/Nước", summary: "Cùng quẫn, khốn đốn. Giữ vững ý chí, khó khăn sẽ qua.", fortune: "challenging" },
  { id: 48, name: "Thủy Phong Tỉnh", symbol: "☵☴", element: "Nước/Gió", summary: "Giếng nước, nguồn sống. Nuôi dưỡng bản thân và người khác.", fortune: "good" },
  { id: 49, name: "Trạch Hỏa Cách", symbol: "☱☲", element: "Hồ/Lửa", summary: "Cách mạng, đổi mới. Thời điểm thay đổi lớn đã đến.", fortune: "neutral" },
  { id: 50, name: "Hỏa Phong Đỉnh", symbol: "☲☴", element: "Lửa/Gió", summary: "Vạc đỉnh, thành tựu. Được tín nhiệm, sự nghiệp vững chắc.", fortune: "excellent" },
  { id: 51, name: "Thuần Chấn", symbol: "☳☳", element: "Sấm", summary: "Chấn động, bất ngờ. Sợ hãi ban đầu nhưng kết cục tốt đẹp.", fortune: "neutral" },
  { id: 52, name: "Thuần Cấn", symbol: "☶☶", element: "Núi", summary: "Dừng lại, tĩnh lặng. Biết dừng đúng lúc là trí tuệ.", fortune: "neutral" },
  { id: 53, name: "Phong Sơn Tiệm", symbol: "☴☶", element: "Gió/Núi", summary: "Tiến dần, từng bước. Kiên nhẫn tiến lên sẽ đạt mục tiêu.", fortune: "good" },
  { id: 54, name: "Lôi Trạch Quy Muội", symbol: "☳☱", element: "Sấm/Hồ", summary: "Hôn nhân, kết hợp. Cẩn thận trong cam kết, đừng vội vàng.", fortune: "neutral" },
  { id: 55, name: "Lôi Hỏa Phong", symbol: "☳☲", element: "Sấm/Lửa", summary: "Phong phú, thịnh vượng. Đỉnh cao nhưng cần chuẩn bị cho suy thoái.", fortune: "excellent" },
  { id: 56, name: "Hỏa Sơn Lữ", symbol: "☲☶", element: "Lửa/Núi", summary: "Lữ khách, phiêu bạt. Cẩn thận khi xa nhà, giữ mình khiêm tốn.", fortune: "neutral" },
  { id: 57, name: "Thuần Tốn", symbol: "☴☴", element: "Gió", summary: "Thuận theo, len lỏi. Nhẹ nhàng nhưng kiên trì sẽ thấm sâu.", fortune: "good" },
  { id: 58, name: "Thuần Đoài", symbol: "☱☱", element: "Hồ", summary: "Vui vẻ, hòa nhã. Niềm vui lan tỏa, giao tiếp tốt đẹp.", fortune: "good" },
  { id: 59, name: "Phong Thủy Hoán", symbol: "☴☵", element: "Gió/Nước", summary: "Phân tán, giải tỏa. Phá vỡ bế tắc, mở ra hướng mới.", fortune: "neutral" },
  { id: 60, name: "Thủy Trạch Tiết", symbol: "☵☱", element: "Nước/Hồ", summary: "Tiết chế, điều độ. Biết giới hạn của mình sẽ thành công.", fortune: "good" },
  { id: 61, name: "Phong Trạch Trung Phu", symbol: "☴☱", element: "Gió/Hồ", summary: "Thành tín, trung thực. Lòng tin chân thành cảm hóa mọi người.", fortune: "good" },
  { id: 62, name: "Lôi Sơn Tiểu Quá", symbol: "☳☶", element: "Sấm/Núi", summary: "Vượt quá chút ít, cẩn thận việc nhỏ. Khiêm tốn trong hành động.", fortune: "neutral" },
  { id: 63, name: "Thủy Hỏa Ký Tế", symbol: "☵☲", element: "Nước/Lửa", summary: "Đã hoàn thành, viên mãn. Giữ gìn thành quả, cẩn thận lúc cuối.", fortune: "good" },
  { id: 64, name: "Hỏa Thủy Vị Tế", symbol: "☲☵", element: "Lửa/Nước", summary: "Chưa hoàn thành, còn dang dở. Kiên trì đến cùng, thành công sẽ đến.", fortune: "neutral" },
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

  // Search/lookup state
  const [searchTerm, setSearchTerm] = useState("");
  const [showLookup, setShowLookup] = useState(false);
  const [selectedQue, setSelectedQue] = useState<typeof QUE_DATA[0] | null>(null);

  const filteredQue = searchTerm.trim()
    ? QUE_DATA.filter(q =>
        q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.id.toString() === searchTerm.trim() ||
        q.element.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.symbol.includes(searchTerm)
      )
    : QUE_DATA;

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
          <div className="space-y-4">
            {/* Quẻ header - FREE */}
            <div className={cn(
              "rounded-2xl p-6 border bg-gradient-to-br ink-splash",
              style.bg, style.border
            )}>
              <div className="flex justify-center mb-3 ink-drip" style={{ animationDelay: '0.3s' }}>
                <span className={cn("px-4 py-1 rounded-full text-xs font-bold", style.badge)}>
                  {style.label}
                </span>
              </div>
              <h3 className="text-center font-display text-2xl text-foreground mb-1 brush-stroke" style={{ animationDelay: '0.5s' }}>
                Quẻ {String(result.id).padStart(2, "0")} — {result.name}
              </h3>
              <p className="text-center text-3xl tracking-widest text-gold mb-4 ink-reveal" style={{ animationDelay: '0.7s' }}>
                {result.symbol}
              </p>
              <p className="text-sm text-muted-foreground text-center italic ink-drip" style={{ animationDelay: '0.9s' }}>
                Ngũ hành: {result.element}
              </p>

              {/* Free summary */}
              <div className="mt-4 p-4 rounded-xl bg-surface-2/60 ink-reveal" style={{ animationDelay: '1.1s' }}>
                <p className="text-sm text-foreground leading-relaxed">
                  {result.summary}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 ink-drip" style={{ animationDelay: '1.3s' }}>
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

        {/* Lookup / Tra cứu 64 quẻ */}
        <div className="rounded-2xl bg-gradient-to-br from-surface-3 to-surface-2 border border-border overflow-hidden">
          <button
            onClick={() => { setShowLookup(!showLookup); setSelectedQue(null); }}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gold" />
              <span className="font-display text-foreground">Tra Cứu 64 Quẻ Dịch</span>
            </div>
            {showLookup ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showLookup && (
            <div className="px-4 pb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, số, ngũ hành..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setSelectedQue(null); }}
                  className="pl-9 bg-surface-2 border-border text-foreground"
                />
              </div>

              {/* Selected quẻ detail */}
              {selectedQue && (
                <div className={cn(
                  "rounded-xl p-4 border bg-gradient-to-br animate-fade-in",
                  fortuneConfig[selectedQue.fortune as keyof typeof fortuneConfig].bg,
                  fortuneConfig[selectedQue.fortune as keyof typeof fortuneConfig].border
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display text-lg text-foreground">
                      {String(selectedQue.id).padStart(2, "0")}. {selectedQue.name}
                    </h4>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", fortuneConfig[selectedQue.fortune as keyof typeof fortuneConfig].badge)}>
                      {fortuneConfig[selectedQue.fortune as keyof typeof fortuneConfig].label}
                    </span>
                  </div>
                  <p className="text-2xl tracking-widest text-gold mb-2">{selectedQue.symbol}</p>
                  <p className="text-xs text-muted-foreground italic mb-2">Ngũ hành: {selectedQue.element}</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedQue.summary}</p>
                  <button
                    onClick={() => setSelectedQue(null)}
                    className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Quay lại danh sách
                  </button>
                </div>
              )}

              {/* Quẻ list */}
              {!selectedQue && (
                <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                  {filteredQue.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">Không tìm thấy quẻ nào</p>
                  ) : (
                    filteredQue.map((q) => {
                      const cfg = fortuneConfig[q.fortune as keyof typeof fortuneConfig];
                      return (
                        <button
                          key={q.id}
                          onClick={() => setSelectedQue(q)}
                          className={cn(
                            "w-full text-left rounded-lg p-3 border transition-all hover:scale-[1.01]",
                            "bg-surface-2/50 border-border hover:border-gold/30"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg text-gold">{q.symbol}</span>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {String(q.id).padStart(2, "0")}. {q.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">{q.element}</p>
                              </div>
                            </div>
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", cfg.badge)}>
                              {cfg.label}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default BoiQue;
