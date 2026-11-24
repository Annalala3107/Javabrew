---
title: "Chi tiết cơ chế Multi-Agent trong Claude Code: Subagent, Subtask, Fork và Agent Teams"
description: "Kết hợp tài liệu chính thức của Claude Code và phân tích mã nguồn cộng đồng, bài viết bóc tách Subagent, Subtask, Fork Session, Agent Teams, cộng tác tác vụ, phân quyền và kiểm soát chi phí, giúp bạn hiểu rõ cách cơ chế đa Agent phân rã tác vụ, cô lập context và quản lý cộng tác."
category: Nguyên lý AI Coding
tag:
  - Claude Code
  - Multi-Agent
  - AI Agent
  - AI Coding
lang: vi
sourceRef: zh-ref/ai-coding/principles/claude-code-multi-agent.md
head:
  - - meta
    - name: keywords
      content: Claude Code,Multi-Agent,Subagent,Subtask,Fork Session,Agent Teams,AI Agent,Cô lập context,Cộng tác tác vụ,AI Coding
---

Xin chào các bạn, mình là Tiểu G. Gần đây có một bạn đọc hỏi mình: Subagent, Fork, Agent Teams trong Claude Code rốt cuộc có phải là cùng một thứ hay không? Nếu trong phỏng vấn bị hỏi về cơ chế Claude Code Multi-Agent thì nên trả lời thế nào?

Câu hỏi này ban đầu mình cũng tưởng chỉ là vài cái tên gọi lòng vòng. Nhưng khi đặt tài liệu chính thức, changelog và phân tích mã nguồn từ cộng đồng lại với nhau, mình mới nhận thấy sự khác biệt là rất lớn.

Một Agent đơn lẻ trong Claude Code đã có thể làm được khá nhiều việc: sửa code hàng ngày, tra cứu sự cố, viết bổ sung test—phần lớn thời gian đều đáp ứng tốt.

Vấn đề là, các tác vụ trong dự án thực tế thường không hề tinh gọn như vậy. Một phiên làm việc vừa phải tìm kiếm, đọc hiểu, thử sai, lại vừa phải tạo ra kết quả sửa đổi cuối cùng, nói chuyện một hồi là context sẽ bị bẩn và nhiễu loạn ngay.

Chẳng hạn khi xử lý sự cố hiệu năng của một API, nó có thể tìm kiếm endpoint trước, rồi đọc Mapper, xem log, tra cứu index, và ở giữa còn chạy thử vài câu lệnh SQL. Đến khi thực sự cần sửa code, lịch sử trò chuyện đã chứa đầy các tệp không liên quan, các phỏng đoán cũ và những phương án đã bị bác bỏ.

Con người đọc còn thấy mệt mỏi, và mô hình cũng rất dễ bị những thông tin quy trình trung gian này dẫn dắt đi chệch hướng.

Cơ chế Multi-Agent của Claude Code nhắm thẳng vào **vấn đề context và phân rã tác vụ** này.

Nó không nhét tất cả công việc vào một phiên duy nhất, mà bóc tách theo tính chất của từng tác vụ:

- Tìm kiếm một lần giao cho Subagent;
- Khám phá nhánh phụ đã có sẵn context giao cho `/subtask`, khi cần tiếp tục độc lập thì dùng `/fork`;
- Những tác vụ cần sự cộng tác của nhiều vai trò thì mới nâng cấp lên Agent Teams.

Vì vậy mình đã tổng hợp các phần liên quan đến Multi-Agent trong Claude Code lại với nhau. Bài viết này sẽ tham khảo các phân tích mã nguồn từ cộng đồng để đi sâu vào tầng nguyên lý, đồng thời đối chiếu cách dùng hiện tại theo sát tài liệu chính thức và changelog.

Các tính năng này cập nhật rất nhanh. Thông tin phiên bản trong bài viết được đối chuẩn đến Claude Code v2.1.218 (2026-07-24): Từ bản v2.1.212 trở đi, trong điều kiện thông thường, forked subagent bên trong phiên hiện tại sử dụng `/subtask`, còn `/fork` sẽ sao chép toàn bộ hội thoại hiện tại và tạo ra một Session nền độc lập. Khi tắt Agent View thì có ngoại lệ: `/subtask` không khả dụng, `/fork` sẽ tiếp tục khởi chạy forked subagent bên trong phiên. Các bài viết cũ gọi chung cả hai hành vi này là Fork, rất dễ gây nhầm lẫn.

## Tại sao Claude Code cần nhiều Agent?

Viết một hàm nhỏ, sửa một cấu hình, bổ sung một đoạn test, thông thường một Agent là đủ dùng.

Tuy nhiên, khi thực thi các tác vụ xuyên module, một Agent có thể sẽ không kham nổi. Ví dụ, bạn bảo Claude Code xử lý một slow query trên production, nó có thể phải thực hiện liên tục các công việc sau:

- Tìm kiếm API và câu lệnh SQL liên quan;
- Đọc mã nguồn tầng ORM / Mapper;
- Kiểm tra index và execution plan (kế hoạch thực thi);
- Sửa đổi logic truy vấn;
- Bổ sung test hoặc script kiểm thử tải (stress test);
- Cuối cùng tổng kết nguyên nhân và các thay đổi.

Nếu tất cả các bước này đều do một Agent thực hiện và nhồi nhét hết vào phiên chính, rắc rối chủ yếu phát sinh ở hai điểm:

- Quá nhiều thông tin quy trình trung gian. Các tệp không liên quan tìm thấy lúc đầu, log cũ, phương án thất bại, phỏng đoán tạm thời đều lưu lại trong context. Về sau khi tiếp tục viết code, mô hình lại phải nhọc công đãi cát tìm vàng từ đống tài liệu lỗi thời này để tìm ra trọng tâm hiện tại.
- Quán tính tác vụ. Vừa phân tích xong vấn đề cơ sở dữ liệu, lượt sau lại bảo nó review component frontend, nó có thể vẫn mang theo góc nhìn phán đoán của lượt trước để xem xét vấn đề.

