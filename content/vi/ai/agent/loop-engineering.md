---
title: Loop Engineering là gì? Tại sao nói đây là "bình mới rượu cũ"?
description: Bắt đầu từ Agent Loop, Context Engineering, Harness, Skills, MCP, Sub-agent cùng Claude Code /loop, /goal để giải thích Loop Engineering thực sự giải quyết vấn đề gì và khi nào đáng áp dụng.
category: Phát triển ứng dụng AI
lang: vi
sourceRef: zh-ref/ai/agent/loop-engineering.md
head:
  - - meta
    - name: keywords
      content: Loop Engineering,Agent Loop,AI Agent,Claude Code,/loop,/goal,Context Engineering,Harness Engineering,Agent Skills,MCP,AI Coding
---

Sau khi CI thất bại, Agent có thể đọc log lỗi, định vị các file liên quan, chạy bộ kiểm thử tối thiểu (minimal test suite), rồi ghi kết quả điều tra trở lại Issue. Tuy nhiên, khi lượt điều tra đầu tiên chưa thể hội tụ, tác vụ sẽ gặp phải một bài toán thực tế hơn: ai sẽ kích hoạt lượt tiếp theo, cần đọc tiếp những tài liệu nào, và khi nào thì nên dừng lại để bàn giao cho con người xử lý?

Loop Engineering chính là chủ đề thảo luận về quy trình tầng ngoài này. Nó chịu trách nhiệm kết nối từng lần thực thi của Agent lại với nhau: CI, PR hoặc scheduled cron job kích hoạt vòng tiếp theo, quy tắc dự án và bằng chứng liên quan được nạp vào ngữ cảnh, kiểm thử và review quyết định xem kết quả có đáng tin cậy hay không, còn việc ghi nhận trạng thái giúp các tác vụ tiếp sau có thể tiếp tục ngay từ điểm dừng của lần trước.

Theo các cuộc thảo luận công khai, thuật ngữ này bắt đầu nóng lên từ **đầu tháng 6 năm 2026**, với bài viết của Addy Osmani vào ngày 7 tháng 6. Trong Claude Code và Codex, các tính năng như `/loop`, `/goal`, Automations, khi kết hợp cùng Skills, Sub-agent, cô lập không gian làm việc (workspace isolation) và MCP/Connector, đã có thể tạo nên một quy trình tương tự.

## Loop Engineering thực chất là gì?

Loop Engineering được dùng để sắp xếp các tác vụ nhiều vòng (multi-round) của Agent. Nó đưa cách thức kích hoạt tác vụ, tài liệu được phép đọc và hành động được phép thực thi trong mỗi vòng, tín hiệu nghiệm thu, vị trí lưu trữ trạng thái, cũng như các điều kiện dừng hoặc bàn giao cho con người vào cùng một luồng duy nhất.

Lấy module `auth` làm ví dụ, `goal` có thể được viết thành "tất cả test đều pass, thử tối đa 5 vòng". Cùng một cấu hình tác vụ đó cũng sẽ ghi nhận nguồn kích hoạt, các file và quy tắc được phép truy cập, phạm vi sửa đổi cho phép, và vị trí ghi kết quả.

Giả sử CI kích hoạt tác vụ này: Agent trước tiên đọc quy tắc dự án và log thất bại, định vị các file liên quan rồi chạy test mục tiêu. Kết quả test, lint, kiểm tra kiểu (type check), ảnh chụp màn hình hoặc nhận xét review sẽ được phản hồi cho vòng tiếp theo nhằm giúp đánh giá xem có nên tiếp tục hay không. Các phương án đã thử, nguyên nhân thất bại và bước tiếp theo sẽ được ghi vào file bên ngoài, Issue, thẻ Linear hoặc cơ sở dữ liệu; khi chạm trần số vòng lặp hoặc ngân sách, không đủ quyền hạn, hoặc cần đến phán đoán nghiệp vụ, quy trình sẽ dừng lại và bàn giao cho con người.

![Vòng lặp tầng ngoài của Loop Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/loop-engineering-outer-loop-d4043888.webp)

Prompt, ngữ cảnh và mô tả công cụ vẫn quyết định một lần gọi mô hình sẽ thực thi ra sao. Loop bổ sung vào trước và sau lời gọi đó việc điều phối tác vụ, chuẩn bị tài liệu, kiểm chứng kết quả và phục hồi trạng thái, giúp vòng tiếp theo có thể nối tiếp vòng trước để xử lý trơn tru.

## Thực chất nó đã mượn những khái niệm cũ nào?

### Agent Loop / ReAct: Vòng lặp tầng trong vốn đã tồn tại từ lâu

![Quy trình làm việc của Agent Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-loop-flow-27c47f02.png)

