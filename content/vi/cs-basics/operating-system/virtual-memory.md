---
title: "Giải mã bộ nhớ ảo: Chuyển đổi địa chỉ, TLB, Lỗi thiếu trang và Thay thế trang"
description: "Tổng hợp câu hỏi phỏng vấn tần suất cao về bộ nhớ ảo, từ cô lập Process đến phân đoạn, phân trang, bảng trang đa cấp, TLB, ngoại lệ thiếu trang (Page Fault), các thuật toán thay thế trang, dị thường Belady, cùng các kịch bản kỹ thuật thực chiến như mmap, COW và Huge Pages trong JVM."
category: Kiến thức cơ sở máy tính
tag:
  - Hệ điều hành
  - Quản lý bộ nhớ
head:
  - - meta
    - name: keywords
      content: Bộ nhớ ảo,địa chỉ ảo,địa chỉ vật lý,MMU,bảng trang,bảng trang đa cấp,TLB,lỗi thiếu trang,ngắt trang,thuật toán thay thế trang,thuật toán CLOCK,dị thường Belady,mmap,COW,câu hỏi phỏng vấn hệ điều hành
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/virtual-memory.md
---

Khi mở Task Manager hay Activity Monitor, bạn có thể bắt gặp một hiện tượng khá trái ngược với trực giác: mỗi Process dường như đều đang nắm giữ một vùng "bộ nhớ của riêng mình" vô cùng rộng lớn. Địa chỉ bên trong các Process khác nhau trông có vẻ gần như giống hệt nhau, nhưng chúng lại tuyệt nhiên không hề gây ảnh hưởng lẫn nhau. Trình duyệt web, IDE, cơ sở dữ liệu cùng chạy đồng thời, và bên nào cũng nghĩ rằng mình đang độc chiếm một khoảng không gian bộ nhớ liên tục, sạch sẽ và riêng biệt.

Điều này xảy ra không phải vì các chương trình có sự tin tưởng lẫn nhau, mà là do hệ điều hành đã chèn một tầng chuyển đổi trung gian vào giữa.

Thứ mà chương trình nhìn thấy là địa chỉ ảo. Còn vị trí thực sự rơi xuống các thanh RAM vật lý lại do Kernel hệ điều hành và phần cứng cùng nhau quyết định. Bộ nhớ ảo (Virtual Memory) chính là câu chuyện về cách tầng chuyển đổi này vận hành, vì sao các Process lại có thể được cô lập an toàn, và khi bộ nhớ vật lý cạn kiệt thì làm thế nào để dời tạm một phần dữ liệu ra đĩa cứng.

## Sẽ ra sao nếu không có bộ nhớ ảo?

Trước hết hãy xem xét một ví dụ phản chứng.

Rất nhiều người thời đại học từng tiếp xúc với vi điều khiển (microcontroller / vi mạch đơn). Trên vi điều khiển không có hệ điều hành phức tạp, CPU thao tác trực tiếp với các địa chỉ vật lý. Trong môi trường này, nếu bạn muốn chạy đồng thời hai chương trình, rắc rối sẽ lập tức nảy sinh: chương trình thứ nhất ghi một giá trị vào địa chỉ 2000, chương trình thứ hai cũng tình cờ đặt dữ liệu của mình tại địa chỉ 2000. Cú ghi đó sẽ đè nát dữ liệu của chương trình kia, khiến cả hai chương trình cùng lăn ra lỗi.

Nguyên nhân không hề phức tạp: cả hai chương trình đều đang tham chiếu trực tiếp vào cùng một tập hợp địa chỉ vật lý, không ai có thể tránh được ai.

Giải pháp của hệ điều hành là thêm vào một tầng cô lập: cấp cho mỗi Process một bộ "địa chỉ ảo" hoàn toàn độc lập. Process chỉ làm việc với địa chỉ ảo của chính mình; địa chỉ đó cuối cùng rơi vào vùng nhớ vật lý nào thì Process không cần biết, hệ điều hành sẽ đứng ra dàn xếp toàn bộ.

Từ đó hình thành nên hai khái niệm nền tảng:

- Địa chỉ được sử dụng bên trong mã nguồn chương trình gọi là **Địa chỉ ảo (Virtual Address)**.
- Địa chỉ thực sự tồn tại trên thanh RAM vật lý gọi là **Địa chỉ vật lý (Physical Address)**.

Khi Process truy cập vào địa chỉ ảo, đơn vị quản lý bộ nhớ phần cứng trong CPU gọi là MMU (Memory Management Unit) sẽ dựa vào bảng ánh xạ để dịch nó thành địa chỉ vật lý rồi mới truy cập vào bộ nhớ thực. Dù cho địa chỉ ảo mà hai Process khác nhau sử dụng có giá trị số giống hệt nhau, chúng vẫn có thể được ánh xạ tới các địa chỉ vật lý hoàn toàn tách biệt, tự nhiên sẽ không bao giờ xảy ra xung đột.

![Quá trình ánh xạ địa chỉ ảo sang địa chỉ vật lý: Địa chỉ ảo giống nhau của các Process khác nhau ánh xạ tới các trang vật lý khác nhau qua MMU và bảng trang](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-virtual-physical-mapping-27d34efc.png)

Chúng ta có thể đúc kết ba lợi ích lớn nhất của bộ nhớ ảo, và toàn bộ phần còn lại của bài viết thực chất đều xoay quanh ba điểm này:

- **Cô lập Process (Process Isolation)**: Mỗi Process có một bảng trang riêng, không bên nào nhìn thấy bộ nhớ vật lý của bên nào, Process A không thể dựa vào một địa chỉ để chạm trực tiếp vào dữ liệu của Process B.
- **Vượt qua giới hạn kích thước bộ nhớ vật lý**: Hoạt động của chương trình luôn có tính cục bộ. Các trang tạm thời chưa dùng tới có thể được dời ra đĩa cứng trước, khi cần mới hoán đổi ngược lại vào RAM. Nhờ đó bộ nhớ mà Process "cảm nhận được" có thể lớn hơn dung lượng RAM vật lý thực tế.
- **Không gian địa chỉ thống nhất và liên tục**: Process nhìn thấy một dải địa chỉ ảo liên tục hoàn chỉnh, nhưng về mặt vật lý các trang nhớ có thể nằm rải rác mỗi nơi một mảnh. Trách nhiệm ghép nối chúng lại được giao toàn quyền cho bảng ánh xạ.

