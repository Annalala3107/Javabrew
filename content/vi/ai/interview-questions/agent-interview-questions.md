---
title: Tổng hợp câu hỏi phỏng vấn AI Agent
description: Tổng hợp có hệ thống các câu hỏi phỏng vấn AI Agent tần suất cao, bao quát khái niệm cốt lõi Agent, Agent Loop, Memory, Prompt Engineering, Context Engineering, MCP, Agent Skills, Harness Engineering, Workflow, Graph, cùng các bài toán kỹ thuật như kích hoạt outer loop, điều kiện dừng và can thiệp thủ công, kèm bài viết tham khảo.
category: AI
tag:
  - Phỏng vấn Agent
  - AI Agent
  - Phỏng vấn AI
head:
  - - meta
    - name: keywords
      content: AI Agent interview questions, Agent interview questions, AI Agent interview, Agent Loop interview, Agent Memory interview questions, MCP interview questions, Prompt engineering interview questions, Context Engineering interview, Harness Engineering interview, Agent Skills interview questions, Workflow interview, Graph Loop interview, outer loop, Loop Engineering, termination conditions, human-in-the-loop
lang: vi
sourceRef: zh-ref/ai/interview-questions/agent-interview-questions.md
---

Khi tiếp nhận một tác vụ, Agent cần đọc hiểu ngữ cảnh, quyết định hành động tiếp theo, gọi công cụ thực thi, quan sát kết quả phản hồi, sau đó đánh giá xem nên tiếp tục lặp, kết thúc tác vụ hay bàn giao cho con người can thiệp. Các câu hỏi phỏng vấn AI Agent về cơ bản đều bám sát chuỗi thực thi này; các khái niệm như Memory, MCP, Skills, Harness và Workflow đều có thể đặt trở lại chuỗi vòng lặp này để thấu suốt.

Các câu hỏi dưới đây được phân nhóm theo các chương trong chuyên đề AI Agent của JavaGuide. Mỗi nhóm đều có bài viết chi tiết tương ứng; tài liệu này đóng vai trò tập hợp các trọng tâm kiến thức và câu hỏi phục vụ ôn tập có hệ thống.

## Nền tảng Agent

Bài viết liên quan: [Khái niệm cốt lõi AI Agent: Agent Loop, Plan-and-Execute, hợp đồng tác vụ cấu trúc hóa, Agentic Workflows, đăng ký Tools](../agent/agent-basis.md), [Thiết kế hệ thống cộng tác Multi-Agent: Phân rã tác vụ, chia sẻ trạng thái, xử lý xung đột và phục hồi thất bại](../agent/multi-agent.md)

