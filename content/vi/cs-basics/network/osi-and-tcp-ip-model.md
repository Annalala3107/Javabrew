---
title: Chi tiết về Mô hình 7 tầng OSI và Mô hình 4 tầng TCP/IP
description: Phân tích chi tiết mô hình phân tầng và phân chia nhiệm vụ của OSI và TCP/IP, kết hợp lịch sử và thực tiễn để so sánh sự khác biệt cùng các đánh đổi kỹ thuật giữa hai mô hình.
category: Kiến thức máy tính cơ bản
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: 7 tầng OSI,4 tầng TCP/IP,mô hình phân tầng,phân chia nhiệm vụ,chồng giao thức,so sánh
lang: vi
sourceRef: zh-ref/cs-basics/network/osi-and-tcp-ip-model.md
---

Phân tầng mạng là tấm bản đồ đầu tiên khi học về mạng máy tính. Nếu không có tấm bản đồ này, các khái niệm như HTTP, TCP, IP, Ethernet, DNS sẽ rất dễ bị rối lẫn vào nhau, không phân biệt được ai phụ thuộc vào ai, ai chịu trách nhiệm phần việc nào.

Hai mô hình phân tầng phổ biến nhất là mô hình 7 tầng OSI và mô hình 4 tầng TCP/IP. Mô hình đầu tiên phù hợp hơn để xây dựng khung khái niệm lý thuyết, trong khi mô hình sau lại bám sát vào cách triển khai thực tế của Internet.

Bài viết này chủ yếu giải đáp một số câu hỏi:

1. Mỗi tầng trong mô hình 7 tầng OSI đảm nhận nhiệm vụ gì?
2. Mô hình 4 tầng TCP/IP và mô hình 7 tầng OSI tương ứng với nhau như thế nào?
3. Tại sao mô hình OSI hoàn chỉnh về mặt lý thuyết nhưng thực tế lại không trở thành hiện thực triển khai chủ đạo của Internet?
4. Khi học một giao thức mạng cụ thể, tại sao trước tiên cần phải biết nó nằm ở tầng nào?

## Mô hình 7 tầng OSI

**Mô hình 7 tầng OSI** (Open Systems Interconnection) là một mô hình phân tầng mạng do Tổ chức Tiêu chuẩn hóa Quốc tế (ISO) đề xuất. Cấu trúc tổng thể cũng như chức năng do từng tầng cung cấp được minh họa trong hình bên dưới:

![Phân chia chức năng từng tầng trong mô hình 7 tầng OSI](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/osi-7-model-955bfdf5.png)

Mỗi tầng đều tập trung làm một nhóm nhiệm vụ nhất định, và mỗi tầng đều cần sử dụng các chức năng do tầng ngay bên dưới cung cấp. Ví dụ, tầng truyền vận cần sử dụng chức năng định tuyến và đánh địa chỉ do tầng mạng cung cấp, có như vậy tầng truyền vận mới biết cần chuyển dữ liệu đến đâu.

**Kiến trúc 7 tầng của OSI có khái niệm rõ ràng, lý thuyết rất hoàn chỉnh, nhưng nó lại quá phức tạp và thiếu tính thực tiễn, hơn nữa một số chức năng lại xuất hiện lặp đi lặp lại ở nhiều tầng.**

Hình ảnh phía trên có thể hơi trừu tượng, hãy cùng xem một hình ảnh trực quan sinh động hơn. Hình ảnh dưới đây được tìm thấy trên một trang web nước ngoài, rất xuất sắc!

![Mô hình 7 tầng OSI minh họa 2](/media/jg/ext/oss.javaguide.cn/github/javaguide/osi2-8a5da370.png)

**Mô hình 7 tầng OSI xuất sắc như vậy, tại sao lại thất bại trước mô hình 4 tầng TCP/IP?**

Quả thực, mô hình 7 tầng OSI vào thời điểm đó luôn nhận được sự hậu thuẫn mạnh mẽ từ các tập đoàn lớn và thậm chí cả chính phủ của nhiều quốc gia. Dưới bối cảnh đó, tại sao nó lại thất bại? Có thể tóm tắt qua mấy nguyên nhân chủ yếu sau:

