---
title: "Giải thích chi tiết cơ chế Timeout và Retry: Cấu hình Timeout, Exponential Backoff, Random Jitter, Retry Storm và Idempotency"
description: "Giải thích chi tiết cơ chế Timeout và Retry: Connect Timeout, Read Timeout, cách đặt thời gian Timeout, Retry khoảng cố định, Linear Backoff, Exponential Backoff, Random Jitter, Retry Storm, hiệu ứng tuyết lở, thiết kế tính lũy đẳng (Idempotency) và các thư viện Retry trong Java như Spring Retry, Resilience4j."
category: Độ sẵn sàng cao
icon: "mdi:reload"
tag:
  - Timeout & Retry
  - Độ sẵn sàng cao
lang: vi
sourceRef: zh-ref/high-availability/timeout-and-retry.md
head:
  - - meta
    - name: keywords
      content: cơ chế Timeout,cơ chế Retry,cấu hình Timeout,Connect Timeout,Read Timeout,Exponential Backoff,Random Jitter,Retry Storm,hiệu ứng tuyết lở,tính lũy đẳng,Idempotency,Spring Retry,Resilience4j,câu hỏi phỏng vấn Timeout Retry
---

Do những yếu tố bất định như dao động mạng (network jitter), lỗi phần cứng, bất thường tiến trình hay dịch vụ phụ thuộc ngừng hoạt động, hệ thống hoặc dịch vụ của chúng ta không bao giờ có thể đảm bảo luôn sẵn sàng 100% mọi lúc.

Để giảm thiểu tối đa tác động khi hệ thống hoặc dịch vụ gặp sự cố, ta cần sử dụng cơ chế **Timeout (Hết thời gian chờ)** và **Retry (Thử lại)**.

Tư tưởng cốt lõi của Timeout và Retry thật ra không khó hiểu, nhưng để vận dụng đúng trong môi trường production lại có rất nhiều điểm tinh tế. Hầu hết các hệ thống hay dịch vụ có lời gọi từ xa (remote call) mà bạn từng tiếp xúc đều áp dụng cơ chế Timeout và Retry. Đặc biệt với hệ thống microservices, việc thiết lập đúng Timeout và Retry vô cùng quan trọng: dịch vụ nguyên khối (monolith) thường chỉ gọi mạng tới database, cache, API bên thứ ba hay middleware, trong khi hệ thống microservices còn có thêm các lời gọi mạng giữa các service nội bộ với nhau.

## Cơ chế Timeout

![Cơ chế Timeout](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/timeout-mechanism-overview-a101fd4e.png)

### Cơ chế Timeout là gì?

**Cơ chế Timeout** nghĩa là khi một request vượt quá khoảng thời gian quy định (ví dụ 1s) mà vẫn chưa được xử lý xong, request đó sẽ bị hủy ngay lập tức và ném ra ngoại lệ hoặc mã lỗi tương ứng (ví dụ `504 Gateway Timeout`).

Những loại Timeout ta thường gặp có thể chia sơ bộ thành 2 loại sau:

| Loại Timeout        | Mô tả                                                                             | Giá trị khuyến nghị |
| ------------------- | --------------------------------------------------------------------------------- | ------------------- |
| **Connect Timeout** | Thời gian chờ tối đa để client thiết lập kết nối TCP với server                   | 1000ms ~ 5000ms     |
| **Read Timeout**    | Thời gian chờ tối đa để client đợi dữ liệu trả về từ đầu bên kia sau khi đã kết nối | 1000ms ~ 3000ms     |

Khi mới làm quen, bạn có thể hiểu Connect Timeout và Read Timeout trước, nhưng **trên môi trường production cần xem client có hỗ trợ cấu hình Timeout ở nhiều pha chi tiết hơn hay không**:

| Pha Timeout                        | Mô tả                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------- |
| DNS Resolution Timeout             | Thời gian chờ tối đa khi phân giải tên miền                             |
| Connection Pool Acquisition Timeout | Thời gian chờ tối đa để lấy được kết nối khả dụng từ connection pool   |
| Connect Timeout                    | Thời gian chờ tối đa để thiết lập kết nối TCP                           |
| TLS Handshake Timeout              | Thời gian chờ tối đa ở bước bắt tay TLS/SSL                             |
| Write Timeout                      | Thời gian chờ tối đa khi ghi phần thân request (request body)           |
| Read / Response Timeout            | Thời gian chờ tối đa khi đọc dữ liệu phản hồi                           |
| Call Timeout / Deadline            | Tổng thời gian Timeout cho toàn bộ lời gọi, bao gồm mọi giai đoạn       |
| Idle Connection Eviction Timeout   | Thời gian tồn tại tối đa của kết nối nhàn rỗi trong connection pool     |

