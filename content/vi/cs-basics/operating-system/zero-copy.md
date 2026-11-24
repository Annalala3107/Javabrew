---
title: "Giải mã kỹ thuật Zero-Copy: mmap, sendfile và splice"
description: "Tổng hợp câu hỏi phỏng vấn tần suất cao về Zero-Copy, giải thích cặn kẽ luồng sao chép dữ liệu, chuyển đổi ngữ cảnh, cơ chế SG-DMA của read/write truyền thống, mmap, sendfile, splice, cùng các kịch bản ứng dụng trong Java NIO, Kafka và RocketMQ."
category: Kiến thức cơ sở máy tính
tag:
  - Hệ điều hành
  - Linux
  - Hiệu năng cao
head:
  - - meta
    - name: keywords
      content: Zero-Copy,mmap,sendfile,splice,SG-DMA,Page Cache,Java NIO,FileChannel,transferTo,Kafka,RocketMQ,câu hỏi phỏng vấn hệ điều hành
lang: vi
sourceRef: zh-ref/cs-basics/operating-system/zero-copy.md
---

Trong các buổi phỏng vấn kỹ thuật thường có một kịch bản rất quen thuộc: Người phỏng vấn sẽ mở đầu bằng câu hỏi *"Vì sao Kafka lại nhanh đến vậy?"* hoặc *"Vì sao RocketMQ có thể chịu tải được lượng tin nhắn tồn đọng khổng lồ?"*. Khi bạn vừa trả lời trơn tru các từ khóa như ghi tuần tự (sequential write), Page Cache và Zero-Copy, người phỏng vấn sẽ lập tức đào sâu thêm: *"Cụ thể thì Zero-Copy đã cắt giảm được những lần sao chép nào?"*, *"mmap và sendfile khác nhau ở điểm nào?"*, *"Thế còn splice sinh ra để làm gì?"*.

Đến bước này, không ít ứng viên bắt đầu lúng túng nói chung chung. Những người thuộc lòng câu khẩu hiệu *"Zero-Copy là dữ liệu không đi qua User Space"* thì rất nhiều, nhưng tính toán rành mạch được sổ cái gồm 4 lần sao chép, 2 lần DMA và các lần chuyển đổi ngữ cảnh thì lại chẳng được mấy ai.

Bài viết này sẽ bắt đầu từ một bài toán cơ bản nhất — gửi một file qua mạng: **I/O truyền thống phải sao chép bao nhiêu lần, chữ "Zero" trong Zero-Copy thực chất cắt giảm ở khâu nào, ba con đường mmap, sendfile, splice lần lượt tối ưu được điều gì, và mỗi phương án phải trả cái giá nào.**

Trước khi chính thức đi vào chi tiết, chúng ta cần thống nhất một quy chuẩn tính toán làm thước đo cơ sở.

Xuyên suốt bài viết, khi nhắc đến cụm từ *"bao nhiêu lần sao chép, bao nhiêu lần chuyển đổi"*, chúng ta mặc định tính toán trên mô hình chuẩn dưới đây. Khi ngữ cảnh thay đổi, các con số này sẽ biến động theo:

- Ngữ cảnh là gửi một file thông thường lưu trên đĩa cứng qua một TCP socket đã được thiết lập sẵn, và ban đầu dữ liệu chưa nằm trong Page Cache (bắt buộc phải thực hiện đọc đĩa vật lý).
- Không xét đến các thao tác xử lý dữ liệu ở User Space như mã hóa TLS, nén dữ liệu, hay biến đổi định dạng giao thức.
- Phần cứng thiết bị hỗ trợ đầy đủ các tính năng DMA và scatter-gather phổ biến.
- Các "lần sao chép" được đếm ở đây chỉ tính riêng phần dữ liệu tải trọng (payload), không tính các bộ mô tả (descriptor) hay metadata nhỏ của Kernel.
- Khái niệm "chuyển đổi ngữ cảnh" nhắc tới dưới đây, nói một cách chuẩn xác là **chuyển đổi chế độ (mode switch) giữa User Mode và Kernel Mode** (mỗi system call đi vào và đi ra tính là hai lần chuyển đổi); điều này khác với "chuyển đổi ngữ cảnh Thread" khi bộ lập lịch hoán đổi các Thread ra vào CPU Core; chuyển đổi ngữ cảnh Thread chỉ phát sinh thêm khi system call thực sự bị chặn (block) và Thread bị đưa vào trạng thái ngủ.

Nếu dữ liệu đã nằm ấm trong Page Cache, nếu có bật mã hóa TLS, hoặc phần cứng không hỗ trợ SG-DMA, các con số này đều sẽ thay đổi. Giả định ở đây nhằm mục đích giúp bạn nhìn rõ cơ chế cốt lõi; đừng coi các con số này là đáp án bất biến trong mọi môi trường.

## read/write truyền thống thực sự sao chép bao nhiêu lần?

Hãy xem xét kịch bản phổ biến nhất: Một endpoint tải file, máy chủ cần đọc một file trên đĩa cứng và gửi nó tới client qua socket đã kết nối sẵn. Cách viết trực tiếp nhất là một vòng lặp `read` kết hợp với `write`:

```c
while ((n = read(file_fd, buf, BUF_SIZE)) > 0)
    write(socket_fd, buf, n);
```

