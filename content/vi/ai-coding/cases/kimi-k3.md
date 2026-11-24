---
title: "Thực chiến Kimi K3: Dự án Full-stack, nâng cấp dự án Java và Demo game chuẩn 3A"
description: "Thông qua 3 ca thực chiến thực tế gồm hệ thống theo dõi chủ đề nóng, cải tiến dự án Java và bản Demo game hành động góc nhìn thứ ba, đánh giá thực tế năng lực của Kimi K3 trong lập trình Agent đường dài, hiểu đa phương thức (multimodal) và các tác vụ kỹ thuật phức tạp."
category: Thực chiến AI Coding
head:
  - - meta
    - name: keywords
      content: Kimi K3,Kimi Code,AI coding,Agent Coding,phát triển full-stack,nâng cấp dự án Java,đa phương thức,tác vụ đường dài,phát triển game
lang: vi
sourceRef: zh-ref/ai-coding/cases/kimi-k3.md
---

Xin chào, mình là Tiểu G. Kimi K3 đã chính thức ra mắt vào thứ Sáu tuần trước!

Hai ngày nay, câu hỏi mình nhận được nhiều nhất cơ bản đều xoay quanh một vấn đề: Rốt cuộc năng lực của K3 như thế nào? Cảm giác viết code thực tế ra sao?

Cả trong nước lẫn quốc tế đã có rất nhiều chuyên gia đem K3 ra so sánh đối đầu với các mô hình Coding hàng đầu, và phản hồi thu về đều rất khả quan. Số liệu cũng không biết nói dối, lượng đăng ký gói và mức độ sử dụng K3 mấy ngày nay tăng đột biến, tài nguyên tính toán gần như căng thẳng tối đa.

Tuy vậy, mình vẫn muốn tận mắt kiểm chứng biểu hiện của nó trong các dự án thực tế, vì mình tin đây mới là thước đo thực dụng nhất.

Do đó, lần này mình đã chuẩn bị ba ca thực chiến hết sức điển hình: một dự án full-stack, một dự án Java hiện hữu cần cải tiến tính năng, cộng thêm một bản Demo game làm mới từ con số không.

Lần này K3 mang đến: **2.8T tham số, ngữ cảnh 1M token, đa phương thức (multimodal) nguyên bản, cùng kiến trúc được tối ưu chuyên biệt cho lập trình Agent tác vụ đường dài (long-horizon).**

Có thể thấy, trọng tâm cốt lõi của nó là giúp Agent có thể duy trì việc đọc code, xem ảnh chụp màn hình, chạy công cụ và sửa lỗi liên tục trong các chuỗi tác vụ dài hơi.

![Thông tin phát hành chính thức của Kimi K3](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-official-announcement-0de1f418.png)

Bài viết này vẫn sẽ đi theo phương pháp quen thuộc của mình: Trước tiên xem cách kết nối, tiếp theo đánh giá biểu hiện thực tế qua các tác vụ kỹ thuật, và cuối cùng quay lại phân tích các điểm sáng nổi bật trong đợt cập nhật này của K3.

## Kết nối Kimi K3

K3 hỗ trợ hầu như toàn bộ các Coding Agent và framework Agent phổ biến hiện nay, chẳng hạn như Claude Code, Roo Code, OpenCode, OMP, OpenClaw, Hermes.

Ở đây mình lấy Kimi Code CLI chính thức của Kimi làm ví dụ để giới thiệu con đường kết nối ngắn nhất. Nếu bạn đang dùng quen Claude Code, Roo Code, OpenCode hay CC Switch thì vẫn có thể tiếp tục tận dụng chuỗi công cụ cũ của mình.

### Kết nối qua Kimi Code CLI

Đây là terminal Coding Agent chính thức từ Kimi, tương tự như Claude Code.

Sau khi cài đặt thành công, bạn chỉ cần gõ lệnh `kimi` trong thư mục dự án, sau đó có thể yêu cầu nó đọc code, sửa code, chạy lệnh terminal, giải thích log lỗi và tự động sinh commit message.

Lệnh cài đặt cho macOS và Linux:

```bash
curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash
```

Đối với Windows PowerShell:

```powershell
irm https://code.kimi.com/kimi-code/install.ps1 | iex
```

Sau khi cài đặt xong, bạn có thể kiểm tra số hiệu phiên bản bằng `kimi --version`:

![Cài đặt Kimi Code CLI hoàn tất và kiểm tra phiên bản](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-kimi-cli-install-7e1fa65b.png)

Cài xong, hãy chuyển vào thư mục dự án cần thử nghiệm và chạy:

```bash
kimi
```

Lần khởi động đầu tiên hệ thống sẽ yêu cầu đăng nhập tài khoản Kimi. Sau khi vào giao diện Kimi Code CLI, bạn gõ `/model` và chọn `k3`.

![Khởi động bằng kimi -y và chọn k3 trong danh sách mô hình](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-kimi-y-model-list-06f60047.png)

Đối với cá nhân mình, trước khi bắt tay vào làm việc nghiêm túc, mình luôn chạy một bài test nhỏ chỉ đọc (read-only):

