---
title: "Chuyên đề Thiết kế Hệ thống AI: Từ Kiến trúc Production đến Bảo mật, Khả năng Quan sát và Voice Agent"
description: "Lộ trình học tập kiến trúc và phỏng vấn thiết kế hệ thống AI, bao gồm kiến trúc ứng dụng AI cấp độ production, bảo mật Agent, LLM Gateway, OpenTelemetry Trace, AI Observability, kiểm soát chi phí và Voice Agent thời gian thực."
category: AI
tag:
  - Thiết kế hệ thống AI
  - LLM
  - Phát triển ứng dụng AI
  - AI Observability
sidebar: false
lang: vi
sourceRef: zh-ref/ai/system-design/README.md
---

Một Prompt Demo chạy được chỉ chứng minh rằng mô hình đã đưa ra được một câu trả lời khả dụng trong một trường hợp mẫu cụ thể. Khi đưa vào môi trường production, chúng ta vẫn phải tiếp tục giải quyết hàng loạt bài toán kỹ thuật: Định tuyến mô hình như thế nào? Xử lý fallback ra sao khi xảy ra sự cố? Phân bổ chi phí Token (cost attribution) thế nào? Làm sao tái hiện từng bước trong một yêu cầu của Agent? Ai là người ủy quyền và kiểm toán (audit) các công cụ nhạy cảm?

**Chuyên đề Thiết kế Hệ thống AI** này dành cho những lập trình viên đã từng làm qua Demo và đang chuẩn bị tích hợp năng lực AI vào các nghiệp vụ thực tế. Nội dung được triển khai theo góc nhìn của hệ thống backend: phân tầng kiến trúc, LLM Gateway, RAG, Memory, Tool calling, khả năng quan sát (observability), đánh giá (evaluation), quản trị bảo mật và chuỗi xử lý giọng nói thời gian thực.

## Đối tượng phù hợp

- Lập trình viên đã làm qua các Demo về Prompt hoặc RAG, muốn tìm hiểu xem trước khi đưa lên production hệ thống còn thiếu những mắt xích kỹ thuật nào.
- Kỹ sư cần thiết kế LLM Gateway, định tuyến đa mô hình (multi-model routing), fallback, rate limiting, caching và kiểm soát chi phí trong dự án thực tế.
- Các bạn đang chuẩn bị cho các câu hỏi phỏng vấn liên quan đến thiết kế hệ thống AI, LLM Gateway, AI Observability và Voice Agent thời gian thực.

## Trọng tâm học tập

- Ứng dụng AI cấp production chú trọng vào khả năng vận hành bền vững: chất lượng đầu ra, độ trễ, phương án dự phòng khi thất bại, chi phí và kiểm toán đều phải có thể giải trình và mổ xẻ đánh giá lại được.
- LLM Gateway tách biệt dịch vụ mô hình và bên gọi nghiệp vụ, chịu trách nhiệm xử lý tập trung định tuyến đa mô hình, fallback, rate limiting, caching, hạn mức Token, phân bổ chi phí, giám sát kiểm toán và các chính sách bảo mật.
- Quản lý Prompt, RAG, Memory, Tool calling, tác vụ bất đồng bộ, đánh giá và khả năng quan sát cần phải được thiết kế trên cùng một chuỗi xử lý (pipeline); rất khó để áp dụng một khuôn mẫu chung cho mọi trường hợp, thông thường cần phải đánh đổi dựa theo rủi ro nghiệp vụ, lưu lượng gọi và ràng buộc chi phí.
- AI Observability phải cho phép đào sâu (drill-down) từ một request giao diện xuống tới mô hình, truy xuất dữ liệu, công cụ và Agent, đồng thời xử lý việc lan truyền ngữ cảnh qua các Thread (cross-thread context propagation), lấy mẫu (sampling), bảo vệ dữ liệu nhạy cảm và vòng phản hồi badcase từ thực tế.
- Voice Agent thời gian thực ngoài việc suy luận văn bản còn phải xử lý VAD, ASR, LLM, TTS, phát âm thanh dạng stream, xử lý ngắt lời (interruption) và lựa chọn mô hình kết hợp client-cloud, vốn cực kỳ nhạy cảm với độ trễ đầu cuối (end-to-end latency).

## Thứ tự đọc khuyến nghị

