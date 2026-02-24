// VietQR API utility
// Docs: https://vietqr.io/danh-sach-api/link-tao-qr

const BANK_ID = "970422"; // MB Bank (Ngân hàng Quân Đội)
const ACCOUNT_NO = "0373329042"; // Số tài khoản
const ACCOUNT_NAME = "NGUYEN VAN A"; // Tên chủ tài khoản
const BANK_NAME = "MB Bank";
const TEMPLATE = "compact2";

export const BANK_INFO = {
  bankName: BANK_NAME,
  accountNo: ACCOUNT_NO,
  accountName: ACCOUNT_NAME,
};

export function generateVietQRUrl(amount: number, content: string): string {
  const encodedContent = encodeURIComponent(content);
  return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${amount}&addInfo=${encodedContent}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
}

export function generateTransferContent(userId: string): string {
  const shortId = userId.replace(/-/g, "").substring(0, 8).toUpperCase();
  return `TUVI ${shortId}`;
}
