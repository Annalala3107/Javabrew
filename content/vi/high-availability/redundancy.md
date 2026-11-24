---
title: "Giải thích chi tiết về Thiết kế Dự phòng (Redundancy): RTO/RPO, High Availability Cluster, Same-City DR và Multi-Region Active-Active"
description: "Giải thích chi tiết thiết kế dự phòng (Redundancy): dự phòng phần cứng, dự phòng dịch vụ, dự phòng dữ liệu và dự phòng địa lý, bao quát RTO/RPO, High Availability Cluster, Active-Standby, Active-Active, khôi phục thảm họa cùng thành phố, khôi phục thảm họa liên vùng, đa hoạt động cùng thành phố, đa hoạt động liên vùng và cơ chế Failover."
category: Độ sẵn sàng cao
icon: "mdi:server-network-outline"
tag:
  - Thiết kế dự phòng (Redundancy)
  - Khôi phục thảm họa (Disaster Recovery)
lang: vi
sourceRef: zh-ref/high-availability/redundancy.md
head:
  - - meta
    - name: keywords
      content: thiết kế dự phòng,Redundancy,High Availability Cluster,RTO,RPO,dự phòng dịch vụ,dự phòng dữ liệu,kiến trúc khôi phục thảm họa,Same-City DR,Remote DR,Active-Active,Active-Standby,Failover
---

Dù là sự cố phần cứng, mất điện trung tâm dữ liệu hay một service đột ngột sập, điểm lỗi đơn (Single Point of Failure) luôn là mắt xích mong manh nhất trong hệ thống. Để hệ thống vẫn trụ vững trước đủ loại tình huống bất ngờ, cách cơ bản và hiệu quả nhất chính là **Dự phòng (Redundancy)** — chuẩn bị nhiều bản sao cho các tài nguyên trọng yếu để khi một bản sao hỏng vẫn có bản sao khác thay thế ngay.

Bài viết này sẽ hệ thống hóa lại các khái niệm cốt lõi và giải pháp phổ biến trong thiết kế dự phòng: từ hai chỉ số khôi phục thảm họa RTO/RPO, đến High Availability Cluster, khôi phục thảm họa cùng thành phố (Same-City DR), đa hoạt động liên vùng (Multi-Region Active-Active), rồi đến các giải pháp chuyển đổi dự phòng cụ thể như Redis Sentinel và Keepalived.

## Dự phòng (Redundancy) là gì?

**Dự phòng (Redundancy)** là biện pháp phổ biến giúp nâng cao tính sẵn sàng của hệ thống và độ bền vững của dữ liệu. Tư tưởng cốt lõi của nó là **triển khai nhiều bản sao giống nhau của cùng một tài nguyên; khi một tài nguyên gặp sự cố, các tài nguyên khác có thể tiếp quản công việc của nó, qua đó đảm bảo hệ thống hoạt động liên tục**.

Dự phòng là nền tảng để nâng cao tính sẵn sàng, nhưng bản thân có dự phòng chưa đồng nghĩa với tính sẵn sàng cao (High Availability). Chỉ khi kết hợp với phát hiện lỗi, điều hướng lưu lượng, sao chép dữ liệu, diễn tập khôi phục và giám sát cảnh báo thì mới thực sự giảm thiểu được ảnh hưởng của sự cố.

Thiết kế dự phòng có thể nhìn nhận qua các chiều sau:

![Các loại thiết kế dự phòng](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/redundancy-optimized-redundancy-types-5701d503.png)

| Loại dự phòng          | Mô tả                                              | Triển khai điển hình                                                              |
| ---------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Dự phòng phần cứng** | Triển khai nhiều bản sao cho thiết bị phần cứng trọng yếu | Nguồn kép, card mạng kép, RAID                                               |
| **Dự phòng phần mềm**  | Triển khai nhiều instance cho dịch vụ ứng dụng     | Triển khai cụm (Cluster), đa replica trên container                               |
| **Dự phòng dữ liệu**   | Lưu trữ nhiều bản sao dữ liệu                      | Sao chép Primary-Replica của database, đa bản sao trên lưu trữ phân tán           |
| **Dự phòng mạng**      | Dự phòng đường truyền và thiết bị mạng             | Kết nối đa nhà mạng (Multi-ISP), switch lõi kép, đường truyền kép, Load Balancer Active-Standby hoặc đa instance |
| **Dự phòng địa lý**    | Triển khai hệ thống tại các vị trí địa lý khác nhau | Same-city DR, Remote DR, Same-city Active-Active, Multi-region Active-Active      |

