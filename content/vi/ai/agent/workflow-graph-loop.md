---
title: "Workflow, Graph và Loop trong AI Workflow: Từ khái niệm đến hiện thực hóa"
description: Phân tích ba khái niệm Workflow, Graph, Loop trong luồng công việc AI, so sánh sự khác biệt giữa workflow truyền thống và AI workflow, đồng thời sử dụng Spring AI Alibaba Graph để minh họa cách hiện thực hóa State, Conditional Edge và Loop.
category: Phát triển ứng dụng AI
icon: "mdi:robot-outline"
lang: vi
sourceRef: zh-ref/ai/agent/workflow-graph-loop.md
head:
  - - meta
    - name: keywords
      content: AI Workflow,Graph,Loop,AI workflow,Spring AI Alibaba,LangGraph,State Machine,Agent,Workflow Engine
---

Các workflow engine truyền thống như Camunda, Temporal vốn cũng hỗ trợ sự kiện, rẽ nhánh, retry và compensation. Điểm phức tạp mới mà AI workflow mang lại là: output của một số node do LLM sinh ra, và việc "kết quả có đạt chuẩn hay không" cũng có thể cần đến mô hình hoặc bộ đánh giá (evaluator) thẩm định ngay trong runtime. Vì vậy, quy trình thường xuyên xuất hiện các cạnh quay lui (back edge): sinh nội dung, đánh giá, chỉnh sửa, rồi quay trở lại bước đánh giá.

Workflow mô tả tác vụ được hoàn thành như thế nào, Graph dùng Node, Edge và State để biểu đạt cấu trúc thực thi, còn Loop là cơ chế kiểm soát quay lui trên Graph. Dưới đây, chúng ta sẽ lần theo ví dụ thẩm định bài viết để làm rõ cách cả ba phối hợp với nhau, đồng thời dùng Spring AI Alibaba Graph để minh họa cách cập nhật trạng thái và hiện thực hóa các cạnh điều kiện (conditional edges).

## Tại sao hệ thống AI lại cần Workflow?

Hội thoại đơn vòng (single-turn) có thể trả lời câu hỏi, nhưng rất khó **bàn giao kết quả** một cách ổn định. Các tác vụ thực tế trong môi trường production hiếm khi chỉ đơn giản là "hỏi một câu đáp một câu" là xong việc — truy xuất thông tin, gọi công cụ, xuất kết quả có cấu trúc, kiểm tra định dạng (format validation), retry khi thất bại, không hài lòng thì chạy lại vòng khác, chuỗi các bước đó kết nối lại với nhau mới gọi là bàn giao. Nhồi nhét toàn bộ logic vào một đoạn Prompt siêu dài sớm muộn gì cũng sụp đổ. Thứ bạn cần là một lộ trình thực thi **có thể rẽ nhánh, có thể lặp lại và có thể quan sát được (observable)**.

Các quy trình nghiệp vụ truyền thống thường định nghĩa trước các bước tiềm năng và quy tắc rẽ nhánh, các node vẫn có thể tạo ra kết quả khác nhau do thao tác của con người hoặc API bên ngoài. Khi đưa LLM vào, việc sinh nội dung và đánh giá chất lượng lại tăng thêm một tầng bất định. Điều này dẫn đến 3 vấn đề trực tiếp:

1. Bước tiếp theo không phải là duy nhất, cần đưa ra quyết định đường đi động dựa trên kết quả hiện tại;
2. Khi kết quả chưa đạt yêu cầu, hệ thống cần tự động sửa sai thay vì thất bại và dừng hẳn;
3. Trạng thái trung gian bắt buộc phải được ghi lại, nếu không sẽ rất khó debug, truy vết và phục hồi.

Đó cũng là lý do tại sao hệ thống AI cần đến tư duy workflow.

Lấy một ví dụ đơn giản: khi chúng ta yêu cầu AI viết một bài báo, kết quả của một lần sinh duy nhất thường không đạt kỳ vọng. Cách làm theo trực giác là copy kết quả thủ công, đính kèm yêu cầu mới rồi hỏi tiếp, nhưng cách này vừa kém hiệu quả, vừa làm cạn kiệt ngữ cảnh rất nhanh. Nếu cấu trúc hóa quá trình này thành một vòng lặp "**Thẩm định → Chỉnh sửa → Thẩm định lại**", đồng thời thiết lập điều kiện dừng (như đạt tiêu chuẩn chất lượng hoặc chạm trần số lần lặp), tính ổn định sẽ được cải thiện rõ rệt.

Suy cho cùng, workflow biến quá trình tạo nội dung một lần thành một quy trình có hệ thống, **có thể lặp lại, có thể hội tụ và có thể kiểm soát được**.

## Workflow truyền thống và AI Workflow khác nhau ở điểm nào?

![So sánh giữa Workflow truyền thống và AI Workflow](/media/jg/ext/oss.javaguide.cn/javaguide/ai/workflow/traditional-vs-ai-workflow-06fa947e.svg)

Sơ đồ trên cho thấy trực quan sự khác biệt giữa hai loại workflow: Workflow truyền thống thiên về điều phối quy trình với "các bước cố định + rẽ nhánh rõ ràng"; trong khi đó, AI Workflow phụ thuộc nhiều hơn vào trạng thái runtime (State) để quyết định động bước tiếp theo, đồng thời thông qua vòng lặp (Loop) biến chuỗi "Sinh nội dung — Đánh giá — Sửa đổi" thành một quá trình có khả năng hội tụ.

### Đặc điểm của Workflow truyền thống

Trước tiên hãy nói về định nghĩa cơ bản: **Workflow** là việc chia nhỏ một tác vụ thành nhiều bước nhằm hoàn thành một mục tiêu nhất định, đồng thời quy định cách các bước đó phối hợp tiến triển. Nó trả lời cho câu hỏi: "Việc này được làm xong như thế nào?"

