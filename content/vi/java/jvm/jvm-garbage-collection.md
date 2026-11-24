---
title: Giải thích chi tiết Garbage Collection trong JVM (Trọng tâm)
description: "Giải thích chi tiết Garbage Collection trong JVM: trình bày toàn diện các thuật toán GC (Mark-Sweep, Copying, Mark-Compact), cơ chế thu gom theo thế hệ, các bộ thu gom rác phổ biến (Serial, Parallel, CMS, G1, ZGC, Shenandoah) và thực hành tinh chỉnh GC."
category: Java
tag:
  - JVM
lang: vi
sourceRef: zh-ref/java/jvm/jvm-garbage-collection.md
head:
  - - meta
    - name: keywords
      content: Garbage Collection JVM,thuật toán GC,bộ thu gom rác,thu gom theo thế hệ,Mark-Sweep,thuật toán Copying,G1 GC,ZGC,Shenandoah,tinh chỉnh GC
---

> Nếu không có chú thích đặc biệt nào khác, tất cả nội dung dưới đây đều hướng đến máy ảo HotSpot.
>
> Bài viết này được tổng hợp và bổ sung dựa trên cuốn *Hiểu sâu về Java Virtual Machine: Các tính năng nâng cao và Best Practices*.
>
> Câu hỏi phỏng vấn thường gặp:
>
> - Làm thế nào để xác định một đối tượng đã chết hay chưa (hai phương pháp).
> - Giới thiệu ngắn gọn về Strong Reference, Soft Reference, Weak Reference và Phantom Reference (sự khác nhau giữa Phantom Reference với Soft Reference và Weak Reference, lợi ích khi sử dụng Soft Reference).
> - Làm thế nào để xác định một hằng số là hằng số lỗi thời (obsolete constant).
> - Làm thế nào để xác định một lớp là lớp vô dụng (useless class).
> - Có những thuật toán thu gom rác nào, đặc điểm riêng của từng loại là gì?
> - Tại sao HotSpot lại chia Heap thành Young Generation và Old Generation?
> - Các bộ thu gom rác phổ biến gồm những loại nào?
> - Giới thiệu về bộ thu gom CMS và G1.
> - Minor GC và Full GC có điểm gì khác nhau?

## Lời mở đầu

Khi cần điều tra các sự cố tràn bộ nhớ (`OOM`) khác nhau, hoặc khi Garbage Collection trở thành nút thắt cổ chai ngăn hệ thống đạt mức đồng thời cao hơn, chúng ta cần thực hiện việc giám sát và điều chỉnh cần thiết đối với các công nghệ "tự động hóa" này.

## Cấu trúc cơ bản của vùng nhớ Heap

Quản lý bộ nhớ tự động trong Java chủ yếu tập trung vào việc thu hồi bộ nhớ của đối tượng và cấp phát bộ nhớ cho đối tượng. Đồng thời, chức năng cốt lõi nhất của cơ chế quản lý bộ nhớ tự động trong Java là việc cấp phát và thu hồi đối tượng trong bộ nhớ **Heap**.

Java Heap là khu vực chính do bộ thu gom rác quản lý, do đó nó còn được gọi là **GC Heap (Garbage Collected Heap)**.

Xét từ góc độ thu gom rác, vì các bộ thu gom hiện nay về cơ bản đều sử dụng thuật toán thu gom rác theo thế hệ (generational), nên Java Heap được chia thành nhiều vùng khác nhau để chúng ta có thể lựa chọn thuật toán thu gom rác phù hợp dựa trên đặc điểm của từng vùng.

Trong HotSpot từ JDK 7 trở về trước, GC thường được giới thiệu theo ba phần dưới đây, trong đó PermGen (Permanent Generation) là phần triển khai của Method Area và không thuộc Java Heap:

1. Vùng nhớ thế hệ trẻ (Young Generation)
2. Vùng nhớ thế hệ già (Old Generation)
3. Thế hệ vĩnh viễn (Permanent Generation / PermGen)

Như minh họa trong hình dưới đây, vùng Eden và hai vùng Survivor `S0`, `S1` đều thuộc Young Generation, tầng giữa thuộc Old Generation, còn tầng dưới cùng thuộc Permanent Generation.

![Cấu trúc bộ nhớ Heap](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/hotspot-heap-structure-7a56204a.png)

**JDK 8 đã loại bỏ PermGen (thế hệ vĩnh viễn), siêu dữ liệu lớp (class metadata) được chuyển sang lưu trong Metaspace sử dụng bộ nhớ gốc (native memory).**

Để tìm hiểu chi tiết hơn về cấu trúc vùng nhớ Heap, bạn có thể xem lại bài viết [Giải thích chi tiết vùng nhớ Java](./memory-area.md).

## Nguyên tắc cấp phát và thu hồi bộ nhớ

### Đối tượng được ưu tiên cấp phát trong vùng Eden

Trong đa số trường hợp, đối tượng được cấp phát trong vùng Eden của Young Generation. Khi vùng Eden không còn đủ không gian để cấp phát, máy ảo sẽ kích hoạt một lần Minor GC. Dưới đây chúng ta hãy chạy thử nghiệm thực tế.

Mã nguồn kiểm thử:

```java
public class GCTest {
  public static void main(String[] args) {
    byte[] allocation1, allocation2;
    allocation1 = new byte[30900*1024];
  }
}
```

Chạy chương trình theo cách sau:
![](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/25178350-2ef3c14f.png)

Tham số được thêm vào: `-XX:+PrintGCDetails`
![](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/run-with-PrintGCDetails-72268fa2.png)

Kết quả thực thi (chú thích chữ màu đỏ trong ảnh minh họa chưa chính xác, phần đó phải tương ứng với PermGen của JDK 1.7):

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/28954286-ae903960.png)

Từ hình trên có thể thấy vùng nhớ Eden gần như đã được cấp phát hết (ngay cả khi chương trình không làm gì, Young Generation vẫn sử dụng hơn 2.000 KB bộ nhớ).

Giả sử chúng ta cấp phát thêm bộ nhớ cho `allocation2` thì chuyện gì sẽ xảy ra?

```java
allocation2 = new byte[900*1024];
```

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/28128785-41382a8a.png)

Khi cấp phát bộ nhớ cho `allocation2`, vùng nhớ Eden gần như đã đầy hoàn toàn.

Khi vùng Eden không đủ không gian cấp phát, máy ảo sẽ khởi phát một lần Minor GC. Trong quá trình GC, máy ảo lại phát hiện `allocation1` không thể chứa vừa trong không gian Survivor, nên đành phải thông qua **cơ chế bảo đảm cấp phát không gian (Space Allocation Guarantee)** chuyển sớm đối tượng ở Young Generation sang Old Generation. Do không gian trên Old Generation đủ để chứa `allocation1`, nên sẽ không xảy ra Full GC. Sau khi thực hiện Minor GC, các đối tượng được cấp phát về sau nếu vẫn đặt vừa trong vùng Eden thì vẫn sẽ được cấp phát bộ nhớ tại vùng Eden. Có thể chạy đoạn mã sau để kiểm chứng:

```java
public class GCTest {

  public static void main(String[] args) {
    byte[] allocation1, allocation2,allocation3,allocation4,allocation5;
    allocation1 = new byte[32000*1024];
    allocation2 = new byte[1000*1024];
    allocation3 = new byte[1000*1024];
    allocation4 = new byte[1000*1024];
    allocation5 = new byte[1000*1024];
  }
}

```

### Đối tượng lớn đi thẳng vào Old Generation

Đối tượng lớn là những đối tượng cần một vùng nhớ liên tục có kích thước lớn (ví dụ: chuỗi dài, mảng lớn).

Hành vi đưa đối tượng lớn đi thẳng vào Old Generation được máy ảo quyết định linh hoạt tại thời điểm chạy, phụ thuộc vào bộ thu gom rác cụ thể đang dùng và các tham số liên quan. Đưa đối tượng lớn vào thẳng Old Generation là một chiến lược tối ưu nhằm tránh đặt đối tượng lớn vào Young Generation, qua đó giảm tần suất và chi phí thu gom rác ở Young Generation.

