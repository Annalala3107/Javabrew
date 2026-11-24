---
title: "Trình bày dự án Agent khi phỏng vấn như thế nào? Từ kiến trúc hệ thống, lựa chọn công nghệ đến phân tích bài học Badcase"
description: "Phương pháp bài bản để chuẩn bị phỏng vấn dự án Agent: từ bảng phục dựng dự án, kiến trúc hệ thống, chuỗi request, đến cân nhắc lựa chọn Agent/Workflow, RAG, Memory, MCP, cùng quản trị công cụ, chỉ số đánh giá và mổ xẻ bài học từ Badcase."
category: AI
tag:
  - Phỏng vấn AI
  - Phỏng vấn Agent
  - Kinh nghiệm dự án
head:
  - - meta
    - name: keywords
      content: Agent project interview, Agent interview, AI project interview, Agent system architecture, Agent tech stack selection, Agent badcase, Agent evaluation, AI application development interview
lang: vi
sourceRef: zh-ref/ai/interview-questions/agent-project-interview-guide.md
---

Trong các buổi phỏng vấn định hướng Agent / ứng dụng AI, người phỏng vấn hầu như không bao giờ dừng lại ở việc kiểm tra định nghĩa khái niệm suông. Thông thường, họ sẽ dựa trên chính dự án thực tế của bạn để đào sâu: tại sao bạn lại thiết kế như vậy, hệ thống trên production từng phát sinh sự cố gì, và bạn đã định vị nguyên nhân cũng như khắc phục ra sao.

Nếu trước khi phỏng vấn, bạn chỉ chăm chú học thuộc lòng các khái niệm cốt lõi như ReAct, RAG, Memory, MCP, Function Calling, bạn sẽ rất khó ứng phó khi người phỏng vấn truy vấn dồn dập:

1. Hệ thống bạn làm có thực sự là Agent không, tại sao không thể giải quyết bằng API thông thường hay một Workflow cố định?
2. Khi một request đi vào, nó đã đi qua những thành phần nào, trạng thái và dữ liệu luân chuyển ra sao?
3. Các giải pháp kỹ thuật then chốt được lựa chọn dựa trên những ràng buộc cụ thể nào, và cái giá phải đánh đổi là gì?
4. Dự án từng thất bại ở những điểm nào, bạn đã định vị, sửa lỗi và ngăn ngừa sự cố tái diễn bằng cách nào?

Để bạn đọc dễ tiếp cận và thấu suốt, trong bài viết này tôi sẽ lấy ví dụ xuyên suốt về một **Agent xử lý phiếu hỗ trợ (ticket) hậu mãi thông minh** để kết nối toàn bộ các vấn đề trên.

Dù dự án thực tế của bạn có tương tự hay không thì cũng không thành vấn đề, bởi phương pháp luận được chia sẻ ở đây là hoàn toàn phổ quát. Khi chuẩn bị cho dự án của chính mình, bạn chỉ cần thay thế bối cảnh nghiệp vụ, trách nhiệm cá nhân, quy mô dữ liệu và các chỉ số đo lường bằng thông tin thực tế của bạn.

## Phỏng vấn dự án Agent thực chất đang kiểm tra điều gì?

Trước hết, hãy hiểu rõ tại sao người phỏng vấn lại đặt ra những câu hỏi như vậy. Không giống như các dự án CRUD truyền thống vốn đã có hệ thống tiêu chuẩn đánh giá hoàn thiện, với dự án Agent, người phỏng vấn không thể chỉ dựa vào hai chữ "đã làm" để phán đoán trình độ của bạn. Họ bắt buộc phải thông qua các câu hỏi đào sâu nhiều tầng để kiểm chứng ba điều:

1. **Dự án có thật hay không.** Người từng trực tiếp làm sẽ nói vanh vách về những ràng buộc thực tế, số liệu cụ thể và các "hố sâu" từng giẫm phải; người chỉ học vẹt dự án chỉ có thể thuật lại sơ đồ kiến trúc. Khi người phỏng vấn hỏi dồn đến tầng thứ ba, khoảng cách giữa hai nhóm người này sẽ lộ rõ ngay lập tức.
2. **Bạn có năng lực đưa ra quyết định kỹ thuật hay không.** Trong lĩnh vực Agent cũng không hề có "viên đạn bạc". Cùng một bài toán, bạn có thể giải quyết bằng Prompt, Workflow, RAG, gọi công cụ (Tool Calling) hoặc Multi-Agent. Người phỏng vấn muốn biết: đứng trước những ràng buộc cụ thể của bạn, liệu bạn có khả năng cân nhắc thiệt hơn để tìm ra giải pháp hợp lý nhất hay không, chứ không phải vì bài hướng dẫn trên mạng làm thế, hay vì AI gợi ý cho bạn như vậy.
3. **Nhận thức của bạn về ranh giới hệ thống.** Đầu ra của mô hình là xác suất và không hoàn toàn đáng tin cậy, trạng thái có thể bị bất đồng bộ, công cụ chắc chắn sẽ có lúc thất bại—chỉ những kỹ sư lường trước được các rủi ro này và biết dùng các biện pháp kỹ thuật để bao bọc bảo vệ hệ thống mới là những người đủ năng lực đưa sản phẩm lên production.

Tương ứng với điều đó, tại sao những câu trả lời kiểu "hiệu quả dự án rất tốt", "kiến trúc có khả năng mở rộng cao", "độ chính xác của mô hình rất cao" lại hoàn toàn vô giá trị? Bởi vì chúng chỉ là kết luận chủ quan, không phải là luận chứng. Lượng thông tin người phỏng vấn thu nhận được là con số không tròn trĩnh: họ vừa không thể xác minh thật giả, vừa không đánh giá được mức độ tham gia thực tế của bạn. Câu trả lời thực sự tạo nên sự khác biệt là phải xâu chuỗi đồng thời cả bốn yếu tố: Ràng buộc, Lựa chọn, Đánh đổi và Bằng chứng:

> Dưới [ràng buộc cụ thể], tôi đã đưa ra [lựa chọn kỹ thuật]; nó giải quyết được [vấn đề cụ thể], nhưng cũng kéo theo [cái giá phải trả]; và cuối cùng, tôi dùng [bằng chứng thực nghiệm] để xác nhận lựa chọn này thực sự hiệu quả.

Bốn yếu tố này nếu thiếu đi bất kỳ một mắt xích nào, câu trả lời sẽ sụp đổ:

- Thiếu **ràng buộc**: Lựa chọn của bạn biến thành "thấy mọi người đều dùng nên dùng", không thể hiện được năng lực phán đoán kỹ thuật;
- Thiếu **đánh đổi (cái giá phải trả)**: Chứng tỏ bạn chưa từng đưa hệ thống lên production thực tế—bất kỳ giải pháp nào cũng có cái giá của nó; chia nhỏ thành Multi-Agent sẽ khiến chi phí debug, chuyển giao ngữ cảnh và độ trễ tăng vọt;
- Thiếu **bằng chứng**: Hiệu quả chỉ là cảm tính chủ quan; chỉ những số liệu như "tỷ lệ chọn sai công cụ giảm từ 8% xuống 2% trên tập đánh giá 200 mẫu" mới có thể kiểm chứng được;
- Thiếu **phương án thay thế**: Người phỏng vấn không thể biết được bạn đã thực sự cân nhắc thiệt hơn hay bạn chỉ biết duy nhất một cách làm rập khuôn.

Lấy ví dụ, câu nói "Chúng tôi đã dùng Multi-Agent để nâng cao hiệu quả" hoàn toàn không giải thích được lý do tại sao phải chia tách và cái giá phải trả là gì. Khi trả lời, bạn nên bổ sung toàn bộ quá trình ra quyết định đó:

> Ban đầu hệ thống là một Agent đơn lẻ. Khi số lượng công cụ tăng lên, mô hình rất dễ chọn nhầm giữa công cụ tra cứu chính sách hoàn tiền và công cụ tạo phiếu ghi. Chúng tôi không vội vàng chia ngay thành nhiều Agent, mà trước tiên tiến hành thu gọn tập công cụ, viết lại mô tả công cụ thật chặt chẽ và bổ sung bộ đánh giá định tuyến (routing eval), giúp tỷ lệ chọn sai giảm từ 8% xuống còn 3%. Về sau, khi các nghiệp vụ khác nhau đòi hỏi các vùng ngữ cảnh độc lập và do các nhóm kỹ sư khác nhau chịu trách nhiệm bảo trì, chúng tôi mới chính thức chia tách Agent theo miền nghiệp vụ. Cái giá phải trả là các tác vụ liên miền cần thêm một tầng định tuyến, khiến độ trễ tổng thể tăng thêm vài trăm mili-giây. Do đó, chúng tôi đã thiết kế tầng định tuyến này thành một bộ điều phối nhẹ dựa trên phân loại ý định (intent classification), thay vì đưa thêm một "Manager Agent" cồng kềnh vào hệ thống.

So sánh hai cách trả lời sẽ thấy sự khác biệt một trời một vực: câu trả lời ban đầu chỉ nói "đã dùng cái gì", trong khi phiên bản mở rộng đã giải thích rõ hiện tượng lỗi (chọn nhầm công cụ), quyết định xử lý (tối ưu quản trị công cụ trước rồi mới chia tách), phương án thay thế (không chia tách vẫn giải quyết được một phần), căn cứ đánh giá (số liệu kiểm thử định tuyến) và cái giá phải trả (độ trễ tăng cùng phương án khắc phục). Thông qua đoạn trả lời này, người phỏng vấn vừa kiểm chứng được tính chân thực của dự án, vừa thấy được tư duy ra quyết định của bạn—mật độ thông tin cao hơn rất nhiều so với việc chỉ liệt kê hàng loạt tên framework.

