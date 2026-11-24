---
title: "Danh mục lựa chọn Skills lập trình AI: Làm rõ yêu cầu, TDD, Code Review và Thiết kế UI"
description: "Tổng hợp danh mục lựa chọn Skills lập trình AI theo kịch bản tác vụ, bao gồm làm rõ yêu cầu, TDD, Code Review, thiết kế UI, tối ưu hiệu năng React, PostgreSQL, Claude API và phát triển Skill, kèm hướng dẫn công cụ nào phù hợp để cài đặt theo nhu cầu."
category: Thực chiến lập trình AI
lang: vi
sourceRef: zh-ref/ai-coding/practices/programmer-essential-skills.md
head:
  - - meta
    - name: keywords
      content: AI coding,Skills,Superpowers,mattpocock,grilling,Claude Code,Cursor,Code Review,TDD,Thiết kế UI,React,Next.js,PostgreSQL,Claude API,Phát triển Skill
---

Chào bạn, mình là Tiểu G. Gần đây có bạn hỏi mình: "Bình thường ông hay dùng những Skills nào? Có thể chia sẻ một danh sách cho anh em tham khảo được không?"

Đương nhiên là được chứ! Từ hồi Skill mới ra đời là mình đã bắt đầu dùng rồi, sau đó trong công ty mình cũng từng tùy biến khá nhiều Skill nội bộ, đồng nghiệp và bạn bè dùng thử đều khen nức nở.

Theo lẽ thường thì việc lập một danh sách thế này đáng ra phải rất đơn giản. Thế nhưng khi thực sự bắt tay vào tổng hợp, mình nhận ra những Skill xứng đáng lọt vào danh sách thực ra lại không nhiều. Hơn nữa, trong quá trình rà soát lại các Skill, mình một lần nữa phải thốt lên rằng trong kỷ nguyên AI công nghệ phát triển quá nhanh! Đỡ không kịp luôn đấy!

Thời điểm Skill mới xuất hiện, năng lực của các mô hình AI chưa mạnh mẽ như bây giờ. Dự án chưa kịp đọc hiểu đã vội vã đâm đầu vào gõ code, viết code xong không thèm bổ sung test, chat một hồi lâu là quên sạch bách các yêu cầu phía trước—những chuyện như vậy diễn ra như cơm bữa.

Thế là chúng ta mới phải nhồi nhét từng bước phát triển vào trong Skill: đầu tiên phải làm rõ yêu cầu, sau đó chia nhỏ kế hoạch, test phải viết trước, sửa xong còn phải review kỹ lưỡng. Quy tắc càng chi tiết thì trong lòng càng thấy yên tâm.

Thế nhưng các mô hình AI lại mạnh lên với tốc độ chóng mặt.

Bây giờ giao cùng một nhiệm vụ đó cho Codex hay Claude Code, phần lớn trường hợp chúng sẽ tự động đọc hiểu dự án, tra cứu chuỗi gọi hàm, sửa file, viết thêm test và tự chạy kiểm chứng. Rất nhiều việc trước đây cần phải dặn đi dặn lại trong `SKILL.md` thì nay đã trở thành những phản xạ cơ bản mặc định của chúng.

Lúc này mà vẫn nhồi nhét cả đống Skills vào thì chẳng khác nào nhét một chồng sổ tay hướng dẫn vận hành dày cộm vào tay một người vốn dĩ đã quá thạo việc. Sửa một chỗ con con cũng bắt phải lên kế hoạch, chạy qua review, thực thi toàn bộ quy trình kiểm chứng—cuối cùng toàn bộ thời gian lại tiêu tốn vào các thủ tục hành chính hình thức, quả thực có phần tự làm khổ mình.

Vì vậy danh sách này được mình thu gọn lại tương đối chừng mực. Những Skill mà hiện tại mình sẵn lòng giữ lại thường là những cái có thể bù đắp được các quy ước dự án mà mô hình không tài nào đoán ra được, hoặc bản thân chúng đã tích hợp sẵn quy trình chuyên sâu, script, template và tài liệu tham khảo chất lượng cao. Còn những Skill chỉ biết nhắc nhở kiểu "trước tiên hãy đọc code, sau đó chỉnh sửa, cuối cùng chạy test" thì về cơ bản mình sẽ không còn đề xuất nữa.

