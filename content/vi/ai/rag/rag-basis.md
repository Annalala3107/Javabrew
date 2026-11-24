---
title: "Khái niệm cơ bản về RAG: Truy xuất, sinh phản hồi và đánh đổi kỹ thuật"
description: "Giới thiệu nguyên lý hoạt động của RAG (Retrieval-Augmented Generation), Embedding, độ đo tương đồng, cùng kịch bản ứng dụng và giới hạn của RAG so với tìm kiếm truyền thống, Fine-tuning và Long Context."
category: Phát triển ứng dụng AI
head:
  - - meta
    - name: keywords
      content: RAG,Retrieval-Augmented Generation,LLM,knowledge base,Embedding,tìm kiếm ngữ nghĩa,tìm kiếm vector,fine-tuning,Fine-tuning,long context,cơ sở tri thức doanh nghiệp
lang: vi
sourceRef: zh-ref/ai/rag/rag-basis.md
---

Khi xây dựng hệ thống hỏi đáp cơ sở tri thức (knowledge base) cho doanh nghiệp, ban đầu nhiều đội ngũ kỹ thuật thường thử nhồi trực tiếp toàn bộ tài liệu vào context của mô hình ngôn ngữ lớn (LLM). Khi chỉ có vài tài liệu thì cách này hoàn toàn chạy tốt. Tuy nhiên, khi cơ sở tri thức tăng lên hàng trăm nghìn hoặc hàng triệu từ, một yêu cầu duy nhất sẽ nhanh chóng chạm ngưỡng giới hạn Token hoặc đẩy độ trễ phản hồi ký tự đầu tiên (TTFT - Time-To-First-Token) lên rất cao. Trong môi trường doanh nghiệp, hệ thống còn phải xử lý bài toán cập nhật tài liệu, phân quyền dữ liệu, truy vết trích dẫn nguồn và tối ưu chi phí API, do đó không thể dựa vào việc ghép nối thô toàn bộ tài liệu vào context cho các truy vấn thường nhật.

RAG sẽ truy xuất các đoạn thông tin liên quan từ cơ sở tri thức trước khi mô hình tạo câu trả lời, sau đó mới đưa các đoạn này vào context để giao cho mô hình xử lý. Nhờ vậy, câu trả lời được xây dựng dựa trên những bằng chứng có thể kiểm chứng được. Bất kỳ sai sót nào trong các khâu truy xuất, tổ chức context hay sinh phản hồi đều có thể khiến câu trả lời cuối cùng lệch khỏi văn bản gốc.

## RAG là gì?

**RAG (Retrieval-Augmented Generation - Tạo sinh tăng cường truy xuất)** là sự kết hợp giữa kỹ thuật truy xuất thông tin (Information Retrieval) và năng lực tạo sinh của mô hình ngôn ngữ lớn (LLM). Hệ thống trước tiên sẽ truy xuất các đoạn thông tin liên quan đến câu hỏi hiện tại từ cơ sở dữ liệu, tập tài liệu hoặc hệ thống nội bộ doanh nghiệp. Sau đó, hệ thống đóng gói các đoạn trích này cùng với câu hỏi ban đầu vào Prompt gửi đến LLM, giúp mô hình dựa vào các tài liệu tìm được để sinh ra câu trả lời, thay vì chỉ dựa vào lượng tri thức ghi nhớ trong các tham số tiền huấn luyện (pre-trained parameters).

![Sơ đồ minh họa RAG](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-index-and-retrieval-explainer-f0a3c091.webp)

## Tại sao cần RAG?

![RAG giải quyết các thách thức cốt lõi của LLM như thế nào](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-llm-challenges-7b760a3f.png)

Nếu gọi trực tiếp mô hình lớn đã tiền huấn luyện để làm hệ thống hỏi đáp doanh nghiệp, bạn thường sẽ vướng phải ba trở ngại lớn:

1. **Tính kịp thời của tri thức bị hạn chế**: Tri thức của mô hình tiền huấn luyện dừng lại tại thời điểm chốt dữ liệu đào tạo (training data cutoff). Các chính sách mới ban hành, tài liệu sản phẩm cập nhật hay dữ liệu nghiệp vụ thời gian thực sau thời điểm đó mô hình hoàn toàn không nắm được, buộc phải đưa vào động thông qua truy xuất bên ngoài hoặc gọi công cụ (tool calling).
2. **Dữ liệu riêng tư không thể sử dụng trực tiếp**: Tài liệu sản phẩm nội bộ, quy chế tổ chức và dữ liệu khách hàng không được phép đưa vào tập dữ liệu huấn luyện của mô hình công khai. RAG giải quyết vấn đề này bằng cách trích xuất động các đoạn thông tin liên quan dựa trên quyền hạn của người dùng tại thời điểm đặt câu hỏi rồi đưa vào context, giúp tận dụng tri thức nội bộ mà không cần huấn luyện lại mô hình.
3. **Ảo giác sự thật (Hallucination) khó kiểm chứng**: Khi thiếu căn cứ, LLM vẫn có thể tạo ra các kết luận sai nhưng đọc rất mượt mà. RAG cung cấp tài liệu tham khảo gốc, buộc mô hình trả lời dựa trên bằng chứng và đính kèm trích dẫn nguồn, từ đó giảm thiểu đáng kể nguy cơ bịa đặt không căn cứ. Tuy nhiên, RAG không thể loại bỏ hoàn toàn ảo giác. Việc truy xuất sót (missed recall), nhiễu ngữ cảnh, gán sai trích dẫn hoặc mô hình không tuân thủ chỉ thị prompt vẫn có thể dẫn đến câu trả lời sai. Do đó, môi trường production thường phải kết hợp thêm cơ chế xác thực trích dẫn, từ chối trả lời (refusal mechanism) và vòng lặp đánh giá phản hồi.

## Các ứng dụng phổ biến của RAG là gì?

RAG rất phù hợp cho các kịch bản mà câu trả lời phụ thuộc vào tài liệu bên ngoài, tài liệu có dung lượng lớn hoặc cập nhật thường xuyên. Các hướng triển khai phổ biến bao gồm:

- Chăm sóc khách hàng và hỗ trợ sau bán hàng: Hướng dẫn xử lý sự cố và quy trình dựa trên sổ tay sản phẩm, ví dụ tra cứu quy định đổi trả hàng, xử lý mã lỗi thiết bị.
- Trợ lý R&D và vận hành hệ thống (DevOps): Truy xuất kho mã nguồn, tài liệu API, sổ tay cảnh báo (runbook) và lịch sử ticket sự cố để hỗ trợ định vị lỗi và soạn thảo phương án khắc phục.
- Hỗ trợ y tế và lâm sàng: Truy xuất phác đồ điều trị, hướng dẫn sử dụng thuốc và quy chuẩn bệnh viện để giải thích chỉ số xét nghiệm hoặc chống chỉ định dùng thuốc cho bác sĩ tham khảo đối chiếu.
- Tra cứu pháp lý và tuân thủ: Truy xuất văn bản quy phạm pháp luật, án lệ và hợp đồng mẫu để hỗ trợ so sánh điều khoản và cảnh báo rủi ro pháp lý.
- Trợ lý tri thức nội bộ doanh nghiệp: Kết nối quy chế nhân sự, tài chính, quy trình tác nghiệp chuẩn (SOP), biên bản cuộc họp và giải pháp kỹ thuật nhằm hỗ trợ hỏi đáp, tóm tắt và so sánh liên tài liệu.

## Tại sao một số doanh nghiệp vẫn thích dùng tìm kiếm truyền thống hơn RAG?

Nhiều doanh nghiệp vẫn giữ ô tìm kiếm truyền thống vì phần lớn nhu cầu thường nhật chỉ đơn giản là định vị tài liệu, không cần mô hình đọc hộ rồi đúc kết kết luận.

Nếu người dùng chỉ muốn tải một văn bản quy chế gốc, đối chiếu định nghĩa của một API hay tìm hợp đồng mẫu, việc nhập từ khóa rồi nhận danh sách tài liệu trả về thực tế trực quan hơn nhiều: đường đi ngắn, chi phí thấp và kết quả dễ kiểm soát. Trong khi đó, sau khi truy xuất, RAG còn phải tổ chức ngữ cảnh và gọi LLM sinh câu trả lời. Bất cứ khi nào đi qua khâu sinh của mô hình, độ trễ ký tự đầu tiên, chi phí Token và rủi ro tóm tắt sai lệch đều tăng lên.

Việc chọn tìm kiếm truyền thống hay RAG phụ thuộc vào mục tiêu của người dùng là tìm tài liệu thô hay tổng hợp nhiều tài liệu để rút ra kết luận.

