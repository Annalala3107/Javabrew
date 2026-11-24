---
title: "Claude Code Context Management Toàn Tập: Window Budget, Nén và Quản trị Long-Running Task"
description: "Xuất phát từ Context Window của Claude Code, phân tích rõ chi phí cố định và động, Context Rot, dọn dẹp kết quả công cụ, AutoCompact, Context Reset, cô lập Sub-agent và handoff, giúp bạn quản lý luồng thông tin và trạng thái tác vụ trong các long-running task."
category: Nguyên lý AI Coding
tag:
  - Claude Code
  - Context Engineering
  - Context Management
  - AI Coding
head:
  - - meta
    - name: keywords
      content: Claude Code,Context Management,Context Engineering,Context Window,Context Rot,AutoCompact,/compact,Sub-agent,Context Reset,Long-Running Tasks,AI Coding
lang: vi
sourceRef: zh-ref/ai-coding/principles/claude-code-context-management.md
---

Chào mọi người, mình là Tiểu G. Gần đây trong nhóm có khá nhiều bạn chia sẻ kinh nghiệm phỏng vấn vị trí Agent. Mình xem qua thì thấy các câu hỏi liên quan đến Context Management xuất hiện với tần suất khá dày đặc.

![Ghi chép câu hỏi phỏng vấn về Claude Code, Skills và Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/claude-code-context-management-interview-questio-5db54df1.png)