Vì vậy, theo cách hiểu của mình về Multi-Agent: **Trước hết phải bảo vệ tốt phiên chính. Phiên chính chịu trách nhiệm phán đoán, lên kế hoạch và hạ cánh mã nguồn; các việc nặng nhọc, tạp vụ, nhánh phụ cứ bóc tách được là bóc tách. Còn việc chạy song song tăng tốc chỉ là phần thưởng phụ đi kèm sau khi phân rã hợp lý.**

Tư duy này hoàn toàn trùng khớp với việc "cô lập quy trình nhánh phụ" trong Kỹ thuật Context (Context Engineering): phiên chính giữ lại sự phán đoán, kế hoạch và quyết định cuối cùng, giao các quy trình dễ gây phình to context như tìm kiếm, kiểm chứng, review cho các worker độc lập.

![Sub-agent phân rã tác vụ, cô lập context](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/sub-agent-task-splitting-context-isolation--635196e8.png)

Dưới đây là bảng tổng hợp do mình tự hệ thống lại. Khi nhìn vào đa Agent trong Claude Code, trước hết có thể phân biệt theo từng nhóm vấn đề:

| Vấn đề | Cơ chế phù hợp | Giải thích |
| ------ | -------------- | ---------- |
| Tìm kiếm nhánh phụ quá nhiều, làm bẩn phiên chính | Subagent | Agent phụ tự đọc tệp, tra cứu tài liệu, phiên chính chỉ nhận kết quả |
| Cần kế thừa context hiện tại để khám phá nhánh phụ | `/subtask` | Forked subagent bên trong phiên hiện tại kế thừa context và trả kết quả về |
| Cần sao chép hội thoại và tiếp tục làm việc độc lập | `/fork` | Tạo Session nền độc lập có thể quản lý và khôi phục riêng biệt |
| Nhiều vai trò cần cộng tác, trao đổi tin nhắn và nhận tác vụ | Agent Teams | Mỗi teammate là một instance Claude Code độc lập, có shared task list và cơ chế nhắn tin |

> **Khác biệt về môi trường**: Bảng này được tổng hợp theo trạng thái mặc định khi đã bật Agent View. Khi tắt Agent View, lệnh `/subtask` không khả dụng, lệnh `/fork` sẽ khởi chạy forked subagent bên trong phiên hiện tại.

Cùng mang chữ Agent trong tên, nhưng công việc chúng làm khác nhau rất nhiều:

- Cách dùng của Subagent tương tự như: "Cậu đi điều tra việc này đi, tra xong báo cáo lại cho tôi".
- `/subtask` sao chép context trong phiên hiện tại để làm tác vụ nhánh; `/fork` tạo Session nền độc lập.
- Agent Teams cho phép nhiều instance độc lập cùng làm việc trong một dự án, có thể gửi tin nhắn, nhận việc và tổng hợp lại sau cùng.

![So sánh giữa Subagents và Agent Teams](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-subagents-vs-agent-teams-e56e9e6b.png)

Ở đây còn một chi tiết: Bạn không nhất thiết phải chỉ định Subagent một cách thủ công. Tài liệu chính thức cho biết Claude sẽ dựa vào `description` của Subagent để tự quyết định khi nào nên ủy quyền; các Subagent tích hợp sẵn như Explore, Plan, general-purpose cũng sẽ tự động được sử dụng trong các tác vụ phù hợp.

Sau khi xem bảng trên, hãy đặt tiếp một câu hỏi thực tế hơn: Có cần chỉ định Subagent rõ ràng không, và khi nào thì nên nâng cấp lên Agent Teams?

Khi chọn lựa, trước hết hãy tự hỏi: **Các worker này có cần giao tiếp, trao đổi qua lại với nhau không?**

Nếu chỉ cần điều tra xong rồi báo cáo lại, dùng Subagent là quá đủ. Code review, phân tích log, khảo sát điểm đơn lẻ đều thuộc nhóm này.

Nếu các worker cần gửi tin nhắn cho nhau, nhận việc từ danh sách chung, trao đổi kết quả trung gian, lúc đó mới cần tính đến Agent Teams. Ví dụ một teammate phụ trách API backend, một người xem giao diện frontend, một người chuyên trách kiểm thử và nghiệm thu.

Về mặt chi phí cũng rất thực tế: mỗi teammate đều có cửa sổ context riêng, lượng tiêu thụ token sẽ tăng tỷ lệ thuận theo số lượng teammate đang hoạt động. Các tác vụ như nghiên cứu, review kiến trúc, phân rã tính năng mới thường rất xứng đáng; còn sửa đổi nhỏ hàng ngày thì phiên đơn lẻ vẫn tiết kiệm hơn nhiều.

## Subagent: Ủy quyền gọn nhẹ trong phiên chính

### Subagent là gì?

Subagent là cơ chế ủy quyền phổ biến nhất và ít bị lạm dụng nhất trong Claude Code.

Bạn có thể hiểu nó như một worker tạm thời do phiên chính phái đi. Nó có cửa sổ context riêng, có thể sử dụng các công cụ chỉ định. Sau khi hoàn thành tác vụ, nó trả kết quả về cho phiên chính mà không đổ toàn bộ quá trình tìm kiếm ồn ào ngược trở lại.

Phần lớn thời gian, Agent đọc thêm vài tệp không phải vấn đề lớn. Điều phiền toái là nó mang cả quá trình tìm kiếm, phán đoán tạm thời và những giả thuyết bị bác bỏ về lại phiên chính. Ưu điểm của Subagent nằm ở chỗ: để nó tự tra cứu, phiên chính chỉ lấy kết quả đã được chắt lọc.

