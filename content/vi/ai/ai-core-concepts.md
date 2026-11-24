---
title: "Tổng quan khái niệm cốt lõi AI: LLM, Agent, RAG, MCP và Thiết kế hệ thống"
description: "Tổng hợp các khái niệm cốt lõi trong chuyên đề AI của JavaGuide, xâu chuỗi Token, Function Calling, Agent Loop, MCP, Skills, Multi-Agent, Embedding, Rerank, Model Gateway, Đánh giá, Khả năng quan sát và Bảo mật theo 4 trục chính: Nền tảng LLM, Agent, RAG và Thiết kế hệ thống."
category: AI
tag:
  - AI
  - LLM
  - AI Agent
  - RAG
  - MCP
  - Thiết kế hệ thống AI
head:
  - - meta
    - name: keywords
      content: Khái niệm cốt lõi AI, Khái niệm cốt lõi LLM, LLM, Token, Agent, Agent Loop, ReAct, Plan-and-Execute, RAG, Embedding, MCP, Skills, Multi-Agent, Prompt Engineering, Context Engineering, Function Calling, Tool Calling, GraphRAG, LLM Gateway, Đánh giá AI, Khả năng quan sát AI, Prompt Injection, Voice Agent
lang: vi
sourceRef: zh-ref/ai/ai-core-concepts.md
---

Tại sao mỗi lần trả lời mô hình lại đưa ra kết quả không hoàn toàn giống nhau? Tại sao Agent lại cần vòng lặp? RAG đã truy xuất được tài liệu, tại sao vẫn có thể trả lời sai? Những câu hỏi này lần lượt nằm ở các khâu sinh nội dung của mô hình, thực thi tác vụ, truy xuất tri thức và quản trị ứng dụng.

Bài viết này tập hợp các khái niệm liên quan trong chuyên đề AI của JavaGuide. Việc triển khai cụ thể và các ca thực tế sẽ được trình bày chi tiết trong từng bài viết chuyên đề riêng biệt.

## Nền tảng LLM

Bài viết gốc liên quan:

- [Cơ chế vận hành của LLM: Token, context window và tham số lấy mẫu ảnh hưởng thế nào đến kết quả](./llm-basis/llm-operation-mechanism.md)
- [Thực tiễn kỹ thuật gọi API LLM: Phản hồi streaming, thử lại, giới hạn tốc độ và dữ liệu trả về có cấu trúc](./llm-basis/llm-api-engineering.md)
- [Kỹ thuật viết Prompt cho LLM (Prompt Engineering) là gì? Các mẹo viết Prompt](./agent/prompt-engineering.md)
- [Dữ liệu trả về có cấu trúc của LLM: Từ hợp đồng JSON đến triển khai Function Calling](./llm-basis/structured-output-function-calling.md)
- [Hệ thống đánh giá ứng dụng AI: Từ xây dựng Golden Set đến vòng lặp thử nghiệm canary trên production](./llm-basis/llm-evaluation.md)

### LLM

Khi bộ gõ bàn phím nhìn thấy cụm từ "Hôm nay thời tiết thật", nó có thể gợi ý từ "đẹp" vào danh sách từ ứng viên. Quá trình sinh văn bản của mô hình ngôn ngữ lớn tự hồi quy (Autoregressive LLM) cũng diễn ra tương tự: mô hình dựa vào ngữ cảnh hiện tại để dự đoán một Token tiếp theo, nối kết quả đó vào ngữ cảnh, rồi tiếp tục dự đoán Token kế tiếp, cho đến khi gặp ký hiệu kết thúc hoặc đạt giới hạn đầu ra. Quá trình này được gọi là **sinh tự hồi quy (Autoregressive Generation)**.

Trong một lượt sinh văn bản, Token là đơn vị văn bản mà mô hình xử lý và xuất ra theo từng bước; context window (cửa sổ ngữ cảnh) giới hạn tổng lượng Token mà một lượt gọi có thể chứa; các tham số như Temperature, Top-p ảnh hưởng đến việc lấy mẫu các Token ứng viên; và Max Tokens kiểm soát số lượng Token tối đa mà lượt sinh này được phép tạo ra.

### Token

Trước tiên, mô hình sử dụng Tokenizer để chia văn bản thành các đoạn có độ dài khác nhau. Ở đây không có quy tắc cố định "một chữ là một Token" hay "một từ là một Token": một từ tiếng Anh có thể bị tách ra, các từ tiếng Trung hay tiếng Việt cũng có thể bị tách thành nhiều Token, trong khi một số từ/cụm từ có tần suất xuất hiện cao lại có thể được gộp chung thành một Token.

Nếu tách từng ký tự một sẽ làm chuỗi trở nên quá dài, còn nếu tách theo toàn bộ từ thì bộ từ vựng (vocabulary) sẽ phình to khủng khiếp. Các **thuật toán tách từ phụ (subword tokenization)** như BPE (Byte Pair Encoding), Unigram ra đời để cân bằng giữa hai cách tiếp cận này: cố gắng giữ nguyên các đoạn có tần suất xuất hiện cao, và tiếp tục chia nhỏ các từ ít gặp. Kết quả phân tách cụ thể do Tokenizer của nhà cung cấp mô hình quyết định.

Khi lập kế hoạch dung lượng, bạn có thể ước tính sơ bộ theo kinh nghiệm, nhưng khi tính phí và giám sát hệ thống, bạn bắt buộc phải đọc trường `usage` thực tế được trả về từ API.

**Ví dụ về quá trình Token hóa**:

- Văn bản gốc: `你好，我是小 G。`
- Phân tách: `[你好]` `[，]` `[我是]` `[小 G]` `[。]`
- Thống kê: Văn bản gốc 9 ký tự → Số Token là 5 → Tỷ lệ nén khoảng 1.8 lần

![Ví dụ về quá trình Token hóa](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-token-process-f3c248b4.png)

Phép phân tách trên chỉ nhằm mục đích minh họa quy trình, không đại diện cho kết quả thực tế của một mô hình cụ thể nào. Các nhà cung cấp hoặc mô hình khác nhau sử dụng Tokenizer khác nhau, nên cùng một đoạn văn bản có thể cho ra chuỗi Token khác nhau.

### Context Window

**Context Window (Cửa sổ ngữ cảnh)** là "bộ nhớ làm việc" (Working Memory) của LLM. Nó quyết định lượng văn bản (tính theo đơn vị Token) mà mô hình có thể xử lý hoặc "ghi nhớ" tại bất kỳ thời điểm nào.

- Tính liên tục của hội thoại: Quyết định mô hình có thể duy trì cuộc trò chuyện nhiều lượt dài bao nhiêu mà không quên các chi tiết ở những lượt đầu.
- Năng lực xử lý trong một lượt: Quyết định độ lớn tối đa của tài liệu, kho mã nguồn (codebase) hoặc tập mẫu dữ liệu mà mô hình có thể xử lý trong một lần gọi.

Khái niệm "Mô hình hỗ trợ 128K/200K/1M" ám chỉ giới hạn tổng Token tối đa có thể đưa vào mô hình trong một lần gọi. Ở phần lớn các mô hình, context window bao gồm tổng của cả đầu vào và đầu ra, nhưng một số nhà cung cấp (như Google Gemini) lại đặt giới hạn riêng cho đầu vào và đầu ra. Vui lòng tra cứu tài liệu API cụ thể trước khi sử dụng.

Context window thường bị tiêu tốn bởi các chi phí ẩn:

![Cửa sổ ngữ cảnh (Context Window) = Bộ nhớ làm việc của LLM](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-context-window-e2089807.png)

- System Prompt: Các chỉ thị hệ thống điều chỉnh hành vi của mô hình (ẩn đối với người dùng nhưng vẫn chiếm dung lượng cửa sổ).
- User Prompt: Dữ liệu nghiệp vụ và câu lệnh của người dùng.
- Lịch sử hội thoại nhiều lượt: Bản ghi các tin nhắn trước đó.
- Đoạn trích xuất từ RAG: Thông tin bổ sung được truy xuất từ kho tri thức bên ngoài.
- Schema gọi công cụ: Định nghĩa hàm và cấu trúc tham số.
- Chi phí định dạng: Ký tự đặc biệt, dấu xuống dòng, định dạng Markdown...
- Token đầu ra do mô hình sinh: **Đầu ra cũng chiếm dung lượng context window**.

Tất cả các thành phần này cùng chia sẻ cửa sổ ngữ cảnh, do đó khoảng trống thực tế dành cho nội dung nghiệp vụ thường nhỏ hơn rất nhiều so với con số trần được công bố.

### Tham số lấy mẫu (Sampling Parameters)

Tại mỗi bước, mô hình sẽ chấm một điểm số (bên trong gọi là **logits**) cho **mọi** Token ứng viên trong bộ từ vựng. Điểm số càng cao chứng tỏ mô hình càng cho rằng từ đó nên xuất hiện ở vị trí này.

Lấy một ví dụ, giả sử mô hình đang hoàn thiện câu "Hôm nay thời tiết thật \_\_", nó có thể đưa ra điểm số như sau:

| Token ứng viên | Điểm số gốc (logit) |
| --- | --- |
| đẹp (好) | 5.0 |
| không tệ (不错) | 3.2 |
| tuyệt (棒) | 2.1 |
| tồi tệ (糟糕) | 0.5 |
| màu tím (紫色) | -8.0 |

Điểm số gốc không phải là xác suất. Chúng phải đi qua hàm **softmax** mới trở thành phân phối xác suất. Giả sử tập ứng viên chỉ gồm 5 mục trong bảng, kết quả tính toán xấp xỉ là:

| Token ứng viên | Xác suất |
| --- | --- |
| đẹp | 81.21% |
| không tệ | 13.42% |
| tuyệt | 4.47% |
| tồi tệ | 0.90% |
| màu tím | < 0.001% |

Sau đó, mô hình sẽ lấy mẫu dựa theo phân phối xác suất này để quyết định xuất ra Token nào.

Các tham số giải mã (Temperature, Top-p, Top-k...) chính là công cụ can thiệp vào quy trình "chấm điểm → tính xác suất → bốc thăm" này:

- Temperature: Điều chỉnh "độ dốc" của phân phối xác suất, làm cho các lựa chọn điểm cao nổi bật hơn, hoặc làm cho các lựa chọn trở nên đồng đều hơn.
- Top-p / Top-k: Cắt bỏ trực tiếp các phương án ứng viên kém khả thi, thu hẹp "hồ bốc thăm".
- Dòng tham số Penalty: Giảm điểm của các từ đã xuất hiện nhằm chống hiện tượng lặp từ ("máy phát lại").

![Tham số Temperature: Kiểm soát tính ngẫu nhiên trong đầu ra của mô hình](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-temperature-params-93a80dd5.png)

### Prompt

Prompt là câu chỉ thị tác vụ được truyền vào cho Large Language Model (LLM). LLM sinh ra các Token tiếp theo dựa trên ngữ cảnh hiện tại và thể hiện khả năng hiểu ngữ nghĩa cũng như tuân thủ chỉ thị nhất định; tuy nhiên, khi ranh giới tác vụ không rõ ràng, mô hình vẫn có thể đi chệch đề hoặc tự bịa ra thông tin không có thực.