Tiếp theo, câu hỏi quan trọng nhất chỉ có một: **Địa chỉ ảo ánh xạ sang địa chỉ vật lý như thế nào?**

Về cơ bản có hai phương pháp chính: **Phân đoạn (Segmentation) và Phân trang (Paging)**.

## Phân đoạn ánh xạ như thế nào?

Phân đoạn (Segmentation) xuất hiện khá sớm trong lịch sử máy tính, và ý tưởng của nó rất sát với trực giác của lập trình viên. Bản thân một chương trình vốn được tạo thành từ các thành phần như mã lệnh (code), dữ liệu (data), Stack, Heap; quyền truy cập và vòng đời của các phần này hoàn toàn khác nhau, vậy nên chia chương trình theo logic thành từng đoạn (segment).

Dưới cơ chế phân đoạn, một địa chỉ ảo bao gồm hai phần: **Bộ chọn đoạn (Segment Selector) và Độ lệch trong đoạn (Segment Offset)**.

Bộ chọn đoạn được lưu trong thanh ghi đoạn (segment register), trong đó thành phần mấu chốt nhất là số hiệu đoạn (segment number), dùng làm chỉ mục tra cứu bảng đoạn (segment table). Bảng đoạn ghi lại địa chỉ cơ sở (base address), giới hạn đoạn (segment limit - độ dài của đoạn) và cấp đặc quyền bảo vệ.

Quy trình chuyển đổi không hề phức tạp: lấy số hiệu đoạn tra cứu trong bảng đoạn để lấy địa chỉ cơ sở của đoạn, sau đó kiểm tra xem độ lệch trong đoạn có vượt quá giới hạn đoạn hay không. Trong mô hình chỉ thuần phân đoạn mà không bật phân trang, lấy địa chỉ cơ sở cộng với độ lệch sẽ ra ngay địa chỉ vật lý. Ví dụ muốn truy cập đoạn 3 với độ lệch 500, địa chỉ cơ sở của đoạn 3 là 7000, thì địa chỉ vật lý sẽ là $7000 + 500 = 7500$; nếu hệ thống có bật thêm phân trang, bước này sẽ cho ra địa chỉ tuyến tính (linear address), sau đó phải đi tiếp qua bảng trang để chuyển đổi.

![Sơ đồ chuyển đổi địa chỉ phân đoạn: Địa chỉ ảo gồm số hiệu đoạn và độ lệch, qua bảng đoạn tìm địa chỉ cơ sở rồi tính địa chỉ vật lý](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-segmentation-d95fae8f.png)

Phân đoạn đã giải quyết được vấn đề "chương trình không cần quan tâm đến địa chỉ vật lý", nhưng nó để lại hai cái hố rất lớn.

**Thứ nhất là hiện tượng phân mảnh bộ nhớ ngoại vi (External Fragmentation)**. Chiều dài của mỗi đoạn là không cố định, giữa các đoạn với nhau rất dễ để lại các khoảng trống vụn vặt. Lấy ví dụ, trong bộ nhớ vật lý lần lượt đặt 4 đoạn: A chiếm 256 MB, B chiếm 128 MB, C chiếm 256 MB, D chiếm 128 MB. Giờ giải phóng B và D, tổng dung lượng trống có 256 MB, nhưng nó bị C ngăn cách thành hai mảnh 128 MB riêng biệt. Lúc này nếu muốn nhét thêm một đoạn liên tục 200 MB thì chịu chết, không thể nhét nổi. Tổng dung lượng thì đủ, nhưng dung lượng liên tục thì thiếu.

**Thứ hai là chi phí dồn bộ nhớ (Memory Compaction) quá đắt đỏ**. Muốn gom các khoảng trống rải rác này thành một khối nguyên vẹn, hệ điều hành buộc phải dồn bộ nhớ: dịch chuyển các đoạn đang dùng sang vị trí khác để sắp xếp lại thành không gian liên tục. Nếu quá trình di dời lại đi kèm việc hoán đổi đoạn ra đĩa Swap rồi nạp lại, thì sẽ phát sinh thêm khối lượng I/O đĩa khổng lồ. Dù làm theo cách nào, việc dịch chuyển các đoạn có kích thước biến động lớn là cực kỳ nặng nề; hễ đụng phải đoạn dung lượng lớn là toàn bộ hệ thống rất dễ bị khựng lại.

Điểm nghẽn của phân đoạn nằm chính ở chỗ đó: hạt độ quá thô, chiều dài không cố định, khiến phân mảnh và chi phí dọn dẹp đều rất khó kiểm soát.

## Phân trang ánh xạ như thế nào?

Phân trang (Paging) đổi sang một cách tiếp cận hoàn toàn khác: không chia theo logic code, data, stack nữa, mà cắt cả không gian địa chỉ ảo lẫn không gian địa chỉ vật lý thành các khối nhỏ có kích thước cố định như nhau, mỗi khối gọi là một trang (**Page**). Dưới Linux, một trang mặc định là 4 KB.

Việc ánh xạ từ địa chỉ ảo sang địa chỉ vật lý dựa vào **Bảng trang (Page Table)**. Bảng trang nằm trong bộ nhớ, và phần cứng MMU chịu trách nhiệm tra bảng để dịch địa chỉ. Quá trình chuyển đổi địa chỉ thường trải qua ba bước:

- Tách địa chỉ ảo thành số hiệu trang ảo (VPN) và độ lệch trong trang (offset);
- Dùng số hiệu trang ảo tra cứu trong bảng trang để tìm ra số hiệu khung trang vật lý (PFN) tương ứng;
- Ghép số hiệu khung trang vật lý với độ lệch trong trang để thu được địa chỉ vật lý sau cùng.

