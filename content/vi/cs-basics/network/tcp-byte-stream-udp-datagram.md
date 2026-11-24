---
title: Tại Sao TCP Là Hướng Luồng Byte, Còn UDP Là Hướng Gói Tin (Datagram)? (Tầng Giao Vận)
description: Làm rõ sự khác biệt bản chất giữa luồng byte trong TCP và gói tin trong UDP, phân tích nguyên nhân và giải pháp cho hiện tượng dính gói / xé gói (framing), cùng các câu hỏi phỏng vấn phổ biến về Nagle và Delayed ACK.
category: Cơ sở máy tính
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: TCP,UDP,luồng byte,gói tin,datagram,dính gói,xé gói,ranh giới thông điệp,Nagle,Delayed ACK,TCP_NODELAY
lang: vi
sourceRef: zh-ref/cs-basics/network/tcp-byte-stream-udp-datagram.md
---

Chúng ta thường nghe nói TCP là giao thức hướng luồng byte (Byte Stream), còn UDP là giao thức hướng gói tin (Datagram). Điểm này thoạt nhìn như một câu định nghĩa lý thuyết đơn thuần, nhưng thực chất rất nhiều vấn đề về "dính gói" (packet sticking / sticky packets) hay "xé gói" (packet splitting / fragmentation) đều bắt nguồn từ chính sự khác biệt này.

Kết luận cốt lõi: **TCP chỉ đảm bảo các byte đến đích một cách tin cậy và đúng thứ tự, chứ không đảm bảo ranh giới thông điệp của tầng ứng dụng; còn UDP sẽ giữ nguyên vẹn ranh giới của từng gói tin mà tầng ứng dụng bàn giao cho nó.**

Bài viết này tập trung làm sáng tỏ các câu hỏi sau:

1. Tại sao lại nói TCP là hướng luồng byte, còn UDP là hướng gói tin?
2. Hiện tượng TCP dính gói và xé gói thực chất phát sinh như thế nào?
3. Tầng ứng dụng nên định nghĩa ranh giới thông điệp (message boundary) ra sao?
4. Tại sao thuật toán Nagle kết hợp với Delayed ACK có thể khiến việc truyền các gói tin nhỏ bị chậm?

Lấy một ví dụ đơn giản, tầng ứng dụng gửi liên tiếp hai thông điệp:

```
Thông điệp 1: hello
Thông điệp 2: world
```

Nếu dùng UDP để gửi, thông thường nó sẽ tương ứng với hai datagram UDP riêng biệt. Khi bên nhận gọi hàm `recvfrom()`, nó cũng đọc theo từng datagram: mỗi lần đọc sẽ lấy ra đúng một gói tin UDP, không bao giờ gộp hai gói tin của hai lần gửi thành một luồng duy nhất. Trong hàng đợi nhận của UDP, mỗi phần tử là một datagram hoàn chỉnh, ranh giới thông điệp được bảo toàn một cách tự nhiên.

Tuy nhiên ở đây có một chi tiết kỹ thuật: UDP bảo toàn ranh giới gói tin ở tầng giao vận (Transport Layer), nhưng không có nghĩa là nó phù hợp để gửi thông điệp lớn tùy ý. Nếu datagram quá lớn, tầng IP bên dưới vẫn sẽ thực hiện phân mảnh (IP fragmentation); nếu bộ đệm của bên nhận quá nhỏ, dữ liệu có thể bị cắt ngắn (truncation). Do đó, đặc tính "hướng gói tin" của UDP không đồng nghĩa với "muốn gửi to bao nhiêu cũng được", mà có nghĩa là nó không trừu tượng hóa dữ liệu ứng dụng thành một dòng chảy byte liên tục như TCP. RFC 768 định nghĩa UDP hoạt động ở chế độ datagram (datagram mode) và giải thích rằng nó chỉ cung cấp cơ chế giao thức tối thiểu, không đảm bảo việc phân phối tin cậy hay loại trừ trùng lặp.

