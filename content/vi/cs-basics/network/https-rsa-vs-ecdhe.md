---
title: RSA và ECDHE trong quá trình bắt tay HTTPS khác biệt ở điểm nào? (Tầng ứng dụng)
description: So sánh sự khác biệt cốt lõi giữa cơ chế trao đổi khóa RSA và ECDHE trong quá trình bắt tay TLS, làm rõ tính bảo mật chuyển tiếp (forward secrecy), cách đặt tên cipher suite, các thay đổi trong TLS 1.3 và trọng tâm phỏng vấn.
category: Kiến thức máy tính cơ bản
tag:
  - Mạng máy tính
head:
  - - meta
    - name: keywords
      content: HTTPS,RSA,ECDHE,TLS,bắt tay,forward secrecy,trao đổi khóa,cipher suite,TLS 1.3,PreMasterSecret
lang: vi
sourceRef: zh-ref/cs-basics/network/https-rsa-vs-ecdhe.md
---

Nhiều người lần đầu tìm hiểu về HTTPS thường đọng lại một ấn tượng rất sơ sài trong đầu:

**HTTPS = HTTP + Mã hóa, Mã hóa = RSA. Do đó, HTTPS = Mã hóa RSA.**

Cách hiểu này không phải tự nhiên mà có. Trong giai đoạn đầu, nhiều hệ thống triển khai HTTPS quả thực đã sử dụng ồ ạt các cipher suite liên quan đến RSA, và vô số tài liệu nhập môn cũng thích mang RSA ra làm ví dụ minh họa.

Tuy nhiên, nói một cách chặt chẽ, HTTPS chưa bao giờ đồng nghĩa hoàn toàn với mã hóa RSA. Ngay cả trong thời kỳ TLS 1.0 hay TLS 1.1, RSA cũng chỉ là một trong các phương án tùy chọn, giao thức khi đó vẫn tồn tại các phương thức trao đổi khóa như DHE. Đến thời TLS 1.3, cơ chế trao đổi khóa RSA tĩnh (static RSA key exchange) đã bị loại bỏ hoàn toàn, RSA giờ đây chủ yếu xuất hiện ở khâu ký chứng chỉ và xác thực danh tính.

Do đó, điều mà bài viết này thực sự muốn mang ra so sánh không phải là "RSA và ECDHE ai cao cấp hơn".

**Trong quá trình bắt tay RSA, dữ liệu khóa phiên do client sinh ra rồi mã hóa gửi sang cho server; còn trong quá trình bắt tay ECDHE, dữ liệu khóa phiên không được truyền trực tiếp qua mạng, mà do client và server tự tính toán độc lập ở mỗi bên.**

Bài viết này chủ yếu giải đáp một số câu hỏi:

1. Tại sao HTTPS không đồng nghĩa với mã hóa RSA?
2. Dữ liệu khóa phiên trong quá trình bắt tay RSA và bắt tay ECDHE lần lượt được tạo ra như thế nào?
3. Tại sao ECDHE lại có thể mang lại tính bảo mật chuyển tiếp (forward secrecy)?
4. Tại sao TLS 1.3 lại loại bỏ cơ chế trao đổi khóa RSA tĩnh?

Sau khi làm sáng tỏ những câu hỏi này, các khái niệm như `PreMasterSecret`, `Server Key Exchange`, Forward Secrecy, và lý do TLS 1.3 khai tử static RSA đều sẽ trở nên vô cùng tự nhiên và dễ hiểu.

![Trao đổi khóa RSA và ECDHE: Sự khác biệt cốt lõi](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/https-rsa-ecdhe-rsa-and-ecdhe-key-exchange-core--43157217.png)

## Hai bài toán cốt lõi của quá trình bắt tay TLS

HTTPS vẫn sử dụng ngữ nghĩa của HTTP. Trong kịch bản TLS 1.2 mà bài viết này tập trung phân tích, các bản tin HTTP được truyền tải qua TLS trên nền TCP; còn HTTP/3 thì chạy trên giao thức QUIC tích hợp TLS 1.3 và không còn dùng TCP nữa.

Sau khi quá trình bắt tay hoàn tất, thứ thực sự bảo vệ dữ liệu nghiệp vụ thường là các thuật toán mã hóa đối xứng như AES-GCM, chứ không ai dùng RSA để mã hóa toàn bộ request và response cả.

Ở đây có hai bài toán cần giải quyết.

**Bài toán thứ nhất: Trình duyệt và máy chủ cần thương lượng ra một khóa phiên (session key).**

Trong quá trình truyền tải HTTP request, Cookie và response body sau đó, khóa phiên này sẽ được dùng để mã hóa đối xứng. Mã hóa đối xứng phù hợp hơn nhiều cho việc xử lý lượng dữ liệu lớn; mã hóa bất đối xứng có chi phí tính toán rất cao, nhìn chung không được dùng để mã hóa trực tiếp toàn bộ nội dung trang web.

**Bài toán thứ hai: Trình duyệt cần xác nhận phía đối diện có thực sự là trang web mục tiêu hay không.**