Chuỗi gọi công cụ hoàn chỉnh, phân quyền, xác nhận hai bước (two-step confirmation), tính lũy nghiệm (idempotency), kiểm toán (audit), timeout và code mẫu Java được trình bày chi tiết tại [Structured Output và Function Calling](../llm-basis/structured-output-function-calling.md); các chỉ số đánh giá như tỷ lệ hoàn thành tác vụ, độ chính xác gọi công cụ và quỹ đạo thực thi xem tại [Đánh giá ứng dụng Agent như thế nào](../llm-basis/llm-evaluation.md#agent-应用怎么评测).

Phần này thường bắt đầu từ định nghĩa Agent, sau đó đào sâu về vòng lặp vận hành (Agent Loop) và phương thức điều phối (orchestration). Khi chuẩn bị, bạn cần phân biệt rõ ràng sự khác nhau giữa Chatbot thông thường, Workflow và Agent về đường đi tác vụ, quản lý trạng thái và việc sử dụng công cụ.

Câu hỏi phỏng vấn thường gặp:

- AI Agent là gì? Khác biệt như thế nào so với một Chatbot thông thường?
- Công thức `Agent = LLM + Planning + Memory + Tools` nên được hiểu như thế nào?
- Quy trình hoàn chỉnh của một Agent Loop diễn ra như thế nào?
- Điểm khác biệt cốt lõi giữa Agent, lập trình truyền thống và Workflow là gì?
- ReAct, Plan-and-Execute, Reflection và Multi-Agent lần lượt phù hợp với những kịch bản nào?
- Khi đăng ký Tools, tại sao phần mô tả (`description`) của công cụ lại đóng vai trò quyết định?
- Khi nào nên dùng Agent tự trị thuần túy, khi nào nên dùng Workflow hoặc Agentic Workflow?
- Vấn đề nan giải nhất trong phối hợp Multi-Agent là gì? Tại sao trên môi trường production không nên lạm dụng Multi-Agent?

![Kiến trúc cốt lõi AI Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-core-arch-dc0d3123.png)

![Quy trình vận hành Agent Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-loop-flow-27c47f02.png)

## Hệ thống bộ nhớ Agent (Agent Memory)

Bài viết liên quan: [Hệ thống bộ nhớ AI Agent: Bộ nhớ ngắn hạn, bộ nhớ dài hạn và cơ chế tiến hóa bộ nhớ](../agent/agent-memory.md)

Các câu hỏi về Memory sẽ đào sâu vào nguồn gốc thông tin, thời gian lưu trữ, thời điểm truy xuất, cũng như cách xử lý khi phát sinh dữ liệu hết hạn hoặc mâu thuẫn. Lịch sử hội thoại, trạng thái tác vụ hiện tại và bộ nhớ xuyên phiên (cross-session) cần được phân tích độc lập.

Câu hỏi phỏng vấn thường gặp:

- Bộ nhớ ngắn hạn (Short-term Memory) và bộ nhớ dài hạn (Long-term Memory) của Agent khác nhau như thế nào?
- Hệ thống bộ nhớ của Agent phải giải quyết những bài toán cốt lõi nào?
- Bộ nhớ vector và bộ nhớ dạng Markdown lần lượt phù hợp với những kịch bản nào?
- Auto Memory là gì? Tại sao không được phép để nó tự động ghi dữ liệu vô hạn định?
- Những loại bộ nhớ chia sẻ trong nhóm nào phù hợp lưu trữ qua Git và Code Review, loại nào phù hợp lưu trong cơ sở dữ liệu hơn?
- Xử lý việc nén bộ nhớ (compaction), hết hạn bộ nhớ và xung đột bộ nhớ như thế nào?
- Làm thế nào để ngăn chặn bộ nhớ dài hạn làm ô nhiễm Context của mô hình?
- Trong phỏng vấn, làm thế nào để giải thích rằng "sở hữu bộ nhớ" không đơn thuần chỉ là lưu lại lịch sử chat?

![Bản đồ phân loại bộ nhớ Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-memory-taxonomy-81b25fc2.svg)

## Prompt và Context Engineering

Bài viết liên quan: [Kỹ thuật gợi ý (Prompt Engineering) cho mô hình lớn là gì? Các kỹ thuật viết prompt hiệu quả](../agent/prompt-engineering.md), [Kỹ thuật ngữ cảnh (Context Engineering) là gì? Khác biệt thế nào so với Prompt Engineering?](../agent/context-engineering.md)

Các câu hỏi Prompt tập trung vào cách biểu đạt chỉ dẫn, trong khi Context Engineering còn bao gồm trạng thái lịch sử, kết quả thực thi công cụ, bằng chứng truy xuất và việc nạp kế hoạch tác vụ. Việc cắt gọt, nén và cô lập ngữ cảnh trong các tác vụ chạy dài cũng là những câu hỏi đào sâu rất phổ biến.

Câu hỏi phỏng vấn thường gặp:

- Prompt Engineering và Context Engineering khác biệt căn bản ở điểm nào?
- Bốn yếu tố cốt lõi của Prompt gồm Role, Task, Context, Format lần lượt giải quyết bài toán gì?
- Few-Shot, CoT (Chain-of-Thought), phân rã tác vụ và Structured Output lần lượt phù hợp với những kịch bản nào?
- Tấn công Prompt Injection là gì? Các biện pháp phòng thủ phổ biến gồm những gì?
- Tại sao trong kiến trúc Agent, việc chỉ tối ưu Prompt là hoàn toàn không đủ?
- Context Engineering cần giải quyết những bài toán kỹ thuật nào?
- Các quy tắc tĩnh, thông tin động, kết quả công cụ và bộ nhớ được đưa vào Context theo cơ chế nào?
- Khi Context bị tràn trong các tác vụ dài hạn, Compaction, ghi chú cấu trúc hóa và Sub-agent được sử dụng ra sao?

![So sánh Prompt Engineering và Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-prompt-engineering-1c13a869.webp)

## MCP và Agent Skills

Bài viết liên quan: [Model Context Protocol (MCP) là gì? Mối quan hệ với Function Calling và Agent?](../agent/mcp.md), [Agent Skills là gì? Khác biệt thực sự so với Prompt và MCP là ở đâu?](../agent/skills.md)

Function Calling, MCP và Skills nằm ở các khâu khác nhau: mô hình cần thể hiện ý định gọi lệnh, hệ thống máy chủ cần kết nối với công cụ, và Agent cần nạp quy trình cũng như tài liệu cần thiết để hoàn thành tác vụ. Nhóm câu hỏi này thường tiếp tục đào sâu về phân quyền, kiểm tra tham số, timeout và ghi log kiểm toán.

Câu hỏi phỏng vấn thường gặp:

- MCP giải quyết bài toán gì? Tại sao thường được ví như chuẩn "USB-C của thế giới AI"?
- MCP Client, MCP Server và Host lần lượt là gì?
- Tools, Resources và Prompts trong MCP lần lượt giải quyết những bài toán nào?
- Điểm khác biệt giữa MCP và Function Calling là gì?
- Một MCP Server cấp production cần thực hiện những biện pháp quản trị an toàn nào?
- Agent Skills là gì? Ranh giới giữa Skills, Prompt, MCP và Function Calling nằm ở đâu?
- Tại sao Skills lại cần áp dụng cơ chế Lazy Loading (nạp chậm khi cần)?
- Định tuyến Skill (Skill routing) được triển khai như thế nào? Tại sao nó tương tự RAG về mặt cấu trúc nhưng mục tiêu lại khác nhau?
- Khi viết một file `SKILL.md`, những lỗi phổ biến nào dễ mắc phải nhất?

## Harness Engineering

Bài viết liên quan: [Harness Engineering: Khung kiểm tra 6 tầng, quản lý ngữ cảnh và thực tiễn kỹ thuật](../agent/harness-engineering.md)

Harness Engineering tập trung sự chú ý vào môi trường thực thi bên ngoài mô hình, bao gồm quản lý tác vụ, cung ứng ngữ cảnh, vòng phản hồi công cụ, cổng kiểm chứng và cơ chế phục hồi lỗi. Các câu hỏi liên quan thường đòi hỏi ứng viên ánh xạ những khái niệm trừu tượng này vào các thành phần phần mềm cụ thể.

Câu hỏi phỏng vấn thường gặp:

- Harness Engineering là gì? Mối quan hệ của nó với Prompt Engineering và Context Engineering ra sao?
- Tại sao các kỹ sư thực chiến lại nói `Agent = Model + Harness`?
- Khung kiểm tra 6 tầng của Harness được tổng kết trong chuyên đề AI Agent của JavaGuide lần lượt giải quyết những bài toán gì?
- Khi năng lực của mô hình nền tảng được nâng cấp, tại sao một số cơ chế trong Harness lại cần được tái kiểm chứng?
- Ô nhiễm ngữ cảnh (context contamination), tích tụ entropy mã nguồn và độ tin cậy của việc gọi công cụ được quản trị ra sao?
- Trong kỹ thuật Agent, tại sao bắt buộc phải có Evaluator (bộ đánh giá), Verifier (bộ kiểm chứng) và quản lý trạng thái tác vụ?
- Khi triển khai Agent hóa ở các đội ngũ thực chiến tuyến đầu, rào cản chung lớn nhất họ gặp phải là gì?

![Mối quan hệ giữa Harness và Prompt/Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-engineering-layers-arch-f559e799.png)

## Workflow, Graph và Loop

Bài viết liên quan: [Workflow, Graph và Loop trong AI Workflow: Từ khái niệm đến thực tế triển khai](../agent/workflow-graph-loop.md), [Loop Engineering là gì? Tại sao nói đây là "bình mới rượu cũ"?](../agent/loop-engineering.md)

Các câu hỏi về Workflow chủ yếu kiểm tra cấu trúc luồng xử lý, cơ chế lưu trữ trạng thái và kiểm soát vòng lặp. Ngoài việc giải thích Node, Edge, State, bạn còn phải chuẩn bị cho các câu hỏi kỹ thuật về phục hồi sau gián đoạn, cập nhật đồng thời và điều kiện dừng. Khái niệm Loop Engineering vòng ngoài (outer loop) ở đây đề cập đến thực tiễn kỹ thuật kết nối các vòng lặp hiện có với sự kiện CI, tác vụ định kỳ và điều kiện dừng, trọng tâm là cơ chế điều phối, kiểm chứng và dừng lại.

Câu hỏi phỏng vấn thường gặp:

- Tại sao hệ thống AI lại cần đến Workflow?
- Mối quan hệ giữa Workflow, Graph và Loop là gì?
- Graph Loop và Agent Loop khác nhau ở điểm nào?
- Vòng lặp ngoài (outer loop) do ai kích hoạt lượt tiếp theo: sự kiện CI, cron job định kỳ, bộ kiểm tra mục tiêu hay phê duyệt thủ công của con người?
- Vòng lặp ngoài khác với Agent Loop nội bộ của một tác vụ như thế nào, trạng thái và kết quả kiểm chứng được bàn giao ra sao giữa hai bên?
- Những loại tác vụ nào không phù hợp để thực thi tự trị không người giám sát? Khi thiếu tín hiệu nghiệm thu đáng tin cậy, liên quan đến thao tác ghi rủi ro cao hoặc đòi hỏi phán đoán nghiệp vụ, làm sao để dừng lại và chuyển giao cho con người?
- Vòng lặp (Loop) phòng chống việc rơi vào vòng lặp vô tận (dead loop) như thế nào?
- Lựa chọn chiến lược cập nhật State ra sao? Replace, Append và Reducer lần lượt phù hợp với những trường dữ liệu nào?
- Cạnh có điều kiện (conditional edges) và định tuyến động (dynamic routing) khác nhau như thế nào?
- Khi việc gọi công cụ thất bại, những loại lỗi nào phù hợp để retry? Lỗi xác thực thất bại và thao tác ghi không lũy nghiệm xử lý ra sao?
- Sau khi Workflow bị gián đoạn hoặc gặp sự cố bất ngờ thì khôi phục lại thế nào?
- Hệ thống Workflow tồn tại những rủi ro bảo mật đặc thù nào?

## Câu hỏi thiết kế tổng hợp

Phỏng vấn dự án bên cạnh việc hỏi khái niệm còn đào sâu vào kiến trúc, căn cứ lựa chọn giải pháp, bằng chứng hiệu quả và phân tích bài học từ sự cố online. Phương pháp tổ chức câu trả lời hoàn chỉnh có thể tham khảo tại [Trình bày dự án Agent khi phỏng vấn như thế nào? Từ kiến trúc hệ thống, lựa chọn công nghệ đến phân tích bài học Badcase](./agent-project-interview-guide.md).

Các câu hỏi tổng hợp sẽ đặt tất cả các thành phần trên vào chung một bài toán thực tế, kiểm tra kỹ lưỡng việc cân nhắc lựa chọn và xử lý sự cố:

- Nếu yêu cầu một Agent hoàn thành một tác vụ dài đòi hỏi gọi nhiều công cụ liên tiếp, bạn sẽ phân rã các bước thực thi như thế nào?
- Những nút nào phù hợp để giao cho mô hình phán đoán, những nút nào bắt buộc phải do quy tắc hoặc mã nguồn kiểm soát chặt chẽ?
- Kế hoạch của Agent, kết quả thực thi công cụ và trạng thái trung gian được lưu trữ ra sao? Khi bị gián đoạn thì khôi phục thế nào?
- Khi công cụ bao gồm các thao tác ghi dữ liệu, cơ chế phân quyền, kiểm tra tham số, xác nhận hai bước và ghi log kiểm toán được thiết kế ra sao?
- Trong trường hợp nào thì thực sự cần áp dụng Multi-Agent? Làm thế nào để kiểm soát chi phí giao tiếp và đảm bảo tính nhất quán của trạng thái?
- Bạn sẽ ghi nhận những Trace nào, và dùng những chỉ số nào để đánh giá tỷ lệ hoàn thành tác vụ, độ chính xác gọi công cụ và quỹ đạo thực thi?