Hơn thế nữa, đoạn trả lời này còn chủ động "gài" sẵn các móc câu để người phỏng vấn tiếp tục hỏi sâu: bộ đánh giá định tuyến làm thế nào, tại sao phân loại ý định lại không dùng LLM Router, ngữ cảnh được truyền đi ra sao. Những chiếc móc câu này đều là những mảng kiến thức mà bạn đã chuẩn bị kỹ lưỡng từ trước, giúp bạn chủ động dẫn dắt cuộc phỏng vấn vào đúng "sân nhà" của mình, thay vì bị động rơi vào những vùng kiến thức mù mờ.

## Bảng phục dựng dự án nên ghi những gì?

Trước khi chuẩn bị câu trả lời, bạn nên tự mình phục dựng lại dự án theo bảng mẫu dưới đây. Bảng này dùng để lưu lại những sự thật có thể kiểm chứng khi người phỏng vấn tiếp tục hỏi sâu, chứ không nhằm mục đích trình bày trên CV.

| Yếu tố dự án | Nội dung cần làm rõ ràng, minh bạch | Những câu sáo rỗng thường gặp |
| ------------ | ----------------------------------- | ----------------------------- |
| Vấn đề nghiệp vụ | Ai, trong kịch bản nào, đã gặp phải vấn đề cụ thể gì? | "Nâng cao trải nghiệm người dùng" |
| Tiêu chuẩn thành công | Kết quả đầu ra như thế nào mới được coi là hoàn thành tác vụ? | "Trả lời chính xác hơn" |
| Đầu vào & Đầu ra | Input của người dùng, sản phẩm cuối của hệ thống, có thay đổi trạng thái bên ngoài không? | "Hỗ trợ tương tác bằng ngôn ngữ tự nhiên" |
| Giải pháp cũ | Những điểm yếu của quy trình thủ công, hệ thống quy tắc (rule-based) hoặc RAG thông thường | "Phương án truyền thống không đủ thông minh" |
| Trách nhiệm cá nhân | Module cụ thể mình phụ trách, các quyết định kỹ thuật và công việc khắc phục sự cố | "Tham gia xây dựng tổng thể" |
| Ràng buộc then chốt | Độ trễ, chi phí, phân quyền, dữ liệu, năng lực mô hình và thời hạn bàn giao | "Yêu cầu tính sẵn sàng cao" |
| Lựa chọn giải pháp | Các phương án ứng viên, lý do chọn phương án hiện tại và các đánh đổi đã biết | "Sau khi khảo sát đã chọn framework X" |
| Bằng chứng chất lượng | Tập dữ liệu, định nghĩa chỉ số, baseline đối chuẩn, quy mô mẫu và phiên bản đánh giá | "Độ chính xác tăng 30%" |
| Ca lỗi thực tế (Badcase) | Input đầu vào, Trace, nguyên nhân gốc rễ, phương án sửa đổi và test case hồi quy | "Tối ưu lại Prompt là giải quyết xong" |
| Vị trí bằng chứng | Class mã nguồn, test case, Trace, tập dữ liệu hoặc commit Git | "Trong code có triển khai" |

Nếu ô nào chưa có số liệu hoặc tư liệu thực tế, hãy tạm thời để trống. Tuyệt đối không được bịa đặt các con số về QPS, tỷ lệ chính xác hay số lượng nhân lực tiết kiệm được. Khi người phỏng vấn truy vấn về phương pháp thống kê, mốc thời gian và baseline so sánh, những số liệu bịa đặt sẽ bị bóc trần rất nhanh chóng.

Đối với những dự án cá nhân chưa từng đưa lên production, bạn hoàn toàn có thể cung cấp các bằng chứng đáng tin cậy: bộ test suite cố định, Trace có khả năng tái hiện lỗi, bảng phân loại lỗi, kết quả stress test và các đánh đổi thiết kế. Điều cốt lõi là phải nói rõ "đây là kết quả thực nghiệm offline", không được phép đóng gói nó thành dữ liệu môi trường production.

Giai đoạn hiện tại của dự án cũng cần được làm rõ từ đầu: chạy thông Demo, hoàn thành đánh giá offline, thử nghiệm pilot lưu lượng nhỏ và vận hành production chính thức là những cấp độ hoàn toàn khác nhau. Khi chưa có người dùng thật, bạn có thể nói về tập test set và kỹ thuật chọc thủng lỗi (fault injection); khi chưa từng có sự cố production, bạn có thể nói về các rủi ro được phát hiện trong khâu phản biện thiết kế và các kịch bản dự phòng sự cố, nhưng tuyệt đối không được đánh lừa người nghe bằng cách biến chúng thành Badcase trên production.

Trách nhiệm cá nhân có thể tách bạch mạch lạc bằng một câu: cả team đã hoàn thành mục tiêu tổng thể gì, bản thân tôi trực tiếp phụ trách phân đoạn nào, đã tự tay đưa ra quyết định hay xử lý sự cố gì, và những phần việc nào do các thành viên khác đảm nhận. Cách nói này đáng tin cậy hơn rất nhiều so với câu "tôi phụ trách toàn bộ dự án Agent", đồng thời giúp bạn giữ vững ranh giới chuyên môn trong suốt buổi phỏng vấn.

## Làm thế nào để dùng một case study cụ thể giải thích rõ dự án Agent?

Giả sử dự án của chúng ta là một **Agent xử lý phiếu hỗ trợ (ticket) hậu mãi thông minh**. Người dùng mô tả sự cố bằng ngôn ngữ tự nhiên, hệ thống sẽ tra cứu đơn hàng, truy xuất chính sách hậu mãi tương ứng, nhận diện những thông tin còn thiếu, và sau khi người dùng xác nhận sẽ tiến hành tạo ticket hậu mãi trên hệ thống.

Ở đây chúng ta cố tình đưa vào ba nhóm năng lực kỹ thuật:

- Truy xuất chính sách hậu mãi: thuộc phạm vi **RAG**;
- Tra cứu đơn hàng, tạo ticket: thuộc phạm vi **gọi công cụ (Tool Calling)**;
- Dựa trên thông tin hiện tại để quyết định tiếp tục truy vấn, hỏi lại người dùng hay kết thúc: thuộc phạm vi **ra quyết định của Agent**.

Trong đó, thao tác "tạo ticket" sẽ làm thay đổi trạng thái bên ngoài (state mutation), do đó tuyệt đối không thể chỉ trông chờ vào việc mô hình trả về một chuỗi JSON hợp lệ. Kiểm tra phân quyền, người dùng xác nhận, kiểm soát tính lũy nghiệm (idempotency) và xác thực kết quả thực thi bắt buộc phải do hệ thống nghiệp vụ phía sau đảm nhiệm.

Vòng lặp Agent Loop trong dự án có thể áp dụng mô hình thực thi ReAct: mô hình đưa ra hành động tiếp theo, sau khi nhận được Observation trả về từ môi trường mới tiếp tục quyết định gọi công cụ khác hay kết thúc tác vụ.

ReAct mang ý nghĩa là hành động và quan sát đan xen tịnh tiến, chứ không phải hễ gọi công cụ một lần là đã hoàn thành thiết kế Agent. Trace ghi nhận trên production chỉ cần ghi lại hành động, kết quả công cụ, tóm tắt trạng thái và căn cứ kiểm chứng, hoàn toàn không cần lưu lại chuỗi suy nghĩ nội tâm (chain-of-thought) riêng tư của mô hình.

### Phiên bản 30 giây trình bày thế nào?

Phiên bản 30 giây chỉ cần trả lời 4 ý: dự án là gì, tại sao cần Agent, bạn phụ trách phần nào và bài toán kỹ thuật khó nhất là gì.

Vẫn lấy ví dụ về Agent xử lý ticket hậu mãi thông minh:

> Tôi đã xây dựng một Agent xử lý ticket hậu mãi thông minh. Ngoài việc hỏi đáp tri thức, hệ thống còn dựa vào mô tả của khách hàng để tra cứu đơn hàng động, truy xuất chính sách hậu mãi, thu thập thông tin còn thiếu và tạo ticket sau khi người dùng xác nhận. Về kiến trúc, hệ thống kết hợp giữa Workflow cố định và Agent Loop cục bộ: xác thực, kiểm tra quyền, người dùng xác nhận và ghi dữ liệu là các node xác định, mô hình chỉ đảm nhận việc hiểu ý định, bổ sung thông tin và lựa chọn công cụ tiếp theo.
>
> Tôi chịu trách nhiệm chính về điều phối Agent, quản trị công cụ và xây dựng hệ thống đánh giá. Hai vấn đề kỹ thuật điển hình nhất trong dự án là việc chọn nhầm giữa các công cụ tương đồng và tình trạng mất dấu trạng thái khi API ghi dữ liệu bị timeout, chúng tôi đã xử lý dứt điểm lần lượt bằng chuẩn hóa hợp đồng công cụ và cơ chế "idempotency key + truy vấn trạng thái + đối soát định kỳ".

Tuyệt đối không đi vào chi tiết vụn vặt ở bước này. Nước đi khôn ngoan là chủ động để lại những đầu mối gợi mở mà bạn đã chuẩn bị kỹ: tại sao lại dùng kiến trúc lai (hybrid), công cụ được quản trị thế nào, tại sao thao tác ghi không được retry mù quáng, và việc đánh giá thực hiện ra sao.

### Phiên bản 3 phút triển khai ra sao?

Phiên bản 3 phút có thể trình bày theo trình tự chuẩn sau:

1. Vấn đề nghiệp vụ và tiêu chuẩn thành công đo lường được;
2. Chuỗi xử lý hoàn chỉnh của một request;
3. Hai quyết định kỹ thuật then chốt kèm đánh đổi;
4. Một ca lỗi thực tế (Badcase) mang tính đại diện nhất;
5. Kết quả đạt được và ranh giới trách nhiệm của bản thân.

