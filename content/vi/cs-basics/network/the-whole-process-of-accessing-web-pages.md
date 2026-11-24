---
title: Từ lúc nhập URL đến khi trang web hiển thị thực sự đã xảy ra những gì?
description: Xâu chuỗi toàn bộ quá trình từ nhập URL đến khi hiển thị giao diện, bao gồm DNS, TCP, HTTP, TLS, ARP, đóng gói dữ liệu và quá trình render của trình duyệt, hỗ trợ phỏng vấn và thực chiến.
category: Kiến thức máy tính cơ bản
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: quy trình truy cập trang web,DNS,kết nối TCP,yêu cầu HTTP,bắt tay TLS,ARP,tải tài nguyên,render trình duyệt,đóng kết nối
lang: vi
sourceRef: zh-ref/cs-basics/network/the-whole-process-of-accessing-web-pages.md
---

Từ lúc bạn gõ một địa chỉ URL vào thanh địa chỉ của trình duyệt cho đến khi trang web hiển thị trọn vẹn lên màn hình, đằng sau đó là một chuỗi mắt xích liên hoàn kết nối các công nghệ: DNS, TCP, TLS, HTTP, ARP, đóng gói dữ liệu và quy trình render của trình duyệt.

Câu hỏi này rất thường xuyên được các nhà tuyển dụng sử dụng để đánh giá mức độ hiểu biết tổng quan về mạng máy tính của ứng viên, bởi vì nó có thể xâu chuỗi toàn bộ kiến thức trải dài từ tầng ứng dụng (Application Layer), tầng truyền tải (Transport Layer), tầng mạng (Network Layer) cho đến tầng liên kết dữ liệu (Data Link Layer). Nếu chỉ học vẹt từng giao thức đơn lẻ thì rất dễ bị đứt đoạn, nhưng nếu đi dọc theo toàn bộ hành trình truy cập một trang web thì mọi thứ sẽ trở nên sáng tỏ hơn rất nhiều.

Bài viết này chủ yếu giải đáp một số câu hỏi:

1. Sau khi nhập URL, trình duyệt sẽ thực hiện những bước xử lý cục bộ nào đầu tiên?
2. Quá trình phân giải tên miền DNS diễn ra như thế nào?
3. Kết nối TCP được thiết lập ra sao? Nếu dùng HTTPS thì quá trình bắt tay TLS làm những gì?
4. Luồng tương tác giữa HTTP request và response là gì?
5. Gói tin từ máy trạm đến máy chủ đã trải qua những tầng đóng gói và chuyển tiếp nào?
6. Trình duyệt sau khi nhận được HTML sẽ tiếp tục tải CSS, JS, hình ảnh... và render trang web ra sao?
7. Sau khi trang web tải xong, kết nối sẽ được tái sử dụng hay đóng lại như thế nào?

Nhìn chung, mô hình truyền thông mạng có thể được biểu diễn như hình dưới đây. Quá trình truy cập trang web thực chất là việc dữ liệu được đóng gói từ tầng ứng dụng xuống từng tầng thấp hơn, truyền qua mạng vật lý đến máy đích, rồi giải đóng gói ngược dần lên từng tầng phía trên.

![Sự phối hợp của mô hình 5 tầng mạng trong quá trình truy cập trang web](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/five-layers-ccc5588a.png)

Trước khi bắt đầu, hãy cùng điểm nhanh qua toàn bộ lộ trình:

1. **Trình duyệt phân tích URL và kiểm tra cache**: Trình duyệt bóc tách các thành phần cấu tạo nên URL, đồng thời kiểm tra HTTP cache (cache mạnh - strong cache, cache đàm phán - negotiated cache) xem đã có sẵn bản sao hợp lệ của tài nguyên hay chưa.
2. **Phân giải DNS**: Trình duyệt thông qua giao thức DNS để lấy về địa chỉ IP tương ứng với tên miền.
3. **Thiết lập kết nối truyền tải**: HTTP/1.1 và HTTP/2 thông thường sẽ thực hiện bắt tay 3 bước TCP để thiết lập kết nối; HTTP/3 thì thiết lập kết nối QUIC chạy trên nền UDP.
4. **Thiết lập kênh bảo mật (HTTPS)**: Với HTTP/1.1 và HTTP/2, sau khi có kết nối TCP sẽ tiến hành bắt tay TLS; HTTP/3 tích hợp sẵn TLS 1.3 ngay trong quá trình kết nối QUIC để đàm phán khóa và xác thực danh tính server.
5. **Gửi HTTP request**: Trình duyệt gửi bản tin HTTP request qua đường kết nối tới máy chủ để yêu cầu nội dung trang web.
6. **Server xử lý và trả về response**: Server nhận được request, xử lý nghiệp vụ rồi trả về bản tin HTTP response.
7. **Trình duyệt phân tích và render**: Trình duyệt bóc tách HTML, CSS, thực thi JavaScript và tải các tài nguyên con được nhúng trong trang (hình ảnh, font chữ...).
8. **Quản lý kết nối**: Sau khi trang tải xong, kết nối sẽ được tái sử dụng hoặc đóng lại tùy theo chính sách keep-alive.

