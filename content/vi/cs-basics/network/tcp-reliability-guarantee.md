---
title: TCP Đảm Bảo Truyền Tin Cậy Như Thế Nào? Giải Thích Chi Tiết Retransmission, Sliding Window và Congestion Control
description: Hệ thống hóa toàn diện các cơ chế đảm bảo độ tin cậy của TCP, bao gồm truyền lại (Retransmission) / SACK, kiểm soát luồng (Flow Control) và kiểm soát tắc nghẽn (Congestion Control), làm rõ các điểm cốt lõi để hiện thực truyền tin cậy end-to-end.
category: Cơ sở máy tính
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: TCP,độ tin cậy,truyền lại,retransmission,SACK,D-SACK,kiểm soát luồng,flow control,kiểm soát tắc nghẽn,congestion control,sliding window,checksum,CUBIC,BBR
lang: vi
sourceRef: zh-ref/cs-basics/network/tcp-reliability-guarantee.md
---

TCP thường được gọi là một giao thức truyền tải tin cậy, nhưng "tin cậy" không phải là một lời hứa trừu tượng, mà là kết quả phối hợp nhịp nhàng của một tập hợp các cơ chế kỹ thuật cụ thể.

Mất gói tin thì phải truyền lại (Retransmission), dữ liệu xáo trộn thứ tự thì phải sắp xếp lại, bên nhận xử lý không kịp thì phải kiểm soát luồng (Flow Control), mạng nghẽn thì phải chủ động giảm tốc độ (Congestion Control). Chỉ khi kết nối tất cả các cơ chế này lại với nhau, chúng ta mới thực sự hiểu được tại sao TCP có thể cung cấp dịch vụ truyền tải tin cậy trên nền tảng mạng IP vốn dĩ không hề tin cậy.

Bài viết này tập trung giải đáp các câu hỏi trọng tâm sau:

1. TCP đảm bảo dữ liệu đến đích tin cậy thông qua những cơ chế nào?
2. Timeout Retransmission, Fast Retransmit, SACK và D-SACK lần lượt giải quyết bài toán gì?
3. TCP hiện thực kiểm soát luồng thông qua cửa sổ trượt (Sliding Window) như thế nào?
4. Cần hiểu các giai đoạn Khởi động chậm (Slow Start), Tránh tắc nghẽn (Congestion Avoidance), Truyền lại nhanh (Fast Retransmit) và Phục hồi nhanh (Fast Recovery) trong kiểm soát tắc nghẽn ra sao?

Trước hết, hãy làm rõ một điểm rất dễ gây hiểu lầm: Điều mà TCP đảm bảo độ tin cậy là **luồng byte (Byte Stream)**, chứ không phải từng "thông điệp" (message) rời rạc của tầng ứng dụng. TCP không hề bảo lưu ranh giới thông điệp trong HTTP, RPC hay các giao thức nghiệp vụ. Nhiệm vụ của nó là đánh số thứ tự cho từng byte trong luồng và cố gắng bàn giao các byte này lên tầng ứng dụng một cách tuần tự, nguyên vẹn và không trùng lặp. Còn việc "một request bắt đầu từ đâu, kết thúc ở đâu" phải phụ thuộc vào giao thức tầng trên tự định nghĩa, ví dụ thông qua trường độ dài (length field), ký tự phân cách (delimiter) hay định dạng gói tin HTTP.

![Nguyên nhân xuất hiện hiện tượng dính gói / xé gói trong TCP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-udp-byte-stream-tcp-sticky-split-causes-3dc840f6.png)

## TCP đảm bảo độ tin cậy khi truyền tải bằng cách nào?

