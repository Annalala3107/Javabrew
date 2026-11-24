---
title: "JWT là gì? Giải thích chi tiết cấu trúc, phân tích và xác thực đăng nhập JWT"
description: JWT (JSON Web Token) là gì? Bài viết minh họa chi tiết cấu trúc 3 phần Header, Payload, Signature, giải mã Base64Url, xác minh chữ ký, thời gian hết hạn, quy trình xác thực đăng nhập cùng các rủi ro bảo mật thường gặp.
category: Thiết kế Hệ thống
tag:
  - Bảo mật
head:
  - - meta
    - name: keywords
      content: JWT là gì,Phân tích JWT,JWT Token,Xác thực JWT,JSON Web Token,Xác thực Token,Stateless,Header Payload Signature,Thuật toán ký,Xác thực đăng nhập,CSRF
lang: vi
sourceRef: zh-ref/system-design/security/jwt-intro.md
---


## JWT là gì?

JWT (JSON Web Token) là một định dạng biểu diễn các tuyên bố (claims) gọn nhẹ và an toàn với URL được định nghĩa trong [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519). Sau khi đăng nhập thành công, server có thể ghi các thông tin như định danh người dùng, phạm vi quyền hạn và thời gian hết hạn vào JWT; client mang theo JWT này trong các request tiếp theo, còn server xác minh chữ ký cùng các claim liên quan trước khi quyết định có cho phép đi qua hay không.

JWT có thể mang theo các claim cần thiết cho việc xác thực và phân quyền, nên server không nhất thiết phải lưu trạng thái phiên (session state) như phương án Session truyền thống. Tuy nhiên, các nhu cầu như thu hồi token, thay đổi quyền hạn hay buộc đăng xuất chủ động vẫn có thể đòi hỏi trạng thái ở phía server — không thể chỉ dựa vào việc "dùng JWT" mà kết luận hệ thống hoàn toàn không lưu trạng thái (stateless).

Header và Payload của JWT chỉ được mã hóa bằng Base64Url, bất kỳ ai lấy được token đều có thể giải mã ra xem, do đó tuyệt đối không đưa thông tin nhạy cảm như mật khẩu, số căn cước công dân vào Payload. Chữ ký dùng để kiểm chứng nội dung có bị sửa đổi trái phép hay không, chứ không đảm nhiệm việc mã hóa bảo mật nội dung.

Nếu client dùng JWT làm Bearer Token và đặt tường minh vào `Authorization` Header, trình duyệt sẽ không tự động gửi kèm như Cookie, nhờ vậy giảm được rủi ro CSRF truyền thống. Tuy nhiên, điều này phụ thuộc vào cách truyền tải và lưu trữ thông tin chứng thực, chứ không phải do bản thân định dạng JWT; nếu đặt JWT trong Cookie thì vẫn cần cơ chế chống CSRF.

Bài viết [Phân tích ưu nhược điểm của JWT](./advantages-and-disadvantages-of-jwt.md) giới thiệu chi tiết các ưu thế và hạn chế khi dùng JWT để xác thực danh tính.

Dưới đây là định nghĩa của [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519) về JWT:

> JSON Web Token (JWT) là một phương thức gọn nhẹ, an toàn với URL để biểu diễn các claim truyền tải giữa hai bên. Các claim trong JWT được mã hóa thành một đối tượng JSON, đóng vai trò là payload của cấu trúc JSON Web Signature (JWS) hoặc bản rõ của cấu trúc JSON Web Encryption (JWE), cho phép các claim được ký số hoặc bảo vệ tính toàn vẹn bằng Message Authentication Code (MAC) và/hoặc được mã hóa. ——[JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)

## JWT gồm những phần nào?

![Cấu trúc thành phần JWT](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/jwt/jwt-composition-3124d137.png)

Một JWT thường gồm 3 phần được mã hóa Base64Url và phân tách bằng dấu chấm `.`:

- **Header (Phần đầu):** Mô tả siêu dữ liệu (metadata) của JWT, bao gồm loại token và thuật toán ký. Header sau khi mã hóa Base64Url trở thành phần thứ nhất của JWT.
- **Payload (Phần tải):** Lưu trữ các tuyên bố (Claims) cần truyền tải, như `sub` (subject, chủ thể), `jti` (JWT ID). Payload sau khi mã hóa Base64Url trở thành phần thứ hai của JWT.
- **Signature (Chữ ký):** Được tính toán dựa trên Header đã mã hóa, Payload đã mã hóa, thuật toán ký và khóa ký. HS256 dùng khóa bí mật dùng chung (shared secret), còn các thuật toán bất đối xứng như RS256, ES256 dùng khóa riêng (private key) để ký và khóa công khai (public key) để xác minh.

JWT thường có dạng như sau: `xxxxx.yyyyy.zzzzz`.

