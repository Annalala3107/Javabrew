---
title: Tổng hợp câu hỏi phỏng vấn nền tảng LLM
description: Tổng hợp có hệ thống các câu hỏi phỏng vấn LLM tần suất cao, bao quát Token, Context Window, tham số lấy mẫu, gọi API, Streaming output, Structured Output, Function Calling, MCP, đánh giá ứng dụng AI, kèm bài viết tham khảo.
category: AI
tag:
  - Phỏng vấn LLM
  - Phỏng vấn mô hình lớn
  - Phỏng vấn AI
head:
  - - meta
    - name: keywords
      content: cau hoi phong van LLM, phong van LLM, cau hoi phong van Token, Context Window, Function Calling, Structured Output, danh gia ung dung AI
lang: vi
sourceRef: zh-ref/ai/interview-questions/llm-interview-questions.md
---

Một lượt gọi mô hình ngôn ngữ lớn (LLM) bắt đầu từ việc Token hóa, trải qua quá trình lắp ghép ngữ cảnh (context assembly) và lấy mẫu sinh từ (sampling generation), sau đó được backend tiếp nhận để xử lý trả về dạng luồng (streaming), giới hạn tần suất (rate limiting), thử lại (retry), phân tích cú pháp cấu trúc (structured parsing) và ghi log. Các câu hỏi phỏng vấn nền tảng sẽ bám sát chuỗi gọi này để đào sâu về bài toán chi phí, độ trễ, tính ổn định và an toàn bảo mật.

Các câu hỏi dưới đây được phân nhóm theo các chương trong chuyên đề Nền tảng LLM của JavaGuide; nguyên lý chi tiết và ví dụ mã nguồn thực tế được lưu tại các bài viết tương ứng. Phần này đóng vai trò tập hợp các trọng tâm kiến thức và câu hỏi phục vụ ôn tập tập trung.

## Cơ chế vận hành của LLM

Bài viết liên quan: [Cơ chế vận hành của LLM: Token, Context Window và tham số lấy mẫu tác động đến đầu ra như thế nào](../llm-basis/llm-operation-mechanism.md)

Token, Context Window và các tham số lấy mẫu cùng nhau quyết định một lượt gọi có thể chứa được bao nhiêu thông tin, tiêu tốn bao nhiêu tài nguyên và kết quả đầu ra có độ biến thiên lớn đến mức nào. Nhóm câu hỏi này rất hay đi kèm với các câu hỏi đào sâu về hội thoại dài, bằng chứng RAG và Structured Output.

Câu hỏi phỏng vấn thường gặp:

- Token là gì? Tại sao tiếng Trung, tiếng Anh và mã nguồn (code) lại tiêu tốn lượng Token khác nhau?
- Context Window (cửa sổ ngữ cảnh) là gì? Có phải Context Window càng lớn thì hiệu quả mô hình chắc chắn càng tốt không?
- Vấn đề "Lost in the Middle" (thất lạc ở giữa) là gì? Trong kịch bản ngữ cảnh siêu dài thì giảm thiểu bằng cách nào?
- Temperature, Top-P và Top-K lần lượt kiểm soát điều gì? Trong môi trường production nên cấu hình thế nào để đảm bảo tính ổn định cao nhất?
- Tại sao khi thiết lập Temperature bằng 0, kết quả đầu ra của mô hình đôi khi vẫn không hoàn toàn giống nhau giữa các lần chạy?
- Tại sao LLM lại phát sinh ảo giác (hallucination)? Các giải pháp giảm thiểu phổ biến hiện nay là gì?
- Ước tính ngân sách Token (Token budget) như thế nào? Cần cân nhắc đánh đổi ra sao giữa input, output, lịch sử hội thoại và bằng chứng RAG?
- Context Window siêu dài liệu có thể thay thế hoàn toàn RAG không? Mỗi giải pháp phù hợp với kịch bản nào?

![Ví dụ quá trình Token hóa](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-token-process-f3c248b4.png)

## Kỹ thuật gọi API (API Invocation Engineering)

Bài viết liên quan: [Thực tiễn kỹ thuật gọi API LLM: Streaming output, retry, rate limit và phản hồi có cấu trúc](../llm-basis/llm-api-engineering.md)

Thời gian phản hồi, mô hình tính phí và các loại mã lỗi của API mô hình đều khác biệt rõ rệt so với các API nghiệp vụ thông thường. Trong phỏng vấn, các vấn đề về Streaming, retry, tính lũy nghiệm (idempotency), rate limit và Model Gateway thường được đặt chung trong một chuỗi gọi để kiểm tra toàn diện.

Câu hỏi phỏng vấn thường gặp:

- Chuỗi xử lý hoàn chỉnh (end-to-end pipeline) của một lượt gọi API LLM gồm những bước nào?
- Tại sao Streaming lại cải thiện trải nghiệm người dùng? Nó có giúp giảm tổng thời gian xử lý hoặc giảm chi phí Token không?
- Giữa SSE, WebSocket và HTTP Chunked, nên lựa chọn giao thức nào trong kịch bản Streaming output?
- Những loại lỗi nào từ API LLM có thể thực hiện retry? Những lỗi nào tuyệt đối không được retry?
- Tại sao các lượt gọi LLM bắt buộc phải thiết kế cơ chế lũy nghiệm (idempotency)?
- Tại sao cơ chế Rate Limiting cho LLM không thể chỉ dựa vào chỉ số QPS (Queries Per Second)?
- Một Model Gateway thông thường cần đảm nhận những năng lực cốt lõi nào?
- Log ghi nhận lượt gọi của ứng dụng AI tối thiểu phải bao gồm những trường dữ liệu nào?