Nếu chỉ đơn thuần là "server gửi một public key cho trình duyệt", thì kẻ đứng giữa (Man-in-the-Middle) cũng hoàn toàn có thể gửi public key của hắn. Trình duyệt tưởng đó là public key của trang web đích, sau đó mã hóa thông tin bí mật gửi cho kẻ tấn công. Chứng chỉ số (Certificate), cơ quan CA và chữ ký số sinh ra là để giải quyết câu chuyện này: chứng minh rằng public key này thực sự gắn liền với tên miền đó, chứ không phải do ai đó chèn ngang trên đường truyền.

Cả bắt tay RSA lẫn bắt tay ECDHE đều phải đối mặt với hai bài toán này. Chỉ có điều cách thức chúng giải quyết câu hỏi "khóa phiên đến từ đâu" là khác nhau.

## Bắt tay RSA: Dữ liệu khóa được mã hóa rồi gửi đi

### Quy trình bắt tay hoàn chỉnh

Đầu tiên hãy xem xét cơ chế trao đổi khóa RSA trong TLS 1.2.

Trình duyệt gửi `ClientHello` trước. Bản tin này sẽ mang theo phiên bản TLS mà client hỗ trợ, danh sách cipher suite hỗ trợ và một số ngẫu nhiên `Client Random`.

Server nhận được sẽ phản hồi `ServerHello`, chọn một phiên bản TLS và cipher suite, đồng thời cũng cung cấp một số ngẫu nhiên `Server Random`, sau đó gửi chứng chỉ của mình cho client.

Đến đây, client đã nhận được chứng chỉ của server. Nó sẽ xác minh chuỗi chứng chỉ (certificate chain), tên miền, thời hạn hiệu lực và chữ ký. Sau khi xác minh chứng chỉ thành công, client trích xuất RSA public key của server ra từ chứng chỉ.

Tiếp theo là bước then chốt: client sinh ra một giá trị ngẫu nhiên mới, gọi là `PreMasterSecret`. Trong cơ chế trao đổi khóa RSA của TLS 1.2, giá trị này dài **48 byte**. Client sẽ dùng RSA public key lấy từ chứng chỉ của server để mã hóa `PreMasterSecret`, rồi đặt kết quả mã hóa vào bản tin `Client Key Exchange` gửi sang cho server.

Server nhận được bản tin sẽ dùng RSA private key của mình để giải mã, lấy ra cùng một bản `PreMasterSecret`.

Lúc này, cả client và server đều nắm trong tay ba mảnh ghép dữ liệu:

```text
Client Random
Server Random
PreMasterSecret
```

Hai bên dựa vào ba mảnh ghép này để phái sinh ra `Master Secret`, và các khóa phiên dùng sau này cũng sẽ tiếp tục được phái sinh từ đây. Khi thực sự truyền HTTP request và response, hệ thống sẽ sử dụng các khóa đối xứng được phái sinh này.

Gói gọn lại trong một câu:

**Dữ liệu khóa phiên trong quá trình bắt tay RSA là do client sinh ra, "đóng gói lại" rồi gửi cho server qua đường mạng.**

Hành động "đóng gói" ở đây dựa vào RSA public key của server. Chỉ có server nắm giữ RSA private key tương ứng mới có thể mở gói bọc này ra.

Nghe qua thì thấy rất hợp lý. Client sinh bí mật, server dùng private key giải mã, hai bên có được cùng một dữ liệu, rồi kết hợp với hai số ngẫu nhiên để phái sinh ra khóa phiên tiếp theo.

Nhưng vấn đề cũng nảy sinh chính từ đây.

### Không có Forward Secrecy: Private key dài hạn có giá trị quá lớn

Giả sử hôm nay có một kẻ tấn công bắt được một đoạn lưu lượng mạng HTTPS, nhưng tại thời điểm đó hắn không có private key của server nên không thể đọc hiểu nội dung bên trong. Lúc này hắn có thể cứ lưu toàn bộ lưu lượng đó lại trước.

Một năm sau, nếu RSA private key của server bị rò rỉ, điều gì sẽ xảy ra?

Trong cơ chế trao đổi khóa RSA, `PreMasterSecret` mà client gửi đi năm xưa được mã hóa bằng RSA public key của server. Nếu kẻ tấn công thu thập được trọn vẹn các số ngẫu nhiên dạng rõ trong giai đoạn bắt tay (`Client Random`, `Server Random`), đồng thời lưu giữ được bản mã của `PreMasterSecret`, thì kết hợp với private key của server bị rò rỉ sau này, hắn hoàn toàn có thể giải mã ra `PreMasterSecret` của thời điểm đó, và tiếp tục phái sinh ra đúng khóa phiên đã dùng cho kết nối năm xưa.

Dữ liệu cũ trong quá khứ có nguy cơ bị phơi bày toàn bộ.

Ở đây cần lưu ý điều kiện: không phải "cứ private key lộ là toàn bộ lưu lượng lịch sử chắc chắn giải mã được". Kẻ tấn công tối thiểu phải thu thập được dữ liệu bắt tay và dữ liệu ứng dụng đủ hoàn chỉnh. Nếu chỉ bắt được các mảnh vụn một chiều, hoặc nhật ký bắt tay bị khuyết, thì ngay cả khi có private key cũng chưa chắc đã khôi phục lại được phiên làm việc đó.