Mục đích của Prompt là thu hẹp phạm vi sinh nội dung của mô hình; chất lượng không tỷ lệ thuận trực tiếp với độ dài. Thay vì xếp chồng các tính từ hoa mỹ, điều quan trọng hơn nhiều là trình bày rõ ràng 4 thông tin: Role, Task, Context và Format.

![Khung 4 yếu tố của Prompt](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/prompt-four-element-framework-4589e72c.svg)

| Yếu tố | Tác dụng | Cách diễn đạt phổ biến |
| --- | --- | --- |
| Role (Vai trò) | Cho mô hình biết nên dùng kiến thức và giọng điệu thuộc lĩnh vực nào | "Bạn là kiến trúc sư Java với 10 năm kinh nghiệm" |
| Task (Nhiệm vụ) | Nêu rõ cần thực hiện hành động gì | "Hãy review các vấn đề về hiệu năng trong đoạn mã sau" |
| Context (Ngữ cảnh) | Bổ sung bối cảnh liên quan đến nhiệm vụ | "Hiện tại QPS trên production là 2000, thời gian phản hồi vượt quá 500ms" |
| Format (Định dạng) | Quy định kết quả đầu ra trông như thế nào | "Xuất JSON gồm hai trường: bottleneck và solution" |

### Dữ liệu trả về có cấu trúc (Structured Output)

Trước tiên hãy xem một Prompt rất thường thấy:

```text
Hãy phân loại phản hồi của người dùng sau đây thuộc loại phiếu hỗ trợ nào, trả về JSON.

Phản hồi của người dùng: Tôi đã thanh toán thành công nhưng đơn hàng vẫn hiển thị là chờ thanh toán.
```

Mô hình có thể trả về:

```json
{
  "category": "payment",
  "priority": "high",
  "reason": "Người dùng thanh toán thành công nhưng trạng thái đơn hàng chưa được cập nhật"
}
```

Kết quả này con người có thể đọc hiểu được, nhưng chưa phải là một bản hợp đồng (contract) ổn định mà tầng backend có thể xử lý an toàn. Phía nghiệp vụ còn cần làm rõ các ranh giới:

- `category` chỉ được phép là `PAYMENT`, `LOGISTICS`, `AFTER_SALE`, hoặc `ACCOUNT`.
- `priority` chỉ được phép là `LOW`, `MEDIUM`, hoặc `HIGH`.
- `confidence` phải là số thập phân nằm trong khoảng từ `0` đến `1`.
- `reason` có được phép để trống không? Độ dài tối đa là bao nhiêu?
- Nếu đầu vào của người dùng thiếu thông tin, mô hình nên trả về `NEED_MORE_INFO` hay tiếp tục phán đoán mò?

Prompt bằng ngôn ngữ tự nhiên rất khó duy trì vững chắc các ranh giới này qua thời gian dài. Bạn cần phân biệt rõ vai trò của JSON Mode, JSON Schema và Structured Outputs:

- **JSON Mode** là một chế độ đầu ra, ràng buộc mô hình trả về một chuỗi JSON hợp lệ về mặt cú pháp.
- **JSON Schema** là quy chuẩn mô tả cấu trúc, dùng để định nghĩa JSON phải chứa những trường nào, kiểu dữ liệu của từng trường là gì, trường nào bắt buộc, giá trị enum gồm những gì, có cho phép các trường ngoài định nghĩa hay không.
- **Structured Outputs** là năng lực sinh có cấu trúc do nhà cung cấp mô hình cung cấp. Nó tiếp nhận JSON Schema hoặc Schema tương đương, ép mô hình tuân thủ chặt chẽ cấu trúc này ngay trong giai đoạn sinh Token.

JSON Schema đóng vai trò mô tả hợp đồng, còn Structured Outputs, Function Calling / Tool Calling là các năng lực API giúp áp đặt hợp đồng đó vào giai đoạn sinh. Nếu chỉ cung cấp văn bản Schema mà không có ràng buộc sinh tương ứng, mô hình vẫn có thể trả về nội dung không khớp với yêu cầu của các trường.

![Ba lớp ràng buộc trong giai đoạn sinh: JSON Mode quản lý cú pháp, JSON Schema quản lý hợp đồng, Structured Outputs đẩy việc kiểm soát hợp đồng về giai đoạn sinh của mô hình](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/structured-output-function-calling-three-layer-c-985e2251.png)

### Function Calling / Tool Calling

Khi mô hình trả về `query_order` cùng tham số `{"orderId": "1029384756"}`, hàm Java vẫn chưa hề được thực thi. Function Calling / Tool Calling chỉ giúp mô hình thể hiện ý định gọi hàm dưới dạng cấu trúc; chính dịch vụ backend, Agent Runtime, MCP Host hoặc môi trường do nhà cung cấp quản lý mới chịu trách nhiệm thực thi công cụ đó.

Một lượt gọi hoàn chỉnh bao gồm việc mô hình sinh ý định, nghiệp vụ kiểm tra tính hợp lệ, thực thi công cụ và điền ngược kết quả lại cho mô hình:

![Chuỗi gọi hoàn chỉnh của Function Calling: Mô hình chỉ sinh ý định gọi, việc thực thi công cụ thực sự diễn ra ở phía nghiệp vụ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/structured-output-function-calling-function-call-38a32aa6.png)

1. Phía server đăng ký tên công cụ, mục đích sử dụng và Schema tham số.
2. Người dùng yêu cầu: "Tra giúp tôi xem đơn hàng 1029384756 đã đến đâu rồi".
3. Mô hình chọn `query_order` và sinh tham số `{"orderId": "1029384756"}`.
4. Phía nghiệp vụ kiểm tra kiểu dữ liệu, các trường bắt buộc, quyền hạn người dùng, quyền sở hữu đơn hàng và khóa lũy kế (idempotency key).
5. Sau khi kiểm tra hợp lệ, phía nghiệp vụ mới gọi đến hệ thống đơn hàng, cơ sở dữ liệu hoặc HTTP API.
6. Kết quả công cụ kèm theo `tool_use_id` được nạp ngược lại cho mô hình. Anthropic yêu cầu `tool_use_id` phải khớp chính xác, Gemini 3 cũng sinh `id` duy nhất cho mỗi `functionCall`; khi gọi song song, việc thiếu ID tương ứng có thể làm ghép sai kết quả với yêu cầu công cụ.
7. Mô hình tổ chức câu trả lời cuối cùng dựa trên kết quả công cụ nhận được.

### Gọi LLM cấp độ Production

Một câu trả lời của mô hình mà người dùng nhìn thấy trên màn hình, phía sau đã phải trải qua xác thực nghiệp vụ, dựng ngữ cảnh, định tuyến mô hình, gọi nhà cung cấp, phân tích phản hồi và lưu kết quả vào cơ sở dữ liệu. Nếu một khâu bất kỳ thiếu ghi nhận trạng thái hoặc thiếu xử lý lỗi, giao diện người dùng thường chỉ nhận lại một thông báo chung chung: "Gọi mô hình thất bại".

Một hệ thống production tối thiểu phải ghi nhận 8 giai đoạn:

1. Xác thực danh tính người dùng, tenant (người thuê), gói cước, quyền hạn tính năng và kích thước request.
2. Dựng System Prompt, đầu vào của người dùng, lịch sử tin nhắn, bằng chứng RAG, Tool Schema và ràng buộc định dạng đầu ra.
3. Ước tính Token đầu vào và dự trù ngân sách đầu ra, cắt tỉa lịch sử hội thoại, nén ngữ cảnh hoặc chuyển đổi mô hình nếu cần thiết.
4. Lựa chọn mô hình, nhà cung cấp, cấu hình timeout, chiến lược thử lại (retry) và giới hạn tốc độ (rate limit) thông qua client thống nhất hoặc Model Gateway.
5. Gọi API của nhà cung cấp, tiếp nhận phản hồi đồng bộ hoặc phản hồi streaming qua SSE, WebSocket.
6. Phân tích văn bản gia tăng (delta text), lý do kết thúc (finish reason), gọi công cụ, lượng Token tiêu thụ, phản hồi từ chối và kết quả có cấu trúc.
7. Lưu câu trả lời, lượt thử gọi, chi phí, nguyên nhân lỗi và trạng thái nghiệp vụ.
8. Ghi nhận Trace, TTFT (Time-To-First-Token), tổng thời gian thực thi, số lần retry, tỷ lệ bị rate limit và tỷ lệ parse thất bại.

Khi retry, cần phân biệt rõ loại lỗi. Lỗi mạng chập chờn, một số mã lỗi 5xx của nhà cung cấp và lỗi quá tải có thể retry có giới hạn trong khoảng thời gian deadline tổng thể; lỗi tham số, lỗi xác thực quyền và từ chối do chính sách an toàn thì việc gửi lại nguyên vẹn request là vô nghĩa. Hễ có cơ chế retry, bạn bắt buộc phải thiết kế khóa lũy kế (idempotency key) và ghi nhận độc lập giữa tin nhắn nghiệp vụ, lượt thử gọi mô hình và request gửi đến nhà cung cấp, tránh sinh câu trả lời trùng lặp hoặc thực thi lặp lại các công cụ có hiệu ứng phụ (side effect).

### Đánh giá ứng dụng AI (AI Application Evaluation)

Các Benchmark công khai chỉ có tác dụng sàng lọc những mô hình rõ ràng không phù hợp, chứ không thể thay thế cho việc xác thực trên nghiệp vụ thực tế. Request thực tế luôn chứa từ viết sai chính tả, tiếng lóng, ảnh chụp màn hình, đa ngôn ngữ và các mâu thuẫn trước sau; một vài luồng xử lý rủi ro cao cũng có thể bị che giấu bởi điểm số trung bình.

Đánh giá nghiệp vụ thường bắt đầu từ một Golden Set. Mỗi ca kiểm thử (test case) cần bao gồm đầu vào, kết quả mong đợi hoặc tiêu chuẩn thành công, nhãn kịch bản và phương thức chấm điểm. RAG cần đánh giá riêng biệt giữa khâu truy xuất (retrieval) và sinh nội dung (generation); Agent ngoài câu trả lời cuối cùng còn phải kiểm tra việc chọn công cụ, tham số truyền vào, quỹ đạo thực thi (trajectory) và trạng thái thực tế của hệ thống bên ngoài.

Các phương pháp chấm điểm thông dụng có phân công riêng:

| Phương pháp | Phù hợp kiểm tra nội dung gì | Hạn chế chính |
| --- | --- | --- |
| Đánh giá theo quy tắc (Rule-based) | Định dạng JSON, tính đầy đủ của trường, giá trị enum, ranh giới số học, kết quả test suite | Chỉ bao quát được những điều kiện có thể mã hóa rõ ràng |
| LLM-as-Judge | Độ liên quan, độ trung thực (faithfulness), tính đầy đủ, độ mạch lạc và giọng điệu | Tồn tại thiên kiến vị trí, thiên kiến độ dài |
| Đánh giá thủ công (Human Eval) | Mẫu có độ rủi ro cao, ngữ nghĩa phức tạp và kết quả gây tranh cãi | Tốc độ chậm, chi phí cao, khó kiểm soát tính nhất quán |

