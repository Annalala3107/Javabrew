---
title: Phân tích ưu nhược điểm của xác thực danh tính bằng JWT
description: Phân tích chuyên sâu ưu nhược điểm của xác thực bằng JWT, giải thích các vấn đề như JWT không thể chủ động hết hiệu lực, gia hạn Token cùng các giải pháp tương ứng.
category: Thiết kế Hệ thống
tag:
  - Bảo mật
head:
  - - meta
    - name: keywords
      content: JWT,Xác thực Token,Xác thực phi trạng thái,Nhược điểm JWT,Refresh Token,Đăng xuất hết hiệu lực,Rủi ro bảo mật,Giải pháp thay thế
lang: vi
sourceRef: zh-ref/system-design/security/advantages-and-disadvantages-of-jwt.md
---

Trong các buổi phỏng vấn tuyển dụng sinh viên mới ra trường, phần lớn ứng viên tôi gặp đều dùng JWT cho phần xác thực đăng nhập. Khi hỏi các câu lý thuyết về JWT và lý do dùng JWT, hầu như ai cũng trả lời được đôi chút; nhưng khi hỏi tới những vấn đề tồn tại của JWT và giải pháp khắc phục thì chỉ một số ít ứng viên trả lời ổn.

JWT không phải là viên đạn bạc (silver bullet), nó cũng có nhiều khiếm khuyết và trong rất nhiều trường hợp không phải là lựa chọn tối ưu. Trong bài viết này, chúng ta hãy cùng thảo luận về ưu nhược điểm của xác thực bằng JWT cùng cách giải quyết các vấn đề thường gặp, để xem tại sao nhiều người không còn khuyến khích dùng JWT nữa.