Dưới đây chúng ta sẽ đi sâu vào từng bước một cách chi tiết.

## Bước 1: Phân tích URL và kiểm tra cache

Mở trình duyệt, nhập URL vào thanh địa chỉ rồi nhấn Enter. Việc đầu tiên trình duyệt làm không phải là gửi request đi ngay, mà là phân tích URL và kiểm tra xem có thể dùng luôn bản cache ở máy hay không.

### URL là gì

URL (Uniform Resource Locator, Định vị tài nguyên thống nhất) là địa chỉ định danh duy nhất của một tài nguyên trên Internet. Mỗi tài nguyên truy cập được trên mạng đều ứng với một URL; về mặt lý thuyết, một file và một URL có quan hệ một-một. Trong thực tế cũng có ngoại lệ, ví dụ như trong các kịch bản chuyển hướng (redirect) hoặc CDN, nhiều URL có thể cùng trỏ về một tài nguyên duy nhất.

### Cấu trúc thành phần của URL

![Cấu trúc thành phần của URL](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/URL-parts-74094b20.png)

Một URL hoàn chỉnh bao gồm các phần sau:

1. **Giao thức** (Scheme): Tiền tố của URL thể hiện giao thức được sử dụng, phổ biến nhất là `http` và `https`, ngoài ra còn có giao thức truyền tệp như `ftp:`...
2. **Tên miền** (Host): Tên định danh thông dụng của mục tiêu truy cập, hoặc có thể dùng trực tiếp địa chỉ IP. Tên miền thực chất là phiên bản dễ nhớ, dễ đọc cho con người của địa chỉ IP.
3. **Cổng** (Port): Đi liền sau tên miền, ngăn cách bằng dấu hai chấm `:`. HTTP mặc định là cổng 80, HTTPS mặc định là 443; nếu dùng cổng mặc định thì có thể lược bỏ.
4. **Đường dẫn tài nguyên** (Path): Bắt đầu từ dấu `/` đầu tiên, biểu thị vị trí tài nguyên trên máy chủ. Trong các thiết kế thời kỳ đầu, path tương ứng với tệp vật lý trên server, nhưng hiện nay thông thường là các đường dẫn ảo do hệ thống định tuyến (router) của backend ánh xạ.
5. **Tham số truy vấn** (Query): Phần nằm sau dấu `?`, có dạng các cặp key-value `key=value`, nhiều tham số được nối với nhau bằng dấu `&`. Server khi xử lý request sẽ trích xuất các tham số này.
6. **Điểm neo** (Fragment / Anchor): Phần nằm sau dấu `#`, dùng để định vị cuộn đến một vị trí cụ thể bên trong trang. Phần fragment này **tuyệt đối không** được gửi lên server trong HTTP request, mà chỉ do trình duyệt xử lý cục bộ tại máy người dùng.

### Kiểm tra bộ nhớ đệm của trình duyệt (Browser Cache)

Sau khi phân tích xong URL, trình duyệt sẽ kiểm tra HTTP cache trước xem có sẵn bản sao hợp lệ của tài nguyên hay không:

1. **Cache mạnh (Strong Cache)**: Kiểm tra các header như `Cache-Control` (ví dụ `max-age`) hoặc `Expires` để đánh giá xem cache còn trong thời hạn hiệu lực không. Nếu còn hiệu lực, trình duyệt dùng luôn dữ liệu cache và bỏ qua toàn bộ các bước gửi request qua mạng tiếp theo.
2. **Cache đàm phán (Negotiated Cache)**: Khi cache mạnh không trúng hoặc hết hạn, trình duyệt gửi một request xác thực lên server (mang theo `If-Modified-Since` hoặc `If-None-Match`), server sẽ đánh giá xem tài nguyên có bị thay đổi không. Nếu chưa đổi, server trả về `304 Not Modified`, trình duyệt tiếp tục dùng bản cache cục bộ; nếu đã đổi, server trả về `200 OK` kèm theo nội dung tài nguyên mới.

Nếu HTTP cache trúng đích hoàn toàn, toàn bộ quy trình truy cập kết thúc ngay tại đây mà không cần phải thực hiện bất kỳ thao tác mạng nào thêm.

### Chuẩn bị phân giải tên miền

Nếu HTTP cache không trúng, trình duyệt bắt buộc phải khởi tạo network request lên server, và việc đầu tiên là phải lấy được địa chỉ IP tương ứng với tên miền. Trước khi chính thức gửi câu truy vấn DNS ra mạng, trình duyệt sẽ lần lượt kiểm tra các tầng sau:

1. **DNS Cache của trình duyệt**: Bản thân trình duyệt tự duy trì một bảng DNS cache nội bộ, xem đã có bản ghi tên miền này chưa.
2. **DNS Cache của hệ điều hành**: Nếu trình duyệt chưa có, nó sẽ hỏi tiếp đến bộ nhớ đệm DNS của hệ điều hành.
3. **File hosts**: Hệ điều hành sẽ kiểm tra file `hosts` cục bộ xem có ánh xạ cứng từ tên miền sang IP hay không. Nếu có, nó dùng luôn địa chỉ IP này và bỏ qua toàn bộ khâu phân giải DNS qua mạng.