Nhìn qua chỉ có vỏn vẹn hai dòng code, nhưng tầng dưới hệ điều hành lại phải hoạt động vô cùng vất vả. Để hoàn tất một vòng "đọc đĩa + gửi mạng", CPU và DMA tổng cộng phải vận chuyển dữ liệu tới 4 lượt, và quyền thực thi phải chuyển đổi qua lại giữa User Mode và Kernel Mode tới 4 lần.

![Đường đi sao chép dữ liệu của read/write truyền thống: Đĩa sang bộ đệm Kernel, Kernel sang bộ đệm User, User sang bộ đệm Socket, Socket sang card mạng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-traditional-read-write-d7c9db35.png)

Bóc tách hai dòng code này ra, nửa đầu của lệnh `read` sẽ diễn ra như sau:

1. Ứng dụng gọi hàm `read`, kích hoạt system call, **chuyển đổi chế độ từ User Mode sang Kernel Mode** (Lần chuyển đổi 1).
2. Bộ điều khiển DMA sao chép dữ liệu từ đĩa cứng vào bộ đệm đọc của Kernel / Page Cache (Lần sao chép 1, DMA copy).
3. CPU sao chép dữ liệu từ bộ đệm đọc của Kernel sang bộ đệm ứng dụng ở User Space (Lần sao chép 2, CPU copy), sau đó **chuyển đổi ngược về User Mode** (Lần chuyển đổi 2), hàm `read` trả về.

Nửa sau của lệnh `write` diễn ra đối xứng hoàn toàn:

4. Ứng dụng gọi hàm `write`, kích hoạt system call, **chuyển đổi sang Kernel Mode** (Lần chuyển đổi 3).
5. CPU sao chép dữ liệu từ bộ đệm User Space sang bộ đệm gửi của Socket (Lần sao chép 3, CPU copy).
6. Bộ điều khiển DMA sao chép dữ liệu từ bộ đệm Socket sang card mạng (NIC) để phát đi (Lần sao chép 4, DMA copy), sau đó **chuyển đổi ngược về User Mode** (Lần chuyển đổi 4), hàm `write` trả về.

Tổng kết sổ cái: **4 lần chuyển đổi chế độ, 4 lần sao chép dữ liệu**, trong đó có 2 lần là DMA copy và 2 lần là CPU copy. (Nói một cách nghiêm ngặt, lệnh `write` sau khi sao chép dữ liệu vào bộ đệm gửi socket thì thường sẽ trả về ngay; việc card mạng xếp hàng, phân đoạn và DMA phát dữ liệu ra dây mạng là do ngăn xếp giao thức mạng hoàn thành bất đồng bộ, không cần đợi DMA phát xong mới chuyển về User Mode. Việc vẽ gộp trong một luồng gọi ở đây là để cân bằng sổ sách tính toán cho trọn vẹn.)

Nói thêm một chút về **DMA (Direct Memory Access - Truy cập bộ nhớ trực tiếp)**: Đây là năng lực do bộ điều khiển thiết bị hoặc engine DMA trong hệ thống cung cấp, cho phép vận chuyển dữ liệu trực tiếp giữa thiết bị ngoại vi và bộ nhớ RAM mà không cần CPU phải nhúng tay theo dõi suốt quá trình (trên phần cứng hiện đại nó thường được tích hợp luôn trong bộ điều khiển thiết bị, SoC hoặc chipset, chứ không nhất thiết là một con chip rời). Những công việc thuần cơ bắp nặng nhọc như chuyển dữ liệu từ đĩa sang bộ đệm Kernel, hay từ bộ đệm Socket ra card mạng được giao khoán cho DMA, giúp giải phóng CPU để tính toán các logic nghiệp vụ khác; do đó các lần DMA copy không hề thiêu đốt chu kỳ CPU.

Thứ thực sự gây nghẽn cổ chai chính là hai lần **CPU copy**. Dữ liệu từ bộ đệm đọc Kernel được sao chép sang bộ đệm User Space, rồi từ bộ đệm User Space lại được sao chép y nguyên sang bộ đệm Socket; thế nhưng trong endpoint tải file của chúng ta, ứng dụng thậm chí không hề chạm vào hay sửa đổi bất kỳ một byte dữ liệu nào. Dữ liệu chỉ đơn thuần "lượn lờ dạo chơi" một vòng qua User Space. CPU phải làm công việc vận chuyển vô nghĩa này từ đầu đến cuối, cộng thêm chi phí lưu/phục hồi thanh ghi của 4 lần chuyển đổi chế độ. Trong các kịch bản tải đồng thời cao hoặc truyền file dung lượng lớn, sự lãng phí này sẽ bị khuếch đại vô cùng rõ rệt.

Đó chính là những gì mà kỹ thuật Zero-Copy sinh ra để loại bỏ.

## Chữ "Zero" trong Zero-Copy thực chất là loại bỏ lần sao chép nào?

Trước hết hãy đính chính một hiểu lầm rất phổ biến: Zero-Copy không có nghĩa là hoàn toàn không phát sinh bất kỳ lần sao chép dữ liệu nào trong toàn bộ hệ thống.

