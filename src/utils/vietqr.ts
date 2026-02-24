// === CẤU HÌNH NGÂN HÀNG CỦA BẠN ===

const BANK_CONFIG = {
  bankId: 'VPBank',           // Đổi thành ngân hàng bạn dùng
  accountNo: '238898706', // Số tài khoản của bạn
  accountName: 'NGUYEN MINH PHUONG', // Tên chủ TK (UPPERCASE)
};

export const PRICING = {
  luan_giai: 29000,
  van_han: 39000,
  van_han_week: 9000,
  van_han_month: 19000,
  van_han_year: 39000,
  boi_que: 19000,
  boi_kieu: 19000,
  premium_monthly: 49000,
  premium_yearly: 399000,
} as const;

export type FeatureKey = keyof typeof PRICING;

export function generateVietQRUrl(feature: FeatureKey, transferContent: string): string {
  const amount = PRICING[feature];
  const { bankId, accountNo, accountName } = BANK_CONFIG;
  
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png`
    + `?amount=${amount}`
    + `&addInfo=${encodeURIComponent(transferContent)}`
    + `&accountName=${encodeURIComponent(accountName)}`;
}

export function generateTransferContent(userId: string, feature: FeatureKey): string {
  const shortId = userId.slice(0, 8).toUpperCase();
  const prefix = feature === 'premium_monthly' || feature === 'premium_yearly' 
    ? 'PREMIUM' : 'TUVI';
  return `${prefix} ${shortId}`;
}

export function getFeatureLabel(feature: FeatureKey): string {
  const labels: Record<FeatureKey, string> = {
    luan_giai: 'Luận giải lá số chi tiết',
    van_han: 'Dự đoán vận hạn năm',
    van_han_week: 'Luận giải vận hạn tuần',
    van_han_month: 'Luận giải vận hạn tháng',
    van_han_year: 'Luận giải vận hạn năm',
    boi_que: 'Bói quẻ (10 lần)',
    boi_kieu: 'Bói Kiều (10 lần)',
    premium_monthly: 'Premium 1 tháng',
    premium_yearly: 'Premium 1 năm',
  };
  return labels[feature];
}
