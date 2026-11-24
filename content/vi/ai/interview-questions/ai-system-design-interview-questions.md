---
title: Tổng hợp câu hỏi phỏng vấn thiết kế hệ thống AI
description: Tổng hợp có hệ thống các câu hỏi phỏng vấn thiết kế hệ thống AI tần suất cao, bao quát kiến trúc ứng dụng AI cấp production, Model Gateway, quản lý Prompt, RAG, Memory, Tool Calling, Observability, đánh giá, an toàn tuân thủ, Voice Agent thời gian thực, kèm bài viết tham khảo.
category: AI
tag:
  - Thiết kế hệ thống AI
  - Phỏng vấn AI
  - Ứng dụng mô hình lớn
head:
  - - meta
    - name: keywords
      content: cau hoi phong van thiet ke he thong AI, kien truc ung dung AI, LLM gateway, AI observability, danh gia AI, voice Agent, bao mat AI
lang: vi
sourceRef: zh-ref/ai/interview-questions/ai-system-design-interview-questions.md
---

Các câu hỏi thiết kế hệ thống AI thường xuất phát từ một kịch bản nghiệp vụ cụ thể, ví dụ như cơ sở tri thức doanh nghiệp, tổng đài chăm sóc khách hàng thông minh, nền tảng Agent hoặc trợ lý giọng nói thời gian thực. Theo đà thảo luận, người phỏng vấn sẽ tiếp tục đào sâu xem các khâu gọi mô hình, quản lý ngữ cảnh, truy xuất dữ liệu, công cụ thực thi, bảo mật, chi phí và đánh giá chất lượng được tích hợp vào cùng một luồng production như thế nào.

Các câu hỏi dưới đây được phân nhóm theo nội dung chuyên đề Thiết kế hệ thống AI của JavaGuide. Mỗi nhóm đều có bài viết chi tiết đi kèm; tài liệu này tập hợp các câu hỏi thường gặp để ôn tập có hệ thống, các phương án kiến trúc chi tiết nằm ở bài viết gốc tương ứng.

## Kiến trúc ứng dụng AI cấp Production

Bài viết liên quan: [Thiết kế hệ thống ứng dụng AI: Từ Prompt Demo đến kiến trúc cấp production](../system-design/ai-application-architecture.md)

Các câu hỏi kiến trúc bắt đầu từ chuỗi xử lý hoàn chỉnh của một request, sau đó kiểm tra trách nhiệm của từng module và tiêu chí lựa chọn giữa tác vụ đồng bộ, streaming hay bất đồng bộ. Prompt, RAG, Memory và Tool cũng cần được phân tích trong đúng tầng chức năng mà chúng phụ trách.

Câu hỏi phỏng vấn thường gặp:

- Những khoảng cách kỹ thuật cốt lõi giữa một Prompt Demo và một hệ thống production thực thụ là gì?
- Làm thế nào để thiết kế kiến trúc tổng thể cho một ứng dụng AI cấp production?
- Một request AI từ khi tiếp nhận đến khi trả về kết quả cho client sẽ đi qua những module nào?
- Tầng tiếp nhận (Ingress), tầng điều phối (Orchestration), Prompt/Context, RAG/Memory/Tool, Model Gateway và tầng đánh giá/quan sát (Evaluation & Observability) lần lượt chịu trách nhiệm gì?
- Phản hồi đồng bộ, streaming và tác vụ chạy ngầm bất đồng bộ lần lượt phù hợp với những kịch bản nào?
- Tại sao Prompt bắt buộc phải quản lý phiên bản? Template, biến số động và phiên bản mô hình được liên kết với nhau ra sao?
- RAG, Memory và Tool lần lượt quản lý những loại thông tin nào? Tại sao bắt buộc phải quản trị tách biệt?
- Trạng thái trung gian của các tác vụ chạy dài được lưu trữ như thế nào? Sau khi service khởi động lại hoặc gặp sự cố thì khôi phục ra sao?
- Để hỗ trợ việc phát lại (replay) và phân tích nguyên nhân lỗi, một request tối thiểu phải ghi nhận lại những dữ liệu gì?