1. Các chuyên gia của OSI thiếu kinh nghiệm thực tế kỹ thuật, họ thiếu động lực thương mại khi hoàn thiện các tiêu chuẩn OSI.
2. Việc triển khai các giao thức của OSI quá phức tạp và hiệu suất hoạt động rất thấp.
3. Chu kỳ xây dựng tiêu chuẩn của OSI quá kéo dài, khiến các thiết bị sản xuất theo tiêu chuẩn OSI không thể kịp thời thâm nhập thị trường. (Đầu những năm 1990, mặc dù toàn bộ bộ tiêu chuẩn quốc tế OSI đã được hoàn thiện, nhưng mạng Internet dựa trên TCP/IP đã sớm vận hành thành công trên phạm vi rất lớn toàn cầu).
4. Việc phân chia các tầng của OSI chưa thực sự hợp lý, một số chức năng bị lặp lại ở nhiều tầng khác nhau.

Mặc dù mô hình 7 tầng OSI thất bại trong ứng dụng thực tế, nhưng nó lại cung cấp một nền tảng lý thuyết tuyệt vời. Để hiểu rõ hơn về phân tầng mạng, việc tìm hiểu mô hình 7 tầng OSI vẫn là điều hết sức cần thiết.

Cuối cùng, xin chia sẻ thêm một hình ảnh tổng kết rất hay về mối quan hệ phân tầng của mô hình 7 tầng OSI!

![Mối quan hệ tương ứng phân tầng giữa mô hình 7 tầng OSI và mô hình 4 tầng TCP/IP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/osi-model-detail-5ca90634.png)

## Mô hình 4 tầng TCP/IP

**Mô hình 4 tầng TCP/IP** là mô hình đang được áp dụng rộng rãi hiện nay. Chúng ta có thể coi mô hình TCP/IP là phiên bản tinh gọn của mô hình 7 tầng OSI, bao gồm 4 tầng sau:

1. Tầng ứng dụng (Application Layer)
2. Tầng truyền vận (Transport Layer)
3. Tầng mạng (Network Layer / Internet Layer)
4. Tầng giao diện mạng (Network Interface Layer / Link Layer)

Cần lưu ý rằng, chúng ta không thể ánh xạ hoàn toàn khớp chuẩn xác tuyệt đối giữa mô hình 4 tầng TCP/IP và mô hình 7 tầng OSI, nhưng có thể quy đổi tương đối giữa hai bên như hình minh họa dưới đây:

![Phân chia chức năng từng tầng trong mô hình 4 tầng TCP/IP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-ip-4-model-6284e045.png)

### Tầng ứng dụng (Application layer)

**Tầng ứng dụng nằm ngay phía trên tầng truyền vận, chủ yếu cung cấp dịch vụ trao đổi thông tin giữa các ứng dụng chạy trên hai thiết bị đầu cuối. Nó định nghĩa định dạng trao đổi thông tin, và các thông điệp sẽ được bàn giao cho tầng truyền vận bên dưới để truyền đi.** Đơn vị dữ liệu trao đổi ở tầng ứng dụng được gọi là thông điệp (message).

![Quá trình phối hợp của mô hình 5 tầng trong một lần truyền dữ liệu](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-five-layer-sample-diagram-7f0fb78b.png)

Giao thức tầng ứng dụng định nghĩa các quy tắc giao tiếp mạng, và các ứng dụng mạng khác nhau sẽ cần các giao thức tầng ứng dụng khác nhau. Trên mạng Internet có rất nhiều giao thức tầng ứng dụng, ví dụ giao thức HTTP hỗ trợ ứng dụng Web, giao thức SMTP hỗ trợ thư điện tử (email), v.v.

**Các giao thức tầng ứng dụng phổ biến**:

![Các giao thức tầng ứng dụng phổ biến](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/application-layer-protocol-3c7d8468.png)

