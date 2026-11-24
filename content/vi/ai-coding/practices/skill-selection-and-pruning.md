---
title: "Thời đại mô hình mạnh mẽ, có còn cần thiết phải cài đặt AI Coding Skills nữa không?"
description: "Từ trải nghiệm thực tế với Codex, Superpowers và grilling, thảo luận xem trong thời đại mô hình mạnh những Skill nào có thể xóa bỏ, và những quy trình làm việc nào vẫn xứng đáng được giữ lại lâu dài."
category: Thực chiến lập trình AI
tag:
  - Lập trình AI
  - Codex
  - Skills
  - Superpowers
lang: vi
sourceRef: zh-ref/ai-coding/practices/skill-selection-and-pruning.md
head:
  - - meta
    - name: keywords
      content: AI coding,Codex,Skills,Superpowers,grilling,AGENTS.md,Subagent,Plugin
---

Cách đây vài hôm trên Zhihu mình thấy có một câu hỏi: **Codex khi đã dùng GPT-5.6 rồi thì Skills còn cần thiết tới mức nào nữa?**

![Câu hỏi trên Zhihu về việc Codex dùng GPT-5.6 rồi thì có còn cần Skills hay không](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/zhihu-codex-gpt56-skills-question-d4addea4.png)

Một câu hỏi trên mạng và sự thay đổi trong thói quen sử dụng của cá nhân mình đương nhiên không thể đại diện cho toàn bộ xu hướng của cả ngành. Nói chính xác hơn: Mình nhận thấy hiệu quả mang lại của một bộ phận các Skill hỗ trợ lập trình trong tay mình đang có xu hướng giảm sút rõ rệt, thế nên mình muốn rà soát lại xem cái nào nên giữ, cái nào nên xóa bỏ.

Bây giờ mỗi khi nhìn thấy một Skill mới, mình sẽ xem xét trước xem nó thực sự cung cấp năng lực gì cụ thể. Nếu không có tác dụng thật rõ ràng, chắc chắn mình sẽ không cài.

Hai năm trước, các mô hình AI làm việc rất hay bỏ sót các bước, Skill viết càng chi tiết thì người dùng càng thấy yên tâm. Giờ đây những mô hình như GPT-5.6, Kimi K3, Claude Fable 5 cơ bản đã có thể tự hoàn thành rất nhiều thao tác nền tảng, mình cũng bắt đầu tiến hành thanh lọc lại kho Skill trong tay.

> Dưới đây mình sẽ lấy Codex làm ví dụ về Coding Agent để phân tích, các công cụ khác cũng hoàn toàn tương tự.

## Rất nhiều bước căn bản giờ đây không cần phải cầm tay chỉ việc nữa

Các Skill lập trình trước đây thường được viết như một danh sách tác nghiệp tỉ mỉ: đọc dự án ra sao, tìm chuỗi gọi hàm (call chain) thế nào, sửa code xong phải chạy những bài test gì, trước khi tạo PR cần kiểm tra lại những điều gì. Khi năng lực mô hình chưa đủ ổn định, những lời nhắc nhở này quả thực rất có giá trị.

Hiện tại nếu bảo Codex sửa một con Bug, chỉ cần hiện tượng lỗi, kết quả kỳ vọng và tiêu chuẩn nghiệm thu tương đối rõ ràng, nó thường có thể tự mình đọc hiểu các đoạn code liên quan, lần theo chuỗi gọi hàm để định vị nguyên nhân, rồi tự hoàn thành phần code kèm các bước kiểm chứng cơ bản. Khi cấu trúc dự án quá phức tạp, điểm chạy test đặc thù hoặc rủi ro thay đổi quá cao, bạn vẫn cần phải chỉ rõ cho nó biết phải chạy những bước kiểm tra nào, tuyệt đối không được phó mặc hoàn toàn khâu kiểm chứng cho mô hình tự đoán.

Các tác vụ kéo dài, quy trình phê duyệt và phối hợp đa Agent thì bản thân Codex hiện nay cũng đã tích hợp sẵn năng lực tương ứng. Khi cần mở rộng quy trình nhiệm vụ hoặc bổ sung năng lực bên ngoài, ta vẫn có thể dùng thêm Skills, Plugins, MCP và Hooks. Tình trạng "không viết chi tiết từng li từng tí là y như rằng đi chệch hướng" của ngày trước nay đã giảm đi rất nhiều.