Trong mô hình cơ sở của bài viết này (dữ liệu file chưa có trong Page Cache và được gửi qua TCP), dữ liệu vẫn bắt buộc phải trải qua hai chặng di chuyển bằng DMA: từ đĩa vào bộ nhớ, và từ bộ nhớ ra card mạng. **Zero-Copy cắt giảm chính là công việc CPU phải trực tiếp tham gia sao chép dữ liệu payload giữa các vùng nhớ, đồng thời tìm cách giảm thiểu số lần chuyển đổi chế độ giữa User Mode và Kernel Mode.** Nếu chuyển sang các kịch bản dữ liệu đã nằm sẵn trong Page Cache hoặc thiết bị truy cập trực tiếp Persistent Memory, số lần vận chuyển sẽ còn tiếp tục thay đổi.

Vì vậy định nghĩa chuẩn xác nhất là: Zero-Copy là tên gọi chung cho một nhóm các giải pháp kỹ thuật nhằm loại bỏ hoàn toàn sự can thiệp của CPU vào việc sao chép dữ liệu giữa các vùng đệm trong bộ nhớ suốt quá trình I/O, từ đó giảm tối đa số lần CPU copy và chuyển đổi chế độ User/Kernel. Dưới đây là ba con đường tiến hóa tiêu biểu xoay quanh mục tiêu "triệt tiêu CPU copy".

## Con đường thứ nhất: mmap + write

Ý tưởng đầu tiên bắt nguồn từ cơ chế bộ nhớ ảo. Hệ điều hành hiện đại dùng địa chỉ ảo thay cho địa chỉ vật lý, và cơ chế này sở hữu một đặc tính then chốt: **nhiều địa chỉ ảo khác nhau có thể cùng trỏ về một khối bộ nhớ vật lý duy nhất**.

`mmap` tận dụng triệt để đặc tính này. Chữ ký hàm của nó như sau:

```c
void *mmap(void *addr, size_t length, int prot, int flags, int fd, off_t offset);
```

Trong đó `fd` là bộ mô tả file cần ánh xạ, `length` là độ dài vùng ánh xạ, `offset` là độ lệch bắt đầu trong file. Sau khi gọi, bộ đệm đọc của Kernel (Page Cache) và một dải địa chỉ ảo ở User Space sẽ được ánh xạ tới cùng một vùng nhớ vật lý. Nói cách khác, bộ đệm Kernel và bộ đệm User Space cùng "chia sẻ" chung một bản sao dữ liệu, không còn phải lưu trữ tách biệt ở hai nơi nữa.

Nhờ vậy, cặp thao tác truyền thống `read + write` được thay thế bằng `mmap + write`. Ở đây cần phá bỏ một ngộ nhận kinh điển: **Bản thân lời gọi hàm `mmap` chỉ làm nhiệm vụ thiết lập mối quan hệ ánh xạ giữa file và dải địa chỉ ảo, chứ không lập tức đọc ngay dữ liệu của file vào RAM**. Thao tác đọc đĩa thực sự chỉ diễn ra sau đó, khi ứng dụng truy cập chạm vào một trang ánh xạ chưa cư trú trong RAM, kích hoạt ngoại lệ Page Fault, và Kernel lúc này mới nạp dữ liệu từ Page Cache (hoặc từ đĩa nếu cache chưa có) theo từng trang một. Quy trình diễn ra như sau:

1. Ứng dụng gọi `mmap()`, Kernel thiết lập ánh xạ từ file tới dải địa chỉ ảo, ra vào Kernel Mode mỗi chiều một lần rồi hàm trả về. Lúc này chưa có bất kỳ byte dữ liệu nào của file được bốc vào RAM.
2. Ứng dụng truy cập vào vùng ánh xạ này (điển hình là truyền con trỏ vùng nhớ này làm nguồn dữ liệu cho hàm `write`), lần đầu tiên chạm vào trang chưa cư trú sẽ kích hoạt Page Fault; nếu Page Cache chưa có trang này, bộ điều khiển DMA sẽ đọc dữ liệu từ đĩa vào Page Cache (Lần sao chép 1, DMA copy).
3. Sau khi bảng trang thiết lập xong ánh xạ, trang Page Cache này đồng thời hiển thị khả kiến trong không gian địa chỉ User Space của Process; cả hai bên dùng chung một vùng nhớ vật lý.
4. Ứng dụng gọi hàm `write`, CPU sao chép dữ liệu trực tiếp từ Page Cache sang bộ đệm gửi của Socket (Lần sao chép 2, CPU copy) — nhờ dùng chung bộ nhớ vật lý, hệ thống đã cắt bỏ được lần CPU copy thừa thãi từ "Kernel sang User" của phương pháp truyền thống.
5. DMA sao chép dữ liệu từ bộ đệm Socket ra card mạng (Lần sao chép 3, DMA copy), hàm `write` trả về.

![Đường đi sao chép dữ liệu của mmap + write: Page Cache và vùng ánh xạ mmap dùng chung bộ nhớ vật lý, sau đó sao chép sang bộ đệm Socket](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-mmap-write-211643cf.png)

Tính toán sổ cái (trường hợp cache miss, đi trọn vẹn luồng): khoảng **2 lần DMA copy + 1 lần CPU copy**; về mặt chuyển đổi chế độ có 1 lần gọi `mmap`, 1 lần gọi `write`, cộng thêm lần xử lý Page Fault ở lần truy cập đầu tiên. So với cách truyền thống, mmap đã loại bỏ được lần CPU copy từ Kernel sang User Space.

Vì thế, việc đóng đinh công thức "mmap + write luôn cố định là 4 lần chuyển đổi và 3 lần sao chép" chỉ nên coi là mô hình đơn giản hóa phục vụ giảng dạy — việc Page Cache có trúng hay không và Page Fault xảy ra vào lúc nào sẽ khiến con số thực tế có sự dao động nhất định.