- **HTTP (Hypertext Transfer Protocol, Giao thức truyền tải siêu văn bản)**: Dựa trên giao thức TCP, là giao thức dùng để truyền tải siêu văn bản và nội dung đa phương tiện, chủ yếu được thiết kế cho việc giao tiếp giữa trình duyệt Web và máy chủ Web. Khi chúng ta dùng trình duyệt để xem trang web, các trang web được tải về thông qua các HTTP request.
- **SMTP (Simple Mail Transfer Protocol, Giao thức truyền tải thư đơn giản)**: Dựa trên giao thức TCP, là giao thức dùng để gửi thư điện tử. Lưu ý ⚠️: Giao thức SMTP chỉ chịu trách nhiệm gửi thư chứ không nhận thư. Để nhận thư từ mail server, cần sử dụng giao thức POP3 hoặc IMAP.
- **POP3 / IMAP (Giao thức nhận thư)**: Dựa trên giao thức TCP, cả hai đều là các giao thức chịu trách nhiệm nhận thư. Giao thức IMAP mới hơn POP3, mạnh mẽ hơn cả về tính năng lẫn hiệu năng. IMAP hỗ trợ tìm kiếm thư, đánh dấu cờ (flag), phân loại, lưu trữ (archive) và có thể đồng bộ trạng thái thư giữa nhiều thiết bị. Hầu hết các ứng dụng và máy chủ email hiện đại đều hỗ trợ IMAP.
- **FTP (File Transfer Protocol, Giao thức truyền tệp)**: Dựa trên giao thức TCP, là giao thức dùng để truyền tệp giữa các máy tính, giúp che giấu sự khác biệt về hệ điều hành và cách thức lưu trữ tệp. Lưu ý ⚠️: FTP là một giao thức không an toàn vì nó không mã hóa dữ liệu trong quá trình truyền tải. Khuyến nghị nên sử dụng các giao thức an toàn hơn như SFTP khi truyền tải dữ liệu nhạy cảm.
- **Telnet (Giao thức đăng nhập từ xa)**: Dựa trên giao thức TCP, dùng để đăng nhập vào các server khác thông qua một thiết bị đầu cuối (terminal). Nhược điểm lớn nhất của giao thức Telnet là toàn bộ dữ liệu (bao gồm cả username và password) đều được gửi dưới dạng văn bản thuần (plaintext), tiềm ẩn rủi ro bảo mật nghiêm trọng. Đó là lý do chính tại sao ngày nay người ta rất hiếm khi sử dụng Telnet mà thay vào đó sử dụng một giao thức truyền tải mạng rất an toàn là SSH.
- **SSH (Secure Shell Protocol, Giao thức truyền tải mạng an toàn)**: Dựa trên giao thức TCP, hiện thực hóa các tác vụ truy cập và truyền tệp an toàn thông qua cơ chế mã hóa và xác thực.
- **RTP (Real-time Transport Protocol, Giao thức truyền tải thời gian thực)**: Thường dựa trên giao thức UDP, nhưng cũng hỗ trợ TCP. Nó cung cấp chức năng truyền dữ liệu thời gian thực đầu-cuối (end-to-end), nhưng không bao gồm việc dành trước tài nguyên hay đảm bảo chất lượng truyền tải thời gian thực (các tính năng này do WebRTC hiện thực).
- **DNS (Domain Name System, Hệ thống phân giải tên miền)**: Thường dựa trên giao thức UDP (cổng 53), dùng để giải quyết bài toán ánh xạ giữa tên miền và địa chỉ IP. Khi dữ liệu phản hồi quá lớn hoặc khi thực hiện truyền vùng dữ liệu (Zone Transfer), nó sẽ chuyển sang dùng TCP.

Để tìm hiểu chi tiết về các giao thức này, xin vui lòng xem bài viết [Tổng hợp các giao thức tầng ứng dụng phổ biến](./application-layer-protocol.md).

### Tầng truyền vận (Transport layer)

**Nhiệm vụ chính của tầng truyền vận là cung cấp dịch vụ truyền dữ liệu đa năng cho quá trình giao tiếp giữa các tiến trình ứng dụng trên hai thiết bị đầu cuối.** Tiến trình ứng dụng sử dụng dịch vụ này để truyền các thông điệp tầng ứng dụng. "Đa năng" ở đây có nghĩa là nó không nhắm tới một ứng dụng mạng cụ thể nào, mà nhiều ứng dụng khác nhau đều có thể dùng chung một dịch vụ tầng truyền vận.

**Các giao thức tầng truyền vận phổ biến**:

![Các giao thức tầng truyền vận phổ biến](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/transport-layer-protocol-77ea5f52.png)

