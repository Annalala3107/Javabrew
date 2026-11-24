---
title: Tổng hợp các phương thức tấn công mạng thường gặp (Bảo mật mạng)
description: Tổng hợp các phương thức tấn công TCP/IP phổ biến và tư duy phòng thủ, bao gồm DDoS, giả mạo IP/ARP, tấn công trung gian (MITM), chú trọng thực tiễn phòng ngự kỹ thuật.
category: Cơ sở máy tính
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: Tấn công mạng, DDoS, Giả mạo IP, Giả mạo ARP, Tấn công trung gian MITM, Quét cổng, Phòng thủ bảo mật
lang: vi
sourceRef: zh-ref/cs-basics/network/network-attack-means.md
---

> Bài viết này được chỉnh lý và hoàn thiện từ bài viết [Các phương thức tấn công TCP/IP thường gặp - Ghi chép Nuanlan - 2021](https://mp.weixin.qq.com/s/AZwWrOlLxRSSi-ywBgZ0fA).

Chồng giao thức TCP/IP hướng tới khả năng kết nối và liên thông mạng, nhưng nhiều cơ chế ngay từ khi thiết kế ban đầu đã chưa tính toán đến quy mô tấn công và cường độ đối kháng khốc liệt như ngày nay.

Các cuộc tấn công như giả mạo IP (IP Spoofing), SYN Flood, DDoS, giả mạo ARP (ARP Spoofing), chiếm quyền điều hướng DNS (DNS Hijacking) bề ngoài có vẻ khác nhau, nhưng về bản chất đều lợi dụng các giả định về sự tin cậy, các điểm tiêu hao tài nguyên hoặc chuỗi phân giải trong giao thức mạng.

Bài viết này chủ yếu trả lời các câu hỏi sau:

1. Các phương thức tấn công TCP/IP phổ biến lợi dụng những cơ chế nào?
2. Các cuộc tấn công như IP Spoofing, SYN Flood, DDoS diễn ra như thế nào?
3. Các cuộc tấn công mạng thường gặp gây ra những hậu quả gì?
4. Đứng trước các cuộc tấn công này, thông thường có những hướng phòng thủ cơ bản nào?

## Giả mạo IP (IP Spoofing)

### IP là gì?

Trong mạng, tất cả các thiết bị đều được cấp phát một địa chỉ. Địa chỉ này giống như địa chỉ nhà của bạn gồm "**Số nhà bao nhiêu, phòng số mấy**": số nhà được cấp cho toàn bộ mạng con (subnet), còn "số phòng" tương ứng với số cấp cho máy tính cụ thể trong mạng con đó. Đó chính là địa chỉ trong mạng. Số nhà tương ứng với số hiệu mạng (Network ID), còn "số phòng" tương ứng với số hiệu host (Host ID); tổng thể địa chỉ này chính là **địa chỉ IP**.

### Qua địa chỉ IP chúng ta biết được những gì?

Thông qua địa chỉ IP, chúng ta có thể xác định được vị trí của máy chủ đối tượng cần truy cập, từ đó gửi tin nhắn tới máy chủ. Thông thường, tin nhắn do người gửi phát đi trước tiên đi qua hub/switch của mạng con, chuyển tiếp tới router gần nhất, sau đó căn cứ vào bảng định tuyến để tìm tới vị trí router tiếp theo cho đến khi tới đích.

**Định dạng tiêu đề IP (IP Header)**:

![Định dạng các trường trong tiêu đề gói tin IP](/media/jg/ext/oss.javaguide.cn/p3-juejin/843fd07074874ee0b695eca659411b42-tplv-k3u1fbpfcp-f6cb91e7.png)

### Kỹ thuật giả mạo IP là gì?

Bản chất là lừa dối, mạo danh!

Kỹ thuật giả mạo IP (IP Spoofing) là kỹ thuật làm giả địa chỉ IP của một máy chủ nào đó. Bằng việc ngụy trang địa chỉ IP, một máy chủ có thể mạo danh một máy chủ khác — cỗ máy vốn sở hữu quyền hạn đặc biệt nào đó hoặc được các máy chủ khác tin cậy.

Giả sử người dùng hợp lệ **(1.1.1.1)** đã thiết lập kết nối TCP với máy chủ. Kẻ tấn công có thể thử tạo một gói tin RST giả mạo với IP nguồn là **1.1.1.1** nhằm làm gián đoạn kết nối này. Tuy nhiên, chỉ giả mạo IP nguồn thôi là chưa đủ: gói tin còn phải khớp với bộ tứ (4-tuple) của kết nối và vượt qua bước kiểm tra số thứ tự (Sequence Number) của gói RST từ phía nhận. Kẻ tấn công nằm trên đường truyền (on-path) có thể quan sát số thứ tự của kết nối; kẻ tấn công ngoài đường truyền (off-path) không thể nhìn thấy lưu lượng thì buộc phải đoán số thứ tự hợp lệ, và các triển khai TCP hiện đại còn có thể sử dụng Challenge ACK để giảm thiểu tấn công Blind RST.

Nếu gói RST giả mạo vượt qua kiểm tra, máy chủ sẽ đóng kết nối tương ứng; dữ liệu do người dùng hợp lệ gửi đi sau đó không thể tiếp tục sử dụng kết nối này nữa mà buộc phải thiết lập lại từ đầu. Do kẻ tấn công còn cần phải nắm được hoặc đoán trúng các tham số kết nối, nên loại tấn công này không phải cứ làm giả hàng loạt IP nguồn rồi gửi bừa gói RST là thành công.

![Kẻ tấn công giả mạo IP nguồn gửi đoạn RST để ngắt kết nối hợp lệ](/media/jg/ext/oss.javaguide.cn/p3-juejin/7547a145adf9404aa3a05f01f5ca2e32-tplv-k3u1fbpfcp-d4b2a905.png)

### Làm thế nào để giảm thiểu giả mạo IP?

Mặc dù không thể ngăn chặn hoàn toàn việc ai đó giả mạo IP, nhưng có thể áp dụng các biện pháp để ngăn các gói tin giả mạo xâm nhập vào mạng. **Lọc lưu lượng vào (Ingress Filtering)** là một biện pháp phòng thủ cực kỳ phổ biến chống lại giả mạo, như được nêu trong BCP 38 (Tài liệu thực hành tốt nhất hiện nay). Lọc lưu lượng vào là một hình thức lọc gói tin thường được triển khai trên các thiết bị [vành đai mạng (network edge)](https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/), dùng để kiểm tra các gói IP đi vào và xác định tiêu đề nguồn của chúng. Nếu tiêu đề nguồn không khớp với nguồn gốc phát ra gói tin hoặc trông khả nghi, các gói tin đó sẽ bị từ chối. Một số mạng cũng triển khai lọc lưu lượng ra (egress filtering) để kiểm tra các gói IP rời khỏi mạng, đảm bảo chúng có tiêu đề nguồn hợp lệ, nhằm ngăn chặn người dùng bên trong mạng sử dụng IP Spoofing để phát động tấn công ra ngoài.

## SYN Flood

### SYN Flood là gì?

SYN Flood là một trong những hình thức tấn công DDoS (Distributed Denial of Service - Từ chối dịch vụ phân tán) nguyên thủy và kinh điển nhất trên Internet, nhằm làm cạn kiệt tài nguyên máy chủ khả dụng, khiến máy chủ không thể xử lý lưu lượng hợp lệ.

SYN Flood lợi dụng cơ chế bắt tay 3 bước của giao thức TCP. Kẻ tấn công thường dùng công cụ hoặc điều khiển mạng máy tính ma (botnet/zombie) gửi một lượng khổng lồ các gói tin TCP SYN với IP nguồn hoặc cổng nguồn biến đổi liên tục tới máy chủ. Sau khi máy chủ phản hồi các gói tin này, hàng loạt kết nối nửa mở (half-open) sẽ được tạo ra. Khi tài nguyên hệ thống bị vắt kiệt, máy chủ sẽ không thể cung cấp dịch vụ bình thường được nữa.
Nâng cấp phần cứng máy chủ hay cung cấp thêm dung lượng kết nối chỉ như muối bỏ biển trước lượng gói tin khổng lồ của SYN Flood. Chìa khóa để phòng thủ SYN Flood nằm ở việc xác định xem yêu cầu kết nối nào đến từ nguồn thực sự, từ đó chặn các yêu cầu không có thực để đảm bảo các yêu cầu nghiệp vụ hợp lệ được phục vụ.

![Tấn công SYN Flood làm cạn kiệt tài nguyên máy chủ thông qua lượng lớn kết nối nửa mở](/media/jg/ext/oss.javaguide.cn/p3-juejin/2b3d2d4dc8f24890b5957df1c7d6feb8-tplv-k3u1fbpfcp-e00505c9.png)

### Nguyên lý tấn công của TCP SYN Flood là gì?

Tấn công **TCP SYN Flood** lợi dụng quá trình bắt tay 3 bước của **TCP** (**SYN -> SYN/ACK -> ACK**). Giả sử bên khởi tạo kết nối là A, bên tiếp nhận kết nối là B, tức B đang lắng nghe yêu cầu kết nối do A gửi tới trên một cổng (**Port**) nhất định. Quá trình như sơ đồ bên dưới, bên trái là A, bên phải là B.

![Quy trình bình thường thiết lập kết nối qua bắt tay 3 bước TCP](/media/jg/ext/oss.javaguide.cn/p3-juejin/a39355a1ea404323a11ca6644e009183-tplv-k3u1fbpfcp-3a232ac7.png)

Đầu tiên A gửi thông điệp **SYN** (Synchronization) cho B, yêu cầu B chuẩn bị sẵn sàng nhận dữ liệu; B nhận được liền phản hồi thông điệp **SYN-ACK** (Synchronization-Acknowledgement) cho A, thông điệp này có 2 mục đích:

- Xác nhận với A rằng mình đã chuẩn bị sẵn sàng nhận dữ liệu,
- Đồng thời yêu cầu A cũng chuẩn bị sẵn sàng nhận dữ liệu. Lúc này B đã xác nhận trạng thái tiếp nhận với A và chờ đợi xác nhận từ A, kết nối ở vào **trạng thái nửa mở (Half-Open)**, đúng như tên gọi mới chỉ mở được một nửa; A nhận được liền gửi tiếp thông điệp **ACK** (Acknowledgement) cho B, xác nhận với B rằng mình cũng đã sẵn sàng nhận dữ liệu. Đến đây quá trình bắt tay 3 bước hoàn tất, "**kết nối**" chính thức được thiết lập.

Các bạn có chú ý thấy không, điểm mấu chốt nhất nằm ở chỗ cả hai bên có vào trạng thái **có thể nhận tin nhắn** theo đúng yêu cầu của đối phương hay không. Việc xác nhận trạng thái này chủ yếu dựa vào **số thứ tự thông điệp (SequenceNum)** mà hai bên sắp sử dụng. Nhằm đảm bảo tin nhắn đến ứng dụng tầng trên của bên nhận theo đúng thứ tự gửi đi, **TCP** cần dùng **số thứ tự** để đánh dấu trước sau.

**TCP** là kết nối "**song công toàn phần**" (Duplex), hỗ trợ truyền thông hai chiều đồng thời, tức hai bên có thể cùng lúc gửi tin nhắn cho nhau. Trong đó thông điệp **SYN** và **SYN-ACK** mở kênh truyền một chiều A→B (B biết được số thứ tự của A); thông điệp **SYN-ACK** và **ACK** mở kênh truyền một chiều B→A (A biết được số thứ tự của B).

Nội dung thảo luận ở trên là trong trường hợp hai bên giao tiếp bình thường, trung thực và tuân thủ quy tắc.

Nhưng thực tế là, mạng có thể chập chờn gây mất gói tin khiến thông điệp bắt tay không tới được đối phương, hoặc đối phương cố tình không làm theo quy tắc, cố tình trì hoãn hoặc không gửi thông điệp xác nhận bắt tay.

Giả sử B cung cấp dịch vụ qua một cổng **TCP** nào đó, khi B nhận được thông điệp **SYN** của A, B nhiệt tình phản hồi thông điệp **SYN-ACK**, khiến kết nối chuyển sang **trạng thái nửa mở**. Vì B không chắc thông điệp **SYN-ACK** mình gửi cho A hay thông điệp ACK do A phản hồi có bị rơi mất dọc đường hay không, nên B sẽ đặt một bộ định thời **Timer** cho mỗi kết nối nửa mở đang chờ hoàn tất. Nếu quá thời gian quy định mà vẫn chưa nhận được thông điệp **ACK** của A, B sẽ gửi lại thông điệp **SYN-ACK** cho A, và chỉ từ bỏ sau khi đã thử lại quá số lần nhất định.

![Lượng lớn kết nối nửa mở chiếm dụng tài nguyên máy chủ trong SYN Flood](/media/jg/ext/oss.javaguide.cn/p3-juejin/7ff1daddcec44d61994f254e664987b4-tplv-k3u1fbpfcp-cf454bde.png)

Để hỗ trợ A kết nối thuận lợi, B cần **cấp phát tài nguyên kernel** để duy trì kết nối nửa mở. Vậy khi B phải đối mặt với lượng kết nối khổng lồ tương tự A như hình trên, cuộc tấn công **SYN Flood** sẽ hình thành. Bên tấn công A có thể điều khiển mạng botnet gửi lượng lớn thông điệp SYN tới B nhưng không bao giờ phản hồi ACK, hoặc đơn giản là giả mạo **Source IP** trong thông điệp SYN khiến thông điệp **SYN-ACK** của B gửi đi như muối bỏ bể. Kết quả là B bị chiếm giữ bởi vô số kết nối nửa mở không bao giờ hoàn tất, cho đến khi cạn kiệt tài nguyên và ngừng phản hồi các yêu cầu kết nối bình thường.

### Các hình thức thường gặp của SYN Flood là gì?

Kẻ xấu có thể phát động tấn công SYN Flood qua 3 hình thức khác nhau:

1. **Tấn công trực tiếp (Direct Attack):** Tấn công SYN Flood không làm giả địa chỉ IP gọi là tấn công trực tiếp. Trong loại tấn công này, kẻ tấn công hoàn toàn không che giấu IP của mình. Do kẻ tấn công dùng thiết bị nguồn đơn lẻ với IP thật, nên rất dễ bị phát hiện và dọn dẹp. Để giữ máy đích ở trạng thái nửa mở, tin tặc sẽ ngăn máy mình phản hồi các gói SYN-ACK của máy chủ bằng cách thiết lập luật tường lửa chặn toàn bộ gói tin gửi ra ngoài trừ gói SYN, hoặc lọc toàn bộ gói SYN-ACK đi vào. Trong thực tế, phương pháp này rất hiếm khi được dùng vì quá dễ phòng ngừa – chỉ cần chặn IP của hệ thống tấn công. Ngay cả khi kẻ tấn công dùng mạng botnet (như [mạng botnet Mirai](https://www.cloudflare.com/learning/ddos/glossary/mirai-botnet/)), chúng cũng thường không cố tình ẩn IP của các thiết bị bị lây nhiễm.
2. **Tấn công giả mạo (Spoofed Attack):** Kẻ tấn công có thể giả mạo địa chỉ IP của từng gói tin SYN gửi đi để cản trở các biện pháp giảm thiểu và tăng độ khó cho việc truy vết danh tính. Dù các gói tin đã được ngụy trang, người ta vẫn có thể truy tìm nguồn gốc qua các gói tin này. Công tác phát hiện tuy khó nhưng không phải bất khả thi, đặc biệt nếu có sự trợ giúp từ Nhà cung cấp dịch vụ Internet (ISP).
3. **Tấn công phân tán (DDoS):** Nếu dùng mạng botnet để tấn công thì khả năng truy vết nguồn gốc tấn công là rất thấp. Cùng với việc nâng cấp mức độ xáo trộn, kẻ tấn công còn có thể ra lệnh cho từng thiết bị phân tán giả mạo IP của các gói tin gửi đi.

### Làm thế nào để giảm thiểu SYN Flood?

#### Mở rộng hàng đợi Backlog

Mỗi hệ điều hành cài đặt trên thiết bị đích đều cho phép một số lượng kết nối nửa mở nhất định. Để đối phó với lượng lớn gói tin SYN, một phương pháp là tăng số lượng kết nối nửa mở tối đa mà hệ điều hành cho phép. Để mở rộng hàng đợi backlog tối đa thành công, hệ thống phải dự trữ thêm tài nguyên bộ nhớ để xử lý các yêu cầu mới. Nếu hệ thống không đủ bộ nhớ, việc tăng quy mô hàng đợi backlog sẽ ảnh hưởng tiêu cực tới hiệu năng hệ thống, nhưng vẫn tốt hơn là bị từ chối dịch vụ hoàn toàn.

#### Thu hồi kết nối nửa mở TCP được tạo sớm nhất

Một chiến lược giảm thiểu khác là ghi đè lên kết nối nửa mở được tạo sớm nhất sau khi hàng đợi backlog đã bị lấp đầy. Chiến lược này đòi hỏi thời gian thiết lập hoàn tất kết nối hợp lệ phải ngắn hơn thời gian các gói tin SYN độc hại lấp đầy backlog. Khi lưu lượng tấn công tăng cao hoặc quy mô backlog nhỏ hơn nhu cầu thực tế, biện pháp phòng vệ này sẽ mất tác dụng.

#### SYN Cookie

Chiến lược này yêu cầu máy chủ tạo ra Cookie mã hóa. Để tránh ngắt kết nối khi lấp đầy backlog, máy chủ phản hồi mỗi yêu cầu kết nối bằng gói tin SYN-ACK chứa cookie mã hóa trong số thứ tự ban đầu, sau đó xóa yêu cầu SYN khỏi hàng đợi backlog và giải phóng tài nguyên bộ nhớ, giữ cho cổng luôn mở và sẵn sàng thiết lập lại kết nối. Nếu kết nối là yêu cầu hợp lệ và gói tin ACK cuối cùng từ client được gửi về máy chủ, máy chủ sẽ tái tạo lại mục hàng đợi SYN backlog (kèm theo một số hạn chế). Mặc dù biện pháp này làm mất một số thông tin tham số tùy chọn của kết nối TCP, nhưng vẫn tốt hơn việc bị từ chối dịch vụ đối với người dùng hợp lệ.

## UDP Flood

### UDP Flood là gì?

**UDP Flood** cũng là một dạng tấn công từ chối dịch vụ, gửi lượng lớn gói tin giao thức dữ liệu người dùng (**UDP**) tới máy chủ mục tiêu nhằm áp đảo năng lực xử lý và phản hồi của thiết bị. Tường lửa bảo vệ máy chủ đích cũng có thể bị quá tải do dòng lũ **UDP**, dẫn đến việc từ chối dịch vụ đối với lưu lượng hợp lệ.

### Nguyên lý tấn công của UDP Flood là gì?

**UDP Flood** chủ yếu lợi dụng các bước mà máy chủ thực hiện khi phản hồi các gói tin **UDP** gửi tới một cổng nào đó. Trong điều kiện bình thường, khi máy chủ nhận được gói tin UDP trên một cổng cụ thể, nó sẽ trải qua 2 bước:

- Đầu tiên máy chủ kiểm tra xem có chương trình nào đang chạy và lắng nghe yêu cầu trên cổng chỉ định hay không.
- Nếu không có chương trình nào nhận gói tin trên cổng đó, ngăn xếp giao thức IPv4 thông thường sẽ trả về thông điệp **ICMP Destination Unreachable**, trong đó Type = 3, Code = 3, tức **Port Unreachable**. Đây không phải thông điệp ICMP Echo dùng trong lệnh Ping; trong mạng thực tế, các lỗi ICMP kiểu này cũng có thể bị tường lửa loại bỏ hoặc bị giao thức giới hạn tốc độ.

Lấy một ví dụ: Giả sử hôm nay bạn cần gọi điện cho một người khách trọ ở khách sạn. Lễ tân nhận cuộc gọi liền kiểm tra danh sách phòng xem khách có ở trong phòng không rồi mới chuyển máy.
Lễ tân tiếp nhận cuộc gọi yêu cầu nối máy tới một phòng cụ thể, cần tra cứu danh sách toàn bộ phòng để đảm bảo khách có mặt và sẵn sàng nghe máy. Trớ trêu thay, nếu đột nhiên tất cả các đường dây điện thoại cùng reo một lúc yêu cầu nối tới những phòng không có người, nhân viên lễ tân sẽ nhanh chóng bị quá tải.

Khi máy chủ nhận mỗi gói tin **UDP** mới, nó sẽ thực hiện các bước xử lý yêu cầu và tiêu tốn tài nguyên máy chủ trong quá trình đó. Khi gửi gói tin **UDP**, mỗi gói tin sẽ chứa địa chỉ **IP** của thiết bị nguồn. Trong kiểu tấn công **DDoS** này, kẻ tấn công thường không dùng IP thật của mình mà giả mạo IP nguồn của gói UDP, ngăn chặn việc lộ vị trí thực và làm bão hòa băng thông phản hồi từ máy chủ đích.

Do máy chủ đích phải dùng tài nguyên để kiểm tra và phản hồi từng gói tin UDP nhận được, nên khi nhận lượng lớn gói tin UDP, tài nguyên của mục tiêu có thể nhanh chóng cạn kiệt, dẫn tới từ chối dịch vụ đối với lưu lượng thông thường.

![UDP Flood tiêu hao tài nguyên máy chủ thông qua lượng lớn gói tin UDP](/media/jg/ext/oss.javaguide.cn/p3-juejin/23dbbc8243a84ed181e088e38bffb37a-tplv-k3u1fbpfcp-1d08ee4f.png)

### Làm thế nào để giảm thiểu UDP Flood?

Hầu hết các hệ điều hành đều giới hạn một phần tốc độ phản hồi các thông điệp **ICMP** nhằm làm gián đoạn các cuộc tấn công **DDoS** cần phản hồi ICMP. Nhược điểm của giải pháp này là trong quá trình tấn công, các gói tin hợp lệ cũng có thể bị lọc nhầm. Nếu dung lượng của **UDP Flood** đủ lớn để làm bão hòa bảng trạng thái (state table) của tường lửa bảo vệ máy chủ đích, thì bất kỳ biện pháp giảm thiểu nào diễn ra ở cấp độ máy chủ cũng sẽ bất lực trước điểm nghẽn ở phía thượng nguồn của thiết bị mục tiêu.

## HTTP Flood

### HTTP Flood là gì?

HTTP Flood là một cuộc tấn công DDoS quy mô lớn nhằm tận dụng các yêu cầu HTTP để làm máy chủ mục tiêu quá tải. Khi mục tiêu bị bão hòa bởi các yêu cầu và không thể phản hồi lưu lượng thông thường, hiện tượng từ chối dịch vụ sẽ xảy ra, từ chối các yêu cầu từ người dùng thực tế.

![HTTP Flood đè bẹp máy chủ mục tiêu thông qua lượng lớn yêu cầu tầng ứng dụng](/media/jg/ext/oss.javaguide.cn/p3-juejin/aa64869551d94c8d89fa80eaf4395bfa-tplv-k3u1fbpfcp-374ce8b2.png)

### Nguyên lý tấn công của HTTP Flood là gì?

Tấn công HTTP Flood là một dạng tấn công DDoS "Tầng 7". Tầng 7 là tầng ứng dụng trong mô hình OSI, chỉ các giao thức Internet như HTTP. HTTP là nền tảng của các yêu cầu Internet trên trình duyệt, thường dùng để tải trang web hoặc gửi nội dung biểu mẫu qua Internet. Việc giảm thiểu các cuộc tấn công tầng ứng dụng đặc biệt phức tạp vì rất khó phân biệt giữa lưu lượng độc hại và lưu lượng thông thường.

Để đạt hiệu quả tối đa, kẻ tấn công thường tận dụng hoặc tạo ra các mạng botnet nhằm khuếch đại tối đa tầm ảnh hưởng của cuộc tấn công. Bằng cách điều khiển nhiều thiết bị bị nhiễm mã độc, kẻ tấn công có thể phát động luồng lưu lượng khổng lồ.

Tấn công HTTP Flood có hai dạng:

- **Tấn công HTTP GET**: Trong hình thức này, nhiều máy tính phối hợp với nhau gửi hàng loạt yêu cầu đòi tải hình ảnh, tệp tin hoặc các tài nguyên nặng tới máy chủ đích. Khi mục tiêu bị ngập trong các yêu cầu và phản hồi gửi đến, các yêu cầu từ nguồn lưu lượng bình thường sẽ bị từ chối dịch vụ.
- **Tấn công HTTP POST**: Thông thường, khi gửi biểu mẫu (form) trên website, máy chủ phải xử lý yêu cầu gửi tới và đẩy dữ liệu vào tầng lưu trữ bền vững (thường là cơ sở dữ liệu). So với năng lực xử lý và băng thông cần thiết để gửi một yêu cầu POST, quá trình xử lý dữ liệu biểu mẫu và thực thi các câu lệnh cơ sở dữ liệu tốn nhiều tài nguyên hơn rất nhiều. Cuộc tấn công này tận dụng sự chênh lệch tiêu hao tài nguyên tương đối đó, bắn thẳng nhiều yêu cầu POST vào máy chủ mục tiêu cho đến khi dung lượng máy chủ bão hòa và gây ra từ chối dịch vụ.

### Làm thế nào để phòng chống HTTP Flood?

Như đã đề cập, việc giảm thiểu tấn công tầng 7 rất phức tạp và đòi hỏi tiếp cận từ nhiều phương diện. Một phương pháp là đưa ra thử thách (challenge) đối với thiết bị gửi yêu cầu để kiểm tra xem đó có phải là bot hay không, tương tự như bài kiểm tra CAPTCHA thường dùng khi tạo tài khoản trực tuyến. Bằng cách yêu cầu giải quyết thử thách tính toán JavaScript, ta có thể giảm thiểu nhiều cuộc tấn công tự động.

Các biện pháp khác để ngăn chặn HTTP Flood bao gồm sử dụng Tường lửa ứng dụng Web (WAF), quản lý cơ sở dữ liệu danh tiếng IP để theo dõi và chọn lọc chặn lưu lượng độc hại, cũng như phân tích động bởi các kỹ sư. Cloudflare với lợi thế quy mô trên hàng chục triệu thiết bị Internet có khả năng phân tích lưu lượng từ nhiều nguồn khác nhau và áp dụng các luật WAF cập nhật nhanh chóng cùng các chiến lược phòng vệ khác để triệt tiêu lưu lượng DDoS tầng ứng dụng.

## DNS Flood

### DNS Flood là gì?

Máy chủ Hệ thống tên miền (DNS) là "cuốn danh bạ" của Internet; các thiết bị Internet truy vấn các máy chủ này để tìm kiếm máy chủ Web cụ thể nhằm truy cập nội dung. Tấn công DNS Flood là một cuộc tấn công từ chối dịch vụ phân tán (DDoS), trong đó kẻ tấn công làm tràn ngập máy chủ DNS của một tên miền bằng lưu lượng khổng lồ nhằm làm gián đoạn quá trình phân giải DNS của miền đó. Nếu người dùng không thể tra cứu danh bạ, họ sẽ không thể tìm thấy địa chỉ IP để gọi tới tài nguyên. Bằng việc làm gián đoạn phân giải DNS, DNS Flood phá hủy khả năng phản hồi lưu lượng hợp lệ của trang web, API hoặc ứng dụng web. Rất khó phân biệt cuộc tấn công DNS Flood với lưu lượng truy cập lớn thông thường, vì các luồng lưu lượng quy mô lớn này thường đến từ nhiều địa chỉ duy nhất, truy vấn các bản ghi thực sự của miền đó, bắt chước hoàn hảo lưu lượng hợp lệ.

### Nguyên lý tấn công của DNS Flood là gì?

![DNS Flood sử dụng lượng lớn truy vấn DNS để làm ngập máy chủ DNS](/media/jg/ext/oss.javaguide.cn/p3-juejin/97ea11a212924900b10d159226783887-tplv-k3u1fbpfcp-3705dc3c.png)

Chức năng của DNS là chuyển đổi tên miền dễ nhớ (ví dụ `example.com`) thành địa chỉ máy chủ trang web khó nhớ (ví dụ `192.168.0.1`), vì vậy việc tấn công thành công vào hạ tầng DNS sẽ khiến đại đa số người dùng không thể truy cập Internet. Tấn công DNS Flood là dạng tấn công dựa trên DNS tương đối mới mẻ, bùng nổ mạnh mẽ sau sự trỗi dậy của các [mạng botnet](https://www.cloudflare.com/learning/ddos/what-is-a-ddos-botnet/) [Internet vạn vật (IoT)](https://www.cloudflare.com/learning/ddos/glossary/internet-of-things-iot/) có băng thông cao (như [Mirai](https://www.cloudflare.com/learning/ddos/glossary/mirai-botnet/)). DNS Flood sử dụng kết nối băng thông cao của camera IP, đầu ghi hình DVR và các thiết bị IoT khác để làm ngập trực tiếp máy chủ DNS của các nhà cung cấp lớn, ngăn chặn người dùng hợp lệ truy cập máy chủ DNS.

Tấn công DNS Flood khác với [Tấn công khuếch đại DNS (DNS Amplification Attack)](https://www.cloudflare.com/zh-cn/learning/ddos/dns-amplification-ddos-attack/). Khác với DNS Flood, tấn công khuếch đại DNS phản xạ và khuếch đại lưu lượng từ các máy chủ DNS không an toàn nhằm che giấu nguồn gốc tấn công và nâng cao hiệu quả phá hoại. Tấn công khuếch đại DNS dùng thiết bị có băng thông nhỏ gửi vô số yêu cầu tới các máy chủ DNS mở, gửi yêu cầu nhỏ đòi bản ghi DNS rất lớn nhưng giả mạo địa chỉ phản hồi là nạn nhân mục tiêu. Hiệu ứng khuếch đại này giúp kẻ tấn công phá hủy mục tiêu lớn với tài nguyên hạn chế. Trong khi đó, DNS Flood tấn công trực diện vào máy chủ có thẩm quyền với lượng truy vấn khổng lồ.

### Làm thế nào để phòng chống DNS Flood?

DNS Flood mang lại sự thay đổi so với các phương pháp tấn công dựa trên khuếch đại truyền thống. Nhờ các mạng botnet băng thông cao dễ dàng sở hữu, kẻ tấn công hiện có thể nhắm vào các tổ chức quy mô lớn. Trừ khi các thiết bị IoT bị xâm nhập được cập nhật vá lỗi hoặc thay thế, cách duy nhất để chống lại các cuộc tấn công này là sử dụng một hệ thống DNS siêu lớn, phân tán cao độ để giám sát, hấp thụ và ngăn chặn lưu lượng tấn công theo thời gian thực.

## Tấn công đặt lại TCP (TCP Reset Attack)

Trong tấn công đặt lại **TCP** (TCP Reset Attack), kẻ tấn công gửi các gói tin RST giả mạo tới một hoặc cả hai bên truyền thông nhằm khiến phía nhận đóng kết nối sớm. Việc TCP có gửi hoặc chấp nhận gói RST hay không phụ thuộc vào trạng thái kết nối hiện tại cũng như số thứ tự (Sequence Number), số xác nhận (Acknowledgment Number) trong gói tin. Đối với kết nối đã được thiết lập, phía nhận chỉ đóng kết nối sau khi gói RST vượt qua kiểm tra số thứ tự; gói RST nằm ngoài cửa sổ (out-of-window) sẽ bị hủy bỏ, và các đầu mút hỗ trợ cơ chế bảo vệ RFC 5961 sẽ gửi Challenge ACK đối với các gói RST nằm trong cửa sổ nhưng không khớp chính xác số thứ tự kỳ vọng.

Tấn công **TCP Reset** lợi dụng cơ chế này, bằng cách gửi các đoạn reset giả mạo để đánh lừa hai bên đóng kết nối TCP trước thời hạn. Nếu đoạn reset giả mạo hoàn toàn hợp lệ, bên nhận sẽ coi nó là đúng và đóng kết nối **TCP**, ngăn không cho kết nối tiếp tục trao đổi thông tin. Phía máy chủ có thể tạo một kết nối **TCP** mới để khôi phục giao tiếp, nhưng vẫn có nguy cơ bị kẻ tấn công đặt lại kết nối lần nữa. May mắn thay, kẻ tấn công cần một khoảng thời gian nhất định để bắt gói tin và tạo gói giả mạo, nên thông thường đòn tấn công này chỉ có sức sát thương đối với các kết nối dài (long-lived connection); còn với kết nối ngắn (short-lived connection), khi bạn chưa kịp tấn công thì hai bên đã trao đổi thông tin xong xuôi rồi.

Giao thức TCP thông thường không có cơ chế xác thực mật mã cho tiêu đề TCP, do đó TLS không thể bảo vệ gói tin RST ở tầng TCP. Khi cần xác thực gói tin ở tầng thấp hơn, ta có thể sử dụng các cơ chế như IPsec hoặc TCP-AO, tuy nhiên chúng đòi hỏi cả hai bên truyền thông và môi trường mạng phải hỗ trợ tương ứng.

## Mô phỏng tấn công

> Thử nghiệm dưới đây được thực hiện trên hệ điều hành `OSX` (macOS), các hệ thống khác vui lòng tự kiểm tra điều chỉnh.

Bây giờ hãy tóm tắt lại những việc cần làm để giả mạo một gói tin TCP Reset:

- Ngửi (sniff) thông tin trao đổi giữa hai bên truyền thông.
- Bắt lấy một đoạn gói tin có cờ `ACK` được bật lên 1 và đọc giá trị số `ACK` của nó.
- Giả mạo một đoạn TCP Reset (cờ `RST` đặt bằng 1), có số thứ tự (Sequence Number) bằng với số `ACK` của gói tin vừa bắt được. Đây chỉ là phương án trong điều kiện lý tưởng, giả định tốc độ trao đổi thông tin không quá nhanh. Trong hầu hết các trường hợp, để tăng tỷ lệ thành công, ta có thể gửi liên tiếp nhiều gói reset với các số thứ tự khác nhau.
- Gửi gói reset giả mạo tới một hoặc cả hai bên truyền thông để làm gián đoạn kết nối của họ.

Để thử nghiệm đơn giản, chúng ta có thể dùng máy tính cục bộ tự truyền thông với chính mình qua `localhost`, sau đó tự tấn công TCP Reset vào chính mình. Cần thực hiện các bước sau:

- Thiết lập một kết nối TCP giữa hai cửa sổ terminal.
- Viết một chương trình tấn công có thể sniff dữ liệu của hai bên truyền thông.
- Sửa đổi chương trình tấn công để giả mạo và phát đi gói tin reset.

Dưới đây là các bước thực nghiệm cụ thể.

> Thiết lập kết nối TCP

Có thể sử dụng công cụ `netcat` để thiết lập kết nối TCP, công cụ này đã được cài sẵn trên nhiều hệ điều hành. Mở cửa sổ terminal thứ nhất, chạy lệnh sau:

```bash
nc -nvl 8000
```

Lệnh này sẽ khởi động một dịch vụ TCP lắng nghe trên cổng `8000`. Tiếp theo mở cửa sổ terminal thứ hai, chạy lệnh sau:

```bash
nc 127.0.0.1 8000
```

Lệnh này sẽ cố gắng kết nối tới dịch vụ trên. Nhập vài ký tự ở một trong hai cửa sổ, dữ liệu sẽ được gửi qua kết nối TCP tới cửa sổ kia và in ra màn hình.

![Sử dụng nc thiết lập kết nối TCP cục bộ và truyền dữ liệu](/media/jg/ext/oss.javaguide.cn/p3-juejin/df0508cbf26446708cf98f8ad514dbea-tplv-k3u1fbpfcp-25fb1b9c.gif)

> Bắt gói tin (Sniffing traffic)

Viết một chương trình tấn công sử dụng thư viện mạng Python `scapy` để đọc dữ liệu trao đổi giữa hai cửa sổ terminal và in ra màn hình. Mã nguồn cốt lõi gọi hàm sniff của `scapy`:

![Đoạn mã dùng Scapy để sniff gói tin kết nối TCP cục bộ](/media/jg/ext/oss.javaguide.cn/p3-juejin/27feb834aa9d4b629fd938611ac9972e-tplv-k3u1fbpfcp-1e00f3a6.png)

Đoạn mã này hướng dẫn `scapy` sniff các gói tin trên giao diện mạng `lo0` và ghi lại thông tin chi tiết của mọi kết nối TCP:

- **iface**: Yêu cầu scapy lắng nghe trên giao diện mạng `lo0` (localhost).
- **lfilter**: Bộ lọc yêu cầu scapy bỏ qua tất cả các gói tin không thuộc kết nối TCP chỉ định (hai bên truyền thông đều là `localhost` và số cổng là `8000`).
- **prn**: Hàm callback mà scapy thực thi trên tất cả các gói tin thỏa mãn quy tắc `lfilter`. Ví dụ trên chỉ in gói tin ra terminal, phần dưới sẽ sửa đổi hàm này để tạo gói reset giả mạo.
- **count**: Số lượng gói tin scapy cần sniff trước khi hàm trả về kết quả.

> Gửi gói tin reset giả mạo

Bắt đầu sửa đổi chương trình để gửi gói TCP Reset giả mạo thực hiện tấn công. Theo phân tích ở trên, chỉ cần sửa đổi hàm `prn` để nó kiểm tra gói tin, trích xuất các tham số cần thiết, dùng các tham số đó tạo gói TCP Reset và gửi đi.

Ví dụ, giả sử chương trình bắt được một đoạn gói tin gửi từ (`src_ip`, `src_port`) tới (`dst_ip`, `dst_port`), đoạn gói này có cờ ACK đặt bằng 1 và số ACK là `100,000`. Những việc chương trình tấn công cần làm tiếp theo là:

- Do gói tin giả mạo là phản hồi cho gói tin vừa bắt được, nên `IP/Port` nguồn của gói giả mạo phải là `IP/Port` đích của gói bắt được, và ngược lại.
- Đặt cờ `RST` của gói giả mạo bằng 1 để biểu thị đây là gói tin reset.
- Đặt số thứ tự (Sequence Number) của gói giả mạo bằng số ACK của gói bắt được, vì đây chính là số thứ tự tiếp theo mà bên gửi kỳ vọng nhận được.
- Gọi phương thức `send` của `scapy` để gửi gói tin giả mạo tới bên phát của gói tin bị bắt.

Sau khi thiết lập kết nối TCP theo bước 1, mở cửa sổ thứ ba chạy chương trình tấn công, sau đó nhập vài chuỗi ký tự tại một trong các terminal kết nối TCP, bạn sẽ thấy kết nối TCP bị ngắt ngay lập tức!

> Thử nghiệm nâng cao

1. Có thể tiếp tục dùng chương trình tấn công để thử nghiệm: cộng hoặc trừ 1 vào số thứ tự của gói tin giả mạo xem điều gì xảy ra, để kiểm chứng xem có thực sự cần phải trùng khớp hoàn toàn với số `ACK` của gói tin bị bắt hay không.
2. Mở `Wireshark`, lắng nghe giao diện mạng `lo0`, dùng bộ lọc `ip.src == 127.0.0.1 && ip.dst == 127.0.0.1 && tcp.port == 8000` để lọc dữ liệu không liên quan. Bạn có thể quan sát toàn bộ chi tiết của kết nối TCP.
3. Gửi luồng dữ liệu nhanh hơn trên kết nối để xem việc tấn công trở nên khó thực hiện hơn như thế nào.

## Tấn công người đứng giữa (Man-in-the-Middle Attack - MITM)

Trư Bát Giới muốn tỏ tình với Tiểu Lam nên viết một bức thư gửi cho nàng, kết quả kẻ thứ ba là Tiểu Hắc chặn được bức thư này và sửa đổi nội dung, gây chia rẽ giữa hai người. Kẻ phá hoại đó chính là người đứng giữa (man-in-the-middle), và hành vi đó chính là tấn công người đứng giữa. Hãy cùng tìm hiểu sâu hơn về tấn công MITM.

### Người đứng giữa là gì?

Tấn công người đứng giữa có tên tiếng Anh là Man-in-the-Middle Attack, viết tắt là "tấn công MITM". Chỉ việc kẻ tấn công thiết lập các kết nối độc lập với cả hai đầu truyền thông và trao đổi dữ liệu nhận được giữa họ, khiến hai đầu truyền thông tin rằng họ đang nói chuyện trực tiếp với nhau qua một kết nối riêng tư, nhưng thực tế toàn bộ phiên làm việc đều bị kẻ tấn công kiểm soát hoàn toàn. Sơ đồ minh họa:

![Tấn công người đứng giữa chặn và sửa đổi tin nhắn giữa hai bên truyền thông](/media/jg/ext/oss.javaguide.cn/p3-juejin/d69b74e63981472b852797f2fa08976f-tplv-k3u1fbpfcp-90bed9bb.png)

Từ hình này ta thấy người đứng giữa chính là kẻ tấn công. Nguyên lý này có nhiều ứng dụng trong thực tế, ví dụ khi bạn lướt web trên điện thoại vào trang không an toàn, điện thoại cảnh báo trang web có thể chứa virus và hỏi bạn có muốn tiếp tục truy cập hay không.

### Nguyên lý của tấn công người đứng giữa là gì?

Lấy ví dụ: Tôi và công ty ký hợp đồng lao động, mỗi bên giữ một bản. Lỡ có ai đó sửa đổi nội dung hợp đồng, không biết thật giả thế nào thì xử lý sao? Buộc phải tìm tổ chức giám định chuyên nghiệp, và tất nhiên phải tốn tiền.

Trong lĩnh vực an ninh mạng có một câu nói: **Chúng ta không có cách nào triệt tiêu hoàn toàn tội phạm mạng, mà chỉ có thể tìm cách nâng cao chi phí phạm tội mạng**.

Để tránh việc một trong hai bên không giữ lời, hai bên đưa thêm một tổ chức thứ ba vào cuộc, giao bản gốc hợp đồng cho tổ chức thứ ba đáng tin cậy. Chỉ cần tổ chức này không tự ý gian lận thì hợp đồng tương đối an toàn.

**Nếu nội bộ tổ chức thứ ba quản lý lỏng lẻo hoặc dễ phát sinh sơ hở thì sao?**

Tuy ta đã giao bản gốc hợp đồng cho tổ chức thứ ba, nhưng để phòng ngừa nhân viên nội bộ sửa đổi thì cần áp dụng biện pháp gì?

Một cách khả thi là đưa vào **Thuật toán băm / tạo bản tóm lược (Digest Algorithm)**. Hàm băm ánh xạ dữ liệu có độ dài bất kỳ thành một bản tóm lược (digest) có độ dài cố định. Băm không phải là mã hóa, không cung cấp khả năng giải mã đảo ngược; các đầu vào khác nhau cũng có thể tạo ra cùng một bản tóm lược (va chạm), do đó không thể coi bản tóm lược là giá trị duy nhất tuyệt đối. Đối với các hàm băm mật mã an toàn, khi dữ liệu đầu vào thay đổi thì bản tóm lược thường cũng thay đổi theo.

#### Có những thuật toán băm phổ biến nào?

Các thuật toán thường dùng hiện nay gồm thuật toán tóm lược thông điệp và thuật toán băm an toàn (**SHA**). **MD5** chuyển đổi văn bản có độ dài bất kỳ thành giá trị băm 128 bit, nhưng vào năm 2004, **MD5** đã bị chứng minh là dễ xảy ra xung đột (collision), tức hai văn bản gốc khác nhau tạo ra cùng một bản tóm lược. Như vậy tương đương với việc mở cửa sau cho tin tặc dễ dàng làm giả bản tóm lược.

Vì vậy trong hầu hết các trường hợp người ta lựa chọn **thuật toán SHA**.

**Nếu xuất hiện gián điệp nội bộ thì sao?**

Tình huống trông có vẻ rất an toàn, về mặt lý thuyết đã ngăn chặn được việc sửa đổi hợp đồng. Nhưng nếu một nhân viên nào đó có đồng thời cả quyền sửa hợp đồng lẫn quyền sửa bản tóm lược, thì chuyện gian lận chỉ là vấn đề thời gian. Vậy có thể cân nhắc việc lưu trữ hợp đồng và bản tóm lược riêng biệt hay không?

**Làm sao đảm bảo nhân viên không sửa đổi hợp đồng?**

Chúng ta giữ hợp đồng trong tay hai bên ký kết, còn bản tóm lược lưu tại tổ chức thứ ba, như vậy độ khó khi muốn giả mạo sẽ tăng lên một bậc.

**Lỡ nhân viên thông đồng với một bên người dùng thì sao?**

Xem ra gửi gắm tổ chức thứ ba vẫn tiềm ẩn rủi ro không nhỏ. Vì vậy cần tìm giải pháp mới, và đó là lý do ra đời của **Chữ ký số và Chứng chỉ số**.

#### Chứng chỉ số và Chữ ký số có tác dụng gì?

Lấy ví dụ: Sum và Mike ký hợp đồng. Sum dùng thuật toán ký và khóa riêng tư (private key) của mình để tạo chữ ký số cho hợp đồng, sau đó giao hợp đồng, chữ ký số và khóa công khai (public key) dùng để xác thực cho Mike.

![Quy trình tạo chữ ký số và xác thực chữ ký bằng public key](/media/jg/ext/oss.javaguide.cn/p3-juejin/e4b7d6fca78b45c8840c12411b717f2f-tplv-k3u1fbpfcp-d0893ffa.png)

Sau khi Mike nhận được, anh dùng public key của Sum để xác thực chữ ký. Xác thực thành công chứng minh chữ ký khớp với public key đó và nội dung hợp đồng hiện tại, có thể phát hiện xem hợp đồng có bị can thiệp chỉnh sửa hay không, đồng thời khẳng định chữ ký do bên nắm giữ private key của Sum tạo ra.

Nếu Mike sửa đổi nội dung hợp đồng, chữ ký ban đầu sẽ không vượt qua được bước xác thực; nếu không có private key của Sum, Mike cũng không thể tạo chữ ký hợp lệ cho bản hợp đồng đã sửa. Private key phải được Sum bảo quản cẩn mật, còn public key có thể cung cấp rộng rãi cho người xác thực.

Chữ ký số nên được hiểu là "ký bằng private key, xác thực bằng public key", chứ không phải khái niệm chung chung "mã hóa bằng private key, giải mã bằng public key". Quá trình toán học của các thuật toán như RSA, ECDSA, EdDSA là khác nhau, và dùng thuật ngữ ký và xác thực sẽ chuẩn xác hơn.

Hãy cùng tìm hiểu về mã hóa đối xứng và mã hóa bất đối xứng.

#### Mã hóa đối xứng là gì?

Mã hóa đối xứng (Symmetric Encryption), đúng như tên gọi, bên mã hóa và bên giải mã sử dụng cùng một chìa khóa (secret key / khóa bí mật). Cụ thể, bên gửi dùng thuật toán mã hóa và khóa bí mật tương ứng để mã hóa thông tin cần gửi; bên nhận dùng thuật toán giải mã cùng chiếc khóa bí mật đó để mở khóa thông tin, nhờ đó đọc được nội dung.

![Trong mã hóa đối xứng hai bên truyền thông dùng chung một khóa để mã hóa và giải mã](/media/jg/ext/oss.javaguide.cn/p3-juejin/ef81cb5e2f0a4d3d9ac5a44ecf97e3cc-tplv-k3u1fbpfcp-8e718342.png)

#### Các thuật toán mã hóa đối xứng phổ biến là gì?

**DES**

DES bề ngoài sử dụng khóa 64 bit, tuy nhiên chỉ có 56 bit thực sự được dùng cho thuật toán, 8 bit còn lại dùng để kiểm tra tính chẵn lẻ và bị loại bỏ trong tính toán. Do đó độ dài khóa hiệu dụng của **DES** là 56 bit. Với 56 bit, nếu dùng phương pháp vét cạn (brute-force) sẽ có 2^56 khả năng. Hiện nay **DES** không còn là phương pháp mã hóa an toàn nữa, chủ yếu vì độ dài khóa 56 bit quá ngắn.

![Sơ đồ thuật toán mã hóa đối xứng DES](/media/jg/ext/oss.javaguide.cn/p3-juejin/9eb3a2bf6cf14132a890bc3447480eeb-tplv-k3u1fbpfcp-be13c035.jpg)

**IDEA**

Thuật toán mã hóa dữ liệu quốc tế (International Data Encryption Algorithm). Độ dài khóa 128 bit, ưu điểm là không bị hạn chế bởi bằng sáng chế.

**AES**

Sau khi DES bị bẻ gãy, thuật toán **AES** (Advanced Encryption Standard) ra đời, cung cấp 3 độ dài khóa tùy chọn: 128 bit, 192 bit và 256 bit. Để đảm bảo hiệu năng không bị ảnh hưởng quá nhiều, thông thường chọn 128 bit.

**SM1 và SM4**

Các thuật toán trên đều của phương Tây, Trung Quốc tự nghiên cứu chuẩn mật mã quốc gia **SM1** và **SM4**, trong đó SM4 là chuẩn quốc gia công khai thuật toán.

**Tổng kết**:

![So sánh và tổng kết các thuật toán mã hóa đối xứng phổ biến](/media/jg/ext/oss.javaguide.cn/p3-juejin/578961e3175540e081e1432c409b075a-tplv-k3u1fbpfcp-fedd454d.png)

#### Các thuật toán mã hóa bất đối xứng phổ biến là gì?

Trong mã hóa đối xứng, bên gửi và bên nhận dùng chung một khóa. Còn trong mã hóa bất đối xứng (Asymmetric Cryptography), bên gửi và bên nhận sử dụng các khóa khác nhau. Vấn đề cốt lõi mà nó giải quyết là ngăn chặn việc lộ khóa trong quá trình thương lượng khóa bí mật. Trong mã hóa đối xứng, nếu chia sẻ khóa qua kênh không an toàn thì kẻ nghe lén dễ dàng tóm được khóa. Còn trong mã hóa bất đối xứng, public key có thể công khai cho tất cả mọi người, kẻ đứng giữa lấy được public key cũng vô ích vì không có private key. Vì vậy, mật mã bất đối xứng giải quyết bài toán phân phối khóa hóc búa.

![Mã hóa bất đối xứng sử dụng public key và private key để hoàn thành mã hóa và giải mã](/media/jg/ext/oss.javaguide.cn/p3-juejin/153cf04a0ecc43c38003f3a1ab198cc0-tplv-k3u1fbpfcp-72b971e2.png)

Các thuật toán mật mã bất đối xứng phổ biến:

- **RSA**: Độ an toàn dựa trên độ khó tính toán của việc phân tích các số nguyên lớn thành thừa số nguyên tố. Ứng dụng rộng rãi, tính tương thích cao. Nhược điểm là tốc độ chậm hơn, khóa càng dài (như 2048/4096 bit) độ an toàn càng cao nhưng chi phí tính toán cũng tăng theo.
- **ECC**: Dựa trên đường cong elliptic, là thuật toán có cường độ mã hóa cao nhất hiện nay với chiều dài khóa ngắn.
- **SM2**: Chuẩn mật mã đường cong elliptic của Trung Quốc.

Tổng kết:

![So sánh và tổng kết các thuật toán mã hóa bất đối xứng phổ biến](/media/jg/ext/oss.javaguide.cn/p3-juejin/28b96fb797904d4b818ee237cdc7614c-tplv-k3u1fbpfcp-a82a06a7.png)

#### Các thuật toán băm (Hash) phổ biến là gì?

Thuật toán băm thường dùng trong xác thực tính toàn vẹn, định địa chỉ theo nội dung, v.v., tuy nhiên yêu cầu an toàn ở các ngữ cảnh khác nhau là khác nhau. Mật khẩu người dùng không được xử lý như bản tóm lược tệp tin thông thường: máy chủ phải tạo muối (salt) độc lập cho từng mật khẩu và dùng giải pháp băm chuyên dụng cho mật khẩu có tham số độ phức tạp (cost parameter); đồng thời lưu trữ muối, định danh thuật toán và tham số chi phí để tiện cho việc nâng cấp hoặc di chuyển thuật toán sau này.

**MD5** (Không khuyến nghị)

MD5 tạo ra bản tóm lược 128 bit nhưng không còn khả năng kháng va chạm đáng tin cậy, không nên dùng cho chữ ký số, chứng chỉ, kiểm tra toàn vẹn an toàn hoặc lưu trữ mật khẩu.

**SHA**

Thuật toán băm an toàn (Secure Hash Algorithm). **SHA** gồm các họ **SHA-1**, **SHA-2** và **SHA-3**. Nó ánh xạ dữ liệu đầu vào thành giá trị băm có độ dài cố định. Quá trình này không thể đảo ngược, nhưng giá trị băm không phải là bản mã và cũng không tương đương mã xác thực thông điệp (MAC). SHA-1 không còn phù hợp cho các ngữ cảnh an toàn đòi hỏi kháng va chạm; các hệ thống mới thường chọn thuật toán cụ thể trong họ SHA-2 (như SHA-256) hoặc SHA-3.

**SM3**

Thuật toán băm quốc gia **SM3** của Trung Quốc, có cường độ mã hóa tương đương SHA-256.

**Tổng kết**:

![So sánh và tổng kết các thuật toán băm phổ biến](/media/jg/ext/oss.javaguide.cn/p3-juejin/79c3c2f72d2f44c7abf2d73a49024495-tplv-k3u1fbpfcp-11e99ce2.png)

Mã hóa đối xứng, mật mã bất đối xứng và thuật toán băm giải quyết các bài toán khác nhau: mã hóa đối xứng dùng để bảo vệ khối lượng lớn dữ liệu; mật mã bất đối xứng dùng để thương lượng khóa, mã hóa hoặc ký số; thuật toán băm dùng để tạo bản tóm lược kiểm tra toàn vẹn.

#### Tổ chức bên thứ ba và cơ chế chứng chỉ số có tác dụng gì?

Vẫn còn một vấn đề: nếu lúc này Sum chối bỏ việc từng đưa public key và hợp đồng cho Mike thì sao?

Do đó Sum cần có uy tín bảo chứng cho những việc mình làm, và đây là lúc cần đến **Tổ chức bên thứ ba và cơ chế chứng chỉ số (Certificate Authority - CA)**.

Chứng chỉ sở dĩ có độ tin cậy là nhờ bên cấp phát chứng chỉ có uy tín. Nếu Sum muốn Mike tin nhận public key của mình, Sum sẽ không trực tiếp đưa public key cho Mike, mà cung cấp một chứng chỉ chứa public key do tổ chức bên thứ ba uy tín cấp. Nếu Mike cũng tin tưởng tổ chức này, mối quan hệ tin cậy sẽ được xác lập.

![Quy trình tổ chức bên thứ ba cấp phát chứng chỉ và hoàn tất xác thực](/media/jg/ext/oss.javaguide.cn/p3-juejin/b1a3dbf87e3e41ff894f39512a10f66d-tplv-k3u1fbpfcp-71f33a71.png)

Như hình trên, Sum nộp đơn xin cấp chứng chỉ tới tổ chức CA. Sau khi thẩm định thông tin, CA dùng private key của mình để tạo chữ ký số cho phần nội dung chứng chỉ. Mike nhận được chứng chỉ liền dùng public key của tổ chức cấp phát để xác thực chữ ký; xác thực thành công chứng minh nội dung chứng chỉ chưa bị can thiệp và chữ ký do bên nắm giữ private key của CA tạo ra.

Mô hình PKI thực tế thường áp dụng cấu trúc phân tầng gồm CA gốc (Root CA), CA trung gian (Intermediate CA) và Chứng chỉ thực thể đầu cuối (End-Entity Certificate) để cách ly khóa riêng tư của CA gốc, ủy quyền cấp phát và giới hạn mục đích sử dụng chứng chỉ.

![Chuỗi tin cậy từ chứng chỉ gốc đến chứng chỉ đầu cuối](/media/jg/ext/oss.javaguide.cn/p3-juejin/1481f0409da94ba6bb0fee69bf0996f8-tplv-k3u1fbpfcp-b4001a32.png)

Trong hình trên, Root CA uy tín nhất cung cấp chứng chỉ gốc, sau đó Root CA ký cấp chứng chỉ cho cơ quan cấp hai; cơ quan cấp hai ký cấp chứng chỉ cho cơ quan cấp ba; cuối cùng cơ quan cấp ba ký cấp chứng chỉ cho Sum.

Khi xác thực chứng chỉ của Sum, dùng public key trong chứng chỉ của cơ quan cấp ba để xác thực chữ ký của Sum.
Khi xác thực chứng chỉ của cơ quan cấp ba, dùng public key trong chứng chỉ của cơ quan cấp hai để xác thực.
Khi xác thực chứng chỉ cơ quan cấp hai, dùng public key của Root CA tương ứng để xác thực. Client còn kiểm tra thời hạn hiệu lực, tên miền, mục đích sử dụng, ràng buộc đường dẫn, cuối cùng xác nhận xem chuỗi đường dẫn đó có neo vào Root CA đáng tin cậy trong kho tin cậy cục bộ hay không.

Những điều này cấu thành một chuỗi tin cậy chứng chỉ (certificate chain of trust).

### Làm thế nào để phòng tránh tấn công người đứng giữa?

Hiểu được nguyên lý và sự nguy hiểm của tấn công người đứng giữa, chúng ta hãy xem cách phòng tránh. Chắc hẳn ai trong chúng ta cũng từng gặp tình huống cảnh báo sau trên trình duyệt:

![Cảnh báo an toàn của trình duyệt thông báo chứng chỉ không đáng tin cậy](/media/jg/ext/oss.javaguide.cn/p3-juejin/0dde4b76be6240699312d822a3fe1ed3-tplv-k3u1fbpfcp-645eb908.png)

Cảnh báo chứng chỉ của trình duyệt biểu thị việc xác thực chứng chỉ không thành công. Nguyên nhân có thể do chứng chỉ hết hạn, không khớp tên miền, chuỗi chứng chỉ không đáng tin cậy, sai giờ hệ thống máy tính hoặc cấu hình máy chủ bị lỗi, và cũng có thể là do đang xảy ra tấn công người đứng giữa. Người dùng tuyệt đối không nên bỏ qua cảnh báo để tiếp tục truy cập.

Các ứng dụng chuyên dụng có thể cân nhắc ghim chứng chỉ hoặc public key (Certificate / Public Key Pinning) dưới mô hình đe dọa rõ ràng, nhưng cần thiết kế cơ chế xoay vòng chứng chỉ, khóa dự phòng và phục hồi khi lỗi. Với trình duyệt thông thường, phương pháp chuẩn xác là dựa vào kho tin cậy của hệ thống để hoàn thành việc kiểm tra chuỗi chứng chỉ, tên miền và tính hợp lệ.

## DDoS

Nhiều hình thức tấn công đã đề cập ở trên đều thuộc về tấn công DDoS.

Thực tế, hầu hết các công ty Internet lớn trên toàn cầu đều từng hứng chịu các đợt tấn công **DDoS** dữ dội.

Năm 2018, GitHub trong một khoảnh khắc đã hứng chịu cuộc tấn công với băng thông lên tới 1.35 Tbps, được coi là một trong những cuộc tấn công DDoS lớn nhất lịch sử Internet thời điểm đó. Chỉ một tuần sau, các cuộc tấn công DDoS tiếp tục nhắm vào Google, Amazon với băng thông cao nhất cũng đạt 1 Tbps.

### Tấn công DDoS thực chất là gì?

DDoS là viết tắt của **Distributed Denial of Service**, dịch sang tiếng Việt là **Từ chối dịch vụ phân tán**. Chỉ việc nhiều kẻ tấn công ở các vị trí địa lý khác nhau cùng lúc phát động tấn công vào một hoặc một số mục tiêu, là phương thức tấn công hiệp đồng quy mô lớn mang tính phân tán. Tấn công DoS đơn lẻ thường theo kiểu 1 đối 1, lợi dụng các khiếm khuyết của giao thức mạng và hệ điều hành, dùng chiến lược **lừa dối và ngụy trang** để gửi ngập tràn các thông tin yêu cầu phản hồi, vắt kiệt băng thông mạng hoặc tài nguyên hệ thống, khiến mạng hoặc hệ thống quá tải đến mức tê liệt và ngừng cung cấp dịch vụ thông thường.

> Lấy một ví dụ

Tôi mở một quán lẩu Trùng Khánh có 50 chỗ ngồi. Nhờ nguyên liệu hảo hạng, giá cả phải chăng nên khách khứa nườm nượp, làm ăn phát đạt; trong khi quán lẩu của Nhị Cẩu đối diện thì vắng như chùa Bà Đanh. Để đối phó với tôi, Nhị Cẩu nghĩ ra một kế: thuê 50 người kéo đến ngồi kín quán lẩu của tôi nhưng không hề gọi món, khiến các thực khách khác không thể vào ăn được.

Ví dụ trên chính là cuộc tấn công DDoS điển hình. Nhìn chung kẻ tấn công điều khiển "máy tính ma" (bot) phát động lượng lớn yêu cầu tới trang web mục tiêu trong thời gian ngắn, tiêu hao tài nguyên máy chủ của mục tiêu trên quy mô lớn khiến nó không thể phục vụ bình thường. Game online, tài chính Internet là những lĩnh vực có tỷ lệ hứng chịu tấn công DDoS rất cao.

Các phương thức tấn công rất đa dạng, ví dụ: **ICMP Flood**, **UDP Flood**, **NTP Flood**, **SYN Flood**, **Tấn công CC (Challenge Collapsar)**, **DNS Query Flood**, v.v.

### Làm thế nào để đối phó với tấn công DDoS?

#### Máy chủ phòng thủ cao (High-Defense Server)

Vẫn lấy ví dụ quán lẩu Trùng Khánh: máy chủ phòng thủ cao giống như việc tôi thuê thêm hai nhân viên bảo vệ cho quán lẩu, hai bảo vệ này bảo vệ quán không bị kẻ côn đồ quấy rối và định kỳ tuần tra xung quanh quán.

Máy chủ phòng thủ cao chỉ các máy chủ có năng lực phòng thủ phần cứng độc lập từ 50 Gbps trở lên, giúp trang web chống lại các cuộc tấn công từ chối dịch vụ, quét định kỳ các nút mạng chính.

#### Danh sách đen (Blacklist)

Đối mặt với những kẻ phá rối trong quán lẩu, tôi chụp ảnh lưu hồ sơ và cấm tiệt chúng bước chân vào quán; tuy nhiên đôi khi gặp người trông hơi giống cũng bị cấm cửa nhầm. Đó chính là thiết lập danh sách đen. Phương pháp này mang tinh thần "thà giết nhầm còn hơn bỏ sót", có thể chặn nhầm lưu lượng bình thường và ảnh hưởng đến hoạt động kinh doanh hợp lệ.

#### Làm sạch lưu lượng DDoS (DDoS Traffic Scrubbing)

Làm sạch **DDoS** giống như việc tôi phát hiện khách vào quán ngồi vài phút nhưng mãi không gọi món, tôi liền mời người đó ra khỏi quán.

Hệ thống làm sạch DDoS giám sát dữ liệu yêu cầu của người dùng theo thời gian thực, kịp thời phát hiện lưu lượng bất thường như tấn công DoS, và làm sạch loại bỏ lưu lượng bất thường đó mà không làm gián đoạn các nghiệp vụ thông thường.

#### Tăng tốc qua mạng phân phối nội dung (CDN)

Tăng tốc CDN có thể hiểu như sau: Để giảm bớt quấy rối, tôi chuyển hẳn quán lẩu sang hoạt động trực tuyến qua dịch vụ giao hàng mang về; như vậy kẻ côn đồ không biết quán nằm ở đâu và cũng không thể tới quấy rối được nữa.

Trong thực tế, dịch vụ CDN phân phối lưu lượng truy cập trang web tới các nút mạng biên (edge node), vừa che giấu IP thực của máy chủ gốc, vừa phân tán lưu lượng khi gặp tấn công **DDoS** tới các nút khác nhau, ngăn ngừa máy chủ nguồn bị sụp đổ.

## Tham khảo

- Tấn công HTTP Flood - Cloudflare: <https://www.cloudflare.com/zh-cn/learning/ddos/http-flood-ddos-attack/>
- Tấn công SYN Flood: <https://www.cloudflare.com/zh-cn/learning/ddos/syn-flood-ddos-attack/>
- Giả mạo IP là gì?: <https://www.cloudflare.com/zh-cn/learning/ddos/glossary/ip-spoofing/>
- DNS Flood là gì? | Tấn công DDoS DNS Flood: <https://www.cloudflare.com/zh-cn/learning/ddos/dns-flood-ddos-attack/>
