---
title: "Claude Code Agent View: Thực chiến quản lý song song đa session"
description: "Agent View do Anthropic phát hành mang đến khả năng quản lý đa session ngay trong terminal cho Claude Code, giúp tập trung theo dõi trạng thái Agent, xử lý input và quản lý các session chạy nền."
category: Thực chiến lập trình AI
head:
  - - meta
    - name: keywords
      content: Claude Code, Agent View, quản lý đa session, Agent song song, lập trình AI, công cụ CLI, điều phối session
lang: vi
sourceRef: zh-ref/ai-coding/practices/claudecode-agentview.md
---

Xin chào mọi người, mình là Tiểu G.

Bình thường khi dùng Claude Code, mình hay mở nhiều session cùng một lúc: một session viết tính năng mới, một session refactor code, một session chạy test, một session xem log lỗi, và một session khác phân loại comment PR hoặc bổ sung tài liệu.

![Mở nhiều cửa sổ terminal, để nhiều Agent chạy song song trong các session khác nhau](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/multi-agent-parallel-sessions-c335f852.png)

Trước đây làm việc như thế này thực sự khá mệt mỏi. Mình thường chia nhiều khung hình trong Ghostty, kết hợp thêm vài tab terminal. Màn hình chia kín mít nhìn qua thì tưởng như hiệu suất song song đã đạt đỉnh, nhưng trong đầu lúc nào cũng phải ghi nhớ: session nào đang chạy? session nào đã xong? session nào bị kẹt ở bước xác nhận quyền hạn? session nào bị báo lỗi?

Khó chịu nhất là có những Agent thực ra đã dừng lại đợi bạn xác nhận từ lâu, nhưng bạn hoàn toàn không để ý. Đến lúc chuyển tab quay lại xem thì nó đã nằm chờ ở đó mười mấy phút rồi.

**Agent View** do Anthropic ra mắt cách đây không lâu đã giải quyết trúng điểm đau đầu này. Nó gom toàn bộ các session chạy nền vào một danh sách duy nhất: đang làm việc, đang đợi input, đã hoàn thành hay gặp lỗi, chỉ cần liếc mắt một cái là biết ngay. Claude vẫn là Claude đó, nhưng mình không còn phải dùng não để duy trì "bảng trạng thái session" kia nữa.