- **TCP (Transmission Control Protocol, Giao thức điều khiển truyền vận)**: Cung cấp dịch vụ truyền dữ liệu **hướng kết nối (connection-oriented)** và **đáng tin cậy (reliable)**.
- **UDP (User Datagram Protocol, Giao thức gói dữ liệu người dùng)**: Cung cấp dịch vụ truyền dữ liệu **phi kết nối (connectionless)**, **nỗ lực tối đa (best-effort)** (không đảm bảo độ tin cậy của việc truyền dữ liệu), đơn giản và hiệu quả cao.

### Tầng mạng (Network layer)

**Tầng mạng chịu trách nhiệm cung cấp dịch vụ truyền thông cho các máy chủ khác nhau trên mạng chuyển mạch gói.** Khi gửi dữ liệu, tầng mạng đóng gói các segment hoặc user datagram do tầng truyền vận tạo ra thành các gói tin (packet) để truyền đi. Trong kiến trúc TCP/IP, do tầng mạng sử dụng giao thức IP nên gói tin còn được gọi là IP datagram (gói dữ liệu IP).

⚠️ Lưu ý: **Đừng nhầm lẫn giữa "gói dữ liệu người dùng UDP (User Datagram)" của tầng truyền vận và "gói dữ liệu IP (IP Datagram)" của tầng mạng**.

**Một nhiệm vụ quan trọng khác của tầng mạng là lựa chọn tuyến đường thích hợp (routing), giúp các gói tin từ tầng truyền vận của máy nguồn có thể thông qua các router trong tầng mạng để tìm đến máy đích.**

Cần nhấn mạnh rằng, từ "mạng" trong "tầng mạng" không còn là một mạng vật lý cụ thể mà chúng ta thường nói tới, mà là tên gọi của tầng thứ ba trong mô hình kiến trúc mạng máy tính.

Internet được kết nối từ rất nhiều mạng không đồng nhất (heterogeneous networks) thông qua các router. Giao thức tầng mạng mà Internet sử dụng là giao thức liên mạng phi kết nối (Internet Protocol - IP) cùng nhiều giao thức định tuyến khác nhau, do đó tầng mạng của Internet còn được gọi là **tầng liên mạng (Internet layer)** hay **tầng IP**.

**Các giao thức tầng mạng phổ biến**:

![Các giao thức tầng mạng phổ biến](/media/jg/local/cs-basics/network/images/network-model/nerwork-layer-protocol-753345.png)

- **IP (Internet Protocol, Giao thức liên mạng)**: Là một trong những giao thức quan trọng nhất trong bộ giao thức TCP/IP. Vai trò chính của nó là định nghĩa định dạng gói tin, thực hiện định tuyến và đánh địa chỉ cho các gói tin để chúng có thể truyền qua các mạng và đến đúng đích. Hiện tại giao thức IP chủ yếu chia thành hai loại: IPv4 trước đây và IPv6 mới hơn. Cả hai giao thức này hiện đều đang được sử dụng, nhưng IPv6 đã được đề xuất để thay thế hoàn toàn IPv4.
- **ARP (Address Resolution Protocol, Giao thức phân giải địa chỉ)**: Giao thức ARP giải quyết bài toán chuyển đổi giữa địa chỉ tầng mạng (IP) và địa chỉ tầng liên kết dữ liệu (MAC). Bởi vì trong quá trình truyền tải vật lý của một IP datagram, nó luôn cần biết chặng tiếp theo (next hop - đích đến vật lý tiếp theo) sẽ đi về đâu. Địa chỉ IP là địa chỉ logic, còn địa chỉ MAC mới là địa chỉ vật lý; giao thức ARP giải quyết việc chuyển đổi từ địa chỉ IP sang địa chỉ MAC.
- **ICMP (Internet Control Message Protocol, Giao thức thông điệp điều khiển Internet)**: Một giao thức dùng để truyền thông tin trạng thái mạng và thông báo lỗi, thường được dùng để chẩn đoán mạng và khắc phục sự cố. Ví dụ, công cụ Ping sử dụng giao thức ICMP để kiểm tra khả năng kết nối mạng.
- **NAT (Network Address Translation, Giao thức biên dịch địa chỉ mạng)**: Ngữ cảnh ứng dụng của giao thức NAT đúng như tên gọi của nó — biên dịch địa chỉ mạng, được áp dụng trong quá trình chuyển đổi địa chỉ từ mạng nội bộ sang mạng bên ngoài. Cụ thể, trong một mạng con nhỏ (mạng cục bộ, LAN), các máy chủ sử dụng địa chỉ IP thuộc cùng một LAN, nhưng ra ngoài LAN đó, trên mạng diện rộng (WAN), cần một địa chỉ IP thống nhất để định danh vị trí của LAN đó trên toàn bộ Internet.
- **OSPF (Open Shortest Path First, Mở đường dẫn ngắn nhất đầu tiên)**: Một giao thức cổng nội bộ (Interior Gateway Protocol, IGP) và là một giao thức định tuyến động được sử dụng rộng rãi, dựa trên thuật toán trạng thái liên kết (link-state), xem xét các yếu tố như băng thông, độ trễ của liên kết để chọn đường đi tối ưu.
- **RIP (Routing Information Protocol, Giao thức thông tin định tuyến)**: Một giao thức cổng nội bộ (IGP), cũng là giao thức định tuyến động, dựa trên thuật toán vectơ khoảng cách (distance-vector), sử dụng số chặng (hop count) cố định làm thước đo và chọn đường có số chặng ít nhất làm đường đi tối ưu.
- **BGP (Border Gateway Protocol, Giao thức cổng biên dạng)**: Một giao thức định tuyến dùng để trao đổi thông tin về khả năng tiếp cận tầng mạng (Network Layer Reachability Information, NLRI) giữa các miền định tuyến độc lập (autonomous systems), có tính linh hoạt và khả năng mở rộng cao.