`mmap` còn mang lại một lợi ích đi kèm: ứng dụng người dùng không cần phải cấp phát và duy trì một bộ đệm đọc ở User Space có nội dung trùng lặp với Page Cache nữa, tiết kiệm được vùng nhớ này. Việc tiết kiệm được bao nhiêu RAM vật lý còn tùy thuộc vào kích thước cửa sổ xử lý, kích thước bộ đệm và mô hình truy cập, không thể khẳng định một cách vơ đũa cả nắm là "tiết kiệm một nửa".

Tuy nhiên, `mmap` không phải không có cạm bẫy. Bản thân việc tạo ánh xạ cũng tốn chi phí: việc thiết lập và giải phóng bảng trang, cùng việc xử lý Page Fault đều ngốn thời gian. Với các file dung lượng rất nhỏ, chi phí phụ trội này bù trừ lại có thể còn chậm hơn việc gọi `read`/`write` tuần tự; do đó `mmap` phù hợp hơn cho các file lớn hoặc đọc ghi ngẫu nhiên lặp đi lặp lại. Ngoài ra còn một quả mìn giấu kín: Nếu file bạn đang ánh xạ bị một Process khác thực hiện cắt ngắn (truncate), khi bạn truy cập vào phần vùng nhớ thuộc đoạn file vừa bị cắt bỏ, hệ thống sẽ lập tức bắn ra tín hiệu `SIGBUS`, khiến chương trình bị sập ngay lập tức. Những lỗi dạng này rất khó truy vết trên Production, nên khi dùng `mmap` bạn bắt buộc phải có sự phòng bị kỹ lưỡng.

## Con đường thứ hai: sendfile

`mmap` đã tiết kiệm được một lần CPU copy, nhưng nó vẫn không thoát khỏi việc phải gọi hai loại system call là `mmap` và `write`. Nếu mục đích duy nhất của chúng ta chỉ là gửi nguyên vẹn file ra mạng, liệu có thể dùng duy nhất một lời gọi hệ thống để giải quyết toàn bộ việc truyền dữ liệu ngay trong lòng Kernel được không?

Nhân Linux 2.1 đã giới thiệu hàm `sendfile` để hiện thực hóa chính xác ý tưởng này:

```c
ssize_t sendfile(int out_fd, int in_fd, off_t *offset, size_t count);
```

- `in_fd`: Nguồn dữ liệu, bắt buộc phải là đối tượng hỗ trợ đọc kiểu mmap (thông thường là file thông thường), không được là socket.
- `out_fd`: Đích đến của dữ liệu, trước bản Linux 2.6.33 bắt buộc phải là socket; từ 2.6.33 trở đi có thể là bất kỳ file nào. Cần kiểm tra ràng buộc cụ thể theo phiên bản Kernel sử dụng.
- `offset`: Vị trí byte bắt đầu đọc trong file, truyền `NULL` biểu thị sử dụng con trỏ vị trí hiện tại của file.
- `count`: Số lượng byte cần truyền.

Ngữ nghĩa của nó là: truyền dữ liệu trực tiếp giữa hai file descriptor, toàn bộ tiến trình diễn ra hoàn toàn bên trong Kernel, dữ liệu tuyệt đối không đi qua User Space. Quy trình rút gọn thành:

1. Ứng dụng gọi `sendfile`, **chuyển sang Kernel Mode** (Lần chuyển đổi 1).
2. DMA sao chép dữ liệu từ đĩa vào bộ đệm đọc của Kernel / Page Cache (Lần sao chép 1, DMA copy).
3. CPU sao chép dữ liệu từ bộ đệm đọc của Kernel sang bộ đệm gửi của Socket (Lần sao chép 2, CPU copy).
4. DMA sao chép dữ liệu từ bộ đệm Socket sang card mạng (Lần sao chép 3, DMA copy), sau đó **chuyển ngược về User Mode** (Lần chuyển đổi 2), hàm `sendfile` trả về.

Tính toán sổ cái: **2 lần chuyển đổi chế độ, 3 lần sao chép dữ liệu (2 DMA copy + 1 CPU copy)**.

So với `mmap`, ưu thế cốt lõi của `sendfile` là gom toàn bộ thao tác chuyển tiếp từ file sang socket vào trong một system call duy nhất, bớt đi hẳn một vòng chuyển đổi qua lại giữa User Mode và Kernel Mode; cái giá phải trả là dữ liệu đi một mạch hoàn toàn trong Kernel, User Space không thể trực tiếp xử lý hay can thiệp vào dữ liệu này. Nếu trước khi gửi mà cần chỉnh sửa nội dung, `sendfile` hoàn toàn không phù hợp, bạn buộc phải dùng `mmap`, `read`/`write` thông thường hoặc các phương pháp khác cho phép dữ liệu bước chân vào User Space.

Tới đây, trong quy trình vẫn còn sót lại đúng một lần CPU copy (từ bộ đệm đọc Kernel sang bộ đệm Socket). Liệu chúng ta có thể tiêu diệt nốt lần CPU copy cuối cùng này không?

## Con đường thứ ba: sendfile + SG-DMA (Zero-Copy đích thực)