> Phạm vi bao phủ của `read timeout`, `response timeout` và `call timeout` ở từng HTTP/RPC client khác nhau sẽ khác nhau; khi cấu hình bắt buộc phải đối chiếu tài liệu của đúng client đang dùng.

### Tại sao cần cơ chế Timeout?

Nếu không thiết lập Timeout, hệ thống rất dễ gặp tình trạng **bùng nổ số lượng kết nối phía server** và **tồn đọng hàng loạt request**.

Những kết nối và request bị ùn ứ này sẽ tiêu tốn tài nguyên hệ thống, ảnh hưởng đến việc xử lý các request mới đến. Trong trường hợp nghiêm trọng, chúng có thể kéo sập toàn bộ hệ thống hoặc dịch vụ.

> Trước đây trong một dự án thực tế tôi từng gặp sự cố tương tự: toàn bộ website không thể xử lý request bình thường, tải server gần như chạm trần. Sau đó mới phát hiện nguyên nhân là cấu hình Timeout của dự án bị sai kết hợp với lỗi xử lý request phía client, khiến số kết nối phía server vọt lên gần 400.000 — chừng đó kết nối tồn đọng đã đánh sập trực tiếp cả hệ thống.

### Nên đặt thời gian Timeout bao lâu?

Thời gian Timeout nên đặt là bao nhiêu là câu hỏi cần cân nhắc theo bối cảnh nghiệp vụ. **Đặt giá trị Timeout quá cao hay quá thấp đều tiềm ẩn rủi ro**:

| Cách cấu hình | Rủi ro                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| **Đặt quá cao** | Làm giảm hiệu lực của cơ chế Timeout, hệ thống vẫn có thể bị tồn đọng hàng loạt request chậm        |
| **Đặt quá thấp** | Khi hệ thống xử lý chậm lại (ví dụ lưu lượng tăng đột ngột), hàng loạt request bị Timeout và Retry, làm tăng áp lực hệ thống và có thể gây hiệu ứng tuyết lở (Cascading Failure) |

Thông thường, chúng tôi khuyến nghị:

- **Read Timeout**: Đối với lời gọi RPC nội bộ của các dịch vụ trực tuyến nhạy cảm với độ trễ, trước tiên có thể đặt giá trị khởi đầu dựa trên **P99/P999 Latency** lịch sử, **SLO** của luồng cốt lõi và tỷ lệ Timeout nhầm (false timeout) chấp nhận được, sau đó tinh chỉnh bằng kiểm thử tải. Chẳng hạn kinh nghiệm của AWS là: xác định trước tỷ lệ false timeout chấp nhận được (ví dụ 0.1%), rồi chọn phân vị độ trễ tương ứng (như P99.9) làm điểm khởi đầu cho Timeout.
- **Connect Timeout**: Cần phân biệt theo môi trường mạng. Gọi mạng nội bộ cùng trung tâm dữ liệu thường nên ngắn; gọi liên vùng, qua internet công cộng, qua chuỗi proxy hoặc kết nối TLS lạnh (cold connection) có thể cần dài hơn. Trong bối cảnh dùng connection pool còn cần tách biệt lần tạo kết nối đầu và tái sử dụng kết nối; khuyến nghị nằm trong khoảng **1000ms ~ 5000ms**.

**Không có viên đạn bạc nào cả!** Giá trị Timeout cụ thể nên đặt bao nhiêu vẫn phải điều chỉnh và tối ưu dần dựa trên nhu cầu và điều kiện thực tế của dự án.

Trong chuỗi lời gọi microservices, cần tuân thủ một nguyên tắc: **Timeout của downstream phải nhỏ hơn Timeout của upstream**, đồng thời chừa biên độ cho chi phí mạng và xử lý cục bộ.

