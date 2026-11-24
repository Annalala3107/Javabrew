---
title: "Chi tiết Claude Code Hooks: Vòng đời Hook và quy trình tự động hóa"
description: "Xuất phát từ vòng đời của Claude Code, bài viết làm rõ thời điểm kích hoạt Hooks, các loại handler, input/output, chặn rủi ro an toàn, tự động format và thông báo nhắc nhở, giúp bạn dùng Hooks biến những ràng buộc mềm trong prompt thành các hành động tự động có thể audit và tái sử dụng."
category: Nguyên lý AI Coding
tag:
  - Claude Code
  - Hooks
  - AI Agent
  - AI Coding
lang: vi
sourceRef: zh-ref/ai-coding/principles/claude-code-hooks.md
head:
  - - meta
    - name: keywords
      content: Claude Code,Hooks,Vòng đời Hook,AI Coding,Quy trình tự động hóa,PreToolUse,PostToolUse,UserPromptSubmit,SessionStart,Kiểm soát quyền hạn
---

Dùng Claude Code hoặc Codex để viết code đến một giai đoạn nhất định, rất nhiều người sẽ gặp phải cùng một vấn đề.

Vấn đề thường không nằm ở năng lực của mô hình.

Trái lại, là vì nó quá tháo vát. Nó có thể sửa tệp, chạy lệnh, kiểm tra cấu trúc dự án, tạo script, và cũng có thể xử lý một chuỗi tác vụ rất dài chỉ trong một lần. Thế là bạn sẽ rất tự nhiên bắt đầu giao phó thêm nhiều thao tác hơn cho nó.

Và rồi những nỗi lo xuất hiện: Sửa xong tệp, lần này liệu nó có quên chạy format không? Chuẩn bị chạy lệnh Bash, liệu nó có vô tình kèm thêm `rm -rf` không? Nó có tiện tay sửa nhầm vào `.env`, `.git/` hoặc cấu hình production không? Khi nó bị kẹt ở popup xin quyền, liệu mình có thể không cần phải liên tục dán mắt vào terminal không? ...

Tất cả những điều này đều không phù hợp nếu chỉ trông chờ vào prompt để giải quyết, bởi vì sự ràng buộc của prompt là không đủ chặt chẽ và không thể đảm bảo một cách tuyệt đối.

Lúc này bạn sẽ cần đến Hooks. Nó sinh ra chính là để giải quyết các vấn đề này thông qua cơ chế tự động kích hoạt thực thi.

Sự khác biệt giữa hai cách tiếp cận có thể tóm gọn qua hình minh họa sau:

![Nhắc nhở qua Prompt phụ thuộc vào context và trí nhớ của mô hình; chốt chặn Hooks đảm bảo hành động diễn ra nhờ kích hoạt tự động, audit bằng script và chặn đứng rủi ro](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-vs-prompts-guarantee-f27a3775.webp)

Mình thích xem Hooks như các chốt chặn cố định trong quy trình làm việc của Claude Code. Khi phiên làm việc bắt đầu, khi người dùng gửi Prompt, trước và sau khi gọi công cụ, trước và sau khi nén context—bạn đều có thể gắn các hành động xử lý tự động tương ứng vào các mốc đó.

## Hooks rốt cuộc là gì

Cấu hình Hook chủ yếu xoay quanh sự kiện (event) và handler (bộ xử lý). Sự kiện quyết định khi nào kích hoạt, còn handler tiếp nhận dữ liệu đầu vào tại thời điểm đó để hoàn thành hành động cụ thể.

Ví dụ, gắn một `command` handler vào sự kiện `PostToolUse`: Sau khi Claude sửa đổi tệp thành công, Claude Code sẽ chuyển JSON của lần gọi công cụ này qua stdin cho script, và script sẽ quyết định xem có cần chạy formatter hay không. Toàn bộ tiến trình không đòi hỏi Claude phải quay lại đọc prompt chỉ thị, và bản thân script cũng có thể tách ra để kiểm thử độc lập bên ngoài.