| Khía cạnh | Tìm kiếm truyền thống (Search Box) | RAG (Truy xuất + Tạo sinh) |
| --- | --- | --- |
| Mục tiêu người dùng | Tìm tài liệu, trang web, tệp đính kèm | Nhận trực tiếp câu trả lời rõ ràng, bản tóm tắt hoặc kết luận so sánh |
| Độ trễ & Chi phí | Thường rất thấp, dễ mở rộng quy mô | Cao hơn, cần cả truy xuất và suy luận LLM |
| Khả năng kiểm soát / Kiểm toán | Cao, cung cấp trực tiếp liên kết văn bản gốc | Thấp hơn một chút, có thể hiểu nhầm hoặc tóm tắt lệch, cần trích dẫn và đánh giá |
| Rủi ro | Thấp, chủ yếu là vấn đề xếp hạng truy xuất | Cao hơn, bao gồm ảo giác, lỗi trích dẫn, rò rỉ dữ liệu vượt quyền |
| Quản trị dữ liệu | Tương đối hoàn thiện, dễ dàng làm ACL và lọc trường | Phức tạp hơn, cần lọc truy xuất, khử nhạy cảm context, quản trị log |
| Kịch bản áp dụng | Tra cứu theo mã hiệu, tiêu đề, từ khóa; tìm biểu mẫu, văn bản quy chế | Hỗ trợ CSKH, khắc phục sự cố kỹ thuật, giải thích quy chế, đối chiếu liên tài liệu |
| Thực tiễn tốt nhất (Best Practice) | ES / BM25 + Lọc phân quyền | Hybrid Search + Rerank + Truy vết nguồn + Lọc quyền + Đánh giá khép kín |

Khi triển khai thực tế, nhiều doanh nghiệp duy trì đồng thời cả hai cổng: tra cứu đơn giản đi qua tìm kiếm, hỏi đáp phức tạp đi qua RAG, vừa đảm bảo tốc độ phản hồi vừa mang lại trải nghiệm hỏi đáp tốt.

## Bạn có hiểu nguyên lý hoạt động của RAG không?

Chuỗi kỹ thuật của RAG được chia làm hai giai đoạn: lập chỉ mục ngoại tuyến (offline indexing) và truy xuất tạo sinh trực tuyến (online retrieval & generation). Giai đoạn ngoại tuyến chuyển hóa tài liệu thô thành cấu trúc dữ liệu có thể tìm kiếm; giai đoạn trực tuyến tiếp nhận câu hỏi của người dùng, phân tích truy vấn, truy xuất thông tin, dựng ngữ cảnh và sinh câu trả lời.

![Sơ đồ quy trình rút gọn của giai đoạn lập chỉ mục và truy xuất](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-rag-engineering-link-e1988667.png)

Giai đoạn lập chỉ mục ngoại tuyến gồm các bước chính sau:

1. Thu nạp và phân tích tài liệu: Trích xuất nội dung văn bản, bảng biểu và cấu trúc phân cấp từ PDF, Word, trang web, Markdown hoặc bản ghi database.
2. Làm sạch và khử nhiễu: Loại bỏ ký tự rác (mojibake), đầu trang/chân trang lặp lại, các thẻ HTML vô nghĩa, v.v.
3. Trích xuất metadata: Bổ sung các trường như nguồn tài liệu, thời gian cập nhật, đường dẫn chương mục, tenant ID và danh sách kiểm soát truy cập (ACL) để phục vụ lọc dữ liệu và truy vết nguồn sau này.
4. Phân đoạn tài liệu (Chunking): Chia tài liệu dài thành các đoạn nhỏ hơn. Độ mịn khi cắt phải cân bằng giữa tính toàn vẹn ngữ nghĩa, giới hạn Token đầu vào của mô hình Embedding và độ chính xác truy xuất. Chunk quá lớn dễ lẫn tạp âm, Chunk quá nhỏ lại làm đứt đoạn điều kiện tiên quyết. Chiến lược cụ thể xem tại [Chiến lược xử lý và phân đoạn tài liệu trong RAG](./rag-document-processing.md).
5. Vector hóa (Embedding Generation): Gọi mô hình Embedding để ánh xạ từng đoạn văn bản thành một vector dày đặc đa chiều (dense vector). Các lựa chọn phổ biến gồm `text-embedding-3-small` / `text-embedding-3-large` của OpenAI, hoặc các mô hình mã nguồn mở như BGE, Qwen3-Embedding.
6. Ghi vào kho chỉ mục: Ghi vector, đoạn văn bản gốc và metadata vào các hệ thống lưu trữ như Milvus, pgvector, Elasticsearch / OpenSearch. Thuật toán chỉ mục và thực tiễn chọn giải pháp xem tại [Thuật toán chỉ mục vector và Vector Database trong RAG](./rag-vector-store.md).

Lập chỉ mục ngoại tuyến có thể chạy theo lô định kỳ (batch job) hoặc cập nhật gia tăng dựa trên sự kiện (event-driven). Với kịch bản người dùng tải tệp tạm thời trong lúc trò chuyện, hệ thống cũng có thể phân tích cú pháp theo thời gian thực và ghi vào chỉ mục tạm thời.

Giai đoạn truy xuất và tạo sinh trực tuyến thường thực hiện theo trình tự sau:

1. Tiếp nhận truy vấn và viết lại: Tiếp nhận câu hỏi ngôn ngữ tự nhiên của người dùng, khi cần thiết sẽ thực hiện viết lại truy vấn (Query Rewrite), phân tách truy vấn hoặc trích xuất điều kiện lọc metadata.
2. Vector hóa truy vấn: Dùng chính mô hình Embedding ở giai đoạn ngoại tuyến để chuyển đổi câu truy vấn thành vector.
3. Truy xuất và xếp hạng lại (Retrieval & Rerank): Kết hợp lọc metadata, tìm kiếm tương đồng vector hoặc tìm kiếm kết hợp từ khóa (hybrid search) để thu hồi các đoạn ứng viên, sau đó dùng mô hình Rerank chấm điểm tinh chỉnh theo độ liên quan với câu hỏi.
4. Ghép nối ngữ cảnh (Augmentation): Ráp các đoạn trích sau khi rerank, câu hỏi ban đầu và chỉ thị hệ thống (ví dụ: chỉ trả lời dựa trên tài liệu cung cấp, đánh dấu nguồn trích dẫn) thành một Prompt hoàn chỉnh.
5. Sinh câu trả lời (Generation): LLM dựa trên ngữ cảnh được cung cấp để xuất câu trả lời kèm theo liên kết tài liệu tham khảo.

Khi hiệu quả truy xuất không ổn định, nguyên nhân thường nằm ở độ mịn của Chunk, khâu viết lại truy vấn, cơ chế thu hồi kết hợp hoặc khâu Rerank. Phương pháp chẩn đoán chi tiết xem tại bài [Tối ưu hóa RAG](./rag-optimization.md).

## Embedding là gì?

Embedding là quá trình ánh xạ văn bản vào không gian vector dày đặc đa chiều (dense vector space), với mục tiêu là các văn bản có ngữ nghĩa tương đồng sẽ nằm gần nhau hơn trong không gian vector.

Ví dụ ba câu sau:

- "Làm thế nào để yêu cầu hoàn tiền?"
- "Quy trình hoàn tiền như thế nào?"
- "Làm sao để hủy đơn hàng và lấy lại tiền?"

Chúng sử dụng từ ngữ khác nhau nhưng biểu đạt cùng một ý định (intent). Sau khi được mô hình Embedding mã hóa, vector của ba câu này sẽ nằm trong cùng một vùng không gian gần nhau. Ngay cả khi tài liệu ghi là "Hướng dẫn thủ tục trả hàng và hoàn tiền", tìm kiếm vector vẫn có thể vượt qua sự khác biệt từ ngữ bề mặt để truy xuất chính xác.

![Embedding: Ánh xạ văn bản vào không gian ngữ nghĩa](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-2-embedding-map-text-to-semantic-space-8815378b.png)

Các số chiều Embedding phổ biến là 768, 1024, 1536, 3072, v.v. Số chiều vector do cấu trúc mô hình quyết định, không thể tách rời mô hình cụ thể mà kết luận rằng "chiều càng cao thì càng tốt". Số chiều cao hơn sẽ trực tiếp làm tăng mức chiếm dụng bộ nhớ, thời gian dựng chỉ mục và chi phí tính toán khoảng cách. Lấy OpenAI làm ví dụ, `text-embedding-3-small` mặc định xuất ra 1536 chiều, `text-embedding-3-large` mặc định xuất ra 3072 chiều; cả hai đều hỗ trợ kỹ thuật Matryoshka Representation Learning (qua tham số `dimensions`) để cắt bớt xuống số chiều thấp hơn khi sử dụng.

Các mô hình Embedding phổ biến chia làm hai nhóm: API thương mại nguồn đóng và mô hình mã nguồn mở có thể tự host:

| Loại | Mô hình tiêu biểu | Kịch bản phù hợp |
| --- | --- | --- |
| API nguồn đóng | OpenAI `text-embedding-3-small` / `text-embedding-3-large`, Cohere Embed, Jina Embeddings API | Cần dùng được ngay, hỗ trợ đa ngôn ngữ tốt, ít tốn công vận hành bảo trì |
| Mô hình mã nguồn mở | BGE series, Qwen3-Embedding, GTE series, E5 series, Jina Embeddings open-source | Dữ liệu không được ra ngoài mạng nội bộ, yêu cầu triển khai on-premise, muốn tối ưu chi phí |

Khi chọn mô hình, bảng xếp hạng công khai MTEB (Massive Text Embedding Benchmark) có thể dùng làm tài liệu tham khảo sơ bộ, nhưng cuối cùng bạn vẫn phải kiểm chứng Recall, độ trễ và chi phí triển khai trên tập câu hỏi thực tế của nghiệp vụ. Nếu ngữ liệu của bạn chứa nhiều từ viết tắt nội bộ, mã hiệu chuyên ngành hoặc mã lỗi riêng, việc chỉ dựa vào Embedding thông thường thường là không đủ mà cần kết hợp thêm tìm kiếm từ khóa BM25.

