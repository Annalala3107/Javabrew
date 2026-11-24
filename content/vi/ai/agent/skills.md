---
title: Agent Skills là gì? Khác gì so với Prompt và MCP?
description: Góc nhìn kỹ thuật về Agent Skills, mối liên hệ và ranh giới giữa nó với Prompt, Function Calling, MCP, cách viết SKILL.md chuẩn xác, thiết kế nạp lười (lazy loading) và tiết lộ lũy tiến (progressive disclosure), cùng những cạm bẫy dễ mắc phải nhất.
category: Phát triển ứng dụng AI
lang: vi
sourceRef: zh-ref/ai/agent/skills.md
head:
  - - meta
    - name: keywords
      content: Agent Skills,MCP,Function Calling,Prompt,AI Agent,Lazy Loading,Context Injection,SKILL.md
---

Một lần Code Review có thể phải xem xét kiến trúc, bảo mật, hiệu năng và các quy ước của dự án. Nếu tạm thời đưa tất cả các quy tắc này vào Prompt, khi đổi sang một phiên hội thoại (session) khác bạn lại phải copy-paste lại từ đầu.

Các quy ước chung toàn dự án có thể lưu trong `AGENTS.md`; còn thứ tự kiểm tra, các đầu mục checklist và tài liệu tham khảo cho việc Review nên được nạp đi kèm với tác vụ Review đó. Skill cung cấp một điểm truy cập độc lập cho phần nội dung chuyên biệt này.

## Agent Skills là gì?

Skill là các chỉ dẫn thao tác tác vụ mà Agent có thể khám phá (discover) và đọc theo nhu cầu (on demand). Định dạng trả về của interface, các trường log, lộ trình điều tra slow SQL, thứ tự trọng tâm khi Review code đều có thể được viết vào `SKILL.md`.

Bản thân Skill không trực tiếp cung cấp năng lực công cụ (tool capability). Nó giải quyết câu hỏi: "Loại tác vụ này cần được thực hiện theo quy tắc và quy trình nào", và hệ thống máy chủ (host) sẽ chuyển chỉ dẫn tương ứng cho Agent khi tác vụ được kích hoạt.

## Skill có mối liên hệ gì với Prompt, MCP và Function Calling?

Chúng nằm ở các vị trí khác nhau trên cùng một chuỗi thực thi: Prompt nêu rõ người dùng muốn làm gì, Function Calling khởi tạo hành động, MCP kết nối các năng lực bên ngoài, còn Skill quy định quy trình và các ràng buộc được áp dụng để hoàn thành tác vụ.

Lấy yêu cầu "hãy phân tích giúp tôi bản báo cáo này" làm ví dụ: câu nói của người dùng chính là **Prompt**. Khi mô hình quyết định gọi `read_file` và sinh ra các tham số có cấu trúc, nó đang sử dụng **Function Calling**; nếu `read_file` do một MCP Server cung cấp, thì **MCP** chịu trách nhiệm về kết nối và giao thức truyền tải.

Trong khi đó, yêu cầu "xác nhận ý nghĩa các trường trước, sau đó tìm giá trị bất thường, cuối cùng đưa ra kết luận nghiệp vụ, không được chỉ liệt kê các chỉ số thống kê đơn thuần" thuộc về phạm trù của **Skill**. Nó mô tả trình tự xử lý và các ràng buộc, chứ không thay thế cho yêu cầu ban đầu, cách thức gọi hay kết nối bên ngoài.

![So sánh giữa Skill, Prompt, Function Calling và MCP](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-prompt-function-calling-mcp-comparison-0566edb1.webp)

Đặt vào trong một chuỗi thực thi thực tế, quy trình sẽ diễn ra như sau:

![Chuỗi thực thi của Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-agent-execution-link-4a51fe53.webp)

1. Người dùng đưa ra tác vụ (Prompt)
2. Host đưa mô tả ngắn gọn về các Skill khả dụng vào ngữ cảnh (Skill Metadata)
3. Mô hình nhận định tác vụ hiện tại khớp với một Skill cụ thể (Skill Routing)
4. Host nạp nội dung đầy đủ của `SKILL.md` vào ngữ cảnh (Nạp lười - Lazy Loading)
5. Mô hình làm theo quy trình trong Skill để gọi công cụ, đọc tài liệu, ghi kết quả (Thực thi)

