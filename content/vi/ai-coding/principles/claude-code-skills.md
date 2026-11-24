---
title: "Chi tiết kỹ thuật và phương thức vận hành của Claude Code Skills"
description: "Đi từ cấu trúc tệp, cơ chế phát hiện và tải, Front Matter, context động, hạn chế an toàn đến cách phối hợp với Subagent, bài viết làm rõ cách Skills biến quy trình tái sử dụng thành năng lực Agent được tải theo nhu cầu."
category: Nguyên lý AI Coding
tag:
  - Claude Code
  - Skills
  - AI Agent
  - AI Coding
lang: vi
sourceRef: zh-ref/ai-coding/principles/claude-code-skills.md
head:
  - - meta
    - name: keywords
      content: Claude Code,Skills,Agent Skills,SKILL.md,Front Matter,Context động,Subagent,Plugin,AI Coding
---

Khá nhiều bạn đọc phản hồi rằng Skills hiện nay xuất hiện rất thường xuyên trong các buổi phỏng vấn, vì vậy sau hai bài viết trước, mình quyết định đào sâu thêm một bài viết toàn diện nữa.

Dưới đây là nội dung chi tiết.

Còn nhớ hồi mới bắt đầu dùng Claude Code, mình rất hay nhồi nhét đủ mọi loại quy tắc vào `CLAUDE.md`.

Phong cách viết code, quy ước thư mục, lệnh chạy test—những thứ này đưa vào thì hoàn toàn ổn. Nhưng về sau, các checklist kiểm tra code (code review), quy trình tóm tắt PR, các bước nghiệm thu UI cũng bắt đầu bị chất đống vào đó.

Thế là vấn đề nảy sinh.

Những quy trình này thực sự rất hữu ích, nhưng chúng không hề cần dùng trong mọi chu kỳ tác vụ. Mỗi lần hội thoại đều mang theo chúng sẽ làm tăng rất nhiều thông tin dư thừa, từ đó gây nhiễu cho việc phán đoán của mô hình.

Loại nội dung này không nên tiếp tục nhồi nhét vào `CLAUDE.md`. Nếu bạn luôn phải sao chép cùng một đoạn hướng dẫn, checklist hay quy trình nhiều bước vào cuộc hội thoại, hoặc nếu một mục nào đó trong `CLAUDE.md` đã dài như một cuốn cẩm nang hướng dẫn thao tác, thì đã đến lúc tách nó ra.

Sự khác biệt chủ yếu nằm ở phương thức tải. `CLAUDE.md` thường được tải vào phiên làm việc ngay từ đầu dưới dạng context cố định (persistent context); còn Skill thì bình thường chỉ để lộ tên và phần mô tả, chỉ khi nào thực sự được gọi trúng thì mới tải toàn bộ nội dung chi tiết. Các tài liệu tham khảo dài, danh sách kiểm tra, hướng dẫn script không cần phải chen chúc vào context ngay từ phút đầu tiên.

Bài viết này tập trung phân tích việc hiện thực hóa kỹ thuật và phương thức vận hành của Claude Code Skills. Mình sẽ tham khảo các tài liệu phân tích mã nguồn từ cộng đồng để đi sâu vào chi tiết triển khai, đồng thời đối chiếu cách dùng hiện tại theo sát tài liệu chính thức và changelog.

