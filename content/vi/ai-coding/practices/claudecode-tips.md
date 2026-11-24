---
title: "Hướng dẫn sử dụng Claude Code: Cấu hình, Workflow và Kỹ thuật nâng cao"
description: "Kết hợp tài liệu chính thức từ Anthropic và thực tế triển khai dự án, làm rõ cấu hình, phân quyền, MCP, Skills, Sub-Agent, quản lý context và các workflow phổ biến trong Claude Code."
category: Thực chiến lập trình AI
head:
  - - meta
    - name: keywords
      content: Claude Code, lập trình AI, CLAUDE.md, MCP, Skills, Sub-Agent, Agentic Coding, AI-assisted development
lang: vi
sourceRef: zh-ref/ai-coding/practices/claudecode-tips.md
---

Xin chào, mình là Tiểu G. Mấy hôm trước bài viết [Tổng hợp mẹo thực tế khi Vibe Coding](./the-cool-tricks-for-vibe-coding.md) đạt hơn 60k lượt đọc trên WeChat chỉ sau hai ngày, phần bình luận có rất nhiều bạn hỏi về Claude Code.

Vì vậy, bài viết này mình sẽ dành riêng để chia sẻ chi tiết về Claude Code.

Không biết các bạn có giống mình không, hồi mới bắt đầu dùng thật sự thấy rất gượng gạo, thậm chí có phần bài xích: đang quen với sidebar, cây thư mục và bảng diff trực quan trong Cursor hay IntelliJ IDEA, tự nhiên quay trở lại terminal dòng lệnh để cộng tác với AI quả thực không thuận tay chút nào.

Nhưng sau một thời gian dài sử dụng, mình lại nhận ra tầng CLI cực kỳ thích hợp cho các tác vụ dài hơi. Nó có thể chạy cục bộ trên máy, và cũng dễ dàng đưa lên máy chủ từ xa, môi trường container tạm thời, hay trong pipeline CI/CD; cùng một bộ lệnh, cơ chế phân quyền và phương thức kiểm chứng có thể tái sử dụng mà không cần phải viết lại các bước chỉ vì giao diện GUI.

Bây giờ khi dùng Claude Code, mình chỉ cần làm rõ thư mục làm việc, mục tiêu và cách thức nghiệm thu ngay từ đầu, để nó tự đọc code, tự chạy lệnh, cuối cùng mình chỉ cần kiểm tra diff và kết quả test.

Nhưng phiền toái cũng bắt nguồn từ chính điểm này: file `CLAUDE.md` viết quá dài, quyền hạn mở quá rộng, context bị nhồi nhét quá tải, hoặc chia ranh giới Sub-Agent không chuẩn sẽ khiến nó càng chạy càng lệch hướng.

Những nội dung dưới đây đều được đúc kết từ quá trình sử dụng thực tế của mình trong hơn một năm qua, thiên về thực chiến kỹ thuật chứ không chỉ đơn thuần thuật lại tài liệu chính thức.

PS: Claude Code cập nhật rất nhanh, bài viết này được tổng hợp dựa trên tài liệu chính thức của phiên bản v2.1.218 (2026-07-24) và kinh nghiệm thực chiến cá nhân. Các lệnh, chế độ phân quyền, plugin, Auto Mode, Sub-Agent và hành vi Worktree có thể khác nhau tùy theo phiên bản, hệ điều hành, gói tài khoản, provider và kênh cài đặt. Trước khi áp dụng, bạn nên kiểm tra kỹ qua `claude --version`, `claude --help`, `/help` và tài liệu chính thức. Ví dụ `/run`, `/verify` yêu cầu từ v2.1.145+ trở lên; `/code-review` hỗ trợ các mức effort, `--comment` và `--fix`; còn `/simplify` hiện tại phù hợp hơn khi hiểu là cleanup-only review chứ không phải là bản review tìm lỗi correctness bug toàn diện.

Nếu ở các khu vực gặp rào cản truy cập, bạn còn phải cân nhắc về tài khoản, đường truyền mạng, chi phí và độ ổn định của API trung gian. Các mô hình như GLM, MiniMax, Kimi, DeepSeek có thể dùng làm phương án thay thế hoặc bổ trợ; tuy nhiên khi gặp các bài toán sửa đổi code quy mô lớn, tái cấu trúc kiến trúc phức tạp và điều tra lỗi trên chuỗi nghiệp vụ dài, Claude hiện tại vẫn rất đáng để nghiên cứu chuyên sâu.

## `CLAUDE.md` cực kỳ quan trọng

Tốt nhất đừng biến `CLAUDE.md` thành một bản README thứ hai. Nó giống như một cuốn sổ tay lưu ý dành riêng cho Claude Code: những quy tắc mà đọc trong code không thể thấy được, những câu lệnh nó thường xuyên đoán sai, những thư mục tuyệt đối không được chạm vào, hay sửa xong loại code nào thì bắt buộc phải chạy bộ test tương ứng nào.