**Dự phòng dịch vụ (Service Redundancy)**: Triển khai từ hai instance trở lên cho cùng một dịch vụ; khi có lỗi sẽ tự động chuyển sang instance khỏe mạnh, giảm đáng kể thời gian gián đoạn và nâng cao tính sẵn sàng của hệ thống.

**Dự phòng dữ liệu (Data Redundancy)**: Lưu trữ nhiều bản sao của cùng một dữ liệu; nếu bất kỳ bản sao nào bị mất vẫn có thể khôi phục từ các bản sao khác, từ đó nâng cao độ bền và tính sẵn sàng của dữ liệu.

Thực tế, trong đời sống hàng ngày cũng có rất nhiều ví dụ về thiết kế dự phòng. Lấy chính tôi làm ví dụ: cách lưu giữ tài liệu quan trọng của tôi chính là ứng dụng tư duy dự phòng — các file quan trọng dùng hàng ngày tôi đều đồng bộ một bản lên GitHub và một bản lên cloud drive cá nhân, nhờ đó dù ổ cứng máy tính hỏng thì tôi vẫn có thể lấy lại dữ liệu từ GitHub hoặc cloud drive.

## Chỉ số cốt lõi của khôi phục thảm họa: RTO và RPO

Trước khi bàn về kiến trúc khôi phục thảm họa (Disaster Recovery), cần hiểu rõ hai chỉ số cốt lõi sau:

![RTO và RPO](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/redundancy-optimized-rto-rpo-timeline-a78b1bd9.png)

- **RPO (Recovery Point Objective — Mục tiêu điểm khôi phục)**: Khoảng thời gian mất dữ liệu tối đa có thể chấp nhận được sau khi thảm họa xảy ra, cũng có thể hiểu là khi khôi phục, dữ liệu tối đa được phép lùi về thời điểm cách đó bao lâu. RPO càng nhỏ thì yêu cầu đối với sao chép đồng bộ, sao chép log, tính nhất quán liên site và độ trễ ghi càng cao. `RPO = 0` thường đồng nghĩa với việc thao tác ghi chỉ được trả về thành công sau khi đã xác nhận tại nhiều miền lỗi (fault domain) hoặc có cơ chế commit nhất quán mạnh tương đương; cái giá phải trả là độ trễ ghi tăng lên và phải đánh đổi giữa tính sẵn sàng và tính nhất quán khi xảy ra phân vùng mạng (network partition).
- **RTO (Recovery Time Objective — Mục tiêu thời gian khôi phục)**: **Thời gian khôi phục tối đa** có thể chấp nhận được, tức tổng thời gian tính từ lúc sự cố xảy ra đến khi hệ thống phục hồi dịch vụ bình thường. `RTO = 0` nghĩa là về mặt mục tiêu không cho phép gián đoạn có thể cảm nhận được, nhưng trong hệ thống thực tế thường được diễn đạt là tiệm cận 0 hoặc chuyển đổi không gây gián đoạn cho người dùng — điều này vẫn phụ thuộc vào tốc độ phát hiện lỗi, chuyển đổi lưu lượng và hành vi Retry của client.

> **RTO/RPO là mục tiêu, không phải kết quả mặc định đạt được**. Chúng là ràng buộc của nghiệp vụ đối với năng lực khôi phục thảm họa; khả năng khôi phục thực tế phụ thuộc vào tốc độ phát hiện lỗi, mức độ tự động hóa chuyển đổi, độ trễ sao chép dữ liệu, quy trình thủ công và năng lực vận hành. Tuyên bố một mức RPO/RTO không đồng nghĩa môi trường production chắc chắn đạt được mức đó, mà phải kiểm chứng thông qua diễn tập định kỳ và kiểm thử tải. Ngoài ra, các luồng nghiệp vụ khác nhau có thể có yêu cầu RTO/RPO khác nhau, không nhất thiết đồng nhất toàn hệ thống.

