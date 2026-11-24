---
title: "Tổng hợp câu hỏi phỏng vấn JVM mới nhất 2026: Vùng nhớ, Class Loading, Garbage Collection & Xử lý sự cố Production"
category: Java
description: "Tổng hợp câu hỏi phỏng vấn JVM mới nhất 2026, bao phủ các trọng tâm thường gặp như vùng nhớ runtime, khởi tạo đối tượng, tệp Class và Class Loading, thuật toán và bộ thu gom Garbage Collection, tham số JVM, công cụ chẩn đoán JDK, OOM, Full GC liên tục và CPU tăng vọt."
tag:
  - Java
  - JVM
  - Câu hỏi phỏng vấn
lang: vi
sourceRef: zh-ref/java/jvm/jvm-interview-questions.md
head:
  - - meta
    - name: keywords
      content: câu hỏi phỏng vấn JVM,vùng nhớ Java,khởi tạo đối tượng,Class Loading,Parent Delegation,Garbage Collection,câu hỏi phỏng vấn GC,G1,ZGC,tham số JVM,OOM,Full GC,CPU tăng vọt,tinh chỉnh JVM
---

Phỏng vấn JVM rất hiếm khi dừng lại ở câu hỏi "Heap và Stack có gì khác nhau". Sau khi trả lời xong phần các vùng nhớ, người phỏng vấn thường sẽ hỏi tiếp đối tượng được cấp phát như thế nào, những đối tượng nào có thể bị thu hồi, vì sao một lần GC lại gây tạm dừng (pause), và khi trên production xảy ra `OOM`, Full GC liên tục hoặc CPU tăng vọt thì phải điều tra ra sao.

Bài viết này là điểm vào ôn tập phỏng vấn cho chuyên đề JVM của JavaGuide, với các câu hỏi được sắp xếp theo 5 phần: Bộ nhớ & Đối tượng, Tệp Class & Class Loading, Garbage Collection, Tham số & Công cụ chẩn đoán, và Xử lý sự cố Production. Câu trả lời đầy đủ cho từng câu hỏi được đặt trong các bài viết chuyên đề tương ứng.