Nếu tất cả các tầng trên đều không có kết quả, trình duyệt mới chính thức phát động một lượt truy vấn DNS hoàn chỉnh.

## Bước 2: Phân giải DNS

DNS (Domain Name System, Hệ thống tên miền) giải quyết bài toán **ánh xạ giữa tên miền và địa chỉ IP**. Tên miền chỉ là cái tên để con người dễ ghi nhớ, còn giao tiếp mạng trong thế giới thực bắt buộc phải cần địa chỉ IP.

### Quy trình phân giải DNS

Sau khi có được tên miền, quy trình phân giải DNS thông thường diễn ra theo các bước sau:

1. **DNS Cache của trình duyệt**: Trình duyệt kiểm tra xem trong cache nội bộ có bản ghi còn hạn cho tên miền này hay không.
2. **DNS Cache của hệ điều hành**: Nếu cache trình duyệt không có, nó gửi request truy vấn DNS sang hệ điều hành. Bản thân OS cũng có DNS cache riêng.
3. **Local DNS Server**: DNS server cục bộ được cấu hình trong hệ điều hành (thường do nhà mạng ISP cung cấp, hoặc dùng DNS công cộng như `8.8.8.8`, `114.114.114.114`). Nếu Local DNS Server có sẵn bản cache còn hạn, nó sẽ trả kết quả về ngay.
4. **Truy vấn Đệ quy / Lặp (Recursive / Iterative Query)**: Nếu Local DNS Server không có cache, nó sẽ đại diện cho client đi thực hiện truy vấn lặp — đầu tiên hỏi Root DNS Server (máy chủ gốc), tiếp đến hỏi Top-Level Domain (TLD) DNS Server (ví dụ `.com`), cuối cùng hỏi Authoritative DNS Server (máy chủ có thẩm quyền), lần lượt từng bước lấy về địa chỉ IP đích.
5. **Trả kết quả và lưu Cache**: Local DNS Server sau khi có kết quả cuối cùng sẽ trả về cho client, đồng thời lưu một bản sao vào cache cục bộ để phục vụ cho các truy vấn lần sau.

Sơ đồ dưới đây minh họa một quy trình truy vấn lặp DNS điển hình:

![Quy trình phân giải DNS](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/DNS-process-f2f3a36e.png)

Trong thực tế, Local DNS Server thường đã cache sẵn một lượng lớn địa chỉ của các TLD server, nên phần lớn các truy vấn không cần phải bắt đầu lại từ Root Server; việc bỏ qua Root Server để hỏi thẳng TLD diễn ra rất phổ biến.

