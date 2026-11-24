---
title: Tổng hợp câu hỏi phỏng vấn thường gặp về Hệ điều hành (Phần 2)
description: Tổng hợp các câu hỏi phỏng vấn hệ điều hành tần suất cao mới nhất (Phần 2), bao gồm quản lý bộ nhớ, VSZ/RSS/PSS, bộ nhớ ảo, TLB, Page Fault, thay thế trang, blocking I/O, I/O multiplexing, zero-copy, hệ thống tập tin, Page Cache, fsync và điều phối đĩa.
category: Cơ sở máy tính
tag:
  - Hệ điều hành
head:
  - - meta
    - name: keywords
      content: câu hỏi phỏng vấn hệ điều hành, quản lý bộ nhớ, VSZ, RSS, PSS, bộ nhớ ảo, không gian địa chỉ tiến trình, cô lập tiến trình, bộ nhớ dùng chung, phân trang vs phân đoạn, thuật toán thay thế trang, phân mảnh bộ nhớ, buddy system, TLB, Page Fault, lỗi thiếu trang, SIGSEGV, Swap, OOM, blocking I/O, system call read, zero-copy, mmap, sendfile, splice, I/O multiplexing, select, poll, epoll, file system, inode, VFS, Page Cache, fsync
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/operating-system-basic-questions-02.md
---

Bài viết *Tổng hợp câu hỏi phỏng vấn thường gặp về Hệ điều hành (Phần 2)* này tiếp nối phần trước, tập trung trọng điểm vào **quản lý bộ nhớ, bộ nhớ ảo, phân trang và phân đoạn, TLB, lỗi thiếu trang (Page Fault), thay thế trang, I/O multiplexing, zero-copy, hệ thống tập tin và điều phối đĩa**.

Nếu như phần 1 thiên về "tiến trình, luồng và kiểm soát đồng thời", thì phần này thiên về "cách chương trình thực sự sử dụng bộ nhớ, thực hiện I/O và tương tác với hệ thống tập tin trong quá trình chạy". Những nội dung này thoạt nhìn có vẻ xa vời với mã nguồn nghiệp vụ hàng ngày, nhưng rất nhiều vấn đề backend rốt cuộc đều quy tụ về đây: Tại sao `mmap` lại bớt được một lần sao chép? Tại sao `epoll` lại gánh được hàng chục nghìn kết nối đồng thời? Tại sao cùng một địa chỉ ảo ở hai tiến trình khác nhau lại không hề dẫm chân lên nhau? Tại sao việc phát sinh lỗi thiếu trang liên tục lại khiến hệ thống chậm chạp rõ rệt?

Khi đọc bài viết này, bạn nên bám sát một sợi dây xuyên suốt: **Hệ điều hành quản lý địa chỉ và sự cô lập thông qua bộ nhớ ảo, quản lý luồng dữ liệu thông qua cơ chế I/O, và quản lý dữ liệu bền vững thông qua hệ thống tập tin**. Xâu chuỗi được sợi dây này, rất nhiều khái niệm rời rạc sẽ không còn là những thuật ngữ khô khan.

## Quản lý bộ nhớ

### Quản lý bộ nhớ chủ yếu làm những gì?

![Tổng quan trách nhiệm quản lý bộ nhớ](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-management-responsibilities-33a411e9.webp)

Khi đi phỏng vấn, câu hỏi "quản lý bộ nhớ làm những gì" có thể được tóm tắt qua 5 nhiệm vụ chính:

- **Cấp phát và thu hồi bộ nhớ**: Bộ cấp phát ở User Mode gửi yêu cầu xin cấp phát hoặc giải phóng các vùng địa chỉ ảo tới kernel thông qua các giao diện như `brk()`, `mmap()`; sau đó kernel sẽ quản lý các trang vật lý và đối tượng kernel tương ứng.
- **Chuyển đổi địa chỉ (Address Translation)**: Chương trình truy cập địa chỉ ảo, bộ phận MMU trong CPU phối hợp cùng bảng trang (page table) và TLB để dịch địa chỉ ảo thành địa chỉ vật lý.
- **Cô lập tiến trình và bảo vệ quyền hạn**: Mỗi tiến trình đều có không gian địa chỉ riêng biệt, các mục trong bảng trang còn ghi lại các quyền đọc, ghi, thực thi, cũng như quyền truy cập ở chế độ User Mode / Kernel Mode.
- **Thu hồi trang và hoán đổi trang (Paging/Swapping)**: Khi bộ nhớ vật lý căng thẳng, kernel sẽ thu hồi các trang tập tin (file-backed pages) hoặc trang ẩn danh (anonymous pages), và khi cần thiết sẽ ghi các trang ẩn danh vào Swap.
- **Chia sẻ và ánh xạ (Sharing & Mapping)**: Việc chia sẻ thư viện động, IPC qua bộ nhớ dùng chung, ánh xạ tập tin `mmap()`, Copy-On-Write (COW) đều phụ thuộc vào năng lực ánh xạ từ địa chỉ ảo sang các trang vật lý.

Trong buổi phỏng vấn, hãy nắm chắc sợi dây cốt lõi: Quản lý bộ nhớ tách rời địa chỉ mà chương trình nhìn thấy với bộ nhớ vật lý thực tế, sau đó dùng các cơ chế cấp phát, ánh xạ, bảo vệ và thu hồi để quản lý toàn bộ bộ nhớ một cách quy củ.

### Điểm khác biệt giữa VSZ, RSS và PSS là gì?

Trong Linux, khi theo dõi mức sử dụng bộ nhớ của tiến trình, ba chỉ số dễ gây nhầm lẫn nhất là VSZ, RSS và PSS:

- **VSZ (Virtual Memory Size)**: Tổng kích thước không gian địa chỉ ảo mà tiến trình đã ánh xạ. Nó bao gồm các ánh xạ ẩn danh chưa thực sự chiếm giữ RAM vật lý, ánh xạ file, thư viện dùng chung và các dải địa chỉ được đặt trước. Không thể coi VSZ là mức chiếm dụng bộ nhớ vật lý thực tế.
- **RSS (Resident Set Size)**: Tổng dung lượng các trang bộ nhớ vật lý hiện đang thực sự nằm trong RAM và được ánh xạ cho tiến trình đó. Thư viện dùng chung, bộ nhớ dùng chung và các trang chia sẻ trong Page Cache cũng được tính đầy đủ vào RSS của tất cả các tiến trình tham chiếu tới chúng.
- **PSS (Proportional Set Size)**: Mức chiếm dụng bộ nhớ sau khi chia đều tỷ lệ các trang dùng chung. Nếu một trang vật lý được chia sẻ bởi 4 tiến trình, thì PSS của mỗi tiến trình chỉ tính 1/4 dung lượng trang đó.

Do đó, để xem mức chiếm dụng bộ nhớ thường trú của một tiến trình đơn lẻ, bạn có thể tham khảo RSS; nhưng để ước tính tổng mức chiếm dụng thực tế của nhiều tiến trình cộng lại, PSS mới là chỉ số chính xác hơn. Việc cộng trực tiếp RSS của nhiều tiến trình lại với nhau chắc chắn sẽ tính trùng lặp các trang dùng chung.

Các lệnh kiểm tra thông dụng:

```bash
grep -E 'VmSize|VmRSS|RssAnon|RssFile|RssShmem|VmSwap' /proc/<pid>/status
cat /proc/<pid>/smaps_rollup
```

### Phân mảnh bộ nhớ là gì?

Phân mảnh bộ nhớ (Memory Fragmentation) sinh ra trong quá trình liên tục cấp phát và giải phóng bộ nhớ, thường chia thành hai loại sau:

- **Phân mảnh trong (Internal Memory Fragmentation)**: Bộ nhớ đã được cấp phát cho tiến trình sử dụng nhưng tiến trình lại không dùng hết. Nguyên nhân chính dẫn tới phân mảnh trong là do khi hệ thống cấp phát bộ nhớ theo kích thước cố định (ví dụ theo lũy thừa của 2), lượng bộ nhớ cấp phát thực tế có thể lớn hơn nhu cầu thực của tiến trình. Lấy ví dụ: một tiến trình chỉ cần 65 byte bộ nhớ, nhưng hệ thống lại cấp phát cho nó một khối có kích thước 128 byte (2^7), thì 63 byte dôi ra không dùng đến chính là phân mảnh trong.
- **Phân mảnh ngoài (External Memory Fragmentation)**: Các vùng bộ nhớ liên tục chưa được cấp phát có kích thước quá nhỏ, đến mức không thể thỏa mãn bất kỳ yêu cầu xin cấp phát bộ nhớ nào của các tiến trình; những mẩu bộ nhớ nhỏ và rời rạc này được gọi là phân mảnh ngoài. Nói cách khác, phân mảnh ngoài là bộ nhớ chưa được phân phối cho ai nhưng cũng không thể đem ra sử dụng được. Cơ chế phân đoạn (segmentation) mà chúng ta giới thiệu sau đây sẽ dẫn tới hiện tượng phân mảnh ngoài.

![Cấp phát bộ nhớ liên tục và phân mảnh](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-fragmentation-953d5791.webp)

Phân mảnh bộ nhớ làm suy giảm hiệu suất tận dụng bộ nhớ, do đó làm thế nào để giảm thiểu phân mảnh bộ nhớ là một bài toán tối quan trọng trong thiết kế quản lý bộ nhớ.

### Các phương thức quản lý bộ nhớ phổ biến gồm những gì?

Phương thức quản lý bộ nhớ có thể chia đơn giản thành hai nhóm:

- **Quản lý bộ nhớ liên tục**: Cấp phát một vùng không gian bộ nhớ vật lý liên tục cho một chương trình người dùng, hiệu suất tận dụng bộ nhớ nói chung không cao.
- **Quản lý bộ nhớ không liên tục**: Cho phép bộ nhớ của một chương trình nằm rải rác trên các vùng nhớ không liền kề nhau, mang tính linh hoạt cao hơn rất nhiều.

#### Quản lý bộ nhớ liên tục

**Quản lý dạng khối (Block-based)** là phương thức quản lý bộ nhớ liên tục thời kỳ đầu của hệ điều hành, gặp phải vấn đề phân mảnh bộ nhớ rất nghiêm trọng. Hệ thống chia bộ nhớ thành nhiều khối có kích thước cố định, mỗi khối chỉ chứa duy nhất một tiến trình. Nếu chương trình cần bộ nhớ, hệ điều hành sẽ cấp phát nguyên một khối; nếu chương trình chỉ cần một dung lượng rất nhỏ, phần lớn không gian của khối đó sẽ bị lãng phí hoàn toàn (phân mảnh trong). Ngoài phân mảnh trong, giữa hai khối bộ nhớ còn có thể xuất hiện các khoảng trống phân mảnh ngoài quá nhỏ để cấp phát tiếp.

Trong hệ điều hành Linux, việc quản lý bộ nhớ liên tục ở cấp độ trang vật lý áp dụng **Thuật toán Buddy System (Hệ thống bạn bè)**. Đây là thuật toán cấp phát bộ nhớ liên tục kinh điển, giúp giải quyết hiệu quả vấn đề phân mảnh ngoài. Tư tưởng chủ đạo của Buddy System là chia bộ nhớ theo lũy thừa của 2 (mỗi khối bộ nhớ đều có kích thước là 2^n, ví dụ 2^6 = 64 KB), và ghép các khối bộ nhớ liền kề có cùng kích thước thành một cặp "bạn bè" (lưu ý: **bắt buộc phải liền kề nhau mới được coi là bạn bè**).

Khi có yêu cầu cấp phát, Buddy System sẽ cố gắng tìm khối bộ nhớ có kích thước vừa vặn nhất. Nếu khối tìm thấy quá lớn, nó sẽ chia đôi khối đó thành hai khối bạn bè bằng nhau. Nếu vẫn còn lớn, nó tiếp tục chia đôi cho đến khi đạt kích thước thích hợp.

Khi hai khối bạn bè liền kề nhau đều được giải phóng, hệ thống sẽ tự động sáp nhập hai khối này lại thành một khối lớn hơn gấp đôi để phục vụ cho các lần cấp phát dung lượng lớn sau này. Nhờ đó hạn chế được phân mảnh ngoài và nâng cao tỷ lệ sử dụng bộ nhớ.

![Quản lý bộ nhớ Buddy System](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/linux-buddy-system-36d2b5a0.png)

