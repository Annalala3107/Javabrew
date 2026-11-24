---
title: Tổng hợp các Thuật toán Mã hóa Phổ biến
description: "Giải thích chi tiết các thuật toán mã hóa phổ biến, bao gồm nguyên lý và kịch bản ứng dụng của các thuật toán mã hóa đối xứng và bất đối xứng như AES, RSA cùng các thuật toán băm như MD5, SHA."
category: Thiết kế hệ thống
tag:
  - Bảo mật
  - Thuật toán băm
head:
  - - meta
    - name: keywords
      content: Thuật toán mã hóa,AES,RSA,Thuật toán băm,Thuật toán tóm tắt,HTTPS,Mã hóa đối xứng,Mã hóa bất đối xứng,BCrypt
lang: vi
sourceRef: zh-ref/system-design/security/encryption-algorithms.md
---

Thuật toán mã hóa (Cryptographic Algorithm) là kỹ thuật sử dụng phương pháp toán học để biến đổi dữ liệu, nhằm bảo vệ an toàn dữ liệu và ngăn chặn việc đọc hoặc chỉnh sửa trái phép. Có thể chia thành ba nhóm lớn: thuật toán mã hóa đối xứng (Symmetric Encryption), thuật toán mã hóa bất đối xứng (Asymmetric Encryption) và thuật toán băm (Hash Algorithm — còn gọi là thuật toán tóm tắt / Digest Algorithm).

Các kịch bản thường gặp trong phát triển hằng ngày cần dùng đến thuật toán mã hóa:

1. Mật khẩu lưu trong cơ sở dữ liệu cần được thêm salt (muối) rồi băm bằng thuật toán băm mật khẩu (như BCrypt).
2. Dữ liệu nhạy cảm lưu trong cơ sở dữ liệu như số thẻ ngân hàng, số căn cước/CMND cần được mã hóa bằng thuật toán mã hóa đối xứng (như AES) trước khi lưu.
3. Dữ liệu nhạy cảm truyền qua mạng như số thẻ ngân hàng, số căn cước/CMND cần dùng HTTPS kết hợp mã hóa bất đối xứng (như RSA) để đảm bảo an toàn khi truyền tải.
4. ……

*Lưu ý:* Nói một cách chặt chẽ thì thuật toán băm thực chất không thuộc nhóm thuật toán mã hóa, chỉ là được sử dụng trong một số kịch bản bảo mật nhất định (chẳng hạn băm mật khẩu); cả hai có thể xem là hai nhóm song song nhau. Thuật toán mã hóa thường chỉ các thuật toán có thể chuyển bản rõ (plaintext) thành bản mã (ciphertext), đồng thời có thể khôi phục ngược lại từ bản mã về bản rõ bằng một cách nào đó (như khóa bí mật). Trong khi đó, thuật toán băm là một quá trình một chiều: nó chuyển thông tin đầu vào thành một giá trị băm có độ dài cố định trông có vẻ ngẫu nhiên, nhưng quá trình này không thể đảo ngược — tức là không thể khôi phục thông tin gốc từ giá trị băm.

## Thuật toán băm (Hash Algorithm)

Thuật toán băm (còn gọi là hàm băm — Hash Function hoặc thuật toán tóm tắt — Digest Algorithm) có tác dụng tạo ra một định danh duy nhất có độ dài cố định cho dữ liệu đầu vào có độ dài bất kỳ; giá trị tạo ra gọi là giá trị băm (hash value), hoặc bản tóm tắt thông điệp (message digest) (sau đây gọi thống nhất là giá trị băm).

![Minh họa hiệu quả của thuật toán băm](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/hash-function-effect-demonstration-1a79d632.png)

Thuật toán băm có tính chất **không thể đảo ngược (một chiều)**: bạn không thể từ giá trị sau khi băm mà suy ngược lại ra giá trị ban đầu.

Tác dụng của giá trị băm là dùng để kiểm chứng tính toàn vẹn (integrity) và tính nhất quán (consistency) của dữ liệu.

Lấy hai ví dụ thực tế:

- Khi lưu mật khẩu vào cơ sở dữ liệu bằng thuật toán băm, có thể xác định mật khẩu đúng hay không bằng cách so sánh giá trị băm của mật khẩu người dùng nhập vào với giá trị băm đang lưu trong cơ sở dữ liệu.
- Khi tải một tệp tin về, ta có thể kiểm tra xem tệp có bị chỉnh sửa hoặc hư hỏng hay không bằng cách đối chiếu giá trị băm của tệp với giá trị băm chính thức do nhà phát hành cung cấp.

