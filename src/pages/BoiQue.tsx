import React, { useState, useCallback, useRef, useEffect } from "react";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { hapticImpact, hapticSuccess } from "@/utils/native";
import {
  Share2,
  RotateCcw,
  Sparkles,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Lock,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStreamingAnalysis } from "@/hooks/useStreamingAnalysis";
import { useAuth } from "@/contexts/AuthContext";
import { useUpgradeModal } from "@/contexts/UpgradeModalContext";
import { useDemoExample } from "@/hooks/useDemoExample";
import { DemoBanner } from "@/components/DemoBanner";
import { DemoSkeleton } from "@/components/DemoSkeleton";
import VietQRPaymentModal from "@/components/VietQRPaymentModal";
import { AnalysisDisclaimer } from "@/components/AnalysisDisclaimer";

const QUE_DATA = [
  {
    id: 1,
    name: "Thuần Càn",
    symbol: "☰☰",
    element: "Trời",
    summary: "Quẻ của sức mạnh, sáng tạo và thành công lớn. Mọi việc hanh thông nếu giữ chính đạo.",
    fortune: "excellent",
  },
  {
    id: 2,
    name: "Thuần Khôn",
    symbol: "☷☷",
    element: "Đất",
    summary: "Quẻ của sự bao dung, nhẫn nại. Thuận theo tự nhiên, không nên gượng ép.",
    fortune: "good",
  },
  {
    id: 3,
    name: "Thủy Lôi Truân",
    symbol: "☵☳",
    element: "Nước/Sấm",
    summary: "Khởi đầu gian nan nhưng sẽ thành công nếu kiên trì.",
    fortune: "challenging",
  },
  {
    id: 4,
    name: "Sơn Thủy Mông",
    symbol: "☶☵",
    element: "Núi/Nước",
    summary: "Quẻ của sự học hỏi và khai sáng. Cần tìm thầy chỉ đường.",
    fortune: "neutral",
  },
  {
    id: 5,
    name: "Thủy Thiên Nhu",
    symbol: "☵☰",
    element: "Nước/Trời",
    summary: "Chờ đợi đúng thời cơ. Kiên nhẫn sẽ được thưởng.",
    fortune: "good",
  },
  {
    id: 6,
    name: "Thiên Thủy Tụng",
    symbol: "☰☵",
    element: "Trời/Nước",
    summary: "Tranh chấp, xung đột. Nên tìm trọng tài, tránh kiện cáo.",
    fortune: "challenging",
  },
  {
    id: 7,
    name: "Địa Thủy Sư",
    symbol: "☷☵",
    element: "Đất/Nước",
    summary: "Quẻ của sự lãnh đạo và tổ chức. Cần kỷ luật để thành công.",
    fortune: "good",
  },
  {
    id: 8,
    name: "Thủy Địa Tỷ",
    symbol: "☵☷",
    element: "Nước/Đất",
    summary: "Đoàn kết, hợp tác. Tìm đồng minh, liên kết sức mạnh.",
    fortune: "excellent",
  },
  {
    id: 9,
    name: "Phong Thiên Tiểu Súc",
    symbol: "☴☰",
    element: "Gió/Trời",
    summary: "Tích lũy nhỏ, tiến từng bước. Chưa đủ lực để làm lớn.",
    fortune: "neutral",
  },
  {
    id: 10,
    name: "Thiên Trạch Lý",
    symbol: "☰☱",
    element: "Trời/Hồ",
    summary: "Cẩn thận từng bước, như đi trên lưng hổ. Thận trọng sẽ an toàn.",
    fortune: "neutral",
  },
  {
    id: 11,
    name: "Địa Thiên Thái",
    symbol: "☷☰",
    element: "Đất/Trời",
    summary: "Quẻ đại cát! Thông suốt, hanh thông, vạn sự như ý.",
    fortune: "excellent",
  },
  {
    id: 12,
    name: "Thiên Địa Bĩ",
    symbol: "☰☷",
    element: "Trời/Đất",
    summary: "Bế tắc, trì trệ. Cần ẩn nhẫn chờ thời, không nên hành động.",
    fortune: "challenging",
  },
  {
    id: 13,
    name: "Thiên Hỏa Đồng Nhân",
    symbol: "☰☲",
    element: "Trời/Lửa",
    summary: "Hòa hợp với mọi người, đoàn kết sức mạnh. Hợp tác sẽ thành công.",
    fortune: "good",
  },
  {
    id: 14,
    name: "Hỏa Thiên Đại Hữu",
    symbol: "☲☰",
    element: "Lửa/Trời",
    summary: "Đại cát, sở hữu lớn. Thời kỳ thịnh vượng, tài lộc dồi dào.",
    fortune: "excellent",
  },
  {
    id: 15,
    name: "Địa Sơn Khiêm",
    symbol: "☷☶",
    element: "Đất/Núi",
    summary: "Khiêm tốn mang lại phúc lành. Người khiêm nhường được kính trọng.",
    fortune: "good",
  },
  {
    id: 16,
    name: "Lôi Địa Dự",
    symbol: "☳☷",
    element: "Sấm/Đất",
    summary: "Vui vẻ, hoan hỉ. Thời điểm tốt để hành động và mở rộng.",
    fortune: "good",
  },
  {
    id: 17,
    name: "Trạch Lôi Tùy",
    symbol: "☱☳",
    element: "Hồ/Sấm",
    summary: "Thuận theo hoàn cảnh, linh hoạt thích ứng sẽ thành công.",
    fortune: "good",
  },
  {
    id: 18,
    name: "Sơn Phong Cổ",
    symbol: "☶☴",
    element: "Núi/Gió",
    summary: "Sửa chữa sai lầm cũ, cải cách đổi mới. Cần hành động quyết đoán.",
    fortune: "neutral",
  },
  {
    id: 19,
    name: "Địa Trạch Lâm",
    symbol: "☷☱",
    element: "Đất/Hồ",
    summary: "Tiến đến gần, cơ hội lớn đang đến. Nắm bắt thời cơ.",
    fortune: "excellent",
  },
  {
    id: 20,
    name: "Phong Địa Quan",
    symbol: "☴☷",
    element: "Gió/Đất",
    summary: "Quan sát, chiêm nghiệm. Nhìn lại bản thân trước khi hành động.",
    fortune: "neutral",
  },
  {
    id: 21,
    name: "Hỏa Lôi Phệ Hạp",
    symbol: "☲☳",
    element: "Lửa/Sấm",
    summary: "Cần quyết đoán xử lý vấn đề. Công lý sẽ được thực thi.",
    fortune: "neutral",
  },
  {
    id: 22,
    name: "Sơn Hỏa Bí",
    symbol: "☶☲",
    element: "Núi/Lửa",
    summary: "Vẻ đẹp bề ngoài, trang sức. Chú trọng hình thức nhưng đừng quên nội dung.",
    fortune: "good",
  },
  {
    id: 23,
    name: "Sơn Địa Bác",
    symbol: "☶☷",
    element: "Núi/Đất",
    summary: "Suy tàn, bóc lột. Thời kỳ khó khăn, cần giữ gìn nguồn lực.",
    fortune: "challenging",
  },
  {
    id: 24,
    name: "Địa Lôi Phục",
    symbol: "☷☳",
    element: "Đất/Sấm",
    summary: "Phục hồi, quay trở lại. Sau bóng tối là ánh sáng.",
    fortune: "good",
  },
  {
    id: 25,
    name: "Thiên Lôi Vô Vọng",
    symbol: "☰☳",
    element: "Trời/Sấm",
    summary: "Chân thật, không vọng tưởng. Hành động theo lẽ tự nhiên.",
    fortune: "good",
  },
  {
    id: 26,
    name: "Sơn Thiên Đại Súc",
    symbol: "☶☰",
    element: "Núi/Trời",
    summary: "Tích lũy lớn, tiềm năng to lớn. Thời điểm tốt để đầu tư dài hạn.",
    fortune: "excellent",
  },
  {
    id: 27,
    name: "Sơn Lôi Di",
    symbol: "☶☳",
    element: "Núi/Sấm",
    summary: "Nuôi dưỡng, chăm sóc. Chú ý sức khỏe và dinh dưỡng tinh thần.",
    fortune: "neutral",
  },
  {
    id: 28,
    name: "Trạch Phong Đại Quá",
    symbol: "☱☴",
    element: "Hồ/Gió",
    summary: "Quá mức, vượt giới hạn. Cẩn thận không nên quá sức.",
    fortune: "challenging",
  },
  {
    id: 29,
    name: "Thuần Khảm",
    symbol: "☵☵",
    element: "Nước",
    summary: "Hiểm nguy chồng chất. Giữ vững niềm tin, vượt qua thử thách.",
    fortune: "challenging",
  },
  {
    id: 30,
    name: "Thuần Ly",
    symbol: "☲☲",
    element: "Lửa",
    summary: "Sáng suốt, rực rỡ. Trí tuệ soi đường, nhưng cần biết dừng đúng lúc.",
    fortune: "good",
  },
  {
    id: 31,
    name: "Trạch Sơn Hàm",
    symbol: "☱☶",
    element: "Hồ/Núi",
    summary: "Cảm ứng, thu hút lẫn nhau. Tình duyên tốt đẹp, mối quan hệ hài hòa.",
    fortune: "good",
  },
  {
    id: 32,
    name: "Lôi Phong Hằng",
    symbol: "☳☴",
    element: "Sấm/Gió",
    summary: "Bền vững, kiên định. Giữ vững lập trường sẽ thành công lâu dài.",
    fortune: "good",
  },
  {
    id: 33,
    name: "Thiên Sơn Độn",
    symbol: "☰☶",
    element: "Trời/Núi",
    summary: "Rút lui đúng lúc là khôn ngoan. Biết tiến biết lùi.",
    fortune: "neutral",
  },
  {
    id: 34,
    name: "Lôi Thiên Đại Tráng",
    symbol: "☳☰",
    element: "Sấm/Trời",
    summary: "Sức mạnh lớn, hùng tráng. Dùng sức mạnh đúng cách, tránh bạo lực.",
    fortune: "good",
  },
  {
    id: 35,
    name: "Hỏa Địa Tấn",
    symbol: "☲☷",
    element: "Lửa/Đất",
    summary: "Tiến bộ, thăng tiến. Sự nghiệp phát triển thuận lợi.",
    fortune: "excellent",
  },
  {
    id: 36,
    name: "Địa Hỏa Minh Di",
    symbol: "☷☲",
    element: "Đất/Lửa",
    summary: "Ánh sáng bị che khuất. Ẩn nhẫn chờ thời, giữ trí tuệ bên trong.",
    fortune: "challenging",
  },
  {
    id: 37,
    name: "Phong Hỏa Gia Nhân",
    symbol: "☴☲",
    element: "Gió/Lửa",
    summary: "Gia đình hòa thuận, nội bộ ổn định. Chăm lo gia đạo.",
    fortune: "good",
  },
  {
    id: 38,
    name: "Hỏa Trạch Khuê",
    symbol: "☲☱",
    element: "Lửa/Hồ",
    summary: "Đối lập, mâu thuẫn. Tìm điểm chung trong sự khác biệt.",
    fortune: "neutral",
  },
  {
    id: 39,
    name: "Thủy Sơn Kiển",
    symbol: "☵☶",
    element: "Nước/Núi",
    summary: "Gian nan, trở ngại. Cần sự giúp đỡ, không nên đơn độc.",
    fortune: "challenging",
  },
  {
    id: 40,
    name: "Lôi Thủy Giải",
    symbol: "☳☵",
    element: "Sấm/Nước",
    summary: "Giải thoát, tháo gỡ khó khăn. Vấn đề sẽ được giải quyết.",
    fortune: "good",
  },
  {
    id: 41,
    name: "Sơn Trạch Tổn",
    symbol: "☶☱",
    element: "Núi/Hồ",
    summary: "Giảm bớt, hy sinh. Bớt cái thừa, bù cái thiếu sẽ cân bằng.",
    fortune: "neutral",
  },
  {
    id: 42,
    name: "Phong Lôi Ích",
    symbol: "☴☳",
    element: "Gió/Sấm",
    summary: "Được lợi, gia tăng. Thời điểm tốt để mở rộng và phát triển.",
    fortune: "excellent",
  },
  {
    id: 43,
    name: "Trạch Thiên Quải",
    symbol: "☱☰",
    element: "Hồ/Trời",
    summary: "Quyết đoán, cắt đứt. Loại bỏ cái xấu, giữ cái tốt.",
    fortune: "neutral",
  },
  {
    id: 44,
    name: "Thiên Phong Cấu",
    symbol: "☰☴",
    element: "Trời/Gió",
    summary: "Gặp gỡ bất ngờ. Cẩn thận với những mối quan hệ mới.",
    fortune: "neutral",
  },
  {
    id: 45,
    name: "Trạch Địa Tụy",
    symbol: "☱☷",
    element: "Hồ/Đất",
    summary: "Tụ họp, đoàn tụ. Sức mạnh tập thể, hợp tác thành công.",
    fortune: "good",
  },
  {
    id: 46,
    name: "Địa Phong Thăng",
    symbol: "☷☴",
    element: "Đất/Gió",
    summary: "Đi lên, phát triển. Tiến bộ từ từ nhưng chắc chắn.",
    fortune: "excellent",
  },
  {
    id: 47,
    name: "Trạch Thủy Khốn",
    symbol: "☱☵",
    element: "Hồ/Nước",
    summary: "Cùng quẫn, khốn đốn. Giữ vững ý chí, khó khăn sẽ qua.",
    fortune: "challenging",
  },
  {
    id: 48,
    name: "Thủy Phong Tỉnh",
    symbol: "☵☴",
    element: "Nước/Gió",
    summary: "Giếng nước, nguồn sống. Nuôi dưỡng bản thân và người khác.",
    fortune: "good",
  },
  {
    id: 49,
    name: "Trạch Hỏa Cách",
    symbol: "☱☲",
    element: "Hồ/Lửa",
    summary: "Cách mạng, đổi mới. Thời điểm thay đổi lớn đã đến.",
    fortune: "neutral",
  },
  {
    id: 50,
    name: "Hỏa Phong Đỉnh",
    symbol: "☲☴",
    element: "Lửa/Gió",
    summary: "Vạc đỉnh, thành tựu. Được tín nhiệm, sự nghiệp vững chắc.",
    fortune: "excellent",
  },
  {
    id: 51,
    name: "Thuần Chấn",
    symbol: "☳☳",
    element: "Sấm",
    summary: "Chấn động, bất ngờ. Sợ hãi ban đầu nhưng kết cục tốt đẹp.",
    fortune: "neutral",
  },
  {
    id: 52,
    name: "Thuần Cấn",
    symbol: "☶☶",
    element: "Núi",
    summary: "Dừng lại, tĩnh lặng. Biết dừng đúng lúc là trí tuệ.",
    fortune: "neutral",
  },
  {
    id: 53,
    name: "Phong Sơn Tiệm",
    symbol: "☴☶",
    element: "Gió/Núi",
    summary: "Tiến dần, từng bước. Kiên nhẫn tiến lên sẽ đạt mục tiêu.",
    fortune: "good",
  },
  {
    id: 54,
    name: "Lôi Trạch Quy Muội",
    symbol: "☳☱",
    element: "Sấm/Hồ",
    summary: "Hôn nhân, kết hợp. Cẩn thận trong cam kết, đừng vội vàng.",
    fortune: "neutral",
  },
  {
    id: 55,
    name: "Lôi Hỏa Phong",
    symbol: "☳☲",
    element: "Sấm/Lửa",
    summary: "Phong phú, thịnh vượng. Đỉnh cao nhưng cần chuẩn bị cho suy thoái.",
    fortune: "excellent",
  },
  {
    id: 56,
    name: "Hỏa Sơn Lữ",
    symbol: "☲☶",
    element: "Lửa/Núi",
    summary: "Lữ khách, phiêu bạt. Cẩn thận khi xa nhà, giữ mình khiêm tốn.",
    fortune: "neutral",
  },
  {
    id: 57,
    name: "Thuần Tốn",
    symbol: "☴☴",
    element: "Gió",
    summary: "Thuận theo, len lỏi. Nhẹ nhàng nhưng kiên trì sẽ thấm sâu.",
    fortune: "good",
  },
  {
    id: 58,
    name: "Thuần Đoài",
    symbol: "☱☱",
    element: "Hồ",
    summary: "Vui vẻ, hòa nhã. Niềm vui lan tỏa, giao tiếp tốt đẹp.",
    fortune: "good",
  },
  {
    id: 59,
    name: "Phong Thủy Hoán",
    symbol: "☴☵",
    element: "Gió/Nước",
    summary: "Phân tán, giải tỏa. Phá vỡ bế tắc, mở ra hướng mới.",
    fortune: "neutral",
  },
  {
    id: 60,
    name: "Thủy Trạch Tiết",
    symbol: "☵☱",
    element: "Nước/Hồ",
    summary: "Tiết chế, điều độ. Biết giới hạn của mình sẽ thành công.",
    fortune: "good",
  },
  {
    id: 61,
    name: "Phong Trạch Trung Phu",
    symbol: "☴☱",
    element: "Gió/Hồ",
    summary: "Thành tín, trung thực. Lòng tin chân thành cảm hóa mọi người.",
    fortune: "good",
  },
  {
    id: 62,
    name: "Lôi Sơn Tiểu Quá",
    symbol: "☳☶",
    element: "Sấm/Núi",
    summary: "Vượt quá chút ít, cẩn thận việc nhỏ. Khiêm tốn trong hành động.",
    fortune: "neutral",
  },
  {
    id: 63,
    name: "Thủy Hỏa Ký Tế",
    symbol: "☵☲",
    element: "Nước/Lửa",
    summary: "Đã hoàn thành, viên mãn. Giữ gìn thành quả, cẩn thận lúc cuối.",
    fortune: "good",
  },
  {
    id: 64,
    name: "Hỏa Thủy Vị Tế",
    symbol: "☲☵",
    element: "Lửa/Nước",
    summary: "Chưa hoàn thành, còn dang dở. Kiên trì đến cùng, thành công sẽ đến.",
    fortune: "neutral",
  },
];

