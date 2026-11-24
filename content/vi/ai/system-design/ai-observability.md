---
title: "AI Observability và Tracing: Cách tái hiện toàn bộ quá trình thực thi của Agent"
description: "Khởi đầu từ một request có API trả về 200 thành công nhưng câu trả lời lại sai, bài viết làm rõ thiết kế Trace, phân tách Span, truyền context, lấy mẫu (sampling), xử lý dữ liệu nhạy cảm cho ứng dụng AI và cách triển khai trong dự án Spring AI."
category: "Phát triển ứng dụng AI"
tag:
  - "AI Observability"
  - "OpenTelemetry"
  - "AI Agent"
  - "Spring AI"
  - "AI System Design"
head:
  - - meta
    - name: keywords
      content: "AI Observability,Agent Trace,OpenTelemetry,Spring AI,LLM Observability,RAG Observability,Giám sát LLM"
lang: vi
sourceRef: zh-ref/ai/system-design/ai-observability.md
---

API trả về HTTP 200, thời gian phản hồi hoàn toàn bình thường, nhưng chatbot chăm sóc khách hàng thông minh lại đưa ra quy định hoàn tiền hoàn toàn sai lệch.

Mở dashboard giám sát lên, bạn chỉ thấy request này đã gọi mô hình ngôn ngữ lớn (LLM) và sinh câu trả lời bình thường. Khi muốn điều tra sâu hơn thì rắc rối thực sự bắt đầu: Do cơ sở tri thức (knowledge base) không truy xuất được tài liệu chính xác, Prompt bị ghép sai, mô hình bỏ qua ngữ cảnh, hay một Tool nào đó đã trả về dữ liệu cũ? Log API thông thường hoàn toàn bất lực trước những câu hỏi này.

Một request AI có thể phải trải qua các bước: viết lại câu hỏi (query rewriting), truy xuất tri thức, xếp hạng lại (reranking), gọi mô hình, gọi công cụ (tool calling) và kiểm tra kết quả (validation). Một Agent thậm chí còn lặp lại nhiều bước trong số đó. Từng bước riêng lẻ đều báo gọi thành công, nhưng kết quả sai lệch vẫn âm thầm truyền sang bước kế tiếp, cuối cùng tạo ra một câu trả lời có định dạng chuẩn chỉnh nhưng nội dung lại sai bét.

Khi khắc phục sự cố, bạn buộc phải lần ngược lại toàn bộ quá trình thực thi này: Lúc đó đã dùng mô hình và Prompt nào, truy xuất được những tài liệu nào, đã gọi Tool gì, Agent đã retry mấy lần, và câu trả lời cuối cùng thực sự dựa trên kết quả trung gian nào.

Chỉ khi tất cả thông tin này cùng nằm trên một chuỗi gọi (call trace), bạn mới có thể định vị chính xác nguyên nhân gốc rễ.

## Tại sao ứng dụng AI không thể chỉ nhìn vào API thành công hay thất bại?

Giám sát backend truyền thống chủ yếu tập trung vào QPS, tỷ lệ lỗi, độ trễ P99, CPU, bộ nhớ (RAM) và slow query cơ sở dữ liệu. Các chỉ số này phản ánh dịch vụ có gặp sự cố hạ tầng hay không, nhưng không thể giải thích vì sao mô hình lại sinh ra câu trả lời hiện tại.

Lấy RAG làm ví dụ: Nếu bước viết lại câu hỏi bị lệch hướng, kết quả truy xuất phía sau hầu như chắc chắn cũng sẽ lệch theo; tài liệu chuẩn dù được truy xuất thành công nhưng có thể bị văng khỏi `topK` ở bước reranking; thứ tự tài liệu hoàn toàn chuẩn, nhưng lại có thể bị cắt bớt (truncate) vì Prompt vượt quá giới hạn độ dài. Toàn bộ chuỗi này không hề ném ra bất kỳ exception nào, API vẫn trả về mã 200 ngon lành.

Trong kịch bản Agent, các vấn đề về Tool và trạng thái thực thi còn phức tạp hơn nữa. Giao diện Tool gọi thành công, nhưng dữ liệu nghiệp vụ lấy về có thể đã hết hạn; một lần retry do timeout có thể vô tình thực thi lặp lại một thao tác có tác dụng phụ (side-effect); khi tổng hợp kết quả từ nhiều Agent, hệ thống cũng có thể bỏ sót một kết quả đã hoàn thành.

Để truy vết vấn đề đến từng bước cụ thể, Trace tối thiểu phải bao quát được mô hình, truy xuất, Tool, Agent và kết quả cuối cùng. Những Trace thất bại đã được xác nhận còn có thể tích lũy thành tập Badcase phục vụ cho việc đánh giá hồi quy (regression evaluation) sau này.

Cần lưu ý: Trace có thể tái hiện các bước mà hệ thống thực tế đã chạy, nhưng không thể đọc được cơ chế suy luận thực sự bên trong trọng số mô hình. Văn bản suy nghĩ (thought text) do mô hình trả về cũng chỉ là một đoạn output, không thể coi trực tiếp là lời giải thích hoàn chỉnh cho quyết định của nó.

## Metrics, Logs, Trace, Evaluation và Audit khác nhau như thế nào?

Trong lĩnh vực AI Observability, 5 khái niệm này thường xuyên xuất hiện cùng nhau: Metrics, Logs, Trace, Evaluation và Audit.

Mỗi khái niệm sinh ra để giải quyết một bài toán riêng biệt.

| Tín hiệu | Trả lời câu hỏi trọng tâm nào? | Nội dung điển hình |
| --- | --- | --- |
| Metrics | Tổng thể hệ thống có bất thường không? | Lượng request, tỷ lệ lỗi, độ trễ P95, lượng Token tiêu thụ, tỷ lệ thất bại của Tool |
| Logs | Sự kiện gì đã xảy ra tại một thời điểm cụ thể? | Stack trace ngoại lệ, thay đổi trạng thái, nguyên nhân retry, cảnh báo nghiệp vụ |
| Trace | Một request cụ thể đã trải qua những gì? | Lần gọi mô hình, truy xuất, gọi Tool, thực thi Agent và mối quan hệ upstream/downstream |
| Evaluation | Chất lượng đầu ra có đạt chuẩn không? | Tính chính xác, độ trung thực (faithfulness), lựa chọn Tool, tỷ lệ hoàn thành tác vụ, an toàn |
| Audit | Ai đã thực hiện thao tác gì dưới quyền hạn nào? | Danh tính người dùng, biên bản phê duyệt, quyết định phân quyền, thao tác ghi bên ngoài |

![Các tín hiệu trong AI Observability giải quyết bài toán gì](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/ai-observability-signals-overview-be8a9c44.webp)

Mối quan hệ phối hợp giữa chúng có thể tóm gọn trong một câu: **Metrics phát hiện bất thường, Trace định vị quá trình, Evaluation đánh giá chất lượng, và Audit truy cứu trách nhiệm.**

Ví dụ: Mức tiêu thụ Token tăng vọt đột biến, Metrics lập tức kích hoạt cảnh báo. Lần theo khoảng thời gian bất thường đó để tìm ra các Trace tiêu thụ Token cao, bạn phát hiện một Agent nào đó đã liên tục gọi mô hình tới 12 lần. Còn việc 12 lần gọi này có thực sự cần thiết hay không, câu trả lời cuối cùng có đúng không, sẽ do các quy tắc Evaluation thẩm định.

Logs cũng không thể bị thay thế hoàn toàn bởi Trace. Trace rất mạnh trong việc biểu diễn mối quan hệ gọi và độ trễ, trong khi Logs phù hợp hơn để ghi lại các sự kiện rời rạc và ngoại lệ chi tiết. Cách làm thực chiến tốt nhất là gắn tự động `traceId` và `spanId` vào log. Khi đó, bạn có thể nhảy từ một Trace sang log liên quan, hoặc từ một log lỗi tra ngược lại toàn bộ chuỗi gọi.

## Phân biệt Trace, Span, Session, Run và Attempt như thế nào?

Các khái niệm này rất dễ bị nhầm lẫn với nhau. OpenTelemetry định nghĩa rõ ràng Trace và Span, trong khi Session, Run, Attempt thường do ứng dụng tự quy ước.

| Khái niệm | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| Session | Một phiên hội thoại liên tục | Cuộc trò chuyện 8 lượt giữa người dùng và Agent CSKH |
| Run | Một lần thực thi tác vụ | Ở lượt thứ 5, người dùng yêu cầu "Hãy giúp tôi hoàn tiền" |
| Trace | Một chuỗi gọi end-to-end | Từ lúc API tiếp nhận request đến khi trả về kết quả xử lý |
| Span | Một thao tác đơn lẻ trong Trace | Truy xuất tri thức, gọi mô hình, chạy công cụ hoàn tiền |
| Attempt | Một lần thử của một bước cụ thể | Lần retry thứ 2 sau khi gọi mô hình bị timeout |

