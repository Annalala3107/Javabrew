---
title: "Hướng dẫn sử dụng Codex: Cấu hình, AGENTS.md và Agentic Workflow"
description: "Kết hợp tài liệu chính thức từ OpenAI và thực tiễn cộng đồng Codex CLI, làm rõ cách mô tả nhiệm vụ, giai đoạn lập kế hoạch, AGENTS.md, config.toml, kiểm soát quyền hạn, MCP, Skills, Subagents, Hooks và Scheduled Tasks trong Codex."
category: Thực chiến lập trình AI
head:
  - - meta
    - name: keywords
      content: OpenAI Codex, Codex CLI, lập trình AI, AGENTS.md, Agent Skills, MCP, Subagents, Hooks, Scheduled Tasks, AI-assisted development
lang: vi
sourceRef: zh-ref/ai-coding/practices/codex-best-practices.md
---

Xin chào, mình là Tiểu G. Trước đây mình có viết bài [Hướng dẫn sử dụng Claude Code: Cấu hình, Workflow và Kỹ thuật nâng cao](./claudecode-tips.md), sau khi đăng tải, có bạn hỏi trong phần bình luận: Claude Code đã chia sẻ nhiều rồi, vậy dùng Codex thế nào cho ổn định và hiệu quả?

Lúc mới bắt đầu dùng Codex, kỳ vọng ban đầu của mình thực ra không quá cao.

Dựa vào cái tên trong lịch sử, rất dễ tưởng rằng nó chỉ là một trợ lý dòng lệnh có khả năng viết code nhỉnh hơn một chút. Nhưng sau một thời gian dài sử dụng thực tế, cảm nhận của mình đã hoàn toàn thay đổi: Codex giống như một trợ lý kỹ thuật có khả năng tự đọc repository, tự sửa file, tự chạy câu lệnh trong terminal và quay lại bàn giao kết quả hoàn chỉnh. Nó không thích hợp để chỉ dùng gõ vài dòng code ngắn, mà đặc biệt tỏa sáng khi xử lý các nhiệm vụ có mục tiêu rõ ràng, kiểm chứng được và ranh giới được phân định mạch lạc.

Tuy nhiên ở đây có một điều kiện tiên quyết.

Bạn phải sắp xếp bàn làm việc thật chuẩn: ranh giới nhiệm vụ, quyền hạn, quy tắc dự án và tiêu chí nghiệm thu đều phải được làm rõ từ trước.

Mô tả nhiệm vụ quá mơ hồ, nó sẽ đoán mò lung tung; quyền hạn cấp quá rộng, nó có thể tiện tay làm những hành động chưa được bạn cho phép; `AGENTS.md` viết như bài quảng cáo sản phẩm, nó sẽ phải vật lộn hiểu lại repository qua từng lượt; không đưa ra tiêu chí nghiệm thu, nó rất dễ dừng lại sớm ở mức "trông có vẻ đã sửa xong".

Bài viết này không nhằm mục đích điểm lại lịch sử phát hành sản phẩm của Codex, cũng không xoay quanh một tên gọi mô hình cụ thể nào. Mô hình, gói dịch vụ và chi tiết câu lệnh thay đổi rất nhanh, viết cứng vào rất dễ lỗi thời. Điều đáng giá giữ lại là những kinh nghiệm thực chiến đã được tôi luyện qua các dự án thực tế: giao nhiệm vụ thế nào, khi nào nên vào giai đoạn lập kế hoạch (Plan), `AGENTS.md` nên chứa gì, `config.toml` quản lý cái gì, phân tầng quyền hạn, Rules và Hooks ra sao, cũng như MCP, Skills, Subagents, Scheduled Tasks phù hợp với những bài toán nào.

Làm rõ phạm vi trước: bài viết này chủ yếu hướng đến việc sử dụng hằng ngày của **Codex CLI + Codex App**. Bộ lệnh và tính năng trên IDE Extension hay Web/Cloud có thể có đôi chút khác biệt.

## Đừng giao việc chỉ bằng một câu ngắn ngủn

Rất nhiều người lần đầu giao việc cho Codex thường viết như thế này:

```text
Giúp tôi tối ưu hóa logic đăng nhập với.
```

Câu này nói với người còn chưa đủ thông tin, nói với Codex thì đương nhiên càng không đủ. Logic đăng nhập nằm ở đâu? Tối ưu cái gì: hiệu năng, tính dễ đọc, bảo mật, hay sửa bug production? Những file nào tuyệt đối không được động vào? Sửa xong thì lấy bằng chứng gì để chứng minh nó đã thực sự tốt hơn?

Tài liệu best practices chính thức của OpenAI có một khung sườn rất thực tế: **Goal, Context, Constraints, Done when**. Dịch sang cách diễn đạt hằng ngày chính là nói rõ: "cần làm gì, xem ở đâu, cấm đụng vào cái gì, và làm đến mức độ nào thì coi như xong". "Done when" đừng chỉ ghi chung chung là "chức năng hoạt động bình thường", tốt nhất hãy nêu rõ các bằng chứng có thể kiểm chứng được như unit test, build, lint, ảnh chụp màn hình, log hoặc output của câu lệnh.

Ví dụ, cũng là sửa lỗi đăng nhập, mình sẽ đổi thành:

```text
Mục tiêu: Sửa lỗi user session hết hạn thì refresh token vẫn còn hạn nhưng refresh thất bại.
Ngữ cảnh: Tập trung đọc src/auth, src/session và AuthControllerTest.
Ràng buộc: Không sửa cấu trúc bảng database, không thêm dependency mới, giữ nguyên định dạng trả về Result<T>.
Tiêu chuẩn hoàn thành: Bổ sung một test case tái hiện được lỗi, sửa implementation rồi chạy các test liên quan, xuất rõ câu lệnh và kết quả.
```

Viết như vậy sẽ thu hẹp tối đa không gian đoán mò của Codex.

