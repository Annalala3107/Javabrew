---
title: Tại sao khi quên mật khẩu chỉ có thể đặt lại (Reset) mà không thể cho bạn biết mật khẩu cũ?
description: "Giải đáp chi tiết lý do vì sao khi quên mật khẩu, website chỉ cho phép đặt lại mật khẩu mới chứ không thể báo lại mật khẩu gốc. Nguyên nhân cốt lõi là server lưu mật khẩu bằng thuật toán băm không thể đảo ngược, không thể khôi phục mật khẩu ban đầu từ giá trị băm. Bài viết còn trình bày bảo mật lưu trữ mật khẩu, cơ chế thêm salt, Bcrypt và bảo mật truyền tải mật khẩu."
category:
  - Thiết kế hệ thống
tag:
  - Bảo mật dữ liệu
  - Bảo mật mật khẩu
  - Thuật toán băm
  - Câu hỏi phỏng vấn
head:
  - - meta
    - name: keywords
      content: Đặt lại mật khẩu,Khôi phục mật khẩu,Thuật toán băm,Lưu trữ mật khẩu,Bcrypt,Thêm salt,Bảo mật mật khẩu,Câu hỏi phỏng vấn
lang: vi
sourceRef: zh-ref/system-design/security/why-password-reset-instead-of-retrieval.md
---

Đây là một câu hỏi khá thú vị và cũng từng được nhiều công ty hỏi trong phỏng vấn. Vấn đề khá đơn giản, không biết mọi người khi bấm đặt lại mật khẩu hằng ngày có từng thắc mắc điều này bao giờ chưa.

![Đặt lại mật khẩu tài khoản](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/reset-password-page-727107cf.png)

Trả lời câu hỏi này thực ra chỉ gói gọn trong một câu: **vì ngay cả phía server cũng không biết mật khẩu gốc của bạn là gì.** Lập trình viên lưu mật khẩu gốc dạng rõ đã bị sa thải mất rồi 🤣.

Nếu server biết mật khẩu gốc của bạn thì đó chính là một rủi ro bảo mật cực kỳ nghiêm trọng.

Chúng ta hãy cùng phân tích nhanh vấn đề này.