Như mình từng chia sẻ trong bài [Lập trình AI nên chọn CLI hay IDE?](https://mp.weixin.qq.com/s/6a3f2U6ZAJa2N7Cp10S01Q), một số workflow mới của AI Coding thường được thử nghiệm trước ở môi trường CLI. Agent View là một minh chứng rõ ràng. Tuy nhiên, bản chất của nó hiện tại thiên về một "trình quản lý session chạy nền", chứ chưa phải là nền tảng điều phối đa Agent tự động phân rã nhiệm vụ, phân công vai trò và giải quyết xung đột code.

Nếu bạn chưa quen với Claude Code, bạn có thể tham khảo trước hai bài viết này:

- [Hướng dẫn sử dụng Claude Code](https://javaguide.cn/ai-coding/practices/claudecode-tips.html): Sub-Agent, cộng tác đa instance (Multi-Claude), cấu hình CLAUDE.md...
- [Chi tiết các lệnh cốt lõi của Claude Code](https://javaguide.cn/ai-coding/practices/claudecode-commands.html): Cách dùng thực chiến các lệnh `/simplify`, `/loop`, `/batch`...

## Cách mở Agent View

Agent View hiện vẫn đang ở giai đoạn Research Preview (bản xem trước nghiên cứu), yêu cầu Claude Code từ phiên bản `v2.1.139` trở lên. Bạn có thể kiểm tra phiên bản trước:

```bash
claude --version
```

Cách mở trực tiếp nhất là chạy lệnh sau trong terminal:

```bash
claude agents
```

![Chạy trực tiếp claude agents trong terminal để vào Agent View](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-agents-list-view-d7153338.png)

Sau khi mở lên, mỗi session chạy nền sẽ chiếm một dòng. Bên trái là icon trạng thái, ở giữa là tên session và phần tóm tắt thực thi gần nhất, bên phải là thời gian đã chạy. Các session mặc định được nhóm theo trạng thái, những session cần bạn xử lý sẽ được ưu tiên xếp lên đầu.

Các session Claude Code thông thường đang mở sẽ không tự động xuất hiện ở đây. Nếu muốn đưa session hiện tại xuống chạy nền, bạn gõ:

```text
/bg
```

Hoặc khi ô nhập liệu đang trống, bạn có thể bấm phím mũi tên trái `←`. Cả hai thao tác này đều giúp tách session xuống chạy nền mà không làm gián đoạn nhiệm vụ. Sau đó, bạn dùng các phím mũi tên để chọn session rồi bấm `Enter` hoặc `→` để quay lại cuộc trò chuyện đầy đủ.

![Truy cập vào session Agent cụ thể](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/enter-agent-session-fb97ad7b.png)

## Nhìn màu vàng trước, nhìn màu đỏ sau

Khi Agent View mở ra, mình thường quét qua các icon trạng thái bên trái đầu tiên. Chúng đáng xem hơn tên session rất nhiều vì cho biết ngay lập tức chỗ nào đang cần bạn can thiệp.

![Claude Code Agent View](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-agents-list-view-20260518102539932-7c769093.png)

| Trạng thái | Biểu hiện giao diện | Cách xử lý |
| --- | --- | --- |
| `Needs Input` | Màu vàng | Đang chờ câu trả lời, xác nhận quyền hoặc đăng nhập; ưu tiên xử lý trước |
| `Working` | Hiệu ứng động | Vẫn đang gọi công cụ hoặc sinh phản hồi; có thể để đó cho chạy tiếp |
| `Completed` | Màu xanh lá | Nhiệm vụ kết thúc bình thường; tiếp theo kiểm tra Diff, test và kết quả thực thi |
| `Failed` | Màu đỏ | Gặp lỗi khi chạy; mở tóm tắt hoặc xem log để tìm nguyên nhân |
| `Idle` | Làm mờ | Hiện không có nhiệm vụ; có thể tiếp tục gửi lệnh mới |
| `Stopped` | Màu xám | Session đã bị dừng thủ công, hoặc tiến trình bị tắt từ bên ngoài |

Có một điểm rất dễ gây hiểu nhầm: nhóm `Completed` trên giao diện cũng gom cả các session thất bại và session đã dừng, tên nhóm không có nghĩa là toàn bộ nhiệm vụ bên trong đều thành công. Việc nhiệm vụ có thực sự hoàn thành tốt hay không vẫn phải căn cứ vào màu sắc icon và kết quả thực thi cụ thể.

Màu vàng là hữu ích nhất. Trước đây mình cứ tưởng session vẫn đang cặm cụi chạy, nhảy tab sang mới thấy nó đã đứng chờ ở câu hỏi "Có cho phép chạy lệnh này không?" từ đời nào. Bây giờ cứ thấy màu vàng là xử lý ngay, không có màu vàng thì cứ tập trung làm việc khác.

## Phản hồi trực tiếp, không cần chuyển màn hình

Khi chọn một session rồi bấm phím cách `Space`, phía dưới sẽ bật lên Peek Panel hiển thị output gần nhất hoặc câu hỏi mà Claude đang chờ bạn trả lời.

![Agent View: chọn một session rồi bấm phím cách để mở Peek Panel](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/peek-panel-reply-7adc329a.png)

Nếu chỉ là xác nhận đơn giản như "Có cho phép sửa file này không?" hoặc "Có tiếp tục chạy test không?", bạn có thể trả lời trực tiếp ngay trong panel này. Session nhận được phản hồi sẽ tiếp tục chạy mà bạn không cần phải nhảy vào xem toàn bộ cuộc hội thoại.

Trước đây bạn phải tìm đúng tab terminal, xem nó đang kẹt ở đâu, gõ trả lời rồi lại nhảy tab về. Giờ đây chỉ cần một phím cách là xử lý xong, tiện hơn rất nhiều trong công việc thường ngày.

Nếu muốn xem toàn bộ ngữ cảnh, bấm `Enter` hoặc `→` để vào session; xem xong bấm `←` để quay lại Agent View.

Phím tắt không cần học thuộc lòng, phía dưới màn hình có hiển thị gợi ý, bấm `?` sẽ mở bảng trợ giúp đầy đủ. Các phím hay dùng nhất gồm:

| Phím tắt | Chức năng |
| --- | --- |
| `↑` / `↓` | Di chuyển trong danh sách session |
| `Space` | Bật hoặc tắt Peek Panel |
| `Enter` | Vào session, hoặc giao task nếu ô nhập liệu có nội dung |
| `Shift+Enter` | Giao task và vào ngay session mới đó |
| `Alt+1` ~ `Alt+9` | Nhảy trực tiếp đến session thứ N |
| `Ctrl+T` | Ghim hoặc bỏ ghim session hiện tại |
| `Ctrl+R` | Đổi tên session hiện tại |
| `Ctrl+X` | Dừng session; bấm lại lần nữa trong vòng 2 giây để xóa |

Thao tác bấm `Ctrl+X` hai lần liên tiếp cần hết sức cẩn thận. Nếu session sử dụng Worktree do Claude Code tự động tạo, việc xóa session có thể làm mất luôn cả các thay đổi chưa commit bên trong worktree đó.

## Đưa nhiệm vụ xuống chạy nền

Trong một session đang mở, bạn gõ `/bg` để đưa thẳng nhiệm vụ xuống chạy nền:

```text
/bg
```

Lệnh này sẽ chuyển session hiện tại thành background task và quay về Agent View.

![/bg đưa nhiệm vụ xuống chạy nền](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/bg-background-session-eb4d9f59.png)

Bạn cũng có thể kèm thêm một câu lệnh rồi mới chuyển xuống nền:

```text
/bg Chạy xong test và sửa các ca kiểm thử bị lỗi
```

Nếu nhiệm vụ chưa bắt đầu, việc tạo thẳng session chạy nền từ Shell sẽ nhanh gọn hơn:

```bash
claude --bg "Sửa toàn bộ unit test thất bại trong module auth cho đến khi pass hết"
```

Những loại tác vụ tốn thời gian nhưng không cần ngồi canh chừng liên tục rất thích hợp để đưa xuống nền:

- Chạy một tập test bị fail và cố gắng sửa chúng
- Quét lỗi type (kiểu dữ liệu) của một module
- Dọn dẹp, chuẩn hóa tài liệu hàng loạt
- Phân tích comment trên PR và đưa ra gợi ý sửa đổi
- Thực hiện các thay đổi quy mô nhỏ đồng thời trên nhiều repository

Mitchell Hashimoto (đồng sáng lập HashiCorp, tác giả của Ghostty) từng chia sẻ một thói quen rất thú vị trong [My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey): 30 phút cuối mỗi ngày làm việc, ông giao các tác vụ nghiên cứu sâu, khám phá ý tưởng sơ bộ, hoặc phân loại Issue và PR cho Agent chạy qua đêm, sáng hôm sau đi làm chỉ việc xem kết quả.

Ông cũng chia sẻ rất chừng mực: trạng thái lý tưởng là lúc nào cũng có Agent xử lý công việc hữu ích, nhưng thực tế chỉ khoảng 10%～20% thời gian làm việc đạt được điều đó, và thường cũng chỉ chạy một Agent duy nhất. Tỷ lệ này sát với thực tế công việc phát triển thường nhật hơn nhiều, không cần thiết phải cố gượng ép mở hàng loạt Agent chạy song song chỉ để cho có vẻ năng suất.

## Các lệnh Shell quản trị

Nếu không muốn mở giao diện Agent View, bạn hoàn toàn có thể quản lý các session chạy nền trực tiếp từ Shell:

```bash
claude agents          # Mở giao diện Agent View

claude attach <id>     # Chuyển vào session chỉ định

claude logs <id>       # In ra output gần nhất của session chỉ định

claude stop <id>       # Dừng session, cũng có thể dùng claude kill

claude respawn <id>    # Khởi động lại session chỉ định, giữ nguyên lịch sử trò chuyện

claude respawn --all   # Khởi động lại toàn bộ session chạy nền đang chạy

claude rm <id>         # Xóa session khỏi danh sách
```

Trong số các lệnh này, lệnh ít dùng nhưng dễ hiểu sai nhất là `respawn`:

```bash
claude respawn <id>
```

Nó sẽ khởi động lại tiến trình của Session chỉ định trong khi lịch sử hội thoại trước đó vẫn được giữ nguyên. Lệnh này hữu ích khi Claude Code được cập nhật phiên bản mới và bạn muốn session chạy nền chuyển sang dùng binary mới, hoặc khi tiến trình session bị thoát đột ngột.

`respawn` không phải là Context Reset, và nó không tạo ra một context sạch sẽ. Nếu session cũ đã bị ngập ngụa bởi log rác và phương án lỗi thời, việc khởi động lại tiến trình không giải quyết được vấn đề ô nhiễm context. Khi gặp tình huống đó, mở một session mới toanh kèm theo một bản tóm tắt nhiệm vụ chuẩn xác sẽ an toàn hơn nhiều.

Ngoài ra, `claude rm <id>` chủ yếu là xóa session khỏi danh sách chạy nền. Lịch sử trò chuyện vẫn được lưu trên máy và có thể tìm lại qua `claude --resume`; Worktree do Claude Code tự động tạo chỉ được dọn dẹp khi đã xác nhận an toàn.

## Giao việc trực tiếp từ Agent View

Phía dưới Agent View có một ô nhập lệnh. Gõ nhiệm vụ vào rồi bấm `Enter` sẽ tạo một Session chạy nền mới; gõ tiếp nhiệm vụ khác sẽ tạo thêm một Session mới nữa chứ không phải tiếp nối câu hỏi của session trước. Muốn bổ sung thông tin cho session có sẵn, bạn cần trả lời qua Peek Panel hoặc bấm vào session đó.

Ô nhập lệnh còn hỗ trợ một số cú pháp đặc biệt:

| Định dạng nhập | Tác dụng |
| --- | --- |
| `<agent-name> <prompt>` | Nếu từ đầu tiên khớp với tên custom subagent, dùng nó làm Agent chính |
| `@<agent-name>` | Chỉ định một custom subagent bên trong Prompt |
| `@<repo>` | Chọn repository hoặc thư mục khác để khởi động session tại đó |
| `/<command>` | Tìm kiếm và thực thi Skill hoặc lệnh có thể giao phó |
| `! <command>` | Khởi động trực tiếp tác vụ Shell chạy nền, không gọi model |
| `#<number>` hoặc URL của PR | Nếu đã có session đang xử lý PR này, sẽ chọn thẳng vào session đó |

Custom Subagent thường đặt trong thư mục `.claude/agents/` của dự án hoặc `~/.claude/agents/` của người dùng. Chuẩn bị sẵn một Agent chuyên dụng cho các việc lặp đi lặp lại như code review, phân tích test sẽ giúp bạn không phải mất công thiết lập công cụ và ranh giới mỗi lần giao việc.

Cú pháp `#<number>` và PR URL cũng rất thực tế. Nếu đã có sẵn một session đang xử lý cùng một PR, Agent View sẽ chọn thẳng vào session cũ đó, tránh việc hai session cùng sửa trùng lặp.

## Trường hợp nào nên dùng

Để đánh giá một nhiệm vụ có nên đưa vào Agent View hay không, mình chủ yếu dựa vào hai điểm: nó có thể tạm rời xa sự can thiệp của mình để tự tiến hành độc lập không, và khi quay lại mình có thể nghiệm thu kết quả thông qua Diff, test hoặc log không. Thỏa mãn cả hai điều này thì đưa xuống chạy nền sẽ rất nhàn đầu.

### Xử lý đồng thời vài việc nhỏ độc lập nhau

Ví dụ bạn có 5 yêu cầu nhỏ, có thể chia cho 5 session: một cái sửa test, một cái quét lỗi type, một cái chỉnh sửa tài liệu, hai cái còn lại xử lý hai bug không liên quan nhau. Giao task xong bạn cứ làm việc chính của mình, lát sau quay lại kiểm tra trạng thái: màu vàng xử lý trước, màu đỏ xem log điều tra, màu xanh tiến hành nghiệm thu tập trung.

Điều kiện tiên quyết là các nhiệm vụ này phải thực sự độc lập. Nếu 5 session cùng sửa vào một nhóm file, dù có Worktree cô lập thì cuối cùng bạn vẫn phải đau đầu xử lý conflict code và sửa trùng lặp. Thời gian tiết kiệm được rất có thể lại bị tiêu tốn hết vào việc merge code.

[Thí nghiệm viết C compiler của Nicholas Carlini](https://www.anthropic.com/engineering/building-c-compiler) đã đẩy quy mô song song lên một tầm cao mới: 16 instance Claude Opus 4.6 trong hai tuần đã chạy gần 2.000 session Claude Code, tạo ra khoảng 100.000 dòng code với chi phí gần 20.000 USD. Thí nghiệm này sử dụng Agent Teams và execution harness tùy chỉnh chứ không chỉ đơn thuần là năng lực của Agent View.

Áp dụng vào công việc hằng ngày, thứ đáng học hỏi nhất là cách phân rã nhiệm vụ, phân vai trách nhiệm và thiết lập ràng buộc bằng test. Thiếu những khâu này, việc mở thêm nhiều session chỉ khiến xung đột nảy sinh nhanh hơn mà thôi.

### Chờ đợi CI, Test bộ lớn và PR Review

CI, integration test và PR Review thường xuyên phải chờ kết quả từ hệ thống bên ngoài. Cứ để session ở foreground sẽ khiến bạn sốt ruột vài phút lại ngó một lần; chuyển xuống chạy nền, đợi khi trạng thái chuyển sang vàng, đỏ hoặc hoàn thành thì mới quay lại xử lý.

Cứ sau một khoảng thời gian kiểm tra CI một lần thì dùng `/loop`; nhiệm vụ có điều kiện kết thúc rõ ràng như "liên tục sửa cho tới khi toàn bộ test pass" thì dùng `/goal` sẽ chuẩn hơn. Agent View chỉ đóng vai trò hiển thị trạng thái session, còn việc lập lịch định kỳ và thực thi liên tục vẫn do các lệnh này đảm nhiệm.

Hệ thống [Minions của Stripe](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents) đã biến chuỗi quy trình này thành một nền tảng nội bộ: kỹ sư giao task từ Slack, Agent phụ trách code, kiểm chứng và tạo PR, mỗi tuần có hơn 1.000 PR như vậy được merge dưới sự review của con người. Minions và Agent View là hai kiến trúc khác nhau, nhưng cả hai đều không thể tách rời test, CI và Code Review. Thiếu các bước này, danh sách hiển thị màu xanh lá cũng không đồng nghĩa với việc code đã sẵn sàng để merge.

### Song song đa repository

Cú pháp `@<repo>` có thể giao nhiệm vụ sang một repo hoặc thư mục khác. Một session sửa API backend, một session sửa giao diện frontend, mở thêm một session nữa cập nhật tài liệu, toàn bộ trạng thái vẫn nằm gọn trong một danh sách duy nhất mà không cần phải quản lý nhiều cụm cửa sổ terminal.

Trong Git repository, khi một session chạy nền chuẩn bị sửa file lần đầu tiên, Claude Code mặc định sẽ chuyển nó vào một Worktree riêng biệt dưới `.claude/worktrees/` để tránh việc nhiều session cùng ghi đè lên cùng một workspace. Các thư mục không phải Git, các thư mục vốn đã nằm trong Worktree, hoặc dự án tắt cơ chế cô lập worktree chạy nền thì hành vi sẽ khác.

Nếu tác vụ frontend và backend phụ thuộc vào cùng một bản thiết kế API, tốt nhất hãy chốt xong tham số request, cấu trúc response và tiêu chí nghiệm thu trước. Agent View sẽ không tự động đồng bộ những thay đổi này giữa hai session đâu.

## Những trường hợp không nên cố dùng

### Các nhiệm vụ cần đồng bộ liên tục

Mỗi Session đều có context riêng biệt và chỉ báo cáo tiến độ cho một mình bạn. Một session vừa sửa xong API thì session kia không tự biết được; hai session cùng điều chỉnh một module cốt lõi cũng sẽ không tự thương lượng xem ai làm phần nào.

Tra cứu tài liệu, chạy test nhánh thì có thể giao cho Subagent; khi cần nhiều Agent cùng chia sẻ danh sách nhiệm vụ và trao đổi qua lại với nhau thì hãy cân nhắc Agent Teams. Agent View phù hợp hơn cho mô hình con người phân chia các nhiệm vụ độc lập, rồi tự mình kiểm tra kết quả tập trung.

Các session song song cũng tiêu thụ hạn ngạch gói đăng ký riêng biệt. Mở càng nhiều task, Token tiêu tốn càng nhanh và tốc độ chạm giới hạn rate limit càng sớm. Nếu các công việc vốn dĩ phải chờ đợi lẫn nhau, xử lý tuần tự có khi lại đỡ tốn công hơn.

### Nhiệm vụ bắt buộc phải chạy liên tục khi máy tắt

Session chạy nền được quản lý bởi tiến trình Supervisor cục bộ trên máy bạn. Khi bạn đóng Agent View, Shell hoặc cửa sổ terminal thì tác vụ vẫn tiếp tục chạy; khi máy tính sleep (ngủ), session được bảo lưu và sẽ kết nối lại khi máy thức dậy.

Nhưng tắt máy hoặc khởi động lại máy sẽ dừng toàn bộ các tác vụ đang chạy. Lần sau mở lại Agent View, các session này sẽ hiển thị trạng thái Failed, bạn có thể bấm vào, preview hoặc reply để tiếp tục đoạn hội thoại dang dở. Những tác vụ đòi hỏi phải chạy liên tục ngay cả khi máy tính offline thì bắt buộc phải đưa lên môi trường cloud. Xem chi tiết tại [Tài liệu chính thức của Agent View](https://code.claude.com/docs/en/agent-view).

## Đừng viết cứng quy trình trong giai đoạn Research Preview

Agent View vẫn đang trong giai đoạn Research Preview, giao diện, cách phân nhóm trạng thái và phím tắt đều có thể thay đổi. Khi dự định đưa tính năng này vào quy trình làm việc của team, sau mỗi lần nâng cấp Claude Code bạn nên kiểm tra lại tài liệu chính thức một lượt, đừng viết cứng các phím tắt tạm thời vào quy chuẩn dài hạn.

Nếu tạm thời chưa muốn dùng, bạn có thể tắt trong `.claude/settings.json`:

```json
{
  "disableAgentView": true
}
```

## Tổng kết

Mình xem Agent View như một bảng điều khiển tác vụ tiện lợi của Claude Code. Nó gom các Session chạy nền nằm rải rác trong terminal về chung một danh sách, giúp mình biết chính xác cái nào đang chạy, cái nào đang chờ phản hồi, cái nào đã sẵn sàng để nghiệm thu.

Còn việc phân rã nhiệm vụ ra sao, đồng bộ nhiều Agent thế nào, kết quả cuối cùng có tin cậy không, thì vẫn phải dựa vào Git Worktree, test tự động, CI và sự phán đoán của con người.

Đối với mình, thay đổi thiết thực nhất của nó vẫn là giải quyết vấn đề nhỏ nêu ở đầu bài: không còn phải lục lọi qua năm sáu tab terminal chỉ để tìm một câu hỏi xin cấp quyền đã nằm chờ suốt mười lăm phút.