Handler cũng không chỉ giới hạn ở shell command. Tài liệu chính thức còn hỗ trợ các dạng như HTTP endpoint, công cụ MCP và LLM prompt (xem mục "Hook handler fields" trong tài liệu chính thức [Hooks reference](https://code.claude.com/docs/en/hooks)).

![Năm loại handler liệt kê trong tài liệu chính thức Hooks reference: command, http, mcp_tool, prompt và agent](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-handler-types-official-docs-cf27f8fc.png)

Sơ đồ dưới đây đánh dấu các điểm kích hoạt thường dùng:

![Claude Code Hooks tự động thực thi xoay quanh các mốc vòng đời như SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest và PreCompact](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-code-hooks-lifecycle-map-4584bd5a.webp)

Hook handler chủ yếu có 5 loại:

| Loại | Làm gì | Phù hợp cho ngữ cảnh |
| ---- | ------ | -------------------- |
| `command` | Thực thi shell command | Format code, ghi log, chặn rủi ro an toàn, thông báo |
| `http` | Gửi POST dữ liệu JSON của sự kiện đến một URL | Dịch vụ audit của nhóm, thông báo từ xa, chính sách tập trung |
| `mcp_tool` | Gọi công cụ trên MCP server đã kết nối | Tái sử dụng năng lực MCP sẵn có |
| `prompt` | Dùng một lần phán đoán của mô hình trả về JSON dạng yes/no | Đánh giá gọn nhẹ, ví dụ kiểm tra tác vụ đã xong chưa trước khi `Stop` |
| `agent` | Khởi chạy subagent có quyền truy cập công cụ để xác minh | Xác minh phức tạp cần đọc tệp, tìm kiếm code, chạy lệnh |

Tuy nhiên, 5 loại handler này không phải sự kiện nào cũng dùng được:

- Các sự kiện như `PreToolUse`, `PostToolUse`, `PermissionRequest`, `Stop` hỗ trợ cả 5 loại;
- Các sự kiện như `Notification`, `PreCompact`, `ConfigChange` không hỗ trợ `prompt` và `agent`;
- `SessionStart`, `Setup` chỉ hỗ trợ `command` và `mcp_tool`.

Trước khi chuẩn bị dùng handler không phải dạng command, tốt nhất bạn nên tra cứu phạm vi tương thích của sự kiện đó trước.

Bước này bạn có thể giao thẳng cho AI làm: chỉ cần cung cấp bài viết này hoặc gửi trực tiếp link tài liệu chính thức cho Coding Agent của bạn.

Những quy tắc có thể viết thành script một cách tất định thì nên ưu tiên giao cho `command`. Script có thể chạy độc lập bên ngoài Claude Code, và nguyên nhân lỗi cũng dễ tái hiện hơn nhiều.

Chỉ khi quy trình xác minh thực sự cần đọc mã nguồn, chạy kiểm thử và tổng hợp đánh giá đa chiều thì mới cần cân nhắc đến `prompt` hoặc `agent`. Trong đó, `agent` hook trong tài liệu chính thức vẫn gắn nhãn là experimental (thử nghiệm), trước khi áp dụng cần tính toán đến chi phí debug phát sinh.

Mối quan hệ giữa 5 loại handler như sau:

![Hook handler bao gồm command, http, mcp_tool, prompt và agent; ưu tiên sử dụng script command ổn định và dễ audit](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hook-handler-types-1c039791.webp)

## Hooks giải quyết vấn đề gì

Giả sử trong `CLAUDE.md` có viết "sau khi sửa code vui lòng chạy Prettier". Câu nhắc nhở này sẽ đi vào context, và Claude thông thường sẽ làm theo; nhưng khi tác vụ kéo dài, giữa chừng chèn thêm yêu cầu mới, nó rất dễ bỏ quên. Khi quy tắc dự án chưa được sắp xếp gọn gàng, bạn có thể tham khảo trước bài [Best Practices cho CLAUDE.md](https://javaguide.cn/ai-coding/practices/claude-md-best-practices.html).

Quy định "không được sửa tệp `.env`" cũng gặp vấn đề tương tự. Ngôn ngữ tự nhiên có thể giải thích ý định, nhưng không thể ép buộc kiểm tra đường dẫn trước mỗi lần ghi tệp. Khi gắn quy tắc vào `PreToolUse`, script có thể đọc đường dẫn tệp mục tiêu và chặn đứng ngay lập tức nếu chạm vào đường dẫn nhạy cảm; còn format code thì có thể đặt tại `PostToolUse`, chỉ xử lý các tệp vừa mới được sửa đổi.

Cơ chế này có tác dụng tương tự như pre-commit, CI, lint-staged, CODEOWNERS, branch protection: đưa các thao tác cố định như format, kiểm tra lệnh nguy hiểm, thông báo quyền hạn vào quy trình, để lại kết quả thực thi có thể kiểm tra được. Hooks chính là mảnh ghép bù đắp vào giai đoạn này trong vòng đời của Claude Code.

## Cấu hình Hooks tối giản

Hook được cấu hình trong các tệp settings của Claude Code. Có 3 vị trí phổ biến:

| Vị trí | Phạm vi tác dụng | Phù hợp đặt nội dung gì |
| ------ | ---------------- | ----------------------- |
| `~/.claude/settings.json` | Mọi dự án của người dùng hiện tại | Thông báo cá nhân, thói quen cá nhân |
| `.claude/settings.json` | Dự án hiện tại, có thể commit lên repo | Quy tắc dùng chung cho nhóm, hạn chế bảo mật cấp dự án |
| `.claude/settings.local.json` | Cục bộ riêng tư của dự án hiện tại | Cấu hình cá nhân không thích hợp commit lên kho mã nguồn |

Tài liệu chính thức cũng hỗ trợ managed policy, `hooks/hooks.json` của plugin, cũng như các hooks khai báo trong frontmatter của skill hoặc agent.

Khi làm dự án hàng ngày, trước hết chỉ cần nhớ 3 vị trí trên là đủ.

Một cấu hình tối giản trông như thế này:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

Bóc tách ra, thực chất cấu hình gồm có 3 tầng:

- `PostToolUse` là tên sự kiện, biểu thị kích hoạt sau khi gọi công cụ thành công.
- `matcher` là điều kiện lọc. Ở đây ghi `Edit|Write`, chỉ kích hoạt sau khi Claude Code dùng công cụ `Edit` hoặc `Write` để chỉnh sửa tệp. Matcher tên công cụ có thể phân tách bằng `|`; từ bản Claude Code v2.1.191 trở đi, cũng có thể phân tách bằng dấu phẩy `,` và để khoảng trắng hai bên. Matcher chính xác có chứa dấu gạch nối thì cần bản v2.1.195 trở lên, phiên bản cũ có thể dùng `^...$` để giới hạn khớp hoàn toàn.
- Mảng `hooks` bên trong chứa handler thực sự được thực thi. Ở đây là một `command`, sẽ lấy đường dẫn tệp vừa chỉnh sửa từ JSON truyền qua stdin, rồi giao cho Prettier.

Ví dụ trên đưa thẳng lệnh vào JSON cho ngắn gọn. Trong dự án thực tế, khi câu lệnh bắt đầu dài ra hoặc cần gọi script trong dự án, mình khuyên nên viết thành tệp script riêng, rồi dùng `${CLAUDE_PROJECT_DIR}` để trỏ tới:

```json
{
  "type": "command",
  "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/format-after-edit.sh",
  "args": []
}
```

Tài liệu chính thức khuyến nghị khi tham chiếu các placeholder như đường dẫn dự án, đường dẫn plugin thì nên ưu tiên dùng dạng exec (exec form). Mỗi phần tử trong `args` sẽ được truyền như một đối số độc lập cho script mà không qua bước tách từ (word-splitting) của shell, nhờ đó các khoảng trắng, dấu ngoặc hay ký tự đặc biệt trong đường dẫn sẽ không bị phân tách sai.

Nếu bỏ qua `matcher`, điền chuỗi rỗng hoặc dùng `.*`, nhóm hook này sẽ khớp với mọi lần kích hoạt của sự kiện tương ứng. Đối với tác vụ format, điều này có thể đồng nghĩa với việc mỗi lần gọi công cụ xong đều bật formatter; đối với sự kiện phân quyền, nó có thể đẩy tất cả các popup ủy quyền vào cùng một logic tự động xử lý.

Matcher nên bám sát dữ liệu đầu vào thực tế. Format tệp thì khớp `Edit|Write`, kiểm tra rủi ro shell thì khớp `Bash`, giúp giảm thiểu việc gọi không cần thiết và dễ dàng định vị từ log xem quy tắc nào đã sinh ra kết quả.

## Cơ chế Input và Output của Hook

Khi Hook được kích hoạt, Claude Code sẽ truyền context sự kiện dưới dạng JSON cho handler:

- Nếu là `command` hook, đoạn JSON này đi qua stdin.
- Nếu là `http` hook, đoạn JSON này làm body của request POST gửi lên server.

Mọi sự kiện đều có một số trường dữ liệu chung, ví dụ:

| Trường | Ý nghĩa |
| ------ | ------- |
| `session_id` | ID phiên làm việc hiện tại |
| `transcript_path` | Đường dẫn tệp JSONL chứa lịch sử phiên hội thoại |
| `cwd` | Thư mục làm việc tại thời điểm kích hoạt hook |
| `permission_mode` | Chế độ quyền hạn hiện tại (chỉ có ở một số sự kiện) |
| `hook_event_name` | Tên sự kiện kích hoạt |

Các sự kiện liên quan đến công cụ sẽ mang thêm `tool_name` và `tool_input`.

Ví dụ khi Claude Code chuẩn bị chạy `npm test`, `PreToolUse` có thể nhận được dữ liệu đầu vào như sau:

```json
{
  "session_id": "abc123",
  "cwd": "/Users/example/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  }
}
```

Do đó trong script Hook, một đoạn mã rất quen thuộc là:

```bash
INPUT="$(cat)"
TOOL_NAME="$(echo "$INPUT" | jq -r '.tool_name // empty')"
COMMAND="$(echo "$INPUT" | jq -r '.tool_input.command // empty')"
```

Ở đây khuyến nghị dùng `jq` để parse JSON, đừng tự dùng regex grep chắp vá các trường.

Cũng cần chú ý đến mã thoát (exit code) và quy ước stdout.

Claude Code sẽ kiểm tra stdout ở mọi mã thoát. Nếu sau khi bỏ khoảng trắng ở đầu, ký tự đầu tiên là `{`, nó sẽ thử parse theo định dạng JSON. Khi muốn trả về quyết định có cấu trúc, khuyến nghị dùng `exit 0`, và tuyệt đối không nhét log debug vào stdout. Lý do lỗi và thông tin debug hãy ghi vào `stderr`. Muốn chặn đứng (block), phần lớn sự kiện dùng `exit 2`; các lỗi khác 0 thông thường (như `exit 1`) nhiều khi chỉ bị coi là hook báo lỗi, còn quy trình chính vẫn tiếp tục chạy.

Cạm bẫy dễ giẫm phải nhất chính là `exit 1`.

Trong shell script thông thường, `exit 1` hay dùng để báo thất bại. Nhưng trong Claude Code Hooks, nếu stdout rỗng, là văn bản thường hoặc JSON không hợp lệ, thì đối với đa số sự kiện `exit 1` chỉ là lỗi không gây chặn (non-blocking error), quy trình vẫn tiếp diễn. Nếu stdout là JSON đúng schema của sự kiện, các sự kiện áp dụng mô hình quyết định chuẩn sẽ bỏ qua mã thoát này và xử lý kết quả theo các trường trong JSON.

Về đầu ra JSON có cấu trúc:

Nếu bạn muốn kiểm soát tinh tế hơn, ví dụ trong `PreToolUse` trả về `allow`, `deny`, `ask`, `defer`, khuyến nghị dùng `exit 0`, và stdout chỉ xuất ra duy nhất một đối tượng JSON.

Ví dụ từ chối một lần gọi công cụ:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Database writes are not allowed"
  }
}
```

Nếu là sự kiện `PermissionRequest`, cấu trúc lại khác một chút, trọng tâm nằm ở `decision.behavior`:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow"
    }
  }
}
```

Đừng coi stdout như nơi in log.

Nếu bạn cần xuất JSON, stdout chỉ được chứa JSON. Thông tin debug hãy ghi vào stderr hoặc ghi ra tệp log riêng. Nếu không, bạn sẽ rất dễ gặp lỗi `JSON validation failed` rồi nhìn cấu hình mà bế tắc.

Nếu script trả về `exit 2`, Claude Code vẫn đọc JSON đúng schema từ stdout. Đối với các sự kiện hỗ trợ chặn, kết quả chặn từ `exit 2` không thể bị JSON ghi đè; chỉ khi không có lý do chặn hợp lệ từ JSON, Claude Code mới dùng stderr. `PermissionRequest` là một ngoại lệ: nó không chấp nhận `exit 2` để chặn; việc phê duyệt hay từ chối bắt buộc phải trả về qua đối tượng `decision`.

Dưới cùng một sự kiện, nếu có nhiều Hook cùng khớp, Claude Code sẽ để tất cả chạy xong rồi mới hợp nhất kết quả. Một Hook trả về deny sẽ không ngăn cản Hook bên cạnh ghi log, gửi request HTTP hay sửa tệp; trong `PreToolUse`, khi hợp nhất nhiều quyết định, kết quả nghiêm ngặt hơn sẽ được áp dụng.

Do đó, chỉ cần Hook có hành vi ghi log, gửi request, sửa tệp thì bản thân nó phải tự kiểm tra xem có nên thực thi hay không. Đừng giả định rằng một Hook bảo mật khác sẽ chạy trước và chặn đứng rủi ro giúp bạn.

Việc sửa đổi đầu vào của công cụ (tool input) cũng cần hết sức thận trọng. Tài liệu chính thức đã cảnh báo rõ: **Nếu nhiều Hook cùng cố gắng sửa đổi cùng một tool input, kết quả có hiệu lực sau cùng là của Hook hoàn thành cuối cùng; nhưng các Hook lại chạy song song, nên thứ tự hoàn thành là không xác định.**

Ngoài ra, `command` Hook sẽ chạy trực tiếp lệnh shell với quyền của người dùng hiện tại trên hệ điều hành. Nó có thể truy cập, sửa đổi thậm chí xóa các tệp mà người dùng có quyền thao tác, do đó trước khi đưa script của bên thứ ba vào, nhất định phải đọc hiểu và kiểm thử độc lập trước.

![Tài liệu chính thức cảnh báo command Hook sẽ thực thi lệnh shell với quyền của người dùng hiện tại, có thể truy cập, sửa đổi hoặc xóa tệp](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-security-warning-official-docs-578464f0.png)

## Hiểu các sự kiện vòng đời phổ biến

Tài liệu chính thức liệt kê khá nhiều sự kiện, từ phiên làm việc, công cụ, quyền hạn, sub-agent, tác vụ, thay đổi cấu hình, worktree cho đến biểu mẫu MCP.

Tuy nhiều sự kiện, nhưng khi mới bắt đầu, những mốc thực sự hay dùng chỉ gồm mấy nhóm: bắt đầu phiên, người dùng gửi Prompt, trước khi chạy công cụ, sau khi chạy công cụ, quyết định quyền hạn, dừng phản hồi, và nén context.

| Sự kiện | Thời điểm kích hoạt | Phù hợp làm gì |
| ------- | ------------------- | -------------- |
| `SessionStart` | Khi phiên bắt đầu hoặc khôi phục | Tiêm context động, nạp môi trường, bù quy tắc sau khi nén |
| `UserPromptSubmit` | Sau khi người dùng gửi Prompt, trước khi Claude xử lý | Audit Prompt, chặn nhẹ, bổ sung context động |
| `PreToolUse` | Trước khi lệnh gọi công cụ được thực thi | Chặn lệnh nguy hiểm, bảo vệ tệp nhạy cảm, sửa đổi input công cụ |
| `PermissionRequest` | Khi lệnh gọi công cụ cần quyết định quyền hạn | Audit quyền, hoặc tự động phê duyệt trong phạm vi rất hẹp |
| `PostToolUse` | Sau khi gọi công cụ thành công | Format code, ghi log, chạy linter, bổ sung context |
| `Notification` | Khi Claude Code gửi thông báo | Thông báo desktop, push notification về điện thoại |
| `Stop` | Khi Claude hoàn thành một lượt phản hồi | Thông báo hoàn thành, cổng chất lượng (quality gate), nhắc xử lý tiếp |
| `PreCompact` | Trước khi nén context | Sao lưu trạng thái, ngăn chặn việc nén không phù hợp |
| `PostCompact` | Sau khi nén context | Ghi nhận tóm tắt, đồng bộ trạng thái bên ngoài |

Tiếp theo là nhóm các sự kiện nâng cao. Bạn chỉ cần biết có sự tồn tại của chúng, khi cần thì tra cứu tài liệu chính thức hoặc hỏi AI:

| Phân loại | Sự kiện |
| --------- | ------- |
| Phiên & Cấu hình | `Setup`, `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `FileChanged`, `SessionEnd` |
| Prompt & Hiển thị | `UserPromptExpansion`, `MessageDisplay`, `TeammateIdle` |
| Công cụ & Quyền hạn | `PermissionDenied`, `PostToolUseFailure`, `PostToolBatch` |
| Sub-agent & Tác vụ | `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted` |
| Worktree & Biểu mẫu MCP | `WorktreeCreate`, `WorktreeRemove`, `Elicitation`, `ElicitationResult` |
| Dừng bổ sung | `StopFailure` |

Cần phân biệt một vài sự kiện dễ gây nhầm lẫn theo đúng thứ tự kích hoạt thực tế.

`PreToolUse` diễn ra trước khi công cụ thực thi. Kiểm tra lệnh Bash, bảo vệ `.env` và hạn chế ghi cấu hình production bắt buộc phải đặt ở giai đoạn này, script mới có cơ hội trả về kết quả từ chối trước khi tác dụng phụ (side effect) kịp xuất hiện.

`PostToolUse` diễn ra sau khi công cụ đã thành công, nên nó thích hợp để thu dọn kết thúc, không thích hợp làm cánh cửa bảo mật đầu tiên. Format code có thể để ở đây, nhưng bảo vệ tệp nhạy cảm thì không thể chỉ dựa vào nó, vì tệp đã bị sửa mất rồi. Nó vẫn có thể dùng JSON để phản hồi lại cho Claude hoặc thay thế output của công cụ, nhưng không thể hoàn tác lại lệnh gọi vừa diễn ra.

`PermissionRequest` kích hoạt khi lệnh gọi công cụ bước vào quy trình quyết định quyền hạn và Claude Code chuẩn bị yêu cầu quyền, cho phép phê duyệt hoặc từ chối yêu cầu này. Trong chế độ tương tác, nó thường hiển thị hộp thoại xác nhận; các subagent chạy nền phi tương tác không thể hiện hộp thoại vẫn sẽ chạy Hook này, nếu không có Hook trả về quyết định thì lệnh gọi công cụ sẽ bị từ chối. Trong chế độ không tương tác `-p`, chỉ có callback `canUseTool` của Agent SDK mới cung cấp luồng này; còn lệnh `claude -p` thông thường nên dùng `PreToolUse` để đưa ra quyết định tự động. Các kiểm tra rủi ro bắt buộc phải thực thi ổn định vẫn phải đặt ở `PreToolUse`, và tự động phê duyệt cũng phải thu hẹp cả matcher lẫn điều kiện đầu vào để tránh việc mở cửa thả nổi toàn cục.

`Stop` không đồng nghĩa với "tác vụ hoàn thành", nó chỉ kích hoạt khi Claude chuẩn bị kết thúc lượt phản hồi này. Nếu dùng Stop hook làm cổng chất lượng, phải cẩn thận tránh vòng lặp vô tận. Tài liệu chính thức cung cấp trường `stop_hook_active` để kiểm tra xem lượt hiện tại đã từng được tiếp tục bởi Stop hook hay chưa; sau 8 lần liên tiếp bị chặn, Claude Code sẽ bỏ qua việc chặn của Hook và ép kết thúc lượt phản hồi.

`PreCompact` có thể ngăn chặn nén context, còn `PostCompact` không thể đảo ngược kết quả nén đã xong. Để tiêm lại quy tắc sau khi nén, cách phổ biến hơn là dùng `SessionStart` kết hợp với matcher `compact`. Nén context và bù quy tắc thuộc về Context Engineering, nếu muốn tìm hiểu sâu hơn bạn có thể xem [Hướng dẫn thực chiến Kỹ thuật Context](https://javaguide.cn/ai/agent/context-engineering.html).

## Ba ví dụ tối giản có thể dùng được ngay

Để bắt đầu, mình khuyên các bạn nên làm quen với 3 ví dụ: một cái chuyên gửi thông báo, một cái chuyên thu dọn sau khi sửa tệp, và một cái đứng trước khi chạy công cụ để ngăn chặn rủi ro.

Chúng bao quát vừa vặn ba mục tiêu: rủi ro thấp, lợi ích tự động hóa và rào chắn an toàn tối thiểu.

### Notification: Bật thông báo khi Claude cần bạn xử lý

Ví dụ này thích hợp để cấu hình đầu tiên nhất, vì nó hầu như không động đến code, rủi ro bằng không.

Trên macOS, bạn có thể ghi vào `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs your attention\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

Ở đây `matcher` điền `permission_prompt`, biểu thị chỉ khi Claude cần bạn phê duyệt lệnh gọi công cụ thì mới gửi thông báo. Thông báo này thường đợi yêu cầu quyền hạn dừng lại khoảng 6 giây mới kích hoạt, chứ không phải vừa bắt đầu xác nhận là gửi ngay. Nếu muốn mọi thông báo đều kích hoạt, có thể bỏ qua matcher hoặc điền chuỗi rỗng. Các Notification matcher chính thức khác gồm có `idle_prompt`, `auth_success`, `elicitation_dialog`, v.v.

Nếu trên macOS không thấy hiện thông báo, trước tiên hãy chạy thử thủ công trong terminal:

```bash
osascript -e 'display notification "test"'
```

Sau đó vào System Settings cấp quyền thông báo cho Script Editor. Lỗi này rất phổ biến: Hook thực tế đã kích hoạt, chỉ là hệ điều hành không cho hiển thị thông báo ra màn hình.

### PostToolUse: Tự động format sau khi sửa tệp

Trong dự án frontend, phổ biến nhất là chạy Prettier sau khi công cụ `Edit` hoặc `Write` sửa tệp:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

Đoạn cấu hình này có 3 điểm mấu chốt:

`matcher` chỉ khớp `Edit|Write`, nên đọc tệp, chạy Bash, gọi công cụ MCP đều không kích hoạt format code.

`command` lấy `.tool_input.file_path` từ stdin JSON rồi giao cho `npx prettier --write`.

Hook này nằm ở `PostToolUse`, nghĩa là "thu dọn sau khi công cụ thực thi". Khi formatter thất bại, bạn có thể để lộ lỗi ra ngoài, hoặc viết thành script để chọn formatter khác nhau tùy theo đuôi mở rộng của tệp.

Một đoạn script ổn định hơn:

```bash
#!/usr/bin/env bash
set -euo pipefail

file="$(jq -r '.tool_input.file_path // empty')"

case "$file" in
  *.js|*.jsx|*.ts|*.tsx|*.json|*.md)
    npx prettier --write "$file"
    ;;
esac
```

Hook không có phép màu nào cả. Nếu bạn làm dự án Java, hãy đổi thành `spotlessApply`, `google-java-format` hoặc lệnh format sẵn có trong dự án của bạn. Nếu là dự án Python, có thể là `ruff format`. Hãy bám sát công cụ sẵn có của dự án, đừng tự tạo ra một hệ thống format mới chỉ để viết Hook.

### PreToolUse: Chặn lệnh nguy hiểm và tệp nhạy cảm

`PreToolUse` cung cấp `tool_name` và `tool_input` trước khi công cụ thực thi. Script có thể kiểm tra lệnh và đường dẫn tệp trước, khi phát hiện rủi ro thì từ chối thẳng lần gọi này.

Trước tiên viết một script, ví dụ `.claude/hooks/guard.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

input="$(cat)"
tool="$(jq -r '.tool_name // empty' <<<"$input")"
command="$(jq -r '.tool_input.command // empty' <<<"$input")"
file="$(jq -r '.tool_input.file_path // empty' <<<"$input")"

if [[ "$tool" == "Bash" ]] && [[ "$command" =~ rm[[:space:]]+-rf|chmod[[:space:]]+-R[[:space:]]+777 ]]; then
  echo "Blocked risky shell command: $command" >&2
  exit 2
fi

if [[ "$tool" == "Edit" || "$tool" == "Write" ]]; then
  case "$file" in
    *.env|*.env.*|*/.env|*/.git/*|*id_rsa*|*id_ed25519*)
      echo "Blocked sensitive file edit: $file" >&2
      exit 2
      ;;
  esac
fi

exit 0
```

Cấp quyền thực thi cho nó:

```bash
chmod +x .claude/hooks/guard.sh
```

Sau đó gắn vào `.claude/settings.json` cấp dự án:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/guard.sh"
          }
        ]
      }
    ]
  }
}
```

Đoạn script này đứng trước khi công cụ thực thi và thể hiện kết quả xử lý qua giá trị trả về. Khi phát hiện rủi ro, nó ghi lý do ra stderr và thực hiện `exit 2`; Claude Code sẽ ngăn chặn lần gọi công cụ này, đồng thời phản hồi lý do lại cho Claude.

Trong dự án thực tế, danh sách nhạy cảm cần chỉnh sửa theo thực tế của bạn: cấu hình production, tệp thông tin đăng nhập, script migration, tệp lock, cấu hình CI đều có thể dần dần bổ sung vào.

Đừng chỉ dựa vào một danh sách đen câu lệnh để phòng thủ. Chẳng hạn chỉ chặn `rm *` không có nghĩa là chặn được `/bin/rm` hay `find -delete`. Các thao tác rủi ro cao tốt nhất nên kết hợp đồng thời giới hạn đường dẫn, cấu hình quyền hạn, Hooks, Sandbox, CI và Review từ con người.

## Cách lựa chọn Hook không phải command

`command` thích hợp cho các tác vụ tất định có thể hoàn thành ngay trên máy cục bộ, các ví dụ về format, thông báo và chặn lệnh ở trên đều thuộc nhóm này. Script có thể debug độc lập và dễ đưa vào code review.

Khi đội ngũ cần thu thập tập trung bản ghi audit hoặc thực thi chính sách từ xa, bạn có thể dùng `http`. Phần JSON body mà server trả về sẽ được xử lý giống như đầu ra JSON của command hook. Bản thân HTTP status code không chịu trách nhiệm chặn lệnh gọi công cụ; server cần trả về mã 2xx và cung cấp các trường quyết định đúng schema trong response body.

`mcp_tool` dùng để gọi các MCP server đã được kết nối. Nó không kích hoạt OAuth cũng không tự thiết lập kết nối cho bạn. Các sự kiện như `SessionStart`, `Setup` diễn ra rất sớm, nếu lúc đó MCP server chưa sẵn sàng thì lệnh gọi sẽ thất bại ngay.

`prompt` dựa vào input của Hook để thực hiện một lần phán đoán của mô hình, ví dụ kiểm tra tác vụ đã xong chưa trước khi Stop. Khi việc xác minh còn đòi hỏi phải đọc tệp, tìm kiếm code hay chạy lệnh thì có thể dùng `agent`, tuy nhiên tính năng này hiện vẫn đang là experimental.

Khi lựa chọn, trước hết hãy xem căn cứ phán đoán nằm ở đâu: Quy tắc hoàn toàn do các trường đầu vào và script quyết định thì dùng `command`; kết quả cần gửi về dịch vụ của nhóm thì dùng `http`; đã có sẵn công cụ MCP khả dụng thì chọn `mcp_tool`; chỉ khi phán đoán ngữ nghĩa không thể viết thành quy tắc tất định thì mới đưa `prompt` hoặc `agent` vào.

## Phân định rõ ràng giữa Hooks và Skills

Hai khái niệm này cũng cực kỳ dễ bị lẫn lộn.

Skills thông qua `SKILL.md` để mở rộng năng lực cho Coding Agent. Coding Agent trong lúc thực thi tác vụ sẽ chủ động quyết định xem có nên dùng skill liên quan hay không, hoặc bạn có thể gọi thủ công bằng `/skill-name`.

Phần thân của Skill chỉ khi dùng mới được tải vào context (cơ chế tiết lộ tiệm tiến), nên nó rất thích hợp để đúc kết các quy trình dài, danh sách kiểm tra, tri thức dự án, script và tài liệu tham khảo.

![Tiết lộ tiệm tiến trong Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-progressive-disclosure-a73e1cfe.webp)

Nếu muốn hiểu một cách hệ thống về phân công giữa Skills với Prompt, MCP, Function Calling, bạn có thể xem bài [Agent Skills là gì? Khác gì so với Prompt và MCP?](https://javaguide.cn/ai/agent/skills.html).

![Chuỗi thực thi Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-agent-execution-link-4a51fe53.webp)

Hooks tự động thực thi các hành động tại các mốc vòng đời, còn Skills cung cấp các hướng dẫn, script và tài liệu tham khảo cần thiết để hoàn thành một loại tác vụ cho Claude. Hai cơ chế có thể phân biệt theo bảng sau:

![Hooks thích hợp để tự động kích hoạt, hành động cố định và chặn an toàn; Skills thích hợp để tải theo nhu cầu, phán đoán theo ngữ cảnh và quy trình phức tạp](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-vs-skills-responsibilities-6f7a35bc.webp)

| Tiêu chí | Hooks | Skills |
| -------- | ----- | ------ |
| Cách thức kích hoạt | Tự động kích hoạt theo sự kiện vòng đời của Claude Code | Claude tự đánh giá liên quan thì tải, hoặc người dùng gõ `/skill-name` |
| Giá trị cốt lõi | Đảm bảo các hành động cố định diễn ra ổn định và chắc chắn | Bổ sung thêm tri thức quy trình hoặc năng lực chuyên biệt cho Claude |
| Ngữ cảnh phù hợp | Format code, chặn lệnh nguy hiểm, audit quyền hạn, thông báo, log, cổng chất lượng | Quy trình review code, SOP deploy, điều tra sự cố, tra cứu tài liệu, tác vụ phức tạp |
| Phụ thuộc vào mô hình | Thấp, đặc biệt là `command` hook | Cao hơn, Claude cần đọc hiểu và thực thi các chỉ dẫn trong skill |
| Khả năng chặn đứng (block) | Rất phù hợp, nhất là ở `PreToolUse`, `UserPromptSubmit`, `Stop` | Không thích hợp làm cơ chế chặn cứng |
| Rủi ro thường gặp | Matcher quá rộng, script chạy chậm, tự động phê duyệt quá đà | Mô tả không rõ, kích hoạt không chuẩn, quy trình quá dài dòng |

Đặt vào tác vụ thực tế sẽ rất dễ hiểu: Tệp vừa bị `Edit` hoặc `Write` sửa đổi, bạn có thể chuyển thẳng đường dẫn cho Prettier; công cụ chuẩn bị ghi vào `.env`, bạn có thể kiểm tra đường dẫn trước khi thực thi và từ chối. Những thông tin này đều lấy được trực tiếp từ input sự kiện, script không cần phải phỏng đoán.

Còn review code và điều tra timeout của API thì không cố định như vậy. Claude phải đọc code, log và yêu cầu tác vụ trước rồi mới quyết định kiểm tra tệp nào, chạy lệnh gì—loại quy trình này đưa vào Skill sẽ phù hợp hơn nhiều.

Cả hai cũng có thể ghép nối trên cùng một chuỗi công việc: **Skill quy định việc review code cần kiểm tra những gì, còn Hook chịu trách nhiệm chạy formatter sau khi sửa tệp, chặn trước khi chạy lệnh nguy hiểm, và kiểm tra xem đã có kết quả test hay chưa trước khi kết thúc phản hồi.**

## Triển khai thực tế: Hãy chạy ổn định 3 Hook trước

Phiên bản đầu tiên không cần vội vàng phủ kín tất cả các sự kiện vòng đời, chỉ cần áp dụng dần theo thứ tự `Notification`, `PostToolUse`, `PreToolUse` là đủ.

![Khuyến nghị triển khai Claude Code Hooks tiệm tiến theo thứ tự Notification -> PostToolUse -> PreToolUse](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-progressive-rollout-c7b531e8.webp)

Càng cấu hình nhiều Hook thì khi xảy ra sự cố càng khó định vị. Ví dụ Claude đột nhiên không phản hồi, bạn phải xác nhận từng thứ: `PreToolUse` có trả về deny không, `PermissionRequest` có đưa ra quyết định quyền hạn không, `Stop` có bị lặp liên tục không, có script `PostToolUse` nào chạy bị timeout không. Những vấn đề này nhìn bề ngoài rất giống nhau, nhưng cách xử lý lại hoàn toàn khác biệt.

Trước tiên hãy gắn `Notification`. Ví dụ phía trên chỉ gửi thông báo khi chờ ủy quyền, không hề động vào tệp dự án. Nhận được thông báo, tối thiểu bạn xác nhận được cấu hình đã nạp thành công, sự kiện và matcher đã khớp. Cho dù có viết sai thì ảnh hưởng cũng rất nhỏ.

Sau khi thông báo hoạt động bình thường, hãy nối `PostToolUse` vào công cụ format sẵn có của dự án. Dự án frontend dùng Prettier, dự án Python dùng Ruff, dự án Java tiếp tục dùng các lệnh format cũ. Matcher chịu trách nhiệm giới hạn tên công cụ, script lọc theo loại tệp, tránh để một lệnh Bash không liên quan hay thao tác đọc tệp cũng kích hoạt formatter.

Cuối cùng mới kiểm thử `PreToolUse`, vì nó sẽ trực tiếp chặn đứng các lệnh gọi công cụ. Giai đoạn đầu chỉ chặn vài loại thao tác rủi ro cao rõ ràng, chẳng hạn lệnh xóa, nâng quyền đệ quy, truy cập vào `.env`, `.git/`, private key và cấu hình production. Hãy quan sát kết quả chặn từ log trước, sau đó dựa vào các trường hợp chặn nhầm để tinh chỉnh quy tắc.

Danh sách đen câu lệnh chỉ nhận diện được những dạng lệnh đã viết sẵn, đổi cách viết khác là có thể bị lọt. Giới hạn đường dẫn, cấu hình quyền hạn, sandbox và review thủ công từ con người vẫn bắt buộc phải duy trì, không thể vì đã thêm `PreToolUse` mà bỏ qua.

Sau khi 3 Hook này chạy ổn định, lúc đó hãy căn cứ vào các vấn đề thực tế phát sinh trong dự án để bổ sung thêm sự kiện. Sau khi nén context hay bị mất quy tắc, bạn có thể dùng `SessionStart` với matcher `compact` để tiêm lại, khi cần thiết dùng `PreCompact` để lưu trạng thái. Cần theo dõi thay đổi cấu hình thì gắn `ConfigChange`; khi thư mục làm việc hoặc tệp thay đổi ảnh hưởng đến môi trường, hãy cân nhắc dùng `CwdChanged`, `FileChanged` kết hợp với `CLAUDE_ENV_FILE`.

Nếu dùng `Stop` để kiểm tra việc hoàn thành, trong script bắt buộc phải viết rõ điều kiện thoát. Nếu không, Hook bảo Claude tiếp tục xử lý, lượt sau kết thúc lại trúng đúng quy tắc đó, dẫn đến lặp đi lặp lại. Claude Code sau 8 lần liên tiếp bị chặn sẽ ép kết thúc lượt, nhưng các lần xử lý lặp lại trước đó vẫn làm lãng phí thời gian và token.

`PermissionRequest` cũng rất dễ dùng sai. Nó kích hoạt khi công cụ bước vào quy trình quyết định quyền hạn, không đồng nghĩa với việc hộp thoại xác nhận đã hiện ra; subagent chạy nền phi tương tác không thể hiện hộp thoại cũng có thể chạy Hook này.

Lệnh `claude -p` thông thường không có luồng popup này, khi cần tự động quyết định quyền hạn nên đưa quy tắc vào `PreToolUse`. Ví dụ chính thức chỉ tự động duyệt `ExitPlanMode`. Khi tham khảo ví dụ, phải giữ lại matcher và kiểm tra dữ liệu đầu vào, đừng dùng một quy tắc allow lỏng lẻo để ôm đồm mọi yêu cầu quyền hạn. Việc xóa tệp, thao tác trên môi trường production, đọc thông tin đăng nhập hoặc gọi API bên ngoài để ghi dữ liệu vẫn nên để con người xác nhận sẽ an toàn hơn.

## Cách xử lý khi Hook không hoạt động như kỳ vọng

Cấu hình đã viết vào nhưng Claude Code không có phản ứng gì; hoặc Hook rõ ràng đã chạy nhưng lệnh nguy hiểm vẫn tiếp tục được thực thi. Những chi tiết như sự kiện có những trường nào, handler nào hỗ trợ sự kiện nào, stdout có đi vào context không... phụ thuộc vào từng phiên bản, khi dùng cứ để AI đối chiếu tài liệu chính thức hiện tại để kiểm tra.

Khi thực sự gặp lỗi, mình khuyên bạn nên kiểm tra theo trình tự sau:

![Quy trình chẩn đoán lỗi Claude Code Hook: Kiểm tra tải cấu hình -> Chạy script độc lập -> Kiểm tra matcher](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-troubleshooting-flow-ce2a8586.webp)

1. Trước tiên chạy lệnh `/hooks` để xác nhận cấu hình đã được tải và gắn đúng vào sự kiện mong muốn hay chưa. Nếu ở đây không thấy, hãy kiểm tra lại vị trí tệp settings và cú pháp JSON, tạm thời chưa cần bận tâm đến logic script.

   ![Minh họa menu /hooks trong tài liệu chính thức giúp xem sự kiện, matcher, handler và nguồn cấu hình](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/hooks-menu-official-docs-b4560e95.png)

2. Tách script ra khỏi Claude Code để chạy độc lập. Script Hook sẽ đọc JSON từ stdin, hãy xác nhận xem nó có đọc được các trường và trả về mã thoát như mong muốn hay không rồi mới gắn lại vào cấu hình:

   ```bash
   printf '%s\n' '{"tool_name":"Bash","tool_input":{"command":"rm -rf /tmp/demo"}}' \
     | .claude/hooks/guard.sh

   echo $?
   # Dự kiến đầu ra là 2
   ```

3. Nếu script chạy độc lập bình thường, hãy ghi lại dữ liệu sự kiện thực tế mà Claude Code truyền vào. Ghi thông tin debug ra `stderr` hoặc tệp log tạm thời, đừng để lẫn vào `stdout` vốn dùng để trả về JSON:

   ```bash
   input="$(cat)"
   printf '%s\n' "$input" >> /tmp/claude-hook-debug.log
   ```

   Trong log có thể chứa đường dẫn tệp, câu lệnh và nội dung Prompt, điều tra xong nhớ xóa đi, đừng commit vào kho mã nguồn.

4. Mỗi lần chỉ bật thử nghiệm một Hook duy nhất. Khi nhiều Hook cùng khớp, chúng sẽ chạy song song, chỉ nhìn biểu hiện cuối cùng sẽ rất khó biết lỗi do cái nào gây ra. Chạy thông từng script đơn lẻ rồi mới dần dần khôi phục các quy tắc khác.

Nếu đã xuất hiện triệu chứng cụ thể, bạn có thể đối chiếu nhanh mục tương ứng dưới đây:

| Hiện tượng | Ưu tiên kiểm tra |
| ---------- | ---------------- |
| Trong `/hooks` không thấy cấu hình | Vị trí tệp settings, định dạng JSON |
| Đã đăng ký nhưng chưa từng kích hoạt | Sự kiện chọn đúng chưa, matcher có khớp với input thực tế không |
| Script báo lỗi nhưng công cụ vẫn tiếp tục chạy | Có dùng nhầm `exit 1` không; logic chặn an toàn đã đặt ở `PreToolUse` chưa |
| Claude xử lý liên tục không dừng lại | Hook `Stop` có thiếu điều kiện thoát không |
| Mỗi thao tác đều kích hoạt chạy formatter | Matcher bị bỏ quên hoặc viết quá rộng |
| Script thông báo chạy nhưng không hiện popup | Chạy thử thủ công lệnh thông báo, kiểm tra quyền thông báo của hệ điều hành |
| Chế độ tương tác bình thường, `claude -p` bất thường | Đừng phụ thuộc vào `PermissionRequest`, khi cần tự động quyết định hãy đổi sang `PreToolUse` |

Nếu vẫn chưa tìm ra nguyên nhân, bạn có thể gom đầu ra của `claude --version`, cấu hình Hook, script và hiện tượng thực tế đưa cho AI, nhờ nó đối chiếu với tài liệu chính thức hiện tại để rà soát. Trước khi dán, nhớ xóa bỏ khóa bí mật, Token và thông tin nhạy cảm của dự án. Prompt không cần viết quá cầu kỳ:

```text
Tôi đã cấu hình Hook sau đây trong Claude Code <phiên bản>.

