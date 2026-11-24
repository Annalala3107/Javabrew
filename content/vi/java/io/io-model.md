---
title: "Giải thích chi tiết các mô hình Java IO"
description: "Giải thích chi tiết các mô hình Java IO: phân tích chuyên sâu 3 mô hình BIO (Blocking I/O), NIO (Non-blocking I/O), AIO (Asynchronous I/O), cơ chế I/O Multiplexing, mô hình Reactor/Proactor và phân biệt khái niệm đồng bộ/bất đồng bộ, blocking/non-blocking."
category: Java
tag:
  - Java IO
  - Java cơ bản
head:
  - - meta
    - name: keywords
      content: Mô hình Java IO,BIO,NIO,AIO,Blocking IO,Non-blocking IO,I/O Multiplexing,Reactor Pattern,Proactor Pattern
lang: vi
sourceRef: zh-ref/java/io/io-model.md
---

Phần mô hình IO thực sự khá khó hiểu vì đòi hỏi rất nhiều kiến thức tầng dưới của máy tính. Tôi đã mất khá nhiều thời gian để viết bài này với hy vọng có thể truyền đạt hết những gì mình biết! Mong rằng các bạn sẽ thu hoạch được nhiều điều bổ ích! Để viết bài này, tôi còn tra cứu lại cuốn *UNIX Network Programming*, trời ơi khó thật sự, đau lòng ghê~

_Kiến thức cá nhân còn hạn chế. Nếu bài viết có chỗ nào cần bổ sung, hoàn thiện hoặc chỉnh sửa, rất mong bạn góp ý ở phần bình luận để chúng ta cùng tiến bộ!_

## Lời mở đầu

I/O luôn là một điểm kiến thức khiến nhiều bạn cảm thấy khó hiểu. Trong bài viết này, tôi sẽ chia sẻ những gì mình hiểu về I/O, hy vọng sẽ giúp ích cho bạn.

## I/O

### I/O là gì?

