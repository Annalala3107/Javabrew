---
title: "Chi tiết hệ thống bộ nhớ Claude Code: Lựa chọn giữa Markdown, Auto Memory và tìm kiếm Vector"
description: "Xuất phát từ cơ chế bộ nhớ của Claude Code, bóc tách sự phân công giữa CLAUDE.md, .claude/rules, Auto Memory, Subagent Memory, Agent Teams và các plugin bộ nhớ bên thứ ba, làm rõ thông tin nào đáng lưu trữ lâu dài và khi nào nên dùng Markdown, claude-mem, memsearch hay tìm kiếm vector."
category: Nguyên lý AI Coding
tag:
  - Claude Code
  - Auto Memory
  - Agent Memory
  - AI Coding
lang: vi
sourceRef: zh-ref/ai-coding/principles/claude-code-memory.md
head:
  - - meta
    - name: keywords
      content: Claude Code,Auto Memory,CLAUDE.md,MEMORY.md,Agent Memory,Subagent Memory,Agent Teams,claude-mem,memsearch,Tìm kiếm vector
---

Mở một phiên làm việc mới với Claude Code, bạn ngạc nhiên khi thấy nó đã biết dự án này chạy test ra sao, phong cách viết code thế nào, thư mục nào không được tự tiện chỉnh sửa, thậm chí nó còn nhớ rõ câu nhắc nhở trước đây của bạn: "Kiểm thử tích hợp (integration test) đừng dùng H2, phải kết nối MySQL thật".

Phải chăng mô hình đã ghi nhớ toàn bộ những lần trò chuyện trước đó vào đầu?

Khả năng rất cao là không phải. Trong mỗi lượt suy luận (inference), LLM chỉ nhìn thấy dữ liệu đầu vào của chính lượt đó. Việc Claude Code có thể tiếp nối mạch làm việc xuyên suốt qua nhiều phiên hội thoại là nhờ vào hệ thống tệp và logic tải dữ liệu được xây dựng bên ngoài mô hình: quy tắc nào thường trực, kinh nghiệm nào lưu vào chỉ mục (index) trước, và nội dung nào chờ đến khi tác vụ liên quan mới đọc vào.