Tránh việc liệt kê danh sách công nghệ theo kiểu "Spring AI, Redis, Milvus, MCP...". Công nghệ chỉ nên xuất hiện gắn liền với các quyết định kỹ thuật cụ thể, không nên tách thành một đoạn riêng để khoe danh từ.

## Làm thế nào để giải thích kiến trúc hệ thống thông qua một request?

Nói "chúng tôi áp dụng kiến trúc phân tầng" là rất trừu tượng. Khi phỏng vấn, bạn nên dẫn dắt người phỏng vấn đi hết vòng đời của một request trước, sau đó mới quay lại giải thích trách nhiệm của từng tầng.

![Kiến trúc cốt lõi AI Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-core-arch-dc0d3123.png)

Lấy ví dụ người dùng nói: "Tai nghe trong đơn hàng này của tôi bị hỏng rồi, hãy giúp tôi tạo yêu cầu bảo hành", một request sẽ luân chuyển qua các bước:

1. **Tầng tiếp nhận (Ingress Layer):** Thực hiện xác thực người dùng, nhận diện tenant, giới hạn tần suất (rate limiting) và sinh mã định danh `requestId` cùng `runId`.
2. **Tầng điều phối (Orchestration Layer):** Đọc trạng thái tác vụ hiện tại, kiểm tra xem các thông tin bắt buộc như mã đơn hàng đã có hay chưa.
3. **Quyết định của Agent:** Dựa trên các công cụ khả dụng và ngữ cảnh, Agent lựa chọn công cụ tra cứu đơn hàng. Tầng thực thi nghiệp vụ kiểm tra lại xem người dùng hiện tại có quyền xem đơn hàng này không.
4. **Nạp ngữ cảnh RAG:** Hệ thống dựa vào loại sản phẩm, ngày mua và loại sự cố để truy xuất chính sách hậu mãi tương ứng, sau đó nạp bằng chứng vào ngữ cảnh của lượt này.
5. **Điền thông tin / Soạn thảo:** Nếu thông tin chưa đủ, Agent hỏi lại người dùng; nếu điều kiện đã thỏa mãn, Agent sinh bản thảo cấu trúc của ticket cần tạo.
6. **Xác nhận người dùng (HITL):** Trước khi thực thi thao tác ghi dữ liệu, hệ thống hiển thị các trường thông tin quan trọng để người dùng xác nhận. Sau khi người dùng xác nhận, hệ thống mới kiểm tra quyền, quy tắc nghiệp vụ và khóa lũy nghiệm (idempotency key).
7. **Thực thi & Ghi nhận trạng thái:** Sau khi service ticket trả về kết quả, hệ thống không chỉ tin vào chuỗi chữ "thành công" do mô hình nói, mà phải lưu lại mã ticket nghiệp vụ chính thức và trạng thái cuối cùng vào cơ sở dữ liệu.
8. **Ghi log & Quản trị:** Ghi nhận toàn bộ lệnh gọi mô hình, Prompt, kết quả truy xuất, công cụ, xác nhận phê duyệt, thời gian xử lý và kết quả để phục vụ đánh giá và phát lại (replay) Badcase sau này.

Ánh xạ vào các tầng kiến trúc hệ thống, ta có thể cô đọng thành 7 tầng logic sau:

| Tầng | Trách nhiệm chính | Phần việc tuyệt đối KHÔNG ĐƯỢC giao cho mô hình |
| ---- | ----------------- | ----------------------------------------------- |
| Tầng tiếp nhận (Ingress) | Xác thực, tenant, rate limit, kết nối streaming, mã định danh request | Ranh giới danh tính và cô lập tenant |
| Tầng điều phối (Orchestration) | Workflow, Graph, Agent Loop, điều kiện dừng | Ngân sách timeout, số bước tối đa, rẽ nhánh bắt buộc |
| Tầng mô hình (Model) | Định tuyến mô hình, Prompt, Structured Output | Chuyển mạch dự phòng (fallback) nhà cung cấp và giới hạn cứng chi phí Token |
| Tầng ngữ cảnh (Context) | RAG, lịch sử hội thoại, Memory, cắt gọt ngữ cảnh | Quyền truy cập dữ liệu và kiểm chứng nguồn gốc sự thật |
| Tầng công cụ (Tool) | Khám phá công cụ, kiểm tra Schema tham số, thực thi và trả kết quả | Ràng buộc bất biến nghiệp vụ, phân quyền, giao dịch (transaction) và tính lũy nghiệm |
| Tầng trạng thái (State) | Trạng thái tác vụ, checkpoint, sản phẩm nghiệp vụ và bộ nhớ | Tính nhất quán của trạng thái nghiệp vụ có thẩm quyền |
| Tầng quản trị (Governance) | Trace, đánh giá, kiểm toán (audit), cảnh báo, Canary và Rollback | Cổng kiểm soát phát hành và phê duyệt hành động rủi ro cao |

Nếu dự án của bạn không có nhiều service độc lập như vậy, tuyệt đối đừng gượng ép nói thành 7 microservice. Ở đây đang mô tả trách nhiệm logic; trong giai đoạn đầu, hoàn toàn có thể đặt chung trong cùng một ứng dụng. Người phỏng vấn quan tâm đến việc ranh giới trách nhiệm có rõ ràng hay không, chứ không phải số lượng service có nhiều hay không.

## Khi lựa chọn công nghệ cho dự án Agent cần trả lời những câu hỏi nào?

Năm câu hỏi đầu tiên dùng để biện minh cho từng lựa chọn, câu hỏi thứ sáu quyết định phương án có đứng vững trước các thay đổi thực tế hay không:

1. Ràng buộc nghiệp vụ tại thời điểm đó là gì?
2. Đã so sánh những phương án ứng viên nào?
3. Tại sao phương án hiện tại lại phù hợp hơn?
4. Phương án này phải hy sinh điều gì, và kiểm soát cái giá phải trả đó ra sao?
5. Dùng số liệu đánh giá hoặc dữ liệu vận hành nào để kiểm chứng?
6. Nếu các ràng buộc thay đổi, trong trường hợp nào bạn sẽ đổi sang phương án khác?

### Tại sao lại dùng Agent mà không dùng Workflow thông thường?

Một Workflow cố định hoàn toàn có thể đọc trạng thái trung gian, rẽ nhánh điều kiện và cũng có thể chứa một Agent bên trong một node nào đó. Khi đưa ra quyết định, bạn cần làm rõ bước đi tiếp theo thực chất do mã nguồn định sẵn hay do quy tắc đồ thị kiểm soát, hay do mô hình tự phán đoán hành động, công cụ và lộ trình ngay tại thời điểm runtime.

Trong trường hợp hậu mãi của chúng ta, các khâu xác thực, người dùng xác nhận, ghi dữ liệu ticket và kiểm toán đều có thể xác định từ trước, do đó bắt buộc phải đưa vào Workflow cố định. Ngược lại, người dùng có thể chỉ nói cộc lốc "bị hỏng rồi", nhưng cũng có thể cung cấp ngay mã đơn hàng, ảnh chụp lỗi và các bước tự xử lý đã thử; nếu các nhánh xử lý khó có thể liệt kê vét cạn bằng các quy tắc tĩnh, và thực nghiệm đánh giá chứng minh việc để mô hình tự quyết định thực sự mang lại tỷ lệ hoàn thành cao hơn, thì đoạn xử lý tra cứu đơn hàng, tìm kiếm chính sách hay tiếp tục hỏi lại người dùng mới thực sự thích hợp để giao cho Agent.

Ngược lại, nếu loại ticket, các trường bắt buộc và quy tắc xử lý đều hữu hạn và ổn định, thì mô hình "phân loại ý định + điền form biểu mẫu + quy tắc cố định" đã là quá đủ. Bản thân giao diện ngôn ngữ tự nhiên không bao giờ là lý do chứng minh hệ thống bắt buộc phải dùng Agent tự trị.

Kịch bản này rất thích hợp để áp dụng kiến trúc lai (hybrid):

> Dùng Workflow xác định để cố định ranh giới an toàn, và chỉ nhúng Agent Loop vào những phân đoạn cục bộ có đường đi không cố định.

Về sự khác biệt chi tiết giữa Workflow, Graph và Loop, bạn có thể xem thêm bài viết [Workflow, Graph và Loop trong AI Workflow](../agent/workflow-graph-loop.md).

### Tại sao nên bắt đầu bằng Agent đơn lẻ trước khi vội vã lên Multi-Agent?

Một Agent đơn lẻ có trạng thái gọn gàng hơn, chuỗi Trace ngắn hơn và thông thường cũng dễ đánh giá hơn rất nhiều. Sở hữu nhiều công cụ không đồng nghĩa với việc bắt buộc phải chia thành nhiều Agent. Trước khi nghĩ đến việc chia tách, hãy thử:

- Lọc và nạp công cụ động theo ngữ cảnh tình huống;
- Gộp các công cụ có chức năng trùng lặp;
- Viết lại tên gọi, mô tả (`description`) và Schema tham số thật rõ ràng;
- Dùng mã nguồn định tuyến cho các phân loại có ranh giới rõ ràng;
- Cô lập các vùng ngữ cảnh con cho những tác vụ phức tạp.

Chỉ khi tác vụ có thể phân rã hoàn toàn độc lập, và các vai trò khác nhau đòi hỏi lượng ngữ cảnh chuyên biệt lớn, quyền hạn công cụ khác biệt rõ rệt hoặc do các nhóm kỹ sư khác nhau chịu trách nhiệm bảo trì, thì lợi ích do Multi-Agent mang lại mới có thể bù đắp được chi phí giao tiếp, độ trễ, chi phí Token và sự phức tạp khi debug.