Với request đồng bộ thì rất dễ hiểu: Khi tác vụ bắt đầu thì tạo Trace, khi response trả về thì kết thúc Trace, một Run thường nằm trọn vẹn trong một Trace.

Nhưng với các tác vụ chạy dài cần con người phê duyệt (human-in-the-loop) hoặc khôi phục bất đồng bộ, mối quan hệ 1:1 này không còn đúng nữa. Ví dụ: Agent nộp đơn xin hoàn tiền có thể phải chờ vài tiếng mới có kết quả duyệt, không có lý do gì để giữ Span ban đầu mở liên tục suốt thời gian đó. Khi bước vào trạng thái chờ, hãy kết thúc Trace hiện tại và lưu lại `runId`; sau khi duyệt thành công, tạo một Trace mới và tiếp tục dùng lại `runId` cũ. Cách này vừa liên kết được hai giai đoạn thực thi trước sau, vừa không tạo ra một Trace kéo dài lê thê hàng giờ.

Phạm vi của Session thậm chí còn rộng hơn một tầng. Nó chịu trách nhiệm xâu chuỗi nhiều lượt đối thoại, mỗi lượt đối thoại hay mỗi lần thực thi tác vụ đều có thể sinh ra Trace riêng. Các ID này quản lý từng tầng độc lập:

```text
sessionId: Xâu chuỗi cùng một phiên hội thoại nhiều lượt (multi-turn)
runId: Xâu chuỗi một lần thực thi task, bao gồm cả việc tạm dừng và tiếp tục
traceId: Định danh chuỗi gọi (call trace) sinh ra từ một lần thực thi thực tế
spanId: Định danh một thao tác cụ thể bên trong trace
attempt: Định danh số lần thử của cùng một bước
```

![Mối quan hệ phân tầng giữa Session, Run, Trace, Span và Attempt](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/ai-observability-id-hierarchy-dcfffe2c.webp)

Các lần retry cũng cần được xử lý riêng biệt. Mỗi lần thử mới phải tạo một Span riêng và đánh dấu số lần thử bằng thuộc tính `attempt`. Nếu không, lần đầu bị timeout và lần sau thành công sẽ bị gộp chung vào một bản ghi, gây khó khăn lớn cho việc tái hiện quá trình thực thi thực tế.

## Phân tách Span cho một request Agent như thế nào?

Độ mịn của việc tách Span quyết định Trace có thực sự hữu ích hay không. Tách quá thô, bạn chỉ thấy "Agent chạy mất 8 giây"; tách quá vụn, mỗi hàm tiện ích bình thường cũng thành một Span, chuỗi Trace sẽ tràn ngập các node rác không giúp ích gì cho việc chẩn đoán lỗi.

Lấy một Agent có khả năng tra cứu đơn hàng và yêu cầu hoàn tiền làm ví dụ, một Trace có thể được phân tách như sau:

```text
agent.run
├── ai.intent.classify
│   └── gen_ai.client.operation
├── ai.rag.retrieve
│   ├── gen_ai.client.operation        # Tạo query embedding
│   ├── db.vector.client.operation     # Truy xuất vector (Vector retrieval)
│   └── ai.rag.rerank
├── invoke_agent                       # Thực thi Agent chăm sóc khách hàng
│   ├── gen_ai.client.operation        # Lần gọi model đầu tiên
│   ├── execute_tool                   # Tra cứu đơn hàng
│   │   └── HTTP GET /orders/{id}
│   ├── gen_ai.client.operation        # Tiếp tục suy luận dựa trên kết quả từ tool
│   └── execute_tool                   # Tạo yêu cầu hoàn tiền
│       └── POST /refunds
└── ai.output.validate
```

![Sơ đồ phân tách Span cho một request Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/ai-observability-agent-span-trace-c6f921f0.webp)

Ở đây, chúng ta không hề tạo Span riêng cho các hàm bình thường như render template Prompt hay nối chuỗi. Thông thường, một thao tác chỉ đáng để ghi nhận Span độc lập khi thỏa mãn ít nhất một trong các điều kiện sau:

- Có gọi ra hệ thống bên ngoài, ví dụ dịch vụ mô hình, vector database hoặc business API;
- Bản thân nó là một giai đoạn nghiệp vụ quan trọng, ví dụ truy xuất, reranking, lập kế hoạch (planning) và kiểm tra kết quả;
- Có chiến lược timeout, retry hoặc fallback độc lập;
- Cần thống kê riêng về thời gian thực thi, chi phí, tỷ lệ lỗi hoặc chất lượng;
- Khi phát sinh sự cố, developer thực sự cần biết bước này đã chạy chưa và chạy mấy lần.

Một Span tối thiểu phải trả lời được 4 câu hỏi: Đã thực thi thao tác gì, bắt đầu và kết thúc khi nào, kết quả có thành công không, và mối quan hệ giữa nó với các bước khác là gì.

### Thiết kế mối quan hệ cha-con (Parent-Child) như thế nào?

Các lệnh gọi đồng bộ thông thường sẽ dùng trực tiếp quan hệ cha-con. Span cha đại diện cho một giai đoạn lớn, Span con đại diện cho các thao tác cụ thể bên trong giai đoạn đó.

Khi Agent gọi song song nhiều chuyên gia (specialist agents), Span của mỗi chuyên gia đều có thể treo dưới cùng một Span điều phối cha (orchestration span). Khoảng thời gian của chúng sẽ đè lên nhau, và giao diện Trace hiển thị sẽ tự nhiên phản ánh quan hệ thực thi song song này.

```text
invoke_workflow
├── invoke_agent: technical-analysis   ──────────┐
├── invoke_agent: sentiment-analysis   ───────┐  │ Song song
└── invoke_agent: portfolio-manager            └── Tổng hợp
```

Một Span chỉ có thể có đúng một Span cha. Nếu một tác vụ tổng hợp được kích hoạt đồng thời bởi nhiều message độc lập, bạn có thể chọn thao tác tiêu thụ hiện tại làm Span cha, sau đó dùng Span Link để liên kết các context upstream khác. Đừng vì muốn biểu diễn "nhiều node cha" mà tự ý chắp vá một cây phân cấp sai lệch với mô hình Trace chuẩn.

### Đặt tên Span (Span Name) như thế nào?

Tên Span phải ổn định và có độ biến thiên thấp (low-cardinality), tuyệt đối tránh đưa câu hỏi của người dùng, mã đơn hàng hay URL đầy đủ vào tên Span.

Nên dùng:

```text
invoke_agent customer-service
execute_tool query_order
ai.rag.retrieve
POST /refunds
```

Không nên dùng:

```text
Trả lời câu hỏi người dùng: Tại sao đơn hàng 202608160001 của tôi vẫn chưa được hoàn tiền
Tra cứu đơn hàng 202608160001
```

Cách đặt tên phía sau sẽ khiến số lượng tên Span bùng nổ theo nội dung người dùng nhập vào, vừa khó tổng hợp thống kê, vừa tăng mạnh chi phí lưu trữ và đánh chỉ mục (index). Mã đơn hàng có thể lưu dưới dạng attribute được kiểm soát hoặc chỉ lưu mã băm (hash), hoàn toàn không cần thiết phải đưa vào tên Span.

### OpenTelemetry đã thống nhất chuẩn Agent Span chưa?

OpenTelemetry hiện đã cung cấp Semantic Conventions cho GenAI, bao quát mô hình, Agent và một phần luồng workflow. Tài liệu Agent Span hiện tại bao gồm các tên thao tác như `invoke_agent`, `invoke_workflow`, `plan`, `execute_tool`.

Tuy nhiên, tính đến thời điểm viết bài, cả [OpenTelemetry GenAI Semantic Conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/README.md) lẫn [Agent Span Conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md) đều vẫn đang ở trạng thái `Development`. Điều này đồng nghĩa với việc các thuộc tính và quy tắc đặt tên vẫn có thể tiếp tục thay đổi trong tương lai.

Về mặt kỹ thuật công trình, hãy ưu tiên tái sử dụng các trường dữ liệu chung đã được định nghĩa, sau đó bổ sung namespace riêng cho các giai đoạn nghiệp vụ của bạn, ví dụ `ai.rag.*`, `ai.guardrail.*`. Đồng thời, hãy ghi nhận phiên bản quy ước vào thư viện đo lường nội bộ để tiện nâng cấp tập trung, không nên rải rác các trường tùy biến riêng của nhà cung cấp vào thẳng code nghiệp vụ như thể chúng là chuẩn bất biến.

## Một Trace cần ghi lại những thông tin gì?

Trace càng ghi nhiều thông tin thì việc điều tra lỗi càng thuận tiện, nhưng chi phí lưu trữ và rủi ro rò rỉ dữ liệu cũng tăng theo tỷ lệ thuận. Trên môi trường production, hãy ghi lại metadata có cấu trúc trước, sau đó tùy theo môi trường và phân quyền mà quyết định có lưu trữ nội dung chi tiết hay không.