Nếu dùng TCP để gửi thì không thể hiểu theo cách trên. Khi tầng ứng dụng gọi `send()` hai lần, thực chất nó chỉ ghi hai đoạn byte vào bộ đệm gửi (send buffer) của Kernel. Còn việc những byte này khi nào được phát đi, được chia thành mấy phân đoạn TCP (segment) để gửi, và bên nhận trong một lần gọi `recv()` sẽ đọc được bao nhiêu byte... hoàn toàn không do hai lệnh `send()` đó trực tiếp quyết định.

Chẳng hạn, bên nhận có thể đọc được tất cả trong một lần duy nhất (hiện tượng dính gói):

```
helloworld
```

Hoặc cũng có thể đọc thành nhiều lần rời rạc (hiện tượng xé gói):

```
hel
lowor
ld
```

Đây hoàn toàn không phải là lỗi của TCP, mà vốn dĩ đó chính là phương thức hoạt động chuẩn mực của TCP. TCP xử lý một luồng byte liên tục, nó chỉ quan tâm các byte này có đến nơi an toàn, tin cậy và đúng thứ tự hay không, chứ không bận tâm "thông điệp thứ mấy" của tầng ứng dụng bắt đầu từ đâu và kết thúc ở đâu. RFC 9293 cũng nêu rõ rằng ranh giới của TCP segment và ranh giới các lần gọi `send()` / socket write của tầng ứng dụng thường không có mối quan hệ tương ứng 1-1, và TCP không cam kết ranh giới bộ đệm đọc/ghi của ứng dụng có liên quan đến ranh giới phân đoạn mạng.

![Ranh giới thông điệp giữa TCP và UDP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-udp-message-boundary-ff2c1ad3.png)

Vì vậy, thuật ngữ "TCP dính gói / xé gói" thực chất là một hiện tượng quan sát dưới góc nhìn của tầng ứng dụng. Nói một cách chuẩn xác về mặt kỹ thuật, TCP không hề có khái niệm "gói" (packet) ở tầng ứng dụng, thứ nó vận chuyển là một luồng byte liên tục. Vấn đề cốt lõi thực sự cần giải quyết là: **Giao thức tầng ứng dụng phải tự định nghĩa ranh giới thông điệp của mình như thế nào**.

#### Tại sao lại xuất hiện hiện tượng dính gói và xé gói?

Các nguyên nhân phổ biến gồm có:

**1. TCP là giao thức luồng byte, không có ranh giới thông điệp tầng ứng dụng.**

TCP chịu trách nhiệm đưa các byte đến đích tin cậy và đúng thứ tự, nhưng nó không lưu lại thông tin siêu dữ liệu kiểu "20 byte này là thông điệp thứ nhất, còn 30 byte kia là thông điệp thứ hai".

**2. Một lần gọi `send()` không tương đương với một lần phát gói tin trên mạng.**

Lệnh `send()` thành công thông thường chỉ có nghĩa là dữ liệu đã được sao chép từ tiến trình ứng dụng vào bộ đệm gửi của Kernel. Còn việc khi nào dữ liệu thực sự được đẩy ra dây mạng, được băm thành mấy phân đoạn TCP thì còn phụ thuộc vào MSS, cửa sổ gửi (send window), cửa sổ tắc nghẽn (congestion window), thuật toán Nagle, hàng đợi card mạng (NIC queue)...

**3. Một lần gọi `recv()` cũng không tương đương với việc đọc trọn vẹn một thông điệp.**

Bên nhận chỉ đơn giản là lấy các byte đang có sẵn từ bộ đệm nhận TCP ra. Trong bộ đệm có thể đang tích tụ nhiều thông điệp, hoặc cũng có thể chỉ mới có một nửa thông điệp. Lệnh `recv()` chỉ sao chép lượng dữ liệu khả dụng hiện tại lên ứng dụng, chứ không hỗ trợ cắt gọt theo thông điệp nghiệp vụ.

**4. Các cơ chế tối ưu hóa gói tin nhỏ làm thay đổi thời điểm gửi.**