Multi-Agent cũng không có nghĩa là thực thi song song. Nó có thể chạy theo thứ tự tuần tự cố định, có thể chạy song song ở các nhánh không phụ thuộc, có thể do một Manager ủy quyền động, hoặc thực hiện Handoff lượt hội thoại cho một chuyên gia (Specialist).

Khi phỏng vấn, bạn cần giải thích rõ: cấu trúc liên kết do code cố định hay do mô hình quyết định, ngữ cảnh là dùng chung hay cô lập, hợp đồng kết quả trao đổi giữa các Agent ra sao, xử lý lỗi cục bộ và xung đột ghi đồng thời thế nào, và cuối cùng ai là người chịu trách nhiệm cho kết quả sau cùng.

Tổng hợp chuyên sâu về các vấn đề Multi-Agent có thể tham khảo bài viết [Thiết kế hệ thống cộng tác Multi-Agent](../agent/multi-agent.md).

### Phân biệt RAG, Memory, Context và State như thế nào?

Bốn khái niệm này rất hay bị đánh đồng lẫn lộn trong phần giới thiệu dự án.

Bảng dưới đây là quy chuẩn kỹ thuật được áp dụng trong case study hậu mãi của bài viết này:

| Khái niệm | Nội dung cụ thể trong case hậu mãi | Câu hỏi cốt lõi mà nó trả lời |
| --------- | ---------------------------------- | ----------------------------- |
| RAG | Chính sách bảo hành, sổ tay sản phẩm, danh sách trạm bảo hành | Trong tri thức bên ngoài có những bằng chứng liên quan nào? |
| Memory | Sở thích người dùng, thông tin đã xác thực được phép lưu trữ lâu dài | Cần ghi nhớ điều gì xuyên suốt các lượt hoặc qua nhiều phiên hội thoại? |
| Context | Chỉ dẫn, bằng chứng, công cụ và lịch sử hội thoại thực tế gửi cho mô hình trong lượt này | Mô hình có thể nhìn thấy những gì trong lượt gọi cụ thể này? |
| State | Mã đơn hàng hiện tại, các trường còn thiếu, trạng thái phê duyệt, hành động đã thực hiện, mã ticket | Tác vụ nghiệp vụ hiện đã tiến hành đến bước nào rồi? |

Trong một số framework, Memory ngắn hạn vốn là một phần của Agent State, và Checkpoint cũng có thể lưu trữ snapshot của State tại một thời điểm. Tên gọi có thể khác nhau tùy thư viện, nhưng ranh giới thì tuyệt đối không được nhầm lẫn: Memory, Agent State và Checkpoint của Workflow đều không thể thay thế cơ sở dữ liệu nghiệp vụ có thẩm quyền. Việc chỉ dựa vào lịch sử chat để xác định "ticket đã được tạo hay chưa" là một thiết kế vô cùng nguy hiểm.

Nguyên lý chi tiết xem thêm tại [Thực tiễn Context Engineering](../agent/context-engineering.md) và [Hệ thống bộ nhớ AI Agent](../agent/agent-memory.md).

Nếu dự án thực sự dùng Memory dài hạn, bạn phải trả lời được: thông tin nào được phép ghi, ai xác nhận tính đúng đắn, lưu trữ trong bao lâu (TTL), người dùng xem và xóa bằng cách nào, và khi bị tiêm nhiễm nội dung độc hại thì dọn dẹp ra sao. Nếu chỉ lưu vài lượt Chat History, hãy gọi thẳng là lịch sử hội thoại, đừng đánh bóng thành hệ thống bộ nhớ dài hạn.

Phần RAG cũng không thể chỉ dừng lại ở câu "có kết nối với Vector Database". Bạn tối thiểu phải nắm chắc tài liệu được parse và chunking thế nào, chỉ mục cập nhật ra sao, kết hợp tìm kiếm từ khóa và vector thế nào, có dùng Reranker không, chọn Top-K ra sao, ACL phân quyền có hiệu lực ở khâu nào, và trích dẫn cùng phiên bản tri thức được lưu vết ra sao. Khi đánh giá, bắt buộc phải tách riêng khâu truy xuất và khâu sinh câu trả lời để biết chính xác lỗi nằm ở đâu.

### Function Calling, MCP và Agent phân chia trách nhiệm ra sao?

Function Calling cho phép mô hình dùng các tham số cấu trúc hóa để thể hiện "nó muốn gọi hàm nào"; MCP chịu trách nhiệm chuẩn hóa việc trao đổi ngữ cảnh, tài nguyên và công cụ giữa Host, Client và Server; còn Agent chịu trách nhiệm kết hợp mục tiêu và trạng thái để quyết định bước tiếp theo nên làm gì.

Chúng nằm ở các tầng kiến trúc hoàn toàn khác nhau và không thể thay thế lẫn nhau.

Nếu các công cụ chỉ phục vụ cho một ứng dụng nội bộ duy nhất, việc đăng ký các hàm cục bộ (local function) thông thường sẽ đơn giản và hiệu quả hơn nhiều. Chỉ khi một tập năng lực cần được tái sử dụng bởi nhiều Agent, IDE hoặc client khác nhau, ta mới nên cân nhắc áp dụng MCP. Ngay cả khi dùng MCP, cơ chế phân quyền, kiểm tra tham số và kiểm soát tác dụng phụ (side-effects) vẫn bắt buộc phải do tầng nghiệp vụ phía backend thực thi.

![Chuỗi gọi hoàn chỉnh của Function Calling: Mô hình sinh ý định gọi, phía nghiệp vụ thực thi công cụ](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/structured-output-function-calling-function-call-38a32aa6.png)

Phần này rất hay bị đào sâu, khuyến nghị bạn nên ôn tập phối hợp cùng [Structured Output của LLM](../llm-basis/structured-output-function-calling.md) và [Giao thức MCP](../agent/mcp.md).

### Lựa chọn mô hình dựa trên những tiêu chí nào?

Đừng bao giờ lấy lý do "mô hình X đạt điểm benchmark cao nhất" làm căn cứ duy nhất. Việc chọn mô hình tối thiểu phải đồng thời xem xét ma trận các yếu tố:

- Tỷ lệ hoàn thành tác vụ trên tập dữ liệu đánh giá nghiệp vụ của bạn;
- Khả năng chọn đúng công cụ và điền tham số chính xác;
- Tính ổn định trong ngữ cảnh dài hoặc hội thoại nhiều lượt;
- Độ trễ Token đầu tiên (TTFT) và tổng thời gian phản hồi;
- Chi phí Token đầu vào, đầu ra và chi phí Prompt Caching;
- Mức độ hỗ trợ các tính năng như Structured Output (JSON Schema), Function Calling và đa phương thức;
- Tuân thủ an toàn dữ liệu, vị trí địa lý của máy chủ và SLA sẵn sàng của nhà cung cấp.

Cách tiếp cận kỹ thuật an toàn nhất là trước tiên dùng một mô hình flagship hàng đầu để thiết lập trần chất lượng (quality baseline), sau đó thử nghiệm từng bước thay thế các mô hình nhỏ hơn, rẻ hơn vào từng node tác vụ cụ thể. Việc phân loại ý định, trích xuất thực thể đơn giản và chuyển đổi định dạng không nhất thiết cần đến mô hình mạnh nhất; nhưng khâu lập kế hoạch, suy luận đa bước phức tạp và tổng hợp thông tin cuối cùng thường đòi hỏi mô hình có năng lực tư duy cao. Mỗi lần thay thế mô hình đều phải chạy lại cùng một tập Golden Set, tuyệt đối không kết luận cảm tính chỉ qua vài lần chat thử nghiệm thủ công.

### Tại sao lại cần đưa vào Model Gateway?

Khi dự án mới chỉ kết nối một mô hình duy nhất và đang trong giai đoạn chứng minh ý tưởng (PoC), việc gọi trực tiếp API của nhà cung cấp là hoàn toàn bình thường. Khi số lượng nhà cung cấp tăng lên, hoặc có nhiều service nội bộ cùng dùng chung tài nguyên mô hình, Model Gateway sẽ là thành phần bắt buộc để xử lý tập trung việc xác thực, định tuyến mô hình, hạn ngạch rate limit, retry, fallback, phân bổ chi phí (cost attribution) và ghi log kiểm toán.

Thiết kế chi tiết xem thêm tại [Phân tích chi tiết Model Gateway](../system-design/llm-gateway.md).

### Đâu là năng lực của Framework, đâu là phần dự án tự triển khai?

Khi nhắc đến các framework trong phỏng vấn, tốt nhất bạn nên nêu rõ phiên bản và ranh giới năng lực của chúng. Việc framework giúp bạn chạy thông vòng lặp Tool Loop không có nghĩa là nó đã tự động xử lý trạng thái nghiệp vụ, phân quyền, tính lũy nghiệm và kiểm toán cho dự án của bạn.

Lấy ví dụ các phiên bản được đối chuẩn trong tài liệu này: Trong Spring AI 2.0.0, `ToolCallingAdvisor` và `ToolCallingManager` quản lý vòng lặp gọi công cụ, `ToolCallbackResolver` có thể phân giải công cụ động; tuy nhiên, việc một người dùng cụ thể có được phép hoàn tiền hay không, có cần quản lý phê duyệt hay không, hoàn toàn do code nghiệp vụ tự phán đoán. Trong AgentScope Java 2.0.1, `AgentStateStore` có thể lưu trạng thái phiên của Agent, nhưng nó không phải là database đơn hàng hay Checkpoint nghiệp vụ của Workflow; hàm `streamEvents()` cung cấp luồng sự kiện runtime, nhưng không đồng nghĩa với việc hệ thống đã lưu trữ một pipeline phân tán Trace hoàn chỉnh.