Một quy trình đánh giá bền vững sẽ liên kết đánh giá offline, phát lại Trace (Trace replay) trên production và phát hành thử nghiệm canary trên môi trường thật: giai đoạn phát triển dùng bộ dữ liệu cố định để so sánh phiên bản, trước khi release thì phát lại các quỹ đạo thực tế, sau khi lên production thì tiếp tục bổ sung mẫu từ các ca thất bại (badcase) và phản hồi của người dùng. Prompt, mô hình, chiến lược truy xuất, phiên bản công cụ và kết quả đánh giá bắt buộc phải được liên kết với nhau, nếu không khi điểm số biến động bạn sẽ không thể tìm ra nguyên nhân.

## Agent

Bài viết gốc liên quan:

- [Khái niệm cốt lõi về AI Agent: Agent Loop, Plan-and-Execute, A2A, Agentic Workflows, Đăng ký Tools](./agent/agent-basis.md)
- [Workflow, Graph và Loop trong luồng công việc AI: Từ khái niệm đến triển khai](./agent/workflow-graph-loop.md)
- [Context Engineering là gì? Khác biệt gì so với Prompt Engineering?](./agent/context-engineering.md)
- [Hệ thống bộ nhớ của AI Agent: Bộ nhớ ngắn hạn, bộ nhớ dài hạn và cơ chế tiến hóa bộ nhớ](./agent/agent-memory.md)
- [Thiết kế hệ thống cộng tác Multi-Agent: Phân tách tác vụ, chia sẻ trạng thái, xử lý xung đột và phục hồi sự cố](./agent/multi-agent.md)
- [Model Context Protocol (MCP) là gì? Mối quan hệ với Function Calling và Agent](./agent/mcp.md)
- [Agent Skills là gì? Khác biệt bản chất gì so với Prompt và MCP?](./agent/skills.md)
- [Harness Engineering: Khung kiểm tra 6 tầng, quản lý ngữ cảnh và thực tiễn kỹ thuật](./agent/harness-engineering.md)
- [Loop Engineering là gì? Tại sao nói đây là "bình mới rượu cũ"?](./agent/loop-engineering.md)

### Agent là gì?

Một lượt gọi mô hình thông thường sẽ kết thúc ngay sau khi sinh ra một đoạn văn bản. Còn Agent Runtime sẽ tiếp tục kiểm tra xem mô hình có đưa ra yêu cầu gọi công cụ hay không, thực thi công cụ đó, ghi kết quả trở lại ngữ cảnh, rồi tiếp tục để mô hình quyết định bước tiếp theo. Do đó, việc triển khai Agent trong các framework như LangChain thường xoay quanh một vòng lặp.

Hệ thống này thường được biểu diễn theo công thức: **Agent = LLM + Planning + Memory + Tools**. LLM đảm nhận việc hiểu nhiệm vụ và ra quyết định, Planning quản lý các bước và phụ thuộc, Memory lưu trữ trạng thái hiện tại hoặc thông tin lịch sử, còn Tools kết nối tới cơ sở dữ liệu, API, hệ thống tệp và môi trường thực thi mã.

![Kiến trúc cốt lõi của AI Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-core-arch-dc0d3123.png)

Bộ nhớ ngắn hạn thường lưu giữ phiên làm việc hiện tại và trạng thái tác vụ, trong khi bộ nhớ dài hạn chịu trách nhiệm tái sử dụng sở thích người dùng, quyết định lịch sử hoặc kinh nghiệm tác vụ qua nhiều phiên làm việc khác nhau. Giá trị trả về từ việc thực thi công cụ được gọi là Observation (quan sát); runtime sẽ nối nó vào ngữ cảnh để mô hình có thể tiếp tục phán đoán dựa trên kết quả thực tế.

### Agent Loop

Agent Loop kết nối việc ra quyết định của mô hình và việc thực thi công cụ thành một vòng phản hồi liên tục. Mỗi lượt lặp đọc ngữ cảnh hiện tại, mô hình chọn trả lời trực tiếp hoặc gọi công cụ; runtime thực thi hành động và lưu kết quả, sau đó bước sang lượt tiếp theo.

![Quy trình làm việc của Agent Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-loop-flow-27c47f02.png)

1. Khởi tạo System Prompt, danh sách công cụ và yêu cầu của người dùng.
2. Mô hình đọc ngữ cảnh, trả về văn bản hoặc ý định gọi công cụ.
3. Runtime thực thi công cụ, ghi kết quả và trạng thái trở lại ngữ cảnh.
4. Kết thúc khi mô hình không còn gọi công cụ nữa; hoặc bị runtime cưỡng chế dừng lại khi chạm trần số lượt lặp, Token, thời gian hoặc chi phí.

Bản thân cơ chế vòng lặp không phức tạp. Khi thời gian thực hiện tác vụ kéo dài, tin nhắn lịch sử, kết quả công cụ và trạng thái trung gian sẽ liên tục chiếm dụng không gian ngữ cảnh, các ràng buộc ban đầu cũng dễ bị pha loãng bởi nội dung phía sau. Context Engineering chịu trách nhiệm quyết định thông tin nào được giữ lại, khi nào cần nén và lượt tiếp theo thực sự cần thấy những gì.

### ReAct