![Sơ đồ chuyển đổi địa chỉ phân trang: Địa chỉ ảo tách thành số trang và độ lệch, bảng trang ánh xạ trang ảo sang khung trang vật lý](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-paging-5dd75b37.png)

Phân trang giải quyết các nhược điểm của phân đoạn như thế nào?

Kích thước trang là cố định, bộ nhớ vật lý cũng được quản lý theo hạt độ cố định, không tạo ra các khe hở vụn vặt kỳ lạ giữa các đoạn như cơ chế đoạn biến dài, do đó về cơ bản đã **triệt tiêu hoàn toàn phân mảnh ngoại vi**. Cái giá phải trả là có thể lãng phí bên trong trang: một chương trình dù chỉ dùng vài byte thì vẫn phải chiếm trọn vẹn cả một trang 4 KB, phần lãng phí này gọi là **Phân mảnh nội vi (Internal Fragmentation)**. Tuy nhiên, mức lãng phí này luôn bị chặn ở mức dưới 1 trang nên dễ kiểm soát và chấp nhận hơn rất nhiều so với phân mảnh ngoại vi.

Hạt độ quản lý cũng trở nên tinh mịn hơn. Khi bộ nhớ vật lý thiếu hụt, hệ điều hành có thể chọn ra một số trang "gần đây ít dùng" để hoán đổi ra đĩa cứng (**Swap Out**), và khi cần thì nạp lại vào RAM (**Swap In**). Đơn vị nạp/xuất từ nguyên một đoạn dài ngoằng biến động đã thu nhỏ lại thành từng trang kích thước cố định gọn gàng.

Đừng hiểu lầm: phân trang không đồng nghĩa với việc áp lực đĩa cứng chắc chắn sẽ nhỏ. Nếu thực sự gặp phải lượng lớn Major Page Fault hoặc hệ thống rơi vào trạng thái trì trệ (thrashing), tần suất I/O cấp độ trang dồn dập vẫn có thể kéo sập hiệu năng toàn hệ thống.

Phân trang còn có một điểm ứng dụng thực tế cực kỳ đắt giá: chương trình không cần phải nạp toàn bộ một lần vào bộ nhớ. Hệ thống chỉ cần chuẩn bị sẵn cấu trúc ánh xạ giữa trang ảo và trang vật lý, nhưng chưa vội vã bốc dữ liệu thực sự vào RAM. Đợi đến khi chương trình thực sự truy cập chạm vào trang ảo nào đó, hệ điều hành mới nạp trang đó vào. Đây chính là nền tảng của cơ chế **Demand Paging** (nạp trang theo yêu cầu).

## Phân đoạn kết hợp Phân trang: Khi cả hai dung hợp làm một

Phân đoạn và phân trang không nhất thiết phải chọn một trong hai; chúng có thể kết hợp lại thành **Quản lý bộ nhớ Phân đoạn kết hợp Phân trang (Segmented Paging)**.

Cách làm là phân đoạn trước, phân trang sau: trước tiên cắt chương trình thành các đoạn có ý nghĩa về mặt logic, sau đó lại cắt nhỏ từng đoạn thành các trang có kích thước cố định. Địa chỉ khi đó được chia làm ba phần: số hiệu đoạn, số hiệu trang trong đoạn, và độ lệch trong trang. Mỗi chương trình có một bảng đoạn, và mỗi mục trong bảng đoạn lại trỏ tới một bảng trang tương ứng.

Nhược điểm cũng rất dễ thấy: số lần truy cập bộ nhớ tăng lên. Một lần chuyển đổi địa chỉ trong mô hình phân đoạn kết hợp phân trang phải đi qua bộ nhớ tới ba lượt:

1. Lượt thứ nhất tra bảng đoạn để lấy địa chỉ bắt đầu của bảng trang;
2. Lượt thứ hai tra bảng trang để lấy số hiệu khung trang vật lý;
3. Lượt thứ ba mới dùng số hiệu khung trang vật lý cộng với độ lệch để truy cập dữ liệu thực tế.

Nhắc lại một chút về lịch sử để giải thích vì sao kiến trúc x86 lại trông như "vừa phân đoạn vừa phân trang": Bắt đầu từ chip Intel 80286, Intel áp dụng cơ chế phân đoạn; đến đời 80386 thì bổ sung thêm phân trang, nhưng phân trang lại được xây dựng chồng lên trên phân đoạn: địa chỉ logic trước tiên qua phân đoạn biến thành địa chỉ tuyến tính (chính là địa chỉ ảo thông thường); sau đó địa chỉ tuyến tính mới qua phân trang để biến thành địa chỉ vật lý. Phần cứng CPU được thiết kế cứng như vậy, nên Linux bắt buộc phải chiều theo.

Trên Linux 32-bit x86, Kernel thường áp dụng Flat Memory Model, đặt địa chỉ cơ sở của các đoạn mã và dữ liệu chính về 0, làm cho địa chỉ logic và địa chỉ tuyến tính bằng nhau về mặt giá trị số, và công việc quản lý bộ nhớ được giao trọn vẹn cho cơ chế phân trang. Sang đến x86-64 Long Mode, vai trò phân đoạn của các thanh ghi CS, SS, DS, ES cơ bản đã bị vô hiệu hóa, nhưng thanh ghi FS và GS vẫn có thể giữ địa chỉ cơ sở khác 0, thường được tận dụng cho Thread-Local Storage (TLS) và dữ liệu per-CPU của Kernel.

## Vì sao Bảng trang đơn cấp không đủ đáp ứng?

Khi phân trang đi vào hệ thống thực tế, bức tường đầu tiên mà các kỹ sư va phải không phải là tư duy thuật toán, mà là chi phí không gian lưu trữ.

Hãy làm một phép tính: Trong môi trường 32-bit, không gian địa chỉ ảo là 4 GB, kích thước trang là 4 KB ($2^{12}$), vậy một Process sẽ có khoảng 1 triệu ($2^{20}$) trang ảo. Mỗi mục trong bảng trang (PTE) chiếm 4 byte, toàn bộ bảng trang sẽ ngốn $4 \times 2^{20} = 4\text{ MB}$.

