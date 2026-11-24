---
title: "Mở mã nguồn draw.io Diagramming Skill độc quyền của JavaGuide: Dùng Agent tự động tạo biểu đồ kỹ thuật draw.io có thể chỉnh sửa"
description: "Chia sẻ tư duy thiết kế, phương thức cài đặt và quy trình sử dụng của Skill drawio-chart, giải thích lý do vì sao hình ảnh minh họa cho bài viết kỹ thuật nên lưu giữ file nguồn .drawio, và cách để Agent sinh ra các sơ đồ luồng, sơ đồ kiến trúc và sơ đồ quan hệ module dễ bảo trì."
category: Thực chiến lập trình AI
tag:
  - Lập trình AI
  - Skills
  - draw.io
  - Codex
  - Viết lách kỹ thuật
lang: vi
sourceRef: zh-ref/ai-coding/practices/drawio-chart-skill.md
head:
  - - meta
    - name: keywords
      content: draw.io,drawio-chart,Agent Skills,Lập trình AI,Minh họa bài viết kỹ thuật,Codex,diagrams.net
---

Chào bạn, mình là Tiểu G. Rất nhiều khi, cảm giác chấn động mà kỷ nguyên AI mang lại cho mình lại bắt nguồn từ chính những chuyện rất đỗi thường nhật.

Trước đây, để viết xong một bài chia sẻ kỹ thuật mình phải mất tối thiểu một tuần, bài dài có khi kéo dài cả tháng trời. Trong đó, có tới 1/3 thời gian bị tiêu tốn vào công việc vẽ sơ đồ minh họa tẻ nhạt và tốn công.

