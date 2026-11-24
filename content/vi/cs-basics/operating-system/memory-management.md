---
title: "Giải mã quản lý bộ nhớ hệ điều hành: Phân trang, Phân đoạn, Thay thế trang, Swap và OOM"
description: "Tổng hợp câu hỏi phỏng vấn tần suất cao về quản lý bộ nhớ hệ điều hành, từ VSZ/RSS/PSS, cấp phát liên tục và phân mảnh bộ nhớ, giải thích chi tiết buddy system, phân trang, phân đoạn, bảng trang, TLB, lỗi thiếu trang (Page Fault), thuật toán thay thế trang, Swap, Overcommit, OOM, mmap, COW và Huge Pages."
category: Kiến thức cơ sở máy tính
tag:
  - Hệ điều hành
  - Quản lý bộ nhớ
head:
  - - meta
    - name: keywords
      content: Quản lý bộ nhớ hệ điều hành,quản lý bộ nhớ,câu hỏi phỏng vấn quản lý bộ nhớ,quản lý bộ nhớ Linux,bộ nhớ ảo,phân trang,phân đoạn,bảng trang,TLB,lỗi thiếu trang,thay thế trang,Swap,buddy system,Overcommit,OOM,mmap,COW,Huge Pages,câu hỏi phỏng vấn hệ điều hành
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/memory-management.md
---

Khi mở thông tin bộ nhớ của một Process thông thường, bạn sẽ thấy rất nhiều con số có vẻ trái ngược với trực giác: Process sở hữu không gian địa chỉ ảo của riêng mình với phạm vi địa chỉ rất lớn; bộ nhớ vật lý thực sự bị chiếm dụng lại là một chuyện hoàn toàn khác; và cùng một thư viện động (shared library) lại có thể được chia sẻ đồng thời bởi nhiều Process.

Khi lập trình, mã nguồn chỉ đơn thuần đọc ghi các địa chỉ. Tuy nhiên, đứng ở góc độ hệ điều hành, nó phải đối mặt với một loạt bài toán rất cụ thể: Vùng bộ nhớ này cấp cho ai? Có thể để Process khác chạm vào không? Khi bộ nhớ vật lý thiếu hụt thì đẩy trang nào ra ngoài? Những lỗ trống để lại sau khi giải phóng có còn tái sử dụng được không?

Đó chính là những gì mà cơ chế quản lý bộ nhớ phải giải quyết. Tôi khuyên bạn đừng vội vàng học vẹt các thuật ngữ như phân trang, phân đoạn hay TLB ngay từ đầu, mà hãy nắm chắc một sợi dây cốt lõi: **Hệ điều hành cô lập địa chỉ mà chương trình nhìn thấy với bộ nhớ vật lý thực tế, sau đó dùng các cơ chế cấp phát, ánh xạ, bảo vệ và thu hồi để quản lý toàn diện bộ nhớ.**

## VSZ, RSS và PSS đại diện cho điều gì?

Trong Linux, các con số thống kê bộ nhớ của Process là thứ dễ gây hiểu lầm nhất. Chỉ số `VSZ` trong lệnh `ps` hay `VmSize` trong `/proc/<pid>/status` đại diện cho kích thước không gian địa chỉ ảo mà Process đã ánh xạ. Nó có thể bao gồm các vùng ánh xạ ẩn danh (anonymous mapping) chưa thực sự cư trú trong RAM, ánh xạ file, thư viện chia sẻ và các dải địa chỉ được đặt trước. Do đó, không thể coi VSZ là dung lượng bộ nhớ vật lý thực tế đang chiếm dụng.

`RSS` (Resident Set Size) biểu thị tổng dung lượng các trang hiện đang thực sự cư trú trong RAM vật lý và được ánh xạ tới Process đó. Các thư viện chia sẻ, bộ nhớ chia sẻ và các trang dùng chung trong Page Cache cũng được tính vào RSS của từng Process liên quan, vì vậy nếu cộng dồn trực tiếp RSS của nhiều Process với nhau, bạn sẽ gặp tình trạng trùng lặp số liệu.

`PSS` (Proportional Set Size) phù hợp hơn rất nhiều để ước tính mức chiếm dụng vật lý chia sẻ theo tỷ lệ thực tế của một Process. Nếu một trang vật lý được chia sẻ bởi 4 Process, thì PSS của mỗi Process chỉ tính một phần tư trang đó. Khi cần xem số liệu tổng hợp, bạn có thể dùng:

```bash
grep -E 'VmSize|VmRSS|RssAnon|RssFile|RssShmem|VmSwap' /proc/<pid>/status
cat /proc/<pid>/smaps_rollup
```

`smaps_rollup` sẽ đưa ra số liệu tổng hợp ở cấp độ Process; nếu muốn phân tích chi tiết từng đoạn ánh xạ, bạn hãy xem `/proc/<pid>/smaps`. Tuy nhiên, việc đọc toàn bộ file `smaps` đầy đủ sẽ duyệt qua toàn bộ VMA và bảng trang của Process, do đó cần hết sức thận trọng khi thu thập dữ liệu với tần suất cao trên môi trường Production.

## Quản lý bộ nhớ chịu trách nhiệm chính cho những việc gì?

Dưới góc nhìn của hệ điều hành, quản lý bộ nhớ phải đảm nhiệm ít nhất 5 trọng trách:

![Tổng quan trách nhiệm quản lý bộ nhớ](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-management-responsibilities-33a411e9.webp)

