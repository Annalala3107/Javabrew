---
title: "Nhập môn Performance Testing và Stress Testing: RPS, QPS, TPS, P99 và các công cụ kiểm thử tải"
description: "Hướng dẫn nhập môn kiểm thử hiệu năng (Performance Testing), giải thích RPS, QPS, TPS, RT, P90/P99/P999, Little's Law, đánh giá dung lượng, đường cong gậy khúc côn cầu (Hockey Stick Curve), kiểm chứng backpressure và tự phục hồi, cùng các loại Load Test, Stress Test, Soak Test và công cụ như JMeter, Gatling, k6, Locust, ab, wrk."
category: Độ sẵn sàng cao
icon: "mdi:speedometer"
tag:
  - Performance Testing
  - Stress Testing
lang: vi
sourceRef: zh-ref/high-availability/performance-test.md
head:
  - - meta
    - name: keywords
      content: kiểm thử hiệu năng,Performance Testing,kiểm thử áp lực,Stress Testing,Load Test,Soak Test,RPS,QPS,TPS,RT thời gian phản hồi,Latency,P99,đánh giá dung lượng,độ đồng thời,thông lượng,backpressure,Little's Law,JMeter,Gatling,k6,Locust,ab,wrk,câu hỏi phỏng vấn kiểm thử hiệu năng
---

Kiểm thử hiệu năng thường do đội ngũ QA/kiểm thử chuyên trách đảm nhận, vậy tại sao lập trình viên chúng ta vẫn cần học mảng này? Hiểu rõ các chỉ số hiệu năng, phân loại kiểm thử cũng như công cụ đo kiểm sẽ giúp chúng ta viết ra phần mềm có hiệu năng tốt hơn; ngoài ra ở vai trò lập trình viên, nếu bạn biết làm kiểm thử hiệu năng thì đó chắc chắn cũng là một điểm cộng lớn cho CV của bạn.

Bài viết này tổng hợp kinh nghiệm thực tế của tác giả cùng những kiến thức học hỏi từ đội ngũ kiểm thử, kết hợp tham khảo từ một số đầu sách hay, hy vọng sẽ hữu ích với bạn.

Khi mọi người nói chung là "chạy load test / ép tải", phần lớn thực chất là đang chỉ công việc liên quan đến kiểm thử hiệu năng: dùng công cụ giả lập request người dùng, quan sát thông lượng (throughput), thời gian phản hồi, tỷ lệ lỗi và mức sử dụng tài nguyên của hệ thống dưới các mức tải khác nhau. Khi thực sự tiến hành kiểm thử tải, trước hết cần nói rõ lần này muốn kiểm chứng điều gì.

## Các vai trò khác nhau nhìn nhận hiệu năng website ra sao?

### Người dùng

Khi người dùng mở một trang web, họ quan tâm nhất điều gì? Dĩ nhiên là **tốc độ phản hồi nhanh hay chậm của trang web**. Ví dụ khi bấm vào trang chủ Taobao thì mất bao lâu để nội dung trang chủ hiển thị trước mắt, bấm nút đặt hàng thì mất bao lâu để trả về kết quả...

Vì vậy, khi trải nghiệm hệ thống, người dùng thường dựa vào tốc độ phản hồi nhanh hay chậm để đánh giá hiệu năng của website.

### Lập trình viên (Developer)

Cả người dùng lẫn lập trình viên đều quan tâm đến tốc độ — tốc độ này thực chất chính là **tốc độ xử lý request người dùng của hệ thống**.

Thông thường lập trình viên rất khó đánh giá trực quan hiệu năng trang web của mình, nên ta hay ước lượng một mức tương đối dựa trên kiến trúc và hạ tầng hiện tại, chẳng hạn như:

1. Kiến trúc dự án có phải là phân tán không?
2. Đã sử dụng cache và message queue chưa?
3. Các nghiệp vụ đồng thời cao (high concurrency) có được xử lý đặc biệt không?
4. Thiết kế cơ sở dữ liệu có hợp lý không?
5. Thuật toán dùng trong hệ thống có cần tối ưu thêm không?
6. Hệ thống có tồn tại vấn đề rò rỉ bộ nhớ (Memory Leak) không?
7. Redis cache dùng trong dự án lớn cỡ nào? Cấu hình server ra sao? Đang dùng ổ cứng cơ (HDD) hay ổ SSD?
8. ......

### Kiểm thử viên (Tester / QA)

