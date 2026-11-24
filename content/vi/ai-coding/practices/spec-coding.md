---
title: "Thực chiến Spec Coding: Từ Vibe Coding đến quy chuẩn mã nguồn cho AI"
description: "Tổng hợp có hệ thống tư duy cốt lõi và quy trình triển khai Spec Coding (Lập trình hướng đặc tả), bao gồm sự khác biệt giữa Vibe Coding và Spec Coding, phương pháp triển khai 4 bước, cấu hình file quy chuẩn trong AI IDE, kiểm soát quyền hạn bằng nhãn 3 màu, quản lý Spec phân tầng và kinh nghiệm phòng tránh cạm bẫy khi phối hợp đa agent (Multi-Agent)."
category: Kỹ năng lập trình AI
lang: vi
sourceRef: zh-ref/ai-coding/practices/spec-coding.md
head:
  - - meta
    - name: keywords
      content: Spec Coding,Vibe Coding,Lập trình hướng đặc tả,Quy chuẩn code AI,AI coding,Cursor,Claude Code,Copilot,Phối hợp multi-agent,Phát triển hỗ trợ bởi AI
---

Chào bạn, mình là Tiểu G. Trì hoãn cũng khá lâu rồi, nay mình xin trả nợ bài viết này nhé.

Spec Coding từ khá lâu trước đây đã có nhiều bạn trong nhóm nhắc tới và gợi ý nên viết một bài. Chủ đề này thực sự khá quan trọng, vừa áp dụng được ngay trong công việc, mà các buổi phỏng vấn tuyển dụng cũng đã bắt đầu hỏi tới rồi.

![Độc giả giục viết bài về Spec Coding](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/readers-urging-spec-coding-to-be-written-0e03d257.webp)

Tuần trước khi nói chuyện với đồng nghiệp về Spec Coding, cậu ấy hỏi: "Claude Code giờ đã có thể tự viết code rồi, tại sao vẫn phải mất thời gian viết quy chuẩn kỹ thuật (Spec) làm gì nữa?"

Đây là một câu hỏi rất thực tế. AI viết code công nhận nhanh thật; với Demo, script hay các trang dùng một lần, ta hoàn toàn có thể dùng các ràng buộc lỏng để kiểm chứng nhanh.

Thế nhưng khi áp dụng lối chơi đó vào các dự án nhiều người cùng phối hợp phát triển và bảo trì lâu dài, việc thiếu hụt thông tin sẽ lập tức biến thành rủi ro: phần yêu cầu nào viết chưa rõ ràng thì mô hình AI sẽ tự bù đắp theo phán đoán, các điều kiện biên sẽ được suy diễn theo khuôn mẫu phổ biến, còn các quy ước nội bộ của nhóm về mã lỗi (error code) hay phân quyền có thể còn chẳng bao giờ lọt vào Context. Đầu ra sinh ra dựa trên những pattern mà mô hình học được và ngữ cảnh hiện có, chứ nó không hề tự động khám phá ra các ràng buộc thực tế trong dự án của bạn.

Bài viết này chủ yếu làm rõ ba vấn đề sau:

1. Sự khác biệt thực tế giữa Vibe Coding và Spec Coding, và khi nào nên dùng cái nào
2. Quy trình 4 bước hoàn chỉnh để đưa Spec Coding vào thực tế, từ lúc viết yêu cầu đến khi để AI tuân thủ thực thi
3. Cách cấu hình, quản lý và ngăn chặn AI vượt quyền thông qua Spec trong các AI IDE phổ biến (Cursor, Claude Code, Copilot, v.v.)

## Vibe Coding không phải là không thể dùng

Vibe Coding (lập trình theo cảm hứng/vibe), cốt lõi là đi theo cảm xúc. Bạn chỉ cần ném cho AI một câu ý định mơ hồ, nó sẽ lập tức bắt đầu xả mã nguồn ra.

Khi Karpathy lần đầu tiên đưa ra thuật ngữ này, ý ông muốn nói đến kiểu lập trình cứ quẳng yêu cầu cho AI, thuận theo cảm tính mà tinh chỉnh liên tục, thậm chí tạm thời chẳng thèm bận tâm đến tiểu tiết của code.

Vibe Coding không phải là một "tội lỗi". Trong những ngữ cảnh sau đây, dùng nó ngược lại còn rất phù hợp:

- Muốn kiểm chứng một ý tưởng: viết nhanh một bản Demo xem hiệu quả ra sao
- Viết script dùng một lần: chạy xong việc là vứt bỏ
- Làm các công cụ nội bộ nhỏ lẻ (internal tools), phạm vi ảnh hưởng cực kỳ hẹp
- Sau khi AI viết xong, đã có bộ test đầy đủ bọc lót, và sản phẩm không mở trực tiếp cho người dùng bên ngoài

Trong những trường hợp này, việc cố chấp ngồi viết cả đống Spec lại trở thành lãng phí thời gian.

Vấn đề thực sự nằm ở chỗ: rất nhiều người sau khi kiểm chứng xong ý tưởng thì tiện tay đẩy luôn đoạn code "vibe" đó lên môi trường Production.

Đó lại là một câu chuyện hoàn toàn khác.

Ở giai đoạn Demo, bạn có thể dựa vào cảm tính vì sai thì sửa, hỏng thì xóa đi làm lại. Code Production thì không thể làm thế được, phía sau nó còn kết nối cơ sở dữ liệu, cổng thanh toán, dữ liệu người dùng và chi phí bảo trì của các thành viên khác. Nửa tiếng bạn tiết kiệm được hôm nay rất có thể sẽ biến thành vài ngày cày cuốc điều tra lỗi về sau.

Tiêu chí đánh giá của mình chỉ có đúng một điểm: **Đoạn code này cần tồn tại trong bao lâu?**

- Script **vứt bỏ sau hai ngày**: Vibe là quá đủ. Viết Spec chỉ tổ kéo lùi hiệu suất.
- Vùng lưng chừng **3-5 ngày**: có thể viết Spec dạng tinh gọn (lightweight Spec). Không cần phải trình bày thiết kế đầy đủ, chỉ cần ghi lại các ràng buộc then chốt và tiêu chí nghiệm thu (acceptance criteria), tầm nửa tiếng là xong gọn gàng.
- Code sống **trên một tuần**: chỉ cần có người khác phải bảo trì, dính dáng đến lưu trữ dữ liệu bền vững (persistence), hay gọi API ra bên ngoài, thì tuyệt đối đừng "vibe chay". Tối thiểu phải viết rõ ràng các ràng buộc, biên giới hạn và tiêu chuẩn nghiệm thu.

Hơn nữa, nhiều lúc kết hợp với các bản Spec tinh gọn cũng hoàn toàn ổn thỏa, không cần phải quá máy móc cứng nhắc.

