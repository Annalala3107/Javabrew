---
title: Chi tiết về Giao thức NAT (Tầng mạng)
description: Phân tích cơ chế biên dịch địa chỉ và ánh xạ cổng của NAT, kết hợp giao tiếp LAN/WAN và bảng chuyển đổi NAT để làm rõ các chi tiết thực tiễn trong mạng gia đình và doanh nghiệp.
category: Kiến thức máy tính cơ bản
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: NAT,biên dịch địa chỉ,ánh xạ cổng,LAN,WAN,theo dõi kết nối,DHCP
lang: vi
sourceRef: zh-ref/cs-basics/network/nat.md
---

Rất nhiều thiết bị trong mạng gia đình, mạng nội bộ công ty đều sử dụng địa chỉ IP riêng (private IP), ví dụ như `192.168.x.x`, `10.x.x.x`. Những địa chỉ này không thể định tuyến trực tiếp trên mạng Internet công cộng, nhưng các thiết bị nội bộ vẫn có thể truy cập Internet bình thường.

Đằng sau điều này thông thường là nhờ có NAT hoạt động. NAT thực hiện chuyển đổi giữa địa chỉ mạng nội bộ và địa chỉ mạng công cộng, cho phép nhiều thiết bị nội bộ dùng chung một hoặc một số lượng nhỏ IP công cộng để giao tiếp ra bên ngoài.

Bài viết này chủ yếu giải đáp một số câu hỏi:

1. NAT chủ yếu giải quyết vấn đề gì?
2. Bảng chuyển đổi NAT (NAT Translation Table) ghi lại các ánh xạ địa chỉ và cổng giữa mạng trong và mạng ngoài như thế nào?
3. Khi máy chủ nội bộ truy cập mạng công cộng, IP nguồn và cổng nguồn sẽ có những thay đổi gì?
4. NAT mang lại những hạn chế nào, ví dụ tại sao việc từ bên ngoài chủ động truy cập vào máy chủ nội bộ lại phiền phức hơn?

## Kịch bản ứng dụng

Ngữ cảnh ứng dụng của **Giao thức NAT (Network Address Translation)** đúng như tên gọi của nó — biên dịch địa chỉ mạng, được áp dụng trong quá trình chuyển đổi địa chỉ từ mạng nội bộ sang mạng bên ngoài. Cụ thể, trong một mạng con nhỏ (mạng cục bộ, Local Area Network, LAN), các máy chủ sử dụng địa chỉ IP thuộc cùng một LAN, nhưng ra ngoài LAN đó, trên mạng diện rộng (Wide Area Network, WAN), cần một địa chỉ IP thống nhất để định danh vị trí của LAN đó trên toàn bộ Internet.

Kịch bản này thực ra không khó hiểu. Cùng với sự xuất hiện của các văn phòng nhỏ, văn phòng gia đình (Small Office, Home Office, SOHO), để quản lý các SOHO này, các mạng con đã được thiết kế ra, khiến cho số lượng máy chủ trong toàn bộ Internet trở nên cực kỳ khổng lồ. Nếu mỗi máy chủ đều sở hữu một địa chỉ IP "duy nhất tuyệt đối" thì không gian địa chỉ IPv4 có thể nhanh chóng chạm ngưỡng giới hạn ($2^{32}$). Do đó, trên thực tế, địa chỉ IP trong các mạng con SOHO là "tương đối" (địa chỉ riêng), điều này ở một mức độ nhất định đã giải tỏa áp lực phân bổ địa chỉ IPv4.

"Người đại diện" của mạng con SOHO, tức cánh cửa kết nối với thế giới bên ngoài, thường do router đảm nhận. Phía LAN của router quản lý một mạng con nhỏ, còn giao diện phía WAN của nó mới là giao diện thực sự tham gia vào Internet và sở hữu một "địa chỉ duy nhất tuyệt đối". Giao thức NAT đóng vai trò then chốt trong việc chuyển đổi địa chỉ khi các máy chủ trong LAN giao tiếp với thế giới bên ngoài LAN.

## Chi tiết kỹ thuật

![Quá trình NAT chuyển đổi địa chỉ riêng nội bộ thành địa chỉ công cộng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/nat-demo-5ee39bba.png)

