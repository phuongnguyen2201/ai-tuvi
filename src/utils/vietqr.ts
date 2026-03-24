// === CẤU HÌNH NGÂN HÀNG ===

const BANK_CONFIG = {
  bankId: "VPBank",
  accountNo: "238898706",
  accountName: "NGUYEN MINH PHUONG",
};

export const PRICING = {
  credits_3: 39000,
  credits_5: 59000,
  credits_10: 99000,
  // Legacy keys — giữ để không break existing pending payments
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

  return (
    `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png` +
    `?amount=${amount}` +
    `&addInfo=${encodeURIComponent(transferContent)}` +
    `&accountName=${encodeURIComponent(accountName)}`
  );
}

export function generateTransferContent(userId: string, _feature: FeatureKey): string {
  const shortId = userId.slice(0, 8).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TUVI ${shortId}${random}`;
}

export function getFeatureLabel(feature: FeatureKey): string {
  const amount = PRICING[feature];
  if (amount >= 99000) return "10 Credits - 99.000đ";
  if (amount >= 59000) return "5 Credits - 59.000đ";
  if (amount >= 49000 && feature.includes("premium")) {
    return feature === "premium_yearly" ? "Premium 1 năm" : "Premium 1 tháng";
  }
  return "3 Credits - 39.000đ";
}