```text
Đọc cấu trúc thư mục và mã nguồn cốt lõi của dự án hiện tại, giải thích trách nhiệm của từng module. Tạm thời không chỉnh sửa file và không thực thi các lệnh có tác dụng phụ (side effects).
```

![Kimi đọc cấu trúc thư mục và code cốt lõi của dự án Java trước](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-read-java-project-2a6c1841.png)

### Vẫn dùng tốt với các Coding Agent sẵn có

Nếu bạn đã quen tay với Claude Code, Roo Code hoặc OpenCode thì không cần thiết phải đập đi xây lại workflow chỉ vì K3. Sau khi tạo Kimi Code API Key, bạn có thể thông qua giao diện tương thích để đấu nối K3 vào.

Các framework Agent đa dụng như OpenClaw, Hermes cũng có thể gọi Kimi Code. K3 phụ trách phần suy luận của mô hình, còn cơ chế đọc file, gọi công cụ (tool calling) và quản lý phân quyền vẫn do framework Agent bên ngoài xử lý.

Lấy CC Switch làm ví dụ, khi thêm nhà cung cấp (provider) mới, bạn có thể chọn trực tiếp Kimi For Coding:

![Chọn Kimi For Coding khi thêm nhà cung cấp mới](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-provider-select-5a774267.png)

Sau đó điền API Key và địa chỉ endpoint, định dạng API cứ giữ nguyên mặc định:

![Cấu hình Kimi For Coding API Key và địa chỉ request](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-provider-config-73c9fabd.png)

Bấm lấy danh sách mô hình, rồi ánh xạ vai trò mô hình sang `k3`:

![Chọn k3 trong phần ánh xạ mô hình Kimi For Coding](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-provider-model-mapping-6229cf26.png)

Ở đây không cần phải cấu hình thêm routing phụ:

![Chọn trực tiếp Kimi For Coding trong CC Switch](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-cc-switch-direct-provider-11cdc0af.png)

Kiểm tra thực tế:

![Claude Code kết nối thành công với Kimi](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-claude-code-read-project-04dcd7a4.png)

## Ca 1: Xây dựng hệ thống theo dõi chủ đề nóng

Ở trường hợp đầu tiên, mình yêu cầu K3 xây dựng một **hệ thống theo dõi chủ đề nóng** với tên dự án là **HotPulse**.

Lần này mình không chỉ yêu cầu nó tạo một giao diện frontend ưa nhìn. Giao diện đẹp dĩ nhiên cần, nhưng mình muốn xem liệu nó có thể kết nối thông suốt chuỗi pipeline backend, cơ sở dữ liệu, hàng đợi (queue), kiểm thử và cơ chế tự phục hồi lỗi hay không.

Mục tiêu nghiệm thu lần này là một bản MVP chạy hoàn chỉnh: Người dùng tạo Monitor theo từ khóa, hệ thống định kỳ hoặc thủ công cào dữ liệu từ Hacker News / RSS, ghi nội dung thô thành Observation, qua giai đoạn phân tích (analyze) để sinh Entry, cuối cùng gửi đi qua kênh thông báo Notify. Phía frontend phải hiển thị được Feed, Monitor Run, trạng thái Delivery, đồng thời hỗ trợ đọc, đánh dấu yêu thích và lưu trữ (archive).

Trong tài liệu thiết kế hệ thống giao cho K3, mình đưa ra các ràng buộc then chốt: Backend dùng Hono, SQLite, Drizzle; Frontend dùng React 19, React Router, TanStack Query, kết hợp Socket.IO. Các bài kiểm thử không được phụ thuộc vào mạng internet công cộng thực tế, thông báo dùng fake webhook server, cơ sở dữ liệu dùng SQLite tạm thời trong bộ nhớ/file tạm.

Để bỏ qua bước phê duyệt thủ công mỗi khi ghi file hoặc chạy lệnh, ta có thể dùng lệnh `kimi -y`.

Quá trình thúc đẩy nhiệm vụ sử dụng lệnh `/goal`. Để đánh giá năng lực nội tại của chính mô hình trong các tác vụ đường dài, mình không bật bất kỳ Skill nào và cũng không cài thêm plugin mở rộng chuyên biệt cho dự án.

![Dùng goal thúc đẩy nhiệm vụ HotPulse trong Kimi Code CLI](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-goal-active-af01a260.png)

Một chi tiết nhỏ: Thời lượng hiển thị hơn 8 tiếng trong hình không có nghĩa là mô hình đã làm việc liên tục ngần ấy thời gian. Mình bắt đầu chạy từ khoảng 12 giờ đêm, lúc giữa chừng bị treo thì mình để đó đi ngủ, sáng hôm sau dậy thúc đẩy tiếp. Thời gian làm việc thực tế hiệu quả rơi vào khoảng 1 giờ đồng hồ.

### Chạy thông suốt luồng backend trước

