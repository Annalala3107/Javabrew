---
title: HTTP vs HTTPS: Điểm khác biệt là gì, vì sao HTTPS an toàn hơn (Tầng ứng dụng)
description: So sánh giao thức và cơ chế bảo mật giữa HTTP và HTTPS, phân tích nguyên lý hoạt động và quy trình bắt tay SSL/TLS, làm rõ các chi tiết triển khai bảo mật tầng ứng dụng.
category: Kiến thức máy tính cơ bản
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: HTTP,HTTPS,SSL,TLS,mã hóa,xác thực,cổng,tính bảo mật,quy trình bắt tay
lang: vi
sourceRef: zh-ref/cs-basics/network/http-vs-https.md
---

HTTP có thể truyền tải nội dung trang web, nhưng mặc định là truyền dưới dạng văn bản thuần (plaintext). Nếu request và response bị nghe lén, chỉnh sửa hoặc giả mạo trên đường truyền mạng, bản thân HTTP không có đủ khả năng tự bảo vệ.

HTTPS không phải là một giao thức tầng ứng dụng hoàn toàn mới, mà là việc sử dụng TLS để bảo vệ các giao tiếp HTTP. Trong HTTP/1.1 và các kịch bản HTTP/2 phổ biến, TLS thường chạy trên nền TCP; còn HTTP/3 ánh xạ ngữ nghĩa HTTP sang giao thức QUIC dựa trên UDP, đồng thời tích hợp TLS 1.3 trực tiếp bên trong QUIC.

Bài viết này chủ yếu giải đáp một số câu hỏi:

1. Điểm khác biệt cốt lõi giữa HTTP và HTTPS là gì?
2. HTTPS ngăn chặn việc nghe lén, chỉnh sửa và giả mạo như thế nào?
3. Quá trình bắt tay SSL/TLS về cơ bản làm những công việc gì?
4. Tại sao sau khi dùng HTTPS, chứng chỉ số (certificate), mixed content và tối ưu hóa hiệu năng vẫn là những vấn đề cần quan tâm?

## Giao thức HTTP

### Giới thiệu giao thức HTTP

Giao thức HTTP, tên đầy đủ là Hypertext Transfer Protocol (Giao thức truyền tải siêu văn bản). Đúng như tên gọi, HTTP dùng để chuẩn hóa việc truyền tải siêu văn bản — siêu văn bản ở đây là đủ mọi loại thông điệp trên mạng bao gồm cả văn bản — cụ thể hơn là quy định hành vi giao tiếp giữa trình duyệt và máy chủ (server).

Đồng thời, HTTP là một giao thức phi trạng thái (stateless), nghĩa là server không lưu giữ bất kỳ thông tin nào về các request trong quá khứ của client. Điều này thực chất là một sự đơn giản hóa có chủ đích: giao thức có trạng thái (stateful) sẽ phức tạp hơn rất nhiều, đòi hỏi phải duy trì trạng thái (thông tin lịch sử), và nếu client hoặc server gặp sự cố thì sẽ dẫn đến bất đồng bộ trạng thái, chi phí giải quyết sự bất đồng bộ này còn tốn kém hơn nhiều.

![HTTP: Tổng quan về Giao thức truyền tải siêu văn bản](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/http-overview-f3be5ebb.png)

### Quy trình giao tiếp của giao thức HTTP

HTTP là giao thức tầng ứng dụng. Dưới đây lấy HTTP/1.1 dựa trên TCP làm ví dụ để minh họa quy trình giao tiếp, cổng mặc định của URL `http` là 80:

1. Server lắng nghe request của client tại cổng 80.
2. Trình duyệt khởi tạo kết nối TCP tới server (tạo Socket).
3. Server chấp nhận kết nối TCP từ trình duyệt.
4. Trình duyệt (HTTP client) và Web server (HTTP server) trao đổi các thông điệp HTTP.
5. Đóng kết nối TCP.

### Ưu điểm của giao thức HTTP

Khả năng mở rộng mạnh mẽ, tốc độ nhanh và hỗ trợ đa nền tảng rất tốt.