1. **Truyền tải dựa trên các khối dữ liệu (Segments)**: Dữ liệu tầng ứng dụng được chia thành các khối dữ liệu mà TCP đánh giá là phù hợp nhất để gửi đi trước khi chuyển xuống tầng mạng. Các khối này được gọi là phân đoạn TCP (TCP segments).
2. **Sắp xếp lại dữ liệu xáo trộn thứ tự và loại bỏ trùng lặp**: TCP không thể ngăn chặn mạng làm mất gói tin. Việc nó làm được là đánh số cho từng byte trong luồng, đồng thời thông qua ACK, truyền lại, sắp xếp thứ tự và loại bỏ trùng lặp để tầng ứng dụng luôn nhìn thấy một luồng dữ liệu tuần tự và không trùng lặp. Sequence Number của TCP bản chất là số thứ tự của byte, không phải đánh số theo từng gói tin. Một phân đoạn TCP mang theo một dải byte liên tục, và bên nhận dựa vào các dải số thứ tự này để hoàn tất việc ghép nối và loại trùng.
3. **Mã kiểm tra (Checksum)**: TCP tính toán checksum cho toàn bộ TCP header, dữ liệu payload và một IP pseudo-header. Đây là mã kiểm tra end-to-end nhằm phát hiện sự biến đổi dữ liệu trong quá trình truyền dẫn. Nếu một phân đoạn nhận được có checksum sai lệch, TCP sẽ hủy bỏ phân đoạn đó và không xác nhận đã nhận nó. Tuy nhiên, TCP checksum chỉ là phép cộng bù 1 (one's complement sum) 16-bit, chủ yếu dùng để phát hiện lỗi đường truyền phổ biến chứ không phải hàm kiểm tra toàn vẹn mạnh và không thể chống giả mạo độc hại. Tính toàn vẹn dữ liệu thực tế thường phải phụ thuộc vào CRC ở tầng liên kết dữ liệu, TLS AEAD hoặc mã băm ở tầng ứng dụng.
4. **Cơ chế truyền lại (Retransmission)**: Trong trường hợp phân đoạn TCP bị mất hoặc trễ, bên gửi sẽ gửi lại dữ liệu cho đến khi nhận được xác nhận (ACK) từ phía đối diện. Các cơ chế truyền lại của TCP gồm: truyền lại dựa trên bộ đếm thời gian (Timeout Retransmission / RTO), truyền lại nhanh (Fast Retransmit - dựa vào phản hồi lặp lại của bên nhận để kích hoạt), SACK (Selective Acknowledgment - mang thông tin các dải dữ liệu không liên tục đã nhận được trong tùy chọn ACK để bên gửi biết phân đoạn nào đã tới nơi), và D-SACK (Duplicate SACK - báo cho bên gửi biết những phân đoạn nào bị nhận trùng). Giá trị của D-SACK là giúp bên gửi nhận biết liệu một lần truyền lại có phải là "truyền lại nhầm (spurious)" hay không: ví dụ dữ liệu gốc thực ra đã đến nơi, nhưng do ACK bị thất lạc, mạng đảo thứ tự hoặc bộ đếm thời gian RTO kích hoạt quá sớm khiến bên gửi tưởng mất gói nên truyền lại. Khi bên nhận báo D-SACK rằng "tôi đã nhận trùng đoạn này", bên gửi có thể suy luận lần truyền lại đó chỉ là hiểu nhầm chứ mạng chưa chắc đã tắc nghẽn. Tuy nhiên, D-SACK chỉ cung cấp manh mối chứ không thể tự mình chứng minh tuyệt đối một nguyên nhân cụ thể nào.
5. **Kiểm soát luồng (Flow Control)**: Mỗi bên của kết nối TCP đều có một dung lượng bộ đệm hữu hạn. Bên nhận thông báo cửa sổ nhận (Receive Window - `rwnd`) để cho bên gửi biết mình còn có thể nhận thêm bao nhiêu dữ liệu, từ đó bên gửi điều tiết tốc độ phát để tránh làm tràn bộ đệm bên nhận dẫn đến rớt gói.
6. **Kiểm soát tắc nghẽn (Congestion Control)**: Khi mạng xảy ra tắc nghẽn, TCP chủ động giảm tốc độ gửi dữ liệu. Khi gửi dữ liệu, TCP phải cân nhắc hai yếu tố: một là khả năng tiếp nhận khả dụng của bộ đệm bên nhận, hai là mức độ nghẽn của hạ tầng mạng. Năng lực bên nhận thể hiện qua cửa sổ nhận (`rwnd`), còn mức độ nghẽn của mạng thể hiện qua cửa sổ tắc nghẽn (`cwnd`). Lượng dữ liệu chưa được xác nhận mà bên gửi được phép duy trì trên đường truyền thường bị giới hạn bởi `min(rwnd, cwnd)`, nhờ đó vừa không vượt quá khả năng xử lý của bên nhận, vừa không bơm quá nhiều dữ liệu vào hệ thống mạng.

## Tìm hiểu cơ chế Retransmission của TCP thông qua mô hình ARQ

Trong các cơ chế kể trên, cơ chế thể hiện rõ nhất đặc tính "truyền tin cậy" chính là Retransmission (truyền lại). Để các khái niệm như Timeout Retransmission, Fast Retransmit hay SACK không trở nên rời rạc, trước hết hãy cùng xem mô hình trừu tượng ARQ.

**Yêu cầu truyền lại tự động (Automatic Repeat-reQuest - ARQ)** là một trong những giao thức sửa lỗi hoạt động ở tầng Data Link và Transport trong mô hình OSI. Nó sử dụng hai cơ chế cốt lõi là xác nhận (ACK) và timeout để hiện thực hóa việc truyền tin cậy trên nền tảng dịch vụ không tin cậy. Nếu bên gửi sau một khoảng thời gian không nhận được xác nhận (ACK), nó sẽ gửi lại dữ liệu cho đến khi nhận được ACK hoặc vượt quá số lần thử lại tối đa.

TCP có thể được thấu hiểu thông qua tư tưởng của ARQ, nhưng nó không phải là một mô hình ARQ đơn lẻ trong sách giáo khoa. TCP hiện đại kết hợp đồng thời Cumulative ACK, RTO, Fast Retransmit, SACK, kiểm soát tắc nghẽn và kiểm soát luồng; chiến lược truyền lại chịu ảnh hưởng tổng hòa từ các cơ chế này.

- Mặc định ACK là **xác nhận lũy kế (Cumulative ACK)**: ACK mang ý nghĩa "toàn bộ dữ liệu đứng trước số thứ tự này tôi đều đã nhận đủ".
- Khi bật SACK, bên nhận có thể báo thêm cho bên gửi "tôi đã nhận được những dải dữ liệu nào ngoài thứ tự", giúp bên gửi chỉ cần truyền lại đúng những đoạn còn thiếu.

Do đó, Stop-and-Wait ARQ và Go-Back-N rất thích hợp để nắm bắt tư tưởng cơ bản của truyền tin cậy, trong khi TCP hiện đại nhờ có SACK lại tiệm cận với mô hình Selective Repeat (lặp lại có chọn lọc).

![Mối quan hệ giữa ARQ và cơ chế Retransmission của TCP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-reliability-guarantee-arq-retransmission-mod-72c60d52.png)

Họ giao thức ARQ bao gồm Stop-and-Wait ARQ (Dừng và Chờ) và Continuous ARQ (ARQ Liên tục).

### Giao thức Stop-and-Wait ARQ (Dừng và Chờ)

Giao thức Dừng và Chờ được thiết kế để truyền tin cậy. Nguyên lý cơ bản là sau khi gửi xong một gói tin thì dừng lại chờ phía đối diện xác nhận (trả về ACK). Nếu quá một khoảng thời gian (sau timeout) mà vẫn chưa nhận được ACK, nghĩa là việc gửi chưa thành công, cần phải gửi lại gói tin đó, cho đến khi nhận được xác nhận mới gửi tiếp gói tiếp theo.

Trong Stop-and-Wait, nếu bên nhận nhận được gói tin trùng lặp, nó sẽ hủy gói đó nhưng đồng thời vẫn phải gửi lại ACK xác nhận.

**1) Trường hợp không có lỗi:**

Bên gửi phát gói tin, bên nhận nhận được trong thời gian quy định và gửi lại ACK. Bên gửi tiếp tục phát gói tiếp theo.

**2) Trường hợp xảy ra lỗi (Timeout Retransmission):**

Trong Stop-and-Wait, truyền lại do timeout nghĩa là hễ quá thời gian chờ mà chưa nhận được ACK thì sẽ truyền lại gói tin vừa gửi (coi như gói tin đã bị thất lạc). Do đó sau mỗi lần gửi gói tin cần cài đặt một bộ đếm thời gian timeout, thời gian timeout phải dài hơn một chút so với RTT trung bình của mạng. Phương thức này gọi là **Automatic Repeat-reQuest (ARQ)**. Ngoài ra nếu bên nhận nhận gói tin trùng lặp thì bỏ gói tin đó nhưng vẫn phải gửi lại ACK.

**3) ACK bị thất lạc và ACK bị trễ**

