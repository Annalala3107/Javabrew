---
title: "State Machine và Điều phối quy trình (Workflow Orchestration): Lựa chọn giải pháp, Tác vụ song song và Thực thi tin cậy"
description: Phân biệt trách nhiệm giữa State Machine và điều phối quy trình (Workflow Orchestration), hiểu về chuyển trạng thái có điều kiện, hội tụ nhánh song song, phiên bản quy trình, tính lũy đẳng (Idempotency) của tác vụ, thử lại và bù trừ (Compensation), cùng chi phí tự xây dựng Engine.
category: Thiết kế hệ thống (System Design)
tag:
  - Thiết kế hệ thống
  - State Machine
  - Workflow
head:
  - - meta
    - name: keywords
      content: State Machine,FSM,Điều phối quy trình,Workflow,Parallel Gateway,Tính lũy đẳng tác vụ,Phiên bản quy trình,Bù trừ lỗi
lang: vi
sourceRef: zh-ref/system-design/state-machine-and-workflow.md
---

Các nghiệp vụ như thanh toán đơn hàng, xét duyệt hậu mãi hay kiểm tra hàng hóa đều cần trả lời hai câu hỏi: hiện tại đang ở trạng thái nào, và bước tiếp theo được phép làm gì? Khi một nghiệp vụ còn bao gồm nhiều tác vụ, nhánh điều kiện và chờ bất đồng bộ (asynchronous wait), hệ thống cũng cần biết tác vụ nào đã hoàn thành và tác vụ nào có thể tiếp tục thực thi.

**State Machine phù hợp để biểu đạt các quy tắc chuyển đổi trạng thái, còn điều phối quy trình (Workflow Orchestration) tập trung vào việc tổ chức các tác vụ và quan hệ phụ thuộc giữa chúng.** Hai cách tiếp cận này có thể dùng kết hợp: Workflow Engine điều phối lịch chạy tác vụ, còn bên trong mỗi tác vụ dùng State Machine để ràng buộc sự thay đổi giữa các trạng thái như "chờ thực thi, đang thực thi, thành công, thất bại".

## State Machine giải quyết vấn đề gì?

Một State Machine nghiệp vụ phổ biến gồm các thành phần sau:

| Thành phần | Vai trò | Ví dụ yêu cầu hậu mãi |
| --- | --- | --- |
| Trạng thái (State) | Mô tả giai đoạn nghiệp vụ hiện tại | Chờ duyệt, Chờ hoàn tiền, Đã hoàn tiền, Đã từ chối |
| Sự kiện (Event) | Kích hoạt một lần chuyển đổi trạng thái | Duyệt đạt, Từ chối duyệt, Hoàn tiền thành công |
| Chuyển tiếp (Transition) | Định nghĩa các đường đi hợp lệ giữa các trạng thái | Chờ duyệt khi nhận sự kiện Duyệt đạt sẽ chuyển sang Chờ hoàn tiền |
| Điều kiện bảo vệ (Guard) | Kiểm tra hiện tại có được phép chuyển trạng thái hay không | Hồ sơ duyệt đầy đủ và số tiền hoàn hợp lệ |
| Hành động (Action) | Thao tác thực hiện trong quá trình chuyển trạng thái | Lưu kết quả duyệt, tạo tác vụ hoàn tiền |

Cách làm này giúp gom các đoạn kiểm tra trạng thái vốn rải rác ở nhiều API vào một bộ quy tắc thống nhất. Ví dụ, một yêu cầu đã hoàn tiền rồi nếu nhận lại sự kiện "Duyệt đạt" thì không thể tạo thêm một lệnh hoàn tiền mới.

Tuy nhiên, **có sơ đồ trạng thái không đồng nghĩa với việc đã có kiểm soát đồng thời (Concurrency Control)**. Hai request có thể đồng thời đọc được trạng thái "Chờ duyệt", rồi lần lượt thử duyệt hoặc từ chối. Khi lưu xuống tầng bền vững, vẫn phải thông qua cập nhật có điều kiện (conditional update), số phiên bản (version) hoặc khóa giao dịch (transaction lock) để tranh chấp cùng một lần chuyển tiếp, đồng thời kiểm tra kết quả cập nhật. Bản ghi chống trùng lặp sự kiện cũng phải được gắn kết đáng tin cậy với thay đổi trạng thái nghiệp vụ.

