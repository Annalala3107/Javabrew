---
title: "Thực chiến đa kịch bản IDEA + Qoder Plugin: Tối ưu hóa API và tái cấu trúc mã nguồn"
description: "Thông qua hai ca thực chiến thực tế, trình diễn hiệu quả của IDEA kết hợp Qoder plugin trong tối ưu hóa phân trang sâu (deep pagination), tái cấu trúc mã nguồn kế thừa (legacy code), và chia sẻ sự chuyển dịch phong cách làm việc từ người thực thi sang người chỉ huy."
category: Thực chiến AI Coding
head:
  - - meta
    - name: keywords
      content: Qoder,IDEA plugin,AI coding,lập trình với AI,tái cấu trúc mã nguồn,tối ưu phân trang sâu,JetBrains,smart coding
lang: vi
sourceRef: zh-ref/ai-coding/cases/idea-qoder-plugin.md
---

Xin chào mọi người, mình là Tiểu G. Nếu bạn là một người dùng trung thành của JetBrains IDE, khả năng cao bạn đã từng trải qua nỗi băn khoăn này: muốn dùng AI hỗ trợ lập trình, nhưng các công cụ chính thống—Cursor, Trae, Qoder—hầu hết đều dựa trên nền tảng VS Code. Chuyển hẳn qua? Tiếc nuối trải nghiệm debug và refactor mạnh mẽ của JetBrains. Không chuyển? Lại có cảm giác mình đang bỏ lỡ làn sóng nâng cao năng suất của AI.

Có bạn sẽ bảo: Những công cụ dòng lệnh như Claude Code, Gemini CLI chẳng phải rất tiện sao? Quả thực rất tiện, nhưng nói thật lòng, chế độ CLI cũng có điểm yếu rõ rệt: không có giao diện UI trực quan nguyên bản, việc đọc code hay soi diff đều không đủ trực tiếp. Dù có thể dùng một số dự án mã nguồn mở (như vibe kanban, 1Code) để giảm bớt, nhưng khi làm các dự án phức tạp, nó vẫn tồn tại những hạn chế nhất định.

Các lập trình viên backend hiện nay đại khái chia thành 4 trường phái:

| Trường phái | Tổ hợp công cụ | Đặc điểm |
| --- | --- | --- |
| **Phái CLI** | Claude Code/Gemini CLI/Codex | Thao tác terminal, hiệu suất cao nhưng tương tác UI yếu |
| **Phái VS Code** | VS Code + Plugin | Nhẹ nhàng, linh hoạt, chức năng bị giới hạn |
| **Phái kết hợp** | Viết bằng CLI/AI IDE (như Cursor) → Nghiệm thu bằng JetBrains | AI hỗ trợ + IDEA bọc lót |
| **Phái tích hợp toàn diện** | **JetBrains + Qoder Plugin** | **Tập trung dòng chảy tư duy (flow state), xử lý tất cả trong một cửa sổ** |

Hiện tại mình thuộc "Phái kết hợp": Claude Code cùng với IDEA + Qoder plugin là bộ đôi chủ lực.

Đối với nhiều dự án có logic nghiệp vụ phức tạp, cảm giác kiểm soát hoàn toàn mà IDEA đem lại giúp lập trình viên yên tâm hơn rất nhiều.

Trong bài viết này, mình sẽ thông qua 2 tình huống thực chiến thực tế để xem xét hiệu quả của IDEA kết hợp Qoder trong quy trình phát triển, đồng thời chia sẻ một số mẹo nhỏ thực dụng.

## Hướng dẫn nhập môn Qoder JetBrains Plugin

### Cài đặt và cấu hình

**Bước 1**: Nhấp vào **Settings \| Plugins**, tìm kiếm từ khóa **"qoder"**, chọn "Qoder - Agentic AI Coding Platform" và nhấn cài đặt.

![Giao diện cài đặt plugin](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/plugin-install-interface-b0a2e253.png)

**Bước 2**: Sau khi cài đặt hoàn tất, nhấp vào "Sign In" để đăng nhập hoặc đăng ký tài khoản.

![Giao diện đăng nhập](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/login-interface-10639ce9.png)

**Bước 3 (Tùy chọn)**: Giao diện mặc định là tiếng Anh. Nếu quen dùng tiếng Trung hoặc muốn đổi, bạn có thể nhấp vào Plugin Settings ở góc trên bên phải để thiết lập Display Language.

![Giao diện thiết lập ngôn ngữ](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/language-settings-interface-5a1e02aa.png)

**Bước 4 (Tùy chọn)**: Cấu hình kết nối cơ sở dữ liệu. Qoder hỗ trợ ngữ cảnh `@database`, cho phép tham chiếu trực tiếp cấu trúc bảng cơ sở dữ liệu. Bạn nên cấu hình sẵn cơ sở dữ liệu liên quan đến dự án.

