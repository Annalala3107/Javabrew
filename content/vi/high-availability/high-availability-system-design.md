---
title: "Giải thích chi tiết thiết kế hệ thống High Availability: SLA, Rate Limiting, Circuit Breaker, Fallback, Dự phòng, Cache và Canary Release"
description: "Cẩm nang thiết kế hệ thống có độ sẵn sàng cao (High Availability), giải thích Thỏa thuận mức dịch vụ (SLA) và các mức số 9, xử lý điểm lỗi đơn (SPOF), Rate Limiting và Ngắt mạch (Circuit Breaker), giáng cấp dịch vụ và Dự phòng giáng cấp (Fallback), High Availability cho Cache, cắt đỉnh bất đồng bộ, dự phòng khắc phục thảm họa, Canary Release và phục hồi sự cố."
category: Độ sẵn sàng cao (High Availability)
icon: "mdi:palette-swatch-outline"
tag:
  - High Availability
  - Thiết kế hệ thống
head:
  - - meta
    - name: keywords
      content: High Availability,Thiết kế hệ thống High Availability,Kiến trúc sẵn sàng cao,Thỏa thuận mức dịch vụ SLA,Bao nhiêu số 9,Điểm lỗi đơn SPOF,Rate Limiting và Circuit Breaker,Giáng cấp dịch vụ,Dự phòng giáng cấp Fallback,Cache High Availability,Dự phòng và khắc phục thảm họa,Canary Release,Phục hồi sự cố,Tính ổn định hệ thống
lang: vi
sourceRef: zh-ref/high-availability/high-availability-system-design.md
---

Dù là trang web mua sắm trực tuyến thường ngày, hệ thống thanh toán online hay hệ thống nghiệp vụ cốt lõi nội bộ doanh nghiệp, mức độ chấp nhận của người dùng đối với tình trạng "dịch vụ không khả dụng" ngày càng thấp. Chỉ một sự cố kéo dài vài phút cũng có thể dẫn đến mất lượng lớn người dùng hoặc gây thiệt hại kinh tế trực tiếp.

Vì vậy, làm thế nào để hệ thống vẫn cung cấp dịch vụ ổn định trong nhiều tình huống bất thường đã trở thành chủ đề không thể thiếu trong phát triển Backend và thiết kế kiến trúc. Bài viết này sẽ hệ thống lại tư duy cốt lõi và các giải pháp phổ biến trong thiết kế hệ thống có độ sẵn sàng cao (High Availability), bao gồm chỉ số Thỏa thuận mức dịch vụ (SLA), xử lý điểm lỗi đơn (SPOF), giới hạn tốc độ (Rate Limiting) và Ngắt mạch (Circuit Breaker), giáng cấp dịch vụ và Dự phòng giáng cấp (Fallback), High Availability cho Cache, cắt đỉnh bất đồng bộ, dự phòng và khắc phục thảm họa, phát hành từng phần (Canary Release) và phục hồi sự cố.

## High Availability là gì? Tiêu chuẩn đánh giá tính sẵn sàng là gì?

**High Availability (viết tắt HA — độ sẵn sàng cao)** là khả năng hệ thống có thể liên tục cung cấp dịch vụ bình thường trong phần lớn thời gian. High Availability đồng nghĩa với việc ngay cả khi xảy ra sự cố phần cứng hoặc nâng cấp hệ thống, dịch vụ vẫn khả dụng.

Thông thường, chúng ta dùng **số lượng chữ số 9 (how many nines)** để đánh giá tính sẵn sàng của một hệ thống. Chẳng hạn, 99.9999% nghĩa là trong toàn bộ thời gian vận hành, hệ thống chỉ có 0.0001% thời gian không khả dụng — đây là hệ thống có độ sẵn sàng cực kỳ cao! Những hệ thống có tính sẵn sàng kém thậm chí có thể không đạt nổi 90% (1 số 9).

| Mức độ sẵn sàng | Tỷ lệ sẵn sàng | Thời gian ngừng hoạt động/năm | Kịch bản tiêu biểu         |
| --------------- | -------------- | ----------------------------- | -------------------------- |
| 1 số 9          | 90%            | 36.5 ngày                     | Blog cá nhân               |
| 2 số 9          | 99%            | 3.65 ngày                     | Hệ thống doanh nghiệp phổ thông |
| 3 số 9          | 99.9%          | 8.76 giờ                      | Dịch vụ trực tuyến         |
| 4 số 9          | 99.99%         | 52.6 phút                     | Hệ thống giao dịch tài chính |
| 5 số 9          | 99.999%        | 5.26 phút                     | Hệ thống cấp viễn thông    |