Workflow truyền thống cũng có thể điều phối các tác vụ của con người, API bên ngoài và các hoạt động bất định khác, vì vậy "cùng một đầu vào nhất định phải cho ra cùng một kết quả ở node" không phải là tiền đề bắt buộc của nó. Điểm khác biệt phổ biến hơn là: quy trình truyền thống sẽ định nghĩa trước các hoạt động, các nhánh rẽ dự phòng và quy tắc bù trừ (compensation rules), và trong runtime sẽ căn cứ vào sự kiện cùng dữ liệu nghiệp vụ để chọn đường đi. BPMN 2.0, Camunda, Temporal, Apache Airflow đều không hề bị giới hạn ở trình tự tuyến tính đơn giản.

Điểm khác biệt mấu chốt giữa AI workflow và workflow truyền thống nằm ở chỗ: việc lựa chọn đường đi phụ thuộc vào đánh giá chất lượng của nội dung được sinh ra trong runtime, và cùng một node có thể phải thực thi lặp đi lặp lại do tính không xác định của đầu ra. Ví dụ, trong các kịch bản truyền thống như quy trình phê duyệt, luân chuyển đơn hàng, ETL data pipeline, điều kiện rẽ nhánh rất rõ ràng (số tiền > 10.000 thì chuyển lên cấp phê duyệt cao hơn); còn trong kịch bản AI, bản thân việc phán đoán "kết quả sinh ra có đạt chuẩn hay không" đã cần được đánh giá trong runtime, và kết luận đánh giá đó có thể thúc đẩy quy trình quay trở lại các bước trước đó để sửa đổi lặp đi lặp lại.

### Đặc điểm của AI Workflow

Bước sang kịch bản AI, cùng là một từ "quy trình", nhưng ý nghĩa đã có phần khác biệt. So với tính tuần tự và tính xác định mà workflow truyền thống nhấn mạnh, AI workflow phải đối mặt với một môi trường thực thi đầy tính bất định. Chúng ta không chỉ đối mặt với việc "thực thi theo từng bước", mà còn bao gồm:

- Kết quả có đạt chuẩn hay không phải được đánh giá ngay trong **runtime**.
- Có cần tiếp tục retry hay không phải do **trạng thái hiện tại** quyết định.
- Khi một bước thất bại, hệ thống không chỉ đơn giản là ném ra lỗi rồi kết thúc, mà phải cân nhắc xem có nên giáng cấp (fallback), quay lui hay đổi chiến lược khác.
- Dữ liệu truyền giữa các node không chỉ có tham số, mà còn bao gồm ngữ cảnh, bản thảo, điểm số, thông tin lỗi, lịch sử các vòng đối thoại — tức là **State (trạng thái)**.

Vì vậy, cả AI Workflow và Workflow truyền thống đều có quy trình, điểm khác nhau là AI Workflow nhấn mạnh hơn vào việc ra quyết định động và được dẫn dắt bởi trạng thái (state-driven). Một khi chúng ta muốn biểu đạt "bước tiếp theo không cố định duy nhất" hoặc "chưa hài lòng thì làm lại vòng nữa", danh sách tuyến tính sẽ không còn đủ dùng, và việc hướng tới hai khái niệm Graph (cấu trúc) cùng Loop (quay lui) là điều hoàn toàn tự nhiên.

## Graph và Loop là gì?

### Graph: Cấu trúc của Workflow

Tiếp tục với ví dụ xuyên suốt: giả sử chúng ta muốn dựng một lộ trình "Tạo bản thảo đầu → Thẩm định chất lượng → Không đạt thì sửa → Quay lại bước thẩm định". Ở đây, mỗi bước tương ứng với một **Node** của đồ thị, hướng đi giữa các bước được biểu đạt bằng **Edge**, và ngữ cảnh chia sẻ chung được đọc/ghi xuyên suốt chuỗi chính là **State**.

Trong đồ thị có ba phần tử nền tảng nhất:

- **Node (Nút)**: Đơn vị thực thi, chức năng chính là: đọc trạng thái, thực thi logic, cập nhật trạng thái. Các node tiêu biểu trong ví dụ thẩm định bài viết gồm có "Tạo bản thảo đầu", "Thẩm định chất lượng", "Sửa theo phản hồi", và có thể mở rộng thêm truy xuất tài liệu (retrieval), kiểm tra định dạng, phê duyệt thủ công, v.v.
- **Edge (Cạnh)**: Trừu tượng hóa luồng điều khiển (control flow), quyết định đường dẫn thực thi giữa các node. Các loại cạnh phổ biến:
  - **Sequential Edge (Cạnh tuần tự)**: Các node thực thi theo thứ tự cố định, không phụ thuộc vào phán đoán điều kiện.
  - **Conditional Edge (Cạnh điều kiện)**: Lựa chọn trong số các đường đi ứng viên được định nghĩa trước dựa trên trạng thái runtime; Spring AI Alibaba hiện thực hóa qua `addConditionalEdges()`.
  - **Dynamic Routing (Điều hướng động)**: Các node ứng viên được xác định động ngay trong runtime; ví dụ API `Send` của LangGraph có thể quyết định số lượng lời gọi song song một cách linh hoạt.
  - **Loop Edge (Cạnh vòng lặp)**: Node quay trở lại chính nó hoặc node phía trước để thực thi lặp lại, dùng cho retry và lặp (iteration).
  - **Terminal Edge (Cạnh kết thúc)**: Quy trình kết thúc, không thực thi các node phía sau nữa.
  - **Parallel Edge (Cạnh song song)**: Một node đồng thời phân phối tới nhiều node phía sau để thực thi song song.

> Trong kỹ thuật thực tế, cạnh điều kiện và điều hướng động nằm trên một dải liên tục — tập ứng viên của cạnh điều kiện được xác định tại thời điểm thiết kế nhưng logic lựa chọn có thể phụ thuộc vào trạng thái runtime (như điểm số LLM), trong khi tập ứng viên của điều hướng động chỉ được xác định ngay trong runtime (như API `Send` của LangGraph tạo các nhánh song song động). Trong phần lớn trường hợp, cạnh điều kiện là đủ dùng; điều hướng động phù hợp cho các mô hình map-reduce cần quyết định số lượng nhánh song song tại runtime.

