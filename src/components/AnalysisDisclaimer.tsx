import { AlertTriangle } from 'lucide-react';

type DisclaimerVariant = 'luan_giai' | 'van_han' | 'hexagram' | 'boi_kieu';

const disclaimerTexts: Record<DisclaimerVariant, string> = {
  luan_giai:
    'Lưu ý: Đây là luận giải dựa trên sự kết hợp giữa trường phái Tam Hợp và Phi Tinh trong hệ thống Tử Vi Đẩu Số (紫微斗數). Nội dung chỉ mang tính tham khảo, giúp bạn tự tìm hiểu và chiêm nghiệm bản thân — không phải kết luận tuyệt đối về vận mệnh. Mọi quyết định trong cuộc sống nên dựa trên sự cân nhắc thực tế của chính bạn.',
  van_han:
    'Lưu ý: Đây là luận giải dựa trên sự kết hợp giữa trường phái Tam Hợp và Phi Tinh trong hệ thống Tử Vi Đẩu Số (紫微斗數). Nội dung chỉ mang tính tham khảo, giúp bạn tự tìm hiểu và chiêm nghiệm bản thân — không phải kết luận tuyệt đối về vận mệnh. Mọi quyết định trong cuộc sống nên dựa trên sự cân nhắc thực tế của chính bạn.',
  hexagram:
    'Lưu ý: Đây là luận giải dựa trên Kinh Dịch (易經) — hệ thống triết học cổ đại với 64 quẻ và 384 hào. Nội dung chỉ mang tính tham khảo và chiêm nghiệm, không phải tiên tri tuyệt đối. Kinh Dịch nhấn mạnh sự biến dịch — vận mệnh luôn có thể thay đổi bởi hành động của chính bạn.',
  boi_kieu:
    'Lưu ý: Đây là luận giải dựa trên Truyện Kiều của đại thi hào Nguyễn Du — một truyền thống bói toán dân gian Việt Nam. Nội dung mang tính giải trí và chiêm nghiệm văn học, không phải dự đoán chính xác về tương lai.',
};

interface Props {
  variant?: DisclaimerVariant;
}

export function AnalysisDisclaimer({ variant = 'luan_giai' }: Props) {
  return (
    <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
      <p className="text-xs text-muted-foreground text-center italic flex items-start gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>{disclaimerTexts[variant]}</span>
      </p>
    </div>
  );
}

export default AnalysisDisclaimer;