Ngoài ra, tính sẵn sàng của hệ thống còn có thể đo bằng **tỷ lệ số lần thất bại của một tính năng trên tổng số lần request**. Ví dụ, một website nhận 1000 request và có 10 request thất bại, khi đó tính sẵn sàng là 99%.

**Thỏa thuận mức dịch vụ (SLA - Service Level Agreement)** là cam kết chính thức giữa nhà cung cấp dịch vụ và khách hàng, thường quy định rõ mục tiêu tính sẵn sàng. Ví dụ, nhà cung cấp dịch vụ đám mây cam kết SLA 99.95%, đồng nghĩa mỗi tháng tối đa chỉ cho phép khoảng 22 phút gián đoạn (downtime).

## Những tình huống nào khiến hệ thống không khả dụng?

Nguyên nhân khiến hệ thống không khả dụng có thể phân tích theo hai khía cạnh: **yếu tố bên trong** và **yếu tố bên ngoài**:

**Yếu tố bên trong:**

1. **Lỗi mã nguồn (Code Defects)**: Chẳng hạn rò rỉ bộ nhớ (Memory Leak), Deadlock, phụ thuộc vòng tròn (Circular Dependency), `NullPointerException`, v.v. là một trong những nguyên nhân phổ biến nhất gây sự cố production.
2. **Khiếm khuyết thiết kế kiến trúc**: Điểm lỗi đơn (SPOF), thiếu bảo vệ Rate Limiting, liên kết chặt (Tight Coupling) giữa các service — những vấn đề kiến trúc này sẽ bộc lộ khi lưu lượng đạt đỉnh.
3. **Cạn kiệt tài nguyên**: Cạn kiệt CPU, bộ nhớ (RAM), ổ đĩa, Connection Pool, v.v. sẽ trực tiếp làm dịch vụ ngừng hoạt động.
4. **Lỗi cấu hình**: Thay đổi cấu hình sai (như chuỗi kết nối Database, cấu hình Timeout không hợp lý) có thể khiến dịch vụ bất thường.

**Yếu tố bên ngoài:**

1. **Sự cố phần cứng**: Máy chủ sập (crash), hỏng đĩa cứng, lỗi thiết bị mạng, v.v.
2. **Lưu lượng tăng đột biến**: Lượng request người dùng bùng nổ bất ngờ (như sự kiện Flash Sale) vượt quá năng lực chịu tải của hệ thống.
3. **Tấn công mạng**: Tấn công DDoS, tấn công CC làm cạn kiệt tài nguyên hệ thống.
4. **Lỗi dịch vụ phụ thuộc**: Database, Cache, Message Queue, API bên thứ ba, v.v. không khả dụng.
5. **Thiên tai**: Mất điện trung tâm dữ liệu, hỏa hoạn, động đất và các yếu tố bất khả kháng khác.

## Có những phương pháp nào để nâng cao tính sẵn sàng của hệ thống?

Các phương pháp nâng cao tính sẵn sàng của hệ thống có thể xem xét theo ba giai đoạn: **Phòng ngừa (Prevention)**, **Chịu lỗi (Fault Tolerance)** và **Phục hồi (Recovery)**:

![Ba giai đoạn thích ứng của hệ thống High Availability](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/ha-system-design-resilience-stages-1c8e56e0.png)

### Chú trọng chất lượng code và kiểm thử chặt chẽ

**Chất lượng mã nguồn là nền tảng của tính sẵn sàng hệ thống.** Những vấn đề code phổ biến như Memory Leak hay Circular Dependency gây tổn hại cực lớn đến độ sẵn sàng. Ai cũng thích bàn về Rate Limiting, giáng cấp hay Ngắt mạch (Circuit Breaker), nhưng kiểm soát chặt ngay từ gốc là chất lượng code mới là việc quan trọng hàng đầu cần làm tốt.

Làm sao để nâng cao chất lượng code? Phương pháp thiết thực và hiệu quả chính là **Code Review** — đừng ngại bỏ thêm khoảng 1 giờ mỗi ngày cho việc này, tác dụng của nó rất lớn!