Một bản Spec tinh gọn có thể đơn giản tới mức như thế này:

```markdown
## Mục tiêu nhiệm vụ

Hiện thực hóa API xuất đơn hàng, hỗ trợ xuất file CSV theo khoảng thời gian.

## Ràng buộc then chốt

- Mỗi lần xuất tối đa 5.000 bản ghi
- Khoảng thời gian không được vượt quá 31 ngày
- Bắt buộc kiểm tra quyền của người dùng, chỉ được xuất dữ liệu của tenant hiện tại
- Truy vấn bắt buộc phải trúng composite index `order_tenant_time_idx`
- Khi xuất thất bại phải ghi log nguyên nhân cụ thể, không được chỉ trả về unknown error

## Tiêu chuẩn nghiệm thu

- Xuất CSV thành công, thứ tự các trường khớp với quy ước từ phía Product
- Trả về mã lỗi rõ ràng khi số lượng vượt quá 5.000 bản ghi
- Dữ liệu của tenant khác không được phép xuất ra (ngăn chặn vượt quyền)
- Unit test bao phủ 4 kịch bản: khoảng thời gian trống, thời gian vượt ngưỡng, không có quyền, không có dữ liệu
```

## Spec Coding thực chất là gì?

Spec Coding, dịch sát nghĩa là Lập trình hướng đặc tả (Specification-Driven Programming). Hiểu đơn giản là: viết rõ ràng mọi quy chuẩn đặc tả trước, rồi mới để AI bắt tay vào làm việc.

Bình thường khi bảo AI viết code, nhiều người sẽ ném thẳng một câu kiểu như:

> Làm giúp tôi một hệ thống người dùng (user system).

AI đương nhiên là viết được, trông cũng ra dáng ra hình đấy. Nhưng vấn đề cũng phát sinh từ chính chỗ này: bạn đâu có nói cho nó biết hệ thống người dùng rốt cuộc phải trông như thế nào, nó chỉ đành tự mình đoán mò.

Người dùng đăng ký ra sao? Email có được trùng lặp không? Mật khẩu lưu trữ thế nào? Khi API thất bại thì trả về định dạng gì? Những tính năng nào đợt này chưa cần làm? Admin có quyền vô hiệu hóa (ban) người dùng không? Nếu những thứ này từ đầu không viết rõ, AI sẽ chẳng dừng lại để hỏi bạn đâu, khả năng cao nó sẽ tự tiện đưa ra một phương án mà nó cho là hợp lý.

Công việc của Spec Coding chính là viết sẵn những quy tắc này ra từ trước.

"Spec" ở đây không phải là đôi ba dòng yêu cầu ghi bừa bãi, mà là một bản cam kết kỹ thuật (technical contract) rõ ràng để AI có thể nhìn vào đó mà thực thi. API, cấu trúc dữ liệu, mã lỗi, điều kiện biên, yêu cầu bảo mật, giới hạn tech stack, thậm chí những thao tác nào tuyệt đối cấm đụng vào, tất cả đều phải được ghi rõ trong đó.

Sự khác biệt giữa nó và Vibe Coding cũng nằm ở đúng điểm mấu chốt này.

Vibe Coding giống như việc bạn chỉ vạch ra một hướng đi chung chung rồi để AI tự do múa may. Sau khi code sinh ra xong, bạn mới đi nghiệm thu, sửa bug, chắp vá tiểu tiết. Với các script ngắn gọn, nhanh gọn lẹ thì làm thế chẳng sao, thậm chí còn rất sướng.

Thế nhưng khi dự án phức tạp lên một chút là rất dễ to chuyện. Đến khi bạn phát hiện ra AI hiểu sai ý thì code đã đẻ ra cả đống rồi. Bạn lần mò xem lại cũng rất khó phân định được là do yêu cầu diễn đạt chưa rõ, hay do AI tự ý làm bậy.

Tóm tắt ngắn gọn sự khác biệt giữa Spec Coding và Vibe Coding: **Hành vi của AI là do bạn định nghĩa, hay do nó tự đoán mò?**

## Quy trình 4 bước đưa vào thực tế