Thứ tự triển khai của K3 rất vững vàng: Trước hết xây dựng shared contract, Zod schema và unit test, sau đó hoàn thiện cấu hình server, cơ sở dữ liệu, queue, domain service, và cuối cùng xâu chuỗi các khâu cào dữ liệu, phân tích, thông báo, lập lịch định kỳ, background worker cùng các tác vụ bảo trì hệ thống.

Quá trình này không phải lúc nào cũng trơn tru một mạch. K3 tự chạy kiểm tra TypeScript và test suite, khi thấy báo lỗi thì tự quay lại sửa helper, handler và test case.

![Kimi sửa lỗi test phía server và lỗi TypeScript](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-server-tests-324ee500.png)

### Backend pass toàn bộ mới chuyển sang Frontend

Phía server đạt trạng thái xanh toàn bộ `94/94` bài test, sau đó K3 mới bắt tay vào xử lý phía client.

![Chuyển sang làm SPA frontend sau khi test phía server đều pass](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-client-stage-0cfd8a39.png)

Phần frontend được bổ sung đầy đủ các trang Monitor, Feed, Targets, Deliveries và System.

Dưới đây là báo cáo bàn giao cuối cùng của HotPulse MVP:

![Báo cáo bàn giao cuối cùng của HotPulse MVP](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-goal-complete-3d6a9dcb.png)

Phạm vi chức năng bàn giao cuối cùng bao phủ cơ bản toàn bộ các tiêu chí nghiệm thu MVP mà mình đã đề ra.

Dù vậy, bản đầu tiên tuy chạy được nhưng thực sự còn thô ráp, đúng chuẩn phiên bản MVP.

Trang chỉnh sửa Monitor cho phép cấu hình tên, từ khóa, tần suất chạy, trạng thái kích hoạt và nguồn dữ liệu:

![Trang chỉnh sửa HotPulse Monitor](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-monitor-edit-df1abc02.png)

Trang Feed hiển thị các Entry đã được cào và phân tích, hỗ trợ lọc theo trạng thái, Monitor, sắp xếp và đánh dấu yêu thích:

![Trang HotPulse Feed](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-feed-65b5d1a5.png)

### Tiếp tục tối ưu hóa

Sau đó, mình yêu cầu Kimi tiếp tục tối ưu hóa qua vài vòng lặp.

![Báo cáo cuối cùng sau khi tối ưu hóa HotPulse MVP](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-optimization-report-e655a7da.png)

Vòng lặp này chủ yếu đưa những điểm mới dừng ở mức "dùng được" ở bản đầu tiên tiến lên một bước gần hơn với hình hài của sản phẩm thương mại. Chẳng hạn như trang chủ mặc định, hướng dẫn người dùng mới (onboarding), phản hồi khi chạy thủ công, trạng thái pending của nút bấm, chống gửi trùng lặp (debounce/throttle), toast notification, modal xác nhận khi xóa, và văn bản giao diện chỉn chu, đồng nhất.

Tiến thêm một bước nữa, mình yêu cầu nó thực hiện **mở rộng đa nguồn dữ liệu (Multi-source Extension)**.

Lần này không chỉ đơn thuần là chỉnh sửa giao diện. HotPulse không còn bị giới hạn ở Hacker News / RSS mà tích hợp cả RSS, Webpage, GitHub và Twitter vào cùng một pipeline chung: scrape → analyze → notify.

![Mở rộng đa nguồn HotPulse V1.1 hoàn tất và vượt qua kiểm thử](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-hotpulse-v11-multisource-complete-c6cce1b4.png)

Điểm thú vị nhất ở đây không phải là viết thêm vài crawler, mà là K3 đã quy chuẩn các nguồn này về tầng trung gian `source_items`, dùng cặp khóa `(monitorId, externalId)` làm định danh duy nhất và sử dụng `contentFingerprint` để phát hiện biến động nội dung.

Một hệ thống giám sát thực thụ có độ khó nằm ở chỗ: khi một nguồn dữ liệu bị sập, cấu trúc trang web thay đổi, hoặc API bị chậm, thì toàn bộ pipeline có đứng vững được không, có biết tự động hạ cấp (degrade) không, có tiếp tục chạy và định vị chính xác vị trí lỗi hay không.

Đây là kết quả chạy thực tế, đã rất tiệm cận với một sản phẩm hoàn thiện.

Địa chỉ video demo: <https://www.zhihu.com/pin/2062834508802569097>

Giá trị lớn nhất trong ca thực chiến này là **K3 trong một chuỗi tác vụ dài có thể bám sát mục tiêu liên tục: đọc yêu cầu, bóc tách module, sửa code, chạy test, sửa lỗi, và cuối cùng bàn giao kết quả có thể nghiệm thu được.**

## Ca 2: Cải tiến dự án sẵn có

Ở trường hợp thứ hai, mình bố trí hai tác vụ nhỏ về sửa lỗi và thêm tính năng trên một dự án đang vận hành.

