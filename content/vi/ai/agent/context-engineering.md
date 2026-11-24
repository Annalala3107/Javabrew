---
title: "Context Engineering là gì? Khác biệt gì so với Prompt Engineering?"
description: "Phân tích chuyên sâu về các khái niệm cốt lõi của Context Engineering, bao gồm điều phối quy tắc tĩnh, gắn thông tin động, hạ cấp hạn ngạch Token, chiến lược nạp theo nhu cầu và lưu trữ ngữ cảnh tác vụ dài, giúp lập trình viên xây dựng hệ thống cung cấp ngữ cảnh tỷ lệ tín hiệu trên nhiễu (SNR) cao cho Agent."
category: Phát triển ứng dụng AI
head:
  - - meta
    - name: keywords
      content: Context Engineering, kỹ nghệ ngữ cảnh, Agent, LLM, RAG, Prompt Engineering, Compaction, Sub-agent
lang: vi
sourceRef: zh-ref/ai/agent/context-engineering.md
---

Cửa sổ ngữ cảnh (Context Window) chứa được nhiều tài liệu hơn không đồng nghĩa với việc Agent sẽ khai thác ổn định những tài liệu đó. Trong một lần gọi mô hình, nếu bị lẫn lộn trạng thái đã lỗi thời, log không liên quan hoặc hàng chục mô tả công cụ tương tự nhau, mô hình vẫn rất dễ bỏ sót những điều kiện thực sự quyết định việc ra quyết định.

Context Engineering xử lý chính khâu lắp ráp thông tin trước khi gọi mô hình: quy tắc nào đưa vào message, bằng chứng nào truy xuất theo nhu cầu, công cụ nào hiển thị trong giai đoạn hiện tại, khi nào nén lịch sử, và kết quả gốc giữ lại trích dẫn ra sao. Đối với các tác vụ dài, nó còn phải xử lý việc bàn giao trạng thái xuyên qua các cửa sổ ngữ cảnh, tránh việc sau khi tóm tắt bị mất đi các ràng buộc, số hiệu phiên bản và những đầu việc chưa hoàn thành.

## Cùng là Agent, vì sao hiệu quả lại chênh lệch nhiều đến thế?

![Minh họa kịch bản hậu mãi thương mại điện tử giải thích vì sao cùng là Agent mà hiệu quả lại khác biệt lớn](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-the-same-agent-performs-so-differently-1c2b4b4f.png)

Hãy lấy ví dụ về kịch bản hậu mãi trong thương mại điện tử.

Khách hàng gửi tới một câu: "Tai nghe tôi mua tuần trước bên tai phải không có tiếng, xử lý thế nào?"

Nếu Agent nhận được rất ít ngữ cảnh, nhiều khả năng nó sẽ phản hồi chung chung: "Rất xin lỗi vì sự bất tiện này. Xin hỏi quý khách đã mua mẫu tai nghe nào? Mã đơn hàng là gì? Quý khách có thể mô tả cụ thể biểu hiện lỗi được không?"

Câu trả lời này tuy lịch sự nhưng lại gây bực bội trong kịch bản chăm sóc khách hàng. Nó chỉ biết rập khuôn hỏi đáp theo quy trình chứ không hề chủ động thu thập và xử lý thông tin.

Bây giờ hãy xem hiệu quả khi viết lại với một ngữ cảnh đầy đủ.

Trước khi gọi LLM, hệ thống chủ động tra cứu trước toàn bộ thông tin có thể kiểm tra:

- Tra cứu hệ thống đơn hàng, định vị lịch sử mua tuần trước: Sony WH-1000XM5, đặt hàng ngày 25 tháng 3
- Kiểm tra trạng thái bảo hành: vẫn nằm trong thời hạn 7 ngày đổi trả vô điều kiện
- Tra cứu lịch sử ticket: khách hàng thân thiết, trước đây chưa từng có tranh chấp hậu mãi
- Gắn sẵn các công cụ `create_return_order` và `check_inventory`

Khi đó, Agent có thể phản hồi một cách chủ động: "Dạ xin chào anh/chị, em đã kiểm tra thấy đơn hàng tai nghe Sony WH-1000XM5 anh/chị mua ngày 25 tháng 3 hiện vẫn nằm trong thời hạn đổi mới. Em có thể hỗ trợ tạo ngay yêu cầu đổi hàng cho mình; kho hiện hiển thị vẫn còn sẵn hàng cùng loại, dự kiến 2–3 ngày sẽ giao sản phẩm mới đến anh/chị. Em tiến hành thao tác cho mình luôn nhé?"

Sự chênh lệch lộ rõ ngay lập tức: câu trả lời phía sau thực sự đang giải quyết vấn đề, chứ không tiếp tục đẩy câu hỏi ngược lại cho người dùng.

Tất nhiên, nhiều thất bại của Agent đúng là có liên quan đến ngữ cảnh, nhưng ngữ cảnh không phải là nguyên nhân duy nhất. Thiết kế công cụ, phân rã nhiệm vụ, quản lý trạng thái, cơ chế kiểm chứng—những yếu tố này thường cần phải được xem xét một cách đồng bộ.

Tuy nhiên có một điều chắc chắn: **Khi ngữ cảnh không đủ, mô hình có mạnh đến đâu cũng chỉ biết đoán mò; khi ngữ cảnh được cung cấp chuẩn xác, một mô hình tầm trung cũng có thể hoàn thành tốt nhiệm vụ.**

## Context Engineering thực chất đang làm gì?

![Khác biệt giữa Context Engineering và Prompt Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-context-engineering-dimen-10eadd1a.png)

### Khác biệt với Prompt Engineering

Tobi Lütke đã đúc kết Context Engineering thành một câu:

> the art of providing all the context for the task to be plausibly solvable by the LLM

Dịch ra là: nghệ thuật cung cấp toàn bộ ngữ cảnh cần thiết để nhiệm vụ có khả năng giải quyết được (plausibly solvable) trong phạm vi năng lực của LLM. Chữ **plausibly** ở đây ám chỉ các điều kiện tiên quyết: khi thiếu trạng thái đơn hàng, ranh giới quyền hạn hoặc các ràng buộc của hệ thống cũ, mô hình hoàn toàn không có đủ căn cứ để đưa ra phán đoán tin cậy.

Prompt Engineering xử lý cách viết câu lệnh; Context Engineering quyết định một lượt gọi thực tế mang theo những thông tin gì, và những thông tin đó đi vào hoặc rời khỏi cửa sổ ngữ cảnh vào thời điểm nào.

- Prompt Engineering quan tâm đến bản thân chỉ thị được viết ra sao—câu chữ, thứ tự, định dạng, giọng điệu...
- Context Engineering quan tâm đến một bài toán khác: trước lượt gọi này, trong cửa sổ của mô hình nên đặt những thông tin gì, đặt theo cấu trúc nào, khi nào đưa vào và khi nào nên thu hồi ra.