## Model Gateway và Quản trị lệnh gọi (Invocation Governance)

Bài viết liên quan: [Phân tích chi tiết Model Gateway: Tiếp nhận hợp nhất, định tuyến mô hình, giới hạn hạn ngạch và quản trị chi phí](../system-design/llm-gateway.md), [Thực tiễn kỹ thuật gọi API LLM: Streaming output, retry, rate limit và phản hồi có cấu trúc](../llm-basis/llm-api-engineering.md)

Các câu hỏi về Model Gateway chủ yếu kiểm tra năng lực tích hợp đa nhà cung cấp, định tuyến mô hình và xử lý sự cố. Cơ chế Rate Limiting ngoài số lượng request còn bao gồm lượng Token tiêu thụ, số kết nối đồng thời, ngân sách của từng tenant và hạn ngạch từ phía nhà cung cấp upstream.

Câu hỏi phỏng vấn thường gặp:

- Tại sao trong môi trường production bắt buộc phải có LLM Gateway? Việc các service nghiệp vụ gọi trực tiếp API mô hình gây ra những hệ lụy gì?
- LLM Gateway và LLM Router khác biệt căn bản ở điểm nào?
- Một Model Gateway thông thường cần đảm đương những năng lực cốt lõi nào?
- Tham số request, định dạng response và mã lỗi từ nhiều nhà cung cấp mô hình khác nhau được chuẩn hóa như thế nào?
- Định tuyến mô hình (Model Routing) có thể dựa vào những thông tin nào? Làm sao để tránh phân phối request cho những mô hình không phù hợp?
- Tại sao Rate Limiting cho LLM bắt buộc phải theo dõi đồng thời cả RPM, TPM, số lượng kết nối đồng thời và ngân sách tenant?
- Những loại lỗi gọi mô hình nào phù hợp để retry? Những loại lỗi nào nên báo thất bại ngay lập tức?
- Thiết kế cơ chế Fallback cho mô hình như thế nào? Những tác vụ nào tuyệt đối không được phép tự động giáng cấp?
- Chi phí Token được hạch toán và phân bổ cụ thể theo từng tenant, user, tính năng, mô hình và phiên bản Prompt ra sao?
- Model Gateway làm tăng thêm bao nhiêu độ trễ? Những bước xử lý nào nên đặt tại Gateway thay vì service nghiệp vụ?
- Bộ nhớ đệm ngữ nghĩa (Semantic Cache) phù hợp với những loại request nào? Xử lý tính tươi mới của dữ liệu và cô lập phân quyền ra sao?
- Nếu được yêu cầu thiết kế một LLM Gateway cấp production từ đầu, bạn sẽ phân rã các module như thế nào?

## Bảo mật, Phân quyền và Kiểm toán (Security, Permissions & Auditing)

Bài viết liên quan: [Thực chiến an toàn bảo mật LLM/Agent: Từ Prompt Injection, vượt quyền công cụ đến cô lập Sandbox](../system-design/llm-security.md), [Thiết kế hệ thống ứng dụng AI: Từ Prompt Demo đến kiến trúc cấp production](../system-design/ai-application-architecture.md), [Structured Output của LLM: Từ hợp đồng JSON đến triển khai Function Calling thực tế](../llm-basis/structured-output-function-calling.md)

Mô hình có thể sinh ra ý định gọi công cụ và các tham số, nhưng thao tác nghiệp vụ thực tế vẫn do backend thực thi. Nhóm câu hỏi này sẽ đào sâu vào vị trí cần kiểm tra xác thực danh tính, quyền tài nguyên, tham số, rủi ro thao tác và nhật ký kiểm toán.

