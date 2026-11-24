---
title: "Tổng hợp mẹo thực chiến Vibe Coding: Git, Spec, quản lý Context và phối hợp Multi-Agent"
description: "Kết hợp Spec, Skills, quản lý Context, quản lý phiên bản Git, phân chia mô hình AI, xác thực kiểm thử, Code Review và phối hợp Multi-Agent nhằm tổ chức cách thức Vibe Coding có kiểm soát tốt hơn trong các dự án thực tế."
category: Kỹ năng lập trình AI
tag:
  - Vibe Coding
  - Lập trình AI
  - Claude Code
  - Codex
lang: vi
sourceRef: zh-ref/ai-coding/practices/the-cool-tricks-for-vibe-coding.md
head:
  - - meta
    - name: keywords
      content: Vibe Coding,Mẹo lập trình AI,Agent Skills,Claude Code,Codex,Spec Coding,Quản lý phiên bản Git,AI Code Review,Phối hợp đa mô hình
---

Chào bạn, mình là Tiểu G. Cuối tuần trước, mình đã chia sẻ một vài mẹo nhỏ về Vibe Coding qua tin nhắn văn bản. Bài viết này sẽ bổ sung đầy đủ những nội dung chưa kịp triển khai khi đó, đồng thời tiện thể tổng hợp lại những cạm bẫy mà mình từng vấp phải trong suốt mấy năm lập trình thực tế với AI.

![Độc giả bình luận về bài chia sẻ mẹo Vibe Coding](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/vibe-coding-practices-comments-e123b185.png)

Trước khi vào nội dung chính, mình muốn hỏi mọi người một câu: Bạn còn nhớ cảm giác trong lần đầu tiên trải nghiệm Vibe Coding của mình không?

Riêng mình thì khi đó thực sự bị "cuốn" cực độ. Năm 2024 lần đầu tiếp xúc với Cursor, mình thực sự ngỡ ngàng như thấy một kỳ quan. Cảm giác đó giống hệt như hồi bé lần đầu được chơi điện tử, nhưng thậm chí còn đã hơn chơi game nhiều. Mỗi ngày niềm vui lớn nhất là Vibe Coding, ngồi nhìn từng dòng code tự động tuôn ra trước mắt. Cảm giác một ngày mình làm được lượng công việc nhiều hơn cả một tuần trước đây gộp lại.

Khoảng thời gian đó quả thực đến game mình cũng chẳng buồn đụng tới, chỉ nghĩ xem làm sao để AI gánh thêm việc cho mình.

Nhưng sau cơn hưng phấn tột độ ấy, những pha "lật xe" xuất hiện ngày một nhiều hơn, liên tục gặp phải những lỗi cực kỳ trời ơi đất hỡi. Điều đó khiến mình nhận ra rằng: chỉ dựa thuần túy vào cảm tính để Vibe Coding là điều hoàn toàn không ổn chút nào.

Dưới đây là một số kinh nghiệm xương máu mà Tiểu G đã rút ra sau nhiều năm lăn lộn dùng AI viết mã nguồn. Không hề hoa mỹ, nhưng cái nào cũng rất thực dụng và hiệu quả.

## Chuẩn bị Git thật tươm tất trước tiên

Nếu chỉ được chọn ra duy nhất một kỹ năng quan trọng nhất trong Vibe Coding, Tiểu G sẽ không ngần ngại chọn Git.

Nguyên nhân rất đơn giản: AI viết sai một dòng code không đáng sợ; điều đáng sợ là nó sửa một hơi 20 file, đến khi bạn phát hiện ra hướng đi sai bét thì đã không còn biết đoạn nào nên giữ, đoạn nào nên vứt. Git không phải là một nghi thức mang tính hình thức để bù đắp sau khi code đã viết xong, nó bắt buộc phải đứng chốt chặn trước cả khi AI bắt tay vào hành động.

Trước khi để Agent sửa code, hãy xem qua không gian làm việc trước:

```bash
git status --short
```

Nếu trong thư mục hiện tại đã có sẵn các thay đổi, trước tiên hãy làm rõ những thay đổi đó là của ai, có cần giữ lại hay không. Khi nhiều người cùng phối hợp hoặc chạy song song nhiều Agent, bước này đặc biệt quan trọng. Đừng để AI rollback những thứ nó không hề viết, cũng đừng trộn lẫn những sản phẩm dở dang của người khác vào tác vụ của bạn.

Sau khi xác nhận workspace sạch sẽ, hãy tạo nhánh riêng cho tác vụ hiện tại:

```bash
git switch -c feat/order-export
```

Dù là tác vụ rất nhỏ cũng khuyên bạn nên tạo nhánh riêng. Chạy "vibe chay" thẳng trên nhánh chính (main/master) sẽ khiến gánh nặng tâm lý ngày càng đè nặng; sau khi cách ly bằng nhánh, AI dù có viết lệch lạc đến đâu thì cũng chỉ là vấn đề của nhánh tác vụ đó mà thôi.

Sau khi AI sửa xong, đừng vội đọc bản tóm tắt của nó, hãy xem repository tự nói lên điều gì trước:

```bash
git diff --stat
git diff
```

