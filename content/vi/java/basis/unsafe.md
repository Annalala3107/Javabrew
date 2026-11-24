---
title: Giải thích chi tiết về lớp ma thuật Unsafe trong Java
description: "Phân tích chuyên sâu về lớp ma thuật Unsafe trong Java: trình bày các khả năng tầng thấp như thao tác bộ nhớ trực tiếp, thao tác nguyên tử CAS, khởi tạo đối tượng, giúp hiểu rõ nguyên lý cài đặt của các công cụ đồng thời JUC và rủi ro khi sử dụng."
category: Java
tag:
  - Java cơ bản
lang: vi
sourceRef: zh-ref/java/basis/unsafe.md
head:
  - - meta
    - name: keywords
      content: lớp Unsafe,thao tác bộ nhớ,thao tác nguyên tử CAS,bộ nhớ ngoài Heap,bộ nhớ trực tiếp,sun.misc.Unsafe,cài đặt tầng thấp JUC
---

> Bài viết này được tổng hợp và hoàn thiện từ hai bài viết xuất sắc dưới đây:
>
> - [Lớp ma thuật Java: Phân tích ứng dụng Unsafe - Đội ngũ kỹ thuật Meituan - 2019](https://tech.meituan.com/2019/02/14/talk-about-java-magic-class-unsafe.html)
> - [Con dao hai lưỡi trong Java: Giải thích chi tiết lớp Unsafe - Manong Canshang - 2021](https://xie.infoq.cn/article/8b6ed4195e475bfb32dacc5cb)

<!-- markdownlint-disable MD024 -->

Những ai từng đọc mã nguồn JUC chắc chắn sẽ phát hiện ra rất nhiều công cụ xử lý đồng thời đều gọi đến một lớp tên là `Unsafe`.

Vậy lớp này chủ yếu dùng để làm gì? Có những kịch bản sử dụng nào? Bài viết này sẽ giúp bạn làm rõ tất cả!

## Giới thiệu về Unsafe

`Unsafe` là một lớp nằm trong gói `sun.misc`, chủ yếu cung cấp các phương thức dùng để thực hiện những thao tác tầng thấp và không an toàn, chẳng hạn như truy cập trực tiếp tài nguyên bộ nhớ hệ thống hay tự chủ quản lý tài nguyên bộ nhớ. Những phương thức này đóng vai trò rất lớn trong việc nâng cao hiệu năng thực thi của Java và tăng cường khả năng thao tác tài nguyên tầng thấp của ngôn ngữ Java. Tuy nhiên, vì lớp `Unsafe` giúp ngôn ngữ Java có được khả năng thao tác vùng nhớ giống như con trỏ trong ngôn ngữ C, điều này chắc chắn cũng làm tăng nguy cơ phát sinh các lỗi liên quan đến con trỏ trong chương trình. Việc lạm dụng hoặc sử dụng lớp `Unsafe` không đúng cách sẽ làm tăng xác suất xảy ra lỗi, khiến một ngôn ngữ vốn an toàn như Java trở nên không còn "an toàn" nữa; do đó nhất định phải thận trọng khi sử dụng `Unsafe`.

Ngoài ra, việc cài đặt các tính năng do `Unsafe` cung cấp cần dựa vào phương thức bản địa (Native Method). Bạn có thể hiểu Native Method là phương thức trong Java được viết bằng một ngôn ngữ lập trình khác. Phương thức bản địa được khai báo với từ khóa **`native`**: trong mã nguồn Java chỉ khai báo phần đầu của phương thức, còn phần cài đặt cụ thể được giao cho **mã bản địa (native code)**.

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717115231125-9fa85f9b.png)

**Tại sao phải sử dụng Native Method?**

1. Cần sử dụng các đặc tính phụ thuộc vào hệ điều hành mà Java không có sẵn: bên cạnh việc đảm bảo tính đa nền tảng, để kiểm soát được tầng thấp thì Java cần nhờ tới các ngôn ngữ khác phát huy vai trò.
2. Đối với những chức năng có sẵn đã được hoàn thiện bằng ngôn ngữ khác, Java có thể gọi trực tiếp để sử dụng.
3. Khi chương trình nhạy cảm về thời gian hoặc có yêu cầu cực kỳ cao về hiệu năng, việc sử dụng ngôn ngữ tầng thấp hơn như C/C++ hoặc thậm chí hợp ngữ (Assembly) là cần thiết.

Nhiều công cụ đồng thời trong gói JUC khi cài đặt cơ chế đồng thời đều gọi tới Native Method, qua đó phá vỡ giới hạn của Java runtime để tiếp cận một số chức năng tầng thấp của hệ điều hành. Đối với cùng một Native Method, các hệ điều hành khác nhau có thể cài đặt theo những cách khác nhau, nhưng đối với người dùng thì điều này hoàn toàn trong suốt và cuối cùng đều cho ra kết quả giống nhau.

## Khởi tạo Unsafe

Một phần mã nguồn của `sun.misc.Unsafe` như sau:

```java
public final class Unsafe {
  // Đối tượng Singleton
  private static final Unsafe theUnsafe;
  ......
  private Unsafe() {
  }
  @CallerSensitive
  public static Unsafe getUnsafe() {
    Class var0 = Reflection.getCallerClass();
    // Chỉ hợp lệ khi được tải bởi `BootstrapClassLoader`
    if(!VM.isSystemDomainLoader(var0.getClassLoader())) {
      throw new SecurityException("Unsafe");
    } else {
      return theUnsafe;
    }
  }
}
```

Lớp `Unsafe` được cài đặt theo mẫu Singleton và cung cấp phương thức tĩnh `getUnsafe` để lấy thể hiện `Unsafe`. Thoạt nhìn, có vẻ ta có thể dùng nó để lấy đối tượng `Unsafe`. Tuy nhiên, khi gọi trực tiếp phương thức tĩnh này, chương trình sẽ ném ra ngoại lệ `SecurityException`:

```bash
Exception in thread "main" java.lang.SecurityException: Unsafe
 at sun.misc.Unsafe.getUnsafe(Unsafe.java:90)
 at com.cn.test.GetUnsafeTest.main(GetUnsafeTest.java:12)
```

**Tại sao phương thức `public static` lại không thể gọi trực tiếp?**

Đó là vì bên trong phương thức `getUnsafe`, nó sẽ kiểm tra `classLoader` của bên gọi để xem lớp hiện tại có được tải bởi `Bootstrap classLoader` hay không; nếu không thì sẽ ném ra ngoại lệ `SecurityException`. Nói cách khác, chỉ những lớp được tải bởi `BootstrapClassLoader` mới có thể gọi các phương thức trong lớp `Unsafe`, nhằm ngăn chặn các phương thức này bị gọi trong mã nguồn không đáng tin cậy.

**Tại sao lại giới hạn việc sử dụng lớp `Unsafe` thận trọng như vậy?**

Các tính năng mà `Unsafe` cung cấp quá ở tầng thấp (như truy cập trực tiếp tài nguyên bộ nhớ hệ thống, tự quản lý tài nguyên bộ nhớ, v.v.), tiềm ẩn rủi ro bảo mật tương đối lớn; nếu sử dụng không đúng cách rất dễ phát sinh các vấn đề nghiêm trọng.

**Nếu muốn sử dụng lớp `Unsafe`, chúng ta nên lấy thể hiện của nó bằng cách nào?**

Dưới đây giới thiệu hai phương án khả thi.

1. Sử dụng Reflection để lấy đối tượng Singleton `theUnsafe` đã được khởi tạo sẵn trong lớp `Unsafe`.

```java
private static Unsafe reflectGetUnsafe() {
    try {
      Field field = Unsafe.class.getDeclaredField("theUnsafe");
      field.setAccessible(true);
      return (Unsafe) field.get(null);
    } catch (Exception e) {
      log.error(e.getMessage(), e);
      return null;
    }
}
```

2. Xuất phát từ điều kiện giới hạn sử dụng của phương thức `getUnsafe`, dùng tùy chọn dòng lệnh Java `-Xbootclasspath/a` để bổ sung đường dẫn file JAR chứa lớp `A` (lớp gọi các phương thức liên quan đến `Unsafe`) vào đường dẫn bootstrap mặc định, giúp `A` được tải bởi `BootstrapClassLoader`, từ đó có thể lấy thể hiện `Unsafe` một cách an toàn qua phương thức `Unsafe.getUnsafe`.

```bash
java -Xbootclasspath/a: ${path}   // trong đó path là đường dẫn file JAR chứa lớp gọi các phương thức liên quan đến Unsafe
```

## Các tính năng của Unsafe

Nhìn chung, các tính năng do lớp `Unsafe` cung cấp có thể chia thành 8 nhóm dưới đây:

1. Thao tác bộ nhớ
2. Rào cản bộ nhớ (Memory Barrier)
3. Thao tác đối tượng
4. Thao tác dữ liệu
5. Thao tác CAS
6. Điều phối Thread
7. Thao tác với Class
8. Thông tin hệ thống

### Thao tác bộ nhớ

#### Giới thiệu

Nếu bạn là một lập trình viên từng viết C hoặc C++, chắc chắn bạn không còn xa lạ với các thao tác bộ nhớ; còn trong Java, lập trình viên không được phép thao tác trực tiếp lên bộ nhớ mà việc cấp phát và thu hồi bộ nhớ của đối tượng đều do JVM tự thực hiện. Tuy nhiên, trong `Unsafe` có cung cấp các giao diện sau để thao tác trực tiếp với bộ nhớ:

```java
// Cấp phát vùng nhớ bản địa (native) mới
public native long allocateMemory(long bytes);
// Điều chỉnh lại kích thước vùng nhớ
public native long reallocateMemory(long address, long bytes);
// Đặt giá trị chỉ định cho vùng nhớ
public native void setMemory(Object o, long offset, long bytes, byte value);
// Sao chép bộ nhớ
public native void copyMemory(Object srcBase, long srcOffset,Object destBase, long destOffset,long bytes);
// Giải phóng bộ nhớ
public native void freeMemory(long address);
```

Kiểm thử bằng đoạn mã dưới đây:

```java
private void memoryTest() {
    int size = 4;
    // 1. Cấp phát bộ nhớ ban đầu
    long oldAddr = unsafe.allocateMemory(size);
    System.out.println("Initial address: " + oldAddr);

    // 2. Ghi dữ liệu vào vùng nhớ ban đầu
    unsafe.putInt(oldAddr, 16843009); // Ghi 0x01010101
    System.out.println("Value at oldAddr: " + unsafe.getInt(oldAddr));

    // 3. Cấp phát lại bộ nhớ
    long newAddr = unsafe.reallocateMemory(oldAddr, size * 2);
    System.out.println("New address: " + newAddr);

    // 4. reallocateMemory đã sao chép dữ liệu từ oldAddr sang newAddr
    // Vì vậy 4 byte đầu của newAddr phải giống với nội dung của oldAddr
    System.out.println("Value at newAddr (first 4 bytes): " + unsafe.getInt(newAddr));

    // Quan trọng: mọi thao tác sau này đều phải dựa trên newAddr, oldAddr đã mất hiệu lực!
    try {
        // 5. Ghi dữ liệu mới vào nửa sau của khối bộ nhớ mới
        unsafe.putInt(newAddr + size, 33686018); // Ghi 0x02020202

        // 6. Đọc toàn bộ giá trị long 8 byte
        System.out.println("Value at newAddr (full 8 bytes): " + unsafe.getLong(newAddr));

    } finally {
        // 7. Chỉ giải phóng địa chỉ bộ nhớ hợp lệ cuối cùng
        unsafe.freeMemory(newAddr);
        // Nếu cố gọi freeMemory(oldAddr), sẽ gây ra lỗi double free!
    }
}
```

Trước tiên hãy xem kết quả đầu ra:

```plain
Initial address: 140467048086752
Value at oldAddr: 16843009
New address: 140467048086752
Value at newAddr (first 4 bytes): 16843009
Value at newAddr (full 8 bytes): 144680345659310337
```

`reallocateMemory` có hành vi tương tự hàm `realloc` trong ngôn ngữ C: nó sẽ cố gắng mở rộng hoặc thu hẹp khối bộ nhớ mà không di chuyển dữ liệu. Hành vi của nó chủ yếu có hai trường hợp:

1. **Mở rộng tại chỗ**: Nếu phía sau khối bộ nhớ hiện tại còn đủ không gian trống liên tiếp, `reallocateMemory` sẽ mở rộng bộ nhớ trực tiếp tại địa chỉ cũ và trả về địa chỉ ban đầu.
2. **Mở rộng tại vị trí khác**: Nếu phía sau khối bộ nhớ hiện tại không đủ chỗ, nó sẽ tìm một vùng nhớ mới đủ lớn, sao chép dữ liệu cũ sang đó, sau đó giải phóng địa chỉ bộ nhớ cũ và trả về địa chỉ mới.

**Kết hợp với kết quả chạy lần này, chúng ta có thể phân tích như sau:**

**Bước 1: Cấp phát và ghi dữ liệu ban đầu**

- `unsafe.allocateMemory(size)` cấp phát 4 byte bộ nhớ ngoài Heap (off-heap memory) tại địa chỉ `140467048086752`.
- `unsafe.putInt(oldAddr, 16843009)` ghi giá trị `int` là `16843009` (biểu diễn hệ thập lục phân là `0x01010101`) vào địa chỉ đó. `getInt` đọc ra chính xác, chứng tỏ thao tác ghi đã thành công.

**Bước 2: Mở rộng bộ nhớ tại chỗ**

- `long newAddr = unsafe.reallocateMemory(oldAddr, size * 2)` thử mở rộng khối bộ nhớ lên 8 byte.
- Quan sát đầu ra `New address: 140467048086752`, ta thấy giá trị của `newAddr` và `oldAddr` **hoàn toàn giống nhau**.
- Điều này cho thấy thao tác lần này đã kích hoạt "mở rộng tại chỗ". Hệ thống tìm thấy đủ không gian trống phía sau địa chỉ gốc `140467048086752` và trực tiếp mở rộng khối bộ nhớ lên 8 byte. Trong quá trình này, địa chỉ cũ `oldAddr` vẫn còn hiệu lực và chính là `newAddr`, dữ liệu cũng không hề bị di chuyển.

**Bước 3: Xác minh dữ liệu và ghi dữ liệu mới**

- `unsafe.getInt(newAddr)` đọc lại 4 byte đầu tiên, kết quả vẫn là `16843009`, xác minh dữ liệu gốc vẫn nguyên vẹn.
- `unsafe.putInt(newAddr + size, 33686018)` ghi giá trị `int` mới là `33686018` (hệ thập lục phân là `0x02020202`) vào 4 byte sau vừa được mở rộng (tại độ lệch offset bằng 4).

**Bước 4: Đọc toàn bộ dữ liệu**

- `unsafe.getLong(newAddr)` đọc một giá trị `long` (8 byte) từ địa chỉ bắt đầu. Lúc này nội dung 8 byte trong bộ nhớ là sự ghép nối của `0x01010101` (địa chỉ thấp) và `0x02020202` (địa chỉ cao).
- Trên máy sử dụng thứ tự byte Little-Endian, 8 byte này trong bộ nhớ sẽ được diễn giải thành số hệ thập lục phân `0x0202020201010101`.
- Khi chuyển đổi số hệ thập lục phân này sang hệ thập phân, kết quả chính xác là `144680345659310337`. Điều này giải thích hoàn hảo kết quả đầu ra cuối cùng.

**Bước 5: Giải phóng bộ nhớ an toàn**

- Trong khối `finally`, `unsafe.freeMemory(newAddr)` giải phóng an toàn toàn bộ khối bộ nhớ 8 byte.
- Do lần này là mở rộng tại chỗ (`oldAddr == newAddr`), nên ngay cả việc viết nhầm thêm một câu lệnh `freeMemory(oldAddr)` cũng sẽ dẫn đến lỗi nghiêm trọng giải phóng hai lần (`double free`).

#### Ứng dụng điển hình

`DirectByteBuffer` là một lớp quan trọng trong Java dùng để triển khai bộ nhớ ngoài Heap, thường được dùng làm vùng đệm (buffer pool) trong quá trình giao tiếp dữ liệu, chẳng hạn như được ứng dụng rộng rãi trong các framework NIO như Netty, MINA. Toàn bộ logic tạo, sử dụng và hủy bộ nhớ ngoài Heap của `DirectByteBuffer` đều được cài đặt thông qua các API bộ nhớ ngoài Heap do `Unsafe` cung cấp.

**Tại sao lại sử dụng bộ nhớ ngoài Heap?**

- Cải thiện tình trạng tạm dừng do Garbage Collection (GC). Vì bộ nhớ ngoài Heap chịu sự quản lý trực tiếp của hệ điều hành chứ không phải JVM, nên khi dùng bộ nhớ ngoài Heap, ta có thể duy trì quy mô bộ nhớ trong Heap ở mức tương đối nhỏ, qua đó giảm bớt ảnh hưởng của thời gian dừng thu gom rác đối với ứng dụng.
- Nâng cao hiệu năng thao tác I/O của chương trình. Thông thường trong quá trình giao tiếp I/O sẽ tồn tại thao tác sao chép dữ liệu từ bộ nhớ trong Heap sang bộ nhớ ngoài Heap; đối với các dữ liệu tạm cần sao chép qua lại giữa các vùng nhớ với tần suất cao và có vòng đời ngắn, đều nên được lưu trữ trong bộ nhớ ngoài Heap.

Dưới đây là hàm tạo (constructor) của `DirectByteBuffer`. Khi tạo `DirectByteBuffer`, nó cấp phát bộ nhớ qua `Unsafe.allocateMemory`, khởi tạo bộ nhớ bằng `Unsafe.setMemory`, sau đó khởi tạo đối tượng `Cleaner` để theo dõi quá trình thu gom rác của đối tượng `DirectByteBuffer`, nhằm thực hiện việc giải phóng luôn vùng nhớ ngoài Heap đã cấp phát khi `DirectByteBuffer` bị thu hồi bởi Garbage Collection.

```java
DirectByteBuffer(int cap) {                   // package-private

    super(-1, 0, cap, cap);
    boolean pa = VM.isDirectMemoryPageAligned();
    int ps = Bits.pageSize();
    long size = Math.max(1L, (long)cap + (pa ? ps : 0));
    Bits.reserveMemory(size, cap);

    long base = 0;
    try {
        // Cấp phát bộ nhớ và trả về địa chỉ cơ sở
        base = unsafe.allocateMemory(size);
    } catch (OutOfMemoryError x) {
        Bits.unreserveMemory(size, cap);
        throw x;
    }
    // Khởi tạo bộ nhớ
    unsafe.setMemory(base, size, (byte) 0);
    if (pa && (base % ps != 0)) {
        // Round up to page boundary
        address = base + ps - (base & (ps - 1));
    } else {
        address = base;
    }
    // Theo dõi quá trình thu gom rác của đối tượng DirectByteBuffer để giải phóng bộ nhớ ngoài Heap
    cleaner = Cleaner.create(this, new Deallocator(base, size, cap));
    att = null;
}
```

### Rào cản bộ nhớ (Memory Barrier)

#### Giới thiệu

Trước khi giới thiệu về rào cản bộ nhớ (Memory Barrier), cần biết rằng trình biên dịch và CPU, trong điều kiện vẫn đảm bảo kết quả đầu ra của chương trình nhất quán, sẽ tiến hành sắp xếp lại mã lệnh (`Instruction Reordering`) nhằm nâng cao hiệu năng dưới góc độ tối ưu hóa tập lệnh. Tuy nhiên, việc sắp xếp lại lệnh có thể dẫn đến một hệ quả không mong muốn là dữ liệu trong bộ nhớ đệm (cache) của CPU và trong bộ nhớ chính không đồng nhất. Rào cản bộ nhớ (`Memory Barrier`) chính là cơ chế ngăn chặn việc sắp xếp lại các lệnh ở hai phía của rào cản để tránh những tối ưu hóa sai lệch từ trình biên dịch và phần cứng.

Ở cấp độ phần cứng, Memory Barrier là các chỉ thị do CPU cung cấp để ngăn mã lệnh bị sắp xếp lại, và cách cài đặt Memory Barrier trên các nền tảng phần cứng khác nhau có thể không giống nhau. Trong Java 8 đã bổ sung 3 hàm rào cản bộ nhớ; chúng che giấu sự khác biệt ở tầng dưới của hệ điều hành, cho phép định nghĩa trong mã nguồn và giao cho JVM thống nhất sinh ra các chỉ thị Memory Barrier nhằm hiện thực hóa chức năng rào cản bộ nhớ.

`Unsafe` cung cấp ba phương thức liên quan đến Memory Barrier dưới đây:

```java
// Memory Barrier, cấm sắp xếp lại thao tác load. Các thao tác load trước rào cản không thể bị sắp xếp lại ra sau rào cản, và các thao tác load sau rào cản không thể bị sắp xếp lại lên trước rào cản
public native void loadFence();
// Memory Barrier, cấm sắp xếp lại thao tác store. Các thao tác store trước rào cản không thể bị sắp xếp lại ra sau rào cản, và các thao tác store sau rào cản không thể bị sắp xếp lại lên trước rào cản
public native void storeFence();
// Memory Barrier, cấm sắp xếp lại các thao tác load và store
public native void fullFence();
```

Memory Barrier ràng buộc ngữ nghĩa về sắp xếp lại lệnh và tính khả kiến (`Visibility`) giữa các thao tác truy cập bộ nhớ được chỉ định, chứ không đồng nghĩa với việc "xóa sạch CPU cache" hay ép đọc lại toàn bộ dữ liệu từ bộ nhớ chính. `loadFence()` chỉ cung cấp ràng buộc thứ tự phía đọc, không thể tự mình thiết lập quan hệ `happens-before` trong Java Memory Model (JMM) cho hai lần truy cập trường dữ liệu thông thường.

Do đó, không thể dùng "trường `boolean` thông thường + `loadFence()`" để thay thế cho `volatile` nhằm đảm bảo tính khả kiến giữa các thread. Đối với các cờ trạng thái (flag) dùng chung, cần sử dụng `volatile`, khóa (lock), hoặc các cơ chế đồng bộ hóa như `VarHandle` có chế độ truy cập đọc/ghi tương ứng; nếu không, mã nguồn vẫn tồn tại tranh chấp dữ liệu (data race) và thread đọc không được đảm bảo sẽ quan sát thấy giá trị đã ghi.

#### Ứng dụng điển hình

Trong Java 8 đã giới thiệu một cơ chế khóa mới — `StampedLock`, có thể xem như một phiên bản cải tiến của khóa đọc-ghi. `StampedLock` cung cấp một cài đặt khóa đọc lạc quan; loại khóa đọc lạc quan này tương tự như thao tác không khóa (lock-free), hoàn toàn không chặn thread ghi giành khóa ghi, qua đó giảm thiểu hiện tượng "đói" (`Starvation`) của thread ghi khi số lượng thao tác đọc nhiều hơn ghi. Do khóa đọc lạc quan mà `StampedLock` cung cấp không chặn thread ghi giành khóa ghi, nên khi các biến dùng chung được nạp (`load`) từ bộ nhớ chính vào bộ nhớ làm việc của thread, có thể phát sinh vấn đề dữ liệu không nhất quán.

Để giải quyết vấn đề này, phương thức `validate` của `StampedLock` sẽ thông qua phương thức `loadFence` của `Unsafe` để chèn thêm một rào cản bộ nhớ `load`.

```java
public boolean validate(long stamp) {
   U.loadFence();
   return (stamp & SBITS) == (state & SBITS);
}
```

### Thao tác đối tượng

#### Giới thiệu

**Ví dụ**

```java
import sun.misc.Unsafe;
import java.lang.reflect.Field;

public class Main {

    private int value;

    public static void main(String[] args) throws Exception{
        Unsafe unsafe = reflectGetUnsafe();
        assert unsafe != null;
        long offset = unsafe.objectFieldOffset(Main.class.getDeclaredField("value"));
        Main main = new Main();
        System.out.println("value before putInt: " + main.value);
        unsafe.putInt(main, offset, 42);
        System.out.println("value after putInt: " + main.value);
  System.out.println("value after putInt: " + unsafe.getInt(main, offset));
    }

    private static Unsafe reflectGetUnsafe() {
        try {
            Field field = Unsafe.class.getDeclaredField("theUnsafe");
            field.setAccessible(true);
            return (Unsafe) field.get(null);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

}
```

Kết quả đầu ra:

```plain
value before putInt: 0
value after putInt: 42
value after putInt: 42
```

**Thuộc tính đối tượng**

Việc lấy độ lệch bộ nhớ (`offset`) của thuộc tính thành viên trong đối tượng và sửa đổi giá trị thuộc tính đó đã được chúng ta kiểm thử trong ví dụ trên. Ngoài các phương thức `putInt` và `getInt` vừa rồi, `Unsafe` cung cấp các phương thức `put` và `get` cho toàn bộ 8 kiểu dữ liệu nguyên thủy cũng như `Object`, hơn nữa tất cả các phương thức `put` đều có thể vượt qua quyền truy cập để sửa đổi trực tiếp dữ liệu trong bộ nhớ. Khi đọc phần chú thích trong mã nguồn OpenJDK, ta thấy việc đọc/ghi kiểu dữ liệu nguyên thủy và `Object` có đôi chút khác biệt: kiểu dữ liệu nguyên thủy thao tác trực tiếp trên giá trị thuộc tính (`value`), còn thao tác với `Object` lại dựa trên giá trị tham chiếu (`reference value`). Dưới đây là các phương thức đọc và ghi dành cho `Object`:

```java
// Lấy một tham chiếu đối tượng tại địa chỉ offset chỉ định của đối tượng
public native Object getObject(Object o, long offset);
// Ghi một tham chiếu đối tượng tại địa chỉ offset chỉ định của đối tượng
public native void putObject(Object o, long offset, Object x);
```

Ngoài việc đọc/ghi thông thường đối với thuộc tính đối tượng, `Unsafe` còn cung cấp các phương thức **đọc/ghi volatile** và **ghi có thứ tự (ordered write)**. Phạm vi bao phủ của các phương thức đọc/ghi `volatile` giống với đọc/ghi thông thường, bao gồm toàn bộ các kiểu dữ liệu nguyên thủy và kiểu `Object`. Lấy kiểu `int` làm ví dụ:

```java
// Đọc một giá trị int tại địa chỉ offset chỉ định của đối tượng, hỗ trợ ngữ nghĩa volatile load
public native int getIntVolatile(Object o, long offset);
// Ghi một giá trị int tại địa chỉ offset chỉ định của đối tượng, hỗ trợ ngữ nghĩa volatile store
public native void putIntVolatile(Object o, long offset, int x);
```

So với đọc/ghi thông thường, đọc/ghi `volatile` có chi phí cao hơn vì nó cần đảm bảo tính khả kiến (`Visibility`) và tính tuần tự (`Ordering`). Khi thực hiện thao tác `get`, nó buộc phải lấy giá trị thuộc tính từ bộ nhớ chính; khi dùng phương thức `put` để thiết lập giá trị thuộc tính, nó buộc phải cập nhật giá trị xuống bộ nhớ chính, qua đó đảm bảo những thay đổi này là khả kiến đối với các thread khác.

Các phương thức ghi có thứ tự gồm có ba phương thức sau:

```java
public native void putOrderedObject(Object o, long offset, Object x);
public native void putOrderedInt(Object o, long offset, int x);
public native void putOrderedLong(Object o, long offset, long x);
```

Chi phí của ghi có thứ tự tương đối thấp hơn so với `volatile`, vì nó chỉ đảm bảo tính tuần tự khi ghi chứ không đảm bảo tính khả kiến — tức là giá trị do một thread ghi không được đảm bảo sẽ khả kiến ngay lập tức với các thread khác. Để giải quyết sự khác biệt ở đây, ta cần bổ sung sâu hơn kiến thức về rào cản bộ nhớ (Memory Barrier); trước tiên cần hiểu khái niệm của hai loại lệnh:

- `Load`: sao chép dữ liệu từ bộ nhớ chính vào cache của bộ xử lý
- `Store`: đẩy (flush) dữ liệu từ cache của bộ xử lý xuống bộ nhớ chính

Sự khác biệt giữa ghi tuần tự (ordered write) và ghi `volatile` nằm ở chỗ: khi ghi tuần tự thì loại rào cản bộ nhớ được chèn vào là loại `StoreStore`, còn khi ghi `volatile` thì rào cản bộ nhớ được chèn vào là loại `StoreLoad`, như minh họa trong hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717144834132-34351d0d.png)