- **ACK bị thất lạc**: Gói ACK bị mất trên đường truyền. Khi A gửi thông điệp M1, B nhận được và gửi lại ACK cho M1 nhưng bị mất trên đường đi. A không hề hay biết, sau khi bộ đếm timeout hết hạn, A truyền lại M1. B nhận lại M1 lần thứ hai và xử lý theo hai bước: 1. Hủy bỏ bản sao M1 này, không bàn giao lên tầng trên. 2. Tiếp tục gửi ACK cho A (không được nghĩ là đã gửi rồi mà không gửi nữa; việc A truyền lại chứng tỏ ACK trước đó của B đã bị mất).
- **ACK bị trễ**: Gói ACK bị chậm trễ trên đường truyền. A gửi M1, B nhận được và gửi ACK. Trong khoảng thời gian timeout, A chưa nhận được ACK nên truyền lại M1. B tiếp tục nhận được và gửi ACK thứ hai (B nhận được 2 bản M1). Lúc này A nhận được ACK thứ hai do B gửi nên tiếp tục gửi dữ liệu khác. Một lát sau, ACK thứ nhất của M1 mới mò tới A (A nhận được 2 bản ACK). Xử lý như sau: 1. A nhận được ACK trùng lặp thì lập tức hủy bỏ. 2. B nhận được M1 trùng lặp cũng lập tức hủy bỏ.

### Giao thức Continuous ARQ (ARQ Liên tục)

ARQ liên tục là nhóm tư tưởng truyền lại dựa trên cửa sổ trượt, dạng điển hình gồm Go-Back-N (GBN) và Selective Repeat (SR). Nó cải thiện đáng kể hiệu suất sử dụng đường truyền: bên gửi duy trì một cửa sổ gửi (send window), tất cả các gói tin nằm trong cửa sổ gửi đều có thể được gửi liên tục đi mà không cần dừng lại chờ từng ACK riêng lẻ. Bên nhận áp dụng xác nhận lũy kế (cumulative ACK), chỉ gửi xác nhận cho gói tin cuối cùng đến đúng thứ tự, biểu thị rằng toàn bộ các gói tính đến số thứ tự đó đều đã được tiếp nhận chính xác.

- **Ưu điểm**: Tận dụng đường truyền cao, dễ hiện thực; ngay cả khi một vài ACK bị thất lạc, nếu ACK lũy kế phía sau tới nơi thì vẫn không cần truyền lại.
- **Nhược điểm**: Nếu dùng Go-Back-N, bên nhận không thể phản ánh cho bên gửi biết về những gói tin đến đúng nhưng bị lệch thứ tự. Ví dụ: Bên gửi phát 5 gói tin, gói số 3 bị mất. Trong Go-Back-N, dù gói 4 và 5 đã tới nơi, bên nhận vẫn buộc phải hủy bỏ vì sai thứ tự và liên tục gửi lại ACK cho gói số 2. Bên gửi cuối cùng phải quay lui (rollback) và truyền lại toàn bộ từ gói số 3 trở đi. Vai trò của SACK trong TCP chính là khắc phục nhược điểm này: cho phép bên nhận báo về các dải dữ liệu không liên tục nhưng đã tới nơi an toàn, tránh việc phải quay lui truyền lại hàng loạt một cách lãng phí.

Nắm vững mạch tư duy ARQ này, việc tìm hiểu các cơ chế truyền lại của TCP sẽ trở nên vô cùng mạch lạc.

## Bảng tra nhanh các cơ chế Retransmission của TCP

Việc truyền lại trong TCP không chỉ có một điều kiện kích hoạt duy nhất. Cơ bản nhất là **Timeout Retransmission**: bên gửi chờ ACK quá lâu, cho rằng dữ liệu đã mất nên truyền lại. Sau này có thêm **Fast Retransmit**: bên nhận gửi liên tiếp ACK trùng lặp cho cùng một số thứ tự cũ, báo hiệu có một đoạn ở giữa bị khuyết, bên gửi không cần chờ timeout nữa. SACK và D-SACK mang thêm nhiều thông tin trong ACK để bên gửi biết "những đoạn nào đã tới đích, những lần truyền lại nào là nhầm lẫn".

Bảng dưới đây đóng vai trò như một tấm bản đồ hệ thống hóa:

| Cơ chế | Điều kiện kích hoạt | Vấn đề giải quyết |
| --- | --- | --- |
| Timeout Retransmission (RTO) | Quá thời gian RTO mà vẫn chưa nhận được ACK | Chốt chặn an toàn cuối cùng khi mất gói |
| Fast Retransmit (Truyền lại nhanh) | Nhận 3 duplicate ACK liên tiếp (xác nhận cùng một ACK number cũ) | Không chờ timeout, lập tức truyền lại phân đoạn nghi bị mất |
| SACK (Selective ACK) | ACK mang theo dải dữ liệu đã nhận được | Báo cho bên gửi biết dải nào đã nhận, chỉ truyền lại phần thực sự thiếu |
| D-SACK (Duplicate SACK) | SACK báo cáo các phân đoạn nhận trùng | Nhận diện truyền lại nhầm, mất ACK hoặc mạng bị đảo thứ tự |

## Timeout Retransmission hoạt động ra sao? Thời gian RTO được xác định thế nào?

Trước hết hãy xem hàng đầu tiên: **Timeout Retransmission (RTO)**. Đây là giải pháp chốt chặn cuối cùng trong kiến trúc truyền lại của TCP. Dù có bật SACK hay có kích hoạt Fast Retransmit hay không, hễ một đoạn dữ liệu phát đi mà mãi không thấy phản hồi, cuối cùng hệ thống vẫn phải dựa vào RTO để phán quyết: "Không thể chờ thêm nữa, phải truyền lại ngay".

Khi bên gửi phát dữ liệu, nó kích hoạt một bộ đếm thời gian để chờ phía nhận xác nhận phân đoạn này. Bên nhận gửi về ACK tương ứng cho các phân đoạn TCP nhận thành công. Nếu bên gửi không nhận được xác nhận trong một khoảng thời gian RTT hợp lý, phân đoạn dữ liệu tương ứng sẽ bị coi là đã thất lạc và được truyền lại.

- **RTT (Round Trip Time)**: Thời gian khứ hồi, tức khoảng thời gian từ khi phân đoạn TCP phát đi cho đến khi nhận được ACK tương ứng.
- **RTO (Retransmission Time Out)**: Thời gian chờ truyền lại, tính từ thời điểm phát dữ liệu, quá mốc này sẽ kích hoạt truyền lại.

![Quy trình tính toán thời gian RTO](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-reliability-guarantee-rto-calculation-flow-05ccedcc.png)

