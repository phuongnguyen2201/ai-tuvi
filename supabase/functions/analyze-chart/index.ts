import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { analysisType } = body;

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    let systemPrompt: string;
    let userPrompt: string;

    // ============================================================
    // HEXAGRAM - Bói quẻ Kinh Dịch
    // ============================================================
    if (analysisType === "hexagram") {
      const { question, hexagramNumber, hexagramName, hexagramSymbol, lines } = body;

      systemPrompt = `Bạn là một chuyên gia Kinh Dịch (I Ching) uyên thâm với hơn 30 năm kinh nghiệm.
Bạn luận giải quẻ dịch chính xác, chi tiết, kết hợp triết lý cổ đại với lời khuyên thực tế hiện đại.
Phong cách: huyền bí nhưng dễ hiểu, sâu sắc, không mê tín thái quá.
Luôn đưa ra lời khuyên hành động cụ thể liên quan đến câu hỏi.
Trả lời bằng tiếng Việt. Sử dụng emoji phù hợp để dễ đọc.
Dùng markdown formatting (## cho tiêu đề, **bold** cho nhấn mạnh, - cho danh sách).`;

      const linesDesc =
        lines?.map((l: string, i: number) => `Hào ${i + 1}: ${l === "yang" ? "Dương ⚊" : "Âm ⚋"}`).join("\n") || "";

      userPrompt = `Câu hỏi của người xin quẻ: "${question}"

Kết quả gieo quẻ:
- Quẻ số: ${hexagramNumber}
- Tên quẻ: ${hexagramName} ${hexagramSymbol}
- Chi tiết 6 hào:
${linesDesc}

Hãy luận giải theo format sau:

## 🎴 Quẻ ${hexagramName} nói gì về câu hỏi của bạn
(Phân tích ý nghĩa quẻ liên quan trực tiếp đến câu hỏi, 3-4 đoạn)

## 📖 Giải nghĩa chi tiết từng hào
(Phân tích từng hào 1-6, ý nghĩa và ảnh hưởng)

## 💡 Lời khuyên hành động cụ thể
(Ít nhất 4-5 lời khuyên thực tế, cụ thể theo câu hỏi)

## ⚡ Quẻ biến và xu hướng
(Phân tích hào động nếu có, xu hướng chuyển biến tương lai)`;

      // ============================================================
      // LUAN GIAI - Luận giải chi tiết lá số (trả phí)
      // ============================================================
    } else if (analysisType === "luan_giai") {
      const { chartData, personName } = body;
      const chartContext = buildChartContext(chartData);

      systemPrompt = `Bạn là bậc thầy Tử Vi Đẩu Số với kiến thức uyên thâm về:
- Sách kinh điển "Tử Vi Đẩu Số Toàn Thư" (《紫微斗數全書》)
- Sách "Tử Vi Đẩu Số Tiệp Lãm" (《紫微斗數捷覽》)
- Trường phái Tam Hợp (三合派) và Phi Tinh (飛星派)
- Tử Vi truyền thống Việt Nam kết hợp Trung Hoa

QUY TẮC NGÔN NGỮ BẮT BUỘC:
- Tiếng Việt / Hán Việt là CHÍNH
- Tiếng Trung chỉ để trong ngoặc đơn phía sau
- Ví dụ ĐÚNG: "Tử Vi (紫微)", "Hóa Lộc (化祿)", "Mệnh Cung (命宮)"
- Ví dụ ĐÚNG: "Tam Hợp (三合)", "Tứ Hóa (四化)", "Ngũ Hành Cục (五行局)"
- KHÔNG dùng tiếng Trung đứng một mình không có Hán Việt đi kèm
- Trích dẫn kinh điển: dịch nghĩa tiếng Việt trước, chữ Hán gốc trong ngoặc sau
- Ví dụ trích dẫn: "Tử Vi nhập Mệnh, quý hiển song toàn" (紫微入命，貴顯雙全)

Phong cách luận giải:
- Phân tích sâu, chi tiết, không bỏ sót Tứ Hóa (四化)
- Kết hợp lý luận Tam Phương Tứ Chính (三方四正)
- Tránh ngôn ngữ định mệnh luận, dùng "có xu hướng", "thường thấy"
- Dùng emoji và markdown để dễ đọc
- Mỗi mục phân tích ít nhất 3-5 điểm cụ thể`;

      userPrompt = `Luận giải CHI TIẾT lá số Tử Vi Đẩu Số (紫微斗數):

**Người xem:** ${personName || "Không rõ"}

${chartContext}

Phân tích đầy đủ theo cấu trúc dưới đây.
Tất cả thuật ngữ: Hán Việt trước, chữ Hán trong ngoặc đơn:

## 1. Tổng quan lá số (命盤總覽)
- Ngũ Hành Cục (五行局): thuộc cục gì, ý nghĩa
- Mệnh Chủ (命主) và Thân Chủ (身主) là sao gì
- Tứ Hóa (四化) phân bố tổng quan ở các cung nào
- Nhận định đặc điểm nổi bật của lá số
- Trích dẫn kinh điển nếu phù hợp (Hán Việt trước, Hán tự sau)

## 2. Phân tích Mệnh Cung và Thân Cung (命宮分析)
- Chính tinh (正星) tại Mệnh: Miếu/Vượng/Đắc/Hãm (廟/旺/得/陷)?
- Phụ tinh (輔星) đi kèm ảnh hưởng thế nào
- Tính cách cơ bản, điểm mạnh và điểm yếu
- Thân Cung (身宮) ở cung nào, ý nghĩa sâu xa

## 3. Phân tích Tứ Hóa (四化影響)
### Hóa Lộc (化祿) - [Tên sao] ở [Tên cung]:
- Ý nghĩa cụ thể
- Ảnh hưởng đến cuộc đời
### Hóa Quyền (化權) - [Tên sao] ở [Tên cung]:
- Ý nghĩa cụ thể
- Ảnh hưởng đến cuộc đời
### Hóa Khoa (化科) - [Tên sao] ở [Tên cung]:
- Ý nghĩa cụ thể
- Ảnh hưởng đến cuộc đời
### Hóa Kỵ (化忌) - [Tên sao] ở [Tên cung]:
- Ý nghĩa cụ thể, điều cần cẩn trọng

## 4. Các cung quan trọng (重點宮位)
### Tài Bạch Cung (財帛宮) - Can Chi ([Sao chính]):
- Đặc điểm tài chính, thu nhập
- Nguồn tài lộc chủ yếu
- Điều cần lưu ý về tiền bạc
### Quan Lộc Cung (官祿宮) - Can Chi ([Sao chính]):
- Sự nghiệp phù hợp
- Ngành nghề nên theo
- Điểm thuận lợi và thách thức
### Phu Thê Cung (夫妻宮) - Can Chi ([Sao chính]):
- Đặc điểm người bạn đời
- Hôn nhân và tình duyên
- Thời điểm thuận lợi
### Tật Ách Cung (疾厄宮) - Can Chi ([Sao chính]):
- Bộ phận cơ thể cần chú ý
- Lời khuyên về sức khỏe

## 5. Tam Phương Tứ Chính của Mệnh (三方四正)
- Mệnh Cung (命宮): [sao + đánh giá]
- Tài Bạch Cung (財帛宮): [sao + đánh giá]
- Quan Lộc Cung (官祿宮): [sao + đánh giá]
- Phúc Đức Cung (福德宮): [sao + đánh giá]
- Nhận định tổng thể: cách cục mạnh hay yếu, tại sao?

## 6. Tổng quan vận hạn (運程概述)
- Đại Hạn (大限) hiện tại đang ở giai đoạn nào
- Giai đoạn thuận lợi nhất trong cuộc đời
- Giai đoạn cần cẩn thận
- Xu hướng 10 năm tới

## 7. Lời khuyên tổng kết (總結建議)
### Điểm mạnh cần phát huy (ít nhất 4 điểm):
1. ...
2. ...
3. ...
4. ...
### Điểm cần lưu ý (ít nhất 4 điểm):
1. ...
2. ...
3. ...
4. ...
### Lời khuyên theo từng lĩnh vực:
- **Sự nghiệp:** ...
- **Tài chính:** ...
- **Tình duyên - Gia đình:** ...
- **Sức khỏe:** ...

Kết thúc bằng câu châm ngôn:
> "Bản dịch tiếng Việt" (Nguyên văn Hán tự)`;

      // ============================================================
      // VAN HAN - Vận hạn theo tuần/tháng/năm
      // ============================================================
    } else {
      const { timeFrame, period, chartData } = body;
      const chartContext = buildChartContext(chartData);
      const timeContext = buildTimeContext(timeFrame, period);

      systemPrompt = `Bạn là một chuyên gia Tử Vi Việt Nam uyên thâm với hơn 30 năm kinh nghiệm.
Bạn phân tích lá số tử vi và đưa ra nhận định chính xác, chi tiết về vận hạn.
Phong cách: chuyên nghiệp, dễ hiểu, thực tế, không mê tín thái quá.
Luôn đưa ra lời khuyên hành động cụ thể.
Trả lời bằng tiếng Việt. Sử dụng emoji phù hợp để dễ đọc.`;

      userPrompt = `Dựa trên lá số tử vi sau, hãy luận giải vận hạn ${timeContext}.

${chartContext}

Yêu cầu phân tích:
${getAnalysisRequirements(timeFrame)}

Hãy phân tích chi tiết, đưa ra nhận định cụ thể và lời khuyên thực tế.`;
    }

    // ============================================================
    // GỌI ANTHROPIC API với retry
    // ============================================================
    let data: any;
    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
        await new Promise((r) => setTimeout(r, delay));
        console.log(`Retry attempt ${attempt + 1}...`);
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: analysisType === "luan_giai" ? 8000 : 2000,
          messages: [{ role: "user", content: userPrompt }],
          system: systemPrompt,
        }),
      });

      data = await response.json();

      if (response.ok) break;

      lastError = data.error?.message || "AI analysis failed";
      console.error(`Anthropic API error (attempt ${attempt + 1}):`, data);

      if (data.error?.type !== "overloaded_error") {
        throw new Error(lastError);
      }
    }

    if (!data?.content?.[0]?.text) {
      throw new Error(lastError || "AI analysis failed after retries");
    }

    const analysis = data.content[0].text;

    return new Response(JSON.stringify({ analysis, analysisType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function buildChartContext(chartData: any): string {
  if (!chartData || Object.keys(chartData).length === 0) {
    return "Không có dữ liệu lá số.";
  }

  const parts: string[] = [];

  if (chartData.solarDate) parts.push(`Ngày sinh dương lịch: ${chartData.solarDate}`);
  if (chartData.lunarDate) parts.push(`Ngày sinh âm lịch: ${chartData.lunarDate}`);
  if (chartData.lunarYear) parts.push(`Năm sinh: ${chartData.lunarYear}`);
  if (chartData.gender) parts.push(`Giới tính: ${chartData.gender}`);
  if (chartData.birthHour) parts.push(`Giờ sinh: ${chartData.birthHour}`);
  if (chartData.cuc?.name) parts.push(`Ngũ Hành Cục (五行局): ${chartData.cuc.name}`);
  if (chartData.napAm?.napAm) parts.push(`Nạp Âm (納音): ${chartData.napAm.napAm} (${chartData.napAm.element})`);
  if (chartData.soulStar) parts.push(`Mệnh Chủ (命主): ${chartData.soulStar}`);
  if (chartData.bodyStar) parts.push(`Thân Chủ (身主): ${chartData.bodyStar}`);

  // 12 Cung
  if (chartData.palaces?.length) {
    parts.push("\n--- 12 Cung (十二宮) ---");
    for (const p of chartData.palaces) {
      const majorStars =
        p.majorStars
          ?.map((s: any) => {
            let name = s.name;
            if (s.mutagen) name += `(${s.mutagen})`;
            return name;
          })
          .join(", ") || "(vô chính diệu)";

      const minorStars = p.minorStars
        ?.filter((s: any) => s.mutagen)
        .map((s: any) => `${s.name}(${s.mutagen})`)
        .join(", ");

      const marker = p.isSoulPalace ? " [★ Mệnh]" : p.isBodyPalace ? " [★ Thân]" : "";

      let line = `${p.name}${marker} - ${p.heavenlyStem || ""}${p.earthlyBranch || ""}: ${majorStars}`;
      if (minorStars) line += ` | Phụ tinh hóa: ${minorStars}`;
      parts.push(line);
    }
  }

  // Tứ Hóa tổng hợp
  if (chartData.tuHoa || chartData.mutagens) {
    parts.push("\n--- Tứ Hóa (四化) ---");
    const th = chartData.tuHoa || chartData.mutagens;
    if (th.hoaLoc || th.lu) {
      const star = th.hoaLoc?.star || th.lu?.star;
      const palace = th.hoaLoc?.palace || th.lu?.palace;
      parts.push(`Hóa Lộc (化祿): ${star} tại ${palace}`);
    }
    if (th.hoaQuyen || th.quan) {
      const star = th.hoaQuyen?.star || th.quan?.star;
      const palace = th.hoaQuyen?.palace || th.quan?.palace;
      parts.push(`Hóa Quyền (化權): ${star} tại ${palace}`);
    }
    if (th.hoaKhoa || th.ke) {
      const star = th.hoaKhoa?.star || th.ke?.star;
      const palace = th.hoaKhoa?.palace || th.ke?.palace;
      parts.push(`Hóa Khoa (化科): ${star} tại ${palace}`);
    }
    if (th.hoaKy || th.ji) {
      const star = th.hoaKy?.star || th.ji?.star;
      const palace = th.hoaKy?.palace || th.ji?.palace;
      parts.push(`Hóa Kỵ (化忌): ${star} tại ${palace}`);
    }
  }

  return parts.join("\n");
}

function buildTimeContext(timeFrame: string, period: string): string {
  switch (timeFrame) {
    case "week":
      return `tuần ${period}`;
    case "month":
      return `tháng ${period}`;
    case "year":
      return `năm ${period}`;
    default:
      return period;
  }
}

function getAnalysisRequirements(timeFrame: string): string {
  switch (timeFrame) {
    case "week":
      return `1. Tổng quan vận hạn tuần này
2. Phân tích chi tiết từng ngày (tốt/xấu)
3. Ngày tốt nhất và xấu nhất trong tuần
4. Lời khuyên hành động cụ thể cho từng ngày
5. Lưu ý đặc biệt`;

    case "month":
      return `1. Tổng quan vận hạn tháng
2. Phân tích theo từng tuần
3. Vận sự nghiệp trong tháng
4. Vận tài lộc trong tháng
5. Vận tình duyên trong tháng
6. Ngày đặc biệt cần lưu ý
7. Lời khuyên tổng hợp`;

    case "year":
      return `1. Tổng quan vận hạn năm
2. Phân tích chi tiết 12 tháng
3. Phân tích theo 4 quý (sự nghiệp, tài lộc, tình duyên)
4. Tháng tốt nhất và tháng cần cẩn thận
5. Đỉnh điểm vận hạn trong năm
6. Lời khuyên chiến lược cho cả năm`;

    default:
      return "Phân tích tổng quan vận hạn.";
  }
}
