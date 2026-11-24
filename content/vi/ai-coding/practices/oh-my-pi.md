---
title: "Trải nghiệm oh-my-pi: AI Coding Agent mã nguồn mở chạy trên Terminal"
description: "Giới thiệu các năng lực cốt lõi của oh-my-pi, bao gồm cơ chế vá Hashline, tích hợp LSP và DAP, hệ thống công cụ tích hợp sẵn, định tuyến đa mô hình, hướng dẫn cài đặt cấu hình và lời khuyên sử dụng thực tế."
category: Thực chiến lập trình AI
lang: vi
sourceRef: zh-ref/ai-coding/practices/oh-my-pi.md
head:
  - - meta
    - name: keywords
      content: oh-my-pi,omp,Lập trình AI,Terminal AI coding agent,Thay thế Claude Code,OpenCode,Codex CLI,Hashline,LSP,DAP,Định tuyến đa mô hình
---

Mình vừa xác nhận lại với một người bạn bên Alibaba: Bắt đầu từ ngày 10 tháng 7, Alibaba sẽ đưa Claude Code vào danh sách phần mềm có rủi ro cao, và khuyến nghị nhân viên nội bộ chuyển sang dùng Qoder để thay thế.

Chuyện này thì thôi chúng ta không bàn sâu thêm nữa.

Dù Anthropic thường xuyên có những nước đi khá gây tranh cãi, nhưng mô hình Claude và công cụ Claude Code thực sự được làm rất tốt. So với các sản phẩm cùng loại trên thị trường, nó vẫn là cái tên hoạt động ổn định nhất. Dẫu sao đây cũng là một dự án thương mại hóa, đội ngũ toàn những gương mặt kỳ cựu, và nhịp độ ra mắt sản phẩm thì cực kỳ nhanh chóng.

Trong nhóm các sản phẩm cùng loại, những cái tên quen thuộc hơn có thể kể tới OpenCode, Codex CLI, Cline, Trae, Qoder, hay trước đó DeepSeek TUI về sau đã đổi tên thành CodeWhale.

Cách đây hai hôm, trong nhóm có bạn gửi vào một đường link GitHub của **oh-my-pi**, bảo dạo gần đây dùng thử thấy khá là êm.

Ban đầu mình cũng chẳng để tâm lắm, trong bụng thầm nghĩ: **Lại thêm một con Terminal Agent nữa à? Nó có gì khác biệt so với Claude Code, OpenCode hay Codex CLI chứ?**

Thế nhưng sau vài ngày trải nghiệm thực tế, thái độ của mình đã hoàn toàn thay đổi.

## Nó là cái gì?

oh-my-pi là một AI coding agent mã nguồn mở hoạt động trực tiếp trong Terminal.

Sau khi cài đặt thành công, bạn chỉ việc gõ lệnh `omp` ngay trong thư mục dự án, sau đó có thể bảo nó đọc code, sửa code, chạy lệnh shell, giải thích log lỗi và tự động sinh commit message.

Những điều này thoạt nghe thì cũng chẳng khác mấy so với Claude Code hay Codex CLI.

Sự khác biệt mang tính đột phá chủ yếu nằm ở **tầng công cụ (tooling layer)**.

LSP, DAP, Hashline, browser automation, GitHub, Subagent, định tuyến đa mô hình (multi-model routing)—tất cả những thứ đó đều được nó nhồi gọn gàng vào trong màn hình Terminal.

Ví dụ khi bạn đổi tên một hàm, nó có thể dùng Language Server Protocol (LSP) để tra cứu các nơi tham chiếu, bớt phải dùng `grep` đoán mò chay; khi debug một lỗi crash, nó có thể nhảy vào debugger để soi stack frame và giá trị biến số; khi review Pull Request (PR), nó xem PR như một dạng tài nguyên có thể đọc trực tiếp bằng đường dẫn URI.

Ngoài ra còn một điểm cộng mang tính chủ quan: Giao diện Terminal UI của nó trông khá ưng mắt, rất hợp gu thẩm mỹ của mình.