![Claude Code PreToolUse Hook](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-runs-rm-rf-tmp-build-what-happens-520c7930.svg)

Một file `SKILL.md` nếu không chứa đựng các ràng buộc đặc thù của dự án, cũng chẳng có script, template hay danh mục kiểm tra riêng biệt nào mà chỉ nhai đi nhai lại các bước phát triển thông thường thì mình thường sẽ không giữ lại. Nó chẳng cung cấp thêm được bao nhiêu thông tin mới cho mô hình, nhưng lại rất có thể bắt một tác vụ con con phải đi qua thêm vài tầng thủ tục rườm rà.

## Cài đặt quá nhiều Skill cũng phải trả giá bằng chi phí

Codex không đọc toàn bộ nội dung của tất cả các file `SKILL.md` ngay từ khi phiên làm việc vừa bắt đầu. Trước tiên nó chỉ lấy tên, mô tả và đường dẫn của từng Skill; khi nào tác vụ khớp với mô tả thì nó mới nạp nội dung chi tiết—cơ chế này gọi là Tiết lộ tiệm tiến (Progressive Disclosure).

Theo [Tài liệu Skills của Codex](https://learn.chatgpt.com/docs/build-skills), danh sách Skill khởi tạo chỉ được chiếm tối đa 2% cửa sổ Context của mô hình; trong trường hợp không xác định được kích thước cửa sổ thì giới hạn trần là 8.000 ký tự. Khi vượt quá ngân sách này, Codex sẽ ưu tiên rút ngắn phần mô tả trước. Nếu số lượng tiếp tục tăng lên, một số Skill thậm chí có thể bị loại hẳn ra khỏi danh sách ban đầu.

Khi bạn cài tới 100 Skill, thứ mà Agent nhìn thấy trước khi bắt tay vào việc có khi đã không còn là 100 bản mô tả nguyên vẹn nữa rồi.

Nếu phần mô tả viết quá rộng, một chỉnh sửa code bình thường cũng có thể kích hoạt trúng cùng lúc mấy Skill khác nhau. Khi các quy tắc bị xung đột, Codex lại phải tốn công phân xử xem hiện tại nên tuân theo quy trình nào. Chưa kể nếu lẫn vào vài bản hướng dẫn lâu ngày không ai bảo trì, đến khi nhiệm vụ bị chệch hướng bạn sẽ rất khó tìm ra ngay được nguyên nhân là từ đâu.

Cửa sổ Context ngày càng phình to cũng không giải quyết triệt để được vấn đề này. Lịch sử trò chuyện cũ, mô tả công cụ và phần mô tả Skill đều có thể nhồi hết vào trong, nhưng những ràng buộc thực sự sống còn của một dự án thường chỉ vỏn vẹn trong vài câu ngắn gọn. Nội dung càng tạp nham thì yêu cầu then chốt lại càng dễ bị chìm nghỉm.

![Vì sao Context lại mất tác dụng](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-does-the-following-content-fail-7c336a26.png)

Skill thực ra rất giống dấu trang (bookmark) trên trình duyệt web. Lúc mới bắt đầu nhìn thấy cái gì cũng muốn lưu lại, cứ nghĩ sau này thế nào cũng dùng tới. Nửa năm sau nhìn lại, những cái thực sự dùng thường xuyên cũng chỉ quanh quẩn vài cái quen thuộc.

Từ khi Skill xuất hiện cho tới nay, số lượng Skill mà mình thường xuyên sử dụng và sẵn lòng bảo trì lâu dài chưa tới 20 cái. Chẳng hạn như [draw.io Chart Skill](https://mp.weixin.qq.com/s/rAKCSFHB407v6fe35ix0rg) mà mình hay dùng khi viết bài: nó giúp cố định phong cách biểu đồ, đồng thời tránh được những lỗi căn chỉnh bố cục mà mình liên tục gặp phải. Những Skill dạng này kết tinh sở thích cá nhân và kinh nghiệm thực tiễn rất cụ thể, điều mà mô hình khi tự do ứng biến tại chỗ rất khó duy trì được kết quả đồng nhất.

## Quy tắc rốt cuộc nên đặt ở đâu?

Rất nhiều Skill càng viết càng phình to ra chỉ vì người ta cứ tiện tay nhét mọi quy tắc vào đó. Hiện tại mình phân chia vị trí dựa theo phạm vi ảnh hưởng của quy tắc:

- Các quy ước dự án mà vòng lặp nào cũng bắt buộc phải tuân theo: đặt vào `AGENTS.md` hoặc các file quy tắc của dự án.
- Các quy trình chỉ dùng trong một loại nhiệm vụ cụ thể: viết thành Skill.
- Các cuộc điều tra nhánh phụ tốn nhiều thời gian và sinh ra lượng lớn thông tin rác trung gian: giao cho Subagent.
- Khi cần phân phối đồng bộ Skills, Hooks, MCP và các cổng kết nối cho toàn đội: đóng gói thành Plugin.
- Những ràng buộc mang tính máy móc mà chỉ cần sót một lần là to chuyện: giao cho Hook, CI, linter hoặc bài test tự động.

File quy tắc quản lý việc *dự án này luôn luôn phải làm như thế nào*, còn Skill quản lý việc *khi gặp phải một loại tác vụ nào đó thì làm ra sao*. Đem hai thứ này trộn lẫn vào nhau, cuối cùng bạn sẽ chỉ nhận lại một file `SKILL.md` dài dằng dặc, cái gì cũng muốn quản mà lại cực kỳ khó bảo trì.

Skill có thể mang theo script, tài liệu tham khảo và template, được nạp lên theo nhu cầu khi khớp đúng nhiệm vụ. Khi toàn đội cần cài đặt và phân phối thống nhất, hãy dùng Plugin để đóng gói những năng lực đó lại.

![Tiết lộ tiệm tiến (Mô hình 3 tầng)](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-progressive-disclosure-three-layer-model-81f54306.png)

Nếu muốn tìm hiểu một cách bài bản về sự phân công giữa Skill, Prompt, MCP và Function Calling, bạn có thể xem bài viết [Agent Skills là gì? Khác biệt thế nào so với Prompt và MCP?](https://javaguide.cn/ai/agent/skills.html). Bài viết này chỉ tập trung thảo luận việc chọn lọc và lược bỏ, không nhắc lại chi tiết về mặt kỹ thuật.

## Vì sao mình rất hiếm khi dùng Superpowers nữa?

Những bộ công cụ bao quát toàn bộ quy trình phát triển như [Superpowers](https://github.com/obra/superpowers), hiện tại mình rất ít khi đụng tới.

Khi mình mang vấn đề này ra thảo luận trong nhóm, phản hồi của mọi người cũng rất tương đồng: **Superpowers rất dễ khiến các tác vụ nhỏ phải gánh một quy trình quá nặng nề; còn `grilling` tuy hỏi dồn dập liên tục nhưng lại giúp chốt yêu cầu cực kỳ rõ ràng.**

![Thành viên nhóm thảo luận về việc Superpowers quá nặng quy trình và Grilling giúp giảm bớt việc làm lại](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/group-chat-superpowers-grilling-feedback-935c5501.png)

Superpowers cung cấp một phương pháp luận phát triển phần mềm trọn vẹn: trước tiên dùng brainstorming để làm rõ yêu cầu, sau đó dùng writing-plans chia nhỏ nhiệm vụ, theo test-driven-development viết test và triển khai code, dùng Git worktree để cách ly không gian phát triển, giao cho Subagent thực thi theo từng chặng, cuối cùng làm Code Review và kiểm chứng trước khi hoàn thành.

Các dự án phức tạp, codebase hoàn toàn xa lạ và các đợt sửa đổi rủi ro cao thì vẫn rất phù hợp với quy trình này.

Thế nhưng nếu chỉ sửa một chỗ logic kiểm tra hay bổ sung một bài test nhỏ xíu, mà vừa vào đã bắt phải chạy đủ các bước "Làm rõ yêu cầu → Thiết kế → Kế hoạch → Thực thi → Review → Kiểm chứng", thì thời gian rất dễ bị chính cái quy trình đó ngốn sạch. Quy trình càng hoàn chỉnh bao nhiêu thì thời điểm kích hoạt nó lại càng phải cân nhắc kỹ bấy nhiêu; khi tác vụ không đủ độ phức tạp, nó sẽ biến từ một chiếc khiên bảo vệ thành một gánh nặng đè lên vai bạn.

Codex hiện nay đã có thể tự điều chỉnh các bước trong quá trình thực thi, và cũng sẽ chủ động xin xác nhận khi thiếu thông tin then chốt. Rất nhiều tác vụ nhỏ chỉ cần bổ sung vài dòng ràng buộc dự án là đủ, hoàn toàn không cần thiết lần nào cũng phải khoác lên mình nguyên cả một cuốn sổ tay vận hành dày cộp.

Các Skill bên thứ ba còn tiềm ẩn rủi ro bảo mật. Bản thân `SKILL.md` chính là câu lệnh chỉ thị cho Agent; bên trong nếu cài cắm các lệnh nguy hiểm, script bất thường hay đòi hỏi quyền hạn quá rộng, Agent rất có thể sẽ răm rắp làm theo. Trước khi cài đặt tối thiểu hãy đọc qua một lượt `SKILL.md`, thư mục `scripts/` và `references/`; bộ công cụ càng đồ sộ thì bạn càng phải nắm thật rõ xem nó sẽ bảo Agent làm những gì.

## Mình thích cách kết hợp tinh gọn như mattpocock/skills hơn

Superpowers dùng một phương pháp luận hoàn chỉnh để bao bọc cả quá trình phát triển, còn [mattpocock/skills](https://github.com/mattpocock/skills) lại giống như một hộp đồ nghề chứa các công cụ có thể tháo rời độc lập.

Các Skill trong repository này được thiết kế thành những module nhỏ gọn, dễ sửa đổi và có thể phối ghép linh hoạt. Yêu cầu chưa rõ ràng thì dùng `grilling` để truy vấn; Bug khó định vị thì mới bật `diagnosing-bugs`; khi cần tuân thủ nghiêm ngặt chu trình TDD đỏ-xanh-refactor thì dùng riêng `tdd`; chuẩn bị merge code thì để `code-review` vào soi. Chúng không mặc định bắt ép mọi tác vụ đều phải đi qua cùng một đường ray duy nhất.

Cách bóc tách này cực kỳ ăn khớp với các mô hình mạnh hiện nay. Những bước mà Codex vốn đã tự làm tốt thì không cần dạy lại nữa; mắt xích nào hay mắc lỗi thì chỉ cần gia cố đúng chỗ đó. Khi nhiệm vụ trở nên phức tạp hơn, ta mới ghép vài Skill lại với nhau.

![Thành viên nhóm thảo luận trải nghiệm sử dụng các Skill tinh gọn so với Superpowers](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/group-chat-lightweight-skills-feedback-ce048c69.png)

Trong số đó, mình đặc biệt thích [`grilling`](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md).

Quy tắc của nó rất ngắn gọn: trước khi bắt tay vào gõ code hãy liên tục truy vấn dồn dập để làm cho ra ngô ra khoai kế hoạch, quyết định và quan hệ phụ thuộc; mỗi lần chỉ hỏi đúng một câu, đợi người dùng trả lời xong mới tiếp tục; những sự thật nào có thể tự tra cứu từ môi trường thì tự đi mà tra, những quyết định đòi hỏi sự đánh đổi mới giao lại cho người dùng quyết định.

## Những Skill nào vẫn còn xứng đáng giữ lại?

Hiện tại mình ưu tiên giữ lại 3 nhóm Skill sau.

Nhóm thứ nhất là sở thích cá nhân và những sản phẩm đầu ra cố định mà mô hình rất khó tự đoán mò từ trên trời rơi xuống, ví dụ như phong cách viết bài, quy chuẩn vẽ biểu đồ, template nội bộ công ty và quy trình release đặc thù của một repository nào đó. Có những ràng buộc này thì mỗi lần bàn giao sản phẩm mới giữ được cùng một chuẩn mực đồng nhất.

Nhóm thứ hai là các tác vụ đòi hỏi sự phán đoán chuyên sâu, có kèm script hoặc tài liệu tham khảo chuyên ngành. Review bảo mật, xử lý tài liệu phức tạp, di chuyển framework đặc thù và kiểm tra môi trường production—chỉ dựa vào một câu Prompt khó lòng bao quát hết mọi chi tiết. Skill có thể gom các mục kiểm tra, script công cụ và nguồn chứng cứ lại một chỗ, khi nào dùng tới mới tải lên.

Nhóm thứ ba là những quy trình giúp giảm thiểu sai lầm về phương hướng. `grilling` chính là đại diện tiêu biểu: nó không hề viết code thay cho Codex, nó chỉ giúp cố định khâu xác nhận yêu cầu trước khi khởi công. Mô hình thực thi càng nhanh thì những quy trình "chốt chắc hướng đi trước" như thế này lại càng xứng đáng được giữ lại.

## Mình đã dùng grilling để làm rõ một yêu cầu thực tế như thế nào

Trường hợp thực tế này đến từ dự án mã nguồn mở của mình: [Nền tảng phỏng vấn thông minh SpringAI (Bản 2.0 đã mở mã nguồn)](https://javaguide.cn/zhuanlan/interview-guide.html). Khi đó mình dự định thông luồng giữa tính năng phỏng vấn thử nghiệm và kho tri thức (Knowledge Base), nhiệm vụ giao cho `grilling` cũng rất thẳng thắn: Giúp tôi suy nghĩ thật thấu đáo về việc này.

Thực tế code hiện có đã gần với việc "thông luồng" hơn mình tưởng: Cả phỏng vấn bằng kho tri thức lẫn phỏng vấn thử thông thường đều đang dùng chung `InterviewSession`, khâu trả lời, chấm điểm và một phần giao diện frontend vốn đã được tái sử dụng. Lần này hoàn toàn không cần phải vội vã đụng vào tầng dưới, việc cần làm trước mắt là chốt phạm vi sản phẩm cho giai đoạn 1.

![Dùng Grilling để chốt phương án thông luồng giữa phỏng vấn thử và kho tri thức](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/grilling-springai-interview-platform-case-31a812ef.png)

Câu hỏi đầu tiên mà nó đưa ra là: Giai đoạn 1 sẽ làm "phỏng vấn định hướng hoàn toàn dựa trên tài liệu người dùng tải lên", hay vẫn để người dùng chọn các Skill như Java, System Design như bình thường rồi kho tri thức chỉ đóng vai trò bổ sung context?

Nó kiến nghị nên làm phương án đầu trước. Khâu sinh câu hỏi, phân loại, độ khó, câu hỏi truy vấn cố định và quy tắc chấm điểm hiện có đều bám sát theo luồng này hơn, chỉ cần thống nhất lối vào và lịch sử là có thể chạy thông được ngay. Còn phương án sau sẽ kéo theo hàng loạt vấn đề như tỷ lệ phối trộn giữa câu hỏi Skill và câu hỏi tri thức, RAG thời gian thực, xung đột nguồn dữ liệu, căn cứ đánh giá và khử trùng lặp câu hỏi, phạm vi cải tạo sẽ lớn hơn rất nhiều.

Sau khi mình xác nhận mục tiêu giai đoạn 1, nó mới hỏi tiếp: Một buổi phỏng vấn chỉ chọn 1 kho tri thức, hay cho phép kết hợp nhiều kho tri thức? Vì request hiện tại, trường session và bộ lọc ngân hàng câu hỏi đều chỉ có duy nhất một `knowledgeBaseId`, nên nó khuyên giai đoạn 1 cứ giới hạn trong một kho tri thức thôi, đợi quy trình ổn định rồi mới tính tới chuyện liên kết đa kho.

Tiếp theo là lối vào. Phỏng vấn kho tri thức vốn đã có trang riêng, còn phỏng vấn thông thường đi vào từ "Trung tâm phỏng vấn thử". Cuối cùng chốt lại là duy trì cả hai lối vào song song, nhưng dùng chung một component cấu hình và API tạo mới, tránh việc phải bảo trì hai bộ logic tương tác tách biệt.

Code còn chưa cần sửa một dòng nào, nhưng phạm vi sản phẩm, data model và cách thức tái sử dụng lối vào đều đã được ấn định rõ ràng.

Mình sẵn lòng giữ lại `grilling` là vì mô hình viết code giờ đây đã quá nhanh rồi, việc phải làm lại phần lớn xảy ra khi ta bắt tay vào làm quá sớm: Phạm vi yêu cầu chưa chốt, xử lý ngoại lệ chưa bàn tới, kịch bản người dùng và sự đánh đổi kỹ thuật vẫn còn mơ hồ. Agent cứ theo cách hiểu của riêng nó mà làm một mạch từ đầu tới cuối, để rồi sau cùng có khi lại phải đập đi xây lại hết.

**Mô hình càng mạnh, tốc độ thực thi càng nhanh, thì cái giá phải trả cho việc đi sai hướng lại càng đắt đỏ.**

`grilling` không dạy mô hình cách viết code, nó chỉ biến hành động "trước khi làm phải hỏi cho rõ" thành một quy trình có thể lặp lại một cách ổn định. Mô hình mạnh mẽ đến đâu cũng không thể tự động xóa bỏ được giá trị của quy trình này.

## Tiêu chí cắt giảm Skill của mình

Bây giờ mỗi khi chuẩn bị cài đặt một Skill, mình đều sẽ tự hỏi thêm vài câu:

- Việc này mô hình vốn dĩ có tự làm được không?
- Khi không có nó, mình có liên tục bị lật xe ở đúng một chỗ hay không?
- Bản thân nó có đóng gói script, template, tài liệu chuyên sâu hay sở thích cá nhân nào không?
- Sau khi quy tắc hết hạn, mình có thể kịp thời phát hiện và xóa nó đi được không?

Những Skill chỉ biết nhắc nhở kiểu "trước tiên đọc dự án, rồi viết code, cuối cùng chạy test", bây giờ mình cơ bản sẽ xóa thẳng tay. Dự án nếu thực sự có yêu cầu đặc thù thì ghi vào `AGENTS.md` sẽ chuẩn hơn nhiều; còn những phần kiểm tra test, format và ranh giới bảo mật có thể thực thi một cách máy móc thì giao cho CI, Hook hoặc linter đảm nhiệm.

Chỉ khi nào liên tục vấp ngã ở cùng một chỗ, đặc biệt là những tác vụ mà cái giá phải trả khi mắc lỗi không hề rẻ, thì mới đáng để viết riêng một Skill cho nó. Bên trong chỉ giữ lại những phán đoán mấu chốt và hành động kiểm chứng, đủ giải quyết vấn đề là dừng, tuyệt đối không tiện tay bành trướng nó thành một bộ quy trình to tát đồ sộ.

Để tìm hiểu xem hiện có những Skill sẵn nào và chúng phù hợp với tác vụ gì, bạn có thể xem tiếp [Danh mục lựa chọn Skills lập trình AI](https://javaguide.cn/ai-coding/practices/programmer-essential-skills.html). Còn về sự phân chia nhiệm vụ giữa `AGENTS.md`, phân quyền, MCP, Skills và Scheduled Tasks trong Codex, bạn có thể tham khảo [Cẩm nang thực hành tốt nhất cho OpenAI Codex](https://javaguide.cn/ai-coding/practices/codex-best-practices.html).

Bài viết này tuy đặt tiêu đề là "có còn cần thiết nữa không", nhưng mình không hề có ý định xóa sạch toàn bộ Skill. Mình chỉ là không còn thấy cái gì cũng nhắm mắt cài đặt nữa mà thôi.

Bây giờ gặp Skill mới, mình sẽ thử chạy không dùng nó trước một lần. Nếu chạy tốt thì không cài; nếu cùng một vấn đề lặp đi lặp lại nhiều lần, lúc đó mới giữ lại đúng mẩu quy trình nhỏ đó. Dọn dẹp xong xuôi theo cách này, danh sách Skill có thể ngắn đi rất nhiều, nhưng mỗi Skill vì sao còn tồn tại, trong lòng bạn sẽ luôn rõ mười mươi.
