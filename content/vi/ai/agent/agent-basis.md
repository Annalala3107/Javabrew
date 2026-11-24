---
title: "Khái niệm cốt lõi về AI Agent: Agent Loop, Plan-and-Execute, Hợp đồng nhiệm vụ có cấu trúc, Agentic Workflows, Đăng ký Tools"
description: "Phân tích chuyên sâu về các khái niệm cốt lõi của AI Agent, điểm lại tiến trình tiến hóa từ phản hồi thụ động đến tự trị thường trực, so sánh sự khác biệt và ngữ cảnh áp dụng giữa Agent, lập trình truyền thống và Workflow."
category: Phát triển ứng dụng AI
head:
  - - meta
    - name: keywords
      content: AI Agent, tác tử thông minh, ReAct, Function Calling, RAG, MCP, cộng tác đa agent, Computer Use
lang: vi
sourceRef: zh-ref/ai/agent/agent-basis.md
---

"Hãy giúp tôi điều tra nguyên nhân giao diện `user-service` bị chậm sáng nay và gửi kết quả cho người phụ trách." Những yêu cầu dạng này không có câu trả lời cố định: việc kiểm tra số liệu giám sát (metrics), log hay Heap Dump trước hoàn toàn phụ thuộc vào bằng chứng thu thập được ở bước trước đó. Ngay cả khi đã phát hiện ra slow SQL, vẫn cần đánh giá xem có nên tiếp tục kiểm tra kế hoạch thực thi (execution plan), tổ chức kết luận ra sao và có được phép phát thông báo hay không.

Một mô hình trò chuyện (chat model) có thể đưa ra một danh sách kiểm tra (checklist) xử lý sự cố, nhưng không thể tự mình đi hết con đường đó. Để hoàn thành nhiệm vụ, mô hình cần chọn công cụ, đọc kết quả trả về từ công cụ, từ đó quyết định bước tiếp theo hoặc dừng lại. AI Agent xử lý chính chuỗi quá trình liên tục gồm ra quyết định và thực thi này.

Càng tích hợp nhiều công cụ, lộ trình thực thi càng không thể thả nổi tùy tiện. Những công việc có các bước rõ ràng như trừ kho đơn hàng hay luồng phê duyệt vẫn nên do chương trình truyền thống hoặc Workflow kiểm soát; chỉ khi các bước trung gian phụ thuộc vào bằng chứng thời gian thực và không thể viết cứng trước, chúng ta mới cần Agent tham gia phán đoán.

Phần sau của bài viết sẽ bóc tách chuỗi liên kết này từ các khía cạnh: tiến trình tiến hóa, vòng lặp thực thi, tích hợp công cụ và các mô hình mẫu phổ biến, đồng thời đưa ra tiêu chí lựa chọn giữa Agent, Workflow và lập trình truyền thống.

## Tiến trình tiến hóa của AI Agent

Năng lực của Agent không xuất hiện chỉ sau một đêm. Mô hình trước hết có được năng lực gọi tài nguyên bên ngoài, sau đó mới phát sinh các nhu cầu về điều phối (orchestration), thực thi tác vụ dài và duy trì trực tuyến lâu dài.