## Giao thức HTTPS

### Giới thiệu giao thức HTTPS

HTTPS (Hypertext Transfer Protocol Secure) sử dụng TLS để cung cấp tính bảo mật (confidentiality), tính toàn vẹn (integrity) và xác thực danh tính (authentication) cho HTTP, với cổng mặc định là 443. HTTP/1.1 và HTTP/2 thường sử dụng TLS qua TCP; HTTP/3 sử dụng QUIC tích hợp sẵn TLS 1.3, với QUIC được xây dựng trên nền UDP.

Trong HTTPS, sau khi hoàn tất quá trình bắt tay TLS, dữ liệu truyền thông sẽ được bảo vệ bằng các thuật toán mã hóa đối xứng AEAD như AES-GCM, ChaCha20-Poly1305. Quá trình bắt tay có thể sử dụng (EC)DHE để thỏa thuận khóa bí mật dùng chung (shared secret), hoặc sử dụng PSK trong các kịch bản khôi phục phiên (session resumption); các phiên bản TLS cũ từng hỗ trợ truyền khóa qua RSA. Cần lưu ý rằng ECDH/ECDHE là thuật toán thỏa thuận khóa, chứ không phải dùng public key để mã hóa một khóa đối xứng được sinh sẵn.

### Ưu điểm của giao thức HTTPS

Tính bảo mật cao, độ tin cậy lớn.

## Trọng tâm của HTTPS — Giao thức SSL/TLS

Năng lực bảo mật của HTTPS đến từ TLS. TLS cung cấp khả năng bảo vệ tính bảo mật và tính toàn vẹn cho dữ liệu giao tiếp, đồng thời xác thực đối tác giao tiếp thông qua cơ chế chứng chỉ số (certificate). Tiếp theo chúng ta sẽ tập trung vào nguyên lý hoạt động của TLS.

### Sự khác biệt giữa SSL và TLS?

**SSL và TLS không có quá nhiều sự khác biệt về bản chất tiến hóa.**

SSL là viết tắt của Secure Sockets Layer (Tầng socket an toàn), được phát hành lần đầu vào năm 1996 (bản SSL 3.0). SSL 1.0 chưa từng được công bố ra ngoài, còn SSL 2.0 có những lỗ hổng bảo mật nghiêm trọng (lỗ hổng DROWN — Decrypting RSA with Obsolete and Weakened eNcryption). Rất nhanh sau đó, vào năm 1999, SSL 3.0 được nâng cấp thêm một bước và **phiên bản mới được đặt tên là TLS 1.0**. Do đó, TLS được kế thừa và phát triển từ SSL, nhưng theo thói quen gọi tên, người ta thường gọi chung giao thức mã hóa cốt lõi trong HTTPS là SSL/TLS. Hiện nay SSL đã bị khai tử hoàn toàn, TLS 1.2 và TLS 1.3 là chuẩn mực thực tế của HTTPS hiện đại.

### Nguyên lý hoạt động của SSL/TLS

#### Mã hóa bất đối xứng

TLS sử dụng cơ chế mật mã bất đối xứng để hoàn tất việc xác thực danh tính và/hoặc thỏa thuận khóa, sau đó mới dùng khóa đối xứng để bảo vệ dữ liệu nghiệp vụ. Mật mã bất đối xứng không chỉ có mỗi công dụng "mã hóa bằng public key, giải mã bằng private key": chữ ký số sử dụng private key để ký và public key để xác thực, trong khi ECDHE dùng khóa tạm thời (ephemeral key) của hai bên để thỏa thuận bí mật dùng chung. Ẩn dụ về hộp thư dưới đây chỉ dùng để giải thích khái niệm cơ bản về các lược đồ mã hóa public-key như RSA, chứ không đại diện cho toàn bộ các quy trình bắt tay TLS.