Với việc nhỏ thì có thể giản lược bớt. Sửa một câu chữ, thêm dòng log, thống nhất lại tên tham số thì chỉ cần nói thẳng mục tiêu là xong. Nhưng hễ nhiệm vụ đụng tới phân quyền, thanh toán, trạng thái đơn hàng, migration dữ liệu, concurrency (bất đồng bộ/đồng thời), tính tương thích ngược, thì tuyệt đối đừng tiếc vài dòng mô tả. Bỏ thêm 2 phút viết rõ ràng lúc đầu sẽ giúp bạn đỡ phải xem lại những bản diff kỳ quặc sau này.

Thêm một thói quen cực kỳ hữu ích: **Đưa nguyên liệu gốc cho Codex, đừng chỉ đưa phán đoán chủ quan của bạn.**

Ví dụ khi gặp lỗi production, đừng chỉ nói "chắc là do chưa xóa cache". Hãy paste toàn bộ stack trace, tham số request, các bước tái hiện, test case thất bại, output console của trình duyệt vào để nó tự mình định vị. Nếu bạn vội vã đưa ra kết luận trước, nó rất dễ bị cuốn theo suy đoán của bạn và cuối cùng biến một lỗi cấu hình thành một bản sửa đổi logic nghiệp vụ sai lệch.

## Việc phức tạp hãy để nó khảo sát đường đi trước

Codex có thể trực tiếp sửa code, nhưng không có nghĩa là lúc nào cũng nên để nó sửa ngay lập tức.

Bình thường mình sẽ đánh giá mức độ rủi ro của nhiệm vụ trước. Sửa text, thêm trường dữ liệu, bổ sung một đoạn kiểm tra null hiển nhiên — những việc này cứ để nó làm trực tiếp. Nó đọc file, sửa file, chạy test rất nhanh và hiệu quả.

Nhưng loại nhiệm vụ khác thì lại cần thận trọng. Ví dụ sửa state machine của đơn hàng, tách một hàm dài hơn 600 dòng, hoặc điều tra một lỗi timeout chập chờn. Bản thân bạn còn chưa nắm trọn vẹn chuỗi gọi hàm thì việc để Codex lao vào viết code ngay sẽ khiến mọi thứ càng sửa càng rối.

Với loại tác vụ này, mình sẽ yêu cầu nó vào giai đoạn lập kế hoạch (Plan) trước:

```text
Vào giai đoạn lập kế hoạch trước, tuyệt đối không sửa đổi file.
Đọc src/payment, src/order và các bài test liên quan để làm rõ chuỗi gọi hàm trừ tồn kho sau khi thanh toán thành công.
Hãy xuất ra các file then chốt, luồng hiện tại, các điểm có thể cần sửa, điểm rủi ro và các lệnh kiểm chứng khuyến nghị.
```

Đợi nó đọc xong repository, mới yêu cầu nó chia nhỏ kế hoạch:

```text
Dựa vào phân tích vừa rồi, hãy đưa ra kế hoạch thực thi theo từng giai đoạn.
Mỗi giai đoạn nêu rõ cần sửa file nào, thêm bài test nào, kiểm chứng ra sao.
Chưa bắt đầu triển khai code, hãy đợi tôi xác nhận.
```

Quy trình này nhìn qua có vẻ chậm ở 10 phút đầu, nhưng lại chạy cực nhanh về sau.

Trong các dự án lâu năm, điều thực sự phiền toái hiếm khi là việc viết một đoạn code cụ thể, mà là logic tương thích ngược trong lịch sử, feature flag, cấu hình fallback dự phòng và các ranh giới mong manh đan xen vào nhau. Giá trị cốt lõi của giai đoạn Plan chính là bóc tách những thứ ngầm định này ra ánh sáng trước.

Cũng cần nhớ rằng output của giai đoạn Plan chỉ là phương án đề xuất chứ chưa phải sự thật tuyệt đối. Với các thay đổi rủi ro cao, bạn vẫn phải tự tay xác nhận lại chuỗi gọi hàm then chốt, ranh giới transaction và tính tương thích.

Tuy nhiên, đừng biến giai đoạn Plan thành một nghi thức rườm rà. Khi nhiệm vụ đủ nhỏ và tiêu chuẩn nghiệm thu rõ ràng, thực thi trực tiếp lại mang lại hiệu quả tốt hơn. Cộng đồng có một góc nhìn rất đúng: Codex tiêu chuẩn kết hợp với các nhiệm vụ nhỏ gọn sẽ mang lại sản phẩm ổn định hơn nhiều so với các workflow cồng kềnh phức tạp.

## `AGENTS.md` cực kỳ quan trọng

### Đừng viết thành một bản README thứ hai

File này tương tự như `CLAUDE.md` trong Claude Code, đều là file chỉ dẫn cấp dự án dành cho Agent. Nói một cách mộc mạc hơn, `AGENTS.md` là một bản **Mô tả công việc của Agent (Job Description)**: chỉ rõ cho Codex biết dự án này khởi động thế nào, test ra sao, thư mục nào cấm đụng vào, và sửa xong phải đưa ra bằng chứng nghiệm thu gì.