Xác định RTO là bài toán mấu chốt vì nó ảnh hưởng trực tiếp đến hiệu năng và thông lượng của TCP. Nếu RTO đặt quá nhỏ sẽ gây ra truyền lại không cần thiết, làm tăng tải cho mạng; nếu RTO quá lớn sẽ làm trễ việc phục hồi dữ liệu, kéo giảm throughput. Vì vậy, RTO phải được điều chỉnh linh hoạt theo tình trạng thực tế của mạng.

Giá trị RTT biến động liên tục theo trạng thái mạng, do đó TCP không thể lấy trực tiếp một mẫu RTT đơn lẻ làm RTO. Việc tính toán RTO của TCP hiện đại dựa trên chuẩn RFC 6298: căn cứ vào các mẫu RTT thu thập được để duy trì giá trị RTT trung bình trơn hóa (SRTT) và độ lệch dao động RTT (RTTVAR), từ đó tính ra RTO; khi xảy ra timeout còn áp dụng cơ chế lùi theo hàm mũ (exponential backoff).

Điểm cốt lõi của thuật toán Karn là: Đối với các phân đoạn đã từng được truyền lại, gói ACK trả về sẽ không được dùng để lấy mẫu RTT, nhằm tránh sự nhập nhằng "ACK này ứng với lần gửi đầu hay lần truyền lại".

Hiểu một cách đơn giản: RTO không phải là RTT, mà là "RTT trơn hóa + biên độ an toàn chống dao động". Nếu một kết nối có RTT mẫu khoảng 100 ms nhưng độ dao động lớn, RTO bắt buộc phải dự phòng biên độ an toàn rộng hơn; nếu vẫn tiếp tục timeout, RTO lần kế tiếp sẽ nhân đôi (backoff) để tránh đổ thêm áp lực truyền lại vào mạng đang nghẽn.

## Fast Retransmit hoạt động như thế nào?

Timeout Retransmission rất tin cậy nhưng tương đối chậm chạp vì bên gửi buộc phải chờ hết thời gian RTO mới được truyền lại. Fast Retransmit (Truyền lại nhanh) giải quyết chính bài toán độ trễ này: nó không phụ thuộc vào đồng hồ bấm giờ, mà dựa vào các gói ACK trùng lặp (duplicate ACK) liên tiếp do bên nhận gửi về để phát hiện sớm nguy cơ mất gói.

TCP sử dụng cơ chế xác nhận lũy kế. Giả sử bên nhận đã nhận đúng thứ tự dải byte `[0, 1000)` và đang mong chờ byte tiếp theo từ 1000 trở đi. Nếu nó nhận được đoạn `[2000, 3000)` trước, điều đó chứng tỏ đoạn `[1000, 2000)` ở giữa vẫn chưa tới. Bên nhận sẽ không đẩy ACK lên 3000, mà tiếp tục phản hồi ACK = 1000, mang thông điệp "tôi vẫn đang đợi dữ liệu từ mốc 1000". Các gói tin lặp lại cùng một giá trị ACK cũ này được gọi là duplicate ACK.

Nếu bên gửi nhận liên tiếp 3 duplicate ACK, nó sẽ nhận định phân đoạn dữ liệu đứng ngay sau giá trị ACK đó nhiều khả năng đã bị rơi mất. Do đó, bên gửi lập tức truyền lại phân đoạn bị thiếu mà không cần chờ bộ đếm RTO hết hạn. Sở dĩ không truyền lại ngay khi nhận 1 duplicate ACK là vì mạng có thể xảy ra hiện tượng đảo thứ tự gói tin trong thời gian ngắn (packet reordering): gói phát sau đến trước không khẳng định chắc chắn gói phát trước bị mất. Quy tắc 3 duplicate ACK là sự cân bằng tối ưu giữa việc "phục hồi càng sớm càng tốt" và "tránh phán đoán nhầm khi mạng chỉ bị đảo thứ tự".

Fast Retransmit chỉ giúp định vị nhanh "lỗ hổng đầu tiên". Nếu trong một cửa sổ gửi bị rớt nhiều đoạn dữ liệu cùng lúc, việc chỉ dựa vào ACK lũy kế rất khó báo cho bên gửi biết đoạn nào đã tới, đoạn nào còn thiếu — đây chính là lúc cần đến SACK.

## SACK nâng cao hiệu quả truyền lại ra sao?

SACK (Selective Acknowledgment - Xác nhận có chọn lọc) được sinh ra để bù đắp điểm mù thông tin của Cumulative ACK thông thường. ACK thông thường chỉ diễn đạt được "toàn bộ dữ liệu trước số thứ tự X đã nhận đủ", chứ không thể diễn đạt "các đoạn Y đến Z phía sau tuy đến lệch thứ tự nhưng cũng đã nhận an toàn". SACK sẽ mang theo các dải byte không liên tục đã nhận được vào phần TCP Options của gói ACK, giúp bên gửi chỉ cần truyền lại đúng những phần thực sự bị khuyết.

SACK cần được đàm phán thông qua tùy chọn SACK-Permitted trong quá trình ba bước bắt tay. Khi kích hoạt, trường ACK number bản thân nó vẫn tuân thủ quy tắc xác nhận lũy kế, còn tùy chọn SACK mang thêm một hoặc nhiều SACK block. Mỗi SACK block gồm Left Edge và Right Edge, biểu diễn dải byte `[Left Edge, Right Edge)` mà bên nhận đã tiếp nhận thành công.

Ví dụ: Bên gửi phát liên tục 4 đoạn `[0, 1000)`, `[1000, 2000)`, `[2000, 3000)`, `[3000, 4000)`. Đoạn `[1000, 2000)` bị mất, nhưng hai đoạn sau đã đến nơi. Cumulative ACK của bên nhận vẫn dừng ở ACK = 1000, nhưng trong SACK block nó sẽ báo đã nhận `[2000, 4000)`. Bên gửi căn cứ vào đó biết ngay chỉ cần truyền lại đoạn `[1000, 2000)`, còn đoạn `[2000, 4000)` không cần gửi lại nữa.

Dung lượng của TCP Options bị giới hạn. Bản thân SACK option tốn 2 byte, mỗi SACK block tốn 8 byte, do đó một phân đoạn TCP chỉ có thể mang tối đa 4 SACK block; nếu có thêm Timestamp hoặc tùy chọn khác thì dung lượng khả dụng còn ít hơn nữa. Tức là SACK không thể ghi nhớ vô hạn mọi dải phân mảnh, nhưng chừng đó đã quá đủ để giảm thiểu tối đa các đợt truyền lại vô ích khi mất nhiều gói tin.

