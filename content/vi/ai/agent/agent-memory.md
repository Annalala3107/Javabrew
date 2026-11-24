---
title: "Hệ thống bộ nhớ AI Agent: Bộ nhớ ngắn hạn, bộ nhớ dài hạn và cơ chế tiến hóa bộ nhớ"
description: "Phân biệt rõ các phân tầng và dạng biểu diễn bộ nhớ của Agent (Token/Tham số/Tiềm ẩn), luồng đọc-ghi bộ nhớ ngắn/dài hạn, lựa chọn giữa Vector DB và Markdown, cùng phương thức triển khai tinh gọn như Claude Code."
category: Phát triển ứng dụng AI
head:
  - - meta
    - name: keywords
      content: AI Agent,hệ thống bộ nhớ,Memory,bộ nhớ ngắn hạn,bộ nhớ dài hạn,Context Engineering,Mem0,MemGPT,ZEP,Agent Skills
lang: vi
sourceRef: zh-ref/ai/agent/agent-memory.md
---


Khi các tác vụ dài bắt đầu vận hành, hệ thống sẽ rất nhanh chóng chạm phải hàng loạt ràng buộc cứng: context window có giới hạn trên, chi phí Token tăng đều đặn, và một khi Session kết thúc mà dữ liệu chưa được lưu xuống cơ sở dữ liệu, quỹ đạo thực thi của lượt trước mặc định sẽ biến mất cùng tiến trình. Ngay cả khi mô hình hoàn thành lượt suy luận hiện tại, nó vẫn thiếu một nơi để lưu trữ và tái sử dụng lịch sử hoạt động.

Tầng bộ nhớ (Memory layer) cần đồng thời giữ lại các sự thật cốt lõi của cuộc hội thoại hiện tại, vừa cho phép Session mới truy xuất lại sở thích, ngữ cảnh và các quyết định lịch sử của người dùng. Bài viết này sẽ lần lượt phân tích cách biểu diễn và phân loại chức năng của bộ nhớ, vòng đời đọc-ghi, cách triển khai ngắn hạn và dài hạn, các sản phẩm phổ biến và tối ưu hóa truy xuất, cũng như giải pháp lưu trữ bộ nhớ bằng Markdown. Việc cắt tỉa sliding window ra sao, offload context như thế nào có giao điểm với bài [《Context Engineering là gì? Khác gì với Prompt Engineering?》](./context-engineering.md) trên cùng trang web; bạn đọc có thể tham khảo đối chiếu cả hai bài.

## Hệ thống bộ nhớ của Agent được thiết kế như thế nào?

![Toàn cảnh phân loại bộ nhớ của Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-memory-taxonomy-81b25fc2.svg)

Hệ thống bộ nhớ thường được chia thành hai tầng: bộ nhớ ngắn hạn (Short-term Memory) và bộ nhớ dài hạn (Long-term Memory). Bộ nhớ ngắn hạn có phạm vi ở cấp độ Session và phục vụ tác vụ hiện tại; bộ nhớ dài hạn xuyên suốt qua các Session, chịu trách nhiệm tích lũy sở thích người dùng, các quyết định lịch sử và kinh nghiệm đã qua. Cả hai cần được tách biệt rõ ràng cả về mặt vật lý lẫn logic, không nên gom chung làm một.

![Kiến trúc hệ thống bộ nhớ của AI Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-arch-3b774c14.png)

### Bộ nhớ có những hình thức lưu trữ nào?

Bên cạnh việc phân chia theo chiều thời gian, bộ nhớ còn có thể phân thành ba loại dựa trên vị trí lưu trữ và hình thức biểu diễn:

| Hình thức lưu trữ | Mô tả | Triển khai điển hình |
| ----------------- | ----- | -------------------- |
| Bộ nhớ cấp Token (Token-level Memory) | Lưu trữ trong cơ sở dữ liệu bên ngoài dưới dạng ngôn ngữ tự nhiên hoặc ký hiệu rời rạc | Khối văn bản trong Vector DB, JSON có cấu trúc |
| Bộ nhớ tham số hóa (Parametric Memory) | Mã hóa thông tin trực tiếp vào các tham số của mô hình | Tri thức tiền huấn luyện (Pre-trained), LoRA adapter, SFT fine-tuning |
| Bộ nhớ tiềm ẩn (Latent Memory) | Được mang tải ngầm định bên trong các biểu diễn nội bộ của mô hình | KV Cache, giá trị kích hoạt (Activation), Hidden States |

Ba hình thức này không hoàn toàn tách rời nhau. Khung kiến trúc "Khối lập phương bộ nhớ" (Memory Cube) do MemOS đề xuất hỗ trợ sự chuyển dịch động từ bộ nhớ văn bản thuần (plaintext), sang bộ nhớ kích hoạt (KV Cache), rồi tiến tới bộ nhớ tham số. Nói một cách đơn giản, bộ nhớ "nóng" được dùng thường xuyên sẽ đặt ở vị trí gần hơn, còn bộ nhớ "lạnh", ổn định và dài hạn sẽ được cố định hóa bằng các phương thức bền vững và có trọng lượng lớn hơn.

### Phân loại bộ nhớ theo chức năng như thế nào?

Xét theo mục đích chức năng, bộ nhớ của Agent có thể chia làm ba nhóm:

| Loại chức năng | Câu hỏi cốt lõi | Nội dung lưu trữ | Tình huống điển hình |
| -------------- | --------------- | ---------------- | -------------------- |
| Bộ nhớ sự thật (Factual Memory) | Agent biết những gì? | Sở thích người dùng, trạng thái môi trường, sự thật tường minh | Ghi nhớ tech stack ưa thích của người dùng |
| Bộ nhớ kinh nghiệm (Experiential Memory) | Agent cải thiện ra sao? | Quỹ đạo đã qua, bài học thành bại, tri thức chiến lược | Học hỏi từ các lần review code thất bại |
| Bộ nhớ làm việc (Working Memory) | Agent đang suy nghĩ gì? | Ngữ cảnh suy luận hiện tại, tiến độ tác vụ | Trạng thái trung gian trong suy luận nhiều bước |

Theo tính chất nội dung, chúng ta có thể tiếp tục phân loại chi tiết hơn:

- Bộ nhớ tình tiết (Episodic Memory): Ghi lại các sự kiện cụ thể ở thời gian, ngữ cảnh nhất định, trả lời cho câu hỏi "What happened?" (Chuyện gì đã xảy ra?). Ví dụ: "Thứ tư tuần trước người dùng phản ánh vấn đề timeout đơn hàng".
- Bộ nhớ ngữ nghĩa (Semantic Memory): Tri thức, sự thật hoặc quy luật tổng quát được đúc rút từ nhiều tình tiết, trả lời cho câu hỏi "What does it mean?" (Điều đó có nghĩa là gì?). Ví dụ: "Người dùng này nhạy cảm với vấn đề hiệu năng hơn là yêu cầu tính năng".
- Bộ nhớ thủ tục (Procedural Memory): Lưu trữ kỹ năng, quy tắc và hành vi đã được tôi luyện, giúp Agent tự động thực thi một chuỗi tác vụ nhất định thay vì phải suy luận lại từ đầu mỗi lần. Ví dụ: "Khi xử lý code review cho người dùng này, ưu tiên kiểm tra nguy cơ OOM trước".

### Vòng đời thao tác bộ nhớ diễn ra như thế nào?

![Vòng đời thao tác bộ nhớ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-lifestyle-e8865143.png)

Một mẩu bộ nhớ từ lúc đi vào hệ thống cho tới khi bị loại bỏ thường trải qua các giai đoạn sau. Tên gọi trong các bài báo nghiên cứu có thể khác nhau, nhưng ý nghĩa ngữ nghĩa về cơ bản là tương đồng:

```text
Encode (Mã hóa) → Storage (Lưu trữ) → Retrieval (Truy xuất) → Consolidation (Củng cố) → Reflection (Phản tư) → Forgetting (Lãng quên)
```

