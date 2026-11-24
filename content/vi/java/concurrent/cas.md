---
title: Giải thích chi tiết CAS
description: "Phân tích chuyên sâu về CAS (Compare-And-Swap): giải thích chi tiết nguyên lý thao tác nguyên tử CAS, cài đặt qua lớp Unsafe, vấn đề ABA và giải pháp, cơ chế Spin Lock, và so sánh hiệu năng với khóa bi quan."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/cas.md
head:
  - - meta
    - name: keywords
      content: CAS,Compare-And-Swap,thao tác nguyên tử,vấn đề ABA,Spin Lock,Khóa lạc quan,Unsafe,nguyên lý CAS
---

Để tìm hiểu giới thiệu về khóa lạc quan và khóa bi quan cũng như các cách triển khai phổ biến của khóa lạc quan, bạn có thể đọc bài viết này của tác giả: [Giải thích chi tiết Khóa lạc quan và Khóa bi quan](https://javaguide.cn/java/concurrent/optimistic-lock-and-pessimistic-lock.html).

Bài viết này chủ yếu giới thiệu: cách triển khai CAS trong Java và một số vấn đề còn tồn tại của CAS.

## CAS được triển khai trong Java như thế nào?

Trong Java, một lớp then chốt để triển khai thao tác CAS (Compare-And-Swap, so sánh và hoán đổi) là `Unsafe`.

Lớp `Unsafe` nằm trong package `sun.misc`, là một lớp cung cấp các thao tác cấp thấp, không an toàn (low-level, unsafe). Do khả năng mạnh mẽ và rủi ro tiềm ẩn của nó, lớp này thường được dùng bên trong JVM hoặc trong các thư viện đòi hỏi hiệu năng cực cao và quyền truy cập tầng dưới, chứ không khuyến khích lập trình viên thông thường sử dụng trong mã nguồn ứng dụng. Để tìm hiểu chi tiết về lớp `Unsafe`, bạn có thể đọc bài viết này: 📌[Giải thích chi tiết lớp ma thuật Unsafe trong Java](https://javaguide.cn/java/basis/unsafe.html).

Lớp `Unsafe` trong package `sun.misc` cung cấp các phương thức `compareAndSwapObject`, `compareAndSwapInt` và `compareAndSwapLong` để thực hiện thao tác CAS cho các kiểu `Object`, `int` và `long`:

```java
/**
 * Cập nhật giá trị trường dữ liệu của đối tượng một cách nguyên tử.
 *
 * @param o        đối tượng cần thao tác
 * @param offset   độ lệch bộ nhớ (memory offset) của trường dữ liệu trong đối tượng
 * @param expected giá trị cũ kỳ vọng
 * @param x        giá trị mới cần gán
 * @return trả về true nếu giá trị được cập nhật thành công; ngược lại trả về false
 */
boolean compareAndSwapObject(Object o, long offset, Object expected, Object x);

/**
 * Cập nhật giá trị trường dữ liệu kiểu int của đối tượng một cách nguyên tử.
 */
boolean compareAndSwapInt(Object o, long offset, int expected, int x);

/**
 * Cập nhật giá trị trường dữ liệu kiểu long của đối tượng một cách nguyên tử.
 */
boolean compareAndSwapLong(Object o, long offset, long expected, long x);
```

Các phương thức CAS mà `Unsafe` cung cấp trong JDK 8 này đều là phương thức `native`. Mã Java thông qua chúng để biểu đạt ngữ nghĩa so sánh và hoán đổi nguyên tử; HotSpot thường nhận diện các lời gọi liên quan như một hàm nội tại của JVM (JVM intrinsic), rồi ánh xạ thành lệnh nguyên tử hoặc cài đặt tương đương mà bộ xử lý đích hỗ trợ. Cách cài đặt cụ thể phụ thuộc vào JVM và kiến trúc CPU, chứ không thể tóm gọn đơn giản là "gọi inline assembly C++ thông qua JNI".

Package `java.util.concurrent.atomic` cung cấp một số lớp phục vụ cho các thao tác nguyên tử.

![Tổng quan các lớp Atomic trong JUC](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/JUC-064976d1.png)

Để tìm hiểu giới thiệu và cách sử dụng các lớp Atomic này, bạn có thể đọc bài viết này: [Tổng hợp các lớp Atomic](https://javaguide.cn/java/concurrent/atomic-classes.html).

Các lớp Atomic dựa vào khóa lạc quan CAS để đảm bảo tính nguyên tử (`Atomicity`) của các phương thức, mà không cần sử dụng các cơ chế khóa truyền thống (như khối `synchronized` hoặc `ReentrantLock`).

`AtomicInteger` là một trong những lớp nguyên tử của Java, chủ yếu dùng để thực hiện các thao tác nguyên tử trên biến kiểu `int`. Cài đặt trên JDK 8 dưới đây tận dụng các phương thức thao tác nguyên tử cấp thấp do `Unsafe` cung cấp; trong các phiên bản JDK mới hơn, API liên quan và chi tiết cài đặt nội bộ có thể khác nhau, và mã ứng dụng cũng có thể sử dụng `VarHandle` tiêu chuẩn để biểu đạt ngữ nghĩa truy cập nguyên tử.

Dưới đây, thông qua việc phân tích mã nguồn cốt lõi của `AtomicInteger` (JDK 1.8), chúng ta sẽ minh họa cách Java sử dụng các phương thức của lớp `Unsafe` để hiện thực hóa thao tác nguyên tử.

Mã nguồn cốt lõi của `AtomicInteger` như sau:

```java
// Lấy instance của Unsafe
private static final Unsafe unsafe = Unsafe.getUnsafe();
private static final long valueOffset;

static {
    try {
        // Lấy độ lệch bộ nhớ của trường "value" trong lớp AtomicInteger
        valueOffset = unsafe.objectFieldOffset
            (AtomicInteger.class.getDeclaredField("value"));
    } catch (Exception ex) { throw new Error(ex); }
}
// Đảm bảo tính khả kiến của trường "value"
private volatile int value;

// Nếu giá trị hiện tại bằng giá trị kỳ vọng, cập nhật nguyên tử giá trị thành update
// Sử dụng phương thức Unsafe#compareAndSwapInt để thực hiện thao tác CAS
public final boolean compareAndSet(int expect, int update) {
    return unsafe.compareAndSwapInt(this, valueOffset, expect, update);
}

// Cộng thêm delta vào giá trị hiện tại một cách nguyên tử và trả về giá trị cũ
public final int getAndAdd(int delta) {
    return unsafe.getAndAddInt(this, valueOffset, delta);
}

// Cộng 1 vào giá trị hiện tại một cách nguyên tử và trả về giá trị trước khi cộng (giá trị cũ)
// Sử dụng phương thức Unsafe#getAndAddInt để thực hiện thao tác CAS.
public final int getAndIncrement() {
    return unsafe.getAndAddInt(this, valueOffset, 1);
}

// Trừ 1 khỏi giá trị hiện tại một cách nguyên tử và trả về giá trị trước khi trừ (giá trị cũ)
public final int getAndDecrement() {
    return unsafe.getAndAddInt(this, valueOffset, -1);
}
```

Mã nguồn `Unsafe#getAndAddInt`:

```java
// Lấy và cộng thêm một giá trị số nguyên một cách nguyên tử
public final int getAndAddInt(Object o, long offset, int delta) {
    int v;
    do {
        // Đọc giá trị int của đối tượng o tại độ lệch bộ nhớ offset theo ngữ nghĩa volatile
        v = getIntVolatile(o, offset);
    } while (!compareAndSwapInt(o, offset, v, v + delta));
    // Trả về giá trị cũ
    return v;
}
```

Có thể thấy, `getAndAddInt` sử dụng vòng lặp `do-while`: khi thao tác `compareAndSwapInt` thất bại, nó sẽ liên tục thử lại cho đến khi thành công. Tức là phương thức `getAndAddInt` sẽ thử cập nhật giá trị `value` thông qua `compareAndSwapInt`; nếu cập nhật thất bại (giá trị hiện tại trong lúc đó đã bị Thread khác sửa đổi), nó sẽ lấy lại giá trị hiện tại và thử cập nhật lại một lần nữa cho đến khi thao tác thành công.

Do thao tác CAS có thể thất bại vì xung đột đồng thời, nên nó thường được kết hợp với vòng lặp `while` để liên tục thử lại sau khi thất bại cho đến khi thành công. Đây chính là **cơ chế Spin Lock**.

## Thuật toán CAS tồn tại những vấn đề gì?

Vấn đề ABA là vấn đề phổ biến nhất của thuật toán CAS.

### Vấn đề ABA

Nếu một biến V có giá trị A khi đọc lần đầu, và khi chuẩn bị gán giá trị mới lại kiểm tra thấy nó vẫn có giá trị A, liệu chúng ta có thể kết luận giá trị của nó chưa từng bị Thread khác sửa đổi hay không? Rõ ràng là không thể, vì trong khoảng thời gian đó giá trị của nó có thể đã bị đổi thành một giá trị khác rồi sau đó lại bị đổi ngược về A; khi ấy thao tác CAS sẽ hiểu nhầm rằng nó chưa từng bị sửa đổi. Vấn đề này được gọi là **vấn đề "ABA"** của thao tác CAS.

Hướng giải quyết vấn đề ABA là gắn thêm **số phiên bản hoặc dấu thời gian (timestamp)** vào trước biến. Kể từ JDK 1.5, lớp `AtomicStampedReference` được cung cấp để giải quyết vấn đề ABA; trong đó phương thức `compareAndSet()` trước tiên sẽ kiểm tra xem tham chiếu hiện tại có bằng tham chiếu kỳ vọng hay không và dấu ấn (stamp) hiện tại có bằng dấu ấn kỳ vọng hay không; nếu tất cả đều bằng nhau, nó sẽ cập nhật nguyên tử tham chiếu và dấu ấn đó thành giá trị mới được truyền vào.

```java
public boolean compareAndSet(V   expectedReference,
                             V   newReference,
                             int expectedStamp,
                             int newStamp) {
    Pair<V> current = pair;
    return
        expectedReference == current.reference &&
        expectedStamp == current.stamp &&
        ((newReference == current.reference &&
          newStamp == current.stamp) ||
         casPair(current, Pair.of(newReference, newStamp)));
}
```

### Thời gian lặp dài gây chi phí cao

CAS thường sử dụng thao tác spin (quay vòng) để thử lại, tức là không thành công thì cứ lặp liên tục cho đến khi thành công. Nếu không thành công trong thời gian dài, nó sẽ gây ra chi phí thực thi rất lớn cho CPU.

Nếu JVM hỗ trợ lệnh `pause` do bộ xử lý cung cấp, hiệu quả của thao tác spin sẽ được cải thiện. Lệnh `pause` có hai vai trò quan trọng:

1. **Làm trễ việc thực thi lệnh trên đường ống (pipeline)**: Lệnh `pause` có thể trì hoãn việc thực thi lệnh, từ đó giảm tiêu hao tài nguyên của CPU. Thời gian trễ cụ thể phụ thuộc vào phiên bản cài đặt của bộ xử lý; trên một số bộ xử lý, thời gian trễ có thể bằng 0.
2. **Tránh xung đột thứ tự bộ nhớ (Memory Order Violation)**: Khi thoát khỏi vòng lặp, lệnh `pause` có thể tránh việc pipeline của CPU bị xóa sạch do xung đột thứ tự bộ nhớ, qua đó nâng cao hiệu quả thực thi của CPU.

### Chỉ đảm bảo được thao tác nguyên tử cho một biến chia sẻ đơn lẻ

Thao tác CAS chỉ có hiệu lực đối với một biến chia sẻ đơn lẻ. Khi cần thao tác trên nhiều biến chia sẻ cùng lúc, CAS trở nên bất lực. Tuy nhiên, bắt đầu từ JDK 1.5, Java đã cung cấp lớp `AtomicReference`, cho phép chúng ta đảm bảo tính nguyên tử giữa các đối tượng được tham chiếu. Bằng cách đóng gói nhiều biến vào trong một đối tượng, chúng ta có thể dùng `AtomicReference` để thực hiện thao tác CAS.

Ngoài cách dùng `AtomicReference` này ra, cũng có thể sử dụng cơ chế khóa (lock) để đảm bảo.

## Tổng kết

Trong Java, các API như lớp nguyên tử (Atomic) và `VarHandle` có thể biểu đạt thao tác CAS; sau đó JVM sẽ tùy theo nền tảng đích để hiện thực hóa chúng thành các lệnh nguyên tử được bộ xử lý hỗ trợ hoặc cơ chế tương đương. Cài đặt cụ thể phụ thuộc vào JVM và kiến trúc CPU, chứ không bị đặc tả Java giới hạn cố định vào JNI hay một kiểu viết hợp ngữ nào.

Mặc dù CAS sở hữu đặc tính không khóa (lock-free) hiệu năng cao, nhưng cũng cần lưu ý các vấn đề như ABA hay chi phí lớn khi thời gian vòng lặp spin kéo dài.