Điểm này thực sự rất giá trị: phiên chính không bị hao tổn context oan uổng.

![Claude Code Explore Subagent: Tìm kiếm nhánh phụ thực thi dưới nền](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-explore-subagent-demo-329fa6cd.png)

Trong hình trên, phiên chính chỉ giao việc tìm kiếm liên quan đến đăng nhập, xác thực và phân quyền cho Explore subagent. Quá trình tìm kiếm diễn ra dưới nền, mạch hội thoại chính tiếp tục giữ sạch sẽ, đợi khi subagent kết thúc mới nhận về danh sách tệp, chuỗi gọi hàm và các điểm lưu ý tiếp theo.

![Claude Code Sub-Agent: Giữ cho cuộc trò chuyện chính luôn sạch sẽ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claudecode-sub-agent-ff5f7472.png)

Khi nào cần tùy biến Subagent riêng?

Tiêu chí đánh giá của mình là: Khi cùng một loại worker xuất hiện lặp đi lặp lại và lần nào bạn cũng phải đưa cho nó cùng một bộ chỉ thị, lúc đó hãy đúc kết thành Subagent tùy chỉnh. Chẳng hạn bạn thường xuyên giao cho nó việc review code chỉ đọc, kiểm tra câu lệnh cơ sở dữ liệu, quét bảo mật, phân tích nguyên nhân log—những tác vụ này có vai trò, quyền công cụ và định dạng đầu ra ổn định, rất đáng để cấu hình riêng một tệp.

Nếu chỉ là thỉnh thoảng tìm kiếm vài tệp, xem qua một đoạn log tạm thời, cứ để Claude Code dùng Subagent có sẵn hoặc ủy quyền thủ công là đủ, không cần tạo tệp chỉ để "trông có vẻ chuyên nghiệp".

Tệp tùy chỉnh thường đặt tại:

```text
~/.claude/agents/
.claude/agents/
```

Hai thư mục này không nhất thiết mặc định tồn tại sẵn. Nếu bạn chưa thấy thì rất bình thường, chứng tỏ trên máy bạn hoặc dự án hiện tại chưa từng tạo Subagent tùy chỉnh nào.

Trong tài liệu phiên bản mới, cách tạo trực tiếp hơn nhiều: bảo Claude viết giúp bạn, hoặc tự tạo thư mục rồi viết tệp Markdown. Lệnh `/agents` từ bản v2.1.198 không còn mở trình hướng dẫn tương tác nữa, mà chỉ nhắc bạn nhờ Claude tạo hoặc chỉnh sửa trực tiếp trong `.claude/agents/`. Nếu là lần đầu tiên tạo thư mục `agents` trong phiên làm việc, Claude Code có thể cần khởi động lại để phát hiện ra.

Subagent cấp người dùng có hiệu lực cho mọi dự án, còn Subagent cấp dự án thích hợp để chia sẻ cho cả nhóm.

Tệp Subagent là Markdown kết hợp YAML frontmatter, trong đó cấu hình tên, mô tả, công cụ, mô hình, chế độ phân quyền, hooks và skills. `name` và `description` là hai trường bắt buộc, trong đó `description` rất then chốt vì Claude sẽ dựa vào nó để đánh giá thời điểm tự động ủy thác.

### Subagent vận hành như thế nào?

Từ log runtime hoặc phân tích mã nguồn cộng đồng, các tham số gọi đơn lẻ của công cụ `Agent` đáng chú ý nhất gồm có:

| Tham số | Tác dụng |
| ------- | -------- |
| `description` | Tóm tắt tác vụ hiển thị cho phiên chính xem |
| `prompt` | Tác vụ cụ thể giao cho subagent thực thi |
| `subagent_type` | Chỉ định dùng loại Subagent nào; khi bỏ qua mặc định là `general-purpose`, không tự biến thành fork |
| `model` | Chỉ định bí danh mô hình mà subagent sử dụng |
| `run_in_background` | Có chạy nền hay không; từ bản v2.1.198 trở đi mặc định chạy nền nếu không cấu hình |
| `name` | Đặt tên có thể định danh cho Subagent chạy nền hoặc teammate trong Agent Teams |
| `team_name` | Tham số của Agent Teams ở phiên bản cũ; phiên bản mới vẫn nhận nhưng bỏ qua |

Bảng này thể hiện tham số gọi của công cụ `Agent`, không phải YAML frontmatter của `.claude/agents/*.md`. Trong tệp Subagent, cấu hình chạy nền và workspace tương ứng là các trường như `background`, `isolation`.

Bạn không cần học thuộc bảng này. Điều quan trọng là đừng tin vào lời truyền miệng cũ rằng "bỏ qua `subagent_type` là ngầm định fork". Lời gọi Agent thông thường khi không chỉ định loại sẽ dùng `general-purpose`; muốn kế thừa context, hãy sử dụng rõ ràng lệnh `/subtask` hoặc cấu hình fork tương ứng của phiên bản hiện tại.

Về mặt triển khai nội bộ, `AgentTool` chịu trách nhiệm làm cổng vào và định tuyến, còn thứ thực sự khởi chạy subagent là hàm `runAgent()`.

`runAgent()` sẽ thực hiện một loạt bước chuẩn bị runtime:

- Khởi tạo MCP Server mà agent cần;
- Tạo `ToolUseContext` riêng cho subagent;
- Thực thi các hooks liên quan đến `SubagentStart`;
- Ghi sidechain transcript và metadata của agent;
- Đi vào vòng lặp chính `query()`.

Những chi tiết này chứng minh một điều: Subagent không phải là một hàm gọi thông thường trong phiên chính. Nó tái sử dụng toàn bộ Agent runtime của Claude Code, có công cụ, quyền hạn, context, luồng tin nhắn và transcript riêng.

