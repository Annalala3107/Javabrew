---
title: "Giải thích chi tiết các giải pháp Giao dịch phân tán: XA, AT, TCC, Saga, Local Message Table và Transactional Message"
category: Hệ thống Phân tán
description: "Giải thích chi tiết các giải pháp giao dịch phân tán (Distributed Transaction), bao gồm nguyên lý, ưu nhược điểm, kịch bản áp dụng và trọng điểm phỏng vấn của 2PC, 3PC, XA, Seata AT, TCC, Saga, Local Message Table, RocketMQ Transactional Message, Best-Effort Notification, v.v."
tag:
  - Giao dịch phân tán
head:
  - - meta
    - name: keywords
      content: Giao dịch phân tán,Distributed Transaction,2PC,3PC,XA,Seata AT,TCC,Saga,Local Message Table,Transactional Message,RocketMQ,Best-Effort Notification,Nhất quán cuối cùng,Giao dịch bù trừ,Câu hỏi phỏng vấn giao dịch phân tán
lang: vi
sourceRef: zh-ref/distributed-system/distributed-transaction.md
---

**Trên mạng đã có rất nhiều bài viết về giao dịch phân tán rồi, vì sao vẫn viết thêm một bài nữa?**

1. Thứ nhất là mình thấy phần lớn bài viết đọc khá khó hiểu, chưa thân thiện lắm với các bạn mới chưa có nhiều kinh nghiệm. Mục tiêu của bài viết này là giúp ngay cả những bạn chưa đi làm nhiều cũng có thể thực sự nắm vững giao dịch phân tán.
2. Thứ hai là phần lớn bài viết trình bày chưa đủ chi tiết, bỏ sót nhiều khái niệm rất quan trọng xoay quanh giao dịch phân tán.

Trước khi đi vào giao dịch phân tán, chúng ta hãy ôn lại các khái niệm liên quan đến transaction.

> **Lưu ý phiên bản**: Nội dung liên quan đến Seata trong bài này dựa trên tài liệu 1.7+ / 2.x, còn RocketMQ Transactional Message dựa trên tài liệu 4.9+ / 5.x. Tham số mặc định, API và cách triển khai giữa các phiên bản có thể khác nhau; khi áp dụng thực tế cần đối chiếu tài liệu đúng phiên bản của dự án.

Bài viết này tập trung vào cách điều phối commit hoặc bù trừ (compensation) khi ghi dữ liệu xuyên qua nhiều service. Trước khi đọc, bạn nên nắm trước những đánh đổi trong [Giải thích chi tiết Định lý CAP và Lý thuyết BASE](./protocol/cap-and-base-theorem.md) cũng như bài toán loại trừ lẫn nhau và lease trong [Khóa phân tán (Distributed Lock)](./distributed-lock.md); sau khi đọc xong, hãy soi lại vào nghiệp vụ thực tế xem trạng thái nào bắt buộc ràng buộc chặt, trạng thái nào có thể nhất quán cuối cùng (Eventual Consistency).

## Giao dịch (Transaction)

Hãy hình dung một tình huống cần chèn nhiều bản ghi có liên quan với nhau vào cơ sở dữ liệu. Không may, quá trình này có thể gặp phải các sự cố sau:

- Cơ sở dữ liệu đột ngột sập giữa chừng vì một nguyên nhân nào đó.
- Client đột ngột mất kết nối tới cơ sở dữ liệu do lỗi mạng.
- Khi truy cập cơ sở dữ liệu đồng thời, nhiều Thread cùng ghi đè lên thay đổi của nhau.
- ……

Bất kỳ sự cố nào ở trên đều có thể dẫn tới mất nhất quán dữ liệu. Để đảm bảo tính nhất quán dữ liệu, hệ thống bắt buộc phải xử lý được các tình huống lỗi này. Transaction chính là cơ chế trừu tượng hàng đầu được tạo ra để đơn giản hóa bài toán đó. Khái niệm Transaction bắt nguồn từ cơ sở dữ liệu và hiện nay đã trở thành một khái niệm rộng hơn nhiều.

**Transaction là gì?** Nói gọn lại, **Transaction là một nhóm các thao tác xét về mặt logic: hoặc thực thi tất cả, hoặc không thực thi thao tác nào.**

Ví dụ kinh điển và hay được nhắc nhất về Transaction là chuyển khoản. Giả sử Tiểu Minh chuyển cho Tiểu Hồng 1.000 tệ; giao dịch chuyển khoản này liên quan đến hai thao tác cốt lõi và cả hai buộc phải cùng thành công hoặc cùng thất bại:

1. Trừ 1.000 tệ khỏi số dư của Tiểu Minh
2. Cộng 1.000 tệ vào số dư của Tiểu Hồng.

Transaction xem hai thao tác này là một chỉnh thể về mặt logic: mọi thao tác trong chỉnh thể này hoặc cùng thành công, hoặc cùng thất bại. Nhờ vậy sẽ không bao giờ xảy ra cảnh số dư của Tiểu Minh bị trừ nhưng số dư của Tiểu Hồng lại không tăng.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/.png-a0059ccb.png)

## Giao dịch cơ sở dữ liệu (Database Transaction)

Phần lớn trường hợp khi nhắc tới Transaction mà không nói rõ là **giao dịch phân tán (Distributed Transaction)** thì thường chính là đang nói đến **giao dịch cơ sở dữ liệu (Database Transaction)**.

Database Transaction là thứ chúng ta tiếp xúc nhiều nhất trong công việc lập trình hằng ngày. Nếu dự án của bạn thuộc kiến trúc nguyên khối (Monolith), thứ bạn làm việc cùng chủ yếu chính là Database Transaction.

**Vậy Database Transaction có tác dụng gì?**

Nói đơn giản, Database Transaction giúp nhiều thao tác đối với cơ sở dữ liệu (tức các câu lệnh SQL) gộp thành một khối logic thống nhất. Các thao tác database trong khối logic này tuân theo nguyên tắc: **hoặc tất cả cùng thực thi thành công, hoặc tất cả không có hiệu lực**.

```sql
# Mở một transaction
START TRANSACTION;
# Nhiều câu lệnh SQL
SQL1,SQL2...
## Commit transaction
COMMIT;
```

![Sơ đồ minh họa Database Transaction](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/.png-34ac1d2d.png)

Ngoài ra, Transaction trong các cơ sở dữ liệu quan hệ (như `MySQL`, `SQL Server`, `Oracle`, v.v.) đều có 4 đặc tính **ACID**:

![ACID](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/ACID-ad1efa4f.png)

1. **Tính nguyên tử (`Atomicity`)**: Transaction là đơn vị thực thi nhỏ nhất, không thể chia nhỏ hơn. Tính nguyên tử đảm bảo các hành động hoặc hoàn thành toàn bộ, hoặc hoàn toàn không có tác dụng gì;
2. **Tính nhất quán (`Consistency`)**: Trước và sau khi thực thi Transaction, dữ liệu luôn giữ trạng thái nhất quán — ví dụ trong nghiệp vụ chuyển khoản, dù giao dịch thành công hay thất bại, tổng số dư của người chuyển và người nhận phải không đổi;
3. **Tính cô lập (`Isolation`)**: Khi truy cập đồng thời vào cơ sở dữ liệu, Transaction của một người dùng không bị Transaction khác làm nhiễu; mỗi Transaction chạy đồng thời đều độc lập với nhau;
4. **Tính bền vững (`Durability`)**: Một khi Transaction đã commit, thay đổi của nó đối với dữ liệu trong database là bền vững; ngay cả khi database gặp sự cố cũng không được mất mát.