Đây không phải tính năng cốt lõi, nhưng với những ai ngày nào cũng phải dán mắt vào Terminal làm việc thì sẽ hiểu, một giao diện thuận mắt thực sự giúp cải thiện tâm trạng làm việc rất nhiều.

## Hashline

Rất nhiều Agent hiện nay khi sửa file thực chất vẫn chỉ dừng lại ở cơ chế thay thế chuỗi đơn giản: `old_string -> new_string`.

Đầu tiên nó đọc một đoạn trong file, sau đó bảo mô hình thuật lại nguyên văn đoạn code cũ, rồi công cụ mới cầm đoạn văn bản đó đi so khớp để thay thế bằng đoạn mới.

Vấn đề của phương án này thì chắc hẳn ai dùng AI coding cũng từng nếm trải rồi.

Chỉ cần thiếu một dấu cách, thừa một cái xuống dòng, hay thụt lề lệch một tí xíu là bản vá (patch) sẽ không tài nào tìm đúng vị trí để đắp vào. Phiền toái hơn nữa là khi bạn vừa tự tay sửa file xong, mô hình lại cầm ngữ cảnh cũ đi sửa đè lên, nội dung cũ và mới lẫn lộn vào nhau khiến hiện trường lập tức trở thành một bãi chiến trường tanh bành.

Trong công cụ `edit` của oh-my-pi có một cơ chế rất độc đáo mang tên **Hashline**.

`@oh-my-pi/hashline` miêu tả nó là một ngôn ngữ bản vá dạng thu gọn và neo theo từng dòng (compact, line-anchored patch language). Hiểu nôm na là: Khi đọc file, mỗi dòng code sẽ được gắn kèm một mã hash nội dung; khi mô hình sửa file, nó sẽ thực hiện các thao tác sửa đổi neo quanh các mã hash này, giảm thiểu việc phải chép lại nguyên cả đoạn văn bản gốc dài ngoằng.

![Ảnh chụp màn hình giải thích chính thức về Hashline của oh-my-pi](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-hashline-doc-eb301523.png)

Nếu file bị thay đổi giữa chừng khiến mã hash không khớp, bản vá sẽ lập tức bị từ chối ngay.

Điều này không chỉ giúp cho cú pháp của patch ngắn gọn hơn, mà quan trọng hơn là bổ sung thêm một tầng định vị chuẩn xác và kiểm tra xác thực. Mô hình không thể lúc nào cũng học thuộc lòng từng dấu chấm dấu phẩy của văn bản gốc được, thế nên tầng công cụ cần phải chủ động cài cắm thêm một lớp bảo hiểm an toàn.

Trong bài benchmark chính thức có nhắc tới việc Grok 4 Fast khi làm các tác vụ tương tự đã giảm được tới 61% output token. Con số này bản thân mình chưa làm thí nghiệm đối chứng để tái hiện, nên ở đây chúng ta chỉ xem như số liệu công bố từ phía dự án để tham khảo xu hướng thôi nhé.

So với việc tiết kiệm token, điều mình quan tâm hơn nhiều là liệu những bản vá lỗi hỏng có được chặn đứng từ sớm hay không. Khi ứng dụng vào dự án thực tế, bớt đi một lần sửa bậy phá hoại code còn đáng giá hơn rất nhiều so với việc tiết kiệm vài trăm token vụn vặt.

## Điểm giống IDE nhất

Điểm khiến oh-my-pi giống một chiếc IDE thực thụ nhất nằm ở chỗ: Nó đã tích hợp trực tiếp hai bộ năng lực kinh điển của IDE là LSP (Language Server Protocol) và DAP (Debug Adapter Protocol) thẳng vào mặt giao tiếp công cụ của Agent.

Phía dự án chia chúng thành hai nhóm:

- `lsp` phụ trách diagnostics (chẩn đoán lỗi), navigation (điều hướng), symbols, renames, code actions, và raw requests;
- `debug` phụ trách phiên làm việc DAP bao gồm breakpoints (điểm dừng), stepping (bước từng dòng), threads (luồng), stack (ngăn xếp cuộc gọi) và variables (biến số).

Hai thuật ngữ này nghe thì có vẻ hơi sâu về tầng đáy kỹ thuật, nhưng đưa vào công việc lập trình hàng ngày thì lại cực kỳ dễ hiểu.

