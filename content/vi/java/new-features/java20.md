---
title: Tổng quan tính năng mới Java 20
description: Tổng kết các thay đổi về ngôn ngữ và lập trình đồng thời trong JDK 20, tiếp nối các cải tiến về Virtual Thread và Pattern Matching.
category: Java
tag:
  - Tính năng mới Java
head:
  - - meta
    - name: keywords
      content: Java 20,JDK20,Record Patterns Preview,Cải tiến Virtual Thread,Cải tiến ngôn ngữ,JEP
lang: vi
sourceRef: zh-ref/java/new-features/java20.md
---

JDK 20 được phát hành vào ngày 21/03/2023 và là phiên bản không hỗ trợ dài hạn (non-LTS).

Phiên bản kế tiếp của nó là bản LTS JDK 21 phát hành vào tháng 9/2023.

JDK 20 có tổng cộng 7 tính năng mới. Bài viết này sẽ chọn lọc những tính năng quan trọng hơn để giới thiệu chi tiết:

- [JEP 429: Scoped Values (Giá trị theo phạm vi)](https://openjdk.org/jeps/429) (Incubator lần 1)
- [JEP 432: Record Patterns (Mẫu bản ghi)](https://openjdk.org/jeps/432) (Preview lần 2)
- [JEP 433: Pattern Matching for switch (Pattern Matching cho switch)](https://openjdk.org/jeps/433) (Preview lần 4)
- [JEP 434: Foreign Function & Memory API](https://openjdk.org/jeps/434) (Preview lần 2)
- [JEP 436: Virtual Threads (Luồng ảo)](https://openjdk.org/jeps/436) (Preview lần 2)
- [JEP 437: Structured Concurrency (Đồng thời có cấu trúc)](https://openjdk.org/jeps/437) (Incubator lần 2)
- [JEP 438: Vector API](https://openjdk.org/jeps/438) (Incubator lần 5)

Biểu đồ dưới đây thống kê số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25:

![Số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 25](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 429: Scoped Values (Incubator lần 1)

Scoped Values (giá trị theo phạm vi) cho phép chia sẻ dữ liệu bất biến (immutable) trong nội bộ một luồng và giữa các luồng với nhau, vượt trội hơn biến cục bộ theo luồng (`ThreadLocal`), đặc biệt khi sử dụng số lượng lớn Virtual Thread.

```java
final static ScopedValue<...> V = ScopedValue.newInstance();

// In some method
ScopedValue.where(V, <value>)
           .run(() -> { ... V.get() ... call methods ... });

// In a method called directly or indirectly from the lambda expression
... V.get() ...
```

Scoped Values cho phép chia sẻ dữ liệu an toàn và hiệu quả giữa các thành phần trong một chương trình lớn mà không cần phải truyền qua tham số phương thức.

Để tìm hiểu chi tiết về Scoped Values, bạn nên đọc bài viết [Scoped Values FAQ](https://www.happycoders.eu/java/scoped-values/).

## JEP 432: Record Patterns (Preview lần 2)

Record Patterns (mẫu bản ghi) cho phép phân giải cấu trúc (deconstruct) giá trị của `record`, tức là trích xuất dữ liệu từ một `record` class một cách thuận tiện hơn. Hơn nữa, có thể lồng ghép Record Patterns và Type Patterns với nhau để tạo thành cách điều hướng và xử lý dữ liệu mạnh mẽ, mang tính khai báo (declarative) và có thể kết hợp (composable).

Record Patterns không thể dùng độc lập mà phải đi cùng với Pattern Matching của `instanceof` hoặc `switch`.

Hãy bắt đầu bằng một ví dụ đơn giản với `instanceof`.

Định nghĩa một `record` class đơn giản:

```java
record Shape(String type, long unit){}
```

Khi chưa có Record Patterns:

```java
Shape circle = new Shape("Circle", 10);
if (circle instanceof Shape shape) {

  System.out.println("Area of " + shape.type() + " is : " + Math.PI * Math.pow(shape.unit(), 2));
}
```

Khi đã có Record Patterns:

```java
Shape circle = new Shape("Circle", 10);
if (circle instanceof Shape(String type, long unit)) {
  System.out.println("Area of " + type + " is : " + Math.PI * Math.pow(unit, 2));
}
```

Tiếp theo hãy xem cách kết hợp Record Patterns với `switch`.

Định nghĩa một số kiểu dữ liệu:

```java
interface Shape {}
record Circle(double radius) implements Shape { }
record Square(double side) implements Shape { }
record Rectangle(double length, double width) implements Shape { }
```

Khi chưa có Record Patterns:

```java
Shape shape = new Circle(10);
switch (shape) {
    case Circle c:
        System.out.println("The shape is Circle with area: " + Math.PI * c.radius() * c.radius());
        break;

    case Square s:
        System.out.println("The shape is Square with area: " + s.side() * s.side());
        break;

    case Rectangle r:
        System.out.println("The shape is Rectangle with area: " + r.length() * r.width());
        break;

    default:
        System.out.println("Unknown Shape");
        break;
}
```

Khi đã có Record Patterns:

```java
Shape shape = new Circle(10);
switch(shape) {

  case Circle(double radius):
    System.out.println("The shape is Circle with area: " + Math.PI * radius * radius);
    break;

  case Square(double side):
    System.out.println("The shape is Square with area: " + side * side);
    break;

  case Rectangle(double length, double width):
    System.out.println("The shape is Rectangle with area: " + length * width);
    break;

  default:
    System.out.println("Unknown Shape");
    break;
}
```

Record Patterns giúp tránh các phép ép kiểu không cần thiết, làm cho code ngắn gọn và dễ đọc hơn. Bản thân Record Patterns không loại bỏ hoàn toàn mọi rủi ro `null` hoặc `NullPointerException`: giá trị `null` sẽ không khớp với Record Pattern, và tham chiếu các thành phần (component) của `record` vẫn có thể là `null`.

Record Patterns được đưa vào Preview lần 1 trong Java 19 qua [JEP 405](https://openjdk.org/jeps/405). Trong JDK 20 là bản Preview lần 2 qua [JEP 432](https://openjdk.org/jeps/432). Các cải tiến trong lần này bao gồm:

- Hỗ trợ suy luận tham số kiểu (type argument inference) cho generic record patterns
- Hỗ trợ Record Pattern xuất hiện trong phần header của vòng lặp `for` cải tiến (enhanced `for` statement)
- Loại bỏ hỗ trợ named record patterns (Record Pattern có đặt tên)

**Lưu ý**: Đừng nhầm lẫn Record Patterns với `record` class được chính thức giới thiệu từ [JDK 16](./java16.md).

## JEP 433: Pattern Matching for switch (Preview lần 4)

Giống như `instanceof`, câu lệnh `switch` cũng được bổ sung tính năng tự động khớp kiểu và chuyển đổi kiểu.

Ví dụ với `instanceof`:

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

Ví dụ với `switch`:

```java
// Old code
static String formatter(Object o) {
    String formatted = "unknown";
    if (o instanceof Integer i) {
        formatted = String.format("int %d", i);
    } else if (o instanceof Long l) {
        formatted = String.format("long %d", l);
    } else if (o instanceof Double d) {
        formatted = String.format("double %f", d);
    } else if (o instanceof String s) {
        formatted = String.format("String %s", s);
    }
    return formatted;
}

// New code
static String formatterPatternSwitch(Object o) {
    return switch (o) {
        case Integer i -> String.format("int %d", i);
        case Long l    -> String.format("long %d", l);
        case Double d  -> String.format("double %f", d);
        case String s  -> String.format("String %s", s);
        default        -> o.toString();
    };
}
```

Pattern Matching cho `switch` đã trải qua các bản Preview ở Java 17, Java 18 và Java 19; Java 20 là bản Preview lần thứ 4. Mỗi bản Preview đều có một vài tinh chỉnh nhỏ nên mình không đi sâu thêm ở đây.

## JEP 434: Foreign Function & Memory API (Preview lần 2)

Thông qua API này, chương trình Java có thể tương tác với mã và dữ liệu nằm ngoài Java runtime. Bằng cách gọi các hàm bên ngoài (foreign functions — mã nằm ngoài JVM) một cách hiệu quả và truy cập an toàn vào bộ nhớ bên ngoài (foreign memory — bộ nhớ không do JVM quản lý), API này cho phép chương trình Java gọi các thư viện native và xử lý dữ liệu native mà không nguy hiểm hay dễ lỗi như JNI.

Foreign Function & Memory API trải qua vòng Incubator lần 1 trong Java 17 qua [JEP 412](https://openjdk.java.net/jeps/412), vòng Incubator lần 2 trong Java 18 qua [JEP 419](https://openjdk.org/jeps/419) và bản Preview lần 1 trong Java 19 qua [JEP 424](https://openjdk.org/jeps/424).

Trong JDK 20 là bản Preview lần 2 qua [JEP 434](https://openjdk.org/jeps/434), các cải tiến lần này bao gồm:

- Hợp nhất hai khái niệm trừu tượng `MemorySegment` và `MemoryAddress`
- Nâng cấp cấu trúc phân cấp của `MemoryLayout`
- Tách `MemorySession` thành `Arena` và `SegmentScope` để hỗ trợ chia sẻ segment qua các ranh giới quản lý vòng đời (maintenance boundaries).

Mình đã giới thiệu chi tiết về Foreign Function & Memory API trong bài [Tổng quan tính năng mới Java 19](./java19.md), nên sẽ không lặp lại thêm ở đây.

## JEP 436: Virtual Threads (Preview lần 2)

Virtual Thread (luồng ảo) là thread hạng nhẹ do JDK chứ không phải hệ điều hành (OS) hiện thực và lập lịch. Nhiều Virtual Thread dùng chung một thread của hệ điều hành, nhờ đó số lượng Virtual Thread có thể lớn hơn rất nhiều so với số lượng thread của hệ điều hành.

Trước khi có Virtual Thread, gói `java.lang.Thread` đã hỗ trợ cái gọi là Platform Thread (luồng nền tảng) — chính là loại thread mà chúng ta vẫn luôn sử dụng trước đây. Bộ lập lịch (scheduler) của JVM quản lý Virtual Thread thông qua Platform Thread (carrier thread — luồng mang); một Platform Thread có thể thực thi các Virtual Thread khác nhau tại các thời điểm khác nhau (nhiều Virtual Thread được gắn lên một Platform Thread). Khi một Virtual Thread bị chặn (blocked) hoặc chờ (waiting), Platform Thread có thể chuyển sang thực thi một Virtual Thread khác.

Sơ đồ mối quan hệ giữa Virtual Thread, Platform Thread và Kernel Thread của hệ điều hành được minh họa như sau (nguồn ảnh: [How to Use Java 19 Virtual Threads](https://medium.com/javarevisited/how-to-use-java-19-virtual-threads-c16a32bad5f7)):

![Mối quan hệ giữa Virtual Thread, Platform Thread và Kernel Thread](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/virtual-threads-platform-threads-kernel-threads--57103066.png)

Nói thêm một chút về ánh xạ giữa Platform Thread và Kernel Thread của hệ điều hành: trên các hệ điều hành phổ biến như Windows và Linux, thread trong Java sử dụng mô hình luồng 1-1, tức là một Platform Thread tương ứng với một Kernel Thread của hệ điều hành. Hệ điều hành Solaris là một trường hợp ngoại lệ, HotSpot VM trên Solaris hỗ trợ cả mô hình nhiều-nhiều (M:N) và 1-1. Chi tiết bạn có thể tham khảo câu trả lời của RednaxelaFX: [Mô hình luồng trong JVM có phải là cấp người dùng (user-level) không?](https://www.zhihu.com/question/23096638/answer/29617153).

So với Platform Thread, Virtual Thread rất rẻ và nhẹ, dùng xong có thể hủy ngay nên không cần tái sử dụng hay đưa vào pool (pooling); mỗi tác vụ có thể có một Virtual Thread riêng biệt để chạy. Việc tạm dừng và khôi phục Virtual Thread thường không cần tạo mới hay chuyển đổi thread hệ điều hành cho từng tác vụ, từ đó giảm chi phí tài nguyên thread và lập lịch do số lượng lớn tác vụ blocking gây ra.

Các luồng hạng nhẹ tương tự đã được chứng minh là cực kỳ hữu ích trong các ngôn ngữ lập trình đa luồng khác, chẳng hạn như Goroutine trong Go hay process trong Erlang.

Trên Zhihu có một cuộc thảo luận về Virtual Thread trong Java 19, nếu quan tâm bạn có thể xem tại: <https://www.zhihu.com/question/536743167>.

Để tìm hiểu phân tích chi tiết và nguyên lý của Virtual Thread trong Java, bạn có thể tham khảo các bài viết dưới đây:

- [Nhập môn tinh gọn về Virtual Thread](https://javaguide.cn/java/concurrent/virtual-thread.html)
- [Java 19 chính thức GA! Xem Virtual Thread cải thiện vượt bậc thông lượng hệ thống như thế nào](https://mp.weixin.qq.com/s/yyApBXxpXxVwttr01Hld6Q)
- [Virtual Thread - Khám phá mã nguồn VirtualThread](https://www.cnblogs.com/throwable/p/16758997.html)

Virtual Thread đã được đưa vào Preview lần 1 trong Java 19 qua [JEP 425](https://openjdk.org/jeps/425). Trong JDK 20 là bản Preview lần 2 với một số thay đổi nhỏ nên mình không liệt kê chi tiết tại đây.

Cuối cùng, hãy xem 4 cách tạo Virtual Thread:

```java
// 1. Tạo thông qua Thread.ofVirtual()
Runnable fn = () -> {
  // your code here
};

Thread thread = Thread.ofVirtual()
                      .start(fn);

// 2. Tạo thông qua Thread.startVirtualThread()
Thread thread = Thread.startVirtualThread(() -> {
  // your code here
});

// 3. Tạo thông qua Executors.newVirtualThreadPerTaskExecutor()
var executorService = Executors.newVirtualThreadPerTaskExecutor();

executorService.submit(() -> {
  // your code here
});

class CustomThread implements Runnable {
  @Override
  public void run() {
    System.out.println("CustomThread run");
  }
}

// 4. Tạo thông qua ThreadFactory
CustomThread customThread = new CustomThread();
// Lấy ThreadFactory
ThreadFactory factory = Thread.ofVirtual().factory();
// Tạo Virtual Thread
Thread thread = factory.newThread(customThread);
// Khởi chạy thread
thread.start();
```

Qua 4 cách tạo Virtual Thread liệt kê ở trên, có thể thấy đội ngũ phát triển Java đã cố gắng tối đa việc tái sử dụng lớp `Thread` sẵn có nhằm giảm rào cản tiếp cận và giúp việc chuyển đổi sang Virtual Thread diễn ra mượt mà.

## JEP 437: Structured Concurrency (Incubator lần 2)

Java 19 đã giới thiệu Structured Concurrency (đồng thời có cấu trúc), một phương pháp lập trình đa luồng nhằm đơn giản hóa việc viết code đa luồng thông qua Structured Concurrency API chứ không nhằm thay thế `java.util.concurrent`; hiện tại tính năng này đang ở giai đoạn Incubator.

Structured Concurrency xem nhiều tác vụ chạy trên các thread khác nhau như một đơn vị công việc duy nhất (single unit of work), từ đó đơn giản hóa việc xử lý lỗi, nâng cao độ tin cậy và tăng khả năng quan sát (observability). Nói cách khác, Structured Concurrency giữ lại được tính dễ đọc, dễ bảo trì và dễ quan sát của mã đơn luồng.

API cơ bản của Structured Concurrency là [`StructuredTaskScope`](https://download.java.net/java/early_access/loom/docs/api/jdk.incubator.concurrent/jdk/incubator/concurrent/StructuredTaskScope.html). `StructuredTaskScope` hỗ trợ tách một tác vụ thành nhiều tác vụ con chạy đồng thời trên các thread riêng của chúng, và các tác vụ con phải hoàn thành trước khi tác vụ chính tiếp tục.

Cách sử dụng cơ bản của `StructuredTaskScope` như sau:

```java
    try (var scope = new StructuredTaskScope<Object>()) {
        // Dùng phương thức fork để tạo luồng thực thi các tác vụ con
        Future<Integer> future1 = scope.fork(task1);
        Future<String> future2 = scope.fork(task2);
        // Chờ các luồng hoàn thành
        scope.join();
        // Việc xử lý kết quả có thể bao gồm xử lý hoặc ném lại ngoại lệ
        ... process results/exceptions ...
    } // close
```

Structured Concurrency kết hợp rất ăn ý với Virtual Thread — các thread hạng nhẹ do JDK triển khai. Nhiều Virtual Thread dùng chung một thread hệ điều hành, cho phép chạy số lượng rất lớn Virtual Thread cùng lúc.

Thay đổi duy nhất đối với Structured Concurrency trong JDK 20 là cập nhật `StructuredTaskScope` để hỗ trợ các thread được tạo trong phạm vi tác vụ kế thừa các `ScopedValue`. Điều này giúp đơn giản hóa việc chia sẻ dữ liệu bất biến xuyên suốt các thread; xem chi tiết tại [JEP 429](https://openjdk.org/jeps/429).

## JEP 438: Vector API (Incubator lần 5)

Tính toán vector bao gồm một chuỗi các phép toán trên vector. Vector API được thiết kế để biểu diễn các phép tính vector có thể được biên dịch một cách đáng tin cậy tại runtime thành các tập lệnh vector tối ưu trên kiến trúc CPU được hỗ trợ, qua đó đạt hiệu năng vượt trội so với phép tính vô hướng (scalar) tương đương.

Mục tiêu của Vector API là cung cấp cho người dùng cách thức ngắn gọn, dễ dùng và độc lập nền tảng để biểu diễn đa dạng các phép tính vector.

Vector API ban đầu được đề xuất qua [JEP 338](https://openjdk.java.net/jeps/338) và tích hợp vào Java 16 dưới dạng [Incubator API](http://openjdk.java.net/jeps/11). Vòng Incubator thứ 2 được đề xuất bởi [JEP 414](https://openjdk.java.net/jeps/414) và tích hợp vào Java 17; vòng Incubator thứ 3 bởi [JEP 417](https://openjdk.java.net/jeps/417) trong Java 18; và vòng thứ 4 bởi [JEP 426](https://openjdk.java.net/jeps/426) trong Java 19.

Lần Incubator thứ 5 trong Java 20 về cơ bản không làm thay đổi Vector API, chỉ thực hiện một số bản sửa lỗi và cải thiện hiệu năng; xem chi tiết tại [JEP 438](https://openjdk.org/jeps/438).
