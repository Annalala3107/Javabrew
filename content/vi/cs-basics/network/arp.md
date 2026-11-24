---
title: Chi tiết về Giao thức ARP (Tầng mạng)
description: Giải thích cơ chế phân giải địa chỉ và quy trình gói tin của ARP, kết hợp bảng ARP và cơ chế quảng bá/đơn vị để làm rõ các chiến lược phân giải địa chỉ mạng.
category: Kiến thức máy tính cơ bản
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: ARP,phân giải địa chỉ,IP sang MAC,truy vấn quảng bá,phản hồi đơn vị,bảng ARP,giả mạo
lang: vi
sourceRef: zh-ref/cs-basics/network/arp.md
---

Địa chỉ IP chịu trách nhiệm định địa chỉ ở tầng mạng, nhưng khi các khung dữ liệu (frame) thực sự được chuyển tiếp trong mạng cục bộ (LAN), thiết bị vẫn cần phải biết địa chỉ MAC của thiết bị chặng tiếp theo (next hop).

Giao thức ARP giải quyết chính bài toán chuyển đổi này: **khi đã biết địa chỉ IP mục tiêu, làm thế nào để tìm được địa chỉ MAC tương ứng**. Thoạt nhìn nó có vẻ đơn giản, nhưng lại đóng vai trò cầu nối gắn kết tầng mạng và tầng liên kết dữ liệu, đồng thời cũng là nền tảng để hiểu về giao tiếp trong mạng LAN, chuyển tiếp gateway và tấn công giả mạo ARP (ARP spoofing).

Bài viết này chủ yếu giải đáp một số câu hỏi:

1. ARP nằm ở vị trí nào trong chồng giao thức?
2. ARP hoàn thành việc phân giải địa chỉ thông qua cơ chế truy vấn quảng bá (broadcast query) và phản hồi đơn vị (unicast response) như thế nào?
3. Bảng ARP (ARP table) có vai trò gì, và việc bản ghi cache hết hạn sẽ dẫn đến tác động gì?
4. Các cuộc tấn công ARP phổ biến diễn ra như thế nào, và làm sao để phòng thủ?

## Địa chỉ MAC

Trước khi giới thiệu về giao thức ARP, chúng ta cần tìm hiểu về địa chỉ MAC.

Tên đầy đủ của địa chỉ MAC là **Địa chỉ điều khiển truy cập phương tiện (Media Access Control Address)**, dùng để định danh cho các giao diện tầng liên kết và truyền tải các khung dữ liệu trong mạng cục bộ. Nó thuộc về giao diện mạng (network interface) chứ không phải là thẻ căn cước vĩnh viễn của toàn bộ thiết bị; một thiết bị có thể có nhiều giao diện mạng, và mỗi giao diện có thể sử dụng một địa chỉ MAC khác nhau.

![Mặt sau của router thường ghi rõ địa chỉ MAC](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/router-back-will-indicate-mac-address-8fe99cd5.jpg)

Địa chỉ MAC còn thường được gọi là địa chỉ LAN, địa chỉ vật lý hoặc địa chỉ Ethernet. Khác với địa chỉ IP dùng cho việc định tuyến ở tầng mạng, địa chỉ MAC chủ yếu được sử dụng trong phạm vi liên kết hoặc miền quảng bá (broadcast domain) hiện tại.

> Thêm một điểm nữa cần biết là không chỉ các tài nguyên mạng mới có địa chỉ IP, mà các thiết bị mạng như router cũng có địa chỉ IP. Tuy nhiên về mặt cấu trúc, vai trò của các thiết bị mạng như router là tạo thành một mạng, và thông thường là mạng nội bộ (intranet), do đó địa chỉ IP chúng sử dụng thường là IP nội bộ. Các thiết bị nội bộ khi giao tiếp với các thiết bị bên ngoài mạng nội bộ sẽ cần dùng đến giao thức NAT.