**LSP chịu trách nhiệm trả lời câu hỏi: Cấu trúc code là gì?** Ví dụ một hàm được định nghĩa ở đâu, được những chỗ nào gọi tới, file hiện tại đang có những cảnh báo lỗi nào, một thao tác đổi tên hàm sẽ kéo theo sự thay đổi của những câu lệnh import hay re-export nào.

Trước đây khi Agent muốn đổi tên một hàm, phần lớn trường hợp nó chỉ có thể dùng lệnh `grep` để quét văn bản, rồi để mô hình tự suy đoán xem các kết quả tìm được có phải cùng là một biểu tượng (symbol) hay không. Quá trình này rất dễ bị lẫn vào các đoạn comment, chuỗi string hay các biến trùng tên khác; đặc biệt trong các dự án TypeScript ngập tràn barrel export, alias đường dẫn và re-export phức tạp, việc tìm kiếm văn bản thuần túy sẽ nhanh chóng trở nên bất lực.

Nếu nó có thể đi qua các tính năng rename, references, diagnostics của LSP, ít nhất thứ nó nhận được là mối quan hệ mã nguồn dưới con mắt của Language Server chuyên nghiệp. Mô hình đương nhiên vẫn có thể phán đoán sai, nhưng nó không còn phải đứng hoàn toàn ở ngoài cây cú pháp (AST) để đoán mò văn bản nữa.

Điểm này đối với mình cực kỳ quan trọng.

Khi để Agent viết code, điều mình lo sợ nhất là nhìn thấy nó tỏ ra rất tự tin để suy diễn các mối quan hệ gọi hàm, rồi cứ thế cắm đầu viết tiếp trên nền tảng suy đoán sai lầm đó. LSP ít nhất đã trao cho nó một tấm bản đồ chuẩn xác tiệm cận với góc nhìn của một IDE.

**DAP lại chịu trách nhiệm cho một khía cạnh khác: Trạng thái runtime.**

Trước đây khi bảo Agent debug, nó rất hay đi vào một lối mòn quen thuộc: Chèn thêm log, chạy thử, đọc output, rồi lại chèn thêm log. Cách làm này đương nhiên là có tác dụng, nhưng khi gặp phải các sự cố native crash, Go service bị treo (hang), hay tiến trình Python bị đơ cứng, việc chỉ dựa vào log để mò mẫm là vô cùng chậm chạp.

Có DAP rồi, nó tối thiểu có thể tự đặt breakpoint, chạy từng bước đơn (step), soi danh sách thread, kiểm tra call stack và đọc giá trị biến trực tiếp trong bộ nhớ. Thứ nó nhận được ở đây là trạng thái chạy thực tế của ứng dụng, chứ không chỉ là kết quả so khớp chuỗi văn bản.

Tất nhiên, điều đó không đồng nghĩa với việc nó chắc chắn sẽ sửa được con Bug đó 100%. Điểm khác biệt là thứ mà nó nhìn vào khi debug đã bắt đầu giống với những gì mà một lập trình viên con người bằng xương bằng thịt sẽ quan sát: Dừng lại ở dòng nào trước, giá trị biến biến đổi ra sao, rồi cuối cùng mới quyết định nên viết bản vá như thế nào.

Bởi vậy mình thích hiểu phần này như là "Năng lực IDE được đưa vào trong Terminal". Nó nằm ở một đẳng cấp hoàn toàn khác biệt so với số lượng công cụ thông thường.

Những công cụ như `eval`, `task`, `browser`, `github` ở phía sau giống như một bàn làm việc đa năng của Agent; còn LSP và DAP mới chính là linh hồn giúp nó giống một chiếc IDE nhất.

## Hệ thống công cụ cực kỳ phong phú

Đa số các Agent hiện nay đều khá kiềm chế về mặt công cụ tích hợp sẵn: Đọc file, tìm kiếm văn bản, sửa file, chạy lệnh terminal. Những việc nặng hơn thì thường đẩy sang cho MCP Server gánh.