Các mức RPO/RTO dưới đây là **tham chiếu theo bậc độ lớn** dưới cấu hình điển hình; kết quả thực tế phụ thuộc vào cơ chế sao chép (đồng bộ/bất đồng bộ), ngưỡng phát hiện lỗi, mức tự động hóa chuyển đổi và năng lực vận hành của đội ngũ. Mô hình đa hoạt động (Active-Active) có đạt được RTO/RPO ở mức giây hay không phụ thuộc vào điều hướng lưu lượng, sao chép dữ liệu, phát hiện lỗi, cơ chế Retry phía client, giải quyết xung đột và độ chín của quy trình diễn tập.

| Phương án kiến trúc          | RPO                           | RTO             | Chi phí   |
| ---------------------------- | ----------------------------- | --------------- | --------- |
| Đơn máy không sao lưu        | Có thể mất toàn bộ dữ liệu    | Không ước lượng được | Thấp  |
| Sao lưu cục bộ               | Phụ thuộc chu kỳ sao lưu      | Cấp giờ         | Thấp      |
| Khôi phục thảm họa cùng thành phố | Cấp giây ~ cấp phút      | Cấp phút ~ giờ  | Trung bình |
| Khôi phục thảm họa liên vùng | Cấp phút ~ cấp giờ            | Cấp giờ         | Trung bình - Cao |
| Đa hoạt động cùng thành phố  | Cấp giây                      | Cấp giây        | Cao       |
| Đa hoạt động liên vùng       | Cấp giây                      | Cấp giây        | Rất cao   |

## So sánh các phương án kiến trúc dự phòng

High Availability Cluster (cụm sẵn sàng cao), Same-City DR (khôi phục thảm họa cùng thành phố), Remote DR (khôi phục thảm họa liên vùng), Same-City Active-Active và Multi-Region Active-Active là những ứng dụng tiêu biểu nhất của tư duy dự phòng trong thiết kế hệ thống sẵn sàng cao.

![So sánh kiến trúc khôi phục thảm họa](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/redundancy-optimized-disaster-recovery-compariso-fd419394.png)

### High Availability Cluster (Cụm sẵn sàng cao)

**High Availability Cluster (HA Cluster)** là việc triển khai hai hoặc nhiều instance của cùng một dịch vụ; nếu instance đang phục vụ đột ngột sập, lưu lượng có thể chuyển sang một máy khác để đảm bảo tính sẵn sàng cao của dịch vụ.

HA Cluster có hai chế độ phổ biến:

![Chế độ Active-Standby và Active-Active](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/redundancy-optimized-ha-cluster-modes-ef6854b0.png)

| Chế độ                         | Mô tả                                               | Ưu điểm                                                 | Nhược điểm                                                                          |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Active-Standby (Chủ - Dự phòng)** | Node chính phục vụ, node dự phòng ở trạng thái chờ | Triển khai đơn giản, đường ghi một node chính dễ kiểm soát | Hiệu suất sử dụng tài nguyên thấp, node dự phòng nhàn rỗi                       |
| **Active-Active (Chủ - Chủ)**  | Nhiều node đồng thời cung cấp dịch vụ               | Tận dụng tài nguyên cao, không có điểm lỗi đơn          | Xung đột ghi phải xử lý ở tầng ứng dụng; ID tự tăng, ràng buộc duy nhất có thể xung đột |

Chế độ Active-Standby thường dễ kiểm soát luồng ghi hơn: nếu dùng sao chép đồng bộ thì tính nhất quán tốt hơn nhưng độ trễ ghi cao hơn; nếu dùng sao chép bất đồng bộ thì khi chuyển đổi có nguy cơ mất dữ liệu chưa kịp sao chép. HA Cluster thuần túy là dự phòng ở cấp dịch vụ, **chưa nhấn mạnh yếu tố phân tách địa lý**. Các mô hình Same-City DR, Remote DR, Same-City Active-Active và Multi-Region Active-Active mới giải quyết dự phòng theo vị trí địa lý.

### Khôi phục thảm họa cùng thành phố (Same-City Disaster Recovery)

