---
title: "Giải thích chi tiết Giáng cấp dịch vụ và Ngắt mạch (Circuit Breaker): Dự phòng giáng cấp (Fallback), Máy trạng thái Circuit Breaker và Lựa chọn Sentinel / Hystrix / Resilience4j"
description: "Giải thích chi tiết cơ chế giáng cấp dịch vụ và Ngắt mạch (Circuit Breaker): Dự phòng giáng cấp (Fallback), công tắc giáng cấp, máy trạng thái Closed/Open/Half-Open của Circuit Breaker, hiệu ứng sập dây chuyền (Avalanche), chiến lược cô lập (Isolation) và so sánh lựa chọn giữa Sentinel, Hystrix, Resilience4j."
category: Độ sẵn sàng cao (High Availability)
icon: "mdi:electric-switch"
tag:
  - Giáng cấp dịch vụ
  - Ngắt mạch (Circuit Breaker)
head:
  - - meta
    - name: keywords
      content: Giáng cấp dịch vụ,Dự phòng giáng cấp Fallback,Ngắt mạch Circuit Breaker,Cơ chế Circuit Breaker,Máy trạng thái Circuit Breaker,Sentinel,Hystrix,Resilience4j,Phân biệt Rate Limiting Giáng cấp Ngắt mạch,Hiệu ứng tuyết lở sập dây chuyền,Cô lập Thread Pool,Cô lập Semaphore,Câu hỏi phỏng vấn High Availability
lang: vi
sourceRef: zh-ref/high-availability/fallback-and-circuit-breaker.md
---

Trong kiến trúc Microservices, một request thường phải đi qua chuỗi lời gọi gồm nhiều service. Nếu một service trên chuỗi gặp sự cố — chẳng hạn phản hồi chậm, Timeout hoặc sập hẳn — rất dễ kéo theo tài nguyên ở tầng thượng nguồn (upstream) cũng cạn kiệt theo, cuối cùng biến thành sập dây chuyền toàn chuỗi (Avalanche). Giáng cấp dịch vụ và Ngắt mạch (Circuit Breaker) chính là hai tuyến phòng thủ ứng phó với dạng sự cố này: giáng cấp chủ động "bỏ tốt giữ xe" khi hệ thống quá tải, còn Ngắt mạch (Circuit Breaker) kịp thời "cắt mạch" để chặn đứng tổn thất khi dịch vụ hạ nguồn (downstream) lỗi kéo dài.

Bài viết này sẽ làm rõ nguyên lý cốt lõi của giáng cấp dịch vụ và Ngắt mạch (Circuit Breaker), bao gồm Dự phòng giáng cấp (Fallback), công tắc giáng cấp, máy trạng thái của Circuit Breaker, chiến lược cô lập (Isolation) và so sánh lựa chọn giữa Sentinel, Hystrix và Resilience4j.

## Giáng cấp dịch vụ (Service Degradation) là gì?

Giáng cấp dịch vụ nói một cách dễ hiểu là: **khi hệ thống sắp không chịu nổi nữa, hãy hy sinh trước các tính năng không quan trọng để dồn tài nguyên cho luồng cốt lõi.**

Ví dụ vào dịp khuyến mãi lớn của sàn thương mại điện tử, các phân hệ không cốt lõi như gợi ý sản phẩm, banner quảng cáo, hiệu ứng trang trí sự kiện có thể tắt tạm trước, nhưng các luồng đặt hàng, thanh toán, trừ tồn kho bắt buộc phải giữ bằng được. Người dùng nhìn thiếu một mục gợi ý vẫn chấp nhận được, còn không đặt được đơn hàng thì là sự cố thật sự.

Vì thế, giáng cấp là một phương án dự phòng được thiết kế sẵn từ trước, chứ không phải đợi hệ thống sập rồi mới tùy tiện trả về một giá trị mặc định. Kích hoạt lúc nào, tắt tính năng gì, trả về nội dung ra sao, khôi phục thế nào — tất cả đều phải tính trước.

### Giáng cấp thường được kích hoạt trong những tình huống nào?

Nhiều người hiểu nhầm rằng "chỉ khi tải máy chủ quá cao mới giáng cấp", thực tế không chỉ có một tình huống đó.

Các kịch bản kích hoạt phổ biến gồm mấy nhóm sau:

- Áp lực tổng thể của hệ thống quá lớn, như CPU tăng vọt, Thread Pool đầy cứng, thời gian phản hồi API kéo dài rõ rệt;
- Một dịch vụ hạ nguồn gặp sự cố bất thường, như dịch vụ tồn kho, tính giá hoặc gợi ý đột ngột Timeout hàng loạt;
- Một trung tâm dữ liệu, vùng (Zone) hoặc đường truyền mạng gặp trục trặc;
- Trước các đợt khuyến mãi lớn, Flash Sale hoặc sự kiện, chủ động tắt trước một số tính năng không cốt lõi theo kịch bản chuẩn bị sẵn;
- Đội vận hành tạm thời cần kiểm soát hoặc đóng bớt một số cổng tính năng.

Dù nguyên nhân kích hoạt là gì, mục tiêu cốt lõi của giáng cấp luôn giống nhau: **giữ luồng cốt lõi, bỏ luồng phụ.**

### Giáng cấp có thể chia tới độ mịn (Granularity) nào?

Độ mịn của giáng cấp có thể thô, cũng có thể rất chi tiết.

Mức thô thì giáng cấp luôn cả một service. Ví dụ khi service gợi ý gặp sự cố, toàn bộ kết quả gợi ý đều trả về danh sách rỗng.

Mức mịn hơn có thể chỉ giáng cấp một khối giao diện trên trang. Chẳng hạn trang chi tiết sản phẩm vẫn hiển thị bình thường, nhưng khu vực "Có thể bạn cũng thích" tạm thời ẩn đi.

Mức mịn hơn nữa có thể chỉ giáng cấp một API cụ thể, một công tắc tính năng, thậm chí một nhóm người dùng hoặc một kịch bản nghiệp vụ nhất định.

Trong dự án thực tế, các tính năng thường được phân cấp ưu tiên. Ví dụ:

- Gợi ý, quảng cáo, bảng xếp hạng: mức ưu tiên thấp, gặp sự cố có thể tắt trước;
- Chi tiết sản phẩm, giỏ hàng: mức ưu tiên cao hơn, cố gắng bảo vệ;
- Đặt hàng, thanh toán, tồn kho: luồng cốt lõi, chỉ cân nhắc giáng cấp ở bước cuối cùng.

Các cách đặt tên như `L0–L4` hay cấp `1–10` đều chỉ là quy ước nội bộ của từng team, không phải chuẩn chung của toàn ngành. Điểm mấu chốt không nằm ở cách đặt tên, mà ở chỗ phải phân định rõ từ trước: **tính năng nào có thể hy sinh, tính năng nào bắt buộc phải giữ.**

### Có những cách giáng cấp nào?

#### 1. Xử lý trì hoãn (Deferred Processing)

Một số thao tác không nhất thiết phải hoàn tất đồng bộ ngay, có thể đẩy vào Message Queue (MQ) để xử lý từ từ.

Ví dụ như tặng điểm thưởng sau khi bình luận, thống kê hành vi người dùng, xuất báo cáo — những tác vụ này dù hoàn thành chậm vài giây thì người dùng nhìn chung cũng không cảm nhận được. Luồng chính chỉ cần trả về thành công trước, phần việc còn lại giao cho tác vụ bất đồng bộ xử lý.

Nhưng ở đây có một cái bẫy: MQ cũng có thể bị ứ đọng (Backlog). Nếu Consumer đã xử lý không xuể mà Producer vẫn liên tục Retry, hệ thống càng bị dập nặng hơn. Vì vậy Retry cần kèm lùi thời gian (Backoff) và độ lệch ngẫu nhiên (Jitter), khi cần thiết phải áp dụng thêm Rate Limiting.

#### 2. Giáng cấp từng phần trang (Page Fragment Degradation)

Đây là cách trực quan nhất: giữ lại khung nội dung chính của trang và tắt các khối không cốt lõi.

Ví dụ trên trang chi tiết sản phẩm, tiêu đề, giá bán và tồn kho phải giữ lại; khu vực gợi ý, vị trí quảng cáo hay widget sự kiện có thể tạm ẩn đi.

Cách này đơn giản và hiệu quả, nhưng điều kiện tiên quyết là bạn đã làm sẵn công tắc và logic Dự phòng giáng cấp (Fallback) từ trước. Đợi lúc sự cố bùng phát mới sửa code, build và deploy lại thì gần như không kịp.

#### 3. Giáng cấp Dự phòng giáng cấp (Fallback) ở tầng API