omp lại chọn một con đường hoàn toàn khác. Nó tích hợp sẵn tổng cộng 32 công cụ nội bộ, nhìn qua có vẻ hơi cồng kềnh, nhưng quả thực có vài công cụ mang tính đại diện rất cao.

Đầu tiên phải kể đến `eval`. Nó tích hợp sẵn nhân Python và Bun JS thường trực (resident kernel), chứ không phải dạng sandbox chạy xong một lệnh là vứt bỏ. Điều vi diệu hơn là hai kernel này còn có thể gọi ngược lại chính các công cụ của omp như `read`, `search`, `task`. Agent có thể trong cell Python đọc một file CSV, rồi chuyển sang cell JavaScript để xử lý dữ liệu mà không cần phải rời khỏi phiên làm việc hiện tại.

Các công cụ điều phối đa Agent hiện tại là `task`, `hub`, `todo` và `ask` (chứ không phải cặp `task` / `irc` trong các tài liệu cũ nữa). `task` chịu trách nhiệm phân nhánh (fan-out) các subagent, mỗi worker có thể sở hữu mặt giao tiếp công cụ riêng hoặc được cách ly vào một Git worktree độc lập; `hub` dùng để trao đổi thông điệp trực tiếp giữa các Agent đang chạy, `todo` quản lý trạng thái công việc, và `ask` dùng để gửi các câu hỏi có cấu trúc. Các trường thông số thay đổi khá nhanh, bạn nên căn cứ vào mô tả công cụ thực tế tại thời điểm sử dụng.

Công cụ `browser` được xây dựng trên nền tảng Puppeteer, có tích hợp các cơ chế giảm thiểu dấu vết tự động hóa (stealth), đồng thời có thể thông qua CDP để điều khiển các ứng dụng Electron. Cần lưu ý rằng cơ chế stealth chỉ giúp giảm bớt một số đặc trưng nhận diện bot phổ biến chứ không đảm bảo website sẽ coi nó như người dùng thật 100%, và tuyệt đối không thể giúp bạn qua mặt các điều khoản sử dụng, trang đăng nhập hay hệ thống chống tự động hóa phức tạp.

`github` là một mảng mà mình cực kỳ tâm đắc. Nó không bắt mô hình phải học lại cả đống lệnh rườm rà như `gh_issue_view`, `gh_pr_view` hay `gh_search`, mà biến PR thành một đường dẫn hệ thống file để đọc. Cấu trúc bạn nhận được khi gọi `read pr://1428` đi theo đúng tư duy giống hệt như khi gọi `read src/foo.ts`; công cụ `search` cũng có thể duyệt qua các đoạn diff hệt như duyệt qua các thư mục vậy. Sự trừu tượng hóa này còn mở rộng ra hàng loạt custom scheme nội bộ như `pr://`, `issue://`, `agent://`, `skill://`, `rule://`, `conflict://`.

Mình đã tiện tay lấy một Issue thực tế của JavaGuide ra thử nghiệm. Nó đọc Issue trước, rồi tự tìm tới file Markdown tương ứng trong repository, sau đó lần theo các đường link ảnh bên trong để tiếp tục đọc ngữ cảnh.

![oh-my-pi đọc GitHub issue và truy vết file trong repository](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-github-issue-read-001790b4.png)

Ngoài ra còn có công cụ `advisor`, cho phép bạn gắn thêm một mô hình Reviewer chạy song hành. Cứ sau mỗi lượt (turn), nó sẽ soi lại toàn bộ đầu ra của Agent chính, rồi chèn các lời nhắc cảnh báo dạng inline ngược trở lại. Nó chạy trên một Context riêng và mô hình riêng, chuyên làm nhiệm vụ bới lông tìm vết những điểm mà Agent chính vô tình bỏ sót—thiết kế này chẳng khác nào có một người bạn đồng nghiệp khó tính ngồi ngay bên cạnh để phản biện.

Những công cụ này nếu đứng riêng lẻ thì không hẳn là quá mới mẻ, nhưng khi được gom chung vào một mặt phẳng công cụ thì trải nghiệm lại rất khác biệt. Việc đọc file nội bộ, đọc PR trên GitHub, đọc kết quả của subagent đều được quy về một hành động duy nhất là "đọc tài nguyên", giúp mô hình không phải học thêm hàng đống interface kỳ lạ.

