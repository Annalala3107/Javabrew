---
title: Tổng hợp các HTTP Status Code thường gặp (Tầng ứng dụng)
description: Tổng hợp ý nghĩa và ngữ cảnh sử dụng của các HTTP status code phổ biến, làm rõ các điểm dễ gây nhầm lẫn như 201/204, giúp nâng cao hiệu quả thiết kế API và debug.
category: Kiến thức máy tính cơ bản
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: HTTP Status Code,2xx,3xx,4xx,5xx,chuyển hướng,mã lỗi,201 Created,204 No Content
lang: vi
sourceRef: zh-ref/cs-basics/network/http-status-codes.md
---

HTTP status code (mã trạng thái HTTP) là bản tóm tắt kết quả xử lý do server trả về cho client. Nhìn vào một mã trạng thái, về cơ bản bạn có thể xác định được request thành công, được chuyển hướng (redirect), lỗi phía client hay lỗi phía server.

Mã trạng thái thoạt nhìn chỉ là những con số, nhưng nhiều mã rất dễ bị nhầm lẫn: ví dụ như 301 và 302, 401 và 403, 500 và 502, 201 và 204.

Bài viết này chủ yếu giải đáp một số câu hỏi:

1. Các nhóm 1xx, 2xx, 3xx, 4xx, 5xx đại diện cho những loại kết quả nào?
2. Sự khác biệt giữa các status code thành công phổ biến như 200, 201, 204 là gì?
3. Nên hiểu các lỗi client thường gặp như 400, 401, 403, 404 như thế nào?
4. Các lỗi server phổ biến như 500, 502, 503, 504 thường mang ý nghĩa gì?

![Các HTTP Status Code thường gặp](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-status-code-4a9382f4.png)

### 1xx Informational (Mã trạng thái thông tin)

So với các nhóm mã trạng thái khác, 1xx rất hiếm khi bạn gặp phải trong công việc hàng ngày, nên chúng ta sẽ bỏ qua ở đây.

### 2xx Success (Mã trạng thái thành công)

- **200 OK**: Request đã được xử lý thành công. Ví dụ, gửi một HTTP request truy vấn dữ liệu người dùng lên server, server trả về đúng dữ liệu người dùng đó. Đây là HTTP status code phổ biến nhất trong công việc hàng ngày của chúng ta.
- **201 Created**: Request đã được xử lý thành công và tạo ra ~~một tài nguyên mới~~ trên server. Ví dụ, tạo một người dùng mới thông qua POST request.
- **202 Accepted**: Server đã tiếp nhận request nhưng chưa xử lý xong. Ví dụ: gửi một request đòi hỏi server mất nhiều thời gian xử lý (như tạo báo cáo, xuất file Excel); server đã nhận request nhưng chưa xử lý xong.
- **204 No Content**: Server đã xử lý thành công request nhưng không trả về bất kỳ nội dung nào. Ví dụ, gửi request xóa một người dùng, server xử lý thành công thao tác xóa nhưng không trả về body nội dung.

🐛 Đính chính (xem: [issue#2458](https://github.com/Snailclimb/JavaGuide/issues/2458)): Mã trạng thái 201 Created chính xác hơn là tạo ra một hoặc nhiều tài nguyên mới, có thể tham khảo: <https://httpwg.org/specs/rfc9110.html#status.201>.

![Định nghĩa mã trạng thái 201 Created trong RFC 9110](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/rfc9110-201-created-f791ff9a.png)

Ở đây cần nhấn mạnh riêng về mã trạng thái 204, vì tần suất bắt gặp trong học tập/công việc thông thường không nhiều.

Mô tả về mã trạng thái 204 trong [HTTP RFC 2616](https://tools.ietf.org/html/rfc2616#section-10.2.5) như sau:

> The server has fulfilled the request but does not need to return an
> entity-body, and might want to return updated metainformation. The
> response MAY include new or updated metainformation in the form of
> entity-headers, which if present SHOULD be associated with the
> requested variant.
>
> If the client is a user agent, it SHOULD NOT change its document view
> from that which caused the request to be sent. This response is
> primarily intended to allow input for actions to take place without
> causing a change to the user agent's active document view, although
> any new or updated metainformation SHOULD be applied to the document
> currently in the user agent's active view.
>
> The 204 response MUST NOT include a message-body, and thus is always
> terminated by the first empty line after the header fields.

Nói một cách đơn giản, mã trạng thái 204 mô tả kịch bản sau khi chúng ta gửi HTTP request lên server, chúng ta chỉ quan tâm kết quả xử lý là thành công hay không. Tức là thứ chúng ta cần chỉ là một kết quả: true/false.

Ví dụ: Bạn muốn theo đuổi một cô gái, bạn hỏi cô gái: "Anh tán em được không?", cô gái trả lời: "Được!". Nếu chúng ta xem cô gái này là server thì sẽ rất dễ hiểu mã trạng thái 204.

### 3xx Redirection (Mã trạng thái chuyển hướng)

- **301 Moved Permanently**: Tài nguyên đã được chuyển hướng vĩnh viễn. Ví dụ địa chỉ website của bạn đã thay đổi.
- **302 Found**: Tài nguyên đã được chuyển hướng tạm thời. Ví dụ một số tài nguyên trên website của bạn tạm thời được chuyển sang một địa chỉ khác.

### 4xx Client Error (Mã trạng thái lỗi phía Client)

- **400 Bad Request**: HTTP request gửi lên có vấn đề. Ví dụ tham số request không hợp lệ, sai HTTP method.
- **401 Unauthorized**: Chưa xác thực nhưng lại truy cập tài nguyên yêu cầu phải xác thực trước.
- **403 Forbidden**: Trực tiếp từ chối HTTP request, không xử lý. Thường dùng để chặn các request trái phép/không hợp lệ.
- **404 Not Found**: Tài nguyên bạn yêu cầu không tìm thấy trên server. Ví dụ bạn yêu cầu thông tin một người dùng nào đó, server không tìm thấy người dùng chỉ định.
- **409 Conflict**: Cho biết tài nguyên được yêu cầu xung đột với trạng thái hiện tại của tài nguyên trên server, request không thể xử lý được.

### 5xx Server Error (Mã trạng thái lỗi phía Server)

- **500 Internal Server Error**: Phía server xảy ra sự cố (thường là server gặp bug). Ví dụ khi server đang xử lý request thì bất ngờ ném ra exception nhưng exception đó không được bắt và xử lý đúng cách ở server.
- **502 Bad Gateway**: Gateway của chúng ta chuyển tiếp request đến upstream server, nhưng upstream server lại trả về một response không hợp lệ.

### Tài liệu tham khảo

- <https://www.restapitutorial.com/httpstatuscodes.html>
- <https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status>
- <https://en.wikipedia.org/wiki/List_of_HTTP_status_codes>
- <https://segmentfault.com/a/1190000018264501>
