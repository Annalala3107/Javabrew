---
title: Tổng hợp câu hỏi phỏng vấn RAG
description: Tổng hợp có hệ thống các câu hỏi phỏng vấn RAG tần suất cao, bao quát nền tảng RAG, Embedding, Vector Database, chiến lược Chunking, xử lý tài liệu, Hybrid Search, Query Rewrite, Rerank, GraphRAG, cập nhật cơ sở tri thức và đánh giá RAG, kèm bài viết tham khảo.
category: AI
tag:
  - Phỏng vấn RAG
  - Vector Database
  - Phỏng vấn AI
head:
  - - meta
    - name: keywords
      content: cau hoi phong van RAG, phong van RAG, Retrieval-Augmented Generation, Embedding, Vector Database, GraphRAG, toi uu RAG, Chunk, Hybrid Search, Rerank
lang: vi
sourceRef: zh-ref/ai/interview-questions/rag-interview-questions.md
---

Một chuỗi xử lý RAG hoàn chỉnh phải thực hiện bóc tách tài liệu (parsing), phân đoạn (chunking), tạo embedding, đánh chỉ mục (indexing), truy xuất (recall), sắp xếp lại (rerank), lắp ghép ngữ cảnh và sinh câu trả lời. Sau một thời gian vận hành trong thực tế, hệ thống sẽ gặp phải hàng loạt bài toán về phiên bản tài liệu, biến động quyền truy cập, xây dựng lại chỉ mục và suy giảm chất lượng đánh giá. Các câu hỏi dưới đây được phân nhóm theo các chương trong chuyên đề RAG của JavaGuide, mỗi nhóm đều có bài viết chi tiết đi kèm.

## Nền tảng RAG

Bài viết liên quan: [Khái niệm nền tảng RAG: Truy xuất, sinh dữ liệu và các đánh đổi kỹ thuật](../rag/rag-basis.md)

Các câu hỏi nền tảng tập trung vào luồng xử lý và kịch bản áp dụng của RAG, đồng thời thường xuyên được so sánh với tìm kiếm truyền thống, tinh chỉnh mô hình (fine-tuning) và xử lý ngữ cảnh siêu dài (long context). Các vấn đề về ảo giác, trích dẫn nguồn và cơ chế từ chối trả lời thường là những câu hỏi đào sâu tiếp theo.

Câu hỏi phỏng vấn thường gặp:

- RAG là gì? Tại sao lại cần RAG?
- RAG khác biệt như thế nào so với các công cụ tìm kiếm truyền thống?
- Lựa chọn giữa RAG và Fine-tuning như thế nào? Khi nào dùng RAG, khi nào dùng Fine-tuning và khi nào nên kết hợp cả hai?
- Trong hệ thống RAG, lựa chọn mô hình Embedding như thế nào? Tại sao?
- Độ tương đồng Cosine (Cosine Similarity), tích vô hướng (Inner Product / Dot Product) và khoảng cách Euclid (Euclidean Distance) khác nhau ra sao?
- Giải quyết vấn đề ảo giác (hallucination) trong RAG như thế nào? RAG có chắc chắn triệt tiêu 100% ảo giác không?
- Vấn đề "Lost in the Middle" là gì? Đối phó với nó bằng cách nào?
- Liệu Context Window siêu dài có thay thế hoàn toàn RAG trong tương lai không?
- Các chỉ số đo lường đánh giá một hệ thống RAG gồm những gì?
- Ưu điểm và hạn chế cốt lõi của RAG là gì?
- Kịch bản nào phù hợp để áp dụng RAG? Kịch bản nào không phù hợp?

## Vector Database và Đánh chỉ mục (Indexing)

Bài viết liên quan: [Thuật toán chỉ mục vector và Vector Database trong RAG](../rag/rag-vector-store.md)

Các câu hỏi về truy xuất vector sẽ bắt đầu từ Embedding và thước đo khoảng cách, tiến dần đến các thuật toán chỉ mục ANN (Approximate Nearest Neighbor), sau đó đi sâu vào quy mô dữ liệu, độ trễ truy vấn, điều kiện lọc metadata và chi phí vận hành bảo trì. Nếu chỉ ghi nhớ tên sản phẩm thì rất khó trả lời các câu hỏi đào sâu về bài toán lựa chọn công nghệ.

Câu hỏi phỏng vấn thường gặp:

- Embedding là gì? Tại sao phải chuyển đổi văn bản thành vector đặc?
- Tại sao trong kịch bản RAG lại cần đến Vector Database?
- Tại sao thuật toán ANN lại chấp nhận kết quả trả về không chính xác tuyệt đối 100%?
- Có những thuật toán chỉ mục vector phổ biến nào? Ưu nhược điểm của từng loại là gì?
- Flat, HNSW, IVFFLAT và IVF-PQ lần lượt phù hợp với những kịch bản nào?
- HNSW và IVFFLAT khác nhau căn bản ở điểm nào?
- Tham số `ef_search` trong HNSW được tinh chỉnh như thế nào? Tăng lên hoặc giảm xuống sẽ gây ra hệ quả gì?
- Điểm khác biệt cốt lõi nhất giữa Vector Database và Database quan hệ truyền thống là gì?
- Nếu lượng dữ liệu vector tăng từ 1 triệu lên 100 triệu, về mặt kiến trúc hệ thống cần thực hiện những điều chỉnh gì?
- Tại sao lại chọn PostgreSQL + pgvector? Khi nào nên chuyển đổi sang Vector Database chuyên dụng?