Tuy nhiên, việc có quá nhiều công cụ cũng mang lại mặt trái: Tầng định tuyến sẽ phức tạp hơn, và nguy cơ gọi nhầm công cụ cũng tăng theo. Vì thế mình không khuyên bạn ngay trong lần đầu sử dụng đã bật sạch sành sanh tất cả.

Đa mô hình, đa công cụ, đa tầng bộ nhớ nghe thì rất sướng đấy, nhưng chi phí cấu hình, chi phí token và ranh giới phân quyền cũng sẽ đội lên tương ứng. Đặc biệt với những công cụ nhạy cảm như `bash`, `write`, `edit`, `browser`, `github`, `ssh`, trước khi bật bạn nên cân nhắc thật kỹ xem nó có thể chạm tới những phạm vi nào.

Một số công cụ mặc định sẽ bị tắt, danh sách này thay đổi theo từng phiên bản, bạn nên gõ trực tiếp lệnh `/tools` hoặc xem hướng dẫn trợ giúp chứ không nên dựa vào danh sách cố định trong bài viết.

Nếu thực sự muốn thu hẹp phạm vi công cụ, bạn có thể dùng cờ `--tools read,edit,bash,...` để chỉ mở đúng những công cụ cần thiết. Các năng lực bị ẩn hiện nay được mở ra theo nhu cầu thông qua cơ chế khám phá tài nguyên `xd://`, chứ không còn dùng `search_tool_bm25` như các tài liệu cũ nữa.

Chiến lược mặc định này là hoàn toàn đúng đắn. Rắc rối lớn nhất của các Terminal Agent thường không nằm ở chỗ nó thiếu năng lực, mà nằm ở chỗ sau khi bạn cấp quyền quá rộng rãi, chính bản thân bạn cũng chẳng còn nhớ nổi nó có thể can thiệp vào những ngóc ngách nào nữa.

## Nhà cung cấp đa mô hình và định tuyến theo vai trò

Danh sách mô hình hỗ trợ lúc đầu mình không ngờ là nó lại đầy đủ đến mức như vậy.

Không chỉ có ba ông lớn quen thuộc của nước ngoài là OpenAI, Anthropic, Gemini, mà ngay cả các gói đăng ký lập trình như Cursor, Copilot, Kimi Code, Moonshot, Qwen Portal, GLM, Xiaomi MiMo, Qianfan đều xuất hiện; về phía mô hình chạy local thì Ollama, LM Studio, llama.cpp, vLLM, LiteLLM cũng đều có mặt.

Hơn thế nữa, nó còn hỗ trợ 5 vai trò định tuyến (role routes): `default`, `smol`, `slow`, `plan`, `commit`.

Mình thường đặt `default` làm mô hình chủ lực, bình thường đọc code, sửa code hay hỏi đáp đều đi qua nó trước. `smol` thích hợp để giao cho Subagent làm những việc chân tay lặt vặt như quét file hàng loạt hay tìm kiếm thông tin—chỉ cần rẻ và nhanh là được, không trông chờ nó đưa ra phán đoán phức tạp.

Khi thực sự đụng tới những quyết định kiến trúc khó nhằn, Bug hóc búa, hay suy luận trong Context siêu dài, lúc đó mới dùng `slow` gọi những mô hình tư duy mạnh mẽ và đắt đỏ hơn. `plan` dùng để lên kế hoạch trước xem nên sửa những file nào, chia các bước ra sao; còn `commit` dành riêng cho việc viết changelog, commit message theo các khuôn mẫu văn bản cố định.

![oh-my-pi gán cùng một mô hình vào các vai trò khác nhau trong bảng điều khiển mô hình](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-model-role-actions-52913b21.png)

Làm như vậy thì các cuộc trò chuyện hàng ngày, subagent, suy luận sâu, lập kế hoạch và viết commit message sẽ không bị nhồi nhét chung vào một mô hình duy nhất. Đây là một cơ chế phân luồng tối ưu chi phí và chất lượng, chứ không làm cho bản thân mô hình tự dưng thông minh đột biến. Trong phiên làm việc chính, bạn chỉ cần nhấn `Ctrl+P` để chuyển đổi qua lại giữa các vai trò, hoặc dùng lệnh `/model` để đổi thủ công.

