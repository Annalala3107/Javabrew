---
title: "Phân tích Chi tiết về LLM Gateway: Định tuyến Đa mô hình, Fallback, Rate Limiting và Kiểm soát Chi phí"
description: "Giới thiệu ranh giới của LLM Gateway, định tuyến mô hình, Fallback, hạn mức rate limiting, ngân sách Token, thống kê chi phí, giám sát kiểm toán, chiến lược caching, phương án triển khai Java backend và lựa chọn giải pháp phổ biến."
category: Phát triển ứng dụng AI
head:
  - - meta
    - name: keywords
      content: LLM Gateway,Cổng mô hình lớn,LLM Router,Định tuyến mô hình,Định tuyến đa mô hình,Fallback,Rate Limiting,Ngân sách Token,AI Gateway,LiteLLM,Cloudflare AI Gateway,Kong AI Gateway
lang: vi
sourceRef: zh-ref/ai/system-design/llm-gateway.md
---

Cách đây một thời gian, có độc giả muốn tôi chia sẻ về LLM Gateway (Cổng kết nối mô hình lớn): rốt cuộc nó giải quyết vấn đề gì, khi nào thì đáng để triển khai độc lập, và nên lựa chọn giải pháp như thế nào.

Vì vậy, tôi đã tổng hợp những kinh nghiệm thực chiến và suy ngẫm của mình từ các dự án thực tế thành bài viết phân tích chi tiết này. Nội dung tương đối "đậm đặc", nếu tính cả một lượng nhỏ code mẫu thì có dung lượng tương đương hơn 30.000 từ.

Xin nêu trước kết luận: đối với phần lớn các dự án đơn khối (monolith) hoặc quy mô một nhóm phát triển, bạn chỉ cần tự viết một LLM Gateway gọn nhẹ ngay trong ứng dụng là hoàn toàn đủ. Trước tiên hãy gom các lượt gọi mô hình vốn đang phân tán rải rác ở các module nghiệp vụ về một đầu mối tập trung duy nhất, sau đó bổ sung timeout, retry, logging và định tuyến đơn giản tùy theo nhu cầu. Thông thường không cần thiết phải đưa thêm các thành phần phức tạp bên ngoài như LiteLLM hay Kong AI Gateway vào hệ thống, và càng không cần ngay từ đầu đã phải dựng một nền tảng gateway độc lập riêng biệt.

Nếu phân loại ý định (intent classification), tạo tiêu đề, sửa lỗi JSON và tạo báo cáo phức tạp đều gọi chung một mô hình flagship cao cấp nhất, giai đoạn phát triển ban đầu quả thực rất nhàn. Nhưng một khi lưu lượng truy cập tăng lên, chi phí, độ trễ và tình trạng rate limit từ nhà cung cấp sẽ cùng lúc bộc lộ: các tác vụ nhẹ chiếm dụng hạn ngạch (quota) của mô hình đắt tiền, tác vụ quan trọng gặp sự cố lại không có đường truyền dự phòng (fallback), hóa đơn cuối tháng thì không thể bóc tách để quy kết trách nhiệm chi phí cho tenant hay tính năng cụ thể nào.

Những bài toán này không phù hợp để từng module nghiệp vụ tự giải quyết riêng lẻ, nếu không logic chọn mô hình, retry, rate limit và ghi nhận lượt gọi sẽ nhanh chóng vương vãi khắp nơi trong code nghiệp vụ. Tác dụng của LLM Gateway chính là cung cấp một cổng gọi tập trung nằm giữa tầng ứng dụng và các nhà cung cấp mô hình, quản lý thống nhất các logic dùng chung này.

## Nền tảng về LLM Gateway

### LLM Gateway Rốt cuộc là gì?

LLM Gateway giống như: **Năng lực của một API Gateway + Mặt phẳng điều khiển lượt gọi mô hình (Control Plane)**.

API Gateway truyền thống là **cổng vào thống nhất** nằm giữa client và các backend service. Mọi request từ client trước tiên đều đi qua gateway, sau đó gateway sẽ định tuyến đến service đích cụ thể, chủ yếu quản lý lưu lượng HTTP: xác thực, rate limiting, chuyển tiếp, ghi log, ngắt mạch (circuit breaking).

![Sơ đồ tổng quan về API Gateway truyền thống](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/distributed-system/api-gateway-overview-ee8b371d.png)

Còn LLM Gateway đối mặt trực tiếp với các lượt gọi mô hình ngôn ngữ lớn. Ngoài việc xử lý các vấn đề của một API thông thường, nó còn phải xử lý các bài toán đặc thù của mô hình: lựa chọn model, ngân sách Token (Token budget), độ dài context, sự khác biệt giữa các nhà cung cấp, phản hồi dạng stream, gọi công cụ (tool calling), phản hồi có cấu trúc, thống kê chi phí, phiên bản Prompt và chất lượng đầu ra.

Nói một cách chính xác hơn, **LLM Gateway là một tầng cửa ngõ quản trị nằm giữa tầng ứng dụng và các nhà cung cấp mô hình**. Nó không nhất thiết phải thay thế API Gateway hiện có của doanh nghiệp, mà nó gom các logic định tuyến, ngân sách, kiểm toán và adapter liên quan đến việc gọi mô hình về một mối.

![Sơ đồ tổng quan về LLM Gateway](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-overview-cd018e58.png)

Mã nguồn nghiệp vụ không cần quan tâm trực tiếp OpenAI, Anthropic, Gemini, Qwen, DeepSeek hay các mô hình private nội bộ được gọi cụ thể như thế nào, mà chỉ cần gửi một request chuẩn hóa duy nhất tới Gateway. Gateway sẽ căn cứ vào kịch bản, ngân sách, độ trễ, tính khả dụng của mô hình và chính sách nghiệp vụ để quyết định gọi model nào, đi qua nhà cung cấp nào, có cần retry không, có cần giáng cấp không và ghi log ra sao.

Phiên bản đầu tiên của Gateway có thể rất nhẹ nhàng, chỉ làm nhiệm vụ đóng gói tập trung, timeout, retry và ghi log. Khi tiến vào giai đoạn production, nó thường sẽ quản lý thêm định tuyến mô hình, ngân sách Token, rate limiting, phân bổ chi phí, caching, kiểm toán và các chính sách bảo mật.

Nếu chỉ dừng lại ở việc "chuyển tiếp request một chút", nó chỉ là một reverse proxy thông thường; chỉ khi bắt đầu ghi nhận vì sao lại chọn model này, trừ ngân sách thế nào, sau khi lỗi thì dùng phương án dự phòng nào để xử lý, lúc đó nó mới thực sự bước vào phạm vi của một Gateway.

### Tại sao Cần đến LLM Gateway?

Nhiều đội ngũ khi làm ứng dụng AI lần đầu tiên thường gọi mô hình trực tiếp ngay trong service nghiệp vụ:

```text
Controller -> Service -> OpenAI SDK -> Trả về câu trả lời
```

Chuỗi gọi này rất ngắn gọn, trải nghiệm phát triển ban đầu cũng rất thoải mái. Nhưng chỉ cần quy mô trên production tăng lên một chút, các vấn đề sẽ đồng loạt bộc lộ.

| Vấn đề điển hình khi gọi trực tiếp mô hình | Biểu hiện trên Production | Năng lực tương ứng của Gateway |
| --- | --- | --- |
| Hardcode tên mô hình | Nâng cấp model, ngừng hỗ trợ, đổi nhà cung cấp phải sửa code khắp nơi | Model Registry + Định tuyến qua cấu hình |
| API Key phân tán | Nhiều service tự lưu key riêng lẻ, xoay vòng key (rotation) cực kỳ khó khăn | Quản lý Secret tập trung |
| Nhà cung cấp Rate Limit | Khi gặp lỗi 429, các service thi nhau retry điên cuồng, càng retry càng tắc | Rate Limiting, Hàng đợi, Fallback, Circuit Breaking |
| Chi phí mập mờ | Cuối tháng chỉ biết tổng hóa đơn, không rõ tenant, tính năng hay Prompt nào tốn tiền | Ghi nhận usage + Phân bổ chi phí (Cost Attribution) |
| Mọi request đi chung một model | Tác vụ đơn giản thì lãng phí tiền, tác vụ phức tạp thì kết quả kém | Định tuyến mô hình theo loại tác vụ |
| Thiếu hụt nhật ký (Log) | Khách hàng phàn nàn "AI vừa nói bậy", điều tra thì không tìm thấy input/output | Tracing, Phiên bản Prompt, Log gọi mô hình |
| SDK nhà cung cấp phân tán | Mỗi nghiệp vụ lại tự xử lý stream, mã lỗi, retry và parse dữ liệu cấu trúc | Provider Adapter đóng gói chuẩn hóa |

Ngoài kiểm soát truy cập, chúng ta còn phải thiết kế riêng biệt cho việc phân bổ chi phí và khả năng phát lại (replay) sự cố.

Giải thích ngắn gọn về hai khái niệm này:

- Phân bổ chi phí (Cost Attribution) là việc trả lời câu hỏi "khoản chi phí mô hình này đã tiêu tốn cho ai, cho tính năng gì và trong lần gọi nào": ví dụ bóc tách lượng Token và số tiền theo tenant, user, kịch bản nghiệp vụ, phiên bản Prompt, model và nhà cung cấp.
- Phát lại sự cố (Incident Replay) là khi người dùng phản hồi "câu trả lời vừa rồi bị sai", hệ thống có thể dựa vào `request_id` để tìm lại chính xác phiên bản Prompt, context truy xuất, kết quả định tuyến, phiên bản model, các lượt gọi tool và thông tin lỗi tại thời điểm đó, từ đó phán đoán vấn đề nằm ở đầu vào, định tuyến, đầu ra của model hay khâu parse dữ liệu ở phía hạ nguồn.

Một lời gọi API truyền thống khi thất bại thường có thể dễ dàng định vị từ mã trạng thái HTTP, tham số request hoặc trạng thái database. Nhưng một lượt gọi LLM thất bại thì rắc rối hơn nhiều: có thể do phiên bản Prompt bị đổi, có thể do mô hình âm thầm nâng cấp, có thể context truy xuất có quá nhiều nhiễu, có thể đầu ra bị cắt cụt (truncate), hoặc cũng có thể do router đã điều hướng nhầm vào một model giá rẻ nhưng không đủ năng lực suy luận.

Nếu không có Gateway, tất cả những manh mối điều tra này sẽ nằm rải rác khắp hệ thống nghiệp vụ.

Một khi đã phân tán thì vô cùng khó quản lý.

### LLM Gateway và LLM Router Khác nhau như thế nào?

Phạm vi quản lý của Router tương đối hẹp: request này nên chọn model nào. Đầu vào là câu hỏi của người dùng, loại tác vụ, ngân sách, độ dài context; đầu ra là một tên model cụ thể hoặc một tập hợp các model ứng viên.