### Thông tin Request và Version

Một request AI tối thiểu phải định vị được mã nguồn và cấu hình đang chạy tại thời điểm đó:

- `service.name`, môi trường và phiên bản dịch vụ;
- `sessionId`, `runId`, định danh tenant (người thuê/tổ chức);
- Phiên bản của Agent, Workflow, Prompt và cơ sở tri thức;
- Nhóm phân luồng canary, nhóm thử nghiệm (A/B testing) và feature flag;
- Cổng vào request (entry point), caller và vùng (region).

Chỉ lưu nội dung template của Prompt là chưa đủ. Dù template không đổi, nhưng system prompt, ví dụ few-shot, ngữ cảnh truy xuất hay tham số mô hình thay đổi thì kết quả sinh ra cũng có thể khác biệt hoàn toàn. Do đó, tốt nhất hãy lưu phiên bản hoặc mã hash của cấu hình có hiệu lực cuối cùng.

### Thông tin gọi mô hình

Span gọi mô hình thường cần ghi lại:

- Nhà cung cấp mô hình, mô hình yêu cầu và mô hình thực tế phản hồi;
- Temperature, số Token output tối đa, có bật stream hay không;
- Token input, Token output, Token hit cache;
- Độ trễ token đầu tiên (TTFT) và tổng thời gian phản hồi;
- Finish Reason, rate limit, timeout và số lần retry;
- Chi phí ước tính hoặc ID đối soát hóa đơn (billing).

Alias của mô hình có thể trỏ đến các phiên bản khác nhau. Nếu chỉ ghi `model=smart-model` theo cấu hình nghiệp vụ, sau này rất khó xác minh thực tế đã chạy mô hình nào. Bất cứ khi nào response của nhà cung cấp có trả về phiên bản cụ thể hoặc response ID, bạn đều nên lưu lại đầy đủ.

### Thông tin truy xuất RAG

Các trường có giá trị cao trong giai đoạn truy xuất bao gồm:

- Phiên bản của cơ sở tri thức và index;
- Mã hash hoặc nội dung đã kiểm soát của câu hỏi gốc và câu hỏi viết lại;
- Chiến lược truy xuất, điều kiện lọc, `topK` và ngưỡng tương đồng (similarity threshold);
- ID tài liệu được recall, điểm số, thứ tự xếp hạng và phiên bản dữ liệu;
- Mô hình rerank, thứ tự trước và sau khi rerank;
- Danh sách ID tài liệu thực tế được đưa vào Prompt cuối cùng;
- Thời gian truy vấn, số lượng kết quả trả về và cờ đánh dấu recall rỗng.

Nếu chỉ ghi nhận "truy vấn vector database thành công", khi câu trả lời bị sai, bạn vẫn không tài nào biết được tài liệu đúng có được recall hay không. Ở đây tối thiểu phải lưu ID tài liệu, phiên bản và điểm số. Việc có lưu toàn văn tài liệu vào Trace hay không cần được quyết định riêng dựa trên phân cấp bảo mật dữ liệu.

### Thông tin gọi Tool

Tool là cánh cổng để Agent kết nối với hệ thống nghiệp vụ thực tế, do đó khuyến nghị ghi lại:

- Tên Tool, phiên bản và ID lượt gọi;
- Tóm tắt tham số hoặc mã hash của tham số;
- Kết quả xác thực quyền hạn và phê duyệt thủ công;
- Timeout, retry, idempotency key (khóa lũy đẳng) và trạng thái thực thi;
- Tóm tắt kết quả, mã lỗi nghiệp vụ và cờ đánh dấu tác dụng phụ (side-effect);
- Trace context của dịch vụ downstream.

"Gọi Tool thành công" không đồng nghĩa với "nghiệp vụ thành công". Một HTTP response 200 có thể chứa body là `stock=0`, hoặc API hoàn tiền có thể trả về "yêu cầu trùng lặp". Trạng thái của Span, HTTP status code và kết quả nghiệp vụ phải được ghi nhận tách biệt.

### Thông tin Agent và Workflow

Span của Agent hoặc Workflow cần bổ sung thêm:

- Role (vai trò), phiên bản và tập hợp Tool được phép sử dụng của Agent;
- Bước hiện tại, số vòng lặp và số lần lặp tối đa;
- Kết quả định tuyến (routing), nguyên nhân dừng và nguyên nhân fallback;
- Các nhánh chạy song song có hoàn thành, timeout hay bị hủy;
- Khi tổng hợp thực tế đã sử dụng kết quả của những upstream nào;
- Kết quả kiểm tra cấu trúc (schema validation) của output cuối cùng.

Các trường này trả lời cho câu hỏi rất cụ thể: Câu trả lời cuối cùng thực chất được sinh ra dựa trên những thông tin nào. Đặc biệt trong hệ thống đa Agent (multi-Agent), "chuyên gia A đã hoàn thành" và "Agent tổng hợp có sử dụng kết quả của chuyên gia A" là hai việc hoàn toàn khác nhau, tốt nhất nên ghi lại riêng rẽ.

## Phân biệt trường Low-Cardinality và High-Cardinality như thế nào?

Hệ thống Observability cần tổng hợp và đánh chỉ mục dữ liệu. Thiết kế trường không cẩn thận sẽ khiến chuỗi thời gian metric và index của Trace bùng nổ mất kiểm soát.

Các trường Low-cardinality (độ biến thiên thấp) có tập giá trị hữu hạn, rất thích hợp để đưa vào Metrics và thuộc tính Trace:

```text
model.provider = openai
model.name = gpt-x
agent.role = customer-service
tool.name = query_order
result.status = success
environment = production
```

Các trường High-cardinality (độ biến thiên cao) có số lượng giá trị cực lớn, thông thường chỉ phù hợp đặt trong Trace, thậm chí một số trường cần tránh đánh chỉ mục:

```text
user.id
session.id
document.id
model.response.id
tool.call.id
```

Prompt, Completion, tham số Tool và nội dung văn bản tài liệu không chỉ có cardinality cao, mà chúng còn có thể rất dài và chứa thông tin nhạy cảm. Chúng phù hợp hơn khi được lưu dưới dạng sự kiện có kiểm soát, lưu ở bộ lưu trữ nội dung riêng biệt, hoặc chỉ lưu mã hash và địa chỉ đối tượng.

