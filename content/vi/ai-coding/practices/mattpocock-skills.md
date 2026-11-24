---
title: "mattpocock/skills: 4 AI Coding Skills mà mình khuyên dùng nhất"
description: "Giới thiệu chuyên sâu về grilling, research, diagnosing-bugs và code-review trong mattpocock/skills, kết hợp các ca dự án thực tế để làm rõ chúng phù hợp giải quyết những điểm thất bại nào trong AI coding, cũng như cách cài đặt và sử dụng theo nhu cầu."
category: Thực chiến lập trình AI
tag:
  - Lập trình AI
  - Skills
  - Codex
  - Claude Code
lang: vi
sourceRef: zh-ref/ai-coding/practices/mattpocock-skills.md
head:
  - - meta
    - name: keywords
      content: AI coding,Agent Skills,mattpocock skills,grilling,research,diagnosing-bugs,code-review,Codex,Claude Code,Phát triển hỗ trợ bởi AI,Code Review,Làm rõ yêu cầu,Chẩn đoán Bug
---

Chào bạn, mình là Tiểu G.

Trong cả hai bài viết [Danh mục lựa chọn Skills lập trình AI](https://javaguide.cn/ai-coding/practices/programmer-essential-skills.html) và [Thời đại mô hình mạnh mẽ, có còn cần thiết phải cài đặt AI Coding Skills nữa không?](https://javaguide.cn/ai-coding/practices/skill-selection-and-pruning.html), mình đều có nhắc tới kho [mattpocock/skills](https://github.com/mattpocock/skills), riêng `grilling` còn được lấy ví dụ thực tế từ một dự án cụ thể.

Có khá nhiều bạn độc giả tỏ ra rất hứng thú với `grilling`. Tuy nhiên khi nhìn lại, cả hai bài viết trước của mình đều diễn đạt hơi vắn tắt quá. Chúng mới chỉ để lại ấn tượng kiểu "bắt Agent liên tục hỏi dồn dập", chứ việc mỗi lần chỉ được hỏi đúng một câu, thông tin nào Agent phải tự tra cứu, khi nào mới được phép bắt tay vào làm thì đều chưa được nói kỹ càng.

Vì vậy, mình đã đọc lại toàn bộ các file `SKILL.md` trong repository này một lượt. `mattpocock/skills` bóc tách các vấn đề kỹ thuật phổ biến thành những Skill nhỏ gọn, dễ chỉnh sửa và có thể tùy ý ghép nối: Yêu cầu mơ hồ thì bổ sung khâu làm rõ yêu cầu, Bug khó tra cứu thì bổ sung quy trình chẩn đoán, chuẩn bị bàn giao thì lắp thêm khâu Code Review.

Cách bẻ nhỏ này cực kỳ hợp với thói quen sử dụng của mình. Những thao tác nền tảng mà Codex hay Claude Code vốn đã làm tốt một cách ổn định thì không cần lần nào cũng phải dạy lại; mắt xích nào hay bị làm đi làm lại thì gắn thêm đúng một mẩu quy trình ngắn vào đó.

Khi thảo luận trong nhóm, mọi người cũng đều gặp phải tình cảnh tương tự: Bộ công cụ đầy đủ quá dễ khiến các tác vụ nhỏ phải gánh vác quy trình nặng nề, còn `grilling` tuy hỏi dồn dập liên tục nhưng lại giúp chốt yêu cầu rõ ràng mạch lạc hơn hẳn.

![Thành viên nhóm thảo luận về việc Superpowers quá nặng quy trình và Grilling giúp giảm bớt việc làm lại](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/group-chat-superpowers-grilling-feedback-935c5501.png)

Bên cạnh `grilling`, ba Skill khác là `research`, `diagnosing-bugs` và `code-review` cũng cực kỳ xuất sắc, bài viết này mình sẽ chia sẻ tất tần tật về chúng.

## `grilling` không chỉ đơn giản là bảo Agent hỏi thêm vài câu

Trong hai bài viết trước, thực ra mình cũng đã miêu tả `grilling` hơi bị đơn giản hóa: Bảo Agent đừng vội viết code mà hãy hỏi thêm vài câu. Prompt thông thường chỉ cần thêm câu đó vào là cũng làm được na ná như vậy.

Phiên bản hiện tại của [`grilling`](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md) rất ngắn gọn, nhưng bên trong quy định cực kỳ chặt chẽ về cách thức cuộc phỏng vấn diễn ra.

![Quy tắc phỏng vấn hoàn chỉnh của Skill grilling](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/grilling-skill-content-c1d7f787.png)

Nó sẽ lần theo cây quyết định (decision tree) để hỏi dần xuống, mỗi lần chỉ xử lý đúng một quyết định duy nhất. Câu trả lời phía trước rất có thể làm thay đổi hoàn toàn các nhánh rẽ phía sau, vì thế nó tuyệt đối không được quẳng ra một hơi mười mấy câu hỏi rồi bắt người dùng trả lời như đang điền phiếu khảo sát.

Nó còn phân tách rạch ròi giữa sự thật khách quan (facts) và quyết định chủ quan (decisions). Dự án dùng framework gì, API hiện có thiết kế ra sao, trong database có trường dữ liệu này hay không—những thứ đó Agent bắt buộc phải tự mình đọc code và tài liệu mà tìm hiểu. Còn giai đoạn 1 làm phương án nào, có cần tương thích ngược với hành vi cũ hay không, chấp nhận độ phức tạp tới mức nào—những thứ đó mới giao lại cho người dùng quyết định.

Trước khi hai bên chưa xác nhận đã đạt được sự thấu hiểu chung, Agent tuyệt đối không được phép tự ý bắt tay vào làm việc theo phán đoán chủ quan của mình.

## `grilling`, `grill-me` và `grill-with-docs` khác nhau chỗ nào?

`grilling` là Skill phỏng vấn nền tảng có thể tái sử dụng, mô hình có thể chủ động gọi, người dùng có thể gọi trực tiếp, và các Skill khác cũng có thể gọi lồng vào. `/grill-me` là lối vào rõ ràng hơn dành cho con người, bản thân nó chỉ chịu trách nhiệm khởi động một phiên làm việc `/grilling`.

Khi cuộc thảo luận dự kiến sẽ sinh ra các thuật ngữ nghiệp vụ (domain terminology) hay quyết định kiến trúc dùng lâu dài, bạn có thể đổi sang dùng [`/grill-with-docs`](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md). Nó sẽ gọi thêm `domain-modeling`: Thuật ngữ sau khi chốt sẽ ghi vào `CONTEXT.md`, còn một số ít quyết định khó đảo ngược hoặc sau này nhìn lại có vẻ kỳ lạ sẽ được ghi nhận lại thành tài liệu ADR (Architecture Decision Record).

![Quan hệ gọi hàm của Skill grill-with-docs](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/grill-with-docs-skill-content-2fa82ba5.png)

![Quy tắc mô hình hóa nghiệp vụ trong Skill domain-modeling](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/domain-modeling-skill-content-90f1f2a7.png)

Mối quan hệ giữa 3 cái có thể hiểu đơn giản như sau:

```text
grill-me ──────────> grilling
grill-with-docs ───> grilling + domain-modeling
```

Quy tắc phỏng vấn được gom tập trung trong `grilling`, các Skill khác chỉ việc gọi lại để tái sử dụng.

Bản phát hành [v1.1.0](https://github.com/mattpocock/skills/releases/tag/v1.1.0) đã đổi bước xác nhận thành điều kiện dừng tường minh, đồng thời phân biệt rõ giữa sự thật môi trường và quyết định của người dùng. Quy tắc cũ có thể khiến Agent khi được gọi lồng tiện tay tự ý ra quyết định sản phẩm thay cho người dùng; hiện tại những quyết định kiểu này bắt buộc phải hỏi người dùng từng câu một.

## Mình đã dùng grilling để chốt yêu cầu phỏng vấn bằng kho tri thức như thế nào

Lần sử dụng thực tế này đến từ dự án mã nguồn mở của mình: [Nền tảng phỏng vấn thông minh SpringAI](https://javaguide.cn/zhuanlan/interview-guide.html).

Khi đó mình dự định thông luồng giữa tính năng phỏng vấn thử và kho tri thức, mình chọn ngay `grilling` và chỉ giao cho nó đúng một câu yêu cầu: Giúp tôi suy nghĩ thật thấu đáo về việc này.

Thực tế code hiện có đã thông luồng được một phần hơn mình nghĩ: Cả phỏng vấn thử thông thường lẫn phỏng vấn bằng kho tri thức đều dùng chung `InterviewSession`, khâu trả lời, đánh giá bất đồng bộ và một phần giao diện frontend vốn đã được tái sử dụng. Lúc này nếu cứ cắm đầu vào thiết kế tầng đáy thì rất có thể sẽ sửa nhầm vào những đoạn code đáng lẽ nên giữ lại, trong khi phạm vi sản phẩm giai đoạn 1 thì vẫn chưa đâu vào đâu.

![Dùng Grilling để chốt phương án thông luồng giữa phỏng vấn thử và kho tri thức](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/grilling-springai-interview-platform-case-31a812ef.png)

Quyết định đầu tiên mà `grilling` đặt ra là: Kho tri thức đóng vai trò gì trong buổi phỏng vấn?

Một phương án là tạo buổi phỏng vấn định hướng hoàn toàn dựa trên tài liệu người dùng tải lên; phương án khác là người dùng vẫn chọn các Skill như Java, System Design như bình thường, kho tri thức chỉ đóng vai trò bổ sung context. Mình đã chọn phương án đầu, toàn bộ hệ thống sinh câu hỏi, phân loại, độ khó, câu hỏi truy vấn cố định và quy tắc chấm điểm hiện có đều tiếp tục tận dụng được. Còn phương án sau sẽ kéo theo hàng loạt vấn đề như tỷ lệ trộn lẫn hai loại câu hỏi, RAG thời gian thực, khử trùng lặp câu hỏi, xung đột nguồn dữ liệu và căn cứ đánh giá.

Sau khi quyết định này được xác nhận, nó mới chuyển sang nhánh tiếp theo: Một buổi phỏng vấn gắn chặt với 1 kho tri thức, hay cho phép kết hợp nhiều kho tri thức cùng lúc?

Tham số request, trường dữ liệu trong session và bộ lọc ngân hàng đề đều đang thiết kế xoay quanh một `knowledgeBaseId` đơn lẻ. Nếu làm đa kho tri thức sẽ phải xử lý việc gộp kết quả recall, trọng số, trùng lặp nội dung và kiểm tra phân quyền. Vì vậy giai đoạn 1 được chốt lại chỉ giới hạn trong một kho tri thức duy nhất, tránh việc phải sửa sớm bảng quan hệ và cấu trúc API.

Quyết định thứ ba là lối vào. Phỏng vấn kho tri thức vốn đã có trang riêng, còn phỏng vấn thông thường đi vào từ "Trung tâm phỏng vấn thử". Cuối cùng chốt giữ lại cả hai lối vào, nhưng tầng dưới tiếp tục tái sử dụng `InterviewSession`, component cấu hình và API tạo mới cũng cố gắng dùng chung, tránh việc sau này phải bảo trì hai bộ logic tương tự nhau.

Code chưa cần sửa một dòng nào, nhưng phạm vi giai đoạn 1 đã được thu gọn lại thành ba lựa chọn rõ ràng: Phỏng vấn thuần kho tri thức, một `knowledgeBaseId` duy nhất, và hai lối vào dùng chung năng lực khởi tạo phiên làm việc.

`grilling` không viết tài liệu sản phẩm thay cho mình. Nó đưa ra câu trả lời khuyến nghị kèm dẫn chứng mã nguồn, còn quyền quyết định và đánh đổi vẫn do mình nắm giữ. Nếu câu trả lời đầu tiên của mình đổi thành "Skill phổ thông + context từ kho tri thức", thì những câu hỏi phía sau của nó sẽ không còn là một kho hay nhiều kho nữa, mà sẽ chuyển hướng sang cách thức phối trộn và đánh giá hai loại câu hỏi.

Mô hình AI hiện nay viết code đã quá nhanh rồi. Khi phạm vi yêu cầu chưa được ấn định, Agent cũng có thể nhoằng một cái bàn giao đủ cả code, test lẫn tài liệu. Nhưng chỉ cần hướng đi bị lệch, tất cả những sản phẩm đó đều sẽ phải đập đi làm lại.

Đương nhiên, không phải tác vụ nào cũng bắt buộc phải trải qua một vòng "tra khảo" như vậy. Sửa một chỗ câu chữ giao diện, thêm một phép kiểm tra null rõ ràng, hay bổ sung một trường dữ liệu theo mẫu có sẵn—tiêu chuẩn nghiệm thu vốn đã rất cụ thể, cứ thế bắt tay vào làm thường sẽ tiết kiệm thời gian hơn. `grilling` cũng không thể thay thế cho khâu kiểm thử hay Code Review, nó chỉ chịu trách nhiệm lôi ra ánh sáng những vấn đề còn mập mờ trước khi khởi công mà thôi.

Bản `grilling` hiện tại cũng không đặt giới hạn số lượng câu hỏi, những yêu cầu phức tạp có thể sẽ phải trao đổi khá lâu. Nếu lo lắng cuộc phỏng vấn bị kéo dài lê thê, bạn có thể đặt cho nó một hạn mức ngân sách từ 3–5 câu hỏi cho mỗi lượt. Kết thúc một lượt hãy bắt nó tổng hợp lại các quyết định đã xác nhận và các quyết định còn bỏ ngỏ, rồi để người dùng chọn xem có tiếp tục hay không.

Đừng chỉ viết cụt lủn "hỏi tối đa 5 câu". Khi hết hạn mức câu hỏi, Agent vẫn tuyệt đối không được tự ý điền nốt các quyết định còn lại hay tự tiện bắt tay vào gõ code.

## `research`: Giao nhánh phụ tra cứu tài liệu ra bên ngoài

Khi nâng cấp một SDK cho dự án, những câu hỏi như phiên bản hiện tại hỗ trợ những tham số nào, interface cũ khi nào bị deprecated, streaming event thay đổi ra sao—những thứ đó không nên trông chờ người dùng nhớ mang máng để trả lời, cũng không phù hợp để bắt Agent chính vừa gõ code vừa phải lội qua hàng đống tài liệu dài dằng dặc.

[`research`](https://github.com/mattpocock/skills/blob/main/skills/engineering/research/SKILL.md) sẽ giao vấn đề cho một Agent chạy ngầm, chỉ tập trung tra cứu tài liệu chính thức, mã nguồn, đặc tả kỹ thuật và API chuẩn gốc. Kết luận được ghi lại vào một file Markdown trong repository kèm nguồn trích dẫn rõ ràng, Agent chính có thể thảnh thơi tiếp tục xử lý các công việc khác.

![Quy tắc tra cứu tài liệu và lưu kết quả của Skill research](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/research-skill-content-3c49456c.png)

Điều mình đánh giá cao nhất ở nó là việc chốt chặt nguồn gốc tài liệu và sản phẩm bàn giao: Tuyệt đối không dùng các bài hướng dẫn truyền tay cấp hai để thay thế cho tài liệu chính thức, cũng không nhồi nhét hàng chục trang tìm kiếm trung gian vào cuộc trò chuyện chính, chỉ để lại kết luận có thể kiểm chứng được.

Sử dụng nó cần có hai điều kiện tiên quyết: Agent phải hỗ trợ chạy tác vụ nền hoặc Subagent, và dự án chấp nhận có thêm một file tài liệu nghiên cứu. Nếu chỉ tra cứu chữ ký của một hàm duy nhất, mở tài liệu chính thức ra xem trực tiếp sẽ nhanh hơn; còn khi dính dáng tới nâng cấp phiên bản, khác biệt giao thức hay thư viện hoàn toàn xa lạ, hãy giao nhánh điều tra này ra bên ngoài.

## `diagnosing-bugs`: Tạo dựng một vòng phản hồi báo đỏ trước tiên

Agent khi điều tra Bug rất dễ rơi vào cái bẫy đưa ra phán đoán quá sớm. Nhìn thấy một nhánh code khả nghi là lập tức sửa code, rồi chạy lại bài test; sửa chưa được thì lại tiếp tục đổi sang một giả thuyết khác. Code sửa đổi ngày càng nhiều, nhưng hiện tượng lỗi ban đầu thì lại chẳng bao giờ được tái hiện một cách ổn định.

[`diagnosing-bugs`](https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnosing-bugs/SKILL.md) dồn phần lớn tâm huyết vào giai đoạn đầu tiên: Tạo dựng một vòng phản hồi (feedback loop) có khả năng tóm gọn chính xác con Bug hiện tại.

![Quy trình chẩn đoán Bug trong Skill diagnosing-bugs](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/diagnosing-bugs-skill-content-176ba348.png)

Vòng phản hồi này có thể là một bài test bị fail, một đoạn lệnh `curl`, một lệnh CLI với đầu vào cố định, một script Playwright hoặc kịch bản replay lại request thực tế. Nó phải tóm trúng lỗi gốc, chạy ổn định, đủ nhanh, và Agent có thể tự mình thực thi độc lập.

Trong trường hợp thực sự không thể tái hiện được, nó sẽ liệt kê toàn bộ các phương án đã thử, rồi xin người dùng cung cấp môi trường tái hiện, file HAR, log server, `core dump` hoặc quyền chèn log tạm thời trên môi trường production.

Sau khi vòng phản hồi đã sẵn sàng, nó mới lặp lại việc tái hiện và thu hẹp dần dữ liệu đầu vào. Tiếp theo liệt kê 3–5 giả thuyết có thể bác bỏ được, nêu rõ "Nếu nguyên nhân là cái này, thay đổi điều gì thì hiện tượng lỗi sẽ biến đổi ra sao", rồi dựa vào dự đoán đó để đặt breakpoint hoặc chèn log có chủ đích.

Giai đoạn sửa lỗi sẽ chuyển bài tái hiện tối thiểu đó thành một bài regression test, quan sát thấy nó báo đỏ (fail) trước tại đúng interface của module liên quan, rồi mới áp dụng code sửa lỗi để chuyển sang xanh (pass). Trước khi kết thúc, chạy lại kịch bản ban đầu một lần nữa, dọn sạch toàn bộ log tạm thời và code debug có gắn tiền tố định danh, và ghi nguyên nhân gốc rễ vào commit message hoặc PR.

Quy trình này cực kỳ phù hợp với những con Bug khó tái hiện, suy giảm hiệu năng và những sự cố đã đoán mò vài hiệp mà vẫn chưa ra. Lỗi biên dịch hay lỗi gõ sai tên biến rõ mười mươi thì không cần thiết phải bày vẽ cả một quy trình chẩn đoán làm gì. Khi dự án thiếu các điểm nối kiểm thử (test seams) phù hợp, bài tái hiện tối thiểu cũng không thể biến thành bài test đáng tin cậy được; lúc này Skill sẽ ghi nhận lại vấn đề về mặt kiến trúc, chứ tuyệt đối không cố gượng ép viết ra một bài unit test đi lệch khỏi cách thức gọi hàm thực tế.

## `code-review`: Tách riêng việc soi quy chuẩn code và soi việc đáp ứng yêu cầu

Code Review thông thường rất hay chỉ nhìn vào chất lượng code: Đặt tên có rõ không, có trùng lặp logic không, xử lý ngoại lệ có hợp lý không, viết test đã đủ chưa. Bản thân đoạn code có thể chẳng bới ra được lỗi gì lớn, nhưng thực tế nó lại làm sai bét yêu cầu nghiệp vụ.

[`code-review`](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md) chia việc review thành hai nhánh riêng biệt: `Standards` và `Spec`.

![Quy trình Code Review trục kép trong Skill code-review](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/code-review-skill-content-88775bd3.png)

Nhánh `Standards` sẽ đọc file `CONTRIBUTING.md` và các quy chuẩn code của chính repository, rồi kiểm tra xem thay đổi có tuân thủ quy ước hay không. Phiên bản hiện tại còn tích hợp sẵn một bộ `Fowler Code Smells`. Các quy tắc văn bản rõ ràng của repo sẽ được ưu tiên cao nhất, còn Code Smell chỉ đóng vai trò là manh mối phán đoán chứ không được tính ngay là lỗi vi phạm.

Nhánh `Spec` sẽ quay trở lại với Issue, PRD hoặc phương án kỹ thuật ban đầu, kiểm tra xem nội dung bàn giao có thực sự bao phủ được yêu cầu gốc hay không. Hai nhánh review này được thực hiện độc lập bởi các Subagent chạy song song, cuối cùng mới gộp kết quả lại, tránh việc ngữ cảnh soi phong cách code làm phân tâm việc kiểm tra yêu cầu.

Trước khi review còn phải cố định một `commit`, branch, `tag` hoặc nhánh `main` làm mốc so sánh cơ sở. Skill dựa vào `merge base` để xem toàn bộ `diff` từ đó tới `HEAD`, chứ không đọc lan man toàn bộ repository.

Nếu dự án không có PRD, Issue hay tiêu chuẩn nghiệm thu thì nhánh `Spec` đành phải bỏ qua; nếu repo không có quy ước code riêng thì `Standards` sẽ dựa nhiều hơn vào các Code Smell phổ biến. Việc review song song cũng đòi hỏi Agent chủ phải hỗ trợ cơ chế Subagent. Hệ thống CI, công cụ phân tích tĩnh và việc con người review về mặt nghiệp vụ chuyên sâu vẫn bắt buộc phải được duy trì.

## Cách thức cài đặt

Repository này có thể thông qua trình cài đặt của `skills.sh` để tích hợp vào Codex, Claude Code cùng các công cụ có hỗ trợ Agent Skills:

```bash
npx skills@latest add mattpocock/skills
```

Trình cài đặt sẽ cho bạn chọn Skill cụ thể và Agent mục tiêu. Nếu chỉ muốn trải nghiệm việc phỏng vấn làm rõ yêu cầu, bạn có thể chọn trước `grill-me` và `grilling`. Nếu cần duy trì `CONTEXT.md` và ADR trong quá trình thảo luận thì chọn thêm `grill-with-docs` và `domain-modeling`.

Theo hướng dẫn hiện tại của dự án, trước khi sử dụng chuỗi kỹ thuật công trình bạn còn cần chạy lệnh `/setup-matt-pocock-skills` một lần trong repo mục tiêu, để xác nhận phương thức quản lý tác vụ qua GitHub, Linear hay nội bộ, đồng thời chốt nhãn `Triage` và thư mục lưu trữ tài liệu của Agent.

Bạn cũng có thể bảo thẳng Coding Agent cài đặt giúp bạn, ở đây lấy Codex làm ví dụ:

```text
Hãy giúp tôi cài đặt 4 Agent Skill từ repository mattpocock/skills: grilling, research, diagnosing-bugs, code-review.
```

![Codex dùng skill-installer cài đặt mattpocock skills](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/codex-install-mattpocock-skills-2adbd954.png)

Sau khi cài đặt xong, thông thường phải sang phiên hội thoại tiếp theo thì chúng mới xuất hiện trong danh sách Skill khả dụng.

Các Skill như `tdd`, `to-spec` và `to-tickets` không được liệt kê riêng ở đây. TDD, viết đặc tả kỹ thuật và chia nhỏ tác vụ vốn đã là các phương pháp công nghệ rất phổ biến, nhiều Agent hiện nay cũng đã tự hoàn thành được phiên bản cơ bản. Chỉ khi nào dự án áp dụng trọn vẹn chuỗi "Thảo luận → Spec → Tickets → Triển khai → Review" thì mới cần ghép nối chúng lại với nhau.

Bốn Skill được chọn lọc trong bài viết này tương ứng chính xác với những điểm thất bại mà bản thân mình quan tâm nhất hiện nay: Trước khi khởi công chưa định rõ hướng đi, nguồn tài liệu tra cứu không đáng tin cậy, Bug chưa tái hiện được đã vội vàng đoán mò, và code viết xong xuôi nhưng lại không đối chiếu lại với yêu cầu ban đầu.

Lần đầu cài đặt không nhất thiết phải bật trên toàn cục. Hãy khoanh vùng trong một repository cụ thể trước, lấy 2-3 tác vụ thực tế để quan sát số lần phải làm lại, thời gian thực thi và chất lượng sản phẩm đầu ra. Nếu mô hình khi không có Skill vẫn hoàn thành ổn định thì xóa bỏ; còn nếu cùng một vấn đề cứ lặp đi lặp lại thì hãy giữ lại đúng mẩu quy trình nhỏ đó.

Skill của bên thứ ba chính là những câu lệnh chỉ thị giao cho Agent. Trước khi cài đặt hãy đọc qua `SKILL.md` một lượt, kiểm tra kỹ thư mục `scripts/`, `references/` và các đòi hỏi về quyền hạn. Danh sách công cụ ngắn đi một chút cũng chẳng sao, quan trọng là biết rõ vì sao từng Skill còn tồn tại, khi sử dụng trong lòng bạn sẽ thấy an tâm hơn rất nhiều.