- **State (Trạng thái)**: Biểu thị ngữ cảnh chia sẻ chung liên tục được đọc và ghi trong quá trình thực thi quy trình, là "bộ nhớ làm việc" (working memory) thực sự được truyền giữa các node. Triển khai phổ biến là **cấu trúc dữ liệu key-value** (tương tự `Map<String, Object>` trong Java, `dict` trong Python, hay `Record<string, any>` trong TypeScript), dùng để truyền và biến đổi dữ liệu giữa các node.

Cần lưu ý rằng thiết kế State không chỉ liên quan đến việc "lưu cái gì", mà còn liên quan đến "cập nhật như thế nào". Trong các framework workflow thực tế, các trường khác nhau thường có ngữ nghĩa cập nhật khác nhau:

- **Replace (Ghi đè)**: Giá trị mới thay thế trực tiếp giá trị cũ. Thích hợp cho các trường đơn giá trị, như kết quả phân loại, trạng thái hiện tại. Trong Spring AI Alibaba tương ứng với `ReplaceStrategy`, trong LangGraph tương ứng với hành vi mặc định không có reducer.
- **Append (Nối tiếp)**: Giá trị mới được nối thêm vào danh sách đã có. Thích hợp cho các trường tích lũy, như lịch sử đối thoại (`messages`). Trong Spring AI Alibaba tương ứng với `AppendStrategy`, trong LangGraph tương ứng với `Annotated[list, operator.add]`.
- **Custom Reducer (Hợp nhất tùy chỉnh)**: Quyết định logic hợp nhất thông qua hàm tùy chỉnh, ví dụ `add_messages` của LangGraph sẽ append hoặc update dựa trên message ID.

Khi nhiều node song song cùng ghi vào một trường sử dụng ngữ nghĩa Replace, hiện tượng tranh chấp (race condition) sẽ xảy ra (LangGraph sẽ ném lỗi `INVALID_CONCURRENT_GRAPH_UPDATE`). Do đó, khi thiết kế State cần lên kế hoạch trước xem trường nào có khả năng bị ghi đồng thời, từ đó chọn chiến lược cập nhật phù hợp.

Các trường trạng thái thường dùng trong dự án thực tế (có thể điều chỉnh tùy theo nhu cầu nghiệp vụ):

- `input`: Dữ liệu người dùng nhập, giữ nguyên trong toàn bộ quy trình.
- `messages`: Lịch sử đối thoại, dùng chiến lược Append.
- `retrieval_result`: Kết quả truy xuất RAG, trạng thái trung gian.
- `tool_result`: Kết quả gọi công cụ, trạng thái trung gian.
- `llm_response`: Output thô từ LLM, trạng thái trung gian.
- `intermediate_steps`: Nhật ký ghi lại các bước thực thi trung gian, lưu giữ toàn bộ quy trình.
- `next_step`: Node điều hướng chuyển tiếp (Spring AI Alibaba dùng trường này kết hợp với conditional edge để routing; LangGraph trực tiếp dùng giá trị trả về của hàm conditional edge nên không cần trường này).
- `output`: Kết quả đầu ra cuối cùng.

Nếu chỉ nhìn vào Node và Edge, chúng ta sẽ có một "bản đồ lộ trình chạy được"; bổ sung thêm State, bản đồ này mới có khả năng ra quyết định tại thời điểm thực thi (runtime).

Cấu trúc đồ thị (Graph) phản ánh sát thực tế của hệ thống AI hơn cấu trúc tuyến tính, vì luồng điều khiển của nhiều ứng dụng AI bản chất vốn là đồ thị, chỉ là trước đây thường bị viết tạm bợ thành các khối `if-else`, logic retry hoặc các state machine nằm rải rác ở nhiều module khác nhau.

### Loop: Cơ chế quay lui trên Graph

Vẫn trong kịch bản "thẩm định bài viết": khi **thẩm định không đạt**, luồng điều khiển không nên kết thúc, mà nên đi theo một cạnh nào đó quay trở lại bước "chỉnh sửa" hoặc "sinh lại" — đây chính là ý nghĩa nghiệp vụ của Loop. Về mặt kỹ thuật, nó được biểu hiện bằng **Cạnh quay lui (Back Edge)** trên đồ thị.

> Cần phân biệt rõ Loop trong bài viết này với **Agent Loop** trong các bài viết nền tảng về Agent. Agent Loop là engine chạy ở tầng cao nhất của Agent — toàn bộ Agent nằm trong một vòng lặp while liên tục thực hiện "Suy luận → Hành động → Quan sát" cho đến khi nhiệm vụ hoàn thành. Trong khi đó, Loop trong bài viết này là một mô thức điều khiển (control pattern) nội bộ bên trong Graph — một tập hợp node cụ thể tạo thành vòng lặp chỉnh sửa lặp đi lặp lại thông qua cạnh quay lui. Mối quan hệ giữa cả hai là: Agent Loop là vòng lặp tầng ngoài, còn Graph Loop có thể lồng bên trong một node hoặc một subgraph của nó.

![Tổng quan về Loop: Sơ đồ cơ chế lặp](/media/jg/ext/oss.javaguide.cn/javaguide/ai/workflow/loop-mechanism-11a0f531.svg)

Nhiều người khi mới tiếp xúc với AI workflow thường hiểu `Loop` đơn giản là "chạy thêm vài lần". Hiểu thế không hẳn sai, nhưng chưa đủ chuẩn xác. Chuẩn xác hơn: **Loop là một mô thức điều khiển trên cấu trúc đồ thị**. Khi một cạnh căn cứ vào trạng thái hiện tại đưa luồng điều khiển quay trở về các node trước đó, nó tạo thành một Loop. Đúng như sơ đồ trên minh họa, trọng tâm nằm ở việc phán đoán xem kết quả có đạt chuẩn hay không: bên trong vòng lặp, LLM sẽ căn cứ vào yêu cầu của prompt để "chấm điểm" kết quả, nếu thỏa mãn sẽ xuất ra, nếu không sẽ "trả về viết lại".

Hai loại Loop phổ biến nhất gồm:

1. **Vòng lặp số lần cố định (Fixed-iteration loop)**: Tương tự vòng lặp `for`. Ví dụ "thử lại tối đa 3 lần".
2. **Vòng lặp hướng điều kiện (Condition-driven loop)**: Tương tự vòng lặp `while`. Ví dụ "chừng nào điểm đánh giá còn dưới 80 thì tiếp tục sửa".

Trong các kịch bản AI, vòng lặp hướng điều kiện phổ biến hơn nhiều, vì số lần lặp phụ thuộc vào chất lượng nội dung, kết quả công cụ và phản hồi bên ngoài. Các triển khai production thường kết hợp thêm trần số lần cố định: điều kiện chịu trách nhiệm quyết định có tiếp tục hay không, còn số vòng lặp, timeout và ngân sách Token chịu trách nhiệm ép buộc thoát ra an toàn.

Trong kỹ thuật thực tế, chúng ta cũng thường xuyên gặp phải tình huống **vòng lặp lồng nhau (nested loops)**: vòng lặp ngoài chịu trách nhiệm "lặp chất lượng" (Sinh → Thẩm định → Sửa), còn vòng lặp trong chịu trách nhiệm "retry công cụ" (node nội bộ gọi API bên ngoài thất bại sẽ retry với exponential backoff). Phạm vi (scope), điều kiện dừng và biến đếm của hai vòng lặp này hoàn toàn độc lập — việc vòng lặp trong cạn số lần retry không nên làm hao hụt ngân sách lặp của vòng ngoài, và việc vòng ngoài dừng lại cũng không có nghĩa là vòng trong được phép retry vô hạn. Khi thiết kế vòng lặp lồng nhau, cần xác định rõ điều kiện thoát và ranh giới an toàn độc lập cho từng tầng.

Tóm lại, một Loop đáng tin cậy luôn phải bao gồm ba yếu tố:

- Điều kiện tiếp tục: Tại sao lại cần chạy thêm một vòng nữa.
- Điều kiện thoát: Khi nào thì kết quả đã đủ tốt để kết thúc.
- Ranh giới an toàn: Số vòng tối đa, timeout, ngân sách Token, điều kiện ngắt mạch (circuit breaker).

Nếu thiếu những ràng buộc này, Loop rất dễ biến tướng từ "tự sửa sai" thành "vòng xoáy vô tận".

Quay trở lại ví dụ thẩm định bài viết, Loop không chỉ là "thử thêm vài lần", mà là "kết luận thẩm định dẫn dắt bước nhảy tiếp theo". Chỉ khi điểm số chưa đạt chuẩn và chưa vượt quá số vòng tối đa, quy trình mới từ `ReviewNode` quay trở về `ReviseNode`; một khi đạt ngưỡng điểm hoặc kích hoạt điều kiện biên, nó phải lập tức thoát ra và đưa ra kết quả. Đến đây, vòng lặp đã thực sự trở thành một cơ chế quay lui có thể kiểm soát được.

## Workflow, Graph và Loop có mối quan hệ như thế nào?

![Tổng quan mối quan hệ giữa Workflow, Graph và Loop](/media/jg/ext/oss.javaguide.cn/javaguide/ai/workflow/workflow-graph-loop-relation-f4be2706.svg)

Có thể đúc kết mối quan hệ phân tầng của cả ba bằng một câu: **Workflow là mục tiêu và quy trình, Graph là cấu trúc và vật mang (carrier), Loop là mô thức điều khiển trên đồ thị.**

Tiếp tục với cùng một ví dụ "viết bài và thẩm định":

- Khi ta nói "sinh bản thảo trước, sau đó thẩm định, không đạt thì sửa, cho đến khi đạt chuẩn mới xuất ra", ta đang mô tả **Workflow**.
- Khi ta vẽ `Node sinh bản thảo → Node kiểm tra → Node sửa đổi` thành các node và đường nối, đồng thời để chúng chia sẻ cùng một trạng thái, ta có được **Graph**.
- Khi ta quy định "thẩm định không đạt thì quay lại bước sửa đổi, cho đến khi điểm đạt chuẩn hoặc chạm trần số lần", ta đang định nghĩa **Loop**.

Ba khái niệm này là ba góc nhìn quan sát về cùng một thực thể: Workflow quan tâm đến mục tiêu tác vụ, Graph quan tâm đến tổ chức cấu trúc, còn Loop quan tâm đến kiểm soát quay lui.

## Hiện thực hóa bằng mã nguồn

Sau khi đã xây dựng mô hình khái niệm về Node, Edge, State, tiếp theo hãy xem các khái niệm này ánh xạ vào các framework cụ thể như thế nào. Dưới đây lấy Spring AI Alibaba Graph (hệ sinh thái Java) và LangGraph (hệ sinh thái Python) làm ví dụ.

### Đối chiếu khái niệm giữa các Framework

Mối quan hệ tương ứng của một số khái niệm trọng tâm giữa Spring AI Alibaba và LangGraph:

- **State (Trạng thái)**: Spring AI Alibaba dùng `OverAllState` + `KeyStrategyFactory`; LangGraph dùng `TypedDict` + `Annotated[type, reducer]`.
- **Ngữ nghĩa ghi đè (Replace)**: Spring AI Alibaba là `ReplaceStrategy`, LangGraph mặc định là hành vi này.
- **Ngữ nghĩa nối tiếp (Append)**: Spring AI Alibaba dùng `AppendStrategy`, LangGraph dùng `Annotated[list, operator.add]`.
- **Node**: Spring AI Alibaba là interface `NodeAction`, LangGraph là function thông thường.
- **Sequential Edge**: `addEdge(source, target)` của Spring AI Alibaba tương ứng với `add_edge(source, target)` của LangGraph.
- **Conditional Edge**: `addConditionalEdges(source, fn, map)` của Spring AI Alibaba tương ứng với `add_conditional_edges(source, fn)` của LangGraph.
- **Loop**: Cả hai bên đều dùng conditional edge trỏ ngược lại node trước đó, Spring AI Alibaba còn cung cấp thêm `LoopAgent`.
- **Vòng lặp số lần cố định**: Cả hai bên đều có thể duy trì biến đếm trong State, sau đó conditional edge quyết định tiếp tục hay thoát.
- **Vòng lặp hướng điều kiện**: Cả hai bên đều có thể để conditional edge đọc điểm số, trạng thái lỗi hoặc sự kiện bên ngoài rồi quyết định bước nhảy tiếp theo.
- **Persist (Lưu trữ bền vững)**: Spring AI Alibaba dùng `MemorySaver` / `RedisSaver`..., LangGraph dùng `MemorySaver` / `SqliteSaver`.
- **Phối hợp Người - Máy (Human-in-the-loop)**: Spring AI Alibaba dùng `interruptBefore()` + `updateState()`, LangGraph dùng `interrupt_before` + `update_state`.
- **Biên dịch và thực thi**: Spring AI Alibaba cần `StateGraph.compile(CompileConfig)`, LangGraph gọi trực tiếp `StateGraph.compile()`.