## Xử lý tài liệu và Chiến lược Chunking

Bài viết liên quan: [Chiến lược xử lý và phân đoạn tài liệu RAG: Từ bóc tách, làm sạch, Chunking đến xử lý nội dung đa phương thức](../rag/rag-document-processing.md)

Tài liệu trước khi đưa vào chỉ mục phải trải qua các khâu bóc tách, làm sạch, cấu trúc hóa, phân đoạn và bổ sung metadata. Kích thước Chunk (Chunk size) chỉ là một tham số; phân cấp tiêu đề, bảng biểu, khối mã, số trang, phiên bản và quyền truy cập cũng ảnh hưởng trực tiếp đến chất lượng truy xuất phía sau.

Câu hỏi phỏng vấn thường gặp:

- Đường ống (pipeline) xử lý tài liệu trong RAG thông thường bao gồm những bước nào?
- Các khâu bóc tách tài liệu (parsing), làm sạch (cleaning) và cấu trúc hóa lần lượt giải quyết những bài toán gì?
- Tại sao khi phân đoạn Chunk lại không thể chỉ cắt theo độ dài ký tự cố định?
- Cần cân nhắc đánh đổi ra sao giữa kích thước Chunk, độ gối đầu (Overlap) và ranh giới ngữ nghĩa (semantic boundaries)?
- Bảng biểu, code block, hình ảnh và nội dung đa phương thức (multimodal) được xử lý ra sao trước khi đưa vào RAG?
- Trong giai đoạn xử lý tài liệu, làm thế nào để bảo toàn phân cấp tiêu đề, số trang, nguồn gốc và metadata quyền hạn?
- Chất lượng Chunk kém sẽ dẫn đến những hệ quả tiêu cực nào trong khâu truy xuất và sinh câu trả lời?
- Quy trình xây dựng một pipeline xử lý tài liệu cấp doanh nghiệp từ con số không gồm những bước nào?

## Tối ưu hóa truy xuất RAG (Retrieval Optimization)

Bài viết liên quan: [Tối ưu hóa RAG: Từ Recall, Rerank đến Context Engineering](../rag/rag-optimization.md)

Khi trả lời các câu hỏi tối ưu hóa truy xuất, trước tiên phải phân định rõ vấn đề phát sinh từ khâu recall (thu hồi), ranking (xếp hạng), lắp ghép context hay từ khâu sinh câu trả lời. Hybrid Search, Query Rewrite, Rerank và nén ngữ cảnh (context compression) xử lý các vị trí lỗi khác nhau trong pipeline, không thể dùng cùng một phương pháp cho mọi mẫu lỗi.

Câu hỏi phỏng vấn thường gặp:

- Khi tỷ lệ thu hồi (recall rate) của RAG thấp, quy trình phân tích và gỡ lỗi như thế nào?
- Chiến lược Chunk, Metadata, Hybrid Search, Query Rewrite và Rerank lần lượt giải quyết những bài toán gì?
- Hybrid Search là gì? Làm thế nào để dung hợp giữa tìm kiếm từ khóa BM25 và truy xuất vector đặc?
- Query Rewrite, HyDE và Self-Query lần lượt phù hợp với những kịch bản nào?
- Rerank giải quyết bài toán gì? Tại sao không thể chỉ dựa vào điểm tương đồng vector để sắp xếp thứ tự?
- Nén ngữ cảnh (Context Compression) mang lại giá trị gì? Trong trường hợp nào nó sẽ làm suy giảm chất lượng câu trả lời?
- Tại sao việc tối ưu hóa RAG bắt buộc phải bắt đầu bằng việc xây dựng tập mẫu thất bại (bad cases)?
- Khi hệ thống RAG trên production trả lời lạc đề ("hỏi một đằng trả lời một nẻo"), cần tiến hành định vị lỗi theo lộ trình nào?

## GraphRAG

Bài viết liên quan: [GraphRAG: Bổ sung cấu trúc đồ thị cho truy xuất vector](../rag/graphrag.md)

Các câu hỏi về GraphRAG tập trung vào mối quan hệ thực thể, suy luận đa chặng (multi-hop reasoning) và các câu hỏi mang tính tổng thể toàn cục (global queries), đồng thời đào sâu vào cách trích xuất quan hệ thực thể, sinh tóm tắt cộng đồng (community summary), lọc phân quyền và chi phí cập nhật dữ liệu. Khi lựa chọn công nghệ cần đối chiếu với yêu cầu nghiệp vụ và chuỗi truy xuất hiện có.

