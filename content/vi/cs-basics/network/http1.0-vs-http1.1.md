---
title: HTTP 1.0 vs HTTP 1.1: Khác biệt cốt lõi về Persistent Connection, Cache, Host Header (Tầng ứng dụng)
description: So sánh chi tiết sự khác biệt về giao thức giữa HTTP/1.0 và HTTP/1.1, bao gồm kết nối dai dẳng (persistent connection), pipelining, cơ chế cache, cải tiến status code và tối ưu băng thông.
category: Kiến thức máy tính cơ bản
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: HTTP/1.0,HTTP/1.1,kết nối dài,pipelining,cache,mã trạng thái,Host,tối ưu băng thông
lang: vi
sourceRef: zh-ref/cs-basics/network/http1.0-vs-http1.1.md
---

HTTP/1.0 và HTTP/1.1 nhìn tên chỉ chênh lệch nhau một phiên bản nhỏ, nhưng giữa chúng có sự khác biệt rõ rệt về tái sử dụng kết nối, bộ nhớ đệm (caching), Host header, mã trạng thái và tối ưu hóa băng thông.

Những khác biệt này không đơn thuần là chi tiết giao thức lý thuyết, mà trực tiếp ảnh hưởng đến cách trình duyệt gửi request, cách máy chủ tái sử dụng kết nối, cách cache hoạt động và cách thức vận hành của các máy chủ ảo (virtual host).

Bài viết này chủ yếu giải đáp một số câu hỏi:

1. So với HTTP/1.0, HTTP/1.1 đã bổ sung những mã trạng thái phổ biến nào?
2. Cơ chế caching của HTTP/1.0 và HTTP/1.1 có điểm gì khác nhau?
3. Tại sao HTTP/1.1 lại mặc định hỗ trợ kết nối dai dẳng (persistent connection)?
4. Host header và tối ưu hóa băng thông giải quyết vấn đề gì?

Trước khi bắt đầu, hãy cùng điểm lại sơ lược về giao thức HTTP:

![HTTP: Tổng quan về Giao thức truyền tải siêu văn bản](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-overview-f3be5ebb.png)

## Mã trạng thái phản hồi (Response Status Codes)

HTTP/1.0 chỉ định nghĩa 16 mã trạng thái. HTTP/1.1 đã bổ sung thêm rất nhiều status code mới, riêng mã phản hồi lỗi đã tăng thêm 24 loại. Ví dụ: `100 (Continue)` — cho phép client xác nhận xem server có sẵn sàng tiếp nhận hay không trước khi gửi đi một request body có dung lượng lớn; `206 (Partial Content)` — mã nhận diện cho yêu cầu theo phạm vi (range request); `409 (Conflict)` — request xung đột với quy định hiện tại của tài nguyên; `410 (Gone)` — tài nguyên mục tiêu đã không còn khả dụng và tình trạng này rất có thể là vĩnh viễn, server cũng không biết địa chỉ chuyển tiếp khả dụng.

## Xử lý bộ nhớ đệm (Caching)

Công nghệ cache giúp tránh việc client phải tương tác liên tục với origin server, tiết kiệm lượng lớn băng thông mạng và giảm độ trễ khi người dùng nhận thông tin.

### HTTP/1.0

HTTP/1.0 cung cấp cơ chế cache rất đơn giản. Phía server dùng header `Expires` để đánh dấu (thời gian) cho một response body; các request nằm trong khoảng thời gian `Expires` đều sẽ nhận bản cache của response body này. Trong response body trả về lần đầu tiên cho client, server có gắn header `Last-Modified`, header này ghi nhận thời điểm sửa đổi lần cuối của tài nguyên trên server. Trong request header, client sẽ dùng `If-Modified-Since` mang mốc thời gian để hỏi server: "Sau thời điểm này, tài nguyên tôi yêu cầu có bị chỉnh sửa không?" Thông thường, giá trị `If-Modified-Since` trong request header chính là giá trị `Last-Modified` trong response body của lần lấy tài nguyên trước đó.

Nếu server nhận được request header và xác định sau mốc thời gian `If-Modified-Since` tài nguyên thực sự chưa từng bị sửa đổi, server sẽ trả về cho client header `304 Not Modified`, mang ý nghĩa: "Bản đệm vẫn dùng tốt, bạn cứ lấy từ trình duyệt ra mà dùng!".

