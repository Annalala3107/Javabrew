---
title: Giải thích chi tiết khái niệm cơ bản về Xác thực và Phân quyền
description: Giải thích chi tiết kiến thức nền tảng về Xác thực và Phân quyền, trình bày sự khác biệt giữa Authentication và Authorization, Session, Token, OAuth2 và các khái niệm cốt lõi.
category: Thiết kế Hệ thống
tag:
  - Bảo mật
head:
  - - meta
    - name: keywords
      content: Xác thực,Phân quyền,Authentication,Authorization,Session,Token,OAuth2,Kiểm soát truy cập,Nền tảng bảo mật
lang: vi
sourceRef: zh-ref/system-design/security/basis-of-authority-certification.md
---

## Xác thực (Authentication) và Phân quyền (Authorization) khác nhau thế nào?

Đây là câu hỏi khiến phần lớn mọi người bị nhầm lẫn. Trước hết, hãy làm quen với hai thuật ngữ này từ cách phát âm — rất nhiều người đọc nhầm lẫn cả hai từ, nên tôi khuyên bạn trước tiên hãy tra thử cách đọc chuẩn và ý nghĩa cụ thể của hai từ này.

Nói đơn giản thì là:

- **Xác thực (Authentication):** Bạn là ai.
- **Phân quyền (Authorization):** Bạn có quyền làm gì.

Diễn giải trang trọng hơn (và dài dòng hơn) một chút thì là:

- **Authentication (Xác thực)** là quá trình kiểm chứng thông tin xác nhận danh tính của bạn (chẳng hạn tên đăng nhập / user ID và mật khẩu). Thông qua thông tin này, hệ thống biết được bạn đúng là bạn, tức là tài khoản người dùng của bạn có tồn tại trong hệ thống. Vì vậy, Authentication được gọi là xác minh danh tính/người dùng.
- **Authorization (Phân quyền)** diễn ra sau **Authentication (Xác thực)**. Nghe tên gọi là mọi người có thể hiểu ngay: nó chủ yếu quản lý quyền truy cập vào hệ thống của chúng ta. Ví dụ, một số tài nguyên đặc thù chỉ người có quyền cụ thể mới được truy cập như admin; một số thao tác trên tài nguyên hệ thống như xóa, thêm, sửa chỉ những người được cấp quyền mới được phép thực hiện.

Xác thực:

![Đăng nhập xác thực](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/authentication-login-1a978b9a.png)

Phân quyền:

![Không có quyền](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/20210604161032412-3993c04a.png)

Hai cơ chế này thường được kết hợp cùng nhau trong hệ thống với mục đích bảo vệ an toàn cho hệ thống.

## Bạn có biết mô hình RBAC không?

Mô hình kiểm soát truy cập được sử dụng phổ biến nhất trong quản lý phân quyền hệ thống chính là **mô hình RBAC**.

**RBAC là gì?** RBAC là viết tắt của Role-Based Access Control (Kiểm soát truy cập dựa trên vai trò). Đây là phương thức phân quyền thông qua việc gắn quyền hạn với vai trò (Role), đồng thời gắn vai trò với người dùng (User).

Nói đơn giản: một người dùng có thể sở hữu nhiều vai trò, mỗi vai trò lại có thể được cấp nhiều quyền hạn, từ đó tạo nên mô hình phân quyền "Người dùng - Vai trò - Quyền hạn". Trong mô hình này, giữa người dùng với vai trò và giữa vai trò với quyền hạn đều tạo thành quan hệ nhiều-nhiều (many-to-many).

![Sơ đồ mô hình phân quyền RBAC](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/rbac-a304d5af.png)

Trong mô hình phân quyền RBAC, quyền hạn được liên kết với vai trò, người dùng nhận được các quyền của vai trò đó bằng cách trở thành thành viên mang vai trò cụ thể — điều này giúp đơn giản hóa việc quản lý phân quyền đi rất nhiều.

Để triển khai mô hình phân quyền RBAC, thiết kế bảng cơ sở dữ liệu phổ biến như sau (tổng cộng 5 bảng, trong đó có 2 bảng trung gian dùng để thiết lập liên kết giữa các bảng):