const fortuneConfig = {
  excellent: {
    bg: "from-gold/20 to-gold/5",
    border: "border-gold/40",
    badge: "bg-gold text-white dark:text-background font-bold",
    label: "Đại Cát 大吉",
  },
  good: {
    bg: "from-emerald-600/20 to-emerald-600/5",
    border: "border-emerald-600/40",
    badge: "bg-emerald-600 text-white font-bold",
    label: "Cát 吉",
  },
  neutral: {
    bg: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/40",
    badge: "bg-blue-600 text-white font-bold",
    label: "Bình 平",
  },
  challenging: {
    bg: "from-red-600/20 to-red-600/5",
    border: "border-red-600/40",
    badge: "bg-red-600 text-white font-bold",
    label: "Hung 凶",
  },
};

const TRIGRAM_MAP: Record<string, number> = {
  "111": 0,
  "110": 1,
  "101": 2,
  "100": 3,
  "011": 4,
  "010": 5,
  "001": 6,
  "000": 7,
};
const HEXAGRAM_TABLE: number[][] = [
  [1, 43, 14, 34, 9, 5, 26, 11],
  [10, 58, 38, 54, 61, 60, 41, 19],
  [13, 49, 30, 55, 37, 63, 22, 36],
  [25, 17, 21, 51, 42, 3, 27, 24],
  [44, 28, 50, 32, 57, 48, 18, 46],
  [6, 47, 64, 40, 59, 29, 4, 7],
  [33, 31, 56, 62, 53, 39, 52, 15],
  [12, 45, 35, 16, 20, 8, 23, 2],
];