Nếu server xác định sau mốc thời gian `If-Modified-Since` tài nguyên đã bị chỉnh sửa, server sẽ trả về response body `200 OK` đính kèm nội dung tài nguyên hoàn toàn mới, mang ý nghĩa: "Cái bạn cần tôi đã cập nhật rồi, gửi bạn bản mới nhé".

![HTTP/1.0 sử dụng Expires và Last-Modified để kiểm tra cache](/media/jg/local/cs-basics/network/images/http-vs-https/HTTP1.0cache1-c276ac.png)

![HTTP/1.0 trả về 304 Not Modified khi trúng cache](/media/jg/local/cs-basics/network/images/http-vs-https/HTTP1.0cache2-f6c10b.png)

### HTTP/1.1

Cơ chế cache của HTTP/1.1 dựa trên nền tảng của HTTP/1.0 nhưng gia tăng đáng kể tính linh hoạt và khả năng mở rộng. Nguyên lý hoạt động cơ bản vẫn tương tự HTTP/1.0, nhưng bổ sung thêm nhiều tính năng chi tiết hơn. Trong đó, tính năng phổ biến nhất trong request header là `Cache-Control`, chi tiết xem tại tài liệu MDN Web [Cache-Control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control).

## Phương thức kết nối

**HTTP/1.0 mặc định sử dụng kết nối ngắn (short-lived connection)**, nghĩa là mỗi lần client và server thực hiện một thao tác HTTP, một kết nối mới sẽ được thiết lập, và kết thúc tác vụ thì kết nối sẽ bị ngắt ngay. Khi trình duyệt client truy cập một trang HTML hoặc loại trang Web khác có chứa các tài nguyên con (như file JavaScript, file ảnh, file CSS...), mỗi khi gặp một tài nguyên Web như vậy, trình duyệt lại phải tạo mới một kết nối TCP. Điều này dẫn đến lượng lớn các gói tin "bắt tay" (handshake) và "vẫy tay" (teardown) chiếm dụng băng thông.

**Để giải quyết vấn đề lãng phí tài nguyên của HTTP/1.0, HTTP/1.1 đã tối ưu thành chế độ kết nối dai dẳng (persistent connection) mặc định.** Bản tin request sử dụng chế độ persistent connection sẽ thông báo cho server: "Tôi yêu cầu kết nối với bạn, và sau khi kết nối thiết lập thành công, xin vui lòng đừng đóng kết nối". Nhờ đó, kết nối TCP này sẽ tiếp tục được giữ mở để phục vụ các lần trao đổi dữ liệu client-server tiếp theo. Nói cách khác, khi dùng persistent connection, sau khi một trang web tải xong, kết nối TCP truyền dữ liệu HTTP giữa client và server sẽ không bị đóng; khi client truy cập lại server này, nó sẽ tái sử dụng đường kết nối đã thiết lập sẵn.

Nếu kết nối TCP luôn được giữ mở liên tục thì cũng gây lãng phí tài nguyên, vì vậy một số phần mềm máy chủ (như Apache) hỗ trợ tùy chọn thời gian chờ (timeout). Trong khoảng thời gian timeout nếu không có request mới nào gửi tới, kết nối TCP mới chính thức bị đóng.

Cần lưu ý rằng HTTP/1.0 vẫn hỗ trợ tùy chọn persistent connection bằng cách thêm `Connection: Keep-Alive` vào request header. Tương tự, trong HTTP/1.1, nếu không muốn dùng persistent connection, bạn có thể thêm `Connection: close` vào request header để báo cho server: "Tôi không cần kết nối dài, xử lý xong có thể đóng kết nối ngay".

**Kết nối dài (persistent connection) và kết nối ngắn (short-lived connection) trong giao thức HTTP thực chất chính là kết nối dài và kết nối ngắn ở tầng giao thức TCP.**

**Để triển khai được kết nối dài, cả client và server đều phải hỗ trợ tính năng này.**

## Xử lý Host Header