- Bộ thu gom rác G1 coi những đối tượng có kích thước đạt từ một nửa Region trở lên là Humongous Object, và cấp phát trực tiếp vào các Humongous Region liên tiếp thuộc Old Generation. Kích thước Region có thể thiết lập qua `-XX:G1HeapRegionSize`.
- Các bộ thu gom khác có cấp phát trực tiếp đối tượng lớn vào Old Generation hay không và trong điều kiện nào thì phụ thuộc vào từng bộ thu gom cụ thể và phiên bản JDK, không thể khái quát bằng một ngưỡng chung duy nhất.

### Đối tượng sống lâu sẽ đi vào Old Generation

Vì máy ảo áp dụng tư tưởng thu gom theo thế hệ để quản lý bộ nhớ, nên khi thu hồi bộ nhớ phải nhận biết được đối tượng nào nên nằm ở Young Generation và đối tượng nào nên nằm ở Old Generation. Để làm được điều này, máy ảo gán cho mỗi đối tượng một bộ đếm tuổi đối tượng (Age).

Trong phần lớn trường hợp, đối tượng trước tiên đều được cấp phát ở vùng Eden. Nếu đối tượng sinh ra ở Eden và vẫn còn sống sau lần Minor GC đầu tiên, đồng thời không gian Survivor có thể chứa được, nó sẽ được di chuyển vào không gian Survivor (`S0` hoặc `S1`) và tuổi của đối tượng được đặt thành 1 (sau khi đi từ Eden -> Survivor, tuổi ban đầu của đối tượng trở thành 1).

Mỗi lần đối tượng sống sót qua một lần Minor GC trong Survivor, tuổi của nó lại tăng thêm 1; khi tuổi đạt đến ngưỡng thăng cấp (promotion threshold), nó sẽ được thăng cấp lên Old Generation. Tham số `-XX:MaxTenuringThreshold` dùng để thiết lập ngưỡng tuổi thăng cấp tối đa cho đối tượng, giá trị mặc định phụ thuộc vào bộ thu gom rác. Chẳng hạn, trong JDK 8, giá trị mặc định của Parallel GC là 15, của CMS là 6; ngưỡng thăng cấp thực tế còn có thể được JVM điều chỉnh động.