QA thường sử dụng các công cụ kiểm thử hiệu năng để đo kiểm, sau đó lập thành một bảng báo cáo. Bảng này thường bao gồm những nội dung quan trọng sau:

1. Thời gian phản hồi (Response Time / Latency);
2. Tỷ lệ request thành công;
3. Thông lượng (Throughput);
4. ......

### Vận hành hệ thống (Ops)

Đội ngũ vận hành có xu hướng dựa vào **mức độ sử dụng hạ tầng và tài nguyên** để đánh giá hiệu năng website — chẳng hạn tài nguyên server được sử dụng có hợp lý không, tài nguyên database có đang bị lạm dụng không. Dĩ nhiên đó là mô hình Ops truyền thống; hiện nay khi DevOps bùng nổ thì rất ít người chỉ làm Ops thuần túy, nhưng ở đây ta vẫn tạm tách riêng vai trò này.

## Những điểm cần lưu ý khi kiểm thử hiệu năng

Hầu như rất ít bài viết về kiểm thử hiệu năng nhắc đến vấn đề này; mọi người thường chỉ nói cách chạy test và các chỉ số hiệu năng là gì.

### Xác định rõ mục tiêu kiểm thử tải

Trước khi chạy kiểm thử tải phải làm rõ mục tiêu, nếu không rất dễ rơi vào tình trạng "công cụ cũng đã chạy, báo cáo cũng đã xuất, nhưng không biết kết luận là gì".

Mục tiêu phổ biến có ba nhóm:

1. **Đánh giá dung lượng trước khi lên production**: Kiểm chứng cấu hình máy hiện tại, số lượng instance, cấu hình database và chiến lược cache có đủ sức gánh lưu lượng dự kiến hay không.
2. **Kiểm chứng hiệu quả sau tối ưu**: Xác nhận sau khi chỉnh sửa slow SQL, bổ sung cache, tinh chỉnh Thread Pool, tham số JVM hay điều chỉnh kiến trúc thì thông lượng, RT và tỷ lệ lỗi có thực sự cải thiện hay không.
3. **Định vị điểm nghẽn (Bottleneck)**: Tăng tải từng bước để quan sát CPU, bộ nhớ, GC, database connection pool, Thread Pool, tồn đọng MQ... nhằm tìm ra mắt xích nào không chịu nổi đầu tiên.

Ba mục tiêu này tương ứng với các cách tiếp cận khác nhau. Đánh giá dung lượng quan tâm ngưỡng đỉnh và mức dự phòng an toàn; kiểm chứng tối ưu chú trọng so sánh trước và sau; còn định vị điểm nghẽn cần hệ thống giám sát và tracing chi tiết hơn.

### Hiểu rõ kịch bản nghiệp vụ của hệ thống

**Trước khi kiểm thử hiệu năng, bạn càng cần hiểu rõ kịch bản nghiệp vụ hiện tại của hệ thống.** Nếu hiểu chưa đủ sâu về nghiệp vụ, chúng ta rất dễ phạm sai lầm là test lệch hướng, dẫn đến bỏ sót những phần thực sự cần kiểm thử hiệu năng.

Ví dụ hệ thống của ta cung cấp tính năng gửi email: sau khi người dùng cấu hình email thành công chỉ cần nhập địa chỉ nhận là gửi được, mỗi ngày hệ thống xử lý khoảng vài chục nghìn lượt gửi email. Nhiều người thấy vậy có thể mang ngay công cụ ra test API gửi email. Thế nhưng, kịch bản gửi email chưa chắc đã là điểm nghẽn hiệu năng của hệ thống; với lượng người dùng lớn và gửi đồng thời như vậy, rất có thể quản lý người dùng (User Management) mới thực sự là điểm nghẽn!

### Dữ liệu lịch sử cực kỳ hữu ích

Dữ liệu lịch sử tích lũy từ hệ thống hiện tại rất quan trọng. Thông thường, qua dữ liệu lịch sử ta có thể bước đầu xác định API nào được gọi nhiều nhất, service nào chịu tải nặng nhất, từ đó tập trung kiểm thử và phân tích hiệu năng kỹ hơn ở những vị trí này.

Ngoài ra, những điểm đó cũng giống như mắt xích yếu của hệ thống — tối ưu tốt chúng sẽ mang lại bước nhảy vọt rõ rệt cho toàn bộ hệ thống.

### Mô hình request phải bám sát lưu lượng thực tế nhất có thể