Bài viết này áp dụng quy trình 4 bước Specify, Plan, Tasks, Implement từ ví dụ [Spec Kit](https://github.github.com/spec-kit/index.html) của GitHub để minh họa. Đây là một quy trình làm việc mang tính thực tiễn cao, chứ không phải tiêu chuẩn duy nhất bắt buộc mọi công cụ Spec Coding phải tuân theo; một số nhóm có thể gộp giai đoạn thiết kế và chia nhỏ tác vụ lại, một số công cụ còn bổ sung thêm các bước làm rõ (clarification), kiểm chứng hoặc quản lý thay đổi.

| Giai đoạn | Làm gì | Sản phẩm đầu ra | Hành động cốt lõi |
| --- | --- | --- | --- |
| **Specify** | Định nghĩa sản phẩm | `requirements.md` | Làm rõ tính năng, người dùng, điểm đau; xác định "Làm cái gì" |
| **Plan** | Quy hoạch kỹ thuật | `design.md` | Chốt tech stack, kiến trúc, hợp đồng giao tiếp; xác định "Làm như thế nào" |
| **Tasks** | Chia nhỏ nhiệm vụ | `tasks.md` | Bẻ nhỏ thành các tác vụ nguyên tử, viết tiêu chuẩn nghiệm thu |
| **Implement**| AI thực thi | - | AI làm việc theo Spec, con người nghiệm thu |

Hiểu về nó thực ra rất đơn giản, cốt lõi chính là **viết rõ trước sẽ làm gì, tiếp đó viết rõ làm như thế nào, sau đó chia nhỏ công việc, cuối cùng mới giao cho AI thực thi**.

![Quy trình đường ống Spec Coding](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-pipeline-flow-8a20fb26.png)

### Specify: Làm rõ xem sẽ làm cái gì trước

Bước đầu tiên là `Specify`, sản phẩm đầu ra thường là `requirements.md`, hoặc gọi là `spec.md`.

Bước này hơi giống viết PRD, nhưng đối tượng đọc hiểu ở đây lại là AI.

Do đó, nó không thể chỉ viết chung chung về phương hướng, mà bắt buộc phải vạch rõ cả các đường ranh giới nữa.

Ví dụ bạn viết một câu:

> Làm một hệ thống người dùng.

Người đọc thì thấy bình thường, nhưng AI đọc xong là bắt đầu đoán: Người dùng đăng ký thế nào? Email có được trùng không? Mật khẩu có yêu cầu gì? Có làm đăng nhập bên thứ ba không? Admin có được khóa tài khoản không? Bị khóa rồi thì dữ liệu xử lý sao?

Bạn không viết thì nó tự định đoạt.

Cách viết vững chắc hơn sẽ là:

> Hỗ trợ đăng ký và đăng nhập bằng email; email bắt buộc phải là duy nhất; mật khẩu xác thực đơn yếu tố phải có tối thiểu 15 ký tự; tạm thời chưa hỗ trợ đăng nhập bên thứ ba; admin có quyền vô hiệu hóa người dùng; người dùng sau khi bị vô hiệu hóa sẽ không thể đăng nhập nhưng dữ liệu lịch sử vẫn được bảo lưu.

Câu này giúp AI biết rõ việc gì được làm, việc gì không được làm, và những đường ranh giới nào tuyệt đối không được vượt qua.

### Plan: Chốt phương án kỹ thuật

Bước thứ hai là `Plan`, thường sẽ được lưu vào file `design.md` hoặc `plan.md`.

Bước này rất nhiều người bỏ qua, vì nghĩ rằng đằng nào AI cũng biết viết code, cứ để nó tự phát huy là được.

Và rồi vấn đề bắt đầu nảy sinh từ đây.

Bạn không nói rõ dùng phiên bản Java nào, nó có thể phang ngay code Java 8 ra cho bạn; bạn không nói phiên bản Spring Boot, nó có thể dùng cú pháp cũ rích; bạn không quy định định dạng mã lỗi, mỗi API nó lại trả về một kiểu; bạn không nói cách phân tầng, nó có thể nhét thẳng logic nghiệp vụ vào Controller; bạn không quy định quy tắc đặt tên trường trong bảng dữ liệu, nó cũng sẽ tiện tay đặt theo thói quen của riêng nó.

Vì vậy, `design.md` không cần phải viết quá cồng kềnh, nhưng vài ràng buộc then chốt bắt buộc phải chốt cứng trước.

Ví dụ chỉ cần viết ngắn gọn như sau là đã đủ dùng:

```markdown
## Tech Stack

- Ngôn ngữ: Java 21 (LTS)
- Framework: Spring Boot 3.2.x (snapshot của dự án hiện tại; dự án mới chọn theo support matrix tại thời điểm đó)
- Cơ sở dữ liệu: PostgreSQL 16
- Cache: Redis 7.x

## Thiết kế kiến trúc

- Phân tầng: Controller → Service → Repository
- Giao tiếp: REST API + gRPC (dịch vụ nội bộ)
- Triển khai: Docker + Kubernetes

## Quy ước giao diện (Interface Convention)

- Chuẩn API: OpenAPI 3.0
- Mã lỗi: Định dạng thống nhất {"code": "USER_NOT_FOUND", "message": "..."}
- Định dạng Log: JSON, bắt buộc phải kèm trace_id
```

Có thể bạn sẽ nghĩ: thế này chẳng phải chính là tài liệu thiết kế sao?

Đúng là khá giống.

Nhưng điểm khác biệt ở chỗ, tài liệu thiết kế truyền thống chủ yếu viết cho người đọc. Con người đọc xong sẽ nắm được định hướng lớn, còn rất nhiều chi tiết còn lại có thể dựa vào thói quen của team để bù đắp. Chẳng hạn như mật khẩu không được lưu plain-text, mã lỗi phải thống nhất, trong log phải có `trace_id`—những thứ này trong một đội ngũ trưởng thành thường không cần phải nhắc đi nhắc lại.

AI thì không như vậy.

Bạn không viết ra là nó sẽ đoán mò. Đoán đúng thì may mắn, đoán sai thì chính bạn là người phải đi đập đi xây lại.

Lấy ví dụ về việc lưu trữ mật khẩu. Nếu bạn chỉ viết một câu "Đăng nhập phải an toàn", phạm vi quá rộng, mô hình có thể sẽ chọn những phương án đã lỗi thời hoặc không phù hợp với hệ thống hiện tại.

Hệ thống mới có thể quy định rõ ràng như sau, rồi dựa vào kết quả benchmark thực tế trên server để ấn định tham số:

```text
Mật khẩu sử dụng thuật toán băm Argon2id để lưu trữ, các tham số được xác định thông qua benchmark trên server mục tiêu, và ghi nhận phiên bản thuật toán để tiện cho việc nâng cấp di chuyển dữ liệu sau này.
Nếu hệ thống hiện tại bắt buộc phải tương thích với bcrypt, giữ lại bước xác thực hash cũ, và dần chuyển dịch sang Argon2id sau khi người dùng đăng nhập thành công.
Database chỉ lưu salted hash, tuyệt đối không lưu mật khẩu dạng plain text; sử dụng thư viện mật mã được duy trì uy tín để tạo salt ngẫu nhiên.
Mật khẩu đơn yếu tố có độ dài tối thiểu 15 ký tự, hỗ trợ độ dài tối đa ít nhất 64 ký tự, không bắt buộc phải ép kết hợp chữ hoa, chữ thường, chữ số hay ký tự đặc biệt.
Khi đăng ký và đổi mật khẩu phải kiểm tra qua Blocklist mật khẩu rò rỉ, các endpoint đăng nhập phải cấu hình Rate Limiting.
```

Những yêu cầu này đến từ [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) và [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html). Các tham số bảo mật vẫn cần trải qua đánh giá kiến trúc và đo lường thực tế, không nên chỉ đơn thuần sao chép các con số ví dụ vào Spec.

Xử lý lỗi cũng y như vậy. Đừng viết "Khi API thất bại phải trả về thông báo thân thiện"—câu này cơ bản chẳng có chút tính ràng buộc nào. AI có thể ở API này trả về `error`, API kia lại trả về `message`, còn chỗ khác thì quẳng thẳng Exception ra ngoài.

Hãy viết rõ ràng ra:

```json
{
  "code": "USER_NOT_FOUND",
  "message": "Người dùng không tồn tại",
  "trace_id": "xxx"
}
```

Bổ sung thêm một đoạn quy ước HTTP status code:

```text
Lỗi tham số trả về 400.
Chưa đăng nhập trả về 401.
Không có quyền trả về 403.
Tài nguyên không tồn tại trả về 404.
Xung đột dữ liệu như trùng email, trùng username trả về 409.
```

Như vậy ít nhất AI cũng biết nó nên đi theo hướng nào.

Nói cho cùng, `design.md` chủ yếu nhằm giảm bớt việc AI tự biên tự diễn. Bạn vạch sẵn quy tắc cho tech stack, định dạng API, mã lỗi, log, xử lý đồng thời, bảo mật từ trước, thì về sau khi để AI viết code, nó sẽ rất khó bị lệch hướng.

### Tasks: Nhiệm vụ phải đủ nhỏ để có thể nghiệm thu

Bước thứ ba là `Tasks`, thường được ghi trong `tasks.md`.

Ở đây đừng vừa vào đã bảo AI "Hoàn thành module người dùng". Phạm vi này quá rộng lớn. Đăng ký, đăng nhập, truy vấn, vô hiệu hóa tài khoản, phân quyền, validate tham số, xử lý ngoại lệ, unit test, tất cả nhồi chung vào một task thì AI rất dễ viết sót việc này việc kia. Cuối cùng khi bạn review code lại phải nhặt từng hạt sạn để bù vào.

Nhưng cũng đừng băm vụn quá mức. Tạo UserDTO, thêm trường email, viết một hàm Service rỗng—những task kiểu này nhìn thì tỉ mỉ đấy, nhưng thực tế sẽ làm bạn mệt mỏi đến kiệt sức. Thời gian bạn ngồi duy trì danh sách task có khi còn dài hơn cả thời gian để AI sinh mã nguồn.

Độ mịn (granularity) mà mình ưng ý nhất là: một Task tương ứng với một API, các thao tác cốt lõi trên một bảng, hoặc một tính năng nhỏ có thể nghiệm thu độc lập.

Ví dụ với API đăng ký người dùng, có thể viết như sau:

```markdown
### Task-001: API đăng ký người dùng

Mô tả: Hiện thực hóa đăng ký người dùng, bao gồm validate tham số, băm mật khẩu và lưu người dùng vào database.

Tiêu chuẩn nghiệm thu:

- [ ] POST /api/v1/users trả về 201 khi thành công
- [ ] Mật khẩu mới được băm và lưu trữ bằng Argon2id với tham số đã qua benchmark
- [ ] Mật khẩu đơn yếu tố tối thiểu 15 ký tự, hỗ trợ tối đa ít nhất 64 ký tự, có kiểm tra qua Blocklist mật khẩu rò rỉ
- [ ] Các API liên quan đến đăng nhập và đăng ký có áp dụng Rate Limiting
- [ ] Email là duy nhất, đăng ký trùng lặp trả về 409
- [ ] Body trả về bắt buộc phải có user_id, email, created_at
- [ ] Độ bao phủ nhánh (branch coverage) đạt mức chuẩn của dự án (ví dụ này là 80%), và các nhánh bảo mật then chốt đều có assertion kiểm tra

Thời gian dự kiến: 2h
```

Thứ thực sự có giá trị ở đây chính là các tiêu chuẩn nghiệm thu. Những câu nói như "đảm bảo an toàn", "code thanh lịch", "hiệu năng phải tốt"—viết mấy câu này cũng gần như bằng thừa, AI đâu biết trong đầu bạn định nghĩa an toàn là gì, hay thanh lịch là phải thanh lịch tới mức nào.

Nhưng những thứ như mật khẩu dùng thuật toán Argon2id với tham số chuẩn, trùng email trả về `409`, response body chứa `user_id`, `email`, `created_at`, cùng với việc các nhánh quan trọng đều có test—những điều này đều có thể kiểm chứng được một cách rõ ràng mà không cần dựa vào cảm giác.

Ngưỡng coverage đừng áp dụng một cách máy móc. Đội ngũ nên căn cứ vào mức độ rủi ro của module, lịch sử lỗi và loại kiểm thử để xác định baseline; việc có các assertion chuẩn xác trên các nhánh quan trọng như phân quyền, tiền bạc, chuyển đổi trạng thái, cơ chế retry hay bù trừ ngoại lệ còn quan trọng hơn nhiều so với một con số phần trăm đơn thuần.

### Implement: Để AI bắt tay vào việc

Câu lệnh prompt cũng không cần phải làm gì quá cao siêu huyền bí, cứ nhét thẳng các phần Spec liên quan vào là được:

```text
Vui lòng dựa vào Spec sau đây để hiện thực hóa Task-001.

Mô tả yêu cầu:
[Dán đoạn liên quan trong requirements.md]

Ràng buộc kỹ thuật:
[Dán đoạn liên quan trong design.md]

Tiêu chuẩn nghiệm thu nhiệm vụ:
[Dán Task-001 trong tasks.md]
```

Ở đây có một cái bẫy: đừng gom toàn bộ Spec ném hết một lượt vào Context.

Trong một phiên làm việc (session), mình thường ưu tiên đưa vào 3 nhóm nội dung:

- Ràng buộc toàn cục, chẳng hạn như code style, định dạng mã lỗi, quy chuẩn log;
- Mô tả yêu cầu của tác vụ hiện tại;
- Tiêu chuẩn nghiệm thu của tác vụ hiện tại.

Những nội dung khác chỉ bổ sung khi cần, đừng vì muốn "toàn diện" mà dán sạch sành sanh mọi tài liệu vào.

Về lượng Token nên đưa vào trong một lần, không có con số ngưỡng cố định từ 3.000–8.000 dùng chung cho mọi mô hình và mọi tác vụ. Cách làm thực dụng hơn là trước tiên đưa vào các ràng buộc cứng toàn cục, tác vụ hiện tại và tiêu chuẩn nghiệm thu, sau đó dựa vào mục lục tra cứu hoặc đường dẫn file để đọc thêm dẫn chứng khi cần; khi các tài liệu không liên quan bắt đầu làm nhiễu khả năng phán đoán, hoặc khi tác vụ có thể tách độc lập ra thì hãy chia nhỏ session.

Đừng kỳ vọng mô hình có thể để mắt tới mọi thứ trong một đoạn Context quá dài. Context càng dài thì thông tin then chốt càng dễ bị chìm nghỉm ở giữa, cuối cùng lại để lọt mất những ràng buộc quan trọng nhất.

Bản thân mình luôn tuân thủ 3 nguyên tắc sau:

Thứ nhất, quy ước phải viết vào tài liệu, không chỉ trao đổi miệng trong khung chat. Lịch sử chat rất dễ bị ngắt quãng ở lần sau, tài liệu mới là thứ Context có thể tái sử dụng lâu dài.

Thứ hai, tiêu chuẩn nghiệm thu lượng hóa được thì hãy lượng hóa tối đa. "Hiệu năng cao" không thể nghiệm thu được, nhưng `QPS > 1000`, `P95 < 200 ms`, `branch coverage >= 80%` thì hoàn toàn nghiệm thu được.

Thứ ba, Spec phải đưa vào Git quản lý, đồng hành cùng code. Code thay đổi thì Spec cũng phải sửa theo. Nếu không, lần sau bạn để AI tiếp tục phát triển, thứ nó cầm trong tay sẽ là một bản hướng dẫn đã lỗi thời.

Sau khi thông suốt bước này, AI sẽ không tự dưng biến thành thiên tài, nhưng không gian để nó đoán mò sẽ bị thu hẹp lại rất nhiều.

Tiếp theo là một vấn đề cực kỳ thực tế: rốt cuộc những file Spec này đặt ở đâu, và làm thế nào để công cụ tự động đọc được mỗi lần?

## Spec được triển khai trong các AI IDE như thế nào?

Sau khi viết xong Spec, có một vấn đề thường hay bị ngó lơ: **Những file này rốt cuộc để ở đâu? Làm sao để AI tự động đọc được?**

Các công cụ phổ biến hiện nay đều có cơ chế file quy chuẩn riêng của mình:

| Công cụ | Vị trí file quy chuẩn | Phạm vi tác dụng (Scope) | Cơ chế nạp (Loading) |
| --- | --- | --- | --- |
| **Cursor** | `.cursor/rules/*.mdc` (hiện tại) hoặc `.cursorrules` (Legacy) | Project-level / Global | Rules có thể đặt Always apply, hoặc đính kèm theo glob pattern |
| **Claude Code** | `CLAUDE.md`, `.claude/rules/*.md` | Project-level / Directory-level | Quy tắc gốc luôn thường trực, thư mục con hoặc rule có `paths` nạp khi truy cập file tương ứng |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `AGENTS.md` | Repo-level / Path-level | Hướng dẫn cấp repo, Instructions cấp đường dẫn và Agent instructions nạp theo năng lực client |
| **Windsurf** | `.windsurf/rules/*.md`, `AGENTS.md` (dự án cũ có thể còn `.windsurfrules`) | Project-level / Directory-level | Workspace Rules và `AGENTS.md` cấp thư mục nạp theo scope |
| **Aider** | `CONVENTIONS.md` (thư mục gốc repo) | Project-level | Nạp qua cờ `--read CONVENTIONS.md`, hoặc dùng `read:` tự động nạp trong `.aider.conf.yml` |

Tới đây, một câu hỏi khác lại xuất hiện: Cursor, Claude Code, Copilot là những lối vào viết code hàng ngày, vậy những công cụ chuyên biệt xoay quanh Spec Coding như Superpowers, Spec-Kit, Open Spec, Kiro, BMAD-METHOD thì nên chọn thế nào?

Câu hỏi này đào sâu ra sẽ khá dài, mình dự định để dành cho một bài viết riêng sau. Ở đây chúng ta hãy làm rõ trước xem Spec viết ra sao, đặt ở đâu và làm sao để quản thúc được AI.

Biết chỗ đặt rồi, vẫn còn một băn khoăn: **Những Spec nào cần inject vào mỗi lần, những cái nào chỉ mang theo khi cần?**

Trong thực tế, mình thường chia làm hai tầng.

**Hầu như session nào cũng phải mang theo (Bắt buộc inject):**

- **Tech Stack**: Chỉ rõ phiên bản và các thư viện then chốt, ví dụ Go 1.21 + Gin + GORM + PostgreSQL 14. Đừng để AI tự đoán số phiên bản.
- **Code Style**: Đưa ra một số ít đường dẫn file "chuẩn vàng" hoặc đoạn code mẫu ngắn minh họa cách đặt tên, xử lý lỗi và định dạng kết quả trả về. Đừng nhét cố định 150–200 dòng code vào Context của mọi session.
- **Điều kiện biên**: Dùng nhãn ba màu (sẽ giải thích ở phần sau) để vạch rõ việc gì được làm, việc gì phải hỏi, việc gì cấm tuyệt đối không được đụng vào.

Những thứ này để trong file quy tắc always-on của công cụ, mỗi session sẽ tự động được inject vào.

**Chỉ mang theo khi liên quan tới tác vụ hiện tại (Inject theo nhu cầu):**

- **Tầm nhìn dự án (Project Vision)**: Một hai câu nói rõ vì sao làm dự án này, ví dụ "Tách dịch vụ người dùng ra khỏi khối monolith, viết lại bằng Go, tương thích hoàn toàn API". Khi bắt đầu một task lớn mới thì đưa vào một lần là đủ.
- **Danh sách lệnh**: Liệt kê các lệnh build, test, run, ví dụ `make build`, `go test ./...`. Khi có tác vụ cần thực thi lệnh thì mang vào.
- **Cấu trúc thư mục**: Dùng cây thư mục nói rõ code, test, tài liệu đặt ở đâu. Chỉ cần thiết khi có thêm file mới.
- **Quy chuẩn Git**: Tên nhánh, commit message, yêu cầu PR. Mang vào khi có thao tác dính dáng tới Git.

Cách phân chia này dựa vào tần suất sử dụng: ràng buộc toàn cục hầu như lúc nào cũng phải tuân thủ, xứng đáng được thường trực. Những thứ khác chỉ thêm theo tác vụ, tránh làm dồn ứ quá nhiều nội dung không liên quan vào Context. Càng nhồi nhét nhiều Spec lung tung thì AI lại càng dễ bỏ sót những điều khoản thực sự quan trọng.

## Nhãn ba màu: AI được làm gì, không được làm gì

Khi AI gặp phải những thao tác mà nó không chắc chắn, rốt cuộc nó nên tự mình quyết định hay dừng lại hỏi ý kiến bạn?

Ba màu sắc, tương ứng với ba cấp độ quyền hạn.

![Nhãn ba màu: Cơ chế kiểm soát rủi ro phân quyền quyết định của AI](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-three-color-labels-2c376f8e.png)

- ✅ **Always (Tự động thực thi)**: Kiểm tra code (lint), chạy test, format code—những việc này AI tự quyết là được. Ví dụ trước khi commit tự động chạy `make lint`.
- ⚠️ **Ask first (Cần xác nhận trước)**: Những thay đổi có thể ảnh hưởng tới module khác, AI đưa ra phương án và đợi bạn duyệt. Chẳng hạn như sửa index database hay đổi route API thuộc nhóm này.
- 🚫 **Never (Tuyệt đối cấm)**: Kết nối thẳng vào DB production, commit khóa bí mật (secret key), xóa dữ liệu online. AI hễ chạm vào là bắt buộc phải dừng lại và báo lỗi.

Khi triển khai trong thực tế có vài điểm rất dễ bị bỏ quên.

**Giai đoạn đầu thà chặt chẽ còn hơn lỏng lẻo.** Hãy nhét nhiều hành động vào Ask First hơn. Chạy thử một tuần xem thao tác nào AI luôn luôn làm chuẩn chỉnh thì hãy chuyển dần sang Always.

**Quy tắc phải viết thật cụ thể.** Câu "Thay đổi quan trọng cần xác nhận" AI không thể nào thực thi được, nó đâu biết cái gì được coi là "quan trọng". Phải viết thành "Sửa đổi đường dẫn URL của API hiện hữu cần xác nhận". Câu "Cẩn thận khi thao tác cơ sở dữ liệu" cũng vô dụng, phải viết "Thao tác ALTER TABLE cần xác nhận".

**Quy tắc Never không thể chỉ trông chờ vào sự tự giác của AI.** Chỉ ghi trong tài liệu "Cấm kết nối thẳng tới DB production" thì không thể ngăn chặn nó triệt để được. AI sẽ không chủ động kiểm tra xem đầu ra của mình có vi phạm quy định hay không. Quy tắc Never cần có nhiều tầng phòng thủ:

1. **Khai báo trong Spec**: Ảnh hưởng tới xu hướng sinh mã của AI, nhưng không chặn cứng được
2. **Template cấu hình**: Trong `.env.example` không để secret thật, AI sẽ không có gì để sao chép
3. **Pre-commit hook**: Dùng regex quét các đoạn hardcode secret, chuỗi kết nối môi trường production, tự động chặn ngay khi commit
4. **Cấu hình AI IDE**: Dùng quy tắc phân quyền và sandbox để giới hạn phạm vi đọc; `.cursorignore` có thể giảm bớt lập chỉ mục và truy cập context, nhưng không phải là một ranh giới bảo mật toàn diện
5. **Cách ly Secret**: Thông tin xác thực production tuyệt đối không nằm trong workspace mà Agent có thể tiếp cận, hãy sử dụng thông tin xác thực ngắn hạn với đặc quyền tối thiểu (least privilege)

Quy tắc Never nào càng quan trọng thì càng phải đẩy xuống tầng CI để kiểm tra cứng bằng máy móc. Dừng lại ở bước "trong tài liệu có ghi" thì sớm muộn cũng xảy ra sự cố.

**Hàng tuần dành thời gian nhìn lại một lần**. AI có hay hơi tí là dừng lại hỏi không? Nếu có thì một số thao tác trong Ask First có thể nới lỏng sang Always. AI có lén lút làm việc gì không nên làm không? Nếu có thì bổ sung vào Never. Dự án có xuất hiện thêm thao tác nhạy cảm nào mới không? Bổ sung vào ngay.

## Dự án lớn dần, quản lý Spec ra sao?

Dự án nhỏ ít Spec, quẳng thủ công vào Context là xong. Module nhiều lên mà nhồi hết vào Context là vứt đi ngay, AI nhìn vào một đống ràng buộc không liên quan tới tác vụ hiện tại thì lại càng dễ đi chệch hướng.

Hãy chọn chiến lược theo quy mô dự án.

![Chiến lược quản lý Spec: Lọc phân tầng + Truy xuất chính xác](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-spec-management-strategy-4ded0946.png)

### Khi quy tắc chưa nhiều: Lưu trữ theo từng file

Chia tách theo từng domain là đủ:

```text
specs/
├── global/              # Ràng buộc toàn cục
│   ├── conventions.md   # Quy chuẩn code
│   └── architecture.md  # Tổng quan kiến trúc
├── backend/             # Đặc tả backend
│   ├── api/
│   ├── service/
│   └── persistence/
├── frontend/            # Đặc tả frontend
└── shared/              # Hợp đồng dùng chung
    └── dto.md
```

Mỗi lần chỉ đưa hai hoặc ba file liên quan mật thiết tới tác vụ hiện tại vào, đừng tham lam.

### Khi việc chọn file thủ công bắt đầu tốn sức: Dùng chỉ mục tóm tắt (Summary Index)

Khi việc tự tay lọc file bắt đầu thấy mệt, hãy để AI tạo trước một bản mục lục kèm từ khóa tra cứu:

```markdown
## Chỉ mục Spec

- [Thiết kế Database](specs/db/schema.md) - Từ khóa: PostgreSQL, tối ưu index
- [API Người dùng](specs/backend/api/user.md) - Từ khóa: REST, JWT, xác thực phân quyền
- [Dịch vụ Đơn hàng](specs/backend/service/order.md) - Từ khóa: Transaction, Idempotency (tính lũy đẳng)
```

Khi nào cần chi tiết thì để AI chủ động yêu cầu lấy thêm, không cần nhồi toàn bộ ngay từ đầu.

### Khi chỉ mục từ khóa thường xuyên bỏ sót thông tin: Đánh giá triển khai RAG

Số lượng module không thể dùng làm thước đo duy nhất để quyết định có nên đưa RAG vào hay không. Hãy quan sát vài tín hiệu trước: cùng một khái niệm bị phân tán trong lượng lớn tài liệu, tìm kiếm từ khóa thường xuyên bỏ sót các cách diễn đạt đồng nghĩa, việc lựa chọn context thủ công đã bắt đầu ảnh hưởng tới tiến độ bàn giao, và đội ngũ có đủ năng lực duy trì phân quyền, cập nhật index và bộ test đánh giá. Khi thỏa mãn các điều kiện này rồi mới tính đến việc đánh giá tìm kiếm toàn văn (full-text search), vector search hoặc kết hợp cả hai.

Kích thước Chunk, Top-K và ngưỡng tương đồng đều phải được tinh chỉnh dựa trên mô hình Embedding, cấu trúc tài liệu và bài test thực tế. Phân phối độ tương đồng giữa các mô hình là khác nhau, những con số như `Top-K 3–5`, `> 0.7` không thể bê nguyên xi từ mô hình này sang mô hình khác. Trước khi đưa vào sử dụng, tối thiểu phải chuẩn bị một tập câu hỏi thực tế để đánh giá tỷ lệ recall, tỷ lệ nhận diện nhầm, độ trễ và chi phí, đồng thời đảm bảo việc lọc quyền hạn diễn ra trước khi kết quả được đưa vào mô hình.

### Một nguyên tắc hiệu quả với mọi quy mô: Một session - một nhiệm vụ

```text
Session 1: Thiết kế Database
├── Input: global/conventions.md + backend/db/
├── Output: Hoàn thành thiết kế Entity
└── Đóng session

Session 2: Hiện thực hóa API
├── Input: Sản phẩm đầu ra Session 1 + backend/api/
├── Output: Hoàn thành Controller
└── Đóng session
```

Context sạch sẽ thì AI sẽ không bị những mẩu vụn thừa thãi của tác vụ trước dắt mũi đi lạc. Quy tắc này còn hiệu quả hơn bất kỳ chiến lược truy xuất hào nhoáng nào.

## Vì sao tri thức nghiệp vụ (Domain Knowledge) lại quan trọng đến thế?

Dữ liệu huấn luyện của AI dù có đồ sộ đến đâu cũng không thể biết được những quy tắc đặc thù bên trong dự án của bạn, bạn bắt buộc phải chủ động nói cho nó biết.

Lấy ví dụ: Bạn làm một dự án sàn thương mại điện tử, trong đó có một quy định nghiệp vụ là phiếu giảm giá (coupon) và chương trình Flash Sale không được áp dụng đồng thời. Quy tắc này nếu bạn không viết vào Spec, AI rất có thể sẽ tính gộp cả hai chương trình giảm giá lại cho khách hàng. Code vẫn chạy ngon lành, test có khi vẫn xanh lè, nhưng nghiệp vụ thì sai bét nhè.

Những tri thức dạng này thường được chia thành các nhóm:

- **Quy tắc nghiệp vụ**: Coupon và Flash Sale không được cộng dồn; cùng một user mỗi ngày chỉ được nhận thưởng một lần
- **Ràng buộc kỹ thuật**: Phân trang đơn hàng bắt buộc phải dùng composite index chỉ định; phân trang sâu (> 100 trang) phải đổi sang dùng cursor (con trỏ), nghiêm cấm quét toàn bảng (full-table scan)
- **Nợ kỹ thuật lịch sử (Technical Debt)**: API upload của bên thứ ba chỉ hỗ trợ tối đa 5 MB, vượt quá là văng lỗi, do đó trong code phải kiểm tra validate dung lượng từ sớm
- **Baseline hiệu năng**: Truy vấn trên một bảng phải khống chế trong vòng 50 ms; API trọng yếu vượt quá 200 ms phải tính tới phương án giáng cấp (degradation) hoặc fallback dự phòng

Những điều này chính là rào chắn an toàn khi AI viết mã nguồn.

Hiện nay, tư duy của nhiều phương pháp Spec-Driven Development là biến Spec từ "tài liệu viết cho người đọc" trở thành "quy tắc ràng buộc code do AI sinh ra".

Đừng nghĩ rằng Spec chỉ dùng ở giai đoạn đầu, các khâu hiện thực hóa, kiểm chứng và bảo trì về sau đều cần đến nó.

Tuy nhiên, chỉ viết quy tắc vào thôi vẫn chưa đủ, tốt nhất nên đính kèm thêm một danh sách tự kiểm tra (Self-Checklist). Bởi vì AI rất hay có thói quen hễ viết xong chức năng là coi như xong chuyện, nó sẽ không chủ động quay đầu kiểm tra lại những ràng buộc ngầm định này.

## Checklist tự kiểm tra khi hoàn thành

Sau khi viết xong tác vụ, đừng để AI chỉ buông một câu cụt lủn "Đã hoàn thành".

Ít nhất hãy bắt nó tự rà soát lại từng mục theo danh sách. Ví dụ sau khi hoàn thành `Task-001`, bắt buộc phải xác nhận từng điểm một:

- [ ] Tất cả phản hồi lỗi API đều tuân thủ định dạng thống nhất
- [ ] Truy vấn database đã trúng composite index chỉ định
- [ ] Logic loại trừ lẫn nhau giữa Coupon và Flash Sale đã được triển khai chính xác
- [ ] Unit test đã bao phủ các kịch bản biên như giá trị null, vượt ngưỡng, xử lý đồng thời
- [ ] Độ bao phủ nhánh đạt chuẩn quy ước của dự án, các nhánh biên giới hạn then chốt đều có assertion
- [ ] Độ phức tạp vòng (cyclomatic complexity) không vượt ngưỡng kiểm tra tĩnh của dự án; các trường hợp ngoại lệ đều có ghi nhận review

Nếu có mục nào không thể xác nhận, tuyệt đối không được cho qua loa, mà phải giải trình rõ nguyên nhân.

AI rất dễ đánh đồng việc "viết xong code" với "hoàn thành nhiệm vụ". Nhưng trong dự án thực tế, tính năng chạy được mới chỉ là bước khởi đầu; định dạng lỗi chuẩn hóa, trúng index, test đầy đủ điều kiện biên, kiểm soát độ phức tạp—những thứ đó mới là thứ giúp bạn bớt phải "gánh vạ" về sau.

## Những cạm bẫy khi phối hợp đa agent (Multi-Agent)

Có người sẽ hỏi: Một AI dùng không đủ thì tạo nhiều AI phối hợp với nhau có được không?

Được chứ, nhưng cạm bẫy thì nhiều hơn bạn tưởng đấy.

![Pipeline phối hợp 3 Agent trong Multi-Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-multi-agent-pipeline-f6ec4d47.png)

Tư duy của việc phối hợp 3 agent là phân công code, test, review thành từng chặng riêng biệt, vận hành theo mô hình dây chuyền (pipeline). Code Agent nhận Task để viết tính năng, viết xong bàn giao cho Test Agent viết test case và chạy test, sau khi pass thì chuyển tiếp cho Review Agent soi chất lượng code, cuối cùng con người sẽ duyệt lần cuối rồi merge.

Có một cái hố to đùng bắt buộc phải cảnh báo trước: Test Agent viết test trên branch của chính nó, nhưng đoạn code cần test lại nằm ở branch của Code Agent. Hai branch này chạy song song độc lập, Test Agent hoặc là phải merge branch code trước, hoặc là hoàn toàn không thể chạy nổi bộ test.

Hai mô hình đã được kiểm chứng là có thể chạy thông:

**Tuần tự trên cùng một branch (Khuyên dùng khi mới bắt đầu).** Ba agent cùng commit tuần tự trên cùng một nhánh feature, dùng tiền tố trong commit message để phân biệt vai trò. Đơn giản, không xung đột merge, phù hợp với đại đa số dự án.

```bash
git commit -m "[code] implement user registration API"
git commit -m "[test] add unit tests for user registration"
git commit -m "[review] fix null check in email validation"
```

**Kế thừa dạng chuỗi (Sau khi năng lực agent đã được kiểm chứng vững vàng).** Test Agent checkout từ branch của code, Review Agent checkout từ branch của test, cuối cùng merge từ branch của review về nhánh chính. Giữa các branch là mối quan hệ kế thừa chứ không phải song song, mỗi agent đều có thể nhìn thấy sản phẩm của agent đứng trước nó.

Các kịch bản "lật xe" khi dùng multi-agent không hề hiếm: Deadlock (A đợi B, B đợi A; khi thiết kế phải đảm bảo quan hệ phụ thuộc là đồ thị có hướng không chu trình - DAG), vòng lặp vô tận (agent tự lặp lặp lại sửa đổi không dứt; cần đặt giới hạn số vòng tối đa Max 3), lỗi định dạng đầu ra (parse JSON thất bại; cần thêm kiểm tra và retry tối đa 3 lần). Thiết lập sẵn các phương án phòng hộ này sẽ giúp bạn tránh được phần lớn sự cố.

Thành thật mà nói, mảng multi-agent bản thân mình cũng vẫn đang vừa làm vừa mò mẫm. Kinh nghiệm hiện tại cho thấy mô hình tuần tự trên cùng một branch đã có thể bao quát tới 80% trường hợp, còn việc điều phối phức tạp nếu team không có người chuyên trách bảo trì thì tỷ lệ toang là rất cao.

## Spec không phải viết xong là vứt xó

Sau khi chạy qua vài dự án, mình đã đúc kết được vài thói quen cố định.

**Tinh chỉnh tiệm tiến (Progressive Refinement).** Đừng mong một phát viết ngay được bản Spec hoàn hảo. Cứ viết dàn ý cấp cao trước, để AI chạy dựng xong bộ khung xương, rồi sau đó mới từ từ đắp da thịt cho từng module.

**Tổ chức module hóa.** API, database, quy chuẩn giao diện, mã lỗi, quy tắc phân quyền mỗi thứ để một file riêng. Mỗi lần chỉ cung cấp cho AI đúng phần Context mà tác vụ hiện tại cần dùng.

**Lặp lại liên tục.** Mỗi lần Code Review phát hiện ra vấn đề, hoặc thấy AI lại giẫm vào đúng cái hố cũ lần nữa, hãy quay lại sửa Spec. Chỉ sửa code mà không sửa quy chuẩn thì lần sau nó vẫn chứng nào tật nấy.

Ở đây có một kịch bản gặp sự cố rất thường thấy đáng để nhắc riêng: Khi Task-001 hoàn thành, Spec quy định format lỗi là `{"code": "USER_NOT_FOUND", "message": "..."}`. Hai tuần sau Spec cập nhật bổ sung thêm trường `trace_id`, nhưng code của Task-001 thì chẳng ai ngó ngàng tới nữa. Quy chuẩn và code thực tế cứ thế âm thầm đi chệch khỏi nhau.

Giải pháp: Khi Spec thay đổi, hãy thực hiện đánh giá phạm vi ảnh hưởng (blast radius). Bạn có thể duy trì một danh sách "các module phụ thuộc vào file này" bên trong mỗi file Spec; khi Spec cập nhật, hãy chủ động kích hoạt regression test cho các module bị ảnh hưởng. Trong CI pipeline thêm một bước kiểm tra: hễ file Spec có biến động là tự động chạy test cho các module liên quan.

## Chia sẻ vài mẫu Spec template

Dưới đây là 3 mẫu mình hay dùng nhất, tùy theo ngữ cảnh mà bạn chọn một mẫu phù hợp.

**Mẫu 1: Phong cách OpenAPI, phù hợp phát triển API**

````markdown
## API: POST /api/v1/users

### Thông tin cơ bản

- **Endpoint**: `/api/v1/users`
- **Phương thức**: POST

### Tham số yêu cầu (Request Parameters)

| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Ví dụ |
| --- | --- | --- | --- | --- |
| email | string | Có | Định dạng email | user@example.com |
| password | string | Có | Mật khẩu đơn yếu tố tối thiểu 15 ký tự, tối đa ít nhất 64 ký tự; không ép buộc tổ hợp ký tự | - |

### Định dạng phản hồi (Response Format)

- **201 Created**: Tạo người dùng thành công

  ```json
  { "id": "uuid", "email": "user@example.com", "created_at": "..." }
  ```

- **409 Conflict**: Email đã tồn tại
  ```json
  { "code": "EMAIL_ALREADY_EXISTS", "message": "Email already exists" }
  ```

### Tiêu chuẩn nghiệm thu

- [ ] Mật khẩu mới dùng tham số Argon2id đã qua benchmark trên server mục tiêu
- [ ] Mật khẩu đã kiểm tra qua Blocklist mật khẩu rò rỉ; API đăng ký và đăng nhập có Rate Limiting
- [ ] Tính duy nhất của email được đảm bảo bởi Unique Index trong database
- [ ] Branch coverage đạt chuẩn của dự án (ví dụ: 80%), và các nhánh bảo mật then chốt có assertion
````

**Mẫu 2: Phong cách Gherkin, phù hợp BDD**

```gherkin
Feature: Đăng nhập người dùng

  Scenario: Đăng nhập với thông tin hợp lệ
    Given người dùng đã đăng ký với email "test@example.com" và mật khẩu "CorrectHorse123!"
    When người dùng gửi yêu cầu đăng nhập
    Then trả về status code 200 và JWT token
    And thời hạn token là 24 giờ

  Scenario: Đăng nhập với mật khẩu không hợp lệ
    Given người dùng đã đăng ký với email "test@example.com"
    When người dùng gửi yêu cầu đăng nhập với sai mật khẩu
    Then trả về 401
    And thông báo lỗi là "Invalid credentials"
    And không tiết lộ cụ thể là sai email hay sai mật khẩu
```

**Mẫu 3: Phong cách Checklist, phù hợp Code Review**

```markdown
## Code Review Checklist

### Tính năng

- [ ] Hiện thực hóa khớp với mô tả trong Spec
- [ ] Đã xử lý các điều kiện biên: giá trị null, vượt ngưỡng, đồng thời
- [ ] Xử lý lỗi hoàn chỉnh

### Chất lượng

- [ ] Độ dài hàm <= 50 dòng
- [ ] Độ phức tạp vòng khớp với ngưỡng kiểm tra tĩnh của dự án, các ngoại lệ có lưu vết review
- [ ] Không trùng lặp code (DRY)

### Bảo mật

- [ ] Không hardcode thông tin nhạy cảm
- [ ] Đầu vào đã được validate / escape
- [ ] Đã bổ sung kiểm tra phân quyền
```

## Những cạm bẫy từng tự mình nếm trải

Kể ra vài cái hố mà chính bản thân mình từng vấp phải.

Ràng buộc viết quá chặt chẽ cứng nhắc, khiến AI mất đi sự linh hoạt tối thiểu cần có. Ví dụ bạn ấn định sẵn từng chữ ký hàm (method signature) trong tầng Service, AI đến đổi tên một tham số cũng chẳng dám. Spec đặt ra là để vạch ranh giới, chứ không phải để viết mã giả (pseudo-code) từng dòng một.

Ngược lại, viết thiếu ràng buộc lại là lỗi phổ biến hơn cả. Biên giới hạn then chốt không được định nghĩa, AI sẽ tự đoán mò. Đoán đúng là may mắn, đoán sai là chuyện thường ngày ở huyện. Mình từng có một dự án mà AI dùng luôn MD5 để lưu mật khẩu, nguyên nhân chỉ vì trong Spec không viết rõ dùng thuật toán mã hóa nào.

Spec thay đổi nhưng không đồng bộ, cái này là âm thầm nguy hiểm nhất. Code và tài liệu dần dà trôi dạt xa nhau, lần sau AI nhận được vẫn là bản quy chuẩn cũ, code nó sinh ra đương nhiên sẽ chẳng ăn nhập vào đâu.

Còn một cái nữa: Chỉ viết mà không kiểm tra. Spec viết ra cả đống hoành tráng, nhưng chẳng kết nối gì vào hệ thống CI, cuối cùng biến thành chủ nghĩa hình thức. Viết xong chẳng ai ngó ngàng kiểm tra thì cũng chẳng khác gì chưa từng viết.

Nút Merge đó, mãi mãi nên nằm chắc trong chính bàn tay của bạn.