Nhân Linux 2.4 đã tiến hành nâng cấp lớn cho `sendfile`, chìa khóa là đưa vào hỗ trợ phần cứng **SG-DMA (Scatter-Gather DMA - DMA phân tán / tập hợp)**. Năng lực phần cứng này cho phép engine DMA của card mạng có thể bốc dữ liệu trực tiếp từ các khối bộ đệm đọc rải rác trong Kernel đưa ra mạng, mà không cần phải gom dữ liệu vào bộ đệm Socket trước nữa.

Quy trình sau khi được nâng cấp:

1. Ứng dụng gọi `sendfile`, **chuyển sang Kernel Mode** (Lần chuyển đổi 1).
2. DMA sao chép dữ liệu từ đĩa vào bộ đệm đọc của Kernel / Page Cache (Lần sao chép 1, DMA copy).
3. CPU hoàn toàn không sao chép dữ liệu payload nữa, mà chỉ ghi **thông tin mô tả** của khối dữ liệu này (địa chỉ bộ nhớ + độ dài offset) vào bộ đệm Socket.
4. Engine SG-DMA dựa vào các thông tin mô tả này, trực tiếp bốc thẳng dữ liệu từ bộ đệm đọc của Kernel đưa ra card mạng (Lần sao chép 2, DMA copy), sau đó **chuyển ngược về User Mode** (Lần chuyển đổi 2), hàm `sendfile` trả về.

![Đường đi sao chép dữ liệu của sendfile + SG-DMA: Bộ đệm Socket chỉ lưu thông tin mô tả, card mạng qua SG-DMA đọc trực tiếp từ bộ đệm Kernel](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-sendfile-sg-dma-43683cd7.png)

Tính toán sổ cái: **2 lần chuyển đổi chế độ, 2 lần sao chép dữ liệu (cả hai đều là DMA copy), và số lần CPU copy đối với payload bằng 0 tròn trĩnh**.

Đây mới thực sự là Zero-Copy danh bất hư truyền: Toàn bộ quy trình không có bất kỳ một lần nào phải cậy nhờ tới CPU vận chuyển dữ liệu payload; hành trình từ đĩa cứng ra card mạng được hoàn thành trọn vẹn 100% bởi DMA. Việc CPU ghi vài byte thông tin mô tả ở bước 3 chỉ là metadata cực nhỏ, không tính là sao chép dữ liệu. Tuy nhiên, để thực sự đi được trên con đường này cần các tiền đề ngặt nghèo: card mạng phải hỗ trợ scatter-gather, phiên bản Kernel tương thích, và ngăn xếp mạng không yêu cầu can thiệp vào payload. Một khi bật mã hóa TLS ở User Space hoặc yêu cầu chuyển đổi định dạng, Kernel bắt buộc phải đọc được payload, con đường 0 CPU copy này sẽ lập tức bế tắc.

## Con đường thứ tư: splice

`sendfile` đã rất xuất sắc, nhưng nó tồn tại một rào cản cứng: `in_fd` bắt buộc phải là đối tượng hỗ trợ đọc kiểu mmap (thông thường là file trên đĩa), không được là socket, và `out_fd` thời kỳ đầu cũng chỉ giới hạn là socket. Nếu chúng ta muốn thực hiện chuyển tiếp Zero-Copy giữa hai socket với nhau, hoặc tổng quát hơn là giữa hai file descriptor bất kỳ, thì `sendfile` đành bó tay.

Nhân Linux 2.6.17 đã đưa vào hàm `splice` (do kỹ sư Jens Axboe đóng góp, yêu cầu glibc 2.5) để lấp đầy khoảng trống này. Tư tưởng của nó là mượn đường thông qua **Đường ống (Pipe)**:

```c
ssize_t splice(int fd_in, loff_t *off_in, int fd_out, loff_t *off_out,
               size_t len, unsigned int flags);
```

`splice` yêu cầu trong hai tham số `fd_in` và `fd_out`, **bắt buộc phải có ít nhất một bên là pipe**. Vì sao nó lại phải gắn chặt với pipe? Bởi vì cấu trúc dưới đáy của pipe trong Linux thực chất là một mảng **các con trỏ trang có cơ chế đếm tham chiếu (reference-counted page pointers)**: bên trong bộ đệm pipe không lưu bản sao dữ liệu thực tế, mà chỉ lưu các con trỏ trỏ tới các trang bộ nhớ của Kernel, kèm theo số đếm tham chiếu cho từng trang. Cái gọi là "chuyển dữ liệu từ pipe sang đầu bên kia", trong phần lớn trường hợp thực chất chỉ là thao tác sao chép con trỏ và tăng biến đếm tham chiếu lên 1, chứ không hề xê dịch dữ liệu payload thực tế. Cần lưu ý rằng cờ `SPLICE_F_MOVE` chỉ là một lời gợi ý cho Kernel chứ không phải cam kết tuyệt đối — khi gặp một số hệ thống file, thiết bị hoặc cấu trúc bộ đệm không thể di dời trang trực tiếp, Kernel vẫn có thể thoái hóa về sao chép dữ liệu thực sự.

Dùng `splice` để truyền file ra socket đòi hỏi **hai bước thực hiện qua hai system call riêng biệt**:

```c
splice(file_fd, NULL, pipe_w, NULL, len, SPLICE_F_MOVE);   // File → Đầu ghi của pipe
splice(pipe_r, NULL, socket_fd, NULL, len, SPLICE_F_MOVE); // Đầu đọc của pipe → Socket
```