**Same-City Disaster Recovery** không phải là triển khai dự phòng đơn giản trong cùng một phòng máy, mà là đặt dịch vụ chính và dịch vụ dự phòng tại **các trung tâm dữ liệu (data center) khác nhau trong cùng một thành phố**. Thông thường, site chính và site dự phòng nằm ở hai data center khác nhau cùng thành phố theo mô hình active/passive: site chính xử lý lưu lượng production, site dự phòng bình thường không gánh tải hoặc chỉ chạy lượng nhỏ lưu lượng kiểm chứng và sẽ tiếp quản khi xảy ra sự cố. Việc chọn cold standby, warm standby hay hot standby phụ thuộc vào chi phí và yêu cầu RTO.

Cách này giúp tránh tình trạng mất điện, hỏa hoạn ở một phòng máy khiến toàn bộ dịch vụ ngừng hoạt động.

- **Kịch bản phù hợp**: Doanh nghiệp yêu cầu RTO khá cao (cấp phút) với ngân sách hạn chế.
- **Cấu hình điển hình**: Không có tiêu chuẩn cố định về khoảng cách hay độ trễ giữa hai phòng máy cùng thành phố; thường đánh giá dựa trên độ trễ đường truyền thuê riêng (RTT), mức độ cô lập miền lỗi, cũng như tính độc lập của nguồn điện và đường truyền nhà mạng. Việc có chấp nhận được sao chép đồng bộ hay không phụ thuộc vào RTT thực tế và ngân sách độ trễ ghi.

### Khôi phục thảm họa liên vùng (Remote Disaster Recovery)

**Remote Disaster Recovery** tương tự như Same-City DR, điểm khác biệt là dịch vụ giống nhau được triển khai ở **các phòng máy thuộc vùng địa lý khác nhau (thường cách xa nhau, thậm chí ở các thành phố hoặc quốc gia khác nhau)**.

- **Kịch bản phù hợp**: Hệ thống nghiệp vụ cốt lõi cần phòng ngừa thảm họa quy mô khu vực (động đất, lũ lụt).
- **Thách thức**: Độ trễ mạng lớn, đồng bộ dữ liệu thường dùng phương thức bất đồng bộ nên có nguy cơ mất dữ liệu.

### Đa hoạt động cùng thành phố (Same-City Active-Active)

**Same-City Active-Active** tương tự Same-City DR nhưng không còn phân biệt thuần túy chính/phụ: nhiều trung tâm dữ liệu trong cùng thành phố đều có thể xử lý lưu lượng production, qua đó tận dụng tối đa tài nguyên hệ thống và nâng cao khả năng xử lý đồng thời.

- **Kịch bản phù hợp**: Hệ thống đòi hỏi cao cả về hiệu năng lẫn tính sẵn sàng.
- **Điểm kỹ thuật trọng tâm**: Cần giải quyết bài toán đồng bộ dữ liệu, điều phối lưu lượng và quản lý session.

### Đa hoạt động liên vùng (Multi-Region Active-Active)

**Multi-Region Active-Active** triển khai dịch vụ tại **các trung tâm dữ liệu ở nhiều vùng địa lý khác nhau** và tất cả đều **đồng thời cung cấp dịch vụ ra bên ngoài**.

So với mô hình khôi phục thảm họa truyền thống, thay đổi rõ rệt nhất của Same-City Active-Active và Multi-Region Active-Active nằm ở chữ **"Active-Active"** — mọi site đều phục vụ trực tiếp người dùng cùng một lúc. Multi-Region Active-Active nhằm ứng phó các sự cố bất ngờ như hỏa hoạn, động đất hay thiên tai/nhân tai khác, cũng như đứt mạng diện rộng theo khu vực, sự cố toàn data center hoặc yêu cầu tuân thủ pháp lý (compliance).

Điểm khác biệt chính giữa "cùng thành phố" và "liên vùng" nằm ở **khoảng cách giữa các trung tâm dữ liệu**. Các site liên vùng thường cách rất xa nhau, thậm chí ở các thành phố hoặc quốc gia khác nhau.

### Các cấp độ Cold Standby / Warm Standby / Hot Standby / Active-Active

Xét theo cấp độ khôi phục thảm họa, từ thấp đến cao tạo thành một dải liên tục như sau:

![Phổ cấp độ khôi phục thảm họa](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/redundancy-optimized-dr-level-spectrum-ffbca4d2.png)