### Ví dụ triển khai: Xây dựng Workflow thẩm định bài viết với Spring AI Alibaba

Dưới đây sử dụng Spring AI Alibaba Graph để triển khai workflow "Sinh bản thảo → Thẩm định → Sửa đổi" xuyên suốt bài viết. Ví dụ lược bỏ các phần import, cấu hình dependency injection và cấu hình nhà cung cấp mô hình, giữ trọn vẹn các node, chiến lược trạng thái và việc lắp ráp đồ thị.

**Bước 1: Định nghĩa trạng thái và chiến lược cập nhật**

```java
// Cấu hình chiến lược khóa trạng thái: kiểm soát cách cập nhật từng trường
public static KeyStrategyFactory createKeyStrategyFactory() {
    return () -> {
        HashMap<String, KeyStrategy> strategies = new HashMap<>();
        strategies.put("input", new ReplaceStrategy());          // Đầu vào của người dùng
        strategies.put("messages", new AppendStrategy());        // Lịch sử đối thoại (nối tiếp/append)
        strategies.put("current_draft", new ReplaceStrategy());  // Bản thảo hiện tại (ghi đè/replace)
        strategies.put("review_score", new ReplaceStrategy());   // Điểm đánh giá (ghi đè/replace)
        strategies.put("review_feedback", new ReplaceStrategy()); // Phản hồi đánh giá
        strategies.put("iteration_count", new ReplaceStrategy()); // Số lần lặp
        strategies.put("output", new ReplaceStrategy());         // Đầu ra cuối cùng
        strategies.put("next_node", new ReplaceStrategy());      // Kiểm soát điều hướng
        return strategies;
    };
}
```

Lưu ý rằng `messages` sử dụng `AppendStrategy` (lịch sử đối thoại liên tục được nối thêm), trong khi `current_draft` sử dụng `ReplaceStrategy` (mỗi lần sửa đổi sẽ ghi đè lên phiên bản cũ).

**Bước 2: Hiện thực hóa các Node**

```java
// Node tạo bản thảo đầu
public static class DraftNode implements NodeAction {
    private final ChatClient chatClient;

    public DraftNode(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    @Override
    public Map<String, Object> apply(OverAllState state) throws Exception {
        String input = state.value("input").map(v -> (String) v).orElse("");

        String draft = chatClient.prompt()
            .user(String.format("Xin hãy viết bài dựa theo yêu cầu sau: %s", input))
            .call().content();

        return Map.of(
            "current_draft", draft,
            "next_node", "review"
        );
    }
}

// Node thẩm định chất lượng
public static class ReviewNode implements NodeAction {
    private final ChatClient chatClient;

    public ReviewNode(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    private record ReviewResult(double score, String feedback) {}

    @Override
    public Map<String, Object> apply(OverAllState state) throws Exception {
        String draft = state.value("current_draft").map(v -> (String) v).orElse("");
        int count = state.value("iteration_count").map(v -> (Integer) v).orElse(0);

        String prompt = String.format(
            "Xin hãy đánh giá chất lượng bài viết sau, đưa ra điểm số từ 0-100 và góp ý cải thiện.\n" +
            "Trả về định dạng JSON: {\"score\": 85, \"feedback\": \"...\"}\n\n%s", draft);

        ReviewResult result = chatClient.prompt()
            .user(prompt)
            .call()
            .entity(ReviewResult.class);

        int nextCount = count + 1;
        String nextNode =
            (result.score() >= 80 || nextCount >= 3) ? "exit" : "revise";
        return Map.of(
            "review_score", result.score(),
            "review_feedback", result.feedback(),
            "iteration_count", nextCount,
            "next_node", nextNode
        );
    }
}

// Node chỉnh sửa: sửa nội dung dựa trên phản hồi đánh giá
public static class ReviseNode implements NodeAction {
    private final ChatClient chatClient;

    public ReviseNode(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    @Override
    public Map<String, Object> apply(OverAllState state) throws Exception {
        String draft = state.value("current_draft").map(v -> (String) v).orElse("");
        String feedback = state.value("review_feedback").map(v -> (String) v).orElse("");

        String revised = chatClient.prompt()
            .user(String.format("Xin hãy sửa bài viết theo ý kiến phản hồi.\n\nBản gốc: %s\n\nÝ kiến phản hồi: %s", draft, feedback))
            .call().content();

        return Map.of(
            "current_draft", revised,
            "next_node", "review"
        );
    }
}

// Node đầu ra
public static class ExitNode implements NodeAction {
    @Override
    public Map<String, Object> apply(OverAllState state) throws Exception {
        String draft = state.value("current_draft").map(v -> (String) v).orElse("");
        return Map.of("output", draft);
    }
}
```

**Bước 3: Lắp ráp Graph**