Tuy nhiên, xét từ góc độ thiết kế an toàn, rủi ro này đã là quá lớn. Một khi private key dài hạn biến thành "chìa khóa vạn năng" mở toang mọi lưu lượng trong lịch sử, tầm ảnh hưởng của nó không chỉ bao trùm các kết nối tương lai, mà còn làm tổn hại đến cả những phiên giao tiếp đã diễn ra trong quá khứ.

Điều bị chỉ trích ở đây không phải là thuật toán RSA "không dùng được". RSA vẫn hoàn toàn có thể dùng để ký xác thực danh tính, vẫn xuất hiện đàng hoàng trong hệ thống chứng chỉ. Vấn đề nằm ở chỗ "dùng một private key dài hạn cố định của server để giải mã dữ liệu khóa trong các phiên bắt tay lịch sử".

Một khi private key của server bị lộ, cái giá phải trả là quá đắt.

![Static RSA thiếu forward secrecy: bắt trọn vẹn gói tin + rò rỉ private key có thể giải mã ngược lưu lượng lịch sử](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/https-rsa-ecdhe-static-rsa-lacks-forward-secrecy-ed971562.png)

### Một gánh nặng lịch sử khác: Padding Oracle Attack

Cơ chế trao đổi khóa RSA còn vướng một phiền toái ở tầng triển khai kỹ thuật: `PreMasterSecret` không phải được mã hóa thô trực tiếp, mà được đóng gói theo định dạng như RSAES-PKCS1-v1_5 rồi mới mã hóa.

Chi tiết này trong lịch sử từng dẫn đến các cuộc tấn công tiên tri đệm (padding oracle attack) kiểu Bleichenbacher.

Ý tưởng khái quát là: kẻ tấn công không nhất thiết phải lập tức có được private key của server, mà liên tục tạo ra các bản mã khác nhau gửi tới server, rồi quan sát sự khác biệt trong cách server xử lý các lỗi như "lỗi đệm (padding error), lỗi phiên bản, lỗi độ dài". Nếu server bộc lộ sự khác biệt qua mã lỗi, thời gian phản hồi, hành vi ghi log, hay cách đóng kết nối, kẻ tấn công có thể từng bước suy đoán và tiến gần đến bản rõ.

Điểm phiền toái của kiểu tấn công này là nó không đơn thuần là bài toán toán học thuần túy, mà là vấn đề triển khai thực tế (implementation flaw).

TLS 1.2 từng đưa ra yêu cầu phòng thủ cho tình huống này: server ngay cả khi giải mã thất bại cũng tuyệt đối không được để lộ nguyên nhân thất bại cụ thể ra ngoài, mà phải tiếp tục dùng một giá trị ngẫu nhiên để đi hết toàn bộ quy trình, tránh việc kẻ tấn công dựa vào hành vi khác biệt để phán đoán xem bản mã có gần đúng định dạng hay không.

Thế nhưng yêu cầu quy chuẩn không đồng nghĩa với việc các bản cài đặt đều đáng tin cậy. Cuộc tấn công ROBOT năm 2017 một lần nữa chứng minh rằng một số server vẫn có thể làm lộ RSA decryption oracle chỉ vì những khác biệt hành vi hết sức nhỏ nhặt. Mã lỗi, thời gian xử lý, log, nhánh rẽ code... chỉ cần một chỗ có biểu hiện không đồng nhất đều có thể biến thành kênh phụ (side channel).

Vì thế, việc cơ chế trao đổi khóa RSA tĩnh bị đào thải không chỉ vì nó thiếu tính bảo mật chuyển tiếp, mà còn vì nó dồn quá nhiều rủi ro lên vai các chi tiết triển khai code.

### Liệu có bị hạ cấp (downgrade) ngược về RSA không?

Ở đây cần bổ sung thêm một điểm rất dễ gây hiểu lầm.

Trong TLS 1.2, client sẽ gửi danh sách cipher suite mà mình hỗ trợ trong `ClientHello`, server sẽ chọn một bộ mà cả hai bên cùng hỗ trợ. Về mặt lý thuyết, nếu server vẫn mở các cipher suite trao đổi khóa RSA tĩnh như `TLS_RSA_*`, các client đời cũ có thể vẫn tiếp tục bắt tay bằng RSA.

Nhưng điều này không có nghĩa là "kẻ đứng giữa chỉ cần tiện tay xóa ECDHE trong ClientHello là có thể âm thầm hạ cấp kết nối xuống RSA". Bản tin `Finished` ở cuối quá trình bắt tay sẽ kiểm tra tính toàn vẹn của toàn bộ nhật ký bắt tay (handshake transcript); việc sửa đổi tùy tiện `ClientHello` thường sẽ khiến bước xác minh này thất bại và kết nối không thể thiết lập.

Trong lịch sử quả thực từng xảy ra các cuộc tấn công hạ cấp, ví dụ như FREAK và Logjam. Chúng lợi dụng việc một số client và server thời bấy giờ vẫn hỗ trợ các bộ cipher suite yếu cấp độ xuất khẩu (export-grade), kết hợp với lỗi triển khai và cấu hình sai sót để ép kết nối rơi vào nhánh RSA_EXPORT hoặc DHE_EXPORT yếu hơn, chứ không phải là "cứ xóa bừa ECDHE là hạ cấp trót lọt". TLS 1.3 bổ sung thêm giá trị bảo vệ hạ cấp trong `ServerHello.random` cũng là lời nhắc nhở rằng giao thức luôn không ngừng vá lại các bề mặt tấn công lịch sử này.

