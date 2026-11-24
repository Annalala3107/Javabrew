---
title: "Thực chiến MiniMax M3 + Claude Code: Xử lý Sự cố Redis, Tái hiện Thuật toán SCAN và Dựng Dashboard Giám sát"
description: "Kết nối MiniMax M3 thông qua Claude Code để hoàn thành ba ca thực chiến: định vị và giáng cấp (degradation) sự cố Redis SCAN online, tái hiện thuật toán con trỏ SCAN đa ngôn ngữ từ C sang Go, và xây dựng dashboard giám sát Redis full-stack."
category: Thực chiến AI Coding
head:
  - - meta
    - name: keywords
      content: MiniMax M3,Claude Code,AI Coding,Redis SCAN,Xử lý sự cố,Dashboard giám sát,Tái hiện đa ngôn ngữ,Agent Coding,cc-switch
lang: vi
sourceRef: zh-ref/ai-coding/cases/cc-m3.md
---

Xin chào, mình là Tiểu G. MiniMax M3 mới ra mắt cách đây vài ngày, khá nhiều bạn bè đã trải nghiệm ngay và phản hồi tương đối tích cực, cũng có không ít độc giả nhắn tin giục mình làm một bài test thực tế.

Không phải mình không muốn test, mà mấy hôm trước quả thực quá bận rộn vì muốn tranh thủ tối ưu hóa JavaGuide trước mùa tuyển dụng mùa thu—đây là công việc thường niên năm nào mình cũng làm.

![Độc giả nhắn tin mong muốn test thực tế MiniMax M3](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/image-20260604122811898-7f0a9215.png)

Theo giới thiệu chính thức từ MiniMax, M3 là mô hình mã nguồn mở đầu tiên của họ đồng thời cung cấp context 1M, năng lực đa phương thức (multimodal) gốc và khả năng Coding hàng đầu (frontier). Đó là định vị sản phẩm của nhà cung cấp, còn việc có phù hợp với codebase thực tế hay không vẫn phải kiểm chứng qua các tác vụ kỹ thuật cụ thể.

Các kết quả benchmark do phía phát triển công bố gồm: SWE-Bench Pro 59.0%, Terminal-Bench 2.1 66.0%, MCP Atlas 74.2%. Những con số này tương ứng với tập kiểm thử và cấu hình đánh giá quy định, không phải kết quả kiểm nghiệm độc lập trong bài viết này.

![Giới thiệu năng lực chính thức của MiniMax M3: Coding Frontier/SOTA + 1M Context + Đa phương thức gốc](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/HJsWydIbIAAFAZL-ecccc1b8.jpg)

Điều mình quan tâm hơn là biểu hiện của nó khi đi vào bài toán kỹ thuật thực tế.

Do đó, mình sử dụng một sự cố online từng gặp trong quá khứ để kiểm tra. Hiện tượng ghi nhận là vào giờ cao điểm kinh doanh, các request phía client bị ảnh hưởng nghiêm trọng; manh mối điều tra hướng về một vòng lặp `SCAN` Redis đầy đủ trong một background task bất đồng bộ; việc liệu nó có phải nguyên nhân chính do chiếm dụng kết nối trong thời gian dài hay không cần phải kết hợp với số liệu giám sát và tái hiện kiểm chứng.

Ca thực chiến này đòi hỏi khả năng suy luận chuỗi nghiệp vụ phức tạp và chẩn đoán toàn cục. Đồng thời, sau khi hoàn thành việc định vị sự cố và cầm máu, mình tiếp tục dùng M3 để thử nghiệm tái hiện tính năng từ mã nguồn Redis (C) sang Go, cũng như dựng một dashboard giám sát Redis full-stack từ frontend tới backend, nhằm quan sát năng lực của M3 trên hai chiều: tái cấu trúc khác ngôn ngữ và bàn giao sản phẩm toàn diện.

Bài viết được triển khai theo 3 nhiệm vụ:

1. Xử lý sự cố
2. Tái hiện thuật toán tầng lõi
3. Triển khai hệ thống giám sát

## Chuẩn bị

Tiểu G hàng ngày dùng Claude Code để phát triển và quản lý các model thống nhất qua công cụ cc-switch. Dưới đây là các bước cấu hình cho MiniMax M3. Đầu tiên, mở cc-switch và bấm vào dấu cộng để thêm cấu hình model:

![cc-switch bấm dấu cộng để thêm cấu hình model](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/cc-switch-add-model-16878ea3.png)

Chọn MiniMax M3, điền key của bạn vào mục api key:

![Chọn MiniMax M3 và điền API Key](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/cc-switch-select-minimax-m3-37582ee9.png)

Cuối cùng bấm lấy danh sách model để hoàn thành cấu hình, như trường hợp của mình là đặt thẳng model chính thành MiniMax M3:

![Lấy danh sách model và đặt model chính là MiniMax M3](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/cc-switch-set-main-model-5ebb3a22.png)

Sau khi cấu hình xong, mở Claude Code và kiểm tra tại khung đối thoại xem model hiện tại đã có hiệu lực chưa:

![Kiểm tra model MiniMax M3 đã có hiệu lực trong Claude Code](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/claude-code-verify-model-98f2098f.png)

## Xử lý Sự cố: Kiểm chứng Vấn đề Hiệu năng Xoay quanh Vòng lặp SCAN Tầng Ứng dụng

Ca thực chiến đầu tiên tái hiện một sự cố online mình từng trải qua. Để tiện theo dõi, chúng ta đặt vào một kịch bản thương mại điện tử kinh điển: trong đợt khuyến mãi lớn, task bất đồng bộ "tự động hủy đơn hàng quá hạn" đang chạy, đồng thời lượng lớn người dùng đang duyệt xem hàng hóa. Tại một thời điểm, hàng loạt trang bị timeout—số lượng đã bán, tồn kho, lượt xem, yêu thích, toàn bộ dữ liệu hotspot đều không tải ra được:

![Trang web bị timeout diện rộng trong đợt sale lớn, dữ liệu hotspot không tải được](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/ecommerce-page-timeout-dc1e8ab2.png)

Để đánh giá khả năng điều tra chuỗi nghiệp vụ phức tạp của MiniMax M3, mình gửi ảnh chụp màn hình hiện tượng hệ thống (trong Claude Code có thể dán ảnh bằng Ctrl+V, trên Windows là Alt+V) kèm theo mô tả lỗi:

![Gửi ảnh chụp hiện tượng sự cố và mô tả lỗi cho M3](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/submit-error-to-m3-57a8c68e.png)

Sau một lát phân tích, MiniMax M3 đã định vị vấn đề nằm ở vòng lặp `SCAN` hoàn chỉnh trong tác vụ chạy ngầm. Ban đầu nó tóm tắt nguyên nhân là "SCAN dẫn đến tắc nghẽn server Redis", cách nói này chưa thực sự chuẩn xác: bản thân mỗi lần gọi `SCAN` là một phép lặp tiệm tiến (incremental iterator), mục đích thiết kế của nó chính là để tránh việc làm nghẽn kéo dài như lệnh `KEYS`; điều thực sự cần kiểm tra là số vòng lặp, tham số `COUNT`, kích thước Keyspace, độ trễ từng lần gọi và liệu ứng dụng có đang chiếm giữ tài nguyên connection pool quá lâu hay không.

![M3 định vị nguyên nhân gốc rễ: Thao tác SCAN làm tắc nghẽn Redis, gây ứ đọng đọc ghi](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/m3-root-cause-scan-blocking-58604783.png)

Để đối chiếu sâu hơn chuỗi nghiệp vụ, mình yêu cầu MiniMax M3 vẽ lại quá trình diễn ra sự cố bằng sơ đồ ASCII. Sơ đồ mô tả từ việc task đơn hàng quá hạn bước vào vòng lặp `SCAN`, dẫn tới số lượng kết nối khả dụng trong pool sụt giảm và các request trang web phải xếp hàng chờ đợi. Ở đây cần hiểu "quét duyệt Keyspace làm nghẽn thread chính" là một giả thuyết cần kiểm chứng, chứ không phải hành vi cố định của `SCAN`:

![Sơ đồ ASCII chuỗi lưu chuyển sự cố do M3 vẽ: quan hệ nhân quả end-to-end từ SCAN đến timeout](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/fault-chain-ascii-diagram-b8b33cd5.png)

