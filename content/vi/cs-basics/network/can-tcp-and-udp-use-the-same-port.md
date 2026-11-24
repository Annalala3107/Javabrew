---
title: TCP và UDP Có Thể Sử Dụng Cùng Một Cổng (Port) Không?
description: Giải thích chi tiết liệu TCP và UDP có thể sử dụng cùng một cổng hay không, cùng không gian cổng, quy tắc bind socket và các ví dụ thực tế.
category: Cơ sở máy tính
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: TCP,UDP,cổng,port,socket,bind,DNS 53,HTTP3,QUIC,UDP 443
lang: vi
sourceRef: zh-ref/cs-basics/network/can-tcp-and-udp-use-the-same-port.md
---

Trong các buổi phỏng vấn kỹ thuật, chúng ta rất hay gặp câu hỏi này: Trên cùng một máy chủ, nếu TCP đã lắng nghe cổng `8080` rồi thì UDP có thể lắng nghe cổng `8080` được nữa hay không?

Kết luận cốt lõi: **Hoàn toàn có thể. Không gian đặt tên (namespace) khi bind cổng của TCP và UDP được phân định độc lập theo từng giao thức tầng giao vận; cùng một số hiệu cổng nằm ở hai giao thức khác nhau sẽ không hề xung đột.** Một tiến trình lắng nghe `TCP/8080`, một tiến trình khác lắng nghe `UDP/8080`, Kernel hệ điều hành sẽ căn cứ vào giao thức mạng tương ứng để điều phối chính xác.

## Số hiệu cổng (Port) rốt cuộc do ai quản lý?

Cổng là mã định danh số học được tầng giao vận sử dụng để phân biệt giữa các tiến trình ứng dụng khác nhau trên cùng một máy chủ. Địa chỉ IP giúp định vị máy chủ trên mạng, còn số hiệu cổng giúp định vị ứng dụng cụ thể đang chạy trên máy chủ đó.

Trong header của cả gói tin TCP và UDP đều có các trường Cổng nguồn (Source Port) và Cổng đích (Destination Port) với độ dài 16 bit, do đó dải số hiệu cổng đều trải dài từ `0~65535`. Lưu ý rằng cổng `0` trong các API socket thường mang ngữ nghĩa đặc biệt (ví dụ yêu cầu hệ điều hành tự động cấp phát một cổng tạm thời ngẫu nhiên), nên không thích hợp dùng làm cổng lắng nghe dịch vụ thông thường.

**Cùng chung dải số học không đồng nghĩa với việc bind chung một đối tượng.** Khi đăng ký dịch vụ, lắng nghe cổng, bắt gói tin (packet capture), cấu hình tường lửa (firewall) hoặc Security Group trên đám mây, chúng ta luôn phải xem xét đồng thời cả giao thức tầng giao vận lẫn số cổng, ví dụ `TCP/53`, `UDP/53`, `TCP/443`, `UDP/443`.

`TCP/443` và `UDP/443` chỉ trùng nhau về mặt con số, còn luồng xử lý trong protocol stack của Kernel hoàn toàn tách biệt. Sau khi nhận được một gói tin IP, Kernel trước tiên sẽ đọc trường định danh giao thức trong IP header: trên IPv4 là trường Protocol, trên IPv6 là trường Next Header. Mã số giao thức của TCP là `6`, còn của UDP là `17`. Trước khi bước vào khâu điều phối cổng, Kernel đã sớm phân luồng gói tin sang TCP stack hoặc UDP stack tương ứng rồi.

![Quy trình điều phối giao thức của Kernel](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-tcp-and-udp-use-the-same-port-kernel-protoco-09d025cf.png)

Mặc dù TCP và UDP đều nằm ở tầng giao vận nhưng đặc tính của chúng rất khác nhau. Bảng dưới đây so sánh trên 8 phương diện giúp bạn có cái nhìn tổng quan:

| Đặc tính | TCP | UDP |
| --- | --- | --- |
| **Tính kết nối** | Hướng kết nối (3 bước bắt tay để mở, 4 bước bắt tay để đóng) | Không kết nối, gửi dữ liệu trực tiếp |
| **Độ tin cậy** | Tin cậy (Sequence number, ACK, truyền lại, kiểm soát luồng/tắc nghẽn) | Không tin cậy, chuyển giao nỗ lực tối đa (best-effort) |
| **Duy trì trạng thái** | Có trạng thái, duy trì state machine của kết nối | Không trạng thái, gửi xong là hết trách nhiệm |
| **Hiệu suất truyền tải** | Thấp hơn (tốn chi phí bắt tay, xác nhận, truyền lại) | Cao hơn (cấu trúc đơn giản, overhead cực nhỏ) |
| **Hình thức dữ liệu** | Hướng luồng byte, không bảo lưu ranh giới thông điệp | Hướng gói tin, tự nhiên bảo lưu ranh giới thông điệp |
| **Kích thước Header** | 20~60 byte | Cố định 8 byte |
| **Mô hình giao tiếp** | Điểm-điểm (Unicast) | Hỗ trợ cả Unicast, Multicast và Broadcast |
| **Ứng dụng phổ biến** | HTTP/HTTPS, FTP, SMTP, SSH | DNS, DHCP, SNMP, TFTP, VoIP, Live Streaming |

Chính vì TCP và UDP là hai bộ giao thức tầng giao vận hoàn toàn độc lập, nên Kernel mới có thể tách biệt chúng trước khi thực hiện bước phân phối theo cổng.

## Tại sao khi bind socket lại không bị xung đột?

Một chương trình server thông thường sẽ tạo một socket trước, sau đó thông qua hàm `bind()` để gắn kết với IP và cổng cục bộ. Một TCP socket bind vào cổng `8080`, và một UDP socket khác cũng bind vào cổng `8080` hoàn toàn có thể cùng tồn tại song song. Khi Kernel kiểm tra xung đột, nó không chỉ nhìn vào con số của cổng mà còn kiểm tra cả giao thức và địa chỉ mạng cục bộ.

Đối với TCP, một kết nối đã thiết lập thành công được định danh duy nhất bởi bộ tứ (4-tuple): IP nguồn, Cổng nguồn, IP đích, Cổng đích. Trong tường lửa, NAT, công cụ phân tích mạng và điều tra lưu lượng, người ta bổ sung thêm giao thức tầng giao vận để tạo thành bộ ngũ (5-tuple):

```text
Giao thức, IP nguồn, Cổng nguồn, IP đích, Cổng đích
```

Hai luồng truyền thông đều có thể trỏ tới cổng đích là `8080`, miễn là giao thức khác nhau thì Kernel sẽ không bao giờ coi chúng là cùng một phiên giao tiếp. UDP tuy không có cỗ máy trạng thái phức tạp như TCP, nhưng khi gửi nhận dữ liệu cũng mang đầy đủ thông tin IP nguồn, Cổng nguồn, IP đích và Cổng đích.

## Kiểm chứng thực tế đơn giản

Bạn có thể nhanh chóng thử nghiệm bằng lệnh `nc` (netcat). Lưu ý rằng cách hiện thực `nc` trên các hệ điều hành có thể khác nhau đôi chút, cú pháp của `-l`, `-u` và tham số cổng có thể có sự khác biệt. Dưới đây là cú pháp phổ biến của OpenBSD netcat; nếu gặp lỗi bạn có thể gõ `nc -h` để xem trợ giúp.

Trước hết, khởi tạo listener TCP:

```bash
nc -l 8000
```

Tiếp theo, mở một terminal khác và khởi tạo listener UDP:

```bash
nc -u -l 8000
```

Cả hai lệnh đều có thể chạy song song đồng thời. Trên Linux, bạn có thể kiểm tra:

```bash
ss -tulnp | grep 8000
```

Bạn sẽ thấy một dòng lắng nghe cho `tcp` và một dòng lắng nghe cho `udp`, cùng số hiệu cổng 8000 nhưng thuộc về hai giao thức khác nhau.