Câu hỏi phỏng vấn thường gặp:

- Ranh giới an toàn tuyệt đối của Tool Calling nằm ở đâu?
- Tại sao mô tả công cụ (`description`) và Prompt không bao giờ có thể thay thế việc kiểm tra phân quyền ở backend?
- Tại sao các thao tác gọi công cụ rủi ro cao bắt buộc phải có bước xác nhận hai bước từ con người (human-in-the-loop)?
- Thao tác ghi dữ liệu xử lý bài toán lũy nghiệm (idempotency), timeout và trạng thái kết quả không chắc chắn ra sao?
- Tấn công Prompt Injection được phòng thủ như thế nào ở cấp độ thiết kế kiến trúc hệ thống?
- Truy xuất RAG làm thế nào để ngăn chặn việc trả về những nội dung mà người dùng hiện tại không có quyền truy cập?
- Việc khử nhạy cảm dữ liệu định danh cá nhân (PII Masking) nên đặt tại khâu đầu vào, ghi log, gọi mô hình hay khâu kết quả đầu ra?
- Nhật ký kiểm toán (audit log) của thao tác gọi công cụ tối thiểu phải ghi lại những trường nào?
- Sau khi các tham số cấu trúc do mô hình sinh ra đã vượt qua kiểm tra Schema, tại sao vẫn chưa được phép thực thi trực tiếp?

## Khả năng quan sát, Đánh giá và Quản lý phát hành (Observability, Evaluation & Release)

Bài viết liên quan: [Hệ thống đánh giá ứng dụng AI: Từ xây dựng Golden Set đến vòng lặp đóng Canary trên production](../llm-basis/llm-evaluation.md), [Thiết kế hệ thống ứng dụng AI: Từ Prompt Demo đến kiến trúc cấp production](../system-design/ai-application-architecture.md)

Quy trình kiểm tra phát hành của ứng dụng AI ngoài việc kiểm tra API có trả về thành công hay không, còn phải bao quát cả chất lượng câu trả lời, kết quả truy xuất, quỹ đạo công cụ và tính tuân thủ định dạng. Khi mô hình, Prompt, cấu hình truy xuất hay mã nguồn thay đổi, hệ thống đều phải hỗ trợ việc so sánh đối chiếu và rollback an toàn.

Câu hỏi phỏng vấn thường gặp:

- Các chỉ số quan sát (Observability metrics) của ứng dụng AI cần bao gồm những nội dung gì?
- Tại sao nếu thiếu tập dữ liệu đánh giá (evaluation set) thì rất khó xác định một lần thay đổi có mang lại cải thiện thực sự hay không?
- Golden Set cần bao phủ đường chạy chuẩn (happy path), các trường hợp biên (edge cases), mẫu đối kháng và các lỗi rủi ro cao như thế nào?
- Đánh giá offline, Trace Replay và Canary trên production lần lượt giải quyết các bài toán gì?
- Tại sao RAG, Agent và Structured Output không thể dùng chung một bộ chỉ số đánh giá?
- LLM-as-a-Judge thường mắc phải những thiên kiến nào? Làm sao hiệu chuẩn bằng lấy mẫu kiểm tra thủ công và quy tắc ràng buộc?
- Đánh giá AI trong quy trình CI cần làm gì để kiểm soát chi phí Token và thời gian chạy kiểm thử?
- Tại sao dữ liệu đánh giá bắt buộc phải gắn liền với phiên bản cụ thể của mô hình, Prompt, cấu hình truy xuất và commit Git?
- Khi chất lượng online suy giảm, làm sao để phân lập nguyên nhân do mô hình, Prompt, khâu truy xuất, công cụ hay do phân phối dữ liệu bị dịch chuyển?
- Ứng dụng AI thiết kế cơ chế triển khai Canary, Rollback và vòng phản hồi mẫu lỗi (bad cases) như thế nào?