Nếu bạn muốn hiểu một cách hệ thống về sự khác biệt giữa Agent Skills với Prompt, MCP, Function Calling, bạn có thể xem bài viết trước của mình: [Agent Skills là gì? Khác gì so với Prompt và MCP?](https://javaguide.cn/ai/agent/skills.html). Nếu bạn quan tâm nhiều hơn đến việc có những Skill có sẵn nào đáng cài đặt, bạn có thể xem trực tiếp bài [Đề xuất các Skills thiết yếu cho AI Coding: TDD, Code Review, tự động hóa web và thực chiến MCP](https://javaguide.cn/ai-coding/programmer-essential-skills.html).

## Skills giải quyết vấn đề gì

Trước tiên hãy xem sự phân công giữa `CLAUDE.md` và Skill.

`CLAUDE.md` phù hợp để lưu trữ các sự thật dự án và quy tắc lâu dài cần dùng ở mọi lượt hội thoại, chẳng hạn như code style, quy ước thư mục, các lệnh thường dùng, giải thích kiến trúc.

Skill phù hợp để lưu trữ các quy trình có ngữ cảnh kích hoạt rõ ràng. Chúng cần được tái sử dụng, nhưng không cần phải khởi động theo mọi phiên làm việc.

Điển hình nhất là những thứ sau:

- Một bộ checklist review mã nguồn;
- Các bước điều tra và xử lý sự cố online;
- Một quy trình tạo tóm tắt PR;
- Một quy chuẩn thiết kế chỉ cần dùng khi sửa giao diện UI;
- Một quy trình TDD chỉ dùng đến khi viết kiểm thử.

Điểm chung của chúng là: các bước cố định, nội dung khá dài, nhưng chỉ xuất hiện trong những tác vụ cụ thể. Nếu tất cả đều viết vào `CLAUDE.md`, chi phí context lúc khởi động sẽ ngày càng phình to và nặng nề.

Bạn có thể hiểu Skill như một cuốn cẩm nang thao tác được mở ra theo nhu cầu: bình thường chỉ cần cho Claude biết mình có năng lực này, khi thực sự dùng đến mới lấy bản hướng dẫn đầy đủ ra.

![So sánh Skill với Prompt, MCP, Function Calling](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-prompt-function-calling-mcp-comparison-0566edb1.webp)

`CLAUDE.md` thì ngược lại. Tài liệu chính thức khuyến nghị nên dành nó cho những nội dung cần biết ở mọi lượt, chẳng hạn như lệnh build, quy ước dự án, cấu trúc thư mục và các quy tắc bắt buộc phải luôn tuân thủ.

Nếu một đoạn nội dung đã là quy trình nhiều bước, hoặc chỉ ảnh hưởng đến một phần cục bộ trong codebase, thì nó phù hợp hơn khi được chuyển sang Skill hoặc quy tắc giới hạn theo đường dẫn (path-scoped rule).

Khi thực sự bắt tay vào bóc tách trong dự án, mình thường không quá bận tâm về tên gọi trước, mà sẽ xem nội dung đó đang gặp vướng mắc ở đâu:

- Nếu vướng ở chỗ "quy tắc phải có hiệu lực ở mọi lượt", thì đó là việc của `CLAUDE.md`. Nếu vướng ở chỗ "một quy trình cứ bị sao chép lặp đi lặp lại", thì đó là việc của Skill.
- Nếu vướng ở chỗ "tác vụ quá dài, toàn bộ tiến trình sẽ chiếm dụng context của phiên chính", lúc đó mới cân nhắc đến Subagent. Nếu vướng ở chỗ "mọi người trong nhóm đều cần cài một bộ như nhau", lúc đó mới cân nhắc Plugin.

Bảng dưới đây tóm tắt các khái niệm vừa nêu:

| Cơ chế | Vấn đề chính cần giải quyết |
| ------ | --------------------------- |
| `CLAUDE.md` | Quy tắc dự án thường trực và các quy ước dài hạn |
| Skill | Quy trình và checklist chỉ dùng đến trong tác vụ cụ thể |
| Subagent | Ủy quyền tác vụ dài hoặc nhánh phụ cho một Agent khác |
| Plugin | Phân phối các năng lực mở rộng như Skills, Agents, Hooks, MCP |

Skill trong Claude Code có thể hiểu là "prompt-based command" (lệnh dựa trên prompt).

Phần lệnh tùy chỉnh (custom commands) hiện nay cũng đã được hợp nhất vào hệ thống Skills. Giờ đây cả `.claude/commands/deploy.md` và `.claude/skills/deploy/SKILL.md` đều có thể tạo ra `/deploy`; các thư mục cũ `.claude/commands/` không cần phải di chuyển ngay lập tức mà vẫn được tương thích.

Subagent giải quyết câu hỏi "ai làm"; Skill giải quyết câu hỏi "làm thế nào".

Plugin chịu trách nhiệm phân phối. Một Plugin có thể mang theo Skills, Agents, Hooks và MCP Servers. Nếu doanh nghiệp hoặc đội ngũ muốn phát hành năng lực một cách đồng bộ, Plugin sẽ phù hợp hơn nhiều so với việc đi sao chép từng tệp Skill riêng lẻ.

Nếu trong dự án đồng thời có `CLAUDE.md`, `AGENTS.md`, quy tắc cục bộ, SPEC và Skills, bạn cũng có thể chia theo tư duy này: quy tắc thường trực để ở tệp quy tắc, quy trình tái sử dụng giao cho Skill, còn tiêu chí nghiệm thu của tác vụ lần này thì đặt vào SPEC.

![Phân công giữa CLAUDE.md và các tệp quy tắc khác](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-rule-files-relationship-66d1a6af.png)

Nội dung thích hợp để chuyển thành Skill thường có các đặc điểm: hay tái sử dụng, có ngữ cảnh kích hoạt rõ ràng, các bước tương đối cố định, nội dung khá dài, không phù hợp để thường trực trong context, và tốt nhất là có thể đi kèm supporting files hoặc script (ví dụ `scripts/`, `references/`, `templates/`).

Review code, TDD, tóm tắt PR, kiểm tra thay đổi cơ sở dữ liệu, nghiệm thu UI, phân tích log đều thuộc nhóm tác vụ này.

Những thứ không thích hợp làm Skill là các quy tắc cứng nhắc bắt buộc phải tuân theo ở mọi lúc trong dự án. Ví dụ như "toàn bộ mã nguồn Java phải dùng Google Java Style", quy định kiểu này phù hợp hơn khi để ở `CLAUDE.md` hoặc quy tắc dự án.

Về giới thiệu chi tiết và best practices của `CLAUDE.md`, bạn có thể tham khảo bài viết của mình: [Best Practices cho CLAUDE.md: Nên viết gì, không nên viết gì và cách bóc tách khi dự án phình to](https://javaguide.cn/ai-coding/practices/claude-md-best-practices.html).

## Cách viết `SKILL.md`

Một Skill trên hệ thống tệp (filesystem Skill) thường có cấu trúc thư mục như sau:

```text
.claude/skills/
  pr-summary/
    SKILL.md
    scripts/
      collect-pr-info.sh
    references/
      review-checklist.md
```

`SKILL.md` bao gồm hai phần:

1. YAML frontmatter: Mô tả tên, điều kiện kích hoạt, quyền công cụ, mô hình, context thực thi và các metadata khác.
2. Markdown body: Hướng dẫn thao tác thực tế được gửi đến Claude.

Một ví dụ tối giản:

```md
---
name: pr-summary
description: Summarize a pull request and list key risks
allowed-tools: Bash(gh *)
---

Read the pull request diff and comments, then summarize:

1. Main changes
2. Risky files
3. Missing tests
4. Suggested follow-up
```

Khi bạn gõ lệnh `/pr-summary`, Claude Code sẽ render Skill này thành prompt rồi mới giao cho mô hình xử lý.

Hàm `parseSkillFrontmatterFields()` trong mã nguồn hỗ trợ khá nhiều trường, dưới đây là các trường phổ biến cần nắm:

| Trường | Tác dụng |
| ------ | -------- |
| `name` | Tên hiển thị; tên thư mục thường quyết định tên lệnh gọi |
| `description` | Để mô hình đánh giá khi nào nên sử dụng |
| `when_to_use` | Hướng dẫn chi tiết hơn về thời điểm kích hoạt |
| `allowed-tools` | Cấp phép trước các công cụ mà Skill này được quyền sử dụng |
| `model` | Chỉ định bí danh mô hình (model alias) |
| `effort` | Chỉ định cấp độ suy luận / nỗ lực (reasoning/effort level) |
| `user-invocable` | Có cho phép người dùng gọi trực tiếp qua `/skill-name` hay không |
| `disable-model-invocation` | Cấm mô hình tự động gọi, chỉ cho phép người dùng gọi thủ công |
| `paths` | Đường dẫn kích hoạt có điều kiện |
| `context` | Hỗ trợ `fork`, cho phép Skill chạy trong context của subagent |
| `agent` | Gắn với một Agent chỉ định |
| `shell` | Chỉ định lệnh context động sử dụng bash hay powershell |

Ở đây đừng vừa vào đã nhồi nhét tất cả các trường. Đa số Skill chỉ cần `description`, `allowed-tools` và phần hướng dẫn trong thân văn bản. Càng nhiều trường thì chi phí bảo trì càng cao.

Có một vài trường rất dễ gây nhầm lẫn:

| Trường | Phù hợp giải quyết vấn đề gì |
| ------ | ---------------------------- |
| `allowed-tools` | Thu hẹp phạm vi công cụ mà Skill hiện tại có thể dùng trực tiếp |
| `context: fork` | Cho phép quy trình dài, tác vụ khảo sát hoặc review chạy trong context fork |
| `agent` | Chỉ định Agent nào sẽ thực thi Skill này |

Ví dụ:

```yaml
context: fork
agent: Explore
allowed-tools: Bash(gh *)
```

Cấu hình kiểu này rất phù hợp cho các tác vụ như tóm tắt PR, review module, tổng hợp tài liệu. Phiên chính không nhất thiết phải gánh toàn bộ quy trình trung gian, chỉ cần nhận kết quả cuối cùng là đủ.

Skills cũng hỗ trợ thay thế tham số. Đơn giản nhất là `$ARGUMENTS`:

```md
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---

Fix GitHub issue $ARGUMENTS following our coding standards.
```

Khi thực thi:

```bash
/fix-issue 123
```

Trong nội dung Claude nhận được, `$ARGUMENTS` sẽ được thay thế bằng `123`.

Nếu muốn lấy tham số theo vị trí, bạn có thể dùng `$ARGUMENTS[0]`, hoặc viết tắt là `$0`:

```md
Migrate the $0 component from $1 to $2.
```

Khi thực thi:

```bash
/migrate-component SearchBar React Vue
```

`$0`, `$1`, `$2` sẽ lần lượt được thay thế bằng `SearchBar`, `React`, `Vue`.

## Cách Claude Code phát hiện Skills

Claude Code sẽ tải Skills từ nhiều nguồn khác nhau. Các vị trí phổ biến gồm có:

```text
~/.claude/skills/
.claude/skills/
```

Skills cấp người dùng (User-level Skills) được đặt trong `~/.claude/skills/`, áp dụng cho mọi dự án. Skills cấp dự án (Project-level Skills) được đặt trong `.claude/skills/` của dự án, thích hợp để chia sẻ cùng nhóm.

![Ví dụ thư mục .claude/skills trong dự án](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-project-skills-folder-31c3e95f.png)

Từ góc nhìn mã nguồn, thư mục Skills áp dụng cấu trúc:

```text
skill-name/SKILL.md
```

Điều này có nghĩa là, một tệp `.md` đơn lẻ đứng trực tiếp trong thư mục `/skills/` không phải là định dạng Skill tiêu chuẩn; bên trong thư mục con bắt buộc phải có `SKILL.md`.

Các nguồn Skill của Claude Code có thể chia thành các nhóm:

| Loại | Nguồn | Giải thích |
| ---- | ----- | ---------- |
| Skills cấp người dùng | `~/.claude/skills/` | Cá nhân tái sử dụng lâu dài |
| Skills cấp dự án | `.claude/skills/` | Chia sẻ cho dự án hoặc đội ngũ |
| Managed Skills | Thư mục chính sách quản trị | Do tổ chức phát hành tập trung |
| Bundled Skills | Tích hợp sẵn trong Claude Code | Ví dụ `/code-review`, `/debug`, `/loop`, v.v. |
| Plugin Skills | Do plugin cung cấp | Đi kèm theo việc cài đặt và kích hoạt plugin |
| MCP Skills | Khả năng ánh xạ từ MCP Server | Đến từ MCP Server |

Claude Code tích hợp một số bundled skills như `/code-review`, `/batch`, `/debug`, `/loop` và `/claude-api`. Chúng khác với các lệnh tích hợp sẵn thông thường, thuộc loại prompt-based skill.

![Mô tả Bundled skills trong tài liệu chính thức của Claude Code](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-bundled-skills-docs-d2142902.png)

Cũng cần chú ý đến các thư mục `.claude/skills` lồng nhau.

Từ bản v2.1.178 trở đi, thư mục `.claude/skills` lồng nhau cũng sẽ được tải khi thao tác trên các tệp tương ứng. Khi xảy ra xung đột tên gọi, Skill lồng nhau sẽ xuất hiện dưới dạng `<dir>:<name>`, tránh việc ghi đè lên Skill cùng tên ở tầng ngoài.

Điều này rất gần với tư duy của quy tắc dự án: **Cấu hình càng gần thư mục làm việc hiện tại thì càng thể hiện rõ context cục bộ.**

Dù vậy, bạn không nên lạm dụng Skills lồng nhau. Chỉ nên bóc tách khi thư mục con thực sự có quy trình làm việc độc lập, chẳng hạn:

- `frontend/.claude/skills/ui-review/SKILL.md`
- `backend/.claude/skills/api-contract-check/SKILL.md`
- `docs/.claude/skills/article-review/SKILL.md`

Nếu chỉ đơn thuần là để phân loại thì dùng thư mục và tên tệp thông thường là đủ.

Thư mục `.claude/commands/` kiểu cũ vẫn được tương thích. Trong mã nguồn cũng có bộ tải legacy commands: nếu trong thư mục lệnh cũ tồn tại `SKILL.md`, nó sẽ được xử lý theo cách của Skill; nếu không, nó tiếp tục được tải như một Markdown command.

Tài liệu chính thức nêu rõ: custom commands đã được hợp nhất vào Skills, nhưng các tệp `.claude/commands/` hiện có vẫn tiếp tục hoạt động. Khi viết năng lực mới, bạn nên dùng trực tiếp `.claude/skills/<name>/SKILL.md`.

## Điều gì xảy ra sau khi Skill được gọi

Bình thường, Skill sẽ không nhét toàn bộ nội dung chi tiết vào context.

Claude Code chủ yếu thông qua tên Skill, mô tả, thông tin frontmatter như `when_to_use` để mô hình biết có những năng lực nào khả dụng.

Trong mã nguồn còn có hàm `estimateSkillFrontmatterTokens()`, chỉ ước lượng token cho name, description, whenToUse, bởi vì toàn bộ nội dung chỉ được tải khi được gọi.

Khi người dùng thực thi `/skill-name`, hoặc khi mô hình đánh giá thấy một Skill nào đó phù hợp với tác vụ hiện tại, Claude Code mới gọi `getPromptForCommand()` để render phần thân (body) của Skill ra.

Đây cũng là lý do chính khiến Skills tiết kiệm context hơn rất nhiều so với một tệp `CLAUDE.md` quá dài.

![Chuỗi thực thi Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-agent-execution-link-4a51fe53.webp)

Sau khi Skill được gọi, Claude Code sẽ lấy nội dung Markdown body và tuần tự thực hiện các bước:

1. Mở rộng tham số, ví dụ `$ARGUMENTS`, `$0`.
2. Thay thế `${CLAUDE_SKILL_DIR}`.
3. Thay thế `${CLAUDE_SESSION_ID}`.
4. Nếu không phải nguồn từ MCP, thực thi tiếp các lệnh shell nhúng.
5. Trả về prompt hoàn chỉnh cho mô hình.

Triển khai tương ứng trong `createSkillCommand()` chính là `getPromptForCommand()`. Nó sẽ chờ đến khi thực sự được gọi mới xử lý, chứ không render sẵn tất cả các Skill trong giai đoạn khởi động.

Skill có thể mang theo supporting files, ví dụ như script, tài liệu tham khảo, template. Cấu trúc thư mục có thể là:

```text
my-skill/
  SKILL.md
  scripts/
  references/
  templates/
```

Nếu trong phần thân văn bản cần tham chiếu đến đường dẫn script, bạn có thể dùng `${CLAUDE_SKILL_DIR}`:

```md
Run this helper:

!`${CLAUDE_SKILL_DIR}/scripts/collect-context.sh`
```

Nhờ đó khi Skill di chuyển thư mục cũng không lo bị gãy đường dẫn.

Dù vậy, các tệp hỗ trợ không nên bị nhồi nhét toàn bộ vào phần thân. Cách viết tốt hơn là: chỉ dẫn cho Claude trong `SKILL.md` biết khi nào thì cần đọc tệp nào. Khi nào cần thì mới đọc, không cần thì đừng đưa vào context.

Đó chính là cơ chế tiết lộ tiệm tiến (progressive disclosure): trước hết cho mô hình biết "có năng lực này", khi gọi trúng mới đọc phần thân, trong phần thân chỉ để khung quy trình, còn tài liệu thực sự dài thì tiếp tục đưa vào supporting files.

![Tiết lộ tiệm tiến (Mô hình 3 tầng)](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-progressive-disclosure-three-layer-model-81f54306.png)

Vì vậy, `SKILL.md` không thích hợp để viết thành một bản README siêu dài. Phần thân nên ưu tiên viết: khi nào dùng, làm theo thứ tự nào, trường hợp nào không được làm, khi thất bại thì xử lý ra sao; các checklist dài, template và hướng dẫn script hãy đưa vào `references/`, `templates/`, `scripts/`.

![Nội dung SKILL.md tốt nhất nên kiểm soát dưới 500 dòng](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/keep-skill-md-content-under-500-lines-for-best-p-7c39bab2.png)

Sự khác biệt giữa `CLAUDE.md` và Skill cũng có thể hiểu từ chiến lược tải:

| Nội dung | Phù hợp để ở đâu |
| -------- | ---------------- |
| Quy chuẩn lập trình của dự án | `CLAUDE.md` |
| Giải thích cấu trúc thư mục | `CLAUDE.md` |
| Quy trình review code | Skill |
| Quy trình tóm tắt PR | Skill |
| Checklist nghiệm thu UI | Skill |
| Script điều tra sự cố online | Skill + supporting files |

Đừng xem Skill như một bản `CLAUDE.md` dài hơn. Giá trị của Skill nằm ở việc tải theo nhu cầu, chứ không phải là đổi sang một thư mục khác để tiếp tục chất đống quy tắc.

## Context động và hạn chế an toàn

Skills hỗ trợ cơ chế tiêm context động (dynamic context injection), cú pháp là:

```md
Trạng thái Git hiện tại:
!`git status --short`
```

Cũng hỗ trợ dưới dạng khối mã:

````md
```!
git log --oneline -5
```
````

Những lệnh này sẽ được thực thi trước khi nội dung Skill được gửi đến Claude. Đầu ra của lệnh sẽ thay thế vào vị trí giữ chỗ ban đầu, mô hình sẽ nhìn thấy kết quả cuối cùng chứ không nhìn thấy bản thân câu lệnh.

Tài liệu chính thức cũng nhấn mạnh: đây là bước tiền xử lý (preprocessing). Claude chỉ nhìn thấy prompt sau khi đã được render.

Điều này rất khác so với việc Claude chủ động gọi lệnh Bash.

Khi Claude gọi Bash, đó là quyết định của mô hình khi sử dụng công cụ trong vòng lặp agent loop. Nó sẽ tạo ra một lần gọi công cụ (tool call), và kết quả công cụ sẽ đi vào lịch sử hội thoại.

Các lệnh động trong Skill là bước tiền xử lý prompt. Lệnh chạy trước, đầu ra được nhét vào Skill prompt. Mô hình sẽ không nhìn thấy quá trình "tôi sắp thực thi câu lệnh này".

Nội dung thích hợp để đưa vào context động thường là các tác vụ thu thập context ổn định, chỉ đọc (read-only) và có rủi ro thấp, ví dụ:

- `git status --short`
- `git diff --name-only`
- `gh pr view --comments`
- Các script chỉ đọc có sẵn của dự án

Đừng bao giờ đưa các lệnh sửa đổi tệp, commit code, xóa tài nguyên vào context động. Context động chỉ có trách nhiệm "thu thập tài liệu", chứ không chịu trách nhiệm "thực thi thay đổi".

Skill có nguồn gốc từ MCP lại càng đặc biệt. Điều kiện kiểm tra trong mã nguồn là: chỉ khi `loadedFrom !== 'mcp'` thì mới thực thi shell nhúng.

MCP Skill đến từ MCP Server từ xa, không nhất thiết đáng tin cậy. Nếu cho phép máy chủ từ xa trả về một Skill chứa lệnh động rồi thực thi trên máy cục bộ, nó sẽ biến thành rủi ro thực thi mã từ xa (RCE).

Do đó, Skill từ nguồn MCP sẽ bỏ qua shell nhúng. Chỉ có Skill từ hệ thống tệp, dự án cục bộ hoặc nguồn đáng tin cậy mới được đi qua chuỗi tiền xử lý này.

Đồng thời, ngay cả với Skill cục bộ, lệnh trước khi thực thi cũng phải đi qua cùng một bộ kiểm tra quyền hạn công cụ. `allowed-tools` có thể nới lỏng một phần lệnh cho Skill hiện tại, nhưng không bao giờ là thực thi vô điều kiện.

Skill của bên thứ ba cũng phải được kiểm tra theo tư duy này. Trước khi cài đặt, tối thiểu hãy đọc qua một lượt `SKILL.md`, `scripts/`, `references/`, đảm bảo bên trong không có lệnh nguy hiểm, script bất thường hay cấp quyền quá rộng. Cài đặt Skill đồng nghĩa với việc giao một quy trình cho Agent thực thi; khi nguồn gốc chưa rõ ràng, đừng vội vàng đưa nó vào dự án.

Trong môi trường doanh nghiệp, tài liệu cấu hình chính thức có một mục liên quan đến quản trị: `strictPluginOnlyCustomization`.

Nó có thể giới hạn nguồn gốc của skills, agents, hooks, MCP servers. Ví dụ thiết lập:

```json
{
  "strictPluginOnlyCustomization": ["skills", "hooks"]
}
```

Sau khi bị khóa, các nguồn cấp người dùng và cấp dự án sẽ bị bỏ qua, chỉ tải những năng lực do plugin cung cấp, do managed settings chỉ định, hoặc năng lực tích hợp sẵn.

Cấu hình kiểu này rất phù hợp cho môi trường nhóm hoặc doanh nghiệp. Dự án cá nhân thường không dùng tới, nhưng nếu công ty muốn quản lý tập trung nguồn mở rộng của công cụ AI coding thì không thể chỉ dựa vào thỏa thuận miệng.

## Cách Skills phối hợp với Agent

Skill có thể chạy bên trong Subagent.

Tài liệu chính thức có hướng dẫn về "Run skills in a subagent", và frontmatter của Skill cũng hỗ trợ `context: fork` cùng `agent`.

Ví dụ, một Skill tóm tắt PR có thể để Explore agent chạy trong context fork:

```yaml
context: fork
agent: Explore
allowed-tools: Bash(gh *)
```

Như vậy phiên chính không cần tự mình gánh toàn bộ diff PR, bình luận và danh sách tệp, mà chỉ nhận kết quả tóm tắt.

`context: fork` phù hợp cho ba nhóm ngữ cảnh:

1. Quy trình của Skill rất dài;
2. Skill cần đọc rất nhiều tệp hoặc thông tin bên ngoài;
3. Phiên chính chỉ quan tâm đến kết quả, không quan tâm đến toàn bộ tiến trình trung gian.

Ví dụ như tạo bản tóm tắt rủi ro PR, thực hiện review chỉ đọc cho một module, tổng hợp tài liệu và issue, tạo kế hoạch di chuyển dữ liệu (migration plan), đều có thể cân nhắc fork.

Những tác vụ không thích hợp đưa vào fork là các tác vụ bắt buộc phải tương tác liên tục với phiên chính. Ví dụ bạn đang chỉnh sửa thủ công một thiết kế cốt lõi và mỗi bước của Skill đều cần bạn xác nhận, thì đừng fork nó ra ngoài.

Agent Teams cũng mang lại chi phí context phát sinh. Tài liệu chi phí chính thức đã cảnh báo: các đồng đội (teammates) sẽ tự động tải `CLAUDE.md`, MCP servers và Skills. Nói cách khác, Agent Teams không chỉ đơn giản là thêm vài prompt, mà mỗi teammate đều có chi phí khởi động riêng của mình.

Điều này không có nghĩa là bạn không nên dùng Skills, mà là bạn cần kiểm soát phần mô tả Skill và phạm vi kích hoạt:

- Viết `description` rõ ràng, tránh để mô hình kích hoạt nhầm;
- Đưa nội dung dài vào supporting files, đừng nhồi hết vào `SKILL.md`;
- Dùng `disable-model-invocation` để giới hạn các Skill chỉ cho phép gọi thủ công;
- Trong các dự án nhóm lớn, dùng `strictPluginOnlyCustomization` để kiểm soát nguồn gốc.

Mục tiêu thiết kế của Skill là tải theo nhu cầu. Nếu mô tả quá chung chung, kích hoạt quá thường xuyên, nó sẽ từ chỗ "tiết kiệm context" biến thành "gánh nặng chi phí".

Trong dự án thực tế, mình thường chia theo quy tắc sau:

| Nội dung | Đặt ở đâu |
| -------- | --------- |
| Quy tắc phải tuân thủ ở mọi lượt | `CLAUDE.md` |
| Quy tắc chỉ có hiệu lực ở đường dẫn cụ thể | `.claude/rules/` hoặc Skill có gắn `paths` |
| Quy trình thao tác có thể tái sử dụng | Skill |
| Tài liệu tham khảo dài | Skill supporting files |
| Nhánh tìm kiếm, review, kiểm chứng | Subagent |
| Tác vụ cộng tác nhiều vai trò | Agent Teams |

Lấy một ví dụ: Bạn muốn refactor một API backend.

`CLAUDE.md` chứa quy chuẩn lập trình và lệnh chạy test của dự án; Skill `api-contract-check` chứa quy trình kiểm tra tính tương thích của API; Skill `code-review` chứa checklist review; việc tìm kiếm các bên gọi cũ giao cho Subagent; nếu frontend, backend, test cần triển khai song song thì mới cân nhắc dùng Agent Teams.

Lợi ích của việc phân tách này là quy tắc, quy trình và người thực thi đều rõ ràng. Đừng nhét tất cả vào phiên chính, cũng đừng tùy tiện mở Agent khắp nơi chỉ để trông có vẻ cao cấp.

## Tổng kết

Mình thích xem Skill như một **cuốn cẩm nang thao tác tải theo nhu cầu**.

Những gì phải tuân thủ ở mọi lượt, tiếp tục để ở tệp quy tắc; quy trình chỉ dùng đến trong tác vụ cụ thể, hãy tách thành Skill; checklist dài, template và hướng dẫn script trong quy trình, tiếp tục bóc tách ra supporting files.

Tiêu chuẩn đánh giá cũng rất đơn giản: Nếu bạn đã bắt đầu sao chép lặp đi lặp lại cùng một đoạn prompt, hoặc nếu một mục nào đó trong `CLAUDE.md` dài đến mức đọc như sách hướng dẫn, thì khả năng rất cao là nó nên biến thành Skill.

Ngược lại, nếu chỉ là phong cách code, lệnh test, quy ước thư mục—những quy tắc cứng bắt buộc phải tuân theo ở mọi lượt—thì đừng viết Skill chỉ vì muốn dùng Skill. Đặt chúng trong `CLAUDE.md` sẽ trực tiếp và hiệu quả hơn nhiều.
