---
title: "Thực chiến Tích hợp Claude Code với Model Bên thứ ba: Chẩn đoán Thông minh JVM và Tối ưu Slow Query"
description: "Kết nối model GLM-5.1 thông qua Claude Code để hoàn thành hai nhiệm vụ thực tế: xây dựng trợ lý chẩn đoán thông minh JVM từ con số 0 và tối ưu hóa truy vấn chậm (slow query) trên tập dữ liệu hàng triệu bản ghi, chia sẻ phương pháp lập trình AI và bài học thực tế."
category: Thực chiến AI Coding
head:
  - - meta
    - name: keywords
      content: Claude Code,AI Coding,GLM-5.1,Chẩn đoán JVM,Tối ưu slow query,Phát triển hỗ trợ bởi AI,Arthas,Agent,Spring AI
lang: vi
sourceRef: zh-ref/ai-coding/cases/cc-glm5.1.md
---

Chào mọi người, mình là Tiểu G. Trước đây mình đã chia sẻ bài [Thực chiến kết hợp IDEA với plugin Qoder](./idea-qoder-plugin.md) và [Thực chiến kết nối Trae với các mô hình lớn](./trae-m2.7.md), lần lượt bao quát môi trường lập trình hỗ trợ bởi AI trong hệ sinh thái JetBrains và VS Code. Bài viết này đổi sang một góc nhìn khác, cùng bàn về trải nghiệm thực tế khi **kết nối Claude Code với model của bên thứ ba**.

Bản thân Claude Code là công cụ lập trình CLI chính thức của Anthropic. Một số nhà cung cấp dịch vụ thông qua interface tương thích với Anthropic và các biến môi trường để cung cấp khả năng tích hợp model bên thứ ba, tuy nhiên mức độ tương thích, các tính năng khả dụng và cách thức xử lý dữ liệu do từng nhà cung cấp quyết định, không thể mặc định là hoàn toàn tương đồng với model của Claude. Bài viết này ghi lại quá trình trải nghiệm thực tế với GLM-5.1 tại thời điểm đó.

Hiện tại GLM-5.2 cũng đã ra mắt, và tương lai sẽ còn các model mới hơn nữa. Tuy nhiên, phương pháp tích hợp và quy trình thực chiến lập trình về cơ bản là nhất quán, không bị ảnh hưởng bởi phiên bản model.

Mình đã chọn hai kịch bản phức tạp mang tính đại diện cao để kiểm chứng:

- **Kịch bản 1**: Xây dựng từ con số 0 một Agent chẩn đoán thông minh JVM dựa trên Arthas, bao quát toàn bộ quy trình từ chọn giải pháp kỹ thuật, thiết kế kiến trúc đến triển khai code hoàn chỉnh.
- **Kịch bản 2**: Định vị và tối ưu hóa slow query trong một hệ thống đơn hàng sẵn có với quy mô hàng triệu bản ghi, thử thách khả năng hiểu codebase hiện hữu và tối ưu hóa tiệm tiến của AI.

Một kịch bản là xây dựng dự án từ đầu (from scratch), kịch bản còn lại là xử lý hiệu năng trên hệ thống cũ sẵn có, vừa vặn bao quát hai chế độ làm việc điển hình của lập trình có AI hỗ trợ.

## Chuẩn bị Môi trường: Kết nối Claude Code với Model Bên thứ ba

Trước khi bắt đầu chính thức, chúng ta cần hoàn thành việc cấu hình cầu nối giữa Claude Code và model bên thứ ba. Toàn bộ quá trình chia làm ba bước:

**Bước 1**: Cài đặt Claude Code

```bash
npm i -g @anthropic-ai/claude-code@latest
```