**Thứ nhất, cấp phát và thu hồi bộ nhớ.** Các hàm `malloc()`/`free()` ở User Space chịu trách nhiệm quản lý các khối bộ nhớ trong Heap của Process. Lấy ví dụ với glibc, bộ cấp phát (allocator) khi cần thiết sẽ mở rộng vùng địa chỉ ảo khả dụng thông qua các giao diện hệ thống như `brk()` hoặc `mmap()`. Sau khi vùng địa chỉ ảo được thiết lập, các trang vật lý thường chỉ được cấp phát thực sự khi có truy cập đầu tiên thông qua cơ chế Page Fault. Bên trong Kernel, việc quản lý các trang vật lý và đối tượng Kernel được thực hiện thông qua bộ cấp phát trang (page allocator) kết hợp cùng bộ cấp phát đối tượng như SLAB/SLUB.

**Thứ hai, thực hiện chuyển đổi địa chỉ (Address Translation).** Chương trình truy cập vào địa chỉ ảo, nhưng dữ liệu thực sự ghi vào thanh RAM lại là địa chỉ vật lý. Đơn vị MMU (Memory Management Unit) bên trong CPU sẽ phối hợp cùng bảng trang (Page Table) và TLB để dịch địa chỉ ảo thành địa chỉ vật lý.

**Thứ ba, thực hiện cô lập Process và kiểm soát quyền hạn.** Mỗi Process sở hữu một không gian địa chỉ riêng biệt. Địa chỉ `0x1000` trong Process A và `0x1000` trong Process B hoàn toàn có thể ánh xạ tới các trang vật lý hoàn toàn khác nhau. Ngoài ra, mỗi mục trong bảng trang (PTE) còn đánh dấu các cờ quyền hạn như đọc, ghi, thực thi; mọi truy cập vượt quyền sẽ lập tức kích hoạt ngoại lệ phần cứng.

**Thứ tư, thu hồi trang khi bộ nhớ vật lý cạn kiệt.** Các trang file sạch (clean file pages) có thể được loại bỏ trực tiếp và đọc lại từ đĩa khi cần; các trang file bẩn (dirty file pages) thường phải được ghi ngược lại đĩa trước; còn các trang ẩn danh (anonymous pages) nếu muốn thu hồi thì thông thường phải được ghi ra phân vùng Swap. Linux sẽ kết hợp các yếu tố như độ "nóng/lạnh" của trang, tỷ lệ refault, mực nước bộ nhớ (memory watermarks), cgroup và tham số `swappiness` để lựa chọn đối tượng thu hồi, chứ không cứng nhắc cố định luôn thu hồi một loại trang nào trước.

**Thứ năm, hỗ trợ chia sẻ và ánh xạ bộ nhớ.** Chia sẻ thư viện động, IPC bộ nhớ chia sẻ, ánh xạ file qua `mmap()`, cơ chế sao chép khi ghi (Copy-On-Write - COW) đều phụ thuộc vào năng lực cốt lõi: "ánh xạ nhiều địa chỉ ảo về cùng một tập hợp các trang vật lý".

## Sẽ ra sao nếu không có cơ chế trừu tượng hóa bộ nhớ?

Trong các hệ thống máy tính sơ khai hoặc các hệ thống nhúng rất nhỏ, chương trình có thể truy cập trực tiếp vào địa chỉ vật lý. Khi chỉ chạy một chương trình duy nhất, cách tiếp cận này vẫn có thể chấp nhận được; nhưng ngay khi nhiều chương trình chạy đồng thời, thảm họa sẽ lập tức ập đến.

Giả sử chương trình A ghi dữ liệu vào địa chỉ vật lý 1000, chương trình B cũng tình cờ đặt biến của mình tại địa chỉ vật lý 1000. Hai chương trình hoàn toàn không biết đến sự tồn tại của nhau, kết quả là chương trình nào ghi sau sẽ đè nát dữ liệu của chương trình ghi trước. Tệ hơn nữa, một chương trình người dùng bình thường cũng có thể vô tình ghi đè vào vùng bộ nhớ của chính hệ điều hành, khiến độ ổn định của toàn hệ thống bị phá hủy hoàn toàn.

Giải pháp ở đây là đưa vào khái niệm **Không gian địa chỉ (Address Space)**. Mỗi Process nhìn thấy một tập hợp địa chỉ riêng biệt của chính mình, thông thường bao gồm đoạn mã (code segment), đoạn dữ liệu (data segment), Heap, Stack và vùng ánh xạ bộ nhớ. Process chỉ làm việc với địa chỉ ảo, còn các trang vật lý thực tế sẽ do hệ điều hành và phần cứng cùng nhau quyết định.

Nhờ đó, các cơ chế cô lập Process, nạp trang theo yêu cầu (on-demand paging), bộ nhớ chia sẻ và COW mới có điểm tựa vững chắc để hiện thực hóa.

## Cấp phát bộ nhớ liên tục và vấn đề phân mảnh

Phương thức cấp phát bộ nhớ trực quan và dễ hiểu nhất là cấp phát liên tục: một Process cần bao nhiêu bộ nhớ, hệ điều hành sẽ tìm đúng một khối bộ nhớ vật lý liên tục có dung lượng tương ứng để cấp cho nó. Các hệ thống thời kỳ đầu thường dùng phương pháp phân vùng cố định (fixed partitioning) hoặc phân vùng động (dynamic partitioning).

Điểm yếu chí mạng của cấp phát liên tục chính là hiện tượng phân mảnh.

![Cấp phát bộ nhớ liên tục và phân mảnh](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-fragmentation-953d5791.webp)

**Phân mảnh nội vi (Internal Fragmentation)** là phần không gian đã được cấp phát cho Process nhưng thực tế không được sử dụng hết. Ví dụ hệ thống cấp phát theo đơn vị cố định 128 byte, một đối tượng chỉ cần 65 byte, thì 63 byte còn lại bị lãng phí vô ích ngay bên trong đơn vị cấp phát đó.

**Phân mảnh ngoại vi (External Fragmentation)** xảy ra khi tổng dung lượng bộ nhớ trống là đủ, nhưng lại nằm rải rác không liên tục, dẫn đến việc không thể đáp ứng được yêu cầu cấp phát một khối liên tục dung lượng lớn. Ví dụ trong bộ nhớ có hai vùng trống, mỗi vùng 128 MB, tổng cộng có 256 MB trống; nhưng bây giờ cần xin một vùng liên tục 200 MB thì hệ thống vẫn buộc phải báo thất bại.

