---
title: "Giải thích chi tiết về Rate Limiting: Fixed Window, Sliding Window, Token Bucket, Leaky Bucket và Distributed Rate Limiting"
description: "Giải thích chi tiết nguyên lý và cách triển khai giới hạn tốc độ (Rate Limiting) cho dịch vụ, trình bày hệ thống các thuật toán như Fixed Window, Sliding Window, Token Bucket, Leaky Bucket cùng giải pháp Rate Limiting đơn máy và phân tán với Guava RateLimiter, Bucket4j, Sentinel, Redis Lua và Redisson."
category: Độ sẵn sàng cao
icon: "mdi:speedometer-slow"
tag:
  - Giới hạn tốc độ (Rate Limiting)
  - High Concurrency
lang: vi
sourceRef: zh-ref/high-availability/limit-request.md
head:
  - - meta
    - name: keywords
      content: giới hạn tốc độ,Rate Limiting,thuật toán Rate Limiting,Fixed Window,Sliding Window,Token Bucket,Leaky Bucket,Rate Limiting đơn máy,Distributed Rate Limiting,Guava RateLimiter,Bucket4j,Sentinel,Redis Lua,Redisson,câu hỏi phỏng vấn Rate Limiting
---

Đối với một hệ thống phần mềm, **Giới hạn tốc độ (Rate Limiting)** là việc kiểm soát tốc độ gửi request nhằm tránh tình trạng lượng request tăng đột biến tức thời làm đánh sập hệ thống. Xét cho cùng, năng lực xử lý của hệ thống phần mềm luôn có giới hạn; nếu lượng request vượt quá ngưỡng chịu tải, hệ thống có thể sập ngay lập tức.

Rate Limiting có thể khiến một số request của người dùng không được xử lý thành công hoặc không được xử lý ngay lập tức, nhưng đó thường là phương án tối ưu sau khi cân nhắc sự ổn định tổng thể của hệ thống.

Trong đời sống thực tế, ứng dụng của Rate Limiting xuất hiện ở khắp mọi nơi — ví dụ việc xếp hàng mua vé là để tránh tình trạng quá đông người ùa vào cùng lúc khiến nhân viên bán vé không thể xử lý kịp.

## Các thuật toán Rate Limiting phổ biến là gì?

Dưới đây là giới thiệu ngắn gọn về 4 thuật toán Rate Limiting rất dễ hiểu và dễ triển khai!

