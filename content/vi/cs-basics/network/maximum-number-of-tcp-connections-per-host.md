---
title: Một Máy Chủ Chỉ Có Thể Duy Trì Tối Đa 65.535 Kết Nối TCP Thôi Sao?
description: Giải thích chi tiết một máy chủ có thể duy trì bao nhiêu kết nối TCP dưới các góc độ: bộ tứ TCP, cổng tạm thời, file descriptor, giới hạn bộ nhớ, TIME_WAIT và nghẽn mạng tại Gateway NAT.
category: Cơ sở máy tính
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: số lượng kết nối TCP,65535,bộ tứ TCP,TIME_WAIT,cổng tạm thời,file descriptor,NAT
lang: vi
sourceRef: zh-ref/cs-basics/network/maximum-number-of-tcp-connections-per-host.md
---

Một máy chủ chỉ có thể duy trì tối đa 65.535 kết nối TCP thôi sao? Xiao G xin đưa ra kết luận ngay từ đầu: **Chắc chắn là không**.

Con số `65535` bắt nguồn từ dải số hiệu cổng. Các trường Cổng nguồn và Cổng đích trong header TCP đều có độ rộng 16 bit, có thể biểu diễn các giá trị từ `0~65535`, tổng cộng có 2^16 = 65.536 giá trị khả dụng. **65.535 là số hiệu cổng lớn nhất, chứ không phải giới hạn trần của số lượng kết nối TCP.**

Số lượng kết nối TCP và số lượng cổng là hai khái niệm hoàn toàn khác biệt nhau. Để làm sáng tỏ vấn đề này, chúng ta phải bắt đầu từ việc một kết nối TCP được định danh duy nhất như thế nào.

## Kết nối TCP được phân biệt nhờ vào Bộ Tứ (4-Tuple)

Một kết nối TCP không được định danh duy nhất bởi "cổng cục bộ", mà dựa vào bộ tứ (4-tuple):

```text
IP nguồn, Cổng nguồn, IP đích, Cổng đích
```

Chỉ cần một trong bốn thành phần của bộ tứ khác nhau, Kernel hệ điều hành sẽ nhận diện chúng là các kết nối hoàn toàn độc lập và tách biệt.

Để tránh nhầm lẫn, dưới đây chúng ta thống nhất viết bộ tứ dưới **góc nhìn khi Client khởi tạo kết nối**: `(IP Client, Cổng Client, IP Server, Cổng Server)`.

Giả sử Server có địa chỉ IP là `192.168.1.100` và lắng nghe trên cổng `8080`:

![Kết nối TCP phân biệt qua bộ tứ và các giới hạn thực tế](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/maximum-number-of-tcp-connections-per-host-tcp-f-4d337232.png)

- Client A (`10.0.0.1:50000`) kết nối tới → Bộ tứ: `(10.0.0.1, 50000, 192.168.1.100, 8080)`
- Client A (`10.0.0.1:50001`) kết nối tiếp tới → Bộ tứ: `(10.0.0.1, 50001, 192.168.1.100, 8080)`
- Client B (`10.0.0.2:50000`) kết nối tới → Bộ tứ: `(10.0.0.2, 50000, 192.168.1.100, 8080)`

Cả ba kết nối này, IP và cổng của Server đều không hề thay đổi; nhưng vì IP hoặc cổng của Client khác nhau nên bộ tứ của chúng hoàn toàn khác nhau. Vì vậy, đây là ba kết nối TCP độc lập.

Có một điểm rất dễ gây nhầm lẫn: Phía Server trên cổng `8080` chỉ duy trì **duy nhất một listening socket**, nhưng mỗi lần hàm `accept()` được gọi, Kernel sẽ sinh ra một **connected socket** mới toanh được định danh bởi chính bộ tứ tương ứng. Do đó, việc nhiều kết nối cùng chia sẻ chung một cổng Server là hoàn toàn bình thường, không hề có xung đột nào xảy ra.

## Tại sao phía Server có thể vượt xa 65.535 kết nối?

Giả sử dịch vụ Web lắng nghe trên `192.168.1.100:443`. IP và cổng của Server được giữ cố định, nhưng IP và cổng của các Client kết nối tới lại liên tục biến đổi. Ví dụ `(10.0.0.1, 50001, 192.168.1.100, 443)` và `(10.0.0.2, 50001, 192.168.1.100, 443)` cùng chia sẻ cổng Server 443, nhưng vì bộ tứ khác nhau nên chúng là hai kết nối TCP riêng biệt.