const tossCoins = (): number =>
  [Math.random() > 0.5 ? 3 : 2, Math.random() > 0.5 ? 3 : 2, Math.random() > 0.5 ? 3 : 2].reduce((a, b) => a + b, 0);
const lineValueToYinYang = (val: number): 0 | 1 => (val === 7 || val === 9 ? 1 : 0);
const lineValueToChanged = (val: number): 0 | 1 => (val === 9 ? 0 : val === 6 ? 1 : lineValueToYinYang(val));
const getHexNum = (lines: number[]) => {
  const lower = TRIGRAM_MAP[`${lines[0]}${lines[1]}${lines[2]}`];
  const upper = TRIGRAM_MAP[`${lines[3]}${lines[4]}${lines[5]}`];
  return HEXAGRAM_TABLE[lower][upper];
};
const calculateHexagram = () => {
  const lineValues = Array.from({ length: 6 }, () => tossCoins());
  const mainLines = lineValues.map(lineValueToYinYang);
  const changedLines = lineValues.map(lineValueToChanged);
  const hasChanging = lineValues.some((v) => v === 6 || v === 9);
  return {
    lineValues,
    mainLines,
    mainHexNum: getHexNum(mainLines),
    changedHexNum: hasChanging ? getHexNum(changedLines) : null,
    hasChanging,
    changingLines: lineValues.map((v, i) => ({ index: i, value: v, isChanging: v === 6 || v === 9 })),
  };
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

function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## "))
      return (
        <h2 key={i} className="text-lg font-bold text-gold mt-5 mb-2 border-b border-gold/20 pb-1">
          {line.replace("## ", "")}
        </h2>
      );
    if (line.startsWith("### "))
      return (
        <h3 key={i} className="text-md font-semibold text-gold/80 mt-4 mb-2">
          {line.replace("### ", "")}
        </h3>
      );
    if (line.startsWith("# "))
      return (
        <h1 key={i} className="text-xl font-bold text-gold mt-5 mb-3">
          {line.replace("# ", "")}
        </h1>
      );
    if (line.startsWith("> "))
      return (
        <blockquote
          key={i}
          className="border-l-4 border-gold/40 pl-4 italic text-muted-foreground my-3 bg-gold/5 py-2 rounded-r"
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
    if (line === "---" || line === "***") return <hr key={i} className="border-gold/20 my-4" />;
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-muted-foreground leading-relaxed text-sm">
        {renderBold(line)}
      </p>
    );
  });
}
function renderBold(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    return part;
  });
}