Blog kỹ thuật chính thức của Anthropic dùng hình minh họa dưới đây để so sánh hai tầng này:

![Prompt engineering vs. context engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-vs-prompt-engineering-1c13a869.webp)

Lấy một ví dụ ẩn dụ: Nếu Prompt Engineering là "hướng dẫn đầu bếp cách nấu món ăn này", thì Context Engineering giống như việc "chuẩn bị gian bếp cho đầu bếp"—nguyên liệu để ở đâu, dao thớt sắp xếp ra sao, gia vị phân loại thế nào, bảng canh nhiệt độ dán ở vị trí nào.

![So sánh chiều kích kỹ thuật giữa Prompt và Context](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/prompt-vs-context-engineering-dimension-comparis-2aad305a.svg)

Tôi thích một cách so sánh khác hơn: **Context Engineering chính là quản lý bộ nhớ (Memory Management) cho LLM.**

Cửa sổ ngữ cảnh giống như một vùng bộ nhớ RAM hữu hạn. Context Engineering quản lý xem vùng nhớ này chứa gì, hoán đổi (swap out) cái gì, khi nào đọc, khi nào ghi. Khi cửa sổ đầy thì phải loại bỏ bớt nội dung, tư duy này hoàn toàn tương đồng với các thuật toán thay thế trang (Page Replacement) trong hệ điều hành như LRU, chiến lược theo độ ưu tiên... Khi bàn về hạ cấp Token (Token budget degradation) ở phần sau, thực chất chúng ta cũng đang xử lý đúng bài toán này.

### Nó quản lý cụ thể những thành phần nào?

![Cửa sổ ngữ cảnh (Context Window) = Bộ nhớ làm việc của LLM](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-context-window-e2089807.png)

Nếu bóc tách chi tiết, Context Engineering tối thiểu quản lý các khối sau:

System Prompt là chỉ thị có độ ưu tiên cao trong tin nhắn API. Các file như `.cursor/rules`, `.claude/rules`, `AGENTS.md` là các nguồn quy tắc được chương trình host đọc vào; host sẽ căn cứ theo quy tắc nạp của riêng mình để chuyển đổi một phần trong đó thành ngữ cảnh cho mô hình; chúng không đồng nhất với khái niệm vai trò System Prompt ở cấp độ API. File `.cursorrules` mà Cursor dùng thời kỳ đầu đã là định dạng cũ, các dự án mới nên dùng `.cursor/rules`.

User Prompt là dữ liệu nghiệp vụ và chỉ thị do người dùng nhập vào. Nhìn bề ngoài có vẻ đơn giản, nhưng trong dự án thực tế thường bị lẫn lộn giữa ngôn ngữ tự nhiên, trường nghiệp vụ, trạng thái lịch sử, nội dung file đính kèm; nếu xử lý không khéo sẽ làm bẩn ngữ cảnh.

Memory được chia thành ngắn hạn và dài hạn. Bộ nhớ ngắn hạn thường là cửa sổ trượt (sliding window) bên trong Session. Bộ nhớ dài hạn không nhất thiết chỉ là vector database—file, KV store, cơ sở dữ liệu quan hệ, graph database, tầng tìm kiếm vector đều có thể áp dụng. Câu hỏi then chốt là: ghi lại cái gì, ghi khi nào, cập nhật ra sao, quên thế nào, và sau khi triệu hồi (recall) thì đưa vào ngữ cảnh hiện tại bằng cách nào.

RAG & Tools cũng thuộc phạm vi này. RAG chịu trách nhiệm truy xuất tài liệu bên ngoài để đưa nội dung liên quan vào ngữ cảnh, còn Tools chịu trách nhiệm gắn mô tả công cụ, định dạng tham số và kết quả gọi vào ngữ cảnh. Thực chất có thể coi RAG là một triển khai cụ thể của Context Engineering—nó trả lời cho các câu hỏi: "truy xuất cái gì, truy xuất thế nào, kết quả đưa vào ngữ cảnh ra sao".

JSON Schema, cấu trúc tham số của Function Calling và ràng buộc trả về sẽ giới hạn lượt gọi hiện tại, do đó cũng thuộc về một phần của ngữ cảnh. Observation sau khi gọi công cụ thì cần phân định rõ: giữ nguyên văn, ghi bản tóm tắt, hay dọn dẹp ở các lượt tiếp theo; nếu không thiết kế từ đầu, giai đoạn parse và phát lại (replay) sẽ để lại lượng lớn dữ liệu rất khó xử lý.

Nén tóm tắt, loại bỏ lịch sử và Context Caching đều thuộc về các biện pháp quản lý Token. Chúng đòi hỏi sự đánh đổi giữa việc lưu giữ thông tin và chi phí gọi mô hình.

## Vì sao ngữ cảnh lại mất hiệu lực?

![Vì sao ngữ cảnh lại mất hiệu lực](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-does-the-following-content-fail-7c336a26.png)

Khi dung lượng cửa sổ tăng lên, bài toán sàng lọc thông tin vẫn tồn tại. Khi dữ liệu đầu vào vượt quá phạm vi nhiệm vụ hiện tại cần, tài liệu bổ sung có thể chỉ làm tăng thêm tạp âm gây nhiễu.

![Hiện tượng ngưỡng 40% trong tỷ lệ tận dụng ngữ cảnh](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-utilization-40-percent-threshold-phenome-b46a6ca1.svg)

Con số 40% trong hình xuất phát từ quan sát thực nghiệm trên một số mô hình và nhiệm vụ cụ thể, không phải là một ngưỡng tuyệt đối phổ quát; sai lệch vị trí của Lost in the Middle và sự suy giảm hiệu quả khai thác thông tin khi ngữ cảnh phình to là hai vấn đề khác nhau, không được đánh đồng.

Lấy ví dụ về việc tái cấu trúc đăng nhập cho người dùng cũ: tài liệu yêu cầu cũ, tài liệu API và biên bản cuộc họp cùng lúc đưa vào cửa sổ. Trong đó, câu "vẫn phải phụ thuộc vào logic xác thực token cũ, không thể chuyển đổi trực tiếp sang module xác thực mới" có thể chỉ chiếm đúng 1 dòng. Dù mô hình đã đọc toàn bộ tài liệu, nó vẫn hoàn toàn có thể không coi dòng này là tiền đề của phương án.

**Context Rot** (ngữ cảnh bị phân rã/thối rữa) đề cập chính xác đến hiện tượng này: khi đầu vào dài ra, tạp âm tăng lên, khả năng mô hình khai thác các bằng chứng then chốt có thể không còn ổn định nữa.

![Sơ đồ ngữ cảnh phân rã](/media/jg/ext/oss.javaguide.cn/javaguide/ai/harness/context-rot-diagram-455c3d66.png)