![Luồng chuyển tiếp dữ liệu của splice: Trang file được gắn vào bộ đệm pipe trước, rồi từ pipe chuyển tiếp sang Socket](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-splice-flow-0d597fce.png)

Lần gọi thứ nhất gắn các trang trong Page Cache vào bộ đệm pipe; lần gọi thứ hai dùng các con trỏ trang này làm các phân mảnh gói tin mạng để gửi ra socket. Dữ liệu xuyên suốt không đi vào User Space, CPU không phải vận chuyển payload. Nhưng hãy nhìn thật kỹ: Đây là **hai lần gọi `splice` riêng biệt**, ra vào Kernel Mode mỗi lần tính là hai lượt chuyển đổi, tổng cộng khoảng 4 lần chuyển đổi chế độ, chứ không phải như một số bài viết ngộ nhận là "chỉ có một system call và hai lần chuyển đổi như sendfile". Trong thực tế, cả hai fd đều phải được đặt non-blocking, kết hợp với epoll, và xử lý các trường hợp truyền thiếu byte cùng mã lỗi `EAGAIN`.

Sự khác biệt giữa `splice` và các phương án trước có thể đúc kết như sau:

- **Đa năng hơn `sendfile`**: `sendfile` tập trung chuyên sâu cho việc truyền fd-sang-fd trong Kernel (điển hình là file ra socket); còn `splice` nhờ mượn đường qua pipe nên có thể chuyển tiếp dữ liệu giữa phổ descriptor rộng hơn nhiều, bao gồm cả socket-sang-socket. Dù ở một số bản Kernel phần cài đặt bên dưới có tái sử dụng mã nguồn của nhau, nhưng đây là hai system call độc lập với tham số và lộ trình tiến hóa riêng biệt, đừng hiểu đơn giản chúng có quan hệ cha con kế thừa trực tiếp.
- **Mục đích trái ngược với `mmap`**: `mmap` ánh xạ dữ liệu vào User Space để bạn có thể đọc và sửa đổi; trong khi toàn bộ ý nghĩa tồn tại của `splice` là giữ cho dữ liệu hoàn toàn không chạm vào User Space, bạn không thể nhìn thấy và cũng không thể sửa đổi nó.

Bổ sung một chi tiết phiên bản: Ở Linux 2.6.30 trở về trước, bắt buộc phải có đúng một trong hai đầu là pipe; từ 2.6.31 trở đi, cả hai đầu vào ra đều có thể là pipe.

## So sánh đối chiếu 4 phương thức

Đặt 4 con đường lên cùng một bảng so sánh, bức tranh sẽ hiện lên rõ như ban ngày:

| Phương thức | Lần CPU copy payload | Lần DMA copy | Chuyển đổi chế độ (Mode switch) | System call điển hình |
| --- | --- | --- | --- | --- |
| **read + write truyền thống** | 2 | 2 | 4 | `read` + `write` |
| **mmap + write** | 1 | 2 | Thường $\ge 2$ sau khi ánh xạ, lần đầu thêm Page Fault | `mmap` một lần + `write` nhiều lần |
| **sendfile** | 0 hoặc 1 (tùy thuộc có SG-DMA không) | Thường là 2 | 2 | `sendfile` |
| **splice (File $\to$ Pipe $\to$ Socket)** | Thường tránh được (0) | Thường là 2 | 4 | `splice` hai lần |

![So sánh số lần sao chép và chuyển đổi chế độ giữa read/write truyền thống, mmap + write, sendfile + SG-DMA và splice](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/zero-copy-four-ways-comparison-520d4d0b.png)

*(Số lần sao chép/chuyển đổi của mmap có sự dao động theo thời điểm Page Cache hit và Page Fault; sendfile khi có card mạng hỗ trợ SG-DMA thì số lần CPU copy payload giảm về 0).*

Hai kết luận cốt lõi:

**Thứ nhất, trong mô hình file chưa hit cache truyền qua TCP của bài viết này, 2 lần DMA copy vẫn luôn tồn tại.** Chúng tương ứng với hai chặng "từ đĩa vào bộ nhớ" và "từ bộ nhớ ra card mạng". Zero-Copy chủ yếu cắt giảm lần CPU copy payload và các lần chuyển đổi chế độ; khi sang một kịch bản I/O khác, không được áp dụng máy móc con số cố định này.

**Thứ hai, việc chọn con đường nào phụ thuộc vào việc ứng dụng có cần chạm tay vào dữ liệu hay không.** Trước khi truyền nếu cần chỉnh sửa nội dung, dùng `mmap` là thuận tiện nhất; nếu chỉ truyền nguyên vẹn file ra ngoài, `sendfile` tối ưu hơn hẳn, khi card mạng có SG-DMA còn ép được CPU copy payload về 0. Vị trí của `splice` nằm ở phân khúc xa hơn: Chỉ khi có nhu cầu chuyển tiếp giữa các descriptor ngoài file-sang-socket, ví dụ socket-sang-socket, mới cần viện đến tầng pipe này, đồng thời cũng phải chấp nhận chi phí của hai lần gọi system call.

Zero-Copy cũng không phải là chiếc công tắc cứ bật lên là luôn luôn có lãi. Khi bật TLS, cần nén, hay chuyển đổi định dạng, payload sớm muộn gì cũng phải nạp vào User Space để xử lý; các tác vụ lọc nội dung, đóng dấu bản quyền, hay giới hạn băng thông cũng gặp tình huống tương tự. Khi file quá nhỏ hoặc truy cập quá ngẫu nhiên, các chi phí cố định như tạo ánh xạ, Page Fault, và quản lý pipe có thể còn lộ rõ hơn lợi ích mang lại.