![](/media/jg/ext/oss.javaguide.cn/2020-11/.png-428a13df.png)

Thông qua mô hình phân quyền này, chúng ta có thể tạo các vai trò khác nhau và gán phạm vi quyền hạn (menu) khác nhau cho từng vai trò.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/books-af3d2a88.png)

Thông thường, nếu hệ thống có yêu cầu khá chặt chẽ về kiểm soát quyền hạn, hầu như đều sẽ lựa chọn mô hình RBAC để thực hiện phân quyền.

## Cookie là gì? Cookie có tác dụng gì?

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/cookie-sessionId-592d0e39.png)

`Cookie` và `Session` đều là phương thức quản lý phiên dùng để theo dõi danh tính người dùng trên trình duyệt, nhưng kịch bản áp dụng của cả hai có phần khác nhau.

Wikipedia định nghĩa `Cookie` như sau:

> `Cookie` là dữ liệu (thường được mã hóa) mà một số trang web lưu trữ trên thiết bị đầu cuối cục bộ của người dùng nhằm nhận diện danh tính người dùng.

Nói đơn giản: **`Cookie` được lưu ở phía client, thường dùng để lưu thông tin người dùng.**

Dưới đây là một số trường hợp ứng dụng của `Cookie`:

1. Chúng ta lưu thông tin người dùng đã đăng nhập vào `Cookie`, lần sau truy cập trang web có thể tự động điền sẵn một số thông tin đăng nhập cơ bản giúp bạn. Ngoài ra, `Cookie` còn có thể lưu tùy chọn cá nhân, giao diện (theme) và các thiết lập khác của người dùng.
2. Dùng `Cookie` để lưu `SessionId` hoặc `Token`, khi gửi request lên backend sẽ đính kèm `Cookie` này, nhờ đó backend lấy được `Session` hoặc `Token`. Như vậy có thể ghi nhận trạng thái hiện tại của người dùng vì giao thức HTTP là phi trạng thái (stateless).
3. `Cookie` còn dùng để ghi nhận và phân tích hành vi người dùng. Lấy ví dụ đơn giản: khi bạn mua sắm trực tuyến, vì giao thức HTTP không lưu trạng thái, nếu server muốn biết bạn đã dừng lại ở trang nào hoặc đã xem những sản phẩm nào, một cách làm phổ biến là lưu các thông tin đó vào `Cookie`.
4. ……

## Sử dụng Cookie trong dự án như thế nào?

Ở đây tôi lấy dự án Spring Boot làm ví dụ.

**1) Thiết lập `Cookie` và trả về cho client**

```java
@GetMapping("/change-username")
public String setCookie(HttpServletResponse response) {
    // Tạo một cookie
    Cookie cookie = new Cookie("username", "Jovan");
    // Thiết lập thời gian hết hạn cho cookie
    cookie.setMaxAge(7 * 24 * 60 * 60); // expires in 7 days
    // Thêm vào response
    response.addCookie(cookie);

    return "Username is changed!";
}
```

**2) Dùng annotation `@CookieValue` do Spring framework cung cấp để lấy giá trị của một cookie cụ thể**

```java
@GetMapping("/")
public String readCookie(@CookieValue(value = "username", defaultValue = "Atta") String username) {
    return "Hey! My username is " + username;
}
```

**3) Đọc toàn bộ các giá trị `Cookie`**

```java
@GetMapping("/all-cookies")
public String readAllCookies(HttpServletRequest request) {

    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
        return Arrays.stream(cookies)
                .map(c -> c.getName() + "=" + c.getValue()).collect(Collectors.joining(", "));
    }

    return "No cookies";
}
```