Dạng bài toán này khác hẳn với việc dựng mới MVP full-stack ở trên. Trọng tâm là phải đọc hiểu mã nguồn sẵn có trước, sau đó lần theo hiện tượng lỗi để truy vết chuỗi gọi hàm, nguồn dữ liệu và chi tiết triển khai. Đối với Coding Agent, tác vụ dạng này sát sườn với công việc phát triển hàng ngày hơn: phát hiện lỗi trên production hoặc dưới local, định vị chính xác nguyên nhân, khoanh vùng phạm vi sửa đổi nhỏ nhất, rồi chạy kiểm chứng.

Ở đây chúng ta lấy dự án thực chiến phân tích cổ phiếu bằng đa Agent làm ví dụ, dự án này thời gian qua vẫn đang liên tục được bổ sung và hoàn thiện giáo trình.

Đầu tiên là bài toán: Sửa lỗi font chữ hiển thị (ký tự rác) khi tìm kiếm cổ phiếu.

### Sửa lỗi font chữ tìm kiếm cổ phiếu

Hiện tượng lỗi nhìn vào là thấy ngay: Tên tiếng Trung trong kết quả tìm kiếm cổ phiếu biến thành toàn bộ các ký tự rác khó hiểu, chỉ còn mỗi mã cổ phiếu là xem được.

![Kết quả tìm kiếm cổ phiếu bị lỗi font ký tự](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-stock-garbled-before-0d3d2a71.png)

Sau khi mình ném ảnh chụp màn hình và mô tả hiện tượng cho K3, nó trước tiên lần theo điểm vào tìm kiếm để đến `marketDataService.searchStock`, rồi tiếp tục đào sâu vào logic fallback nguồn dữ liệu.

Cuối cùng, vấn đề được định vị chính xác tại chuỗi `HttpBodyFetcher` / `HttpUtils`: API tìm kiếm `suggest3.sinajs.cn` và API bảng giá `hq.sinajs.cn` của Sina trả về dữ liệu mã hóa chuẩn GBK, trong khi `SinaDataSource` trong dự án mặc định gọi qua `HttpUtils.get` cố định giải mã theo UTF-8, khiến tên tiếng Trung bị giải mã sai lệch tại đây.

Trọng tâm sửa lỗi là cấu hình nguồn dữ liệu Sina giải mã theo GBK, đồng thời bổ sung phương thức request hỗ trợ header `Referer`.

![Kimi định vị và sửa lỗi font tìm kiếm cổ phiếu](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-stock-garbled-fixed-00a11d1d.png)

Sửa xong, K3 tự chạy `mvn -pl stock-crawler -am install`, khởi động lại backend và kiểm thử thực tế `GET /api/market/search?keyword=开`, xác nhận đã trả về các tên chuẩn xác.

Nhiệm vụ nhỏ này tuy quy mô không lớn, nhưng so với câu lệnh chung chung "viết hộ tôi class utils", nó phản ánh rõ thói quen công kỹ nghệ của mô hình: nó truy vết xuyên suốt từ entry point, data source, công cụ giải mã HTTP cho đến encoding của API bên ngoài, và tuyệt đối không làm lan rộng sang các module không liên quan.

### Phát triển bảng theo dõi lợi nhuận danh mục (Portfolio Earnings Dashboard)

Tác vụ thứ hai là bổ sung một **Bảng theo dõi lợi nhuận danh mục** vào dự án cổ phiếu này.

Yêu cầu đặt ra là dựa trên giá vốn, khối lượng nắm giữ và giá thị trường thời gian thực của các mã cổ phiếu trong danh sách theo dõi sẵn có, tính toán ra các chỉ số: tổng giá trị thị trường, lãi/lỗ thả nổi (floating PnL), lãi/lỗ trong ngày, tỷ trọng vị thế lớn nhất. Đồng thời, phong cách giao diện phải đồng bộ với hệ thống hiện tại.

![K3 nhận nhiệm vụ phát triển bảng theo dõi lợi nhuận danh mục](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-task-55c9d5db.png)

Yêu cầu này nhìn bề ngoài giống như chỉ vẽ một trang web, nhưng thực tế đòi hỏi phải hoàn thiện đồng thời cả tính toán backend, phân tầng API, hiển thị frontend và viết test.

K3 trước tiên đọc các trường dữ liệu cổ phiếu theo dõi, API bảng giá và các tầng kiến trúc hiện hữu của dự án, rồi mới bắt tay vào viết. Việc tính toán số tiền được thống nhất dùng `BigDecimal`; khi thiếu dữ liệu giá thị trường thì cho phép cổ phiếu đơn lẻ hạ cấp (fallback) hiển thị, tránh việc một bản ghi bất thường làm sập toàn bộ trang.

![K3 hoàn thành bảng theo dõi lợi nhuận và xuất kết quả xác thực](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-complete-f5c24986.png)

Kết quả bàn giao cuối cùng là một bảng điều khiển có thể truy cập trực tiếp: Phía trên là các thẻ tóm tắt tổng giá trị, tổng chi phí vốn, lãi/lỗ thả nổi; phía dưới hiển thị chi tiết giá vốn, giá hiện tại, tỷ trọng và lợi nhuận của từng cổ phiếu. Các API backend, route frontend và bài test đều được bổ sung đồng bộ.