![CLAUDE.md và AGENTS.md trong dự án phân tích chứng khoán đa agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

Trong dự án của mình, file này thường chỉ giữ lại những nội dung sau: **các quy tắc Claude hay đoán sai, quy ước ngầm không đọc được từ code, quy chuẩn bắt buộc của team, cùng với phiên bản tech stack, câu lệnh thông dụng, đánh đổi kiến trúc và những "cạm bẫy" kinh nghiệm của dự án.**

Tài liệu chính thức khuyến nghị nên kiểm soát độ dài mỗi file `CLAUDE.md` trong phạm vi 200 dòng. File quá dài sẽ ngốn nhiều context và làm giảm khả năng tuân thủ quy tắc. Khi nội dung tiếp tục phình to, hãy tách sang thư mục `.claude/rules/` có cấu hình `paths`, còn các tài liệu tham khảo tần suất thấp thì đưa vào Skills.

![Khuyến nghị của tài liệu chính thức Claude Code về CLAUDE.md](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claudemd-claude-docs-95f47141.png)

Để đánh giá một quy tắc có nên giữ lại hay không, mình luôn tự đặt câu hỏi:

> Nếu xóa dòng này đi, Claude có dễ phạm lỗi hơn không?

Nếu có, hãy giữ lại; nếu không, hãy xóa bỏ ngay.

### Đặt ở đâu cho đúng

`CLAUDE.md` có thể được đặt ở nhiều vị trí khác nhau trong hệ thống file. Thứ tự nạp của Claude Code đi từ phạm vi toàn cục đến cục bộ, đừng chỉ nhìn chăm chăm vào một file ở thư mục gốc dự án:

![Phân cấp và mức độ ưu tiên của CLAUDE.md](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-file-hierarchy-8abb6c01.png)

Tầng ngoài cùng là file cấp tổ chức (organization-level), thường do đội ngũ IT hoặc DevOps ban hành quy chuẩn chung. Đường dẫn trên macOS là `/Library/Application Support/ClaudeCode/CLAUDE.md`, trên Linux/WSL là `/etc/claude-code/CLAUDE.md`, và trên Windows là `C:\Program Files\ClaudeCode\CLAUDE.md`. Các quy tắc này bạn hiếm khi phải can thiệp trong dự án cá nhân.

Tầng tiếp theo là cấp người dùng tại `~/.claude/CLAUDE.md`, thích hợp để đặt các thói quen và sở thích chung của riêng bạn. File cấp dự án đặt tại `./CLAUDE.md` hoặc `./.claude/CLAUDE.md`, bắt buộc phải commit lên Git để cả team cùng chia sẻ. File cấp máy cục bộ `./CLAUDE.local.md` chỉ lưu cấu hình cá nhân của riêng bạn, nhớ thêm vào `.gitignore`. Còn `CLAUDE.md` nằm trong các thư mục con sẽ không bị nạp ngay từ đầu, mà chỉ khi Claude truy cập vào thư mục tương ứng thì mới nạp on-demand (theo nhu cầu).

Tất cả các file này sẽ cùng đi vào context chứ file nạp sau không ghi đè toàn bộ nội dung file trước. Tuy nhiên, quy tắc nào càng gần dự án hiện tại và có phạm vi càng cụ thể sẽ nằm ở phía sau trong chuỗi context, do đó Claude thường sẽ ưu tiên áp dụng hơn.

Ví dụ, quy tắc cấp user ghi "thống nhất dùng space để thụt lề", nhưng quy tắc cấp dự án lại ghi "repository này dùng Tab", thì trong dự án này, Claude sẽ ưu tiên tuân thủ quy tắc của dự án. Tài liệu chính thức cũng khẳng định thứ tự nạp là từ cấp tổ chức, cấp user, rồi mới đến cấp project và local.

Thói quen của mình là commit file `CLAUDE.md` cấp dự án lên Git, chỉ ghi các quy tắc toàn đội ngũ phải tuân thủ. Những sở thích cá nhân—ví dụ muốn commit message viết bằng tiếng Việt—thì đưa vào `CLAUDE.local.md` và thêm vào `.gitignore`.

Với dự án quy mô lớn, bạn nên chia tách:

```text
my-project/
├── CLAUDE.md
├── backend/
│   └── CLAUDE.md
├── frontend/
│   └── CLAUDE.md
└── .claude/
    ├── rules/
    ├── skills/
    └── agents/
```

Thư mục gốc đặt các quy ước toàn cục, thư mục con đặt quy tắc cục bộ. Khi Claude đọc file ở thư mục con nào, nó sẽ nạp hướng dẫn của thư mục đó theo nhu cầu. Cơ chế này rất tối ưu cho các monorepo, giúp code backend, frontend hay admin dashboard không bị chen chúc trong một file duy nhất.

Cũng đừng hiểu nhầm cú pháp `@path`. Nó không hề giúp tiết kiệm context một cách thần kỳ—nội dung được dẫn chiếu cuối cùng vẫn được đưa vào context; nó chỉ giúp việc tổ chức file gọn gàng hơn. Khi một số quy tắc chỉ áp dụng cho thư mục cụ thể, hãy ưu tiên dùng cơ chế nạp theo path như `.claude/rules/` thay vì nhồi nhét tiếp vào file gốc.

### Khởi tạo và bảo trì

Với dự án mới, bạn có thể bắt đầu bằng lệnh:

```bash
/init
```

Claude sẽ quét repository và tạo ra một file `CLAUDE.md` ban đầu. Hãy coi file này là bản nháp, đừng vội commit ngay. Nó có thể đoán sai lệnh build hoặc sao chép lại những thứ đã có sẵn trong README một cách thừa thãi.

Vấn đề dễ mất kiểm soát nhất trong quá trình bảo trì là file cứ ngày một dài ra.

Khi Claude thỉnh thoảng phạm một lỗi nhỏ, đừng vội thêm quy tắc ngay lập tức. Hãy đợi khi vấn đề tương tự lặp lại 2-3 lần và bạn có thể dùng một chỉ dẫn rõ ràng, dứt khoát để chặn đứng nó, lúc đó mới viết vào. Ngược lại, những sự thật hiển nhiên nhìn vào code là thấy, những việc mô hình vốn dĩ đã làm chuẩn, hoặc những quy ước cũ đã lỗi thời thì cần phải xóa đi. Quá nhiều quy tắc sẽ làm loãng những điều cốt lõi nhất.

Nếu Claude đã đọc được quy tắc nhưng không làm theo, hãy xem lại cách diễn đạt có bị chung chung quá không. Câu "cố gắng giữ test đầy đủ" rất mơ hồ; đổi thành "sau khi sửa Service bắt buộc phải chạy unit test tương ứng và xuất lệnh cùng kết quả" thì dễ thực thi hơn nhiều. Nếu cùng một quy tắc bị vi phạm lặp đi lặp lại qua nhiều session, hãy kiểm tra xem file có quá dài hoặc quy tắc bị đặt sai phạm vi không.

Mình chia quy tắc thành hai loại: yêu cầu cấp team, có hiệu lực dài hạn và cần chia sẻ thì viết vào `CLAUDE.md`; sở thích cá nhân, kinh nghiệm debug theo giai đoạn và nhắc nhở tạm thời thì giao cho Auto Memory hoặc cấu hình cục bộ. `CLAUDE.md` tốt nhất nên xuất phát từ các lỗi thực tế và phải được định kỳ dọn dẹp các nội dung không còn phù hợp.

Sau khi viết xong quy tắc, đừng mặc định là nó đã có hiệu lực. Hãy dùng `/context` để kiểm tra xem session hiện tại thực sự đã nạp những file `CLAUDE.md`, `CLAUDE.local.md` và rules nào; `/memory` chủ yếu dùng để xem và chỉnh sửa vị trí cấu hình của rules và memory. Nếu một file không xuất hiện trong kết quả của `/context`, Claude ở lượt này hoàn toàn không nhìn thấy nó. Trong các dự án phức tạp sử dụng `.claude/rules/` có `paths`, bạn còn có thể dùng `InstructionsLoaded` Hook để ghi log xem file quy tắc được nạp khi nào và vì sao.

## Quản lý phân quyền cần được coi trọng

### Phân tầng ủy quyền (Tiered Authorization)

Claude Code mặc định sẽ bật xác nhận cho các thao tác nhạy cảm, ví dụ như ghi file, chạy lệnh Bash, gọi công cụ MCP. Ban đầu bạn sẽ thấy hơi phiền, nhưng khi bạn chưa quen với thói quen thực thi của nó thì việc giữ xác nhận sẽ an toàn hơn nhiều.

Mình thường chỉ mở quyền trực tiếp cho các lệnh chỉ đọc, chạy lên không làm hỏng hiện trường. Ví dụ `git diff`, `git status`, `rg` có thể cấp quyền thoải mái; các lệnh kiểm chứng cố định như `mvn test`, `pnpm test`, `npm run lint` cũng có thể cấp quyền tùy theo dự án.

Ngược lại, các thao tác như `rm -rf`, `git push --force`, can thiệp vào thư mục `.git/` mặc định tuyệt đối không mở. Các file `.env`, `secrets/`, artifact build, thư mục chứng chỉ và các file dump dữ liệu nên dùng rule deny để chặn ngay từ đầu.

Quyền hạn có thể cấu hình qua lệnh `/permissions`, hoặc khai báo trong `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["Bash(git status*)", "Bash(git diff*)", "Bash(rg *)"],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Bash(rm -rf *)"
    ]
  }
}
```

Các quy tắc này do tầng thực thi của Claude Code trực tiếp xử lý. Tức là dù trong prompt bạn có dặn dò "xin vui lòng đừng đọc file `.env`" thì đó vẫn chỉ là lời đề xuất; chỉ có rule deny mới thực sự chặn đứng thao tác đó ở tầng runtime.

Bộ phân loại của Auto Mode cũng sẽ tham khảo ranh giới bạn đặt ra trong cuộc trò chuyện, nhưng đó không phải là bảo đảm tuyệt đối. Những ranh giới sống còn tốt nhất nên viết vào `permissions.deny` hoặc dùng Hook để chặn trước khi gọi công cụ. Khi session dài bị nén lại, các hạn chế bạn dặn dò tạm thời trong đoạn chat cũng rất dễ bị nén mất.

### Auto Mode

Nếu việc bấm xác nhận liên tục làm gián đoạn nhịp làm việc, bạn có thể cân nhắc dùng Auto Mode.

Theo tài liệu chính thức hiện tại, CLI hỗ trợ phím tắt `Shift+Tab` để chuyển đổi chế độ phân quyền; khi tài khoản, model, provider và cấu hình tổ chức đáp ứng đủ điều kiện thì `auto` mới xuất hiện trong vòng lặp chuyển đổi. Trong môi trường Team / Enterprise, quản trị viên có thể bật hoặc khóa tính năng này.

Nguyên lý của Auto Mode là dùng một classifier riêng để đánh giá mức độ rủi ro của thao tác, tự động cho qua các thao tác rủi ro thấp; còn việc tải và chạy code lạ, gửi dữ liệu nhạy cảm ra endpoint bên ngoài, deploy production, force push, hoặc push thẳng vào `main` sẽ bị chặn lại hoặc chuyển sang xác nhận thủ công.

Tuy nhiên Auto Mode không cung cấp sandbox bảo mật và không đảm bảo không có phán đoán sai. Mục tiêu của nó là "giảm bớt thao tác bấm xác nhận", chứ không có nhiệm vụ cô lập filesystem, mạng hay credential. Các tác vụ rủi ro cao vẫn phải dựa vào container, tài khoản tạm thời, nguyên tắc đặc quyền tối thiểu (least privilege), rule deny, Hooks và sự can thiệp review của con người.

Nếu muốn mặc định vào Auto Mode, bạn cũng đừng ghi `"defaultMode": "auto"` vào `.claude/settings.json` hay `.claude/settings.local.json` của dự án. Phiên bản v2.1.142+ sẽ bỏ qua cấu hình `auto` từ các nguồn này để tránh trường hợp repository tự cấp quyền tự động cho chính nó. Hãy đặt cấu hình đó ở file user `~/.claude/settings.json` hoặc cấu hình do tổ chức quản lý. Các provider như Bedrock, Vertex AI, Microsoft Foundry còn có thể cần thiết lập thêm biến môi trường `CLAUDE_CODE_ENABLE_AUTO_MODE=1`.

Các tham số khởi động cũng không nên viết cứng. Các phiên bản, kênh cài đặt và provider khác nhau có thể hỗ trợ permission mode khác nhau; trong script tốt nhất nên dùng `claude --help` hoặc tài liệu chính thức để xác nhận giá trị khả dụng. Khi làm việc tương tác, mình thích dùng `Shift+Tab` trong session hơn là viết cờ phân quyền cao vào script.

Mình khuyên bạn không nên dùng cờ `--dangerously-skip-permissions` trong công việc thường ngày. Trừ khi bạn đã cô lập hoàn toàn filesystem, mạng và credential, nếu không chỉ một lệnh thao tác nhầm cũng có thể ghi đè vào file không mong muốn hoặc đọc phải thông tin bảo mật nhạy cảm.

## Ranh giới an toàn

Credential production, mật khẩu database, token dài hạn của cloud provider tuyệt đối không cung cấp trực tiếp cho Claude; môi trường production cũng đừng để nó đụng tới, trừ khi việc đó đã có quy trình phê duyệt và kiểm toán chặt chẽ.

Phía Git cũng cần siết chặt. Không cho phép nó mặc định push lên `main`, càng không biến việc force-push remote branch thành một hành động tùy tiện. Các script từ xa không rõ nguồn gốc, đặc biệt là kiểu viết `curl | bash`, tốt nhất chỉ nên thử nghiệm trong môi trường cô lập.

Phạm vi đọc file cũng phải kiểm soát nghiêm ngặt. `.env`, `secrets/`, thư mục chứng chỉ, SSH key, database dump, log production tuyệt đối không nên nằm trong phạm vi đọc mặc định của Claude.

Không chỉ riêng `.env`, những đường dẫn như `~/.aws/`, `~/.gcp/`, `~/.kube/`, `~/.ssh/`, file Maven `settings.xml`, npm token, log production và dump database đều không được phép để lộ tùy tiện. Nếu bắt buộc phải cho nó xem log, hãy chủ động mask (che mờ) thông tin nhạy cảm, cắt ngắn và giới hạn phạm vi trước.

Khi thực sự cần tự động hóa các tác vụ quyền cao, hãy đưa vào container, dùng credential tạm thời và tài khoản có quyền tối thiểu. Như vậy dù câu lệnh có chạy sai thì phạm vi ảnh hưởng vẫn nằm trong tầm kiểm soát.

## Phân biệt MCP, Skills, Sub-Agent và Plugin

Hệ sinh thái xung quanh Claude Code có rất nhiều khái niệm, người mới rất dễ bị nhầm lẫn. Cách phân chia của mình cụ thể như sau:

| **Cơ chế** | **Giải quyết vấn đề gì** | **Phù hợp chứa cái gì** | **Không phù hợp chứa cái gì** |
| --- | --- | --- | --- |
| `CLAUDE.md` | Bối cảnh nền tảng cần biết trong mỗi session | Lệnh build, quy ước thư mục, quy tắc team | Quy trình tác vụ nhiều bước phức tạp |
| Rules | Nạp quy tắc cục bộ theo đường dẫn | Quy tắc frontend, backend, ràng buộc bảo mật | Quy ước cốt lõi toàn bộ dự án phải xem |
| Skills | Các bước tác vụ có thể tái sử dụng | TDD, Code Review, viết bài, dựng giao diện | Kiến thức nền tảng vĩnh viễn |
| MCP | Kết nối với hệ thống bên ngoài | GitHub, Sentry, Notion, Figma, database | Quy tắc file thông thường tại cục bộ |
| Sub-Agent | Cô lập context cho tác vụ phụ trợ | Tìm kiếm code, kiểm tra chuyên biệt, nghiên cứu song song | Những sửa đổi nhỏ nhặt một lần |
| Hooks | Hành động thực thi mang tính bắt buộc | Chặn lệnh nguy hiểm, format sau khi sửa, test trước khi thoát | Lời khuyên chỉ mang tính tham khảo |
| Plugin | Đóng gói và phân phối nhóm tiện ích | Bộ kết hợp gồm Skills, MCP, Hooks, script | Gói quyền hạn bên thứ ba chưa được kiểm duyệt |

Ví dụ "mỗi lần sửa file xong bắt buộc phải chạy formatter", nếu viết vào `CLAUDE.md` thì chỉ nhắc Claude nhớ, còn viết thành Hook thì mới đảm bảo tự động kích hoạt sau khi sửa file. Hoặc như "quy trình sửa GitHub Issue", nếu nhét vào `CLAUDE.md` sẽ làm ô nhiễm tất cả các session, đóng gói thành Skill sẽ hợp lý hơn nhiều.

### Code Intelligence: Giúp Claude bớt phụ thuộc vào tìm kiếm văn bản thuần túy

Nếu dự án có thể dùng Code Intelligence, hãy cố gắng cấu hình nó. Việc này tương đương với việc kết nối Claude với một Language Server (LSP): kiểm tra lỗi kiểu (type error), tìm định nghĩa biểu tượng (symbol definition), tra cứu quan hệ tham chiếu mà không cần lần nào cũng phải dùng `rg` grep qua hàng loạt file.

Lấy dự án Java hoặc TypeScript làm ví dụ, khi Claude muốn biết một class được định nghĩa ở đâu, được những ai gọi, nó không nhất thiết phải tìm từ khóa rồi mở từng file ra xác nhận. Nhờ có LSP, nó có thể nhảy trực tiếp đến định nghĩa, xem tham chiếu, và sau khi sửa code còn phát hiện ngay lỗi type.

Nó không thay thế hoàn toàn tìm kiếm văn bản, nhưng giúp giảm thiểu việc đọc các file không liên quan. Dự án càng lớn, context sẽ càng sạch sẽ và Claude không bị phân tâm bởi một đống file tìm kiếm tràn lan. Tài liệu chính thức cũng khuyến nghị các ngôn ngữ có định kiểu (typed languages) nên cài đặt plugin Code Intelligence, vì một lần nhảy symbol thường tiết kiệm được một lần tìm kiếm kèm việc đọc nhiều file.

Tuy nhiên, plugin Code Intelligence không phải cứ cài là xong. Máy của bạn cần có binary của language server tương ứng, ví dụ Java cần `jdtls`, TypeScript cần `typescript-language-server`. Nếu trong tab Errors của `/plugin` xuất hiện lỗi `Executable not found in $PATH`, thường là do binary này chưa được cài đặt.

### MCP: Giúp Claude kết nối với thế giới thực

MCP (Model Context Protocol) quản lý việc kết nối với các hệ thống bên ngoài. Hệ thống bên ngoài cung cấp một MCP Server, các client như Claude Code khi kết nối vào sẽ thấy và gọi được các công cụ bên trong đó.

![Minh họa MCP](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

Đây là phương thức chính để Claude Code kết nối với công cụ ngoại vi: tra cứu database, đọc lỗi từ Sentry, điều khiển browser, lấy tài liệu Notion, hay đọc bản thiết kế Figma.

Lệnh thêm một MCP server từ xa có dạng như sau:

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp \
  --header "Authorization: Bearer your-token"
```

Chuỗi `your-token` ở đây chỉ mang tính minh họa. Trong dự án thực tế, tuyệt đối không viết token trực tiếp vào shell history.

Trong dự án team, các cấu hình MCP dùng chung có thể đưa vào file `.mcp.json` rồi commit lên repository. Ví dụ dự án thống nhất kết nối Notion, Sentry, hệ thống tài liệu nội bộ, thì tên server, URL, transport là những cấu hình công khai nên được lưu lại.

Những cấu hình chứa token, secret, chuỗi kết nối database tuyệt đối không commit vào `.mcp.json`. Cách an toàn hơn là đặt ở cấu hình cấp user, biến môi trường cục bộ, hệ thống quản lý secret, hoặc dùng luồng xác thực OAuth do chính MCP server đó hỗ trợ.

Hãy dùng MCP một cách có chừng mực. Càng nhiều công cụ, Claude càng dễ chọn nhầm và càng khó kiểm toán. Bình thường bạn có thể dùng `/mcp` để xem trạng thái kết nối, bật/tắt server; còn để xem chi tiết chi phí và dung lượng sử dụng, hãy dùng `/usage` để phân tích theo skill, subagent, plugin, MCP server. Những server ít dùng hãy chủ động ngắt kết nối.

### Skills: Lưu trữ các quy trình lặp đi lặp lại

Đừng nhầm lẫn giữa file quy tắc và Skill.

File quy tắc chứa các ràng buộc dài hạn: phiên bản công nghệ, lệnh khởi động, cấu trúc thư mục, định dạng mã lỗi, những file cấm chỉnh sửa.

Skill chứa các bước thực hiện tác vụ: code review, viết unit test, sửa giao diện frontend, nghiên cứu tài liệu web, viết bài kỹ thuật. Những tác vụ này mỗi lần thực hiện đều có quy trình tương tự nhau, không cần thiết phải nhắc đi nhắc lại trong đoạn chat.

Skill là một bản hướng dẫn tác vụ được nạp on-demand (khi cần mới nạp). Một loại tác vụ thực hiện như thế nào, có những ràng buộc gì, cần kiểm tra những điểm nào, từng gặp phải lỗi gì, đều được viết trong `SKILL.md`.

Điểm khác biệt giữa Skill và `CLAUDE.md` nằm ở thời điểm nạp. Mặc định Claude chỉ nhìn thấy tên và mô tả của Skill để phán đoán xem có nên gọi hay không; chỉ khi gọi Skill đó thì nội dung chính của `SKILL.md` và tài nguyên liên quan mới thực sự đi vào context. Skill cấp user đặt tại `~/.claude/skills/`, còn cấp project đặt tại `.claude/skills/`.

Cần lưu ý một thay đổi về phiên bản: các custom command trong Claude Code đã được hợp nhất vào Skills. Cả `.claude/commands/deploy.md` và `.claude/skills/deploy/SKILL.md` đều có thể tạo ra lệnh dạng `/deploy`; thư mục cũ `.claude/commands/` vẫn dùng được, nhưng nội dung mới khuyến nghị nên tổ chức theo định dạng Skill.

![Chuỗi thực thi Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-agent-execution-link-ee22c892.png)

Những quy trình có tính lặp lại cao đều nên đúc kết thành Skill: trước khi viết tính năng cố định áp dụng TDD (viết test fail trước rồi mới code); khi code review cố định kiểm tra bảo mật, transaction, hiệu năng và điều kiện biên; khi viết bài kỹ thuật cố định đối chiếu nguồn dẫn chứng, trích dẫn, cấp độ tiêu đề và hạn chế văn phong AI.

Cách làm này ổn định hơn nhiều so với việc mỗi lần chat lại paste một danh sách nhắc nhở dài ngoằng. Định nghĩa chính thức của Anthropic về Skill cũng mang hàm ý này: một tập hợp các chỉ dẫn, script và tài nguyên có thể tái sử dụng để Claude xử lý một loại tác vụ theo các bước cố định.

Bạn cũng có thể tận dụng các Skill có sẵn từ cộng đồng (như Superpowers đóng gói sẵn TDD, Code Review, Spec-Driven, Git Worktree, cộng tác Sub-Agent).

Tuy nhiên, đừng tùy tiện tải Skill bên thứ ba về là chạy ngay. File `SKILL.md` bản chất là các chỉ dẫn, nếu bên trong chứa lệnh nguy hiểm, script mờ ám hoặc đòi quyền quá rộng, Agent có thể sẽ làm theo. Trước khi cài đặt, hãy xem qua nội dung, thư mục `scripts/` và `references/` để chắc chắn nó không vượt quyền.

### Plugin: Ưu tiên tìm trong official marketplace

Nếu không muốn tự tay cấu hình Skills, MCP, Hooks từ đầu, bạn có thể tham khảo chợ plugin chính thức của Claude Code tại [`claude-plugins-official`](https://github.com/anthropics/claude-plugins-official).

Cài đặt rất đơn giản:

```bash
/plugin install <name>@claude-plugins-official
```

Plugin giúp tiết kiệm thời gian lắp ráp. Trong một plugin có thể đã đóng gói sẵn Skill, MCP Server, Hooks và một số script phụ trợ, cài xong là Claude có ngay một bộ workflow hoàn chỉnh.

Nhưng plugin cuối cùng vẫn chạy trên máy cục bộ của bạn, một số plugin còn can thiệp vào filesystem, browser, GitHub, database hoặc dịch vụ bên thứ ba. Trước khi cài hãy xem kỹ mô tả, quyền hạn và mã nguồn; không dùng nữa thì gỡ bỏ để tránh dư thừa công cụ. Bạn có thể tham khảo tài liệu [Discover plugins](https://code.claude.com/docs/en/discover-plugins) để tìm hiểu thêm.

### Sub-Agent: Giữ cho cuộc hội thoại chính luôn sạch sẽ

Mình sử dụng Sub-Agent rất thường xuyên.

![Claude Code Sub-Agent: Giữ cho cuộc hội thoại chính luôn sạch sẽ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claudecode-sub-agent-ff5f7472.png)

Khi điều tra các vấn đề phức tạp, Claude thường phải đọc hàng chục file, grep một lượng lớn code và chạy nhiều câu lệnh. Cuộc hội thoại chính sẽ nhanh chóng bị lấp đầy bởi log, kết quả tìm kiếm và nội dung file, dẫn đến việc khi quay lại viết code, nó rất dễ bị "loãng" và mất phương hướng.

Những tác vụ nhánh này nên giao cho Sub-Agent. Nó có context riêng biệt, có thể tự đọc code, tra log, phân tích lỗi độc lập, và khi kết thúc chỉ báo cáo kết luận cô đọng về hội thoại chính.

Trong các subagent tích hợp sẵn của Claude Code, phổ biến nhất là Explore, Plan và general-purpose. Các subagent này đều kế thừa quyền hạn từ session cha nhưng áp dụng giới hạn công cụ riêng:

| **Subagent** | **Mô hình** | **Công cụ / Quyền hạn** | **Mục đích sử dụng** |
| --- | --- | --- | --- |
| **Explore** | Haiku, tối ưu tốc độ và độ trễ thấp | Chỉ đọc (read-only), không có Write / Edit | Khám phá file, tìm kiếm code, rà soát repo |
| **Plan** | Kế thừa mô hình của hội thoại chính | Chỉ đọc (read-only), không có Write / Edit | Nghiên cứu codebase trong Plan Mode |
| **general-purpose** | Kế thừa mô hình của hội thoại chính | Kế thừa công cụ session cha, vẫn chịu kiểm soát quyền | Nghiên cứu phức tạp, thao tác nhiều bước, sửa code |

Explore và Plan thiên về nghiên cứu chỉ đọc, không trực tiếp sửa code. Tài liệu chính thức còn có một chi tiết đáng chú ý: Explore và Plan sẽ bỏ qua file `CLAUDE.md` và git status của session cha, giúp việc tìm kiếm code và thu thập context diễn ra nhanh chóng; các subagent built-in khác và custom subagent sẽ nạp đầy đủ các nội dung này.

general-purpose có phạm vi rộng hơn, có thể khám phá, chạy lệnh và sửa code. Trước khi dùng nó, bạn nên làm rõ thư mục nào được đọc, file nào không được sửa, có cho phép ghi hay không, và kết quả cuối cùng chỉ cần kết luận hay phải bắt tay vào code luôn. Muốn ràng buộc chặt chẽ, không thể chỉ dựa vào prompt mà phải kết hợp cấu hình `tools` / `disallowedTools`, permission mode, `permissions.deny` hoặc Hooks.

Bạn cũng có thể tự tạo subagent cho riêng mình. Cấu hình cấp dự án đặt tại `.claude/agents/` để chia sẻ cho cả team; cấu hình cấp user đặt tại `~/.claude/agents/` để tái sử dụng xuyên suốt các dự án. Mỗi subagent đều có thể cấu hình system prompt, quyền công cụ, mô hình và điều kiện kích hoạt.

Kịch bản mình hay dùng nhất là để subagent chạy test suite, chỉ mang về các test case thất bại và thông báo lỗi; hoặc để các subagent khác nhau nghiên cứu độc lập các module auth, database, API, rồi tổng hợp kết luận về hội thoại chính. Với tác vụ phức tạp hơn, có thể để code-reviewer subagent tìm vấn đề hiệu năng trước, sau đó để optimizer subagent thử sửa đổi.

Khi nhiệm vụ quá nhỏ, ranh giới chưa rõ ràng hoặc code đang thay đổi liên tục thì không nhất thiết phải tách subagent. Hội thoại chính giữ vai trò nắm giữ mục tiêu, ra quyết định và nghiệm thu; subagent chỉ xử lý các chuyên đề cục bộ, rõ ràng và có thể báo cáo kết quả dứt điểm.

Sau này khi dùng đến Agent teams, bạn có thể xem đó là mô hình cộng tác đa session. Sub-Agent dùng để cô lập tác vụ nhánh, còn Agent teams dùng để nhiều session độc lập cùng phối hợp quanh một danh sách nhiệm vụ chung. Khi mới bắt đầu đừng vội vã, hãy làm chủ Worktree, commit từng bước nhỏ và nhịp độ kiểm chứng trước đã.

Một subagent kiểm tra bảo mật tùy chỉnh có thể viết như sau:

```markdown
---
name: security-reviewer
description: Reviews Java and Spring Boot code for security risks.
tools: Read, Grep, Glob, Bash
model: opus
---

Review the target diff for:

- SQL injection and unsafe dynamic queries.
- Authentication and authorization bypass.
- Secrets or credentials committed to code.
- Unsafe deserialization or command execution.

Return concrete file and line references. Do not rewrite code unless explicitly asked.
```

Trong dự án thực tế, danh sách `tools` của subagent nên thu hẹp tối đa. Nếu chỉ làm code review thì thường không cần `Edit` / `Write`. Khi thiết lập đồng thời cả `tools` và `disallowedTools`, `disallowedTools` sẽ được ưu tiên áp dụng trước; nếu một công cụ xuất hiện ở cả hai bên, cuối cùng nó sẽ bị loại bỏ.

### Hooks: Xử lý các quy tắc mang tính cưỡng chế

Hooks rất dễ bị bỏ quên nhưng lại cực kỳ đắc lực trong dự án thực tế. Nó có thể thực thi hành động tại các mốc vòng đời của Claude Code, ví dụ như trước khi gọi tool, sau khi sửa file, trước khi kết thúc session, hoặc trước/sau khi nén context.

Lấy ví dụ, giả sử Claude Code chuẩn bị chạy lệnh:

```bash
rm -rf /tmp/build
```

`PreToolUse` Hook sẽ đón bắt lệnh gọi Bash này trước, đánh giá xem nó có nguy hiểm không; nếu vi phạm quy tắc, Hook trả về `deny`, Claude Code sẽ hủy bỏ lệnh gọi này và thông báo lý do từ chối cho Claude biết.

Sơ đồ dưới đây trích từ tài liệu Hooks chính thức của Claude Code mô tả chính xác chuỗi xử lý này:

![Claude Code PreToolUse Hook](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-runs-rm-rf-tmp-build-what-happens-520c7930.svg)

Mình thường giao cho Hook các nhóm hành động: tự động format sau khi sửa file, chạy test trước khi kết thúc session, cấm sửa đổi `migrations/` hoặc `.github/workflows/`, chặn các lệnh nguy hiểm như `curl | bash`, `rm -rf`, ngăn chặn gửi dữ liệu nhạy cảm ra ngoài, hoặc tiêm thêm context khi Sub-Agent khởi động.

Những việc mang tính cưỡng chế bắt buộc hãy giao cho Hook; những điều chỉ mang tính tham khảo bối cảnh mới viết vào `CLAUDE.md`.

Nếu viết HTTP Hook, bạn cần lưu ý một điểm bẫy: không thể dựa vào mã HTTP 4xx / 5xx để chặn tool call. Các mã lỗi non-2xx, lỗi rớt mạng hay timeout của HTTP Hook đều bị coi là lỗi không chặn (non-blocking error) và quá trình thực thi vẫn sẽ tiếp tục. Muốn chặn tool call, Hook phải trả về HTTP 2xx với trường JSON `decision: "block"`, hoặc trong `hookSpecificOutput` có `permissionDecision: "deny"`.

## Các Workflow thông dụng nhất

### Khám phá, Lập kế hoạch, Thực thi, Kiểm chứng (Explore, Plan, Execute, Verify)

Với các nhiệm vụ phức tạp, đừng bao giờ vừa vào là bảo Claude viết code ngay. Hãy để nó đọc repository trước và tạm thời không sửa đổi file:

```text
Vào plan mode. Hãy đọc src/auth và các bài test liên quan để nắm rõ luồng refresh token đăng nhập.
Tuyệt đối không sửa code, chỉ báo cáo luồng hiện tại, các file liên quan và các điểm có thể cần sửa đổi.
```

Sau khi nó đọc xong, mới yêu cầu lên kế hoạch:

```text
Tôi muốn sửa lỗi refresh token thất bại sau khi user session bị timeout.
Dựa vào những gì vừa đọc, hãy liệt kê các file cần sửa, chiến lược viết test và các điểm rủi ro.
```

Bạn xác nhận kế hoạch xong mới cho thực thi:

```text
Triển khai theo kế hoạch này. Ưu tiên viết một test case tái hiện được lỗi trước, sau đó mới sửa code.
Hoàn thành xong hãy chạy các bài test liên quan, xuất câu lệnh và kết quả chi tiết.
```

Nhịp làm việc này ban đầu có vẻ chậm hơn một chút, nhưng về sau sẽ tiết kiệm được rất nhiều công sức làm lại. Đặc biệt khi bạn chưa quen thuộc với codebase, hoặc thay đổi nằm trên nhiều module, việc bắt Claude làm rõ luồng gọi, điểm rủi ro và chiến lược kiểm thử trước sẽ tránh được tình huống trớ trêu "sửa xong mới nhận ra đi sai hướng".

Với các sửa đổi nhỏ thì có thể bỏ qua bước lập kế hoạch. Sửa một câu chữ giao diện, thêm một dòng log, bổ sung một đoạn kiểm tra null rõ ràng thì cứ để nó làm trực tiếp. Lập kế hoạch thái quá cho việc nhỏ chỉ làm lãng phí context.

### Lập trình hướng kiểm thử (TDD - Test-Driven Development)

Điểm nguy hiểm nhất của AI khi viết code là nó rất giỏi tạo ra những đoạn code "nhìn có vẻ hợp lý". TDD giúp đóng đinh hành vi kỳ vọng trước, rồi mới ép việc triển khai code phải hướng về việc pass test.

Câu lệnh prompt không cần rườm rà:

```text
Trước mắt chưa sửa code triển khai. Hãy viết một test case thất bại cho TokenRefreshService,
bao phủ kịch bản session đã hết hạn nhưng refresh token vẫn còn hiệu lực.
Sau khi test thất bại, mới tiến hành sửa code triển khai cho đến khi test pass.
```

Nếu bài test chưa từng bị fail trước đó, bạn sẽ rất khó chắc chắn được liệu việc sửa code sau đó có thực sự giải quyết đúng vấn đề hay không. Nếu không, nó có thể sửa một đống code rồi báo "đã sửa xong" trong khi bản chất vẫn sai.

### Để Claude tự xác minh kết quả

Một câu trong tài liệu best practices của Anthropic mà mình rất tâm đắc: **Hãy cung cấp cho Claude một bài kiểm tra có thể thực thi được. Unit test, build, lint, so sánh ảnh chụp màn hình, hoặc output của script đều được.**

Đừng chỉ nói chung chung:

```text
Viết một hàm kiểm tra email hợp lệ.
```

Viết cụ thể như thế này sẽ bớt đi rất nhiều phán đoán mơ hồ:

```text
Viết một hàm kiểm tra email hợp lệ. Các ca kiểm thử:

- hello@gmail.com phải pass
- hello@ phải fail
- @domain.com phải fail
- a@b.co phải pass

Viết xong hãy chạy test, xuất câu lệnh và kết quả chi tiết.
```

Tiêu chuẩn nghiệm thu càng cụ thể, Claude càng ít có cơ hội dừng lại ở mức "trông có vẻ đã xong".

Nếu tác vụ có khả năng chạy dài, bạn có thể kèm thêm câu "thử tối đa 3 vòng, nếu vẫn fail thì dừng lại báo cáo điểm nghẽn", tránh việc nó loay hoay trong hướng đi sai và đốt quá nhiều Token.

### Hỏi đáp về Codebase

Khi tiếp nhận một dự án lạ, mình thường dùng Claude Code như một hướng dẫn viên tạm thời. Đừng vội bắt nó sửa file, hãy hỏi về luồng gọi trước:

```text
Luồng hoàn chỉnh của việc đăng nhập người dùng là gì? Từ khi HTTP request đi vào cho đến khi session được lưu lại,
hãy liệt kê các class và method liên quan, không sửa đổi bất kỳ file nào.
```

Hoặc:

```text
Trong dự án này, state machine của đơn hàng được định nghĩa ở đâu? Các trạng thái chuyển đổi qua lại như thế nào?
Nếu có ràng buộc ngầm định nào, hãy chỉ rõ ra luôn.
```

Nhưng nội dung nó đúc kết vẫn cần bạn kiểm tra xác suất. Các lệnh gọi xuyên service, cấu hình feature flag, hay logic tương thích ngược trong lịch sử là những nơi AI rất dễ giải thích trôi chảy nhưng thực tế lại bỏ sót một nhánh quan trọng.

### Sửa Bug bắt buộc phải cung cấp thông tin lỗi gốc

Khi fix bug, điều tối kỵ nhất là chỉ quẳng một câu:

```text
Đăng nhập bị lỗi rồi, sửa giúp tôi với.
```

Câu này hoàn toàn bắt Claude phải mò mẫm đoán mò. Hãy đưa nguyên liệu thô vào:

```text
Dưới đây là log lỗi production, các bước tái hiện và tham số request liên quan.
Hãy định vị nguyên nhân tiềm năng trước, chưa sửa code vội.
Sau khi tìm ra nguyên nhân gốc rễ, bổ sung một bài test tái hiện được lỗi rồi mới sửa.
```

Log, stack trace, thảo luận trên Slack, output từ Docker, kết quả bài test thất bại đều có giá trị hơn nhiều so với việc bạn thuật lại "hình như là do cache". Càng thuật lại theo suy diễn chủ quan, Claude càng dễ bị bạn dẫn dắt đi chệch hướng.

### Đa instance và Git Worktree

Đừng bắt một session Claude duy nhất phải gánh vác mọi việc. Các tác vụ độc lập với nhau nên được tách ra các session khác nhau chạy song song.

Claude Code hỗ trợ dùng Git Worktree để cô lập các session:

```bash
claude --worktree feature-auth
claude --worktree bugfix-payment
```

Cờ `--worktree` được Claude Code hỗ trợ chính thức, sẽ tạo một worktree riêng biệt dưới `.claude/worktrees/<name>/` (thường trên branch `worktree-<name>`) và khởi động session; nếu muốn tự kiểm soát đường dẫn và branch, bạn có thể dùng lệnh native của Git:

```bash
git worktree add ../project-auth -b feature-auth
cd ../project-auth
claude
```

Mỗi Worktree có thư mục và nhánh riêng biệt. Một session sửa module auth, một session khác fix bug thanh toán, các file sẽ không giẫm chân lên nhau. Ứng dụng Desktop chính thức cũng tự động tạo Worktree cho session mới, cùng chung một tư duy với bản CLI.

![Claude Code Git Worktree](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-git-worktree-685b1929.png)

Nếu bạn có nhiều session chạy nền, hãy dùng:

```bash
claude agents
```

Agent View sẽ gom các session chạy nền vào một màn hình duy nhất, giúp bạn nắm bắt session nào đang chạy, session nào đợi xác nhận, session nào đã xong.

Điểm cần lưu ý: các session chạy nền trước khi sửa file sẽ tự động chuyển vào worktree độc lập trong `.claude/worktrees/`. Nhưng nếu dự án có lượng build artifact khổng lồ hoặc pre-commit hook khắt khe về đường dẫn, việc cô lập liên tục có thể gây chậm chạp. Khi đó bạn có thể đặt `worktree.bgIsolation` thành `"none"` trong `.claude/settings.json` (yêu cầu v2.1.143+) để session chạy nền sửa thẳng vào workspace. Sự đánh đổi là nguy cơ các session đồng thời giẫm lên code của nhau, cần cân nhắc tùy theo dự án.

Nếu bạn dùng `.worktreeinclude` để copy các file bị gitignore như `.env`, `.env.local`, `config/secrets.json` sang worktree mới, hãy chắc chắn rằng bên trong chỉ chứa credential môi trường phát triển cục bộ, không phải credential production. Worktree chỉ cô lập thay đổi file, chứ không cô lập rủi ro rò rỉ secret.

### Commit và PR không nên nhồi nhét quá lớn

Đừng để Claude gom một đống sửa đổi khổng lồ vào một commit duy nhất.

Mình luôn chia nhỏ thành các commit nguyên tử (atomic commits). Một commit chỉ làm đúng một việc. Trước khi commit, yêu cầu Claude tóm tắt diff, nêu lệnh kiểm chứng và rủi ro còn lại, bản thân bạn hãy tự lướt qua `git diff --stat` và `git diff` của các file quan trọng.

Claude viết commit message và mô tả PR rất nhanh, nhưng đừng chỉ nghe nó tự đánh giá. Lời nó nói "chỉ sửa logic auth" không đáng tin bằng việc bạn tự mắt nhìn vào bản diff. Mô tả PR chỉ cần nêu rõ 3 điều: đã sửa gì, đã test thế nào, và còn những chỗ nào chưa bao phủ hết.

## Các lệnh thường dùng

Không cần học vẹt câu lệnh, khi dùng chỉ cần gõ `/` là thấy menu gợi ý. Mình thường ghi nhớ theo hai nhóm chính.

Nhóm thứ nhất là các lệnh cơ bản: `/help` xem môi trường hiện tại có những lệnh nào; `/diff` xem Claude đã sửa những file nào, dòng nào; khi session dài bị chậm hoặc lệch hướng thì xem `/context`, context đầy quá thì dùng `/compact`; liên quan đến quyền hạn thì xem `/permissions`, xem vị trí file quy tắc và memory thì dùng `/memory`, kết nối MCP xem tại `/mcp`, phân tích lượng tiêu thụ Token dùng `/usage`.

Nhóm thứ hai là các lệnh liên quan đến bundled skills và workflow: `/code-review` dùng để quét correctness bug, điều kiện biên và rủi ro tiềm ẩn trong diff hiện tại, có thể truyền mức effort như `/code-review high`; thêm cờ `--comment` để gửi phát hiện thành inline comment trên GitHub PR; thêm cờ `--fix` để áp dụng các gợi ý review vào workspace.

`/simplify` hiện tại phù hợp hơn khi coi là cleanup-only review, dùng để dọn dẹp trùng lặp, đơn giản hóa và tối ưu hiệu năng, đồng thời tự động sửa đổi. Nó không phải là công cụ tìm kiếm bug toàn diện. Các phiên bản cũ từng thay đổi quan hệ giữa `/simplify` và `/code-review --fix`, nếu thấy hành vi khác bài viết, hãy ưu tiên theo `/help` và tài liệu chính thức hiện hành.

`/batch` dùng cho các đợt sửa đổi lớn trên nhiều module có ranh giới rõ ràng, sẽ tách yêu cầu thành các unit công việc và mở các Worker chạy nền trong các worktree riêng biệt. `/loop` dùng để lặp lại Prompt theo chu kỳ, hợp cho việc poll CI hoặc bảo trì định kỳ; khi cần sửa liên tục cho đến khi test xanh hết hoặc migration hoàn tất thì dùng `/goal`, kèm theo tiêu chí nghiệm thu rõ ràng. `/run` dùng để khởi động ứng dụng xem thay đổi có hoạt động không; `/verify` nhẹ hơn, chủ yếu chạy build và kiểm tra runtime cơ bản.

Lưu ý quan trọng với `/compact`: sau khi nén context, một số quy tắc sẽ không lập tức quay lại context. `CLAUDE.md` ở thư mục gốc sẽ được tiêm lại, nhưng các quy tắc lồng trong thư mục con chưa chắc đã trở lại ngay. Sau khi nén trong một session dài, tốt nhất hãy yêu cầu Claude nhắc lại mục tiêu hiện tại, các file đã sửa, rủi ro còn lại và lệnh test bước tiếp theo rồi mới làm tiếp.

## Cách viết Prompt hiệu quả

### Dùng tiếng Anh và tiếng Việt đúng chỗ

Trong các tác vụ lập trình, tiếng Anh thường chuẩn xác và ổn định hơn. Điều này không có nghĩa là tiếng Việt kém, mà đơn giản vì code, tên thư viện, thông báo lỗi, tài liệu API vốn dĩ dùng tiếng Anh rất nhiều. Các thuật ngữ như `modal`, `debounce`, `retry policy`, `transaction boundary` khi cố dịch ra tiếng Việt đôi khi làm mất đi ngữ nghĩa kỹ thuật chuẩn xác.

Nhưng đối với bối cảnh nghiệp vụ, quy tắc sản phẩm và văn bản hiển thị trên giao diện người dùng thì tiếng Việt lại chính xác hơn. Thói quen của mình là: các thao tác code, ràng buộc kỹ thuật và thuật ngữ chuyên ngành cố gắng dùng tiếng Anh; còn ngữ nghĩa nghiệp vụ, tiêu chuẩn nghiệm thu và nội dung hiển thị tiếng Việt thì diễn đạt rõ ràng bằng tiếng Việt.

### Giới hạn phạm vi tìm kiếm

Hãy cẩn thận với câu lệnh kiểu: "Hãy điều tra dự án này giúp tôi". Claude sẽ rất "nhiệt tình" đi lùng sục khắp nơi, đọc hết file này đến file khác, và context của bạn sẽ nhanh chóng bị lấp đầy.

Hãy viết cụ thể như sau:

```text
Chỉ điều tra trong thư mục src/payment và src/order.
Mục tiêu là xác nhận việc trừ tồn kho được kích hoạt ở đâu sau khi đơn hàng thanh toán thành công.
Không sửa file, chỉ liệt kê chuỗi gọi hàm và các class liên quan.
```

Ranh giới, mục tiêu và hành động cấm đoán được viết rõ ràng sẽ giúp phạm vi tìm kiếm và sửa code của nó thu hẹp lại rất nhiều.

### Cung cấp code mẫu chuẩn mực (Gold Standard)

Khi muốn Claude viết code theo đúng phong cách của dự án, đừng chỉ nói "hãy làm theo best practice". Phạm vi này quá rộng, nó rất dễ viết ra một bộ code nhìn thì đẹp nhưng hoàn toàn lệch tông với dự án của bạn.

Đưa cho nó một file mẫu có sẵn trong dự án sẽ mang lại hiệu quả tốt hơn hẳn:

```text
Hãy đọc UserController.java, UserService.java và UserDTO.java.
Tham khảo cách phân tầng, constructor injection, định dạng trả về Result<T> và cách xử lý exception của chúng.
Viết thêm một OrderController cho việc truy vấn đơn hàng, không tạo thêm cấu trúc trả về mới.
```

Phong cách sẵn có trong dự án luôn có tính ràng buộc cao hơn các "best practice" chung chung bên ngoài. Đặc biệt với các dự án lâu năm, cách phân tầng, cấu trúc response, xử lý exception, định dạng log đều mang theo thói quen lịch sử của team. Để Claude đọc mẫu trước rồi viết theo sẽ giúp code mới tiệp màu hoàn toàn với repository hiện tại.

### Với Frontend, đừng chỉ nói "làm cho đẹp vào"

Nếu để Claude viết frontend, đừng bao giờ chỉ dặn "làm cho hiện đại, tối giản, sang xịn mịn".

Những từ này quá sáo rỗng, và kết quả bạn nhận về thường sẽ là một công thức quen thuộc: font Inter, dải màu tím gradient, card bo góc to tướng, đậm chất landing page quảng cáo. Các hệ thống admin nội bộ rất dễ bị tình trạng này: trang vốn dành cho vận hành viên thao tác tần suất cao lại bị biến thành trang giới thiệu sản phẩm.

Mình thường đưa ra các ràng buộc cứng:

```text
Sử dụng các component Ant Design sẵn có, không cài thêm thư viện UI mới.
Đây là công cụ vận hành nội bộ, ưu tiên mật độ thông tin, không làm theo phong cách trang marketing.
Màu chủ đạo dùng biến CSS của dự án, không tự thêm nền gradient tím.
Tham khảo khu vực bộ lọc và bố cục bảng trong src/pages/UserList.tsx.
```

Bạn cũng có thể đóng gói quy chuẩn thiết kế thành Skill để Claude đọc các ràng buộc thị giác trước khi code giao diện. Công cụ nội bộ thì cứ chuẩn chỉ theo kiểu công cụ nội bộ: mật độ thông tin, khả năng quét nhanh bằng mắt và phản hồi thao tác quan trọng hơn nhiều so với "cảm giác lung linh".

## Các tình huống thất bại thường gặp

Lỗi mình hay gặp nhất là session bị quá hỗn tạp. Trong cùng một session vừa bàn yêu cầu, vừa debug, vừa refactor, vừa chuẩn bị release, Claude sẽ nhanh chóng mang quán tính của chủ đề trước áp vào nhiệm vụ tiếp theo. Khi đổi việc, hãy dứt khoát gõ `/clear`, cần thiết thì viết một file `HANDOFF.md` tóm tắt, đừng cố duy trì một context đã quá bừa bộn.

Thứ hai là vòng lặp sửa lỗi luẩn quẩn. Một lỗi mà sửa đến 3 lần vẫn sai thì đừng tiếp tục kỳ kèo trong context cũ đó nữa. Hãy dừng lại, viết một prompt mở đầu mới tinh, nêu rõ mục tiêu, bằng chứng lỗi và những điều cấm làm.

File `CLAUDE.md` bị phình to cũng rất phổ biến. Quy tắc quá nhiều khiến Claude bắt đầu phớt lờ; lúc này đừng thêm quy tắc nữa, mà hãy xóa bớt những điều code tự nói lên được, chỉ giữ lại các ràng buộc đúc kết từ lỗi lầm thực tế.

Một lỗi nữa là điều tra không giới hạn. Bảo Claude "xem qua dự án này", nó có thể đọc hàng trăm file một lúc khiến context cạn kiệt. Phải giới hạn thư mục, mục tiêu và cấm sửa file, hoặc giao cho Sub-Agent.

Test xanh toàn bộ cũng không đồng nghĩa với việc hành vi nghiệp vụ đã đúng. Hãy yêu cầu Claude cung cấp bằng chứng, so sánh diff giữa branch hiện tại với main, chỗ nào cần xem log thì xem log, cần test tay thì phải test tay.

Phân quyền quá rộng là nguy hiểm nhất. Vì lười bấm xác nhận mà mở toang quyền thì về sau truy vết thao tác nhầm sẽ cực kỳ cực khổ. Hãy phân tầng cấu hình theo rủi ro thông qua allow/deny, Auto Mode, cô lập container và credential tạm thời.

## Tổng kết

Mới đầu tiếp cận, chúng ta rất dễ chỉ chăm chăm vào việc "làm sao để nó viết được nhiều code hơn". Nhưng dùng lâu rồi bạn sẽ nhận ra, thứ quyết định chất lượng đầu ra lại là những thói quen kỹ thuật hết sức căn bản: `CLAUDE.md` quy định rõ luật chơi, việc phức tạp phải plan trước, sửa xong bắt buộc phải verify, điều tra dài hơi đẩy sang Sub-Agent, nhiều task chạy song song dùng Worktree cô lập, và quyền hạn thì không bao giờ mở toang trong một lần.

Trong dự án thực tế, bạn có thể bắt đầu từ một thư mục, một module, một chuỗi tác vụ có thể kiểm chứng được, để Claude hoàn thành ổn định trong phạm vi hẹp trước rồi mới từng bước nâng dần độ phức tạp của công việc.