Kiểm thử đơn lẻ một API chỉ phản ánh khả năng của riêng API đó trong điều kiện kịch bản hiện tại, không thể đại diện trực tiếp cho dung lượng thật của cả hệ thống. Khi người dùng thật truy cập hệ thống, họ thường đăng nhập, duyệt xem, tra cứu, đặt hàng, thanh toán hoặc gửi biểu mẫu — giữa các API có trình tự, tỷ lệ gọi và sự phụ thuộc dữ liệu lẫn nhau.

Vì thế, kịch bản kiểm thử tải nên được thiết kế theo luồng nghiệp vụ thực tế: API tần suất cao thì bắn nhiều hơn, API tần suất thấp bắn ít hơn; hệ thống đọc nhiều ghi ít không nên đẩy tỷ lệ API ghi lên quá cao; những API cần xác thực, tồn kho, chuyển trạng thái đơn hàng cũng cần chuẩn bị trước dữ liệu test hợp lệ. Nếu không, dù khi test đo được QPS rất cao thì lên production gặp lưu lượng thật vẫn có thể gặp sự cố.

### Chuẩn bị sẵn cơ chế dừng khẩn cấp

Trước khi bắt đầu chạy tải — đặc biệt là chạy kiểm thử trên môi trường thật — bắt buộc phải chuẩn bị sẵn công cụ dừng và các ngưỡng bảo vệ như QPS tối đa, số đồng thời tối đa, ngưỡng tỷ lệ lỗi, ngưỡng P99 RT, ngưỡng CPU/bộ nhớ, ngưỡng database connection pool...

Ngay khi hệ thống xuất hiện lỗi 5xx hàng loạt, RT tăng vọt liên tục, hàng đợi ùn tắc không giảm hoặc cạn kiệt kết nối database, phải lập tức dừng việc bắn tải hoặc kích hoạt ngắt mạch tự động. Mục đích của kiểm thử tải là phát hiện vấn đề, không phải đánh sập dịch vụ production.

## Các chỉ số hiệu năng phổ biến

Khi làm kiểm thử tải, không thể nhìn các chỉ số một cách tách rời. Phải đặt RT, thông lượng và số đồng thời (concurrency) cạnh nhau thì mới đánh giá được hệ thống đang xử lý request bình thường hay đã bắt đầu xếp hàng chờ.

![Mối quan hệ giữa QPS, Concurrency và RT](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/performance-test-metrics-relation-f97d288a.png)

### Thời gian phản hồi (Response Time / Latency)

Trước hết cần phân biệt vị trí quan sát thời gian phản hồi. Với kiểm thử API backend, **Thời gian phản hồi RT (Response Time / Latency)** thường tính từ lúc client kiểm thử gửi request cho tới khi nhận được response, bao gồm truyền tải mạng, gateway, xử lý ở server và trả kết quả về. Còn với trang web frontend, cảm nhận của người dùng còn chịu ảnh hưởng bởi phân tích HTML, thực thi JS, tải tài nguyên, render và độ trễ tương tác — những vấn đề này phù hợp phân tích bằng Lighthouse, Chrome DevTools, WebPageTest... hơn.

RT trung bình chỉ cho thấy xu hướng chung; cảm nhận người dùng dễ bị ảnh hưởng nhất bởi nhóm request đuôi dài (long-tail) như P95 hay P99. Kiểm thử API và giám sát trên production thường xem đồng thời **P50, P90, P95, P99**; với luồng cốt lõi có mẫu đủ lớn thì xem thêm **P999**.

Ví dụ `P99 = 500ms` nghĩa là 99% request trả về trong vòng 500ms. 1% request chậm còn lại có thể bắt nguồn từ Cache Miss, slow SQL hoặc GC Stop-The-World (STW); chúng chiếm giữ kết nối và worker thread trong thời gian dài. Khi đồng thời cao, Thread Pool bị lấp đầy, request mới bắt đầu xếp hàng hoặc bị từ chối; nếu phía gọi (upstream) tiếp tục timeout rồi Retry thì lưu lượng còn bị khuếch đại thêm. Trong khi đó, lượng lớn request cực nhanh sẽ kéo giá trị trung bình xuống thấp, khiến vấn đề đuôi dài bị RT trung bình che khuất.

Bảng dưới đây chỉ là mục tiêu ví dụ cho một API trực tuyến độ trễ thấp, không phải tiêu chuẩn chung cho mọi hệ thống:

