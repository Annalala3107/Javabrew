---
title: Tổng quan các tính năng mới của Java 25
description: Tổng quan các tính năng mới trọng tâm và những thay đổi bản xem trước của JDK 25, tập trung vào lập trình đồng thời, GC và các cải tiến ngôn ngữ/nền tảng.
category: Java
tag:
  - Tính năng mới của Java
lang: vi
sourceRef: zh-ref/java/new-features/java25.md
head:
  - - meta
    - name: keywords
      content: Java 25,JDK25,LTS,Scoped Values,Compact Object Headers,Generational Shenandoah,Nhập module,Structured Concurrency
---

JDK 25 được phát hành vào ngày 16 tháng 9 năm 2025; đây là một phiên bản vô cùng quan trọng, mang tính cột mốc.

JDK 25 được Oracle và hầu hết các nhà phát hành JDK xếp vào nhóm LTS (Long-Term Support — phiên bản hỗ trợ dài hạn). Các phiên bản LTS hiện tại của Oracle bao gồm JDK 8, JDK 11, JDK 17, JDK 21 và JDK 25.

JDK 25 có tổng cộng 18 tính năng mới; bài viết này sẽ chọn lọc một số tính năng mới tương đối quan trọng để giới thiệu chi tiết:

- [JEP 506: Scoped Values (Giá trị theo phạm vi)](https://openjdk.org/jeps/506)
- [JEP 512: Compact Source Files and Instance Main Methods (Tệp mã nguồn gọn nhẹ và phương thức main thể hiện)](https://openjdk.org/jeps/512)
- [JEP 519: Compact Object Headers (Object Header gọn nhẹ)](https://openjdk.org/jeps/519)
- [JEP 521: Generational Shenandoah (Shenandoah GC phân thế hệ)](https://openjdk.org/jeps/521)
- [JEP 507: Primitive Types in Patterns, instanceof, and switch (Khớp mẫu hỗ trợ kiểu nguyên thủy, Bản xem trước lần 3)](https://openjdk.org/jeps/507)
- [JEP 505: Structured Concurrency (Bản xem trước lần 5)](https://openjdk.org/jeps/505)
- [JEP 511: Module Import Declarations (Khai báo nhập module)](https://openjdk.org/jeps/511)
- [JEP 513: Flexible Constructor Bodies (Thân hàm khởi tạo linh hoạt)](https://openjdk.org/jeps/513)
- [JEP 508: Vector API (Thử nghiệm lần 10)](https://openjdk.org/jeps/508)

Biểu đồ dưới đây thống kê số lượng tính năng mới và thời gian phát hành của từng bản cập nhật từ JDK 8 đến JDK 25:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JDK 25

### JEP 506: Scoped Values

Scoped Values (giá trị theo phạm vi) cho phép chia sẻ dữ liệu bất biến bên trong một Thread và giữa các Thread với nhau, ưu việt hơn biến cục bộ theo luồng `ThreadLocal`, đặc biệt là khi sử dụng số lượng lớn Virtual Thread.

```java
final static ScopedValue<...> V = ScopedValue.newInstance();

// Trong một phương thức nào đó
ScopedValue.where(V, <value>)
           .run(() -> { ... V.get() ... call methods ... });

// Trong một phương thức được gọi trực tiếp hoặc gián tiếp từ biểu thức lambda
... V.get() ...
```

Scoped Values cung cấp cơ chế truyền dữ liệu bất biến một chiều từ bên gọi (caller) sang bên được gọi (callee). Các Thread con được tạo thông qua Structured Concurrency có thể kế thừa các gắn kết (binding) từ Thread cha mà không cần sao chép binding, từ đó giảm thiểu chi phí thời gian và không gian bộ nhớ khi một lượng lớn Thread dùng chung ngữ cảnh.

### JEP 512: Tệp mã nguồn gọn nhẹ và phương thức main thể hiện

Tính năng này được xem trước lần đầu qua [JEP 445](https://openjdk.org/jeps/445 "JEP 445") (JDK 21), sau đó được cải tiến và hoàn thiện qua JDK 22, JDK 23 và JDK 24, và cuối cùng chính thức hoàn thiện trong JDK 25.

Cải tiến này đơn giản hóa đáng kể các bước viết chương trình Java đơn giản, cho phép viết lớp và phương thức `main` trong cùng một tệp mà không cần lớp `public class` cấp cao nhất, đồng thời cho phép phương thức `main` là một phương thức thể hiện (instance method) không phải `static`.

```java
class HelloWorld {
    void main() {
        System.out.println("Hello, World!");
    }
}
```

Đơn giản hóa hơn nữa:

```java
void main() {
    System.out.println("Hello, World!");
}
```

Đây là một bước tiến lớn nhằm hạ thấp rào cản học Java và nâng cao hiệu suất khi viết các chương trình nhỏ cũng như script. Người mới học không còn phải hiểu khai báo dài dòng và phức tạp `public static void main(String[] args)` nữa. Đối với việc dựng nguyên mẫu nhanh và viết script, điều này cũng giúp Java trở thành một lựa chọn hấp dẫn hơn.

### JEP 519: Object Header gọn nhẹ (Compact Object Headers)

Tính năng này được giới thiệu dưới dạng tính năng thử nghiệm trong [JEP 450](https://openjdk.org/jeps/450 "JEP 450") (JDK 24) và chính thức chuyển thành tính năng sản phẩm trong JDK 25.

Thông qua việc tối ưu cấu trúc bên trong của Object Header, trên máy ảo HotSpot kiến trúc 64-bit, kích thước Object Header được thu gọn từ 96–128 bit (12–16 byte) ban đầu xuống còn 64 bit (8 byte), từ đó giảm mức chiếm dụng bộ nhớ Heap, tăng mật độ triển khai và cải thiện tính cục bộ dữ liệu (data locality).

Compact Object Headers không trở thành bố cục Object Header mặc định của JVM mà cần được bật thông qua cấu hình tường minh:

- Trên JDK 24 cần bật bằng tổ hợp tham số dòng lệnh:
  `$ java -XX:+UnlockExperimentalVMOptions -XX:+UseCompactObjectHeaders ...`;
- Từ JDK 25 trở đi chỉ cần `-XX:+UseCompactObjectHeaders` là có thể bật.

### JEP 521: Shenandoah GC phân thế hệ (Generational Shenandoah)

Shenandoah GC được giới thiệu dưới dạng tính năng thử nghiệm trong JDK 12 và trở thành tính năng sản phẩm chính thức trong JDK 15. Mặc định nó được tắt và có thể bật qua `-XX:+UseShenandoahGC`.

Shenandoah là bộ thu gom rác độ trễ thấp (low-pause) do Red Hat chủ trì phát triển, với mục tiêu giữ thời gian tạm dừng (pause time) ngắn và tương đối độc lập với kích thước Heap ngay cả khi Heap lớn.

Shenandoah truyền thống thực hiện đánh dấu và nén đồng thời (concurrent marking and compaction) trên toàn bộ Heap; tuy thời gian tạm dừng cực ngắn nhưng khi xử lý các đối tượng ở thế hệ trẻ (Young Generation), hiệu quả không bằng GC phân thế hệ. Khi bổ sung cơ chế phân thế hệ, Shenandoah có thể thu gom thường xuyên và hiệu quả hơn số lượng lớn các đối tượng "sinh sớm chết yểu" trong thế hệ trẻ, giúp đạt được thông lượng (throughput) cao hơn và tiêu tốn CPU thấp hơn trong khi vẫn giữ thời gian tạm dừng cực thấp.

Shenandoah GC cần được bật qua dòng lệnh:

- Trên JDK 24 cần bật bằng tổ hợp tham số dòng lệnh: `-XX:+UseShenandoahGC -XX:+UnlockExperimentalVMOptions -XX:ShenandoahGCMode=generational`
- Từ JDK 25 trở đi chỉ cần `-XX:+UseShenandoahGC -XX:ShenandoahGCMode=generational` là có thể bật.

### JEP 507: Khớp mẫu hỗ trợ kiểu nguyên thủy (Bản xem trước lần 3)

Tính năng này được xem trước lần đầu qua [JEP 455](https://openjdk.org/jeps/455 "JEP 455") (JDK 23).

Pattern Matching có thể xử lý tất cả các kiểu dữ liệu nguyên thủy (`int`, `double`, `boolean`, v.v.) trong câu lệnh `switch` và `instanceof`:

```java
static void test(Object obj) {
    if (obj instanceof int i) {
        System.out.println("Đây là kiểu int: " + i);
    }
}
```

Nhờ vậy, ta có thể thực hiện khớp kiểu và ép kiểu cho các kiểu nguyên thủy một cách an toàn và gọn gàng giống như đối với kiểu đối tượng, tiếp tục loại bỏ mã khuôn mẫu (boilerplate code) trong Java.

### JEP 505: Structured Concurrency (Bản xem trước lần 5)

JDK 19 đã giới thiệu Structured Concurrency dưới dạng API thử nghiệm (incubator). Trong JDK 25, API này đang ở giai đoạn xem trước lần thứ năm, với mục đích đơn giản hóa lập trình đa luồng chứ không nhằm thay thế `java.util.concurrent`.

Structured Concurrency coi nhiều tác vụ chạy trên các Thread khác nhau như một đơn vị công việc duy nhất, qua đó đơn giản hóa xử lý lỗi, nâng cao độ tin cậy và tăng cường khả năng quan sát (observability). Nói cách khác, Structured Concurrency giữ lại tính dễ đọc, dễ bảo trì và dễ quan sát như mã nguồn đơn luồng.

API cơ bản của Structured Concurrency là `StructuredTaskScope`, hỗ trợ chia tách một tác vụ thành nhiều tác vụ con đồng thời chạy trên các Thread riêng của chúng, và các tác vụ con phải hoàn thành trước khi tác vụ chính tiếp tục.

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

### JEP 511: Khai báo nhập module (Module Import Declarations)

Tính năng này được xem trước lần đầu qua [JEP 476](https://openjdk.org/jeps/476 "JEP 476") (JDK 23), sau đó được hoàn thiện thêm trong [JEP 494](https://openjdk.org/jeps/494 "JEP 494") (JDK 24) và chính thức hoàn thiện trong JDK 25.

Khai báo nhập module cho phép nhập gọn toàn bộ các gói (package) được export của một module ngay trong mã Java mà không cần khai báo `import` từng gói riêng lẻ. Tính năng này đơn giản hóa việc tái sử dụng các thư viện theo module, đặc biệt khi dùng nhiều module cùng lúc, tránh phải viết hàng loạt câu lệnh `import` gói, giúp lập trình viên truy cập thuận tiện hơn vào thư viện bên thứ ba và các lớp cơ bản của Java.

Tính năng này đặc biệt hữu ích cho người mới bắt đầu và giai đoạn dựng nguyên mẫu (prototyping), vì nó không yêu cầu lập trình viên phải module hóa mã nguồn của chính mình, đồng thời vẫn duy trì khả năng tương thích với cách `import` truyền thống, giúp nâng cao hiệu suất phát triển và tính dễ đọc của mã nguồn.

```java
// Nhập toàn bộ module java.base, lập trình viên có thể truy cập trực tiếp các lớp như List, Map, Stream mà không cần import thủ công từng gói liên quan
import module java.base;

public class Example {
    public static void main(String[] args) {
        String[] fruits = { "apple", "berry", "citrus" };
        Map<String, String> fruitMap = Stream.of(fruits)
            .collect(Collectors.toMap(
                s -> s.toUpperCase().substring(0, 1),
                Function.identity()));

        System.out.println(fruitMap);
    }
}
```

### JEP 513: Thân hàm khởi tạo linh hoạt (Flexible Constructor Bodies)

Tính năng này được xem trước lần đầu qua [JEP 447](https://openjdk.org/jeps/447 "JEP 447") (JDK 22), trải qua các lần xem trước tại [JEP 482 ](https://openjdk.org/jeps/482 "JEP 482 ") (JDK 23) và [JEP 492](https://openjdk.org/jeps/492 "JEP 492") (JDK 24), và chính thức hoàn thiện trong JDK 25.

Trước đây, Java yêu cầu lời gọi `super(...)` hoặc `this(...)` trong constructor phải xuất hiện dưới dạng câu lệnh đầu tiên. Điều này khiến chúng ta không thể khởi tạo trực tiếp các trường trong constructor của lớp con trước khi gọi constructor của lớp cha.

Thân hàm khởi tạo linh hoạt (Flexible Constructor Bodies) giải quyết vấn đề này bằng cách cho phép viết các câu lệnh bên trong thân constructor trước khi gọi `super(..)` hoặc `this(..)`. Các câu lệnh này có thể khởi tạo trường nhưng không được tham chiếu tới thực thể đang được khởi tạo. Cách làm này ngăn tình trạng trường của lớp con chưa được khởi tạo đúng cách khi constructor của lớp cha gọi tới phương thức của lớp con, nâng cao độ tin cậy khi khởi tạo lớp.

Tính năng này giải quyết hạn chế cú pháp trước đây của Java đối với cách tổ chức mã trong constructor, giúp lập trình viên thể hiện hành vi constructor một cách tự do và tự nhiên hơn — ví dụ thực hiện kiểm tra tham số, chuẩn bị và chia sẻ dữ liệu trực tiếp ngay trong constructor mà không cần phụ thuộc vào phương thức bổ trợ hay constructor phụ, từ đó cải thiện tính dễ đọc và khả năng bảo trì mã nguồn.

```java
class Person {
    private final String name;
    private int age;

    public Person(String name, int age) {
        if (age < 0) {
            throw new IllegalArgumentException("Age cannot be negative.");
        }
        this.name = name; // Khởi tạo trường trước khi gọi constructor lớp cha
        this.age = age;
        // ... các đoạn mã khởi tạo khác
    }
}

class Employee extends Person {
    private final int employeeId;

    public Employee(String name, int age, int employeeId) {
        this.employeeId = employeeId; // Khởi tạo trường trước khi gọi constructor lớp cha
        super(name, age); // Gọi constructor lớp cha
        // ... các đoạn mã khởi tạo khác
    }
}
```

### JEP 508: Vector API (Thử nghiệm lần 10)

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

Mặc dù vẫn đang ở giai đoạn thử nghiệm (incubator), lần lặp thứ 10 đã đủ để chứng minh tầm quan trọng của nó. Nó giúp Java trong các lĩnh vực nhạy cảm về hiệu năng như tính toán khoa học, học máy (machine learning) và xử lý dữ liệu lớn có thể viết được mã nguồn đạt hiệu năng tiệm cận hoặc thậm chí sánh ngang với các ngôn ngữ native như C++. Đây là chìa khóa giúp Java duy trì sức cạnh tranh trong lĩnh vực tính toán hiệu năng cao.