| Cấp độ DR        | Trạng thái tài nguyên                                  | Tốc độ khôi phục | Chi phí | Kịch bản điển hình                             |
| ---------------- | ------------------------------------------------------ | ---------------- | ------- | ---------------------------------------------- |
| **Cold Standby** | Tài nguyên dự phòng chưa chạy, cần khởi động thủ công  | Cấp giờ ~ ngày   | Thấp    | Nghiệp vụ không cốt lõi                        |
| **Warm Standby** | Một phần tài nguyên chạy thường trực, cần mở rộng khi tiếp quản | Cấp phút   | Trung bình | Khôi phục thảm họa nghiệp vụ thông thường    |
| **Hot Standby**  | Tài nguyên và dữ liệu đồng bộ liên tục, chuyển đổi nhanh | Cấp giây ~ phút | Cao     | Nghiệp vụ cốt lõi                              |
| **Active-Active** | Nhiều site đồng thời gánh lưu lượng production        | Gần thời gian thực | Rất cao | Nghiệp vụ cốt lõi đòi hỏi độ sẵn sàng cực cao |

Các mảng nghiệp vụ khác nhau có thể áp dụng cấp độ khác nhau, không cần ép toàn bộ hệ thống chạy Active-Active. Điều cốt lõi là cân đối giữa phạm vi ảnh hưởng của nghiệp vụ, xác suất lỗi và chi phí xây dựng.

## Cơ chế chuyển đổi dự phòng (Failover)

Chỉ có dự phòng thôi là chưa đủ mà còn phải kết hợp cơ chế **Failover (chuyển đổi dự phòng)**. Hiểu đơn giản, Failover là **chuyển nhanh lưu lượng từ node bị lỗi sang các node đang khỏe mạnh**.

Failover có thể hoàn toàn tự động hoặc tự động phát hiện rồi xác nhận thủ công. Với các dịch vụ phi trạng thái (stateless) và hệ thống cache, thường hướng tới tự động chuyển đổi; còn với các tình huống rủi ro cao như đổi primary của database, chuyển lưu lượng liên vùng hay luồng tiền/thanh toán, nhiều đội ngũ vẫn giữ bước xác nhận hoặc phê duyệt thủ công.

Quá trình Failover thường bao gồm các bước sau:

![Quy trình Failover](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/redundancy-optimized-failover-process-18fc28c1.png)

1. **Phát hiện lỗi (Failure Detection)**: Phát hiện node lỗi thông qua heartbeat, health check... Ngưỡng phát hiện phải cân bằng giữa báo nhầm (false positive) và bỏ sót (false negative): quá nhạy sẽ dễ chuyển nhầm gây chập chờn, quá bảo thủ lại kéo dài thời gian gián đoạn.
2. **Xác nhận lỗi (Failure Confirmation)**: Tránh phán đoán nhầm, thường cần kiểm tra lại nhiều lần và dựa vào bỏ phiếu đa số (majority), node trọng tài (arbiter) hoặc cơ chế thuê bao (lease) để phòng tránh **Split-brain (chia rẽ não)**.
3. **Chuyển đổi dự phòng (Failover Switch)**: Chuyển hướng lưu lượng sang node dự phòng.
4. **Thông báo sự cố (Alerting)**: Gửi cảnh báo tới đội ngũ vận hành.
5. **Khôi phục sau lỗi (Recovery)**: Sau khi node lỗi phục hồi thì đưa trở lại cụm.

Đối với hệ thống có trạng thái (stateful), còn cần cơ chế **Fencing** nhằm bảo đảm node primary cũ khi mất liên lạc hoặc khôi phục lại không thể tiếp tục ghi vào tài nguyên dùng chung. Nếu không, dù node primary mới đã chuyển đổi thành công vẫn có thể xảy ra tình trạng hai primary cùng ghi và Split-brain. Các biện pháp phổ biến gồm fencing token, STONITH (Shoot The Other Node In The Head), token ghi và lease. Sau khi khôi phục, primary cũ không được phép trực tiếp tham gia lại đường ghi ngay mà phải đồng bộ dữ liệu và được xác nhận thông qua cơ chế trọng tài.

![Cơ chế Fencing chống Split-brain](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/redundancy-optimized-stateful-failover-fencing-424a72da.png)