Công cụ không phải là phần bắt buộc của Skill. Skill Code Review Expert trong [sanyuan-skills](https://github.com/sanyuan0704/sanyuan-skills) chỉ quy định việc review code theo các chiều SOLID, bảo mật, hiệu năng; trong khi TDD Skill của [Superpowers](https://github.com/obra/superpowers) lại yêu cầu Agent phải chạy test, đọc output rồi mới quyết định bước tiếp theo.

Vì vậy, Function Calling là năng lực có thể dùng đến khi thực hiện hành động, còn Skill gần với một lần **tiêm ngữ cảnh (context injection)** theo nhu cầu. `load_skill()` cũng là một khái niệm mang ý nghĩa này, chứ không phải một tên API chuẩn hóa xuyên nền tảng; cách khám phá và nạp Skill của Claude Code, Cursor, Codex, Copilot đều có sự khác biệt.

## ⭐️ SKILL.md thực sự được viết như thế nào?

### Cấu trúc cơ bản

Một Skill khả dụng tối thiểu thực ra rất đơn giản: chỉ gồm một thư mục và một file Markdown có tên `SKILL.md`.

Các thư mục như `scripts/`, `references/`, `assets/` không bắt buộc, nhưng các Skill phức tạp thường dùng đến chúng — ví dụ đặt các script tiện ích mà Skill cần dùng vào thư mục `scripts/`.

```text
skill-name/
├── SKILL.md          # File chính, được nạp khi kích hoạt
├── scripts/          # Script tiện ích (thực thi, không cần nạp vào ngữ cảnh)
├── references/       # Tài liệu tham khảo (nạp theo nhu cầu)
└── assets/           # Template và file tĩnh (nạp theo nhu cầu)
```

Một file `SKILL.md` bao gồm hai phần:

1. Phần đầu là **Metadata YAML (Frontmatter)**, báo cho host biết "tôi là ai, khi nào nên dùng tôi";
2. Phần sau là **Nội dung chính (Body)**, viết chi tiết về quy trình, ràng buộc, ví dụ và cách xử lý khi thất bại.

Để học cách viết Skill chuẩn mực, cách tốt nhất là tham khảo trực tiếp các Skill mã nguồn mở hàng đầu.

Ở đây chúng ta lấy [TDD Skill của Superpowers](https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md) làm ví dụ.

Metadata của nó chỉ vỏn vẹn hai dòng:

```yaml
---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---
```

TDD liên quan đến chu trình Red-Green-Refactor, nhưng phần description của TDD Skill này hoàn toàn không nhắc tới điều đó; nó chỉ nói đúng một câu rõ ràng về thời điểm nên dùng. Phần nội dung chính mới đi sâu vào cách làm cụ thể, bản rút gọn như sau:

```markdown
# TDD

## Rule

Write a failing test before production code.

If you did not watch the test fail, the test is not trusted.

## Flow

1. **RED**: Write one small failing test.
2. **VERIFY RED**: Run it. Confirm it fails for the expected reason.
3. **GREEN**: Write the smallest code to pass.
4. **REFACTOR**: Clean up without changing behavior.

## Use For

- Features
- Bug fixes
- Refactoring
- Behavior changes

## Ask Before Skipping

- Throwaway prototypes
- Generated code

## Done Checklist

- [ ] Test written first
- [ ] Failure observed
- [ ] Minimal code added
- [ ] Tests pass
```

### Xem qua skill-creator chính thức trước

[`skill-creator`](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) là Skill do kho lưu trữ Skills chính thức của Anthropic cung cấp nhằm phục vụ việc tạo Skill mới. Nó yêu cầu Agent trước hết phải xác nhận rõ tác vụ, điều kiện kích hoạt và ranh giới, sau đó mới quyết định nội dung nào giữ lại trong `SKILL.md`, nội dung nào tách ra `scripts/` hoặc `references/`.

Nó phản ánh hai sự đánh đổi thực tế: `description` phải giúp host nhận diện chính xác tác vụ phù hợp; các bước có thể thực thi ổn định bằng script và các tài liệu dài chỉ cần trong trường hợp cụ thể nên được tách ra khỏi file chính. Tài liệu hướng dẫn chính thức của Claude cũng khuyến nghị nên truy cập các nội dung bổ trợ này theo nhu cầu.

### Metadata (Frontmatter)

Metadata quyết định Skill có thể được khám phá và kích hoạt chính xác hay không. Thông thường, ít nhất phải viết rõ ràng hai trường: `name` và `description`.

`name` là định danh của Skill, chủ yếu dùng cho hệ thống và con người định vị; `description` đóng vai trò như chỉ dẫn định tuyến (routing), báo cho Agent biết khi nào nên nạp Skill này vào ngữ cảnh — tức là khi nào thì dùng.

Trước tiên xem xét trường `name`. Nó có một số yêu cầu bắt buộc:

- Tối đa 64 ký tự
- Chỉ chứa chữ cái viết thường, số và dấu gạch nối (`-`)
- Không chứa thẻ XML
- Không chứa các từ khóa bảo lưu như `anthropic`, `claude`

Khi đặt tên, nên ưu tiên dạng danh động từ (động từ + `-ing`). Như vậy nhìn qua là biết ngay Skill này cung cấp năng lực gì.

| **Tên tốt** | **Tên không tốt** |
| --- | --- |
| `processing-pdfs` | `helper`, `utils` (quá mơ hồ) |
| `reviewing-code` | `documents` (quá chung chung) |
| `test-driven-development` | `tools` (không nói lên điều gì) |
| `analyzing-spreadsheets` | `anthropic-helper` (chứa từ khóa bảo lưu) |

Trường `description` còn quan trọng hơn. Nếu `description` viết không chuẩn, Skill sẽ không thể được gọi đúng lúc cần. Rốt cuộc, Agent không đọc trước toàn bộ file `SKILL.md` của từng Skill, mà chỉ nhìn vào mô tả để đánh giá xem có nên nạp hay không.

Phần mô tả của `description` không nên quá ngắn gọn, cũng không nên quá dài dòng. Một `description` hiệu quả chỉ cần nêu rõ hai điều:

1. Skill này làm được việc gì
2. Trong ngữ cảnh/tình huống nào thì cần dùng đến nó

TDD Skill của Superpowers mà chúng ta đã xem ở trên đáp ứng rất tốt yêu cầu này.

Tốt nhất nên đính kèm thêm một số từ khóa mà người dùng có khả năng nhắc tới, ví dụ như PDF, biểu mẫu, trích xuất, commit message, git diff... Nhờ đó, dù là so khớp quy tắc hay tìm kiếm ngữ nghĩa, hệ thống đều dễ dàng bắt trúng hơn.

```yaml
# ✓ Tốt: Có năng lực, có ngữ cảnh, có từ khóa kích hoạt
description: Trích xuất văn bản và bảng biểu từ file PDF, điền biểu mẫu, gộp tài liệu. Sử dụng khi xử lý file PDF hoặc khi người dùng đề cập đến PDF, biểu mẫu, trích xuất tài liệu.

# ✗ Nên tránh: Dùng ngôi thứ nhất + điều kiện kích hoạt không rõ
description: Tôi có thể giúp bạn xử lý file PDF

# ✗ Nên tránh: Chỉ viết năng lực, không viết khi nào dùng
description: Xử lý file Excel
```

Xem một số ví dụ thực tế:

```yaml
# TDD của Superpowers
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code

# Code Review Expert của sanyuan-skills
name: code-review-expert
description: Expert code review of current git changes with a senior engineer lens. Detects SOLID violations, security risks, and proposes actionable improvements.

# Trợ lý commit Git
description: Tạo commit message mang tính mô tả thông qua việc phân tích git diff. Sử dụng khi người dùng yêu cầu trợ giúp viết commit message hoặc xem lại các thay đổi đã staged.
```

Ngược lại, các `description` chỉ viết khái niệm, phạm vi quá rộng hoặc thiếu điều kiện kích hoạt:

```yaml
# Phản ví dụ TDD của Superpowers: chỉ viết khái niệm, không viết thời điểm kích hoạt
name: test-driven-development
description: Helps with test-driven development and writing better tests.

# Phản ví dụ Code Review Expert: quá chung chung
name: code-review-expert
description: Helps review code and improve quality.

# Phản ví dụ Trợ lý commit Git: chỉ viết tên chức năng
description: Tạo commit message.
```

### Nội dung chính (Body)

Nội dung chính là chỉ dẫn thao tác mà Agent chỉ đọc sau khi đã khớp trúng Skill. Ở giai đoạn khởi động, thông thường chỉ có `name` và `description` tham gia vào quá trình routing; khi nội dung chính được nạp vào, nó sẽ dùng chung không gian context với system prompt, yêu cầu người dùng và các tài liệu sẵn có.

Do đó, nội dung chính chỉ nên giữ lại phương án mặc định, quy ước dự án, đầu vào/đầu ra và cách xử lý lỗi cần thiết cho quá trình thực thi tác vụ. Nếu giấu quy tắc trong những đoạn văn giải thích dài dòng, Agent khi cần sẽ càng khó tìm thấy.

![Tại sao ngữ cảnh lại bị suy giảm](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-does-the-following-content-fail-7c336a26.png)

Khi chắt lọc nội dung chính, hãy lần lượt tự hỏi:

- Agent có thực sự cần lời giải thích này không?
- Đây là kiến thức nội bộ của dự án hay kiến thức phổ thông đại trà?
- Đoạn văn này có xứng đáng chiếm dụng context token không?

Khi xử lý văn bản PDF, nội dung chính nên đưa thẳng thư viện mặc định và cú pháp gọi:

````markdown
## Trích xuất văn bản PDF

Sử dụng pdfplumber để trích xuất văn bản:

```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

Nội dung chính mở đầu bằng định nghĩa PDF và liệt kê hàng loạt công cụ sẽ không giúp ích gì cho bước tiếp theo của Agent:

```markdown
## Trích xuất văn bản PDF

PDF (Portable Document Format) là một định dạng file phổ biến, thường chứa văn bản, hình ảnh và các nội dung khác.
Nếu muốn trích xuất văn bản từ PDF, bạn cần sử dụng thư viện xử lý PDF chuyên dụng.
Hiện có rất nhiều thư viện làm được việc này, ví dụ như pypdf, pdfplumber, PyMuPDF, v.v.
Ở đây khuyến nghị dùng pdfplumber vì nó tương đối dễ tiếp cận, cũng bao quát được phần lớn trường hợp trích xuất văn bản PDF thông thường.
Trước tiên, bạn cần dùng pip để cài đặt, sau đó viết đoạn code dưới đây...
```

Thứ Agent cần là: mặc định dùng cái gì, gọi ra sao, xử lý output thế nào, và khi gặp tình huống đặc biệt thì rẽ nhánh ra sao. Những ràng buộc mang tính nội bộ dự án mà không thể suy ra từ kiến thức chung cần được viết thật rõ ràng, ví dụ:

```markdown
Bảng users sử dụng soft delete. Mọi câu query chính thức bắt buộc phải thêm `WHERE deleted_at IS NULL`.
```

Ràng buộc này sẽ trực tiếp thay đổi kết quả query; còn định nghĩa chung về soft delete thì không cần thiết phải đưa vào Skill:

```markdown
Soft delete là một phương thức xóa dữ liệu phổ biến, thường không xóa thực sự bản ghi trong database, mà đánh dấu trạng thái bản ghi qua một trường dữ liệu.
```

Khi file chính quá dài, hãy tách những nội dung chỉ dùng ở các bước cụ thể ra file riêng. Anthropic khuyến nghị nên giữ phần thân của `SKILL.md` trong phạm vi 500 dòng, thông qua cơ chế tiết lộ lũy tiến (progressive disclosure) để đọc chi tiết theo nhu cầu.

![Nội dung SKILL.md tốt nhất nên kiểm soát trong vòng 500 dòng](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/keep-skill-md-content-under-500-lines-for-best-p-7c39bab2.png)

Ví dụ, file chính của một Skill Code Review chỉ cần chỉ ra khi nào thì đọc danh mục kiểm tra SOLID:

```markdown
Khi cần kiểm tra thiết kế SOLID, hãy đọc `references/solid-checklist.md`.
```

`references/solid-checklist.md` sẽ lưu checklist cụ thể; khi tác vụ không liên quan đến kiểm tra thiết kế, Agent không cần nạp file này.

Các bộ Skill mã nguồn mở sau đây thể hiện rõ cách phân tách giữa file chính và tài liệu tham khảo:

- [Superpowers](https://github.com/obra/superpowers): Chứa các Skill về TDD, brainstorming, code review... Cấu trúc của TDD rất mạch lạc, rất thích hợp để học hỏi cách tổ chức nội dung chính.
- [sanyuan-skills](https://github.com/sanyuan0704/sanyuan-skills): Code Review Expert tách các mục kiểm tra chi tiết vào `references/`, file chính chỉ giữ lại chỉ dẫn kích hoạt và nạp tài liệu, rất hợp làm ví dụ về tiết lộ lũy tiến.
- [Kho Skills chính thức của Anthropic](https://github.com/anthropics/skills): Cấu trúc thư mục và cách viết có thể làm tài liệu tham chiếu chuẩn mực.

![Tìm kiếm các Skill phổ biến và cần thiết](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skillssh-b38444cf.png)

![Các Skill tích hợp sẵn trong Superpowers](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/superpowers-skills-500a76a6.png)

Trong các công cụ như Claude Code, bạn có thể chủ động gọi qua cú pháp `/skill-name`, hoặc để mô hình tự lựa chọn theo tác vụ; sau khi kích hoạt mới đọc quy trình, ràng buộc, script và file tham khảo.

## Kiểm soát mức độ tự do (Degree of Freedom) như thế nào?

Database migration và deploy production đòi hỏi phải cố định lệnh, tham số, kiểm chứng và điều kiện rollback ngay trong Skill; sai sót ở các thao tác này thường đòi hỏi phải khôi phục dữ liệu hoặc trạng thái dịch vụ.

Ngược lại, việc review code và đánh giá giải pháp kỹ thuật cần dựa trên nội dung thay đổi để phán đoán. Skill chỉ cần cố định các chiều kiểm tra như bảo mật, hiệu năng, khả năng bảo trì và quy ước dự án, chứ không cần chỉ định cứng nhắc thứ tự kiểm tra cho từng file.

Bảng dưới đây phân loại mức độ tự do theo rủi ro tác vụ:

| **Mức độ tự do** | **Kịch bản phù hợp** | **Cách viết** |
| --- | --- | --- |
| Cao | Cần phán đoán và đánh đổi, không có đáp án duy nhất | Đưa ra hướng kiểm tra, không hardcode các bước |
| Trung bình | Có template cố định, nhưng cho phép điều chỉnh theo ngữ cảnh | Đưa ra template, tham số và ranh giới |
| Thấp | Thao tác nhạy cảm, cái giá phải trả khi sai sót rất đắt | Đưa ra lệnh chính xác, chỉ rõ điều gì không được sửa |

TDD Skill của Superpowers cố định trình tự quy trình:

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Red, Green, Refactor không thể đảo lộn; trước khi hiện thực hóa code bắt buộc phải thấy lỗi test như kỳ vọng. Skill này còn viết rõ:

```text
Write code before the test? Delete it. Start over.
```

Còn đối tượng test, tên gọi và assertion cụ thể sẽ do tính năng hiện tại quyết định. Khung kiểm tra của Code Review cũng có thể cố định theo SOLID, rủi ro bảo mật, hiệu năng và khả năng bảo trì, còn vấn đề cụ thể vẫn do Agent phán đoán dựa trên diff.

Cách viết mức độ tự do thấp có thể như sau:

````markdown
## Database Migration

Chạy dòng lệnh dưới đây:

```bash
python scripts/migrate.py --verify --backup
```

Không sửa đổi câu lệnh, không thêm tham số phụ.

Nếu lệnh thất bại, dừng thực thi ngay lập tức và trả lại output báo lỗi cho người dùng.
````

Các tác vụ như review code có thể chỉ cần đưa ra phạm vi kiểm tra:

```markdown
## Code Review

Trọng tâm kiểm tra:

1. Có bug rõ ràng hoặc bỏ sót trường hợp biên (edge case) hay không
2. Có tồn tại rủi ro bảo mật hay không
3. Có ảnh hưởng đến hiệu năng hoặc mức độ sử dụng tài nguyên hay không
4. Có vi phạm các quy ước sẵn có của dự án hay không
5. Có cách triển khai nào đơn giản hơn không

Khi xuất kết quả, ưu tiên nêu các vấn đề ảnh hưởng đến tính đúng đắn và độ ổn định của hệ thống production, tránh chỉ tập trung vào các góp ý định dạng thẩm mỹ thuần túy.
```

Ở đây không chỉ định thứ tự đọc file, nhưng đã giới hạn phạm vi review và trọng tâm đầu ra. Khi sửa dữ liệu, gửi request, deploy, migrate hoặc xóa file, hãy siết chặt mức độ tự do; đối với phân tích, đánh giá, tóm tắt và tạo bản thảo thì giữ lại không gian phán đoán.

## ⭐️ Nạp lười và Tiết lộ lũy tiến

![Tiết lộ lũy tiến của Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-progressive-disclosure-a73e1cfe.webp)

### Tại sao không thể nhồi nhét tất cả Skill vào cùng một lúc?

Context window của Agent là có hạn, ít nhất là tại thời điểm hiện tại.

Hơn nữa, context window lớn hơn chỉ có nghĩa là nó chứa được nhiều nội dung hơn, chứ không đồng nghĩa với việc nó tự biết cách lọc ra trọng tâm. Ví dụ khi bạn đưa cho nó một tài liệu yêu cầu dài, điều kiện ràng buộc thực sự cốt lõi có thể chỉ vỏn vẹn ba câu, nhưng nằm xen lẫn giữa muôn vàn thông tin nền và giải thích phụ trợ, mô hình rất dễ bỏ qua những câu then chốt ở giữa đó.

Đó chính là hiện tượng **Context Rot** (ngữ cảnh bị thối rữa/suy giảm) mà mọi người thường nhắc tới. **Ngữ cảnh càng dài, thông tin càng tạp, độ ổn định của mô hình khi tận dụng ngữ cảnh càng có xu hướng suy giảm.**

Hiện tượng **Lost in the Middle** chỉ việc mô hình dễ bỏ quên các thông tin nằm ở đoạn giữa của ngữ cảnh (giải thích chi tiết xem tại [Tại sao ngữ cảnh lại bị suy giảm](./context-engineering.md#tai-sao-ngu-canh-lai-bi-suy-giam)).

Do đó, Skill không nên bị viết thành một kho lưu trữ tài liệu bách khoa toàn thư.

Cách tiếp cận tốt hơn là tiết lộ lũy tiến (progressive disclosure): **đầu tiên cung cấp cho mô hình một danh mục gọn nhẹ, thực sự cần dùng đến phần nào mới đi nạp phần đó.**

![Tiết lộ lũy tiến](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-progressive-disclosure-81bef310.svg)

Nó giống hệt việc tra cứu sách. Bạn sẽ không học thuộc lòng cả cuốn sách trước, mà sẽ xem mục lục, xác định chương cần tìm, rồi mới lật đúng đến trang đó.

Quy trình này thường chia làm ba tầng:

![Tiết lộ lũy tiến (Mô hình 3 tầng)](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-progressive-disclosure-three-layer-model-81f54306.png)

**1. Tầng quảng bá: Báo cho mô hình biết có sự tồn tại của Skill**

Khi khởi động, hệ thống thường chỉ nạp metadata của Skill, như `name` và `description`. Phần này rất ngắn, dùng để nói cho mô hình: tôi là ai, tôi phù hợp với tình huống nào.

**2. Tầng chỉ thị: Đọc nội dung chính sau khi đã khớp trúng**

Chỉ khi Agent nhận định tác vụ hiện tại thực sự liên quan, nó mới đọc nội dung chính của `SKILL.md` tương ứng. Nội dung chính chứa quy trình, quy tắc, ranh giới và các ví dụ cốt lõi. Đoạn này không nên viết quá dài, Anthropic khuyến nghị phần thân nên kiểm soát trong vòng 500 dòng.

**3. Tầng tài nguyên: Đọc chi tiết trong quá trình thực thi**

Nếu trong nội dung chính có dẫn chiếu đến các file như `references/`, `scripts/`, Agent mới đọc hoặc thực thi theo nhu cầu. Ví dụ nếu chỉ chạy script, thông thường chỉ cần đưa output của script vào context; nếu cần đọc hoặc chỉnh sửa script thì mã nguồn mới cần đưa vào context.

Vì vậy bạn sẽ rất thường gặp cách viết như sau:

```markdown
## Tính năng nâng cao

**Điền biểu mẫu**: Hướng dẫn đầy đủ vui lòng tham khảo [FORMS.md](FORMS.md)

**API Reference**: Toàn bộ các phương thức vui lòng tham khảo [REFERENCE.md](REFERENCE.md)
```

Khi tác vụ khớp với việc điền biểu mẫu, Agent mới đọc `FORMS.md`; việc trích xuất văn bản thông thường không cần phải nạp file đó.

### Trong dự án thực tế tổ chức file như thế nào?

Lấy một Skill dạng phân tích dữ liệu làm ví dụ, cấu trúc có thể tách như sau:

```text
bigquery-analysis/
├── SKILL.md              # Tổng quan và điều hướng, nạp khi khớp
└── reference/
    ├── finance.md        # Doanh thu, ARR, chỉ số thanh toán
    ├── sales.md          # Cơ hội, pipeline, tài khoản
    ├── product.md        # Mức sử dụng API, adoption tính năng
    └── marketing.md      # Chiến dịch, attribution, email
```

File chính chỉ liệt kê các dataset khả dụng và tài liệu tương ứng, định nghĩa chi tiết được giữ trong từng file tham khảo:

```markdown
# Phân tích dữ liệu BigQuery

## Các bộ dữ liệu khả dụng

**Tài chính**: Doanh thu, ARR, thanh toán → Xem [reference/finance.md](reference/finance.md)

**Bán hàng**: Cơ hội, pipeline, tài khoản → Xem [reference/sales.md](reference/sales.md)

**Sản phẩm**: Sử dụng API, adoption tính năng → Xem [reference/product.md](reference/product.md)

**Marketing**: Chiến dịch, attribution, email → Xem [reference/marketing.md](reference/marketing.md)
```

Khi người dùng hỏi "pipeline bán hàng quý trước thế nào?", Agent chỉ cần mở `reference/sales.md`; tài liệu tài chính, sản phẩm và marketing không bị nạp vào context.

Ngược lại, nếu quy tắc bắt buộc bị lồng qua quá nhiều tầng dẫn chiếu, Agent sẽ rất khó định vị trực tiếp:

```markdown
SKILL.md → advanced.md → details.md → quy tắc mấu chốt nhất bị giấu ở đây
```

Hãy liệt kê cách dùng cơ bản và tài liệu tầng kế tiếp ngay trong file chính:

```markdown
SKILL.md
├── Chứa trực tiếp cách dùng cơ bản
├── Tính năng nâng cao → advanced.md
└── API Reference → reference.md
```

Agent sau khi đọc file chính là có thể định vị ngay được tài liệu cần thiết. Khi file tham khảo tương đối dài, hãy liệt kê mục lục ở đầu file để tiện nắm bắt nội dung khả dụng.

## Thiết kế Workflow và Feedback Loop như thế nào?

Với các tác vụ đơn giản, chỉ cần viết vài quy tắc là đủ dùng. Nhưng khi gặp các kịch bản phức tạp hơn, làm như vậy sẽ không còn đủ nữa.

Agent rất có thể sẽ nhảy cóc qua một số bước, ví dụ như bỏ qua việc kiểm tra chất lượng output, bỏ qua việc chạy test code, rồi tuyên bố nó đã làm xong.

Để tránh vấn đề này, cần phải viết thật rõ hai điểm:

1. Mỗi bước đi theo trình tự nào
2. Những vị trí nào bắt buộc phải dừng lại để kiểm chứng

![Thiết kế workflow của Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-workflow-design-c78b8df8.webp)

Hình minh họa: Skill phức tạp cần phải đưa phân loại tác vụ, rẽ nhánh điều kiện, node kiểm chứng và phương án dự phòng khi thất bại vào trong quy trình.

### Dùng Checklist để kết nối các bước

TDD Skill của Superpowers là một ví dụ tuyệt vời.

Nó không chỉ viết một câu vỏn vẹn "viết test trước, viết code sau". Câu nói đó quá thô, khi Agent thực thi rất dễ làm đối phó qua chuyện.

Thay vào đó, nó chia quy trình thành các giai đoạn rõ ràng, phiên bản rút gọn như sau:

```markdown
### RED - Write Failing Test

Write one minimal test showing what should happen.

### Verify RED - Watch It Fail

**MANDATORY. Never skip.**

Confirm:

- Test fails, not errors
- Failure message is expected
- Fails because feature missing, not typos

### GREEN - Minimal Code

Write simplest code to pass the test.
Don't add features.

### REFACTOR - Clean Up

After green only:

- Remove duplication
- Improve names
- Extract helpers

Keep tests green. Don't add behavior.
```

**Verify RED** quy định: Agent bắt buộc phải tận mắt thấy lỗi xảy ra đúng như dự kiến trước khi bắt đầu hiện thực hóa code.

Lỗi phải xuất phát từ việc tính năng chưa được triển khai, chứ không phải do sai đường dẫn, sai cú pháp hay lỗi của bản thân bài test.

Bước này nếu không viết rõ, Agent rất dễ viết thẳng phần triển khai trước rồi mới viết bù một bài test "trông có vẻ pass". Đó không còn là TDD nữa.

Điều kiện kiểm chứng trước khi hoàn thành cũng được viết thành checklist:

```markdown
## Verification Checklist

Before marking work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output has no errors or warnings
```

Mỗi mục trong checklist đều phải là một hành động có thể kiểm tra thực tế, ví dụ "tất cả test đều pass" hoặc "mỗi hàm mới đều có test". Những yêu cầu kiểu như "đảm bảo chất lượng", "tuân thủ best practice khi viết test" không có tiêu chuẩn đánh giá cụ thể, không thể làm node kiểm chứng.

### Vòng lặp phản hồi (Feedback Loop)

Tác vụ phức tạp cần phải đưa các node kiểm chứng trung gian vào quy trình:

```text
Chạy → Kiểm chứng → Sửa đổi → Lại kiểm chứng
```

Ví dụ, khi review code nếu chỉ yêu cầu "review toàn diện", Agent rất dễ lao vào xử lý cách đặt tên, format và comment trước, bỏ sót các vấn đề kiến trúc.

Có thể chia quy trình review thành hai vòng:

```markdown
## Quy trình Code Review

1. Lấy danh sách file thay đổi và git diff

2. Vòng 1: Review thiết kế
   - Kiểm tra cấu trúc tổng thể có hợp lý không
   - Kiểm tra có vi phạm nguyên lý SOLID không
   - Nếu phát hiện vấn đề kiến trúc rõ ràng, báo cáo ngay, chưa vội đi sâu vào review chi tiết

3. Vòng 2: Review triển khai
   - Kiểm tra rủi ro bảo mật: SQL injection, XSS, vượt quyền
   - Kiểm tra điểm nghẽn hiệu năng: gọi DB trong vòng lặp, thiếu index
   - Kiểm tra xử lý ngoại lệ và điều kiện biên

4. Xuất vấn đề
   - Gắn nhãn mức độ nghiêm trọng: Critical / Warning / Suggestion
   - Đưa ra đề xuất có thể sửa trực tiếp
```

Quy trình này kiểm tra thiết kế trước, kiểm tra triển khai sau, cuối cùng đưa ra đề xuất sửa đổi.

### Rẽ nhánh điều kiện (Conditional Branching)

Khi Skill đồng thời xử lý nhiều loại tác vụ, cần liệt kê rõ điều kiện phán đoán và các nhánh rẽ. Việc tạo tài liệu mới và chỉnh sửa tài liệu sẵn có có lộ trình xử lý rất khác nhau:

```markdown
## Workflow sửa đổi tài liệu

1. Phán đoán loại tác vụ trước

   **Tạo tài liệu mới?**
   Đi theo workflow tạo mới.

   **Chỉnh sửa tài liệu hiện có?**
   Đi theo workflow chỉnh sửa.

2. Workflow tạo mới
   - Dùng template để sinh tài liệu
   - Xuất sang định dạng đích
   - Kiểm tra file có mở được bình thường không

3. Workflow chỉnh sửa
   - Giải nén tài liệu hiện có
   - Sửa nội dung chỉ định
   - Kiểm tra sau mỗi lần sửa
   - Đóng gói lại sau khi hoàn thành
```

Khi các nhánh rẽ nhiều lên, hãy giữ logic phán đoán ở file chính, quy trình cụ thể tách ra các file riêng:

```text
workflows/
├── create-document.md
├── edit-document.md
└── export-document.md
```

Tác vụ khớp nhánh nào, Agent sẽ đọc file tương ứng đó. Quy trình quy định thứ tự thực thi, node phản hồi quy định thời điểm kiểm tra; nếu thiếu một trong hai, quá trình thực thi rất dễ bị nhảy bước.

## Làm Skill Routing như thế nào?

![Quy trình Routing Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-routing-flow-fa3e5a57.webp)

Khi người dùng gửi yêu cầu "Full GC thường xuyên", router cần chọn Skill chẩn đoán JVM, và loại bỏ Skill điều tra database cũng như Skill xử lý tài liệu. Sau khi routing hoàn tất, cần thu được một tập hợp Skill có thể nạp trực tiếp.

Khi chỉ có 3 đến 5 Skill, mô hình đọc `description` thường là đủ để đưa ra lựa chọn. Nhưng khi số lượng tăng lên hàng chục, việc xử lý theo quy trình "Truy hồi ứng viên → Tái sắp xếp (Re-rank) → Đưa ra quyết định" sẽ ổn định hơn nhiều:

| Giai đoạn | Đầu vào & Xử lý | Đầu ra |
| --- | --- | --- |
| Truy hồi thô (Coarse Recall) | Vector hóa yêu cầu cùng với tên Skill, `description`, mẫu query tiêu biểu; lấy top-5 theo cosine similarity. | Số lượng nhỏ Skill ứng viên |
| Tinh chỉnh (Re-rank) | So sánh mức độ khớp của tên, mô tả, ví dụ; các Skill rủi ro cao như bảo mật, database áp dụng ngưỡng khắt khe hơn. | Danh sách ứng viên xếp theo độ liên quan và rủi ro |
| Quyết định | Điểm cao nhất đạt ngưỡng thì nạp Skill tương ứng; điểm tổng thể quá thấp thì không nạp Skill nào, đi theo luồng mặc định. | Một, nhiều hoặc không có Skill nào được chọn |

Khi trong cùng một yêu cầu chứa các tác vụ độc lập với nhau, hãy bóc tách tác vụ trước rồi mới route. Ví dụ yêu cầu "phân tích GC log và sửa tài liệu deploy" liên quan đến cả chẩn đoán JVM và chỉnh sửa tài liệu, không thể dùng một Skill chung chung bao quát cả hai quy trình.

Với yêu cầu kiểu "Full GC thường xuyên", truy hồi thô có thể cho ra ba ứng viên: `jvm-metrics-analyzer`, phân tích distributed trace và xem sự kiện K8s; khâu re-rank sau khi đối chiếu các ví dụ "Full GC", "thread dump" sẽ xếp Skill chẩn đoán JVM lên đầu bảng. Nếu yêu cầu chỉ vỏn vẹn "xử lý giúp tôi cái này", không có đủ manh mối ngữ nghĩa, router nên giữ nguyên quy trình mặc định, thay vì đoán mò người dùng muốn migrate database hay thao tác trên production.

![Kiến trúc Router Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-router-0696db9e.svg)

Khi một Skill mới chưa có dữ liệu query lịch sử, phần `description` quá trừu tượng sẽ kéo tụt chất lượng truy hồi. [Đặc tả Agent Skills](https://agentskills.io/specification) không quy định trường frontmatter `triggers` chuẩn chung, và các host cũng không đảm bảo sẽ đọc các trường tự định nghĩa. Khi tự xây dựng bộ điều phối, hãy đặt các query tiêu biểu vào một chỉ mục routing độc lập:

```yaml
skill: jvm-runtime-diagnosis
examples:
  - "Endpoint bị treo"
  - "Full GC thường xuyên"
  - "Xem giúp tôi đoạn Java stack trace này"
  - "Dịch vụ bị OOM thì điều tra thế nào"
```

Router tùy biến sẽ vector hóa `examples` cùng với `name`, `description` của Skill. Khi sử dụng host của bên thứ ba, chỉ dùng các trường mà host đó hỗ trợ rõ ràng; đừng nhét chỉ mục routing này vào tất cả các file `SKILL.md`, và càng không nên mặc định rằng host nào cũng sẽ đọc nó.

Với hàng chục Skill, dùng NumPy tính toán độ tương đồng trong bộ nhớ là đủ nhanh, độ trễ chủ yếu đến từ API embedding bên ngoài. Hãy cache vector của query trước; chỉ khi số lượng tăng lên hàng trăm hoặc hàng nghìn Skill mới cần đánh giá việc dùng chỉ mục ANN hay vector database.

Một bộ điều phối tổng quát có thể chia thành bốn phần:

| Thành phần | Trách nhiệm |
| --- | --- |
| Registry (Đăng ký) | Lưu trữ metadata của Skill, chỉ mục routing và vector. |
| Routing Engine | Truy hồi ứng viên, tính điểm và áp dụng ngưỡng lọc. |
| Loader (Nạp) | Đọc `SKILL.md` và tài liệu tham khảo cần thiết theo kết quả routing. |
| Context Assembler | Đưa nội dung đã nạp vào ngữ cảnh của tác vụ tương ứng. |

Routing engine không chịu trách nhiệm đọc nội dung chính của Skill, và loader cũng không tham gia chấm điểm. Nhờ đó, việc cập nhật nội dung chính sẽ không làm thay đổi kết quả truy hồi, và việc thay đổi kho lưu trữ vector cũng không cần sửa đổi logic nạp tài liệu.

## Những cạm bẫy dễ mắc phải khi viết Skill

### Viết Skill như viết README của dự án

README ghi lại bối cảnh dự án, cài đặt và tính năng, để người đọc tự phán đoán bước tiếp theo. Nhưng Agent khi thực thi tác vụ lại cần những ranh giới thao tác được: khi nào dùng, thực hiện theo thứ tự nào, trường hợp nào dừng lại và xử lý thất bại ra sao.

![Nội dung SKILL.md tốt nhất nên kiểm soát trong vòng 500 dòng](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/keep-skill-md-content-under-500-lines-for-best-p-7c39bab2.png)

### Muốn viết một Skill bao quát tất cả

Nếu nhồi nhét cả JVM, database, K8s, API gateway và message queue vào một Skill "Xử lý sự cố hệ thống", khi người dùng dán log GC vào, Agent vẫn phải phân vân giữa tài nguyên container, log gateway và quy tắc JVM. Tách nhỏ theo ranh giới vấn đề sẽ giúp đầu vào rơi thẳng vào tài liệu tương ứng:

- `jvm-metrics-analyzer`: Chỉ xem chỉ số JVM, GC, thread stack
- `distributed-trace-finder`: Chỉ lần theo TraceId để truy vết độ trễ
- `k8s-pod-event-viewer`: Chỉ xem trạng thái Pod, nguyên nhân restart và event log

Log GC đi vào Skill chỉ số JVM, TraceId đi vào Skill truy vết liên kết, Pod restart đi vào Skill sự kiện K8s. Mỗi Skill chỉ duy trì quy tắc và tài liệu phục vụ cho một nhóm vấn đề.

### Đưa cho Agent quá nhiều lựa chọn

Nếu chỉ liệt kê pypdf, pdfplumber, PyMuPDF, pdf2image, Agent sẽ không thể phán đoán PDF văn bản thông thường và PDF dạng scan scan nên đi theo con đường nào, dẫn đến việc dùng nhầm OCR trên file PDF văn bản số:

```markdown
# ✗ Không khuyến nghị: Quá nhiều lựa chọn

Bạn có thể dùng pypdf, pdfplumber, PyMuPDF hoặc pdf2image để xử lý PDF.
```

Lộ trình mặc định và điều kiện ngoại lệ cần được viết cùng nhau:

```markdown
# ✓ Khuyến nghị: Phương án mặc định + Phương án dự phòng

Mặc định sử dụng pdfplumber để trích xuất văn bản.
Nếu là file PDF dạng scan cần OCR, hãy đổi sang dùng pdf2image + pytesseract.
```

Skill cần đưa ra lựa chọn mặc định trong điều kiện bình thường, đồng thời nêu rõ điều kiện chuyển đổi.

### Thuật ngữ thay đổi thất thường

Một đối tượng trong cùng một Skill nên giữ nguyên một tên gọi thống nhất. Ví dụ ở trên đã dùng "API endpoint", thì ở dưới đừng đổi sang URL, API route hay đường dẫn. Khi điều kiện phán đoán dẫn chiếu đến thuật ngữ, sự thiếu nhất quán sẽ tạo ra hiểu lầm khó lường.

### Để LLM làm những công việc mang tính xác định

Các thao tác chuyển đổi định dạng, tính toán chính xác, xử lý file hàng loạt và thay đổi dữ liệu nên giao cho script thực thi:

- LLM phù hợp hơn với việc phán đoán: hiểu tác vụ, trích xuất tham số, quyết định bước tiếp theo, giải thích kết quả.
- Script phù hợp hơn với việc thực thi: parse file, chuyển đổi định dạng, xử lý hàng loạt, kiểm tra output.

Khi đọc file đầu vào bắt buộc, script nên trả về lỗi rõ ràng, thay vì tạo ra file rỗng che giấu sự thiếu hụt đầu vào:

```python
# ✓ Khuyến nghị: Viết rõ điều kiện lỗi
def process_file(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError as exc:
        raise FileNotFoundError(
            f"File đầu vào bắt buộc không tồn tại: {path}. Vui lòng kiểm tra đường dẫn hoặc tạo file này trước."
        ) from exc
```

Cách viết dưới đây chỉ giữ lại exception tầng dưới, Agent không thể dựa vào đó để biết nên kiểm tra đường dẫn hay nên tạo file bị thiếu:

```python
# ✗ Không khuyến nghị: Sập trực tiếp, Agent chỉ biết đoán mò nguyên nhân
def process_file(path):
    return open(path).read()
```

Tham số cấu hình cần giải thích rõ ràng lý do đằng sau các ràng buộc:

```markdown
# ✓ Khuyến nghị: Nhìn ra được lý do tại sao cấu hình như vậy

REQUEST_TIMEOUT = 30 # HTTP request thông thường nên hoàn thành trong vòng 30 giây
MAX_RETRIES = 3 # 3 lần retry là mức cân bằng tốt giữa độ tin cậy và thời gian chờ
```

## Tổng kết

Quay trở lại kịch bản Code Review ở phần mở đầu: Prompt truyền tải yêu cầu review lần này, Function Calling khởi tạo lệnh gọi công cụ, MCP kết nối các năng lực bên ngoài như file, database hay GitHub, còn Skill lưu giữ quy trình và ràng buộc của việc review.

`description` cần đồng thời nêu rõ tác vụ và ngữ cảnh kích hoạt, còn nội dung chính đưa vào các quy ước dự án, các bước thực thi, cách xử lý thất bại và các điểm kiểm chứng. File chính giữ quy trình cốt lõi, chi tiết tách vào `references/`, `scripts/`; các thao tác như migrate, deploy, xóa file bắt buộc phải siết chặt quy trình, còn việc review và đánh giá giải pháp thì giữ lại không gian phán đoán cần thiết.

## Tham khảo

- Kho lưu trữ Skills chính thức của Anthropic: <https://github.com/anthropics/skills>
- skill-creator chính thức của Anthropic: <https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md>
- Superpowers: <https://github.com/obra/superpowers>
- sanyuan-skills: <https://github.com/sanyuan0704/sanyuan-skills>
- Everything Claude Code: <https://github.com/nicekid1/everything-claude-code>
- skills.sh (Nền tảng tìm kiếm Skills cộng đồng): <https://skills.sh/>