Giả sử kịch bản hiện tại như hình trên. Ở giữa là một router, phía bên phải của nó tổ chức một mạng LAN với số hiệu mạng là `10.0.0/24`. Giao diện phía LAN có địa chỉ IP là `10.0.0.4`, và trong mạng con đó có ít nhất ba máy chủ là `10.0.0.1`, `10.0.0.2` và `10.0.0.3`. Phía bên trái của router kết nối với WAN, và giao diện phía WAN có địa chỉ IP là `138.76.29.7`.

Trước tiên, đối với các thông tin trên, chúng ta có một số thực tế cần làm rõ:

1. Địa chỉ mạng của mạng con phía bên phải router là `10.0.0.0/24` (tiền tố mạng 24 bit, phần host chiếm 8 bit), địa chỉ của ba máy chủ cũng như địa chỉ giao diện phía LAN của router đều do giao thức DHCP quy định. Hơn nữa, DHCP này chạy bên trong router (router tự duy trì một DHCP server nhỏ) để cung cấp dịch vụ DHCP cho mạng con nội bộ.
2. Địa chỉ giao diện phía WAN của router cũng do giao thức DHCP quy định, nhưng địa chỉ này do router nhận được từ ISP (nhà cung cấp dịch vụ mạng), tức là DHCP này thường chạy trên máy chủ DHCP thuộc khu vực của router.

Hiện tại, bên trong router còn chạy giao thức NAT để cung cấp dịch vụ biên dịch địa chỉ cho việc giao tiếp giữa LAN và WAN. Để làm được điều này, một cấu trúc rất quan trọng là **Bảng chuyển đổi NAT (NAT Translation Table)**. Để minh họa chi tiết hoạt động của NAT, giả sử có yêu cầu sau diễn ra:

1. Máy chủ `10.0.0.1` gửi một HTTP request (ví dụ yêu cầu tải trang web) tới Web server có địa chỉ IP là `128.119.40.186` (cổng 80). Lúc này, máy chủ `10.0.0.1` sẽ chỉ định ngẫu nhiên một cổng, ví dụ `3345`, làm số hiệu cổng nguồn cho request lần này, và gửi request đó tới router (địa chỉ đích sẽ là `128.119.40.186`, nhưng trước tiên sẽ đến giao diện `10.0.0.4` của router).
2. Giao diện LAN `10.0.0.4` của router nhận được request từ `10.0.0.1`. Router sẽ chỉ định một số hiệu cổng nguồn mới cho request này, ví dụ `5001`, và gửi gói tin request sang giao diện WAN `138.76.29.7`. Đồng thời, router ghi lại một bản ghi chuyển đổi trong bảng chuyển đổi NAT: **138.76.29.7:5001 <-> 10.0.0.1:3345**.
3. Gói tin request đến giao diện WAN và tiếp tục được gửi ra Internet tới máy chủ đích `128.119.40.186`.

Sau đó, phản hồi sẽ diễn ra như sau:

1. Máy chủ `128.119.40.186` nhận được request, tạo gói tin phản hồi và gửi nó về địa chỉ đích `138.76.29.7:5001`.
2. Gói tin phản hồi đến giao diện WAN của router. Router tra cứu bảng chuyển đổi NAT, thấy `138.76.29.7:5001` có bản ghi trong bảng chuyển đổi, từ đó biên dịch địa chỉ đích và cổng đích thành `10.0.0.1:3345`, rồi chuyển sang giao diện `10.0.0.4`.
3. Gói tin phản hồi sau khi biên dịch đến giao diện LAN của router, và tiếp tục được chuyển tiếp tới đích đến `10.0.0.1`.

![Giao tiếp giữa LAN và WAN cung cấp dịch vụ biên dịch địa chỉ](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/nat-demo2-d3a28ee1.png)