Bài viết [Giải mã chi tiết Agent Skills](https://javaguide.cn/ai/agent/skills.html) trước đây từng phân tích kỹ sự khác nhau giữa Skill, Prompt và MCP; nếu bạn muốn biết lý do vì sao mình bắt đầu cắt giảm bớt Skills thì có thể đọc tiếp bài viết mới nhất: [Thời đại mô hình mạnh mẽ, có còn cần thiết phải cài đặt AI Coding Skills nữa không?](./skill-selection-and-pruning.md).

## Superpowers

Superpowers kết nối toàn bộ các khâu từ làm rõ yêu cầu, lập kế hoạch, TDD, Git Worktree, phối hợp sub-agent, Code Review cho tới kiểm chứng trước khi hoàn thành thành một phương pháp phát triển thống nhất. Nó cực kỳ phù hợp với các codebase xa lạ, tính năng phức tạp và những thay đổi có mức độ rủi ro cao; còn khi chỉ sửa một câu chữ giao diện, thêm một phép kiểm tra null, hay chỉnh lại một dòng validate thì quy trình này nhìn chung là quá cồng kềnh.

Superpowers sẽ lần lượt gọi các Skill sau:

| Skill | Hành động chính |
| --- | --- |
| `brainstorming` | Làm rõ yêu cầu, so sánh phương án và lưu lại bản thiết kế trước khi gõ code |
| `using-git-worktrees` | Tạo không gian làm việc cách ly, kiểm tra baseline của bộ test |
| `writing-plans` | Bẻ bản thiết kế thành các tác vụ nhỏ kèm vị trí file và các bước kiểm chứng |
| `subagent-driven-development` / `executing-plans` | Phân công sub-agent hoặc thực thi kế hoạch theo từng đợt |
| `test-driven-development` | Thực thi chu trình RED-GREEN-REFACTOR |
| `requesting-code-review` | Review phần hiện thực hóa phân loại theo mức độ nghiêm trọng |
| `verification-before-completion` | Kiểm tra bằng chứng xác thực trước khi tuyên bố hoàn thành |
| `finishing-a-development-branch` | Kiểm chứng test và xử lý merge, tạo PR hoặc giữ lại nhánh |

Bộ quy trình này hiện đã tương thích với Claude Code, Codex, Cursor và OpenCode. Câu lệnh cài đặt plugin tương ứng trong Claude Code là:

```text
/plugin install superpowers@claude-plugins-official
```

Trong Codex App, bạn có thể tìm kiếm Superpowers tại mục Plugins ở thanh sidebar; với Codex CLI thì có thể gõ `/plugins` rồi tìm kiếm để cài đặt. Cách thức cài đặt giữa các Agent khác nhau không dùng chung được, nên khi sử dụng nhiều Agent bạn sẽ cần cài đặt riêng cho từng cái.

Giao diện cài đặt của Claude Code sẽ yêu cầu bạn chọn phạm vi áp dụng:

![Tải về Superpowers](/media/jg/ext/oss.javaguide.cn/javaguide/ai/superpowers/superpowers-download-61cbe482.png)

| Tùy chọn | Phạm vi tác dụng | Khuyến nghị |
| --- | --- | --- |
| Install for you | Có hiệu lực trên tất cả các dự án | Chỉ chọn khi đã chắc chắn bản thân muốn gắn bó lâu dài với toàn bộ quy trình này |
| Install for all collaborators | Dùng chung cho các thành viên trong dự án | Chỉ commit khi cả team đã thống nhất áp dụng chung một phương pháp phát triển |
| Install for you, in this repo only | Chỉ có hiệu lực trong repository hiện tại | Ưu tiên chọn khi trải nghiệm lần đầu để xem nó có làm chậm các tác vụ nhỏ hay không |

Mình không còn khuyên người mới vừa vào đã cài đặt trên phạm vi toàn cục (global) nữa. Hãy chạy thử 2-3 tác vụ thực tế trong một repository cụ thể trước, xem xem các bước làm rõ yêu cầu, TDD và review có thực sự giúp giảm bớt việc phải làm lại hay không, rồi mới quyết định mở rộng phạm vi ra sau.

Địa chỉ dự án: <https://github.com/obra/superpowers>

## mattpocock/skills

Nếu bạn chỉ muốn tăng cường sức mạnh cho đúng một mắt xích cụ thể nào đó trong quy trình phát triển, hãy tham khảo [mattpocock/skills](https://github.com/mattpocock/skills). Dự án này bóc tách kinh nghiệm kỹ thuật thành những Skill nhỏ gọn, dễ sửa đổi, có thể phối ghép linh hoạt mà không bắt ép mọi tác vụ đều phải đi qua cùng một cỗ máy quy trình cứng nhắc.

Các module hiện tại rất phù hợp với lập trình viên bao gồm:

| Skill | Vấn đề phù hợp giải quyết |
| --- | --- |
| `grill-me` / `grilling` | Truy vấn dồn dập trước khi khởi công để chốt thật rõ yêu cầu, quyết định và quan hệ phụ thuộc |
| `diagnosing-bugs` | Điều tra lỗi theo đúng trình tự: tái hiện, thu hẹp phạm vi, đưa ra giả thuyết, chèn log đo đạc, sửa chữa và regression test |
| `tdd` | Dùng chu trình RED-GREEN-REFACTOR để phát triển tính năng hoặc sửa Bug |
| `code-review` | Tách riêng việc kiểm tra quy chuẩn code và kiểm tra việc hiện thực hóa có khớp với yêu cầu ban đầu hay không |
| `to-spec` / `to-tickets` | Đúc kết thảo luận sẵn có thành bản đặc tả kỹ thuật, rồi chia nhỏ thành các task kèm quan hệ phụ thuộc |
| `domain-modeling` | Thống nhất thuật ngữ nghiệp vụ, ghi nhận các quyết định then chốt vào `CONTEXT.md` và ADR |

Cài đặt liên Agent có thể dùng lệnh:

```bash
npx skills@latest add mattpocock/skills
```

Trình cài đặt sẽ cho bạn chọn những Skills cần thiết và Agent mục tiêu. Theo hướng dẫn cài đặt hiện tại của dự án, bạn còn cần tích chọn `/setup-matt-pocock-skills`, sau đó chạy một lần trong repo mục tiêu để hoàn tất cấu hình vị trí lưu trữ tài liệu và Issue Tracker.

Lần đầu sử dụng, bạn không nhất thiết phải cài đặt nguyên cả bộ. Nếu yêu cầu thường xuyên trao đổi chưa rõ ràng, có thể chọn trước `grill-me` và `grilling`; nếu thường gặp các Bug hóc búa khó định vị, hãy bổ sung thêm `diagnosing-bugs`.

Bộ Skills này rất thích hợp cho những ai đã có thói quen phát triển căn bản và chỉ muốn vá thêm vài mắt xích còn yếu. Nếu trong dự án đã có sẵn template yêu cầu ổn định, quy chuẩn TDD và quy trình Code Review bài bản thì việc cài đặt lặp lại các Skill tương ứng sẽ không đem lại thêm bao nhiêu giá trị.

Về cách dùng thực tế và ranh giới áp dụng của các Skill này, mình đã có bài viết riêng: [mattpocock/skills: 4 AI Coding Skills mà mình khuyên dùng nhất](https://javaguide.cn/ai-coding/practices/mattpocock-skills.html).

Địa chỉ dự án: <https://github.com/mattpocock/skills>

## ECC (Tiền thân là Everything Claude Code)

Everything Claude Code hiện tại đã chính thức đổi tên thành **ECC**.

Dự án này đã từ một bộ cấu hình Claude Code đơn thuần phát triển thành một hệ thống Harness liên Agent, bao phủ rộng khắp các công cụ như Codex, Claude Code, Cursor, OpenCode, v.v.

Repository ECC đồng thời chứa đựng cả Skills, Agents, Hooks, Rules, cũng như cơ chế quản lý bộ nhớ, quét bảo mật, học tập liên tục và các quy chuẩn kỹ thuật đa ngôn ngữ. Số lượng Skills trong repo này đã lên tới hàng trăm cái, trông giống như một kho cấu hình Harness cấp doanh nghiệp. Khi một đội ngũ cần thống nhất phương thức làm việc, chiến lược ghi nhớ và kiểm tra bảo mật cho Agent, việc quản lý tập trung này sẽ tiết kiệm được rất nhiều cấu hình trùng lặp.

![Hiện tượng tha hóa Context](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-rot-diagram-455c3d66.png)

Số lượng thành phần càng nhiều thì chi phí chọn lọc cũng sẽ tăng theo. Nếu dự án chỉ thiếu khâu Code Review hay TDD, bạn hoàn toàn có thể dùng tính năng cài đặt chọn lọc của ECC, chỉ lấy đúng các thành phần tương ứng như review code Java, lưu trữ context lâu dài hay quét bảo mật, không cần phải nhồi nhét cả hệ sinh thái đồ sộ vào từng repository.

Địa chỉ dự án: <https://github.com/affaan-m/ECC>

## Doc Co-Authoring

Trước khi lập trình viên bắt tay vào gõ code, bước dễ bị xem nhẹ nhất thực ra lại là: giải thích rõ ràng yêu cầu.

Khi yêu cầu chưa được nói rõ, AI Coding Agent sẽ hùng hục xông về phía trước rất hăng hái, nhưng hướng đi thì chưa chắc đã chuẩn. Nó có thể biến một ý tưởng còn chưa rõ ranh giới thành code thực tế luôn; cuối cùng code, test, tài liệu đều rất hoàn chỉnh, chỉ có điều lại đi trật một khoảng khá xa so với nhu cầu thực tế.

Skill **doc-coauthoring** trong kho Skills chính thức của Anthropic sinh ra chính là để phục vụ cho kịch bản này. Trọng tâm của nó rất cụ thể: chia nhỏ công việc viết PRD, phương án kỹ thuật, tài liệu ra quyết định, RFC thành một quy trình cộng tác bài bản, ưu tiên xử lý bối cảnh, cấu trúc và khả năng tiếp thu của độc giả trước, còn chuyện chau chuốt câu chữ chỉ là việc để lại sau cùng.

doc-coauthoring dùng 3 giai đoạn để xử lý một tài liệu:

| Giai đoạn | Làm gì |
| --- | --- |
| **Context Gathering** | Thu thập bối cảnh, ràng buộc, lịch sử thảo luận, phụ thuộc kiến trúc và mối quan tâm của các bên liên quan |
| **Refinement & Structure** | Lặp qua từng chương mục: đặt câu hỏi và mở rộng ý trước, lọc nội dung, cuối cùng viết thành đoạn văn mạch lạc |
| **Reader Testing** | Dùng một phiên Claude với Context hoàn toàn mới để test tài liệu, kiểm tra xem người đọc có bị hiểu lầm hay sót ý không |

Lấy module hoàn tiền đơn hàng làm ví dụ. Trước khi Coding Agent bắt tay vào làm, bạn có thể để doc-coauthoring tổng hợp một phương án kỹ thuật ngắn gọn, vạch rõ từng mục: máy trạng thái (state machine) hoàn tiền, tính lũy đẳng (idempotency) của API, rollback kho hàng và voucher, cùng cơ chế bù trừ thủ công khi thất bại.

Sau khi tài liệu đã được chốt hạ, với tác vụ nhỏ bạn có thể giao thẳng phương án kỹ thuật và tiêu chuẩn nghiệm thu cho Agent; với thay đổi dính dáng tới nhiều module, hãy nối tiếp với Superpowers để chia kế hoạch, viết test và review code. Làm như vậy mục đích cốt lõi là giải quyết mọi bất đồng ngay trong giai đoạn văn bản, tránh việc sau khi code xong xuôi rồi mới quay ra sửa phạm vi.

Lệnh cài đặt trên Claude Code như sau:

```bash
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

`example-skills` là một nhóm các Skill mẫu, doc-coauthoring chỉ là một trong số đó. Sau khi cài bộ plugin này, công cụ skill-creator nhắc tới ở phần sau cũng sẽ được cung cấp kèm theo luôn, không cần cài đặt lại.

Địa chỉ dự án: <https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring>

## UI UX Pro Max

Đây là một Skill trí tuệ thiết kế UI/UX chuyên nghiệp được thiết kế riêng cho các AI Coding Agent (Claude Code, Cursor, Windsurf, v.v.).

![UI UX Pro Max](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/ui-ux-pro-max-skill-55c711eb.png)

Nó sẽ căn cứ vào loại hình sản phẩm và đặc thù ngành nghề để sinh ra một Design System hoàn chỉnh, sau đó giao các thông số về bảng màu, font chữ, bố cục, hiệu ứng chuyển động và các anti-pattern (mẫu chống chỉ định) cho Agent thực thi. So với các Skill tinh gọn chỉ chứa vài đoạn prompt thẩm mỹ đơn giản, nó mang theo hẳn một kho tư liệu thiết kế có thể tra cứu được.

Dữ liệu chính mà phiên bản công khai hiện tại cung cấp bao gồm:

| Loại tài nguyên | Số lượng | Mô tả |
| --- | --- | --- |
| Phong cách UI | 84 kiểu | Glassmorphism, Neumorphism, Bento Grid, AI-Native UI, v.v. |
| Loại sản phẩm & Bảng màu | 192 bộ | Khớp theo các kịch bản sản phẩm như SaaS, tài chính, y tế, thương mại điện tử |
| Phối hợp Font chữ | 74 bộ | Bao gồm các tổ hợp Google Fonts |
| Loại biểu đồ | 25 loại | Dành cho Dashboard và các trang phân tích |
| Quy tắc suy luận | 161 điều | Tạo Design System chuẩn xác theo từng ngành |
| Nguyên tắc UX | 98 điều | Bao quát anti-pattern, tương tác và khả năng tiếp cận (accessibility) |
| Tech stack hỗ trợ | 22 loại | React, Next.js, Vue, Nuxt, SwiftUI, Flutter, JavaFX, v.v. |

Lấy ví dụ với yêu cầu "Giúp tôi làm một Landing Page cho dịch vụ Spa thẩm mỹ", kết quả sinh ra trước tiên sẽ xếp trang này vào nhóm ngành sức khỏe & dưỡng sinh, tiếp đó định hướng theo phong cách Soft UI, bảng màu phối hợp giữa hồng nhạt, xanh xô thơm (sage green) và điểm xuyết ánh kim, font chữ lựa chọn Cormorant Garamond. Đồng thời trong cùng tài liệu đó cũng sẽ liệt kê các anti-pattern cần tránh, ví dụ như cảnh báo không dùng hiệu ứng chuyển màu tím - hồng sến súa phổ biến.

Với Claude Code, bạn có thể cài đặt từ Plugin Marketplace:

```text
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

Với các công cụ như Codex, Cursor, Windsurf, việc sử dụng CLI chính thức hiện tại sẽ phù hợp hơn. Tên gói package là `ui-ux-pro-max-cli`, bản cũ `uipro-cli` hiện đã ngừng cập nhật:

```bash
npx ui-ux-pro-max-cli init --ai codex
npx ui-ux-pro-max-cli init --ai cursor
```

Script tra cứu của nó phụ thuộc vào Python 3. Sau khi cài đặt hoàn tất, bạn chỉ cần miêu tả loại trang và ngành nghề là có thể kích hoạt:

```text
Giúp tôi làm một Landing Page cho sản phẩm SaaS
Thiết kế một Dashboard phân tích y tế
Làm một App tài chính với chủ đề giao diện tối (Dark Theme)
```

Khâu kiểm tra bàn giao sẽ tiếp tục rà soát các icon, trạng thái hover, độ tương phản văn bản và thuộc tính `reduced-motion`, trong đó có cả những quy tắc rất dứt khoát như "tuyệt đối không dùng emoji để thay thế cho icon". Những dự án đã có sẵn Design System cần hết sức cẩn trọng khi sử dụng tính năng tự động đề xuất này, nếu không các bảng màu, font chữ và quy chuẩn component mới sinh ra rất dễ xung đột với các quy tắc hiện hành. Trong trường hợp đó, việc viết quy chuẩn thiết kế sẵn có của team thành một Project-level Skill sẽ phù hợp hơn nhiều.

Địa chỉ dự án: <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>

Khi không cần tới một kho tri thức thiết kế quá đồ sộ, bạn có thể thay thế bằng Skill **frontend-design** chính thức từ Anthropic.

Phiên bản hiện tại nhấn mạnh hơn vào việc xác định trước một định hướng thị giác sắc nét, sau đó cụ thể hóa định hướng đó thông qua font chữ, bảng màu, bố cục, animation và các chi tiết vi mô, đồng thời tránh cảm giác rập khuôn kiểu "trang web do AI tạo ra". Nó không còn đặt quy tắc cấm tiệt Inter, Roboto hay gradient tím - trắng một cách cứng nhắc nữa; việc có dùng một loại font hay bảng màu nào đó hay không nên được quyết định bởi quy chuẩn thương hiệu, loại nội dung và Design System đã có sẵn.

## Vercel React Best Practices

Ngày nay việc để Agent viết ra một trang React chạy được không hề khó, thứ rất dễ bị bỏ quên lại là các vấn đề về hiệu năng phía sau: vài request đáng lẽ có thể chạy song song lại bị viết thành tuần tự, client phải nhận về một cục dữ liệu to tướng không dùng tới, component bị re-render liên tục do xử lý dependency array không chuẩn, hay tiện tay import một package khiến kích thước Bundle phình to đột biến.

Bộ **vercel-react-best-practices** do chính Vercel duy trì nhắm thẳng vào việc giải quyết những vấn đề nhức nhối này. Tính đến tháng 7 năm 2026, lượng cài đặt tích lũy của nó trên [skills.sh](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices) đã đạt khoảng 570.000 lượt, bao gồm 70 quy tắc hiệu năng cho React và Next.js, được phân chia thành 8 nhóm theo mức độ ảnh hưởng.

| Mức độ ưu tiên | Nội dung kiểm tra chính |
| --- | --- |
| CRITICAL | Xóa bỏ tình trạng Request Waterfall (thác request), kiểm soát kích thước Bundle |
| HIGH | Cache phía server và loại bỏ request trùng lặp, fetch dữ liệu song song, giảm chi phí tuần tự hóa của React Server Components |
| MEDIUM | Khử trùng lặp request ở client, quản lý dependency, giảm re-render lãng phí, xử lý lỗi Hydration |
| LOW-MEDIUM | Batching thao tác DOM, cache các phép tính lặp lại, tối ưu tra cứu tần suất cao bằng Set hoặc Map |

Mỗi quy tắc đều đính kèm ví dụ code sai, code đã sửa chuẩn và điều kiện áp dụng. Khi viết trang mới, làm audit hiệu năng hoặc refactor code React, việc yêu cầu Agent kiểm tra từng mục theo danh sách quy tắc này sẽ cụ thể và hiệu quả hơn rất nhiều so với một câu nhắc chung chung "giúp tôi tối ưu hiệu năng".

Câu lệnh cài đặt như sau:

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
```

Bộ quy tắc này chỉ phù hợp với các dự án React và Next.js; các dự án Vue, Svelte hay backend thuần túy thì không cần thiết phải cài. Việc tối ưu hiệu năng cũng không thể chỉ nhìn chăm chăm vào danh sách quy tắc, các vấn đề liên quan tới cache, tuần tự hóa và render cuối cùng vẫn phải kết hợp đối chiếu với sản phẩm build, React Profiler và luồng request thực tế để kiểm chứng.

Địa chỉ dự án: <https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices>

## sanyuan-skills

`sanyuan-skills` hiện đang tập hợp 6 Skill độc lập, khi cài đặt bạn có thể lựa chọn theo từng thư mục. Nếu bạn chỉ muốn bổ sung thêm một bước Code Review trước khi commit thì chỉ cần cài Code Review Expert, không cần phải kéo theo cả quy trình làm rõ yêu cầu hay TDD vào làm gì.

| Skill | Ngữ cảnh phù hợp |
| --- | --- |
| Code Review Expert | Review code từ các chiều không gian: SOLID, bảo mật, hiệu năng, xử lý lỗi và điều kiện biên |
| Sigma | Học tập các khái niệm công nghệ thông qua phương pháp truy vấn gợi mở kiểu Socrates |
| Skill Review | Kiểm tra cấu trúc, mô tả, quy trình và mức độ tiêu thụ Token của Skill |
| Skill Forge | Khởi tạo một Skill mới |
| Wiki Ingest | Tổng hợp bài viết, tài liệu hoặc ghi chú thành Wiki có thể tham chiếu chéo |
| Book Study | Hướng dẫn đọc sách, kiểm tra mức độ nắm bắt và ôn tập ngắt quãng (spaced repetition) |

Các lập trình viên Java sẽ dễ dàng đưa Code Review Expert vào sử dụng nhất. Nó thích hợp để bổ sung một vòng review độc lập trước khi commit, nhưng không thể thay thế cho các quy tắc kiểm tra nội bộ của chính dự án. Ranh giới transaction, quy ước mã lỗi, các trường bắt buộc trong log và yêu cầu tương thích ngược vẫn bắt buộc phải đưa vào `AGENTS.md`, hướng dẫn review hoặc bộ test trong repository.

Từng Skill đều có thể cài đặt độc lập:

```bash
npx skills add sanyuan0704/sanyuan-skills --skill code-review-expert
npx skills add sanyuan0704/sanyuan-skills --skill sigma
npx skills add sanyuan0704/sanyuan-skills --skill skill-review
npx skills add sanyuan0704/sanyuan-skills --skill skill-forge
```

Sau khi cài đặt có thể gọi trực tiếp:

```text
/code-review-expert    # Review các thay đổi git hiện tại
/sigma <chủ đề>        # Bật hướng dẫn học tập, ví dụ /sigma React Hooks
/skill-review          # Kiểm tra Skill sẵn có
/skill-forge           # Khởi tạo kỹ năng mới
```

Địa chỉ dự án: <https://github.com/sanyuan0704/sanyuan-skills>

## Supabase Postgres Best Practices

**supabase-postgres-best-practices** được chính Supabase bảo trì chính thức, nội dung tập trung xoay quanh PostgreSQL, các dự án dùng PostgreSQL thông thường đều có thể áp dụng tốt. Tính đến tháng 7 năm 2026, lượt cài đặt tích lũy của nó trên [skills.sh](https://skills.sh/supabase/agent-skills/supabase-postgres-best-practices) đã đạt khoảng 300.000 lượt.

Nó chia các quy tắc liên quan tới PostgreSQL thành 8 nhóm: hiệu năng truy vấn, quản lý kết nối (connection pooling), bảo mật & RLS, thiết kế cấu trúc bảng, đồng thời & khóa (locking), mô hình truy cập dữ liệu, chẩn đoán giám sát và các tính năng nâng cao. Mỗi quy tắc đều giải thích rõ căn nguyên sinh ra vấn đề, sau đó đưa ra câu SQL có vấn đề, SQL đã tối ưu chuẩn, phân tích `EXPLAIN` và các chỉ số hiệu năng cụ thể.

Ví dụ khi yêu cầu Agent review một câu SQL "truy vấn đơn hàng theo user, trạng thái và thời gian tạo", nó sẽ tiếp tục kiểm tra thứ tự các trường trong composite index, điều kiện truy vấn có thực sự trúng index hay không, connection pool có hợp lý không, và thay đổi này có ảnh hưởng tới hiệu năng ghi hay gây tranh chấp khóa hay không, chứ không chỉ quẳng lại một câu cụt lủn "thêm cái index đi".

Lệnh cài đặt như sau:

```bash
npx skills add https://github.com/supabase/agent-skills --skill supabase-postgres-best-practices
```

Các dự án backend Java chỉ cần có dùng PostgreSQL là hoàn toàn có thể mang về dùng để kiểm tra SQL, cấu trúc bảng và cấu hình database. Dự án MySQL thì tuyệt đối không sao chép nguyên xi các thiết lập RLS, index và tham số database trong này; khi đụng tới việc tạo index, sửa trường dữ liệu hay tinh chỉnh connection pool, bạn vẫn phải kết hợp lượng dữ liệu thực tế, `EXPLAIN ANALYZE` và kết quả stress test để phán đoán, không được để Agent tự ý chỉnh sửa thẳng vào DB production.

Địa chỉ dự án: <https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices>

## Claude API

Skill Claude API này hướng tới các bài toán phát triển ứng dụng AI. Nếu bạn chỉ dùng Coding Agent trong IDE thì hoàn toàn có thể bỏ qua; nhưng khi làm chatbot thông minh, nền tảng sinh code, công cụ phân tích tài liệu hay nền tảng Agent nội bộ, nó sẽ giúp bạn đối chiếu chi tiết các thông số SDK và API một cách cực kỳ chuẩn xác.

Tên mô hình, tham số và các sự kiện streaming đều có thể thay đổi theo từng phiên bản, nếu chỉ dựa vào trí nhớ để viết code tích hợp thì rất dễ gọi phải các interface cũ đã lỗi thời. Skill **claude-api** chính thức của Anthropic bao quát từ khâu chọn mô hình, giá cả, tham số, streaming output, gọi công cụ (tool calling), MCP, Agent, cache, tính toán Token cho tới di chuyển mô hình, và được chia tách tài liệu chi tiết theo từng ngôn ngữ:

| Ngôn ngữ / Phương thức tích hợp | Mô tả |
| --- | --- |
| **Python** | Sử dụng Python SDK chính thức |
| **TypeScript** | Sử dụng TypeScript SDK chính thức và Zod |
| **Java** | Dành cho các dự án Java / Kotlin / Scala tham khảo |
| **Go** | Dành cho các ứng dụng backend Go tham khảo |
| **Ruby / PHP** | Phù hợp với các dự án thuộc hệ sinh thái tương ứng |
| **C#** | Dành cho các dự án .NET tham khảo |
| **cURL** | Gọi HTTP thuần, shell script hoặc dùng để debug |

Khi gặp phải tên hàm trong SDK, tham số, cấu trúc streaming event hoặc tool calling, Skill này sẽ tra cứu tài liệu tương ứng trước rồi mới sinh code. Tác dụng cốt lõi của nó là giảm thiểu tình trạng Agent dựa vào ký ức phiên bản cũ để đoán mò API.

Địa chỉ dự án: <https://github.com/anthropics/skills/tree/main/skills/claude-api>

## skill-creator

Đây là một meta-skill nằm trong kho Skills chính thức của Anthropic, dùng để tạo mới, chỉnh sửa và đánh giá Skill.

Nó cung cấp một quy trình làm việc chuẩn mực cho việc phát triển Skill:

| Giai đoạn | Nội dung công việc |
| --- | --- |
| **Nắm bắt ý đồ (Intent Capture)** | Hiểu rõ bạn muốn Skill làm gì, xác định ranh giới và mục tiêu rõ ràng |
| **Soạn thảo SKILL.md** | Viết file chỉ thị cốt lõi của Skill, bao gồm frontmatter và nội dung chỉ thị |
| **Kiểm thử xác thực** | Tạo test case, chạy thử nghiệm đối chứng (Có Skill vs Không có Skill) |
| **Tối ưu lặp lại** | Dựa vào phản hồi của bài test để liên tục tinh chỉnh chỉ thị |
| **Tối ưu phần mô tả** | Tối ưu trường description của Skill để nâng cao độ chính xác khi kích hoạt |

Nó còn tích hợp sẵn công cụ đánh giá, có thể so sánh đầu ra giữa "có dùng Skill" và "không dùng Skill", ghi nhận thời gian thực thi, lượng Token tiêu tốn và kết quả assertion, sau đó sinh ra một bản báo cáo trực quan. Nếu khi không có Skill mà mô hình vốn đã hoàn thành nhiệm vụ một cách ổn định, thì việc duy trì thêm một quy trình phụ trợ là hoàn toàn không cần thiết.

Rất thích hợp làm điểm khởi đầu cho các lập trình viên muốn xây dựng Skill chuyên biệt cho đội ngũ của mình.

Địa chỉ dự án: <https://github.com/anthropics/skills/tree/main/skills/skill-creator>

## Cách thức lựa chọn

| Vấn đề bạn hay gặp phải lặp đi lặp lại | Ưu tiên cân nhắc | Trường hợp không khuyến khích cài đặt |
| --- | --- | --- |
| Tính năng phức tạp dễ bỏ sót yêu cầu, sót test | Superpowers | Chủ yếu xử lý thay đổi nhỏ, Agent hiện tại đã làm ổn định |
| Chỉ muốn bổ sung làm rõ yêu cầu, chẩn đoán Bug, TDD hoặc Code Review | mattpocock/skills | Dự án đã có sẵn quy trình tương đương hoạt động ổn định |
| Team muốn thống nhất Agents, Hooks, bộ nhớ và chính sách bảo mật | ECC | Chỉ thiếu một quy trình Code Review hoặc TDD đơn lẻ |
| PRD, phương án kỹ thuật thường xuyên viết không rõ ràng | Doc Co-Authoring | Chỉ chỉnh sửa một đoạn ngắn trong tài liệu sẵn có |
| Không có Design System, trang do AI tạo ra thường rập khuôn trăm trang như một | UI UX Pro Max | Dự án đã có sẵn thư viện component và quy chuẩn thiết kế trưởng thành |
| Trang React / Next.js chạy được nhưng đầy lỗi hiệu năng | Vercel React Best Practices | Dự án không sử dụng React |
| Muốn thêm một vòng Code Review tổng quát trước khi commit | Code Review Expert | Rủi ro của dự án chủ yếu đến từ quy tắc nội bộ, kiểm tra chung chung không giúp được gì |
| Truy vấn PostgreSQL và cấu trúc bảng thường xuyên phải sửa lại | Supabase Postgres Best Practices | Dự án sử dụng MySQL hoặc cơ sở dữ liệu khác |
| Đang phát triển ứng dụng gọi Claude API | Claude API | Chỉ sử dụng Coding Agent thuần túy trong IDE |
| Muốn đóng gói các tác vụ thất bại nhiều lần thành Skill | skill-creator | Chưa từng làm bài test baseline khi không có Skill |

Cách làm của mình là trước tiên hãy chạy một tác vụ tương tự mà không dùng bất kỳ Skill nào. Nếu mô hình vốn dĩ đã tự hoàn thành ổn định thì không cần cài thêm; chỉ khi cùng một vấn đề lặp đi lặp lại nhiều lần, lúc đó mới tìm đọc `SKILL.md`, `scripts/` và `references/` của dự án ứng viên, xác nhận xem nó có thực sự lấp đúng chỗ trống đó hay không, và có chứa câu lệnh nguy hiểm hay quyền hạn quá rộng hay không.

Lần đầu cài đặt cố gắng chỉ giới hạn trong repository hiện tại. Sau khi chạy thử liên tục 2-3 tác vụ thực tế, hãy so sánh số lần phải làm lại, thời gian thực thi và tính ổn định của kết quả. Nếu không thấy cải thiện rõ rệt thì gỡ bỏ ngay; chỉ khi xác nhận có giá trị sử dụng lâu dài thì mới cân nhắc bật trên phạm vi toàn cục.

Bắt đầu từ cái nào phụ thuộc vào việc thời gian gần đây loại vấn đề nào khiến bạn phải làm lại nhiều nhất: Nếu Code Review luôn bỏ sót cùng một dạng rủi ro, hãy thử Code Review Expert; nếu Agent chưa chốt rõ yêu cầu đã vội vã khởi công, hãy thử Doc Co-Authoring, hoặc nhẹ nhàng hơn là [`grilling`](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md).

Danh sách này hoàn toàn không có mục nào là mặc định bắt buộc phải cài. Chỉ khi bạn nói rõ được một Skill giải quyết vấn đề gì, kích hoạt khi nào, và khi nó mất tác dụng thì gỡ ra sao—khi đó nó mới xứng đáng được giữ lại trong danh sách công cụ của bạn.