Các chiến lược cấp phát phân vùng động phổ biến bao gồm First Fit, Best Fit, Worst Fit. Chúng có thể thay đổi vị trí và tốc độ phát sinh phân mảnh, nhưng không thể loại bỏ tận gốc phân mảnh ngoại vi. Kỹ thuật dồn bộ nhớ (Memory Compaction) sẽ di chuyển các trang có thể dịch chuyển để gom các trang trống rải rác thành các vùng vật lý liên tục lớn hơn. Việc này không đồng nhất với Swap I/O, nhưng compaction đồng bộ có thể ngốn CPU, di dời khối lượng lớn trang nhớ và gây ra hiện tượng spike về độ trễ.

## Buddy System của Linux giải quyết vấn đề gì?

Khi quản lý các trang vật lý, Linux sử dụng **Buddy System** (hệ thống bạn bè). Nó tổ chức bộ nhớ trống theo các khối có kích thước là lũy thừa của 2, chẳng hạn 4 KB, 8 KB, 16 KB, 32 KB... Khi có yêu cầu cấp phát bộ nhớ, trước tiên nó tìm khối nhỏ nhất đủ để đáp ứng yêu cầu; nếu khối tìm được quá lớn, nó sẽ liên tục chia đôi khối đó; khi giải phóng, nếu khối "buddy" liền kề cũng đang rảnh rỗi, chúng sẽ được gộp lại thành khối lớn hơn.

Ưu điểm của thiết kế này là quy tắc chia tách và hợp nhất cực kỳ đơn giản, giúp tìm kiếm nhanh các trang vật lý liên tục và giảm thiểu đáng kể phân mảnh ngoại vi.

Tuy nhiên, nó cũng gây ra lãng phí nội vi nhất định: đơn vị cấp phát của Buddy System là $2^{\text{order}}$ trang vật lý liên tục. Lấy trang cơ sở 4 KB làm ví dụ, nếu phía Kernel cần ít nhất 65 KB bộ nhớ vật lý liên tục, nó có thể phải cấp phát 32 trang, tức một khối order-5 có kích thước 128 KB, dẫn đến lãng phí bên trong. Lưu ý rằng ví dụ này mô tả việc cấp phát trang vật lý liên tục ở cấp độ Kernel; nó không đồng nghĩa với việc người dùng gọi `malloc(65KB)` thì chắc chắn sẽ trực tiếp chiếm dụng nguyên một khối buddy 128 KB.

Ngoài ra, Buddy System quản lý bộ nhớ vật lý chủ yếu theo đơn vị trang (page). Trong Kernel còn tồn tại một lượng khổng lồ các đối tượng có kích thước nhỏ hơn rất nhiều so với một trang, ví dụ như struct file, inode, cấu trúc bộ đệm mạng... Nếu mỗi lần đều xin cấp phát theo đơn vị trang thì sẽ cực kỳ lãng phí. Linux đã đặt lên trên Buddy System các bộ cấp phát như SLAB/SLUB, có nhiệm vụ tạo cache và tái sử dụng các khối bộ nhớ dựa trên kích thước đối tượng, từ đó giảm chi phí cấp phát, khởi tạo và giải phóng liên tục.

## Phân đoạn, Phân trang và Phân đoạn kết hợp Phân trang khác nhau thế nào?

Không gian địa chỉ không bắt buộc chỉ chia theo một cách duy nhất. Trong giáo trình hệ điều hành, người ta thường phân biệt ba phương pháp: phân đoạn (segmentation), phân trang (paging), và phân đoạn kết hợp phân trang (segmented paging).

| Phương thức | Căn cứ phân chia | Cấu trúc địa chỉ | Ưu điểm | Vấn đề chính |
| --- | --- | --- | --- | --- |
| **Phân đoạn** | Chia theo logic chương trình: đoạn mã, đoạn dữ liệu, đoạn Stack | Số hiệu đoạn + Độ lệch trong đoạn (offset) | Sát với cấu trúc chương trình, thuận tiện chia sẻ và bảo vệ | Độ dài đoạn không cố định, dễ gây phân mảnh ngoại vi |
| **Phân trang** | Chia không gian địa chỉ ảo và bộ nhớ vật lý thành các khối kích thước cố định | Số hiệu trang + Độ lệch trong trang (offset) | Bộ nhớ vật lý có thể cấp phát rời rạc, giảm phân mảnh ngoại vi từ cấp phát liên tục | Bảng trang tốn dung lượng, trang cuối cùng có thể gặp phân mảnh nội vi |
| **Phân đoạn kết hợp Phân trang** | Trước tiên phân đoạn theo logic, sau đó chia nhỏ từng đoạn thành các trang | Số hiệu đoạn + Số hiệu trang trong đoạn + Độ lệch trong trang | Kết hợp cả bảo vệ theo logic và cấp phát rời rạc | Quá trình chuyển đổi địa chỉ phức tạp hơn |

Các hệ điều hành đa năng hiện đại chủ yếu dựa vào phân trang để quản lý bộ nhớ. Lấy x86 làm ví dụ, về mặt lịch sử phần cứng hỗ trợ cả phân đoạn lẫn phân trang; nhưng ở chế độ Long Mode trên x86-64, không gian địa chỉ người dùng thông thường trong Linux chủ yếu dựa vào phân trang, các đoạn mã và dữ liệu truyền thống cơ bản áp dụng Flat Memory Model. Tuy nhiên, các thanh ghi FS/GS vẫn giữ vai trò thực tế nhất định, chẳng hạn FS thường được dùng để lưu trữ dữ liệu cục bộ của Thread ở User Space (TLS - Thread-Local Storage).

