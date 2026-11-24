---
title: "Chuyên đề AI Agent: Agent Loop, Memory, Prompt, Context, MCP và Skills"
description: "Lộ trình học tập và phỏng vấn AI Agent, bao gồm Agent Loop, Memory, Prompt Engineering, Context Engineering, MCP, Agent Skills, Harness Engineering và AI Workflow."
category: AI
tag:
  - AI Agent
  - LLM
  - Phát triển ứng dụng AI
sidebar: false
lang: vi
sourceRef: zh-ref/ai/agent/README.md
---

Agent không đơn thuần là một "chatbot biết gọi công cụ". Một khi nhiệm vụ trở nên dài hơn, nó phải xử lý trạng thái (state), bộ nhớ (memory), phân quyền (permissions), thử lại khi thất bại (retry), cắt gọt ngữ cảnh (context trimming) và ranh giới thực thi.

**Chuyên đề AI Agent** này dành cho các lập trình viên muốn thấu hiểu và triển khai ứng dụng Agent trong thực tế, đặt Agent Loop, Memory, Prompt, Context, Tools, MCP, Skills, Harness Engineering và Workflow trên cùng một mạch kỹ thuật xuyên suốt.

## Phù hợp với ai

- Lập trình viên muốn hiểu rõ nguyên lý AI Agent và phương thức triển khai kỹ thuật thực tế.
- Kỹ sư đang phát triển các ứng dụng AI liên quan đến gọi công cụ (tool calling), tác vụ tự động hóa, suy luận nhiều lượt (multi-turn reasoning) và thực thi tác vụ dài.
- Các bạn đang chuẩn bị cho các câu hỏi phỏng vấn về Agent, MCP, Prompt, Context, Skills và Workflow.

## Trọng tâm học tập

- Sự khác biệt giữa Agent và Workflow không nằm ở việc có gọi mô hình lớn (LLM) hay không, mà ở chỗ có sở hữu vòng lặp khép kín gồm quan sát, lập kế hoạch, hành động và phản hồi hay không.
- Memory giải quyết bài toán lưu giữ thông tin qua nhiều lượt hội thoại và nhiều tác vụ, nhưng bắt buộc phải thiết kế vòng đời (lifecycle), ranh giới lưu trữ và quản trị quyền riêng tư.
- Prompt Engineering tập trung nhiều hơn vào cách diễn đạt chỉ thị, trong khi Context Engineering tập trung vào việc đưa đúng thông tin vào ngữ cảnh tại đúng thời điểm.
- MCP, Skills và Harness Engineering quyết định việc Agent có thể kết nối ổn định, an toàn và có khả năng mở rộng với các công cụ và môi trường thực tế hay không.

## Thứ tự đọc đề xuất

1. [Khái niệm cốt lõi về AI Agent](./agent-basis.md): Xây dựng góc nhìn tổng quan về Agent trước.
2. [Prompt Engineering cho mô hình lớn](./prompt-engineering.md), [Context Engineering](./context-engineering.md): Hiểu cách chỉ thị và ngữ cảnh cùng định hình đầu ra.
3. [Hệ thống bộ nhớ AI Agent](./agent-memory.md): Hoàn thiện mảnh ghép về bộ nhớ ngắn hạn, bộ nhớ dài hạn và vòng đời bộ nhớ.
4. [Mổ xẻ chi tiết giao thức MCP](./mcp.md), [Phân tích chuyên sâu về Agent Skills](./skills.md): Nắm vững cách tích hợp công cụ và mở rộng năng lực.
5. [Thiết kế hệ thống đa Agent phối hợp (Multi-Agent)](./multi-agent.md): Hiểu cách phân chia nhiệm vụ, chia sẻ trạng thái, xung đột đồng thời và khôi phục khi lỗi.
6. [Harness Engineering: Khung kiểm tra 6 lớp, quản lý ngữ cảnh và thực tiễn kỹ thuật](./harness-engineering.md), [Workflow, Graph và Loop trong AI Workflow](./workflow-graph-loop.md), [Loop Engineering là gì](./loop-engineering.md): Bước vào kỹ nghệ hiện thực hóa Agent ở cấp độ production.

Khi đọc cần lưu ý phân biệt ba tầng vòng lặp:

| Tầng | Chịu trách nhiệm về điều gì | Bài viết tương ứng |
| --- | --- | --- |
| Agent Loop tầng trong | Lặp lại suy luận, gọi công cụ, đọc kết quả trong một nhiệm vụ cho đến khi hoàn thành hoặc chạm điều kiện dừng. | [Khái niệm cốt lõi về AI Agent](./agent-basis.md#什么是-agent-loop) |
| Cạnh quay vòng trên đồ thị Workflow | Quay lại node trước đó dựa trên trạng thái và điều kiện, giúp luồng cục bộ tiếp tục lặp lại. | [Workflow, Graph và Loop](./workflow-graph-loop.md#loop-graph-上的回溯) |
| Loop Engineering tầng ngoài | Kết nối vòng lặp hiện có với CI, tác vụ định kỳ và điều kiện dừng, quyết định khi nào kích hoạt vòng nhiệm vụ tiếp theo. | [Loop Engineering](./loop-engineering.md) |

## Các bài viết cốt lõi

- [Khái niệm cốt lõi về AI Agent](./agent-basis.md): Tổng hợp tiến trình tiến hóa của AI Agent, giải thích rõ các khái niệm cơ bản như Agent Loop, Context Engineering, đăng ký Tools.
- [Hệ thống bộ nhớ AI Agent](./agent-memory.md): Đi sâu vào thiết kế bộ nhớ ngắn hạn và bộ nhớ dài hạn, nắm vững định dạng lưu trữ bộ nhớ, các thao tác vòng đời và chiến lược tối ưu hóa kỹ thuật cấp production.
- [Thiết kế hệ thống đa Agent phối hợp (Multi-Agent)](./multi-agent.md): Đi từ hợp đồng nhiệm vụ (task contract), trạng thái chia sẻ và xử lý xung đột đến điểm kiểm tra (checkpoint), tiếp quản (takeover), đền bù (compensation) và can thiệp thủ công.
- [Prompt Engineering cho mô hình lớn](./prompt-engineering.md): Đi từ 4 yếu tố cốt lõi của Prompt, các kỹ thuật phổ biến đến các thực tiễn an toàn cấp doanh nghiệp.
- [Context Engineering](./context-engineering.md): Nắm vững các kỹ thuật then chốt như điều phối quy tắc tĩnh, gắn thông tin động, hạ cấp hạn ngạch Token (Token budget).
- [Phân tích chuyên sâu về Agent Skills](./skills.md): Hiểu triết lý thiết kế của Skills cũng như điểm khác biệt bản chất giữa Skills với Prompt, MCP, Function Calling.
- [Mổ xẻ chi tiết giao thức MCP](./mcp.md): Nắm vững các khái niệm cốt lõi, thiết kế kiến trúc và best practices cấp production của giao thức MCP.
- [Harness Engineering: Khung kiểm tra 6 lớp, quản lý ngữ cảnh và thực tiễn kỹ thuật](./harness-engineering.md): Bóc tách tư duy thực tiễn trong kỹ nghệ hóa Agent của các đội ngũ OpenAI, Anthropic, Stripe...
- [Workflow, Graph và Loop trong AI Workflow](./workflow-graph-loop.md): So sánh sự khác biệt giữa workflow truyền thống và AI workflow, bao gồm cách triển khai với Spring AI Alibaba và LangGraph.
- [Loop Engineering là gì? Vì sao nói đây là bình mới rượu cũ?](./loop-engineering.md): Đặt Loop Engineering vào trong Agent Loop, Context, Harness, Skills, MCP và vòng khép kín xác thực để hiểu rõ nó thực sự mới ở điểm nào.

Nội dung đầy đủ về gọi công cụ và đánh giá (evaluation) nằm trong các bài viết đã có:

- [Đầu ra có cấu trúc và Function Calling](../llm-basis/structured-output-function-calling.md): Bao quát toàn bộ chuỗi gọi công cụ, phân quyền, xác nhận hai bước, tính lũy thừa (idempotency), kiểm toán (audit), timeout và ví dụ code Java.
- [Đánh giá ứng dụng Agent như thế nào](../llm-basis/llm-evaluation.md#agent-应用怎么评测): Bao quát các chỉ số như tỷ lệ hoàn thành nhiệm vụ, số lần gọi công cụ, quỹ đạo thực thi (execution trace), khả năng khôi phục lỗi và tính nhất quán qua nhiều lần chạy.

## Câu hỏi tần suất cao

- Agent khác gì với Workflow, Chatbot và việc gọi công cụ thông thường?
- Trong Agent Loop, các khâu quan sát, lập kế hoạch, hành động, phản tư chịu trách nhiệm về điều gì?
- Memory nên lưu gì và không nên lưu gì? Làm sao tránh ô nhiễm và rủi ro quyền riêng tư?
- Vì sao Prompt Engineering và Context Engineering không được đánh đồng với nhau?
- Ranh giới giữa MCP, Skills và Function Calling nằm ở đâu?
- Agent xử lý tác vụ dài kiểm soát ngữ cảnh, quyền hạn, thử lại khi lỗi và khả năng quan sát (observability) như thế nào?

## Chuyên đề liên quan

- [Hệ thống tri thức phát triển ứng dụng AI](../)
- [Chuyên đề nền tảng mô hình lớn (LLM)](../llm-basis/)
- [Chuyên đề RAG](../rag/)
- [Chuyên đề câu hỏi phỏng vấn phát triển ứng dụng AI](../interview-questions/)
- [Trả lời phỏng vấn về dự án Agent như thế nào?](../interview-questions/agent-project-interview-guide.md)

## Tổng kết

Các thách thức kỹ thuật của Agent sẽ dần lộ diện khi tác vụ trở nên dài hơn: mô hình phải đưa ra quyết định trong vòng lặp dựa trên trạng thái, thông tin lịch sử cần được lưu trữ và truy xuất, công cụ bên ngoài cần có quy tắc kết nối, quyền hạn và kiểm toán rõ ràng, và các lỗi phát sinh phải có khả năng phát lại (replay) và xử lý.

Khi đọc, trước hết hãy phân định rõ trách nhiệm giữa Agent, Workflow và gọi công cụ thông thường, sau đó hoàn thiện dần các chi tiết triển khai dọc theo chuỗi Prompt, Context, Memory, MCP, Skills và Harness. Khi thực hiện dự án cụ thể, hãy bắt đầu từ một vòng lặp khép kín nhỏ nhất có thể xác thực được, rồi bổ sung cơ chế dựa trên các vấn đề thực tế phát sinh về ngữ cảnh, chi phí, quyền hạn hoặc độ ổn định.