Điều thực sự cần quan tâm nằm ở chính cấu hình của máy chủ: nếu không còn cần phải tương thích với các client quá cổ, bạn nên tắt hẳn các cipher suite trao đổi khóa RSA tĩnh, chỉ giữ lại các bộ hỗ trợ forward secrecy. Nếu không, trong hệ thống vẫn có thể có client hoặc cấu hình lỗi vô tình rơi vào nhánh bắt tay RSA.

Đó cũng là lý do khi kiểm tra cấu hình TLS cần phải xem kết quả đàm phán cipher suite trên thực tế. Chỉ nhìn thấy "server hỗ trợ ECDHE" là chưa đủ, còn phải xem nó có đang đồng thời bật các bộ cũ dạng `TLS_RSA_*` hay không.

## Bắt tay ECDHE: Dữ liệu khóa do hai bên cùng đàm phán

### Tư tưởng cốt lõi của DH

Chữ `DHE` trong ECDHE bắt nguồn từ Diffie-Hellman Ephemeral, nghĩa là Diffie-Hellman tạm thời. Chữ `EC` đứng đầu là Elliptic Curve, biểu thị dựa trên đường cong elliptic.

Đừng để cái tên làm bạn hoang mang. Tạm thời chưa cần quan tâm đến đường cong elliptic, hãy xem thuật toán DH muốn giải quyết vấn đề gì trước.

Mục tiêu của DH vô cùng thú vị: hai bên giao tiếp không cần truyền trực tiếp bí mật dùng chung qua mạng, nhưng mỗi bên đều có thể tự tính toán ra cùng một bí mật dùng chung đó.

Có thể hiểu một cách khái quát như sau:

Client sinh một private key tạm thời, chỉ giữ lại ở máy mình, rồi tính ra một public key tạm thời gửi cho server. Server cũng sinh một private key tạm thời, chỉ giữ lại ở máy mình, rồi tính ra một public key tạm thời gửi cho client.

Thứ hai bên trao đổi qua mạng chỉ là public key. Kẻ tấn công trên đường truyền có thể thấy những public key này, nhưng không thể thấy private key tạm thời của mỗi bên.

Sau đó, client lấy "private key tạm thời của mình + public key tạm thời của server" để tính ra shared secret; server lấy "private key tạm thời của mình + public key tạm thời của client" cũng tính ra đúng shared secret đó.

Bí mật dùng chung chưa từng một lần xuất hiện trên đường truyền mạng!

ECDHE chỉ đơn giản là mang quy trình này đặt vào hệ thống toán học của đường cong elliptic. Lý thuyết toán học đường cong elliptic trừu tượng hơn, nhưng ở cùng một cấp độ bảo mật, nó thường dùng độ dài khóa ngắn hơn nhiều mà vẫn đạt được độ an toàn tương đương, chi phí tính toán và truyền tải cũng thấp hơn so với DHE trên trường hữu hạn truyền thống. Để hiểu quá trình bắt tay TLS, chỉ cần nhớ kỹ một câu là đủ:

**Dữ liệu khóa phiên trong ECDHE không phải do một bên tạo ra rồi gửi cho bên kia, mà là do hai bên cùng đàm phán và tính toán thông qua các khóa tạm thời.**

### Quy trình bắt tay hoàn chỉnh

Hãy xem quy trình bắt tay `ECDHE_RSA` phổ biến trong TLS 1.2.

Client vẫn gửi `ClientHello` trước, bên trong có phiên bản TLS, danh sách cipher suite hỗ trợ, `Client Random`. Server đáp lại bằng `ServerHello`, chọn một cipher suite, ví dụ:

```text
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
```

Tên cipher suite này cần phải tách nhỏ ra để đọc, đừng thấy có chữ RSA mà vội tưởng nó vẫn đang dùng RSA để mã hóa khóa phiên.

- `ECDHE` chỉ phương thức trao đổi khóa.
- `RSA` chỉ phương thức xác thực và ký số.
- `AES_256_GCM` chỉ việc dữ liệu tầng record layer sau này sẽ dùng AES với độ dài khóa 256 bit, hoạt động ở chế độ GCM.
- `SHA384` chỉ định thuật toán băm dùng cho PRF và bản tin `Finished` của TLS 1.2.

Bản thân GCM đã cung cấp khả năng bảo vệ tính toàn vẹn ở tầng record layer, nên `SHA384` ở đây không còn đóng vai trò là MAC của record layer nữa, mà chủ yếu tham gia vào khâu phái sinh khóa và xác minh transcript trong giai đoạn bắt tay.

Server tiếp tục gửi chứng chỉ. Với `ECDHE_RSA`, RSA public key trong chứng chỉ chủ yếu dùng để xác thực chữ ký của server, chứ không phải để client lấy ra mã hóa `PreMasterSecret`.

Sau đó, bắt tay ECDHE và RSA bắt đầu rẽ nhánh khác biệt.

Trong bắt tay ECDHE, server sẽ gửi bản tin `Server Key Exchange`. Bản tin này chứa các tham số đường cong elliptic do server chọn, cùng với ECDHE public key tạm thời của server.

**Vấn đề đặt ra: Làm sao client biết được ECDHE public key tạm thời này không bị kẻ đứng giữa đánh tráo?**

