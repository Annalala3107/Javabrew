---
title: "Hệ thống kiến thức phát triển ứng dụng AI: LLM, Agent, RAG, MCP, Prompt Engineering và Thiết kế hệ thống"
description: "Lộ trình học tập và phỏng vấn phát triển ứng dụng AI, tổng hợp cho lập trình viên backend về gọi LLM, Agent, RAG, Skills, MCP, Prompt Engineering, cơ sở dữ liệu vector, đánh giá và thiết kế hệ thống."
category: AI
tag:
  - AI
  - LLM
  - Phát triển ứng dụng AI
  - Phỏng vấn Backend
icon: mdi:robot-outline
sitemap:
  changefreq: weekly
  priority: 1
head:
  - - meta
    - name: keywords
      content: Phát triển ứng dụng AI, Phỏng vấn phát triển ứng dụng AI, Phỏng vấn kỹ sư AI, LLM, Phỏng vấn LLM, Agent, Phỏng vấn Agent, RAG, Phỏng vấn RAG, MCP, Prompt Engineering, Cơ sở dữ liệu vector, Thiết kế hệ thống AI, Phỏng vấn lập trình AI
  - - meta
    - property: og:title
      content: "Hệ thống kiến thức phát triển ứng dụng AI: LLM, Agent, RAG, MCP, Prompt Engineering và Thiết kế hệ thống"
  - - meta
    - property: og:description
      content: "Từ gọi API LLM, Agent, RAG, MCP, Prompt Engineering đến đánh giá và thiết kế hệ thống, tổng hợp các kiến thức cốt lõi mà lập trình viên backend cần trang bị khi bước vào phát triển ứng dụng AI."
lang: vi
sourceRef: zh-ref/ai/README.md
---

Làm ứng dụng AI không đơn thuần chỉ là nhét Prompt vào API là xong. Khi bước vào dự án thực tế, bạn sẽ lập tức đối mặt với hàng loạt vấn đề như độ dài ngữ cảnh (context window), xuất dữ liệu có cấu trúc (structured output), độ chuẩn xác khi truy xuất RAG, phân quyền công cụ, kiểm thử hồi quy (evaluation regression), chi phí và tính ổn định.

Những vấn đề này không thể giải quyết riêng rẽ. Nền tảng LLM, Agent, RAG, gọi công cụ (tool calling) và thiết kế hệ thống phải được liên kết chặt chẽ với nhau—nếu chỉ biết gọi API, bạn sẽ bị nghẽn ngay khi họp review kiến trúc; nếu chỉ đọc các bài báo nghiên cứu về RAG, bạn vẫn sẽ lúng túng không biết xử lý cập nhật dữ liệu tăng dần và loại bỏ trùng lặp phiên bản khi vận hành kho tri thức thực tế.

Nếu thời gian có hạn, hãy xem trước [Cẩm nang phỏng vấn phát triển ứng dụng AI](./interview-questions/ai-interview-guide.md) để điểm qua những câu hỏi thường bị truy vấn sâu nhất về LLM, Agent, RAG, Skills, MCP và thiết kế hệ thống AI; nếu muốn bổ sung kiến thức một cách vững chắc, hãy đi theo thứ tự đọc gợi ý dưới đây.

Nội dung chuyên đề được tổ chức theo các trục: Nền tảng LLM, Agent, RAG và Thiết kế hệ thống, kết nối qua thứ tự đọc và các liên kết liên quan:

![Tổng quan nội dung AIGuide với nhiều sơ đồ minh họa](/media/jg/ext/oss.javaguide.cn/github/aiguide/aiguide-overview-b9f49b36.png)

Nội dung chuyên mục này đồng thời được lưu trữ trong dự án mã nguồn mở AIGuide:

- **Địa chỉ dự án**: [https://github.com/Snailclimb/AIGuide](https://github.com/Snailclimb/AIGuide)
- **Đọc trực tuyến**: [https://javaguide.cn/ai/](https://javaguide.cn/ai/)

Các bài viết sẽ được liên tục hiệu đính theo sự thay đổi của API, framework và năng lực mô hình. Khi liên quan đến phiên bản, giá cả và tính năng sản phẩm, vui lòng đối chiếu đồng thời với tài liệu chính thức tương ứng.

## Dành cho ai?

- Kỹ sư đang từ lập trình backend chuyển hướng sang phát triển ứng dụng AI, muốn trang bị đầy đủ kiến thức chủ chốt về LLM, Agent, RAG và thiết kế hệ thống.
- Các bạn đang chuẩn bị phỏng vấn cho các vị trí AI Engineer, AI Application Developer, hoặc lập trình viên Backend chuyển hướng sang AI.
- Lập trình viên đã từng làm Prompt Demo nhưng chưa nắm vững chuỗi gọi mô hình (invocation pipeline), structured output, tối ưu hóa truy xuất RAG và vòng lặp đánh giá (evaluation loop).
- Bạn đọc muốn đưa các khái niệm như MCP, Function Calling, Tool Calling, cơ sở dữ liệu vector, Model Gateway vào bối cảnh dự án thực tế.
- Thành viên các nhóm đã tích hợp LLM vào dự án nhưng bắt đầu gặp phải các bài toán về độ ổn định, chi phí, quản trị bảo mật và suy giảm chất lượng.

## Những cái bẫy thường gặp

Tuyệt đối không nên coi LLM như một API hộp đen đơn thuần. Token bị cắt ngắn (truncate), tham số lấy mẫu (sampling parameters) thay đổi làm câu trả lời bị lệch lạc, hay dù đã yêu cầu trả về JSON nhưng kết quả vẫn bị vỡ cấu trúc—những vấn đề này rất khó khắc phục triệt để chỉ bằng Prompt. Việc thêm câu "Vui lòng xuất ra đúng định dạng JSON" vào prompt chỉ được coi là lớp ràng buộc đầu tiên; khi triển khai thực tế trên production, bạn bắt buộc phải có kiểm tra định dạng (format validation), cơ chế thử lại (retry), phương án dự phòng (fallback) và xử lý ngoại lệ trong toàn bộ chuỗi gọi.

Agent cũng không chỉ đơn giản là việc tự động gọi công cụ. Thách thức cốt lõi nằm ở Memory và Context Engineering. Nếu ngữ cảnh không được quản trị tốt, Agent rất dễ đi chệch đề sau vài vòng lặp: những gì đã nói trước đó, tác vụ hiện tại đã đi đến bước nào, kết quả công cụ nào còn giá trị sử dụng—tất cả đều có thể bị rối loạn. Trong các tác vụ dài (long-running tasks), điều này càng rõ ràng: đôi khi mô hình không phải không biết làm, mà là sau vài vòng lặp nó tự làm mình bị rối, chạy miệt mài cho tới khi cạn kiệt token mới dừng lại.

Khi RAG trả lời không đúng trọng tâm, nhiều lúc đừng vội trách mô hình. Phần lớn vấn đề thực chất nằm ở giai đoạn truy xuất (retrieval phase): Chunk cắt quá thô, Query không được viết lại (rewrite), chưa kết hợp giữa tìm kiếm từ khóa và tìm kiếm vector, hoặc khâu chấm điểm xếp hạng lại (reranking) chưa tốt. Lúc này, việc rà soát từng bước trong chuỗi truy xuất thường đem lại hiệu quả rõ rệt hơn nhiều so với việc đổi sang một mô hình đắt tiền hơn.

Những khái niệm như MCP, Function Calling, Tool Calling sinh ra để giải quyết vấn đề công cụ được tích hợp vào như thế nào. Sau khi chuẩn hóa giao thức, việc gắn thêm công cụ trở nên thuận tiện hơn rất nhiều, nhưng khi bước vào môi trường production, rắc rối thực sự lại nằm ở phía sau: ai được quyền gọi công cụ này, được thao tác trên dữ liệu nào, ghi log kiểm toán (audit log) ra sao, thất bại thì rollback thế nào. Nếu những điều này không được thiết kế kỹ lưỡng, thì giao thức có chuẩn đến mấy cũng không đủ dùng.

Một khi ứng dụng AI đi vào vận hành thực tế, các vấn đề về độ ổn định, khả năng quan sát (observability), kiểm soát chi phí và kiểm thử hồi quy chất lượng sẽ lập tức bộc lộ. Giai đoạn Demo thường khó cảm nhận được vì lưu lượng gọi ít và kịch bản sạch sẽ. Chỉ khi tiếp nhận lưu lượng nghiệp vụ thực tế, hầu hết các nhóm lần đầu xây dựng ứng dụng AI cấp độ production mới thực sự thấm thía bài học từ những vấn đề này.

## Thứ tự đọc gợi ý

1. [Tổng quan khái niệm cốt lõi AI](./ai-core-concepts.md): Đặt các khái niệm LLM, Token, Agent, RAG, MCP, Skills, ReAct vào cùng một chuỗi liên kết logic.
2. [Cẩm nang phỏng vấn phát triển ứng dụng AI](./interview-questions/ai-interview-guide.md): Xây dựng danh sách các câu hỏi tần suất cao, nắm rõ những điểm thường bị truy vấn sâu nhất trong phỏng vấn và đánh giá dự án.
3. [Cơ chế vận hành của LLM](./llm-basis/llm-operation-mechanism.md), [Thực tiễn kỹ thuật gọi API LLM](./llm-basis/llm-api-engineering.md): Hiểu rõ chuỗi gọi mô hình, ngữ cảnh và dữ liệu trả về có cấu trúc.
4. [Khái niệm cốt lõi về AI Agent](./agent/agent-basis.md), [Kỹ thuật viết Prompt cho LLM](./agent/prompt-engineering.md), [Context Engineering](./agent/context-engineering.md): Xây dựng nhận thức nền tảng về Agent, Prompt và Context.
5. [Thiết kế hệ thống cộng tác Multi-Agent](./agent/multi-agent.md): Tiếp tục học về phân tách tác vụ, chia sẻ trạng thái, xử lý xung đột và phục hồi sau sự cố.

   Thứ tự đầy đủ cho Memory, MCP, Skills, Harness, Workflow, Loop có thể xem tại [README chuyên đề Agent](./agent/README.md).

6. [Khái niệm nền tảng về RAG](./rag/rag-basis.md), [Chiến lược xử lý và phân tách tài liệu RAG](./rag/rag-document-processing.md), [Tối ưu hóa truy xuất RAG](./rag/rag-optimization.md): Hoàn thiện trục chính về hỏi đáp trên kho tri thức doanh nghiệp.
7. [Thiết kế hệ thống ứng dụng AI](./system-design/ai-application-architecture.md), [Bảo mật thực chiến cho LLM/Agent](./system-design/llm-security.md), [Chi tiết về LLM Gateway](./system-design/llm-gateway.md), [Hệ thống đánh giá ứng dụng AI](./llm-basis/llm-evaluation.md): Đưa Demo vào hệ thống backend thực tế, hoàn thiện phân quyền, bảo mật, gateway, đánh giá và quản trị.

## Các bài viết cốt lõi

### Lộ trình ôn tập & Phỏng vấn

- [Tổng quan khái niệm cốt lõi AI](./ai-core-concepts.md): Xâu chuỗi các khái niệm trọng tâm như LLM, Token, MCP, Skills, ReAct, Embedding, GraphRAG theo 3 trục: Nền tảng LLM, Agent và RAG.
- [Chuyên đề câu hỏi phỏng vấn phát triển ứng dụng AI](./interview-questions/): Tổ chức lộ trình ôn tập theo Nền tảng LLM, AI Agent, RAG và Thiết kế hệ thống AI.
- [Cẩm nang phỏng vấn phát triển ứng dụng AI](./interview-questions/ai-interview-guide.md): Tập hợp các câu hỏi truy vấn sâu thường gặp trong phát triển ứng dụng AI vào một lộ trình ôn tập, thích hợp để đọc đầu tiên.
- [Tổng hợp câu hỏi phỏng vấn nền tảng LLM](./interview-questions/llm-interview-questions.md): Bao quát về Token, context window, tham số lấy mẫu, gọi API, structured output và hệ thống đánh giá.
- [Tổng hợp câu hỏi phỏng vấn AI Agent](./interview-questions/agent-interview-questions.md): Bao quát về Agent Loop, Memory, Prompt, Context, MCP, Skills, Harness Engineering và workflow.
- [Cách trình bày dự án Agent khi phỏng vấn?](./interview-questions/agent-project-interview-guide.md): Từ kiến trúc hệ thống, lựa chọn công nghệ, bằng chứng hiệu quả đến phân tích các ca thất bại (badcase), giúp bạn đúc kết dự án thực tế thành câu trả lời phỏng vấn hoàn chỉnh.
- [Tổng hợp câu hỏi phỏng vấn RAG](./interview-questions/rag-interview-questions.md): Bao quát về nền tảng RAG, cơ sở dữ liệu vector, xử lý tài liệu, tối ưu hóa truy xuất, GraphRAG, cập nhật kho tri thức và đánh giá.
- [Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống AI](./interview-questions/ai-system-design-interview-questions.md): Bao quát về kiến trúc ứng dụng AI cấp độ production, LLM Gateway, khả năng quan sát (observability), đánh giá, quản trị bảo mật và Voice Agent thời gian thực.

### Nền tảng LLM

- [Chuyên đề nền tảng LLM](./llm-basis/): Từ cơ chế vận hành của mô hình, gọi API, structured output đến đánh giá ứng dụng AI—nắm vững chuỗi gọi trước tiên.
- [Cơ chế vận hành của LLM: Token, context window và tham số lấy mẫu ảnh hưởng thế nào đến kết quả](./llm-basis/llm-operation-mechanism.md): Biến các khái niệm như Token, context window, Temperature thành các tham số kỹ thuật rõ ràng và có thể kiểm soát.
- [Thực tiễn kỹ thuật gọi API LLM](./llm-basis/llm-api-engineering.md): Phân tích chi tiết quy trình dựng Prompt, Model Gateway, phản hồi streaming, cơ chế retry, rate limit và dữ liệu trả về có cấu trúc.
- [Chi tiết về dữ liệu trả về có cấu trúc của LLM](./llm-basis/structured-output-function-calling.md): Làm rõ chuỗi liên kết tầng dưới của JSON Schema, Function Calling, Tool Calling và MCP.
- [Hệ thống đánh giá ứng dụng AI](./llm-basis/llm-evaluation.md): Bao quát từ Golden Set, LLM-as-Judge, chỉ số đo lường RAG/Agent, phát lại Trace (Trace replay) đến kiểm thử canary trên production.

### AI Agent

- [Chuyên đề AI Agent](./agent/): Từ khái niệm cơ bản về Agent, Memory, Prompt, Context đến MCP, Skills và Harness Engineering.
- [Khái niệm cốt lõi về AI Agent](./agent/agent-basis.md): Hiểu sự khác biệt giữa Agent với lập trình truyền thống và Workflow, cùng các khái niệm cốt lõi như Agent Loop, đăng ký Tools.
- [Hệ thống bộ nhớ của AI Agent](./agent/agent-memory.md): Tìm hiểu sâu về bộ nhớ ngắn hạn, bộ nhớ dài hạn, vòng đời bộ nhớ và các chiến lược tối ưu hóa cấp production.
- [Thiết kế hệ thống cộng tác Multi-Agent](./agent/multi-agent.md): Làm rõ khi nào cần Multi-Agent, cùng cách triển khai phân tách tác vụ, chia sẻ trạng thái, xử lý xung đột và phục hồi sau sự cố.
- [Kỹ thuật viết Prompt cho LLM](./agent/prompt-engineering.md): Nắm vững 4 yếu tố cấu thành Prompt, các kỹ thuật thông dụng và cách phòng chống Prompt Injection.
- [Context Engineering](./agent/context-engineering.md): Hiểu về biên soạn quy tắc tĩnh, gắn thông tin động, hạ cấp ngân sách token và lưu trữ bền vững ngữ cảnh.
- [Giải mã toàn diện giao thức MCP](./agent/mcp.md): Hiểu kiến trúc phân tầng, năng lực cốt lõi của MCP và thực tiễn triển khai MCP Server trên production.
- [Giải mã toàn diện Agent Skills](./agent/skills.md): Hiểu sự khác biệt bản chất giữa Skills với Prompt, MCP và Function Calling.
- [Harness Engineering: Khung kiểm tra 6 tầng, quản lý ngữ cảnh và thực tiễn kỹ thuật](./agent/harness-engineering.md): Phân tích kiến trúc kỹ thuật Model + Harness và kinh nghiệm thực tế của các nhóm phát triển.
- [Workflow, Graph và Loop trong luồng công việc AI](./agent/workflow-graph-loop.md): Hiểu về node, edge, state, ranh giới an toàn và cách triển khai trong AI workflow.
- [Loop Engineering là gì? Tại sao nói đây là "bình mới rượu cũ"?](./agent/loop-engineering.md): Giải thích về kích hoạt, ngữ cảnh, xác thực, trạng thái và điều kiện dừng của vòng lặp ngoài trong Code Agent.

### RAG (Retrieval-Augmented Generation)

- [Chuyên đề RAG](./rag/): Xoay quanh bài toán hỏi đáp trên kho tri thức doanh nghiệp, tổng hợp về xử lý tài liệu, cơ sở dữ liệu vector, GraphRAG, tối ưu hóa truy xuất và cập nhật kho tri thức.
- [Khái niệm nền tảng về RAG](./rag/rag-basis.md): Hiểu RAG là gì, tại sao cần RAG, các ưu thế cốt lõi và giới hạn của nó.
- [Chiến lược xử lý và phân tách tài liệu RAG](./rag/rag-document-processing.md): Bao quát việc phân tích cú pháp tài liệu, làm sạch, cấu trúc hóa, Chunking và xử lý nội dung đa phương thức.
- [Thuật toán đánh chỉ mục vector và cơ sở dữ liệu vector trong RAG](./rag/rag-vector-store.md): Nắm vững các thuật toán chỉ mục như HNSW, IVFFLAT và cách chọn lựa cơ sở dữ liệu vector.
- [Tối ưu hóa truy xuất RAG](./rag/rag-optimization.md): Bao quát chiến lược Chunking, Hybrid Search, Query Rewrite, Rerank và nén ngữ cảnh.
- [GraphRAG](./rag/graphrag.md): Hiểu về thực thể, mối quan hệ, phát hiện cộng đồng (community detection), truy xuất toàn cục và truy xuất cục bộ.
- [Chiến lược cập nhật tài liệu kho tri thức RAG](./rag/rag-knowledge-update.md): Nắm vững cập nhật tăng dần, kiểm soát phiên bản, loại bỏ trùng lặp và tái thiết lập toàn bộ.

### Thiết kế hệ thống AI

- [Chuyên đề thiết kế hệ thống AI](./system-design/): Đặt Prompt Demo vào hệ thống backend thực tế, tập trung vào kiến trúc, Model Gateway, chuỗi xử lý giọng nói, khả năng quan sát, đánh giá và quản trị bảo mật.
- [Thiết kế hệ thống ứng dụng AI](./system-design/ai-application-architecture.md): Đưa Prompt Demo vào chuỗi sản xuất thực tế, bao quát quản lý Prompt, Model Gateway, RAG, Memory, Tool calling, khả năng quan sát, đánh giá và tuân thủ bảo mật.
- [Bảo mật thực chiến cho LLM/Agent](./system-design/llm-security.md): Bao quát Prompt Injection trực tiếp và gián tiếp, vượt quyền công cụ, phân quyền MCP, dữ liệu nhạy cảm, sandbox thực thi mã, bảo mật chuỗi cung ứng và kiểm thử hồi quy bảo mật.
- [Chi tiết về LLM Gateway](./system-design/llm-gateway.md): Hiểu về định tuyến đa mô hình, fallback, giới hạn hạn ngạch (rate limit & quota), phân bổ chi phí, quan sát kiểm toán và chiến lược bộ nhớ đệm (caching) trong LLM Gateway.
- [Chi tiết về công nghệ giọng nói AI](./system-design/ai-voice.md): Phân tích chi tiết VAD, ASR, LLM, TTS, phát streaming, xử lý ngắt lời và lựa chọn kiến trúc lai giữa biên và đám mây (edge-cloud hybrid).

## Câu hỏi tần suất cao

- Token, context window, Temperature, Top P của LLM ảnh hưởng đến những gì?
- Tại sao xuất dữ liệu có cấu trúc không thể chỉ dựa vào Prompt? JSON Schema, Function Calling và kiểm tra phía server giải quyết những vấn đề gì?
- Agent và Workflow khác nhau như thế nào? Trong Agent Loop, các khâu quan sát, lập kế hoạch, hành động và suy ngẫm phối hợp ra sao?
- Prompt Engineering và Context Engineering khác nhau ở điểm nào?
- MCP giải quyết bài toán gì? Mối quan hệ giữa MCP với Function Calling và Tool Calling là gì?
- Tại sao RAG lại trả lời không đúng trọng tâm? Nên bắt đầu rà soát từ giai đoạn truy xuất, xếp hạng, nén ngữ cảnh hay sinh văn bản?
- Cách lựa chọn cơ sở dữ liệu vector? Các chỉ mục như HNSW, IVFFLAT phù hợp với những kịch bản nào?
- Đánh giá ứng dụng AI như thế nào? Làm sao kết nối Golden Set, LLM-as-Judge, thử nghiệm canary trên production và phát lại Trace lại với nhau?
- Tại sao ứng dụng AI cấp độ production lại cần Model Gateway? Làm sao để triển khai rate limit, fallback, kiểm soát chi phí và kiểm toán?

## Các chuyên đề liên quan

- [Cẩm nang thực chiến lập trình AI](../ai-coding/)
- [Thiết kế hệ thống](../system-design/)
- [Hệ thống kiến thức về hệ thống có tính sẵn sàng cao (High Availability)](../high-availability/)
- [Hệ thống kiến thức về hệ thống hiệu năng cao (High Performance)](../high-performance/)
- [Hệ thống kiến thức về hệ thống phân tán (Distributed System)](../distributed-system/)