Nếu muốn tránh sự khác biệt về cú pháp của lệnh `nc`, bạn có thể kiểm chứng bằng code: trong Java, `new ServerSocket(8000)` và `new DatagramSocket(8000)` có thể được tạo cùng lúc trong một ứng dụng; trong Go, `net.Listen("tcp", ":8000")` và `net.ListenPacket("udp", ":8000")` cũng có thể cùng tồn tại. Nếu bạn thử bind tiếp một socket thứ hai cùng giao thức trên cổng đó, lập tức sẽ nhận được ngoại lệ "Address already in use".

## Khi nào thì cổng mới thực sự bị xung đột?

![Trường hợp nào cổng sẽ bị xung đột](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/when-does-tcp-conflict-occur-c7dfbac0.png)

Việc TCP và UDP không xung đột với nhau không đồng nghĩa với việc cổng có thể được bind trùng lặp một cách tùy tiện.

Xung đột cổng thường xảy ra trong **cùng một giao thức**. Chẳng hạn một tiến trình đã bind vào `0.0.0.0:8080`, tức là đã bao phủ cổng `8080` trên toàn bộ các địa chỉ IPv4 của máy chủ, một tiến trình khác nếu cố tình bind vào một IP cụ thể trên cổng `TCP/8080` thì thường sẽ bị báo lỗi xung đột; tuy nhiên hành vi thực tế còn phụ thuộc vào thứ tự bind, các tùy chọn `SO_REUSEADDR`, `SO_REUSEPORT` và cách hiện thực của hệ điều hành.

Nếu hai tiến trình bind vào hai địa chỉ IP cục bộ hoàn toàn khác nhau, thì việc cùng giao thức và cùng cổng vẫn có thể hợp lệ, ví dụ `192.168.1.10:8080` và `192.168.1.11:8080` đều chạy TCP.

Một điểm khác rất dễ bị bỏ quên: Địa chỉ wildcard của IPv6 `[::]:8080` trong một số môi trường có thể đồng thời tiếp nhận cả lưu lượng IPv6 lẫn các địa chỉ IPv4-mapped; cờ `IPV6_V6ONLY` sẽ quyết định liệu nó có xung đột với socket IPv4 hay không. Khi điều tra, bạn có thể dùng `ss -tulnp` để quan sát đồng thời cả `0.0.0.0:port` và `[::]:port`.

Các tùy chọn `SO_REUSEADDR` và `SO_REUSEPORT` cũng làm thay đổi các quy tắc bind cổng, thường được ứng dụng để khởi động lại dịch vụ nhanh chóng không gián đoạn, lắng nghe đa tiến trình (multi-process listening) hoặc cân bằng tải. Hãy ghi nhớ nguyên tắc sau:

**Việc TCP và UDP cùng lắng nghe trên một số hiệu cổng là nhờ vào sự độc lập của hai giao thức, hoàn toàn không cần tới `SO_REUSEPORT`. Các cờ `SO_REUSEADDR` / `SO_REUSEPORT` chủ yếu phục vụ việc tái sử dụng cổng/địa chỉ trong cùng một giao thức, hỗ trợ restart nhanh và chia tải đa tiến trình; việc hệ điều hành có cho phép hay không và phân luồng ra sao tùy thuộc vào từng loại OS và socket cụ thể.**

## Hai ví dụ kinh điển trong thực tế

### Tại sao DNS sử dụng đồng thời cả TCP và UDP trên cổng 53?

![Ví dụ thực tế DNS và HTTP/3 sử dụng đồng thời cổng TCP và UDP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/can-tcp-and-udp-use-the-same-port-practical-appl-ab70afb0.png)

DNS là ví dụ kinh điển nhất trong sách giáo khoa. Trong bảng phân bổ của IANA, dịch vụ `domain` được đăng ký đồng thời cho cả `TCP/53` và `UDP/53`, và trên thực tế các DNS server đều lắng nghe trên cả hai cổng này.