Để biết thêm chi tiết về cách dùng `Cookie` trong Spring Boot, bạn có thể xem bài viết này: [How to use cookies in Spring Boot](https://attacomsian.com/blog/cookies-spring-boot).

## Cookie và Session khác nhau thế nào?

**Tác dụng chính của `Session` là ghi nhận trạng thái của người dùng ở phía server.** Kịch bản điển hình là giỏ hàng: khi bạn muốn thêm sản phẩm vào giỏ hàng, hệ thống không biết người dùng nào đang thao tác vì giao thức HTTP là phi trạng thái. Sau khi server tạo một `Session` riêng cho người dùng cụ thể, hệ thống có thể định danh và theo dõi người dùng đó.

Dữ liệu `Cookie` lưu ở phía client (trình duyệt), còn dữ liệu `Session` lưu ở phía server. Xét tương đối thì `Session` có độ an toàn cao hơn. Nếu sử dụng `Cookie`, không nên ghi thông tin nhạy cảm vào `Cookie`; tốt nhất nên mã hóa thông tin `Cookie` rồi khi dùng mới giải mã ở phía server.

**Vậy sử dụng `Session` để xác thực danh tính như thế nào?**

## Xác thực danh tính bằng mô hình Session-Cookie hoạt động ra sao?

Phần lớn trường hợp chúng ta đều thông qua `SessionID` để định danh người dùng cụ thể, `SessionID` thường được lựa chọn lưu trong Redis. Ví dụ:

1. Người dùng đăng nhập hệ thống thành công, server trả về cho client một `Cookie` chứa `SessionID`.
2. Khi người dùng gửi request lên backend sẽ mang theo `SessionID`, nhờ đó backend biết được trạng thái danh tính của bạn.

Quy trình chi tiết hơn của cách xác thực này như sau:

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/session-cookie-authentication-process-bd689be9.png)

1. Người dùng gửi tên đăng nhập, mật khẩu, mã xác nhận lên server để đăng nhập hệ thống.
2. Sau khi xác minh thành công, server sẽ tạo một đối tượng Session dành riêng cho người dùng này (có thể hiểu là một vùng bộ nhớ trên server lưu dữ liệu trạng thái của người dùng đó, như giỏ hàng, thông tin đăng nhập...), lưu trữ lại và cấp cho Session này một `SessionID` duy nhất.
3. Server thông qua chỉ thị `Set-Cookie` trong HTTP response header gửi `SessionID` này tới trình duyệt của người dùng.
4. Trình duyệt sau khi nhận được `SessionID` sẽ lưu nó cục bộ dưới dạng Cookie. Khi người dùng vẫn ở trạng thái đăng nhập, mỗi lần gửi request tới server đó, trình duyệt đều tự động đính kèm Cookie chứa `SessionID` này.
5. Server nhận được request, lấy `SessionID` từ trong Cookie ra là có thể tìm thấy đối tượng Session đã lưu trước đó, từ đó biết được đây là người dùng nào và trạng thái trước đó của họ ra sao.

Khi sử dụng Session cần lưu ý một số điểm sau:

- **Hỗ trợ Cookie từ phía client:** Các tính năng cốt lõi phụ thuộc vào Session cần đảm bảo trình duyệt người dùng đã bật Cookie.
- **Quản lý hết hạn Session:** Thiết lập thời gian hết hạn Session hợp lý để cân bằng giữa tính bảo mật và trải nghiệm người dùng.
- **Bảo mật Session ID:** Thiết lập cờ `HttpOnly` cho Cookie chứa `SessionID` giúp ngăn chặn script phía client (như JavaScript) đánh cắp; thiết lập cờ `Secure` đảm bảo `SessionID` chỉ được truyền qua kết nối HTTPS, tăng cường bảo mật.

Ngoài ra, Spring Session cung cấp cơ chế quản lý thông tin phiên người dùng xuyên suốt nhiều ứng dụng hoặc nhiều instance. Nếu muốn tìm hiểu kỹ hơn, bạn có thể xem mấy bài viết rất hay dưới đây:

