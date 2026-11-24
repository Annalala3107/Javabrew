---
title: "Chuyên đề Xác thực, Phân quyền & Bảo mật dữ liệu: JWT, SSO, Hệ thống phân quyền, Mã hóa, Che giấu và Kiểm tra dữ liệu"
description: Lộ trình ôn tập phỏng vấn Xác thực, Phân quyền & Bảo mật dữ liệu, bao gồm Session, Token, OAuth2, JWT, SSO, RBAC, thuật toán mã hóa, che giấu dữ liệu (Data Masking), kiểm tra dữ liệu và bảo mật mật khẩu.
category: Thiết kế Hệ thống
tag:
  - Xác thực & Phân quyền
  - Bảo mật dữ liệu
  - Phỏng vấn Backend
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Xác thực phân quyền,Authentication,Authorization,Session,Token,OAuth2,JWT,SSO,RBAC,Hệ thống phân quyền,Thuật toán mã hóa,Lọc từ nhạy cảm,Che giấu dữ liệu,Kiểm tra dữ liệu,Bảo mật mật khẩu,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/system-design/security/README.md
---

Chuyên đề Xác thực, Phân quyền & Bảo mật dữ liệu tập trung vào một chuỗi mắt xích rất cơ bản trong hệ thống backend nhưng chi phí trả giá khi xảy ra lỗi cực kỳ cao: người dùng đăng nhập thế nào, danh tính được truyền tải ra sao, quyền hạn được kiểm tra như thế nào, dữ liệu nhạy cảm được bảo vệ ra sao và dữ liệu đầu vào được kiểm tra thế nào.

Bảo mật không phải là thứ mà một framework hay một annotation đơn lẻ có thể bảo kê trọn vẹn. Nó đòi hỏi phải được thiết kế đồng bộ xuyên suốt từ xác thực, phân quyền, truyền tải, lưu trữ, hiển thị, kiểm tra đầu vào cho tới ghi nhận kiểm toán (audit).