```java
public static CompiledGraph buildWorkflow(ChatModel chatModel) throws GraphStateException {
    ChatClient.Builder builder = ChatClient.builder(chatModel);

    var draft = node_async(new DraftNode(builder));
    var review = node_async(new ReviewNode(builder));
    var revise = node_async(new ReviseNode(builder));
    var exit = node_async(new ExitNode());

    StateGraph workflow = new StateGraph(createKeyStrategyFactory())
        .addNode("draft", draft)
        .addNode("review", review)
        .addNode("revise", revise)
        .addNode("exit", exit);

    // Cạnh tuần tự
    workflow.addEdge(START, "draft");

    // Cạnh điều kiện: điều hướng dựa trên trường next_node
    workflow.addConditionalEdges("draft",
        edge_async(state ->
            (String) state.value("next_node").orElse("review")),
        Map.of("review", "review"));

    workflow.addConditionalEdges("review",
        edge_async(state ->
            (String) state.value("next_node").orElse("exit")),
        Map.of(
            "revise", "revise",   // Thẩm định không đạt -> chỉnh sửa
            "exit", "exit"        // Thẩm định đạt hoặc chạm giới hạn -> xuất kết quả
        ));

    // Sau khi sửa quay lại node thẩm định, tạo thành vòng lặp
    workflow.addConditionalEdges("revise",
        edge_async(state ->
            (String) state.value("next_node").orElse("review")),
        Map.of("review", "review"));

    workflow.addEdge("exit", END);

    // MemorySaver chỉ lưu checkpoint trong phạm vi tiến trình hiện tại
    var saver = new MemorySaver();
    var compileConfig = CompileConfig.builder()
        .saverConfig(SaverConfig.builder().register(saver).build())
        .build();

    return workflow.compile(compileConfig);
}
```

Mỗi Node chỉ đảm nhận một trách nhiệm duy nhất, cạnh điều kiện điều hướng dựa theo `next_node`, `iteration_count` và `review_score` được lưu giữ trong State. Chuỗi `review → revise → review` tạo thành một cạnh quay lui, sau lần thẩm định thứ 3 dù điểm có đạt hay không cũng sẽ thoát ra, tránh rơi vào vòng lặp vô tận.

Trong ví dụ này, `MemorySaver` chỉ lưu trữ checkpoint trong tiến trình hiện tại và trong cùng một instance Saver. Khi phục hồi còn cần định danh thread hoặc session ổn định để định vị bản ghi. Khi cần khôi phục sau khi tiến trình restart, nên đổi sang Redis hoặc Database Saver, đồng thời kiểm tra kỹ hành vi serialization, hết hạn và cập nhật đồng thời của checkpoint.