Cũng cần bổ sung một điểm tinh tế hay bị lược bỏ trong sách vở: phân trang chỉ loại bỏ phân mảnh ngoại vi phát sinh từ việc cấp phát liên tục không gian địa chỉ Process, chứ không làm triệt tiêu vấn đề phân mảnh của bản thân bộ nhớ vật lý. Các thiết bị DMA, Huge Pages và một số lời gọi cấp phát trong Kernel vẫn có thể đòi hỏi các trang vật lý liên tục. Do đó, ngay cả khi tổng dung lượng bộ nhớ trống còn dồi dào, các yêu cầu xin cấp phát trang liên tục bậc cao (high-order pages) vẫn có thể thất bại, và Kernel vẫn cần đến cơ chế hợp nhất buddy cùng memory compaction.

## Phân trang thực hiện chuyển đổi địa chỉ như thế nào?

Phân trang chia không gian địa chỉ ảo thành các trang ảo (Virtual Page) có kích thước cố định, đồng thời chia bộ nhớ vật lý thành các khung trang (Page Frame) có cùng kích thước. Trên các hệ thống Linux x86-64 thông dụng, một trang thường có kích thước 4 KB, tuy nhiên kích thước trang cụ thể còn tùy thuộc vào kiến trúc phần cứng.

Một địa chỉ ảo có thể tách thành hai phần:

- **Số hiệu trang ảo (Virtual Page Number - VPN)**: Dùng để tra cứu bảng trang nhằm tìm ra khung trang vật lý tương ứng.
- **Độ lệch trong trang (Page Offset)**: Xác định vị trí byte cụ thể bên trong trang đó.

Quy trình chuyển đổi địa chỉ diễn ra đại thể như sau: CPU phát ra địa chỉ ảo, MMU tách lấy số hiệu trang ảo để tra cứu trong bảng trang, thu về số hiệu khung trang vật lý, sau đó ghép nối với độ lệch trong trang để tạo thành địa chỉ vật lý cuối cùng.

![Chuyển đổi địa chỉ ảo sang địa chỉ vật lý](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-address-translation-b8c95e07.webp)

Một mục trong bảng trang (Page Table Entry - PTE) không chỉ lưu số hiệu khung trang vật lý mà còn lưu giữ rất nhiều bit trạng thái, chẳng hạn bit present, quyền đọc/ghi, đặc quyền user/kernel, bit dirty, bit accessed... Bit present cho biết trang hiện đã nằm trong bộ nhớ vật lý hay chưa; các bit quyền hạn dùng để bảo vệ an toàn bộ nhớ; còn bit accessed và dirty sẽ tham gia vào thuật toán quyết định thu hồi trang.

## Vì sao cần Bảng trang đa cấp (Multi-Level Page Table)?

Bảng trang đơn cấp (Single-level Page Table) rất dễ hiểu, nhưng chi phí không gian của nó là quá đắt đỏ.

Lấy ví dụ không gian địa chỉ 32-bit với kích thước trang 4 KB: một Process có 4 GB không gian địa chỉ ảo, cần $4\text{ GB} / 4\text{ KB} = 2^{20}$ mục trong bảng trang. Nếu mỗi mục PTE tốn 4 byte, bảng trang của chỉ một Process đã ngốn khoảng 4 MB. Khi số lượng Process tăng lên hàng trăm, lượng bộ nhớ này trở nên vô cùng đáng kể.

Nghiêm trọng hơn nữa, hầu hết các Process không bao giờ sử dụng hết toàn bộ không gian địa chỉ ảo của mình. Thế nhưng bảng trang đơn cấp lại bắt buộc phải tạo sẵn chỗ cho toàn bộ không gian đó, khiến đại đa số các mục đều bị bỏ trống hoàn toàn.

Giải pháp của bảng trang đa cấp là phân tầng: bảng trang cấp cao nhất bao quát toàn bộ không gian địa chỉ ảo, còn các bảng trang cấp thấp hơn chỉ được tạo ra khi thực sự có nhu cầu (on-demand). Nếu một dải địa chỉ ảo hoàn toàn không được dùng đến, bảng trang cấp con tương ứng sẽ không bao giờ được cấp phát. Mã nguồn bảng trang độc lập kiến trúc của Linux được thiết kế theo 5 tầng phân cấp; nếu kiến trúc phần cứng hoặc cấu hình máy không dùng hết các tầng, các tầng dư thừa sẽ được "gấp lại" (folded).

![Bảng trang đa cấp tạo theo nhu cầu](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-multilevel-page-table-113587f1.webp)

Trên kiến trúc x86-64, cấu hình truyền thống thường sử dụng phân trang 4 cấp; chỉ khi CPU, Kernel và cấu hình cùng hỗ trợ LA57 thì mới kích hoạt phân trang 5 cấp. Tài liệu Linux giải thích rằng phân trang 5 cấp cho phép mở rộng không gian địa chỉ ảo của User Space lên tới 56 bit; tuy nhiên, để tương thích với các chương trình tận dụng các bit bậc cao của con trỏ (pointer tagging), theo mặc định Kernel sẽ không chủ động cấp phát địa chỉ ảo vượt quá ngưỡng 47 bit trừ khi ứng dụng đưa ra gợi ý yêu cầu địa chỉ bậc cao một cách tường minh.

## Vì sao TLB lại tối quan trọng?

Bảng trang đa cấp tiết kiệm được không gian bộ nhớ, nhưng cái giá phải trả là khiến mỗi lần chuyển đổi địa chỉ phải truy cập bộ nhớ thêm nhiều lần. Trước mỗi lần đọc/ghi dữ liệu mà phải tra cứu đầy đủ qua nhiều cấp bảng trang thì chi phí thời gian là quá lớn.

