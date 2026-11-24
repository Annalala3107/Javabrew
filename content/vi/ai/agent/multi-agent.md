---
title: "Thiết kế hệ thống đa Agent phối hợp: Phân tách tác vụ, chia sẻ trạng thái, xử lý xung đột và phục hồi sự cố"
description: "Kết hợp các kịch bản như AgentInvest, khảo sát kỹ thuật, chăm sóc khách hàng và review code, làm rõ sự khác biệt giữa đa Agent và Prompt Chain, điều phối, giao tiếp, trạng thái, xung đột, phục hồi và đánh giá."
category: Phát triển ứng dụng AI
tag:
  - AI Agent
  - Multi-Agent
  - Thiết kế hệ thống
head:
  - - meta
    - name: keywords
      content: đa Agent,Multi-Agent,hệ thống cổ phiếu đa agent,AgentInvest,AgentScope Java,ReActAgent,phân tách tác vụ,chia sẻ trạng thái,xử lý xung đột,phục hồi sự cố,A2A
lang: vi
sourceRef: zh-ref/ai/agent/multi-agent.md
---


Khi tôi phát triển AgentInvest - hệ thống phân tích cổ phiếu đa Agent, tôi đã chia sẻ tác vụ cho bốn vai trò đảm nhận. Nhà nghiên cứu (Researcher) trước tiên hoàn thành nghiên cứu cơ bản; chuyên gia phân tích kỹ thuật (Technical Analyst) và chuyên gia phân tích dư luận (Sentiment Analyst) chạy song song để bổ sung góc nhìn; cuối cùng giám đốc đầu tư (Investment Manager) sẽ tổng hợp lại. Bên trong mỗi vai trò sử dụng mẫu ReAct để gọi công cụ, còn pipeline bên ngoài kiểm soát thứ tự, tính đồng thời và các điều kiện thất bại.

Chỉ sau khi các vai trò đi vào hoạt động thực tế, những bài toán kỹ nghệ mới thực sự xuất hiện. Tác vụ con nên chia nhỏ đến mức độ nào, hai Worker có thể đồng thời ghi trạng thái hay không, một nhánh bị timeout thì luồng chính có tiếp tục hay dừng lại... tất cả đều ảnh hưởng trực tiếp đến kết quả cuối cùng. Khi nhà tuyển dụng hỏi sâu về các dự án đa Agent, họ cũng thường lần theo những câu hỏi mang tính thực chiến này.

