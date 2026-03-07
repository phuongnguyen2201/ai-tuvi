import PageLayout from "@/components/PageLayout";

const PrivacyPolicy = () => {
  return (
    <PageLayout title="Chính Sách Bảo Mật" showBack={true}>
      <div className="space-y-8 pb-12">
        {/* Introduction */}
        <div>
          <p className="text-sm text-muted-foreground">
            Cập nhật lần cuối: Tháng 3 năm 2026
          </p>
        </div>

        {/* Section 1: Thông tin chúng tôi thu thập */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Thông Tin Chúng Tôi Thu Thập
          </h2>
          <div className="bg-surface-2 rounded-lg p-4 space-y-3">
            <p className="text-sm text-foreground">
              Chúng tôi thu thập thông tin sau từ bạn:
            </p>
            <ul className="text-sm text-foreground space-y-2 ml-4">
              <li className="list-disc">
                <strong>Email:</strong> Để xác thực tài khoản và liên hệ
              </li>
              <li className="list-disc">
                <strong>Ngày giờ sinh:</strong> Để tính toán lá số tử vi và các phân tích liên quan
              </li>
              <li className="list-disc">
                <strong>Thông tin thanh toán:</strong> Để xử lý các giao dịch mua gói dịch vụ hoặc NFT
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2: Mục đích sử dụng */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Mục Đích Sử Dụng Dữ Liệu
          </h2>
          <div className="bg-surface-2 rounded-lg p-4 space-y-3">
            <p className="text-sm text-foreground">
              Dữ liệu của bạn được sử dụng cho các mục đích sau:
            </p>
            <ul className="text-sm text-foreground space-y-2 ml-4">
              <li className="list-disc">Tính toán lá số tử vi và các dự đoán vận mệnh</li>
              <li className="list-disc">Cung cấp phân tích AI và luận giải kết quả</li>
              <li className="list-disc">Xử lý các giao dịch thanh toán an toàn</li>
              <li className="list-disc">Cải thiện chất lượng dịch vụ</li>
            </ul>
          </div>
        </section>

        {/* Section 3: Bảo mật dữ liệu */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Bảo Mật Dữ Liệu
          </h2>
          <div className="bg-surface-2 rounded-lg p-4 space-y-3">
            <p className="text-sm text-foreground">
              Dữ liệu của bạn được bảo vệ theo các tiêu chuẩn cao nhất:
            </p>
            <ul className="text-sm text-foreground space-y-2 ml-4">
              <li className="list-disc">
                Lưu trữ trên <strong>Supabase</strong> với mã hóa end-to-end
              </li>
              <li className="list-disc">
                Áp dụng <strong>Row Level Security (RLS) policies</strong> để chỉ bạn có thể truy cập dữ liệu cá nhân
              </li>
              <li className="list-disc">
                Không bao giờ chia sẻ dữ liệu với bên thứ ba
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Quyền của bạn */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Quyền Của Bạn
          </h2>
          <div className="bg-surface-2 rounded-lg p-4 space-y-3">
            <p className="text-sm text-foreground">
              Bạn có những quyền sau:
            </p>
            <ul className="text-sm text-foreground space-y-2 ml-4">
              <li className="list-disc">
                <strong>Yêu cầu xóa dữ liệu:</strong> Bạn có thể yêu cầu xóa toàn bộ tài khoản và dữ liệu
              </li>
              <li className="list-disc">
                <strong>Xuất dữ liệu:</strong> Bạn có thể yêu cầu xuất dữ liệu cá nhân ở định dạng tiêu chuẩn
              </li>
              <li className="list-disc">
                <strong>Liên hệ:</strong> Liên hệ qua Zalo <strong>0702127233</strong> để thực hiện các quyền này
              </li>
            </ul>
          </div>
        </section>

        {/* Section 5: NFT & Blockchain */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            NFT &amp; Blockchain
          </h2>
          <div className="bg-surface-2 rounded-lg p-4 space-y-3">
            <p className="text-sm text-foreground">
              Khi bạn đúc NFT lá số:
            </p>
            <ul className="text-sm text-foreground space-y-2 ml-4">
              <li className="list-disc">
                Metadata NFT được lưu trên <strong>IPFS</strong> (hệ thống lưu trữ phân tán)
              </li>
              <li className="list-disc">
                Metadata <strong>không chứa thông tin cá nhân</strong> nhạy cảm
              </li>
              <li className="list-disc">
                Token được lưu trên blockchain công khai theo quy định của mạng
              </li>
            </ul>
          </div>
        </section>

        {/* Section 6: Miễn trừ trách nhiệm */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Miễn Trừ Trách Nhiệm
          </h2>
          <div className="bg-surface-2 rounded-lg p-4 space-y-3">
            <p className="text-sm text-foreground">
              Vui lòng lưu ý:
            </p>
            <ul className="text-sm text-foreground space-y-2 ml-4">
              <li className="list-disc">
                Kết quả lá số và phân tích <strong>chỉ mang tính tham khảo</strong> về văn hóa và tâm linh
              </li>
              <li className="list-disc">
                <strong>Không thay thế tư vấn chuyên nghiệp</strong> từ các chuyên gia pháp luật, tài chính, hay y tế
              </li>
              <li className="list-disc">
                Người dùng tự chịu trách nhiệm khi sử dụng thông tin từ ứng dụng
              </li>
            </ul>
          </div>
        </section>

        {/* Section 7: Liên hệ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Liên Hệ
          </h2>
          <div className="bg-surface-2 rounded-lg p-4 space-y-3">
            <p className="text-sm text-foreground">
              Nếu bạn có câu hỏi về chính sách bảo mật:
            </p>
            <div className="space-y-2 ml-4">
              <p className="text-sm text-foreground">
                <strong>Email:</strong> ai.tuvi.app@gmail.com
              </p>
              <p className="text-sm text-foreground">
                <strong>Zalo:</strong> 0702127233
              </p>
            </div>
          </div>
        </section>

        {/* Footer note */}
        <div className="border-t border-border pt-6 mt-8">
          <p className="text-xs text-muted-foreground text-center">
            © 2024-2026 Tử Vi Việt Nam. Mọi quyền được bảo lưu.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy;