> Tại một bưu điện tự phục vụ, mỗi kênh liên lạc là một hòm thư. Mỗi chủ sở hữu hòm thư đều đặt một tấm biển bên cạnh và treo một chiếc chìa khóa: Đây là public key của tôi, người gửi hãy bỏ thư vào hòm thư của tôi và dùng public key này khóa lại.
>
> Tuy nhiên, public key này chỉ có thể khóa mà không thể mở khóa. Việc mở khóa chỉ có thể do chủ sở hữu hòm thư thực hiện — vì chỉ có người đó mới giữ private key.
>
> Nhờ đó, thông tin thư từ sẽ không bị người khác chặn xem trộm, điều này phụ thuộc vào tính bí mật của private key.

![Quy trình mã hóa bằng public key và giải mã bằng private key trong mật mã bất đối xứng](/media/jg/local/cs-basics/network/images/http-vs-https/public-key-cryptography-fa491c.png)

Cặp public key và private key trong mã hóa bất đối xứng cần được tạo ra bằng một cơ chế toán học phức tạp (mật mã học khuyên rằng để đảm bảo tính an toàn cao, tuyệt đối không nên tự chế ra phương pháp mã hóa riêng). Thuật toán sinh cặp khóa dựa vào hàm một chiều có cửa bẫy (one-way trapdoor function).

> Hàm một chiều: Cho trước hàm một chiều f, với bất kỳ đầu vào x nào, đều rất dễ tính toán ra đầu ra y = f(x); nhưng cho trước đầu ra y, giả sử tồn tại f(x) = y, rất khó để tính ngược lại x dựa vào f.
>
> Hàm một chiều có cửa bẫy: Một hàm một chiều có điều kiện đặc biệt. Cho trước hàm một chiều f và cửa bẫy h, với bất kỳ đầu vào x nào, đều dễ dàng tính được đầu ra y = f(x; h); nhưng cho trước đầu ra y, giả sử f(x; h) = y, rất khó tính ngược ra x nếu chỉ dựa vào f, tuy nhiên lại có thể suy ra x rất nhanh nếu biết cả f và h.

![Hàm một chiều](/media/jg/local/cs-basics/network/images/http-vs-https/OWF-7dbc51.png)

Hình trên là một hàm một chiều (không phải hàm một chiều có cửa bẫy). Giả sử có một bí kíp tuyệt thế, bất kỳ ai biết bí kíp này đều có thể biến nước ép táo trở lại thành quả táo nguyên vẹn, thì bí kíp đó chính là "cửa bẫy".

Ở đây, cách tính của hàm f tương đương với public key, còn cửa bẫy h tương đương với private key. Public key f được công khai, bất kỳ ai có đầu vào đều có thể dùng f để mã hóa; nhưng muốn khôi phục dữ liệu ban đầu từ thông tin đã mã hóa, bắt buộc phải có private key.

#### Mã hóa đối xứng

TLS không sử dụng trực tiếp các thuật toán mã hóa bất đối xứng để mã hóa khối lượng lớn dữ liệu nghiệp vụ. Sau khi giai đoạn bắt tay hoàn tất việc xác thực danh tính và thiết lập khóa, tầng record layer sẽ dùng thuật toán đối xứng AEAD để bảo vệ các HTTP request và response.

> Mã hóa đối xứng: Hai bên giao tiếp cùng chia sẻ một khóa duy nhất k, thuật toán mã hóa và giải mã đã được thống nhất, bên gửi dùng khóa k để mã hóa, bên nhận dùng khóa k để giải mã; độ an toàn phụ thuộc vào việc giữ bí mật khóa k.

![Mã hóa đối xứng nơi hai bên sử dụng khóa dùng chung để mã hóa dữ liệu](/media/jg/local/cs-basics/network/images/http-vs-https/symmetric-encryption-a4e0d4.png)