## Voice Agent thời gian thực (Real-Time Voice Agent)

Bài viết liên quan: [Phân tích chi tiết công nghệ AI Voice: Từ ASR, TTS đến triển khai Voice Agent thời gian thực](../system-design/ai-voice.md)

Hệ thống giọng nói thời gian thực kết nối thu âm thanh, VAD, ASR, LLM, gọi công cụ, TTS và phát âm thanh thành một chuỗi liên tục. Các câu hỏi liên quan tập trung chủ yếu vào độ trễ end-to-end, xử lý ngắt lời (interruption), quản lý trạng thái và lựa chọn kiến trúc giữa thiết bị và đám mây.

Câu hỏi phỏng vấn thường gặp:

- Làm thế nào để thiết kế một Voice Agent thời gian thực hoàn chỉnh?
- ASR, LLM, TTS và VAD lần lượt đảm nhận những vai trò gì trong hệ thống giọng nói?
- Độ trễ end-to-end của một Voice Agent thời gian thực chủ yếu bắt nguồn từ những khâu nào?
- Khi người dùng cất giọng ngắt lời (user interruption), hệ thống hủy phát âm thanh, dừng sinh câu trả lời và cập nhật lại Context ra sao?
- Các trạng thái như `listening`, `thinking`, `speaking`, `interrupted` được quản lý và chuyển đổi như thế nào?
- Kiến trúc phân tầng ghép nối (ASR + LLM + TTS) và mô hình Speech-to-Speech nội sinh (native) có ưu nhược điểm gì khi so sánh với nhau?
- Lựa chọn giữa API đám mây, mô hình on-premise cục bộ và giải pháp lai (hybrid) dựa trên những tiêu chí nào?
- Tiền xử lý âm thanh phía trình duyệt (browser-side audio preprocessing) ảnh hưởng đến những chỉ số kỹ thuật nào?
- Dữ liệu quan sát (telemetry) của Voice Agent cần thu thập những thông tin gì?

## Câu hỏi thiết kế tổng hợp

- Làm thế nào để thiết kế một hệ thống Multi-Agent hỗ trợ phân rã tác vụ, thực thi song song, chia sẻ trạng thái, xử lý xung đột và khôi phục khi thất bại? Tham khảo: [Thiết kế hệ thống cộng tác Multi-Agent: Phân rã tác vụ, chia sẻ trạng thái, xử lý xung đột và phục hồi thất bại](../agent/multi-agent.md)
- Làm thế nào để thiết kế một hệ thống RAG doanh nghiệp có phân quyền chi tiết, truy vết trích dẫn nguồn và khả năng cập nhật cơ sở tri thức liên tục?
- Làm thế nào để thiết kế một nền tảng Agent hỗ trợ tác vụ dài hạn, gọi công cụ linh hoạt, khôi phục sau sự cố và cơ chế chuyển giao cho con người can thiệp?
- Khi lưu lượng chatbot thông minh tăng đột biến, đồng thời nhà cung cấp mô hình bắt đầu bóp băng thông (Rate Limit), hệ thống cần xếp hàng, giáng cấp và bảo vệ các request cốt lõi ra sao?
- Sau khi nâng cấp mô hình hoặc sửa đổi Prompt, tỷ lệ thành công của Structured Output và chất lượng câu trả lời bị sụt giảm, quy trình khoanh vùng lỗi và rollback diễn ra thế nào?
- Khi Agent có quyền tra cứu đơn hàng và thực hiện hoàn tiền cho khách, cơ chế phân quyền, kiểm tra tham số, xác nhận hai bước, tính lũy nghiệm và nhật ký kiểm toán được thiết kế ra sao?
- Làm thế nào để thiết kế một hệ thống Voice Bot chăm sóc khách hàng hỗ trợ ngắt lời tức thì, độ trễ cực thấp và có phương án dự phòng khi dịch vụ gặp sự cố?