Trong phương thức ghi có thứ tự, rào cản được sử dụng là `StoreStore`; rào cản này đảm bảo `Store1` đẩy dữ liệu ra bộ nhớ ngay lập tức, thao tác này diễn ra trước `Store2` và các lệnh lưu trữ tiếp theo. Còn trong thao tác ghi `volatile`, rào cản được sử dụng là `StoreLoad`; rào cản này đảm bảo `Store1` đẩy dữ liệu ra bộ nhớ ngay lập tức trước `Load2` và các lệnh nạp tiếp theo, đồng thời rào cản `StoreLoad` khiến toàn bộ các lệnh truy cập bộ nhớ trước rào cản (bao gồm cả lệnh lưu trữ và lệnh truy cập) hoàn thành hết rồi mới thực thi các lệnh truy cập bộ nhớ sau rào cản.

Tổng kết lại, trong ba loại phương thức ghi kể trên, xét về hiệu suất ghi thì hiệu quả giảm dần theo thứ tự `put`, `putOrder`, `putVolatile`.

**Khởi tạo đối tượng**

Sử dụng phương thức `allocateInstance` của `Unsafe` cho phép chúng ta thực hiện việc khởi tạo đối tượng theo cách phi truyền thống. Trước tiên, định nghĩa một lớp thực thể và gán giá trị cho biến thành viên của nó bên trong hàm tạo:

```java
@Data
public class A {
    private int b;
    public A(){
        this.b =1;
    }
}
```

Lần lượt so sánh các cách tạo đối tượng khác nhau dựa trên hàm tạo, Reflection và phương thức của `Unsafe`:

```java
public void objTest() throws Exception{
    A a1=new A();
    System.out.println(a1.getB());
    A a2 = A.class.newInstance();
    System.out.println(a2.getB());
    A a3= (A) unsafe.allocateInstance(A.class);
    System.out.println(a3.getB());
}
```

Kết quả in ra lần lượt là 1, 1, 0, cho thấy trong quá trình tạo đối tượng thông qua phương thức `allocateInstance`, hàm tạo của lớp không được gọi. Khi tạo đối tượng bằng cách này, chỉ dùng tới đối tượng `Class`, vì vậy nếu muốn bỏ qua giai đoạn khởi tạo đối tượng hoặc vượt qua bước kiểm tra bảo mật của hàm tạo thì có thể dùng phương pháp này. Trong ví dụ trên, nếu đổi hàm tạo của lớp `A` thành kiểu `private`, sẽ không thể tạo đối tượng thông qua hàm tạo và Reflection thông thường (có thể tạo đối tượng sau khi gọi `setAccessible` trên đối tượng `Constructor`), nhưng phương thức `allocateInstance` vẫn có hiệu lực.