Địa chỉ MAC phổ biến trong mạng Ethernet là EUI-48 có kích thước 6 byte (48 bit). Tổ chức IEEE sẽ phân bổ các dải địa chỉ có kích thước khác nhau như MA-L, MA-M, MA-S cho các nhà sản xuất để họ tiếp tục phân bổ các địa chỉ quản lý toàn cầu; bên cạnh đó cũng tồn tại các địa chỉ quản lý cục bộ không cần do IEEE cấp phát toàn cầu. Hệ điều hành có thể chỉnh sửa hoặc ngẫu nhiên hóa (randomize) địa chỉ MAC, vì vậy địa chỉ không đảm bảo là vĩnh viễn không thay đổi, và các mạng tách biệt nhau hoàn toàn có thể xuất hiện địa chỉ trùng nhau.

Cuối cùng, hãy ghi nhớ rằng địa chỉ MAC có một địa chỉ đặc biệt: `FF-FF-FF-FF-FF-FF` (toàn bit 1), địa chỉ này biểu thị địa chỉ quảng bá (broadcast address).

## Nguyên lý hoạt động của giao thức ARP

Giao thức ARP khi hoạt động có một tiền đề quan trọng, đó chính là **Bảng ARP (ARP Table)**.

Trong một mạng cục bộ (LAN), mỗi thiết bị mạng đều tự duy trì một bảng ARP cho riêng mình. Bảng ARP ghi lại mối quan hệ ánh xạ giữa địa chỉ IP và địa chỉ MAC của một số thiết bị mạng khác, mối quan hệ này được lưu trữ dưới dạng bộ ba `<IP, MAC, TTL>`. Trong đó, TTL là thời gian sống của mối quan hệ ánh xạ đó, giá trị điển hình là 20 phút; khi vượt quá thời gian này, mục tương ứng sẽ bị loại bỏ khỏi bảng.

Nguyên lý hoạt động của ARP sẽ được thảo luận theo hai kịch bản:

1. **Định địa chỉ MAC trong cùng một mạng cục bộ (LAN)**;
2. **Định địa chỉ thiết bị mạng từ mạng cục bộ này sang một mạng cục bộ khác**.

### Định địa chỉ MAC trong cùng một mạng cục bộ (LAN)

Giả sử hiện có kịch bản như sau: Máy chủ A có địa chỉ IP là `137.196.7.23` muốn gửi gói tin IP datagram cho máy chủ B có địa chỉ IP là `137.196.7.14` nằm trong cùng một mạng cục bộ.

> Nhấn mạnh lại một lần nữa: khi máy chủ gửi gói tin IP datagram (ở tầng mạng), nó chỉ biết địa chỉ IP đích mà không biết địa chỉ MAC đích, và giao thức ARP chính là giải pháp cho vấn đề này.

Để đạt được mục tiêu này, máy chủ A buộc phải thông qua giao thức ARP để lấy được địa chỉ MAC của máy chủ B, sau đó đóng gói gói tin IP thành khung tầng liên kết (frame) và gửi tới chặng tiếp theo. Trong mạng LAN đó, các sự kiện sau sẽ lần lượt diễn ra theo thứ tự thời gian:

1. Máy chủ A tra cứu bảng ARP của chính mình, phát hiện trong bảng ARP không có mục ánh xạ tương ứng với địa chỉ IP của máy chủ B, do đó không thể biết được địa chỉ MAC của máy chủ B.

2. Máy chủ A sẽ tạo một gói tin truy vấn ARP (ARP Query Packet) và phát quảng bá (broadcast) vào mạng cục bộ của mình.

   Gói tin truy vấn ARP và gói tin phản hồi ARP có cùng định dạng các trường, bao gồm địa chỉ giao thức (IP) và địa chỉ phần cứng (MAC) của cả bên gửi lẫn bên nhận. Khi máy chủ A gửi yêu cầu, IP bên gửi, MAC bên gửi và IP mục tiêu trong gói tin ARP đều đã biết, nhưng địa chỉ phần cứng mục tiêu thì chưa biết, thường được điền toàn số 0. Chính **khung Ethernet (Ethernet Frame)** mang gói tin ARP này mới thiết lập địa chỉ MAC đích là địa chỉ quảng bá `FF-FF-FF-FF-FF-FF`, nhờ đó tất cả các giao diện trong miền quảng bá hiện tại đều có thể nhận được yêu cầu. Đừng nhầm lẫn giữa địa chỉ MAC đích của khung Ethernet với trường địa chỉ phần cứng mục tiêu bên trong gói tin ARP.