Dù đã giải quyết triệt để phân mảnh ngoài, Buddy System vẫn tồn tại vấn đề tỷ lệ sử dụng bộ nhớ chưa tối ưu do phân mảnh trong. Điều này xuất phát từ việc Buddy System chỉ cấp phát các khối có kích thước 2^n; khi kích thước cần cấp phát không phải bội số lũy thừa của 2, bộ nhớ dôi ra sẽ bị lãng phí. Ví dụ: cần cấp phát 65 byte thì hệ thống vẫn buộc phải cấp nguyên một khối 2^7 = 128 byte.

![Vấn đề lãng phí bộ nhớ trong Buddy System](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/buddy-system-memory-waste-ad263360.png)

Để xử lý bài toán phân mảnh trong và chi phí hiệu năng khi cấp phát thường xuyên các đối tượng kích thước nhỏ, Linux bổ sung thêm bộ cấp phát **SLAB/SLUB** bên trên Buddy System. Chúng sẽ lưu bộ nhớ đệm (cache) cho các đối tượng kernel thông dụng, tái sử dụng các khối bộ nhớ đã được khởi tạo theo từng loại đối tượng, loại bỏ chi phí lặp đi lặp lại của việc cấp phát, khởi tạo và giải phóng.

#### Quản lý bộ nhớ không liên tục

Quản lý bộ nhớ không liên tục gồm 3 phương thức chính:

- **Cơ chế phân đoạn (Segmentation)**: Quản lý và cấp phát bộ nhớ vật lý dưới dạng các đoạn (segment - một đoạn bộ nhớ vật lý liên tục). Không gian địa chỉ ảo của ứng dụng được chia thành các đoạn có kích thước không bằng nhau, mỗi đoạn mang ý nghĩa logic rõ rệt (ví dụ đoạn mã chính MAIN, đoạn chương trình con X, đoạn dữ liệu D, đoạn ngăn xếp S...).
- **Cơ chế phân trang (Paging)**: Chia bộ nhớ vật lý thành các khung trang vật lý (page frame) liên tục có kích thước bằng nhau, và chia không gian địa chỉ ảo của ứng dụng thành các trang ảo (virtual page) liên tục có kích thước bằng nhau. Đây là phương thức quản lý bộ nhớ được sử dụng rộng rãi nhất trong các hệ điều hành hiện đại.
- **Cơ chế phân đoạn kết hợp phân trang (Segmented Paging)**: Kết hợp cả phân đoạn và phân trang. Không gian địa chỉ của chương trình trước hết được chia thành các đoạn theo logic, sau đó mỗi đoạn lại được chia nhỏ thành các trang có kích thước cố định. Bộ nhớ vật lý vẫn được cấp phát theo khung trang.

### Bộ nhớ ảo (Virtual Memory)

#### Bộ nhớ ảo là gì? Có tác dụng gì?

**Bộ nhớ ảo (Virtual Memory)** là một tầng trừu tượng hóa bộ nhớ do hệ điều hành cung cấp. Chương trình nhìn thấy một không gian địa chỉ ảo liên tục, riêng tư; còn dữ liệu thực sự nằm ở vị trí nào trên các thanh RAM vật lý thì do hệ điều hành và phần cứng phối hợp quyết định.

Nói một cách đơn giản, bộ nhớ ảo đã tách rời "địa chỉ mà chương trình sử dụng" với "địa chỉ vật lý thực tế trên thanh RAM". Khi tiến trình truy cập một địa chỉ ảo, bộ phận MMU trong CPU sẽ dựa vào quan hệ ánh xạ trong bảng trang để chuyển đổi địa chỉ ảo thành địa chỉ vật lý, sau đó mới truy xuất vào bộ nhớ thực.

![Bộ nhớ ảo đóng vai trò cầu nối cho tiến trình truy cập bộ nhớ chính](/media/jg/ext/oss.javaguide.cn/xingqiu/virtual-memory-8588d30a.png)

Tóm lại, bộ nhớ ảo mang lại những khả năng quan trọng sau:

- **Cô lập tiến trình (Process Isolation)**: Mỗi tiến trình sở hữu không gian địa chỉ ảo và bảng trang riêng. Ngay cả khi các tiến trình khác nhau dùng cùng một chỉ số địa chỉ ảo, chúng vẫn có thể được ánh xạ tới các trang vật lý hoàn toàn khác nhau, không thể giẫm đạp hay làm hỏng bộ nhớ của nhau.
- **Nâng cao tỷ lệ sử dụng bộ nhớ vật lý**: Hệ điều hành không cần phải nạp toàn bộ mã nguồn và dữ liệu của tiến trình vào RAM cùng một lúc, mà chỉ nạp những trang thực sự đang được sử dụng ở thời điểm hiện tại.
- **Đơn giản hóa việc quản lý bộ nhớ**: Tiến trình chỉ nhìn thấy một dải không gian địa chỉ ảo phẳng và liên tục, trong khi bộ nhớ vật lý có thể nằm rải rác trên các khung trang rời rạc; công việc chắp nối phức tạp được giao toàn quyền cho bảng trang và MMU.
- **Nhiều tiến trình cùng chia sẻ bộ nhớ vật lý**: Trong quá trình chạy, các tiến trình nạp rất nhiều thư viện động của hệ điều hành, các thư viện này có thể dùng chung một bản sao trang vật lý duy nhất giữa nhiều tiến trình; các tiến trình cũng có thể chủ động ánh xạ vào cùng một vùng nhớ vật lý qua IPC bộ nhớ dùng chung để trao đổi dữ liệu tốc độ cao.
- **Nâng cao tính an toàn khi sử dụng bộ nhớ**: Kiểm soát chặt chẽ quyền truy cập của tiến trình vào bộ nhớ vật lý, cô lập quyền hạn giữa các tiến trình, gia tăng độ an toàn cho hệ thống.
- **Cung cấp không gian bộ nhớ khả dụng lớn hơn**: Khi bộ nhớ vật lý không đủ dùng, hệ thống có thể hoán đổi các trang tạm thời chưa dùng ra đĩa, khi cần lại nạp về. Nhờ đó không gian bộ nhớ mà chương trình cảm nhận được có thể vượt qua dung lượng RAM vật lý thực tế, mặc dù việc hoán đổi trang liên tục sẽ làm hệ thống chậm đi rõ rệt.

#### Nếu không có bộ nhớ ảo thì sẽ phát sinh vấn đề gì?

Nếu không có bộ nhớ ảo, chương trình sẽ trực tiếp truy cập và thao tác trên bộ nhớ vật lý. Việc bớt đi một tầng trung gian tưởng như đơn giản nhưng lại kéo theo hàng loạt hiểm họa:

1. Chương trình người dùng có thể tùy tiện truy xuất bất kỳ ô nhớ vật lý nào, có thể vô tình ghi đè lên bộ nhớ thiết yếu của hệ thống, dẫn tới việc hệ điều hành bị sập (crash), ảnh hưởng nghiêm trọng tới an ninh hệ thống.
2. Việc chạy đồng thời nhiều chương trình rất dễ gây crash lẫn nhau. Ví dụ bạn muốn chạy cùng lúc WeChat và QQ Music, khi WeChat đang chạy gán giá trị cho ô nhớ địa chỉ `1xxx`, sau đó QQ Music cũng gán giá trị cho ô nhớ `1xxx`, hành động của QQ Music sẽ ghi đè lên dữ liệu trước đó của WeChat, khiến WeChat bị lỗi hoặc văng ứng dụng.
3. Toàn bộ chỉ lệnh và dữ liệu của chương trình đều phải được nạp hết vào RAM vật lý; theo nguyên lý cục bộ, phần lớn trong số đó có thể không bao giờ được đụng tới, gây lãng phí nguồn tài nguyên RAM quý giá.
4. ...

#### Địa chỉ ảo và địa chỉ vật lý là gì?

**Địa chỉ vật lý (Physical Address)** là địa chỉ thực tế trong bộ nhớ vật lý, cụ thể hơn là địa chỉ xuất hiện trên thanh ghi địa chỉ bộ nhớ và bus phần cứng. Địa chỉ bộ nhớ mà chương trình truy cập không phải địa chỉ vật lý, mà là **Địa chỉ ảo (Virtual Address)**.

Nói cách khác, khi chúng ta lập trình phát triển phần mềm, thực chất chúng ta hoàn toàn đang làm việc với các địa chỉ ảo. Ví dụ trong ngôn ngữ C, giá trị được lưu trữ bên trong một biến con trỏ chính là một địa chỉ ảo.

Hệ điều hành thông qua một linh kiện phần cứng quan trọng trong CPU là **MMU (Memory Management Unit - Đơn vị quản lý bộ nhớ)** để chuyển đổi địa chỉ ảo thành địa chỉ vật lý, quá trình này được gọi là **Dịch địa chỉ (Address Translation)**. Trong các hệ thống hiện đại, quá trình dịch này phụ thuộc vào bảng trang, còn TLB sẽ lưu đệm các kết quả chuyển đổi gần nhất để giảm chi phí tra cứu bảng trang trong RAM.

![Quá trình dịch địa chỉ](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/physical-virtual-address-translation-c2c78161.png)

Sau khi MMU dịch địa chỉ ảo thành địa chỉ vật lý, CPU mới truy cập vào vị trí bộ nhớ vật lý tương ứng để hoàn thành yêu cầu đọc ghi. Nhờ có tầng chuyển đổi này, cùng một giá trị địa chỉ ảo ở hai tiến trình khác nhau cuối cùng lại trỏ về các trang vật lý hoàn toàn khác biệt.

Đây cũng là nền tảng cho sự cô lập tiến trình và giao tiếp liên tiến trình: Theo mặc định, một tiến trình không thể trực tiếp đọc ghi vùng nhớ user mode của tiến trình khác; nếu hai tiến trình thực sự cần trao đổi dữ liệu, chúng phải nhờ cậy tới các cơ chế IPC như pipe, message queue, shared memory, socket. Để xem tổng kết có hệ thống về IPC, mời xem: [Giải thích chi tiết về Giao tiếp liên tiến trình (IPC): Pipe, Message Queue, Shared Memory, Socket và Binder](./ipc.md).

Hai cơ chế chủ yếu mà MMU dùng để dịch địa chỉ ảo thành địa chỉ vật lý là: **Cơ chế phân đoạn** và **Cơ chế phân trang**.

#### Không gian địa chỉ ảo và không gian địa chỉ vật lý là gì?

- Không gian địa chỉ ảo là tập hợp tất cả các địa chỉ ảo, là phạm vi của bộ nhớ ảo. Mỗi tiến trình đều sở hữu một không gian địa chỉ ảo đồng nhất và riêng tư.
- Không gian địa chỉ vật lý là tập hợp tất cả các địa chỉ vật lý, là phạm vi của dung lượng RAM vật lý thực tế.

#### Địa chỉ ảo và địa chỉ bộ nhớ vật lý được ánh xạ như thế nào?

MMU có 3 cơ chế chính để dịch địa chỉ ảo sang địa chỉ vật lý:

1. Cơ chế phân đoạn (Segmentation)
2. Cơ chế phân trang (Paging)
3. Cơ chế phân đoạn kết hợp phân trang (Segmented Paging)

Trong đó, các hệ điều hành hiện đại đều phổ biến áp dụng cơ chế phân trang, đây là trọng điểm cần đặc biệt chú ý!

### Cơ chế phân đoạn (Segmentation)

**Cơ chế phân đoạn (Segmentation)** phân chia không gian địa chỉ theo cấu trúc logic của chương trình, ví dụ như đoạn mã (code segment), đoạn dữ liệu (data segment), heap, stack... Độ dài của mỗi đoạn có thể khác nhau, bản thân đoạn mang ngữ nghĩa cụ thể và có thể phối hợp kiểm soát quyền hạn riêng biệt.

#### Bảng đoạn dùng để làm gì? Quá trình dịch địa chỉ diễn ra như thế nào?

Quản lý phân đoạn sử dụng **Bảng đoạn (Segment Table)** để ánh xạ giữa địa chỉ ảo và địa chỉ vật lý. Mỗi mục trong bảng đoạn (segment descriptor) thường lưu trữ: địa chỉ cơ sở của đoạn (segment base), giới hạn độ dài của đoạn (segment limit) và quyền truy cập.

Địa chỉ ảo trong cơ chế phân đoạn gồm hai phần:

- **Số hiệu đoạn (Segment Number)**: Xác định địa chỉ ảo này thuộc về đoạn nào trong không gian địa chỉ ảo.
- **Độ lệch trong đoạn (Segment Offset)**: Khoảng cách tương đối so với địa chỉ bắt đầu của đoạn đó.

Quá trình dịch địa chỉ cụ thể như sau:

1. MMU trước tiên tách lấy số hiệu đoạn từ địa chỉ ảo;
2. Dùng số hiệu đoạn tra cứu vào bảng đoạn của ứng dụng để lấy ra thông tin đoạn tương ứng;
3. Kiểm tra xem độ lệch trong đoạn có vượt quá giới hạn độ dài của đoạn hay không, đồng thời kiểm tra tính hợp lệ của quyền truy cập;
4. Nếu hợp lệ, lấy địa chỉ cơ sở của đoạn cộng với độ lệch trong đoạn để thu được địa chỉ vật lý cuối cùng.

![Sơ đồ chuyển đổi địa chỉ phân đoạn: Địa chỉ ảo gồm số hiệu đoạn và độ lệch, tra bảng đoạn lấy địa chỉ cơ sở rồi tính địa chỉ vật lý](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-segmentation-d95fae8f.png)

Ví dụ: muốn truy cập đoạn số 3 với độ lệch 500, nếu địa chỉ cơ sở của đoạn 3 là 7000 và độ lệch không vượt giới hạn, thì địa chỉ vật lý cuối cùng sẽ là 7000 + 500 = 7500.

Nếu bộ chọn đoạn không hợp lệ, độ lệch vượt giới hạn hoặc quyền truy cập không đủ, CPU sẽ kích hoạt exception do kiến trúc quy định. Việc trang đã nằm trong RAM hay chưa thuộc phạm trù phân trang và xử lý Page Fault, không nên nhầm lẫn với mô hình phân đoạn thuần túy.

#### Tại sao cơ chế phân đoạn lại gây ra phân mảnh ngoài?

Cơ chế phân đoạn rất dễ phát sinh phân mảnh ngoài, nguyên nhân gốc rễ là vì **độ dài của các đoạn là không cố định, và mỗi đoạn thông thường đòi hỏi phải được cấp phát một khối bộ nhớ vật lý liên tục**. Khi các tiến trình liên tục tạo mới và giải phóng các đoạn, trong RAM vật lý sẽ để lại rất nhiều khoảng trống rời rạc; tổng dung lượng của các khoảng trống này có thể còn rất nhiều, nhưng từng khoảng trống đơn lẻ lại không đủ lớn để cấp phát cho một đoạn mới có kích thước lớn hơn.

Lấy ví dụ: Giả sử một hệ thống có 5 GB RAM vật lý dùng cơ chế phân đoạn để cấp phát bộ nhớ. Hiện có 4 tiến trình với tình trạng bộ nhớ như sau:

- Tiến trình 1: 0~1 GB (Đoạn 1)
- Tiến trình 2: 1~3 GB (Đoạn 2)
- Tiến trình 3: 3~4.5 GB (Đoạn 3)
- Tiến trình 4: 4.5~5 GB (Đoạn 4)

Lúc này, chúng ta đóng tiến trình 1 và tiến trình 4, thì bộ nhớ của Đoạn 1 và Đoạn 4 được giải phóng, tổng bộ nhớ vật lý còn trống là 1.5 GB. Tuy nhiên, do 1.5 GB này bị chia cắt thành 2 khoảng không liên tục (1 GB và 0.5 GB), hệ thống không có cách nào cấp phát được cho một tiến trình mới đòi hỏi một đoạn liên tục 1.5 GB.

![Cơ chế phân đoạn dẫn tới phân mảnh ngoài](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/segment-external-memory-fragmentation-c8b8e745.png)

Phân mảnh ngoài có thể giải quyết bằng kỹ thuật dồn nén bộ nhớ (memory compaction), tức là dịch chuyển các đoạn đang dùng sát lại gần nhau để gom khoảng trống lại thành một khối liên tục. Tuy nhiên, việc di dời các đoạn lớn rất tốn thời gian, nếu còn đi kèm với việc hoán đổi đĩa thì hệ thống sẽ bị chậm đi rõ rệt.

### Cơ chế phân trang (Paging)

**Cơ chế phân trang (Paging)** chia cả không gian địa chỉ ảo lẫn bộ nhớ vật lý thành các khối có kích thước cố định. Khối trong không gian địa chỉ ảo gọi là trang ảo (virtual page), khối trong bộ nhớ vật lý gọi là trang vật lý hoặc khung trang (page frame). Trong Linux, kích thước của một trang thông thường là 4 KB.

**Lưu ý: Các trang ở đây là liên tục và có kích thước bằng nhau, khác với các đoạn có độ dài tùy biến trong cơ chế phân đoạn.**

Trong cơ chế phân trang, bất kỳ trang ảo nào trong không gian địa chỉ của ứng dụng đều có thể ánh xạ tới bất kỳ khung trang vật lý nào trong RAM, do đó bộ nhớ vật lý có thể được phân bổ một cách rời rạc. Việc quản lý theo kích thước trang cố định đã triệt tiêu hoàn toàn vấn đề phân mảnh ngoài của cơ chế phân đoạn; tuy nhiên trang cuối cùng của tiến trình có thể không chứa đầy, dẫn đến một lượng nhỏ phân mảnh trong.

Phân trang còn có một năng lực rất quan trọng: Hỗ trợ nạp trang theo nhu cầu (demand paging). Chương trình không cần phải nạp tất cả các trang vào RAM ngay khi khởi động; chỉ khi thực sự truy cập tới trang ảo nào thì hệ điều hành mới nạp dữ liệu tương ứng vào RAM.

#### Bảng trang dùng để làm gì? Quá trình dịch địa chỉ diễn ra như thế nào?

Quản lý phân trang dùng **Bảng trang (Page Table)** để ánh xạ địa chỉ ảo sang địa chỉ vật lý. Mỗi mục trong bảng trang (PTE - Page Table Entry) ghi lại mối quan hệ tương ứng giữa số hiệu trang ảo (VPN) và số hiệu khung trang vật lý (PFN), cùng các cờ trạng thái như bit đã truy cập, bit dirty (bẩn), bit quyền hạn, bit hiện diện (present).

![Bảng trang đơn cấp](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/page-table-2cb227df.png)

Trong cơ chế phân trang, mỗi tiến trình đều có bảng trang của riêng mình. Chính vì bảng trang mang tính riêng tư của tiến trình, nên cùng một số hiệu trang ảo ở các tiến trình khác nhau có thể ánh xạ tới các khung trang vật lý hoàn toàn khác nhau, từ đó hiện thực hóa việc cô lập không gian địa chỉ.

Địa chỉ ảo trong cơ chế phân trang gồm hai phần:

- **Số hiệu trang (Page Number)**: Dùng số hiệu trang ảo để tra trong bảng trang lấy ra số hiệu khung trang vật lý tương ứng;
- **Độ lệch trong trang (Page Offset)**: Địa chỉ bắt đầu của khung trang vật lý + độ lệch trong trang = Địa chỉ bộ nhớ vật lý.

Quá trình dịch địa chỉ cụ thể như sau:

1. MMU trước tiên phân tích địa chỉ ảo để lấy ra số hiệu trang ảo;
2. Dùng số hiệu trang ảo tra cứu trong bảng trang của tiến trình đó để lấy ra số hiệu khung trang vật lý tương ứng (tìm mục PTE);
3. Lấy địa chỉ cơ sở của khung trang vật lý cộng với độ lệch trong trang để thu được địa chỉ vật lý cuối cùng.

![Sơ đồ chuyển đổi địa chỉ phân trang: Địa chỉ ảo tách thành số trang và độ lệch, bảng trang ánh xạ trang ảo sang khung trang vật lý](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-paging-5dd75b37.png)

Nếu mục trong bảng trang không tồn tại, trang hiện không nằm trong RAM, hoặc quyền truy cập không khớp, CPU sẽ kích hoạt ngoại lệ Page Fault (lỗi thiếu trang). Sau đó kernel sẽ đánh giá xem lần truy cập này có khắc phục được không: nếu khắc phục được thì thiết lập ánh xạ hoặc nạp trang vào; nếu không thể khắc phục thì thường sẽ gửi tín hiệu `SIGSEGV` tới thread hiện tại.

**Dựa vào số hiệu trang ảo có chắc chắn tìm được số hiệu khung trang vật lý không? Khi đã có số hiệu khung trang và tính được địa chỉ vật lý cuối cùng, thì trang vật lý đó có chắc chắn tồn tại không?**

Không chắc chắn. Mục trong bảng trang có thể chưa tồn tại, trang có thể chưa thường trú trong RAM vật lý, hoặc hành vi truy cập có thể vi phạm quyền hạn được ghi nhận trong PTE. Tất cả những trường hợp này đều kích hoạt ngoại lệ Page Fault.

#### Bảng trang đơn cấp có vấn đề gì? Tại sao cần có bảng trang đa cấp?

Lấy ví dụ trong môi trường 32-bit, không gian địa chỉ ảo có phạm vi 2^32 (tức 4 GB). Giả sử kích thước một trang là 2^12 (4 KB), thì cần 4 GB / 4 KB = 2^20 mục trong bảng trang. Nếu mỗi mục PTE tốn 4 byte, thì toàn bộ bảng trang đơn cấp sẽ chiếm khoảng 4 MB bộ nhớ liên tục. Nghĩa là, ngay cả khi một tiến trình chỉ sử dụng một góc rất nhỏ của không gian địa chỉ ảo, bảng trang đơn cấp vẫn buộc phải dự trữ trước các mục PTE cho toàn bộ 4 GB không gian địa chỉ.

Khi hệ thống chạy hàng trăm tiến trình, chi phí bộ nhớ này trở nên rất lớn. Tệ hơn nữa là phần lớn các tiến trình chỉ dùng một phần rất nhỏ không gian địa chỉ ảo, khiến đại đa số các mục trong bảng trang đơn cấp thực tế đều bị bỏ trống hoàn toàn.

Để giải quyết bài toán này, hệ điều hành đã đưa vào **Bảng trang đa cấp (Multi-Level Page Table)**. Tư tưởng cốt lõi của bảng trang đa cấp là: Bảng trang cấp cao nhất bao phủ toàn bộ không gian địa chỉ ảo, còn bảng trang cấp dưới chỉ được tạo ra khi có nhu cầu; nếu một dải địa chỉ ảo nào đó hoàn toàn không được dùng tới, hệ thống sẽ không cần phải tạo bảng trang cấp dưới cho nó.

Lấy bảng trang hai cấp làm ví dụ: Bảng trang cấp 1 có 1024 mục, mỗi mục có thể trỏ tới một bảng trang cấp 2; mỗi bảng trang cấp 2 lại có 1024 mục. Chỉ khi dải địa chỉ do một mục cấp 1 bao phủ thực sự được sử dụng, thì bảng trang cấp 2 tương ứng mới được tạo lập.

Giả sử tiến trình chỉ cần 2 bảng trang cấp 2, thì tổng bộ nhớ dành cho bảng trang chỉ là: 4 KB (bảng cấp 1) + 4 KB * 2 (bảng cấp 2) = 12 KB, thay vì 4 MB như bảng trang đơn cấp.

![Sơ đồ bảng trang đa cấp: PGD, PUD, PMD, PTE đánh chỉ mục phân tầng, chỉ tạo bảng cấp dưới cho dải địa chỉ thực tế sử dụng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-multi-level-page-table-26a60ff3.png)

Bảng trang đa cấp bản chất là dùng thời gian đổi lấy không gian: Đi qua nhiều tầng chỉ mục hơn để đổi lấy mức chiếm dụng bộ nhớ bảng trang nhỏ hơn nhiều. Trong hệ thống thực tế, phần cứng có TLB lưu đệm các mục bảng trang thường dùng, do đó chi phí tra bảng đa cấp không phải lúc nào cũng diễn ra trọn vẹn ở mọi lần truy cập.

#### TLB có tác dụng gì? Quy trình dịch địa chỉ sau khi có TLB diễn ra như thế nào?

Để tăng tốc độ chuyển đổi từ địa chỉ ảo sang địa chỉ vật lý, CPU/MMU sử dụng bộ nhớ đệm phần cứng gọi là **TLB (Translation Lookaside Buffer, còn gọi là bảng nhanh)** để lưu đệm các kết quả dịch địa chỉ gần nhất.

![Dịch địa chỉ sau khi có thêm TLB](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/physical-virtual-address-translation-mmu-c9371c91.png)

Trên các kiến trúc phổ biến như AArch64 và x86-64, TLB là bộ nhớ đệm phần cứng do MMU sử dụng. Có thể hiểu nó như một bộ nhớ cache tốc độ cao so khớp trang ảo với khung trang vật lý. Hệ điều hành chịu trách nhiệm duy trì bảng trang; khi quan hệ ánh xạ trong bảng trang thay đổi, hệ điều hành phải thực hiện lệnh làm mất hiệu lực (invalidate) các mục TLB liên quan để tránh việc CPU tiếp tục dùng ánh xạ cũ.