## Độ tương đồng vector được tính toán như thế nào?

Sau khi văn bản được chuyển thành vector, hệ thống truy xuất sẽ dùng hàm khoảng cách hoặc hàm tương đồng để đo độ gần giữa vector truy vấn và vector tài liệu. Có ba độ đo phổ biến:

| Độ đo | Ý nghĩa | Đặc điểm |
| --- | --- | --- |
| Độ tương đồng Cosine (Cosine Similarity) | Đo tính nhất quán về hướng góc giữa hai vector | Không nhạy cảm với độ dài (norm) của vector, được dùng phổ biến nhất cho tìm kiếm ngữ nghĩa văn bản |
| Tích vô hướng (Inner Product / Dot Product) | Tính tổng tích của các chiều tương ứng giữa hai vector | Khi vector đã được chuẩn hóa L2, tích vô hướng tương đương với độ tương đồng Cosine cả về giá trị lẫn thứ tự xếp hạng, tính toán nhanh hơn |
| Khoảng cách Euclid (Khoảng cách L2) | Tính khoảng cách đường thẳng giữa hai điểm trong không gian | Bị ảnh hưởng bởi độ dài vector; nếu vector đã chuẩn hóa L2, thứ tự sắp xếp cũng tương đương với khoảng cách Cosine |

Trong phỏng vấn, nếu được hỏi tại sao tìm kiếm văn bản thường dùng độ tương đồng Cosine, bạn có thể trả lời theo hai khía cạnh: Thứ nhất, độ dài văn bản hoặc biến động tần suất từ có thể ảnh hưởng đến độ dài của vector chưa chuẩn hóa, trong khi độ tương đồng Cosine chỉ quan tâm đến hướng vector, phản ánh ổn định hơn việc hướng ngữ nghĩa có gần nhau hay không; thứ hai, phần lớn các mô hình Embedding chủ lưu đều lấy độ tương đồng Cosine hoặc tích vô hướng chuẩn hóa làm mục tiêu huấn luyện. Khi triển khai thực tế, loại khoảng cách cấu hình trong chỉ mục vector database bắt buộc phải đồng nhất với độ đo khuyến nghị của mô hình Embedding, nếu không sẽ dẫn đến chất lượng truy xuất sụt giảm hoặc không thể khớp chỉ mục.

## Sự khác biệt giữa RAG và công cụ tìm kiếm truyền thống là gì?

![Sự khác biệt giữa RAG và công cụ tìm kiếm truyền thống](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-rag-vs-search-engine-3894f696.png)

Cả công cụ tìm kiếm truyền thống và RAG đều có khâu truy xuất, nhưng kết quả đầu ra sau truy xuất là khác nhau: Tìm kiếm truyền thống sắp xếp các tài liệu ứng viên theo độ liên quan rồi trả về danh sách liên kết để người dùng tự bấm vào đọc và đối chiếu; trong khi đó, RAG đưa nhiều đoạn tài liệu thu hồi được vào context của LLM, thực hiện trích xuất và tổng hợp thông tin liên đoạn, rồi trực tiếp sinh ra câu trả lời có kèm trích dẫn nguồn.

Những khác biệt kỹ thuật chính giữa hai giải pháp gồm:

1. Cơ chế truy xuất: Tìm kiếm truyền thống lấy chỉ mục đảo (inverted index) và khớp từ khóa (như BM25) làm cốt lõi, tìm kiếm hiện đại cũng tích hợp thêm vector và mô hình xếp hạng; tầng truy xuất của RAG được thiết kế xoay quanh mục tiêu "cung cấp bằng chứng có tỷ lệ tín hiệu trên nhiễu (SNR) cao cho LLM", thường kết hợp tìm kiếm vector, BM25, lọc metadata, mở rộng khối cha-con (Parent-Child) hoặc truy xuất đồ thị.
2. Hình thức kết quả: Tìm kiếm truyền thống trả về danh sách mức tài liệu hoặc đoạn văn; RAG xuất ra câu trả lời bằng ngôn ngữ tự nhiên hoặc kết luận có cấu trúc, kèm trích dẫn văn bản để kiểm chứng.
3. Độ trễ và chi phí: Tìm kiếm truyền thống phản hồi trong vòng vài chục mili-giây, chi phí biên cực thấp; RAG thêm khâu suy luận của LLM nên độ trễ ký tự đầu tiên thường tính bằng giây, và mỗi yêu cầu đều tiêu tốn Token đầu vào và đầu ra.

## Lựa chọn giữa RAG và Fine-tuning như thế nào?