const BoiQue = () => {
  const { user, isGuest } = useAuth();
  const { openUpgrade } = useUpgradeModal();
  const { demoData, demoMode, demoLoading, fetchDemo, exitDemo } = useDemoExample();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<(typeof QUE_DATA)[0] | null>(null);
  const [hexLines, setHexLines] = useState<string[]>([]);
  const [coins, setCoins] = useState<boolean[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [changedHexNum, setChangedHexNum] = useState<number | null>(null);
  const [hasChanging, setHasChanging] = useState(false);
  const [changingLineIndexes, setChangingLineIndexes] = useState<number[]>([]);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { isStreaming: isStreamingAI, streamedText, startStreaming, abort: abortStreaming } = useStreamingAnalysis();
  const [credits, setCredits] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLookup, setShowLookup] = useState(false);
  const [selectedQue, setSelectedQue] = useState<(typeof QUE_DATA)[0] | null>(null);
  const [everPurchased, setEverPurchased] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem("boique_sound") !== "off";
    } catch {
      return true;
    }
  });
  const audioCtxRef = useRef<AudioContext | null>(null);

  const hasCredits = credits > 0;
  const displayText = aiResult || streamedText;
  const isFreePreview = !!displayText && !hasCredits && !everPurchased;
  const canGieoQue = hasCredits;

  useEffect(() => {
    if (user) {
      loadCredits();
      loadHistory();
    }
  }, [user]);

  const loadCredits = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const { data } = await (supabase as any)
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
      .from("boi_que_analyses")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory(data || []);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("boique_sound", next ? "on" : "off");
  };
  const getAudioCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioCtxRef.current;
  };
  const playCoinFlip = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  };
  const playResultReveal = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch {}
  };

  const filteredQue = searchTerm.trim()
    ? QUE_DATA.filter(
        (q) =>
          q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.id.toString() === searchTerm.trim() ||
          q.element.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.symbol.includes(searchTerm),
      )
    : QUE_DATA;

  const handleAnalyze = async (queData: any, lines: string[], changedNum: number | null) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const fullText = await startStreaming(
        {
          analysisType: "hexagram",
          question: question.trim(),
          hexagramNumber: queData.id,
          hexagramName: queData.name,
          hexagramSymbol: queData.symbol,
          lines,
        },
        {
          onError: (err) => {
            console.error("[BoiQue] Stream error:", err);
            toast.error(err || "Lỗi khi luận giải. Thử lại nhé!");
          },
        },
      );
      if (!fullText) throw new Error("Không nhận được kết quả.");
      setAiResult(fullText);
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (u) {
        try {
          await supabase.from("boi_que_analyses").insert({
            user_id: u.id,
            package_id: null,
            question: question.trim(),
            hexagram_num: queData.id,
            hexagram_name: queData.name,
            hexagram_symbol: queData.symbol,
            hex_lines: lines,
            changed_hex_num: changedNum,
            analysis_result: fullText,
          });
        } catch (saveErr) {
          console.warn("[BoiQue] Save error:", saveErr);
        }
        const { data: creditResult } = await (supabase as any).rpc("use_credit", {
          p_user_id: u.id,
          p_feature: "boi_que",
        });
        console.log("[BoiQue] use_credit result:", creditResult);
        loadCredits();
        loadHistory();
      }
    } catch {
      toast.error("Lỗi khi luận giải. Thử lại nhé!");
    } finally {
      setAiLoading(false);
    }
  };

  const handleGieoQue = () => {
    if (!question.trim()) {
      toast.error("Vui lòng nhập câu hỏi trước khi gieo quẻ");
      return;
    }
    if (isGuest || (!canGieoQue && !everPurchased)) {
      fetchDemo("boi_que");
      return;
    }
    if (!canGieoQue) {
      setShowPayment(true);
      return;
    }
    hapticImpact();
    setIsAnimating(true);
    setResult(null);
    setAiResult(null);
    setViewingHistoryId(null);
    setHexLines([]);
    setCoins([]);
    setChangedHexNum(null);
    setHasChanging(false);
    setChangingLineIndexes([]);
    const hexData = calculateHexagram();
    const revealLines: string[] = [];
    for (let hao = 0; hao < 6; hao++) {
      setTimeout(() => {
        playCoinFlip();
        navigator.vibrate?.(30);
        revealLines.push(hexData.mainLines[hao] === 1 ? "yang" : "yin");
        setHexLines([...revealLines]);
        if (hao === 5) {
          setTimeout(() => {
            const queData = QUE_DATA.find((q) => q.id === hexData.mainHexNum) || QUE_DATA[0];
            setResult(queData);
            setChangedHexNum(hexData.changedHexNum);
            setHasChanging(hexData.hasChanging);
            setChangingLineIndexes(hexData.changingLines.filter((l) => l.isChanging).map((l) => l.index));
            setIsAnimating(false);
            hapticSuccess();
            playResultReveal();
            navigator.vibrate?.([20, 40, 20, 40, 50]);
            handleAnalyze(queData, [...revealLines], hexData.changedHexNum);
          }, 400);
        }
      }, hao * 600);
    }
  };

  const handleReset = () => {
    abortStreaming();
    setResult(null);
    setCoins([]);
    setHexLines([]);
    setQuestion("");
    setAiResult(null);
    setChangedHexNum(null);
    setHasChanging(false);
    setChangingLineIndexes([]);
  };
  const handleShare = () => {
    const inDemo = demoMode && !!demoData && !displayText && !result;
    let shareText = "";
    if (displayText) {
      shareText = displayText;
    } else if (result) {
      shareText = `🎴 Bói Quẻ Dịch\nQuẻ ${result.id} - ${result.name} ${result.symbol}\n${result.summary}`;
    } else if (inDemo && demoData) {
      shareText = `🔍 Ví dụ mẫu — 🎴 Bói Quẻ Dịch\n\n${demoData.demo_output}\n\n🔮 Xem tại: ai-tuvi.lovable.app`;
    }
    if (!shareText) return;
    if (navigator.share) {
      navigator
        .share({
          title: inDemo ? "Bói Quẻ - Ví dụ mẫu" : "Bói Quẻ Dịch - Tử Vi App",
          text: shareText,
          url: "https://ai-tuvi.lovable.app",
        })
        .catch(() => {
          navigator.clipboard.writeText(shareText);
          toast.success("Đã sao chép!");
        });
      return;
    }
    navigator.clipboard.writeText(shareText);
    toast.success("Đã sao chép!");
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

  const style = result ? fortuneConfig[result.fortune as keyof typeof fortuneConfig] : null;

  const usesLabel = hasCredits
    ? `Còn ${credits} credits`
    : everPurchased
      ? "Đã hết credits"
      : "Cần mua credits";

  const renderAiSection = () => {
    if ((aiLoading || isStreamingAI) && !aiResult) {
      return (
        <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-gold/20")}>
          <h3 className="font-display text-lg text-gold flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 animate-pulse" />
            Đang luận giải quẻ...
          </h3>
          {streamedText ? (
            <div className="space-y-1">
              {renderMarkdown(streamedText)}
              <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gold/10">
                <Loader2 className="h-4 w-4 animate-spin text-gold" />
                <span className="text-xs text-muted-foreground">Đang viết tiếp...</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
              <p className="font-display text-lg text-foreground mb-1">Đang kết nối AI...</p>
              <p className="text-sm text-muted-foreground">AI đang phân tích quẻ {result?.name} theo câu hỏi của bạn</p>
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
            "rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-gold/20 overflow-hidden",
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-gold" />
            <h3 className="font-display text-lg text-gold">Luận Giải AI</h3>
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20">
                  <Lock className="w-3.5 h-3.5 text-gold" />
                  <span className="text-xs font-medium text-gold">Nội dung bị giới hạn</span>
                </div>
                <h3 className="text-lg font-bold text-foreground">Mở khóa luận giải đầy đủ</h3>
                <p className="text-sm text-muted-foreground">
                  Bạn đang xem bản rút gọn. Thanh toán để xem toàn bộ luận giải chi tiết.
                </p>
                <p className="text-2xl font-bold text-gold">39.000đ</p>
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
        </div>
      );
    }

    return (
      <div className={cn("rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-gold/20")}>
        <div className="space-y-1">{renderMarkdown(displayText)}</div>
        <AnalysisDisclaimer variant="hexagram" />
      </div>
    );
  };

  return (
    <PageLayout title="Bói Quẻ Dịch">
      <div className="space-y-6">
        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-surface-3 to-surface-2 border border-border relative">
          <button
            onClick={toggleSound}
            className="absolute top-3 right-3 p-2 rounded-lg text-muted-foreground hover:text-gold hover:bg-surface-3 transition-colors"
            title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <Sparkles className="w-10 h-10 text-gold mx-auto mb-3" />
          <h2 className="font-display text-xl text-foreground mb-2">Bói Quẻ 卦</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Gieo quẻ Kinh Dịch — Hỏi về một điều bạn muốn biết
          </p>
        </div>

        {history.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-surface-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gold" />
                Lịch sử ({history.length} lần)
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
                        setQuestion(item.question);
                        setResult(QUE_DATA.find((q) => q.id === item.hexagram_num) || null);
                        setAiResult(item.analysis_result);
                        setHexLines(item.hex_lines || []);
                        setChangedHexNum(item.changed_hex_num);
                        setHasChanging(!!item.changed_hex_num);
                        setChangingLineIndexes([]);
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
                          <span className="text-gold text-sm">{item.hexagram_symbol}</span>
                          {isViewing && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-medium">
                              Đang xem
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{item.question}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        Quẻ {String(item.hexagram_num).padStart(2, "0")} — {item.hexagram_name}
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
                  <p className="text-xs text-amber-200/60">Mua thêm credits để tiếp tục · Lịch sử luận giải vẫn xem được</p>
                </div>
              </div>
              <Button variant="gold" size="sm" onClick={openPaymentOrUpgrade} className="shrink-0">
                <CreditCard className="w-4 h-4 mr-1.5" />
                Mua thêm
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Textarea
            placeholder="Nhập câu hỏi của bạn... (VD: Tôi có nên đầu tư lúc này?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[80px] bg-surface-2 border-border text-foreground placeholder:text-muted-foreground resize-none"
            disabled={isAnimating}
          />

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
                      : "bg-surface-3 border-2 border-border text-muted-foreground/30 animate-bounce",
                  )}
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  {coins[i] !== undefined ? (coins[i] ? "陽" : "陰") : "?"}
                </div>
              ))}
            </div>
          )}

          {!result && !demoMode && (
            <>
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                onClick={handleGieoQue}
                disabled={isAnimating || isStreamingAI || !question.trim() || demoLoading}
              >
                {isAnimating
                  ? "Đang gieo quẻ..."
                  : demoLoading
                    ? "Đang tải ví dụ..."
                    : canGieoQue
                      ? "Gieo Quẻ"
                      : "Xem ví dụ mẫu"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {canGieoQue
                  ? usesLabel
                  : isGuest
                    ? "Xem trước luận giải mẫu — miễn phí"
                    : "Xem ví dụ mẫu trước khi mua credit"}
              </p>
            </>
          )}

          {demoLoading && !demoMode && (
            <DemoSkeleton title="Đang tải quẻ mẫu..." lines={6} />
          )}

          {demoMode && demoData && (
            <div className="space-y-4">
              <DemoBanner
                data={demoData}
                isGuest={isGuest}
                onGuestCta={openUpgrade}
                onBuyCta={openPaymentOrUpgrade}
                variant="top"
              />
              <div className="rounded-2xl p-5 bg-gradient-to-br from-surface-3 to-surface-2 border border-gold/20">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-gold" />
                  <h3 className="font-display text-lg text-gold">
                    Luận giải mẫu — {demoData.demo_person_name}
                  </h3>
                </div>
                <div className="space-y-1">{renderMarkdown(demoData.demo_output)}</div>
                <div className="flex gap-2 mt-5">
                  <Button variant="goldOutline" size="sm" onClick={handleShare} className="flex-1 text-xs">
                    <Share2 className="w-3.5 h-3.5 mr-1" />
                    Chia sẻ ví dụ mẫu
                  </Button>
                </div>
              </div>
              <DemoBanner
                data={demoData}
                isGuest={isGuest}
                onGuestCta={openUpgrade}
                onBuyCta={openPaymentOrUpgrade}
                variant="bottom"
              />
              <Button variant="ghost" size="sm" className="w-full" onClick={exitDemo}>
                ← Đóng ví dụ mẫu
              </Button>
            </div>
          )}
        </div>

        {result && style && (
          <div className="space-y-4">
            <div className={cn("rounded-2xl p-6 border bg-gradient-to-br ink-splash", style.bg, style.border)}>
              <div className="flex justify-center mb-3 ink-drip" style={{ animationDelay: "0.3s" }}>
                <span className={cn("px-4 py-1 rounded-full text-xs font-bold", style.badge)}>{style.label}</span>
              </div>
              <h3
                className="text-center font-display text-2xl text-foreground mb-1 brush-stroke"
                style={{ animationDelay: "0.5s" }}
              >
                Quẻ {String(result.id).padStart(2, "0")} — {result.name}
              </h3>
              <p
                className="text-center text-3xl tracking-widest text-gold mb-4 ink-reveal"
                style={{ animationDelay: "0.7s" }}
              >
                {result.symbol}
              </p>
              <p
                className="text-sm text-muted-foreground text-center italic ink-drip"
                style={{ animationDelay: "0.9s" }}
              >
                Ngũ hành: {result.element}
              </p>
              {hexLines.length > 0 && (
                <div
                  className="flex flex-col-reverse items-center gap-1 my-4 ink-reveal"
                  style={{ animationDelay: "1.0s" }}
                >
                  {hexLines.map((line, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-8 text-right">Hào {i + 1}</span>
                      <div
                        className={cn("flex gap-1", changingLineIndexes.includes(i) ? "text-gold" : "text-foreground")}
                      >
                        {line === "yang" ? (
                          <div className="w-16 h-2 bg-current rounded" />
                        ) : (
                          <div className="flex gap-1">
                            <div className="w-7 h-2 bg-current rounded" />
                            <div className="w-7 h-2 bg-current rounded" />
                          </div>
                        )}
                      </div>
                      {changingLineIndexes.includes(i) && <span className="text-xs text-gold">← động</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 p-4 rounded-xl bg-surface-2/60 ink-reveal" style={{ animationDelay: "1.1s" }}>
                <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
              </div>
              {hasChanging && changedHexNum && (
                <div
                  className="mt-3 p-3 rounded-xl bg-surface-2/60 border border-gold/20 ink-reveal"
                  style={{ animationDelay: "1.2s" }}
                >
                  <p className="text-xs text-muted-foreground text-center">
                    Quẻ biến (之卦) →{" "}
                    <span className="text-gold font-medium">
                      Quẻ {String(changedHexNum).padStart(2, "0")} —{" "}
                      {QUE_DATA.find((q) => q.id === changedHexNum)?.name}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1 italic">
                    {QUE_DATA.find((q) => q.id === changedHexNum)?.summary}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 ink-drip" style={{ animationDelay: "1.3s" }}>
              <Button variant="goldOutline" className="flex-1" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Chia Sẻ
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Gieo Lại
              </Button>
            </div>
            <div className="space-y-4">{renderAiSection()}</div>
          </div>
        )}

        {!result && !isAnimating && canGieoQue && (
          <p className="text-center text-xs text-muted-foreground opacity-60">
            Tập trung vào câu hỏi, thành tâm rồi nhấn "Gieo Quẻ"
          </p>
        )}

        <div className="rounded-2xl bg-gradient-to-br from-surface-3 to-surface-2 border border-border overflow-hidden">
          <button
            onClick={() => {
              setShowLookup(!showLookup);
              setSelectedQue(null);
            }}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gold" />
              <span className="font-display text-foreground">Tra Cứu 64 Quẻ Dịch</span>
            </div>
            {showLookup ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {showLookup && (
            <div className="px-4 pb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, số, ngũ hành..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedQue(null);
                  }}
                  className="pl-9 bg-surface-2 border-border text-foreground"
                />
              </div>
              {selectedQue && (
                <div
                  className={cn(
                    "rounded-xl p-4 border bg-gradient-to-br animate-fade-in",
                    fortuneConfig[selectedQue.fortune as keyof typeof fortuneConfig].bg,
                    fortuneConfig[selectedQue.fortune as keyof typeof fortuneConfig].border,
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display text-lg text-foreground">
                      {String(selectedQue.id).padStart(2, "0")}. {selectedQue.name}
                    </h4>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        fortuneConfig[selectedQue.fortune as keyof typeof fortuneConfig].badge,
                      )}
                    >
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
                            "bg-surface-2/50 border-border hover:border-gold/30",
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

        <VietQRPaymentModal
          open={showPayment}
          onOpenChange={setShowPayment}
          feature="boi_que"
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </PageLayout>
  );
};

export default BoiQue;