![Giao diện hoàn chỉnh của bảng theo dõi lợi nhuận danh mục](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-dashboard-1dc3a112.png)

Đến bước này, thực chất hệ thống đã có thể sử dụng được.

Tuy nhiên, mình nghĩ lại: trong các dự án thực tế, vấn đề không đơn giản chỉ là "trang web đã có hay chưa", mà là số liệu có chuẩn hóa logic hay không, ngoại lệ có được bọc lót an toàn không, và các chỉ số có đào sâu được tiếp hay không.

Vì vậy, mình yêu cầu K3 phát triển tiếp một bản V2 dựa trên bảng điều khiển này.

Bản này sẽ tiếp tục hoàn thiện logic nghiệp vụ và các chỉ số rủi ro. Chẳng hạn xử lý sự thiếu nhất quán khi một phần dữ liệu giá thị trường không khả dụng, bổ sung bảng xếp hạng đóng góp lợi nhuận, tỷ trọng top 3 vị thế nắm giữ, chỉ số tập trung HHI, độ biến động hàng năm (annualized volatility), và mức sụt giảm tối đa (maximum drawdown).

![K3 tiếp tục tối ưu bảng theo dõi lợi nhuận danh mục V2](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-v2-task-03ebea57.png)

Điểm mình thấy rất thú vị ở đây là nó không nhồi nhét trường dữ liệu vào frontend ngay lập tức, mà quay về backend để xác nhận các trường dữ liệu nến (K-line), căn chỉnh ngày giao dịch, xử lý tình huống cổ phiếu ngừng giao dịch hoặc dữ liệu không đủ thì fallback thế nào, rồi đóng gói logic tính toán vào một class riêng biệt `PortfolioRiskCalculator`.

Cách làm này rất giống nhịp điệu làm việc của một kỹ sư nhiều kinh nghiệm.

![K3 hoàn thành bảng theo dõi lợi nhuận V2 và vượt qua xác thực](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-v2-complete-07e6a5e9.png)

Trong trang V2 hoàn thiện, danh sách nắm giữ ban đầu vẫn được giữ lại, bên dưới có thêm phần đóng góp lợi nhuận và tổng quan rủi ro.

Phần đóng góp lợi nhuận giúp thấy rõ cổ phiếu nào thực sự mang lại lãi lỗ cho danh mục, còn phần tổng quan rủi ro thể hiện độ biến động hàng năm, sụt giảm tối đa, VaR, chỉ số tập trung HHI và tỷ trọng top 3 cổ phiếu chiếm giữ.

![Giao diện bảng theo dõi lợi nhuận danh mục V2](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-case2-portfolio-v2-dashboard-f15c26c3.png)

Trong trường hợp này, nó có thể móc nối hoàn chỉnh chuỗi xử lý dưới các ràng buộc của dự án cũ: Tái sử dụng dữ liệu trước, bổ sung tính toán và API sau, cuối cùng chạy test và xác thực trang giao diện. Quan trọng hơn, ở vòng tối ưu thứ hai, nó có thể bám sát các tiêu chuẩn nghiệp vụ, nâng cấp từ trạng thái "hiển thị được" lên mức "dữ liệu chuẩn xác và tin cậy".

Ngoài ra, sau khi hoàn thành, mình còn dùng GPT 5.6 Sol để review lại toàn bộ mã nguồn; logic hiện thực và chất lượng code nhìn chung đều chuẩn mực, có thể commit trực tiếp.

## Ca 3: Làm mới hoàn toàn một bản Demo game chất lượng chuẩn 3A

Với trường hợp thứ ba này, ban đầu mình thực sự đã khá đắn đo.

Phía trước đã có một dự án full-stack và một dự án Java cải tiến. Nếu tiếp tục đưa vào một ca sửa bug thông thường thì lượng thông tin sẽ bị trùng lặp.

Sau đó, mình quyết định đổi sang một hướng trực quan hơn hẳn.

Làm game.

Hướng đi này hoàn toàn khác biệt. Hệ thống nghiệp vụ nhìn vào kiến trúc phân tầng, API, kiểm thử và chuẩn hóa dữ liệu; trong khi game lại đòi hỏi một bộ năng lực khác: hình ảnh, vật lý, cảm giác tay cầm/phím bấm (game feel), góc quay camera, phản hồi chiến đấu, âm thanh, UI, hiệu năng, và quan trọng nhất là: có thực sự chơi được hay không.

Và thực sự, năng lực làm game của K3 vượt ngoài sức tưởng tượng.

Trên các cộng đồng công nghệ nước ngoài, mình cũng bắt gặp không ít phản hồi tương tự, có người nói K3 chỉ với một dòng prompt làm minigame cực kỳ đỉnh, thậm chí có người dùng nó để tái hiện bản 3D Demo phong cách Minecraft.

![Phản hồi của cộng đồng quốc tế về khả năng làm game của K3](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-game-community-feedback-d78312cb.png)