Đặc điểm của loại thuật toán này là tính không thể đảo ngược:

- Không thể khôi phục dữ liệu gốc từ giá trị băm.
- Bất kỳ thay đổi nào dù nhỏ nhất ở dữ liệu gốc cũng dẫn đến sự thay đổi hoàn toàn khác biệt ở giá trị băm.

Có thể chia đơn giản thuật toán băm thành hai loại:

1. **Thuật toán băm mật mã (Cryptographic Hash):** Là các thuật toán băm có độ an toàn cao, cung cấp khả năng bảo vệ tính toàn vẹn dữ liệu và chống giả mạo nhất định, chống chịu được các kỹ thuật tấn công; độ an toàn tương đối cao nhưng hiệu năng thấp hơn, phù hợp với các kịch bản yêu cầu bảo mật cao. Ví dụ: SHA-2, SHA-3, SM3, RIPEMD-160, BLAKE2, v.v.
2. **Thuật toán băm phi mật mã (Non-Cryptographic Hash):** Là các thuật toán băm có độ an toàn thấp hơn, dễ bị tấn công vét cạn (brute-force) hoặc tấn công đụng độ (collision attack), nhưng hiệu năng rất cao, phù hợp với các kịch bản nghiệp vụ không yêu cầu bảo mật. Ví dụ: CRC32, MurMurHash3, v.v.

Ngoài hai loại này, còn có một số thuật toán băm đặc biệt khác, chẳng hạn các **thuật toán băm chậm (Slow Hash)** có độ an toàn cao hơn dành cho mật khẩu.

Các thuật toán băm phổ biến gồm:

- **MD (Message Digest):** MD2, MD4, MD5, v.v., hiện nay đều không còn được khuyến nghị sử dụng.
- **SHA (Secure Hash Algorithm):** Dòng SHA-1 có độ an toàn thấp; dòng SHA-2 và SHA-3 có độ an toàn cao.
- **Thuật toán mật mã quốc gia Trung Quốc (Quốc mật):** Ví dụ SM2, SM3, SM4 — trong đó SM2 là thuật toán mã hóa bất đối xứng, SM4 là thuật toán mã hóa đối xứng, còn SM3 là thuật toán băm (độ an toàn và hiệu suất tương đương SHA-256, phù hợp hơn với môi trường tuân thủ nội địa tại Trung Quốc).
- **Bcrypt (Thuật toán băm mật khẩu):** Thuật toán băm mật khẩu dựa trên thuật toán mã hóa Blowfish, được thiết kế chuyên biệt cho mật khẩu, độ an toàn cao, thuộc nhóm thuật toán băm chậm.
- **MAC (Message Authentication Code - Mã xác thực thông điệp):** HMAC là dạng MAC dựa trên hàm băm, có thể kết hợp với bất kỳ thuật toán băm an toàn nào, chẳng hạn như SHA-256.
- **CRC (Cyclic Redundancy Check - Kiểm tra dư thừa vòng):** CRC32 là một thuật toán CRC tạo ra mã kiểm tra 32-bit, thường dùng trong kiểm tra tính toàn vẹn dữ liệu, kiểm tra tệp tin, v.v.
- **SipHash:** Khác với hàm băm mật mã truyền thống không cần khóa (như SHA-256), SipHash là một hàm giả ngẫu nhiên có khóa — keyed PRF (Pseudo-Random Function). Phải kết hợp với một khóa ngẫu nhiên mới thực sự có khả năng chống tấn công đụng độ. Nó được thiết kế để cân bằng giữa tốc độ và bảo mật, dùng để phòng chống [tấn công từ chối dịch vụ ngập lụt băm (Hash-flooding DoS)](https://aumasson.jp/siphash/siphashdos_29c3_slides.pdf). Rust mặc định dùng SipHash làm thuật toán băm (hiện là SipHash-1-3); từ phiên bản Redis 4.0, thuật toán băm của cấu trúc dictionary (`dict`) trong Redis đã chuyển từ MurmurHash2 sang SipHash (hiện là SipHash-1-2).
- **MurMurHash:** Thuật toán băm phi mật mã nhanh kinh điển; phiên bản mới nhất hiện nay là MurMurHash3, có thể sinh giá trị băm 32-bit hoặc 128-bit.
- ……

Thông thường thuật toán băm không cần khóa (key), nhưng vẫn tồn tại một số thuật toán băm đặc biệt cần dùng khóa. Ví dụ, MAC và SipHash là các thuật toán băm có khóa: chúng bổ sung thêm một khóa bí mật trên nền tảng hàm băm để chỉ những người nắm giữ khóa mới xác thực được tính toàn vẹn và nguồn gốc của dữ liệu.

### MD

Thuật toán MD có nhiều phiên bản gồm MD2, MD4, MD5, v.v., trong đó MD5 là phiên bản phổ biến nhất, tạo ra giá trị băm 128-bit (16 byte). Xét về mức độ an toàn: MD5 > MD4 > MD2. Ngoài các phiên bản này còn có một số thuật toán cải tiến từ MD4 hoặc MD5 như RIPEMD, HAVAL.

Ngay cả phiên bản an toàn nhất trong họ MD là MD5 cũng tồn tại rủi ro bị bẻ khóa: kẻ tấn công có thể dùng vét cạn (brute-force) hoặc bảng cầu vồng (rainbow table) để tìm ra đầu vào khớp với giá trị băm gốc và giải mã dữ liệu.

Để tăng độ khó khi bẻ khóa, người ta thường chọn thêm muối (**Salt**). Trong mật mã học, muối (Salt) là việc chèn một chuỗi ký tự ngẫu nhiên vào mật khẩu để kết quả sau khi băm khác với kết quả băm của mật khẩu gốc — quá trình này gọi là "thêm muối" (salting).

Liệu thêm muối xong đã an toàn tuyệt đối chưa? Chưa chắc — việc này chỉ làm tăng độ khó bẻ khóa chứ không đồng nghĩa với không thể bẻ khóa. Hơn nữa bản thân thuật toán MD5 đã có lỗi yếu về đụng độ (Collision), tức nhiều đầu vào khác nhau có thể sinh ra cùng một giá trị MD5.

Vì vậy, dòng thuật toán MD không còn được khuyến nghị sử dụng; nên chuyển sang các thuật toán an toàn hơn như SHA-2 hoặc Bcrypt.

Java hỗ trợ sẵn dòng thuật toán MD, bao gồm MD2 và MD5.

Ví dụ mã nguồn MD5 (chưa thêm salt):

```java
String originalString = "Java学习 + 面试指南：javaguide.cn";
// Tạo đối tượng digest MD5
MessageDigest messageDigest = MessageDigest.getInstance("MD5");
messageDigest.update(originalString.getBytes(StandardCharsets.UTF_8));
// Tính toán giá trị băm
byte[] result = messageDigest.digest();
// Chuyển giá trị băm sang chuỗi thập lục phân (hex)
String hexString = new HexBinaryAdapter().marshal(result);
System.out.println("Original String: " + originalString);
System.out.println("MD5 Hash: " + hexString.toLowerCase());
```

Kết quả đầu ra:

```bash
Original String: Java学习 + 面试指南：javaguide.cn
MD5 Hash: fb246796f5b1b60d4d0268c817c608fa
```

### SHA

Dòng thuật toán SHA (Secure Hash Algorithm) là một nhóm các thuật toán băm mật mã dùng để ánh xạ dữ liệu có độ dài bất kỳ thành giá trị băm có độ dài cố định. Được Cơ quan An ninh Quốc gia Hoa Kỳ (NSA) thiết kế vào năm 1993, họ thuật toán SHA hiện có ba phiên bản chính: SHA-1, SHA-2 và SHA-3.

Thuật toán SHA-1 ánh xạ dữ liệu có độ dài bất kỳ thành giá trị băm 160-bit. Tuy nhiên, SHA-1 tồn tại nhiều lỗ hổng nghiêm trọng như độ an toàn thấp, dễ bị tấn công đụng độ (collision attack) và tấn công mở rộng độ dài (length-extension attack). Do đó SHA-1 không còn được khuyến nghị sử dụng. Họ SHA-2 (như SHA-256, SHA-384, SHA-512) và dòng SHA-3 là phương án thay thế cho SHA-1, đều mang lại độ an toàn cao hơn và độ dài giá trị băm lớn hơn.

Họ SHA-2 được cải tiến dựa trên nền tảng SHA-1, áp dụng quy trình tính toán phức tạp hơn và nhiều vòng lặp (rounds) hơn, khiến kẻ tấn công khó tìm ra đụng độ thông qua tính toán trước hay ngẫu nhiên.

Để tìm kiếm một thuật toán băm mật mã an toàn và tiên tiến hơn nữa, Viện Tiêu chuẩn và Công nghệ Quốc gia Hoa Kỳ (NIST) đã mở cuộc thi tuyển chọn ứng viên cho SHA-3 vào năm 2007. NIST nhận được tổng cộng 64 đề xuất thuật toán, và sau nhiều vòng đánh giá sàng lọc, đến năm 2012 đã công bố thuật toán Keccak chiến thắng để trở thành chuẩn SHA-3 (SHA-3 không có quan hệ kế thừa trực tiếp từ SHA-2). Keccak có tư tưởng thiết kế hoàn toàn khác với MD và SHA-1/2, gọi là cấu trúc bọt biển (Sponge Construction), khiến các phương pháp tấn công truyền thống không thể áp dụng trực tiếp vào SHA-3 (có thể chống lại mọi phương thức tấn công đã biết hiện nay bao gồm tấn công đụng độ, tấn công mở rộng độ dài, tấn công vi sai, v.v.).

Vì thuật toán SHA-2 chưa phát hiện lỗ hổng bảo mật nghiêm trọng nào và đạt hiệu năng thực thi bằng phần mềm cao hơn, phần lớn hệ thống vẫn ưu tiên sử dụng SHA-2.

So với thuật toán MD5, SHA-2 mạnh hơn chủ yếu vì hai lý do:

- **Giá trị băm dài hơn:** Chẳng hạn giá trị băm của SHA-256 dài 256 bit, trong khi MD5 chỉ dài 128 bit, làm tăng độ khó của tấn công vét cạn và bảng cầu vồng.
- **Khả năng chống đụng độ mạnh hơn:** SHA sử dụng các phép toán phức tạp hơn với nhiều vòng biến đổi hơn, khiến kẻ tấn công cực kỳ khó tìm thấy đụng độ. Hiện tại vẫn chưa tìm thấy hai dữ liệu khác nhau nào có cùng giá trị băm SHA-256.

Tất nhiên SHA-2 cũng không an toàn tuyệt đối khi lưu mật khẩu thô vì vẫn có nguy cơ bị vét cạn hoặc tấn công bảng cầu vồng; do đó trong ứng dụng thực tế việc thêm muối (salting) vẫn là bắt buộc (và với mật khẩu nên dùng thuật toán băm chậm chuyên dụng).

Java hỗ trợ dòng thuật toán SHA bao gồm SHA-1, SHA-256, SHA-384 và SHA-512.

Ví dụ mã nguồn SHA-256 (chưa thêm salt):

```java
String originalString = "Java学习 + 面试指南：javaguide.cn";
// Tạo đối tượng digest SHA-256
MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
messageDigest.update(originalString.getBytes());
// Tính toán giá trị băm
byte[] result = messageDigest.digest();
// Chuyển giá trị băm sang chuỗi thập lục phân (hex)
String hexString = new HexBinaryAdapter().marshal(result);
System.out.println("Original String: " + originalString);
System.out.println("SHA-256 Hash: " + hexString.toLowerCase());
```

Kết quả đầu ra:

```bash
Original String: Java学习 + 面试指南：javaguide.cn
SHA-256 Hash: 184eb7e1d7fb002444098c9bde3403c6f6722c93ecfac242c0e35cd9ed3b41cd
```

### Bcrypt

Bcrypt là thuật toán băm mật khẩu dựa trên thuật toán mã hóa Blowfish, được thiết kế chuyên biệt cho việc bảo vệ mật khẩu với độ an toàn cao.

Do Bcrypt tích hợp sẵn hai cơ chế `salt` (muối) và `cost` (chi phí tính toán), nó giúp phòng chống hiệu quả các cuộc tấn công bảng cầu vồng và vét cạn, bảo đảm an toàn cho mật khẩu. `salt` là chuỗi sinh ngẫu nhiên dùng để trộn cùng mật khẩu nhằm tăng độ phức tạp và tính duy nhất. `cost` là tham số số học kiểm soát số vòng lặp của thuật toán Bcrypt, làm tăng thời gian tính toán và mức tiêu hao tài nguyên khi băm mật khẩu.

Bcrypt có thể điều chỉnh độ phức tạp mã hóa tùy theo tình hình thực tế bằng cách thiết lập các giá trị `cost` và `salt` khác nhau để đáp ứng nhu cầu bảo mật đa dạng, độ linh hoạt rất cao.

Framework bảo mật Spring Security cho ứng dụng Java hỗ trợ nhiều Password Encoder khác nhau, trong đó `BCryptPasswordEncoder` là lựa chọn được khuyến nghị chính thức, sử dụng thuật toán BCrypt để băm và lưu trữ mật khẩu người dùng.

```java
@Bean
public PasswordEncoder passwordEncoder(){
    return new BCryptPasswordEncoder();
}
```

## Mã hóa đối xứng (Symmetric Encryption)

Thuật toán mã hóa đối xứng là thuật toán sử dụng **cùng một khóa (key)** cho cả quá trình mã hóa và giải mã, còn gọi là thuật toán mã hóa khóa chia sẻ (shared-key encryption).

![Mã hóa đối xứng](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/symmetric-encryption-df895fe5.png)

Các thuật toán mã hóa đối xứng phổ biến gồm DES, 3DES, AES, v.v.

### DES và 3DES

DES (Data Encryption Standard) sử dụng khóa 64-bit (độ dài khóa hiệu dụng là 56 bit và 8 bit kiểm tra chẵn lẻ) cùng các khối bản rõ 64-bit để thực hiện mã hóa.

Mặc dù mỗi lần DES chỉ mã hóa được 64 bit, ta chỉ cần chia nhỏ bản rõ thành từng khối (block) 64-bit là có thể mã hóa được bản rõ có độ dài bất kỳ. Nếu độ dài bản rõ không phải bội số của 64 bit, bắt buộc phải thực hiện đệm dữ liệu (padding); các chế độ padding phổ biến gồm `PKCS5Padding`, `PKCS7Padding`, `NOPADDING`.

Tư tưởng cơ bản của thuật toán mã hóa DES là chia khối bản rõ 64-bit thành hai nửa, thực hiện nhiều vòng biến đổi trên từng nửa, sau đó ghép lại thành khối bản mã 64-bit. Các phép biến đổi này bao gồm hoán vị, phép XOR, chọn lọc/thay thế, dịch bit, v.v.; mỗi vòng sử dụng một khóa con (subkey) được sinh từ cùng một khóa chính 56-bit. Tổng cộng DES thực hiện 16 vòng biến đổi, cuối cùng thực hiện một lần hoán vị nghịch để thu được bản mã cuối cùng.

![DES (Data Encryption Standard)](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/des-steps-e5333574.jpg)

Đây là một thuật toán mã hóa đối xứng kinh điển nhưng tồn tại khuyết điểm rõ rệt: khóa 56-bit có độ an toàn không đủ cao và đã bị chứng minh có thể bị bẻ khóa trong thời gian ngắn.

Để nâng cao độ an toàn của DES, người ta đã đề xuất các biến thể hoặc giải pháp thay thế, chẳng hạn **3DES (Triple DES)**.

3DES (Triple DES) là thuật toán mã hóa chuyển tiếp từ DES sang AES, sử dụng 2 hoặc 3 khóa 56-bit để mã hóa dữ liệu ba lần. Về bản chất, 3DES tương đương việc áp dụng thuật toán mã hóa đối xứng DES ba lần liên tiếp lên mỗi khối dữ liệu.

Để tương thích ngược với DES thông thường, 3DES không dùng trực tiếp kiểu `Mã hóa -> Mã hóa -> Mã hóa`, mà áp dụng quy trình `Mã hóa -> Giải mã -> Mã hóa`. Khi cả ba khóa giống hệt nhau, hai bước đầu tự triệt tiêu nhau, tương đương chỉ thực hiện một lần mã hóa — nhờ đó giữ được khả năng tương thích với thuật toán DES chuẩn. 3DES an toàn hơn DES nhưng tốc độ xử lý không cao.

### AES

AES (Advanced Encryption Standard) là một thuật toán mã hóa khóa đối xứng tiên tiến hơn, sử dụng khóa 128-bit, 192-bit hoặc 256-bit để mã hóa và giải mã dữ liệu; khóa càng dài thì độ an toàn càng cao.

AES cũng là một thuật toán mã hóa khối (block cipher), với kích thước khối cố định là 128 bit — tức mỗi khối gồm 16 byte. AES hỗ trợ nhiều chế độ hoạt động (mode of operation) như: ECB, CBC, OFB, CFB, CTR, XTS, OCB, GCM (chế độ được dùng phổ biến nhất hiện nay). Các chế độ khác nhau có tham số và quy trình mã hóa khác nhau, nhưng cốt lõi vẫn là thuật toán AES.

Tương tự DES, một số chế độ hoạt động của AES yêu cầu padding nếu độ dài bản rõ không phải bội số của 128 bit. Tuy nhiên, **GCM** là chế độ mã hóa có xác thực (AEAD — Authenticated Encryption with Associated Data) được xây dựng trên nền tảng mã khối, có thể xử lý bản rõ có độ dài bất kỳ; do đó trong Java thường dùng `AES/GCM/NoPadding`. GCM vừa cung cấp tính bảo mật (confidentiality) vừa kiểm tra tính toàn vẹn của bản mã, nhưng yêu cầu IV (Nonce) không bao giờ được trùng lặp dưới cùng một khóa.

AES vừa nhanh hơn 3DES vừa an toàn hơn nhiều.

![AES (Advanced Encryption Standard)](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/aes-steps-5ddaa529.jpg)

So sánh nhanh giữa thuật toán DES và thuật toán AES (hình ảnh từ: [RSA vs. AES Encryption: Key Differences Explained](https://cheapsslweb.com/blog/rsa-vs-aes-encryption)):

![So sánh DES và AES](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/des-vs-aes-68672629.png)

Ví dụ mã nguồn Java triển khai AES-GCM. Ví dụ dưới đây mã hóa ghép chung IV sinh ngẫu nhiên mỗi lần chạy cùng với bản mã; trong môi trường production, khóa AES phải được tạo và bảo quản bởi KMS, HSM hoặc KeyStore, tuyệt đối không hardcode trong mã nguồn:

```java
private static final String AES_TRANSFORMATION = "AES/GCM/NoPadding";
private static final int GCM_IV_LENGTH = 12;
private static final int GCM_TAG_LENGTH = 128;
private static final SecureRandom SECURE_RANDOM = new SecureRandom();

/**
 * Mã hóa
 */
public static String encrypt(String data, SecretKey secretKey) throws GeneralSecurityException {
    byte[] iv = new byte[GCM_IV_LENGTH];
    SECURE_RANDOM.nextBytes(iv);

    Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
    cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
    byte[] encryptedBytes = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));

    // IV không cần giữ bí mật, nhưng khi giải mã bắt buộc phải dùng đúng IV này, vì vậy lưu ghép cùng bản mã.
    ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encryptedBytes.length);
    byteBuffer.put(iv);
    byteBuffer.put(encryptedBytes);
    return Base64.getEncoder().encodeToString(byteBuffer.array());
}

/**
 * Giải mã
 */
public static String decrypt(String encryptedData, SecretKey secretKey) throws GeneralSecurityException {
    byte[] input = Base64.getDecoder().decode(encryptedData);
    int tagLengthInBytes = GCM_TAG_LENGTH / Byte.SIZE;
    if (input.length < GCM_IV_LENGTH + tagLengthInBytes) {
        throw new IllegalArgumentException("Invalid encrypted data");
    }

    ByteBuffer byteBuffer = ByteBuffer.wrap(input);
    byte[] iv = new byte[GCM_IV_LENGTH];
    byteBuffer.get(iv);
    byte[] encryptedBytes = new byte[byteBuffer.remaining()];
    byteBuffer.get(encryptedBytes);

    Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
    cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
    byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
    return new String(decryptedBytes, StandardCharsets.UTF_8);
}

public static void main(String[] args) throws Exception {
    // Chỉ dùng để minh họa. Môi trường production nên lấy khóa từ KMS, HSM hoặc KeyStore.
    KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
    keyGenerator.init(256);
    SecretKey secretKey = keyGenerator.generateKey();

    String originalString = "Java学习 + 面试指南：javaguide.cn";
    String encryptedData = encrypt(originalString, secretKey);
    String decryptedData = decrypt(encryptedData, secretKey);
    System.out.println("Original String: " + originalString);
    System.out.println("AES Encrypted Data : " + encryptedData);
    System.out.println("AES Decrypted Data : " + decryptedData);
}
```

Kết quả đầu ra:

```bash
Original String: Java学习 + 面试指南：javaguide.cn
AES Encrypted Data : <Chuỗi Base64 khác nhau ở mỗi lần chạy>
AES Decrypted Data : Java学习 + 面试指南：javaguide.cn
```

## Mã hóa bất đối xứng (Asymmetric Encryption)

Thuật toán mã hóa bất đối xứng là thuật toán sử dụng **hai khóa khác nhau** cho việc mã hóa và giải mã, còn gọi là thuật toán mật mã khóa công khai (Public-key Cryptography). Hai khóa này không giống nhau: một khóa gọi là **khóa công khai (Public Key)** và khóa còn lại gọi là **khóa bí mật (Private Key)**. Khóa công khai có thể chia sẻ rộng rãi cho bất kỳ ai sử dụng, còn khóa bí mật phải được giữ kín tuyệt đối.

Nếu dữ liệu được mã hóa bằng khóa công khai thì chỉ có thể giải mã bằng khóa bí mật tương ứng. Chữ ký số (Digital Signature) là một nhóm thao tác khác: bên gửi dùng khóa bí mật để tạo chữ ký, bên nhận dùng khóa công khai để xác minh chữ ký. Không nên hiểu đơn giản chữ ký số là "mã hóa bằng khóa bí mật, giải mã bằng khóa công khai"; dự án thực tế cần dùng riêng biệt API mã hóa và API chữ ký số.

![Mã hóa bất đối xứng](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/asymmetric-encryption-06d2eb93.png)

Các thuật toán mật mã khóa công khai phổ biến gồm RSA và các thuật toán dựa trên đường cong Elliptic (ECC). Khả năng cụ thể của chúng khác nhau: RSA có thể dùng cho cả mã hóa và ký số; DSA chỉ dùng được cho ký số; còn ECC là tên gọi chung cho một họ thuật toán bao gồm các cơ chế khác nhau dùng cho ký số hoặc thỏa thuận khóa (key agreement).

### RSA

RSA (thuật toán Rivest–Shamir–Adleman) là một thuật toán mã hóa bất đối xứng dựa trên độ khó của bài toán phân tích thừa số nguyên lớn. Thuật toán này cần chọn hai số nguyên tố lớn làm một phần của khóa bí mật, rồi tính tích của chúng để làm một phần của khóa công khai (tìm hai số nguyên tố lớn tương đối dễ, nhưng phân tích tích của chúng ngược lại thành thừa số nguyên tố lại cực kỳ khó). Để hiểu chi tiết nguyên lý toán học của thuật toán RSA, bạn có thể tham khảo bài viết: [Bạn có thực sự hiểu thuật toán mã hóa RSA không? - Xiaofuge](https://www.cnblogs.com/xiaofuge/p/16954187.html).

Độ an toàn của RSA phụ thuộc vào độ khó của việc phân tích số lớn. Hiện nay các khóa công khai RSA 512-bit và 768-bit đã bị phân tích thành công, do đó khuyến nghị sử dụng độ dài khóa từ **2048 bit trở lên**.

Ưu điểm của thuật toán RSA là dễ sử dụng, hỗ trợ cả mã hóa dữ liệu lẫn chữ ký số; nhược điểm là tốc độ tính toán chậm, không phù hợp để mã hóa lượng dữ liệu lớn.

RSA hiện là thuật toán mã hóa bất đối xứng được ứng dụng rộng rãi nhất, được sử dụng trong các giao thức như SSL/TLS, SSH, v.v.

![Thuật toán chữ ký chứng chỉ HTTPS dùng SHA-256 kết hợp mã hóa RSA](/media/jg/ext/oss.javaguide.cn/system-design/security/encryption-algorithms/https-rsa-sha-256-416a3f76.png)

Vì RSA tính toán chậm và giới hạn kích thước dữ liệu có thể xử lý trực tiếp, các dự án thực tế thường áp dụng **mã hóa lai (hybrid encryption)**: sinh ngẫu nhiên một khóa đối xứng, dùng AES-GCM để mã hóa dữ liệu nghiệp vụ, rồi dùng RSA-OAEP để mã hóa khóa đối xứng đó. Ví dụ dưới đây chỉ minh họa cách dùng RSA-OAEP để mã hóa dữ liệu ngắn:

```java
private static final String RSA_ALGORITHM = "RSA";
private static final String RSA_TRANSFORMATION = "RSA/ECB/OAEPPadding";
private static final OAEPParameterSpec OAEP_SHA_256 = new OAEPParameterSpec(
        "SHA-256",
        "MGF1",
        MGF1ParameterSpec.SHA256,
        PSource.PSpecified.DEFAULT
);

/**
 * Tạo cặp khóa RSA
 */
public static KeyPair generateKeyPair() throws NoSuchAlgorithmException {
    KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(RSA_ALGORITHM);
    // Độ dài khóa 2048 bit
    keyPairGenerator.initialize(2048);
    return keyPairGenerator.generateKeyPair();
}

/**
 * Mã hóa dữ liệu bằng khóa công khai
 */
public static String encrypt(String data, PublicKey publicKey) throws Exception {
    Cipher cipher = Cipher.getInstance(RSA_TRANSFORMATION);
    cipher.init(Cipher.ENCRYPT_MODE, publicKey, OAEP_SHA_256);
    byte[] encryptedData = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
    return Base64.getEncoder().encodeToString(encryptedData);
}

/**
 * Giải mã dữ liệu bằng khóa bí mật
 */
public static String decrypt(String encryptedData, PrivateKey privateKey) throws Exception {
    byte[] decodedData = Base64.getDecoder().decode(encryptedData);
    Cipher cipher = Cipher.getInstance(RSA_TRANSFORMATION);
    cipher.init(Cipher.DECRYPT_MODE, privateKey, OAEP_SHA_256);
    byte[] decryptedData = cipher.doFinal(decodedData);
    return new String(decryptedData, StandardCharsets.UTF_8);
}

public static void main(String[] args) throws Exception {
    KeyPair keyPair = generateKeyPair();
    PublicKey publicKey = keyPair.getPublic();
    PrivateKey privateKey = keyPair.getPrivate();
    String originalString = "Java学习 + 面试指南：javaguide.cn";
    String encryptedData = encrypt(originalString, publicKey);
    String decryptedData = decrypt(encryptedData, privateKey);
    System.out.println("Original String: " + originalString);
    System.out.println("RSA Encrypted Data : " + encryptedData);
    System.out.println("RSA Decrypted Data : " + decryptedData);
}
```

Kết quả đầu ra:

```bash
Original String: Java学习 + 面试指南：javaguide.cn
RSA Encrypted Data : <Chuỗi Base64 khác nhau ở mỗi lần chạy>
RSA Decrypted Data : Java学习 + 面试指南：javaguide.cn
```

### DSA

DSA (Digital Signature Algorithm) là thuật toán chữ ký số có độ an toàn dựa trên bài toán logarit rời rạc (Discrete Logarithm Problem). Thuật toán này chỉ có thể dùng để tạo và xác minh chữ ký số, **không thể** dùng để mã hóa dữ liệu. Chữ ký số cũng không phải là "mã hóa bản tóm tắt bằng khóa bí mật và giải mã bằng khóa công khai": bên gửi dùng khóa bí mật cùng thuật toán ký để tạo chữ ký, bên nhận dùng khóa công khai cùng thuật toán xác minh để đánh giá chữ ký có hợp lệ hay không.

DSA chủ yếu được dùng để tương thích với các hệ thống cũ (legacy systems). Tiêu chuẩn **NIST FIPS 186-5** đã không còn phê duyệt sử dụng DSA để tạo chữ ký số mới, mà chỉ cho phép xác minh các chữ ký cũ được tạo trước khi tiêu chuẩn này có hiệu lực. Các hệ thống mới thông thường nên chọn **RSA-PSS**, **ECDSA** hoặc **EdDSA** tùy theo yêu cầu giao thức và tính tương thích, đồng thời sử dụng API `Signature` do các thư viện mật mã uy tín cung cấp.

## Tổng kết

Bài viết này đã giới thiệu ba nhóm thuật toán mật mã chính: thuật toán băm, thuật toán mã hóa đối xứng và thuật toán mã hóa bất đối xứng.

- **Thuật toán băm** là kỹ thuật dùng phương pháp toán học để tạo ra định danh duy nhất có độ dài cố định cho dữ liệu, giúp kiểm chứng tính toàn vẹn và nhất quán của dữ liệu; các thuật toán phổ biến gồm MD, SHA, MAC, v.v.
- **Thuật toán mã hóa đối xứng** là thuật toán dùng chung một khóa cho cả mã hóa và giải mã, giúp bảo vệ an toàn và tính bí mật cho dữ liệu; các thuật toán phổ biến gồm DES, 3DES, AES, v.v.
- **Mật mã khóa công khai** sử dụng cặp khóa công khai và khóa bí mật, có thể hỗ trợ mã hóa, chữ ký số hoặc thỏa thuận khóa tùy vào từng thuật toán cụ thể. Ví dụ RSA dùng được cho cả mã hóa và ký số, trong khi DSA chỉ dùng được cho ký số.

## Tài liệu tham khảo

- NIST SP 800-38D - Recommendation for Block Cipher Modes of Operation: GCM and GMAC: <https://csrc.nist.gov/pubs/sp/800/38/d/final>
- NIST FIPS 186-5 - Digital Signature Standard: <https://csrc.nist.gov/pubs/fips/186-5/final>
- Tài liệu Java `Cipher` API: <https://docs.oracle.com/en/java/javase/11/docs/api/java.base/javax/crypto/Cipher.html>
- Tìm hiểu sâu về Perfect Hashing - Tencent Tech Engineering: <https://mp.weixin.qq.com/s/M8Wcj8sZ7UF1CMr887Puog>
- Mật mã học thực dụng cho lập trình viên (Phần 2) — Hàm băm: <https://thiscute.world/posts/practical-cryptography-basics-2-hash/>
- Hành trình bảo mật kỳ thú của thuật toán DSA: <https://zhuanlan.zhihu.com/p/347025157>
- Giới thiệu sơ lược về mã hóa AES-GCM: <https://juejin.cn/post/6844904122676690951>
- Java AES 256 GCM Encryption and Decryption Example | JCE Unlimited Strength: <https://www.javainterviewpoint.com/java-aes-256-gcm-encryption-and-decryption/>