Trên trang web có những API được tải bất đồng bộ, như thời gian giao hàng dự kiến, dự đoán giá hoặc danh sách gợi ý. Nếu chúng bị Timeout, có thể trả về thẳng giá trị mặc định hoặc giá trị từ Cache.

Chẳng hạn khi API tính thời gian giao hàng gặp lỗi, tạm hiển thị "Dự kiến giao trong 2–3 ngày"; khi API gợi ý lỗi, trả về danh sách sản phẩm phổ biến đã lưu trong Cache.

Ở đây cần chú ý một điểm: dữ liệu Dự phòng giáng cấp (Fallback) tốt nhất phải chuẩn bị sẵn từ trước. Đừng đợi API đã sập rồi mới vội vàng chọc vào Database truy vấn hoặc dựng lại Cache, làm vậy rất dễ khuếch đại sự cố nghiêm trọng hơn.

#### 4. Giáng cấp chuyển hướng trang (Page Redirect Degradation)

Nếu trang đầy đủ quá nặng, có thể điều hướng người dùng sang một phiên bản trang rút gọn hoặc trang HTML tĩnh.

Ví dụ khi lượng truy cập trang sự kiện khuyến mãi quá lớn, tạm thời chuyển sang trang sự kiện tĩnh; khi hệ thống bảo trì, chuyển hướng sang trang thông báo bảo trì.

Phương án này trông đơn giản, nhưng nhất định phải chuẩn bị trước trang tĩnh, quy tắc định tuyến (Routing) và công tắc chuyển đổi. Xảy ra sự cố trên production rồi mới làm tạm bợ là bất khả thi.

#### 5. Giáng cấp thao tác ghi (Write Degradation)

Giáng cấp thao tác ghi phù hợp với một số kịch bản "có thể ghi xuống Database chậm hơn một chút".

Chẳng hạn cộng điểm thưởng, gửi thông báo hay ghi nhật ký biến động tồn kho — có thể ghi tạm vào Redis, bảng message cục bộ hoặc hàng đợi lưu trữ trên đĩa cục bộ trước, rồi để MQ hoặc Cron Job đồng bộ dần xuống Database.

Nhưng cái giá của giáng cấp ghi khá rõ ràng: bạn phải giải quyết bài toán nhất quán cuối cùng (Eventual Consistency). Ví dụ message có bị mất không, dữ liệu có bị ghi lặp không, đồng bộ thất bại thì bù trừ (Compensation) ra sao, đối soát (Reconciliation) thế nào — tất cả đều phải thiết kế trước.

Đặc biệt cần lưu ý: **hàng đợi thuần trong bộ nhớ (In-memory Queue) không phù hợp để giữ dữ liệu quan trọng.** Chỉ cần node khởi động lại là mất sạch dữ liệu.

#### 6. Giáng cấp thao tác đọc (Read Degradation)

Giáng cấp thao tác đọc thường là "chỉ đọc Cache, không gọi xuống dịch vụ Backend nữa".

Ví dụ dữ liệu đọc nhiều ghi ít như chi tiết sản phẩm, thông tin cửa hàng, bảng xếp hạng phổ biến rất hợp để dùng Cache làm lớp Dự phòng giáng cấp (Fallback). Khi dịch vụ Backend gặp lỗi, trả về dữ liệu cũ trong Cache trước để ít nhất trang vẫn mở lên được.

Nếu ngay cả Cache cũng miss, đừng cố đấm ăn xôi gọi tiếp xuống hạ nguồn. Hãy trả về giá trị mặc định, kết quả rỗng hoặc trang giáng cấp ngay lập tức; nếu không, một request của người dùng có thể kéo theo cả một chuỗi dịch vụ Backend sập chung.

### Làm công tắc giáng cấp như thế nào?

Công tắc giáng cấp bắt buộc phải bật và tắt được nhanh chóng, không thể lần nào cũng phải sửa code, phát hành lại rồi khởi động lại service.

Các phương án phổ biến gồm:

| **Phương án**               | **Đặc điểm**                                    | **Kịch bản phù hợp**                           |
| --------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| File cấu hình + Restart     | Đơn giản, nhưng có hiệu lực chậm                | Công tắc không khẩn cấp, rất ít khi thay đổi   |
| Bảng công tắc trong DB      | Hỗ trợ lưu lịch sử kiểm toán, tính tức thời vừa | Cần ghi lại ai sửa, sửa vào lúc nào            |
| Configuration Center        | Cập nhật thời gian thực tốt, hay dùng ở production | Công tắc giáng cấp cốt lõi, công tắc động    |
| Công tắc trên Redis         | Triển khai gọn nhẹ, tích hợp nhanh              | Nghiệp vụ đơn giản, kiểm soát tạm thời         |

Ở môi trường production, nên ưu tiên dùng Configuration Center như Nacos hay Apollo làm công tắc giáng cấp. Chúng đáng tin cậy hơn hẳn kiểu "sửa file config rồi restart" và phù hợp với các tình huống khẩn cấp.

Tuy nhiên, đừng hiểu nhầm "đẩy cấu hình thời gian thực (real-time push)" nghĩa là "mọi máy chủ đều có hiệu lực tức thì cùng một khoảnh khắc". Lấy Nacos làm ví dụ: bản 2.x bổ sung kết nối dài gRPC giúp đẩy thay đổi cấu hình tới Client, nhưng thời điểm thực sự có hiệu lực vẫn phụ thuộc vào số lượng Client, mạng, tải của Server, cơ chế làm mới Local Cache, v.v.

Vì vậy khi thiết kế công tắc giáng cấp, hãy mặc định chấp nhận một thực tế: **giữa các máy chủ khác nhau có thể tồn tại độ lệch trạng thái trong thời gian ngắn.**

### Cần chú ý gì khi dùng Nacos làm công tắc giáng cấp?

Nếu dự án đang dùng Nacos, có vài cái bẫy bạn cần biết trước.

Thứ nhất, cách giao tiếp của Nacos 2.x và 1.x không hoàn toàn giống nhau. Nacos 2.x bổ sung giao tiếp gRPC, nên ngoài cổng chính `8848` còn sử dụng thêm các cổng như `9848` và `9849`. Tài liệu chính thức nêu rõ: `9848` là cổng để Client gửi request gRPC lên Server, còn `9849` là cổng giao tiếp giữa các Server với nhau.

Thứ hai, khi nâng cấp cần chú ý tính tương thích. Server Nacos 2.0 có thể tương thích ngược với Client 1.x, nhưng Client 2.x không kết nối được tới Server 1.x vì Client 2.x sử dụng gRPC.

Thứ ba, nếu ở giữa có Docker, tường lửa, Security Group, Nginx hay VIP thì bắt buộc phải cấu hình ánh xạ cổng (Port Mapping) từ trước. Đặc biệt nếu cổng `9848` chưa được mở, Client có thể bị lỗi không kết nối được hoặc không kéo được cấu hình. Tài liệu chính thức cũng nhắc rõ rằng khi dùng VIP/Nginx cần cấu hình chuyển tiếp TCP, không thể cấu hình như chuyển tiếp HTTP thông thường.

Thứ tư, khi mạng bị phân mảnh hoặc kết nối dài của Client gặp sự cố, Client có thể chỉ dùng được cấu hình cũ lưu cục bộ. Do đó trong kịch bản ứng phó phải viết rõ: nếu công tắc giáng cấp chưa đẩy kịp tới toàn bộ các node thì hệ thống phải xử lý thế nào.

Đây cũng là lý do giáng cấp không thể chỉ trông chờ vào một công tắc duy nhất. Các luồng quan trọng tốt nhất phải kết hợp đồng thời Timeout, Ngắt mạch (Circuit Breaker), Rate Limiting và Cache Fallback.

### Giáng cấp dịch vụ có những phân loại nào?

Phân theo mức độ tự động hóa, giáng cấp được chia làm hai loại:

- **Giáng cấp tự động** (kích hoạt bởi Rule Engine, bộ Ngắt mạch Circuit Breaker, bộ Rate Limiter hoặc cảnh báo giám sát)
- **Giáng cấp thủ công** (do kỹ sư trực sự cố hoặc đội vận hành kích hoạt theo kịch bản qua nền tảng cấu hình, ví dụ trước Flash Sale hay khuyến mãi lớn)

Giáng cấp tự động chia theo điều kiện kích hoạt gồm mấy kiểu phổ biến:

- **Giáng cấp do Timeout**: Kích hoạt khi RT liên tục vượt ngưỡng (ngưỡng có thể tham chiếu đường nền giám sát P99/P999, nhưng cơ chế thực tế của framework là đánh giá RT từng request kết hợp tổng hợp theo cửa sổ thống kê, chứ không so sánh trực tiếp P99), sau khi kích hoạt thì trả về giá trị mặc định. Cần lưu ý bảo vệ Tính lũy đẳng (Idempotency), nếu không bão Retry còn rắc rối hơn lỗi ban đầu.
- **Giáng cấp do tỷ lệ lỗi**: Kích hoạt khi tỷ lệ ngoại lệ vượt ngưỡng (ví dụ 50%) và trả về dữ liệu Dự phòng giáng cấp (Fallback). Dữ liệu Fallback cần được làm ấm (Warm up) sẵn vào Cache từ trước.
- **Giáng cấp do sự cố cứng**: Kích hoạt khi hạ nguồn trả về lỗi cứng như HTTP 5xx, lỗi RPC, lỗi phân giải DNS, và trả về dữ liệu Cache. Nếu Cache không có thì trả về giá trị mặc định ngay, đừng gọi tiếp xuống dưới.
- **Giáng cấp do Rate Limiting**: Kích hoạt khi QPS vượt ngưỡng, trả về trang xếp hàng chờ, thông báo hết hàng hoặc trang báo lỗi. Trang xếp hàng cần chống gửi lặp (dùng Idempotency Token), nếu không người dùng bấm F5 liên tục thì mất hết ý nghĩa.

> Bão Retry (Retry Storm): Dịch vụ vừa mới hồi phục, toàn bộ Client đồng loạt Retry khiến dịch vụ lại bị đánh sập lần nữa. Cách khắc phục: Exponential Backoff kèm Jitter, Rate Limiting bằng Token Bucket, phục hồi chia nhóm theo từng đợt.

## Hệ thống phân tán quy mô lớn giáng cấp như thế nào?

Trong các hệ thống phân tán quy mô lớn, thường có hàng trăm thậm chí hàng nghìn service. Trước các đợt khuyến mãi lớn, người ta thường giáng cấp hàng loạt dựa theo mức độ quan trọng của nghiệp vụ và mối quan hệ phụ thuộc giữa các service.

### Năng lực của nền tảng giáng cấp

Các công ty Internet lớn thường có nền tảng giáng cấp tập trung với các năng lực sau:

- **Quản lý phân cấp**: Phân cấp service theo độ ưu tiên (cấp `1–10` hoặc `L0–L4`, tùy quy ước nhóm), các nghiệp vụ cốt lõi phải qua xét duyệt, sơ đồ phụ thuộc phải rà soát kỹ từ trước.
- **Giáng cấp hàng loạt**: Thực thi hàng loạt theo cấp bậc hoặc nhóm, sắp xếp thứ tự thực thi, đẩy cấu hình theo phiên bản và hỗ trợ Rollback chỉ với một cú nhấp chuột. Phải đi qua đủ bước Canary, xem trước (Preview) và phê duyệt rồi mới bấm chạy, tránh tắt một phát bay luôn cả luồng cốt lõi. Thông thường không yêu cầu tính nguyên tử 2PC nghiêm ngặt.
- **Công tắc động**: Đẩy cấu hình thời gian thực qua Configuration Center (Nacos 2.x gRPC hoặc Apollo), không cần khởi động lại.
- **Kiểm chứng hiệu quả**: Canary + giám sát, đối chiếu chỉ số để chắc chắn giáng cấp đã phát huy tác dụng và không gây ảnh hưởng nhầm.
- **Rollback một chạm**: Phiên bản hóa cấu hình, lưu nhật ký kiểm toán thay đổi (Audit Log) để quay lui nhanh khi có vấn đề.

### Xây dựng kịch bản ứng phó giáng cấp (Playbook)

1. **Phân cấp nghiệp vụ**: Phân rõ service nào không được đụng tới (như đặt hàng, thanh toán) và service nào có thể tắt (như gợi ý, bình luận), định nghĩa độ ưu tiên.
2. **Phân tích phụ thuộc**: Vẽ sơ đồ chuỗi lời gọi, tìm ra đường găng (Critical Path) và các phụ thuộc đơn điểm — biết trước thành phần nào sập sẽ kéo theo hàng loạt dịch vụ khác.
3. **Chiến lược giáng cấp**: Thiết kế phương án giáng cấp cho từng service không cốt lõi, đừng quên định rõ nhánh xử lý khi thất bại.
4. **Diễn tập kiểm chứng**: Định kỳ chạy diễn tập giáng cấp; kịch bản trên giấy mà chưa chạy thử thì không thể yên tâm.