State Machine cũng không bị giới hạn chỉ chạy tuyến tính. Chuyển tiếp có điều kiện có thể biểu đạt phân nhánh; State Machine phân cấp có thể biểu đạt trạng thái lồng nhau; một số framework còn cung cấp nhiều vùng song song (Regions), rẽ nhánh (Fork) và hội tụ (Join). Chẳng hạn [Spring Statemachine](https://docs.spring.io/spring-statemachine/docs/current/reference/) cung cấp sẵn các năng lực như Guard, Regions, Fork, Join. Điều thực sự cần đánh giá là năng lực biểu đạt và chi phí bảo trì của giải pháp triển khai được chọn, chứ không nên xem giới hạn của một cách cài đặt đơn giản là giới hạn chung của State Machine.

## Khi nào cần điều phối quy trình (Workflow Orchestration)?

Giả sử một sản phẩm trước khi nhập kho phải hoàn tất cả "kiểm tra chức năng" và "chụp ảnh ngoại quan"; nếu kiểm tra không đạt còn phải chuyển sang sửa chữa lại (rework). Nếu nhồi tất cả các tổ hợp vào một trường trạng thái duy nhất, sẽ phát sinh các trạng thái tổ hợp như "kiểm tra xong nhưng chưa chụp ảnh", "chụp ảnh xong nhưng chưa kiểm tra". Khi nghiệp vụ tiếp tục thêm tác vụ, cách biểu đạt này sẽ ngày càng khó bảo trì.

Ta có thể tách trạng thái tổng thể của sản phẩm ra khỏi tiến độ thực thi từng tác vụ: ghi nhận riêng tác vụ kiểm tra, chụp ảnh, sửa chữa lại, và để bộ điều phối (Orchestrator) quyết định khi nào các tác vụ tiếp theo sẵn sàng chạy.

| Đặc trưng nghiệp vụ | Phương án nên ưu tiên cân nhắc | Năng lực cần xác nhận thêm |
| --- | --- | --- |
| Ít trạng thái, quy tắc thay đổi ổn định | State Machine hoặc bảng chuyển trạng thái quản lý tập trung | Cập nhật đồng thời, chống trùng sự kiện, lưu bền vững trạng thái |
| Các bước xử lý cố định trong một request | Code thông thường, Chain of Responsibility hoặc Pipeline | Lan truyền ngoại lệ, Timeout, phụ thuộc giữa các bước |
| Tác vụ kéo dài qua nhiều request, nhiều service | Điều phối quy trình hỗ trợ lưu bền vững | Khôi phục thực thi, chờ bất đồng bộ, Retry và bù trừ (Compensation) |
| Duyệt thủ công, leo thang quá hạn, cấu hình trực quan | Workflow Engine có năng lực tương ứng | Phân công tác vụ, phân quyền, lịch sử thực thi, chuyển đổi phiên bản |

Bản thân tên gọi "điều phối quy trình" không tự đảm bảo khả năng thực thi tin cậy. Có những thành phần chỉ quản lý thứ tự gọi trong bộ nhớ tiến trình mà không lưu bền vững tiến độ. Khi chọn công nghệ, cần dùng quy trình thực tế để kiểm chứng khả năng khôi phục sau khởi động lại, nhánh song song, thử lại khi lỗi và can thiệp thủ công, thay vì chỉ so sánh xem hỗ trợ bao nhiêu loại node.

## Cần tách biệt Định nghĩa quy trình và Instance thực thi

Một quy trình có thể cấu hình tối thiểu cần phân biệt các nhóm thông tin sau (chúng không nhất thiết phải tương ứng 1-1 với bảng trong Database):

- **Mẫu node (Node Template)**: Mô tả năng lực thực thi cùng đầu vào/đầu ra của một loại tác vụ, ví dụ kiểm tra hình ảnh.
- **Định nghĩa quy trình (Process Definition)**: Mô tả các node, quan hệ phụ thuộc, quy tắc phân nhánh, Timeout và chính sách Retry, đồng thời có phiên bản (version) rõ ràng.
- **Instance quy trình (Process Instance)**: Đại diện cho một lần chạy quy trình của một chứng từ nghiệp vụ cụ thể, gắn chặt với phiên bản định nghĩa được chọn lúc khởi tạo.
- **Instance node hoặc Instance tác vụ**: Ghi nhận tác vụ cụ thể trong lần chạy đó gồm đầu vào, đầu ra, trạng thái và số lần thử. Khi cùng một node chạy lặp nhiều vòng, phải phân biệt được các vòng khác nhau.
- **Sự kiện và nhật ký thực thi**: Ghi nhận nguồn kích hoạt, kết quả xử lý và ngoại lệ để phục vụ chống trùng lặp, khôi phục và điều tra sự cố.

Định nghĩa quy trình đã phát hành phải giữ bất biến (immutable); khi sửa đổi cần phát hành phiên bản mới. Các instance cũ có thể tiếp tục chạy theo phiên bản cũ; nếu muốn chuyển đổi sang phiên bản mới (migration), bắt buộc phải làm rõ ánh xạ node hiện tại, chuyển đổi biến và các tác động phụ nghiệp vụ đã phát sinh. Chỉ đổi mỗi số phiên bản trên instance có thể khiến tác vụ đang chạy dở rơi vào một node không tồn tại hoặc không tương thích.

## Làm sao để hội tụ (Join) các nhánh song song một cách chính xác?

Lấy ví dụ chỉ được nhập kho sau khi cả kiểm tra lẫn chụp ảnh đều xong: bộ điều phối không thể chỉ đơn giản "nhận đủ hai message hoàn thành là đi tiếp", vì hai message đó có thể là thông báo trùng lặp của cùng một tác vụ.

Có thể thiết kế theo các bước sau:

1. Khi tạo các nhánh của vòng hiện tại, ghi nhận lại ID tác vụ kiểm tra và ID tác vụ chụp ảnh cần chờ.
2. Khi nhận được sự kiện hoàn thành, cập nhật lũy đẳng (idempotent) cho tác vụ tương ứng để sự kiện lặp lại không làm tăng số lượng tác vụ đã xong.
3. Tuần tự hóa việc kiểm tra và thúc đẩy điều kiện hội tụ của vòng hiện tại — ví dụ khóa cùng một bản ghi hội tụ trong Transaction trước khi đọc tình trạng hoàn thành; sau khi toàn bộ tác vụ bắt buộc đều thành công, dùng ràng buộc duy nhất (Unique Constraint) để đảm bảo chỉ sinh ra tác vụ nhập kho đúng một lần. Nếu dùng khóa lạc quan (Optimistic Lock), bên tranh chấp thất bại phải thử kiểm tra lại chứ không được bỏ qua sự kiện.
4. Định nghĩa quy tắc xử lý rõ ràng cho trường hợp thất bại, hủy bỏ, quá hạn và sửa chữa lại, tránh chờ vô hạn cũng như tránh tính nhầm kết quả kiểm tra của vòng trước vào vòng hiện tại.

Chỉ dùng riêng Unique Constraint có thể ngăn việc tạo trùng tác vụ kế tiếp, nhưng không đảm bảo quy trình chắc chắn được đẩy đi tiếp: nếu hai Transaction chạy đồng thời đều không nhìn thấy tác vụ bên kia vừa hoàn tất, cả hai đều có thể đánh giá "chưa đủ điều kiện". Vì vậy vẫn cần cơ chế kiểm soát đồng thời thống nhất tại điểm hội tụ, đồng thời có thể kiểm tra lại thông qua gửi lại sự kiện hoặc quét khôi phục (recovery scan) sau khi tiến trình bị gián đoạn.

Cũng cần phân biệt nhánh điều kiện và nhánh song song. Nhánh loại trừ (Exclusive Gateway) chỉ đi theo một đường được chọn và ở cuối không thể chờ các nhánh không được chọn; còn nhánh song song (Parallel Gateway) cần chờ đủ các nhánh quy định hoàn tất. Ngữ nghĩa cụ thể của từng Gateway phải dựa theo hiện thực của Engine sử dụng; có thể tham khảo [Tài liệu Workflow Patterns của Camunda](https://docs.camunda.io/docs/components/concepts/workflow-patterns/).

## Tại sao thử lại (Retry) tác vụ vẫn cần Tính lũy đẳng (Idempotency)?

Một lời gọi từ xa bị Timeout có hai khả năng: phía đối tác chưa xử lý, hoặc đã xử lý thành công nhưng phản hồi không về tới nơi. Vì vậy, khi bộ điều phối gửi lại tác vụ, phía thực thi vẫn phải đảm bảo việc gọi lặp lại không dẫn đến trừ tiền lặp, xuất kho lặp hoặc tạo trùng bản ghi nghiệp vụ.

Chẳng hạn [tài liệu Job Worker của Camunda](https://docs.camunda.io/docs/components/concepts/job-workers/) nêu rõ rằng Timeout của tác vụ có thể khiến nhiều Worker cùng xử lý một tác vụ, do đó code thực thi tác vụ cần hỗ trợ tính lũy đẳng.

Khi thiết kế thực thi tin cậy, cần tính đến các tình huống sau:

- **Dùng Idempotency Key ổn định cho cùng một thao tác nghiệp vụ**: Khi Retry phải tái sử dụng ID thao tác nghiệp vụ; với lượt thao tác hợp lệ tiếp theo thì cấp ID mới, không thể chỉ chống trùng theo tên node.
- **Gắn kết tin cậy giữa trạng thái hoàn thành và bước điều phối tiếp theo**: Nếu lưu "hoàn thành" trước rồi mới gửi MQ, tiến trình có thể thoát trước khi kịp gửi message. Có thể đặt trạng thái tác vụ và sự kiện chờ gửi vào cùng một Transaction cục bộ rồi mới gửi bất đồng bộ; phía Consumer chống trùng theo event ID.
- **Phân biệt từ chối nghiệp vụ với lỗi tạm thời**: Các kết quả như tham số không hợp lệ, duyệt không đạt thông thường nên đi theo nhánh nghiệp vụ; lỗi mạng có thể Retry giới hạn kèm cơ chế lùi thời gian (Backoff), vượt ngưỡng thì chuyển sang trạng thái ngoại lệ có thể truy vấn và xử lý.
- **Thiết kế bù trừ (Compensation) theo nghiệp vụ**: Các thao tác bên ngoài đã hoàn tất không hẳn có thể hủy bằng Rollback Database. Các hành động bù trừ như hoàn tiền, giải phóng giữ chỗ, hủy lịch hẹn cũng có thể thất bại nên vẫn cần tính lũy đẳng, Retry và đầu mối xử lý thủ công.

Workflow Engine quản lý tiến độ thực thi, không thể tự động gộp nhiều hệ thống nghiệp vụ thành một Atomic Transaction duy nhất. Về tính nhất quán liên service, có thể đọc tiếp [Giao dịch phân tán (Distributed Transaction)](../distributed-system/distributed-transaction.md).

## Cần đánh giá những chi phí nào trước khi tự xây dựng Engine?

Tách riêng cấu hình quy trình, bộ điều phối và phần thực thi node giúp dễ điều chỉnh độc lập các quy tắc nghiệp vụ và cài đặt tác vụ. Tuy nhiên, một Workflow Engine dùng được trong thực tế còn phải xử lý tiến độ thực thi, khôi phục lỗi và tương thích phiên bản — những năng lực này thường khó bảo trì hơn nhiều so với quan hệ gọi giữa các node.

Trước khi tự xây dựng Engine, ngoài việc điều phối node, cần đánh giá xem có nhân lực duy trì liên tục các hạng mục sau hay không:

- Kiểm tra trước khi phát hành cấu hình để phát hiện node không thể chạm tới, thiếu nhánh thoát, xung đột phân nhánh, vòng lặp không thể kết thúc và đầu vào/đầu ra không hợp lệ.
- Lưu bền vững tiến độ, khôi phục tác vụ bị gián đoạn, giới hạn mức độ đồng thời và xử lý tồn đọng (backlog).
- Quản lý quan hệ tương thích giữa phiên bản quy trình, phiên bản Executor và các instance đang chạy dở.
- Giới hạn quyền năng và tài nguyên thực thi của biểu thức cấu hình, đồng thời lưu vết phát hành, Rollback và thao tác người dùng.
- Hiển thị instance đang kẹt ở bước nào, lý do thất bại, có thể Retry hay không và ai đã can thiệp thủ công.

Nếu độ phức tạp chủ yếu đến từ một số khác biệt nhỏ trong nghiệp vụ, có thể tách trước các interface quy tắc và tác vụ rồi bổ sung dần năng lực điều phối. Việc đưa vào một Engine trưởng thành hay tự phát triển nên được quyết định dựa trên tổng hòa yêu cầu quy trình, chi phí chuyển đổi, năng lực khôi phục sự cố và kết quả kiểm thử chịu tải trong cùng điều kiện.