Nếu thuần túy xét về mặt tổ hợp bộ tứ trên không gian IPv4, khi cố định IP và cổng Server, IP Client về mặt lý thuyết có `2^32` khả năng, còn cổng Client có `2^16` khả năng. Số lượng tổ hợp lý thuyết là một con số khổng lồ.

Giới hạn thực tế chỉ xuất hiện do tài nguyên phần cứng và cấu hình hệ điều hành mà thôi.

## Giới hạn thực sự là gì?

**1. File Descriptor (FD) và Bộ nhớ RAM.**

Trên Linux, socket cũng được quản lý như một file. Đối với tiến trình ứng dụng, mỗi kết nối đã thiết lập sau khi `accept()` sẽ tiêu tốn một socket FD; **bản thân listening socket cũng chiếm một FD**. Các kết nối chưa được `accept()` thì tạm nằm trong hàng đợi của Kernel và chưa được tính vào FD của ứng dụng.

Khi số lượng file mở vượt quá giới hạn cho phép của tiến trình, thông báo lỗi quen thuộc sẽ xuất hiện: `Too many open files`.

Với mỗi kết nối TCP, Kernel bắt buộc phải phân bổ và duy trì cấu trúc socket, TCP Control Block (TCB), bộ đệm gửi (send buffer) và bộ đệm nhận (receive buffer). Khi kết nối ở trạng thái nhàn rỗi (idle), chi phí bộ nhớ tương đối nhỏ; nhưng khi bắt đầu truyền nhận dữ liệu, các bộ đệm và object của ứng dụng sẽ tiếp tục ngốn thêm RAM.

Không nên học vẹt theo kiểu "một kết nối ngốn bao nhiêu KB bộ nhớ". Giá trị này phụ thuộc rất lớn vào phiên bản Kernel, các tùy chọn socket (`SO_RCVBUF`, `SO_SNDBUF`, autotuning) và đặc thù gửi nhận của nghiệp vụ.

**2. Hàng đợi bắt tay và tốc độ xử lý của hàm accept.**

Trên thực tế Linux duy trì hai hàng đợi kết nối:

- **Hàng đợi SYN (SYN Queue - Hàng đợi bán kết nối)**: Lưu trữ các kết nối đã nhận SYN, đã gửi SYN-ACK nhưng chưa hoàn tất ba bước bắt tay. Hàng đợi này bị giới hạn bởi `tcp_max_syn_backlog`, dung lượng thực tế còn kết hợp với `somaxconn` và backlog của hàm `listen()`.
- **Hàng đợi accept (Accept Queue - Hàng đợi toàn kết nối)**: Lưu trữ các kết nối đã hoàn tất ba bước bắt tay, đang chờ tầng ứng dụng gọi `accept()`. Giới hạn trần là `min(listen(fd, backlog), net.core.somaxconn)`.

Hai hàng đợi này chi phối **việc xếp hàng và rớt gói trong giai đoạn thiết lập kết nối**, chứ không phải là mức trần đơn thuần cho tổng số lượng kết nối đang ở trạng thái `ESTABLISHED`.

Khi hàng đợi bán kết nối bị tràn, Linux có thể kích hoạt cơ chế SYN Cookie: Server mã hóa các thông tin cần thiết vào số thứ tự của SYN-ACK, không lưu giữ trạng thái bán kết nối đầy đủ trên máy cục bộ, và chỉ tái tạo lại thông tin kết nối sau khi nhận được ACK hợp lệ cuối cùng. Cần nhớ rằng SYN Cookie là giải pháp phòng ngự chứ không phải công cụ để mở rộng dung lượng.

Khi hàng đợi toàn kết nối bị tràn, hành vi xử lý phụ thuộc vào tham số `tcp_abort_on_overflow`: với giá trị mặc định là `0`, Server sẽ drop gói ACK cuối cùng do Client gửi tới để Client truyền lại, đồng thời Server có cơ hội truyền lại SYN-ACK; nếu đặt thành `1`, Server lập tức trả về RST để ngắt kết nối thất bại nhanh chóng (fail-fast). Môi trường production thông thường giữ nguyên giá trị mặc định `0` để tránh từ chối nhầm các kết nối hợp lệ khi chịu tải đột biến. Bạn có thể kiểm tra tràn Accept Queue bằng lệnh `ss -ltn`: nếu `Recv-Q` tiệm cận `Send-Q` trong thời gian dài, chứng tỏ ứng dụng gọi `accept()` không kịp, cần rà soát xem thread pool có bị kẹt hoặc cấu hình backlog có bị quá nhỏ hay không.

