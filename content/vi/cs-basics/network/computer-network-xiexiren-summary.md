---
title: Tổng hợp nội dung giáo trình "Mạng máy tính" (Tạ Hy Nhân)
description: Ghi chép học tập dựa trên giáo trình "Mạng máy tính", hệ thống hóa các thuật ngữ và mô hình phân tầng cốt lõi, thuận tiện cho ôn tập cuối kỳ và củng cố kiến thức phỏng vấn.
category: Cơ sở máy tính
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: Mạng máy tính, Tạ Hy Nhân, thuật ngữ, mô hình phân tầng, liên kết, host, tổng hợp giáo trình
lang: vi
sourceRef: zh-ref/cs-basics/network/computer-network-xiexiren-summary.md
---

Bài viết này được tổng hợp từ ghi chép học tập môn Mạng máy tính vào năm hai đại học của tôi, phần lớn nội dung tham khảo từ cuốn [Mạng máy tính (Tái bản lần thứ 7)](https://www.elias.ltd/usr/local/etc/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C%EF%BC%88%E7%AC%AC7%E7%89%88%EF%BC%89%E8%B0%A2%E5%B8%8C%E4%BB%81.pdf) của giáo sư Tạ Hy Nhân (Xie Xiren).

Nội dung giáo trình mạng máy tính thường khá phân tán: thuật ngữ, phân tầng, liên kết dữ liệu, định tuyến, tầng vận chuyển, tầng ứng dụng đều cần phải xâu chuỗi lại với nhau. Để thuận tiện cho việc ôn tập, tôi đã tái cấu trúc lại ghi chép ban đầu và bổ sung thêm một số sơ đồ minh họa.

Bài viết này chủ yếu giải đáp các câu hỏi sau:

1. Các thuật ngữ cơ bản thường gặp trong mạng máy tính có ý nghĩa gì?
2. Làm thế nào để hiểu rõ mô hình phân tầng OSI và TCP/IP?
3. Tầng liên kết dữ liệu, tầng mạng, tầng vận chuyển và tầng ứng dụng giải quyết các vấn đề gì?
4. Khi ôn tập cuốn sách "Mạng máy tính", những khái niệm nào dễ gây nhầm lẫn nhất?

![Tổng quan sơ đồ kiến thức giáo trình "Mạng máy tính"](/media/jg/ext/oss.javaguide.cn/p3-juejin/fb5d8645cd55484ab0177f25a13e97db-tplv-k3u1fbpfcp-75ab03f4.png)

Câu hỏi liên quan: [Đánh giá cuốn Mạng máy tính (Tái bản lần 7) của Tạ Hy Nhân như thế nào? - Zhihu](https://www.zhihu.com/question/327872966).

## 1. Tổng quan về Mạng máy tính

### 1.1. Các thuật ngữ cơ bản

1. **Nút (Node)**: Nút trong mạng có thể là máy tính, hub, switch hoặc router, v.v.
2. **Liên kết (Link)**: Một đoạn đường truyền vật lý từ một nút đến một nút khác, ở giữa không có bất kỳ điểm giao nhau nào khác.
3. **Host (Máy chủ)**: Máy tính được kết nối vào mạng Internet.
4. **ISP (Internet Service Provider)**: Nhà cung cấp dịch vụ Internet.

   ![Định nghĩa ISP (Internet Service Provider)](/media/jg/ext/oss.javaguide.cn/p3-juejin/e77e26123d404d438d0c5943e3c65893-tplv-k3u1fbpfcp-b0fbf976.png)

5. **IXP (Internet eXchange Point)**: Điểm trao đổi Internet. Tác dụng chính của IXP là cho phép hai mạng kết nối trực tiếp và trao đổi các gói tin với nhau mà không cần chuyển tiếp qua một mạng thứ ba.

   ![Lưu lượng IXP trong sự kiện nhảy dù Stratos — RIPE Labs](/media/jg/ext/oss.javaguide.cn/p3-juejin/7f9a6ddaa09441ceac11cb77f7a69d8f-tplv-k3u1fbpfcp-cdd57d5c.png)

   <p style="text-align:center;font-size:13px;color:gray">https://labs.ripe.net/Members/fergalc/ixp-traffic-during-stratos-skydive</p>

6. **RFC (Request For Comments)**: Nghĩa là "Đề nghị bình luận", bao gồm hầu như toàn bộ tài liệu văn bản quan trọng liên quan đến Internet.
7. **Mạng diện rộng WAN (Wide Area Network)**: Nhiệm vụ là vận chuyển dữ liệu do các host gửi đi qua khoảng cách xa.
8. **Mạng đô thị MAN (Metropolitan Area Network)**: Dùng để liên kết nối nhiều mạng cục bộ (LAN) lại với nhau.
9. **Mạng cục bộ LAN (Local Area Network)**: Các trường học hoặc doanh nghiệp phần lớn đều sở hữu nhiều mạng LAN liên kết với nhau.

   ![MAN & WMAN | Mạng đô thị, Mạng máy tính, Cáp xoắn đôi](/media/jg/ext/oss.javaguide.cn/p3-juejin/eb48d21b2e984a63a26250010d7adac4-tplv-k3u1fbpfcp-fbea2861.png)

   <p style="text-align:center;font-size:13px;color:gray">http://conexionesmanwman.blogspot.com/</p>

10. **Mạng cá nhân PAN (Personal Area Network)**: Mạng kết nối các thiết bị điện tử thuộc sở hữu cá nhân tại nơi làm việc bằng công nghệ không dây.

    ![Ưu và nhược điểm của mạng cá nhân (PAN) - IT Release](/media/jg/ext/oss.javaguide.cn/p3-juejin/54bd7b420388494fbe917e3c9c13f1a7-tplv-k3u1fbpfcp-4a6942eb.png)

    <p style="text-align:center;font-size:13px;color:gray">https://www.itrelease.com/2018/07/advantages-and-disadvantages-of-personal-area-network-pan/</p>

11. **Gói tin (Packet)**: Đơn vị dữ liệu truyền tải trong Internet. Được cấu thành từ phần tiêu đề (header) và phần dữ liệu (data). Gói tin còn được gọi là pack, phần đầu gọi là packet header.
12. **Lưu trữ và chuyển tiếp (Store and Forward)**: Router nhận được một gói tin, trước tiên kiểm tra gói tin có chính xác không và lọc bỏ các lỗi xung đột. Sau khi xác định gói tin chính xác, nó lấy địa chỉ đích, tra bảng định tuyến để tìm địa chỉ cổng ra cần gửi, sau đó chuyển gói tin đó đi.

    ![Quá trình lưu trữ và chuyển tiếp gói tin của router](/media/jg/ext/oss.javaguide.cn/p3-juejin/addb6b2211444a4da9e0ffc129dd444f-tplv-k3u1fbpfcp-a64c3516.gif)

13. **Băng thông (Bandwidth)**: Trong mạng máy tính, chỉ "tốc độ dữ liệu tối đa" có thể đi qua từ một điểm này đến điểm khác trong mạng trên một đơn vị thời gian. Thường dùng để biểu thị khả năng truyền tải dữ liệu của đường truyền thông mạng. Đơn vị là "bit trên giây", ký hiệu là b/s hoặc bps.
14. **Thông lượng (Throughput)**: Lượng dữ liệu thực tế truyền qua một mạng (hoặc kênh truyền, giao diện) trong một đơn vị thời gian. Thông lượng thường dùng để đo lường mạng trong thực tế nhằm biết được thực tế có bao nhiêu dữ liệu có thể đi qua mạng. Thông lượng bị giới hạn bởi băng thông hoặc tốc độ định mức của mạng.

### 1.2. Tổng hợp các điểm kiến thức quan trọng

1. **Mạng máy tính (gọi tắt là mạng) kết nối nhiều máy tính lại với nhau, còn Internet kết nối nhiều mạng lại với nhau, là "mạng của các mạng" (network of networks).**
2. Từ `internet` viết bằng chữ thường là danh từ chung, chỉ mạng được tạo thành bằng cách kết nối nhiều mạng máy tính lại với nhau. Giao thức truyền thông giữa các mạng này có thể là tùy ý. Từ `Internet` viết hoa là danh từ riêng, chỉ mạng internet toàn cầu lớn nhất, mở, được kết nối từ vô số mạng và sử dụng bộ giao thức TCP/IP làm quy tắc truyền thông, tiền thân của nó là ARPANET.
3. Router là thiết bị cấu thành then chốt để thực hiện chuyển mạch gói (packet switching), nhiệm vụ của nó là chuyển tiếp các gói tin nhận được, đây là chức năng quan trọng nhất của phần lõi mạng. Chuyển mạch gói sử dụng kỹ thuật lưu trữ và chuyển tiếp, nghĩa là chia một thông điệp (toàn bộ khối dữ liệu cần gửi) thành các gói tin nhỏ trước khi truyền. Trước khi gửi, thông điệp dài được chia thành các đoạn dữ liệu nhỏ hơn có độ dài bằng nhau. Phía trước mỗi đoạn dữ liệu được thêm phần tiêu đề chứa các thông tin điều khiển cần thiết, tạo thành một gói tin. Gói tin là đơn vị truyền tải dữ liệu trong Internet; nhờ có tiêu đề chứa các thông tin điều khiển quan trọng như địa chỉ nguồn và địa chỉ đích, mỗi gói tin mới có thể độc lập lựa chọn đường đi trong Internet và được phân phối chính xác tới điểm kết thúc truyền dẫn.
4. Theo phương thức hoạt động, Internet được chia thành phần rìa (edge) và phần lõi (core). Các host nằm ở phần rìa của mạng, có tác dụng xử lý thông tin. Phần lõi bao gồm rất nhiều mạng và các router kết nối các mạng này lại, có tác dụng cung cấp tính kết nối và chuyển mạch.
5. Truyền thông máy tính thực chất là truyền thông giữa các tiến trình (các chương trình đang chạy) bên trong máy tính. Phương thức truyền thông mà mạng máy tính áp dụng gồm mô hình Client-Server (C/S) và mô hình ngang hàng (P2P - Peer-to-Peer).
6. Client và server đều chỉ các tiến trình ứng dụng tham gia vào quá trình truyền thông. Client là bên yêu cầu dịch vụ, server là bên cung cấp dịch vụ.
7. Dựa theo phạm vi hoạt động, mạng máy tính được chia thành: Mạng diện rộng WAN, Mạng đô thị MAN, Mạng cục bộ LAN, Mạng cá nhân PAN.
8. **Các chỉ số hiệu năng thường dùng nhất trong mạng máy tính gồm: Tốc độ (rate), Băng thông (bandwidth), Thông lượng (throughput), Độ trễ (delay - gồm trễ truyền truyền tải, trễ lan truyền, trễ xử lý, trễ xếp hàng), Tích số trễ-băng thông (bandwidth-delay product), Thời gian khứ hồi (RTT - Round-Trip Time) và Tỷ lệ sử dụng kênh truyền (channel utilization).**
9. Giao thức mạng (gọi tắt là giao thức) là tập hợp các quy tắc được thiết lập để thực hiện trao đổi dữ liệu trong mạng. Các tầng của mạng máy tính cùng với tập hợp các giao thức của chúng được gọi là kiến trúc mạng (network architecture).
10. **Kiến trúc mạng 5 tầng bao gồm: Tầng ứng dụng, Tầng vận chuyển, Tầng mạng (tầng Internet), Tầng liên kết dữ liệu, Tầng vật lý. Các giao thức chủ yếu của tầng vận chuyển là TCP và UDP, giao thức quan trọng nhất của tầng mạng là IP.**

![Tổng quan kiến trúc mạng máy tính 5 tầng](/media/jg/ext/oss.javaguide.cn/p3-juejin/acec0fa44041449b8088872dcd7c0b3a-tplv-k3u1fbpfcp-fb3c59d8.gif)

Nội dung bên dưới sẽ giới thiệu chi tiết kiến trúc 5 tầng của mạng máy tính: **Tầng vật lý + Tầng liên kết dữ liệu + Tầng mạng + Tầng vận chuyển + Tầng ứng dụng**.

## 2. Tầng vật lý (Physical Layer)

![Tầng vật lý](/media/jg/ext/oss.javaguide.cn/p3-juejin/cf1bfdd36e5f4bde94aea44bbe7a6f8a-tplv-k3u1fbpfcp-60b1e566.png)

### 2.1. Các thuật ngữ cơ bản

1. **Dữ liệu (data)**: Thực thể mang tải tin tức.
2. **Tín hiệu (signal)**: Biểu hiện dạng điện hoặc điện từ của dữ liệu. Hay nói cách khác, tín hiệu là đối tượng phù hợp để truyền trên môi trường truyền dẫn.
3. **Mã nguyên / Ký hiệu (Symbol / Code element)**: Dạng sóng cơ bản đại diện cho các giá trị rời rạc khác nhau khi sử dụng dạng sóng miền thời gian (time-domain) để biểu thị tín hiệu số.
4. **Đơn công (simplex)**: Chỉ có thể truyền thông theo một hướng duy nhất, không có tương tác ngược lại.
5. **Bán song công (half-duplex)**: Cả hai bên đều có thể gửi tin tức, nhưng không thể cùng gửi tại một thời điểm (và cũng không thể cùng nhận tại một thời điểm).
6. **Song công toàn phần (full-duplex)**: Cả hai bên có thể đồng thời vừa gửi vừa nhận thông tin.

   ![So sánh các phương thức truyền thông đơn công, bán song công và song công toàn phần](/media/jg/ext/oss.javaguide.cn/p3-juejin/b1f02095b7c34eafb3c255ee81f58c2a-tplv-k3u1fbpfcp-e7591485.png)

7. **Méo dạng (Distortion)**: Sự mất đi tính chân thực, chủ yếu chỉ tín hiệu nhận được khác với tín hiệu phát đi do suy hao và tán xạ. Các yếu tố ảnh hưởng đến mức độ méo dạng: (1) Tốc độ truyền mã nguyên, (2) Khoảng cách truyền tín hiệu, (3) Nhiễu tạp âm, (4) Chất lượng môi trường truyền dẫn.

   ![Sơ đồ méo dạng tín hiệu khi truyền dẫn](/media/jg/ext/oss.javaguide.cn/p3-juejin/f939342f543046459ffabdc476f7bca4-tplv-k3u1fbpfcp-d0467d64.png)

8. **Tiêu chuẩn Nyquist (Nyquist Criterion)**: Trong bất kỳ kênh truyền nào, hiệu suất truyền mã nguyên đều có giới hạn trên. Nếu tốc độ truyền vượt quá giới hạn này, hiện tượng giao thoa giữa các ký hiệu (Inter-Symbol Interference - ISI) nghiêm trọng sẽ xảy ra, khiến phía nhận không thể nhận diện được mã nguyên.
9. **Định lý Shannon (Shannon's Theorem)**: Trong một kênh truyền bị giới hạn băng thông và có nhiễu, tốc độ truyền dữ liệu tối đa không gây ra lỗi có một giá trị giới hạn trên.
10. **Tín hiệu băng tần cơ sở (Baseband signal)**: Tín hiệu phát ra từ nguồn tin, chỉ tín hiệu số hoặc tương tự chưa qua điều chế.
11. **Tín hiệu dải thông (Bandpass signal)**: Tín hiệu băng tần cơ sở sau khi được điều chế sóng mang sẽ dịch chuyển dải tần số lên dải tần số cao hơn để truyền trong kênh (tức chỉ có thể đi qua kênh trong một khoảng dải tần nhất định). Tín hiệu sau khi điều chế chính là tín hiệu dải thông.
12. **Điều chế (modulation)**: Quá trình xử lý thông tin từ nguồn tín hiệu rồi đưa lên sóng mang để biến thành dạng phù hợp cho việc truyền tải trên kênh truyền.
13. **Tỷ số tín hiệu trên nhiễu (Signal-to-Noise Ratio - SNR)**: Tỷ số giữa công suất trung bình của tín hiệu và công suất trung bình của nhiễu, ký hiệu là S/N. SNR (dB) = 10 * log10(S/N).
14. **Ghép kênh (Channel multiplexing)**: Nhiều người dùng cùng chia sẻ chung một kênh truyền (không nhất thiết phải đồng thời).

    ![Kỹ thuật ghép kênh](/media/jg/ext/oss.javaguide.cn/p3-juejin/5d9bf7b3db324ae7a88fcedcbace45d8-tplv-k3u1fbpfcp-4a782d37.png)

15. **Tốc độ bit (bit rate)**: Số bit truyền được trong một đơn vị thời gian (mỗi giây).
16. **Tốc độ baud (baud rate)**: Số lần trạng thái điều chế sóng mang thay đổi trong một đơn vị thời gian. Đo lường tốc độ điều chế sóng mang bởi tín hiệu dữ liệu.
17. **Ghép kênh (multiplexing)**: Phương pháp chia sẻ kênh truyền.
18. **ADSL (Asymmetric Digital Subscriber Line)**: Đường dây thuê bao số bất đối xứng.
19. **Mạng lai cáp-quang (HFC - Hybrid Fiber-Coaxial)**: Mạng truy cập băng rộng cho hộ gia đình được phát triển trên nền tảng mạng truyền hình cáp có độ bao phủ rộng khắp hiện nay.

### 2.2. Tổng hợp các điểm kiến thức quan trọng

1. **Nhiệm vụ chính của tầng vật lý là xác định các đặc tính liên quan đến giao diện với môi trường truyền dẫn, bao gồm đặc tính cơ học, đặc tính điện, đặc tính chức năng và đặc tính thủ tục.**
2. Một hệ thống truyền thông dữ liệu có thể chia làm 3 phần lớn: hệ thống nguồn, hệ thống truyền dẫn, hệ thống đích. Hệ thống nguồn gồm điểm nguồn (hoặc trạm nguồn, nguồn tin) và bộ phát; hệ thống đích gồm bộ thu và điểm đích.
3. **Mục đích của truyền thông là truyền tải thông điệp. Tiếng nói, văn bản, hình ảnh đều là thông điệp; dữ liệu là thực thể mang tải thông điệp; tín hiệu là biểu hiện điện hoặc điện từ của dữ liệu.**
4. Dựa vào cách nhận giá trị của tham số đại diện cho thông điệp trong tín hiệu, tín hiệu được chia thành tín hiệu tương tự (analog/liên tục) và tín hiệu số (digital/rời rạc). Khi dùng dạng sóng trong miền thời gian biểu thị tín hiệu số, dạng sóng cơ bản đại diện cho các giá trị rời rạc khác nhau gọi là mã nguyên (symbol).
5. Dựa theo phương thức tương tác thông tin của hai bên, truyền thông chia làm truyền thông một chiều (đơn công), truyền thông luân phiên hai chiều (bán song công) và truyền thông đồng thời hai chiều (song công toàn phần).
6. Tín hiệu từ nguồn phát ra gọi là tín hiệu băng tần cơ sở. Tín hiệu muốn truyền trên kênh thì phải qua điều chế. Điều chế chia làm điều chế băng tần cơ sở và điều chế dải thông. Các phương pháp điều chế dải thông cơ bản gồm: điều biên (AM), điều tần (FM) và điều pha (PM). Ngoài ra còn có các phương pháp phức tạp hơn như điều chế biên độ trực giao (QAM).
7. Để nâng cao tốc độ truyền dữ liệu trên kênh, có thể dùng môi trường truyền dẫn tốt hơn hoặc áp dụng kỹ thuật điều chế tiên tiến, nhưng tốc độ truyền dữ liệu không thể tăng lên tùy tiện vô hạn.
8. Môi trường truyền dẫn chia thành 2 loại lớn: môi trường có định hướng (cáp xoắn đôi, cáp đồng trục, cáp quang) và môi trường không định hướng (sóng vô tuyến, hồng ngoại, laser trong khí quyển).
9. Để tận dụng hiệu quả tài nguyên sợi quang, mạng quang thụ động (PON) được sử dụng rộng rãi giữa đường trục cáp quang và người dùng. Mạng PON không cần nguồn điện ngoài, chi phí vận hành và quản lý lâu dài rất thấp. Phổ biến nhất là EPON (Ethernet PON) và GPON (Gigabit PON).

### 2.3. Bổ sung

#### 2.3.1. Tầng vật lý chủ yếu làm gì?

Việc cốt lõi tầng vật lý làm là **truyền bitstream một cách trong suốt (transparent transmission)**. Ta cũng có thể mô tả nhiệm vụ chính của tầng vật lý là xác định các đặc tính giao diện với môi trường truyền dẫn: đặc tính cơ học (kích thước, hình dạng đầu cắm), đặc tính điện (dải điện áp trên các chân cáp), đặc tính chức năng (ý nghĩa của mức điện áp nhất định trên một dây tín hiệu), đặc tính thủ tục (trình tự xuất hiện các sự kiện khi thực hiện các chức năng khác nhau).

**Tầng vật lý quan tâm đến việc làm thế nào để truyền bitstream dữ liệu trên môi trường truyền dẫn kết nối các máy tính, chứ không phải bản thân môi trường truyền dẫn cụ thể.** Thiết bị phần cứng và môi trường truyền dẫn trong mạng máy tính hiện nay vô cùng phong phú, phương thức truyền thông cũng đa dạng. Vai trò của tầng vật lý là che giấu tối đa sự khác biệt giữa các phương tiện truyền dẫn và phương thức truyền thông này, giúp tầng liên kết dữ liệu phía trên không cảm nhận được sự khác biệt đó, từ đó chỉ tập trung hoàn thành giao thức và dịch vụ của tầng mình.

#### 2.3.2. Một số kỹ thuật ghép kênh phổ biến

1. **Ghép kênh phân chia theo tần số (FDM - Frequency Division Multiplexing)**: Tất cả người dùng cùng lúc chiếm dụng các dải tần số khác nhau.
2. **Ghép kênh phân chia theo thời gian (TDM - Time Division Multiplexing)**: Tất cả người dùng chiếm dụng cùng một dải tần số ở các khoảng thời gian khác nhau (chia thời gian, không chia tần số).
3. **Ghép kênh phân chia theo thời gian thống kê (STDM - Statistical TDM)**: Bản cải tiến của TDM, nâng cao rõ rệt hiệu suất sử dụng kênh truyền.
4. **Ghép kênh phân chia theo mã (CDM - Code Division Multiplexing)**: Người dùng sử dụng các mẫu mã trực giao được chọn lọc đặc biệt, nhờ đó không gây can nhiễu lẫn nhau. Tín hiệu phát đi có khả năng chống nhiễu mạnh, phổ tương tự nhiễu trắng, khó bị đối phương phát hiện.
5. **Ghép kênh phân chia theo bước sóng (WDM - Wavelength Division Multiplexing)**: Thực chất là ghép kênh theo tần số của ánh sáng trong sợi quang.

#### 2.3.3. Một số công nghệ truy cập băng rộng phổ biến (chủ yếu là ADSL và FTTx)

Các phương thức truy cập băng rộng của người dùng vào Internet gồm: Đường dây thuê bao số bất đối xứng ADSL (dùng công nghệ số cải tạo đường dây điện thoại analog hiện có mà không cần đi dây lại; phiên bản tốc độ cao là VDSL), Mạng lai cáp-quang HFC (phát triển trên nền tảng mạng truyền hình cáp phủ sóng rộng), và FTTx (Cáp quang tới...).

## 3. Tầng liên kết dữ liệu (Data Link Layer)

![Tầng liên kết dữ liệu](/media/jg/ext/oss.javaguide.cn/p3-juejin/83ec6dafc8c14ca185bafb656d86f0b2-tplv-k3u1fbpfcp-6e2933c8.png)

### 3.1. Các thuật ngữ cơ bản

1. **Liên kết (Link)**: Một đoạn liên kết vật lý từ một nút đến một nút liền kề.
2. **Liên kết dữ liệu (Data Link)**: Khi bổ sung phần cứng và phần mềm thực thi giao thức điều khiển truyền tải dữ liệu vào liên kết vật lý thì cấu thành liên kết dữ liệu.
3. **Kiểm tra phần dư tuần hoàn (CRC - Cyclic Redundancy Check)**: Nhằm đảm bảo độ tin cậy của việc truyền dữ liệu, CRC là kỹ thuật kiểm tra lỗi được sử dụng rộng rãi ở tầng liên kết dữ liệu.
4. **Khung (Frame)**: Đơn vị truyền tải của tầng liên kết dữ liệu, là đơn vị dữ liệu giao thức (PDU) gồm phần tiêu đề (header) của tầng liên kết dữ liệu và gói dữ liệu được đóng gói bên trong.
5. **MTU (Maximum Transfer Unit)**: Đơn vị truyền tải tối đa. Giới hạn trên về độ dài phần dữ liệu của một khung.
6. **Tỷ lệ lỗi bit (BER - Bit Error Rate)**: Tỷ lệ giữa số bit bị lỗi trên tổng số bit đã truyền trong một khoảng thời gian nhất định.
7. **PPP (Point-to-Point Protocol)**: Giao thức điểm-điểm. Giao thức tầng liên kết dữ liệu được sử dụng khi máy tính của người dùng truyền thông với ISP. Dưới đây là sơ đồ cấu trúc khung PPP:
   ![Định dạng khung giao thức điểm-điểm PPP](/media/jg/ext/oss.javaguide.cn/p3-juejin/6b0310d3103c4149a725a28aaf001899-tplv-k3u1fbpfcp-30e5ed59.jpg)
8. **Địa chỉ MAC (Media Access Control Address)**: Địa chỉ điều khiển truy cập môi trường, hay còn gọi là địa chỉ vật lý, địa chỉ phần cứng, dùng để xác định vị trí của thiết bị mạng. Trong mô hình OSI, tầng 3 (tầng mạng) chịu trách nhiệm về địa chỉ IP, tầng 2 (tầng liên kết dữ liệu) chịu trách nhiệm về địa chỉ MAC. Do đó một host có một địa chỉ MAC, và mỗi vị trí mạng có một địa chỉ IP riêng. Địa chỉ là định danh quan trọng: "Tên chỉ ra tài nguyên chúng ta đang tìm, địa chỉ chỉ ra nơi tài nguyên tọa lạc, định tuyến chỉ cho chúng ta biết làm thế nào để đến nơi đó."

   ![Giải thích giao thức phân giải địa chỉ ARP](/media/jg/ext/oss.javaguide.cn/p3-juejin/057b83e7ec5b4c149e56255a3be89141-tplv-k3u1fbpfcp-f47c6d8a.png)

9. **Bridge (Cầu nối)**: Thiết bị liên mạng hoạt động ở tầng liên kết dữ liệu dùng để trung chuyển và kết nối hai hoặc nhiều mạng LAN.
10. **Switch (Bộ chuyển mạch)**: Theo nghĩa rộng, switch chỉ thiết bị thực hiện trao đổi thông tin trong hệ thống truyền thông. Ở tầng liên kết dữ liệu, switch thường chỉ switching hub, thực chất là một bridge có nhiều cổng.

### 3.2. Tổng hợp các điểm kiến thức quan trọng

1. Liên kết là một đoạn liên kết vật lý từ một nút đến nút liền kề, còn liên kết dữ liệu bổ sung thêm phần cứng cần thiết (như card mạng) và phần mềm (như triển khai giao thức) trên cơ sở liên kết đó.
2. Tầng liên kết dữ liệu sử dụng chủ yếu hai loại kênh: **kênh điểm-điểm (point-to-point)** và **kênh phát thanh/quảng bá (broadcast)**.
3. Đơn vị dữ liệu giao thức mà tầng liên kết dữ liệu truyền tải là khung (frame). Ba vấn đề cơ bản của tầng liên kết dữ liệu là: **Đóng khung (framing)**, **Truyền trong suốt (transparent transmission)** và **Kiểm tra sai số (error detection)**.
4. **Kiểm tra phần dư tuần hoàn CRC** là một phương pháp kiểm tra lỗi, còn chuỗi kiểm tra khung FCS (Frame Check Sequence) là mã dư thừa được thêm vào phía sau dữ liệu.
5. **Giao thức điểm-điểm PPP** là giao thức được sử dụng nhiều nhất ở tầng liên kết dữ liệu. Đặc điểm của nó: đơn giản, chỉ phát hiện lỗi chứ không sửa lỗi, không dùng số thứ tự, không kiểm soát luồng, hỗ trợ đồng thời nhiều giao thức tầng mạng.
6. PPPoE là giao thức tầng liên kết dùng cho các host truy cập Internet băng rộng.
7. **Ưu điểm của mạng LAN: có tính năng quảng bá (broadcast), từ một trạm có thể dễ dàng truy cập toàn mạng; thuận tiện cho việc mở rộng và nâng cấp hệ thống dần dần; nâng cao độ tin cậy, tính khả dụng và khả năng sống sót của hệ thống.**
8. Máy tính truyền thông với mạng LAN bên ngoài thông qua bộ điều hợp truyền thông (adapter mạng), hay còn gọi là Network Interface Card (NIC/card mạng). **Địa chỉ phần cứng của máy tính nằm trong ROM của adapter**.
9. Ethernet hoạt động theo phương thức không kết nối (connectionless), không đánh số các khung dữ liệu gửi đi và cũng không yêu cầu đối phương gửi phản hồi xác nhận. Trạm đích nhận được khung bị lỗi sẽ bỏ đi, không làm gì thêm.
10. Giao thức Ethernet áp dụng là **CSMA/CD (Carrier Sense Multiple Access with Collision Detection - Đa truy cập cảm ứng sóng mang kèm phát hiện va chạm)**. Đặc điểm: **Nghe trước khi nói (truyền), vừa truyền vừa nghe, khi phát hiện có va chạm trên bus thì dừng phát ngay lập tức. Sau đó chờ một khoảng thời gian ngẫu nhiên theo thuật toán lùi (backoff) rồi mới gửi lại.** Do đó, mỗi trạm trong một khoảng thời gian ngắn sau khi gửi dữ liệu đều có nguy cơ gặp va chạm. Các trạm trên Ethernet tranh chấp kênh truyền bình đẳng như nhau.
11. Card mạng Ethernet có chức năng lọc, nó chỉ nhận các khung đơn công (unicast), khung quảng bá (broadcast) và khung đa truyền (multicast).
12. Sử dụng Hub có thể mở rộng mạng Ethernet ở tầng vật lý (mạng Ethernet sau khi mở rộng vẫn là một mạng duy nhất).

### 3.3. Bổ sung

1. Đặc điểm của kênh điểm-điểm và kênh quảng bá ở tầng liên kết dữ liệu, cùng đặc điểm các giao thức sử dụng cho hai loại kênh này (giao thức PPP và giao thức CSMA/CD).
2. Ba vấn đề cơ bản của tầng liên kết dữ liệu: **Đóng khung**, **Truyền trong suốt**, **Kiểm tra sai số**.
3. Địa chỉ phần cứng tầng MAC của Ethernet.
4. Vai trò và ngữ cảnh áp dụng của adapter, repeater, hub, bridge, switch Ethernet.

## 4. Tầng mạng (Network Layer)

![Tầng mạng](/media/jg/ext/oss.javaguide.cn/p3-juejin/775dc8136bec486aad4f1182c68f24cd-tplv-k3u1fbpfcp-a39e3384.png)

### 4.1. Các thuật ngữ cơ bản

1. **Mạch ảo (Virtual Circuit)**: Kênh truyền tải hai chiều trong suốt được thiết lập giữa các cổng logic hoặc vật lý của hai thiết bị đầu cuối. Mạch ảo biểu thị đây chỉ là một kết nối mang tính logic, các gói tin được chuyển tiếp dọc theo đường kết nối logic này theo phương thức lưu trữ và chuyển tiếp, chứ không thực sự thiết lập một kết nối vật lý cố định.
2. **IP (Internet Protocol)**: Giao thức IP là một trong hai giao thức quan trọng nhất trong bộ giao thức TCP/IP, là hạt nhân của tầng mạng trong kiến trúc TCP/IP. Đi kèm với nó còn có ARP, RARP, ICMP, IGMP.
3. **ARP (Address Resolution Protocol)**: Giao thức phân giải địa chỉ. ARP phân giải địa chỉ IP thành địa chỉ phần cứng (MAC).
4. **ICMP (Internet Control Message Protocol)**: Giao thức thông điệp điều khiển Internet (cho phép host hoặc router báo cáo các tình trạng lỗi và thông báo về các tình huống bất thường).
5. **Mặt nạ mạng con (Subnet Mask)**: Mặt nạ bit dùng để chỉ ra bit nào trong địa chỉ IP xác định mạng con chứa host và bit nào xác định bản thân host. Mặt nạ mạng con không thể tồn tại độc lập mà phải đi kèm với địa chỉ IP.
6. **CIDR (Classless Inter-Domain Routing)**: Định tuyến liên miền không phân lớp (đặc điểm là loại bỏ các khái niệm phân lớp địa chỉ truyền thống Class A, B, C và phân chia mạng con, sử dụng "tiền tố mạng" (network-prefix) có độ dài linh hoạt thay cho số hiệu mạng và số hiệu mạng con).
7. **Định tuyến mặc định (Default Route)**: Tuyến đường mà router lựa chọn khi không tìm thấy đường đi tới địa chỉ đích trong bảng định tuyến. Định tuyến mặc định còn giúp giảm không gian lưu trữ và thời gian tra cứu bảng định tuyến.
8. **Thuật toán định tuyến (Routing Algorithm)**: Phần cốt lõi của giao thức định tuyến. Internet áp dụng các giao thức định tuyến thích ứng và phân cấp.

### 4.2. Tổng hợp các điểm kiến thức quan trọng

1. **Tầng mạng trong bộ giao thức TCP/IP chỉ cung cấp dịch vụ datagram linh hoạt, đơn giản, không kết nối và nỗ lực tối đa (best-effort) cho tầng trên. Tầng mạng không cam kết chất lượng dịch vụ (QoS), không bảo đảm thời hạn phân phối gói tin, các gói tin truyền tải có thể bị lỗi, mất, trùng lặp hoặc đảo lộn thứ tự. Tính tin cậy của truyền thông giữa các tiến trình do tầng vận chuyển chịu trách nhiệm.**
2. Trong Internet có hai phương thức phân phối: phân phối trực tiếp trong cùng một mạng mà không cần qua router, và phân phối gián tiếp đến mạng khác phải đi qua ít nhất một router, nhưng lần phân phối cuối cùng chắc chắn là phân phối trực tiếp.
3. Địa chỉ IP phân lớp gồm trường số hiệu mạng (xác định mạng) và trường số hiệu host (xác định host). Các bit đầu tiên của trường số hiệu mạng xác định lớp của địa chỉ IP. Địa chỉ IP là cấu trúc địa chỉ có tính phân cấp. Cơ quan quản lý địa chỉ IP khi cấp phát chỉ cấp số hiệu mạng, số hiệu host do đơn vị nhận mạng tự gán. Router chuyển tiếp gói tin dựa theo số hiệu mạng mà host đích kết nối tới. Một router kết nối tới ít nhất hai mạng, nên một router phải có ít nhất hai địa chỉ IP khác nhau.
4. Gói tin IP (IP datagram) gồm phần tiêu đề (header) và phần dữ liệu. Phần đầu tiên của tiêu đề có độ dài cố định 20 byte, là phần bắt buộc của mọi gói tin IP (chứa các trường quan trọng như địa chỉ nguồn, địa chỉ đích, tổng độ dài, v.v.). Các trường tùy chọn có độ dài biến thiên nằm sau phần tiêu đề cố định. Trường TTL (Time To Live) trong tiêu đề IP xác định số router tối đa mà gói tin IP có thể đi qua trong Internet, ngăn ngừa gói tin IP quay vòng luẩn quẩn vô tận trong mạng.
5. **Giao thức phân giải địa chỉ ARP giải địa chỉ IP thành địa chỉ phần cứng. Bộ nhớ đệm ARP (ARP cache) giúp giảm đáng kể lưu lượng thông tin trên mạng, vì host có thể trực tiếp lấy địa chỉ phần cứng đã lưu trong cache khi liên lạc lại với host cùng địa chỉ mà không cần gửi gói tin yêu cầu ARP dạng broadcast nữa.**
6. CIDR là giải pháp tốt để giải quyết tình trạng khan hiếm địa chỉ IP trước đây. Ký hiệu CIDR thêm dấu gạch chéo `/` sau địa chỉ IP rồi ghi số bit của tiền tố. Tiền tố (tiền tố mạng) dùng để xác định mạng, phần sau là hậu tố dùng để xác định host. CIDR gom các địa chỉ IP liên tục có cùng tiền tố thành một "khối địa chỉ CIDR", việc cấp phát IP đều lấy khối địa chỉ CIDR làm đơn vị.
7. Giao thức thông điệp điều khiển Internet (ICMP) là giao thức thuộc tầng IP. Bản tin ICMP được đóng gói vào phần dữ liệu của gói tin IP rồi gửi đi. Việc sử dụng ICMP không phải nhằm đạt được truyền tải tin cậy. ICMP cho phép host hoặc router báo cáo lỗi và các tình huống bất thường. Bản tin ICMP chia làm 2 loại: bản tin báo cáo lỗi ICMP và bản tin truy vấn ICMP.
8. **Để giải quyết triệt để vấn đề cạn kiệt địa chỉ IP, biện pháp căn bản nhất là sử dụng phiên bản IP mới có không gian địa chỉ lớn hơn: IPv6.** Những cải tiến mà IPv6 mang lại gồm: (1) Không gian địa chỉ khổng lồ (sử dụng địa chỉ 128 bit), (2) Định dạng tiêu đề linh hoạt, (3) Cải tiến các tùy chọn, (4) Hỗ trợ cắm-và-chạy (plug-and-play), (5) Hỗ trợ cấp phát trước tài nguyên, (6) Tiêu đề IPv6 đổi thành căn chỉnh 8 byte.
9. **Mạng riêng ảo VPN (Virtual Private Network) tận dụng mạng Internet công cộng làm môi trường truyền dẫn giữa các mạng nội bộ của tổ chức. Bên trong VPN sử dụng các địa chỉ IP private. Một VPN phải có ít nhất một router sở hữu địa chỉ IP public hợp lệ để có thể liên lạc với VPN khác của tổ chức qua Internet. Mọi dữ liệu truyền qua Internet đều phải được mã hóa.**
10. Đặc điểm của MPLS gồm: (1) Hỗ trợ chất lượng dịch vụ theo hướng kết nối, (2) Hỗ trợ kỹ thuật điều lượng (traffic engineering) để cân bằng tải mạng, (3) Hỗ trợ hiệu quả cho VPN. Tại nút cổng vào (ingress), MPLS gán nhãn có độ dài cố định vào mỗi gói IP, sau đó chuyển tiếp bằng phần cứng ở tầng 2 dựa vào nhãn (chuyển mạch nhãn trong router LSR), nhờ đó tốc độ chuyển tiếp tăng lên rất nhiều.

## 5. Tầng vận chuyển (Transport Layer)

![Tầng vận chuyển](/media/jg/ext/oss.javaguide.cn/p3-juejin/9fe85e137e7f4f03a580512200a59609-tplv-k3u1fbpfcp-7ce3257f.png)

### 5.1. Các thuật ngữ cơ bản

1. **Tiến trình (process)**: Thực thể chương trình đang chạy trong máy tính.
2. **Truyền thông giữa các tiến trình ứng dụng**: Quá trình tiến trình trên một host trao đổi dữ liệu với tiến trình trên một host khác (lưu ý điểm mút thực sự của truyền thông không phải là host mà là các tiến trình trong host, nghĩa là truyền thông đầu-cuối (end-to-end) là truyền thông giữa các tiến trình ứng dụng).
3. **Ghép kênh và phân kênh ở tầng vận chuyển (Multiplexing and Demultiplexing)**: Ghép kênh nghĩa là các tiến trình gửi khác nhau đều có thể truyền dữ liệu qua cùng một giao thức tầng vận chuyển. Phân kênh nghĩa là tầng vận chuyển phía nhận sau khi bóc tách phần tiêu đề có thể phân phối chính xác dữ liệu đến tiến trình ứng dụng đích.
4. **TCP (Transmission Control Protocol)**: Giao thức điều khiển truyền vận.
5. **UDP (User Datagram Protocol)**: Giao thức dữ liệu người dùng.

   ![TCP và UDP](/media/jg/ext/oss.javaguide.cn/p3-juejin/b136e69e0b9b426782f77623dcf098bd-tplv-k3u1fbpfcp-2b0825a3.png)

6. **Cổng (Port)**: Mục đích của cổng là để xác định tiến trình nào của máy đối phương đang tương tác với mình. Ví dụ cổng của MSN và QQ khác nhau; nếu không có cổng có thể xảy ra tình trạng nhầm lẫn giữa tiến trình QQ và MSN. Cổng còn gọi là số hiệu cổng giao thức (protocol port number).
7. **Giao thức dừng và chờ (Stop-and-Wait)**: Phía gửi sau khi gửi xong một gói tin sẽ dừng lại chờ phản hồi xác nhận từ đối phương, nhận được xác nhận rồi mới gửi gói tin tiếp theo.
8. **Kiểm soát luồng (Flow Control)**: Điều tiết tốc độ gửi của bên phát không quá nhanh, vừa để bên nhận kịp xử lý, vừa tránh gây tắc nghẽn mạng.
9. **Kiểm soát tắc nghẽn (Congestion Control)**: Ngăn không cho quá nhiều dữ liệu bị đẩy vào mạng, tránh làm các router hoặc liên kết trong mạng bị quá tải. Việc kiểm soát tắc nghẽn luôn có tiền đề là mạng có thể chịu được tải trọng mạng hiện có.

### 5.2. Tổng hợp các điểm kiến thức quan trọng

1. **Tầng vận chuyển cung cấp truyền thông logic giữa các tiến trình ứng dụng, tức là truyền thông ở tầng vận chuyển không phải là truyền trực tiếp giữa hai tầng vận chuyển trong thực tế. Tầng vận chuyển che giấu chi tiết mạng bên dưới (như cấu trúc liên kết, giao thức định tuyến) đối với tầng ứng dụng, làm cho các tiến trình ứng dụng cảm nhận như có một kênh truyền thông logic đầu-cuối nối giữa hai thực thể tầng vận chuyển.**
2. **Tầng mạng cung cấp truyền thông logic giữa các máy chủ (host), còn tầng vận chuyển cung cấp truyền thông logic đầu-cuối giữa các tiến trình ứng dụng.**
3. Hai giao thức quan trọng của tầng vận chuyển là UDP và TCP. Theo thuật ngữ OSI, đơn vị dữ liệu truyền tải giữa hai thực thể vận chuyển ngang hàng gọi là TPDU (Transport Protocol Data Unit). Nhưng trong TCP/IP, tùy theo giao thức sử dụng là TCP hay UDP mà gọi tương ứng là TCP segment (đoạn TCP) hoặc UDP datagram (gói dữ liệu UDP).
4. **UDP trước khi truyền dữ liệu không cần thiết lập kết nối, host ở xa sau khi nhận được gói tin UDP không cần gửi lại bất kỳ xác nhận nào. Dù UDP không cung cấp truyền tải tin cậy, nhưng trong một số trường hợp UDP lại là phương thức hoạt động hiệu quả nhất. TCP cung cấp dịch vụ hướng kết nối: trước khi truyền dữ liệu bắt buộc phải thiết lập kết nối, truyền xong phải giải phóng kết nối. TCP không hỗ trợ dịch vụ quảng bá hoặc multicast. Vì TCP phải cung cấp truyền tải tin cậy, hướng kết nối nên phát sinh thêm nhiều chi phí phụ trợ như xác nhận, kiểm soát luồng, bộ định thời và quản lý kết nối. Điều này không chỉ làm tiêu đề gói dữ liệu tăng lên đáng kể mà còn tiêu tốn nhiều tài nguyên xử lý.**
5. Cổng phần cứng là giao diện tương tác giữa các thiết bị phần cứng khác nhau, còn cổng phần mềm là địa chỉ phục vụ tương tác liên tầng giữa các tiến trình giao thức tầng ứng dụng và thực thể tầng vận chuyển. Tiêu đề UDP và TCP đều có hai trường quan trọng là cổng nguồn và cổng đích. Khi tầng vận chuyển nhận được gói tin từ tầng IP đưa lên, nó căn cứ vào số hiệu cổng đích trong tiêu đề để chuyển giao dữ liệu tới tiến trình ứng dụng đích tương ứng.
6. Tầng vận chuyển dùng số hiệu cổng 16 bit để đánh dấu một cổng. Số hiệu cổng chỉ có ý nghĩa cục bộ, đánh dấu giao diện liên tầng khi các tiến trình ứng dụng tương tác với tầng vận chuyển. Trên các máy tính khác nhau trong Internet, các số hiệu cổng giống nhau không hề có liên quan gì tới nhau. Số hiệu cổng chia thành cổng phía máy chủ (0–1023 là các cổng chuẩn đã gán trước, 1024–49151 là cổng đăng ký) và cổng tạm thời phía máy khách (49152–65535).
7. **Đặc điểm chính của UDP: (1) Không kết nối, (2) Nỗ lực chuyển giao tối đa (best-effort), (3) Hướng thông điệp, (4) Không có kiểm soát tắc nghẽn, (5) Hỗ trợ truyền thông 1-1, 1-nhiều, nhiều-1 và nhiều-nhiều, (6) Tiêu đề rất nhỏ gọn (chỉ 4 trường: cổng nguồn, cổng đích, độ dài và checksum).**
8. **Đặc điểm chính của TCP: (1) Hướng kết nối, (2) Mỗi kết nối TCP chỉ là 1-1 (điểm-điểm), (3) Cung cấp truyền tải tin cậy, (4) Hỗ trợ truyền thông song công toàn phần, (5) Hướng dòng byte (byte stream).**
9. **TCP lấy địa chỉ IP của host cộng với số hiệu cổng trên host làm điểm mút của kết nối TCP. Điểm mút như vậy gọi là socket. Socket được biểu diễn dưới dạng `(địa chỉ IP : số cổng)`. Mỗi kết nối TCP được xác định duy nhất bởi hai điểm mút ở hai đầu truyền thông.**
10. Giao thức dừng và chờ nhằm thực hiện truyền tải tin cậy, nguyên lý cơ bản là gửi xong một gói tin thì dừng lại chờ xác nhận từ phía nhận, nhận được xác nhận mới gửi gói tiếp theo.
11. Để nâng cao hiệu suất truyền tải, bên gửi có thể áp dụng truyền theo đường ống (pipelining) thay vì dừng và chờ. Truyền theo đường ống cho phép bên gửi truyền liên tục nhiều gói tin mà không cần đợi xác nhận sau mỗi gói, giúp kênh truyền luôn có dữ liệu lưu thông liên tục, nâng cao rõ rệt hiệu suất sử dụng kênh truyền.
12. Cơ chế truyền lại khi quá hạn (timeout retransmission) trong giao thức dừng và chờ nghĩa là nếu sau một khoảng thời gian nhất định vẫn chưa nhận được xác nhận thì sẽ gửi lại gói tin vừa phát (cho rằng gói tin đã bị thất lạc). Mỗi gói gửi đi cần đặt một bộ định thời timeout, thời gian timeout dài hơn thời gian khứ hồi (RTT) trung bình của gói tin. Cơ chế tự động gửi lại này gọi là ARQ (Automatic Repeat reQuest). Ngoài ra, nếu nhận được gói tin trùng lặp thì bên nhận loại bỏ gói đó nhưng vẫn gửi xác nhận. Giao thức ARQ liên tục duy trì một cửa sổ gửi; các gói nằm trong cửa sổ gửi có thể được gửi liên tiếp mà không cần đợi xác nhận từng gói. Phía nhận thường áp dụng xác nhận lũy tích (cumulative ACK), gửi xác nhận cho gói tin cuối cùng đến đúng thứ tự.
13. Đoạn TCP có 20 byte đầu là tiêu đề cố định, phía sau có tối đa 40 byte tùy chọn. Nếu thêm phần tùy chọn mà tiêu đề không phải là bội số nguyên của 4 byte thì phải chèn thêm các byte 0 vào sau. Do đó độ dài tiêu đề TCP nằm trong khoảng 20 + 4n byte, tối đa 60 byte.
14. **TCP sử dụng cơ chế cửa sổ trượt (sliding window). Số thứ tự nằm trong cửa sổ gửi biểu thị dữ liệu được phép gửi. Phần phía sau mép sau cửa sổ gửi là dữ liệu đã gửi và đã nhận được xác nhận; phần phía trước mép trước là dữ liệu chưa được phép gửi. Kiểm soát luồng là điều tiết tốc độ gửi của bên phát để bên nhận kịp xử lý.**
15. Khi nhu cầu về một tài nguyên mạng vượt quá khả năng cung cấp của tài nguyên đó thì hiệu năng mạng sẽ suy giảm, hiện tượng này gọi là tắc nghẽn. Kiểm soát tắc nghẽn nhằm ngăn lượng dữ liệu quá mức đổ vào mạng làm router hoặc đường truyền bị quá tải. Kiểm soát tắc nghẽn là bài toán toàn cục liên quan đến tất cả các host và router; ngược lại kiểm soát luồng là bài toán điều tiết lưu lượng điểm-điểm (đầu-cuối).
16. **Để kiểm soát tắc nghẽn, bên gửi TCP duy trì một biến trạng thái là cửa sổ tắc nghẽn cwnd (congestion window). Kích thước của cwnd phụ thuộc vào mức độ tắc nghẽn của mạng và thay đổi động. Bên gửi sẽ đặt kích thước cửa sổ gửi bằng giá trị nhỏ hơn giữa cwnd và cửa sổ nhận rwnd của bên nhận.**
17. **Cơ chế kiểm soát tắc nghẽn của TCP sử dụng 4 thuật toán: Khởi động chậm (Slow Start), Tránh tắc nghẽn (Congestion Avoidance), Truyền lại nhanh (Fast Retransmit) và Phục hồi nhanh (Fast Recovery). Tại tầng mạng, router cũng có thể sử dụng các chính sách loại bỏ gói phù hợp (như Quản lý hàng đợi tích cực - AQM) để giảm tắc nghẽn mạng.**
18. Ba giai đoạn của kết nối vận chuyển gồm: Thiết lập kết nối, Truyền dữ liệu và Giải phóng kết nối.
19. **Tiến trình ứng dụng chủ động khởi tạo kết nối TCP gọi là Client, tiến trình bị động chờ kết nối gọi là Server. Quá trình thiết lập kết nối TCP áp dụng cơ chế bắt tay 3 bước (three-way handshake). Server xác nhận yêu cầu kết nối của Client, sau đó Client phải xác nhận lại phản hồi của Server.**
20. Quá trình giải phóng kết nối TCP áp dụng cơ chế bắt tay 4 bước (four-way wave/handshake). Bất kỳ bên nào cũng có thể gửi thông báo ngắt kết nối sau khi truyền xong dữ liệu, sau khi đối phương xác nhận sẽ chuyển sang trạng thái bán đóng (half-close). Khi bên kia cũng không còn dữ liệu cần gửi nữa thì gửi thông báo giải phóng kết nối, đối phương xác nhận xong thì kết nối TCP hoàn toàn đóng lại.

### 5.3. Bổ sung (Quan trọng)

Cần đặc biệt lưu ý các điểm kiến thức sau:

1. Ý nghĩa của Port và Socket
2. Sự khác biệt giữa UDP và TCP cùng ngữ cảnh ứng dụng của từng giao thức
3. Nguyên lý hoạt động đảm bảo truyền tải tin cậy trên nền mạng không tin cậy: Giao thức dừng và chờ, giao thức ARQ
4. Cửa sổ trượt, kiểm soát luồng, kiểm soát tắc nghẽn và quản lý kết nối của TCP
5. Cơ chế bắt tay 3 bước và bắt tay 4 bước giải phóng kết nối của TCP

## 6. Tầng ứng dụng (Application Layer)

![Tầng ứng dụng](/media/jg/ext/oss.javaguide.cn/p3-juejin/0f13f0ee13b24af7bdddf56162eb6602-tplv-k3u1fbpfcp-c797e298.png)

### 6.1. Các thuật ngữ cơ bản

1. **Hệ thống phân giải tên miền (DNS)**: DNS (Domain Name System) chuyển đổi tên miền dễ đọc đối với con người (ví dụ: `www.baidu.com`) thành địa chỉ IP mà máy móc có thể đọc được (ví dụ: `220.181.38.148`). Chúng ta có thể hiểu nó như cuốn danh bạ điện thoại được thiết kế riêng cho Internet.

   ![Quá trình DNS phân giải tên miền thành địa chỉ IP](/media/jg/ext/oss.javaguide.cn/p3-juejin/e7da4b07947f4c0094d46dc96a067df0-tplv-k3u1fbpfcp-b3e44fed.png)

   <p style="text-align:right;font-size:12px">https://www.seobility.net/en/wiki/HTTP_headers</p>

2. **Giao thức truyền file (FTP)**: FTP viết tắt của File Transfer Protocol, dùng để điều khiển truyền tải tệp tin hai chiều trên Internet. Đồng thời nó cũng là một chương trình ứng dụng. Trên các hệ điều hành khác nhau có các ứng dụng FTP khác nhau, nhưng tất cả đều tuân thủ cùng một giao thức. Người dùng thường gặp hai khái niệm: "Tải xuống" (Download - sao chép file từ máy chủ từ xa về máy mình) và "Tải lên" (Upload - sao chép file từ máy mình lên máy chủ từ xa).

   ![Quá trình hoạt động của FTP](/media/jg/ext/oss.javaguide.cn/p3-juejin/f3f2caaa361045a38fb89bb9fee15bd3-tplv-k3u1fbpfcp-4a96e799.png)

3. **Giao thức truyền file đơn giản (TFTP)**: TFTP (Trivial File Transfer Protocol) là một giao thức trong bộ TCP/IP dùng để truyền file đơn giản giữa client và server với chi phí phụ trợ thấp, không phức tạp. Sử dụng cổng 69.
4. **Giao thức đầu cuối từ xa (TELNET)**: Giao thức Telnet là giao thức chuẩn và phương thức chính cho dịch vụ đăng nhập từ xa trên Internet. Nó cung cấp cho người dùng khả năng làm việc trên máy chủ từ xa ngay tại máy tính cục bộ. Người dùng mở chương trình telnet, kết nối tới server và nhập lệnh, các lệnh này sẽ chạy trên máy chủ như khi thao tác trực tiếp trên console của server. Để bắt đầu một phiên telnet, người dùng phải nhập tên đăng nhập và mật khẩu.
5. **Mạng lưới toàn cầu (World Wide Web - WWW)**: WWW hay còn gọi là Web, gồm chương trình Web Client (thường là trình duyệt) và Web Server. WWW cho phép client truy cập và duyệt các trang tài liệu trên server. Đây là hệ thống gồm nhiều siêu văn bản (hypertext) liên kết với nhau và được truy cập qua Internet. Trong hệ thống này, mỗi tài nguyên hữu ích được định danh bằng một URI (Uniform Resource Identifier) toàn cầu; các tài nguyên này được truyền tải tới người dùng qua giao thức HTTP. Tổ chức W3C (World Wide Web Consortium) thành lập vào tháng 10 năm 1994 tại MIT bởi Tim Berners-Lee. WWW không đồng nhất với Internet; WWW chỉ là một trong các dịch vụ chạy trên nền tảng Internet.
6. **Quy trình hoạt động cơ bản của World Wide Web:**

   ![Quy trình hoạt động cơ bản của World Wide Web](/media/jg/ext/oss.javaguide.cn/p3-juejin/ba628fd37fdc4ba59c1a74eae32e03b1-tplv-k3u1fbpfcp-164a1a86.jpg)

7. **Bộ định vị tài nguyên thống nhất (URL - Uniform Resource Locator)**: Biểu diễn ngắn gọn vị trí và phương thức truy cập tài nguyên trên Internet, là địa chỉ tài nguyên chuẩn mực trên Internet. Mỗi file trên Internet có một URL duy nhất chỉ rõ vị trí file và cách trình duyệt xử lý file đó.
8. **Giao thức truyền siêu văn bản (HTTP - HyperText Transfer Protocol)**: Giao thức mạng được sử dụng rộng rãi nhất trên Internet. Tất cả tài liệu WWW đều phải tuân theo chuẩn này. Ban đầu HTTP được thiết kế để phát hành và tiếp nhận các trang HTML. Năm 1960, Ted Nelson người Mỹ đã đưa ra ý tưởng xử lý văn bản bằng máy tính gọi là siêu văn bản (hypertext), đặt nền móng cho kiến trúc tiêu chuẩn của HTTP sau này.

   Bản chất của giao thức HTTP là một định dạng giao tiếp được quy ước giữa trình duyệt và máy chủ. Nguyên lý của HTTP như hình minh họa dưới đây:

   ![Quá trình yêu cầu và phản hồi giữa HTTP Client và Server](/media/jg/ext/oss.javaguide.cn/p3-juejin/8e3efca026654874bde8be88c96e1783-tplv-k3u1fbpfcp-17ed6806.jpg)

9. **Máy chủ Proxy (Proxy Server)**: Thực thể mạng còn được gọi là bộ nhớ đệm Web. Proxy server lưu tạm các yêu cầu và phản hồi gần nhất trên ổ đĩa cục bộ. Khi có yêu cầu mới đến, nếu proxy thấy yêu cầu này trùng khớp với yêu cầu đã lưu, nó trả về phản hồi lưu tạm mà không cần truy cập lại tài nguyên trên Internet theo địa chỉ URL nữa. Proxy server có thể hoạt động ở phía client, phía server hoặc ở các hệ thống trung gian.
10. **Giao thức truyền thư đơn giản (SMTP - Simple Mail Transfer Protocol)**: Tập hợp các quy tắc dùng để chuyển thư từ địa chỉ nguồn đến địa chỉ đích, kiểm soát phương thức chuyển tiếp thư tín. Giao thức SMTP thuộc bộ TCP/IP, hỗ trợ mỗi máy tính tìm trạm tiếp theo khi gửi hoặc chuyển tiếp thư. Thông qua server chỉ định bởi SMTP, thư điện tử có thể gửi tới server của người nhận chỉ trong vài phút. SMTP server là máy chủ gửi thư tuân thủ giao thức SMTP.

    ![Quá trình gửi một email](/media/jg/ext/oss.javaguide.cn/p3-juejin/2bdccb760474435aae52559f2ef9652f-tplv-k3u1fbpfcp-6e77bf6d.png)

    <p style="text-align:right;font-size:12px">https://www.campaignmonitor.com/resources/knowledge-base/what-is-the-code-that-makes-bcc-or-cc-operate-in-an-email/</p>

11. **Công cụ tìm kiếm (Search Engine)**: Hệ thống thu thập thông tin từ Internet theo các chiến lược nhất định bằng các chương trình máy tính, tổ chức và xử lý thông tin, rồi cung cấp dịch vụ tra cứu cho người dùng. Bao gồm tìm kiếm chỉ mục toàn văn, chỉ mục danh mục, công cụ tìm kiếm meta, công cụ tìm kiếm chuyên biệt dọc (vertical), công cụ tìm kiếm cổng thông tin, v.v.
12. **Công cụ tìm kiếm chuyên biệt dọc (Vertical Search Engine)**: Công cụ tìm kiếm chuyên sâu vào một ngành hoặc lĩnh vực cụ thể, là phân nhánh mở rộng của công cụ tìm kiếm tổng hợp. Nó tích hợp một loại thông tin chuyên môn trong kho trang web, bóc tách dữ liệu theo các trường định hướng rồi trả kết quả cho người dùng. Đặc điểm là "chuyên sâu, tinh gọn, sâu sắc" và mang đậm màu sắc ngành nghề.
13. **Chỉ mục toàn văn (Full-text Index)**: Kỹ thuật then chốt của các công cụ tìm kiếm hiện nay. Tìm một từ trong tệp 1MB có thể mất vài giây, trong tệp 100MB mất hàng chục giây, và trong tệp lớn hơn nữa thì chi phí hệ thống là không khả thi. Kỹ thuật chỉ mục toàn văn (thường áp dụng bảng chỉ mục đảo - inverted index) ra đời để giải quyết mâu thuẫn này.
14. **Chỉ mục danh mục (Directory Index)**: Phân loại website thành các danh mục tương ứng theo phân cấp, người dùng có thể tìm kiếm theo từ khóa hoặc duyệt theo cây danh mục phân lớp.

### 6.2. Tổng hợp các điểm kiến thức quan trọng

1. Giao thức truyền file (FTP) sử dụng dịch vụ vận chuyển tin cậy của TCP. FTP hoạt động theo mô hình Client-Server. Một tiến trình FTP server có thể đồng thời phục vụ nhiều người dùng. Khi truyền file, giữa client và server của FTP cần thiết lập hai kết nối TCP song song: kết nối điều khiển và kết nối dữ liệu. Kết nối thực sự truyền dữ liệu file là kết nối dữ liệu.
2. Giao thức dùng để tương tác giữa trình duyệt Web và máy chủ là HTTP. HTTP dùng kết nối TCP để truyền dữ liệu tin cậy. Tuy nhiên bản thân HTTP là không kết nối (stateless) và phi trạng thái. Giao thức HTTP/1.1 bắt đầu sử dụng kết nối bền vững (persistent connection, chia thành phương thức không theo đường ống và theo đường ống).
3. Thư điện tử gửi thư đến mail server của người nhận và lưu trong hộp thư của người nhận, người nhận có thể lên mạng truy cập vào mail server để đọc thư bất kỳ lúc nào.
4. Một hệ thống thư điện tử có 3 thành phần quan trọng: User Agent (tác tử người dùng), Mail Server (máy chủ thư), Giao thức gửi/nhận thư (giao thức gửi như SMTP, giao thức nhận như POP3 và IMAP). Cả User Agent và Mail Server đều phải chạy các giao thức này.

### 6.3. Bổ sung (Quan trọng)

Cần đặc biệt lưu ý các điểm kiến thức sau:

1. Các giao thức thường gặp ở tầng ứng dụng (trọng tâm là giao thức HTTP)
2. Hệ thống phân giải tên miền (DNS) - phân giải IP từ tên miền
3. Quy trình cơ bản khi truy cập một website
4. Khái niệm về System Call (lời gọi hệ thống) và API (Giao diện lập trình ứng dụng)