Thuật toán Nagle, Delayed ACK, cơ chế tự động gộp các thao tác ghi nhỏ trên Linux đều có thể tác động đến thời điểm phát dữ liệu nhỏ. Ví dụ Linux từ bản 3.14 có tính năng `tcp_autocorking`, Kernel sẽ cố gắng gom các lượt ghi nhỏ liên tiếp để giảm bớt số lượng gói tin; ứng dụng cũng có thể dùng `TCP_CORK` để chủ động điều khiển thời điểm "mở nút chai" phát dữ liệu.

Đây chính là lý do vì sao trong Netty, Dubbo, các framework RPC tự phát triển, Gateway IM, hay Game Server, khâu mã hóa và giải mã giao thức (codec) lại quan trọng đến vậy. Hễ tầng dưới sử dụng TCP thì tầng ứng dụng bắt buộc phải định nghĩa ranh giới thông điệp thật rõ ràng.

![Nguyên nhân xuất hiện hiện tượng dính gói / xé gói trong TCP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-sticky-split-causes-3dc840f6.png)

#### Giải quyết hiện tượng dính gói / xé gói của TCP như thế nào?

Mục tiêu cốt lõi duy nhất là: **Làm cho bên nhận biết được một thông điệp kết thúc ở đâu.**

![Tầng ứng dụng định nghĩa ranh giới thông điệp như thế nào?](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-message-boundary-solutio-86186610.png)

Trong thực tế kỹ thuật có 3 phương pháp phổ biến:

**1. Độ dài cố định (Fixed Length)**

Quy định mỗi thông điệp đều có độ dài cố định, ví dụ 64 byte. Bên nhận cứ đọc đủ 64 byte thì coi như đã nhận trọn vẹn một thông điệp.

Phương pháp này hiện thực rất đơn giản nhưng tính linh hoạt kém. Thông điệp ngắn thì phải chèn thêm byte đệm (padding) gây lãng phí băng thông; thông điệp dài thì lại phải chia nhỏ ra nhiều phần. Nó chỉ phù hợp cho những hệ thống có cấu trúc thông điệp cực kỳ bất biến, không phù hợp cho các giao thức nghiệp vụ tổng quát.

**2. Ký tự phân cách (Delimiters)**

Chèn thêm các ký tự phân cách đặc biệt vào giữa các thông điệp, ví dụ ký tự xuống dòng `\n`, `\r\n` hoặc một chuỗi dấu hiệu kết thúc tùy biến.

```
hello\n
world\n
```

Bên nhận liên tục đọc dữ liệu từ bộ đệm, hễ quét thấy ký tự phân cách là cắt ra một thông điệp hoàn chỉnh. Rất nhiều giao thức dạng văn bản (text-based protocol) sử dụng phương pháp này.

Cách này trực quan nhưng cần lưu ý hai điểm: Thứ nhất, nếu bản thân nội dung thông điệp có chứa ký tự phân cách thì bắt buộc phải có cơ chế escape (ký tự thoát); thứ hai, bản thân ký tự phân cách cũng có thể bị xé lẻ giữa hai lần đọc `recv()`, do đó bộ parser không được phép giả định một lần đọc là luôn thấy trọn vẹn ký tự phân cách.

**3. Khai báo độ dài ở Header (Length Field / Framing)**

Đây là giải pháp phổ biến và tối ưu nhất trong công nghệ phần mềm thực tế. Trong phần header cố định của gói tin, người ta đặt một trường biểu thị độ dài (length field) cho biết phần payload phía sau chiếm bao nhiêu byte.

```
| Độ dài 4 byte | Nội dung thông điệp (Payload) |
```

Bên nhận trước tiên đọc phần header có độ dài cố định, phân tích ra độ dài của payload, sau đó tiếp tục đọc chính xác số byte đó. Nếu chưa đủ số byte thì tiếp tục chờ; nếu đọc dư thì giữ phần thừa lại trong bộ đệm để làm phần đầu cho thông điệp tiếp theo.