Ví dụ:

```plain
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Bạn có thể giải mã JWT mẫu này trên [jwt.io](https://jwt.io/) để thấy 3 phần Header, Payload và Signature. Token thật trong môi trường production có thể chứa định danh người dùng và thông tin quyền hạn, tuyệt đối không sao chép dán vào các công cụ trực tuyến của bên thứ ba.

Header và Payload đều là dữ liệu JSON, còn Signature được tính từ Header đã mã hóa, Payload đã mã hóa và khóa ký.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/jwt/jwt.io-6e99ab9c.png)

### Phân tích (Parse) JWT và Xác minh (Verify) JWT khác nhau thế nào?

Phân tích (Parse) JWT chỉ giải mã Base64Url đối với Header và Payload, không cần khóa. Bất kỳ ai cầm token cũng đều giải mã được, nên kết quả giải mã không chứng minh được token đó đáng tin cậy.

Xác minh (Verify) JWT sẽ dùng thuật toán và khóa chỉ định để kiểm tra Signature, đồng thời kiểm tra các claim như `exp`, `nbf`, `iss`, `aud`. Chỉ khi chữ ký và toàn bộ các claim theo yêu cầu nghiệp vụ đều vượt qua kiểm tra thì server mới có thể tin tưởng thông tin danh tính và quyền hạn trong token.

### Header

Header thường bao gồm hai phần:

- `typ` (Type): Loại token, tức là JWT.
- `alg` (Algorithm): Thuật toán ký, ví dụ HS256.

Ví dụ:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

Header dạng JSON sau khi mã hóa Base64Url sẽ trở thành phần đầu tiên của JWT.

### Payload

Payload cũng là dữ liệu JSON, bên trong chứa các Claims (tuyên bố).

Claims được chia thành 3 loại:

- **Registered Claims (Claim đã đăng ký):** Một số claim được định nghĩa sẵn, khuyến nghị sử dụng nhưng không bắt buộc.
- **Public Claims (Claim công khai):** Các claim do bên cấp phát JWT tự định nghĩa, nhưng để tránh xung đột, nên định nghĩa chúng trong [IANA JSON Web Token Registry](https://www.iana.org/assignments/jwt/jwt.xhtml).
- **Private Claims (Claim riêng tư):** Các claim do bên cấp phát JWT tự định nghĩa theo nhu cầu dự án, phù hợp hơn với kịch bản thực tế của dự án.

Dưới đây là một số Registered Claims phổ biến:

- `iss` (issuer): Bên cấp phát JWT.
- `iat` (issued at time): Thời điểm cấp phát JWT.
- `sub` (subject): Chủ thể của JWT.
- `aud` (audience): Bên tiếp nhận JWT.
- `exp` (expiration time): Thời điểm hết hạn của JWT.
- `nbf` (not before time): Thời điểm bắt đầu có hiệu lực của JWT; JWT gửi tới trước thời điểm định nghĩa này sẽ không được chấp nhận xử lý.
- `jti` (JWT ID): Định danh duy nhất của JWT.

Ví dụ:

```json
{
  "uid": "ff1212f5-d8d1-4496-bf41-d2dda73de19a",
  "sub": "1234567890",
  "name": "John Doe",
  "exp": 15323232,
  "iat": 1516239022,
  "scope": ["admin", "user"]
}
```

Phần Payload mặc định không được mã hóa bảo mật, **tuyệt đối không lưu thông tin riêng tư vào trong Payload!!!**

Payload dạng JSON sau khi mã hóa Base64Url sẽ trở thành phần thứ hai của JWT.

### Signature

Phần Signature là chữ ký cho hai phần đầu, có tác dụng ngăn chặn JWT (chủ yếu là payload) bị chỉnh sửa trái phép.

Việc tạo chữ ký này cần dùng tới:

- Header + Payload.
- Khóa ký lưu ở phía server. Khi dùng thuật toán bất đối xứng, tuyệt đối không được để lộ private key dùng để ký.
- Thuật toán ký.

Công thức tính chữ ký như sau:

```plain
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret)
```

Sau khi tính xong chữ ký, ghép 3 phần Header, Payload và Signature thành một chuỗi, ngăn cách giữa mỗi phần bằng dấu chấm (`.`) — chuỗi đó chính là JWT.

## Xác thực danh tính dựa trên JWT như thế nào?

Trong ứng dụng sử dụng JWT để xác thực danh tính, server tạo JWT từ Payload, Header và khóa bí mật rồi gửi cho client. Client cần lưu trữ token một cách an toàn tùy theo mô hình ứng dụng và mô hình mối đe dọa (threat model), các request gửi đi sau đó sẽ đính kèm token này.

![Sơ đồ xác thực danh tính bằng JWT](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/jwt/jwt-authentication-process-c0784a69.png)

Các bước rút gọn như sau:

1. Người dùng gửi tên đăng nhập, mật khẩu và mã xác nhận lên server để đăng nhập hệ thống;
2. Nếu tên đăng nhập, mật khẩu và mã xác nhận hợp lệ, server trả về Token đã được ký, chính là JWT;
3. Client nhận được Token thì lưu trữ an toàn; ứng dụng trình duyệt có thể dùng BFF để giữ token ở phía server, hoặc tùy kịch bản mà dùng Cookie được bảo vệ;
4. Các lần sau mỗi khi gửi request lên backend, người dùng đều đính kèm JWT này trong Header;
5. Server kiểm tra JWT và trích xuất thông tin liên quan đến người dùng từ đó.

Hai khuyến nghị:

1. Đừng mặc định lưu JWT trong `localStorage` hoặc `sessionStorage`. Bất kỳ script độc hại nào chạy trên cùng nguồn (same-origin) đều có thể đọc Web Storage, chỉ một lỗ hổng XSS cũng có thể làm rò rỉ token. Khi dùng Cookie, cần thiết lập `HttpOnly`, `Secure` và thuộc tính `SameSite` phù hợp, đồng thời triển khai đầy đủ cơ chế chống CSRF.
2. Cách phổ biến để mang JWT khi không dùng Cookie là đặt nó trong trường `Authorization` của HTTP Header (`Authorization: Bearer Token`).

**[spring-security-jwt-guide](https://github.com/Snailclimb/spring-security-jwt-guide)** là một ví dụ đơn giản về xác thực danh tính dựa trên JWT, bạn nào quan tâm có thể tham khảo.

## Làm sao để ngăn JWT bị giả mạo / chỉnh sửa?

Khi đã có chữ ký được xác minh đúng cách, ngay cả khi JWT bị rò rỉ hoặc bị chặn bắt, kẻ tấn công cũng không thể sửa đổi Header hay Payload rồi tạo ra chữ ký hợp lệ nếu không biết khóa ký. Tuy nhiên chữ ký không mang lại tính bảo mật nội dung, cũng không ngăn được kẻ tấn công phát lại (replay) trực tiếp một JWT hợp lệ đã bị đánh cắp.

Tại sao vậy? Bởi vì sau khi server nhận được JWT, nó sẽ tách ra Header, Payload và Signature bên trong. Server dựa vào Header, Payload và khóa bí mật của mình để tính lại một Signature mới, rồi đem đối chiếu với Signature trong JWT; nếu giống nhau thì chứng tỏ Header và Payload chưa bị sửa đổi.

Tuy nhiên, nếu khóa bí mật trên server cũng bị rò rỉ, kẻ tấn công có thể chỉnh sửa Header và Payload rồi tự tạo lại một Signature hợp lệ.

Khóa ký bắt buộc phải được bảo quản cẩn mật, đồng thời thiết lập cơ chế xoay vòng (rotation) và thu hồi (revocation).

## Làm sao tăng cường độ bảo mật cho JWT?

1. Sử dụng các thư viện mã nguồn mở uy tín, không tự viết logic mã hóa/giải mã và xác minh JWT.
2. Phía server phải cố định tập hợp các thuật toán được phép sử dụng, tuyệt đối không tin thẳng vào trường `alg` trong JWT Header để chọn thuật toán xác minh; khóa HMAC phải có đủ độ ngẫu nhiên và độ dài.
3. Xác minh toàn bộ các claim liên quan đến ứng dụng hiện tại, bao gồm `iss`, `aud`, `exp` và `nbf`, đồng thời đặt ngưỡng giới hạn rõ ràng cho sai lệch đồng hồ (clock skew) cho phép.
4. Sử dụng trường `typ` tường minh và các quy tắc kiểm tra loại trừ lẫn nhau cho các JWT phục vụ mục đích khác nhau như ID Token, Access Token để ngăn loại token này bị đánh tráo sang ngữ cảnh khác.
5. Tuyệt đối không lưu thông tin riêng tư trong Payload chưa được mã hóa, cũng không được coi các Claim nhận được nhưng chưa xác minh chữ ký là dữ liệu đầu vào đáng tin cậy.
6. Chọn cách lưu trữ token an toàn phù hợp với từng loại client, giới hạn thời hạn hiệu lực, phạm vi quyền hạn và đối tượng nhận của token; các kịch bản rủi ro cao cần cân nhắc thêm thu hồi token, phát hiện tấn công phát lại (replay) hoặc ràng buộc người gửi (sender-constrained tokens).
7. Khóa bí mật phải được bảo quản an toàn và hỗ trợ xoay vòng khóa. Để xem đầy đủ hơn các yêu cầu bảo mật, có thể tham khảo [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html).