### Ví dụ mô hình Redis Sentinel

Redis Sentinel giám sát node primary (trong tài liệu cũ hay gọi là master); khi đa số Sentinel đánh giá primary bị lỗi, chúng sẽ bầu chọn và thăng cấp một replica (trong tài liệu cũ hay gọi là slave) lên làm primary mới. Tuy nhiên nó không đảm bảo `RPO = 0`: do cơ chế sao chép của Redis mặc định là bất đồng bộ nên khi Failover vẫn có thể mất phần dữ liệu chưa kịp đồng bộ sang replica.

Trên production thường triển khai tối thiểu 3 Sentinel. Cần lưu ý rằng `quorum` chỉ biểu thị số Sentinel đồng ý rằng primary đã ngừng hoạt động khách quan (`ODOWN`); để thực sự khởi phát Failover còn liên quan đến đa số (majority) Sentinel và bầu leader, do đó đừng hiểu đơn giản `quorum` là một nửa tổng số Sentinel. Cần chú ý các tham số như `down-after-milliseconds` (sau bao lâu không liên lạc được thì coi là ngắt kết nối) và `failover-timeout` (thời gian timeout của quá trình Failover).

Khi dùng Redis Sentinel trên production, nên theo dõi các chỉ số quan sát sau:

| Nhóm chỉ số            | Chỉ số cụ thể                                               |
| ---------------------- | ----------------------------------------------------------- |
| Độ trễ sao chép        | Replication lag của replica so với primary                  |
| Phát hiện lỗi          | Số lần kích hoạt `down-after-milliseconds`                  |
| Thời gian chuyển đổi   | Thời gian từ lúc kích hoạt Failover đến khi hoàn tất        |
| Tác động phía client   | Thời gian client kết nối lại, tỷ lệ lỗi ghi trong lúc chuyển đổi |
| Trạng thái cụm         | Trạng thái quorum / majority của Sentinel, tình trạng sống của các node Sentinel |

![Mô hình Redis Sentinel](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/redundancy-optimized-redis-sentinel-955a1816.png)

### Ví dụ Nginx + Keepalived

Nginx có thể kết hợp với Keepalived để đạt tính sẵn sàng cao. Keepalived quản lý **IP ảo (VIP)** dựa trên giao thức VRRP, cho phép VIP trôi nổi (floating) giữa node chính và node dự phòng nhằm giải quyết tính sẵn sàng cao cho địa chỉ IP đầu vào. Nếu máy chủ Nginx chính bị sập, Keepalived sẽ tự động Failover qua giao thức VRRP và nâng cấp máy chủ Nginx dự phòng lên làm chính. Do sử dụng **VIP**, địa chỉ IP hướng ra ngoài không thay đổi.

Cần lưu ý những điểm sau:

- **Keepalived không đảm bảo di trú không mất mát cho các kết nối TCP đang tồn tại**; quá trình chuyển đổi còn chịu ảnh hưởng bởi việc làm mới bảng ARP/neighbor table, mạng tầng 2 (Layer 2), hỗ trợ VIP của nhà cung cấp cloud và script health check.
- Phù hợp cho dịch chuyển VIP trong một trung tâm dữ liệu hoặc cùng mạng Layer 2, không phù hợp để giải quyết trực tiếp bài toán điều hướng lưu lượng liên vùng.
- Trên môi trường cloud cần kiểm tra xem hạ tầng có hỗ trợ VIP tùy chỉnh và chuyển đổi ARP/route hay không.
- Script health check phải kiểm tra tiến trình Nginx và cổng dịch vụ thực tế, chứ không chỉ kiểm tra mỗi tiến trình Keepalived.
- Trên production còn phải chọn chế độ chiếm quyền (preemptive) hoặc không chiếm quyền (non-preemptive) tùy theo nghiệp vụ để tránh việc khi node chính khôi phục lại gây ra lần chuyển đổi thứ hai không cần thiết.

![Kiến trúc sẵn sàng cao Nginx + Keepalived](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/redundancy-optimized-nginx-keepalived-45d4dcb9.png)

## Thách thức của Multi-Region Active-Active

Triển khai kiến trúc đa hoạt động liên vùng (Multi-Region Active-Active) cực kỳ khó và phải tính đến rất nhiều yếu tố:

![Thách thức của Multi-Region Active-Active](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/redundancy-optimized-geo-active-active-challenge-dd9ac717.png)

| Thách thức             | Mô tả                                                           | Hướng giải quyết                                                                                                                |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Nhất quán dữ liệu**  | Làm sao giữ dữ liệu nhất quán giữa nhiều trung tâm dữ liệu      | Định tuyến theo đơn vị (Cell-based routing), Eventual Consistency, TCC/Saga, cơ chế giải quyết xung đột                        |
| **Độ trễ mạng**        | Độ trễ mạng giữa các phòng máy khác vùng rất lớn                | Truy cập gần nhất (geo-proximity), phân vùng dữ liệu                                                                            |
| **Điều hướng lưu lượng** | Làm sao phân bổ request người dùng tới đúng trung tâm dữ liệu | Phân giải DNS thông minh, GSLB                                                                                                  |
| **Quản lý Session**    | Chia sẻ session người dùng giữa nhiều phòng máy ra sao          | Ưu tiên thiết kế stateless hoặc định tuyến cố định theo đơn vị người dùng về một site; chia sẻ session liên vùng tuy khả thi nhưng kéo theo độ trễ, nhất quán và cô lập lỗi |
| **Chi phí**            | Chi phí xây dựng và vận hành đa trung tâm dữ liệu rất cao       | Triển khai phân cấp theo mức độ trọng yếu của nghiệp vụ                                                                         |

Sự đánh đổi cốt lõi của Multi-Region Active-Active có thể hiểu qua định lý CAP: độ trễ mạng và phân vùng mạng liên vùng là điều không thể tránh khỏi, hệ thống buộc phải đánh đổi giữa tính nhất quán mạnh (Strong Consistency) và tính sẵn sàng (Availability). Nhưng độ khó kỹ thuật của Multi-Region Active-Active không chỉ dừng ở CAP, mà còn gồm độ trễ liên vùng, điều hướng lưu lượng, phân mảnh dữ liệu (sharding), giải quyết xung đột, chi phí, tuân thủ pháp lý và độ phức tạp khi diễn tập. Cách làm phổ biến là chia Cell theo người dùng hoặc khu vực địa lý để phần lớn thao tác đọc/ghi rơi vào cùng một phòng máy; các thao tác xuyên Cell sẽ dùng TCC / Saga, đối soát bù trừ (reconciliation & compensation) hoặc cơ chế xử lý xung đột nghiệp vụ để đảm bảo tính nhất quán cuối cùng (Eventual Consistency).

**Không phải mọi nghiệp vụ đều cần Multi-Region Active-Active.** Những nhóm nghiệp vụ sau cần cân nhắc hết sức thận trọng:

- Nghiệp vụ có tần suất ghi nhất quán mạnh cao và nhiều xung đột liên vùng
- Mô hình dữ liệu không thể tách theo người dùng / vùng địa lý / tenant
- Luồng tiền tệ/tài chính chưa đủ năng lực đối soát và bù trừ
- Đội ngũ chưa đủ năng lực diễn tập và vận hành
- Hệ thống có chi phí đầu tư cao hơn thiệt hại dự kiến do sự cố gây ra

Thông thường cần đánh giá tổng hợp dựa trên phạm vi ảnh hưởng nghiệp vụ, xác suất xảy ra sự cố và chi phí xây dựng.

Nếu bạn muốn tìm hiểu sâu hơn về kiến trúc Multi-Region Active-Active, có thể tham khảo các tài liệu sau:

- [Hiểu trọn vẹn Multi-Region Active-Active chỉ qua bài viết này - Thủy Đích dữ Ngân Đạn (2021)](https://mp.weixin.qq.com/s/T6mMDdtTfBuIiEowCpqu6Q)
- [Bốn bước xây dựng kiến trúc Multi-Region Active-Active](https://mp.weixin.qq.com/s/hMD-IS__4JE5_nQhYPYSTg)
- ["Học Kiến Trúc Từ Con Số 0" — 28 | Bảo chứng độ sẵn sàng cao cho nghiệp vụ: Kiến trúc Multi-Region Active-Active](http://gk.link/a/10pKZ)