| Phân vị | Mục tiêu ví dụ | Ý nghĩa                                                |
| ------- | -------------- | ------------------------------------------------------ |
| P90     | < 200ms        | Trải nghiệm bình thường của đa số người dùng           |
| P99     | < 500ms        | Trải nghiệm đuôi dài và rủi ro chiếm giữ thread        |
| P999    | < 1s           | Đuôi dài cực đoan trên luồng cốt lõi lưu lượng lớn     |

Các ngưỡng này tốt nhất nên suy ra từ SLO nghiệp vụ, yêu cầu trải nghiệm người dùng, timeout của upstream, năng lực của dịch vụ downstream và đường cơ sở lịch sử. Ngoài ra, P999 khá nhạy với kích thước mẫu: nếu một lần test chỉ có vài nghìn request thì P999 rất dễ bị nhiễu bởi dao động ngẫu nhiên; nếu bản thân API có QPS rất thấp thì ý nghĩa thống kê của P999 cũng hạn chế. Với những API đó có thể ưu tiên xem P99 trước hoặc kéo dài thời gian chạy tải để thu thập thêm mẫu.

> **Mô hình lỗi (Failure Mode)**: Khi downstream dao động bất thường khiến P999 tăng vọt, nếu upstream không có Timeout, Rate Limiting và Circuit Breaker hợp lý, các request sẽ giữ kết nối, thread hoặc coroutine quá lâu. Kết hợp thêm Retry, rất dễ xảy ra cạn kiệt Thread Pool, cạn kiệt connection pool, tồn đọng hàng đợi, tỷ lệ lỗi tăng cao và ở trường hợp nghiêm trọng có thể dẫn tới `OOM`.

### Số lượng đồng thời (Concurrency)

**Số lượng đồng thời (Concurrency) là số lượng request mà hệ thống đang xử lý tại cùng một thời điểm.**

Concurrency phản ánh **năng lực gánh tải** của hệ thống. Cần chú ý phân biệt các khái niệm sau:

- **Số người dùng đồng thời (Concurrent Users)**: Số người dùng đang trực tuyến cùng lúc.
- **Số request đồng thời (Concurrent Requests)**: Số request hệ thống đang xử lý tại cùng một thời điểm.
- **Độ đồng thời tối đa (Max Concurrency)**: Số request đồng thời tối đa mà hệ thống chịu được; vượt ngưỡng này hiệu năng có thể suy giảm hoặc hệ thống bị sập.

### RPS, QPS và TPS

- **RPS (Requests Per Second)**: Số lượng HTTP/RPC request mà server xử lý mỗi giây, phù hợp hơn cho kiểm thử API.
- **QPS (Queries Per Second)**: Số lượt truy vấn (query) mà server xử lý mỗi giây, thường dùng cho truy vấn database, tìm kiếm và cũng hay được dùng rộng rãi như thông lượng request nói chung.
- **TPS (Transactions Per Second)**: Số giao dịch nghiệp vụ (transaction) mà server hoàn tất mỗi giây, ví dụ một lần đặt hàng, một lần thanh toán, một lần đăng ký.

> QPS vs TPS: TPS thiên về ngữ nghĩa nghiệp vụ hơn. Chẳng hạn một lần đặt hàng có thể tính là 1 TPS, nhưng phía sau nó có thể bao gồm kiểm tra tồn kho, tạo đơn, trừ tồn kho và gọi thanh toán — tương ứng 4 HTTP/RPC request, đối với backend service có thể là 4 RPS và còn sinh ra nhiều lượt QPS database hơn nữa.

### Thông lượng (Throughput)

**Thông lượng (Throughput)** chỉ số lượng request mà hệ thống xử lý được trong một đơn vị thời gian. RPS, QPS, TPS đều là các chỉ số định lượng phổ biến.

**Little's Law (Định luật Little)**: Ở trạng thái ổn định khi hệ thống chưa bão hòa, `Số request trung bình đang xử lý ≈ Thông lượng × Thời gian phản hồi trung bình`. Trong đó, số đồng thời ở đây là số request trung bình đang được xử lý hoặc xếp hàng trong hệ thống (không phải số người dùng online); RT dùng thời gian phản hồi trung bình (không phải P99); thông lượng dùng tốc độ hoàn tất request trung bình.

Ví dụ: QPS trung bình là 500, RT trung bình là 200ms (0.2s), thì số request đang xử lý đồng thời trong hệ thống xấp xỉ `500 × 0.2 = 100`.