1. [Thiết kế Hệ thống Ứng dụng AI](./ai-application-architecture.md): Trước tiên hãy tìm hiểu xem khi chuyển một Prompt Demo sang pipeline production thì cần bổ sung những năng lực backend nào.
2. [Thực chiến Bảo mật LLM/Agent](./llm-security.md): Dõi theo một lượt gọi công cụ để hiểu rõ về Prompt Injection trực tiếp và gián tiếp, phân quyền tài nguyên, phê duyệt, ủy quyền MCP, cô lập môi trường và kiểm thử hồi quy bảo mật.
3. [Phân tích Chi tiết về LLM Gateway](./llm-gateway.md): Tiếp tục tìm hiểu về quản trị gọi mô hình, cách tổ chức định tuyến đa mô hình, fallback, rate limiting và phân bổ chi phí ở tầng gateway.
4. [AI Observability và Tracing](./ai-observability.md): Tái hiện lại quá trình thực thi của mô hình, RAG, công cụ và Agent qua một câu trả lời lỗi, sau đó tìm hiểu về lan truyền ngữ cảnh, lấy mẫu và vòng phản hồi đánh giá.
5. [Phân tích Chi tiết Công nghệ AI Voice](./ai-voice.md): Cuối cùng là Voice Agent, từ VAD, ASR cho đến LLM, TTS, phát âm thanh dạng stream và xử lý ngắt lời.

## Các bài viết cốt lõi

- [Thiết kế Hệ thống Ứng dụng AI](./ai-application-architecture.md): Trình bày từ quản lý Prompt đến LLM Gateway, RAG, Memory, Tool calling, tác vụ bất đồng bộ, observability, evaluation và tuân thủ bảo mật; thích hợp làm khung xương chính cho thiết kế hệ thống.
- [Thực chiến Bảo mật LLM/Agent](./llm-security.md): Thông qua kịch bản Agent hoàn tiền sau bán hàng để xâu chuỗi Prompt Injection gián tiếp, vượt quyền công cụ, ủy quyền MCP, dữ liệu nhạy cảm, cô lập mã nguồn, chuỗi cung ứng và đánh giá bảo mật.
- [Phân tích Chi tiết về LLM Gateway](./llm-gateway.md): Làm rõ trách nhiệm của LLM Gateway trong định tuyến mô hình, fallback, hạn ngạch rate limit, ngân sách Token, phân bổ chi phí, giám sát kiểm toán và chiến lược caching.
- [AI Observability và Tracing](./ai-observability.md): Giải thích rõ ràng về Session, Run, Trace, Span và Attempt, bao quát Agent/RAG/Tool Span, lan truyền ngữ cảnh, lấy mẫu, dữ liệu nhạy cảm và tích hợp Spring AI.
- [Phân tích Chi tiết Công nghệ AI Voice](./ai-voice.md): Triển khai dọc theo chuỗi hệ thống giọng nói gồm VAD, ASR, LLM, TTS, phát stream, xử lý ngắt lời và lựa chọn kiến trúc kết hợp client-cloud.

## Câu hỏi tần suất cao

- Prompt Demo trước khi lên production còn thiếu những năng lực kỹ thuật nào?
- Khi Agent đọc tài liệu bên ngoài và gọi công cụ ghi dữ liệu, làm thế nào để ngăn chặn injection, vượt quyền và rò rỉ dữ liệu ra ngoài?
- Tại sao các ứng dụng AI thường tập trung việc gọi mô hình về tầng Gateway?
- Định tuyến đa mô hình, fallback, rate limiting và caching giải quyết những bài toán cụ thể nào?
- Một request của Agent nên được chia tách thành các Span như thế nào, và làm sao duy trì Trace khi đi qua nhiều Thread và nhiều dịch vụ?
- Làm thế nào để đưa các Trace thất bại trên production trở lại bộ dữ liệu đánh giá và kiểm tra hồi quy?
- Tại sao độ trễ, ngắt lời và lựa chọn client-cloud trong Voice Agent thời gian thực lại khó xử lý hơn?

## Tổng kết

Độ khó của hệ thống AI cấp production không nằm ở việc chạy thông một lần gọi mô hình, mà nằm ở việc đặt chất lượng, độ trễ, chi phí, phân quyền và xử lý sự cố vào trong cùng một chuỗi xử lý có khả năng truy vết hoàn chỉnh. Bạn có thể bắt đầu từ kiến trúc ứng dụng để hiểu cách phân tầng các năng lực này, sau đó dùng LLM Gateway để quản trị tập trung các lượt gọi, thông qua Trace để tái hiện quá trình thực thi của RAG, công cụ và Agent, và cuối cùng kết hợp với Voice Agent để hiểu về luồng stream, xử lý ngắt lời và sự đánh đổi giữa client và cloud trong các kịch bản thời gian thực. Phương án cụ thể vẫn luôn cần được lựa chọn dựa trên mức độ rủi ro nghiệp vụ, quy mô lượt gọi và các yêu cầu tuân thủ.

## Chuyên đề liên quan

- [Hệ thống Kiến thức Phát triển Ứng dụng AI](../)
- [Chuyên đề Nền tảng Mô hình Lớn (LLM Basis)](../llm-basis/)
- [Chuyên đề AI Agent](../agent/)
- [Chuyên đề RAG](../rag/)
- [Chuyên đề Câu hỏi Phỏng vấn Phát triển Ứng dụng AI](../interview-questions/)