Lấy MySQL làm ví dụ, mở cửa sổ công cụ Database ở thanh bên phải, nhấp vào biểu tượng dấu **+**, chọn **Data Source \| MySQL**:

![Thêm nguồn dữ liệu](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/add-data-source-ecfb4efa.png)

Điền thông tin kết nối, kiểm tra Test Connection thành công rồi nhấn OK.

![Cấu hình database hoàn tất](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/database-config-complete-e38cddf5.png)

Đến đây, công tác chuẩn bị ban đầu đã hoàn tất.

### Nhiệm vụ 1: Truy vấn đơn hàng liên tục báo lỗi? Dùng Qoder hỗ trợ điều tra phân trang sâu (Deep Pagination)

#### Bối cảnh nghiệp vụ

Đây là hệ thống quản trị backend của một sàn thương mại điện tử, bộ phận vận hành mỗi tháng cần kết xuất báo cáo phân tích kinh doanh. Do khối lượng dữ liệu tương đối lớn (bảng đơn hàng hơn 10 triệu bản ghi), cộng với thời gian phát triển gấp gáp, mã nguồn tồn tại nhiều rủi ro tiềm ẩn về hiệu năng.

Bên vận hành phản ánh việc truy vấn đơn hàng liên tục báo lỗi timeout, khoanh vùng được API:

```bash
curl -X POST http://localhost:8080/api/report/orders \
  -H "Content-Type: application/json" \
  -d '{"page": 1000000, "size": 10}'
```

Đây là một request phân trang sâu (deep pagination) điển hình. Logic code của API như sau:

```java
@Transactional(readOnly = true)
public OrderListResponse getOrderList(OrderListRequest request) {
    int pageNum = request.getPage() == null ? 1 : request.getPage();
    int pageSize = request.getSize() == null ? 10 : request.getSize();

    // Cốt lõi vấn đề: truy vấn phân trang sâu (deep pagination)
    Page<Order> pageParam = new Page<>(pageNum, pageSize);

    LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
    if (request.getStatus() != null && !request.getStatus().isEmpty()) {
        wrapper.eq(Order::getStatus, request.getStatus());
    }
    if (request.getShopId() != null) {
        wrapper.eq(Order::getShopId, request.getShopId());
    }

    // Trường sắp xếp có thể không có index, kích hoạt full table scan
    wrapper.orderByDesc(Order::getCreatedAt);

    // Phân trang sâu: LIMIT 9999990, 10
    IPage<Order> orderPage = orderMapper.selectPage(pageParam, wrapper);

    // Truy vấn liên kết thông tin user, store...
}
```

Khi `page=1000000`, MySQL phải thực thi lệnh `LIMIT 9999990, 10`, bắt buộc phải quét qua 10 triệu dòng đầu tiên rồi bỏ đi, khiến hiệu năng sụt giảm nghiêm trọng.

#### Thế tiến thoái lưỡng nan của phương thức truyền thống

Theo quy trình truyền thống, việc tối ưu hóa API đòi hỏi:

1. Đọc và bóc tách lại logic mã nguồn
2. Phân tích các điểm nghẽn có thể tối ưu
3. Kết hợp log hệ thống để phân tích Execution Plan (kế hoạch thực thi) của câu lệnh SQL
4. Đưa ra giải pháp kỹ thuật và tiến hành triển khai
5. Kiểm thử hồi quy (regression test) và đưa lên môi trường production

Nếu rà soát tuần tự từ code, SQL execution plan cho đến regression và deploy, dạng sự cố này hiếm khi chỉ sửa một dòng SQL là xong. Thời gian xử lý phụ thuộc vào mức độ hiểu dự án, quy mô dữ liệu và yêu cầu kiểm thử xác thực.

#### Lời giải từ Qoder: Chuyển từ người thực thi sang người chỉ huy

Khi có Qoder trợ lực, mình dành nhiều thời gian hơn vào việc bóc tách nhiệm vụ, đánh giá phản biện phương án và nghiệm thu kết quả.

Chỉ cần sắp xếp lại mạch tư duy và đưa ra mục tiêu rõ ràng:

```bash
Đối với lỗi timeout "java.net.SocketTimeoutException: Read timed out" xuất hiện ở API truy vấn danh sách đơn hàng, hãy phân tích logic mã nguồn của API và tầng cơ sở dữ liệu, sau đó cung cấp giải pháp.

Thông tin API: POST http://localhost:8080/api/report/orders
Tham số request: {"page": 1000000, "size": 10}

Vui lòng đưa ra giải pháp từ các khía cạnh sau:
1. Phân tích các yếu tố trong logic code của API có thể dẫn đến timeout
2. Kiểm tra các vấn đề ở tầng cơ sở dữ liệu (index, hiệu năng truy vấn, khối lượng dữ liệu)
3. Đề xuất các biện pháp tối ưu hóa cụ thể
```