🌈 Bổ sung thêm một điểm rất quan trọng ở đây: **Chỉ sau khi đảm bảo được Tính bền vững, Tính nguyên tử và Tính cô lập thì Tính nhất quán mới được bảo toàn. Nói cách khác, A, I, D là phương tiện, còn C mới là mục tiêu!** Chắc hẳn nhiều bạn cũng giống mình, bị khái niệm ACID đánh lừa suốt một thời gian dài! Mình cũng chỉ thông suốt sau khi xem khóa học mở của thầy Chu Chí Minh [Khóa học Kiến trúc phần mềm của Chu Chí Minh (tiếng Trung)](https://time.geekbang.org/opencourse/intro/100064201) (hãy đọc nhiều sách hay vào nhé!!!).

![AID->C](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/AID--C-78c67e55.png)

Bên cạnh đó, tác giả cuốn DDIA — [*Designing Data-Intensive Applications (Thiết kế các hệ thống ứng dụng chuyên sâu dữ liệu)*](https://book.douban.com/subject/30329536/) — cũng viết như sau:

> Atomicity, isolation, and durability are properties of the database, whereas consistency (in the ACID sense) is a property of the application. The application may rely on the database’s atomicity and isolation properties in order to achieve consistency, but it’s not up to the database alone.
>
> Dịch ý sang tiếng Việt là: Tính nguyên tử, tính cô lập và tính bền vững là thuộc tính của cơ sở dữ liệu, còn tính nhất quán (theo nghĩa ACID) là thuộc tính của ứng dụng. Ứng dụng có thể dựa vào tính nguyên tử và tính cô lập của database để đạt được tính nhất quán, nhưng điều đó không chỉ phụ thuộc vào riêng database. Vì vậy, chữ cái C thực chất không thuộc về ACID theo nghĩa thuần túy của database.

Rất khuyến nghị các bạn đọc cuốn *Designing Data-Intensive Applications* — xứng đáng đọc đi đọc lại nhiều lần! Trên Douban có gần 90% độc giả chấm 5 sao cho cuốn sách này. Ngoài ra bản dịch tiếng Trung mã nguồn mở đã có trên GitHub tại địa chỉ: [https://github.com/Vonng/ddia](https://github.com/Vonng/ddia).

![](/media/jg/ext/img-blog.csdnimg.cn/20210526162552353-03025e6b.png)

**Còn nguyên lý cài đặt của Database Transaction thì sao?**

Ở đây ta lấy InnoDB engine của MySQL làm ví dụ nói ngắn gọn.

InnoDB engine của MySQL dùng **redo log (nhật ký làm lại)** để đảm bảo **Tính bền vững (Durability)**, và dùng **undo log (nhật ký hoàn tác)** để đảm bảo **Tính nguyên tử (Atomicity)**. InnoDB đảm bảo **Tính cô lập (Isolation)** thông qua **cơ chế khóa (Lock)**, **MVCC** và các kỹ thuật liên quan (mức cô lập mặc định được hỗ trợ là **`REPEATABLE-READ`**).

## Giao dịch phân tán (Distributed Transaction)

Trong kiến trúc Microservices, một hệ thống được tách thành nhiều Microservice nhỏ. Mỗi Microservice có thể nằm trên các máy chủ khác nhau và thường sở hữu một cơ sở dữ liệu riêng. Trong bối cảnh đó, một nhóm thao tác thường đụng tới nhiều Microservice và nhiều cơ sở dữ liệu. Ví dụ: trong hệ thống thương mại điện tử, việc tạo một đơn hàng thường liên quan tới Order Service (tăng số lượng đơn / tạo đơn hàng), Inventory Service (trừ tồn kho)... và các service này có database riêng độc lập.

![Sơ đồ minh họa Distributed Transaction](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-with-two-services-24ad066a.png)

**Vậy làm thế nào để đảm bảo nhóm thao tác này hoặc cùng thành công, hoặc cùng thất bại?**

Lúc này chỉ dựa vào Database Transaction đơn lẻ là không thể giải quyết được nữa! Chúng ta cần đưa khái niệm **Giao dịch phân tán (Distributed Transaction)** vào!

Thực tế, bất cứ kịch bản nào vượt qua ranh giới một cơ sở dữ liệu đều cần đến Distributed Transaction. Chẳng hạn khi một database đơn lẻ chạm ngưỡng cổ chai hiệu năng hoặc dung lượng dữ liệu quá lớn, chúng ta phải tiến hành **Sharding (chia tách database)**. Sau khi tách, các bảng vốn nằm trong cùng một database lại phân tán ra nhiều database khác nhau; nếu một thao tác đơn lẻ chạm tới nhiều database thì Transaction tích hợp sẵn của từng database riêng lẻ không còn đáp ứng được nữa.

Nói ngắn gọn, **mục tiêu tối hậu của Distributed Transaction là đảm bảo tính nhất quán dữ liệu giữa nhiều cơ sở dữ liệu có liên quan với nhau trong hệ thống!**

Đã gọi là Transaction thì về mặt lý thuyết Distributed Transaction cũng phải tuân thủ bốn đặc tính ACID. Tuy nhiên, xét đến các yếu tố như hiệu năng và tính sẵn sàng (Availability), chúng ta thường không thể thỏa mãn trọn vẹn ACID mà buộc phải chọn một phương án dung hòa hợp lý.

Xoay quanh bài toán giao dịch phân tán, nhiều lý thuyết mới đã ra đời.

## Lý thuyết nền tảng của Giao dịch phân tán

### Định lý CAP và Lý thuyết BASE

Định lý CAP và lý thuyết BASE là kiến thức nền để hiểu các sự đánh đổi trong giao dịch phân tán. Khi ghi dữ liệu xuyên qua nhiều service, hệ thống thường không thể đồng thời theo đuổi nhất quán mạnh, khả dụng liên tục và độ phức tạp thấp; cuối cùng bài toán luôn quy về phán đoán kỹ thuật: "bước nào bắt buộc ràng buộc chặt, bước nào có thể bù trừ để hội tụ dần".

Bài này không triển khai lại đầy đủ định nghĩa CAP và BASE; bạn nên đọc trước [Giải thích chi tiết Định lý CAP và Lý thuyết BASE](./protocol/cap-and-base-theorem.md). Nếu muốn hiểu sâu thêm vì sao Leader/Quorum, Split-Brain, Lease và Fencing Token ảnh hưởng tới khóa phân tán, giao dịch và trung tâm cấu hình, có thể đọc tiếp [Giải thích chi tiết Điều phối phân tán](./protocol/centralized-and-decentralized.md).

### 3 mức độ nhất quán (Consistency)

Chúng ta có thể chia yêu cầu nhất quán của hệ thống thành 3 mức dưới đây:

- **Nhất quán mạnh (Strong Consistency)**: Hệ thống ghi vào giá trị gì, đọc ra ngay lập tức chính là giá trị đó.
- **Nhất quán yếu (Weak Consistency)**: Không đảm bảo chắc chắn đọc được giá trị vừa ghi mới nhất, cũng không cam kết sau bao lâu sẽ đọc được dữ liệu mới nhất, chỉ cố gắng đạt trạng thái nhất quán ở một thời điểm nào đó.
- **Nhất quán cuối cùng (Eventual Consistency)**: Bản nâng cấp của nhất quán yếu. Hệ thống cam kết sau một khoảng thời gian nhất định, dữ liệu sẽ hội tụ về trạng thái nhất quán.

Ngoài 3 mức nhất quán phổ biến trên, còn có các mô hình như Read-Your-Writes Consistency, Causal Consistency, v.v. Chi tiết có thể tham khảo bài báo [*Operational Characterization of Weak Memory Consistency Models*](https://es.cs.uni-kl.de/publications/datarsg/Senf13.pdf). Do các mô hình này ít gặp trong công việc hằng ngày nên mình không bàn sâu ở đây (một phần cũng vì bản thân mình chưa thực sự rành lắm 😅).

Giới kỹ thuật hiện nay khá chuộng **Eventual Consistency**, tuy nhiên ở một số kịch bản đòi hỏi độ chính xác dữ liệu cực kỳ nghiêm ngặt như chuyển khoản ngân hàng vẫn bắt buộc phải đảm bảo Strong Consistency.

### Giao dịch mềm (Flexible / Soft Transaction)

Với các ứng dụng Internet, yếu tố sống còn là giữ độ sẵn sàng cao (High Availability); hệ thống phân tán chỉ cần ngưng trệ vài giây cũng có thể gây thiệt hại khổng lồ. Trong bối cảnh đó, dựa trên nền tảng định lý CAP và lý thuyết BASE, các chuyên gia đã đề xuất khái niệm **Giao dịch mềm (Flexible Transaction)**. **Giao dịch mềm theo đuổi Eventual Consistency.**

Thực chất, giao dịch mềm chính là **lý thuyết BASE + thực tiễn nghiệp vụ**. Mục tiêu của nó là dựa vào đặc thù nghiệp vụ của chính hệ thống để tìm cách phù hợp đảm bảo tính nhất quán cuối cùng của dữ liệu. Những giải pháp như **TCC**, **Saga**, **MQ Transaction**, **Local Message Table** đều thuộc nhóm giao dịch mềm.

### Giao dịch cứng (Rigid / Hard Transaction)

Đối lập với giao dịch mềm là **Giao dịch cứng (Rigid Transaction)**. Như đã nói ở trên, **giao dịch mềm theo đuổi Eventual Consistency**, còn giao dịch cứng theo đuổi **Strong Consistency**. Những giao thức như **2PC**, **3PC** thuộc nhóm giao dịch cứng.

![Tổng kết các giải pháp Distributed Transaction](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-solution-summary-d5693981.png)

## Các giải pháp Giao dịch phân tán

Giải pháp cho giao dịch phân tán có rất nhiều, ví dụ: **XA / 2PC**, **3PC**, **AT**, **TCC**, **Saga**, **Local Message Table (Bảng tin cục bộ)**, **MQ Transaction** (cả Kafka và RocketMQ đều có tính năng liên quan đến transaction), **Best-Effort Notification (Thông báo nỗ lực tối đa)**, v.v.

2PC và 3PC thuộc nhóm giải pháp không xâm lấn code nghiệp vụ. Chuẩn XA là tiêu chuẩn Xử lý Giao dịch Phân tán (DTP — Distributed Transaction Processing) do tổ chức X/Open định nghĩa, quy định giao diện giữa TM và RM và thường hoàn tất commit thông qua 2PC. TCC và Saga thuộc nhóm xâm lấn code nghiệp vụ; AT nằm ở khoảng giữa XA và TCC; MQ Transaction phụ thuộc vào kịch bản có dùng Message Queue; còn Local Message Table và Best-Effort Notification chủ yếu hướng tới Eventual Consistency và không hỗ trợ tự động rollback.

Mỗi giải pháp phù hợp với bối cảnh khác nhau, chúng ta cần lựa chọn phương án tương thích với đặc thù dự án.

Một gợi ý chọn lựa nhanh:

- **Không chấp nhận Eventual Consistency**: Ưu tiên cân nhắc XA / 2PC — phù hợp với kịch bản giao dịch ngắn, nhất quán mạnh như tài chính, kế toán, nhưng phải chấp nhận đánh đổi về hiệu năng và tính sẵn sàng.
- **Muốn ít sửa code nghiệp vụ**: Có thể đánh giá Seata AT, Local Message Table hoặc MQ Transaction. AT ít xâm lấn code nghiệp vụ nhưng đặt ra ràng buộc về cấu trúc bảng database, phạm vi SQL hỗ trợ và Global Lock.
- **Chấp nhận xâm lấn nghiệp vụ và chuỗi gọi ngắn**: Có thể cân nhắc TCC — kịch bản điển hình là phong tỏa tài khoản, giữ chỗ tồn kho, khóa voucher khi cần đặt trước tài nguyên.
- **Chuỗi gọi dài, nhiều bước**: Có thể cân nhắc Saga — kịch bản điển hình là hoàn tất đơn hàng (order fulfillment), đặt tour/vé du lịch, quy trình phê duyệt dài.
- **Chỉ cần thông báo cho bên kia hoàn tất ở trạng thái cuối**: Có thể cân nhắc Best-Effort Notification — ví dụ callback thanh toán, thông báo trạng thái vận chuyển, cộng điểm thưởng.

Trước khi đi vào chi tiết 2PC và 3PC, ta làm rõ các vai trò xuất hiện trong 2PC và 3PC (thành phần vai trò theo chuẩn XA):

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/xa-specification-roles-ab4367c0.webp)

- **AP (Application Program)**: Chính là ứng dụng nghiệp vụ.
- **RM (Resource Manager)**: Trình quản lý tài nguyên, tức các bên tham gia vào giao dịch — phần lớn trường hợp chính là cơ sở dữ liệu (phần sau sẽ lấy CSDL quan hệ làm ví dụ). Một giao dịch phân tán thường liên quan tới nhiều RM.
- **TM (Transaction Manager)**: Trình quản lý giao dịch, chịu trách nhiệm quản lý giao dịch toàn cục (Global Transaction), cấp mã định danh duy nhất cho giao dịch, theo dõi tiến độ thực thi và điều phối commit, rollback cũng như khôi phục sau lỗi.

### 2PC (Giao thức Commit Hai Pha — Two-Phase Commit)

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/2pc-work-flow-78d968a7.png)

Ý nghĩa của ba chữ cái 2PC (Two-Phase Commit):

- **2** -> Chỉ 2 pha của quá trình commit giao dịch
- **P** -> Prepare (Pha chuẩn bị)
- **C** -> Commit (Pha xác nhận/commit)

2PC chia quá trình commit giao dịch thành 2 pha: **Pha chuẩn bị (Prepare)** và **Pha commit (Commit)**.

#### Pha chuẩn bị (Prepare)

Trọng tâm của pha Prepare là "hỏi thăm" các bên tham gia giao dịch xem việc thực thi thao tác giao dịch database cục bộ có thành công hay không.

Quy trình hoạt động của pha Prepare:

1. **Bộ điều phối/quản lý giao dịch (gọi tắt là TM)** gửi thông điệp hỏi toàn bộ **các bên tham gia giao dịch (gọi tắt là RM)**: "Các bạn có thể thực thi thao tác giao dịch không?" và chờ phản hồi.
2. Sau khi nhận thông điệp, mỗi **RM** bắt đầu thực thi các tiền thao tác của giao dịch database cục bộ như ghi redo log / undo log, **nhưng lúc này chưa commit giao dịch**.
3. Nếu **RM** thực thi thao tác giao dịch cục bộ thành công thì trả lời "Yes" (đã sẵn sàng), ngược lại trả lời "No" (chưa sẵn sàng).

#### Pha Commit (Commit)

Trọng tâm của pha Commit là chỉ thị các bên tham gia thực hiện commit hoặc rollback giao dịch cục bộ và xác nhận hoàn tất.

Khi tất cả các bên tham gia đều ở trạng thái "Sẵn sàng":

1. **TM** gửi thông điệp tới mọi bên tham gia: "Các bạn có thể commit giao dịch rồi!" (**Thông điệp Commit**).
2. Khi nhận được **thông điệp Commit**, mỗi **RM** tiến hành **commit giao dịch database cục bộ**, sau khi hoàn tất thì **giải phóng toàn bộ tài nguyên đã chiếm giữ trong suốt thời gian giao dịch**.
3. **RM** phản hồi: "Giao dịch đã commit" (**Thông điệp ACK**).
4. Sau khi **TM** nhận đủ **thông điệp ACK** từ tất cả **bên tham gia**, toàn bộ quy trình giao dịch phân tán chính thức kết thúc.

![Sơ đồ 2PC - Sẵn sàng](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-2pc-ready-07738422.png)

Khi có bất kỳ bên tham gia nào ở trạng thái "Chưa sẵn sàng":

1. **TM** gửi thông điệp tới mọi bên tham gia: "Hãy thực hiện rollback ngay!" (**Thông điệp Rollback**).
2. Khi nhận được **thông điệp Rollback**, mỗi **RM** thực hiện **rollback giao dịch database cục bộ**, sau đó **giải phóng toàn bộ tài nguyên đã chiếm giữ trong thời gian giao dịch**.
3. **RM** phản hồi: "Giao dịch đã rollback" (**Thông điệp ACK**).
4. Sau khi **TM** nhận đủ **thông điệp ACK** từ tất cả **RM**, giao dịch bị ngắt hủy.

![Sơ đồ 2PC - Chưa sẵn sàng](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-2pc-not-ready-f0c0e7d6.png)

#### Tóm tắt

Điểm lại ngắn gọn các ý cốt lõi trong hai pha của **2PC**:

1. Mục đích chính của **pha Prepare** là kiểm tra xem từng **RM** có thể thực thi **giao dịch database cục bộ** hay không (!!! Lưu ý: bước này hoàn toàn chưa commit giao dịch).
2. Trong **pha Commit**, **TM** căn cứ vào phản hồi của các **RM** ở **pha Prepare** để quyết định thực thi commit hay rollback.
3. Sau **pha Commit**, giao dịch phân tán hiện tại chắc chắn sẽ kết thúc.

**Ưu điểm của 2PC:**

- Mô hình lý thuyết đơn giản, dễ hiểu và dễ cài đặt.
- Các cơ sở dữ liệu phổ biến (như MySQL InnoDB, Oracle, PostgreSQL) đều hỗ trợ chuẩn XA, có thể đóng vai trò RM trong 2PC để TM bên ngoài điều phối commit hoặc rollback.

**Đánh đổi của 2PC:**

- Mục tiêu thiết kế của 2PC là tính nhất quán mạnh của dữ liệu. Nhưng trong triển khai kỹ thuật thực tế, do các tình huống cực đoan như phân mảnh mạng, TM sập hay RM timeout, vẫn có thể xảy ra bất nhất dữ liệu hoặc kẹt giao dịch kéo dài — không nên hiểu nhầm rằng 2PC "mặc nhiên đảm bảo nhất quán mạnh tuyệt đối".

**Nhược điểm tồn tại của 2PC:**

- **Chặn đồng bộ (Synchronous Blocking)**: Các bên tham gia giao dịch sẽ giữ chặt tài nguyên liên quan cho đến khi giao dịch thực sự được commit. Ví dụ khi Tiểu Minh đang chuyển khoản cho Tiểu Hồng, nếu có giao dịch khác muốn thao tác lên Tiểu Minh hoặc Tiểu Hồng thì đều phải chờ (block).
- **Mất nhất quán dữ liệu**: Lỗi mạng hoặc TM sập vẫn có thể gây ra tình trạng dữ liệu không đồng nhất. Ví dụ ở pha 2 (Commit), nếu một phần mạng trục trặc khiến vài bên tham gia không nhận được thông điệp Commit/Rollback thì dữ liệu sẽ bị lệch nhau.
- **Điểm lỗi đơn lẻ (Single Point of Failure)**: TM đóng vai trò cực kỳ trọng yếu; nếu TM sập ngay sau khi hoàn tất pha Prepare, các bên tham gia sẽ bị kẹt mãi ở pha Commit.

### Mô hình XA

XA có thể xem là bước chuẩn hóa đưa 2PC xuống tầng tài nguyên như cơ sở dữ liệu. 2PC là giao thức commit, còn XA là bộ đặc tả giao diện DTP do X/Open định nghĩa, quy định cách TM điều phối nhiều RM tham gia vào cùng một giao dịch toàn cục.

Quy trình điển hình gồm:

1. AP khởi tạo giao dịch toàn cục, TM tạo ngữ cảnh giao dịch toàn cục (Global Transaction Context).
2. Từng RM (ví dụ các database khác nhau) thực thi giao dịch cục bộ nhưng chưa commit thực sự.
3. TM gọi `prepare` trên các RM; nếu toàn bộ RM đều prepare thành công thì gọi `commit`, ngược lại gọi `rollback`.

Ưu điểm của XA là ít xâm lấn nghiệp vụ — bản thân database chịu trách nhiệm cô lập và rollback, phù hợp với các giao dịch ngắn, đòi hỏi nhất quán mạnh và áp lực đồng thời không quá cao. Nhược điểm cũng rất rõ: tài nguyên database bị giữ khóa khá lâu trong suốt giao dịch, dễ ảnh hưởng tới hiệu năng và tính sẵn sàng.

Seata hỗ trợ chế độ XA từ phiên bản 1.2. Seata XA Mode tận dụng hỗ trợ giao thức XA sẵn có của database hoặc hệ thống nhắn tin để quản lý branch transaction; độ nhất quán tổng thể mạnh hơn, nhưng thông lượng thường thấp hơn các phương án mềm như AT / TCC / Saga.

### 3PC (Giao thức Commit Ba Pha — Three-Phase Commit)

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/3pc-work-flow-69cb4f53.png)

3PC là phiên bản tối ưu dựa trên 2PC. Nó tách **pha Prepare** của 2PC thành hai pha độc lập: `CanCommit` (chỉ hỏi xem có thể commit không, chưa thực thi tiền thao tác giao dịch) và `PreCommit` (thực thi tiền thao tác giao dịch, ghi redo/undo log). Cộng thêm pha `DoCommit` cuối cùng thành 3 pha:

1. `CanCommit` (Hỏi khả năng commit)
2. `PreCommit` (Thực thi tiền thao tác giao dịch)
3. `DoCommit` (Commit thực sự)

![Sơ đồ 3PC - Sẵn sàng](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-3pc-ready-05930c2d.png)

#### Pha chuẩn bị (`CanCommit`)

Ở pha `CanCommit`, RM chưa thực thi thao tác giao dịch nào; TM chỉ gửi **yêu cầu chuẩn bị** tới RM, đồng thời hỏi xem bên tham gia có thể thực thi giao dịch database cục bộ hay không. RM trả lời "Yes", "No" hoặc quá thời gian (timeout) không phản hồi.

#### Pha tiền commit (`PreCommit`)

Nếu ở pha `CanCommit` tất cả RM đều trả lời "Yes", TM sẽ gửi thông điệp **`PreCommit` (yêu cầu tiền commit)** tới toàn bộ RM; sau khi nhận được, RM thực thi các tiền thao tác giao dịch database cục bộ như ghi redo log / undo log.

Nếu ở pha `CanCommit` có bất kỳ RM nào trả lời "NO" hoặc bị timeout không phản hồi, TM sẽ gửi thông điệp **`Abort` (yêu cầu hủy)** tới toàn bộ RM, và RM hủy ngay giao dịch. Tổn thất lúc này với RM gần như bằng không vì bản chất RM chưa thực sự làm gì cả.

Nếu RM thực thi thành công các tiền thao tác giao dịch thì trả về "YES", ngược lại trả về "No" (cơ hội rút lui cuối cùng).

Ở pha `PreCommit`, cả TM và RM đều đưa vào cơ chế Timeout: nếu **bên tham gia** không nhận được thông điệp `PreCommit` từ TM, hoặc TM không nhận được trạng thái tiền thực thi từ bên tham gia sau thời gian chờ quy định, giao dịch sẽ tự động ngắt hủy — tránh tình trạng bị treo khóa tài nguyên.

#### Pha thực thi commit (`DoCommit`)

Pha **DoCommit** là bước tiến hành commit giao dịch thực sự.

Nếu ở pha `PreCommit` toàn bộ RM đều trả lời "YES", TM sẽ gửi thông điệp **`DoCommit` (yêu cầu commit giao dịch)** tới toàn bộ RM; RM nhận được sẽ commit giao dịch database cục bộ, hoàn tất xong thì giải phóng tài nguyên đã chiếm giữ và trả về "YES".

Nếu ở pha `PreCommit` có RM trả lời "NO" hoặc bị timeout không phản hồi, TM sẽ gửi thông điệp **`Abort` (yêu cầu hủy)** tới tất cả RM; RM thực hiện rollback giao dịch, giải phóng tài nguyên và chấm dứt giao dịch hiện tại.

Nếu RM quá thời gian thiết lập mà vẫn không nhận được thông điệp `DoCommit` từ TM, RM sẽ cho rằng TM có thể đã gặp sự cố và tự động tiến hành commit giao dịch luôn.

Chỉ cần ở pha `PreCommit` toàn bộ RM đều trả về `Yes`, thì khi bước sang pha thứ ba xác suất giao dịch thực thi thành công là rất cao.

Tuy nhiên cần đặc biệt lưu ý: **việc RM mặc định tự commit khi hết timeout chính là "con dao hai lưỡi" của 3PC**. Nó giảm nhẹ vấn đề trong 2PC khi TM sập khiến RM kẹt vĩnh viễn, nhưng lại sinh ra rủi ro mất nhất quán mới. Ví dụ TM vốn đã quyết định Abort, nhưng chỉ một phần RM nhận được thông điệp Abort, còn các RM khác vì hết timeout nên tự động commit — kết quả cùng một giao dịch lại rơi vào trạng thái "nơi commit, nơi rollback". Đây là nguyên nhân quan trọng khiến 3PC rất ít khi được ứng dụng thực tế.

#### Tóm tắt

**Ngoài việc tách pha Prepare của 2PC kỹ hơn, 3PC còn cải tiến thêm điều gì?**

3PC đưa vào **cơ chế Timeout** ở cả phía TM lẫn RM. Nếu TM không nhận được phản hồi từ RM trong khoảng thời gian quy định thì mặc định thất bại và hủy giao dịch; còn nếu RM đợi quá lâu không thấy chỉ thị tiếp theo từ TM, tùy vào pha hiện tại mà RM sẽ tự hủy hoặc tự commit để tránh khóa chết tài nguyên kéo dài.

Dẫu vậy, 3PC không giải quyết triệt để vấn đề chặn khóa của 2PC, mà còn kéo theo hiệu năng kém hơn và vẫn tiềm ẩn bất nhất dữ liệu. Vì thế 3PC ít được dùng trong thực tế. Hướng đi phổ biến hơn trong kỹ thuật là áp dụng các giao thức đồng thuận như Paxos / Raft (thường kết hợp mô hình Replicated State Machine) để giải quyết điểm lỗi đơn lẻ của bộ điều phối và tính nhất quán trạng thái, thay vì dùng trực tiếp 3PC.

### TCC (Giao dịch bù trừ — Compensating Transaction)

TCC là một trong những giải pháp giao dịch mềm khá phổ biến hiện nay. Chuyên gia cơ sở dữ liệu Pat Helland năm 2007 từng công bố bài báo [*Life beyond Distributed Transactions: an Apostate’s Opinion*](https://www.ics.uci.edu/~cs223/papers/cidr07p15.pdf) bàn về hướng tránh giao dịch phân tán truyền thống và chuyển sang bù trừ ở tầng nghiệp vụ — bạn nào quan tâm có thể tìm đọc bài báo này.

Nói ngắn gọn, TCC là viết tắt của 3 từ Try, Confirm, Cancel, chia thành ba pha:

1. **Pha Try (Thử thực thi)**: Kiểm tra điều kiện nghiệp vụ và giữ trước (reserve) các tài nguyên nghiệp vụ cần thiết.
2. **Pha Confirm (Xác nhận)**: Khi pha Try của tất cả bên tham gia đều thành công mới chạy Confirm; pha Confirm sẽ xử lý thực sự phần tài nguyên đã giữ chỗ ở bước Try. Ngược lại nếu có bước thất bại thì chạy Cancel.
3. **Pha Cancel (Hủy bỏ)**: Hủy thực thi, giải phóng toàn bộ tài nguyên nghiệp vụ đã giữ chỗ ở pha Try.

Mỗi pha đều do code nghiệp vụ kiểm soát, nhờ đó tránh được giao dịch kéo dài và việc giữ khóa lâu ở tầng database; nhưng cái giá phải trả là mức độ xâm lấn code nghiệp vụ lớn hơn — lập trình viên phải tự xử lý giữ chỗ tài nguyên, xác nhận, hủy bỏ, retry và bù trừ ngoại lệ.

Lấy ví dụ bài toán chuyển khoản:

1. **Pha Try**: Kiểm tra số dư tài khoản có đủ hay không và phong tỏa (giữ chỗ) số tiền chuyển khoản.
2. **Pha Confirm**: Nếu pha Try thành công, pha Confirm thực hiện trừ tiền và cộng tiền thực sự.
3. **Pha Cancel**: Giải phóng số tiền đã phong tỏa trong pha Try.

Thông thường khi dùng mô hình `TCC`, chúng ta cần tự cài đặt ba phương thức `try`, `confirm`, `cancel` để đạt được tính nhất quán cuối cùng.

Trong trường hợp bình thường, hệ thống thực thi `try` rồi `confirm`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-tcc-confirm-ce9bca30.png)

Nếu phát sinh ngoại lệ, hệ thống thực thi `try` rồi `cancel`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-tcc-cancel-ede00aff.png)

