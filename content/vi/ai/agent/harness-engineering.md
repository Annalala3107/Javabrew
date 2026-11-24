---
title: "Harness là gì? Kiến trúc 6 tầng của Harness Engineering và thực tiễn kỹ nghệ Agent"
description: "Harness là gì? Xuất phát từ công thức Agent = Model + Harness, bài viết giải thích kiến trúc 6 tầng của Agent Harness, quản lý ngữ cảnh, gọi công cụ, vòng lặp kiểm chứng và phục hồi sự cố, kết hợp thực tiễn kỹ thuật từ OpenAI, Anthropic, Stripe để làm rõ các đánh đổi trong thiết kế."
category: Phát triển ứng dụng AI
head:
  - - meta
    - name: keywords
      content: Harness là gì,Harness Engineering,Agent Harness,kiến trúc Harness,kỹ nghệ Harness,AI Agent,Claude Code,Codex,AGENTS.md,Context Engineering,kiến trúc Agent
lang: vi
sourceRef: zh-ref/ai/agent/harness-engineering.md
---


Agent Harness là một hệ thống thực thi vận hành bên ngoài mô hình ngôn ngữ lớn (LLM). Nó chịu trách nhiệm tổ chức ngữ cảnh (context), cung cấp công cụ và môi trường thực thi, đồng thời tích hợp kiểm soát quyền hạn, quản lý trạng thái, kiểm chứng kết quả và phục hồi sau sự cố vào quy trình thực hiện tác vụ. Harness Engineering (Kỹ nghệ Harness) chính là lĩnh vực nghiên cứu cách thức thiết kế và xây dựng hệ thống bên ngoài này.