Trình tự cơ bản của Agent Loop không hề thay đổi: đọc ngữ cảnh hiện tại, chuyển cho LLM quyết định bước tiếp theo, gọi công cụ hoặc sinh kết quả, rồi ghi output của công cụ trở lại ngữ cảnh; kết thúc khi đạt điều kiện dừng.

ReAct cũng đi theo tư duy này: Suy luận (Reasoning) và Hành động (Acting) luân phiên diễn ra, mô hình đi một bước nhìn một bước, sau khi nhận phản hồi từ bên ngoài mới quyết định bước tiếp theo.

Bài viết [Khái niệm cơ bản về AI Agent](https://javaguide.cn/ai/agent/agent-basis.html) từng giới thiệu về vòng lặp này. Việc xử lý sự cố online, đọc codebase và định vị lỗi test đều không có một lộ trình hoàn chỉnh cố định từ trước; mô hình cần căn cứ vào bằng chứng thu được qua mỗi lần để điều chỉnh bước đi kế tiếp.

Ở đây cần phân biệt rõ hai tầng vòng lặp. Agent Loop diễn ra bên trong một lần thực thi tác vụ: mô hình suy luận, gọi công cụ, đọc kết quả, rồi quyết định bước tiếp theo. Trong khi đó, Loop tầng ngoài hoạt động sau khi lần thực thi này kết thúc, ví dụ như chờ sự kiện CI tiếp theo, kiểm tra kết quả test, lưu trữ nhật ký điều tra, rồi mới quyết định xem có khởi động lại Agent hay không.

| Tầng | Ai đang lặp | Mỗi vòng làm gì | Điều kiện dừng điển hình |
| --- | --- | --- | --- |
| Agent Loop tầng trong | Chính Agent | Suy nghĩ, gọi công cụ, quan sát kết quả, tiếp tục bước sau | Không cần công cụ nữa, trả về kết quả cuối cùng |
| Engineering Loop tầng ngoài | Hệ thống điều phối hoặc quy trình do con người viết | Đánh thức Agent, phân bổ tác vụ, kiểm chứng kết quả, ghi nhận trạng thái | Đạt mục tiêu, vượt ngân sách, thất bại chuyển sang người xử lý |

### Workflow / Graph / Loop: Cạnh quay lui có thể kiểm soát vốn đã có từ trước

Trong đồ thị luồng công việc (workflow graph), Loop thường được biểu diễn bằng cạnh quay lui (back edge).

Cạnh quay lui là một cạnh có hướng trỏ từ một node phía sau ngược về node phía trước: quy trình đã đi đến node "Review", nhưng vì một điều kiện nào đó không thỏa mãn, nó men theo cạnh này quay trở lại node "Revise", rồi thực thi lại các bước tiếp theo.

![Tổng quan mối quan hệ giữa Workflow, Graph và Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/workflow/workflow-graph-loop-relation-f4be2706.svg)

Trong chuỗi "Tạo bản thảo đầu → Review → Không đạt thì sửa → Lại review", cạnh điều kiện không đạt chính là cạnh quay lui từ "Review" trở về "Revise"; nếu review đạt thì thoát khỏi vòng lặp. Bài viết [Workflow, Graph và Loop trong AI Workflow](https://javaguide.cn/ai/agent/workflow-graph-loop.html) giải thích đầy đủ hơn về cấu trúc này. Cấu hình runtime cũng cần ghi rõ số vòng tối đa, timeout, ngân sách Token và phương án giáng cấp (fallback) khi thất bại, tránh việc cạnh quay lui không có lối thoát.

Coding Agent mở rộng chính cạnh quay lui này sang Claude Code, Codex, CI, GitHub, hệ thống Issue và kho mã nguồn cục bộ: sau khi test thất bại thì đọc lỗi, sửa file, chạy lại lệnh, rồi để tín hiệu bên ngoài quyết định xem có tiếp tục hay không.

### Context Engineering: Mỗi vòng nên cho Agent xem những gì?

Khi một sự cố CI được điều tra đến vòng thứ ba mà vẫn chưa hội tụ, log thô, output kiểm thử, lịch sử thay đổi và các phán đoán mâu thuẫn lẫn nhau rất dễ chất đống lại. Nếu nhồi nhét tất cả vào ngữ cảnh, quy tắc dự án sẽ bị chìm nghỉm, và những phương án từng bị loại trừ lại có nguy cơ bị chạy lại một lần nữa.

![Sự khác biệt giữa Context Engineering và Prompt Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-context-engineering-dimen-10eadd1a.png)

Trước mỗi vòng gọi mô hình, nên nạp trước các quy tắc thường trực như `AGENTS.md`, `CLAUDE.md` và quy chuẩn viết code, sau đó tùy theo lỗi hiện tại mà load các file liên quan, output test, mô tả Issue hoặc tài liệu thiết kế. Các điểm vào điều tra sự cố như traceId, mã lỗi, đường dẫn log cần giữ nguyên giá trị gốc; những tiến trình đã xác minh nên được cô đọng thành kết luận và ghi vào trạng thái bên ngoài.

Khi context window tiệm cận giới hạn, cần cân nhắc giữa việc nén lịch sử, dọn dẹp kết quả công cụ cũ và ghi tiến độ xuống đĩa. Nhờ đó, vòng tiếp theo có thể trực tiếp kế thừa các bằng chứng, tránh việc phải đọc lại toàn bộ dự án, đoán mò quy tắc hoặc giải thích lặp đi lặp lại cùng một lỗi.

### Harness Engineering: Môi trường thực thi bên ngoài mô hình

Trong [Harness Engineering](https://javaguide.cn/ai/agent/harness-engineering.html), Agent có thể tách thành Model + Harness. Mô hình chịu trách nhiệm suy luận và sinh văn bản, còn Harness cung cấp môi trường, công cụ, phản hồi, sandbox, quyền hạn, khả năng quan sát (observability) và khả năng phục hồi (recovery).

![Mối quan hệ giữa Harness và Prompt/Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-engineering-layers-arch-f559e799.png)

Có thể coi Harness như môi trường chạy cho một lượt tác vụ đơn lẻ. Tác vụ CI triage được đọc những log nào, có được sửa file hay không, chạy được những lệnh test nào đều do Harness quyết định; sau đó Loop mới quyết định khi nào thì kích hoạt môi trường này một lần, lưu kết quả ở đâu, và có cần chuyển giao cho một Agent khác kiểm tra hay không. Nếu chỉ có mục tiêu mà không có quyền hạn truy cập file, lệnh kiểm chứng và cơ chế xử lý thất bại thì tác vụ vẫn không thể thực thi tự động mà không có con người giám sát.

### Skills: Đóng gói kinh nghiệm cần giải thích lặp lại qua mỗi vòng

![Chuỗi thực thi của Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-agent-execution-link-ee22c892.png)

Khi việc điều tra CI xảy ra thường xuyên, lệnh chạy test của repository, thư mục cấm sửa đổi, yêu cầu format, template PR và quy tắc xác nhận database migration không nên bị giải thích lại từ đầu ở mỗi vòng.

Những nội dung này có thể đưa vào Skill: phần `description` khớp với tác vụ điều tra CI, còn `SKILL.md` lưu trữ thư mục được phép đọc, lệnh chạy test, template PR và quy tắc kiểm tra migration. Khi tác vụ khớp, phần nội dung chính sẽ được nạp, và lần thất bại tiếp theo vẫn tuân thủ đúng bộ ràng buộc đó.

![Tiết lộ lũy tiến của Skill](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/agent-skills-progressive-disclosure-a73e1cfe.webp)

Skill ghi lại các chỉ dẫn thao tác cần dùng lặp đi lặp lại trong dự án, chứ không phải một đoạn Prompt tạm bợ được chắp vá cho một cuộc hội thoại nhất thời.

### MCP: Giúp Loop tiếp cận công cụ thực tế

GitHub Actions, nền tảng log, Linear và Slack đều có API riêng. Việc phân loại sự cố CI, theo dõi PR và phân luồng tác vụ phải liên tục luân chuyển giữa các hệ thống này; nếu kết nối riêng rẽ từng hệ thống một, trước mặt Agent sẽ xuất hiện rất nhiều bộ mô tả công cụ và phương thức gọi khác nhau.

![Sơ đồ minh họa MCP](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

MCP Server cung cấp GitHub, hệ thống Issue, nền tảng log, tài liệu nội bộ và cơ sở dữ liệu dưới dạng các công cụ có thể khám phá (discoverable tools); Agent Runtime chịu trách nhiệm lựa chọn, trong khi các hệ thống nghiệp vụ bên dưới vẫn thực hiện việc xác thực quyền hạn và kiểm tra tính hợp lệ của dữ liệu.

Quyền hạn công cụ cần được cấu hình dựa trên tác dụng phụ (side effects). Nếu quyền ghi của một Loop chạy tự động quá lớn, nó có thể sửa nhầm dữ liệu, gửi nhầm tin nhắn, gọi lặp lại các API đắt đỏ, hoặc bị prompt injection lừa đọc các file không liên quan; quyền hạn, kiểm toán (audit), giới hạn tốc độ (rate limit), khử nhạy dữ liệu (redaction) và xác nhận thủ công nên được triển khai đồng bộ cùng các công cụ MCP.

## Vậy Loop Engineering thực sự mới ở điểm nào?

TDD, CI, ReAct và đồ thị luồng công việc vốn đã có vòng lặp từ lâu. Điểm mới là Coding Agent đã tiếp quản những thao tác tầng ngoài vốn trước đây do con người làm thủ công: đọc lỗi, định vị file, chạy lại lệnh, cập nhật việc cần làm, rồi chuyển kết quả trở lại vòng sau.

Lấy lỗi kiểm thử làm ví dụ: một cron job hoặc sự kiện CI có thể tạo một worktree độc lập, nạp Skill của dự án, để một Agent triển khai sửa đổi, một Agent kiểm chứng xem xét, rồi ghi kết quả vào trạng thái bên ngoài. Nếu test vẫn thất bại, vòng tiếp theo sẽ căn cứ vào log và kết quả kiểm thử để tiếp tục; khi không đủ quyền hạn, không có tiến triển hoặc gặp thao tác rủi ro cao, quy trình sẽ bàn giao lại cho con người.

Vì vậy, trọng tâm của Loop Engineering thực chất xoay quanh 3 điểm: **Vòng tiếp theo cần bằng chứng gì để tiếp tục, những hành động nào bắt buộc phải tạm dừng chờ phê duyệt, và trạng thái của vòng trước được lưu ở đâu.**

![Vòng lặp tầng ngoài của Loop Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/loop-engineering-outer-loop-d4043888.webp)

## Hiểu về /loop và /goal của Claude Code như thế nào?

`/loop` chạy lại Prompt theo mốc thời gian, còn `/goal` quyết định có tiếp tục hay không dựa trên điều kiện hoàn thành. Xem thêm chi tiết tại [Giải thích chi tiết các lệnh Claude Code](https://javaguide.cn/ai-coding/practices/claudecode-commands.html).

![Claude Code gợi ý sử dụng lệnh loop](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claudecode-father-loop-08b60d03.png)

`/loop` chủ yếu giải quyết bài toán "lát nữa hãy kiểm tra lại một lần". Nó sẽ lặp lại một prompt trong session hiện tại. Bạn có thể đặt một khoảng thời gian cố định, ví dụ mỗi 5 phút kiểm tra deployment một lần; hoặc không đặt khoảng thời gian, để Claude tự chọn thời gian chờ cho lần sau dựa trên kết quả quan sát.

Một lệnh `/loop` trần sẽ chạy maintenance prompt tích hợp sẵn, hoặc đọc `.claude/loop.md`, `~/.claude/loop.md` làm prompt mặc định.

```bash
/loop 5m "Kiểm tra xem deployment đã hoàn thành chưa, và báo cáo trạng thái hiện tại"
/loop 30m /code-review
/loop "Kiểm tra CI và review comments của PR, nếu có thay đổi thì xử lý, không có thì hoãn lại"
```

`/goal` chủ yếu giải quyết bài toán "mục tiêu này đã hoàn thành hay chưa". Bạn đưa ra một điều kiện hoàn thành có thể kiểm chứng được, Claude sẽ tiến hành từng vòng một; sau mỗi vòng, một mô hình nhỏ độc lập sẽ dựa trên các bằng chứng đã xuất hiện trong cuộc hội thoại để phán đoán xem điều kiện đã thỏa mãn hay chưa. Chưa thỏa mãn thì tiếp tục, thỏa mãn rồi thì dừng lại.

```bash
/goal toàn bộ unit test trong module auth đều pass, và lệnh npm test -- tests/auth trả về exit code 0; tối đa 5 vòng, nếu 2 lần liên tiếp thất bại cùng một nguyên nhân thì dừng lại và báo cáo
/goal hoàn thành di chuyển component dưới src/legacy, npm run build thành công, và git diff chỉ chứa src/legacy cùng các file test tương ứng
```

Có thể ghi nhớ sự khác biệt giữa cả hai bằng một câu: `/loop` quyết định lần sau khi nào thức dậy, còn `/goal` phán đoán khi nào thì coi như làm xong.

Stop hook hoặc Agent SDK có thể giao điều kiện tiếp tục cho script, Prompt hoặc evaluator bên ngoài, đồng thời thực thi việc kiểm tra xác định (deterministic check), chặn quyền hạn và lưu trạng thái xuống đĩa sau mỗi vòng.

"Liên tục sửa cho đến khi test pass, thử tối đa 5 lần" sẽ do `/goal` kiểm tra điều kiện hoàn thành. Việc thăm dò trạng thái deploy (deployment polling), theo dõi PR (PR babysitting), kiểm tra bản build chạy dài và định kỳ code review sẽ do `/loop` quan sát lại theo chu kỳ.

`/loop` thuộc dạng điều phối tạm thời theo phạm vi session (session-scoped): tác vụ chỉ được kích hoạt khi Claude Code đang chạy và ở trạng thái rảnh rỗi (idle); đóng terminal, thoát session, mở session mới đều sẽ làm gián đoạn; `--resume` hoặc `--continue` chỉ có thể khôi phục các tác vụ chưa hết hạn; các tác vụ lặp tự động hết hạn sau tối đa 7 ngày.

Khi tác vụ bắt buộc phải chạy ổn định lâu dài xuyên máy móc và qua các lần khởi động lại, bạn vẫn nên cân nhắc Routines, Desktop scheduled tasks, GitHub Actions, CI/CD hoặc hệ thống lập lịch tác vụ chuyên dụng của riêng bạn.

Trước khi chạy `/loop`, hãy siết chặt quyền hạn, ghi rõ mục tiêu thăm dò và điều kiện dừng; trước khi chạy `/goal`, hãy viết điều kiện hoàn thành thành kết quả có thể xác minh được, và yêu cầu Claude hiển thị kết quả kiểm thử, build hoặc diff. Hãy commit các đường dẫn quan trọng trước khi để Agent sửa đổi, nhờ đó khi xảy ra lỗi có thể dễ dàng rollback về điểm commit rõ ràng.

## Loop có thể chia thành mấy loại?

Sự khác biệt của Loop chủ yếu nằm ở chỗ "ai kích hoạt vòng tiếp theo". `/loop` và `/goal` lần lượt đại diện cho việc thức dậy theo thời gian và tiếp tục theo điều kiện hoàn thành; các sự kiện CI và phê duyệt thủ công cũng có thể trở thành điểm kích hoạt. Bảng dưới đây phân loại theo tiêu chí này:

| Loại | Cách thức kích hoạt | Phù hợp với tác vụ | Công cụ tiêu biểu |
| --- | --- | --- | --- |
| Loop hướng thời gian (Time-driven) | Mỗi N phút, mỗi ngày, mỗi tuần | PR babysitting, kiểm tra CI, tuần tra log | `/loop`, Codex Automations, cron |
| Loop hướng sự kiện (Event-driven) | CI thất bại, Issue được tạo, PR cập nhật | Phân loại sự cố, xử lý comment, tóm tắt cảnh báo | GitHub Actions, Webhook, Claude Code Channels |
| Loop hướng mục tiêu (Goal-driven) | Kiểm tra mục tiêu đã đạt chưa sau mỗi vòng | Sửa test, migrate API, bổ sung độ phủ test | `/goal`, Stop hook, Agent SDK |
| Loop phê duyệt thủ công (Human Approval) | Dừng lại xác nhận trước hành động quan trọng | Thay đổi rủi ro cao, release, thay đổi quyền | approval gate, draft PR, review queue |

Bảng này cũng giải thích cho nhận định "bình mới rượu cũ" ở phần trước. Kích hoạt, điều phối, xác minh, phê duyệt đều là những kỹ thuật công nghệ không hề mới, chỉ là hiện nay chúng được sắp đặt lại xung quanh Coding Agent.

## Một Loop khả thi trong thực tế trông như thế nào?

Lấy ví dụ về việc "tự động xử lý CI thất bại hàng ngày". Ở đây tổng hợp theo quy trình điều tra phổ biến, không đại diện cho một case study thực tế nguyên bản của riêng công ty nào. Phiên bản đầu tiên chỉ làm phân loại (triage), không tự động sửa code, cũng không tự động merge.

Phiên bản đầu tiên chỉ kiểm chứng ba điều: Agent có tìm đúng bằng chứng không, có phân biệt được sự thật và suy đoán không, có ghi lại trạng thái theo định dạng thống nhất không. Sau khi cả ba yếu tố này ổn định, mới cân nhắc mở quyền sửa lỗi rủi ro thấp.

CI triage có thể được kích hoạt vào 9 giờ sáng hàng ngày hoặc khi CI thất bại, đọc lần thất bại gần nhất, PR liên quan, commit gần nhất và log kiểm thử thất bại. Nó nạp `AGENTS.md` của dự án cùng `ci-triage` Skill, chỉ đọc các file thuộc module liên quan, và phân biệt giữa dao động môi trường, test không ổn định (flaky test), lỗi hồi quy mã nguồn và xung đột dependency.

Nếu có thể tái hiện tại local thì chạy bộ kiểm thử tối thiểu; nếu không tái hiện được thì giữ nguyên bằng chứng. Kết luận được ghi vào `TODO.md`, GitHub Issue hoặc thẻ Linear, kèm nhãn "Có thể tự động sửa", "Cần người phụ trách xác nhận" hoặc "Nghi ngờ lỗi ngẫu nhiên". Quy trình không trực tiếp push code, không sửa cấu hình production, và số lần retry liên tiếp không quá 3 lần.

![Ví dụ Loop điều tra CI](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/loop-engineering-ci-triage-loop-30220744.webp)

Đợi sau khi phiên bản này ổn định, mới từng bước bổ sung tính năng tự động sửa lỗi:

- Với các vấn đề rủi ro thấp như "xung đột phiên bản dependency", "lỗi formatting", "cập nhật snapshot test rõ ràng", có thể mở một worktree độc lập để Agent thử sửa.
- Sửa xong bắt buộc phải chạy test mục tiêu.
- Khi đã pass, chỉ tạo PR dạng draft, tuyệt đối không tự động merge.
- Một Agent review thứ hai sẽ kiểm tra lại dựa trên Skill của dự án và diff.
- Khi thất bại hoặc không chắc chắn, chuyển việc trở lại hàng đợi cho con người xử lý.

Trong Loop này, ta có thể thấy sự hiện diện của các bộ phận đã nhắc tới trước đó:

| Bộ phận | Làm gì trong ví dụ này |
| --- | --- |
| Automation | Khởi động hàng ngày hoặc khi CI thất bại |
| Skill | Cố định quy trình điều tra CI, lệnh test, quy tắc repository |
| MCP / Connector | Đọc dữ liệu từ GitHub, CI, Issue, nền tảng log |
| Context Engineering | Chỉ nạp log, file và quy tắc liên quan trực tiếp đến lỗi |
| Worktree | Cô lập nhánh tự động sửa, tránh làm bẩn workspace chính |
| Sub-agent | Một bên chịu trách nhiệm hiện thực hóa, một bên chịu trách nhiệm kiểm chứng |
| Memory / State | Ghi nhận phương án đã thử, nguyên nhân thất bại và bước tiếp theo |
| Stop Condition | Test pass, chạm trần số lần retry, gặp thao tác rủi ro cao |

"Chạy lúc 9 giờ sáng mỗi ngày" chỉ mang lại thời điểm khởi động. Link CI và log lỗi xác định điểm bắt đầu điều tra; lệnh tái hiện tối thiểu và kết quả test quyết định có tiếp tục hay không; PR diff và trạng thái xác nhận của con người quyết định các thay đổi có thể chuyển sang bước tiếp theo hay không. Nếu thiếu các bằng chứng bên ngoài này, tác vụ định kỳ sẽ chỉ lặp lại một Prompt duy nhất vô ích.

## Kịch bản nào đáng để làm Loop?

Việc thực thi vòng lặp đòi hỏi các tác vụ xuất hiện lặp lại và có tín hiệu nghiệm thu kiểm tra được. Log, exit code, độ phủ kiểm thử (coverage) và diff đều có thể làm căn cứ để tiếp tục hoặc dừng lại. Những tác vụ sau thường có thể viết ra các điều kiện như vậy:

- Điều tra sơ bộ CI thất bại: có log, có kết quả test, có tín hiệu lỗi rõ ràng.
- Nâng cấp phiên bản dependency: sửa đổi trong branch độc lập, nghiệm thu bằng exit code của test và kết quả build.
- Bổ sung độ phủ kiểm thử: mục tiêu có thể lượng hóa, ví dụ nâng coverage module từ 62% lên 75%.
- Đồng bộ tài liệu: cập nhật tài liệu người dùng hoặc API dựa trên diff gần nhất, cuối cùng qua review thủ công.
- Di chuyển cơ học quy mô lớn: ví dụ chuyển từ CommonJS sang ESM, thay thế API component cũ, sửa lỗi định dạng mã nguồn.
- Phân loại PR / Issue: đọc thông tin, phân loại, bổ sung tóm tắt, gắn nhãn mức độ ưu tiên.

Ngược lại, các tác vụ sau rất khó nghiệm thu chỉ dựa vào tín hiệu bên ngoài:

- Mục tiêu mơ hồ, ví dụ "làm cho trải nghiệm sản phẩm tốt hơn", "nghĩ một chiến lược tăng trưởng".
- Tín hiệu kiểm chứng rất yếu, chỉ dựa vào việc Agent tự bảo "tôi thấy ổn rồi".
- Một khi làm sai sẽ gây hậu quả lớn, ví dụ thao tác ghi database production, thay đổi hệ thống phân quyền, tái cấu trúc luồng thanh toán.
- Phụ thuộc mạnh vào thẩm mỹ và phán đoán nghiệp vụ của con người, ví dụ định hình văn phong thương hiệu, các đánh đổi sản phẩm phức tạp.
- Thay đổi lớn trên dự án cũ không có test, không có log, không có cơ chế rollback.

Những yêu cầu như "trải nghiệm tốt hơn" hoặc "tiếp tục tối ưu hóa" không thể kích hoạt phán đoán dừng đáng tin cậy. Trước khi tạo vòng lặp, hãy chia nhỏ mục tiêu thành các tác vụ con kiểm tra được và viết rõ tiêu chuẩn đánh giá.

## Những cạm bẫy dễ mắc phải nhất

### Đặt mục tiêu quá mơ hồ

"Tiếp tục tối ưu thêm một chút" thiếu phạm vi sửa đổi, lệnh kiểm chứng và điều kiện dừng, khiến Agent không thể căn cứ vào đó để kết thúc tác vụ.

Cách viết chỉ có mục tiêu chung chung:

```text
/goal "Tối ưu dự án này, làm cho chất lượng code tốt hơn"
```

Cách viết có phạm vi thực thi và điều kiện thoát rõ ràng:

```text
/goal "Tất cả unit test đang fail trong module auth đều pass, chỉ được phép sửa src/auth và tests/auth; sau mỗi vòng sửa đổi hãy chạy npm test -- tests/auth và hiển thị exit code; tối đa 5 vòng; nếu 2 lần liên tiếp fail cùng một lý do thì dừng lại và báo cáo"
```

`src/auth`, `tests/auth`, exit code kiểm thử, giới hạn 5 vòng và điều kiện thất bại liên tiếp đều có thể kiểm tra bằng chương trình; câu lệnh thứ hai không để tiêu chuẩn nghiệm thu cho Agent tự đoán mò.

### Coi việc Agent tự đánh giá là nghiệm thu

Exit code của test, trạng thái CI, lint, kiểm tra kiểu hoặc so sánh screenshot mới là bằng chứng hoàn thành; lời giải thích của Agent chỉ có thể đóng vai trò bổ sung. Khi cần review ngữ nghĩa, có thể để một Agent hiện thực hóa, một Agent khác kiểm tra trong một ngữ cảnh độc lập; các bước tiệm cận production thì bổ sung thêm khâu phê duyệt của con người.

### Quên đặt trần chi phí

Mỗi vòng lặp đều có thể đọc lại file, gọi công cụ, giải thích báo lỗi, nén ngữ cảnh hoặc khởi động Agent thẩm định. Cấu hình tác vụ cần đồng thời giới hạn ngân sách và điều kiện dừng:

- Số lần lặp tối đa.
- Số lần gọi công cụ tối đa.
- Ngân sách Token / chi phí theo ngày hoặc theo tác vụ.
- Phát hiện không có tiến triển (no-progress detection), ví dụ dừng lại nếu hai vòng liên tiếp gặp nguyên nhân thất bại giống hệt nhau.
- Tác vụ giá trị thấp chỉ thực hiện tóm tắt, không tự động sửa lỗi.

Cơ chế phát hiện không có tiến triển dùng để ngăn chặn việc tiếp tục tiêu tốn Token khi nguyên nhân lỗi không thay đổi.

### Trao quyền hạn quá rộng

Đọc log, tạo PR, tự động merge PR có mức độ rủi ro hoàn toàn khác nhau, không thể dùng chung một bộ quyền hạn để cấp phép. Các thao tác như xóa file, sửa cấu hình production, gửi tin nhắn ra ngoài, ghi cơ sở dữ liệu mặc định đều phải đợi con người xác nhận.

Nguồn gốc của MCP Server, description của công cụ, nội dung trả về và template Prompt cũng cần đưa vào diện thẩm định, vì những nội dung này đều có thể chứa prompt injection. Quyền hạn có thể mở dần theo từng giai đoạn thực thi:

| Giai đoạn | Agent có thể làm gì | Con người chịu trách nhiệm gì |
| --- | --- | --- |
| L0 Tóm tắt chỉ đọc (Read-only) | Đọc log, đọc Issue, tạo báo cáo | Đánh giá xem có áp dụng hay không |
| L1 Tái hiện tại local | Chạy test chỉ định, định vị lỗi | Quyết định xem có sửa hay không |
| L2 Bản thảo sửa lỗi | Sửa code trong worktree, chạy test | Review diff |
| L3 Tạo PR | Tạo commit lên nhánh, viết mô tả PR | Thẩm định, merge |
| L4 Tự động merge | Tự động merge sau khi pass qua chính sách | Chỉ xử lý khi có ngoại lệ |

L1/L2 bao quát việc đọc log, tái hiện vấn đề và sửa bản thảo. L4 đòi hỏi loại vấn đề phải cố định, kiểm thử bao quát được các rủi ro chính, đường dẫn rollback đã được kiểm chứng; các tác vụ liên quan đến phán đoán nghiệp vụ, phân quyền hoặc ghi dữ liệu tiếp tục giữ lại khâu phê duyệt thủ công.

![Ranh giới an toàn của Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/loop-engineering-safety-boundary-658e0391.webp)

## Phiên bản đầu tiên đừng vội tự động sửa

Lần đầu làm Loop, không nên nhảy ngay vào tự động sửa lỗi mà không có người giám sát. Bạn có thể bắt đầu từ khâu phân loại chỉ đọc (read-only triage), mô tả tác vụ thà viết chi tiết một chút:

```text
Tác vụ: Hàng ngày kiểm tra các lỗi CI trong 24 giờ qua, tạo bản tóm tắt điều tra cho con người xử lý.

Được phép làm:
- Đọc GitHub Actions, các commit gần nhất, log test thất bại, và các file liên quan trực tiếp đến báo lỗi.
- Khi định vị được test cụ thể, có thể chạy test tương ứng để xác nhận xem có tái hiện được không.
- Ghi kết luận vào TODO.md, kèm link CI, lỗi mấu chốt và người phụ trách được đề xuất.

Trước khi bắt đầu:
- Đọc AGENTS.md trước.
- Khi khớp tác vụ điều tra CI thì nạp ci-triage Skill.

Không được phép làm:
- Không sửa code, không tạo PR, không gửi Slack/email.
- Không đọc các file không liên quan trong toàn bộ repository, không dán toàn bộ log thô vào ngữ cảnh.
- Quá 10 mục thất bại thì dừng lại; một mục thất bại tái hiện tối đa 2 lần.
- Khi thiếu quyền, thiếu log, cần phán đoán nghiệp vụ, đánh dấu ngay để con người xử lý.
```

Phiên bản này quản lý rất chặt chẽ: chỉ xem bằng chứng CI và file liên quan, không sửa code, không gửi tin nhắn ra ngoài; số lượng lỗi và số lần tái hiện cũng được đặt trần. Trong bản tóm tắt phân loại, trước tiên hãy để mắt đến ba loại vấn đề: file không liên quan, lời gọi công cụ lặp lại và hành động vượt quyền. Chừng nào chúng chưa được xử lý triệt để thì không nên mở quyền sửa code.

Khi tác vụ kéo dài qua nhiều ngày, session mới mở sẽ không tự nhiên biết được hôm qua đã thử những gì. Những nội dung cần khôi phục phải ghi trực tiếp vào trạng thái bên ngoài: mục tiêu, phạm vi, bằng chứng, hành động đã thực hiện, kết quả, bước tiếp theo và điều kiện dừng đều phải để vòng sau đọc được.

```yaml
loop_id: ci-triage-2026-06-17
goal: "Điều tra các lỗi CI trong 24 giờ qua"
status: running
scope:
  repos: ["backend-service"]
  max_items: 10
attempts:
  - item: "auth-test failure"
    evidence: "GitHub Actions run #12345"
    action: "ran npm test -- tests/auth"
    result: "reproduced locally"
next_step: "ask auth owner to review"
stop_condition:
  max_attempts: 3
  require_human_when:
    ["permission_missing", "production_change", "uncertain_root_cause"]
```

Đợi quy trình triage này chạy ổn định, hãy thêm bốn ràng buộc cứng cho tính năng tự động sửa lỗi:

- Tạo worktree hoặc branch độc lập trước khi sửa đổi.
- Danh sách trắng (whitelist) phạm vi sửa đổi file.
- Chỉ cho phép chạy các lệnh test và format chỉ định.
- Khi pass chỉ tạo PR dạng draft, không tự động merge.

## Trước khi đưa Loop vào quy trình Production

### Điều gì sẽ kích hoạt vòng tiếp theo?

Tác vụ định kỳ hàng ngày sẽ lọc ra các lỗi trong khoảng thời gian gần nhất; sự kiện CI thất bại có thể chuyển trực tiếp job bị lỗi, PR liên quan và commit gần nhất cho quy trình triage. Phạm vi tác vụ, file được phép đọc và các lệnh khả dụng nên được truyền kèm theo tác vụ lần này, để session mới căn cứ vào đó chuẩn bị ngữ cảnh.

### Khi nào tiếp tục, khi nào dừng?

Link CI, log lỗi, lệnh tái hiện tối thiểu và exit code kiểm thử có thể chứng minh việc điều tra có tiến triển mới hay không; `attempts` và `stop_condition` sẽ lưu các hành động đã thử và lý do dừng lại trong trạng thái bên ngoài. Khi không đủ quyền, không thể tái hiện, cần phán đoán nghiệp vụ, hoặc số lần thất bại liên tiếp chạm trần, tác vụ nên được chuyển trở lại hàng đợi cho con người. Tạo PR, sửa cấu hình production và tự động merge không bao giờ nên trở thành các hành động kế tiếp mặc định trong cùng một Loop tự động.

## Tổng kết

Loop Engineering kết nối mỗi lần gọi mô hình với bằng chứng, trạng thái và ràng buộc mà vòng trước để lại.

Quy trình CI triage trong bài viết bắt đầu từ việc đọc log, định vị lỗi và ghi nhận kết luận, với trạng thái YAML lưu trữ `evidence`, `action`, `result` và `next_step`. Các trường này giúp vòng tiếp theo có thể tiếp tục xử lý ngay, đồng thời giúp con người khi tiếp quản có thể thấy rõ những gì đã được thực hiện. Khi khâu điều tra chỉ đọc đã ổn định, bạn mới từng bước mở thêm các quyền sửa code, tạo PR và tự động merge.