**Câu trả lời là: Chữ ký số.**

Server sẽ dùng private key tương ứng với chứng chỉ của mình để ký lên các tham số bắt tay. Client nhận được sẽ dùng public key trong chứng chỉ để xác thực chữ ký. Nếu xác thực thành công, client có thể khẳng định: ECDHE public key tạm thời này thực sự xuất phát từ server sở hữu private key của chứng chỉ, chứ không phải bị ai đó đánh tráo dọc đường.

Tiếp theo, client cũng tự sinh ra private key và public key ECDHE tạm thời của mình, rồi gửi public key tạm thời của client sang cho server thông qua bản tin `Client Key Exchange`.

Đến bước này, cả hai bên đã có đủ nguyên liệu cần thiết để tính toán bí mật dùng chung.

Client nắm trong tay:

```text
Private key tạm thời của client
Public key tạm thời của server
Client Random
Server Random
```

Server nắm trong tay:

```text
Private key tạm thời của server
Public key tạm thời của client
Client Random
Server Random
```

Hai bên độc lập tính ra cùng một shared secret, rồi phái sinh ra khóa phiên dùng cho các giao tiếp sau đó.

Ở đây xin nhấn mạnh lại một lần nữa:

**Chữ RSA trong ECDHE_RSA không dùng để mã hóa truyền tải khóa phiên. Nó chịu trách nhiệm chứng minh "các tham số tạm thời ECDHE này thực sự do server gửi".**

Đây chính là điểm mà rất nhiều người khi nhìn vào tên cipher suite dễ bị hiểu lầm nhất.

![TLS 1.2 sử dụng ECDHE RSA hoàn tất bắt tay và đàm phán khóa](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/https-rsa-ecdhe-tls-1-2-ecdhe-rsa-handshake-proc-fa4d9609.png)

### Cách đọc tên Cipher Suite

Tên của một cipher suite trong TLS 1.2 thông thường có thể tách theo cấu trúc sau:

```text
TLS_ThuatToanTraoDoiKhoa_ThuatToanXacThuc_WITH_ThuatToanMaHoaDoiXung_ThuatToanHash
```

Ví dụ:

```text
TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
```

Có thể phân tích thành:

```text
ECDHE: Trao đổi khóa
RSA: Xác thực danh tính, tức chữ ký của server
AES_128_GCM: Thuật toán mã hóa tầng record layer tiếp theo
SHA256: Thuật toán băm dùng cho TLS 1.2 PRF và message Finished; với cipher suite GCM, nó không còn đóng vai trò là MAC tầng record layer
```

Xem tiếp một ví dụ khác:

```text
TLS_RSA_WITH_AES_128_GCM_SHA256
```

Ở đây chữ `RSA` xuất hiện trước chữ `WITH` và hoàn toàn không có `ECDHE`, biểu thị cả trao đổi khóa lẫn xác thực danh tính đều gắn chặt với RSA. Đây chính là cipher suite trao đổi khóa RSA tĩnh kinh điển.

Sang đến TLS 1.3, cách đặt tên cipher suite đã thay đổi, ví dụ:

```text
TLS_AES_128_GCM_SHA256
```

Bạn sẽ nhận thấy nó không còn nhét phương thức trao đổi khóa và xác thực vào tên cipher suite nữa. TLS 1.3 đã tách các thông tin này sang các extension và message bắt tay khác; tên cipher suite giờ đây chủ yếu mô tả thuật toán AEAD ở tầng record layer và thuật toán băm dùng cho HKDF.

Vì vậy, khi nhìn thấy `TLS_AES_128_GCM_SHA256` của TLS 1.3, đừng hiểu lầm là nó "không có trao đổi khóa". Việc trao đổi khóa vẫn diễn ra, chỉ là không còn được viết theo kiểu đặt tên của TLS 1.2 mà thôi.

![Phân tích cấu trúc tên Cipher Suite](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/https-rsa-ecdhe-cipher-suite-name-decomposition-8fd6309c.png)

## Tính bảo mật chuyển tiếp và chi phí hiệu năng

### Tại sao ECDHE lại có tính bảo mật chuyển tiếp (Forward Secrecy)

Điểm mấu chốt nằm ở chữ `E`, tức là `Ephemeral` — tạm thời.

Private key trong quá trình bắt tay ECDHE không phải là chiếc private key dài hạn gắn liền với chứng chỉ của server, mà là private key tạm thời được sinh ra riêng cho phiên bắt tay đó. Sau khi kết nối kết thúc, theo quy chuẩn bình thường dữ liệu tạm thời này sẽ bị hủy bỏ và không bao giờ được dùng lại.

Hệ quả là: kẻ tấn công dù hôm nay có bắt trọn gói tin, và trong tương lai xa xôi nào đó có lấy được private key chứng chỉ của server, thì cũng không thể chỉ dựa vào chiếc private key dài hạn này để khôi phục lại các shared secret tạm thời trong từng phiên bắt tay quá khứ. Bởi vì thứ thực sự tham gia vào việc đàm phán khóa khi ấy là private key ECDHE tạm thời của phiên đó, chứ không phải private key chứng chỉ.

Private key chứng chỉ ở đây giống như một "chiếc bút ký tên", chứ không phải "chìa khóa két sắt".