I/O (**I**nput/**O**utput) tức là **Đầu vào / Đầu ra (Nhập / Xuất)**.

**Trước tiên, hãy cùng tìm hiểu I/O dưới góc độ kiến trúc máy tính.**

Theo kiến trúc Von Neumann, cấu trúc máy tính được chia thành 5 thành phần chính: Bộ số học và logic (ALU), Bộ điều khiển (Control Unit), Bộ nhớ (Memory), Thiết bị đầu vào (Input Device) và Thiết bị đầu ra (Output Device).

![Kiến trúc Von Neumann](/media/jg/ext/oss.javaguide.cn/javaguide/java/io/watermark-type_ZmFuZ3poZW5naGVpdGk-shadow_10-tex-580962d6.jpg)

Thiết bị đầu vào (ví dụ: bàn phím) và thiết bị đầu ra (ví dụ: màn hình) đều thuộc nhóm thiết bị ngoại vi. Những thiết bị như card mạng hay ổ cứng vừa có thể đóng vai trò là thiết bị đầu vào, vừa có thể là thiết bị đầu ra.

Thiết bị đầu vào đưa dữ liệu vào máy tính, còn thiết bị đầu ra tiếp nhận dữ liệu do máy tính xuất ra.

**Dưới góc nhìn kiến trúc máy tính, I/O mô tả quá trình giao tiếp giữa hệ thống máy tính và các thiết bị ngoại vi.**

**Tiếp theo, hãy cùng tìm hiểu I/O dưới góc độ của ứng dụng.**

Theo kiến thức hệ điều hành đã học ở đại học: để đảm bảo tính ổn định và bảo mật của hệ điều hành, không gian địa chỉ của một Process (tiến trình) được chia thành **Không gian người dùng (User space)** và **Không gian nhân (Kernel space)**.

Các ứng dụng thông thường mà chúng ta chạy đều hoạt động trong User space; chỉ Kernel space mới có thể thực hiện các thao tác liên quan đến tài nguyên ở cấp độ hệ thống, chẳng hạn như quản lý file, giao tiếp liên tiến trình, quản lý bộ nhớ, v.v. Nói cách khác, khi muốn thực hiện thao tác IO, chúng ta bắt buộc phải dựa vào khả năng của Kernel space.

Hơn nữa, chương trình ở User space không thể truy cập trực tiếp vào Kernel space.

Khi muốn thực thi thao tác IO, do không có quyền thực hiện các thao tác này, ứng dụng chỉ có thể phát đi system call (lời gọi hệ thống) để nhờ hệ điều hành thực hiện hộ.

Do đó, một user process muốn thực hiện thao tác IO thì bắt buộc phải truy cập gián tiếp vào Kernel space thông qua **system call**.

Trong quá trình lập trình hằng ngày, hai loại chúng ta tiếp xúc nhiều nhất là **Disk IO (đọc/ghi file)** và **Network IO (request và response mạng)**.

**Dưới góc nhìn của ứng dụng, ứng dụng của chúng ta phát đi lời gọi IO (system call) tới kernel của hệ điều hành, còn kernel của hệ điều hành sẽ chịu trách nhiệm thực thi thao tác IO cụ thể. Nói cách khác, ứng dụng của chúng ta thực chất chỉ khởi phát lời gọi thao tác IO, còn việc thực thi IO cụ thể là do kernel của hệ điều hành đảm nhận.**

Lấy thao tác đọc truyền thống làm ví dụ, sau khi ứng dụng phát đi lời gọi I/O, quá trình này thường trải qua hai bước:

1. Kernel chờ thiết bị I/O chuẩn bị sẵn sàng dữ liệu.
2. Kernel sao chép dữ liệu từ Kernel space sang User space.

### Có những mô hình IO phổ biến nào?

Trong hệ thống UNIX, có tổng cộng 5 mô hình I/O: **Blocking I/O đồng bộ**, **Non-blocking I/O đồng bộ**, **I/O Multiplexing**, **Signal-driven I/O (I/O hướng tín hiệu)** và **Asynchronous I/O (I/O bất đồng bộ)**.

Đây cũng chính là 5 mô hình IO mà chúng ta thường xuyên nhắc tới.

## 3 mô hình IO phổ biến trong Java

### BIO (Blocking I/O)

**BIO thuộc mô hình Blocking I/O đồng bộ**.

Trong mô hình Blocking I/O đồng bộ, sau khi ứng dụng phát đi lời gọi `read`, luồng sẽ bị block (chặn) liên tục cho đến khi kernel sao chép dữ liệu vào User space.

![Nguồn ảnh: Deep Dive into Tomcat & Jetty](/media/jg/ext/oss.javaguide.cn/p3-juejin/6a9e704af49b4380bb686f0c96d33b81-tplv-k3u1fbpfcp-7b382797.png)

Trong trường hợp số lượng kết nối từ client không cao thì mô hình này hoạt động ổn. Tuy nhiên, khi phải đối mặt với hàng trăm nghìn thậm chí hàng triệu kết nối, mô hình BIO truyền thống sẽ bất lực. Vì vậy, chúng ta cần một mô hình xử lý I/O hiệu quả hơn để đáp ứng mức độ đồng thời (concurrency) cao hơn.

### NIO (New I/O)

NIO trong Java được giới thiệu từ Java 1.4, tương ứng với package `java.nio`, cung cấp các lớp trừu tượng như `Channel`, `Selector`, `Buffer`. Chữ N trong NIO là viết tắt của New, và NIO cung cấp cả channel blocking và non-blocking; trong đó, kênh có thể chọn (`SelectableChannel`) có thể được cấu hình ở chế độ non-blocking. Đây là phương thức thao tác I/O hỗ trợ hướng bộ đệm (buffer-oriented) và dựa trên kênh (channel-based).

Trong Java NIO, cách lập trình mạng dựa trên `SelectableChannel` non-blocking và `Selector` tương ứng với **mô hình I/O Multiplexing**. Tuy nhiên, không thể đồng nhất toàn bộ package `java.nio` với I/O Multiplexing vì nó còn bao gồm các API về file I/O, blocking channel, v.v.

Hãy theo dõi mạch phân tích tiếp theo dưới đây, tin rằng bạn sẽ tìm thấy câu trả lời!

Trước tiên, hãy xem xét **mô hình Non-blocking I/O đồng bộ**.

![Nguồn ảnh: Deep Dive into Tomcat & Jetty](/media/jg/ext/oss.javaguide.cn/p3-juejin/bb174e22dbe04bb79fe3fc126aed0c61-tplv-k3u1fbpfcp-351b2b45.png)

Trong mô hình Non-blocking I/O đồng bộ, ứng dụng sẽ liên tục gọi `read`; trong khoảng thời gian chờ dữ liệu được sao chép từ Kernel space sang User space, Thread vẫn bị block cho đến khi kernel sao chép xong dữ liệu sang User space.

So với mô hình Blocking I/O đồng bộ, mô hình Non-blocking I/O đồng bộ thực sự đã có sự cải tiến rất lớn. Nhờ thao tác polling (thăm dò), nó tránh được việc bị block liên tục.

> Với Non-blocking I/O đồng bộ, khi phát đi một lời gọi `read` mà dữ liệu chưa sẵn sàng, ứng dụng không cần phải block để chờ mà có thể chuyển sang làm một vài tác vụ tính toán nhỏ, sau đó nhanh chóng quay lại gọi tiếp `read` — đó chính là polling. Quá trình
> polling này không diễn ra liên tục không ngừng nghỉ mà có những khoảng ngắt quãng; việc tận dụng khoảng trống đó chính là điểm giúp Non-blocking I/O đồng bộ hiệu quả hơn Blocking I/O đồng bộ.

Tuy nhiên, mô hình IO này cũng tồn tại vấn đề: **việc ứng dụng liên tục thực hiện I/O system call để polling kiểm tra xem dữ liệu đã sẵn sàng hay chưa tiêu tốn rất nhiều tài nguyên CPU.**

Lúc này, **mô hình I/O Multiplexing** xuất hiện.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/io/88ff862764024c3b8567367df11df6ab-tplv-k3u1fbpfcp-4971162d.png)

Trong mô hình I/O Multiplexing, Thread trước tiên gọi `select` để hỏi kernel xem dữ liệu đã sẵn sàng hay chưa; sau khi kernel chuẩn bị xong dữ liệu, user thread mới gọi `read`. Quá trình gọi `read` (dữ liệu từ Kernel space -> User space) vẫn là blocking.

> Hiện nay, các system call hỗ trợ I/O Multiplexing bao gồm `select`, `epoll`, v.v. System call `select` hiện được hỗ trợ trên hầu hết mọi hệ điều hành.
>
> - **Lời gọi `select`**: System call do kernel cung cấp, hỗ trợ kiểm tra trạng thái khả dụng của nhiều system call cùng một lúc. Hầu hết các hệ điều hành đều hỗ trợ.
> - **Lời gọi `epoll`**: Có từ nhân Linux 2.6, là phiên bản nâng cấp của lời gọi `select`, giúp tối ưu hóa hiệu suất thực thi IO.

**Mô hình I/O Multiplexing giúp giảm tiêu hao tài nguyên CPU thông qua việc giảm thiểu các system call vô ích.**

Trong Java NIO có một khái niệm rất quan trọng là **Selector (Bộ chọn)**, hay còn được gọi là **Multiplexer (Bộ dồn kênh)**. Thông qua nó, chỉ cần một Thread duy nhất là có thể quản lý nhiều kết nối client. Chỉ khi dữ liệu từ client đến thì mới phục vụ client đó.

![Mối quan hệ giữa Buffer, Channel và Selector](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/channel-buffer-selector-35b44f0d.png)

### AIO (Asynchronous I/O)

AIO thường chỉ API kênh bất đồng bộ (asynchronous channel) được giới thiệu cùng NIO.2 trong Java 7. Ngoài các kênh bất đồng bộ, NIO.2 còn bao gồm API hệ thống file mới.

Các thao tác trên kênh bất đồng bộ sẽ trả về ngay lập tức; bên gọi có thể lấy kết quả thông qua `Future`, hoặc truyền vào `CompletionHandler` để thực thi callback sau khi thao tác hoàn tất.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/io/3077e72a1af049559e81d18205b56fd7-tplv-k3u1fbpfcp-7d15ae54.png)

Hiện tại, AIO vẫn chưa được ứng dụng quá rộng rãi. Trước đây Netty cũng từng thử sử dụng AIO nhưng sau đó đã từ bỏ. Nguyên nhân là bởi sau khi Netty sử dụng AIO, hiệu năng trên hệ thống Linux không cải thiện được bao nhiêu.

Cuối cùng, hãy xem một hình ảnh tóm tắt ngắn gọn về BIO, NIO và AIO trong Java.

![So sánh BIO, NIO và AIO](/media/jg/ext/oss.javaguide.cn/javaguide/java/nio/bio-aio-nio-d63f4d9c.png)

## Tài liệu tham khảo

- *Deep Dive into Tomcat & Jetty*
- Cách hoàn thành một lần I/O: <https://llc687.top/126.html>
- Lập trình viên nên hiểu I/O như thế nào: [https://www.jianshu.com/p/fa7bdc4f3de7](https://www.jianshu.com/p/fa7bdc4f3de7)
- Hiểu nguyên lý tầng dưới của Java NIO trong 10 phút: <https://www.cnblogs.com/crazymakercircle/p/10225159.html>
- Bạn biết bao nhiêu về mô hình I/O | Phần lý thuyết: <https://www.cnblogs.com/sheng-jie/p/how-much-you-know-about-io-models.html>
- *UNIX Network Programming, Volume 1: The Sockets Networking API*, Mục 6.2: Mô hình I/O
