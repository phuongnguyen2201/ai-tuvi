import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DemoFeature =
  | "luan_giai"
  | "boi_kieu"
  | "boi_que"
  | "van_han_week"
  | "van_han_month"
  | "van_han_year";

export interface DemoData {
  feature: DemoFeature;
  demo_person_name: string;
  demo_birth_date: string;
  demo_birth_hour: string;
  demo_gender: string;
  demo_output: string;
}

/**
 * Loads a demo example for guests / 0-credit users so they can preview AI output
 * before committing. Does NOT call Claude or spend credits.
 */
export function useDemoExample() {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const fetchDemo = useCallback(async (feature: DemoFeature) => {
    setDemoLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-demo-example", {
        body: { feature },
      });
      if (error) throw error;
      const payload = data as DemoData | { error: string };
      if ((payload as any)?.error) throw new Error((payload as any).error);
      setDemoData(payload as DemoData);
      setDemoMode(true);
      return payload as DemoData;
    } catch (err: any) {
      console.error("[useDemoExample] fetch error:", err);
      toast.error("Không tải được ví dụ mẫu. Vui lòng thử lại.");
      return null;
    } finally {
      setDemoLoading(false);
    }
  }, []);

  const exitDemo = useCallback(() => {
    setDemoMode(false);
    setDemoData(null);
  }, []);

  return { demoData, demoMode, demoLoading, fetchDemo, exitDemo };
}

function formatDateVN(iso: string): string {
  // demo_birth_date is "YYYY-MM-DD"
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function buildDemoBannerText(data: DemoData, isGuest: boolean = false): string {
  const fullName = data.demo_person_name;
  const intro = `${fullName} (${formatDateVN(data.demo_birth_date)}, giờ ${data.demo_birth_hour}, ${data.demo_gender})`;
  const cta = isGuest
    ? "Đăng ký để xem cho lá số của bạn"
    : "Mua credit để nhận luận giải cho lá số của bạn";

  switch (data.feature) {
    case "boi_kieu":
      return `Đây là ví dụ mẫu luận giải quẻ Kiều của ${fullName} với câu hỏi: "Công việc của tôi sắp tới sẽ thế nào". ${cta}.`;
    case "boi_que":
      return `Đây là ví dụ mẫu luận giải quẻ Kinh Dịch của ${fullName} với câu hỏi: "Tình duyên của tôi năm nay ra sao?". ${cta}.`;
    case "van_han_week":
      return `Đây là ví dụ mẫu luận giải Vận hạn tuần cho lá số của ${intro}. ${cta}.`;
    case "van_han_month":
      return `Đây là ví dụ mẫu luận giải Vận hạn tháng cho lá số của ${intro}. ${cta}.`;
    case "van_han_year":
      return `Đây là ví dụ mẫu luận giải Vận hạn Năm cho lá số của ${intro}. ${cta}.`;
    case "luan_giai":
    default:
      return `Đây là ví dụ mẫu cho lá số của ${intro}. ${cta}.`;
  }
}