### Tầng giao diện mạng (Network interface layer)

Chúng ta có thể xem tầng giao diện mạng là sự kết hợp giữa tầng liên kết dữ liệu (Data Link layer) và tầng vật lý (Physical layer).

1. Tầng liên kết dữ liệu (Data Link layer) thường được gọi tắt là tầng liên kết (việc truyền dữ liệu giữa hai máy chủ luôn được truyền trên từng đoạn liên kết nối tiếp nhau). **Vai trò của tầng liên kết dữ liệu là đóng gói IP datagram do tầng mạng chuyển xuống thành các khung (frame), và truyền các frame trên liên kết giữa hai node liền kề. Mỗi frame bao gồm dữ liệu và các thông tin điều khiển cần thiết (như thông tin đồng bộ, thông tin địa chỉ, kiểm soát lỗi, v.v.).**
2. **Vai trò của tầng vật lý là thực hiện việc truyền tải trong suốt luồng bit giữa các node máy tính liền kề, cố gắng che giấu tối đa sự khác biệt giữa các phương tiện truyền dẫn và thiết bị vật lý cụ thể.**

Các chức năng và giao thức quan trọng của tầng giao diện mạng được minh họa như hình dưới đây:

![Các chức năng và giao thức quan trọng của tầng giao diện mạng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-interface-layer-protocol-20c88ddb.png)

### Tổng kết

Tóm tắt ngắn gọn các giao thức và kỹ thuật cốt lõi trong từng tầng:

![Tổng quan các giao thức từng tầng TCP/IP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/network-protocol-overview-09ff1718.png)

**Giao thức tầng ứng dụng**:

- HTTP (Hypertext Transfer Protocol, Giao thức truyền tải siêu văn bản)
- SMTP (Simple Mail Transfer Protocol, Giao thức gửi thư đơn giản)
- POP3 / IMAP (Giao thức nhận thư)
- FTP (File Transfer Protocol, Giao thức truyền tệp)
- Telnet (Giao thức đăng nhập từ xa)
- SSH (Secure Shell Protocol, Giao thức truyền tải mạng an toàn)
- RTP (Real-time Transport Protocol, Giao thức truyền tải thời gian thực)
- DNS (Domain Name System, Hệ thống phân giải tên miền)
- ……

**Giao thức tầng truyền vận**:

- Giao thức TCP
  - Cấu trúc segment
  - Truyền dữ liệu tin cậy
  - Điều khiển luồng (Flow Control)
  - Điều khiển tắc nghẽn (Congestion Control)