4 MB nghe qua có vẻ không đáng kể, nhưng đừng quên: **mỗi Process đều sở hữu bảng trang của riêng mình**. 100 Process đồng nghĩa với việc mất toi 400 MB RAM chỉ để lưu bảng trang. Bước sang môi trường 64-bit, con số này sẽ phình to đến mức không tưởng.

Trớ trêu hơn nữa, bảng trang đơn cấp bắt buộc phải dàn trải kín toàn bộ không gian địa chỉ ảo cùng một lúc. Nhiệm vụ của bảng trang là dịch địa chỉ; nếu một địa chỉ ảo không có ô tương ứng trong bảng trang để tra cứu thì quá trình dịch sẽ bị đứt gãy. Do đó, dù Process thực tế chỉ dùng một mẩu bộ nhớ bé xíu, thì toàn bộ 1 triệu mục bảng trang kia vẫn phải được tạo sẵn ra, mà tuyệt đại đa số trong đó đều hoàn toàn trống rỗng.

Đó là một sự lãng phí tài nguyên không thể chấp nhận được.

## Bảng trang đa cấp tiết kiệm không gian như thế nào?

Chiêu thức của **Bảng trang đa cấp (Multi-Level Page Table)** rất trực diện: **Chỉ tạo bảng trang cấp dưới cho những địa chỉ thực sự được dùng tới; vùng nào chưa dùng thì tuyệt đối không tạo.**

Vẫn lấy ví dụ 32-bit với trang 4 KB: chúng ta chia hơn 1 triệu mục bảng trang đó thành hai tầng. Bảng trang cấp 1 (Thư mục trang - Page Directory) có 1024 mục, mỗi mục trỏ tới một bảng trang cấp 2; mỗi bảng trang cấp 2 cũng có 1024 mục. $1024 \times 1024$ bao phủ vừa khít hơn 1 triệu mục bảng trang đó.

Bạn có thể sẽ lập tức phản biện: *Thế chẳng phải lại tốn thêm một tầng sao? Bảng cấp một tốn 4 KB, cộng thêm các bảng cấp hai tốn 4 MB, chẳng phải tốn hơn à?*

Nếu một Process thực sự lấp kín toàn bộ 4 GB địa chỉ ảo thì đúng là tốn hơn thật. Nhưng trong thực tế, không có Process nào dùng hết sạch sành sanh 4 GB cả. Chìa khóa nằm ở đây: Bảng trang cấp 1 bắt buộc phải thường trú vĩnh viễn trong RAM để bao quát toàn bộ không gian địa chỉ, nhưng nó chỉ tốn vỏn vẹn 4 KB; còn các bảng trang cấp 2 thì được tạo theo nhu cầu (on-demand), mục nào ở bảng cấp 1 chưa đụng tới thì bảng trang cấp 2 tương ứng vĩnh viễn không được sinh ra.

Tính thử một con số: Giả sử chỉ có 20% số mục ở bảng cấp 1 được sử dụng, thì tổng chi phí bảng trang sẽ là $4\text{ KB (cấp 1)} + 20\% \times 4\text{ MB (cấp 2)} \approx 0.804\text{ MB}$. So với con số 4 MB cứng ngắc của bảng trang đơn cấp, mức tiết kiệm là cực kỳ ấn tượng. Phần bộ nhớ tiết kiệm được ở đây dựa vào Nguyên lý cục bộ (Locality of Reference): chương trình trong một khoảng thời gian thường chỉ tập trung truy cập một vùng nhỏ trong không gian địa chỉ.

Bước sang kỷ nguyên 64-bit, hai cấp không còn thấm tháp vào đâu. Khung trừu tượng bảng trang thông dụng hiện tại của Linux được thiết kế 5 cấp, từ trên xuống dưới gồm:

- PGD (Page Global Directory - Thư mục trang toàn cục)
- P4D (Page 4th Directory - Thư mục trang cấp 4)
- PUD (Page Upper Directory - Thư mục trang cấp trên)
- PMD (Page Middle Directory - Thư mục trang trung gian)
- PTE (Page Table Entry - Mục bảng trang)

![Sơ đồ bảng trang đa cấp: PGD, PUD, PMD, PTE tạo chỉ mục phân tầng, chỉ tạo bảng cấp dưới cho dải địa chỉ thực dùng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-multi-level-page-table-26a60ff3.png)

Trên phần cứng x86-64 chỉ dùng phân trang 4 cấp, tầng P4D sẽ được Kernel "gấp lại" (folded) và không thực sự tham gia vào quá trình dịch địa chỉ phần cứng. Do đó cụm từ "bảng trang 4 cấp" bạn thường nghe nói chính là trạng thái đã gấp lại này, chứ không phải Linux chỉ định nghĩa có 4 cấp.

Cụ thể trên x86-64, cấu hình chủ lưu hiện nay là phân trang 4 cấp, sử dụng địa chỉ ảo chuẩn 48 bit (định tuyến tới 256 TB). Một địa chỉ ảo 64-bit thường được bóc tách như sau: 16 bit cao nhất là các bit mở rộng dấu (sign-extension), tiếp theo PGD, PUD, PMD, PTE mỗi cấp chiếm 9 bit ($2^9 = 512$ mục mỗi cấp), và 12 bit thấp nhất là độ lệch trong trang (tương ứng với trang 4 KB). Mỗi mục bảng trang chiếm 8 byte, $512 \times 8\text{ byte} = 4\text{ KB}$, vừa khít chiếm trọn một khung trang cho mỗi cấp bảng trang.