#### Ứng dụng điển hình

- **Cách khởi tạo đối tượng thông thường**: Các cách tạo đối tượng mà chúng ta thường sử dụng về bản chất đều dựa vào cơ chế `new` để tạo thể hiện. Tuy nhiên, cơ chế `new` có một đặc điểm là khi lớp chỉ cung cấp hàm tạo có tham số mà không khai báo tường minh hàm tạo không tham số, thì bắt buộc phải dùng hàm tạo có tham số để khởi tạo đối tượng, và khi dùng hàm tạo có tham số thì phải truyền đủ số lượng đối số tương ứng mới hoàn thành được việc khởi tạo đối tượng.
- **Cách khởi tạo phi truyền thống**: Trong khi đó, phương thức `allocateInstance` do `Unsafe` cung cấp có thể tạo ra thể hiện của lớp này chỉ thông qua đối tượng `Class`, hơn nữa không cần gọi hàm tạo, mã khởi tạo hay kiểm tra bảo mật của JVM. Nó bỏ qua việc kiểm tra từ khóa bổ nghĩa truy cập (modifier), tức là ngay cả khi hàm tạo mang từ khóa `private` thì vẫn có thể khởi tạo bằng phương thức này — chỉ cần cung cấp đối tượng `Class` là có thể tạo ra đối tượng tương ứng. Nhờ đặc tính này, `allocateInstance` đều có những ứng dụng tương ứng trong `java.lang.invoke`, Objenesis (cung cấp cơ chế sinh đối tượng bỏ qua hàm tạo của lớp) và Gson (dùng trong quá trình `Deserialization`).