> Đính chính ([issue552](https://github.com/Snailclimb/JavaGuide/issues/552)): "Khi HotSpot duyệt qua tất cả các đối tượng, nó cộng dồn kích thước mà các đối tượng chiếm dụng theo thứ tự tuổi từ nhỏ đến lớn. Khi tổng kích thước cộng dồn đến một mức tuổi nào đó vượt quá 50% vùng Survivor (mặc định là 50%, có thể thiết lập qua `-XX:TargetSurvivorRatio=percent`, xem [issue1199](https://github.com/Snailclimb/JavaGuide/issues/1199)), máy ảo sẽ lấy giá trị nhỏ hơn giữa độ tuổi này và `MaxTenuringThreshold` làm ngưỡng tuổi thăng cấp mới."
>
> Trích dẫn tài liệu chính thức JDK 8: <https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html>.
>
> ![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210523201742303-085e10c9.png)
>
> **Mã nguồn tính tuổi động như sau:**
>
> ```c++
> uint ageTable::compute_tenuring_threshold(size_t survivor_capacity) {
> // survivor_capacity là kích thước của không gian survivor
> size_t desired_survivor_size = (size_t)((((double)survivor_capacity)*TargetSurvivorRatio)/100);
> size_t total = 0;
> uint age = 1;
> while (age < table_size) {
> // Mảng sizes lưu tổng kích thước đối tượng ở mỗi độ tuổi
> total += sizes[age];
> if (total > desired_survivor_size) {
> break;
> }
> age++;
> }
> uint result = age < MaxTenuringThreshold ? age : MaxTenuringThreshold;
> ...
> }
>
> ```
>
> Giải thích bổ sung ([issue672](https://github.com/Snailclimb/JavaGuide/issues/672)): **Nguồn gốc của nhận định ngưỡng tuổi thăng cấp mặc định là 15 phần lớn đến từ cuốn *Hiểu sâu về Java Virtual Machine*.**
> Nếu bạn đọc [các tham số máy ảo liên quan](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html) trên trang chính thức của Oracle, bạn sẽ thấy ở phần `-XX:MaxTenuringThreshold=threshold` có ghi chú:
>
> **"Sets the maximum tenuring threshold for use in adaptive GC sizing. The largest value is 15. The default value is 15 for the parallel (throughput) collector, and 6 for the CMS collector." Ngưỡng tuổi thăng cấp mặc định không phải lúc nào cũng là 15 mà cần phân biệt theo bộ thu gom rác; với CMS giá trị này là 6.**

### Các vùng diễn ra GC chủ yếu

Ông Chu Chí Minh (Zhou Zhiming) trong cuốn *Hiểu sâu về Java Virtual Machine* ấn bản lần 2, trang 92 đã viết như sau:

> ~~_"Old Generation GC (Major GC/Full GC) chỉ GC diễn ra ở Old Generation..."_~~

Cách diễn đạt trên đã được sửa lại trong *Hiểu sâu về Java Virtual Machine* ấn bản lần 3. Cảm ơn phần giải đáp của RednaxelaFX (R):

![Giải đáp của RednaxelaFX (R)](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/rf-hotspot-vm-gc-62b1d756.png)

**Tổng kết:**

Đối với bản cài đặt HotSpot VM, GC bên trong nó thực chất chỉ được phân loại chính xác thành hai nhóm lớn:

Thu gom từng phần (Partial GC):

- Thu gom thế hệ trẻ (Minor GC / Young GC): chỉ thu gom rác ở Young Generation;
- Thu gom thế hệ già (Major GC / Old GC): chỉ thu gom rác ở Old Generation. Cần lưu ý rằng Major GC trong một số ngữ cảnh cũng được dùng để chỉ thu gom toàn bộ Heap;
- Thu gom hỗn hợp (Mixed GC): thu gom rác trên toàn bộ Young Generation và một phần Old Generation.

Thu gom toàn Heap (Full GC): thu gom toàn bộ Java Heap; việc có đồng thời thu hồi siêu dữ liệu lớp (class metadata) trong Method Area hay không phụ thuộc vào bộ thu gom, phiên bản JDK và điều kiện dỡ bỏ lớp (class unloading).

### Bảo đảm cấp phát không gian (Space Allocation Guarantee)

Space Allocation Guarantee nhằm bảo đảm rằng trước khi Minor GC diễn ra, bản thân Old Generation vẫn còn đủ không gian trống để chứa toàn bộ đối tượng của Young Generation.

Chương 3 của cuốn *Hiểu sâu về Java Virtual Machine* mô tả về Space Allocation Guarantee như sau:

> Trước JDK 6 Update 24, trước khi xảy ra Minor GC, máy ảo bắt buộc phải kiểm tra trước xem không gian liên tục khả dụng lớn nhất trong Old Generation có lớn hơn tổng dung lượng của toàn bộ đối tượng trong Young Generation hay không; nếu điều kiện này thỏa mãn, lần Minor GC đó được bảo đảm là an toàn. Nếu không thỏa mãn, máy ảo sẽ kiểm tra giá trị thiết lập của tham số `-XX:HandlePromotionFailure` xem có cho phép thất bại bảo đảm (Handle Promotion Failure) hay không; nếu cho phép, nó sẽ tiếp tục kiểm tra xem không gian liên tục khả dụng lớn nhất trong Old Generation có lớn hơn kích thước trung bình của các đối tượng đã từng thăng cấp lên Old Generation trong các lần trước hay không; nếu lớn hơn, máy ảo sẽ thử thực hiện một lần Minor GC dù lần Minor GC này tiềm ẩn rủi ro; nếu nhỏ hơn, hoặc `-XX:HandlePromotionFailure` không cho phép mạo hiểm, khi đó phải chuyển sang thực hiện một lần Full GC.
>
> Từ JDK 6 Update 24 trở đi, quy tắc đổi thành chỉ cần không gian liên tục của Old Generation lớn hơn tổng kích thước đối tượng Young Generation hoặc lớn hơn kích thước trung bình của các lần thăng cấp trước đó thì sẽ thực hiện Minor GC, ngược lại sẽ thực hiện Full GC.

## Phương pháp xác định đối tượng đã chết

Gần như toàn bộ instance của đối tượng đều nằm trong Heap. Bước đầu tiên trước khi thu gom rác trên Heap là phải xác định xem những đối tượng nào đã chết (tức là đối tượng không thể được sử dụng lại bằng bất kỳ con đường nào nữa).

### Phương pháp đếm tham chiếu (Reference Counting)

Gắn thêm một bộ đếm tham chiếu (reference counter) cho đối tượng:

- Mỗi khi có một nơi tham chiếu tới nó, bộ đếm tăng thêm 1;
- Khi tham chiếu hết hiệu lực, bộ đếm giảm đi 1;
- Bất kỳ lúc nào đối tượng có bộ đếm bằng 0 đều là đối tượng không còn khả năng được sử dụng nữa.

**Phương pháp này dễ cài đặt, nhưng các máy ảo Java phổ biến hiện nay không lựa chọn thuật toán này để quản lý vòng đời đối tượng; một trong những nguyên nhân quan trọng là nó không thể tự giải quyết vấn đề tham chiếu vòng (circular reference) giữa các đối tượng.**

![Tham chiếu vòng giữa các đối tượng](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/object-circular-reference-c35aadba.png)

Vấn đề tham chiếu qua lại giữa các đối tượng thể hiện trong đoạn mã dưới đây: ngoài việc hai đối tượng `objA` và `objB` tham chiếu lẫn nhau, không còn bất kỳ tham chiếu nào khác trỏ tới hai đối tượng này. Nhưng vì chúng tham chiếu lẫn nhau nên bộ đếm tham chiếu của cả hai đều khác 0, khiến thuật toán Đếm tham chiếu không thể thông báo cho bộ thu gom GC thu hồi chúng.

```java
public class ReferenceCountingGc {
    Object instance = null;
    public static void main(String[] args) {
        ReferenceCountingGc objA = new ReferenceCountingGc();
        ReferenceCountingGc objB = new ReferenceCountingGc();
        objA.instance = objB;
        objB.instance = objA;
        objA = null;
        objB = null;
    }
}
```

### Thuật toán phân tích khả năng tiếp cận (Reachability Analysis)

Ý tưởng cơ bản của thuật toán này là dùng một tập hợp các đối tượng được gọi là **"GC Roots"** làm điểm xuất phát, từ các nút này tìm kiếm đi xuống; đường đi qua các tham chiếu gọi là chuỗi tham chiếu (Reference Chain). Khi một đối tượng không có bất kỳ Reference Chain nào nối tới GC Roots, điều đó chứng minh đối tượng này không còn khả dụng và cần bị thu hồi.

Trong hình dưới đây, dù giữa `Object 6 ~ Object 10` có quan hệ tham chiếu với nhau, nhưng chúng không thể tiếp cận từ GC Roots, vì vậy chúng là những đối tượng cần được thu hồi.

![Thuật toán phân tích khả năng tiếp cận](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/jvm-gc-roots-bf900163.png)

**Những đối tượng nào có thể làm GC Roots?**

- Đối tượng được tham chiếu trong JVM Stack (bảng biến cục bộ bên trong stack frame)
- Đối tượng được tham chiếu trong Native Method Stack (phương thức Native)
- Đối tượng được tham chiếu bởi thuộc tính tĩnh (`static`) của lớp trong Method Area
- Đối tượng được tham chiếu bởi hằng số trong Method Area
- Tất cả đối tượng đang bị giữ bởi khóa đồng bộ (synchronization lock)
- Đối tượng được tham chiếu bởi JNI (Java Native Interface)

**Một đối tượng có thể bị thu hồi có đồng nghĩa với việc nó chắc chắn sẽ bị thu hồi không?**

Đối với đối tượng có ghi đè (`Override`) phương thức `finalize()` và phương thức này chưa từng được thực thi, sau khi HotSpot xác nhận đối tượng không thể tiếp cận, nó có thể đưa tham chiếu kết thúc (finalizer reference) tương ứng vào hàng đợi chờ xử lý để Finalizer Thread xử lý bất đồng bộ. Nếu đối tượng thiết lập lại được liên kết với một đối tượng trên chuỗi tham chiếu bên trong phương thức `finalize()`, nó có thể tạm thời thoát khỏi việc bị thu hồi; nếu không, đợt Garbage Collection tiếp theo sẽ xác nhận lại trạng thái có thể thu hồi của nó. Quá trình này thường được khái quát là "hai lần đánh dấu" (two-phase marking), nhưng điều đó không có nghĩa là bộ thu gom rác sẽ chờ đồng bộ cho `finalize()` chạy xong, và cũng không bảo đảm phương thức này chắc chắn sẽ được gọi.

> Phương thức `finalize` trong lớp `Object` từ lâu đã bị xem là một thiết kế tồi, trở thành gánh nặng cho ngôn ngữ Java, ảnh hưởng đến tính an toàn của Java và hiệu năng của GC. `Object.finalize()` đã bị đánh dấu lỗi thời (deprecated) từ JDK 9, và JEP 421 trong JDK 18 tiếp tục đánh dấu cơ chế finalization để loại bỏ trong tương lai. Mã nguồn mới không nên phụ thuộc vào nó.
>
> Tham khảo:
>
> - [JEP 421: Deprecate Finalization for Removal](https://openjdk.java.net/jeps/421)
> - [Đã đến lúc quên đi phương thức finalize](https://mp.weixin.qq.com/s/LW-paZAMD08DP_3-XCUxmg)

### Tổng kết các loại tham chiếu

Dù dùng phương pháp Đếm tham chiếu để kiểm tra số lượng tham chiếu của đối tượng hay dùng Phân tích khả năng tiếp cận (Reachability Analysis) để kiểm tra chuỗi tham chiếu có tiếp cận được hay không, việc phán đoán sự tồn tại của đối tượng đều gắn liền với "tham chiếu" (reference).

Trước JDK 1.2, định nghĩa tham chiếu trong Java rất truyền thống: nếu giá trị lưu trong dữ liệu kiểu `reference` biểu diễn địa chỉ bắt đầu của một vùng nhớ khác, thì vùng nhớ đó được gọi là biểu diễn một tham chiếu.

Từ JDK 1.2 trở đi, Java đã mở rộng khái niệm tham chiếu, chia tham chiếu thành bốn loại: Strong Reference (tham chiếu mạnh), Soft Reference (tham chiếu mềm), Weak Reference (tham chiếu yếu) và Phantom Reference (tham chiếu ảo), với mức độ mạnh giảm dần. Strong Reference chính là phép gán tham chiếu thông thường phổ biến khắp nơi trong mã chương trình; còn Soft Reference, Weak Reference và Phantom Reference tương ứng với các lớp được định nghĩa trong JDK là `SoftReference`, `WeakReference` và `PhantomReference`.

![Tổng kết các loại tham chiếu trong Java](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/java-reference-type-67e6062d.png)

**1. Strong Reference (`StrongReference`)**

Strong Reference thực chất chính là phép gán tham chiếu phổ biến xuất hiện khắp nơi trong mã chương trình. Đây là loại tham chiếu được dùng rộng rãi nhất, như đoạn mã sau:

```java
String strongReference = new String("abc");
```

Nếu một đối tượng vẫn có thể truy cập thông qua Strong Reference, nó giống như **vật dụng sinh hoạt thiết yếu**—bộ thu gom rác sẽ không thu hồi nó. Khi không gian bộ nhớ không đủ, Java Virtual Machine thà ném ra lỗi `OutOfMemoryError` làm chương trình kết thúc bất thường, chứ không tự ý thu hồi các đối tượng có thể tiếp cận mạnh (strongly reachable) để giải quyết tình trạng thiếu bộ nhớ.

**2. Soft Reference (`SoftReference`)**

Nếu một đối tượng chỉ có Soft Reference, nó giống như **vật dụng có cũng được, không có cũng không sao**. Mã ví dụ Soft Reference như sau:

```java
// --- Ví dụ 1 ---
String str = new String("abc");
SoftReference<String> softReference1 = new SoftReference<>(str);
str = null; // Gỡ bỏ Strong Reference

// --- Ví dụ 2 ---
SoftReference<String> softReference2 = new SoftReference<>(new String("def")); // Đối tượng ẩn danh
```

Đối tượng chỉ có Soft Reference có thể bị thu hồi khi áp lực bộ nhớ lớn, nhưng JVM không bảo đảm chỉ dọn dẹp khi thiếu bộ nhớ. Bảo đảm mạnh mẽ duy nhất là: trước khi ném ra `OutOfMemoryError`, toàn bộ đối tượng chỉ có thể tiếp cận qua Soft Reference chắc chắn sẽ bị dọn sạch. Chừng nào bộ thu gom rác chưa thu hồi nó, chương trình vẫn có thể sử dụng đối tượng đó. Soft Reference có thể dùng để triển khai bộ nhớ đệm nhạy cảm với bộ nhớ (memory-sensitive cache).

Soft Reference có thể kết hợp sử dụng cùng hàng đợi tham chiếu (`ReferenceQueue`). Sau khi dọn dẹp Soft Reference, bộ thu gom rác sẽ ngay lúc đó hoặc sau đó một chút đưa những Soft Reference đã đăng ký với hàng đợi vào `ReferenceQueue` tương ứng. Việc tham chiếu được đưa vào hàng đợi biểu thị rằng bộ thu gom rác đã phát hiện sự thay đổi khả năng tiếp cận tương ứng, chứ không dùng để chứng minh vùng nhớ mà đối tượng chiếm dụng đã được giải phóng vật lý xong.

**3. Weak Reference (`WeakReference`)**

Nếu một đối tượng chỉ có Weak Reference, nó cũng giống như **vật dụng có cũng được, không có cũng không sao**. Mã ví dụ Weak Reference như sau:

```java
// --- Ví dụ 1 ---
String str = new String("abc");
WeakReference<String> weakReference1 = new WeakReference<>(str);
str = null; // Gỡ bỏ Strong Reference

// --- Ví dụ 2 ---
WeakReference<String> weakReference2 = new WeakReference<>(new String("abc")); // Đối tượng ẩn danh
```

Điểm khác nhau giữa Weak Reference và Soft Reference nằm ở chỗ: đối tượng chỉ có Weak Reference sở hữu vòng đời ngắn ngủi hơn. Khi bộ thu gom rác xác định một đối tượng chỉ có thể tiếp cận yếu (weakly reachable), nó sẽ xóa các Weak Reference trỏ tới đối tượng đó một cách nguyên tử (atomic). Tuy nhiên, thao tác xóa chỉ thực hiện khi Garbage Collection diễn ra, nên không bảo đảm đối tượng vừa trở thành weakly reachable sẽ bị thu hồi ngay lập tức.

Weak Reference có thể kết hợp sử dụng cùng `ReferenceQueue`. Sau khi dọn dẹp Weak Reference, bộ thu gom rác sẽ ngay lúc đó hoặc sau đó một chút đưa những Weak Reference đã đăng ký vào hàng đợi tương ứng.

**4. Phantom Reference (`PhantomReference`)**

"Phantom Reference" (tham chiếu ảo) đúng như tên gọi—có cũng như không; khác với các loại tham chiếu còn lại, Phantom Reference không ngăn cản bộ thu gom rác thu hồi đối tượng mà nó trỏ tới. Mã ví dụ Phantom Reference như sau:

```java
// --- Ví dụ 1 ---
String str = new String("abc");
ReferenceQueue queue = new ReferenceQueue();
// Tạo PhantomReference, bắt buộc phải gắn với một ReferenceQueue
PhantomReference phantomReference1 = new PhantomReference(str, queue);
str = null; // Gỡ bỏ Strong Reference

// --- Ví dụ 2 ---
PhantomReference phantomReference2 = new PhantomReference(new String("abc"), queue); // Đối tượng ẩn danh
```

**Phantom Reference chủ yếu được dùng để nhận thông báo khi khả năng tiếp cận của đối tượng thay đổi, và phối hợp với `ReferenceQueue` để sắp xếp công việc dọn dẹp.**

**Một điểm khác biệt giữa Phantom Reference với Soft Reference và Weak Reference là:** Phantom Reference luôn được dùng kết hợp với `ReferenceQueue`. Sau khi bộ thu gom rác xác định đối tượng bước vào trạng thái chỉ tiếp cận ảo (phantom-reachable), nó sẽ xóa Phantom Reference liên quan và ngay lúc đó hoặc sau đó đưa Phantom Reference đã đăng ký với hàng đợi vào `ReferenceQueue`. Phương thức `PhantomReference.get()` luôn trả về `null`, chương trình không thể lấy lại đối tượng thông qua Phantom Reference; nó chủ yếu dùng để lên lịch dọn dẹp sau khi đối tượng không còn khả năng được truy cập nữa.

Đặc biệt lưu ý rằng dù Soft Reference chủ yếu dùng để triển khai cache nhạy cảm với bộ nhớ, nhưng nó không thể bảo đảm ứng dụng sẽ không xảy ra `OutOfMemoryError`; tràn bộ nhớ còn có thể phát sinh do cạn kiệt tài nguyên bên ngoài Heap.

### Làm thế nào để xác định một hằng số là hằng số lỗi thời?

String Constant Pool chủ yếu thu hồi các hằng số lỗi thời (obsolete constants). Vậy làm thế nào để chúng ta xác định một hằng số là hằng số lỗi thời?

~~**Từ JDK 1.7 trở đi, JVM đã chuyển Runtime Constant Pool ra khỏi Method Area và cấp phát một vùng bên trong Java Heap để lưu Runtime Constant Pool.**~~

> **🐛 Đính chính (xem: [issue747](https://github.com/Snailclimb/JavaGuide/issues/747), [tài liệu tham khảo](https://blog.csdn.net/q5706503/article/details/84640762))**:
>
> 1. **Trước JDK 1.7, Runtime Constant Pool về mặt logic bao gồm cả String Constant Pool và được đặt trong Method Area; lúc này máy ảo HotSpot triển khai Method Area bằng PermGen.**
> 2. **Ở JDK 1.7, String Constant Pool được tách ra khỏi Method Area đưa vào Heap; ở đây không hề nói đến Runtime Constant Pool, tức là chỉ riêng String Constant Pool được đưa vào Heap, phần còn lại của Runtime Constant Pool vẫn nằm ở Method Area (tức PermGen trong HotSpot).**
> 3. **Ở JDK 1.8, HotSpot loại bỏ PermGen và thay thế bằng Metaspace; lúc này String Constant Pool vẫn ở trong Heap, còn Runtime Constant Pool vẫn nằm ở Method Area, chỉ khác là phần triển khai của Method Area đổi từ PermGen sang Metaspace.**

Giả sử trong String Constant Pool đang tồn tại chuỗi `"abc"`. Nếu hiện tại không có bất kỳ đối tượng `String` nào tham chiếu tới hằng chuỗi này, thì điều đó cho thấy hằng số `"abc"` chính là hằng số lỗi thời; nếu lúc này xảy ra thu hồi bộ nhớ và xét thấy cần thiết, `"abc"` sẽ bị hệ thống dọn ra khỏi constant pool.

### Làm thế nào để xác định một lớp là lớp vô dụng?

Method Area chủ yếu thu hồi các lớp vô dụng (useless classes). Vậy làm thế nào để chúng ta xác định một lớp là lớp vô dụng?

Việc xác định một hằng số có phải "hằng số lỗi thời" hay không tương đối đơn giản, còn điều kiện để xác định một lớp có phải "lớp vô dụng" hay không thì khắt khe hơn nhiều. Một lớp cần thỏa mãn đồng thời cả 3 điều kiện dưới đây mới có thể được coi là **"lớp vô dụng"**:

- Tất cả các instance của lớp đó đều đã bị thu hồi, tức là không tồn tại bất kỳ instance nào của lớp đó trong Java Heap.
- `ClassLoader` đã nạp lớp đó cũng đã bị thu hồi.
- Đối tượng `java.lang.Class` tương ứng với lớp đó không còn bị tham chiếu ở bất kỳ nơi nào, và không thể truy cập phương thức của lớp đó thông qua Reflection ở bất kỳ đâu.

> Trong kịch bản JNI cần đặc biệt cẩn trọng với điều kiện thứ 3: tham chiếu toàn cục `jclass` được tạo thông qua `NewGlobalRef` cũng sẽ ngăn cản lớp bị dỡ bỏ (unload). Một cái bẫy phổ biến là tầng JNI cache kết quả Reflection: `jmethodID`/`jfieldID` chỉ được bảo đảm còn hiệu lực khi lớp vẫn ở trạng thái đã nạp, do đó các chương trình chạy dài hạn thường tạo global reference cho `jclass` để giữ sống lớp. Điều này cũng đồng nghĩa rằng chừng nào global reference đó chưa được giải phóng, lớp tương ứng sẽ vĩnh viễn không thể bị unload (xem [issue#2908](https://github.com/Snailclimb/JavaGuide/issues/2908)).

Máy ảo *có thể* tiến hành thu hồi đối với lớp vô dụng thỏa mãn 3 điều kiện trên—chữ "có thể" ở đây chỉ là khả năng cho phép, chứ không giống như đối tượng hễ không dùng nữa là chắc chắn sẽ bị thu hồi.

## Các thuật toán thu gom rác

### Thuật toán Mark-and-Sweep (Đánh dấu - Quét dọn)

Thuật toán Mark-and-Sweep được chia thành hai giai đoạn: "Đánh dấu" (Mark) và "Quét dọn" (Sweep): đầu tiên đánh dấu tất cả các đối tượng không cần thu hồi, sau khi đánh dấu hoàn tất sẽ thu hồi đồng loạt toàn bộ các đối tượng không được đánh dấu.

Đây là thuật toán thu gom cơ bản nhất, các thuật toán về sau đều được cải tiến từ những nhược điểm của nó. Thuật toán thu gom rác này mang lại hai vấn đề rõ rệt:

1. **Vấn đề hiệu suất**: Cả hai quá trình đánh dấu và quét dọn đều có hiệu suất không cao.
2. **Vấn đề không gian**: Sau khi Mark-and-Sweep, sẽ sinh ra rất nhiều phân mảnh bộ nhớ không liên tục (memory fragmentation).

![Thuật toán Mark-and-Sweep](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/mark-and-sweep-garbage-collection-algorithm-d9b7977d.png)

Xung quanh việc cụ thể là đánh dấu đối tượng có thể thu hồi (không tiếp cận được) hay đánh dấu đối tượng không thu hồi (tiếp cận được) có nhiều cách nói khác nhau; cả hai cách hiểu thực ra đều ổn, cá nhân tôi nghiêng về cách sau hơn.

Nếu hiểu theo cách đầu thì toàn bộ quá trình Mark-and-Sweep đại khái diễn ra như sau:

1. Khi một đối tượng được tạo ra, gán cho nó một bit đánh dấu, giả sử là `0` (`false`);
2. Ở giai đoạn đánh dấu, đặt bit đánh dấu của tất cả đối tượng có thể tiếp cận (hoặc đối tượng người dùng có thể tham chiếu tới) thành `1` (`true`);
3. Giai đoạn quét dọn sẽ dọn sạch những đối tượng có bit đánh dấu là `0` (`false`).

### Thuật toán Copying (Sao chép)

Để giải quyết vấn đề hiệu suất và phân mảnh bộ nhớ của thuật toán Mark-and-Sweep, thuật toán thu gom Copying đã ra đời. Nó có thể chia bộ nhớ thành hai khối có kích thước bằng nhau và mỗi lần chỉ sử dụng một khối. Khi bộ nhớ của khối này dùng hết, các đối tượng vẫn còn sống sẽ được sao chép sang khối còn lại, sau đó dọn sạch toàn bộ không gian đã dùng trong một lần. Nhờ vậy, mỗi lần thu hồi bộ nhớ đều chỉ thực hiện trên một nửa vùng nhớ.

![Thuật toán Copying](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/copying-garbage-collection-algorithm-76d3bcef.png)

Dù đã cải thiện so với thuật toán Mark-and-Sweep, nó vẫn tồn tại những nhược điểm sau:

- **Bộ nhớ khả dụng bị thu hẹp**: Bộ nhớ khả dụng giảm đi một nửa.
- **Không phù hợp với Old Generation**: Nếu số lượng đối tượng còn sống tương đối lớn, hiệu năng sao chép sẽ trở nên rất kém.

### Thuật toán Mark-and-Compact (Đánh dấu - Dồn nén)

Thuật toán Mark-and-Compact là thuật toán đánh dấu được đề xuất dựa trên đặc điểm của Old Generation. Quá trình đánh dấu vẫn giống như thuật toán "Mark-and-Sweep", nhưng bước tiếp theo không trực tiếp thu hồi các đối tượng có thể thu hồi, mà dồn tất cả các đối tượng còn sống về một đầu, sau đó xóa trực tiếp phần bộ nhớ nằm ngoài ranh giới đầu đó.

![Thuật toán Mark-and-Compact](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/mark-and-compact-garbage-collection-algorithm-09426872.png)

Vì có thêm bước dồn nén (compact) này nên hiệu suất của nó cũng không cao, phù hợp với những kịch bản như Old Generation nơi tần suất thu gom rác không quá cao.

### Thuật toán thu gom theo thế hệ (Generational Collection)

Các bộ thu gom rác theo thế hệ kinh điển sẽ chia bộ nhớ thành nhiều khối dựa trên vòng đời khác nhau của đối tượng. Thông thường Java Heap được chia thành Young Generation và Old Generation, nhờ đó có thể chọn thuật toán thu gom rác thích hợp theo đặc điểm của từng thế hệ. Cần lưu ý rằng bộ thu gom rác không phải lúc nào cũng sử dụng thiết kế phân thế hệ, chẳng hạn ZGC đời đầu là bộ thu gom không phân thế hệ (non-generational).

Ví dụ, trong Young Generation, mỗi lần thu gom đều có rất nhiều đối tượng chết đi, nên có thể chọn thuật toán "Copying", chỉ cần bỏ ra chi phí sao chép một lượng ít đối tượng còn sống là hoàn thành mỗi lần thu gom rác. Trong khi đó, tỷ lệ sống sót của đối tượng ở Old Generation tương đối cao và không có không gian bổ sung để bảo đảm cấp phát cho nó, nên chúng ta bắt buộc phải chọn thuật toán "Mark-and-Sweep" hoặc "Mark-and-Compact" để thu gom rác.

**Câu hỏi phỏng vấn mở rộng:** Tại sao HotSpot lại chia thành Young Generation và Old Generation?

Hãy trả lời dựa trên phần giới thiệu về thuật toán thu gom theo thế hệ ở trên.

## Các bộ thu gom rác (Garbage Collectors)

**Nếu thuật toán thu gom là phương pháp luận của việc thu hồi bộ nhớ, thì bộ thu gom rác (Garbage Collector) chính là bản triển khai cụ thể của việc thu hồi bộ nhớ.**

Mặc dù chúng ta so sánh các bộ thu gom với nhau, nhưng không nhằm chọn ra một bộ thu gom tốt nhất. Bởi vì cho đến nay vẫn chưa có bộ thu gom rác tốt nhất nào xuất hiện, càng không có bộ thu gom rác vạn năng; **điều chúng ta có thể làm là lựa chọn bộ thu gom rác phù hợp với mình dựa trên kịch bản ứng dụng cụ thể**. Thử nghĩ xem: nếu tồn tại một bộ thu gom hoàn hảo áp dụng được cho mọi kịch bản trên đời, thì máy ảo HotSpot đã không triển khai nhiều bộ thu gom rác khác nhau đến vậy.

Các bộ thu gom rác mặc định của Oracle/OpenJDK HotSpot trong môi trường Server VM điển hình (lựa chọn thực tế còn chịu ảnh hưởng của nền tảng và môi trường chạy, có thể kiểm tra bằng lệnh `java -XX:+PrintCommandLineFlags -version`):

- JDK 8: Parallel Scavenge (Young Generation) + Parallel Old (Old Generation)
- JDK 9 trở lên: G1

### Bộ thu gom Serial

Bộ thu gom Serial (tuần tự) là bộ thu gom rác cơ bản nhất và lâu đời nhất. Nhìn tên gọi là bạn đã biết đây là một bộ thu gom đơn luồng (single-threaded). Ý nghĩa **"đơn luồng"** của nó không chỉ có nghĩa là nó chỉ sử dụng một Thread thu gom rác để hoàn tất công việc thu gom, mà quan trọng hơn là khi tiến hành thu gom rác, nó bắt buộc phải tạm dừng tất cả các worker thread khác (**"Stop The World"**) cho đến khi thu gom kết thúc.

**Young Generation dùng thuật toán Mark-Copying, Old Generation dùng thuật toán Mark-Compact.**

![Bộ thu gom Serial](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/serial-garbage-collector-0d0ad081.png)

Các nhà thiết kế máy ảo tất nhiên hiểu rõ trải nghiệm người dùng kém mà Stop The World gây ra, nên trong các thiết kế bộ thu gom rác về sau, thời gian tạm dừng không ngừng được rút ngắn lại (vẫn còn tạm dừng, quá trình tìm kiếm bộ thu gom rác ưu tú nhất vẫn đang tiếp diễn).

Nhưng bộ thu gom Serial có điểm nào ưu việt hơn các bộ thu gom rác khác không? Tất nhiên là có: nó **đơn giản mà hiệu quả (so với hiệu suất đơn luồng của các bộ thu gom khác)**. Vì bộ thu gom Serial không có chi phí tương tác giữa các Thread, nên đương nhiên nó đạt được hiệu suất thu gom đơn luồng rất cao. Bộ thu gom Serial là một lựa chọn tốt cho máy ảo chạy ở chế độ Client.

### Bộ thu gom ParNew

Bộ thu gom ParNew thực chất là phiên bản đa luồng của bộ thu gom Serial; ngoài việc sử dụng đa luồng để thu gom rác ra, mọi hành vi còn lại (tham số điều khiển, thuật toán thu gom, chiến lược thu hồi, v.v.) hoàn toàn giống bộ thu gom Serial.

ParNew chỉ phụ trách Young Generation, sử dụng thuật toán Mark-Copying; nó thường được phối hợp sử dụng cùng bộ thu gom CMS phụ trách Old Generation.

![Bộ thu gom ParNew](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/parnew-garbage-collector-027ab521.png)

Trong các phiên bản JDK mà CMS vẫn còn được hỗ trợ, ParNew là đối tác ở Young Generation của CMS; CMS đã bị loại bỏ từ JDK 14, vì vậy cặp kết hợp này chỉ áp dụng cho các phiên bản HotSpot cũ.

**Bổ sung khái niệm Song song (Parallel) và Đồng thời (Concurrent):**

- **Song song (Parallel)**: Chỉ nhiều Thread thu gom rác làm việc song song với nhau, nhưng lúc này các Thread người dùng vẫn đang ở trạng thái chờ.

- **Đồng thời (Concurrent)**: Chỉ Thread người dùng và Thread thu gom rác thực thi đồng thời cùng lúc (nhưng không nhất thiết song song, có thể chạy xen kẽ nhau); chương trình người dùng vẫn tiếp tục chạy trong khi bộ thu gom rác chạy trên một CPU khác.

### Bộ thu gom Parallel Scavenge

Bộ thu gom Parallel Scavenge cũng là bộ thu gom đa luồng sử dụng thuật toán Mark-Copying; nhìn bề ngoài nó gần như giống hệt ParNew. **Vậy nó có điểm gì đặc biệt?**

```bash
-XX:+UseParallelGC

    Sử dụng bộ thu gom Parallel (mặc định đi kèm Parallel Old trong JDK 8)

-XX:+UseParallelOldGC

    Sử dụng bộ thu gom Parallel + thu gom song song Old Generation
```

Trọng tâm của bộ thu gom Parallel Scavenge là thông lượng (throughput — tận dụng CPU hiệu quả cao). Trọng tâm của các bộ thu gom rác như CMS nghiêng nhiều hơn về thời gian tạm dừng của Thread người dùng (nâng cao trải nghiệm người dùng). Thông lượng (throughput) là tỷ số giữa thời gian CPU dùng để chạy mã người dùng trên tổng thời gian CPU tiêu thụ. Bộ thu gom Parallel Scavenge cung cấp nhiều tham số giúp người dùng tìm ra thời gian tạm dừng phù hợp nhất hoặc thông lượng tối đa; nếu chưa am hiểu sâu về cách vận hành của bộ thu gom và gặp khó khăn khi tối ưu thủ công, sử dụng Parallel Scavenge kết hợp chiến lược điều chỉnh thích ứng (adaptive sizing policy) để giao việc tối ưu quản lý bộ nhớ cho máy ảo tự xử lý cũng là một lựa chọn tốt.

**Young Generation dùng thuật toán Mark-Copying, Old Generation dùng thuật toán Mark-Compact.**

![Sơ đồ hoạt động của bộ thu gom Parallel Old](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/parallel-scavenge-garbage-collector-daa50325.png)

**Đây là bộ thu gom mặc định của JDK 1.8.**

Kiểm tra bằng lệnh `java -XX:+PrintCommandLineFlags -version`:

```bash
-XX:InitialHeapSize=262921408 -XX:MaxHeapSize=4206742528 -XX:+PrintCommandLineFlags -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:+UseParallelGC
java version "1.8.0_211"
Java(TM) SE Runtime Environment (build 1.8.0_211-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.211-b12, mixed mode)
```

JDK 1.8 mặc định sử dụng Parallel Scavenge + Parallel Old; nếu chỉ định tham số `-XX:+UseParallelGC` thì mặc định sẽ bật `-XX:+UseParallelOldGC`, có thể dùng `-XX:-UseParallelOldGC` để tắt tính năng này.

### Bộ thu gom Serial Old

**Phiên bản dành cho Old Generation của bộ thu gom Serial**, nó cũng là một bộ thu gom đơn luồng. Nó có hai công dụng chính: một là phối hợp với bộ thu gom Parallel Scavenge từ JDK 1.5 trở về trước, hai là đóng vai trò phương án dự phòng (fallback) cho bộ thu gom CMS.

![Bộ thu gom Serial](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/serial-garbage-collector-0d0ad081.png)

### Bộ thu gom Parallel Old

**Phiên bản dành cho Old Generation của bộ thu gom Parallel Scavenge.** Sử dụng đa luồng và thuật toán "Mark-and-Compact". Trong các tình huống coi trọng thông lượng và tài nguyên CPU, có thể ưu tiên cân nhắc bộ thu gom Parallel Scavenge và bộ thu gom Parallel Old.

![Sơ đồ hoạt động của bộ thu gom Parallel Old](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/parallel-scavenge-garbage-collector-daa50325.png)

### Bộ thu gom CMS

**Bộ thu gom CMS (Concurrent Mark Sweep) là bộ thu gom lấy mục tiêu đạt thời gian tạm dừng thu hồi ngắn nhất. Nó rất phù hợp để sử dụng cho các ứng dụng coi trọng trải nghiệm người dùng.**

**Bộ thu gom CMS (Concurrent Mark Sweep) là bộ thu gom đồng thời (concurrent collector) thực sự đầu tiên của máy ảo HotSpot; nó lần đầu tiên hiện thực hóa việc cho phép Thread thu gom rác và Thread người dùng (về cơ bản) làm việc cùng một lúc.**

Từ hai từ **Mark Sweep** trong tên gọi có thể thấy bộ thu gom CMS được triển khai dựa trên **thuật toán "Mark-and-Sweep"**, quá trình vận hành của nó phức tạp hơn nhiều so với các bộ thu gom trước đó. Toàn bộ quá trình chia thành bốn bước:

- **Đánh dấu ban đầu (Initial Mark):** Tạm dừng ngắn để đánh dấu các đối tượng nối trực tiếp với GC Roots (đối tượng gốc);
- **Đánh dấu đồng thời (Concurrent Mark):** Chạy đồng thời Thread GC và Thread người dùng, dùng một cấu trúc bao đóng (closure) để ghi nhận các đối tượng có thể tiếp cận. Tuy nhiên khi kết thúc giai đoạn này, cấu trúc bao đóng đó không thể bảo đảm chứa toàn bộ đối tượng hiện đang có thể tiếp cận, bởi vì Thread người dùng có thể liên tục cập nhật các trường tham chiếu nên Thread GC không thể bảo đảm tính thời gian thực của phép phân tích khả năng tiếp cận. Vì vậy thuật toán này sẽ theo dõi và ghi nhận những vị trí xảy ra cập nhật tham chiếu đó.
- **Đánh dấu lại (Remark):** Giai đoạn Remark nhằm hiệu chỉnh lại bản ghi đánh dấu của phần đối tượng bị thay đổi dấu trong thời gian Concurrent Mark do chương trình người dùng vẫn tiếp tục chạy; thời gian tạm dừng ở giai đoạn này nhìn chung lâu hơn một chút so với Initial Mark, và ngắn hơn rất nhiều so với giai đoạn Concurrent Mark.
- **Quét dọn đồng thời (Concurrent Sweep):** Bật Thread người dùng chạy tiếp, đồng thời Thread GC bắt đầu quét dọn các vùng chưa được đánh dấu.

![Bộ thu gom CMS](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/cms-garbage-collector-1d9958f0.png)

Ngay từ tên gọi đã thấy đây là một bộ thu gom rác xuất sắc với ưu điểm chính là **thu gom đồng thời, độ trễ tạm dừng thấp**. Tuy nhiên nó có ba nhược điểm rõ rệt sau:

- **Nhạy cảm với tài nguyên CPU;**
- **Không thể xử lý rác trôi nổi (floating garbage);**
- **Thuật toán thu hồi mà nó sử dụng — thuật toán "Mark-and-Sweep" — dẫn đến phát sinh lượng lớn phân mảnh không gian sau khi thu gom kết thúc.**

**Bộ thu gom rác CMS đã bị đánh dấu lỗi thời (deprecated) từ Java 9 và bị loại bỏ hoàn toàn trong Java 14.**

### Bộ thu gom G1

**G1 (Garbage-First) là một bộ thu gom rác hướng đến máy chủ (server), chủ yếu nhắm tới các máy trang bị nhiều bộ xử lý và dung lượng bộ nhớ lớn. Nó đáp ứng yêu cầu về thời gian tạm dừng GC với xác suất rất cao, đồng thời vẫn sở hữu đặc tính hiệu năng thông lượng cao.**

Nó được xem là một bước tiến hóa quan trọng của máy ảo HotSpot từ JDK 1.7. Nó sở hữu các đặc điểm sau:

- **Song song và đồng thời (Parallel & Concurrent):** G1 có thể tận dụng tối đa lợi thế phần cứng trong môi trường CPU đa nhân, sử dụng nhiều CPU (hoặc nhân CPU) để rút ngắn thời gian tạm dừng Stop-The-World. Một số tác vụ GC vốn đòi hỏi phải tạm dừng Thread Java ở các bộ thu gom khác thì bộ thu gom G1 vẫn có thể cho chương trình Java tiếp tục chạy theo cách đồng thời.
- **Thu gom theo thế hệ (Generational Collection):** Dù G1 có thể tự quản lý độc lập toàn bộ GC Heap mà không cần phối hợp với bộ thu gom khác, nhưng nó vẫn giữ lại khái niệm thế hệ.
- **Tích hợp không gian (Space Compaction):** Khác với thuật toán "Mark-and-Sweep" của CMS, nhìn từ tổng thể G1 là bộ thu gom được triển khai dựa trên thuật toán "Mark-and-Compact"; nhìn từ cục bộ lại dựa trên thuật toán "Mark-Copying".
- **Thời gian tạm dừng có thể dự đoán (Predictable Pauses):** Đây là một ưu điểm lớn khác của G1 so với CMS. Giảm thời gian tạm dừng là mối quan tâm chung của cả G1 lẫn CMS. G1 sẽ xây dựng mô hình dự đoán và lựa chọn tập thu hồi dựa trên mục tiêu thời gian tạm dừng do người dùng thiết lập, nhưng mục tiêu này là mục tiêu mềm (soft goal), không bảo đảm mọi lần tạm dừng đều không vượt quá giá trị đã chỉ định.

Hoạt động của bộ thu gom G1 nhìn chung chia thành các bước sau:

- **Initial Mark (Đánh dấu ban đầu):** Tạm dừng ngắn (Stop-The-World, STW), đánh dấu các đối tượng được tham chiếu trực tiếp từ GC Roots, tức là đánh dấu tất cả các đối tượng đang sống tiếp cận trực tiếp.
- **Concurrent Mark (Đánh dấu đồng thời):** Chạy đồng thời cùng ứng dụng, đánh dấu tất cả các đối tượng có thể tiếp cận. Giai đoạn này có thể kéo dài tương đối lâu, tùy thuộc vào kích thước Heap và số lượng đối tượng.
- **Final Mark (Đánh dấu cuối):** Tạm dừng ngắn (STW), xử lý lượng nhỏ thay đổi tham chiếu còn sót lại chưa kịp xử lý sau khi giai đoạn Concurrent Mark kết thúc.
- **Live Data Counting and Evacuation (Sàng lọc và thu hồi):** Dựa trên kết quả đánh dấu, chọn ra các Region có giá trị thu hồi cao, sao chép đối tượng còn sống sang Region mới và thu hồi bộ nhớ của Region cũ. Giai đoạn này bao gồm một hoặc nhiều lần tạm dừng (STW), tùy thuộc vào độ phức tạp của quá trình thu hồi.

![Bộ thu gom G1](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/g1-garbage-collector-f94fc978.png)

**Bộ thu gom G1 duy trì một danh sách ưu tiên ngầm, mỗi lần căn cứ theo thời gian thu gom cho phép để ưu tiên chọn Region có giá trị thu hồi lớn nhất (đây cũng chính là nguồn gốc tên gọi Garbage-First của nó).** Cách chia không gian bộ nhớ thành các Region và thu hồi Region có thứ tự ưu tiên như vậy bảo đảm bộ thu gom G1 đạt được hiệu suất thu gom cao nhất có thể trong thời gian giới hạn ("chia nhỏ để xử lý").

**Từ JDK 9 trở đi, bộ thu gom rác G1 đã trở thành bộ thu gom rác mặc định.**

### Bộ thu gom ZGC

ZGC là bộ thu gom rác hướng tới mục tiêu độ trễ thấp (low latency). Nó thực thi đồng thời các công việc chính như đánh dấu và di chuyển đối tượng cùng với các Thread ứng dụng, thông qua con trỏ màu (colored pointers) và cơ chế rào chắn (load barriers) để bảo đảm đối tượng sau khi di chuyển vẫn có thể được truy cập chính xác. Nó vẫn có các pha STW, nhưng mục tiêu thiết kế là giữ cho thời gian tạm dừng rất ngắn và không tăng đáng kể theo kích thước Heap, số lượng đối tượng còn sống hay số lượng Thread.

Ở đây cần phân biệt giữa các phiên bản JDK khác nhau. ZGC đời đầu vẫn chịu ảnh hưởng đến thời gian tạm dừng từ bước xử lý Thread Stack; từ JDK 16 với [JEP 376](https://openjdk.org/jeps/376), các công việc như xử lý Thread Stack đã được chuyển sang giai đoạn đồng thời, vì vậy khi nói về ZGC trên JDK 17 thì không nên tiếp tục áp dụng mô hình tạm dừng của các phiên bản cũ.

#### Các phiên bản và cách bật ZGC

| Phiên bản JDK | Thay đổi của ZGC | Tham số kích hoạt |
| ------------- | ---------------- | ----------------- |
| JDK 11–14 | Được đưa vào dưới dạng tính năng thử nghiệm ([JEP 333](https://openjdk.org/jeps/333)) | `-XX:+UnlockExperimentalVMOptions -XX:+UseZGC` |
| JDK 15–20 | Trở thành tính năng chính thức, sử dụng chế độ không phân thế hệ ([JEP 377](https://openjdk.org/jeps/377)) | `-XX:+UseZGC` |
| JDK 21, 22 | Bổ sung chế độ phân thế hệ (generational), mặc định vẫn là không phân thế hệ | Chế độ phân thế hệ dùng `-XX:+UseZGC -XX:+ZGenerational` |
| JDK 23 | Khi chọn ZGC, mặc định sử dụng chế độ phân thế hệ | `-XX:+UseZGC` |
| Từ JDK 24 | Loại bỏ chế độ không phân thế hệ | `-XX:+UseZGC` |

**ZGC mặc định dùng chế độ phân thế hệ không có nghĩa là JVM mặc định dùng ZGC.** Trong môi trường Server-class điển hình, HotSpot mặc định vẫn chọn G1; muốn dùng ZGC cần cấu hình tường minh. Ví dụ khi chạy trên JDK 17:

```bash
java -XX:+UseZGC -jar app.jar
```

JDK 17 không hỗ trợ `-XX:+ZGenerational`, cũng không thể bê nguyên kinh nghiệm tinh chỉnh của ZGC phân thế hệ sang áp dụng trực tiếp. Quá trình phát triển chế độ phân thế hệ có thể tham khảo [JEP 439](https://openjdk.org/jeps/439), [JEP 474](https://openjdk.org/jeps/474) và [JEP 490](https://openjdk.org/jeps/490).

#### Thời gian tạm dừng rất ngắn, phản hồi API có chắc chắn nhanh hơn không?

Chưa chắc. Thời gian tạm dừng GC chỉ là một phần trong tổng thời gian xử lý request. Nếu các request chậm chủ yếu đến từ cơ sở dữ liệu, tranh chấp khóa (lock contention), dịch vụ phía sau (downstream) hoặc bão hòa CPU, thì sau khi chuyển sang ZGC, độ trễ P99 của API có thể không thay đổi nhiều. GC đồng thời cũng tiêu tốn CPU; ở các dịch vụ có hạn mức CPU (CPU quota) eo hẹp, sự cạnh tranh tài nguyên này có thể ảnh hưởng đến thông lượng và độ trễ của request.

Ngoài ra, **tạm dừng STW thấp không đồng nghĩa với việc Thread ứng dụng sẽ không bao giờ phải chờ vì thiếu bộ nhớ**. Nếu tốc độ cấp phát đối tượng quá nhanh, không gian Heap không đủ, hoặc quá trình thu hồi đồng thời không theo kịp tốc độ cấp phát, ZGC có thể xuất hiện Allocation Stall (tạm dừng cấp phát). Dung lượng Heap ngoài việc chứa các đối tượng còn sống còn phải chừa sẵn không gian cho các cấp phát mới trong lúc thu hồi đồng thời.

Khi đánh giá lợi ích thực tế của bộ thu gom, nên so sánh G1 và ZGC trên cùng một phiên bản JDK trước, rồi mới đánh giá riêng lợi ích của việc nâng cấp JDK, tránh trộn lẫn tác động của nâng cấp phiên bản, thay đổi mã nguồn và chuyển đổi bộ thu gom. Trong giai đoạn triển khai thí điểm (canary), cần theo dõi đồng thời:

- **Chỉ số nghiệp vụ:** Thông lượng dưới cùng mức tải, độ trễ P99/P999, tỷ lệ timeout và tỷ lệ lỗi.
- **Chỉ số GC:** Phân bố thời gian tạm dừng, chu kỳ thu hồi, tốc độ cấp phát, lượng đối tượng còn sống sau thu hồi và có xuất hiện Allocation Stall hay không.
- **Chỉ số tài nguyên:** Mức sử dụng CPU và tình trạng bóp giới hạn container (throttling), bộ nhớ tiến trình, bộ nhớ ngoài Heap (off-heap) và khoảng dự phòng ở tải đỉnh.

Về cấu hình tham số và các hiểu lầm thường gặp, xem [Tham số ZGC trên JDK 17 trong bài Tổng hợp các tham số JVM](./jvm-parameters-intro.md#tham-số-zgc-trên-jdk-17). Trước khi chuyển đổi trên môi trường production, cũng cần giữ lại cấu hình bộ thu gom cũ và phiên bản ứng dụng đã được kiểm chứng, đồng thời xác định rõ các chỉ số nghiệp vụ kích hoạt rollback.

Để tìm hiểu chi tiết hơn về bộ thu gom ZGC, khuyến nghị đọc thêm các bài viết sau:

- [Phân tích ZGC từ góc nhìn các thế hệ thuật toán GC - JD Tech](https://mp.weixin.qq.com/s/ExkB40cq1_Z0ooDzXn7CVw)
- [Khám phá và thực hành bộ thu gom rác thế hệ mới ZGC - Đội ngũ kỹ thuật Meituan](https://tech.meituan.com/2020/08/06/ZGC-in-Meituan.html)
- [Tổng hợp chuyên sâu bộ thu gom rác JVM G1 & ZGC - Alibaba Cloud Developer](https://mp.weixin.qq.com/s/Ywj3XMws0IIK-kiUllN87Q)

### Bộ thu gom Shenandoah

Tương tự ZGC, Shenandoah cũng là bộ thu gom hướng tới độ trễ thấp, do Red Hat dẫn dắt phát triển; được đưa vào Java 12 dưới dạng tính năng thử nghiệm thông qua [JEP 189](https://openjdk.org/jeps/189) và trở thành tính năng chính thức từ Java 15 ([JEP 379](https://openjdk.org/jeps/379)).

Ý tưởng cốt lõi của Shenandoah là **dồn nén đồng thời (concurrent compaction)**: phần lớn công việc dồn nén Heap diễn ra đồng thời với các Thread ứng dụng, giữ thời gian tạm dừng ở mức dưới mili-giây (sub-millisecond) và không phụ thuộc vào kích thước Heap. Nó chủ yếu dựa vào **con trỏ chuyển tiếp (Brooks Pointer)** và **rào chắn đọc (Read Barrier)** để bảo đảm việc di chuyển đối tượng trong lúc dồn nén đồng thời diễn ra trong suốt đối với Thread ứng dụng.

Cần lưu ý rằng Shenandoah đời đầu cũng giống ZGC đời đầu ở chỗ là bộ thu gom không phân thế hệ, nên có sự đánh đổi nhất định về thông lượng. Shenandoah phân thế hệ vẫn đang tiếp tục được phát triển (như [JEP 535](https://openjdk.org/jeps/535), [JEP 521](https://openjdk.org/jeps/521)) và rất đáng để theo dõi thường xuyên.

Bạn có thể bật Shenandoah bằng tham số dưới đây:

```bash
java -XX:+UseShenandoahGC className
```

> Lưu ý: Shenandoah không nằm trong danh sách hỗ trợ mặc định của Oracle JDK, mà chủ yếu được cung cấp kèm các bản phân phối OpenJDK (như Red Hat, Amazon Corretto, v.v.). Trước khi sử dụng, cần kiểm tra xem bản phân phối JDK đang dùng có tích hợp và bật hỗ trợ Shenandoah hay không (`-XX:+PrintFlagsFinal -version | grep UseShenandoahGC`).

## Tài liệu tham khảo

- *Hiểu sâu về Java Virtual Machine: Các tính năng nâng cao và Best Practices (Ấn bản thứ 2)*
- The Java® Virtual Machine Specification - Java SE 8 Edition: <https://docs.oracle.com/javase/specs/jvms/se8/html/index.html>