Nếu pha Try gặp vấn đề thì gọi Cancel. **Vậy nếu chính pha Confirm hoặc Cancel bị lỗi thì sao?**

TCC sẽ ghi nhận nhật ký giao dịch (Transaction Log) và lưu bền vững xuống một môi trường lưu trữ nào đó như file cục bộ, cơ sở dữ liệu quan hệ hoặc ZooKeeper. Nhật ký này chứa trạng thái thực thi của giao dịch, giúp xác định giao dịch đã commit thành công hay thất bại và thất bại ở bước nào. Nếu phát hiện lỗi xảy ra ở pha Confirm hoặc Cancel, hệ thống sẽ thực hiện retry để chạy lại logic Confirm hoặc Cancel. Số lần retry tối đa tùy thuộc vào từng framework; nếu vượt quá ngưỡng retry tối đa mà vẫn chưa thành công, thường sẽ bắn cảnh báo để con người can thiệp xử lý.

Nếu code không có lỗi logic đặc biệt, xác suất pha Confirm hoặc Cancel gặp sự cố nhìn chung tương đối thấp.

Khi triển khai TCC vào thực tế, có ba bài toán kỹ thuật kinh điển bắt buộc phải xử lý:

1. **Tính lũy đẳng (Idempotency)**: Confirm và Cancel có thể bị gọi lặp lại do timeout mạng hoặc TC thực hiện retry, nên phải đảm bảo chạy nhiều lần vẫn cho kết quả như một. Cách làm phổ biến là duy trì bảng trạng thái giao dịch trong database và kiểm tra trạng thái trước mỗi lần thực thi.
2. **Rollback rỗng (Empty Rollback)**: Yêu cầu Try chưa hề tới được RM do lỗi mạng, nhưng TM đã phát lệnh Cancel. Lúc này Cancel đối mặt với "một giao dịch chưa từng chạy Try" — cần nhận diện được và trả về thành công ngay, tránh chạy nhầm logic hoàn tác.
3. **Treo tài nguyên (Suspension)**: Cancel tới RM trước cả Try, rồi sau đó yêu cầu Try bị trễ mới tới nơi. Nếu Try cứ tiếp tục giữ chỗ tài nguyên thì phần tài nguyên đó có thể mãi mãi chẳng bao giờ được Confirm hay Cancel nữa. Hướng giải quyết là trong Try phải kiểm tra xem giao dịch này đã bị Cancel trước đó hay chưa; nếu đã Cancel thì từ chối chạy Try.