Mình khuyên bạn không nên vừa vào đã cấu hình đủ cả 5 vai trò ngay. Cứ để `default` chạy thật ổn định trước, rồi mới tính tới `smol` và `slow`. Các tính năng như fallback chain, phân chia mô hình theo đường dẫn file (path-scoped), hay xoay vòng nhiều API key nhìn thì rất mê, nhưng nếu bật hết ngay ngày đầu tiên thì khi xảy ra lỗi bạn sẽ không tài nào biết được tầng nào đang gặp trục trặc.

## Bắt đầu sử dụng như thế nào?

Cài đặt chỉ gói gọn trong đúng một dòng lệnh duy nhất, rất đơn giản.

macOS / Linux:

```sh
curl -fsSL https://omp.sh/install | sh
```

Homebrew:

```sh
brew install can1357/tap/omp
```

Bun:

```sh
bun install -g @oh-my-pi/pi-coding-agent
```

Windows PowerShell:

```powershell
irm https://omp.sh/install.ps1 | iex
```

Dự án yêu cầu `bun >= 1.3.14`, trong file `package.json` ở thư mục gốc cũng ghi rõ `packageManager: bun@1.3.14`. Nếu bạn dùng Bun để cài đặt thì hãy kiểm tra phiên bản trước để tránh vấp phải lỗi môi trường nhé.

Cài xong xuôi, hãy tìm một dự án phụ không quá quan trọng để thử nghiệm trước:

```sh
cd your-project
omp
```

Lần đầu tiên mở lên nó sẽ chưa vào thẳng giao diện chat ngay đâu, mà sẽ yêu cầu bạn thực hiện các bước Setup ban đầu.

Đầu tiên là chọn provider để đăng nhập. Ở đây bạn có thể kết nối nhiều tài khoản cùng lúc, danh sách hiển thị đầy đủ ChatGPT Plus/Pro, Anthropic, Z.AI, Kimi Code, OpenRouter, Copilot, Cursor, v.v. Những provider nào bạn đã cấu hình sẵn biến môi trường thì nó cũng sẽ tự động hiển thị trạng thái "logged in".

![oh-my-pi khởi động lần đầu chọn model provider](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-setup-provider-login-kimi-994b23d3.png)

![Trang quyền lợi thành viên Kimi Code](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-kimi-code-home-e8221039.png)

Tiếp đó chuyển sang mục Web search để chọn công cụ tìm kiếm ưu tiên cho `web_search`. Dự án hiện tại đã mở rộng hỗ trợ khoảng 25 backend tìm kiếm khác nhau, việc liệt kê danh sách tĩnh sẽ rất nhanh bị lỗi thời; nếu bạn chọn `Auto`, nó sẽ tự động chọn từ các backend đã được cấu hình sẵn, còn chế độ thủ công sẽ hiển thị theo đúng trang Setup tại thời điểm đó.

![oh-my-pi khởi động lần đầu chọn Web search provider](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-setup-web-search-f7913a34.png)

Bước này không cần phải đắn đo quá lâu. Cứ cấu hình chạy thông một mô hình chính và một provider tìm kiếm trước đã, làm thế sẽ vững chắc hơn nhiều so với việc cố nhồi nhét tất cả các tài khoản vào ngay từ đầu.

Sau khi cấu hình xong quay lại màn hình chính, phía mình mô hình mặc định đã được chọn sẵn, góc bên trái hiển thị `DeepSeek V4 Flash`.

![oh-my-pi tự động chọn mô hình mặc định sau khi khởi động](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-welcome-default-model-389507e0.png)

Lúc đầu mình còn hơi ngớ người: Ban nãy mình đâu có tự tay chọn DeepSeek đâu, sao nó lại tự động cấu hình xong xuôi thế này?