**3. Năng lực của CPU, Card mạng (NIC) và xử lý nghiệp vụ.**

Các kết nối dài nhàn rỗi chủ yếu thử thách dung lượng RAM, giới hạn file descriptor, bảng kết nối của kernel và chiến lược keep-alive; trong khi đó, các kết nối đang hoạt động mạnh mẽ sẽ kéo theo áp lực về system call, mã hóa/giải mã TLS, phân tích gói tin, chuyển ngữ cảnh thread (context switch) và ngắt phần cứng của card mạng.

## Tại sao phía Client lại dễ đụng trần giới hạn cổng hơn?

![Nút thắt cổ chai giữa kết nối trực tiếp của Client và Gateway NAT](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/maximum-number-of-tcp-connections-per-host-clien-c6ab1da9.png)

Phía Server không bị giới hạn ở con số 65.535, nhưng phía Client khi liên tục kết nối tới cùng một địa chỉ đích thì dải cổng tạm thời (ephemeral port) có thể bị cạn kiệt rất nhanh.

Ví dụ Client có IP cố định là `192.168.1.10`, liên tục mở kết nối tới `10.0.0.1:443`. Lúc này IP đích, Cổng đích và IP nguồn đều bị cố định hoàn toàn, chỉ duy nhất Cổng nguồn là có thể thay đổi. Một khi toàn bộ cổng nguồn khả dụng bị dùng hết, hệ thống không thể tạo thêm bất kỳ bộ tứ mới nào nữa.

Có thể xem dải cổng tạm thời tự động cấp phát trên Linux bằng lệnh:

```bash
sysctl net.ipv4.ip_local_port_range
```

Trên macOS có thể kiểm tra như sau:

![Xem dải cổng tạm thời tự động cấp phát trên Mac](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/check-automatic-temporary-port-range-mac-5e409046.jpg)

Rất nhiều môi trường Linux để dải cổng tạm thời mặc định là `32768 60999`, tức chỉ có khoảng 28.000 cổng khả dụng; giá trị thực tế hãy xem output của `sysctl net.ipv4.ip_local_port_range`, và tuyệt đối không phải toàn bộ dải `0~65535` đều được tự động dùng làm cổng tạm thời.

Khi bạn bắt gặp lỗi `Cannot assign requested address` / `EADDRNOTAVAIL`, hàng loạt lệnh `connect()` bị thất bại và đích đến `IP:Port` rất tập trung, hãy nghi ngờ ngay việc cạn kiệt cổng tạm thời hoặc hiện tượng tích tụ `TIME_WAIT`.

## Nút thắt cổ chai ở tầng Gateway NAT cũng rất dễ bị quá tải

Có một tình huống rất hay bị bỏ qua trong thực tế: Rất nhiều máy chủ nội bộ không kết nối trực tiếp ra ngoài Internet, mà phải đi qua một Gateway NAT.

Nhiệm vụ của NAT là chuyển đổi địa chỉ IP nội bộ (private IP) thành địa chỉ IP công cộng (public IP). Ví dụ máy nội bộ `192.168.1.10:50000` khi truy cập ra ngoài, NAT có thể đổi thành `203.0.113.1:40000` và ghi lại ánh xạ này vào bảng theo dõi kết nối nội bộ. Khi gói tin phản hồi quay về, NAT dựa vào bảng này để chuyển tiếp chính xác về máy nội bộ ban đầu.

Nếu hàng loạt máy nội bộ cùng dùng chung một địa chỉ IP công cộng và cùng dồn dập truy cập vào **chính xác một địa chỉ `IP:Port` bên ngoài**, thì số lượng cổng nguồn public khả dụng trên Gateway NAT sẽ trở thành nút thắt cổ chai chí mạng. Nếu các đích đến phân tán, không gian tái sử dụng cổng sẽ rộng rãi hơn. Không đủ cổng chỉ là một phần vấn đề, bảng theo dõi kết nối (conntrack), CPU và RAM của thiết bị NAT cũng hoàn toàn có thể chạm trần trước tiên.

