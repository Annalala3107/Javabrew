---
title: "Thực chiến thiết kế Distributed ID: Mã đơn hàng, Coupon, Thanh toán một mã (Unified QR) và chiến lược sinh ID nghiệp vụ"
category: Hệ thống phân tán (Distributed Systems)
description: "Hướng dẫn thực chiến thiết kế Distributed ID gắn với các kịch bản nghiệp vụ như mã đơn hàng, mã thanh toán, Coupon, thanh toán một mã (Unified QR), trình bày nguyên tắc thiết kế, ngữ nghĩa nghiệp vụ, quy hoạch dung lượng, khả năng đọc và chiến lược sinh ID duy nhất toàn cục."
tag:
  - Distributed ID
head:
  - - meta
    - name: keywords
      content: Distributed ID,Thiết kế Distributed ID,Sinh mã đơn hàng,Coupon ID,Thanh toán một mã,ID nghiệp vụ,ID duy nhất toàn cục,Chiến lược sinh ID,Thiết kế hệ thống phân tán
lang: vi
sourceRef: zh-ref/distributed-system/distributed-id-design.md
---

::: tip

Mình bắt gặp một bài viết trên Baidu Geek Talk bàn về thiết kế Distributed ID gắn liền với các kịch bản thực tế khá hay, nên đã hệ thống lại một phần nội dung vào đây. Link bài viết gốc: [Nguyên lý kỹ thuật và thực chiến dự án của dịch vụ sinh Distributed ID](https://mp.weixin.qq.com/s/bFDLb6U6EgI-DvCdLTq_QA).

:::

Phần lớn các bài viết về dịch vụ sinh Distributed ID trên mạng thường tập trung mổ xẻ nguyên lý kỹ thuật, rất ít bài phân tích cách lựa chọn dịch vụ sinh ID dựa trên từng kịch bản nghiệp vụ cụ thể.

Bài viết này sẽ kết hợp một số kịch bản sử dụng thực tế để đi sâu vào các yêu cầu cụ thể đối với ID trong từng bài toán nghiệp vụ.

Nếu bạn chưa xem qua nguyên lý và sự đánh đổi của UUID, mô hình dải số (Segment Mode), Snowflake, Leaf hay Tinyid, nên đọc trước bài [Giải thích chi tiết các giải pháp tạo Distributed ID](./distributed-id.md). Bài này nghiêng về thiết kế nghiệp vụ: cùng là ID, mã đơn hàng quan tâm hơn tới khả năng tra cứu và bảo mật, TraceId quan tâm hơn tới việc truyền xuyên suốt chuỗi gọi (call chain), còn URL rút gọn (Short URL) quan tâm hơn tới độ dài và tính dễ đọc.

## Kịch bản 1: Hệ thống đơn hàng

Khi mua sắm tại trung tâm thương mại với mã QR thanh toán chung ("thanh toán một mã"), mã đơn hàng sinh ra lúc đặt đơn, mã giảm giá (coupon) sử dụng hay mã đổi quà sản phẩm liên kết — đây đều là những loại mã quen thuộc khi mua sắm trực tuyến. Vậy tại sao có những mã rất dài, trong khi có những mã chỉ vỏn vẹn vài ký tự? Tại sao có mã nhìn vào là biết ngay thông tin ngày tháng năm, còn có mã lại chẳng thấy ý nghĩa gì? Dưới đây sẽ phân tích chi tiết cách triển khai dịch vụ ID cho từng kịch bản khác nhau trong hệ thống đơn hàng.

### 1. Thanh toán một mã (Unified QR Payment)

Cái gọi là "thanh toán một mã" thường gặp là việc một mã QR duy nhất có thể dùng cả Alipay hoặc WeChat Pay để quét thanh toán.

Bản chất của mã QR là một chuỗi ký tự; bản chất của mã QR gộp (aggregated code) là một đường dẫn URL. Người dùng dùng Alipay hay WeChat quét thẳng vào cùng một mã để trả tiền, không phải lo lấy Alipay quét nhầm mã thu tiền của WeChat hay ngược lại, giúp giảm đáng kể thời gian thao tác thanh toán của người dùng.

Nguyên lý triển khai là sau khi khách hàng dùng app quét mã, phía backend của website sẽ nhận diện môi trường quét mã của khách hàng (WeChat, Alipay, QQ Wallet, JD Pay, UnionPay QuickPass, v.v.).

Cách nhận diện môi trường quét mã dựa vào HTTP header của trình duyệt khi mở đường dẫn. Bất kỳ trình duyệt nào khi mở một liên kết HTTP, phần request header đều mang thông tin `User-Agent` (UA — Tác nhân người dùng).

UA là một chuỗi header đặc biệt giúp Server lần lượt nhận biết được hệ điều hành và phiên bản của khách hàng, loại CPU, trình duyệt và phiên bản, engine kết xuất của trình duyệt, ngôn ngữ trình duyệt, plugin trình duyệt cùng nhiều thông tin khác.

Tên sản phẩm thanh toán tương ứng của mỗi kênh là khác nhau, nhất định phải đọc kỹ tài liệu API của từng sản phẩm thanh toán:

1. WeChat Pay: Thanh toán JSAPI
2. Alipay: Thanh toán website di động (Mobile Web Payment)
3. QQ Wallet: Thanh toán Official Account

Bản chất của cả ba đều là hiện thực hóa thanh toán HTML5 ngay bên trong trình duyệt tích hợp sẵn của app.

![Ví dụ thanh toán hội viên Wenku](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-id-design-pay-one-card-27bd61a0.png)

Các kỹ sư của Baidu Wenku đã tối ưu và cải tiến thêm dựa trên ý tưởng này. Họ sinh động mã QR thanh toán một mã được gắn sẵn thông tin sản phẩm và mức giá người dùng đã chọn, cập nhật linh hoạt theo lựa chọn sản phẩm của người dùng. Nhờ đó không chỉ hỗ trợ một mã kích hoạt thanh toán trên đa nền tảng, mà người dùng còn hoàn tất thanh toán đơn hàng mượt mà không cần chọn lại sản phẩm hay nhập số tiền. Chỉ khi người dùng thực sự quét mã, Server mới thông qua Frontend lấy User UID, kết hợp với thông tin sản phẩm đã gắn vào mã QR để tạo đơn hàng thực sự, gửi thông tin thanh toán tới bên thứ ba (QQ, WeChat, Alipay), sau đó bên thứ ba tạo lệnh thanh toán đẩy về thiết bị người dùng để bật giao diện thanh toán.

Khác với mã thanh toán một mã cố định, trong ứng dụng của Wenku đã sử dụng mã QR động; bản chất của mã QR là một đường dẫn rút gọn (Short URL), còn dịch vụ ID cung cấp tham số định danh duy nhất cho Short URL đó. ID được ánh xạ bởi Short URL duy nhất này gắn liền với thông tin đơn hàng sản phẩm — sự kết hợp sâu sắc giữa kỹ thuật và nghiệp vụ giúp rút ngắn quy trình thanh toán và nâng cao trải nghiệm thanh toán cho người dùng.

### 2. Mã đơn hàng

Trong quy trình nghiệp vụ thực tế, mã đơn hàng đóng vai trò mã định danh duy nhất của một đơn hàng, thường phục vụ các kịch bản nghiệp vụ sau:

1. Đơn hàng của người dùng gặp vấn đề, cần liên hệ chăm sóc khách hàng (CSKH) để được hỗ trợ;
2. Thực hiện thao tác trên đơn hàng như thu tiền trực tiếp tại quầy hoặc đối soát/xác nhận đơn hàng;
3. Xử lý và theo dõi vòng đời đơn hàng nội bộ hệ thống như đặt đơn, sửa đơn, hoàn tất đơn, hoàn/trả đơn và hậu mãi.

Phần lớn các thao tác tìm kiếm thông tin liên quan đến đơn hàng đều lấy ID đơn hàng làm định danh duy nhất, điều này được quyết định bởi tính duy nhất trong quy tắc sinh mã đơn hàng. Xét ở góc độ kỹ thuật, ngoài các đặc tính bắt buộc của một dịch vụ ID, thiết kế mã đơn hàng còn cần thể hiện một số đặc tính sau:

**(1) An toàn thông tin**

Mã số không được làm lộ tình hình vận hành của công ty — chẳng hạn doanh số theo ngày, tổng số giao dịch của công ty — cũng như thông tin thương mại hay thông tin riêng tư của người dùng như số điện thoại, số căn cước công dân. Đồng thời không được có quy luật tổng thể rõ ràng (có thể có quy luật cục bộ); tuyệt đối không cho phép chỉ sửa tùy ý một ký tự là có thể tra cứu ra thông tin của một đơn hàng khác.

Liên hệ với quy tắc sinh số báo danh kỳ thi đại học (Gaokao): tuyệt đối không được đánh số liên tiếp, nếu không chỉ cần dò theo thứ tự tăng dần là có thể tra ra điểm số của thí sinh khác — điều này hoàn toàn không thể chấp nhận được.

**(2) Khả năng đọc cục bộ (Partial Readability)**

Độ dài chữ số phải thuận tiện cho thao tác, do đó yêu cầu mã đơn hàng có độ dài vừa phải và có quy luật cục bộ. Như vậy sẽ thuận tiện cho nhân viên CSKH tra cứu khi đơn hàng phát sinh bất thường hoặc hoàn trả hàng.

Mã đơn hàng quá dài hoặc khó đọc sẽ khiến nhân viên CSKH nhập liệu khó khăn và tỷ lệ sai sót cao, ảnh hưởng đến trải nghiệm hậu mãi của người dùng. Vì vậy trong các kịch bản nghiệp vụ thực tế, thiết kế mã đơn hàng thường gắn khéo léo một số thông tin được phép công khai và hữu ích cho bối cảnh sử dụng như thời gian, thứ trong tuần, loại đơn, v.v., chủ yếu tùy vào bối cảnh sử dụng của từng loại mã.

Hơn nữa, những thành phần tự tăng theo thời gian như ngày tháng hay thứ trong tuần khi đưa vào cấu trúc mã đơn hàng còn giúp giải quyết vấn đề trùng lặp mã đơn hàng do dữ liệu tích lũy lâu ngày.

**(3) Hiệu năng truy vấn**

Mã đơn hàng của các sàn thương mại điện tử phổ biến đa số cấu thành hoàn toàn bằng chữ số; vừa đảm bảo dễ đọc, lại vừa tận dụng việc kiểu số (`int`/`bigint`) có hiệu năng truy vấn cao hơn kiểu chuỗi (`varchar`), thân thiện hơn với nghiệp vụ trực tuyến.

### 3. Mã giảm giá (Coupon) và phiếu đổi quà (Voucher)

Coupon và phiếu đổi quà là một trong những công cụ khuyến mãi phổ biến nhất của đội vận hành (Operations); sử dụng hợp lý giúp người mua được hưởng ưu đãi còn người bán tăng sản lượng. Các kịch bản thường gặp gồm:

1. Mua sản phẩm liên kết [Wenku VIP + Gói năm QQ Music] trên Wenku, sau khi thanh toán thành công sẽ nhận được mã đổi gói năm QQ Music để vào app QQ Music quy đổi hội viên âm nhạc theo năm;
2. Phiếu tiêu dùng kích cầu do chính quyền địa phương phát hành trong giai đoạn dịch bệnh;
3. Nước giải khát đóng chai thường có chương trình nhập mã ưu đãi dưới nắp chai để đổi thưởng.

![Nhập mã ưu đãi đổi thưởng](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-id-design-coupon-21426ab7.png)

Xét ở góc độ kỹ thuật, một số kịch bản phù hợp với việc sinh ID tức thời (on-demand), ví dụ khi mua sắm trên sàn TMĐT và nhận coupon thì chỉ cần cấp phát thông tin coupon ngay tại lúc người dùng bấm nhận. Còn một số kịch bản kết hợp trực tuyến và ngoại tuyến (O2O) — như phiếu ưu đãi phát hành diện rộng, mở nắp chai trúng thưởng, thẻ quà tặng JD hay thẻ siêu thị — lại cần sinh trước (pre-generate). Mã phiếu sinh trước mang các đặc tính sau:

1. Sinh trước, cung cấp sẵn trước khi chiến dịch chính thức bắt đầu để chạy truyền thông làm nóng chương trình;

2. Số lượng coupon cực lớn, tính theo đơn vị hàng vạn, thường từ 100.000 mã trở lên;

3. Không thể bị bẻ khóa hay làm giả mã phiếu;

4. Hỗ trợ đối soát và gạch bỏ (redeem) sau khi sử dụng;

5. Coupon và phiếu đổi quà thuộc chiến lược phát hành diện rộng nên tỷ lệ sử dụng thực tế thấp, do đó không phù hợp dùng cơ sở dữ liệu để lưu trữ toàn bộ **(tốn dung lượng lưu trữ mà dữ liệu có hiệu lực sử dụng lại ít)**.

Về mặt tư duy thiết kế, cần xây dựng một chiến lược sinh mã đổi quà hiệu quả: hỗ trợ sinh trước, hỗ trợ kiểm tra hợp lệ, nội dung ngắn gọn và mọi mã sinh ra đều mang tính duy nhất. Chiến lược này thực chất là một cơ chế mã hóa/giải mã (encoding/decoding) đặc thù, vận hành theo quy tắc ước định để đáp ứng trọn vẹn các yêu cầu trên.

Đã là một quy tắc mã hóa/giải mã thì cần quy ước không gian mã hóa (tức tập ký tự hiển thị cho người dùng cấu thành mã đổi quà). Không gian mã hóa gồm các ký tự `a-z`, `A-Z` và chữ số `0-9`; để tăng khả năng nhận diện bằng mắt thường, loại bỏ hai chữ cái hoa dễ nhầm là `O` và `I`, các ký tự khả dụng gồm đúng 60 ký tự như sau:

abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXZY0123456789

Như đã nói trước đó, mã đổi quà yêu cầu càng ngắn gọn càng tốt, nên khi thiết kế cần cân nhắc số lượng ký tự của mã. Giả sử giới hạn tối đa là 12 ký tự, với không gian 60 ký tự thì dải không gian biểu diễn được là 60^12=130606940160000000000000 (tức là mã đổi quà 12 ký tự có thể sinh ra một lượng mã khổng lồ, thừa sức để đội vận hành thoải mái sử dụng), chuyển sang hệ nhị phân là:

1001000100000000101110011001101101110011000000000000000000000 (61 bit)

**Phân tích các thành phần cấu tạo mã đổi quà**

Mã đổi quà có thể sinh trước mà không cần tốn thêm không gian lưu trữ để ghi lại toàn bộ thông tin này. Mỗi chương trình khuyến mãi có một tập mã đổi quà độc lập (tức mỗi chiến dịch do đội vận hành tổ chức có bộ mã riêng, không thể dùng lẫn cho nhau — ví dụ mã của dịp 11/11 không thể đem dùng cho sự kiện 12/12). Mỗi mã đổi quà có số thứ tự riêng để chống trùng lặp, và để đảm bảo tính hợp lệ của mã đổi quà thì cần thực hiện kiểm tra dữ liệu của mã. Thành phần dữ liệu của mã đổi quà hiện tại như sau:

ID chương trình ưu đãi + Số thứ tự mã đổi quà `i` + Mã kiểm tra (Checksum)

**Phương án mã hóa**

1. Số thứ tự mã đổi quà `i`: đại diện cho mã đổi quà thứ `i` trong chiến dịch hiện tại. Phạm vi giá trị của số thứ tự quyết định tổng số lượng mã có thể phát hành trong một chương trình ưu đãi; hiện dùng 30 bit để biểu diễn, cho phạm vi lên tới 1.073.741.824 (hơn 1 tỷ mã phiếu).
2. ID chương trình ưu đãi: đại diện cho mã định danh của chương trình ưu đãi hiện tại. Phạm vi giá trị quyết định số lượng chiến dịch ưu đãi có thể tổ chức; hiện dùng 15 bit để biểu diễn, cho phạm vi 32.768 (xét theo tần suất tổ chức sự kiện và giá trị ID khởi đầu là 10.000, 15 bit là quá đủ — kể cả mỗi ngày trong năm đều có chiến dịch, 365 ngày/năm thì vẫn dùng được 54 năm).
3. Mã kiểm tra (Checksum): kiểm tra xem mã đổi quà có hợp lệ hay không, chủ yếu để xác thực nhanh tính đúng đắn của thông tin mã đổi quà, đồng thời đóng vai trò đệm dữ liệu (padding) giúp tăng tính phân tán của dữ liệu; sử dụng 13 bit làm bit kiểm tra, chia làm hai phần gồm 6 bit đầu và 7 bit cuối.

Đi sâu hơn vào nghiệp vụ sẽ còn phân biệt giữa mã dùng chung (Universal Coupon) và mã phát riêng lẻ (Individual Coupon), mỗi loại có đặc thù riêng đòi hỏi cách triển khai kỹ thuật phù hợp:

1. Mã dùng chung: Nhiều người chơi/người dùng đều có thể nhập cùng một mã để quy đổi, đi kèm giới hạn tổng lượt dùng và thời hạn hiệu lực.
2. Mã phát riêng lẻ: Nhân viên vận hành thiết lập vật phẩm phần thưởng, thời hạn và số lượng trong trang quản trị, sau đó backend sinh ra danh sách các mã đổi quà riêng biệt, sau khi quy đổi sẽ lập tức đánh dấu đã sử dụng (gạch mã).

## Kịch bản 2: Tracing (Truy vết phân tán)

### 1. Truy vết Log (Log Tracing)

Trong kiến trúc dịch vụ phân tán, một Web request đi vào từ Gateway có thể gọi tới nhiều service khác nhau để xử lý và tổng hợp kết quả cuối cùng. Quá trình giao tiếp giữa các service đó lại là những network request riêng biệt; bất kỳ service nào trên luồng xử lý gặp sự cố hoặc phản hồi quá chậm đều sẽ gây ảnh hưởng lên phía Frontend.

Khi xử lý một Web request phải gọi qua nhiều service, để dễ dàng tra cứu xem khâu service nào đang gặp vấn đề, giải pháp phổ biến hiện nay là tích hợp hệ thống truy vết chuỗi gọi phân tán (Distributed Tracing) cho toàn bộ hệ thống.

![Trong truy vết chuỗi gọi phân tán](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-id-design-tracing-5d3a4ae4.png)

Trong Distributed Tracing có hai khái niệm cốt lõi: **Trace (vết truy)** và **Span (nhịp/đoạn gọi)**. `Trace` là góc nhìn toàn bộ chuỗi gọi của một request trong hệ thống phân tán, còn `Span` đại diện cho góc nhìn bên trong từng service thành phần dọc theo chuỗi gọi đó; các `Span` ghép lại với nhau sẽ tạo thành toàn bộ bức tranh `Trace`.

Trong suốt chuỗi gọi của request, request sẽ luôn mang theo `TraceId` truyền xuống các service phía dưới (downstream), đồng thời bản thân mỗi service cũng sinh ra `SpanId` của riêng mình để tạo góc nhìn lời gọi nội bộ và truyền tiếp cùng `TraceId` xuống các service tuyến dưới.

### 2. Quy tắc sinh TraceId

Trong kịch bản này, ID sinh ra ngoài yêu cầu duy nhất còn phải có hiệu suất sinh rất cao và thông lượng lớn. `TraceId` cần có năng lực để từng server instance ở tầng tiếp nhận (ingress) tự sinh độc lập; nếu mọi `TraceId` đều phải gọi qua một dịch vụ ID dùng chung để lấy số thì thực sự quá lãng phí băng thông mạng, đồng thời làm nghẽn luồng chuyển tiếp request của người dùng xuống tuyến dưới, tăng độ trễ phản hồi và kéo theo rủi ro không cần thiết. Vì vậy cần để bản thân server instance tự tính toán ra `TraceId` và `SpanId`, tránh phụ thuộc vào dịch vụ bên ngoài.

Quy tắc sinh: `IP máy chủ + Thời điểm sinh ID + Chuỗi tự tăng + Process ID hiện tại`, ví dụ:

0ad1348f1403169275002100356696

8 ký tự đầu `0ad1348f` chính là IP của máy đã sinh ra `TraceId`, đây là một chuỗi hệ thập lục phân (hex), cứ mỗi 2 ký tự đại diện cho một phân đoạn của IP; chuyển từng cặp 2 ký tự sang hệ thập phân ta sẽ thu được địa chỉ IP quen thuộc `10.209.52.143`. Bạn cũng có thể dựa theo quy luật này để truy ngược ra máy chủ đầu tiên mà request đã đi qua.

13 chữ số tiếp theo `1403169275002` là thời điểm sinh `TraceId`. 4 chữ số kế tiếp `1003` là một chuỗi tự tăng, đếm từ `1000` lên `9000`, chạm `9000` lại quay vòng về `1000` rồi tăng tiếp. 5 chữ số cuối cùng `56696` là Process ID (PID) hiện tại; việc gắn thêm PID ở cuối `TraceId` nhằm phòng ngừa xung đột `TraceId` khi chạy nhiều tiến trình trên cùng một máy.

### 3. Quy tắc sinh SpanId

`Span` mang ý nghĩa là tầng (layer): ví dụ ở instance đầu tiên được tính là tầng 1; khi request được proxy hoặc điều hướng sang instance tiếp theo xử lý thì đó là tầng 2, cứ thế tiếp tục. Thông qua các tầng, `SpanId` đại diện cho vị trí của lời gọi hiện tại trong toàn bộ cây chuỗi gọi (call-chain tree).

Giả sử một server instance A tiếp nhận một request từ người dùng, đại diện cho node gốc của toàn bộ lời gọi: mọi bản ghi log không gọi service ngoài do tầng A sinh ra khi xử lý request này đều có giá trị `SpanId = 0`. Nếu tầng A cần gọi RPC tuần tự tới ba server instance B, C, D, thì trong log của A, các `SpanId` lần lượt là `0.1`, `0.2` và `0.3`, đồng thời trong B, C, D các `SpanId` tương ứng cũng là `0.1`, `0.2` và `0.3`. Nếu hệ thống C khi xử lý request lại gọi tiếp tới hai server instance E và F, thì trong hệ thống C `SpanId` tương ứng là `0.2.1` và `0.2.2`, và log tương ứng ở hai hệ thống E, F cũng là `0.2.1` và `0.2.2`.

Theo mô tả trên có thể thấy, nếu thu thập toàn bộ `SpanId` trong một lần gọi lại, ta có thể dựng thành một cây chuỗi gọi hoàn chỉnh.

**Bản chất của việc sinh `SpanId`: vừa truyền xuyên suốt (propagate) qua các tầng, vừa kiểm soát việc tăng dần các số phiên bản chính/phụ theo cấp bậc.**

## Kịch bản 3: URL rút gọn (Short URL)

Dịch vụ URL rút gọn chủ yếu gồm hai tính năng chính là rút gọn URL và khôi phục (chuyển hướng) URL. So với URL dài, URL rút gọn thuận tiện hơn nhiều khi chia sẻ qua email, mạng xã hội, Weibo và điện thoại di động; chẳng hạn một đường dẫn vốn rất dài sau khi đi qua dịch vụ Short URL sẽ tạo ra đường dẫn rút gọn tương ứng, tránh bị ngắt dòng hoặc vượt quá giới hạn ký tự.

![Vai trò của URL rút gọn](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/distributed-id-design-short-url-78ae2b0c.png)

Các dịch vụ sinh ID phổ biến như MySQL auto-increment ID, Redis key `INCR` hay mô hình dải số (Segment Mode) đều tạo ra ID là một chuỗi chữ số. Khi dịch vụ Short URL chuyển đổi URL dài của khách hàng thành URL rút gọn, thực chất là ghép thêm ID kiểu số mới sinh vào sau tên miền `dwz.cn`. Nếu dùng thẳng ID số thập phân thì độ dài URL vẫn hơi dài, nên dịch vụ có thể nén độ dài bằng cách chuyển đổi ID số sang hệ cơ số cao hơn (như Base62). Thuật toán nén bằng chuyển đổi hệ cơ số này ngày càng phổ biến trong triển khai kỹ thuật của Short URL vì nó giúp thu gọn đáng kể độ dài liên kết và có nhiều ứng dụng rộng rãi trong đời sống. Ví dụ:

- URL dài của khách hàng: <https://wenku.baidu.com/ndbusiness/browse/wenkuvipcashier?cashier_code=PCoperatebanner>
- URL rút gọn ánh xạ trực tiếp từ ID số: <https://dwz.cn/2047601319t66> (chỉ dùng để minh họa, có thể không mở được)
- URL rút gọn sau khi chuyển đổi hệ cơ số: <https://dwz.cn/2ezwDJ0> (chỉ dùng để minh họa, có thể không mở được)