Để Qoder hoàn thành nhiệm vụ tốt hơn, hãy bổ sung ngữ cảnh cơ sở dữ liệu:

1. Nhấp vào nút **+Add Context**
2. Chọn **@database**, chọn Schema cơ sở dữ liệu tương ứng

![Thêm ngữ cảnh database](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/add-database-context-1-8556dd7c.png)

#### Phân tích vấn đề và xuất phương án

**Khoanh vùng điểm vào của code và các nguyên nhân khả dĩ**

Qoder nhanh chóng định vị được entry point của mã nguồn, đồng thời liệt kê các nguyên nhân tiềm tàng như phân trang sâu, thiếu index cho trường sắp xếp. Kết luận ở đây vẫn cần đối chiếu kiểm chứng với Slow Query Log và `EXPLAIN ANALYZE`:

![Kết quả phân tích code](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/code-analysis-result-ddf06889.png)

**Điểm sáng độc đáo: Chẩn đoán kết hợp giữa mã nguồn và cơ sở dữ liệu**

Kết hợp với Database Schema, Qoder đã đưa ra một báo cáo phân tích toàn diện. Khả năng `@database` hiện tại của Qoder rất thích hợp để bổ sung cấu trúc bảng và thông tin chỉ mục, nhưng nó không thể thay thế cho execution plan trên môi trường thực tế và phân bố dữ liệu thực:

![Báo cáo phân tích tổng hợp](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/comprehensive-analysis-report-9fbdaae0.png)

**Tối ưu hóa ở tầng mã nguồn**

Qoder đưa ra 3 bộ giải pháp, bao gồm cả chiến lược truy vấn liên kết trễ (deferred join - subquery chỉ trả về ID, tận dụng Covering Index để định vị cực nhanh):

![Phương án tối ưu hóa code](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/code-optimization-solution-8552af32.png)

**Phương án đáng chú ý**

Về việc đếm tổng số bản ghi trong phân trang, Qoder còn đề xuất một giải pháp ước tính: ước tính tổng lượng dữ liệu thông qua số lượng trang chỉ mục khóa chính và số dòng trung bình trên mỗi trang. Phương án này chỉ phù hợp với nghiệp vụ chấp nhận kết quả xấp xỉ; sai số sẽ bị ảnh hưởng bởi khoảng trống dữ liệu (holes), tỷ lệ lấp đầy trang (page fill factor) và phân bố dữ liệu; các nghiệp vụ đối soát kế toán, tài chính đòi hỏi con số chính xác tuyệt đối thì không thể áp dụng trực tiếp:

![Gợi ý tối ưu hóa database](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/database-optimization-suggestion-8d91ce2f.png)

#### Triển khai phương án và nghiệm thu

Sau khi rà soát và đánh giá, phương án Deferred Join + tối ưu hóa Index được lựa chọn:

```bash
Dựa trên kết quả rà soát và đánh giá, hãy thực hiện các tối ưu sau:
1. Triển khai chiến lược deferred join query, tái cấu trúc logic truy vấn phân trang sâu
2. Tạo cấu trúc index tối ưu theo các đề xuất index
3. Viết unit test bao phủ các điểm chức năng cốt lõi và thiết lập performance baseline
```

Sau khi Qoder hoàn thành triển khai, phương thức `getOrderList` được cải tiến:

- Kết hợp với rủi ro sự cố production, bổ sung cấu hình giới hạn số trang tối đa và ràng buộc logic
- Hoàn thành thống kê phân trang và truy vấn danh sách theo các chiến lược khác nhau

Quan sát từ ảnh chụp màn hình, cách đặt tên và chia tách hàm sau khi refactor đã gọn gàng, chuẩn mực hơn nhiều. Việc có đáp ứng trọn vẹn quy chuẩn của team hay không vẫn cần thông qua công cụ kiểm tra tĩnh (static analysis) và Code Review của chính dự án để xác nhận:

![Code sau khi tái cấu trúc](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/refactored-code-5dcf4955.png)

Script tạo index có thể thực thi trực tiếp ngay trong IDE, toàn bộ quy trình không cần chuyển đổi qua lại giữa các cửa sổ:

![Thực thi index](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/index-execution-0961d885.png)

**Kiểm thử hồi quy (Regression Test)**: Qoder hoàn thành việc bóc tách các nhánh rẽ của code và sinh ra Unit Test cho từng tình huống khác nhau:

![Unit test](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/unit-test-1-bac4cc5d.png)

**Khâu kiểm thử áp lực (Stress Test)**: Qoder đã sinh mã stress test và bổ sung cơ chế JIT warmup. Cần lưu ý rằng warmup chỉ giúp giảm bớt sự can thiệp từ cold start và quá trình biên dịch JIT đối với kết quả đo lường, không đồng nghĩa với việc bài test đã sát với môi trường production thực tế. Để xác định việc tối ưu có thực sự hiệu quả hay không, vẫn cần ghi nhận đầy đủ cấu hình phần cứng, phiên bản JDK cùng cấu hình GC, phân bố dữ liệu, trạng thái cache, mô hình đồng thời (concurrency model), quy mô mẫu kiểm thử cũng như độ trễ ở mức p95/p99:

![Kiểm thử áp lực](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/stress-test-924dd692.png)

Cuối cùng, Qoder xuất ra một bản tổng kết công việc chi tiết, bao gồm giải pháp kỹ thuật và các đề xuất báo cáo trao đổi:

![Tổng kết công việc](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/work-summary-31c6da91.png)

Tại cửa sổ commit code, nhấn vào biểu tượng Qoder có thể tự động sinh Commit Message dựa trên Diff hiện tại. Trong bài trình diễn này, từ lúc cung cấp ngữ cảnh đến khi sinh ra các thay đổi đề xuất mất khoảng 10 phút; việc kiểm tra lại execution plan, stress test, Code Review và xác thực trên môi trường online không tính trong khoảng thời gian này.

![Nội dung commit](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/commit-message-1fe907a5.png)

### Nhiệm vụ 2: Bóc tách và tái cấu trúc đoạn mã hoàn tiền kế thừa (Legacy Code)

#### Bối cảnh: Một khối "mã nguồn tổ truyền" không ai dám đụng vào

Phương thức `applyRefund` trong module hoàn tiền có hơn **150 dòng code, không một dòng comment, magic value tràn lan, logic trùng lặp dư thừa**. Đúng lúc này nghiệp vụ mới xuất hiện: thêm quy tắc kiểm soát rủi ro (risk control)—**người dùng có đơn hàng chưa hoàn thành trong vòng 72 giờ sẽ bị cấm gửi yêu cầu hoàn tiền**.

**Thế tiến thoái lưỡng nan của cách làm truyền thống**:

- Logic code rối rắm, không ai dám tùy tiện đụng vào
- Thêm quy tắc mới bắt buộc phải kiểm thử hồi quy toàn bộ
- Nếu phải viết bổ sung characterization test, refactor và regression test thì khối lượng công việc phải tính toán rất kỹ theo thực tế dự án

#### Bóc tách logic: Để Agent đọc hiểu khối mã nguồn kế thừa thay bạn

Nhờ vào khả năng suy luận ngữ cảnh của mô hình nền tảng cùng năng lực lập kế hoạch và thực thi nhiệm vụ của Agent trong Qoder, ta có thể giao cho nó việc đọc hiểu và tái cấu trúc nghiệp vụ:

```bash
Vui lòng kết hợp một luồng dữ liệu đơn giản, giới thiệu chi tiết toàn bộ quy trình nghiệp vụ yêu cầu hoàn tiền, và bổ sung các comment tương ứng vào trong mã nguồn.
```

Nhằm giảm bớt việc Agent phải suy đoán cấu trúc bảng, hãy cung cấp Schema hiện có làm ngữ cảnh cho Qoder. Cần nhớ rằng Schema chỉ bổ sung cấu trúc cơ sở dữ liệu, không đảm bảo rằng Agent chắc chắn sẽ hiểu đúng 100% quy tắc nghiệp vụ:

![Thêm ngữ cảnh database](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/add-database-context-2-cda4d3e6.png)

Sau khi nhận lệnh, Qoder bắt đầu thực thi bằng cách đưa ra cái nhìn tổng quan, rồi tuần tự phân tích và chú thích từng nhánh rẽ:

![Quy trình phân tích logic](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/logic-analysis-process-c1cdf270.png)

Mã nguồn sau khi được bổ sung comment trở nên dễ đọc hơn rất nhiều, tuy nhiên các comment và luồng dữ liệu vẫn cần được đối chiếu cẩn thận với mã nguồn gốc, test case và quy tắc sản phẩm:

![Ví dụ code có comment](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/commented-code-example-a82e5f85.png)

Kết thúc nhiệm vụ, Qoder đã tóm tắt rành mạch logic của API và các điểm lưu ý đặc thù về quy tắc:

![Tóm tắt tổng kết](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/summary-conclusion-8048fc78.png)

#### Tái cấu trúc mã nguồn: Thiết lập baseline kiểm thử hồi quy trước tiên

