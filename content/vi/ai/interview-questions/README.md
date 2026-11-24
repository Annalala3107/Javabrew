---
title: Chuyên đề câu hỏi phỏng vấn phát triển ứng dụng AI
description: Tổng hợp câu hỏi phỏng vấn và lộ trình ôn tập phát triển ứng dụng AI, tập trung vào nền tảng LLM, AI Agent, RAG và thiết kế hệ thống AI, phù hợp cho AI Engineer và kỹ sư Backend chuyển hướng sang AI.
category: AI
tag:
  - AI
  - Phỏng vấn AI
  - Phỏng vấn Backend
sidebar: false
lang: vi
sourceRef: zh-ref/ai/interview-questions/README.md
---

Phỏng vấn vị trí phát triển ứng dụng AI rất hiếm khi chỉ dừng lại ở việc hỏi "khái niệm này là gì". Phổ biến hơn nhiều là người phỏng vấn sẽ đào sâu theo từng dự án thực tế: tại sao lại thiết kế như vậy, khi phát sinh sự cố thì điều tra gỡ lỗi (debug) ra sao, sau khi lên production thì đánh giá (eval) thế nào, và bài toán chi phí cũng như bảo mật được quản lý ra sao.

Tài liệu **Chuyên đề câu hỏi phỏng vấn phát triển ứng dụng AI** này được xây dựng dành cho AI Engineer, kỹ sư phát triển ứng dụng AI và các lập trình viên Backend đang chuyển hướng sang AI, xâu chuỗi các chủ đề cốt lõi gồm "Nền tảng LLM, AI Agent, RAG và Thiết kế hệ thống AI" thành một lộ trình ôn tập mạch lạc.

## Đối tượng phù hợp

- Ứng viên đang chuẩn bị phỏng vấn các vị trí phát triển ứng dụng AI, AI Engineer hoặc kỹ sư Backend chuyển hướng sang AI.
- Người đã nắm được một số khái niệm AI nhưng khi trả lời phỏng vấn dễ bị lan man, thiếu chiều sâu, hoặc chỉ dừng lại ở mức demo thử nghiệm.
- Lập trình viên muốn hệ thống lại kinh nghiệm dự án theo cấu trúc mạch lạc: "Vấn đề -> Nguyên lý -> Giải pháp -> Đánh đổi (Trade-off) -> Triển khai thực tế".

## Trọng tâm học tập

- **Nền tảng LLM:** Nắm vững và giải thích rõ về Token, Context Window, tham số lấy mẫu (sampling parameters), Structured Output, chuỗi gọi mô hình và quy trình đánh giá (eval).
- **AI Agent:** Làm rõ Agent Loop, Memory, Prompt, Context, MCP, Skills và quy trình luồng công việc (Workflow).
- **RAG:** Nắm chắc xử lý tài liệu, truy xuất vector, truy xuất kết hợp (Hybrid Search), Rerank, GraphRAG, cập nhật cơ sở tri thức và đánh giá RAG.
- **Thiết kế hệ thống AI:** Hiểu sâu về Model Gateway, khả năng quan sát (Observability), kiểm soát chi phí, an toàn bảo mật, triển khai Canary và Voice Agent thời gian thực.

## Thứ tự đọc khuyến nghị

1. [Hướng dẫn phỏng vấn phát triển ứng dụng AI](./ai-interview-guide.md): Bắt đầu từ bài tổng quan để định hình bức tranh toàn cảnh lộ trình ôn tập.
2. [Tổng hợp câu hỏi phỏng vấn nền tảng LLM](./llm-interview-questions.md): Củng cố các khái niệm cốt lõi về LLM và chuỗi gọi API.
3. [Tổng hợp câu hỏi phỏng vấn AI Agent](./agent-interview-questions.md): Nắm vững các khái niệm tần suất cao và bài toán kỹ thuật triển khai Agent trong thực tế.
4. [Trình bày dự án Agent khi phỏng vấn như thế nào?](./agent-project-interview-guide.md): Cấu trúc kinh nghiệm thành bối cảnh dự án, kiến trúc hệ thống, lựa chọn công nghệ, bằng chứng hiệu quả và phân tích bài học từ Badcase.
5. [Tổng hợp câu hỏi phỏng vấn RAG](./rag-interview-questions.md): Tập trung vào hệ thống hỏi đáp cơ sở tri thức doanh nghiệp, ôn tập bài toán recall, ranking, cập nhật dữ liệu và đánh giá.
6. [Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống AI](./ai-system-design-interview-questions.md): Xâu chuỗi các module trên thành kỹ năng thiết kế hệ thống cấp production.

## Các bài viết cốt lõi

- [Hướng dẫn phỏng vấn phát triển ứng dụng AI](./ai-interview-guide.md): Cổng thông tin tổng hợp câu hỏi phỏng vấn phát triển ứng dụng AI, tổ chức lộ trình theo nền tảng LLM, AI Agent, RAG và thiết kế hệ thống AI.
- [Tổng hợp câu hỏi phỏng vấn nền tảng LLM](./llm-interview-questions.md): Bao quát Token, Context Window, tham số lấy mẫu, gọi API, Structured Output, Function Calling, MCP và đánh giá ứng dụng AI.
- [Tổng hợp câu hỏi phỏng vấn AI Agent](./agent-interview-questions.md): Bao quát khái niệm cốt lõi Agent, Memory, Prompt Engineering, Context Engineering, MCP, Agent Skills, Harness Engineering và AI Workflow.
- [Trình bày dự án Agent khi phỏng vấn như thế nào?](./agent-project-interview-guide.md): Dùng chuỗi bằng chứng có thể kiểm chứng để giải thích rõ kiến trúc, lựa chọn kỹ thuật, chỉ số đo lường và bài học Badcase của dự án Agent, tránh việc chỉ liệt kê từ khóa sáo rỗng.
- [Tổng hợp câu hỏi phỏng vấn RAG](./rag-interview-questions.md): Bao quát nền tảng RAG, Embedding, Vector Database, chiến lược Chunking, xử lý tài liệu, tối ưu hóa truy xuất, GraphRAG, cập nhật cơ sở tri thức và đánh giá RAG.
- [Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống AI](./ai-system-design-interview-questions.md): Bao quát kiến trúc cấp production, Model Gateway, quản lý Prompt, Observability, đánh giá, quản trị an toàn và Voice Agent thời gian thực.

## Câu hỏi tần suất cao

- Khi người phỏng vấn hỏi "Bạn đã từng làm ứng dụng AI nào chưa?", làm thế nào để trả lời bài bản từ bối cảnh nghiệp vụ, kiến trúc, đánh giá hiệu quả đến quản trị vận hành production?
- Tại sao khi gọi API của LLM lại cần cơ chế retry, rate limit, fallback và kiểm tra cấu trúc (schema validation)?
- Điểm khác biệt cốt lõi giữa AI Agent và một Workflow thông thường là gì?
- Khi hệ thống RAG không truy xuất được, truy xuất sai, hoặc sinh câu trả lời sai, quy trình phân tích và gỡ lỗi (debug) cho từng trường hợp như thế nào?
- Trong thiết kế hệ thống ứng dụng AI, các yếu tố về tính ổn định, Observability, kiểm soát chi phí và quản trị an toàn được thể hiện ra sao?

## Chuyên đề liên quan

- [Hệ thống kiến thức phát triển ứng dụng AI](../)
- [Chuyên đề nền tảng LLM](../llm-basis/)
- [Chuyên đề AI Agent](../agent/)
- [Chuyên đề RAG](../rag/)