### Thao tác mảng

#### Giới thiệu

Phối hợp sử dụng hai phương thức `arrayBaseOffset` và `arrayIndexScale` là có thể định vị vị trí bộ nhớ của từng phần tử trong mảng.

```java
// Trả về địa chỉ offset của phần tử đầu tiên trong mảng
public native int arrayBaseOffset(Class<?> arrayClass);
// Trả về kích thước chiếm dụng của một phần tử trong mảng
public native int arrayIndexScale(Class<?> arrayClass);
```

#### Ứng dụng điển hình

Hai phương thức liên quan đến thao tác dữ liệu này có một ứng dụng điển hình trong lớp `AtomicIntegerArray` thuộc gói `java.util.concurrent.atomic` (có thể thực hiện thao tác nguyên tử trên từng phần tử của mảng `Integer`). Như minh họa trong mã nguồn `AtomicIntegerArray` dưới đây, thông qua `arrayBaseOffset` và `arrayIndexScale` của `Unsafe` lần lượt lấy địa chỉ offset của phần tử đầu tiên `base` và hệ số kích thước một phần tử `scale`. Các thao tác nguyên tử liên quan tiếp theo đều dựa vào hai giá trị này để định vị phần tử trong mảng; như phương thức `getAndAdd` ở hình thứ hai dưới đây sẽ lấy địa chỉ offset của một phần tử mảng thông qua phương thức `checkedByteOffset`, sau đó thực hiện thao tác nguyên tử thông qua CAS.

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717144927257-59852c31.png)