Thế là mình nghĩ, được rồi, đừng chỉ đứng nhìn người khác chơi.

Tự mình phải thử xem sao.

Prompt của mình rất ngắn gọn: yêu cầu nó trong một thư mục trống hiện tại, phát triển từ đầu một bản Demo game hành động khoa học viễn tưởng góc nhìn thứ ba chất lượng chuẩn 3A. Bối cảnh là một căn cứ công nghiệp tương lai bị bỏ hoang, người chơi phải đột nhập vào căn cứ, tiêu diệt kẻ địch cản đường, đoạt lấy lõi năng lượng, cuối cùng hạ gục Boss cơ khí và rút lui an toàn.

Về mặt kỹ thuật, mình yêu cầu dùng Vite, TypeScript, Three.js và Rapier. Tuyệt đối không tự viết physics engine bằng tay; việc di chuyển của nhân vật, va chạm và trọng lực đều giao cho Rapier xử lý. Game bắt buộc phải có: di chuyển, chạy nhanh, lướt né (dodge), ngắm bắn, xả súng, nhận sát thương, chết hồi sinh từ checkpoint, kẻ địch thường, kẻ địch tinh anh, Boss nhiều giai đoạn, vòng lặp nhiệm vụ hoàn chỉnh, vật liệu PBR, ánh sáng đổ bóng động, sương mù, hạt particle, hiệu ứng Bloom, phản hồi bắn trúng và rung camera.

![Yêu cầu K3 phát triển từ đầu bản Demo game hành động góc nhìn thứ ba chuẩn 3A](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-game-steel-haven-prompt-f0c72141.jpg)

Nói thật lòng, khi viết dòng prompt đó, kỳ vọng trong lòng mình không đặt quá cao.

Bởi vì game không phải là trang web thông thường.

Một nút bấm trên web bị lệch một chút người ta vẫn nhìn được; nhưng với game, chỉ cần camera, va chạm, bắn súng, AI của địch, phase của Boss, hiệu ứng hình ảnh hoặc âm thanh bị lệch nhịp một khâu thôi là người chơi sẽ nhận ra ngay lập tức.

K3 trước tiên đưa ra bản thiết kế game và phương án kỹ thuật. Dự án mang tên *STEEL HAVEN* (Pháo đài thép), với quy trình đầy đủ: bãi đáp trực thăng, phá cổng căn cứ, lính gác tinh anh sân trung tâm, đoạt lõi năng lượng, đánh thức Boss WARDEN-9, trận chiến Boss 3 giai đoạn, thủ vững điểm rút quân, chết thì hồi sinh từ điểm checkpoint.

![Bản thiết kế game và cấu trúc thư mục do K3 đưa ra](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-game-steel-haven-design-a4aa852e.jpg)

Sau đó nó bắt đầu bắt tay vào viết dự án.

Bản bàn giao ở bước đầu tiên thực sự đã vượt xa cái mức "gắn tạm mấy khối lập phương rồi bảo đây là game".

Nó thực sự đã dựng xong vòng lặp hoàn chỉnh của một trò chơi: điều khiển nhân vật góc nhìn thứ ba, di chuyển WASD, Shift chạy nhanh, Space né đòn, chuột phải ngắm, chuột trái bắn, R nạp đạn, E tương tác, lính thường, lính tinh anh, Boss 3 phase, mục tiêu nhiệm vụ, thanh máu Boss, chết hồi sinh, màn hình chiến thắng; thậm chí có cả vật liệu PBR, phản chiếu môi trường, bóng đổ, sương mù, Bloom, ánh lửa nòng súng, hạt nổ, dấu vết bắn trúng và rung màn hình.

![Báo cáo bàn giao bản đầu tiên của STEEL HAVEN](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-game-steel-haven-report-v1-c23a6f0d.jpg)

Dĩ nhiên, bản đầu tiên không phải là không có khiếm khuyết.

Chính nó trong báo cáo bàn giao cũng liệt kê vài vấn đề đã biết: ví dụ chưa có động tác nhảy, Boss khi đứng đối diện trực tiếp với người chơi thì model của Boss sẽ tạm thời che khuất tầm nhìn, dung lượng build hơi lớn. Quan trọng hơn là khi mình trải nghiệm thực tế, có thể cảm nhận rõ ràng cảm giác bắn súng vẫn còn chỗ cần mài giũa thêm.

Điều này dẫn sang bước thứ hai.

Mình yêu cầu nó tập trung tối ưu động tác bắn súng và trải nghiệm chiến đấu, không làm lại game mới mà sửa đổi trực tiếp trên dự án hiện tại. Nó đọc ảnh chụp màn hình và mã nguồn, liệt kê ra 7 vấn đề ảnh hưởng trực tiếp đến cảm giác chơi: tay trái không cầm vào súng, nòng súng và tâm ngắm không thẳng hàng, khi ngắm bắn nhân vật che khuất màn hình, ánh lửa nòng súng bị thân người che lấp, độ tản xạ khi bắn liên thanh không khớp với độ giật thực tế, phân tầng phản hồi khi bắn trúng chưa rõ, âm thanh nạp đạn bị lệch nhịp với động tác.