> Hình ảnh minh họa được trích từ bài viết trên InfoQ: ["Thực chiến Distributed Service Rate Limiting: Đã dọn sẵn các hố bẫy cho bạn"](https://www.infoq.cn/article/Qg2tX8fyw5Vt-f3HH673).

### Thuật toán Fixed Window Counter (Bộ đếm cửa sổ cố định)

**Fixed Window** thực chất là cửa sổ thời gian cố định. Nguyên lý của thuật toán là chia trục thời gian thành các cửa sổ có kích thước cố định và giới hạn số lượng hoặc tốc độ request trong từng cửa sổ — tức là thuật toán Fixed Window Counter quy định số lượng request tối đa mà hệ thống được phép xử lý trong một đơn vị thời gian.

Giả sử chúng ta quy định một API trong hệ thống chỉ được phép truy cập 33 lần trong 1 phút, ý tưởng triển khai bằng thuật toán Fixed Window Counter như sau:

- Chia thời gian thành các cửa sổ kích thước cố định, ở đây là 1 phút một cửa sổ.
- Khai báo biến `counter` để ghi nhận số request mà API đang xử lý, giá trị ban đầu là 0 (biểu thị trong 1 phút hiện tại API chưa xử lý request nào).
- Trong vòng 1 phút đó, mỗi khi xử lý một request thì tăng `counter + 1`. Khi `counter = 33` (tức API đã được gọi đủ 33 lần trong 1 phút này), toàn bộ request đến sau sẽ bị từ chối.
- Khi hết 1 phút, đặt lại `counter` về 0 và bắt đầu đếm lại từ đầu.

![Thuật toán Fixed Window Counter](/media/jg/ext/static001.infoq.cn/image/8d/15/8ded7a2b90e1482093f92fff555b3615-86289ab1.webp)

Ưu điểm: Triển khai đơn giản, dễ hiểu.

Nhược điểm:

- Lưu lượng giới hạn không mượt mà. Ví dụ: nếu giới hạn một API chỉ được truy cập 30 lần/phút và có 30 request ùa vào ngay trong 30 giây đầu tiên, thì 30 giây còn lại hệ thống sẽ không thể xử lý bất kỳ request nào. Điều này rất bất hợp lý và gây trải nghiệm người dùng cực kỳ tệ!
- Tồn tại vấn đề đột biến lưu lượng tại ranh giới cửa sổ (Boundary Burst). Ví dụ: giới hạn một API là 1.000 lần/phút; nếu ở giây cuối cùng của phút thứ 1 có 1.000 request đi vào và ở giây đầu tiên của phút thứ 2 lại có thêm 1.000 request nữa, do bộ đếm của cửa sổ mới đã được reset nên chỉ trong 2 giây ngắn ngủi có tới 2.000 request được cho qua — QPS thực tế vượt xa mức kỳ vọng `1000 / 60 ≈ 16.7`.

### Thuật toán Sliding Window Counter (Bộ đếm cửa sổ trượt)

**Thuật toán Sliding Window Counter** có thể coi là phiên bản nâng cấp của Fixed Window Counter với độ mịn (granularity) kiểm soát cao hơn.

Điểm tối ưu của Sliding Window Counter so với Fixed Window Counter nằm ở chỗ: **nó chia một cửa sổ cố định thành nhiều cửa sổ con (ô/slot) nhỏ hơn**.

Ví dụ, nếu API được giới hạn 60 request mỗi phút, ta có thể chia 1 phút thành 60 cửa sổ con. Cứ mỗi 1 giây cửa sổ lại trượt thêm một ô; mỗi cửa sổ 1 giây chỉ xử lý trung bình không quá `60 (request) / 60 (số cửa sổ)`, và nếu tổng số request trong phạm vi cửa sổ trượt hiện tại vượt quá giới hạn thì các request tiếp theo sẽ không được xử lý nữa.

Rõ ràng, **số lượng ô được chia trong cửa sổ trượt càng nhiều thì quá trình trượt càng mượt mà và số liệu thống kê giới hạn tốc độ càng chính xác.**

![Thuật toán Sliding Window Counter](/media/jg/ext/static001.infoq.cn/image/ae/15/ae4d3cd14efb8dc7046d691c90264715-bdce06fb.webp)

Ưu điểm:

- So với thuật toán Fixed Window, Sliding Window Counter giảm thiểu rõ rệt hiện tượng lưu lượng tăng đột biến tại ranh giới cửa sổ.
- So với thuật toán Fixed Window, độ mịn nhỏ hơn nên cung cấp khả năng kiểm soát tốc độ chính xác hơn.

Nhược điểm:

- Tương tự Fixed Window Counter, Sliding Window Counter vẫn còn tình trạng lưu lượng điều tiết chưa thật sự mượt mà.
- So với Fixed Window Counter, cách triển khai và nắm bắt thuật toán này phức tạp hơn đôi chút.

### Thuật toán Leaky Bucket (Thùng rò)

Ta có thể ví hành động gửi request như việc đổ nước vào thùng, còn quá trình xử lý request giống như nước rò rỉ ra từ một chiếc thùng thủng đáy. Nước có thể chảy vào thùng với tốc độ tùy ý nhưng chảy ra với tốc độ không đổi. Khi lượng nước đổ vào vượt quá dung tích thùng, phần nước dư thừa sẽ bị tràn bỏ; do dung tích thùng cố định nên tốc độ đầu ra tổng thể luôn được đảm bảo.

Triển khai thuật toán này cũng rất đơn giản: chuẩn bị một hàng đợi (queue) để lưu trữ request, sau đó định kỳ lấy request từ hàng đợi ra thực thi (cùng tư tưởng cắt đỉnh lưu lượng / giới hạn tốc độ bằng Message Queue).

![Thuật toán Leaky Bucket](/media/jg/ext/static001.infoq.cn/image/75/03/75938d1010138ce66e38c6ed0392f103-d3177ace.webp)

Ưu điểm:

- Triển khai đơn giản, dễ hiểu.
- Kiểm soát chặt chẽ tốc độ đầu ra, tránh nghẽn mạng và quá tải hệ thống.

Nhược điểm:

- Không thể đáp ứng lưu lượng tăng đột biến (burst traffic) vì request chỉ được xử lý ở tốc độ cố định, chưa tận dụng hiệu quả tài nguyên hệ thống.
- Nếu tốc độ nước chảy vào (gửi request) luôn lớn hơn tốc độ chảy ra (xử lý request), thùng sẽ luôn ở trạng thái đầy và một phần request mới sẽ bị loại bỏ liên tục, làm suy giảm chất lượng dịch vụ.

Trong các bài toán thực tế, phạm vi áp dụng của Leaky Bucket tương đối hẹp hơn. Khi nghiệp vụ cần cho phép một mức độ lưu lượng đột biến nhất định, Token Bucket thường phù hợp hơn; tuy nhiên, ở những kịch bản đòi hỏi kiểm soát nghiêm ngặt tốc độ đầu ra (như gọi API bên thứ ba có giới hạn QPS cứng), Leaky Bucket vẫn là giải pháp rất phù hợp.

### Thuật toán Token Bucket (Thùng chứa Token)

Thuật toán Token Bucket cũng khá đơn giản. Giống như Leaky Bucket, nhân vật chính vẫn là chiếc thùng. Tuy nhiên, lần này trong thùng chứa các **token**: trước khi được xử lý, mỗi request cần lấy một token từ thùng (lấy tức là tiêu thụ). Nếu trong thùng không còn token, request phải chờ hoặc bị từ chối. Dựa theo ngưỡng giới hạn, hệ thống thêm token vào thùng theo một tốc độ nhất định; khi thùng đầy thì ngừng thêm token mới.

![Thuật toán Token Bucket](/media/jg/ext/static001.infoq.cn/image/ec/93/eca0e5eaa35dac938c673fecf2ec9a93-fa3e492e.webp)

Ưu điểm:

- Vừa giới hạn được tốc độ trung bình, vừa cho phép xử lý lưu lượng đột biến ngắn hạn trong phạm vi dung tích thùng.
- Có thể điều chỉnh động tốc độ sinh token.

Nhược điểm:

- Nếu tốc độ sinh token và dung tích thùng cấu hình không hợp lý, có thể phát sinh sự cố như loại bỏ quá nhiều request hoặc khiến hệ thống quá tải.
- So với một số thuật toán Rate Limiting khác, việc triển khai và hiểu sâu phức tạp hơn một chút.

## Nên áp dụng Rate Limiting dựa trên đối tượng nào?

Trong dự án thực tế, ta còn cần xác định đối tượng áp dụng Rate Limiting — tức giới hạn dựa trên tiêu chí nào. Các đối tượng phổ biến gồm:

- **IP**: Giới hạn theo địa chỉ IP có phạm vi áp dụng rộng, đơn giản và trực tiếp.
- **Business ID**: Chọn mã định danh nghiệp vụ duy nhất để giới hạn có mục tiêu hơn — ví dụ giới hạn theo User ID.
- **Cá nhân hóa / Động**: Áp dụng chiến lược khác nhau dựa trên thuộc tính hoặc hành vi người dùng (ví dụ người dùng VIP không giới hạn, người dùng thường bị giới hạn); hoặc điều chỉnh động dựa trên chỉ số vận hành hệ thống (như QPS, số lời gọi đồng thời, tải hệ thống...) — chẳng hạn khi tải cao thì giảm số request cho qua mỗi giây.

Giới hạn theo IP hiện là phương án khá phổ biến. Tuy nhiên, khi triển khai thực tế cần lưu ý lấy đúng địa chỉ IP thật của người dùng. Các cách thường dùng là đọc `X-Forwarded-For` hoặc truyền thông tin IP nguồn qua trường TCP Options. Dù header `X-Forwarded-For` có thể bị giả mạo, nhưng vì đơn giản và tiện lợi nên nhiều dự án vẫn dùng trực tiếp cách này.

Ngoài các đối tượng nêu trên, còn có những chiến lược phức tạp hơn. Chẳng hạn Sentinel của Alibaba hỗ trợ [kiểm soát lưu lượng dựa trên quan hệ lời gọi](https://github.com/alibaba/Sentinel/wiki/流量控制#基于调用关系的流量控制) (gồm giới hạn theo bên gọi, theo điểm vào chuỗi lời gọi, theo lưu lượng liên kết...) và mức chi tiết hơn là [kiểm soát lưu lượng theo tham số nóng (hot-spot parameter)](https://github.com/alibaba/Sentinel/wiki/热点参数限流) (thống kê tham số nóng theo thời gian thực và kiểm soát lưu lượng đối với các lời gọi chứa tham số đó).

Ngoài ra, một dự án có thể kết hợp nhiều đối tượng Rate Limiting khác nhau tùy theo nhu cầu nghiệp vụ cụ thể.

## Triển khai Rate Limiting đơn máy như thế nào?

Rate Limiting đơn máy (Single-node Rate Limiting) hướng tới các ứng dụng kiến trúc nguyên khối (Monolithic).

Với Rate Limiting đơn máy, bạn có thể dùng trực tiếp lớp tiện ích `RateLimiter` tích hợp sẵn trong Google Guava. `RateLimiter` dựa trên thuật toán Token Bucket và có khả năng xử lý lưu lượng đột biến.

> Địa chỉ Guava: <https://github.com/google/guava>

Bên cạnh Token Bucket cơ bản (giới hạn đột biến mượt — smooth bursting), `RateLimiter` của Guava còn cung cấp thuật toán **SmoothWarmingUp** (giới hạn làm nóng mượt).

Smooth bursting bỏ token vào thùng theo tốc độ cố định đã cấu hình, còn SmoothWarmingUp sẽ có một khoảng thời gian khởi động (warm-up); trong khoảng thời gian này, tốc độ cấp token sẽ tăng dần lên tới mức cấu hình.

Hãy xem hai ví dụ đơn giản dưới đây để hiểu rõ hơn.

Ta chỉ cần thêm dependency của Guava vào dự án là có thể sử dụng ngay.

```xml
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>31.0.1-jre</version>
</dependency>
```

> Ví dụ trong bài dựa trên Guava 31.x; API cốt lõi của `RateLimiter` vẫn duy trì tương thích ở các phiên bản mới hơn.

Dưới đây là một demo đơn giản về chế độ giới hạn mượt (smooth bursting) của Guava.

```java
import com.google.common.util.concurrent.RateLimiter;

/**
 * Tìm "JavaGuide" trên WeChat và trả lời "Interview Sprint" để nhận miễn phí sổ tay phỏng vấn Java gốc
 *
 * @author Guide
 * @date 2021/10/08 19:12
 **/
public class RateLimiterDemo {

    public static void main(String[] args) {
        // Thả 5 token vào thùng mỗi giây, tức 0.2s thêm 1 token vào thùng
        RateLimiter rateLimiter = RateLimiter.create(5);
        for (int i = 0; i < 10; i++) {
            double sleepingTime = rateLimiter.acquire(1);
            System.out.printf("get 1 tokens: %ss%n", sleepingTime);
        }
    }
}

```

Kết quả đầu ra:

```bash
get 1 tokens: 0.0s
get 1 tokens: 0.188413s
get 1 tokens: 0.197811s
get 1 tokens: 0.198316s
get 1 tokens: 0.19864s
get 1 tokens: 0.199363s
get 1 tokens: 0.193997s
get 1 tokens: 0.199623s
get 1 tokens: 0.199357s
get 1 tokens: 0.195676s
```

Lưu ý rằng `acquire()` là phương thức lấy token dạng chặn (blocking). Trong môi trường production, thường nên dùng `tryAcquire(timeout)` để đặt giới hạn thời gian chờ nhằm tránh block thread quá lâu. Lần đầu in ra thời gian chờ `0.0s` là vì ngay sau khi khởi tạo bằng `RateLimiter.create(5)`, trong thùng đã có sẵn token khả dụng.

Dưới đây là một demo đơn giản về chế độ giới hạn làm nóng mượt (`SmoothWarmingUp`) của Guava.

```java
import com.google.common.util.concurrent.RateLimiter;
import java.util.concurrent.TimeUnit;

/**
 * Tìm "JavaGuide" trên WeChat và trả lời "Interview Sprint" để nhận miễn phí sổ tay phỏng vấn Java gốc
 *
 * @author Guide
 * @date 2021/10/08 19:12
 **/
public class RateLimiterDemo {

    public static void main(String[] args) {
        // Thả 5 token vào thùng mỗi giây, tức 0.2s thêm 1 token vào thùng
        // Thời gian warm-up là 3s, nghĩa là trong 3s đầu tốc độ cấp token sẽ tăng dần lên mức 0.2s một token
        RateLimiter rateLimiter = RateLimiter.create(5, 3, TimeUnit.SECONDS);
        for (int i = 0; i < 20; i++) {
            double sleepingTime = rateLimiter.acquire(1);
            System.out.printf("get 1 tokens: %sds%n", sleepingTime);
        }
    }
}
```

Kết quả đầu ra:

```bash
get 1 tokens: 0.0s
get 1 tokens: 0.561919s
get 1 tokens: 0.516931s
get 1 tokens: 0.463798s
get 1 tokens: 0.41286s
get 1 tokens: 0.356172s
get 1 tokens: 0.300489s
get 1 tokens: 0.252545s
get 1 tokens: 0.203996s
get 1 tokens: 0.198359s
```

Ngoài ra, **Bucket4j** cũng là một thư viện Rate Limiting rất tốt dựa trên thuật toán Token Bucket / Leaky Bucket.

> Địa chỉ Bucket4j: <https://github.com/vladimir-bukhtoyarov/bucket4j>

So với tiện ích của Guava, Bucket4j cung cấp tính năng Rate Limiting toàn diện hơn nhiều: không chỉ hỗ trợ cả Rate Limiting đơn máy lẫn phân tán, mà còn có thể tích hợp giám sát để dùng chung với Prometheus và Grafana.

Tuy nhiên, Guava vốn là một thư viện tiện ích đa năng và khả năng Rate Limiting dùng ngay của nó vẫn rất thiết thực trong nhiều kịch bản đơn máy.

Bộ giới hạn tốc độ tích hợp sẵn `RedisRateLimiter` của Spring Cloud Gateway được triển khai dựa trên Redis + Lua. Bucket4j và Resilience4j thường tích hợp với gateway thông qua extension độc lập hoặc các thành phần trong hệ sinh thái Spring, chứ không phải là mối quan hệ thay thế tuần tự cho bộ Rate Limiter tích hợp của Spring Cloud Gateway.

Resilience4j là một thư viện chịu lỗi (fault-tolerance) gọn nhẹ, lấy cảm hứng từ Hystrix. Kể từ khi [Netflix thông báo ngừng phát triển tích cực Hystrix](https://github.com/Netflix/Hystrix/commit/a7df971cbaddd8c5e976b3cc5f14013fe6ad00e6), cả đội ngũ Spring chính thức lẫn Netflix đều khuyến nghị dùng Resilience4j để làm Rate Limiting và Circuit Breaking.

> Địa chỉ Resilience4j: <https://github.com/resilience4j/resilience4j>

Thông thường, để đảm bảo tính sẵn sàng cao cho hệ thống, Rate Limiting và Circuit Breaking (ngắt mạch) sẽ được triển khai song hành trong dự án.

Resilience4j không chỉ hỗ trợ Rate Limiting mà còn cung cấp sẵn các tính năng đảm bảo độ sẵn sàng cao như Circuit Breaking, bảo vệ tải (Bulkhead), tự động Retry... Hơn nữa, hệ sinh thái của Resilience4j rất tốt và nhiều API Gateway sử dụng Resilience4j để làm Rate Limiting và Circuit Breaking.

Vì vậy, trong đại đa số tình huống, Resilience4j có thể là lựa chọn tốt hơn. Còn nếu bài toán Rate Limiting tương đối đơn giản thì Guava hoặc Bucket4j cũng là những lựa chọn đáng tin cậy.

## Triển khai Distributed Rate Limiting như thế nào?

Distributed Rate Limiting (giới hạn tốc độ phân tán) hướng tới kiến trúc ứng dụng phân tán / microservices. Trong kiến trúc này, một service có thể được triển khai thành nhiều instance; nếu cần kiểm soát hạn mức (quota) toàn cục thì các instance phải chia sẻ trạng thái giới hạn tốc độ với nhau. Tuy nhiên, không phải mọi kịch bản microservices đều bắt buộc dùng Distributed Rate Limiting: nếu quota có thể chia đều theo số instance (ví dụ tổng quota 1.000 QPS cho 10 instance thì mỗi instance giới hạn 100 QPS), giải pháp đơn máy lại có ưu thế lớn hơn về hiệu năng và độ đơn giản khi triển khai.

Các phương án phổ biến cho Distributed Rate Limiting gồm:

- **Dùng middleware để giới hạn tốc độ**: Có thể sử dụng Sentinel hoặc tự viết logic giới hạn tốc độ bằng Redis.
- **Giới hạn tốc độ tại tầng Gateway**: Đây là phương án rất phổ biến, áp đặt Rate Limiting trực tiếp ngay tại tầng API Gateway. Tuy vậy, tầng Gateway thường vẫn cần dựa vào middleware hoặc framework bên dưới — ví dụ `RedisRateLimiter` của Spring Cloud Gateway được triển khai bằng Redis + Lua, hoặc Spring Cloud Gateway cũng có thể tích hợp Sentinel để làm Rate Limiting.

Nếu bạn tự triển khai logic Rate Limiting dựa trên Redis, nên kết hợp cùng Lua script.

**Vì sao nên dùng Redis + Lua?** Có hai lý do chính:

- **Giảm chi phí mạng (network overhead)**: Ta có thể dùng Lua script để thực thi hàng loạt nhiều lệnh Redis; toàn bộ lệnh sẽ được gửi lên Redis server chạy một lần, giúp giảm đáng kể số vòng lặp mạng.
- **Tính nguyên tử (`Atomicity`)**: Một đoạn Lua script được thực thi như một lệnh đơn lẻ; trong suốt thời gian script đang chạy, không có script hay lệnh Redis nào khác được phép xen vào chạy song song, đảm bảo thao tác không bị gián đoạn hoặc sai lệch bởi lệnh khác.

Lưu ý rằng vì Lua script chạy nguyên tử trong Redis nên nó cũng sẽ chặn (block) các thao tác khác của Redis trong lúc thực thi. Do đó, script Rate Limiting cần giữ thật gọn nhẹ, tránh tính toán phức tạp hoặc duyệt dữ liệu phạm vi lớn, đồng thời kết hợp cấu hình `lua-time-limit` của Redis để ngăn thời gian chạy script vượt tầm kiểm soát.

Tôi sẽ không đưa mã Lua script cụ thể vào đây vì trên mạng đã có rất nhiều script chuẩn để tham khảo — ví dụ plugin RateLimiter của dự án gateway Apache ShenYu đã triển khai các thuật toán Token Bucket / Concurrent Token Bucket, Leaky Bucket và Sliding Window dựa trên Redis + Lua.

> Địa chỉ ShenYu: <https://github.com/apache/incubator-shenyu>

![Lua Script Rate Limiting của ShenYu](/media/jg/ext/oss.javaguide.cn/javaguide/high-availability/limit-request/shenyu-ratelimit-lua-scripts-ccd3a01f.png)

Ngoài ra, nếu không muốn tự viết Lua script, bạn cũng có thể dùng trực tiếp `RRateLimiter` trong Redisson để làm Distributed Rate Limiting; bên dưới lớp này sử dụng sẵn mã Lua kết hợp thuật toán Token Bucket.

Redisson là một Redis client mã nguồn mở bằng ngôn ngữ Java, cung cấp sẵn rất nhiều tính năng tiện dụng như cấu trúc dữ liệu phân tán tương đương Java chuẩn, Distributed Lock, Delayed Queue... Đồng thời Redisson hỗ trợ nhiều mô hình triển khai Redis như Standalone, Redis Sentinel và Redis Cluster.

Cách sử dụng `RRateLimiter` rất đơn giản: trước tiên lấy một đối tượng `RRateLimiter` trực tiếp qua Redisson client, sau đó thiết lập quy tắc giới hạn tốc độ.

```java
// Tạo một instance Redisson client
RedissonClient redissonClient = Redisson.create();
// Lấy đối tượng rate limiter có tên "javaguide.limiter"
RRateLimiter rateLimiter = redissonClient.getRateLimiter("javaguide.limiter");
// Thiết lập tốc độ cho rate limiter là 100 lần mỗi giờ
// RateType có 2 loại: OVERALL là giới hạn toàn cục, PER_CLIENT là giới hạn theo từng Client (có thể coi như giới hạn đơn máy)
rateLimiter.trySetRate(RateType.OVERALL, 100, 1, RateIntervalUnit.HOURS);
```

Tiếp theo, ta gọi phương thức `acquire()` hoặc `tryAcquire()` để xin cấp phép (permit).

```java
// Lấy 1 permit; nếu vượt quá tốc độ của rate limiter thì sẽ chờ
// acquire() là phương thức đồng bộ, phương thức bất đồng bộ tương ứng là acquireAsync()
rateLimiter.acquire(1);
// Thử lấy 1 permit trong vòng 5 giây; trả về true nếu thành công, ngược lại trả về false
// tryAcquire() là phương thức đồng bộ, phương thức bất đồng bộ tương ứng là tryAcquireAsync()
boolean res = rateLimiter.tryAcquire(1, 5, TimeUnit.SECONDS);
```

Độ chính xác của `RRateLimiter` chịu ảnh hưởng bởi hiệu năng Redis và độ trễ mạng, nên trong kịch bản đồng thời cực cao vẫn có thể xảy ra vượt ngưỡng nhẹ. Khi Redis gặp sự cố hoặc chuyển đổi primary-replica, `tryAcquire()` có thể ném ra ngoại lệ; tầng nghiệp vụ cần xác định trước chiến lược hạ cấp (fallback): quay về Rate Limiting cục bộ, từ chối trực tiếp, hay tạm thời cho qua trong thời gian ngắn — tùy vào sự đánh đổi giữa tính ổn định và tính sẵn sàng của nghiệp vụ.

## Tổng kết

Bài viết này đã trình bày các thuật toán Rate Limiting phổ biến, cách lựa chọn đối tượng áp dụng Rate Limiting cũng như phương án triển khai Rate Limiting đơn máy và phân tán.

## Tài liệu tham khảo

- Quản trị dịch vụ với framework ngắt mạch gọn nhẹ Resilience4j: <https://xie.infoq.cn/article/14786e571c1a4143ad1ef8f19>
- Phân tích cực kỳ chi tiết nguyên lý Rate Limiting của Guava RateLimiter: <https://cloud.tencent.com/developer/article/1408819>
- Thực chiến Spring Cloud Gateway - Phần Rate Limiting 👍: <https://www.aneasystone.com/archives/2020/08/spring-cloud-gateway-current-limiting.html>
- Giải thích chi tiết nguyên lý triển khai Distributed Rate Limiting của Redisson: <https://juejin.cn/post/7199882882138898489>
- Tổng hợp triển khai API Rate Limiting trong Java - Alibaba Cloud Developer: <https://mp.weixin.qq.com/s/A5VYjstIDeVvizNK2HkrTQ>
- Khám phá và thực hành giải pháp Distributed Rate Limiting - Tencent Cloud Developer: <https://mp.weixin.qq.com/s/MJbEQROGlThrHSwCjYB_4Q>