"Tại sao không trực tiếp fine-tune mô hình?" là câu hỏi phỏng vấn tần suất rất cao về RAG. Ranh giới trách nhiệm của hai phương pháp này rất rành mạch: RAG giải quyết bài toán mô hình thiếu tri thức bên ngoài hoặc tri thức mới nhất; Fine-tuning giải quyết bài toán phong cách đầu ra, định dạng cấu trúc hoặc khả năng tuân thủ chỉ thị chưa ổn định cho tác vụ cụ thể.

Lấy ví dụ về hỏi đáp quy chế doanh nghiệp: RAG tương đương với thi mở sách (open-book exam), sổ tay quy chế nằm trong vector database bên ngoài, mỗi lần trả lời sẽ tra cứu điều khoản liên quan trước, khi quy chế thay đổi chỉ cần cập nhật chỉ mục; Fine-tuning tương đương với học thuộc lòng đóng sách (closed-book exam), điều chỉnh trọng số mô hình thông qua huấn luyện. Nếu trông chờ fine-tuning ghi nhớ các chi tiết nghiệp vụ biến động liên tục, không chỉ chu kỳ huấn luyện và đánh giá kéo dài, mà mô hình vẫn có thể "râu ông nọ cắm cằm bà kia" và không thể tự nhiên cung cấp trích dẫn nguồn văn bản gốc.

| Khía cạnh | RAG | Fine-tuning |
| --- | --- | --- |
| Cập nhật tri thức | Chỉ cần cập nhật cơ sở tri thức hoặc chỉ mục vector | Cần xây dựng lại tập dữ liệu huấn luyện, train và đánh giá lại mô hình |
| Bảo mật dữ liệu | Tri thức lưu trữ ngoài, lọc động theo ACL của người dùng khi truy xuất | Dữ liệu huấn luyện ngấm vào tham số mô hình, rất khó phân quyền chi tiết theo người dùng |
| Kiểm soát ảo giác | Có thể yêu cầu mô hình chỉ trả lời theo văn bản gốc và đính kèm trích dẫn | Mô hình sinh từ tham số, vẫn có thể bịa đặt chi tiết và không liên kết trực tiếp nguồn trích |
| Cấu trúc chi phí | Chi phí lưu trữ vector + chi phí truy xuất và Token context cho mỗi request | Chi phí làm sạch/gán nhãn dữ liệu, tài nguyên tính toán huấn luyện, host mô hình và duy trì nhiều phiên bản |
| Kịch bản phù hợp | Hỏi đáp chuyên sâu tri thức, quy chế pháp lý, tài liệu sản phẩm, thông tin thời gian thực | Chuẩn hóa giọng văn, xuất định dạng cấu trúc cố định, hiểu thuật ngữ chuyên ngành, chưng cất mô hình nhỏ |
| Rủi ro chính | Bỏ sót truy xuất, nhiễu ngữ cảnh gây nhiễu, bỏ sót lọc phân quyền | Quên thảm khốc (catastrophic forgetting), overfitting dữ liệu train, chi phí rollback và cập nhật cao khi tri thức lỗi thời |

Trong các kịch bản dọc phức tạp (như luật pháp, y tế, phân tích tài chính), hai giải pháp này có thể kết hợp cùng nhau: dùng fine-tuning để mô hình quen với thuật ngữ chuyên môn, quy chuẩn lập luận và định dạng đầu ra cố định, sau đó dùng RAG để nạp dữ liệu nghiệp vụ thời gian thực và bằng chứng văn bản gốc có thể truy vết. Với đa số đội ngũ kỹ thuật, khuyến nghị nên xây dựng chuỗi RAG và tập benchmark đánh giá thật ổn định trước, khi xác định điểm nghẽn thực sự nằm ở việc tuân thủ chỉ thị hoặc văn phong chuyên ngành của mô hình thì mới đánh giá việc đưa vào fine-tuning.

## Cửa sổ ngữ cảnh dài (Long Context) có thay thế RAG không?

Không. Hai công nghệ này có mối quan hệ bổ trợ lẫn nhau, ranh giới áp dụng phụ thuộc vào quy mô dữ liệu, tần suất gọi và yêu cầu quản trị.

Cửa sổ ngữ cảnh dài (như 128K đến hơn 1M Token) rất phù hợp cho các tác vụ đọc toàn bộ tài liệu đơn lẻ, số lượng ít trong một lần xử lý — chẳng hạn phân tích toàn bộ một tệp PDF báo cáo tài chính, đọc hiểu một module mã nguồn vừa và nhỏ, hoặc tóm tắt biên bản một cuộc họp dài. Những tác vụ này đòi hỏi đọc thông suốt toàn văn, việc cắt nhỏ thành chunk rồi truy xuất trái lại dễ bỏ sót mạch lạc toàn cục.