🐛 Đính chính (tham khảo: [issue#2009](https://github.com/Snailclimb/JavaGuide/issues/2009)): Giá trị Dest ở bước thứ 4 trong hình trên nên là `10.0.0.1:3345` thay vì ~~`138.76.29.7:5001`~~, đây là một lỗi viết nhầm trong sơ đồ gốc.

## Điểm mấu chốt

Đối với quy trình trên, có một số điểm cốt lõi cần nhấn mạnh:

1. Trường cổng có độ dài 16 bit không có nghĩa là phía sau một thiết bị NAT chỉ có thể chứa tối đa khoảng 65.500 máy chủ. Không gian cổng giới hạn số lượng ánh xạ chuyển đổi có thể duy trì đồng thời đối với một địa chỉ bên ngoài cụ thể, giao thức truyền tải, hành vi ánh xạ và vòng đời ánh xạ, chứ không phải tổng số máy chủ nội bộ. Một máy chủ có thể tạo nhiều ánh xạ, và NAT cũng có thể sử dụng nhiều địa chỉ IP công cộng.
2. Đối với server đích, nó không bao giờ biết "rốt cuộc là máy chủ nào đã gửi request cho mình", nó chỉ biết đó là request do router từ `138.76.29.7:5001` chuyển tiếp tới. Do đó, có thể nói **router đóng vai trò như một bức màn chắn giữa WAN và LAN**. Mọi gói tin do máy chủ nội bộ gửi ra bên ngoài đều mang cùng một địa chỉ IP (khác số cổng), và mọi gói tin từ bên ngoài gửi vào nội bộ cũng chỉ có một đích đến (khác số cổng); chính nhờ việc biên dịch NAT mà các gói tin bên ngoài mới được chuyển phát chính xác tới máy chủ nội bộ.
3. Việc NAT có tái sử dụng ánh xạ đã có hay không không thể chỉ nhìn vào IP nội bộ. Ánh xạ tối thiểu cần phân biệt giao thức truyền tải, IP nội bộ và cổng nội bộ; việc nó có liên quan thêm đến địa chỉ và cổng ở xa hay không phụ thuộc vào hành vi ánh xạ cụ thể của thiết bị NAT. Chỉ khi gói tin khớp với ánh xạ đã tồn tại thì NAT mới có thể tái sử dụng địa chỉ và cổng bên ngoài tương ứng.

Tóm tắt các đặc điểm của giao thức NAT:

1. Giao thức NAT thông qua việc che chắn LAN trước WAN đã giải tỏa áp lực phân bổ địa chỉ IPv4 một cách hiệu quả.
2. Việc thay đổi địa chỉ IP của máy chủ LAN không cần thông báo cho WAN.
3. Khi ISP của WAN thay đổi địa chỉ giao diện của router, không cần thông báo cho các máy chủ trong LAN.
4. NAT ẩn giấu địa chỉ và cấu trúc liên kết nội bộ; hành vi lọc của nhiều thiết bị NAT còn khiến các luồng dữ liệu từ bên ngoài khi chưa có ánh xạ sẵn khó có thể trực tiếp đến được máy chủ nội bộ. Tuy nhiên, yếu tố quyết định gói tin chiều vào nào có thể đi qua là chính sách lọc (filtering policy), chứ không phải bản thân việc biên dịch địa chỉ. NAT không thể thay thế cho tường lửa có trạng thái (stateful firewall), kiểm soát truy cập và các biện pháp bảo mật trên máy chủ.

Mặc dù vậy, giao thức NAT do tính đặc thù của mình vẫn tồn tại một số tranh luận kỹ thuật. Ví dụ, như bạn có thể đã nhận thấy, **giao thức NAT khi ở ngoài LAN dùng số cổng để định danh một máy chủ nội bộ, bởi vì địa chỉ IP của chúng đều giống nhau**. Việc sử dụng số cổng để định địa chỉ máy chủ có thể gây ra những hiểu lầm. Hơn nữa, router với tư cách là thiết bị tầng mạng nhưng lại đi sửa đổi nội dung gói tin ở tầng truyền vận (sửa đổi IP nguồn và số cổng nguồn), đây cũng là hành vi phá vỡ nguyên tắc phân tầng truyền thống. Tuy nhiên, dù vậy, giao thức NAT với tư cách là sản phẩm của kỷ nguyên IPv4 đã giải quyết rất thuận tiện một số vấn đề nan giải và vẫn tiếp tục được sử dụng rộng rãi cho đến tận ngày nay.
