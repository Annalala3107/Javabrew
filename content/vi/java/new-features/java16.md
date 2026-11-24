---
title: Tổng quan tính năng mới Java 16
description: Giới thiệu các cập nhật ngôn ngữ và nền tảng của JDK 16, bao gồm lớp Record và các thay đổi JEP khác.
category: Java
tag:
  - Tính năng mới Java
lang: vi
sourceRef: zh-ref/java/new-features/java16.md
head:
  - - meta
    - name: keywords
      content: Java 16,JDK 16,Cải tiến Record,API mới,JEP,Hiệu năng
---

Java 16 chính thức phát hành vào ngày 16/03/2021, là phiên bản không thuộc diện hỗ trợ dài hạn (non-LTS).

JDK 16 có tổng cộng 17 tính năng mới. Bài viết này sẽ chọn lọc và giới thiệu chi tiết một số tính năng mới tương đối quan trọng trong đó:

- [JEP 338: Vector API (Incubator) (Vector API, ươm tạo lần đầu)](https://openjdk.java.net/jeps/338)
- [JEP 376: ZGC: Concurrent Thread-Stack Processing (ZGC xử lý đồng thời Thread Stack)](https://openjdk.java.net/jeps/376)
- [JEP 387: Elastic Metaspace (Metaspace đàn hồi)](https://openjdk.java.net/jeps/387)
- [JEP 390: Warnings for Value-Based Classes (Cảnh báo cho các lớp dựa trên giá trị)](https://openjdk.java.net/jeps/390)
- [JEP 394: Pattern Matching for instanceof (Pattern Matching cho instanceof, chính thức)](https://openjdk.java.net/jeps/394)
- [JEP 395: Records (Lớp record, chính thức)](https://openjdk.java.net/jeps/395)
- [JEP 396: Strongly Encapsulate JDK Internals by Default (Mặc định đóng gói chặt các thành phần nội bộ JDK)](https://openjdk.java.net/jeps/396)
- [JEP 397: Sealed Classes (Second Preview) (Lớp niêm phong, xem trước lần hai)](https://openjdk.java.net/jeps/397)

Biểu đồ dưới đây thể hiện số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25:

![Số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

Đọc thêm: [Tài liệu OpenJDK Java 16](https://openjdk.java.net/projects/jdk/16/).

## JEP 338: Vector API (Vector API, ươm tạo lần đầu)

Vector API ban đầu được đề xuất bởi [JEP 338](https://openjdk.java.net/jeps/338) và tích hợp vào Java 16 dưới dạng [Incubator API](http://openjdk.java.net/jeps/11). Vòng ươm tạo thứ hai được đề xuất bởi [JEP 414](https://openjdk.java.net/jeps/414) và tích hợp vào Java 17; vòng thứ ba được đề xuất bởi [JEP 417](https://openjdk.java.net/jeps/417) và tích hợp vào Java 18; vòng thứ tư được đề xuất bởi [JEP 426](https://openjdk.java.net/jeps/426) và tích hợp vào Java 19.

Incubator API này cung cấp bản lặp đầu tiên của một API dùng để biểu diễn các phép tính vector, có thể biên dịch ổn định tại runtime thành các tập lệnh phần cứng vector tối ưu trên các kiến trúc CPU được hỗ trợ, từ đó đạt hiệu năng vượt trội so với các phép tính vô hướng tương đương bằng cách tận dụng triệt để công nghệ Single Instruction, Multiple Data (SIMD) (một khả năng tập lệnh có trên hầu hết các CPU hiện đại). Mặc dù HotSpot có hỗ trợ tự động vector hóa (auto-vectorization), nhưng tập các phép toán vô hướng có thể chuyển đổi còn hạn chế và rất dễ bị ảnh hưởng khi code thay đổi. API này giúp lập trình viên dễ dàng viết các thuật toán vector hiệu năng cao và có tính di động bằng Java.

Trong bài [Tổng quan tính năng mới Java 18](./java18.md), tôi đã giới thiệu chi tiết về Vector API nên ở đây sẽ không trình bày thêm nữa.

## JEP 347: Enable C++ 14 Language Features (Kích hoạt tính năng ngôn ngữ C++ 14)

Java 16 cho phép sử dụng các tính năng của ngôn ngữ C++ 14 trong mã nguồn C++ của JDK, đồng thời đưa ra hướng dẫn cụ thể về những tính năng nào có thể sử dụng trong mã nguồn HotSpot.

Trong Java 15, các tính năng ngôn ngữ được dùng trong mã C++ của JDK chỉ giới hạn ở chuẩn C++98/03. Thay đổi này đòi hỏi phải nâng cấp phiên bản trình biên dịch tối thiểu được chấp nhận trên các nền tảng khác nhau.

## JEP 376: ZGC: Concurrent Thread-Stack Processing (ZGC xử lý đồng thời Thread Stack)

Java 16 chuyển việc xử lý Thread Stack của ZGC ra khỏi Safepoint sang một pha chạy đồng thời (concurrent phase), cho phép thời gian tạm dừng GC Safepoint duy trì dưới mức mili-giây ngay cả trên các Heap kích thước lớn. Việc loại bỏ nguồn gây độ trễ cuối cùng trong bộ thu gom rác ZGC giúp cải thiện đáng kể hiệu năng và hiệu suất của ứng dụng.

## JEP 387: Elastic Metaspace (Metaspace đàn hồi)

Kể từ khi Metaspace được đưa vào, theo phản hồi thực tế, Metaspace thường chiếm dụng quá nhiều bộ nhớ ngoài Heap (off-heap), dẫn đến lãng phí bộ nhớ. Tính năng Elastic Metaspace (Metaspace đàn hồi) giúp trả lại bộ nhớ siêu dữ liệu lớp của HotSpot (tức Metaspace) chưa sử dụng về cho hệ điều hành nhanh chóng hơn, từ đó giảm dung lượng chiếm dụng của Metaspace.

Ngoài ra, đề xuất này còn đơn giản hóa mã nguồn của Metaspace để giảm chi phí bảo trì.

## JEP 390: Warnings for Value-Based Classes (Cảnh báo cho các lớp dựa trên giá trị)

> Phần giới thiệu dưới đây được trích từ: [Thực hành | Phân tích các tính năng cú pháp mới của Java 16](https://xie.infoq.cn/article/8304c894c4e38318d38ceb116) (bài gốc viết rất hay, khuyến khích đọc thêm).

Ngay từ phiên bản Java 9, các nhà thiết kế Java đã nâng cấp annotation `@Deprecated` bằng cách bổ sung 2 thuộc tính mới là `since` và `forRemoval`. Trong đó, `since` dùng để chỉ định phiên bản mà API gắn `@Deprecated` bắt đầu bị đánh dấu lỗi thời, còn `forRemoval` làm rõ hơn nữa ngữ nghĩa khi gắn `@Deprecated`: nếu `forRemoval=true`, điều đó có nghĩa API này chắc chắn sẽ bị xóa trong phiên bản tương lai và lập trình viên nên chuyển sang API mới thay thế, tránh gây hiểu nhầm (trước Java 9, một API gắn `@Deprecated` có thể mang nhiều hàm ý khác nhau như: có rủi ro khi dùng, có thể gặp lỗi tương thích trong tương lai, có thể bị xóa ở phiên bản sau, hoặc nên dùng phương án thay thế tốt hơn).

Quan sát kỹ các lớp Wrapper của kiểu nguyên thủy (ví dụ `java.lang.Integer`, `java.lang.Double`), không khó để nhận thấy các constructor của chúng đều đã được gắn `@Deprecated(since="9", forRemoval = true)`. Điều này đồng nghĩa các constructor này có kế hoạch bị loại bỏ trong tương lai, không nên tiếp tục viết theo kiểu `new Integer(10)` trong chương trình (khuyến khích dùng `Integer a = 10` hoặc `Integer.valueOf()`). Nếu tiếp tục dùng, trình biên dịch sẽ phát sinh cảnh báo `'Integer(int)' is deprecated and marked for removal`. Hơn nữa, các lớp Wrapper này cùng với `java.util.Optional` và `java.time.LocalDateTime` đã được chỉ định là các lớp dựa trên giá trị (value-based class) — lưu ý không nhầm lẫn với value types trong Project Valhalla.

Thứ hai, khi sử dụng thể hiện của các value-based class trong khối đồng bộ `synchronized`, trình biên dịch của JDK 16 sẽ phát sinh cảnh báo. HotSpot cũng có thể ghi log hoặc ngăn chặn kiểu đồng bộ hóa này tại runtime thông qua các tham số chẩn đoán. Ngay cả khi không bật chẩn đoán tại runtime, cũng không nên dùng thể hiện của value-based class làm khóa đồng bộ, ví dụ:

```java
private Integer count = 0;

public void inc() {
    synchronized (count) {
        count++;
    }
}
```

`Integer` là đối tượng bất biến (immutable); `count++` sẽ trải qua quá trình unboxing, cộng thêm 1 rồi re-boxing lại, và gán tham chiếu trường sang một thể hiện `Integer` khác. Do đó, các Thread khác nhau có thể khóa vào các đối tượng khác nhau, không thể đảm bảo loại trừ lẫn nhau (mutual exclusion) ổn định cho thao tác kết hợp này. Nếu cần tăng giá trị đồng thời, nên dùng một đối tượng khóa cố định hoặc `AtomicInteger`.

## JEP 392: Packaging Tool (Công cụ đóng gói, chính thức)

Trong Java 14, JEP 343 đã giới thiệu công cụ đóng gói với lệnh `jpackage`. Ở Java 15 nó tiếp tục được ươm tạo, và nay đến Java 16 cuối cùng đã trở thành tính năng chính thức.

Công cụ đóng gói này cho phép đóng gói các ứng dụng Java tự chứa (self-contained). Nó hỗ trợ các định dạng gói cài đặt bản địa (native) để mang lại trải nghiệm cài đặt tự nhiên cho người dùng cuối, bao gồm `msi` và `exe` trên Windows, `pkg` và `dmg` trên macOS, cũng như `deb` và `rpm` trên Linux. Nó cũng cho phép chỉ định tham số khởi chạy khi đóng gói và có thể gọi trực tiếp từ dòng lệnh hoặc gọi bằng mã nguồn thông qua `ToolProvider` API. Lưu ý tên module của `jpackage` đã đổi từ `jdk.incubator.jpackage` thành `jdk.jpackage`. Điều này giúp cải thiện trải nghiệm cài đặt của người dùng cuối và đơn giản hóa việc triển khai theo mô hình "kho ứng dụng" (app store).

Về cách sử dụng thực tế công cụ đóng gói này, bạn có thể xem video [Playing with Java 16 jpackage](https://www.youtube.com/watch?v=KahYIVzRIkQ) (có thể cần VPN/proxy nếu bị chặn truy cập).

## JEP 393: Foreign Memory Access API (API truy cập bộ nhớ ngoài, ươm tạo lần ba)

Giới thiệu Foreign-Memory Access API nhằm cho phép chương trình Java truy cập an toàn và hiệu quả vào bộ nhớ ngoài nằm bên ngoài Java Heap.

Foreign-Memory Access API được ươm tạo lần đầu trong Java 14 ([JEP 370](https://openjdk.org/jeps/370)), ươm tạo lần hai trong Java 15 ([JEP 383](https://openjdk.org/jeps/383)), và ươm tạo lần ba trong Java 16.

Mục tiêu của việc đưa vào Foreign-Memory Access API gồm:

- **Tính tổng quát**: Một API duy nhất có thể thao tác trên nhiều loại bộ nhớ ngoài khác nhau (như native memory, persistent memory, heap memory, v.v.).
- **Tính an toàn**: Dù thao tác với loại bộ nhớ nào, API cũng không được phá vỡ tính an toàn của JVM.
- **Khả năng kiểm soát**: Có thể tự do lựa chọn cách giải phóng bộ nhớ (tường minh, ngầm định, v.v.).
- **Tính khả dụng**: Đối với các chương trình cần truy cập bộ nhớ ngoài, API này phải cung cấp một giải pháp dễ dùng đủ sức thay thế cho `sun.misc.Unsafe`.

## JEP 394: Pattern Matching for instanceof (Pattern Matching cho instanceof, chính thức)

| Phiên bản JDK | Loại cập nhật     | JEP                                     | Nội dung thay đổi                                                                  |
| ------------- | ----------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| Java SE 14    | preview           | [JEP 305](https://openjdk.org/jeps/305) | Lần đầu giới thiệu Pattern Matching cho `instanceof`.                              |
| Java SE 15    | Second Preview    | [JEP 375](https://openjdk.org/jeps/375) | Không thay đổi so với phiên bản trước, tiếp tục thu thập thêm phản hồi.           |
| Java SE 16    | Permanent Release | [JEP 394](https://openjdk.org/jeps/394) | Biến mẫu (pattern variable) không còn mặc định ngầm là `final` nữa.                |

Từ Java 16 trở đi, bạn có thể thay đổi giá trị của biến mẫu trong `instanceof`.

```java
// Old code
if (o instanceof String) {
    String s = (String)o;
    ... use s ...
}

// New code
if (o instanceof String s) {
    ... use s ...
}
```

## JEP 395: Records (Lớp record, chính thức)

Lịch sử thay đổi của kiểu `record`:

| Phiên bản JDK | Loại cập nhật     | JEP                                          | Nội dung thay đổi                                                                              |
| ------------- | ----------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Java SE 14    | Preview           | [JEP 359](https://openjdk.java.net/jeps/359) | Đưa vào từ khóa `record`, cung cấp cú pháp gọn nhẹ để định nghĩa dữ liệu bất biến trong lớp.   |
| Java SE 15    | Second Preview    | [JEP 384](https://openjdk.org/jeps/384)      | Hỗ trợ sử dụng `record` trong phương thức cục bộ (local method) và interface.                  |
| Java SE 16    | Permanent Release | [JEP 395](https://openjdk.org/jeps/395)      | Non-static inner class có thể định nghĩa các thành viên `static` không phải hằng số.           |

Từ Java SE 16 trở đi, non-static inner class có thể định nghĩa các thành viên `static` không phải hằng số.

```java
public class Outer {
  class Inner {
    static int age;
  }
}
```

> Trước JDK 16, nếu viết đoạn code trên, IDE sẽ báo lỗi rằng trường tĩnh `age` không thể được khai báo trong một non-static inner type trừ khi nó được khởi tạo bằng một biểu thức hằng số (The field age cannot be declared static in a non-static inner type, unless initialized with a constant expression).

## JEP 396: Strongly Encapsulate JDK Internals by Default (Mặc định đóng gói chặt các thành phần nội bộ JDK)

Tính năng này mặc định đóng gói chặt toàn bộ các thành phần nội bộ của JDK, ngoại trừ các API nội bộ cốt lõi (ví dụ `sun.misc.Unsafe`). Theo mặc định, các đoạn mã truy cập vào API nội bộ JDK từng biên dịch thành công trên phiên bản cũ có thể sẽ không còn hoạt động nữa. Lập trình viên được khuyến khích chuyển từ việc dùng các thành phần nội bộ sang các API chuẩn để cả họ và người dùng của họ có thể nâng cấp mượt mà lên các phiên bản Java tương lai. Cơ chế đóng gói chặt được điều khiển bởi tùy chọn trình khởi chạy của JDK 9 là `--illegal-access`: đến JDK 15 mặc định là `warn`, và từ JDK 16 mặc định chuyển sang `deny`. (Hiện tại) vẫn có thể dùng một tùy chọn dòng lệnh duy nhất để nới lỏng đóng gói cho toàn bộ các package, nhưng trong tương lai sẽ chỉ có thể dùng `--add-opens` để mở riêng từng package cụ thể.

## JEP 397: Sealed Classes (Lớp niêm phong, xem trước lần hai)

Sealed Classes được đề xuất xem trước bởi [JEP 360](https://openjdk.java.net/jeps/360) và tích hợp vào Java 15. Trong JDK 16, Sealed Classes được cải tiến (kiểm tra tham chiếu và quan hệ kế thừa của lớp niêm phong chặt chẽ hơn) và đề xuất xem trước lần hai thông qua [JEP 397](https://openjdk.java.net/jeps/397).

Trong bài [Tổng quan tính năng mới Java 14 & 15](./java14-15.md), tôi đã giới thiệu chi tiết về Sealed Classes nên ở đây sẽ không trình bày thêm nữa.

## Các tối ưu và cải tiến khác

- **JEP 380: Kênh Socket Unix-Domain**: Unix-domain socket vốn là tính năng phổ biến trên hầu hết các nền tảng Unix, nay cũng đã được hỗ trợ trên Windows 10 và Windows Server 2019. Tính năng này bổ sung hỗ trợ Unix-domain (`AF_UNIX`) socket cho các API socket channel và server-socket channel trong gói `java.nio.channels`, đồng thời mở rộng cơ chế inherited channel để hỗ trợ Unix-domain socket channel và server-socket channel. Unix-domain socket được dùng cho giao tiếp liên tiến trình (IPC) trên cùng một máy chủ. Chúng phần lớn tương tự TCP/IP, điểm khác biệt là socket được định địa chỉ bằng đường dẫn hệ thống tệp thay vì địa chỉ IP và số cổng. Đối với giao tiếp liên tiến trình cục bộ, Unix-domain socket an toàn hơn và hiệu quả hơn so với kết nối TCP/IP loopback.
- **JEP 389: Foreign Linker API (Ươm tạo)**: Incubator API này cung cấp khả năng truy cập mã native bằng Java thuần với kiểu tĩnh (statically typed), giúp đơn giản hóa đáng kể quá trình liên kết thư viện native vốn phức tạp và dễ xảy ra lỗi. Java 1.1 đã hỗ trợ gọi phương thức native thông qua Java Native Interface (JNI), nhưng không dễ dùng. Lập trình viên Java cần có khả năng liên kết các thư viện native cụ thể cho từng tác vụ cụ thể. API này cũng cung cấp hỗ trợ foreign function mà không cần bất kỳ mã kết nối (glue code) JNI trung gian nào.
- **JEP 357: Di chuyển từ Mercurial sang Git**: Trước đây, mã nguồn OpenJDK được quản lý bằng công cụ quản lý phiên bản Mercurial, nay đã chuyển sang Git.
- **JEP 369: Di chuyển lên GitHub**: Đồng bộ với thay đổi chuyển từ Mercurial sang Git của JEP 357, sau khi chuyển hệ thống quản lý phiên bản sang Git, cộng đồng OpenJDK đã chọn lưu trữ các kho Git trên GitHub. Tuy nhiên, chỉ các phiên bản JDK 11 trở lên mới được di chuyển.
- **JEP 386: Port sang Alpine Linux**: Alpine Linux là một bản phân phối Linux độc lập, phi thương mại và cực kỳ gọn nhẹ — một container chỉ cần chưa tới 8MB dung lượng, cài đặt tối thiểu lên đĩa chỉ tốn khoảng 130MB lưu trữ, rất đơn giản đồng thời vẫn chú trọng bảo mật. Đề xuất này port JDK sang Alpine Linux; vì Alpine Linux là bản phân phối Linux nhẹ dựa trên `musl libc`, nên các bản phân phối Linux khác trên kiến trúc x64 và AArch64 dùng `musl libc` cũng được áp dụng.
- **JEP 388: Port sang Windows/AArch64**: Trọng tâm của các JEP này không phải bản thân công việc port mà là tích hợp chúng vào kho mã nguồn chính của JDK; JEP 386 port JDK sang Alpine Linux và các bản phân phối khác dùng `musl` làm thư viện C chính trên x64, trong khi JEP 388 port JDK sang Windows AArch64 (ARM64).

## Tài liệu tham khảo

- [Java Language Changes](https://docs.oracle.com/en/java/javase/16/language/java-language-changes.html)
- [Consolidated JDK 16 Release Notes](https://www.oracle.com/java/technologies/javase/16all-relnotes.html)
- [Java 16 chính thức phát hành, phân tích từng tính năng mới](https://www.infoq.cn/article/IAkwhx7i9V7G8zLVEd4L)
- [Thực hành | Phân tích các tính năng cú pháp mới của Java 16](https://xie.infoq.cn/article/8304c894c4e38318d38ceb116) (viết rất hay)