| Thao tác | Mô tả | Triển khai kỹ thuật |
| -------- | ----- | ------------------- |
| Encode (Mã hóa) | Chuyển đổi tương tác thô thành thông tin có cấu trúc để lưu trữ | LLM trích xuất bộ ba sự thật (triples), tạo tóm tắt |
| Storage (Lưu trữ) | Lưu trữ bền vững thông tin đã mã hóa | Ghi vào Vector DB / Graph DB / Tham số mô hình |
| Retrieval (Truy xuất) | Truy xuất bộ nhớ liên quan dựa vào ngữ cảnh | Tìm kiếm vector + BM25 + duyệt đồ thị (Graph traversal) |
| Consolidation (Củng cố) | Chuyển hóa bộ nhớ ngắn hạn thành bộ nhớ dài hạn | Tác vụ bất đồng bộ: tóm tắt hội thoại → kho thực thể |
| Reflection (Phản tư) | Chủ động xem xét, đánh giá nội dung bộ nhớ để tối ưu quyết định | Trích xuất Meta-Knowledge sau khi hoàn thành tác vụ |
| Forgetting (Lãng quên) | Đào thải bộ nhớ có giá trị thấp hoặc đã lỗi thời | Suy giảm trọng số (Weight decay) + đánh dấu xung đột để hủy bỏ |

Nếu mọi lượt trò chuyện đều gửi đi trích xuất thì các câu chào hỏi xã giao, phỏng đoán tạm thời và mô tả lặp lại cũng sẽ tràn vào cơ sở dữ liệu. Sử dụng Reinforcement Learning để quyết định thời điểm đọc ghi có thể giảm bớt các thao tác ghi thừa thãi này, nhưng chi phí huấn luyện, replay và giải thích lý do lưu giữ là không hề nhỏ.

Nhiều hệ thống trước hết dùng các quy tắc như `importance` để chặn nội dung vô ích, sau đó giao cho các tác vụ offline xử lý xung đột, trùng lặp và bản ghi hết hạn. Quy tắc cần bám sát nghiệp vụ, nhưng mỗi lần ghi và dọn dẹp đều để lại kết quả có thể kiểm tra và kiểm toán rõ ràng.

### Bộ nhớ ngắn hạn (Short-Term Memory / Working Memory) là gì?

Bộ nhớ ngắn hạn là thông tin tạm thời mà Agent nắm giữ trong một phiên hội thoại đơn lẻ hiện tại, bao gồm câu hỏi của người dùng, câu trả lời của mô hình qua từng lượt, và kết quả trung gian từ các lượt gọi công cụ (Observations). Những nội dung này sẽ trực tiếp đi vào Prompt của lượt hiện tại, đóng vai trò là vật chứa chính cho trạng thái tác vụ đang diễn ra. Nếu phía máy chủ host có các hidden state hoặc JSON `state`, chúng cũng cần được đồng bộ nhất quán với luồng tường thuật này.

