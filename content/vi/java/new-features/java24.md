---
title: Tổng quan các tính năng mới của Java 24
description: Tổng hợp các tính năng mới và thay đổi của JDK 24, giúp thuận tiện theo dõi quá trình phát triển của Java.
category: Java
tag:
  - Tính năng mới của Java
lang: vi
sourceRef: zh-ref/java/new-features/java24.md
head:
  - - meta
    - name: keywords
      content: Java 24,JDK24,Cập nhật JEP,Tính năng ngôn ngữ,Cải tiến GC,Nâng cấp nền tảng
---

JDK 24 được phát hành vào tháng 3 năm 2025; đây là một phiên bản không phải LTS (không phải bản hỗ trợ dài hạn). Phiên bản kế tiếp của nó là bản LTS **JDK 25** phát hành vào tháng 9 năm 2025.

JDK 24 có tổng cộng 24 tính năng mới; bài viết này sẽ chọn lọc một số tính năng mới tương đối quan trọng để giới thiệu chi tiết:

- [JEP 478: Key Derivation Function API (API Hàm dẫn xuất khóa, Bản xem trước)](https://openjdk.org/jeps/478)
- [JEP 483: Early Class-File Loading & Linking (Tải và liên kết tệp class sớm)](https://openjdk.org/jeps/483)
- [JEP 484: Class File API](https://openjdk.org/jeps/484)
- [JEP 485: Stream Gatherers](https://openjdk.org/jeps/485)
- [JEP 486: Disable the Security Manager (Vô hiệu hóa vĩnh viễn Security Manager)](https://openjdk.org/jeps/486)
- [JEP 487: Scoped Values (Bản xem trước lần 4)](https://openjdk.org/jeps/487)
- [JEP 495: Simplified Source Files and Instance Main Methods (Đơn giản hóa tệp mã nguồn và phương thức main thể hiện, Bản xem trước lần 4)](https://openjdk.org/jeps/495)
- [JEP 497: Quantum-Resistant Digital Signature Algorithm (ML-DSA) (Thuật toán chữ ký số kháng lượng tử)](https://openjdk.org/jeps/497)
- [JEP 499: Structured Concurrency (Bản xem trước lần 4)](https://openjdk.org/jeps/499)

Biểu đồ dưới đây thống kê số lượng tính năng mới và thời gian phát hành của từng bản cập nhật từ JDK 8 đến JDK 25:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 478: Key Derivation Function API (API Hàm dẫn xuất khóa, Bản xem trước)

Key Derivation Function API (API Hàm dẫn xuất khóa) cung cấp một bộ giao diện chuẩn để dẫn xuất thêm các khóa bổ sung từ khóa ban đầu và các dữ liệu khác. Nó có thể tạo nhiều khóa khác nhau cho các mục đích mã hóa khác nhau (như mã hóa, xác thực, v.v.), tránh việc tái sử dụng trực tiếp cùng một khóa. API này đang ở giai đoạn xem trước trong JDK 24.

Thông qua API này, lập trình viên có thể sử dụng các thuật toán dẫn xuất khóa như HKDF do các nhà cung cấp bảo mật (security provider) triển khai:

```java
// Tạo một đối tượng KDF sử dụng thuật toán HKDF-SHA256
KDF hkdf = KDF.getInstance("HKDF-SHA256");

// Tạo đặc tả tham số Extract và Expand
AlgorithmParameterSpec params =
    HKDFParameterSpec.ofExtract()
                     .addIKM(initialKeyMaterial) // Thiết lập dữ liệu khóa ban đầu
                     .addSalt(salt)             // Thiết lập giá trị salt
                     .thenExpand(info, 32);     // Thiết lập thông tin mở rộng và độ dài đích

// Dẫn xuất một khóa AES 32 byte
SecretKey key = hkdf.deriveKey("AES", params);

// Có thể sử dụng cùng đối tượng KDF cho các thao tác dẫn xuất khóa khác
```

## JEP 483: Early Class-File Loading & Linking (Tải và liên kết tệp class sớm)

Trong JVM truyền thống, ứng dụng cần tải và liên kết (load and link) các lớp một cách động trong mỗi lần khởi động. Tính năng này lưu cache các lớp đã được tải và liên kết để giảm công việc lặp lại ở những lần khởi động tiếp theo. Trong benchmark Spring PetClinic được nêu ở JEP 483, việc sử dụng AOT cache giúp thời gian khởi động giảm tối đa khoảng 42%; mức lợi ích thực tế phụ thuộc vào từng ứng dụng và môi trường chạy.

Tối ưu hóa này không yêu cầu chỉnh sửa mã ứng dụng, thư viện hay framework, nhưng cần ghi lại một lần chạy huấn luyện (training run) và tạo AOT cache trước, sau đó nạp bộ nhớ đệm đó khi khởi động chính thức. Các tham số liên quan bao gồm `-XX:AOTMode=record`, `-XX:AOTConfiguration`, `-XX:AOTMode=create` và `-XX:AOTCache`.

## JEP 484: Class File API

Class File API đã được xem trước lần đầu trong JDK 22 ([JEP 457](https://openjdk.org/jeps/457)) và được xem trước lần hai đồng thời hoàn thiện thêm trong JDK 23 ([JEP 466](https://openjdk.org/jeps/466)). Cuối cùng, tính năng này đã chính thức hoàn thiện trong JDK 24.

Mục tiêu của Class File API là cung cấp một bộ API tiêu chuẩn để phân tích cú pháp, tạo mới và chuyển đổi tệp class Java, thay thế sự phụ thuộc trước đây vào các thư viện bên thứ ba (như ASM) khi xử lý tệp class.

```java
// Tạo một đối tượng ClassFile, đây là điểm vào để thao tác với tệp class.
ClassFile cf = ClassFile.of();
// Phân tích mảng byte thành ClassModel
ClassModel classModel = cf.parse(bytes);

// Xây dựng tệp class mới, loại bỏ tất cả phương thức bắt đầu bằng "debug"
byte[] newBytes = cf.build(classModel.thisClass().asSymbol(),
        classBuilder -> {
            // Duyệt qua tất cả các phần tử của lớp
            for (ClassElement ce : classModel) {
                // Kiểm tra xem có phải là phương thức và tên phương thức bắt đầu bằng "debug" hay không
                if (!(ce instanceof MethodModel mm
                        && mm.methodName().stringValue().startsWith("debug"))) {
                    // Thêm vào tệp class mới
                    classBuilder.with(ce);
                }
            }
        });
```

## JEP 485: Stream Gatherers

Stream Gatherers `Stream::gather(Gatherer)` là một tính năng mới mạnh mẽ cho phép lập trình viên định nghĩa các thao tác trung gian tùy chỉnh, từ đó hiện thực hóa các phép biến đổi dữ liệu phức tạp và linh hoạt hơn. Giao diện `Gatherer` là cốt lõi của tính năng này; nó định nghĩa cách thu thập phần tử từ Stream, duy trì trạng thái trung gian và sinh kết quả trong quá trình xử lý.

Khác với các thao tác dựng sẵn hiện có như `filter`, `map` hay `distinct`, `Stream::gather` cho phép lập trình viên thực hiện những tác vụ khó hoàn thành bằng các thao tác Stream chuẩn. Ví dụ, có thể dùng `Stream::gather` để cài đặt cửa sổ trượt (sliding window), loại bỏ trùng lặp theo quy tắc tùy chỉnh, hoặc các phép chuyển đổi và tổng hợp có trạng thái phức tạp hơn. Sự linh hoạt này mở rộng đáng kể phạm vi ứng dụng của Stream API, giúp lập trình viên giải quyết các bài toán xử lý dữ liệu phức tạp hơn.

Cài đặt logic loại bỏ trùng lặp theo độ dài chuỗi dựa trên `Stream::gather(Gatherer)`:

```java
var result = Stream.of("foo", "bar", "baz", "quux")
                   .gather(Gatherer.ofSequential(
                       HashSet::new, // Khởi tạo trạng thái là HashSet để lưu các độ dài chuỗi đã gặp
                       (set, str, downstream) -> {
                           if (set.add(str.length())) {
                               return downstream.push(str);
                           }
                           return true; // Tiếp tục xử lý stream
                       }
                   ))
                   .toList();// Chuyển đổi sang List

// Kết quả đầu ra ==> [foo, quux]
```

## JEP 486: Vô hiệu hóa vĩnh viễn Security Manager

JDK 24 không còn cho phép bật `Security Manager`, ngay cả thông qua lệnh `java -Djava.security.manager` cũng không thể bật được; đây là bước then chốt để loại bỏ hoàn toàn tính năng này. Mặc dù `Security Manager` từng là công cụ quan trọng trong Java để giới hạn quyền của mã nguồn (như truy cập hệ thống tệp hoặc mạng, đọc hoặc ghi tệp nhạy cảm, thực thi lệnh hệ thống), nhưng do độ phức tạp cao, tỷ lệ sử dụng thấp và chi phí bảo trì lớn, cộng đồng Java đã quyết định tiến tới loại bỏ nó.

## JEP 487: Scoped Values (Bản xem trước lần 4)

Scoped Values (giá trị theo phạm vi) cho phép chia sẻ dữ liệu bất biến bên trong một Thread và giữa các Thread với nhau, ưu việt hơn biến cục bộ theo luồng (`ThreadLocal`), đặc biệt là khi sử dụng số lượng lớn Virtual Thread.

```java
final static ScopedValue<...> V = ScopedValue.newInstance();

// Trong một phương thức nào đó
ScopedValue.where(V, <value>)
           .run(() -> { ... V.get() ... call methods ... });

// Trong một phương thức được gọi trực tiếp hoặc gián tiếp từ biểu thức lambda
... V.get() ...
```

Scoped Values cho phép chia sẻ dữ liệu an toàn và hiệu quả giữa các thành phần trong các chương trình lớn mà không cần phải truyền qua tham số phương thức.

## JEP 491: Đồng bộ hóa Virtual Thread không cố định Platform Thread

Tối ưu hóa cơ chế làm việc giữa Virtual Thread và `synchronized`. Khi Virtual Thread bị block trong phương thức hoặc khối `synchronized`, thông thường nó có thể giải phóng Thread hệ điều hành (Platform Thread) đang chiếm giữ, tránh việc chiếm giữ Platform Thread quá lâu và từ đó nâng cao năng lực xử lý đồng thời của ứng dụng. Cơ chế này tránh được tình trạng "ghim/cố định (Pinning)" — tức việc Virtual Thread giữ chặt Platform Thread trong thời gian dài, ngăn cản Platform Thread đó phục vụ các Virtual Thread khác.

Mã nguồn Java hiện có đang sử dụng `synchronized` không cần chỉnh sửa vẫn được hưởng lợi từ khả năng mở rộng của Virtual Thread. Ví dụ, trong một ứng dụng thiên về I/O (I/O-intensive), nếu dùng Platform Thread truyền thống, khả năng đồng thời có thể bị suy giảm do Thread bị block. Còn khi dùng Virtual Thread, ngay cả khi xảy ra block bên trong khối `synchronized`, Platform Thread cũng không bị cố định, nhờ vậy Platform Thread có thể tiếp tục phục vụ các Virtual Thread khác và cải thiện hiệu năng đồng thời tổng thể.

## JEP 493: Liên kết ảnh runtime mà không cần tệp JMOD

Mặc định, JDK bao gồm cả ảnh runtime (run-time image chứa các module cần khi chạy) và các tệp JMOD. Tính năng này cho phép công cụ `jlink` tạo ảnh runtime tùy chỉnh mà không cần sử dụng các tệp JMOD của JDK, giúp giảm dung lượng cài đặt JDK (khoảng 25%).

Giải thích:

- `jlink` là công cụ dòng lệnh mới được phát hành cùng Java 9. Nó cho phép lập trình viên tạo ra bản JRE gọn nhẹ, tùy biến riêng cho các ứng dụng Java dựa trên module.
- Tệp JMOD là tệp lưu trữ dạng module có thể chứa tệp class, thư viện native, tệp cấu hình, tệp header, thông báo pháp lý và các nội dung khác.

## JEP 495: Đơn giản hóa tệp mã nguồn và phương thức main thể hiện (Bản xem trước lần 4)

Tính năng này chủ yếu đơn giản hóa việc khai báo phương thức `main`. Đối với người mới học Java, cách khai báo phương thức `main` truyền thống đưa vào quá nhiều khái niệm cú pháp Java, gây khó khăn cho việc tiếp cận nhanh.

Định nghĩa phương thức `main` trước khi sử dụng tính năng này:

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

Định nghĩa phương thức `main` sau khi sử dụng tính năng mới:

```java
class HelloWorld {
    void main() {
        System.out.println("Hello, World!");
    }
}
```

Đơn giản hóa hơn nữa (lớp không tên cho phép chúng ta lược bỏ tên lớp):

```java
void main() {
   System.out.println("Hello, World!");
}
```

## JEP 497: Thuật toán chữ ký số kháng lượng tử (ML-DSA)

JDK 24 bổ sung hỗ trợ triển khai thuật toán chữ ký số dựa trên mạng module kháng lượng tử (Module-Lattice-Based Digital Signature Algorithm, **ML-DSA**), nhằm chuẩn bị ứng phó với các mối đe dọa tiềm tàng từ máy tính lượng tử trong tương lai.

ML-DSA là thuật toán kháng lượng tử được Viện Tiêu chuẩn và Công nghệ Quốc gia Hoa Kỳ (NIST) chuẩn hóa trong FIPS 204, dùng cho chữ ký số và xác thực danh tính.

## JEP 498: Cảnh báo khi sử dụng các phương thức truy cập bộ nhớ của `sun.misc.Unsafe`

JDK 23 ([JEP 471](https://openjdk.org/jeps/471)) đã đề xuất đánh dấu lỗi thời các phương thức truy cập bộ nhớ trong `sun.misc.Unsafe`; các phương thức này sẽ bị loại bỏ trong các phiên bản tương lai. Trong JDK 24, khi lần đầu tiên gọi bất kỳ phương thức truy cập bộ nhớ nào của `sun.misc.Unsafe`, runtime sẽ phát ra cảnh báo.

Những phương thức không an toàn này đã có các giải pháp thay thế an toàn và hiệu quả:

- `java.lang.invoke.VarHandle`: Được giới thiệu trong JDK 9 (JEP 193), cung cấp phương thức an toàn và hiệu quả để thao tác với bộ nhớ Heap, bao gồm các trường của đối tượng, trường tĩnh (`static`) của lớp và các phần tử mảng.
- `java.lang.foreign.MemorySegment`: Được giới thiệu trong JDK 22 (JEP 454), cung cấp phương thức an toàn và hiệu quả để truy cập bộ nhớ ngoài Heap (off-heap), đôi khi phối hợp làm việc cùng `VarHandle`.

`MemorySegment` là một trong những kiểu cốt lõi của Foreign Function & Memory API (API Hàm ngoài & Bộ nhớ ngoài), dùng để truy cập an toàn bộ nhớ trong Heap hoặc ngoài Heap; còn `VarHandle` là API chuẩn độc lập có thể dùng để truy cập trường, phần tử mảng hoặc truy cập dữ liệu theo bố cục bộ nhớ. Foreign Function & Memory API đã trở thành tính năng chính thức từ JDK 22.

```java
import java.lang.foreign.*;
import java.lang.invoke.VarHandle;

// Lớp quản lý mảng số nguyên ngoài Heap
class OffHeapIntBuffer {

    // VarHandle dùng để truy cập các phần tử kiểu số nguyên
    private static final VarHandle ELEM_VH = ValueLayout.JAVA_INT.arrayElementVarHandle();

    // Trình quản lý bộ nhớ
    private final Arena arena;

    // Phân đoạn bộ nhớ ngoài Heap
    private final MemorySegment buffer;

    // Hàm khởi tạo, cấp phát không gian cho số lượng số nguyên chỉ định
    public OffHeapIntBuffer(long size) {
        this.arena  = Arena.ofShared();
        this.buffer = arena.allocate(ValueLayout.JAVA_INT, size);
    }

    // Giải phóng bộ nhớ
    public void deallocate() {
        arena.close();
    }

    // Thiết lập giá trị tại chỉ mục chỉ định theo ngữ nghĩa volatile
    public void setVolatile(long index, int value) {
        ELEM_VH.setVolatile(buffer, 0L, index, value);
    }

    // Khởi tạo giá trị 0 cho phạm vi phần tử chỉ định
    public void initialize(long start, long n) {
        buffer.asSlice(ValueLayout.JAVA_INT.byteSize() * start,
                       ValueLayout.JAVA_INT.byteSize() * n)
              .fill((byte) 0);
    }

    // Sao chép các phần tử trong phạm vi chỉ định sang một mảng mới
    public int[] copyToNewArray(long start, int n) {
        return buffer.asSlice(ValueLayout.JAVA_INT.byteSize() * start,
                              ValueLayout.JAVA_INT.byteSize() * n)
                     .toArray(ValueLayout.JAVA_INT);
    }
}
```

## JEP 499: Structured Concurrency (Bản xem trước lần 4)

JDK 19 đã giới thiệu Structured Concurrency dưới dạng API thử nghiệm (incubator). Trong JDK 24, API này đang ở giai đoạn xem trước lần thứ tư, với mục đích đơn giản hóa lập trình đa luồng chứ không nhằm thay thế `java.util.concurrent`.

Structured Concurrency coi nhiều tác vụ chạy trên các Thread khác nhau như một đơn vị công việc duy nhất, qua đó đơn giản hóa xử lý lỗi, nâng cao độ tin cậy và tăng cường khả năng quan sát (observability). Nói cách khác, Structured Concurrency giữ lại tính dễ đọc, dễ bảo trì và dễ quan sát như mã nguồn đơn luồng.

API cơ bản của Structured Concurrency là `StructuredTaskScope`, hỗ trợ chia tách một tác vụ thành nhiều tác vụ con đồng thời chạy trên các Thread riêng của chúng, và các tác vụ con phải hoàn thành trước khi tác vụ chính tiếp tục.

Cách dùng cơ bản của `StructuredTaskScope` như sau:

```java
    try (var scope = new StructuredTaskScope<Object>()) {
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
