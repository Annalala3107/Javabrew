---
title: Giải thích chi tiết về SSO (Single Sign-On)
description: "Giải thích chi tiết nguyên lý SSO (Đăng nhập một lần), bao gồm thiết kế trung tâm xác thực thống nhất, giao thức CAS, triển khai đăng nhập đa miền (cross-domain) và cơ chế đồng bộ trạng thái đăng nhập."
category: Thiết kế hệ thống
tag:
  - Bảo mật
head:
  - - meta
    - name: keywords
      content: SSO,Single Sign-On,Đăng nhập một lần,Xác thực thống nhất,Trạng thái đăng nhập,Ticket,TGT,ST,Giao thức CAS,Đăng nhập đa miền
lang: vi
sourceRef: zh-ref/system-design/security/sso-intro.md
---

> Bài viết được đăng lại với sự cho phép từ: <https://ken.io/note/sso-design-implement> Tác giả: ken.io

## Giới thiệu về SSO

### SSO là gì?

SSO là viết tắt của cụm từ tiếng Anh **Single Sign-On** (Đăng nhập một lần). Trong một hệ sinh thái gồm nhiều hệ thống ứng dụng, SSO cho phép người dùng chỉ cần đăng nhập một lần duy nhất là có thể truy cập tất cả các hệ thống ứng dụng tin cậy lẫn nhau.