- [Getting Started with Spring Session](https://codeboje.de/spring-Session-tutorial/)
- [Guide to Spring Session](https://www.baeldung.com/spring-Session)
- [Sticky Sessions with Spring Session & Redis](https://medium.com/@gvnix/sticky-Sessions-with-spring-Session-redis-bdc6f7438cc3)

## Triển khai mô hình Session-Cookie trên hệ thống nhiều node server như thế nào?

Mô hình Session-Cookie là một phương án xác thực rất tốt trong môi trường đơn thể (monolithic). Tuy nhiên, khi server mở rộng theo chiều ngang thành nhiều node, mô hình Session-Cookie sẽ phải đối mặt với thách thức.

Ví dụ: giả sử chúng ta triển khai hai bản sao giống hệt nhau của dịch vụ là A và B. Lần đầu người dùng đăng nhập, Nginx qua cơ chế cân bằng tải (Load Balancing) chuyển request tới server A, lúc này thông tin Session của người dùng được lưu trên server A. Kết quả là ở lần truy cập thứ hai, Nginx định tuyến request sang server B; do server B không lưu thông tin Session của người dùng nên người dùng buộc phải đăng nhập lại.

**Chúng ta nên tránh tình huống trên xảy ra như thế nào?**

Có một số phương án để các bạn tham khảo:

1. Toàn bộ request của một người dùng được phân phối cố định về cùng một server thông qua một chiến lược băm (hash) đặc thù. Khi đó mỗi server lưu một phần thông tin Session của người dùng. Tuy nhiên nếu một server bị sập, toàn bộ thông tin Session lưu trên nó sẽ mất sạch.
2. Thông tin Session lưu trên mỗi server đều được đồng bộ lẫn nhau, tức là mỗi server lưu toàn bộ thông tin Session của hệ thống. Cứ mỗi khi thông tin Session ở một server thay đổi, ta đồng bộ nó sang các server khác. Cách này chi phí quá lớn, hơn nữa số node càng nhiều thì chi phí đồng bộ càng cao.
3. Dùng riêng một node dữ liệu mà tất cả các server đều truy cập được (chẳng hạn như cache) để lưu thông tin Session. Để đảm bảo tính sẵn sàng cao (High Availability), cần tránh để node dữ liệu này trở thành điểm lỗi đơn (SPOF).
4. Spring Session là một dự án chuyên quản lý session giữa nhiều server. Nó có thể tích hợp với nhiều kho lưu trữ backend (như Redis, MongoDB...) để triển khai quản lý session phân tán. Thông qua Spring Session, dữ liệu session được lưu vào kho lưu trữ chia sẻ bên ngoài nhằm đồng bộ và dùng chung session giữa các server.

## Nếu không có Cookie thì Session còn dùng được không?

Đây là một câu hỏi phỏng vấn kinh điển!

Thông thường người ta dùng `Cookie` để lưu `SessionID`. Nếu bạn dùng phương án lưu `SessionID` trong `Cookie` mà phía client lại tắt `Cookie`, thì `Session` sẽ không thể hoạt động bình thường.

Tuy nhiên, Session phía server không đồng nghĩa với việc bắt buộc phải dùng Cookie. Các client không phải trình duyệt có thể mang thông tin chứng thực phiên qua một request header được quy ước rõ ràng. Dẫu vậy, đừng đưa `SessionID` vào URL: dù có mã hóa nó, nó vẫn là chứng thực danh tính dùng trực tiếp được và có khả năng bị rò rỉ vào lịch sử trình duyệt, access log, hệ thống giám sát và header `Referer`. Viết lại URL (URL rewriting) chỉ phù hợp với các kịch bản cũ bắt buộc phải tương thích ngược, không nên dùng làm giải pháp đăng nhập cho hệ thống mới.

## Tại sao xác thực dựa trên Cookie cần quan tâm nhiều hơn tới CSRF?

**CSRF (Cross-Site Request Forgery)** thường được dịch là **Giả mạo yêu cầu liên trang**. Vậy **Giả mạo yêu cầu liên trang** là gì? Nói đơn giản là lợi dụng danh tính của bạn để gửi đi một số request bất lợi cho bạn. Lấy một ví dụ dễ hiểu:

Tiểu Tráng đăng nhập vào một trang ngân hàng trực tuyến, cậu ta vào khu vực diễn đàn của trang đó, thấy dưới một bài viết có đường link ghi "Đầu tư tài chính khoa học, lãi suất năm vượt vạn", Tiểu Tráng tò mò bấm vào link này, kết quả phát hiện tài khoản của mình bị mất 10.000 tệ. Chuyện này xảy ra thế nào? Hóa ra hacker đã giấu sẵn một request trong đường link đó, request này lợi dụng trực tiếp danh tính của Tiểu Tráng gửi yêu cầu chuyển khoản tới ngân hàng — tức là gửi request tới ngân hàng thông qua Cookie của bạn.

```html
<a href="http://www.mybank.com/Transfer?bankId=11&money=10000"
  >Đầu tư tài chính khoa học, lãi suất năm vượt vạn</a
>
```

Như đã đề cập ở trên, khi xác thực bằng `Session`, chúng ta thường dùng `Cookie` để lưu `SessionId`. Sau khi đăng nhập, trình duyệt sẽ tự động đính kèm nó vào các request thuộc phạm vi (scope) của Cookie, server dựa vào `SessionId` để nhận diện người dùng. Nếu kẻ tấn công đánh cắp trực tiếp `SessionId`, hậu quả gây ra là chiếm đoạt phiên (Session Hijacking); còn CSRF thường không đòi hỏi kẻ tấn công phải đọc được Cookie, mà lợi dụng đặc tính trình duyệt tự động gửi kèm Cookie.

Trong xác thực `Session`, `SessionId` nằm trong `Cookie` được trình duyệt tự động gửi lên server. Nhờ đặc tính này, kẻ tấn công có thể lừa người dùng bấm nhầm vào link độc hại để đạt được mục đích tấn công.

Nếu client dùng Token làm Bearer Token và đặt tường minh vào `Authorization` Header, trình duyệt sẽ không tự động đính kèm nó vào các request liên trang như Cookie, do đó có thể giảm thiểu rủi ro CSRF truyền thống. Yếu tố phát huy tác dụng ở đây là cách thức mang thông tin chứng thực, chứ không phải bản thân định dạng Token hay JWT.

Đừng vì thế mà mặc định lưu Token vào `localStorage` hay `sessionStorage`. Các đoạn script độc hại trên cùng nguồn (same-origin) có thể đọc Web Storage, chỉ một lỗ hổng XSS cũng có thể làm rò rỉ trực tiếp Token. Ứng dụng trình duyệt tùy kịch bản có thể chọn mô hình Backend For Frontend (BFF), hoặc dùng Cookie có thiết lập `HttpOnly`, `Secure` và thuộc tính `SameSite` phù hợp; khi dùng Cookie vẫn nên kết hợp các cơ chế như CSRF Token, kiểm tra `Origin`/`Referer`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/20210615161108272-89a6db5a.png)

Cần lưu ý rằng: bất kể là `Cookie` hay `Token`, bản thân cơ chế xác thực đều không thể ngăn chặn **tấn công Cross-Site Scripting (XSS)**. `HttpOnly` giúp giảm rủi ro script đọc trực tiếp Cookie, nhưng XSS vẫn có thể gửi request dưới danh nghĩa người dùng, do đó cần kết hợp phòng thủ nhiều lớp như encode đầu ra đúng ngữ cảnh, lọc sạch HTML (HTML sanitization) khi cần và CSP.

> Cross-Site Scripting có chữ viết tắt là CSS nhưng dễ bị nhầm với Cascading Style Sheets (CSS). Vì vậy người ta viết tắt Cross-Site Scripting thành XSS.

Trong tấn công XSS, kẻ tấn công sẽ dùng nhiều cách để chèn mã độc vào trang của người dùng khác, từ đó có thể thông qua script đánh cắp thông tin như `Cookie`.

Bài đọc đề xuất: [Làm thế nào để phòng chống tấn công CSRF? — Đội ngũ kỹ thuật Meituan](https://tech.meituan.com/2018/10/11/fe-security-csrf.html)

Thực hành bảo mật còn có thể tham khảo:

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

## JWT là gì? JWT gồm những phần nào?

[Giải thích chi tiết khái niệm cơ bản về JWT](./jwt-intro.md)

## Xác thực danh tính dựa trên JWT như thế nào? Chống giả mạo JWT ra sao?

[Giải thích chi tiết khái niệm cơ bản về JWT](./jwt-intro.md)

## SSO là gì?

SSO (Single Sign-On) tức đăng nhập một lần, nghĩa là người dùng chỉ cần đăng nhập vào một trong nhiều hệ thống con thì sẽ có quyền truy cập vào các hệ thống liên quan khác. Ví dụ, sau khi đăng nhập vào JD Finance, chúng ta cũng đồng thời đăng nhập thành công vào các hệ thống con khác của JD như JD Supermarket, JD Worldwide, JD Fresh...

![Sơ đồ SSO](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/sso-33288e6d.png)

## SSO có những lợi ích gì?

- **Góc độ người dùng:** Người dùng chỉ cần đăng nhập một lần và sử dụng nhiều nơi, không cần ghi nhớ nhiều bộ tên đăng nhập và mật khẩu, rất nhẹ đầu.
- **Góc độ quản trị viên hệ thống:** Quản trị viên chỉ cần duy trì một trung tâm tài khoản thống nhất là được, rất tiện lợi.
- **Góc độ phát triển hệ thống mới:** Khi phát triển hệ thống mới chỉ cần kết nối trực tiếp với trung tâm tài khoản thống nhất, đơn giản hóa quy trình phát triển và tiết kiệm thời gian.

## Thiết kế và triển khai một hệ thống SSO như thế nào?

[Giải thích chi tiết đăng nhập một lần SSO](./sso-intro.md)

## OAuth 2.0 là gì?

OAuth là một giao thức ủy quyền tiêu chuẩn ngành, chủ yếu dùng để cấp cho ứng dụng bên thứ ba một phạm vi quyền hạn giới hạn. Còn OAuth 2.0 là bản thiết kế lại hoàn toàn so với OAuth 1.0 — nhanh hơn, dễ triển khai hơn, và OAuth 1.0 đã bị loại bỏ. Chi tiết xem tại: [rfc6749](https://tools.ietf.org/html/rfc6749).

Thực chất đây là một cơ chế ủy quyền, mục đích cuối cùng của nó là cấp cho ứng dụng bên thứ ba một Token có thời hạn hiệu lực, giúp ứng dụng bên thứ ba có thể thông qua Token đó để truy cập các tài nguyên liên quan.

Kịch bản phổ biến của OAuth 2.0 chính là đăng nhập qua bên thứ ba; khi trang web của bạn tích hợp đăng nhập bằng tài khoản bên thứ ba thì thông thường đều đang dùng giao thức OAuth 2.0.

Ngoài ra, hiện nay OAuth 2.0 cũng thường gặp trong các kịch bản thanh toán (WeChat Pay, Alipay) và nền tảng mở (WeChat Open Platform, Alibaba Open Platform...).

Hình dưới đây là sơ đồ [đăng nhập bên thứ ba Slack OAuth 2.0](https://api.slack.com/legacy/oauth):

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/20210615151716340-0b7cb7f7.png)

**Bài đọc đề xuất:**

- [Giải thích đơn giản về OAuth 2.0](http://www.ruanyifeng.com/blog/2019/04/oauth_design.html)
- [10 phút hiểu giao thức OAuth 2.0 là gì](https://deepzz.com/post/what-is-oauth2-protocol.html)
- [Bốn phương thức cấp quyền của OAuth 2.0](http://www.ruanyifeng.com/blog/2019/04/oauth-grant-types.html)
- [Hướng dẫn ví dụ đăng nhập bên thứ ba GitHub OAuth](http://www.ruanyifeng.com/blog/2019/04/github-oauth.html)

## Tham khảo

- Đừng dùng JWT thay thế quản lý session (Phần 1): Hiểu toàn diện về Token, JWT, OAuth, SAML, SSO: <https://zhuanlan.zhihu.com/p/38942172>
- Introduction to JSON Web Tokens: <https://jwt.io/introduction>
- JSON Web Token Claims: <https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims>