Ngoài ra, dưới đây là một số công cụ thực sự hữu ích giúp cải thiện chất lượng code:

- [SonarQube](https://www.sonarqube.org/): Nền tảng phân tích mã nguồn tĩnh (Static Code Analysis), phát hiện Code Smell, lỗ hổng bảo mật và Bug.
- Công cụ chẩn đoán Java mã nguồn mở của Alibaba — [Arthas](https://arthas.aliyun.com/doc/): Cho phép kiểm tra sự cố JVM trực tiếp trên môi trường chạy thật và hỗ trợ cập nhật nóng (Hot-swap) mã nguồn.
- [Alibaba Java Code Guidelines](https://github.com/alibaba/p3c): Đi kèm plugin cho IntelliJ IDEA giúp kiểm tra quy chuẩn code theo thời gian thực.
- Các công cụ phân tích code tích hợp sẵn trong IntelliJ IDEA.

### Sử dụng Cluster để giảm thiểu điểm lỗi đơn (SPOF)

**Điểm lỗi đơn (Single Point of Failure — SPOF)** là kẻ thù lớn của High Availability. Lấy Redis Cache làm ví dụ: triển khai chế độ Cluster để tránh điểm lỗi đơn là biện pháp then chốt đảm bảo tính sẵn sàng cao.

Khi chỉ dùng một instance Redis làm Cache, nếu instance đó sập thì toàn bộ dịch vụ Cache có thể tê liệt. Khi sử dụng Cluster, dù một node Redis gặp sự cố, hệ thống vẫn có thể chuyển đổi dự phòng (Failover) để các node khác tiếp quản. Thời gian chuyển đổi phụ thuộc vào chế độ triển khai và tham số cấu hình — Redis Sentinel/Cluster thường mất từ vài giây đến vài chục giây, không nên hiểu đơn giản là "chưa tới một giây".

Các mô hình Cluster phổ biến:

- **Master-Slave Replication (Chủ - Tớ)**: Một node Master và nhiều node Replica; Master xử lý ghi, Replica xử lý đọc. Khi Master gặp sự cố cần chuyển đổi thủ công hoặc nhờ Sentinel thực hiện Failover.
- **Chế độ Sentinel**: Bổ sung các node Sentinel trên nền tảng Master-Slave để phát hiện lỗi và Failover tự động.
- **Chế độ Redis Cluster**: Giải pháp phân mảnh dữ liệu (Sharding) chính thức từ Redis 3.0+, mỗi shard đều có bản sao Master-Replica, cân bằng giữa High Availability và khả năng mở rộng ngang (Horizontal Scaling).

### Giới hạn tốc độ (Rate Limiting)

**Rate Limiting (giới hạn lưu lượng)** là tuyến phòng thủ đầu tiên bảo vệ hệ thống. Nguyên lý là giám sát các chỉ số như QPS hoặc số Thread đồng thời của ứng dụng; khi đạt đến ngưỡng chỉ định thì kiểm soát lưu lượng để tránh bị đánh sập bởi các đỉnh lưu lượng tức thời, qua đó bảo đảm High Availability cho ứng dụng.—Trích từ wiki của [alibaba-Sentinel](https://github.com/alibaba/Sentinel "Sentinel").

Các thuật toán Rate Limiting phổ biến gồm:

- **Fixed Window Counter (Bộ đếm cửa sổ cố định)**: Cài đặt đơn giản nhưng có vấn đề tăng vọt lưu lượng tại điểm ranh giới cửa sổ.
- **Sliding Window Counter (Bộ đếm cửa sổ trượt)**: Khắc phục vấn đề ranh giới của Fixed Window, điều tiết mượt mà hơn.
- **Leaky Bucket (Thùng rò)**: Xử lý request theo tốc độ cố định, phù hợp cho điều phối làm mượt lưu lượng (Traffic Shaping).
- **Token Bucket (Thùng token)**: Cho phép một mức lưu lượng đột biến (burst) nhất định, linh hoạt hơn.

### Thiết lập cơ chế Timeout và Retry

Khi request của người dùng quá một khoảng thời gian mà không nhận được phản hồi, hệ thống phải ném ra ngoại lệ. Điều này cực kỳ quan trọng — rất nhiều sự cố production xảy ra do **không thiết lập Timeout hoặc thiết lập Timeout sai cách**.

Khi gọi các dịch vụ bên thứ ba, việc cài đặt Timeout và Retry lại càng cần thiết. Hầu hết các framework RPC đều tích hợp sẵn cấu hình Timeout và Retry. Nếu không đặt Timeout, phản hồi chậm sẽ làm request dồn ứ, khiến hệ thống không thể xử lý thêm request mới.

**Số lần Retry thường được đặt là 3 lần**; thử lại quá nhiều lần không mang lại lợi ích mà còn tăng áp lực lên máy chủ (một số kịch bản không phù hợp dùng Retry khi thất bại). Đồng thời, Retry cần kết hợp chiến lược **Exponential Backoff (lùi thời gian theo cấp số nhân)** để tránh bão Retry (Retry Storm).

Cần đặc biệt lưu ý: API được Retry bắt buộc phải đảm bảo **Tính lũy đẳng (Idempotency)**. Với các thao tác ghi không có tính lũy đẳng như tạo đơn hàng hay trừ tiền, cần ngăn thực thi trùng lặp thông qua Request ID duy nhất, khóa duy nhất nghiệp vụ (Business Unique Key) hoặc State Machine, thay vì chỉ gửi lại request thất bại một cách đơn thuần. Thao tác đọc có thể Retry tích cực hơn, còn thao tác ghi tốt nhất nên truy vấn lại xem request trước đó đã có hiệu lực hay chưa trước khi Retry.

### Cơ chế Ngắt mạch (Circuit Breaker)

Bên cạnh cơ chế Timeout và Retry, **cơ chế Ngắt mạch (Circuit Breaker)** cũng vô cùng quan trọng. Ngắt mạch (Circuit Breaker) nghĩa là hệ thống tự động thu thập tình trạng sử dụng tài nguyên và chỉ số hiệu năng của các dịch vụ phụ thuộc; khi dịch vụ phụ thuộc suy giảm chất lượng hoặc số lần/tỷ lệ lỗi đạt đến một ngưỡng nhất định, bộ Ngắt mạch (Circuit Breaker) chuyển sang trạng thái `Open`, các request tiếp theo sẽ thất bại nhanh (Fail Fast) ngay lập tức và không gọi xuống dịch vụ hạ nguồn nữa để ngăn lỗi lan rộng. Ngắt mạch thường đi kèm chiến lược **Dự phòng giáng cấp (Fallback)**, chẳng hạn trả về dữ liệu mặc định an toàn hoặc gọi sang dịch vụ dự phòng.

Circuit Breaker có ba trạng thái:

- **Closed (Đóng)**: Trạng thái bình thường, request đi qua bình thường.
- **Open (Mở)**: Trạng thái ngắt mạch, request thất bại ngay lập tức và không gọi xuống dịch vụ hạ nguồn.
- **Half-Open (Nửa mở)**: Trạng thái thăm dò phục hồi, cho một lượng nhỏ request đi qua để kiểm tra xem dịch vụ hạ nguồn đã khôi phục chưa.

Trong lịch sử, các framework kiểm soát lưu lượng và Ngắt mạch/giáng cấp được sử dụng rộng rãi gồm Netflix Hystrix (đã chuyển sang chế độ bảo trì) và Alibaba Sentinel. Với các dự án mới hiện nay, thường ưu tiên dùng Sentinel hoặc Resilience4j.

### Giáng cấp dịch vụ (Service Degradation)

**Giáng cấp dịch vụ (Degradation)** là việc tạm thời tắt bớt các tính năng không cốt lõi khi hệ thống chịu áp lực quá lớn hoặc một phần dịch vụ không khả dụng, nhằm bảo vệ tính sẵn sàng cho các tính năng cốt lõi.

Các chiến lược giáng cấp gồm:

- **Giáng cấp tính năng**: Tắt các tính năng không cốt lõi như gợi ý sản phẩm, bình luận.
- **Giáng cấp dữ liệu (Dự phòng giáng cấp - Fallback)**: Trả về dữ liệu Cache hoặc dữ liệu mặc định thay vì truy vấn thời gian thực.
- **Giáng cấp giao diện (Page Degradation)**: Trả về trang HTML tĩnh hoặc phiên bản trang rút gọn.

### Gọi bất đồng bộ (Asynchronous Call)

Gọi bất đồng bộ nghĩa là bên gọi sau khi gửi request sẽ không bị chặn (block) chờ kết quả xử lý mà trả về ngay lập tức, phần xử lý thực tế sẽ thực hiện sau — mô hình này được dùng rất nhiều trong các kịch bản Flash Sale.

Tuy nhiên, sau khi dùng bất đồng bộ, chúng ta có thể cần **điều chỉnh quy trình nghiệp vụ cho phù hợp**. Ví dụ: **sau khi người dùng gửi đơn hàng, không thể báo ngay cho người dùng rằng đơn hàng đã thành công; mà phải chờ tiến trình consumer của Message Queue xử lý xong đơn hàng đó, thậm chí sau khi xuất kho, mới thông báo thành công cho người dùng qua email hoặc tin nhắn SMS**.

Ngoài việc cài đặt bất đồng bộ trực tiếp trong code, chúng ta thường sử dụng **Message Queue (MQ)**. Message Queue giúp nâng cao hiệu năng hệ thống thông qua xử lý bất đồng bộ (cắt đỉnh lưu lượng, giảm thời gian phản hồi) và giảm mức độ phụ thuộc chặt giữa các hệ thống.

### Sử dụng Cache

Trong kịch bản đồng thời cao (High Concurrency), nếu mọi request đều đánh thẳng vào Database, Database rất dễ sập vì quá tải. Sử dụng Cache để lưu trữ dữ liệu nóng (Hot Data) giúp truy xuất cực nhanh vì Cache nằm trong bộ nhớ (RAM)!

Các kịch bản ứng dụng điển hình của Cache:

- **Cache dữ liệu nóng**: Đưa dữ liệu được truy cập thường xuyên vào Cache như Redis.
- **Cache trang (Page Cache)**: Lưu Cache các trang đã render sẵn để giảm tải cho máy chủ.
- **Local Cache**: Dùng Local Cache như Caffeine, Guava Cache để giảm chi phí truyền qua mạng.

Bản thân Cache cũng phải tính đến các kiểu lỗi điển hình dưới yêu cầu High Availability:

- **Cache Penetration (Xuyên thấu Cache)**: Truy vấn dữ liệu không tồn tại khiến toàn bộ request xuyên thẳng xuống Database. Cách xử lý phổ biến: kiểm tra tham số đầu vào, lưu Cache giá trị rỗng (Null Caching), sử dụng Bloom Filter.
- **Cache Breakdown (Đánh sập Cache điểm nóng)**: Đúng khoảnh khắc một Hot Key hết hạn, lượng lớn request đồng thời dội thẳng vào Database. Cách xử lý phổ biến: dùng khóa loại trừ (Mutex Lock), hết hạn logic (Logical Expiration), giữ Hot Key không hết hạn + làm mới bất đồng bộ.
- **Cache Avalanche (Tuyết lở Cache)**: Hàng loạt Key hết hạn cùng lúc hoặc cả cụm Cache gặp sự cố không khả dụng. Cách xử lý phổ biến: thêm độ lệch ngẫu nhiên (Jitter) vào thời gian hết hạn, Cache đa tầng, cụm Cache có độ sẵn sàng cao.

### Các biện pháp khác

- **Ưu tiên phần cứng tốt hơn cho ứng dụng và dịch vụ cốt lõi**: Dùng máy chủ cấu hình cao hơn, ổ cứng SSD, v.v. cho các service cốt lõi.
- **Giám sát tài nguyên hệ thống và thiết lập cảnh báo**: Sử dụng giải pháp giám sát như Prometheus + Grafana, thiết lập ngưỡng cảnh báo hợp lý.
- **Chú ý sao lưu và sẵn sàng Rollback khi cần**: Sao lưu Database định kỳ, đảm bảo phiên bản code có thể truy vết và hỗ trợ Rollback nhanh.
- **Phát hành từng phần (Canary Release / Gray Release)**: Chia cụm máy chủ thành nhiều phần, mỗi ngày chỉ triển khai lên một nhóm máy, quan sát ổn định không sự cố rồi ngày hôm sau tiếp tục triển khai nhóm tiếp theo, kéo dài vài ngày cho tới khi phủ hết toàn cụm; trong quá trình đó nếu phát hiện lỗi chỉ cần Rollback nhóm máy đã phát hành.
- **Kiểm tra/thay thế phần cứng định kỳ**: Nếu không thuê dịch vụ đám mây trọn gói, vẫn cần kiểm tra phần cứng định kỳ, kịp thời thay thế hoặc nâng cấp các linh kiện cần thiết.
