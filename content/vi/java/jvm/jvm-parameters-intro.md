---
title: Tổng hợp các tham số JVM quan trọng nhất
description: Tổng hợp các tham số JVM thường dùng và cách cấu hình, kết hợp với các khuyến nghị thực tiễn về tinh chỉnh bộ nhớ và GC.
category: Java
tag:
  - JVM
lang: vi
sourceRef: zh-ref/java/jvm/jvm-parameters-intro.md
head:
  - - meta
    - name: keywords
      content: Tham số JVM,kích thước Heap,kích thước Stack,cấu hình GC,tinh chỉnh hiệu năng,tham số XX
---

> Bài viết này được JavaGuide dịch từ [https://www.baeldung.com/jvm-parameters](https://www.baeldung.com/jvm-parameters) và đã được bổ sung, hoàn thiện rất nhiều nội dung.
> Tài liệu tham khảo các tham số: [https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/java.html)
>
> Phiên bản JDK: Chủ yếu là JDK 1.8, đồng thời bổ sung các tham số thường dùng ở các phiên bản mới.

Trong bài viết này, chúng ta sẽ cùng tìm hiểu các cấu hình tham số thường dùng nhất của Java Virtual Machine (JVM), giúp bạn hiểu rõ hơn và tối ưu môi trường chạy cho các ứng dụng Java.

## Liên quan đến bộ nhớ Heap

> Java Heap là vùng bộ nhớ lớn nhất do JVM quản lý, **được chia sẻ bởi tất cả các Thread** và được tạo ra khi máy ảo khởi động. **Mục đích duy nhất của vùng bộ nhớ này là lưu trữ các thực thể đối tượng (object instance); hầu như toàn bộ object instance cũng như mảng đều được cấp phát bộ nhớ trên Heap.**

![Các tham số cấu hình thường gặp cho các vùng bộ nhớ](/media/jg/local/java/jvm/pictures/asset-13fc3a.png)

### Thiết lập kích thước bộ nhớ Heap (`-Xms` và `-Xmx`)

Thiết lập kích thước bộ nhớ Heap ban đầu và tối đa dựa trên nhu cầu thực tế của ứng dụng là một trong những thực hành phổ biến nhất trong tinh chỉnh hiệu năng. Đặt cả hai bằng nhau giúp giảm chi phí thay đổi dung lượng Heap lúc chạy; nếu muốn trả lại bộ nhớ Heap chưa dùng khi tải thấp, cần giữ lại khoảng co giãn. Ví dụ, ZGC không thể trả lại bộ nhớ Heap thông qua Uncommit khi `-Xms` bằng `-Xmx`, nên cần cân nhắc dựa trên mục tiêu độ trễ và chi phí bộ nhớ.

Sử dụng các tham số sau để cấu hình:

```bash
-Xms<heap size>[unit]  # Thiết lập kích thước Heap ban đầu của JVM
-Xmx<heap size>[unit]  # Thiết lập kích thước Heap tối đa của JVM
```

- `<heap size>`: Chỉ định giá trị số cụ thể của bộ nhớ.
- `[unit]`: Chỉ định đơn vị bộ nhớ, như `g` (GB), `m` (MB), `k` (KB).

**Ví dụ:** Thiết lập cả Heap ban đầu và Heap tối đa của JVM là 4GB:

```bash
-Xms4G -Xmx4G
```

### Thiết lập kích thước bộ nhớ Young Generation

Theo [tài liệu chính thức của Oracle](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/sizing.html), sau khi hoàn tất cấu hình tổng bộ nhớ khả dụng của Heap, yếu tố ảnh hưởng lớn thứ hai là tỷ lệ mà `Young Generation` (thế hệ trẻ) chiếm trong bộ nhớ Heap. Kích thước mặc định của Young Generation chịu ảnh hưởng bởi hiện thực JVM, nền tảng, bộ thu gom rác (Garbage Collector), kích thước Heap và chiến lược tự thích nghi (ergonomics), không tồn tại mức "tối thiểu 1310 MB" cố định áp dụng cho mọi môi trường; `NewSize` và `MaxNewSize` lần lượt dùng để ràng buộc cận dưới và cận trên kích thước Young Generation.

Đối với các bộ thu gom phân thế hệ (generational collector) hỗ trợ tham số cố định kích thước Young Generation, có thể thiết lập kích thước bộ nhớ Young Generation theo hai cách sau:

**1. Chỉ định qua `-XX:NewSize` và `-XX:MaxNewSize`**

```bash
-XX:NewSize=<young size>[unit]    # Thiết lập kích thước ban đầu của Young Generation
-XX:MaxNewSize=<young size>[unit] # Thiết lập kích thước tối đa của Young Generation
```

**Ví dụ:** Thiết lập Young Generation tối thiểu 512MB, tối đa 1024MB:

```bash
-XX:NewSize=512m -XX:MaxNewSize=1024m
```

**2. Chỉ định qua `-Xmn<young size>[unit]`**

**Ví dụ:** Cố định kích thước Young Generation ở mức 512MB:

```bash
-Xmn512m
```

Việc thiết lập tường minh kích thước Young Generation sẽ hạn chế khả năng tự điều chỉnh thích nghi của bộ thu gom rác. [Tài liệu chính thức của Oracle](https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html#extra-options-for-java) khuyến cáo rõ không nên thiết lập `-Xmn` cho G1; có cần điều chỉnh hay không và điều chỉnh như thế nào phải căn cứ vào bộ thu gom cụ thể và GC log.

Một kinh nghiệm đúc kết rất quan trọng trong chiến lược tinh chỉnh GC nói rằng:

> Cố gắng để các đối tượng mới tạo được cấp phát và thu gom ngay trong Young Generation, bởi vì chi phí của `Minor GC` thường thấp hơn rất nhiều so với `Full GC`. Thông qua việc phân tích GC log, hãy đánh giá xem việc phân bổ không gian Young Generation đã hợp lý hay chưa. Nếu một lượng lớn đối tượng mới bị thăng cấp sớm sang Old Generation (`Promotion`), có thể điều chỉnh thích hợp kích thước Young Generation qua `-Xmn` hoặc `-XX:NewSize/-XX:MaxNewSize`, với mục tiêu giảm tối đa tình trạng đối tượng đi thẳng vào Old Generation.

Ngoài ra, bạn cũng có thể dùng tham số **`-XX:NewRatio=<int>`** để thiết lập **tỷ lệ kích thước bộ nhớ giữa Old Generation và toàn bộ Young Generation (bao gồm Eden và hai vùng Survivor)**.

Ví dụ, `-XX:NewRatio=2` biểu thị Old Generation : Young Generation = 2 : 1, tức Young Generation chiếm 1/3 tổng kích thước Heap. Giá trị mặc định phụ thuộc vào JVM, bộ thu gom và nền tảng.

```bash
-XX:NewRatio=2
```

### Thiết lập kích thước PermGen / Metaspace

**Từ Java 8 trở đi, siêu dữ liệu lớp (`class metadata`) chuyển sang dùng bộ nhớ gốc (`native memory`). Nếu không đặt giới hạn trên qua `-XX:MaxMetaspaceSize`, class metadata tăng liên tục có thể tiêu tốn lượng lớn native memory; còn PermGen bị ràng buộc bởi giới hạn trên `-XX:MaxPermSize`.**

Trước JDK 1.8 khi PermGen chưa bị loại bỏ hoàn toàn, người ta thường dùng các tham số sau để điều chỉnh kích thước Method Area:

```bash
-XX:PermSize=N # Kích thước ban đầu của Method Area (PermGen)
-XX:MaxPermSize=N # Kích thước tối đa của Method Area (PermGen); vượt quá giá trị này sẽ ném ra ngoại lệ OutOfMemoryError: java.lang.OutOfMemoryError: PermGen
```

Nói một cách tương đối, hành vi Garbage Collection ở vùng này ít xảy ra hơn, nhưng không phải dữ liệu vào Method Area rồi thì sẽ "tồn tại vĩnh viễn".

**Đến JDK 1.8, Method Area (PermGen của HotSpot) đã bị loại bỏ hoàn toàn (quá trình này đã bắt đầu từ JDK 1.7) và được thay thế bằng `Metaspace`; `Metaspace` sử dụng native memory.**

Dưới đây là một số tham số thường dùng:

```bash
-XX:MetaspaceSize=N # Thiết lập ngưỡng kích hoạt GC cho Metaspace (là một hiểu lầm phổ biến, sẽ giải thích bên dưới)
-XX:MaxMetaspaceSize=N # Thiết lập kích thước tối đa của Metaspace
```

**🐛 Đính chính (xem: [issue#1947](https://github.com/Snailclimb/JavaGuide/issues/1947))**:

**1. `-XX:MetaspaceSize` không phải dung lượng ban đầu:** Dung lượng ban đầu của Metaspace không phải do `-XX:MetaspaceSize` thiết lập; bất kể `-XX:MetaspaceSize` được cấu hình giá trị gì, đối với JVM 64-bit, dung lượng ban đầu của Metaspace thường là một giá trị nhỏ cố định (tài liệu Oracle đề cập khoảng từ 12MB đến 20MB, quan sát thực tế khoảng 20.8MB).

Bạn có thể tham khảo mục [Other Considerations](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/considerations.html) trong tài liệu chính thức của Oracle:

> Specify a higher value for the option MetaspaceSize to avoid early garbage collections induced for class metadata. The amount of class metadata allocated for an application is application-dependent and general guidelines do not exist for the selection of MetaspaceSize. The default size of MetaspaceSize is platform-dependent and ranges from 12 MB to about 20 MB.
>
> Kích thước mặc định của `MetaspaceSize` phụ thuộc vào nền tảng, dao động từ 12 MB đến khoảng 20 MB.

Ngoài ra, có thể xem thêm thử nghiệm này: [Hiểu lầm về tham số JVM MetaspaceSize](https://mp.weixin.qq.com/s/jqfppqqd98DfAJHZhFbmxA).

**2. Mở rộng và Metadata GC:** Khi không gian đã commit của Metaspace đạt tới ngưỡng mực nước cao (high-water mark) tương ứng với `-XX:MetaspaceSize`, JVM sẽ kích hoạt một đợt Garbage Collection để thử gỡ nạp class và giải phóng class metadata. Sau đó, JVM sẽ tự động tăng hoặc hạ ngưỡng kích hoạt GC lần tiếp theo dựa trên hiệu quả giải phóng; việc dùng chu kỳ thu gom nào cụ thể phụ thuộc vào bộ thu gom rác và phiên bản JDK, không thể đánh đồng tất cả là `Full GC`. Bên trong bộ thu gom rác dựa vào biến `_capacity_until_GC` để phán đoán vùng Metaspace đã chạm ngưỡng hay chưa, mã khởi tạo như sau:

```c
void MetaspaceGC::initialize() {
  // Set the high-water mark to MaxMetapaceSize during VM initialization since
  // we can't do a GC during initialization.
  _capacity_until_GC = MaxMetaspaceSize;
}
```

**3. Vai trò của `-XX:MaxMetaspaceSize`:** Nếu không thiết lập tường minh `-XX:MaxMetaspaceSize`, Metaspace mặc định không có giới hạn trên cố định, nên class metadata tăng liên tục có thể tiêu tốn lượng lớn native memory. Có đặt tham số này hay không và đặt bao nhiêu cần quyết định dựa trên tình hình sử dụng class metadata và ngân sách native memory của tiến trình. Đặt giới hạn quá nhỏ sẽ làm tăng tần suất Metadata GC, hoặc kích hoạt sớm `OutOfMemoryError: Metaspace`, vì vậy không có một giá trị khuyến nghị chung áp dụng cho mọi ứng dụng.

Đọc thêm: [Issue đính chính: Nếu không chỉ định kích thước MaxMetaspaceSize, sẽ không làm cạn kiệt bộ nhớ #1204](https://github.com/Snailclimb/JavaGuide/issues/1204).

## Liên quan đến Garbage Collection

### Lựa chọn Garbage Collector

Việc chọn một bộ thu gom rác (Garbage Collector, GC) phù hợp đóng vai trò tối quan trọng đối với thông lượng (throughput) và độ trễ phản hồi (latency) của ứng dụng. Để tìm hiểu chi tiết về các thuật toán thu gom rác và các bộ thu gom, bạn có thể xem bài viết này của tác giả: [Giải thích chi tiết về Garbage Collection trong JVM (Trọng tâm)](https://javaguide.cn/java/jvm/jvm-garbage-collection.html).

JVM cung cấp nhiều bộ hiện thực GC khác nhau, phù hợp với các kịch bản khác nhau:

- **Serial GC (Bộ thu gom tuần tự):** Thực thi GC trên một Thread đơn, phù hợp cho chế độ client hoặc môi trường CPU đơn nhân. Tham số: `-XX:+UseSerialGC`.
- **Parallel GC (Bộ thu gom song song):** Dùng nhiều Thread thực thi thu gom rác Young Generation và Old Generation, chú trọng thông lượng, là GC mặc định của JDK 8 Server VM; khi bật `-XX:+UseParallelGC` trên JDK 8 sẽ mặc định đi kèm Parallel Old. Tham số: `-XX:+UseParallelGC`.
- **CMS GC (Concurrent Mark Sweep):** Hướng tới thời gian dừng thu gom ngắn nhất, phần lớn các pha GC có thể chạy đồng thời (`concurrent`) với Thread người dùng. Phù hợp với các ứng dụng có yêu cầu cao về thời gian phản hồi. Đã bị đánh dấu deprecated từ JDK 9 và bị loại bỏ ở JDK 14. Tham số: `-XX:+UseConcMarkSweepGC`.
- **G1 GC (Garbage-First Garbage Collector):** Là GC mặc định của HotSpot trên các máy chủ Server-class điển hình từ JDK 9 trở về sau; lựa chọn mặc định ở các môi trường khác có thể khác. G1 chia Heap thành nhiều Region, cân bằng giữa thông lượng và thời gian dừng, cố gắng đáp ứng mục tiêu thời gian dừng do người dùng thiết lập. Tham số: `-XX:+UseG1GC`.
- **ZGC:** GC độ trễ thấp, yêu cầu các phiên bản JDK mới hơn hỗ trợ. Tham số: `-XX:+UseZGC`.
- **Shenandoah GC:** Một bộ thu gom tạm dừng thấp khác, có khả dụng hay không phụ thuộc vào bản phân phối JDK cụ thể. Tham số: `-XX:+UseShenandoahGC`.

### Tham số ZGC trên JDK 17

ZGC của JDK 17 là bộ thu gom không phân thế hệ (non-generational), bật bằng `-XX:+UseZGC`. Khi tinh chỉnh, trước tiên hãy xác định ngân sách Heap và CPU dựa trên tải thực tế, sau đó mới điều chỉnh tham số dựa trên GC log, đừng sao chép nguyên bộ cấu hình của dịch vụ khác.

| Tham số | Ý nghĩa và những điểm cần lưu ý khi sử dụng |
| --- | --- |
| `-Xmx`, `-Xms` | Dung lượng Heap tối đa và Heap ban đầu/tối thiểu. Heap cần chứa đủ các đối tượng còn sống và chừa không gian dự phòng cho việc cấp phát trong lúc thu gom đồng thời; `-Xmx` cũng không phải là giới hạn bộ nhớ của toàn bộ tiến trình Java. |
| `-XX:ConcGCThreads` | Số lượng Thread GC chạy đồng thời. Quá ít có thể thu gom không kịp, quá nhiều sẽ tranh chấp CPU với các Thread nghiệp vụ. Hãy ưu tiên dùng chế độ chọn tự thích nghi của JVM trước, rồi kết hợp với tình trạng Allocation Stall, hạn mức CPU và mức tải để kiểm chứng xem có cần thiết lập thủ công hay không. |
| `-XX:ZAllocationSpikeTolerance` | Hệ số dung sai đối với sự tăng vọt đột ngột của tốc độ cấp phát, mặc định ở JDK 17 là `2.0`, dùng để ảnh hưởng đến dự đoán thời điểm kích hoạt thu gom. Đây không phải tỷ lệ mở rộng Heap, và cũng không thể thay thế cho phần dư bộ nhớ đầy đủ. |
| `-XX:ZCollectionInterval` | Khoảng thời gian tối đa giữa các chu kỳ GC, đơn vị tính bằng giây. Giá trị mặc định `0` biểu thị không kích hoạt GC theo khoảng thời gian này, **không phải tắt GC**. Đừng hiểu nhầm nó là thời gian tối thiểu bắt buộc phải chờ giữa hai lần GC. |
| `-XX:+ZUncommit`, `-XX:ZUncommitDelay` | Cho phép trả lại bộ nhớ Heap chưa sử dụng, mặc định bật ở JDK 17 với độ trễ mặc định là `300` giây. Việc trả lại sẽ không đưa Heap xuống thấp hơn `-Xms`; khi thiết lập `-Xms` bằng `-Xmx`, cơ chế này thực chất không phát huy tác dụng. |

Các ngữ nghĩa trên có thể đối chiếu với [tài liệu lệnh `java` của JDK 17](https://docs.oracle.com/en/java/javase/17/docs/specs/man/java.html) và [định nghĩa tham số ZGC trong OpenJDK 17](https://github.com/openjdk/jdk17u/blob/master/src/hotspot/share/gc/z/z_globals.hpp). Tham số ở các phiên bản JDK khác nhau có thể thay đổi, đặc biệt không được thêm tham số Generational ZGC `-XX:+ZGenerational` cho JDK 17.

Ví dụ, lệnh dưới đây vừa ghi lại GC log vừa ghi Safepoint log; kích thước Heap cần được thiết lập riêng theo ngân sách tài nguyên của ứng dụng:

```bash
java -XX:+UseZGC \
  '-Xlog:gc*,safepoint:file=gc.log:time,uptime,level,tags:filecount=5,filesize=20M' \
  -jar app.jar
```

Nếu trong log xuất hiện `Allocation Stall`, cần kết hợp tốc độ cấp phát, lượng đối tượng còn sống, không gian Heap khả dụng và tài nguyên CPU của GC đồng thời để định vị nguyên nhân. Việc chỉ rút ngắn khoảng thời gian thu gom định kỳ chưa chắc có hiệu quả mà còn có thể làm tăng chi phí CPU. Ngân sách bộ nhớ của container cũng phải bao gồm cả `Metaspace`, Thread Stack, Direct Memory và chi phí native của JVM, không thể chỉ dựa vào `-Xmx` để đặt giới hạn cho container.

### Ghi nhật ký GC (GC Logging)

Trong môi trường production hoặc khi điều tra sự cố GC, **nhất thiết phải bật ghi GC log**. GC log chi tiết là căn cứ then chốt để phân tích và giải quyết các vấn đề GC.

Dưới đây là một số tham số ghi GC log cho JDK 8:

```bash
# --- Cấu hình cơ bản được khuyến nghị ---
# In thông tin GC chi tiết
-XX:+PrintGCDetails
# In dấu thời gian xảy ra GC (tính tương đối so với thời điểm khởi động JVM)
# -XX:+PrintGCTimeStamps
# In ngày giờ xảy ra GC (thường dùng hơn)
-XX:+PrintGCDateStamps
# Chỉ định đường dẫn xuất file GC log, %t có thể xuất ngày giờ timestamp
-Xloggc:/path/to/gc-%t.log

# --- Cấu hình nâng cao được khuyến nghị ---
# In phân bố tuổi đối tượng (hữu ích để đánh giá tình trạng thăng cấp sang Old Generation)
-XX:+PrintTenuringDistribution
# In thông tin Heap trước và sau khi GC
-XX:+PrintHeapAtGC
# In thông tin xử lý các loại tham chiếu (Strong/Soft/Weak/Phantom)
-XX:+PrintReferenceGC
# In thời gian tạm dừng ứng dụng (Stop-The-World, STW)
-XX:+PrintGCApplicationStoppedTime

# --- Cấu hình xoay vòng (rotation) file GC log ---
# Bật xoay vòng file GC log
-XX:+UseGCLogFileRotation
# Thiết lập số lượng file log xoay vòng (ví dụ: giữ lại 14 file gần nhất)
-XX:NumberOfGCLogFiles=14
# Thiết lập kích thước tối đa mỗi file log (ví dụ: 50MB)
-XX:GCLogFileSize=50M

# --- Cấu hình hỗ trợ chẩn đoán tùy chọn ---
# In thống kê điểm an toàn (Safepoint) (hữu ích để phân tích nguyên nhân STW)
# -XX:+PrintSafepointStatistics
# -XX:PrintSafepointStatisticsCount=1
```

Từ JDK 9 trở về sau nên sử dụng khung log hợp nhất của JVM là `-Xlog`. Ví dụ, cấu hình sau ghi lại thông tin GC chi tiết và bật xoay vòng theo kích thước:

```bash
-Xlog:gc*:file=/path/to/gc-%t.log:time,uptime,level,tags:filecount=14,filesize=50M
```

Không phải tất cả các tham số cũ đều tiếp tục dùng được: một số tham số được ánh xạ sang cơ chế mới, bị đánh dấu deprecated hoặc không còn được nhận diện nữa. Ví dụ `PrintGCDetails` tương ứng với `-Xlog:gc*`, `PrintTenuringDistribution` tương ứng với `-Xlog:gc+age*=debug`, `PrintGCApplicationStoppedTime` tương ứng với `-Xlog:safepoint`. Cần lấy tài liệu lệnh `java` của phiên bản JDK đích và đầu ra của `java -Xlog:help` làm chuẩn.

## Xử lý OOM

Đối với các ứng dụng lớn, việc đối mặt với lỗi tràn bộ nhớ (`OutOfMemoryError`) là rất phổ biến, và điều này sẽ khiến ứng dụng bị sập. Đây là một kịch bản cực kỳ nghiêm trọng và thường rất khó tái hiện để xử lý.

Đó là lý do JVM cung cấp một số tham số giúp kết xuất bộ nhớ Heap ra một file vật lý để sau này có thể dùng để truy tìm `Memory Leak`:

```bash
# Tạo file Heap Dump khi Java Heap cạn kiệt và ném ra OOME
-XX:+HeapDumpOnOutOfMemoryError

# Chỉ định file hoặc thư mục Heap Dump. Nếu chỉ định thư mục, JVM sẽ dùng tên mặc định java_pid<pid>.hprof
-XX:HeapDumpPath=/data/dumps/

# (Tùy chọn) Thực thi lệnh hoặc script chỉ định khi xảy ra OOM
# Ví dụ: gửi cảnh báo hoặc thử khởi động lại dịch vụ (cần sử dụng thận trọng)
# -XX:OnOutOfMemoryError="<command> <args>"
# Ví dụ: -XX:OnOutOfMemoryError="sh /path/to/notify.sh"

# (Tùy chọn) Bật kiểm tra giới hạn chi phí GC
# Nếu thời gian GC chiếm tỷ lệ quá cao trong tổng thời gian (mặc định 98%) mà hiệu quả thu gom rất thấp (mặc định dưới 2% bộ nhớ Heap),
# sẽ ném OOM sớm để tránh ứng dụng bị treo kẹt lâu trong GC.
-XX:+UseGCOverheadLimit
```

## Các tham số thường dùng khác

- `-server`: Bật tường minh chế độ Server cho HotSpot VM (trên JVM 64-bit thường là mặc định).
- `-XX:+UseStringDeduplication`: (JDK 8u20+) Thử nhận diện các đối tượng `String` có nội dung giống nhau và dùng chung mảng dữ liệu ký tự bên dưới để giảm mức chiếm dụng bộ nhớ. Ở JDK 8, mảng bên dưới là `char[]`, còn trên các JDK hiện đại bật Compact Strings thường là `byte[]`; tùy chọn này cũng yêu cầu sử dụng bộ thu gom có hỗ trợ khử trùng lặp chuỗi, chẳng hạn như G1.
- `-XX:SurvivorRatio=<ratio>`: Thiết lập tỷ lệ kích thước giữa vùng Eden và một vùng Survivor đơn lẻ. Ví dụ `-XX:SurvivorRatio=8` biểu thị Eden : Survivor = 8 : 1.
- `-XX:MaxTenuringThreshold=<threshold>`: Thiết lập ngưỡng tuổi tối đa để đối tượng thăng cấp từ Young Generation sang Old Generation (mỗi lần đối tượng trải qua một đợt `Minor GC` mà còn sống, tuổi sẽ tăng thêm 1). Giá trị mặc định liên quan đến bộ thu gom và phiên bản JDK, ví dụ trong tài liệu JDK 8, giá trị mặc định của Parallel GC là 15 còn CMS là 6.
- `-XX:+DisableExplicitGC`: Khiến JVM bỏ qua các yêu cầu GC tường minh như `System.gc()`, nhưng JVM vẫn sẽ tự động thực hiện GC khi cần thiết. Yêu cầu tường minh không đảm bảo kích hoạt `Full GC`; có bật tham số này hay không cần đánh giá dựa trên việc dọn dẹp Direct Memory, hành vi của framework và bộ thu gom đang sử dụng, không thể áp dụng máy móc cho mọi trường hợp.
- `-XX:+UseLargePages`: (Yêu cầu hệ điều hành hỗ trợ) Thử sử dụng trang bộ nhớ lớn (Large Pages, ví dụ 2MB thay vì 4KB), có thể cải thiện hiệu năng cho các ứng dụng dùng nhiều bộ nhớ, nhưng cần kiểm thử kỹ lưỡng.
- `-XX:MinHeapFreeRatio=<percent>` / `-XX:MaxHeapFreeRatio=<percent>`: Đối với các bộ thu gom hỗ trợ nhóm tham số này, kiểm soát tỷ lệ Heap trống mong muốn sau GC và tham gia điều chỉnh dung lượng Heap. Hành vi cụ thể phụ thuộc vào bộ thu gom, và không thể dùng nhóm tham số này thay thế cho chiến lược dung lượng và Uncommit của ZGC.

**Lưu ý:** Các tham số sau trong các phiên bản JVM hiện đại có thể đã **bị đánh dấu deprecated, bị loại bỏ, hoặc mặc định bật sẵn và không cần thiết lập thủ công**:

- `-XX:+UseLWPSynchronization`: Tùy chọn chiến lược đồng bộ khá cũ; các JVM hiện đại thường đã có hiện thực tối ưu hơn.
- `-XX:LargePageSizeInBytes`: Thường được xác định tự động thông qua `-XX:+UseLargePages` hoặc cấu hình qua OS.
- `-XX:+UseStringCache`: Đã bị loại bỏ.
- `-XX:+UseCompressedStrings`: Tùy chọn thử nghiệm cũ đã bị loại bỏ; Compact Strings được giới thiệu từ JDK 9 là một hiện thực khác.
- `-XX:+OptimizeStringConcat`: Tùy chọn tối ưu nối chuỗi của HotSpot C2 phiên bản cũ; từ JDK 9 trở đi, việc nối chuỗi chủ yếu được thực hiện thông qua `invokedynamic` và `StringConcatFactory`, không thể coi cả hai là cùng một công tắc bật/tắt.

## Tổng kết

Bài viết này cung cấp cho lập trình viên Java một tài liệu hướng dẫn thực tiễn về cấu hình các tham số JVM thường dùng, nhằm giúp người đọc hiểu rõ và tối ưu hiệu năng cũng như tính ổn định của ứng dụng Java. Bài viết nhấn mạnh các khía cạnh sau:

1. **Cấu hình bộ nhớ Heap:** Thiết lập bộ nhớ Heap ban đầu và tối đa (`-Xms`, `-Xmx`) dựa trên môi trường triển khai, cân nhắc giữa lợi ích hiệu năng của dung lượng Heap cố định và nhu cầu trả lại bộ nhớ linh hoạt. Có cần thiết lập tường minh kích thước Young Generation hay không cần đánh giá dựa trên bộ thu gom rác và GC log; G1 thường không khuyến nghị đặt `-Xmn`, còn ZGC không phân thế hệ ở JDK 17 thì không có Young Generation.
2. **Quản lý Metaspace (Java 8+):** `-XX:MetaspaceSize` dùng để thiết lập ngưỡng mực nước cao ban đầu nhằm kích hoạt Metadata GC, chứ không phải dung lượng ban đầu của Metaspace. `-XX:MaxMetaspaceSize` có thể giới hạn bộ nhớ native mà class metadata sử dụng, nhưng mức giới hạn cụ thể cần xác định theo tình hình thực tế của ứng dụng.
3. **Lựa chọn Garbage Collector và Logging:** Giới thiệu kịch bản phù hợp của các thuật toán GC khác nhau và nhấn mạnh sự cần thiết của việc bật GC log chi tiết trong môi trường production và kiểm thử để điều tra sự cố; JDK 8 dùng các tham số GC log truyền thống, còn từ JDK 9 trở đi dùng `-Xlog`.
4. **Xử lý sự cố OOM:** Trình bày cách tự động tạo file Heap Dump khi xảy ra `OOM` thông qua các tham số như `-XX:+HeapDumpOnOutOfMemoryError`, phục vụ cho việc phân tích `Memory Leak` sau này.
5. **Các tham số khác:** Giới thiệu ngắn gọn các tham số hữu ích khác như khử trùng lặp chuỗi (`String Deduplication`) và chỉ ra hiện trạng của một số tham số cũ.

Về các tình huống điều tra sự cố và tinh chỉnh hiệu năng cụ thể, bạn có thể tham khảo bài viết do tác giả tổng hợp: [Các tình huống điều tra sự cố production và tinh chỉnh hiệu năng JVM](https://javaguide.cn/java/jvm/jvm-in-action.html).