Vì vậy, nó rất thích hợp để gánh vác các tác vụ nhánh phụ tương đối trọn vẹn. Để nó đọc một loạt tệp, làm một lượt review và đưa ra kết luận sẽ sạch sẽ hơn nhiều so với việc nhét các bước đó vào phiên chính.

### Những tác vụ nào phù hợp giao cho Subagent?

Mình thường giao các tác vụ sau cho Subagent:

- Review chỉ đọc một module, sau cùng trả về danh sách vấn đề;
- Tìm kiếm một loại log lỗi cụ thể, phiên chính chỉ lấy kết luận;
- Tổng hợp cách dùng của một thư viện bên ngoài, không kéo quá trình tìm kiếm về;
- Kiểm chứng độc lập cho một lần sửa code, lỡ thất bại thì chạy lại lần khác rất dễ dàng.

Những việc cần phiên chính liên tục tham gia đánh giá thì tốt nhất đừng tách ra.

Ví dụ bạn đang sửa một tệp cốt lõi, cả phiên chính lẫn subagent cùng sửa một lúc thì khả năng cao là không tăng tốc được mà còn gây xung đột mã nguồn. Thói quen của mình là để Subagent làm nhiều việc đọc và kiểm chứng, ít khi để nó can thiệp trực tiếp vào việc sửa code mạch chính.

## `/subtask`, `/fork` và Agent chạy nền: Khi nào thì kế thừa context?

### Sự khác biệt giữa `/subtask` và Subagent thông thường

Subagent thông thường thường bắt đầu công việc bằng một prompt rõ ràng do phiên chính giao cho. Theo mặc định, nó không nên kế thừa toàn bộ lịch sử của phiên chính, nếu không thì ý nghĩa của việc "cô lập thông tin quy trình" sẽ biến mất.

`/subtask` đi theo một con đường khác: nó khởi chạy forked subagent ngay bên trong phiên hiện tại, kế thừa context hội thoại đã hình thành của phiên cha, rồi trả kết quả về mạch chính. Bạn bắt buộc phải chọn lộ trình này một cách rõ ràng; bỏ qua `subagent_type` sẽ không tự động kích hoạt implicit fork.

Điều này phù hợp cho một thời điểm tương đối đặc thù: phiên chính vừa mới xây dựng được một bộ context chất lượng cao, bạn không muốn lãng phí nó, nhưng lại muốn chia ra nhiều hướng để thử nghiệm.

Ví dụ phiên chính vừa đọc xong toàn bộ module thanh toán, bây giờ bạn muốn thuận tiện chia ra vài hướng điều tra:

- Điều tra lỗi thiết kế state machine;
- Điều tra lỗi logic tính lũy thừa (idempotency);
- Điều tra lỗ hổng độ bao phủ kiểm thử.

Lúc này `/subtask` thích hợp hơn Subagent thông thường rất nhiều. Mỗi child đều có thể nhận được context mà phiên cha vừa thiết lập, không cần phải đọc lại dự án từ đầu.

![Claude Code Fork: Khởi tạo nhánh nền dựa trên context hiện tại](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-fork-subagent-demo-76a196bf.png)

Hình ảnh trên ghi lại hành vi của lệnh `/fork` ở phiên bản cũ. Theo quy ước đặt tên từ sau v2.1.212, khi bật Agent View, việc phân nhánh context trong phiên hiện tại nên dùng `/subtask`; còn `/fork` hiện tại sẽ sao chép toàn bộ hội thoại sang một Session nền độc lập, có thể xem, khôi phục và tiếp tục riêng rẽ. Khi tắt Agent View, `/subtask` không khả dụng và `/fork` vẫn giữ hành vi forked subagent cũ.

### Thời điểm áp dụng và giới hạn của hai phương thức sao chép

Phân tích mã nguồn nội bộ cho thấy forked subagent trong phiên hiện tại sẽ tái sử dụng system prompt và lịch sử tin nhắn đã được render sẵn của phiên cha. Điều này rất có lợi cho việc tái sử dụng prompt cache, tuy nhiên đây là quan sát triển khai chứ không phải API ổn định công khai.

Làm như vậy mục đích chủ yếu là phục vụ prompt cache.

Nếu mỗi fork child đều gọi lại logic sinh system prompt từ đầu, dù nội dung trông có vẻ giống hệt nhau, vẫn có thể do cấu hình động, danh sách công cụ hay cờ thử nghiệm mà dẫn đến lệch byte.

Lệch byte thì tỷ lệ hit prompt cache sẽ bị ảnh hưởng.

Việc tái sử dụng context phiên cha ảnh hưởng đến prompt cache, đồng thời cũng gắn chặt Multi-Agent với các cơ chế hạ tầng như context và đăng ký công cụ.

Đó cũng là lý do vì sao `/subtask` thích hợp cho việc "context vừa chuẩn bị xong, lập tức mở thêm một nhánh phụ". Nếu nhánh phụ cần quản lý độc lập, tiếp tục sau này hoặc khôi phục riêng, thì dùng `/fork` hiện tại sẽ phù hợp hơn. Nếu lo ngại việc sửa tệp ảnh hưởng lẫn nhau, bạn có thể cấu hình `isolation: "worktree"` cho Agent để đưa các thay đổi vào một Git Worktree độc lập.

**Agent chạy nền giải quyết bài toán chờ đợi.**

Ví dụ bạn bảo một Agent chạy review toàn bộ code, một Agent khác đi phân tích log, còn phiên chính tiếp tục làm thiết kế và bóc tách tác vụ. Đợi khi Agent chạy nền hoàn thành, kết quả sẽ được đưa ngược trở lại.

Tuy nhiên nếu mở quá nhiều tác vụ nền, chi phí quản lý sẽ tăng vọt ngay. Trong phiên hiện tại, `/subtask` và các Subagent chạy nền khác dùng `/tasks` để xem, tiếp quản hoặc dừng lại; còn Session nền độc lập do `/fork` tạo ra thì dùng `claude agents` để mở Agent View quản lý tập trung. Cả hai đều chạy dưới nền, nhưng không nằm ở cùng một tầng tác vụ.