Khi cần không gian địa chỉ khổng lồ hơn, x86-64 cung cấp giải pháp phân trang 5 cấp (LA57), mở rộng địa chỉ tuyến tính chuẩn tắc từ 48 bit lên 57 bit, và địa chỉ vật lý lên tới 52 bit. Ở đây xin lưu ý mốc thời gian: Linux hỗ trợ phân trang 5 cấp từ bản 4.14 (năm 2017), việc bật hay không tùy thuộc vào CPU và cấu hình Kernel; phía Intel thì thế hệ hỗ trợ rõ ràng 57-bit địa chỉ ảo và 52-bit địa chỉ vật lý là Intel Xeon Scalable Gen 3 (nền tảng máy chủ Ice Lake, ra mắt năm 2021). Tài liệu Linux cũng chỉ rõ rằng phân trang 5 cấp cấp tối đa 56 bit địa chỉ ảo cho User Space; để tương thích với các chương trình dùng bit cao con trỏ làm tagging, Kernel mặc định sẽ không chủ động cấp phát địa chỉ trên 47 bit trừ khi ứng dụng đưa ra yêu cầu tường minh. Các máy chủ thông thường mặc định vẫn phổ biến phân trang 4 cấp.

## TLB (Bộ nhớ đệm chuyển đổi) giải quyết vấn đề gì?

Bảng trang đa cấp tiết kiệm được không gian bộ nhớ, nhưng nó lại ngốn thêm thời gian: ngày trước tra bảng một lần, giờ trong môi trường 64-bit có thể phải tra tới 4 cấp. Đằng sau một lần truy cập bộ nhớ mà lại ẩn giấu tới 4 hay 5 lần đọc RAM để tra bảng thì chi phí độ trễ là quá khủng khiếp.

Vẫn là Nguyên lý cục bộ đứng ra giải cứu tình thế. Các trang mà chương trình truy cập lặp đi lặp lại trong một khoảng thời gian thường chỉ gom lại ở một nhóm nhất định. Vậy thì hãy đem các mục bảng trang hay dùng nhất lưu tạm vào một vùng nhớ phần cứng tốc độ siêu nhanh. Vùng nhớ đệm đó chính là **TLB (Translation Lookaside Buffer)**, nằm trực tiếp bên trong MMU của CPU.

Nhờ có TLB, khi CPU cần tìm địa chỉ, nó sẽ tra TLB trước tiên:

- **TLB Hit (Trúng đệm)**: Lấy trực tiếp số hiệu khung trang vật lý, bỏ qua hoàn toàn việc tra cứu bảng trang đa cấp trong RAM.
- **TLB Miss (Trượt đệm)**: Buộc phải đi một vòng tra cứu bảng trang đa cấp trong RAM, tra xong thì nạp mục đó vào TLB để phục vụ cho các lần truy cập tiếp theo.

![Quy trình TLB lưu cache kết quả chuyển đổi địa chỉ: CPU tra TLB trước, hit thì truy cập bộ nhớ trực tiếp, miss thì tra bảng trang đa cấp và cập nhật TLB](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-tlb-cache-b470e575.png)

Vì số lượng trang điểm nóng chỉ có bấy nhiêu, nên tỷ lệ TLB hit trong thực tế thường rất cao (trên 98%). Chi phí tra cứu phát sinh do bảng trang đa cấp hầu như đều được TLB gánh trọn vẹn.

## Ngoại lệ thiếu trang (Page Fault) diễn ra như thế nào?

Cơ chế nạp trang theo yêu cầu (Demand Paging) dựa trên một tiền đề: khi Process truy cập vào một trang ảo nào đó, trang này chưa chắc đã nằm sẵn trong bộ nhớ vật lý. Khi MMU tra bảng trang và phát hiện việc dịch địa chỉ hoặc kiểm tra quyền hạn cấp trang không thể hoàn tất, CPU sẽ kích hoạt một ngoại lệ thiếu trang (**Page Fault Exception**), chuyển giao quyền điều khiển cho trình xử lý ngắt/ngoại lệ của Kernel. Một số tài liệu thường gọi nó theo thói quen là "ngắt thiếu trang" (page fault interrupt), nhưng theo phân loại kiến trúc máy tính chuẩn xác, đây là một ngoại lệ (exception) xảy ra đồng bộ với lệnh truy cập bộ nhớ hiện tại, chứ không phải là ngắt phần cứng (hardware interrupt) bất đồng bộ từ ngoại vi gửi về.

Quy trình xử lý diễn ra tuần tự qua các bước sau:

1. CPU cầm địa chỉ ảo đi tra bảng trang, phát hiện việc dịch địa chỉ hoặc kiểm tra quyền hạn không thành công, lập tức kích hoạt ngoại lệ Page Fault.
2. CPU chuyển sang Kernel Mode, trình xử lý thiếu trang trước tiên kiểm tra xem truy cập này có hợp lệ hay không. Nếu truy cập vào địa chỉ bất hợp pháp, ví dụ con trỏ hoang (wild pointer) hay con trỏ NULL, hệ thống sẽ báo lỗi phân đoạn (Segmentation Fault) và Process thường sẽ bị tiêu diệt ngay lập tức bằng `SIGSEGV`.
3. Nếu hợp lệ, Kernel tìm kiếm một khung trang vật lý còn trống. Nếu không còn khung trang trống nào, nó sẽ tiến hành thu hồi hoặc hoán đổi một trang "nạn nhân" (victim page) ra ngoài: các trang file sạch có thể loại bỏ thẳng tay, khi nào cần thì đọc lại từ file; các trang file bẩn phải được ghi trả về đĩa trước; còn các trang ẩn danh thì được ghi vào phân vùng Swap (nếu Swap được bật). Việc có phát sinh ghi đĩa hay không tùy thuộc vào loại trang và trang đó có bị "bẩn" hay không.
4. Đọc trang dữ liệu cần thiết từ đĩa (phân vùng Swap hoặc file gốc) nạp vào khung trang vật lý vừa có được, cập nhật mục bảng trang (PTE) để nó trỏ tới khung trang vật lý mới này.
5. Quay trở lại User Mode, CPU thực thi lại đúng câu lệnh vừa gây ra Page Fault ban nãy, lần này dữ liệu đã sẵn sàng nên việc truy cập diễn ra bình thường.

![Quy trình xử lý ngoại lệ thiếu trang: MMU phát hiện dịch địa chỉ hoặc quyền hạn lỗi thì vào Kernel, kiểm tra tính hợp lệ, cấp phát hoặc hoán đổi khung trang, cập nhật bảng trang và thử lại lệnh](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-page-fault-08944e3c.png)