Các truy vấn phân giải tên miền hằng ngày thường đi qua UDP vì gói tin truy vấn và phản hồi rất nhỏ, UDP không mất thời gian bắt tay nên tốc độ rất nhanh. Tuy nhiên trong các tình huống sau, DNS sẽ chuyển sang dùng TCP: phản hồi UDP bị cắt ngắn do quá dài (cờ `TC` trong DNS header được bật lên 1, thường khi phản hồi vượt quá giới hạn độ dài của UDP), quá trình chuyển vùng dữ liệu DNS giữa các máy chủ (Zone Transfer, đòi hỏi truyền tin cậy để đảm bảo tính toàn vẹn dữ liệu), hoặc khi phản hồi bảo mật DNSSEC có dung lượng lớn. Ở đây không phải là "`UDP/53` bị chiếm thì `TCP/53` không được dùng", mà vốn dĩ DNS được thiết kế để khai thác đồng thời cả hai giao thức trên cổng 53.

### Cổng 443 của HTTPS và HTTP/3 cũng tương tự như vậy

Giao thức HTTPS truyền thống thường là HTTP/1.1 hoặc HTTP/2 chạy trên nền TLS và TCP, mặc định sử dụng `TCP/443`. Trong khi đó HTTP/3 chạy trên nền giao thức QUIC vốn được xây dựng trên UDP. Các trình duyệt hiện đại thông thường sẽ nhận biết máy chủ hỗ trợ HTTP/3 qua header `Alt-Svc` hoặc bản ghi DNS loại `HTTPS`, sau đó tiến hành dựng kết nối QUIC; cách triển khai phổ biến trong thực tế là mở đồng thời cả `TCP/443` lẫn `UDP/443`.

![Hiện thực kiến trúc giao thức HTTP/3](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-3-implementation-ab73b085.png)

Điều này hoàn toàn không xung đột với `TCP/443` cũ. Một server có thể cung cấp mượt mà cả hai dịch vụ:

```text
HTTPS (HTTP/1.1, HTTP/2) -> TCP/443
HTTP/3                   -> UDP/443
```

Nhìn từ bên ngoài đều là cổng `443`, nhưng trong protocol stack của hệ điều hành thì đó là hai con đường hoàn toàn tách biệt.

Trong môi trường production, hãy đặc biệt lưu ý: nếu cấu hình tường lửa chỉ mở `TCP/443`, HTTP/1.1 và HTTP/2 vẫn hoạt động bình thường nhưng HTTP/3 sẽ âm thầm thất bại. Hãy kiểm tra cả Security Group trên Cloud, Load Balancer, Gateway/Nginx và firewall của host để đảm bảo cả `TCP/443` và `UDP/443` đều được mở thông suốt, sau đó dùng `curl --http3` hoặc DevTools của trình duyệt để xác nhận giao thức đã thực sự chuyển sang HTTP/3 hay chưa.

## Trả lời phỏng vấn như thế nào?

TCP và UDP hoàn toàn có thể sử dụng cùng một số hiệu cổng vì chúng là hai giao thức tầng giao vận độc lập; Kernel hệ điều hành sẽ căn cứ vào số hiệu giao thức trong IP header để chuyển gói tin tới TCP stack hoặc UDP stack trước, sau đó mới dựa vào địa chỉ và cổng trong từng stack để tìm socket tương ứng, do đó `TCP/8080` và `UDP/8080` có thể cùng tồn tại hòa bình.

Xung đột cổng thực sự chỉ xảy ra khi bind trong cùng một giao thức, ví dụ hai dịch vụ TCP thông thường không thể cùng lắng nghe trên một IP và cổng cục bộ; lúc này mới cần đến các tùy chọn như `SO_REUSEADDR`, `SO_REUSEPORT`. Bạn chỉ cần nhớ hai ví dụ thực tế: DNS dùng đồng thời cả `UDP/53` và `TCP/53`; HTTP/3 chạy trên `UDP/443` hoàn toàn song hành với HTTPS truyền thống trên `TCP/443`.