Tuy nhiên, khi bước vào kịch bản cơ sở tri thức doanh nghiệp, Long Context sẽ vấp phải bốn ràng buộc kỹ thuật cứng:

1. **Quy mô tri thức vượt xa giới hạn cửa sổ**: Tài liệu doanh nghiệp, ticket sự cố lịch sử, kho hợp đồng thường lên tới hàng chục triệu đến hàng trăm triệu Token, hoàn toàn không thể nhồi hết vào một request duy nhất.
2. **Độ trễ và chi phí gọi API tăng theo cấp số nhân**: Ngay cả khi cơ sở tri thức chỉ có vài trăm nghìn Token có thể ép vừa vào cửa sổ siêu dài, mỗi lần hỏi đáp thông thường đều phải mang theo hàng trăm nghìn Token đầu vào (dù có dùng Prefix Caching), độ trễ ký tự đầu tiên (TTFT) và hóa đơn chi phí vẫn cao hơn rất nhiều so với việc chỉ truyền vào vài nghìn Token của các đoạn trích.
3. **Pha loãng sự chú ý (Lost in the Middle)**: Khi ngữ cảnh bị trộn lẫn một lượng lớn tài liệu không liên quan, độ chính xác của mô hình trong việc trích xuất các sự thật then chốt ở vị trí giữa sẽ giảm sút rõ rệt, rất dễ bị phân tâm bởi các điều khoản tương tự nhưng không liên quan.
4. **Phân quyền dữ liệu và kiểm toán truy vết**: Cơ sở tri thức doanh nghiệp bắt buộc phải lọc phạm vi hiển thị nghiêm ngặt theo tenant, role và ACL tài liệu, đồng thời phải ghi nhận rõ ràng câu trả lời đã trích dẫn trang nào của tài liệu nào. Tầng truy xuất của RAG đương nhiên gánh vác trách nhiệm lọc quyền từ trước, thu hẹp phạm vi bằng chứng và gắn kết metadata trích dẫn.

## RAG có những giai đoạn tiến hóa nào?

Ngành công nghiệp thường chia quá trình tiến hóa kiến trúc của RAG thành ba giai đoạn:

![Các giai đoạn tiến hóa của RAG](/media/jg/ext/oss.javaguide.cn/javaguide/ai/rag/rag-2-evolution-stages-0aef48d9.png)

| Giai đoạn | Quy trình tiêu biểu | Đặc điểm |
| --- | --- | --- |
| Naive RAG | Cắt nhỏ tài liệu → Embedding → Truy xuất Top-K → LLM sinh câu trả lời | Cơ bản nhất, dễ triển khai nhất; phù hợp cho Demo và cơ sở tri thức đơn giản |
| Advanced RAG | Query Rewrite / HyDE → Tìm kiếm kết hợp (Hybrid Search) → Rerank → Nén ngữ cảnh → LLM sinh câu trả lời | Tập trung giải quyết bài toán truy xuất không chuẩn, nhiễu ngữ cảnh và xếp hạng không ổn định |
| Modular RAG | Các module Retriever, Reranker, Compressor, Router, Generator có thể cắm ghép linh hoạt | Định tuyến động theo kịch bản nghiệp vụ; phù hợp cho hệ thống production và Agent phức tạp |

Naive RAG có thể nhanh chóng dựng xong bản mẫu, nhưng trên tài liệu phức tạp thực tế rất dễ gặp các vấn đề: cắt đoạn làm phá vỡ cấu trúc, bỏ sót từ chuyên ngành và xếp hạng Top-K thiếu chính xác. Advanced RAG bổ sung viết lại truy vấn trước khi tìm kiếm, áp dụng tìm kiếm kết hợp và reranking trong lúc tìm kiếm, cùng nén ngữ cảnh sau khi tìm kiếm. Modular RAG tiến xa hơn bằng cách phân rã việc phân tích cú pháp, định tuyến, truy xuất (vector, toàn văn, SQL, đồ thị tri thức) và tự kiểm định thành các module có thể điều phối linh hoạt theo loại câu hỏi.

## Những hạn chế kỹ thuật của RAG là gì?

Phần trước đã đề cập đến các lợi thế của RAG trong việc cập nhật tri thức, cách ly dữ liệu riêng tư và truy vết nguồn. Khi triển khai lên môi trường production, bạn càng cần phải lường trước năm cái giá phải trả về mặt kỹ thuật:

1. **Chất lượng truy xuất trực tiếp quyết định trần câu trả lời**: Nếu bảng biểu PDF bị lệch hàng cột ngay từ khâu phân tích cú pháp, hoặc các điều kiện tiên quyết bị cắt đứt trong lúc chunking, những bằng chứng không lọt vào danh sách ứng viên thì dù LLM phía sau có thông minh đến đâu cũng không thể tự nghĩ ra được.
2. **Nhiễu ngữ cảnh sẽ làm sai lệch quá trình tạo sinh**: Nếu trong các đoạn tương đồng thu hồi về có lẫn tài liệu phiên bản cũ hoặc quy định của dòng sản phẩm tương tự, mô hình rất dễ chắp vá các điều kiện từ các nguồn khác nhau thành kết luận sai.
3. **Độ trễ toàn trình (End-to-End Latency) tăng lên**: Một yêu cầu hoàn chỉnh có thể phải xâu chuỗi từ viết lại truy vấn, mã hóa Embedding, truy xuất đa luồng, Cross-Encoder Rerank cho đến LLM sinh câu trả lời. Mỗi bước đều cộng dồn thời gian xử lý, đòi hỏi phải thiết kế bộ nhớ đệm (cache), timeout và phương án hạ cấp (fallback) cho kịch bản lượng truy cập cao.
4. **Độ phức tạp khi duy trì tính nhất quán trên nhiều thành phần lưu trữ**: Khi tài liệu được thêm mới, sửa đổi, xóa bỏ hoặc đổi quyền, hệ thống phải cập nhật đồng bộ vector database, chỉ mục tìm kiếm toàn văn và metadata database. Xử lý không khéo sẽ truy xuất phải "dữ liệu ma" (ghost data) đã bị xóa hoặc không còn quyền truy cập (xem chi tiết tại [Chiến lược cập nhật tài liệu cơ sở tri thức RAG](./rag-knowledge-update.md)).
5. **Chi phí Token và vận hành phát sinh liên tục**: Dù tiết kiệm được chi phí huấn luyện mô hình, nhưng mỗi truy vấn đều cần ghép nối các đoạn trích dẫn vào làm Token đầu vào, đồng thời phải duy trì chỉ mục vector và đường ống đánh giá định kỳ ngoại tuyến.

## Tổng kết

Giá trị cốt lõi của RAG là ghìm câu trả lời của mô hình lớn vào các bằng chứng bên ngoài có thể tìm kiếm, có thể trích dẫn và có thể kiểm soát phân quyền.

Khi lựa chọn giải pháp kỹ thuật, bạn có thể nắm bắt theo ba nguyên tắc chủ đạo:

1. Khi chỉ cần định vị tệp gốc thì đi qua tìm kiếm truyền thống; khi cần chắt lọc, tóm tắt hoặc giải đáp câu hỏi cụ thể liên tài liệu thì đi qua RAG.
2. Khi tri thức biến động liên tục, đòi hỏi cách ly dữ liệu theo phân quyền và đính kèm trích dẫn văn bản gốc thì ưu tiên dùng RAG; khi cần điều chỉnh văn phong, cố định định dạng đầu ra hoặc chưng cất năng lực chuyên biệt thì cân nhắc Fine-tuning.
3. Việc đọc hiểu toàn diện một tài liệu dài đơn lẻ phù hợp trực tiếp với cửa sổ ngữ cảnh dài; việc hỏi đáp trên kho tài liệu khổng lồ vẫn phụ thuộc vào RAG để thu hẹp phạm vi bằng chứng trước.

Chạy thông một Demo mới chỉ hoàn thành việc kết nối với vector database. Một hệ thống RAG cấp độ sản xuất thực sự tốn nhiều công sức ở chất lượng phân tích tài liệu, tinh chỉnh tìm kiếm kết hợp và reranking, tính nhất quán khi cập nhật gia tăng và kiểm thử hồi quy trên tập benchmark cố định.

Danh sách câu hỏi phỏng vấn tự kiểm tra:

- RAG là gì? Nó giải quyết những hạn chế cốt lõi nào của mô hình ngôn ngữ lớn?
- RAG khác gì so với công cụ tìm kiếm truyền thống? Trường hợp nào không cần thiết phải dùng RAG?
- Lựa chọn giữa RAG và Fine-tuning như thế nào? Khi nào cần kết hợp cả hai?
- Trong hệ thống RAG, lựa chọn mô hình Embedding như thế nào? Tại sao không thể chỉ nhìn vào bảng xếp hạng MTEB?
- Độ tương đồng Cosine, tích vô hướng và khoảng cách Euclid khác nhau như thế nào? Sau khi chuẩn hóa vector chúng có mối quan hệ gì?
- Tại sao khi đã áp dụng RAG vẫn xuất hiện ảo giác? Nên kiểm tra và giảm thiểu từ những khâu nào?
- Vấn đề "Lost in the Middle" là gì? Tại sao cửa sổ ngữ cảnh dài không thể thay thế hoàn toàn RAG?
- Sự khác biệt cốt lõi giữa Naive RAG, Advanced RAG và Modular RAG là gì?