Dùng `git diff --stat` để xem phạm vi ảnh hưởng (blast radius), và `git diff` để soi kỹ từng chi tiết. Sau khi xác nhận không có vấn đề gì mới bắt đầu chia khối để stage và commit:

```bash
git add -p
git commit -m "feat: add order export"
```

Một commit chỉ nên làm đúng một việc. Chia nhỏ theo từng khối được thì cứ chia, về sau Review, rollback hay định vị lỗi đều sẽ nhẹ nhàng hơn rất nhiều. Lời AI nói "Tôi chỉ sửa logic xuất file" không bao giờ đáng tin bằng kết quả diff thực tế.

Lỡ sửa hỏng thì cũng cố gắng dùng các thao tác rollback có kiểm soát:

```bash
# Hủy bỏ các thay đổi chưa commit của một file cụ thể
git restore path/to/file

# Hủy bỏ các file đã đưa vào khu vực staging
git restore --staged path/to/file

# Nếu đã commit và push lên remote, ưu tiên tạo commit đảo ngược
git revert <commit>
```

`git reset --hard` không phải là cấm thuật gì ghê gớm, nhưng tuyệt đối đừng tiện tay giao quyền đó cho Agent. Trừ phi nhánh hiện tại là một nhánh thử nghiệm dùng một lần rồi vứt, nếu không nó rất dễ xóa sạch sành sanh những thay đổi chưa kịp lưu của bạn.

Các tác vụ chạy song song có thể dùng `git worktree` để cách ly hoàn toàn:

```bash
git worktree add ../project-order-export -b feat/order-export
git worktree add ../project-refactor-user -b feat/refactor-user
```

Mỗi Agent một thư mục, một nhánh, một nhiệm vụ. Như vậy dù chúng có làm loạn thì cũng chỉ quậy phá bên trong không gian làm việc riêng của chính mình.

![Claude Code Git Worktree](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-git-worktree-685b1929.png)

## Thu hẹp phạm vi trước khi khởi công

Bạn cần AI làm gì, hãy cố gắng diễn đạt càng cụ thể càng tốt, đừng để nó phải tự mình đoán mò.

Lấy ví dụ về bài toán đơn hàng, bạn nói một câu: "Giúp tôi làm tính năng xuất đơn hàng."

Câu nói này quá chung chung, AI không biết mỗi lần xuất bao nhiêu bản ghi, xuất ra định dạng gì, xuất những trường nào, thứ tự các trường ra sao.

Thông tin cung cấp không đủ thì nó sẽ tự đoán. Kết quả đoán mò có thể vẫn chạy được, nhưng chưa chắc đã đúng thứ bạn thực sự cần.

Chi bằng trước khi khởi công, hãy dành ra vài phút viết một bản Spec tinh gọn, chi phí này rẻ hơn rất nhiều so với việc phải đập đi sửa lại về sau:

```markdown
## Mục tiêu

Hiện thực hóa API xuất đơn hàng, hỗ trợ xuất CSV theo khoảng thời gian.

## Ràng buộc

- Mỗi lần xuất tối đa 5.000 bản ghi
- Khoảng thời gian không vượt quá 31 ngày
- Chỉ được xuất dữ liệu của tenant hiện tại
- Truy vấn bắt buộc phải dùng `order_tenant_time_idx`
- Xuất thất bại phải ghi nhận nguyên nhân, không chỉ trả về unknown error

## Tiêu chuẩn nghiệm thu

- Xuất CSV thành công, thứ tự trường: order_no, amount, status, created_at
- Vượt quá 5.000 bản ghi trả về lỗi rõ ràng
- Dữ liệu tenant khác không được phép xuất ra (ngăn chặn vượt quyền)
- Unit test bao phủ 4 trường hợp: không có dữ liệu, vượt quyền, vượt số lượng, vượt khoảng thời gian
```

Bản tài liệu này không cần phải viết cầu kỳ như tài liệu thẩm định phương án kỹ thuật lớn.

![Quy trình 4 bước Spec Coding](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-pipeline-flow-8a20fb26.png)

Tác vụ nhỏ chỉ cần viết rõ mục tiêu, ràng buộc và tiêu chuẩn nghiệm thu là đủ; tác vụ vừa thì bổ sung thêm định dạng API, mã lỗi, cấu trúc bảng; với yêu cầu lớn hơn, hãy bẻ thành `requirements.md`, `design.md`, `tasks.md`. Không cần thiết vừa vào đã nâng quy trình lên mức tối đa, nếu không bạn sẽ bị nản lòng bởi đống tài liệu trước cả khi bắt đầu gõ code.

