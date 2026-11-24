---
title: "Chuyên đề Nền tảng LLM: Cơ chế vận hành, Gọi API, Dữ liệu có cấu trúc và Đánh giá"
description: "Lộ trình học tập và phỏng vấn nền tảng LLM, bao quát cơ chế vận hành của LLM, thực tiễn kỹ thuật gọi API, dữ liệu trả về có cấu trúc, Function Calling, Tool Calling và đánh giá ứng dụng AI."
category: AI
tag:
  - LLM
  - Mô hình ngôn ngữ lớn
  - Phát triển ứng dụng AI
sidebar: false
lang: vi
sourceRef: zh-ref/ai/llm-basis/README.md
---

API của mô hình lớn thoạt nhìn chỉ là một lượt gửi request và một lượt nhận response, nhưng trong triển khai thực tế, mọi rắc rối đều ẩn chứa trong từng chi tiết: Token bị tiêu hao thế nào, tại sao context window không nhét vừa, tham số lấy mẫu có làm câu trả lời bị lệch lạc không, tại sao structured output lại thi thoảng bị lỗi, và làm sao chứng minh được hiệu quả thực sự tốt hơn trước khi release lên production.

**Chuyên đề Nền tảng LLM** này được thiết kế dành cho việc nhập môn và triển khai kỹ thuật phát triển ứng dụng AI, làm sáng tỏ những vấn đề nền tảng này trước tiên, để khi bước tiếp vào Agent, RAG và Thiết kế hệ thống bạn sẽ thấy thuận lợi hơn rất nhiều.

## Dành cho ai?

- Lập trình viên đang tìm hiểu các khái niệm cơ bản về LLM và cách gọi API của mô hình lớn.
- Kỹ sư đã từng làm Prompt Demo nhưng chưa quen thuộc với chuỗi gọi cấp độ production, structured output và quy trình đánh giá.
- Các bạn đang chuẩn bị cho các câu hỏi phỏng vấn liên quan đến nền tảng LLM, Function Calling, Tool Calling và đánh giá ứng dụng AI.

## Trọng tâm học tập

- Các tham số như Token, context window, Temperature, Top P, từ dừng (stop sequence)... ảnh hưởng ra sao đến đầu ra của mô hình.
- Việc gọi API LLM cấp độ production cần xử lý phản hồi streaming, timeout, retry, rate limit, fallback, ghi log và kiểm toán.
- Structured output không thể chỉ dựa vào Prompt, mà phải kết hợp JSON Schema, Function Calling, Tool Calling và kiểm tra phía server; đồng thời luôn phải chuẩn bị phương án dự phòng (fallback) khi thất bại.
- Đánh giá ứng dụng AI cần phân biệt rõ giữa Golden Set offline, LLM-as-Judge, phát hành canary trên production, phát lại Trace (Trace replay) và kiểm thử hồi quy liên tục.

## Thứ tự đọc gợi ý

1. [Cơ chế vận hành của LLM: Token, context window và tham số lấy mẫu ảnh hưởng thế nào đến kết quả](./llm-operation-mechanism.md): Hiểu rõ về Token, context window và các tham số lấy mẫu trước tiên.
2. [Thực tiễn kỹ thuật gọi API LLM](./llm-api-engineering.md): Xem xét cách đưa việc gọi mô hình lớn vào chuỗi backend thực tế.
3. [Chi tiết về dữ liệu trả về có cấu trúc của LLM](./structured-output-function-calling.md): Hoàn thiện nền tảng về trả về dữ liệu có cấu trúc và gọi công cụ.
4. [Hệ thống đánh giá ứng dụng AI](./llm-evaluation.md): Xây dựng phương pháp đánh giá chất lượng và kiểm thử hồi quy trước khi release.

## Các bài viết cốt lõi

- [Cơ chế vận hành của LLM: Token, context window và tham số lấy mẫu ảnh hưởng thế nào đến kết quả](./llm-operation-mechanism.md): Biến các khái niệm như Token, context window, Temperature thành các tham số kỹ thuật có thể quan sát và debug được.
- [Thực tiễn kỹ thuật gọi API LLM](./llm-api-engineering.md): Phân tích chi tiết chuỗi sản xuất gọi API LLM trong ứng dụng AI, bao quát phản hồi streaming, retry, rate limit, dữ liệu trả về có cấu trúc và tích hợp kỹ thuật backend.
- [Chi tiết về dữ liệu trả về có cấu trúc của LLM](./structured-output-function-calling.md): Làm rõ JSON Schema, Function Calling, Tool Calling và MCP lần lượt đảm nhận vai trò gì trong một lượt gọi công cụ.
- [Hệ thống đánh giá ứng dụng AI](./llm-evaluation.md): Từ Golden Set, LLM-as-Judge, các chỉ số RAG/Agent, phát lại Trace đến CI regression, giải thích cách nghiệm thu ứng dụng AI bài bản.

## Câu hỏi tần suất cao

- Tại sao cùng một Prompt mỗi lần trả lời lại cho ra kết quả khác nhau?
- Context window càng lớn thì có chắc chắn là càng tốt không?
- Tại sao structured output lại thi thoảng bị lỗi? Làm thế nào để thiết lập cơ chế fallback và validation?
- Function Calling, Tool Calling và MCP giải quyết những vấn đề gì khác nhau?
- Trước khi release ứng dụng AI, làm sao chứng minh được "kết quả đã thực sự tốt hơn" chứ không chỉ dựa vào cảm tính?

## Các chuyên đề liên quan

- [Hệ thống kiến thức phát triển ứng dụng AI](../)
- [Chuyên đề AI Agent](../agent/)
- [Chuyên đề RAG](../rag/)
- [Chuyên đề câu hỏi phỏng vấn phát triển ứng dụng AI](../interview-questions/)