Nếu dự án của bạn dùng phiên bản khác, hãy đối chiếu lại API thực tế. Khi trả lời phỏng vấn, bạn nên tách bạch rõ ràng thành hai câu: "Framework đã cung cấp sẵn những gì" và "Chúng tôi đã tự xây dựng thêm những thành phần nào bên ngoài framework", tránh vơ hết năng lực mặc định của thư viện thành thiết kế kiến trúc của chính mình.

## Tại sao việc gọi công cụ không thể chỉ nhìn vào đầu ra của mô hình?

Mô hình trả về tham số hợp lệ về mặt cú pháp chỉ chứng minh nó đã vượt qua kiểm tra định dạng Schema, hoàn toàn không có nghĩa là hành động đó được phép bấm nút thực thi.

Một chuỗi thực thi công cụ hoàn chỉnh cấp production tối thiểu phải đi qua các lớp kiểm soát phòng thủ sau:

1. **Kiểm tra Schema (Schema Validation):** Kiểm tra kiểu dữ liệu các trường, enum, định dạng regex và các trường bắt buộc.
2. **Kiểm tra nghiệp vụ (Business Rule Validation):** Kiểm tra trạng thái đơn hàng, thời hạn hậu mãi và tính hợp lệ của tổ hợp các trường dữ liệu theo quy tắc nghiệp vụ.
3. **Danh tính & Quyền hạn (Identity & Permissions):** Xác nhận người dùng hiện tại có thẩm quyền thao tác trên tài nguyên mục tiêu hay không.
4. **Phân cấp rủi ro (Risk Categorization):** Định nghĩa chiến lược thực thi khác nhau cho các hành động chỉ đọc, ghi có thể hoàn tác và ghi không thể hoàn tác.
5. **Xác nhận từ con người (HITL Confirmation):** Dựa vào cấp độ rủi ro để quyết định có cần hiển thị tham số cuối cùng và chờ người dùng bấm xác nhận hay không.
6. **Kiểm soát lũy nghiệm (Idempotency Control):** Ngăn ngừa việc retry mạng hoặc người dùng click nhiều lần tạo ra các tác dụng phụ trùng lặp.
7. **Xác thực kết quả (Execution Verification):** Kiểm tra trạng thái cuối cùng của hệ thống bên ngoài có đúng với kỳ vọng hay không.
8. **Nhật ký kiểm toán (Audit Logging):** Ghi lại bất biến ai, vào thời điểm nào, với tham số gì, đã thực hiện hành động nào.

![Phân tầng rủi ro an toàn khi gọi công cụ: Khớp chiến lược kiểm soát theo cấp độ rủi ro](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/structured-output-function-calling-tool-call-sec-036eb7f8.png)

Bảng phân cấp rủi ro công cụ thực tế:

| Cấp độ | Ví dụ cụ thể | Chiến lược kiểm soát khuyến nghị |
| ------ | ------------ | -------------------------------- |
| Rủi ro thấp (Chỉ đọc) | Tra cứu chính sách chung, xem đơn hàng của chính mình | Kiểm tra quyền, giới hạn tham số, timeout và ghi audit log |
| Rủi ro trung bình (Ghi có thể hoàn tác) | Tạo bản nháp ticket, gắn tag phân loại | Lũy nghiệm, xác thực kết quả, cung cấp lối hoàn tác (undo) |
| Rủi ro cao (Ghi không thể hoàn tác) | Hoàn tiền, hủy đơn hàng, gửi thông báo cho khách | Bắt buộc xác nhận rõ ràng, giới hạn hạn ngạch, phê duyệt hoặc chuyển giao người thật |
| Nghiêm cấm tự động thực thi | Vượt quá phạm vi ủy quyền hoặc hành động không thể bồi hoàn | Từ chối thực thi thẳng thừng, chỉ cung cấp giải thích và cổng chuyển tiếp nhân viên |

Bản thân phần mô tả (`description`) của công cụ cũng phải đưa vào đánh giá. Tên gọi mơ hồ, chức năng chồng chéo, dữ liệu trả về quá dài đều sẽ khiến Agent chọn nhầm công cụ hoặc làm ô nhiễm Context của mô hình.

Kết quả trả về từ công cụ, tài liệu RAG, trang web cào về và mô tả MCP Server đều có thể bị cài cắm Prompt Injection gián tiếp. Khi chúng được đưa vào Context của lượt tiếp theo, chúng vẫn là dữ liệu không đáng tin cậy từ phía người dùng, tuyệt đối không được phép làm thay đổi danh tính máy chủ, quyền tài nguyên hay cấp độ rủi ro của công cụ. Mô hình đe dọa an toàn toàn diện xem thêm tại [Thực chiến an toàn bảo mật LLM/Agent](../system-design/llm-security.md).

## Thiết kế tính ổn định cho dự án Agent như thế nào?

### Tại sao Timeout không thể trực tiếp coi là thực thi thất bại?

Khi người phỏng vấn hỏi "Khi mô hình hoặc công cụ bị timeout thì xử lý thế nào?", phản xạ đầu tiên của nhiều người là "Thì retry vài lần là xong". Nếu người phỏng vấn hỏi tiếp "Thế nếu thao tác ghi bên phía server đã thực thi thành công rồi, nhưng response trả về bị rớt mạng thì sao?", câu trả lời cũ sẽ lập tức bị bế tắc.

Lúc này, nếu cứ thế retry mù quáng theo tham số ban đầu, hệ thống có thể tạo ra hai ticket trùng lặp hoặc hoàn tiền hai lần cho khách hàng.

Vấn đề nằm ở sự hiểu sai bản chất của Timeout. Timeout chỉ nói lên rằng phía gọi không nhận được kết quả trong thời hạn quy định; còn phía server có thể đang ở một trong ba trạng thái: request chưa hề tới nơi, đang trong quá trình thực thi, hoặc đã thực thi xong xuôi nhưng gói tin response bị rơi mất trên đường truyền mạng. Phía gọi không thể phân biệt được ba trạng thái này, do đó tuyệt đối không thể đánh đồng Timeout với thất bại.

Với các API tra cứu chỉ đọc thì rất đơn giản, đọc dữ liệu không gây tác dụng phụ, nên hoàn toàn có thể retry có kiểm soát trong tổng ngân sách thời gian cho các lỗi mạng tạm thời. Nhưng thao tác ghi thì không thể làm vậy: tạo ticket, hoàn tiền mà retry mù quáng chắc chắn sẽ gây ra tác dụng phụ trùng lặp tai hại.

Giải pháp kiến trúc vững chắc bao gồm:

1. Khi khởi tạo một hành động logic, sinh ra một mã định danh duy nhất ổn định `actionId`, và dùng nó gắn vào khóa lũy nghiệm nghiệp vụ; mã này được tái sử dụng xuyên suốt qua các lần SDK retry, gửi lại message và thao tác khôi phục thủ công; chỉ khi có hành động nghiệp vụ hoàn toàn mới mới sinh mã mới;
2. Phía service tiếp nhận sử dụng ràng buộc duy nhất (unique constraint) trong database hoặc bảng ghi nhận lũy nghiệm để chặn các request trùng lặp;
3. Nếu cùng một khóa lũy nghiệm nhưng gửi kèm tham số khác nhau, hệ thống bắt buộc phải từ chối thẳng thừng với mã lỗi client, tuyệt đối không được âm thầm trả về kết quả của lần gọi đầu tiên;
4. Sau khi bị Timeout, trước tiên dùng khóa lũy nghiệm để truy vấn lại trạng thái thực thi thực tế;
5. Nếu trạng thái vẫn chưa thể xác định rõ ràng, đưa vào quy trình đối soát bất đồng bộ hoặc chuyển cho nhân viên xử lý, thay vì tiếp tục retry vô tận;
6. Ghi nhận mã ID nghiệp vụ chính thức cuối cùng vào State của tác vụ và nhật ký kiểm toán.

![Quy trình retry lệnh gọi mô hình và xử lý lũy nghiệm](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-api-engineering-retry-idempotency-329ec34c.webp)

Cơ chế retry còn cần có thuật toán Exponential Backoff, Randomized Jitter, giới hạn số lần tối đa, tổng thời hạn Deadline và ngân sách retry (Retry Budget). SDK mô hình, Gateway, HTTP Client, Tool Adapter và Workflow Node không được phép mỗi bên tự ý retry 3 lần độc lập, nếu không số lượng lệnh gọi sẽ bị nhân lên theo cấp số nhân. Mô hình chuẩn là dùng chung một Deadline và Retry Budget toàn cục, đồng thời ghi nhận số lượt `attempt` trong từng Span của Trace.

Việc phía gọi bị timeout, Future bị cancel hoặc người dùng chủ động ngắt kết nối SSE cũng không có nghĩa là thao tác ghi ở máy chủ phía xa đã dừng lại. Tác dụng phụ vẫn có thể hoàn thành sau đó một vài giây, do đó sau khi hủy kết nối vẫn phải duy trì cơ chế theo dõi khóa lũy nghiệm, truy vấn trạng thái và đối soát. Lỗi sai tham số, lỗi phân quyền và nghiệp vụ từ chối là các lỗi xác định, cần báo thất bại ngay lập tức; chỉ các lỗi tạm thời như Rate Limit hay mạng chập chờn mới được phép retry trong ngân sách cho phép. Chi tiết xem tại [Cơ chế Timeout và Retry](../../high-availability/timeout-and-retry.md) cùng [Tính lũy nghiệm của API](../../high-availability/idempotency.md).

### Mô hình hoặc công cụ liên tục không khả dụng thì giáng cấp (degradation) ra sao?