Quy trình dịch địa chỉ khi có TLB:

1. CPU dùng số hiệu trang ảo và mã định danh không gian địa chỉ để so khớp trong các mục của TLB;
2. Nếu tìm thấy trang vật lý tương ứng, CPU không cần phải tra bảng trang trong RAM nữa, tình huống này gọi là **TLB hit** (trúng cache TLB).
3. Nếu không tìm thấy, CPU buộc phải tra cứu bảng trang trong bộ nhớ chính (RAM), đồng thời bổ sung mục ánh xạ đó vào trong TLB, tình huống này gọi là **TLB miss** (trượt cache TLB).
4. Khi TLB bị đầy mà cần ghi nhận trang mới, hệ thống sẽ áp dụng chính sách loại bỏ nhất định để đẩy một mục cũ ra khỏi TLB.

![Quy trình TLB lưu đệm kết quả chuyển đổi: CPU kiểm tra TLB trước, hit thì truy cập thẳng RAM, miss thì tra bảng trang đa cấp rồi cập nhật TLB](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-tlb-cache-b470e575.png)

Do bảng trang cũng nằm trong RAM, nên nếu không có TLB, mỗi lần CPU truy cập một địa chỉ ảo sẽ phải truy cập RAM nhiều lần chỉ để tra bảng trang trước khi truy cập dữ liệu thực tế; với bảng trang đa cấp số lần truy cập RAM còn tăng gấp bội. Khi có TLB, nếu trúng cache thì có thể bỏ qua toàn bộ việc tra bảng trang trong RAM và lấy ngay số khung trang vật lý, giúp quá trình chuyển đổi địa chỉ diễn ra cực nhanh.

Thiết kế của TLB rất đơn giản nhưng tỷ lệ trúng cache thường rất cao. Điều này dựa vào **Nguyên lý cục bộ (Locality Principle)**: Các trang mà một chương trình truy cập thường xuyên trong một khoảng thời gian ngắn thường chỉ tập trung ở một số ít trang nhất định.

Bạn sẽ nhận thấy bảng nhanh TLB rất giống với các hệ thống Cache mà chúng ta dùng trong phát triển ứng dụng (như Redis). Rất nhiều tư tưởng và thuật toán kinh điển của hệ điều hành đều xuất hiện phổ biến trong các công cụ và framework đời sống thường ngày.

#### Cơ chế hoán đổi trang (Paging / Swapping) có tác dụng gì?

Tư tưởng của cơ chế hoán đổi trang là: Khi bộ nhớ vật lý không đủ dùng, hệ điều hành sẽ chọn ra một số trang vật lý tạm thời chưa dùng tới và ghi chúng ra đĩa; khi tiến trình truy cập lại vào các trang này, hệ điều hành sẽ nạp chúng từ đĩa trở lại RAM. Nghĩa là, cơ chế này tận dụng thiết bị lưu trữ đĩa có chi phí rẻ hơn để mở rộng bộ nhớ khả dụng về mặt logic.

Điều này giải thích một hiện tượng phổ biến khi dùng máy tính: Tại sao tổng dung lượng bộ nhớ vật lý mà tất cả các tiến trình đang chạy yêu cầu lớn hơn nhiều so với dung lượng RAM thực tế của máy, nhưng các tiến trình vẫn chạy bình thường, chỉ là tốc độ phản hồi bị chậm đi.

Đây cũng là một chiến lược đánh đổi thời gian lấy không gian: Dùng thời gian nạp/xuất trang trên đĩa để đổi lấy không gian bộ nhớ khả dụng lớn hơn. Vấn đề đi kèm cũng rất rõ ràng: Khi liên tục phát sinh Major Page Fault và hoán đổi đĩa, hệ thống sẽ bị chậm rõ rệt, nghiêm trọng hơn có thể rơi vào tình trạng **Tráo đổi trang liên tục (Thrashing - rung giật bộ nhớ)**, lúc này phần lớn thời gian CPU bị tiêu tốn chỉ để phục vụ cho việc hoán đổi trang.

#### Ngoại lệ lỗi thiếu trang (Page Fault) là gì?

Page Fault là một **ngoại lệ đồng bộ (synchronous exception)** do CPU kích hoạt khi quá trình dịch địa chỉ hoặc kiểm tra quyền hạn cấp trang không thể hoàn tất trực tiếp ở tầng phần cứng. Nó do chính chỉ lệnh truy cập bộ nhớ hiện tại gây ra, không phải ngắt phần cứng từ ngoại vi, và không nhất thiết đồng nghĩa với việc chương trình bị lỗi.

Sau khi tiếp quản quyền điều khiển, kernel sẽ kiểm tra xem địa chỉ gây lỗi có nằm trong vùng bộ nhớ ảo hợp pháp (VMA) của tiến trình hay không, và loại truy cập có thỏa mãn quyền hạn hay không:

- **Page Fault có thể khắc phục (Recoverable)**: Ví dụ trang ẩn danh truy cập lần đầu tiên cần được cấp phát khung trang vật lý, trang tập tin hoặc trang Swap chưa thường trú trong RAM, hoặc ghi vào trang COW cần phải sao chép trước. Kernel hoàn thành việc cấp phát, nạp trang từ đĩa hoặc sao chép COW, cập nhật bảng trang, sau đó yêu cầu CPU thực thi lại đúng chỉ lệnh đã gây ra ngoại lệ.
- **Page Fault không thể khắc phục (Unrecoverable)**: Ví dụ địa chỉ không thuộc bất kỳ VMA hợp pháp nào, ghi vào vùng nhớ chỉ đọc, thực thi lệnh trên trang cấm thực thi. Trong Linux, kernel thường gửi tín hiệu `SIGSEGV` tới thread vi phạm, khiến tiến trình bị dừng theo hành vi mặc định.

Xét từ góc độ thống kê hiệu năng, Page Fault có thể khắc phục được chia thành:

- **Lỗi thiếu trang chính (Major Page Fault)**: Quá trình xử lý bắt buộc phải đọc dữ liệu từ file trên đĩa hoặc từ phân vùng Swap, kéo theo thao tác I/O thực tế nên chi phí khá lớn.
- **Lỗi thiếu trang phụ (Minor Page Fault)**: Không cần đọc dữ liệu từ thiết bị lưu trữ, ví dụ thiết lập ánh xạ cho trang vật lý đã có sẵn trong Page Cache, cấp phát trang zero, hoặc xử lý một số trường hợp COW cục bộ, chi phí thường nhẹ hơn rất nhiều.

Lỗi truy cập con trỏ ngoài biên (out-of-bounds) trong C/C++ cũng không đảm bảo chắc chắn sẽ lập tức kích hoạt `SIGSEGV`. Nếu địa chỉ ngoài biên vẫn tình cờ rơi vào một trang đã được ánh xạ hợp lệ và có quyền truy cập phù hợp trong không gian của tiến trình, phần cứng sẽ thực thi lệnh bình thường mà không báo lỗi, và chương trình có thể âm thầm làm sai lệch dữ liệu lân cận.

![Quy trình xử lý ngoại lệ Page Fault: MMU phát hiện dịch địa chỉ hoặc kiểm tra quyền hạn thất bại thì chuyển vào kernel, kiểm tra tính hợp pháp, cấp phát/hoán đổi khung trang, cập nhật bảng trang và thực thi lại chỉ lệnh](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-page-fault-08944e3c.png)

Mối quan hệ giữa Page Fault, System Call và Signal có thể tham khảo tại: [Giải thích chi tiết về Ngắt, Ngoại lệ và Lời gọi hệ thống: Từ Kernel Entry đến Lỗi thiếu trang](./interrupt-exception-syscall.md).

#### Các thuật toán thay thế trang phổ biến gồm những gì?

Khi xảy ra lỗi thiếu trang chính (Major Page Fault) mà trong RAM không còn khung trang vật lý trống nào khả dụng, hệ điều hành buộc phải chọn một trang vật lý đang có trong RAM để đẩy ra ngoài, nhằm giải phóng không gian để nạp trang mới vào.

Quy tắc được sử dụng để quyết định loại bỏ trang vật lý nào được gọi là **Thuật toán thay thế trang (Page Replacement Algorithm)**.

Việc thiếu trang xảy ra quá thường xuyên sẽ ảnh hưởng nghiêm trọng tới hiệu năng; một thuật toán thay thế trang tốt là thuật toán có thể giảm thiểu tối đa tần suất xuất hiện lỗi thiếu trang.

5 thuật toán thay thế trang kinh điển gồm:

![So sánh các thuật toán thay thế trang](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-page-replacement-f68a779f.webp)