Trong trao đổi khóa RSA, private key của server có thể trực tiếp mở tung `PreMasterSecret` do client gửi sang; còn trong ECDHE, private key của server chỉ dùng để ký lên các tham số tạm thời nhằm chứng minh danh tính. Nó không trực tiếp tham gia vào việc tính toán shared secret của từng kết nối.

Sự chuyển dịch vai trò này quyết định sự khác biệt một trời một vực giữa hai cơ chế trong việc bảo vệ lưu lượng dữ liệu lịch sử.

![Nguyên lý Forward Secrecy của ECDHE: Khóa dài hạn vs Khóa tạm thời](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/https-rsa-ecdhe-ecdhe-forward-secrecy-principle--8c09c992.png)

Tuy nhiên, tính bảo mật chuyển tiếp không phải là bùa hộ mệnh vạn năng.

Nếu bộ sinh số ngẫu nhiên của server quá kém, nếu private key tạm thời vô tình bị ghi vào file log, hoặc trong code implement xuất hiện lỗi rò rỉ bộ nhớ (memory leak), thì ECDHE cũng không cứu vớt nổi bạn. Ở góc độ triển khai kỹ thuật, để giảm tải chi phí bắt tay, một số bản cài đặt có thể tái sử dụng dữ liệu bí mật DH/ECDH tạm thời trong một khoảng thời gian ngắn: trong kịch bản DH trường hữu hạn người ta hay gọi là "tái sử dụng số mũ" (exponent reuse), còn trong ECDH thường gọi là "tái sử dụng scalar/private key tạm thời". Nếu thời gian tái sử dụng quá dài, độ mịn của tính bảo mật chuyển tiếp sẽ bị suy giảm đáng kể.

Một rủi ro khác đến từ việc kiểm tra tham số. Chẳng hạn nếu server không kiểm tra chuẩn xác xem điểm trên đường cong elliptic mà client gửi tới có thực sự nằm trên đường cong hợp lệ hay không, điều đó có thể tạo cơ hội cho các cuộc tấn công đường cong không hợp lệ (invalid curve attack). Lập trình viên thông thường có thể không trực tiếp viết code tầng này, nhưng nó nhắc nhở chúng ta: an toàn mật mã học không chỉ dừng lại ở việc "chọn đúng thuật toán", mà chất lượng triển khai thư viện TLS và cấu hình cũng quan trọng không kém.

### Tác động của cơ chế khôi phục phiên (Session Resumption)

Còn một điểm rất dễ bị lãng quên: **Khôi phục phiên làm việc (Session Resumption).**

Một quá trình bắt tay ECDHE hoàn chỉnh đòi hỏi phải đàm phán khóa tạm thời, chi phí tài nguyên không hề nhỏ. Để giảm bớt chi phí này, TLS hỗ trợ cơ chế khôi phục phiên. Lần sau khi client truy cập lại cùng một trang web, nó có thể thử tái sử dụng trạng thái phiên đã đàm phán trước đó, tránh việc mỗi lần đều phải đi trọn vẹn một vòng bắt tay đầy đủ.

Vấn đề nằm ở chỗ, cơ chế khôi phục phiên cũng có ranh giới bảo mật riêng của nó.

Lấy ví dụ về Session Ticket trong TLS 1.2: server sẽ dùng một Session Ticket Encryption Key (STEK) để mã hóa bảo vệ trạng thái phiên; client sau đó quay lại mang theo ticket này, server giải mã ticket để phục hồi phiên. Nếu chiếc khóa mã hóa ticket này dùng mãi không chịu xoay vòng (rotate), một khi nó bị rò rỉ, kẻ tấn công có thể giải mã toàn bộ các ticket đã thu thập trong quá khứ, và từ đó lần ra dữ liệu khóa của các phiên được khôi phục.

Lúc này, cửa sổ an toàn của tính bảo mật chuyển tiếp không còn gói gọn trong "từng kết nối đơn lẻ" nữa, mà bị kéo dài ra bằng đúng "vòng đời của khóa mã hóa ticket".

Vì thế khi cấu hình trên production không thể chỉ nhìn chăm chăm vào việc "đã bật ECDHE hay chưa". Cách sinh khóa mã hóa ticket ra sao, xoay vòng như thế nào, có chia sẻ giữa nhiều máy chủ hay không, mức độ ảnh hưởng khi bị lộ thế nào... đều phải được tính toán thấu đáo.

### Hiệu năng không hề miễn phí

ECDHE mang lại tính bảo mật chuyển tiếp, nhưng nó cũng đi kèm chi phí đánh đổi.

Nhánh chính của trao đổi khóa RSA là server dùng RSA private key dài hạn giải mã `PreMasterSecret` do client gửi tới. Còn ECDHE_RSA thì vừa phải hoàn thành đàm phán ECDH tạm thời, lại vừa phải thực hiện thao tác ký số lên các tham số tạm thời của server.

Đối với các dịch vụ có độ chịu tải cao (high concurrency), quá trình bắt tay TLS sẽ tiêu tốn CPU đáng kể, nhất là khi hệ thống có nhiều kết nối ngắn (short-lived connections) và tỷ lệ trúng cache khôi phục phiên thấp.