Với `mmap`, bạn còn phải cẩn thận tránh lỗi `SIGBUS` khi file bị truncate; khi lượng dữ liệu gửi qua Zero-Copy quá lớn, Page Cache bị chiếm dụng ồ ạt, việc thu hồi bộ nhớ trở nên căng thẳng cũng sẽ bào mòn một phần lợi nhuận hiệu năng.

## Ứng dụng Zero-Copy trong Java như thế nào?

Trong Java NIO, hai con đường Zero-Copy mà chúng ta có thể chạm tay tới trực tiếp nhất chính là `mmap` và `sendfile`.

**MappedByteBuffer tương ứng với mmap.** Dùng lệnh `FileChannel.map` để nhận về một đối tượng `MappedByteBuffer`, file (hoặc một phần của file) sẽ được ánh xạ trực tiếp vào bộ nhớ. Các thao tác đọc ghi trên buffer này sau đó sẽ thao tác trực tiếp trên vùng nhớ ánh xạ, không còn phải sao chép dữ liệu vào bộ đệm do JVM tự quản lý như các lệnh `read`/`write` thông thường nữa:

```java
FileChannel channel = FileChannel.open(
        Paths.get("./data.bin"),
        StandardOpenOption.READ, StandardOpenOption.WRITE);
// Ánh xạ file vào bộ nhớ, tầng dưới sử dụng mmap
MappedByteBuffer buffer = channel.map(
        FileChannel.MapMode.READ_WRITE, 0, channel.size());
```

**FileChannel.transferTo / transferFrom tương ứng với nhánh sendfile.** Nhưng xin đừng đánh đồng trực tiếp API của Java với system call `sendfile`: `transferTo` chỉ cam kết việc ghi các byte dữ liệu sang Channel đích, còn tầng dưới truyền như thế nào phụ thuộc vào JDK, hệ điều hành và loại Channel đích. Khi Channel đích là một `SocketChannel` đã kết nối và nền tảng OS có hỗ trợ, JDK mới có thể đi qua nhánh truyền Zero-Copy trong Kernel; nếu đích đến là file thông thường hoặc loại Channel khác, nó có thể rẽ sang cách hiện thực khác, thậm chí thoái hóa về sao chép dữ liệu ở User Space. Vì thế đoạn code mẫu dưới đây dùng Channel đích là `SocketChannel`:

```java
FileChannel source = FileChannel.open(
        Paths.get("./in.dat"), StandardOpenOption.READ);
// socketChannel là một SocketChannel đã kết nối
// File → Socket, JDK trên các nền tảng hỗ trợ có thể sử dụng tối ưu hóa Zero-Copy (như sendfile)
source.transferTo(0, source.size(), socketChannel);
```

Ở đây có một cái bẫy rất dễ vấp: `transferTo` không cam kết sẽ truyền hết toàn bộ dữ liệu chỉ trong một lần gọi, bên gọi bắt buộc phải dựa vào giá trị trả về để lặp cho tới khi truyền hết lượng dữ liệu còn lại. Nếu tầng dưới đi qua Linux `sendfile`, giới hạn một lần gọi là `0x7ffff000` (khoảng 2 GB) byte; tuy nhiên giới hạn cụ thể lộ ra ở tầng Java cũng như việc nó có thực sự đi qua đường Zero-Copy hay không đều cần kiểm chứng theo phiên bản JDK và hệ điều hành mục tiêu (ví dụ hành vi trên Windows sẽ không hoàn toàn giống Linux).

## Kafka và RocketMQ lần lượt áp dụng phương án nào?

Zero-Copy là khái niệm thường xuyên được dùng để giải thích vì sao Kafka và RocketMQ lại có thông lượng khủng khiếp đến vậy, nhưng hai hệ thống này thực chất lại chọn hai con đường khác nhau, xuất phát từ sự khác biệt trong mô hình đọc ghi của mỗi bên.

**Phía Consumer của Kafka sử dụng Zero-Copy để gửi dữ liệu.** Khi Consumer kéo tin nhắn (pull message), Kafka cần gửi các file phân đoạn nhật ký (log segment) từ đĩa ra mạng. Đây là kịch bản điển hình của việc "chỉ chuyển tiếp nguyên vẹn, không chỉnh sửa nội dung", vì thế Kafka sử dụng `FileChannel.transferTo` để đẩy log trực tiếp từ Page Cache ra socket, dữ liệu hoàn toàn không đi qua Java Heap. Kết hợp thêm cơ chế ghi tuần tự và Page Cache ở phía Producer, thông lượng cực đại được hình thành từ đó. (Nói thêm: Các file chỉ mục index của Kafka lại sử dụng mmap.) Tuy nhiên Zero-Copy không phải lúc nào cũng có hiệu lực tuyệt đối: Một khi cần chuyển đổi định dạng tin nhắn, giải nén rồi nén lại, hoặc bật mã hóa TLS ở User Space, payload buộc phải được nạp ra bộ nhớ để xử lý, và nhánh xử lý này sẽ thoái hóa — việc có tận dụng được Zero-Copy hay không cần đánh giá kết hợp phiên bản Kafka, JDK và hệ điều hành.