Đứng ở góc độ thống kê hiệu năng của Linux, lỗi thiếu trang được chia thành hai nhóm chính (được ghi nhận trong `getrusage` qua hai biến `ru_minflt` và `ru_majflt`):

- **Minor Page Fault (Lỗi thiếu trang nhẹ)**: Trang dữ liệu thực tế đã nằm sẵn trong RAM rồi, chỉ là bảng trang của Process hiện tại chưa thiết lập ánh xạ (chẳng hạn các thư viện dùng chung được nạp bởi Process khác); thao tác nhân bản trang do Copy-On-Write (COW) kích hoạt cũng thường tính vào nhóm này vì nó chỉ cấp phát hoặc nhân bản trang trong RAM mà không cần đọc đĩa. Chi phí rất nhỏ.
- **Major Page Fault (Lỗi thiếu trang nặng)**: Trang hoàn toàn chưa có trong RAM, bắt buộc phải đọc từ đĩa cứng (file hoặc Swap) vào, chi phí thời gian rất lớn.

Hành vi truy cập địa chỉ phi pháp như con trỏ hoang cũng do phần cứng kích hoạt ngoại lệ page fault vào Kernel. Nhưng sau khi Kernel xác định là phi pháp, nó sẽ gửi tín hiệu `SIGSEGV` cho Process. Đây là nhánh xử lý lỗi, thường không xếp ngang hàng với minor/major fault như một loại thống kê hiệu năng thứ ba.

Nếu bộ nhớ vật lý quá căng thẳng, hệ thống sẽ dành phần lớn thời gian chỉ để hoán đổi trang ra vào, CPU không làm được việc gì hữu ích mà toàn bận rộn vận chuyển dữ liệu qua lại với đĩa cứng, trạng thái tê liệt này gọi là **Rung lắc bộ nhớ (Thrashing)**.

## Thuật toán thay thế trang: Đẩy ai ra ngoài?

Khi RAM vật lý đã đầy mà lại cần nạp trang mới vào, hệ thống buộc phải chọn một trang cũ để đẩy ra. Chọn đúng thì lần sau ít bị thiếu trang; chọn sai thì trang vừa bị đá ra xong lại cần dùng tới ngay, công cốc hoài công.

Các thuật toán kinh điển gồm có:

**OPT (Optimal - Tối ưu)**: Đẩy trang mà "trong khoảng thời gian lâu nhất ở tương lai sẽ không được truy cập". Thuật toán này về mặt lý thuyết cho số lần thiếu trang ít nhất, nhưng đòi hỏi phải nhìn thấu tương lai nên thực tế không thể cài đặt được, chủ yếu dùng làm thước đo chuẩn để đánh giá các thuật toán khác.

**FIFO (First-In First-Out - Vào trước ra trước)**: Duy trì một hàng đợi, trang nào vào bộ nhớ sớm nhất thì đẩy ra trước. Cài đặt cực kỳ đơn giản, nhưng rất dễ loại bỏ nhầm các trang điểm nóng, bởi vì một trang nằm lâu trong bộ nhớ không có nghĩa là tương lai không cần dùng đến.

**LRU (Least Recently Used - Ít sử dụng gần đây nhất)**: Đẩy trang mà "đã lâu nhất chưa được truy cập". Nó đặt cược vào tính cục bộ: trang nào vừa mới dùng thì sắp tới khả năng cao vẫn sẽ dùng. Hiệu quả của LRU tiệm cận rất sát với OPT, nhưng chi phí hiện thực rất cao, hoặc phải duy trì mốc thời gian (timestamp) cho từng trang, hoặc phải dùng danh sách liên kết để dịch chuyển trang lên đầu mỗi khi truy cập. Thuần phần mềm khó lòng gánh nổi ở tần suất truy cập cao.

**CLOCK (Đồng hồ / Cơ hội thứ hai)**: Thuật toán xấp xỉ LRU sinh ra để né tránh chi phí đắt đỏ của LRU. Mỗi trang được gắn thêm một bit truy cập (reference bit), toàn bộ các trang được xếp thành một vòng tròn, và một con trỏ quét vòng quanh giống như kim đồng hồ. Khi cần đẩy trang, kim trỏ tới trang nào sẽ nhìn vào bit truy cập: nếu là 1, chứng tỏ gần đây có dùng, hệ thống cho nó "cơ hội thứ hai" bằng cách xóa bit về 0 rồi kim nhảy sang trang tiếp theo; nếu là 0, lập tức đẩy trang đó ra ngoài. Chỉ một bit truy cập kết hợp quét vòng tròn đã có thể mô phỏng cực rẻ xem trang "gần đây có được dùng hay không".

![Sơ đồ thuật toán thay thế trang CLOCK: Các trang xếp thành hàng đợi vòng tròn, con trỏ dựa vào bit truy cập R để quyết định trao cơ hội thứ hai hay loại bỏ trang](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-clock-algorithm-80ebda22.png)

**LFU (Least Frequently Used - Ít dùng thường xuyên nhất)**: Đếm số lần truy cập của từng trang và đẩy trang có số lần truy cập ít nhất ra ngoài. Nó nhìn vào tần suất chứ không nhìn vào mốc thời gian. Vấn đề là những trang được truy cập dồn dập lúc khởi động nhưng sau đó không dùng nữa sẽ tích lũy số đếm rất cao và "lì lợm" không chịu rời đi, do đó trong thực tế thường phải kết hợp cơ chế suy giảm số đếm theo thời gian (decay).

Bảng đối chiếu ngang giữa các thuật toán:

| Thuật toán | Căn cứ đẩy trang | Chi phí cài đặt | Hiệu quả | Khả năng ứng dụng thực tế |
| --- | --- | --- | --- | --- |
| **OPT** | Lâu nhất trong tương lai không dùng | Không thể cài đặt | Tối ưu lý thuyết | Chỉ dùng làm thước đo chuẩn |
| **FIFO** | Thời gian vào sớm nhất | Rất thấp | Bình thường, dễ đá nhầm trang nóng | Có |
| **LRU** | Lâu nhất chưa được truy cập | Cao (timestamp / linked list) | Rất sát OPT | Thuần phần mềm rất đuối |
| **CLOCK** | Bit truy cập + Quét vòng tròn | Thấp | Xấp xỉ sát LRU | Có, phương án xấp xỉ chủ lưu |
| **LFU** | Số lần truy cập ít nhất | Trung bình (cần bộ đếm) | Tùy ngữ cảnh | Có, thường cần cơ chế suy giảm |