ReAct là viết tắt của Reasoning + Acting, do Shunyu Yao và các cộng sự đề xuất vào năm 2022 trong bài báo [*ReAct: Synergizing Reasoning and Acting in Language Models*](https://react-lm.github.io/). Mô hình này đặt suy luận (Reasoning), hành động (Acting) và quan sát (Observation) xen kẽ vào cùng một quỹ đạo: mô hình quyết định một hành động, môi trường trả về kết quả, và lượt tiếp theo sẽ tiếp tục dựa trên kết quả đó.

Ví dụ, khi mô hình chưa biết trạng thái hiện tại của đơn hàng, nó có thể gọi công cụ truy vấn trước. Sau khi hệ thống đơn hàng trả về "Đã thanh toán, chờ giao hàng", mô hình mới quyết định trả lời trực tiếp hay tiếp tục tra cứu thông tin vận chuyển. Kết quả bên ngoài cung cấp căn cứ cho các phán đoán tiếp theo, nhưng không tự động đảm bảo câu trả lời sẽ chính xác.

![ReAct-LLM](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/ReAct-LLM-a5126f80.png)

Khi triển khai ReAct vào thực tế, runtime phải lưu trữ lịch sử thực thi và trạng thái hiện tại, cung cấp các công cụ hoặc Skills khả dụng cho mô hình, và liên kết phản hồi của công cụ dưới dạng Observation với lượt gọi tương ứng. Những thay đổi của môi trường như cảnh báo hệ thống hay thông tin bổ sung từ người dùng cũng cần được cập nhật vào các lượt tiếp theo.

![Quy trình mô hình ReAct](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-react-flow-06e50bf7.png)

Việc gọi công cụ qua nhiều lượt sẽ làm tăng độ trễ phản hồi và lượng Token tiêu thụ. Chất lượng đầu ra cũng chịu ảnh hưởng bởi phần mô tả công cụ, kiểm tra tham số, dữ liệu trả về và điều kiện dừng. Trace có thể ghi lại các hành động đã thực thi, nhưng văn bản suy luận do mô hình xuất ra không thể đồng nhất tuyệt đối với cơ chế ra quyết định thực sự bên trong.

### Plan-and-Execute

Plan-and-Execute là mô hình do đội ngũ LangChain đề xuất vào năm 2023. Giai đoạn lập kế hoạch (Planning) sẽ tạo ra các bước thực hiện và quan hệ phụ thuộc trước, sau đó bộ thực thi (Executor) sẽ xử lý tuần tự từng hạng mục. Do đó, mô hình này rất thích hợp cho các tác vụ dài có thể nhận diện trước các giai đoạn chính.

Kế hoạch tổng thể giúp các phụ thuộc và điều kiện hoàn thành bộc lộ sớm hơn. Khi môi trường hoặc mục tiêu nhiệm vụ thay đổi trong quá trình thực thi, kế hoạch cũ có thể không còn hiệu lực; lúc này cần phải lập lại kế hoạch (re-planning) chứ không thể tiếp tục chạy mù quáng theo các bước ban đầu.

Trong dự án thực tế, bạn có thể dùng kế hoạch để kiểm soát các giai đoạn vĩ mô bên ngoài, và chạy một vòng lặp con ReAct bên trong từng bước cụ thể. Các phụ thuộc tất định được ràng buộc bởi kế hoạch, còn khi thiếu thông tin cục bộ thì gọi công cụ để bổ sung.

### Workflow, Graph và Loop

Agent trao quyền quyết định bước tiếp theo cho mô hình, còn Workflow dùng mã nguồn hoặc cấu trúc đồ thị để quy định trước thứ tự các node, điều kiện rẽ nhánh và cách xử lý lỗi. Cả hai đều có thể gọi mô hình và công cụ; sự khác biệt cốt lõi nằm ở chỗ quyền kiểm soát được đặt ở đâu.

Các quy trình có bước đi ổn định và yêu cầu phân quyền rõ ràng thường được giao cho Workflow. Khi gặp các tác vụ truy xuất, phân tích hoặc chọn công cụ không thể liệt kê hết trước, bạn có thể nhúng một vòng lặp Agent con vào trong một node cụ thể. Kiểu Agentic Workflow này dùng quy trình bên ngoài để giới hạn phạm vi thực thi, và giao việc ra quyết định cục bộ cho mô hình.

Cấu trúc dữ liệu của luồng công việc AI là Đồ thị có hướng (Directed Graph), gồm 3 phần tử: Node chịu trách nhiệm thực thi, Edge chịu trách nhiệm điều khiển luồng, và State chia sẻ ngữ cảnh giữa các node.

### Multi-Agent

Hệ thống Multi-Agent quản lý các thực thể thực thi có khả năng hoàn thành độc lập các mục tiêu con, trong khi Prompt Chain nhiều giai đoạn quản lý các bước xử lý trong cùng một Workflow. Tiền đề để tách một vai trò thành Agent độc lập là nó phải sở hữu Prompt, công cụ, ngữ cảnh, quyền hạn, trạng thái chạy và kết quả bàn giao của riêng mình.

Chỉ khi các khâu khác nhau đòi hỏi các công cụ, quyền hạn và ngữ cảnh khác biệt rõ rệt, hoặc tác vụ có thể phân tách thành các hướng tương đối độc lập, thì Multi-Agent mới đem lại giá trị. Nếu nhiều vai trò cùng chia sẻ ngữ cảnh và công cụ giống nhau, chỉ khác nhau ở chỗ sinh ra các đoạn văn bản tương tự từ các nhân vật khác nhau, thì cái tăng thêm chủ yếu chỉ là số lượt gọi mô hình, độ trễ và chi phí tổng hợp.

Các mô hình điều phối phổ biến gồm:

| Mô hình | Phương thức điều khiển | Kịch bản áp dụng |
| --- | --- | --- |
| Sequential | Mã nguồn gọi tuần tự nhiều Agent theo thứ tự cố định | Các bước rõ ràng, phụ thuộc trước sau xác định |
| Parallel | Các tác vụ độc lập chạy song song, hoàn thành thì gộp lại | Truy xuất đa luồng, đánh giá đa chiều, bỏ phiếu |
| Router | Quy tắc hoặc mô hình định tuyến request cho một hoặc nhiều chuyên gia | Phạm vi nghiệp vụ rõ ràng, phân loại tương đối ổn định |
| Supervisor / Manager | Agent chính chia nhỏ tác vụ linh hoạt và gọi các Agent con | Tác vụ con không thể xác định hết trước, cần câu trả lời thống nhất |
| Handoff | Agent hiện tại chuyển giao quyền điều khiển và ngữ cảnh cần thiết cho vai trò khác | Phân luồng chăm sóc khách hàng, đối thoại theo từng chặng |

Sau khi tách vai trò, bạn còn phải định nghĩa hợp đồng tác vụ (task contract): mục tiêu con, tiêu chuẩn thành công, quan hệ phụ thuộc, công cụ được phép dùng, Schema đầu ra, vị trí lưu sản phẩm, timeout, ngân sách Token và chiến lược xử lý khi thất bại. Khi nhiều Agent cùng ghi vào trạng thái dùng chung hoặc gọi các công cụ có side effect, tính nhất quán vẫn phải dựa vào tính lũy kế (idempotency), kiểm soát phiên bản, khóa phân tán, cơ chế bù trừ (compensation) và điểm kiểm tra (checkpoint), chứ tuyệt đối không để các mô hình tự thương lượng thứ tự ghi.

### Context Engineering

Khi ngữ cảnh bị hỗn loạn, ngay cả khi năng lực mô hình đủ mạnh, Agent vẫn có thể bỏ sót ràng buộc, gọi công cụ lặp lại hoặc đi chệch khỏi mục tiêu hiện tại.

Context Engineering chịu trách nhiệm lựa chọn, tổ chức và cập nhật thông tin mà mô hình thực sự cần trong một cửa sổ Token hữu hạn—bao gồm quy tắc, bộ nhớ, mô tả công cụ, trạng thái phiên, kết quả quan sát bên ngoài và ngân sách Token. Prompt Engineering tập trung nhiều hơn vào cách diễn đạt của bản thân câu chỉ thị, vốn là một bài toán mang tính cục bộ hơn.

![Sự khác biệt giữa Context Engineering và Prompt Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-context-engineering-dimen-10eadd1a.png)

Để tìm hiểu phương pháp thiết kế sâu hơn, mời xem [Kỹ thuật viết Prompt (Prompt Engineering)](./agent/prompt-engineering.md) và [Context Engineering](./agent/context-engineering.md).

### Memory

![Toàn cảnh phân loại bộ nhớ của Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-memory-taxonomy-81b25fc2.svg)

Hệ thống bộ nhớ thường chia làm hai tầng: bộ nhớ ngắn hạn và bộ nhớ dài hạn. Bộ nhớ ngắn hạn ở cấp độ Session, phục vụ cho nhiệm vụ hiện tại; bộ nhớ dài hạn vượt qua phạm vi Session, lưu giữ sở thích người dùng, quyết định lịch sử và kinh nghiệm nhiệm vụ cần tái sử dụng. Vòng đời, quyền hạn và phương thức cập nhật của hai loại dữ liệu này rất khác nhau, vì vậy cần tách biệt chúng về mặt logic khi lưu trữ.

![Kiến trúc hệ thống bộ nhớ của AI Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-arch-3b774c14.png)

Xét theo mục đích chức năng, bộ nhớ của Agent có thể chia thành ba loại:

| Loại chức năng | Câu hỏi cốt lõi | Nội dung lưu trữ | Kịch bản điển hình |
| --- | --- | --- | --- |
| Bộ nhớ sự thật (Fact Memory) | Agent biết những gì? | Sở thích người dùng, trạng thái môi trường, sự thật tường minh | Ghi nhớ tech stack ưa thích của người dùng |
| Bộ nhớ kinh nghiệm (Experience Memory) | Agent cải thiện ra sao? | Quỹ đạo trước đây, bài học thành bại, tri thức chiến lược | Học hỏi từ các lần review mã thất bại |
| Bộ nhớ làm việc (Working Memory) | Agent hiện đang suy nghĩ gì? | Ngữ cảnh suy luận hiện tại, tiến độ tác vụ | Trạng thái trung gian trong suy luận nhiều bước |

Về mặt kỹ thuật, bộ nhớ dài hạn và RAG khá giống nhau, đều dùng cơ sở dữ liệu vector và tìm kiếm ngữ nghĩa. Nhưng đối tượng mà chúng phục vụ lại khác nhau.

RAG gắn kết các nguồn tri thức có thể truy xuất, như nội quy công ty, tài liệu sản phẩm hay kết quả truy vấn cơ sở dữ liệu thời gian thực. Nó có thể phục vụ kho tri thức dùng chung, hoặc thực hiện lọc phân quyền/truy xuất cá nhân hóa theo người dùng, tenant, vai trò và phiên làm việc. Khác biệt cốt lõi giữa RAG và bộ nhớ dài hạn nằm ở nguồn gốc dữ liệu và vòng đời: RAG truy xuất tri thức bên ngoài, còn bộ nhớ dài hạn lưu giữ các thông tin hình thành qua tương tác cần tái sử dụng qua nhiều phiên.

Bộ nhớ dài hạn quản lý những kinh nghiệm cá nhân hóa được tích lũy động qua tương tác giữa Agent với một người dùng cụ thể, như thói quen, sở thích, quyết định quá khứ. Nó mang tính cá nhân hóa rất cao và thay đổi theo từng người.

![Sự khác biệt giữa bộ nhớ dài hạn và RAG (Retrieval-Augmented Generation)](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-rag-vs-memory-455ff42b.svg)

### MCP

MCP là viết tắt của Model Context Protocol (Giao thức ngữ cảnh mô hình). Ba từ cấu thành đã thể hiện phạm vi áp dụng của giao thức:

- Model: Hướng tới các ứng dụng mô hình lớn;
- Context: Đưa ngữ cảnh, công cụ và nguồn dữ liệu bên ngoài đến cho mô hình;
- Protocol: Định hình phương thức tương tác thông qua một bộ giao thức tiêu chuẩn.

MCP định nghĩa **phương thức giao tiếp giữa MCP Client và MCP Server**. Host chịu trách nhiệm tương tác với người dùng và gọi mô hình, Client giao tiếp với Server, và Server cung cấp các năng lực cụ thể ra bên ngoài; bản thân mô hình không hề được tích hợp sẵn plugin chỉ nhờ việc kết nối MCP.

![Sơ đồ minh họa MCP](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-simple-diagram-cfea1892.png)

Function Calling, MCP, Agent và Skills thường cùng xuất hiện trong một hệ thống, nhưng mỗi khái niệm giải quyết một vấn đề khác nhau: Function Calling giúp mô hình thể hiện ý định gọi công cụ; MCP quy định cách Host khám phá năng lực bên ngoài và kết nối tới dịch vụ backend; Agent chịu trách nhiệm quyết định bước đi tiếp theo trong chuỗi thực thi nhiều lượt; còn Skills lưu trữ các quy trình và kinh nghiệm cần thiết để hoàn thành một loại tác vụ cụ thể.

![Sơ đồ quan hệ 3 tầng giữa FC, MCP và Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/mcp-fc-agent-layer-c857389e.png)

### Skills

Khi người dùng yêu cầu: "Hãy phân tích giúp tôi báo cáo tài chính này", Prompt chỉ diễn đạt nhiệm vụ hiện tại. Nếu mô hình cần đọc tệp, nó sẽ sinh tham số có cấu trúc cho `read_file` thông qua Function Calling; công cụ này có thể do một MCP Server cung cấp. Còn trình tự phân tích—ví dụ kiểm tra ý nghĩa các trường trước, sau đó tìm giá trị bất thường, cuối cùng kết hợp với bối cảnh kinh doanh để giải thích kết quả—sẽ thích hợp nhất khi được đóng gói thành một Skill.

Skill là một bản mô tả tác vụ có thể được Agent phát hiện và tải theo nhu cầu. Các kinh nghiệm của nhóm như định dạng giao diện, các trường log, thứ tự điều tra slow SQL, danh sách kiểm tra code review... đều có thể đặt trong `SKILL.md`, tránh việc lần nào cũng phải nhét toàn bộ bộ quy tắc vào Prompt. Skill, Prompt, Function Calling và MCP lần lượt đảm nhận đầu vào tác vụ, ý định gọi, kết nối công cụ và phương pháp thực thi; các trách nhiệm này có thể đồng thời cùng xuất hiện trong một tác vụ.

![So sánh giữa Skill với Prompt, MCP và Function Calling](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-prompt-function-calling-mcp-comparison-0566edb1.webp)

Quy trình nạp và thực thi của Skill gồm 5 bước:

![Chuỗi thực thi của Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/skills/skill-agent-execution-link-4a51fe53.webp)

1. Người dùng đưa ra nhiệm vụ (Prompt).
2. Host đưa mô tả ngắn gọn về các Skills khả dụng vào ngữ cảnh (Skill Metadata).
3. Mô hình xác định nhiệm vụ hiện tại khớp với một Skill cụ thể (Skill Routing).
4. Host nạp nội dung đầy đủ của `SKILL.md` vào ngữ cảnh (Lazy Loading).
5. Mô hình thực hiện theo quy trình trong Skill để gọi công cụ, đọc dữ liệu và viết kết quả (Execution).

### Harness Engineering

Mô hình đảm nhận việc suy luận và sinh nội dung, nhưng không thể tự lưu trữ trạng thái tác vụ, giới hạn quyền tệp tin, chạy test suite hay xử lý timeout công cụ. System prompt, gọi công cụ, hệ thống tệp, sandbox, bộ điều phối (orchestrator), Hooks, cơ chế phản hồi và các ràng buộc cùng nhau tạo nên Harness. Trong thực tiễn kỹ thuật, công thức **Agent = Model + Harness** như một lời nhắc nhở: môi trường vận hành xung quanh mô hình cũng quyết định việc tác vụ có thể tiếp tục thực thi hay không.

Vivek Trivedi trong bài viết *The Anatomy of an Agent Harness* cũng áp dụng tư duy tách bạch trách nhiệm của mô hình trước, sau đó mới kiểm tra hệ thống bao quanh. Khi rà soát Agent, bên cạnh đầu ra của mô hình, bạn còn phải xem ngữ cảnh có toàn vẹn không, công cụ có sẵn sàng không, môi trường thực thi có được kiểm soát không và có khả năng phục hồi sau sự cố hay không.

![Agent = Model + Harness](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-agent-equals-model-harness-arch-fe29369b.png)

Prompt Engineering, Context Engineering và Harness Engineering có phạm vi tác động khác nhau. Prompt tập trung vào cách diễn đạt chỉ thị, Context quyết định lượt gọi hiện tại cần cung cấp những thông tin gì, còn Harness quản lý các cơ chế thực thi, xác thực, quan sát và phục hồi bên ngoài mô hình.

![Mối quan hệ giữa Harness với Prompt/Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/harness-engineering-layers-arch-f559e799.png)

| Tầng | Bài toán giải quyết | Trọng tâm | Công việc điển hình |
| --- | --- | --- | --- |
| Prompt Engineering | Làm sao nói rõ chỉ thị | Giúp mô hình hiểu ý định, giảm thiểu mơ hồ cục bộ | Thiết kế system prompt, ví dụ Few-shot, dẫn dắt Chain-of-Thought |
| Context Engineering | Nên cho Agent thấy những gì | Cung cấp thông tin đúng và đủ cho mô hình vào thời điểm thích hợp | Quản lý ngữ cảnh, RAG, nạp bộ nhớ, tối ưu hóa Token |
| Harness Engineering | Hệ thống thực thi, hiệu chỉnh, quan sát và phục hồi liên tục ra sao | Đảm bảo tính đúng đắn lâu dài, sửa lệch, khắc phục sự cố trong tác vụ dài | Hệ thống tệp, sandbox, thực thi ràng buộc, vòng lặp phản hồi, quan sát |

### Loop Engineering

Loop Engineering bổ sung các yếu tố kích hoạt (trigger), mục tiêu, ngữ cảnh, xác thực, trạng thái và điều kiện dừng cho việc thực thi lặp đi lặp lại của Agent. Mỗi vòng lặp đều phải để lại kết quả có thể kiểm tra, và thoát khỏi vòng lặp khi tác vụ hoàn thành, thất bại, cạn kiệt ngân sách hoặc cần phê duyệt.

Xét dưới góc độ kỹ thuật, cần chú ý các điểm sau:

- Kích hoạt (Trigger): Ai khởi động lượt tác vụ này? Lệnh thủ công, cron job, CI thất bại, tạo PR, cập nhật Issue, hay một sự kiện tin nhắn.
- Mục tiêu (Goal): Trạng thái nào được coi là hoàn thành? Toàn bộ test pass, CI green, độ bao phủ đạt giá trị nhất định, ảnh chụp màn hình khớp với bản thiết kế, hay chỉ cần tạo bản nháp chờ người duyệt.
- Ngữ cảnh (Context): Agent cần xem những tệp, quy tắc, trạng thái lịch sử, kết quả công cụ và quy ước dự án nào trong mỗi lượt.
- Hành động (Action): Agent có thể sửa mã, chạy test, tra cứu GitHub, đọc log, tạo PR, hay chỉ được đưa ra đề xuất.
- Quan sát (Observation): Làm sao Agent biết bước vừa rồi đã làm đúng? Đầu ra của test, kết quả lint, kiểm tra kiểu (type check), ảnh chụp màn hình, nhận xét review, tóm tắt log đều có thể là kết quả quan sát.
- Trạng thái (State): Lượt này đã thử những gì, thất bại ở đâu, bước tiếp theo làm gì—phải được ghi ra tệp bên ngoài, Issue, thẻ Linear hoặc cơ sở dữ liệu, chứ không thể chỉ dựa vào cuộc hội thoại hiện tại.
- Dừng (Stop): Khi nào thì thoát, khi nào chuyển cho con người xử lý, khi nào dừng ngay vì cạn kiệt ngân sách hoặc vượt số lượt lặp.

![Vòng lặp ngoài trong Loop Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/loop-engineering-outer-loop-d4043888.webp)

Một vòng lặp tối thiểu có thể biểu diễn thành một chuỗi thực thi: Đọc ngữ cảnh → Phán đoán bước tiếp theo → Gọi công cụ hoặc xuất câu trả lời → Ghi ngược kết quả → Kiểm tra điều kiện dừng. ReAct đặt Reasoning và Acting xen kẽ trong vòng lặp này; Loop Engineering còn phải xử lý các vấn đề bên ngoài vòng lặp như kích hoạt, xác thực, lưu trữ bền vững, ngân sách và sự can thiệp của con người.

## RAG

Bài viết gốc liên quan:

- [Khái niệm nền tảng về RAG: Truy xuất, sinh nội dung và đánh đổi kỹ thuật](./rag/rag-basis.md)
- [Thuật toán chỉ mục vector và cơ sở dữ liệu vector trong RAG](./rag/rag-vector-store.md)
- [Chiến lược xử lý và phân tách tài liệu RAG: Từ phân tích cú pháp, làm sạch, Chunking đến xử lý đa phương thức](./rag/rag-document-processing.md)
- [Tối ưu hóa RAG: Từ Recall, Rerank đến Context Engineering](./rag/rag-optimization.md)
- [GraphRAG: Bổ sung cho tìm kiếm vector bằng cấu trúc đồ thị](./rag/graphrag.md)
- [Cập nhật tài liệu kho tri thức RAG: Cập nhật tăng dần, kiểm soát phiên bản, loại bỏ trùng lặp và tái thiết lập toàn bộ](./rag/rag-knowledge-update.md)

### RAG là gì?

**RAG (Retrieval-Augmented Generation, Sinh tăng cường truy xuất)** tích hợp khâu truy xuất thông tin vào quá trình sinh của mô hình ngôn ngữ lớn. Trước tiên hệ thống tìm kiếm nội dung liên quan đến câu hỏi từ cơ sở dữ liệu, tập tài liệu hoặc hệ thống nội bộ doanh nghiệp, sau đó chuyển kết quả truy xuất cùng câu hỏi ban đầu cho LLM. Nhờ đó, mô hình có được bằng chứng nằm ngoài các tham số tri thức vốn có của nó.

![Sơ đồ minh họa RAG](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-simplified-architecture-diagram-cbeceba1.png)

RAG chủ yếu bù đắp 3 khoảng trống thông tin:

- **Tính kịp thời của tri thức**: Tri thức tham số của mô hình được huấn luyện dừng lại tại thời điểm đóng dữ liệu (cutoff date). RAG có thể truy xuất các sự kiện mới, chính sách và tài liệu sản phẩm ngay tại thời điểm phát sinh request.
- **Truy cập dữ liệu riêng tư**: Tài liệu sản phẩm nội bộ doanh nghiệp, kho tri thức và dữ liệu khách hàng không nằm trong tập dữ liệu huấn luyện công khai. Ứng dụng có thể lọc theo quyền của người dùng rồi chỉ cung cấp những đoạn trích cần thiết để trả lời.
- **Căn cứ cho câu trả lời**: Bằng chứng truy xuất giúp ràng buộc phạm vi trả lời của mô hình, nhưng không thể loại bỏ hoàn toàn hiện tượng ảo giác (hallucination). Lỗi truy xuất, nhiễu ngữ cảnh, trích dẫn lệch và việc mô hình không tuân thủ chỉ thị vẫn có thể dẫn đến câu trả lời sai; hệ thống production vẫn cần phối hợp kiểm tra trích dẫn, đánh giá câu trả lời, cơ chế từ chối trả lời và phản hồi của con người.

### Nguyên lý hoạt động của RAG

Chuỗi kỹ thuật RAG thường chia thành hai giai đoạn: lập chỉ mục offline (offline indexing) và truy xuất - sinh trực tuyến (online retrieval & generation). Giai đoạn lập chỉ mục xử lý các tài liệu gốc thành các cấu trúc dữ liệu có thể tìm kiếm được; giai đoạn trực tuyến thực hiện hiểu truy vấn, tìm kiếm thu hồi, dựng ngữ cảnh và sinh câu trả lời khi người dùng đặt câu hỏi.

Sơ đồ quy trình rút gọn của giai đoạn lập chỉ mục và truy xuất như sau:

![Sơ đồ rút gọn giai đoạn lập chỉ mục và truy xuất](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-rag-engineering-link-e1988667.png)

Giai đoạn lập chỉ mục chủ yếu làm các công việc sau:

1. Tiếp nhận tài liệu: Tệp văn bản, PDF, trang web, bản ghi cơ sở dữ liệu đều được, miễn là có nội dung.
2. Làm sạch tài liệu: Loại bỏ thẻ HTML, ký tự đặc biệt và các tạp âm.
3. Làm giàu tài liệu: Bổ sung metadata như timestamp, nhãn phân loại để tạo các chiều lọc cho việc tìm kiếm sau này.
4. Tách tài liệu (Chunking): Dùng text splitter để chia nhỏ tài liệu thành các đoạn (chunk). Bước này phải cân bằng giữa tính toàn vẹn ngữ nghĩa, giới hạn đầu vào của mô hình Embedding, context window của mô hình sinh và độ mịn khi truy xuất. Chunk quá lớn dễ đem lại tạp âm, quá nhỏ lại dễ mất ngữ cảnh. Chiến lược phân tách ảnh hưởng trực tiếp đến chất lượng truy xuất, chi tiết xem tại [Xử lý tài liệu RAG](./rag/rag-document-processing.md).
5. Vector hóa biểu diễn (Embedding Generation): Chuyển các đoạn văn bản thành các vector ngữ nghĩa (semantic vector), tức là các vector dày đặc nhiều chiều thông qua mô hình Embedding (như `text-embedding-3-small` / `text-embedding-3-large` của OpenAI hoặc các mô hình mã nguồn mở trên Hugging Face).
6. Lưu trữ vào Vector Store hoặc hệ thống chỉ mục: Lưu vector nhúng, nội dung gốc và metadata tương ứng vào hệ thống chỉ mục vector như Milvus, pgvector, Elasticsearch / OpenSearch vector search, hoặc Faiss. Việc chọn lựa cơ sở dữ liệu vector, thuật toán chỉ mục và thực tiễn với pgvector có thể xem tại [Cơ sở dữ liệu vector RAG](./rag/rag-vector-store.md).

### Embedding

Embedding là việc biến văn bản thành một chuỗi các con số. Chính xác hơn, nó ánh xạ văn bản vào một không gian vector dày đặc nhiều chiều (high-dimensional dense vector space), sao cho các văn bản có ngữ nghĩa gần gũi sẽ có khoảng cách gần nhau trong không gian vector.

Ví dụ 3 câu này:

- "Làm thế nào để yêu cầu hoàn tiền?"
- "Quy trình hoàn tiền như thế nào?"
- "Làm sao để hủy đơn và lấy lại tiền?"

Cách dùng từ của chúng khác nhau, nhưng ngữ nghĩa rất gần gũi. Một mô hình Embedding tốt sẽ ánh xạ chúng về các vị trí liền kề nhau, từ đó tìm kiếm vector mới có thể tìm ra các Chunk tương quan.

![Embedding: Ánh xạ văn bản vào không gian ngữ nghĩa](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-2-embedding-map-text-to-semantic-space-8815378b.png)

Số chiều của Embedding phổ biến gồm 768, 1024, 1536, 3072... Số chiều là một phần trong thiết kế và phương pháp huấn luyện của mô hình, không thể tách rời mô hình để kết luận rằng "số chiều càng cao thì hiệu quả ngữ nghĩa càng tốt"; số chiều cao hơn thường kéo theo chi phí lưu trữ, lập chỉ mục và tính toán tương đồng lớn hơn. Lấy OpenAI Embedding làm ví dụ, `text-embedding-3-small` mặc định xuất ra 1536 chiều, `text-embedding-3-large` mặc định xuất ra 3072 chiều, và hỗ trợ hạ chiều thông qua tham số `dimensions`.

### Truy xuất vector và Cơ sở dữ liệu vector

Trong luồng truy xuất của RAG, bước cơ bản nhất là: biến câu hỏi của người dùng và tài liệu thành vector, rồi dùng tìm kiếm độ tương đồng để tìm ra các đoạn tài liệu tương quan nhất.

Có thể hình dung quy trình như sau:

1. Tài liệu vào kho tri thức sẽ được cắt thành các Chunk.
2. Mỗi Chunk qua mô hình Embedding biến thành một vector.
3. Vector cùng văn bản gốc và metadata được ghi vào cơ sở dữ liệu vector.
4. Khi người dùng hỏi, câu hỏi cũng được chuyển thành query vector.
5. Cơ sở dữ liệu vector tìm ra Top-K vector tài liệu tương đồng nhất.
6. Hệ thống đưa các đoạn trích tài liệu này vào Prompt, chuyển cho LLM sinh câu trả lời.

![Mối quan hệ giữa Embedding và truy xuất vector](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-embedding-vector-retrieval-7ea0d2d2.png)

Embedding chịu trách nhiệm biến văn bản thành vector có thể so sánh được, còn truy xuất vector dựa vào đó để tìm nội dung gần gũi về mặt ngữ nghĩa. Truy xuất vector chỉ là một cách triển khai của RAG; RAG còn có thể dùng BM25, SQL, đồ thị tri thức, Search API hoặc các truy vấn nghiệp vụ khác để lấy bằng chứng bên ngoài.

Trong các Demo quy mô nhỏ, vài nghìn vector tài liệu có thể đặt thẳng trong bộ nhớ để tìm kiếm vét cạn (brute-force). Nhưng trong hệ thống RAG thực tế, lượng tài liệu sẽ nhanh chóng đạt đến hàng triệu, hàng chục triệu bản ghi hoặc lớn hơn nữa.

Ngoài lưu trữ vector, cơ sở dữ liệu vector còn phải giải quyết hàng loạt bài toán kỹ thuật như chỉ mục tương đồng xấp xỉ (ANN), lọc theo metadata, cập nhật xóa bỏ, truy vấn đồng thời và lưu trữ bền vững:

![Tại sao kịch bản RAG lại cần cơ sở dữ liệu vector?](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-why-need-vector-store-9a2d40d9.png)

### Xử lý tài liệu

Tài liệu từ lúc tải lên đến khi vào cơ sở dữ liệu vector phải trải qua ít nhất 6 công đoạn:

![Toàn bộ chuỗi xử lý tài liệu RAG: Nửa đầu khâu upload quyết định trần hiệu quả của nửa sau](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-document-processing-overall-link-f699ae42.png)

Việc kiểm tra chất lượng không nên chỉ diễn ra sau khi đã nạp dữ liệu vào cơ sở dữ liệu. Tiến hành kiểm tra mẫu ngay ở giai đoạn Chunking có thể phát hiện vấn đề sớm, tránh ghi dữ liệu kém chất lượng hàng loạt vào cơ sở dữ liệu vector.

Rủi ro cốt lõi ở từng công đoạn:

| Công đoạn | Vấn đề điển hình | Tác động cuối cùng |
| --- | --- | --- |
| Upload file | Định dạng giả mạo, vượt quá kích thước, mã hóa hỗn loạn | Parser bị crash hoặc lỗi âm thầm |
| Kiểm tra định dạng | Phần mở rộng không khớp với MIME type thực tế | Chọn sai parser |
| Phân tích Layout | PDF nhiều cột, bảng biểu gộp ô, header/footer | Mất cấu trúc, ngữ cảnh bị lệch |
| Làm sạch khử nhiễu | Ký tự rác, ký tự đặc biệt, dòng trống liên tiếp, mục lục thừa | Nhiễu vào chỉ mục, Embedding bị sai lệch |
| Chunking | Cắt đứt ngữ nghĩa, ngữ cảnh bị gãy vụn, khối quá lớn hoặc quá nhỏ | Truy xuất không chuẩn, câu trả lời chắp vá |
| Metadata | Không lưu nguồn gốc, số trang, phiên bản, quyền hạn | Không thể lọc, không thể trích dẫn |
| Nạp dữ liệu (Ingestion) | Số chiều vector không khớp, vượt giới hạn Token | Tìm kiếm thất bại, chỉ mục bị hỏng |

Rất nhiều đội ngũ đổ dồn công sức vào việc đổi mô hình embedding, nhưng trên thực tế nếu dữ liệu đã bị hỏng ngay từ bước này, thì việc đổi mô hình chỉ làm cho cái sai diễn ra một cách ổn định hơn mà thôi.

### Chunking

![Làm thế nào để chọn chiến lược phân tách tài liệu phù hợp?](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-document-processing-chunking-strategy-634ecbe0.png)

Nếu tài liệu vốn có cấu trúc rõ ràng, việc cắt theo cấu trúc thường mang lại hiệu quả tốt hơn. Trong một thử nghiệm của NVIDIA, Page-Level Chunking (phân tách theo trang) thể hiện tốt nhất trên báo cáo tài chính và tài liệu pháp lý, với độ chính xác trung bình 0.648 và phương sai thấp nhất. Ranh giới trang trong các tài liệu này thường mang ngữ nghĩa về chương mục hoặc bố cục, nên cần cố gắng bảo tồn khi phân tách.

Tuy nhiên đừng mù quáng thần thánh hóa việc phân tách theo trang. Ưu thế này so với phân tách theo Token thực chất chỉ nhỉnh hơn 0.3 - 4.5 điểm phần trăm, và trên tập dữ liệu FinanceBench, phân tách theo 1024 Token lại tốt hơn theo trang (0.579 so với 0.566). Loại tài liệu mà NVIDIA thử nghiệm (báo cáo tài chính, tài liệu pháp lý) là các trường hợp mà bản thân việc phân trang đã mang ngữ nghĩa cấu trúc—nếu tệp PDF của bạn chỉ là bản xuất bừa từ file Word, việc cắt theo trang sẽ không đem lại thêm lợi ích nào. Ngoài ra, loại truy vấn cũng quyết định chiến lược tối ưu: truy vấn sự thật phù hợp với khối nhỏ 256–512 Token, còn truy vấn mang tính phân tích lại phù hợp với khối 1024+ Token hoặc phân tách theo trang.

Với các loại tài liệu khác nhau, bạn có thể chọn trước một bộ phân tách phù hợp với cấu trúc của nó, rồi đánh giá bằng các truy vấn nghiệp vụ:

| Loại tài liệu | Cách phân tách gợi ý | Công cụ thực hiện |
| --- | --- | --- |
| Markdown | Cắt theo cấp tiêu đề (H1/H2/H3) | `MarkdownHeaderTextSplitter` |
| HTML | Cắt theo cấp thẻ (h1~h6, p, div) | `HTMLHeaderTextSplitter` |
| PDF | Cắt theo trang hoặc chương mục | `chunk_by_title`, `chunk_by_page` |
| Code | Cắt theo hàm, lớp, package | `PythonCodeTextSplitter` |
| Báo cáo khoa học | Cắt theo chương, đoạn, bảng biểu | Layout-aware Parser |

Khi Chunk nhỏ, tìm kiếm vector dễ trúng các câu văn cụ thể hơn, nhưng ngữ cảnh mô hình nhận được có thể không toàn vẹn; khi Chunk lớn, thông tin đoạn văn được giữ nhiều hơn, nhưng các nội dung không liên quan cũng sẽ cùng tràn vào tập ứng viên.

Parent-Child Chunking tách rời độ mịn khi truy xuất với ngữ cảnh dùng để sinh nội dung. Ví dụ dùng các khối con (child chunk) khoảng 300 Token để lập chỉ mục, mỗi khối con liên kết với một đoạn cha (parent chunk) khoảng 1200 Token. Khi truy vấn khớp với khối con, hệ thống sẽ chuyển đoạn cha tương ứng cho mô hình. Các con số 300/1200 chỉ là tham số khởi đầu, vẫn cần tinh chỉnh theo cấu trúc tài liệu, loại truy vấn và kết quả đánh giá.

### Hybrid Search (Tìm kiếm kết hợp)

"Làm sao hủy đăng ký" và "Tắt tự động gia hạn" dùng từ khác nhau, tìm kiếm vector dễ dàng thiết lập liên kết ngữ nghĩa; trong khi các mã lỗi và số hiệu như `E1027`, `ABX-4421` lại thích hợp hơn với khả năng khớp từ chính xác của BM25. Hybrid Search duy trì cả hai luồng ứng viên này cùng lúc.

| Loại truy vấn | Biểu hiện của tìm kiếm Vector | Biểu hiện của BM25 | Đề xuất |
| --- | --- | --- | --- |
| "Làm sao hủy đăng ký" | Khớp được với "tắt tự động gia hạn" | Có thể không khớp được | Giữ lại tìm kiếm vector |
| "Mã lỗi E1027" | Có thể tìm ra sự cố chung chung | Khớp chính xác mã lỗi | Bắt buộc giữ tìm kiếm từ khóa |
| "Thông số model ABX-4421" | Dễ tìm model tương tự | Khớp chính xác SKU | Bắt buộc giữ tìm kiếm từ khóa |
| "Phân biệt chính sách từ chối ThreadPool Java" | Hiểu ngữ nghĩa tốt | Khớp được từ khóa chính | Kết hợp sẽ ổn định nhất |
| "Chính sách giá v3.2 mới nhất" | Cần điều kiện ngữ nghĩa và thời gian | Khớp được số phiên bản | Metadata + Hybrid |

Kết quả từ hai luồng cần được dung hợp trước khi bước vào khâu Rerank:

- Tìm kiếm vector trả về các ứng viên tương đồng về ngữ nghĩa.
- BM25 hoặc sparse vector trả về các ứng viên khớp từ khóa.
- Dùng RRF (Reciprocal Rank Fusion) hoặc điểm số chuẩn hóa có trọng số để gộp danh sách.
- Loại bỏ trùng lặp trong danh sách đã gộp rồi mới đưa vào Rerank.

Tài liệu chính thức của Microsoft Azure AI Search, Google Vertex AI Vector Search, Weaviate đều có giới thiệu về Hybrid Search và RRF. RRF dung hợp kết quả dựa trên thứ hạng vị trí của ứng viên, tránh việc phải so sánh trực tiếp điểm BM25 với điểm cosine của vector.

Việc có nên đưa tìm kiếm kết hợp vào hay không phụ thuộc vào phân phối truy vấn. Khi mã lỗi, mã sản phẩm, mục cấu hình và thuật ngữ chuyên ngành chiếm tỷ lệ lớn, luồng tìm kiếm từ khóa thường không thể bỏ qua; khi tài liệu có cấu trúc cao và câu hỏi hiếm khi chứa từ ngữ chính xác, việc thêm một luồng BM25 chưa chắc đã đem lại đủ lợi ích tương xứng.

### Query Rewrite (Viết lại truy vấn)

Câu hỏi mà người dùng gửi tới hệ thống truy xuất thường là những câu ngắn cụt:

- "Lỗi này sửa kiểu gì?"
- "Có được trả lại tiền không?"
- "Vấn đề nghẽn mạng hôm nọ lại bị à?"

Những cụm từ như "lỗi này", "tiền", "vấn đề hôm nọ" phụ thuộc chặt chẽ vào ngữ cảnh hội thoại; khi tìm kiếm trực tiếp sẽ thiếu đối tượng và ràng buộc. Query Rewrite sẽ bổ sung các thực thể cần thiết, các cách diễn đạt đồng nghĩa hoặc điều kiện lọc, giúp câu hỏi tiệm cận với cách viết trong kho tri thức trong khi vẫn giữ nguyên ý định ban đầu của người dùng.

Các chiến lược phổ biến gồm:

| Chiến lược | Kịch bản áp dụng | Ví dụ |
| --- | --- | --- |
| Viết lại chuẩn hóa | Dùng khẩu ngữ, viết tắt, thiếu ngữ cảnh | "Có được trả lại tiền không" thành "Chính sách hoàn tiền, điều kiện hoàn tiền, quy trình hoàn tiền" |
| Multi-Query | Có thể có nhiều cách diễn đạt khác nhau | Đồng thời truy vấn "hủy đăng ký", "tắt tự động gia hạn", "dừng gói thành viên" |
| Query Decomposition | Câu hỏi chứa nhiều câu hỏi con | Tách "So sánh phí giao dịch và xử lý tranh chấp giữa Stripe và Square" thành 4 câu hỏi con |
| Step-back Query | Câu hỏi quá chi tiết, thiếu bối cảnh nền | Truy xuất "Quy định tính phí thuê bao" trước, sau đó mới trả lời câu hỏi hủy cụ thể |
| HyDE | Câu hỏi quá ngắn, cấu trúc khác xa tài liệu | Sinh câu trả lời giả định trước, rồi dùng vector của câu trả lời giả định để truy xuất tài liệu thực tế |
| Self-Query | Câu hỏi chứa điều kiện lọc có cấu trúc | Trích xuất năm `2025` và lọc danh mục từ câu "Tra cứu các chính sách liên quan đến Java năm 2025" |

Các component như `MultiQueryRetriever`, `SelfQueryRetriever` của LangChain đã cung cấp sẵn các cách triển khai tương ứng. Query ban đầu phải luôn được giữ lại làm một luồng đầu vào truy xuất rồi mới dung hợp với kết quả của các query viết lại; nếu chỉ giữ lại kết quả viết lại, một khi mô hình hiểu sai ý định, toàn bộ ứng viên phía sau sẽ bị trôi dạt hoàn toàn.

### Rerank (Chấm điểm xếp hạng lại)

Người dùng hỏi: "Tại sao Thread Pool lại kích hoạt chính sách từ chối (rejection policy)?"

Truy xuất vector có thể tìm ra các đoạn trích này:

1. Giải thích các tham số cốt lõi của Thread Pool.
2. Danh sách enum các chính sách từ chối.
3. Điều kiện kích hoạt chính sách từ chối (khi hàng đợi đầy và số luồng đạt maximumPoolSize).
4. Đoạn mã ví dụ sử dụng Thread Pool.

Hai đoạn đầu có ngữ nghĩa gần gũi với "Thread Pool" và "chính sách từ chối", nhưng chỉ có đoạn thứ 3 mới trực tiếp giải thích điều kiện kích hoạt. Mô hình truy xuất bi-encoder mã hóa độc lập query và document để truy xuất nhanh; còn Rerank thường sử dụng Cross-Encoder hoặc mô hình rerank chuyên dụng để chấm điểm chung giữa query với từng ứng viên, đưa nội dung thực sự trả lời được câu hỏi lên đầu. Độ chính xác cao hơn rất nhiều, nhưng chi phí tính toán cũng lớn hơn, do đó thông thường chỉ xử lý một lượng nhỏ ứng viên sau khâu truy xuất thô.

Một chuỗi xử lý thông thường diễn ra như sau (số lượng ứng viên cần điều chỉnh theo ngân sách độ trễ và kết quả đánh giá):

1. Lọc trước bằng Metadata.
2. Hybrid Search truy xuất thô khoảng 30 đến 100 đoạn.
3. Loại bỏ trùng lặp và gộp các đoạn kề cận.
4. Rerank chọn ra 5 đến 10 đoạn tối ưu.
5. Nén ngữ cảnh rồi đưa vào Prompt.

### GraphRAG

![GraphRAG là gì?](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/graphrag-simplified-architecture-diagram-576e8a86.png)

GraphRAG (Graph-based Retrieval-Augmented Generation) là giải pháp sử dụng cấu trúc đồ thị cho việc tăng cường truy xuất. Hệ thống mô hình hóa tường minh các thực thể, mối quan hệ và ngữ cảnh có cấu trúc từ tài liệu; khi truy vấn, hệ thống lần theo các mối quan hệ trên đồ thị để thu thập bằng chứng, rồi chuyển cho LLM sinh câu trả lời.

GraphRAG thay đổi đối tượng truy xuất. Cơ sở dữ liệu đồ thị có thể chứa các dữ liệu này, nhưng việc có sử dụng một sản phẩm cơ sở dữ liệu đồ thị cụ thể nào đó hay không không phải là điều kiện duy nhất để định nghĩa GraphRAG.

RAG vector truyền thống chủ yếu truy xuất các Chunk văn bản. GraphRAG có thể truy xuất node, edge, đường đi trên đồ thị và bằng chứng văn bản gốc; tóm tắt cộng đồng (community summary) là một hình thức lập chỉ mục được Microsoft GraphRAG áp dụng, nhưng không phải mọi hệ thống GraphRAG đều bắt buộc phải dùng.

Hình dung một cách tương tự:

- **Vector RAG** giống như vào thư viện tìm kiếm vài trang sách có nội dung tương tự dựa theo ngữ nghĩa.
- **GraphRAG** giống như việc lập trước sơ đồ quan hệ nhân vật, dòng thời gian sự kiện và mục lục chủ đề, rồi lần theo các mối liên hệ đó để tìm bằng chứng.

Vector RAG rất giỏi phán đoán "đoạn văn này có giống câu hỏi của tôi không", còn GraphRAG giỏi hơn trong việc hiểu "các đối tượng này rốt cuộc kết nối với nhau như thế nào".

![Khác biệt bản chất giữa GraphRAG và RAG vector truyền thống](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/graphrag-vs-rag-1ca3a632.png)

| Chiều so sánh | Vector RAG truyền thống | GraphRAG |
| --- | --- | --- |
| Đối tượng truy xuất | Chunk văn bản | Thực thể, quan hệ, đường đi, tóm tắt cộng đồng, đoạn trích gốc |
| Năng lực cốt lõi | Thu hồi theo độ tương đồng ngữ nghĩa | Suy luận quan hệ, duyệt đồ thị, tổng hợp chủ đề toàn cục |
| Cấu trúc dữ liệu | Chủ yếu là chỉ mục vector | Đồ thị tri thức + Chỉ mục vector + Chỉ mục toàn văn |
| Câu hỏi phù hợp | Hỏi đáp sự thật cục bộ, giải thích đoạn trích tài liệu | Hỏi đáp quan hệ nhiều bước (multi-hop), đúc kết xuyên tài liệu, phân tích nghiệp vụ phức tạp |

### Cập nhật kho tri thức

Kho tri thức RAG cần liên tục xử lý việc thêm, sửa và xóa tài liệu. Sau khi cập nhật, kết quả tìm kiếm phải đồng nhất với tài liệu hiện tại, metadata phân quyền cũng phải được đồng bộ; khi một đầu ghi nào đó bị lỗi, hệ thống phải định vị được tài liệu cụ thể và có thể phục hồi về phiên bản chỉ mục ổn định gần nhất.

Khâu lập chỉ mục và khâu truy vấn bắt buộc phải dùng cùng một mô hình Embedding và cùng phiên bản. Không gian vector do các mô hình khác nhau sinh ra không thể dùng lẫn cho nhau; ngay cả khi số chiều bằng nhau thì điểm số tương đồng cũng không có giá trị so sánh. Khi nâng cấp mô hình Embedding hoặc chiến lược Chunk, thông thường cần tạo chỉ mục mới, dùng cùng một bộ dữ liệu đánh giá để đối chiếu rồi mới thực hiện tráo đổi alias (bí danh), chỉ mục cũ được giữ lại một thời gian để dự phòng rollback.

Cập nhật thường nhật và chuyển đổi cấu trúc phù hợp với các chiến lược khác nhau:

| Chiều so sánh | Cập nhật tăng dần (Incremental) | Tái thiết lập toàn bộ (Full Rebuild) |
| --- | --- | --- |
| Phạm vi xử lý | Chỉ xử lý tài liệu thêm mới, sửa đổi hoặc xóa bỏ | Xử lý lại toàn bộ kho tri thức |
| Kịch bản áp dụng | Thay đổi thường xuyên hàng ngày, đồng bộ theo phút | Nâng cấp mô hình, đổi chiến lược Chunk, khôi phục sau sự cố nghiêm trọng |
| Phụ thuộc chính | Webhook, CDC, Polling và Message Queue | Snapshot hệ thống nguồn, chạy song song chỉ mục mới cũ và chuyển alias nguyên tử |
| Rủi ro chính | Bỏ sót sự kiện, sai thứ tự, lặp lại và thành công một phần | Chi phí tái thiết lập cao; thiết kế chuyển đổi hoặc rollback không hoàn chỉnh gây gián đoạn dịch vụ |

Môi trường production thường kết hợp bộ ba "hướng sự kiện (event-driven) + polling dự phòng + đối soát bù trừ". Cơ sở dữ liệu metadata lưu phiên bản tài liệu, mã băm nội dung (content hash), phiên bản Embedding, phiên bản Chunk và trạng thái tại từng đầu chỉ mục; khi xảy ra lỗi thành công một phần giữa cơ sở dữ liệu vector, chỉ mục toàn văn và cơ sở dữ liệu metadata, tác vụ bù trừ ngầm sẽ dựa vào trạng thái để retry và đối soát dữ liệu.

## Thiết kế hệ thống AI

Bài viết gốc liên quan:

- [Thiết kế hệ thống ứng dụng AI: Từ Prompt Demo đến kiến trúc cấp Production](./system-design/ai-application-architecture.md)
- [Chi tiết về LLM Gateway: Định tuyến đa mô hình, Fallback, Giới hạn tốc độ và Kiểm soát chi phí](./system-design/llm-gateway.md)
- [Khả năng quan sát AI và Trace: Cách tái hiện toàn bộ quá trình thực thi của Agent](./system-design/ai-observability.md)
- [Bảo mật thực chiến cho LLM/Agent: Từ Prompt Injection, vượt quyền công cụ đến cô lập Sandbox](./system-design/llm-security.md)
- [Chi tiết về công nghệ giọng nói AI: Triển khai kỹ thuật Voice Agent thời gian thực từ ASR và TTS](./system-design/ai-voice.md)

### Kiến trúc ứng dụng AI cấp Production

Một AI Demo đơn giản nhất chỉ có một luồng duy nhất: frontend gửi câu hỏi, backend ghép Prompt, gọi API mô hình, rồi trả về câu trả lời. Nó giúp xác thực ý tưởng sản phẩm nhanh chóng, nhưng chưa hề xử lý các vấn đề về độ ổn định, quyền hạn, chi phí, khả năng quan sát, đánh giá và quản trị dữ liệu trong hệ thống production.

Một ứng dụng AI cấp production thường được phân tầng rõ ràng theo trách nhiệm:

| Tầng | Trách nhiệm chính |
| --- | --- |
| Tầng cửa ngõ (Ingress) | Xác thực danh tính, phân quyền, chuẩn hóa request, rate limit, tính lũy kế (idempotency) và tiền xử lý nội dung nhạy cảm |
| Tầng điều phối nghiệp vụ | Lựa chọn hỏi đáp thông thường, RAG, Agent hoặc tác vụ bất đồng bộ; kiểm soát xác nhận từ người dùng, retry và fallback |
| Quản lý Prompt & Context | Quản lý phiên bản template, nạp biến động, phân bổ ngân sách Token, phát hành canary và rollback |
| Model Gateway | Điểm tiếp nhận mô hình tập trung, định tuyến, giới hạn tốc độ, Fallback, phân bổ chi phí và quan sát lượt gọi |
| Tri thức, Bộ nhớ & Công cụ | Quản lý độc lập tri thức bên ngoài, bộ nhớ cá nhân hóa và các thao tác nghiệp vụ thực tế |
| Đánh giá & Quan sát | Ghi nhận trace, phiên bản, chất lượng, độ trễ, chi phí và badcase; hỗ trợ replay và chốt chặn phát hành (release gates) |

Các module này không nhất thiết phải tách thành từng microservice độc lập ngay từ đầu. Các dự án giai đoạn đầu có thể phân định rõ trách nhiệm trong kiến trúc monolith module hóa, khi lưu lượng, số lượng nhóm hoặc nhu cầu quản trị tăng lên mới tách dịch vụ. Điều cốt lõi là phải tách rời khâu sinh nội dung bất định của mô hình ra khỏi các quy tắc nghiệp vụ tất định: mô hình chịu trách nhiệm hiểu ý định, tạo nội dung và đề xuất gọi công cụ; còn danh tính, quyền hạn, tiền bạc, phê duyệt và tính lũy kế bắt buộc phải do mã nguồn và hệ thống backend quyết định.

### LLM Gateway

LLM Gateway là cửa ngõ quản trị nằm giữa tầng ứng dụng và các nhà cung cấp mô hình. Ngoài việc giải quyết các bài toán API thông thường như xác thực quyền, giới hạn tốc độ, chuyển tiếp request, nó còn quản lý việc lựa chọn mô hình, ngân sách Token, độ dài ngữ cảnh, sự khác biệt giữa các nhà cung cấp, phản hồi streaming, gọi công cụ, dữ liệu trả về có cấu trúc, thống kê chi phí và quản lý phiên bản Prompt.

LLM Router chỉ chịu trách nhiệm chọn mô hình cho request hiện tại, là một mắt xích bên trong Gateway. Còn Gateway quản lý toàn bộ vòng đời từ lúc request đi vào cho đến khi kết quả được trả về, bao gồm kết nối thống nhất, định tuyến, Fallback, xử lý lỗi, quan sát, kiểm toán và phân bổ chi phí.

Với các công cụ nội bộ có lượng gọi nhỏ và chỉ dùng một nhà cung cấp duy nhất, bạn có thể bắt đầu bằng một `LLMClient` dùng chung để thống nhất khóa API, timeout, retry và ghi log. Khi có nhiều dịch vụ, nhiều đội ngũ hoặc nhiều tenant cùng tái sử dụng năng lực mô hình, hãy bổ sung dần danh mục mô hình (registry), hạn ngạch (quota), định tuyến, bộ nhớ đệm (cache), chi phí và kiểm toán; LLM Gateway là một tập hợp các trách nhiệm cần quản trị tập trung, không nhất thiết phải là một dịch vụ độc lập ngay từ ngày đầu.

### Khả năng quan sát AI và Trace

Giao diện AI trả về HTTP 200 không đồng nghĩa với việc câu trả lời là chính xác hay nhiệm vụ đã hoàn thành. RAG có thể gặp lỗi ở các khâu viết lại câu hỏi, thu hồi, chấm điểm xếp hạng lại hoặc cắt ngắn ngữ cảnh; Agent cũng có thể chọn sai công cụ, thực thi lặp lại các thao tác có side effect, hoặc làm mất kết quả khi tổng hợp giữa các Agent.

Các tín hiệu quan sát thông dụng trả lời cho những câu hỏi khác nhau:

| Tín hiệu | Câu hỏi chính cần giải đáp | Nội dung điển hình |
| --- | --- | --- |
| Metrics | Hệ thống tổng thể có bất thường không? | Lưu lượng request, tỷ lệ lỗi, độ trễ P95, lượng Token sử dụng, tỷ lệ lỗi công cụ |
| Logs | Sự kiện gì đã diễn ra tại thời điểm đó? | Stack trace ngoại lệ, thay đổi trạng thái, nguyên nhân retry, cảnh báo nghiệp vụ |
| Trace | Một request đã trải qua những bước nào? | Mối quan hệ giữa mô hình, tìm kiếm, công cụ, Agent và các khâu thượng hạ tầng |
| Evaluation | Chất lượng đầu ra và kết quả tác vụ có đạt chuẩn không? | Tính đúng đắn, độ trung thực, chọn công cụ, mức độ hoàn thành nhiệm vụ, tính an toàn |
| Audit | Ai đã thực hiện thao tác gì dưới quyền hạn nào? | Danh tính người dùng, biên bản phê duyệt, quyết định phân quyền, thao tác ghi bên ngoài |

Trong các tác vụ dài, cần phân biệt rõ Session, Run, Trace, Span và Attempt. Session kết nối cuộc đối thoại nhiều lượt, Run đại diện cho một lần thực hiện nhiệm vụ, Trace ứng với một chuỗi gọi thực tế, Span thể hiện một thao tác gọi mô hình, truy xuất hoặc công cụ bên trong đó, còn Attempt ghi nhận lượt thử thứ mấy của cùng một bước. Sau khi con người phê duyệt hoặc khôi phục bất đồng bộ, có thể tạo Trace mới nhưng phải giữ nguyên `runId`.

Những Trace thất bại đã được xác nhận cần được làm sạch dữ liệu nhạy cảm rồi đưa vào tập badcase. Sau khi chỉnh sửa Prompt, cấu hình RAG, công cụ hoặc logic điều phối, hãy dùng các quỹ đạo này để chạy đánh giá hồi quy offline, sau đó kiểm chứng hiệu quả thực tế trên production thông qua phát hành canary.

### Bảo mật LLM và Agent

Khi Agent kết nối với RAG, Memory, công cụ, MCP, Skills, trình duyệt web và môi trường thực thi mã, nội dung bên ngoài không chỉ ảnh hưởng đến phán đoán của mô hình mà còn có thể kích hoạt các thao tác nghiệp vụ thật. Đầu vào của người dùng, trang web cào được, email, đoạn trích RAG, Memory, kết quả công cụ, tin nhắn từ Agent khác và tham số do mô hình sinh ra đều phải được đối xử như dữ liệu không đáng tin cậy.

Prompt Injection miêu tả việc các chỉ thị tấn công xâm nhập vào ứng dụng và làm thay đổi nhiệm vụ đã định; Indirect Injection giấu các chỉ thị tấn công bên trong trang web, email, tài liệu, hình ảnh, trích đoạn RAG hoặc kết quả công cụ; Jailbreak chủ yếu tìm cách vượt qua các rào cản an toàn vốn có của bản thân mô hình. Cả ba hình thức này có thể đan xen lẫn nhau, và việc chỉ thêm một câu "hãy bỏ qua các chỉ thị bên ngoài" vào System Prompt là hoàn toàn không đủ để bảo vệ toàn bộ chuỗi gọi.

Các biện pháp kiểm soát bảo mật phải được thiết lập bên ngoài mô hình:

- Lọc phân quyền trước khi truy xuất dựa trên người dùng, tenant và phạm vi dữ liệu.
- Cắt gọt danh sách công cụ nhìn thấy dựa theo ngữ cảnh và danh tính người dùng, kiểm tra lại quyền hạn trước khi thực thi.
- Tách các interface đọc ghi chung chung thành các công cụ có hành động nghiệp vụ rõ ràng và tham số bị giới hạn chặt chẽ.
- Các thao tác có rủi ro cao bắt buộc phải ràng buộc với công cụ cụ thể, tham số, phiên bản tài nguyên và thời hạn hiệu lực để chờ con người phê duyệt.
- Prompt, log và Trace mặc định chỉ lưu lại các metadata cần thiết; nội dung văn bản gốc phải được lưu giữ có kiểm soát theo mục đích, quyền hạn và thời hạn.
- Đưa việc thực thi mã và truy cập mạng vào môi trường cách ly (sandbox), giới hạn nghiêm ngặt về hệ thống tệp, tiến trình, tài nguyên và cổng mạng xuất ra ngoài.
- Đưa mô hình, Prompt, MCP Server, Skill, tập dữ liệu, container image và bộ đánh giá vào diện quản trị bảo mật chuỗi cung ứng.

Mô hình có thể đưa ra đề xuất thao tác, nhưng quyền hạn cuối cùng, quy tắc nghiệp vụ, phê duyệt và kết quả thực thi bắt buộc phải được mã nguồn phía server kiểm tra và đảm bảo.

### Voice Agent thời gian thực

Voice Agent bổ sung thêm khâu thu âm, tiền xử lý âm thanh, VAD (Voice Activity Detection), ASR (nhận diện giọng nói), TTS (chuyển văn bản thành giọng nói), phát streaming và xử lý ngắt lời vào chuỗi Agent thông thường:

```text
Thu âm -> Khử ồn/Triệt tiếng vọng -> VAD -> Streaming ASR -> Dựng ngữ cảnh
       -> LLM / Gọi công cụ -> Streaming TTS -> Phát âm thanh -> Ghi nhận trạng thái
```

Chat bằng văn bản chậm 1 giây thường vẫn chấp nhận được, nhưng trò chuyện bằng giọng nói mà trễ 1 giây sẽ tạo ra cảm giác ngắt quãng vô cùng gượng gạo. Khi tối ưu hóa, cần nhìn vào độ trễ P95/P99 end-to-end, chạy song song các khâu có thể đi trước: khi ASR sinh ra tiền tố ổn định thì dự đoán ý định ngay, khi LLM vừa xuất ra câu ngắn đầu tiên thì kích hoạt TTS ngay lập tức, và client khi nhận được các khối âm thanh thì vừa nhận vừa phát.

Xử lý ngắt lời cũng không đơn thuần chỉ là tạm dừng trình phát âm thanh. Hệ thống phải dừng việc tổng hợp TTS hiện tại, dọn sạch hàng đợi âm thanh đang chờ phát, hủy request mô hình đang tiếp tục sinh dở, và đánh giá xem công cụ đã được kích hoạt có thể thu hồi được không. Khi công cụ có các tác động phụ ra bên ngoài, chiến lược ngắt lời cần phải được thiết kế đồng bộ cùng với tính lũy kế, giao dịch bù trừ và trạng thái tác vụ.