Ví dụ: sau khi bạn đăng nhập vào Trung tâm Tài khoản NetEase (<https://reg.163.com/>), khi truy cập các trang web dưới đây bạn đều ở trạng thái đã đăng nhập:

- NetEase Live [https://v.163.com](https://v.163.com/)
- NetEase Blog [https://blog.163.com](https://blog.163.com/)
- NetEase Huatian [https://love.163.com](https://love.163.com/)
- NetEase Kaola [https://www.kaola.com](https://www.kaola.com/)
- NetEase Lofter [http://www.lofter.com](http://www.lofter.com/)

### SSO có lợi ích gì?

1. **Góc độ người dùng:** Người dùng chỉ cần đăng nhập một lần để dùng nhiều hệ thống, không phải ghi nhớ nhiều bộ tên đăng nhập và mật khẩu khác nhau, rất tiện lợi.
2. **Góc độ quản trị viên hệ thống:** Quản trị viên chỉ cần duy trì một trung tâm tài khoản thống nhất duy nhất, dễ dàng quản lý.
3. **Góc độ phát triển hệ thống mới:** Khi phát triển hệ thống mới, lập trình viên chỉ cần tích hợp trực tiếp với trung tâm tài khoản thống nhất, giúp đơn giản hóa quy trình phát triển và tiết kiệm thời gian.

## Thiết kế và Triển khai SSO

Bài viết này chủ yếu tập trung thảo luận cách thiết kế và triển khai một hệ thống SSO.

Dưới đây là các tính năng cốt lõi cần triển khai:

- Đăng nhập một lần (Single Sign-On)
- Đăng xuất một lần (Single Sign-Out)
- Hỗ trợ đăng nhập một lần đa miền (Cross-domain SSO)
- Hỗ trợ đăng xuất một lần đa miền (Cross-domain Single Sign-Out)

### Các ứng dụng cốt lõi và thành phần phụ thuộc

![Thiết kế hệ thống Đăng nhập một lần (SSO)](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-system.png-kblb-a9f16729.png)

| Ứng dụng / Module / Đối tượng | Mô tả |
| ----------------------------- | ----- |
| Trang Frontend | Trang web yêu cầu đăng nhập |
| Trang SSO - Đăng nhập | Cung cấp giao diện trang đăng nhập |
| Trang SSO - Đăng xuất | Cung cấp điểm truy cập để đăng xuất |
| Dịch vụ SSO - Đăng nhập | Cung cấp dịch vụ xử lý đăng nhập |
| Dịch vụ SSO - Trạng thái đăng nhập | Cung cấp dịch vụ kiểm tra trạng thái đăng nhập / truy vấn thông tin đăng nhập |
| Dịch vụ SSO - Đăng xuất | Cung cấp dịch vụ đăng xuất người dùng |
| Cơ sở dữ liệu (Database) | Lưu trữ thông tin tài khoản người dùng |
| Cache | Lưu trữ thông tin đăng nhập của người dùng, thường sử dụng Redis |

### Lưu trữ và Kiểm tra trạng thái đăng nhập của người dùng

Các Web Framework phổ biến thường triển khai Session bằng cách sinh ra một `SessionId` lưu trong Cookie của trình duyệt, sau đó lưu nội dung Session trong bộ nhớ phía máy chủ — điều này cũng đã được [ken.io](https://ken.io/) đề cập trước đó trong bài [Nguyên lý hoạt động của Session](https://ken.io/note/session-principle-skill). Nhìn chung, thiết kế SSO cũng tham khảo ý tưởng này.

Sau khi người dùng đăng nhập thành công, trang SSO sẽ thiết lập phiên đăng nhập (session) riêng của mình. Định danh phiên trên trình duyệt nên được lưu trong Cookie có thiết lập các thuộc tính `Secure`, `HttpOnly` và `SameSite` phù hợp; Cookie tốt nhất chỉ nên áp dụng cho host hiện tại (host-only), không nên mở rộng trực tiếp ra toàn bộ domain cha chỉ để chia sẻ trạng thái đăng nhập. Đối với ứng dụng di động (Mobile App), nên sử dụng trình duyệt hệ thống để hoàn tất luồng ủy quyền tiêu chuẩn và lưu thông tin xác thực cần thiết vào bộ nhớ an toàn như Keychain, Keystore. Bài viết này chủ yếu bàn về SSO trên nền tảng Web.

Khi người dùng truy cập một trang yêu cầu đăng nhập, client sẽ gửi `AuthToken` lên dịch vụ SSO để kiểm tra trạng thái đăng nhập và/hoặc lấy thông tin đăng nhập của người dùng.

Đối với việc lưu trữ thông tin đăng nhập, khuyến nghị sử dụng Redis. Dùng Redis Cluster để lưu thông tin đăng nhập vừa đảm bảo tính sẵn sàng cao (High Availability), vừa có thể mở rộng tuyến tính, đồng thời giúp dịch vụ SSO đáp ứng tốt nhu cầu cân bằng tải (Load Balancing) và mở rộng quy mô (Scalability).

| Đối tượng | Mô tả |
| --------- | ----- |
| AuthToken | Định danh có entropy cao, không thể đoán trước, được tạo bằng bộ sinh số ngẫu nhiên an toàn mật mã (CSPRNG), đồng thời thiết lập cơ chế hết hạn (expiration), xoay vòng (rotation) và thu hồi (revocation). Không sử dụng các phiên bản UUID có thể dự đoán, và không tự ý mã hóa `UserName` + timestamp để làm session token. |
| Thông tin đăng nhập | Thường cache các trường như `UserId`, `UserName`. |

### Đăng nhập và Kiểm tra trạng thái đăng nhập

**Biểu đồ tuần tự (Sequence Diagram) Đăng nhập**

![Thiết kế hệ thống SSO - Biểu đồ tuần tự đăng nhập](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-login-sequence.png-kbrb-0e97c0c7.png)

Hình trên minh họa cách chia sẻ `AuthToken` giữa nhiều subdomain thông qua Cookie ở domain cha. Với các hệ thống mới, **không** khuyến nghị đặt thuộc tính `Domain` của Cookie xác thực thành `.test.com`: làm vậy sẽ gửi cùng một thông tin xác thực tới mọi subdomain khớp mẫu, khiến bất kỳ subdomain nào yếu bảo mật, bị bỏ hoang hoặc bị chiếm quyền đều có thể làm mở rộng bề mặt tấn công (attack surface).

Cách làm an toàn hơn là để trang SSO và từng trang nghiệp vụ duy trì session riêng chỉ gắn với host hiện tại (host-only). Khi trang nghiệp vụ cần đăng nhập, nó chuyển hướng người dùng sang trang SSO. Trang SSO dùng Cookie riêng của mình để kiểm tra xem người dùng đã đăng nhập hay chưa, sau đó trả kết quả xác thực về cho trang nghiệp vụ thông qua một mã ủy quyền (authorization code) dùng một lần và có thời hạn ngắn; backend của trang nghiệp vụ sẽ đổi mã này lấy thông tin người dùng và thiết lập session cục bộ.

**Lấy thông tin đăng nhập / Kiểm tra trạng thái đăng nhập**

![Thiết kế hệ thống SSO - Lấy thông tin đăng nhập / Kiểm tra trạng thái đăng nhập](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-logincheck-sequence.png-kbrb-be6352e2.png)

### Đăng xuất người dùng

Đăng xuất SSO không chỉ đơn thuần là xóa một Cookie:

1. Máy chủ SSO thu hồi phiên đăng nhập trung tâm và các quyền làm mới (refresh grant) liên quan.
2. Trang SSO xóa Cookie phiên của chính nó.
3. Tùy theo giao thức và mức độ rủi ro nghiệp vụ, thông báo cho từng trang nghiệp vụ qua kênh trước (front-channel) hoặc kênh sau (back-channel) để dọn dẹp session cục bộ, đồng thời xử lý các trường hợp thông báo thất bại hoặc trang nghiệp vụ đang ngoại tuyến.

**Biểu đồ tuần tự Đăng xuất**

![Thiết kế hệ thống SSO - Đăng xuất người dùng](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-logout-sequence.png-kbrb-9268a188.png)

### Đăng nhập và Đăng xuất đa miền (Cross-Domain)

SSO đa miền không nên cố tìm cách giải quyết việc đọc/ghi Cookie xuyên domain, mà nên thông qua chuyển hướng trình duyệt tiêu chuẩn và trao đổi token ở backend để từng trang tự thiết lập session riêng của mình. Lựa chọn phổ biến là **OpenID Connect Authorization Code Flow**.

Ý tưởng cốt lõi để giải quyết bài toán đa miền là:

- Sau khi đăng nhập hoàn tất, dịch vụ SSO chỉ trả về mã ủy quyền (authorization code) dùng một lần, thời hạn ngắn cho địa chỉ callback (`redirect_uri`) đã được đăng ký trước và khớp chính xác. Backend của trang nghiệp vụ sử dụng mã ủy quyền đó để đổi lấy kết quả xác thực và tạo session riêng của mình, không sao chép cùng một Bearer Token dài hạn qua nhiều domain khác nhau.
- Request ủy quyền cần kiểm tra `state`; khi sử dụng OpenID Connect còn phải kiểm tra `Issuer`, `Audience` và chữ ký số, đồng thời đối chiếu giá trị `nonce` nếu có sử dụng. Các public client dùng Authorization Code Flow cũng nên sử dụng thêm PKCE.
- Đăng xuất xuyên trang sử dụng thông báo front-channel hoặc back-channel do giao thức định nghĩa, và cho phép các trang nghiệp vụ hội tụ trạng thái thông qua hết hạn session, thu hồi token và xác thực lại khi thông báo đăng xuất bị lỗi.

**Đăng nhập đa miền (Tên miền chính đã đăng nhập)**

![Thiết kế hệ thống SSO - Đăng nhập đa miền (Tên miền chính đã đăng nhập)](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-crossdomain-login-loggedin-sequence.png-kbrb-2fa846cf.png)

**Đăng nhập đa miền (Tên miền chính chưa đăng nhập)**

![Thiết kế hệ thống SSO - Đăng nhập đa miền (Tên miền chính chưa đăng nhập)](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-crossdomain-login-unlogin-sequence.png-kbrb-c62b0a77.png)

**Đăng xuất đa miền**

![Thiết kế hệ thống SSO - Đăng xuất đa miền](/media/jg/ext/oss.javaguide.cn/system-design/security/sso/sso-crossdomain-logout-sequence.png-kbrb-3d8b358c.png)

Các biểu đồ tuần tự ở trên xuất phát từ phương án gốc được đăng lại, chủ yếu giúp người đọc hình dung luồng chuyển hướng đăng nhập và quan hệ thông báo. Những chi tiết như truyền trực tiếp `AuthToken` hay dùng chung Cookie domain cha **không** nên làm căn cứ triển khai cho hệ thống mới. Hệ thống mới cần tuân thủ quy chuẩn bảo mật hiện hành của giao thức OpenID Connect / OAuth được lựa chọn.

## Lưu ý

- **Về giải pháp:** Phương án thiết kế lần này chủ yếu mang tính gợi mở ý tưởng triển khai. Việc đăng nhập trên Mobile App không nên chỉ thêm một "chữ ký APP" tự chế để làm giải pháp bảo mật; khuyến nghị sử dụng trình duyệt hệ thống để hoàn tất luồng OpenID Connect / OAuth Authorization Code Flow kết hợp PKCE. Không thể xem APP như một môi trường tin cậy có khả năng giữ bí mật vĩnh viễn cho `client_secret`.
- **Về biểu đồ tuần tự:** Các biểu đồ tuần tự chưa bao gồm toàn bộ mọi kịch bản mà chỉ liệt kê các kịch bản cốt lõi/chính yếu; ngoài ra, những thông điệp không ảnh hưởng đến việc hiểu luồng ý tưởng đã được lược giản tối đa.

## Tài liệu tham khảo

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0-18.html)
- [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html)
