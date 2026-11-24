---
title: Tổng quan tính năng mới Java 11 (Quan trọng)
description: "Tổng hợp các cập nhật của JDK 11, tập trung vào HTTP Client mới, các cải tiến trên String và những tính năng thực tiễn."
category: Java
tag:
  - Tính năng mới Java
lang: vi
sourceRef: zh-ref/java/new-features/java11.md
head:
  - - meta
    - name: keywords
      content: Java 11,JDK 11,LTS,HTTP Client,String API,tính năng bị loại bỏ
---

Java 11 chính thức được phát hành vào ngày 25 tháng 9 năm 2018, đây là một phiên bản rất quan trọng! Java 11 là phiên bản hỗ trợ dài hạn (Long-Term Support - LTS) đầu tiên kể từ sau Java 8. Theo lộ trình hỗ trợ hiện tại của Oracle, thời gian Extended Support cho Java 11 sẽ kéo dài đến tháng 1 năm 2032.

Hình dưới đây là mốc thời gian hỗ trợ Oracle JDK chính thức do Oracle công bố:

![Mốc thời gian hỗ trợ Oracle JDK chính thức do Oracle công bố](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/4c1611fad59449edbbd6e233690e9fa7-08d369cd.png)

Hình dưới đây là số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25:

![Số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

Bài viết này sẽ chọn lọc và giới thiệu chi tiết một số tính năng mới quan trọng:

- [JEP 321: HTTP Client (Standard)](https://openjdk.org/jeps/321)
- [JEP 323: Local-Variable Syntax for Lambda Parameters](https://openjdk.org/jeps/323)
- [JEP 330: Launch Single-File Source-Code Programs](https://openjdk.org/jeps/330)
- [JEP 333: ZGC: A Scalable Low-Latency Garbage Collector (Experimental)](https://openjdk.org/jeps/333)

## JEP 321: HTTP Client (HTTP Client bản tiêu chuẩn)

Java 11 đã chuẩn hóa HTTP Client API từng được giới thiệu ở Java 9 và cập nhật ở Java 10. Trong hai phiên bản ươm tạo trước đó, HTTP Client gần như được viết lại hoàn toàn và hiện đã hỗ trợ đầy đủ bất đồng bộ không chặn (asynchronous non-blocking).

Hơn nữa, trong Java 11, tên package của HTTP Client đã đổi từ `jdk.incubator.http` thành `java.net.http`; API này cung cấp ngữ nghĩa request và response không chặn thông qua `CompletableFuture`. Cách sử dụng cũng rất đơn giản, như sau:

```java
var request = HttpRequest.newBuilder()
    .uri(URI.create("https://javastack.cn"))
    .GET()
    .build();
var client = HttpClient.newHttpClient();

// Đồng bộ
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());

// Bất đồng bộ
client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
    .thenApply(HttpResponse::body)
    .thenAccept(System.out::println);
```

## JEP 333: ZGC (Bộ thu gom rác độ trễ thấp có khả năng mở rộng, Thử nghiệm)

**ZGC tức Z Garbage Collector**, là một bộ thu gom rác có khả năng mở rộng cao và độ trễ thấp.

ZGC được thiết kế chủ yếu nhằm đáp ứng các mục tiêu sau:

- Thời gian tạm dừng GC (pause time) không vượt quá 10 ms
- Xử lý tốt cả Heap nhỏ vài trăm MB lẫn Heap lớn tới vài TB
- Thông lượng (throughput) của ứng dụng không suy giảm quá 15% (so với thuật toán thu gom G1)
- Tạo nền tảng thuận lợi để đưa vào các tính năng GC mới và tối ưu hóa dựa trên con trỏ màu (colored pointers) cùng rào cản tải (load barriers)
- Hiện tại chỉ hỗ trợ nền tảng Linux/x64

ZGC hiện **đang ở giai đoạn thử nghiệm**, chỉ hỗ trợ nền tảng Linux/x64. Lưu ý: ZGC trở thành tính năng chính thức ở Java 15 và đưa vào Generational ZGC ở Java 21.

Tương tự như ParNew trong CMS và G1, ZGC cũng áp dụng thuật toán đánh dấu - sao chép (mark-copy), nhưng ZGC đã có những cải tiến lớn đối với thuật toán này.

Với ZGC, tình trạng Stop-The-World sẽ xảy ra ít hơn rất nhiều!

Chi tiết xem thêm: [Khám phá và thực hành bộ thu gom rác thế hệ mới ZGC [Tiếng Trung]](https://tech.meituan.com/2020/08/06/new-zgc-practice-in-meituan.html)

## JEP 323: Local-Variable Syntax for Lambda Parameters (Cú pháp biến cục bộ cho tham số Lambda)

Từ Java 10, tính năng quan trọng là suy luận kiểu biến cục bộ đã được đưa vào. Suy luận kiểu cho phép dùng từ khóa `var` làm kiểu cho biến cục bộ thay vì kiểu thực tế, trình biên dịch sẽ suy ra kiểu dữ liệu dựa vào giá trị gán cho biến.

Trong Java 10, từ khóa `var` có một số giới hạn:

- Chỉ dùng được cho biến cục bộ
- Phải khởi tạo ngay khi khai báo
- Không thể dùng làm tham số phương thức
- Không thể dùng trong biểu thức Lambda

Từ Java 11, lập trình viên được phép sử dụng `var` để khai báo tham số trong biểu thức Lambda.

```java
// Hai cách viết dưới đây là tương đương
Consumer<String> consumer = (var i) -> System.out.println(i);
Consumer<String> consumer = (String i) -> System.out.println(i);
```

## JEP 330: Launch Single-File Source-Code Programs (Chạy trực tiếp chương trình mã nguồn một file)

Điều này có nghĩa là chúng ta có thể chạy trực tiếp một file mã nguồn Java đơn lẻ. Tính năng này cho phép trình thực thi Java chạy thẳng mã nguồn Java: mã nguồn được biên dịch ngay trong bộ nhớ rồi thực thi luôn, không cần sinh ra file `.class` trên đĩa nữa. Ràng buộc duy nhất là toàn bộ các lớp liên quan phải được định nghĩa trong cùng một file Java.

Tính năng này đặc biệt hữu ích cho người mới học Java muốn thử nghiệm các chương trình đơn giản, và có thể kết hợp với `jshell`, giúp tăng cường phần nào khả năng dùng Java để viết script.

## Cải tiến API

Không phải mọi thay đổi API đều được phát hành thông qua JEP (Java Enhancement Proposal).

Trong quy trình phát triển JDK: **JEP** thường dùng cho các thay đổi lớn, chẳng hạn như đưa vào tính năng ngôn ngữ mới (như `var`), cơ chế JVM mới (như ZGC) hoặc tái cấu trúc thư viện quy mô lớn. Những thao tác như thêm một vài phương thức kiểu `String.isBlank()` vào các lớp sẵn có thường được xem là bảo trì thư viện thông thường. Chúng được các lập trình viên JDK gửi trực tiếp qua ticket trên **JBS (JDK Bug System)** để đánh giá rồi phát hành trực tiếp theo phiên bản.

### Cải tiến String

Java 11 bổ sung hàng loạt phương thức xử lý chuỗi (`String`):

```java
// Kiểm tra chuỗi có trống (rỗng hoặc chỉ chứa khoảng trắng) không
" ".isBlank();//true
// Xóa khoảng trắng ở đầu và cuối chuỗi
" Java ".strip();// "Java"
// Xóa khoảng trắng ở đầu chuỗi
" Java ".stripLeading();   // "Java "
// Xóa khoảng trắng ở cuối chuỗi
" Java ".stripTrailing();  // "Java"
// Lặp lại chuỗi bao nhiêu lần
"Java".repeat(3);             // "JavaJavaJava"
// Trả về tập hợp các chuỗi được phân tách bởi ký tự xuống dòng.
"A\nB\nC".lines().count();    // 3
"A\nB\nC".lines().collect(Collectors.toList());
```

### Cải tiến Optional

Bổ sung phương thức `isEmpty()` để kiểm tra đối tượng `Optional` chỉ định có rỗng hay không.

```java
var op = Optional.empty();
System.out.println(op.isEmpty());// Kiểm tra đối tượng Optional chỉ định có rỗng hay không
```

## Các tính năng mới khác

- **Garbage Collector mới Epsilon**: Một cài đặt GC hoàn toàn thụ động (no-op), cấp phát lượng tài nguyên bộ nhớ hữu hạn, giảm tối đa chi phí chiếm dụng bộ nhớ và độ trễ thông lượng bộ nhớ.
- **Heap Profiling chi phí thấp (Low-Overhead Heap Profiling)**: Java 11 cung cấp phương pháp lấy mẫu cấp phát Heap Java với chi phí thấp, giúp thu được thông tin về các đối tượng Java được cấp phát trên Heap và có thể truy cập thông tin Heap thông qua JVMTI.
- **Giao thức TLS 1.3**: Java 11 bao gồm cài đặt đặc tả Transport Layer Security (TLS) 1.3 (RFC 8446), thay thế cho các phiên bản TLS trước đó bao gồm TLS 1.2; đồng thời cải tiến các tính năng TLS khác như phần mở rộng OCSP stapling (RFC 6066, RFC 6961), cũng như phần mở rộng session hash và extended master secret (RFC 7627), mang lại nhiều nâng cấp về bảo mật và hiệu năng.
- **Java Flight Recorder (JFR)**: Flight Recorder trước đây là một công cụ phân tích của phiên bản JDK thương mại, nhưng từ Java 11, mã nguồn của nó đã được đưa vào kho mã nguồn mở công khai để mọi người đều có thể sử dụng tính năng này.
- ...

## Tài liệu tham khảo

- JDK 11 Release Notes: <https://www.oracle.com/java/technologies/javase/11-relnote-issues.html>
- Java 11 – Features and Comparison: <https://www.geeksforgeeks.org/java-11-features-and-comparison/>