Để tìm hiểu các khái niệm cơ bản về JWT, mời xem bài viết tôi đã viết: [Giải thích chi tiết khái niệm cơ bản về JWT](https://javaguide.cn/system-design/security/jwt-intro.html).

## Ưu điểm của JWT

So với cách xác thực bằng Session, sử dụng JWT để xác thực danh tính có 4 ưu điểm chính sau đây.

### Phi trạng thái (Stateless)

Bản thân JWT đã chứa đầy đủ mọi thông tin cần thiết để xác thực danh tính, do đó server của chúng ta không cần lưu trữ thông tin JWT. Điều này hiển nhiên làm tăng tính sẵn sàng và khả năng mở rộng của hệ thống, đồng thời giảm đáng kể áp lực cho phía server.

Tuy nhiên, cũng chính sự phi trạng thái của JWT lại dẫn tới nhược điểm lớn nhất của nó: **khó kiểm soát!**

Chẳng hạn, nếu chúng ta muốn hủy bỏ một JWT khi nó vẫn còn trong thời hạn hiệu lực hoặc thay đổi quyền hạn của nó, sự thay đổi sẽ không có hiệu lực ngay mà thường phải đợi tới khi hết thời hạn hiệu lực. Hoặc ví dụ khi người dùng đăng xuất (Logout), JWT vẫn còn hiệu lực — trừ khi chúng ta bổ sung logic xử lý ở backend như lưu lại các JWT đã bị vô hiệu hóa để backend kiểm tra tính hợp lệ trước khi xử lý. Các giải pháp cụ thể sẽ được trình bày chi tiết ở phần sau, ở đây chỉ nhắc sơ qua.

### Dùng Authorization Header giúp giảm rủi ro CSRF truyền thống

**CSRF (Cross-Site Request Forgery)** thường được dịch là **Giả mạo yêu cầu liên trang**, thuộc phạm vi các cuộc tấn công an ninh mạng. So với các kiểu tấn công như SQL Injection hay XSS, độ nổi tiếng của CSRF không bằng chúng. Tuy nhiên, đây chắc chắn là lỗ hổng bảo mật mà chúng ta bắt buộc phải cân nhắc khi phát triển hệ thống. Ngay cả sản phẩm chuẩn mực trong ngành như Gmail của Google cũng từng lộ lỗ hổng CSRF vào năm 2007, gây thiệt hại lớn cho người dùng Gmail.

**Vậy rốt cuộc Giả mạo yêu cầu liên trang là gì?** Nói đơn giản chính là lợi dụng danh tính của bạn để làm một số việc xấu (gửi đi những request bất lợi cho bạn như chuyển khoản trái phép).

Lấy một ví dụ đơn giản: Tiểu Tráng đăng nhập vào một trang ngân hàng trực tuyến, cậu ta vào khu vực diễn đàn của trang đó, thấy dưới một bài viết có đường link ghi "Đầu tư tài chính khoa học, lãi suất năm vượt vạn", Tiểu Tráng tò mò bấm vào link này, kết quả phát hiện tài khoản của mình bị mất 10.000 tệ. Chuyện này xảy ra thế nào? Hóa ra hacker đã giấu sẵn một request trong đường link đó, request này lợi dụng trực tiếp danh tính của Tiểu Tráng gửi yêu cầu chuyển khoản tới ngân hàng — tức là gửi request tới ngân hàng thông qua Cookie của bạn.

```html
<a href="http://www.mybank.com/Transfer?bankId=11&money=10000"
  >Đầu tư tài chính khoa học, lãi suất năm vượt vạn</a
>
```

Tấn công CSRF truyền thống lợi dụng đặc tính trình duyệt tự động đính kèm thông tin chứng thực danh tính, phổ biến nhất là `SessionID` trong Cookie. Ngay cả khi kẻ tấn công không đọc được `SessionID`, chúng vẫn có thể dụ trình duyệt mang theo nó để gửi request tới trang web mục tiêu.

Ngoài ra, không nhất thiết phải bấm vào link mới bị tấn công; trong rất nhiều trường hợp, chỉ cần bạn mở một trang web nào đó lên là cuộc tấn công CSRF đã xảy ra rồi.

```html
<img src="http://www.mybank.com/Transfer?bankId=11&money=10000" />
```

**Vậy tại sao khi dùng JWT người ta thường nói rủi ro CSRF thấp hơn?**

Nếu client dùng JWT làm Bearer Token và đặt tường minh vào HTTP `Authorization` Header, trình duyệt sẽ không tự động đính kèm nó vào các request liên trang như Cookie, do đó có thể giảm thiểu loại rủi ro CSRF truyền thống này. Yếu tố phát huy tác dụng ở đây là phương thức truyền tải thông tin chứng thực, chứ không phải bản thân định dạng dữ liệu JWT.

Tuy nhiên, không thể vì thế mà mặc định lưu JWT vào `localStorage`. Bất kỳ script độc hại nào trong trang cùng nguồn (same-origin) đều có thể đọc Web Storage; chỉ một lỗ hổng XSS cũng có thể khiến access token hoặc refresh token bị đánh cắp trực tiếp. Ứng dụng trình duyệt cần chọn phương án phù hợp dựa trên mô hình mối đe dọa, ví dụ dùng Cookie có thiết lập `HttpOnly`, `Secure` và thuộc tính `SameSite` phù hợp, hoặc dùng Backend For Frontend (BFF) để giữ token ở phía server.

Nếu dùng Cookie để lưu thông tin chứng thực đăng nhập thì phải đồng thời làm tốt công tác phòng chống CSRF, chẳng hạn như CSRF Token, kiểm tra `Origin`/`Referer` và `SameSite` Cookie. `SameSite` thường chỉ nên đóng vai trò phòng thủ theo chiều sâu (defense-in-depth), không thể một mình thay thế hoàn toàn CSRF Token trong mọi mô hình triển khai.

Phòng chống XSS không thể dựa vào một bộ lọc chung chung kiểu "bộ lọc chuỗi khả nghi". Cách làm đáng tin cậy hơn là mã hóa đầu ra (output encoding) đúng theo từng ngữ cảnh khác nhau như HTML, thuộc tính (attribute), JavaScript, CSS, URL; nếu thực sự cho phép người dùng gửi HTML lên thì dùng thư viện lọc sạch HTML (HTML sanitization) uy tín được cập nhật liên tục; đồng thời cung cấp lớp phòng thủ chiều sâu qua các cơ chế như CSP.

### Phù hợp với ứng dụng di động

Nếu dùng Session để xác thực danh tính thì cần lưu một bản thông tin ở phía server, hơn nữa cách này phụ thuộc vào Cookie (cần Cookie lưu `SessionId`), nên không phù hợp với ứng dụng di động (Mobile).

Nhưng sử dụng JWT để xác thực danh tính sẽ không gặp vấn đề này, bởi chỉ cần JWT có thể được client lưu trữ là dùng được, ngoài ra JWT còn có thể sử dụng xuyên ngôn ngữ lập trình.

> Tại sao dùng Session để xác thực danh tính lại không phù hợp với ứng dụng di động?
>
> 1. Quản lý trạng thái: Session dựa trên quản lý trạng thái phía server, trong khi ứng dụng di động thường mang tính phi trạng thái. Kết nối của thiết bị di động có thể không ổn định hoặc bị gián đoạn, do đó khó duy trì trạng thái phiên lâu dài. Nếu dùng Session xác thực, ứng dụng di động phải liên tục duy trì phiên với server, làm tăng chi phí mạng và độ phức tạp;
> 2. Tính tương thích: Ứng dụng di động thường hướng tới nhiều nền tảng như iOS, Android và Web. Mỗi nền tảng có thể quản lý và lưu trữ Session theo cách khác nhau, dễ phát sinh vấn đề tương thích đa nền tảng;
> 3. Tính bảo mật: Thiết bị di động thường nằm trong môi trường mạng không đáng tin cậy, tiềm ẩn nguy cơ rò rỉ dữ liệu và bị tấn công. Lưu thông tin phiên nhạy cảm trên thiết bị di động làm tăng rủi ro bị tấn công.

### Thân thiện với Đăng nhập một lần (SSO)

Nếu dùng Session để xác thực danh tính, khi triển khai Đăng nhập một lần (SSO) ta phải lưu thông tin Session của người dùng trên một máy chủ tập trung, và còn gặp vấn đề Cookie xuyên miền (cross-domain) thường thấy. Nhưng khi dùng JWT để xác thực, JWT được lưu ở phía client nên không tồn tại những vấn đề này.

## Các vấn đề thường gặp và giải pháp khi xác thực bằng JWT

### JWT vẫn còn hiệu lực sau khi đăng xuất và các tình huống tương tự

Các tình huống cụ thể tương tự bao gồm:

- Đăng xuất (Logout);
- Đổi mật khẩu;
- Server thay đổi quyền hạn hoặc vai trò của một người dùng;
- Tài khoản người dùng bị khóa / xóa;
- Người dùng bị server buộc đăng xuất;
- Người dùng bị kích khỏi phiên trực tuyến;
- ……

Vấn đề này không tồn tại trong mô hình xác thực Session, vì với Session, gặp các tình huống trên phía server chỉ cần xóa bản ghi Session tương ứng là xong. Nhưng với cách xác thực bằng JWT thì lại khó giải quyết hơn. Như chúng ta đã nói, một khi JWT được cấp phát ra, nếu backend không bổ sung logic khác thì nó sẽ vẫn có hiệu lực cho tới khi hết hạn.

Vậy làm thế nào để giải quyết vấn đề này? Sau khi tra cứu nhiều tài liệu, tôi tổng hợp ngắn gọn 4 phương án dưới đây:

**1. Lưu JWT vào cơ sở dữ liệu**

Lưu các JWT đang có hiệu lực vào cơ sở dữ liệu, khuyến nghị dùng cơ sở dữ liệu trong bộ nhớ (in-memory database) như Redis. Khi cần vô hiệu hóa một JWT nào đó thì xóa thẳng JWT đó khỏi Redis là được. Tuy nhiên, làm vậy sẽ khiến mỗi lần dùng JWT đều phải trải qua bước truy vấn Redis xem JWT có tồn tại hay không, đồng thời đi ngược lại nguyên tắc phi trạng thái của JWT.

**2. Cơ chế danh sách đen (Blacklist)**

Tương tự cách trên, dùng cơ sở dữ liệu trong bộ nhớ như Redis để duy trì một danh sách đen (Blacklist); nếu muốn vô hiệu hóa một JWT nào đó thì đưa thẳng JWT này vào **Blacklist**. Sau đó mỗi lần gửi request dùng JWT đều phải kiểm tra xem JWT này có nằm trong Blacklist hay không.

Điểm cốt lõi của hai phương án đầu là lưu trữ các JWT đang hợp lệ hoặc đưa các JWT chỉ định vào danh sách đen.

Mặc dù cả hai phương án này đều đi ngược lại nguyên tắc phi trạng thái của JWT, nhưng trong các dự án thực tế chúng ta thường vẫn phải sử dụng một trong hai phương án này.

**3. Thay đổi khóa bí mật (`Secret`)**

Chúng ta tạo một khóa bí mật riêng cho mỗi người dùng; nếu muốn vô hiệu hóa JWT nào đó thì chỉ cần sửa đổi khóa bí mật của người dùng tương ứng. Tuy nhiên, so với việc đưa thêm in-memory database ở hai cách đầu thì cách này mang lại tác hại lớn hơn:

- Nếu dịch vụ chạy phân tán, mỗi lần phát hành JWT mới đều phải đồng bộ khóa bí mật giữa nhiều máy chủ. Để làm được điều đó, bạn cần lưu khóa bí mật vào cơ sở dữ liệu hoặc dịch vụ bên ngoài khác — như vậy chẳng khác gì mấy so với xác thực bằng Session.
- Nếu người dùng mở hệ thống đồng thời trên hai trình duyệt, hoặc mở thêm trên điện thoại, khi họ đăng xuất tài khoản ở một nơi thì các nơi khác cũng bị buộc đăng nhập lại — điều này là không thể chấp nhận được.

**4. Giữ thời hạn hiệu lực của token ngắn và xoay vòng thường xuyên**

Một cách rất đơn giản. Tuy nhiên, nó khiến trạng thái đăng nhập của người dùng không duy trì được lâu và buộc người dùng phải đăng nhập lại thường xuyên.

Ngoài ra, việc xử lý vấn đề JWT vẫn còn hiệu lực sau khi đổi mật khẩu lại khá dễ dàng. Xin chia sẻ một cách mà tôi thấy khá hay: **Dùng giá trị băm (hash) của mật khẩu người dùng để ký JWT. Nhờ vậy, nếu mật khẩu thay đổi, mọi token được cấp trước đó sẽ tự động không thể xác minh được nữa.**

### Vấn đề gia hạn JWT (Token Renewal)

Thời hạn hiệu lực của JWT thường được khuyến nghị đặt không quá dài. Vậy sau khi JWT hết hạn thì xác thực thế nào, làm sao làm mới (refresh) JWT một cách linh hoạt để tránh người dùng phải đăng nhập lại liên tục?

Trước tiên hãy xem cách làm phổ biến trong xác thực Session: **Giả sử Session có thời hạn 30 phút, nếu trong 30 phút đó người dùng có truy cập thì kéo dài thời hạn Session thêm 30 phút nữa.**

Còn với xác thực JWT, chúng ta nên giải quyết bài toán gia hạn như thế nào? Sau khi tham khảo nhiều tài liệu, tôi tóm tắt 4 phương án dưới đây:

**1. Cách làm tương tự xác thực Session (Không khuyến nghị)**

Phương án này đáp ứng được phần lớn kịch bản. Giả sử thời hạn JWT do server cấp là 30 phút; mỗi lần server kiểm tra xác thực, nếu phát hiện JWT sắp hết hạn thì server tạo lại JWT mới trả cho client. Client sau mỗi request kiểm tra JWT mới và cũ, nếu không khớp thì cập nhật lại JWT ở local. Vấn đề của cách làm này là chỉ những request gửi lúc sắp hết hạn mới cập nhật JWT, không thân thiện lắm với phía client.

**2. Trả về JWT mới ở mọi request (Không khuyến nghị)**

Ý tưởng phương án này rất đơn giản, nhưng chi phí hệ thống sẽ khá lớn, đặc biệt trong trường hợp server phải lưu trữ và quản lý JWT.

**3. Đặt thời hạn JWT tới nửa đêm (Không khuyến nghị)**

Phương án này mang tính thỏa hiệp, đảm bảo phần lớn người dùng đăng nhập bình thường trong ban ngày, chỉ phù hợp với các hệ thống không có yêu cầu cao về bảo mật.

**4. Dùng Access Token ngắn hạn và Refresh Token dài hạn (Khuyến nghị)**

Thứ nhất là access token ngắn hạn, ví dụ hết hạn sau nửa tiếng; thứ hai là refresh token có vòng đời dài hơn, chỉ dùng để xin cấp access token mới. Cả hai không nhất thiết đều phải dùng định dạng JWT. Refresh token có quyền hạn cao và tồn tại lâu, là mục tiêu đánh cắp hàng đầu của kẻ tấn công — tuyệt đối không được cho rằng nó ít được sử dụng nên "khó bị rò rỉ".

Sau khi client đăng nhập, mỗi lần truy cập đều mang theo access token. Khi access token hết hạn, client dùng refresh token được bảo vệ để đổi lấy access token mới. Ứng dụng trình duyệt không nên mặc định lưu refresh token vào `localStorage`; có thể thông qua BFF hoặc Cookie được bảo vệ để giảm nguy cơ script đọc trực tiếp token.

Nhược điểm của phương án này là:

- Cần có sự phối hợp xử lý từ phía client;
- Khi người dùng đăng xuất, đổi mật khẩu hoặc xảy ra sự cố bảo mật khác, cần thu hồi quyền làm mới (refresh grant) tương ứng;
- Trong quá trình gọi xin cấp lại JWT mới có thể xảy ra khoảng thời gian ngắn JWT không khả dụng (có thể khắc phục bằng cách đặt timer ở client để chủ động dùng `refreshJWT` lấy `accessJWT` mới trước khi `accessJWT` kịp hết hạn);
- Đối với public client, authorization server cần sử dụng cơ chế xoay vòng refresh token (refresh token rotation) và phát hiện phát lại token cũ, hoặc dùng refresh token ràng buộc người gửi (sender-constrained refresh tokens). Refresh token cũng nên được gắn chặt với client, phạm vi cấp quyền (scope) và resource server, đồng thời thiết lập thời gian hết hạn khi không hoạt động (idle expiration).

### Kích thước JWT quá lớn

JWT có cấu trúc phức tạp (Header, Payload và Signature), chứa nhiều thông tin bổ sung và phải mã hóa Base64Url, khiến kích thước JWT khá lớn và làm tăng chi phí truyền tải qua mạng.

Cấu trúc thành phần JWT:

![Cấu trúc thành phần JWT](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/jwt/jwt-composition-3124d137.png)

Ví dụ JWT:

```plain
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Cách khắc phục:

- Giảm tối đa lượng thông tin trong JWT Payload, chỉ giữ lại các thông tin người dùng và quyền hạn thực sự cần thiết.
- Trước khi truyền tải JWT, dùng thuật toán nén (như GZIP) để nén JWT nhằm giảm kích thước.
- Trong một số trường hợp, sử dụng Token truyền thống có thể phù hợp hơn. Token truyền thống thường chỉ là một mã định danh duy nhất, còn thông tin tương ứng (ví dụ user ID, thời gian hết hạn Token, thông tin quyền hạn) được lưu ở phía server, thường thông qua Redis.

## Tổng kết

Một trong những ưu điểm rất quan trọng của JWT là tính phi trạng thái, nhưng thực tế khi muốn sử dụng JWT hợp lý cho xác thực đăng nhập trong dự án thực tế, chúng ta vẫn phải lưu trữ thông tin JWT ở phía server.

JWT cũng không phải là viên đạn bạc và có rất nhiều nhược điểm; việc chọn JWT hay phương án Session vẫn cần căn cứ vào nhu cầu cụ thể của dự án. Tuyệt đối không nên tung hô JWT một cách mù quáng mà xem nhẹ các giải pháp xác thực danh tính khác.

Ngoài ra, không dùng JWT mà dùng thẳng Token thông thường (ID sinh ngẫu nhiên, không chứa thông tin cụ thể) kết hợp với Redis để xác thực danh tính cũng hoàn toàn ổn.

## Tham khảo

- RFC 9700 - Best Current Practice for OAuth 2.0 Security: <https://www.rfc-editor.org/rfc/rfc9700.html>
- OWASP Session Management Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html>
- OWASP Cross Site Scripting Prevention Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html>
- Phân tích siêu chi tiết về JWT: <https://learnku.com/articles/17883>
- How to log out when using JWT: <https://medium.com/devgorilla/how-to-log-out-when-using-jwt-a8c7823e8a6>
- CSRF protection with JSON Web JWTs: <https://medium.com/@agungsantoso/csrf-protection-with-json-web-JWTs-83e0f2fcbcc>
- Invalidating JSON Web JWTs: <https://stackoverflow.com/questions/21978658/invalidating-json-web-JWTs>