Để tìm hiểu chi tiết về Spec Coding, bạn có thể tham khảo: [Thực chiến Spec Coding: Từ Vibe Coding đến quy chuẩn mã nguồn cho AI](https://javaguide.cn/ai-coding/practices/spec-coding.html).

Còn một chiêu nữa, thậm chí còn hiệu quả hơn cả những quy chuẩn trừu tượng: Cho AI xem đoạn code chuẩn chỉ đã có sẵn trong dự án.

```text
Trước tiên hãy đọc UserController, UserService, UserRepository và các bài test tương ứng. Tham khảo cách phân tầng, xử lý ngoại lệ, đóng gói response trả về, phong cách ghi log và cách viết test của chúng. Sau đó mới hiện thực hóa OrderExportController.

Không đưa vào định dạng response mới.
Không thêm Global Exception Handler mới.
Không được đi đường tắt qua mặt logic kiểm tra quyền hiện có.
```

Những câu như "Code phải thanh lịch, dễ bảo trì, tuân thủ best practice"—nhét vào Prompt nhìn thì có vẻ nghiêm túc đấy, nhưng tính ràng buộc trong thực tế gần như bằng không.

Mô hình AI giỏi nhất là bắt chước các mẫu ví dụ cụ thể. Bạn chỉ cho nó thấy một đoạn code đạt chuẩn thực sự trong dự án, nó sẽ dễ dàng viết ra cùng một phong cách như vậy hơn rất nhiều.

## Ghi các cạm bẫy của dự án vào file quy tắc (Rules)

Với các dự án dài hạn, hãy đưa các quy tắc này vào những vị trí mà công cụ AI có thể đọc ổn định. Ví dụ:

- Claude Code: `CLAUDE.md`
- Codex: `AGENTS.md`
- Cursor: Project Rules, `.cursor/rules/*.mdc`, cũng có thể kết hợp với `AGENTS.md`
- GitHub Copilot / VS Code: `.github/copilot-instructions.md` cấp repo, `.github/instructions/*.instructions.md` cấp đường dẫn, cũng hỗ trợ `AGENTS.md`

Tuyệt đối đừng viết thành sách hướng dẫn giới thiệu dự án! Hãy viết những quy tắc mà Claude dễ đoán sai, nhìn vào code không tự suy ra được, nhưng toàn đội bắt buộc phải tuân thủ. Trọng tâm hãy đặt vào phiên bản tech stack, câu lệnh thường dùng, đánh đổi kiến trúc, quy ước của nhóm và các cạm bẫy đặc thù trong dự án; đừng nhồi nhét sáo rỗng, các hành vi mặc định và những đoạn tài liệu dài dòng lê thê.

Tiêu chí đánh giá rất đơn giản: Nếu xóa dòng này đi, Claude có dễ phạm lỗi hơn không?

![CLAUDE.md và AGENTS.md trong dự án phân tích chứng khoán đa agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

Mỗi lần AI lặp lại một sai lầm, đừng chỉ biết mắng nó một câu trong khung chat.

Lịch sử chat rồi sẽ trôi đi, nhưng file quy tắc thì luôn đi liền cùng repository. Bạn bổ sung cạm bẫy vào quy tắc, lần sau nó mới có cơ hội né tránh được.

## Tận dụng triệt để Skill để đóng gói các quy trình chuẩn

File quy tắc và Skill giải quyết hai vấn đề hoàn toàn khác nhau.

File quy tắc thích hợp để chứa những thứ mà dự án này *luôn luôn* phải tuân thủ, ví dụ: phiên bản tech stack, câu lệnh khởi động, cấu trúc thư mục, định dạng mã lỗi, những file nào cấm chạm vào.

Skill thích hợp để chứa *cách làm* khi gặp phải một nhóm nhiệm vụ cụ thể nào đó. Ví dụ như Code Review, viết test, sửa giao diện frontend, nghiên cứu thông tin trên web, viết bài kỹ thuật—những tác vụ này mỗi lần làm đều có quy trình tương tự nhau, chẳng việc gì lần nào cũng phải nhắc lại từ đầu trong khung chat.

Tiểu G trước đây từng viết hai bài liên quan: [Agent Skills là gì? Khác biệt thế nào so với Prompt và MCP?](https://javaguide.cn/ai/agent/skills.html) và [Danh mục lựa chọn Skills lập trình AI](https://javaguide.cn/ai-coding/practices/programmer-essential-skills.html).

Hiểu đơn giản, Skill là một bản hướng dẫn tác vụ có thể được Agent tải lên theo nhu cầu. Nó không phải plugin, cũng không phải bản thân công cụ MCP, mà là việc ghi lại quy trình, ràng buộc, danh mục kiểm tra và kinh nghiệm tránh hố cho một loại tác vụ cụ thể vào file `SKILL.md`.

![Chuỗi liên kết thực thi của Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skills-agent-execution-link-ee22c892.png)

Ví dụ những công việc sau đây cực kỳ thích hợp để đúc kết thành Skill:

- Trước khi viết tính năng phải đi qua TDD: viết test fail trước, rồi mới viết phần hiện thực hóa.
- Khi làm Code Review cố định kiểm tra: bảo mật, transaction, hiệu năng, điều kiện biên và quy ước dự án.
- Khi viết trang frontend cố định kiểm tra: tính tương thích giao diện (responsive), trạng thái hover, khả năng tiếp cận (accessibility) và design system.
- Khi nghiên cứu web cố định thứ tự ưu tiên các công cụ: tìm kiếm, cào dữ liệu, tự động hóa trình duyệt.
- Khi viết bài kỹ thuật cố định kiểm tra: nguồn gốc sự thật, trích dẫn, phân cấp tiêu đề và loại bỏ "mùi AI".

**Tại sao phải dùng Skill?** Bởi vì những quy trình này lần nào cũng nhắc qua chat thì rất phiền phức. Hôm nay bạn nhắc nó viết test trước, ngày mai đổi sang phiên chat mới nó lại quên sạch; lần này bảo nó Review rủi ro phân quyền, lần sau nó có thể chỉ soi mỗi cách đặt tên và format thụt lề. Giá trị của Skill nằm ở chính điểm đó: biến việc nhắc đi nhắc lại thành một cuốn sổ tay tác nghiệp có thể tái sử dụng.

Tuy nhiên, Skill cũng đừng viết biến thành file README.

README viết cho người đọc, có thể giải thích bối cảnh, nguyên lý và hướng dẫn cài đặt; Skill là viết cho Agent đọc khi nó đang thực thi tác vụ, trọng tâm là: Khi nào dùng, làm theo thứ tự nào, trường hợp nào không được làm, khi thất bại thì xử lý ra sao.

Nội dung càng dài càng tốn dung lượng Context. Khi viết Skill hãy tự hỏi một câu: Đoạn này có ảnh hưởng trực tiếp tới hành động tiếp theo của Agent không? Không thì đừng nhét vào.

Khuyến nghị từ Anthropic là: phần nội dung chính của `SKILL.md` tốt nhất nên khống chế trong vòng 500 dòng; nếu vượt quá độ dài này, hãy tách các chi tiết ra file riêng, dùng phương thức tiết lộ tiệm tiến (progressive disclosure) để Agent chỉ đọc khi thực sự cần.

![Nội dung SKILL.md tốt nhất nên khống chế dưới 500 dòng theo chuẩn best practice](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/keep-skill-md-content-under-500-lines-for-best-p-7c39bab2.png)

Các Skill có sẵn trên mạng cũng có thể dùng ngay, chẳng hạn bộ Superpowers đã đóng gói sẵn các quy trình TDD, Code Review, Spec-Driven, Git Worktree, phối hợp sub-agent.

Mình đã có bài giới thiệu chi tiết trong [Danh mục lựa chọn Skills lập trình AI: Làm rõ yêu cầu, TDD, Code Review và Thiết kế UI](https://javaguide.cn/ai-coding/practices/programmer-essential-skills.html).

Nhưng các Skill bên thứ ba tuyệt đối đừng tải về rồi chạy bừa ngay. `SKILL.md` bản chất cũng là chỉ thị (instruction); bên trong nếu chứa câu lệnh nguy hiểm, script kỳ lạ hay quyền hạn quá rộng, Agent sẽ răm rắp làm theo. Trước khi cài tối thiểu hãy lướt mắt qua phần thân, thư mục `scripts/` và `references/` để chắc chắn nó không có hành vi vượt quyền.

## Đừng dùng mô hình đắt đỏ đi làm việc tay chân

Đừng việc gì cũng quẳng cho mô hình đắt tiền nhất.

Làm vậy chẳng khác nào thuê một kiến trúc sư kỳ cựu về rồi cả ngày bắt ông ấy đi đổi tên biến, thêm getter hay căn chỉnh CSS—tiền thì tốn mà giá trị chẳng tận dụng được là bao. Ngược lại cũng thế, vì muốn tiết kiệm mà đem toàn bộ thiết kế kiến trúc, ranh giới bảo mật, refactor phức tạp giao hết cho mô hình giá rẻ gồng gánh, chi phí đập đi làm lại sau cùng có khi còn đắt đỏ hơn nhiều.

Cách Tiểu G thường dùng nhất là: "Mô hình suy luận mạnh làm rõ phương hướng, mô hình chi phí thấp đi làm những việc có ranh giới rõ ràng, cuối cùng dùng một mô hình độc lập kiểm tra lại lần chót."

```text
Bước 1: Để mô hình có năng lực suy luận và review code mạnh đọc yêu cầu và codebase.
Chỉ cho nó lên phương án, liệt kê rủi ro, bẻ nhỏ tác vụ—không để nó vội vàng viết code.

Bước 2: Sau khi phương án được chốt, giao từng Task cho mô hình triển khai có chi phí và độ trễ hợp lý.
Để nó code theo tác vụ, bổ sung test, chạy lệnh kiểm tra, làm xong thì đưa ra bản tóm tắt diff.

Bước 3: Đưa git diff cho một mô hình Review độc lập.
Lần này chỉ để nó Review: Bug, rủi ro vượt quyền, ranh giới transaction, vấn đề hiệu năng, lỗ hổng trong test.
```

Các mô hình cụ thể thay đổi rất nhanh. Tính đến ngày 24-07-2026, các họ mô hình có thể lựa chọn gồm có Claude Fable 5, GPT-5.6, DeepSeek V4, GLM-5.2, MiniMax M3 và Kimi K3. Danh sách liệt kê ở đây là một snapshot theo thời điểm, chứ không phải công thức cố định; việc lựa chọn thực tế còn phụ thuộc vào tính khả dụng của tài khoản, benchmark thực tế, giá cả, giới hạn context và độ tương thích công cụ.

Kiểm toán mã nguồn (code audit) cũng có thể làm theo cách này. Trước tiên để mô hình rẻ quét qua một lượt dự án để liệt kê các nghi vấn; sau đó để mô hình mạnh thẩm định lại xem những vấn đề đó có thực sự tồn tại hay không. Để thẳng mô hình đắt tiền quét toàn bộ đương nhiên cũng được thôi, chỉ có điều đốt tiền rất nhanh mà hiệu quả mang lại chưa chắc đã tương xứng.

![Dữ liệu Benchmark DeepSeek V4](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/v4-benchmark-7b6548e4.png)

## Đừng chỉ nghe nó nói "đã sửa xong", hãy nhìn vào bằng chứng

AI thích nhất là nói "Đã sửa xong", "Đã tối ưu", "Không có vấn đề gì".

Nghe để biết thế thôi, đừng tin ngay.

Tiểu G thích nhìn vào 3 thứ hơn: test, output của câu lệnh, và diff.

Ví dụ khi bạn bảo nó sửa một Bug xuất đơn hàng, đừng chỉ hỏi "Đã sửa xong chưa?". Bạn có thể yêu cầu thẳng thắn thế này:

```text
Tạm thời chưa được sửa phần hiện thực hóa.
Trước tiên hãy dựa vào Spec bổ sung test, bao phủ nhánh chạy bình thường, tham số không hợp lệ, không đủ quyền, không có dữ liệu, và yêu cầu gửi trùng lặp đồng thời.
Bộ test ban đầu bắt buộc phải thất bại (fail).
Sau khi tôi xác nhận test viết hợp lý, bạn mới được sửa phần hiện thực hóa, cho tới khi test pass hoàn toàn.
```

Cách làm này hơi hướng TDD, nhưng không cần quá giáo điều. Điểm mấu chốt là tránh việc AI vừa sửa code vừa tiện tay viết một cái test luôn luôn pass trong mọi hoàn cảnh. Làm cho test fail trước, rồi làm cho code chạy pass sau, trong lòng bạn sẽ yên tâm hơn rất nhiều.

Nếu không muốn đi theo TDD đầy đủ, tối thiểu cũng phải bắt nó liệt kê rõ các tiêu chí nghiệm thu:

```markdown
- [ ] API mới có kiểm tra phân quyền
- [ ] Trả về lỗi tuân thủ định dạng thống nhất
- [ ] Truy vấn database trúng index chỉ định
- [ ] Giá trị null, vượt ngưỡng, request trùng lặp đều có test
- [ ] Log không in ra token, password, api key
- [ ] Toàn bộ bài test đều pass
```

Đồng thời bắt nó dán các câu lệnh đã chạy kèm kết quả ra:

```bash
mvn test
npm test
go test ./...
pnpm lint
```

Chưa chạy thì ghi "Chưa chạy" và nêu rõ lý do. Ví dụ chưa cài dependency, database chưa bật, môi trường test thiếu config—những lý do đó đều chấp nhận được; đáng sợ nhất là chưa chạy gì cả nhưng vẫn ghi một câu "Đã kiểm chứng" để lấp liếm qua mắt.

Tối ưu hiệu năng lại càng không thể chỉ nghe nó nói mồm. Nó bảo "Tốc độ cải thiện rõ rệt", bạn hãy bắt nó trưng bằng chứng ra: SQL trước và sau tối ưu, `EXPLAIN` plan, lượng dữ liệu thử nghiệm, P95/P99 hoặc thời gian phản hồi của API. Không có kết quả benchmark thực tế thì chỉ ghi nhận lợi ích dự kiến và các hạng mục chờ kiểm chứng, tuyệt đối không để nó tự bịa ra các con số.

## Đừng để Context ngày càng chất đống hỗn loạn

Tiểu G trước đây có viết một bài về [Context Engineering](https://javaguide.cn/ai/agent/context-engineering.html), trong đó có một quan điểm mang sang Vibe Coding cũng cực kỳ chuẩn xác: **Cửa sổ Context lớn không đồng nghĩa với hiệu quả cao—cửa sổ chứa được nhiều thứ hơn, nhưng mô hình có tìm đúng trọng tâm một cách ổn định hay không lại là câu chuyện hoàn toàn khác.**

![Vì sao Context lại mất tác dụng](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-does-the-following-content-fail-7c336a26.png)

Trong một phiên chat mà vừa viết đăng nhập, rồi sửa thanh toán, lại refactor cache, cuối cùng lại quay ra hỏi vì sao test bị lỗi—mô hình sớm muộn cũng sẽ trộn lẫn các ràng buộc cũ, những lần thử thất bại và phương án đã bị vứt bỏ lại với nhau. Bạn tưởng mình đã cho nó toàn bộ lịch sử đầy đủ, nhưng thứ nó nhận được thực tế chỉ là một đống nhiễu loạn tạp âm.

Trong Vibe Coding, quản lý Context cần để tâm tới 3 điều.

**Thứ nhất, đừng quẳng cả repository vào.** Tác vụ hiện tại chỉ cần Spec, các file liên quan, log báo lỗi, lệnh nghiệm thu và một vài file mẫu để tham khảo. Những nội dung khác tạm thời dùng đường dẫn, tên file, cây thư mục để giữ chỗ, khi nào cần mới để Agent đọc. Claude Code khi phân tích repo lớn cũng theo tư duy này: dùng tìm kiếm và thư mục để định vị trước, rồi từng bước đọc file cụ thể, chứ không nuốt trọn toàn bộ code ngay từ đầu.

**Thứ hai, tác vụ dài phải kịp thời nén lại (compact).** Trong Claude Code có thể dùng `/compact` để nén context, dùng `/clear` để dọn sạch context (cách dùng chi tiết xem tại [Giải mã các lệnh cốt lõi của Claude Code](https://javaguide.cn/ai-coding/practices/claudecode-commands.html)); Codex hay các Agent khác cũng có cơ chế tóm tắt, nén và mở lại tương tự. Nén là nhằm giữ lại trọng tâm (như quyết định kiến trúc, file đã sửa, vấn đề chưa giải quyết, lệnh thất bại và nhiệm vụ tiếp theo), loại bỏ các đoạn hội thoại trùng lặp và output công cụ đã được tiêu hóa xong.

**Thứ ba, tiến độ then chốt phải được ghi lại thành file.** Ví dụ để Agent duy trì một file `NOTES.md` hoặc bản bàn giao (handoff) trong các tác vụ dài, ghi lại:

```markdown
## Đã hoàn thành

- Đã sửa những file nào
- Những bài test nào đã chạy qua
- Những vấn đề nào đã xác nhận không phải là Bug

## Nhiệm vụ còn lại

- Các test case thất bại chưa sửa xong
- Các kịch bản biên chưa được xác nhận
- Agent tiếp theo cần đọc những file nào trước
```

Như vậy ngay cả khi mở session mới, bạn cũng không cần tốn nửa ngày để giải thích lại từ đầu. Lịch sử chat sẽ dài ra, rối hơn, cũ đi, nhưng các ghi chú có cấu trúc thì luôn ổn định.

Thói quen của Tiểu G là: Một session chỉ xử lý một nhiệm vụ; sửa quá hai lần mà vẫn sai thì mở session mới; session mới chỉ mang theo Spec hiện tại, file liên quan, log lỗi, lệnh nghiệm thu và bản handoff của lượt trước. Gói context lớn cỡ nào không có con số ngưỡng chung; thước đo chuẩn nhất là mô hình có tìm đúng ràng buộc, hoàn thành nhiệm vụ và vượt qua khâu nghiệm thu hay không; hãy bắt đầu từ lượng tài liệu tối thiểu cần thiết, thiếu đâu bù đó.

Một gói Context có thể viết rất đơn giản:

```markdown
## Nhiệm vụ hiện tại

Hiện thực hóa API xuất đơn hàng.

## File bắt buộc phải đọc

- src/main/java/.../UserController.java
- src/main/java/.../OrderRepository.java
- docs/spec/order-export.md

## Nghiêm cấm sửa đổi

- Tên các trường đã có trong database
- Định dạng Exception toàn cục
- Logic xác thực đăng nhập

## Lệnh nghiệm thu

- mvn test
- mvn -Dtest=OrderExportServiceTest test
```

Tài liệu cũng có thể dùng làm Context. Sau khi AI sửa nhiều module, hãy bắt nó viết một bản giải trình thay đổi: Đã thêm API gì, sửa bảng hoặc index nào, quy tắc nghiệp vụ then chốt là gì, xác thực ra sao, rollback thế nào. Như vậy lần sau tiếp tục phát triển có thể ném thẳng vào cho AI đọc.

Trong các dự án có nhiều gánh nặng lịch sử, trường nào không được sửa, API nào phải tương thích với client cũ, giá trị enum nào bị hệ thống bên ngoài fix cứng—những quy tắc truyền miệng này đều nên đưa vào tài liệu.

## Đa Agent: Cứ tuần tự trước, song song tính sau

Cách chơi phân công phối hợp nhiều Agent quả thực rất hấp dẫn, nhưng chân thành khuyên mọi người đừng vừa vào đã nhảy bổ vào làm đa Agent song song (ví dụ: một con viết code, một con viết test, một con Review, một con viết tài liệu)—rất dễ làm tanh bành dự án.

Mới bắt đầu thì cứ chạy tuần tự là đẹp nhất:

1. Plan Agent chỉ đọc code, xuất ra phương án và chia nhỏ nhiệm vụ;
2. Code Agent chỉ phụ trách đúng 1 Task, không đụng tới nhiệm vụ khác;
3. Test Agent viết test bổ sung và chạy kiểm chứng;
4. Review Agent chỉ soi diff, tìm vấn đề, không trực tiếp sửa đổi lớn.

Tuyệt đối đừng để nhiều Agent sửa code cùng lúc ngay từ đầu, hãy để chúng commit tuần tự trên cùng một nhánh feature:

```bash
git commit -m "[plan] add order export design"
git commit -m "[code] implement order export api"
git commit -m "[test] add order export tests"
git commit -m "[review] fix tenant permission check"
```

Đợi quy trình chạy trơn tru, tay nghề thành thạo rồi hãy tính đến **worktree song song, [Agent View](https://javaguide.cn/ai-coding/practices/claudecode-agentview.html)** và các cách chơi nâng cao khác.

![Các phiên chạy song song đa Agent](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/multi-agent-parallel-sessions-c335f852.png)

![Claude Code Agent View](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-agents-list-view-20260518102539932-7c769093.png)

Chạy song song đáng sợ nhất không phải là xung đột Git, cái đó ít ra còn nhìn thấy được. Thứ thực sự rắc rối là *không* xung đột—hai Agent cùng lúc sửa chung một DTO dùng chung, một con thêm trường để xuất dữ liệu, một con xóa trường để tối ưu truy vấn, khi merge trông mượt mà không tì vết, nhưng ngữ nghĩa API, kết quả tuần tự hóa (serialization) hay code frontend phụ thuộc phía ngoài có khi đã âm thầm gãy đổ.

Cho nên đa Agent không thể trông chờ vào may rủi, phải dựa vào ranh giới nhiệm vụ, cách ly nhánh và tiêu chí nghiệm thu để quản chặt. File nào được sửa, module nào cấm chạm vào, sửa xong phải chạy test gì, đoạn diff nào bắt buộc người phải xem—tất cả đều phải viết rõ ràng từ trước.

## Subagent rất thích hợp làm các tác vụ chuyên biệt

Ở đây cũng tiện thể nhắc tới subagent một chút.

Lấy Claude Code làm ví dụ, subagent có thể hiểu như một "trợ lý nhỏ chuyên làm một loại việc cụ thể". Nó có Context riêng, System Prompt riêng và quyền hạn công cụ riêng, cực kỳ thích hợp để xử lý các tác vụ có ranh giới rõ ràng như Review code, viết bổ sung test, phân tích log, sắp xếp tài liệu. Tài liệu chính thức cũng chỉ ra rằng, subagent có thể chạy trong một Context độc lập, giảm bớt áp lực ngữ cảnh cho phiên chat chính, đồng thời có thể cấu hình các quyền truy cập công cụ khác nhau cho từng tác vụ riêng biệt.

![Claude Code Sub-Agent: Giúp cuộc trò chuyện chính luôn sạch sẽ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claudecode-sub-agent-ff5f7472.png)

Nó và mô hình chạy song song đa Agent nói ở trên không phải là một. Đa Agent nghiêng về phương thức phối hợp, còn subagent nghiêng về ủy quyền nhiệm vụ. Ví dụ phiên chat chính đang hiện thực hóa tính năng xuất đơn hàng, bạn có thể giao việc "kiểm tra xem diff lần này có rủi ro qua mặt phân quyền không" cho Review subagent, giao việc "dựa vào code hiện tại bổ sung unit test" cho Test subagent. Sau khi chúng làm xong việc của mình sẽ trả kết luận về cho phiên chính.

Nhưng subagent cũng đừng lạm dụng. Khi tác vụ quá vụn vặt, ranh giới chưa rõ, code còn đang biến động dữ dội thì việc bóc tách ra ngoài ngược lại chỉ làm tăng thêm chi phí giao tiếp. Cách dùng vững chắc là: Agent chính chịu trách nhiệm về Context tổng thể và đưa ra quyết định, subagent phụ trách các tác vụ cục bộ, rõ ràng và có thể nghiệm thu độc lập.

## Kiểm soát quyền hạn là điều tối quan trọng

AI Coding không thể chỉ trông chờ vào một câu viết trong Prompt: "Xin bạn hãy cẩn thận một chút, đừng làm thao tác nguy hiểm".

Các công cụ như Claude Code giờ đây không còn đơn thuần là trả lời câu hỏi nữa, nó sẽ đọc file, sửa code, thực thi câu lệnh shell, và cũng có thể thông qua MCP để gọi các công cụ nội bộ hoặc dịch vụ bên ngoài. Rủi ro tự nhiên cũng không dừng lại ở việc viết sai code, những vấn đề nghiêm trọng hơn có thể là vô tình xóa nhầm file, làm hỏng cấu hình, chạy sai migration database, đẩy code bậy lên remote, thậm chí chạm vào secret key, chứng chỉ hay cấu hình production nhạy cảm.

Vì vậy quyền hạn phải được thu chặt ngay từ đầu.

Những file như `.env.production`, secret key, certificate theo mặc định tuyệt đối không được để AI đọc hoặc chỉnh sửa; các thao tác như xóa file, migration database, push lên remote, sửa cấu hình CI bắt buộc phải có sự xác nhận của con người; các module nhạy cảm như đăng nhập, thanh toán, phân quyền, upload file, Webhook sau khi sửa xong phải thực hiện Security Review riêng.

Bản thân Claude Code chính thức cũng cung cấp cơ chế phân quyền tương ứng. Ví dụ có thể dùng `/permissions` để xem và quản lý quyền hạn công cụ; trong quy tắc phân quyền có thể cấu hình `allow`, `ask`, `deny`, lần lượt biểu thị cho phép chạy, hỏi trước khi chạy, và từ chối thẳng thừng. Những lệnh rủi ro thấp như `git diff`, chạy unit test có thể nới lỏng một chút; còn các thao tác như `git push`, xóa file, đọc `.env`, truy cập `secrets/**` thì bắt buộc phải đưa vào `ask` hoặc `deny`.

Nếu chỉ cấu hình quy tắc phân quyền mà vẫn chưa yên tâm, bạn có thể bổ sung thêm Hooks và Sandbox. Hooks có thể thực thi các bước kiểm tra tùy biến trước và sau khi gọi công cụ, chẳng hạn như chặn các câu lệnh nguy hiểm, kiểm tra xem có sửa vào đường dẫn nhạy cảm không, chạy format và test trước khi commit; Sandbox thì nghiêng về cách ly môi trường thực thi, dùng để giới hạn phạm vi hệ thống file và mạng mà câu lệnh Bash có thể tiếp cận.

Lấy một ví dụ, giả sử Claude Code chuẩn bị thực thi lệnh:

```bash
rm -rf /tmp/build
```

`PreToolUse` Hook sẽ chặn lấy lệnh gọi Bash này trước, đánh giá xem nó có phải là câu lệnh nguy hiểm hay không; nếu kích hoạt quy tắc, nó sẽ trả về `deny`, Claude Code sẽ hủy bỏ lần gọi công cụ này và phản hồi lý do từ chối về cho Claude.

Sơ đồ dưới đây minh họa toàn bộ quá trình, trích từ tài liệu chính thức của Claude Code giới thiệu về Hooks.

![Claude Code PreToolUse Hook](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-runs-rm-rf-tmp-build-what-happens-520c7930.svg)

Cách làm an toàn hơn là đóng đinh những quy tắc này vào trong quy trình kỹ thuật:

- Câu lệnh nào được phép tự động chạy;
- Câu lệnh nào bắt buộc phải có con người xác nhận;
- Đường dẫn nào cấm đọc hoặc cấm sửa đổi;
- Công cụ MCP nào không được tùy tiện gọi;
- Tác vụ CI nào bắt buộc phải có người phê duyệt;
- Bài test nào không pass thì dứt khoát không cho merge.

Ở đây còn một điểm rất dễ bị bỏ qua: Quy tắc phân quyền không phải là vạn năng. Ví dụ bạn chỉ chặn `rm *`, điều đó không có nghĩa là bạn chặn được các biến thể như `/bin/rm`, `find -delete`. Vì vậy với các thao tác rủi ro cao, không thể chỉ dựa vào một dòng blacklist câu lệnh để phòng thủ, tốt nhất nên kết hợp đồng thời giới hạn đường dẫn, Hooks, Sandbox, CI và Review thủ công để cùng quản lý.

Sự cẩn trọng trong kỹ thuật công nghệ tuyệt đối không thể chỉ viết suông trong Prompt, mà phải hiện diện rõ ràng trong câu lệnh, script, phân quyền, kiểm thử, CI và quy trình phê duyệt.

## Chia sẻ quy trình mình hay sử dụng

Khi làm các yêu cầu thường ngày, Tiểu G thường đi theo nhịp độ này:

1. Tạo nhánh mới, trước tiên xác nhận workspace hoàn toàn sạch sẽ.
2. Viết một bản Spec tinh gọn, nêu rõ mục tiêu, ràng buộc và tiêu chuẩn nghiệm thu.
3. Xem xem có Skill nào phù hợp không, ví dụ TDD, Code Review, thiết kế frontend, nghiên cứu web.
4. Để mô hình có năng lực mạnh lên phương án trước, chỉ thảo luận phương án, không vội vàng viết code.
5. Sau khi chốt phương án, để mô hình giá rẻ triển khai từng bước theo từng Task.
6. Cứ hoàn thành một Task là chạy test, soi diff, rồi commit từng bước nhỏ.
7. Khi diff hiện tại đã ổn định, để một mô hình độc lập thực hiện Review một lượt.
8. Sửa những vấn đề hợp lý trong bản Review, rồi chạy lại bài test một lần nữa.
9. Trước khi merge, con người tự tay soi lại các đoạn diff trọng yếu. Khi đụng tới thay đổi dữ liệu, phân quyền, thanh toán hay cron job, hãy bổ sung thêm tài liệu, phương án rollback hoặc hướng dẫn triển khai canary/gray release.

Quy trình này chậm hơn một chút so với kiểu "một câu nói sinh ra toàn bộ code".

Nhưng chút thời gian chậm lại đó thường sẽ được bù đắp gấp nhiều lần về sau. Ít nhất nó giúp bạn bớt đi rất nhiều công sức đập đi xây lại, rollback hoảng loạn và đi gỡ bom trên môi trường online.

Làm prototype ngắn hạn thì cứ việc mạnh dạn Vibe, cho nó chạy lên cái đã rồi tính sau; nhưng chỉ cần code phải bảo trì dài hạn, bạn bắt buộc phải quay trở về với kỷ luật quy trình kỹ thuật. Bản thân GitHub Flow cũng được tổ chức xoay quanh nhánh, Pull Request, Review và merge để phối hợp làm việc, chứ không ai khuyến khích đâm thẳng code vào nhánh chính. Các công cụ như Codex cũng hỗ trợ đặt quy tắc cấp dự án qua `AGENTS.md` để AI hành động theo quy ước trong repository, chứ không phải lần nào cũng dựa vào vài câu chat nhắc nhở tạm bợ.

Nói cho cùng, AI viết code càng nhanh bao nhiêu, thì những thứ nền tảng kinh điển như Git, Test, Review, Spec lại càng không thể vứt bỏ bấy nhiêu.

Trước đây chúng sinh ra là để kiểm soát con người, giờ đây tiện tay kiểm soát luôn cả AI.