Liên quan mật thiết đến nó là một hiện tượng kinh điển mang tên **Lost in the Middle**—mô hình nhạy cảm hơn với thông tin ở phần đầu và phần cuối, và rất dễ "bỏ quên" những thứ bị kẹp ở giữa. Vì vậy đôi khi bạn rõ ràng đã cung cấp tài liệu cho nó nhưng nó vẫn trả lời sai, không hẳn vì nó không đọc, mà vì nội dung then chốt không đủ nổi bật trong một ngữ cảnh dài.

Trong kiến trúc Transformer, mô hình không đọc văn bản từng dòng tuần tự như con người. Nó thông qua Attention để phán đoán: đối với câu hỏi hiện tại, cần tập trung chú ý vào những nội dung nào trong ngữ cảnh. Bạn có thể hiểu Attention như một cơ chế "chấm điểm mức độ liên quan". Ví dụ bạn hỏi "vì sao giao diện này bị timeout", mô hình sẽ tìm kiếm trong ngữ cảnh các thông tin liên quan đến giao diện, timeout, log, SQL, cache, dependency bên ngoài. Khi ngữ cảnh ngắn, tạp âm ít, việc tìm ra trọng tâm rất dễ dàng.

Nhưng nếu bạn nhồi nhét cùng lúc hàng chục trang tài liệu, hàng trăm dòng log, hàng chục đoạn giải thích bối cảnh, tình hình sẽ hoàn toàn khác. Mô hình không phải cứ nhìn thấy thông tin là sẽ dùng tốt thông tin; nó còn phải phán đoán xem trong lượng nội dung khổng lồ đó cái nào là quan trọng nhất. Ngữ cảnh càng dài, thông tin ứng viên càng nhiều, yếu tố gây nhiễu càng lớn, sự chú ý (Attention) càng dễ bị phân tán. Nếu xét theo full attention chuẩn mực, mỗi Token đều phải tính toán quan hệ chú ý với mọi Token khác, Token càng nhiều thì áp lực tính toán và sàng lọc đều tăng vọt. Tuy nhiên hiện nay nhiều mô hình ngữ cảnh dài áp dụng sparse attention, chunking, caching, nén để giảm chi phí, nên cũng không thể khẳng định một cách máy móc rằng cứ ngữ cảnh dài là chắc chắn kém đi.

Cách diễn đạt chính xác hơn là: **Ngữ cảnh dài làm tăng độ khó cho mô hình trong việc sàng lọc thông tin then chốt và làm tăng chi phí suy luận, nhưng mức độ suy giảm cụ thể phụ thuộc vào chính bản thân mô hình, cấu trúc của ngữ cảnh và loại nhiệm vụ.**

Điều này cũng giải thích vì sao: một số mô hình tuyên bố hỗ trợ cửa sổ 100K, 200K, nhưng trong thực tế sử dụng chưa chắc đã xử lý ổn định khi cửa sổ chạm ngưỡng tối đa.

Chứa được vào cửa sổ và khai thác tốt là hai chuyện hoàn toàn khác nhau.

Trong thực tế điều này quá phổ biến. Bạn đưa tài liệu dự án, interface doc, biên bản họp, yêu cầu lịch sử cho mô hình, rồi hỏi: "Xem giúp tôi thay đổi này có ảnh hưởng đến luồng đăng nhập của người dùng cũ không?".

Thông tin then chốt có thể chỉ là một câu: Luồng đăng nhập của người dùng cũ vẫn phụ thuộc vào logic xác thực token phiên bản cũ, không thể chuyển thẳng sang module auth mới. Nhưng câu này bị kẹp giữa hàng đống thông tin bối cảnh, mô hình rất có thể sẽ bỏ qua nó và đưa ra một phương án nhìn bề ngoài có vẻ hợp lý nhưng thực tế lại tiềm ẩn rủi ro lớn.

Điểm khó của ngữ cảnh dài là làm sao tìm ra nội dung then chốt một cách ổn định. Khi lắp ráp ngữ cảnh cần xóa bỏ thông tin trùng lặp, đặt các ràng buộc nhiệm vụ ở vị trí nổi bật; văn bản dài cần chia đoạn, lập chỉ mục hoặc tóm tắt trước, đồng thời lưu giữ trích dẫn có thể đối chiếu lại cho các bằng chứng quan trọng. Mức độ giữ lại cụ thể bao nhiêu cần được đánh giá dựa trên mô hình mục tiêu và quỹ đạo nhiệm vụ thực tế.

## Đánh giá Context Engineering cải thiện như thế nào?

Việc này không thể chỉ dựa vào cảm giác chủ quan. Một ảo giác rất hay gặp là: sau khi sửa đổi, Agent nhìn bề ngoài có vẻ "chuyên nghiệp hơn", nhưng tỷ lệ thành công thực tế không tăng, trong khi chi phí lại đội lên.

Khuyến nghị ít nhất nên theo dõi sát sao 5 nhóm chỉ số sau:

| Loại chỉ số | Xem xét cụ thể điều gì |
| --- | --- |
| Tỷ lệ thành công nhiệm vụ | Có hoàn thành mục tiêu không, có cần con người can thiệp xử lý không, có tái hiện ổn định lộ trình thành công không |
| Chất lượng công cụ | Chọn sai công cụ, bỏ sót gọi công cụ, lỗi tham số, gọi lặp lại, tỷ lệ chặn thao tác nguy hiểm |
| Chi phí ngữ cảnh | Token đầu vào, Token đầu ra, tỷ lệ trúng cache, tỷ lệ giữ lại thông tin sau khi nén |
| Chỉ số độ trễ | Độ trễ Token đầu tiên (TTFT), tổng thời gian đầu-cuối, thời gian chờ công cụ, thời gian phản hồi p95 / p99 |
| Chất lượng kết quả | Tỷ lệ ảo giác, độ chính xác trích dẫn bằng chứng, tỷ lệ thất thoát tóm tắt, tỷ lệ bỏ sót trường dữ liệu then chốt |

Cách làm đề xuất là trước tiên hãy chọn 20 đến 50 quỹ đạo nhiệm vụ thực tế để lập thành một tập kiểm thử nhỏ, sau đó mới tiến hành sửa đổi việc truy xuất, nén, Schema công cụ, Prompt... Mỗi lần chỉ sửa đổi một biến số duy nhất, nếu không bạn sẽ rất khó biết được hiệu quả thực sự bắt nguồn từ đâu.

## Nạp ngữ cảnh trong thời gian chạy (Runtime) như thế nào?

![Truy xuất ngữ cảnh lúc runtime như thế nào](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-run-time-retrieval-b8f9e4ab.png)

### Vì sao tiền truy xuất là chưa đủ?