Hầu hết các giao thức nhị phân (binary protocol) và giao thức RPC đều áp dụng giải pháp này. Trong thiết kế thực tế, protocol header không chỉ chứa độ dài mà còn có thêm magic number, số hiệu phiên bản, loại thông điệp, sequence ID, kiểu tuần tự hóa (serialization type)...

Giải pháp Header độ dài cũng có những cạm bẫy cần lưu tâm: Trường độ dài cần thống nhất về thứ tự byte (endianness - thường dùng Network Byte Order / Big-Endian); đồng thời phải thiết lập giới hạn độ dài tối đa (max payload cap) để tránh trường hợp đối phương gửi một giá trị độ dài ảo cực lớn làm tràn bộ nhớ (OOM). Khi viết bộ giải mã trên môi trường production, không được chỉ tính trường hợp thuận lợi mà phải xử lý trơn tru các tình huống: gói tin chưa tới đủ (half-packet), độ dài dị thường, kết nối bị đứt giữa chừng, hoặc các gói tin giả mạo độc hại.

#### Tại sao thuật toán Nagle và Delayed ACK lại khiến việc truyền gói tin nhỏ bị chậm?

Khi nói về dính gói, người ta rất hay hỏi liên đới tới thuật toán Nagle.

Mục tiêu của thuật toán Nagle là giảm thiểu số lượng các gói tin nhỏ trôi nổi trên mạng. Trong giai đoạn sơ khai của mạng máy tính với băng thông hạn hẹp, nếu ứng dụng cứ mỗi lần chỉ ghi 1 byte mà TCP/IP header đã tốn mấy chục byte, mạng sẽ bị quá tải bởi các gói tin tí hon (small-packet problem), hiệu suất vô cùng thấp. RFC 896 đã phân tích vấn đề này và đưa ra giải pháp: Khi trên kết nối vẫn còn dữ liệu chưa được xác nhận (unacknowledged data), các dữ liệu nhỏ mới sinh ra sẽ tạm thời được giữ lại trong bộ đệm, chờ đến khi có ACK gửi về mới được phát tiếp đi.

Delayed ACK (Xác nhận trễ) lại là cơ chế tối ưu ở phía bên nhận. Khi nhận được dữ liệu, bên nhận không nhất thiết phát ACK ngay lập tức, mà nán lại một khoảng thời gian ngắn để xem có thể gửi kèm ACK chung với dữ liệu phản hồi ngược lại hay không, hoặc gom xác nhận cho nhiều phân đoạn cùng lúc, giúp giảm bớt số lượng gói tin chỉ chứa ACK thuần túy. RFC 9293 định nghĩa chiến lược "phát ít hơn một ACK cho mỗi phân đoạn dữ liệu" này là delayed ACK.

Hai cơ chế này đứng riêng lẻ thì đều rất hợp lý, nhưng khi đặt chung vào một kịch bản giao tiếp thì có thể khuếch đại độ trễ lên rất nhiều lần. Kịch bản điển hình là:

```
Client ghi dữ liệu nhỏ A
Client ngay lập tức ghi dữ liệu nhỏ B
Client chờ Server phản hồi
```

![Tại sao Nagle + Delayed ACK có thể làm chậm gói tin nhỏ?](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-nagle-delayed-ack-latency-b4ac9d98.png)

Gói dữ liệu nhỏ A được phát đi ngay. Gói dữ liệu nhỏ B do thuật toán Nagle giữ lại nên bị giam trong bộ đệm gửi để đợi ACK của gói A. Phía Server sau khi nhận được gói A, do ứng dụng chưa có dữ liệu phản hồi ngay, cơ chế Delayed ACK lại trì hoãn việc gửi gói ACK. Thế là bên gửi thì đợi ACK, còn bên nhận thì đợi thêm dữ liệu hoặc đợi bộ đếm thời gian trễ hết hạn — kết quả là độ trễ bị đội lên thêm vài chục mili-giây một cách lãng phí.

Hiện tượng này dễ dàng bị phát hiện và gây khó chịu trong các dịch vụ RPC gói tin nhỏ, giao thức tương tác người dùng, đồng bộ vị trí trong game, hoặc terminal điều khiển từ xa.