Xin nhấn mạnh lại: Các thuật toán trên là lý thuyết sách giáo khoa giúp ta hiểu tư duy chiến lược. Nhân Linux thực tế không chọn trực tiếp một trong các thuật toán OPT/FIFO/LRU/CLOCK, mà sử dụng danh sách LRU kép (Active/Inactive LRU list), workingset và cơ chế phát hiện refault; chiến lược thu hồi trang file và trang ẩn danh cũng khác nhau, đồng thời chịu ảnh hưởng của NUMA, cgroup, và các mực nước bộ nhớ. Do đó, khẳng định kiểu "Linux dùng thuật toán CLOCK" là thiếu chuẩn xác.

## Dị thường Belady: Càng thêm RAM lại càng chậm?

Theo trực giác thông thường, cấp thêm khung trang trong RAM vật lý thì số lần thiếu trang đáng lẽ phải giảm đi hoặc giữ nguyên. Nhưng FIFO lại tát một gáo nước lạnh vào trực giác: **Đôi khi tăng số lượng khung trang thì số lần thiếu trang lại tăng lên**. Hiện tượng kỳ quặc này gọi là **Dị thường Belady (Belady's Anomaly)**, do nhà khoa học máy tính László Bélády phát hiện vào những năm 1960.

Có thể tái hiện dễ dàng bằng một chuỗi truy cập kinh điển: `1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5` chạy trên FIFO:

- Khi có 3 khung trang: thiếu trang 9 lần.
- Khi có 4 khung trang: thiếu trang 10 lần.

Cho thêm hẳn một khung trang mà số lần thiếu trang lại bị đội thêm một lần!

Nguyên nhân là do FIFO không thỏa mãn **Tính chất ngăn xếp (Stack Property)**: tập hợp các trang cư trú khi có $n$ khung trang chưa chắc đã là tập con của tập hợp các trang cư trú khi có $n+1$ khung trang. Một khi mối quan hệ tập con bao hàm này bị phá vỡ, việc tăng thêm khung trang có thể khiến thuật toán chọn sai đối tượng để loại bỏ vào thời điểm then chốt.

Các thuật toán thỏa mãn tính chất này được gọi là **Thuật toán ngăn xếp (Stack Algorithm)**. Thứ tự ưu tiên thay thế của chúng đối với mỗi trang hoàn toàn độc lập với số lượng khung trang, do đó về mặt toán học chúng miễn nhiễm hoàn toàn với dị thường Belady. Cả OPT và LRU đều là thuật toán ngăn xếp đã được chứng minh chặt chẽ: khi số khung trang tăng lên, số lần thiếu trang chỉ có giảm đi hoặc giữ nguyên chứ tuyệt đối không bao giờ tăng. FIFO không có tính chất này nên dính chưởng. Với LFU, việc có bị dị thường Belady hay không tùy thuộc vào cách thức thống kê tần suất và cách phân định thắng thua khi bằng điểm, không thể khẳng định chắc chắn là nó miễn nhiễm.

Đối với CLOCK cũng đừng vội suy diễn: CLOCK cổ điển là xấp xỉ của LRU nhưng nó không sở hữu tính chất ngăn xếp toán học nghiêm ngặt của LRU; trong trường hợp cực đoan khi toàn bộ các bit truy cập đều là 1, nó sẽ thoái hóa thẳng về FIFO. Vì vậy không thể vì nó "xấp xỉ LRU" mà vội kết luận nó chắc chắn miễn nhiễm Belady. Kết luận vững chắc nhất là: FIFO tồn tại các chuỗi truy cập kích hoạt dị thường Belady; OPT và LRU chắc chắn không bị; còn CLOCK và LFU phải xét theo định nghĩa cài đặt cụ thể.

Ghi nhớ một kết luận thực tiễn là đủ: Dị thường Belady là căn bệnh của các thuật toán không có tính chất ngăn xếp như FIFO. Khi gặp hiện tượng kỳ lạ "tăng RAM mà hiệu năng lại tụt dốc", hãy nghi ngờ chiến lược thay thế trang trước tiên, thay vì vội vàng đoán thanh RAM bị hỏng.

## Những khái niệm này ứng dụng thế nào trong kỹ thuật thực chiến?

Bộ nhớ ảo không chỉ nằm im trong sách vở, chỉ cần bước lên các tầng kiến trúc cao hơn một chút là bạn sẽ chạm mặt nó ngay lập tức.

**mmap và Zero-Copy (Không sao chép)**: `mmap()` ánh xạ trực tiếp file vào không gian địa chỉ ảo của Process, biến thao tác đọc file thành thao tác truy cập con trỏ bộ nhớ. Khi vừa tạo ánh xạ, file chưa hề được nạp ngay vào RAM; chỉ khi bạn chạm vào trang nào đó thì mới kích hoạt Page Fault để nạp trang đó vào qua cơ chế Demand Paging. Nó triệt tiêu một lần sao chép từ bộ đệm Kernel sang bộ đệm User Space, nên thường xuyên góp mặt trong các giải pháp Zero-Copy hiệu năng cao.

**Bộ nhớ và Phân mảnh trong Redis**: Redis là cơ sở dữ liệu in-memory, nhưng bộ nhớ mà nó xin cấp phát cuối cùng vẫn phải nằm trên các trang vật lý. Bộ cấp phát bộ nhớ (mặc định là jemalloc) phân bổ theo các khung kích thước cố định (size class), dẫn đến khoảng không lãng phí. Về mặt bản chất "kích thước cấp phát lớn hơn lượng dùng thực tế", nó rất giống với hiện tượng phân mảnh nội vi trong phân trang, nhưng một bên diễn ra ở bộ cấp phát User Space, một bên diễn ra ở tầng phân trang Kernel, vị trí và cách xử lý hoàn toàn khác nhau, không được đánh đồng làm một. Khi Redis lưu trữ bền vững (persistence) bằng cách fork Process con để chụp snapshot RDB, nó dựa hoàn toàn vào cơ chế Copy-On-Write (COW): Process cha và con ban đầu dùng chung các trang vật lý, bên nào ghi thì bên đó mới kích hoạt nhân bản trang, bản chất phía sau vẫn là cơ chế bảo vệ của bảng trang.

**Heap của JVM**: Vùng Heap mà JVM xin từ hệ điều hành thực chất cũng là một dải không gian địa chỉ ảo liên tục. Khi Heap có dung lượng khổng lồ, phạm vi bao phủ của bảng trang sẽ rất lớn; việc cấu hình Huge Pages (trang lớn 2 MB) sẽ làm giảm số lượng mục trong bảng trang, giải tỏa áp lực cho TLB, hỗ trợ đắc lực trong việc giảm bớt chi phí truy cập bộ nhớ khi Garbage Collection (GC) hoạt động. Trong quá trình GC quét đối tượng, việc con trỏ nhảy liên tục khắp nơi khiến tính cục bộ kém đi, cái giá phải trả trực tiếp nhất là hiện tượng tăng vọt cache miss và TLB miss; chỉ khi các trang liên quan chưa cư trú trong RAM hoặc bộ nhớ hệ thống quá căng thẳng thì mới biểu hiện tiếp thành Page Fault. Đó là lý do tối ưu hóa Heap lớn luôn phải theo dõi sát sao chỉ số TLB.

Nhìn xuống dưới là bảng trang và TLB của phần cứng, nhìn lên trên là cơ sở dữ liệu, JVM, và Zero-Copy. Tầng bộ nhớ ảo này trông có vẻ sâu ở tầng dưới, nhưng trong thực tế lại luôn trồi lên trong hầu hết các bài toán nghẽn hiệu năng.

## Trả lời thế nào trong buổi phỏng vấn?

Nếu người phỏng vấn hỏi *"Vì sao cần bộ nhớ ảo?"*, đừng vội chỉ trả lời cụt lủn là "để cô lập Process". Hãy trả lời bài bản theo mạch: Trong chương trình chúng ta dùng địa chỉ ảo chứ không phải địa chỉ thực trên thanh RAM. Khi CPU truy cập bộ nhớ, MMU sẽ căn cứ vào bảng trang để dịch địa chỉ ảo thành địa chỉ vật lý. Nhờ vậy mỗi Process đều ngỡ như mình đang sở hữu một vùng bộ nhớ độc lập liên tục, ngay cả khi giá trị địa chỉ trong hai Process giống hệt nhau thì cuối cùng vẫn rơi vào các trang vật lý hoàn toàn tách biệt.

Sau đó bổ sung thêm các giá trị to lớn mà nó mang lại: các Process không thể can thiệp phá hoại dữ liệu của nhau; chương trình không cần bận tâm bộ nhớ vật lý nằm ở đâu; hệ điều hành có thể cấp phát theo nhu cầu, hoán đổi trang linh hoạt, và tận dụng cơ chế COW để giảm thiểu sao chép dữ liệu thừa thãi.

Nếu bị hỏi tiếp *"Phân trang giải quyết vấn đề gì so với phân đoạn?"*, hãy đem đối chiếu việc chia cắt không gian. Phân đoạn chia theo các khối logic như code, data, stack nên chiều dài không cố định, dễ gây phân mảnh ngoại vi và việc dồn bộ nhớ rất nặng nề. Phân trang đơn giản hơn nhiều: cả địa chỉ ảo lẫn bộ nhớ vật lý đều chia thành các trang kích thước cố định, bảng trang lưu mối quan hệ "trang ảo → khung trang vật lý", loại bỏ triệt để phân mảnh ngoại vi, chỉ chấp nhận một chút phân mảnh nội vi ở trang cuối cùng.

Cũng có thể tiện tay nhắc tới bảng trang đa cấp: nó sinh ra không phải để tra bảng nhanh hơn, mà là để tiết kiệm RAM. Vùng địa chỉ nào chưa dùng tới thì không cần cấp phát bảng trang cấp dưới.

Khi hỏi về **TLB và Lỗi thiếu trang (Page Fault)**, hãy trình bày theo hướng "đi qua đường tắt trước, xử lý ngoại lệ sau". CPU tra cứu trong TLB trước, trúng thì lấy ngay số hiệu khung trang vật lý; trượt thì mới đi tra bảng trang đa cấp trong RAM. Nếu bảng trang cho thấy trang này chưa nằm trong bộ nhớ, CPU sẽ kích hoạt ngoại lệ Page Fault. Kernel xác minh tính hợp pháp của truy cập, nếu hợp lệ mới cấp khung trang, hoán đổi trang cũ ra ngoài nếu RAM đầy, nạp trang từ file hoặc Swap vào, cập nhật bảng trang rồi cho CPU chạy lại câu lệnh vừa bị lỗi.

Minor fault thường không cần đọc đĩa, major fault bắt buộc phải đọc đĩa; còn truy cập địa chỉ phi pháp cuối cùng sẽ nhận tín hiệu `SIGSEGV`.

Với các thuật toán thay thế trang, không cần học vẹt từng cái tên mà chỉ cần nắm chắc một câu: Trang bị đẩy ra ngoài tốt nhất nên là trang mà trong tương lai rất lâu nữa mới cần dùng tới. OPT là tối ưu lý thuyết; LRU tiệm cận OPT nhưng chi phí phần mềm đắt; CLOCK dùng bit truy cập để xấp xỉ LRU với chi phí rẻ; FIFO đơn giản nhất nhưng có thể dính dị thường Belady. Lưu ý nhấn mạnh rằng Linux thực tế không áp dụng thô thiển một thuật toán sách giáo khoa nào, mà kết hợp danh sách LRU kép (Active/Inactive), workingset và refault để thu hồi trang xấp xỉ tối ưu.