Thiết kế đo lường của Spring AI cũng áp dụng nguyên tắc tương tự: [các key low-cardinality sẽ đi vào Metrics và Trace, trong khi các key high-cardinality chỉ đi vào Trace](https://docs.spring.io/spring-ai/reference/observability/index.html). Khi tự bổ sung điểm đo lường nghiệp vụ, chúng ta cũng cần tuân thủ ranh giới này.

## Ứng dụng AI cần tập trung giám sát những Metrics nào?

Hệ thống chỉ số cần được thiết kế xoay quanh trải nghiệm người dùng, tính ổn định, chi phí và chất lượng. Các chỉ số dưới đây rất thực tiễn cho hầu hết các ứng dụng AI.

### Metrics tầng Request

- Lượng request, tỷ lệ thành công và số lượng đồng thời (concurrency);
- Độ trễ end-to-end ở các mức P50, P95, P99;
- Tỷ lệ timeout, tỷ lệ hủy (cancel) và tỷ lệ fallback;
- Độ trễ token đầu tiên (TTFT) và tổng thời gian phản hồi đầy đủ;
- Phân bổ lưu lượng theo từng cổng vào, tenant và phiên bản.

Giao diện streaming cần phân biệt rạch ròi giữa TTFT và tổng thời gian phản hồi. Người dùng thường quan tâm nhất đến việc mất bao lâu để thấy đoạn chữ đầu tiên, trong khi tác vụ batch lại quan tâm khi nào toàn bộ công việc mới kết thúc.

### Metrics tầng Model

- Số lần gọi mô hình, tỷ lệ lỗi và tỷ lệ bị bóp băng thông (rate limit);
- Token input, token output và tổng token;
- Phân bổ lượng Token trên từng request đơn lẻ;
- Token hit cache;
- Tần suất retry mô hình và số lần kích hoạt cơ chế fallback;
- Chi phí thống kê theo mô hình, kịch bản nghiệp vụ và tenant.

Lượng Token tiêu thụ trung bình rất dễ che giấu các trường hợp dị biệt ở đuôi dài (long tail), do đó bạn phải luôn chú ý đến P95 và giá trị lớn nhất (max). Khi một Agent thỉnh thoảng bị rơi vào vòng lặp vô tận, giá trị trung bình có thể chưa biến động rõ rệt, nhưng các phân vị cao sẽ gióng lên hồi chuông cảnh báo đầu tiên.

### Metrics tầng RAG

- Tỷ lệ recall rỗng (zero-recall) và số lượng tài liệu hợp lệ;
- Thời gian truy xuất, reranking và dựng context;
- Phân bổ điểm số tương đồng;
- Tỷ lệ tài liệu bị cắt ngắn (truncation) và lượng Token của context;
- Tỷ lệ bao phủ trích dẫn (citation coverage), độ trung thực (faithfulness) trong các đợt đánh giá offline hoặc online.

Điểm tương đồng cao không đồng nghĩa câu trả lời chắc chắn đúng, nó chỉ chứng minh độ liên quan trong không gian vector. Chất lượng truy xuất cuối cùng vẫn phải kết hợp với tập dữ liệu gán nhãn và đánh giá câu trả lời.

### Metrics tầng Agent và Tool

- Số lần gọi mô hình, số lần gọi Tool và số vòng lặp trên mỗi Run;
- Tỷ lệ thành công của Tool, tỷ lệ lỗi nghiệp vụ và tỷ lệ timeout;
- Lần gọi Tool không hợp lệ, gọi trùng lặp và gọi bị từ chối;
- Tỷ lệ người can thiệp thủ công (takeover), thời gian chờ phê duyệt;
- Tỷ lệ hoàn thành tác vụ, tỷ lệ thành công một phần và phân bổ nguyên nhân thất bại;
- Thời gian chạy của các nhánh đa Agent, số kết quả bị thiếu và tỷ lệ giáng cấp khi tổng hợp.

Không nên bê nguyên xi ngưỡng chỉ số từ dự án khác sang. Một phiên hỏi đáp đơn giản mà gọi mô hình 6 lần có thể là bất thường rõ rệt, nhưng một tác vụ nghiên cứu kỹ thuật phức tạp gọi mô hình 6 lần lại là chuyện hết sức bình thường. Hãy thiết lập đường cơ sở (baseline) theo từng kịch bản và phiên bản trước, sau đó đặt cảnh báo cho các biến động lệch khỏi baseline, cách này đáng tin cậy hơn nhiều so với việc áp một ngưỡng cứng cho toàn bộ Agent.

## Sử dụng Trace để định vị các Badcase AI phổ biến như thế nào?

Một Trace được thiết kế tốt phải cho phép bạn điều tra từng tầng theo đúng thứ tự thực thi thực tế. Dưới đây là 3 tình huống điển hình.

### RAG trả về câu trả lời sai, nên nhìn vào đâu trước?

Hãy kiểm tra lần lượt theo thứ tự sau:

1. Xem Span viết lại câu hỏi, xác nhận câu hỏi tìm kiếm có bị lệch khỏi ý định ban đầu của người dùng không;
2. Xem Span truy xuất, xác nhận tài liệu chính xác có được recall về hay không;
3. Xem kết quả reranking, xác nhận tài liệu đúng có bị đánh rớt ra ngoài `topK` không;
4. Xem bản ghi dựng context, xác nhận tài liệu có bị cắt bớt do giới hạn Token hay không;
5. Xem Span gọi mô hình cuối cùng, xác nhận đã gửi đi phiên bản Prompt nào và những ID tài liệu nào;
6. Cuối cùng, kết hợp kiểm tra trích dẫn và đánh giá độ trung thực để phán đoán mô hình có bị "ảo giác" (hallucination), trả lời thoát ly tài liệu hay không.

Chuỗi kiểm tra này giúp bóc tách bài toán "câu trả lời bị sai" thành: lỗi recall, lỗi xếp hạng, lỗi context hay lỗi sinh câu trả lời. Nhờ đó, việc sửa lỗi sau đó sẽ trúng đích hơn nhiều.

### Tại sao Tool hoàn tiền lại bị thực thi hai lần?

Trước tiên, hãy xem số lượng Span `execute_tool` và giá trị `attempt`. Nếu lần gọi đầu tiên bị timeout và Agent phát động lần gọi thứ hai, hãy tiếp tục kiểm tra:

- Hai request có dùng chung một idempotency key ổn định hay không;
- Sau khi lần đầu bị timeout, hệ thống downstream thực tế đã hoàn tiền xong chưa;
- Chiến lược retry bắt nguồn từ đâu: từ mô hình, Agent framework, hay từ HTTP client;
- Khi kết quả Tool bị thất lạc, Agent có nhầm lẫn trạng thái "chưa rõ" (unknown) thành "thất bại" (failure) hay không;
- Bản ghi nghiệp vụ downstream và audit log có xác nhận đã xảy ra hai lần tác dụng phụ hay không.

Trace chỉ chứng minh ứng dụng đã phát ra những lệnh gọi nào, chứ không thể thay thế bản ghi nghiệp vụ của hệ thống hoàn tiền. Nếu lệnh gọi bị timeout, ngay cả khi trạng thái Span là `ERROR` hoặc thuộc tính ứng dụng ghi nhận tác vụ là `CANCELED`, bạn cũng không được vội kết luận rằng thao tác ở phía từ xa đã dừng lại.

### Tại sao bước tổng hợp đa Agent lại bỏ sót một kết quả?

Hãy tìm đến Span của workflow trước, sau đó kiểm tra trạng thái và khoảng thời gian chạy của từng Agent con:

- Agent con có thực sự được khởi chạy hay không;
- Nó thành công, thất bại, timeout, hay đã bị hủy;
- Kết quả đã được gửi ngược về qua message queue hoặc shared state hay chưa;
- Khi Agent tổng hợp bắt đầu chạy, các kết quả phụ thuộc đã sẵn sàng chưa;
- Đầu vào thực tế của bước tổng hợp chứa ID kết quả của những Agent nào;
- Khi thiếu kết quả, hệ thống đã rẽ nhánh theo hướng báo lỗi, chờ đợi hay giáng cấp xử lý.

Nhiều cuộc điều tra thường bỏ qua "dữ liệu đầu vào của bước tổng hợp". Nếu chỉ có Span hoàn thành của Agent con mà không có danh sách đầu vào ở giai đoạn tổng hợp, bạn vẫn không thể biết kết quả bị thất lạc trong quá trình truyền tải hay do Agent tổng hợp căn bản đã không thèm đoái hoài tới nó.

## Đảm bảo tính liên tục của Trace trong Đa Agent, Task bất đồng bộ và Message Queue như thế nào?

Trong code đồng bộ đơn luồng, Trace context thường có thể tự động truyền dọc theo call stack. Nhưng một khi chuyển đổi Thread, Process hoặc Message Queue, bạn buộc phải xử lý bài toán lan truyền ngữ cảnh (context propagation) một cách tường minh.

![Cách truyền Trace Context qua ranh giới Thread, Process và Message](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/ai-observability-context-propagation-17f1ed57.webp)

### Lan truyền qua các dịch vụ (Cross-Service) như thế nào?

Chuẩn [W3C Trace Context](https://www.w3.org/TR/trace-context/) định nghĩa hai HTTP header phổ quát là `traceparent` và `tracestate`. Trong đó, `traceparent` dùng để truyền Trace ID, Span ID cha và cờ lấy mẫu (sampling flag); `tracestate` mang các thông tin bổ sung đặc thù của nhà cung cấp.

Khi gọi dịch vụ downstream qua HTTP, RPC hoặc Message Queue, bên gửi phải inject context vào header, và bên nhận phải extract context ra để tạo Span con. Message Queue thường đặt các trường này vào Message Header thay vì nhồi vào nội dung payload nghiệp vụ.

Cả `traceparent` và `tracestate` đều tuyệt đối không được mang dữ liệu nghiệp vụ như định danh người dùng hay mã đơn hàng. Đặc tả W3C nghiêm cấm việc đưa thông tin định danh cá nhân (PII) vào các trường này.

### Tại sao chuyển Thread lại làm đứt chuỗi Trace?

Context hiện tại của OpenTelemetry Java mặc định được lưu trữ dựa trên `ThreadLocal`. Khi một task được gửi vào thread pool thông thường mà không có auto-instrumentation hoặc bọc (wrap) tường minh, luồng con sẽ hoàn toàn không thấy được context của luồng gọi cha.

Khi dùng OpenTelemetry API, bạn có thể bắt (capture) context trước khi submit task:

```java
Context context = Context.current();

executorService.submit(context.wrap(() -> {
    supplementalAgent.run(task);
}));
```

`Runnable`, `Callable` và `ExecutorService` đều có các phương thức bao bọc context tương ứng, chi tiết có thể tham khảo [OpenTelemetry Java API](https://opentelemetry.io/docs/languages/java/api/).

Nếu dự án dùng Spring Boot, hãy ưu tiên sử dụng HTTP client, `TaskExecutor` do framework tự cấu hình (autoconfigured) và cơ chế Micrometer Context Propagation. Khi bạn tự tay khởi tạo (`new`) client hoặc thread pool, cơ chế tự động truyền context thường sẽ bị vô hiệu hóa.

Virtual Thread (luồng ảo) cũng không hề làm thay đổi yêu cầu cơ bản về lan truyền Trace context. Nó chỉ giải quyết bài toán chi phí tài nguyên luồng và blocking I/O, chứ không tự suy diễn được mối quan hệ nhân quả giữa các tác vụ bất đồng bộ. Việc có cần truyền context thủ công hay không vẫn phụ thuộc vào thư viện đo lường, executor và cơ chế context mà bạn đang sử dụng.

### Lời gọi Streaming có chắc chắn tự động liên kết được không?

Không thể mặc định coi điều đó là hiển nhiên.

Lấy tài liệu hiện tại của Spring AI 2.0.0 làm ví dụ: Các lệnh gọi đồng bộ tới OpenAI và Anthropic có thể gắn HTTP Span chuẩn xác vào dưới model Span; nhưng nhánh bất đồng bộ của streaming call lại chuyển việc xử lý sang `ForkJoinPool.commonPool()`, dẫn đến việc HTTP Span vẫn được ghi nhận nhưng lại không trở thành node con của model Span. Đây là hạn chế hiện tại được ghi rõ trong [Tài liệu Observability chính thức của Spring AI](https://docs.spring.io/spring-ai/reference/observability/index.html#_chat_model).

Ví dụ này cho thấy: Kể cả khi framework đã cung cấp auto-instrumentation, bạn vẫn phải dùng integration test để kiểm tra lại cấu trúc liên kết (topology) thực tế. Tối thiểu cần bao quát lời gọi đồng bộ, streaming, thread pool, virtual thread, message queue và lời gọi tool liên dịch vụ, đảm bảo `traceId` không bị thất lạc tại các ranh giới.

### Liên kết một tác vụ trải dài qua nhiều Trace như thế nào?

Các tác vụ Agent bất đồng bộ có thể chạy rất lâu, giữa chừng còn phải chờ người dùng nhập liệu. Không cần thiết và cũng không nên giữ một Span mở liên tục như vậy.

Cách xử lý chuẩn xác:

- Dùng `runId` để liên kết toàn bộ tác vụ nghiệp vụ;
- Mỗi lần thực thi thực tế sẽ tạo một Trace mới;
- Lưu lại Trace ID trước đó trong trạng thái của tác vụ;
- Khi tiếp tục thực thi, liên kết với Trace phía trước thông qua attribute hoặc Span Link;
- Dùng timestamp của sự kiện và phiên bản trạng thái để phục dựng thứ tự tác vụ.

Cách này vừa giữ được tính liền mạch của nghiệp vụ, vừa tránh việc các Span quá dài gây áp lực lên cơ chế sampling và bộ lưu trữ backend.

## Có nên lưu toàn bộ Prompt và kết quả Tool vào Trace không?

Dưới góc độ điều tra lỗi, lưu toàn bộ nội dung thô là thuận tiện nhất. Nhưng dưới góc độ an toàn thông tin và tuân thủ pháp lý, đây lại là hành động tiềm ẩn rủi ro lớn nhất.

Prompt, câu trả lời của mô hình và kết quả Tool có thể chứa:

- Họ tên, số điện thoại, địa chỉ và thông tin giấy tờ tùy thân của người dùng;
- Mã nguồn nội bộ, hợp đồng và dữ liệu tài chính của doanh nghiệp;
- System Prompt, định nghĩa Tool và các quy tắc bảo mật;
- Access Token, Cookie và chuỗi kết nối cơ sở dữ liệu;
- Nội dung được bảo vệ bản quyền hoặc quyền riêng tư từ cơ sở tri thức bên thứ ba.

Vì vậy, trên môi trường production, mặc định chỉ nên ghi lại metadata và tóm tắt, còn các trường nội dung chỉ bật khi thực sự cần thiết. Nên triển khai theo mô hình phân tầng sau:

1. **Tầng mặc định (Default Tier)**: Lưu thông tin có cấu trúc như phiên bản, Token, thời gian thực thi, trạng thái, ID tài liệu, mã hash tham số.
2. **Tầng khử nhạy cảm (Sanitized Tier)**: Lưu Prompt và kết quả đã được làm mờ/ẩn (masking) số điện thoại, email, token theo quy tắc định sẵn.
3. **Tầng debug hạn chế (Restricted Debug Tier)**: Chỉ bật tạm thời nội dung đầy đủ cho môi trường, tenant hoặc Trace ID cụ thể, và thiết lập thời hạn lưu trữ ngắn hơn nhiều.
4. **Tầng kiểm toán (Audit Tier)**: Ghi lại ai đã yêu cầu, ai phê duyệt và ai đã truy cập xem nội dung Trace nhạy cảm.

Spring AI mặc định không export Prompt, Completion, tham số Tool, kết quả Tool và kết quả truy vấn vector, nguyên nhân chính là vì các nội dung này có dung lượng lớn và thường chứa dữ liệu nhạy cảm. Trong OpenTelemetry GenAI, các thuộc tính nội dung như `gen_ai.input.messages`, `gen_ai.output.messages`, `gen_ai.system_instructions` cũng là các trường đòi hỏi phải chủ động cấu hình kích hoạt.

Bên cạnh việc khử nhạy cảm (sanitization), bạn cần đồng thời thiết lập kiểm soát truy cập (RBAC), mã hóa khi truyền tải và lưu trữ, vòng đời lưu trữ, cô lập đa tenant và cơ chế xóa dữ liệu. Tài liệu hướng dẫn của Microsoft về [AI Observability cho GenAI và Agent](https://learn.microsoft.com/en-us/security/zero-trust/sfi/observability-ai-systems) cũng nhấn mạnh: Phạm vi thu thập và lưu trữ cần đạt được sự thỏa thuận rõ ràng giữa nhu cầu điều tra sự cố, nguyên tắc tối thiểu hóa dữ liệu, yêu cầu lưu trữ theo vùng lãnh thổ, tuân thủ pháp lý và phân quyền.

Một số loại dữ liệu tuyệt đối không bao giờ được phép xuất hiện trong Trace, ví dụ mật khẩu dạng plaintext, khóa bí mật dài hạn (API Secret) và token xác thực hoàn chỉnh. Ngay cả khi bạn đã phân quyền "chỉ Admin mới được xem", thì rủi ro tiềm ẩn cũng không đáng để đánh đổi.

## Thiết kế lấy mẫu (Trace Sampling) như thế nào?

Môi trường kiểm thử có thể bật Trace toàn bộ 100% trong thời gian ngắn, nhưng việc lưu 100% trên production về lâu dài sẽ ngốn chi phí khổng lồ. Số lượng Span, kích thước thuộc tính và thời gian thực thi của một request AI thường cao hơn rất nhiều so với API thông thường, do đó chiến lược sampling cần được thiết kế riêng biệt.

### Head Sampling và Tail Sampling khác nhau như thế nào?

Head Sampling (lấy mẫu tại đầu vào) đưa ra quyết định ngay khi request vừa chạm vào hệ thống. Ví dụ: Ngẫu nhiên giữ lại 10% dựa trên Trace ID. Ưu điểm là triển khai đơn giản, chi phí tính toán có thể dự đoán; nhược điểm là tại thời điểm quyết định, hệ thống chưa thể biết request này rốt cuộc sẽ thành công hay thất bại, chạy nhanh hay cực kỳ chậm.

Tail Sampling (lấy mẫu tại đầu ra) sẽ chờ thêm các Span của một Trace đổ về Collector rồi mới phán đoán. Nó có thể ưu tiên giữ lại:

- Các Trace phát sinh lỗi hoặc timeout;
- Các request chạy chậm vượt ngưỡng quy định của kịch bản;
- Các request có lượng Token hoặc chi phí cao bất thường;
- Các request kích hoạt cơ chế fallback, rollback hoặc có người can thiệp thủ công;
- Các request vi phạm chính sách bảo mật hoặc thực thi các Tool có rủi ro cao;
- Các request từ phiên bản mới và nhóm thử nghiệm canary.

Tail Sampling đòi hỏi Collector phải tạm lưu trữ (buffer) Trace trong bộ nhớ, làm tăng chi phí RAM và độ trễ chờ đợi, đồng thời phải tính đến giải pháp định tuyến để tất cả Span của cùng một Trace đổ về đúng một node quyết định trong cụm Collector phân tán. [Tail Sampling Processor](https://explorer.opentelemetry.io/collector/components/contrib-tailsamplingprocessor?type=processor) của OpenTelemetry Collector hiện được đánh dấu Beta cho Trace; trước khi đưa vào production, bạn phải kiểm tra tải kỹ lưỡng về dung lượng và hành vi drop dữ liệu.

![Sự khác biệt giữa Head Sampling và Tail Sampling trong Trace](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/ai-observability-head-tail-sampling-0b2b02e6.webp)

### Chiến lược kết hợp thực chiến là gì?

Môi trường production nên áp dụng chiến lược phân tầng kết hợp:

```text
Request thành công thông thường: Lấy mẫu tỷ lệ thấp
Lỗi, timeout và request độ trễ cao: Cố gắng giữ lại tối đa
Token cao, chi phí cao và số vòng lặp bất thường: Cố gắng giữ lại tối đa
Tool ghi dữ liệu rủi ro cao, phê duyệt thủ công và sự kiện bảo mật: Đưa vào pipeline kiểm toán độc lập
Phiên bản canary và tenant trọng điểm: Tăng tỷ lệ lấy mẫu trong thời gian được kiểm soát
```

Bạn cũng phải đảm bảo quyết định sampling có tính nhất quán trong cùng một Trace. Nếu root Span được giữ lại nhưng các Span con quan trọng lại bị drop lẻ tẻ, cuối cùng bạn sẽ chỉ thu được một chuỗi Trace què cụt, mất đầu mất đuôi.

Đừng bao giờ phó thác dữ liệu Audit cho cơ chế sampling của Trace. Các thao tác rủi ro cao như hoàn tiền, chuyển khoản, xóa tài nguyên... dù cho Trace nghiệp vụ có bị loại bỏ do sampling, thì bản ghi Audit vẫn bắt buộc phải được lưu trữ độc lập theo đúng quy chuẩn nghiệp vụ và tuân thủ pháp lý.

## Hồi lưu Trace production vào hệ thống Evaluation như thế nào?

Giá trị của Trace không nên dừng lại ở việc "khi có sự cố thì mở ra tra cứu". Các Badcase phát sinh trên production cần được liên tục hồi lưu theo quy trình sau:

```text
Cảnh báo production hoặc phản hồi của người dùng
        ↓
Định vị Trace bất thường
        ↓
Xác định nguyên nhân gốc rễ và bổ sung nhãn thủ công
        ↓
Khử nhạy cảm (sanitization) rồi thêm vào tập Badcase
        ↓
Sửa Prompt, RAG, tool hoặc logic điều phối (orchestration)
        ↓
Replay offline và đánh giá hồi quy (regression evaluation)
        ↓
Triển khai Canary và tiếp tục theo dõi
```

Khi chạy replay, cần phân biệt rõ hai mục tiêu:

Mục tiêu thứ nhất là **tái hiện lỗi tại thời điểm đó**. Lần replay này cần cố định phiên bản mô hình, Prompt, snapshot tài liệu, phản hồi của Tool, tham số ngẫu nhiên (temperature) và cấu hình timeout, nhằm tái hiện chính xác nhất các điều kiện ban đầu.

Mục tiêu thứ hai là **xác minh hiệu quả của phiên bản mới**. Lúc này, bạn có thể đưa cùng một tập dữ liệu đầu vào đó cho Prompt mới, mô hình mới hoặc cơ sở tri thức mới, để so sánh tính chính xác, tỷ lệ hoàn thành tác vụ, độ trễ và chi phí tiêu hao.

Nếu chỉ lưu mỗi câu hỏi của người dùng, sau này bạn gần như không thể tái hiện chính xác được lỗi. Tối thiểu phải lưu thêm phiên bản và snapshot của các dependency bên ngoài. Đối với các dữ liệu động như trạng thái đơn hàng thời gian thực hay giá cổ phiếu, bạn có thể lưu kết quả Tool tại thời điểm đó hoặc phiên bản dữ liệu có thể truy vết, đừng trông mong vài ngày sau gọi lại API mà nhận được kết quả y hệt.

Để tìm hiểu sâu hơn về Golden Set, đánh giá Agent, hồi lưu Badcase và cổng kiểm soát phát hành (release gate), bạn có thể đọc tiếp bài viết [Đánh giá ứng dụng mô hình lớn (LLM Evaluation) như thế nào?](../llm-basis/llm-evaluation.md).

## Tích hợp Observability vào dự án Java / Spring AI như thế nào?

Spring AI đã cung cấp sẵn khả năng đo lường (observation) cho `ChatClient`, Advisor, `ChatModel`, `EmbeddingModel`, `ImageModel`, Tool calling và `VectorStore`. Khi tích hợp vào dự án, trước tiên hãy thông suốt luồng Trace cơ bản, sau đó bổ sung thêm các Span nghiệp vụ, còn việc kết nối hệ thống Evaluation và Audit có thể tiến hành ở các bước tiếp theo.

Các cấu hình dưới đây lấy ví dụ trên **Spring AI 2.0.0 và các cấu hình Spring Boot 4.x hiện hành**. Tùy thuộc vào phiên bản cụ thể, dependency và thuộc tính cấu hình có thể có sự điều chỉnh, khi nâng cấp hãy luôn đối chiếu với tài liệu chính thức tương ứng.

### Kích hoạt Trace có sẵn của Spring AI như thế nào?

Spring Boot 4 có thể dùng `spring-boot-starter-opentelemetry` để gửi Trace qua giao thức OTLP tới OpenTelemetry Collector hoặc backend tương thích. Cấu hình trọng tâm phía ứng dụng như sau:

```yaml
management:
  tracing:
    sampling:
      probability: 0.1
    export:
      otlp:
        enabled: true
  opentelemetry:
    tracing:
      export:
        otlp:
          endpoint: http://otel-collector:4318/v1/traces

spring:
  ai:
    chat:
      client:
        observations:
          log-prompt: false
          log-completion: false
      observations:
        log-prompt: false
        log-completion: false
        include-error-logging: false
    tools:
      observations:
        include-content: false
    vectorstore:
      observations:
        log-query-response: false
```

Xác suất lấy mẫu mặc định hiện tại của Spring Boot là 0.1 (10%). Trên môi trường dev, để kiểm tra cấu trúc Trace, bạn có thể tạm thời nâng lên 1.0 (100%); trên production, cần căn cứ vào lưu lượng, kích thước từng Trace và dung lượng backend để xây dựng chiến lược sampling phù hợp.

Các cờ bật ghi nội dung ở trên đều được đặt là `false`. Hãy đảm bảo metadata và chuỗi gọi đã đủ để điều tra lỗi trước, rồi mới cân nhắc mở dần từng nội dung theo phân cấp bảo mật dữ liệu, cách này an toàn hơn nhiều so với việc đẩy tuốt tuồn tuột Prompt và kết quả lên nền tảng giám sát ngay từ đầu.

### Những Span nào cần phải tự bổ sung thủ công?

Auto-instrumentation của framework chủ yếu bao phủ các component hạ tầng AI, còn tầng điều phối nghiệp vụ vẫn đòi hỏi bạn phải tự ghi nhận. Ví dụ:

- Một vòng đời Agent Run hoàn chỉnh;
- Viết lại câu hỏi, reranking và cắt tỉa ngữ cảnh;
- Định tuyến workflow, tổng hợp song song và fallback;
- Kiểm tra cấu trúc output và kiểm soát an toàn;
- Phê duyệt thủ công, tạm dừng và tiếp tục tác vụ;
- Kết quả nghiệp vụ cuối cùng, ví dụ đơn xin hoàn tiền có thực sự được tạo thành công hay không.

Dự án Spring Boot có thể sử dụng trực tiếp Micrometer Observation API để bao bọc các giai đoạn nghiệp vụ:

```java
@Component
public class RagObservationService {

    private final ObservationRegistry observationRegistry;
    private final DocumentRetriever documentRetriever;

    public RagObservationService(ObservationRegistry observationRegistry,
                                 DocumentRetriever documentRetriever) {
        this.observationRegistry = observationRegistry;
        this.documentRetriever = documentRetriever;
    }

    public List<DocumentHit> retrieve(RagQuery query) {
        Observation observation = Observation
                .createNotStarted("ai.rag.retrieve", observationRegistry)
                .lowCardinalityKeyValue(
                        "ai.rag.strategy",
                        query.strategy().name()
                )
                .highCardinalityKeyValue(
                        "ai.rag.knowledge_base_id",
                        query.knowledgeBaseId().toString()
                );

        return observation.observe(() -> {
            List<DocumentHit> hits = documentRetriever.retrieve(query);
            observation.lowCardinalityKeyValue(
                    "ai.rag.result",
                    hits.isEmpty() ? "empty" : "hit"
            );
            observation.highCardinalityKeyValue(
                    "ai.rag.result_count",
                    Integer.toString(hits.size())
            );
            return hits;
        });
    }
}
```

Đoạn code trên minh họa ranh giới của Span và sự phân chia trường cardinality. `ai.rag.result` chỉ có 2 giá trị là `empty` hoặc `hit`, có thể tham gia vào tổng hợp metric; còn số lượng recall được đưa vào Trace. Trong dự án thực tế, bạn cũng cần chuẩn hóa mã lỗi và quy tắc đặt tên tag, tránh đặt query gốc và toàn văn tài liệu làm tag mặc định.

Nếu bạn chỉ muốn thêm nhanh một Span cho một method ổn định, bạn cũng có thể dùng [`@WithSpan` do OpenTelemetry Java Agent cung cấp](https://opentelemetry.io/docs/zero-code/java/agent/annotations/):

```java
@WithSpan("ai.output.validate")
public ValidationResult validate(AgentResponse response) {
    return outputValidator.validate(response);
}
```

Khi code nghiệp vụ đã dùng Micrometer Observation, không nên tạo thêm một lớp OpenTelemetry Span trùng lặp thủ công cho cùng một thao tác. Hãy thống nhất điểm đo lường của dự án để tránh việc trên Trace xuất hiện hai node có tên khác nhau nhưng nội dung lại y hệt nhau.

### Xác minh kết quả tích hợp như thế nào?

Tối thiểu hãy chuẩn bị một bộ kịch bản integration test bao gồm:

1. Hỏi đáp RAG thông thường;
2. Mô hình bị timeout và retry;
3. Tool trả về lỗi nghiệp vụ;
4. Thực thi song song qua Thread Pool hoặc Virtual Thread;
5. Phản hồi mô hình dạng streaming;
6. Gọi dịch vụ downstream qua HTTP hoặc Message Queue;
7. Agent tạm dừng rồi khôi phục thực thi;
8. Prompt và kết quả Tool có chứa thông tin nhạy cảm.

Khi xác minh, không chỉ dừng lại ở việc xem "trên nền tảng đã có Trace chưa", mà phải kiểm tra kỹ:

- Quan hệ cha-con và timeline thực thi song song có chuẩn xác không;
- Mỗi lần retry có ghi nhận Attempt riêng biệt không;
- Trạng thái lỗi, kết quả nghiệp vụ và trạng thái hủy có đúng không;
- Có tra cứu được Token, phiên bản mô hình và ID tài liệu không;
- `traceId` có được giữ nguyên vẹn khi chuyển thread và chuyển dịch vụ không;
- Các trường nhạy cảm đã được khử nhạy cảm hoặc hoàn toàn không bị gửi lên chưa;
- Sau khi sampling, các Trace bất thường quan trọng có còn được giữ lại trọn vẹn không.

Tài liệu hiện tại của Spring Boot cũng lưu ý đặc biệt: `@SpringBootTest` mặc định sẽ không tự động cấu hình các component chịu trách nhiệm export dữ liệu Tracing. Nếu môi trường test không thấy dữ liệu gửi đi, hãy xác nhận xem bạn đã cấu hình tường minh exporter bean chưa, đừng vội quy chụp đó là lỗi lan truyền context.

## Lựa chọn nền tảng AI Observability như thế nào?

Trước khi lựa chọn, hãy làm rõ dự án của bạn thực sự đang thiếu năng lực gì. Các tính năng phổ biến có thể chia thành 4 nhóm:

1. **Năng lực APM tổng quát**: Chuỗi gọi dịch vụ, liên kết log, cảnh báo metric và giám sát hạ tầng;
2. **Năng lực LLM Trace**: Trực quan hóa Prompt, mô hình, Token, chi phí, truy xuất và gọi Tool;
3. **Năng lực Evaluation**: Dataset, bộ chấm điểm (evaluators), so sánh thử nghiệm, quản lý Badcase và kiểm soát phát hành;
4. **Năng lực Quản trị (Governance)**: Khử nhạy cảm dữ liệu, cô lập đa tenant, phân quyền, chu kỳ lưu trữ và kiểm toán (audit).

Nếu doanh nghiệp đã có sẵn hệ thống OpenTelemetry và APM hoàn chỉnh, bạn có thể cho ứng dụng xuất dữ liệu OTLP chuẩn hóa, sau đó tùy nhu cầu mà kết nối thêm giao diện quan sát hoặc đánh giá LLM chuyên dụng. Nhờ vậy, các lệnh gọi mạng, database và AI vẫn nằm trọn vẹn trong cùng một Trace phân tán.

Nếu dự án vẫn đang trong giai đoạn thử nghiệm (PoC), bạn có thể bắt đầu với tính năng đo lường tích hợp sẵn của framework kết hợp cùng một backend hỗ trợ OpenTelemetry để kiểm chứng cấu trúc Span cần thiết. Việc gắn chặt quá sớm với các trường dữ liệu độc quyền của một nền tảng cụ thể sẽ gây khó khăn lớn cho việc di chuyển (migration) sau này.

Xét về các dịch vụ và middleware sẵn có trên thị trường:

- [Alibaba Cloud ARMS](https://help.aliyun.com/zh/arms/application-monitoring/developer-reference/llm-trace-field-definition-description) hiển thị các trường cho Completion, RAG, Agent và Tool, đồng thời nêu rõ các phần mở rộng dựa trên quy ước OpenTelemetry GenAI;
- [Tencent Cloud CLS](https://cloud.tencent.com/document/product/614/133517) đặt metrics, cây gọi Trace và view Session vào trong cùng một màn hình quan sát Agent;
- [Các bài viết về Apache SkyWalking 10.4](https://skywalking.apache.org/zh/2026-04-05-virtual-genai-monitoring/) thì tập trung vào việc thu thập từ Java client, TTFT, Token và chi phí. Những tài liệu này cho thấy cách sản phẩm thực tế triển khai, tuy nhiên các loại Span và trường mở rộng trong đó vẫn mang tính đặc thù của từng giải pháp, không thể mặc định coi là quy ước chung của OpenTelemetry.

Khi chọn giải pháp, hãy xác minh các câu hỏi sau:

- Có hỗ trợ chuẩn OpenTelemetry không, những trường nào là trường mở rộng độc quyền?
- Có khả năng liên kết với các Span HTTP, database và message queue thông thường không?
- Prompt và tham số Tool có hỗ trợ làm mờ (masking), mã hóa và phân quyền chi tiết không?
- Quy tắc sampling có thể cấu hình linh hoạt theo lỗi, độ trễ, token và thuộc tính nghiệp vụ không?
- Trace có thể xuất vào dataset để phục vụ đánh giá offline không?
- Dữ liệu có thể cô lập theo tenant, xóa theo yêu cầu và thiết lập thời hạn lưu trữ không?
- Khi bản thân nền tảng quan sát gặp sự cố, nó có gây ảnh hưởng hay làm nghẽn request nghiệp vụ chính không?

Quá trình export dữ liệu viễn trắc (telemetry) bắt buộc phải bất đồng bộ, có giới hạn thời gian (timeout) và có ngưỡng đệm hàng đợi (queue limit). Khi backend quan sát không khả dụng, hệ thống có thể chấp nhận làm rơi rớt một phần dữ liệu đo lường thông thường, tuyệt đối không được để nó kéo sập luồng chính của Agent. Với dữ liệu Audit đòi hỏi độ tin cậy tuyệt đối, bạn bắt buộc phải dùng pipeline lưu trữ bền vững độc lập.

## Những sai lầm dễ mắc phải nhất khi triển khai AI Observability?

### Chỉ ghi lại một lần gọi mô hình duy nhất

Một Agent Run thường bao gồm nhiều lần gọi mô hình, truy xuất tri thức và gọi Tool. Nếu chỉ ghi nhận ở tầng ngoài cùng một dòng "gọi mô hình thành công", bạn sẽ không thể định vị được nguyên nhân khi có lỗi, cũng như hoàn toàn mù tịt về các vòng lặp hay số lần retry bên trong.

### Đánh đồng HTTP thành công với Tác vụ thành công

Tool trả về HTTP 200 nhưng nghiệp vụ có thể đã từ chối xử lý; mô hình sinh câu trả lời bình thường nhưng nội dung có thể hoàn toàn sai lệch. Trạng thái truyền tải, trạng thái thực thi, trạng thái nghiệp vụ và chất lượng kết quả bắt buộc phải được ghi nhận tách bạch.

### Mặc định gửi toàn bộ nội dung lên hệ thống

Nội dung đầy đủ của Prompt và kết quả Tool quả thực rất tiện cho việc debug, nhưng nó sẽ kéo theo nguy cơ rò rỉ dữ liệu nhạy cảm, làm phình to index và đội chi phí lưu trữ lên trời. Môi trường production mặc định chỉ nên lưu metadata, chỉ mở nội dung chi tiết theo từng kịch bản, phân quyền và thời hạn kiểm soát cụ thể.

### Đưa input của người dùng vào nhãn (label) của Metric

User ID, Session ID, văn bản câu hỏi và mã đơn hàng sẽ tạo ra sự bùng nổ chuỗi thời gian high-cardinality. Chúng chỉ được phép nằm trong Trace hoặc log có kiểm soát, tuyệt đối không được trở thành tag của Metrics thông thường.

### Phụ thuộc vào Auto-Instrumentation mà không kiểm tra Context

Thread pool, luồng bất đồng bộ, message queue và các HTTP client tự tạo đều có thể làm đứt gãy chuỗi Trace. Auto-instrumentation chỉ giúp giảm bớt code thủ công, cuối cùng bạn vẫn phải dùng integration test để kiểm tra tính toàn vẹn của đồ thị chuỗi gọi.

### Lấy mẫu Trace làm thất lạc luôn cả dữ liệu Audit

Trace dùng để điều tra sự cố kỹ thuật nên hoàn toàn có thể lấy mẫu (sampling). Trong khi đó, bản ghi Audit của các thao tác nghiệp vụ rủi ro cao gánh vác trách nhiệm truy cứu pháp lý, tuyệt đối không thể để việc giữ lại hay xóa bỏ bị chi phối bởi tỷ lệ sampling ngẫu nhiên của Trace thông thường.

### Thu thập hàng núi Trace nhưng không hồi lưu Badcase

Nếu các Badcase không được đưa vào dataset và sau khi sửa lỗi không có bước đánh giá hồi quy, team kỹ thuật sẽ mãi mãi rơi vào cái vòng luẩn quẩn xử lý lặp đi lặp lại những lỗi tương tự nhau. Tối thiểu hãy kết nối Trace bất thường, tập dữ liệu đánh giá và cổng kiểm soát release lại với nhau.

## Trả lời các câu hỏi phỏng vấn về AI Observability như thế nào?

### Điểm khác biệt lớn nhất giữa AI Observability và Observability truyền thống là gì?

Observability truyền thống tập trung vào dịch vụ, request và tài nguyên hạ tầng. AI Observability phải bao quát thêm mô hình, Prompt, Token, truy xuất, Tool và quá trình thực thi không tất định (non-deterministic) của Agent. Do đầu ra của AI mang tính xác suất và API thành công không chứng minh được kết quả chính xác, nên AI Observability bắt buộc phải kết hợp chặt chẽ giữa Tracing và Evaluation.

### Tại sao chỉ có Metrics và Logs là chưa đủ?

Metrics thích hợp để phát hiện bất thường trên quy mô tổng thể, còn Logs phù hợp để ghi lại các sự kiện rời rạc. Một request của Agent có thể bao gồm rất nhiều lần gọi lặp mô hình và Tool; chỉ có Trace mới tái hiện trực quan được thứ tự thực thi, quan hệ chạy song song, độ trễ từng bước và sự phụ thuộc qua lại giữa các khâu.

### Nên phân tách Span cho Agent Trace như thế nào?

Hãy bắt đầu bằng việc tạo một root Span đại diện cho cả Run, sau đó bóc tách các Span con theo các giai đoạn cốt lõi: gọi mô hình, truy xuất, reranking, gọi Tool, Agent con và kiểm tra kết quả. Chỉ những thao tác cần thống kê riêng biệt, có retry, timeout hoặc cần định vị sự cố mới nên tách Span độc lập, tránh tạo Span cho các hàm tiện ích vụn vặt.

### Làm thế nào để định vị một câu trả lời RAG bị sai?

Lần theo Trace để kiểm tra lần lượt: bước viết lại câu hỏi, tài liệu được recall, thứ tự reranking, việc cắt tỉa context, phiên bản Prompt và kết quả sinh ra của mô hình. Sau đó, dùng các bài đánh giá về trích dẫn và độ trung thực để xác định câu trả lời có dựa trên tài liệu hay không. Nhờ đó, bạn phân biệt được lỗi bắt nguồn từ khâu truy xuất hay do mô hình sinh ảo giác.

### Giữ chuỗi Trace như thế nào khi nhiều Agent thực thi song song?

Hãy để các Span của Agent con kế thừa cùng một context cha từ workflow. Khi chuyển thread, cần truyền Context tường minh hoặc tận dụng khả năng lan truyền ngữ cảnh của framework; khi vượt qua ranh giới dịch vụ và message queue, hãy inject và extract W3C Trace Context. Ở giai đoạn tổng hợp, cần ghi nhận danh sách kết quả của các Agent con thực tế đã được nạp vào.

### Có nên ghi toàn bộ Prompt và câu trả lời của mô hình vào Trace không?

Trên môi trường production thì không nên mặc định lưu toàn bộ. Hãy ưu tiên ghi nhận phiên bản, Token, thời gian phản hồi, mã hash và trạng thái kết quả. Khi cần điều tra nội dung, chỉ bật tạm thời trên các môi trường được kiểm soát hoặc cho các request cụ thể, đồng thời phải đi kèm cơ chế khử nhạy cảm, phân quyền, mã hóa, giới hạn thời gian lưu trữ và ghi log kiểm toán.

### Lựa chọn giữa Head Sampling và Tail Sampling như thế nào?

Head Sampling đơn giản, chi phí tính toán cố định, nhưng khi request mới bắt đầu thì chưa thể biết nó có bị lỗi hay không. Tail Sampling có thể chọn lọc giữ lại các Trace bị lỗi, chạy chậm và ngốn nhiều Token, nhưng bù lại Collector phải chờ đợi và tốn RAM để buffer dữ liệu. Dự án thực tế thường dùng Head Sampling tỷ lệ thấp làm nền tảng, kết hợp với các quy tắc Tail Sampling để nâng cao tỷ lệ giữ lại các request bất thường và rủi ro cao.

### Mối quan hệ giữa Trace và Evaluation là gì?

Trace tái hiện "hệ thống đã làm những gì", còn Evaluation đánh giá "hệ thống làm tốt hay dở". Các Trace thất bại trên production sau khi khử nhạy cảm có thể tích lũy thành tập Badcase, phục vụ cho việc replay offline, so sánh phiên bản và làm chốt chặn kiểm thử hồi quy trước khi release.

## Tổng kết

Làm tốt AI Observability là phải đảm bảo một request AI có thể được tái hiện lại một cách trọn vẹn. Việc cắm thêm một dashboard giám sát không giải quyết được gốc rễ của sự thiếu hụt dữ liệu hay việc đứt gãy chuỗi Trace.

Một giải pháp thực sự có thể phục vụ cho việc điều tra lỗi trên production tối thiểu phải đạt được các tiêu chuẩn sau:

- Phân biệt rạch ròi giữa Session, Run, Trace, Span và Attempt;
- Bao quát toàn diện từ Model, RAG, Tool, Agent cho đến kết quả nghiệp vụ cuối cùng;
- Lan truyền chuẩn xác Trace context qua Thread, Service và Message Queue;
- Phân tầng xử lý rõ ràng giữa trường low/high-cardinality, metadata và nội dung nhạy cảm;
- Kết hợp Head Sampling và Tail Sampling để vừa kiểm soát chi phí vừa giữ lại các bất thường then chốt;
- Đưa Trace từ production hồi lưu vào tập Badcase, bộ Evaluation và cổng kiểm soát phát hành;
- Tách bạch ranh giới giữa Trace quan sát kỹ thuật và Audit kiểm toán nghiệp vụ.

Khi production một lần nữa xuất hiện hiện tượng "API trả về 200 nhưng câu trả lời lại sai", một dòng log HTTP 200 hoàn toàn vô giá trị. Chỉ khi có thể lần theo Trace để tìm lại đúng mô hình, tài liệu, công cụ, phiên bản và kết quả thực thi của từng bước tại thời điểm đó, hệ thống Agent của bạn mới có được nền móng vững chắc để liên tục điều tra lỗi và nâng cao chất lượng.

## Tài liệu tham khảo

- [OpenTelemetry: Generative AI Semantic Conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/README.md)
- [OpenTelemetry: Semantic Conventions for GenAI Agent Spans](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md)
- [OpenTelemetry: Semantic Conventions for GenAI Metrics](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-metrics.md)
- [OpenTelemetry: Java API và Context Propagation](https://opentelemetry.io/docs/languages/java/api/)
- [OpenTelemetry: Java Agent Instrumentation Annotations](https://opentelemetry.io/docs/zero-code/java/agent/annotations/)
- [OpenTelemetry Collector: Tail Sampling Processor](https://explorer.opentelemetry.io/collector/components/contrib-tailsamplingprocessor?type=processor)
- [W3C: Trace Context](https://www.w3.org/TR/trace-context/)
- [Spring AI: Observability](https://docs.spring.io/spring-ai/reference/observability/index.html)
- [Spring Boot: Tracing](https://docs.spring.io/spring-boot/reference/actuator/tracing.html)
- [OpenAI Agents SDK: Tracing](https://openai.github.io/openai-agents-python/zh/tracing/)
- [Microsoft: Observability for Generative AI and agentic AI systems](https://learn.microsoft.com/en-us/security/zero-trust/sfi/observability-ai-systems)
- [Microsoft Foundry: Thiết lập tracking trong Microsoft Foundry](https://learn.microsoft.com/zh-cn/azure/foundry/observability/how-to/trace-agent-setup)
- [Alibaba Cloud ARMS: Thuyết minh định nghĩa trường LLM Trace](https://help.aliyun.com/zh/arms/application-monitoring/developer-reference/llm-trace-field-definition-description)
- [Tencent Cloud CLS: Chi tiết ứng dụng Agent Observability](https://cloud.tencent.com/document/product/614/133517)
- [Apache SkyWalking: Giám sát ứng dụng mô hình lớn dựa trên SkyWalking 10.4](https://skywalking.apache.org/zh/2026-04-05-virtual-genai-monitoring/)
