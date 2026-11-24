---
title: Tổng quan tính năng mới Java 18
description: Tổng quan các cập nhật và tính năng thử nghiệm của JDK 18, giúp hiểu rõ những cải tiến từ các API mới.
category: Java
tag:
  - Tính năng mới Java
head:
  - - meta
    - name: keywords
      content: Java 18,JDK18,Tính năng Preview,Cập nhật API,JEP
lang: vi
sourceRef: zh-ref/java/new-features/java18.md
---

Java 18 chính thức phát hành vào ngày 22/03/2022 và là phiên bản không hỗ trợ dài hạn (non-LTS).

JDK 18 có tổng cộng 8 tính năng mới. Bài viết này sẽ chọn lọc một số tính năng quan trọng để giới thiệu chi tiết:

- [JEP 400: UTF-8 by Default (UTF-8 làm bộ ký tự mặc định)](https://openjdk.java.net/jeps/400)
- [JEP 408: Simple Web Server (Web Server đơn giản)](https://openjdk.java.net/jeps/408)
- [JEP 413: Code Snippets in Java API Documentation (Đoạn mã trong tài liệu Java API)](https://openjdk.java.net/jeps/413)
- [JEP 416: Reimplement Core Reflection with Method Handles (Tái triển khai Core Reflection bằng Method Handles)](https://openjdk.java.net/jeps/416)
- [JEP 417: Vector API (Third Incubator) (Vector API — Incubator lần 3)](https://openjdk.java.net/jeps/417)
- [JEP 418: Internet-Address Resolution SPI (SPI phân giải địa chỉ Internet)](https://openjdk.java.net/jeps/418)
- [JEP 419: Foreign Function & Memory API (Second Incubator) (Foreign Function & Memory API — Incubator lần 2)](https://openjdk.java.net/jeps/419)

Biểu đồ dưới đây thống kê số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25:

![Số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

Đọc thêm:

- [Tài liệu OpenJDK Java 18](https://openjdk.java.net/projects/jdk/18/)
- [IntelliJ IDEA | Hỗ trợ tính năng Java 18](https://mp.weixin.qq.com/s/PocFKR9z9u7-YCZHsrA5kQ)

## JEP 400: UTF-8 by Default (UTF-8 làm bộ ký tự mặc định, Chính thức)

JDK cuối cùng đã thiết lập UTF-8 làm bộ ký tự (charset) mặc định.

Trong Java 17 và các phiên bản trước đó, bộ ký tự mặc định chỉ được xác định khi JVM chạy (runtime), phụ thuộc vào hệ điều hành, thiết lập vùng (locale) và nhiều yếu tố khác, do đó tiềm ẩn rủi ro. Ví dụ, một chương trình Java in văn bản ra console bình thường trên Mac có thể bị lỗi hiển thị ký tự (lỗi font/ký tự lạ) khi chạy trên Windows nếu bạn không tự thay đổi bộ ký tự thủ công.

## JEP 408: Simple Web Server (Web Server đơn giản, Chính thức)

Từ Java 18 trở đi, bạn có thể dùng lệnh `jwebserver` để khởi chạy một web server tĩnh đơn giản.

```bash
$ jwebserver
Binding to loopback by default. For all interfaces use "-b 0.0.0.0" or "-b ::".
Serving /cwd and subdirectories on 127.0.0.1 port 8000
URL: http://127.0.0.1:8000/
```

Server này không hỗ trợ CGI hay Servlet mà chỉ giới hạn phục vụ các tệp tĩnh (static files).

## JEP 413: Code Snippets in Java API Documentation (Đoạn mã trong tài liệu Java API, Chính thức)

Trước Java 18, nếu muốn chèn đoạn mã (code snippet) vào Javadoc, chúng ta thường sử dụng `<pre>{@code ...}</pre>`.

```java
<pre>{@code
    lines of source code
}</pre>
```

Cách viết `<pre>{@code ...}</pre>` cho ra kết quả hiển thị khá bình thường và hạn chế.

Từ Java 18 trở đi, bạn có thể sử dụng thẻ `@snippet` cho việc này:

```java
/**
 * The following code shows how to use {@code Optional.isPresent}:
 * {@snippet :
 * if (v.isPresent()) {
 *     System.out.println("v: " + v.get());
 * }
 * }
 */
```

Cách dùng `@snippet` cho kết quả hiển thị đẹp hơn và sử dụng thuận tiện hơn.

## JEP 416: Reimplement Core Reflection with Method Handles (Tái triển khai Core Reflection bằng Method Handles, Chính thức)

Java 18 cải tiến logic triển khai bên trong của `java.lang.reflect.Method` và `Constructor`, giúp hiệu năng tốt hơn và tốc độ nhanh hơn. Thay đổi này không làm thay đổi các API liên quan, nghĩa là lập trình viên không cần sửa code Reflection hiện có mà vẫn được hưởng lợi về mặt hiệu năng.

OpenJDK đã công bố kết quả benchmark hiệu năng Reflection giữa cài đặt mới và cài đặt cũ:

![Kết quả benchmark hiệu năng Reflection giữa cài đặt mới và cũ](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/JEP416Benchmark-8f2760d5.png)

## JEP 417: Vector API (Incubator lần 3)

Vector API ban đầu được đề xuất qua [JEP 338](https://openjdk.java.net/jeps/338) và tích hợp vào Java 16 dưới dạng [Incubator API](http://openjdk.java.net/jeps/11). Vòng Incubator thứ 2 được đề xuất bởi [JEP 414](https://openjdk.java.net/jeps/414) và tích hợp vào Java 17; vòng Incubator thứ 3 bởi [JEP 417](https://openjdk.java.net/jeps/417) trong Java 18; và vòng thứ 4 bởi [JEP 426](https://openjdk.java.net/jeps/426) trong Java 19.

Tính toán vector bao gồm một chuỗi các phép toán trên vector. Vector API được thiết kế để biểu diễn các phép tính vector có thể được biên dịch một cách đáng tin cậy tại runtime thành các tập lệnh vector tối ưu trên kiến trúc CPU được hỗ trợ, qua đó đạt hiệu năng vượt trội so với phép tính vô hướng (scalar) tương đương.

Mục tiêu của Vector API là cung cấp cho người dùng cách thức ngắn gọn, dễ dùng và độc lập nền tảng để biểu diễn đa dạng các phép tính vector.

Dưới đây là phép tính vô hướng (scalar) đơn giản trên các phần tử mảng:

```java
void scalarComputation(float[] a, float[] b, float[] c) {
   for (int i = 0; i < a.length; i++) {
        c[i] = (a[i] * a[i] + b[i] * b[i]) * -1.0f;
   }
}
```

Và đây là phép tính vector tương đương sử dụng Vector API:

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

Trong JDK 18, hiệu năng của Vector API tiếp tục được tối ưu hóa thêm.

## JEP 418: Internet-Address Resolution SPI (SPI phân giải địa chỉ Internet, Chính thức)

Java 18 định nghĩa một SPI (Service Provider Interface) hoàn toàn mới cho việc phân giải tên miền và địa chỉ mạng, giúp `java.net.InetAddress` có thể sử dụng các bộ phân giải (resolver) của bên thứ ba ngoài cơ chế mặc định của nền tảng.

## JEP 419: Foreign Function & Memory API (Incubator lần 2)

Thông qua API này, chương trình Java có thể tương tác trực tiếp với mã và dữ liệu nằm ngoài Java runtime. Bằng cách gọi các hàm bên ngoài (foreign functions — mã nằm ngoài JVM) một cách hiệu quả và truy cập an toàn vào bộ nhớ bên ngoài (foreign memory — bộ nhớ không do JVM quản lý), API này cho phép chương trình Java gọi các thư viện native và xử lý dữ liệu native mà không nguy hiểm hay dễ lỗi như JNI.

Foreign Function & Memory API được thử nghiệm (Incubator) lần đầu tiên trong Java 17 qua [JEP 412](https://openjdk.java.net/jeps/412). Vòng Incubator lần 2 do [JEP 419](https://openjdk.org/jeps/419) đề xuất và tích hợp vào Java 18, còn bản Preview đầu tiên do [JEP 424](https://openjdk.org/jeps/424) đề xuất và tích hợp vào Java 19.

Mình đã giới thiệu chi tiết về Foreign Function & Memory API trong bài [Tổng quan tính năng mới Java 19](./java19.md), nên sẽ không lặp lại thêm ở đây.