Nếu thời gian gấp rút, bạn có thể xem trước bản ôn tập cấp tốc [Tổng hợp câu hỏi phỏng vấn thường gặp về Xác thực và Phân quyền](https://interview.javaguide.cn/system-design/authentication-and-authorization-interview-questions.html) và [Tổng hợp câu hỏi phỏng vấn thường gặp về Bảo mật Web](https://interview.javaguide.cn/system-design/security-interview-questions.html), rồi quay lại chuyên đề này để bổ sung đầy đủ nguyên lý và phương án triển khai.

## Đối tượng phù hợp

- Lập trình viên backend đang tìm hiểu về xác thực đăng nhập, hệ thống phân quyền và bảo mật dữ liệu.
- Các bạn đang chuẩn bị phỏng vấn về xác thực phân quyền, JWT, SSO, RBAC, che giấu dữ liệu (Data Masking).
- Kỹ sư cần thiết kế phân quyền quản trị, hệ thống tài khoản người dùng, hiển thị dữ liệu nhạy cảm hoặc phương án kiểm tra dữ liệu trong dự án thực tế.
- Độc giả đã từng dùng các framework như Spring Security, Sa-Token, Shiro nhưng muốn củng cố vững các khái niệm nền tảng bên dưới.

## Trọng tâm học tập

- Xác thực (Authentication) giải quyết câu hỏi "bạn là ai", phân quyền (Authorization) giải quyết câu hỏi "bạn được làm gì", không được đánh đồng hai khái niệm này.
- Session, Token, JWT, OAuth2, SSO phù hợp với từng kịch bản khác nhau, không thể chỉ lấy tiêu chí "stateless" để đánh giá hay dở.
- Cả ưu điểm lẫn vấn đề của JWT đều rất rõ rệt; trọng tâm nằm ở kiểm soát thu hồi hiệu lực, gia hạn token, rủi ro rò rỉ và quản trị phía server.
- Hệ thống phân quyền thường cần mô hình hóa theo các chiều như người dùng, vai trò, quyền hạn, tài nguyên, tổ chức và phạm vi dữ liệu.
- Bảo mật dữ liệu bao gồm cả lưu trữ mã hóa lẫn hiển thị che giấu (masking), kiểm tra đầu vào, lọc từ nhạy cảm và bảo mật mật khẩu.
- Giải pháp bảo mật bắt buộc phải cân nhắc chi phí triển khai, trải nghiệm người dùng, khả năng kiểm toán và năng lực ứng phó sự cố.

## Thứ tự đọc khuyến nghị

1. [Giải thích chi tiết khái niệm cơ bản về Xác thực và Phân quyền](./basis-of-authority-certification.md): Phân biệt rõ Authentication, Authorization, Session, Token, OAuth2 và các khái niệm nền tảng trước.
2. [Giải thích chi tiết khái niệm cơ bản về JWT](./jwt-intro.md) và [Phân tích ưu nhược điểm của xác thực bằng JWT](./advantages-and-disadvantages-of-jwt.md): Hiểu cách hoạt động, điểm mạnh và giới hạn của JWT.
3. [Giải thích chi tiết đăng nhập một lần SSO](./sso-intro.md): Hiểu trung tâm xác thực thống nhất, đăng nhập xuyên hệ thống và đồng bộ trạng thái đăng nhập.
4. [Giải thích chi tiết thiết kế hệ thống phân quyền](./design-of-authority-system.md): Đưa xác thực phân quyền vào thực tiễn với thiết kế hệ thống phân quyền RBAC.
5. [Tổng hợp các thuật toán mã hóa phổ biến](./encryption-algorithms.md), [Tổng hợp giải pháp che giấu dữ liệu](./data-desensitization.md), [Tại sao cả Frontend và Backend đều phải kiểm tra dữ liệu?](./data-validation.md): Hoàn thiện nền tảng bảo mật dữ liệu.
6. Sau đó tùy kịch bản nghiệp vụ mà đọc thêm [Tổng hợp giải pháp lọc từ nhạy cảm](./sentive-words-filter.md) và [Tại sao khi quên mật khẩu chỉ có thể đặt lại chứ không thể báo cho bạn mật khẩu cũ?](./why-password-reset-instead-of-retrieval.md).

## Bài viết cốt lõi

### Xác thực & Phân quyền

- [Giải thích chi tiết khái niệm cơ bản về Xác thực và Phân quyền](./basis-of-authority-certification.md): Trình bày kiến thức cốt lõi về Authentication, Authorization, Session, Token, OAuth2...
- [Giải thích chi tiết khái niệm cơ bản về JWT](./jwt-intro.md): Trình bày cấu trúc thành phần, thuật toán ký, nguyên lý hoạt động và ứng dụng xác thực đăng nhập của JSON Web Token.
- [Phân tích ưu nhược điểm của xác thực bằng JWT](./advantages-and-disadvantages-of-jwt.md): Phân tích các vấn đề như JWT không thể chủ động hủy hiệu lực, gia hạn Token và giải pháp tương ứng.
- [Giải thích chi tiết đăng nhập một lần SSO](./sso-intro.md): Trình bày trung tâm xác thực thống nhất, giao thức CAS, triển khai đăng nhập xuyên miền (cross-domain) và cơ chế đồng bộ trạng thái đăng nhập.
- [Giải thích chi tiết thiết kế hệ thống phân quyền](./design-of-authority-system.md): Trình bày mô hình hóa hệ thống phân quyền, kiểm soát truy cập và thiết kế hệ thống quản trị dựa trên RBAC.

### Bảo mật dữ liệu

- [Tổng hợp các thuật toán mã hóa phổ biến](./encryption-algorithms.md): Hệ thống hóa nguyên lý và kịch bản ứng dụng của các thuật toán AES, RSA, MD5, SHA...
- [Tổng hợp giải pháp lọc từ nhạy cảm](./sentive-words-filter.md): Từ khớp vét cạn (brute-force) tới cây Trie, AC Automaton, giải thích quá trình tiến hóa thuật toán lọc từ nhạy cảm và thực tiễn kỹ thuật.
- [Tổng hợp giải pháp che giấu dữ liệu](./data-desensitization.md): Trình bày quy tắc và phương pháp cài đặt che giấu dữ liệu nhạy cảm như số điện thoại, căn cước công dân, thẻ ngân hàng.
- [Tại sao cả Frontend và Backend đều phải kiểm tra dữ liệu?](./data-validation.md): Giải thích tầm quan trọng của kiểm tra tham số, kiểm tra quyền hạn và cách chống vượt qua bước kiểm tra ở frontend.
- [Tại sao khi quên mật khẩu chỉ có thể đặt lại chứ không thể báo cho bạn mật khẩu cũ?](./why-password-reset-instead-of-retrieval.md): Giải thích băm mật khẩu (Password Hashing), thêm muối (Salting), Bcrypt và bảo mật truyền tải mật khẩu.

## Câu hỏi thường gặp

- Xác thực (Authentication) và phân quyền (Authorization) khác nhau thế nào?
- Session và Token khác nhau ở điểm nào?
- JWT gồm những phần nào? Chữ ký giải quyết vấn đề gì?
- Tại sao JWT không thể tự nhiên chủ động hết hiệu lực? Có những giải pháp nào?
- OAuth2 và JWT có quan hệ gì với nhau?
- Quy trình cốt lõi của đăng nhập một lần SSO là gì?
- Thiết kế mô hình phân quyền RBAC như thế nào? Quan hệ giữa người dùng, vai trò, quyền hạn và tài nguyên ra sao?
- Mã hóa đối xứng, mã hóa bất đối xứng và thuật toán băm lần lượt phù hợp với kịch bản nào?
- Tại sao không được lưu mật khẩu dạng bản rõ (plaintext)? Tại sao quên mật khẩu chỉ có thể đặt lại (reset)?
- Che giấu dữ liệu (Data Masking) nên làm ở tầng lưu trữ, tầng dịch vụ hay tầng hiển thị?
- Tại sao backend bắt buộc phải kiểm tra dữ liệu?
- Có những phương án cài đặt lọc từ nhạy cảm nào phổ biến?

## Chuyên đề liên quan

- [Hệ thống kiến thức Thiết kế Hệ thống](../)
- [Chuyên đề Nền tảng Thiết kế Hệ thống](../basis/)
- [Chuyên đề Spring & Spring Boot](../framework/spring/)
- [Hệ thống kiến thức Hệ thống Độ sẵn sàng cao](../../high-availability/)
- [An ninh mạng máy tính](../../cs-basics/network/network-attack-means.md)