Ở đây không thể viết một cách hồ đồ rằng "ECDHE chắc chắn chậm hơn RSA". Chi phí thực tế phụ thuộc vào độ dài khóa RSA, loại đường cong elliptic được chọn, thuật toán ký số, cách implement thư viện TLS, tập lệnh CPU, tỷ lệ hit của session resumption... Ví dụ như X25519, P-256, RSA 2048, RSA 3072 trên các dòng CPU và thư viện TLS khác nhau sẽ cho ra kết quả hiệu năng rất khác nhau.

Nếu thực sự muốn đánh giá chi phí, cách đáng tin cậy nhất không phải là đi trích dẫn những con số cố định của người khác, mà là chạy stress-test trên chính phần cứng mục tiêu của bạn. Tối thiểu cần tách bạch ba cấp độ đo lường:

```text
1. Thời gian thực thi một thao tác mật mã đơn lẻ
2. Thời gian bắt tay TLS hoàn chỉnh
3. Thời gian trễ end-to-end của request nghiệp vụ
```

Mục thứ nhất có thể dùng lệnh `openssl speed` để nhìn sơ bộ cấp độ độ lớn (order of magnitude), ví dụ đo năng lực tính toán của RSA, ECDH, X25519; mục thứ hai phụ thuộc vào thư viện TLS và cấu hình server; mục thứ ba còn chịu ảnh hưởng bởi độ trễ mạng (RTT), tái sử dụng kết nối và logic ứng dụng.

Vì vậy trên môi trường thực tế người ta không bao giờ chỉ trông chờ mỗi việc "đổi sang ECDHE" để giải quyết mọi bài toán. Cách làm phổ biến là kết hợp đồng bộ với TLS 1.3, khôi phục phiên, lựa chọn thuật toán chứng chỉ và đường cong hợp lý, khi cần thiết thì dùng thêm phần cứng tăng tốc mã hóa (hardware acceleration).

Bảo mật và hiệu năng không phải là bài toán loại trừ nhau một mất một còn, nhưng cũng không thể nhắm mắt làm ngơ xem như không có bất kỳ chi phí đánh đổi nào.

## Những thay đổi trong TLS 1.3

Nếu chỉ nhìn riêng TLS 1.2, RSA và ECDHE có thể xem là hai phương thức trao đổi khóa độc lập để mang ra so sánh.

Nhưng bước sang TLS 1.3, cơ chế trao đổi khóa RSA tĩnh đã bị khai tử hoàn toàn, và cấu trúc bắt tay cũng được tái thiết kế.

Một quá trình bắt tay TLS 1.2 đầy đủ thường mất 2 RTT. Client gửi `ClientHello` trước, server gửi lại `ServerHello`, chứng chỉ và các message bắt tay liên quan, client gửi tiếp khóa trao đổi và bản tin `Finished`, cuối cùng server đáp lại bằng `Finished`.

TLS 1.3 thì đưa luôn các tham số trao đổi khóa vào extension `key_share` ngay trong bản tin `ClientHello` đầu tiên. Server ngay trong lượt phản hồi đầu đã có thể trả về `key_share` của mình, giúp quá trình bắt tay hoàn chỉnh thông thường được rút gọn xuống chỉ còn 1 RTT.

Việc từ 2 RTT giảm xuống 1 RTT tiết kiệm được bao nhiêu mili-giây hoàn toàn phụ thuộc vào môi trường mạng. Cùng một data center có thể chỉ chênh lệch vài mili-giây; nhưng ở kịch bản xuyên vùng địa lý, mạng di động, mạng có tỷ lệ rớt gói cao, việc bớt đi một RTT sẽ giúp người dùng cảm nhận được tốc độ tăng lên rất rõ rệt.

Dẫu vậy, TLS 1.3 không phải lúc nào cũng chắc chắn đạt 1 RTT trong mọi tình huống. Nếu `key_share` mà client gửi tới không trùng với các đường cong mà server hỗ trợ, server sẽ phản hồi bản tin `HelloRetryRequest`, yêu cầu client đổi sang bộ tham số tương thích để gửi lại từ đầu. Lúc này thời gian bắt tay có thể lại quay về mức xấp xỉ 2 RTT.

Vì vậy trong môi trường production, danh sách các nhóm đàm phán khóa phổ biến giữa client và server cần được cấu hình đồng bộ tối đa (chẳng hạn như các lựa chọn thông dụng `X25519`, `secp256r1`). Nếu không, lợi thế 1 RTT của TLS 1.3 có thể sẽ bị giảm sút.

![So sánh số lượt RTT bắt tay giữa TLS 1.2 và TLS 1.3](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/https-rsa-ecdhe-tls-1-2-vs-tls-1-3-handshake-rtt-70134329.png)

Còn các chủ đề như trao đổi khóa lai hậu lượng tử (post-quantum hybrid), 0-RTT, PSK-only hay mTLS đều thuộc về những nhánh thảo luận khác, bài viết này xin phép không đi sâu.

## Bảng tra cứu nhanh khác biệt cốt lõi giữa RSA và ECDHE

Đặt hai bên cạnh nhau, sự khác biệt sẽ hiện lên rất rõ ràng:

| Hạng mục so sánh | Trao đổi khóa RSA | Trao đổi khóa ECDHE |
| --- | --- | --- |
| Bối cảnh phiên bản thường gặp | Thấy trong TLS 1.2 và các bản cũ hơn | Phổ biến trong TLS 1.2; tiếp tục là hướng đàm phán khóa tạm thời chủ đạo trong TLS 1.3 |
| Dữ liệu khóa phiên tạo ra thế nào | Client sinh ra `PreMasterSecret`, mã hóa bằng RSA public key của server rồi gửi đi | Hai bên tự sinh cặp khóa tạm thời, đàm phán tính ra shared secret thông qua ECDHE |
| Vai trò của Private Key server | Giải mã `PreMasterSecret` do client gửi tới | Ký lên tham số ECDHE tạm thời để chứng minh tham số xuất phát từ server thật |
| Dữ liệu truyền tải trên mạng | Bản mã của `PreMasterSecret` | Public key tạm thời của hai bên và các tham số đã được ký số |
| Hỗ trợ Forward Secrecy không | Không hỗ trợ | Có hỗ trợ, với điều kiện khóa tạm thời sinh đúng cách và không lưu giữ sau khi dùng |
| Hậu quả khi lộ Private Key | Nếu dữ liệu bắt tay bị bắt trọn vẹn, lưu lượng lịch sử có nguy cơ bị giải mã | Chỉ riêng việc lộ private key chứng chỉ nhìn chung không thể giải mã lưu lượng lịch sử |
| Vấn đề / Nguy cơ điển hình | Giá trị private key dài hạn quá lớn; gánh nặng lịch sử tấn công tiên tri đệm PKCS#1 v1.5 | Tốn thêm chi phí tính toán khi bắt tay; việc kiểm tra tham số và quản lý khóa tạm thời phụ thuộc chất lượng triển khai |
| Tình trạng trong TLS 1.3 | Trao đổi khóa RSA tĩnh đã bị loại bỏ | Đàm phán khóa tạm thời trở thành chuẩn mực bắt buộc |

![Bảng tra cứu nhanh RSA vs ECDHE](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/https-rsa-ecdhe-rsa-vs-ecdhe-quick-reference-aacf1d2a.png)

### Hiểu lầm phổ biến: ECDHE_RSA không phải là cả hai thuật toán đều cùng mã hóa dữ liệu

Cái tên `ECDHE_RSA` rất dễ khiến người ta hiểu lầm rằng cả hai thuật toán đều đang cùng tham gia mã hóa dữ liệu. Lấy cipher suite này làm ví dụ:

```text
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
```

Sự phân công nhiệm vụ ở đây là: ECDHE phụ trách trao đổi khóa, RSA phụ trách ký số xác thực danh tính, AES-256-GCM phụ trách bảo vệ dữ liệu tầng record layer, và SHA384 dùng cho PRF và xác minh `Finished` của TLS 1.2. Ký chứng chỉ bằng RSA và trao đổi khóa bằng RSA là hai câu chuyện hoàn toàn khác biệt; việc ký chứng chỉ bằng RSA vẫn rất phổ biến trong HTTPS hiện đại, còn trao đổi khóa bằng RSA thì đã bị xóa sổ khỏi TLS 1.3.

## Trả lời phỏng vấn thế nào: RSA và ECDHE trong bắt tay HTTPS khác biệt ở điểm nào?

Điểm khác biệt cốt lõi giữa RSA và ECDHE nằm ở chỗ dữ liệu khóa phiên là "được gửi qua mạng" hay "được hai bên tự đàm phán tính toán ra".

Trong quá trình bắt tay RSA tĩnh của TLS 1.2, client sinh ra `PreMasterSecret`, dùng RSA public key trong chứng chỉ server để mã hóa rồi gửi sang, server dùng RSA private key để giải mã. Vấn đề là nếu kẻ tấn công lưu lại toàn bộ lưu lượng bắt tay năm xưa, sau này private key của server bị rò rỉ thì hắn có thể quay lại giải mã ra khóa phiên trong quá khứ, do đó nó không có tính bảo mật chuyển tiếp (forward secrecy).

ECDHE không truyền trực tiếp shared secret qua mạng. Client và server mỗi bên tự sinh một cặp khóa tạm thời, trao đổi public key tạm thời cho nhau, rồi mỗi bên tự tính toán cục bộ ra cùng một shared secret. Private key chứng chỉ của server chỉ dùng để ký số xác thực, chứng minh các tham số tạm thời không bị kẻ đứng giữa đánh tráo, chứ không dùng để giải mã khóa phiên.

Khi phỏng vấn bạn có thể đúc kết lại như sau: Bắt tay RSA tĩnh trong TLS 1.2 do client sinh `PreMasterSecret` rồi dùng RSA public key của server mã hóa gửi đi; nếu kẻ tấn công bắt trọn vẹn lưu lượng bắt tay và sau này có được private key của server thì các phiên lịch sử có thể bị giải mã, vì vậy nó không có tính bảo mật chuyển tiếp. ECDHE không truyền trực tiếp bí mật dùng chung, hai bên trao đổi public key tạm thời rồi tự tính ra bí mật ở máy mình; private key chứng chỉ chủ yếu dùng để ký số xác thực chứ không trực tiếp giải mã khóa phiên. TLS 1.3 đã loại bỏ hoàn toàn cơ chế trao đổi khóa RSA tĩnh và sử dụng (EC)DHE, PSK hoặc kết hợp cả hai để thiết lập khóa.