Retry chỉ giải quyết được các sự cố chớp nhoáng như nghẽn mạng tức thời hay Rate Limit ngắn. Khi nhà cung cấp mô hình bị sập kéo dài, hoặc một công cụ liên tục trả về lỗi 5xx, việc tiếp tục đốt ngân sách retry sẽ chỉ làm kéo dài thời gian chờ đợi của người dùng một cách vô ích. Lúc này cần lập tức ngắt mạch (Circuit Breaker) dependency đang lỗi, ngừng gửi request mới tới đó, và tùy theo mức độ rủi ro của tác vụ để chuyển sang mô hình dự phòng, trả về kết quả từ cache, trả về kết quả một phần hoặc chuyển giao cho nhân viên trực tổng đài.

Trước khi chuyển mạch sang mô hình dự phòng, bắt buộc phải dùng cùng một bộ Golden Set để xác nhận xem mô hình dự phòng có đủ năng lực gánh vác tác vụ đó hay không. Các tác vụ tóm tắt văn bản rủi ro thấp có thể giáng cấp sang mô hình nhỏ hơn, rẻ hơn; tuy nhiên, với các thao tác ghi nhạy cảm như hoàn tiền, thông báo khách hàng, việc năng lực mô hình bị suy giảm có thể dẫn đến việc chọn sai công cụ hoặc sinh sai tham số nghiêm trọng. Các tác vụ dạng này tốt nhất nên tạm dừng thực thi hoặc chuyển giao cho con người, tuyệt đối không được vì muốn duy trì tính sẵn sàng mà âm thầm hạ thấp tiêu chuẩn an toàn.

Việc giáng cấp công cụ cũng phải nhìn vào vai trò của nó trong tác vụ. Nếu công cụ không bắt buộc gặp sự cố, có thể tạm thời loại bỏ nó ra khỏi tập công cụ khả dụng; với những câu hỏi thiếu công cụ đó mà vẫn trả lời được, hãy thông báo rõ ràng cho người dùng về giới hạn hiện tại rồi trả về kết quả một phần; nhưng nếu các dữ liệu cốt lõi như thông tin đơn hàng, quyền hạn hay chính sách bắt buộc không thể lấy được, hệ thống phải dừng việc đưa ra kết luận khẳng định. Hệ thống cũng phải ghi rõ lý do ngắt mạch, lộ trình giáng cấp và kết quả cuối cùng vào Trace để phân biệt rạch ròi giữa "hoàn thành bình thường" và "hoàn thành do giáng cấp".

Khi lưu lượng tăng cao, cần theo dõi sát sao hạn ngạch mô hình, số lượng công cụ chạy đồng thời, Thread Pool, Connection Pool và độ dài hàng đợi. Rate Limit và áp lực ngược (Backpressure) nên đặt càng gần tầng tiếp nhận Ingress càng tốt, các công cụ xử lý chậm phải dùng Bulkhead (vách ngăn cách ly tài nguyên) độc lập để tránh tình trạng một API bên thứ ba bị nghẽn làm treo toàn bộ các luồng Agent Run. Khi các nhánh song song cùng ghi vào State dùng chung, phải định nghĩa trước quy tắc gộp (merge) và giải quyết xung đột.

### Thiết lập ranh giới thoát cho Agent Loop như thế nào?

Khi Agent không thể lấy được thông tin then chốt, nó rất dễ rơi vào vòng lặp vô tận: liên tục tra cứu cùng một mã đơn hàng, hoặc gọi đi gọi lại các công cụ với cùng một bộ tham số. Mô hình thì vẫn đều đặn trả về hành động tiếp theo, nhưng tác vụ thì hoàn toàn giậm chân tại chỗ. Nếu bộ thực thi không chủ động can thiệp ngắt mạch, vòng lặp này sẽ đốt cháy sạch thời gian và chi phí Token của hệ thống.

Khi khởi tạo tác vụ, bộ điều phối phải xác định rõ tổng thời gian Deadline, số lần gọi tối đa cho mô hình và công cụ, cùng ngân sách trần cho Token và chi phí tài chính. Trước mỗi lần chuẩn bị gọi mô hình hoặc công cụ, hệ thống phải kiểm tra xem ngân sách còn lại có đủ không; từng công cụ đơn lẻ cũng phải có cấu hình timeout riêng, tránh việc một lần gọi chậm nuốt chửng toàn bộ thời gian của cả tác vụ.

Ngay cả khi chưa chạm ngưỡng số lần gọi tối đa, Agent vẫn có thể bị kẹt vòng lặp logic. Hệ thống cần so sánh tên công cụ, tham số đã chuẩn hóa và phiên bản State qua các bước liên tiếp. Nếu cùng một hành động lặp đi lặp lại, hoặc thực thi nhiều bước mà State không hề thay đổi, hệ thống sẽ ngắt vòng lặp theo trạng thái "không có tiến triển". Khi gặp các hành động rủi ro cao như hoàn tiền thì lập tức tạm dừng tác vụ, chuyển sang chờ người dùng xác nhận.

Sau khi dừng, hệ thống phải ghi lại lý do cụ thể và căn cứ vào phần việc đã hoàn thành để quyết định trả về kết quả hiện tại hay chuyển giao cho nhân viên. Những phán đoán này bắt buộc phải do framework thực thi hoặc code nghiệp vụ kiểm soát; câu lệnh "chỉ được gọi công cụ tối đa 10 lần" viết trong Prompt chỉ mang tính chất nhắc nhở hành vi, hoàn toàn không thể thay thế cho các giới hạn kỹ thuật của hệ thống.

### Phục hồi tác vụ chạy dài và cơ chế người dùng xác nhận (HITL) ra sao?

Lấy ví dụ về hoàn tiền: sau khi Agent thu thập đủ thông tin, trước khi bấm nút thực thi thật sự cần tạm dừng để chờ người dùng bấm xác nhận. Khách hàng có thể vài tiếng sau mới quay lại bấm xác nhận, hệ thống không thể duy trì tiến trình và trạng thái trong bộ nhớ RAM suốt thời gian đó. Khi tạm dừng, hệ thống phải lưu trữ xuống database mã `runId`, Checkpoint, công cụ đang chờ thực thi, tham số chuẩn hóa, State hiện tại, mã `actionId`, cùng phiên bản Schema của công cụ và phiên bản chính sách.

Khi người dùng bấm xác nhận, hệ thống trước hết kiểm tra danh tính và quyền hạn của người bấm, đồng thời kiểm tra xem lượt xác nhận này đã quá hạn (expired) hay chưa. Sau khi phục hồi tác vụ, hệ thống bắt buộc phải đọc lại trạng thái đơn hàng mới nhất từ database. Nếu trong thời gian chờ đợi, số tiền hoàn, trạng thái đơn hàng, Schema công cụ hay chính sách bảo hành đã bị thay đổi, lượt xác nhận cũ sẽ lập tức bị hủy bỏ, hệ thống sẽ hiển thị lại các tham số mới và yêu cầu người dùng xác nhận lại từ đầu.

Một số workflow engine khi phục hồi sẽ thực thi lại từ điểm bắt đầu của node. Do đó, các node thao tác ghi dữ liệu vẫn phải tái sử dụng cùng một mã `actionId`, tra cứu trạng thái hệ thống bên ngoài trước rồi mới quyết định có ghi tiếp hay không; sự kiện xác nhận cũng chỉ được phép tiêu thụ đúng một lần duy nhất (once-and-only-once). Nhờ vậy, ngay cả khi thao tác phục hồi bị kích hoạt trùng lặp, hệ thống cũng tuyệt đối không bị hoàn tiền hai lần hay tạo trùng ticket.

## Trình bày các chỉ số đo lường của dự án Agent như thế nào?

Khi phỏng vấn, trước hết hãy trình bày xem tác vụ có hoàn thành hay không, sau đó mới bổ sung thêm về quá trình thực thi, chi phí và mức độ an toàn. Một con số "độ chính xác 85%" tách rời khỏi tập test set và phương pháp thống kê sẽ không nói lên được bất cứ điều gì về tính khả dụng thực tế của dự án.

| Câu hỏi cốt lõi cần trả lời | Các chỉ số khả dụng |
| ---------------------------- | ------------------- |
| Tác vụ có hoàn thành không? | Tỷ lệ hoàn thành tác vụ (Task Completion Rate), tỷ lệ đúng của trạng thái nghiệp vụ cuối cùng, tỷ lệ bám sát sự thật có bằng chứng (Factual Groundedness Rate) |
| Quá trình thực thi có chuẩn xác không? | Tỷ lệ chọn đúng công cụ và điền đúng tham số, tỷ lệ gọi công cụ dư thừa, số lần gọi vượt quyền |
| Chi phí có chấp nhận được không? | Độ trễ đầu-cuối P50/P95, số lượt gọi mô hình trên mỗi tác vụ, lượng Token tiêu thụ, chi phí trên mỗi tác vụ |
| Khi thất bại có kiểm soát được không? | Tỷ lệ khôi phục sau sự cố, tỷ lệ chuyển giao con người, số lần phát sinh tác dụng phụ trùng lặp, tỷ lệ chặn nhầm (False Positive) |

Sau khi nêu các chỉ số, bạn cần nói rõ tập test set lấy từ nguồn nào, tiêu chí nào được tính là thành công, cùng một tác vụ được chạy thử nghiệm bao nhiêu lần và đang so sánh đối chuẩn với phiên bản nào. Với các dự án đã chạy thực tế trên production, có thể bổ sung thêm các chỉ số nghiệp vụ như tỷ lệ người dùng tự phục vụ thành công, thời gian xử lý trung bình, kèm theo mốc thời gian thống kê và nhóm đối chứng. Với dự án chưa lên production, hãy tự tin trình bày bộ test set đánh giá offline và bảng phân loại lỗi, đừng đóng gói kết quả thí nghiệm thành số liệu production.

