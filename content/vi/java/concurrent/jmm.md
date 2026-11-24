---
title: Giải thích chi tiết JMM (Java Memory Model)
description: "Phân tích chuyên sâu về Java Memory Model (JMM): giải thích chi tiết mô hình CPU Cache, cơ chế sắp xếp lại lệnh (Instruction Reordering), nguyên tắc happens-before, đảm bảo tính khả kiến bộ nhớ, giúp hiểu rõ các quy chuẩn tầng dưới của lập trình đồng thời đa luồng."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/jmm.md
head:
  - - meta
    - name: keywords
      content: JMM,Java Memory Model,CPU Cache,sắp xếp lại lệnh,happens-before,tính khả kiến bộ nhớ,mô hình lập trình đồng thời
---

Đối với Java, bạn có thể coi **JMM (Java Memory Model — Mô hình bộ nhớ Java)** là một bộ quy chuẩn liên quan đến lập trình đồng thời do Java định nghĩa. Ngoài việc trừu tượng hóa mối quan hệ giữa Thread (luồng) và bộ nhớ chính (Main Memory), nó còn quy định quá trình chuyển đổi từ mã nguồn Java sang lệnh thực thi của CPU phải tuân thủ những nguyên tắc và quy chuẩn nào liên quan đến đồng thời. Mục đích chính của nó là để **đơn giản hóa việc lập trình đa luồng** và **nâng cao tính khả chuyển (portability) của chương trình**.

JMM chủ yếu định nghĩa **tính khả kiến (`Visibility`)** của một biến chia sẻ đối với các Thread khác sau khi một Thread thực hiện thao tác ghi trên biến đó.

Để hiểu thấu đáo về JMM, chúng ta cần bắt đầu từ **mô hình CPU Cache** và **sắp xếp lại lệnh (Instruction Reordering)**.

## Bắt đầu từ mô hình CPU Cache

**Tại sao lại phải tạo ra bộ nhớ đệm tốc độ cao CPU Cache?** Tương tự như bộ nhớ đệm (như Redis) mà chúng ta sử dụng khi phát triển hệ thống backend website để giải quyết sự chênh lệch tốc độ giữa tốc độ xử lý của chương trình và tốc độ truy cập cơ sở dữ liệu quan hệ thông thường, **CPU Cache sinh ra để giải quyết sự chênh lệch tốc độ giữa tốc độ xử lý của CPU và tốc độ xử lý của bộ nhớ chính (RAM).**

Chúng ta thậm chí có thể coi **bộ nhớ chính là bộ nhớ đệm tốc độ cao của bộ nhớ ngoài (ổ đĩa)**: khi chương trình chạy, chúng ta sao chép dữ liệu từ bộ nhớ ngoài vào bộ nhớ chính; vì tốc độ xử lý của bộ nhớ chính cao hơn nhiều so với bộ nhớ ngoài, điều này giúp nâng cao tốc độ xử lý.

Tổng kết: **CPU Cache lưu đệm dữ liệu từ bộ nhớ chính để giải quyết vấn đề chênh lệch giữa tốc độ xử lý của CPU và bộ nhớ chính; còn bộ nhớ chính lưu đệm dữ liệu từ ổ cứng để giải quyết vấn đề tốc độ truy cập ổ cứng quá chậm.**

Để dễ hiểu hơn, tôi đã vẽ một sơ đồ CPU Cache đơn giản như bên dưới.

