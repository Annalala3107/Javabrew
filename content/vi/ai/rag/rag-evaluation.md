---
title: "Đánh giá RAG: Từ tập dữ liệu offline đến khả năng quan sát online"
description: "Hướng dẫn nhập môn phương pháp đánh giá RAG, bao gồm xây dựng bộ dữ liệu đánh giá, Hit@K, Evidence Recall, MRR, độ trung thực của câu trả lời, đánh giá từ chối trả lời, so sánh phiên bản và khả năng quan sát online."
category: Phát triển ứng dụng AI
head:
  - - meta
    - name: keywords
      content: Đánh giá RAG,RAG evaluation,Hit@K,MRR,Faithfulness,đánh giá từ chối trả lời,LangSmith,Ragas,khả năng quan sát,observability
lang: vi
sourceRef: zh-ref/ai/rag/rag-evaluation.md
---

Một hệ thống hỏi đáp dựa trên knowledge base có thể trả về một đoạn văn mượt mà, lưu loát, nhưng làm sao để đánh giá xem nó trả lời có thực sự tốt hay không? Tài liệu có được tìm thấy không, câu trả lời có căn cứ xác thực không, khi tài liệu không đủ thông tin thì model có tự ý bịa đặt hay không—tất cả những điều này đều cần phải được kiểm tra kỹ lưỡng.

Bắt đầu từ một trường hợp hỏi đáp tri thức cụ thể, bài viết này sẽ hướng dẫn cách chuẩn bị mẫu đánh giá, kiểm tra độc lập giữa khâu truy xuất (retrieval) và tạo sinh (generation), cũng như cách dùng kết quả đánh giá để chỉ dẫn tối ưu hệ thống. Nếu bạn chưa quen thuộc với quy trình hỏi đáp của RAG, có thể tham khảo trước bài [Khái niệm cơ bản về RAG](./rag-basis.md).

## Đánh giá RAG là gì?

**Đánh giá RAG là việc đo lường hiệu năng của hệ thống Tạo sinh tăng cường truy xuất (Retrieval-Augmented Generation) dựa trên các tiêu chuẩn đã được xác định từ trước.** Bên cạnh việc chấm điểm câu trả lời cuối cùng, hệ thống còn phải kiểm tra kết quả truy xuất và toàn bộ quá trình thực thi của yêu cầu.

Giả sử có một đoạn tài liệu hướng dẫn sản phẩm như sau:

> Giới hạn upload file của bản Tiêu chuẩn là 20 MB, bản Chuyên nghiệp là 100 MB. File sau khi upload được lưu giữ 7 ngày, hết hạn sẽ tự động xóa.

Người dùng hỏi: "Bản Tiêu chuẩn có thể upload file dung lượng tối đa bao nhiêu, và lưu trữ được bao lâu sau khi upload?" Hệ thống cần tìm thấy hai bằng chứng: giới hạn dung lượng upload và thời gian lưu trữ, sau đó mới trả lời "20 MB và 7 ngày".

| Đối tượng kiểm tra | Câu hỏi cần giải đáp | Ví dụ minh họa |
| --- | --- | --- |
| Kết quả truy xuất | Bằng chứng cần thiết để trả lời đã được tìm thấy chưa? | Có tìm thấy đồng thời cả "20 MB" và "7 ngày" hay không |
| Câu trả lời tạo sinh | Câu trả lời có đúng, đủ và có căn cứ xác thực không? | Có nhầm giới hạn 100 MB của bản Chuyên nghiệp thành bản Tiêu chuẩn không |
| Quá trình thực thi | Yêu cầu có hoàn thành không, chi phí tài nguyên có chấp nhận được không? | Có bị timeout không, tổng thời gian và lượng Token tiêu thụ là bao nhiêu |

Nếu người dùng hỏi tiếp: "Sau khi xóa có thể khôi phục lại được không?", đoạn tài liệu hướng dẫn trên không hề cung cấp câu trả lời. Bộ đánh giá lúc này phải kiểm tra xem hệ thống có nêu rõ là tài liệu không đủ thông tin hay không, thay vì tự ý bịa ra "có thể khôi phục" hoặc "không thể khôi phục".

Một vòng đánh giá thường đòi hỏi bộ câu hỏi kiểm thử, tập ngữ liệu cố định, tiêu chuẩn chấm điểm và kết quả chạy thực tế. Câu trả lời tham chiếu giúp ích cho việc chấm điểm, nhưng không bắt buộc output phải giống từng chữ từng dấu: "một tuần" và "7 ngày" mang ý nghĩa hoàn toàn tương đương nhau.