Tiền truy xuất (pre-retrieval) lấy lại các đoạn văn bản dựa trên độ tương đồng Embedding trước khi gọi LLM, sau đó nhồi tất cả một lượt vào Prompt. Các câu hỏi đáp đơn giản như FAQ có thể đi theo chuỗi này; nhưng đối với các tác vụ Agent phức tạp, thông tin liên quan sẽ liên tục thay đổi theo quá trình thực thi.

Tiền truy xuất chỉ có thể xếp hạng dựa trên những mục tiêu đã biết trước khi gọi. Những manh mối mới do Agent phát hiện ra sau khi gọi công cụ sẽ không thể xuất hiện trong kết quả của lần truy xuất ban đầu đó.

### Nạp theo nhu cầu Just-in-Time

Just-in-Time sẽ lưu giữ các tham chiếu nhẹ như đường dẫn file, câu truy vấn database hoặc liên kết web; khi nhiệm vụ thực sự cần đến nội dung cụ thể, nó mới đọc thông qua công cụ.

Lấy ví dụ Claude Code phân tích một codebase lớn: Agent có thể dựa vào cấu trúc thư mục, tên file và kết quả tìm kiếm để thu hẹp phạm vi trước, sau đó dùng `head`, `tail`, `grep` để đọc từng phần. Đường dẫn, kích thước file và timestamp đều là những manh mối định vị, không nhất thiết phải tống toàn bộ nội dung file vào cửa sổ ngay từ đầu.

Bản thân metadata cũng tham gia vào quá trình phán đoán. Ngữ nghĩa đường dẫn của `tests/test_utils.py` và `src/core_logic/test_utils.py` là khác nhau, đủ để gợi ý cho Agent rằng chúng phục vụ cho logic kiểm thử ở các vị trí khác nhau.