![Giao diện Claude Code Agent View](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-agents-list-view-20260518102539932-7c769093.png)

Nhưng chạy nền không đồng nghĩa với miễn phí. Agent chạy nền vẫn tiêu thụ token, chiếm dụng context và trạng thái tác vụ. Mở quá nhiều, tuy phiên chính không bị nghẽn, nhưng con người lại phải bắt đầu đau đầu quản lý một mớ tác vụ rối rắm.

Claude Code cũng đặt ra giới hạn mặc định: Claude thông qua công cụ `Agent` trong mỗi Session tối đa chỉ tạo được 200 Subagent, mặc định chạy đồng thời tối đa 20 cái. Giới hạn trước có thể điều chỉnh qua `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`, giới hạn sau qua `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`; Session Ultracode không áp dụng giới hạn đồng thời mặc định này.

Hai mức trần này chủ yếu ngăn công cụ `Agent` tự ý sinh ra Subagent vô tội vạ. Lệnh `/subtask` do người dùng gõ thủ công vẫn tính vào hạn ngạch và chiếm slot đồng thời, nhưng sau khi đạt mức trần vẫn có thể khởi chạy; `/fork` tạo Session độc lập nên không tính vào hạn ngạch 200 của phiên hiện tại và có ngân sách riêng.

Subagent mặc định không thể tạo thêm Subagent con lồng nhau; khi cần ủy thác lồng nhau, bạn có thể thiết lập cấp độ qua `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`. Trong Agent Teams, in-process teammate không thể tiếp tục sinh ra teammate, và Subagent của chính nó chỉ có thể chạy ở tiền cảnh (foreground). Những hạn chế này là biện pháp bảo vệ chứ không phải mục tiêu hướng tới, các tác vụ thường ngày hiếm khi đụng tới ngưỡng này.

Cái giá chung của `/subtask` và `/fork` là: chúng đều sao chép lịch sử của phiên cha.

Phiên cha càng sạch sẽ thì việc sao chép context càng có giá trị. Khi vừa đọc xong một module, sắp xếp xong kế hoạch tác vụ, làm rõ các tệp then chốt và ràng buộc, việc mở `/subtask` hoặc `/fork` sẽ tiết kiệm được chi phí đọc lặp lại rất lớn.

Ngược lại, nếu phiên chính đã trò chuyện rất lâu, bên trong chứa đầy các tệp không liên quan, phỏng đoán cũ, phương án hỏng và nhận định tạm bợ, tiếp tục fork đồng nghĩa với việc sao chép mớ bòng bong đó cho từng child.

Trong tình huống đó, sao chép phiên không phải là chia sẻ công việc, mà là nhân bản sự hỗn loạn.

## Agent Teams: Một cụm các instance Claude Code độc lập

### Sự khác biệt giữa Agent Teams và Subagent

Agent Teams là cơ chế đa Agent nặng ký hơn trong Claude Code, đừng coi nó đơn thuần là bản nâng cấp của Subagent.

Một session đóng vai trò là team lead (gọi tắt là lead), chịu trách nhiệm điều phối công việc, phân chia nhiệm vụ và tổng hợp kết quả; các teammates làm việc độc lập, mỗi teammate đều có context window riêng và có thể giao tiếp với nhau.

Điểm này rất dễ nhầm lẫn: teammate không hề kế thừa lịch sử trò chuyện của lead. Nó giống như một session Claude Code mở mới hoàn toàn, sẽ tải `CLAUDE.md`, MCP servers và Skills của dự án hiện tại, đồng thời nhận spawn prompt do lead gửi sang, nhưng các thảo luận qua lại, suy đoán tạm thời và phương án bị bác bỏ trước đó sẽ không tự động chuyển sang.

Do đó, spawn prompt không thể chỉ viết vỏn vẹn "cậu đi xem backend đi". Các đường dẫn then chốt, giới hạn đã biết, mong muốn đầu ra là gì đều phải viết vào đó. Nếu không, teammate nhận được một cửa sổ sạch sẽ, nhưng sạch đến mức không hề biết bạn vừa thảo luận những gì.

Subagent thường theo kiểu "làm xong báo cáo lại". Còn teammate sẽ cộng tác qua shared task list và mailbox: có người nhận việc, có người bổ sung thông tin, lead tổng hợp sau cùng.

Teammate cũng có thể tái sử dụng định nghĩa Subagent có sẵn. Ví dụ bạn đã viết một `security-reviewer`, khi spawn teammate có thể chỉ định agent type này. Nó sẽ kế thừa `tools` và `model` trong định nghĩa đó, đồng thời nối thêm phần thân định nghĩa vào system prompt của teammate. Lưu ý, hai trường frontmatter `skills` và `mcpServers` sẽ không có hiệu lực qua con đường này; teammate vẫn tải Skills / MCP servers theo thiết lập người dùng và dự án của session thông thường.

Trước khi dùng còn phải bật cờ thử nghiệm. Hiện tại Agent Teams vẫn đang ở giai đoạn experimental, mặc định tắt, cần cấu hình:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Hoặc đặt biến môi trường cùng tên trong shell.

### Shared task list, mailbox và chế độ teammate mode

Agent Teams không phải là để vài teammate vào một khung chat khổng lồ rồi spam tin nhắn. Nó phối hợp chủ yếu dựa vào hai bộ cơ chế:

| Thành phần | Tác dụng |
| ---------- | -------- |
| shared task list | Ghi nhận tác vụ nhóm, teammate có thể nhận (claim) và hoàn thành tác vụ |
| mailbox | Giữa các teammate gửi tin nhắn, yêu cầu thông tin, đồng bộ trạng thái |