## D-SACK có tác dụng gì?

D-SACK (Duplicate SACK), được định nghĩa trong RFC 2883, là phần mở rộng nâng cao của SACK. Trong khi SACK báo cho bên gửi biết "những dải rời rạc nào đã nhận được", thì D-SACK báo thêm "những dải nào đã bị nhận trùng lặp".

D-SACK không bổ sung tùy chọn TCP mới mà tái sử dụng cấu trúc SACK block sẵn có. Quy ước đặt ra: nếu SACK block đầu tiên mô tả một dải dữ liệu vốn đã được bao phủ bởi cumulative ACK hiện tại, hoặc mô tả một dải đã xuất hiện trong các SACK block phía sau, thì block đó đang báo cáo dữ liệu trùng lặp.

Tại sao dữ liệu trùng lặp lại có giá trị? Bởi vì một lần truyền lại không đồng nghĩa với việc gói tin gốc chắc chắn bị mất. Các kịch bản phổ biến gồm:

- Dữ liệu gốc đã tới bên nhận nhưng gói ACK bị mất trên đường quay về; bên gửi chờ hết hạn RTO tưởng mất gói nên truyền lại.
- Dữ liệu gốc bị trễ hoặc đảo thứ tự nghiêm trọng trên mạng; bên gửi kích hoạt Fast Retransmit trước, sau đó cả gói gốc lẫn gói truyền lại đều mò tới bên nhận.

Khi nhận được D-SACK, bên gửi có thể suy luận lần truyền lại vừa qua là truyền lại nhầm (spurious retransmission), từ đó phán đoán mạng đang gặp tình trạng mất ACK, đảo thứ tự nghiêm trọng hay giá trị RTO đang bị tính quá ngắn. Nó không đơn độc chứng minh một nguyên nhân duy nhất, nhưng mang lại dữ liệu chẩn đoán vô giá phục vụ kiểm soát tắc nghẽn và khắc phục bất thường truyền tải.

## TCP hiện thực kiểm soát luồng (Flow Control) như thế nào?

**TCP tận dụng cơ chế cửa sổ trượt (Sliding Window) để hiện thực kiểm soát luồng. Kiểm soát luồng nhằm điều tiết tốc độ gửi của bên gửi, đảm bảo bên nhận có đủ năng lực và bộ đệm để tiếp nhận.** Sliding Window là cơ chế cốt lõi của TCP, vừa dùng để theo dõi "dữ liệu nào đã gửi nhưng chưa được ACK", vừa dùng để thực thi kiểm soát luồng. Bên nhận thông báo cửa sổ nhận (`rwnd`) của mình qua trường Window trong gói ACK, bên gửi căn cứ vào đó để điều chỉnh cửa sổ gửi. Nếu trường Window bằng 0, nghĩa là bên nhận tạm thời hết sạch bộ đệm khả dụng, bên gửi không được phép phát tiếp dữ liệu mới.

Trường Window trong TCP header có độ rộng 16 bit, giá trị biểu diễn tối đa chỉ đạt 65.535 byte. Nếu muốn sử dụng cửa sổ nhận lớn hơn, giao thức phải dựa vào tùy chọn TCP Window Scale để nhân tỉ lệ mở rộng cửa sổ. Khi debug thực tế, bạn có thể kiểm tra xem hai bên có đàm phán Window Scale trong gói SYN / SYN-ACK khi bắt tay hay không.

**Làm sao khôi phục khi cửa sổ bằng 0 (Zero Window)?** Khi bên nhận báo `rwnd = 0`, bên gửi tạm ngừng gửi dữ liệu mới. Nhưng nếu sau đó bên nhận giải phóng bộ đệm và gửi một ACK thông báo cửa sổ đã mở lại, mà gói ACK này lại không may bị thất lạc trên mạng, hai bên sẽ rơi vào trạng thái bế tắc (deadlock): bên gửi chờ cửa sổ mở, bên nhận chờ dữ liệu mới tới.

![Cơ chế Zero Window Probe trong TCP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-reliability-guarantee-zero-window-probe-37bd95a1.png)

Để tháo gỡ bế tắc này, TCP đưa ra cơ chế **Zero Window Probe (thăm dò cửa sổ 0)**. Khi cửa sổ bằng 0, bên gửi dựa vào bộ đếm thời gian duy trì (persist timer) để định kỳ phát các gói tin thăm dò kích thước rất nhỏ (1 byte), buộc bên nhận phải phản hồi lại kích thước cửa sổ hiện tại. Nhờ vậy, ngay cả khi ACK cập nhật cửa sổ trước đó bị mất, bên gửi vẫn kịp thời phát hiện cửa sổ đã mở lại.

Zero Window Probe chỉ có nhiệm vụ phá vỡ thế bế tắc do mất gói ACK cập nhật cửa sổ, chứ không tương đương với kiểm tra sức khỏe kết nối (health check) ở tầng ứng dụng. Nếu ứng dụng bên nhận không chịu đọc dữ liệu từ socket trong thời gian dài, kết nối sẽ kẹt ở trạng thái zero window, gây lãng phí tài nguyên hai đầu. Trong kỹ thuật thực tế, luôn cần có timeout đọc/ghi tầng ứng dụng và cơ chế thu hồi kết nối nhàn rỗi (idle connection) để làm chốt chặn an toàn.

**Tại sao cần kiểm soát luồng?** Khi hai bên giao tiếp, tốc độ xử lý của bên gửi và bên nhận không bao giờ hoàn toàn bằng nhau. Nếu bên gửi phát quá nhanh, bên nhận sẽ không kịp xử lý. Lúc này bên nhận đành phải dồn dữ liệu vào **bộ đệm nhận (receive buffer)** (các phân đoạn đến lệch thứ tự cũng được lưu tạm ở đây). Trong điều kiện bình thường, bên nhận sẽ thu hẹp `rwnd`, thậm chí báo cửa sổ bằng 0 để bên gửi dừng phát. Chỉ khi việc điều khiển cửa sổ không kịp thích ứng, triển khai socket bị lỗi, bộ đệm cạn kiệt hoặc hàng đợi mạng tràn thì mới xảy ra hiện tượng rớt gói. Kiểm soát luồng sinh ra để duy trì thế cân bằng động giữa bên gửi và bên nhận.

Các hiểu lầm thường gặp:

- Bên gửi (Sender) không đồng nghĩa với Client
- Bên nhận (Receiver) không đồng nghĩa với Server

TCP là giao thức song công toàn phần (Full-Duplex). Cả hai bên đều có thể gửi và nhận đồng thời. Vì vậy, mỗi bên đều sở hữu một bộ đệm gửi và một bộ đệm nhận riêng biệt, đồng thời duy trì một cửa sổ gửi và một cửa sổ nhận độc lập. Kích thước cửa sổ nhận phụ thuộc vào tốc độ ứng dụng xử lý, cấu hình socket buffer của hệ điều hành và phần cứng. Logic duy trì cửa sổ của hai bên là hoàn toàn đối xứng.

**Cấu trúc cửa sổ gửi của TCP được chia làm bốn phần**:

1. Các phân đoạn TCP đã gửi và đã được xác nhận (đã gửi và đã ACK);
2. Các phân đoạn TCP đã gửi nhưng chưa được xác nhận (đã gửi nhưng chưa ACK);
3. Các phân đoạn TCP chưa gửi nhưng bên nhận đã sẵn sàng tiếp nhận (có thể gửi);
4. Các phân đoạn TCP chưa gửi và bên nhận tạm thời chưa thể tiếp nhận (chưa được phép gửi).

![Cấu trúc cửa sổ gửi TCP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-send-window-349faf71.png)

- **SND.WND**: Kích thước cửa sổ gửi (Send Window).
- **SND.UNA**: Send Unacknowledged, trỏ tới số thứ tự sớm nhất chưa được ACK (mép trái của cửa sổ gửi).
- **SND.NXT**: Send Next pointer, trỏ tới byte đầu tiên có thể gửi tiếp theo.

Nếu chỉ xét ràng buộc từ cửa sổ nhận, **kích thước cửa sổ gửi khả dụng** xấp xỉ bằng `SND.UNA + SND.WND - SND.NXT`. Lượng dữ liệu thực tế được phép gửi còn bị ràng buộc thêm bởi `cwnd`, MSS và dung lượng bộ đệm gửi.

**Cấu trúc cửa sổ nhận của TCP được chia làm ba phần**:

1. Các phân đoạn TCP đã nhận và đã xác nhận (đã nhận và đã ACK);
2. Các phân đoạn chờ nhận và cho phép bên gửi phát tới (chưa nhận, trong phạm vi cho phép);
3. Các phân đoạn không được phép nhận (vượt quá dung lượng bộ đệm).

![Cấu trúc cửa sổ nhận TCP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-receive-window-d439d80a.png)

**Kích thước cửa sổ nhận được điều chỉnh động.** Nó chịu tác động của tốc độ ứng dụng đọc dữ liệu, lượng chiếm dụng bộ đệm nhận, cấu hình socket buffer và thuật toán autotuning của hệ điều hành.

Lưu ý rằng kích thước cửa sổ trong hình minh họa chỉ mang tính chất mô phỏng khái niệm, kích thước cửa sổ trong thực tế thường lớn hơn rất nhiều.

**Hội chứng cửa sổ ngớ ngẩn (Silly Window Syndrome - SWS)** xảy ra khi bên gửi liên tục phát các gói tin cực nhỏ hoặc bên nhận liên tục thông báo cửa sổ tăng thêm những khoảng li ti, làm ngập mạng bởi các gói tin "đầu to đuôi teo" (header chiếm phần lớn trong khi payload tí hon), gây lãng phí nghiêm trọng băng thông mạng.

![Mối quan hệ giữa SWS, thuật toán Nagle và Delayed ACK](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-reliability-guarantee-sws-nagle-delayed-ack-df5d78bb.png)

Các giải pháp tối ưu phổ biến:

- **Chống SWS phía bên nhận**: Không thông báo cửa sổ mới ngay khi vừa giải phóng được một vài byte bộ đệm, mà chờ đến khi dung lượng trống đạt tới một ngưỡng đáng kể mới cập nhật cửa sổ.
- **Thuật toán Nagle phía bên gửi**: Nếu trên đường truyền vẫn còn gói tin nhỏ chưa được ACK, dữ liệu nhỏ mới gửi tới sẽ được gom vào bộ đệm, đợi đến khi nhận được ACK hoặc gom đủ kích thước một phân đoạn MSS mới phát đi.
- **Xác nhận trễ (Delayed ACK)**: Bên nhận không nhất thiết nhận được gói nào là lập tức trả lời ACK ngay, mà có thể nán lại một khoảng thời gian ngắn để ghép ACK đi cùng dữ liệu phản hồi ngược lại, hoặc gom ACK cho nhiều phân đoạn cùng lúc. Delayed ACK vốn là chiến lược tạo ACK, không phải cơ chế thiết kế riêng cho SWS, nhưng nó tương tác rất chặt chẽ với chiến lược phát gói tin nhỏ.

Cần hết sức lưu ý rằng thuật toán Nagle và Delayed ACK khi kết hợp với nhau trong các ứng dụng trao đổi gói tin nhỏ dạng request-response có thể gây ra hiện tượng chờ đợi lẫn nhau, tạo thêm độ trễ từ hàng chục mili-giây. Với các ứng dụng tương tác thời gian thực nhạy cảm với độ trễ, giải pháp phổ biến là tắt thuật toán Nagle thông qua tùy chọn `TCP_NODELAY`. Cái giá phải trả là số lượng gói tin nhỏ tăng lên, chi phí header và áp lực ngắt phần cứng của hệ thống cũng tăng theo. Với các tác vụ truyền file hoặc phản hồi hàng loạt, việc gom dữ liệu ở tầng ứng dụng hoặc kết hợp các tùy chọn như `TCP_CORK` trên Linux sẽ mang lại hiệu quả cao hơn.

## TCP hiện thực kiểm soát tắc nghẽn (Congestion Control) như thế nào?

Trong một khoảng thời gian, nếu nhu cầu đối với một tài nguyên mạng nào đó vượt quá khả năng cung ứng của tài nguyên đó, hiệu năng mạng sẽ tụt dốc, biểu hiện qua việc hàng đợi dài ra, độ trễ tăng vọt và tỷ lệ mất gói tăng cao. Tình trạng này được gọi là tắc nghẽn mạng (congestion). Kiểm soát tắc nghẽn nhằm ngăn chặn việc bơm quá nhiều dữ liệu vào mạng, giúp các bộ định tuyến (router) và liên kết mạng không bị quá tải. Tiền đề của kiểm soát tắc nghẽn là toàn bộ mạng lưới phải chịu được tải trọng hiện hành. Đây là một quy trình mang tính toàn cục, liên quan đến mọi máy trạm, router và mọi nhân tố ảnh hưởng đến đường truyền. Ngược lại, kiểm soát luồng (Flow Control) chỉ là việc điều tiết lưu lượng điểm-điểm giữa hai đầu mút giao tiếp với nhau. Kiểm soát luồng chỉ cần kìm hãm tốc độ gửi của bên phát sao cho bên nhận kịp tiếp nhận là đủ.