Phạm vi của Gateway rộng lớn hơn nhiều. Từ lúc request đi vào cho đến khi kết quả được trả về, các khâu trung gian như xác thực, rate limiting, định tuyến, fallback, ghi log, ghi nhận chi phí đều thuộc quyền quản lý của nó. Router chỉ là một mắt xích bên trong Gateway.

| Khía cạnh | LLM Router | LLM Gateway |
| --- | --- | --- |
| Trách nhiệm chính | Lựa chọn mô hình | Tiếp nhận tập trung, định tuyến, rate limiting, Fallback, giám sát, quản trị chi phí |
| Độ chi tiết quyết định | Chọn model cho từng request đơn lẻ | Quản trị toàn bộ vòng đời của request |
| Đầu vào điển hình | Câu hỏi người dùng, loại tác vụ, ngân sách, độ dài context | Request, user, tenant, kịch bản, Prompt, model, nhà cung cấp, policy |
| Đầu ra điển hình | Model mục tiêu hoặc tập hợp model | Kết quả gọi hoàn chỉnh, usage, log, lỗi, chi phí, dấu vết Fallback |
| Giai đoạn phù hợp | Khi việc gọi nhiều model bắt đầu phức tạp | Khi ứng dụng AI bước vào giai đoạn production |

Có thể hiểu đơn giản: **Router chịu trách nhiệm chọn model, còn Gateway chịu trách nhiệm quản lý trọn vẹn toàn bộ lượt gọi model đó**.

Bạn hoàn toàn có thể chỉ có Router mà không có Gateway để phục vụ chức năng định tuyến mô hình đơn giản. Ví dụ viết một hàm dựa vào loại tác vụ để trả về model tương ứng.

Cách này giải quyết được một phần bài toán chi phí, nhưng không giải quyết được việc quản lý API key, rate limiting, ghi log, kiểm toán, xử lý lỗi thống nhất và chuyển đổi nhà cung cấp.

Ngược lại, một Gateway ở giai đoạn đầu cũng có thể chưa cần một Router phức tạp. Phiên bản 1 chỉ làm tốt việc tiếp nhận tập trung, ghi log và Fallback cơ bản thì đã có thể giảm thiểu được rất nhiều sự cố trên production.

Chiến lược định tuyến không nên trói chặt vào một tên model cụ thể, mà nên gắn vào các thuộc tính tương đối ổn định như phân tầng năng lực (tier), khoảng chi phí, năng lực context và cấp độ rủi ro. Mô hình rồi sẽ nâng cấp, tên gọi sẽ thay đổi, nhưng những chiều kích quyết định này sẽ không bao giờ mất đi.

### Quan hệ giữa LLM Gateway với RAG, Agent và MCP là gì?

Những khái niệm này thường xuất hiện cùng nhau nhưng ranh giới trách nhiệm lại khác nhau.

| Khái niệm | Vấn đề chính cần giải quyết | Mối quan hệ với Gateway |
| --- | --- | --- |
| RAG | Truy xuất tri thức bên ngoài, nhét context liên quan vào request gửi tới model | Gateway có thể giới hạn Token, ghi nhận phiên bản Prompt, cache kết quả sau truy xuất, nhưng không chịu trách nhiệm về chất lượng truy xuất |
| Agent | Chia nhỏ tác vụ, gọi công cụ, thực thi qua nhiều lượt | Gateway có thể quản lý ngân sách, định tuyến và Fallback cho lượt gọi model ở từng bước, nhưng không quyết định logic lập kế hoạch của Agent |
| MCP | Giúp model hoặc Agent truy cập công cụ, tài nguyên và context theo một giao thức chuẩn hóa | Gateway có thể kiểm toán và quản trị các request của model, phối hợp với log gọi tool, nhưng không thay thế MCP Server hay Tool Registry |

Do đó, Gateway thiên về "quản trị việc gọi mô hình"; còn RAG, Agent, MCP thiên về "tổ chức năng lực ứng dụng".

Một Agent phức tạp có thể gọi Gateway qua nhiều bước khác nhau, và Gateway cũng có thể ghi nhận độc lập `scene`, `route_reason`, lượng Token tiêu thụ và chi phí cho từng bước đó.

### LLM Gateway có Làm tăng Độ trễ không?

Nó có làm tăng một chút, nhưng phần này thường không phải là nguyên nhân chính khiến người dùng phải chờ đợi lâu.

Gateway thực hiện việc định tuyến, ước tính Token và ghi log trong cùng một mạng nội bộ hoặc trung tâm dữ liệu với thời gian tiêu tốn rất nhỏ; trong khi đó việc xếp hàng tại máy chủ nhà cung cấp, suy luận context dài, độ trễ mạng xuyên lục địa, sinh Token đầu ra, gọi tool và retry mới là những yếu tố chính kéo dài độ trễ đầu cuối (end-to-end latency).

Gateway có thể can thiệp chính vào những mắt xích này. Phân loại ý định có thể đi thẳng qua model độ trễ thấp; các câu hỏi FAQ lặp lại có thể trả về kết quả cache; context dài được nén trước khi gửi đi; tương tác giọng nói và hỗ trợ trực tuyến cần đưa TTFT vào chỉ số đánh giá sức khỏe của các model ứng viên. Khi nhà cung cấp xảy ra chập chờn, việc chủ động chuyển sang model ứng viên khác hoặc xếp hàng theo policy sẽ dễ kiểm soát hơn nhiều so với việc để giao diện người dùng chờ đến khi timeout.

Bản thân việc định tuyến cũng phát sinh chi phí. Nếu mỗi request đều phải gọi một model cực mạnh chỉ để "đánh giá xem nên dùng model nào", rất có thể số Token và thời gian tiết kiệm được sẽ bị tiêu tốn hết vào lượt gọi đó. Khi chưa có đủ lượng request, bộ dữ liệu đánh giá và feedback chất lượng, việc cấu hình rule theo kịch bản hoặc dùng classifier gọn nhẹ là hoàn toàn đủ dùng.

### Bạn có Thực sự Cần LLM Gateway không?

Trước tiên hãy xem việc gọi mô hình đang nằm ở vị trí nào trong hệ thống của bạn. Một công cụ nội bộ chỉ gọi một nhà cung cấp duy nhất, mỗi ngày chỉ có vài lượt gọi, thì việc triển khai một Gateway độc lập thường là không cần thiết; chỉ cần bọc một `LLMClient` bên ngoài service nghiệp vụ để xử lý tập trung timeout, retry, log cơ bản và chuyển đổi lỗi là đủ.

Nhưng khi các lượt gọi bắt đầu được tái sử dụng bởi nhiều service, nhiều team hoặc nhiều tenant khác nhau, câu chuyện sẽ thay đổi. Khi cấu hình mô hình nằm rải rác khắp nơi, việc đổi nhà cung cấp đòi hỏi phải sửa code của từng service một; khi chi phí của một kịch bản tăng đột biến, hóa đơn lại không thể bóc tách theo tenant, tính năng hay phiên bản Prompt. Việc chuyển đổi đa nhà cung cấp, hạn ngạch, Fallback, kiểm toán và phát lại chất lượng sẽ liên tục lặp lại ở từng điểm gọi.

Lúc này thứ bạn cần chưa hẳn là một nền tảng quá nặng nề, nhưng việc gọi mô hình bắt buộc phải có một đầu mối duy nhất. Bạn có thể bắt đầu bằng một module tập trung quản lý tên model, API key, log gọi và xử lý lỗi, sau đó từng bước bổ sung định tuyến, ngân sách và rate limiting; khi nhiều nhánh nghiệp vụ cùng dùng chung mô hình, cần tính phí theo tenant hoặc cần quản lý lưu trữ Prompt và nội dung nhạy cảm, lúc đó hãy nâng cấp nó thành một LLM Gateway hoàn chỉnh.