**Nhật ký giao dịch có được xóa đi không?** Có. Nếu giao dịch commit thành công (không ném ngoại lệ nào), có thể xóa nhật ký giao dịch tương ứng để tiết kiệm tài nguyên.

**Mô hình TCC không phụ thuộc vào hỗ trợ transaction của tầng lưu trữ dữ liệu bên dưới, nhưng đòi hỏi chúng ta phải viết tay nhiều code hơn**, thuộc nhóm giải pháp phân tán **xâm lấn code nghiệp vụ**.

Tư tưởng của mô hình TCC khá giống với 2PC; mình có vẽ một hình đơn giản để so sánh hai cách tiếp cận này.

![So sánh 2PC và TCC](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/2pc-vs-tcc-842c0135.png)

**TCC và 2PC/3PC khác nhau ở điểm nào?**

- 2PC/3PC dựa vào transaction ở tầng cơ sở dữ liệu hoặc tài nguyên lưu trữ, còn TCC chủ yếu cài đặt bằng cách chỉnh sửa code nghiệp vụ.
- 2PC/3PC không xâm lấn code nghiệp vụ, còn TCC xâm lấn code nghiệp vụ.
- 2PC/3PC theo đuổi nhất quán mạnh, trong suốt quá trình commit hai pha sẽ luôn giữ khóa database. TCC theo đuổi nhất quán cuối cùng và không giữ khóa lâu dài trên các tài nguyên nghiệp vụ.