Nếu thời gian không nhiều, bạn có thể xem trước [Tổng hợp câu hỏi phỏng vấn JVM thường gặp](https://interview.javaguide.cn/java/java-jvm.html), đánh dấu những câu mình chưa trả lời trọn vẹn, rồi quay lại bài này và các bài chuyên đề để bổ sung chi tiết.

## Khi ôn tập JVM nên nắm bắt những vấn đề nào trước?

| Mô-đun | Nội dung cần trình bày rõ | Hướng hỏi xoáy thường gặp |
| -------------- | ------------------------------------------------- | ------------------------------------------------------ |
| Bộ nhớ & Đối tượng | Các vùng dữ liệu runtime được phân chia ra sao; đối tượng được khởi tạo, lưu trữ và truy cập thế nào | Heap, Stack, Method Area, Direct Memory, Object Header, TLAB, `OOM` |
| Tệp Class & Class Loading | Tệp `.class` đi vào JVM như thế nào; lớp hoàn tất Initialization vào thời điểm nào | Constant Pool, quá trình nạp lớp, `ClassLoader`, Parent Delegation, cô lập lớp |
| Garbage Collection | Xác định đối tượng còn sống ra sao, bộ nhớ được thu hồi thế nào, độ trễ tạm dừng xuất phát từ đâu | GC Roots, các loại tham chiếu, thuật toán thu gom, CMS, G1, ZGC, Full GC |
| Tham số & Công cụ | Lựa chọn tham số theo JDK, bộ thu gom rác và hiện tượng vận hành như thế nào | `-Xms`, `-Xmx`, GC log, Heap Dump, `jstat`, `jstack`, JFR |
| Xử lý sự cố Production | Sau khi nhận cảnh báo cần lưu giữ bằng chứng, thu hẹp phạm vi và kiểm chứng bản sửa lỗi ra sao | CPU, Load, `OOM`, Memory Leak, GC thường xuyên, nghẽn Thread |

Phần lớn thực thể đối tượng được cấp phát trên Heap, còn các Thread đang hoạt động, các field tĩnh và những vị trí khác có thể đang giữ tham chiếu tới đối tượng; GC xuất phát từ GC Roots để xác định đối tượng có thể tiếp cận (reachable) hay không, rồi bộ thu gom cụ thể sẽ thực hiện thu hồi. Khi ứng dụng có hiện tượng tăng bộ nhớ hoặc tạm dừng, cần kết hợp thêm GC log, thread stack, heap dump và chỉ số hệ thống để xác định nguyên nhân, chứ không thể vừa thấy Full GC là tăng ngay kích thước Heap.

## Vùng nhớ JVM và Đối tượng

Với các vùng dữ liệu runtime, chỉ kể được tên là chưa đủ. Mỗi vùng được chia sẻ bởi những Thread nào, lưu trữ gì, vòng đời ra sao và có thể ném ra ngoại lệ gì đều có thể trở thành câu hỏi truy vấn tiếp theo. Method Area là vùng logic do đặc tả JVM định nghĩa, còn PermGen và Metaspace là các hiện thực của HotSpot qua các phiên bản khác nhau — khi trả lời đừng đánh đồng chúng thành một khái niệm.

Nội dung liên quan: [Giải thích chi tiết vùng nhớ Java](./memory-area.md)

Câu hỏi phỏng vấn thường gặp:

- Các vùng dữ liệu runtime của JVM bao gồm những phần nào? Những vùng nào là riêng tư theo từng Thread?
- Program Counter Register, JVM Stack và Native Method Stack lần lượt có tác dụng gì?
- Một phương thức Java từ lúc được gọi đến lúc trả về thì Stack Frame xảy ra những thay đổi gì?
- `StackOverflowError` và `OutOfMemoryError` lần lượt có thể phát sinh như thế nào?
- Java Heap chủ yếu lưu trữ gì? Có phải mọi đối tượng đều chắc chắn được cấp phát trên Heap không?
- Method Area, PermGen và Metaspace có mối quan hệ gì? Vì sao lại loại bỏ PermGen?
- Runtime Constant Pool và String Constant Pool có gì khác nhau? Vị trí của chúng từng có những thay đổi nào?
- Direct Memory có thuộc vùng dữ liệu runtime của JVM không? Vì sao nó cũng có thể xảy ra `OOM`?
- HotSpot trải qua những bước nào để khởi tạo một đối tượng?
- Lựa chọn giữa Bump-the-Pointer và Free List như thế nào? Khi cấp phát đối tượng đồng thời, CAS và TLAB lần lượt giải quyết vấn đề gì?
- Object Header, Instance Data và Alignment Padding lần lượt lưu trữ những gì?
- Truy cập đối tượng qua Handle và qua Direct Pointer có gì khác nhau? HotSpot chủ yếu dùng cách nào?

Khi gặp câu hỏi về `OOM`, hãy xác định trước tài nguyên bị cạn kiệt là Java Heap, Metaspace, Direct Memory hay bộ nhớ native cần để tạo Thread. Nếu chỉ trả lời "tăng `-Xmx` lên", bạn sẽ bỏ sót các nguyên nhân như collection không giới hạn kích thước, rò rỉ ClassLoader, Direct Memory chưa được giải phóng và số lượng Thread mất kiểm soát.

## Tệp Class và Class Loading

Các câu hỏi về Class Loading thường bắt đầu từ "một lớp được nạp như thế nào", sau đó hỏi tiếp về thời điểm Initialization, Parent Delegation và sự cô lập giữa các ClassLoader khác nhau. Phần này vừa có vòng đời trong đặc tả JVM, vừa có cài đặt cụ thể trong HotSpot và các ClassLoader của JDK, nên khi mô tả sự khác biệt giữa các phiên bản cần nói rõ đang xét phiên bản JDK nào.

Nội dung liên quan:

- [Giải thích chi tiết cấu trúc tệp Class](./class-file-structure.md)
- [Giải thích chi tiết quá trình Class Loading](./class-loading-process.md)
- [Giải thích chi tiết ClassLoader](./classloader.md)

Câu hỏi phỏng vấn thường gặp:

- Tệp Class gồm những phần nào? Magic Number, số phiên bản và Constant Pool lần lượt có tác dụng gì?
- Các lệnh bytecode của phương thức được lưu ở vị trí nào trong tệp Class?
- Một lớp từ lúc được nạp đến lúc bị unload phải trải qua những giai đoạn nào?
- Loading, Verification, Preparation, Resolution và Initialization lần lượt làm gì?
- Việc gán giá trị cho biến tĩnh ở giai đoạn Preparation và giai đoạn Initialization có gì khác nhau?
- Những tình huống nào sẽ kích hoạt quá trình Initialization của lớp? Truy cập hằng số thời điểm biên dịch (compile-time constant) có kích hoạt không?
- `<clinit>` và phương thức khởi tạo `<init>` có gì khác nhau?
- Bootstrap ClassLoader, Platform ClassLoader và Application ClassLoader lần lượt nạp những lớp nào? Extension ClassLoader ở JDK 8 có gì khác?
- Mô hình ủy quyền cha (Parent Delegation Model) là gì? Nó ngăn chặn việc nạp trùng lặp hoặc thay thế các lớp cốt lõi bằng cách nào?
- Cơ chế ủy quyền cha được thực thi như thế nào? Điều gì xảy ra khi ClassLoader cha không thể hoàn tất việc nạp lớp?
- Những kịch bản nào sẽ phá vỡ cơ chế ủy quyền cha? Thread Context ClassLoader giải quyết vấn đề gì?
- Hai lớp có cùng tên đầy đủ (fully qualified name) thì có chắc chắn là cùng một lớp không?
- Một custom ClassLoader thường nên ghi đè (`Override`) `findClass()` hay `loadClass()`?

Nếu chỉ trả lời mô hình ủy quyền cha như một chuỗi tra cứu cố định đi lên trên thì vẫn chưa đầy đủ. Danh tính của một lớp được xác định đồng thời bởi tên đầy đủ của lớp và ClassLoader đã nạp nó; các kịch bản như SPI, cô lập lớp trong application server, hot deployment sẽ sử dụng những cách nạp khác nhau với mục đích không hoàn toàn giống nhau.

## Garbage Collection

Các câu hỏi về Garbage Collection cần đi từ việc cấp phát đối tượng và xác định đối tượng còn sống đến các bộ thu gom cụ thể. Giữa thông lượng (throughput), thời gian tạm dừng (pause time) và mức chiếm dụng bộ nhớ luôn có sự đánh đổi; khi lựa chọn bộ thu gom còn phải cân nhắc phiên bản JDK, kích thước Heap và yêu cầu độ trễ của nghiệp vụ, chứ không thể chỉ so sánh tên thuật toán.

Nội dung liên quan: [Giải thích chi tiết Garbage Collection trong JVM](./jvm-garbage-collection.md)

Câu hỏi phỏng vấn thường gặp:

- Young Generation và Old Generation thường được phân chia như thế nào? Đối tượng nói chung được cấp phát và thăng cấp (promote) ra sao?
- Đối tượng lớn và đối tượng sống lâu sẽ đi vào Old Generation bằng cách nào?
- Space Allocation Guarantee (bảo đảm cấp phát không gian) là gì?
- Vì sao phương pháp Đếm tham chiếu (Reference Counting) khó giải quyết được tham chiếu vòng giữa các đối tượng?
- Phân tích khả năng tiếp cận (Reachability Analysis) xác định đối tượng còn sống bằng cách nào? Những đối tượng nào có thể làm GC Roots?
- Strong Reference, Soft Reference, Weak Reference và Phantom Reference khác nhau như thế nào?
- Thuật toán Mark-Sweep, Copying và Mark-Compact mỗi loại có ưu nhược điểm gì?
- Vì sao thu gom theo thế hệ lại chọn các thuật toán khác nhau cho Young Generation và Old Generation?
- Minor GC, Major GC và Full GC có gì khác nhau? Vì sao cần gắn với bộ thu gom cụ thể và log để hiểu các tên gọi này?
- Serial, Parallel, CMS, G1 và ZGC khác nhau ở mục tiêu và kịch bản phù hợp nào?
- Vì sao CMS lại sinh ra phân mảnh bộ nhớ (memory fragmentation) và rác trôi nổi (floating garbage)?
- G1 kiểm soát thời gian tạm dừng thông qua Region, dự đoán giá trị thu hồi và Mixed GC như thế nào?
- ZGC giảm thiểu thời gian tạm dừng kéo dài bằng cách nào? Các bộ thu gom độ trễ thấp phải đánh đổi những chi phí gì?
- Những tình huống nào có thể kích hoạt Full GC? Khi Full GC xảy ra thường xuyên nên bắt đầu kiểm tra từ những dữ liệu nào?

Tên sự kiện, phân vùng bộ nhớ và tham số trong GC log sẽ thay đổi tùy theo phiên bản JDK và bộ thu gom rác. Khi phỏng vấn, bạn có thể nêu rõ môi trường chạy của mình trước, rồi mới giải thích nguyên nhân kích hoạt, phạm vi thu hồi, các pha tạm dừng và kết quả của một lần thu gom; học vẹt kết luận cố định tách rời khỏi phiên bản rất dễ tự mâu thuẫn khi bị hỏi xoáy.

## Tham số JVM và Công cụ chẩn đoán

Câu hỏi về tham số kiểm tra căn cứ cấu hình của bạn. Kích thước Heap, tỷ lệ Young Generation, bộ thu gom rác và tham số log phải được bàn luận gắn với bộ nhớ triển khai, tốc độ cấp phát đối tượng, mục tiêu độ trễ và phiên bản JDK. Đặc biệt với G1, thường không khuyến khích sao chép máy móc các cấu hình cũ xoay quanh kích thước Young Generation cố định.

Nội dung liên quan:

- [Tổng hợp các tham số JVM thường dùng](./jvm-parameters-intro.md)
- [Tổng hợp các công cụ giám sát và xử lý sự cố JDK](./jdk-monitoring-and-troubleshooting-tools.md)

Câu hỏi phỏng vấn thường gặp:

- `-Xms`, `-Xmx`, `-Xmn` và `-Xss` lần lượt kiểm soát những gì?
- Vì sao các ứng dụng phía server thường đặt `-Xms` và `-Xmx` bằng nhau?
- `-XX:MetaspaceSize` và `-XX:MaxMetaspaceSize` khác nhau như thế nào?
- Lựa chọn Garbage Collector cho ứng dụng như thế nào? Trước khi chuyển đổi bộ thu gom cần thu thập những dữ liệu gì?
- Cấu hình GC log trên JDK 8 và từ JDK 9 trở đi như thế nào?
- Khi xảy ra `OOM` thì cấu hình tự động tạo Heap Dump như thế nào? Vì sao cần xác nhận trước dung lượng lưu trữ?
- `jps`, `jstat`, `jinfo`, `jmap`, `jstack` và `jcmd` lần lượt phù hợp để kiểm tra gì?
- Dùng `jstat` để quan sát tần suất GC, dung lượng từng vùng và tình trạng thăng cấp đối tượng như thế nào?
- Khi Thread bị block lâu, gặp Deadlock hoặc CPU tăng vọt, thread dump có thể cung cấp những thông tin gì?
- Heap Dump và thread dump có gì khác nhau? `kill -3` sinh ra loại nào?
- Khi phân tích Heap Dump bằng MAT, Dominator Tree và chuỗi tham chiếu tới GC Roots lần lượt có tác dụng gì?
- JFR, JMC và VisualVM phù hợp để quan sát những thông tin runtime nào? Khi thu thập trực tiếp trên hệ thống đang chạy cần cân nhắc chi phí (overhead) gì?

Việc tạo Heap Dump, class histogram hoặc lấy mẫu tần suất cao đều có thể làm tăng tải trên production, đồng thời tệp Dump cũng có thể chứa dữ liệu nghiệp vụ. Trước khi chạy lệnh chẩn đoán cần xác nhận phạm vi ảnh hưởng, dung lượng ổ đĩa và vị trí lưu tệp; trước khi khởi động lại khẩn cấp, tối thiểu phải giữ lại thời điểm cảnh báo, các chỉ số trọng yếu, thread stack và thông tin GC cần thiết.

## Xử lý sự cố JVM trên Production

Xử lý sự cố production thường không có đáp án kiểu "chỉ một lệnh là định vị ra ngay". Sau khi nhận cảnh báo, trước tiên hãy đối chiếu thời gian, phạm vi ảnh hưởng, các thay đổi gần nhất và tài nguyên hệ thống, rồi mới quyết định thu thập thread stack, GC log hay heap dump. Nếu dịch vụ đã ảnh hưởng tới người dùng, cần sắp xếp song song việc xử lý cầm máu và lưu giữ bằng chứng, không thể vì cố bắt đủ bằng chứng mà để sự cố lan rộng thêm.

Nội dung liên quan: [Xử lý sự cố trên môi trường Production cho Java Backend](./jvm-in-action.md)

Câu hỏi phỏng vấn thường gặp:

- Khi CPU tăng vọt, làm sao định vị từ tiến trình xuống tới Thread và đoạn stack code cụ thể?
- CPU không cao nhưng Load rất cao, cần kiểm tra những trạng thái Thread và chỉ số hệ thống nào?
- API phản hồi rất chậm nhưng tỷ lệ sử dụng CPU bình thường, làm sao phân biệt giữa chờ lock, I/O, connection pool và độ trễ từ dịch vụ hạ nguồn (downstream)?
- Khi bộ nhớ tăng liên tục, làm sao phân biệt đó là cache nghiệp vụ tăng trưởng, tốc độ cấp phát đối tượng quá nhanh hay rò rỉ bộ nhớ (Memory Leak)?
- Sau khi tiến trình Java gặp `OOM`, làm sao xác định vấn đề xảy ra ở Heap, Metaspace, Direct Memory hay bộ nhớ native?
- Young GC diễn ra rất thường xuyên nhưng mỗi lần thu gom lại rất nhanh, nên kiểm tra trọng tâm những gì?
- Khi Full GC diễn ra thường xuyên, quan sát sự tăng trưởng của Old Generation, việc thăng cấp đối tượng và hiệu quả thu hồi như thế nào?
- Nên tạo Heap Dump vào thời điểm nào? Chạy trực tiếp `jmap -dump` trên môi trường production có rủi ro gì?
- Hàng đợi của Thread Pool bị tồn đọng có mối liên hệ gì với mức sử dụng CPU và trạng thái của các Thread?
- Sau khi sửa lỗi JVM, nên đối chiếu những chỉ số nào để xác nhận thay đổi có hiệu quả?
- Trong phỏng vấn, nên trình bày như thế nào về một câu hỏi xử lý sự cố JVM mà mình chưa từng trực tiếp trải qua?

Kết quả điều tra phải tạo thành một chuỗi bằng chứng chặt chẽ. Chẳng hạn khi CPU tăng vọt, trước hết tìm tiến trình Java và Thread chiếm CPU cao, chuyển đổi Thread ID sang định dạng dùng trong thread dump, rồi đối chiếu nhiều bản thread dump liên tiếp xem stack có liên tục rơi vào cùng một đoạn mã hay không. Các vấn đề bộ nhớ cần kết hợp GC log, object histogram, Heap Dump và bộ nhớ native — chỉ nhìn mỗi tỷ lệ sử dụng JVM Heap không thể bao quát hết mọi trường hợp `OOM`.

## Lên kế hoạch ôn tập theo quỹ thời gian chuẩn bị

| Thời gian còn lại | Lộ trình gợi ý | Mục tiêu ôn tập |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1–2 ngày | Đọc lướt một lượt [Tổng hợp câu hỏi phỏng vấn JVM thường gặp](https://interview.javaguide.cn/java/java-jvm.html), ưu tiên bù đắp phần vùng nhớ, khởi tạo đối tượng, Class Loading, xác định đối tượng còn sống và các bộ thu gom rác phổ biến | Trả lời được các câu hỏi nền tảng tần suất cao, nắm được mỗi kết luận gắn với phiên bản JDK và bộ thu gom nào |
| 3–7 ngày | Bổ sung tham số JVM, GC log và công cụ chẩn đoán JDK; tự tập diễn giải bằng miệng quy trình xử lý sự cố CPU tăng vọt, `OOM` và Full GC liên tục | Từ hiện tượng cảnh báo chọn được chỉ số và công cụ phù hợp, đồng thời nêu rõ được rủi ro thao tác |
| Trên 1 tuần | Đọc toàn bộ các bài chuyên đề JVM, tự phân tích một GC log, thread dump hoặc Heap Dump trên máy cá nhân hoặc môi trường test; gắn với dự án thực tế để ghi chép lại JDK, bộ thu gom rác, cấu hình Heap và chỉ số vận hành thực tế | Kết nối xuyên suốt được nguyên lý, cấu hình, hiện tượng vận hành và phương pháp kiểm chứng |

Các vị trí tuyển dụng có kinh nghiệm và cấp độ trung/cao cấp thường hỏi xoáy sâu hơn vào căn cứ chọn tham số và bằng chứng điều tra sự cố. Nếu chưa từng trực tiếp xử lý sự cố JVM trên production, bạn có thể trả lời dựa trên quan sát ở môi trường test và tài liệu chuyên đề, nêu rõ mình sẽ thu thập gì trước và thu hẹp phạm vi ra sao — đừng biến các ví dụ học tập thành sự cố production do chính mình từng trải qua.