## Tại sao cần phải đánh giá RAG?

Nếu bạn chỉnh kích thước chunk từ 800 xuống 400 Token và thấy câu trả lời của một câu hỏi cụ thể tốt lên, điều đó đã đủ chứng minh cấu hình mới ưu việt hơn chưa? Chưa thể khẳng định được. Bằng chứng của câu hỏi đó có thể dễ được truy xuất hơn, hoặc chỉ đơn giản là lượt chạy ngẫu nhiên lần này của model sinh câu trả lời đầy đủ hơn. Ngược lại, bằng chứng của các câu hỏi khác có thể đã bị băm vụn, khiến hiệu quả tổng thể bị sụt giảm.

Chỉ khi so sánh trên cùng một bộ câu hỏi và cùng một kho tài liệu, bạn mới nhìn thấy rõ các thay đổi đã tác động cụ thể đến những mẫu nào. Đánh giá chủ yếu phục vụ cho:

- **Lựa chọn cấu hình tối ưu**: So sánh sự đánh đổi giữa hiệu quả và chi phí của các phương pháp chia chunk, Embedding model, ngưỡng Top-K, model rerank và prompt.
- **Định vị chính xác nguyên nhân lỗi**: Phân định rạch ròi giữa việc không recall được bằng chứng, bằng chứng bị thất lạc khi ghép ngữ cảnh, model hiểu sai thông tin, hay lời gọi dịch vụ bị lỗi kỹ thuật.
- **Kiểm soát lỗi hồi quy (Regression)**: Sau khi vá một nhóm lỗi, kiểm chứng lại để đảm bảo các câu hỏi vốn dĩ đang hoạt động bình thường không bị hỏng lây.

Nếu chỉ nhìn vào điểm số tổng thể cuối cùng, bạn sẽ rất khó biết phải sửa từ đâu. Sổ tay có ghi thời gian lưu trữ nhưng retrieval không tìm ra, cần kiểm tra khâu recall; bằng chứng đã được đưa vào Prompt nhưng model lại phán "lưu trữ vĩnh viễn", cần kiểm tra khâu generation.

**Đánh giá offline (Offline Evaluation)** sử dụng các bộ mẫu chuẩn bị trước, rất phù hợp để so sánh giữa các phiên bản phần mềm. **Khả năng quan sát online (Online Observability)** ghi nhận trạng thái, độ trễ và các tiến trình trung gian của các request thực tế từ người dùng, giúp xử lý sự cố kịp thời; việc lấy mẫu chấm điểm trên các request này sẽ tạo thành khâu đánh giá chất lượng online liên tục. Cần lưu ý "offline" không đồng nghĩa với việc ngắt mạng hoàn toàn, việc gọi API model bên ngoài vẫn có thể phát sinh chi phí bình thường.