[Nền tảng Phỏng vấn AI](https://javaguide.cn/zhuanlan/interview-guide.html) của tôi cũng đi theo lộ trình này. Dự án không triển khai gateway độc lập, cũng không tích hợp thêm component LLM Gateway chuyên dụng nào, mà quản lý tập trung cấu hình, model mặc định, API key, `ChatClient` và mô hình Embedding của các Provider khác nhau ngay trong ứng dụng thông qua `LlmProviderRegistry`, sau đó dùng `StructuredOutputInvoker` để gom các khâu kiểm tra, sửa lỗi, retry và chỉ số của đầu ra có cấu trúc về một mối. Điều này đã mang trọn vẹn hình thái cốt lõi của một LLM Gateway gọn nhẹ, đáp ứng hoàn hảo nhu cầu hiện tại của dự án.

Tuy nhiên, nó vẫn chưa phải là một gateway production hoàn chỉnh như bài viết phân tích phía sau: các năng lực như tự động Fallback xuyên Provider, ngân sách Token, phân bổ chi phí theo lượt gọi, rate limit đa chiều cấp gateway và định tuyến thông minh vẫn cần đợi đến khi nghiệp vụ thực sự cần mới bổ sung. Ranh giới này chứng minh một điều: LLM Gateway trước hết là một tập hợp các trách nhiệm cần được quản trị tập trung, không nhất thiết phải tương ứng với một microservice độc lập hay một component của bên thứ ba.

![Lộ trình tiến hóa của LLM Gateway](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-evolution-path-b608e924.webp)

Việc có nên gom về một mối hay không phụ thuộc vào việc một lần sửa đổi chính sách mô hình sẽ ảnh hưởng đến bao nhiêu service, và một sự cố xảy ra cần phải lần theo bao nhiêu chuỗi gọi. Khi các lượt gọi được tập trung tại một module, việc bổ sung model sau này, đổi nhà cung cấp hay thêm kiểm toán đều chỉ cần sửa tại một nơi duy nhất; còn nếu các lượt gọi đã vương vãi vào từng service nghiệp vụ, dù lưu lượng chưa lớn, bạn cũng nên thiết lập cổng vào thống nhất ngay từ đầu.

## Tại sao Không thể Dùng Mô hình Mạnh nhất cho Mọi Request?

### Mô hình Đắt nhất Chưa chắc đã là Mô hình Phù hợp nhất

Việc đặt model mạnh nhất làm mặc định quả thực giúp ta đỡ phải suy nghĩ lựa chọn ở giai đoạn đầu, nhưng nó không thể thay thế việc phân cấp tác vụ. Phân loại ý định, tạo tiêu đề, sửa lỗi JSON và tóm tắt ngắn chú trọng nhiều hơn vào tốc độ phản hồi, tính chuẩn xác của đầu ra có cấu trúc và phương án dự phòng khi lỗi; việc để chúng chiếm dụng model mạnh trong thời gian dài chỉ làm đội chi phí và kéo dài thời gian xếp hàng. Tác vụ phức tạp cũng không phải cứ model càng đắt thì kết quả càng tốt, ngữ cảnh truy xuất, giá trị trả về của công cụ và các ràng buộc đầu ra cũng đóng vai trò quyết định đến chất lượng cuối cùng.

Những cái tên như `tier-fast`, `tier-pro` chỉ biểu thị phân tầng năng lực, việc chúng ánh xạ cụ thể tới nhà cung cấp nào, phiên bản model nào, context window và giá cả ra sao phải do Model Registry quản lý. Khi nhà cung cấp thay thế model hoặc điều chỉnh giá, các rule theo vai trò không cần phải thay đổi theo.

Do đó, log định tuyến không thể chỉ lưu lại tên model cuối cùng, mà còn phải lưu giữ kịch bản, phân tầng model, các ứng viên, lý do định tuyến và usage thực tế. Nhờ vậy chúng ta mới có thể xem lại vì sao một lượt gọi cụ thể lại chọn model nhanh, khi nào thì kích hoạt model dự phòng, và quyết định đó đã tác động thế nào đến độ trễ và chi phí.

### Tác vụ nào Phù hợp với Model nhỏ? Tác vụ nào Bắt buộc phải dùng Model mạnh?

Việc chọn mô hình có thể bắt đầu từ chính bản chất của tác vụ, thay vì nhìn vào bảng xếp hạng mô hình trước. Việc lọc theo rule cố định, so khớp từ khóa, kiểm tra quyền hạn và điền template nên giao cho code xử lý; để mô hình phán đoán "đầu vào có rỗng không" hay "đuôi file có phải là PDF không" vừa tốn thêm tiền lại vừa mang lại sự bất định không đáng có.

Phân loại ý định, tạo tiêu đề, tóm tắt ngắn, diễn đạt lại câu chữ đơn giản và trích xuất thông tin rủi ro thấp thường rất thích hợp cho các model chi phí thấp. Những tác vụ này đòi hỏi ràng buộc enum, kiểm tra cấu trúc đầu ra và đường dẫn xử lý lỗi rõ ràng, chứ không cần số lượng tham số khổng lồ. Khi parse thất bại hoặc độ tin cậy không đủ, lúc đó mới nâng cấp model theo kịch bản.

Tổng hợp đa tài liệu, thiết kế kiến trúc code, lập kế hoạch Agent phức tạp và kiểm chứng sự thật nghiêm ngặt đòi hỏi năng lực suy luận sâu; các kịch bản có cái giá phải trả cho sai lầm rất đắt như tài chính, pháp lý, y tế còn phải bổ sung thêm người duyệt hoặc rule nghiệp vụ. Model mạnh nên được dành riêng cho các request này, thay vì biến thành con đường mặc định cho mọi lưu lượng.

Lấy dự án phân tích cổ phiếu đa agent của tôi làm ví dụ: việc tổng hợp chỉ báo kỹ thuật và sàng lọc tin tức ban đầu có thể ưu tiên model độ trễ thấp; còn việc tổng hợp tài liệu nghiên cứu sâu, hòa giải xung đột kết luận giữa các vai trò khác nhau thì bắt buộc phải cần tới năng lực suy luận mạnh mẽ hơn.

### LLM Router Chọn Mô hình như thế nào?

Nhiệm vụ của LLM Router là chọn một mô hình phù hợp cho từng request.

Sự phù hợp ở đây không chỉ nhìn vào chất lượng câu trả lời, mà còn phải tính đến chi phí, độ trễ, độ dài context, tính khả dụng của nhà cung cấp và chiến lược rủi ro.

Các dự án định tuyến thông minh như [LLMRouter](https://github.com/ulab-uiuc/LLMRouter) đi theo hướng lựa chọn model linh hoạt cho từng truy vấn, từ đó cân đối giữa chất lượng, chi phí và độ trễ. Nó bao quát định tuyến đơn lượt, đa lượt, cá nhân hóa, định tuyến Agentic, đồng thời cung cấp các chiến lược như KNN, SVM, MLP, Matrix Factorization, Elo Rating, Graph-based routing.

Những chiến lược này rất tốt cho việc học tập và nghiên cứu thực nghiệm, nhưng trên production trước tiên phải giải quyết được tính giải trình (explainability) và khả năng phát lại (replayability). Con đường an toàn hơn là: **Định tuyến mô hình bắt đầu từ các rule đơn giản, sau đó dựa vào kịch bản thực tế để tiến hóa dần thành một hệ thống có thể huấn luyện, có thể đánh giá và lặp lại liên tục**.

Các chiến lược định tuyến phổ biến gồm:

| **Chiến lược Định tuyến** | **Cách làm** | **Kịch bản phù hợp** | **Rủi ro** |
| --- | --- | --- | --- |
| Định tuyến theo Rule cố định | Chọn model theo kịch bản nghiệp vụ, endpoint, gói tenant | Gateway phiên bản đầu, đủ dùng cho đa số nghiệp vụ | Phụ thuộc bảo trì thủ công, dễ bị trễ |
| Ưu tiên chi phí / Định tuyến tầng (Cascading) | Mặc định đi qua model rẻ, thất bại hoặc độ tin cậy thấp mới nâng cấp | Phân loại, tóm tắt, FAQ chăm sóc khách hàng | Model giá rẻ phán đoán sai sẽ truyền lỗi |
| Định tuyến Ngữ nghĩa / Phân loại | Chọn model dựa theo ngữ nghĩa query, độ phức tạp, cấp độ rủi ro | Loại câu hỏi ổn định, lưu lượng tương đối lớn | Ngưỡng và bộ phân loại cần liên tục tinh chỉnh |
| Định tuyến Dựa trên Học máy | Huấn luyện Router dựa trên chất lượng, chi phí, độ trễ lịch sử | Nhiều model, nhiều tác vụ, lưu lượng lớn | Phụ thuộc vào dữ liệu đánh giá và vòng lặp feedback |
| Định tuyến Cá nhân hóa | Kết hợp sở thích người dùng, lịch sử tương tác để chọn model | Trợ lý người dùng cuối (C-end), giáo dục, nền tảng nội dung | Chi phí bảo vệ quyền riêng tư và tính nhất quán cao hơn |
| Định tuyến Agentic | Linh hoạt chuyển đổi model và tool trong các tác vụ nhiều lượt | Agent phức tạp, chuỗi tác vụ dài | Độ khó trong việc debug và kiểm soát chi phí rất cao |

Phiên bản đầu tiên thường bắt đầu từ các rule cố định. Dịch thuật, sinh code, hội thoại mặc định lần lượt liên kết với các phân tầng model tương ứng; các gói tài khoản hoặc mức độ rủi ro khác nhau sẽ ghi đè lên các rule mặc định. Các rule sẽ nhiều lên khi nghiệp vụ phát triển, nhưng nó có thể cấu hình được, kiểm toán được và có thể rollback bất kỳ lúc nào, rất thích hợp để gom các lượt gọi mô hình về một mối trước tiên.

Định tuyến tầng đặt model chi phí thấp lên phía trước, chỉ khi parse đầu ra có cấu trúc thất bại, độ tin cậy không đạt hoặc kiểm tra nghiệp vụ không thông qua mới nâng cấp lên model cao hơn. Nó sẽ làm tăng thêm một lần suy luận hoặc đánh giá, phù hợp với các kịch bản có thể chấp nhận việc chờ đợi thêm như tóm tắt, phân loại, FAQ; còn đối với voice thời gian thực hay chỉnh sửa văn bản cộng tác online thì không nên đặt nó trên luồng chính.

Định tuyến ngữ nghĩa/phân loại sẽ dùng độ tương đồng embedding với mẫu tác vụ, hồ sơ model, hoặc dùng classifier gọn nhẹ để gắn nhãn độ phức tạp và cấp độ rủi ro cho request. Năng lực của mô hình, cách diễn đạt của người dùng và phân bổ request đều biến đổi liên tục, do đó các ngưỡng cắt, tỷ lệ định tuyến sai và mẫu đánh giá cần phải được rà soát định kỳ. Định tuyến học máy, cá nhân hóa và Agentic phụ thuộc nhiều hơn vào các dữ liệu này: hai loại đầu còn phải xử lý bài toán quyền riêng tư và tính giải trình, loại sau phải quản lý trần chi phí cho các lượt gọi nhiều bước và vấn đề gỡ lỗi.

Kịch bản đa Agent còn có thêm một tầng lựa chọn theo vai trò (role). Có thể tra cứu cấu hình của vai trò trước, sau đó kế thừa model mặc định của toàn bộ chiến lược, cuối cùng mới dùng đến giá trị mặc định của hệ thống; khi phân tích kỹ thuật, tổng hợp dư luận và báo cáo cuối cùng do các vai trò khác nhau đảm nhiệm, cách này sẽ ổn định hơn nhiều so với việc chỉ định tuyến theo tên endpoint. Khi Provider được cấu hình đang ở trạng thái khỏe mạnh thì dùng trực tiếp, chỉ khi nó chưa được đăng ký hoặc không qua được health check mới chọn từ các ứng viên khả dụng dựa theo năng lực, độ trễ, chi phí và tỷ lệ thành công.

Trước khi một lượt gọi Agent bắt đầu, cần chốt model, Provider, tên model được chọn và việc có xảy ra phương án dự phòng trước khi gọi hay không vào cùng một bản ghi kết quả định tuyến duy nhất. Trong quá trình sinh stream nếu trạng thái sức khỏe có biến động, tuyệt đối không được định tuyến lại sau khi kết thúc rồi mới ghi nhận usage, nếu không chi phí thực tế do Provider A tạo ra có thể bị tính nhầm cho Provider B. Phương án dự phòng trước khi gọi ở đây cũng không đồng nhất với việc phát lại xuyên Provider sau khi lỗi: trường hợp sau còn phải định nghĩa ngoại lệ nào được phép phát lại, kết quả công cụ ReAct có được tái sử dụng hay không, và đoạn văn bản đã stream ra ngoài thì xử lý thế nào.

## LLM Gateway Cần Trang bị Những Năng lực nào?

![Sơ đồ tổng quan về LLM Gateway](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-overview-cd018e58.png)

### Tích hợp Thống nhất Đa Mô hình

Thứ không nên nằm rải rác nhất trong code nghiệp vụ chính là các lệnh gọi SDK của nhà cung cấp.

Hôm nay service này gọi OpenAI, ngày mai service khác gọi DeepSeek, ngày kia một cron job lại tích hợp Gemini. Trong ngắn hạn thì chạy được, nhưng lâu dần sẽ tích tụ thành một đống logic trùng lặp: API key, timeout, retry, parse stream, mã lỗi, usage, định dạng log, ánh xạ tên model, nơi nào cũng phải tự xử lý một lượt.

Cách làm chuẩn xác hơn là định nghĩa trước request và response thống nhất.

```java
public record LLMRequest(
        String requestId,
        String idempotencyKey,
        String tenantId,
        String userId,
        String scene,
        List<ChatMessage> messages,
        Map<String, Object> responseSchema,
        LLMOptions options
) {
}

public record LLMResponse(
        String requestId,
        String model,
        String provider,
        String content,
        TokenUsage usage,
        String finishReason,
        boolean fallbackUsed
) {
}

public interface ProviderClient {

    String providerName();

    boolean supports(String model);

    LLMResponse chat(LLMRequest request, RenderedPrompt prompt, ModelRoute route);

    Flux<LLMChunk> streamChat(LLMRequest request, RenderedPrompt prompt, ModelRoute route);
}

public interface LLMGateway {

    LLMResponse chat(LLMRequest request);
}
```

Các interface này giải quyết một số vấn đề thực tế:

- Phía nghiệp vụ chỉ phụ thuộc vào `LLMGateway`, không phụ thuộc vào SDK của nhà cung cấp cụ thể nào.
- Tên model, nhà cung cấp, chiến lược fallback đều có thể cấu hình hóa.
- Usage, chi phí, mã lỗi, độ trễ có thể ghi nhận thống nhất.
- Sau này tích hợp thêm model mới, chỉ cần bổ sung thêm một Provider Adapter.

Hình thái cổng vào của request thống nhất, trong thực tế kỹ thuật phổ biến nhất là phong cách tương thích với OpenAI Chat Completions. Các giải pháp như LiteLLM, DeepSeek, Qwen đều cung cấp cổng vào tương tự, và các gateway như Kong AI Gateway cũng dùng định dạng tương thích OpenAI làm một trong những cổng vào chung cho AI plugin.

Lợi ích của việc mở ra interface tương thích OpenAI rất rõ ràng: phía nghiệp vụ thường không cần sửa đổi lớn về SDK, chỉ cần đổi `base_url` hoặc địa chỉ gateway là có thể chuyển từ gọi trực tiếp nhà cung cấp sang cổng vào thống nhất.

Nhưng đây chỉ là thống nhất về hình thái cổng vào, không đồng nghĩa với việc cổng ra cũng thống nhất.

Các gateway dạng managed như Cloudflare AI Gateway còn phải tích hợp theo các phương thức Provider Native, REST hoặc Binding mà tài liệu hiện hành của nó hỗ trợ, không thể mặc định mọi nhà cung cấp đều có thể chuyển tiếp nguyên trạng như cùng một giao thức OpenAI. Giao thức OpenAI cũng không thể diễn đạt được một số năng lực đặc thù của nhà cung cấp, ví dụ như extended thinking của Anthropic, metadata grounding của Gemini. Những năng lực này thường phải đưa vào `extra_body`, `metadata` hoặc các trường mở rộng nội bộ, sau đó do Provider Adapter chuyển đổi sang định dạng request riêng của nhà cung cấp mục tiêu.

Công việc của Provider Adapter không chỉ dừng lại ở endpoint và header xác thực; việc gọi tool, sự kiện stream, system prompt, đầu ra có cấu trúc, usage và mã lỗi cũng phải được chuyển đổi chính xác.

| Khía cạnh | OpenAI Chat Completions | Anthropic Messages API | Gemini generateContent |
| --- | --- | --- | --- |
| Trường gọi Tool | `tool_calls` | `tool_use` content block | `functionCall` part |
| Truyền kết quả Tool về | message `role=tool` | `role=user` + `tool_result` content block | `functionResponse` part |
| Tool Schema | JSON Schema | Tập con của JSON Schema | Tập con của OpenAPI |
| Vị trí System Prompt | system/developer trong `messages` | Trường `system` ở top-level | `systemInstruction` |
| Gọi nhiều Tool đồng thời | Hỗ trợ gốc (Native) | Hỗ trợ gốc (Native) | Kiểm chứng riêng theo model & SDK |
| Mở rộng năng lực đặc thù | `metadata` / tham số mở rộng | thinking, cache_control... | grounding, cachedContent... |

Interface tương thích OpenAI giải quyết phương thức tích hợp ở phía nghiệp vụ, nhưng không thể xóa bỏ sự khác biệt về giao thức của các nhà cung cấp. Việc có hỗ trợ Claude, Gemini hay model private hay không chủ yếu phụ thuộc vào việc Provider Adapter có thể chuyển đổi request và event một cách chính xác hay không; việc tài liệu sản phẩm ghi "hỗ trợ Provider X" không có nghĩa là mọi năng lực đặc thù đều có thể ánh xạ mà không bị mất mát thông tin.

Việc gom các lượt gọi mô hình về một mối trước, sau đó từng bước bổ sung định tuyến, rate limiting và kiểm toán, thông thường sẽ dễ kiểm chứng hơn nhiều so với việc cố gắng bao quát hết mọi năng lực đặc thù ngay từ đầu.

### Định tuyến Mô hình (Model Routing)

Định tuyến mô hình rất dễ nhìn thấy hiệu quả kinh tế, đặc biệt là trong các hệ thống có sự phân tầng tác vụ rõ rệt.

Phiên bản 1 hoàn toàn có thể làm theo dạng cấu hình, không cần huấn luyện mô hình.

```yaml
routes:
  - scene: intent_classification
    primary: tier-fast
    fallback:
      - tier-nano
      - tier-balanced
    max_output_tokens: 256
    risk_level: low

  - scene: complex_reasoning
    primary: tier-flagship
    fallback:
      - tier-pro
      - tier-balanced
    max_output_tokens: 4096
    risk_level: medium

  - scene: legal_review
    primary: tier-flagship
    fallback:
      - tier-compliance
    require_human_review: true
    risk_level: high

default:
  primary: tier-balanced
  fallback:
    - tier-fast
```

Ở đây `tier-*` là tên phân tầng mô hình nội bộ của Gateway, không phải là ID model thực tế của nhà cung cấp. Trên production, thông thường `Model Registry` sẽ ánh xạ `tier-fast`, `tier-balanced`, `tier-flagship` sang các model cụ thể đang khả dụng, đồng thời trong log sẽ ghi nhận cả "phân tầng model" lẫn "tên model thực tế". Như vậy khi nâng cấp model chỉ cần sửa registry và cấu hình canary, không cần sửa đổi rule định tuyến nghiệp vụ.

Khi ra quyết định định tuyến, Gateway tối thiểu phải xem xét các yếu tố sau:

| Yếu tố | Tác dụng |
| --- | --- |
| `scene` | Kịch bản nghiệp vụ, quyết định model mặc định và cấp độ rủi ro |
| Token đầu vào | Phán đoán xem có vượt quá context window của model hoặc ngân sách không |
| Độ dài đầu ra | Kiểm soát chi phí và độ trễ sinh văn bản |
| Gói tài khoản người dùng | Người dùng miễn phí và doanh nghiệp có thể đi qua các model khác nhau |
| Cấp độ rủi ro | Tác vụ rủi ro cao bắt buộc phải đi qua model tuân thủ hoặc có người duyệt |
| Trạng thái model hiện tại | Chuyển hướng khi nhà cung cấp lỗi, bị 429, hoặc độ trễ P95 tăng cao |
| Chất lượng lịch sử | Giảm trọng số khi một model liên tục thất bại trên một loại tác vụ |

Một Router đơn giản có thể viết như sau:

```java
public class RuleBasedModelRouter {

    private final RouteConfigRepository routeConfigRepository;
    private final ModelHealthService modelHealthService;

    public ModelRoute route(LLMRequest request, TokenBudget budget) {
        RoutePolicy policy = routeConfigRepository.findByScene(request.scene())
                .orElseGet(routeConfigRepository::defaultPolicy);

        for (String model : policy.candidates()) {
            if (!budget.fits(model)) {
                continue;
            }
            if (!modelHealthService.isAvailable(model)) {
                continue;
            }
            return ModelRoute.of(model, policy.providerOf(model), policy);
        }

        throw new NoAvailableModelException(request.scene());
    }
}
```

Đoạn code này không phức tạp, điểm mấu chốt nằm ở ranh giới trách nhiệm: Router chỉ chịu trách nhiệm chọn model, không chịu trách nhiệm gọi model; health check chỉ cung cấp trạng thái, không lồng ghép logic nghiệp vụ; việc phán đoán ngân sách được tách riêng ra ngoài để sau này thay đổi phương thức ước tính cũng rất thuận tiện.

![Sơ đồ quyết định định tuyến mô hình trong LLM Gateway](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-routing-decision-ba168a45.webp)

### Giáng cấp Êm dịu (Fallback)

Fallback không đơn giản chỉ là hễ lỗi thì đổi sang model khác thử lại.

Cần phải phân biệt rõ loại lỗi trước tiên.

| Loại lỗi | Có phù hợp để Fallback? | Phương thức xử lý |
| --- | --- | --- |
| Mạng chập chờn nhất thời | Phù hợp | Retry ngắn, sau đó chuyển sang model dự phòng |
| Nhà cung cấp lỗi 5xx | Phù hợp | Retry + Ngắt mạch (Circuit breaker) + Đổi nhà cung cấp |
| Bị 429 Rate Limit | Phù hợp nhưng cần thận trọng | Đọc header `Retry-After`, cần thiết thì xếp hàng hoặc đổi model |
| Vượt quá Context Window | Không phù hợp để retry trực tiếp | Nén context, giảm đoạn trích RAG hoặc đổi sang model context dài |
| Lỗi tham số request | Không phù hợp | Sửa lại request, không spam tiếp lên nhà cung cấp |
| Từ chối do an toàn nội dung | Thường không phù hợp | Chuyển sang luồng từ chối nghiệp vụ hoặc đưa người duyệt |
| Parse đầu ra có cấu trúc lỗi | Có thể khắc phục có giới hạn | Retry với cùng Schema, sửa định dạng hoặc báo lỗi dứt khoát |

Trong bảng, "chuyển sang model dự phòng" có nghĩa là Gateway sẽ khởi tạo một attempt gọi mới, chứ không phải để một callback retry chung chung tùy tiện đổi client sau khi bắt được exception. Khi một request đã từng thực thi thao tác ghi dữ liệu, gọi tool hoặc trừ tiền, cần phải xác nhận xem bước đó có cho phép phát lại (replay) hay không; một khi văn bản stream đã gửi tới người dùng, bạn cũng không thể ghép nối các đoạn văn bản của hai model khác nhau thành một câu trả lời duy nhất.

Lượt gọi stream còn phải xử lý riêng các tình huống người dùng hủy yêu cầu, timeout TTFT, đứt kết nối và client kết nối lại. Gateway cần lưu lại trạng thái, số thứ tự chunk và lý do ngắt luồng của phản hồi stream, tránh việc ghi nhận nhầm một request bị đứt luồng thành thành công, cũng như không gửi lặp lại các đoạn văn bản đã gửi trước đó khi client kết nối lại.

![Xử lý ngoại lệ trong lượt gọi streaming](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-api-engineering-streaming-exceptions-dd357375.webp)

Một chuỗi Fallback có thể thiết kế như sau:

```text
Model ưu tiên khả dụng -> Gọi bình thường
Model ưu tiên bị 429 -> Đọc thông tin rate limit -> Chuyển sang model cùng cấp dự phòng
Model dự phòng cũng không khả dụng -> Chuyển sang model siêu nhẹ và rút ngắn token đầu ra
Vẫn không khả dụng -> Xếp hàng, trả về thông báo giáng cấp hoặc chuyển sang nhân viên hỗ trợ
```

Đối với các request có tác dụng phụ (side-effect) như lưu báo cáo vào DB, thực thi công cụ và trừ tiền, Fallback bắt buộc phải được thiết kế đồng bộ với cơ chế idempotency. Việc sinh văn bản thuần túy tuy không làm thay đổi trạng thái nghiệp vụ, nhưng gọi lặp lại vẫn phát sinh thêm chi phí và tạo ra các phiên bản nội dung khác nhau, do đó mỗi attempt đều phải lưu lại bản ghi và tùy theo kịch bản để quyết định có tái sử dụng kết quả hay không.

Ngữ nghĩa sau khi giáng cấp cũng phải được thể hiện rõ ràng. Nếu các tác vụ rủi ro cao như thẩm định pháp lý bị hạ từ model mạnh xuống model giá rẻ, bắt buộc phải đánh dấu và đưa vào diện kiểm duyệt; khi không có ứng viên nào đáp ứng được ràng buộc chất lượng, việc trả về thông báo "Hệ thống đang bận, vui lòng thử lại sau" sẽ an toàn hơn nhiều so với việc âm thầm trả về một kết luận chất lượng kém.

Bản ghi idempotency không thể chỉ lưu một cờ "đã xử lý". Đối với các kịch bản cần tái sử dụng kết quả, có thể lưu `LLMResponse` cuối cùng, nhưng key và value đều phải gắn chặt với ngữ nghĩa request, ví dụ `tenant_id + scene + idempotency_key + request_fingerprint`, đồng thời ghi nhận phiên bản chiến lược Prompt/định tuyến và thời gian hết hạn. Khi fingerprint của request không khớp với cùng một idempotency key, cần từ chối tái sử dụng để tránh trả nhầm kết quả lịch sử của một request khác cho người dùng.

Các request đồng thời còn đòi hỏi phải chiếm giữ tài nguyên một cách nguyên tử (atomic claim). Có thể dùng unique constraint của database, conditional update hoặc Redis `SET NX` để tạo bản ghi trạng thái `running`, chỉ request nào giành được claim mới được phép gọi mô hình; các request khác sẽ chờ đợi, nhận thông báo xung đột hoặc tái sử dụng kết quả `completed`. Các trạng thái `failed`, `running` bị timeout và việc tiếp quản lease (lease takeover) cũng phải định nghĩa rõ ràng, tuyệt đối không triển khai idempotency bằng giải pháp "tra cứu trước, ghi dữ liệu sau". Nhật ký và bộ nhớ cache cũng phải tuân thủ nghiêm ngặt việc cô lập tenant, bảo vệ dữ liệu nhạy cảm và chính sách lưu trữ.

![Quy trình xử lý retry và idempotency khi gọi mô hình](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-api-engineering-retry-idempotency-329ec34c.webp)

### Rate Limiting và Hạn ngạch (Quota)

API LLM vẫn có thể giới hạn lưu lượng theo QPS, RPM và số lượng kết nối đồng thời, nhưng nếu chỉ nhìn vào số lượng request thì hoàn toàn không đủ.

Hai request đều được tính là 1 lượt gọi, nhưng chi phí có thể chênh nhau hàng chục lần:

- Request A: Đầu vào 500 Token, đầu ra 100 Token.
- Request B: Đầu vào 80K Token, đầu ra 8K Token.

Nếu chỉ nhìn số lượng request, B và A như nhau. Nhưng đối với hạn ngạch nhà cung cấp, hóa đơn tiền và độ trễ, chúng hoàn toàn không cùng một đẳng cấp.

LLM Gateway thông thường phải quản lý rate limit ở các tầng sau:

| Chiều giới hạn | Đối tượng kiểm soát | Vấn đề giải quyết |
| --- | --- | --- |
| Cấp User | Request của từng người dùng đơn lẻ | Chống lạm dụng, chống script cào dữ liệu |
| Cấp Tenant | Ngân sách của toàn team/tenant | Kiểm soát chi phí, cô lập gói dịch vụ |
| Cấp Model | Dung lượng của một model cụ thể | Chống việc model "hot" bị quá tải |
| Cấp Provider | OpenAI / Anthropic / DeepSeek... | Ngăn phụ thuộc bên ngoài kéo sập hệ thống nội bộ |
| Cấp Token | Lượng Token đầu vào và đầu ra | Kiểm soát chi phí thực tế và áp lực hạn ngạch |

Cách làm vững chắc hơn là: trước khi gửi request tới nhà cung cấp, hãy trừ ngân sách trước.

```java
public record TokenBudget(
        int estimatedInputTokens,
        int reservedOutputTokens,
        int totalReservedTokens
) {
}

public interface LLMRateLimiter {

    RateLimitPermit acquire(String tenantId, String userId, String model, TokenBudget budget);

    void reconcile(RateLimitPermit permit, TokenUsage actualUsage);

    void release(RateLimitPermit permit);
}
```

Sau khi vào Gateway, trước tiên ước tính `input_tokens + reserved_output_tokens`. Bucket của user, tenant, model, provider đều cho phép trừ hạn ngạch thì mới gửi request đi. Nếu không đủ hạn ngạch thì xếp hàng, giáng cấp hoặc từ chối phục vụ.

Ngân sách cần được tạm giữ (reserve) và đối soát (reconcile) theo từng attempt. Khi model chính bị timeout hoặc đứt stream, có thể Token ở phía nhà cung cấp đã bị tiêu tốn rồi, không được hoàn trả toàn bộ hạn ngạch một cách máy móc; khi chuyển sang model dự phòng, cần phải tính toán reserve lại theo mức giá và nhà cung cấp dự phòng. Sau khi nhà cung cấp trả về usage thực tế, gọi hàm `reconcile`; trường hợp tạm thời chưa lấy được usage thì ghi nhận theo giá trị ước tính thận trọng, sau đó điều chỉnh lại qua hóa đơn hoặc đối soát bất đồng bộ.

Ước tính Token không thể chính xác tuyệt đối 100%, nhưng ước tính sơ bộ vẫn tốt hơn nhiều so với việc không ước tính gì. Đặc biệt trong các kịch bản RAG, context dài, Agent gọi công cụ, nếu không có ngân sách thì chi phí rất dễ vượt tầm kiểm soát.

Khuyến nghị thực hiện theo chu trình 4 bước: **estimate -> reserve -> usage thực tế -> reconcile**. Trước tiên dùng giá trị ước tính để giữ chỗ ngân sách, sau khi lượt gọi kết thúc thì dùng `usage` thực tế do nhà cung cấp trả về để đối soát điều chỉnh lại. Tokenizer và cấu trúc trường usage của các nhà cung cấp và model khác nhau không hoàn toàn đồng nhất, trên production thường dùng bộ ước lượng xấp xỉ thống nhất để trừ ngân sách trước, sau đó dùng `input_tokens`, `output_tokens` thực tế để hiệu chỉnh. Nếu lưu thẳng số liệu ước tính vào database thì chạy lâu ngày, thống kê chi phí và hạn ngạch sẽ tích tụ sai số rất lớn.

![Vòng đời tạm giữ và đối soát ngân sách Token](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-token-budget-lifecycle-a2546f71.webp)

### Thống kê Chi phí (Cost Accounting)

Nhiều đội ngũ nói muốn "cắt giảm chi phí mô hình lớn", nhưng ngay cả tiền đang tiêu vào đâu cũng không nắm rõ.

Đó không phải là tối ưu, đó là đoán mò.

LLM Gateway bắt buộc phải ghi nhận các trường phân bổ chi phí cho mỗi lượt gọi:

| Tên trường | Ý nghĩa |
| --- | --- |
| `request_id` | ID duy nhất của một request nghiệp vụ |
| `attempt_id` | ID duy nhất của một lượt gọi model; fallback hoặc retry sẽ sinh ra nhiều attempt |
| `tenant_id` | Định danh tenant hoặc team |
| `user_id` | Định danh người dùng |
| `scene` | Kịch bản nghiệp vụ (ví dụ: CSKH, tóm tắt, sinh code) |
| `prompt_version` | Phiên bản Prompt |
| `provider` | Nhà cung cấp mô hình |
| `model_tier` | Phân tầng model nội bộ do router lựa chọn |
| `model` | Tên model thực tế được gọi |
| `input_tokens` | Lượng Token đầu vào |
| `output_tokens` | Lượng Token đầu ra |
| `cached_tokens` | Lượng Token hit Prompt cache hoặc cache của nhà cung cấp |
| `cost` | Chi phí tính toán dựa trên ảnh chụp bảng giá (price snapshot) |
| `price_version` | Phiên bản bảng giá hoặc thời điểm áp dụng giá |
| `latency_ms` | Tổng độ trễ tính bằng mili-giây |
| `ttft_ms` | Độ trễ chữ đầu tiên (Time to First Token) |
| `fallback_used` | Có kích hoạt fallback hay không |
| `error_code` | Mã phân loại lỗi |

Chi phí thường được tính theo ảnh chụp bảng giá: `input_tokens × đơn giá đầu vào + output_tokens × đơn giá đầu ra`, cộng thêm phí ghi cache, đọc cache hoặc các phụ phí riêng của nhà cung cấp. Do đó `cached_tokens` không thể chỉ coi như Token đầu vào bình thường; nó phải được diễn giải cùng với model và phiên bản giá thì mới tái hiện được số tiền chính xác của lượt gọi.

Các trường này giúp gắn kết hóa đơn trở lại từng quyết định kỹ thuật cụ thể: khi chi phí của một tenant hay tính năng tăng đột ngột, hãy kiểm tra ngay lượng Token, phiên bản Prompt và phân tầng model; khi Fallback xảy ra tập trung, hãy xem nhà cung cấp, tập ứng viên và mã lỗi tại thời điểm đó; sau khi nâng cấp model, hãy dùng chất lượng, độ trễ và chi phí trên cùng một kịch bản để so sánh đối chứng.

Bảng giá, mức chiết khấu cache và các khoản phụ phí của nhà cung cấp sẽ thay đổi theo thời gian, do đó bản ghi chi phí không thể chỉ lưu mỗi con số `cost`. Chi tiết `usage`, phiên bản giá và thời điểm tính toán cần phải được lưu trữ cùng với mỗi lượt gọi, để khi có chênh lệch hóa đơn chúng ta mới biết cần dùng bộ quy tắc nào để tính lại. Việc điều chỉnh định tuyến sau này cũng phải dựa trên các bản ghi gọi và các mẫu lỗi này làm căn cứ.

### Khả năng Quan sát và Kiểm toán (Observability & Audit)

Hệ thống truyền thống gặp sự cố thì xem log, Trace, metric. Hệ thống AI cũng y như vậy, chỉ là cần ghi nhận thêm một số trường đặc thù của mô hình.

Các sản phẩm như Cloudflare AI Gateway, LiteLLM, Kong AI Gateway đều đặt log, Token, chi phí, lỗi, độ trễ, cache, rate limit ở vị trí rất nổi bật. Ứng dụng AI khi gặp sự cố, nếu chỉ ghi lại câu trả lời cuối cùng thì cơ bản không thể nào mổ xẻ đánh giá lại được.

Một Trace của một lượt gọi mô hình tối thiểu nên có dạng như sau:

```json
{
  "request_id": "req_202605210001",
  "attempt_id": "att_01",
  "tenant_id": "team_java",
  "user_id": "u_1024",
  "scene": "knowledge_qa",
  "prompt_version": "rag_qa_v7",
  "provider": "openai",
  "model_tier": "tier-balanced",
  "model": "provider-model-id",
  "route_reason": "scene=knowledge_qa,cost_priority=true",
  "input_tokens": 4210,
  "output_tokens": 612,
  "cost": 0.0059,
  "ttft_ms": 680,
  "latency_ms": 4120,
  "fallback_used": false,
  "finish_reason": "stop"
}
```

Các thông tin `request_id`, model, lý do định tuyến và usage đã đủ để phục vụ hầu hết các nhu cầu điều tra sự cố tổng hợp; trong khi toàn văn Prompt và câu trả lời có thể chứa thông tin cá nhân, tài liệu nội bộ doanh nghiệp, mã nguồn hoặc điều khoản hợp đồng. Việc log có lưu trữ toàn văn hay không không được mặc định lưu trữ toàn bộ dài hạn, mà phải do phân loại dữ liệu, mục đích xử lý, hợp đồng, quy định pháp luật hiện hành và nhu cầu điều tra sự cố cùng quyết định. Các sản phẩm như Cloudflare AI Gateway đã chuyển việc thu thập body của request/response thành tính năng có thể cấu hình, hệ thống tự phát triển cũng nên đưa nó vào chính sách quản trị chứ không nên hardcode cứng trong code log.

Metadata cũng phải có thời hạn lưu trữ rõ ràng, bởi vì `usage`, model, độ trễ, chi phí, `route_reason` và mã lỗi cũng có thể liên kết ngược lại cá nhân hoặc tenant. Khi cần lấy mẫu lưu trữ Prompt hoặc phản hồi, hãy kiểm soát tỷ lệ và thời hạn lưu trữ dựa theo cấp độ dữ liệu, sự đồng ý của tenant và thời hạn tối thiểu cần thiết; các thông tin như số điện thoại, CMND/CCCD, thẻ ngân hàng, email, địa chỉ cần phải được khử nhạy cảm ngay tại cổng entry trước khi đi vào chuỗi ghi log. Ngoài cờ bật tắt lưu trữ, hệ thống còn phải trang bị cơ chế kiểm soát truy cập, mã hóa, xuất dữ liệu, xóa dữ liệu và bảo lưu pháp lý (legal hold), đồng thời ghi nhận mục đích xử lý và kết quả xóa bỏ cho từng loại dữ liệu.

### Caching và Semantic Caching

Cache chỉ giúp tiết kiệm chi phí khi câu trả lời có tính tái sử dụng. Request một khi có chứa quyền hạn, trạng thái thời gian thực, ngữ cảnh riêng tư hoặc nội dung đòi hỏi phán đoán chuyên môn thì bắt buộc phải bypass cache hoặc sử dụng key được phân vùng cô lập nghiêm ngặt.

| Loại Cache | Cách làm | Kịch bản phù hợp | Rủi ro |
| --- | --- | --- | --- |
| Cache Chính xác (Exact Match) | Trả về kết quả cũ khi request hoàn toàn trùng khớp | FAQ, hướng dẫn cố định, test lặp lại | Dễ trả lời sai trong ngữ cảnh cá nhân hóa và phân quyền |
| OpenAI Prompt Caching | Tự động hit cache khi tiền tố dài ổn định | System prompt dài, Tool Schema cố định | Model hỗ trợ, ngưỡng độ dài và chiết khấu phải theo dõi tài liệu chính thức |
| Anthropic Prompt Caching | Đánh dấu khối cho phép cache bằng `cache_control` | System prompt dài, tài liệu lớn, Agent nhiều lượt | Quy tắc tính phí ghi và đọc phải đối chiếu bảng giá hiện hành |
| Gemini Context Caching | Tái sử dụng context dài qua cơ chế cached content | Tài liệu dài, video, codebase, hỏi đáp nhiều lượt | Phải quản lý đối tượng cache, TTL, chi phí lưu trữ và cơ chế vô hiệu hóa |
| Semantic Cache (Cache ngữ nghĩa) | Câu hỏi tương đồng về mặt ngữ nghĩa sẽ tái sử dụng câu trả lời cũ | FAQ chăm sóc khách hàng, hướng dẫn sản phẩm, hỏi đáp rủi ro thấp | Tương đồng không đồng nghĩa với giống hệt, rất dễ trả lời lệch hướng |
| Cache phân đoạn kết quả | Cache các bản tóm tắt trung gian, kết quả truy xuất, kết quả tool | Tóm tắt tài liệu dài, xử lý hàng loạt | Việc vô hiệu hóa cache và quản lý phiên bản rất phức tạp |

Các câu hỏi FAQ của chăm sóc khách hàng rất thích hợp để cache: "cách đổi mật khẩu", "tải hóa đơn ở đâu", "hoàn tiền hội viên như thế nào". Những câu trả lời này ổn định, ít yếu tố cá nhân hóa, hiệu quả kinh tế từ cache rất rõ rệt.

Các câu hỏi gắn liền với quyền của người dùng, trạng thái thời gian thực, lời khuyên tài chính/y tế/pháp lý, hội thoại riêng tư nhiều lượt, và các câu hỏi phụ thuộc vào thời gian hiện tại, trạng thái đơn hàng hay tồn kho thì tuyệt đối không được tái sử dụng câu trả lời chung chung từ cache.

Key của Semantic Cache tối thiểu phải cô lập theo tenant, phạm vi quyền hạn, phiên bản dữ liệu, kịch bản và phiên bản Prompt; độ tương đồng vector chỉ đóng vai trò là điều kiện lọc ứng viên, không thể thay thế cho các ranh giới này. "Tại sao đơn hàng của tôi chưa được giao?" và "Đơn hàng của tôi có được hoàn tiền không?" trong không gian vector có thể rất gần nhau, nhưng một câu hỏi cần giải thích trạng thái vận chuyển còn câu kia liên quan đến quy chế hậu mãi; việc match nhầm cache sẽ dẫn người dùng đi sai quy trình nghiệp vụ. Tỷ lệ hit cache cần được theo dõi song song với việc kiểm tra nghiệp vụ, tỷ lệ khiếu nại hoặc tỷ lệ chuyển sang nhân viên hỗ trợ.

Prompt Cache cũng không phải cứ bật lên là có lãi. Cache tường minh thường phân định rõ chi phí ghi và đọc; cache tự động cũng chịu ảnh hưởng bởi model hỗ trợ, độ dài tiền tố tối thiểu và biến động bảng giá. Nếu system prompt, Tool Schema hoặc context của bạn mỗi lần đều chèn thêm timestamp, ID ngẫu nhiên, trạng thái tạm thời của người dùng, tiền tố liên tục thay đổi thì tỷ lệ hit cache sẽ tụt dốc, hiệu quả chi phí mang lại sẽ rất tệ. Đặt nội dung ổn định lên phía trước, nội dung động ra phía sau chính là nguyên tắc cấu trúc Prompt quan trọng nhất khi tận dụng tính năng cache của nhà cung cấp.

## Thiết kế một LLM Gateway Cấp Production

### Một LLM Gateway Cấp Production Trông như thế nào?

Khi thiết kế LLM Gateway, trước tiên có thể chia thành các component sau:

| Component | Trách nhiệm |
| --- | --- |
| API Adapter | Mở ra API thống nhất ra bên ngoài, tương thích phong cách OpenAI hoặc request nội bộ |
| Auth / Tenant | Xác thực, nhận diện tenant, kiểm tra gói dịch vụ và quyền hạn |
| Prompt Renderer | Render Prompt template, gắn nhãn phiên bản Prompt |
| Token Budget Estimator | Ước tính Token đầu vào và đầu ra, phán đoán xem có vượt ngân sách không |
| Model Registry | Quản lý năng lực model, giá cả, context window, nhà cung cấp, trạng thái |
| Router | Lựa chọn model dựa trên kịch bản, ngân sách, độ trễ, mức độ rủi ro |
| Provider Adapter | Thích ứng sự khác biệt giao thức qua interface `ProviderClient` thống nhất (tool, stream, usage, lỗi) |
| Retry / Fallback | Thực hiện retry, giáng cấp và ngắt mạch theo từng loại lỗi cụ thể |
| Rate Limiter | Giới hạn lưu lượng đa chiều: user, tenant, model, provider, Token |
| Cost Tracker | Ghi nhận usage, tính toán chi phí, phân bổ theo tenant và kịch bản |
| Observability | Xuất ra metrics, log, Trace, cảnh báo |
| Audit Log | Kiểm toán các request quan trọng, hỗ trợ khử nhạy cảm, lưu trữ và phát lại |

Phiên bản đầu tiên hãy hoàn thành API thống nhất, Provider Adapter cùng với việc ghi log usage, chi phí, lỗi và độ trễ. Khi các bản ghi lượt gọi đã đủ ổn định, lúc đó mới nối thêm định tuyến theo rule, Fallback, ngân sách Token và hạn mức tenant; việc phát lại chất lượng, kiểm toán và định tuyến phân loại cần xây dựng dựa trên những dữ liệu nền tảng này. Cách tiếp cận này giúp kiểm chứng xem việc gọi mô hình đã được gom về một mối chuẩn xác chưa, trước khi quyết định có nên duy trì độ phức tạp của các thuật toán định tuyến nâng cao hay không.

### Request Đi vào thì Bên trong Gateway Chạy như thế nào?

Sau khi request đi vào Gateway, trước tiên nó sẽ hoàn thành khâu xác thực và nhận diện tenant, xác định các tính năng được phép dùng, gói dịch vụ và ranh giới ngân sách; tiếp đó dựa vào tham số request hoặc classifier gọn nhẹ để xác định `scene`, render phiên bản Prompt, context và Tool Schema tương ứng.

Khâu ước tính Token và định tuyến sẽ diễn ra ngay sau đó. Gateway tạm giữ (reserve) Token đầu vào và Token đầu ra tối đa cho các model ứng viên, đồng thời xin cấp hạn ngạch trên các chiều user, tenant, model và provider; sau khi kết quả định tuyến được chốt cố định, Provider Adapter sẽ tiến hành gọi đồng bộ hoặc gọi dạng stream. Văn bản trong response, JSON có cấu trúc, tool call, usage và finish reason đều phải quy về attempt cụ thể này.

Khi xảy ra lỗi mạng, lỗi 429 hoặc parse thất bại, việc phân loại lỗi sẽ quyết định nên retry, đổi sang model ứng viên khác, xếp hàng hay báo lỗi dứt khoát. Mỗi attempt mới đều phải tính toán tạm giữ ngân sách lại; sau khi lượt gọi kết thúc sẽ đối soát theo usage thực tế, ghi lại model, nhà cung cấp, phiên bản Prompt, lý do định tuyến, độ trễ và thông tin lỗi, cuối cùng mới trả kết quả thống nhất về cho service nghiệp vụ.

![Vòng đời của một request trong LLM Gateway](/media/jg/ext/oss.javaguide.cn/javaguide/ai/llm/llm-gateway-request-lifecycle-b332e067.webp)

### Chiến lược Định tuyến Tiến hóa từ Đơn giản đến Thông minh như thế nào?

Chiến lược định tuyến không nên làm một bước lên mây. Các giải pháp như rule cố định, định tuyến tầng, định tuyến ngữ nghĩa/phân loại, định tuyến học máy, định tuyến cá nhân hóa và định tuyến Agentic đã nêu ở trên thực chất tương ứng với một lộ trình tiến hóa, chứ không phải một danh sách bắt buộc phải làm hết ngay trong phiên bản đầu.

Nhịp độ vững chắc hơn là: trước tiên làm cho hệ thống có thể kiểm soát được, sau đó làm cho hệ thống tiết kiệm tiền, và cuối cùng mới làm cho hệ thống trở nên thông minh.

| Giai đoạn | Chiến lược tương ứng | Năng lực trọng tâm | Tín hiệu để bước sang giai đoạn tiếp theo |
| --- | --- | --- | --- |
| Giai đoạn 1 | Model cố định + Cấu hình thủ công | Gom các lượt gọi mô hình về một mối, tránh SDK phân tán | Nhiều kịch bản bắt đầu dùng chung model, chi phí và độ trễ chênh lệch rõ rệt |
| Giai đoạn 2 | Định tuyến theo Rule cố định | Chọn model theo kịch bản, tenant, cấp độ rủi ro | Rule ngày càng nhiều, duy trì thủ công bắt đầu quá tải |
| Giai đoạn 3 | Ưu tiên chi phí / Định tuyến tầng | Thử model nhỏ trước, thất bại hoặc độ tin cậy thấp mới nâng cấp | Đã có khâu kiểm tra chất lượng ổn định và chấp nhận được độ trễ tăng thêm |
| Giai đoạn 4 | Định tuyến Ngữ nghĩa / Phân loại | Định tuyến theo loại query, độ phức tạp, rủi ro | Có đủ mẫu request thực tế để đánh giá sự trôi dạt của classifier |
| Giai đoạn 5 | Feedback chất lượng + Hồi quy chi phí | Dùng Trace để replay chất lượng model và hiệu quả chi phí | Đã có dataset đánh giá, lấy mẫu thủ công hoặc vòng feedback nghiệp vụ |
| Giai đoạn 6 | Học máy / Cá nhân hóa / Agentic | Linh hoạt chọn model, thậm chí đổi model theo từng bước tác vụ | Lưu lượng lớn, đa tác vụ, đa model, và đã có hệ thống đánh giá liên tục |

Trước khi bước sang giai đoạn tiếp theo, cần dùng các tín hiệu trong bảng để xác minh xem độ phức tạp tăng thêm có thực sự mang lại lợi ích hay không, đồng thời luôn giữ lại các rule cố định làm đường lui để rollback khi cần. Định tuyến phân loại đòi hỏi phải giám sát tỷ lệ định tuyến sai và sự trôi dạt của ngưỡng; định tuyến học máy hoặc Agentic còn cần dataset đánh giá ổn định, Trace thực tế trên production, trần chi phí và kiểm soát quyền riêng tư.

### Phải làm gì khi Định tuyến Sai?

Định tuyến chắc chắn sẽ có lúc sai.

Bất kỳ chiến lược định tuyến nào cũng sẽ xuất hiện phán đoán nhầm, hệ thống production bắt buộc phải để lại lối mở để phát hiện, xử lý dự phòng và phát lại (replay).

Các phương thức xử lý dự phòng phổ biến:

| Vấn đề | Phương thức xử lý dự phòng |
| --- | --- |
| Độ tin cậy của classifier thấp | Đi qua model mặc định tầm trung-mạnh, hoặc yêu cầu người dùng làm rõ |
| Model nhỏ sinh kết quả kém chất lượng | Tự động nâng cấp lên model mạnh để thử lại |
| Tác vụ rủi ro cao bị định tuyến nhầm vào luồng rủi ro thấp | Rule rủi ro có độ ưu tiên cao hơn rule chi phí |
| Model mới lên production bị trôi dạt chất lượng | Phát hành canary, A/B testing, hồi quy trên dataset đánh giá cố định |
| Người dùng khiếu nại câu trả lời sai | Dựa vào `request_id` để replay Prompt, model, context và lý do định tuyến |
| Độ trễ P95 của một model tăng vọt | Health check chủ động giảm trọng số hoặc tạm thời ngắt mạch (circuit break) |

"Tự động nâng cấp lên model mạnh để thử lại" chỉ phù hợp với các request phi trạng thái, không có tác dụng phụ (side-effect) và cho phép phát lại. Agent có gọi công cụ thì cần phải lưu trữ bền vững kết quả công cụ của lượt hiện tại hoặc hủy bỏ dứt khoát lượt thực thi này; nếu không model sau khi nâng cấp có thể gọi lại công cụ một lần nữa, dẫn đến trạng thái dữ liệu và chi phí đều bị sai lệch.

Log định tuyến ngoài tên model còn phải ghi nhận thêm `route_reason`, nếu không sau này sẽ không thể tái hiện được căn cứ đưa ra quyết định lúc đó.

Ví dụ:

```json
{
  "scene": "intent_classification",
  "selected_model_tier": "tier-fast",
  "selected_model": "provider-model-id",
  "route_reason": "scene_rule:low_risk,cost_priority,estimated_tokens=320",
  "confidence": 0.91,
  "fallback_candidates": ["tier-nano", "tier-balanced"]
}
```

Nếu không có `route_reason`, hệ thống định tuyến về sau sẽ cực kỳ khó tinh chỉnh.

## Lựa chọn các Giải pháp Phổ biến Hiện nay

### Tự phát triển, LiteLLM, Cloudflare AI Gateway, Kong AI Gateway, Inworld Router nên chọn cái nào?

Hiện nay có rất nhiều giải pháp LLM Gateway / Router, đừng chỉ nhìn vào việc "hỗ trợ bao nhiêu model". Khi lựa chọn giải pháp, trước hết hãy tự trả lời các câu hỏi: tech stack của team là gì, yêu cầu tuân thủ bảo mật khắt khe đến đâu, quy mô lưu lượng ra sao, có bắt buộc phải self-host không, đã có sẵn API Gateway chưa, và có cần khả năng quan sát chuyên sâu không.

| Giải pháp | Ưu thế chính | Kịch bản phù hợp | Kịch bản chưa phù hợp |
| --- | --- | --- | --- |
| Tự phát triển Gateway gọn nhẹ | Tự chủ, bám sát nghiệp vụ, kết hợp sâu với phân quyền, tính phí, kiểm toán nội bộ | Có năng lực backend, yêu cầu rõ ràng, muốn tiến hóa từ từ từ rule | Muốn tích hợp nhanh hàng loạt nhà cung cấp, hoặc thiếu nhân lực bảo trì |
| LiteLLM | Tích hợp đa nhà cung cấp, định dạng tương thích OpenAI, hệ sinh thái Proxy / SDK trưởng thành | Đội ngũ platform, tích hợp nhanh, thử nghiệm đa model, cổng vào thống nhất | Kịch bản tuân thủ nghiêm ngặt hoặc quản trị doanh nghiệp chuyên sâu cần tùy biến lớn; production cần khóa version và bảo vệ chuỗi cung ứng |
| Cloudflare AI Gateway | Cổng vào managed, phân tích log, cache, rate limit, retry, định tuyến linh hoạt, DLP, BYOK | Đã nằm trên hạ tầng Cloudflare, muốn có ngay giám sát, cache và cổng thống nhất | Yêu cầu self-host tuyệt đối, triển khai on-premise, quản trị doanh nghiệp phức tạp |
| Kong AI Gateway | Năng lực quản trị API doanh nghiệp mạnh mẽ, hệ sinh thái plugin hoàn thiện, kết hợp tốt auth, rate limit, DLP, quản trị chi phí | Đã có sẵn hạ tầng Kong, hoặc cần đưa request AI vào chung hệ thống API Gateway của doanh nghiệp | Dự án giai đoạn đầu của team nhỏ, hoặc không muốn đưa cả hệ thống API Gateway đồ sộ vào |
| Inworld Router | Định tuyến có điều kiện, phân chia lưu lượng, thử nghiệm và sticky user assignment | Voice thời gian thực, AI đối thoại, công cụ AI lập trình, phân tầng user và A/B testing | Cần kiểm toán mã nguồn mở, triển khai private hoặc kịch bản cần SLA doanh nghiệp rõ ràng thì phải xác nhận riêng |
| Dự án nghiên cứu (LLMRouter / RouteLLM) | Thuật toán định tuyến phong phú, thích hợp kiểm chứng định tuyến phức tạp và đánh đổi chi phí-chất lượng | Nghiên cứu, thực nghiệm, đánh giá offline, kiểm chứng chiến lược định tuyến | Dùng trực tiếp làm Gateway production; cần phải tự bổ sung auth, tính phí, kiểm toán, rate limit, giám sát và HA |

LiteLLM giải quyết chủ yếu bài toán trùng lặp khi tích hợp nhiều SDK model. Nghiệp vụ sử dụng thống nhất interface tương thích OpenAI, Proxy chịu trách nhiệm kết nối tới các nhà cung cấp khác nhau, đồng thời quản lý tập trung Key, ngân sách, phân quyền, log và định tuyến. Nó rất phù hợp cho các team muốn kết nối nhanh với nhiều nhà cung cấp mà không muốn tự phát triển tầng adapter.

Cần lưu ý rằng Proxy sẽ lưu trữ secret key của các nhà cung cấp, và toàn bộ request mô hình đều đi qua nó. Môi trường production bắt buộc phải cố định phiên bản dependency và image, thực hiện kiểm thử nâng cấp, quét lỗ hổng bảo mật và xoay vòng key, tuyệt đối không dùng image gắn tag `latest` lâu dài.

Cloudflare AI Gateway phù hợp hơn với các team đã sử dụng hệ sinh thái của Cloudflare. Chuỗi request không cần sửa đổi lớn là đã có thể bổ sung log, cache, rate limit, retry và Fallback, đồng thời hỗ trợ dynamic routing, BYOK và quét DLP.

Việc chọn mô hình cụ thể như thế nào vẫn phải do phía nghiệp vụ tự quyết định. Nếu dữ liệu, mạng và kiểm toán bắt buộc phải hoàn toàn tự chủ, trước khi tích hợp hãy xác nhận kỹ xem phương thức managed của Cloudflare có phù hợp với chính sách bảo mật hay không.

Kong AI Gateway phù hợp với các team đã dùng Kong, hoặc đang chuẩn bị xây dựng API Gateway tập trung cho doanh nghiệp. Các năng lực xác thực, rate limit, kiểm toán, bảo mật và monitoring vốn có đều có thể tái sử dụng trực tiếp, sau đó thông qua AI plugin để thực hiện chuyển đổi model, định tuyến và cân bằng tải.

Đối với team nhỏ, Kong có thể hơi nặng nề. Một số plugin AI nâng cao còn đòi hỏi license doanh nghiệp, khi lựa chọn giải pháp cần tính toán tổng thể chi phí bản quyền, triển khai và vận hành.

Inworld Router thiên về định tuyến thời gian thực và thử nghiệm A/B. Nó có thể lựa chọn model theo giá cả, tốc độ, năng lực model hoặc phân khúc người dùng, đồng thời so sánh chất lượng, tỷ lệ giữ chân và chi phí giữa các model và Prompt khác nhau.

Nó khá phù hợp với đối thoại thời gian thực, voice agent và công cụ AI hỗ trợ lập trình. Tuy nhiên, nó thuộc dạng dịch vụ managed. Nếu liên quan đến việc triển khai private, hạn chế dữ liệu, SLA hoặc ngân sách mua sắm, cần đối chiếu với tài liệu và điều khoản thương mại chính thức mới nhất.

LLMRouter phù hợp hơn cho việc nghiên cứu và đánh giá các thuật toán định tuyến, hỗ trợ các phương pháp KNN, SVM, MLP, Elo, Graph, cá nhân hóa, đa lượt và Agentic Router.

Nó không thể đem dùng trực tiếp làm gateway cho production. Các khâu phân quyền, hạn ngạch, tính phí, kiểm toán, rate limit và vận hành đều phải tự mình xây dựng thêm. Nếu không có dataset đánh giá ổn định và Trace thực tế trên production, các thuật toán phức tạp cũng rất khó chứng minh là hiệu quả hơn định tuyến theo rule.

### Lời khuyên Lựa chọn

Nếu nghiệp vụ mới bắt đầu, hãy tự phát triển một Gateway gọn nhẹ trong ứng dụng trước. Đừng vội mua các nền tảng quá nặng nề ngay từ đầu, hãy gom các lượt gọi mô hình về một mối, tối thiểu phải làm được log, usage, ngân sách Token và Fallback.

Nếu bạn cần kết nối nhanh với rất nhiều model và nhà cung cấp, hãy ưu tiên các tầng interface chuẩn hóa đã trưởng thành như LiteLLM. Nó giúp team chuyển đổi rất nhanh từ tình trạng "viết SDK khắp nơi" sang "cổng vào thống nhất".

Nếu doanh nghiệp đã dùng Kong, hãy cân nhắc Kong AI Gateway. Giá trị của nó nằm ở việc đưa lưu lượng AI hòa vào hệ thống quản trị API sẵn có của doanh nghiệp.

Nếu đã dùng sâu hệ sinh thái của Cloudflare, có thể dùng Cloudflare AI Gateway để bổ sung ngay khả năng quan sát, cache, rate limit và cổng vào thống nhất.

Nếu muốn làm định tuyến thông minh, hãy chuẩn bị sẵn dataset đánh giá và Trace thực tế trên production trước, sau đó mới bàn đến các chiến lược học máy như LLMRouter. Khi chưa có dữ liệu, thuật toán định tuyến càng phức tạp sẽ càng khó giải trình.

Tuyệt đối đừng đảo ngược thứ tự: **Hãy giải quyết bài toán quản trị kỹ thuật trước, rồi mới theo đuổi định tuyến thông minh**.

## Đánh giá một LLM Gateway Tốt hay Chưa như thế nào?

Một LLM Gateway làm tốt hay chưa không thể chỉ nhìn vào việc "đã kết nối được bao nhiêu model". Kết nối được nhiều model chỉ chứng minh tầng adapter được viết nhiều, không chứng minh được chuỗi xử lý trên production vận hành ổn định.

Các chỉ số như tỷ lệ hit định tuyến, tỷ lệ pass chất lượng, tỷ lệ Fallback, chi phí và độ trễ cần được thống kê độc lập theo từng kịch bản, phân tầng model và nhà cung cấp:

| Chỉ số | Ý nghĩa |
| --- | --- |
| Tỷ lệ hit định tuyến | Request có đi vào đúng model hoặc phân tầng model dự kiến không |
| Tỷ lệ pass chất lượng | Đầu ra có vượt qua được kiểm thử đánh giá, lấy mẫu thủ công hoặc kiểm tra nghiệp vụ không |
| Tỷ lệ Fallback | Luồng chính có ổn định không, luồng dự phòng có bị kích hoạt quá thường xuyên không |
| Chi phí trung bình | Chi phí trên mỗi request đơn lẻ hoặc trên từng kịch bản nghiệp vụ |
| Độ trễ P95 | Trải nghiệm người dùng, đặc biệt trong các kịch bản tương tác online và voice |
| TTFT | Độ trễ chữ đầu tiên, quyết định trực tiếp trải nghiệm stream |
| Tỷ lệ lỗi 429 | Áp lực bị nhà cung cấp giới hạn tần suất gọi (rate limit) |
| Tỷ lệ hit Cache | Lượng request và lượng Token tiết kiệm được nhờ cache |
| Tỷ lệ parse cấu trúc lỗi | Tính ổn định của Schema, Prompt và adapter của model |
| Trôi dạt định tuyến (Route Drift) | Sau khi model nâng cấp hoặc lưu lượng thay đổi, chiến lược định tuyến ban đầu có bị mất hiệu lực không |

Trong số đó, thứ dễ bị bỏ quên nhất chính là "sự trôi dạt định tuyến".

Năng lực của mô hình không phải là bất biến. Một model giá rẻ hôm nay không phù hợp để tóm tắt phức tạp, nhưng ba tháng sau được nhà cung cấp nâng cấp lên có thể đã hoàn toàn đủ đáp ứng. Ngược lại, một model vốn đang hoạt động ổn định sau khi nâng cấp phiên bản mới cũng có thể bị giảm sút năng lực trên một số tác vụ định dạng có cấu trúc.

Vì vậy, các rule định tuyến không thể viết xong là bỏ mặc đó. Nó cũng phải có phiên bản giống như Prompt, và phải được kiểm thử hồi quy liên tục giống như code.

## Tổng kết

LLM Gateway giúp các service nghiệp vụ thoát khỏi những chi tiết vụn vặt về giao thức nhà cung cấp, định tuyến mô hình, rate limit, cache, ngân sách Token và kiểm toán, chỉ giữ lại một cổng gọi mô hình thống nhất duy nhất.

Nhưng đối với phần lớn dự án, cổng vào này hoàn toàn có thể là một module gọn nhẹ do chính bạn tự viết trong ứng dụng, không cần thiết phải đưa thêm các component cồng kềnh vào chỉ để "ra vẻ là mình có dùng LLM Gateway". [Nền tảng Phỏng vấn AI](https://javaguide.cn/zhuanlan/interview-guide.html) của tôi hiện tại cũng đang làm theo cách này: trước tiên dùng Provider Registry tập trung và lớp bọc đóng gói lượt gọi để giải quyết bài toán trước mắt, sau này dựa vào lưu lượng thực tế và nhu cầu quản trị để quyết định bổ sung định tuyến, ngân sách, Fallback và thống kê chi phí, hoặc tiến hóa thành gateway độc lập.

Phiên bản đầu tiên hãy tập trung kiểm chứng 3 việc: request có được thích ứng chuẩn xác không, mỗi lượt gọi có thể phát lại (replay) theo đúng model và usage thực tế không, và khi có sự cố thì phương án dự phòng có hoạt động đúng kỳ vọng không. Các khâu hạn ngạch, quản trị chi phí và cache nên để lưu lượng thực tế thúc đẩy; còn định tuyến phân loại hoặc học máy thì hãy đợi đến khi có dataset đánh giá ổn định, Trace thực tế trên production và cơ chế rollback hoàn chỉnh rồi mới đưa vào.

Khi phiên bản model và bảng giá thay đổi, cùng một bộ rule định tuyến đó cũng cần phải được đánh giá lại về mặt chất lượng, độ trễ và chi phí.

## Tài liệu Tham khảo

- [LiteLLM Docs](https://docs.litellm.ai/docs/)
- [LiteLLM Security Update: Suspected Supply Chain Incident](https://docs.litellm.ai/blog/security-update-march-2026)
- [Cloudflare AI Gateway Docs](https://developers.cloudflare.com/ai-gateway/)
- [Cloudflare AI Gateway Request Handling](https://developers.cloudflare.com/ai-gateway/configuration/request-handling/)
- [Cloudflare AI Gateway Fallbacks](https://developers.cloudflare.com/ai-gateway/configuration/fallbacks/)
- [Cloudflare AI Gateway DLP](https://developers.cloudflare.com/ai-gateway/features/dlp/set-up-dlp/)
- [Cloudflare AI Gateway BYOK](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/)
- [Kong AI Gateway Docs](https://developer.konghq.com/ai-gateway/)
- [Inworld Router Docs](https://docs.inworld.ai/router/introduction)
- [LLMRouter GitHub Repository](https://github.com/ulab-uiuc/LLMRouter)
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching)
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Gemini Context Caching](https://ai.google.dev/gemini-api/docs/caching)