Công thức này chỉ áp dụng được trong vùng đáp ứng tuyến tính. Khi concurrency tiếp tục tăng lên, lập lịch CPU, tranh chấp khóa (Lock Contention) và thời gian xếp hàng sẽ cộng hưởng khuếch đại lẫn nhau; RT tăng phi tuyến tính còn thông lượng sau khi chạm điểm uốn sẽ đi ngang hoặc thậm chí đi xuống. Hình "Đường cong gậy khúc côn cầu" (Hockey Stick Curve) dưới đây minh họa hiện tượng này: qua điểm uốn, QPS không tăng mà giảm, cho thấy hệ thống đã bước vào vùng phi tuyến tính.

![Đường cong Hockey Stick giữa QPS và Concurrency](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/performance-test-hockey-stick-curve-1b133478.png)

Vì vậy, dung lượng production không thể chỉ suy đoán bằng công thức mà phải kiểm chứng giới hạn thực tế qua kiểm thử tải toàn trình (Full-link Performance Testing).

## Các chỉ số mức độ hoạt động của hệ thống

### PV (Page View)

**Lượt xem trang**, tức số lượt mở hoặc click trang web của người dùng; trong một chu kỳ thống kê nhất định, mỗi lần người dùng mở hoặc làm mới (refresh) một trang thì ghi nhận 1 PV, mở hoặc làm mới nhiều lần cùng một trang sẽ cộng dồn. PV được thống kê theo góc độ số lần mở/làm mới trang.

### UV (Unique Visitor)

**Khách truy cập duy nhất**, thống kê số người dùng riêng biệt truy cập một trang web trong vòng 1 ngày. Trong 1 ngày, cùng một khách truy cập vào website nhiều lần cũng chỉ tính là 1 UV. UV được thống kê theo góc độ từng cá nhân người dùng.

### DAU (Daily Active Users)

**Số người dùng hoạt động hàng ngày**, chỉ số lượng người dùng (đã khử trùng lặp) đăng nhập hoặc sử dụng sản phẩm trong vòng một ngày.

### MAU (Monthly Active Users)

**Số người dùng hoạt động hàng tháng**, chỉ số lượng người dùng (đã khử trùng lặp) đăng nhập hoặc sử dụng sản phẩm trong vòng một tháng.

### Ví dụ tính toán thực chiến

> **Đánh giá dung lượng chuẩn production**: Nếu chỉ lấy DAU nhân với một hệ số cố định để ước lượng tải đỉnh thì rất dễ đánh giá thấp lưu lượng trong các chiến dịch khuyến mãi. Với các kịch bản như flash sale đúng giờ hay mở bán đại tiệc khuyến mãi, lưu lượng đỉnh thường không nằm cùng bậc độ lớn với lưu lượng trung bình ngày. Ta có thể dùng lượng request trung bình ngày trong lịch sử để ước tính QPS trung bình ngày, sau đó nhân với hệ số đỉnh nghiệp vụ (ví dụ gấp 3–10 lần trung bình ngày tùy đặc thù nghiệp vụ) để ra QPS đỉnh sơ bộ, rồi dùng Little's Law suy ngược ra concurrency mục tiêu và cộng thêm 1.5–2 lần biên độ dự phòng an toàn. Kết quả này chỉ nên coi là điểm xuất phát cho mục tiêu kiểm thử; cuối cùng vẫn phải thông qua **kiểm thử tải toàn trình** (kết hợp ghi lại và phát lại lưu lượng thật bằng công cụ như [GoReplay](https://goreplay.org/)) để đo thực tế thông lượng tối đa thay vì dừng lại ở ước tính trên giấy.

## Phân loại kiểm thử hiệu năng

| Loại kiểm thử                          | Mục đích                                                | Cách làm phổ biến                                            |
| -------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| **Benchmark Test (Kiểm thử chuẩn)**    | Thiết lập đường cơ sở hiệu năng để so sánh trước/sau    | Môi trường cố định, kịch bản cố định, dữ liệu cố định        |
| **Load Test (Kiểm thử tải)**           | Kiểm chứng có đạt chuẩn dưới tải kỳ vọng không          | Tăng tải dần theo mô hình lưu lượng ước tính tới mức mục tiêu |
| **Capacity Test (Kiểm thử dung lượng)** | Tìm ra giới hạn chịu tải tối đa hiện tại của hệ thống   | Tiếp tục tăng tải, quan sát điểm uốn thông lượng và nút cổ chai tài nguyên |
| **Stress Test (Kiểm thử áp lực)**      | Quan sát suy thoái, cơ chế bảo vệ và phục hồi khi quá tải | Vượt quá tải kỳ vọng để kiểm chứng Rate Limiting, Circuit Breaker, tự phục hồi |
| **Stability Test (Soak/Endurance)**    | Kiểm chứng độ ổn định khi chạy thời gian dài            | Chạy liên tục trong thời gian dài với mức tải gần thực tế    |
| **Spike Test (Kiểm thử đột biến)**     | Kiểm chứng khả năng chịu lưu lượng tăng vọt tức thời    | Tăng tải nhanh trong thời gian ngắn rồi hạ nhanh, quan sát phục hồi |