Bài viết này sẽ không bàn quá sâu về các thuật toán mã hóa; bạn nào quan tâm có thể đọc thêm bài viết: [Tổng hợp các Thuật toán Mã hóa Phổ biến](https://javaguide.cn/system-design/security/encryption-algorithms.html).

![](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/javaguide-security-encryption-algorithms-ab4a8508.png)

## Tại sao Server không biết mật khẩu gốc của bạn?

Ai từng làm phát triển hệ thống đều biết rằng khi lưu mật khẩu vào cơ sở dữ liệu, phía server **tuyệt đối không được lưu trực tiếp dưới dạng văn bản rõ (plaintext)**.

Nếu lưu dạng rõ, rủi ro là quá lớn:

1. Dữ liệu trong cơ sở dữ liệu có nguy cơ bị đánh cắp hoặc rò rỉ.
2. Nhân sự nội bộ có quyền truy cập cơ sở dữ liệu có thể lợi dụng với mục đích xấu.
3. Sau khi tin tặc xâm nhập thành công, chúng có thể lấy trọn vẹn mật khẩu của toàn bộ người dùng.

Do đó, mật khẩu bắt buộc phải được xử lý trước khi lưu trữ. Cách xử lý đó chính là sử dụng **thuật toán băm (Hash Algorithm)**.

## Giới thiệu về Thuật toán băm

Thuật toán băm (còn gọi là hàm băm — Hash Function hoặc thuật toán tóm tắt — Digest Algorithm) có tác dụng tạo ra một định danh duy nhất có độ dài cố định cho dữ liệu có độ dài bất kỳ; giá trị này gọi là giá trị băm, hoặc bản tóm tắt thông điệp (sau đây gọi thống nhất là giá trị băm).

![Minh họa hiệu quả của thuật toán băm](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/hash-function-effect-demonstration-1a79d632.png)

Thuật toán băm có hai đặc điểm cốt lõi:

1. **Tính không thể đảo ngược:** Bạn không thể từ giá trị sau khi băm mà suy ngược ra lại giá trị gốc. Đây là điểm mấu chốt!
2. **Tính tất định (Determinism):** Cùng một đầu vào luôn tạo ra đúng một đầu ra giống hệt nhau.

Có một ví dụ ẩn dụ rất sinh động: **mật khẩu bạn lưu giống như khoai tây đã thái sợi vậy — không thể ghép ngược lại thành củ khoai tây nguyên vẹn được. Nhưng cách website kiểm tra mật khẩu có đúng hay không là đem mật khẩu mới bạn vừa nhập vào coi như một củ khoai tây rồi thái sợi lại y hệt như vậy, xem hai đĩa khoai tây thái sợi đó có giống nhau không.**

Chính hai đặc điểm này giúp thuật toán băm cực kỳ phù hợp để lưu trữ mật khẩu: server chỉ lưu giá trị băm của mật khẩu, khi xác thực chỉ cần so sánh hai giá trị băm có khớp nhau hay không.

### Phân loại Thuật toán băm

Có thể chia đơn giản thuật toán băm thành hai loại:

1. **Thuật toán băm mật mã (Cryptographic Hash):** Là các thuật toán băm có độ an toàn cao, cung cấp khả năng bảo vệ tính toàn vẹn dữ liệu và chống giả mạo nhất định, chống lại được nhiều kỹ thuật tấn công; độ an toàn tương đối cao nhưng hiệu năng thấp hơn, phù hợp với các kịch bản yêu cầu bảo mật cao. Ví dụ: SHA-2, SHA-3, SM3, RIPEMD-160, BLAKE2, v.v.
2. **Thuật toán băm phi mật mã (Non-Cryptographic Hash):** Là các thuật toán băm có độ an toàn thấp hơn, dễ bị ảnh hưởng bởi vét cạn (brute-force) hoặc tấn công đụng độ (collision attack), nhưng hiệu năng cao, phù hợp với các kịch bản nghiệp vụ không yêu cầu bảo mật. Ví dụ: CRC32, MurMurHash3, v.v.

Ngoài hai nhóm trên còn có một số thuật toán băm đặc biệt khác, chẳng hạn các **thuật toán băm chậm (Slow Hash)** có độ an toàn cao hơn nữa.

### Tại sao không khuyến nghị MD5?

Thời kỳ đầu người ta hay dùng MD5 để băm mật khẩu, nhưng hiện nay đã **không còn được khuyến nghị** vì các lý do sau:

1. **Khả năng chống đụng độ kém:** Tồn tại lỗi đụng độ yếu, tức nhiều đầu vào khác nhau có thể tạo ra cùng một giá trị MD5.
2. **Giá trị băm ngắn:** Giá trị băm 128-bit rất dễ bị tấn công bằng bảng cầu vồng (rainbow table).
3. **Tốc độ tính toán quá nhanh:** Ngược lại lại khiến tin tặc dễ dàng dò mật khẩu bằng vét cạn (brute-force).

Bạn có thể đọc chi tiết hơn ở bài viết này: [Đừng viết "Mã hóa mật khẩu bằng MD5" vào CV nữa!](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247542780&idx=1&sn=fb2fe3fb53fe596cc5b22e30766e0098&scene=21#wechat_redirect)

### Tại sao cần phải thêm muối (Salting)?

Nếu chỉ dùng thuật toán băm đơn thuần để lưu mật khẩu thì vẫn tồn tại rủi ro bị **tấn công bảng cầu vồng (Rainbow Table Attack)**. Bảng cầu vồng là một bảng tra cứu giá trị băm được tính toán sẵn; kẻ tấn công có thể tra bảng để bẻ khóa mật khẩu rất nhanh chóng.

Muối (**Salt**) là giá trị ngẫu nhiên được sinh độc lập cho từng mật khẩu, và thuật toán băm mật khẩu sẽ đưa cả salt lẫn mật khẩu vào tính toán cùng nhau. Salt không cần giữ bí mật, nhưng bắt buộc phải ngẫu nhiên và không được dùng chung giữa tất cả người dùng.

**Tác dụng của việc thêm muối:**

1. Tăng độ phức tạp và tính duy nhất cho mật khẩu.
2. Làm vô hiệu hóa các cuộc tấn công bằng bảng cầu vồng (vì salt của mỗi người dùng đều khác nhau).
3. Ngay cả khi hai người dùng đặt cùng một mật khẩu giống hệt nhau, giá trị băm lưu ra vẫn hoàn toàn khác nhau.

## Đề xuất Phương án Lưu trữ Mật khẩu

Mật khẩu nên sử dụng các thuật toán được thiết kế chuyên biệt cho lưu trữ mật khẩu và có thể điều chỉnh chi phí tính toán, thay vì dùng trực tiếp các thuật toán băm tốc độ cao như MD5, SHA-256 hay SHA-3. Ngay cả khi thêm salt vào hàm băm tốc độ cao, kẻ tấn công sau khi lấy được cơ sở dữ liệu vẫn có thể thử hàng loạt mật khẩu ứng cử với tốc độ cực lớn.

Hệ thống mới nên ưu tiên cân nhắc **Argon2id**. Nếu không khả dụng, tùy môi trường vận hành có thể chọn `scrypt`; khi cần tương thích hệ thống cũ có thể dùng `Bcrypt` với cấu hình hợp lý; nếu có yêu cầu tuân thủ tiêu chuẩn FIPS thì dùng `PBKDF2`. Các tham số cụ thể cần được đánh giá và nâng cấp định kỳ gắn liền với hiệu năng phần cứng máy chủ.

### Ví dụ về Bcrypt

**Bcrypt** là thuật toán băm được thiết kế chuyên biệt cho lưu trữ mật khẩu, thuộc nhóm thuật toán băm chậm. Nó tích hợp sẵn cơ chế `salt` và tham số `cost` (chi phí tính toán):

- **salt:** Chuỗi sinh ngẫu nhiên dùng để trộn cùng mật khẩu nhằm tăng tính duy nhất.
- **cost:** Kiểm soát số vòng lặp, làm tăng thời gian tính toán và mức tiêu hao tài nguyên.

Salt ngẫu nhiên của Bcrypt giúp ngăn chặn tấn công tính trước và bảng cầu vồng, còn tham số `cost` giúp nâng cao chi phí đoán mật khẩu ngoại tuyến — tuy nhiên điều đó không thể biến một mật khẩu yếu thành không thể bẻ khóa. Ngoài ra cần lưu ý rằng đa số bản cài đặt Bcrypt chỉ xử lý tối đa 72 byte đầu tiên của mật khẩu; hệ thống tuyệt đối không được âm thầm cắt cụt mật khẩu mà không cảnh báo người dùng.

Spring Security cung cấp sẵn `BCryptPasswordEncoder`. Dưới đây là ví dụ minh họa cách thiết lập tường minh tham số `cost`; khi chọn công nghệ cho hệ thống mới vẫn nên ưu tiên đánh giá `Argon2id` trước:

```java
@Bean
public PasswordEncoder passwordEncoder(){
    // cost nên được xác định thông qua kiểm thử hiệu năng và điều chỉnh định kỳ khi năng lực phần cứng tăng lên.
    return new BCryptPasswordEncoder(12);
}
```

## Quy trình Xác thực Đăng nhập

Khi bạn nhập mật khẩu để đăng nhập, quy trình xác thực diễn ra như sau:

1. Server căn cứ vào tên đăng nhập để lấy chuỗi mã hóa băm mật khẩu đang lưu của người dùng từ cơ sở dữ liệu. Chuỗi mã hóa này thường đã bao gồm định danh thuật toán, tham số và salt ngẫu nhiên.
2. Server gọi phương thức xác thực do thư viện băm mật khẩu cung cấp, chẳng hạn `PasswordEncoder#matches` của Spring Security. Không tự tay nối chuỗi salt và cũng không tự so sánh chuỗi trực tiếp.
3. Thư viện mật khẩu tự đọc salt và các tham số trong chuỗi mã hóa, thực hiện phép tính y hệt trên mật khẩu người dùng nhập vào, rồi so sánh kết quả theo cách an toàn.
4. Nếu xác thực khớp, mật khẩu đúng; ngược lại, mật khẩu sai. Sau khi xác thực thành công, hệ thống cũng có thể tính toán lại và nâng cấp bản băm mật khẩu nếu bộ tham số cũ đã lỗi thời.

## Khi đặt lại mật khẩu, làm sao biết mật khẩu mới trùng với mật khẩu cũ?

Các bạn tinh ý hẳn từng thấy một số website khi đặt lại mật khẩu sẽ báo *"Mật khẩu mới không được giống mật khẩu cũ"*. Vậy website làm sao biết được mật khẩu mới trùng với mật khẩu cũ?

Thực ra nguyên lý giống hệt như khi xác thực mật khẩu lúc đăng nhập:

1. Người dùng nhập mật khẩu mới.
2. Server gọi phương thức xác thực của thư viện băm mật khẩu, dùng mật khẩu mới để kiểm tra đối chiếu với bản băm mật khẩu cũ trong cơ sở dữ liệu — ví dụ `passwordEncoder.matches(newPassword, oldPasswordHash)`.
3. Nếu xác thực khớp, chứng tỏ mật khẩu mới giống hệt mật khẩu cũ, hệ thống từ chối thay đổi.
4. Nếu không giống nhau, hệ thống sẽ sinh một salt ngẫu nhiên mới và bản băm mới cho mật khẩu mới — không tái sử dụng bản băm cũ hay tự cố định giá trị salt.

Như vậy website vẫn chẳng hề biết mật khẩu cũ của bạn là gì, nó chỉ kiểm tra xem hai đĩa "khoai tây thái sợi" có giống nhau hay không thôi.

## Bảo mật Truyền tải Mật khẩu

Phần trên đều bàn về bảo mật lưu trữ mật khẩu ở phía server, vậy mật khẩu trên đường truyền có an toàn không?

Có một câu hỏi phỏng vấn rất thường gặp: **Nếu một nhân viên biết cách thức mã hóa, chẳng phải người đó có thể lén hoặc sau khi nghỉ việc sẽ chặn bắt gói tin rồi giả lập mã hóa để lấy trộm mật khẩu sao?**

Câu trả lời là: **lưu trữ và truyền tải vốn dĩ được xử lý tách biệt nhau.**

Một giải pháp bảo mật mật khẩu hoàn chỉnh phải đồng thời đảm bảo cả an toàn lưu trữ lẫn an toàn truyền tải.

### Sử dụng HTTPS

Giao thức HTTPS là nền tảng bảo đảm an toàn truyền tải. Giao thức HTTP chạy trực tiếp trên TCP, mọi nội dung truyền đi đều ở dạng văn bản rõ, cả client và server đều không thể xác minh danh tính của đối phương. Trong khi đó, HTTPS là giao thức HTTP chạy trên nền SSL/TLS, mọi nội dung truyền tải đều được mã hóa.

Về so sánh chi tiết giữa HTTP và HTTPS, bạn có thể xem bài viết: [So sánh HTTP và HTTPS (Tầng Ứng dụng)](https://javaguide.cn/cs-basics/network/http-vs-https.html).

Đối với ứng dụng Web thông thường, HTTPS được cấu hình đúng chuẩn là phương án nền tảng cho bảo mật truyền tải mật khẩu. Phía server nên mặc định sử dụng TLS 1.3 và hỗ trợ thêm TLS 1.2 tùy nhu cầu tương thích; bắt buộc HTTPS trên toàn trang, bật HSTS, kiểm chứng chứng chỉ đúng cách và vô hiệu hóa các giao thức lỗi thời cùng các bộ cipher yếu.

Việc tự thêm một lớp mã hóa RSA tùy chỉnh trên trình duyệt thường không giải quyết được vấn đề client độc hại, script frontend bị chiếm quyền hay lộ mật khẩu tại điểm giải mã phía server, mà trái lại còn làm tăng thêm rủi ro về phân phối khóa, lựa chọn padding và tấn công phát lại bản mã (ciphertext replay). Vì vậy, không nên xem mô hình "RSA phía client + HTTPS" là phương án bắt buộc phổ quát cho mọi hệ thống.

Một số hệ thống có yêu cầu tuân thủ đặc thù hoặc mô hình mối đe dọa riêng có thể bổ sung lớp bảo vệ ở tầng ứng dụng bên trên TLS, nhưng phải sử dụng các giao thức chín muồi đã được thẩm định kỹ lưỡng, đồng thời tích hợp đủ thử thách ngẫu nhiên (challenge), kiểm tra tính thời hiệu và cơ chế chống phát lại (anti-replay), chứ không thể chỉ mã hóa khóa công khai đơn giản một lần.

Bên cạnh mã hóa đường truyền, còn cần giới hạn số lần thử đăng nhập (rate limiting), tránh ghi mật khẩu vào log, sử dụng xác thực đa yếu tố (MFA) và phòng chống tấn công nhồi thông tin xác thực (credential stuffing).

## Quy trình Quên mật khẩu còn cần lưu ý những gì?

Bài viết này trọng tâm giải thích tại sao server không thể lấy lại mật khẩu cũ. Khi triển khai thực tế tính năng quên mật khẩu, còn cần đáp ứng các yêu cầu bảo mật dưới đây:

- Dù tài khoản có tồn tại hay không, đều trả về thông báo thống nhất và cố gắng giữ thời gian phản hồi gần tương đương nhau để tránh lỗ hổng dò tìm người dùng (user enumeration).
- Token đặt lại mật khẩu phải được tạo bằng bộ sinh số ngẫu nhiên an toàn mật mã (CSPRNG), có entropy đủ lớn, chỉ dùng được một lần và hết hạn sau một khoảng thời gian ngắn.
- Áp dụng giới hạn tần suất (rate limiting) cho yêu cầu đặt lại mật khẩu và bước kiểm tra token; liên kết đặt lại chỉ sử dụng tên miền tin cậy và giao thức HTTPS để tránh rò rỉ token qua header `Referer`.
- Sau khi đổi mật khẩu thành công cần gửi thông báo bảo mật, và tùy theo mức độ rủi ro mà vô hiệu hóa các phiên đăng nhập hiện có, hoặc tối thiểu cho phép người dùng đăng xuất hàng loạt khỏi các phiên khác chỉ với một cú nhấp chuột.

## Tổng kết

Quay lại câu hỏi ban đầu: tại sao khi quên mật khẩu chỉ có thể đặt lại chứ không thể cho bạn biết mật khẩu gốc?

Vì thứ server lưu trữ là giá trị sau khi mật khẩu đã đi qua thuật toán băm, mà **thuật toán băm thì không thể đảo ngược**, không thể khôi phục ra mật khẩu ban đầu từ giá trị băm. Đây là nguyên tắc căn bản của bảo mật mật khẩu.

Nếu một website có thể báo thẳng lại cho bạn biết mật khẩu gốc của bạn là gì, điều đó chứng tỏ phía server đang lưu trữ mật khẩu ở dạng **văn bản rõ hoặc dạng có thể giải mã ngược**, chứ không chỉ lưu bản băm mật khẩu chuyên dụng. Đây là lỗ hổng bảo mật nghiêm trọng; bạn nên đổi mật khẩu ngay lập tức và kiểm tra xem mình có dùng trùng mật khẩu đó ở các website khác hay không.

**Quan trọng hơn nữa là:** nếu bạn dùng cùng một mật khẩu ở mọi website, chỉ cần một website kém uy tín làm lộ mật khẩu của bạn thì toàn bộ các tài khoản khác của bạn đều rơi vào nguy hiểm. Vì thế, **tuyệt đối không dùng chung một mật khẩu cho tất cả các website!**

## Tài liệu tham khảo

- OWASP Password Storage Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
- OWASP Forgot Password Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html>
- OWASP Transport Layer Security Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html>