Thế là mình tiện tay hỏi luôn nó. Lời giải thích của nó đại khái là: oh-my-pi tích hợp sẵn một danh mục mô hình nội bộ, khi khởi động nó sẽ lần lượt quét các thông tin xác thực sẵn có theo thứ tự: Tham số dòng lệnh, file `models.yml`, key/OAuth đã lưu qua các lần `/login` trước, biến môi trường và một loạt các file `.env`. Chỉ cần nó phát hiện thấy biến như `DEEPSEEK_API_KEY` khớp đúng, nó sẽ lập tức đánh dấu các mô hình thuộc provider đó là khả dụng, rồi tự động chọn ra một mô hình khởi tạo mặc định.

![oh-my-pi giải thích vì sao mô hình lại được tự động cấu hình](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-model-auto-config-reason-849590a0.png)

Về sau nếu muốn đổi mô hình cũng chẳng cần phải khởi động lại, chỉ cần gõ lệnh `/model`. Nó sẽ chỉ hiển thị những mô hình nào đã có thông tin xác thực hợp lệ, phía trên còn có thể bấm tab để chuyển đổi theo từng provider. Ở đây mình có thể thấy rõ các mục DeepSeek, Z.AI, Ollama, LM Studio, llama.cpp.

![oh-my-pi dùng lệnh model để chuyển đổi mô hình](/media/jg/ext/oss.javaguide.cn/ai/coding/oh-my-pi/oh-my-pi-model-switch-b7c99a0a.png)

Nếu muốn xem phiên bản hiện tại hỗ trợ những câu lệnh và tham số nào, bạn cứ gõ thẳng:

```sh
omp --help
```

Nếu trước đây bạn từng sử dụng qua Claude Code, Codex CLI, Cursor, Windsurf, Gemini hay Cline, nó còn có khả năng tự động đọc các rules, skills và MCP server đã có sẵn trên đĩa cứng của bạn. Các thư mục như `.claude`, `.cursor`, `.windsurf`, `.gemini`, `.codex`, `.cline`, `.github/copilot`, `.vscode` đều nằm trong phạm vi quét của nó.

## Tổng kết

Điểm sáng nổi bật nhất của oh-my-pi chủ yếu tập trung ở tầng công cụ: Hashline giúp tăng cường độ ổn định khi định vị bản vá, LSP và DAP cung cấp cấu trúc mã nguồn và trạng thái runtime sống động, còn các công cụ như `github`, `browser`, `task`, `eval` giúp kết nối các nguồn tài nguyên khác nhau vào chung một phiên làm việc duy nhất.

Công cụ càng nhiều thì đồng nghĩa ranh giới quyền hạn càng rộng. Những năng lực như `github`, `browser`, `memory`, `ssh` khuyên bạn nên bật có chọn lọc theo từng tác vụ cụ thể; khi đụng chạm tới tài khoản cá nhân, tin nhắn riêng tư, thao tác ghi vào repository hay can thiệp vào máy chủ từ xa, hãy luôn kiểm tra kỹ phạm vi phân quyền, nhật ký audit và điều khoản dịch vụ trước tiên.

Đối với những ai đã quen thuộc với phong cách làm việc trên Terminal, thích vọc vạch tinh chỉnh mô hình, công cụ và phân quyền, bạn hoàn toàn có thể mang nó ra thử nghiệm trên các dự án cá nhân. Còn nếu bạn chỉ đơn thuần muốn tìm một công cụ ổn định, ít phải cấu hình, mở lên là dùng được ngay thì Claude Code vẫn là sự lựa chọn giúp bạn đỡ phải bận tâm suy nghĩ nhiều nhất.

Điều khiến oh-my-pi thu hút mình nhất ở thời điểm hiện tại chính là việc nó đã đẩy tầng công cụ của các Agent mã nguồn mở tiến thêm một bước dài. Tính năng đa dạng, tham vọng to lớn, điểm nhấn rõ ràng—nhưng để xây dựng được sự tin tưởng tuyệt đối thì vẫn cần phải trải nghiệm và kiểm chứng qua thực tế từng chút một.

Địa chỉ dự án: [https://github.com/can1357/oh-my-pi](https://github.com/can1357/oh-my-pi)

Trang chủ chính thức: [https://omp.sh](https://omp.sh)