Bài viết [Khái niệm cốt lõi về AI Agent](./agent-basis.md#multi-agent) đã giới thiệu các mô hình phối hợp như Orchestrator-Subagent, Peer-to-Peer. Bài viết này sẽ tiếp tục đi sâu vào việc khi các mô hình này được đưa vào dự án thực tế, các vấn đề về phân tách tác vụ, quản lý trạng thái, giải quyết xung đột và phục hồi sự cố cần được xử lý như thế nào.

Bên cạnh AgentInvest, bài viết sẽ lồng ghép thêm các ví dụ thực tiễn như khảo sát kỹ thuật, chuyển tiếp chăm sóc khách hàng và review code.

## Đa Agent khác gì với Prompt Chain nhiều giai đoạn?

Prompt Chain quản lý các bước xử lý theo trình tự, trong khi đa Agent (Multi-Agent) quản lý các thực thể thực thi có khả năng hoàn thành độc lập các mục tiêu con. Cả hai có thể cùng xuất hiện đồng thời: tầng ngoài sử dụng một Workflow cố định, còn bên trong mỗi node lại vận hành các Agent riêng biệt của mình.

| Tiêu chí so sánh | Prompt Chain nhiều giai đoạn | Hệ thống đa Agent (Multi-Agent) |
| ---------------- | ---------------------------- | ------------------------------- |
| Đơn vị thực thi | Các node xử lý trong một Workflow | Các Agent độc lập có khả năng hoàn thành mục tiêu con |
| Phương thức làm việc | Node xử lý đầu vào và sinh đầu ra theo logic định sẵn | Agent có thể tự chọn công cụ, quan sát kết quả và lặp lại linh hoạt |
| Cơ chế kiểm soát | Workflow chịu trách nhiệm chuyển node và luân chuyển trạng thái | Có thể dùng điều phối cố định, hoặc để mô hình ủy quyền động |
| Ngữ cảnh (Context) | Ngữ cảnh thường được truyền dọc theo chuỗi xử lý | Có thể cô lập ngữ cảnh, công cụ, quyền hạn và trạng thái theo từng Agent |
| Trạng thái vận hành | Chủ yếu quan tâm chuỗi xử lý đã chạy đến node nào | Cần phân biệt rõ tác vụ, trạng thái, số lần thử lại và kết quả bàn giao của từng Agent |
| Bàn giao kết quả | Đầu ra của node thường làm đầu vào trực tiếp cho node tiếp theo | Có thể truyền message, chia sẻ trạng thái, hoặc bàn giao kết quả có cấu trúc |
| Xử lý sự cố | Thử lại node lỗi hoặc khôi phục từ checkpoint của Workflow | Phải quyết định vai trò nào có thể hạ cấp (degrade), bỏ qua (skip) hoặc thực thi lại |

![Sự khác biệt giữa đa Agent và chuỗi Prompt nhiều giai đoạn](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/multi-agent-vs-prompt-chain-b97efc01.webp)

Nếu bốn vai trò trong AgentInvest chỉ đơn thuần là bốn lần gọi mô hình tuần tự cố định, dùng chung một ngữ cảnh và một bộ công cụ, mỗi bước chỉ gia công lại văn bản của bước trước, thì về bản chất nó vẫn chỉ là một Prompt Chain nhiều giai đoạn.

Trong thực tế dự án, mỗi vai trò đều là một `ReActAgent` độc lập, sở hữu Prompt, Toolkit, `maxIters` và ngữ cảnh riêng. Nhà nghiên cứu có thể tra cứu bảng giá, báo cáo phân tích, tin tức và dữ liệu tài chính; chuyên gia kỹ thuật tập trung vào biểu đồ nến và chỉ báo kỹ thuật; chuyên gia dư luận dò tìm tâm lý thị trường; còn giám đốc đầu tư đọc luận điểm cốt lõi `<core_thesis>` từ thượng nguồn để đưa ra nhận định tổng thể. Workflow bên ngoài quản lý tiến trình thực thi của bốn Agent độc lập, chứ không chỉ đơn thuần là chuyển giao kết quả giữa bốn đoạn văn bản thô.

Việc có chạy song song hay không chỉ thể hiện *cách thức* tác vụ thực thi. Đa Agent hoàn toàn có thể bàn giao tuần tự, và Prompt Chain cũng có thể rẽ nhánh song song.

## Nếu được giao thiết kế một hệ thống đa Agent, bạn sẽ cân nhắc những vấn đề nào trước?

Trước hết hãy xác định mỗi vai trò chịu trách nhiệm gì, ai nắm quyền quyết định bước tiếp theo, kết quả được bàn giao ra sao và khi thất bại sẽ xử lý thế nào, sau đó mới quyết định cần bao nhiêu Agent và những tác vụ nào có thể chạy song song.

| Câu hỏi cần xác định | Cần cân nhắc cụ thể điều gì | Một ví dụ phổ biến |
| -------------------- | --------------------------- | ------------------- |
| Mỗi Agent chịu trách nhiệm gì? | Mục tiêu con, Prompt, công cụ, ngữ cảnh và quyền hạn có cần cô lập không? | Khảo sát kỹ thuật có thể chia thành tìm kiếm tài liệu, phân tích dữ liệu và rà soát kết luận |
| Ai quyết định bước tiếp theo cần làm gì? | Quy trình do mã lệnh kiểm soát, hay do mô hình tự động chọn vai trò và nhiệm vụ? | Quy trình kiểm duyệt cố định giao cho code; hướng tìm kiếm chưa xác định giao cho mô hình |
| Nhiều Agent phối hợp với nhau như thế nào? | Tuần tự, song song, định tuyến (router), bàn giao (handoff), lặp vòng, hay kết hợp? | Tìm kiếm tài liệu đa luồng chạy song song; Reviewer chỉ rà soát sau khi tài liệu đã đủ |
| Các Agent bàn giao những gì cho nhau? | Truyền toàn bộ hội thoại, chia sẻ trạng thái, hay chỉ gửi kết quả có cấu trúc và bằng chứng? | Agent tìm kiếm bàn giao kết luận, trích dẫn và Artifact URI thay vì toàn bộ cuộc chat |
| Ghi nhận trạng thái và xử lý thất bại ra sao? | Có lưu riêng trạng thái từng vai trò không; khi timeout thì thử lại, bỏ qua, hạ cấp hay dừng lại? | Một nhánh tìm kiếm bị timeout thì giữ lại kết quả nhánh khác và đánh dấu rõ phần còn thiếu |
| Agent được triển khai ở đâu? | Chạy trong cùng tiến trình, hay qua mạng xuyên dịch vụ, xuyên team hoặc xuyên vùng bảo mật? | Vai trò cục bộ có thể gọi hàm trực tiếp; vai trò từ xa cần định danh, giao thức và trạng thái tác vụ |

Lấy ví dụ về tác vụ khảo sát kỹ thuật, Workflow bên ngoài có thể cố định thành 4 giai đoạn: lập kế hoạch, tìm kiếm tài liệu, phân tích và thẩm định. Trong giai đoạn tìm kiếm tài liệu, Agent sẽ tự chọn từ khóa tìm kiếm, nguồn dữ liệu và công cụ, khi cần thiết có thể mở thêm hướng tìm kiếm mới. Các vai trò chỉ bàn giao kết luận, trích dẫn và Artifact, không cần phải chia sẻ toàn bộ nhật ký trò chuyện.

## Khi nào thì đáng để sử dụng đa Agent?

Tôi thường bắt đầu bằng một Agent đơn lẻ hoặc một Workflow cố định trước. Khi một Agent đã có thể hoàn thành tác vụ trong phạm vi chi phí và độ trễ chấp nhận được, việc tách ra nhiều vai trò chỉ làm tăng gánh nặng điều phối, bàn giao ngữ cảnh, hợp nhất kết quả và phục hồi lỗi.

Chỉ khi các khâu khác nhau đòi hỏi các bộ công cụ, quyền hạn và ngữ cảnh khác biệt rõ rệt, hoặc nhiệm vụ có thể phân tách thành các hướng khám phá tương đối độc lập, lúc đó mới nên cân nhắc đa Agent. Mỗi vai trò cũng cần có kết quả bàn giao tường minh, chẳng hạn như kết luận có cấu trúc, trích dẫn tài liệu, Diff mã nguồn hay báo cáo kiểm thử. Nếu giữa các vai trò chỉ chuyền tay nhau vài đoạn văn bản tự do, phần lớn công sức sau này sẽ bị tiêu tốn vào việc chắp vá kết quả và định vị nguyên nhân lỗi.

Hệ thống [Multi-Agent Research](https://www.anthropic.com/engineering/multi-agent-research-system) do Anthropic công bố áp dụng chính lối thiết kế này. Agent chính dựa trên câu hỏi để phân nhánh thành nhiều hướng nghiên cứu, các Subagent tỏa ra tìm kiếm độc lập, sau khi hoàn tất sẽ do Agent chính tổng hợp lại. Các nhánh có thể tự do khám phá độc lập, rất thích hợp chạy song song; nếu các nhánh liên tục phụ thuộc vào kết luận trung gian của nhau, hoặc bắt buộc phải liên tục đồng bộ toàn bộ ngữ cảnh, chi phí giao tiếp sẽ nhanh chóng triệt tiêu mọi lợi ích mà việc phân tách mang lại.

![Kiến trúc hệ thống Multi-Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/agent-multi-agent-arch-f7551234.png)

Trong tác vụ thay đổi code, Agent lập trình chịu trách nhiệm sửa file và bàn giao Diff, Agent kiểm thử chạy test và trả về thông tin lỗi, còn Reviewer căn cứ vào yêu cầu và Diff để rà soát. Cả ba vai trò sử dụng công cụ và tiêu chuẩn nghiệm thu hoàn toàn khác nhau, khi tách rời sẽ có nhiệm vụ rất rành mạch. Nhưng nếu chúng chỉ cùng đọc một bản Diff rồi mỗi bên viết một đoạn tóm tắt na ná nhau, thứ gia tăng duy nhất chỉ là số lần gọi mô hình.

Trước khi đưa lên production, hãy dùng cùng một tập tác vụ để chạy thử nghiệm đối chứng (A/B testing), so sánh chất lượng, thời gian thực thi, lượng Token tiêu thụ và tỷ lệ lỗi giữa đơn Agent và đa Agent. Nếu không đem lại lợi ích đo lường được rõ ràng, hãy giữ lại giải pháp đơn giản hơn.

## Bốn Agent trong AgentInvest phối hợp với nhau ra sao?

Lấy tác vụ phân tích cổ phiếu trong AgentInvest làm ví dụ, người dùng đưa ra câu hỏi như sau:

> Hãy phân tích giúp tôi xem hiện tại có nên mua cổ phiếu Kweichow Moutai nữa không.

Tri thức phổ thông trong tham số mô hình không thể trả lời câu hỏi này một cách chuẩn xác. Hệ thống cần tra cứu bảng giá thời gian thực, báo cáo phân tích, chỉ số tài chính, biểu đồ nến và dư luận thị trường, đồng thời kết hợp xem người dùng hiện có đang nắm giữ mã này hay không để đưa ra khuyến nghị. AgentInvest thực thi theo trình tự sau:

1. Nhà nghiên cứu trước hết tra cứu bảng giá, báo cáo phân tích, tin tức và số liệu tài chính, bàn giao kết luận nghiên cứu cơ bản cùng luận điểm cốt lõi trong thẻ `<core_thesis>`.
2. Sau khi Nhà nghiên cứu hoàn thành, Chuyên gia kỹ thuật tra cứu biểu đồ nến và chỉ báo kỹ thuật, còn Chuyên gia dư luận tra cứu tâm lý thị trường; hai vai trò này thực thi song song.
3. Giám đốc đầu tư đọc luận điểm từ thượng nguồn, kết hợp danh mục nắm giữ của người dùng, ký ức lịch sử và Skill chiến lược để sinh ra khuyến nghị cuối cùng.

Tầng ngoài do lớp tùy biến `AgentScopePipelineExecutionStrategy` của dự án kiểm soát thứ tự các giai đoạn. Bên trong từng vai trò mới giao quyền cho ReAct, để mô hình tự phán đoán đang thiếu dữ liệu gì, cần gọi công cụ nào, nhận được kết quả rồi thì có tiếp tục phân tích nữa hay không. Cách làm này vừa đảm bảo quy trình nghiên cứu đầu tư diễn ra ổn định, vừa không biến mỗi vai trò thành một Prompt Chain hoàn toàn cứng nhắc.

![Sub-agent phân tách tác vụ, cô lập ngữ cảnh](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/sub-agent-task-splitting-context-isolation--635196e8.png)

Để bước vào giai đoạn của Giám đốc đầu tư, cần thỏa mãn hai điều kiện: Nhà nghiên cứu đã đưa ra luận điểm cốt lõi, và ít nhất một trong hai vai trò Chuyên gia kỹ thuật hoặc Chuyên gia dư luận phải thực thi thành công. Nếu kết quả thượng nguồn thiếu hụt nghiêm trọng, hệ thống sẽ bỏ qua Giám đốc đầu tư và trả về lỗi qua SSE, tránh để mô hình tự gượng ép "bịa" ra một bản báo cáo đầu tư có vẻ hoàn chỉnh.

Nhà nghiên cứu bắt buộc phải hoàn thành trước, Giám đốc đầu tư bắt buộc phải thực thi sau cùng, chỉ có hai vai trò độc lập ở giữa là chạy song song. Vai trò do thiết kế đa Agent xác định, còn thứ tự trước sau do DAG kiểm soát chặt chẽ.

## Nên chọn mô hình điều phối (Orchestration Pattern) nào cho đa Agent?

Mô hình điều phối phụ thuộc vào việc ai nắm quyền kiểm soát, vai trò được xác định khi nào, giữa các nhiệm vụ có sự phụ thuộc ra sao và ai trực tiếp giao tiếp với người dùng:

| Mô hình | Cơ chế kiểm soát | Kịch bản áp dụng | Chi phí / Đánh đổi chính |
| ------- | ---------------- | ---------------- | ------------------------ |
| Sequential (Tuần tự) | Mã lệnh gọi tuần tự nhiều Agent theo thứ tự cố định | Các bước xác định, phụ thuộc trước sau rõ ràng | Độ trễ tích lũy, tính linh hoạt hạn chế |
| Parallel (Song song) | Mã lệnh phân phát các tác vụ độc lập chạy song song rồi hợp nhất | Đánh giá đa chiều, tìm kiếm độc lập, biểu quyết | Xử lý việc hợp nhất trạng thái và lỗi cục bộ |
| Router (Định tuyến) | Quy tắc hoặc mô hình định tuyến yêu cầu tới một hoặc nhiều chuyên gia | Miền nghiệp vụ rõ ràng, phân loại tương đối ổn định | Lỗi định tuyến sẽ dẫn tới chọn sai chuyên gia hoàn toàn |
| Supervisor / Manager | Agent chính gọi động các Agent con và giữ quyền kiểm soát cuối cùng | Tác vụ con không thể xác định trước; cần câu trả lời thống nhất | Agent chính trở thành điểm nghẽn, chi phí điều phối cao |
| Handoff (Chuyển giao) | Agent hiện tại chuyển giao quyền điều khiển và ngữ cảnh cho Agent khác | Phân luồng CSKH, hội thoại theo giai đoạn, chuyên gia phục vụ trực tiếp | Khó duy trì lịch sử phiên và ranh giới quyền hạn |
| Evaluator-Optimizer | Bên tạo sinh và bên đánh giá lặp vòng phản hồi | Có tiêu chí chấm điểm rõ ràng; việc lặp lại thực sự cải thiện kết quả | Dễ rơi vào vòng lặp vô tận; cần điều kiện dừng chặt |
| Group Chat | Các Agent dùng chung phiên chat, phát biểu luân phiên hoặc qua Selector | Thảo luận, thẩm định, tác vụ cần các bên tự sửa sai cho nhau | Ngữ cảnh phình to nhanh chóng, khó xác định điều kiện dừng |
| Debate (Tranh biện) | Nhiều Agent qua nhiều lượt đưa ra, phản biện và hiệu chỉnh quan điểm | Kết luận có thể kiểm chứng bằng chứng cứ; sự bất đồng có giá trị | Dễ sa vào tranh cãi lặp lại, không đảm bảo tính đúng đắn |
| Event-driven / Peer | Agent tự quyết định hành động tiếp theo dựa vào tin nhắn và quy tắc cục bộ | Hợp tác mở xuyên dịch vụ, xuyên team | Tính nhất quán, bảo mật và debug phức tạp nhất |

AgentInvest sử dụng mô hình điều phối lai **Sequential + Parallel + Aggregator**. Nhà nghiên cứu và Giám đốc đầu tư tạo thành thứ tự trước sau, Chuyên gia kỹ thuật và Chuyên gia dư luận ở giữa chạy song song, và Giám đốc đầu tư đảm nhận khâu hợp nhất sau cùng.

Hệ thống không sử dụng Supervisor để quyết định động số lượng Agent, cũng không để một Agent nào đó Handoff phiên của người dùng cho Agent khác. Các giai đoạn chính của phân tích chứng khoán tương đối cố định, dùng code kiểm soát luồng ngoài sẽ ổn định hơn; những phần cần phán đoán linh hoạt được giữ lại bên trong ReAct Loop của từng vai trò.

Các mô hình này có thể kết hợp linh hoạt. Sau khi Router chọn được chuyên gia, chuyên gia đó vẫn có thể gọi tiếp Subagent; hoặc Supervisor có thể hoàn tất các tác vụ chuẩn bị trước rồi mới phân phát song song cho các Worker.

### Phân tách vai trò tĩnh hay ủy quyền động?

Phân tách tĩnh nghĩa là các vai trò, quan hệ phụ thuộc và đường dẫn thực thi đã được xác định trước khi chạy. Trình tự cố định, nhánh song song cố định và DAG có điều kiện đều thuộc nhóm này. Ưu điểm là rất dễ viết test, việc kiểm soát timeout, ngân sách và xử lý lỗi cục bộ cũng chặt chẽ hơn, thích hợp cho các tác vụ có quy trình nghiệp vụ tương đối ổn định.

Ủy quyền động là mô hình mà Manager hoặc Supervisor sẽ căn cứ vào câu hỏi hiện tại và kết quả trung gian để quyết định gọi những Agent nào, phân rã bao nhiêu tác vụ con và có tiếp tục khám phá nữa hay không. Dự án Multi-Agent Research của Anthropic thuộc mô hình này: các câu hỏi khác nhau đòi hỏi hướng điều tra khác nhau, rất khó để vẽ sẵn một DAG cố định từ đầu.

Hai cách làm này hoàn toàn có thể kết hợp. Ví dụ: tầng ngoài cố định 3 giai đoạn thu thập dữ liệu, phân tích và kiểm duyệt; trong giai đoạn thu thập dữ liệu, Agent chính sẽ căn cứ vào câu hỏi để sinh ra các Subagent. Cổng kiểm duyệt và phát hành vẫn do quy trình cố định kiểm soát, còn hướng nghiên cứu có thể mở rộng linh hoạt tại thời điểm chạy.

![Sự khác biệt giữa DAG cố định và ủy quyền động trong đa Agent](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/multi-agent-static-vs-dynamic-orchestration-6ce0bc0f.webp)

## Làm thế nào để phân tách tác vụ con thành các bản hợp đồng có thể thực thi?

Nếu chỉ viết trong Prompt câu lệnh chung chung như "Bạn là Agent khảo sát kỹ thuật", vai trò đó vẫn sẽ không biết phải tra cứu cái gì, được dùng những dữ liệu nào, và làm thế nào mới được coi là hoàn thành. Bộ điều phối khi giao việc phải cung cấp đồng thời mục tiêu con và tiêu chí thành công, nêu rõ các tác vụ thượng nguồn phụ thuộc, công cụ và quyền hạn khả dụng, đồng thời quy ước rõ Schema đầu ra và nơi lưu trữ sản phẩm. Ngân sách thời gian, Token, số lần lặp và chiến lược xử lý thất bại cũng thuộc về bản hợp đồng tác vụ (task contract), do tầng runtime chịu trách nhiệm cưỡng chế thực thi.

Cấu trúc `AgentTask` dưới đây minh họa một bản hợp đồng tác vụ tinh giản:

```java
public record AgentTask(
        String taskId,
        String parentTaskId,
        AgentRole role,
        TaskContext context,
        List<AgentRole> dependencies,
        Set<String> allowedTools,
        String outputSchema,
        int maxIters,
        Duration modelTimeout,
        Duration toolTimeout,
        Instant deadline,
        int maxAttempts) {
}
```

Trong dự án thực tế cần bổ sung phiên bản tác vụ, idempotent key, tiêu chí thành công và vị trí lưu trữ artifact. Danh sách công cụ cho phép (`allowedTools`), timeout và số lần retry được runtime kiểm soát cứng; mô hình chỉ tiếp nhận lượng thông tin tối thiểu cần thiết để hoàn thành tác vụ con đó.

### Làm sao đánh giá các tác vụ con có thể chạy song song hay không?

Lấy ví dụ khảo sát kỹ thuật: sau khi câu hỏi nghiên cứu được xác định, việc "tra cứu tài liệu chính thức" và "tra cứu bài báo khoa học cùng benchmark" có thể tiến hành cùng lúc. Đầu vào của cả hai nhánh đã đầy đủ, và chúng không cần đọc kết luận trung gian của nhau. Nhưng kết luận so sánh bắt buộc phải đợi tư liệu của cả hai bên cùng về đủ, do đó chỉ có thể đặt ở phía sau.

Các nhánh song song cũng phải tránh việc cùng ghi đè vào một trường dữ liệu có thẩm quyền duy nhất. Hai Agent tìm kiếm sẽ nộp riêng danh mục tài liệu của mình, để node hợp nhất viết bản báo cáo cuối cùng; các tác dụng phụ ra bên ngoài (external side effects) như gửi thông báo, sửa code cũng phải giao cho một thực thể duy nhất, hoặc sử dụng cơ chế idempotent và ràng buộc duy nhất để bảo vệ. Nếu một nhánh thất bại thì phải chờ, hạ cấp hay hủy bỏ toàn bộ cũng phải được ghi rõ trong tiêu chí thành công trước khi chạy.

Trong Java có thể dùng thread pool, virtual thread hoặc structured concurrency để thực thi các nhánh này; việc chọn kỹ thuật luồng nào không phải trọng tâm. Tầng điều phối vẫn phải giới hạn số lượng đồng thời tối đa, đặt Deadline chung cho toàn bộ giai đoạn; khi hết hạn phải hủy các tác vụ chưa hoàn thành, giữ lại kết quả đã xong, rồi căn cứ vào ngưỡng thành công để quyết định có tiến vào hạ nguồn hay không.

### Làm thế nào để ngăn chặn các vai trò làm việc trùng lặp hoặc bỏ sót kết quả?

Phạm vi trách nhiệm phải được ràng buộc đồng thời trên cả tác vụ lẫn công cụ. Trong kịch bản sửa code, Agent lập trình chịu trách nhiệm sửa đổi workspace, Agent kiểm thử chỉ chạy test và trả về thông tin lỗi, còn Reviewer đọc Diff, kết quả kiểm thử và danh sách quy chuẩn. Nếu chỉ đổi tên vai trò mà không giới hạn công cụ và đầu ra, các Agent vẫn sẽ giẫm chân lên nhau và lặp lại việc kiểm tra cùng một thứ.

Mỗi vai trò cũng cần có một giao thức bàn giao tường minh. Một cấu trúc `RoleResult` tổng quát tối thiểu có thể bao gồm kết luận, bằng chứng, thời gian ghi nhận dữ liệu, Artifact URI, các mục còn thiếu và ranh giới độ tin cậy; tầng điều phối chịu trách nhiệm xác thực các trường bắt buộc. Đầu ra có cấu trúc giải quyết vấn đề định dạng và bàn giao, còn kết luận có đáng tin cậy hay không vẫn phải đối soát dựa vào chứng cứ và tính thời sự của dữ liệu.

AgentInvest hiện dùng thẻ `<core_thesis>` để truyền luận điểm cốt lõi, đây là cách làm nhẹ nhàng, chi phí cải tạo thấp; nhưng nó cũng dễ đánh mất mốc thời gian của dữ liệu và các chứng cứ quan trọng. Khi cần năng lực kiểm toán mạnh hơn, nên từng bước thay thế bằng các kết quả có cấu trúc Schema rõ ràng, thay vì tiếp tục mở rộng các quy tắc xử lý chuỗi tự nhiên chắp vá.

## Các Agent nên giao tiếp và chia sẻ trạng thái như thế nào?

Giữa các Agent không nhất thiết mặc định phải dùng tin nhắn hội thoại. Quy trình Workflow cố định chạy trong cùng tiến trình thường chuyển giao kết quả thông qua tham số, giá trị trả về và bảng trạng thái dùng chung; chỉ khi gọi xuyên dịch vụ hoặc cần đàm phán liên tục mới cần bổ sung hệ thống tin nhắn và giao thức từ xa.

| Phương thức giao tiếp | Cách thực hiện | Phù hợp với tình huống nào |
| --------------------- | -------------- | -------------------------- |
| Tham số và giá trị trả về | Bộ điều phối gọi Agent, lấy kết quả thượng nguồn làm đầu vào hạ nguồn | Workflow cố định trong cùng tiến trình, quan hệ đơn giản |
| Trạng thái dùng chung / Bảng đen (Blackboard) | Agent đọc trạng thái chung, chỉ cập nhật trường mình phụ trách | Điều phối dạng đồ thị, cần nhiều node bổ sung dần kết quả |
| Tin nhắn (Messaging) | Gửi điểm-điểm (P2P) hoặc phát sóng trong Group Chat | Agent cần liên tục đàm phán, bàn giao hoặc phối hợp bất đồng bộ |
| Kết quả có cấu trúc | Bàn giao kết luận, báo cáo hoặc tham chiếu tệp kèm Schema chuẩn | Kết quả lớn, cần kiểm chuẩn, tái sử dụng và kiểm toán |
| Giao thức Agent từ xa | Khám phá Agent, truyền tác vụ và sản phẩm qua các giao thức như A2A | Chạy xuyên tiến trình, xuyên team hoặc xuyên vùng bảo mật |

Cơ chế giao tiếp càng phức tạp thì bài toán xác thực, thử lại, thứ tự tin nhắn và trùng lặp gói tin càng khó xử lý. Những gì có thể hoàn thành thông qua một lệnh gọi phương thức đơn giản thì không cần thiết phải đưa vào hệ thống message queue.

Trạng thái dùng chung chỉ nên lưu giữ thông tin cần thiết cho sự phối hợp giữa các vai trò. Nhật ký gọi công cụ và tiến độ ReAct của từng Agent nên giữ riêng trong trạng thái phiên của chính nó; thông tin người dùng, tenant, tài nguyên và quyền hạn được truyền vào tường minh qua `TaskContext`. Sau khi vai trò hoàn thành, nó sẽ ghi kết luận, tóm tắt chứng cứ, các mục còn thiếu và Artifact URI vào slot trạng thái mà mình phụ trách, còn bộ điều phối sẽ ghi nhận riêng xem vai trò đó đã bắt đầu, hoàn thành, thất bại hay timeout.

Các tài liệu thô như trang web, log, kết quả truy vấn và Diff code có thể lưu lại trong ngữ cảnh của vai trò đó hoặc kho lưu trữ Artifact. SSE hay WebSocket chỉ chịu trách nhiệm đẩy tiến độ về cho frontend hiển thị, không gánh vác việc lưu trữ trạng thái tác vụ.

Ngữ cảnh nghiệp vụ tốt nhất nên truyền tường minh cho Agent và công cụ. Việc phụ thuộc vào `ThreadLocal` để đọc ngầm dữ liệu tác vụ rất dễ gây nhầm lẫn dữ liệu giữa các luồng khi chạy đồng thời, bất đồng bộ hoặc chạy trên virtual thread, đồng thời che giấu việc công cụ thực sự đã sử dụng những thông tin nào.

### Làm thế nào để kiểm soát kích thước của trạng thái dùng chung?

Trong tác vụ khảo sát kỹ thuật, Agent tìm kiếm không cần thiết phải sao chép toàn bộ các trang web đã cào, toàn bộ quá trình tìm kiếm và log công cụ sang cho Reviewer. Nó có thể lưu các tài liệu thô vào kho Artifact, và chỉ bàn giao bản tóm tắt kết luận, trích dẫn, mốc thời gian dữ liệu cùng Artifact URI. Khi Reviewer cần thẩm tra một kết luận nào đó, nó sẽ căn cứ vào URI để đọc lại bằng chứng gốc.

Bản tóm tắt không được tách rời khỏi bằng chứng. Với các thông tin nhạy cảm về mặt thời gian như giá cả, phiên bản, quy định pháp lý, số liệu thực nghiệm, bắt buộc phải lưu giữ thời gian thu thập, nguồn trích dẫn và các trường dữ liệu the chốt.

### Trạng thái vận hành của đa Agent cần ghi lại những gì?

```java
public record AgentRunState(
        String runId,
        String subject,
        RunStatus status,
        Map<AgentRole, RoleState> roles,
        Map<AgentRole, ArtifactRef> artifacts,
        BudgetUsage usage,
        List<FailureRecord> failures,
        ArtifactRef finalOutput) {
}

public record RoleState(
        AgentRole role,
        TaskStatus status,
        int attempt,
        String providerId,
        String modelName,
        Instant startedAt,
        Instant updatedAt,
        FailureRecord lastFailure) {
}
```

Cấu trúc này mang tính minh họa đơn giản hóa. Trạng thái phiên của từng Agent đơn lẻ, trạng thái nghiệp vụ dùng chung và trạng thái Workflow bên ngoài phải được lưu trữ độc lập. Bộ lưu trữ phiên ghi lại hội thoại mô hình và tiến độ công cụ; trạng thái Workflow ghi lại tiến trình tác vụ đã đi tới vai trò nào; hai phần này không thể thay thế cho nhau.

Khi các vai trò được tách thành các dịch vụ độc lập, cần bổ sung thêm `ownerAgentId`, `version`, `leaseUntil` và `fencingToken` để xử lý việc chuyển giao và tiếp quản tác vụ. Các trường này thuộc về tầng phân tán Worker, trong hệ thống đa Agent nội bộ một tiến trình chưa cần thiết phải sao chép sớm.

## Giao thức A2A giải quyết được gì và không giải quyết được gì?

Khi nhiều vai trò cùng chạy trong một tiến trình, gọi hàm trực tiếp luôn là cách đơn giản nhất. Chỉ khi các Agent được triển khai độc lập, do các team khác nhau bảo trì hoặc cần gọi xuyên vùng bảo mật, lúc đó mới cần đến giao thức Agent-to-Agent (A2A) để chuẩn hóa việc khám phá năng lực, theo dõi trạng thái tác vụ và bàn giao sản phẩm.

Một quy trình phối hợp A2A thường bắt đầu bằng việc đọc Agent Card; bên gọi trước hết xác nhận năng lực, giao diện và yêu cầu xác thực của Agent từ xa, sau đó tạo một Task với ID duy nhất. Hai bên bổ sung thông tin tác vụ thông qua Message, sau khi hoàn thành sẽ dùng Artifact để bàn giao tài liệu hoặc kết quả có cấu trúc, còn Context đóng vai trò xâu chuỗi các tác vụ và tin nhắn liên quan lại với nhau.

Trong chuẩn [A2A 1.0](https://a2a-protocol.org/latest/announcing-1.0/), `TaskState` ngoài trạng thái chưa xác định `TASK_STATE_UNSPECIFIED`, còn bao gồm `TASK_STATE_SUBMITTED`, `TASK_STATE_WORKING`, `TASK_STATE_INPUT_REQUIRED`, `TASK_STATE_AUTH_REQUIRED`, `TASK_STATE_COMPLETED`, `TASK_STATE_FAILED`, `TASK_STATE_CANCELED` và `TASK_STATE_REJECTED`. Trong đó, `INPUT_REQUIRED` và `AUTH_REQUIRED` đều là các trạng thái ngắt tạm thời để đợi bên ngoài bổ sung thông tin rồi mới tiếp tục chạy. Thiết kế này phù hợp hơn rất nhiều cho các tác vụ dài so với việc chỉ trả về cờ nhị phân "thành công/thất bại".

A2A giải quyết bài toán làm thế nào để các Agent từ xa tìm thấy nhau, trao đổi tin nhắn, theo dõi tác vụ và bàn giao sản phẩm. Nó không quyết định topology thực thi thay cho ứng dụng, cũng không tự động giải quyết tính nhất quán nội bộ. Khi hai Worker cùng cập nhật tác vụ thì xử lý thế nào, khi timeout ai sẽ tiếp quản, hay làm sao tránh gửi thông báo hoặc hoàn tiền lặp lại... tất cả vẫn đòi hỏi hệ thống nghiệp vụ tự mình giải quyết.

## Xử lý xung đột đồng thời trong đa Agent ra sao?

Khi thấy hai Agent đưa ra kết quả khác nhau, không thể đơn giản chọn một bên rồi ghi đè lên bên kia. Trước tiên phải phân biệt rõ chúng đang gặp phải loại xung đột nào:

| Loại xung đột | Ví dụ phổ biến | Cách xử lý |
| ------------- | -------------- | ---------- |
| Xung đột ghi trạng thái | Hai Agent tìm kiếm cùng ghi đè trường `sources` của báo cáo | Chia slot theo vai trò, dùng tập hợp append-only hoặc dùng version/CAS |
| Xung đột quan điểm | Hai Agent dựa trên nguồn khác nhau rút ra kết luận trái ngược | Giữ lại nguồn, thời gian và phạm vi áp dụng, giao cho Aggregator phán đoán |
| Xung đột quyền sở hữu | Worker cũ và Worker tiếp quản cùng nộp kết quả đồng thời | Dùng Lease + Version/CAS + Fencing Token |
| Xung đột tác dụng phụ | Hai Agent gửi thông báo trùng lặp hoặc cùng yêu cầu hoàn tiền | Áp dụng Single Executor, khóa idempotent và ràng buộc duy nhất trong DB |

### Hợp nhất trạng thái song song như thế nào?

Các Agent chạy song song sẽ tự cập nhật slot trạng thái của riêng mình, kết quả và lỗi cũng lưu theo từng vai trò. Các bộ đếm như Token, thời gian thực thi có thể tổng hợp qua luồng sự kiện, nhưng báo cáo cuối cùng và trường `finalOutput` chỉ cho phép một node hợp nhất duy nhất được quyền ghi. Các event đẩy về frontend mang theo vai trò và số thứ tự chỉ nhằm mục đích hiển thị, tuyệt đối không được dùng để thay đổi ngược lại trạng thái tác vụ trong backend.

Nếu cả hai Agent đều có thể ghi đè vào cùng một trường `finalOutput`, các cấu trúc dữ liệu thread-safe chỉ đảm bảo quá trình ghi không bị lỗi bộ nhớ, chứ không thể biết được kết quả nghiệp vụ nào nên được giữ lại. Việc lưu kết quả theo vai trò rồi giao cho một node hợp nhất duy nhất ghi các trường có thẩm quyền mới giúp tránh được tình trạng bên ghi sau vô tình xóa sạch công sức của nhánh khác.

### Xử lý ra sao khi kết luận sự thật giữa các Agent bị mâu thuẫn?

"Xung đột" trong phân tích cổ phiếu chưa chắc là do ai tính sai. Chuyên gia kỹ thuật có thể căn cứ biểu đồ nến 60 ngày để nhận định xu hướng đang tăng (bullish), nhưng Chuyên gia dư luận lại phát hiện tâm lý tiêu cực ngắn hạn đang tăng vọt. Hai kết luận này nhắm vào khoảng thời gian và nguồn dữ liệu khác nhau, không thể đơn giản bỏ phiếu theo số đông để quyết định nghe ai.

Nếu muốn nâng cao tính có thể kiểm toán của kết luận, có thể cấu trúc hóa các luận điểm trọng yếu:

```json
{
  "claimId": "claim-17",
  "subject": "600519",
  "predicate": "technical-trend",
  "value": "BULLISH",
  "scope": "daily-kline-60d",
  "sourceTool": "get_technical_indicators",
  "observedAt": "2026-08-15T10:00:00+08:00",
  "evidenceStatus": "VERIFIED"
}
```

Trường `scope` dùng để giải thích kết luận đến từ nến ngày hay nến phút, `observedAt` ghi lại thời điểm của dữ liệu, `sourceTool` cho biết căn cứ lấy từ công cụ nào. Khi Giám đốc đầu tư hợp nhất sẽ phân biệt được "xu hướng kỹ thuật trung hạn là tăng" và "dư luận ngắn hạn là tiêu cực", không cần gượng ép quy chụp chúng về cùng một hướng.

Khi dữ liệu không đủ, khuyến nghị cuối cùng cần hạ thấp mức độ khẳng định. ReAct giúp hạn chế tình trạng không tra dữ liệu mà phán bừa, nhưng không thể đảm bảo kết luận đầu tư chắc chắn sẽ chính xác 100%.

### Tại sao dùng Lease vẫn cần phải đi kèm với Fencing Token?

Khi các tác vụ trong cùng tiến trình có thể hủy và chờ đợi trực tiếp thì thường không cần đến Lease phân tán. Chỉ khi các vai trò được tách thành các Worker từ xa, chúng ta mới gặp phải vấn đề instance cũ và instance tiếp quản cùng gửi kết quả về một lúc.

Giả sử Worker A nhận được hợp đồng thuê (lease) của tác vụ, sau đó gặp phải sự cố tạm dừng kéo dài (stop-the-world). Hạn thuê hết, hệ thống giao tác vụ cho Worker B tiếp quản. Đúng lúc này Worker A hồi phục và tiếp tục ghi dữ liệu; nếu tầng dưới chỉ kiểm tra xem "A có từng nắm giữ khóa hay không", kết quả cũ của A vẫn có thể ghi đè lên kết quả mới của B.

Bây giờ giả sử A nhận được `fencingToken` là 7, còn B khi tiếp quản nhận được 8. Cơ sở dữ liệu ghi nhận 8 là phiên bản hợp lệ hiện tại; khi A hồi phục và gửi kết quả kèm token 7, điều kiện ghi không thỏa mãn, kết quả gửi muộn sẽ bị từ chối thẳng thừng.

Lease chủ yếu giải quyết việc một Owner mất liên lạc sẽ không chiếm giữ tác vụ vĩnh viễn, còn Fencing Token hoặc kiểm tra phiên bản giải quyết việc chặn các thao tác ghi muộn màng khi Owner cũ sống lại. Chỉ đặt TTL cho khóa phân tán không thể tự động bảo vệ an toàn cho tài nguyên bên ngoài.

## Mô hình hóa vòng đời tác vụ như thế nào?

Trạng thái của các vai trò phải do chiến lược thực thi bên ngoài quản lý, không thể để mô hình tự do điền vào. Bộ điều phối cần căn cứ vào trạng thái của các tác vụ phụ thuộc để quyết định hạ nguồn có được chạy hay không. Dưới đây là một thiết kế máy trạng thái phổ biến:

| Trạng thái | Ý nghĩa | Các trạng thái kế tiếp chủ yếu được phép |
| ---------- | ------- | --------------------------------------- |
| `PENDING` | Đã tạo, các điều kiện phụ thuộc chưa thỏa mãn | `READY`, `CANCELED` |
| `READY` | Đã sẵn sàng để được lập lịch | `RUNNING`, `CANCELED` |
| `RUNNING` | Vai trò đang thực thi | `WAITING_INPUT`, `SUCCEEDED`, `RETRYABLE_FAILED`, `FINAL_FAILED` |
| `WAITING_INPUT` | Đợi người dùng nhập liệu, phê duyệt hoặc cấp quyền | `READY`, `CANCELED`, `FINAL_FAILED` |
| `RETRYABLE_FAILED` | Xác nhận là sự cố có thể thử lại | `READY`, `FINAL_FAILED` |
| `SUCCEEDED` | Đầu ra đã được lưu và vượt qua kiểm chuẩn cơ bản | Trạng thái kết thúc |
| `FINAL_FAILED` | Không thể tự động phục hồi | Trạng thái kết thúc hoặc chờ can thiệp thủ công mở lại |
| `CANCELED` | Bị người dùng hoặc hệ thống hủy bỏ | Trạng thái kết thúc |

Trong pipeline đơn tiến trình hiện tại, lưu trạng thái theo từng vai trò là đủ để kiểm soát luồng. Sau này khi tách thành dịch vụ phân tán, khi nộp kết quả cần đồng thời kiểm tra trạng thái tác vụ, Owner, Fencing Token và phiên bản:

```sql
UPDATE agent_task
SET status = 'SUCCEEDED',
    artifact_uri = :artifactUri,
    version = version + 1
WHERE task_id = :taskId
  AND status = 'RUNNING'
  AND owner_agent_id = :ownerAgentId
  AND fencing_token = :fencingToken
  AND version = :expectedVersion;
```

Nếu số dòng bị ảnh hưởng bằng 0, chứng tỏ tác vụ đã bị tiếp quản, bị hủy hoặc có cập nhật đồng thời. Worker không được phép cố ghi bù, mà phải đọc lại trạng thái mới nhất từ cơ sở dữ liệu.

## Phục hồi ra sao sau khi đa Agent gặp thất bại?

Trong hệ thống đa Agent, khi xảy ra thất bại không thể áp dụng cách thử lại (retry) một cách mù quáng và đồng loạt. Đầu vào không hợp lệ, thiếu quyền hạn, API tìm kiếm bị timeout hay kết quả thiếu chứng cứ... mỗi trường hợp đòi hỏi cách xử lý hoàn toàn khác biệt:

| Dạng thất bại | Ví dụ phổ biến | Hành động khuyến nghị |
| ------------- | -------------- | --------------------- |
| Lỗi hợp đồng / đầu vào | Thiếu tài nguyên đích, đầu ra sai Schema | Thử sửa một lần hoặc báo lỗi ngay, không thử lại mạng vô ích |
| Quyền hạn / nghiệp vụ từ chối | Agent CSKH không có quyền hoàn tiền | Dừng gọi hoặc đợi người dùng/quản trị viên cấp quyền |
| Sự cố tức thời | Kết nối API tìm kiếm bị reset, bị rate limit ngắn hạn, lỗi 5xx tạm thời | Thử lại có giới hạn, kết hợp backoff và jitter |
| Lệnh gọi timeout | Mô hình hoặc công cụ chạy vượt ngân sách của lần gọi này | Dừng lệnh gọi hiện tại, xử lý theo chiến lược của vai trò |
| Vai trò timeout | Một nhánh nghiên cứu vượt quá Deadline chung của cả giai đoạn | Hủy các tác vụ chưa hoàn thành, giữ lại kết quả đã thành công |
| Chất lượng không đạt | Báo cáo thiếu trích dẫn, thiếu trường bắt buộc hoặc thiếu Artifact kiểm chứng | Sửa lỗi một lần, hạ cấp (degrade) hoặc bỏ qua nhánh hạ nguồn |
| Lỗi code tất định | Parse event thất bại, chuyển trạng thái trái phép | Fail-fast, phát cảnh báo, sửa code |

Hành động khắc phục phải nằm ở đúng tầng chịu trách nhiệm thực tế. Executor của vai trò xử lý tham số mô hình, công cụ và số vòng lặp; Orchestrator quyết định có hủy các nhánh khác hay không, giữ lại những kết quả nào và hạ nguồn có được tiếp tục hay không. Khi các vai trò tách thành Worker từ xa, bộ lập lịch sẽ xử lý tiếp bài toán về Lease, tiếp quản tác vụ và kết quả gửi muộn.

### Giới hạn số lần thử lại và tổng ngân sách như thế nào?

Ngân sách ít nhất phải được chia làm 4 tầng: một lần gọi mô hình, một lần gọi công cụ, số lần lặp ReAct của một Agent, và Deadline của cả giai đoạn hoặc toàn bộ tác vụ. Các tầng trước hạn chế tiêu hao cục bộ, còn Deadline ngoài cùng đảm bảo tác vụ không bị trì hoãn vô tận vì các lần thử lại bên trong.

Ngân sách thử lại cũng chỉ nên do một chủ thể chính nắm giữ. Nếu SDK mô hình, Executor của vai trò và Gateway đều độc lập thử lại, một sự cố đơn lẻ sẽ bị khuếch đại thành hàng tá lệnh gọi lồng nhau. Tầng điều phối cần ghi nhận số lần thử, lượng Token, thời gian và chi phí đã tiêu tốn, kiểm tra ngân sách còn lại trước khi quyết định thử lại.

### Nên lưu Checkpoint ở đâu?

Checkpoint thích hợp đặt tại những vị trí mà kết quả đã được ghi xuống ổ đĩa bền vững và có thể kiểm chứng độc lập. Sau khi giai đoạn tìm kiếm của khảo sát kỹ thuật hoàn thành, hãy lưu danh mục tài liệu kèm trích dẫn; sau khi phân tích dữ liệu xong, hãy lưu Artifact có thể tái sử dụng; sau khi Reviewer rà soát xong, hãy ghi lại lý do đạt hay trả về. Những thao tác cần con người cấp quyền cũng phải lưu các tham số chờ thực thi trước khi tạm dừng.

Trạng thái phiên của một Agent đơn lẻ và Checkpoint của Workflow bên ngoài là hai loại dữ liệu khác biệt. Loại trước ghi lại hội thoại, lệnh gọi công cụ và tiến độ nội bộ của vai trò; loại sau phải lưu giai đoạn hiện tại, các vai trò đã hoàn thành, tham chiếu artifact, phiên bản model và prompt, mức tiêu thụ ngân sách và nhật ký lỗi.

Chỉ lưu lịch sử chat vào Redis không thể giúp hệ thống tự động tiếp tục cả Workflow từ vị trí "hai tác vụ tìm kiếm đã hoàn thành, một tác vụ phân tích bị timeout". Khi khôi phục bắt buộc phải tái dựng lại được quan hệ phụ thuộc và các sản phẩm đã được xác nhận.

Việc khôi phục cũng hiếm khi tiếp tục từ một dòng code Java cụ thể. Một vai trò có thể thực thi lại từ node ReAct hoặc ngay trước khi gọi công cụ, vì vậy các công cụ thuộc dạng đọc (read-only) có thể thử lại có giới hạn; nếu sau này bổ sung các tác dụng phụ ra bên ngoài như giao dịch, thông báo, bắt buộc phải đảm bảo tính idempotent tuyệt đối.

### Xử lý ra sao khi Agent bị timeout?

Việc chạy đồng thời trong cùng tiến trình có thể hủy các Future chưa hoàn thành sau khi hết hạn Deadline giai đoạn, ghi nhận trạng thái timeout và giữ lại các sản phẩm đã hoàn tất. Thao tác hủy chỉ gửi tín hiệu dừng tới tác vụ cục bộ; nếu Agent đã gọi ra mô hình từ xa hoặc công cụ bên ngoài, vẫn cần xác nhận xem request từ xa đã kết thúc chưa và có phát sinh tác dụng phụ hay không.

Khi các vai trò tách thành dịch vụ độc lập, việc phía gọi bị timeout không chứng minh được Worker gốc đã thực sự dừng lại. Khi bộ lập lịch phát hiện Lease hết hạn, trước hết nó sẽ kiểm tra xem Worker và các hệ thống hạ nguồn đã kịp tạo ra Artifact khả dụng nào chưa. Nếu sản phẩm đã tồn tại và kiểm chuẩn đạt, tác vụ có thể tiếp tục tiến bước; nếu kết quả vẫn chưa xác định, bộ lập lịch sẽ tăng `attempt` và `fencingToken`, đưa tác vụ trở lại trạng thái `READY`, để Worker mới khôi phục từ Checkpoint và Artifact URI gần nhất.

Khi Worker cũ sau đó hồi phục và nộp kết quả, Fencing Token hoặc phiên bản cũ sẽ khiến lần ghi này thất bại. Nếu tác vụ vượt quá số lần thử tối đa sẽ chuyển sang `FINAL_FAILED`, hiện trường và các sản phẩm đã hoàn thành được giữ nguyên để chờ con người vào xử lý.

Bên cạnh `lastHeartbeatAt`, cần ghi nhận thêm `lastProgressAt` để nhận biết tình trạng "tiến trình vẫn sống nhưng ReAct liên tục chạy lòng vòng không có tiến triển".

### Khi gặp thất bại cục bộ: Chờ, hạ cấp hay trả về kết quả một phần?

Cách xử lý phụ thuộc vào tiêu chí thành công của tác vụ, và phải được quy ước trong hợp đồng tác vụ trước khi chạy. Khi thiếu chiều thông tin bắt buộc thì có thể cho toàn bộ thất bại; khi nhiều nhánh cùng loại chỉ cần đạt số lượng quy định thì có thể hợp nhất theo Quorum; các tác vụ cho phép hoàn thành một phần thì trả về kết quả sẵn có kèm đánh dấu rõ các phần còn thiếu. Các công cụ, model và nguồn dữ liệu dự phòng thuộc về Fallback; các tác vụ giá trị cao hoặc rủi ro cao có thể chuyển giao cho con người bổ sung.

AgentInvest áp dụng chiến lược Best-effort có điều kiện: Nhà nghiên cứu bắt buộc phải thành công, Chuyên gia kỹ thuật và Chuyên gia dư luận phải thành công ít nhất một bên, thì Giám đốc đầu tư mới tiếp tục. Khi phân tích kỹ thuật lỗi nhưng dư luận thành công, Giám đốc đầu tư có thể căn cứ kết quả sẵn có để tiếp tục, nhưng trạng thái vận hành vẫn phải ghi nhận nhánh kỹ thuật đã thất bại, không thể coi lần phân tích này là thành công toàn diện. Nếu cả hai vai trò bổ trợ đều thất bại, hệ thống dứt khoát không cho Giám đốc đầu tư gượng ép kết luận.

![Chiến lược xử lý khi nhánh đa Agent gặp sự cố](/media/jg/ext/oss.javaguide.cn/javaguide/ai/agent/multi-agent-partial-failure-strategies-d5c8085b.webp)

### Đền bù tác dụng phụ ra bên ngoài như thế nào?

Các thao tác như hoàn tiền, gửi email, tạo ticket, sửa code và release phiên bản đều làm thay đổi trạng thái bên ngoài. Những thao tác này nên được bàn giao thống nhất cho một Action Executor, các Agent phân tích và sinh văn bản chỉ được phép nộp ý định hành động kèm tham số.

Action Executor sau khi nhận yêu cầu sẽ kiểm tra danh tính, quyền hạn và mức độ rủi ro, các hành động rủi ro cao sẽ chờ con người phê duyệt. Khi thực thi phải dùng idempotent key và ràng buộc duy nhất trong cơ sở dữ liệu, đồng thời tùy theo nghiệp vụ mà ghi nhận Transaction, Outbox hoặc Saga. Sau khi hoàn thành phải kiểm chứng trạng thái bên ngoài và lưu bản ghi kiểm toán; khi thất bại sẽ căn cứ vào các bước đã thực hiện để chọn cách đền bù (compensation) hoặc chuyển cho con người xử lý.

Đền bù không đồng nghĩa với rollback trong cơ sở dữ liệu. Hành động "đã gửi một email" thường không thể thu hồi lại được, mà chỉ có thể gửi thêm một email đính chính. Bản thân thao tác đền bù cũng có thể thất bại, do đó cần có cơ chế idempotent, thử lại và lối vào xử lý thủ công. Chi tiết nguyên lý có thể tham khảo bài [Giao dịch phân tán](../../distributed-system/distributed-transaction.md).

## Human-in-the-loop tạm dừng và khôi phục tác vụ ra sao?

Human-in-the-Loop (HITL) diễn ra ngay trong quá trình thực thi tác vụ. Khi Agent CSKH nhận định đơn hàng đủ điều kiện hoàn tiền, nhưng số tiền vượt quá hạn mức tự động duyệt, bộ điều phối sẽ chuyển tác vụ sang trạng thái `WAITING_INPUT`, lưu lại Checkpoint, căn cứ hoàn tiền và tham số chờ thực thi, sau đó giải phóng tài nguyên tính toán hiện tại.

Người phê duyệt sau đó mở tác vụ lên, có thể chọn duyệt, từ chối hoặc sửa đổi tham số. Hệ thống sẽ dùng chính `runId/taskId` ban đầu để khôi phục vận hành, đồng thời kiểm tra lại quyền hạn người duyệt, trạng thái đơn hàng, số tiền hoàn và phiên bản tác vụ. Trong thời gian chờ đợi, nếu bất kỳ điều kiện nào bị biến động thì phê duyệt cũ phải bị vô hiệu hóa ngay lập tức.

Các thao tác rủi ro cao như deploy code, xóa dữ liệu cũng áp dụng cơ chế tạm dừng tương tự. Khi Agent thiếu đầu vào cần thiết, cần bổ sung cấp quyền công cụ, hoặc kết luận giữa các vai trò không thể tự động dung hòa, hệ thống cũng có thể chuyển sang trạng thái chờ. Framework chịu trách nhiệm về cơ chế ngắt và khôi phục, còn mã nghiệp vụ quyết định ai được duyệt, phạm vi duyệt và thời hạn hiệu lực.

## Giám sát (Observability) một lần chạy đa Agent như thế nào?

Một lần chạy của hệ thống đa Agent sẽ phát sinh nhiều tác vụ con, Trace cũng cần bảo tồn cấu trúc quan hệ cha-con này:

```text
ResearchRun
├── Planner
│   └── ModelCall
├── SourceResearchStage
│   ├── OfficialDocsResearcher
│   │   └── WebSearchTool
│   └── PaperResearcher
│       └── PaperSearchTool
├── Analyst
│   └── DataAnalysisTool
└── Reviewer
    └── ModelCall
```

Root Span đại diện cho toàn bộ lượt chạy `ResearchRun`, ghi nhận `runId`, tenant, chủ đề tác vụ cùng phiên bản code và Prompt. Tác vụ của từng vai trò đóng vai trò là Child Span, mang theo ID tác vụ cha, vai trò Agent, model, Skill, trạng thái, số lần `attempt` và lý do dừng. Các lệnh gọi mô hình và công cụ tiếp tục treo bên dưới Span của vai trò đó, ghi nhận tóm tắt tham số và kết quả, phân loại lỗi, Token tiêu thụ, chi phí và độ trễ.

Nhờ có quan hệ cha-con, khi điều tra sự cố mới nhìn ra thời gian bị nghẽn ở khâu xếp hàng chờ, khâu thực thi của vai trò hay khâu hợp nhất sau cùng, cũng như xác nhận được tại sao các nhánh hạ nguồn bị bỏ qua. Một lần thử lại phải tiếp tục nằm dưới tác vụ của vai trò gốc với chỉ số `attempt` mới, không được đội lốt thành một lệnh gọi hoàn toàn mới.

Frontend có thể hiển thị việc bắt đầu vai trò, gọi công cụ, tóm tắt kết quả và đầu ra cuối cùng qua SSE hoặc WebSocket, nhưng luồng sự kiện không được coi là nguồn chân lý của trạng thái tác vụ. Việc khôi phục sau khi mất kết nối, phát lại (replay) và kiểm toán bắt buộc phải đọc từ trạng thái Agent, lịch sử chạy Workflow và Artifact đã được lưu bền vững.

Kết quả định tuyến mô hình cũng phải ghi vào Trace ngay khi bắt đầu gọi, ghi rõ provider và model thực tế đã sử dụng. Nếu để chạy xong xuôi mới định tuyến lại để bổ sung log, dữ liệu giám sát có thể bị ghi nhận nhầm sang một mô hình khác.

Chuẩn [GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/) của OpenTelemetry liệt kê các tên thao tác như `invoke_agent`, `invoke_workflow`, `execute_tool`, cùng các thuộc tính liên quan đến Agent, Conversation, Tool và lượng Token tiêu thụ; các quy ước này hiện vẫn đang trong giai đoạn phát triển (Development). Tham số và kết quả công cụ có thể chứa dữ liệu nhạy cảm, chuẩn này cũng khuyến cáo rõ không nên ghi mặc định các trường này. Hệ thống production cần áp dụng tóm tắt, khử nhạy cảm, lấy mẫu (sampling) và phân quyền truy cập.

### Đa Agent cần những chỉ số đặc thù nào?

Khi tác vụ thất bại, trước tiên hãy xem tỷ lệ thành công, tỷ lệ timeout và phân bổ số lần retry của từng vai trò, sau đó đào sâu xuống tỷ lệ lỗi và độ trễ P95 của mô hình cùng công cụ. Nếu một vai trò nào đó liên tục chạm trần số vòng lặp ReAct, nó thường sẽ kéo theo Token, chi phí và thời gian của cả giai đoạn đó tăng vọt.

Giai đoạn chạy song song cần ghi nhận thêm thời gian chờ trong hàng đợi, số lượng đồng thời thực tế và thời gian thực thi của nhánh chạy chậm nhất. Sau khi vai trò bàn giao, tiếp tục thống kê số lần kiểm chuẩn kết quả có cấu trúc bị thất bại, số lần phải làm lại và số lần hạ nguồn bị bỏ qua. Cuối cùng mới nhìn vào tổng lượng Token, tổng chi phí, P95 của toàn bộ tác vụ, cũng như thời gian chờ sự kiện frontend đầu tiên so với thời gian chờ kết quả trọn vẹn.

Dù nhiều nhánh đã chạy song song, độ trễ end-to-end vẫn bị chi phối bởi nhánh chậm nhất cộng với khâu hợp nhất cuối cùng. Nếu sau khi song song hóa mà hệ thống không nhanh hơn, hãy kiểm tra hạn ngạch đồng thời, giới hạn tần suất của API bên ngoài, các lệnh gọi công cụ tốn thời gian và thời gian xử lý tại node hợp nhất.

## Đánh giá (Evaluation) hệ thống đa Agent ra sao?

Vì mỗi lần chạy ReAct có thể lựa chọn thứ tự công cụ khác nhau, việc đánh giá không cần phải đối chiếu từng node theo một quỹ đạo cứng nhắc cố định. Trước hết kiểm tra xem Subagent có bàn giao kết quả đúng hợp đồng tác vụ hay không, tiếp theo kiểm tra bộ điều phối có tuân thủ các quy tắc phụ thuộc, tính đồng thời và điều kiện bỏ qua hay không, cuối cùng xác nhận node hợp nhất có bỏ sót các xung đột, trích dẫn hay thông báo thất bại từ thượng nguồn hay không.

Tác vụ khảo sát kỹ thuật có thể dùng code tự động để kiểm tra định dạng trích dẫn, mốc thời gian nguồn, các trường bắt buộc và sự tồn tại của Artifact, sau đó mới đánh giá xem kết luận có được chứng cứ hỗ trợ hay không. Việc đăng ký công cụ, phân quyền vai trò, phụ thuộc tác vụ, trần đồng thời, hủy khi timeout và cô lập ngữ cảnh đều có quy tắc rõ ràng, hoàn toàn có thể kiểm chứng bằng Unit Test và Integration Test.

Năng lực phục hồi phải được kiểm chứng qua việc tiêm lỗi (fault injection): thử làm một Agent tìm kiếm bị timeout để xem các sản phẩm khác có được giữ lại không, Reviewer có tiếp tục dựa theo ngưỡng thành công không; thử để công cụ trả về dữ liệu lỗi xem vai trò có đánh dấu thành công sai không; đưa vào các nguồn tài liệu xung đột nhau để xác nhận node hợp nhất có lưu lại sự bất đồng và bằng chứng hay không.

Chất lượng của khuyến nghị cuối cùng vẫn cần một tập tác vụ cố định, chạy nhiều lần và có sự hiệu chuẩn của con người. Định nghĩa về Task, Trial, Grader, Outcome và Transcript có thể xem tại [Hệ thống đánh giá ứng dụng AI](../llm-basis/llm-evaluation.md).

Đa Agent cũng cần có nhóm đối chứng: cho một Agent đơn lẻ dùng toàn bộ công cụ, rồi so sánh với Workflow đa Agent cố định và kiến trúc Supervisor điều phối động; cả ba nhóm dùng chung snapshot đầu vào, cùng mô hình và cùng ngân sách. Sau khi so sánh tỷ lệ gọi công cụ cần thiết, độ bao phủ chứng cứ, lỗi sự thật, độ trễ P95, Token và chi phí, lúc đó mới có thể khẳng định chắc chắn việc phân rã đa Agent có thực sự đem lại giá trị thặng dư hay không.

Kỹ thuật loại bỏ vai trò (role ablation) cũng rất trực quan: thử bỏ đi một Agent tìm kiếm, một Reviewer hoặc một node hợp nhất rồi đánh giá lại; nếu chất lượng, độ bao phủ và khả năng phục hồi hầu như không đổi, vai trò đó rất có thể chỉ làm phát sinh thêm các lệnh gọi tốn kém.

## Những sai lầm dễ mắc phải nhất khi thiết kế đa Agent

### Tên vai trò có thể dùng làm ranh giới Agent không?

Những danh xưng như Nhà nghiên cứu, Chuyên gia phân tích, Reviewer chỉ thể hiện sự phân công vai trò trên mặt ý niệm, không chứng minh được hệ thống đã thực sự phân tách thành đa Agent. Nếu chúng dùng chung một ngữ cảnh và một bộ công cụ, mỗi bước chỉ là viết lại văn bản của bước trước, thì cách triển khai này vẫn gần với một Prompt Chain hơn.

Để đánh giá xem có thực sự phân tách thành đa Agent hay không, hãy nhìn vào việc mỗi vai trò có thể độc lập tiếp nhận mục tiêu con, hoàn thành nhiệm vụ trong phạm vi ngữ cảnh và công cụ bị giới hạn, rồi bàn giao kết quả theo đúng Schema quy ước hay không. Nếu thiếu những ranh giới hoạt động này mà chỉ thay đổi đoạn System Prompt, hệ thống hoàn toàn không có được ranh giới Agent thực chất.

### Đa Agent có bắt buộc phải chạy song song không?

Trong AgentInvest, Nhà nghiên cứu bắt buộc phải đưa ra kết luận cơ bản trước, Giám đốc đầu tư cũng phải đợi các tác vụ thượng nguồn hoàn tất mới tổng hợp được; chỉ có nhánh phân tích kỹ thuật và phân tích dư luận độc lập là thích hợp chạy song song. Tính song song do quan hệ phụ thuộc của tác vụ quyết định, không có mối liên hệ tất yếu với việc hệ thống có bao nhiêu Agent. Reviewer, Handoff hay Group Chat thảo luận theo lượt đều có thể thực thi tuần tự. Việc cố tình ép chạy song song khi chưa xác nhận đầu vào đã sẵn sàng hay kết quả sẽ hợp nhất ra sao chỉ làm gia tăng độ phức tạp của việc quản lý trạng thái và xử lý sự cố.

### Các bước tất định có cần giao cho Agent không?

Đầu vào có hợp lệ không, vai trò hiện tại được gọi những công cụ nào, sản phẩm thượng nguồn đã đủ chưa... những phán đoán này đều có quy tắc rõ ràng, hãy giao cho code và máy trạng thái xử lý. Việc hủy khi timeout, giới hạn số lần retry và thứ tự các giai đoạn cũng nên do runtime cưỡng chế thực thi. Agent thích hợp hơn cho những công việc đòi hỏi phán đoán ngữ nghĩa—chẳng hạn chọn hướng tìm kiếm, giải thích các tài liệu mâu thuẫn, và tổng hợp kết luận từ nhiều vai trò. Nhồi nhét các quy tắc tất định vào Prompt không những chạy chậm hơn, mà còn biến những hành vi vốn có thể tái hiện ổn định thành những trò chơi xác suất may rủi.

### Tất cả các Agent có nên chia sẻ toàn bộ ngữ cảnh không?

Trong khảo sát kỹ thuật, Agent tìm kiếm có thể cào hàng chục trang web và sinh ra nhiều lượt log công cụ. Reviewer thông thường chỉ cần kết luận, trích dẫn, các phần còn thiếu và Artifact URI, hoàn toàn không cần phát lại toàn bộ quá trình tìm kiếm thô. Khi thực sự cần đối soát chứng cứ gốc mới đọc theo URI. Mỗi Agent chỉ nhận nhiệm vụ của mình, công cụ khả dụng và kết quả thượng nguồn cần thiết; điều này vừa giúp kiểm soát Token, vừa giảm thiểu sự quấy nhiễu của các thông tin rác đối với vai trò hiện tại.

### Xung đột ghi đồng thời có thể để các mô hình tự thảo luận giải quyết không?

Cần phân biệt rạch ròi giữa xung đột kết luận và xung đột ghi dữ liệu. Hai Agent phân tích đưa ra nhận định khác nhau trên cùng một tập dữ liệu có thể giữ lại chứng cứ riêng để Reviewer hoặc node hợp nhất phán đoán. Nhưng hai nhánh cùng lúc ghi đè vào trường `finalOutput` là bài toán xung đột ghi đồng thời, việc để các mô hình thảo luận với nhau không thể giải quyết được.

Kết quả chạy song song phải được lưu riêng theo từng vai trò, báo cáo cuối cùng chỉ cho phép node hợp nhất được ghi. Các thao tác gửi thông báo, tạo ticket, hoàn tiền còn phát sinh tác dụng phụ ra bên ngoài, bắt buộc phải dùng idempotent key, ràng buộc duy nhất và transaction bảo vệ, không thể trông chờ vào Prompt để tránh việc thực thi trùng lặp.

### Chỉ thiết kế luồng chạy thông suốt (Happy Path) sẽ gặp vấn đề gì?

Giả sử hai Agent tìm kiếm chạy song song, một bên thành công, bên kia bị timeout. Lúc này giữ lại tài liệu sẵn có để giao tiếp cho Reviewer, hay xác định tài liệu chưa đủ và kết thúc tác vụ, hoàn toàn phụ thuộc vào ngưỡng thành công đã quy ước từ trước. Khi thiết kế tác vụ phải bao quát được các trạng thái: thành công một phần, timeout, hủy bỏ, thiếu sản phẩm bắt buộc và bỏ qua hạ nguồn. Nếu không, dù sơ đồ luồng chạy trơn tru trên giấy, khi gặp phải ngoại lệ thực tế đầu tiên trên môi trường production, bộ điều phối sẽ lúng túng không biết nên tiếp tục, hạ cấp hay dừng lại.

### Tại sao không thể chỉ nghiệm thu câu trả lời cuối cùng?

Ngay cả khi một công cụ tìm kiếm nào đó bị gọi thất bại hoàn toàn, mô hình vẫn có thể sinh ra một bản báo cáo trôi chảy, câu từ gãy gọn và cấu trúc hoàn chỉnh. Nếu chỉ nhìn vào câu chữ cuối cùng, bạn rất dễ lầm tưởng kết quả đó là một lần thực thi thành công.

Khi nghiệm thu, bắt buộc phải đối soát xem các công cụ cần thiết có được gọi thành công không, từng vai trò có bàn giao đúng hợp đồng không, các trích dẫn có truy nguyên được về tài liệu gốc không, và node hợp nhất có giấu nhẹm các nhánh thất bại hay không. Câu trả lời cuối cùng chỉ là một trong các sản phẩm đầu ra, không thể thay thế cho việc kiểm chứng toàn bộ quá trình thực thi.