Cách làm được khuyến khích hơn là truyền **Deadline hoặc Timeout Budget (ngân sách Timeout)**: request ở cổng vào có một tổng ngân sách thời gian, đi qua mỗi tầng lại trừ đi thời gian xử lý cục bộ, xếp hàng, truyền mạng và gọi downstream. Timeout của downstream phải nhỏ hơn phần ngân sách còn lại của bên gọi, chứ không phải mỗi tầng tự đoán rồi đặt cứng 3s, 2s, 1s. Nếu không, upstream đã hết giờ và trả lỗi về rồi mà downstream vẫn tiếp tục chạy những xử lý vô ích, rất dễ khuếch đại lãng phí tài nguyên.

![Truyền Timeout Budget trong chuỗi lời gọi Microservices](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/timeout-and-retry-optimized-timeout-budget-chain-de6287eb.png)

Xa hơn nữa, tham khảo tư tưởng [cấu hình động tham số Thread Pool Java của Meituan](https://tech.meituan.com/2020/04/02/java-pooling-pratice-in-meituan.html), ta cũng có thể biến Timeout thành **tham số cấu hình động** thay vì cố định; cách đơn giản là đặt giá trị Timeout vào Config Center. Nhờ đó, ta có thể điều chỉnh linh hoạt giá trị Timeout dựa trên trạng thái hệ thống hoặc dịch vụ.

> Khi điều chỉnh động cấu hình Timeout phải triển khai canary (phát hành từng phần) và theo dõi P99/P999 Latency, tỷ lệ Timeout, hàng đợi Thread Pool, thời gian chờ connection pool và lưu lượng Retry — tuyệt đối không đẩy hàng loạt ra toàn bộ hệ thống ngay lập tức.

### Mối quan hệ kết hợp giữa Timeout, Retry, Circuit Breaker và Rate Limiting

Chỉ thiết lập Timeout và Retry thôi là chưa đủ. Timeout và Retry là các biện pháp tăng khả năng phục hồi (resilience), nhưng nếu downstream lỗi kéo dài thì Retry ngược lại sẽ khuếch đại sự cố. Môi trường production thường cần kết hợp **Timeout + Retry + Circuit Breaker + Rate Limiting**:

| Cơ chế                       | Vai trò                                    | Điểm then chốt                                                    |
| ---------------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| **Timeout**                  | Giải phóng kịp thời tài nguyên đang chờ    | Tránh request tồn đọng vô hạn                                     |
| **Retry**                    | Xử lý lỗi thoáng qua                       | Bắt buộc giới hạn số lần, dùng Backoff và thêm Jitter             |
| **Rate Limiting**            | Giới hạn lượng request đi vào hệ thống     | Bảo vệ downstream không bị lưu lượng đánh sập                     |
| **Circuit Breaker (Ngắt mạch)** | Tránh tiếp tục đánh vào downstream đang lỗi | Fail-fast, tạo thời gian cho downstream hồi phục                 |
| **Bulkhead (Cô lập)**        | Giới hạn phạm vi ảnh hưởng của lỗi         | Cô lập bằng Thread Pool / Semaphore, ngăn lỗi lan truyền dây chuyền |

## Cơ chế Retry

![Cơ chế Retry](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/retry-mechanism-overview-3b33f209.png)

### Cơ chế Retry là gì?

**Cơ chế Retry** thường được dùng song hành với cơ chế Timeout, chỉ việc **gửi lại lời gọi cho cùng một ý định nghiệp vụ nhằm khắc phục các lỗi thoáng qua và lỗi ngẫu nhiên**.

- **Lỗi thoáng qua (Transient Fault)**: Lỗi bất chợt xuất hiện trong khoảnh khắc ngắn và không kéo dài.
- **Lỗi ngẫu nhiên (Intermittent Fault)**: Lỗi thi thoảng xảy ra trong một số điều kiện nhất định, tần suất thường thấp.

Retry là thực hiện lại lời gọi cho cùng một ý định nghiệp vụ chứ không nhất thiết phải giống hệt nhau từng byte của request. Vì thế khi liên quan đến chữ ký số, timestamp, stream của request body hoặc idempotency key, phải đảm bảo request retry vẫn hợp lệ và vẫn được nhận diện là cùng một thao tác nghiệp vụ.

Tư tưởng cốt lõi của Retry là **tiêu tốn thêm tài nguyên để nâng cao tối đa xác suất request được xử lý thành công**. Khi tần suất lỗi thoáng qua thấp và số lượng client ít, tải phát sinh thêm từ Retry thường kiểm soát được; nhưng khi tỷ lệ lỗi tăng cao hoặc lượng lớn client đồng loạt Retry, lưu lượng Retry có thể trở thành giọt nước tràn ly đánh sập hệ thống downstream — đó chính là **Retry Storm (Bão Retry)** sẽ bàn ở phần sau.

### Các chiến lược Retry phổ biến là gì?

So sánh các chiến lược Retry phổ biến:

| Chiến lược                            | Mô tả                                                       | Ưu điểm                           | Nhược điểm                                                     | Kịch bản phù hợp                                       |
| ------------------------------------- | ----------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Retry khoảng cố định (Fixed Interval)** | Khoảng cách giữa các lần Retry giống nhau (vd mỗi 1s)    | Triển khai đơn giản               | Có thể gây ra Retry Storm                                      | Thời gian phục hồi của hệ thống đích ổn định, đoán trước được |
| **Linear Backoff**                    | Khoảng nghỉ tăng tuyến tính (vd 1s, 2s, 3s)                 | Nhẹ nhàng hơn khoảng cố định      | Tốc độ tăng thời gian chờ hơi chậm                             | Các kịch bản thông thường                              |
| **Exponential Backoff**               | Khoảng nghỉ tăng theo cấp số nhân (vd 1s, 2s, 4s, 8s)       | Nhẹ nhàng hơn khoảng cố định      | Nhiều client vẫn có thể Retry đồng bộ; thời gian chờ có thể quá lâu | Thời gian phục hồi của hệ thống đích dài hoặc khó đoán |
| **Exponential Backoff kèm Jitter**    | Thêm độ nhiễu ngẫu nhiên trên nền Exponential Backoff       | Tránh nhiều client Retry cùng lúc | Triển khai phức tạp hơn đôi chút                               | Khuyến nghị cho hệ thống phân tán                      |

**Trong hệ thống phân tán, thường ưu tiên dùng chiến lược Exponential Backoff kèm Jitter.** Jitter có thể triển khai theo dạng *full jitter* (ngẫu nhiên toàn phần), *equal jitter* (nhiễu chia đều) hoặc *decorrelated jitter* (nhiễu khử tương quan), tất cả đều nhằm phân tán các lần Retry đồng thời của nhiều client.

![So sánh dòng thời gian bốn chiến lược Retry](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/timeout-and-retry-optimized-retry-strategies-tim-acd358d3.png)

### Số lần Retry nên cấu hình bao nhiêu?

Số lần Retry không nên quá nhiều, nếu không vẫn sẽ gây áp lực lớn lên tải hệ thống.

**Với các request đồng bộ trực tuyến, số lần Retry thường phải rất tiết chế, phổ biến là 1–3 lần.** Ví dụ nếu chúng ta Retry 3 lần:

- Sau khi lần gọi thứ 1 thất bại, đợi 1 giây rồi Retry
- Sau khi lần gọi thứ 2 thất bại, đợi 2 giây rồi Retry
- Sau khi lần gọi thứ 3 thất bại, đợi 4 giây rồi Retry

Tác vụ bất đồng bộ hoặc consumer của MQ có thể Retry nhiều lần hơn, nhưng bắt buộc phải đi kèm Backoff, giới hạn số lần tối đa, Dead Letter Queue (DLQ), cảnh báo và cơ chế bù trừ thủ công.

Không phải cứ Retry nhiều lần là tốt. Giả sử Read Timeout là 1.5s, Retry 3 lần với Exponential Backoff là 1s, 2s, 4s thì trong trường hợp xấu nhất tổng thời gian tiêu tốn khoảng `1.5s × 4 + 1s + 2s + 4s = 13s`. Với request đồng bộ trực tuyến, độ trễ đuôi này gần như không thể chấp nhận được. Do đó, thao tác đọc có thể Retry tích cực hơn một chút, thao tác ghi bắt buộc phải đi kèm thiết kế Idempotency, còn các luồng không cốt lõi hoàn toàn có thể chọn fail-fast.

### Chỉ Retry những lỗi có thể Retry

Bước then chốt nhất để đưa Retry vào thực tế là **phân biệt lỗi có thể Retry và lỗi không nên Retry**. Retry mù quáng vừa lãng phí tài nguyên vừa làm sự cố trầm trọng thêm:

| Phân loại            | Kịch bản điển hình                                         | Cách xử lý                               |
| -------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| **Có thể Retry**     | Connect Timeout, Read Timeout, ngắt kết nối, lỗi tạm thời 502/503/504 | Retry kết hợp chiến lược Backoff         |
| **Có thể Retry**     | Mã 429 sau khi bị Rate Limiting có kèm header `Retry-After` | Chờ theo `Retry-After` rồi mới Retry     |
| **Retry thận trọng** | Thao tác ghi như thanh toán, đặt hàng, trừ tồn kho, phát voucher | Bắt buộc có Idempotency Key hoặc ràng buộc duy nhất |
| **Không nên Retry**  | Lỗi tham số (400), lỗi phân quyền (401/403), lỗi quy tắc nghiệp vụ | Trả lỗi trực tiếp                        |
| **Không nên Retry**  | Ngoại lệ nghiệp vụ như số dư không đủ, hết tồn kho        | Trả lỗi trực tiếp                        |

Thông thường chỉ Retry các lỗi timeout, đứt kết nối, 5xx tạm thời và phản hồi sau Rate Limiting cho phép thử lại; không Retry lỗi kiểm tra tham số, lỗi xác thực/phân quyền, lỗi quy tắc nghiệp vụ, các mã 4xx rõ ràng cũng như những thao tác ghi không đảm bảo được tính lũy đẳng.

![Trước khi Retry phải kiểm tra: Loại lỗi + Tính lũy đẳng của thao tác](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/timeout-and-retry-optimized-retry-idempotency-de-e36842e9.png)

### Những rủi ro của cơ chế Retry là gì?

Cơ chế Retry tuy nâng cao tính sẵn sàng của hệ thống nhưng nếu dùng sai sẽ kéo theo rủi ro:

| Rủi ro                  | Mô tả                                                                   | Cách phòng tránh                               |
| ----------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| **Retry Storm (Bão Retry)** | Hàng loạt client Retry cùng lúc, tiếp tục đánh sập dịch vụ downstream | Dùng Exponential Backoff kèm Jitter            |
| **Hiệu ứng tuyết lở (Cascading Failure)** | Retry khiến upstream cũng bị Timeout và Retry theo, tạo phản ứng dây chuyền | Đặt Retry Budget và cơ chế Circuit Breaker     |
| **Thực thi trùng lặp**  | Thao tác không lũy đẳng bị chạy nhiều lần dẫn đến sai lệch dữ liệu      | Đảm bảo tính lũy đẳng (Idempotency)            |
| **Lãng phí tài nguyên** | Retry vô nghĩa đối với các lỗi mang tính vĩnh viễn                      | Phân biệt lỗi có thể Retry và lỗi không thể Retry |

**Retry Budget (Ngân sách Retry)** là một chiến lược phòng tránh rất hiệu quả: giới hạn tỷ lệ số lần Retry trên tổng số request trong một cửa sổ thời gian nhất định, ví dụ không vượt quá 10%. Khi triển khai, có thể thống kê số request gốc và số request Retry theo từng bên gọi, từng API hoặc từng dịch vụ downstream; khi tỷ lệ Retry vượt quá ngân sách, các request sau sẽ fail-fast hoặc chỉ cho phép lần gọi đầu tiên, không Retry nữa.

![Retry Storm: Khuếch đại lượng request theo tầng](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/timeout-and-retry-optimized-retry-storm-cascade-d902db5c.png)

### Tại sao Retry bắt buộc phải xét đến Idempotency (Tính lũy đẳng)?

Khi áp dụng Timeout và Retry trong dự án thực tế, cần bảo đảm **một thao tác dù thực thi một lần hay nhiều lần đều tạo ra tác động giống hệt nhau lên trạng thái hệ thống** — đó chính là tính lũy đẳng (Idempotency). Khử trùng lặp (deduplication) là ngăn không cho thực thi lặp lại, còn Idempotency là cho phép request trùng lặp đi tới nhưng đảm bảo kết quả nhất quán; hai khái niệm này thường được phối hợp cùng nhau.

Trong trường hợp nào một request bị thực thi nhiều lần? Client chờ server xử lý xong bị Timeout, nhưng lúc đó server thực chất đã thực thi xong request rồi, chỉ là do mạng chập chờn thoáng qua khiến response trả về cho client bị chậm.

> Ví dụ: Người dùng thanh toán mua một khóa học, nhưng do cơ chế Retry khiến request thanh toán gửi lại làm người dùng bị trừ tiền hai lần cho cùng một khóa học. Với tình huống này, khi xử lý yêu cầu mua khóa học ta cần kiểm tra xem người dùng đã mua khóa học đó hay chưa, nhờ vậy sẽ không xảy ra việc mua trùng do Retry.

Các cách phổ biến để triển khai Idempotency:

| Phương pháp                      | Mô tả                                                          | Kịch bản phù hợp             |
| -------------------------------- | -------------------------------------------------------------- | ---------------------------- |
| **Request ID duy nhất**          | Mỗi request mang theo một ID duy nhất, server thực hiện khử trùng lặp | Kịch bản tổng quát           |
| **Ràng buộc duy nhất trong DB**  | Tận dụng Unique Index của database để ngăn chèn bản ghi trùng  | Thao tác tạo mới (Create)    |
| **Khóa lạc quan (Optimistic Lock)** | Kiểm soát cập nhật thông qua số phiên bản (version)          | Thao tác cập nhật (Update)   |
| **Máy trạng thái (State Machine)** | Kiểm soát theo luồng chuyển trạng thái; trạng thái đã xử lý không xử lý lại | Đơn hàng, thanh toán...      |

Xét về ngữ nghĩa HTTP, RFC 9110 định nghĩa `PUT`, `DELETE` và các safe method (`GET`, `HEAD`, `OPTIONS`, `TRACE`) là các phương thức có tính lũy đẳng. `POST` mặc định không mang ngữ nghĩa lũy đẳng, nhưng vẫn có thể đạt Idempotency ở tầng nghiệp vụ nhờ Idempotency Key hoặc ràng buộc duy nhất. Tuy vậy, ngữ nghĩa giao thức không đồng nghĩa cách triển khai phía server mặc nhiên an toàn; với các thao tác có tác dụng phụ như tạo đơn, trừ tiền, phát voucher, gửi tin nhắn, phía server vẫn bắt buộc phải thiết kế Idempotency tường minh.

### Triển khai Retry trong Java như thế nào?

Nếu muốn tự viết code xử lý Retry, có thể dùng vòng lặp `for` / `while` hoặc đệ quy. Tuy nhiên, thông thường không khuyến khích tự viết thủ công vì đã có nhiều thư viện mã nguồn mở cung cấp cơ chế Retry hoàn chỉnh hơn rất nhiều:

| Framework                           | Đặc điểm                                                 | Phiên bản mới nhất | Kịch bản phù hợp                                                        |
| ----------------------------------- | -------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| **Spring Retry**                    | Hệ sinh thái Spring, hướng annotation, cấu hình đơn giản | 2.0.12             | Dự án Spring Boot 2.x/3.x                                               |
| **Retry tích hợp Spring Framework 7** | Hỗ trợ sẵn `@Retryable`, không cần thêm dependency ngoài | Spring Framework 7 | Dự án Spring Boot 4.x                                                   |
| **Resilience4j**                    | Gọn nhẹ, phong cách hàm, hỗ trợ Circuit Breaker, Rate Limiting... | 2.4.0              | Dự án Microservices                                                     |
| **Failsafe**                        | Không dependency ngoài, hỗ trợ Retry bất đồng bộ, Timeout, Circuit Breaker... | 3.3.2              | Kịch bản cần kiểm soát chi tiết                                         |
| **Guava Retrying**                  | Cấu hình chiến lược Retry linh hoạt                      | 2.0.0              | Dự án Java nói chung (⚠️ Đã ngừng cập nhật lâu, không thuộc module lõi chính thức của Guava; cần đánh giá tình trạng bảo trì trước khi dùng) |

#### Ví dụ Spring Retry

Ví dụ đơn giản sử dụng Spring Retry:

```java
@Configuration
@EnableRetry
public class RetryConfig {
}

@Retryable(
    retryFor = {RestClientException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 1000, multiplier = 2)
)
public String callRemoteService(String requestId) {
    return remoteClient.call(requestId);
}

@Recover
public String recover(RestClientException e, String requestId) {
    // Logic dự phòng sau khi đã thử lại hết số lần
    return "fallback";
}
```

Tham số đầu tiên của `@Recover` là kiểu ngoại lệ, các tham số tiếp theo phải khớp với tham số của phương thức `@Retryable`; Spring Retry khớp phương thức khôi phục dựa vào kiểu tham số.

Lưu ý rằng:

- `@Retryable` hoạt động dựa trên Spring AOP proxy; gọi nội bộ trong cùng một lớp qua `this.method()` sẽ **không** kích hoạt Retry mà bắt buộc phải gọi thông qua đối tượng proxy do Spring quản lý.
- Trong hệ sinh thái **Spring Boot 3.x / Spring Framework 6**, ưu tiên kiểm tra tính tương thích giữa Spring Retry 2.x với phiên bản Spring của dự án và Java 17+, tránh dùng lẫn phiên bản cũ.
- Từ **Spring Boot 4.x / Spring Framework 7** trở đi, khả năng Retry đã được tích hợp sẵn vào `spring-core`, kích hoạt bằng `@EnableResilientMethods` mà không cần thêm dependency `spring-retry`. Dự án Spring Retry đã chuyển sang chế độ chỉ bảo trì (maintenance only) và không còn tiếp nhận tính năng mới.

#### Ví dụ Resilience4j Retry

```java
RetryConfig config = RetryConfig.custom()
    .maxAttempts(3)
    .waitDuration(Duration.ofMillis(1000))
    .retryOnException(e -> e instanceof SocketTimeoutException
        || e instanceof ConnectException)
    .ignoreExceptions(BusinessException.class, AuthException.class)
    .intervalFunction(IntervalFunction.ofExponentialBackoff(1000, 2))
    .build();

Retry retry = Retry.of("remoteService", config);

// Lấy sự kiện retry phục vụ giám sát
retry.getEventPublisher()
    .onRetry(event -> log.warn("Retry attempt {}", event.getNumberOfRetryAttempts()));

String result = Retry.decorateSupplier(retry, () -> remoteClient.call(requestId))
    .get();
```

Khi kết hợp `Retry` với `CircuitBreaker`, cần chú ý thứ tự bọc decorator vì nó ảnh hưởng đến phạm vi thống kê: `Retry.decorateSupplier(CircuitBreaker.decorateSupplier(supplier))` có nghĩa là nếu Retry thành công thì sẽ không mở Circuit Breaker, còn bọc ngược lại thì mỗi lần Retry đều đi qua thống kê của Circuit Breaker.

## Các chỉ số quan sát trên Production

Sau khi đưa Timeout và Retry lên production bắt buộc phải kiểm chứng bằng chỉ số, nếu không sẽ rất khó phát hiện các sự cố như Retry Storm. Dưới đây là những chỉ số quan sát trọng tâm:

| Nhóm chỉ số      | Chỉ số cụ thể                                                      |
| ---------------- | ------------------------------------------------------------------ |
| Lưu lượng request | QPS request gốc, QPS request Retry, tỷ lệ Retry                   |
| Độ trễ (Latency) | P99 / P999 Latency, tỷ lệ Timeout                                  |
| Tỷ lệ thành công | Tỷ lệ thành công cuối cùng, tỷ lệ thành công ngay lần đầu          |
| Sức khỏe downstream | Số lượng lỗi 5xx của downstream, số lần bị Rate Limiting, trạng thái Circuit Breaker |
| Tài nguyên       | Độ sâu hàng đợi Thread Pool, thời gian chờ connection pool, số kết nối đang hoạt động |
| Ngân sách Retry  | Tỷ lệ tiêu thụ Retry Budget                                        |

## Tài liệu tham khảo

- Quản trị thiết lập Timeout giữa các lời gọi trong Microservices: <https://www.infoq.cn/article/eyrslar53l6hjm5yjgyx>
- Timeout, Retry và Backoff kèm Jitter (AWS Builders' Library): <https://aws.amazon.com/cn/builders-library/timeouts-retries-and-backoff-with-jitter/>
- AWS Architecture Blog - Exponential Backoff and Jitter: <https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/>
- RFC 9110 - HTTP Semantics: <https://www.rfc-editor.org/rfc/rfc9110>