**Năm 2022, khi các sản phẩm như ChatGPT mới bùng nổ**, mô hình chủ yếu dựa vào tri thức sẵn có trong trọng số để trả lời câu hỏi, không thể chủ động gọi công cụ bên ngoài và cũng không thể tự mình hoàn thành các thao tác. [Prompt Engineering](https://javaguide.cn/ai/agent/prompt-engineering.html) là phương thức sử dụng quan trọng nhất thời điểm đó: nêu rõ các ràng buộc và ngữ cảnh thì đầu ra mới ổn định hơn.

**Đến giữa năm 2023, khi Function Calling xuất hiện, cục diện bắt đầu thay đổi.**

Function Calling cho phép LLM gọi các API bên ngoài; RAG đưa thêm cơ sở tri thức bên ngoài vào quá trình trả lời. Những thử nghiệm ban đầu như AutoGPT nối tiếp nhau ra đời, nhưng chúng thường xuyên gọi lặp lại trong các tác vụ nhiều bước, thậm chí rơi vào vòng lặp vô tận.

**Cuối năm 2023, mọi người bắt đầu coi trọng khâu điều phối.**

ReAct bắt đầu được áp dụng rộng rãi: mô hình dựa vào trạng thái hiện tại để chọn hành động, đọc kết quả trả về từ công cụ rồi tiếp tục suy luận. Sự phân công giữa nhiều Agent (Multi-Agent) cũng bước vào thực tiễn trong giai đoạn này, chẳng hạn như giao việc lập kế hoạch, thực thi và kiểm tra cho các vai trò khác nhau.

Các nền tảng như Coze, Dify sử dụng DAG (đồ thị có hướng không chu trình) để ràng buộc đường dẫn thực thi, thiết lập ranh giới quy trình có thể quan sát và kiểm soát được cho các giải pháp tự trị hoàn toàn thời kỳ đầu.

**Cuối năm 2024, tiêu chuẩn hóa và đa phương thức (multimodal) bắt đầu trở nên quan trọng.**

[Giao thức MCP](https://javaguide.cn/ai/agent/mcp.html) bắt đầu giải quyết bài toán phân mảnh trong việc tích hợp công cụ, còn Computer Use mở rộng phạm vi thực thi sang giao diện đồ họa. Các công cụ lập trình như Cursor, Claude Code, Codex cũng dần kết nối việc đọc codebase, sửa đổi, kiểm thử và commit vào cùng một chuỗi tác vụ, kéo theo khái niệm "Vibe Coding" được thảo luận ngày càng nhiều.

**Năm 2025, Agent bắt đầu tiến tới việc thực thi các tác vụ dài (long-running tasks).**

Trong giai đoạn này, Agent bắt đầu đảm nhận các nhiệm vụ dài vượt ra ngoài một phiên đối thoại đơn lẻ: nhận nhiệm vụ, chạy quy trình, lưu lại kết quả. Một câu Prompt đơn lẻ không thể bao quát ổn định các công việc như vậy; các quy trình cố định, ngữ cảnh, template, script và quy tắc kiểm tra được đóng gói thành Skill để nạp theo nhu cầu cho các tác vụ tương tự.

**Bước sang năm 2026, Agent ngày càng tiệm cận với các đơn vị công việc kỹ thuật số trực tuyến lâu dài.**

Các dự án như OpenClaw đã đưa Skills và Heartbeat ra vị trí nổi bật hơn.

Skills đảm nhận việc đóng gói năng lực, còn Heartbeat định kỳ đánh thức Agent để kiểm tra tin nhắn, xử lý nhiệm vụ hoặc cập nhật trạng thái. Đây là cơ chế đánh thức theo lịch trình chứ không phải ý thức liên tục; chủ quyền dữ liệu cục bộ cũng không đồng nghĩa với an toàn tuyệt đối. Một Agent có thể cài đặt Skill, truy cập file và thực thi script bắt buộc phải đối mặt với rủi ro về phân quyền, sandbox và bảo mật chuỗi cung ứng.

Điều này cũng thúc đẩy sự phát triển của Harness Engineering. Có thể xem cấu trúc này là `Agent = Model + Harness`: mô hình chịu trách nhiệm suy luận và sinh nội dung, còn Harness cung cấp môi trường thực thi có thể chạy được, quan sát được, khôi phục được và xác thực được. Trọng tâm vì thế đã mở rộng từ tham số mô hình, độ dài ngữ cảnh và mẹo viết Prompt sang môi trường kỹ thuật bên ngoài mô hình.

Bộ nhớ tích hợp sẵn, năng lực dự đoán, cũng như việc mở rộng từ thế giới số sang robot vật lý vẫn đang tiếp tục được nghiên cứu. Các cột mốc năm chỉ là những lát cắt giúp dễ hình dung: sản phẩm thực tế thường mang đặc trưng của nhiều giai đoạn cùng lúc. Ranh giới rõ ràng nhất vẫn là giữa năm 2023, khi mô hình từ việc chỉ tạo văn bản đã dần có được năng lực thực thi các thao tác bên ngoài.

### Điểm khác biệt giữa Agent, Lập trình truyền thống và Workflow?

Quan sát xem ai là bên quyết định lộ trình thực thi sẽ giúp ta phân biệt rõ Agent, script tự động hóa và Workflow:

```text
Lập trình truyền thống: Lập trình viên viết code → Kết quả thực thi
Workflow: Product vẽ sơ đồ quy trình → Kết quả thực thi
Agent: Người dùng nêu ý đồ → AI đưa ra quyết định → Thực thi động
```

Những kịch bản có logic cố định và tần suất cao như trừ kho đơn hàng, chuyển đổi trạng thái thanh toán, tiêu thụ message trong Message Queue rất phù hợp với chương trình truyền thống; việc dùng Agent chỉ làm tăng thêm độ trễ và tính bất định.

Những công việc có lộ trình rõ ràng như phê duyệt, xuất bản nội dung, phân bổ lead bán hàng rất phù hợp với Workflow. Thứ tự các bước và rẽ nhánh do đồ thị kiểm soát, khi có sự cố có thể định vị chính xác node để xử lý.

Ngược lại, yêu cầu "điều tra nguyên nhân dịch vụ bị chậm sáng nay" thì khác: nên kiểm tra metrics, log hay Heap Dump phụ thuộc vào bằng chứng trung gian, rất khó để viết cứng mọi nhánh rẽ từ trước. Khả năng hiểu ý định bằng ngôn ngữ tự nhiên và đưa ra phán đoán động này mới chính là phạm vi ứng dụng của Agent. Trong một quy trình dài mà chỉ có số ít mắt xích bất định, ta có thể dùng Plan-and-Execute để chừa lại các nhiệm vụ con động bên trong một khung sườn cố định.

### Những thách thức mà Agent phải đối mặt là gì?

Nói về Agent không thể chỉ nói về viễn cảnh màu hồng, mà phải nhìn thẳng vào những bài toán kỹ thuật thực tế:

- Tác vụ dài khi chạy lâu sẽ bị cắt ngắn thông tin lịch sử, mô hình sẽ bị "mất trí nhớ". Phiền toái hơn, ngữ cảnh dài hơn không đồng nghĩa với chất lượng suy luận tốt hơn; nhiều mô hình khai thác thông tin ở vị trí giữa rất kém (hiện tượng "Lost in the Middle").
- Gọi công cụ có thể giảm ảo giác (hallucination) nhưng không thể loại bỏ triệt để. LLM trong các bước suy luận vẫn có thể đưa ra phán đoán sai, và kết quả trả về từ công cụ chưa chắc đã kéo nó lại được.
- Lặp lại nhiều lượt, gọi công cụ, gửi ngược log, nén ngữ cảnh—mỗi khâu đều đốt Token. Chạy một vòng tác vụ phức tạp, hóa đơn chi phí có thể khiến bạn giật mình.
- Agent có thể chạy code, gọi API, đọc ghi file, đồng nghĩa với việc chắc chắn phải đối mặt với nguy cơ Prompt Injection và thao tác vượt quyền. Giải pháp thực tế hơn là tối thiểu hóa quyền hạn, cô lập sandbox và yêu cầu con người xác nhận các thao tác nguy hiểm.
- Trong các tác vụ suy luận sâu nhiều bước, LLM vẫn dễ rơi vào điểm tối ưu cục bộ (local optima), bề ngoài có vẻ vẫn đang xúc tiến công việc nhưng thực chất đã lạc đề.
- Rất đau đầu khi điều tra vì sao Agent đưa ra quyết định nào đó, vì sao gọi công cụ đó, hay bước nào đã làm chệch hướng ngữ cảnh.

Các hướng đi tương đối rõ ràng phía trước bao gồm: ngữ cảnh dài hơn, bộ nhớ phân tầng, thao tác GUI đa phương thức, hệ thống phân quyền và sandbox, tối ưu hóa hiệu quả suy luận.

## AI Agent là gì?

Một Agent xử lý sự cố khi nhận được yêu cầu "dịch vụ bị chậm" có thể đọc metrics trước, sau đó dựa vào cảnh báo để tra cứu log, cuối cùng gửi kết luận cho người phụ trách. Mỗi bước đều phụ thuộc vào bằng chứng thu được ở bước trước đó. Các framework như LangChain đóng gói quy trình này lại, nhưng bên dưới bản chất vẫn là một vòng lặp liên tục đọc trạng thái, chọn hành động và ghi ngược kết quả.

AI Agent là hệ thống phần mềm có khả năng cảm nhận môi trường, đưa ra quyết định và thực thi hành động. LLM xử lý ý đồ và quyết định, công cụ thực thi các thao tác bên ngoài, còn bộ nhớ lưu giữ nhiệm vụ hiện tại và thông tin lịch sử. So với một chatbot chỉ biết sinh câu trả lời, Agent liên tục quan sát và điều chỉnh trong suốt quá trình làm nhiệm vụ cho đến khi thỏa mãn điều kiện kết thúc.

Công thức phân tách phổ biến là: **Agent = LLM + Planning + Memory + Tools**.

![Kiến trúc cốt lõi của AI Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-core-arch-dc0d3123.png)

**Suy luận và lập kế hoạch (Reasoning / Planning)** quyết định mục tiêu và hành động tiếp theo. LLM chia nhỏ mục tiêu dựa trên trạng thái nhiệm vụ hiện tại; kỹ thuật gợi ý Chain-of-Thought (CoT) chia nhỏ quá trình suy luận thành từng bước, giảm thiểu việc đưa ra kết luận vội vã khi chưa được phân tích kỹ.

Bộ nhớ ngắn hạn thường được lưu trong lịch sử ngữ cảnh để duy trì sự mạch lạc của cuộc trò chuyện; bộ nhớ dài hạn thường do các cơ sở tri thức bên ngoài đảm nhận như cơ sở dữ liệu vector (vector database) hoặc đồ thị tri thức (knowledge graph), dùng để truy xuất thông tin tích lũy trong quá khứ.

**Tools (Công cụ)** chịu trách nhiệm truy vấn dữ liệu, gọi API, đọc ghi file hoặc thực thi code. Kết quả thực thi bắt buộc phải được nối thêm vào ngữ cảnh để trở thành Observation (Quan sát) của lượt tiếp theo; nếu không mô hình sẽ không thấy phản hồi từ thao tác bên ngoài, dẫn tới không có căn cứ cho các hành động sau đó.

Toàn bộ chuỗi gọi công cụ, phân quyền, xác nhận hai bước, tính lũy thừa, kiểm toán, timeout và ví dụ Java xem tại [Đầu ra có cấu trúc và Function Calling](../llm-basis/structured-output-function-calling.md); các chỉ số như tỷ lệ hoàn thành nhiệm vụ, gọi công cụ và quỹ đạo thực thi xem tại [Đánh giá ứng dụng Agent như thế nào](../llm-basis/llm-evaluation.md#agent-应用怎么评测).

### Agent Loop là gì?

Agent Loop giúp chuỗi phản hồi này chạy liên tục. Trong mỗi lượt, LLM sẽ chọn hành động dựa vào ngữ cảnh, sau đó công cụ được thực thi và ghi kết quả ngược trở lại; vòng lặp thoát khi nhiệm vụ hoàn thành hoặc chạm điều kiện dừng.

![Quy trình hoạt động của Agent Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-loop-flow-27c47f02.png)

Khi khởi tạo Loop, hệ thống sẽ nạp System Prompt, danh sách công cụ và yêu cầu của người dùng. Sau đó, mô hình lựa chọn giữa "trả lời trực tiếp" hoặc "gọi công cụ"; kết quả công cụ được ghi lại vào ngữ cảnh cho đến khi mô hình không yêu cầu gọi công cụ nữa.

Giới hạn số lượt lặp tối đa từ 10 đến 20 lượt là một ngưỡng trần phổ biến, hoặc có thể chấm dứt dựa trên mức tiêu hao Token. Ranh giới này dùng để ngăn chặn phán đoán sai lầm đẩy nhiệm vụ vào vòng lặp vô tận.

Ngữ cảnh sẽ liên tục dài thêm sau mỗi lượt kết quả. Khi thông tin then chốt bị pha loãng, mô hình sẽ càng dễ đi chệch hướng. Context Engineering xử lý chính bài toán chọn lọc và tổ chức các thông tin này. Dù lớp vỏ đóng gói của LangChain, LlamaIndex hay Spring AI có khác nhau, bản chất bên dưới đều không tách rời Agent Loop này.

### Để xây dựng một hệ thống Agent, tối thiểu cần giải quyết 3 tầng nào?

Code kết nối với mô hình thường được gom vào tầng **LLM Call**: tại đây xử lý sự khác biệt giữa các API như OpenAI, Anthropic, Hugging Face, cũng như streaming output, cắt ngắn Token và cơ chế thử lại.

Tầng **Tools Call** chịu trách nhiệm kết nối Function Calling, MCP, Skills, cùng với việc đọc ghi file, tìm kiếm web, sandbox thực thi code và API bên thứ ba cho mô hình. Năng lực bên ngoài có khả dụng hay không, trả về định dạng gì, đều sẽ ảnh hưởng đến quyết định của lượt tiếp theo.

Prompt, bộ nhớ động, trạng thái phiên và mô tả công cụ truyền cho mô hình sẽ do tầng **Context Engineering** tổ chức. Khi ngữ cảnh thiếu thông tin nhiệm vụ cần hoặc bị lẫn quá nhiều nội dung rác, ngay cả khi bản thân mô hình có đủ năng lực thì nhiệm vụ cũng có thể không tiến triển được.

## Đăng ký và gọi Tools tuân theo định dạng chuẩn nào?

Để Agent gọi chính xác công cụ bên ngoài, không thể tách rời hai yếu tố: OpenAI Schema và MCP.

OpenAI Schema giải quyết bài toán định dạng dữ liệu, còn MCP giải quyết bài toán giao thức kết nối truyền thông.

### Định dạng dữ liệu: Function Calling Schema

Công cụ bên ngoài có thể rất phức tạp, nhưng khi suy luận LLM chỉ nhận biết các mô tả có cấu trúc.

Hiện tại các định dạng dữ liệu chủ lưu về cơ bản đều hướng theo OpenAI Function Calling Schema. Các hãng như Anthropic, Google cũng đều hỗ trợ hình thức tương tự.

Nó sử dụng JSON Schema để mô tả tên công cụ, công dụng, kiểu tham số và các trường bắt buộc. Mô hình dựa vào phần mô tả này để phán đoán xem có nên gọi công cụ hay không và điền tham số ra sao.

Lấy ví dụ một công cụ quen thuộc của kỹ sư dữ liệu: truy vấn log slow SQL.

```json
{
  "type": "function",
  "function": {
    "name": "query_slow_sql",
    "description": "Tra cứu nhật ký slow SQL của microservice chỉ định trong khoảng thời gian cụ thể. Dùng công cụ này khi dịch vụ phản hồi chậm, cơ sở dữ liệu timeout hoặc CPU tăng vọt. Không gọi nếu người dùng hỏi về vấn đề mạng hoặc bộ nhớ.",
    "parameters": {
      "type": "object",
      "properties": {
        "service_name": {
          "type": "string",
          "description": "Tên service, ví dụ user-service, order-service"
        },
        "time_range": {
          "type": "string",
          "description": "Khoảng thời gian, định dạng HH:MM-HH:MM, ví dụ 09:00-09:30"
        },
        "threshold_ms": {
          "type": "integer",
          "description": "Ngưỡng xác định slow SQL (mili-giây), mặc định 1000"
        }
      },
      "required": ["service_name", "time_range"]
    }
  }
}
```

Mô tả công cụ viết tốt hay không sẽ trực tiếp ảnh hưởng đến phán đoán của Agent.

Việc mô hình có gọi công cụ hay không và điền tham số thế nào phụ thuộc chủ yếu vào trường `description`. Trong mô tả nên nêu rõ cả điều kiện áp dụng lẫn điều kiện không áp dụng. Ví dụ công cụ tra cứu slow SQL loại trừ rõ ràng các vấn đề về mạng và bộ nhớ, mô hình sẽ không gọi nó khi hướng điều tra không khớp.

### Đóng gói nâng cao: Skills

Một lần điều tra truy vấn chậm thường đòi hỏi đọc log theo trình tự, chạy script phân tích, rồi tổ chức khuyến nghị theo quy chuẩn của team. Nếu lần nào cũng để Agent tự lập kế hoạch tạm thời thì các bước và đầu ra đều khó tái sử dụng ổn định.

Skill dùng một file chỉ thị có thể nạp theo nhu cầu để lưu giữ trình tự chuỗi thực thi này, kèm theo điều kiện ràng buộc và các bài học kinh nghiệm xử lý lỗi. Môi trường host chỉ đưa nội dung liên quan vào ngữ cảnh sau khi xác định nhiệm vụ phù hợp.

Có hai phương thức đóng gói phổ biến:

**Toolkits truyền thống (hộp đen)** kết hợp nhiều công cụ nguyên tử thành một công cụ bậc cao trong code, bên ngoài chỉ để lộ JSON Schema, LLM không nhìn thấy đường dẫn bên trong. Cách này phù hợp với các kịch bản logic cố định, cần giảm bớt các bước suy luận và tiết kiệm Token.

Khi cần xem lộ trình thực thi, **Agent Skills (hộp trắng)** thường dùng file `SKILL.md` làm điểm nhập môn, dùng ngôn ngữ tự nhiên để diễn đạt chỉ thị nhiệm vụ. Một Skill thường là một thư mục độc lập:

```text
.claude/skills/code-reviewer/
├── SKILL.md          ← YAML frontmatter + chỉ thị chi tiết
├── scripts/xxx.py    ← Tùy chọn: script đi kèm
└── reference.md      ← Tùy chọn: tài liệu tham khảo
```

Phần metadata nhẹ ở đầu `SKILL.md` phục vụ việc khám phá (discovery), giải thích công dụng và điều kiện kích hoạt của Skill; phần thân ghi lại quy trình, ràng buộc và ví dụ. Môi trường host đọc metadata trước, khi mô hình phán đoán thấy cần thiết mới nạp toàn bộ phần thân—cơ chế nạp trễ (lazy-loading) này chính là điểm khác biệt mấu chốt giữa Agent Skills và Toolkits truyền thống.

Các công cụ như Claude Code, Cursor sẽ quét thư mục `.claude/skills/` trong dự án và để mô hình quyết định có kích hoạt một Skill hay không. Khi đường dẫn gọi là cố định thì dùng Toolkits; khi cần đúc kết kinh nghiệm của team nhưng vẫn muốn giữ độ linh hoạt cho quy trình thì Agent Skills phù hợp hơn. Thiết kế định tuyến, cách viết `SKILL.md` và kiểm toán bảo mật Skill của bên thứ ba xem tại: [Phân tích chuyên sâu về Agent Skills](https://javaguide.cn/ai/agent/skills.html).

### Giao thức kết nối truyền thông: MCP

Function Calling Schema mô tả tên, tham số và công dụng của công cụ, trong khi MCP quy định cách thức công cụ kết nối vào chương trình host; hai bên giải quyết hai bài toán khác nhau.

Anthropic giới thiệu giao thức MCP vào tháng 11 năm 2024. Nỗi đau mà nó giải quyết rất trực diện: trước đây lập trình viên phải tự tay duy trì hàng đống ánh xạ trong code, ví dụ:

Tên công cụ → Hàm thực thi thực tế + mô tả JSON Schema

Cứ tích hợp một công cụ mới là phải viết hàng đống code keo (glue code). Càng nhiều công cụ, bảo trì càng cực nhọc.

MCP cung cấp một bộ giao thức truyền thông thống nhất dựa trên JSON-RPC 2.0, thường được ví như "cổng USB-C" trong lĩnh vực AI. Hệ thống bên ngoài cung cấp năng lực thông qua MCP Server, chương trình host sau khi kết nối vào Server là có thể tự động khám phá và đăng ký công cụ.

![Sơ đồ minh họa MCP](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

Nhờ vậy ứng dụng AI và mã nguồn bên ngoài bên dưới được phân tách hoàn toàn (decouple).

MCP định nghĩa ba loại nguyên ngữ (primitives) tiêu chuẩn:

| Loại nguyên ngữ | Vai trò | Ví dụ |
| --- | --- | --- |
| Tools | Hàm do LLM chủ động gọi | Truy vấn cơ sở dữ liệu, gửi email, thực thi code |
| Resources | Dữ liệu chỉ đọc được Agent nạp theo nhu cầu | File cục bộ, bản ghi database, luồng log |
| Prompts | Template câu lệnh gợi ý có thể tái sử dụng | Template review code, template báo cáo sự cố |

Điểm dễ gây nhầm lẫn ở đây là: khi MCP Server công khai công cụ ra bên ngoài, bên trong nó vẫn dùng JSON Schema để mô tả đặc tả tham số.

JSON Schema là định dạng dữ liệu, còn MCP là tầng giao thức truyền thông.

## Prompt Engineering là gì?

Prompt là chỉ thị và ngữ cảnh cung cấp cho mô hình ngôn ngữ lớn. Prompt Engineering giải quyết các bài toán về ranh giới nhiệm vụ, định dạng đầu ra và các điều kiện ràng buộc: khi thiếu những thông tin này, mô hình buộc phải tự suy đoán; khi điều kiện rõ ràng, đầu ra mới có căn cứ ổn định. Phương pháp chi tiết xem tại: [Prompt Engineering cho mô hình lớn](https://javaguide.cn/ai/agent/prompt-engineering.html).

## Context Engineering là gì?

Khi ngữ cảnh bị lẫn quá nhiều thông tin rác không liên quan, ngay cả khi mô hình có đủ năng lực tương ứng thì hiệu quả nhiệm vụ vẫn bị suy giảm.

Việc mà Context Engineering làm là đưa thông tin hữu ích nhất vào cho mô hình trong cửa sổ Token hữu hạn và chặn đứng các tạp âm bên ngoài. Khái niệm này rất dễ bị đánh đồng với Prompt Engineering.

Prompt Engineering thiên về cách viết câu lệnh gợi ý, còn Context Engineering quản lý phạm vi rộng hơn nhiều, bao gồm quy tắc, bộ nhớ, mô tả công cụ, trạng thái phiên, kết quả quan sát bên ngoài và ngân sách Token (Token budget).

![Khác biệt giữa Context Engineering và Prompt Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-context-engineering-dimen-10eadd1a.png)

Nội dung phần này khi triển khai rất sâu rộng, bạn có thể xem riêng hai bài viết này: [Prompt Engineering cho mô hình lớn](https://javaguide.cn/ai/agent/prompt-engineering.html) và [Context Engineering](https://javaguide.cn/ai/agent/context-engineering.html).

## Các mô hình mẫu (paradigm) cốt lõi của Agent là gì?

### ReAct

ReAct là viết tắt của Reasoning + Acting, do Shunyu Yao và các cộng sự đề xuất năm 2022 trong bài báo [ReAct: Synergizing Reasoning and Acting in Language Models](https://react-lm.github.io/).

Các module Agent trong những framework như LangChain, LlamaIndex, AgentScope đều in đậm dấu ấn của mô hình này.

Tư duy của nó rất trực quan: mô hình suy luận một bước, nhận phản hồi từ môi trường bên ngoài, rồi tiếp tục suy luận bước tiếp theo, luân phiên lặp lại.

Bản thân LLM thường thiếu thông tin thời gian thực và dễ bị ảo giác. ReAct cho phép nó "đi một bước nhìn một bước", mỗi bước đều căn cứ vào kết quả trả về từ công cụ để tiếp tục phán đoán.

![ReAct-LLM](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/ReAct-LLM-a5126f80.png)

Ví dụ với nhiệm vụ: Hãy giúp tôi điều tra nguyên nhân giao diện `user-service` bị chậm sáng nay và gửi kết quả cho người phụ trách.

ReAct khi chạy sẽ diễn ra đại khái như sau:

Đầu tiên, nó kiểm tra metrics sáng nay của `user-service`, phát hiện từ 9:00 đến 9:30 CPU tăng vọt lên 98%, đồng thời có hàng loạt cảnh báo slow SQL.

Sau đó men theo manh mối này để tra log, lôi câu lệnh slow SQL đó ra, phát hiện đó là một câu truy vấn quét toàn bảng (full table scan) không ăn index.

Tiếp theo tra cứu người phụ trách dịch vụ, tìm trong danh bạ thấy anh Vương Kiến Quốc với email `wangjianguo@company.com`.

Cuối cùng soạn báo cáo điều tra và gửi email thông báo.

Quy trình này không được viết cứng ngay từ đầu. Nếu metrics hiển thị là tràn bộ nhớ OOM, bước thứ hai sẽ phải đi kiểm tra Heap Dump chứ không phải tiếp tục lật tìm slow SQL.

Giá trị của ReAct nằm ở điểm này: nó có thể liên tục điều chỉnh phương hướng dựa vào bằng chứng thu được.

Khi triển khai ReAct vào thực tế thường cần sự phối hợp của các thành phần sau:

1. Ngữ cảnh lịch sử: lưu lại các bước suy luận, hành động đã thực thi, quan sát phản hồi.
2. Dữ liệu đầu vào môi trường thời gian thực: ví dụ cảnh báo hệ thống, phản hồi người dùng...
3. Module suy luận LLM: chịu trách nhiệm phân tích logic và lập kế hoạch bước tiếp theo.
4. Tập công cụ và kho kỹ năng: bao gồm các công cụ nguyên tử và Skills.
5. Cơ chế quan sát phản hồi: thu thập phản hồi của công cụ và nối ngược lại vào ngữ cảnh.

![Quy trình mô hình ReAct](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-react-flow-06e50bf7.png)

Mỗi bước của ReAct đều được thúc đẩy bởi kết quả quan sát bên ngoài, do đó so với việc sinh ra kết quả một lần, nó dễ dàng truy vết căn cứ quyết định hơn và giảm thiểu các phán đoán thoát ly khỏi môi trường thực tế. Đổi lại, việc gọi qua nhiều lượt sẽ làm tăng độ trễ phản hồi, và hiệu quả phụ thuộc lớn vào độ tin cậy của các công cụ và Skills.

Ví dụ, việc kiểm tra metrics, tra log, phân tích điểm nghẽn có thể đóng gói thành một Skill `diagnose_service_performance` trả về bản tóm tắt chẩn đoán có cấu trúc cho LLM. Nhờ đó không cần phải kết hợp lại từ các bước nguyên tử trong mỗi lần xử lý sự cố.

### Plan-and-Execute

Đội ngũ LangChain đề xuất Plan-and-Execute vào năm 2023: trước tiên LLM sinh ra một kế hoạch toàn cục gồm nhiều bước, sau đó bàn giao cho bộ thực thi hoàn thành từng mục một. Các tác vụ dài có nhiều bước và quan hệ phụ thuộc rõ ràng khi sử dụng phương thức này sẽ dễ dàng duy trì tiến độ toàn cục hơn.

Tuy nhiên kế hoạch cũng chính là ranh giới của nó. Trong quá trình thực thi nếu xuất hiện kết quả ngoài dự kiến, khả năng điều chỉnh động và chịu lỗi của nó sẽ yếu hơn ReAct (vốn vừa làm vừa phán đoán), và hành vi sẽ tiệm cận với một workflow tĩnh.

Hai mô hình này có thể lồng vào nhau: dùng CoT để vạch ra các bước lớn toàn cục, bên trong mỗi bước chạy một vòng lặp con ReAct. Kế hoạch cung cấp cấu trúc khung xương, còn vòng lặp con xử lý những bất định mang tính cục bộ.

### Reflection

Reflection (Phản tư) thông qua phản hồi bằng ngôn ngữ tự nhiên để điều chỉnh hành vi của Agent mà không cần tinh chỉnh trọng số mô hình. Các triển khai phổ biến xử lý ở các giai đoạn khác nhau:

- Reflexion ghi nhận các kết luận tự phản tư vào bộ đệm bộ nhớ sau khi nhiệm vụ thất bại. Ví dụ khi debug code phát hiện biến `count` chưa được khởi tạo trước khi gọi, lượt tiếp theo có thể căn cứ vào đó để né tránh lỗi này.
- Self-Refine cho phép mô hình tự rà soát lại đầu ra sau khi hoàn thành câu trả lời, đoạn code hoặc bài viết, sau đó mới tiến hành sửa đổi lặp lại.
- CRITIC nhờ các công cụ bên ngoài như công cụ tìm kiếm, sandbox chạy code để xác thực tính xác thực của thông tin, rồi sửa đổi dựa trên kết quả xác thực.

Reflection thường được xếp chồng lên ReAct hoặc Plan-and-Execute: đưa thêm khâu kiểm tra và điều chỉnh vào quá trình thực thi, còn nhiệm vụ cụ thể vẫn do cơ chế thực thi ban đầu hoàn thành.

### Multi-Agent

Khi nhiệm vụ có thể phân tách thành các trách nhiệm tương đối độc lập như lập kế hoạch, thực thi, nghiệm thu, ta có thể giao cho nhiều Agent phối hợp hoàn thành. **Mô hình Orchestrator-Subagent** sử dụng Agent điều phối để lập kế hoạch tổng thể, phân phát nhiệm vụ; các Sub-agent thực thi song song hoặc tuần tự, sau đó tầng điều phối tổng hợp kết quả.

Khi cần tranh luận, bình duyệt hoặc kiểm chứng chéo lẫn nhau, có thể áp dụng **Mô hình Peer-to-Peer**, trong đó các Agent có vị thế ngang hàng trực tiếp đối thoại và rà soát lẫn nhau.

![Kiến trúc hệ thống Multi-Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-multi-agent-arch-f7551234.png)

Khi nhiệm vụ thực sự có thể phân chia theo vai trò chuyên môn, Multi-Agent có thể thực thi song song, và một nhiệm vụ con thất bại chưa chắc đã làm gián đoạn toàn bộ quy trình. Cái giá phải trả là chi phí giao tiếp, điều phối và gỡ lỗi giữa các Agent đều tăng cao, đồng thời lượng Token tiêu thụ cũng đội lên đáng kể.

Khi triển khai thực tế còn phải xử lý hợp đồng nhiệm vụ, trạng thái chia sẻ, xung đột ghi đồng thời, tiếp quản Worker và khôi phục điểm kiểm tra (checkpoint recovery). Chi tiết thiết kế xem tại [Thiết kế hệ thống đa Agent phối hợp: Phân chia nhiệm vụ, chia sẻ trạng thái, xử lý xung đột và khôi phục khi lỗi](./multi-agent.md).

### Hợp đồng nhiệm vụ có cấu trúc

Khi nâng cấp từ Agent đơn lẻ lên Multi-Agent, việc các Agent giao tiếp với nhau thế nào sẽ trở thành một bài toán kỹ thuật lớn.

Nếu vẫn dựa vào ngôn ngữ tự nhiên để trò chuyện qua lại, Token tiêu tốn sẽ rất cao và rất dễ xảy ra lỗi parse định dạng.

Hợp đồng nhiệm vụ có cấu trúc (Structured Task Contracts) giúp giảm thiểu những vấn đề bàn giao này.

Nó đòi hỏi các vai trò phải bàn giao kết quả kèm Schema chặt chẽ thay vì một đoạn văn bản tự nhiên, ví dụ dùng JSON, XML để biểu đạt các trường nhiệm vụ, kết quả và chỉ thị chuyển đổi trạng thái.

Tương tự, các microservice ở tầng backend không trao đổi dữ liệu bằng cách phân tích trang HTML, mà truyền các đối tượng có cấu trúc qua giao diện RESTful hoặc RPC.

Hợp đồng nhiệm vụ có cấu trúc xác định rõ mỗi vai trò nhận vào cái gì, bàn giao cái gì và kiểm tra kết quả ra sao.

Chẳng hạn "Product Manager Agent" sau khi viết xong tài liệu yêu cầu sẽ không chỉ đưa ra một câu "Tôi viết xong rồi, bạn hãy phát triển đi". Thay vào đó, nó phải xuất ra một JSON Payload chuẩn chứa `TaskID`, `Dependencies`, `AcceptanceCriteria`. Developer Agent sau khi nhận được chỉ việc deserialize trực tiếp và bước vào quy trình thực thi.

Việc bàn giao có cấu trúc này không đồng nghĩa với việc đã hiện thực hóa giao thức A2A hoàn chỉnh; việc khám phá năng lực, trạng thái nhiệm vụ và bàn giao sản phẩm giữa các Agent liên tiến trình xem tại [Mục A2A trong bài viết Multi-Agent](./multi-agent.md#a2a-能解决什么-不能解决什么).

![Kiến trúc giao thức A2A](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-a2a-f065a1d9.png)

### Agentic Workflows

Agentic Workflows là khái niệm được Giáo sư Andrew Ng tích cực khởi xướng, nhấn mạnh việc dùng khả năng điều phối kỹ thuật để kết nối suy luận, công cụ, bộ nhớ, phản tư và cộng tác đa thực thể thành quy trình có thể thực thi, thay vì chỉ ngồi chờ đợi sự cải thiện năng lực từ mô hình nền tảng bên dưới.

![Các mẫu hình cốt lõi của Agentic Workflows](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-agentic-workflows-b6f6e106.png)

Các mẫu thiết kế phổ biến bao gồm:

1. Reflection—cho phép mô hình tự kiểm tra kết quả công việc của mình.
2. Tool Use—trang bị cho LLM các công cụ như tìm kiếm web, thực thi code...
3. Planning—yêu cầu mô hình đưa ra kế hoạch nhiều bước và thực thi.
4. Multi-agent Collaboration—nhiều Agent phối hợp để hoàn thành nhiệm vụ.

Các mẫu hình này trong dự án thực tế thường xuất hiện kết hợp với nhau. Ví dụ trước tiên dùng Planning để chia nhỏ nhiệm vụ, trong nhiệm vụ con chạy ReAct và gọi Tools, cuối cùng dùng Reflection để kiểm tra kết quả. Agentic Workflows mô tả phương thức kết hợp này chứ không đại diện cho một framework đơn lẻ nào.

## Mối quan hệ giữa AI Workflow và Agent thực chất là gì?

Trong các quy trình như "tạo bản thảo ban đầu → duyệt chất lượng → chỉnh sửa theo phản hồi", thứ tự các bước và điều kiện thử lại có thể viết trước vào cấu trúc đồ thị; LLM chỉ thực hiện sinh nội dung hoặc phán đoán tại một node nhất định. Một AI Workflow như vậy có thể định vị vấn đề chính xác đến từng node và từng cạnh.

Agent thuần túy thì ngược lại: LLM trong quá trình chạy sẽ quyết định có gọi công cụ hay không, gọi công cụ nào và lộ trình tiếp theo ra sao. Nó phù hợp với những nhiệm vụ mà việc tra cứu cái gì, tra như thế nào hoàn toàn phụ thuộc vào bằng chứng trung gian.

Agentic Workflows đặt cả hai phương thức vào cùng một mạch: dùng Workflow toàn cục để cố định quy trình chính, và chỉ nhúng các vòng lặp con của Agent vào những vị trí cục bộ có lộ trình bất định.

### Node, Edge, State trong Workflow là gì?

Khi workflow chạy, Node (nút) chịu trách nhiệm thực thi, Edge (cạnh) quyết định luồng điều khiển, còn State (trạng thái) chia sẻ ngữ cảnh giữa các nút; cả ba hợp thành một đồ thị có hướng (Directed Graph).

Node chỉ làm một việc duy nhất: đọc trạng thái, thực thi logic, ghi lại kết quả. Trong node có thể gọi LLM, có thể gọi công cụ hoặc chỉ là logic code thuần túy. Trong kịch bản viết bài, các node điển hình là "Tạo bản thảo", "Duyệt chất lượng", "Chỉnh sửa theo phản hồi". Trách nhiệm của node càng đơn nhất, việc dò lỗi càng dễ dàng. Edge quyết định thực thi xong sẽ nhảy tới đâu—cạnh tuần tự đi theo lộ trình cố định, cạnh điều kiện rẽ nhánh theo trạng thái runtime, cạnh vòng lặp đưa luồng quay lại node trước để thử lại. State ghi nhận những thứ như bản thảo hiện tại, điểm số, số lần thử lại; việc rẽ nhánh của cạnh điều kiện thường dựa vào các giá trị trong State để phán đoán.

"Duyệt không đạt thì quay lại sửa, thử lại tối đa 3 lần", khi dịch sang cấu trúc đồ thị sẽ là một cạnh điều kiện từ `ReviewNode` trỏ tới `ReviseNode`, cộng thêm một ranh giới an toàn nhảy sang `ExitNode` khi `iteration_count >= 3`. Biến `iteration_count` trong State chính là cơ chế mấu chốt để logic này có thể chạy được.

Cấu trúc đồ thị này dễ mở rộng hơn nhiều so với chuỗi `if-else` viết cứng, và khi có sự cố cũng rất dễ định vị xem lỗi ở node nào, cạnh nào. LangGraph (Python) và Spring AI Alibaba Graph (Java) đều được hiện thực hóa dựa trên tư duy này. Chi tiết thiết kế và triển khai code xem tại: [Workflow, Graph và Loop trong AI Workflow](https://javaguide.cn/ai/agent/workflow-graph-loop.html).

### Khi nào dùng Agent, khi nào dùng Workflow?

Lộ trình thực thi có thể xác định trước hay không là tiêu chí phán đoán đơn giản nhất:

Xác định được: dùng Workflow. Không xác định được: dùng Agent. Có cả hai: dùng Agentic Workflows.

Tuy nhiên có một sai lệch nhận thức phổ biến: nhiều người cảm thấy nhiệm vụ "lộ trình không xác định", nhưng thực chất là do chưa bóc tách rõ yêu cầu. Sau khi bóc tách kỹ càng nhiệm vụ, thông thường sẽ nhận ra phần lớn kịch bản chỉ là "LLM thực hiện sinh nội dung hoặc phán đoán trong các node cố định", trường hợp này dùng Workflow sẽ ổn định hơn và dễ điều tra sự cố hơn nhiều.

Nhiệm vụ thực sự phù hợp với Agent thuần túy là những kịch bản mà bạn không thể viết trước các bước thực thi. Ví dụ: "Hãy giúp tôi xử lý sự cố online này"—phải kiểm tra cái gì, kiểm tra ra sao, kiểm tra đến mức độ nào đều rất khó quy định cứng từ trước.

Một chiều kích đánh giá khác là yêu cầu chịu lỗi. Workflow có lộ trình thực thi cố định, khi có lỗi rất dễ khoanh vùng; Agent có lộ trình thực thi động, độ khó khi debug cao hơn hẳn một bậc. Các kịch bản thương mại To B nên ưu tiên cân nhắc Workflow hoặc Agentic Workflows.

## Lựa chọn các mô hình như thế nào?

Phần trên đã điểm qua hàng loạt khái niệm như ReAct, Plan-and-Execute, Reflection, Multi-Agent, AI Workflow; khi bắt tay làm dự án rất dễ bị bối rối trước những lựa chọn này. Dưới đây là bảng tham khảo nhanh:

| Đặc trưng kịch bản | Hướng đề xuất | Cái giá phải trả |
| --- | --- | --- |
| Lộ trình thực thi xác định được từ trước, các node cần LLM | AI Workflow (Graph) | Ổn định, dễ quan sát, chi phí thiết kế ban đầu cao |
| Lộ trình thực thi không xác định, cần lập kế hoạch động | ReAct | Linh hoạt, tiêu tốn nhiều Token, khó debug |
| Nhiệm vụ rất dài, nhiều bước nhưng cấu trúc tổng thể rõ ràng | Plan-and-Execute | Khó bị lạc hướng, khả năng điều chỉnh động yếu |
| Yêu cầu chất lượng đầu ra cao, cho phép lặp lại nhiều vòng | Xếp chồng Reflection | Dùng phối hợp với ReAct/P&E, không dùng đơn lẻ |
| Nhiệm vụ bẩm sinh có thể chia cho nhiều vai trò chuyên môn | Multi-Agent | Chi phí giao tiếp và debug nhân đôi |
| Nhiệm vụ dài + một phần nhiệm vụ con không dự đoán trước được | Agentic Workflows | Workflow toàn cục + lồng ghép ReAct cục bộ |

Hãy chạy thông luồng trước bằng phương thức đơn giản nhất, sau đó căn cứ vào dạng thức thất bại thực tế để quyết định nâng cấp tầng nào.

Vừa bước vào đã vội vã làm Multi-Agent, phụ thuộc hoàn toàn vào khả năng suy luận động của mô hình và không quản lý ngữ cảnh chút nào, một khi đã sa lầy thì việc gỡ rối sẽ vô cùng gian nan.

## Tổng kết

Phần lớn các dự án Agent chạy không ổn định không phải do mô hình chưa đủ tốt.

Lý do là nền móng chưa vững. Trong 4 khối LLM + Planning + Memory + Tools, thiếu khối nào cũng sẽ để lại điểm yếu rõ rệt. Không có Tools, Agent chỉ dừng ở mức "cho lời khuyên"; không có Memory, nhiệm vụ chỉ hơi dài một chút là bắt đầu mất trí nhớ; không quản lý tốt ngữ cảnh, mô hình sẽ tùy tiện đi chệch hướng.

Việc chọn mô hình cũng rất dễ sai lầm. ReAct linh hoạt nhưng khó debug và đốt nhiều Token; Workflow ổn định nhưng đòi hỏi bóc tách yêu cầu rất cao, nếu thiết kế trước không thấu đáo thì sau này sửa đổi sẽ rất mệt mỏi; Multi-Agent khi đưa vào thì chi phí giao tiếp và debug rất dễ vượt ngoài dự tính. Vội vàng chọn phương án phức tạp nhất ngay từ đầu chính là cái bẫy phổ biến nhất trong thực tiễn kỹ thuật.

Còn một mảng rất dễ bị xem nhẹ: mô tả công cụ. MCP giải quyết phương thức kết nối, JSON Schema giải quyết định dạng mô tả, nhưng mô hình rốt cuộc có gọi công cụ đó hay không và điền tham số thế nào, sau cùng đều trông cậy vào vài câu chữ trong `description`. Tiết kiệm công sức ở khâu này, về sau sẽ phải trả giá gấp đôi.

Việc lựa chọn giữa Agent và Workflow thực ra không phức tạp đến thế: hãy thử viết lộ trình thực thi nhiệm vụ ra trước. Nếu viết ra được thì dùng Workflow; nếu không viết ra được mới dùng tới Agent. Làm tốt phán đoán này ngay từ đầu có ích hơn nhiều so với việc mải miết chạy theo các framework thời thượng.