Sau đó nó tiến hành chỉnh sửa các module Player, PlayerController, CameraRig, Weapon, Game, Physics, AudioManager, HUD và Enemy.

![K3 tối ưu vòng hai động tác bắn súng và cảm giác chiến đấu](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-game-steel-haven-report-v2-89403bb6.jpg)

Sau đợt sửa đổi này, trải nghiệm đã mang lại cảm giác của một tựa game thực thụ hơn rất nhiều.

Khi ngắm bắn, nhân vật dịch chuyển từ giữa màn hình sang góc dưới bên phải, giúp tầm nhìn trước tâm ngắm quang đãng hơn; khi nổ súng có độ giật lùi của thân súng và camera hơi nảy lên; bắn liên tục sẽ tích lũy độ tản xạ đạn; động tác nạp đạn có các phân đoạn hạ súng, nhả băng đạn, lắp băng mới và kéo chốt; bắn trúng, bắn chí mạng (crit), tiêu diệt mục tiêu đều có ký hiệu và âm thanh phân biệt; tia lửa va vào tường cũng bắn ra chuẩn theo hướng pháp tuyến (normal), không còn giống như những decal dán cứng nhắc lên bề mặt.

Địa chỉ video demo: <https://www.zhihu.com/pin/2062833196090275836>

Tại sao mình thấy bắt buộc phải đưa ca thực chiến này vào?

Bởi vì nó thể hiện cực kỳ rõ nét năng lực hiểu đa phương thức (multimodal) và giải quyết tác vụ đường dài của K3.

Ở vòng 1, từ một câu yêu cầu, nó phải bóc tách ra lối chơi (gameplay), màn chơi (level), kẻ địch, Boss, vật lý, đồ họa, âm thanh, UI và test. Ở vòng 2, nó lại phải dựa vào ảnh chụp màn hình và trải nghiệm thực tế để quay lại tinh chỉnh cảm giác chơi, nâng cấp từ mức "chơi được" lên "mang dáng dấp của một tựa game đích thực".

Đây không phải là bài toán sinh ra một trang frontend đơn giản.

Đây là việc dịch các trải nghiệm mang tính chủ quan thành các chi tiết mã nguồn cụ thể.

Cảm giác bắn súng là thứ rất khó để định nghĩa bằng một bài unit test. Tâm ngắm có bị người che không, nổ súng có độ giật khựng không, bắn trúng có phản hồi không, thay đạn có nhịp điệu không, đánh Boss có cảm giác áp lực nghẹt thở không—tất cả những điều này đều phải đánh giá bằng thị giác và cảm nhận thực tế.

Điều này chứng minh K3 không chỉ biết viết code nghiệp vụ văn phòng, mà còn có thể cáng đáng những tác vụ kỹ thuật sáng tạo mang tính tổng hợp cao. Miễn là mục tiêu đủ rõ ràng, tiêu chí nghiệm thu đủ cụ thể, nó có thể đi một mạch từ thiết kế gameplay cho đến một bản Demo game chạy mượt trên trình duyệt, rồi tiếp tục tối ưu hóa vòng hai dựa trên phản hồi trải nghiệm.

Điểm này thực sự vượt ngoài mong đợi ban đầu của mình.

## Đợt cập nhật này của K3 có những điểm sáng gì?

Trên các bảng xếp hạng Coding, K3 cơ bản đều nằm trong nhóm dẫn đầu, một số bài test thậm chí vươn lên vị trí số một. Đặc biệt ở các bài kiểm thử như Terminal Bench, Program Bench, SWE Marathon—vốn phản ánh rất sát công việc phát triển hàng ngày và các chuỗi tác vụ dài—kết quả của nó đều rất ấn tượng.

![So sánh Kimi K3 trên các Coding benchmark](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-coding-benchmarks-799b1adc.png)

Tất nhiên, benchmark chỉ mang tính chất tham khảo.

Trong dự án thực tế, môi trường mà Agent tiếp xúc phức tạp hơn nhiều: Tác vụ càng chạy càng dài, yêu cầu, mã nguồn, nhật ký log, kết quả test chen chúc cùng nhau trong ngữ cảnh.

Vì vậy, cửa sổ ngữ cảnh 1M token là cực kỳ quan trọng. Nó giúp lưu giữ nhiều yêu cầu, mã nguồn và output terminal tại hiện trường hơn, không lo chạy được vài vòng thì những gì xảy ra trước đó bị nén mất sạch.

Tuy nhiên, 1M token chỉ giải quyết bài toán chứa được bao nhiêu, không tự động giải quyết được việc dùng có khôn ngoan hay không. Do đó, K3 lần này còn giới thiệu Kimi Delta Attention và Attention Residuals. Trong ngữ cảnh hàng triệu token, nó cho tốc độ giải mã (decoding) nhanh hơn tới 6.3 lần, đồng thời tăng khoảng 25% hiệu quả huấn luyện với chi phí phụ trội chưa tới 2%.