Vì vậy khi điều tra sự cố giới hạn kết nối, đừng chỉ nhìn chằm chằm vào Client và Server, mà phải rà soát cả thiết bị trung gian Gateway NAT trên đường truyền.

Các chỉ số cần theo dõi ở phía NAT gồm có: Tỷ lệ sử dụng bảng theo dõi kết nối NAT, tỷ lệ sử dụng cổng SNAT, số lượng kết nối từ một IP public tới một đích đến duy nhất, cũng như CPU, RAM, tỷ lệ rớt gói và tốc độ tạo mới kết nối trên thiết bị NAT. Nếu NAT thực sự là điểm nghẽn, có thể xem xét bổ sung thêm IP public, chia tải nhiều luồng egress hoặc áp dụng cơ chế tái sử dụng kết nối (connection reuse).

## Trạng thái TIME_WAIT ảnh hưởng tới số lượng kết nối như thế nào?

![Trạng thái TIME_WAIT chiếm dụng cổng cục bộ và ảnh hưởng đến số kết nối có thể tạo mới](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/how-time-wait-affects-number-of-connections-2ad37ab6.png)

Trong trường hợp điển hình, **bên chủ động đóng kết nối sẽ chuyển sang trạng thái `TIME_WAIT`** — vì nó cần nán lại chờ một khoảng thời gian sau khi gửi ACK cuối cùng nhằm xử lý việc mất gói ACK và ngăn các gói tin trôi nổi làm xáo trộn kết nối mới. (Trong kịch bản đồng thời đóng, cả hai bên đều vào TIME_WAIT, nhưng thực tế phần lớn rơi vào kịch bản chủ động/bị động).

Vấn đề là ở chỗ, `TIME_WAIT` khiến socket đó không thể được tái sử dụng tùy tiện trong suốt khoảng thời gian chờ đợi. Đối với Client liên tục tạo các kết nối ngắn tần suất cao tới cùng một đích, các cổng tạm thời khả dụng sẽ bị các socket `TIME_WAIT` chiếm dụng hàng loạt, từ đó rất nhanh chóng đụng trần số lượng cổng.

Đó là lý do vì sao trong các hệ thống chịu tải cao, người ta **luôn khuyến nghị ưu tiên sử dụng Connection Pool và HTTP Keep-Alive** để triệt tiêu việc tạo mới kết nối ngắn ngay từ gốc rễ.

Nói về tái sử dụng kết nối, rất nhiều người hay nhầm lẫn giữa TCP Keepalive và HTTP Keep-Alive, dù bản chất bài toán của chúng hoàn toàn khác nhau.

Nói ngắn gọn: HTTP Keep-Alive quản lý việc "một kết nối dùng tối đa bao lâu, phục vụ bao nhiêu request", còn TCP Keepalive quản lý việc "nếu quá lâu không có dữ liệu, hãy kiểm tra xem đối phương có bị sập nguồn biến mất hay không". Cả hai hoạt động độc lập và không thể thay thế cho nhau. Xem thêm bài viết chi tiết tại: [TCP Keepalive và HTTP Keep-Alive Có Gì Khác Nhau?](./tcp-keepalive-vs-http-keepalive.md).

Về các tham số Kernel, tuyệt đối đừng vừa thấy nhiều `TIME_WAIT` là đã vội vã chỉnh sửa.

Tham số `tcp_tw_reuse` cần phải cân nhắc kỹ lưỡng dựa trên phiên bản kernel, mô hình nghiệp vụ và bằng chứng xác thực về việc cạn kiệt cổng; không thể coi nó là phương thuốc vạn năng. Tham số `tcp_tw_recycle` thì tuyệt đối không đụng tới nữa vì nó đã bị xóa sổ từ Linux kernel 4.12.

Cũng đừng bao giờ tìm cách "dọn dẹp cưỡng bức" TIME_WAIT. Nó không phải là rác hay bộ nhớ rò rỉ, mà là một cơ chế phòng vệ cốt lõi trong giao thức TCP.