![Phân loại kiểm thử hiệu năng: Phân biệt các ngưỡng tải](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/performance-test-type-boundaries-a21ebedb.webp)

Các loại kiểm thử này chủ yếu khác nhau ở chỗ đẩy tải tới đâu: Load Test kiểm tra hệ thống có gánh nổi lưu lượng mục tiêu không; Capacity Test tiếp tục đẩy lên để tìm điểm uốn; Stress Test vượt hẳn tải kỳ vọng để xem hệ thống sụp đổ và tự phục hồi như thế nào.

### Benchmark Test

Benchmark Test nhấn mạnh việc giữ cố định môi trường, kịch bản, dữ liệu và tham số để tiện so sánh sự thay đổi trước và sau tối ưu. Ví dụ cùng một API trên cùng một máy, chạy một lượt trước và sau khi sửa index để xem RT trung bình, P99, thông lượng và mức CPU thay đổi ra sao.

### Load Test

Load Test kiểm chứng hệ thống có đạt chuẩn dưới mô hình lưu lượng kỳ vọng hay không. Ví dụ phối hợp các request đăng nhập, tra cứu, đặt hàng, thanh toán theo tỷ lệ lịch sử trên production, tăng dần lên QPS mục tiêu để xem thời gian phản hồi, tỷ lệ lỗi và mức dùng tài nguyên có đáp ứng yêu cầu không.

### Capacity Test

Capacity Test tiếp tục tăng áp lực request cho đến khi một tài nguyên nào đó của server chạm ngưỡng bão hòa, hoặc thời gian phản hồi và tỷ lệ lỗi không còn đạt yêu cầu. Nó tập trung vào giới hạn gánh tải tối đa dưới kiến trúc và cấu hình tài nguyên hiện tại.

### Stress Test

Stress Test cố tình đẩy lưu lượng vượt qua ngưỡng thiết kế. Ở giai đoạn này có thể chấp nhận fail-fast (chẳng hạn trả về `429` hoặc `503`), nhưng không thể chấp nhận request bị treo mãi, kết nối không được giải phóng, Thread Pool xếp hàng dồn ứ, hàng đợi ngày càng phình to mà upstream vẫn tiếp tục Retry. Khi chạy Stress Test cần kiểm tra xem các cơ chế bảo vệ như Token Bucket, Semaphore, giới hạn độ dài hàng đợi, Circuit Breaker và hạ cấp dịch vụ (Degradation) có thực sự phát huy tác dụng hay không; và sau khi rút tải, kết nối, thread, hàng đợi và thông lượng có hồi về mức bình thường được không.

### Stability Test (Soak Test)

Stability Test chủ yếu quan sát xu hướng dài hạn. Những vấn đề lúc mới khởi động chạy hoàn toàn bình thường nhưng chạy vài giờ sau mới lộ ra thường nằm ở đây. Có thể chạy liên tục nhiều giờ, một ngày hoặc lâu hơn với lưu lượng sát tỷ lệ production, tập trung theo dõi các xu hướng: bộ nhớ Heap có chỉ tăng mà không giảm không, Full GC có dày lên không, connection pool có bị chiếm đầy kéo dài không, số lượng thread có tăng liên tục không, MQ hay hàng đợi cục bộ có tích tụ ngày một nhiều không, tỷ lệ lỗi có nhích lên từng chút một không. Chạy 24/7 chỉ là cách làm phổ biến trong các kịch bản yêu cầu cực cao chứ không phải đáp án cứng nhắc.

### Spike Test