Hướng xử lý không phải là "nhắm mắt tắt bừa Nagle". Cách làm chuẩn mực trong kỹ thuật là:

- Những dữ liệu nhỏ có thể gộp được thì hãy gom lại thành một thông điệp hoàn chỉnh ở tầng ứng dụng rồi mới gọi `write()` một lần.
- Trong mô hình request/response, tránh viết code gọi liên tiếp nhiều lệnh `write()` dữ liệu nhỏ rồi lập tức block chờ phản hồi.
- Với các kết nối nhạy cảm về độ trễ và trao đổi thông điệp nhỏ, hãy cân nhắc bật tùy chọn `TCP_NODELAY` để đẩy dữ liệu nhỏ đi ngay lập tức.
- Với kịch bản ưu tiên thông lượng (throughput) và muốn gom đủ dữ liệu mới phát, có thể cân nhắc tùy chọn `TCP_CORK` trên Linux (nhưng cần lưu ý tính không tương thích đa nền tảng).
- Trước khi chỉnh tham số, hãy luôn bắt gói tin (tcpdump/Wireshark) để kiểm chứng, không nên thấy chậm là lập tức sửa socket options một cách cảm tính.

Trong Java, hầu hết các framework mạng đều cung cấp cấu hình `TCP_NODELAY`, ví dụ `ChannelOption.TCP_NODELAY` trong Netty. Nó thực sự giúp giảm thời gian chờ đợi cho các thông điệp nhỏ, nhưng bù lại sẽ làm tăng tổng số lượng gói tin phát ra. Đối với các dịch vụ có QPS cao, việc đánh đổi (trade-off) này cần được xem xét tổng hòa giữa kích thước thông điệp, RTT, thông lượng, CPU và tải trọng gói tin của card mạng. Tài liệu Linux `tcp(7)` cũng chỉ rõ: `TCP_NODELAY` sẽ vô hiệu hóa thuật toán Nagle, còn `TCP_CORK` dùng để ngăn chặn việc gửi các frame chưa hoàn chỉnh cho đến khi ứng dụng xác nhận "đã sẵn sàng gửi".

#### Trả lời phỏng vấn như thế nào?

Có thể đúc kết câu trả lời gãy gọn như sau:

TCP là giao thức hướng luồng byte. Dữ liệu tầng ứng dụng ghi vào sẽ đi vào bộ đệm của Kernel; TCP chỉ đảm bảo các byte này tới đích một cách tin cậy và đúng thứ tự, chứ không đảm bảo một lần `send()` tương ứng với một lần `recv()`, cũng không lưu lại ranh giới thông điệp của tầng ứng dụng. Do đó bên nhận có thể đọc được nhiều thông điệp trong một lần hoặc chỉ đọc được một nửa thông điệp — đây chính là hiện tượng dính gói và xé gói.

UDP là giao thức hướng gói tin (datagram). Mỗi lần ứng dụng giao dữ liệu cho UDP sẽ được đóng gói thành một datagram UDP riêng biệt và bên nhận cũng đọc theo từng datagram, vì vậy nó tự nhiên bảo lưu ranh giới thông điệp. Đổi lại, UDP không đảm bảo dữ liệu đến đích tin cậy và không đảm bảo thứ tự.

Để giải quyết hiện tượng TCP dính gói / xé gói, bản chất là tầng ứng dụng phải tự xây dựng cơ chế phân định ranh giới thông điệp. Các giải pháp phổ biến gồm có: độ dài cố định, ký tự phân cách và header độ dài (Length Field Framing). Trong thực tế sản xuất, giải pháp header độ dài được ưa chuộng nhất vì tối ưu cho giao thức nhị phân và dữ liệu có độ dài biến thiên, tuy nhiên cần xử lý chặt chẽ các vấn đề về thứ tự byte (endianness), giới hạn dung lượng tối đa, bộ đệm lưu gói dở dang và tình huống kết nối bị đứt bất thường.