3. Gói tin truy vấn do máy chủ A tạo ra sẽ được phát quảng bá trong mạng LAN. Về mặt lý thuyết, mỗi thiết bị đều sẽ nhận được gói tin này và kiểm tra xem địa chỉ IP nhận trong gói tin có phải là IP của mình hay không. Nếu đúng, chứng tỏ gói tin truy vấn đã đến được máy chủ B; nếu không, gói tin truy vấn này không liên quan đến thiết bị hiện tại và sẽ bị hủy bỏ (discard).

4. Sau khi máy chủ B nhận được gói tin truy vấn và xác nhận đó là câu hỏi dành cho chính mình, nó sẽ tạo một gói tin phản hồi ARP (ARP Response Packet). Đích đến của gói tin này chỉ có một — chính là máy chủ A, và gửi cho máy chủ A. Đồng thời, máy chủ B trích xuất thông tin địa chỉ IP và địa chỉ MAC từ gói tin truy vấn để tạo một bản ghi ánh xạ IP-MAC của máy chủ A trong bảng ARP của mình.

   Gói tin phản hồi ARP có cấu trúc tương tự như gói tin truy vấn ARP, chỉ khác là địa chỉ IP gửi và nhận được hoán đổi cho nhau, địa chỉ MAC gửi là của chính máy chủ B, còn địa chỉ MAC đích là của người gửi gói tin truy vấn. Điều đó có nghĩa là, gói tin phản hồi ARP chỉ có một đích đến duy nhất (đơn vị / unicast), chứ không phát quảng bá.

5. Cuối cùng, máy chủ A nhận được gói tin phản hồi từ máy chủ B, trích xuất địa chỉ IP và địa chỉ MAC trong gói tin đó, tạo thông tin ánh xạ và thêm vào bảng ARP của mình.

![Thu thập địa chỉ MAC của máy chủ đích qua ARP trong cùng mạng LAN](/media/jg/local/cs-basics/network/images/arp/arp_same_lan-db1595.png)

Trong toàn bộ quá trình này, có vài điểm cần bổ sung giải thích:

1. Khi máy chủ A muốn gửi IP datagram cho máy chủ B, nếu thông tin ánh xạ IP-MAC của máy chủ B đã tồn tại trong bảng ARP của máy chủ A thì máy chủ A không cần phát quảng bá nữa, chỉ cần lấy địa chỉ MAC ra và đóng gói frame tầng liên kết rồi gửi đi.
2. Thông tin ánh xạ trong bảng ARP có thời hạn sống nhất định, giá trị điển hình là 20 phút.
3. Sau khi máy chủ đích nhận được gói tin truy vấn từ máy chủ yêu cầu, nó sẽ lưu trước ánh xạ IP-MAC của máy chủ yêu cầu vào bảng ARP của mình, có như vậy nó mới lấy được địa chỉ MAC đích để gửi gói tin phản hồi một cách thuận lợi.

Tóm lại, giao thức ARP là một giao thức **truy vấn quảng bá, phản hồi đơn vị (broadcast query, unicast response)**.

### Định địa chỉ MAC giữa các mạng cục bộ khác nhau