TLB (Translation Lookaside Buffer - thường gọi là bộ nhớ đệm chuyển đổi nhanh) đóng vai trò là bộ nhớ cache phần cứng lưu trữ các mục bảng trang, nằm trực tiếp bên trong MMU của CPU. Khi CPU truy cập bộ nhớ, nó sẽ kiểm tra TLB trước tiên:

- **TLB Hit**: Lấy trực tiếp số hiệu khung trang vật lý mà không cần đọc bảng trang trong RAM.
- **TLB Miss**: Bắt buộc phải duyệt qua các cấp bảng trang trong bộ nhớ, tìm thấy kết quả thì đưa vào nạp lại cho TLB để phục vụ các lần truy cập sau.

Các chương trình khi truy cập bộ nhớ đều có tính cục bộ (Locality of Reference): trang vừa mới truy cập thì khả năng cao sẽ tiếp tục được truy cập trong chốc lát; truy cập một địa chỉ thì các địa chỉ lân cận cũng dễ được chạm tới. TLB được hưởng lợi trọn vẹn từ tính cục bộ không gian và thời gian này.

Đây cũng là một trong những lý do khiến Huge Pages (trang kích thước lớn) phát huy giá trị. Với trang 4 KB thông thường, một mục TLB chỉ che phủ được 4 KB; nếu dùng Huge Page 2 MB, một mục TLB có thể bao quát phạm vi địa chỉ lớn hơn rất nhiều, giúp giảm mạnh tỷ lệ TLB miss. Mặc dù vậy, Huge Pages cũng kéo theo chi phí cấp phát và thu hồi lớn hơn. Việc các ứng dụng như cơ sở dữ liệu hay JVM có nên bật Transparent Huge Pages (THP) hoặc HugeTLB hay không cần phải được đo đạc kỹ lưỡng theo mục tiêu độ trễ và thông lượng thực tế.

## Lỗi thiếu trang (Page Fault) diễn ra như thế nào?

Bộ nhớ ảo không nạp toàn bộ các trang vào RAM vật lý ngay khi Process vừa khởi động. Rất nhiều trang chỉ được tải vào khi có lần truy cập đầu tiên, cơ chế này gọi là Demand Paging (nạp trang theo yêu cầu).

Page Fault là một ngoại lệ bộ xử lý (processor exception) xảy ra đồng bộ với lệnh hiện tại đang thực thi, chứ không phải là ngắt phần cứng (hardware interrupt) bất đồng bộ từ thiết bị ngoại vi gửi tới.

Khi một Process truy cập vào một trang ảo nào đó mà MMU không tìm thấy bản dịch hợp lệ, nó sẽ kích hoạt ngoại lệ Page Fault và chuyển quyền điều khiển vào Kernel để xử lý. Trước tiên, Kernel kiểm tra xem địa chỉ truy cập có rơi vào một vùng VMA hợp lệ hay không, đồng thời đối chiếu quyền truy cập. Truy cập vào địa chỉ bất hợp pháp hoặc vi phạm quyền hạn thường sẽ chuyển thành tín hiệu `SIGSEGV`; còn các lỗi thiếu trang hợp lệ sẽ được xử lý dựa trên loại ánh xạ: có thể ánh xạ trang đã có sẵn trong Page Cache, khởi tạo trang zero ẩn danh, kích hoạt sao chép Copy-On-Write (COW), cấp phát trang mới, hoặc đọc dữ liệu từ file hay phân vùng Swap. Sau khi xử lý xong, Kernel cập nhật lại bảng trang và cho CPU thực thi lại đúng câu lệnh vừa bị lỗi ban nãy.

Hàm `getrusage(2)` trong Linux chia thống kê Page Fault thành hai nhóm chính:

- **Minor Page Fault (lỗi trang nhẹ - `minflt`)**: Quá trình xử lý không đòi hỏi thao tác đĩa I/O. Ví dụ trang dữ liệu thực ra đã nằm sẵn trong bộ nhớ vật lý, chỉ là Process hiện tại chưa thiết lập ánh xạ; thao tác nhân bản trang khi kích hoạt COW cũng thường rơi vào nhánh này.
- **Major Page Fault (lỗi trang nặng - `majflt`)**: Quá trình xử lý đòi hỏi đọc ghi I/O, chẳng hạn phải đọc trang dữ liệu từ file trên đĩa hoặc từ phân vùng Swap vào.

Major fault chậm hơn rất nhiều so với minor fault. Khi điều tra các vấn đề hiệu năng bộ nhớ trên Production, chỉ số `majflt` tăng vọt thường là tín hiệu cảnh báo đáng lo ngại hơn nhiều so với `minflt`.

## Thay thế trang: Khi thiếu bộ nhớ thì đẩy ai ra ngoài?

Khi bộ nhớ vật lý đã đầy mà cần nạp trang mới vào, hệ thống buộc phải thu hồi một số trang cũ. Bài toán mà thuật toán thay thế trang phải giải quyết rất rõ ràng: khi thiếu bộ nhớ, nên hoán đổi trang nào ra ngoài trước để giảm thiểu tối đa ảnh hưởng đến các lần truy cập tiếp theo?

![So sánh các thuật toán thay thế trang](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-page-replacement-f68a779f.webp)