![CLAUDE.md và AGENTS.md trong dự án phân tích chứng khoán đa agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

Tuy nhiên định vị của hai bên không hoàn toàn giống nhau.

`CLAUDE.md` là lối vào riêng của Claude Code, chủ yếu phục vụ Claude Code; còn `AGENTS.md` là định dạng file chỉ dẫn mở dành cho các coding agent, được OpenAI Codex hỗ trợ chính thức. Các công cụ khác có đọc hay không và đọc theo cách nào thì phải căn cứ vào tài liệu của từng bên, đừng mặc định rằng mọi Agent đều nạp theo cùng một chuẩn quy tắc.

Nếu trong repository đã có sẵn `AGENTS.md`, thường bạn không cần phải duy trì thêm một file `CLAUDE.md` có nội dung gần như y hệt. Bạn có thể để `CLAUDE.md` import trực tiếp `AGENTS.md`, rồi bổ sung thêm các yêu cầu đặc thù của Claude Code:

```markdown
@AGENTS.md

## Claude Code Specific Instructions

- Sử dụng plan mode khi xử lý các thay đổi dưới `src/billing/`.
```

Như vậy quy tắc cơ sở chỉ cần bảo trì ở một nơi duy nhất mà cả Claude Code và Codex đều dùng chung được. Ngược lại, nếu ban đầu team chỉ có `CLAUDE.md` mà nay muốn Codex, Cursor cũng đọc được cùng một bộ quy ước, hãy rút phần chung sang `AGENTS.md`, còn các lệnh riêng của Claude Code thì giữ lại trong `CLAUDE.md`.

Mình khuyên bạn chỉ nên đưa vào `AGENTS.md` những thông tin mà Agent thực sự cần dùng:

- Quy tắc mà Codex hay đoán sai
- Quy ước ngầm không đọc được từ mã nguồn
- Quy chuẩn bắt buộc toàn team phải tuân thủ
- Phiên bản tech stack, câu lệnh thông dụng, đánh đổi kiến trúc và các cạm bẫy trong dự án

### Phân tầng và thứ tự nạp

Khi khởi động, Codex sẽ xây dựng một chuỗi chỉ dẫn (instruction chain). Theo tài liệu chính thức hiện tại, thứ tự tìm kiếm như sau: trước tiên đọc `AGENTS.override.md` trong thư mục Codex home, nếu không có thì đọc `AGENTS.md`; sau đó đi từ thư mục gốc của dự án dần xuống thư mục làm việc hiện tại. Mỗi thư mục sẽ đọc tối đa một file theo thứ tự ưu tiên: `AGENTS.override.md` → `AGENTS.md` → fallback filenames. File nào càng gần thư mục làm việc hiện tại sẽ được nạp sau cùng và có sức ảnh hưởng mạnh nhất tới nhiệm vụ lần này.

`AGENTS.override.md` rất thích hợp để ghi đè tạm thời file `AGENTS.md` trong cùng thư mục khi bạn muốn thử nghiệm một quy tắc ngắn hạn mà không muốn đụng vào file gốc của cả team.

Một tham số cấu hình ít ai để ý nhưng rất thực tế: `project_doc_max_bytes` giới hạn dung lượng tổng của chỉ dẫn dự án sau khi hợp nhất, mặc định chính thức là 32 KiB. Dù có thể nâng con số này lên, bạn cũng không nên biến file quy tắc thành một bản README ôm đồm mọi thứ. File quá béo sẽ làm lu mờ các quy tắc cốt lõi và Codex cũng chưa chắc đã nghe lời hơn.

Tiêu chuẩn đánh giá của mình rất giản dị:

> Nếu xóa dòng này đi, Codex có dễ phạm lỗi hơn không?

Nếu có, hãy giữ lại; nếu không, hãy xóa bỏ.

Một số team còn xem `AGENTS.md` như cuốn sổ tay ghi lỗi của Agent. Ví dụ mỗi khi Codex lặp lại lỗi gõ sai lệnh test, sửa nhầm thư mục generated, hoặc quên chạy kiểm tra, họ sẽ đúc kết nguyên nhân và cách làm chuẩn vào đây. Ý tưởng này rất đúng đắn, nhưng đừng copy nguyên xi lịch sử thất bại vào. Hãy chắt lọc nó thành một quy tắc hành động ngắn gọn, nếu không file sẽ nhanh chóng biến thành một mớ nhật ký hỗn độn.

Lệnh `/init` có thể tạo ra bản nháp ban đầu của `AGENTS.md`, nhưng nó chỉ đóng vai trò khởi đầu. Nội dung tự sinh thường hay sao chép lại những thứ có sẵn trong README hoặc đoán sai lệnh test. Sau khi sinh xong, bạn nhất định phải tự tay rà soát và cắt gọt, chỉ giữ lại những gì thực sự ảnh hưởng đến hành vi của Codex.

Với các dự án quy mô lớn, hãy áp dụng mô hình mục lục:

Trong bài viết [Tìm hiểu toàn diện về Harness Engineering](https://javaguide.cn/ai/agent/harness-engineering.html), mình từng nhắc tới việc `AGENTS.md` nội bộ của chính OpenAI chỉ dài khoảng 100 dòng, đóng vai trò như một bản chỉ mục: nêu ngắn gọn các quy tắc cốt lõi nhất, rồi trỏ link tới các tài liệu chi tiết hơn trong `docs/` (thiết kế, sơ đồ kiến trúc, kế hoạch thực thi, thang đánh giá chất lượng). Khi nào Agent thực sự cần can thiệp vào module nào thì mới theo link mở ra đọc.

Đó chính là nguyên lý tiết lộ lũy tiến (progressive disclosure).

Đừng nhồi nhét toàn bộ bối cảnh vào context trong một lần. Thư mục gốc để quy tắc làm việc trọng yếu nhất; thư mục con chứa quy ước cục bộ; các tài liệu giải thích kiến trúc sâu hơn thì tách ra file riêng và dẫn link để Agent đọc on-demand khi cần. Cách này vừa tránh lãng phí context, vừa dễ bảo trì.

## `config.toml` quản lý hành vi của client

Nếu `AGENTS.md` là bản hướng dẫn dự án, thì `config.toml` lại là file cấu hình cho chính client Codex.

Các vị trí phổ biến: cấu hình cấp user tại `~/.codex/config.toml`, cấp project tại `.codex/config.toml`, các profile riêng biệt đặt tại `~/.codex/<profile>.config.toml`, và cấp hệ thống trên Unix thường là `/etc/codex/config.toml`.

Theo tài liệu cấu hình chính thức hiện hành, độ ưu tiên từ cao xuống thấp là: CLI flags và `--config` ghi đè → `.codex/config.toml` cấp project → profile chọn qua `--profile` → `~/.codex/config.toml` cấp user → `/etc/codex/config.toml` cấp hệ thống → giá trị mặc định của hệ thống. Cấu hình cấp project chỉ được nạp khi dự án đã được đánh dấu là tin cậy (trusted); nếu dự án bị đánh dấu là untrusted, toàn bộ cấu hình `.codex/`, Hooks và Rules bên trong dự án sẽ bị bỏ qua hoàn toàn.

Trong công việc hằng ngày, thứ đáng quan tâm nhất không phải tên model, mà chính là quyền hạn và sandbox:

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"
```

Cặp cấu hình này rất phù hợp cho phát triển thường nhật: Codex có thể thoải mái sửa file và chạy lệnh kiểm chứng trong workspace, nhưng hễ đụng tới các lệnh nhạy cảm hơn là nó sẽ dừng lại hỏi bạn.

Thiết lập `approval_policy = "never"` hoặc mở rộng sandbox không phải là không được, nhưng bắt buộc phải đặt trong môi trường đã được cô lập cẩn thận: worktree tạm thời, container, script chạy một lần, CI, tài khoản test với credential quyền tối thiểu. Chỉ vì lười bấm xác nhận vài lần mà mở toang quyền hạn thì trong dự án thực tế là một sự đánh đổi quá mạo hiểm.

Hooks hiện tại được bật mặc định. Nếu bạn thực sự muốn tắt, hãy cấu hình trong `config.toml`:

```toml
[features]
hooks = false
```

Hướng tiếp cận này hoàn toàn phù hợp với trực giác bảo mật: cấu hình, Rules, Hooks đi kèm trong repository của người khác đều có thể tác động trực tiếp tới việc thực thi trên máy bạn, tuyệt đối không nên tin tưởng mặc định hoàn toàn.

Bảng phân vai giữa các file và cơ chế này như sau:

| Cơ chế | Giải quyết vấn đề gì | Phù hợp chứa nội dung gì |
| --- | --- | --- |
| `AGENTS.md` | Bản mô tả công việc của Agent | Quy tắc dự án, câu lệnh thông dụng, quy ước thư mục, tiêu chí nghiệm thu |
| `config.toml` | Cấu hình client Codex | Model, sandbox, approval, profile, MCP... |
| Rules | Cấp phép câu lệnh: allow / prompt / forbid | Cho phép lệnh nào chạy thẳng, lệnh nào phải hỏi, lệnh nào bị cấm hoàn toàn |
| Hooks | Script gắn theo vòng đời | Kiểm tra, kiểm toán bảo mật, format code, tiêm context |
| Sandbox / Approval | Ranh giới thực thi cuối cùng | Chính sách bảo vệ filesystem, mạng, thực thi lệnh và phê duyệt thủ công |

## Phân định rõ ràng giữa Quyền hạn, Rules và Hooks

Codex có nhiều tầng kiểm soát an toàn, người mới thường có xu hướng nhồi nhét tất cả các yêu cầu cấm đoán vào `AGENTS.md`.

Cách làm này không đủ tin cậy, vì `AGENTS.md` chỉ đóng vai trò chỉ dẫn mềm, chứ không phải là sự cưỡng chế cứng ở tầng thực thi.

`AGENTS.md` là lời nhắc nhở mang tính định hướng; sandbox và approval quản lý ranh giới vận hành; Rules quyết định một câu lệnh có được phép chạy hay không; còn Hooks đảm bảo một hành động bắt buộc phải được kích hoạt tại mốc vòng đời tương ứng.

Ví dụ, câu "không được chạy `rm -rf`", nếu chỉ viết trong `AGENTS.md` thì nó vẫn chỉ là một lời khuyên bảo. Viết vào Rules, Codex sẽ bị chặn đứng ngay trước khi câu lệnh kịp thực thi. Rules hiện tại vẫn là tính năng thử nghiệm, cú pháp dưới đây căn cứ theo tài liệu Codex Rules hiện hành. Nếu phiên bản trên máy bạn chưa hỗ trợ, hãy dùng `/permissions`, sandbox, approval hoặc Hooks để kiểm soát thay thế:

```python
prefix_rule(
    pattern = ["rm", "-rf"],
    decision = "forbidden",
    justification = "Không để Codex thực thi xóa đệ quy cưỡng chế; vui lòng xác nhận thủ công thư mục cụ thể.",
    match = [
        "rm -rf dist",
    ],
)
```

Hooks giải quyết một nhóm bài toán khác.

Nếu bạn muốn Codex trước khi dừng lại phải chạy một đoạn script kiểm tra, hoặc trước khi gọi tool phải rà soát xem trong prompt có vô tình dán lộ API key hay không, hoặc sau khi sửa file thì tự động format code, thì đó là lúc thích hợp đưa vào Hook. Các sự kiện Hooks chính thức của Codex hiện tại bao gồm `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PreCompact`, `PostCompact`, `UserPromptSubmit`, `SessionStart`, `SubagentStart`, `SubagentStop`, `Stop`...

Tuy nhiên Hook cuối cùng vẫn là chạy script cục bộ trên máy bạn. Tài liệu chính thức cũng nêu rõ các command hook không được quản lý sẽ đòi hỏi phải được review và tin cậy, khi có thay đổi sẽ phải xác nhận lại. Thêm vào đó, nhiều command hook cùng khớp một sự kiện sẽ được kích hoạt đồng thời (concurrency), do đó bạn không thể dựa vào thứ tự thực thi giữa các Hook để làm rào chắn an toàn.

## Bắt Codex phải chứng minh nó thực sự sửa đúng

Điểm nguy hiểm nhất của AI khi lập trình không phải là nó không viết được code, mà là nó rất có khiếu viết ra những đoạn code "nhìn có vẻ cực kỳ hợp lý".

Vì vậy mình rất ít khi chỉ buông một câu "sửa xong thì báo tôi". Mình luôn lồng ghép yêu cầu kiểm chứng thẳng vào trong prompt:

```text
Trước hết hãy bổ sung một bài test thất bại để tái hiện vấn đề này.
Xác nhận test đã fail rồi mới tiến hành sửa code implementation.
Sửa xong hãy chạy các test liên quan.
Nếu liên tiếp 2-3 vòng vẫn fail, hãy dừng lại báo cáo điểm nghẽn cùng bằng chứng thực tế, không tiếp tục sửa mò.
```

Trình tự này sẽ chặn đứng rất nhiều bản sửa lỗi giả tạo. Nó buộc phải tái hiện được lỗi trước, sửa code sau, và cuối cùng dùng kết quả test xanh để chứng minh.

Khi Codex làm xong, mình thường soi kỹ 3 thứ: đã sửa những file nào, đã chạy những câu lệnh gì, và còn những rủi ro nào chưa được bao phủ. Lệnh `/diff` giúp xem nhanh các thay đổi, còn `/review` có thể dùng để audit các thay đổi chưa commit, một commit cụ thể, hoặc chạy kiểm tra theo yêu cầu tùy chỉnh của bạn.

Cụ thể hơn, bạn có thể đòi hỏi bằng chứng kiểm chứng theo danh sách sau:

- Bài test thất bại chuyển từ đỏ sang xanh (red-to-green).
- Tóm tắt `git diff` và giải thích các file then chốt.
- Output câu lệnh chạy test, lint, build thực tế.
- Các điểm rủi ro chưa bao phủ hết.
- Những điểm trọng yếu cần con người trực tiếp review.
- Phương án rollback nếu phát sinh sự cố.

Trong cộng đồng có hai câu prompt mẫu rất đắc lực:

```text
Prove to me this works. Compare the diff against main and show the evidence.
```

```text
Knowing everything you know now, scrap this approach and propose the simpler implementation.
```

Câu thứ nhất ép nó phải đưa ra bằng chứng xác thực chứ không chỉ kết luận bằng lời lẽ suông. Câu thứ hai cực kỳ hữu ích khi phương án đầu tiên chạy được nhưng cấu trúc code quá loằng ngoằng: lúc này Codex đã nắm trọn ngữ cảnh bài toán, yêu cầu nó tư duy lại từ đầu thường sẽ cho ra một giải pháp gọn gàng và thanh thoát hơn hẳn.

Nhưng bước cuối cùng bạn vẫn phải tự mình đọc diff. Tóm tắt của Codex không thể thay thế cho việc code review của con người. Nó bảo "chỉ sửa test thôi", bạn cũng phải mở các file chính ra nhìn tận mắt; nó bảo "không có rủi ro gì", bạn cũng phải tự mình nghĩ xem transaction, concurrency, phân quyền, tính tương thích có bị sót nhánh nào không.

## MCP chỉ nên kết nối những công cụ thực sự mang lại giá trị

MCP (Model Context Protocol) đóng vai trò như một bộ tiêu chuẩn đầu nối: **hệ thống bên ngoài đóng gói năng lực thành MCP Server, các ứng dụng AI hỗ trợ MCP kết nối vào là có thể khám phá và gọi các năng lực đó.**

![Minh họa MCP](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

Ngữ cảnh thực tế của một lập trình viên không chỉ nằm gọn trong Git repository.

Log lỗi nằm ở Sentry, yêu cầu nghiệp vụ ở Linear, tài liệu API ở trang nội bộ, bản thiết kế ở Figma, các bước tái hiện ở trình duyệt, và thảo luận review ở GitHub. Dĩ nhiên bạn có thể copy từng đoạn đưa cho Codex, nhưng làm nhiều lần sẽ rất mất thời gian.

MCP sinh ra để giải quyết bài toán này. Theo tài liệu MCP hiện tại của Codex, hệ thống hỗ trợ STDIO MCP Server và Streamable HTTP Server (hỗ trợ Bearer token hoặc OAuth). Chi tiết cấu hình hãy theo tài liệu MCP chính thức.

Ví dụ thêm MCP tài liệu Context7:

```bash
codex mcp add context7 -- npx -y @upstash/context7-mcp
```

Thêm xong, bạn có thể gõ `/mcp` trong giao diện TUI để xem trạng thái server.

Ở đây có một sự đánh đổi quan trọng: **MCP không phải cứ cắm càng nhiều là càng tốt.**

Mình khuyên bạn chỉ nên kết nối những công cụ có tần suất sử dụng cao, mục đích rõ ràng, và ban đầu tốt nhất chỉ nên ở chế độ chỉ đọc (read-only). Hay tra lỗi production thì nối Sentry hoặc log platform; hay làm frontend thì nối browser, Playwright, Figma; hay xử lý PR thì nối GitHub. Những MCP có quyền ghi, mang theo token quyền lực cao hoặc có thể can thiệp hệ thống bên ngoài thì phải hết sức tiết chế.

Có thể chia làm 3 tầng rủi ro:

- MCP chỉ đọc: Tra cứu tài liệu, xem log lỗi, đọc Sentry, xem thông tin PR.
- MCP ghi bán phần: Tạo issue, comment trên PR, tạo bản nháp, cập nhật tài liệu môi trường staging.
- MCP rủi ro cao: Deploy release, sửa cấu hình production, xóa tài nguyên, can thiệp cloud hay database.

Mặc định hãy ưu tiên công cụ chỉ đọc. Công cụ có quyền ghi cần giới hạn scope chặt chẽ, công cụ rủi ro cao phải qua phê duyệt và kiểm toán riêng, token dùng loại quyền hạn tối thiểu và ngắn hạn.

Càng nhiều công cụ, không gian lựa chọn của Codex càng lớn và xác suất dùng nhầm công cụ càng cao.

Khi tự viết MCP Server, đừng chỉ khai báo schema của tham số. Tài liệu Codex MCP có nhấn mạnh rằng Codex sẽ đọc trường `instructions` trả về khi khởi tạo MCP, và khuyến nghị nên đặt các hướng dẫn quan trọng nhất vào 512 ký tự đầu tiên: khi nào nên dùng, khi nào không nên dùng, dữ liệu trả về cần hiểu thế nào...

## Skills dùng để lưu trữ các quy trình lặp đi lặp lại

File quy tắc và Skill giải quyết hai lớp bài toán hoàn toàn khác nhau.

File quy tắc phù hợp để chứa những gì dự án bắt buộc phải luôn luôn tuân thủ: phiên bản tech stack, lệnh khởi động, cấu trúc thư mục, định dạng error code, file cấm can thiệp.

Skill phù hợp để chứa quy trình từng bước khi thực hiện một loại tác vụ cụ thể: code review, viết unit test, sửa giao diện frontend, nghiên cứu tài liệu web, viết bài kỹ thuật... Các tác vụ này mỗi lần làm đều có các bước tương tự nhau, không cần thiết lần nào chat cũng phải nhắc lại từ đầu.

Đơn giản mà nói, Skill là một bản hướng dẫn công việc được nạp theo nhu cầu (on-demand). Nó đưa các bước thực hiện, ràng buộc, checklist kiểm tra và kinh nghiệm tránh lỗi vào trong file `SKILL.md`.

Skill không nhồi nhét toàn bộ nội dung vào context ngay từ đầu như `AGENTS.md`. Mặc định Codex chỉ đọc tên và mô tả của Skill để đánh giá xem có nên kích hoạt hay không; chỉ khi thực sự cần dùng đến, phần nội dung của `SKILL.md` và tài nguyên đi kèm mới được đưa vào context.

![Chuỗi thực thi Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-agent-execution-link-ee22c892.png)

Những quy trình có tính lặp lại cao đều nên đúc kết thành Skill: viết tính năng cố định đi theo TDD; code review cố định rà soát bảo mật, transaction, hiệu năng và điều kiện biên; viết bài kỹ thuật cố định kiểm tra nguồn trích dẫn, văn phong AI.

Giá trị của Skill chính là biến các lời nhắc nhở lặp lại thành một cuốn sổ tay tác nghiệp có thể tái sử dụng. Skills trong Codex và Skills trong Claude tương đồng về mặt triết lý thiết kế, nhưng cấu trúc thư mục, cách kích hoạt và mô hình bảo mật cụ thể cần tra cứu theo tài liệu chính thức của từng bên.

Một file `SKILL.md` tối thiểu có thể viết ở mức độ gọn gàng như sau:

```markdown
---
name: java-service-review
description: Review Java service-layer changes for transaction boundaries, null handling, logging, and regression tests.
---

Use this skill when reviewing Java service-layer changes.

Input materials:

- Current diff or target files.
- Related tests and error logs, if available.

Steps:

1. Read the changed service methods and related tests.
2. Check transaction boundaries, null handling, logging, and regression coverage.
3. Return findings with file and line references.

Do not rewrite code unless the user explicitly asks.

Done when:

- Findings are ordered by severity.
- Each finding explains the risk and a concrete fix direction.
```

Bạn cũng có thể tận dụng các Skill cộng đồng như Superpowers đã đóng gói sẵn các bước TDD, Code Review, Spec-Driven, Git Worktree.

Nhưng đừng tải Skill bên thứ ba về là chạy ngay. File `SKILL.md` bản chất là chỉ dẫn thực thi, nếu bên trong chứa lệnh nguy hiểm hay script mờ ám, Agent sẽ làm theo. Trước khi dùng hãy mở xem nội dung, thư mục `scripts/` và `references/`.

## Subagents thích hợp để xử lý các đợt điều tra nhánh

Trong các tác vụ dài, phần ngốn nhiều context nhất thường không phải là bản sửa code cuối cùng, mà là toàn bộ quá trình điều tra lòng vòng ở giữa.

Ví dụ khi truy vết một bug hóc búa, Codex có thể phải đọc hàng chục file, lùng sục qua đống log và thử nghiệm vài ba giả thuyết. Cuối cùng kết luận thực sự có ích chỉ có vài dòng, nhưng cuộc hội thoại chính thì đã bị ngập ngụa bởi kết quả tìm kiếm và các bước suy luận trung gian.

Đây chính là lúc nên dùng Subagents.

Theo tài liệu Codex hiện tại, workflow Subagent được hỗ trợ sẵn, nhưng Codex chỉ sinh ra (spawn) subagents khi bạn có yêu cầu tường minh. Mỗi subagent đều chạy mô hình và gọi công cụ riêng biệt, vì vậy lượng Token tiêu thụ sẽ nhiều hơn so với khi chạy đơn agent.

Các agent tích hợp sẵn bao gồm: `default` làm nhiệm vụ thông thường, `worker` thiên về thực thi và sửa code, `explorer` thiên về đọc và khám phá codebase. Bạn cũng có thể tự cấu hình agent bằng file TOML trong `~/.codex/agents/` hoặc `.codex/agents/`.

Một câu lệnh chia việc song song rất điển hình:

```text
Review current branch against main.
Spawn one subagent for each topic: security, concurrency, tests, maintainability.
Wait for all agents, then summarize findings with file references and severity.
Do not modify files.
```

Những tác vụ này có ranh giới rõ ràng và có thể chạy song song một cách tự nhiên.

Ngược lại, không nên tách subagent cho những việc quá nhỏ. Sửa một trường DTO mà mở tới 4 subagent thì chi phí điều phối còn tốn kém hơn bản thân việc sửa code. Thói quen của mình: hội thoại chính giữ vai trò ra quyết định và nghiệm thu; subagent chỉ xử lý các nhánh nghiên cứu cục bộ, rõ việc và có thể báo cáo độc lập.

Lưu ý thêm: Subagents kế thừa chính sách sandbox hiện tại. Trong giao diện CLI tương tác, các yêu cầu xin cấp quyền phê duyệt từ các thread chạy nền cũng có thể hiện lên — hãy nhìn rõ agent nào đang yêu cầu trước khi bấm đồng ý.

## Scheduled Tasks đừng vừa vào đã tự động hóa hoàn toàn

Tính năng trước đây trong Codex App hay gọi là Automations, hiện tại trên giao diện chủ yếu gọi là **Scheduled Tasks**. Nó rất thích hợp để chạy các tác vụ lặp đi lặp lại: quét commit gần đây mỗi ngày, tạo release note mỗi tuần, định kỳ kiểm tra lỗi CI, tổng hợp cảnh báo chưa xử lý.

Nó không sinh ra để "tự động sửa chữa mọi thứ".

Cần hiểu rõ điều kiện vận hành: các task cấp dự án chạy ở máy cục bộ, đòi hỏi máy phải bật, Codex phải đang chạy và đường dẫn dự án phải tồn tại trên ổ cứng. Tác vụ trong Git repo có thể chạy ngay trong project hoặc trong background worktree riêng biệt. Scheduled Tasks dùng sandbox mặc định, nếu cấp toàn quyền (full access) thì rủi ro chạy ngầm sẽ rất cao.

Trình tự áp dụng an toàn nhất: trước hết viết thành prompt thông thường, chạy tay vài lần; nếu lần nào cũng lặp lại cùng một tập hợp bước, hãy đúc kết thành Skill; đợi Skill chạy ổn định rồi mới đưa lên Scheduled Task.

Skill định hình phương pháp, Scheduled Task định hình thời gian. Prompt của task cũng phải viết thành dạng durable prompt độc lập, không phụ thuộc vào ngữ cảnh ngầm định của đoạn chat trước đó.

Ví dụ câu "mỗi ngày tự động sửa toàn bộ Bug rồi tạo PR" nghe rất hấp dẫn, nhưng trong thực tế hầu như chỉ tạo ra một mớ diff rác bắt con người phải dọn dẹp. Đáng tin cậy hơn nhiều là "mỗi ngày quét các ca thất bại CI trong 24 giờ qua và tổng hợp nguyên nhân". Cứ để nó báo cáo trước rồi mới quyết định có sửa code hay không.

## Các nhóm lệnh thường dùng

Slash command của Codex CLI có thể thay đổi, và các lệnh thấy được trên CLI, Codex App hay IDE Extension có thể khác nhau đôi chút. Dưới đây là phân nhóm thao tác thường dùng, chi tiết cụ thể luôn căn cứ theo menu `/` và `/help`:

- Kiểm soát session và kế hoạch: `/permissions`, `/model`, `/fast`, `/status`, `/clear`, `/plan`, `/goal`.
- Xem context, memory và diff: `/diff`, `/compact`, `/copy`, `/memories`.
- Mở rộng năng lực: `/agent`, `/mcp`, `/hooks`, `/plugins`, `/apps`, `/skills`.
- Review và khôi phục: `/review`, `/fork`, `/resume`.

Lệnh chỉ là lối vào, không phải bản thân workflow. Thứ quyết định chất lượng đầu ra cuối cùng vẫn là ranh giới nhiệm vụ, quy tắc dự án, tiêu chuẩn kiểm chứng và cấu hình phân quyền.

## Các Workflow mình thường dùng hằng ngày

Khi tiếp nhận một dự án mới tinh, mình để Codex làm hướng dẫn viên:

```text
Tuyệt đối không sửa đổi file.
Hãy giải thích luồng đăng nhập người dùng, từ lúc HTTP request đi vào cho tới khi session được ghi lại.
Liệt kê các class, method, mục cấu hình then chốt, cùng những ràng buộc ngầm định mà bạn cho rằng cần con người xác nhận lại.
```

Nội dung nó đúc kết cần được kiểm tra xác suất, đặc biệt là các lệnh gọi xuyên service, cấu hình feature flag, hay logic tương thích ngược. Bắt nó liệt kê tên file và method cụ thể sẽ đáng tin cậy hơn nhiều so với việc chỉ nghe tóm tắt chung chung.

Khi sửa Bug, đừng chỉ buông câu "sửa giúp tôi". Hãy bày sẵn toàn bộ nguyên liệu:

```text
Dưới đây là bài test thất bại, log lỗi và các bước tái hiện.
Hãy định vị nguyên nhân gốc rễ trước, chưa sửa code vội.
Tìm ra nguyên nhân rồi, hãy bổ sung một bài test tái hiện được lỗi, sau đó mới sửa implementation.
Làm xong hãy chạy test liên quan và giải thích vì sao bài test này bao phủ được lỗi.
```

Nếu nó quay cuồng trong hướng đi sai suốt 2 vòng, đừng tiếp tục giục "thử lại xem". Hãy dừng lại, yêu cầu nó điểm lại: hiện tại đã biết chắc những gì, những giả thuyết nào đã bị bác bỏ, và bước tiếp theo còn thiếu bằng chứng nào.

Quy trình TDD cũng phát huy tác dụng cực tốt với Codex:

```text
Trước mắt chưa sửa code implementation.
Hãy viết một test case thất bại cho OrderStatusService, bao phủ kịch bản đơn hàng đã thanh toán bị callback trùng lặp thì không được trừ tồn kho hai lần.
Sau khi test fail mới tiến hành sửa implementation cho tới khi test pass.
```

Với các tác vụ Frontend, hãy đưa ra ràng buộc thật cụ thể:

```text
Đây là trang công cụ vận hành nội bộ, ưu tiên mật độ thông tin, không làm theo phong cách trang marketing.
Sử dụng các component Ant Design sẵn có, không thêm thư viện UI mới.
Tham khảo khu vực bộ lọc, bảng và phân trang trong src/pages/UserList.tsx.
Màu sắc chủ đạo lấy từ CSS variable, không tự ý thêm nền gradient.
Làm xong hãy khởi động trang web cục bộ, kiểm tra xem giao diện mobile và desktop có bị tràn chữ hay không.
```

Với PR Review, phạm vi càng hẹp càng hiệu quả:

```text
Review current branch against main.
Focus only on correctness, transaction boundaries, null handling, and missing tests.
Return findings ordered by severity with file and line references.
Do not comment on style unless it can cause a bug.
```

Tập trung ưu tiên xử lý các phát hiện có nguy cơ dẫn tới bug, vấn đề bảo mật, sai lệch dữ liệu, phá vỡ tính tương thích ngược và thiếu hụt test case.

## Ranh giới an toàn

Codex có thể đọc file, ghi file, chạy lệnh terminal, gọi MCP, điều khiển trình duyệt. Quyền năng càng lớn thì ranh giới càng phải minh bạch.

Bạn nên giữ vững các lằn ranh đỏ sau:

- Không cung cấp mật khẩu database production, token dài hạn của cloud provider, SSH key cho Codex.
- Không để nó mặc định đọc `.env`, chứng chỉ bảo mật, database dump, log production và thư mục chứa private key.
- Không để nó thao tác trực tiếp trên môi trường production, trừ khi có credential tạm thời, quy trình phê duyệt và kiểm toán.
- Không cho phép mặc định push vào branch chính hoặc force push lên remote branch.
- Không chạy các script từ xa không rõ nguồn gốc (`curl | bash`) ngoài môi trường cô lập.
- Không mở toang quyền ghi cho toàn bộ MCP trong một lần.

Khi bắt buộc phải chạy tự động hóa quyền cao, hãy đưa vào container, dùng tài khoản tạm thời với quyền hạn tối thiểu và worktree riêng biệt. Luôn lưu giữ log thao tác, output câu lệnh, diff và biên bản phê duyệt để đảm bảo có thể rollback nhanh chóng khi cần.

## Những chỗ dễ bị "lật xe"

- **Mô tả nhiệm vụ quá chung chung.** Chỉ nói "tối ưu chỗ này đi" sẽ ép Codex phải đoán mò, dẫn đến việc nó sửa lan man vào hàng loạt file không liên quan. Hãy bổ sung đầy đủ mục tiêu, ngữ cảnh, ràng buộc và tiêu chuẩn hoàn thành.
- **Lập kế hoạch thái quá cho việc nhỏ.** Sửa một câu chữ không cần chia 3 giai đoạn lập kế hoạch. Việc nhỏ cứ sửa thẳng, xem diff, chạy test là xong. Giai đoạn Plan chỉ dành cho việc lớn, rủi ro cao và chuỗi gọi hàm chưa rõ ràng.
- **`AGENTS.md` bị phình to quá mức.** Nhồi nhét quá nhiều quy tắc sẽ làm loãng các điều cốt lõi. Hãy đúc kết quy tắc từ các lỗi thực tế; những thứ code tự nói lên được thì xóa bỏ.
- **Mở công cụ và quyền hạn quá rộng.** Cắm quá nhiều MCP sẽ khiến Codex chọn nhầm công cụ; cấp quyền quá thoải mái khiến các tác vụ chạy nền vượt khỏi tầm kiểm soát. Luôn tuân thủ nguyên tắc đặc quyền tối thiểu.
- **Thiếu khâu kiểm chứng.** Code nhìn có vẻ hợp lý không đồng nghĩa với việc nó chạy đúng. Luôn đòi hỏi test từ đỏ sang xanh, output build hoặc kiểm tra trực quan. Khi session dài bị chậm hoặc lú lẫn, hãy `/compact` hoặc fork ra một thread mới.

## Chiến lược phân tầng sử dụng theo rủi ro

Hãy điều chỉnh cách làm việc dựa trên mức độ rủi ro của nhiệm vụ:

- **Nhiệm vụ rủi ro thấp**: Sửa text, thêm log, chỉnh sửa ánh xạ trường dữ liệu đơn giản — trực tiếp để Codex làm, xong việc xem `/diff` và chạy unit test tương ứng.
- **Nhiệm vụ rủi ro trung bình**: Đi theo chu trình Plan → Execute → Verify. Sửa quy trình nghiệp vụ trong module, thêm API, refactor một service cục bộ — hãy để Codex đọc file, đề xuất kế hoạch sửa đổi và đợi bạn xác nhận rồi mới bắt tay vào viết code.
- **Nhiệm vụ rủi ro cao**: Phân tích ở chế độ chỉ đọc trước. Thanh toán, phân quyền, migration dữ liệu, cấu hình production, bài toán đồng thời — để Codex tìm chuỗi gọi hàm, điểm rủi ro và lỗ hổng test; con người xác nhận các quyết định then chốt rồi mới tiến hành qua TDD hoặc các commit nhỏ giọt trong worktree/container cô lập.
- **Nhiệm vụ tự động hóa**: Không bao giờ tự động hóa ngay từ đầu. Chạy tay thành công vài lần, đúc kết thành Skill, rồi mới đưa lên Scheduled Task kèm theo log kiểm toán và phương án rollback.

## Tổng kết

Khi đã dùng Codex thuần thục, cảm giác sẽ chuyển dịch từ việc "bảo AI viết code hộ" sang "điều phối một trợ lý kỹ thuật có thể tự đọc repository, tự chạy câu lệnh kiểm chứng và bàn giao bản diff hoàn chỉnh".

Để đạt được trạng thái đó, bạn không thể chỉ chăm chăm vào câu chữ prompt.

Ranh giới nhiệm vụ, quy tắc dự án, kiểm soát quyền hạn, tiêu chuẩn kiểm chứng, công cụ ngoại vi và các quy trình tái sử dụng — tất cả cùng hòa quyện để quyết định chất lượng đầu ra cuối cùng của Codex. Lời khuyên cốt lõi của mình vẫn là: hãy để nó làm đúng và ổn định trong một phạm vi nhỏ trước, rồi mới từng bước mở rộng ranh giới ra ngoài.

Tuyệt đối đừng vừa vào đã đòi tự động hóa toàn bộ.