## Structured Output và Gọi công cụ (Tool Calling)

Bài viết liên quan: [Structured Output của LLM: Từ hợp đồng JSON đến triển khai Function Calling thực tế](../llm-basis/structured-output-function-calling.md)

Chỉ cần đầu ra của mô hình đi vào hệ thống nghiệp vụ phía sau, chúng ta phải xử lý bài toán kiểm tra tính hợp lệ của định dạng (format validation), ràng buộc các trường dữ liệu và kiểm soát quyền hạn thực thi. Ứng viên rất dễ nhầm lẫn giữa JSON Mode, Structured Outputs, Function Calling, MCP Tool và API HTTP thông thường.

Câu hỏi phỏng vấn thường gặp:

- Tại sao việc chỉ nhắc mô hình "Hãy trả về định dạng JSON" là không đáng tin cậy trong môi trường production?
- JSON Mode và Structured Outputs khác nhau như thế nào?
- JSON Schema giải quyết bài toán gì trong các ứng dụng LLM?
- Chuỗi quy trình thực thi hoàn chỉnh của Function Calling gồm những bước nào?
- Điểm khác biệt giữa Function Calling và MCP (Model Context Protocol) là gì?
- Mối quan hệ giữa MCP Tool và một HTTP API thông thường là gì?
- Agent Skill và Function Calling có phải là cùng một khái niệm không?
- Khi việc phân tích cú pháp Structured Output thất bại thì hệ thống xử lý như thế nào?
- Tại sao việc gọi công cụ bắt buộc phải có cơ chế quản trị an toàn (security governance)?
- Làm thế nào để tóm tắt khái niệm Structured Output trong một câu ngắn gọn khi phỏng vấn?

## Đánh giá ứng dụng AI (AI Application Evaluation)

Bài viết liên quan: [Hệ thống đánh giá ứng dụng AI: Từ xây dựng Golden Set đến vòng lặp đóng Canary trên production](../llm-basis/llm-evaluation.md)

Các câu hỏi đánh giá xoay quanh việc làm thế nào để chứng minh một lần thay đổi mô hình, tinh chỉnh Prompt hay sửa đổi hệ thống thực sự mang lại kết quả tốt hơn. Golden Set, LLM-as-a-Judge, Trace Replay và triển khai Canary trên production bao quát các giai đoạn khác nhau—không thể chỉ dựa vào các bảng xếp hạng benchmark công khai hay một vài ca kiểm thử mẫu đơn giản.

Câu hỏi phỏng vấn thường gặp:

- Tại sao không thể chỉ dựa vào các benchmark công khai để đánh giá chất lượng của một ứng dụng AI cụ thể?
- Cần xây dựng Golden Set như thế nào? Ở giai đoạn Cold Start khi chưa có log production thì phải làm sao?
- LLM-as-a-Judge thường có những thiên kiến (bias) phổ biến nào? Làm thế nào để hạn chế chúng?
- Tại sao việc đánh giá RAG bắt buộc phải tách biệt thành hai giai đoạn độc lập: truy xuất (retrieval) và sinh câu trả lời (generation)?
- Tại sao việc đánh giá Agent lại phức tạp hơn nhiều so với hệ thống hỏi đáp thông thường hay RAG?
- Đánh giá offline, Trace Replay và triển khai Canary trên production lần lượt giải quyết các bài toán gì?
- Làm thế nào để cân bằng giữa tốc độ thực thi và độ bao phủ khi đưa đánh giá AI vào luồng CI (Continuous Integration)?
- Nếu kết quả đánh giá từ LLM-as-a-Judge mâu thuẫn với kết quả đánh giá thủ công của con người thì xử lý thế nào?

## Câu hỏi kịch bản tổng hợp

- Khi lịch sử hội thoại của Chatbot chăm sóc khách hàng liên tục phình to, làm thế nào để phân bổ ngân sách Token hợp lý mà vẫn giữ lại được các trạng thái nghiệp vụ quan trọng?
- Khi phản hồi Streaming bị gián đoạn kết nối giữa chừng, phía server xử lý cơ chế retry, truyền tiếp dữ liệu và phòng ngừa tính phí trùng lặp như thế nào?
- Khi nhà cung cấp mô hình kích hoạt giới hạn RPM (Requests Per Minute) hoặc TPM (Tokens Per Minute), Model Gateway xử lý việc xếp hàng, giáng cấp dịch vụ (degradation) hoặc chuyển mạch mô hình dự phòng (failover) ra sao?
- Sau khi mô hình sinh ra các tham số gọi công cụ hoàn tiền (refund tool), hệ thống nghiệp vụ cần thực hiện thêm những bước kiểm tra xác thực nào trước khi gọi cổng thanh toán?
- Sau khi thay đổi nhà cung cấp mô hình hoặc sửa đổi Prompt, làm thế nào để kết hợp đánh giá offline, Trace Replay và Canary production nhằm kiểm chứng hiệu quả một cách chặt chẽ?