Trong một bài đánh giá năng lực lập trình của Can.ac, chỉ bằng cách thay đổi giao diện chỉnh sửa file, điểm số của Grok Code Fast 1 đã [tăng vọt từ 6.7% lên 68.3%](https://blog.can.ac/2026/02/12/the-harness-problem/). Trọng số tham số của mô hình không hề suy suyển; sự khác biệt cốt lõi đến từ việc giao diện cung cấp những thao tác gì, trả về kết quả ra sao, và liệu thông báo lỗi có thể được bước kế tiếp tận dụng hay không.

Sự chênh lệch này cũng giải thích các sự cố thường gặp ở Agent: việc liên tục gọi công cụ lặp đi lặp lại, phớt lờ các ràng buộc, hoặc đánh mất trạng thái trong các tác vụ dài phần lớn không thể giải quyết đơn thuần bằng việc đổi mô hình mạnh hơn hay chêm thêm một câu prompt. Giao diện công cụ, môi trường thực thi, cơ chế phản hồi và khả năng phục hồi đóng vai trò mang tính quyết định không kém đến việc tác vụ có thể tiếp tục hay không.

Phần sau của bài viết sẽ phân tích các thành phần và cấu trúc phân tầng của Harness, sau đó đối chiếu các đánh đổi trong thiết kế thực tế từ OpenAI, Anthropic, Stripe và Mitchell Hashimoto.

## Harness là gì?

### Agent = Model + Harness

Trong kỹ nghệ phần mềm AI, công thức `Agent = Model + Harness` thường được dùng để phân định hai nửa của một hệ thống. Mô hình đảm nhận vai trò suy luận và sinh văn bản; Harness quản lý system prompt, lệnh gọi công cụ (tool calling), hệ thống tệp, sandbox, logic điều phối (orchestration), middleware hook, vòng lặp phản hồi và các ràng buộc hành vi.

Bản thân mô hình không lưu giữ trạng thái xuyên suốt các phiên (session), cũng không thể tự chạy câu lệnh shell hay đọc kết quả kiểm thử. Harness có nhiệm vụ xâu chuỗi trạng thái tác vụ, cổng thao tác, môi trường thực thi và ranh giới bảo mật lại với nhau, nhằm biến các đầu ra của mô hình thành những hành động có thể kiểm chứng được.

Vivek Trivedi của LangChain trong bài viết *The Anatomy of an Agent Harness* đã đưa ra một phương pháp chia tách rất thực tế: trước tiên liệt kê những gì mô hình có thể làm, sau đó bổ sung từng phần mà nó bất lực. Lần theo trục này để điều tra, vấn đề sẽ được ghim vào các lỗ hổng cụ thể—chẳng hạn như kết quả công cụ có đọc được không, trạng thái tác vụ có được lưu bền vững không, hay sau thất bại có cung cấp thông tin sửa lỗi mang tính hành động hay không.

![Agent = Model + Harness](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-agent-equals-model-harness-arch-fe29369b.png)

### Mối quan hệ giữa Harness với Prompt Engineering và Context Engineering

Prompt Engineering, Context Engineering và Harness Engineering không thích hợp để đặt ngang hàng trên cùng một mặt phẳng so sánh. Chúng giống như các tầng lồng vào nhau, với phạm vi vấn đề cần giải quyết ngày càng mở rộng.

![Mối quan hệ giữa Harness và Prompt/Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-engineering-layers-arch-f559e799.png)

| Phân tầng | Vấn đề giải quyết | Trọng tâm chú ý | Công việc điển hình |
| --------- | ----------------- | --------------- | ------------------- |
| Prompt Engineering | Làm sao diễn đạt chỉ thị cho rõ ràng | Giúp mô hình hiểu đúng ý đồ, giảm mơ hồ cục bộ | Thiết kế system prompt, ví dụ Few-shot, dẫn dắt Chain-of-Thought |
| Context Engineering | Cần cho Agent xem những gì | Cung cấp thông tin đúng và đủ cho mô hình vào thời điểm thích hợp | Quản lý context window, RAG, tiêm bộ nhớ, tối ưu hóa Token |
| Harness Engineering | Hệ thống duy trì thực thi, hiệu chỉnh, quan sát và phục hồi ra sao | Đảm bảo tính đúng đắn liên tục, sửa chữa sai lệch, phục hồi sau sự cố trong các tác vụ chuỗi dài | Hệ thống tệp, sandbox, thực thi ràng buộc, vòng lặp phản hồi, giám sát (observability) |

Với các tác vụ đơn giản, Prompt có thể là đủ. Chẳng hạn yêu cầu mô hình sửa một câu văn bản, chỉ cần prompt rõ ràng thì kết quả thường không tệ. Khi cần tri thức bên ngoài, Context trở nên quan trọng hơn: bạn phải đặt tài liệu, kết quả tìm kiếm và trạng thái lịch sử vào đúng vị trí. Nhưng khi bước vào các kịch bản thương mại chuỗi dài, có khả năng thực thi và dung sai lỗi thấp, Harness sẽ trở thành mâu thuẫn cốt lõi, bởi vì thứ Agent cần không chỉ là "biết trả lời", mà là khả năng thực thi, kiểm chứng, rollback và liên tục thúc đẩy tiến độ.

Prompt có thể làm rõ chỉ thị cục bộ, nhưng không thể cung cấp khả năng truy cập file, chạy test, lưu trạng thái hay phục hồi khi lỗi; những vấn đề thực thi này bắt buộc phải do Harness gánh vác.

### Harness bao gồm những thành phần nào?

Muốn biết trong Harness cần đặt những gì, hãy đặt câu hỏi ngược lại: mô hình không làm được điều gì?

Mô hình ngôn ngữ lớn trông có vẻ rất đa năng, nhưng xét từ góc độ hệ thống, về bản chất nó vẫn chủ yếu là một hàm nhập-xuất (I/O function). Nhận vào một đoạn ngữ cảnh, trả ra một đoạn văn bản hoặc lệnh gọi hàm có cấu trúc. Nó không tự nhiên ghi nhớ lịch sử, không tự chạy lệnh, không biết mã nguồn có thực sự vượt qua kiểm thử hay không, và cũng không tự phân biệt được thông tin nào nên giữ, thông tin nào nên bỏ.

| Điều mô hình không làm được | Harness bù đắp ra sao | Thành phần tương ứng |
| --------------------------- | --------------------- | -------------------- |
| Ghi nhớ lịch sử hội thoại nhiều lượt | Duy trì lịch sử trò chuyện, ghép vào ngữ cảnh mỗi lần request | Hệ thống bộ nhớ (Memory System) |
| Thực thi mã, chạy câu lệnh | Cung cấp môi trường thực thi Bash và code | Môi trường thực thi đa năng |
| Lấy thông tin thời gian thực (phiên bản thư viện mới, thay đổi API) | Kết nối Web Search, các công cụ MCP | Thu nhận tri thức bên ngoài |
| Thao tác với tệp và môi trường | Trừu tượng hóa hệ thống tệp, tích hợp kiểm soát phiên bản Git | Hệ thống tệp (File System) |
| Tự đánh giá mình làm đúng hay sai | Cung cấp sandbox, công cụ test, tự động hóa trình duyệt | Vòng lặp kiểm chứng (Verification Loop) |
| Duy trì tính mạch lạc trong tác vụ dài | Nén ngữ cảnh, file bộ nhớ, theo dõi tiến độ | Quản lý ngữ cảnh (Context Management) |

Việc gom đủ các mảnh ghép "mô hình không làm được, nhưng bạn kỳ vọng Agent làm được" chính là danh mục các thành phần của Harness. LangChain cũng chia tách nó thành nhiều khối: hệ thống tệp chịu trách nhiệm lưu bền vững, thực thi Bash cung cấp bộ công cụ đa năng, sandbox chịu trách nhiệm cô lập rủi ro, cơ chế bộ nhớ chịu trách nhiệm tích lũy qua các phiên, và nén ngữ cảnh chịu trách nhiệm đối phó với sự suy giảm chất lượng khi context bị kéo dài.

## Harness nâng cao

### Một Harness trưởng thành trông như thế nào?

Phần trên đã nhìn nhận Harness từ góc độ "mô hình thiếu gì, hệ thống bù nấy". Nếu chuyển sang góc nhìn thiết kế hệ thống, một Harness hoàn thiện thường sở hữu kiến trúc phân tầng rành mạch.

Để thuận tiện cho việc rà soát xem hệ thống có bị khuyết thiếu phần nào không, bài viết này tổng hợp các thành phần nói trên thành mô hình 6 tầng. Đây là một khung phân tích kiến trúc, không phải một giao thức hay tiêu chuẩn ngành cố định:

![Kiến trúc 6 tầng của Harness Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-engineering-six-layer-architecture-dad9b4cb.svg)

| Tầng | Tên gọi | Giải quyết vấn đề gì | Thiết kế mấu chốt |
| ---- | ------- | -------------------- | ----------------- |
| L1 | Tầng ranh giới thông tin (Information Boundary Layer) | Agent nên biết gì và không nên biết gì | Định nghĩa vai trò và mục tiêu, cắt tỉa thông tin thừa, tổ chức trạng thái tác vụ có cấu trúc |
| L2 | Tầng hệ thống công cụ (Tool System Layer) | Agent tương tác với thế giới bên ngoài thế nào | Chọn công cụ, kiểm soát thời điểm gọi, chắt lọc kết quả công cụ và phản hồi lại |
| L3 | Tầng điều phối thực thi (Execution Orchestration Layer) | Xâu chuỗi các tác vụ nhiều bước ra sao | Dẫn dắt mô hình tiến bước theo quỹ đạo: "hiểu mục tiêu, đánh giá thông tin, phân tích, tạo sinh, kiểm tra" |
| L4 | Tầng bộ nhớ và trạng thái (Memory & State Layer) | Quản lý kết quả trung gian trong tác vụ dài | Quản lý độc lập trạng thái tác vụ hiện tại, sản phẩm trung gian và bộ nhớ dài hạn, tránh xáo trộn trạng thái |
| L5 | Tầng đánh giá và quan sát (Evaluation & Observability Layer) | Làm sao Agent biết mình đã làm đúng hay chưa | Thiết lập cơ chế kiểm chứng độc lập với quá trình tạo sinh |
| L6 | Tầng ràng buộc, kiểm chuẩn và phục hồi (Constraints, Validation & Recovery Layer) | Xử lý ra sao khi xảy ra lỗi | Quy tắc định sẵn để chặn lỗi; cung cấp cơ chế thử lại (retry), rollback hoặc hạ cấp (fallback) khi thất bại |

Bạn có thể hình dung việc này giống như chuẩn bị môi trường làm việc cho một nhân viên mới. L1 là bản mô tả công việc (JD), cho biết cần tập trung vào điều gì; L2 là công cụ làm việc; L3 là quy trình thao tác chuẩn (SOP); L4 là hệ thống quản lý dự án và sổ tay ghi chép; L5 là quy trình kiểm tra chất lượng (QA); L6 là các lằn ranh đỏ và phương án ứng phó khẩn cấp.

Sáu tầng này bao quát toàn bộ quy trình từ ranh giới thông tin đến phục hồi sau sự cố. Những ví dụ thực tiễn từ OpenAI, Anthropic và Stripe được nhắc tới ở phần sau tuy có cách hiện thực khác nhau, nhưng đều có thể đối chiếu vào các vị trí này để rà soát.

Trong giai đoạn đầu, không nhất thiết phải dựng ngay cả 6 tầng. Bạn có thể ưu tiên hoàn thiện L1 và L6 trước: L1 làm rõ ranh giới và đầu vào của tác vụ, L6 ngăn chặn và phục hồi khi xảy ra vượt quyền, thất bại hoặc kết quả không đạt chuẩn. Khi tác vụ phát triển lên nhiều bước thực thi, đòi hỏi lưu sản phẩm trung gian hoặc kiểm chứng lặp đi lặp lại, lúc đó mới bổ sung thêm điều phối công cụ, quản lý trạng thái và hệ thống giám sát.

### Tại sao điểm nghẽn thường không nằm ở mô hình?

Kết quả của Can.ac cho thấy bản thân định dạng gọi công cụ đã có thể thay đổi hoàn toàn tỷ lệ hoàn thành tác vụ. Sau khi LangChain tinh chỉnh system prompt, công cụ và middleware, đồng thời tận dụng phân tích trace để tối ưu hóa vòng lặp kiểm chứng, điểm số của họ trên Terminal Bench 2.0 đã nhảy vọt từ ngoài top 30 lên top 5, điểm số [tăng từ 52.8% lên 66.5%](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering); trong đó mô hình không hề bị thay thế.

Do đó, khi Agent hoạt động chập chờn thiếu ổn định, hãy kiểm tra giao diện công cụ, thông tin lỗi đầu ra và vòng lặp kiểm chứng trước. Nếu giao diện khiến mô hình khó diễn đạt ý đồ thao tác, hoặc sau khi chạy test thất bại chỉ trả về một thông báo lỗi mù mờ, thì việc đổi sang một mô hình mạnh mẽ hơn cũng chỉ khiến nó lặp đi lặp lại việc thử-sai tại đúng điểm nghẽn đó.

Ngoài ra cần lưu ý hiện tượng gắn kết chặt chẽ giữa model và harness (model-harness coupling). Các sản phẩm như Claude Code hay Codex thường đồng thời tinh chỉnh cả mô hình lẫn logic công cụ; một khi mô hình đã quen thuộc với một bộ công cụ nhất định, khi chuyển sang một Harness khác, hiệu quả có thể sụt giảm. LangChain từng ghi nhận trên bảng xếp hạng Terminal Bench 2.0 rằng điểm số của Opus chạy dưới Harness của Claude Code thấp hơn so với khi nó chạy trên các Harness khác.

Harness phù hợp nhất cho tác vụ hiện tại chưa chắc đã là bộ Harness mà mô hình sử dụng trong quá trình hậu huấn luyện (post-training). Khi lựa chọn giải pháp, hãy lấy yêu cầu về công cụ, ràng buộc và kiểm chứng của chính tác vụ làm chuẩn, thay vì mặc định sử dụng Harness đi kèm sẵn của mô hình.

### Tại sao càng nhồi nhiều ngữ cảnh, Agent lại càng trở nên "ngớ ngẩn"?

Trong một buổi demo công khai, Dex Horthy đã quan sát thấy một hiện tượng: khi context window dung lượng 168K Token được sử dụng đến khoảng 40%, chất lượng đầu ra của Agent bắt đầu suy giảm rõ rệt. Tỷ lệ này ghi nhận từ mô hình và tác vụ cụ thể, không nên suy diễn thành ngưỡng chung cho mọi Agent.

![Hiện tượng ngưỡng 40% của tỷ lệ tận dụng ngữ cảnh](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-utilization-40-percent-threshold-phenome-b46a6ca1.svg)

| Phân vùng | Tỷ lệ sử dụng | Biểu hiện |
| --------- | ------------- | --------- |
| Vùng thông minh (Smart Zone) | 0 - ~40% | Suy luận tập trung, gọi công cụ chính xác, chất lượng code cao |
| Vùng ngớ ngẩn (Dumb Zone) | Vượt quá ~40% | Ảo giác gia tăng, đi lòng vòng, format hỗn loạn, chất lượng code giảm sút |

Anthropic cũng gặp phải vấn đề tương tự mà họ gọi là "Hội chứng lo âu ngữ cảnh" (Context Anxiety). Sonnet 4.5 khi context window gần đầy sẽ trở nên do dự, thậm chí có xu hướng thu dọn kết thúc sớm dù tác vụ chưa hoàn thành. Chỉ nén ngữ cảnh thôi là chưa đủ, sau này họ chuyển hẳn sang áp dụng cơ chế thiết lập lại ngữ cảnh (context resets): xóa sạch context window hiện tại, nhưng giữ lại các trạng thái trọng yếu thông qua tài liệu bàn giao có cấu trúc.

Việc quản lý ngữ cảnh đòi hỏi phải giữ lại tài liệu cần thiết cho tác vụ hiện tại và kịp thời dọn sạch lịch sử đã hết hiệu lực hoặc không liên quan. Các đội ngũ tuyến đầu áp dụng chiến lược "tiết lộ tiệm tiến" (progressive disclosure) và "quản lý phân tầng" chính là để tránh việc log công cụ, quyết định cũ và tài liệu trùng lặp chèn ép khả năng tập trung chú ý của mô hình.

Trong môi trường production, bạn có thể giám sát tỷ lệ sử dụng ngữ cảnh và dùng bài test nội bộ để tìm điểm kích hoạt nén, chia đoạn thực thi hoặc bàn giao tác vụ. Con số 40% rất thích hợp làm giá trị quan sát ban đầu cần kiểm chứng, chứ không nên đặt thẳng thành ngưỡng cảnh báo cứng khi chưa có dữ liệu đối soát thực tế.

### Nên bắt tay dựng Harness từ đâu?

Đúc kết từ thực tiễn của các đội ngũ kỹ thuật hàng đầu, các đầu việc có thể chia theo thứ tự ưu tiên. Không cần thiết ngay từ đầu phải dựng nên một hệ thống đồ sộ; chỉ cần làm tốt P0 là thường đã có thể cải thiện rõ rệt năng lực của Agent.

#### P0: Có thể làm ngay lập tức

| Hành động | Lý do | Thực tiễn tham khảo |
| --------- | ----- | ------------------- |
| Tạo và liên tục duy trì `AGENTS.md` | Agent tự động tải mỗi khi khởi động, cập nhật sau khi phạm lỗi để tạo vòng lặp phản hồi | Hashimoto: mỗi dòng tương ứng với một trường hợp thất bại trong quá khứ |
| Viết Linter tùy chỉnh + chỉ thị sửa lỗi | Thông báo lỗi chỉ rõ cho Agent biết phải sửa thế nào | OpenAI: lỗi Linter đi kèm sẵn phương pháp khắc phục |
| Đưa tri thức của team vào kho mã nguồn | Tri thức nằm trong Slack, Wiki, Docs rất khó để Agent tiếp cận ổn định | OpenAI: xem repository là nguồn chân lý duy nhất (single source of truth) |

Ở đây có một cái bẫy thường gặp: đừng biến `AGENTS.md` thành một siêu System Prompt. Rất nhiều team vừa bắt đầu đã muốn nhét tất cả mọi quy tắc vào đó, khiến ngữ cảnh bị tràn ngập và Agent càng dễ đi lệch hướng hơn. Cách làm của OpenAI tiết chế hơn nhiều: `AGENTS.md` chỉ đóng vai trò như một mục lục khoảng 100 dòng, các quy tắc chi tiết được bóc tách sang các tài liệu con để tải theo nhu cầu.

#### P1: Bổ sung sau khi P0 đã vững vàng

| Hành động | Lý do | Thực tiễn tham khảo |
| --------- | ----- | ------------------- |
| Quản lý ngữ cảnh phân tầng | Tránh nhồi nhét mọi thông tin vào một file, chỉ tiết lộ khi cần thiết | OpenAI: dùng AGENTS.md làm mục lục, dài khoảng 100 dòng |
| Thiết lập file tiến độ và danh sách tính năng | Dùng JSON theo dõi trạng thái tính năng, Agent khó làm xáo trộn dữ liệu có cấu trúc | Anthropic: quy trình 2 giai đoạn: Initializer Agent + Coding Agent |
| Trao cho Agent năng lực kiểm chứng end-to-end | Cho phép Agent kiểm chứng tính năng y hệt như người dùng thật | Anthropic: dùng Playwright / Puppeteer MCP |
| Kiểm soát tỷ lệ sử dụng ngữ cảnh | Dùng bài test nội bộ xác định ngưỡng nén và bàn giao, tránh tích lũy lịch sử thừa | Quan sát Smart Zone / Dumb Zone của Dex Horthy |

#### P2: Cân nhắc khi còn dư nguồn lực

| Hành động | Lý do | Thực tiễn tham khảo |
| --------- | ----- | ------------------- |
| Chuyên biệt hóa phân công Agent | Mỗi Agent mang ít thông tin thừa hơn, luôn duy trì trong Smart Zone | Carlini: tách riêng Agent khử trùng lặp, tối ưu hóa và viết tài liệu |
| Định kỳ dọn rác (Garbage Collection) | Tốc độ dọn dẹp phải bắt kịp tốc độ sinh code | OpenAI: Agent dọn dẹp chạy ngầm dưới background |
| Tích hợp khả năng giám sát (Observability) | Biến việc tối ưu hiệu năng từ cảm tính thành vấn đề có thể đo đạc | OpenAI: kết nối Chrome DevTools |

### Harness của bạn đang ở giai đoạn nào?

Bảng dưới đây giúp bạn định vị giai đoạn xây dựng Harness hiện tại của mình. Khi nâng từ Level 0 lên Level 1, `AGENTS.md`, Linter cơ bản và kiểm thử thủ công đã có thể bao quát được phần lớn lỗi có tần suất cao, không nhất thiết phải lấy Level 4 làm điểm xuất phát.

| Giai đoạn | Đặc trưng | Vai trò của kỹ sư |
| --------- | --------- | ------------------ |
| Level 0: Không có Harness | Giao Prompt trực tiếp cho Agent, không có ràng buộc cấu trúc | Viết code thủ công, thi thoảng dùng AI |
| Level 1: Ràng buộc cơ bản | `AGENTS.md`, Linter cơ bản, kiểm thử thủ công | Chủ yếu tự viết code, có AI hỗ trợ |
| Level 2: Vòng lặp phản hồi | Tích hợp CI/CD, kiểm thử tự động, theo dõi tiến độ | Lập kế hoạch và review là chính |
| Level 3: Agent chuyên biệt hóa | Phân công đa Agent, ngữ cảnh phân tầng, bộ nhớ bền vững | Thiết kế môi trường và quản lý quá trình thực thi |
| Level 4: Vòng lặp tự trị | Vận hành song song không người giám sát, tự dọn dẹp, tự sửa lỗi | Thiết kế kiến trúc và chốt chặn chất lượng |

## Những vấn đề Harness chưa giải quyết được

Sau khi nói về các thực tiễn thành công, chúng ta cũng cần nhìn thẳng vào những bài toán chưa có lời giải. Hiện tại các case study công khai không thiếu, nhưng phương pháp luận thực sự thuyết phục thì vẫn còn ít, đặc biệt là khi áp dụng vào các dự án hiện hữu (brownfield), rất nhiều câu hỏi vẫn còn bỏ ngỏ.

| Vấn đề | Hiện trạng | Ai đang quan tâm |
| ------ | ---------- | ---------------- |
| Cải tạo dự án Brownfield thế nào | Đã có thực tiễn công khai trên codebase hiện hữu, nhưng phương pháp tái sử dụng xuyên team vẫn chưa hoàn thiện | Stripe Minions chạy trên codebase khổng lồ hiện hữu; Böckeler lưu ý: hệ thống kiểu dữ liệu, ranh giới module và trừu tượng hóa framework (Ambient Affordances) sẽ ảnh hưởng lớn đến chi phí cải tạo |
| Làm sao xác thực Agent làm đúng việc | Chúng ta giỏi hạn chế nó không làm sai, nhưng năng lực kiểm chứng tính đúng đắn về mặt chức năng còn rất yếu | Böckeler phê bình: dùng test do AI sinh ra để kiểm chứng code do AI sinh ra chẳng khác nào "dùng cùng một đôi mắt để tự chấm bài tập của chính mình" |
| Khả năng bảo trì dài hạn của code do AI sinh ra | LLM thường hay tự hiện thực lại các tính năng đã có; hiệu quả lâu dài vẫn khó đánh giá | Greg Brockman từng nêu ra câu hỏi này, hiện chưa có đáp án rõ ràng |
| Nên làm Harness dày hay mỏng | Manus viết lại 5 lần ngày càng tinh giản; OpenAI qua 5 tháng ngày càng phức tạp | Do kịch bản quyết định. Sản phẩm đa dụng hướng tới tối giản; sản phẩm chuyên biệt có thể tùy biến sâu. Khi model mạnh lên, Harness cũng cần định kỳ tinh giản, Anthropic đã chứng minh điều này |
| Đơn Agent hay Đa Agent | Hashimoto kiên trì dùng đơn Agent; Carlini dùng 16 Agent chạy song song | Quy mô quyết định. Dự án nhỏ dùng đơn Agent thường là đủ; dự án lớn dễ tiến tới phân công chuyên biệt hóa |

Dự án Greenfield và Brownfield là những thuật ngữ kinh điển trong kỹ nghệ phần mềm. Dự án Greenfield chỉ dự án mới tinh bắt đầu từ con số không, không có gánh nặng lịch sử, giống như xây nhà trên khu đất trống, muốn thiết kế ra sao cũng tương đối tự do. Dự án Brownfield chỉ việc cải tạo trên nền codebase đã có sẵn, trong đó chứa đựng kiến trúc lịch sử, nợ kỹ thuật và logic tồn đọng, tựa như cải tạo đô thị cũ, rất nhiều đường ống ngầm không thể tùy tiện đụng vào.

Stripe Minions vận hành bên trong kho mã nguồn khổng lồ lâu đời. Đối với một dự án 10 năm tuổi thiếu vắng ranh giới module và nặng nợ kỹ thuật, trước tiên cần làm cho quy trình build và test có thể thực thi lặp lại một cách ổn định, sau đó bổ sung quy tắc cục bộ và kiểm tra cấu trúc cho các thư mục biến động cao, cuối cùng mới mở rộng phạm vi thực thi tự động.

## Case study thực tế: Các đội ngũ hàng đầu đã làm như thế nào

Các case study này đối mặt với quy mô tác vụ khác nhau, nhưng đều phải giải quyết bài toán về ngữ cảnh, ràng buộc và kiểm chứng. Khác biệt nằm ở chỗ: một số team bổ sung cơ chế sau khi sự cố phát sinh, số khác lại chủ động cài cắm sẵn các ràng buộc và phản hồi xuyên suốt chuỗi thực thi.

### OpenAI: 3 người, 5 tháng, 1 triệu dòng code, 0 dòng code viết tay

Trước hết hãy xem [số liệu do chính OpenAI công bố](https://openai.com/index/harness-engineering/):

| Chỉ số | Giá trị |
| ------ | ------- |
| Quy mô team | 3 kỹ sư, sau mở rộng lên 7 người |
| Thời gian triển khai | 5 tháng, bắt đầu từ tháng 8/2025 |
| Quy mô code | Khoảng 1 triệu dòng |
| Code viết tay | 0 dòng; kỹ sư chỉ viết các ràng buộc thiết kế |
| Số PR đã merge | Khoảng 1.500 PR |
| Số PR trung bình/người/ngày | 3.5 PR |
| Hiệu suất gia tăng | Team ước tính thời gian chỉ bằng 1/10 so với viết tay |

Những con số này phụ thuộc vào sự đầu tư tập trung cao độ của đội ngũ, không thể áp dụng trực tiếp làm kỳ vọng cho một team thông thường. Phần nội dung dưới đây sẽ bóc tách các giải pháp kỹ thuật cụ thể bên trong.

#### Đưa cho Agent một tấm bản đồ, đừng nhét một cuốn sổ tay dày cộm

File `AGENTS.md` của OpenAI chỉ dài khoảng 100 dòng, đóng vai trò lối vào trỏ tới các tài liệu thiết kế, sơ đồ kiến trúc, kế hoạch thực thi và tiêu chuẩn chất lượng nằm trong thư mục `docs/`. Agent trước hết đọc chỉ mục cần thiết cho tác vụ, sau đó mới tải chi tiết theo đường dẫn, tránh việc nhét toàn bộ tập quy tắc vào mỗi phiên làm việc.

Agent Skills cũng áp dụng phương thức tiết lộ tiệm tiến tương tự: metadata như tên và mô tả thường trú trong ngữ cảnh, chỉ khi khớp với kịch bản cụ thể mới tải quy tắc chi tiết và quy trình thực thi. Cách làm này đã chuẩn hóa mô hình dạng mục lục của `AGENTS.md`. Bài viết liên quan có thể tham khảo: [Phân tích chi tiết Agent Skills: Là gì? Dùng ra sao? Khác gì với Prompt và MCP?](https://javaguide.cn/ai/agent/skills.html).

#### Ràng buộc kiến trúc phải được thực thi bằng công cụ cơ học

OpenAI định nghĩa phân tầng cố định cho từng phân hệ nghiệp vụ:

```text
Types → Config → Repo → Service → Runtime → UI
```

Chiều phụ thuộc tuyệt đối không được đảo ngược. Làm sao đảm bảo điều này? Nhờ vào Linter tùy chỉnh và structural test. Khi vi phạm quy tắc, công cụ không chỉ báo lỗi mà còn nói rõ cho Agent biết phải sửa như thế nào. Trong quá trình sửa lỗi, Agent liên tục được "rèn giũa" để viết code theo đúng chuẩn mực của team.

OpenAI có một phát biểu nguyên văn rất trực diện: *If it cannot be enforced mechanically, agents will deviate.* (Nếu không thể thực thi một cách cơ học, Agent chắc chắn sẽ đi lệch hướng). Những ràng buộc chỉ viết trên tài liệu là không đủ; nếu không thể cưỡng chế cơ học, sớm muộn gì Agent cũng sẽ vi phạm.

#### Năng lực quan sát cũng phải mở cho Agent xem

Họ tích hợp giao thức Chrome DevTools Protocol vào runtime của Agent, cho phép Agent tự chụp snapshot DOM và ảnh màn hình. Log, metric và trace cũng được phơi bày cho Agent thông qua stack quan sát cục bộ.

Nhờ đó, mục tiêu như "giảm thời gian khởi động xuống dưới 800ms" trở thành một đích đến mà Agent có thể tự đo đạc, tự kiểm chứng.

#### Entropy không tự nhiên biến mất

AI sinh ra càng nhiều code, các giải pháp chất lượng thấp, logic trùng lặp và tài liệu không nhất quán cũng sẽ gia tăng theo. Ban đầu, team OpenAI dành 20% thời gian vào mỗi thứ Sáu để dọn dẹp thủ công những sản phẩm này. Sau đó việc này đã được tự động hóa: một Agent chạy nền định kỳ quét các điểm bất nhất trong tài liệu, các vi phạm kiến trúc và code thừa, rồi tự động tạo PR dọn dẹp.

Khi tốc độ sinh code cao hơn tốc độ dọn dẹp, logic trùng lặp và tài liệu lỗi thời sẽ liên tục tràn vào repo, kéo theo chất lượng ngữ cảnh mà các Agent sau này truy xuất được cũng giảm sút nghiêm trọng.

#### Tri thức nằm trong Slack, Agent rất khó sử dụng ổn định

Tri thức viết trong các cuộc thảo luận Slack hay Google Docs đối với Agent là vô cùng bấp bênh. Cách làm của OpenAI là đưa toàn bộ tri thức của team thành các artifact được quản lý phiên bản ngay trong repo, biến kho mã nguồn thành nguồn chân lý duy nhất có thể truy vết và tham chiếu.

OpenAI cũng lưu ý rằng nếu thiếu sự đầu tư tương đương, các team khác không nên mặc định mình có thể tái hiện kết quả này. Với đa số các team thông thường, việc xây dựng tài liệu dạng chỉ mục, thiết lập các ràng buộc cưỡng chế bằng máy và cơ chế dọn dẹp định kỳ mang tính thực tế và khả thi hơn nhiều so với việc sao chép toàn bộ quy trình của họ.

### Anthropic: Từ hội chứng lo âu ngữ cảnh đến kiến trúc ba Agent

Anthropic có hai thực tiễn rất đáng để mổ xẻ sâu. Một là Carlini dùng đa Agent viết trình biên dịch C, hai là Anthropic Labs mượn tư duy của GAN để xây dựng kiến trúc ba Agent phối hợp.

![Kiến trúc ba Agent phối hợp của Anthropic (Lấy cảm hứng từ GAN)](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/anthropic-three-agent-collaborative-architecture-6a3be1b2.svg)

#### Dùng 16 Agent viết trình biên dịch C

Nicholas Carlini đã dành khoảng 2 tuần, chạy 16 instance Claude Opus song song, trải qua khoảng 2.000 phiên Claude Code, để tạo ra một trình biên dịch C đạt tỷ lệ vượt qua bài kiểm thử GCC torture test lên tới 99%.

| Chỉ số | Giá trị |
| ------ | ------- |
| Thời gian | Khoảng 2 tuần |
| Số Agent chạy song song | 16 instance Claude Opus |
| Số phiên làm việc | Khoảng 2.000 phiên |
| Sản phẩm đầu ra | 100.000 dòng code Rust |
| GCC torture test | Tỷ lệ pass 99% |
| Dự án có thể biên dịch | Hơn 150 dự án (PostgreSQL, Redis, FFmpeg, CPython, Linux 6.9 Kernel, v.v.) |
| Chi phí API | Khoảng 20.000 USD |

Các thiết kế Harness đáng chú ý trong dự án này bao gồm:

- Ghi log ra file thay vì console, áp dụng định dạng một dòng thân thiện với lệnh grep, ví dụ: `ERROR: [reason]`. Khi cần chẩn đoán lỗi mới tìm kiếm file tương ứng, tránh để log dài dòng liên tục chiếm dụng ngữ cảnh.
- Mỗi Agent chỉ chạy một tập con từ 1%–10% bài test. Tập con mẫu của từng Agent là cố định để theo dõi lỗi hồi quy cục bộ; các VM khác nhau lấy mẫu khác nhau, hợp lại sẽ bao phủ toàn bộ bộ test. Nhờ đó kiểm thử không còn là bước nghẽn kéo dài nhiều giờ liền của một Agent đơn lẻ.
- Phân công Agent dần được tinh chỉnh chuyên sâu: hiện thực trình biên dịch, khử trùng lặp (deduplication), tối ưu hiệu năng, chất lượng code và viết tài liệu. Do LLM rất dễ tái hiện lại các hàm đã có, khâu khử trùng lặp được tách thành một bước độc lập để xử lý.

Carlini sau đó đúc kết một câu: *"Tôi phải liên tục tự nhắc nhở mình rằng, tôi đang viết framework kiểm thử này cho Claude, chứ không phải cho chính mình."* Điểm cốt lõi ở đây là: định dạng log, việc phân chia bài test và cách thức phản hồi của test framework phải ưu tiên để Agent tiêu thụ ổn định, chứ không chỉ chăm chút cho mắt người đọc có dễ chịu hay không.

#### Tại sao Anthropic lại mượn ý tưởng từ GAN?

Đội ngũ Anthropic Labs vào tháng 3/2026 đã công bố một kiến trúc ba Agent lấy cảm hứng từ tư duy GAN. Nguyên văn họ nói là *Taking inspiration from GANs*, tức là mượn ý tưởng cân bằng giữa bộ sinh và bộ thẩm định, chứ không phải huấn luyện đối kháng thực sự:

```ebnf
Planner (Người lập kế hoạch) → Generator (Người thực thi) ⇄ Evaluator (Người đánh giá)
```

Planner nhận mô tả sản phẩm từ 1-4 câu và mở rộng thành đặc tả sản phẩm hoàn chỉnh, với yêu cầu "phải táo bạo về quy mô". Generator chia nhỏ tính năng thành từng Sprint, mỗi Sprint có tiêu chí hoàn thành rõ ràng. Evaluator sử dụng Playwright MCP trực tiếp click vào ứng dụng đang chạy, sau đó chấm điểm theo các chiều: độ sâu thiết kế sản phẩm, tính năng, thiết kế thị giác và chất lượng code.

Kiến trúc này chủ yếu giải quyết hai vấn đề:

| Vấn đề | Biểu hiện | Giải pháp |
| ------ | --------- | --------- |
| Hội chứng lo âu ngữ cảnh | Sonnet 4.5 khi gần tới giới hạn context sẽ vội vàng kết thúc | context resets + bàn giao có cấu trúc; chỉ nén là không đủ |
| Độ lệch tự đánh giá | Agent tự tin khen mình làm tốt, nhưng chất lượng thực tế chỉ ở mức thường | Tách biệt việc sinh code và đánh giá cho hai Agent độc lập |

Trong các tác vụ frontend, trọng số chất lượng thiết kế và tính độc bản được đặt cao hơn tính năng và chất lượng code, nhằm nắn chỉnh xu hướng mô hình hay sinh ra các sản phẩm "đầy đủ tính năng nhưng giao diện tầm thường".

#### Gặp hội chứng lo âu ngữ cảnh, Anthropic chọn cách khởi động lại

Anthropic nhận thấy Sonnet 4.5 khi ngữ cảnh chạm trần sẽ trở nên do dự, thậm chí kết thúc sớm khi nhiệm vụ chưa hoàn thành, vì vậy họ áp dụng cơ chế context resets.

Trước khi kích hoạt reset, hệ thống sẽ trích xuất trạng thái tác vụ hiện tại, công việc đã hoàn thành và các đầu việc tồn đọng thành một tài liệu bàn giao có cấu trúc; sau đó khởi động một Agent mới, chỉ giao tài liệu này cùng các tư liệu cần thiết để tiếp tục nhiệm vụ. Lịch sử hội thoại cũ không còn chiếm dụng ngữ cảnh của phiên làm việc mới.

Cách làm này phụ thuộc hoàn toàn vào độ đầy đủ của tài liệu bàn giao: nếu bỏ sót file đã sửa, nguyên nhân lỗi hoặc lệnh kiểm chứng tiếp theo, Agent mới sẽ tiếp tục công việc từ một trạng thái sai lầm. Dự án trình biên dịch của Carlini cũng duy trì khoảng 2.000 phiên Claude Code như những đơn vị tương đối độc lập; Anthropic thì chính thức hóa việc khởi động lại và bàn giao trạng thái thành một cơ chế rõ ràng.

So sánh chi phí giữa hai cấu hình:

| Cấu hình | Thời gian | Chi phí | Kết quả |
| -------- | --------- | ------- | ------- |
| Solo Harness: 1 Agent + công cụ tối thiểu | 20 phút | 9 USD | Bán thành phẩm không chạy được |
| Full Harness: 3 Agent + chuỗi công cụ hoàn chỉnh | 6 giờ | 200 USD | Ứng dụng hoàn chỉnh, chạy tốt |

Với các tác vụ phức tạp hơn, khoảng cách còn giãn rộng hơn nữa. Ví dụ dùng Full Harness làm một trạm sản xuất âm nhạc DAW trên trình duyệt, chạy gần 4 tiếng, tốn 124.70 USD, cuối cùng thu được một ứng dụng hoàn chỉnh có giao diện phối khí, bàn mixer và các nút điều khiển phát nhạc.

Tuy nhiên họ còn có một phát hiện rất quan trọng: khi đổi mô hình từ Sonnet 4.5 sang Opus 4.6, cơ chế Sprint có thể bỏ đi hoàn toàn, và Evaluator từ chỗ phải kiểm tra từng Sprint đã chuyển thành chỉ cần kiểm tra một lần duy nhất ở bước cuối cùng. Đúc kết của Anthropic rất chính xác: *Every component in a harness encodes an assumption about what the model can't do on its own, and those assumptions are worth stress testing.* (Mỗi thành phần trong một harness đều mã hóa một giả định về những gì mô hình không thể tự làm, và những giả định đó rất đáng để thử nghiệm chịu tải).

Khi mô hình được nâng cấp, các tiền đề mà thành phần Harness dựa vào có thể đã thay đổi. Cần định kỳ đối soát lại các giả định này để loại bỏ những cơ chế bảo vệ đã trở nên dư thừa.

### Stripe: Chế độ không người giám sát với hơn 1.300 PR mỗi tuần

Hệ thống Minions của Stripe lại là một thái cực khác: tự động hóa cao độ, không cần người trực tiếp can thiệp. Lập trình viên chỉ cần gửi một tin nhắn trên Slack, Agent sẽ tự mình hoàn tất từ việc viết code, chạy CI cho tới tạo PR, con người chỉ xuất hiện ở bước review cuối cùng. Mỗi tuần có hơn 1.300 PR do Minions sản xuất 100%—không có dòng code viết tay nào của con người—được merge thành công.

![Kiến trúc điều phối máy trạng thái lai của Stripe](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/stripe-hybrid-state-machine-orchestration-archit-51d0f3ff.svg)

Con số này thoạt nhìn thực sự gây choáng ngợp. Nhưng bóc tách ra, nó dựa trên một môi trường kỹ thuật vô cùng hoàn thiện, chứ không phải nhờ vào một "siêu Agent" thần thánh nào.

| Thành phần | Vai trò | Thiết kế mấu chốt |
| ---------- | ------- | ----------------- |
| Devbox | Môi trường phát triển | Máy ảo AWS EC2 nạp sẵn source code và dịch vụ, cấp phát từ pool làm ấm sẵn, khởi động ~10 giây, tư duy "gia súc chứ không phải thú cưng" |
| Máy trạng thái điều phối | Kiểm soát quy trình | Kết hợp các node xác định (lint, git push) và các node Agent (hiện thực tính năng, sửa lỗi CI); cứng rắn ở nơi cần cứng, linh hoạt ở nơi cần sáng tạo |
| Toolshed MCP | Dịch vụ công cụ | Nền tảng MCP tập trung với gần 500 công cụ, mỗi Minion chỉ nhận một tập con đã qua chọn lọc |
| Vòng lặp phản hồi | Đảm bảo chất lượng | Pre-push hook sửa lỗi lint trong vài giây; sau khi push cho phép tối đa 2 vòng chạy CI, bao phủ hơn 3 triệu bài test |

Tư duy điều phối của Stripe rất giống một pipeline lai (hybrid pipeline). Các bước như chạy lint, push code đi theo quy trình tất định; các phần cần phán đoán như hiện thực tính năng, sửa lỗi CI được giao cho Agent. Cứng rắn ở chỗ cần cứng rắn, linh hoạt ở chỗ cần linh hoạt.

Họ còn có một triết lý: *What's good for humans is good for agents.* Những khoản đầu tư trước đây dành cho kỹ sư con người như Devbox, chuỗi công cụ và trải nghiệm lập trình viên (DX) đều sẽ trực tiếp mang lại quả ngọt khi ứng dụng cho Agent. Agent không nhất thiết cần một cơ sở hạ tầng hoàn toàn tách biệt, nó xứng đáng được đối xử như một công dân hạng nhất (first-class citizen) trong môi trường phát triển hiện có.

Nền tảng của Minions là một bản fork từ dự án mã nguồn mở [goose](https://github.com/block/goose) của Block, được Stripe tùy biến sâu cho các kịch bản chạy tự trị không người giám sát.

### Mitchell Hashimoto: Kỹ nghệ Harness của một cá nhân

Mitchell Hashimoto là tác giả của các công cụ nổi tiếng như Vagrant, Terraform và trình giả lập terminal Ghostty. Hướng đi của ông rất khác biệt so với Stripe. Ông kiên quyết mỗi lần chỉ chạy một Agent duy nhất và luôn duy trì sự tham gia sâu sắc của bản thân. Ông từng nói thẳng: *"Tôi không có ý định chạy nhiều Agent, và cũng không muốn chạy như vậy."*

Thực tiễn của ông có thể đúc kết thành 6 bước:

| Bước | Tên gọi | Cách làm |
| ---- | ------- | -------- |
| 1 | Từ bỏ chế độ chat | Để Agent làm việc trực tiếp trong môi trường có thể đọc file, chạy lệnh và gửi request HTTP |
| 2 | Tự tái hiện lại công việc của mình | Mỗi việc làm 2 lần: một lần tự làm, một lần để Agent làm; ông mô tả trải nghiệm này là "vô cùng đau đớn" |
| 3 | Giao việc cho Agent trước khi tan làm | Dành 30 phút cuối ngày để giao việc cho Agent, ví dụ nghiên cứu chuyên sâu, khám phá sơ bộ, phân loại Issue |
| 4 | Thuê ngoài các tác vụ tất định | Lọc ra những tác vụ mà Agent gần như chắc chắn làm tốt để chạy ngầm, khuyên nên tắt thông báo desktop để tránh phân tâm |
| 5 | Kỹ nghệ hóa Harness | Mỗi khi Agent phạm một lỗi, hãy thiết kế một giải pháp kỹ thuật để đảm bảo sau này nó không tái phạm lỗi cùng loại |
| 6 | Luôn duy trì có Agent đang chạy | Mục tiêu là có 10-20% thời gian làm việc có Agent chạy dưới nền |

File `AGENTS.md` trong dự án Ghostty mang tính đại diện rất cao. Mỗi một dòng bên trong đều tương ứng với một trường hợp thất bại của Agent trong quá khứ. Đó là một hệ thống phòng chống lỗi tích lũy liên tục. Cứ khi Agent mắc một dạng lỗi mới, một quy tắc lại được bổ sung, giúp giảm thiểu tối đa các lỗi tương tự về sau.

![Vòng lặp phản hồi phòng chống lỗi liên tục tiến hóa của Harness](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/continuously-evolving-harness-error-prevention-f-44ff3a27.svg)

### Đúc kết của Birgitta Böckeler về Harness

Birgitta Böckeler, Kỹ sư xuất sắc (Distinguished Engineer) tại Thoughtworks, khi phân tích thực tiễn của OpenAI trên trang web Martin Fowler, đã không liệt kê thành phần theo tính năng sản phẩm mà quy tụ vấn đề về ba hành động kỹ nghệ cốt lõi: kiểm soát thông tin Agent tiếp nhận, giao phó các ràng buộc cho công cụ cơ học thực thi, và dọn dẹp các sản phẩm thừa liên tục sinh ra.

Bà phân loại các thành phần của Harness thành 3 nhóm:

| Phân nhóm | Trọng tâm chú ý | Thực tiễn điển hình |
| --------- | --------------- | ------------------- |
| Context Engineering | Quản lý những gì Agent thấy và khi nào thấy | Tiến hóa từ file AGENTS.md khổng lồ thành file lối vào + tài liệu phân tầng |
| Architectural Constraints | Đảm bảo Agent không đi lệch hướng | Linter tùy chỉnh, structural test, dùng LLM Agent làm bộ kiểm tra ràng buộc |
| Garbage Collection | Chống lại sự tích lũy entropy | Định kỳ chạy Agent dọn dẹp để quét các điểm bất nhất và vi phạm |

Hệ thống phân loại này giải thích vì sao các case study ở trên trông có vẻ rất khác nhau: thiết kế dạng mục lục của `AGENTS.md` thuộc về Context Engineering; Linter, kiểm thử cấu trúc và máy trạng thái thuộc về Architectural Constraints; còn Agent dọn dẹp chạy nền xử lý Garbage Collection. Chúng phục vụ các mục tiêu khác nhau, không thể thay thế lẫn nhau bằng một bản prompt dài lê thê.

Bà cũng chỉ ra rằng, Harness có thể sẽ giống như các bộ khung scaffolding dịch vụ hiện nay, kết tinh thành các template chuẩn. Khi tổ chức chỉ duy trì một số ít tech stack, môi trường phát triển, các hạng mục kiểm tra và công cụ khả dụng có thể được thiết lập sẵn; khi tạo dịch vụ mới, các quy tắc tương ứng sẽ được nạp động dựa trên thư mục và tác vụ. Template giúp giảm bớt cấu hình lặp lại, nhưng không thể thay thế cho hệ thống test, ranh giới module và dữ liệu runtime của chính dự án đó.

Dự án Brownfield là nơi dễ bộc lộ ranh giới này nhất. Một codebase vận hành nhiều năm, thiếu vắng các ràng buộc kiến trúc, khi kết nối với Agent có thể khiến lỗi kiểu dữ liệu, vi phạm phụ thuộc và kiểm thử thất bại đồng loạt bùng phát, ban đầu thu về chỉ là một danh sách dài dằng dặc các đầu việc cần xử lý. Böckeler dùng khái niệm *Ambient Affordances* để mô tả các điều kiện sẵn có do chính codebase mang lại: ngôn ngữ định kiểu mạnh cung cấp khả năng kiểm tra kiểu, ranh giới module rành mạch cho phép định nghĩa quy tắc phụ thuộc, các framework như Spring đóng gói sẵn một phần chi tiết triển khai. Trường hợp của Stripe chứng minh rằng codebase hiện hữu hoàn toàn có thể chạy được Agent; tuy nhiên các điều kiện này vẫn cần được rà soát kỹ lưỡng trong từng kho mã cụ thể.

Việc kiểm chứng độc lập tính đúng đắn về mặt chức năng vẫn còn là một khoảng trống lớn. Kiểm tra kiến trúc có thể ngăn chặn chiều phụ thuộc sai lầm, tác vụ dọn dẹp có thể xóa bỏ code trùng lặp, nhưng cả hai đều không thể chứng minh quy trình người dùng diễn ra đúng như kỳ vọng. Khi cả bài test lẫn code triển khai đều do cùng một dạng mô hình sinh ra, việc test pass chỉ nói lên rằng các giả định chung giữa chúng chưa bị phá vỡ. Nhận định của Böckeler là: *"Cách làm này đặt niềm tin rất lớn vào các bài test do AI sinh ra, nhưng hiện tại điều đó là chưa đủ."* Xem thêm [thảo luận của bà về kiểm chứng hành vi chức năng](https://martinfowler.com/articles/harness-engineering.html).

## Tổng kết

Để một đầu ra của Agent trở thành sản phẩm kỹ nghệ có thể bàn giao được, cần có sự tham gia đồng bộ của ranh giới thông tin, giao diện công cụ, trạng thái thực thi và kết quả kiểm chứng. Thí nghiệm giao diện của Can.ac, tài liệu dạng mục lục và ràng buộc cơ học của OpenAI, sự bàn giao trạng thái của Anthropic, cùng kiến trúc điều phối tất định của Stripe đều nhắm vào việc giải quyết bài toán thực thi *sau khi* mô hình sinh ra kết quả.

Khi triển khai thực tế, bạn có thể bắt đầu từ vòng lặp ngắn nhất: viết rõ lối vào và ràng buộc cho tác vụ, giúp Agent có thể tự biên dịch và chạy test, rồi chuyển hóa nguyên nhân thất bại thành hành động có thể thực thi ở bước kế tiếp. Khi tác vụ trở nên dài hơn, hãy bổ sung file trạng thái, nén ngữ cảnh và kiểm chứng end-to-end; khi lượng code sinh ra ngày càng lớn, hãy đưa logic trùng lặp, tài liệu lỗi thời và vi phạm kiến trúc vào quy trình dọn dẹp định kỳ.

Harness cũng cần được xem xét lại khi năng lực mô hình biến chuyển. Một Linter, một bộ đánh giá hay một khâu đa Agent từng rất cần thiết trong quá khứ không đồng nghĩa với việc nó sẽ tồn tại mãi mãi. Giữ lại những cơ chế bắt được lỗi thực tế, loại bỏ những phần chỉ làm phình to ngữ cảnh và chi phí điều phối mới là cách giúp Agent tiến bước ổn định trong từng dự án cụ thể.

## Tài liệu tham khảo

- [Can.ac: Đánh giá lập trình khi chỉ thay đổi Harness](https://blog.can.ac/2026/02/12/the-harness-problem/)
- [LangChain: Cải tiến Deep Agents thông qua Harness Engineering](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering)
- [OpenAI: Thực tiễn Harness Engineering](https://openai.com/index/harness-engineering/)
- [Birgitta Böckeler: Harness Engineering dành cho người dùng Coding Agent](https://martinfowler.com/articles/harness-engineering.html)