Hệ thống phân giải tên miền (DNS) cho phép nhiều tên miền (hostname) cùng trỏ về một địa chỉ IP duy nhất, nhưng HTTP/1.0 chưa tính đến trường hợp này. Giả sử ta có URL tài nguyên là `http://example1.org/home.html`, trong bản tin request HTTP/1.0, nội dung gửi đi chỉ là `GET /home.html HTTP/1.0` mà không hề đính kèm hostname. Khi bản tin này đến máy chủ, server không thể hiểu được website thực sự mà client muốn truy cập là website nào.

Vì vậy, HTTP/1.1 đã bổ sung trường `Host` vào request header. Phần header của bản tin có trường `Host` sẽ như sau:

```plain
GET /home.html HTTP/1.1
Host: example1.org
```

Nhờ đó, server có thể xác định chính xác trang web thực sự mà client đang muốn yêu cầu.

## Tối ưu hóa băng thông

### Yêu cầu theo phạm vi (Range Requests)

HTTP/1.1 giới thiệu cơ chế range request để tránh lãng phí băng thông. Khi client chỉ muốn lấy một phần của tệp, hoặc cần tải tiếp một tệp đã tải dở trước đó do bị gián đoạn, HTTP/1.1 có thể chèn header `Range` vào request để yêu cầu một phần dữ liệu (và chỉ áp dụng cho dữ liệu dạng byte). Server có thể bỏ qua header `Range`, hoặc trả về các phản hồi `Range` tương ứng.

Tác dụng chính của status code `206 (Partial Content)` là đảm bảo client và proxy server nhận diện chính xác đây là phản hồi một phần nội dung, tránh việc nhầm tưởng là tài nguyên hoàn chỉnh rồi lưu cache sai lệch. Điều này cực kỳ quan trọng cho việc xử lý range request và quản lý cache.

Một ví dụ điển hình về HTTP/1.1 range request:

```http
# Lấy 1024 byte đầu tiên của một tệp
GET /z4d4kWk.jpg HTTP/1.1
Host: i.imgur.com
Range: bytes=0-1023
```

Phản hồi `206 Partial Content`:

```http
HTTP/1.1 206 Partial Content
Content-Range: bytes 0-1023/146515
Content-Length: 1024
…
(Nội dung nhị phân)
```

Giải thích ngắn gọn các trường trong header phản hồi phạm vi của HTTP:

- **Header `Content-Range`**: Cho biết vị trí của dữ liệu trả về trong toàn bộ tài nguyên, bao gồm byte bắt đầu, byte kết thúc và tổng dung lượng tài nguyên. Ví dụ: `Content-Range: bytes 0-1023/146515` cho biết server trả về từ byte thứ 0 đến byte thứ 1023 (tổng cộng 1024 byte), trong khi tổng chiều dài tài nguyên là 146.515 byte.
- **Header `Content-Length`**: Cho biết số byte thực tế được truyền tải trong lần phản hồi này. Ví dụ: `Content-Length: 1024` cho biết server đã truyền 1024 byte dữ liệu.

Header `Range` không chỉ yêu cầu được một dải byte đơn lẻ, mà còn có thể yêu cầu đồng thời nhiều dải byte khác nhau trong một lần gửi. Cách làm này được gọi là "yêu cầu đa phạm vi" (multiple range requests).

Client muốn lấy từ byte thứ 0 đến 499 và từ byte thứ 1000 đến 1499 của tài nguyên:

```http
GET /path/to/resource HTTP/1.1
Host: example.com
Range: bytes=0-499,1000-1499
```

Server trả về nhiều dải byte, nội dung mỗi dải được phân tách bằng một ký tự phân cách (boundary):

```http
HTTP/1.1 206 Partial Content
Content-Type: multipart/byteranges; boundary=3d6b6a416f9b5

--3d6b6a416f9b5
Content-Type: application/octet-stream
Content-Range: bytes 0-499/2000

(Khối dữ liệu từ byte 0 đến 499)

--3d6b6a416f9b5
Content-Type: application/octet-stream
Content-Range: bytes 1000-1499/2000

(Khối dữ liệu từ byte 1000 đến 1499)

--3d6b6a416f9b5--
```

### Mã trạng thái 100

