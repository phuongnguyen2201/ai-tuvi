// === CẤU HÌNH NGÂN HÀNG CỦA BẠN ===

const BANK_CONFIG = {
  bankId: 'VPBank',           // Đổi thành ngân hàng bạn dùng
  accountNo: '238898706', // Số tài khoản của bạn
  accountName: 'NGUYEN MINH PHUONG', // Tên chủ TK (UPPERCASE)
};

export const PRICING = {
  luan_giai: 39000,
  van_han: 39000,
  van_han_week: 39000,
  van_han_month: 39000,
  van_han_year: 39000,
  boi_que: 39000,
  boi_kieu: 39000,
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

  const prefixMap: Record<FeatureKey, string> = {
    luan_giai:       'LUANGIAI',
    van_han:         'VANHAN',
    van_han_week:    'VHTUAN',
    van_han_month:   'VHTHANG',
    van_han_year:    'VHNAM',
    boi_que:         'BOIQUE',
    boi_kieu:        'BOIKIEU',
    premium_monthly: 'PREMIUM',
    premium_yearly:  'PREMIUM',
  };

  const prefix = prefixMap[feature] || 'TUVI';
  return `${prefix} ${shortId}`;
}

export function getFeatureLabel(feature: FeatureKey): string {
  const labels: Record<FeatureKey, string> = {
    luan_giai: 'Gói Luận Giải (3 lần) - 39.000đ',
    van_han: 'Dự đoán vận hạn năm',
    van_han_week: 'Luận giải vận hạn tuần này',
    van_han_month: 'Luận giải vận hạn tháng này',
    van_han_year: 'Luận giải vận hạn năm 2026',
    boi_que: 'Bói Quẻ (10 lần) - 39.000đ',
    boi_kieu: 'Bói Kiều (10 lần) - 39.000đ',
    premium_monthly: 'Premium 1 tháng',
    premium_yearly: 'Premium 1 năm',
  };
  return labels[feature];
}