Trong trường hợp hậu mãi, việc ticket có được tạo chuẩn xác hay không thuộc về chỉ số kết quả (**Outcome**); còn việc Agent đã gọi những công cụ nào, tham số có đúng không, có bị vượt quyền hay lặp lại không thì phải soi vào **Trace** để kiểm tra. Các tác vụ mở có thể có nhiều lộ trình thực thi hợp lệ khác nhau; khi đánh giá, trước hết hãy kiểm chứng trạng thái nghiệp vụ sau cùng và các quy tắc an toàn bắt buộc, không nên cứng nhắc đòi hỏi thứ tự thực thi phải trùng khít 100% với một chuỗi Golden Sequence duy nhất.

Một cặp gồm input cố định và điều kiện thành công tạo nên một **Task**, và mỗi lần chạy thử nghiệm là một **Trial**. Đầu ra của LLM mang tính xác suất ngẫu nhiên, nên các tác vụ quan trọng bắt buộc phải chạy lặp lại nhiều Trial. Bộ chấm điểm (Grader) có thể dùng quy tắc mã nguồn, LLM-as-a-Judge hoặc chuyên viên đánh giá thủ công, trong khi **Eval Harness** chịu trách nhiệm chạy các Trial này, lưu vết Trace và tổng hợp kết quả thống kê.

![Quy trình vận hành của Eval Harness từ đọc tập đánh giá đến chấm điểm và tích hợp vào cổng phát hành](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-evaluation-eval-harness-flow-0c25378d.webp)

Phương pháp luận toàn diện xem thêm tại [Hệ thống đánh giá ứng dụng AI](../llm-basis/llm-evaluation.md).

## Mổ xẻ bài học từ Badcase trong dự án Agent như thế nào?

Nếu chỉ nói chung chung "mô hình trả lời sai, sau đó tôi đã tối ưu lại Prompt", bạn sẽ không thể chứng minh được mình đã tìm ra đúng nguyên nhân gốc rễ. Một bài phân tích Badcase đạt chuẩn bắt buộc phải để lại các bằng chứng định vị có khả năng tái hiện được.

Bạn có thể trả lời theo cấu trúc 7 bước mạch lạc sau:

1. **Lưu giữ hiện trường (Forensics):** Lưu lại input nguyên bản của người dùng, phiên bản mô hình và Prompt, toàn bộ nội dung Context, kết quả truy xuất RAG, payload request/response của công cụ và trạng thái của hệ thống bên ngoài tại thời điểm đó.
2. **Mô tả hiện tượng:** Nêu rõ kết quả kỳ vọng, kết quả thực tế và phạm vi ảnh hưởng (blast radius).
3. **Phân tầng giả thuyết:** Lần lượt kiểm tra xem lỗi bắt nguồn từ dữ liệu, khâu truy xuất, lắp ghép ngữ cảnh, suy luận mô hình, tầng thực thi công cụ, logic điều phối hay hệ thống bên thứ ba.
4. **Kiểm soát biến số:** Mỗi lần chỉ thay đổi duy nhất một biến số, tránh việc sửa cùng lúc cả mô hình, Prompt lẫn tham số truy xuất.
5. **Xác nhận nguyên nhân gốc rễ:** Đưa ra bằng chứng có thể tái hiện lỗi một cách ổn định, không dừng lại ở các phán đoán tương quan mơ hồ.
6. **Triển khai khắc phục:** Giải thích rõ giải pháp sửa đổi được đặt ở tầng kiến trúc nào, và tại sao không thể chỉ sửa mỗi Prompt.
7. **Bổ sung test case hồi quy:** Đưa ca lỗi gốc cùng các ca kiểm thử biên lân cận vào bộ test suite hồi quy tự động, sau đó tiếp tục theo dõi các chỉ số vận hành trên production.

Dưới đây là hai ví dụ rất điển hình hay bị người phỏng vấn đào sâu. Khi liên hệ với dự án của chính mình, hãy nói rõ bằng chứng đó thuộc về sự cố production thật, thử nghiệm chọc thủng lỗi offline hay là phương án dự phòng thiết kế. Nếu không có log production thật, tuyệt đối đừng biến thử nghiệm mô phỏng thành sự cố online.

### Tại sao Agent lại chọn nhầm giữa các công cụ tương đồng?

Hệ thống có hai công cụ với tên gọi rất giống nhau: `query_after_sale_policy` dùng để tra cứu chính sách hậu mãi chung, không cần mã đơn hàng cụ thể; `check_after_sale_eligibility` nhận vào mã đơn hàng để kiểm tra xem đơn hàng cụ thể này có đủ điều kiện yêu cầu hậu mãi hay không. Khi người dùng đã cung cấp sẵn mã đơn hàng, đáng lẽ Agent phải gọi công cụ thứ hai, nhưng nó lại liên tục chọn công cụ thứ nhất. Kết quả chính sách chung trả về không hề sai sự thật, nhưng nó hoàn toàn không trả lời được câu hỏi cốt lõi của khách: "Đơn hàng của tôi rốt cuộc có được bảo hành hay không".

Quá trình điều tra phải bắt đầu từ Trace. Nếu mã đơn hàng không hề xuất hiện trong Context của mô hình, chứng tỏ khâu lắp ghép trạng thái bị lỗi; nếu mô hình đã nhìn thấy mã đơn hàng mà vẫn chọn sai, ta mới tiếp tục kiểm tra xem tên gọi, phần mô tả (`description`) và Schema tham số của hai công cụ có điểm nào gây nhầm lẫn hay không. Bằng cách cố định input đầu vào và mỗi lần chỉ thay đổi phần mô tả công cụ, sửa System Prompt hoặc đổi phiên bản mô hình, ta sẽ xác định được chính xác thay đổi nào đã làm lỗi biến mất.

Khi khắc phục, trước hết viết lại thật tường minh ranh giới trách nhiệm và điều kiện tiên quyết (preconditions) của hai công cụ, đồng thời đưa mã đơn hàng vào một đoạn tóm tắt trạng thái ngắn gọn. Nếu quy tắc định tuyến có thể xác định rõ ràng bằng mã nguồn—ví dụ chỉ khi có mã đơn hàng mới được phép kiểm tra đơn hàng cụ thể—hãy dùng code để trực tiếp thu hẹp tập công cụ hiển thị cho mô hình trong lượt đó. Code sẽ lọc bỏ trước những công cụ chưa thỏa mãn điều kiện tiên quyết, giúp các request chưa có mã đơn hàng không bị các chỉ dẫn ưu tiên cứng trong Prompt làm cho đi chệch hướng.

Cuối cùng, gom cả 4 trường hợp: "Có mã đơn hàng", "Không có mã đơn hàng", "Mã đơn hàng không thuộc về người dùng hiện tại" và "Mã đơn hàng sai định dạng" vào cùng một bộ kiểm thử hồi quy. Khi số lượng mẫu đủ lớn, sử dụng ma trận nhầm lẫn (confusion matrix) của công cụ để theo dõi xem hai công cụ này có còn bị chọn nhầm lẫn nhau nữa hay không.

### Tại sao tạo ticket bị Timeout lại sinh ra các bản ghi trùng lặp?

Request tạo ticket lần đầu tiên đã được service ticket ghi nhận và xử lý thành công trong cơ sở dữ liệu, nhưng khi trả gói tin response về thì đường truyền mạng bị timeout. Tầng thực thi của Agent chỉ ghi nhận được mã lỗi timeout, thế là nó tự động sinh ra một request mới để gọi lại API lần thứ hai. Service ticket không nhận diện được hai request này cùng thuộc về một hành động nghiệp vụ duy nhất, kết quả là đã tạo ra hai chiếc ticket hoàn toàn trùng lặp.

Badcase này phát sinh tại tầng thực thi công cụ. Phía gọi đã đánh đồng Timeout với thất bại, trong khi API đích lại thiếu cơ chế ràng buộc tính lũy nghiệm. Trên thực tế, Timeout chỉ thể hiện kết quả tạm thời chưa rõ ràng: request lần đầu có thể đã thất bại, có thể đang chạy, nhưng cũng hoàn toàn có thể đã thành công mỹ mãn.

Để khắc phục, ngay khi hành động tạo ticket bắt đầu, hệ thống sinh ra một mã định danh ổn định `actionId`, các lần SDK retry, gửi lại message và khôi phục thủ công sau đó đều tái sử dụng lại mã này. Phía service ticket sử dụng định danh này để tạo bản ghi lũy nghiệm và thiết lập ràng buộc duy nhất (unique constraint) trong database; nếu cùng một `actionId` nhưng gửi kèm tham số khác thì từ chối ngay lập tức, tránh việc âm thầm trả về kết quả cũ không khớp.

Sau khi lệnh gọi bị timeout, tầng thực thi trước hết dùng `actionId` để truy vấn lại trạng thái của request ban đầu. Nếu thấy đã thành công thì điền ngược mã ticket vào hệ thống; nếu xác nhận chắc chắn đã thất bại thì mới cho phép retry theo chính sách; nếu trạng thái vẫn mơ hồ thì đưa vào luồng đối soát hoặc giao cho nhân viên xử lý. Trên Trace cũng phải phân biệt rạch ròi giữa các trạng thái `FAILED`, `TIMED_OUT_UNKNOWN` và `SUCCEEDED`, tuyệt đối không được gộp chung cả ba trường hợp thành lỗi gọi thất bại.

Bộ test hồi quy cần chủ động tạo ra tình huống giả lập: "Phía server đã ghi dữ liệu thành công, nhưng gói tin response bị rơi mất trên đường truyền về", từ đó kiểm chứng xem qua nhiều lần kích hoạt khôi phục, hệ thống cuối cùng có đảm bảo duy nhất chỉ tạo ra một ticket hay không.