Khi thấy số lượng `TIME_WAIT` quá lớn, phản xạ đầu tiên của bạn là phải quay lại rà soát luồng nghiệp vụ: Có phải ứng dụng liên tục tạo kết nối ngắn không? Connection Pool có đang hoạt động hiệu quả không? HTTP Keep-Alive đã bật chưa? Có phải Client cứ xong một request là chủ động ngắt kết nối không?

Một lỗi kinh điển trên môi trường production là **cấu hình Connection Pool không chuẩn, dẫn đến việc đốt sạch cổng tạm thời**:

- HTTP Client không bật Keep-Alive, cũng không dùng Connection Pool, mỗi request lại mở một kết nối mới rồi đóng ngay, khiến `TIME_WAIT` chất thành núi.
- Cấu hình số kết nối tối đa hoặc số kết nối trên mỗi địa chỉ đích trong Connection Pool quá nhỏ, khiến các kết nối liên tục bị tạo mới rồi lại hủy bỏ.
- DNS phân giải tên miền về duy nhất một IP, khiến các request dồn hết vào một điểm đích duy nhất, làm cho bộ tứ chỉ còn mỗi cổng nguồn là biến đổi, rất nhanh chóng làm nghẽn toàn bộ dải cổng.

Khi xử lý các vấn đề này, hãy ưu tiên khắc phục khâu tái sử dụng kết nối trước. Sau khi đã đảm bảo Connection Pool, Keep-Alive, timeout và chiến lược đóng kết nối đều chuẩn chỉ, lúc đó mới cân nhắc mở rộng dải cổng tạm thời hoặc bổ sung thêm IP nguồn. Đừng bao giờ đụng tay vào tham số Kernel ngay từ đầu.

![Quy trình điều tra sự cố TIME_WAIT và CLOSE_WAIT](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-time-wait-close-wait-troubleshooting-flowcha-a0f5577d.png)

Khi điều tra thực tế, hãy dùng lệnh `ss -ant` để thống kê số lượng từng trạng thái TCP, lệnh `ss -ant state time-wait | awk 'NR>1 {print $5}' | sort | uniq -c | sort -nr | head` để xem TIME_WAIT đang dồn vào những IP đích nào, và lệnh `ss -ltn` để kiểm tra tình trạng Accept Queue của listening socket. Thấy TIME_WAIT tập trung vào một dịch vụ từ xa thì rà soát kết nối ngắn và Connection Pool; thấy CLOSE_WAIT tập trung ở một tiến trình cục bộ thì ưu tiên kiểm tra code ứng dụng xem đã đóng kết nối chuẩn xác hay chưa.

## Quay trở lại câu hỏi ban đầu

Một máy chủ chỉ có thể duy trì tối đa 65.535 kết nối TCP thôi sao?

Câu trả lời là: Tuyệt đối không thể hiểu máy móc như vậy.

`65535` ứng với dải số hiệu cổng, chứ không phải giới hạn trần của số lượng kết nối TCP. Kết nối TCP được phân biệt bằng bộ tứ: IP nguồn, Cổng nguồn, IP đích, Cổng đích. Phía Server khi lắng nghe trên một cổng duy nhất, miễn là IP Client hoặc Cổng Client khác nhau thì số lượng kết nối hoàn toàn có thể tiếp tục tăng lên.

Tuy nhiên, việc phân biệt được về mặt lý thuyết không đồng nghĩa với việc phần cứng của máy chủ có thể chịu tải vô hạn. Số lượng kết nối thực tế thường bị chặn lại bởi giới hạn file descriptor, dung lượng RAM, CPU, băng thông card mạng, năng lực xử lý của ứng dụng và hàng đợi bắt tay của Kernel. Phía Client nếu liên tục mở các kết nối ngắn tới cùng một đích sẽ gặp áp lực cạn kiệt cổng tạm thời và tắc nghẽn `TIME_WAIT`; nếu đi qua mạng NAT thì còn phải phụ thuộc vào sức chịu tải của thiết bị Gateway NAT.

Đúc kết lại trong một câu: **Số lượng kết nối phía Server chủ yếu phụ thuộc vào tài nguyên phần cứng của máy chủ; phía Client khi nối tới cùng một đích chủ yếu bị giới hạn bởi dải cổng tạm thời; còn khi có NAT ở giữa thì phải xem năng lực của Gateway NAT. `65535` chỉ là giới hạn của số hiệu cổng, chứ không phải giới hạn của toàn bộ các kết nối TCP.**