- Giao thức UDP
  - Cấu trúc datagram
  - RDT (Giao thức truyền dữ liệu tin cậy)

**Giao thức tầng mạng**:

- IP (Internet Protocol, Giao thức liên mạng)
- ARP (Address Resolution Protocol, Giao thức phân giải địa chỉ)
- Giao thức ICMP (Giao thức thông điệp điều khiển, dùng để gửi thông báo điều khiển)
- NAT (Network Address Translation, Giao thức biên dịch địa chỉ mạng)
- OSPF (Open Shortest Path First)
- RIP (Routing Information Protocol)
- BGP (Border Gateway Protocol)
- ……

**Tầng giao diện mạng**:

- Kỹ thuật phát hiện lỗi (Error Detection)
- Giao thức đa truy cập (Kỹ thuật ghép kênh / Channel Multiplexing)
- Giao thức CSMA/CD
- Giao thức MAC
- Công nghệ Ethernet
- ……

## Lý do phân tầng mạng

Ở phần cuối bài viết này, chúng ta cùng bàn về chủ đề: "Tại sao mạng máy tính lại cần phân tầng?".

Nói về phân tầng, trước hết hãy liên hệ với việc chúng ta phát triển một ứng dụng backend thông thường, chúng ta hay chia hệ thống thành 3 tầng theo nguyên tắc mỗi tầng làm một việc khác nhau (các hệ thống phức tạp sẽ có nhiều tầng hơn):

1. Repository (Thao tác cơ sở dữ liệu)
2. Service (Xử lý nghiệp vụ)
3. Controller (Tương tác dữ liệu giữa frontend và backend)

**Các hệ thống phức tạp cần phân tầng vì mỗi tầng cần tập trung vào một nhóm công việc riêng biệt. Lý do phân tầng mạng cũng hoàn toàn tương tự, mỗi tầng chỉ tập trung xử lý một nhóm nhiệm vụ.**

Quay trở lại câu hỏi: "Tại sao mạng lại cần phân tầng?". Có 3 lý do chủ yếu:

1. **Các tầng độc lập với nhau**: Các tầng hoạt động độc lập, tầng này không cần quan tâm tầng khác được hiện thực bên trong như thế nào, chỉ cần biết cách gọi các chức năng do tầng dưới cung cấp là đủ (có thể hiểu đơn giản như việc gọi interface). **Điều này hoàn toàn tương đồng với việc chúng ta phân tầng hệ thống trong lập trình.**
2. **Nâng cao tính linh hoạt tổng thể**: Mỗi tầng đều có thể sử dụng công nghệ phù hợp nhất để hiện thực, bạn chỉ cần đảm bảo chức năng cung cấp và các quy tắc của interface được mở ra không bị thay đổi. **Điều này tương ứng trực tiếp với nguyên tắc "gắn kết cao, ghép nối lỏng" (High Cohesion, Low Coupling) khi phát triển phần mềm.**
3. **Biến việc lớn thành việc nhỏ**: Phân tầng giúp phân rã bài toán mạng phức tạp thành nhiều bài toán nhỏ hơn, có ranh giới rõ ràng và đơn giản để xử lý và giải quyết. Nhờ đó, việc thiết kế, hiện thực và tiêu chuẩn hóa hệ thống mạng máy tính phức tạp trở nên dễ dàng hơn. **Điều này cũng tương tự như khi phát triển phần mềm, chúng ta thường phân rã chức năng hệ thống và chia bài toán phức tạp thành các bài toán nhỏ hơn, dễ hiểu hơn với ranh giới (mục tiêu và interface) được định nghĩa rõ ràng.**

Một câu nói cực kỳ nổi tiếng trong ngành khoa học máy tính:

> Mọi vấn đề trong khoa học máy tính đều có thể giải quyết bằng cách thêm một tầng gián tiếp ở giữa, và toàn bộ kiến trúc máy tính từ trên xuống dưới đều được thiết kế theo cấu trúc phân tầng chặt chẽ.

## Tài liệu tham khảo

- TCP/IP model vs OSI model: <https://fiberbit.com.tw/tcpip-model-vs-osi-model/>
- Data Encapsulation and the TCP/IP Protocol Stack: <https://docs.oracle.com/cd/E19683-01/806-4075/ipov-32/index.html>