[Tài liệu khái niệm đánh giá của LangSmith](https://docs.langchain.com/langsmith/evaluation-concepts) đã vạch rõ sự phân công giữa thử nghiệm offline và đánh giá online: phát hiện vấn đề trên môi trường online, sau đó đóng gói thành các mẫu test offline để kiểm chứng việc sửa lỗi.

## Chuẩn bị bộ dữ liệu đánh giá như thế nào?

### Bắt đầu từ câu hỏi, bằng chứng xác thực và ý chính tham chiếu

Khi mới bắt đầu, hãy chuẩn bị một nhóm nhỏ các câu hỏi có thể kiểm tra kỹ lưỡng từng câu một, bao quát các sự thật trực tiếp, cách diễn đạt đồng nghĩa, bằng chứng nằm rải rác qua nhiều đoạn, các câu chỉ trả lời được một phần và các câu hỏi nằm ngoài phạm vi knowledge base. Tăng dần số lượng sau, trước hết phải đảm bảo căn cứ phán đoán của từng câu hỏi đều rõ ràng, minh bạch.

Dưới đây là một ví dụ mẫu dữ liệu tương ứng với đoạn tài liệu hướng dẫn sản phẩm ở trên. Cấu trúc các trường là ví dụ thiết kế thực tế, không phải là định dạng ép buộc của một framework cụ thể nào:

```json
{
  "id": "upload-01",
  "question": "Bản Tiêu chuẩn có thể upload file dung lượng tối đa bao nhiêu, và lưu trữ được bao lâu sau khi upload?",
  "corpusVersion": "manual-v1",
  "expectedEvidence": [
    { "id": "upload-limit", "text": "Giới hạn upload file của bản Tiêu chuẩn là 20 MB" },
    { "id": "retention", "text": "File sau khi upload được lưu giữ 7 ngày, hết hạn sẽ tự động xóa" }
  ],
  "referenceKeyPoints": ["Giới hạn upload là 20 MB", "Lưu trữ 7 ngày"],
  "answerability": "FULL",
  "reviewStatus": "PENDING"
}
```

Bằng chứng kỳ vọng (evidence) dùng để phán đoán xem khâu retrieval có tìm đúng căn cứ không, còn ý chính tham chiếu (reference key points) dùng để đánh giá xem câu trả lời có trọn vẹn không. Cả hai đều phải truy vết được về cùng một phiên bản văn bản gốc.

Mỗi khi điều chỉnh tham số chia chunk, Chunk ID thường sẽ thay đổi theo. Do đó, khi so sánh các chiến lược chunking, hãy dùng vị trí trong văn bản gốc, các mỏ neo văn bản ngắn hoặc Fact ID ổn định để gắn nhãn, sau đó ánh xạ sang các đoạn văn bản được truy xuất. Tuyệt đối không dùng trực tiếp Chunk ID cũ để phán đoán xem chunking mới có hit trúng hay không.

Phán đoán bằng cách so khớp chuỗi (string contains) rất dễ triển khai, nhưng dễ bỏ sót các bằng chứng nằm cắt ngang chunk, nội dung chuyển đổi từ bảng biểu hoặc các diễn đạt đồng nghĩa. Khi áp dụng phương pháp này, cần xác định rõ quy tắc chuẩn hóa văn bản và kiểm tra thủ công các mẫu bị nghi ngờ bỏ sót.

### Phân định câu hỏi Trả lời được toàn bộ, Trả lời một phần và Không thể trả lời

Tính trả lời được (answerability) phải được đánh giá dựa trên phiên bản ngữ liệu chỉ định, quyền truy cập của người dùng và phạm vi nguồn tin được phép sử dụng. Đối với hệ thống yêu cầu chỉ trả lời dựa trên knowledge base, có thể chia thành ba nhóm:

| Phân loại | Tình trạng tài liệu | Hành vi kỳ vọng |
| --- | --- | --- |
| `FULL` | Tài liệu bao quát toàn bộ nội dung câu hỏi | Trả lời đầy đủ và trích dẫn căn cứ xác thực |
| `PARTIAL` | Chỉ bao quát được một phần nội dung | Trả lời phần có căn cứ, nêu rõ phần thông tin còn thiếu |
| `NONE` | Không hỗ trợ nội dung câu hỏi đưa ra | Nêu rõ tài liệu không đủ thông tin, không bịa đặt |

Ví dụ, câu hỏi "Upload xong lưu được bao lâu, sau khi xóa có khôi phục được không" thuộc nhóm trả lời được một phần. Câu trả lời: "Lưu giữ trong 7 ngày; tài liệu không nêu rõ sau khi xóa có khôi phục được hay không" là hoàn toàn đạt kỳ vọng. Nếu xem câu này là câu thuần túy từ chối trả lời, hệ thống sẽ bỏ phí phần thông tin đã trả lời được; còn nếu ép buộc model phải trả lời cách khôi phục thì sẽ cổ xúy cho hành vi bịa đặt thông tin (hallucination).

Khả năng trả lời, ý chính tham chiếu và bằng chứng đều cần được review đối soát. Các nhãn sinh tự động ban đầu có thể gắn cờ `PENDING`, sau khi con người xác nhận thì chuyển thành `REVIEWED`. **Trạng thái chờ review không đồng nghĩa với pass, cũng không đồng nghĩa với fail.** Báo cáo chính thức phải công bố đồng thời số lượng mẫu chấm điểm hợp lệ và số lượng mẫu đang chờ review.

### Quản lý tách biệt giữa tập phát triển (Dev Set) và tập kiểm thử độc lập (Holdout Set)

Tập phát triển (dev set) dùng để tinh chỉnh tham số và phân tích lỗi; tập kiểm thử độc lập (holdout set) dùng để đánh giá trên các câu hỏi hoàn toàn chưa tham gia vào quá trình chỉnh tham số. Các câu hỏi viết lại cùng một ý, hoặc các biến thể sinh từ cùng một template, cố gắng gom theo nhóm câu hỏi (family) vào cùng một bên để tránh hiện tượng rò rỉ dữ liệu (data leakage).

Những câu hỏi đã đem ra dùng đi dùng lại nhiều lần để sửa quy tắc vẫn có thể tiếp tục dùng làm tài liệu test hồi quy, nhưng không thể tuyên bố chúng là bài test mù (blind test) độc lập nữa. Ngoài ra, cần giữ lại các tài liệu gây nhiễu cùng lĩnh vực trong kho tri thức: nếu knowledge base chỉ có đúng 5 chunk mà Top-K lại đặt bằng 8, việc trả về toàn bộ kho dữ liệu sẽ tạo ra tỷ lệ hit rate cao ảo, không thể phân biệt được chất lượng thực sự của các chiến lược truy xuất.

## Đánh giá chất lượng truy xuất (Retrieval) như thế nào?

Trước hết hãy cố định đối tượng cần đánh giá: bạn đang kiểm tra candidate pool của recall thô, Top-K sau khi rerank, hay context cuối cùng đưa vào prompt của model? Kết quả của các giai đoạn này có thể khác biệt nhau rất lớn. Khuyến nghị ghi nhận riêng biệt từng giai đoạn để tránh nhầm lẫn giữa tỷ lệ recall cao trong candidate pool với độ phủ bằng chứng mà model thực tế tiếp nhận được.

Đối với các mẫu đã xác nhận bằng chứng kỳ vọng và có ít nhất một bằng chứng hợp lệ, có thể bắt đầu từ ba chỉ số cốt lõi:

| Chỉ số | Cách tính toán | Trọng tâm đánh giá |
| --- | --- | --- |
| Hit@K | Số câu có Top-K chứa ít nhất 1 bằng chứng kỳ vọng / Tổng số câu hợp lệ | Có tìm thấy bằng chứng nào không |
| Evidence Recall@K | Số bằng chứng trúng của mỗi câu / Tổng số bằng chứng kỳ vọng của câu đó, rồi lấy trung bình trên toàn bộ các câu | Đã tìm đủ được bao nhiêu phần bằng chứng |
| MRR@K | Điểm nghịch đảo thứ hạng (Reciprocal Rank) của kết quả liên quan đầu tiên, lấy trung bình các câu; không trúng trong Top-K tính là 0 | Bằng chứng đúng đầu tiên được xếp hạng cao đến mức nào |

Chỉ số Evidence Recall ở đây khử trùng lặp theo ID bằng chứng và tính trung bình macro theo từng câu hỏi; không dùng lẫn lộn trực tiếp với Recall tính theo Chunk hay các chỉ số cùng tên của các thư viện bên thứ ba.

Quay lại ví dụ câu hỏi upload, câu này cần cả 2 bằng chứng là "20 MB" và "7 ngày". Giả sử Top-3 trả về lần lượt:

1. Hướng dẫn sửa thông tin tài khoản (không liên quan).
2. Giới hạn upload bản Tiêu chuẩn là 20 MB.
3. Hướng dẫn yêu cầu hóa đơn (không liên quan).

Đối với câu hỏi này, Hit@3 là 1, Evidence Recall@3 là 1/2, và điểm nghịch đảo thứ hạng RR@3 là 1/2. **MRR là giá trị trung bình cộng RR của nhiều câu hỏi.** Hit trúng một mẩu bằng chứng không có nghĩa là tài liệu cần thiết để trả lời câu hỏi đã được thu thập đầy đủ.

Bạn cũng có thể dùng Precision@K để kiểm tra xem trong số các kết quả trả về có bao nhiêu phần là thực sự liên quan. Nó đếm theo đơn vị kết quả trả về, mang ý nghĩa khác với Evidence Recall (đo lường theo đơn vị sự thật); khi kết quả trả về không đủ K mục thì dùng mẫu số nào cũng cần phải được quy định cố định trong tiêu chuẩn đánh giá.

Các câu hỏi nằm ngoài knowledge base không có bằng chứng kỳ vọng, mẫu số tính Recall bằng 0, nên cần đánh dấu là không áp dụng (N/A) và chuyển sang đánh giá hành vi từ chối trả lời. Tuyệt đối không được tính chúng là các mẫu đạt điểm tối đa trong retrieval.

## Đánh giá câu trả lời tạo sinh (Generation) như thế nào?

### Tách bạch Tính chính xác, Tính trọn vẹn và Độ trung thực

| Chiều đánh giá | So sánh cái gì | Lỗi điển hình |
| --- | --- | --- |
| Tính chính xác (Correctness) | Câu trả lời so với sự thật tham chiếu đã xác thực | Trả lời giới hạn bản Tiêu chuẩn là 100 MB |
| Tính trọn vẹn (Completeness) | Câu trả lời so với các ý chính tham chiếu | Chỉ trả lời dung lượng upload, bỏ quên thời gian lưu trữ |
| Độ trung thực (Faithfulness) | Các tuyên bố sự thật trong câu trả lời so với context thực tế được cung cấp | Context không có chính sách khôi phục nhưng lại khẳng định "có thể khôi phục trong 30 ngày" |
| Tính liên quan (Relevancy) | Câu trả lời so với câu hỏi của người dùng | Người dùng hỏi thời gian lưu trữ lại đi trả lời thao tác đăng ký tài khoản |
| Căn cứ trích dẫn (Citation Support) | Đoạn trích dẫn so với tuyên bố tương ứng | Có đính kèm link nguồn nhưng nội dung nguồn không chứng minh cho kết luận đó |

Tính chính xác và Độ trung thực là hai khái niệm cực kỳ dễ bị đánh đồng. Nếu context cung cấp một bản hướng dẫn đã lỗi thời và model trả lời răm rắp theo đó, câu trả lời đạt độ trung thực cao với context, nhưng lại không chính xác so với chính sách hiện hành. Ngược lại, nếu model dựa vào tri thức nạp sẵn trong tham số để trả lời tình cờ đúng, nhưng context cung cấp không hề có căn cứ, thì câu trả lời đó cũng không được xem là trung thực với ngữ cảnh.

[Chỉ số Faithfulness của Ragas](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/) bóc tách câu trả lời thành từng luận điểm sự thật độc lập, sau đó kiểm tra xem context có chống lưng vững chắc cho các luận điểm đó hay không. Khi áp dụng phương pháp chấm điểm này, cần xử lý riêng các trường hợp câu trả lời rỗng hoặc các phản hồi từ chối trả lời thuần túy không chứa luận điểm sự thật, không thể mặc định cho chúng điểm tối đa như một câu trả lời hoàn chỉnh.

### Ghi nhận tách biệt giữa Từ chối ở tầng nghiệp vụ và Từ chối ở tầng ngữ nghĩa

Từ chối ở tầng nghiệp vụ là trạng thái được chương trình ghi nhận bằng mã, ví dụ `NO_RESULT`; còn từ chối ở tầng ngữ nghĩa là ý tứ được diễn đạt trong nội dung văn bản câu trả lời, ví dụ: "Tài liệu không cung cấp phương thức khôi phục, không thể xác nhận". Những tên trạng thái này chỉ là ví dụ triển khai, không phải là quy chuẩn duy nhất của RAG.

Hai trạng thái này có thể không ăn khớp nhau: model đã từ chối rõ ràng trong câu trả lời nhưng chương trình lại gắn cờ `ANSWERED`; hoặc bộ lọc của chương trình cứ thấy từ "không hỗ trợ" là phán từ chối, gây hiểu nhầm sang các câu giải thích kỹ thuật bình thường như "Bản Tiêu chuẩn không hỗ trợ upload hàng loạt".

Đánh giá từ chối trả lời có thể chia thành hai bước kiểm tra:

- **Nhận diện nghiệp vụ có chuẩn xác không**: Quyết định của chương trình có nhất quán với ngữ nghĩa văn bản đã được kiểm tra độc lập hay không, thống kê riêng tỷ lệ nhận diện sót và nhận diện nhầm.
- **Hành vi từ chối có đạt kỳ vọng không**: Câu hỏi không trả lời được có bị từ chối không; câu hỏi trả lời được có bị từ chối nhầm không; và câu hỏi trả lời được một phần có giữ lại được phần thông tin có căn cứ hay không.

Ví dụ, khi tính tỷ lệ từ chối đúng trên các mẫu không thể trả lời, mẫu số bắt buộc phải là các mẫu không thể trả lời đã thực thi thành công và đã được xác nhận cả tính trả lời được lẫn ngữ nghĩa câu trả lời; còn tỷ lệ từ chối nhầm trên các câu hỏi trả lời được sẽ dùng một mẫu số riêng biệt. Báo cáo đánh giá bắt buộc phải hiển thị số lượng mẫu thực tế bên cạnh các tỷ lệ phần trăm.

Tránh dùng cùng một bộ lọc từ khóa trên production vừa để quyết định trạng thái nghiệp vụ vừa làm thước đo chấm điểm ngữ nghĩa. Nếu cả hai dùng chung logic, chúng sẽ chỉ lặp lại cùng một lỗi sai. Kiểm thử theo quy tắc thích hợp để xác minh các cách diễn đạt đã biết, còn review thủ công hoặc một evaluator độc lập đã được hiệu chuẩn mới đủ năng lực phán đoán chính xác ý tứ câu trả lời.

## Xử lý lỗi thực thi hệ thống như thế nào trong chỉ số?

Hiện tượng rớt mạng, model bị timeout, người dùng hủy yêu cầu và hành vi chủ động từ chối trả lời hợp lệ phải được ghi nhận tách bạch. Một phản hồi từ chối hợp lệ là một request đã hoàn thành trọn vẹn, có thể tiếp tục đánh giá xem việc từ chối đó có hợp lý hay không; còn lỗi thực thi hệ thống không tạo ra câu trả lời hợp lệ, do đó không thể đưa trực tiếp vào mẫu số tính độ chính xác hay độ trung thực của câu trả lời.

Giả sử kế hoạch chạy 10 câu hỏi, 2 câu bị timeout, 8 câu còn lại đều vượt qua kiểm tra, báo cáo đánh giá cần trình bày đầy đủ:

- Tỷ lệ thực thi thành công: 8/10, tức 80%.
- Tỷ lệ đạt của các câu trả lời hợp lệ: 8/8, tức 100%.
- Số lượng timeout: 2, kèm theo nguyên nhân thất bại và thời gian đã chạy.

Nếu chỉ báo cáo con số 100% thì sẽ che giấu đi sự thật rằng có những request không thể phục vụ được. Bạn cũng có thể báo cáo thêm tỷ lệ thành công end-to-end trên toàn bộ các request gửi đi, nhưng phải đặt một tên gọi riêng biệt và nêu rõ các ca timeout bị tính điểm như thế nào.

Mỗi chỉ số chất lượng còn phải loại trừ các nhãn không áp dụng và nhãn chưa được xác nhận, do đó số lượng mẫu hợp lệ của từng chỉ số có thể không giống nhau. Khi không có mẫu hợp lệ nào, hãy trả về giá trị `null` hoặc "Không áp dụng", tuyệt đối không điền bừa thành 0% hay 100%.

Chiến lược retry cũng ảnh hưởng trực tiếp đến kết quả so sánh. Khi bật retry, hãy lưu lại số lần thử, lỗi lần đầu và kết quả cuối cùng, tổng thời gian và chi phí tích lũy; không thể chỉ giữ lại duy nhất bản ghi của lần retry thành công sau cùng.

## Vận hành một quy trình đánh giá offline như thế nào?

Không nhất thiết phải tích hợp ngay một nền tảng phức tạp. Một script đơn giản đọc file JSONL cũng hoàn toàn có thể chạy thông luồng quy trình dưới đây:

```text
Đọc ngữ liệu cố định, tập mẫu và cấu hình
  -> Gọi pipeline truy xuất hoặc hỏi đáp cần đánh giá
  -> Lưu trữ các đoạn ứng viên, context cuối cùng và câu trả lời hoàn chỉnh
  -> Ghi nhận trạng thái kết thúc, độ trễ từng giai đoạn và chi phí gọi model
  -> Chấm điểm riêng biệt theo từng nhãn hợp lệ
  -> Xuất kết quả chi tiết từng câu hỏi và báo cáo tổng hợp
```

Cố gắng tái sử dụng tối đa logic truy xuất và dựng context thực tế của ứng dụng, nếu không bạn chỉ đang đánh giá một bản triển khai khác không đại diện cho thực tế. Đối với câu hỏi hội thoại nhiều lượt (multi-turn), ngoài việc lưu lịch sử tin nhắn, cần làm rõ việc đánh giá có bao quát khâu nạp lịch sử session, cắt tỉa ngữ cảnh và lưu trữ trạng thái hay không; việc chỉ sinh câu trả lời một lần dựa trên một đoạn lịch sử tĩnh hoàn toàn không tương đương với bài test tương tác hội thoại liên tục.

Mỗi đợt thử nghiệm tối thiểu phải cố định và ghi nhận: phiên bản ngữ liệu và tập dữ liệu, commit SHA của code, tên model, phương thức chia chunk, Top-K, điều kiện lọc, cấu hình rerank, prompt và phiên bản của evaluator. Đặt timeout tổng thể hợp lý cho các lượt sinh câu trả lời, lưu lại log chẩn đoán lỗi trước khi quyết định có để pipeline fail-exit hay không.

Các phương pháp chấm điểm có thể kết hợp linh hoạt. Quy tắc code thích hợp cho việc kiểm tra cấu trúc, khớp bằng chứng và kiểm tra tính xác định; con người phù hợp để xây dựng tiêu chuẩn và phân xử các trường hợp tranh chấp; còn LLM-as-a-judge thích hợp để hỗ trợ chấm điểm hàng loạt theo các thang đo (rubric) rõ ràng. Khi dùng model chấm điểm, bắt buộc phải lưu lại phần giải thích lý do, bằng chứng trích dẫn, model giám khảo và phiên bản prompt, đồng thời dùng các mẫu người chấm để kiểm tra độ lệch, tuyệt đối không được tự ý gắn nhãn là "đã được người review".

Khi cần tham khảo cách triển khai thực tế, bạn có thể xem [Hướng dẫn đánh giá RAG của LangSmith](https://docs.langchain.com/langsmith/evaluate-rag-tutorial). Nó minh họa rất trực quan cách thức kiểm tra tính chính xác, tính liên quan, căn cứ sự thật và độ chính xác truy xuất, rất phù hợp để hiểu cách tổ chức dữ liệu đầu vào cho việc chấm điểm; khi áp dụng vào thực tế, bạn vẫn cần bổ sung thêm các tiêu chuẩn xử lý từ chối và ngoại lệ của riêng mình.

## Làm thế nào để phán đoán một tối ưu hóa có hiệu quả?

Trước hết hãy lưu lại baseline làm mốc chuẩn, sau đó mỗi lần thử nghiệm chỉ thay đổi duy nhất một yếu tố chính. Ví dụ khi so sánh kích thước chunk, hãy cố định câu hỏi, ngữ liệu, model, Top-K và phương thức chấm điểm; khi so sánh các model với nhau, hãy cố gắng giữ nguyên ngữ cảnh context thực tế cung cấp cho model.

Báo cáo so sánh ngoài giá trị trung bình tổng thể, bắt buộc phải giữ lại mức độ chênh lệch của từng câu hỏi và kết quả phân loại chi tiết. Chỉ số tổng thể tăng lên có thể đi kèm với việc các câu hỏi đòi hỏi thông tin đa đoạn bị kém đi, hoặc các câu hỏi không thể trả lời bắt đầu sinh ảo giác. Hãy truy vết các lỗi mới phát sinh theo từng công đoạn:

1. Văn bản gốc có tồn tại không, khâu parsing có giữ lại các điều kiện then chốt không.
2. Bằng chứng có lọt được vào candidate pool của recall thô không.
3. Khâu rerank có đẩy bằng chứng ra ngoài phạm vi cắt gọt không.
4. Khâu khử trùng lặp, nén ngữ cảnh và hạn mức Token có vô tình vứt bỏ bằng chứng không.
5. Khi bằng chứng đã được đưa vào đầy đủ, model có bỏ sót hoặc hiểu sai không.

Khâu sinh câu trả lời của LLM luôn có độ dao động ngẫu nhiên. Khi độ chênh lệch rất nhỏ hoặc số lượng mẫu quá ít, hãy chạy lặp lại nhiều lần trên các mẫu trọng điểm và báo cáo độ dao động; đừng vội công bố nâng cấp thành công chỉ dựa vào một lượt chạy điểm cao may mắn. Độ trễ, lượng Token tiêu thụ và chi phí tài nguyên giữa các model cũng cần được so sánh đồng thời.

Kiểm thử hồi quy (Regression Test) và đánh giá trên các câu trả lời sinh mới đảm nhận những nhiệm vụ hoàn toàn khác nhau. Việc lưu lại một đoạn văn bản từng bị nhận diện nhầm giúp bạn kiểm tra ổn định xem regex hay quy tắc từ chối đã được vá chưa; nhưng nó không chứng minh được rằng những cách diễn đạt mới mà model sinh ra sau này cũng sẽ được nhận diện chính xác. Sau khi bài test hồi quy pass, hãy tiếp tục dùng các mẫu độc lập để kiểm chứng các câu trả lời mới.

## Sau khi lên Production còn cần quan sát những gì?

Các bài test offline không thể nào bao quát hết mọi ngóc ngách của câu hỏi thực tế. Trên production, bạn bắt buộc phải xâu chuỗi câu hỏi, kết quả truy xuất, ngữ cảnh lắp ráp, lượt gọi model và kết quả cuối cùng vào cùng một Trace ID duy nhất thì mới có thể giải thích được một sự cố đã bắt nguồn từ đâu.

| Dữ liệu cần ghi nhận | Mục đích chẩn đoán |
| --- | --- |
| Request ID, Session ID, Thông tin phiên bản | Liên kết phản hồi của người dùng với cấu hình hệ thống cụ thể |
| Câu hỏi gốc, Câu hỏi sau khi rewrite | Phán đoán xem việc viết lại query có làm lệch ý định người dùng không |
| Đoạn ứng viên, Thứ hạng, Điều kiện lọc | Kiểm tra tại sao bằng chứng không được recall hoặc bị xếp hạng thấp |
| Context thực tế, Câu trả lời đầy đủ, Trích dẫn | Đánh giá xem câu trả lời có sử dụng và trung thực với bằng chứng không |
| Trạng thái kết thúc, Lý do từ chối, Ngoại lệ & Retry | Phân biệt giữa từ chối bình thường, nhận diện nhầm và lỗi hệ thống |
| Thời gian từng giai đoạn (Recall, Rerank, TTFT, Tổng) & Token | Định vị điểm nghẽn độ trễ và sự đột biến về chi phí |

Khi lưu trữ câu hỏi, câu trả lời và các đoạn trích, cần kết hợp mức độ nhạy cảm của dữ liệu để thiết lập cơ chế ẩn danh (masking), phân quyền truy cập và thời hạn lưu trữ; tuyệt đối không vì mục đích chẩn đoán lỗi mà phá vỡ ranh giới an toàn thông tin ban đầu. Các nhãn của metric chuỗi thời gian (timeseries) cố gắng sử dụng tên model, nhãn phiên bản và tập trạng thái hữu hạn, đừng ném toàn bộ câu hỏi hay Request ID vào làm nhãn metric.

Trên môi trường online, trước hết có thể theo dõi tỷ lệ thực thi thành công, tỷ lệ timeout, tỷ lệ từ chối trả lời, các phân vị độ trễ (P95/P99) và chi phí tài nguyên. Tỷ lệ từ chối tăng lên có thể do độ phủ tri thức chưa đủ, nhưng cũng có thể do phân bổ câu hỏi người dùng thay đổi, bộ lọc quyền hạn bị siết chặt hoặc bộ nhận diện phán đoán nhầm; chỉ số đơn thuần chỉ phản ánh triệu chứng, muốn biết nguyên nhân gốc rễ phải soi vào chi tiết của từng trace.

Chất lượng câu trả lời đòi hỏi phải liên tục lấy mẫu review thủ công. Khi lấy mẫu, hãy giữ lại cả luồng traffic bình thường lẫn các lát cắt trọng điểm (người dùng đánh giá tiêu cực, câu trả lời từ chối, các nhóm câu hỏi mới xuất hiện); nếu chỉ chăm chăm kiểm tra các mẫu bị chê thì bạn chỉ thu được kết quả phân tích sự cố, không thể đại diện cho chất lượng của toàn bộ traffic hệ thống. Hãy làm sạch và đưa các lỗi đã được xác nhận vào bộ test hồi quy offline, sau khi vá lỗi xong chạy kiểm chứng lại rồi mới tiếp tục theo dõi biểu hiện trên production.

## Tài liệu tham khảo

- [LangSmith: Khái niệm đánh giá (Evaluation concepts)](https://docs.langchain.com/langsmith/evaluation-concepts): Tìm hiểu mối quan hệ giữa Dataset, Thử nghiệm, Evaluator và Đánh giá offline/online.
- [LangSmith: Hướng dẫn đánh giá ứng dụng RAG](https://docs.langchain.com/langsmith/evaluate-rag-tutorial): Tham khảo phương thức tổ chức chấm điểm RAG theo từng chiều độc lập.
- [Ragas: Chỉ số Faithfulness](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/): Hiểu phương pháp kiểm tra luận điểm sự thật dựa trên ngữ cảnh được cung cấp.
- [Hệ thống đánh giá ứng dụng AI](../llm-basis/llm-evaluation.md): Tìm hiểu sâu hơn về bộ đánh giá dùng chung, cổng kiểm soát chất lượng (Quality Gates) và nghiệm thu trước khi release.
- [Tối ưu hóa RAG: Từ Recall, Rerank đến Context Engineering](./rag-optimization.md): Kết hợp kết quả đánh giá chi tiết từng câu hỏi để định vị và khắc phục sự cố hệ thống.