Hành vi kỳ vọng: <mong muốn nó làm gì>
Hành vi thực tế: <hiện tại đang xảy ra điều gì>

Cấu hình Hook:
<dán cấu hình>

Script:
<dán script>

Vui lòng tra cứu tài liệu chính thức của Claude Code phiên bản này trước, sau đó lần lượt kiểm tra sự kiện, matcher, các trường đầu vào, mã thoát và định dạng đầu ra JSON.
Chỉ chỉ ra những điểm gây ra vấn đề hiện tại, không mở rộng sang các cấu hình khác.
```

## Tổng kết

Đến đây, bạn chắc hẳn đã nắm được trọng tâm của Hooks: nó sẽ tự động thực thi các hành động cố định tại các mốc then chốt trong vòng đời của Claude Code, ví dụ như format code, kiểm tra lệnh nguy hiểm, thông báo quyền hạn.

Tự động format hãy đặt ở `PostToolUse`, chặn lệnh nguy hiểm và tệp nhạy cảm hãy đặt ở `PreToolUse`, còn khi rời máy tính muốn nhận thông báo kịp thời thì dùng `Notification`.

Theo kinh nghiệm sử dụng của mình, không nên vừa vào đã cấu hình quá nhiều, không có nhiều ý nghĩa mà còn rất dễ gây rối.

Trước tiên hãy chạy ổn định 3 Hook này. Đặc biệt là quy tắc an toàn và phân quyền, thà siết chặt phạm vi rồi bổ sung dần dần, chứ đừng vừa vào đã tự động phê duyệt mọi thao tác. Hooks có thể giúp bạn giữ vững quy trình cố định, nhưng sandbox, cấu hình quyền hạn, CI và review từ con người vẫn bắt buộc phải duy trì.

Còn một điểm rất dễ nhầm lẫn: Quy tắc có thể viết thành script tất định thì giao cho Hook; còn các tác vụ cần kết hợp ngữ cảnh để đánh giá như review code, điều tra sự cố thì tiếp tục để trong Skill. Phân công theo tư duy này thì cấu hình sẽ tinh giản hơn nhiều, và việc xử lý lỗi về sau cũng nhẹ nhàng hơn.
