---
title: Tổng quan các tính năng mới của Java 26
description: Tổng quan các tính năng mới trọng tâm và thay đổi bản xem trước của JDK 26, tập trung vào HTTP/3, tối ưu hiệu năng GC, AOT cache và các cải tiến ngôn ngữ/nền tảng.
category: Java
tag:
  - Tính năng mới của Java
lang: vi
sourceRef: zh-ref/java/new-features/java26.md
head:
  - - meta
    - name: keywords
      content: Java 26,JDK26,HTTP/3,G1 GC,AOT Cache,Lazy Constants,Structured Concurrency,Vector API,Pattern Matching
---

JDK 26 được phát hành vào ngày 17 tháng 3 năm 2026; đây là một phiên bản không phải LTS (không phải bản hỗ trợ dài hạn). Phiên bản hỗ trợ dài hạn trước đó là **JDK 25**, và phiên bản hỗ trợ dài hạn tiếp theo dự kiến là **JDK 29**.

JDK 26 có tổng cộng 10 tính năng mới; bài viết này sẽ chọn lọc một số tính năng mới tương đối quan trọng để giới thiệu chi tiết:

- [JEP 517: HTTP/3 for the HTTP Client API (Hỗ trợ HTTP/3 cho HTTP Client API)](https://openjdk.org/jeps/517)
- [JEP 522: G1 GC: Improve Throughput by Reducing Synchronization (Tối ưu thông lượng G1 GC)](https://openjdk.org/jeps/522)
- [JEP 516: Ahead-of-Time Object Caching with Any GC (AOT Object Cache hỗ trợ mọi GC)](https://openjdk.org/jeps/516)
- [JEP 500: Prepare to Make Final Mean Final (Chuẩn bị làm cho final thực sự bất biến)](https://openjdk.org/jeps/500)
- [JEP 526: Lazy Constants (Hằng số khởi tạo trễ, Bản xem trước lần 2)](https://openjdk.org/jeps/526)
- [JEP 525: Structured Concurrency (Bản xem trước lần 6)](https://openjdk.org/jeps/525)
- [JEP 530: Primitive Types in Patterns, instanceof, and switch (Khớp mẫu hỗ trợ kiểu nguyên thủy, Bản xem trước lần 4)](https://openjdk.org/jeps/530)
- [JEP 524: PEM Encodings of Cryptographic Objects (Mã hóa PEM cho đối tượng mật mã, Bản xem trước lần 2)](https://openjdk.org/jeps/524)
- [JEP 529: Vector API (Thử nghiệm lần 11)](https://openjdk.org/jeps/529)
- [JEP 504: Remove the Applet API (Loại bỏ Applet API)](https://openjdk.org/jeps/504)

Biểu đồ dưới đây thống kê số lượng tính năng mới và thời gian phát hành của từng bản cập nhật từ JDK 8 đến JDK 25:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 517: Hỗ trợ HTTP/3 cho HTTP Client API

JDK 26 đã chính thức bổ sung hỗ trợ **HTTP/3** cho `java.net.http.HttpClient` API; đây là một bản cập nhật quan trọng được mong đợi từ lâu.

**Ưu điểm của HTTP/3**:

- **Dựa trên giao thức QUIC**: HTTP/2 được cài đặt dựa trên giao thức TCP, còn HTTP/3 sử dụng giao thức QUIC (Quick UDP Internet Connections) để đảm bảo truyền tải tin cậy, cung cấp mức bảo mật tương đương TLS/SSL với độ trễ kết nối và truyền dữ liệu thấp hơn. Bạn có thể xem QUIC như phiên bản nâng cấp của UDP với nhiều tính năng bổ sung như mã hóa, truyền lại (retransmission), v.v.
- **Loại bỏ tắc nghẽn đầu hàng (Head-of-Line blocking)**: HTTP/2 ghép kênh nhiều request trên một kết nối TCP duy nhất; một khi xảy ra mất gói tin, toàn bộ các HTTP request sẽ bị chặn. Nhờ đặc tính của giao thức QUIC, HTTP/3 giải quyết phần lớn vấn đề tắc nghẽn đầu hàng (Head-of-Line blocking, viết tắt: HOL blocking): một kết nối thiết lập nhiều luồng dữ liệu (stream) khác nhau; khi một stream bị mất gói tin, các stream khác không bị ảnh hưởng.
- **Thiết lập kết nối nhanh hơn**: HTTP/2 phải trải qua quá trình bắt tay ba bước (three-way handshake) kinh điển của TCP (và vì kết nối HTTPS bảo mật còn cần bắt tay TLS nên tổng cộng mất khoảng 3 RTT). Nhờ đặc tính của giao thức QUIC (tích hợp TLS 1.3 — vốn hỗ trợ cả bắt tay 1-RTT lẫn 0-RTT), việc thiết lập kết nối chỉ cần 0-RTT hoặc 1-RTT. Điều này có nghĩa là trong trường hợp tốt nhất, QUIC không cần thêm bất kỳ thời gian khứ hồi (RTT) nào vẫn có thể thiết lập kết nối mới.
- **Trải nghiệm di động tốt hơn**: HTTP/3 hỗ trợ di trú kết nối (connection migration) dựa trên QUIC. QUIC dùng Connection ID có độ dài thay đổi do điểm cuối lựa chọn để định danh và định tuyến kết nối, và Connection ID thậm chí có thể thay đổi trong suốt phiên kết nối; sau khi xác thực đường truyền (path validation) và các xử lý liên quan, khi địa chỉ mạng thay đổi (như chuyển từ Wi-Fi sang dữ liệu di động), không cần thiết lập lại toàn bộ kết nối như khi bộ bốn (4-tuple) TCP truyền thống thay đổi.

Để tìm hiểu chi tiết, bạn có thể đọc bài viết này: [Tổng hợp câu hỏi phỏng vấn thường gặp về Mạng máy tính (Phần 1)](https://javaguide.cn/cs-basics/network/other-network-questions.html) (Mô hình phân tầng mạng, tổng hợp các giao thức mạng phổ biến, HTTP, WebSocket, DNS, v.v.).

**Cách sử dụng**:

Trong JDK 26, giao thức mặc định của `HttpClient` vẫn là HTTP/2. Để sử dụng HTTP/3, cần chỉ định tường minh `HTTP_3` trên `HttpClient` hoặc trên từng `HttpRequest`:

```java
HttpClient client = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_3)
    .build();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://example.com"))
    .build();

// Ưu tiên thử HTTP/3; mặc định tự lùi về HTTP/2 hoặc HTTP/1.1 nếu máy chủ không hỗ trợ
HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());

System.out.println(response.body());
```

Nếu cần chỉ định rõ việc sử dụng HTTP/3, có thể thiết lập thông qua phương thức `version()`:

```java
// Mặc định tất cả các request ưu tiên dùng HTTP/3
HttpClient client = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_3)  // Chỉ định rõ HTTP/3
    .build();

// Thiết lập phiên bản giao thức ưu tiên cho một đối tượng HttpRequest riêng lẻ
HttpRequest request = HttpRequest.newBuilder(URI.create("https://javaguide.cn/"))
                         .version(HttpClient.Version.HTTP_3)
                         .GET().build();
```

## JEP 522: Tối ưu thông lượng G1 GC

**Từ JDK 9 trở đi, G1 Garbage Collector đã trở thành bộ thu gom rác mặc định.** Nó tìm kiếm sự cân bằng giữa độ trễ (latency) và thông lượng (throughput). Tuy nhiên, sự cân bằng này đôi khi ảnh hưởng đến hiệu năng của ứng dụng. So với Parallel GC vốn hướng đến thông lượng, G1 làm việc đồng thời (concurrent) với ứng dụng nhiều hơn để giảm thời gian tạm dừng GC. Nhưng điều đó đồng nghĩa với việc các Thread ứng dụng phải chia sẻ CPU và phối hợp với các Thread GC; sự đồng bộ hóa này làm giảm thông lượng và tăng độ trễ.

JEP 522 giới thiệu cơ chế **Card Table kép (Dual Card Table)**:

1. **Card Table thứ nhất**: Write barrier của Thread ứng dụng khi cập nhật Card Table này **không cần bất kỳ sự đồng bộ nào**, giúp mã write barrier đơn giản và nhanh hơn.
2. **Card Table thứ hai**: Các Thread tinh chỉnh (refinement threads) xử lý song song ở chế độ nền trên Card Table ban đầu còn trống này.

Khi G1 phát hiện việc quét Card Table thứ nhất có thể vượt quá mục tiêu thời gian tạm dừng, nó sẽ hoán đổi nguyên tử (atomically swap) hai Card Table này. Các Thread ứng dụng tiếp tục cập nhật bảng đang trống (vốn là bảng thứ hai trước đó), còn các Thread tinh chỉnh xử lý bảng đã đầy (vốn là bảng thứ nhất trước đó) mà không cần đồng bộ thêm.

**Hiệu quả cải thiện hiệu năng**:

- Trong các ứng dụng **thường xuyên chỉnh sửa trường tham chiếu đối tượng**, thông lượng tăng **5–15%**
- Ngay cả trong các ứng dụng ít chỉnh sửa trường tham chiếu, nhờ write barrier được đơn giản hóa (trên x64 giảm từ khoảng 50 lệnh xuống chỉ còn 12 lệnh), thông lượng vẫn có thể tăng tới **5%**
- Thời gian tạm dừng GC cũng **giảm nhẹ**

**Chi phí bộ nhớ**:

Card Table thứ hai có dung lượng bằng Card Table thứ nhất; mỗi Card Table cần 0,2% dung lượng Java Heap, tức mỗi 1 GB bộ nhớ Heap sẽ sử dụng thêm khoảng 2 MB bộ nhớ native.

## JEP 516: AOT Object Cache hỗ trợ mọi GC

Đây là cột mốc quan trọng của **Project Leyden**, giúp bộ nhớ đệm đối tượng biên dịch trước (Ahead-of-Time, AOT) có thể phối hợp hoạt động với **bất kỳ Garbage Collector nào**.

Trước đó, tính năng AOT Class Data Sharing được giới thiệu trong JDK 24 (JEP 483) chỉ hỗ trợ G1 Garbage Collector và không thể hoạt động cùng các GC khác như ZGC. Nguyên nhân là do các tham chiếu đối tượng lưu trong AOT cache sử dụng địa chỉ bộ nhớ vật lý, trong khi các GC khác nhau có bố cục bộ nhớ và chiến lược di chuyển đối tượng khác nhau.

JEP 516 chuyển cách lưu trữ tham chiếu đối tượng từ **địa chỉ bộ nhớ vật lý** sang **chỉ mục logic (logical index)**:

- Sử dụng định dạng luồng (streaming format) độc lập với GC để lưu trữ cache
- Cache có thể được nạp và phân giải bởi bất kỳ GC nào tại runtime
- JVM chuyển đổi các chỉ mục logic thành địa chỉ bộ nhớ thực tế khi nạp

**Lợi ích hiệu năng**:

- **Tối ưu thời gian khởi động**: Giảm đáng kể thời gian khởi động nguội (cold start) của ứng dụng Java
- **Hỗ trợ ZGC**: ZGC có độ trễ thấp nay cũng có thể hưởng lợi tăng tốc khởi động từ AOT cache
- **Thân thiện với Cloud-Native**: Đặc biệt có giá trị với các kịch bản nhạy cảm về thời gian khởi động như microservices và serverless functions

## JEP 500: Chuẩn bị làm cho `final` thực sự bất biến

Tính năng này mở đường cho nguyên tắc ưu tiên tính toàn vẹn (integrity by default) của Java, chuẩn bị giúp các trường `final` thực sự trở nên bất biến.

Từ JDK 5, để hỗ trợ các kịch bản như Serialization, Reflection API cho phép chỉnh sửa một số trường `final` thông qua **Deep Reflection**:

```java
import java.lang.reflect.Field;

class Example {
    private final String name;

    Example(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}

// Chỉnh sửa trường final thông qua Reflection
Example example = new Example("Original");
Field field = Example.class.getDeclaredField("name");
field.setAccessible(true);
field.set(example, "Modified");  // JDK 26 mặc định vẫn thành công, đồng thời phát cảnh báo sửa trường final trái phép
System.out.println(example.getName());  // In ra "Modified"
```

Dù khả năng này được một số framework (như thư viện Serialization, framework Dependency Injection, công cụ kiểm thử) sử dụng, nhưng nó phá vỡ đảm bảo bất biến của `final` và cản trở các tối ưu hóa của trình biên dịch.

Trong JDK 26, khi chỉnh sửa trường `final` qua Deep Reflection, JVM sẽ **phát ra cảnh báo**. Đây là bước chuẩn bị cho việc mặc định cấm hành vi này trong các phiên bản tương lai.

Đối với các kịch bản thực sự cần chỉnh sửa trường `final`, JDK 26 cung cấp cơ chế lựa chọn tường minh (opt-in), cho phép lập trình viên tiếp tục sử dụng khả năng này trong giai đoạn chuyển tiếp, đồng thời chuẩn bị sẵn sàng cho chế độ nghiêm ngặt trong tương lai.

## JEP 526: Hằng số khởi tạo trễ (Lazy Constants, Bản xem trước lần 2)

Tính năng này được xem trước lần đầu trong JDK 25 với tên [JEP 502: Stable Values (Preview)](https://openjdk.org/jeps/502); JEP 526 của JDK 26 đổi tên API thành Lazy Constants và tiến hành xem trước lần thứ hai.

Các trường `static final` truyền thống thường được khởi tạo ngay khi lớp được khởi tạo (class initialization), điều này sẽ:

- Làm tăng thời gian khởi động.
- Gây lãng phí bộ nhớ nếu hằng số đó chưa từng được sử dụng.
- Đòi hỏi các mẫu khởi tạo trễ phức tạp (như Double-Checked Locking, mẫu Holder class, v.v.).

JEP 526 giới thiệu `LazyConstant<T>`, một đối tượng nắm giữ dữ liệu bất biến mà JVM coi như hằng số thực thụ để đạt được hiệu năng tối ưu tương đương khi khai báo trường `final`.

```java
// Cách truyền thống: khởi tạo ngay lập tức khi lớp được khởi tạo
static final ExpensiveObject TRADITIONAL = new ExpensiveObject();

// Cách mới: chỉ khởi tạo khi được truy cập lần đầu
static final LazyConstant<ExpensiveObject> LAZY =
    LazyConstant.of(() -> new ExpensiveObject());

// Khi sử dụng
ExpensiveObject obj = LAZY.get();  // Đến lúc này mới khởi tạo
```

**Ưu điểm**:

- **Khởi tạo theo nhu cầu**: Chỉ khởi tạo ở lần truy cập đầu tiên, nâng cao hiệu năng khởi động.
- **An toàn luồng (Thread-safe)**: Tích hợp sẵn đảm bảo an toàn luồng, không cần đồng bộ hóa thủ công.
- **Tối ưu hóa JVM**: JVM có thể tối ưu hóa Lazy Constant giống như trường `final`.
- **Đơn giản hóa mã nguồn**: Loại bỏ các mẫu khởi tạo trễ phức tạp như Double-Checked Locking.

## JEP 525: Structured Concurrency (Bản xem trước lần 6)

JDK 19 đã giới thiệu Structured Concurrency dưới dạng API thử nghiệm (incubator). Trong JDK 26, API này đang ở giai đoạn xem trước lần thứ sáu, với mục đích đơn giản hóa lập trình đa luồng chứ không nhằm thay thế `java.util.concurrent`.

Structured Concurrency coi nhiều tác vụ chạy trên các Thread khác nhau như một đơn vị công việc duy nhất, qua đó đơn giản hóa xử lý lỗi, nâng cao độ tin cậy và tăng cường khả năng quan sát (observability). Nói cách khác, Structured Concurrency giữ lại tính dễ đọc, dễ bảo trì và dễ quan sát như mã nguồn đơn luồng.

API cơ bản của Structured Concurrency là `StructuredTaskScope`, hỗ trợ chia tách một tác vụ thành nhiều tác vụ con đồng thời chạy trên các Thread riêng của chúng, và các tác vụ con phải hoàn thành trước khi tác vụ chính/cha tiếp tục hoặc bị hủy khi tác vụ chính/cha thất bại.

Cách dùng cơ bản của `StructuredTaskScope` như sau:

```java
    try (var scope = StructuredTaskScope.open()) {
        // Dùng phương thức fork để tạo luồng thực thi tác vụ con
        Subtask<Integer> subtask1 = scope.fork(task1);
        Subtask<String> subtask2 = scope.fork(task2);
        // Đợi các luồng hoàn thành
        scope.join();
        // Việc xử lý kết quả có thể bao gồm xử lý hoặc ném lại ngoại lệ
        ... process results/exceptions ...
    } // close
```

Structured Concurrency đặc biệt phù hợp với Virtual Thread (luồng ảo), vốn là loại Thread nhẹ do JDK cài đặt. Nhiều Virtual Thread dùng chung một Thread hệ điều hành, từ đó cho phép tồn tại số lượng cực lớn Virtual Thread.

**Các thay đổi mới trên Java 26**:

- **Cải tiến Joiner**: Giao diện `Joiner` bổ sung phương thức `onTimeout()`, cho phép trả về kết quả cụ thể khi xảy ra quá thời gian chờ (timeout).
- **Tối ưu kiểu trả về**: `allSuccessfulOrThrow()` hiện trả về trực tiếp danh sách kết quả (`List`) thay vì một Stream các tác vụ con như trước đây.
- **Đơn giản hóa API**: `anySuccessfulResultOrThrow()` được rút gọn và đổi tên thành `anySuccessfulOrThrow()`.

## JEP 530: Khớp mẫu hỗ trợ kiểu nguyên thủy (Bản xem trước lần 4)

Tính năng này được xem trước lần đầu qua [JEP 455](https://openjdk.org/jeps/455 "JEP 455") (JDK 23).

Pattern Matching có thể xử lý tất cả các kiểu dữ liệu nguyên thủy (`int`, `double`, `boolean`, v.v.) trong câu lệnh `switch` và `instanceof`:

```java
static void test(Object obj) {
    if (obj instanceof int i) {
        System.out.println("Đây là kiểu int: " + i);
    }
}
```

JDK 26 tiếp tục tăng cường tính năng này:

- Loại bỏ nhiều hạn chế liên quan đến kiểu nguyên thủy, giúp Pattern Matching, `instanceof` và `switch` thống nhất và có sức biểu đạt mạnh hơn.
- Tăng cường định nghĩa về tính chính xác vô điều kiện (unconditional exactness).
- Áp dụng kiểm tra tính trội (dominance check) nghiêm ngặt hơn trong cấu trúc `switch`, giúp trình biên dịch phát hiện và giảm thiểu nhiều lỗi lập trình hơn.

Nhờ vậy, ta có thể thực hiện khớp kiểu và ép kiểu cho các kiểu nguyên thủy một cách an toàn và gọn gàng giống như đối với kiểu đối tượng, tiếp tục loại bỏ mã khuôn mẫu (boilerplate code) trong Java.

## JEP 524: Mã hóa PEM cho đối tượng mật mã (Bản xem trước lần 2)

Tính năng này được xem trước lần đầu qua [JEP 518](https://openjdk.org/jeps/518) (JDK 25).

PEM (Privacy-Enhanced Mail) là định dạng văn bản được sử dụng rộng rãi để lưu trữ và truyền tải các đối tượng mật mã như chứng chỉ, khóa riêng tư (private key) và khóa công khai (public key). JEP 524 cung cấp một API mới để mã hóa các đối tượng mật mã sang định dạng PEM và giải mã từ định dạng PEM trở lại đối tượng mật mã.

```java
// Mã hóa khóa sang định dạng PEM
KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
kpg.initialize(2048);
KeyPair keyPair = kpg.generateKeyPair();

// Mã hóa sang PEM
String pemEncoded = PEMEncoder.of().encodeToString(keyPair.getPrivate());

// Giải mã từ PEM
PrivateKey decodedKey = PEMDecoder.of().decode(pemEncoded, PrivateKey.class);
```

API này giúp giảm rủi ro sai sót, đơn giản hóa các yêu cầu tuân thủ (compliance), đồng thời nâng cao tính di động và khả năng tương tác của các ứng dụng Java bảo mật thông qua việc đơn giản hóa thiết lập và tích hợp mật mã cho nhu cầu doanh nghiệp, đám mây và pháp lý.

## JEP 529: Vector API (Thử nghiệm lần 11)

Tính toán vector bao gồm một chuỗi các phép toán trên vector. Vector API được dùng để biểu diễn các phép tính vector có thể được biên dịch một cách tin cậy tại runtime thành các lệnh vector tối ưu nhất trên các kiến trúc CPU được hỗ trợ, qua đó đạt hiệu năng vượt trội so với tính toán vô hướng (scalar) tương đương.

Mục tiêu của Vector API là mang đến cho người dùng cách thức ngắn gọn, dễ dùng và độc lập nền tảng để biểu diễn đa dạng các phép tính vector.

Đây là phép tính vô hướng đơn giản trên các phần tử mảng:

```java
void scalarComputation(float[] a, float[] b, float[] c) {
   for (int i = 0; i < a.length; i++) {
        c[i] = (a[i] * a[i] + b[i] * b[i]) * -1.0f;
   }
}
```

Đây là phép tính vector tương đương sử dụng Vector API:

```java
static final VectorSpecies<Float> SPECIES = FloatVector.SPECIES_PREFERRED;

void vectorComputation(float[] a, float[] b, float[] c) {
    int i = 0;
    int upperBound = SPECIES.loopBound(a.length);
    for (; i < upperBound; i += SPECIES.length()) {
        // FloatVector va, vb, vc;
        var va = FloatVector.fromArray(SPECIES, a, i);
        var vb = FloatVector.fromArray(SPECIES, b, i);
        var vc = va.mul(va)
                   .add(vb.mul(vb))
                   .neg();
        vc.intoArray(c, i);
    }
    for (; i < a.length; i++) {
        c[i] = (a[i] * a[i] + b[i] * b[i]) * -1.0f;
    }
}
```

Mặc dù vẫn đang ở giai đoạn thử nghiệm (incubator), lần lặp thứ 11 đã đủ để chứng minh tầm quan trọng của nó. Nó giúp Java trong các lĩnh vực nhạy cảm về hiệu năng như tính toán khoa học, học máy (machine learning), suy luận AI (AI inference) và xử lý dữ liệu lớn có thể viết được mã nguồn đạt hiệu năng tiệm cận hoặc thậm chí sánh ngang với các ngôn ngữ native như C++.

## JEP 504: Loại bỏ Applet API

Applet API đã bị đánh dấu lỗi thời trong JDK 9 và bị đánh dấu sẽ loại bỏ trong JDK 17. Đến JDK 26, Applet API cuối cùng đã bị **loại bỏ hoàn toàn**. Thật đáng mừng!

Điều này có nghĩa là:

- Lớp `java.applet.Applet` và các lớp liên quan đã bị xóa bỏ.
- Giảm dung lượng cài đặt và mã nguồn của JDK.
- Nâng cao hiệu năng, tính ổn định và độ bảo mật của ứng dụng.

Công nghệ Applet đã lỗi thời từ lâu, phát triển Web hiện đại đã hoàn toàn chuyển sang các ngăn xếp công nghệ khác. Việc loại bỏ API kế thừa này là một bước cần thiết để hiện đại hóa nền tảng Java.

## Tổng kết

Tuy JDK 26 không phải là phiên bản LTS, nhưng nó vẫn chứa một số tính năng quan trọng đáng chú ý:

| Danh mục | Tính năng |
| -------- | ---------------------------------------------------------- |
| **Mạng** | Hỗ trợ HTTP/3 |
| **Hiệu năng** | Tối ưu thông lượng G1 GC, AOT cache hỗ trợ mọi GC |
| **Ngôn ngữ** | Khớp mẫu hỗ trợ kiểu nguyên thủy (Bản xem trước lần 4), Lazy Constants (Bản xem trước lần 2) |
| **Đồng thời** | Structured Concurrency (Bản xem trước lần 6), Vector API (Thử nghiệm lần 11) |
| **Bảo mật** | Chuẩn bị làm cho `final` thực sự bất biến, hỗ trợ mã hóa PEM |
| **Dọn dẹp** | Loại bỏ Applet API |

Oracle sẽ cung cấp các bản cập nhật đến tháng 9 năm 2026, thời điểm nó sẽ được thay thế bởi Oracle JDK 27.