**RocketMQ chủ yếu đi theo con đường mmap.** File CommitLog của RocketMQ sử dụng `MappedByteBuffer` để ánh xạ bộ nhớ phục vụ đọc ghi file, đây cũng là một trong những lý do RocketMQ thiết kế CommitLog thành các file có kích thước cố định (thường là 1 GB), vì kích thước cố định giúp việc quản lý vòng đời ánh xạ thuận tiện hơn rất nhiều. Sở dĩ RocketMQ chọn mmap thay vì sendfile là vì mô hình đọc ghi của nó đòi hỏi phải thao tác linh hoạt trực tiếp trên đoạn bộ nhớ được ánh xạ này, chứ không chỉ đơn thuần là đẩy nguyên vẹn một file ra mạng.

Tóm gọn một câu phân biệt: **Chuyển tiếp nguyên vẹn thì chọn sendfile, cần thao tác trên bộ nhớ ánh xạ thì chọn mmap**, điều này ăn khớp hoàn hảo với tiêu chí lựa chọn "có cần chạm vào dữ liệu hay không" đã nêu ở trên.

## Mở rộng: Crate zerocopy của Rust là một câu chuyện hoàn toàn khác

Khi tìm kiếm từ khóa "zerocopy", bạn rất dễ bắt gặp thư viện Rust do Google duy trì tại [google/zerocopy](https://github.com/google/zerocopy), được các kỹ sư Google bảo trì liên tục với lượt tải rất lớn và cộng đồng sôi nổi.

Thế nhưng xin lưu ý một điều quan trọng: **Crate này và khái niệm Zero-Copy trong hệ điều hành mà chúng ta vừa bàn là hai phạm trù hoàn toàn khác nhau**, tuyệt đối đừng nhầm lẫn. Zero-Copy ở cấp độ OS nói về việc cắt giảm thao tác CPU di dời dữ liệu giữa bộ đệm Kernel và User Space trong quá trình I/O; trong khi crate zerocopy của Rust giải quyết bài toán **chuyển đổi kiểu an toàn trong bộ nhớ (safe transmutation)**, giúp chuyển đổi qua lại an toàn giữa chuỗi byte thô và cấu trúc struct mà không cần sao chép bộ nhớ và cũng không cần viết khối `unsafe`. Cả hai cùng mang tên "Zero-Copy", nhưng một bên nói về system call và DMA phần cứng, còn một bên nói về bố cục bộ nhớ và an toàn kiểu ở cấp độ ngôn ngữ lập trình, đừng bao giờ nói lẫn lộn trong các buổi phỏng vấn.

## Trả lời thế nào trong buổi phỏng vấn?

Trong phỏng vấn, khi được hỏi *"Zero-Copy là gì?"*, trước hết hãy định nghĩa thật chuẩn xác chữ "Zero": Nó không có nghĩa là không có bất kỳ lần sao chép nào, 2 lần DMA copy từ đĩa vào RAM và từ RAM ra card mạng thông thường vẫn tồn tại; Zero-Copy chủ yếu cắt giảm các lần CPU trực tiếp sao chép dữ liệu payload giữa bộ đệm Kernel và bộ đệm User Space, cùng các lần chuyển đổi chế độ User/Kernel đi kèm.

Với mô hình `read + write` truyền thống, hãy trình bày rành mạch theo 4 lần sao chép: Đĩa vào bộ đệm Kernel là DMA copy, bộ đệm Kernel sang bộ đệm User Space là CPU copy, bộ đệm User Space sang bộ đệm Socket lại là CPU copy, và bộ đệm Socket ra card mạng là DMA copy. Nhấn mạnh rằng điểm lãng phí nhất là hai lần CPU copy, bởi vì ứng dụng không hề sửa đổi dữ liệu mà chỉ để dữ liệu đi một vòng vô ích qua User Space.

Thứ tự trình bày các giải pháp tiến hóa nên sắp xếp theo mạch: `mmap + write` cho phép User Space và Page Cache cùng ánh xạ chung một tập hợp trang vật lý, cắt bỏ lần CPU copy từ "Kernel sang User" (nhưng vẫn cần `write` sang bộ đệm Socket); `sendfile` gom toàn bộ việc chuyển tiếp từ file sang socket vào trong một system call duy nhất giúp dữ liệu không đi qua User Space; khi kết hợp thêm SG-DMA, bộ đệm Socket chỉ chứa metadata mô tả, payload có thể do DMA bốc thẳng từ bộ đệm Kernel ra card mạng; còn `splice` thì mượn đường qua bộ đệm pipe để truyền con trỏ trang phục vụ chuyển tiếp giữa các descriptor bất kỳ, nhưng thường tốn hai lần gọi system call.

Nếu người phỏng vấn lái câu chuyện sang Kafka và RocketMQ, câu trả lời cũng không được nhầm lẫn: Phía Consumer của Kafka gửi nguyên vẹn các file log segment cho Consumer nên cực kỳ thích hợp đi theo con đường `FileChannel.transferTo` (`sendfile`); trong khi CommitLog của RocketMQ cần thao tác linh hoạt trên vùng nhớ ánh xạ nên gắn liền với `mmap`. Cuối cùng bổ sung thêm các điều kiện biên: Khi có mã hóa TLS, nén dữ liệu, hay chuyển đổi định dạng, dữ liệu bắt buộc phải nạp vào User Space để xử lý, và các nhánh Zero-Copy sẽ thoái hóa.