![Kiểm soát tắc nghẽn trong TCP](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-congestion-control-f6535a98.png)

Để kiểm soát tắc nghẽn, bên gửi TCP duy trì một biến trạng thái gọi là **cửa sổ tắc nghẽn (Congestion Window - `cwnd`)**. Độ lớn của `cwnd` phụ thuộc vào mức độ tắc nghẽn của mạng và biến thiên liên tục. Bên gửi sẽ lấy giá trị nhỏ hơn giữa cửa sổ tắc nghẽn và cửa sổ nhận của đối phương làm giới hạn phát dữ liệu: `min(cwnd, rwnd)`.

Theo khuôn khổ nền tảng RFC 5681 (họ TCP Reno), kiểm soát tắc nghẽn TCP thường được chia làm bốn cơ chế: **Khởi động chậm (Slow Start)**, **Tránh tắc nghẽn (Congestion Avoidance)**, **Truyền lại nhanh (Fast Retransmit)** và **Phục hồi nhanh (Fast Recovery)**. Các thuật toán hiện đại như CUBIC, BBR, DCTCP có các trạng thái và hiện thực phức tạp hơn dựa trên nền tảng này. Ở tầng mạng, các router cũng có thể áp dụng chiến lược loại bỏ gói tin thích hợp (như Active Queue Management - AQM) để giảm thiểu tắc nghẽn xảy ra.

- **Khởi động chậm (Slow Start)**: Tư tưởng của thuật toán này là khi máy trạm bắt đầu phát dữ liệu, nếu lập tức bơm lượng lớn dữ liệu vào mạng thì rất dễ gây nghẽn vì chưa rõ khả năng chịu tải của đường truyền. Phương pháp tối ưu là thăm dò từng bước, tức tăng dần cửa sổ gửi từ nhỏ đến lớn. Slow Start không có nghĩa là lúc đầu chỉ được gửi đúng 1 MSS. RFC 6928 đã đề xuất và thử nghiệm nâng cửa sổ ban đầu (Initial Window - IW) từ 2~4 phân đoạn lên tối đa 10 phân đoạn (IW10), và rất nhiều hệ điều hành hiện đại đã áp dụng IW10 làm mặc định. Với MSS phổ biến 1460 byte, 10 MSS cho phép gửi khoảng 14 KB dữ liệu ngay trong RTT đầu tiên — điều này cực kỳ quan trọng đối với các kết nối ngắn HTTP và thời gian tải trang đầu tiên. Điểm mấu chốt của giai đoạn Slow Start là: căn cứ vào tín hiệu ACK trả về để tăng nhanh kích thước cửa sổ, thường biểu hiện qua việc `cwnd` tăng gấp đôi sau mỗi chu kỳ RTT.
- **Tránh tắc nghẽn (Congestion Avoidance)**: Ý tưởng là làm cho `cwnd` tăng trưởng chậm lại theo quy luật tuyến tính. Nói đơn giản là mỗi RTT chỉ tăng thêm xấp xỉ 1 MSS; về mặt hiện thực là mỗi khi nhận được một ACK thì tăng một lượng nhỏ `cwnd`. Quá trình Slow Start sẽ chuyển sang Congestion Avoidance ngay khi `cwnd` chạm ngưỡng Slow Start Threshold (`ssthresh`). Giá trị ban đầu của `ssthresh` thường được đặt rất lớn, và lần điều chỉnh thực sự đầu tiên thường diễn ra ngay khi phát hiện có gói tin bị mất.
- **Truyền lại nhanh (Fast Retransmit)**: Khi bên gửi nhận được 3 duplicate ACK liên tiếp xác nhận cùng một số thứ tự cũ, nó nhận định gói tin đứng sau đó đã mất và lập tức truyền lại mà không cần đợi RTO timeout.
- **Phục hồi nhanh (Fast Recovery)**: Dưới đây là quy trình Fast Recovery kinh điển theo Reno. Khi nhận duplicate ACK thứ 3, đặt `ssthresh` bằng một nửa `cwnd` hiện tại; truyền lại phân đoạn bị mất và đặt `cwnd = ssthresh + 3 × MSS`; sau đó cứ nhận thêm một duplicate ACK thì `cwnd` tăng thêm 1 MSS; khi nhận được ACK mới (xác nhận phân đoạn truyền lại đã tới đích), hạ `cwnd` về lại `ssthresh` và bước vào giai đoạn Congestion Avoidance. Fast Recovery không kéo sập `cwnd` về Slow Start là vì việc nhận được các duplicate ACK chứng minh các gói tin phát sau đó vẫn lưu thông được tới bên nhận, mạng chưa đến mức tê liệt hoàn toàn. TCP hiện đại khi kết hợp SACK, NewReno, CUBIC hay RACK/TLP thì quy trình phục hồi còn phức tạp hơn, nhưng Reno vẫn là nền tảng cốt lõi cần thấu hiểu.

Fast Retransmit xử lý rất tốt khi mất một phân đoạn đơn lẻ, nhưng nếu mất nhiều gói trong một cửa sổ thì duplicate ACK không thể diễn đạt hết mọi vị trí khuyết. Đó là lý do SACK ra đời để bên nhận liệt kê chi tiết các khối đã nhận, giúp bên gửi chỉ truyền lại đúng những phần bị mất.

Cần lưu ý rằng bốn giai đoạn trên là bộ khung kinh điển. Các hệ điều hành hiện đại ngày nay thường ứng dụng các thuật toán kiểm soát tắc nghẽn tiên tiến hơn:

- **CUBIC**: Đã được chuẩn hóa thành Standards Track qua RFC 9438. CUBIC sử dụng hàm bậc ba để điều chỉnh cửa sổ tắc nghẽn, thích ứng vượt trội trên các đường truyền băng thông lớn và RTT dài so với sự tăng trưởng tuyến tính của Reno. Hiện CUBIC là thuật toán mặc định trên Linux, Windows và Apple.
- **BBR**: Thuật toán kiểm soát tắc nghẽn dựa trên mô hình (model-based) do Google đề xuất, điều tiết tốc độ phát dựa trên việc ước lượng băng thông nghẽn (Bottleneck Bandwidth) và RTT tối thiểu (Min RTT), hướng tới thông lượng cao và độ trễ xếp hàng thấp. BBR hoạt động rất hiệu quả trên các đường truyền bị hiện tượng bufferbloat. Tuy nhiên hiệu quả của BBR còn phụ thuộc vào phiên bản, thuật toán quản lý hàng đợi, loại luồng cạnh tranh và môi trường triển khai; không thể coi nó là giải pháp "thay thế hoàn toàn CUBIC trong mọi trường hợp".
- **DCTCP**: Thiết kế chuyên biệt cho mạng trung tâm dữ liệu có kiểm soát, tận dụng cờ ECN để ước lượng tắc nghẽn, hướng tới mục tiêu giảm thiểu tối đa độ trễ xếp hàng trong các switch có bộ đệm nông. Nó không phù hợp để áp dụng rộng rãi ra môi trường Internet công cộng.

Dù vậy, bốn cơ chế kinh điển Slow Start, Congestion Avoidance, Fast Retransmit và Fast Recovery vẫn là nền tảng bắt buộc để hiểu rõ các thuật toán hiện đại này.

Một lưu ý kỹ thuật vô cùng quan trọng: Mất gói không đồng nghĩa với tắc nghẽn mạng. Reno/CUBIC truyền thống coi mất gói là tín hiệu của tắc nghẽn, nhưng trong thực tế nhiễu sóng không dây, chuyển đổi tuyến đường hoặc tràn hàng đợi cục bộ cũng có thể gây mất gói; ngược lại, ECN có thể cảnh báo tắc nghẽn mà không cần phải làm rớt gói. Khi đánh giá hiệu năng các thuật toán tắc nghẽn, không nên chỉ nhìn vào thông lượng trung bình, mà cần quan sát thêm RTT ở P95/P99, tỷ lệ mất gói, tỷ lệ truyền lại, độ sâu hàng đợi, khả năng cùng tồn tại với CUBIC/Reno, cũng như các tham số kernel cụ thể.

## Tổng kết

Độ tin cậy của TCP không có nghĩa là "cam kết mạng vật lý không bao giờ rơi gói", mà là trên nền tảng mạng IP không tin cậy, thông qua một bộ các cơ chế chặt chẽ để giúp tầng ứng dụng tiếp nhận được một **luồng byte tuần tự, không trùng lặp và nguyên vẹn nhất có thể**. Cốt lõi của nó quy về bốn trụ cột:

1. **Dùng Sequence Number và ACK để xác nhận trạng thái dữ liệu**: TCP đánh số từng byte, bên nhận dùng ACK báo cho bên gửi biết dữ liệu nào đã tới nơi, giúp bên gửi xác định dữ liệu nào đang trên đường truyền và dữ liệu nào cần tiếp tục chờ đợi.
2. **Dùng cơ chế Retransmission để bù đắp dữ liệu bị thất lạc**: Timeout Retransmission đóng vai trò chốt chặn cuối cùng, Fast Retransmit giúp phục hồi nhanh khi mất gói đơn lẻ, còn SACK/D-SACK cung cấp thông tin chi tiết về các đoạn đã nhận và phát hiện truyền lại nhầm lẫn.
3. **Dùng Sliding Window để kiểm soát luồng (Flow Control)**: Bên nhận thông báo `rwnd` để tuyên bố năng lực bộ đệm còn trống, bên gửi căn cứ vào đó giới hạn lượng dữ liệu đang lưu thông, tránh làm tràn bộ đệm bên nhận.
4. **Dùng Congestion Control để bảo vệ hạ tầng mạng**: Bên gửi ước lượng sức chịu tải của mạng thông qua `cwnd`, phối hợp giữa Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery và các thuật toán như CUBIC, BBR để tránh bơm quá nhiều lưu lượng vào mạng.

Tóm lại một câu: TCP không làm cho hệ thống mạng trở nên tin cậy một cách thần kỳ, mà bằng cách **đánh số, xác nhận, truyền lại, sắp xếp thứ tự/loại trùng, kiểm soát luồng và kiểm soát tắc nghẽn**, nó "ghép" nên một kênh truyền luồng byte tương đối tin cậy phục vụ cho tầng ứng dụng.

## Tài liệu tham khảo

1. Mạng máy tính (Tái bản lần thứ 7) - Xie Xiren
2. Illustrated HTTP
3. TCP and UDP Tutorial: <https://www.9tut.com/tcp-and-udp-tutorial>
4. Computer Network: <https://github.com/wolverinn/Waking-Up/blob/master/Computer%20Network.md>
5. TCP Flow Control: <https://www.brianstorti.com/tcp-flow-control/>
6. TCP Flow Control: <https://notfalse.net/24/tcp-flow-control>
7. Nguyên lý cửa sổ trượt TCP: <https://cloud.tencent.com/developer/article/1857363>
8. RFC 9293 - Transmission Control Protocol: <https://www.rfc-editor.org/rfc/rfc9293>
9. RFC 6928 - Increasing TCP's Initial Window: <https://www.rfc-editor.org/rfc/rfc6928>
10. RFC 5681 - TCP Congestion Control: <https://datatracker.ietf.org/doc/html/rfc5681>
11. RFC 2018 - TCP Selective Acknowledgment Options: <https://www.rfc-editor.org/rfc/rfc2018>
12. RFC 2883 - An Extension to the Selective Acknowledgement (SACK) Option for TCP: <https://www.rfc-editor.org/rfc/rfc2883>
13. RFC 9438 - CUBIC for Fast and Long-Distance Networks: <https://www.rfc-editor.org/rfc/rfc9438>
14. RFC 8257 - Data Center TCP (DCTCP): <https://www.rfc-editor.org/rfc/rfc8257>
15. BBR: Congestion-Based Congestion Control, ACM Queue, 2016: <https://queue.acm.org/detail.cfm?id=3022184>
16. RFC 1122 - Requirements for Internet Hosts - Communication Layers: <https://datatracker.ietf.org/doc/html/rfc1122>
17. RFC 6298 - Computing TCP's Retransmission Timer: <https://www.rfc-editor.org/rfc/rfc6298>
18. RFC 7323 - TCP Extensions for High Performance: <https://datatracker.ietf.org/doc/rfc7323/>