Tình huống phức tạp hơn là khi máy chủ gửi A và máy chủ nhận B không nằm trong cùng một mạng con (subnet). Giả sử một kịch bản thông thường: mạng con của hai máy chủ được kết nối với nhau thông qua một router. Ở đây cần lưu ý rằng, thông thường khi chúng ta nói thiết bị mạng có một địa chỉ IP và một địa chỉ MAC, cách nói chuẩn xác hơn phải là mỗi một giao diện mạng (interface) có một IP và MAC riêng. Router với vai trò là thiết bị liên mạng sở hữu nhiều giao diện, mỗi giao diện cũng phải có địa chỉ IP và địa chỉ MAC không trùng lặp. Do đó, khi thảo luận về bảng ARP, các giao diện của router đều tự duy trì bảng ARP riêng biệt, chứ không phải một router chỉ duy trì duy nhất một bảng ARP chung.

Khung Ethernet quảng bá sẽ được nhận bởi tất cả các giao diện trong miền quảng bá hiện tại, không phụ thuộc vào việc IP mục tiêu trong gói tin ARP có cùng mạng con với bên gửi hay không; nhưng chỉ có node nào nhận thấy IP mục tiêu thuộc về mình thì mới phản hồi. Trên thực tế, trước khi gửi IP datagram, máy chủ sẽ tra cứu bảng định tuyến trước. Nếu địa chỉ đích không thuộc dải mạng kết nối trực tiếp, máy chủ sẽ không phân giải MAC của máy chủ ở xa, mà sẽ dùng ARP để phân giải địa chỉ MAC của giao diện router chặng tiếp theo (next-hop). Toàn bộ quá trình diễn ra theo trình tự thời gian như sau:

1. Máy chủ A tra cứu bảng ARP, mong muốn tìm kiếm địa chỉ MAC của giao diện router thuộc cùng mạng con với mình.

   Router mục tiêu ở đây là router có khả năng dựa vào địa chỉ IP của máy chủ đích B để phân tích ra mạng con mà B đang ở, và có thể chuyển tiếp gói tin đến mạng con của B.

2. Nếu máy chủ A không tìm thấy địa chỉ MAC của giao diện router thuộc mạng con này, nó sẽ sử dụng giao thức ARP để truy vấn địa chỉ MAC đó. Do giao diện mục tiêu nằm trong cùng một mạng con với máy chủ A, quá trình này hoàn toàn giống với quá trình định địa chỉ MAC trong cùng mạng LAN.

3. Máy chủ A lấy được địa chỉ MAC của giao diện router, trước tiên đóng gói IP datagram (trong đó IP nguồn là IP của A, IP đích là IP của B), sau đó đóng gói frame tầng liên kết (trong đó MAC nguồn là MAC của A, MAC đích là **địa chỉ MAC của giao diện router kết nối với mạng con này**). Máy chủ A sẽ gửi khung dữ liệu tầng liên kết này theo phương thức đơn vị (unicast) tới giao diện router.

4. Giao diện router nhận được khung tầng liên kết do máy chủ A gửi tới, tiến hành giải mã, dựa vào địa chỉ IP đích tra cứu bảng chuyển tiếp, và chuyển tiếp IP datagram đó sang giao diện kết nối với mạng con của máy chủ B.

   Đến đây, gói tin đã được chuyển dịch từ mạng con của máy chủ A sang mạng con của máy chủ B.

5. Giao diện router tra cứu bảng ARP của mình, mong muốn tìm kiếm địa chỉ MAC của máy chủ B.

6. Nếu giao diện router không tìm thấy địa chỉ MAC của máy chủ B, nó sẽ sử dụng giao thức ARP: phát truy vấn quảng bá, nhận phản hồi đơn vị để lấy được địa chỉ MAC của máy chủ B.

7. Giao diện router đóng gói lại IP datagram thành khung tầng liên kết mới với MAC đích là địa chỉ MAC của máy chủ B, và gửi đơn vị cho đến khi tới đích.

![Router lấy địa chỉ MAC của chặng tiếp theo qua ARP khi giao tiếp xuyên mạng LAN](/media/jg/local/cs-basics/network/images/arp/arp_different_lan-addaef.png)