Spike Test phù hợp để mô phỏng lượng truy cập ùa vào đột ngột như mở màn sự kiện, flash sale đúng giờ, hoặc gửi thông báo đẩy hàng loạt. Khi test, đẩy lưu lượng tăng vọt trong thời gian rất ngắn rồi hạ về mức bình thường để xem cơ chế Rate Limiting, xếp hàng và hạ cấp có kích hoạt đúng kỳ vọng không, đồng thời sau khi lưu lượng hạ xuống thì RT, tỷ lệ lỗi, Thread Pool và hàng đợi có giảm trở lại được không.

## Kiểm thử tải toàn trình (Full-Link Performance Testing)

Kiểm thử đơn lẻ một API chỉ cho bạn biết API đó chạy được bao nhiêu thông lượng dưới kịch bản hiện tại. Khi hệ thống phức tạp gặp sự cố, điểm nghẽn thường không nằm ở chính API đầu vào: xác thực tại gateway không có vấn đề nhưng service tồn kho bắt đầu xếp hàng; API đặt hàng vẫn trả về được nhưng MQ đã ùn ứ; CPU ứng dụng không cao nhưng database connection pool đã bị lấp đầy trước tiên. Một lần đặt hàng có thể đi qua gateway, xác thực, sản phẩm, tồn kho, đơn hàng, thanh toán, message queue, cache và database — bất kỳ khâu nào chạm điểm nghẽn trước thì cuối cùng đều phản ánh lên request của người dùng.

![Kiểm thử tải toàn trình: Dựng hàng rào bảo vệ trước tiên](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/full-link-performance-test-guardrails-303bda92.webp)

Khi chạy kiểm thử tải toàn trình, lưu lượng đi từ cổng vào của hệ thống, men theo luồng nghiệp vụ thật đi xuống phía sau, khiến mọi service, thành phần trung gian và hạ tầng đều phải chịu tải. Cách này sát với lưu lượng thật trên production hơn kiểm thử đơn API rất nhiều, nhưng cũng dễ làm tổn thương dữ liệu và dịch vụ thật hơn, vì thế cần chuẩn bị trước vài việc sau:

1. **Cô lập dữ liệu kiểm thử**: Dùng tài khoản test, cờ đánh dấu luồng test, bảng bóng (shadow table) hoặc database bóng (shadow DB) để tránh làm bẩn dữ liệu đơn hàng, thanh toán, tồn kho thật.
2. **Nhận diện lưu lượng kiểm thử**: Cho phép gateway, service, log, giám sát và distributed tracing đều nhận diện được lưu lượng test để dễ thống kê và dừng khẩn cấp.
3. **Giám sát toàn bộ chuỗi đầy đủ**: Theo dõi đồng thời chỉ số ứng dụng, chỉ số máy chủ, chỉ số database, chỉ số cache, tồn đọng MQ, slow SQL, GC và trạng thái Thread Pool.
4. **Sẵn sàng Circuit Breaker và Rate Limiting**: Trước khi chạy tải phải xác nhận các cơ chế bảo vệ như Rate Limiting, hạ cấp, ngắt mạch và giới hạn độ dài hàng đợi đã có hiệu lực.
5. **Có thể đối chiếu và rút kinh nghiệm kết quả**: Ghi chép lại concurrency, QPS, P90/P99, tỷ lệ lỗi, mức tài nguyên và điểm nghẽn của mỗi lượt chạy tải để tiện so sánh sau khi tối ưu.

Nếu nghiệp vụ chưa đến giai đoạn cần nền tảng kiểm thử toàn trình trực tiếp trên production, trước tiên hãy dùng JMeter, Gatling, wrk... viết rõ kịch bản cho các luồng cốt lõi, bảo đảm tìm được điểm nghẽn, bảo vệ được dữ liệu và dừng nhanh được là đã bao phủ phần lớn bài toán đánh giá dung lượng và tìm điểm nghẽn rồi. Khi nghiệp vụ phức tạp đến mức phải test thường xuyên trên production thì hãy tính đến việc xây dựng nền tảng chuyên biệt.

## Các công cụ kiểm thử hiệu năng phổ biến

### Công cụ phổ biến cho Backend

Vì thiết kế hệ thống có liên quan đến hiệu năng hệ thống, nên khi đi phỏng vấn, nhà tuyển dụng rất có thể sẽ hỏi: **Bạn thực hiện kiểm thử hiệu năng như thế nào?**

Dưới đây là một số công cụ kiểm thử hiệu năng khá phổ biến:

| Công cụ        | Ngôn ngữ / Kịch bản                         | Đặc điểm                                                           | Kịch bản phù hợp                                    |
| -------------- | ------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| **JMeter**     | Java, GUI + CLI                             | Tính năng toàn diện, GUI tiện viết và debug kịch bản, chạy chính thức nên dùng CLI | Kịch bản doanh nghiệp phức tạp, test chuỗi API      |
| **Gatling**    | Java, JavaScript, TypeScript, Scala, Kotlin | Viết kịch bản bằng code, báo cáo đẹp và tích hợp CI thuận tiện     | Đội dev bảo trì kịch bản test, tích hợp CI/CD       |
| **k6**         | Kịch bản JavaScript, engine Go              | Chỉ số, ngưỡng (threshold) và tích hợp CI rất tốt                  | Kiểm thử tải API, kiểm tra hồi quy SLO              |
| **Locust**     | Python                                      | Viết hành vi người dùng bằng Python, hỗ trợ mở rộng phân tán       | Đội dùng Python, mô hình hóa hành vi người dùng phức tạp |
| **wrk**        | C, hỗ trợ Lua script                        | Gọn nhẹ, hiệu năng cao                                             | Benchmark đồng thời cao cho HTTP API                |
| **ab**         | C                                           | Đơn giản, gọn nhẹ, đi kèm sẵn với Apache                           | Smoke test nhanh hoặc benchmark sơ bộ               |
| **LoadRunner** | Bộ phần mềm thương mại                      | Hỗ trợ giao thức mạnh và khả năng quản lý tốt                      | Kiểm thử quy mô lớn cấp doanh nghiệp                |

Nếu nhớ không nhầm thì ngoại trừ **LoadRunner**, tất cả các công cụ trên đều có phiên bản mã nguồn mở hoặc miễn phí.

**Gợi ý lựa chọn:**

- **Kiểm chứng nhanh**: Dùng `ab` hoặc `wrk` để kiểm thử API đơn giản.
- **Kịch bản phức tạp**: Dùng `JMeter`, hỗ trợ ghi kịch bản (record), tham số hóa, assertion...
- **Hướng code (Code-driven)**: Dùng `Gatling` hoặc `k6`, phù hợp cho dev bảo trì kịch bản và đưa vào CI.
- **Mô hình hóa hành vi người dùng phức tạp**: Dùng `Locust`, phù hợp mô tả hành vi người dùng bằng Python.

### Công cụ phổ biến cho Frontend

| Công cụ                         | Mục đích chính                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| **Chrome DevTools Performance** | Ghi lại và phân tích hiệu năng runtime của trang, long task, thực thi JS và điểm nghẽn render |
| **Lighthouse**                  | Tự động đánh giá hiệu năng trang, khả năng truy cập (accessibility), best practices, SEO... và xuất báo cáo |
| **WebPageTest**                 | Kiểm thử trải nghiệm tải trang từ trình duyệt thật, nhiều loại mạng hoặc vùng địa lý khác nhau |
| **Fiddler/Charles**             | Bắt gói tin, chỉnh sửa gói tin, debug HTTP request                                       |

## Các chiến lược tối ưu hiệu năng phổ biến

Trước khi tối ưu cần rà soát rõ toàn bộ đường đi của request: gateway đầu vào, Thread Pool ứng dụng, cache, database, MQ, API bên ngoài — chỗ nào bắt đầu xếp hàng trước thì xem chỗ đó trước.

Dưới đây là bảng câu hỏi tôi thường tự đặt ra khi tối ưu hiệu năng:

| Hướng tối ưu  | Hạng mục kiểm tra                                                              |
| ------------- | ------------------------------------------------------------------------------ |
| **Cache**     | Hệ thống có cần cache không? Dữ liệu nóng (hot data) đã được đưa vào cache chưa? |
| **Kiến trúc** | Bản thân kiến trúc hệ thống có vấn đề không? Có cần tách đọc/ghi, chia DB/chia bảng không? |
| **Đồng thời** | Hệ thống có chỗ nào bị Deadlock không? Độ mịn của khóa (Lock granularity) có hợp lý không? |
| **Bộ nhớ**    | Hệ thống có bị Memory Leak không? GC có xảy ra quá thường xuyên không?         |
| **Database**  | Index của database sử dụng có hợp lý không? Có slow SQL không?                 |
| **Thuật toán** | Độ phức tạp thời gian của thuật toán cốt lõi có thể tối ưu thêm được không?   |
| **I/O**       | Có những lời gọi mạng không cần thiết không? Có thể xử lý gộp lô (batch) không? |