> Về các chi tiết sâu hơn của DNS (các cấp độ DNS server, khác biệt giữa truy vấn đệ quy và truy vấn lặp, các loại bản ghi DNS, lý do DNS thường chạy trên UDP...), bạn có thể tham khảo bài viết [Chi tiết về Hệ thống tên miền DNS (Tầng ứng dụng)](https://javaguide.cn/cs-basics/network/dns.html).

## Bước 3: Thiết lập kết nối truyền tải

Sau khi có được địa chỉ IP của server mục tiêu, trình duyệt cần thiết lập kết nối tầng truyền tải với server. Dưới đây trước tiên giới thiệu kết nối TCP thường dùng trong HTTP/1.1 và HTTP/2; nếu hai bên thỏa thuận dùng HTTP/3 thì sẽ chuyển sang thiết lập kết nối QUIC được xây dựng trên nền tảng UDP.

### Bắt tay 3 bước TCP (Three-Way Handshake)

Mục đích của bắt tay 3 bước TCP là **đồng bộ số thứ tự khởi tạo (Initial Sequence Number - ISN)** của cả hai bên, đồng thời **xác nhận đường truyền nhận dữ liệu của hai bên đều hoạt động tốt**.

![Sơ đồ bắt tay ba bước TCP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-shakes-hands-three-times-0d566cee.png)

1. **Lần bắt tay thứ nhất (SYN)**: Client gửi gói tin SYN mang số thứ tự khởi tạo của mình `seq=x`, chuyển sang trạng thái `SYN_SENT`.
2. **Lần bắt tay thứ hai (SYN+ACK)**: Server nhận được gói tin sẽ đáp lại bằng SYN+ACK, mang số thứ tự khởi tạo của mình `seq=y`, số xác nhận `ack=x+1`, chuyển sang trạng thái `SYN_RCVD`.
3. **Lần bắt tay thứ ba (ACK)**: Client nhận được sẽ gửi lại gói tin ACK với số xác nhận `ack=y+1`, cả hai bên cùng bước vào trạng thái `ESTABLISHED`, kết nối chính thức được thiết lập thành công.

Thiết kế bắt tay 3 bước không phải để "đi thêm một vòng cho vui", mà để giúp cả hai bên cùng xác nhận: đối phương nhận được dữ liệu của mình, và mình cũng nhận được dữ liệu của đối phương. Bắt tay 2 bước không thể làm được điều này — sau lần thứ hai, server hoàn toàn không biết liệu client có nhận được gói SYN+ACK của mình hay chưa.

> Về phân tích chi tiết bắt tay 3 bước, hàng đợi nửa kết nối / hàng đợi đầy đủ kết nối (SYN queue / Accept queue), phòng chống SYN Flood... bạn có thể tham khảo bài viết [Bắt tay ba bước và bốn bước vẫy tay TCP (Tầng truyền tải)](https://javaguide.cn/cs-basics/network/tcp-connection-and-disconnection.html).

### Nếu là HTTPS: Quá trình bắt tay TLS

Nếu sử dụng HTTPS dựa trên TCP, sau khi kết nối TCP thiết lập xong còn phải thực hiện quá trình bắt tay TLS. HTTP/3 thì tích hợp sẵn TLS 1.3 ngay trong khâu tạo kết nối QUIC. TLS hướng tới ba mục tiêu cốt lõi: **mã hóa** (chống nghe lén), **xác thực danh tính** (chống mạo danh) và **kiểm tra toàn vẹn** (chống chỉnh sửa).

Quy trình bắt tay TLS khái quát (lấy cơ chế trao đổi khóa RSA của TLS 1.2 làm ví dụ):

1. **Client Hello**: Client gửi danh sách phiên bản TLS hỗ trợ, danh sách cipher suite hỗ trợ và một số ngẫu nhiên `Client Random`.
2. **Server Hello**: Server chọn một cipher suite trong danh sách, gửi lại chứng chỉ của mình cùng một số ngẫu nhiên `Server Random`.
3. **Trao đổi khóa**: Client xác minh tính hợp lệ của chứng chỉ server (thông qua xác thực chữ ký CA), sau đó sinh ra Pre-Master Secret, dùng public key của server mã hóa rồi gửi sang cho server. Hai bên dựa vào Pre-Master Secret cùng hai số ngẫu nhiên đã trao đổi trước đó để tính toán ra các khóa phiên dùng cho mã hóa đối xứng.
4. **Hoàn tất**: Hai bên bắt đầu dùng khóa phiên để mã hóa giao tiếp, quá trình bắt tay kết thúc.

Cần lưu ý rằng quy trình trên mô tả phương thức trao đổi khóa dựa trên RSA trong TLS 1.2. HTTPS hiện đại đa phần áp dụng trao đổi khóa ECDHE, và TLS 1.3 còn có thể dùng PSK hoặc PSK+(EC)DHE trong kịch bản khôi phục phiên. Bí mật dùng chung trong ECDHE do hai bên tự đàm phán thông qua các khóa tạm thời, không truyền trực tiếp qua mạng; chỉ riêng việc lấy được private key chứng chỉ server nhìn chung không thể giải mã các phiên lịch sử dùng khóa tạm thời. TLS 1.3 còn tinh gọn quy trình bắt tay hơn nữa, thông thường chỉ mất 1-RTT và loại bỏ hoàn toàn cơ chế trao đổi khóa RSA tĩnh.

Sau khi bắt tay TLS hoàn tất, toàn bộ HTTP request và response sau đó đều được mã hóa bằng khóa đối xứng đã đàm phán. Tính an toàn của HTTPS bắt nguồn từ tầng TLS, chứ bản thân giao thức HTTP không hề bị thay đổi ngữ nghĩa.

> Để tìm hiểu chi tiết nguyên lý mã hóa của TLS (mã hóa bất đối xứng, mã hóa đối xứng, chữ ký số, chứng chỉ CA), bạn có thể tham khảo bài viết [HTTP vs HTTPS (Tầng ứng dụng)](https://javaguide.cn/cs-basics/network/http-vs-https.html). Về sự khác biệt giữa hai phương thức trao đổi khóa RSA và ECDHE, tham khảo bài viết [Quy trình bắt tay HTTPS RSA vs ECDHE](https://javaguide.cn/cs-basics/network/https-rsa-vs-ecdhe.html).

## Bước 4: Gửi HTTP request

Sau khi kết nối TCP (cùng kênh bảo mật TLS nếu có) đã sẵn sàng, trình duyệt có thể bắt đầu gửi HTTP request.

### Cấu trúc bản tin HTTP Request

Một bản tin request HTTP/1.1 điển hình có dạng như sau:

```http
GET /index.html HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
Accept: text/html,application/xhtml+xml
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
Connection: keep-alive
Cookie: session_id=abc123
```

Ý nghĩa từng phần:

- **Request Line (Dòng yêu cầu)**: `GET /index.html HTTP/1.1` — Phương thức yêu cầu (`GET`), đường dẫn tài nguyên (`/index.html`), phiên bản giao thức (`HTTP/1.1`).
- **Host Header**: Chỉ định tên máy chủ mục tiêu. Đây là trường bắt buộc trong HTTP/1.1, bởi vì cùng một máy chủ vật lý (cùng một IP) có thể dùng công nghệ máy chủ ảo (Virtual Host) để lưu trữ nhiều website khác nhau.
- **Các Request Header khác**: `User-Agent` (thông tin client), `Accept` (loại response có thể tiếp nhận), `Accept-Encoding` (các chuẩn nén hỗ trợ), `Cookie` (thông tin trạng thái mang theo)...

### Server xử lý request

Server sau khi nhận được request sẽ trải qua một loạt thao tác xử lý để tạo ra response:

1. **Tiếp nhận request**: Web server (như Nginx, Tomcat) nhận và phân tích cú pháp bản tin HTTP request.
2. **Phân phối định tuyến (Routing)**: Dựa vào đường dẫn URL để định tuyến request tới logic xử lý ở backend tương ứng (Controller, Servlet...).
3. **Xử lý nghiệp vụ**: Thực thi logic nghiệp vụ cụ thể, có thể bao gồm truy vấn cơ sở dữ liệu, đọc cache, gọi các microservice khác...
4. **Đóng gói Response**: Đóng gói kết quả xử lý thành bản tin HTTP response.

### Cấu trúc bản tin HTTP Response

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Encoding: gzip
Content-Length: 1256
Cache-Control: max-age=3600
Set-Cookie: session_id=xyz789; Path=/

<!DOCTYPE html>
<html>
...
</html>
```

Ý nghĩa từng phần:

- **Status Line (Dòng trạng thái)**: `HTTP/1.1 200 OK` — Phiên bản giao thức, mã trạng thái (`200`), mô tả trạng thái.
- **Response Headers**: `Content-Type` (kiểu dữ liệu của response body), `Content-Encoding` (chuẩn nén), `Cache-Control` (chính sách cache), `Set-Cookie` (thiết lập cookie ở client)...
- **Response Body**: Nội dung thực tế được yêu cầu, ví dụ như tài liệu HTML, dữ liệu JSON, dữ liệu nhị phân của hình ảnh...

Các mã trạng thái phổ biến:

| Mã trạng thái | Phân loại | Ví dụ phổ biến |
| --- | --- | --- |
| 2xx | Thành công (Success) | 200 OK, 206 Partial Content |
| 3xx | Chuyển hướng (Redirection) | 301 Moved Permanently, 302 Found, 304 Not Modified |
| 4xx | Lỗi phía Client (Client Error) | 400 Bad Request, 403 Forbidden, 404 Not Found |
| 5xx | Lỗi phía Server (Server Error) | 500 Internal Server Error, 502 Bad Gateway |

> Về tổng hợp chi tiết các HTTP status code thường gặp, bạn có thể tham khảo bài viết [Tổng hợp các HTTP Status Code thường gặp (Tầng ứng dụng)](https://javaguide.cn/cs-basics/network/http-status-codes.html).

## Bước 5: Đóng gói và chuyển tiếp gói tin

Sau khi HTTP request được phát đi từ trình duyệt, dữ liệu không thể tự động "bay" ngay đến máy chủ được. Nó phải trải qua quá trình đóng gói từng tầng qua chồng giao thức, rồi được chuyển tiếp từng chặng (hop-by-hop) qua mạng vật lý để đến đích.

### Quá trình đóng gói dữ liệu

Bản tin HTTP ở tầng ứng dụng, sau khi đi qua tầng truyền tải, tầng mạng, tầng liên kết dữ liệu sẽ được đóng gói qua từng tầng, cuối cùng trở thành luồng bit có thể truyền tải trên môi trường vật lý:

![Tổng quan các tầng giao thức TCP/IP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-protocol-overview-09ff1718.png)

Mỗi tầng chỉ quan tâm đến phần thông tin header mà chính nó cần chèn thêm, và sử dụng dịch vụ do tầng dưới cung cấp để truyền tải dữ liệu:

- **Tầng truyền tải (TCP)**: Thêm cổng nguồn (Source Port) và cổng đích (Destination Port), dùng số thứ tự (Sequence Number) và số xác nhận (Acknowledgment Number) để đảm bảo truyền tải tin cậy.
- **Tầng mạng (IP)**: Thêm IP nguồn và IP đích, chịu trách nhiệm đánh địa chỉ và định tuyến, quyết định đường đi của gói tin từ nguồn đến đích.
- **Tầng liên kết dữ liệu (Data Link Layer)**: Thêm địa chỉ MAC nguồn và MAC đích, chịu trách nhiệm truyền tải khung dữ liệu (frame) giữa các nút mạng liền kề nhau trên cùng một môi trường truyền dẫn.

### Định tuyến và chuyển tiếp ở tầng mạng

Gói tin từ máy chủ nguồn đến máy chủ đích thông thường phải đi qua nhiều router trung gian. Chức năng cốt lõi của tầng mạng chính là **định tuyến (routing) và chuyển tiếp (forwarding)**:

- **Định tuyến**: Xác định lộ trình tối ưu mà gói tin sẽ đi từ nguồn đến đích (do các giao thức định tuyến như OSPF, BGP... tính toán).
- **Chuyển tiếp**: Di chuyển gói tin từ cổng đầu vào của router sang cổng đầu ra phù hợp.

Mỗi router duy trì một bảng định tuyến (routing table), tra bảng dựa vào địa chỉ IP đích để quyết định chặng tiếp theo (next hop). Gói tin trong mạng hệt như kiện hàng bưu phẩm: mỗi trạm trung chuyển chỉ cần nhìn "gửi tiếp đến trạm nào" mà không cần biết toàn bộ hành trình ngay từ đầu.

### Giao thức ARP: Từ địa chỉ IP sang địa chỉ MAC

Khi khung dữ liệu truyền ở tầng liên kết, nó bắt buộc phải biết địa chỉ MAC của thiết bị chặng tiếp theo, chứ không thể chỉ dùng mỗi địa chỉ IP. Giao thức ARP (Address Resolution Protocol) sinh ra để giải quyết bài toán: "Khi đã biết địa chỉ IP, làm thế nào để lấy được địa chỉ MAC tương ứng".

Phương thức hoạt động của ARP là **truy vấn quảng bá, phản hồi đơn vị (broadcast query, unicast response)**:

1. Máy tính tra cứu bảng ARP cache cục bộ trước xem đã có sẵn địa chỉ MAC cho IP mục tiêu chưa.
2. Nếu cache không có, nó sẽ gửi một bản tin ARP Request quảng bá trong mạng cục bộ LAN: "Ai có IP xxx.xxx.xxx.xxx? Hãy cho tôi biết địa chỉ MAC của bạn."
3. Thiết bị mục tiêu (hoặc cổng router tương ứng) nhận được sẽ trả lời bằng một bản tin đơn vị (unicast) chứa địa chỉ MAC của mình.
4. Bên gửi nhận được response sẽ lưu ánh xạ IP-MAC vào bảng ARP cache để dùng trực tiếp cho các lần sau.

Nếu máy chủ mục tiêu không nằm trong cùng một mạng con (subnet), máy tính không cần biết địa chỉ MAC của máy đích cuối cùng, mà chỉ cần biết **địa chỉ MAC của Default Gateway (router cục bộ)** là đủ. Gói tin sẽ được chuyển tới gateway trước, sau đó gateway sẽ chuyển tiếp từng chặng tới mạng mục tiêu.

> Về nguyên lý hoạt động chi tiết của ARP (định tuyến cùng subnet vs khác subnet, bảng ARP, các kiểu tấn công ARP phổ biến), bạn có thể xem bài viết [Chi tiết giao thức ARP (Tầng mạng)](https://javaguide.cn/cs-basics/network/arp.html).

### Dịch địa chỉ mạng (NAT)

Trong đa số mạng gia đình và doanh nghiệp, các máy trạm nội bộ sử dụng địa chỉ IP riêng (Private IP, ví dụ `192.168.x.x`), những IP này không thể định tuyến trực tiếp trên mạng Internet công cộng. Giao thức NAT (Network Address Translation) chịu trách nhiệm chuyển đổi địa chỉ IP giữa mạng nội bộ và mạng công cộng.

Khi máy nội bộ gửi gói tin ra Internet, thiết bị NAT (thường là router) sẽ thay thế IP nguồn từ địa chỉ private thành địa chỉ IP công cộng, đồng thời ghi lại quan hệ ánh xạ cổng (port mapping). Khi gói tin phản hồi quay về, NAT lại dựa vào bảng ánh xạ để chuyển đổi địa chỉ đích trở lại IP riêng của máy nội bộ tương ứng.

## Bước 6: Trình duyệt phân tích và render

Sau khi server trả về response HTML, công việc thực sự của trình duyệt mới chính thức bắt đầu. Trình duyệt cần phân tích HTML, dựng DOM tree, tải các tài nguyên phụ, tính toán style, tính toán layout và cuối cùng vẽ các điểm ảnh lên màn hình.

### Phân tích cú pháp HTML và xây dựng DOM Tree

Trình duyệt nhận được tài liệu HTML sẽ phân tích từng dòng từ trên xuống dưới:

1. **Xây dựng DOM Tree**: Phân tích các thẻ HTML, sinh ra mô hình đối tượng tài liệu (DOM tree) biểu thị cấu trúc thứ bậc của trang.
2. **Xây dựng CSSOM Tree**: Khi gặp file CSS được nhúng qua thẻ `<link>` hoặc thẻ `<style>`, trình duyệt tải về và phân tích CSS để sinh ra mô hình đối tượng CSS (CSSOM tree), biểu thị các quy tắc định kiểu dáng.
3. **Xây dựng Render Tree**: Hợp nhất DOM tree và CSSOM tree thành một Render Tree. Render tree chỉ chứa các node thực sự cần hiển thị cùng thông tin style tương ứng (các phần tử có thuộc tính `display: none` sẽ không xuất hiện trong Render tree).
4. **Bố cục (Layout / Reflow)**: Tính toán vị trí và kích thước hình học chính xác của từng node trong Render tree.
5. **Vẽ (Paint)**: Chuyển đổi các node trong Render tree đã có bố cục thành các pixel thực tế trên màn hình.
6. **Hợp nhất lớp (Composite)**: Ghép các layer khác nhau lại thành bức tranh hoàn chỉnh cuối cùng hiển thị trên màn hình.

### Tải các tài nguyên phụ (Sub-resources)

Tài liệu HTML thường sẽ tham chiếu đến rất nhiều tài nguyên bên ngoài:

- **Tệp CSS** (`<link rel="stylesheet">`): Các file stylesheet thông thường sẽ chặn việc render (render-blocking). Trình duyệt sẽ đợi CSS tải và phân tích xong xuôi mới tiến hành layout và paint, bởi vì CSS có thể làm thay đổi hoàn toàn kích thước và vị trí của các phần tử. Có thể thay đổi hành vi này qua thuộc tính `media`, nạp động hoặc dùng `preload`.
- **Tệp JavaScript** (`<script>`): Mặc định việc thực thi JavaScript sẽ chặn quá trình phân tích HTML (HTML parser-blocking), vì script có thể can thiệp sửa đổi DOM. Có thể điều chỉnh cơ chế tải thông qua thuộc tính `async` hoặc `defer`.
- **Hình ảnh, Font chữ...**: Không chặn quá trình phân tích HTML, nhưng cần tải xong mới hiển thị được lên trang.

Việc tải các tài nguyên phụ này sẽ phát động thêm các HTTP request phụ. Nếu dùng HTTP/1.1, trình duyệt thường duy trì tối đa 6 kết nối TCP đồng thời cho cùng một tên miền để tải tài nguyên song song. Cơ chế đa ghép kênh (Multiplexing) của HTTP/2 thì cho phép truyền tải song song nhiều tài nguyên trên cùng một kết nối TCP duy nhất.

### Thực thi JavaScript

Việc thực thi JavaScript sẽ làm gián đoạn quá trình phân tích HTML. Khi trình duyệt gặp thẻ `<script>`, nó sẽ tạm dừng việc xây dựng DOM tree để tải và chạy script trước. Nếu trong script có các thao tác can thiệp DOM, nó có thể kích hoạt việc tái cấu trúc DOM, gây ra hiện tượng tính toán lại bố cục (Reflow) hoặc vẽ lại (Repaint).

Các kỹ thuật tối ưu hóa phổ biến trong phát triển frontend hiện đại bao gồm:

- Đặt thẻ `<script>` ở cuối thẻ `<body>` hoặc dùng thuộc tính `defer` để tránh chặn đứng quá trình phân tích DOM ban đầu.
- Dùng thuộc tính `async` để tải bất đồng bộ các script không phụ thuộc hoặc can thiệp vào DOM.
- Tận dụng mạng phân phối nội dung CDN để tăng tốc độ tải tài nguyên tĩnh.
- Khai thác tối đa browser cache để triệt tiêu các request trùng lặp.

## Bước 7: Quản lý kết nối

Sau khi trang web và toàn bộ tài nguyên đã tải xong, kết nối thường không bị ngắt ngay lập tức. Cách quản lý kết nối ra sao phụ thuộc vào phiên bản HTTP và cấu hình của hệ thống. Phần thảo luận về HTTP/1.0, HTTP/1.1 và HTTP/2 dưới đây chủ yếu nói về kết nối TCP; còn HTTP/3 thì quản lý kết nối và stream của giao thức QUIC.

### HTTP/1.0: Kết nối ngắn (Short-lived Connection)

HTTP/1.0 mặc định dùng kết nối ngắn: mỗi cặp request-response hoàn thành là kết nối TCP sẽ bị đóng ngay lập tức. Nếu một trang web nhúng 10 tài nguyên ngoài, trình duyệt phải mở 10 kết nối TCP riêng biệt, mỗi lần đều phải nếm trải đủ 3 bước bắt tay và 4 bước vẫy tay, lãng phí rất nhiều thời gian vào khâu tạo và hủy kết nối.

### HTTP/1.1: Kết nối dai dẳng (Keep-Alive / Persistent Connection)

HTTP/1.1 mặc định dùng kết nối dài (`Connection: keep-alive`). Một kết nối TCP sau khi được thiết lập có thể liên tục gửi nhiều request và nhận nhiều response mà không cần bắt tay lại từ đầu mỗi lần. Nhờ đó, các tài nguyên phụ như CSS, JS, hình ảnh trong trang có thể tái sử dụng chung một kết nối TCP.

Kết nối dài không tồn tại vĩnh viễn. Máy chủ thường cấu hình thời gian rảnh rỗi tối đa (như `KeepAliveTimeout` của Apache); nếu trong khoảng thời gian timeout này không có request mới nào gửi tới, máy chủ sẽ chủ động đóng kết nối.

### HTTP/2: Đa ghép kênh (Multiplexing)

HTTP/2 đưa cơ chế đa ghép kênh vào hoạt động trên nền tảng kết nối dài. Trên cùng một kết nối TCP duy nhất có thể truyền tải đồng thời nhiều request và response, dữ liệu được chia nhỏ thành các frame và phân biệt thông qua mã định danh luồng (Stream ID). Điều này giải quyết triệt để vấn đề nghẽn đầu hàng (Head-of-Line Blocking - HOL) ở tầng ứng dụng của HTTP/1.1 — một request chậm chạp phía trước không còn chặn đường các request phía sau nữa. Cần lưu ý rằng HTTP/2 vẫn dựa trên TCP; khi tầng TCP bị rớt gói tin, toàn bộ các stream trên kết nối đó đều sẽ bị ảnh hưởng (nghẽn đầu hàng ở tầng TCP). HTTP/3 dựa trên giao thức QUIC (UDP) mới giải quyết căn cơ hơn vấn đề này.

### Đóng kết nối (Four-Way Wave / Teardown)

Khi kết nối thực sự cần phải đóng lại (do bên chủ động đóng phát động):

1. Bên chủ động đóng gửi gói tin FIN, thông báo mình đã hết dữ liệu cần gửi.
2. Bên bị động đóng đáp lại bằng gói ACK, bước vào trạng thái `CLOSE_WAIT`, nhưng vẫn có thể tiếp tục gửi nốt dữ liệu còn lại.
3. Bên bị động đóng sau khi gửi xong toàn bộ dữ liệu cũng sẽ phát một gói tin FIN.
4. Bên chủ động đóng đáp lại bằng gói tin ACK cuối cùng, bước vào trạng thái `TIME_WAIT`, đợi đủ thời gian 2MSL rồi mới chính thức đóng kết nối hoàn toàn.

Trạng thái `TIME_WAIT` sinh ra là để đảm bảo gói ACK cuối cùng chắc chắn đến được máy đối phương, đồng thời giúp các gói tin cũ còn sót lại trên đường truyền mạng tiêu biến hết, tránh gây nhiễu cho các kết nối mới được tạo sau này.

> Về bốn bước vẫy tay TCP, tác động của trạng thái TIME_WAIT và cách xử lý sự cố tồn đọng CLOSE_WAIT, bạn có thể tham khảo bài viết [Bắt tay ba bước và bốn bước vẫy tay TCP (Tầng truyền tải)](https://javaguide.cn/cs-basics/network/tcp-connection-and-disconnection.html).

## Tổng kết toàn bộ lộ trình

Xâu chuỗi lại toàn bộ các bước ở trên, lộ trình truy cập hoàn chỉnh có thể đúc kết thành:

1. **Nhập URL** → Trình duyệt bóc tách các thành phần URL, kiểm tra HTTP cache; nếu cần request mạng thì kiểm tra tiếp file hosts cục bộ.
2. **Phân giải DNS** → Lần lượt tra cứu cache trình duyệt, cache hệ điều hành, Local DNS Server, khi cần thiết sẽ thực hiện truy vấn lặp qua Root → TLD → Authoritative server để lấy địa chỉ IP đích.
3. **Thiết lập kết nối truyền tải** → HTTP/1.1 và HTTP/2 thiết lập kết nối TCP; HTTP/3 thiết lập kết nối QUIC.
4. **Thiết lập kênh bảo mật (HTTPS)** → HTTPS trên nền TCP tiến hành bắt tay TLS; HTTP/3 hoàn tất bắt tay TLS 1.3 ngay trong khâu tạo kết nối QUIC.
5. **Gửi HTTP Request và nhận Response** → Trình duyệt gửi request, server tiếp nhận xử lý và trả về response HTML.
6. **Đóng gói và chuyển tiếp dữ liệu** → Bản tin request được đóng gói qua TCP → IP → Tầng liên kết, chuyển tiếp từng chặng qua router, switch... đến máy chủ; response quay về theo chiều ngược lại.
7. **Render trang web** → Phân tích HTML dựng DOM tree, tải các tài nguyên phụ CSS/JS/ảnh, tạo Render tree, tính toán bố cục và vẽ trang web lên màn hình.
8. **Quản lý kết nối** → Tái sử dụng hoặc đóng kết nối TCP dựa trên phiên bản HTTP và cấu hình máy chủ.

Truy cập một trang web nhìn bề ngoài có vẻ đơn giản, nhưng thực chất đã xâu chuỗi gần như mọi giao thức cốt lõi của mạng máy tính. Tiếp cận và thấu hiểu theo lộ trình này sẽ giúp các giao thức DNS, TCP, TLS, HTTP, IP, ARP không còn là những mảnh ghép kiến thức rời rạc, mà trở thành những mắt xích chặt chẽ trong một bức tranh toàn cảnh thống nhất.

## Tài liệu tham khảo

1. Giáo trình Mạng máy tính (Computer Networking - Tái bản lần 7)
2. Sách Minh họa HTTP (Illustrated HTTP)
3. [What really happens when you navigate to a URL](https://stackoverflow.com/questions/2092527/what-really-happens-when-you-navigate-to-a-url)
4. [How browsers work](https://web.dev/howbrowserswork/)