Sau khi nắm rõ logic, ta ban hành chỉ thị thứ hai để tiến hành tái cấu trúc chức năng và thiết lập kiểm thử hồi quy:

```bash
Hãy tuân thủ quy chuẩn lập trình của nhóm và tham khảo các phương pháp tái cấu trúc trong cuốn "Refactoring: Improving the Design of Existing Code" để tái cấu trúc có hệ thống module chức năng yêu cầu hoàn tiền. Trước khi refactor, hãy viết bổ sung characterization tests cho các hành vi hiện tại; sau khi refactor, thực thi unit tests, integration tests và các bài test chức năng then chốt bao phủ toàn bộ nhánh rẽ nghiệp vụ và điều kiện biên đã xác định. Xuất ra danh sách các nhánh chưa được bao phủ và những hành vi cần con người xác nhận thủ công; tuyệt đối không dùng tỷ lệ bao phủ (coverage) để thay thế cho việc xác thực tính tương đương giữa bản cài đặt cũ và mới.
```

Trong quá trình này, Qoder tuần tự thực hiện:

1. Đọc file mục tiêu: Định vị đoạn mã cần tái cấu trúc
2. Phân tích vấn đề trong code: Chỉ ra các magic value, code trùng lặp, phương thức quá dài
3. Tái cấu trúc hệ thống: Tuần tự tạo hằng số, trích xuất code trùng lặp, thiết kế domain model và phân tách trách nhiệm
4. Viết code test để hoàn thành kiểm thử hồi quy logic

Đoạn mã cuối cùng được sinh ra như bên dưới. Qoder không chỉnh sửa trực tiếp vào lớp `RefundService` ban đầu mà tạo ra lớp mới `RefundServiceRefactored`. Điều này tạo không gian an toàn để so sánh đối chiếu giữa giải pháp cũ và mới, tuy nhiên việc tạo một class mới tự thân nó chưa đồng nghĩa với việc "refactor an toàn": Bạn vẫn cần xác định rõ cơ chế định tuyến (routing), canary release hoặc feature flag, sử dụng cùng một bộ dữ liệu đầu vào để so sánh kết quả giữa cũ và mới, đồng thời ấn định thời hạn ngừng hoạt động của code cũ, nếu không hai luồng logic rất dễ bị phân kỳ (drift) trong thời gian dài.

```java
/**
 * Yêu cầu hoàn tiền (sau tái cấu trúc)
 */
@Transactional(rollbackFor = Exception.class)
public RefundResponse applyRefund(RefundApplyRequest request) {
    log.info("[Refund Application] Bắt đầu xử lý: orderId={}, userId={}, amount={}",
            request.getOrderId(), request.getUserId(), request.getRefundAmount());

    // 1. Truy vấn và xác thực order
    Order order = getAndValidateOrder(request.getOrderId(), request.getUserId());

    // 2. Xác định loại hoàn tiền và xử lý
    if (request.getOrderItemId() != null) {
        return processPartialRefund(request, order);   // Hoàn tiền một phần
    } else {
        return processFullRefund(request, order);      // Hoàn tiền toàn bộ
    }
}

/**
 * Xử lý hoàn tiền một phần
 */
private RefundResponse processPartialRefund(RefundApplyRequest request, Order order) {
    log.info("[Refund Application] Xử lý hoàn tiền một phần: orderItemId={}", request.getOrderItemId());

    // Truy vấn và xác thực chi tiết order item
    OrderItem orderItem = orderItemMapper.selectById(request.getOrderItemId());
    refundValidator.validateOrderItemBelongsToOrder(orderItem, order.getId());

    // Xác thực số lượng và số tiền hoàn
    Integer refundQuantity = getRefundQuantity(request.getQuantity());
    refundValidator.validateRefundQuantity(refundQuantity, orderItem.getRefundableQuantity());
    BigDecimal itemRefundableAmount = refundCalculator.calculateItemRefundableAmount(orderItem, refundQuantity);
    refundValidator.validateRefundAmount(request.getRefundAmount(), itemRefundableAmount);

    // Thực hiện kiểm tra rủi ro (risk check) + tạo bản ghi hoàn tiền
    performRiskCheck(order, request.getRefundAmount(), request.getUserId());
    Refund refund = createRefundRecord(request, order, refundQuantity);

    log.info("[Refund Application] Hoàn tiền một phần thành công: refundId={}", refund.getId());
    return RefundResponse.success(refund.getId());
}
```

**Những điểm sáng sau khi tái cấu trúc**:

| Điểm sáng | Giải thích |
| --- | --- |
| **Chia nhỏ phương thức** | Hàm chính chỉ còn 15 dòng, tách biệt rạch ròi logic hoàn tiền một phần / hoàn tiền toàn bộ |
| **Phân tách trách nhiệm (SoC)** | `refundValidator`, `refundCalculator` đứng độc lập để xử lý việc xác thực và tính toán |
| **Comment rõ ràng** | Mỗi bước đều có phần diễn giải tương ứng |
| **Chuẩn hóa ghi log** | Dùng ký hiệu `[...]` để đánh dấu các mốc quan trọng, thuận tiện cho việc truy vết |
| **Xử lý Exception** | Cấu hình chiến lược rollback transaction cho Checked Exception |

Báo cáo unit test ở đây cho thấy độ bao phủ nhánh rẽ (branch coverage) đạt khoảng 80%. Con số này chứng minh một số luồng thực thi đã được chạy qua, nhưng không chứng minh được hành vi trước và sau khi tái cấu trúc hoàn toàn đồng nhất. Các luồng trọng yếu như biến động số tiền, chuyển đổi trạng thái (state transition), request đồng thời và lỗi từ dịch vụ bên ngoài vẫn cần đến characterization test, integration test hoặc đối soát song song kết quả cũ-mới:

![Nghiệm thu unit test](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/unit-test-verification-463ad5cd.png)

#### Lặp nhanh tính năng: Một dòng lệnh, đưa quy tắc vào hoạt động

Sau khi hoàn tất việc chỉnh đốn cấu trúc và thiết lập baseline kiểm thử hồi quy, ta có thể định vị đến logic kiểm soát rủi ro `validateRiskMaxAmount` và ban hành chỉ thị cuối cùng cho Qoder:

```bash
Thêm một quy tắc giới hạn hoàn tiền mới trong hệ thống kiểm soát rủi ro: Khi người dùng có bất kỳ đơn hàng nào ở trạng thái chưa hoàn thành trong vòng 72 giờ qua (3 ngày), hệ thống phải tự động từ chối yêu cầu hoàn tiền do người dùng đó gửi lên.
```

Đoạn code hiện thực tương ứng như hình bên dưới. Có thể thấy, sau khi bóc tách rõ ràng logic hiện hữu, khung xác thực đơn trách nhiệm (Single Responsibility) cùng các bài unit test đi kèm đã sẵn sàng, các vòng lặp tính năng gia tăng về sau trở nên cực kỳ thuận lợi trong cả việc viết tiếp lẫn kiểm thử hồi quy:

![Triển khai lặp tính năng](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/feature-iteration-implementation-6b76516e.png)

#### Tích lũy bộ nhớ (Memory): Càng dùng càng hiểu thói quen lập trình của bạn

Sau khi hoàn thành nhiệm vụ, Qoder đã hình thành bộ nhớ dành riêng cho dự án này. Memory là tính năng chính thức hiện có, nhưng việc nó có phát huy tác dụng ở các tác vụ tiếp theo hay không vẫn phụ thuộc vào việc các ghi nhớ có được lưu trữ, truy hồi (recall) chính xác và có bị xung đột với thực trạng dự án hay không:

- **Ghi nhớ đặc thù dự án**: Truy vấn liên kết trễ (deferred join) ưu việt hơn phân trang bằng con trỏ (cursor pagination); việc tối ưu API phải đi kèm performance test
- **Ghi nhớ chuẩn lập trình**: Tuân thủ cuốn "Cẩm nang phát triển Java của Alibaba", so sánh `BigDecimal` bắt buộc dùng `compareTo`
- **Ghi nhớ quy tắc nghiệp vụ**: Quy tắc rủi ro hoàn tiền (chặn người dùng có đơn hàng chưa hoàn thành trong 72 giờ, trần số tiền của một giao dịch, v.v.)

Trong lần minh họa này, quy tắc hoàn tiền và các quy ước code đã được ghi vào danh sách bộ nhớ. Khi sử dụng sau này, lập trình viên vẫn cần rà soát lại các nội dung được truy hồi để kịp thời loại bỏ những quy tắc đã lỗi thời:

![Tích lũy bộ nhớ](/media/jg/ext/oss.javaguide.cn/coding/qoder/idea-plugin/memory-accumulation-efa8edb5.png)

## Mổ xẻ năng lực: Qoder đã làm được những gì trong ví dụ này?

Thông qua hai ca thực chiến phía trên, hãy cùng bóc tách xem Qoder đã phát huy vai trò gì trong workflow phát triển phần mềm thực tế.

### 1. Nhận thức công trình và thấu hiểu ngữ cảnh

Năng lực nắm bắt các dự án kỹ thuật quy mô lớn của Qoder:

- **Nhận thức Database Schema**: Trong Nhiệm vụ 1, Qoder kết hợp ngữ cảnh `@database` để phân tích cấu trúc bảng đơn hàng cùng các index hiện có, từ đó đưa ra phương án index đề xuất. Việc có áp dụng hay không vẫn phải dựa vào câu lệnh SQL hoàn chỉnh, độ chọn lọc (selectivity) và execution plan thực tế.

- **Truy nguyên logic mã nguồn**: Trong Nhiệm vụ 2, đối mặt với khối mã hoàn tiền dài dòng không có comment, Qoder đã thông qua phân tích tĩnh (static analysis) để phác thảo toàn bộ quy trình nghiệp vụ: Xác thực đơn hàng → Tính toán số tiền → Kiểm tra rủi ro → Lưu trữ dữ liệu, đồng thời chỉ ra các code smell như code trùng lặp, magic value.

- **Liên kết xuyên file (Cross-file correlation)**: Qoder có khả năng tự động nhận biết các file liên quan cần thiết cho tác vụ, chẳng hạn từ `RefundService` tự động lần theo các component phụ thuộc như `OrderMapper`, `RefundValidator`, mà không cần người dùng phải bấm thêm ngữ cảnh thủ công.

### 2. Năng lực thực thi tác vụ đầu-cuối (End-to-End)

Qoder không chỉ làm nhiệm vụ gợi ý code (code completion), mà trong ví dụ này nó còn tham gia sâu vào việc phân tích, chỉnh sửa và sinh kiểm thử:

| Chiều không gian năng lực | Biểu hiện quan sát được trong bài | Phần việc bắt buộc con người phải xác thực |
| --- | --- | --- |
| **Nhận thức công trình** | Phân tích Database Schema, quan hệ phụ thuộc mã nguồn | SQL Execution Plan, phân bố dữ liệu và quy tắc nghiệp vụ |
| **Thực thi tác vụ** | Tham gia phân tích, thiết kế, viết code và sinh kiểm thử | Tính hiệu lực của bài test, Code Review và xác thực trên production |
| **Hỗ trợ tái cấu trúc** | Giữ nguyên bản cài đặt cũ và sinh ra bản cài đặt mới | Chuyển đổi routing, đối chiếu hành vi cũ-mới và ngừng sử dụng code cũ |
| **Ghi nhớ dự án** | Lưu lại quy chuẩn dự án và một số quy tắc nghiệp vụ | Bộ nhớ truy hồi có chuẩn xác hay không, nội dung còn hiệu lực không |

### 3. Tái cấu trúc tiệm tiến và lặp gia tăng

Nhiệm vụ 2 đã giữ nguyên bản cũ và sinh ra bản mới, có thể lấy đó làm điểm khởi đầu cho việc di chuyển tiệm tiến (progressive migration).

- **Tái cấu trúc gia tăng**: Qoder không chỉnh sửa đè trực tiếp lên `RefundService` cũ mà tạo lớp `RefundServiceRefactored` mới. Cách làm này chỉ thực sự có giá trị khi đi kèm một kế hoạch di chuyển rõ ràng:

  - Giữ lại bản cài đặt cũ để đối chiếu hành vi
  - Sử dụng feature flag hoặc canary routing để chuyển đổi từ từ
  - Sau khi xác thực an toàn tuyệt đối thì mới xóa bỏ bản cũ, tránh để hai luồng logic tồn tại song song quá lâu

- **Phân tách trách nhiệm (Separation of Concerns)**: Qoder tuân theo nguyên lý đơn trách nhiệm (Single Responsibility Principle - SRP), tách các logic vốn dĩ bị trộn lẫn gồm kiểm tra tính hợp lệ, tính toán số tiền, sinh mã đơn hàng thành các component độc lập:

  - `RefundValidator`: Xác thực nghiệp vụ tập trung
  - `RefundCalculator`: Logic tính toán số tiền
  - `RefundNoGenerator`: Sinh mã yêu cầu hoàn tiền

- **Ranh giới Transaction**: Khai báo `rollbackFor = Exception.class` chỉ có hiệu lực khi phương thức được gọi qua Spring Proxy, ngoại lệ tiếp tục được ném ra và tài nguyên cùng tham gia trong một transaction chung. Trường hợp tự gọi nội bộ (self-invocation), bắt ngoại lệ rồi nuốt lỗi (swallow exception), hoặc thao tác xuyên dịch vụ, đều cần có cách xử lý riêng biệt.

### 4. Nhận thức bộ nhớ và học hỏi liên tục

Những ghi nhớ này có thể được triệu hồi lại trong các phiên tương tác kế tiếp. Khi đụng đến quy tắc nghiệp vụ, khuyến nghị là nên đặt các quy tắc chính thức trong tài liệu dự án có thể review và quản lý phiên bản được; Memory chỉ nên đóng vai trò là ngữ cảnh bổ trợ.