Hai bên giao tiếp cần thiết lập các khóa lưu lượng (traffic keys) mà chỉ riêng họ biết qua một môi trường mạng không an toàn. Cơ chế trao đổi khóa RSA tĩnh trong TLS 1.2 yêu cầu client sinh ra `PreMasterSecret`, sau đó mã hóa bằng RSA public key của server rồi gửi đi; TLS hiện đại thường dùng ECDHE hơn, cho phép hai bên trao đổi public key tạm thời và mỗi bên tự tính toán ra cùng một shared secret. TLS 1.3 đã loại bỏ hoàn toàn cơ chế trao đổi khóa RSA tĩnh, cho phép các phương thức thiết lập khóa như (EC)DHE, PSK hoặc PSK+(EC)DHE. Dù sử dụng phương thức nào thì cuối cùng cũng đều phái sinh (derive) ra khóa đối xứng để bảo vệ dữ liệu tiếp theo; không có lược đồ mật mã nào có thể tự nhận là "an toàn tuyệt đối".

#### Độ tin cậy trong truyền tải Public Key

Đến đây, những ai am hiểu về an toàn thông tin sẽ nghĩ ngay đến một nguy cơ bảo mật. Hãy tưởng tượng tình huống sau:

> Client C và Server S muốn giao tiếp bằng SSL/TLS. Theo nguyên lý giao tiếp SSL/TLS ở trên, C cần biết public key của S trước, và cách duy nhất để lấy public key của S là truyền public key đó qua kênh mạng. Cần chú ý một số tiền đề trong truyền thông qua kênh mạng:
>
> 1. Bất kỳ ai cũng có thể bắt gói tin (packet).
> 2. Tính bảo mật của gói tin do bên gửi thiết kế.
> 3. Thiết kế của thuật toán bảo mật mặc định là công khai, còn khóa (giải mã) mặc định là an toàn.
>
> Do đó, giả sử public key của S không được mã hóa mà truyền trực tiếp qua kênh mạng, rất có thể sẽ có một kẻ tấn công A gửi một gói tin giả mạo cho C, mạo danh đó là public key của S nhưng thực chất là public key của server mồi nhử AS. Khi C nhận được public key của AS (nhưng vẫn ngỡ là của S), C sau đó sẽ dùng public key của AS để mã hóa dữ liệu rồi gửi qua mạng công cộng. Lúc này A sẽ bắt các gói tin mã hóa đó, dùng private key của AS để giải mã, và thế là đã đánh cắp toàn bộ nội dung C định gửi cho S mà cả C lẫn S đều không hề hay biết.
>
> Tương tự, ngay cả khi public key của S được mã hóa thì cũng khó tránh khỏi vấn đề lòng tin này: C đã bị AS lừa mất rồi!

![Kẻ trung gian thay thế public key của server khiến client tin tưởng nhầm public key của kẻ tấn công](/media/jg/local/cs-basics/network/images/http-vs-https/attack1-7043a4.png)

Để giải quyết vấn đề độ tin cậy khi truyền tải public key, các tổ chức bên thứ ba đã ra đời — cơ quan cấp chứng chỉ (CA, Certificate Authority). CA mặc định là bên thứ ba đáng tin cậy. CA sẽ cấp chứng chỉ cho từng server, chứng chỉ được lưu trên server và có đính kèm **chữ ký điện tử** của CA (xem mục tiếp theo).

Khi server xác thực bằng chứng chỉ, client sẽ nhận chuỗi chứng chỉ (certificate chain) do server cung cấp và xác minh xem chuỗi chữ ký có dẫn tới một Root CA được tin cậy cục bộ hay không, đồng thời kiểm tra tên miền (hostname), thời hạn hiệu lực, mục đích sử dụng khóa và các ràng buộc đường dẫn. Chỉ khi tất cả các kiểm tra này vượt qua thành công, client mới gắn kết (bind) public key trong chứng chỉ với danh tính của dịch vụ mục tiêu. Các phương thức xác thực không dùng chứng chỉ như PSK thuộc về một nhóm kịch bản khác.

#### Chữ ký số

Đến phần này đã là hồi kết của quy trình SSL/TLS. Mục trước đã nhắc đến chữ ký số (digital signature); vấn đề mà chữ ký số giải quyết là ngăn chặn việc làm giả chứng chỉ. Tổ chức trung gian đáng tin cậy CA sở dĩ được tin cậy là **nhờ vào công nghệ chữ ký số**.