Trong bài viết trước, mình đã chia sẻ bài: [Context Engineering là gì? Khác biệt gì so với Prompt Engineering?](https://javaguide.cn/ai/agent/context-engineering.html), giới thiệu những nội dung cốt lõi của việc quản lý context.

Do đó, bài viết này muốn kết hợp với Coding Agent hàng đầu hiện nay là Claude Code để đào sâu hơn vào tư duy ở tầng bên dưới.

Vấn đề không chỉ đơn thuần là nén lịch sử chat như thế nào, mà còn liên quan mật thiết tới việc: mục tiêu tác vụ, output của công cụ, bản ghi file và thông tin bàn giao (handoff) nên được đặt ở đâu cho hợp lý.

Khi Claude Code thực thi lệnh `/compact`, nó sẽ dùng một bản tóm tắt có cấu trúc (structured summary) để thay thế lịch sử hội thoại trước đó, đồng thời tải lại một phần chỉ dẫn bền vững (persistent instructions).

Bản tóm tắt thường giữ lại mục tiêu tác vụ, các ràng buộc quan trọng, quyết định then chốt, tiến độ hiện tại và các manh mối code liên quan; nhưng không đảm bảo giữ nguyên toàn bộ nội dung file, kết quả tìm kiếm hay log chạy test. Về sau, nếu cần nội dung chính xác của những tài liệu này, Agent cần phải đọc lại hoặc thực thi lại.

Điều mà các long-running task thực sự cần giải quyết là đặt thông tin vào đúng vị trí: context window chỉ giữ lại tài liệu cần dùng ngay trước mắt; nội dung cần kiểm tra lại, tái sử dụng thì ghi vào file; khi chuyển đổi session, chỉ bàn giao kết luận và manh mối cần thiết cho bước tiếp theo. Việc dọn dẹp output của công cụ, nén lịch sử, lưu file bền vững, dùng sub-agent và bàn giao session đều phục vụ cho mục tiêu này.

Bài viết này dựa trên hai nguồn tài liệu. Những hành vi có thể xác thực từ tài liệu chính thức sẽ được mô tả theo đúng documentation; các chi tiết được nhắc đến như "quan sát qua reverse engineering" hay "thấy trong mã nguồn" chủ yếu đến từ tài liệu mã nguồn không công khai quanh phiên bản Claude Code 2.1.x cùng tổng hợp từ cộng đồng, không thuộc giao diện ổn định chính thức.

## Toàn cảnh Kiến trúc Claude Code

![Toàn cảnh Kiến trúc Claude Code](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/ctx-mgmt-arch-arch-90e1b9c7.png)

Khi window chịu áp lực, hệ thống có thể dọn dẹp trực tiếp kết quả công cụ, nén lịch sử, reset context, hoặc cô lập các nhánh phụ sang sub-agent. Việc tải Skills theo nhu cầu (on-demand), ghi trạng thái tác vụ ra filesystem, và thực thi các background task độc lập cũng làm thay đổi ngân sách context khả dụng.

Một instance Claude Code đang chạy cần truy cập trực tiếp System Prompt, định nghĩa công cụ, quy tắc dự án, lịch sử hội thoại, kết quả công cụ và các file vừa đọc gần đây. Context Window chính là bộ nhớ làm việc (working memory) chứa đựng những tài liệu này.

Khi bị trộn lẫn với log hết hạn, kết quả tìm kiếm trùng lặp hoặc các nhận định cũ mâu thuẫn nhau, Agent sẽ rất dễ bỏ sót ràng buộc, thăm dò lặp đi lặp lại hoặc vội vã kết thúc tác vụ quá sớm.

Trong công thức `Agent = Model + Harness`, model cung cấp năng lực suy luận (reasoning), còn Harness chịu trách nhiệm thu thập thông tin, gọi công cụ và thúc đẩy tác vụ tiến triển. Quản lý context thuộc về Harness: nó quyết định window hiện tại giữ lại trạng thái nào, dọn sạch kết quả tạm nào, và nội dung nào cần ghi ra bên ngoài window.

![Agent = Model + Harness](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-agent-equals-model-harness-arch-fe29369b.png)

Khi phỏng vấn gặp các câu hỏi loại này, người phỏng vấn thường muốn kiểm tra xem bạn có nhìn nhận Agent như một hệ thống có trạng thái (stateful system) hay không. Nó có nhiều điểm tương đồng với hệ thống backend truyền thống (các phép so sánh dưới đây giúp dễ hình dung, không đồng nghĩa về mặt cơ chế):

| Khái niệm Agent | So sánh Backend | Điểm tương đồng |
| --- | --- | --- |
| Context Window | JVM Heap Memory | Dung lượng hữu hạn, đầy sẽ giảm chất lượng xử lý |
| Compaction | Garbage Collection (GC) | Thu hồi nội dung cũ, giữ lại trạng thái còn sống |
| Context Reset | Khởi động lại tiến trình + Khôi phục từ checkpoint | Bỏ lịch sử bẩn, tiếp tục từ trạng thái bàn giao sạch |
| Sub-agent Isolation | Tách Microservices | Context độc lập xử lý tác vụ cục bộ |
| Context Rot | Ô nhiễm Cache / Rò rỉ bộ nhớ (Memory Leak) | Thông tin cũ tích tụ ngày càng nhiều, làm chậm suy luận |
| Dọn dẹp kết quả công cụ | Thu hồi cache LRU (LRU Eviction) | Giữ nội dung gần đây, xóa nội dung đã cũ |

Sự khác biệt giữa Prompt Engineering và Context Engineering cũng nằm ở đây. Prompt Engineering quan tâm đến cách viết một lần input sao cho chuẩn, còn Context Engineering quan tâm đến cách thông tin luân chuyển xuyên suốt cả phiên làm việc.

Dù bạn có viết System Prompt chi tiết đến đâu thì cũng không thể giải quyết được bài toán quản lý context. Trái lại, làm vậy còn phản tác dụng vì tăng chi phí cố định, khiến window rơi vào vùng chịu tải cao/nguy hiểm sớm hơn.

![Sự khác biệt giữa Context Engineering và Prompt Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-context-engineering-dimen-10eadd1a.png)

## Ngân sách Window và Tải thông tin

### Những chi phí nào tồn tại trong Window

Trong các cuộc hội thoại thông thường, người dùng mỗi lượt gửi một đoạn văn bản, thỉnh thoảng dán một đoạn code. Claude Code thì khác hẳn. Ngay từ khi khởi động, nó đã mang theo các công cụ và quy tắc; khi thực thi tác vụ, nó còn tự đọc file, chạy test, tra cứu lịch sử Git, gọi MCP server.

Nội dung file, output của lệnh command và lịch sử hội thoại liên tục được nạp vào window. Việc chỉ thảo luận một câu hỏi đơn lẻ so với việc đọc hàng chục file rồi chạy toàn bộ test suite mang lại mức gia tăng context hoàn toàn khác biệt; trường hợp sau dễ khiến Claude bỏ sót các ràng buộc ban đầu, tìm kiếm lặp lại, hoặc tiếp tục loay hoay ở những hướng đi vốn đã bị loại trừ.

Model mạnh hơn chỉ giúp trì hoãn hiện tượng suy thoái này chứ không thay đổi được sự thật là lượng input liên tục phình to.

Dung lượng chiếm dụng trong window có thể chia thành hai phần: System Prompt, quy tắc và đăng ký công cụ có sẵn từ lúc khởi động; cùng với kết quả công cụ và lịch sử đối thoại liên tục được thêm vào trong quá trình làm việc. Phần trước quyết định khoảng trống khả dụng ban đầu; còn việc đọc file, chạy lệnh và thu thập log sẽ liên tục đẩy phần sau tăng vọt.

![Context Window = Bộ nhớ làm việc của LLM](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-context-window-e2089807.png)

Chi phí khởi động chủ yếu đến từ System Prompt, file `CLAUDE.md`, mô tả Skills và một số thông tin công cụ. Các implementation ghi nhận được sẽ cố gắng trì hoãn việc tải định nghĩa của một số MCP tool:

- Khi ToolSearch được bật và công cụ không bị cấu hình là "bắt buộc tải lúc khởi động", một số MCP tool ban đầu chỉ để lộ tên gọi;
- Đến khi model thực sự chọn công cụ đó, JSON Schema đầy đủ mới được kéo vào;
- Tuy nhiên cũng có những công cụ tải toàn bộ mô tả ngay từ khi khởi động.

File quy tắc viết càng dài, số lượng Skills và MCP Server càng nhiều thì không gian còn lại khi bắt đầu tác vụ càng ít.

Muốn xem dung lượng thực tế đang chiếm dụng của session hiện tại, bạn có thể dùng lệnh `/context`. Lệnh này sẽ liệt kê kích thước window của model hiện tại, số token đã dùng, không gian còn trống, cùng mức chiếm dụng theo từng danh mục như System Prompt, tools, Skills, messages.

![Kết quả chạy lệnh /context trong Claude Code](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-context-command-result-e75460f7.png)

Trong phần nội dung động, lời gọi công cụ thường chiếm tỷ trọng lớn nhất. Một file mã nguồn vài trăm dòng có thể tiêu tốn hàng nghìn token; kết quả tìm kiếm và log chạy test có thể còn dài hơn nữa. Tham số và kết quả gọi công cụ sẽ đi vào session hiện tại; nội dung file, output lệnh và kết quả tìm kiếm cứ tích lũy dần theo tiến độ công việc. Khi tiệm cận giới hạn window, Claude Code sẽ dọn dẹp các kết quả công cụ cũ trước, nếu vẫn chưa đủ chỗ mới tiến hành nén session.

Context dài ra cũng ảnh hưởng đến hiệu quả tận dụng thông tin. Input càng nhiều, độ trễ và chi phí thường càng tăng. Model cũng không thể tận dụng đồng đều mọi đoạn nội dung trong window; khi thông tin liên quan nằm ở giữa một context dài, hiệu năng truy xuất và trả lời của model có thể bị tụt giảm—hiện tượng nhạy cảm theo vị trí này thường được gọi là **Lost in the Middle**. Window lớn hơn chứa được nhiều thông tin hơn, nhưng không đảm bảo rằng mọi thông tin đó đều được sử dụng một cách ổn định.

Đây chính là hiện tượng mục rữa context (**Context Rot**) mà chúng ta thường nhắc tới. **Context càng dài, thông tin càng nhiễu thì độ ổn định trong việc tận dụng context của model càng dễ suy giảm.**

![Context Rot - Sự mục rữa của ngữ cảnh](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-rot-diagram-455c3d66.png)

Mỗi lần Claude Code gọi LLM, trong window thường chứa các thành phần sau:

| Thành phần | Nội dung | Bản chất |
| --- | --- | --- |
| Context khởi tạo session | System Prompt, `CLAUDE.md`, `.claude/rules/` không điều kiện, Auto Memory | Chi phí cố định |
| Quy tắc theo đường dẫn (Path Rules) | `.claude/rules/` có khai báo `paths` | Nạp khi đọc file khớp đường dẫn |
| Mô tả MCP & Tools | Định nghĩa tool tích hợp, tên MCP tool và Schema đã nạp | Cố định hoặc theo nhu cầu |
| Nội dung Hook tiêm vào | `additionalContext`, gợi ý hoặc phản hồi tool do Hook trả về rõ ràng | Tiêm động |
| Skills | Mặc định chỉ nạp mô tả ngắn; nội dung chi tiết vào context sau khi gọi | Tải theo nhu cầu (on-demand) |
| Lịch sử hội thoại | Tin nhắn người dùng, phản hồi của Claude | Tăng liên tục |
| Lời gọi & kết quả công cụ | Tham số gọi, giá trị trả về, log, nội dung file | Tăng liên tục |
| Môi trường & trạng thái IDE | Workspace, code đang chọn do client/tích hợp cung cấp | Tiêm theo cấu hình |
| Báo cáo từ Sub-agent | Tóm tắt và lượng metadata nhỏ do sub-agent gửi về | Theo nhu cầu |

Chi phí cố định thường không tăng theo số lượt hội thoại, nhưng nó quyết định khi bắt đầu tác vụ ta còn bao nhiêu khoảng trống. Nội dung động mới là nguồn tăng trưởng chính trong các long-running task. Cùng là 20 lượt hội thoại, nhưng chỉ chat thuần túy so với mỗi lượt đều đọc file, chạy test thì dung lượng tiêu tốn cuối cùng chênh lệch rất lớn, do đó không thể chỉ nhìn vào số lượt (turn) để đánh giá áp lực context.

Prompt Caching giúp tiết kiệm chi phí và độ trễ, nhưng không giải phóng không gian context. Ngay cả khi System Prompt, định nghĩa công cụ và `CLAUDE.md` hit cache, chúng vẫn thuộc về nội dung input của request hiện tại.

Extended Thinking cũng cần được tính vào bài toán này. Thinking budget của lượt hiện tại thuộc về một phần của `max_tokens`, bị tính phí theo token output và tính vào giới hạn tốc độ (rate limit).

Điểm dễ bị bỏ qua hơn là các Thinking Block trong lịch sử. Theo tài liệu API hiện tại, Opus 4.5 trở về sau, Sonnet 4.6 trở về sau, Fable 5, Mythos 5 và Mythos Preview mặc định sẽ giữ lại các Thinking Block lịch sử.

Các model Opus / Sonnet đời trước và Haiku sẽ tự động bóc tách các block lịch sử này khỏi context. Vì vậy, trong session dài, việc Thinking có tiếp tục chiếm window hay không phụ thuộc vào model cụ thể và cấu hình.

Nếu sử dụng đồng thời với tool, quy tắc còn chặt chẽ hơn: khi trả về `tool_result`, bắt buộc phải mang nguyên vẹn Thinking Block tương ứng với lượt gọi tool đó về, bao gồm cả `signature`. Sau khi chu trình gọi tool kết thúc, việc có tiếp tục giữ lại hay không sẽ xử lý theo hành vi mặc định của model hoặc cấu hình context editing.

### Window Hiệu dụng và Ngưỡng Kích hoạt

Về mặt khái niệm, window hiệu dụng có thể ước lượng như sau:

```text
Context hiệu dụng ≈ Tổng dung lượng window - Chi phí cố định - Chi phí lịch sử
```

Mã nguồn phản ánh logic đại thể như sau:

```typescript
function getEffectiveContextWindowSize(
  modelWindowSize: number,
  maxOutputTokens: number,
): number {
  const reservedForSummary = Math.min(maxOutputTokens, 20000);
  return modelWindowSize - reservedForSummary;
}
```

Giá trị trả về ở đây được dùng cho các phán đoán cảnh báo, nén tự động và chặn request sau đó. Hàm `getEffectiveContextWindowSize()` chỉ chịu trách nhiệm trừ đi phần dự phòng cho output tóm tắt từ window của model. System Prompt, quy tắc, lịch sử tin nhắn và kết quả công cụ đã nằm trong lượng token thực tế sử dụng nên không bị trừ từng mục trong hàm này.

Các ngưỡng này cũng bắt nguồn từ tài liệu quan sát nêu trên, không phải API ổn định công khai, các phiên bản sau có thể điều chỉnh.

Một số hằng số quan trọng:

| Hằng số | Giá trị | Mục đích |
| --- | --- | --- |
| `AUTOCOMPACT_BUFFER_TOKENS` | 13,000 | Vùng đệm kích hoạt AutoCompact sớm so với window hiệu dụng, giúp quá trình nén bắt đầu khi vẫn còn dư địa |
| `WARNING_THRESHOLD_BUFFER_TOKENS` | 20,000 | Cảnh báo trước request, nhắc người dùng có thể `/compact` thủ công |
| `ERROR_THRESHOLD_BUFFER_TOKENS` | 20,000 | Đánh dấu context đã rơi vào vùng nguy hiểm |
| `MANUAL_COMPACT_BUFFER_TOKENS` | 3,000 | Khoảng đệm an toàn tối thiểu khi nén thủ công |

Ở đây có hai con số rất dễ bị nhầm lẫn.

`reservedForSummary = min(maxOutputTokens, 20000)` chịu trách nhiệm **dành sẵn không gian cho output tóm tắt**. Chú thích trong mã nguồn cho biết p99.99 của bản tóm tắt khoảng 17.3K token, nên mức trần 20K đủ sức bao quát các output cực đoan này.

`AUTOCOMPACT_BUFFER_TOKENS` (13K) để lại vùng đệm trước trần window hiệu dụng và kích hoạt AutoCompact khi vẫn còn khoảng trống. Không gian xuất bản tóm tắt do khoản dự phòng 20K đảm nhiệm.

13K chỉ là buffer của AutoCompact; còn chú thích p99.99 tương ứng với 20K dự phòng output tóm tắt. Ưu điểm của thiết kế này là tính dự đoán được: khi window model mở rộng từ 200K lên 500K, ngân sách output phía tóm tắt không bị phình to theo tỷ lệ thuận.

Các giai đoạn thực sự độc lập chủ yếu gồm: cảnh báo, AutoCompact và giới hạn chặn (blocking limit). `isAboveAutoCompactThreshold` kích hoạt AutoCompact; `isAtBlockingLimit` ngăn chặn request mới, buộc người dùng phải compact thủ công hoặc reset.

Trong reference implementation còn giữ hai trường trạng thái `isAboveWarningThreshold` và `isAboveErrorThreshold`. Ở các phiên bản quan sát được, cả hai dùng chung ngưỡng 20K nên điểm kích hoạt token là như nhau. Chúng có thể đảm nhận vai trò khác nhau trên các UI hoặc đường dẫn gọi khác nhau, nhưng không đại diện cho hai khoảng chiếm dụng độc lập.

Chuỗi đánh giá trước khi gửi request đại thể như sau (dưới đây là bản trích xuất từ mirror mã nguồn cộng đồng, không phải API cam kết ổn định của Anthropic). Chuỗi này mặc định tính theo trường hợp AutoCompact bật; nếu tắt AutoCompact, warning / error sẽ lùi về lấy window hiệu dụng làm chuẩn:

```typescript
reservedForSummary = min(maxOutputTokens, 20_000)
effectiveWindow = modelWindow - reservedForSummary

autoCompactThreshold = effectiveWindow - 13_000
warningThreshold = autoCompactThreshold - 20_000
errorThreshold = autoCompactThreshold - 20_000
blockingLimit = effectiveWindow - 3_000

if currentUsageEstimate >= warningThreshold:
  // Đưa ra cảnh báo context

if currentUsageEstimate >= autoCompactThreshold:
  // Kích hoạt AutoCompact

if currentUsageEstimate >= blockingLimit:
  // Chặn request mới, yêu cầu compact thủ công hoặc reset
```

Lấy ví dụ với window 200K và 20K dự phòng tóm tắt, window hiệu dụng là 180K. AutoCompact kích hoạt ở 167K; vạch cảnh báo / lỗi ở 147K; vạch chặn ở 177K; cả vạch cảnh báo lẫn vạch lỗi đều lấy vạch AutoCompact trừ tiếp đi 20K.

### Thông tin đi vào Context như thế nào

Khi định vị phía gọi của `TokenRefreshService`, đầu tiên dùng `Grep` tìm symbol, sau đó dựa vào các đường dẫn như `tests/test_utils.py` và `src/core_logic/test_utils.py` để phán đoán vai trò của file. Sau khi xác nhận liên quan mới dùng `Read` để mở đoạn code đó; các lệnh `ls`, `find`, `git log` và lệnh test chỉ chạy khi cần bổ sung bằng chứng.

Read, Glob, Grep, Bash và sub-agent lần lượt lấy tư liệu theo tiến trình tác vụ, ngay từ đầu không cần xây dựng chỉ mục vector (vector index) cho toàn bộ repository. Đường dẫn, symbol, quan hệ import và trạng thái file mới nhất được dùng để thu hẹp phạm vi; quan hệ gọi hàm vẫn căn cứ vào mã nguồn và kết quả kiểm chứng thực tế.

Hỏi đáp ngôn ngữ tự nhiên hoặc truy xuất khái niệm có thể tích hợp RAG (Retrieval-Augmented Generation) thông qua MCP, plugin hoặc Skill tự định nghĩa. Khi khám phá code, các đoạn trích do RAG trả về vẫn cần được xác minh chéo với tìm kiếm từ khóa, phân tích symbol và đọc trực tiếp.

Cách định vị tiệm tiến này bắt đầu từ thư mục và tên file, sau đó đi sâu vào các dòng then chốt; chỉ khi xác nhận cần thiết mới mở toàn bộ nội dung:

| Quyết định thiết kế | Cách làm cụ thể | Lợi ích |
| --- | --- | --- |
| Metadata chính là thông tin | Đường dẫn file, cấu trúc thư mục, timestamp, kích thước file vốn là tín hiệu giá trị | Đưa ra nhận định sơ bộ mà chưa cần đọc nội dung file |
| Nạp theo nhu cầu (On-demand) | Chỉ đọc file cụ thể khi cần, không nạp trước toàn bộ nội dung | Context luôn chỉ chứa thông tin thực sự cần thiết |
| Đào sâu từng bước (Progressive Disclosure) | Từ tổng thể đến chi tiết: thư mục → tên file → dòng then chốt → nội dung đầy đủ | Giảm hao hụt context do thăm dò không hiệu quả |
| Khám phá trực tiếp workspace | Dùng Glob, Grep, Read, Git và công cụ test để định vị từng bước | Không cần duy trì chỉ mục độc lập trước, kết quả luôn khớp với workspace hiện tại |

Các Skill mà chúng ta từng bàn luận nhiều cũng có trình tự tương tự: khi khởi động chỉ nạp metadata, khi model quyết định gọi mới lấy tài liệu chi tiết. Cơ chế chi tiết có thể xem bài viết của mình: [Agent Skills là gì? Khác biệt gì so với Prompt và MCP?](https://javaguide.cn/ai/agent/skills.html).

Tài liệu, cơ sở tri thức và lịch sử ghi chép rất phù hợp để RAG triệu hồi trước. Nhưng với kho code nơi đường dẫn, cấu hình, dependency và kết quả test biến động liên tục, hệ thống cần vừa tìm kiếm, vừa đọc, vừa kiểm chứng; nếu chọn sai từ khóa tìm kiếm sẽ tốn thêm vài lượt đối thoại, còn việc truy xuất xuyên repo, truy vấn khái niệm hoặc dự án monolith khổng lồ có thể phù hợp hơn với semantic index.

| Kịch bản | Phương thức phù hợp hơn |
| --- | --- |
| Tra cứu tri thức, tài liệu, lịch sử | RAG |
| Khám phá codebase, cấu hình, cấu trúc thư mục | Progressive Disclosure |
| Dự án lớn có cả tài liệu lẫn code phong phú | Kết hợp cả hai |

Các AI IDE như Cursor áp dụng Codebase Indexing, dùng chỉ mục để hỗ trợ code completion độ trễ thấp và hỏi đáp nhanh. Còn các tác vụ của Claude Code còn phải trải qua đọc, phán đoán và kiểm chứng, do đó tỷ trọng thăm dò nhiều lượt qua công cụ cao hơn rất nhiều.

## Vì sao Context bị suy thoái

Trong long-running task, khi window mở rộng, nó đồng thời chứa thêm nhiều ràng buộc, log và nhận định cũ, khiến tài liệu cần cho quyết định hiện tại khó được truy xuất ổn định hơn. Một số kinh nghiệm cộng đồng coi mức khoảng 40% dung lượng là vạch cảnh báo để dọn dẹp hoặc nén; tùy theo model, loại tác vụ và cấu trúc context mà điểm xuất hiện biến động sẽ khác nhau.

![Vạch quản lý tỷ lệ sử dụng context theo kinh nghiệm cộng đồng](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-utilization-40-percent-threshold-phenome-b46a6ca1.svg)

Ở lượt thứ 3 bạn ghi "không được sửa schema database", đến lượt 30, ràng buộc này có thể đã bị kẹp giữa đống kết quả tìm kiếm và log chạy test. Hiện tượng phần đầu và phần cuối dễ được chú ý hơn, còn nội dung ở giữa dễ bị bỏ sót thường được gọi là **Lost in the Middle**.

File `CLAUDE.md` ở thư mục gốc và các quy tắc không giới hạn đường dẫn sẽ được tái tiêm vào sau khi nén; input hiện tại của người dùng và kết quả công cụ gần nhất nằm ở cuối chuỗi tin nhắn; còn giá trị trả về cũ của công cụ và đối thoại lỗi thời sẽ được ưu tiên dọn dẹp. Cả ba yếu tố này cùng làm giảm xác suất các ràng buộc quan trọng bị chôn vùi bởi nội dung cũ. Quy tắc vẫn chỉ là chỉ dẫn cho model; các hạn chế an toàn tuyệt đối nên giao cho phân quyền, Sandbox hoặc `PreToolUse` Hook.

Khi window tiệm cận giới hạn trên, không gian còn lại phải dành cho output và phục hồi lỗi. Lịch sử tiếp tục tăng lên có thể khiến model vội vã khép lại tác vụ khi công việc chưa hoàn thành; Anthropic gọi hiện tượng này là **Context Anxiety** (Hội chứng âu lo context).

Mô tả đầy đủ trong bài viết [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) như sau:

![context-anxiety-harness-design-long-running-apps](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/context-anxiety-harness-design-long-running-apps-fa58ff7a.png)

Nhận định cũ, kết quả tìm kiếm trùng lặp, vấn đề đã giải quyết và log vô ích cũng làm tiêu hao sự chú ý, ngay cả khi window chưa chạm ngưỡng tới hạn. Chúng xuất hiện lặp đi lặp lại trong mỗi lượt request, trong khi quyết định mới đôi khi chỉ cần đúng một câu; trạng thái suy giảm tỷ lệ tín hiệu trên nhiễu (SNR) này gọi là **Context Rot**. Window lớn hơn chỉ trì hoãn áp lực, lượng thông tin quá nhiều vẫn khiến các ràng buộc ở khoảng giữa bị lãng quên, và cuối cùng vẫn có thể rơi vào Context Anxiety.

## Claude Code Quản trị Context như thế nào

Kết quả công cụ có thể lấy lại được thì không cần chiếm giữ window mãi. Claude Code sẽ xử lý tầng này trước, sau đó mới nén lịch sử; nếu vẫn không duy trì được mạch tác vụ thì mới reset context hoặc giao nhánh phụ cho sub-agent.

### Dọn dẹp kết quả công cụ trước

Một lần gọi `Read` có thể trả về 500 dòng code, một lần test cũng có thể xả ra hàng nghìn dòng log. Chúng rất tốn diện tích, nhưng nội dung gốc có thể đọc lại bất cứ lúc nào, do đó xử lý phần này trước sẽ ít mất mát thông tin nhất và không tốn thêm lượt gọi model.

Trong implementation quanh bản 2.1.x được tham chiếu ở bài này, kết quả công cụ lớn sẽ được ghi vào `tool-results` trong bộ lưu trữ session, thường nằm dưới thư mục dữ liệu session tương ứng với `~/.claude/projects/...`; trong window chỉ giữ lại phần preview và đường dẫn tham chiếu file.

Ngưỡng mặc định là khoảng 50,000 ký tự (characters, không phải 50KB). Các công cụ khác nhau có thể có ngưỡng thấp hơn, ví dụ Bash / PowerShell khoảng 30,000 ký tự, Grep khoảng 20,000 ký tự. Khi tổng kết quả công cụ trong cùng một tin nhắn vượt quá khoảng 200,000 ký tự, hệ thống cũng ưu tiên ghi các kết quả lớn nhất xuống đĩa.

Ở đây có một ngoại lệ: kết quả của công cụ `Read` được miễn trừ với `maxResultSizeChars = Infinity`. Những công cụ không có ngưỡng hữu hạn như thế này thường không bị Tool Result Budget coi là kết quả lớn để đẩy xuống đĩa. Nếu không sẽ nảy sinh vòng lặp: "Đọc file -> quá lớn ghi xuống đĩa -> tóm tắt nhìn thấy đường dẫn -> lại đọc file vào".

Kết quả công cụ còn có thể được xử lý bởi Tool Result Budget. Luồng này chịu ảnh hưởng của phiên bản và cờ thử nghiệm (feature flags), không phải môi trường nào cũng bật. Trạng thái của nó chia thành: `mustReapply`, `frozen` và `fresh`.

`mustReapply` chỉ kết quả công cụ trước đó đã được lưu bền vững hoặc thay thế, nay cần áp dụng lại nội dung thay thế; `frozen` là kết quả đã thấy, tạm thời không xử lý thêm; `fresh` là kết quả công cụ mới sinh ra, khi ngân sách của một tin nhắn đơn lẻ vượt ngưỡng có thể được chọn ra để ghi đĩa thay thế.

Reference implementation còn bao gồm Snip và MicroCompact. Sau khi Snip xóa một dải lịch sử (history range), nó sẽ nối lại chuỗi tin nhắn và chuyển số token vừa giải phóng cho phán đoán AutoCompact phía sau, tránh việc vừa giải phóng không gian xong lại lập tức bị nén quá mức.

MicroCompact sẽ thay thế nội dung kết quả công cụ cũ thành `[Old tool result content cleared]`. Lời gọi và quan hệ tham chiếu vẫn giữ nguyên trong chuỗi tin nhắn, nhưng phần nội dung trả về dài dòng đã bị loại bỏ.

**Tại sao không xóa hẳn toàn bộ tin nhắn?**

Các tin nhắn tiếp theo có thể vẫn tham chiếu tới `tool_use` ID phía trước. Nếu xóa hẳn bản ghi lời gọi, chuỗi tin nhắn sẽ bị đứt gãy, và model cũng không thể biết thao tác nào đã được hoàn thành. Cái giá phải trả là mất đi nội dung chi tiết; về sau nếu cần số dòng chính xác, Agent vẫn phải đọc lại file.

Trước khi phát request hoặc khi xuất hiện cảnh báo áp lực context, MicroCompact sẽ giữ lại một số kết quả công cụ gần nhất và thay thế các kết quả cũ hơn. Nếu môi trường, model hoặc đường dẫn sub-agent hiện tại không hỗ trợ, quy trình sẽ bỏ qua bước này để AutoCompact xử lý tiếp.

Một lối vào khác liên quan đến việc Prompt Cache hết hạn. Khi hai lần gọi API cách nhau quá lâu, cache phía server có thể đã mất hiệu lực, việc dọn bớt kết quả công cụ cũ trước khi gửi sẽ tránh việc truyền lại toàn bộ khiến tải trọng tiếp tục phình to. Luồng này mặc định tắt và được kiểm soát bởi GrowthBook gate.

Trong reference implementation còn xuất hiện luồng cache prefix / cache sharing: khi nén sẽ cố gắng tái sử dụng tiền tố cache, nếu thất bại thì fallback về nén thông thường. Đây là tối ưu hóa cache phụ thuộc phiên bản, không nên xem là năng lực ổn định.

Ranh giới dọn dẹp ở tầng này phụ thuộc vào việc thông tin có thể lấy lại được hay không. Output của Read, Grep, Glob hay truy vấn log đa phần có thể chạy lại khi cần; còn các công cụ có side-effect như Edit, Write thì không nên dựa vào việc phát lại output để phục hồi trạng thái, mà phải đối chiếu trực tiếp trên filesystem. Các sản phẩm dùng một lần như kết luận phân tích của sub-agent hay snapshot trạng thái tác vụ cũng không được tùy tiện dọn dẹp, vì mất là mất hẳn, chỉ có thể giữ lại qua tóm tắt hoặc đính kèm.

### Sau đó mới nén lịch sử

Dọn dẹp kết quả công cụ xong mà vẫn chưa đủ thì mới đến lượt nén lịch sử. AutoCompact không phải là phương tiện nén duy nhất. Trước khi chạm trần window, Claude Code trước hết thử dọn dẹp output công cụ cũ; chỉ khi không gian giải phóng ra vẫn không đủ, nó mới cần nén hội thoại thành bản tóm tắt.

Sau khi kết quả công cụ được dọn dẹp, lịch sử hội thoại vẫn tiếp tục tăng. Đến một mức độ nhất định, cần phải viết lại lịch sử cũ thành bản tóm tắt trạng thái. Trong implementation quan sát ở bài này, việc này đi qua một pipeline nhiều cấp độ. Điểm tài liệu chính thức xác nhận là: khi tiệm cận giới hạn sẽ dọn output công cụ cũ trước, nếu không đủ mới tóm tắt hội thoại.

![Pipeline nén tiệm tiến 5 cấp độ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/ctx-mgmt-pipeline-flow-98901029.png)

| Cấp độ | Tên | Hành động | Mất mát thông tin | Chi phí API |
| --- | --- | --- | --- | --- |
| 0 | Ghi kết quả lớn xuống đĩa | Output công cụ vượt ngưỡng được ghi vào session storage | Cực thấp | Không |
| 1 | Snip | Xóa một đoạn dải lịch sử và nối lại chuỗi tin nhắn | Cực thấp | Không |
| 2 | MicroCompact | Xóa nội dung kết quả công cụ cũ hoặc chỉnh sửa cache tầng API | Thấp đến vừa | Không |
| 3 | Collapse | Gập các nhóm tin nhắn đã hoàn thành thành snapshot trạng thái | Vừa | Thấp |
| 4 | AutoCompact | Điều phối Session Memory hoặc gọi LLM tóm tắt toàn phần | Tùy luồng | Cao |

Việc ghi kết quả lớn xuống đĩa, Snip và MicroCompact có thể xử lý được một phần session. Khi dung lượng window tiếp tục leo thang, luồng xử lý mới bước vào Collapse hoặc AutoCompact.

Collapse cũng thuộc phần implementation này, nhẹ hơn AutoCompact. Khi gọi API, nó tạo ra một view nén động: toàn bộ lịch sử đầy đủ vẫn lưu ở local, còn model nhận phiên bản đã được gập lại.

Tư duy này có thể hiểu là **tách rời View và Storage**. Theo các ngưỡng quan sát được, ở mức sử dụng khoảng 90%, Collapse bắt đầu xử lý các nhóm tin nhắn đã hoàn thành; ở mức khoảng 95%, hệ thống sẽ chặn việc spawn Sub-agent mới để tránh tiếp tục gia tăng áp lực lên context.

Vì Collapse ít mất mát thông tin hơn nên nó thường được kích hoạt trước AutoCompact. Nếu gập lại mà vẫn không đủ thì mới bước vào khâu tóm tắt toàn phần nặng hơn. Chi tiết phân tầng như Collapse không nên coi là giao diện ổn định công khai.

AutoCompact sẽ dùng một bản tóm tắt trạng thái mới thay thế cho lịch sử chat cũ. Mục tiêu, tiến độ, quyết định và việc cần làm (todo) sẽ được giữ lại; còn việc đã đọc những file nào, tìm từ khóa nào và toàn văn log test thường sẽ không được giữ; khi cần những chi tiết này, Agent phải đọc lại từ filesystem.

![So sánh trước và sau khi AutoCompact nén](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/ctx-mgmt-compare-25500bd6.png)

Lệnh `/compact` thủ công và nén tự động sử dụng cùng cơ chế bên dưới nhưng khác nhau về tham số đầu vào. Gọi thủ công có thể chỉ định rõ nội dung bắt buộc phải giữ trong bản tóm tắt; còn gọi tự động sẽ bật `suppressFollowUpQuestions` để ngăn bộ tóm tắt hỏi lại giữa chừng.

Khi kết thúc một giai đoạn, lệnh `/context` cho thấy dung lượng tăng cao rõ rệt, hoặc các lời gọi công cụ bắt đầu có dấu hiệu lặp lại, bạn có thể chủ động chạy `/compact` và chỉ định trọng tâm cần giữ:

```text
/compact Giữ lại schema database, state machine thanh toán và các test case đang thất bại
```

### Khôi phục sau nén và Cơ chế Dự phòng (Fallback)

Tầng thứ ba xử lý việc khôi phục sau nén và cơ chế dự phòng khi thất bại.

**Session Memory** là một lối đi nhanh trước Full Compact. Session Memory nhắc đến ở đây là trạng thái phụ trợ nén bên trong nội bộ session, không phải Auto Memory trong tài liệu chính thức của Claude Code. Nó làm mới các ghi chú session có cấu trúc dựa trên mức tăng token và nhịp độ gọi công cụ; khi kích hoạt AutoCompact, nếu bản ghi chú này cộng với các tin nhắn gần đây, file đính kèm và kết quả Hook đã đủ kéo context xuống dưới ngưỡng thì có thể bỏ qua Full Compact.

Hai cái tên này rất dễ nhầm, hãy phân biệt rõ:

| So sánh | Session Memory | Auto Memory |
| --- | --- | --- |
| Định vị | Ghi chú hỗ trợ nén trong session hiện tại | Ký ức kinh nghiệm dự án xuyên session |
| Nguồn gốc | Luồng nội bộ làm mới theo mức tăng token và nhịp gọi tool | Claude tự ghi dựa trên các hiệu chỉnh, sở thích và kinh nghiệm dự án |
| Tác dụng | Tái sử dụng cho AutoCompact, giảm xác suất phải Full Compact | Nạp khi khởi động session, cung cấp thói quen và kinh nghiệm dài hạn |
| Lưu trữ | Chi tiết nội bộ phụ thuộc phiên bản | `~/.claude/projects/<project>/memory/`, `MEMORY.md` là index |

Nó cũng có chi phí: việc cập nhật Session Memory đòi hỏi các cuộc gọi model ngầm. Điều nó làm giảm bớt là xác suất phải thực hiện một đợt tóm tắt quy mô lớn khi đã cận kề trần window, đồng thời chia nhỏ công việc nén rải đều trong suốt quá trình thực thi session.

Trong implementation quan sát được, Session Memory không bật ngay từ đầu session, mà chỉ khởi tạo sau khi đạt mốc khoảng 10,000 token lần đầu tiên.

Các lần cập nhật sau cũng có nhịp độ: thường phải tăng thêm khoảng 5,000 token và tích lũy một lượng lời gọi công cụ nhất định, hoặc rơi đúng vào điểm ngắt tự nhiên không có lời gọi công cụ nào thì mới làm mới ghi chú.

Template ghi chú được tổ chức theo các mục cố định như: Current State, Task specification, Files and Functions, Errors & Corrections... Mỗi mục có trần mềm (soft limit) khoảng 2,000 token, trần cứng (hard limit) toàn văn là 12,000 token; khi vượt trần cứng, hệ thống sẽ nhắc nhở model `MUST condense`.

Khi Session Memory compact được bật và đã có Session Memory hợp lệ, AutoCompact sẽ ưu tiên tái sử dụng nó: dùng ghi chú, tin nhắn gần đây, file đính kèm và kết quả Hook để lắp ráp chuỗi tin nhắn mới rồi ước tính số token có dưới ngưỡng không. Nếu giảm được xuống dưới ngưỡng thì bỏ qua Full Compact; nếu ghi chú rỗng, không tìm thấy ranh giới tin nhắn hoặc lắp ráp xong vẫn quá lớn thì lùi về tóm tắt toàn phần.

Bản thân **Full Compact** cũng có thể báo lỗi `prompt_too_long` do input quá dài. Khi lệnh `/compact` thủ công hoặc AutoCompact kích hoạt Full Compact mà bản thân request tóm tắt bị báo `prompt_too_long`, hệ thống sẽ bước vào luồng dự phòng **PTL (Prompt Too Long)**.

Mục đích của việc nhóm theo API round là đảm bảo `tool_use` và `tool_result` không bị xé lẻ. Nếu lỗi có kèm theo `tokenGap`, hệ thống có thể loại bỏ chính xác hơn theo lượng token vượt mức; nếu không có `tokenGap`, nó sẽ xử lý theo tỷ lệ thô hơn, ví dụ bỏ bớt khoảng 20% nhóm tin nhắn cũ nhất. Reactive Compact là một luồng phục hồi khác khi API báo lỗi `prompt_too_long`, nó cũng cắt ngắn tin nhắn rồi thử lại; hướng cắt và chiến lược cụ thể phụ thuộc vào phiên bản implementation.

Cơ chế **Partial Compact** trong bộ giải pháp này giải quyết cùng lúc hai bài toán: chỉ nén một đoạn lịch sử để giảm thiểu mất mát trạng thái, và cố gắng bảo lưu tiền tố cache ở một số hướng nhất định. Full Compact thường xây dựng lại chuỗi tin nhắn chính khiến tiền tố cache ban đầu gần như vô hiệu; Partial Compact chỉ nén một đoạn lịch sử, cố gắng giữ lại tin nhắn ở một đầu để tái sử dụng cache. Việc nén không thể chỉ nhìn vào tỷ lệ nén, mà phải cân bằng giữa cache, tính liên tục và mức độ suy hao thông tin.

Partial Compact có hai hướng:

1. `from`: Nén các tin nhắn phía sau điểm pivot, giữ lại phần sớm hơn. Phù hợp cho session dài đã có sẵn một đoạn tóm tắt ban đầu, đồng thời có lợi hơn cho việc tái sử dụng tiền tố cache;
2. `up_to`: Nén các tin nhắn phía trước điểm pivot, giữ lại phần gần nhất. Phù hợp khi Agent đang trực tiếp xử lý một file hoặc sửa một bug cụ thể, nơi trạng thái trung gian không được phép bị ngắt quãng bởi bản tóm tắt. Tuy nhiên vì bản tóm tắt chèn vào trước các tin nhắn giữ lại nên tiền tố cache ban đầu thường sẽ mất hiệu lực.

Full Compact sử dụng một Prompt tóm tắt có cấu trúc chứ không đơn thuần yêu cầu model "hãy tóm tắt lại".

Prompt tóm tắt của Full Compact sẽ hạn chế việc gọi công cụ ở cả đầu lẫn cuối: bước này chỉ được sinh ra văn bản, tuyệt đối không được thực thi `Read`, `Write` hay `Bash`, nếu không sẽ đưa thêm kết quả công cụ mới vào. Model trước tiên sắp xếp thông tin trong thẻ `<analysis>`, sau đó ghi những nội dung cần thiết cho các cuộc hội thoại tiếp theo vào thẻ `<summary>`; chỉ có phần summary này mới trở thành tài liệu bàn giao.

Thẻ `<summary>` được tổ chức theo các phần cố định gồm: Primary Request and Intent, Key Technical Concepts, Files and Code Sections, Errors and fixes, Problem Solving, All user messages, Pending Tasks, Current Work và Optional Next Step.

Mục `All user messages` ghi lại không chỉ là lịch sử: các yêu cầu bổ sung, định hướng và ràng buộc của người dùng sẽ làm thay đổi các phán đoán tiếp theo, nếu bỏ sót thì Agent có thể tiếp nhận sai tác vụ. Mục `Current Work` cũng phải ghi rõ tên file, tên hàm, test case thất bại và câu lệnh tiếp theo; một câu chung chung như "đang điều tra vấn đề của module" là không đủ để Agent sau khi nén có thể tiếp tục công việc ngay.

Reference implementation cũng chỉ ra rằng các phiên bản model khác nhau có mức độ tuân thủ Prompt nén khác nhau. Ví dụ dưới một số cấu hình nhất định, tỷ lệ model phiên bản mới cố gắng gọi công cụ cao hơn hẳn phiên bản cũ. Điều này có nghĩa là quy tắc nén phải được kiểm chứng lại theo từng phiên bản model, không thể mặc định một câu "không được gọi công cụ" sẽ luôn có tác dụng như nhau trên mọi model.

Sau khi nén hoàn tất, Claude Code sẽ ghi một bản ghi system với `subtype: "compact_boundary"` vào session events / JSONL cục bộ. Mẫu `compactMetadata` chủ yếu ghi `trigger`, `preTokens`..., một số luồng còn mang theo `preservedSegment`. Số token sau khi nén có thể xuất hiện trong kết quả nén hoặc telemetry, không thích hợp làm trường ổn định của boundary metadata. Dấu mốc ranh giới này báo cho bộ nạp phía sau biết: lịch sử tại đây đã được thay thế bằng bản tóm tắt, đừng ghép nối nó như một đoạn đối thoại thông thường.

Cấu trúc quan sát được trong bản ghi cục bộ tương tự như sau, các trường có thể thay đổi tùy phiên bản:

```json
{
  "type": "system",
  "subtype": "compact_boundary",
  "content": "Conversation compacted",
  "compactMetadata": {
    "trigger": "manual",
    "preTokens": 160442,
    "preservedSegment": {
      "headUuid": "...",
      "anchorUuid": "...",
      "tailUuid": "..."
    }
  }
}
```

Sau khi Full / Partial Compact kết thúc, chuỗi tin nhắn mới thường chứa dấu ranh giới, tin nhắn tóm tắt, file đính kèm và kết quả Hook. Phạm vi khôi phục của Session Memory compact hẹp hơn, chủ yếu xoay quanh summary, tin nhắn được giữ lại, plan và hook. Các file truy cập gần đây, plan đang hoạt động, Skill hiện tại, trạng thái background task sẽ chịu giới hạn về số lượng và ngân sách token; System Prompt không tham gia vào quá trình tóm tắt, sau khi nén sẽ được lắp ráp lại danh sách công cụ, phân quyền và danh sách MCP Server mới nhất.

Sau khi nén không nên tải lại toàn bộ các file đã đọc trước đó, nếu không rất dễ rơi vào vòng lặp luẩn quẩn "nén -> phình to -> lại nén". Chỉ cần khôi phục những file thực sự cần thiết cho tác vụ trước mắt là đủ.

Hệ thống sẽ ước tính lại tải trọng tin nhắn thực tế gồm dấu ranh giới, tóm tắt, đính kèm khôi phục và kết quả Hook; nếu nó vẫn tiệm cận ngưỡng thì lượt tiếp theo có thể lập tức bị nén lại. Một số trạng thái tạm thời và cache cũng được reset theo luồng thực thi, các mục dọn dẹp cụ thể tùy thuộc phiên bản.

Việc khôi phục đính kèm đòi hỏi sự đánh đổi dựa trên mức độ liên quan. Các file truy cập gần đây, Plan đang hoạt động, Skill đang dùng và trạng thái background task đều có thể giúp Agent nối tiếp tác vụ, nhưng chúng cũng chiếm dụng window. Mã nguồn thường lọc theo độ mới truy cập, số lượng file / ngân sách token, quy tắc loại trừ và ràng buộc khử trùng lặp; ví dụ khi xử lý state machine thanh toán, nên khôi phục file state machine, test lỗi và plan liên quan, chứ không phải log đọc lướt qua hay các module không liên quan trước đó.

File `CLAUDE.md` ở thư mục gốc dự án cùng các quy tắc không giới hạn path sẽ được nạp lại từ đĩa sau khi nén mà không cần ghi lặp lại vào bản tóm tắt. Các file `CLAUDE.md` trong thư mục con và quy tắc có `paths` thì sẽ đợi đến khi đọc lại file khớp mới được nạp lại.

Khi chọn một model rẻ hơn để thực hiện nén, cần đồng thời đánh giá độ trung thực của bản tóm tắt, chi phí thăm dò phát sinh và tỷ lệ hit cache. Giá model chỉ là một biến số, tiêu chuẩn đánh giá mấu chốt vẫn là sau khi nén Agent có thể tiếp nối chính xác tác vụ hay không.

### Reset, Cô lập và Circuit Breaker

Tầng thứ tư không còn cố chấp "cứu vãn window cũ" nữa. Compaction là việc chắp vá trên context cũ, chắp vá nhiều lần thì mất mát chi tiết sẽ cộng dồn. Đến một thời điểm nào đó, tiếp tục nén không bằng mở mới hoàn toàn. Cách làm của Context Reset là dọn sạch window, ghi trạng thái hiện tại thành tài liệu bàn giao (handoff document), và Agent mới sẽ khôi phục từ tài liệu bàn giao này.

![Quy trình bàn giao khi Context Reset](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/ctx-mgmt-reset-flow-bc479b3f.png)

Anthropic quan sát thấy trong một long-running Harness dựa trên Sonnet 4.5 rằng khi model tiệm cận giới hạn trên của context, nó có xu hướng kết thúc vội vã qua loa, tức là Context Anxiety. Trong tình huống này, chỉ dựa vào Compaction là không đủ.

Reset kết hợp với handoff có cấu trúc giúp vứt bỏ context cũ bẩn thỉu, chỉ dùng handoff giữ lại thông tin cốt lõi để Agent mới tiếp tục làm việc.

Nhưng đây không phải là bước cố định bắt buộc cho mọi long-running task. Về sau khi chuyển sang Opus 4.5, chính Harness đó đã có thể loại bỏ Reset và chỉ dựa vào nén tự động. Vì vậy, Reset giống một giải pháp kỹ thuật phụ thuộc vào model và tác vụ hơn là một quy trình phổ quát.

Rủi ro của Reset cũng rất rõ ràng: tài liệu bàn giao là cây cầu nối duy nhất. Nó không nhất thiết chỉ là một file Markdown, mà có thể bao gồm file tiến độ, bản ghi test thất bại, Git diff, danh sách công việc và log then chốt. Nếu bỏ sót điều kiện biên, quyết định tạm thời hay nguyên nhân thất bại, Agent mới sẽ tiếp tục chạy trong tình trạng thiếu hụt thông tin.

Để session mới có thể tiếp tục từ điểm ngắt trước đó, handoff tối thiểu phải lưu lại: mục tiêu và tiêu chuẩn hoàn thành, công việc đã làm xong, file và hàm hiện tại, các phương án đã loại trừ, test case thất bại hoặc log lỗi, cùng bước đi đầu tiên sau khi tiếp quản:

```text
1. Mục tiêu tác vụ hiện tại: Một câu nói rõ sản phẩm bàn giao cuối cùng là gì
2. Công việc đã hoàn thành: Liệt kê các phần đã sửa xong và đã kiểm chứng
3. Điểm ngắt hiện tại: Ghi rõ đến file, hàm, test case hoặc câu lệnh
4. Ràng buộc then chốt: Không được sửa cái gì, bắt buộc tương thích cái gì, người dùng đặc biệt nhấn mạnh điều gì
5. Bản ghi loại trừ: Đã thử những phương án nào, vì sao từ bỏ
6. Sự cố hiện tại: Log lỗi, stack trace, các bước tái hiện
7. Hành động khởi động: Session mới tiếp quản sẽ mở file nào hoặc chạy câu lệnh nào đầu tiên
```

Nếu chỉ có đúng một câu "Hãy tiếp tục hoàn thành các tác vụ còn lại", thì các file đã sửa, test thất bại và các phương án đã loại trừ đều sẽ biến mất trong session mới.

Khi phân tích hàng nghìn dòng log, định vị xuyên file hoặc review độc lập, session chính thường không cần phải thấy toàn bộ quá trình. Sub-agent hoàn thành các nhánh phụ này trong window độc lập rồi chỉ gửi về bản tóm tắt và bằng chứng cần thiết; toàn văn log cùng các thử sai trung gian nằm lại trong lịch sử riêng của sub-agent.

![Claude Code Sub-Agent: Giữ cho cuộc đối thoại chính luôn sạch sẽ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claudecode-sub-agent-ff5f7472.png)

Các tác vụ log mà session chính chỉ cần nguyên nhân gốc rễ và bằng chứng rất thích hợp để tách ra. Trái lại, khi tác vụ quá nhỏ chỉ vài bước là xong, các subtask liên tục chờ đợi lẫn nhau, hoặc ranh giới không rõ ràng, thì chi phí điều phối và tóm tắt sẽ lấn át lợi ích thu được.

Sub-agent khi khởi động cũng nhận được context khác nhau tùy chế độ:

| Chế độ | Hành vi Context | Kịch bản phù hợp |
| --- | --- | --- |
| Named / non-fork Subagent | Không kế thừa lịch sử tin nhắn của session cha; nhưng vẫn nạp công cụ / quyền hạn, `CLAUDE.md` / memory, Git status... | Cô lập nhiễu tìm kiếm, phân tích log, review độc lập |
| Fork | Kế thừa context của session cha thay vì khởi động từ window rỗng | Các tác vụ nhánh phụ phụ thuộc nặng vào bối cảnh, cần nối tiếp trạng thái cha |

Cả hai chế độ đều chỉ trả kết quả về session chính. Sub-agent có công cụ `Agent` có thể tiếp tục phân nhánh đệ quy tối đa 5 tầng, sau đó công cụ này sẽ không được cấp nữa; Fork sub-agent không thể tiếp tục sinh ra Fork mới.

Session chính sau khi nén sẽ không nạp lại toàn bộ transcript của sub-agent, mà chỉ khôi phục bản tóm tắt và một ít metadata.

### Circuit Breaker (Cầu dao ngắt mạch)

Circuit Breaker là cơ chế bảo vệ cứng cho việc nén tự động. Tài liệu chính thức nêu rõ: khi một file lớn hoặc output công cụ khiến window lập tức bị lấp đầy lại sau mỗi lần tóm tắt, Claude Code sẽ dừng nén tự động sau nhiều lần thử để tránh đốt API vô ích.

Reference implementation sử dụng bộ đếm số lần thất bại liên tiếp: reset về 0 sau khi AutoCompact thành công, và khi thất bại liên tiếp đạt `MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES` (3 lần), các request tiếp theo sẽ bỏ qua AutoCompact.

```text
Nén tự động
  -> Tóm tắt xong nhanh chóng bị đầy lại, hoặc nén thất bại
Bộ đếm thất bại liên tiếp tăng lên
  -> Đạt 3 lần sẽ bỏ qua AutoCompact
```

Nếu không có tầng bảo vệ này, session sẽ rơi vào vòng lặp "nén -> lập tức phình to -> lại nén". Nếu AutoCompact chưa kịp thực thi mà API đã trả về lỗi `prompt_too_long`, Reactive Compact sẽ khôi phục từ lỗi đó bằng cách cắt ngắn tin nhắn rồi thử lại.

### Tổng kết

Có thể sắp xếp thứ tự xử lý dựa trên việc thông tin có thể lấy lại được hay không:

| Nguồn gốc áp lực Context | Cách xử lý ưu tiên | Cái giá phải trả |
| --- | --- | --- |
| Output công cụ quá dài | Ghi đĩa, MicroCompact, cần thiết thì Snip đoạn lịch sử | Mất mát thông tin thấp, thường không tốn thêm lượt gọi model |
| Lịch sử hội thoại quá dài | Collapse, AutoCompact, Full Compact | Mất một phần chi tiết quá trình, trông cậy vào chất lượng tóm tắt |
| Session chính bị nhiễu bởi tìm kiếm và log | Sub-agent cô lập các tác vụ nhánh phụ | Thêm một lần điều phối, session chính chỉ nhận bản tóm tắt |
| Nén xong vẫn không duy trì được tác vụ | handoff + Context Reset | Viết sót tài liệu bàn giao thì session mới sẽ thiếu thông tin |

Trong sử dụng hàng ngày: trước tiên dọn dẹp kết quả công cụ có thể lấy lại; lịch sử quá dài thì nén; tìm kiếm, review và phân tích log giao cho Sub-agent; nén xong vẫn không thể tiếp nối ổn định thì mới viết handoff và mở session mới. Càng về sau, mất mát thông tin và chi phí điều phối càng lớn, vì vậy tuyệt đối không nên vừa vào đã Reset ngay.

## Triển khai Long-Running Task trong Thực tế

### Hai trường hợp Cực đoan

Đội ngũ Anthropic Labs vào năm 2026 đã công bố một kiến trúc 3 Agent lấy cảm hứng từ tư duy **GAN (Generative Adversarial Network - Mạng đối kháng tạo sinh)**:

![Kiến trúc 3 Agent của Anthropic](/media/jg/ext/oss.javaguide.cn/javaguide/ai/claude-code/ctx-mgmt-triagent-arch-f9bb6584.png)

Planner mở rộng mô tả sản phẩm từ 1-4 câu thành đặc tả hoàn chỉnh; Generator hiện thực hóa tính năng theo từng Sprint; còn Evaluator dùng Playwright MCP trực tiếp thao tác trên ứng dụng đang chạy, chấm điểm theo độ sâu thiết kế sản phẩm, tính năng, thiết kế thị giác và chất lượng code. Sự phân chia vai trò giúp quy hoạch, triển khai và đánh giá đều duy trì context độc lập.

Long-running Harness giai đoạn đầu dựa trên Sonnet 4.5 dùng Context Reset để giảm nhẹ Context Anxiety. Đến Harness 3 Agent chạy Opus 4.5, Anthropic chuyển sang dùng session liên tục, nhờ tính năng tự động nén của Claude Agent SDK để kiểm soát mức tăng context.

- Planner chỉ lập kế hoạch, không gánh chi tiết triển khai;
- Generator sau mỗi Sprint nhờ nén tự động để kiểm soát độ dài lịch sử, tránh lịch sử kéo lê làm chậm việc triển khai phía sau;
- Evaluator đánh giá độc lập, không bị ô nhiễm bởi context của Generator.

Chi phí và kết quả giữa hai cấu hình như sau:

| Cấu hình | Thời gian | Chi phí | Hiệu quả |
| --- | --- | --- | --- |
| Solo Harness, 1 Agent + công cụ tối thiểu | 20 phút | \$9 | Bán thành phẩm không chạy được |
| Full Harness, 3 Agent + toolchain hoàn chỉnh | 6 giờ | \$200 | Ứng dụng hoàn chỉnh, dùng được ngay |

Trường hợp của Carlini còn cực đoan hơn: 16 instance Claude Opus chạy song song, khoảng 2,000 session độc lập, kéo dài khoảng 2 tuần.

Kết quả cuối cùng tạo ra 100,000 dòng code Rust, tỷ lệ vượt qua GCC torture test đạt 99%, chi phí API khoảng 20,000 USD.

Mấu chốt ở đây là chia nhỏ công việc vào lượng lớn session độc lập để đẩy nhanh tiến độ song song. Log được ghi vào file thay vì xả ra console, và việc chạy test cũng được lấy mẫu con (subsampling): mỗi Agent chỉ chạy 1%-10% test case, tránh để output test tràn ngập window.

Carlini sau đó trong bài viết [Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler) đã đúc kết một câu:

> "I had to constantly remind myself that I was writing this test harness for Claude and not for myself." (Tôi phải liên tục tự nhắc mình rằng tôi đang viết bộ test harness này cho Claude chứ không phải cho chính tôi.)

Trong sự phân công của Carlini, các vai trò như compiler lõi, khử trùng lặp (deduplication), tối ưu hiệu năng, chất lượng code và tài liệu dần dần do các vai trò riêng biệt đảm nhiệm. LLM rất dễ code lại các tính năng vốn đã có, việc bố trí riêng vai trò khử trùng lặp giúp giảm bớt gánh nặng cho Agent chính khi vừa phải viết code, vừa phải tra trùng lặp và duy trì lịch sử.

Việc nâng cấp model cũng làm thay đổi sự đánh đổi trong Harness. Sau khi Anthropic nâng từ Opus 4.5 lên Opus 4.6, họ đã gỡ bỏ cơ chế Sprint ban đầu, và thu gọn việc đánh giá ràng buộc gắt gao theo từng Sprint thành một đợt QA tập trung / vài lượt đánh giá tinh gọn ở giai đoạn cuối. Việc chia nhỏ, kiểm tra và reset đều dựa trên giả định về năng lực của model, khi phiên bản thay đổi cần phải được kiểm chứng lại.

Dự án thường ngày dĩ nhiên không cần đến 3 Agent hay 2,000 session độc lập. Trước hết hãy đánh giá xem tác vụ sẽ tiêu tốn bao nhiêu context code.

### Dự án Thường ngày nên chọn thế nào

Bản thân mình từng vấp phải một bài học xương máu trong dự án nền tảng phỏng vấn. Một tác vụ trải qua nhiều module, lúc đó mình nghĩ một Agent đơn lẻ có thể gánh được. Kết quả chạy đến giữa chừng thì Claude Code tự dừng lại, context bị nổ tung. Sau đó mình đổi sang Sub-agent song song: mỗi subtask chỉ nhìn module mình phụ trách, cuối cùng bàn giao bản tóm tắt lại cho Agent chính, lúc đó mới hoàn thành trơn tru trong một lần.

| Quy mô tác vụ | Chiến lược khuyến nghị | Phương thức quản lý Context |
| --- | --- | --- |
| Nhỏ: Sửa 1 file, thêm 1 hàm | Đơn Agent | Tự động dọn dẹp kết quả công cụ là đủ |
| Vừa: Một module hoặc một tính năng | Đơn Agent + Chủ động Compaction | Chạy `/compact` khi kết thúc giai đoạn hoặc khi `/context` báo dung lượng tăng cao |
| Lớn: Refactor xuyên module, subsystem mới | Agent chính + Sub-agent | Giao tìm kiếm, review, phân tích log cho sub-agent |
| Cực lớn: Lặp dài hạn hoặc hệ thống độc lập | Đa Agent + handoff / Reset, hoặc Session liên tục + AutoCompact | Chuyển giai đoạn thì viết handoff; việc có Reset hay không tùy thuộc vào model và tác vụ |

Chi tiết lệnh `/compact`, Sub-agent, `/context` có thể xem lại bài [Hướng dẫn sử dụng Claude Code](https://javaguide.cn/ai-coding/claudecode-tips.html) và [Chi tiết các lệnh cốt lõi của Claude Code](https://javaguide.cn/ai-coding/claudecode-commands.html).

Mình thường không đợi đến khi AutoCompact chạm sát vạch mới hành động. Khi `/context` đạt khoảng 70%, hoặc bắt đầu xuất hiện dấu hiệu tìm kiếm lặp lại, quên ràng buộc, thì chủ động gõ `/compact` và nói rõ cần giữ lại cái gì, bộ tóm tắt sẽ nắm được trọng tâm rõ ràng hơn. Chờ hệ thống kích hoạt bị động thì trong window thường đã bị trộn lẫn log cũ, nhận định cũ và hàng đống kết quả thăm dò tạm thời.

Khi giai đoạn thăm dò kết thúc, có thể ghi ranh giới module, file then chốt, phương án loại trừ và test lỗi vào chỉ thị nén:

```text
/compact Giữ lại ranh giới module, file then chốt, phương án đã loại trừ, test đang thất bại hiện tại
```

Với các bài toán database thì nên nêu rõ Schema, migration và câu lệnh SQL lỗi cần tiếp nối:

```text
/compact Giữ lại toàn bộ schema database, script migration, quan hệ entity và SQL đang thất bại hiện tại
```

Với tác vụ xuyên module, sau khi đọc xong file và xác nhận ranh giới module, có thể thực hiện nén một lần; sau khi phương án, ràng buộc và rủi ro được chốt, lại nén thêm một lần; sau khi sửa code xong và kiểm chứng hoàn tất thì cập nhật trạng thái. Dùng `PLAN.md` hoặc `design.md` lưu trạng thái then chốt, bản tóm tắt truyền tải mục tiêu, sự đánh đổi và bước tiếp theo; số dòng, SQL lỗi, chi tiết interface vẫn nằm nguyên trong file.

Dự án nhiều file có thể chọn chiến lược theo tình huống:

| Tình huống | Cách làm khuyến nghị |
| --- | --- |
| Đọc lượng lớn file cùng lúc | Dùng MicroCompact / Snip / nén để xóa nội dung cũ đã phân tích xong |
| Tiếp tục sau khi gián đoạn lâu | Để hệ thống dọn kết quả công cụ hết hạn, cần thiết thì đọc lại file then chốt |
| Triển khai liên tục nhiều tính năng độc lập | Cứ xong một tính năng thì nén một lần |
| Đại tu lớn trải dài nhiều module | Tách theo giai đoạn, cuối mỗi giai đoạn thì nén và cập nhật file ghi chú |
| Lượng lớn log hoặc output test | Chỉ giữ lại tóm tắt thất bại, lệnh tái hiện và stack trace then chốt, không giữ output toàn phần |
| Cần tìm kiếm hoặc review song song | Giao cho Sub-agent, Agent chính chỉ tiếp nhận bản tóm tắt |

Lượng lớn file đọc trong giai đoạn thăm dò, về sau thường chỉ cần giữ lại kết luận; các ràng buộc và đánh đổi trong giai đoạn thiết kế thì cần lưu lại; log thất bại có thể tái hiện được thì không cần lưu toàn văn lâu dài. Khi thông tin đã ổn định đến mức độ này, thực hiện nén sẽ thích hợp hơn cả.

### Trạng thái Ngoại hóa, Ký ức và Hooks

Các Tasks API như `TaskCreate`, `TaskUpdate` chia nhỏ mục tiêu lớn thành các node tác vụ, ghi nhận trạng thái `pending`, `in_progress`, `completed` cùng các quan hệ phụ thuộc, và lưu bền vững thành danh sách tác vụ có cấu trúc (định dạng lưu trữ nội bộ không phải interface ổn định). Agent thông qua Task Tools đọc tiến độ hiện tại mà không phải dựa vào lịch sử đối thoại để nhớ xem "đã làm tới đâu rồi".

Khi nhiều Agent cùng ghi vào một repo, việc cô lập bằng worktree giúp lệnh `git status` của mỗi bên chỉ hiển thị thay đổi của riêng mình. Chạy test toàn phần, tìm kiếm xuyên file và phân tích module lớn có thể đẩy chạy ngầm (background), khi hoàn thành chỉ gửi về bản tóm tắt; các tác vụ vẫn đang chạy khi nén sẽ được tái tiêm vào context mới dưới dạng đính kèm.

Nguyên tắc tương tự cũng áp dụng cho ký ức (Memory): chỉ ghi lại những gì mã nguồn không thể suy ra được.

| Nên ghi | Không nên ghi |
| --- | --- |
| Sở thích người dùng, như phong cách code và thói quen ngôn ngữ | Cấu trúc thư mục dự án (chạy `glob` là tra ra) |
| Quy ước riêng của dự án, như tiền tố API | Chữ ký hàm interface (trong mã nguồn có sẵn) |
| Nguyên nhân đằng sau một quyết định kỹ thuật cụ thể | Phiên bản dependency (có trong `package.json` / `pom.xml`) |
| Bài học xương máu từng gặp và cách khắc phục | Lịch sử commit Git (tra bằng `git log` là thấy) |

Lịch sử session chỉ phục vụ cho session hiện tại, sau đó có thể bị nén. Các chỉ thị bền vững do người dùng hoặc dự án thiết lập sẽ đặt trong `CLAUDE.md` / Rules; Auto Memory lưu các ghi chú kinh nghiệm theo từng Git repo, đường dẫn mặc định là `~/.claude/projects/<project>/memory/`, có thể ghi đè bằng `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE` hoặc cấu hình `autoMemoryDirectory` trong trusted settings. Khi session khởi động chỉ nạp 200 dòng đầu hoặc 25KB của file `MEMORY.md`.

![Claude Code Auto Memory](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-auto-memory-437c2c64.png)

Khi file ký ức nhiều lên, lúc khởi động chỉ nạp index; khi cần chi tiết cụ thể mới mở file tương ứng.

Một số dự án Agent cũng dùng `AGENTS.md` làm index.

![CLAUDE.md và AGENTS.md](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

Có thể tham khảo bài viết [Harness Engineering: Why Coding Agents Need Infrastructure](https://alexlavaee.me/blog/harness-engineering-why-coding-agents-need-infrastructure/). Các file dạng này chịu trách nhiệm báo cho Agent biết "tài liệu ở đâu, khi nào nên đọc", chứ không phải nhồi nhét toàn bộ tài liệu vào context ngay từ đầu.

Auto Memory chính thức được lưu theo từng Git repo, các worktree khác nhau của cùng một repo sẽ dùng chung một bản ký ức.

Quy tắc cá nhân, quy tắc dự án và quy tắc tổ chức sẽ xếp chồng vào window; đừng trông chờ quy tắc nạp sau sẽ tự động đè lên thói quen nạp trước. Trong dự án nếu bắt buộc phải lấn át thói quen cá nhân thì hãy ghi rõ mức độ ưu tiên trong quy tắc dự án.

Khi đi phỏng vấn bị hỏi "Agent thực hiện ghi nhớ xuyên session (cross-session memory) như thế nào", nếu trả lời "lưu vào file" thì quá nông. Câu trả lời đầy đủ hơn là: chỉ lưu thông tin không tra được từ mã nguồn, phân tầng theo phạm vi ảnh hưởng, khi khởi động chỉ nạp index gọn nhẹ, khi cần mới đọc chi tiết, không nhồi nhét cả tệp ký ức vào window.

Theo tài liệu chính thức, ba loại thông tin bền vững có thể bố trí như sau:

| Loại | Tác dụng | Lưu trữ |
| --- | --- | --- |
| Lịch sử session | Trạng thái tạm thời của tác vụ hiện tại, có thể bị nén | Trong bộ nhớ `messages[]` |
| CLAUDE.md / Rules | Chỉ thị bền vững do người dùng, dự án, tổ chức thiết lập | Thư mục `.claude/` của dự án hoặc `~/.claude/` |
| Auto Memory | Ghi chú kinh nghiệm do Claude duy trì theo Git repo | Mặc định tại `~/.claude/projects/<project>/memory/`, có thể ghi đè bởi `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE` hoặc trusted settings; `MEMORY.md` là index, dùng chung giữa các worktree |

![Lệnh /memory trong Claude Code](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claudecode-memory-command-51dac2f1.png)

Phương án đi đường vòng tạm thời để né một Bug một khi bị ghi vào ký ức dự án thì các session sau có thể tiếp tục kế thừa tiền đề sai lầm đó. Đường dẫn file, phiên bản dependency và chữ ký hàm có thể tra trực tiếp từ code mà không cần ghi lặp lại; các mục ghi tăng lên sẽ đội chi phí cố định, còn các mục sai lệch sẽ tiếp tục làm sai lệch phán đoán.

Một phần chi phí cố định khác đến từ cấu hình. Các key cấu hình thông thường của Claude Code tuân thủ thứ tự ưu tiên này:

```text
Managed (Tổ chức quản lý) > CLI Flags > Dự án Local > Dự án Shared > Cấu hình Người dùng
```

Cấu hình dạng mảng như quyền hạn, đường dẫn Sandbox là ngoại lệ, chúng có thể áp dụng quy tắc gộp và khử trùng lặp chứ không đơn giản là ghi đè.

Khi cấu hình dự án thêm 5 quy tắc, cấu hình người dùng thêm 3 quy tắc, MCP thêm 2 dịch vụ, thì quy tắc, quyền hạn và định nghĩa công cụ cộng lại có thể ngốn vài nghìn token. Đặt quy tắc chung ở phạm vi global, quy tắc đặc thù ở cấp dự án sẽ giảm bớt việc tiêm lặp lại.

Hook được dùng để can thiệp vào context tại các mốc vòng đời quy định: `SessionStart` tiêm ký ức; `PreCompact` bổ sung chỉ thị nén; `PostCompact` chịu trách nhiệm thông báo hoặc hiển thị; `PostToolUse` điều chỉnh output của MCP tool; còn `PreToolUse` phán đoán xem công cụ có được phép thực thi hay không.

Output của Hook sẽ đi vào context, nghĩa là nó không hề miễn phí. Khi trang web bên ngoài, output script hoặc file tạm thời bị lẫn chỉ thị bẩn, nó còn có thể đem lại rủi ro prompt injection. Các dự án lập trình thông thường nhìn chung chỉ cần dùng cơ chế dọn dẹp, nén và circuit breaker tích hợp sẵn là đủ.

Bảng dưới đây liệt kê thời điểm các Hook can thiệp vào context:

| Sự kiện | Thời điểm kích hoạt | Tác dụng quản lý Context |
| --- | --- | --- |
| `SessionStart` | Khi bắt đầu session | Tiêm ký ức, thông tin môi trường |
| `InstructionsLoaded` | Sau khi nạp quy tắc | Thông báo, ghi log audit |
| `PreToolUse` | Trước khi gọi công cụ | Phán đoán công cụ có được phép chạy không |
| `PostToolUse` | Sau khi MCP tool trả về | Điều chỉnh output của MCP tool |
| `PreCompact` / `PostCompact` | Trước/sau khi nén | Thêm chỉ thị trước khi nén; thông báo hoặc hiển thị sau tóm tắt |

Mỗi khi thêm một Hook là thêm một nguồn output tiềm tàng đi vào context. Chỉ khi dự án nhóm có ràng buộc nghiệp vụ khắt khe, yêu cầu audit tuân thủ hoặc nhu cầu làm sạch output công cụ thì mới nên cấu hình Hook cho các tình huống đó.

## Phiên bản Câu trả lời Phỏng vấn mẫu

Chúng ta có thể nhìn nhận quản lý context như việc quản trị một bộ nhớ làm việc (working memory) hữu hạn. Khi Agent thực hiện các long-running task, nó phải vừa suy luận vừa mang theo mục tiêu tác vụ, quy tắc dự án, mã nguồn đã đọc, output công cụ, kế hoạch và các kết luận trung gian. Window cứ tích lũy dần thì log cũ, kết quả tìm kiếm trùng lặp và các vấn đề đã giải quyết sẽ chiếm đoạt sự chú ý; khi tiệm cận giới hạn trên, model còn có thể vì thiếu không gian output khả dụng mà kết thúc vội vã tác vụ.

Tôi sẽ phân tách thông tin thành hai nhóm trước tiên. Hàng chục kết quả tìm kiếm trong một lần query, toàn bộ log chạy test, nguyên văn các file dài đã xác nhận xong đều có thể lấy lại sau này, không đáng để chiếm giữ window mãi. Ngược lại, mục tiêu tác vụ, ràng buộc nghiệp vụ, quyết định then chốt, test case thất bại, các file đã sửa và bước tiếp theo bắt buộc phải được giữ lại; những thông tin này sẽ được nén thành bản tóm tắt có thể tiếp tục thực thi, rồi ghi vào `PLAN.md`, tài liệu thiết kế hoặc file tác vụ, tránh việc chỉ tồn tại trong một lượt đối thoại đơn lẻ.

Đặt vào Claude Code, tôi sẽ để nó dọn dẹp kết quả công cụ có thể lấy lại trước; khi lịch sử quá dài mới chạy `/compact`, giữ lại mục tiêu, ràng buộc, quyết định và todo. Nếu sau khi nén vẫn cần đổi session thì handoff tối thiểu phải ghi rõ những thay đổi hiện tại, test thất bại, phương án đã loại trừ và cách thức kiểm chứng tiếp theo. Đối với các nhánh phụ như phân tích log, tìm kiếm xuyên file hay review độc lập, tôi sẽ giao cho Sub-agent, session chính chỉ tiếp nhận kết luận và bằng chứng cần thiết, không nhồi nhét toàn bộ quá trình trở lại.

Vì vậy, việc đánh giá quản lý context tốt hay không không phụ thuộc vào việc nhồi nhét được bao nhiêu thông tin trong window, mà phụ thuộc vào việc tác vụ có thể tiếp nối trơn tru sau khi nén, đổi session hay chia tách hay không: window phục vụ cho suy luận tức thời, còn filesystem lưu giữ trạng thái tác vụ có thể tái sử dụng và truy vết.

## Tổng kết

Khi window bị lấp đầy, trước tiên hãy dọn dẹp các tài liệu tạm thời có thể lấy lại như kết quả công cụ, log test và output tìm kiếm; sau khi giai đoạn kết thúc mới nén lịch sử hội thoại quá dài. Đẩy các nhánh phụ như tìm kiếm, review và phân tích log sang Sub-agent, session chính chỉ giữ lại kết luận.

Nếu session sau khi nén vẫn không thể tiếp nối, tài liệu handoff cần nêu rõ các ca thất bại, ràng buộc tạm thời, các file đang sửa và phương án đã loại trừ, rồi bàn giao cho session mới xử lý. Các thông tin vẫn sẽ dùng tiếp sau này như Plan, Spec, câu lệnh SQL lỗi và đánh đổi thiết kế hãy ghi vào `PLAN.md`, `design.md`, `NOTES.json` hoặc file tác vụ riêng của dự án. Bằng cách đó, window chỉ lưu tài liệu tạm thời, còn filesystem chịu trách nhiệm lưu giữ bền vững trạng thái tác vụ.