1. **Thuật toán thay thế trang tối ưu (OPT - Optimal)**: Ưu tiên loại bỏ trang mà trong tương lai xa nhất mới được truy cập lại (hoặc không bao giờ được truy cập nữa), về mặt lý thuyết cho tỷ lệ thiếu trang thấp nhất. Tuy nhiên thuật toán này đòi hỏi phải biết trước tương lai, trong thực tế không thể hiện thực hóa được, thường chỉ dùng làm mốc quy chuẩn để đánh giá các thuật toán khác.
2. **Thuật toán vào trước ra trước (FIFO - First In First Out)**: Luôn loại bỏ trang đã đi vào bộ nhớ sớm nhất. Thuật toán đơn giản dễ triển khai, nhưng dễ loại nhầm các trang "nóng" thường xuyên được sử dụng, đồng thời có thể gặp phải Nghịch lý Belady (Belady's Anomaly).
3. **Thuật toán lâu nhất chưa sử dụng (LRU - Least Recently Used)**: Loại bỏ trang đã lâu nhất không được truy cập. Thuật toán tận dụng tính cục bộ về thời gian, cho hiệu quả tiệm cận OPT, nhưng việc triển khai chính xác đòi hỏi phải duy trì nhãn thời gian hoặc danh sách liên kết, chi phí phần cứng và phần mềm khá cao.
4. **Thuật toán ít sử dụng nhất (LFU - Least Frequently Used)**: Loại bỏ trang có số lần truy cập ít nhất trong một khoảng thời gian. Thuật toán chú trọng tần suất truy cập, nhưng dễ khiến các trang từng được truy cập rất nhiều ở giai đoạn đầu nhưng về sau không dùng nữa cứ nằm lì mãi trong RAM; do đó trong thực tế thường phải kết hợp cơ chế suy giảm bộ đếm theo thời gian.
5. **Thuật toán đồng hồ (Clock)**: Còn gọi là thuật toán cơ hội thứ hai (Second-Chance), là một triển khai xấp xỉ chi phí thấp của LRU. Nó duy trì một bit truy cập (R bit) cho mỗi trang, các trang được xếp thành một hàng đợi tròn (circular queue); khi kim quét qua, nếu bit R = 1 thì xóa về 0 và bỏ qua để trao cơ hội thứ hai; nếu bit R = 0 thì lập tức chọn trang đó để loại bỏ.

![Sơ đồ thuật toán thay thế trang CLOCK: Các trang xếp thành vòng tròn, kim quét dựa vào bit truy cập R để quyết định cho cơ hội thứ hai hay loại bỏ trang](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-clock-algorithm-80ebda22.png)

**Tại sao hiệu năng của thuật toán thay thế trang FIFO lại kém?**

Chủ yếu vì 2 nguyên nhân:

1. **Các trang thường xuyên truy cập hoặc cần tồn tại lâu dài bị nạp/xuất liên tục**: Các trang được nạp vào sớm thường là các trang nền tảng hay được truy cập; thuật toán FIFO sẽ liên tục đẩy chúng ra rồi lại nạp chúng vào.
2. **Tồn tại nghịch lý Belady**: Đôi khi tăng thêm số lượng khung trang vật lý được cấp phát lại làm tăng tỷ lệ phát sinh lỗi thiếu trang. Hiện tượng nghịch lý này xảy ra là do thuật toán FIFO chỉ xét tới thứ tự thời gian trang đi vào bộ nhớ, mà không hề quan tâm tới tần suất hay mức độ cấp thiết của trang.

**Thuật toán thay thế trang nào được dùng nhiều trong thực tế?**

LRU và các biến thể xấp xỉ của nó được ứng dụng rất nhiều trong thực tế vì rất phù hợp với quy luật tính cục bộ của chương trình. Tuy nhiên, các hệ thống thực tế không bê nguyên si thuật toán trong sách giáo khoa, mà áp dụng rất nhiều cải tiến kỹ thuật. Ví dụ Linux kernel không chọn đơn giản giữa OPT/FIFO/LRU/CLOCK, mà sử dụng danh sách LRU active/inactive, workingset, cơ chế phát hiện refault và MGLRU; InnoDB Buffer Pool của MySQL cũng cải tiến danh sách LRU truyền thống thành vùng sublist young và old để ngăn ngừa việc quét toàn bảng (full table scan) hay đọc trước (read-ahead) làm trôi mất các trang nóng.

![Ý tưởng thu hồi trang trong Linux](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/memory-page-reclaim-208f962f.webp)

### Swap, Working Set và Thrashing lần lượt là gì?

**Swap** là không gian dự phòng nằm trên đĩa cứng. Các trang ẩn danh (anonymous pages) không có tập tin nguồn tương ứng trên đĩa; khi RAM vật lý căng thẳng, nếu kernel muốn thu hồi loại trang này, nó sẽ ghi chúng vào phân vùng Swap; sau này khi tiến trình truy cập lại, kernel sẽ đọc chúng từ Swap trả về RAM.

Swap không phải là phép màu mở rộng RAM miễn phí. Ổ đĩa chậm hơn RAM rất nhiều lần; khi Swap hoạt động mạnh, độ trễ xử lý của ứng dụng thường sẽ tụt dốc thê thảm.

**Working Set (Tập làm việc)** là tập hợp các trang bộ nhớ mà tiến trình thực sự truy cập thường xuyên trong một khoảng thời gian xác định. Miễn là RAM vật lý đủ sức chứa tập làm việc của các tiến trình chính, thì tỷ lệ thiếu trang sẽ ở mức kiểm soát được; nếu không chứa nổi, các trang sẽ bị liên tục hoán đổi ra đĩa rồi lại nạp vào.

Tình trạng bệnh lý này được gọi là **Thrashing (Rung giật bộ nhớ)**. Khi xảy ra thrashing, CPU chưa chắc đã bận tính toán nghiệp vụ, mà phần lớn thời gian bị tiêu hao vào việc xử lý thiếu trang, thu hồi trang và I/O đĩa.

Các chỉ số tra cứu khi gặp sự cố:

```bash
free -h
vmstat 1
grep -E 'pgfault|pgmajfault|pswpin|pswpout|pgscan|pgsteal' /proc/vmstat
cat /proc/pressure/memory
```

### Mối quan hệ giữa Overcommit và OOM là gì?

Linux cho phép tổng lượng bộ nhớ ảo mà các tiến trình xin cấp phát vượt quá tổng dung lượng RAM vật lý và Swap cộng lại, cơ chế này gọi là **Overcommit**. Cơ chế này rất phù hợp với các ứng dụng có xu hướng đặt trước một không gian địa chỉ rất lớn nhưng không bao giờ dùng hết.

Vì vậy, khi gọi `malloc()` hoặc `mmap()` thành công, nó thường chỉ đại diện cho việc xin cấp phát không gian địa chỉ ảo thành công, chứ chưa hề có đầy đủ các trang vật lý tương ứng. Rất nhiều trang vật lý chỉ thực sự được cấp phát khi có thao tác truy cập ghi lần đầu tiên.

Khi các tiến trình thực sự truy cập vào các trang bộ nhớ này, nếu kernel không thể giải phóng đủ bộ nhớ thông qua thu hồi trang, ghi trả hay Swap, nó có thể kích hoạt **OOM Killer (Out-of-Memory Killer)** để lựa chọn và tiêu diệt (kill) một hoặc nhiều tiến trình nhằm giải phóng bộ nhớ cứu hệ thống.

Trong môi trường container (Docker, K8s), còn phải chú ý tới giới hạn của cgroup. Máy chủ vật lý còn thừa RAM không đồng nghĩa container còn được phép dùng; khi container chạm ngưỡng `memory.max`, nó cũng có thể bị OOM kill trong phạm vi cgroup đó.

### Mối quan hệ giữa mmap, COW và Shared Memory là gì?

`mmap()` tạo ra một đoạn ánh xạ mới bên trong không gian địa chỉ ảo của tiến trình. Nó vừa có thể ánh xạ tập tin, vừa có thể tạo ánh xạ ẩn danh. Khi ánh xạ được thiết lập, dữ liệu không nhất thiết được nạp ngay vào RAM; chỉ khi thực sự truy cập tới trang đó thì mới kích hoạt ngoại lệ Page Fault để nạp dữ liệu.

Khi nhiều tiến trình cùng ánh xạ vào một tập tin, kernel có thể cho phép chúng dùng chung các trang vật lý trong Page Cache. IPC bộ nhớ dùng chung (Shared Memory) cũng áp dụng tư tưởng tương tự: Địa chỉ ảo của các tiến trình khác nhau cùng trỏ tới cùng một lô trang vật lý, giúp việc đọc ghi dữ liệu giữa các tiến trình không cần phải sao chép qua kernel.

**COW (Copy-On-Write - Sao chép khi ghi)** thường thấy nhất trong lệnh gọi `fork()`. Khi tiến trình con vừa được tạo ra, cha và con có thể tạm thời chia sẻ chung các trang vật lý, bảng trang tạm thời đánh dấu là chỉ đọc (read-only); bên nào thực hiện thao tác ghi trước thì bên đó kích hoạt Page Fault, lúc này kernel mới sao chép riêng một bản trang mới cho bên ghi.

Xem chi tiết tại: [Giải thích chi tiết về Quản lý bộ nhớ hệ điều hành: Phân trang, Phân đoạn, Thay thế trang, Swap và OOM](./memory-management.md).

### Điểm giống và khác nhau giữa cơ chế phân trang và phân đoạn là gì?

**Điểm giống**:

- Đều là các phương thức quản lý bộ nhớ không liên tục.
- Đều áp dụng cơ chế ánh xạ địa chỉ, chuyển địa chỉ ảo thành địa chỉ vật lý để quản lý và bảo vệ bộ nhớ.

**Điểm khác nhau**:

- **Căn cứ phân chia khác nhau**: Phân trang chia cắt không gian địa chỉ và bộ nhớ vật lý theo kích thước cố định, trang là đơn vị vật lý của quản lý bộ nhớ; phân đoạn chia cắt theo cấu trúc logic của chương trình (đoạn mã, đoạn dữ liệu, heap, stack), đoạn là đơn vị logic gắn liền với ngữ nghĩa của chương trình.
- **Kích thước có cố định hay không**: Kích thước trang là cố định (thường là 4 KB); kích thước đoạn không cố định, phụ thuộc vào kích thước của vùng logic tương ứng trong chương trình.
- **Vấn đề phân mảnh khác nhau**: Phân đoạn dễ phát sinh phân mảnh ngoài vì mỗi đoạn cần vùng nhớ liên tục; phân trang triệt tiêu phân mảnh ngoài, chỉ tồn tại một lượng nhỏ phân mảnh trong ở trang cuối cùng.
- **Cấu trúc địa chỉ khác nhau**: Địa chỉ phân trang gồm số hiệu trang và độ lệch trong trang, ánh xạ qua bảng trang; địa chỉ phân đoạn gồm số hiệu đoạn và độ lệch trong đoạn, ánh xạ qua bảng đoạn.
- **Ứng dụng thực tế**: Các hệ điều hành đa dụng hiện đại chủ yếu dựa vào phân trang để quản lý bộ nhớ. Lấy x86 làm ví dụ, về mặt phần cứng trong lịch sử hỗ trợ cả phân đoạn lẫn phân trang, nhưng Linux đã thiết lập địa chỉ cơ sở của đoạn về 0, làm cho phân đoạn bị "vô hiệu hóa" chỉ còn đóng vai trò kiểm tra quyền hạn và tương thích ngược, việc quản lý bộ nhớ thực tế hầu như hoàn toàn do phân trang đảm nhiệm.

### Cơ chế phân đoạn kết hợp phân trang (Segmented Paging)

Cơ chế quản lý bộ nhớ kết hợp cả phân đoạn và phân trang. Dưới góc nhìn của chương trình, bộ nhớ được chia thành nhiều đoạn logic; mỗi đoạn logic lại tiếp tục được chia thành các trang có kích thước cố định.

Quá trình dịch địa chỉ trong cơ chế này gồm hai bước:

1. **Ánh xạ địa chỉ dạng đoạn (Địa chỉ ảo -> Địa chỉ tuyến tính)**:
   - Địa chỉ ảo = Bộ chọn đoạn (Số hiệu đoạn) + Độ lệch trong đoạn.
   - Tra bảng đoạn theo số hiệu đoạn để lấy địa chỉ cơ sở của đoạn, cộng với độ lệch trong đoạn để thu được địa chỉ tuyến tính (linear address).
2. **Ánh xạ địa chỉ dạng trang (Địa chỉ tuyến tính -> Địa chỉ vật lý)**:
   - Địa chỉ tuyến tính = Số hiệu trang + Độ lệch trong trang.
   - Tra bảng trang theo số hiệu trang để lấy số hiệu khung trang vật lý, cộng với độ lệch trong trang để thu được địa chỉ vật lý cuối cùng.

### Nguyên lý cục bộ (Locality Principle)

Muốn hiểu sâu về kỹ thuật bộ nhớ ảo, bắt buộc phải nắm rõ **Nguyên lý cục bộ (Locality Principle)** nổi tiếng trong khoa học máy tính. Khái niệm này áp dụng đắc lực cho cả cấu trúc chương trình lẫn cấu trúc dữ liệu.

Nguyên lý cục bộ chỉ ra rằng trong quá trình chương trình thực thi, việc truy cập dữ liệu và chỉ lệnh luôn thể hiện đặc tính tập trung theo không gian và thời gian:

- **Tính cục bộ về thời gian (Temporal Locality)**: Một mục dữ liệu hoặc chỉ lệnh sau khi được truy cập thì rất có khả năng sẽ tiếp tục được truy cập lặp lại nhiều lần trong tương lai gần (ví dụ vòng lặp, gọi hàm lặp lại).
- **Tính cục bộ về không gian (Spatial Locality)**: Sau khi truy cập một mục dữ liệu hoặc chỉ lệnh, các mục lân cận liền kề với nó rất có khả năng sẽ được truy cập tiếp theo trong thời gian ngắn (ví dụ duyệt mảng tuần tự).

Trong cơ chế phân trang, nguyên lý cục bộ được khai thác ở hai khía cạnh:

- **Tận dụng tính cục bộ thời gian**: Áp dụng cơ chế cache (như TLB lưu đệm các mục bảng trang, Page Cache lưu đệm trang dữ liệu) để tăng tỷ lệ trúng, giúp các lần truy cập tiếp theo lấy thẳng từ cache mà không cần truy xuất RAM hay đĩa.
- **Tận dụng tính cục bộ không gian**: Áp dụng kỹ thuật đọc trước (prefetching/read-ahead) để chủ động nạp sẵn các trang lân cận vào bộ nhớ trước khi chương trình yêu cầu, giúp dữ liệu luôn sẵn sàng khi cần tới.

Tóm lại, nguyên lý cục bộ là nguyên tắc thiết kế nền tảng trong kiến trúc máy tính và là cơ sở của vô số thuật toán tối ưu hóa.

### Bộ nhớ ảo hiện thực hóa việc chuyển đổi địa chỉ và cô lập tiến trình như thế nào?

Khi phỏng vấn về bộ nhớ ảo, đừng chỉ học thuộc lòng mỗi câu "cô lập tiến trình". Hãy trình bày mạch lạc theo trục tư duy sau: **Bộ nhớ ảo tách rời địa chỉ mà tiến trình nhìn thấy với địa chỉ vật lý thực tế trên RAM, sau đó việc dịch địa chỉ được phối hợp thực hiện bởi MMU, bảng trang và TLB**.

Tiến trình chỉ thao tác với địa chỉ ảo (VA), còn địa chỉ thực tế trên thanh RAM là địa chỉ vật lý (PA). Mỗi tiến trình sở hữu không gian địa chỉ ảo và bảng trang của riêng mình. Do đó, ngay cả khi hai tiến trình sử dụng cùng một giá trị địa chỉ ảo, bảng trang của chúng vẫn ánh xạ tới các trang vật lý hoàn toàn khác nhau, tạo nên sự cô lập hoàn hảo giữa các tiến trình.

![Quá trình ánh xạ địa chỉ ảo sang địa chỉ vật lý: Cùng một địa chỉ ảo ở các tiến trình khác nhau ánh xạ sang các trang vật lý khác nhau qua MMU và bảng trang](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/virtual-memory-virtual-physical-mapping-27d34efc.png)

Tuy nhiên, cô lập không có nghĩa là cấm tiệt việc chia sẻ dữ liệu. Hệ điều hành có thể chủ động cho phép nhiều tiến trình cùng ánh xạ tới một lô trang vật lý (như chia sẻ thư viện động, file mapping qua `mmap`, IPC qua shared memory). Điểm khác biệt là: Sự cô lập mặc định được đảm bảo bởi quyền hạn bảng trang, còn sự chia sẻ bắt buộc phải được kernel thiết lập tường minh đi kèm phân quyền; nếu là IPC bộ nhớ dùng chung thì ứng dụng còn phải tự xử lý bài toán đồng bộ luồng.

Cơ chế phân trang cắt nhỏ không gian ảo và bộ nhớ vật lý thành các trang cố định, dùng bảng trang để lưu mối quan hệ ánh xạ "VPN -> PFN". Nhờ đó loại bỏ phân mảnh ngoài và cho phép phân bổ RAM rời rạc; để tránh việc bảng trang tốn quá nhiều RAM, hệ thống dùng bảng trang đa cấp để chỉ tạo các bảng cấp dưới khi thực sự có nhu cầu.

TLB đóng vai trò như bộ nhớ cache lưu các mục bảng trang. CPU luôn kiểm tra TLB trước, nếu hit thì lấy ngay số khung trang vật lý; nếu miss mới phải đi tra bảng trang đa cấp trong RAM và nạp kết quả bù vào TLB. Nếu bảng trang báo rằng trang chưa nằm trong RAM, ngoại lệ Page Fault sẽ được kích hoạt để kernel kiểm tra tính hợp lệ, cấp phát khung trang, hoán đổi dữ liệu từ đĩa hoặc Swap nếu cần, cập nhật lại bảng trang và thực thi lại câu lệnh gây lỗi.

Đối với thuật toán thay thế trang, hãy nhớ một nguyên lý cốt lõi: **Trang bị đẩy ra ngoài, tốt nhất nên là trang mà trong tương lai lâu nhất mới dùng lại**. OPT là mức tối ưu lý thuyết nhưng không thể làm được, LRU tiệm cận OPT nhưng chi phí cao, CLOCK dùng bit truy cập để xấp xỉ LRU, còn FIFO đơn giản nhưng dễ gặp nghịch lý Belady.

Xem chi tiết tại: [Giải thích chi tiết về Bộ nhớ ảo: Chuyển đổi địa chỉ, TLB, Ngoại lệ lỗi thiếu trang và Thay thế trang](./virtual-memory.md).

## I/O

### Một lệnh gọi `read()` ở chế độ chặn (blocking) trải qua những gì?

Lấy `read(fd, buf, count)` làm ví dụ, chương trình người dùng trước tiên gọi hàm bao bọc (wrapper) của glibc. Hàm wrapper chuẩn bị số hiệu system call và các tham số theo chuẩn ABI, sau đó thực thi lệnh `syscall` để đi vào kernel. Kernel tiến hành kiểm tra tính hợp lệ của file descriptor, buffer của người dùng và quyền truy cập, sau đó định tuyến yêu cầu vào VFS, hệ thống tập tin, socket hoặc driver tương ứng.

Nếu dữ liệu đã sẵn sàng trong Page Cache hoặc socket buffer, kernel sẽ sao chép dữ liệu sang buffer của người dùng và trả về số byte đã đọc ngay lập tức. Nếu dữ liệu chưa sẵn sàng, fd ở chế độ blocking sẽ đưa thread hiện tại vào trạng thái ngủ/chờ (waiting/blocked), giải phóng CPU để scheduler điều phối các tác vụ khác. Khi I/O đĩa hoàn tất hoặc card mạng nhận được gói tin, phần cứng sẽ kích hoạt ngắt (interrupt) để đánh thức thread đang chờ. Khi thread đó được cấp lại CPU trong tương lai, nó mới tiếp tục hoàn tất `read()` và quay trở lại User Mode.

Chuỗi xử lý này có thể xuất hiện đồng thời cả system call, ngắt phần cứng và thread context switch, nhưng cũng có thể chỉ trải qua một phần trong số đó. Ví dụ khi Page Cache đã có sẵn dữ liệu, `read()` có thể trả về ngay lập tức mà không cần chờ ngắt phần cứng và không hề phải chuyển sang thread khác.

Xem chi tiết tại: [Giải thích chi tiết về Ngắt, Ngoại lệ và Lời gọi hệ thống: Từ Kernel Entry đến Lỗi thiếu trang](./interrupt-exception-syscall.md).

### I/O Multiplexing (Đa luồng I/O) là gì?

I/O Multiplexing không nhằm mục đích làm cho "một lần đọc/ghi diễn ra nhanh hơn", mà giải quyết bài toán: **Làm thế nào để một thread duy nhất có thể đồng thời theo dõi sự kiện sẵn sàng của nhiều file descriptor (fd)**.

Một thao tác đọc mạng thông thường chia làm 2 giai đoạn: Trước tiên là chờ dữ liệu từ card mạng chuyển vào kernel buffer, sau đó là sao chép dữ liệu từ kernel buffer sang user buffer. Vấn đề của blocking I/O nằm ở giai đoạn 1: Khi một thread gọi `recv()`, nếu kết nối đó chưa có dữ liệu gửi tới thì thread buộc phải đứng im chờ đợi ở đó.

![Hai giai đoạn trong đọc mạng: Chờ dữ liệu vào kernel buffer, sau đó copy sang user buffer qua copy_to_user](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-io-two-phases-4cdb6dd8.png)

I/O Multiplexing chuyển giao một danh sách tập hợp các fd cho kernel, cho phép thread bị block trên một system call duy nhất như `select`, `poll` hoặc `epoll`. Chỉ cần có bất kỳ fd nào trong số đó sẵn sàng, lệnh gọi sẽ lập tức trả về để ứng dụng xử lý kết nối tương ứng. Nhờ đó, một thread có thể quản lý đồng thời hàng chục ngàn kết nối, đặc biệt phù hợp với các kịch bản số lượng kết nối cực lớn nhưng tại một thời điểm chỉ có số ít kết nối hoạt động, điển hình như Redis, Nginx, Netty.

Cần lưu ý: I/O Multiplexing vẫn thuộc về mô hình **Synchronous I/O (I/O đồng bộ)**. Kernel chỉ thông báo rằng "fd này đã có thể đọc/ghi rồi", ứng dụng vẫn phải tự mình thực hiện lời gọi `read()`/`recv()`, và bước sao chép dữ liệu từ kernel buffer sang user buffer vẫn không hề được bớt đi.

Xem chi tiết tại: [Giải thích chi tiết về I/O Multiplexing: Nguyên lý và sự khác biệt giữa select, poll, epoll](./io-multiplexing.md).

### Điểm khác biệt giữa select, poll và epoll là gì?

Kết luận tóm tắt: **`select` và `poll` mỗi lần chờ đợi đều phải gửi toàn bộ tập hợp fd cần theo dõi vào kernel và quét tuần tự sau khi trả về; `epoll` duy trì tập hợp theo dõi ngay trong kernel, và `epoll_wait` chỉ trả về danh sách các sự kiện đã thực sự sẵn sàng, phù hợp vượt trội cho kịch bản "kết nối cực nhiều nhưng kết nối hoạt động ít"**.

`select` sử dụng bitmap `fd_set` có kích thước cố định, trong glibc của Linux bị giới hạn bởi hằng số `FD_SETSIZE` (thường là 1024), nên chỉ có thể xử lý an toàn các fd có số hiệu từ 0~1023. Trước mỗi lần gọi đều phải thiết lập lại toàn bộ tập hợp theo dõi, và sau khi trả về ứng dụng phải duyệt qua toàn bộ bitmap để tìm ra fd nào sẵn sàng.

`poll` thay thế bitmap bằng mảng cấu trúc `pollfd`, loại bỏ được giới hạn `FD_SETSIZE`. Tuy nhiên về bản chất, mỗi lần gọi nó vẫn phải truyền toàn bộ mảng cấu trúc vào kernel, và khi trả về vẫn phải duyệt qua toàn bộ mảng để kiểm tra trường `revents`. Vì vậy khi số lượng kết nối lớn mà tỷ lệ hoạt động thấp, chi phí quét tuyến tính vẫn rất tốn kém.

`epoll` duy trì danh sách theo dõi trong kernel thông qua `epoll_ctl`, và lấy các sự kiện sẵn sàng qua `epoll_wait`. Bên trong kernel duy trì interest list (cây đỏ-đen) và ready list (danh sách liên kết). Khi một fd sẵn sàng, hàm callback sẽ đưa nó vào ready list, ứng dụng khi chờ chỉ việc lấy ra danh sách các sự kiện sẵn sàng này. Nó hỗ trợ hai chế độ kích hoạt: LT (Level-Triggered - kích hoạt theo mức) và ET (Edge-Triggered - kích hoạt theo cạnh). LT sẽ liên tục thông báo chừng nào buffer còn dữ liệu; ET chỉ thông báo một lần duy nhất khi có sự thay đổi trạng thái, bắt buộc phải kết hợp với fd non-blocking và đọc vòng lặp cho tới khi gặp lỗi `EAGAIN`.

![So sánh select, poll và epoll: Cấu trúc dữ liệu, giới hạn fd, truyền tham số mỗi lần chờ, chi phí tìm fd sẵn sàng và chế độ kích hoạt](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/io-multiplexing-select-poll-epoll-6d5bee4f.png)

Tuy nhiên, không phải trong mọi trường hợp epoll đều nhanh hơn. Nếu số lượng kết nối rất ít, hoặc hầu hết tất cả các kết nối đều liên tục hoạt động, thì chi phí quản lý của `epoll_ctl`, hàm callback và ready list cũng cần phải tính đến. Sân chơi tỏa sáng nhất của epoll là các ứng dụng server có lượng kết nối khổng lồ, duy trì kết nối dài hạn nhưng phần lớn thời gian các kết nối đều ở trạng thái nhàn rỗi.

Xem chi tiết tại: [Giải thích chi tiết về I/O Multiplexing: Nguyên lý và sự khác biệt giữa select, poll, epoll](./io-multiplexing.md).

### Zero-Copy (Không sao chép) là gì?

Zero-Copy không có nghĩa là hoàn toàn không có bất kỳ thao tác sao chép dữ liệu nào, mà là **hạn chế tối đa việc CPU phải vận chuyển dữ liệu qua lại giữa kernel buffer và user buffer**, từ đó giảm thiểu chi phí sao chép của CPU và số lần chuyển đổi chế độ User Mode / Kernel Mode.

Lấy kịch bản truyền file truyền thống bằng `read + write` làm ví dụ, dữ liệu thường phải trải qua 4 lần sao chép: Từ đĩa vào kernel buffer là DMA copy, từ kernel buffer sang user buffer là CPU copy, từ user buffer sang socket buffer tiếp tục là CPU copy, từ socket buffer ra card mạng là DMA copy. Phần lãng phí nhất ở đây chính là hai lần CPU copy ở giữa, vì ứng dụng hoàn toàn không hề chỉnh sửa dữ liệu mà chỉ để dữ liệu đi một vòng qua không gian người dùng.

![Đường dẫn sao chép dữ liệu của read/write truyền thống: Đĩa vào kernel buffer, kernel sang user buffer, user sang socket buffer, socket ra card mạng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-traditional-read-write-d7c9db35.png)

Tư tưởng của zero-copy là để dữ liệu lưu lại và chuyển tiếp trực tiếp ngay trong đường dẫn kernel. Ví dụ lệnh gọi `sendfile` có thể chuyển thẳng dữ liệu file từ Page Cache sang socket buffer; nếu card mạng hỗ trợ tính năng SG-DMA (Scatter-Gather DMA), socket buffer thậm chí chỉ cần chứa thông tin mô tả con trỏ, còn phần payload dữ liệu sẽ do DMA kéo thẳng từ Page Cache ra card mạng.

Zero-copy rất phù hợp cho các kịch bản truyền file tĩnh nguyên bản, truyền file dung lượng lớn, hoặc gửi log phân đoạn trong message queue. Phía consumer của Kafka khi gửi file log segment tới client rất chuộng sử dụng `FileChannel.transferTo`, cơ chế chạy ngầm bên dưới chính là tuyến đường `sendfile`.

Xem chi tiết tại: [Giải thích chi tiết về Zero-Copy: mmap, sendfile và splice](./zero-copy.md).

### Điểm khác biệt giữa mmap, sendfile và splice là gì?

Kết luận: **Cần chỉnh sửa dữ liệu, dùng `mmap`; chỉ truyền file nguyên bản ra Socket, dùng `sendfile`; chuyển tiếp dữ liệu linh hoạt giữa các fd bất kỳ, cân nhắc `splice`**.

`mmap + write` tận dụng cơ chế ánh xạ bộ nhớ ảo để đưa file vào không gian địa chỉ của tiến trình. Khi ứng dụng truy cập vùng nhớ này, thực chất là truy cập thẳng vào các trang vật lý tương ứng trong Page Cache, loại bỏ được một lần CPU copy từ "kernel buffer -> user buffer" của lệnh `read` truyền thống. Tuy nhiên thao tác `write` sau đó vào socket buffer thông thường vẫn phát sinh một lần CPU copy. Nó thích hợp cho kịch bản cần đọc, chỉnh sửa, phân tích dữ liệu trước khi gửi đi.

`sendfile` chuyên dụng hơn cho tác vụ truyền trực tiếp "file -> socket". Dữ liệu hoàn toàn không đi qua User Mode, số lần system call cũng ít hơn; trên card mạng hỗ trợ SG-DMA, số lần CPU copy payload giảm hẳn về 0. Các máy chủ file tĩnh hoặc truyền file log trong Kafka là kịch bản rất kinh điển.

`splice` mượn đường ống pipe bên trong kernel để di chuyển tham chiếu trang giữa các file descriptor bất kỳ (ví dụ socket sang socket, hoặc file sang pipe rồi sang socket). Ràng buộc của nó là trong đường truyền thường phải có một đầu là pipe, và truyền từ file sang socket thường đòi hỏi 2 lần gọi `splice`, độ phức tạp mã nguồn và số lần system call đều cần phải cân nhắc.

![So sánh số lần sao chép và chuyển đổi chế độ giữa read/write truyền thống, mmap + write, sendfile + SG-DMA và splice](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-four-ways-comparison-520d4d0b.png)

Zero-copy cũng có những kịch bản không thể áp dụng: Mã hóa TLS, nén dữ liệu, chuyển đổi định dạng, lọc nội dung, đóng dấu bản quyền... đều đòi hỏi ứng dụng phải can thiệp xử lý payload thực tế, lúc này dữ liệu không thể nằm yên mãi trong kernel. Với các file rất nhỏ hoặc truy cập ngẫu nhiên, chi phí cố định để thiết lập ánh xạ, xử lý thiếu trang hay khởi tạo pipe có thể vượt quá lợi ích mang lại.

Xem chi tiết tại: [Giải thích chi tiết về Zero-Copy: mmap, sendfile và splice](./zero-copy.md).

## Hệ thống tập tin (File System)

### Hệ thống tập tin chủ yếu làm những gì?

Hệ thống tập tin chịu trách nhiệm tổ chức các khối lưu trữ trên thiết bị phần cứng thành các tập tin và thư mục mà ứng dụng có thể hiểu và thao tác được. Trong phỏng vấn, bạn có thể trả lời qua 6 nhiệm vụ sau:

![Tổng quan trách nhiệm của hệ thống tập tin](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-system-responsibilities-e613f01c.webp)

1. **Đặt tên (Naming)**: Sử dụng đường dẫn và tên file để định vị file mục tiêu, ví dụ `/var/log/app.log`.
2. **Tổ chức (Organization)**: Dùng cấu trúc cây thư mục để quản lý file và thư mục, giúp phân cấp rõ ràng.
3. **Định vị (Locating)**: Ánh xạ byte thứ N của một file tới các khối dữ liệu vật lý tương ứng dưới đĩa.
4. **Quản lý không gian (Space Management)**: Cấp phát, giải phóng và tái sử dụng các khối đĩa, ghi nhận khối nào còn trống, khối nào đã sử dụng.
5. **Bảo vệ quyền hạn (Access Protection)**: Lưu trữ metadata như chủ sở hữu, quyền truy cập, dấu thời gian, và thực hiện kiểm tra khi truy xuất.
6. **Bộ nhớ đệm và Phục hồi (Caching & Recovery)**: Dùng Page Cache để nâng cao hiệu năng đọc ghi, dùng cơ chế ghi nhật ký (journaling) để giảm thiểu hư hại cấu trúc hệ thống tập tin sau khi bị sự cố sập nguồn.

Không phải hệ thống tập tin nào cũng gắn với ổ đĩa cục bộ. `tmpfs` sử dụng bộ nhớ RAM làm nơi lưu trữ, `procfs` hiển thị trạng thái hoạt động của kernel, còn NFS kết nối hệ thống tập tin từ xa vào cây thư mục cục bộ. Linux cung cấp giao diện đồng nhất cho tất cả các hệ thống tập tin này thông qua lớp VFS (Virtual File System).

### Mối quan hệ giữa File, Directory, inode, dentry là gì?

Trong hệ thống tập tin Linux/Unix, tên file thông thường không được lưu trữ bên trong inode.

![Mối quan hệ giữa tên file, dentry và inode](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-inode-dentry-relation-9ed196c7.webp)

- **Mục thư mục (Directory Entry)**: Lưu mối liên kết ánh xạ giữa tên file và số hiệu inode.
- **inode (Index Node)**: Ghi lại thông tin loại file, quyền hạn, chủ sở hữu, kích thước, dấu thời gian, số lượng liên kết cứng (link count), và thông tin ánh xạ tới các khối dữ liệu hoặc extent.
- **dentry (Directory Entry Cache)**: Bộ nhớ đệm mục thư mục do VFS duy trì trong RAM để tăng tốc quá trình phân giải đường dẫn. dentry trỏ tới inode, và cũng có thể lưu đệm cả kết quả tra cứu của các file không tồn tại (negative dentry).
- **Khối dữ liệu hoặc extent**: Nơi thực sự lưu trữ nội dung dữ liệu của các file thông thường.

Điều này giải thích vì sao cùng một file có thể có nhiều tên gọi khác nhau: Nhiều mục thư mục có thể cùng trỏ về một số hiệu inode duy nhất. Lệnh `mv a.txt b.txt` nếu diễn ra trong cùng một hệ thống tập tin thì phần lớn trường hợp chỉ đơn thuần là sửa đổi mục thư mục, nội dung dữ liệu của file hoàn toàn không bị dịch chuyển.

Các lệnh kiểm tra inode và metadata:

```bash
ls -li app.log
stat app.log
df -i
```

### Điều gì xảy ra khi thực hiện lệnh open mở một file?

`open()` không hề đọc toàn bộ nội dung file vào trong bộ nhớ, nó chủ yếu làm nhiệm vụ phân giải đường dẫn và tạo đối tượng mở file trong kernel.

![Từ đường dẫn tới File Descriptor](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-path-to-fd-2e2e40b2.webp)

Quy trình tổng quát diễn ra như sau:

1. Bắt đầu từ thư mục gốc hoặc thư mục hiện tại, phân giải đường dẫn từng cấp một, tra cứu lần lượt qua các mục thư mục và dentry cache.
2. Sau khi tìm thấy inode mục tiêu, kiểm tra quyền hạn, các cờ mở file (flags) và loại file.
3. Tạo đối tượng mở file (open file description) trong kernel, ghi nhận độ lệch hiện tại của file (offset), trạng thái mở, cờ đọc ghi...
4. Cấp phát một số nguyên không âm nhỏ nhất đang khả dụng trong bảng file descriptor của tiến trình hiện tại, số này chính là fd.

fd chỉ là chỉ số mục trong bảng file descriptor của tiến trình, không phải là inode. Sau khi gọi `dup()` hoặc `fork()`, nhiều fd có thể cùng tham chiếu tới một đối tượng mở file trong kernel, do đó chúng dùng chung con trỏ độ lệch offset; còn khi hai tiến trình độc lập cùng gọi `open()` trên cùng một file, chúng sẽ nhận được hai đối tượng mở file riêng biệt và tự duy trì offset độc lập.

### File được lưu trữ trên đĩa như thế nào?

Hệ thống tập tin chia phân vùng ổ đĩa thành rất nhiều khối, sau đó dùng metadata để ghi nhận mối quan hệ giữa nội dung file và các khối đĩa. Trong giáo trình thường giới thiệu 3 phương thức cấp phát:

![Phương thức định vị khối dữ liệu của file](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-block-allocation-19a7c361.webp)

- **Cấp phát liên tục**: File chiếm một dải các khối đĩa liên tiếp nhau, tốc độ đọc ghi tuần tự và truy cập ngẫu nhiên đều rất nhanh; nhược điểm là khó mở rộng kích thước file và dễ gây phân mảnh ngoài.
- **Cấp phát liên kết**: Mỗi khối đĩa chứa con trỏ trỏ tới khối tiếp theo, không đòi hỏi không gian liên tục; nhược điểm là hiệu năng truy cập ngẫu nhiên rất kém.
- **Cấp phát chỉ mục**: Tập trung địa chỉ của các khối dữ liệu vào trong các khối chỉ mục riêng biệt, giúp truy cập ngẫu nhiên thuận tiện hơn; nhược điểm là tốn thêm không gian lưu trữ các khối chỉ mục.

Hệ thống ext2/ext3 kinh điển sử dụng con trỏ trực tiếp, gián tiếp cấp 1, gián tiếp cấp 2 và gián tiếp cấp 3 để định vị khối dữ liệu của file. ext4 thường sử dụng cây extent (extent tree): một extent ghi lại điểm bắt đầu logic, điểm bắt đầu vật lý và độ dài của một đoạn các khối vật lý liên tục; đối với các file dung lượng lớn và liên tục, extent tiết kiệm metadata hơn rất nhiều so với việc ghi nhận địa chỉ của từng khối riêng rẽ.

### Điểm khác biệt giữa Hard Link và Soft Link là gì?

Cả Hard Link (liên kết cứng) và Soft Link (liên kết mềm / symbolic link) đều cho phép liên kết một đường dẫn tới một file khác, nhưng đối tượng mà chúng trỏ tới là khác nhau.

![So sánh Hard Link và Soft Link](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-hardlink-symlink-0dd2c4bf.webp)

| Tiêu chí so sánh | Hard Link (Liên kết cứng) | Soft Link (Liên kết mềm) |
| --- | --- | --- |
| Đối tượng trỏ tới | Cùng trỏ tới một số hiệu inode duy nhất | Trỏ tới một chuỗi đường dẫn khác |
| Có tạo inode mới không | Không tạo inode mới, chỉ thêm mục thư mục và tăng link count | Có tạo inode riêng biệt vì soft link là một file độc lập |
| Sau khi xóa file gốc | Miễn là còn liên kết cứng khác thì dữ liệu vẫn tồn tại nguyên vẹn | Soft link sẽ bị gãy (dangling link trỏ vào hư vô) |
| Có thể vượt hệ thống tập tin không | Không thể | Hoàn toàn có thể |
| Có thể liên kết tới thư mục không | Linux không cho phép người dùng thông thường tạo hard link cho thư mục | Hoàn toàn có thể |

Thí nghiệm kiểm chứng qua các lệnh:

```bash
echo hello > a.txt
ln a.txt hard.txt
ln -s a.txt soft.txt

ls -li a.txt hard.txt soft.txt
```

`a.txt` và `hard.txt` có số hiệu inode giống hệt nhau, trong khi `soft.txt` có số hiệu inode hoàn toàn khác. Sau khi xóa `a.txt`, `hard.txt` vẫn đọc được nội dung bình thường, còn `soft.txt` sẽ trỏ vào một đường dẫn không còn tồn tại.

### Tại sao Hard Link không thể vượt qua các hệ thống tập tin khác nhau?

Hard Link trỏ trực tiếp tới số hiệu inode, mà số hiệu inode chỉ có ý nghĩa duy nhất bên trong nội bộ một hệ thống tập tin cụ thể. Mỗi hệ thống tập tin đều có bảng inode riêng biệt của mình; cùng một số hiệu inode ở một hệ thống tập tin khác hoàn toàn không đại diện cho cùng một file.

Trong khi đó, Soft Link lưu trữ một chuỗi ký tự đường dẫn, khi truy xuất hệ thống sẽ tiến hành tra cứu lại đường dẫn đó từ đầu qua các điểm gắn kết (mount points), nên có thể vượt qua các hệ thống tập tin khác nhau một cách dễ dàng.

### Sau khi hàm write trả về thành công thì dữ liệu đã chắc chắn ghi xuống đĩa chưa?

Chưa chắc chắn. Đối với các thao tác buffered I/O thông thường, `write()` thành công thường chỉ có nghĩa là dữ liệu đã được kernel tiếp nhận, phổ biến nhất là dữ liệu đã đi vào Page Cache và được đánh dấu là trang bẩn (dirty page), chứ hoàn toàn không đồng nghĩa với việc dữ liệu đã được ghi bền vững xuống thiết bị lưu trữ vật lý bên dưới.

![Đường dẫn từ ghi file tới lưu trữ bền vững](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-write-persistence-edfe5461.webp)

Nếu ứng dụng đòi hỏi tính bền vững tuyệt đối, nó bắt buộc phải gọi:

- `fsync()`: Đồng bộ toàn bộ dữ liệu của file và các metadata liên quan xuống đĩa.
- `fdatasync()`: Đồng bộ dữ liệu của file, cùng các metadata bắt buộc phải có cho các lần đọc dữ liệu sau này (ví dụ kích thước file).
- Dùng các cờ mở file có ngữ nghĩa đồng bộ, chẳng hạn `O_SYNC`, `O_DSYNC`.

Cần lưu ý thêm 2 chi tiết kỹ thuật:

1. `write()` có thể chỉ ghi được một phần số byte yêu cầu (partial write), bên gọi phải tự xử lý việc ghi tiếp phần còn lại.
2. Sau khi tạo file mới, gọi `rename()` hoặc `unlink()`, nếu muốn đảm bảo các mục thư mục cũng tồn tại an toàn sau khi sập nguồn, thông thường bạn còn phải gọi `fsync()` lên fd của thư mục cha.

### Hệ thống tập tin ghi nhật ký (Journaling File System) giải quyết bài toán gì?

Một thao tác trên hệ thống tập tin thường đòi hỏi phải chỉnh sửa nhiều vị trí metadata cùng một lúc. Ví dụ khi tạo file mới, cần cấp phát inode, cấp phát khối dữ liệu, cập nhật mục thư mục, cập nhật bitmap phân bổ. Nếu máy bị mất điện đột ngột ở giữa chừng, hệ thống tập tin có thể bị kẹt lại ở trạng thái không nhất quán.

Hệ thống tập tin ghi nhật ký sẽ ghi lại các thay đổi metadata dự kiến vào một vùng nhật ký (journal log) trước, sau đó mới cập nhật vào vị trí chính thức. Khi hệ thống phục hồi sau sự cố, nó quét lại nhật ký: Các giao dịch đã commit trọn vẹn nhưng chưa kịp ghi vào vị trí chính thức sẽ được chạy lại (replay), còn các giao dịch chưa commit trọn vẹn sẽ bị hủy bỏ.

Lấy ext4 làm ví dụ, thường có 3 chế độ ghi nhật ký:

| Chế độ | Giải thích |
| --- | --- |
| `data=writeback` | Chỉ ghi nhật ký cho metadata, không đảm bảo các khối dữ liệu liên quan được ghi xuống trước metadata |
| `data=ordered` | Chế độ mặc định; trước khi metadata vào nhật ký, các khối dữ liệu liên quan sẽ được ghi xuống hệ thống tập tin chính trước |
| `data=journal` | Cả dữ liệu lẫn metadata đều được ghi vào nhật ký trước rồi mới ghi vào vị trí chính thức, khuếch đại ghi (write amplification) rất rõ rệt |

Hệ thống tập tin ghi nhật ký chủ yếu đảm bảo tính nhất quán về mặt cấu trúc của file system, chứ không đồng nghĩa với việc đảm bảo ứng dụng không bao giờ bị mất dữ liệu nghiệp vụ. Tính bền vững cấp giao dịch của ứng dụng vẫn phải dựa vào việc ứng dụng sử dụng đúng đắn `fsync()`, tuần tự ghi và logic khôi phục dữ liệu.

### Có những cách nào để nâng cao hiệu năng của hệ thống tập tin?

Bạn có thể trả lời bao quát từ các khía cạnh: mẫu hình truy cập, bộ nhớ đệm, metadata và phần cứng:

- **Ưu tiên đọc ghi tuần tự**: I/O tuần tự dễ dàng tận dụng được cơ chế đọc trước (read-ahead), gộp lệnh ghi (write merging) và ánh xạ khối liên tục qua extent.
- **Tận dụng tốt Page Cache**: Đọc ghi file thông thường đều đi qua Page Cache, trúng cache sẽ giảm bớt truy xuất đĩa; tuy nhiên cache không phải càng to càng tốt, cần chú ý tới áp lực bộ nhớ và áp lực xả trang bẩn (writeback).
- **Hạn chế file nhỏ và thao tác metadata**: Một lượng khổng lồ các file nhỏ sẽ nhân bội chi phí tra cứu inode, mục thư mục, kiểm tra quyền hạn, tạo mới và xóa file.
- **Kiểm soát tần suất xả đĩa (fsync)**: Gọi `fsync()` quá thường xuyên sẽ kéo tụt thông lượng, nhưng hoàn toàn không gọi thì lại mở rộng rủi ro mất dữ liệu khi mất điện; cần cân đối theo yêu cầu bền vững của nghiệp vụ.
- **Chọn hệ thống tập tin và tham số mount phù hợp**: ext4, XFS, Btrfs có kiến trúc khác nhau; các tham số như `noatime`, chế độ journal, barrier... đều ảnh hưởng trực tiếp tới hiệu năng và độ tin cậy.
- **Sử dụng phần cứng phù hợp**: Ổ SSD, NVMe, mảng RAID và cơ chế cache của controller đều nâng cao đáng kể độ trễ và thông lượng đọc ghi.

Các lệnh chẩn đoán sự cố thường dùng:

```bash
df -h
df -i
lsof +L1
iostat -x 1
```

Khi lệnh `df` báo ổ đĩa đầy nhưng lệnh `du` lại không tìm thấy file dung lượng lớn nào, hãy ưu tiên kiểm tra các file đã bị xóa nhưng vẫn đang bị một tiến trình mở giữ file handle (`lsof +L1`); khi số lượng file nhỏ quá nhiều, `df -i` có thể phát hiện lỗi cạn kiệt inode sớm hơn nhiều so với việc cạn kiệt dung lượng đĩa trong `df -h`.

Xem chi tiết tại: [Giải thích chi tiết về Hệ thống tập tin hệ điều hành: inode, VFS, Page Cache và Cơ chế ghi nhật ký](./file-system.md).

### Các thuật toán điều phối đĩa (Disk Scheduling) phổ biến gồm những gì?

Các thuật toán như SCAN, SSTF, LOOK dưới đây chủ yếu hướng tới ổ đĩa cứng cơ học (HDD). Một thao tác đọc ghi trên ổ HDD bao gồm thời gian tìm rãnh (seek time), độ trễ quay (rotational delay) và thời gian truyền dữ liệu; bộ điều phối có thể sắp xếp lại thứ tự các yêu cầu để giảm thiểu quãng đường dịch chuyển của đầu đọc và thời gian chờ đợi.

6 thuật toán điều phối đĩa kinh điển gồm:

![Các thuật toán điều phối đĩa phổ biến](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/disk-scheduling-algorithms-d978c14f.png)

1. **Đến trước phục vụ trước (FCFS - First-Come First-Served)**: Xử lý theo đúng thứ tự yêu cầu gửi tới bộ điều phối đĩa. Triển khai đơn giản nhưng không hề tính tới vị trí và hướng di chuyển của đầu đọc, thời gian tìm rãnh trung bình có thể rất dài. Thuật toán không bao giờ bỏ qua vô thời hạn bất kỳ yêu cầu nào nên không có vấn đề đói tài nguyên, nhưng các yêu cầu đứng sau một yêu cầu ở xa có thể phải chờ rất lâu.
2. **Thời gian tìm rãnh ngắn nhất trước (SSTF - Shortest Seek Time First)**: Còn gọi là dịch vụ ngắn nhất trước, ưu tiên chọn yêu cầu nào có khoảng cách gần vị trí đầu đọc hiện tại nhất để phục vụ. SSTF tối thiểu hóa thời gian tìm rãnh của đầu đọc, nhưng rất dễ dẫn tới hiện tượng đói tài nguyên (starvation): Các yêu cầu ở gần đầu đọc liên tục được phục vụ, khiến các yêu cầu ở xa đầu đọc có thể bị treo vô thời hạn. Trong thực tế cần có cơ chế tối ưu để ngăn ngừa hiện tượng này.
3. **Thuật toán quét (SCAN)**: Còn gọi là thuật toán thang máy (Elevator Algorithm), tư tưởng cơ bản rất giống thang máy tòa nhà. Đầu đọc di chuyển quét theo một hướng cố định dọc theo đĩa, nếu rãnh đi qua có yêu cầu thì xử lý, cho tới khi chạm tới biên ngoài cùng của đĩa thì mới đổi chiều di chuyển, cứ thế lặp đi lặp lại. SCAN đảm bảo tất cả các yêu cầu đều được phục vụ, giải quyết triệt để nạn đói tài nguyên. Tuy nhiên, nếu đầu đọc vừa quét qua một hướng xong mà yêu cầu mới tới, yêu cầu đó phải đợi đầu đọc quét xong chiều ngược lại quay về mới được phục vụ.
4. **Thuật toán quét vòng tròn (C-SCAN - Circular Scan)**: Một biến thể của SCAN, chỉ quét đĩa theo một chiều duy nhất cho tới khi chạm biên đĩa, sau đó lập tức quay ngoắt về điểm xuất phát của đĩa để bắt đầu một chu kỳ quét mới mà không phục vụ yêu cầu nào trên đường quay về.
5. **Thuật toán vừa quét vừa quan sát (LOOK)**: Trong SCAN, đầu đọc bắt buộc phải đi tới tận rìa biên của đĩa mới chịu đổi chiều di chuyển, điều này có thể làm lãng phí thời gian vì phía trước có thể không còn bất kỳ yêu cầu nào nữa. LOOK cải tiến SCAN ở chỗ: Nếu trên hướng di chuyển phía trước không còn yêu cầu nào cần xử lý nữa, đầu đọc lập tức đổi chiều di chuyển ngay tại chỗ mà không cần đi tới tận biên đĩa.
6. **Thuật toán quét vòng tròn cân bằng (C-LOOK)**: C-LOOK cải tiến C-SCAN tương tự như cách LOOK cải tiến SCAN: Đầu đọc chỉ di chuyển tới yêu cầu xa nhất trên hướng quét chứ không chạy tới tận biên đĩa, và khi quay về nó cũng chỉ lùi về tới vị trí yêu cầu nhỏ nhất cần xử lý chứ không cần lùi về tận điểm gốc của đĩa.

Ví dụ minh họa: Giả sử đầu đọc đang ở rãnh 50, chuỗi yêu cầu là 82, 170, 43, 140, 24. FCFS sẽ xử lý tuần tự theo thứ tự đến, quãng đường đầu đọc di chuyển rất ngoằn ngoèo; SSTF sẽ chọn 43 gần nhất trước, quãng đường tìm kiếm trung bình ngắn hơn nhưng các yêu cầu ở xa có nguy cơ bị trì hoãn lâu; còn SCAN/LOOK sẽ quét tuần tự theo một chiều rồi mới đổi chiều, mang lại tính công bằng rất tốt.

Các thiết bị SSD và NVMe không hề có đầu đọc cơ học hay chuyển động quay đĩa, do đó không thể áp dụng trực tiếp các mô hình chuyển động đầu đọc ở trên. Tuy nhiên, tầng khối (block layer) trong Linux hiện đại vẫn tiến hành gộp và sắp xếp lại các yêu cầu thông qua blk-mq và các I/O scheduler để tối ưu hóa thông lượng, tính công bằng và độ trễ theo đặc tính phần cứng.

## Tài liệu tham khảo

- *Giáo trình Hệ điều hành máy tính* (Thang Tiểu Đan - Tái bản lần thứ 4)
- *Computer Systems: A Programmer's Perspective* (CS:APP)
- *Học lại Hệ điều hành* (Relearning Operating Systems)
- *Nguyên lý và Hiện thực hóa Hệ điều hành Hiện đại*
- Tổng hợp kiến thức Hệ điều hành luyện thi Vương Đạo: <https://wizardforcel.gitbooks.io/wangdaokaoyan-os/content/13.html>
- Quản lý bộ nhớ Buddy System và SLAB: <https://blog.csdn.net/qq_44272681/article/details/124199068>
- Tại sao Linux cần Bộ nhớ ảo: <https://draveness.me/whys-the-design-os-virtual-memory/>
- Sự tu dưỡng của lập trình viên (7): Lỗi thiếu trang bộ nhớ: <https://liam.page/2017/09/01/page-fault/>
- Những điều cần biết về Bộ nhớ ảo: <https://juejin.cn/post/6844903507594575886>