Chữ ký số dùng để phát hiện nội dung chứng chỉ có bị chỉnh sửa hay không, đồng thời chứng minh chữ ký được tạo ra bởi bên nắm giữ private key của CA. Cần mô tả quy trình này là "ký bằng private key, xác thực bằng public key", chứ không phải hiểu máy móc theo nghĩa thông thường là "mã hóa bằng private key, giải mã bằng public key". Hành vi cụ thể như sau:

> Sau khi CA thẩm định thông tin đăng ký, họ dùng private key của mình để tạo chữ ký số cho phần dữ liệu cần ký của chứng chỉ, và đính kèm chữ ký đó vào chứng chỉ.
>
> Server gửi chuỗi chứng chỉ cho client. Client dùng public key trong chứng chỉ của bên cấp phát để xác minh chữ ký của chứng chỉ hiện tại, và xác minh từng cấp ngược lên Root CA tin cậy cục bộ.
>
> Việc xác thực chữ ký chỉ là một phần trong quy trình xác minh chứng chỉ. Client còn phải kiểm tra tên miền mục tiêu, thời hạn hiệu lực, mục đích sử dụng, các ràng buộc cơ bản (basic constraints) và ràng buộc tên miền (name constraints); chỉ khi vượt qua tất cả mới chấp nhận danh tính của server.

![CA chứng minh chứng chỉ không bị chỉnh sửa thông qua chữ ký số](/media/jg/local/cs-basics/network/images/http-vs-https/digital-signature-789204.png)

Tóm lại, cơ chế truyền public key có kèm chứng chỉ diễn ra như sau:

1. Có server S, client C và cơ quan CA đáng tin cậy của bên thứ ba.
2. CA thẩm định thông tin đăng ký của S, tạo chữ ký số cho chứng chỉ chứa public key và thông tin danh tính của S.
3. S nhận chứng chỉ do CA cấp và gửi chứng chỉ đó cho C.
4. C nhận chuỗi chứng chỉ của S, dùng public key của các bên cấp phát qua từng cấp để xác thực chữ ký, và xác nhận chuỗi này cuối cùng neo vào một Root CA tin cậy cục bộ.
5. C tiếp tục kiểm tra tên miền, hạn sử dụng, mục đích và các ràng buộc chứng chỉ. Sau khi tất cả đều hợp lệ, C mới chấp nhận mối quan hệ gắn kết giữa public key trong chứng chỉ với danh tính dịch vụ mục tiêu.

![HTTPS truyền tải public key của server một cách đáng tin cậy thông qua chứng chỉ CA](/media/jg/local/cs-basics/network/images/http-vs-https/public-key-transmission-4d8189.png)

Về chữ ký số, tôi trình bày ở đây tương đối cô đọng, nếu bạn vẫn chưa thực sự hiểu rõ thì rất khuyến khích bạn xem video [Nguyên lý chữ ký số và chứng chỉ số](https://www.bilibili.com/video/BV18N411X7ty/), đây là bài giảng rõ ràng nhất mà tôi từng xem.

![Ảnh chụp bài giảng video về nguyên lý chữ ký số và chứng chỉ số](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20220321121814946-259f2934.png)

## Tổng kết

- **Cổng kết nối (Port)**: HTTP mặc định là 80, HTTPS mặc định là 443.
- **Tiền tố URL**: Tiền tố URL của HTTP là `http://`, tiền tố URL của HTTPS là `https://`.
- **Tính bảo mật và phương thức truyền tải**: HTTP không dùng TLS mặc định không cung cấp tính bảo mật, tính toàn vẹn và xác thực danh tính đối tác. HTTPS sử dụng TLS để bảo vệ HTTP; HTTP/1.1 và HTTP/2 thường dùng TLS qua TCP, còn HTTP/3 dùng QUIC tích hợp TLS 1.3. Bắt tay TLS chịu trách nhiệm xác thực đối tác và thiết lập khóa lưu lượng, dữ liệu tiếp theo được bảo vệ bằng thuật toán đối xứng AEAD. Chứng chỉ số chủ yếu dùng để xác thực danh tính, không thể nói một cách chung chung rằng "chứng chỉ dùng để mã hóa khóa đối xứng".