Đối với việc cài đặt TCC, trong giới mã nguồn mở có một số framework khá tốt. Cách cài đặt chi tiết giữa các framework có thể hơi khác nhau nhưng tư tưởng chung đều tương đồng:

1. **[ByteTCC](https://github.com/liuyangming/ByteTCC)**: Bộ quản lý giao dịch phân tán dựa trên cơ chế Try-Confirm-Cancel (TCC). Đọc thêm: [Một số suy nghĩ về cách cài đặt một framework giao dịch phân tán TCC (tiếng Trung)](https://www.bytesoft.org/how-to-impl-tcc/)
2. **[Seata](https://seata.apache.org/zh-cn/)**: Giải pháp giao dịch phân tán mã nguồn mở hỗ trợ đồng thời 4 chế độ AT, TCC, Saga và XA. Ở đây đang nhắc tới chế độ TCC của Seata.
3. **[Hmily](https://gitee.com/dromara/hmily)**: Giải pháp giao dịch phân tán cấp độ tài chính. Khi chọn lựa cho dự án mới nên đánh giá song song mức độ sôi động của cộng đồng và các phương án thay thế như Seata.

### Mô hình AT (Bù trừ tự động — Automatic Compensation)

AT (Automatic Transaction) là một trong những chế độ cốt lõi của Seata, hướng tới việc đạt được tính nhất quán cuối cùng trong khi sửa đổi code nghiệp vụ ít nhất có thể. Bạn có thể hiểu đây là phương án "bù trừ tự động": nghiệp vụ vẫn commit theo local transaction bình thường, nhưng framework sẽ tự ghi lại thông tin cần thiết phục vụ rollback.

Mô hình AT chia thành hai pha chính:

1. **Pha 1**: SQL nghiệp vụ chạy bình thường và commit local transaction; đồng thời DataSource proxy của Seata phân tích SQL, ghi lại before-image / after-image của dữ liệu vào bảng `undo_log` và đăng ký branch transaction với TC.
2. **Pha 2 Commit**: Nếu global transaction commit, TC thông báo cho RM xóa bất đồng bộ bản ghi `undo_log`.
3. **Pha 2 Rollback**: Nếu global transaction rollback, RM căn cứ vào `undo_log` để sinh câu SQL bù trừ ngược nhằm khôi phục dữ liệu về trạng thái before-image.

Ưu điểm của mô hình AT là mức độ xâm lấn nghiệp vụ thấp, rất phù hợp cho các tác vụ CRUD thông thường trên cơ sở dữ liệu quan hệ; nhược điểm là có yêu cầu chặt chẽ đối với kiểu SQL hỗ trợ, khóa chính của bảng, Global Lock và mức cô lập — không phù hợp với các câu SQL quá phức tạp hoặc giao dịch xuyên qua tài nguyên phi quan hệ.

### TCC vs Saga

| Tiêu chí             | TCC                                                     | Saga                                                               |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| Xử lý tài nguyên     | Giữ chỗ hoặc phong tỏa tài nguyên ở pha Try             | Mỗi bước thực thi và commit thẳng local transaction                |
| Tính cô lập          | Đạt mức "giả cô lập" nhờ giữ chỗ ở tầng nghiệp vụ       | Cô lập yếu; kết quả đã commit có thể bị giao dịch khác nhìn thấy   |
| Mức xâm lấn nghiệp vụ | Cao, cần viết đủ 3 bộ logic Try/Confirm/Cancel         | Cao, mỗi bước đều cần thao tác xuôi và thao tác bù trừ             |
| Độ dài giao dịch phù hợp | Phù hợp hơn với chuỗi ngắn, tài nguyên giữ chỗ rõ ràng | Phù hợp hơn với chuỗi dài, quy trình nhiều bước                 |
| Kịch bản điển hình   | Chuyển khoản, giữ tồn kho, khóa voucher                 | Hoàn tất đơn hàng, đặt vé/du lịch, luồng phê duyệt                 |

### Giao dịch qua MQ (MQ Transaction)

RocketMQ, Kafka, Pulsar và QMQ đều cung cấp các tính năng hỗ trợ giao dịch. Transaction cho phép ứng dụng xử lý luồng sự kiện gom toàn bộ quá trình tiêu thụ, xử lý và phát hành message thành một thao tác nguyên tử.

Ở đây ta lấy RocketMQ làm ví dụ (Nguồn hình: Khóa học *Cao thủ Message Queue*). Đọc thêm: [Tài liệu tham khảo RocketMQ Transactional Message](https://rocketmq.apache.org/docs/featureBehavior/04transactionmessage/).

![](/media/jg/ext/img-blog.csdnimg.cn/2021060810404597-553c5fca.png)

1. Bên gửi MQ (ví dụ dịch vụ Logistics) mở một transaction trên Message Queue và gửi một "Half Message" (tin nhắn bán phần / tin nhắn nháp) tới MQ Server/Broker. Trước khi transaction commit, Half Message này hoàn toàn vô hình đối với bên nhận/consumer (ví dụ dịch vụ thông báo bên thứ ba).
2. Nếu gửi Half Message thành công, bên gửi MQ bắt đầu thực thi local transaction của mình.
3. Nếu local transaction thực thi thành công, Half Message chuyển thành message bình thường để consumer tiêu thụ; nếu local transaction thất bại, Half Message sẽ bị rollback trực tiếp.

Qua quy trình trên có thể thấy Transactional Message của RocketMQ đã mượn tư tưởng của 2PC: gửi trước một Half Message chưa hiển thị cho consumer, đợi local transaction chạy thành công rồi mới commit Half Message thành message chính thức để tiêu thụ. Lưu ý đây không phải 2PC theo ngữ nghĩa XA truyền thống, mà là một cơ chế chuyên biệt của MQ nhằm đảm bảo tính nhất quán cuối cùng giữa "kết quả local transaction" và "khả năng hiển thị của message".

**Nếu bên gửi MQ gặp lỗi đúng lúc đang commit hoặc rollback Transactional Message thì sao?**

Broker của RocketMQ sẽ định kỳ truy vấn ngược (check-back) về phía bên gửi MQ để kiểm tra tình trạng thực thi của local transaction, rồi căn cứ kết quả truy vấn ngược để quyết định commit hay rollback message này.

Cơ chế truy vấn ngược dựa vào interface tương ứng do code nghiệp vụ tự cài đặt — ví dụ muốn kiểm tra local transaction tạo thông tin vận đơn đã chạy xong chưa thì chỉ việc truy vấn database xem bản ghi vận đơn đó đã tồn tại hay chưa.

![](/media/jg/ext/img-blog.csdnimg.cn/20210608114710962-a730f743.png)

**Nếu message chính thức không được tiêu thụ thành công thì sao?**

Khi tiêu thụ message thất bại, RocketMQ sẽ tự động thử tiêu thụ lại (retry). Nếu vượt quá số lần retry tối đa mà message vẫn chưa được xử lý thành công, RocketMQ sẽ coi message này có vấn đề và đẩy nó vào **Dead-Letter Queue (Hàng đợi thư chết)**.

![](/media/jg/ext/img-blog.csdnimg.cn/20210608120207740-c347cecf.png)

Các message rơi vào Dead-Letter Queue thường cần con người kiểm tra và xử lý thủ công.

Còn Transactional Message của **QMQ** thì không cài đặt phức tạp như RocketMQ mà tận dụng ngay tính năng transaction sẵn có của database. Tư tưởng cốt lõi chính là mô hình **Local Message Table (Bảng tin cục bộ)** do eBay đề xuất — chia nhỏ giao dịch phân tán về thành local transaction.

Ta duy trì một bảng tin cục bộ để lưu trạng thái gửi message; thao tác ghi trạng thái gửi tin vào bảng này và thao tác nghiệp vụ chính được đặt trong cùng một database transaction để commit chung. Như vậy nghiệp vụ chạy thành công đồng nghĩa bảng tin cũng ghi thành công.

Sau đó ta chạy một Thread riêng định kỳ quét bảng tin, lấy các message chưa xử lý gửi sang Message Broker.

Khi gửi thành công thì cập nhật trạng thái message là thành công hoặc xóa bản ghi đó đi.

Khác biệt cốt lõi giữa hai hướng nằm ở mức độ phụ thuộc vào tính sẵn sàng của MQ:

- **RocketMQ Transactional Message**: Bản thân local transaction không phụ thuộc Broker, nhưng trước khi chạy local transaction cần gửi thành công Half Message. Khi Broker không khả dụng, bước gửi Half Message bị lỗi và tầng ứng dụng phải quyết định fail-fast, retry hay giáng cấp sang luồng bù trừ khác — không thể đơn giản hóa thành "cả ứng dụng chết theo".
- **QMQ / Local Message Table**: Message được ghi vào database cục bộ của bên gửi và nằm chung một local transaction với thao tác nghiệp vụ. Việc MQ gián đoạn tạm thời không làm kẹt transaction nghiệp vụ; phần gửi tin sẽ do Thread độc lập tiếp tục chuyển đi sau đó.

Vì vậy, giải pháp Local Message Table chịu đựng tình trạng MQ chập chờn tạm thời tốt hơn, nhưng đổi lại phía nghiệp vụ phải tự duy trì bảng tin, Thread đẩy tin, chiến lược retry, xử lý tiêu thụ lũy đẳng và cơ chế đối soát. QMQ chỉ đơn giản đóng gói trọn bộ mô hình Local Message Table này để dùng ngay.

Đọc thêm: [Phỏng vấn: Nhược điểm của RocketMQ Distributed Transactional Message là gì? (tiếng Trung)](https://mp.weixin.qq.com/s/cBx1l1zaThN6_808fMl27g)

### Saga

Saga có lịch sử cực kỳ lâu đời — lý thuyết giao dịch Saga đã được Hector & Kenneth đề xuất từ năm 1987 trong bài báo trên ACM [*Sagas*](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf), thậm chí còn ra đời sớm hơn cả khái niệm giao dịch phân tán hiện đại.

Saga là giải pháp cho giao dịch kéo dài (Long-lived Transaction), với tư tưởng cốt lõi là tách một giao dịch dài thành chuỗi nhiều giao dịch ngắn cục bộ nối tiếp nhau.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/distributed-transaction/distributed-transaction-saga-591e5230.png)

- Giao dịch dài —> `T1, T2 ~ Tn` các giao dịch ngắn cục bộ
- Mỗi giao dịch ngắn đi kèm một hành động bù trừ —> `C1, C2 ~ Cn`

Hình minh họa dưới đây lấy từ [Tài liệu kỹ thuật Microsoft — Giao dịch phân tán Saga](https://docs.microsoft.com/zh-cn/azure/architecture/reference-architectures/saga/saga).

![](/media/jg/ext/img-blog.csdnimg.cn/20210611101344496-05eaefc9.png)

Nếu tất cả các giao dịch ngắn `T1, T2 ~ Tn` hoàn tất trơn tru thì toàn bộ giao dịch kết thúc thành công; ngược lại, hệ thống sẽ kích hoạt chế độ khôi phục.

**Khôi phục ngược (Backward Recovery):**

- Giới thiệu: Nếu giao dịch ngắn `Ti` commit thất bại, hệ thống thực hiện bù trừ toàn bộ các giao dịch đã hoàn thành trước đó theo chiều ngược lại (chạy `Ci` để bù trừ cho `Ti`, lùi dần về đầu).
- Thứ tự thực thi: `T1, T2, ……, Ti (thất bại), Ci (bù trừ), ……, C2, C1`.

**Khôi phục xuôi (Forward Recovery):**

- Giới thiệu: Nếu giao dịch ngắn `Ti` commit thất bại, hệ thống liên tục retry `Ti` cho đến khi thành công rồi đi tiếp.
- Thứ tự thực thi: `T1, T2, ……, Ti (thất bại), Ti (retry) ……, Ti+1, ……, Tn`.

Tương tự TCC, cả thao tác xuôi và thao tác bù trừ trong Saga đều do lập trình viên nghiệp vụ tự viết, nên cũng thuộc nhóm giải pháp phân tán **xâm lấn code nghiệp vụ**. Điểm khác biệt lớn với TCC là Saga không có bước "Try" — mỗi local transaction `Ti` được commit thẳng luôn, nhờ vậy hiệu năng rất cao!

Bản thân thao tác bù trừ cũng là code nghiệp vụ nên vẫn có thể lỗi do mạng, dịch vụ ngoài sập hoặc quy tắc nghiệp vụ thay đổi. Các framework Saga thường xử lý lỗi bù trừ theo chiến lược "liên tục retry + giới hạn số lần retry tối đa + con người can thiệp", do đó hành động bù trừ bắt buộc phải thiết kế mang tính lũy đẳng (idempotent). Để tăng khả năng chịu lỗi (ví dụ chính hệ thống điều phối Saga cũng có thể bị crash) và đảm bảo mọi giao dịch ngắn đều được commit hoặc bù trừ trọn vẹn, ta còn phải ghi lại nhật ký các thao tác này (Saga Log, tương tự log của database). Nhờ vậy khi hệ thống Saga khởi động phục hồi, nó biết chính xác quy trình đã chạy tới giao dịch ngắn nào hay bước bù trừ nào.

Ngoài ra, vì Saga không có bước "Try" để giữ chỗ tài nguyên trước nên không thể đảm bảo tính cô lập (Isolation) — đây là một nhược điểm khá lớn của Saga.

Đối với việc triển khai Saga, hiện có một số framework mã nguồn mở đáng chú ý. Chi tiết cài đặt có thể hơi khác nhau nhưng tư tưởng cốt lõi đều giống nhau:

1. **[ServiceComb Pack](https://github.com/apache/servicecomb-pack)**: Giải pháp nhất quán dữ liệu cuối cùng cho ứng dụng Microservices.
2. **[Seata](https://seata.apache.org/zh-cn/)**: Giải pháp giao dịch phân tán mã nguồn mở, trong đó Saga là một trong các chế độ được hỗ trợ.

### Thông báo nỗ lực tối đa (Best-Effort Notification)

Best-Effort Notification là giải pháp nhất quán cuối cùng gọn nhẹ hơn, thường gặp ở các kịch bản callback thanh toán, thông báo trạng thái vận chuyển, phát điểm thưởng, v.v.

Tư tưởng rất đơn giản: bên khởi tạo sau khi hoàn tất local transaction sẽ cố gắng hết sức thông báo kết quả cho bên nhận. Nếu gửi thông báo thất bại, hệ thống tiếp tục retry theo chu kỳ cố định hoặc giãn cách lũy thừa (Exponential Backoff); API phía bên nhận bắt buộc phải đảm bảo tính lũy đẳng (Idempotency). Khi vượt quá số lần retry tối đa, trường hợp lỗi thường được chuyển sang xử lý thủ công hoặc chạy đối soát bù trừ.

Best-Effort Notification có thể xem là biến thể tinh giản của mô hình Local Message Table: có thể không cần dựng MQ mà để bên khởi tạo tự gọi retry thẳng vào API bên nhận; nhưng độ tin cậy và khả năng cắt đỉnh tải (Peak Shaving) thường không bằng bộ giải pháp đầy đủ "Local Message Table + MQ + Consumer lũy đẳng".

## Giới thiệu tổng quan giải pháp trọn gói Seata

Seata là giải pháp giao dịch phân tán một cửa khá phổ biến, gồm các vai trò cốt lõi sau:

- **TC (Transaction Coordinator)**: Điều phối viên giao dịch, lưu giữ trạng thái Global Transaction và Branch Transaction.
- **TM (Transaction Manager)**: Trình quản lý giao dịch, định nghĩa ranh giới Global Transaction, chịu trách nhiệm mở, commit hoặc rollback Global Transaction.
- **RM (Resource Manager)**: Trình quản lý tài nguyên, quản lý tài nguyên của Branch Transaction, đăng ký Branch Transaction với TC và báo cáo trạng thái.

Seata hỗ trợ nhiều chế độ giao dịch:

| Chế độ | Xâm lấn nghiệp vụ | Mục tiêu nhất quán                  | Đặc điểm tiêu biểu                                       | Kịch bản phù hợp                                      |
| ------ | ----------------- | ----------------------------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| AT     | Thấp              | Nhất quán cuối cùng                 | Tự sinh `undo_log`, pha 2 tự động bù trừ                 | CRUD cơ sở dữ liệu quan hệ thông thường               |
| TCC    | Cao               | Nhất quán cuối cùng / ràng buộc nghiệp vụ chặt | Nghiệp vụ tự cài đặt Try/Confirm/Cancel     | Giao dịch chuỗi ngắn cần giữ chỗ tài nguyên           |
| Saga   | Cao               | Nhất quán cuối cùng                 | Tách giao dịch dài thành local transaction + bù trừ      | Quy trình dài, điều phối nhiều service                |
| XA     | Thấp              | Thiên về nhất quán mạnh             | Phụ thuộc năng lực XA của database, giữ khóa tài nguyên lâu | Giao dịch ngắn, nhất quán mạnh, mức đồng thời thấp |

Vì thế, không nên gắn nhãn đơn giản Seata chỉ là framework TCC hay Saga. Khi chọn giải pháp thực tế, cần dựa vào mức độ chấp nhận xâm lấn nghiệp vụ, khả năng hỗ trợ của database, độ dài chuỗi gọi, yêu cầu hiệu năng và mức độ nhất quán để chọn chế độ phù hợp trong AT / TCC / Saga / XA.

## Bài viết tham khảo hay

Để các bạn tiện tìm hiểu sâu thêm, dưới đây là một số bài viết chất lượng (tiếng Trung) được chọn lọc để tham khảo:

> **[Phân tích chuyên sâu Giao dịch phân tán Saga (tiếng Trung)](https://segmentfault.com/a/1190000041001954)**
>
> **[Bảy giải pháp kinh điển nhất cho Giao dịch phân tán (tiếng Trung)](https://segmentfault.com/a/1190000040321750)**
>
> **[Những cái bẫy thường gặp khi dùng Giao dịch phân tán và cách dùng đúng chuẩn (tiếng Trung)](https://segmentfault.com/a/1190000041031586)**
>
> Ye Dongfu 👍👍👍👍👍

Viết rất hay, tổng kết các giải pháp cực kỳ đầy đủ và sâu sắc.

> [So sánh 7 giải pháp Giao dịch phân tán — Vẫn ưng Seata mã nguồn mở của Alibaba nhất! (Nguyên lý + Thực chiến) (tiếng Trung)](https://mp.weixin.qq.com/s/sXVSFqq2UZ6Pwwt7vx7vIA)
>
> Ma Yuan Tech Column 🗓️2021-10-25 👍👍👍👍👍

Giới thiệu một số giải pháp giao dịch phân tán chủ đạo hiện nay cùng giải pháp trọn gói mã nguồn mở Seata của Alibaba.

Bài viết không chỉ trình bày lý thuyết mà còn thực hành trực tiếp chế độ AT của Seata.

> **[Thực tiễn Giao dịch phân tán Seata và phân tích mã nguồn mở | Kỷ yếu GIAC (tiếng Trung)](https://www.sofastack.tech/blog/seata-distributed-transaction-deep-dive/)**
>
> Zhang Sen 🗓️2019-07-02 👍👍👍👍👍

Đây là bài chia sẻ tại hội nghị kiến trúc Internet toàn cầu GIAC của Zhang Sen (biệt danh: Shaohui) — chuyên gia kỹ thuật Ant Financial và là một trong những người sáng lập Seata. Bài viết trình bày chi tiết nguyên nhân nảy sinh bài toán giao dịch phân tán và cách Ant Financial xử lý (4 chế độ AT, TCC, Saga và XA của Seata).

Trong bài có rất nhiều hình minh họa sinh động giúp dễ hiểu! Thực sự là một bài viết xuất sắc!

> **[14.000 chữ, 25 hình minh họa giúp bạn làm chủ hoàn toàn nguyên lý Giao dịch phân tán (tiếng Trung)](https://mp.weixin.qq.com/s/qeUfEJFYCfyDjgzDnq_Jdw)**
>
> Ma Hai 🗓️2020-10-30 👍👍👍👍👍

Chủ yếu giới thiệu transaction đơn nguồn dữ liệu & đa nguồn dữ liệu, các giải pháp giao dịch phân tán phổ biến và cách cài đặt chế độ AT trong Seata.

> **[6 hình minh họa giúp bạn hiểu thấu đáo chế độ XA của Giao dịch phân tán (tiếng Trung)](https://mp.weixin.qq.com/s/Rp8paKc2bQhERBGDKtpMcA)**
>
> Zhu Jinjun 🗓️2021-04-25 👍👍👍

Một bài viết của nhóm Alibaba Cloud Native chủ yếu giới thiệu chế độ XA cũng như cách Seata triển khai và tối ưu chế độ XA. Phần trình bày hơi khái quát, nên kết hợp đọc thêm các bài liên quan để hiểu sâu hơn.

## Các dự án mã nguồn mở về Giao dịch phân tán

1. **[Seata](https://seata.apache.org/zh-cn/)**: Giải pháp giao dịch phân tán mã nguồn mở hỗ trợ các chế độ AT, TCC, Saga, XA, hướng tới cung cấp dịch vụ giao dịch phân tán hiệu năng cao và dễ sử dụng trong kiến trúc Microservices.
2. **[Hmily](https://gitee.com/dromara/hmily)**: Giải pháp giao dịch phân tán mềm hiệu năng cao, chuẩn tài chính, chủ yếu cung cấp các phương án TCC và TAC (tự động sinh SQL rollback). Khi chọn cho dự án mới nên theo dõi mức độ sôi động cộng đồng và cân nhắc cùng Seata, DTM.
3. **[Raincat](https://gitee.com/dromara/Raincat)**: Middleware giao dịch phân tán theo mô hình 2PC.
4. **[Myth](https://gitee.com/dromara/myth)**: Framework mã nguồn mở giải quyết giao dịch phân tán bằng Message Queue, phát triển bằng Java (JDK 1.8), hỗ trợ các RPC framework như Dubbo, Spring Cloud, Motan.

## Tài liệu tham khảo

- [Giao thức nhất quán của hệ thống phân tán: 2PC và 3PC - Matt - 2018 (tiếng Trung)](https://matt33.com/2018/07/08/distribute-system-consistency-protocol/)
- [Dealing Distributed Transactions with 2PC, 3PC, Local Transaction Table with MQs - Adrian - 2021](https://masteranyfield.com/2021/07/26/dealing-distributed-transactions-with-2pc-3pc-local-transaction-table-with-mqs/)
- [Làm sao hiểu việc 3PC giải quyết bài toán chặn (blocking) của 2PC? - Thảo luận Zhihu (tiếng Trung)](https://www.zhihu.com/question/422691164)
- [Tài liệu chính thức Apache Seata](https://seata.apache.org/docs/overview/what-is-seata/)
- [Chế độ Seata XA](https://seata.apache.org/zh-cn/docs/user/mode/xa)
- [Seata TCC Fence: Tính lũy đẳng, Rollback rỗng và Treo tài nguyên](https://seata.apache.org/blog/seata-tcc-fence)
- [Tài liệu chính thức RocketMQ Transactional Message](https://rocketmq.apache.org/docs/featureBehavior/04transactionmessage/)