> Khi xảy ra phân mảnh mạng (Network Partition), đừng sa đà tranh luận lý thuyết suông mà hãy chốt rõ mấy việc này: trong thời gian phân mảnh mỗi service đọc Local Cache hay từ chối request, có dừng ghi chéo vùng hay không, giữ luồng cốt lõi bằng cách nào và có chuyển sang chế độ chỉ đọc (Read-only) hay không.
>
> **Đọc chi tiết:** [Giải thích chi tiết định lý CAP & BASE](https://javaguide.cn/distributed-system/protocol/cap-and-base-theorem.html).

## Dự phòng giáng cấp (Fallback) là gì?

**Dự phòng giáng cấp (Fallback)** có thể hiểu đơn giản là: **kết quả chốt chặn an toàn trả về khi gặp sự cố.**

Trong điều kiện bình thường, request sẽ đi gọi logic nghiệp vụ thật, như truy vấn gợi ý, chi tiết sản phẩm hoặc thông tin người dùng. Nhưng nếu lần gọi đó thất bại, hoặc bị các quy tắc Rate Limiting / Ngắt mạch (Circuit Breaker) chặn lại, hệ thống không thể quăng thẳng ngoại lệ cho người dùng, mà phải trả về một kết quả đã chuẩn bị sẵn từ trước.

Ví dụ: service gợi ý sập thì trả về danh sách rỗng; API chi tiết sản phẩm bị Timeout thì trả về dữ liệu cũ trong Cache; API trang sự kiện lỗi thì chuyển sang trang tĩnh.

Đó chính là vai trò của Dự phòng giáng cấp (Fallback): **đừng để một lần thất bại kéo sập cả chuỗi lời gọi.**

Tuy nhiên cần lưu ý: Fallback không phải dùng để "sửa cho hết lỗi", nó chỉ giúp hệ thống tạm thời vẫn dùng được trong tình huống bất thường. Nội dung người dùng nhìn thấy có thể chưa đầy đủ hoặc chưa mới nhất, nhưng ít nhất trang không bị lỗi trắng màn hình.

### `blockHandler` và `fallback` trong Sentinel khác nhau thế nào?

Trong Sentinel, `blockHandler` và `fallback` rất dễ bị dùng lẫn lộn. Cả hai trông đều giống "chốt chặn Dự phòng giáng cấp (Fallback)", nhưng nguyên nhân kích hoạt lại khác nhau.

Nói ngắn gọn:

| **Kịch bản**                                                                  | **Hàm nào được gọi** | **Ngoại lệ thường gặp** |
| ----------------------------------------------------------------------------- | -------------------- | ----------------------- |
| Bị quy tắc của Sentinel chặn lại (như Rate Limiting, Ngắt mạch, bảo vệ hệ thống) | `blockHandler`       | `BlockException`        |
| Code nghiệp vụ tự ném ngoại lệ (như NullPointer, lỗi gọi từ xa, RuntimeException) | `fallback`           | `Throwable`             |

Lấy một ví dụ.

API bị Rate Limiting, Sentinel đánh giá request này không được đi tiếp — lúc này luồng chạy sẽ đi vào `blockHandler`.

Nếu request đã đi vào bên trong hàm nghiệp vụ rồi, nhưng khi gọi sang service tồn kho bị lỗi và ném ra `RuntimeException` — lúc này mới đi vào `fallback`.

Nếu cấu hình cả `blockHandler` lẫn `fallback`, ngoại lệ do quy tắc Sentinel kích hoạt sẽ ưu tiên đi vào `blockHandler`; ngoại lệ nghiệp vụ mới đi vào `fallback`. Đừng nhầm lẫn điểm này, nếu không lúc điều tra lỗi production sẽ rất rối.

![Sentinel: Sự khác biệt giữa blockHandler và Fallback](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-blockHandler-vs-Fal-62f17196.png)

### Các cách triển khai Dự phòng giáng cấp (Fallback) phổ biến

Một số cách làm Fallback phổ biến gồm:

- **Trả về giá trị mặc định**: Trả về thẳng một đối tượng mặc định tĩnh. Danh sách gợi ý rỗng thì trả về `[]`, không lấy được cấu hình thì trả về cấu hình mặc định. Chú ý cấu trúc dữ liệu mặc định phải khớp với cấu trúc trả về bình thường, đừng trả về `null` kẻo phía gọi dính ngay `NullPointerException`.
- **Fallback bằng Cache**: Đọc kết quả thành công gần nhất từ Local Cache hoặc Redis. Rất hợp cho các luồng đọc như chi tiết sản phẩm, thông tin người dùng. Cache có thể hết hạn nên khi trả về tốt nhất gắn kèm thông tin độ mới dữ liệu; khi gặp Cache Penetration đừng cố gọi tiếp, hãy chốt chặn bằng giá trị mặc định.
- **Trang giáng cấp**: Trả về trang HTML tĩnh hoặc phiên bản rút gọn — các trang sự kiện, marketing rất hay dùng cách này. Nhưng bản thân tài nguyên tĩnh cũng cần có dự phòng — phải tính trước phương án xử lý khi CDN không kéo được dữ liệu từ gốc (origin fetch failure).
- **Giáng cấp thao tác ghi**: Ghi trước vào Redis hoặc bảng message cục bộ rồi đồng bộ bất đồng bộ xuống DB. Thường dùng trong các kịch bản ghi đồng thời cao như trừ kho Flash Sale, phát điểm thưởng. Cái giá phải trả là phải đảm bảo nhất quán cuối cùng (đối soát/bù trừ); hàng đợi thuần bộ nhớ sẽ mất dữ liệu khi node sập.

### Những cái bẫy thường gặp với Fallback

Bản thân logic Dự phòng giáng cấp (Fallback) cũng có thể sinh lỗi, và dạng lỗi này còn khó phát hiện hơn lỗi bình thường. Một số cái bẫy hay gặp gồm:

- **Giấu lời gọi mạng (Remote Call) bên trong Fallback**: Trong logic Fallback lại gọi tiếp vào Redis, DB hoặc service khác; nếu các thành phần đó cũng đang sập thì hiệu ứng sập dây chuyền càng trầm trọng. Hãy ưu tiên dùng Caffeine, `Map` cục bộ hoặc giá trị mặc định tĩnh; nếu bắt buộc phải truy cập Redis thì phải dùng Connection Pool riêng, Timeout riêng và Circuit Breaker riêng, nếu Cache miss thì trả về giá trị mặc định ngay chứ đừng xâu chuỗi thêm.
- **Fallback trả về `null`**: Phía thượng nguồn nhận `null` sẽ nổ ngay `NullPointerException`, kéo theo chuỗi ngoại lệ mới. Cấu trúc trả về phải đồng nhất với phản hồi bình thường, dùng Empty Object thay vì `null`.
- **Logic Fallback quá phức tạp**: Bản thân Fallback chạy chậm sẽ kéo kiệt Thread đang gọi. Logic Fallback bắt buộc phải cực kỳ tối giản, cấm xử lý nghiệp vụ phức tạp.
- **Nhiều Fallback dùng chung một Cache**: Cache bị tràn đầy khiến mọi cơ chế Dự phòng giáng cấp cùng chết chung một lúc. Cần cô lập Cache theo chiều nghiệp vụ, các luồng cốt lõi dùng instance Cache độc lập.

Nói thẳng thắn: Fallback là phòng tuyến cuối cùng, bắt buộc phải nhanh hơn và đơn giản hơn lời gọi bình thường. Nếu bên trong Fallback vẫn giấu một lời gọi từ xa đồng bộ mà không có bảo vệ Timeout, đó không phải Dự phòng giáng cấp mà là gài mìn.

## Ngắt mạch (Circuit Breaker) là gì?

**Ngắt mạch (Circuit Breaker)** nghe tên hơi trừu tượng, hiểu đơn giản chính là kịp thời cắt lỗ. Đây là một cơ chế bảo vệ đường truyền nhằm ứng phó với hiệu ứng sập dây chuyền (Avalanche) trong Microservices, tương tự như cầu chì trong mạch điện.

Trong Microservices, một service thường xuyên phải gọi sang service khác. Bình thường, request đi thẳng một mạch xuống dưới:

```text
Service A -> Service B -> Service C
```

Nếu Service C đột ngột chậm đi, các Thread của Service B đang gọi C sẽ phải đứng chờ mãi. Khi Thread Pool của B bị chiếm hết, việc A gọi B cũng bắt đầu Timeout. Lên cao hơn nữa, các service gọi A cũng bị kẹt cứng theo.

Cuối cùng sẽ xuất hiện một tình huống rất điển hình: **rõ ràng chỉ có Service C gặp sự cố, nhưng kết quả là cả chuỗi lời gọi đều bị kéo sập.**

Bộ **Ngắt mạch (Circuit Breaker)** sinh ra để giải quyết đúng vấn đề này.

Ý tưởng của nó rất đơn giản: nếu phát hiện dịch vụ hạ nguồn đã bất thường rõ rệt, tạm thời đừng gọi tiếp vào nó nữa mà trả về ngay kết quả Dự phòng giáng cấp (Fallback). Đợi sau một khoảng thời gian rồi mới cho một ít request qua thăm dò thử. Nếu hạ nguồn đã khôi phục thì mới dần quay lại gọi bình thường.

Điều này giống hệt chiếc cầu chì trong mạch điện: khi dòng điện tăng bất thường thì ngắt mạch trước để tránh làm cháy hỏng luôn các thiết bị phía sau.

### Hiện tượng sập dây chuyền (Avalanche) xảy ra như thế nào?

Rất nhiều sự cố sập dây chuyền trên production không xảy ra trong nháy mắt, mà lan truyền từ tầng này sang tầng khác.

Lấy lại chuỗi lời gọi vừa rồi:

```text
Service A -> Service B -> Service C
```

Ban đầu có thể chỉ là Service C phản hồi chậm đi — ví dụ trước kia 50ms trả về, giờ mất tới 3 giây.

Tiếp đó, các Thread của Service B đang gọi C bắt đầu xếp hàng chờ. Toàn bộ Thread trong Thread Pool đều đang đợi C trả kết quả, request mới đi vào chỉ còn cách tiếp tục nằm chờ trong hàng đợi.

Sau đó nữa, việc Service A gọi B cũng bắt đầu Timeout. Các Thread của chính A cũng bị giữ chặt, tốc độ phản hồi API ngày càng chậm.

Nếu lúc này Client, framework RPC hoặc code nghiệp vụ vẫn tiếp tục Retry không ngừng, lượng request sẽ còn bị nhân lên nhiều lần. Cuối cùng không phải chỉ một service bị chậm, mà cả một dãy service đều chậm theo và toàn bộ chuỗi lời gọi mất khả năng phục vụ.

Đó chính là **hiệu ứng sập dây chuyền / hiệu ứng tuyết lở (Avalanche Effect)**.

![Sự lan truyền của hiệu ứng sập dây chuyền (Avalanche)](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-avalanche-effect-sp-daf4f810.png)

### Một ví dụ sát với thực tế hơn

Giả sử có một luồng xử lý lượt nhấp quảng cáo (Ad Click):

```text
Service Click Quảng cáo A -> Service Lọc Kênh B -> Redis
```

Bình thường, A xử lý 30–40 nghìn lượt click mỗi phút. Một hôm, lưu lượng đột ngột tăng lên hơn 80 nghìn lượt/phút.

Vấn đề bắt đầu phát sinh từ B. B cần đọc một đoạn dữ liệu lọc từ Redis, nhưng `value` này quá lớn nên mỗi lần `get` mất tới hơn 3 giây.

Thế là việc A gọi B bắt đầu Timeout hàng loạt.

Nếu một giao diện RPC như Dubbo lại có cấu hình Retry khi lỗi — chẳng hạn 1 lần gọi gốc kèm thêm 2 lần Retry — thì từ 1 lời gọi ban đầu có thể biến thành 3 lời gọi. (Thực tế có xảy ra hay không còn tùy phiên bản Dubbo, cấu hình interface và kiểu gọi; đặc biệt với API ghi thì nhìn chung không nên bật Retry mặc định, hoặc ít nhất phải hết sức thận trọng.)

Retry càng nhiều, B càng nhận thêm lắm request, Thread Pool càng nhanh chóng đầy cứng rồi bắt đầu từ chối phục vụ. Phía A tiếp tục hứng Timeout và ngoại lệ, khiến kết nối, File Descriptor và tài nguyên Thread cũng bị vắt kiệt.

Cuối cùng, ban đầu chỉ là đọc Redis chậm, nhưng kết quả đã kéo sập cả A, B lẫn các tầng thượng nguồn.

Trong những sự cố kiểu này, Retry thường đóng vai trò "chất xúc tác". Khi không có Rate Limiting và Ngắt mạch (Circuit Breaker), nó sẽ khuếch đại một sự cố cục bộ thành sự cố toàn chuỗi.

Vì vậy trên production không phải là cấm Retry, mà Retry bắt buộc phải có biên giới: phải có thời gian Timeout, số lần thử tối đa, chiến lược Backoff, đồng thời phải đi cùng Rate Limiting và Ngắt mạch (Circuit Breaker).

### Bộ Ngắt mạch (Circuit Breaker) có những trạng thái nào?

Circuit Breaker bao gồm ba trạng thái:

| Trạng thái           | Ý nghĩa                             | Hành vi                                             | Điều kiện chuyển trạng thái                                                                                                    |
| -------------------- | ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Closed (Đóng)**    | Trạng thái bình thường, cho request đi qua | Ghi nhận tỷ lệ lỗi / tỷ lệ gọi chậm                 | Tỷ lệ lỗi hoặc tỷ lệ gọi chậm > ngưỡng → `Open`                                                                                |
| **Open (Mở)**        | Đã kích hoạt ngắt mạch, từ chối request | Trả về Dự phòng giáng cấp (Fallback) nhanh, không gọi hạ nguồn | Hết thời gian làm nguội (tên gọi tùy framework, như `sleepWindow` của Hystrix, `waitDurationInOpenState` của Resilience4j, thường ~10s) → `Half-Open` |
| **Half-Open (Nửa mở)** | Thăm dò xem dịch vụ đã khôi phục chưa | Cho một lượng nhỏ request thăm dò đi qua (số lượng tùy framework) | Request thăm dò đạt điều kiện thành công → `Closed`; thất bại → `Open`                                                         |

![Máy trạng thái của Circuit Breaker](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-fuse-state-machine-48c9741c.png)

### `Half-Open` và `Warm Up` không phải là một

Hai khái niệm này rất dễ bị nhầm lẫn.

`Half-Open` giải quyết câu hỏi: **Hạ nguồn thực sự đã khôi phục hay chưa?**

`Warm Up` giải quyết câu hỏi: **Sau khi khôi phục rồi, lưu lượng có nên mở tăng dần từng bước hay không?**

Nói cách khác, `Half-Open` thiên về "thăm dò", còn `Warm Up` thiên về "làm nóng và xả tải từ từ".

Ví dụ một service vừa khởi động lại xong: Cache vẫn chưa nóng, trình biên dịch JIT chưa hoàn toàn ổn định, Connection Pool tới Database cũng chỉ mới bắt đầu thiết lập. Lúc này dù vài request thăm dò thành công, cũng không có nghĩa là nó lập tức chịu được toàn bộ lưu lượng.

Do đó, quy trình an toàn hơn là:

1. Cho `Half-Open` mở một ít request thăm dò trước;
2. Sau khi thăm dò thành công, đừng dội ngay toàn bộ lưu lượng vào;
3. Dùng tiếp `Warm Up`, Rate Limiting hoặc tăng tải theo đợt để service hồi phục từ từ.

`Warm Up` của Sentinel thuộc chiến lược khởi động nguội (Cold Start) trong kiểm soát lưu lượng, mặc định `coldFactor` bằng `3`, tức là ban đầu bắt đầu từ mức QPS khoảng `threshold / 3` rồi tăng dần lên tới ngưỡng cấu hình.

Trong giai đoạn hồi phục, đừng chỉ nhìn thời gian phản hồi trung bình (Average RT). Giá trị trung bình rất dễ che giấu một số ít request cực chậm. Nên theo dõi đồng thời P99, P999, số Thread đang hoạt động, số kết nối đang hoạt động trong DB Connection Pool và tỷ lệ lỗi.

### Sentinel hỗ trợ những chiến lược Ngắt mạch (Circuit Breaker) nào?

Từ Sentinel 1.8.0 trở đi, ngắt mạch giáng cấp chủ yếu có ba nhóm chiến lược: tỷ lệ gọi chậm (Slow-call Ratio), tỷ lệ ngoại lệ (Exception Ratio) và số lượng ngoại lệ (Exception Count). Trong tài liệu chính thức, `DegradeRule` cũng giải thích các trường như `count`, `timeWindow`, `minRequestAmount`, `statIntervalMs`, `slowRatioThreshold`, v.v.

**1. Tỷ lệ gọi chậm (Slow-Call Ratio)**

Chiến lược này nhìn vào tỷ trọng các request chậm.

Ví dụ bạn đặt RT tối đa là 500ms, thì mọi request vượt quá 500ms được tính là gọi chậm (Slow Call). Sau đó Sentinel sẽ tính tỷ lệ gọi chậm trong một cửa sổ thống kê.

Nếu số request trong cửa sổ đạt mức tối thiểu và tỷ lệ gọi chậm vượt ngưỡng, Ngắt mạch (Circuit Breaker) sẽ được kích hoạt.

Chiến lược này phù hợp với tình huống "hạ nguồn chưa báo lỗi, nhưng ngày càng chậm đi".

**2. Tỷ lệ ngoại lệ (Exception Ratio)**

Chiến lược này nhìn vào tỷ trọng các request thất bại.

Ví dụ trong khoảng thời gian gần nhất, số lượng request đạt mức tối thiểu và tỷ lệ ngoại lệ vượt quá 50% thì kích hoạt ngắt mạch.

Nó phù hợp với kịch bản hạ nguồn bắt đầu ném lỗi hàng loạt, như lỗi RPC, RuntimeException hoặc HTTP 5xx từ phía Server.

**3. Số lượng ngoại lệ (Exception Count)**

Chiến lược này đếm trực tiếp số lần phát sinh ngoại lệ.

Ví dụ trong vòng 1 phút có hơn 50 lần ngoại lệ thì kích hoạt ngắt mạch.

Cách này trực quan hơn tỷ lệ ngoại lệ nhưng lại nhạy cảm với quy mô lưu lượng. API có QPS cao và API có QPS thấp không thể dùng chung một bộ ngưỡng.

### Có thể lấy trực tiếp P99 làm điều kiện Ngắt mạch không?

Không nên hiểu theo cách đó.

P99 là chỉ số giám sát (Monitoring Metric), phù hợp để quan sát biểu hiện tổng thể của API và hỗ trợ bạn chọn ngưỡng Ngắt mạch (Circuit Breaker) hợp lý.

Nhưng khi Sentinel kích hoạt ngắt mạch, nó không đơn giản lấy giá trị P99 so với ngưỡng. Logic của nó gần với trình tự sau hơn:

1. Trước tiên xét từng request đơn lẻ xem có phải gọi chậm hay ngoại lệ không;
2. Đưa vào cửa sổ thống kê để tính tỷ lệ hoặc số lượng;
3. Sau khi tổng số request đạt ngưỡng tối thiểu thì mới quyết định có ngắt mạch hay không.

Vì vậy P99 phù hợp hơn để trả lời câu hỏi: **Ngưỡng tôi đặt ra có hợp lý không?**

Ví dụ một API bình thường có P99 là 120ms, bạn lại đặt ngưỡng gọi chậm là 100ms thì rất dễ ngắt nhầm.

Còn nếu bình thường P99 là 120ms mà đột ngột vọt lên 800ms, điều đó chứng tỏ hạ nguồn nhiều khả năng đang có vấn đề thật, và ngưỡng ngắt mạch cũng cần dựa trên đường nền này để đánh giá.

Các API có QPS thấp lại càng phải cẩn trọng. Nếu cửa sổ thống kê quá ngắn và số request tối thiểu quá nhỏ, chỉ một hai request chậm ngẫu nhiên cũng có thể kích hoạt ngắt mạch. Cách chắc chắn hơn là kéo dài cửa sổ thống kê hoặc nâng số lượng request tối thiểu lên.

## Giáng cấp và Ngắt mạch (Circuit Breaker) khác nhau ở điểm nào?

Giáng cấp và Ngắt mạch thường được nhắc chung với nhau, nhưng bài toán chúng giải quyết không giống nhau.

**Giáng cấp** tập trung vào: sau khi hệ thống gặp sự cố, vẫn có thể tiếp tục phục vụ người dùng bằng cách nào.

Ví dụ service gợi ý sập thì trang chi tiết sản phẩm đừng bị trắng trang theo mà hãy ẩn tạm khu vực gợi ý; API sự kiện Timeout thì tạm hiển thị trang sự kiện tĩnh; không lấy được nhãn người dùng thì tạm xử lý như người dùng phổ thông.

Nghĩa là giáng cấp mang tính lựa chọn đánh đổi ở tầng nghiệp vụ: tính năng nào có thể hy sinh trước, luồng cốt lõi nào bắt buộc phải giữ lại.

**Ngắt mạch (Circuit Breaker)** tập trung vào: khi hạ nguồn đã bất thường rồi thì có tiếp tục gọi nữa hay không.

Ví dụ service đơn hàng gọi service tồn kho, mà service tồn kho đã Timeout hàng loạt. Lúc này nếu vẫn tiếp tục bắn request sang, chỉ làm service tồn kho chậm thêm và kéo chết luôn Thread Pool của service đơn hàng. Khi phát hiện hạ nguồn bất thường, Circuit Breaker sẽ chặn request lại, trả về ngay kết quả Dự phòng giáng cấp (Fallback), đợi một lát rồi mới thả ít request sang thăm dò.

Nhớ trong một câu: **Giáng cấp là "gặp sự cố rồi thì tiếp tục phục vụ bằng cách nào", còn Ngắt mạch là "phụ thuộc đang lỗi có tiếp tục gọi nữa hay không".**

### Rate Limiting, Ngắt mạch (Circuit Breaker) và Giáng cấp lần lượt quản lý điều gì?

Ba khái niệm này cũng rất dễ bị trộn lẫn.

**Rate Limiting quản lý đầu vào (Ingress).** Nó giải quyết vấn đề "lưu lượng quá nhiều, có cho vào hết không". Chẳng hạn lúc Flash Sale có 100 nghìn request ập vào cùng lúc trong khi hệ thống chỉ gánh được 10 nghìn, bắt buộc phải chặn bớt ở cổng vào.

**Ngắt mạch (Circuit Breaker) quản lý hạ nguồn (Downstream).** Nó giải quyết vấn đề "hạ nguồn đã chậm hoặc sập rồi, có gọi tiếp không". Nếu cứ gọi tiếp thì hạ nguồn không gượng dậy nổi mà bản thân mình cũng bị kéo sập theo.

**Giáng cấp quản lý kết quả trả ra.** Nó giải quyết vấn đề "request bị Rate Limiting chặn, hạ nguồn bị ngắt mạch hoặc nghiệp vụ ném lỗi thì tiếp theo trả gì cho người dùng". Có thể trả về giá trị mặc định, dữ liệu Cache, trang tĩnh, hoặc tắt bớt một tính năng không cốt lõi.

Nói bình dân hơn một chút:

- **Rate Limiting**: Đừng để quá nhiều request tràn vào
- **Ngắt mạch (Circuit Breaker)**: Đừng đấm tiếp vào hạ nguồn đang gặp sự cố nữa
- **Giáng cấp**: Gặp sự cố thì đổi sang cách khác nhẹ hơn để tiếp tục phục vụ
- **Dự phòng giáng cấp (Fallback)**: Kết quả an toàn thực sự trả về cho bên gọi

Fallback không phải một chiến lược quản trị đứng độc lập, mà giống như "hành động chốt chặn cuối cùng" sau khi Rate Limiting, Ngắt mạch (Circuit Breaker) hoặc giáng cấp được kích hoạt.

> Ví dụ minh họa: Hãy tưởng tượng hệ thống như một trung tâm thương mại. Rate Limiting là kiểm soát số người bước vào trung tâm, đông quá thì phải xếp hàng ngoài cửa; giáng cấp là tạm thời đóng khu ẩm thực và rạp chiếu phim, nhưng khu thiết yếu như siêu thị, hiệu thuốc vẫn mở cửa bán; còn Ngắt mạch là phát hiện một nhà cung cấp đang gặp trục trặc, tạm ngừng đặt hàng từ nhà cung cấp đó, lát sau mới đặt thử vài đơn nhỏ xem đã ổn lại chưa.

### Trong một request, chúng phối hợp với nhau như thế nào?

Trên một đường đi request thực tế, Rate Limiting, Ngắt mạch (Circuit Breaker) và giáng cấp thường phát huy tác dụng theo từng tầng:

1. **Rate Limiting tại Gateway / đầu vào**: Khi request vừa đi vào, kiểm tra trước xem lưu lượng đầu vào có vượt ngưỡng chịu tải của hệ thống không. Nếu vượt, trả về ngay "Hệ thống đang bận, vui lòng thử lại sau", không cho lưu lượng dội sâu vào trong.
2. **Rate Limiting nội bộ service**: Một số request đã qua được Gateway, nhưng Thread Pool, Connection Pool hoặc Database của riêng một service nào đó sắp quá tải, lúc này bên trong service cũng có thể tự đặt Rate Limiting để bảo vệ tài nguyên trọng yếu của mình.
3. **Kiểm tra Circuit Breaker**: Trước khi service gọi xuống hạ nguồn, kiểm tra xem dịch vụ hạ nguồn đó có đang ở trạng thái ngắt mạch (`Open`) hay không. Nếu đã ngắt mạch thì không gọi tiếp nữa, đi thẳng vào nhánh Dự phòng giáng cấp (Fallback).
4. **Thực thi nghiệp vụ & Dự phòng giáng cấp (Fallback)**: Khi gọi hạ nguồn thất bại, code nghiệp vụ ném ngoại lệ hoặc request bị quy tắc chặn lại, hệ thống trả về kết quả Fallback đã chuẩn bị sẵn — như danh sách rỗng, dữ liệu Cache, đối tượng mặc định hoặc trang tĩnh.

Tóm tắt một câu: **Rate Limiting chặn cổng vào, Ngắt mạch (Circuit Breaker) cắt hạ nguồn lỗi, Giáng cấp bảo vệ luồng lõi, và Fallback trả về kết quả chốt chặn.**

![Quy trình bảo vệ request](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-request-protection--ba6e9c6d.png)

### Ví dụ tối giản bằng Annotation của Sentinel

Ở ví dụ dưới đây, bạn chỉ cần nắm rõ sự phân công giữa `blockHandler` và `fallback`:

```java
@RestController
public class OrderController {

    @SentinelResource(
        value = "createOrder",
        blockHandler = "createOrderBlockHandler",
        fallback = "createOrderFallback",
        exceptionsToIgnore = {IllegalArgumentException.class}
    )
    @PostMapping("/order")
    public OrderVO createOrder(@RequestBody OrderDTO dto) {
        return orderService.create(dto);
    }

    // Vào blockHandler khi quy tắc Sentinel kích hoạt (Rate Limiting, Ngắt mạch, bảo vệ hệ thống)
    public OrderVO createOrderBlockHandler(OrderDTO dto, BlockException ex) {
        return OrderVO.degraded("Quá nhiều yêu cầu đặt hàng lúc này, vui lòng thử lại sau");
    }

    // Ngoại lệ nghiệp vụ đi vào fallback
    // Chữ ký hàm cần khớp với hàm gốc, hoặc thêm một tham số Throwable
    public OrderVO createOrderFallback(OrderDTO dto, Throwable t) {
        return OrderVO.failure("Đặt hàng thất bại, vui lòng thử lại sau");
    }
}
```

Có mấy điểm cần nói cho thật rõ:

`blockHandler` xử lý các ngoại lệ do Sentinel chặn lại, tức `BlockException` khi kích hoạt Rate Limiting, Ngắt mạch (Circuit Breaker) hoặc bảo vệ hệ thống. `fallback` xử lý ngoại lệ do chính code nghiệp vụ ném ra, như lỗi gọi dịch vụ từ xa hay RuntimeException. Chữ ký hàm của nó phải giống hệt hàm gốc, hoặc thêm một tham số `Throwable`.

Nếu cấu hình đồng thời cả `blockHandler` và `fallback`, ngoại lệ do quy tắc Sentinel kích hoạt sẽ chỉ đi vào `blockHandler`, tuyệt đối không đi vào `fallback`. Chỗ này rất dễ viết nhầm.

Ngoài ra, không phải ngoại lệ nghiệp vụ nào cũng nên đưa vào Fallback. Ví dụ kiểm tra tham số không hợp lệ, không đủ quyền, hết hàng tồn kho — những lỗi này vốn dĩ phải báo rõ cho phía thượng nguồn biết, không nên gom chung vào một kết quả Dự phòng giáng cấp kiểu "Hệ thống đang bận". Những ngoại lệ dạng này có thể loại trừ bằng `exceptionsToIgnore`.

## Có những giải pháp có sẵn nào?

Trong hệ sinh thái Spring Cloud, các giải pháp Ngắt mạch (Circuit Breaker), Rate Limiting và giáng cấp phổ biến gồm mấy cái tên sau:

- **Hystrix 1.5.18**: Công cụ kỳ cựu, rất nhiều dự án Spring Cloud Netflix đời đầu từng sử dụng. Nhưng nó đã chuyển sang chế độ bảo trì (Maintenance Mode), không còn phát triển tính năng mới, các dự án mới thường không nên chọn nữa.
- **Sentinel 1.8.x**: Thành phần quản trị lưu lượng mã nguồn mở của Alibaba, rất phổ biến trong các dự án Spring Cloud Alibaba. Nó không chỉ có Ngắt mạch, mà còn bao gồm Rate Limiting, Traffic Shaping, Rate Limiting theo tham số nóng (Hot Parameter), bảo vệ thích ứng toàn hệ thống (System Adaptive Protection), v.v.
- **Resilience4j 2.x**: Thư viện chịu lỗi gọn nhẹ, chia module rất mịn, gồm Circuit Breaker, Rate Limiter, Retry và cô lập Bulkhead. Các dự án Spring Boot 3 / Java 17+ thường cân nhắc sử dụng.
- **Spring Retry**: Chủ yếu giải quyết bài toán Retry, bản thân không phải một framework Ngắt mạch và giáng cấp đầy đủ. Thường dùng kết hợp với Spring Cloud CircuitBreaker hoặc chiến lược Timeout của nghiệp vụ.

Không nên đóng cứng số phiên bản. Cả Sentinel và Resilience4j vẫn đang tiếp tục cập nhật; bài viết này dựa trên các bản Release có thể tra cứu tại thời điểm viết, cụ thể hãy đối chiếu theo trang GitHub Release và bảng tương thích phiên bản của từng dự án.

### Chọn lựa giữa Hystrix, Sentinel và Resilience4j như thế nào?

Đừng vội học thuộc lòng bảng tính năng ngay từ đầu, hãy đánh giá theo hoàn cảnh dự án trước.

**Dự án cũ đang dùng Hystrix: Nếu vẫn chạy ổn định thì khoan đập đi ngay, nhưng phải lên kế hoạch di dời (Migration).**

Hystrix thời hoàng kim từng cực kỳ phổ biến — chính nó là thư viện đưa các khái niệm Thread-pool Isolation, Ngắt mạch (Circuit Breaker) và Fallback trở nên thịnh hành. Tuy nhiên Netflix đã thông báo chính thức rằng Hystrix hiện ở chế độ bảo trì, không còn phát triển tích cực.

Nếu dự án cũ đã tích hợp Hystrix và đang vận hành ổn định, không cần vì chạy theo "công nghệ mới" mà vội vã viết lại toàn bộ. Chỉ cần hệ thống ổn định thì cứ tiếp tục dùng, đồng thời đưa kế hoạch di dời vào lộ trình nâng cấp Spring Boot / Spring Cloud sau này. Nhưng với dự án mới thì không cần bắt đầu bằng Hystrix nữa, vì sau này khi nâng cấp Java, Spring Boot, Spring Cloud, chi phí tương thích sẽ ngày càng nặng.

**Dự án Spring Cloud Alibaba / Dubbo: Ưu tiên xem xét Sentinel.**

Điểm mạnh của Sentinel không đơn thuần là "ngắt được mạch", mà nằm ở bộ năng lực quản trị lưu lượng khá toàn diện: hỗ trợ Rate Limiting, Ngắt mạch và giáng cấp, Rate Limiting tham số nóng, bảo vệ thích ứng hệ thống, lại có giao diện Dashboard xem giám sát thời gian thực và cấu hình quy tắc. Với hệ sinh thái Spring Cloud Alibaba hay Dubbo, chi phí tích hợp thường thấp hơn.

Nhưng cũng đừng coi Sentinel Dashboard là Configuration Center cho production. Dashboard phù hợp hơn để quản trị quy tắc và xem hiệu ứng tức thời; trên production vẫn cần nối vào Nacos, Apollo hoặc nguồn dữ liệu khác để lưu bền vững (Persistence), nếu không khi khởi động lại có thể mất hết quy tắc.

**Dự án mới Spring Boot 3 / Java 17+: Có thể ưu tiên xem xét Resilience4j.**

Đặc trưng của Resilience4j là nhẹ và phân tách module rõ ràng. Cần Ngắt mạch thì nhúng `CircuitBreaker`; cần Rate Limiting thì nhúng `RateLimiter`; cần Retry thì nhúng `Retry`; cần cô lập thì nhúng `Bulkhead`.

Nó kết hợp tự nhiên hơn với lập trình hàm (Functional Programming), Reactor và Spring Boot 3. Nếu dự án của bạn chạy Spring Boot 3, Java 17+ và không phụ thuộc vào hệ sinh thái Spring Cloud Alibaba, Resilience4j thường là lựa chọn gọn gàng hơn.

### So sánh nhanh

| Tiêu chí                   | Sentinel                                            | Hystrix                          | Resilience4j                              |
| -------------------------- | --------------------------------------------------- | -------------------------------- | ----------------------------------------- |
| **Trạng thái bảo trì**     | Bảo trì tích cực                                    | Chế độ bảo trì (Maintenance)     | Bảo trì tích cực                          |
| **Định vị chính**          | Thành phần quản trị lưu lượng                       | Thư viện ngắt mạch & giáng cấp   | Thư viện chịu lỗi gọn nhẹ                 |
| **Khả năng ngắt mạch**     | Tỷ lệ gọi chậm, tỷ lệ ngoại lệ, số lượng ngoại lệ   | Chủ yếu dựa vào tỷ lệ ngoại lệ   | Tỷ lệ ngoại lệ, gọi chậm, số ngoại lệ, v.v. |
| **Khả năng Rate Limiting** | Mạnh, hỗ trợ QPS, Thread đồng thời, tham số nóng    | Khá yếu                          | Có module `RateLimiter`                   |
| **Khả năng cô lập**        | Giới hạn số Thread đồng thời                        | Cô lập Thread Pool / Semaphore   | `SemaphoreBulkhead` / `ThreadPoolBulkhead` |
| **Điều phối lưu lượng**    | Hỗ trợ Warm Up, xếp hàng đều (Rate Limiter Queue)   | Không nổi bật                    | Không nổi bật                             |
| **Bảo vệ thích ứng hệ thống** | Có hỗ trợ                                        | Không hỗ trợ                     | Không hỗ trợ                              |
| **Console / Giao diện**    | Có Sentinel Dashboard                               | Hystrix Dashboard đã lỗi thời    | Thường tự tích hợp vào hệ thống giám sát  |
| **Kịch bản phù hợp**       | Spring Cloud Alibaba, Dubbo, dự án Java phổ biến    | Dự án cũ hiện hữu                | Spring Boot 3, Java 17+, dự án gọn nhẹ    |

Người mới chỉ cần nhớ ba điểm: dự án Hystrix cũ đang chạy ổn thì chưa cần vội đụng vào nhưng cần lên lộ trình chuyển đổi; dự án Spring Cloud Alibaba / Dubbo ưu tiên Sentinel; dự án mới Spring Boot 3 / Java 17+ có thể ưu tiên Resilience4j.

### Hiểu chiến lược cô lập (Isolation) như thế nào?

Ngắt mạch (Circuit Breaker) chỉ là "ngừng gọi tiếp xuống hạ nguồn đang lỗi", còn cô lập giải quyết bài toán "đừng để một dịch vụ phụ thuộc ăn sạch toàn bộ tài nguyên".

**Cô lập bằng Thread Pool (Thread-Pool Isolation)**: Cấp riêng một Thread Pool cho một dịch vụ hạ nguồn nào đó. Chẳng hạn khi service đơn hàng gọi sang service tồn kho, cho toàn bộ lời gọi tồn kho chạy qua Thread Pool riêng. Nếu service tồn kho chậm lại, tối đa chỉ làm đầy Thread Pool đó chứ không kéo chết Thread Pool chính của service đơn hàng. Ưu điểm là cô lập triệt để hơn; nhược điểm là chi phí cao hơn — nhiều Thread sẽ sinh chi phí chuyển đổi ngữ cảnh (Context Switch), kích thước Thread Pool cũng khó ước lượng và P99 có thể xấu đi. Hystrix mặc định sử dụng Thread-Pool Isolation.

**Cô lập bằng Semaphore (Semaphore Isolation)**: Giới hạn số lượng request được phép đi vào đồng thời. Ví dụ cho phép tối đa 100 request cùng lúc gọi service tồn kho, vượt quá thì từ chối hoặc Dự phòng giáng cấp (Fallback) ngay. Ưu điểm là nhẹ, không cần đẩy lời gọi nghiệp vụ sang Thread Pool khác. Nhược điểm là nếu lời gọi hạ nguồn bị treo/block luôn thì Thread nghiệp vụ vẫn bị giữ kẹt, nên thường phải dùng kèm kiểm soát Timeout chặt chẽ. Cơ chế giới hạn số Thread đồng thời của Sentinel gần với tư tưởng Semaphore Isolation hơn.

> Cái giá của Thread-Pool Isolation không phải là "quét GC" như nhiều người vẫn lầm tưởng, mà là Context Switching. Khi số lượng Thread quá nhiều, CPU phải liên tục lập lịch, đánh thức và tạm dừng giữa các Thread, làm CPU hệ thống (`sy`) tăng vọt và kéo tụt độ trễ đuôi P99. Mức độ nghiêm trọng thế nào phải dựa vào số Thread, tỷ lệ CPU `sy/us`, thời gian chờ hàng đợi và chỉ số P99, đừng phán đoán theo cảm tính.

![So sánh chiến lược cô lập (Isolation)](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-availability/fallback-and-circuit-breaker-isolation-strategy--7d38074c.png)

### Bảo vệ thích ứng hệ thống (System Adaptive Protection) của Sentinel là gì?

Rate Limiting thông thường hay đặt thủ công một ngưỡng cố định, ví dụ QPS vượt 1000 thì chặn. Nhưng hệ thống thực tế không đơn giản như vậy: CPU, Load, RT, số Thread và QPS đầu vào đều ảnh hưởng tới việc hệ thống đã tiệm cận giới hạn hay chưa.

System Adaptive Protection của Sentinel sinh ra để giải quyết bài toán này: không chỉ nhìn vào một API đơn lẻ, mà đứng từ góc độ tải toàn hệ thống để quyết định có từ chối bớt một phần request hay không. Tài liệu chính thức nói ý tưởng này lấy cảm hứng từ TCP BBR, mục tiêu là duy trì thông lượng cao trong khi vẫn đảm bảo độ tin cậy của hệ thống. Tuy vậy đừng hiểu nó thành thuật toán TCP BBR hoàn chỉnh — Sentinel chỉ mượn tư tưởng đó rồi kết hợp thống kê thời gian thực với ngưỡng quy tắc để bảo vệ, chứ không dò băng thông động và điều chỉnh cửa sổ tắc nghẽn như TCP.

Có thể hiểu sơ lược như công thức:

**`Số request đồng thời hiện tại > QPS tối đa của hệ thống × RT tối thiểu`**

Nếu số request đang xử lý (in-flight) đã vượt quá sức chứa ước tính của hệ thống, Sentinel bắt đầu từ chối bớt một phần lưu lượng. Quy tắc hệ thống (SystemRule) còn có thể cấu hình theo các chỉ số sau:

| Chỉ số                 | Ý nghĩa                          | Cách dùng phổ biến                                       |
| ---------------------- | -------------------------------- | -------------------------------------------------------- |
| **Load**               | Giá trị `load1` trên Linux       | Kích hoạt bảo vệ khi Load vượt rõ rệt số nhân CPU        |
| **Average RT**         | Thời gian phản hồi trung bình đầu vào | Bảo vệ hệ thống khi độ trễ trung bình liên tục tăng |
| **Concurrent Threads** | Số request đang xử lý đồng thời  | Ngăn tài nguyên Thread bị dùng cạn                       |
| **Ingress QPS**        | Lưu lượng đi vào tại cổng        | Kiểm soát áp lực tổng thể ở đầu vào                      |

Có một cái bẫy cần chú ý: quy tắc hệ thống của Sentinel nhìn vào Average RT chứ không phải P99. Giá trị trung bình sẽ che khuất độ trễ đuôi dài (Tail Latency), nên môi trường production tốt nhất phải gắn thêm giám sát P99, P999, Thread Pool, Connection Pool và tỷ lệ lỗi.

### Gợi ý lựa chọn giải pháp

| Kịch bản                             | Giải pháp khuyến nghị                        | Lý do                                                           |
| ------------------------------------ | -------------------------------------------- | --------------------------------------------------------------- |
| Dự án Hystrix hiện hữu               | Tiếp tục dùng tạm, lên kế hoạch di dời       | Không thay thế chỉ để cho mới, ưu tiên tính ổn định trước tiên  |
| Dự án Spring Cloud Alibaba           | Sentinel                                     | Tương thích tốt hệ sinh thái, Dashboard và mô hình Rule đầy đủ  |
| Dự án Dubbo                          | Sentinel                                     | Khả năng tích hợp và quản trị lưu lượng đã chín muồi            |
| Dự án mới Spring Boot 3 / Java 17+   | Resilience4j hoặc Sentinel                   | Resilience4j gọn nhẹ hơn, Sentinel quản trị lưu lượng toàn diện |
| Chỉ cần mỗi cơ chế Retry             | Spring Retry / Resilience4j Retry            | Đừng kéo cả một framework quản trị lớn chỉ để dùng Retry        |
| Cần bảo vệ quá tải mức toàn hệ thống | Sentinel, hoặc Gateway / Service Mesh / tự xây | Toàn diện nhất trong ba công cụ, nhưng không phải lựa chọn duy nhất |

Nếu team đã dùng sẵn Nacos và Spring Cloud Alibaba thì chi phí triển khai Sentinel sẽ thấp hơn. Nếu team theo hướng Spring Boot 3 thuần, Micrometer và Prometheus thì Resilience4j thường tự nhiên và khớp nhịp hơn.

### Cần chú ý gì khi di dời (Migrate) từ Hystrix sang Sentinel?

Chuyển đổi một dự án cũ từ Hystrix sang Sentinel không đơn thuần là thay đổi mấy cái Annotation.

**1. Phải tách riêng phần Fallback.** Trong Hystrix, nhiều dự án chỉ có duy nhất một `fallbackMethod`; Rate Limiting, Ngắt mạch (Circuit Breaker) và lỗi nghiệp vụ cuối cùng đều chạy chung vào một hàm Dự phòng giáng cấp. Sang Sentinel phải tách bạch rõ: `blockHandler` xử lý phần bị quy tắc Sentinel chặn (Rate Limiting, Ngắt mạch, bảo vệ hệ thống), còn `fallback` xử lý ngoại lệ do code nghiệp vụ ném ra. Khi migrate cần tách phần logic fallback cũ ra, đừng trộn lẫn làm một.

**2. Mô hình cô lập (Isolation) khác nhau.** Hystrix mặc định dùng Thread-Pool Isolation, nên rất nhiều lời gọi thực chất chạy bên trong Thread Pool của Hystrix. Sentinel thường dùng kiểm soát số Thread đồng thời, không tự động đẩy lời gọi hạ nguồn sang một Thread Pool tách biệt. Sau khi migrate phải rà soát lại Timeout, ngắt luồng (Interruption) và cô lập Thread Pool — đặc biệt với các dịch vụ hạ nguồn chạy chậm, nếu không có kiểm soát Timeout riêng thì chỉ dựa vào giới hạn số Thread đồng thời của Sentinel là chưa đủ.

**3. Cách cấu hình quy tắc (Rules) khác nhau.** Hystrix thường viết nhiều cấu hình cứng ngay trong code hoặc file config. Sentinel khuyến khích động hóa các quy tắc, chẳng hạn quản lý qua Dashboard rồi nối với nguồn dữ liệu như Nacos, Apollo để lưu bền vững và đẩy cấu hình. Trên môi trường production đừng chỉ dựa vào quy tắc lưu trên bộ nhớ của Dashboard, nếu không khi service hoặc console khởi động lại sẽ có nguy cơ mất quy tắc.

**4. Phải đấu nối lại hệ thống giám sát.** Thời Hystrix thường dùng cặp Hystrix Dashboard + Turbine. Khi chuyển sang Sentinel, bạn có thể dùng Sentinel Dashboard để xem lời gọi thời gian thực và hiệu ứng quy tắc trước, nhưng trên production vẫn cần đẩy chỉ số vào Prometheus, Grafana hoặc nền tảng giám sát nội bộ công ty. Nếu có dùng Cluster Rate Limiting thì còn phải tính thêm việc triển khai và tính sẵn sàng cho Token Server.

> Quá trình migrate tốt nhất nên làm đồng thời cùng đợt nâng cấp phiên bản lớn của Spring Boot / Spring Cloud, tách riêng ra làm lẻ rất dễ dính lỗi xung đột tương thích. Nếu hệ thống cũ có Annotation Hystrix rải khắp nơi, bạn có thể thử dùng trước [Hystrix adapter](https://github.com/alibaba/Sentinel/tree/master/sentinel-adapter/sentinel-hystrix) của Sentinel để làm bước đệm chuyển tiếp, nhưng cũng nhớ kiểm tra tình trạng bảo trì hiện tại của adapter này rồi mới quyết định.

### Tóm kết

Các dự án mới nhìn chung không nên chọn Hystrix nữa vì nó đã bước vào chế độ bảo trì, phù hợp hơn với vai trò phương án chuyển tiếp trên hệ thống cũ. Nếu dự án nằm trên tuyến công nghệ Spring Cloud Alibaba, Nacos, Dubbo thì Sentinel thường thuận tay hơn. Nếu là dự án mới Spring Boot 3 / Java 17+ và đội ngũ thiên về hệ sinh thái Micrometer, Prometheus, Reactor thì Resilience4j sẽ nhẹ nhàng hơn.

Khi lựa chọn thực tế, đừng chỉ nhìn xem "công cụ nào nhiều tính năng hơn", mà hãy xét đến bộ công nghệ (Tech Stack) của team, phiên bản Spring Cloud, hệ thống giám sát, nhu cầu đẩy quy tắc động và việc ai sẽ là người vận hành bảo trì về lâu dài.