> **🐛 Sửa lỗi (xem: [issue#1848](https://github.com/Snailclimb/JavaGuide/issues/1848))**: Hoàn thiện những chỗ vẽ chưa chặt chẽ trong sơ đồ mô hình CPU Cache.

![Sơ đồ mô hình CPU Cache](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/cpu-cache-f9ad1aa3.png)

CPU Cache hiện đại thường chia làm ba tầng, lần lượt gọi là L1, L2, L3 Cache. Một số CPU có thể còn có L4 Cache, nhưng khá hiếm nên không bàn ở đây.

**Cách hoạt động của CPU Cache:** Trước tiên sao chép một bản dữ liệu vào CPU Cache; khi CPU cần dùng đến thì có thể đọc dữ liệu trực tiếp từ CPU Cache, sau khi tính toán xong thì ghi dữ liệu kết quả ngược trở lại Main Memory. Tuy nhiên, làm vậy tồn tại **vấn đề không nhất quán bộ nhớ đệm (Cache Inconsistency)**! Ví dụ khi tôi thực hiện một thao tác `i++`, nếu hai Thread chạy đồng thời, giả sử cả hai Thread đều đọc `i=1` từ CPU Cache, sau khi hai Thread thực hiện xong phép tính `i++` rồi ghi ngược lại Main Memory thì `i=2`, trong khi kết quả đúng phải là `i=3`.

**Để giải quyết vấn đề không nhất quán bộ nhớ đệm, CPU có thể thông qua việc đặt ra các giao thức nhất quán bộ nhớ đệm (Cache Coherence Protocol, ví dụ [giao thức MESI](https://zh.wikipedia.org/wiki/MESI%E5%8D%8F%E8%AE%AE)) hoặc các biện pháp khác để xử lý.** Giao thức nhất quán bộ nhớ đệm này chính là những nguyên tắc và quy chuẩn cần tuân thủ khi CPU Cache tương tác với bộ nhớ chính. Trên các CPU khác nhau, giao thức nhất quán bộ nhớ đệm được sử dụng thường cũng khác nhau.

![Giao thức nhất quán bộ nhớ đệm](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/cpu-cache-protocol-5a080c3d.png)

Tính nhất quán của CPU Cache được bộ xử lý và hệ thống con bộ nhớ phối hợp thực hiện. Các kiến trúc bộ xử lý khác nhau còn quy định những loại truy cập bộ nhớ khác nhau có thể xuất hiện theo thứ tự nào dưới góc nhìn của các bộ xử lý khác — điều này thường được gọi là mô hình bộ nhớ phần cứng (Hardware Memory Model). JMM nằm ở tầng ngôn ngữ cao hơn, nên JVM cần ánh xạ các yêu cầu của JMM xuống các lệnh và rào cản (barrier) mà bộ xử lý cụ thể cung cấp.

## Sắp xếp lại lệnh (Instruction Reordering)

Nói xong mô hình CPU Cache, hãy cùng xem tiếp một khái niệm khá quan trọng khác là **Sắp xếp lại lệnh (Instruction Reordering)**.

Để nâng cao tốc độ/hiệu năng thực thi, khi thực thi mã chương trình, máy tính sẽ thực hiện sắp xếp lại thứ tự các lệnh.

**Sắp xếp lại lệnh là gì?** Nói một cách đơn giản, khi hệ thống thực thi mã nguồn, nó không nhất thiết phải thực thi tuần tự theo đúng thứ tự mã mà bạn đã viết.

Các trường hợp sắp xếp lại lệnh phổ biến có 2 dạng dưới đây:

- **Sắp xếp lại do tối ưu hóa trình biên dịch (Compiler Optimization Reordering)**: Trình biên dịch (bao gồm JVM, trình biên dịch JIT, v.v.) sắp xếp lại thứ tự thực thi các câu lệnh với tiền đề không làm thay đổi ngữ nghĩa của chương trình đơn luồng.
- **Sắp xếp lại song song mức lệnh (Instruction-Level Parallel Reordering)**: Bộ xử lý hiện đại áp dụng kỹ thuật song song mức lệnh (Instruction-Level Parallelism, ILP) để thực thi gối đầu nhiều lệnh. Nếu không tồn tại phụ thuộc dữ liệu (data dependency), bộ xử lý có thể thay đổi thứ tự thực thi của các lệnh máy tương ứng với các câu lệnh.

Ngoài ra, hệ thống bộ nhớ cũng có hiện tượng "sắp xếp lại", nhưng không phải là sắp xếp lại theo đúng nghĩa đen. Trong JMM, điều này thể hiện ở việc nội dung giữa bộ nhớ chính và bộ nhớ cục bộ có thể không nhất quán, từ đó dẫn đến chương trình khi chạy dưới đa luồng có thể phát sinh sự cố.

Mã nguồn Java trải qua quá trình biên dịch ra bytecode, thực thi thông dịch hoặc biên dịch JIT, cuối cùng do JVM thực thi các lệnh máy tương ứng trên nền tảng đích. Tối ưu hóa của trình biên dịch, thực thi ngoài thứ tự (out-of-order execution) của bộ xử lý và hành vi của hệ thống con bộ nhớ đều có thể khiến thứ tự quan sát được giữa nhiều luồng khác với thứ tự trực quan trong mã nguồn; chúng không phải là một "đường ống sắp xếp lại" cố định và tuyến tính tuyệt đối.

**Sắp xếp lại lệnh có thể đảm bảo ngữ nghĩa tuần tự (đơn luồng) nhất quán, nhưng không có nghĩa vụ đảm bảo ngữ nghĩa giữa nhiều Thread cũng nhất quán**, vì vậy dưới đa luồng, việc sắp xếp lại lệnh có thể gây ra một số vấn đề.

Đối với sắp xếp lại do tối ưu hóa trình biên dịch và sắp xếp lại lệnh của bộ xử lý (cả sắp xếp lại song song mức lệnh và sắp xếp lại của hệ thống bộ nhớ đều thuộc loại sắp xếp lại lệnh ở cấp độ bộ xử lý), cách xử lý vấn đề này là khác nhau:

- Đối với trình biên dịch, việc sắp xếp lại bị ngăn chặn bằng cách cấm các loại sắp xếp lại cụ thể của trình biên dịch.
- Đối với bộ xử lý, các loại sắp xếp lại cụ thể của bộ xử lý bị ngăn chặn bằng cách chèn rào cản bộ nhớ (Memory Barrier, đôi khi còn gọi là Memory Fence).

> Rào cản bộ nhớ (Memory Barrier, còn gọi là Memory Fence) được dùng để ràng buộc thứ tự và tính khả kiến giữa các thao tác truy cập bộ nhớ cụ thể. Cài đặt cụ thể trên các kiến trúc bộ xử lý khác nhau không giống nhau, không thể hiểu chung chung là "đẩy cache xuống bộ nhớ vật lý" hoặc "làm mất hiệu lực toàn bộ cache"; JVM sẽ căn cứ vào nền tảng đích để lựa chọn các lệnh thỏa mãn ngữ nghĩa của JMM.

## JMM (Java Memory Model)

### JMM là gì? Tại sao cần JMM?

Java là ngôn ngữ lập trình đầu tiên thử nghiệm cung cấp mô hình bộ nhớ. Do mô hình bộ nhớ thời kỳ đầu tồn tại một số khiếm khuyết (ví dụ rất dễ làm suy yếu khả năng tối ưu hóa của trình biên dịch), kể từ Java 5, Java bắt đầu sử dụng mô hình bộ nhớ mới: [JSR-133: Java Memory Model and Thread Specification](http://www.cs.umd.edu/~pugh/java/memoryModel/CommunityReview.pdf).

Thông thường, một ngôn ngữ lập trình cũng có thể tái sử dụng trực tiếp mô hình bộ nhớ ở tầng hệ điều hành. Tuy nhiên, các hệ điều hành khác nhau có mô hình bộ nhớ khác nhau. Nếu tái sử dụng trực tiếp mô hình bộ nhớ của hệ điều hành, rất có thể cùng một bộ mã nguồn chuyển sang một hệ điều hành khác lại không thể chạy đúng được. Ngôn ngữ Java là đa nền tảng, nên nó cần tự cung cấp một bộ mô hình bộ nhớ riêng để che chắn sự khác biệt giữa các hệ điều hành.

Đó mới chỉ là một trong những lý do tồn tại của JMM. Trên thực tế, đối với Java, bạn có thể xem JMM là một bộ quy chuẩn liên quan đến lập trình đồng thời do Java định nghĩa; ngoài việc trừu tượng hóa mối quan hệ giữa Thread và bộ nhớ chính, nó còn quy định quá trình chuyển đổi từ mã nguồn Java sang lệnh thực thi của CPU phải tuân thủ những nguyên tắc và quy chuẩn liên quan đến đồng thời nào, với mục đích chính là đơn giản hóa việc lập trình đa luồng và nâng cao tính khả chuyển của chương trình.

**Tại sao phải tuân thủ những nguyên tắc và quy chuẩn liên quan đến đồng thời này?** Đó là bởi dưới lập trình đồng thời, những thiết kế như CPU cache đa tầng và sắp xếp lại lệnh có thể khiến chương trình chạy gặp sự cố. Chẳng hạn như việc sắp xếp lại lệnh mà chúng ta vừa nhắc tới ở trên có thể khiến việc thực thi chương trình đa luồng xảy ra lỗi; vì vậy JMM đã trừu tượng hóa nguyên tắc happens-before (sẽ giới thiệu chi tiết ở phần sau) để giải quyết vấn đề sắp xếp lại lệnh này.

Nói một cách dễ hiểu, JMM thực chất là định nghĩa ra một số quy chuẩn để giải quyết các vấn đề đó, lập trình viên có thể dựa vào các quy chuẩn này để phát triển chương trình đa luồng thuận tiện hơn. Đối với lập trình viên Java, bạn không cần hiểu rõ nguyên lý tầng dưới mà chỉ cần sử dụng trực tiếp các từ khóa và lớp liên quan đến đồng thời (như `volatile`, `synchronized`, các loại `Lock`) là đã có thể phát triển được chương trình an toàn đồng thời.

### JMM trừu tượng hóa mối quan hệ giữa Thread và bộ nhớ chính như thế nào?

**Java Memory Model (JMM)** trừu tượng hóa mối quan hệ giữa Thread và bộ nhớ chính — chẳng hạn như các biến chia sẻ giữa các Thread phải được lưu trữ trong bộ nhớ chính.

Java đã có mô hình bộ nhớ ngay từ các đặc tả thời kỳ đầu; Java 5 thông qua JSR-133 đã tiến hành tu chỉnh quan trọng đối với nó, làm rõ và tăng cường ngữ nghĩa của `volatile`, `final` và happens-before. JMM cho phép JVM sử dụng thanh ghi, cache cũng như các tối ưu hóa của trình biên dịch để thực hiện việc truy cập biến chia sẻ; nếu chương trình không thiết lập quan hệ đồng bộ cần thiết, một Thread có thể không nhìn thấy bản ghi mới nhất của Thread khác.

Điều này rất giống với mô hình CPU Cache mà chúng ta đã nói ở trên.

**Bộ nhớ chính (Main Memory) là gì? Bộ nhớ cục bộ (Local Memory) là gì?**

- **Bộ nhớ chính (Main Memory)**: JMM dùng nó để trừu tượng hóa các biến có thể chia sẻ giữa các Thread, bao gồm trường instance (instance field), trường static (static field) và phần tử mảng. Biến cục bộ trong phương thức, tham số hình thức và tham số xử lý ngoại lệ không được chia sẻ giữa các Thread, do đó không thuộc loại biến chia sẻ được nói ở đây. Bộ nhớ chính là sự trừu tượng ở tầng đặc tả, không đồng nhất với một vùng bộ nhớ vật lý cụ thể nào.
- **Bộ nhớ cục bộ (Local Memory)**: Mỗi Thread đều có một bộ nhớ cục bộ riêng tư; bộ nhớ cục bộ lưu trữ bản sao của các biến chia sẻ mà Thread đó đã đọc / ghi. Mỗi Thread chỉ có thể thao tác trên biến trong bộ nhớ cục bộ của chính mình, không thể truy cập trực tiếp vào bộ nhớ cục bộ của Thread khác. Nếu giữa các Thread cần giao tiếp, bắt buộc phải thực hiện thông qua bộ nhớ chính. Bộ nhớ cục bộ là một khái niệm do JMM trừu tượng hóa ra, không tồn tại thực tế; nó bao hàm cache, bộ đệm ghi (write buffer), thanh ghi cũng như các tối ưu hóa phần cứng và trình biên dịch khác.

Sơ đồ trừu tượng của Java Memory Model như dưới đây:

![JMM (Java Memory Model)](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jmm-36d9b6ac.png)

Nhìn từ hình trên, nếu Thread 1 và Thread 2 muốn giao tiếp với nhau, bắt buộc phải trải qua 2 bước sau:

1. Thread 1 đồng bộ giá trị bản sao biến chia sẻ đã sửa đổi trong bộ nhớ cục bộ của mình vào bộ nhớ chính.
2. Thread 2 đọc giá trị của biến chia sẻ tương ứng từ bộ nhớ chính.

Nói cách khác, dữ liệu chia sẻ giữa các Thread cần tuân theo quy tắc của JMM để giao tiếp; chỉ khi thiết lập quan hệ happens-before tương ứng thông qua `volatile`, khóa (Lock), khởi chạy và kết thúc Thread, v.v., JMM mới cung cấp đảm bảo tính khả kiến (`Visibility`) cho các thao tác ghi liên quan.

Tuy nhiên, dưới đa luồng, việc thao tác trên một biến chia sẻ trong bộ nhớ chính có khả năng gây ra vấn đề an toàn luồng. Ví dụ:

1. Thread 1 và Thread 2 cùng thao tác trên một biến chia sẻ, một bên thực hiện sửa đổi, một bên thực hiện đọc.
2. Giá trị mà Thread 2 đọc được là giá trị trước khi Thread 1 sửa đổi hay sau khi Thread 1 sửa đổi là không xác định, khả năng nào cũng có thể xảy ra, bởi cả Thread 1 và Thread 2 đều sao chép biến chia sẻ từ bộ nhớ chính vào bộ nhớ làm việc (working memory) của Thread tương ứng trước.

Về giao thức tương tác cụ thể giữa bộ nhớ chính và bộ nhớ làm việc — tức chi tiết cài đặt cách một biến được sao chép từ bộ nhớ chính sang bộ nhớ làm việc và được đồng bộ từ bộ nhớ làm việc về bộ nhớ chính — Java Memory Model định nghĩa tám thao tác đồng bộ sau (nắm để biết, không cần học vẹt):

- **lock (khóa)**: Tác động lên biến trong bộ nhớ chính, đánh dấu biến đó là biến thuộc quyền sở hữu độc quyền của một Thread.
- **unlock (mở khóa)**: Tác động lên biến trong bộ nhớ chính, giải phóng trạng thái khóa của biến; chỉ biến đã được giải phóng trạng thái khóa mới có thể bị Thread khác khóa.
- **read (đọc)**: Tác động lên biến trong bộ nhớ chính, truyền giá trị của một biến từ bộ nhớ chính sang bộ nhớ làm việc của Thread để thao tác `load` tiếp theo sử dụng.
- **load (nạp)**: Đưa giá trị biến thu được từ bộ nhớ chính thông qua thao tác `read` vào bản sao biến trong bộ nhớ làm việc.
- **use (sử dụng)**: Truyền giá trị của một biến trong bộ nhớ làm việc sang bộ máy thực thi (execution engine); mỗi khi máy ảo gặp một lệnh bytecode cần dùng đến giá trị biến thì sẽ thực hiện thao tác này.
- **assign (gán)**: Tác động lên biến trong bộ nhớ làm việc, gán giá trị nhận được từ bộ máy thực thi cho biến trong bộ nhớ làm việc; mỗi khi máy ảo gặp một lệnh bytecode gán giá trị cho biến thì sẽ thực hiện thao tác này.
- **store (lưu)**: Tác động lên biến trong bộ nhớ làm việc, truyền giá trị của một biến trong bộ nhớ làm việc sang bộ nhớ chính để thao tác `write` tiếp theo sử dụng.
- **write (ghi)**: Tác động lên biến trong bộ nhớ chính, đưa giá trị biến thu được từ bộ nhớ làm việc thông qua thao tác `store` vào biến trong bộ nhớ chính.

Ngoài 8 thao tác đồng bộ này ra, còn quy định các quy tắc đồng bộ sau để đảm bảo việc thực thi đúng đắn của các thao tác đồng bộ trên (nắm để biết, không cần học vẹt):

- Không cho phép một Thread đồng bộ dữ liệu từ bộ nhớ làm việc về lại bộ nhớ chính một cách vô cớ (khi chưa từng xảy ra bất kỳ thao tác `assign` nào).
- Một biến mới chỉ có thể "ra đời" trong bộ nhớ chính; không cho phép sử dụng trực tiếp một biến chưa được khởi tạo (`load` hoặc `assign`) trong bộ nhớ làm việc — nói cách khác, trước khi thực hiện thao tác `use` và `store` trên một biến thì bắt buộc phải đã thực hiện thao tác `assign` và `load` trước đó.
- Một biến tại cùng một thời điểm chỉ cho phép một Thread thực hiện thao tác `lock` trên nó, nhưng thao tác `lock` có thể được cùng một Thread thực hiện lặp lại nhiều lần; sau nhiều lần thực hiện `lock`, chỉ khi thực hiện đúng số lần thao tác `unlock` tương ứng thì biến mới được mở khóa.
- Nếu thực hiện thao tác `lock` lên một biến, giá trị của biến này trong bộ nhớ làm việc sẽ bị xóa sạch; trước khi bộ máy thực thi sử dụng biến này, cần thực hiện lại thao tác `load` hoặc `assign` để khởi tạo giá trị biến.
- Nếu một biến trước đó chưa bị khóa bởi thao tác `lock` thì không được phép thực hiện thao tác `unlock` lên nó, và cũng không được phép `unlock` một biến đang bị Thread khác giữ khóa.
- ……

### Vùng nhớ Java (Java Memory Areas) và JMM có gì khác nhau?

Đây là một câu hỏi khá phổ biến, rất nhiều người mới học rất dễ nhầm lẫn. **Vùng nhớ Java và mô hình bộ nhớ Java là hai thứ hoàn toàn khác nhau**:

- Cấu trúc bộ nhớ JVM liên quan đến các vùng dữ liệu lúc chạy (runtime data areas) của máy ảo Java, định nghĩa cách JVM phân chia vùng lưu trữ dữ liệu chương trình khi chạy — chẳng hạn Heap chủ yếu dùng để lưu các đối tượng (object instance).
- Java Memory Model (JMM) liên quan đến lập trình đồng thời trong Java, trừu tượng hóa mối quan hệ giữa Thread và bộ nhớ chính (chẳng hạn các biến chia sẻ giữa các Thread phải được lưu trữ trong bộ nhớ chính), đồng thời quy định quá trình chuyển đổi từ mã nguồn Java sang lệnh thực thi của CPU phải tuân thủ những nguyên tắc và quy chuẩn liên quan đến đồng thời nào; mục đích chính là để đơn giản hóa việc lập trình đa luồng và nâng cao tính khả chuyển của chương trình.

### Nguyên tắc happens-before là gì?

Khái niệm happens-before ra đời sớm nhất trong bài báo xuất bản năm 1978 của Leslie Lamport: ["Time, Clocks, and the Ordering of Events in a Distributed System"](https://lamport.azurewebsites.net/pubs/time-clocks.pdf). Trong bài báo này, Leslie Lamport đã đề xuất khái niệm [đồng hồ logic (Logical Clock)](https://writings.sh/post/logical-clocks), và đây cũng trở thành thuật toán đồng hồ logic đầu tiên. Trong môi trường phân tán, thông qua một loạt quy tắc để định nghĩa sự thay đổi của đồng hồ logic, người ta có thể dùng đồng hồ logic để phán đoán thứ tự trước sau của các sự kiện trong hệ thống phân tán. **Đồng hồ logic không đo lường bản thân thời gian vật lý mà chỉ phân biệt thứ tự xảy ra trước sau của các sự kiện; bản chất của nó chính là định nghĩa một quan hệ happens-before.**

Bối cảnh ra đời của khái niệm happens-before vừa nêu trên không phải trọng tâm, chỉ cần hiểu sơ qua là được.

JSR-133 đã đưa khái niệm happens-before vào để mô tả tính khả kiến bộ nhớ giữa hai thao tác.

**Tại sao cần nguyên tắc happens-before?** Nguyên tắc happens-before ra đời nhằm tạo sự cân bằng giữa lập trình viên và trình biên dịch, bộ xử lý. Lập trình viên theo đuổi mô hình bộ nhớ mạnh (strong memory model) dễ hiểu và dễ lập trình — chỉ cần viết mã theo đúng quy tắc định sẵn là được. Trình biên dịch và bộ xử lý lại theo đuổi mô hình bộ nhớ yếu (weak memory model) ít ràng buộc hơn để chúng có thể tối ưu hết mức nhằm tối đa hóa hiệu năng. Tư tưởng thiết kế của nguyên tắc happens-before thực ra rất đơn giản:

- Để ràng buộc lên trình biên dịch và bộ xử lý ít nhất có thể, miễn là không làm thay đổi kết quả thực thi của chương trình (chương trình đơn luồng và chương trình đa luồng được đồng bộ đúng cách), trình biên dịch và bộ xử lý muốn tối ưu sắp xếp lại lệnh thế nào cũng được.
- Đối với những kiểu sắp xếp lại lệnh làm thay đổi kết quả thực thi của chương trình, JMM yêu cầu trình biên dịch và bộ xử lý bắt buộc phải cấm những kiểu sắp xếp lại lệnh đó.

Hình dưới đây là sơ đồ tư tưởng thiết kế JMM do tôi vẽ lại dựa trên sơ đồ trong cuốn *Nghệ thuật lập trình đồng thời Java* (*The Art of Java Concurrency Programming*).

![Tư tưởng thiết kế JMM](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jmm-design-idea-98712024.png)

Sau khi hiểu tư tưởng thiết kế của nguyên tắc happens-before, hãy cùng xem định nghĩa của JSR-133 về nguyên tắc happens-before:

- Nếu một thao tác happens-before một thao tác khác, thì kết quả thực thi của thao tác thứ nhất sẽ khả kiến (visible) đối với thao tác thứ hai, và thứ tự thực thi của thao tác thứ nhất xếp trước thao tác thứ hai.
- Việc tồn tại quan hệ happens-before giữa hai thao tác không đồng nghĩa với việc cài đặt cụ thể của nền tảng Java bắt buộc phải thực thi theo đúng thứ tự do quan hệ happens-before chỉ định. Nếu kết quả thực thi sau khi sắp xếp lại lệnh nhất quán với kết quả khi thực thi theo quan hệ happens-before, thì JMM cũng cho phép việc sắp xếp lại lệnh như vậy.

Hãy xem đoạn mã dưới đây:

```java
int userNum = getUserNum();   // 1
int teacherNum = getTeacherNum();   // 2
int totalNum = userNum + teacherNum;  // 3
```

- 1 happens-before 2
- 2 happens-before 3
- 1 happens-before 3

Mặc dù 1 happens-before 2, việc sắp xếp lại thứ tự giữa 1 và 2 sẽ không ảnh hưởng đến kết quả thực thi của đoạn mã, nên JMM cho phép trình biên dịch và bộ xử lý thực hiện kiểu sắp xếp lại này. Tuy nhiên 1 và 2 bắt buộc phải hoàn thành trước khi 3 thực thi, tức là 1, 2 happens-before 3.

**Ý nghĩa mà nguyên tắc happens-before muốn biểu đạt thực chất không phải là một thao tác xảy ra trước một thao tác khác về mặt vật lý, dù đứng ở góc độ lập trình viên hiểu như vậy cũng không có trở ngại gì. Nói chính xác hơn, nó muốn biểu đạt rằng kết quả của thao tác trước là khả kiến đối với thao tác sau, bất kể hai thao tác đó có nằm trong cùng một Thread hay không.**

Ví dụ: thao tác 1 happens-before thao tác 2; ngay cả khi thao tác 1 và thao tác 2 không nằm trong cùng một Thread, JMM vẫn đảm bảo kết quả của thao tác 1 là khả kiến đối với thao tác 2.

### Các quy tắc happens-before phổ biến là gì? Hãy chia sẻ cách hiểu của bạn?

happens-before có nhiều quy tắc, dưới đây liệt kê 5 quy tắc thường dùng nhất:

1. **Quy tắc thứ tự chương trình (Program Order Rule)**: Trong cùng một Thread, theo thứ tự mã nguồn, thao tác viết ở phía trước happens-before thao tác viết ở phía sau;
2. **Quy tắc khóa Monitor (Monitor Lock Rule)**: Thao tác mở khóa (unlock) đối với một monitor happens-before thao tác khóa (lock) tiếp theo đối với cùng một monitor đó;
3. **Quy tắc biến volatile (Volatile Variable Rule)**: Thao tác ghi đối với một biến `volatile` happens-before thao tác đọc tiếp theo đối với chính biến đó;
4. **Quy tắc bắc cầu (Transitivity Rule)**: Nếu A happens-before B, và B happens-before C, thì A happens-before C;
5. **Quy tắc khởi chạy Thread (Thread Start Rule)**: Phương thức `start()` của đối tượng `Thread` happens-before mọi hành động của Thread đó.

Danh sách này chưa đầy đủ, ngoài ra còn bao gồm các quy tắc về kết thúc Thread, ngắt (interrupt) Thread, v.v. Nếu giữa hai lần truy cập xung đột không thể suy ra quan hệ happens-before thông qua đầy đủ các quy tắc thì có thể tạo thành tranh chấp dữ liệu (data race), khiến tính khả kiến và thứ tự của chúng không thể được đảm bảo theo trực giác đơn luồng; điều này không tương đương với việc JVM có thể hoán đổi tùy ý hai lệnh bất kỳ, bởi kết quả thực thi vẫn chịu ràng buộc bởi các quy tắc nhất quán và nhân quả của JMM.

### happens-before và JMM có mối quan hệ gì?

Mối quan hệ giữa happens-before và JMM được minh họa như hình dưới đây:

![jmm-vs-happens-before](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/jmm-vs-happens-before-624bca7e.png)

- JMM cung cấp cho lập trình viên **"các quy tắc happens-before"** (như quy tắc thứ tự chương trình, quy tắc biến `volatile`, v.v.). Đây là một lớp ảo giác về **"mô hình bộ nhớ mạnh"**: lập trình viên không cần quan tâm đến các chi tiết sắp xếp lại lệnh phức tạp ở tầng dưới, chỉ cần viết mã tuân theo những quy tắc này là có thể đảm bảo tính khả kiến bộ nhớ dưới đa luồng.
- Khi thực thi, JVM sẽ ánh xạ các quy tắc happens-before xuống các cài đặt cụ thể. Để vừa đảm bảo tính đúng đắn vừa không đánh mất hiệu năng, JMM chỉ **"cấm những kiểu sắp xếp lại lệnh làm ảnh hưởng đến kết quả thực thi"**. Đối với những kiểu sắp xếp lại không làm ảnh hưởng đến kết quả thực thi đơn luồng, JMM cho phép thực hiện.
- Ở tầng thấp nhất là **"các quy tắc sắp xếp lại lệnh"** thực tế của trình biên dịch và bộ xử lý.

Tóm lại, JMM giống như một tầng trung gian: hướng lên trên, nó cung cấp cho lập trình viên mô hình lập trình đơn giản thông qua happens-before; hướng xuống dưới, nó cấm các kiểu sắp xếp lại lệnh đặc thù để tận dụng hiệu năng phần cứng tầng dưới. Thiết kế này vừa đảm bảo an toàn đa luồng, vừa giải phóng tối đa hiệu năng của phần cứng.

## Nhìn lại ba đặc tính quan trọng của lập trình đồng thời

### Tính nguyên tử (`Atomicity`)

Một thao tác hoặc nhiều thao tác, hoặc tất cả các thao tác đều được thực thi trọn vẹn mà không bị gián đoạn bởi bất kỳ yếu tố nào, hoặc tất cả đều không được thực thi.

Trong Java, có thể nhờ vào `synchronized`, các loại `Lock` cũng như các lớp nguyên tử (`Atomic`) để hiện thực hóa tính nguyên tử.

`synchronized` và các loại `Lock` có thể đảm bảo tại bất kỳ thời điểm nào chỉ có duy nhất một Thread truy cập vào khối mã đó, vì vậy có thể đảm bảo tính nguyên tử. Còn các lớp nguyên tử sử dụng thao tác CAS (Compare and Swap) — cũng có thể kết hợp dùng từ khóa `volatile` hoặc `final` — để đảm bảo thao tác nguyên tử.

### Tính khả kiến (`Visibility`)

Khi một Thread đã sửa đổi một biến chia sẻ, các Thread khác có thể ngay lập tức nhìn thấy giá trị mới nhất sau khi sửa đổi.

Trong Java, có thể nhờ vào `synchronized`, `volatile` cũng như các loại `Lock` để hiện thực hóa tính khả kiến.

Nếu khai báo biến là `volatile`, giữa thao tác ghi và thao tác đọc tiếp theo đối với biến đó sẽ thiết lập quan hệ happens-before. JVM bắt buộc phải đảm bảo ngữ nghĩa về tính khả kiến và thứ tự tương ứng, nhưng cài đặt cụ thể không yêu cầu lần nào cũng phải truy cập bộ nhớ chính vật lý.

### Tính tuần tự (`Ordering`)

Do vấn đề sắp xếp lại lệnh (Instruction Reordering), thứ tự thực thi của mã chưa chắc đã là thứ tự khi viết mã.

Như chúng ta đã nhắc tới ở phần nói về sắp xếp lại lệnh phía trên:

> **Sắp xếp lại lệnh có thể đảm bảo ngữ nghĩa tuần tự (đơn luồng) nhất quán, nhưng không có nghĩa vụ đảm bảo ngữ nghĩa giữa nhiều Thread cũng nhất quán**, vì vậy dưới đa luồng, việc sắp xếp lại lệnh có thể gây ra một số vấn đề.

Trong Java, `volatile` sẽ ràng buộc các kiểu sắp xếp lại lệnh liên quan đến việc đọc và ghi biến đó mà có khả năng phá vỡ ngữ nghĩa bộ nhớ của nó, chứ không phải cấm toàn bộ mọi tối ưu hóa sắp xếp lại lệnh.

## Tổng kết

- Java là ngôn ngữ đầu tiên thử nghiệm cung cấp mô hình bộ nhớ, mục đích chính là để đơn giản hóa lập trình đa luồng và nâng cao tính khả chuyển của chương trình.
- CPU có thể giải quyết vấn đề không nhất quán bộ nhớ đệm thông qua việc đặt ra giao thức nhất quán bộ nhớ đệm (như [giao thức MESI](https://zh.wikipedia.org/wiki/MESI%E5%8D%8F%E8%AE%AE)).
- Để nâng cao tốc độ/hiệu năng thực thi, khi thực thi mã chương trình, máy tính sẽ thực hiện sắp xếp lại lệnh. Nói đơn giản, hệ thống khi thực thi mã không nhất thiết thực thi theo đúng thứ tự bạn đã viết. **Sắp xếp lại lệnh có thể đảm bảo ngữ nghĩa tuần tự nhất quán, nhưng không có nghĩa vụ đảm bảo ngữ nghĩa giữa nhiều Thread cũng nhất quán**, nên dưới đa luồng, việc sắp xếp lại lệnh có thể gây ra một số vấn đề.
- Bạn có thể coi JMM là một bộ quy chuẩn liên quan đến lập trình đồng thời do Java định nghĩa; ngoài việc trừu tượng hóa mối quan hệ giữa Thread và bộ nhớ chính, nó còn quy định quá trình chuyển đổi từ mã nguồn Java sang lệnh thực thi của CPU phải tuân thủ những nguyên tắc và quy chuẩn liên quan đến đồng thời nào, mục đích chính là để đơn giản hóa lập trình đa luồng và nâng cao tính khả chuyển của chương trình.
- JSR-133 đã đưa khái niệm happens-before vào để mô tả tính khả kiến bộ nhớ giữa hai thao tác.

## Tài liệu tham khảo

- *Nghệ thuật lập trình đồng thời Java* (*The Art of Java Concurrency Programming*), Chương 3: Java Memory Model
- *Đa luồng Java từ cơ bản đến chuyên sâu*: <http://concurrent.redspider.group/RedSpider.html>
- Nghiên cứu về sắp xếp lại truy cập bộ nhớ trong Java: <https://tech.meituan.com/2014/09/23/java-memory-reordering.html>
- Này bạn học, Java Memory Model (JMM) bạn cần đây rồi: <https://xie.infoq.cn/article/739920a92d0d27e2053174ef2>
- JSR 133 (Java Memory Model) FAQ: <https://www.cs.umd.edu/~pugh/java/memoryModel/jsr-133-faq.html>
