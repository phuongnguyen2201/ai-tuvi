import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
  "/": "TuviApp - Xem Tử Vi Online",
  "/auth": "Đăng Nhập | TuviApp",
  "/lap-la-so": "Lập Lá Số Tử Vi | TuviApp",
  "/tuoi-hop": "Xem Tuổi Hợp | TuviApp",
  "/xem-ngay": "Xem Ngày Tốt Xấu | TuviApp",
  "/boi-kieu": "Bói Kiều | TuviApp",
  "/boi-que": "Bói Quẻ | TuviApp",
  "/van-han": "Xem Vận Hạn | TuviApp",
  "/profile": "Tài Khoản | TuviApp",
  "/chinh-sach-bao-mat": "Chính Sách Bảo Mật | TuviApp",
  "/dieu-khoan-su-dung": "Điều Khoản Sử Dụng | TuviApp",
  "/admin-tuvi-2026": "Quản Trị | TuviApp",
};

export const usePageTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = routeTitles[pathname] || "TuviApp - Xem Tử Vi Online";
  }, [pathname]);
};