### Thao tác CAS

#### Giới thiệu

Phần này chủ yếu là các phương thức liên quan đến thao tác CAS.

```java
/**
  *  CAS
  * @param o         Đối tượng chứa field cần sửa đổi
  * @param offset    Offset của field trong đối tượng
  * @param expected  Giá trị kỳ vọng
  * @param update    Giá trị cập nhật
  * @return          true | false
  */
public final native boolean compareAndSwapObject(Object o, long offset,  Object expected, Object update);

public final native boolean compareAndSwapInt(Object o, long offset, int expected,int update);

public final native boolean compareAndSwapLong(Object o, long offset, long expected, long update);
```

**CAS là gì?** CAS tức là So sánh và Hoán đổi (Compare And Swap), là một kỹ thuật thường dùng khi cài đặt các thuật toán đồng thời. Thao tác CAS gồm ba toán hạng — vị trí bộ nhớ, giá trị gốc kỳ vọng và giá trị mới. Khi thực thi thao tác CAS, nếu giá trị tại vị trí bộ nhớ giống với giá trị kỳ vọng thì cập nhật nó thành giá trị mới một cách nguyên tử, ngược lại sẽ không cập nhật. HotSpot sẽ ánh xạ các thao tác liên quan sang nguyên thủy nguyên tử do nền tảng đích cung cấp; trên kiến trúc x86 thường sử dụng `cmpxchg`, còn các kiến trúc bộ xử lý khác có thể sử dụng các chỉ thị hoặc chuỗi chỉ thị khác nhau.

#### Ứng dụng điển hình

Các thao tác CAS được sử dụng với số lượng lớn trong các công cụ đồng thời của gói JUC; như đã nhiều lần đề cập trong các bài viết trước về `synchronized` và `AQS`, CAS với vai trò là khóa lạc quan (`Optimistic Lock`) đã phát huy tác dụng rộng rãi trong các công cụ đồng thời. Trong lớp `Unsafe`, các phương thức `compareAndSwapObject`, `compareAndSwapInt`, `compareAndSwapLong` được cung cấp để thực hiện thao tác CAS cho các kiểu `Object`, `int`, `long`. Lấy phương thức `compareAndSwapInt` làm ví dụ:

```java
public final native boolean compareAndSwapInt(Object o, long offset,int expected,int x);
```

Trong tham số, `o` là đối tượng cần cập nhật, `offset` là offset của trường số nguyên trong đối tượng `o`. Nếu giá trị của trường này bằng với `expected`, nó sẽ gán giá trị mới `x` cho trường đó, và quá trình cập nhật này không thể bị ngắt quãng — tức là một thao tác nguyên tử. Dưới đây là một ví dụ sử dụng `compareAndSwapInt`:

```java
private volatile int a;
public static void main(String[] args){
    CasTest casTest=new CasTest();
    new Thread(()->{
        for (int i = 1; i < 5; i++) {
            casTest.increment(i);
            System.out.print(casTest.a+" ");
        }
    }).start();
    new Thread(()->{
        for (int i = 5 ; i <10 ; i++) {
            casTest.increment(i);
            System.out.print(casTest.a+" ");
        }
    }).start();
}

private void increment(int x){
    while (true){
        try {
            long fieldOffset = unsafe.objectFieldOffset(CasTest.class.getDeclaredField("a"));
            if (unsafe.compareAndSwapInt(this,fieldOffset,x-1,x))
                break;
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        }
    }
}
```

Chạy đoạn mã sẽ lần lượt in ra:

```plain
1 2 3 4 5 6 7 8 9
```

Nếu bạn dán đoạn mã trên vào IDE để chạy, bạn sẽ thấy không thể thu được kết quả đầu ra mục tiêu. Đã có bạn đọc chỉ ra vấn đề này trên GitHub: [issue#2650](https://github.com/Snailclimb/JavaGuide/issues/2650). Dưới đây là mã nguồn sau khi chỉnh sửa:

```java
// Đóng gói thao tác tăng giá trị và in ra vào một phương thức có tính nguyên tử mạnh hơn
private void incrementAndPrint(int targetValue) {
    while (true) {
        int currentValue = a; // Đọc giá trị hiện tại của a
        // Nếu giá trị hiện tại đã đạt hoặc vượt quá giá trị mục tiêu, nghĩa là đã được thread khác xử lý, bỏ qua
        if (currentValue >= targetValue) {
            return;
        }
        // Thử thao tác CAS: nếu giá trị hiện tại bằng targetValue - 1, gán nguyên tử thành targetValue
        if (currentValue == targetValue - 1) {
          if (unsafe.compareAndSwapInt(this, fieldOffset, currentValue, targetValue)) {
              // In ngay sau khi CAS thành công, đảm bảo giá trị in ra chính là giá trị được gán lần này
              System.out.print(targetValue + " ");
              return;
          }
        }
        // CAS thất bại, đọc lại và thử lại
    }
}
```

Trong ví dụ trên, chúng ta tạo hai thread cùng thử sửa đổi biến dùng chung `a`. Mỗi thread khi gọi phương thức `incrementAndPrint(targetValue)`:

1. Sẽ đọc giá trị hiện tại `currentValue` của `a` trước.
2. Kiểm tra xem `currentValue` có bằng `targetValue - 1` (tức giá trị trước đó theo kỳ vọng) hay không.
3. Nếu điều kiện thỏa mãn, gọi `unsafe.compareAndSwapInt()` để thử cập nhật `a` từ `currentValue` lên `targetValue`.
4. Nếu thao tác CAS thành công (trả về `true`), in ra `targetValue` và thoát khỏi vòng lặp.
5. Nếu thao tác CAS thất bại, chứng tỏ có thread khác cạnh tranh cùng lúc; lúc này sẽ đọc lại `currentValue` và thử lại cho đến khi thành công.

Cơ chế này đảm bảo mỗi con số (từ 1 đến 9) chỉ được thiết lập thành công và in ra một lần, đồng thời được thực hiện theo thứ tự.

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717144939826-ec576721.png)

Cần lưu ý rằng:

1. **Logic tự quay (Spinning):** Bản thân phương thức `compareAndSwapInt` chỉ thực hiện một lần thao tác so sánh và hoán đổi rồi trả về kết quả ngay lập tức. Do đó, để đảm bảo thao tác cuối cùng thành công (trong trường hợp giá trị phù hợp với kỳ vọng), chúng ta cần cài đặt tường minh logic spin trong mã nguồn (như vòng lặp `while(true)`), liên tục thử lại cho đến khi thao tác CAS thành công.
2. **Cách cài đặt của `AtomicInteger`:** Lớp `java.util.concurrent.atomic.AtomicInteger` trong JDK ở tầng bên trong chính là tận dụng thao tác CAS và logic spin tương tự để hiện thực hóa các phương thức nguyên tử như `getAndIncrement()`, `compareAndSet()`, v.v. Sử dụng trực tiếp `AtomicInteger` thường là cách làm an toàn hơn và được khuyến nghị hơn vì nó đóng gói sự phức tạp ở tầng dưới.
3. **Vấn đề ABA:** Bản thân thao tác CAS tồn tại vấn đề ABA (một giá trị chuyển từ A thành B rồi đổi lại thành A, khi CAS kiểm tra sẽ tưởng rằng giá trị chưa từng thay đổi). Trong một số kịch bản, nếu lịch sử biến động của giá trị là quan trọng, có thể cần dùng `AtomicStampedReference` để giải quyết. Tuy nhiên trong kịch bản tăng đơn giản của ví dụ này, vấn đề ABA thường không gây ảnh hưởng.
4. **Tiêu tốn CPU:** Việc spin trong thời gian dài sẽ tiêu tốn tài nguyên CPU. Trong trường hợp cạnh tranh gay gắt hoặc điều kiện không được thỏa mãn trong thời gian dài, có thể cân nhắc bổ sung các chiến lược lùi (backoff) phức tạp hơn (như `Thread.sleep()` hoặc `LockSupport.parkNanos()`) để tối ưu.

### Điều phối Thread

#### Giới thiệu

Hiện nay, các phương thức chính trong `Unsafe` liên quan trực tiếp đến điều phối thread là `park` và `unpark`. Các phương thức lịch sử `monitorEnter`, `monitorExit`, `tryMonitorEnter` đã bị loại bỏ trong JDK 9.

```java
// Bỏ chặn thread
public native void unpark(Object thread);
// Chặn thread
public native void park(boolean isAbsolute, long time);
```

Hai phương thức `park`, `unpark` có thể thực hiện việc tạm dừng và khôi phục hoạt động của thread. Việc đưa một thread vào trạng thái tạm dừng được thực hiện qua phương thức `park`: sau khi gọi `park`, thread sẽ bị chặn cho đến khi hết thời gian chờ (timeout) hoặc xuất hiện ngắt (interrupt) hay các điều kiện đánh thức khác; `unpark` có thể chấm dứt trạng thái tạm dừng của một thread và giúp nó khôi phục lại bình thường.

Ba phương thức liên quan đến `monitor` chỉ phù hợp khi giới thiệu các cài đặt ở phiên bản cũ; mã nguồn JDK hiện tại không thể gọi chúng nữa. Khi cần object monitor, nên sử dụng câu lệnh `synchronized` của ngôn ngữ Java hoặc các khóa và bộ đồng bộ trong `java.util.concurrent`.

#### Ứng dụng điển hình

Lớp cốt lõi của framework khóa và bộ đồng bộ trong Java là `AbstractQueuedSynchronizer` (AQS) chính là thực hiện việc chặn và đánh thức thread bằng cách gọi `LockSupport.park()` và `LockSupport.unpark()`; còn phương thức `park`, `unpark` của `LockSupport` thực tế được cài đặt thông qua việc gọi phương thức `park`, `unpark` của `Unsafe`.

```java
public static void park(Object blocker) {
    Thread t = Thread.currentThread();
    setBlocker(t, blocker);
    UNSAFE.park(false, 0L);
    setBlocker(t, null);
}
public static void unpark(Thread thread) {
    if (thread != null)
        UNSAFE.unpark(thread);
}
```

Phương thức `park` của `LockSupport` ở tầng dưới sẽ gọi phương thức `park` của `Unsafe`. `park` có thể trả về do có giấy phép khả dụng (permit), do thread khác gọi `unpark`, do thread bị ngắt hoặc trả về không có lý do; các biến thể có giới hạn thời gian cũng sẽ trả về sau khi hết thời gian chờ. Vì vậy, logic chặn phụ thuộc vào điều kiện cần kiểm tra lại điều kiện trong vòng lặp. Ví dụ dưới đây minh họa trường hợp thread khác gọi `unpark`:

```java
public static void main(String[] args) {
    Thread mainThread = Thread.currentThread();
    new Thread(()->{
        try {
            TimeUnit.SECONDS.sleep(5);
            System.out.println("subThread try to unpark mainThread");
            unsafe.unpark(mainThread);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }).start();

    System.out.println("park main mainThread");
    unsafe.park(false,0L);
    System.out.println("unpark mainThread success");
}
```

Kết quả đầu ra của chương trình là:

```plain
park main mainThread
subThread try to unpark mainThread
unpark mainThread success
```

Luồng chạy của chương trình cũng khá dễ hiểu: thread con sau khi bắt đầu chạy sẽ ngủ một lúc trước, đảm bảo thread chính có thể gọi phương thức `park` để tự chặn mình; thread con sau khi ngủ 5 giây sẽ gọi phương thức `unpark` để đánh thức thread chính, giúp thread chính có thể tiếp tục thực thi xuống dưới. Toàn bộ quy trình được minh họa như hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717144950116-7381d507.png)

### Thao tác với Class

#### Giới thiệu

Các thao tác của `Unsafe` đối với `Class` chủ yếu bao gồm các phương thức nạp lớp và thao tác biến tĩnh (static field).

**Các phương thức liên quan đến đọc thuộc tính tĩnh**

> Lưu ý phiên bản: `shouldBeInitialized` và `ensureClassInitialized` đã bị loại bỏ khỏi `sun.misc.Unsafe` trong JDK 22, giải pháp thay thế chuẩn là `MethodHandles.Lookup.ensureInitialized` được giới thiệu từ JDK 15. Đoạn mã liên quan dưới đây chỉ áp dụng cho các phiên bản JDK cũ hơn.

```java
// Lấy offset của thuộc tính tĩnh
public native long staticFieldOffset(Field f);
// Lấy con trỏ đối tượng của thuộc tính tĩnh
public native Object staticFieldBase(Field f);
// Kiểm tra xem lớp có cần khởi tạo hay không (dùng để kiểm tra trước khi lấy thuộc tính tĩnh của lớp)
public native boolean shouldBeInitialized(Class<?> c);
```

Tạo một lớp chứa thuộc tính tĩnh để tiến hành kiểm thử:

```java
@Data
public class User {
    public static String name="Hydra";
    int age;
}
private void staticTest() throws Exception {
    User user=new User();
    // Cũng có thể dùng các câu lệnh sau để kích hoạt khởi tạo lớp
    // 1.
    // unsafe.ensureClassInitialized(User.class);
    // 2.
    // System.out.println(User.name);
    System.out.println(unsafe.shouldBeInitialized(User.class));
    Field sexField = User.class.getDeclaredField("name");
    long fieldOffset = unsafe.staticFieldOffset(sexField);
    Object fieldBase = unsafe.staticFieldBase(sexField);
    Object object = unsafe.getObject(fieldBase, fieldOffset);
    System.out.println(object);
}
```

Kết quả chạy:

```plain
false
Hydra
```

Trong phần thao tác đối tượng của `Unsafe`, chúng ta đã học cách lấy offset thuộc tính đối tượng thông qua phương thức `objectFieldOffset` và truy xuất giá trị biến dựa trên nó, nhưng cách này không áp dụng cho thuộc tính tĩnh trong lớp mà khi đó cần dùng phương thức `staticFieldOffset`. Trong đoạn mã trên, chỉ trong quá trình lấy đối tượng `Field` mới phụ thuộc vào `Class`, còn khi lấy giá trị thuộc tính của biến tĩnh thì không còn phụ thuộc vào `Class` nữa.

Trong đoạn mã trên trước tiên tạo một đối tượng `User`, đó là vì nếu một lớp chưa được khởi tạo thì thuộc tính tĩnh của nó cũng sẽ chưa được khởi tạo và thuộc tính trường lấy được cuối cùng sẽ là `null`. Vì vậy trước khi lấy thuộc tính tĩnh, cần gọi phương thức `shouldBeInitialized` để kiểm tra xem trước khi lấy có cần khởi tạo lớp này hay không. Nếu xóa câu lệnh tạo đối tượng `User`, kết quả chạy sẽ trở thành:

```plain
true
null
```

**Sử dụng phương thức `defineClass` cho phép chương trình tạo động một lớp tại thời điểm runtime**

> Lưu ý phiên bản: `sun.misc.Unsafe.defineClass` đã bị loại bỏ trong JDK 11. Từ JDK 9 trở đi có thể dùng `MethodHandles.Lookup.defineClass` tùy theo yêu cầu kiểm soát quyền truy cập.

```java
public native Class<?> defineClass(String name, byte[] b, int off, int len, ClassLoader loader,ProtectionDomain protectionDomain);
```

Trong quá trình sử dụng thực tế, có thể chỉ truyền vào mảng byte, chỉ số của byte bắt đầu cũng như độ dài byte cần đọc; theo mặc định, `ClassLoader` và `ProtectionDomain` xuất phát từ thể hiện gọi phương thức này. Ví dụ dưới đây thực hiện chức năng nạp tệp `class` đã được biên dịch:

```java
private static void defineTest() {
    String fileName="F:\\workspace\\unsafe-test\\target\\classes\\com\\cn\\model\\User.class";
    File file = new File(fileName);
    try(FileInputStream fis = new FileInputStream(file)) {
        byte[] content=new byte[(int)file.length()];
        fis.read(content);
        Class clazz = unsafe.defineClass(null, content, 0, content.length, null, null);
        Object o = clazz.getDeclaredConstructor().newInstance();
        Object age = clazz.getMethod("getAge").invoke(o, null);
        System.out.println(age);
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

Trong đoạn mã lịch sử trên, trước tiên đọc một tệp `class` và chuyển nó thành mảng byte thông qua luồng tệp, sau đó dùng `defineClass` để tạo động lớp và khởi tạo thể hiện. Lớp được định nghĩa theo cách này vẫn phải trải qua bước kiểm tra định dạng tệp class, xác minh bytecode và các ràng buộc nạp lớp tương ứng của JVM, chứ không bỏ qua toàn bộ kiểm tra bảo mật.

![](/media/jg/ext/oss.javaguide.cn/java/basis/unsafe/image-20220717145000710-f8f90243.png)

Các phiên bản cũ của `Unsafe` còn từng cung cấp phương thức `defineAnonymousClass`:

```java
public native Class<?> defineAnonymousClass(Class<?> hostClass, byte[] data, Object[] cpPatches);
```

Phương thức này từng có thể dùng để tạo động lớp ẩn danh, nhưng đã bị loại bỏ trong JDK 17. `MethodHandles.Lookup.defineHiddenClass` được giới thiệu từ JDK 15 là phương án thay thế được hỗ trợ. Cách cài đặt cụ thể của Lambda thuộc chi tiết triển khai của JDK, ở phiên bản hiện tại không thể tiếp tục mô tả là phụ thuộc vào `Unsafe.defineAnonymousClass` đã bị loại bỏ.

#### Ứng dụng điển hình

Các phiên bản JDK lịch sử từng sử dụng `Unsafe.defineAnonymousClass` để hỗ trợ cài đặt một số ngôn ngữ động; các phiên bản JDK hiện tại sử dụng các cơ chế như hidden class và không còn cung cấp phương thức `Unsafe` này nữa.

### Thông tin hệ thống

#### Giới thiệu

Phần này chứa hai phương thức dùng để lấy thông tin liên quan đến hệ thống.

```java
// Trả về kích thước con trỏ của hệ thống. Giá trị trả về là 4 (hệ thống 32-bit) hoặc 8 (hệ thống 64-bit).
public native int addressSize();
// Kích thước của trang bộ nhớ, giá trị này là lũy thừa của 2.
public native int pageSize();
```

#### Ứng dụng điển hình

Kịch bản ứng dụng của hai phương thức này tương đối ít; trong lớp `java.nio.Bits`, khi sử dụng `pageCount` để tính số lượng trang bộ nhớ cần thiết, đã gọi phương thức `pageSize` để lấy kích thước của trang bộ nhớ. Ngoài ra, khi sử dụng phương thức `copySwapMemory` để sao chép bộ nhớ, đã gọi phương thức `addressSize` để phát hiện trường hợp hệ thống 32-bit.

## Tổng kết

Trong bài viết này, chúng ta đã giới thiệu các khái niệm cơ bản, nguyên lý hoạt động và một số API lịch sử của `Unsafe`. Cần lưu ý rằng `sun.misc.Unsafe` thuộc API nội bộ không được hỗ trợ chính thức, và nhiều phương thức đã bị loại bỏ ở các phiên bản JDK khác nhau. JDK 23 đã đánh dấu các phương thức truy cập bộ nhớ của nó là chờ loại bỏ, và từ JDK 24 trở đi sẽ mặc định đưa ra cảnh báo runtime ở lần gọi đầu tiên. Mã nguồn mới nên ưu tiên sử dụng các API chuẩn: truy cập trường dữ liệu và mảng trong Heap dùng `VarHandle`, truy cập bộ nhớ ngoài Heap dùng Foreign Function and Memory API (`MemorySegment`, v.v.), và đồng bộ hóa thread dùng `java.util.concurrent`.