Bộ nhớ ngắn hạn chủ yếu dựa vào context window của chính LLM. Giới hạn trên của các model rất khác nhau và có thể thay đổi ngay trong cùng một dòng sản phẩm. Ví dụ, context window chính thức của [Grok 4](https://x.ai/news/grok-4) là 256K Token, còn 2M Token là của [Grok 4 Fast](https://x.ai/news/grok-4-fast); không thể chỉ dựa vào tên họ sản phẩm chung chung mà suy đoán thông số. Khi chọn model, cần tra cứu model card hoặc tài liệu API chính thức của mã model ID tương ứng và ghi lại ngày đối soát; bài viết này chủ động không duy trì một bảng độ dài context window vốn rất nhanh lỗi thời.

Context window lớn không đồng nghĩa với việc có thể nhồi nhét ngữ cảnh vô tội vạ. Chi phí suy luận tăng tuyến tính theo số lượng Token. Nghiên cứu *Lost in the Middle* cũng chỉ ra rằng, trong các tác vụ truy xuất đa tài liệu, mô hình tận dụng thông tin ở phần đầu và phần cuối ngữ cảnh tốt hơn rất nhiều, trong khi tỷ lệ tận dụng thông tin ở đoạn giữa giảm sút rõ rệt. Cửa sổ càng dài, độ lệch vị trí (positional bias) này càng rõ nét, vì vậy trong Context Engineering cần chủ động kiểm soát sự phân bổ thông tin đầu vào.

![Hiện tượng ngưỡng 40% của tỷ lệ tận dụng ngữ cảnh](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-utilization-40-percent-threshold-phenome-b46a6ca1.svg)

Con số 40% trong hình bắt nguồn từ quan sát trên các model và tác vụ cụ thể, không phải là một ngưỡng phổ quát; hiện tượng lệch vị trí trong *Lost in the Middle* và sự sụt giảm hiệu suất tận dụng thông tin khi context phình to là hai vấn đề khác nhau, không nên đánh đồng.

Để kiểm soát sự phình to của bộ nhớ ngắn hạn, tầng framework thường áp dụng ba cách làm, cùng chung tư duy với việc hạ cấp Token (token degradation) và offload JIT trong Context Engineering:

Thứ nhất là Thu giảm ngữ cảnh (Context Reduction). Khi lịch sử hội thoại đạt ngưỡng Token định sẵn, framework sẽ tự động loại bỏ N lượt tin nhắn cũ nhất (cơ chế sliding window); hoặc gọi một model gọn nhẹ để nén lịch sử trò chuyện thành bản tóm tắt, chấp nhận tổn hao thông tin để đổi lấy không gian ngữ cảnh.

Thứ hai là Hạ tải ngữ cảnh (Context Offloading). Các lệnh gọi Tool hoặc Skill có thể trả về lượng dữ liệu rất lớn, chẳng hạn như toàn bộ mã HTML trang web hay nội dung file CSV. Lúc này, có thể đưa kết quả nặng sang bộ lưu trữ tạm thời bên ngoài, trong Prompt chỉ giữ lại một tham chiếu ngắn gọn, như UUID hoặc đường dẫn file. Khi mô hình cần đào sâu chi tiết, nó sẽ gọi công cụ nội bộ thông qua Function Calling có ràng buộc để đọc lại. Giao diện đọc phải định nghĩa rõ thời gian chờ (timeout) và giới hạn kích thước tối đa; khi vượt ngưỡng cần trả về kết quả cắt ngắn hoặc thông tin fallback rõ ràng, tránh để một lệnh gọi công cụ kéo sập toàn bộ các bước phía sau.

Thứ ba là Cô lập ngữ cảnh (Context Isolation). Agent chính chỉ chuyển giao mô tả nhiệm vụ con và các đoạn thông tin thực sự cần thiết cho Agent con (sub-agent). Việc phát sóng (broadcast) toàn bộ lịch sử hội thoại theo tác vụ vừa làm tiêu tốn Token trùng lặp, vừa đưa các thông điệp không liên quan vào quá trình phán đoán của tác vụ con.

### Bộ nhớ dài hạn (Long-Term Memory) là gì?

Bộ nhớ dài hạn nằm ngoài phạm vi Session. Sau khi cuộc hội thoại kết thúc, các sở thích, sự thật và quyết định sẽ được ghi vào bộ lưu trữ; Session mới sẽ chỉ truy xuất các mục liên quan đến câu hỏi hiện tại, chứ không bê nguyên xi toàn bộ nhật ký trò chuyện cũ về.

Bộ nhớ dài hạn có thể hiểu là hai luồng: Ghi nhận (Record) và Truy xuất (Retrieve).

Ghi nhớ (Record) thường diễn ra sau khi kết thúc hội thoại. Framework kích hoạt tác vụ bất đồng bộ dưới nền, gọi LLM để tinh chế ngữ nghĩa của bộ nhớ ngắn hạn trong phiên này: lọc bỏ nhiễu trò chuyện dư thừa, trích xuất các sự thật có cấu trúc giá trị cao—ví dụ "tech stack ưa thích của người dùng là Python + FastAPI", "người dùng báo cáo công việc cho CFO nên cần văn phong phi kỹ thuật"—rồi ghi vào bộ lưu trữ bền vững.

Luồng ghi này tốt nhất nên được thiết kế theo cơ chế nỗ lực tối đa (Best-Effort). Việc trích xuất của LLM có thể bỏ sót sự thật quan trọng, hoặc ghi nhầm một phát biểu giả định thành sở thích cố định. Bản thân thao tác ghi cần có Idempotent Key để tránh việc thử lại tạo ra các bộ nhớ trùng lặp. Trong kịch bản trích xuất bằng LLM, Idempotent Key phù hợp hơn khi tạo dựa trên `source_message_id + extraction_batch_id` thay vì dựa trên văn bản kết quả trích xuất, bởi vì việc lấy mẫu nhiệt độ (temperature) hay tinh chỉnh prompt có thể tạo ra câu chữ khác nhau dù cùng ngữ nghĩa, khiến hàm băm chuỗi không đáng tin cậy. Khi có nhiều client trò chuyện đồng thời, việc hợp nhất và ghi đè kho thực thể cần áp dụng khóa lạc quan (optimistic lock) hoặc kiểm soát đồng thời đa phiên bản (MVCC).

Truy xuất bộ nhớ (Retrieve) thường diễn ra khi bắt đầu một Session mới. Hệ thống vector hóa Query của người dùng, sau đó thực hiện tìm kiếm tương đồng ngữ nghĩa với các mục trong kho bộ nhớ dài hạn, rồi đưa nhóm mục có độ khớp cao nhất lên đầu (prepend) vào System Prompt hoặc đặt vào slot song song. Chạy một lần truy xuất vector trên luồng trả về gói tin đầu tiên (first-packet path) là rất phổ biến, nhưng độ trễ P99 của VectorStore sẽ trực tiếp ảnh hưởng đến TTFT (Time to First Token). Biện pháp giảm thiểu phổ biến là dùng Redis làm bộ đệm làm ấm trước (warm-up cache), hoặc tải trước toàn bộ sở thích nông và chân dung tĩnh, còn bộ nhớ sâu thì chuyển sang re-ranking bất đồng bộ, hoặc gối đầu lên pipeline tạo văn bản để triệt tiêu cảm giác chờ đợi của người dùng.

### Bộ nhớ dài hạn khác gì với RAG?

![Sự khác biệt giữa bộ nhớ dài hạn và RAG (Retrieval-Augmented Generation)](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-rag-vs-memory-455ff42b.svg)

Bộ nhớ dài hạn và RAG về mặt kỹ thuật rất giống nhau, cả hai đều sử dụng Vector DB và tìm kiếm ngữ nghĩa. Tuy nhiên đối tượng phục vụ của chúng lại khác biệt:

RAG thường gắn kết với các nguồn tri thức dùng chung như quy định công ty, tài liệu sản phẩm và kết quả truy vấn cơ sở dữ liệu thời gian thực, nhưng bản thân nó không hẳn là "phi cá nhân hóa". Luồng truy xuất có thể lọc dữ liệu theo tenant, người dùng, vai trò hoặc phiên làm việc, cũng như có thể dùng sở thích người dùng để sắp xếp lại kết quả. So với bộ nhớ dài hạn, RAG nhấn mạnh vào việc lấy bằng chứng từ nguồn tri thức bên ngoài; nguồn tri thức đó là dùng chung hay cá nhân hóa hoàn toàn phụ thuộc vào thiết kế chỉ mục (index) và phân quyền.

Bộ nhớ dài hạn quản lý kinh nghiệm cá nhân hóa được tích lũy động qua quá trình tương tác giữa Agent với một người dùng cụ thể, chẳng hạn như sở thích, thói quen, quyết định lịch sử và ngữ cảnh riêng biệt. Nó mang tính cá nhân hóa cao và thay đổi theo từng cá nhân.

Khi truy xuất, có thể tách riêng việc thu hồi bằng chứng bên ngoài (như quy chế công ty, tài liệu sản phẩm) và bộ nhớ cá nhân (như sở thích, quyết định trong quá khứ), sau đó xếp hạng thống nhất. Các thực thể trong bộ nhớ dài hạn cũng có thể mở rộng query RAG, và sở thích người dùng có thể tham gia vào việc re-ranking kết quả.

## Các kiến trúc kỹ thuật bộ nhớ phổ biến gồm những gì?

Lưu trữ vector, tìm kiếm ngữ nghĩa và quản lý bộ nhớ thường được tách riêng biệt: Agent chính chịu trách nhiệm điều phối, còn các thành phần bộ nhớ chịu trách nhiệm ghi, truy vấn và bảo trì.

### Kiến trúc lưu trữ tầng dưới thường bao gồm những phân tầng nào?

Trách nhiệm tầng dưới phổ biến được chia làm ba lớp:

VectorStore chịu trách nhiệm lưu trữ vector. Nó chuyển đổi các văn bản bộ nhớ được trích xuất thành Embeddings rồi lưu vào cơ sở dữ liệu vector. Lấy ví dụ một node Qdrant phiên bản 1.x đơn lẻ, dùng SSD cục bộ, chỉ mục HNSW ef=128, Recall@10 ≥ 0.95 làm chuẩn: trong kịch bản đồng thời thấp (như QPS < 50), độ trễ P99 có thể kiểm soát ở mức vài chục mili-giây. Các sản phẩm khác nhau ở cùng mức QPS có thể chênh lệch P99 từ 5 đến 10 lần, ví dụ giữa Pinecone Serverless, Qdrant tự dựng và Milvus sẽ có khoảng cách rõ ràng. Việc lựa chọn giải pháp thực tế nên tham khảo [ann-benchmarks.com](https://ann-benchmarks.com/) hoặc báo cáo benchmark từ các nhà cung cấp. Các giải pháp phổ biến gồm Pinecone, Weaviate, Chroma, Qdrant, v.v.

GraphStore chịu trách nhiệm lưu trữ đồ thị. Trong các tình huống nâng cao, bộ nhớ có thể được mô hình hóa thành Đồ thị tri thức (Knowledge Graph) dưới dạng "Thực thể - Mối quan hệ", chẳng hạn sử dụng Neo4j. Nó phù hợp hơn cho các truy vấn phức tạp đòi hỏi suy luận nhiều chặng (multi-hop reasoning), ví dụ: "Mối liên hệ giữa đồng nghiệp A và dự án B mà người dùng đã đề cập là gì?".

Reranker chịu trách nhiệm sắp xếp lại. Tìm kiếm vector chỉ là bước thu hồi (recall) sơ bộ, độ tương quan ngữ nghĩa không phải lúc nào cũng được sắp xếp chính xác. Reranker thường dựa trên Cross-Encoder để thực hiện xếp hạng tinh chỉnh lần hai cho các kết quả ứng viên, đưa bộ nhớ liên quan hơn lên phía trước, giảm thiểu nội dung không liên quan đi vào ngữ cảnh.

Việc chọn lựa Vector DB cần đồng thời đối soát các yếu tố về chỉ mục, bộ lọc, cô lập, tính nhất quán và chi phí:

| Chiều đánh giá | Cân nhắc cốt lõi | Giải thích |
| -------------- | ---------------- | ---------- |
| Loại chỉ mục | HNSW / IVF / DiskANN | Ảnh hưởng đến sự đánh đổi (tradeoff) giữa tỷ lệ recall và độ trễ |
| Lọc Metadata | pre-filter vs post-filter | Trong trường hợp tỷ lệ lọc cao, pre-filter dễ phá vỡ tính liên thông cấu trúc đồ thị |
| Cô lập đa người thuê (Multi-tenant) | Namespace / Collection / Cô lập vật lý | Ảnh hưởng đến tỷ lệ recall và an toàn dữ liệu |
| Tính nhất quán lưu trữ | Nhất quán mạnh vs Nhất quán cuối cùng | Ảnh hưởng đến độ tin cậy của thao tác ghi |
| Mô hình chi phí | Serverless theo dung lượng vs Tự dựng cụm | Ảnh hưởng đến chi phí vận hành |

Câu nói "Tôi có thể sẽ..." do mô hình trích xuất ra không thể xem ngay là sở thích cố định. Trước khi ghi, có thể dùng JSON Schema để ràng buộc các trường và xem xét lại các mục có độ tin cậy thấp; các mục có `importance` cao cần giữ lại đoạn hội thoại gốc và kết quả trích xuất để thuận tiện truy vết nguồn gốc.

### So sánh các sản phẩm Memory phổ biến ra sao?

Bảng dưới đây liệt kê trọng tâm của một số dự án hoặc sản phẩm mã nguồn mở/thương mại. Việc lựa chọn công nghệ cần dựa vào độ trễ, yêu cầu tuân thủ và hình thái dữ liệu thực tế, không thể chỉ đối chiếu dựa trên tên tính năng:

| Sản phẩm | Tư tưởng cốt lõi | Điểm sáng kỹ thuật | Kịch bản áp dụng |
| -------- | ---------------- | ------------------ | ---------------- |
| [Mem0](https://github.com/mem0ai/mem0) | Trích xuất đơn ADD-only + Truy xuất kết hợp đa tín hiệu | Một lần gọi LLM hoàn thành trích xuất thực thể và liên kết chéo bộ nhớ; chấm điểm song song ngữ nghĩa + BM25 + Entity Linking; hỗ trợ bộ nhớ đồ thị qua backend GraphStore tùy chọn (Mem0g) | Bộ nhớ hội thoại đa dụng |
| LETTA (tiền thân là MemGPT) | Phân trang bộ nhớ ảo của hệ điều hành | Trao đổi động Main Context ↔ External Context; nén tóm tắt đệ quy | Quản lý ngữ cảnh hội thoại dài |
| ZEP | Đồ thị tri thức nhận biết thời gian (Temporal-aware KG) | Engine Graphiti tự phát triển; đồ thị con 3 tầng (tình tiết, ngữ nghĩa, cộng đồng); cơ chế vô hiệu hóa cạnh (edge invalidation) | Kịch bản đa người thuê cấp doanh nghiệp |
| A-MEM | Quản lý tri thức Zettelkasten | Phương pháp ghi chép thẻ bài (Slip-box); tự động thiết lập liên kết ngữ nghĩa giữa các bộ nhớ | Tác vụ thâm dụng tri thức |
| MemOS | Chuyển đổi linh hoạt giữa 3 loại bộ nhớ | Văn bản thuần ↔ Bộ nhớ kích hoạt (KV Cache) ↔ Bộ nhớ tham số (LoRA) | Quản lý bộ nhớ full-stack |
| MIRIX | Phân công phối hợp 6 module | Router quản lý siêu bộ nhớ (Meta-memory); các thành phần bộ nhớ khác nhau dùng cấu trúc lưu trữ riêng | Hỗ trợ ra quyết định phức tạp |

### LETTA, ZEP và MemOS có gì khác biệt?

LETTA hình dung context giống như các trang (pages) trong hệ điều hành. Main Context chứa chỉ thị hệ thống và không gian làm việc hiện tại, cơ chế FIFO giữ lại các tin nhắn mới nhất; khi không chứa nổi nữa, các đoạn cũ sẽ được tóm tắt đệ quy rồi chuyển vào External Context. Tư duy này rất dễ hiểu, nhưng lại là một con đường có hao hụt (lossy). Sau nhiều vòng tóm tắt đệ quy, các chi tiết chính xác như chuỗi secret, stack lỗi, các chữ số thập phân sẽ rất dễ bị gọt mất đầu tiên. Nhìn bên ngoài có vẻ như Agent bị "mất trí nhớ", nhưng thực chất đó là tác dụng phụ của việc nén dữ liệu.

ZEP bổ sung ba tầng chi tiết trên đồ thị: đồ thị con tình tiết (episodic) giữ chặt payload gốc, đồ thị con ngữ nghĩa (semantic) trích xuất quan hệ thực thể, và đồ thị con cộng đồng (community) gom các kết nối mạnh thành các bản tóm tắt lớn. Hướng tiếp cận này có nét tương đồng với tầng cộng đồng trong GraphRAG. Điểm đáng học hỏi hơn ở ZEP là cơ chế vô hiệu hóa cạnh (edge invalidation): khi sự thật mới trùng lặp thời gian với cạnh cũ, hệ thống sẽ đánh dấu cạnh cũ đã hết hiệu lực kèm timestamp. Bằng cách này, vừa có thể theo dõi sự thật mới, vừa thuận tiện cho việc kiểm toán lại các phán đoán trong quá khứ.

MemOS trong các bài báo và tài liệu giới thiệu vẽ ra bậc thang chuyển dịch "Văn bản → KV Cache (Kích hoạt) → LoRA (Tham số)". Việc nạp sẵn các mục nóng vào cache giúp giảm độ trễ khởi động lạnh (cold-start); còn nếu muốn cố định hóa bộ nhớ thành trọng số mô hình, ta phải đi qua quy trình SFT offline, điều này sẽ tạo ra một khoản chi phí huấn luyện riêng biệt.

Ở đây có một rào cản rất thực tế: một khi đã ghi vào LoRA thì rất khó xóa. Trong Vector DB chỉ cần xóa một dòng, nhưng đục bỏ một mẩu sự thật cụ thể ra khỏi tham số mô hình về bản chất sẽ đụng tới vùng nước sâu chưa hoàn thiện của Machine Unlearning. Vì vậy, bộ nhớ tham số chỉ thích hợp cho các sở thích rất ít biến động. Trong môi trường multi-tenant, nó còn phụ thuộc vào các runtime như vLLM hay TGI có hỗ trợ gắn/gỡ adapter linh hoạt hay không.

```text
Bộ nhớ văn bản thuần ──(Dùng tần suất cao)──→ Bộ nhớ kích hoạt (KV Cache) ──(Cố định hóa dài hạn)──→ Bộ nhớ tham số (LoRA)
         ↑                                                                                                  │
         └──────────────────────────(Kiến thức lỗi thời / Gỡ bỏ)────────────────────────────────────────────┘
```

## Các cơ chế tiến hóa bộ nhớ nâng cao gồm những gì?

Chỉ biết ghi và truy xuất là chưa đủ. Một hệ thống Agent ở cấp độ production còn cần một cơ chế trao đổi chất (metabolic mechanism), giúp bộ nhớ có thể được phản tư, hợp nhất, dọn dẹp và lãng quên, nếu không thì kho càng lớn, nhiễu càng nhiều.

![Cơ chế tiến hóa nâng cao của hệ thống bộ nhớ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-evolution-f9e42930.png)

### Phản tư và tổng hợp bộ nhớ được thực hiện như thế nào?

Nếu hệ thống chỉ biết append thêm dữ liệu, bộ nhớ dài hạn sẽ nhanh chóng biến thành một cuốn sổ ghi chép vụn vặt hỗn độn. Giá trị thực sự nằm ở việc đúc kết từ đống ghi chép vụn vặt đó ra các quy tắc, sở thích và bài học có thể tái sử dụng.

Trong các hệ thống thực tế, người ta thường bổ sung thêm một tầng tác vụ tự xem xét (introspection) chạy offline hoặc gần thời gian thực:

Nhóm thứ nhất là Tự phản tư (Self-Reflection). Sau khi tác vụ kết thúc, Agent kích hoạt một tác vụ bất đồng bộ để phân tích nguyên nhân thành bại của nhiệm vụ lần này, trích xuất "bài học kinh nghiệm" thành một mẩu Meta-Knowledge. Cơ chế này lần đầu được đề xuất có hệ thống bởi Park et al. (2023) trong bài báo *Generative Agents*, có thể coi là sự mô phỏng kỹ thuật của hiện tượng "củng cố bộ nhớ trong giấc ngủ" ở con người. Ví dụ, nếu nhật ký code review nhiều lần ghi nhận việc người dùng ưu tiên xử lý rủi ro OOM, thì với điều kiện giữ lại nguồn gốc và phạm vi áp dụng, thông tin này có thể kết tinh thành thứ tự kiểm tra cho các lần review sau. Một lần phản hồi đơn lẻ chưa thể lập tức suy ra một sở thích ổn định.

Nhóm thứ hai là Vòng lặp phản tư chi tiết (Reflect Loop). Sau khi một tác vụ con có độ rủi ro cao hoàn thành, hệ thống sẽ kiểm tra độc lập xem căn cứ sự thật, tiêu chuẩn nghiệm thu và các dữ liệu trọng yếu có bị thất lạc giữa các node hay không; nếu có thiếu sót sẽ trả về node thực thi để bổ sung, sau khi kiểm tra đạt mới ghi vào bộ nhớ dài hạn. Nếu tác vụ rủi ro thấp cũng áp dụng tầng kiểm tra này sẽ làm tăng độ trễ và chi phí không cần thiết.

Nhóm thứ ba là Phân cụm và Hợp nhất bộ nhớ (Clustering & Consolidation). Khi người dùng liên tục nhắc đến cùng một bối cảnh dự án, việc gom các mẩu ghi chép rời rạc thành các mục thực thể có nguồn gốc rõ ràng sẽ giúp kết quả truy xuất không bị chiếm dụng bởi các cách diễn đạt khác nhau của cùng một sự thật.

### Cơ chế dọn dẹp và lãng quên bộ nhớ diễn ra ra sao?

Bộ nhớ không phải cứ càng nhiều càng tốt. Nhiễu vô ích và thông tin lỗi thời sẽ gây nhiễu loạn nghiêm trọng đối với phán đoán của LLM.

Một cách làm phổ biến là Suy giảm trọng số (Weight decay). Hệ thống duy trì điểm số tổng hợp cho từng mẩu bộ nhớ:

```text
score = relevance × importance × decay(t)
```

Trong đó `decay(t)` thường có dạng hàm mũ, ví dụ `e^{-λt}`. Cơ chế này bắt nguồn từ mô hình truy xuất 3 chiều trong *Generative Agents*. Trong kỹ thuật thực tế, không khuyến nghị tính toán suy giảm thời gian trên toàn bộ kho bộ nhớ trong Vector DB mỗi lần truy vấn; cách làm vững chắc hơn là Vector DB thực hiện thu hồi ngữ nghĩa tĩnh trước, sau đó mới áp dụng điều chỉnh động trong giai đoạn Reranker.

Một cách làm khác là Giải quyết xung đột (Conflict resolution). Khi sự thật mới mâu thuẫn với sự thật cũ, chẳng hạn năm ngoái người dùng dùng Java 8 nhưng năm nay nâng cấp lên Java 21, bộ nhớ cũ cần được đánh dấu là phế bỏ. Lưu ý rằng việc xóa mềm (soft delete) trong các Vector DB phổ biến có thể phá hỏng tính liên thông cấu trúc đồ thị HNSW, do đó cần định kỳ chạy các tác vụ Vacuum để dọn dẹp và tái thiết lập chỉ mục.

Điểm này thường bị nhiều team đánh giá thấp lúc ban đầu. Mọi người hay tiếc rẻ không nỡ "lãng quên", nghĩ rằng giữ lại thông tin thì luôn tốt hơn vứt bỏ. Kết quả là Vector DB chất đống hàng trăm ngàn mẩu bộ nhớ, mỗi lần Top-K lại lọt vào một đống nhiễu lỗi thời, khiến lời khuyên của Agent vẫn dậm chân ở thời điểm ba năm trước. Trải nghiệm này vô cùng tệ hại và rất khó bù đắp bằng việc tinh chỉnh Prompt.

## Làm thế nào để tối ưu hóa hiệu quả truy xuất bộ nhớ dài hạn?

Bên cạnh VectorStore và GraphStore, môi trường production thường cần thêm một tầng chiến lược truy xuất lai (Hybrid Search).

![Chiến lược tối ưu hóa truy xuất bộ nhớ dài hạn](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-retrieval-optimization-30686755.png)

### Tìm kiếm lai và lọc Metadata thực hiện như thế nào?

Chỉ dựa thuần túy vào tìm kiếm vector rất dễ sinh ra "liên kết giả". Tìm kiếm dày đặc (Dense Retrieval) xét theo độ tương đồng ngữ nghĩa, đôi khi sẽ thu hồi những nội dung nghe có vẻ tương tự nhưng về mặt nghiệp vụ lại chẳng liên quan gì đến nhau.

Tìm kiếm lai (Hybrid Search) gom các tập ứng viên từ BM25 / Sparse và Dense lại với nhau. Khi truy vấn các danh từ riêng, ta có thể tăng trọng số của BM25; khi ý định mơ hồ, ta dựa nhiều hơn vào thu hồi vector. Các phương thức dung hợp phổ biến gồm:

- RRF (Reciprocal Rank Fusion): Hầu như không cần tinh chỉnh tham số, thích hợp cho cold start, dung hợp theo trọng số nghịch đảo thứ hạng.
- Linear weighted (`α · dense + (1 - α) · sparse`): Có thể tùy chỉnh, nhưng cần tập dữ liệu gán nhãn để hiệu chuẩn trọng số.
- Cross-encoder Reranker: Lấy hợp ở giai đoạn thu hồi (recall), chấm điểm thống nhất ở giai đoạn xếp hạng tinh (fine-ranking), rất hữu ích cho các query thuộc phần đuôi dài (long-tail).

Khi request đa người thuê đi vào tầng truy xuất, nó phải mang theo các điều kiện lọc cứng như UserID, ID tổ chức, khoảng thời gian và nhãn nghiệp vụ. Thiếu đi tầng giới hạn này, sở thích của người dùng này có thể xuất hiện trong kết quả của người dùng khác; do đó các điều kiện cô lập phải do tầng truy cập dữ liệu (data access layer) tiêm vào một cách thống nhất.

Bộ lọc chặt trên HNSW cũng có cái giá của nó: trong một đồ thị khổng lồ mà chỉ giữ lại số ít nhãn của một tenant, các đường dẫn liên thông sẽ giảm đi, tỷ lệ recall có thể sụt giảm theo. Với các tenant cốt lõi hoạt động mạnh, có thể dùng Collection độc lập để cô lập vật lý.

### Tại sao việc tối ưu luồng truy xuất thường đi trước chiến lược ghi?

Khi kho ứng viên đã có sẵn thông tin cần thiết, việc sửa luồng truy xuất thường mang lại hiệu quả trực tiếp hơn là mở rộng việc ghi.

Mem0 đạt 91.6 trên LoCoMo, tăng 20 điểm so với thuật toán cũ; đạt 93.4 trên LongMemEval, tăng 26 điểm; đạt 64.1 trên BEAM (1M); mỗi lần truy xuất tiêu tốn khoảng 7K Token, tiết kiệm hơn nhiều so với mức 25K+ của phương án đưa toàn bộ ngữ cảnh vào. Chi tiết xem tại [Benchmark chính thức của Mem0](https://docs.mem0.ai/core-concepts/memory-evaluation).

Khi bộ nhớ không phát huy tác dụng, trước hết hãy nhìn vào Trace: câu query được viết lại (rewrite) như thế nào, điều kiện lọc có đúng không, những mục nào lọt vào tập ứng viên, Reranker chấm điểm ra sao. Khi đã xác định chắc chắn kho ứng viên thiếu thông tin cần thiết, lúc đó mới thay đổi quy tắc trích xuất hoặc tăng ngân sách ghi.

## Kiến trúc hệ thống bộ nhớ cấp Production cần chú ý những điểm gì?

Khi thực sự đưa vào production, điều cần bám sát không chỉ là "có nhớ được hay không", mà còn bao gồm độ chính xác khi thu hồi, tính tuân thủ pháp lý, hiệu năng và chi phí:

| Chiều | Vấn đề cốt lõi | Giải pháp |
| ----- | -------------- | --------- |
| Chỉ mục đa chiều | Độ chính xác thu hồi | Kết hợp 3 loại chỉ mục: Vector + Graph + Keyword |
| Tuân thủ quyền riêng tư | Các quy định như GDPR | Khử nhạy cảm thông tin định danh cá nhân (PII) trước khi ghi |
| Tách biệt nóng lạnh | Hiệu năng và chi phí | Cache sở thích tần suất cao + RAG cho thông tin nền tần suất thấp |

Mỗi mục trong bảng trên đều đi kèm chi phí. Duy trì nhiều bộ chỉ mục đồng nghĩa với gánh nặng bảo trì lớn hơn, chính sách PII cần pháp chế rà soát, ranh giới nóng lạnh cũng rất dễ gây tranh cãi nội bộ. Trước khi đạt quy mô đa người thuê lớn, việc tối ưu một luồng vector đơn lẻ—đảm bảo tính idempotent khi ghi, truy vết trace khi tìm kiếm và re-ranking mượt mà—thường là lựa chọn kinh tế hơn.

## Làm thế nào để dùng Markdown lưu trữ bộ nhớ của Agent?

Khi luồng vector quá cồng kềnh, có một cách làm rất mộc mạc nhưng cực kỳ hiệu quả: ghi những điều Agent cần nhớ vào các file Markdown nằm ngay trong kho mã nguồn (repository). Không có embedding cũng chẳng sao, miễn là lượng thông tin trong tầm kiểm soát và khả năng đọc hiểu của con người quan trọng hơn tìm kiếm ngữ nghĩa, con đường này hoàn toàn khả thi.

### Tại sao Markdown có thể dùng làm bộ nhớ của Agent?

Markdown có thể coi là bộ nhớ dài hạn bằng văn bản rõ ràng (plaintext) do con người và máy cùng phối hợp viết. Không ép buộc phải dùng tìm kiếm vector, chỉ dựa vào tổ chức thư mục, cùng cơ chế `@` và `rules` trong Claude Code, hệ thống vẫn có thể vận hành trơn tru.

Nó loại bỏ hoàn toàn chi phí giám sát trực quan và chi phí vận hành:

- Minh bạch và có thể kiểm toán: Mở file ra bất cứ lúc nào là thấy ngay Agent đã nhớ những gì, đã ghi những gì, không hề có hộp đen.
- Lưu trữ bền vững: File nằm trên ổ đĩa, không phụ thuộc vào vòng đời tiến trình. Khi tiến trình crash hoặc khởi động lại vẫn đọc được bình thường; khi đổi máy chỉ cần Git, ổ đĩa đồng bộ hoặc bộ lưu trữ dùng chung để mang file đi.
- Quản lý phiên bản: Bộ nhớ có thể commit lên Git, việc rollback, rẽ nhánh, Code Review đều diễn ra rất tự nhiên.
- Chi phí chuyển đổi bằng 0: Định dạng chuẩn, không bị khóa chặt vào nhà cung cấp (vendor lock-in). Khi đổi model, đổi framework chỉ việc copy file là xong.
- Chi phí thấp: Cơ sở dữ liệu vector được quản lý (managed) và pipeline RAG hoàn chỉnh tốn kém chi phí lẫn độ phức tạp vận hành không nhỏ, trong khi file Markdown cục bộ hầu như không phát sinh thêm chi phí.

Manus sử dụng hệ thống file làm bộ nhớ ngoài có cấu trúc; Claude Code tích hợp `CLAUDE.md` và Auto Memory vào năng lực sản phẩm. Chúng áp dụng các cơ chế khác nhau, nhưng đều giữ lại một phần thông tin có thể thẩm tra trong các file. Đối với các nội dung có giới hạn như quy ước dự án, sở thích thao tác, hệ thống file kết hợp Markdown đã đủ đáp ứng; khi đối mặt với lượng lớn văn bản tự do, tầng truy xuất vẫn là điều bắt buộc.

### Cơ chế `CLAUDE.md` của Claude Code hoạt động như thế nào?

Hệ thống bộ nhớ của Claude Code áp dụng cơ chế đường ray kép (dual-track): file `CLAUDE.md` do con người viết thủ công, và Auto Memory được hệ thống tự động tích lũy.

#### Nên viết gì và không nên viết gì trong `CLAUDE.md`?

Khuyến nghị chính thức là khống chế mỗi file `CLAUDE.md` dưới 200 dòng. Vượt quá giới hạn này sẽ làm giảm tỷ lệ tuân thủ chỉ thị của Claude. Tách file bằng tham chiếu `@` có thể cải thiện khả năng bảo trì, nhưng không làm giảm tiêu thụ ngữ cảnh, bởi vì các file được tham chiếu sẽ được tải toàn bộ lúc khởi động. Nếu các chỉ thị quá dài, hãy ưu tiên sử dụng path-scoped rules trong thư mục `.claude/rules/`, vốn chỉ tải quy tắc tương ứng khi chỉnh sửa đường dẫn khớp mẫu.

Tác dụng của `CLAUDE.md` là truyền đạt các quy ước trong dự án mà không thể suy đoán được từ tri thức lập trình phổ thông. Khi file bị cồng kềnh, các quy tắc trọng yếu sẽ bị pha loãng, làm giảm hiệu lực của các chỉ thị.

Tech stack và phiên bản cần được nêu rõ; chẳng hạn nếu không ghi rõ phiên bản Spring Boot, Agent có thể áp dụng cách viết phổ biến hơn trong dữ liệu huấn luyện cũ. Lệnh test, lint, khởi chạy nên đặt trong code block để tránh bị viết sai khi diễn đạt lại.

Các quy tắc kiến trúc cần đi kèm lý do. Ví dụ sau câu "Sử dụng QueryWrapper" cần bổ sung "Hệ thống kiểm toán SQL dựa vào việc phân tích Wrapper để ghi nhật ký thao tác", khi đó Agent mới biết các truy vấn tương tự nên làm theo cách nào. Định dạng commit message, cách đặt tên branch và các biến môi trường phụ thuộc cũng nên được ghi lại.

Không cần lặp lại các quy chuẩn định dạng code mà linter đã bắt buộc; các hành vi mặc định của ngôn ngữ hay framework cũng không cần chiếm dụng ngữ cảnh. Với tài liệu tham khảo dài, chỉ cần giữ lại link là đủ.

Khi rà soát `CLAUDE.md`, có thể đối chiếu từng dòng: sau khi xóa dòng này đi, lỗi xảy ra gần đây có tái diễn không? Các quy tắc không gắn với lỗi thực tế thường có thể loại bỏ.

#### Viết thế nào để Claude thực sự tuân thủ?

Quy tắc phải có khả năng nghiệm thu. Câu "Chú ý tính dễ đọc của code" không thể kiểm tra được; còn "Tên hàm bắt đầu bằng động từ, một hàm không quá 40 dòng" thì có căn cứ rõ ràng để đánh giá đạt hay không.

Khi cấm field injection, quy tắc cần chỉ định rõ việc dùng constructor injection và dẫn chứng triển khai mẫu hiện có:

```markdown
# Dependency Injection

- Không sử dụng @Autowired để inject qua field
- Sử dụng constructor injection, kết hợp với @RequiredArgsConstructor của Lombok
- Ví dụ tham khảo: Cách viết trong UserController.java
```

Từ khóa nhấn mạnh có thể dùng, nhưng đừng lạm dụng. Nếu một quy tắc nào đó bị Claude liên tục vi phạm, việc thêm `IMPORTANT:` hoặc `YOU MUST:` có thể nâng cao sự chú ý đôi chút. Nhưng nếu cả file đâu đâu cũng thấy "QUAN TRỌNG", thì kết cục là chẳng có gì quan trọng cả.

Khi cùng một quy tắc liên tục bị ngó lơ, trước hết hãy kiểm tra xem nó có bị dồn xuống sau bởi quá nhiều nội dung rác hay không, hoặc có xung đột với quy tắc khác không. Việc thêm vài dấu chấm than vào câu không giải quyết được phạm vi tải và độ ưu tiên; xóa bỏ quy tắc vô hiệu, chuyển quy ước cục bộ sang file rules tương ứng thường mang lại hiệu quả cao hơn.

Tiêu đề có thể dùng các tên phổ biến như Commands, Structure, Conventions, Testing. Chúng nhất quán với cấu trúc thông thường của README, giúp mục đích của quy tắc dễ được nhận diện hơn.

#### Cấu trúc phân tầng của file `CLAUDE.md` như thế nào?

| Phân tầng | Vị trí | Phạm vi tác dụng | Kịch bản áp dụng |
| --------- | ------ | ---------------- | ---------------- |
| Cấp tổ chức | Thư mục hệ thống, ví dụ `/etc/claude-code/CLAUDE.md` | Toàn bộ người dùng | Quy chuẩn coding, chính sách bảo mật của công ty; không cài đặt nào bỏ qua được |
| Cấp người dùng | `~/.claude/CLAUDE.md` | Mọi dự án cá nhân | Sở thích code style, thói quen công cụ cá nhân |
| Cấp dự án | `./CLAUDE.md` hoặc `./.claude/CLAUDE.md` | Dùng chung cho cả team | Kiến trúc dự án, tiêu chuẩn code, workflow; commit lên Git |
| Cấp cục bộ | `./CLAUDE.local.md` | Dự án cá nhân hiện tại | URL sandbox, sở thích dữ liệu test; thêm thủ công vào `.gitignore`, chạy `/init` tự động thêm |

Việc tải file tuân theo quy tắc tìm kiếm ngược lên trên cây thư mục: bắt đầu từ thư mục làm việc hiện tại lần lượt đi lên. Trong cùng một thư mục, `CLAUDE.local.md` sẽ được nối tiếp sau `CLAUDE.md`, quy tắc càng gần thư mục làm việc thì độ ưu tiên càng cao.

`CLAUDE.md` không thích hợp để chứa các đoạn log lớn hay toàn bộ lịch sử trò chuyện, cũng tuyệt đối không được chứa secret nhạy cảm, Token hay thông tin tài khoản. Dữ liệu runtime biến động với tần suất cao, thông tin động có thể truy vấn thời gian thực cũng không nên đưa vào.

Khi dự án phình to, cần quản lý phân tầng. Dự án một người làm thì một file `CLAUDE.md` thường là đủ; dự án team thì cần chia tách ra.

```markdown
# `CLAUDE.md` (Thư mục gốc của project)

## Project

Dịch vụ quản lý đơn hàng bằng Spring Boot 3.2 + MyBatis-Plus + MySQL 8.0.

## Commands

- Build: `mvn clean package`
- Test: `mvn test`

## Rules

- Quy ước API: @docs/api-conventions.md
- Chuẩn database: @docs/database-rules.md
```

Có thể dùng `@path/to/file` để tham chiếu file bên ngoài. Nhưng lưu ý, tham chiếu `@` hỗ trợ tối đa 5 tầng đệ quy. Lần đầu tiên sử dụng tham chiếu ngoài trong project, Claude Code sẽ bật hộp thoại xin cấp quyền. Nếu lỡ từ chối, tham chiếu sẽ bị vô hiệu hóa vĩnh viễn và phải reset thủ công. Tham chiếu `@` sẽ nhúng toàn bộ nội dung file vào ngữ cảnh ngay khi khởi động, do đó không làm giảm mức tiêu thụ context.

Nếu cần kiểm soát chi tiết hơn, có thể dùng thư mục `.claude/rules/` để tổ chức các path-scoped rules. Điểm khác biệt giữa nó và tham chiếu `@` là mấu chốt: rules chỉ tải khi khớp đúng đường dẫn được chỉ định, thuộc dạng tải theo nhu cầu (on-demand); còn tham chiếu `@` tải toàn bộ lúc khởi động. Khi quy tắc chỉ nhắm vào file hoặc thư mục cụ thể, ví dụ quy chuẩn API backend, cấu hình test, hãy ưu tiên dùng rules thay vì tiếp tục nhồi nhét vào `CLAUDE.md`.

```yaml
---
paths:
  - "src/main/java/**/controller/**/*.java"
---
# Chuẩn Controller
- Thống nhất dùng Result<T> bọc giá trị trả về
- Tất cả endpoint bắt buộc phải có annotation Swagger
```

Như vậy khi chỉnh sửa Controller chỉ tải quy tắc Controller, khi chỉnh sửa Service chỉ tải quy tắc Service.

#### Mối quan hệ giữa AGENTS.md và CLAUDE.md là gì?

Claude Code tự động đọc `CLAUDE.md`, không đọc `AGENTS.md`. Các quy ước dùng chung cho nhiều Coding Agent có thể đặt trong `AGENTS.md`, sau đó import vào qua `CLAUDE.md`; các quy tắc đặc thù cho Claude Code tiếp tục giữ ở file sau, giúp các quy ước nền tảng chỉ cần duy trì ở một nơi duy nhất.

```markdown
@AGENTS.md

## Chỉ thị đặc thù cho Claude Code

- Dùng plan mode để xử lý các thay đổi trong `src/billing/`
```

#### Auto Memory là gì?

Auto Memory sẽ ghi lại các phương pháp debug, thói quen code và sở thích workflow phát hiện được trong hội thoại thành các ghi chú. Nó nằm tại `~/.claude/projects/<project>/memory/`; trong đó `MEMORY.md` là lối vào, còn chi tiết được bóc tách ra các file chủ đề con.

`MEMORY.md` chỉ tải 200 dòng đầu tiên hoặc 25KB, phần vượt quá sẽ không đi vào ngữ cảnh, chi tiết sẽ được tách sang các file Topic. Trải qua 20-30 phiên làm việc, các ghi chú có thể tích lũy những mục mâu thuẫn hoặc lỗi thời; dự án cộng đồng `dream-skill` thực hiện việc hợp nhất qua 4 giai đoạn (Orient, Gather Signal, Consolidate, Prune), tuy nhiên đây không phải tính năng chính thức.

Để tắt Auto Memory, có thể dùng `/memory`, cấu hình `autoMemoryEnabled`, hoặc đặt biến môi trường `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. Các môi trường chạy CI/CD thường không cần lưu lại ghi chú tạm, có thể tắt nó trong môi trường này.

Auto Memory yêu cầu Claude Code v2.1.59 trở lên và được bật mặc định.

### Thiết kế phân tầng bộ nhớ Markdown như thế nào?

Một hệ thống bộ nhớ Markdown hoàn chỉnh thường phân thành các tầng:

- Bộ nhớ cấp người dùng: Lưu sở thích cá nhân và thói quen dài hạn tại `~/.claude/CLAUDE.md`, ví dụ thụt lề 2 space, viết test trước khi viết code, không thích dùng emoji.
- Bộ nhớ cấp dự án: Lưu quy chuẩn dự án, tech stack, cấu trúc thư mục tại `CLAUDE.md` ở thư mục gốc repo, các thành viên trong team dùng chung, đồng bộ qua Git.
- Bộ nhớ cấp thư mục con: Lưu quy tắc riêng của từng module cục bộ tại `CLAUDE.md` trong thư mục con, ví dụ chuẩn thiết kế API dưới `backend/`, yêu cầu văn phong viết lách dưới `docs/`.
- Bộ nhớ dùng chung của team: Các quy ước chung cần commit lên kho mã nguồn, thường là `CLAUDE.md` cấp dự án và các file quy tắc được quản lý phiên bản trong thư mục `.claude/rules/`.
- Bộ nhớ riêng tư: Workflow cá nhân không nên commit lên, ví dụ `CLAUDE.local.md`, đưa vào `.gitignore` để chỉ lưu tại máy cá nhân.

### Ranh giới giữa bộ nhớ Markdown và bộ nhớ dài hạn truyền thống nằm ở đâu?

![Ranh giới áp dụng giữa bộ nhớ Markdown và bộ nhớ dài hạn truyền thống](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-memory-markdown-memory-boundary-e58817aa.svg)

Markdown và Vector DB đều có ranh giới áp dụng riêng, không nên áp dụng cứng nhắc một khuôn mẫu:

| Chiều so sánh | Bộ nhớ Markdown | Bộ nhớ Vector DB | Kho tri thức RAG | Framework dạng cơ sở dữ liệu (Mem0, v.v.) |
| ------------- | --------------- | ---------------- | ---------------- | ----------------------------------------- |
| Độ chính xác truy xuất | Tiêm toàn bộ, không có cơ chế tìm kiếm, nạp hết khi khởi động | Cao, tương đồng ngữ nghĩa | Cao, tìm kiếm ngữ nghĩa | Cao, chiến lược lai |
| Chi phí ngữ cảnh | Tương quan tuyến tính với kích thước file, file lớn sẽ chiếm dụng không gian | Truy xuất theo nhu cầu, tiết kiệm ngữ cảnh | Truy xuất theo nhu cầu, tiết kiệm ngữ cảnh | Truy xuất theo nhu cầu, tiết kiệm ngữ cảnh |
| Trải nghiệm debug | Cực tốt, đọc ghi file trực tiếp | Trung bình, cần công cụ truy vấn vector | Trung bình, cần log truy xuất | Phức tạp, cần hiểu logic framework |
| Chi phí triển khai | Cực thấp, chỉ cần đọc ghi file | Cao, cần bảo trì dịch vụ vector | Cao, cần pipeline RAG | Cao, cần runtime framework |
| Quản lý phiên bản | Tích hợp Git nguyên bản | Cần cơ chế đồng bộ ngoài | Cần cơ chế đồng bộ ngoài | Cần cơ chế đồng bộ ngoài |
| Chi phí chuyển đổi | Bằng 0, copy file là xong | Cao, bị khóa vào định dạng riêng | Cao, bị khóa vào pipeline | Cực cao, gắn chặt vào framework |
| Kịch bản áp dụng | Sở thích, quy ước, ghi chép rút kinh nghiệm | Truy xuất bộ nhớ đa dạng | Truy vấn tri thức dùng chung | Quản lý bộ nhớ phức tạp từ nhiều nguồn |

Khi số lượng file và nội dung tăng lên, việc phân cấp thư mục và đặt tên thủ công sẽ rất khó đảm bảo lần nào cũng định vị đúng đoạn thông tin liên quan. Nếu muốn thu hồi nội dung theo ngữ nghĩa từ một lượng lớn bản ghi phi cấu trúc, hãy giao việc đó cho tìm kiếm vector; việc tiếp tục nhồi nhét dữ liệu loại này vào Markdown chỉ làm cho việc nạp toàn bộ ngữ cảnh và khâu bảo trì trở nên chậm chạp.

Ngược lại, nếu nhu cầu bộ nhớ là các thông tin rõ ràng, dễ cấu trúc hóa như "nhớ quy chuẩn code của project này", "nhớ sở thích báo cáo của người dùng", thì sự tinh gọn và khả năng dễ bảo trì của Markdown thường phù hợp hơn nhiều so với các hệ thống phức tạp.

### Nên duy trì bộ nhớ Markdown như thế nào?

Lấy `CLAUDE.md` làm ví dụ, khi dự án phát triển tiến hóa, các quy tắc cũ cũng cần được kiểm tra lại định kỳ:

Chỉ khi xảy ra lỗi cụ thể và quy tắc mới thực sự ngăn chặn được lỗi tương tự tái diễn thì mới đưa nó vào file. Ban đầu hãy ghi nhận manh mối của từng lần sửa sai, sau khi xác nhận đó là vấn đề cùng loại mới đúc kết thành một quy tắc ngắn gọn; các quy tắc mà khi xóa đi hành vi vẫn không đổi thì không cần giữ lại chỉ để cho "đầy đủ".

Quy tắc đã ghi rõ ràng nhưng Claude vẫn xin lỗi vì vi phạm, điều đó cho thấy cách diễn đạt, vị trí hoặc phạm vi tải của quy tắc cần được xem xét lại. Một quy tắc liên tục mất hiệu lực qua nhiều phiên làm việc thường bắt nguồn từ việc file quá dài, làm loãng các điểm trọng tâm. Lúc này nên rút ngắn file hoặc bóc tách quy tắc cục bộ, rồi quan sát xem hành vi có thay đổi hay không.

Khi bảo trì có thể dùng phương pháp rà soát dạng đối thoại: cứ sau vài tuần, chọn vài quy tắc trong `CLAUDE.md` và hỏi Claude: "Nếu tôi xóa quy tắc này, bạn có thay đổi hành vi không?". Nếu nó trả lời là không, quy tắc đó có thể là ứng viên để xóa.

Tuy nhiên phương pháp này chỉ đóng vai trò tham khảo heuristic, không thể tin tưởng hoàn toàn vào việc tự đánh giá của Claude. Claude không thể dự đoán chính xác liệu nó có đổi hành vi khi thiếu một quy tắc nào đó hay không. Cách làm đáng tin cậy hơn là backup quy tắc trước, sau đó xóa thật và quan sát xem hành vi trên các tác vụ thực tế có thay đổi gì không.

Lệnh `/init` cũng có thể dùng, nhưng đừng dùng trực tiếp nguyên bản. File `CLAUDE.md` tự động tạo ra là một khởi đầu tốt, nhưng bên trong có thể chứa những mô tả dự án thiếu chính xác. Hãy đối chiếu từng dòng theo các nguyên tắc trên, cắt bỏ phần dư thừa và bổ sung chỗ thiếu sót.

Cuối cùng, việc cập nhật bộ nhớ dùng chung của team tốt nhất nên đi qua Git. Mỗi lần cập nhật bộ nhớ quan trọng đều nên commit, khi có sự cố có thể rollback, và Code Review cũng giúp truy vết được lý do sửa đổi. Các sửa đổi đối với nội dung dùng chung của team nên tuân thủ quy trình PR.

## Khi khắc phục sự cố bộ nhớ, hãy xem Trace truy xuất trước

Bộ nhớ ngắn hạn chịu ràng buộc bởi dung lượng context window, được kiểm soát thông qua sliding window, nén tóm tắt và offload kết quả nặng; bộ nhớ dài hạn phải giải quyết tính idempotent khi ghi, xung đột, hết hạn và xếp hạng truy xuất.

Một lượng nhỏ thông tin như quy ước dự án, chuẩn coding có thể giữ lại trong Markdown có thể kiểm toán và quản lý phiên bản. Khi cần tìm kiếm theo ngữ nghĩa từ lượng lớn bản ghi phi cấu trúc, hãy tích hợp tìm kiếm vector. Cả hai giải pháp hoàn toàn có thể cùng tồn tại song song.

Khi Agent không sử dụng được bộ nhớ sẵn có, Trace sẽ giúp phân biệt rõ vấn đề: việc viết lại query, bộ lọc, tập ứng viên hay khâu re-ranking bị lỗi ở bất kỳ bước nào cũng đều khiến các mục đã ghi mất tác dụng. Chỉ sau khi xác nhận chắc chắn kho ứng viên thiếu thông tin, ta mới điều chỉnh quy tắc trích xuất hoặc tăng ngân sách ghi.

## Tổng kết

Bộ nhớ ngắn hạn phục vụ tác vụ hiện tại, bộ nhớ dài hạn lưu giữ thông tin vẫn còn giá trị xuyên suốt qua các Session. Bộ nhớ trước bị giới hạn bởi context window, bộ nhớ sau phải xử lý thời điểm ghi, xung đột, hết hạn và tính riêng tư—không thể lưu giữ toàn bộ lịch sử chat vĩnh viễn.

Số lượng ít quy ước dự án cần bảo trì thủ công rất thích hợp với Markdown; khi cần tìm kiếm theo ngữ nghĩa từ lượng lớn bản ghi phi cấu trúc, hãy sử dụng tìm kiếm vector hoặc các framework bộ nhớ chuyên dụng. Bắt đầu khắc phục sự cố từ Trace truy xuất mới có thể phân biệt rạch ròi trước tiên là do vấn đề thu hồi (recall) hay vấn đề ghi dữ liệu.