Anthropic gọi phương thức thu thập thông tin phân tầng này là **Progressive Disclosure** (Tiết lộ tiệm tiến). Agent thông qua nhiều vòng khám phá để bổ sung ngữ cảnh: kích thước file gợi ý độ phức tạp, timestamp gợi ý tính liên quan thời gian, cấu trúc thư mục cung cấp ngữ nghĩa vị trí. Agent Skills cũng khai thác tư duy này, chi tiết xem tại: [Agent Skills là gì? Khác biệt gì so với Prompt và MCP?](https://javaguide.cn/ai/agent/skills.html).

Nạp theo nhu cầu làm tăng số lần gọi công cụ và độ trễ, đồng thời phụ thuộc lớn vào các công cụ điều hướng như `glob`, `grep`, `tree`. Khi năng lực điều hướng không đủ hoặc quy tắc suy đoán bị sai, Agent có thể tiếp tục tìm kiếm dọc theo hướng sai, tiêu tốn nhiều ngữ cảnh và số lần gọi hơn. Vì vậy vẫn cần phải thiết kế trước chỉ mục, ranh giới công cụ và chiến lược điều hướng.

### Thực tế hơn: Chiến lược hỗn hợp

Trong các dự án thực tế, phương pháp phổ biến hơn là chiến lược hỗn hợp: tri thức tĩnh có tính xác định cao có thể tiền truy xuất, còn thông tin động phát hiện trong quá trình chạy sẽ được kéo về theo nhu cầu. Claude Code cũng hoạt động như vậy—file `CLAUDE.md` có thể nạp trước, nhưng nội dung file cụ thể thì trông cậy vào việc Agent tự khám phá lúc runtime.

Việc lựa chọn giữa các kịch bản cũng có quy luật rõ ràng. Những nhiệm vụ có không gian khám phá rộng và nhiều nội dung động như phân tích codebase, tìm kiếm thông tin sẽ phù hợp với Just-in-Time làm chủ đạo. Những nhiệm vụ có ngữ cảnh ổn định, ít nội dung động như thẩm định văn bản pháp lý, phân tích báo cáo tài chính thì tiền truy xuất kết hợp với bổ sung nhẹ lúc runtime là đã đủ.

| Chiến lược | Ưu điểm | Cái giá phải trả | Tác vụ phù hợp hơn |
| --- | --- | --- | --- |
| Tiền truy xuất | Nhanh, đơn giản, luồng ổn định | Dễ nhồi nhét tạp âm một lần, thiếu linh hoạt lúc chạy | FAQ, hỏi đáp tri thức cố định, thẩm định tài liệu ổn định |
| Just-in-Time | Ngữ cảnh sạch hơn, bằng chứng vào theo nhu cầu | Gọi công cụ nhiều hơn, độ trễ cao hơn | Phân tích codebase, xử lý sự cố, nghiên cứu mở |
| Chiến lược hỗn hợp | Cân bằng giữa tốc độ khởi động và năng lực khám phá lúc chạy | Cần bộ quản lý ngân sách và năng lực điều hướng công cụ | Agent nghiệp vụ phức tạp, tác vụ dài, truy xuất đa nguồn |

Khi lựa chọn chiến lược truy xuất, trước hết hãy xem xét tài liệu của nhiệm vụ có ổn định không, không gian khám phá rộng bao nhiêu, yêu cầu về tính thời gian thực và việc bằng chứng có bắt buộc phải truy vết được hay không, chứ không phải so đo xem phương án nào "cao siêu" hơn.

## Trong các tác vụ dài, làm thế nào để duy trì ngữ cảnh?

![Lưu trữ ngữ cảnh tác vụ dài: Ba vũ khí chống phân rã](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/long-task-context-persistence-three-weapons-agai-8f1648d5.svg)

### Compaction: Nén lịch sử khi cửa sổ sắp đầy

Các nhiệm vụ kéo dài qua nhiều lượt sẽ lưu giữ các phán đoán ban đầu, kết quả công cụ và mục tiêu hiện tại trong lịch sử tin nhắn. Khi tiến sát giới hạn cửa sổ, Compaction sẽ nén lịch sử thành một bản tóm tắt, sau đó dùng bản tóm tắt này cùng các tin nhắn mới để tiếp tục thực thi, từ đó hiện thực hóa việc kết nối xuyên qua các cửa sổ.

Anthropic từng chia sẻ tư duy triển khai trong Claude Code: bản tóm tắt giữ lại các quyết định kiến trúc, bug chưa giải quyết và chi tiết triển khai then chốt, trong khi các kết quả công cụ thừa thãi bị loại bỏ; ngữ cảnh sau khi nén kết hợp với các file truy cập gần nhất để khôi phục trạng thái nhiệm vụ. Chi tiết "5 file" trong bài viết đó chỉ là ví dụ triển khai; phạm vi giữ lại cụ thể cần do nhiệm vụ và ngân sách cửa sổ quyết định.

![Tư duy nén ngữ cảnh của Claude Code](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/claude-code-context-compression-thinking-50657317.png)

Điểm khó ở đây nằm ở sự đánh đổi—giữ lại quá nhiều thì nén không có ý nghĩa, giữ lại quá ít thì ngữ cảnh then chốt lại bị mất. Cách làm thực tế là dùng các quỹ đạo Agent phức tạp để liên tục tinh chỉnh Prompt nén, trước hết đảm bảo thông tin quan trọng không bị sót, sau đó mới dần xóa bỏ các nội dung thừa thãi. Việc này không thể viết chuẩn ngay trong một lần.

Còn một biện pháp nén nhẹ nhàng hơn: dọn dẹp kết quả công cụ. Công cụ đã gọi xong, kết quả đã được tiêu hóa thì về sau không cần thiết phải giữ lại toàn bộ output thô ban đầu. Anthropic Developer Platform đã cung cấp các tính năng như context editing / tool-result clearing, cho phép giữ lại bản ghi `tool_use` trong khi dọn sạch phần thân `tool_result` cũ. Tuy nhiên ngưỡng kích hoạt, số lượng giữ lại... vẫn cần được kiểm thử dựa trên tải nghiệp vụ cụ thể.

### Structured Note-taking: Để Agent ghi chép ghi chú

Structured Note-taking là một phương thức khác để xử lý tác vụ dài. Cho phép Agent ghi các tiến độ then chốt ra file bên ngoài (ví dụ `NOTES.md`), sau khi ngữ cảnh bị reset nó sẽ đọc lại các ghi chú này để tiếp tục làm việc.

Tư duy này hoàn toàn tương đồng với việc các kỹ sư con người viết to-do list hoặc bản ghi nhớ kỹ thuật. Claude Code trong các tác vụ dài sẽ tự động duy trì một to-do list, còn các Agent tự tùy biến cũng có thể duy trì file `NOTES.md` tại thư mục gốc của dự án để ghi lại tiến độ hiện tại, các vấn đề đã biết và kế hoạch bước tiếp theo.

Có một ví dụ rất thú vị: Claude chơi Pokémon. Trải qua hàng nghìn lượt chơi game, Agent tự mình duy trì việc theo dõi chỉ số, ví dụ "1234 bước vừa qua tôi luyện Pikachu ở Route 1, đã lên 8 cấp, còn thiếu 2 cấp nữa là đạt mục tiêu". Nó còn tự phát xây dựng bản đồ, danh sách thành tựu, ghi chú chiến thuật chiến đấu. Sau khi ngữ cảnh bị reset, những ghi chú này vẫn được đọc lại, nhờ đó nó mới có thể liên tục thúc đẩy game qua nhiều giờ liền. Khi Anthropic ra mắt Sonnet 4.5, họ cũng giới thiệu bản thử nghiệm công khai Memory Tool, dùng phương thức lưu trữ bền vững trên hệ thống file để cho phép Agent thiết lập cơ sở tri thức xuyên phiên.

### Sub-agent: Đừng để một Agent gánh toàn bộ trạng thái

Việc truy xuất hoặc đọc code có thể giao cho Sub-agent trong một ngữ cảnh độc lập, Agent chính chỉ tiếp nhận bản tổng hợp bằng chứng. Sub-agent dù có tiêu tốn hàng vạn Token để khám phá thì bản tóm tắt trả về cho Agent chính thông thường cũng chỉ khoảng 1000 đến 2000 Token, giúp quá trình tìm kiếm chi tiết không chiếm dụng lâu dài cửa sổ chính.

Anthropic trong bài viết *How we built our multi-agent research system* đã giới thiệu mô hình truy xuất cô lập và nén gửi ngược này. Việc có áp dụng hay không phụ thuộc vào việc nhiệm vụ có thể phân chia hay không, quan hệ phụ thuộc giữa các nhiệm vụ con, và liệu khi tổng hợp có làm thất thoát bằng chứng then chốt hay không.

![Sub-agent chia nhỏ nhiệm vụ, cô lập ngữ cảnh](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/sub-agent-task-splitting-context-isolation--635196e8.png)

Có thể lựa chọn giữa ba phương thức như sau:

| Kỹ thuật | Kịch bản áp dụng |
| --- | --- |
| Compaction | Quy trình dài cần hội thoại liên tục, trọng tâm là duy trì tính mạch lạc của ngữ cảnh |
| Note-taking | Phát triển lặp lại, có các cột mốc rõ ràng, nhiệm vụ tiến triển qua nhiều bước |
| Sub-agents | Nghiên cứu phức tạp, cần khám phá song song, kết quả cuối cùng cần được tổng hợp lại |

## Triển khai Context Engineering vào thực tế như thế nào?

Trong triển khai kỹ thuật, ta có thể thiết lập một Context Assembler để lắp ráp thống nhất quy tắc, mục tiêu, bằng chứng, bộ nhớ, công cụ và bản tóm tắt lịch sử trước mỗi lần gọi LLM.

### Hệ thống lắp ráp những gì trước một lượt gọi LLM

```text
# Đầu vào: thông tin nhiệm vụ của người dùng, trạng thái phiên hiện tại, ngữ cảnh nghiệp vụ
input: user_task, session_state, business_context

# 1. Nạp các ràng buộc hệ thống (điều kiện giới hạn, quy tắc chính sách, phân quyền...)
constraints = load_system_constraints()

# 2. Căn cứ vào nhiệm vụ người dùng và trạng thái phiên, trích xuất mục tiêu cụ thể cần đạt được lúc này
goal = extract_current_goal(user_task, session_state)

# 3. Sử dụng chiến lược RAG (Retrieval-Augmented Generation) để truy xuất bằng chứng hoặc thông tin ngữ cảnh liên quan
#    - Ví dụ tìm dữ liệu liên quan đến goal từ tài liệu, cơ sở tri thức, cơ sở dữ liệu
#    - Tham khảo mục "Nạp ngữ cảnh trong thời gian chạy (Runtime) như thế nào" để xem chiến lược truy xuất
evidence = retrieve_rag(goal, business_context)

# 4. Hồi tưởng bộ nhớ lịch sử hoặc thông tin sẵn có trong phiên
#    - Bao gồm sở thích của người dùng, tương tác trước đó, bộ nhớ mô hình
memory = recall_memory(goal, session_state)

# 5. Căn cứ vào mục tiêu, bằng chứng và bộ nhớ để chọn công cụ/thành phần thao tác phù hợp
#    - Có thể là gọi API, thực thi thao tác trình duyệt, kích hoạt tính toán...
tools = select_tools(goal, evidence, memory)

# 6. Nén lịch sử tin nhắn của phiên, phục vụ quản lý ngữ cảnh xuyên cửa sổ
#    - Tham khảo mục "Trong các tác vụ dài, làm thế nào để duy trì ngữ cảnh"
#    - Nén lịch sử giúp giảm tiêu hao Token, đồng thời giữ lại thông tin then chốt
history = compact_history(session_state.messages)

# 7. Tổng hợp toàn bộ thông tin ngữ cảnh và sắp xếp theo thứ tự quan trọng
#    - Đảm bảo mô hình xử lý nội dung then chốt nhất trước
context = rank([
  constraints,
  goal,
  evidence,
  memory,
  tools,
  history
])

# 8. Cắt ngắn/cắt gọt ngữ cảnh theo hạn ngạch Token của mô hình
#    - Đảm bảo giữ lại tối đa thông tin then chốt trong ngân sách Token cho phép
context = fit_token_budget(context)

# Đầu ra: các message được tạo ra, schema công cụ khả dụng, metadata bổ sung
output: messages, tool_schema, metadata
```

Có hai bước đặc biệt then chốt mà trong thực tế chúng ta cần lưu ý:

1. `rank` quyết định thông tin nào nằm phía trước, thông tin nào nằm phía sau.
2. `fit_token_budget` quyết định cái gì giữ nguyên văn, cái gì nén thành tóm tắt, cái gì chỉ giữ lại một liên kết tham chiếu.

Nếu hai bước này làm kém, hiệu quả xử lý của Agent sẽ rất bình thường. Tuyệt đối tránh việc truy xuất được cái gì là nhồi nhét cái đó, tin nhắn lịch sử có bao nhiêu tống vào bấy nhiêu, để rồi cuối cùng một nửa cửa sổ toàn là tạp âm gây nhiễu.

Đầu vào của Context Assembler có thể phân chia theo nguồn gốc thành: quy tắc tĩnh, định nghĩa công cụ, bằng chứng động, ví dụ mẫu và ngân sách Token.

### Quy tắc tĩnh: Viết rõ ràng System Prompt trước

Quy tắc tĩnh có thể hiểu là "cài đặt xuất xưởng" của Agent, tức là những ràng buộc nền tảng không thay đổi theo cuộc hội thoại. Cách làm phổ biến là dùng Markdown có cấu trúc để viết System Prompt, đừng nhồi nhét tất cả vào một đoạn văn lớn, mà hãy chia nhỏ thành Vai trò, Mục tiêu, Ràng buộc, Luồng thực thi và Định dạng đầu ra.

Ví dụ cho một Agent xử lý sự cố sự cố backend:

```markdown
## Vai trò

Bạn là một chuyên gia xử lý sự cố dịch vụ backend, chuyên định vị nguyên nhân gốc rễ (root cause) thông qua dữ liệu log và telemetry.

## Ràng buộc

- Chỉ gọi những công cụ cần thiết, không gọi lặp lại các công cụ có cùng logic.
- Khi phát hiện thông tin then chốt phải dừng tìm kiếm ngay lập tức và đưa ra kết luận.
- Ưu tiên sử dụng dữ liệu thời gian thực thay vì các suy đoán lịch sử.

## Luồng thực thi

1. Kiểm tra chỉ số giám sát (CPU / bộ nhớ / mạng).
2. Tra cứu log trong khoảng thời gian tương ứng.
3. Nếu phát hiện chuỗi gọi bất thường, truy vết các dependency thượng nguồn và hạ nguồn.
4. Xuất báo cáo có cấu trúc: Mô tả sự cố → Nguyên nhân gốc rễ → Phương án khắc phục đề xuất.

## Định dạng đầu ra

Sử dụng JSON, bao gồm các trường: incident_summary, root_cause, evidence, recommendation.
```

Những quy tắc này có thể đặt trong `.cursor/rules`, `.claude/rules` hoặc `AGENTS.md`, sau đó môi trường host tương ứng sẽ nạp theo thư mục và phạm vi hiệu lực. Các file quy tắc rất thuận tiện cho việc kiểm soát phiên bản (Git) và rà soát của team, nhưng việc nó được đưa vào loại message nào và nạp khi nào phụ thuộc vào triển khai của host.

Khi viết System Prompt cần tránh hai thái cực phổ biến:

**Một là thiết kế thái quá (Over-engineering).** Nhiều kỹ sư thích nhồi nhét hàng đống logic if-else vào Prompt nhằm kiểm soát chính xác từng bước đi của Agent. Hậu quả là Prompt vừa dài vừa mong manh, chi phí bảo trì cực cao, mà khi gặp các trường hợp biên chưa từng thấy thì mô hình vẫn cứ đi chệch hướng.

**Hai là trừu tượng thái quá (Over-abstraction).** Chỉ viết đúng một câu "Bạn hãy làm một trợ lý hữu ích", mô hình không nhận được đủ căn cứ để ra quyết định, hoặc sẽ liên tục hỏi lại người dùng, hoặc sẽ đưa ra kết quả lệch rất xa so với kỳ vọng nghiệp vụ.

Trạng thái lý tưởng là đủ cụ thể để định hướng hành vi, nhưng cũng đủ trừu tượng để bao quát các biến đổi thông thường. Blog kỹ thuật của Anthropic gọi đây là vùng Goldilocks—vùng "vừa vặn".

![Hiệu chỉnh System Prompt trong Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/calibrating-the-system-prompt-9112754b.webp)

Cách làm thực tế vững chắc hơn là dùng Prompt tối thiểu để đo lường hiệu năng cơ sở, sau đó căn cứ vào từng failure case cụ thể để bổ sung từng quy tắc một, đừng vội vàng cố gắng vét cạn mọi tình huống ngay từ đầu. Anthropic gọi đây là *Calibrating the system prompt*—System Prompt phải là một tham số được tinh chỉnh liên tục, chứ không phải một tài liệu cấu hình viết xong là để nguyên. Cứ phát hiện một failure case là bổ sung một quy tắc, rồi tiến hành kiểm thử lại.

### Ngữ cảnh công cụ: Mô tả công cụ phải nêu rõ ranh giới trước

Định nghĩa công cụ viết tốt hay không sẽ trực tiếp quyết định việc Agent có chọn sai công cụ hay không. Một mô tả công cụ tốt cần trả lời được hai câu hỏi: Khi nào nên gọi? Khi nào KHÔNG nên gọi? Nếu ngay cả kỹ sư con người nhìn vào cũng không biết công cụ này có nên dùng hay không, Agent chắc chắn sẽ phạm sai lầm.

Khi một công cụ bao hàm cùng lúc các thao tác truy vấn, chỉnh sửa và phê duyệt, Agent sẽ phải phân biệt nhiều bộ tham số và tác dụng phụ trong cùng một Schema, khiến xác suất chọn sai đường tăng lên. Mô tả công cụ cần nêu rõ điều kiện áp dụng và điều kiện cấm; hãy tách riêng các thao tác đơn lẻ và cung cấp ví dụ định dạng trong tham số để ranh giới gọi công cụ có thể phán đoán rõ ràng.

### Ngữ cảnh động: Đừng đổ dồn RAG, bộ nhớ và kết quả công cụ vào một lượt

Thời điểm truy xuất, tiền truy xuất hay nạp theo nhu cầu đã được trình bày ở mục "Nạp ngữ cảnh trong thời gian chạy như thế nào". Ở đây chỉ bàn về việc kết quả truy xuất sau khi vào cửa sổ sẽ được xử lý ra sao.

Bộ nhớ ngắn hạn có thể quản lý bằng cửa sổ trượt, các sự thật dài hạn được truy xuất qua kho lưu trữ bên ngoài. Các Observation như log lỗi API, kết quả công cụ trả về có thể cắt gọt và tóm tắt trước, nhưng các thông tin phục vụ xử lý sự cố bắt buộc phải giữ lại tham chiếu gốc: `traceId`, thời gian request, mã lỗi, vị trí file log, tham số gọi công cụ và link tóm tắt kết quả gốc—những thứ này tuyệt đối không được làm mất. Nếu chỉ giữ lại một câu "giao diện bị lỗi" thì chuỗi điều tra sau đó sẽ bị đứt đoạn, nhưng nếu đổ dồn toàn bộ thác lũ log thô vào thì lại dễ làm mô hình bị ngập ngụa trong rác.

Các sự cố của ngữ cảnh động thường phát sinh do kết quả truy xuất sai, bộ nhớ lỗi thời, công cụ bị timeout hoặc bản tóm tắt bỏ sót bằng chứng. Bảng dưới đây liệt kê các lộ trình hạ cấp tương ứng:

| Dạng lỗi | Biểu hiện điển hình | Phương án dự phòng |
| --- | --- | --- |
| RAG không có kết quả | Không tìm thấy tài liệu liên quan, hoặc các đoạn trích triệu hồi quá rời rạc | Hạ cấp xuống tìm kiếm từ khóa, khi cần thiết để Agent hỏi lại người dùng để làm rõ chỗ thiếu |
| Công cụ timeout | API bên ngoài bị treo, Agent lặp lại việc chờ đợi | Thiết lập timeout, giới hạn thử lại, circuit breaker; quy trình then chốt chừa sẵn đường cho con người tiếp quản |
| Thất thoát tóm tắt | Sau khi nén bị thiếu stack trace ngoại lệ, số hiệu phiên bản, giá trị biên | Giữ lại traceId, vị trí bằng chứng gốc, các trường then chốt và link có thể kiểm chứng lại |
| Ô nhiễm bộ nhớ | Sở thích cũ, trạng thái cũ bị coi là sự thật hiện tại | Kiểm tra trước khi ghi; sau khi đọc cần đánh dấu rõ nguồn gốc, thời gian và độ tin cậy |
| Xung đột nhiều công cụ | Hai công cụ đều làm được, Agent chọn sai đường | Dùng độ ưu tiên, state machine và cấp độ tác dụng phụ để ràng buộc thứ tự gọi |

### Ngữ cảnh ví dụ: Đừng chất đống quá nhiều ví dụ Few-shot

Các ví dụ Few-shot nên bao quát các kịch bản tiêu chuẩn khác nhau. Giữ lại 3 đến 5 ví dụ mẫu mang tính đại diện (canonical examples) thể hiện sự khác biệt về mặt chiến lược thường hiệu quả hơn nhiều so với việc cố nhồi nhét hàng chục edge case vào Prompt; ví dụ cần chỉ rõ chiến lược xử lý khi đối mặt với một nhóm đầu vào, chứ không chỉ phô bày cặp dữ liệu vào-ra trên bề mặt.

### Ngân sách Token: Sắp xếp thứ tự ưu tiên trong một lần gọi

Phần này thảo luận về mức độ ưu tiên của nội dung trong một lần gọi đơn lẻ; lịch sử xuyên cửa sổ do cơ chế Compaction đã nói ở trên xử lý. Khi cửa sổ tiến sát ngưỡng giới hạn, cả hai chiến lược cần đồng thời phát huy tác dụng.

![Ngữ cảnh không phải cứ càng nhiều càng tốt](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-eviction-strategy-3d3850d6.png)

| Mức độ ưu tiên | Nội dung | Phương thức xử lý |
| --- | --- | --- |
| Ưu tiên thấp (có thể thu gọn) | Lịch sử đối thoại ban đầu | Dùng AI tóm tắt nén lại |
| Ưu tiên trung bình (có thể tinh giản) | Tài liệu bối cảnh do RAG truy xuất, kết quả công cụ cũ | Cắt gọt lần hai, giữ lại đoạn cốt lõi và trích dẫn có thể đối chiếu |
| Ưu tiên cao (vùng cố định) | System Constraints, mục tiêu nhiệm vụ hiện tại, ranh giới an toàn | Đặt ở vùng ưu tiên cao cố định, đảm bảo tính nhất quán logic |
| Ưu tiên theo giai đoạn | Mô tả công cụ cần cho giai đoạn hiện tại, Schema, số ít ví dụ then chốt | Nạp theo giai đoạn nhiệm vụ, sau khi gỡ bỏ phải đảm bảo có thể khám phá lại |

Khi có lượng truy cập đồng thời lớn, có thể kết hợp với Prompt / Context Caching. Các mô hình hỗ trợ caching có thể đặt System Prompt và mô tả công cụ ổn định làm tiền tố cache để giảm chi phí tính tiền trùng lặp hoặc giảm độ trễ Token đầu tiên; tỷ lệ trúng cache thực tế vẫn phụ thuộc vào triển khai của nhà cung cấp, sự thay đổi của tiền tố và vòng đời cache, cần được xác thực dựa trên tải nghiệp vụ.

## Làm Context Engineering sẽ dùng những công cụ nào?

Khâu điều phối, truy xuất, vector database, kết nối công cụ và tầng bộ nhớ giải quyết các bài toán khác nhau, chỉ nên đưa vào những phần mà chuỗi nhiệm vụ hiện tại thực sự cần:

- LangChain, LangGraph chịu trách nhiệm về luồng điều khiển, quản lý trạng thái và lập lịch chu trình; việc gọi công cụ và quay lui node thường được tổ chức ở tầng này.
- LlamaIndex thiên về khâu tiếp nhận dữ liệu (ingestion), tạo chỉ mục và tối ưu hóa truy xuất cho RAG, phù hợp với các kịch bản mà việc nạp tài liệu và truy xuất cấu thành chuỗi chính.
- Pinecone, Weaviate, Chroma, Qdrant cung cấp lưu trữ Embedding và tìm kiếm ngữ nghĩa. Dự án nhỏ có thể dùng Chroma cục bộ trước, sau đó tùy theo quy mô để đánh giá Qdrant, Milvus hoặc Pinecone.
- MCP quy định phương thức công cụ kết nối chuẩn hóa vào chương trình host, phân định rõ Host, Client, Server, đồng thời công khai các năng lực như Resources, Prompts, Tools. Phiên bản giao thức và ví dụ gọi xem thống nhất tại [Bài chuyên đề MCP](https://javaguide.cn/ai/agent/mcp.html).
- Mem0, LETTA (MemGPT trước đây), ZEP hướng tới tầng bộ nhớ của Agent, thường đóng gói việc ghi nhớ, truy xuất và quên lãng trên nền tảng của vector database.

Các công cụ kết nối qua MCP cũng chính là cửa ngõ phát sinh tác dụng phụ (side-effects). Việc đọc file, truy vấn database, gửi request và sửa đổi cấu hình cần phân định rõ quyền hạn, điều kiện gọi và ranh giới kiểm toán, nếu không sự cố sẽ rất khó định vị và phát lại.

## Ghi nhận ngữ cảnh từng lượt khi triển khai

![Logic cốt lõi của Context Engineering](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/context-engineering-core-logic-1a8e57ed.png)

Khi đánh giá Context Engineering, trước hết hãy ghi nhận lại các message thực tế đi vào cửa sổ trong mỗi lượt. Sau khi chiến lược truy xuất, phương thức tóm tắt hoặc thứ tự gắn Schema công cụ thay đổi, ta mới có thể so sánh tỷ lệ thành công, chi phí Token và chất lượng gọi công cụ với đường cơ sở ban đầu.

### Tỷ lệ tín hiệu trên nhiễu (SNR) cao quan trọng hơn dung lượng thông tin

Dex Horthy từng đề cập đến khoảng kinh nghiệm tận dụng ngữ cảnh từ 40% đến 60%, nhưng đây không phải là một ngưỡng tuyệt đối. Cần thông qua các quỹ đạo thực tế để tìm ra tập thông tin tối thiểu cần thiết để hoàn thành quyết định: giữ lại các ràng buộc và bằng chứng, loại bỏ các bối cảnh không liên quan.

### Tác vụ dài phải chủ động dọn dẹp trạng thái đã hết hạn

Sau khi tác vụ dài liên tục nối thêm message, các phán đoán ban đầu, các vấn đề đã được giải quyết và kết quả công cụ trùng lặp đều sẽ đọng lại trong lịch sử. Compaction xử lý việc nén message, ghi chú có cấu trúc lưu giữ trạng thái có thể khôi phục, Sub-agent cô lập các nhiệm vụ chuyên biệt; việc có kết hợp sử dụng hay không phụ thuộc vào độ dài nhiệm vụ và các dạng lỗi đã quan sát được. Khi tác vụ ngắn chưa xuất hiện hiện tượng phình to ngữ cảnh thì chưa cần thiết phải đưa vào tầng bộ nhớ phức tạp.

### Hãy chạy thông phương án đơn giản nhất trước

Anthropic đã nhiều lần nhấn mạnh một câu: `do the simplest thing that works`.

Khi đường cơ sở còn chưa chạy thông mà đã vội vàng đưa vào phân tầng bộ nhớ, truy xuất phức tạp và quản lý trạng thái dài hạn, một khi thất bại sẽ rất khó phân biệt vấn đề bắt nguồn từ truy xuất, tóm tắt, mô tả công cụ hay việc lựa chọn mô hình, đồng thời các thành phần dư thừa cũng kéo dài chuỗi điều tra sự cố.

Có thể cố định System Prompt và ranh giới công cụ trước, sau đó xác thực việc truy xuất RAG, tiếp theo bổ sung nén tóm tắt và ngân sách ngữ cảnh. Khi tác vụ dài xuất hiện điểm nghẽn rõ ràng, lúc đó mới đánh giá đến tầng bộ nhớ, Sub-agent hoặc các cơ chế truy xuất runtime phức tạp hơn.

## Bắt đầu từ một đường cơ sở có thể phát lại được

Hãy cố định trước các chỉ thị có độ ưu tiên cao và định nghĩa công cụ, lưu lại các message thực tế gửi đi trong mỗi lần gọi, Schema công cụ, lượng Token tiêu thụ và kết quả truy xuất, sau đó dùng một nhóm nhiệm vụ thực tế để thiết lập đường cơ sở (baseline). Sau đó mỗi lần chỉ điều chỉnh một biến số duy nhất, ví dụ chiến lược truy xuất, phương thức tóm tắt hoặc thứ tự gắn công cụ.

Các năng lực như ngữ cảnh dài, Prompt Caching, đầu ra có cấu trúc và MCP sẽ liên tục thay đổi theo phiên bản mô hình, API, SDK và client. Tài liệu thiết kế cần ghi rõ model ID, phiên bản giao diện và ngày kiểm chứng, tránh lấy chi tiết triển khai của một client nhất định làm quy luật phổ quát. Khi quỹ đạo cơ sở xuất hiện hiện tượng thông tin hết hạn, thiếu ngân sách hoặc mất trạng thái xuyên cửa sổ, lúc đó mới bổ sung thêm RAG, Compaction, cache hoặc bộ nhớ bền vững.

## Tổng kết

Trong mỗi lần gọi chuyển giao cho mô hình, các quy tắc cố định, mục tiêu hiện tại, bằng chứng truy xuất, công cụ khả dụng, trạng thái lịch sử và ngân sách Token đều cần được tổ chức theo thứ tự ưu tiên. Cửa sổ lớn hơn không tự động cải thiện phán đoán; lịch sử không liên quan, kết quả công cụ trùng lặp và trạng thái lỗi thời vẫn sẽ làm nhiễu loạn các quyết định.

Trước tiên hãy lưu lại các quỹ đạo gọi thực tế để xây dựng một đường cơ sở có thể phát lại được, sau đó mới tinh chỉnh từng bước chiến lược truy xuất, mô tả công cụ, tóm tắt hoặc cắt gọt. Chỉ khi đường cơ sở bộc lộ rõ các vấn đề về tác vụ dài, thông tin hết hạn hoặc cửa sổ không đủ dung lượng thì mới bổ sung phân tầng bộ nhớ, Compaction, cache hoặc Sub-agent, nhằm tránh việc quá nhiều thành phần che lấp mất nguồn gốc thực sự của sự cố.

## Tài liệu tham khảo

- [Effective context engineering for AI agents - Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [OpenAI API Models Compare](https://developers.openai.com/api/docs/models/compare)
- [Claude API Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [DeepSeek V4 Preview Release](https://api-docs.deepseek.com/news/news260424)
- [MCP: Phiên bản giao thức, năng lực và ví dụ gọi](https://javaguide.cn/ai/agent/mcp.html)
- [Context Rot: How Increasing Input Tokens Impacts LLM Performance](https://www.trychroma.com/research/context-rot)
- [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172)
- [Context Engineering: The New Frontier of AI Development](https://medium.com/techacc/context-engineering-a8c3a4b39c07)
- [The New Skill in AI is Not Prompting, It Is Context Engineering](https://www.philschmid.de/context-engineering)
- [Context Engineering by Simon Willison](https://simonwillison.net/2025/jun/27/context-engineering/)
- [12 Factor Agents - Own Your Context Window](https://www.humanlayer.dev/blog/12-factor-agents)