## Tổng kết

Qoder JetBrains plugin mang lại cho các lập trình viên backend một phương thức làm việc mới: **Vừa duy trì thói quen sử dụng JetBrains IDE quen thuộc, vừa tận dụng triệt để năng lực suy luận phân tích và hiện thực hóa mã nguồn của AI Agent**.

Nhìn lại hai ca thực tế này:

| Chiều hướng | Phần việc Qoder có thể hỗ trợ | Khâu kỹ thuật tuyệt đối không thể lược bỏ |
| --- | --- | --- |
| **Phân tích** | Tìm kiếm code, liên kết Database Schema | Đối chiếu Log, Execution Plan và quy tắc nghiệp vụ |
| **Chỉnh sửa** | Sinh mã nguồn ứng viên và bài test | Code Review, đối chiếu hành vi giữa cũ và mới |
| **Trải nghiệm** | Hoàn thành phần lớn tương tác ngay trong lòng IDEA | Stress test trên môi trường thực, canary rollout và giám sát online |
| **Lắng đọng** | Lưu trữ một phần bộ nhớ dự án | Quản lý phiên bản quy tắc và dọn dẹp nội dung hết hạn |

## Đôi điều gửi gắm

Bối cảnh công nghệ hiện nay rất giống với việc xây dựng một tòa cao ốc. AI và các framework mới giúp bạn dựng giàn giáo với tốc độ chóng mặt, và các plugin như Qoder giúp bạn hoàn thành mọi thứ ngay trong môi trường IDE quen thuộc mà không cần chuyển cửa sổ làm ngắt quãng mạch suy nghĩ. Nhưng nếu bạn thiếu hụt kiến thức nguyên lý nền tảng và tư duy thiết kế kiến trúc phần mềm, thì dù AI có giúp bạn dựng xong chức năng, bạn cũng chẳng thể nào làm chủ được chất lượng bàn giao của hệ thống.

Nhìn lại hai trường hợp trong bài:

- **Truy vấn liên kết trễ trong Nhiệm vụ 1**: Phải dựa trên sự hiểu biết sâu sắc về nguyên lý Index của cơ sở dữ liệu thì bạn mới đánh giá được phương án Qoder đưa ra có hợp lý hay không.

- **Tái cấu trúc mã nguồn trong Nhiệm vụ 2**: Phải quen thuộc với các nguyên lý SRP, DRY trong cuốn "Refactoring" và "Cẩm nang phát triển Java của Alibaba" thì bạn mới thẩm định chuẩn xác chất lượng code tái cấu trúc của Qoder.

- **JIT Warmup trong Benchmark hiệu năng**: Chỉ giải quyết được một phần yếu tố gây nhiễu trong đo lường; nếu không hiểu về JVM, mô hình dữ liệu và tải, kết quả kiểm thử vẫn hoàn toàn có thể bị sai lệch.

- **Lựa chọn phương án và đánh đổi (Trade-off)**: Nắm bắt ranh giới kỹ thuật và bối cảnh nghiệp vụ. Ví dụ việc chọn deferred join thay vì phân trang bằng cursor là vì cursor sẽ làm ảnh hưởng tới trải nghiệm người dùng—sự phán đoán này, AI không thể làm thay bạn.

Khi sử dụng Qoder để xử lý những tác vụ này, mình có 3 lời khuyên:

1. **Kiên trì đào sâu các nguyên lý nền tảng**: Database Index, JVM Memory Model, nguyên lý lập trình đa luồng (Concurrency)—những kiến thức "móng nhà" này sẽ không bao giờ mất giá vì sự xuất hiện của AI.

2. **Đọc các cuốn sách kinh điển**: *Refactoring*, *Design Patterns*, *High Performance MySQL*, *Hiểu sâu về máy ảo Java (JVM)*—những cuốn sách kinh điển này giúp bạn thiết lập "thước đo" chuẩn mực để đánh giá chất lượng đầu ra của AI.

3. **Rèn luyện tư duy kiến trúc**: Dành phần thời gian tiết kiệm được để suy ngẫm về kiến trúc hệ thống và bản chất cốt lõi của bài toán nghiệp vụ.

Nếu công cụ tác nghiệp hàng ngày của bạn chủ yếu là JetBrains IDE, bạn hoàn toàn có thể xem Qoder plugin là một phương án dự phòng chất lượng. Nó giúp giảm thiểu việc phải nhảy qua lại giữa các editor, nhưng chất lượng bàn giao cuối cùng vẫn luôn nằm ở các khâu: kế hoạch thực thi, kiểm thử, review và xác thực trên môi trường thực tế.