Câu hỏi phỏng vấn thường gặp:

- GraphRAG giải quyết bài toán gì? Điểm khác biệt so với RAG vector tiêu chuẩn là gì?
- Tại sao nói các Chunk văn bản là những "hòn đảo thông tin cô lập"?
- Tại sao độ tương đồng vector lại không hiệu quả trong việc suy luận đa chặng (multi-hop)?
- Trong GraphRAG, khái niệm thực thể (entity), mối quan hệ (relationship) và phát hiện cộng đồng (community detection) là gì?
- Tìm kiếm toàn cục (Global Search) và tìm kiếm cục bộ (Local Search) khác nhau như thế nào?
- Bản tóm tắt cộng đồng trong GraphRAG mang lại giá trị gì? Chi phí tính toán tốn kém nhất nằm ở đâu?
- GraphRAG thực hiện cơ chế lọc phân quyền (permission filtering) như thế nào?
- Kịch bản nào phù hợp với GraphRAG? Kịch bản nào không phù hợp?
- Tại sao các hệ thống trưởng thành lại kết hợp tìm kiếm từ khóa, truy xuất vector, truy xuất đa vector và truy xuất đồ thị?

## Cập nhật cơ sở tri thức và Đánh giá

Bài viết liên quan: [Cập nhật tài liệu cơ sở tri thức RAG: Cập nhật tăng dần, kiểm soát phiên bản, khử trùng lặp và xây dựng lại toàn bộ](../rag/rag-knowledge-update.md), [Đánh giá RAG: Từ tập dữ liệu offline đến khả năng quan sát online](../rag/rag-evaluation.md), và [Hệ thống đánh giá ứng dụng AI: Từ xây dựng Golden Set đến vòng lặp đóng Canary trên production](../llm-basis/llm-evaluation.md)

Sau khi cơ sở tri thức vận hành thực tế, tài liệu, quyền hạn, mô hình Embedding và chiến lược Chunking đều sẽ thay đổi. Các câu hỏi về cập nhật chú trọng vào việc duy trì tính nhất quán giữa dữ liệu và chỉ mục, trong khi câu hỏi đánh giá đòi hỏi phải tách bạch giữa chất lượng truy xuất và chất lượng sinh.

Câu hỏi phỏng vấn thường gặp:

- Tại sao cơ sở tri thức RAG không thể chỉ thêm mới mà không hỗ trợ thao tác xóa?
- Lựa chọn giữa cập nhật tăng dần (incremental update) và xây dựng lại toàn bộ (full rebuild) ra sao?
- Sau khi nâng cấp mô hình Embedding, tại sao thông thường bắt buộc phải xây dựng lại toàn bộ chỉ mục?
- Khi thay đổi chiến lược Chunking sẽ ảnh hưởng đến những dữ liệu lịch sử nào?
- Làm thế nào để ngăn chặn việc nhiều phiên bản cũ và mới của cùng một tài liệu bị truy xuất đồng thời?
- Cập nhật cơ sở tri thức thực hiện cơ chế Canary, Rollback và ghi log kiểm toán ra sao?
- Tại sao đánh giá RAG bắt buộc phải tách riêng chất lượng truy xuất và chất lượng sinh câu trả lời?
- MRR, NDCG, Recall@K, Context Precision và Faithfulness lần lượt đo lường điều gì?

## Câu hỏi tình huống gỡ lỗi tổng hợp

- Tài liệu gốc đã được đưa vào kho dữ liệu, nhưng các câu hỏi liên quan liên tục không truy xuất được Chunk chính xác, bạn sẽ bắt đầu kiểm tra từ những khâu nào?
- Tài liệu chính xác đã lọt vào danh sách ứng viên (candidate pool), nhưng luôn bị xếp ngoài Top-K, nên điều chỉnh khâu recall hay đưa thêm mô hình Rerank vào?
- Kết quả truy xuất hoàn toàn chính xác nhưng mô hình vẫn trích dẫn sai đoạn văn hoặc bị ảo giác, làm thế nào để kiểm tra thứ tự ngữ cảnh, độ dài cắt gọt (truncation) và ràng buộc trong Prompt?
- Cả phiên bản mới và cũ của cùng một tài liệu bị truy xuất đồng thời, luồng cập nhật dữ liệu và chỉ mục có thể đã phát sinh lỗi gì?
- Khi chỉ có điểm số đánh giá câu trả lời cuối cùng là kém, làm thế nào để xác định nguyên nhân nằm ở khâu truy xuất hay khâu sinh câu trả lời?
- Một nhóm câu hỏi đòi hỏi phải tra cứu mối quan hệ liên kết qua nhiều tài liệu khác nhau, làm sao để đánh giá nên tối ưu hóa RAG vector hay đưa thêm GraphRAG vào hệ thống?