Bài viết này và bài [Hệ thống bộ nhớ của AI Agent](https://javaguide.cn/ai/agent/agent-memory.html) bổ trợ lẫn nhau. Bài viết đó giải thích về bộ nhớ Agent tổng quát: bộ nhớ ngắn hạn, bộ nhớ dài hạn và cơ chế tiến hóa bộ nhớ. Khi đặt vào bối cảnh Claude Code, vấn đề sẽ trở nên cụ thể hơn: `CLAUDE.md` rốt cuộc nên chứa cái gì? Auto Memory ghi lại những gì? Và `.claude/rules/` cùng các giải pháp bên thứ ba như `claude-mem`, `memsearch` nên phân công ra sao?

![Kiến trúc hệ thống bộ nhớ của AI Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-arch-3b774c14.png)

## Bản thân LLM không tự lưu trạng thái xuyên phiên làm việc

Trước tiên cần làm rõ điểm mấu chốt này: Bản thân mô hình không bao giờ âm thầm lưu lại trạng thái giữa hai lần request.

Trong một lần gọi, client sẽ gom system prompt, lịch sử hội thoại, kết quả trả về của công cụ và câu hỏi mới của người dùng lại với nhau, rồi mô hình dựa vào khối nội dung đó để sinh ra lượt đầu ra tiếp theo. Lượt sau mô hình vẫn "nhớ" được chẳng qua là vì tầng ứng dụng đã mang các nội dung liên quan trở lại context.

Trò chuyện thông thường ít khi để lộ vấn đề này. Khi bạn chat liên tục vài chục lượt, client mang theo toàn bộ phần văn bản trước đó nên mô hình tự nhiên sẽ tiếp được lời. Nhưng trong ngữ cảnh Agent thì phiền phức hơn rất nhiều: nó phải đọc tệp, chạy lệnh, gọi công cụ, lấy log—từng bước trả về đều ngốn context. Chỉ sau vài lượt, cửa sổ context đã chứa đầy tài liệu tạm thời, khiến các quy tắc dài hạn bị lẫn lộn bên trong.

![Bản thân LLM không lưu trạng thái xuyên phiên](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/llm-no-cross-session-state-b1e56133.webp)

Nếu so sánh theo góc nhìn kỹ thuật phần mềm, Kỹ thuật Context (Context Engineering) khá giống việc làm "quản lý bộ nhớ" cho LLM: dung lượng cửa sổ context là có hạn, việc thực sự cần quản lý là thông tin nào thường trực, thông tin nào tải theo nhu cầu, và thông tin nào cần bị loại bỏ sau khi hết hạn. Khi Token bị thắt chặt, việc tóm tắt, nén, truy xuất và đánh đổi độ ưu tiên về bản chất đều cùng giải quyết một bài toán: **Đừng để nội dung giá trị thấp chiếm mất context mà tác vụ hiện tại thực sự cần.**

Context nên được tổ chức ra sao, khi nào tải theo nhu cầu, khi nào cần nén, mình đã phân tích riêng trong bài viết [Kỹ thuật Context (Context Engineering) là gì? Khác gì so với Prompt Engineering?](https://javaguide.cn/ai/agent/context-engineering.html), do giới hạn độ dài nên ở đây sẽ không nhắc lại.

Quay lại với Claude Code, bộ nhớ dài hạn trước tiên phải trả lời được các câu hỏi sau:

1. Thông tin nào thực sự xứng đáng được lưu trữ lâu dài?
2. Lưu vào đâu, và ai có thể nhìn thấy?
3. Lúc khởi động tải bao nhiêu, trong quá trình thực hiện tác vụ bổ sung như thế nào?
4. Khi bộ nhớ hết hạn, xung đột hoặc bị codebase mới phủ định, làm sao phát hiện và dọn dẹp?

Rất nhiều vấn đề bị tắc lại ngay ở câu hỏi đầu tiên: **Rốt cuộc điều gì đáng để ghi lại.**

![Phân tầng bộ nhớ trong Claude Code](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-memory-layers-2ecaa4a7.webp)

## Đừng nhầm lẫn giữa quy tắc và kinh nghiệm

Context dài hạn của Claude Code trước hết có thể chia thành hai nhóm: **Quy tắc do con người viết cho Claude, và kinh nghiệm mà Claude tự tích lũy được trong quá trình làm việc.**

`CLAUDE.md` thuộc nhóm thứ nhất. Nó giống như bản đặc tả công việc trước khi bắt đầu phiên làm việc: quy chuẩn viết code, các lệnh thường dùng, ràng buộc thư mục, quy trình làm việc nhóm, các khu vực cấm đụng vào đều nên viết ở đây. Tài liệu chính thức xếp nó vào nhóm instructions and rules (hướng dẫn và quy tắc).

![CLAUDE.md và AGENTS.md](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

Auto Memory thuộc nhóm thứ hai. Nó ghi lại các mẫu (patterns) mà Claude bắt gặp trong dự án, chẳng hạn như lệnh build, kinh nghiệm debug, sở thích của người dùng, hoặc các cạm bẫy lặp đi lặp lại. Tài liệu chính thức xếp nó vào nhóm learnings and patterns (kinh nghiệm và mẫu đã học).

Cả hai đều sẽ được đưa vào phiên làm việc, nhưng trách nhiệm hoàn toàn khác nhau:

| Cơ chế | Ai viết | Phù hợp lưu trữ gì | Cách tải mặc định |
| ------ | ------- | ------------------ | ----------------- |
| `CLAUDE.md` | Con người | Quy tắc ổn định, quy ước dự án, quy trình cộng tác | Tải vào mỗi phiên |
| Auto Memory | Claude | Kinh nghiệm, thói quen, mẫu phát hiện trong lúc làm việc | Tải 200 dòng đầu hoặc 25KB của `MEMORY.md` mỗi phiên |

Tốt nhất nên phân định rõ hai nhóm này. Quy tắc hãy để con người bảo trì vì nó gắn liền với thỏa thuận chung của nhóm; kinh nghiệm có thể để Claude ghi chép, nhưng trước khi sử dụng thì nên đối chiếu lại với mã nguồn hiện tại.

### `CLAUDE.md`: Nơi đặt các quy tắc cần xem ở mọi lượt

Cách viết chi tiết cho `CLAUDE.md` mình đã trình bày riêng trong bài [Best Practices cho CLAUDE.md: Nên viết gì, không nên viết gì và cách bóc tách khi dự án phình to](https://javaguide.cn/ai-coding/practices/claude-md-best-practices.html). Bài viết này sẽ không lặp lại template hay ví dụ, mà chỉ tập trung vào vị trí của nó trong hệ thống bộ nhớ.

Thay vì xem các vị trí nằm rải rác trong tài liệu chính thức, mình khuyên bạn nên ghi nhớ theo 5 tầng phân cấp sau:

![Phân tầng và độ ưu tiên của CLAUDE.md](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-file-hierarchy-8abb6c01.png)

| Cấp bậc | Đường dẫn | Nội dung phù hợp |
| ------- | --------- | ---------------- |
| Cấp tổ chức | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`; Linux/WSL: `/etc/claude-code/CLAUDE.md`; Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | Quy chuẩn code, chính sách bảo mật, yêu cầu tuân thủ do IT/DevOps phát hành tập trung |
| Cấp người dùng | `~/.claude/CLAUDE.md` | Thói quen công cụ và sở thích cá nhân áp dụng cho mọi dự án |
| Cấp dự án | `./CLAUDE.md` hoặc `./.claude/CLAUDE.md` | Kiến trúc dự án, câu lệnh, tiêu chuẩn code dùng chung cho cả nhóm |
| Cấp cục bộ | `./CLAUDE.local.md` | Cấu hình cá nhân trong dự án hiện tại, ví dụ URL sandbox, dữ liệu test cá nhân |
| Cấp thư mục con | `./subdir/CLAUDE.md`, cùng với `CLAUDE.local.md` cùng thư mục | Quy tắc của một module hoặc thư mục con, chỉ được tải khi Claude đọc tệp trong thư mục đó |

Những tệp này không đơn thuần là tệp sau ghi đè tệp trước. Claude sẽ ghép nối tất cả các tệp `CLAUDE.md` và `CLAUDE.local.md` nhìn thấy trên đường dẫn khởi động vào context: phạm vi càng rộng tải trước, càng gần thư mục hiện tại tải sau; các tệp trong thư mục con không tải lúc khởi động mà phải đợi khi Claude đọc đến tệp thuộc thư mục đó mới bổ sung vào. Chính sách cấp tổ chức (managed policy) không thể bị loại trừ bởi cấu hình cá nhân.

Mỗi tệp `CLAUDE.md` tốt nhất nên kiểm soát dưới 200 dòng. Tệp càng dài, mô hình càng dễ rơi vào tình trạng chỉ nhớ được một phần.

![Khuyến nghị về CLAUDE.md trong tài liệu chính thức](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claudemd-claude-docs-95f47141.png)

Đây chính là vấn đề suy thoái context (Context Rot) mà chúng ta thường nhắc tới. **Context càng dài, thông tin càng nhiễu thì độ ổn định trong việc tận dụng context của mô hình càng dễ suy giảm.**

![Hiện tượng Context Rot](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-rot-diagram-455c3d66.png)

`CLAUDE.md` rất dễ bị hiểu sai trong các trường hợp sau:

1. `CLAUDE.md` không phải là cấu hình mang tính cưỡng chế tuyệt đối.

`CLAUDE.md` được tiêm vào sau system prompt dưới dạng user message. Nó rất hữu ích, nhưng nếu quy tắc viết mơ hồ, lỗi thời hoặc các tệp xung đột lẫn nhau, mô hình vẫn hoàn toàn có thể chọn sai.

2. Chú thích HTML cấp khối (block-level HTML comments) chỉ bị lược bỏ trước khi đưa vào context.

Bạn có thể viết ghi chú bảo trì trong `CLAUDE.md`:

```markdown
<!-- Đoạn này dành cho người bảo trì xem, sẽ bị lược bỏ khi đưa vào context -->
```

Nhưng nếu Claude dùng công cụ đọc tệp để mở trực tiếp, chú thích đó vẫn hiển thị đầy đủ.

3. `@path/to/file` có thể nạp tệp bên ngoài, nhưng không hề tiết kiệm token.

Tệp được tham chiếu sẽ được giải nén bung ra vào context lúc khởi động (đệ quy tối đa 4 bước), và lần đầu tham chiếu tệp bên ngoài có thể cần phê duyệt. Đừng hy vọng dùng `@` để chia nhỏ tệp nhằm "tiết kiệm cửa sổ context" cho những khối quy tắc đồ sộ.

Nơi thực sự phù hợp để tải quy tắc theo nhu cầu là `.claude/rules/`.

![Phân công giữa CLAUDE.md và các tệp quy tắc khác](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-rule-files-relationship-66d1a6af.png)

### `.claude/rules/`: Dành cho quy tắc kích hoạt theo tệp

Giả sử bạn có một bộ quy tắc frontend chỉ cần dùng khi xử lý `src/**/*.tsx`. Nếu tác vụ backend nào cũng tải nó vào thì đó là sự lãng phí context không cần thiết.

`.claude/rules/` rất thích hợp cho loại quy tắc có điều kiện này. Mỗi quy tắc là một tệp Markdown, có thể khai báo `paths` trong frontmatter:

```markdown
---
paths:
  - "src/**/*.{ts,tsx}"
  - "tests/**/*.test.ts"
---

# TypeScript Rules

- Tham số đầu vào của API bắt buộc phải validate.
- Tệp test ưu tiên tái sử dụng fixture có sẵn.
```

Quy tắc có khai báo `paths` sẽ không bị nhồi nhét toàn bộ vào lúc khởi động. Chỉ khi Claude đọc tệp khớp với glob pattern thì quy tắc tương ứng mới được kích hoạt. Nhờ đó, những nội dung có giá trị lâu dài nhưng chỉ dùng cho một nhóm tác vụ nhất định sẽ không phải chen chúc vào `CLAUDE.md`.

Trong dự án thực tế, mình thường chia theo mục đích sử dụng:

- Quy tắc cần thấy ở mọi phiên làm việc: đưa vào `CLAUDE.md`;
- Quy tắc chỉ có ích với một nhóm tệp hoặc thư mục: đưa vào `.claude/rules/`;
- Quy trình thao tác nhiều bước, có thể tái sử dụng: đóng gói thành Skill, kích hoạt theo nhu cầu;
- Hành vi bắt buộc phải chặn cứng: dùng hook hoặc cấu hình quyền hạn, tuyệt đối không chỉ viết trong Markdown.

Những yêu cầu như "cấm thực thi `rm -rf`", "trước khi commit bắt buộc phải chạy script kiểm tra" nếu chỉ ghi trong `CLAUDE.md` thì chỉ mang tính nhắc nhở. Muốn thực sự chặn đứng lệnh gọi công cụ, bạn bắt buộc phải dựa vào hook, permissions hoặc CI bên ngoài.

### Auto Memory: Nơi lưu trữ kinh nghiệm Claude ghi chép trong công việc

Auto Memory là cơ chế ghi nhớ tự động do Claude Code chính thức cung cấp. Tính chất "tự động" thể hiện ở chỗ Claude sẽ tự viết notes trong quá trình làm việc: chẳng hạn như lệnh build, kinh nghiệm debug, thông tin kiến trúc, sở thích code style và thói quen làm việc.

Tuy nhiên, nó không viết vào mọi lượt hội thoại, mà do Claude tự đánh giá xem nội dung nào có thể sẽ cần dùng trong tương lai. Bạn có thể dùng lệnh `/memory` để mở trực tiếp thư mục tương ứng.

![Lệnh /memory trong Claude Code](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claudecode-memory-command-51dac2f1.png)

Theo tài liệu chính thức, Auto Memory khả dụng từ phiên bản Claude Code v2.1.59 và được bật mặc định. Nó lưu bộ nhớ dự án vào `~/.claude/projects/<project>/memory/`, khi khởi động sẽ đọc trước 200 dòng đầu hoặc 25KB của tệp `MEMORY.md`. Các nội dung chi tiết hơn sẽ không bị nhồi nhét cùng lúc, mà được chia thành các topic file (tệp theo chủ đề) để mở khi cần; lệnh `/memory` cho phép xem và chỉnh sửa.

![Auto Memory trong Claude Code](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-auto-memory-437c2c64.png)

Bạn cũng có thể tắt nó đi:

```json
{
  "autoMemoryEnabled": false
}
```

Hoặc dùng biến môi trường:

```bash
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1
```

Thư mục lưu trữ mặc định là:

```text
~/.claude/projects/<project>/memory/
```

Cấu trúc điển hình theo tài liệu chính thức:

```text
~/.claude/projects/<project>/memory/
├── MEMORY.md
├── debugging.md
├── api-conventions.md
└── ...
```

`MEMORY.md` chỉ đóng vai trò làm mục lục dẫn đường, lúc khởi động tự động nạp 200 dòng đầu hoặc 25KB (tùy điều kiện nào đến trước). Các giải thích chi tiết nằm trong các topic file, Claude sẽ chỉ đọc khi thực sự cần.

Thiết kế này rất giống cơ chế tiết lộ tiệm tiến của Skill đã đề cập trước đó: trước hết cho mô hình biết "có cái gì", tránh vừa vào đã nhồi nhét "toàn bộ nội dung" làm tràn ngập context.

![Tiết lộ tiệm tiến trong Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-progressive-disclosure-a73e1cfe.webp)

Tài liệu chính thức không bắt buộc topic file phải theo một schema nhất định, cũng không cam kết công khai rằng "loại bộ nhớ bắt buộc phải là user / feedback / project / reference".

Bốn phân loại dưới đây được đúc kết từ phân tích rò rỉ mã nguồn trước đó:

| Loại | Thích hợp lưu | Không thích hợp lưu |
| ---- | ------------- | ------------------- |
| `user` | Sở thích lâu dài, nền tảng kỹ thuật, thói quen giao tiếp của người dùng | Ý nghĩ bộc phát tạm thời của người dùng vừa nói |
| `feedback` | Cách làm người dùng đã sửa rõ ràng | Phỏng đoán hay sở thích mà Agent tự suy diễn |
| `project` | Giai đoạn dự án, lý do quyết định, quy tắc đóng băng ngắn hạn | Các sự thật hay thay đổi như cấu trúc code hiện tại, số dòng tệp |
| `reference` | Tra cứu thông tin ở đâu, tài liệu nào là nguồn chuẩn xác | Toàn văn tài liệu sao chép dài dòng |

Auto Memory tự động ghi chép notes, nhưng không đồng nghĩa với việc bạn có thể phó mặc hoàn toàn. Dù là bạn bảo Claude "hãy nhớ điều này", dùng `/memory` để duyệt lại nội dung được ghi tự động, hay tự xây dựng hệ thống tương tự, bạn đều cần có tiêu chí sàng lọc rõ ràng. Nguyên tắc của mình là thà ghi ít vài điều còn hơn chất đống rác vô ích.

Hãy tập trung vào 3 câu hỏi:

1. Lần sau đưa ra quyết định có dùng đến nó không?
2. Có phải người dùng đã xác nhận rõ ràng hay không?
3. Khi nó hết hạn, liệu có ai nhận ra không?

Nếu không trả lời được, hãy để nó ở lại trong phiên hiện tại, không cần thiết phải ghi vào bộ nhớ dài hạn.

Nếu thực sự muốn lưu lại, cũng đừng chỉ ném một câu kết luận cụt ngủn vào topic file. Tối thiểu hãy ghi rõ bối cảnh sự thật, lý do chọn cách làm đó tại thời điểm đó, thời gian tạo/thời gian hết hạn, và việc có cần đối chiếu lại trước khi dùng hay không. Về sau khi Agent đọc lại bản ghi này, nó sẽ thấy một hồ sơ có ranh giới rõ ràng thay vì một quy tắc cứng nhắc và mù quáng.

![Quản trị ghi chép bộ nhớ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-memory-write-governance-3368db83.webp)

Ví dụ:

```markdown
---
type: feedback
created_at: 2026-06-17
updated_at: 2026-06-17
---

# Kiểm thử tích hợp kết nối MySQL thực tế

Kiểm thử tích hợp (integration test) chỉ cần xác minh hành vi cơ sở dữ liệu là phải kết nối MySQL thật, không dùng cơ sở dữ liệu bộ nhớ H2 thay thế.

Lý do: Trước đây có các test case chạy pass trên H2, nhưng khi deploy lên production lại phát sinh lỗi do sự khác biệt về transaction và SQL dialect của MySQL.

Phạm vi áp dụng: Kiểm tra tham số, kiểm thử logic rẽ nhánh thuần túy có thể tiếp tục dùng các phương án mock nhẹ hơn; khi liên quan đến transaction, index, SQL dialect và hành vi đồng thời (concurrency), bắt buộc phải quay lại MySQL thật.
```

Chỉ ghi mỗi câu "integration test không dùng H2" dĩ nhiên cũng có tác dụng, nhưng Agent rất dễ thực thi một cách máy móc. Bổ sung thêm nguyên nhân và phạm vi áp dụng giúp nó có cơ sở để đánh đổi chính xác khi gặp các trường hợp chỉ kiểm tra tham số hoặc logic rẽ nhánh đơn giản sau này.

## Những thứ không nên đưa vào bộ nhớ dài hạn

Phía trên là những gì đáng ghi nhớ. Ngược lại, có những nội dung tốt nhất chỉ nên ở lại trong phiên làm việc hiện tại.

Những điều sau đây mình khuyên không nên đưa vào Auto Memory:

- Tệp hiện tại có bao nhiêu dòng, hàm này hiện đang nằm ở dòng nào;
- Đầu ra câu lệnh của lượt này, log tạm thời, lỗi một lần và trạng thái trung gian điều tra;
- Lịch sử thay đổi có thể tra cứu qua Git, các nội dung ổn định đã có trong README hay tài liệu API;
- Các phỏng đoán hay nhận định mà Agent tự suy ra nhưng chưa được người dùng xác nhận.

Chúng rất hữu ích trong context hiện tại, nhưng đưa vào memory thì hoàn toàn vô nghĩa, thậm chí còn gây sai lệch phán đoán của Agent.

Mốc thời gian cũng nên gắn với ngày tháng cụ thể. Nếu người dùng nói "trước cuối tháng đừng đụng vào module đơn hàng", hãy ghi thành "Không sửa đổi module đơn hàng trước ngày 2026-06-30". Những cách diễn đạt như "cuối tháng", "tuần sau", "hôm qua" chỉ có giá trị tại thời điểm nói; vài ngày sau đọc lại, Claude sẽ rất khó biết nó ám chỉ ngày nào.

Một mục memory sau khi được ghi vào thì chi phí của nó không chỉ dừng lại ở vài chục token. Nó còn phải được duyệt lại, sửa đổi hoặc xóa bỏ; nếu không ai quản lý, Agent có thể sẽ dựa vào tiền đề cũ rích đó để tiếp tục đưa ra quyết định sai lầm.

## Auto Memory đọc dữ liệu về như thế nào: Đừng mặc định cơ chế cứng

Tài liệu chính thức chỉ đề cập đến tầng `MEMORY.md` và các topic file: lúc khởi động tải trước mục lục, nội dung chi tiết đọc theo nhu cầu.

Đi sâu vào bên trong, Auto Memory dùng grep, LLM picker, tìm kiếm vector hay chiến lược nào khác thì Anthropic không công bố chi tiết.

![Quy trình recall của Auto Memory](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-memory-recall-flow-e436c3ca.webp)

Theo các đoạn mã rò rỉ và phân tích dịch ngược từ cộng đồng: Claude có thể sẽ đọc `MEMORY.md` và tóm tắt của các tệp trước, sau đó tùy theo tác vụ hiện tại mà chọn tệp liên quan; cũng có ý kiến cho rằng nó thiên về khớp từ khóa (keyword matching).

Trong triển khai thực tế, bạn chỉ cần nắm chắc vài nguyên tắc: mục lục phải ngắn gọn, phần thân chi tiết tách ra ngoài, không nhồi nhét lặp lại những ký ức đã có trong cùng một lượt. Đọc về cũng không phải càng nhiều càng tốt, nhét nhầm một ký ức lỗi thời còn nguy hiểm hơn nhiều so với việc thiếu một ký ức.

## Đọc được memory, trước hết hãy phân loại thông tin

Khi Auto Memory được nạp lại vào context, trước tiên hãy xem nó như một manh mối có gắn mốc thời gian: nó cho bạn biết trước đây vì sao lại làm như vậy, có thể bắt đầu tra cứu từ đâu, chứ không chứng minh hiện tại mọi thứ vẫn y hệt như thế.

Ví dụ trong memory ghi "tác vụ timeout đơn hàng nằm ở module `order-job`". Bản ghi này có thể đúng tại ngày ghi chép; nhưng sau đó mã nguồn đã được tách module, tác vụ có thể đã chuyển đi nơi khác hoặc đổi tên. Nếu Agent cứ máy móc sửa tệp theo ký ức cũ thì khả năng đi chệch hướng là rất cao. Trình tự an toàn hơn là: dùng memory để định hướng tìm kiếm, sau đó quay lại codebase hiện tại, tài liệu hiện tại hoặc đầu ra câu lệnh để kiểm chứng lại.

Cách tin tưởng các loại memory khác nhau cũng không giống nhau.

Sở thích dài hạn của người dùng có thể ưu tiên áp dụng, nhưng chỉ thị rõ ràng trong lượt hiện tại luôn có quyền lực tối cao. Nguyên nhân của các quyết định trong quá khứ có thể tham khảo, nhưng nó chỉ giải thích tại sao hồi đó lại chọn như vậy, không có nghĩa là bây giờ bắt buộc phải làm y hệt. Đường dẫn tệp, vị trí module, tham số câu lệnh chỉ nên coi là manh mối, trước khi dùng nhất định phải đối chiếu lại với kho mã nguồn hiện tại. Đóng băng dự án, thời điểm deploy phải căn cứ vào ngày tuyệt đối, hết hạn thì cập nhật hoặc xóa bỏ. Kết luận từ tài liệu bên thứ ba cũng vậy, cuối cùng vẫn phải đối chiếu lại tài liệu chính thức hoặc phiên bản thư viện thực tế đang dùng.

Giá trị của Auto Memory là giảm bớt việc phải giải thích lặp đi lặp lại, giúp Agent không phải bắt đầu từ con số không. Nhưng trước khi thực sự bắt tay vào sửa đổi, mã nguồn hiện tại, tài liệu hiện tại và đầu ra câu lệnh hiện tại vẫn luôn có độ ưu tiên cao nhất.

## Subagent Memory và Agent Teams giải quyết vấn đề gì

Trong tài liệu về Multi-Agent, Subagent Memory và Agent Teams rất hay được đặt cạnh nhau. Cái trước quản lý kinh nghiệm dài hạn của riêng một subagent cụ thể, cái sau quản lý cách nhiều session Claude Code phối hợp với nhau trong một tác vụ.

Subagent Memory vẫn là bộ nhớ dài hạn dạng tệp, chỉ khác là chủ thể của bộ nhớ đã chuyển từ phiên chính sang một subagent nhất định. Trường `memory` trong tài liệu subagent chính thức hỗ trợ 3 phạm vi: `user`, `project`, `local`.

Tùy theo scope, Claude Code sẽ sử dụng các thư mục sau:

```text
~/.claude/agent-memory/<agent-name>/
.claude/agent-memory/<agent-name>/
.claude/agent-memory-local/<agent-name>/
```

Các thư mục này được tạo hoặc sử dụng theo nhu cầu. Khi chưa cấu hình `memory` cho subagent, việc không thấy thư mục `agent-memory/` trong `~/.claude/` là hoàn toàn bình thường.

Sau khi kích hoạt, lúc subagent khởi động nó sẽ đọc 200 dòng đầu hoặc 25KB của tệp `MEMORY.md` trong thư mục tương ứng. Nó cũng được cấp các công cụ tệp cần thiết để đọc ghi thư mục memory nhằm tự duy trì kinh nghiệm của mình.

Loại memory này rất phù hợp cho kinh nghiệm của các worker chuyên biệt. Chẳng hạn một subagent chuyên xử lý migration database có thể tích lũy quy chuẩn script migration, nguyên nhân thất bại phổ biến và các đánh đổi lịch sử trong dự án. Lần sau gặp tác vụ tương tự, nó ít nhất cũng biết nên tra cứu ở đâu trước, tránh giẫm phải vết xe đổ.

Agent Teams đi theo hướng điều phối cộng tác. Team lead, teammates, shared task list, mailbox trong tài liệu chính thức giải quyết bài toán: các session Claude Code độc lập phân công, liên lạc, đồng bộ trạng thái tác vụ thế nào, hoàn toàn khác với việc chia sẻ bộ nhớ dài hạn.

Agent Teams có thể tham chiếu định nghĩa subagent để tạo ra teammate, nhưng điều đó chỉ có nghĩa là teammate tái sử dụng một phần cấu hình trong định nghĩa đó. Tài liệu chính thức nêu rõ `tools` và `model` sẽ được áp dụng, nội dung thân định nghĩa sẽ được nối thêm vào system prompt của teammate; còn `skills` và `mcpServers` sẽ không có hiệu lực qua con đường này. `memory` trong ngữ cảnh teammate được xử lý ra sao thì tốt nhất nên kiểm chứng độc lập trên phiên bản hiện tại, đừng vội suy diễn rằng nó sẽ trở thành bộ nhớ dài hạn dùng chung cho cả nhóm.

Vì vậy mình sẽ tách biệt hai thứ này: Subagent Memory dùng để đúc kết kinh nghiệm dài hạn cho worker chuyên trách; Agent Teams dùng để cộng tác song song trong một lần thực thi tác vụ. Nếu muốn một vai trò trong nhóm mang theo kinh nghiệm dài hạn, hãy kiểm chứng xem lúc khởi động nó nạp gì, ghi vào đâu, có giữ được xuyên suốt qua các session hay không rồi hãy đưa vào quy trình chính thức.

## Plugin bộ nhớ bên thứ ba giải quyết vấn đề gì

Auto Memory tích hợp sẵn giúp Claude Code ghi nhớ sở thích, câu lệnh và kinh nghiệm dự án ngay trong các tệp cục bộ. Nó tiện lợi, nhưng không có ý định lưu trữ toàn bộ lịch sử hội thoại, cũng không hợp nhất lịch sử từ nhiều máy tính, nhiều lập trình viên, nhiều loại Agent vào một cổng tìm kiếm duy nhất.

Các plugin bên thứ ba ra đời chủ yếu để giải quyết hai khoảng trống này.

**[`claude-mem`](https://github.com/thedotmack/claude-mem) quan tâm đến tiến trình hội thoại.** Nó thông qua Lifecycle Hooks để ghi lại các quan sát hội thoại và công cụ, rồi giao cho Worker cục bộ xử lý.

Nó có các thành phần then chốt: Worker Service trên cổng mặc định `37777`, SQLite lưu trữ sessions / observations / summaries, cơ sở dữ liệu vector Chroma, skill `mem-search` và MCP Tools.

Giải pháp này phù hợp để xem lại tiến trình lịch sử, ví dụ: Lần trước vì sao lại tạm dừng merge module thanh toán?, Lệnh nào trước đây từng dùng để kiểm tra slow query?.

Cái giá phải trả cũng tăng theo: worker, database, index, quyền hạn đều phải bảo trì.

**[`memsearch`](https://github.com/zilliztech/memsearch) giống như một kho lưu trữ Memory Store bên ngoài.** Nó dùng Markdown theo ngày để lưu nội dung gốc, Milvus làm bộ nhớ đệm chỉ mục vector, khi truy xuất thì kết hợp vector ngữ nghĩa, BM25 và RRF.

Nó phù hợp cho các dự án đa công cụ, đa thành viên, chu kỳ dài, ví dụ Claude Code, OpenClaw, OpenCode, Codex CLI cùng dùng chung một bộ nhớ.

Phương án này nặng hơn rất nhiều so với Markdown cục bộ. Index, mô hình embedding, Milvus Lite hoặc Zilliz trên cloud, chiến lược đồng bộ, phân quyền dữ liệu đều phải có người phụ trách. Khi bộ nhớ mới chỉ có vài chục mục, thông thường chưa cần thiết phải nâng cấp lên tầng này.

**Nên lựa chọn thế nào?**

Dự án cá nhân muốn Claude nhớ lệnh test, thói quen commit và sở thích dự án: trước hết hãy dùng `CLAUDE.md` kết hợp Auto Memory. Cả nhóm chia sẻ quy tắc ổn định: đưa vào `CLAUDE.md`, `.claude/rules/` trong repository hoặc tài liệu chính thức để các thay đổi đều phải qua review.

Cần tự động lưu lại toàn bộ tiến trình hội thoại: hãy xem xét các giải pháp kết hợp Hooks với database cục bộ như `claude-mem`.

Nhiều Agent, nhiều máy tính, nhiều lập trình viên cùng chia sẻ bộ nhớ dài hạn: lúc đó mới cân nhắc `memsearch`, Mem0 hoặc tự dựng database riêng.

Còn BM25, tìm kiếm vector và reranker sẽ phát huy sức mạnh tốt nhất khi cần tra cứu hỗn hợp giữa hàng vạn tài liệu, ticket và trang Wiki.

## Cách xây dựng hệ thống bộ nhớ gọn nhẹ

Nếu bạn muốn xây dựng một hệ thống bộ nhớ gọn nhẹ cho nhóm của mình, trước tiên hãy xác định cấu trúc tệp và quy tắc ghi.

`CLAUDE.md` chỉ để những nội dung mà mỗi phiên làm việc bắt buộc phải biết, chẳng hạn lệnh test, quy chuẩn commit, thư mục cấm sửa. Các quy tắc liên quan đến thư mục hoặc loại tệp đừng tiếp tục nhét vào tệp này nữa, hãy đưa vào `.claude/rules/` rồi dùng `paths` để kiểm soát phạm vi tải.

Bộ nhớ dài hạn hãy tách riêng vào thư mục `memory/`. Giai đoạn đầu đừng chia quá vụn vặt, 4 nhóm là đủ: `user` lưu sở thích dài hạn của người dùng, `feedback` lưu các chỉnh sửa rõ ràng từ người dùng, `project` lưu quyết định theo giai đoạn và quy tắc đóng băng ngắn hạn, `reference` lưu lối vào tài liệu tham khảo. Trong mỗi topic file hãy ghi `created_at`, `updated_at`, lý do ghi nhận và phạm vi áp dụng; nội dung phụ thuộc vào trạng thái code hiện tại thì khi mở ra cần đối chiếu trước rồi mới sử dụng.

![Triển khai hệ thống bộ nhớ gọn nhẹ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/claude-code-lightweight-memory-system-a72a6152.webp)

Phiên bản này trước mắt có thể duy trì thủ công. Trông nó không quá bóng bẩy, nhưng dữ liệu rác ít, cả nhóm có thể review được, lỡ xóa nhầm cũng tìm lại được từ Git. Đợi đến khi mục lục thủ công thực sự làm chậm tiến độ làm việc, lúc đó bổ sung thêm tính năng tóm tắt tự động, tìm kiếm toàn văn hoặc tìm kiếm vector cũng chưa muộn.

Cấu trúc thư mục không cần thiết kế quá phức tạp ngay từ đầu. Chỉ cần mục lục, sở thích người dùng, phản hồi rõ ràng, quyết định dự án và lối vào tài liệu đều có vị trí riêng là đủ:

```text
memory/
├── MEMORY.md
├── feedback/
│   └── integration-test-real-mysql.md
├── project/
│   └── payment-freeze-before-2026-06-30.md
├── reference/
│   └── slow-query-wiki.md
└── user/
    └── backend-preferences.md
```

`MEMORY.md` không có nhiệm vụ giải thích ngọn ngành đầu đuôi, chỉ làm mục lục lối vào. Nó báo cho Claude biết hiện có những ký ức nào, và khi cần xem chi tiết thì nên mở tệp nào:

```markdown
# Memory Index

- [Integration tests use real MySQL](feedback/integration-test-real-mysql.md): Kiểm thử tích hợp liên quan đến cơ sở dữ liệu bắt buộc phải kết nối MySQL thật.
- [Payment freeze before 2026-06-30](project/payment-freeze-before-2026-06-30.md): Trước ngày 2026-06-30 tạm dừng merge yêu cầu mới vào module thanh toán.
- [Slow query wiki](reference/slow-query-wiki.md): Cổng điều tra slow query online nằm ở trang db-slow-log trên Wiki nội bộ.
```

Giải thích, bối cảnh và phạm vi áp dụng hãy để trong topic file. Nhờ đó `MEMORY.md` luôn giữ được độ ngắn gọn, thích hợp để thường trực; về sau muốn sửa, muốn xóa hay muốn review đều có thể xem trực tiếp qua diff của tệp tương ứng.

## Tổng kết

Bộ nhớ của Claude Code hoạt động được là nhờ các tệp bên ngoài, chỉ mục và quy tắc tải, chứ không phải mô hình tự lưu lịch sử trong đầu.

`CLAUDE.md` thích hợp để viết quy tắc ổn định, `.claude/rules/` thích hợp để viết quy tắc kích hoạt theo đường dẫn, Auto Memory thích hợp để lưu giữ sở thích và kinh nghiệm mà Claude phát hiện trong công việc. `MEMORY.md` đừng viết thành bài văn dài, chỉ làm mục lục là đủ; các chi tiết như lý do, phạm vi áp dụng, thời gian hết hạn hãy đưa vào topic file.

So với việc làm sao để tìm kiếm chính xác hơn, mình quan tâm nhiều hơn đến việc điều gì không nên ghi vào. Log tạm thời, số dòng tệp hiện tại, lỗi một lần, sở thích do Agent tự đoán hãy giữ lại trong context của lượt đó là đủ. Bộ nhớ dài hạn một khi đã ghi vào thì về sau bắt buộc phải có người đối chiếu, cập nhật và dọn dẹp.

Công cụ bên thứ ba chỉ bổ sung khi thực sự có nhu cầu, tuyệt đối đừng dùng chỉ để cho có, giữ được sự đơn giản luôn là tốt nhất. Muốn lưu lại toàn bộ tiến trình hội thoại thì `claude-mem` sát sườn hơn; muốn nhiều công cụ, nhiều thành viên dùng chung một bộ nhớ thì hãy xem xét `memsearch`, Mem0 hoặc tự dựng database. Khi bộ nhớ mới chỉ có vài chục mục, đừng vội vàng đưa database vector vào, chỉ mục tệp thông thường đã là quá đủ dùng.

Lời khuyên của mình rất đơn giản: Trước hết hãy viết thật rõ ràng `CLAUDE.md` và `.claude/rules/`, sau đó để Auto Memory hoặc thư mục `memory/` thủ công lưu lại một lượng nhỏ kinh nghiệm giá trị cao. Đợi khi bộ nhớ thực sự nhiều đến mức chỉ mục thủ công gánh không nổi, các vai trò cộng tác cũng trở nên phức tạp, lúc đó hãy cân nhắc database, BM25, tìm kiếm vector và reranker.

Bắt Agent phải ghi nhớ mọi thứ là điều vô nghĩa. Cách làm đáng tin cậy hơn nhiều là dạy nó biết bước tiếp theo nên đi đâu để kiểm chứng.

## Tài liệu tham khảo

- Tài liệu chính thức Claude Code: [How Claude remembers your project](https://code.claude.com/docs/en/memory)
- Tài liệu chính thức Claude Code: [Subagents](https://code.claude.com/docs/en/sub-agents)
- Tài liệu chính thức Claude Code: [Agent Teams](https://code.claude.com/docs/en/agent-teams)
- Tài liệu chính thức Claude Code: [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- GitHub: [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)
- MindStudio: [Claude Code Memory Systems Explained](https://www.mindstudio.ai/blog/claude-code-memory-systems-compared)
- Milvus: [Claude Code Memory System Explained: 4 Layers, 5 Limits, and a Fix](https://milvus.io/zh/blog/claude-code-memory-memsearch.md)