M3 sau đó đưa ra 4 nhóm đề xuất xử lý gồm: điều chỉnh cấu trúc dữ liệu, thao tác nguyên tử (atomic), giáng cấp dịch vụ (degradation) và giám sát:

![M3 đưa ra đề xuất sửa đổi đồng thời trên 4 khía cạnh: cấu trúc dữ liệu, tính nguyên tử, giáng cấp và giám sát](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/m3-four-dimension-fix-8179fd46.png)

Đối với các endpoint nghiệp vụ bị ảnh hưởng, M3 đã tối ưu hóa các lệnh Redis tuần tự thành một thao tác nguyên tử duy nhất, kèm theo chiến lược giáng cấp để kiểm soát phạm vi ảnh hưởng trong trường hợp cực đoan:

![Tối ưu hóa các lệnh Redis tuần tự thành một thao tác nguyên tử kèm chiến lược giáng cấp](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/atomic-operation-optimization-cfc26629.png)

Về mặt vận hành, M3 cũng đề xuất các chỉ số cần đo đạc giám sát và lấy 200 ms làm ngưỡng cảnh báo ví dụ. Con số này không thể giải thích đơn thuần bằng "cảm nhận độ trễ của con người"; ngưỡng cảnh báo cho background task của Redis phải căn cứ theo SLO của endpoint, dung lượng connection pool, tần suất chạy task và độ trễ phân vị trong lịch sử:

![Đề xuất cắm mốc giám sát và ngưỡng cảnh báo: ranh giới đỏ cho thao tác SCAN đặt ở 200ms](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/monitoring-alert-thresholds-d1410dd8.png)

Dưới đây là diff code sửa đổi:

![Diff code sửa đổi, M3 thể hiện triết lý thiết kế giáng cấp và giám sát trong triển khai](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/fix-code-diff-7596eb93.png)

Đoạn code giáng cấp cốt lõi như sau. M3 sử dụng các lớp atomic để xử lý một phần trạng thái đồng thời, nhưng điều này chỉ đảm bảo tính nguyên tử cho biến đó hoặc thao tác đơn lẻ đó, chứ không thể chứng minh toàn bộ chuỗi mắt xích gồm Redis, local cache và truy vấn fallback về database là hoàn toàn thread-safe hay nhất quán tuyệt đối. Các vấn đề như thủng cache (cache breakdown), dồn dập truy vấn về DB (cache stampede) hay ghi đè giá trị cũ vẫn cần được kiểm chứng qua giao thức đồng bộ, rate limiting và test đồng thời:

![Code giáng cấp cốt lõi: dùng các class atomic đảm bảo thread-safe cho thao tác đa tầng cache](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/degradation-code-atomic-d2a5cf4c.png)

M3 cũng đồng thời tạo ra các bài test bao quát các trường hợp giáng cấp bình thường, fallback khi có ngoại lệ và race condition đồng thời. Ảnh chụp màn hình cho thấy các test case biên dịch thành công và pass toàn bộ; chỉ số "100% logic coverage" chỉ phản ánh độ bao phủ trên đoạn code được thống kê, không chứng minh mọi kịch bản lỗi ngoài đời thực đều đã được kiểm tra:

![Test case do M3 tạo kèm: bao quát giáng cấp, fallback ngoại lệ và race condition, compile và test pass 100%](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/test-cases-all-pass-616356a7.png)

## Đi sâu vào Tầng Thấp: Tái hiện Thuật toán Con trỏ Redis SCAN, Hiểu rõ Đảo ngược Nhị phân rev

Gần đây, Giám đốc Kỹ thuật của Google là Addy Osmani trong bài viết "Don't Outsource the Learning" đã nêu lên một hiện tượng rất đáng suy ngẫm: để AI viết code mà bản thân bỏ qua việc học hỏi là quá dễ dàng—lỗi thì được sửa, nhưng mental model của bạn thì không hề tiến bộ. Ông trích dẫn một thí nghiệm ngẫu nhiên của Anthropic: cùng học một thư viện mới, nhóm dùng AI hỗ trợ hoàn thành tác vụ với tốc độ tương đương nhóm làm thủ công, nhưng trong bài test hiểu biết sau đó chỉ đạt 50% điểm, thấp hơn nhiều so với 67% của nhóm làm thủ công. Thú vị là ngay trong nội bộ nhóm dùng AI cũng có sự phân hóa: những kỹ sư dùng AI để hỏi sâu về khái niệm đạt trên 65%, trong khi những người chỉ copy-paste code đạt dưới 40%. Kết luận của Osmani là: công cụ không học thay bạn, sự khác biệt nằm ở cách bạn sử dụng nó:

![Quan điểm cốt lõi trong bài Don't Outsource the Learning của Addy Osmani: Công cụ không học thay bạn, khác biệt ở cách bạn dùng](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/addy-osmani-dont-outsource-learning-7e946f63.png)

Quay trở lại sự cố lần này. Định vị lỗi và giáng cấp cầm máu là bước đầu tiên, nhưng để thực sự hiểu `SCAN` duyệt qua dict như thế nào, ý nghĩa thực sự của `COUNT` là gì, và phép đảo ngược nhị phân `rev` thúc đẩy con trỏ như thế nào để không sót không trùng key khi đang rehash, ta bắt buộc phải đọc tài liệu và mã nguồn. Tài liệu chính thức đã nêu rõ `COUNT` chỉ là gợi ý khối lượng công việc, còn mã nguồn sẽ giải thích phiên bản cụ thể triển khai ra sao. Mình nhờ MiniMax M3 hỗ trợ tái hiện thuật toán lõi của `SCAN`, rồi đưa vào project học tập mini-redis do người bạn sharkchili duy trì để kiểm chứng.

Để cung cấp đầy đủ ngữ cảnh, mình chuyển trực tiếp các file mã nguồn liên quan đến Redis SCAN qua lệnh `add-dir` vào project mini-redis:

![Dùng add-dir chuyển các file mã nguồn Redis SCAN vào project mini-redis](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/add-dir-redis-source-64164575.png)

Sau đó gõ yêu cầu. M3 quét qua mã nguồn Redis được cấp, nhận định đây là một long task và tự động gọi skill `plan-with-files` để bóc tách tác vụ và lập kế hoạch:

![M3 tự chủ gọi skill plan-with-files để bóc tách tác vụ và lập kế hoạch](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/m3-plan-with-files-skill-c09f431c.png)

Lập kế hoạch xong, M3 chủ động đặt câu hỏi làm rõ. Điểm đầu tiên là xác nhận phạm vi yêu cầu, mình chọn tái hiện lệnh SCAN:

![M3 chủ động làm rõ yêu cầu, xác nhận phạm vi tái hiện lệnh SCAN](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/m3-clarify-requirements-5e1d57a2.png)

Điểm thứ hai là chọn giải pháp thuật toán. M3 phát hiện mini-redis đã tự xây dựng cấu trúc dữ liệu `dict` của Redis thay vì dùng map nguyên bản của Go, nên đề xuất tái hiện việc dịch chuyển con trỏ trên chính `dict` hiện có. Điều này giúp giữ lại trọn vẹn hành vi thuật toán của Redis và giá trị học tập. Còn việc thứ tự hash bucket, tính định vị bộ nhớ (locality) và hiệu năng có tương đồng hay không phụ thuộc vào data layout và runtime của bản Go, không thể suy diễn thuần túy từ tên gọi cấu trúc dữ liệu:

![M3 đề xuất tái hiện hoàn chỉnh thuật toán con trỏ Redis SCAN dựa trên dict sẵn có thay vì Go map](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/algorithm-selection-dict-vs-map-65189615.png)

Sau nhiều lượt tương tác và làm rõ, chúng mình thống nhất bản kế hoạch như sau:

![Bản kế hoạch tái hiện cuối cùng sau nhiều lượt làm rõ](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/final-replication-plan-b0c2ada8.png)

Sau khi phương án được chốt, M3 triển khai các hàm tuần tự từ dưới lên trên, dựng khung cơ bản cho việc duyệt dict trước, sau đó ghép nối bước dịch con trỏ và phân tích tham số, cuối cùng chủ động cập nhật bảng kế hoạch trong file README của dự án:

![M3 triển khai từng hàm từ dưới lên trên và chủ động cập nhật bảng kế hoạch README của project](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/m3-bottom-up-implementation-f85429ed.png)

Cấu trúc code bàn giao cuối cùng như sau. Triển khai SCAN bao quát phân tích tham số match, count cùng logic vòng lặp con trỏ:

![Cấu trúc code triển khai SCAN do M3 sinh ra: bao quát parse match, count và logic lặp con trỏ](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/scan-implementation-code-cdbd66e4.png)

Qua lần tái hiện này kết hợp với comment trong code, mình đã thấy một chi tiết triển khai của `SCAN`: mã nguồn Redis hiện tại trong hàm `scanGenericCommand` đặt `count × 10` làm số vòng lặp tối đa để giới hạn khối lượng công việc trong một lần gọi trên hash table thưa thớt. Nó không đồng nghĩa với việc "số bucket thực tế duyệt qua luôn cố định tăng gấp 10 lần", và cũng không đảm bảo sẽ gom đủ số phần tử `COUNT` trả về:

![Chi tiết dictScan giới hạn số bucket thực tế duyệt tối đa tới count x 10](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/dict-scan-count-detail-4111207d.png)

Một chi tiết rất đáng lưu ý: trong ngôn ngữ Go, toán tử `^` đảm nhận cả hai ngữ nghĩa là XOR (phép loại trừ) và NOT (phép đảo bit nhị phân), trong khi ngôn ngữ C tách riêng thành `^` và `~`. Thuật toán `rev` liên quan đến hàng loạt phép đảo bit nhị phân, từng bước đều phải phân biệt chính xác giữa "đảo một bit cụ thể" và "đảo toàn bộ số nhị phân"—chỉ cần nhầm lẫn một bước ngữ nghĩa là con trỏ sẽ nhảy sai hoàn toàn. Phần này cần review kỹ để xem M3 có thay thế máy móc `~` thành `^` hay không:

![M3 tự viết thuật toán rev phân biệt chính xác hai ngữ nghĩa XOR và NOT của toán tử ^ trong Go](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/go-xor-not-semantics-f7070437.png)

Nhờ chất lượng triển khai chuẩn xác, code compile và chạy unit test đều pass ngay trong lần đầu:

![Code tái hiện SCAN biên dịch và chạy unit test pass 100% ngay lần đầu](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/scan-test-pass-3d0d3952.png)

## Vận dụng Kiến thức: Xây dựng Dashboard Giám sát Redis Gọn nhẹ

Sau khi hoàn tất việc xử lý sự cố và tổng kết rút kinh nghiệm, ta cần bổ sung năng lực giám sát vào kiến trúc sẵn có nhằm đảm bảo có thể quan sát trạng thái vận hành của Redis theo thời gian thực và nhanh chóng định vị, khoanh vùng nếu sự cố tái diễn.

Ở phần này, mình đưa project hiện hữu làm ngữ cảnh vào một project mới, yêu cầu M3 thiết kế và triển khai từ đầu một dashboard giám sát Redis trực quan để xem khả năng bàn giao toàn diện cả frontend lẫn backend của nó ra sao.

![Đưa project hiện có làm context vào project mới để M3 thiết kế dashboard giám sát Redis từ đầu](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/build-redis-monitor-5f4cb83d.png)

Sau khi làm rõ nhanh một số câu hỏi, M3 đưa ra sơ đồ ASCII kiến trúc hệ thống giám sát, làm rõ luồng dữ liệu:

1. Tầng thu thập (Ingestion: ghi nhận và gửi metrics)
2. Tầng đệm (Buffer: dùng Ring Buffer làm mịn lưu lượng đỉnh)
3. Tầng hiển thị (Presentation: HTTP API + giao diện frontend)

Trách nhiệm giữa 3 tầng rành mạch, độ phụ thuộc thấp:

![Sơ đồ ASCII kiến trúc 3 tầng hệ thống giám sát do M3 đưa ra: thu thập, đệm, hiển thị](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/monitor-three-layer-architecture-41407bb8.png)

Cấu trúc thư mục code:

![Cấu trúc thư mục code của project dashboard giám sát](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/monitor-code-structure-45fa2097.png)

Dù là bản prototype MVP nhanh gọn, thiết kế cấu trúc dữ liệu Ring Buffer (bộ đệm vòng) ở tầng thu thập số liệu rất đáng xem—gồm mảng cố định cấp phát trước, bảo vệ truy cập đồng thời bằng mutex lock, và tự động ghi đè dữ liệu cũ nhất khi bộ đệm bị đầy:

![Thiết kế cấu trúc dữ liệu Ring Buffer: mảng cố định cấp phát trước, khóa mutex bảo vệ, tự ghi đè khi đầy](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/ring-buffer-design-0c1842e0.png)

Dashboard giám sát sinh ra cuối cùng như hình dưới. Toàn bộ áp dụng dark theme, bố cục chia thành nhiều panel: trạng thái real-time của instance Redis (dung lượng bộ nhớ, số connection, QPS), biểu đồ phân bố loại command, và timeline các truy vấn chậm (slow query):

![Dashboard giám sát Redis hoàn thiện: trạng thái real-time, thống kê command và timeline slow query](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/monitor-dashboard-final-931f79ab.png)

Về phía server Redis, dashboard cũng thể hiện chi tiết các slow query và phân bố key, có thể dùng ngay cho việc theo dõi vận hành hàng ngày:

![Hiển thị chi tiết slow query và phân bố key trên Redis server](/media/jg/ext/oss.javaguide.cn/ai/coding/m3/monitor-slow-query-detail-f22c7289.png)

## Tổng kết

Lần này với M3, chúng ta đã thực hiện ba nhiệm vụ: phân tích sự cố connection pool Redis, chuyển đổi thuật toán con trỏ `SCAN` từ C sang Go, và dựng dashboard giám sát Redis. Những bằng chứng và ranh giới thu được:

1. Khi xử lý sự cố, model đưa ra các hướng tiếp cận khả thi về cấu trúc dữ liệu, tính nguyên tử, giáng cấp và giám sát, nhưng giải thích ban đầu về cơ chế nghẽn của `SCAN` chưa thực sự chuẩn xác.
2. Khi tái hiện tầng lõi, model nhận biết được dự án sử dụng `dict` tự viết và phân biệt được ngữ nghĩa XOR với NOT của toán tử `^` trong Go; tính đúng đắn vẫn cần kiểm chứng qua mã nguồn và bài test toàn diện.
3. Dashboard giám sát bao quát cả tầng thu thập, đệm và hiển thị, nhưng các đánh đổi kiến trúc như việc dùng Ring Buffer chưa được lập luận sâu sắc.

Trong quá trình chuyển đổi Redis SCAN từ C sang Go, M3 nhận diện được project đã tự dựng `dict` chứ không dùng Go map, từ đó đề xuất tái hiện hoàn chỉnh thuật toán con trỏ SCAN; toán tử `^` trong Go mang cả hai ngữ nghĩa XOR và NOT cũng được phân biệt rõ ràng từng dòng.

Còn ở kịch bản dashboard giám sát, M3 bộc lộ một ranh giới đáng chú ý: ở giai đoạn xây dựng từ 0 đến 1, kiến trúc nó đưa ra là "phương án an toàn chạy được" chứ chưa phải "phương án tối ưu đã qua cân nhắc thấu đáo". Lấy ví dụ với Ring Buffer: tại sao lại là Ring Buffer mà không phải Lock-free Queue? Khi buffer bị đầy, việc ghi đè dữ liệu cũ nhất dưới mức QPS cao có làm thất thoát các metrics trọng yếu không? Với các điểm quyết định này, M3 mặc định chọn một đáp án chuẩn mực mà không chủ động nêu ra trade-off. Nếu lập trình viên không có sẵn vốn kiến thức nền tảng trong lĩnh vực này thì sẽ không thể đưa ra quyết định tối ưu trong giai đoạn brainstorming—kết quả cuối cùng nhận được chỉ là một prototype "chạy được" chứ không phải một prototype "được thiết kế hợp lý".

Điều này lại dẫn về quan điểm của Addy Osmani: công cụ không học thay bạn. M3 sinh ra code giáng cấp và thuật toán rev, nhưng các giải thích của model về việc `SCAN` gây tắc nghẽn hay cơ chế `count × 10` vẫn đòi hỏi tài liệu, mã nguồn và stress test để nắn chỉnh lại. Đối với mình, giá trị của đợt đánh giá thực tế này nằm chính ở chỗ đó—nó giúp đẩy nhanh tốc độ đọc hiểu và triển khai code, nhưng kết luận kỹ thuật thì người kỹ sư vẫn phải tự mình kiểm chứng.