**Bước 2**: Cài đặt cc-switch để chuyển đổi model thuận tiện (người dùng macOS có thể cài qua Homebrew, chi tiết tham khảo tài liệu chính thức của cc-switch: <https://github.com/farion1231/cc-switch/blob/main/README_ZH.md>)

**Bước 3**: Cấu hình quan hệ ánh xạ giữa các biến môi trường model nội bộ của Claude Code và model đích theo hướng dẫn của nhà cung cấp. Lấy GLM-5.1 làm ví dụ, tham khảo: <https://docs.bigmodel.cn/cn/coding-plan/tool/claude>

Ảnh chụp quá trình cấu hình như sau:

Bấm vào dấu cộng để thêm model:

![Bấm để thêm model](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/add-model-entry-f2d25853.png)

Chọn model tương ứng:

![Chọn model](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/select-model-f702b9b5.png)

Cấu hình các tham số:

![Cấu hình tham số](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/config-params-9cbb3b6a.png)

Cấu hình JSON ánh xạ biến môi trường nội bộ Claude Code với model đích:

![Cấu hình JSON ánh xạ biến môi trường model nội bộ Claude Code](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/model-env-json-config-dd263e83.png)

Nếu bạn ưa thích giao diện trực quan hơn, khuyến nghị sử dụng VSCode + plugin Claude Code for VS Code để tương tác và nghiệm thu code. Sau khi cài plugin, bạn có thể đối thoại và review code trực tiếp ngay trong IDE, trực quan hơn nhiều so với giao diện CLI:

![VSCode + Claude Code for VS Code](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/vscode-claude-code-2348c312.png)

## Kịch bản 1: Xây dựng Agent Chẩn đoán Thông minh JVM từ Đầu

### Vì sao cần Trợ lý Chẩn đoán Thông minh JVM?

Chẩn đoán sự cố JVM trên môi trường production xưa nay luôn là bài toán đau đầu nhất với các lập trình viên Java. Trong mô hình phát triển truyền thống, khi gặp nghẽn hiệu năng hoặc sự cố online, lộ trình tra cứu của kỹ sư gần như cố định:

1. Quan sát dashboard giám sát Grafana, sơ bộ khoanh vùng hướng bất thường.
2. Đăng nhập vào server online, kiểm tra các chỉ số CPU, bộ nhớ, GC...
3. Sau khi xác định vấn đề nằm ở tầng ứng dụng Java, khởi động Arthas và chạy một loạt lệnh chẩn đoán để thu hẹp phạm vi.
4. Định vị đến đoạn code cụ thể, phân tích nguyên nhân gốc rễ (root cause) và lập phương án khắc phục.

Trước khi AI xuất hiện, quy trình này tuy cồng kềnh nhưng là phương thức trực tiếp và hiệu quả nhất. Nhưng khi nghiệp vụ ngày càng phức tạp và yêu cầu về thời gian xử lý sự cố ngày càng gắt gao, nhược điểm của mô hình truyền thống bộc lộ rõ rệt:

- **Chỉ số giám sát quá chủ quan**: Đứng trước các sự cố muôn hình vạn trạng như CPU tăng vọt, rò rỉ bộ nhớ (Memory Leak), OOM..., các chỉ số trên dashboard quá nhiều, kỹ sư thường dựa vào kinh nghiệm phán đoán chủ quan, thiếu một phương pháp luận chẩn đoán có hệ thống.
- **Chuỗi chẩn đoán quá dài dòng**: Từ Grafana sang server rồi đến chẩn đoán Arthas, toàn bộ chuỗi xử lý liên quan đến việc chuyển đổi qua lại giữa nhiều công cụ, vừa tốn thời gian vừa kém hiệu quả khi cần xử lý cầm máu khẩn cấp cho sự cố online.
- **Phụ thuộc nặng vào kinh nghiệm của kỹ sư**: Arthas quả thực là công cụ chẩn đoán JVM cực kỳ mạnh mẽ, tích hợp sẵn nhiều lệnh can thiệp bytecode để soi vào chi tiết lúc runtime. Nhưng cái giá là lập trình viên phải nắm rất vững các tham số lệnh và lộ trình suy luận thì mới định vị chính xác vấn đề.

Khi năng lực của Agent và Skill dần hoàn thiện, mình đã nảy ra một ý tưởng kỹ thuật: chuẩn hóa kinh nghiệm chẩn đoán thành các bước có thể kiểm tra (audit), để AI dựa vào hiện tượng sự cố chọn quy trình chẩn đoán chỉ đọc (read-only), thu thập chứng cứ và đưa ra các nguyên nhân tiềm năng. Việc kết nối tới instance production, thực thi lệnh và xác nhận nguyên nhân gốc rễ vẫn đòi hỏi phân quyền rõ ràng cùng sự kiểm soát của con người, không thể chỉ vận hành thuần túy dựa trên "tên service + hiện tượng lỗi".

### Giao nhận Yêu cầu và Thiết kế Kiến trúc

Sau khi đã có ý tưởng, bước tiếp theo là chọn giải pháp kỹ thuật và lên phương án chi tiết. Mình gửi toàn bộ mô tả yêu cầu cho AI:

```bash
Nghiên cứu phát triển một công cụ Agent chẩn đoán thông minh dựa trên Arthas, công cụ cần thực hiện các chức năng cốt lõi sau:
1. Khi người dùng nhập tên service gặp sự cố online và hiện tượng lỗi cụ thể, hệ thống có thể tự động định vị tới server mục tiêu, chủ động giám sát thời gian thực và phân tích chuyên sâu service mục tiêu.
2. Thông qua việc tích hợp tính năng decompile của Arthas, định vị chính xác đoạn code cụ thể gây ra sự cố.
3. Dựa trên kết quả phân tích, tạo ra luồng xử lý hoàn chỉnh gồm nguyên nhân gốc rễ, đề xuất sửa code và các bước thực hiện.

Vui lòng cung cấp phương án chọn giải pháp kỹ thuật cho công cụ, bao gồm nhưng không giới hạn ở: ngôn ngữ phát triển (ưu tiên Java tech stack), framework cốt lõi, thiết kế bảng database, kiến trúc triển khai... đồng thời thiết kế phương án hiện thực hóa hệ thống chi tiết, bao quát phân chia module chức năng, luồng dữ liệu, các điểm khó kỹ thuật then chốt và giải pháp xử lý.
```

Nhận được yêu cầu, AI không vội vã viết code ngay mà từ một dự án trống đã tổng hợp thành một phương án kỹ thuật phân theo từng giai đoạn. Bản kế hoạch này rất thích hợp dùng làm tài liệu khởi đầu để review, nhưng tính an toàn và mức độ phù hợp với hệ thống vận hành sẵn có vẫn bắt buộc phải do đội ngũ dev và ops thẩm định.

![AI tự chủ hoàn thành lập kế hoạch phương án kỹ thuật](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/ai-tech-plan-fd042326.png)

Kết hợp với yêu cầu, AI đã bóc tách việc chọn giải pháp kỹ thuật cho Agent và phương án tích hợp Arthas để tra cứu. Từ các từ khóa tìm kiếm có thể thấy nó ưu tiên các giải pháp ổn định và trưởng thành:

![AI tra cứu giải pháp kỹ thuật cho Agent và tích hợp Arthas](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/agent-arthas-integration-research-c953cebc.png)

Sau khi tra cứu tài liệu chính thức của Arthas, AI đã xuất ra sơ đồ thiết kế kiến trúc hệ thống dưới đây. Từ trên xuống dưới gồm ba tầng: Tầng người dùng nhập tên service và hiện tượng sự cố; Tầng Agent do Skill engine, Arthas HTTP Client và AI analysis engine phối hợp hoạt động; Tầng dưới cùng kết nối tới các instance của service mục tiêu thông qua Arthas HTTP API. Sơ đồ này bao quát các module nghiệp vụ chính, nhưng chưa thể hiện control plane phục vụ production như xác thực, phê duyệt, chính sách lệnh và kiểm toán (audit), phần này sẽ được bổ sung riêng ở phần sau:

![Sơ đồ thiết kế kiến trúc hệ thống do AI xuất ra](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/system-architecture-design-5cf615f6.png)

Sau khi đưa ra sơ đồ kiến trúc, AI còn bóc tách sâu hơn trách nhiệm của 6 thành phần cốt lõi—từ điều phối quy trình của AI Agent Server, quản lý session của Arthas HTTP Client, định nghĩa chuỗi bước chẩn đoán của Skill engine, đến sinh báo cáo của AI analysis engine. Ranh giới và sự phối hợp giữa từng thành phần đều được làm rõ:

![Bảng phân công vai trò thành phần cốt lõi do AI xuất ra](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/core-component-roles-4487cf00.png)

Tiếp theo là thiết kế luồng dữ liệu (data flow). AI kết hợp với một kịch bản lỗi RT timeout phổ biến để đưa ra chuỗi xử lý từ so khớp Skill, thực thi bước chẩn đoán đến xuất báo cáo. Quy trình session áp dụng ở đây gồm `init_session → async_exec → pull_results → interrupt_job → close_session` hoàn toàn khớp với mô hình job bất đồng bộ của [Arthas HTTP API](https://arthas.aliyun.com/doc/http-api.html), có khả năng quản lý tốt các lệnh bất đồng bộ có output liên tục. Các lệnh như `watch`, `trace` sẽ can thiệp tăng cường bytecode của class mục tiêu, tuyệt đối không được coi là truy vấn chỉ đọc thông thường chỉ vì chúng "không sửa dữ liệu nghiệp vụ". Trọng tâm review không phải là "API này có bị AI bịa ra hay không", mà cần tiếp tục kiểm tra phân cấp lệnh, dọn dẹp session, timeout và kiểm soát an toàn:

![Thiết kế luồng dữ liệu do AI xuất ra](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/data-flow-design-84afdb46.png)

Arthas HTTP API có thể nhận trực tiếp các lệnh chẩn đoán, và tài liệu chính thức cũng cung cấp [Cấu hình xác thực (Auth)](https://arthas.aliyun.com/doc/auth.html). Do đó, Agent này trước khi đưa vào môi trường production tối thiểu cần bổ sung các kiểm soát sau:

1. **Ranh giới danh tính và mạng**: Bật xác thực cho Arthas, đặt cổng chẩn đoán trong mạng cách ly; Agent dùng định danh service độc lập và thông tin xác thực với quyền tối thiểu (least privilege), tuyệt đối không giao tài khoản, mật khẩu cho model.
2. **Whitelist instance mục tiêu**: Tên service chỉ được phân giải tới các instance đã đăng ký trong danh sách cho phép, cấm người dùng hoặc model truyền vào IP, port, URL tùy ý; môi trường production và test phải dùng thông tin xác thực và chính sách riêng biệt.
3. **Whitelist câu lệnh**: Mặc định chỉ mở các template chẩn đoán chỉ đọc đã qua kiểm duyệt, không can thiệp bytecode. Các tham số động như tên class, tên method phải được validate chặt chẽ theo kiểu và độ dài, cấm tuyệt đối việc lấy chuỗi do model sinh ra chạy trực tiếp làm lệnh Arthas.
4. **Phê duyệt thao tác rủi ro cao**: Các lệnh can thiệp động như `watch`, `trace`, `tt` mặc định phải tắt. Khi thực sự cần chạy phải dùng template đã duyệt và có người phê duyệt thủ công, giới hạn số lần chạy, thời gian chạy tối đa, tỷ lệ lấy mẫu và dung lượng output; biểu thức OGNL chỉ được sinh từ template trong whitelist, sau khi kết thúc tác vụ phải xác nhận can thiệp bytecode đã được hoàn nguyên. Các thao tác khác có khả năng làm thay đổi trạng thái runtime, gây tải cao hoặc làm lộ dữ liệu nhạy cảm cũng cần được cấp quyền ngắn hạn và kiểm tra chéo hai người (four-eyes principle).
5. **Bảo vệ tài nguyên**: Thiết lập timeout, giới hạn số lượng kết nối đồng thời, rate limit và circuit breaker cho từng instance; các lệnh chạy liên tục phải cài đặt thời gian chạy tối đa và đảm bảo `interrupt_job` cùng `close_session` luôn được gọi kể cả khi xảy ra lỗi ngoại lệ.
6. **Kiểm toán (Audit) và Khử nhạy cảm dữ liệu**: Ghi nhận người khởi tạo, instance đích, template, tham số thực tế, thời gian bắt đầu/kết thúc và tóm tắt kết quả; log, mã nguồn decompile và báo cáo trước khi chuyển cho model phải được khử nhạy cảm (masking/desensitization) để loại bỏ secret, PII và dữ liệu nghiệp vụ nhạy cảm.

Các hướng mở rộng trong tương lai cũng phải tuân thủ ranh giới này. Ví dụ "Liên kết cảnh báo" có thể tự động tạo tác vụ chẩn đoán nhưng không được vượt qua phê duyệt để chạy lệnh tùy ý; "Patch sửa lỗi tự động" chỉ được sinh diff đề xuất chứ không được can thiệp sửa trực tiếp trên instance production.

![Đề xuất mở rộng tiếp theo do AI cung cấp](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/extension-suggestions-9d109fe9.png)

### Triển khai Code và Cấu trúc Project

Sau khi xác nhận phương án không có vấn đề gì, mình ra lệnh triển khai:

```bash
Phương án tổng thể ổn rồi, tiến hành lập trình đi nhé
```

Nhận lệnh, AI bắt đầu tự chủ viết code. Bám sát thiết kế kiến trúc đã thống nhất, nó triển khai từng module—từ POM cha và bộ khung Maven multi-module, đến các lớp tiện ích dùng chung, data model, tầng truy cập dữ liệu (DAL), bọc client Arthas, Skill engine, AI analysis engine, tầng nghiệp vụ, Web controller, cho tới module bootstrap khởi động và cấu hình deploy, hoàn thành trọn vẹn toàn bộ 11 bước con:

![Quá trình AI tự chủ viết code](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/ai-coding-process-56802163.png)

Chỉ một thoáng sau, AI đã sinh ra 9 module với 46 file hoàn chỉnh, bao quát các tiện ích dùng chung, 7 Skill chẩn đoán, client Arthas HTTP API và bộ phân tích Spring AI Alibaba. Số lượng file chỉ thể hiện phạm vi bàn giao, không đồng nghĩa với tính an toàn và sự chính xác:

![Danh sách bàn giao do AI xuất ra sau khi hoàn thành code](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/delivery-checklist-c3d4b63a.png)

Xét về cấu trúc module tổng thể, AI tuân thủ đúng chuẩn phân chia Maven multi-module trong Java, từ trên xuống dưới bám sát phân cấp phụ thuộc: common → model → dal → client → skill → ai → service → web → bootstrap với quy ước đặt tên đồng bộ.

Module `agent-skill` rất đáng chú ý: AI đã thiết kế interface trừu tượng cho Skill engine, đồng thời tích hợp sẵn 7 kỹ năng chẩn đoán bao quát các sự cố JVM phổ biến (CPU tăng vọt, OOM, deadlock, endpoint chậm, GC bất thường, rò rỉ thread, không tìm thấy class), mỗi Skill đều định nghĩa chuỗi các bước chẩn đoán hoàn chỉnh. Tư duy thiết kế "framework + implementation tích hợp sẵn" này có khả năng mở rộng rất tốt:

```bash
jvm-ai-agent/
├── jvm-ai-agent-server/                 # Server Agent (Lõi)
│   ├── agent-common/                    # Module dùng chung: Utilities, Hằng số, DTO
│   ├── agent-model/                     # Data Model: Entity, Mapping DB
│   ├── agent-dal/                       # Tầng truy cập dữ liệu: Mapper, Repository
│   ├── agent-arthas-client/             # Bọc client Arthas HTTP API
│   ├── agent-skill/                     # Skill Engine (Phương pháp luận chẩn đoán)
│   ├── agent-ai/                        # AI Analysis Engine
│   ├── agent-service/                   # Tầng nghiệp vụ (gồm cả tra cứu instance service)
│   ├── agent-web/                       # Tầng Web: REST API, WebSocket
│   └── agent-server-bootstrap/          # Module khởi động (Bootstrap)
│
└── pom.xml                              # POM cha
```

Đi vào logic chẩn đoán cốt lõi, phương thức `executeDiagnosis` triển khai tuần tự theo: khớp Skill, định vị instance, thực thi chuỗi chẩn đoán, phân tích kết quả và sinh báo cáo. Bản sinh ban đầu cho phép trích xuất biến từ output của Arthas để ghép vào lệnh tiếp theo; phiên bản production bắt buộc phải cố định câu lệnh trong template đã qua thẩm định, chỉ cho phép thay thế các biến đã được validate. Việc cho phép "tiếp tục khi bước không trọng yếu thất bại" cũng phải định nghĩa rõ ràng từng mục; các lỗi xác thực, mục tiêu ngoài whitelist, timeout hay lỗi audit tuyệt đối không được âm thầm bỏ qua:

1. **Khớp Skill**: Thông qua `DefaultSkillMatcher` dựa vào từ khóa hiện tượng lỗi để tìm kỹ năng chẩn đoán phù hợp nhất.
2. **Định vị instance**: Thông qua `ServiceInstanceLocator` dựa vào tên service để phân giải IP và port Arthas của instance đích.
3. **Thực thi chuỗi chẩn đoán**: Lặp qua các template chẩn đoán chỉ đọc đã phê duyệt, lần lượt chạy lệnh Arthas và thu thập kết quả.
4. **Thay thế tham số có kiểm soát**: Trích xuất tên class, tên method từ kết quả, kiểm tra định dạng, độ dài và whitelist hợp lệ rồi mới đưa vào template tiếp theo.
5. **Báo cáo phân tích AI**: Chuyển toàn bộ dữ liệu chẩn đoán cho AI analysis engine để tạo báo cáo có cấu trúc gồm nguyên nhân gốc rễ, gợi ý khắc phục và mức độ nghiêm trọng.

```java
private void executeDiagnosis(DiagnosisRecord record, DiagnosisRequest request) {
    try {
        // 1. Khớp Skill
        Optional<SkillDefinition> skillOpt = skillMatcher.findBestMatch(request.getSymptom());
        if (skillOpt.isEmpty()) {
            failDiagnosis(record, "Không tìm thấy kỹ năng chẩn đoán phù hợp");
            return;
        }
        SkillDefinition skill = skillOpt.get();
        // ......

        // 2. Định vị instance mục tiêu
        ServiceRegistry instance = instanceLocator.resolveInstance(
                request.getServiceName(), request.getInstanceIp());
        // ......

        // 3. Thực thi chuỗi các bước chẩn đoán
        List<DiagnosticStep> chain = skill.getDiagnosticChain();
        StringBuilder allDiagnosticData = new StringBuilder();
        String decompiledCode = "";
        Map<String, String> contextVars = new HashMap<>();

        for (int i = 0; i < chain.size(); i++) {
            DiagnosticStep step = chain.get(i);
            // ...... Khởi tạo entity cho bước thực hiện

            try {
                // Chỉ phân giải template lệnh đã qua thẩm định; biến số bắt buộc phải kiểm tra kiểu và whitelist
                String command = resolveCommand(step, contextVars);
                // ......

                // Thực thi lệnh Arthas và ghi nhận thời gian chạy
                String result = executeStep(host, port, step, command);

                // Nếu là kết quả jad, ghi nhận làm mã nguồn decompile
                if ("jad".equals(step.getResultType())) {
                    decompiledCode = result;
                }

                // Trích xuất biến context từ kết quả để phục vụ các bước tiếp theo
                extractContextVars(result, contextVars);
            } catch (Exception e) {
                // Chỉ cho phép bước được đánh dấu rõ là read-only và không trọng yếu tiếp tục khi lỗi
                // ......
            }
        }

        // 4. Phân tích AI
        String report = diagnosisAnalyzer.analyze(
                request.getSymptom(), allDiagnosticData.toString(), decompiledCode, skill);

        // 5. Lưu báo cáo (trích xuất các trường có cấu trúc như nguyên nhân gốc rễ, mức độ nghiêm trọng từ báo cáo Markdown)
        // ......

        // 6. Cập nhật trạng thái bản ghi chẩn đoán
        record.setStatus(DiagnosisStatus.COMPLETED.getCode());
        // ......
    } catch (Exception e) {
        failDiagnosis(record, e.getMessage());
    }
}
```

### Tích hợp Giao diện Tương tác cho Agent

Trong lúc AI đang viết code, mình xem qua tài liệu chính thức của Spring AI Alibaba và thấy họ cung cấp sẵn component Agent Chat UI. Thay vì để AI sinh giao diện frontend từ đầu, việc tích hợp trực tiếp component này để có ngay trải nghiệm stream SSE sẽ nhanh hơn rất nhiều. Thế là mình ra một chỉ thị ngắn:

```bash
Dựa theo tài liệu chính thức của Spring AI Alibaba (link tham khảo https://java2ai.com/docs/frameworks/studio/quick-start/), tiến hành phát triển trang giao diện tương tác cho Agent
```

Chỉ cần một đường link tài liệu và một câu chỉ thị, AI tự động đọc tài liệu, nắm bắt các bước tích hợp và hoàn thành trang giao diện. Đây cũng là một mẹo rất hữu ích khi làm việc với AI: khi bạn chỉ cần tích hợp một component có sẵn, đưa trực tiếp link tài liệu chuẩn luôn hiệu quả hơn việc mô tả chi tiết yêu cầu bằng lời.

![AI hoàn thành tích hợp trang Agent Chat UI](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/agent-chat-ui-integration-28980a7f.png)

Đến đây, chuỗi tính năng chính phục vụ demo local đã được hoàn thành. Nó vẫn chưa phải là nền tảng chẩn đoán có thể đưa ngay lên production; ngoài việc kiểm thử chức năng, còn cần bổ sung các cơ chế an toàn, kiểm thử tiêm lỗi (fault injection) và bảo vệ tải. Để kiểm chứng quy trình cơ bản, mình tạo một endpoint test làm CPU tăng vọt ở local:

```java
@Slf4j
@RestController
public class TestController {
    @RequestMapping("cpu-100")
    public void cpu() {
        while (true) {
        }
    }
}
```

Khởi động service Agent, truy cập `http://localhost:{port}/chatui/index.html`, tại ô chat nhập: `order-service CPU tăng vọt 100%, hãy hỗ trợ điều tra sự cố`. Trong kịch bản demo có kiểm soát này, Agent trước hết lấy thông tin tổng quan qua Dashboard, sau đó dựa vào stack trace của thread để định vị code, dùng `jad` để xuất mã nguồn decompile, và cuối cùng sinh báo cáo chẩn đoán. Báo cáo này là kết luận cần kỹ sư thẩm định lại, không được chỉ dựa vào output của model để trực tiếp can thiệp xử lý sự cố online:

![Demo hiệu quả chẩn đoán của Agent](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/agent-diagnosis-demo-4ae073b0.png)

## Kịch bản 2: Tối ưu Slow Query trên Tập Dữ liệu Hàng triệu Bản ghi

Nếu kịch bản 1 kiểm chứng "khả năng quy hoạch và triển khai từ 0 đến 1" của AI, thì kịch bản 2 nhằm đánh giá một khía cạnh khác: **Trong một codebase đã có độ phức tạp nhất định, liệu AI có thể hiểu chính xác kiến trúc sẵn có, định vị vấn đề và thực hiện tối ưu hóa tiệm tiến hay không.**

### Định vị Vấn đề: Endpoint Tìm kiếm Mất tới 18 Giây

Đây là một service truy vấn đơn hàng xây dựng trên Spring Boot + MyBatis (`glm-testing-service`), nghiệp vụ xoay quanh việc tra cứu và phân tích đơn hàng với bốn endpoint chính:

| Endpoint | Đường dẫn | Mô tả |
| --- | --- | --- |
| Truy vấn đơn hàng theo user | `POST /api/orders/user` | Tra cứu danh sách đơn hàng theo user ID, hỗ trợ lọc theo trạng thái |
| Tìm kiếm đơn hàng | `POST /api/orders/search` | Tìm kiếm đơn hàng theo khoảng thời gian + số tiền + từ khóa sản phẩm |
| Thống kê doanh số ngành hàng | `GET /api/orders/category-stats` | Thống kê tổng doanh số theo trạng thái đơn hàng và ngành hàng |
| Lọc theo điều kiện kết hợp | `POST /api/orders/filter` | Lọc kết hợp theo user + nhiều trạng thái + nhiều ngành hàng |

Database được bơm vào 1,000,000 dòng dữ liệu test với cấu trúc bảng như sau:

```sql
CREATE TABLE `orders` (
    `id`           BIGINT PRIMARY KEY AUTO_INCREMENT,
    `order_no`     VARCHAR(64)  NOT NULL,
    `user_id`      BIGINT       NOT NULL,
    `status`       TINYINT      NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(10,2) NOT NULL,
    `product_name` VARCHAR(256) NOT NULL,
    `category`     VARCHAR(64)  NOT NULL,
    `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_order_no` (`order_no`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_category` (`category`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Project sử dụng một Aspect AOP để tự động ghi log thời gian thực thi của từng endpoint nhằm phát hiện nhanh các điểm nghẽn hiệu năng:

```java
@Around("controllerPointcut()")
public Object printExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
    long startTime = System.currentTimeMillis();
    Object result = joinPoint.proceed();
    long costTime = System.currentTimeMillis() - startTime;
    log.info("[{}] {}.{} 耗时: {}ms", Thread.currentThread().getName(), className, methodName, costTime);
    return result;
}
```

Sau khi bơm 1 triệu bản ghi vào database, tiến hành kiểm thử tải với endpoint tìm kiếm đơn hàng. Endpoint này thực hiện truy vấn kết hợp: so khớp từ khóa mờ (fuzzy search) + khoảng thời gian + lọc số tiền, ví dụ request tìm kiếm sau:

```bash
curl -X POST http://localhost:8080/api/orders/search \
  -H "Content-Type: application/json" \
  -d '{"startTime": "2025-01-01", "endTime": "2026-12-31", "minAmount": 500, "productName": "蓝牙", "pageNum": 1, "pageSize": 10}'
```

Log hệ thống lập tức xuất ra cảnh báo slow query nhức nhối:

```bash
[http-nio-8080-exec-1] OrderController.searchOrders 耗时: 18375ms
```

Phép quét toàn bảng (full table scan) do `LIKE '%蓝牙%'` khiến endpoint mất gần 18 giây, hiệu năng hiện tại hoàn toàn không thể đáp ứng yêu cầu vận hành online:

![Kết quả kiểm thử endpoint tìm kiếm mất tới 18 giây](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/search-api-18s-result-452a7fbb.png)

### Phân tích và Thiết kế Phương án Tối ưu

Mình chuyển trực tiếp dòng log cảnh báo slow query sang cho AI, yêu cầu nó kết hợp với mã nguồn hiện hữu để phân tích và đưa ra giải pháp:

```bash
Đối với vấn đề slow query được ghi nhận trong log hệ thống: "[http-nio-8080-exec-1] OrderController.searchOrders 耗时: 18375ms", hãy rà soát phân tích toàn diện nghiệp vụ đơn hàng và đưa ra đề xuất tối ưu.
```

AI định vị chính xác đoạn code nghiệp vụ mục tiêu, kết hợp câu lệnh SQL và cấu trúc bảng, từ góc độ thiết kế chỉ mục (index) đưa ra một phương án giải quyết bài bản:

![Giải pháp slow query do AI đưa ra](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/slow-query-solution-c9b97ca8.png)

Đồng thời đưa ra lộ trình tối ưu phân theo từng giai đoạn và hiệu quả kỳ vọng:

![Đề xuất tối ưu theo từng giai đoạn do AI đưa ra](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/phased-optimization-suggestions-6ece73cd.png)

Sau khi kiểm tra hướng đi chuẩn xác, mình ra lệnh thực hiện tối ưu:

```bash
Vui lòng kết hợp với công nghệ hiện có của dự án, tiến hành tối ưu hóa có hệ thống cho module slow query
```

AI lần lượt rà soát logic nghiệp vụ và chi tiết truy vấn của từng endpoint. Các bước tối ưu đi từ dưới lên trên, từ tầng database đến tầng ứng dụng:

**Tầng Database**—5 chỉ mục ứng viên do AI đề xuất:

- Fulltext index `ft_product_name` (parser ngram, hỗ trợ phân từ tiếng Trung) thay thế quét toàn bảng `LIKE '%xxx%'`.
- Composite index `idx_create_time_amount` hỗ trợ lọc theo thời gian, số tiền và sắp xếp.
- Ứng viên covering index `idx_search_covering` giúp giảm lookup bảng cho các truy vấn COUNT.
- Composite index `idx_user_status_category` tối ưu hóa lọc đa điều kiện.
- Covering index `idx_status_category_amount` tối ưu hóa tổng hợp doanh số theo ngành hàng.

```sql
ALTER TABLE `orders` ADD FULLTEXT INDEX `ft_product_name` (`product_name`) WITH PARSER ngram;
ALTER TABLE `orders` ADD INDEX `idx_create_time_amount` (`create_time` DESC, `total_amount`);
ALTER TABLE `orders` ADD INDEX `idx_search_covering` (`create_time`, `total_amount`, `product_name`);
ALTER TABLE `orders` ADD INDEX `idx_user_status_category` (`user_id`, `status`, `category`);
ALTER TABLE `orders` ADD INDEX `idx_status_category_amount` (`status`, `category`, `total_amount`);
```

**Tầng Ứng dụng**—Đồng bộ tối ưu hóa câu SQL và tầng Service:

- Chuyển ngữ nghĩa tìm kiếm `LIKE '%xxx%'` sang tìm kiếm toàn văn `MATCH ... AGAINST`.
- Phân trang sâu (deep pagination) tự động chuyển sang Deferred Join, dùng subquery covering index để định vị khóa chính trước rồi mới join lại lấy dữ liệu đầy đủ.
- COUNT theo nhu cầu: Mặc định không đếm tổng số bản ghi, chỉ khi frontend truyền rõ `needTotal=true` mới thực thi đếm.

Dưới đây là phương án tối ưu chỉ mục do AI xuất ra. Việc composite index có phát huy hiệu quả hay không phụ thuộc vào quy tắc tiền tố bên trái nhất (leftmost prefix), độ chọn lọc (selectivity), thứ tự sắp xếp và lựa chọn của bộ tối ưu hóa (optimizer); fulltext index cũng làm tăng chi phí ghi và lưu trữ. Trước khi chạy DDL, cần dùng SQL thực tế và phân bố dữ liệu thật để chạy `EXPLAIN ANALYZE`, đồng thời xóa bỏ các chỉ mục trùng lặp hoặc ít đem lại giá trị. Có thể tham khảo tài liệu [MySQL Multiple-Column Indexes](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html) và [ngram Full-Text Parser](https://dev.mysql.com/doc/refman/8.4/en/fulltext-search-ngram.html):

![Script SQL tối ưu chỉ mục do AI xuất ra](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/index-optimization-sql-798e9b30.png)

Từ diff code có thể thấy, AI trong code sẵn có đã thay thế truy vấn mờ `LIKE` bằng tìm kiếm toàn văn. Đây không phải sự thay thế trong suốt: phân từ, stopword, từ ngắn, khớp chuỗi con và sắp xếp độ liên quan mặc định đều có thể thay đổi. Trước khi đưa lên production cần dùng mẫu truy vấn thực tế để nghiệm thu phân từ, từ ngắn, ký tự đặc biệt và kết quả sắp xếp:

![AI hoàn thành tối ưu hóa tiệm tiến trong code hiện hữu](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/incremental-code-optimization-a90be17d.png)

Đối với vấn đề phân trang sâu, AI căn cứ vào lượng dữ liệu 1 triệu bản ghi hiện tại để đưa ra ngưỡng phân trang cụ thể—khi `offset` vượt quá 1000 sẽ tự động chuyển sang Deferred Join; phân trang nông đi truy vấn thường, còn phân trang sâu dùng subquery covering index định vị khóa chính trước rồi mới lookup:

```java
/** Ngưỡng phân trang sâu: offset vượt quá giá trị này sẽ tự động chuyển sang Deferred Join */
private static final int DEEP_PAGE_THRESHOLD = 1000;

// Phân trang sâu (offset > 1000) đi Deferred Join, phân trang nông đi truy vấn thường
boolean isDeepPage = offset > DEEP_PAGE_THRESHOLD;
List<Order> orders;
if (isDeepPage) {
    orders = orderMapper.searchOrdersDeepPage(...);
} else {
    orders = orderMapper.searchOrders(...);
}
```

Con số `1000` chỉ là ngưỡng ban đầu được sinh ra trong lần này, không thể mặc định là tối ưu cho mọi bảng 1 triệu dòng. Độ rộng dòng dữ liệu, độ chọn lọc, độ bao phủ chỉ mục, yêu cầu sắp xếp và SLO của endpoint đều ảnh hưởng đến điểm chuyển giao; cần benchmark các mức offset khác nhau và quan sát số dòng quét cùng độ trễ p95/p99 trước khi quyết định. Nếu nghiệp vụ cho phép, phân trang con trỏ (keyset/cursor pagination) dựa trên khóa sắp xếp ổn định vẫn là lựa chọn đáng ưu tiên hơn.

![Triển khai code tự động chuyển chiến lược truy vấn dựa trên ngưỡng phân trang sâu](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/deep-pagination-threshold-code-6f1de103.png)

Sau khi hoàn tất toàn bộ tối ưu, AI xuất bản tổng kết so sánh hiệu quả trước và sau:

![Tổng kết hiệu quả tối ưu do AI xuất ra](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/optimization-summary-01b9a324.png)

### Kiểm chứng Hiệu quả Tối ưu

Sau khi hoàn thành tối ưu và gọi lại endpoint, ảnh chụp ghi nhận thời gian thực thi sau khi đã warm-up giảm xuống dưới 300ms—nhanh hơn khoảng 60 lần so với 18,375ms ban đầu. Lưu ý rằng một lần chụp màn hình đơn lẻ không chứng minh hệ thống "ổn định dưới 300ms": để đưa ra kết luận khoa học có thể tái lập, cần nêu rõ phần cứng, phiên bản và cấu hình MySQL, phân bố dữ liệu, độ ấm của cache, mức độ đồng thời và số lượng mẫu, đồng thời báo cáo đầy đủ p50/p95/p99 cùng tỷ lệ lỗi.

![Thời gian phản hồi sau tối ưu giảm xuống dưới 300ms](/media/jg/ext/oss.javaguide.cn/ai/coding/glm5.1-cc/optimized-api-300ms-db7d266b.png)

## Tổng kết Thực chiến

Qua thực chiến ở hai kịch bản, mình đúc kết lại một số kinh nghiệm và suy ngẫm khi dùng Claude Code + model bên thứ ba hỗ trợ lập trình.

### Lập trình với AI Hỗ trợ Làm được Những gì

| Khía cạnh năng lực | Thể hiện trong kịch bản | Ghi chú |
| --- | --- | --- |
| Quy hoạch từ yêu cầu đến kiến trúc | Kịch bản 1: Nhận mô tả yêu cầu, AI tự chủ chọn công nghệ và thiết kế kiến trúc | Rất thích hợp để xác thực nhanh ý tưởng, nhưng phương án cần người review |
| Triển khai code end-to-end | Kịch bản 1: Tự chủ bàn giao 46 file thuộc 9 module | Từ dựng khung multi-module đến code nghiệp vụ, giảm bớt code lặp lại |
| Tối ưu hóa tiệm tiến trên code cũ | Kịch bản 2: Định vị slow query và tối ưu trên dự án 1 triệu bản ghi | Kết hợp cấu trúc bảng và SQL đưa ra phương án phân kỳ hợp lý |
| Sinh tham số ứng viên | Kịch bản 2: Đề xuất giá trị ban đầu cho ngưỡng phân trang sâu | Ngưỡng vẫn cần kiểm chứng qua benchmark và execution plan |

### Những Điểm Cần Lưu ý trong Thực chiến

**Điểm làm tốt**:

- **Nhanh chóng tạo ra tài liệu phục vụ review**: Ở kịch bản 1, model nhanh chóng sinh ra phương án kỹ thuật và bản phác thảo kiến trúc, rất tốt để làm điểm xuất phát thẩm định.
- **Đưa ra phương án đa tầng**: Trong kịch bản slow query, việc tối ưu chỉ mục tầng database và tái cấu trúc SQL tầng ứng dụng được đẩy mạnh đồng bộ, bao quát khá toàn diện.
- **Cung cấp tham số có thể kiểm thử**: Kịch bản 2 đưa ra ngưỡng ban đầu cho phân trang sâu, tạo tiền đề để thiết kế các bài test benchmark tiếp theo.

**Điểm cần lưu ý**:

- **An toàn production cần thiết kế riêng biệt**: Quy trình session của Arthas có tài liệu chuẩn, nhưng điều tuyệt đối không được bỏ sót là xác thực, whitelist instance và câu lệnh, phê duyệt, rate limit và audit log.
- **Thỉnh thoảng đứt gãy mạch ngữ cảnh trong chuỗi thực thi dài**: Trong các tác vụ lập trình liên tục phức tạp, AI đôi khi quên mất các ràng buộc thiết kế ở giai đoạn trước. Khuyến nghị tách tác vụ phức tạp thành các giai đoạn rõ ràng, xác nhận độc lập từng giai đoạn.
- **Phong cách code và quy chuẩn dự án**: Cấu trúc code sinh ra hợp lý, nhưng độ ăn khớp với quy chuẩn sẵn có của cá nhân/team cần được mài giũa thêm; ở kịch bản 1 có một số cách đặt tên và tổ chức file cần tinh chỉnh thủ công.
- **Đánh đổi giữa các phương án**: AI sẽ đưa ra nhiều phương án nhưng không thể cân nhắc đánh đổi thay bạn. Ví dụ ở kịch bản 2 việc chọn Fulltext Index hay Elasticsearch, dùng Deferred Join hay Keyset Pagination đòi hỏi kỹ sư phải dựa trên thực tế nghiệp vụ để quyết định.

### Một số Lời khuyên khi Dùng Claude Code + Model Bên thứ ba

1. **Mô tả yêu cầu phải cụ thể**: Trong kịch bản 1, prompt yêu cầu đầy đủ quyết định trực tiếp chất lượng phương án kiến trúc; yêu cầu mơ hồ chỉ nhận lại phương án mơ hồ.
2. **Xác nhận theo từng giai đoạn**: Với dự án phức tạp, đừng để AI sinh từ đầu đến cuối trong một lần, hãy chia thành: Chọn công nghệ → Thiết kế kiến trúc → Viết code, review độc lập từng chặng.
3. **Giữ quyền kiểm soát các quyết định then chốt**: Các lựa chọn ở tầng kiến trúc (như chiến lược cache, giải pháp phân trang) cần dựa vào bối cảnh nghiệp vụ, AI không thể làm thay bạn.
4. **Tận dụng tốt link tài liệu**: Khi cần tích hợp một thư viện hoặc component có sẵn (như Spring AI Alibaba ở kịch bản 1), đưa trực tiếp link tài liệu chính thức luôn hiệu quả hơn việc mô tả yêu cầu dài dòng.

## Lời kết

Claude Code sau khi kết nối với model bên thứ ba đã hình thành một quy trình làm việc khá hoàn chỉnh ở chế độ Agent từ khâu hiểu ngữ cảnh, bóc tách tác vụ đến sinh code. Trải qua hai kịch bản thực tế, lập trình có AI hỗ trợ thực sự rút ngắn đáng kể thời gian "từ ý tưởng đến sản phẩm chạy được".

Nhưng công cụ suy cho cùng vẫn chỉ là công cụ. Nhìn lại hai kịch bản trong bài:

- **Agent chẩn đoán thông minh JVM ở kịch bản 1** đòi hỏi phải hiểu vòng đời session Arthas và phương pháp luận chẩn đoán JVM, và quan trọng hơn là phải thiết kế tường minh ranh giới phân quyền trên production. Model chỉ được sinh bước gợi ý, không được trao quyền thực thi tùy tiện trên bất kỳ mục tiêu hay câu lệnh nào.
- **Tối ưu hóa slow query ở kịch bản 2** đòi hỏi phải nắm vững nguyên lý chỉ mục MySQL, cơ chế tìm kiếm toàn văn và chiến lược phân trang sâu để đánh giá xem phương án AI đưa ra có áp dụng được cho nghiệp vụ của bạn hay không—chẳng hạn fulltext index trong kịch bản ghi nhiều có thể gây suy giảm hiệu năng ghi, hay ngưỡng Deferred Join cần căn chỉnh theo lượng dữ liệu thực tế.

Các công cụ AI coding đang thay đổi phương thức làm việc của lập trình viên—từ "người viết code" thành "người review code". Và tiền đề để sử dụng tốt AI là bạn phải hiểu rõ việc mình đang làm hơn cả chính AI.

## Tài liệu Tham khảo

- Hướng dẫn chuyển đổi model GLM Coding Plan: <https://docs.bigmodel.cn/cn/coding-plan/using5-1>
- Hướng dẫn cài đặt Claude Code: <https://docs.anthropic.com/en/docs/claude-code>
- Công cụ chuyển đổi model cc-switch: <https://github.com/farion1231/cc-switch>
- Tài liệu Spring AI Alibaba Agent Chat UI: <https://java2ai.com/docs/frameworks/studio/quick-start/>
- Tài liệu chính thức Arthas: <https://arthas.aliyun.com/doc/>
- Arthas HTTP API: <https://arthas.aliyun.com/doc/http-api.html>
- Cấu hình xác thực Arthas: <https://arthas.aliyun.com/doc/auth.html>