Các bạn độc giả quen thuộc hẳn đều biết, rất nhiều hình vẽ minh họa trên [JavaGuide](https://mp.weixin.qq.com/s/MP8_Td9h72jAhTntVV4DxQ) đều do chính tay mình tự vẽ thủ công bằng draw.io. Bài viết nào cũng có lượng lớn sơ đồ minh họa trực quan để người đọc dễ dàng tiếp thu kiến thức.

![Câu hỏi phỏng vấn cơ bản Java thường gặp](/media/jg/ext/oss.javaguide.cn/github/javaguide/intro/java-basic-questions-01-overview-7d19e02d.png)

![Tổng hợp câu hỏi phỏng vấn MySQL thường gặp](/media/jg/ext/oss.javaguide.cn/github/javaguide/intro/mysql-questions-01-962b5402.png)

Thế nhưng bước sang kỷ nguyên AI, mọi thứ đã hoàn toàn thay đổi, đặc biệt là đối với việc vẽ sơ đồ bằng draw.io.

Năm ngoái khi khái niệm Skill còn chưa bùng nổ, mình đã từng dùng AI sinh trực tiếp mã XML tương ứng, rồi import thủ công vào trong draw.io.

Còn đến hôm nay, nhờ sự ra đời của Skill, việc tự động hóa quá trình sinh sơ đồ draw.io đã bước lên một tầm cao mới.

Bài viết này mình sẽ chia sẻ Skill vẽ sơ đồ draw.io mà bản thân mình thường xuyên sử dụng: [`drawio-chart`](https://github.com/Snailclimb/AIGuide/tree/main/skills/drawio-chart), đồng thời cũng tiện thể tâm sự xem vì sao mình không chuyển hẳn sang dùng các mô hình sinh ảnh (diffusion model) mà vẫn kiên quyết giữ lại các file nguồn có thể chỉnh sửa như `.drawio`.

## Vì sao lại lựa chọn draw.io?

Đánh giá một bức vẽ kỹ thuật không thể chỉ nhìn xem lúc nó mới sinh ra có đẹp mắt hay không, mà khả năng chỉnh sửa về sau quan trọng không kém.

Sau khi một bài viết kỹ thuật được xuất bản, tiêu đề, các node (nút), mũi tên hay thuật ngữ chuyên ngành thường xuyên phải tinh chỉnh lại. Nếu trong tay bạn chỉ còn lại một tấm ảnh PNG tĩnh, bạn hoặc là phải bấm sinh lại từ đầu, hoặc phải dùng công cụ chỉnh sửa ảnh can thiệp gượng gạo, mà kết quả sau cùng phong cách chưa chắc đã ăn nhập với nhau.

Vì vậy hiện tại mình luôn muốn lưu giữ lại một bản file nguồn có thể chỉnh sửa (editable source file).

Chẳng hạn như trên máy cá nhân, mình sẽ giữ riêng các file nguồn `.drawio` này trong một thư mục tư liệu riêng; sau này muốn sửa bức vẽ nào chỉ cần mở thẳng file tương ứng lên là xong.

![Các file nguồn vẽ draw.io lưu trữ cục bộ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/local-drawio-source-files-ceadfec7.png)

Cái hay của `draw.io` nằm ở chính điểm đó: File `.drawio` có thể tiếp tục mở lên chỉnh sửa trực tiếp trên diagrams.net hoặc app draw.io Desktop, và việc xuất ra định dạng PNG, SVG, PDF đều cực kỳ tiện lợi. Các sơ đồ kỹ thuật như sơ đồ luồng (flowchart), sơ đồ kiến trúc (architecture diagram), sơ đồ trạng thái (state diagram) thì dung lượng file nguồn thường rất nhẹ, lưu trữ trong git repository hay thư mục tư liệu đều nhẹ tênh.

Khi xuất file cũng chẳng cần thao tác gì phức tạp, ngay trong menu đã cho phép bạn chọn thẳng các định dạng phổ biến như PNG, JPEG, WebP, SVG, PDF.

![Lựa chọn định dạng xuất file trong draw.io](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/drawio-export-format-options-6dc45b61.png)

Hồi Skill mới xuất hiện, mình đã đúc kết toàn bộ quy trình này lại thành một Skill: [`drawio-chart`](https://github.com/Snailclimb/AIGuide/tree/main/skills/drawio-chart).

Hiện tại, rất nhiều hình vẽ minh họa trong các bài viết về AI coding, Spec Coding, Claude Code mà bạn nhìn thấy trên [javaguide.cn](https://javaguide.cn/) về cơ bản đều được tạo ra theo đúng tư duy này:

- Đầu tiên để Agent bóc tách cấu trúc, sắp xếp các node, sinh ra file `.drawio`, sau đó xuất ra ảnh theo nhu cầu của bài viết;
- Khi cần hiệu ứng thị giác ấn tượng và sống động hơn, kết hợp thêm với GPT-IMG2 để xử lý hậu kỳ.

## Vì sao không chỉ dùng mỗi mô hình sinh ảnh?

Trước đây mình cũng từng thử qua vài hướng tiếp cận khác nhau.

[`tt-a1i/archify`](https://github.com/tt-a1i/archify) giống như việc dùng ngôn ngữ tự nhiên để sinh ra sơ đồ kỹ thuật dạng HTML độc lập, hỗ trợ chuyển đổi theme và xuất ra nhiều định dạng, có kèm cả quy trình kiểm tra và render hoàn chỉnh.

[`coleam00/excalidraw-diagram-skill`](https://github.com/coleam00/excalidraw-diagram-skill) đi theo phong cách bảng trắng Excalidraw, rất hợp để vẽ phác thảo ý tưởng hoặc trình bày quan điểm, lại còn dùng Playwright để kiểm tra lỗi đè chữ, lệch mũi tên, mất cân đối khoảng cách.

[`DayuanJiang/next-ai-draw-io`](https://github.com/DayuanJiang/next-ai-draw-io) thì giống hẳn một sản phẩm vẽ AI độc lập, tích hợp AI thẳng vào giao diện draw.io, hỗ trợ Demo trực tuyến, desktop app, Docker, cài đặt local, MCP Server và cấu hình đa mô hình. Hồi đó mình dùng thử thì cảm giác hơi giật lag, hiệu suất vẽ cũng chưa cao. Tuy nhiên dự án này hiện vẫn đang được cập nhật liên tục, mình chưa đo đạc lại nên không đưa ra nhận xét về hiệu năng hiện tại nữa.

Mỗi dự án trên đều có thế mạnh riêng: Archify cho cảm giác thành phẩm chỉn chu, Excalidraw hợp với phong cách bảng trắng vẽ tay, next-ai-draw-io là một sản phẩm hoàn chỉnh.

Thế nhưng khi áp dụng vào thực tế các bài viết kỹ thuật trên JavaGuide, mình thường hay gặp phải những nhu cầu sau:

- Trong hình có rất nhiều thuật ngữ tiếng Trung/kỹ thuật cần liên tục tinh chỉnh về sau.
- Bảng màu, font chữ, phong cách các node trong cùng một loạt bài viết phải đồng nhất tối đa.
- Hình vẽ phải chèn được vào Markdown, bài viết mạng xã hội, trang web tài liệu và git repo.
- Khi bài viết cập nhật, tốt nhất chỉ sửa đúng vài node bị ảnh hưởng chứ không phải vẽ lại nguyên cả bức.

Những lúc như vậy, file nguồn `.drawio` tiện dụng hơn rất nhiều.

Mở riêng một hệ thống vẽ độc lập thì lại hơi cồng kềnh đối với việc làm ảnh minh họa bài viết. Bản thân Coding Agent vốn đã đang đọc bài, sửa file, chạy lệnh, thu thập tư liệu; để nó tiện tay gọi luôn Skill sinh ra file `.drawio` rồi xuất hàng loạt, chuỗi thao tác sẽ ngắn hơn đáng kể.

Mô hình sinh ảnh rất giỏi trong việc nâng tầm thị giác, nhưng lại không phù hợp cho việc bảo trì dài hạn. Hôm nay sửa một chữ, ngày mai thêm một nhánh rẽ, bạn rất khó bắt nó chỉ can thiệp chính xác vào đúng mẩu nhỏ đó mà vẫn giữ nguyên bố cục của cả bức tranh không bị biến dạng.

draw.io có thể không tạo ra những tác phẩm "nhìn là choáng ngợp như poster phim", nhưng từng node, đường nối, container và câu chữ đều có thể tiếp tục chỉnh sửa được. Đối với hình vẽ kỹ thuật, điểm này đáng giá ngàn vàng.

## Quy trình vẽ sơ đồ hiện tại của mình

Quy trình mình thường áp dụng nhất hiện nay đại khái như sau:

1. Viết bài trước, hoặc tối thiểu phải phác thảo được mạch chính, quy trình luồng và quan hệ giữa các khái niệm.
2. Để Agent đánh giá xem trong bài viết này những chỗ nào thực sự đáng để vẽ sơ đồ minh họa.
3. Dùng `$drawio-chart` để sinh ra file nguồn `.drawio`.
4. Khi cần xuất bản thì xuất ra định dạng PNG / SVG / PDF.
5. Nếu bức vẽ nào cần hiệu ứng thị giác mạnh mẽ hơn thì kết hợp thêm GPT-IMG2 để xử lý tiếp.

Điều mình quan tâm nhất chính là tách bạch rạch ròi giữa cấu trúc và cách thể hiện.

`drawio-chart` chịu trách nhiệm về biểu đồ có cấu trúc: Luồng chạy ra sao, các module kết nối thế nào, trạng thái chuyển đổi ra sao, những node nào thuộc về cùng một nhóm. GPT-IMG2 thì phù hợp hơn để xử lý mức độ ảnh bitmap, ví dụ làm cho bức ảnh trông ra dáng ảnh bìa bài viết hơn, có tính thẩm mỹ và hoàn thiện thị giác cao hơn.

Cấu trúc cốt lõi vẫn nằm nguyên trong file `.drawio`, sau này muốn sửa lúc nào cũng được.

Bức ảnh dưới đây minh họa một lần sinh file `.drawio` thực tế. Agent sau khi đọc hiểu yêu cầu sẽ trực tiếp xuất ra file nguồn, cuối cùng trả về đường dẫn file và phần giải thích cấu trúc.

![Codex dùng drawio-chart sinh file nguồn draw.io](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/codex-generate-drawio-source-0663cad4.png)

Sau khi mở lên, nó vẫn là một file draw.io chuẩn mực. Node, đường nối, chữ viết đều có thể tiếp tục căn chỉnh thủ công, không hề bị đóng đinh chết cứng trong một tấm ảnh tĩnh.

![Mở sơ đồ cấu trúc SKILL.md vừa sinh trong draw.io](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/drawio-open-generated-source-80ae3910.png)

Đây chính là bức ảnh gốc ngay sau khi vẽ chưa qua chỉnh sửa gì, có thể thấy các đường nét vẫn còn vài chi tiết nhỏ cần người dùng kéo chỉnh lại đôi chút cho mượt mà. Điều này là hoàn toàn bình thường.

Dưới đây mời bạn cùng xem qua một số bức hình được vẽ bằng Skill này.

Sơ đồ quy trình quyết định bảo trì `CLAUDE.md` này là một ví dụ điển hình cho dạng sơ đồ luồng phán đoán:

![Quy trình quyết định bảo trì CLAUDE.md](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-maintenance-flow-f46367ef.png)

Nội dung về phối hợp Multi-Agent, nếu chỉ dùng chữ diễn đạt thì người đọc rất dễ bị hoa mắt bởi một mớ danh xưng vai trò. Vẽ thành sơ đồ dây chuyền (pipeline), mỗi Agent chịu trách nhiệm khâu nào, luồng thông tin chuyển tiếp ra sao sẽ trở nên trực quan hơn rất nhiều.

![Pipeline phối hợp 3 Agent trong Multi-Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-multi-agent-pipeline-f6ec4d47.png)

Những bài viết dạng Spec Coding cũng tương tự. Nó trình bày một quy trình làm việc chứ không phải một khái niệm đơn lẻ. Hình vẽ kết nối yêu cầu, Spec, hiện thực hóa và kiểm chứng lại với nhau, giúp độc giả nắm được bức tranh tổng thể trước rồi mới đi sâu vào tiểu tiết trong bài viết.

![Quy trình đường ống Spec Coding](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-pipeline-flow-8a20fb26.png)

Thêm nữa là sơ đồ chiến lược quản lý Spec, nếu chỉ giải thích bằng lời thì rất vòng vo. Gom các khái niệm lọc phân tầng, truy xuất chính xác, kiểm soát context vào chung một bức vẽ thì lại dễ hiểu hơn hẳn.

![Chiến lược quản lý Spec: Lọc phân tầng + Truy xuất chính xác](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-spec-management-strategy-4ded0946.png)

Những bức hình này không nhất thiết tấm nào cũng phải bắt AI làm xong 100% trong một lần. Chỗ tiết kiệm thời gian nhất chủ yếu nằm ở nửa chặng đầu: Agent giúp bạn dựng sẵn bộ khung cấu trúc, phần sau con người chỉ việc nắn chỉnh lại theo đúng ngữ cảnh bài viết.

Hình minh họa bài kỹ thuật một khi bị lệch pha khỏi nội dung bài viết thì rất phiền phức. Node, tiêu đề, mũi tên trong hình nếu không khớp với mạch văn thì dù có đẹp đẽ lung linh đến mấy cũng bằng thừa.

## Skill `drawio-chart` này đã làm những gì?

Trong bài [Agent Skills là gì? Khác biệt thế nào so với Prompt và MCP?](https://javaguide.cn/ai/agent/skills.html), mình từng giải thích rằng Skill giống như một bản hướng dẫn tác vụ được nạp lên theo nhu cầu.

Nó không có nhiệm vụ phát minh ra một công cụ mới, cũng không đồng nhất với Function Calling hay MCP. Nó giải quyết câu chuyện: Một loại tác vụ cụ thể thì làm như thế nào, làm vào lúc nào, những bước nào không được bỏ sót, và cần tham khảo những tài liệu gì.

`drawio-chart` chính là việc đúc kết công việc "vẽ hình draw.io cho bài viết kỹ thuật" thành một Skill hoàn chỉnh.

File chính của nó là [`SKILL.md`](https://github.com/Snailclimb/AIGuide/blob/main/skills/drawio-chart/SKILL.md), bên trong chỉ chứa vài nhóm thông tin cốt lõi:

- Khi nào nên dùng: draw.io, diagrams.net, flowchart, sơ đồ kiến trúc, sequence diagram, ER diagram, state machine, mindmap.
- Khi nào không nên dùng: khi người dùng chỉ muốn sinh mã Mermaid, hoặc cần tranh minh họa bitmap, poster, sơ đồ phong cách bảng trắng.
- Trước khi vẽ cần thu thập thông tin gì: chủ đề, loại sơ đồ, các node trọng yếu, mối quan hệ giữa các node, có yêu cầu xuất file không.
- Khi sinh file `.drawio` đi theo thứ tự nào: tiêu đề, container, các node cốt lõi, đường nối, nhãn chú thích.
- Kiểm tra những gì trước khi bàn giao: node đã đủ chưa, quan hệ vẽ đúng chưa, nhãn trên đường nối có bị quá dài không, đặt tên file có chuẩn quy cách không.

Những chi tiết sâu hơn không bị nhồi nhét hết vào `SKILL.md`.

Nó được bóc tách thành các file trong thư mục `references/`:

| File | Chứa nội dung gì |
| --- | --- |
| `style-spec.md` | Bảng màu, font chữ, ngữ nghĩa của node, phong cách đường nối |
| `xml-and-layout.md` | Cấu trúc draw.io XML, template node, template đường nối, gợi ý bố cục |
| `export-and-files.md` | Câu lệnh xuất PNG / SVG / PDF, quy tắc đặt tên file, quy chuẩn bàn giao |
| `use-cases.md` | Prompt thường dùng, mẫu phối hợp nhiều hình trong một bài, gợi ý đặt tên page |

Cách phân chia này hoàn toàn nhất quán với triết lý thiết kế của Skills.

File chính không nên viết thành một bản README dài ngoằng. Agent trước tiên chỉ cần biết Skill này làm được việc gì; sau khi khớp đúng nhiệm vụ, nó mới căn cứ vào nhu cầu hiện tại để đọc file tài liệu tham khảo tương ứng.

Ví dụ nếu chỉ sinh một sơ đồ luồng đơn giản, không nhất thiết phải đọc toàn bộ quy chuẩn xuất file. Chỉ khi người dùng yêu cầu rõ ràng xuất ra PNG thì nó mới mở `export-and-files.md` ra xem. Khi cần kiểm soát phong cách thẩm mỹ thì mới đọc `style-spec.md`.

Nhờ vậy Context sẽ không bị làm nghẽn bởi những chi tiết không liên quan, và quá trình thực thi cũng ổn định hơn rất nhiều.

## Mình đã bổ sung những ràng buộc nào cho nó?

Vẽ hình là một việc rất dễ bị mất kiểm soát.

Khi Agent sinh sơ đồ, có vài vấn đề kinh điển thường gặp: Chữ trong node quá dài, nhãn đường nối đè bẹp lên mũi tên; màu sắc trong một bức tranh dùng loạn xạ như bôi màu ngẫu nhiên; trên sơ đồ luồng sợi dây nào cũng gắn một đoạn giải thích lê thê; trong XML lại trộn lẫn cả thẻ HTML khiến việc render hoặc chỉnh sửa về sau dễ bị lỗi.

Vì vậy trong `drawio-chart` mình đã cài cắm rất nhiều ràng buộc cụ thể.

Ví dụ về phong cách giao diện, Agent không được tự tiện chọn bừa màu sắc. Quy tắc sẽ phân bổ màu theo đúng ngữ nghĩa: Cổng vào (entrypoint), dịch vụ nghiệp vụ, hạ tầng kỹ thuật, client, bên thứ ba phụ thuộc, database, cache, message queue, trạng thái lỗi đều có mã màu hex tương ứng. Nhờ vậy khi đặt các bức vẽ trong cùng một bộ tài liệu cạnh nhau, người đọc không phải mất công học lại ý nghĩa màu sắc cho từng tấm hình.

Về mặt chữ nghĩa, nó bắt buộc `mxCell.value` mặc định phải dùng văn bản thuần (plain text); khi cần xuống dòng thì dùng thực thể xuống dòng của XML chứ tuyệt đối không nhét các thẻ HTML như `<br>`, `<b>` vào giá trị của node.

Nhãn trên đường nối cũng bắt buộc phải ngắn gọn. Đường nối ngắn thì không được chèn giải thích dài dòng, cái gì viết được vào trong node thì viết vào node, hoặc đặt thành ghi chú bên cạnh. Sự rối mắt trong các sơ đồ kỹ thuật phần lớn đều bắt nguồn từ thói quen "đường nào cũng muốn chen vào một câu giải thích".

Về khâu xuất file, mặc định luôn ưu tiên giữ lại file nguồn `.drawio` trước, rồi mới xuất các định dạng khác theo nhu cầu. Kể cả khi xuất ảnh thất bại thì cũng tuyệt đối không được xóa file nguồn đi.

## Cài đặt và sử dụng như thế nào?

Mình đã đưa Skill này vào repository [AIGuide: Phát triển ứng dụng AI, thực chiến lập trình AI và cẩm nang phỏng vấn](https://github.com/Snailclimb/AIGuide):

- Lối vào repository: **<https://github.com/Snailclimb/AIGuide/tree/main/skills>**
- Thư mục Skill: **<https://github.com/Snailclimb/AIGuide/tree/main/skills/drawio-chart>**

Nếu bạn đang sử dụng hệ sinh thái `npx skills`, có thể cài đặt như sau:

```bash
npx skills add Snailclimb/AIGuide/skills/drawio-chart
```

Nếu chỉ muốn cài đặt riêng cho Codex, bạn có thể chỉ định rõ cờ agent:

```bash
npx -y skills add Snailclimb/AIGuide/skills/drawio-chart --agent codex --yes
```

Nếu chủ yếu dùng trong Codex, bạn cũng có thể cài đặt trực tiếp từ GitHub:

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo Snailclimb/AIGuide \
  --path skills/drawio-chart
```

Ở đây có một lưu ý nhỏ: Trong các phiên bản như `skills@1.5.15`, lệnh `npx skills add Snailclimb/AIGuide --path skills/drawio-chart` có thể vẫn quét qua toàn bộ Skills trong repo trước. Cách viết chắc chắn hơn là ghi thẳng `skills/drawio-chart` vào phần nguồn, chính là cú pháp `Snailclimb/AIGuide/skills/drawio-chart` ở trên.

Khi cài đặt, bạn sẽ thấy nó tự nhận diện nguồn repository, tìm thấy `drawio-chart`, rồi cho phép bạn chọn cài đặt vào agent nào và phạm vi áp dụng ra sao.

![Dùng Skills CLI cài đặt drawio-chart](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/skills-cli-install-drawio-chart-6eff3497.png)

Codex đôi khi không tự động quét lại các Skill mới cài đặt ngay lập tức, mình thường khởi động lại một lần trước khi dùng.

Mới bắt đầu thì đừng để Agent phải đoán. Hãy gọi đích danh `$drawio-chart`, nó sẽ dễ dàng đi đúng vào quy trình làm việc chuẩn. Ví dụ để vẽ một sơ đồ luồng đăng nhập, mình sẽ viết thế này:

```text
Dùng $drawio-chart vẽ sơ đồ luồng đăng nhập người dùng, bao gồm:
Nhập tài khoản mật khẩu -> Xác thực tài khoản mật khẩu -> Thành công chuyển hướng về trang chủ -> Thất bại báo lỗi và cho phép thử lại.
Yêu cầu xuất ra file PNG.
```

Khi làm ảnh minh họa cho cả một bài viết dài, mình thường không áp đặt cứng nhắc "bắt buộc phải vẽ mấy tấm". Cách làm mượt mà hơn là đưa đường dẫn file bài viết cho nó, để nó tự lọc ra những cấu trúc thực sự đáng vẽ trong bài trước, rồi mới bổ sung các yêu cầu về định dạng:

```text
Dùng $drawio-chart đọc bài viết này, và tạo ra một vài sơ đồ kỹ thuật phù hợp cho bài viết.
Tất cả các hình minh họa gom chung vào một file draw.io duy nhất, mỗi hình con là một diagram page riêng biệt.
Tên file chính giữ nguyên giống tên file bài viết, tên các page dùng chữ thường nối bằng dấu gạch ngang (kebab-case).
Phong cách hình vẽ tuân thủ quy chuẩn thống nhất của drawio-chart.
```

Ở đây đừng chỉ quẳng cho nó một câu cụt lủn "vẽ giúp tôi cái sơ đồ kiến trúc". Sơ đồ kiến trúc microservices tối thiểu phải nói rõ có những service nào, database/cache nào, phụ thuộc bên thứ ba nào, request đi vào từ đâu, cuộc gọi nào là đồng bộ, luồng nào đi qua message queue bất đồng bộ.

Bạn cung cấp cho nó một yêu cầu sơ đồ cụ thể và rõ ràng thì sản phẩm nó làm ra mới tiệm cận với bản có thể dùng được ngay. Chỉ đưa ra một tiêu đề mơ hồ thì khả năng cao bạn lại phải tự tay đập đi làm lại từ đầu.

## Những loại hình nào phù hợp với draw.io?

Hiện tại mình chủ yếu giao 3 nhóm hình vẽ cho `drawio-chart`.

Nhóm thứ nhất là sơ đồ quy trình trong bài viết. Ví dụ như Spec Coding, chiến lược bảo trì CLAUDE.md, đường ống phối hợp Agent—những hình này đều có các bước và nhánh rẽ rành mạch, draw.io cực kỳ phù hợp để tinh chỉnh vi mô sau đó.

Nhóm thứ hai là sơ đồ kiến trúc và sơ đồ quan hệ module. Điểm khó chịu nhất ở đây là phong cách không đồng nhất: Trong cùng một bài viết, các node service mang một màu, node lưu trữ mang một màu, phụ thuộc bên ngoài lại được phân biệt riêng—độc giả nhìn vào sẽ thấy nhẹ nhõm hơn rất nhiều.

Nhóm thứ ba là những bức vẽ cần phải sửa đổi thường xuyên. Sau khi bài viết lên sóng, tiêu đề, tên node, chiều mũi tên, kích thước xuất file đều có thể phải điều chỉnh. Chỉ cần file `.drawio` còn đó, việc sửa chữa sẽ không bao giờ là chuyện phức tạp.

Mình sẽ không dùng nó để vẽ ảnh bìa, poster quảng cáo hay ảnh phong cách sản phẩm nghệ thuật—những thứ đó giao cho GPT-IMG2 sẽ chuẩn hơn nhiều. Còn nếu muốn phong cách bảng trắng vẽ tay thì bộ Excalidraw sẽ phù hợp hơn; muốn sơ đồ có chuyển theme, HTML độc lập và tương tác web thì Archify cũng rất đáng để bạn nghía qua.