HTTP/1.1 bổ sung thêm status code `100`. Khi client chuẩn bị gửi một request body có kích thước lớn, nó có thể thêm header `Expect: 100-continue` vào request và ban đầu chỉ gửi phần request header. Nếu server đồng ý tiếp nhận request body, server sẽ trả về `100 Continue`, lúc này client mới tiếp tục gửi phần body; server cũng có thể trả về ngay response cuối cùng, giúp client không cần truyền tải phần request body nữa. Quy trình như hình dưới:

![HTTP/1.1 sử dụng 100 Continue để xác nhận trước khi gửi request lớn](/media/jg/local/cs-basics/network/images/http-vs-https/HTTP1.1continue1-c11a1f.png)

![Client tiếp tục gửi request body sau khi nhận được 100 Continue](/media/jg/local/cs-basics/network/images/http-vs-https/HTTP1.1continue2-a11abf.png)

HTTP/1.0 không có mã trạng thái `100 (Continue)`, cũng không có cơ chế xác nhận trước thông qua `Expect: 100-continue`; server HTTP/1.0 khi nhận được header `Expect` không nhận diện được thì phải bỏ qua nó.

### Nén dữ liệu

Nhiều định dạng dữ liệu khi truyền tải đều được nén trước. Nén dữ liệu có thể tối ưu hóa đáng kể việc sử dụng băng thông. Tuy nhiên, HTTP/1.0 cung cấp rất ít tùy chọn nén dữ liệu, không hỗ trợ lựa chọn chi tiết nén, cũng không phân biệt được nén đầu-cuối (end-to-end) hay nén từng chặng (hop-by-hop).

HTTP/1.1 đã phân biệt rõ ràng giữa mã hóa nội dung (content-codings) và mã hóa truyền tải (transfer-codings). Mã hóa nội dung luôn mang tính chất đầu-cuối (end-to-end), còn mã hóa truyền tải luôn mang tính chất từng chặng (hop-by-hop).

HTTP/1.0 có header `Content-Encoding` để mã hóa đầu-cuối cho message. HTTP/1.1 bổ sung header `Transfer-Encoding` cho phép mã hóa truyền tải từng chặng cho message. HTTP/1.1 cũng bổ sung header `Accept-Encoding`, được client sử dụng để thông báo cho server biết nó có thể xử lý những loại mã hóa nội dung nào.

## Tổng kết

1. **Phương thức kết nối**: HTTP/1.0 là kết nối ngắn, HTTP/1.1 hỗ trợ kết nối dài (persistent connection).
2. **Mã trạng thái phản hồi**: HTTP/1.1 bổ sung một lượng lớn status code mới, riêng phản hồi lỗi đã tăng thêm 24 loại. Ví dụ: `100 (Continue)` cho phép client xác nhận xem server có sẵn sàng nhận hay không trước khi gửi body dung lượng lớn; `206 (Partial Content)` là mã nhận diện cho range request; `409 (Conflict)` biểu thị request xung đột với quy định hiện tại của tài nguyên; `410 (Gone)` biểu thị tài nguyên đã biến mất vĩnh viễn.
3. **Xử lý bộ nhớ đệm (Cache)**: Trong HTTP/1.0 chủ yếu dùng `If-Modified-Since` và `Expires` trong header làm tiêu chuẩn đánh giá cache; HTTP/1.1 giới thiệu thêm nhiều chiến lược kiểm soát cache phong phú hơn, chẳng hạn như `Entity Tag` (ETag), `If-Unmodified-Since`, `If-Match`, `If-None-Match`...
4. **Tối ưu băng thông và sử dụng kết nối mạng**: Trong HTTP/1.0 có hiện tượng lãng phí băng thông, ví dụ client chỉ cần một phần dữ liệu nhưng server gửi về toàn bộ đối tượng, đồng thời không hỗ trợ tải tiếp gián đoạn (resumable download). HTTP/1.1 bổ sung trường `Range` trong request header, cho phép chỉ yêu cầu một phần tài nguyên với mã trả về là `206 (Partial Content)`, giúp lập trình viên linh hoạt tận dụng tối đa băng thông và kết nối.
5. **Xử lý Host Header**: HTTP/1.1 đã bổ sung trường `Host` vào request header.

## Tài liệu tham khảo

[Key differences between HTTP/1.0 and HTTP/1.1](http://www.ra.ethz.ch/cdstore/www8/data/2136/pdf/pd1.pdf)