> Để xem ví dụ hoàn chỉnh hơn (bao gồm phối hợp người - máy, lưu trữ bền vững, streaming output), vui lòng tham khảo [Tài liệu chính thức Spring AI Alibaba Graph](https://java2ai.com/docs/frameworks/graph-core/quick-start/).

## Năng lực trừu tượng hóa của Workflow

![So sánh giữa workflow trừu tượng hóa cao và thấp](/media/jg/ext/oss.javaguide.cn/javaguide/ai/workflow/abstraction-comparison-c5869249.svg)

Từ sơ đồ trên có thể thấy workflow có độ trừu tượng hóa cao đã gom bốn node phán đoán thành một node phán đoán duy nhất: đánh giá xem có đạt chuẩn hay không. Nếu sử dụng độ trừu tượng thấp, khi chúng ta cần bớt hoặc thêm node phán đoán mới, ta sẽ tốn rất nhiều thời gian đọc mã nguồn để tìm node tương ứng. Một workflow tốt mấu chốt nằm ở chỗ sự trừu tượng hóa của Node, Edge, State có chịu được sự tái sử dụng và mở rộng hay không, chứ không phụ thuộc vào việc có bao nhiêu bước.

Nhiều người mới bắt đầu thiết kế workflow rất dễ viết từng bước thành một hành động cụ thể, ví dụ: gọi mô hình sinh bài viết; kiểm tra độ dài tiêu đề; kiểm tra văn phong có phù hợp không; phán đoán xem có cần bổ sung tài liệu không; lại gọi mô hình sửa đổi. Làm vậy trong ngắn hạn thì chạy được, nhưng quy trình sẽ ngày càng vụn vặt và khả năng tái sử dụng rất kém. Cách làm chín chắn hơn là trừu tượng hóa quy trình lên tầng cấu trúc ổn định:

1. **Node trừu tượng hóa ranh giới trách nhiệm**: Kết quả sản sinh ra ở node này cần trông như thế nào, bắt buộc phải xuất hiện những thông tin gì. Tránh trừu tượng hóa theo kiểu "lần này gọi API nào".
2. **Edge trừu tượng hóa quy tắc luân chuyển**: Ở trạng thái nào thì được phép đi đâu, khi nào kết thúc. Dùng cạnh điều kiện để biểu đạt rẽ nhánh và vòng lặp, thay vì viết đầy lệnh `if-else` bên ngoài đồ thị.
3. **State trừu tượng hóa thông tin bắt buộc phải ghi nhớ lâu dài khi thúc đẩy tác vụ**: Snapshot ticket, kết luận thẩm định, số lần retry, mã lỗi..., giúp các quyết định đường đi luôn có căn cứ xác thực.

Ví dụ trong kịch bản "sinh và thẩm định bài viết", thay vì thiết kế hàng chục node rời rạc để kiểm tra tiêu đề bài viết có hợp chủ đề không, số từ có đạt yêu cầu không, chi bằng hãy trừu tượng hóa ra vài trách nhiệm cốt lõi ổn định:

- `DraftNode`: Chịu trách nhiệm tạo ra nội dung phiên bản hiện tại.
- `ReviewNode`: Chịu trách nhiệm đánh giá kết quả hiện tại có đạt chuẩn không.
- `ReviseNode`: Chịu trách nhiệm sửa đổi nội dung dựa trên phản hồi.
- `ExitNode`: Chịu trách nhiệm xuất ra kết quả cuối cùng khi thỏa mãn điều kiện.

![Các phần tử cốt lõi của Graph: Node, Edge, State](/media/jg/ext/oss.javaguide.cn/javaguide/ai/workflow/graph-core-elements-e49dab77.svg)

## Những cạm bẫy thường gặp khi triển khai Workflow vào thực tế

Khi thực sự đưa workflow vào ứng dụng thực tế, vấn đề thường không nằm ở chỗ "không biết vẽ đồ thị", mà nằm ở việc các chi tiết chưa được thiết kế kỹ lưỡng từ trước. Dưới đây là những cạm bẫy phổ biến nhất trong thực tế.

### Độ mịn trong thiết kế State (Granularity)

- Quá thô: Nhồi nhét mọi thứ vào một object khổng lồ, ai sửa trường nào cũng rất khó tra cứu.
- Quá mịn: Chia tách các trường quá vụn vặt, node nào cũng phải ghép qua ghép lại, rất dễ phát sinh lỗi.
- Khuyến nghị: Phân chia theo ý nghĩa nghiệp vụ, ví dụ: «Một khối dành cho đầu vào gốc của người dùng», «Một khối dành cho kết quả sinh ra hiện tại», «Một khối dành cho kết luận thẩm định/chấm điểm», «Một khối phục vụ điều khiển quy trình (như bước hiện tại, số lần retry)».

### Điều kiện dừng của vòng lặp

Đừng chỉ viết mơ hồ "nếu chưa hài lòng thì tiếp tục tối ưu hóa", mà phải xác định rõ ràng:

- Số vòng lặp tối đa là bao nhiêu?
- Ngưỡng điểm đạt chuẩn là bao nhiêu?
- Khi timeout hoặc chi phí vượt ngân sách thì xử lý ra sao?
- Sau nhiều lần thất bại liên tiếp có cần fallback không.

### Xử lý lỗi và Giáng cấp (Error Handling & Fallback)

AI workflow không chỉ xử lý mỗi "happy path". Ngoại lệ công cụ, model timeout, lỗi định dạng dữ liệu, API bên ngoài bị rate limit, tất cả đều phải có **cạnh rõ ràng** trên đồ thị: retry, giáng cấp (ví dụ bỏ qua một công cụ nào đó), chuyển cho con người xử lý, hoặc xuất ra kết quả "kết quả tốt nhất hiện tại + giải thích lỗi", chứ không phải chỉ trông cậy vào việc dùng khối `try-catch` bên ngoài nuốt chửng ngoại lệ.

Spring AI Alibaba phân loại lỗi thành bốn nhóm, tương ứng với các chiến lược xử lý khác nhau:

- **Lỗi tức thời (Transient errors)** (timeout mạng, rate limit API): Dùng retry với exponential backoff, đặt số lần tối đa.
- **Lỗi LLM có thể tự phục hồi (LLM-recoverable errors)** (gọi công cụ thất bại, định dạng output bất thường): Nhét lỗi vào State, lặp ngược trở lại để LLM nhìn vào đó tự điều chỉnh.
- **Lỗi người dùng có thể sửa (User-recoverable errors)** (thiếu thông tin cần thiết, chỉ thị không rõ ràng): Gọi `interruptBefore` để tạm dừng, chờ con người nhập liệu bổ sung.
- **Lỗi bất ngờ (Unexpected errors)** (ngoại lệ chưa biết): Để exception nổi lên trên (bubble up), bàn giao cho developer debug.

Các chiến lược này rất gần gũi với các mẫu hình độ bền bỉ (resilience patterns) trong hệ thống phân tán:

- **Retry với Exponential Backoff**: Khi gọi công cụ bị timeout, tăng dần khoảng thời gian chờ (1s, 2s, 4s) kèm giới hạn tổng thời gian; nếu lỗi do xác thực (authentication) thất bại thì bắt buộc phải dừng nhánh đó, xác thực lại hoặc chuyển cho con người, tuyệt đối không được bỏ qua khâu xác thực mà chạy tiếp.
- **Circuit Breaker (Ngắt mạch)**: Nếu kiểm tra định dạng output của LLM liên tục thất bại N lần thì ngắt mạch ngay, giáng cấp về output dạng template hoặc đổi sang mô hình đơn giản hơn, tránh lãng phí Token vô ích.
- **Bulkhead (Vách ngăn cách ly)**: Đặt giới hạn concurrency độc lập cho các API bên ngoài khác nhau, tránh trường hợp một service phản hồi chậm làm nghẽn toàn bộ thread pool.
- **Saga (Giao dịch bù trừ)**: Khi thao tác nhiều bước bị gãy ở một bước giữa chừng, thực thi các thao tác rollback theo thứ tự ngược lại đối với các bước đã hoàn thành.

> Các mẫu hình này cần được tự triển khai bên trong node hoặc ở tầng middleware, bản thân framework Graph chỉ cung cấp khung sườn thực thi và quản lý trạng thái. Cụ thể: logic retry và circuit breaker được đóng gói trong node, lưu trạng thái thông qua các trường trong State (như `retry_count`, `circuit_state`); bulkhead dùng `Semaphore` của Java hoặc Resilience4j; saga đòi hỏi phải lưu thông tin rollback của các bước đã hoàn thành vào State, sau đó thiết kế các compensation node chuyên biệt.

### Kiểm soát Token và Chi phí

Loop hiển nhiên sẽ khuếch đại mức tiêu thụ Token và độ trễ. Khi thiết kế cần tính toán trước:

- Những node nào bắt buộc phải gọi mô hình lớn, những node nào có thể thay thế bằng code logic thông thường.
- Có thể lọc thô trước rồi mới tinh chỉnh sau hay không.
- Có cần dừng sớm khi đã đạt mức "đủ tốt" thay vì cố chấp theo đuổi "tối ưu tuyệt đối trên lý thuyết".

### Truyền dữ liệu giữa các Node

Giữa các node truyền những gì, tên trường định nghĩa ra sao, dữ liệu đầu ra có cấu trúc áp dụng schema nào, đều cần được thống nhất từ sớm (ví dụ thống nhất dùng JSON Schema hoặc Pydantic model). Nếu không, khi đồ thị trở nên phức tạp, chi phí debug sẽ tăng vọt.

## Kiểm tra State và Loop trước khi đưa lên Production

Output từ LLM trong workflow vẫn luôn là dữ liệu không đáng tin cậy. Trước khi đưa vào cơ sở dữ liệu, template frontend, lệnh Shell hay các công cụ downstream, bắt buộc phải thực hiện validation và encoding phù hợp; mỗi node chỉ được cấp quyền hạn công cụ vừa đủ cho tác vụ hiện tại, các thao tác rủi ro cao như xóa, gửi đi, thanh toán phải được kiểm soát qua các node phê duyệt của con người.

Đối với Graph, cần đặc biệt kiểm tra thêm hai vấn đề:

- **Ô nhiễm State (State Pollution)**: Đầu vào độc hại sau khi qua xử lý ở node bị ghi đè vào các trường kiểm soát điều hướng của State (như `next_node`), có thể làm sai lệch routing của conditional edge, bỏ qua node thẩm định để đi thẳng ra output. Phòng vệ: Áp dụng kiểm tra whitelist nghiêm ngặt đối với các trường kiểm soát điều hướng trong State.
- **Tấn công khuếch đại Loop (Loop Amplification Attack)**: Đầu vào hiểm độc được thiết kế khiến `ReviewNode` luôn trả về điểm thấp, dẫn đến việc Loop phải chạy cho tới khi chạm trần số vòng tối đa mới chịu thoát ra, tiêu tốn lượng Token khổng lồ. Phòng vệ: Bên cạnh giới hạn `iteration_count`, bổ sung thêm ngân sách tiêu hao Token như một ranh giới an toàn độc lập.

Cuối cùng, dùng replay testing để bao quát các trường hợp: thoát bình thường, chạm trần số vòng lặp, công cụ timeout, con người can thiệp tạm dừng, xác thực thất bại và khôi phục từ checkpoint. API của framework có thể thay đổi, nhưng trách nhiệm của Node, sự luân chuyển hợp lệ của Edge và quy tắc cập nhật của State cần được cố định vững chắc qua các bài test.

## Điểm mấu chốt khi chuẩn bị phỏng vấn

**Câu hỏi tần suất cao**:

1. **Tại sao hệ thống AI cần Workflow?** → Output của LLM có tính bất định, đòi hỏi việc ra quyết định động, tự động sửa sai và khả năng hội tụ có kiểm soát.
2. **Workflow, Graph, Loop có mối quan hệ như thế nào?** → Workflow là mục tiêu và quy trình, Graph là cấu trúc và vật mang, Loop là mô thức điều khiển trên đồ thị.
3. **Graph Loop và Agent Loop khác nhau ở điểm nào?** → Agent Loop là runtime engine ở tầng cao nhất của Agent (vòng lặp Suy luận → Hành động → Quan sát), còn Graph Loop là mô thức kiểm soát quay lui bên trong Graph (tập hợp node cụ thể lặp lại sửa lỗi qua cạnh quay lui), cả hai có thể lồng vào nhau.
4. **Làm thế nào để Loop không bị lặp vô tận?** → Bộ ba yếu tố: điều kiện tiếp tục, điều kiện thoát, ranh giới an toàn (số vòng tối đa + timeout + ngân sách Token).
5. **Chọn chiến lược cập nhật State như thế nào?** → Trường đơn giá trị dùng Replace, trường tích lũy danh sách dùng Append, trường bị ghi đồng thời bắt buộc phải dùng Reducer.
6. **Sự khác biệt giữa Conditional Edge và Dynamic Routing?** → Tập ứng viên của Conditional Edge được xác định khi thiết kế và lựa chọn tại runtime; tập ứng viên của Dynamic Routing chỉ được xác định tại runtime; trên thực tế chúng là một dải liên tục.
7. **Hiểu về thiết kế trừu tượng của Graph như thế nào?** → Node trừu tượng hóa ranh giới trách nhiệm (tạo ra cái gì), Edge trừu tượng hóa quy tắc luân chuyển (khi nào đi đâu), State trừu tượng hóa thông tin bắt buộc phải ghi nhớ lâu dài để thúc đẩy tác vụ.

**Câu hỏi hỏi sâu thêm (Follow-up)**:

- Workflow bị gián đoạn thì khôi phục thế nào? (Cơ chế Persistence + Checkpoint)
- Lỗi bên trong Node xử lý ra sao? (Lỗi tức thời thì retry, lỗi LLM tự sửa được thì lặp ngược lại, lỗi người dùng sửa được thì chuyển con người, lỗi bất ngờ thì cho exception nổi lên)
- Cách triển khai vòng lặp của Spring AI Alibaba và LangGraph có gì khác nhau? (Bên trước có thể dùng conditional edge trỏ ngược lại hoặc dùng LoopAgent, bên sau cần tự duy trì biến đếm)
- Workflow có những rủi ro bảo mật đặc thù nào? (Ô nhiễm State làm sai lệch điều hướng, tấn công khuếch đại Loop gây cạn kiệt Token)

## Tổng kết

Workflow mô tả quá trình hoàn thành tác vụ, Graph dùng Node, Edge và State để tổ chức quá trình thành cấu trúc có thể thực thi, còn Loop giúp các node cụ thể căn cứ vào điều kiện quay ngược lại các bước phía trước để tiếp tục sửa đổi. Chúng mang lại luồng trạng thái và phương thức xử lý sự cố rõ ràng hơn nhiều so với việc dùng một Prompt dài duy nhất cho các tác vụ sinh nội dung, thẩm định và gọi công cụ cùng LLM.

Khi đưa vào thực tế, trước tiên hãy định nghĩa rõ trách nhiệm và quy tắc cập nhật của State, sau đó viết rành mạch các conditional edge, điều kiện thoát, số vòng tối đa, timeout và ngân sách Token. Mọi dữ liệu đi vào logic điều hướng, cơ sở dữ liệu, template hay công cụ bên ngoài đều phải được kiểm tra xác thực; việc retry, giáng cấp, con người can thiệp và phục hồi từ checkpoint cũng cần được đưa vào độ phủ kiểm thử, tránh để vòng lặp liên tục khuếch đại chi phí trên những dữ liệu đầu vào sai lệch hoặc các phụ thuộc gặp sự cố.