Thuật toán lý tưởng nhất là **OPT (Optimal)**: đẩy trang mà trong tương lai sẽ không được dùng tới trong khoảng thời gian lâu nhất. Nó chỉ đóng vai trò là mốc giới hạn lý thuyết vì hệ điều hành không thể tiên tri tương lai. **FIFO (First-In First-Out)** dễ cài đặt nhất, trang nào vào bộ nhớ trước thì ra trước, nhưng nó hoàn toàn không quan tâm trang đó có còn "nóng" hay không, thậm chí còn gặp phải hiện tượng dị thường Belady (Belady's Anomaly): khi cấp thêm khung trang, số lần lỗi trang lại có thể tăng lên.

Trực giác của **LRU (Least Recently Used)** sát với hành vi thực tế của chương trình hơn: trang nào đã lâu nhất không được truy cập thì khả năng cao sắp tới cũng chưa cần dùng. Điểm khó nằm ở chi phí hiện thực, việc duy trì thứ tự truy cập chính xác cho từng trang là quá tốn kém. Thuật toán **CLOCK (Second Chance)** ra đời như một giải pháp dung hòa: nó sử dụng một bit truy cập (reference bit) và danh sách vòng tròn để cho mỗi trang "cơ hội thứ hai", xấp xỉ LRU với chi phí rất rẻ. **LFU (Least Frequently Used)** đi theo hướng khác, loại bỏ trang dựa trên tần suất truy cập; tuy nhiên nếu không có cơ chế suy giảm (decay), các trang từng là điểm nóng trong quá khứ có thể chiếm giữ vị trí mãi mãi dù hiện tại đã không còn ai dùng.

Thực tế nhân Linux không áp dụng rập khuôn bất kỳ thuật toán sách giáo khoa nào. Luồng thu hồi kinh điển sử dụng danh sách LRU kép (Active/Inactive LRU) tách biệt cho File Pages và Anonymous Pages, kết hợp các cơ chế workingset và refault để nhận diện trang nóng/lạnh; các Kernel đời mới còn có thể bật Multi-Gen LRU (MGLRU) để biểu diễn độ mới của trang qua nhiều thế hệ truy cập. Các trang file, trang ẩn danh, cgroup, NUMA, và các mực nước bộ nhớ đều chi phối tiến trình thu hồi trang, tùy thuộc vào phiên bản Kernel và cấu hình hệ thống.

![Tư tưởng thu hồi trang trong Linux](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-page-reclaim-208f962f.webp)

Vì vậy, việc mô tả cơ chế thu hồi trang của Linux chỉ bằng tên một thuật toán duy nhất là không chính xác. Đó là một tổ hợp các chiến lược xoay quanh việc bảo vệ Working Set, nhận diện trang nóng/lạnh và kiểm soát mực nước bộ nhớ.

## Swap, Working Set và hiện tượng Trì trệ (Thrashing)

Swap không phải là "bộ nhớ RAM nở thêm ra", mà giống như một vùng lưu trữ dự phòng tốc độ thấp. Các trang ẩn danh (anonymous pages) không có nguồn gốc từ file, nên khi bộ nhớ căng thẳng, nếu muốn giải phóng chúng, hệ thống sẽ ghi chúng ra Swap; sau này khi cần truy cập lại thì mới đọc từ Swap về.

Tập hợp các trang thực sự đang hoạt động tích cực của một Process được gọi là **Working Set** (tập làm việc). Chừng nào bộ nhớ vật lý còn chứa đủ Working Set của các Process chủ chốt trong hệ thống, thì tần suất Page Fault vẫn nằm trong tầm kiểm soát; nếu không đủ chứa, các trang sẽ liên tục bị hoán đổi ra rồi lại nạp vào (swap out rồi swap in), khiến hệ thống rơi vào trạng thái trì trệ gọi là **Thrashing** (rung lắc bộ nhớ).

Khi bị thrashing, CPU nhìn qua có thể không hề bận rộn với các tác vụ nghiệp vụ, nhưng Disk I/O, Major Page Fault và các hoạt động thu hồi trang sẽ tăng vọt rõ rệt. Khi điều tra, bạn có thể kiểm tra các chỉ số sau:

```bash
# Toàn hệ thống
free -h
vmstat 1
cat /proc/meminfo
cat /proc/pressure/memory
grep -E 'pgfault|pgmajfault|pswpin|pswpout|pgscan|pgsteal' /proc/vmstat

# Từng Process riêng biệt
grep -E 'VmSize|VmRSS|RssAnon|RssFile|RssShmem|VmSwap' /proc/<pid>/status
cat /proc/<pid>/smaps_rollup
pmap -x <pid>
perf stat -e page-faults,major-faults <command>

# Container / cgroup v2
cat /sys/fs/cgroup/memory.current
cat /sys/fs/cgroup/memory.max
cat /sys/fs/cgroup/memory.events
cat /sys/fs/cgroup/memory.pressure
```

Khi đọc các chỉ số này, hãy bóc tách theo nguồn gốc: ở cấp Process, nhìn vào RSS/PSS và `smaps_rollup` để xác định bộ nhớ thường trú nằm ở trang ẩn danh, trang file hay bộ nhớ chia sẻ; ở phía Page Fault, nhìn `pgmajfault` và `major-faults` để xác định tắc nghẽn là do I/O đĩa hay chỉ là do thiết lập bảng trang; ở phía hệ thống, nhìn Swap, tốc độ quét thu hồi và PSI để xác định áp lực bộ nhớ đã lan sang gây trễ cho nghiệp vụ hay chưa.

Khi điều tra, đừng chỉ nhìn chằm chằm vào lệnh `free`. Linux sẽ cố gắng tận dụng tối đa RAM rảnh rỗi để làm Page Cache, nên chỉ số `MemFree` thấp chưa chắc đã biểu thị hệ thống đang quá tải; bạn cần đối chiếu thêm `MemAvailable`, mức độ hoạt động của Swap, major faults, hoạt động quét trang và PSI. Trong PSI, chỉ số `some` cho biết có ít nhất một tác vụ bị đình trệ do thiếu bộ nhớ, còn `full` cho biết toàn bộ các tác vụ non-idle đều đồng loạt bị khựng lại vì tài nguyên này, phản ánh chính xác hơn tác động của áp lực bộ nhớ tới độ trễ nghiệp vụ.

## Overcommit và OOM: Xin cấp phát thành công không có nghĩa RAM vật lý đã sẵn sàng

Linux cho phép tổng bộ nhớ ảo mà các Process cam kết sử dụng vượt quá tổng dung lượng RAM vật lý và Swap hiện có, cơ chế này gọi là **Memory Overcommit**. Nó phù hợp với các chương trình có xu hướng xin dải địa chỉ ảo rất lớn nhưng thực tế chỉ đụng đến một phần nhỏ trong đó.

Tham số `vm.overcommit_memory` thường có 3 chế độ:

- `0`: Phán đoán theo heuristic, từ chối các yêu cầu cấp phát vô lý rõ rệt.
- `1`: Luôn cho phép cấp phát tối đa cho đến khi cạn kiệt tài nguyên thực tế.
- `2`: Áp dụng giới hạn commit nghiêm ngặt theo công thức tỷ lệ định sẵn.

Do đó, việc gọi `malloc()` hoặc `mmap()` thành công thường chỉ mang ý nghĩa là việc cấp phát không gian địa chỉ ảo và kiểm tra commit đã vượt qua, chứ không đại diện cho việc toàn bộ các trang vật lý tương ứng đã cư trú trong RAM. Khi các trang đó thực sự bị truy cập, mà Kernel lại không thể xoay xở đủ bộ nhớ thông qua thu hồi, ghi trả đĩa hay Swap, nó có thể kích hoạt **OOM Killer**, lựa chọn Process để tiêu diệt (kill) nhằm giải phóng tài nguyên cứu hệ thống.

Trong môi trường Container, OOM trong phạm vi cgroup có thể bị kích hoạt trước. Ngay cả khi máy chủ Host vẫn còn dư thừa RAM, một container cụ thể vẫn có thể bị bóp hoặc bị kill vì chạm trần ngưỡng `memory.max`; file `memory.events` trong cgroup v2 sẽ ghi lại các sự kiện như `high`, `max`, `oom`, `oom_kill`.

## mmap, COW và Bộ nhớ chia sẻ

`mmap()` tạo ra một đoạn ánh xạ bên trong không gian địa chỉ ảo của Process. Nó có thể ánh xạ một file hoặc tạo ra ánh xạ ẩn danh (anonymous mapping). Khi ánh xạ vừa được thiết lập, dữ liệu không nhất thiết phải nạp ngay vào RAM, chỉ khi thực sự truy cập tới trang chưa cư trú thì mới kích hoạt Page Fault để tải vào.

Ánh xạ file rất phù hợp cho các kịch bản truy cập ngẫu nhiên, chia sẻ trang file, hoặc khi bạn muốn thao tác trực tiếp với nội dung file thông qua con trỏ bộ nhớ. Nó giúp giảm thiểu thao tác sao chép bộ đệm ở User Space và giảm số lần gọi system call, nhưng không đảm bảo lúc nào cũng nhanh hơn `read()`/`write()`; hiệu quả thực tế còn tùy thuộc vào mô hình truy cập, chi phí Page Fault, readahead, ghi trả đĩa, xử lý ngoại lệ và kích thước file.

Khi nhiều Process cùng ánh xạ chung một file, Kernel có thể cho phép chúng dùng chung các trang vật lý trong Page Cache. Các sửa đổi với cờ `MAP_SHARED` sẽ khả kiến với các ánh xạ khác và có thể ghi ngược xuống file gốc; trong khi `MAP_PRIVATE` tạo ra ánh xạ COW riêng tư, các thao tác ghi sẽ không lan truyền sang Process khác và cũng không ghi ngược về file gốc. IPC bộ nhớ chia sẻ cũng dựa trên tư tưởng tương tự: địa chỉ ảo của các Process khác nhau cùng trỏ về một tập hợp trang vật lý, giúp việc đọc ghi dữ liệu không cần phải sao chép qua lại qua Kernel mỗi lần.

**COW (Copy-On-Write - Sao chép khi ghi)** cũng là một cơ chế kinh điển. Sau khi `fork()`, Process cha và con ban đầu có thể dùng chung một tập hợp trang vật lý, bảng trang được đánh dấu là Read-Only; bên nào muốn ghi trước sẽ kích hoạt Page Fault, và Kernel lúc này mới nhân bản một bản sao trang vật lý mới cấp riêng cho bên ghi. Nhờ vậy tránh được chi phí nhân bản toàn bộ không gian địa chỉ ngay khi vừa gọi `fork()`.

Tuy nhiên, COW không phải là bữa trưa miễn phí. Khi Redis tạo snapshot RDB, nó sẽ `fork()` một Process con, trong khi Process cha tiếp tục tiếp nhận các lệnh ghi; càng có nhiều lệnh ghi thì số trang bị nhân bản càng nhiều, áp lực bộ nhớ càng lớn. Nắm vững điều này mới có thể giải thích được các vấn đề về độ trễ fork, mmap, Page Cache và hiện tượng spike bộ nhớ trong các hệ thống cơ sở dữ liệu và bộ nhớ đệm (cache).

## Quản lý bộ nhớ có mối liên hệ gì với Java Backend?

Quản lý bộ nhớ hệ điều hành không chỉ dừng lại trong các trang sách giáo khoa. Các kỹ sư Java Backend thường xuyên bắt gặp những hiện tượng liên quan mật thiết:

**JVM Heap chỉ là một phần của không gian địa chỉ ảo.** Tham số `-Xmx` chỉ giới hạn dung lượng tối đa của Java Heap, nhưng chỉ số RSS của Process còn bao gồm cả Metaspace, Thread Stack, JIT Code Cache, DirectBuffer, các thư viện native, và các file ánh xạ qua `mmap`. Khi thấy RSS vượt quá `-Xmx`, bạn không thể vội vàng kết luận ngay là Java Heap bị rò rỉ bộ nhớ (Memory Leak).

**Thread Stack cũng chiếm không gian địa chỉ và trang vật lý.** Khi số lượng Platform Thread quá lớn, bộ nhớ dành cho Stack, chi phí lập lịch, hiện tượng churn TLB và mất hiệu lực cache CPU đều tăng nặng. Virtual Thread (trong Project Loom) giúp giảm bớt sự phụ thuộc vào Platform Thread cho các tác vụ blocking I/O, nhưng đối với các tác vụ tiêu tốn CPU (CPU-bound), giới hạn vẫn phụ thuộc vào số lượng Core vật lý.

**DirectBuffer và mmap nằm ngoài Java Heap.** Chúng do JVM hoặc mã nguồn native quản lý, nhưng cuối cùng vẫn rơi vào không gian địa chỉ và các trang vật lý của Process. Khi truy vết bộ nhớ, bạn không thể chỉ xem log GC mà phải phối hợp kiểm tra NMT, `pmap`, `smaps_rollup`, và các chỉ số cgroup.

HotSpot Native Memory Tracking (NMT) mặc định bị tắt, muốn dùng phải thêm tham số khi khởi động JVM:

```bash
-XX:NativeMemoryTracking=summary
# hoặc
-XX:NativeMemoryTracking=detail

jcmd <pid> VM.native_memory summary
```

NMT có thể thống kê bộ nhớ native theo từng phân hệ của JVM như Java Heap, Class, Code, Thread... nhưng nó không phải là sổ cái bộ nhớ Process hoàn chỉnh ở cấp hệ điều hành, và nó không thể bao quát toàn bộ các lần cấp phát từ các thư viện native của bên thứ ba. Bạn vẫn cần phải kết hợp xem xét song song cả RSS/PSS, `smaps_rollup` và giới hạn bộ nhớ của container.

**Huge Pages không phải lúc nào cũng mang lại lợi ích.** Huge Pages có thể làm giảm áp lực cho TLB, nhưng cơ chế thu hồi trực tiếp (direct reclaim), dồn bộ nhớ (memory compaction), thao tác zeroing trang lớn và COW của THP (Transparent Huge Pages) đều có thể gây ra biến động độ trễ bất thường. Tài liệu chính thức của Redis đã cảnh báo rõ: các tác vụ ngầm RDB/AOF phụ thuộc vào `fork()` và COW, khi ghi nhiều thì bộ nhớ phụ trội có thể tăng gần gấp đôi mức bình thường; THP còn có thể khuếch đại chi phí COW sau khi `fork()`. Không thể áp dụng chung một kết luận cứng nhắc cho cả JVM, cơ sở dữ liệu và hệ thống cache; bạn luôn cần đối chiếu tài liệu sản phẩm và tiến hành kiểm thử tải (stress test) trên thực tế.

## Trả lời thế nào trong buổi phỏng vấn?

Nếu người phỏng vấn hỏi *"Quản lý bộ nhớ hệ điều hành làm những việc gì?"*, đừng vội vàng liệt kê ngay các thuật ngữ như phân trang hay phân đoạn. Hãy bắt đầu bằng mạch logic chính:

Hệ điều hành trước hết cấp cho mỗi Process một không gian địa chỉ ảo độc lập, sau đó thông qua bảng trang, TLB và MMU để dịch địa chỉ ảo thành địa chỉ vật lý. Bảng trang không chỉ làm nhiệm vụ dịch địa chỉ mà còn ghi nhận các quyền hạn, trạng thái cư trú trong RAM, cờ đánh dấu trang bẩn, và bit kiểm tra xem trang đã được truy cập hay chưa. Khi bộ nhớ vật lý cạn kiệt, Kernel sẽ căn cứ vào độ nóng/lạnh của trang, loại trang và mực nước hệ thống để thu hồi các trang file hoặc trang ẩn danh, và chỉ khi thực sự cần thiết mới dùng đến Swap.

Khi bị hỏi sâu về sự khác biệt giữa **phân trang và phân đoạn**, hãy chốt vào điểm khác nhau trong "cách chia cắt không gian địa chỉ". Phân trang chia theo kích thước cố định, giúp bộ nhớ vật lý được cấp phát rời rạc và loại bỏ hoàn toàn phân mảnh ngoại vi; phân đoạn chia theo các khối logic như mã lệnh, dữ liệu, Stack, giúp thể hiện cấu trúc chương trình trực quan hơn, nhưng độ dài đoạn không cố định nên dễ để lại phân mảnh ngoại vi. Các hệ thống hiện đại chủ yếu dựa vào phân trang, phân đoạn chủ yếu dùng để hiểu thiết kế lịch sử và bảo vệ logic.

Với **lỗi thiếu trang (Page Fault)**, hãy trình bày theo luồng xử lý: CPU truy cập vào một địa chỉ ảo, nếu mục bảng trang chưa tồn tại, trang chưa nằm trong RAM, hoặc quyền truy cập không khớp, ngoại lệ Page Fault sẽ được kích hoạt. Kernel trước tiên xác thực xem truy cập này có hợp lệ không; truy cập phi pháp sẽ chuyển thành `SIGSEGV`, còn truy cập hợp lệ sẽ tùy theo kiểu ánh xạ mà thiết lập trang tương ứng, ví dụ ánh xạ trang Page Cache sẵn có, cấp phát trang ẩn danh, xử lý COW, hoặc nạp trang từ file hay Swap. Lỗi `minor fault` thường không cần thao tác đọc đĩa I/O, trong khi `major fault` bắt buộc phải đọc đĩa I/O.

Khi nói đến kinh nghiệm thực chiến xử lý sự cố Production, hãy bổ sung thêm góc nhìn này: Các thuật ngữ trong sách giáo khoa rất tốt để hiểu nguyên lý, nhưng cơ chế thu hồi trang thực tế của Linux, THP, NUMA, giới hạn bộ nhớ của cgroup, cơ chế nén bộ nhớ và bộ đệm riêng của cơ sở dữ liệu thường chồng chéo lên nhau. Khi khoanh vùng sự cố, việc chỉ dùng một chữ "LRU" để giải thích tất cả các hiện tượng là hoàn toàn không đủ.
