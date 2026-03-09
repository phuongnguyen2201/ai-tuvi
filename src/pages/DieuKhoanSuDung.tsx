import PageLayout from "@/components/PageLayout";

const DieuKhoanSuDung = () => {
  return (
    <PageLayout title="Điều Khoản Sử Dụng">
      <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-6 px-1">
        <p className="text-muted-foreground text-xs">Cập nhật lần cuối: 09/03/2026</p>

        <p>
          Chào mừng bạn đến với AI Tử Vi App ("Ứng dụng", "Dịch vụ", "chúng tôi"). Bằng việc truy cập và sử dụng
          Ứng dụng, bạn đồng ý tuân thủ và chịu ràng buộc bởi các Điều khoản sử dụng ("Điều khoản") dưới đây. Nếu
          bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng Ứng dụng.
        </p>

        <h2 className="text-lg font-bold text-foreground pt-2">Điều 1. Giới thiệu Dịch vụ</h2>
        <p>
          AI Tử Vi App là ứng dụng công nghệ thông tin (CNTT) phục vụ mục đích tìm hiểu văn hóa Tử Vi Đẩu Số truyền
          thống Phương Đông. Ứng dụng cung cấp các tính năng: Lập lá số Tử Vi dựa trên thuật toán tính toán thiên văn
          học truyền thống; Luận giải lá số Tử Vi hỗ trợ bởi trí tuệ nhân tạo (AI); Bói Kiều — gieo quẻ bằng thơ
          Truyện Kiều của Nguyễn Du; Bói Quẻ — gieo quẻ Kinh Dịch (I Ching) theo phương pháp truyền thống; và Vận Hạn
          — phân tích xu hướng vận mệnh theo tuần, tháng, năm.
        </p>

        <h2 className="text-lg font-bold text-foreground pt-2">Điều 2. Tuyên bố miễn trừ trách nhiệm</h2>

        <h3 className="text-base font-semibold text-foreground">2.1. Tính chất tham khảo</h3>
        <p>
          Toàn bộ kết quả do Ứng dụng cung cấp — bao gồm nhưng không giới hạn ở lá số Tử Vi, luận giải AI, kết quả
          bói Kiều, bói Quẻ, và phân tích vận hạn —{" "}
          <strong>CHỈ MANG TÍNH CHẤT THAM KHẢO, GIẢI TRÍ VÀ TÌM HIỂU VĂN HÓA.</strong>
        </p>

        <h3 className="text-base font-semibold text-foreground">2.2. Không thay thế tư vấn chuyên nghiệp</h3>
        <p>
          Kết quả từ Ứng dụng KHÔNG thay thế cho bất kỳ hình thức tư vấn chuyên nghiệp nào, bao gồm: tư vấn y tế từ
          bác sĩ; tư vấn pháp lý từ luật sư; tư vấn tài chính, đầu tư từ chuyên gia tài chính; và tư vấn tâm lý từ
          chuyên gia tâm lý học.
        </p>

        <h3 className="text-base font-semibold text-foreground">2.3. Không đảm bảo tính chính xác</h3>
        <p>
          Chúng tôi KHÔNG đưa ra cam kết hay đảm bảo về tính chính xác, đầy đủ hoặc phù hợp của bất kỳ kết quả nào.
          Tử Vi, Bói Kiều và Bói Quẻ là các phương pháp truyền thống mang tính triết học và văn hóa, không phải khoa
          học chính xác.
        </p>

        <h3 className="text-base font-semibold text-foreground">2.4. Trí tuệ nhân tạo (AI)</h3>
        <p>
          Các luận giải được hỗ trợ bởi mô hình ngôn ngữ AI. Kết quả AI có thể chứa sai sót, thiếu chính xác, hoặc
          không phù hợp trong mọi trường hợp. Người dùng cần tự đánh giá và không nên dựa hoàn toàn vào kết quả AI để
          ra quyết định quan trọng.
        </p>

        <h2 className="text-lg font-bold text-foreground pt-2">Điều 3. Điều kiện sử dụng</h2>

        <h3 className="text-base font-semibold text-foreground">3.1. Tài khoản</h3>
        <p>
          Để sử dụng đầy đủ tính năng, bạn cần đăng ký tài khoản bằng email. Bạn chịu trách nhiệm bảo mật thông tin
          đăng nhập và mọi hoạt động diễn ra dưới tài khoản của mình.
        </p>

        <h3 className="text-base font-semibold text-foreground">3.2. Độ tuổi</h3>
        <p>
          Ứng dụng dành cho người dùng từ 16 tuổi trở lên. Nếu bạn dưới 18 tuổi, bạn cần có sự đồng ý của phụ huynh
          hoặc người giám hộ hợp pháp.
        </p>

        <h3 className="text-base font-semibold text-foreground">3.3. Hành vi bị cấm</h3>
        <p>
          Người dùng KHÔNG được: sử dụng Ứng dụng cho mục đích phi pháp; cố tình phá hoại hoặc tấn công hệ thống; sử
          dụng bot hoặc script tự động để gửi yêu cầu hàng loạt; mạo danh người khác; hoặc sao chép, phân phối lại
          nội dung luận giải cho mục đích thương mại mà không có sự đồng ý.
        </p>

        <h2 className="text-lg font-bold text-foreground pt-2">Điều 4. Thanh toán và Gói dịch vụ</h2>

        <h3 className="text-base font-semibold text-foreground">4.1. Gói miễn phí</h3>
        <p>
          Mỗi tính năng cung cấp 01 lượt dùng thử miễn phí. Kết quả miễn phí được hiển thị dưới dạng rút gọn (bản
          xem trước).
        </p>

        <h3 className="text-base font-semibold text-foreground">4.2. Gói trả phí</h3>
        <p>
          Sau khi hết lượt miễn phí, người dùng có thể mua các gói dịch vụ theo từng tính năng. Mỗi gói bao gồm số
          lượt sử dụng cố định. Giá cả được hiển thị rõ ràng trước khi thanh toán.
        </p>

        <h3 className="text-base font-semibold text-foreground">4.3. Phương thức thanh toán</h3>
        <p>
          Thanh toán được thực hiện qua chuyển khoản ngân hàng thông qua mã VietQR. Hệ thống tự động xác nhận thanh
          toán. Trong trường hợp hệ thống tự động không hoạt động, quản trị viên sẽ xác nhận thủ công trong vòng 24
          giờ.
        </p>

        <h3 className="text-base font-semibold text-foreground">4.4. Chính sách hoàn tiền</h3>
        <p>
          Do tính chất của dịch vụ số, chúng tôi không áp dụng chính sách hoàn tiền cho các lượt đã sử dụng. Tuy
          nhiên, trong các trường hợp lỗi kỹ thuật khiến không nhận được kết quả, hệ thống trừ lượt nhưng không hiển
          thị kết quả, hoặc trùng lặp thanh toán — người dùng có thể yêu cầu hoàn tiền hoặc cấp bù trong vòng 7 ngày
          qua email liên hệ.
        </p>

        <h2 className="text-lg font-bold text-foreground pt-2">Điều 5. Sở hữu trí tuệ</h2>
        <p>
          Toàn bộ nội dung, thiết kế, mã nguồn, thuật toán và hệ thống của Ứng dụng thuộc quyền sở hữu trí tuệ của
          chúng tôi, được bảo vệ bởi luật sở hữu trí tuệ Việt Nam và quốc tế. Các phương pháp Tử Vi Đẩu Số, Kinh
          Dịch và Truyện Kiều là di sản văn hóa truyền thống. Kết quả luận giải được tạo riêng cho mỗi người dùng —
          người dùng có quyền chia sẻ kết quả cho mục đích cá nhân.
        </p>

        <h2 className="text-lg font-bold text-foreground pt-2">Điều 6. Bảo mật dữ liệu</h2>
        <p>
          Việc thu thập, lưu trữ và xử lý dữ liệu cá nhân được quy định chi tiết tại{" "}
          <a href="/chinh-sach-bao-mat" className="text-primary underline">
            Chính sách bảo mật
          </a>
          . Chúng tôi chỉ thu thập dữ liệu cần thiết cho dịch vụ, không bán hoặc chia sẻ dữ liệu cho bên thứ ba, và
          người dùng có quyền yêu cầu xóa dữ liệu cá nhân theo quy định pháp luật.
        </p>

        <h2 className="text-lg font-bold text-foreground pt-2">Điều 7. Giới hạn trách nhiệm</h2>
        <p>
          Trong phạm vi tối đa được pháp luật cho phép, chúng tôi không chịu trách nhiệm về bất kỳ thiệt hại nào phát
          sinh từ việc sử dụng Ứng dụng, bao gồm quyết định cá nhân dựa trên kết quả, mất mát dữ liệu, hoặc gián
          đoạn dịch vụ. Tổng trách nhiệm bồi thường không vượt quá số tiền người dùng đã thanh toán trong 12 tháng gần
          nhất.
        </p>

        <h2 className="text-lg font-bold text-foreground pt-2">Điều 8. Thay đổi Điều khoản</h2>
        <p>
          Chúng tôi có quyền cập nhật Điều khoản bất kỳ lúc nào. Việc tiếp tục sử dụng Ứng dụng sau khi Điều khoản
          được cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi. Đối với các thay đổi quan trọng, chúng tôi sẽ
          thông báo ít nhất 7 ngày trước.
        </p>

        <h2 className="text-lg font-bold text-foreground pt-2">Điều 9. Chấm dứt</h2>
        <p>
          Chúng tôi có quyền tạm ngừng hoặc chấm dứt tài khoản nếu phát hiện vi phạm Điều khoản. Người dùng có thể
          chấm dứt tài khoản bất kỳ lúc nào bằng cách liên hệ qua email. Dữ liệu cá nhân sẽ được xóa theo Chính sách
          bảo mật.
        </p>

        <h2 className="text-lg font-bold text-foreground pt-2">Điều 10. Luật áp dụng</h2>
        <p>
          Điều khoản này được điều chỉnh theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Mọi tranh chấp sẽ
          được giải quyết thông qua thương lượng, hòa giải. Nếu không đạt được thỏa thuận, tranh chấp sẽ được giải
          quyết tại Tòa án nhân dân có thẩm quyền.
        </p>

        <h2 className="text-lg font-bold text-foreground pt-2">Điều 11. Liên hệ</h2>
        <p>
          Email:{" "}
          <a href="mailto:ai.tuvi.app@gmail.com" className="text-primary underline">
            ai.tuvi.app@gmail.com
          </a>
          <br />
          Website:{" "}
          <a href="https://ai-tuvi.lovable.app" className="text-primary underline">
            ai-tuvi.lovable.app
          </a>
        </p>
      </div>
    </PageLayout>
  );
};

export default DieuKhoanSuDung;