Bạn không cần phải nhớ những thuật ngữ phức tạp này, hiểu đơn giản là: **K3 xử lý các kịch bản tác vụ dài ổn định và vững vàng hơn rất nhiều!**

Khía cạnh Agent và đa phương thức cũng rất đáng chú ý. Trong các tác vụ General Agent, xử lý bảng biểu và trình duyệt, K3 cơ bản đều đứng ở top đầu, một vài bài test chiếm luôn vị trí quán quân. Các bài kiểm tra thị giác cũng không hề bị tụt lại, tổng thể rất cân bằng.

![So sánh Kimi K3 trên các benchmark General Agents và Visual Agents](/media/jg/ext/oss.javaguide.cn/ai/coding/k3/k3-agent-visual-benchmarks-d818c4f5.png)

Nhưng với lập trình viên thông thường, mối quan tâm sau cùng vẫn là 3 điều: **Hiệu quả có đủ tốt không, chi phí có chịu nhiệt nổi không, và tốc độ có đủ nhanh không.**

Cảm nhận của mình về K3 là: tốc độ phản hồi rất nhanh, mức giá so với các mô hình cùng phân khúc là tương đối dễ chịu, có thể nói là mức giá tiệm cận Sonnet nhưng lại đem đến trải nghiệm ở cấp độ Opus trong các tác vụ phức tạp, tỷ lệ hiệu năng trên giá thành (P/P) thực sự rất cao.

**⭐️ Bài viết đề xuất đọc thêm:**

- [Cẩm nang học tập + Phỏng vấn Backend Development](https://javaguide.cn/home.html): Bao phủ kiến thức trọng tâm và phỏng vấn về Java, kiến thức cơ sở máy tính, cơ sở dữ liệu, framework, thiết kế hệ thống.
- [Cẩm nang học tập + Phỏng vấn Phát triển Ứng dụng AI](https://javaguide.cn/ai/): Bao phủ LLM, RAG, Agent, MCP, Prompt, đánh giá kiểm thử, thiết kế hệ thống AI.
- [Cẩm nang Thực chiến AI Coding](https://javaguide.cn/ai-coding/): Chia sẻ kỹ năng sử dụng các công cụ như Claude Code, Cursor, Codex, Trae.

## Tóm kết

Sau khi chạy xong các ca thực chiến này, mình tin rằng mọi người cũng như mình đã có một cái nhìn trực quan và thực tế hơn về năng lực của K3, chứ không chỉ dừng lại ở các thông số và bảng xếp hạng điểm số.

Kimi từ trước đến nay luôn nằm trong nhóm đỉnh nhất về năng lực frontend. Với đợt ra mắt K3 này, năng lực của nó đã trở nên toàn diện hơn rất nhiều.

Trong bài toán MVP full-stack, lệnh `/goal` giúp thúc đẩy tác vụ đường dài tiến bước vững chắc; khi sửa lỗi trên dự án sẵn có, nó có thể lần theo tuần tự từ entry point, service layer, data source cho đến utils class; sang đến ca làm game, nó lại kết nối được trơn tru giữa gameplay, vật lý, camera, cảm giác bắn súng và hệ thống phản hồi.

Mình sẵn sàng tin tưởng giao cho nó các nhiệm vụ có mục tiêu rành mạch, tiêu chí nghiệm thu rõ ràng, và cho phép nó tự do thực thi lệnh và tự sửa lỗi liên tục. Các tác vụ như dựng một MVP, sửa một con bug chạy xuyên module, hay dựng một bản Demo tương tác sẽ bộc lộ trình độ thực sự của một Coding Agent rõ ràng hơn nhiều so với việc chỉ đơn thuần sinh ra vài trang giao diện.

Điểm khiến mình thực sự ấn tượng là K3 giữ được sự điềm tĩnh và ổn định xuyên suốt các tác vụ dài, đồng thời chất lượng hoàn thành nhiệm vụ rất tuyệt vời, hầu như không sót lại con bug nào sau khi kết thúc.

Nếu trong thời gian tới mức giá, tốc độ và tính sẵn sàng của dịch vụ tiếp tục duy trì phong độ này, K3 chắc chắn sẽ là một mô hình thuộc nhóm đầu vừa có thực lực vừa có tính kinh tế cao.

Ở đây mình sẽ không dùng những từ đao to búa lớn như "vượt mặt ai" hay "đè bẹp ai".

Thước đo của lập trình viên sau cùng rất giản dị: Nhiệm vụ có chạy xong không, lỗi có tự sửa được không, code có qua được vòng review không, và giá cả có đủ rẻ để dùng thường nhật hay không.

K3 gần đây nhận được rất nhiều sự quan tâm bàn luận sôi nổi, và cũng có không ít lời chê bai. Lời khuyên của mình là: Đừng vội hùa theo khen ngợi, cũng đừng vội a dua chê bai, tốt nhất hãy tự đem dự án thực tế của chính bạn ra chạy thử, dùng thực tiễn và trải nghiệm cá nhân để đưa ra đánh giá chính xác nhất về một mô hình.