Thứ được bổ sung ở đây vượt xa việc chỉ báo cáo kết quả đơn thuần. Agent Teams duy trì shared task list và mailbox để các teammate có thể chủ động nhận việc, đồng bộ tiến độ và bổ sung thông tin cho nhau.

Xem shared task list như một danh sách TODO thông thường là đánh giá quá thấp cơ chế này. Tác vụ có 3 trạng thái: `pending`, `in progress`, `completed`, và có thể thiết lập phụ thuộc lẫn nhau; khi phụ thuộc chưa xong thì tác vụ phía sau không thể được nhận. Khi nhiều teammate cùng tranh nhau một tác vụ, Claude Code sẽ dùng khóa tệp (file lock) để tránh xung đột nhận việc đồng thời.

Phần tin nhắn cũng tương tự. Lead sẽ gán tên cho từng teammate, sau đó có thể gửi tin nhắn theo tên. Khi teammate rảnh rỗi hoặc thất bại, nó sẽ tự động thông báo cho lead, lead không cần phải liên tục thăm dò (polling).

Phân tích mã nguồn cho thấy tầng triển khai sâu hơn: mailbox là inbox dạng tệp, khi ghi sẽ xét đến khóa đồng thời; task list giúp teammate không chỉ tiếp nhận prompt mà còn có thể claim đầu việc.

Subagent thông thường giống như một lần ủy quyền đơn lẻ. Agent Teams duy trì tác vụ và tin nhắn dùng chung, mang dáng dấp của một hàng đợi công việc (work queue) thu nhỏ.

Cách viết prompt cũng thay đổi theo. Khi dùng Subagent, tác vụ tốt nhất nên nói rõ trong một lần; khi dùng Agent Teams, lead có thể bóc tách tác vụ lớn vào shared task list trước, sau đó các teammate bám theo danh sách tác vụ và tin nhắn để đẩy nhanh tiến độ.

![Claude Code Agent Teams: Nhiều teammate cộng tác review trên toàn chuỗi phân tích](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-agent-teams-agentinvest-review-46765823.png)

Hình trên là một ví dụ sát với dự án thực tế: team lead chia toàn bộ chuỗi phân tích của AgentInvest thành 4 nhánh—SSE backend, điều phối Agent, render frontend, rủi ro kiểm thử và tính bền bỉ—sau đó spawn 4 teammate để lần lượt nhận việc. Trọng tâm ở đây không phải là mở thêm vài tác vụ tìm kiếm, mà là các teammate cùng bám vào một shared task list để thúc đẩy công việc, cuối cùng lead sẽ tổng hợp các vấn đề xuyên module.

`--teammate-mode` dùng để điều khiển cách hiển thị teammates:

| Chế độ | Ý nghĩa |
| ------ | ------- |
| `in-process` | Chế độ mặc định, hiển thị các teammates trong cùng tiến trình hiện tại |
| `auto` | Dùng chia màn hình khi tmux / iTerm2 khả dụng, nếu không lùi về in-process |
| `tmux` | Sử dụng chia màn hình tmux hoặc iTerm2 |
| `iterm2` | Sử dụng chia màn hình native của iTerm2, bổ sung từ bản v2.1.186 |

Giá trị mặc định của `teammateMode` từ bản v2.1.179 đã đổi từ `auto` sang `in-process`.

Những thay đổi phiên bản này cần đặc biệt lưu ý khi viết script và tài liệu nhóm. Nhiều bài hướng dẫn trên mạng vẫn mặc định khuyên dùng tmux hoặc dùng quy trình tạo team kiểu cũ, làm theo rất dễ bị lệch pha với phiên bản hiện tại.

### Những thay đổi phiên bản sau v2.1.178

Trong mã nguồn cũ có thể thấy các chi tiết như `TeamCreate` / `TeamDelete`, `team file`, `team_name`. Những nội dung này hữu ích để hiểu quá trình tiến hóa của Agent Teams, nhưng không thể viết thẳng thành cách dùng ổn định hiện tại.