## Sử dụng Trace để phục dựng lại quá trình thực thi của Agent như thế nào?

Khi các API truyền thống ném ra ngoại lệ, mã HTTP status và Stack Trace thường chỉ ra ngay vị trí phát sinh lỗi. Nhưng với Agent, ngay cả khi không hề ném ra bất kỳ ngoại lệ nào, nó vẫn có thể đã lấy nhầm tài liệu ở các lượt trước, chọn nhầm công cụ ở giữa chừng, và cuối cùng sinh ra một câu trả lời nghe có vẻ rất hợp lý nhưng thực chất là sai hoàn toàn. Trace phân tán sẽ phục dựng lại toàn bộ hành trình thực thi này theo trục thời gian, ghi nhận chính xác những gì hệ thống đã nhìn thấy, đầu ra đã sinh và hành động đã thực hiện. Nó không lưu chuỗi suy nghĩ nội tâm của mô hình, và cũng không thể chứng minh vì sao mô hình lại đưa ra phán đoán xác suất đó.

Lấy một request xử lý ticket hậu mãi làm ví dụ, Trace có thể được tổ chức ghi nhận theo trình tự sau:

1. **Khi request đi vào hệ thống:** Sinh mã định danh `requestId` và `runId`, liên kết với định danh người dùng và tenant đã được khử nhạy cảm (masking), cùng phiên bản mã nguồn Git, phiên bản Prompt và phiên bản Schema công cụ được sử dụng trong lần chạy này.
2. **Mỗi lần gọi mô hình:** Lưu lại bản tóm tắt input đã khử nhạy cảm cùng output của mô hình, đồng thời ghi nhận số Token tiêu thụ, thời gian xử lý và lý do dừng (finish reason), tránh việc chỉ giữ lại mỗi câu trả lời cuối cùng.
3. **Khi phát sinh thao tác truy xuất RAG:** Ghi nhận câu query tìm kiếm, danh sách ID các Chunk trúng khớp, điểm số tương đồng và đoạn văn bản trích dẫn thực tế được nạp vào mô hình, kèm theo phiên bản của cơ sở tri thức.
4. **Khi gọi công cụ:** Sinh mã `toolCallId`, ghi nhận tóm tắt tham số, phán đoán phân quyền, kết quả thực thi và phân loại mã lỗi. Các lượt retry phải ghi kèm số thứ tự `attempt`, Span cha và tóm tắt khóa lũy nghiệm để thấy rõ một hành động đã được thử lại bao nhiêu lần.
5. **Khi tác vụ kết thúc hoặc tạm dừng:** Ghi nhận sự thay đổi trạng thái, Checkpoint, xác nhận của con người, kết quả Outcome cuối cùng, tổng số lượt gọi, tổng chi phí và lý do giáng cấp (nếu có).

Khi phân tích sự cố, hãy nhìn ngược từ kết quả cuối cùng trở về trước để tìm ra điểm đầu tiên đi chệch khỏi kỳ vọng. Nếu khâu truy xuất lấy nhầm tài liệu, hãy kiểm tra lại khâu Chunking, Recall và Reranker; nếu bằng chứng đã chuẩn xác nhưng Agent lại chọn nhầm công cụ, hãy kiểm tra khâu lắp ghép Context và mô hình; nếu công cụ báo thành công nhưng trạng thái nghiệp vụ không hề suy chuyển, hãy kiểm tra lại Tool Adapter và khâu kiểm chứng kết quả. Nhờ vậy, bạn có thể thu hẹp bài toán "câu trả lời bị sai" vào đúng một lần truy xuất, một lượt gọi mô hình hay một lần thực thi công cụ cụ thể.

Input của mô hình, tham số công cụ và các đoạn văn bản trích dẫn có thể chứa thông tin định danh cá nhân (PII) hoặc bí mật kinh doanh. Trong môi trường production, thông thường chỉ nên lưu trữ bản tóm tắt đã được khử nhạy cảm, kết hợp với chiến lược lấy mẫu (sampling), kiểm soát phân quyền truy cập và quy định thời hạn lưu trữ (TTL). Những trường cần thiết cho việc gỡ lỗi có thể giữ lại, nhưng toàn văn nguyên bản thì không nên mặc định lưu trữ vĩnh viễn.

Hãy dùng **Trace** để phát lại từng request đơn lẻ, dùng **Metrics** để quan sát bức tranh tổng thể về độ trễ và tỷ lệ lỗi theo thời gian, dùng **Audit Log** để kiểm tra ai đã phê duyệt các thao tác hoàn tiền nhạy cảm, và dùng **Eval Record** để so sánh đối chuẩn hiệu năng giữa các phiên bản mô hình hoặc Prompt khác nhau. Log ngoại lệ chi tiết có thể gắn trực tiếp vào Span tương ứng. Tất cả các bản ghi này liên kết chặt chẽ với nhau thông qua chung một mã `runId`, không cần thiết phải nhồi nhét tất cả vào chung một bảng cơ sở dữ liệu khổng lồ.

Việc phân định ranh giới giữa `Session`, `Run`, `Trace`, `Span` và `Attempt`, cơ chế lan truyền ngữ cảnh (context propagation) trong các tác vụ bất đồng bộ, cùng kỹ thuật lấy mẫu và xử lý dữ liệu nhạy cảm được trình bày chi tiết tại [Khả năng quan sát và Trace trong AI](../system-design/ai-observability.md).

## Trước khi đi phỏng vấn cần chuẩn bị những gì?

Đối với mỗi dự án Agent được ghi trong CV, bạn tối thiểu phải chuẩn bị đầy đủ các tư liệu sau:

- Một bản phục dựng dự án hoàn chỉnh theo bảng mẫu;
- Ba phiên bản giới thiệu dự án: 30 giây, 3 phút và 10 phút;
- Một sơ đồ kiến trúc có thể dẫn dắt người nghe từ cổng tiếp nhận Ingress đến kết quả cuối cùng;
- Hai quyết định lựa chọn công nghệ then chốt có phương án ứng viên đối chiếu;
- Hai ca lỗi thực tế (Badcase) với hai nguyên nhân gốc rễ khác nhau, lý tưởng nhất là một lỗi về mặt chất lượng mô hình và một lỗi về mặt kỹ thuật phần mềm;
- Một bảng phân loại tập dữ liệu đánh giá và định nghĩa tường minh các chỉ số đo lường;
- Một chuỗi Trace thực tế mà bạn có thể giải thích vanh vách từng node;
- Phiên bản chính xác của mô hình, framework, giao thức và Schema công cụ đang dùng;
- Những giới hạn kỹ thuật còn tồn đọng rõ ràng của dự án và lộ trình nâng cấp tiếp theo;
- Ranh giới rạch ròi giữa phần việc bản thân trực tiếp phụ trách và phần việc của người khác.

Cuối cùng, hãy dùng bộ câu hỏi dưới đây để tự kiểm tra lại mức độ sẵn sàng của bản thân:

1. Nếu loại bỏ hoàn toàn mô hình ngôn ngữ lớn (LLM), quy trình nghiệp vụ cũ sẽ vận hành ra sao?
2. Tại sao hệ thống này bắt buộc phải là Agent, mà không phải là một chatbot hỏi đáp RAG hay một Workflow cố định?
3. Ranh giới trách nhiệm giữa Model, Tool, Memory, RAG và State nằm ở đâu?
4. Những quyết định nào do mô hình đảm nhận, những quyết định nào bắt buộc phải do mã nguồn kiểm soát chặt chẽ?
5. Các thao tác ghi dữ liệu được phân quyền, xác nhận, đảm bảo lũy nghiệm và kiểm chứng kết quả như thế nào?
6. Làm thế nào để ngăn chặn triệt để vòng lặp vô tận, chi phí phát sinh ngoài tầm kiểm soát và độ trễ tăng vọt?
7. Công thức toán học, quy mô mẫu dữ liệu và baseline so sánh của các chỉ số đo lường là gì?
8. Sự cố nghiêm trọng nhất từng gặp phải được tái hiện lại như thế nào?
9. Sau khi sửa lỗi, làm thế nào để chứng minh rằng bạn không vô tình tạo ra các lỗi hồi quy mới ở những chỗ khác?
10. Nếu lưu lượng truy cập tăng vọt gấp 10 lần, khâu nào trong kiến trúc sẽ là điểm nghẽn đầu tiên bị vỡ trận?
11. Các mã định danh `requestId`, `runId`, `sessionId`, `toolCallId` và `actionId` lần lượt giải quyết những bài toán kỹ thuật gì?
12. Khi tạm dừng để chờ người dùng xác nhận (HITL), trạng thái được lưu trữ bền vững, kiểm tra hết hạn, phục hồi và tái kiểm tra quy tắc nghiệp vụ ra sao?
13. Ranh giới tin cậy (trust boundaries) của tài liệu RAG, kết quả công cụ, MCP Server và Memory dài hạn nằm ở đâu?
14. Những năng lực nào do framework cung cấp sẵn, những cơ chế phân quyền, quản lý trạng thái và độ tin cậy nào là do dự án tự tay phát triển?
15. Trong các kết luận bạn vừa trình bày, những điểm nào đến từ số liệu production thật, điểm nào từ thực nghiệm offline, và điểm nào chỉ là phương án thiết kế trên giấy?

Nếu bạn có thể trả lời trôi chảy tất cả những câu hỏi này dựa trên các bằng chứng thực tế có thể kiểm chứng, phần trình bày dự án của bạn chắc chắn sẽ hoàn toàn vượt trội so với những bài giới thiệu "Demo AI đóng vỏ bề ngoài" thông thường.
