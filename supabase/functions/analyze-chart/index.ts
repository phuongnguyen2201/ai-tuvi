import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { analysisType, timeFrame, period, chartData } = await req.json();

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    // Build context from chart data
    const chartContext = buildChartContext(chartData);
    const timeContext = buildTimeContext(timeFrame, period);

    const systemPrompt = `Bạn là một chuyên gia Tử Vi Việt Nam uyên thâm với hơn 30 năm kinh nghiệm.
Bạn phân tích lá số tử vi và đưa ra nhận định chính xác, chi tiết về vận hạn.
Phong cách: chuyên nghiệp, dễ hiểu, thực tế, không mê tín thái quá.
Luôn đưa ra lời khuyên hành động cụ thể.
Trả lời bằng tiếng Việt. Sử dụng emoji phù hợp để dễ đọc.`;

    const userPrompt = `Dựa trên lá số tử vi sau, hãy luận giải vận hạn ${timeContext}.

${chartContext}

Yêu cầu phân tích:
${getAnalysisRequirements(timeFrame)}

Hãy phân tích chi tiết, đưa ra nhận định cụ thể và lời khuyên thực tế.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          { role: "user", content: userPrompt },
        ],
        system: systemPrompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      throw new Error(data.error?.message || "AI analysis failed");
    }

    const analysis = data.content?.[0]?.text || "Không thể phân tích.";

    return new Response(
      JSON.stringify({ analysis, timeFrame, period }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildChartContext(chartData: any): string {
  if (!chartData) return "Không có dữ liệu lá số.";

  const parts: string[] = [];

  if (chartData.solarDate) parts.push(`Ngày sinh: ${chartData.solarDate}`);
  if (chartData.gender) parts.push(`Giới tính: ${chartData.gender}`);
  if (chartData.cuc?.name) parts.push(`Cục: ${chartData.cuc.name}`);
  if (chartData.napAm?.napAm) parts.push(`Nạp Âm: ${chartData.napAm.napAm} (${chartData.napAm.element})`);
  if (chartData.soulStar) parts.push(`Mệnh Chủ: ${chartData.soulStar}`);
  if (chartData.bodyStar) parts.push(`Thân Chủ: ${chartData.bodyStar}`);

  // Palaces
  if (chartData.palaces?.length) {
    parts.push("\n--- 12 Cung ---");
    for (const p of chartData.palaces) {
      const stars = p.majorStars?.map((s: any) => s.name).join(", ") || "(vô chính diệu)";
      const marker =
        p.isSoulPalace ? " [★Mệnh]" :
        p.isBodyPalace ? " [★Thân]" : "";
      parts.push(`${p.name} (${p.earthlyBranch})${marker}: ${stars}`);
    }
  }

  // Tu Hoa
  if (chartData.tuHoa) {
    parts.push("\n--- Tứ Hóa ---");
    const th = chartData.tuHoa;
    if (th.hoaLoc) parts.push(`Hóa Lộc: ${th.hoaLoc.star} (${th.hoaLoc.palace})`);
    if (th.hoaQuyen) parts.push(`Hóa Quyền: ${th.hoaQuyen.star} (${th.hoaQuyen.palace})`);
    if (th.hoaKhoa) parts.push(`Hóa Khoa: ${th.hoaKhoa.star} (${th.hoaKhoa.palace})`);
    if (th.hoaKy) parts.push(`Hóa Kỵ: ${th.hoaKy.star} (${th.hoaKy.palace})`);
  }

  return parts.join("\n");
}

function buildTimeContext(timeFrame: string, period: string): string {
  switch (timeFrame) {
    case "week": return `tuần ${period}`;
    case "month": return `tháng ${period}`;
    case "year": return `năm ${period}`;
    default: return period;
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