Sau bản v2.1.178, khi bật `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, teammate đầu tiên được sinh ra sẽ tự động tạo thành Agent Team của Session hiện tại, không cần bước tạo riêng biệt nữa. Một Session cùng một thời điểm chỉ có một Team duy nhất, không thể tạo thêm Team có tên khác.

Các công cụ `TeamCreate` và `TeamDelete` đã bị gỡ bỏ, cấu hình Team lúc chạy sẽ tự động được dọn dẹp khi Session kết thúc.

Tham số `team_name` trong công cụ `Agent` vẫn được chấp nhận nhưng bị bỏ qua. Các trường `team_name` trong payload của hook `TaskCreated`, `TaskCompleted`, `TeammateIdle` cũng thuộc về trường tương thích ngược.

Trong thời gian hoạt động, Agent Team sử dụng hai loại thư mục cục bộ: Team runtime config tại `~/.claude/teams/{team-name}/config.json`, Task list tại `~/.claude/tasks/{team-name}/`.

Hai thư mục này do Claude Code tự động sinh và cập nhật. Config chứa thông tin trạng thái khi chạy như Session ID, Pane ID, Members, khi Session kết thúc sẽ bị xóa; Task list được giữ lại cục bộ để khi khôi phục Session vẫn dùng tiếp được, chu kỳ dọn dẹp do `cleanupPeriodDays` kiểm soát. Đừng chỉnh sửa thủ công các tệp này, và cũng đừng viết `.claude/teams/teams.json` trong dự án với kỳ vọng nó sẽ có tác dụng.

Vì vậy khi đọc mã nguồn cũ, mình sẽ nhìn nhận tách bạch:

- Bản triển khai cũ giúp hiểu vì sao Agent Teams lại có task list, mailbox và thư mục team;
- Cách dùng hiện tại bắt buộc phải lấy tài liệu chính thức làm chuẩn, đừng hướng dẫn người dùng gọi `TeamCreate` nữa.

## Quyền hạn, chi phí và biến đổi phiên bản

**Yêu cầu quyền hạn quay trở lại lead trước**

Nỗi sợ lớn nhất của việc dùng đa Agent là worker vượt mặt phiên chính, tự tiện đi sửa tệp hay chạy lệnh.

Claude Code không để teammate tự ý quyết định. Các yêu cầu quyền hạn cần người dùng xác nhận vẫn sẽ quay trở về lead.

Phân tích mã nguồn chỉ ra cơ chế leader permission bridge: in-process teammate nếu cần người dùng xác nhận sẽ ưu tiên đẩy request vào `ToolUseConfirmQueue` của leader, trên giao diện UI có gắn nhãn định danh worker. Khi bridge không khả dụng, nó mới lùi về đường dẫn mailbox.

Người dùng vẫn đưa ra phán đoán quyền hạn ở một nơi duy nhất, không cần phải chạy sang nhiều cửa sổ teammate để canh chừng từng popup xác nhận.

Subagent cũng có thể tự cấu hình phạm vi công cụ và hooks của riêng mình.

Tài liệu Subagent chính thức từng đưa ra ví dụ chỉ cho phép truy vấn cơ sở dữ liệu dạng đọc: dùng hook `PreToolUse` để kiểm tra lệnh Bash, nếu phát hiện thao tác ghi như `INSERT`, `UPDATE`, `DELETE` thì thoát và chặn thực thi.

Thiết kế này đi cùng hướng với việc phân tầng an toàn khi gọi công cụ: thao tác rủi ro thấp có thể nới lỏng, thao tác rủi ro cao phải xác nhận; khi dính dáng đến xóa tệp, commit, deploy, ghi database thì không thể chỉ dựa vào một câu prompt nhắc nhở.

![Phân tầng rủi ro an toàn khi gọi công cụ: Khớp chiến lược kiểm soát theo cấp độ rủi ro](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/structured-output-function-calling-tool-call-sec-036eb7f8.png)

**Chi phí chủ yếu tiêu tốn vào nhiều context độc lập**

Agent Teams đắt đỏ chủ yếu vì mỗi teammate đều là một instance Claude Code độc lập.

Mình đúc kết việc kiểm soát chi phí thành vài thói quen sử dụng:

- Mô hình của teammate phải chỉ định rõ ràng, hoặc thiết lập `Default teammate model` trong `/config`; nó không nhất thiết tự động đi theo `/model` của lead;
- Phần lớn quy trình nên bắt đầu từ 3-5 teammate, ba teammate tập trung thường hiệu quả hơn hẳn năm teammate phân tán;
- Task không nên chia quá vụn vặt, cũng đừng quá lớn đến mức lâu không có check-in; tốt nhất là một hàm, một tệp test, một lượt review—các đầu việc tự khép kín;
- Người mới nên bắt đầu thử từ các tác vụ không sửa code như nghiên cứu, review, truy vết bug;
- Nếu cần sửa code song song, hãy cố gắng để mỗi teammate phụ trách các tệp khác nhau, tránh hai teammate cùng sửa vào một tệp.

Suy cho cùng, đây vẫn là câu chuyện quản lý context.

Mở 3 teammate tương đương với việc duy trì đồng thời nhiều cửa sổ context, chứ không phải chia một cửa sổ làm ba. Khi tác vụ thực sự có thể chạy song song, chi phí này rất xứng đáng; còn khi tác vụ phụ thuộc chặt chẽ, phải chờ đợi kết quả của nhau, thì chưa chắc đã kinh tế, rất dễ biến thành tự tạo thêm gánh nặng cho chính mình.

**Thông tin phiên bản chỉ nên xem như ảnh chụp nhanh (snapshot)**

Bài viết này được đối chiếu theo Claude Code v2.1.218 (2026-07-24). Thông tin phiên bản sẽ thay đổi, tính năng cụ thể vẫn cần lấy tài liệu chính thức và changelog làm chuẩn. Đặc biệt là các tính năng lặp nhanh như Agent Teams, Subagent, Skills thì các lệnh và tên công cụ trong bài viết cũ chưa chắc còn tiếp tục có hiệu lực.

## Hướng dẫn lựa chọn trong thực tế

**Tác vụ nhỏ dùng Agent đơn**

Tác vụ rõ ràng, phạm vi sửa đổi nhỏ, context không phức tạp thì cứ dùng một Agent duy nhất, đừng nghĩ quá phức tạp.

Ví dụ:

- Sửa một hàm;
- Viết bổ sung một unit test;
- Tinh chỉnh một cấu hình;
- Giải thích một đoạn code.

Những tác vụ này mà vừa vào đã mở Subagent hay Agent Teams thì chỉ làm tăng chi phí điều phối. Sửa đổi nhỏ cứ để một phiên hoàn thành là ổn định nhất.

**Tác vụ nhánh phụ dùng Subagent**

Mình xem Subagent như người "chạy một chuyến ra ngoài".

Ví dụ bảo nó review chỉ đọc một module, tìm kiếm một loạt log lỗi, làm rõ context của một module, hoặc giúp kiểm chứng độc lập cho đoạn code vừa sửa.

Những việc này có một điểm chung: quá trình không nhất thiết phải quan trọng, kết luận mới quan trọng. Phiên chính chỉ cần biết lỗi ở đâu, bằng chứng ở đâu, bước tiếp theo sửa thế nào, không cần nhét tất cả kết quả tìm kiếm, suy đoán tạm thời và đường đi thất bại vào.

Nếu thực sự muốn động vào mã nguồn cốt lõi, mình vẫn muốn giữ lại trong phiên chính để làm. Subagent chịu trách nhiệm tìm manh mối và kiểm chứng kết quả, phiên chính chịu trách nhiệm phán đoán và hạ cánh mã nguồn.

**Cần cộng tác thực sự mới nâng lên Agent Teams**

Với Agent Teams, mình luôn thận trọng hơn. Nó phù hợp cho những tác vụ mà chỉ dựa vào việc "tra cứu xong báo cáo lại" là chưa đủ.

Ví dụ một tính năng mới ảnh hưởng đồng thời đến API backend, tương tác frontend, chiến lược kiểm thử và review chéo. Các teammate không chỉ mạnh ai nấy xem, mà còn phải phối hợp: "Trường API này đổi rồi, frontend có cần đổi theo không? Kiểm thử có cần bổ sung không? Ai hiện đang rảnh tay có thể nhận phần tiếp theo?".

Chỉ khi đó shared task list và cơ chế tin nhắn mới phát huy giá trị. Nếu không thì việc mở nhiều worker, mỗi bên chạy xong một đoạn rồi tóm tắt báo cáo về thì Subagent đã là quá đủ.

Những trường hợp này tuyệt đối đừng cố chia tách: sửa đổi liên tục trong cùng một tệp, các tác vụ có thứ tự phụ thuộc nghiêm ngặt, tác vụ đòi hỏi một người phải liên tục nắm trọn vẹn toàn bộ context. Cố tình tách ra chỉ làm tăng thêm chi phí điều phối.

Nếu nhiều Agent đều phải sửa code, tốt nhất trước tiên hãy cô lập workspace của chúng. Cách làm tương đối vững chắc là mỗi Agent một Git Worktree, một nhánh chỉ gánh vác một nhiệm vụ rõ ràng, cuối cùng do con người hoặc lead tiến hành merge và nghiệm thu.

![Claude Code Git Worktree](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-git-worktree-685b1929.png)

**Bóc tách rõ nhiệm vụ trước, thêm Agent sau**

Khi ranh giới tác vụ chưa rõ ràng, mở nhiều Agent chỉ sinh ra thêm nhiều kết quả trung gian lệch hướng. Hãy dùng Agent đơn để làm rõ mục tiêu và phụ thuộc trước; phần nào có thể kiểm chứng độc lập thì giao cho Subagent; khi context hiện tại đáng tái sử dụng thì chọn giữa `/subtask` hoặc `/fork`; và chỉ khi thực sự cần giao tiếp giữa các vai trò thì mới kích hoạt Agent Teams.

Cụ thể hơn, bạn có thể chạy theo đường ống tuần tự trước: Plan chỉ đọc phương án, Code làm từng tác vụ đơn lẻ, Test chạy kiểm chứng, Review chỉ nhìn diff. Đợi khi quy trình này đã ổn định, lúc đó tách các khâu có thể chạy độc lập cho các Agent khác nhau cũng chưa muộn.

![Đường ống cộng tác 3 Agent Multi-Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-multi-agent-pipeline-f6ec4d47.png)

## Tổng kết

Đến đây, quay lại câu hỏi ở đầu bài: Trong Claude Code nên chọn Subagent, Fork hay Agent Teams?

Đừng vội chăm chăm nhìn vào việc "đa Agent liệu có nhanh hơn không". Mình thích xem nó như một phương thức quản trị context: phiên chính chịu trách nhiệm phán đoán, lên kế hoạch và hạ cánh mã nguồn; còn tìm kiếm nhánh phụ, review, kiểm chứng—những việc dễ làm bẩn context—cứ bóc tách được là bóc tách ra ngoài.

Subagent phù hợp để cô lập quy trình trung gian. Để nó tự đọc tệp, tra log, làm review chỉ đọc, phiên chính chỉ nhận kết luận và bằng chứng.

`/subtask` phù hợp để tái sử dụng context đã sắp xếp gọn gàng trong phiên hiện tại, hoàn thành một nhánh phụ và gửi kết quả về; khi bật Agent View, `/fork` phù hợp để sao chép toàn bộ cuộc trò chuyện thành Session nền độc lập để quản lý riêng. Khi phiên chính vốn dĩ đã quá bừa bộn, cả hai lệnh đều chỉ nhân bản thêm sự hỗn loạn.

Agent Teams ở một tầng nặng hơn hẳn. Chỉ khi tác vụ thực sự cần nhiều teammate nhận việc, giao tiếp qua lại, chia sẻ task list thì mới đáng để triển khai. Nó tiêu tốn tiền bạc cho nhiều cửa sổ context độc lập và cũng phát sinh chi phí điều phối.

Trình tự sử dụng khuyến nghị của mình là: tác vụ nhỏ dùng Agent đơn; nhánh phụ gọn gàng dùng Subagent thông thường; khi cần tái sử dụng context thì cân nhắc giữa `/subtask` và `/fork`; và khi thực sự cộng tác xuyên module mới mở Agent Teams. Giá trị cốt lõi của nó là cô lập quy trình và làm rõ trách nhiệm, còn việc chạy song song chỉ là kết quả tự nhiên sau khi tác vụ đã được bóc tách độc lập.

Bạn đọc có thể tham khảo thêm [Hướng dẫn thực chiến Kỹ thuật Context](https://javaguide.cn/ai/agent/context-engineering.html) và [Spec Coding: Lập trình điều hướng bởi quy cách](https://javaguide.cn/ai-coding/practices/spec-coding.html) trong [AIGuide: Phát triển ứng dụng AI, thực chiến AI Coding và hướng dẫn phỏng vấn](https://mp.weixin.qq.com/s/le3RzJsaAH22auUoB05y1Q). Bài trước thiên về cô lập context, bài sau thiên về đường ống cộng tác đa Agent.

## Tài liệu tham khảo

- [Claude Code Commands](https://code.claude.com/docs/en/commands)
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Run agents in parallel](https://code.claude.com/docs/en/agents)
- [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams)
- [Claude Code Changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Claude Code Source Code Deep Research Report (Phân tích mã nguồn cộng đồng, phi chính thức)](https://claudeai.dev/docs/mechanics/development/claude-code-source-deep-research/)
