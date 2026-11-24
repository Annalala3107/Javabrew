---
title: "Thực chiến DeepSeek V4 + Claude Code: Đánh giá Chuyên sâu Năng lực Code"
description: "Trải nghiệm chuyên sâu việc tích hợp DeepSeek V4 với Claude Code, kiểm thử thực tế qua nhiều kịch bản như audit code, database migration, nâng cấp model để đánh giá năng lực lập trình thực tế của V4-Pro và V4-Flash."
category: Thực chiến AI Coding
head:
  - - meta
    - name: keywords
      content: DeepSeek V4,Claude Code,AI Coding,Audit code,Agent Coding,V4-Pro,V4-Flash
lang: vi
sourceRef: zh-ref/ai-coding/cases/deepseek-v4-claude-code.md
---

Ngày 24 tháng 4 năm 2026, DeepSeek chính thức phát hành và mở mã nguồn bản V4 Preview. Các bài báo cáo kỹ thuật và benchmark cộng đồng xuất hiện rất nhiều, nhưng điều mình quan tâm hơn cả là biểu hiện của nó khi đưa vào một codebase thực tế.

Các mô hình mã nguồn mở trong việc đối thoại và hành văn kỹ thuật vốn đã làm rất hoàn thiện, các bên cạnh tranh nhau gay gắt với tốc độ lặp cải tiến có thể nhìn thấy rõ ràng. Nhưng Agent Coding lại là một câu chuyện hoàn toàn khác.

Để một mô hình tự chủ phân tích cấu trúc dự án, hiểu các quan hệ phụ thuộc giữa nhiều file và đưa ra phương án kỹ thuật có thể chạy được đòi hỏi rất khắt khe về cả năng lực lập trình lẫn độ ổn định khi gọi công cụ (tool calling).

Trước đây các mô hình theo hướng này liên tục tiến bộ, nhưng ai đã dùng thực tế đều hiểu rằng, để đạt tới mức "yên tâm giao phó cho nó tự hoàn thành độc lập" thì vẫn luôn thiếu một chút gì đó.

Vì vậy khi V4 ra mắt, phản xạ đầu tiên của Tiểu G là kết nối ngay vào Claude Code để bắt tay vào việc thực tế.

Bài viết này ghi lại 4 phần nội dung:

1. **Hai cách kết nối Claude Code với DeepSeek V4**: Dùng file cấu hình + CC Switch chuyển đổi trực quan
2. **Nhật ký thực chiến qua 5 tác vụ phát triển thực tế**: V4-Pro khi bắt tay vào việc thực sự ra sao
3. **Thông số cốt lõi và biểu giá của DeepSeek V4-Pro và Flash**: Có đáng để chuyển sang không?
4. **Đề xuất kịch bản sử dụng**: Khi nào nên dùng, khi nào nên tiếp tục quan sát

## Kết nối Claude Code với DeepSeek V4

Hệ sinh thái công cụ của Claude Code tương đối hoàn thiện, nhưng chi phí gọi API các model chính thức của Anthropic không hề rẻ. DeepSeek V4 cung cấp **endpoint tương thích với Anthropic**, giúp Claude Code có thể kết nối trực tiếp mà không cần qua dịch vụ chuyển đổi giao thức trung gian nào. Tuy nhiên, tương thích giao diện không đồng nghĩa với việc sao chép hoàn hảo năng lực của các model Anthropic; việc gọi tool, quản lý context và các tính năng mới vẫn cần được kiểm chứng trên các tác vụ thực tế.

### Cách 1: Dùng File Cấu hình (Khuyến nghị)

Nếu máy bạn chưa cài đặt Claude Code, hãy chạy lệnh sau để cài đặt (yêu cầu Node.js 18+):

```bash
npm install -g @anthropic-ai/claude-code
```

Chỉnh sửa hoặc tạo mới file cấu hình của Claude Code tại `~/.claude/settings.json`, thêm trường `env` và điền địa chỉ backend, model cùng API Key vào:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your_deepseek_api_key",
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",
    "CLAUDE_CODE_SUBAGENT_MODEL": "deepseek-v4-flash",
    "CLAUDE_CODE_EFFORT_LEVEL": "max",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

Hãy nhớ thay `your_deepseek_api_key` bằng DeepSeek API Key thực tế của bạn.

Trang tạo API Key: <https://platform.deepseek.com/>.

![Tạo API Key DeepSeek](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/deepseek-api-keys-2a8410a0.png)

Hậu tố `[1m]` ở đây dùng để yêu cầu phiên bản context window 1M của V4 Pro. Nếu các tác vụ hàng ngày muốn ưu tiên dùng Flash, bạn có thể đổi `ANTHROPIC_MODEL` thành `deepseek-v4-flash`; model ID và phương thức ánh xạ căn cứ theo [Tài liệu tích hợp chính thức của DeepSeek](https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code/).

Sau khi cấu hình xong, khởi chạy Claude Code:

```bash
claude
```

Lần đầu chạy hệ thống sẽ yêu cầu bạn xác nhận tin cậy (trust) thư mục hiện tại.

### Cách 2: Dùng CC Switch (Chuyển đổi Trực quan)

Nếu bạn muốn chuyển đổi linh hoạt qua lại giữa DeepSeek, Claude, MiniMax và nhiều nhà cung cấp khác, khuyến nghị cài đặt **CC Switch**. Đây là công cụ nhỏ chuyên quản lý chuyển đổi model trong Claude Code, hỗ trợ chuyển đổi chỉ bằng một cú nhấp chuột, đồng thời hỗ trợ quản lý Skills, MCP và prompt template.

![Giao diện chính của CC Switch](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/cc-switch-main-interface-e00b8821.png)

Khởi động CC Switch, bấm vào dấu **"+"** ở góc trên bên phải, chọn Custom Provider, mục Base URL điền `https://api.deepseek.com/anthropic`, mục API Key điền API Key DeepSeek của bạn.

![Thêm Provider DeepSeek trong CC Switch](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/cc-switch-add-deepseek-provider-8a5a71f0.png)

Đổi tên model thành `deepseek-v4-pro[1m]` (hoặc `deepseek-v4-flash`), sau đó bấm "Thêm" ở góc dưới bên phải.

### Kiểm tra Hiệu lực

Gõ trực tiếp `claude` trong terminal, sau khi vào Claude Code thì nhập `/status` để xác nhận. Nếu trường model hiển thị `deepseek-v4-pro[1m]` hoặc `deepseek-v4-flash` nghĩa là việc định tuyến đã có hiệu lực thành công.

![Kiểm tra xác nhận hiệu lực](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/verify-deepseek-v4-ready-b8e5e2fc.png)

Sau đó bạn đã có thể thông qua Claude Code để gọi DeepSeek V4. Việc model bên thứ ba có hỗ trợ tính năng mới cụ thể nào của Claude Code hay không vẫn phải căn cứ vào tính tương thích của API và kết quả kiểm thử thực tế.

## Thực chiến 1: Nâng cấp Danh sách Model Cài sẵn Đa Provider cho LLM

Mình có một dự án phân tích chứng khoán đa agent (multi-agent) đã gần một tháng chưa đụng tới. Lần này khởi động lại, việc đầu tiên là phải cập nhật lại cấu hình các model đã lỗi thời.

Trang Settings của dự án trước đây chỉ có một ô text thuần túy bắt người dùng nhập tay tên model, rất bất tiện.

Mình cần làm hai việc: **tìm kiếm các phiên bản model mới nhất của từng nhà cung cấp LLM**, sau đó **thêm dropdown chọn lựa ở giao diện frontend**.

Prompt rất ngắn gọn:

> /tavily-search Hãy tìm kiếm các model mới nhất hiện tại của deepseek, glm và openai, sau đó điều chỉnh các gợi ý và ví dụ model mặc định trong cấu hình toàn cục. Ngoài ra, các icon LLM hiện tại nhìn quá đậm mùi AI, hãy đổi sang bộ icon nào trông xịn và sang trọng hơn chút.

Nhiệm vụ không lớn, nhưng có một chi tiết rất đáng nói—nếu không cấu hình Skill `/tavily-search` mà chỉ trông chờ vào hạn tri thức (cutoff date) của LLM để đoán phiên bản mới nhất thì xác suất sai cực cao. Trước đây khi dùng model khác mà không có Tavily, mình phải nhắc đi nhắc lại mấy lượt mới chốt đúng được các phiên bản model mới nhất.

Về cách sử dụng Tavily, bạn có thể tham khảo: [Kết nối Claude Code với công cụ tìm kiếm Tavily cho Agent để đạt chất lượng tìm kiếm vượt trội](https://mp.weixin.qq.com/s/kAk7lLVgYzZrD9xJs3AUkQ).

Lần này V4-Pro đã hoàn thành việc sửa đổi chỉ trong một lượt duy nhất.

![Tìm kiếm và cập nhật các model LLM mới nhất](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/search-and-update-latest-models-ee43d18f.png)

Cấu hình model được cập nhật thành công toàn bộ, các ví dụ model khuyến nghị của từng hãng đều đã chuyển sang phiên bản mới nhất. Có 3 file được chỉnh sửa:

1. **`application.yml`**—Thêm Provider cài sẵn DeepSeek, model mặc định của GLM nâng lên `glm-5`
2. **`.env.example`**—Bổ sung biến môi trường DeepSeek, Kimi mặc định đổi thành `kimi-k2.6`
3. **`SettingsPage.tsx`**—Thêm hằng số `PROVIDER_PRESETS`, chuyển trường Model và Embedding Model thành combo box

Danh sách model khuyến nghị cuối cùng của 4 Provider (tính đến ngày 25.04.2026):

| Provider | Model Khuyến nghị |
| --- | --- |
| DashScope | 8 model gồm `qwen3.6-flash`, `qwen3.5-plus`, `qwen3-max`, `qwq-32b`... |
| DeepSeek | `deepseek-v4-flash`, `deepseek-v4-pro` |
| GLM | 8 model gồm `glm-5.1`, `glm-5`, `glm-4.7-flash`... |
| Kimi | 5 model gồm `kimi-k2.6`, `kimi-k2.5`, `kimi-k2-thinking`... |

![Chỉnh sửa cấu hình model DeepSeek](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/edit-deepseek-model-config-a2030406.png)

## Thực chiến 2: Chẩn đoán Phương án Database Migration và Tích hợp Flyway

Nhiệm vụ thứ hai mang tính thử thách hơn.

Do vừa đổi máy tính mới, toàn bộ môi trường đều phải dựng lại từ đầu. Dự án có hai file SQL, một file chạy tự động khi khởi động, còn một file thì không. Logic phần này mình cũng quên mất rồi nên nhờ model chẩn đoán giúp nguyên nhân.

![Giao diện quản lý kỹ năng báo lỗi](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/skill-management-error-f4a6d813.png)

Prompt:

> Dự án hiện tại có hai file SQL, `sql/init.sql` đã tự động chạy khi khởi động dự án, còn `sql/V2__knowledge_skill.sql` không tự động chạy. Bạn hãy phân tích giúp tôi nguyên nhân do đâu, sau đó dùng phương thức hợp lý để tối ưu vấn đề hiện tại.

V4-Pro đã tìm ra nguyên nhân trực tiếp: **`V2__knowledge_skill.sql` chưa được mount vào container Docker, và dự án cũng chưa tích hợp công cụ database migration**, trong khi việc thực thi `init.sql` bắt nguồn từ việc mount cố định trong Docker Compose.

![Phân tích nguyên nhân bảng database chưa được thực thi](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/database-table-analysis-79b714d8.png)

Giải pháp nó đưa ra là **tích hợp Flyway làm công cụ database migration**.

Flyway là một trong những giải pháp quản lý migration cơ sở dữ liệu hoàn thiện nhất trong hệ sinh thái Java, sử dụng quy ước đặt tên file (như `V1__init.sql`, `V2__knowledge_skill.sql`) để tự động quản lý thứ tự migration.

Trong toàn bộ quá trình, DeepSeek V4-Pro đã thực hiện các công việc sau:

1. Phân tích logic mount của `init.sql` trong cấu hình Docker Compose
2. Phát hiện nguyên nhân thiếu sót của `V2__knowledge_skill.sql`
3. Thêm dependency Flyway, viết cấu hình migration
4. Chuẩn hóa lại cách đặt tên file SQL để đảm bảo thứ tự migration chính xác

> Gặp một sự cố nhỏ: Giữa chừng mình lỡ tay chỉnh lại kích thước cửa sổ iTerm2 khiến lịch sử đối thoại trên terminal bị xáo trộn hiển thị đôi chút.

Lần chạy đầu tiên, Flyway chưa thực thi thành công. Mình dán log lỗi sang, sau hai lượt điều chỉnh thì sửa chữa thành công.

![Tổng kết của DeepSeek sau khi hoàn tất tích hợp Flyway](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/deepseek-flyway-integration-summary-abda32a8.png)

Vấn đề này rất đáng để tách riêng ra bàn luận—vì ngay cả DeepSeek V4-Pro trong lần tích hợp đầu tiên cũng đã vấp phải cái bẫy này, phải qua hai vòng debug mới tìm ra nguyên nhân gốc rễ.

**Spring Boot 4.x đã tiến hành chia nhỏ module autoconfiguration trên quy mô lớn**, lớp `FlywayAutoConfiguration` đã bị dời khỏi `spring-boot-autoconfigure` sang một module độc lập mang tên `spring-boot-flyway`.

Nếu bạn chỉ khai báo thư viện bên thứ ba `flyway-core`, Spring Boot **sẽ không tự động kích hoạt bất kỳ migration nào**. Điểm oái oăm nhất là **trong log khởi động cũng hoàn toàn không có bất kỳ dòng log nào liên quan đến Flyway**—hoàn toàn không báo lỗi, chỉ âm thầm không làm gì cả. Chiếc bẫy này cực kỳ dễ gây hoang mang, khiến bạn nghĩ rằng mình viết sai cấu hình và loay hoay sửa file `yml` mãi không dứt.

Sử dụng Starter chính thức sẽ kéo theo module autoconfiguration tương ứng vào:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-flyway</artifactId>
</dependency>
<!-- Hỗ trợ phương ngữ PostgreSQL vẫn cần khai báo riêng -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

Kết luận rút ra từ ca thực chiến này rất cụ thể: khi Spring Boot 4.x tích hợp Flyway, bắt buộc phải dùng Starter chính thức tương ứng, không thể chỉ khai báo `flyway-core` rồi mặc định rằng migration sẽ tự chạy. Các thư viện bên thứ ba khác có cần Starter riêng hay không phải tra cứu tài liệu chuẩn của phiên bản Spring Boot tương ứng, không thể suy diễn chung chung.

## Thực chiến 3: Nền tảng Phỏng vấn AI Kết nối DeepSeek

Nền tảng hỗ trợ phỏng vấn thông minh bằng AI của chúng mình hiện đã bổ sung tính năng chuyển đổi và cấu hình đa model, và DeepSeek cũng đã được hỗ trợ.

Tương tự Thực chiến 1, quá trình tích hợp model mới nhất diễn ra trơn tru ngay trong một lần nên mình không đăng lại quy trình nữa, chúng ta xem trực tiếp kết quả.

Thông qua giao diện cài đặt, chuyển model mặc định sang DeepSeek, chọn **deepseek-v4-flash**.

![Chuyển model của nền tảng phỏng vấn sang deepseek-v4-flash](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/interview-guide-model-deepseek-v4-flash-69a60ea0.png)

Sau đó tải lên một bản CV, sinh một buổi phỏng vấn giả lập dựa trên CV này để xem kết quả.

Bộ câu hỏi phỏng vấn được sinh qua deepseek-v4-flash, và câu trả lời cũng được DeepSeek cung cấp ở chế độ nhanh không suy nghĩ (non-thinking mode, có 2 câu hỏi chưa được trả lời).

![Kết quả đánh giá phỏng vấn giả lập](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/interview-guide-model-deepseek-v4-flash-intervie-39f3466c.png)

Trong tác vụ sinh câu hỏi phỏng vấn theo CV này, chế độ non-thinking của Flash có thể hoàn thành các câu hỏi chính, nhưng vẫn sót 2 câu chưa trả lời. Nó rất phù hợp cho các tác vụ sinh hàng loạt nhạy cảm về chi phí và cho phép con người kiểm tra lại.

## Thực chiến 4: Audit Code Dự án và Phối hợp Đa Model

Dự án phân tích chứng khoán đa agent của mình hiện bản MVP đã chạy được, hỗ trợ phân tích cổ phiếu, đa chiến lược, cảnh báo, kỹ năng, đa model, thông báo... Tuy nhiên trong quá trình phát triển mải chạy theo tiến độ nên chất lượng code chưa được chăm chút kỹ càng.

Lần này mình thử nghiệm một ý tưởng: **dùng model giá rẻ để audit, dùng model năng lực cao để ra quyết định và sửa code**.

Trong Claude Code, mình để DeepSeek V4-Pro khởi chạy nhiều Sub-agent quét toàn bộ dự án từ các khía cạnh bảo mật, tính đúng đắn chức năng và chất lượng code, sau đó tổng hợp các vấn đề phát hiện được vào một tài liệu.

![DeepSeek V4-Pro quét và phân tích code](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/deepseek-v4-pro-scan-analyze-code-d661db74.png)

V4-Pro quả thực đã tìm ra khá nhiều vấn đề, trong đó TOP 5 vấn đề khẩn cấp nhất gồm:

1. **Lưu trữ API Key dưới dạng plaintext** — Module mã hóa đã viết nhưng chưa được đấu nối vào luồng lưu trữ
2. **Endpoint quản trị hệ thống không phân quyền** — Người dùng thông thường có thể chỉnh sửa cấu hình LLM
3. **Lỗ hổng deserialization trong Redis** — Khai báo `activateDefaultTyping` cho phép khởi tạo class tùy ý
4. **Hardcode API Key bên thứ ba** — Secret key thật của Bocha bị commit thẳng trong code
5. **Bug chức năng** — Nút "Phân tích lại" tại trang History bị liệt do không đọc tham số route

Mình đã lướt qua một lượt, về cơ bản đều là những vấn đề hoàn toàn xác đáng. Các vấn đề an ninh bảo mật đặc biệt cần chú trọng, nhất là lỗ hổng deserialization Redis ở mục 3 nếu bị khai thác sẽ gây hậu quả cực kỳ nghiêm trọng.

Tiếp theo, mình chuyển toàn bộ các vấn đề do V4-Pro tìm ra sang cho **GPT-5.5** (khả dụng trong tài khoản lúc đó) để thẩm định lại.

![GPT5.5 tiến hành sửa các vấn đề do DeepSeek V4-Pro phát hiện](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/gpt5-5-fix-problems-found-by-deepseek-v4-pro-2e9efb16.png)

**Tại sao không để V4-Pro tự sửa?** Bởi vì audit code và sửa code là hai năng lực khác nhau, việc dùng hai mô hình khác nhau để xác thực chéo sẽ đáng tin cậy hơn nhiều—một bên chuyên tìm lỗi, một bên chuyên xác nhận lỗi và thực thi sửa đổi.

GPT-5.5 sau khi thẩm định đã tiến hành sửa chữa. Đây là ghi chép về lựa chọn model tại thời điểm diễn ra bài viết, không mang tính khuyến nghị cố định; kết quả cuối cùng vẫn phải lấy kiểm thử tự động, code review và thu hồi/xoay vòng key (secret rotation) làm chuẩn, không thể coi sự xác nhận của model thứ hai là vòng tròn khép kín hoàn toàn.

Mô hình phân công này áp dụng công thức: **model chi phí thấp sàng lọc ban đầu, model năng lực cao hơn thẩm định lại, cuối cùng con người và test suite nghiệm thu**. Mức tiết kiệm cụ thể phụ thuộc vào dung lượng input, tỷ lệ hit cache, lượng output và giá model tại thời điểm đó; khi không có bảng kê chi tiết toàn bộ lời gọi, không nên vội vã đưa ra kết luận "tiết kiệm vài bậc độ lớn".

## Thực chiến 5: Quét và Phân tích Toàn bộ Dự án

Tác vụ này khá đơn giản, mục đích chính là kiểm tra chất lượng phân tích của V4-Pro và tiện thể quan sát mức tiêu thụ token.

![Cho V4-Pro quét và phân tích agent-invest](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/claudecode-deepseek-v4-pro-1m--88d2621f.png)

![Kết quả quét và phân tích agent-invest của V4-Pro](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/v4-pro-scan-analyze-result-of-agent-invest-a139d9ee.png)

Dưới đây là tài liệu V4-Pro xuất ra cuối cùng, bao quát cấu trúc dự án, các module chính và các tồn đọng kỹ thuật cần xử lý:

![Tài liệu agent-invest do V4-Pro xuất ra cuối cùng](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/v4-pro-final-output-agent-invest-document-dde6bce5.png)

## Toàn cảnh DeepSeek V4: Xem Số liệu Sau khi Đã Thực chiến

Sau khi xem qua các nhiệm vụ thực chiến ở trên, việc bổ sung các thông số kỹ thuật của DeepSeek V4 sẽ giúp chúng ta có cảm nhận rõ ràng hơn.

Bản V4 Preview cung cấp đồng thời hai model. Các thông số và kết quả benchmark dưới đây trích xuất từ báo cáo chính thức của DeepSeek, đại diện cho kết quả do nhà sản xuất công bố, không đồng nghĩa với kết quả đánh giá độc lập của bài viết này:

| Quy cách | `deepseek-v4-pro` | `deepseek-v4-flash` |
| --- | --- | --- |
| Tổng số tham số | **1.6T** | **284B** |
| Tham số kích hoạt mỗi token | 49B | 13B |
| Context Window | **1M tokens** | **1M tokens** |
| Chế độ suy luận | Non-thinking / Think High / Think Max | Non-thinking / Think High / Think Max |
| Giấy phép mã nguồn mở | MIT | MIT |

Một số số liệu đáng chú ý trong báo cáo chính thức:

- **V4-Pro đạt điểm Codeforces 3206**, đứng đầu trong số các model đối chứng được chọn trong báo cáo
- **SWE-bench Verified đạt 80.6%**, điểm số của Claude Opus 4.6 đối chứng trong báo cáo là 80.8%; con số này không thể suy diễn trực tiếp rằng năng lực hay chi phí của cả hai là tương đương trên một codebase cụ thể
- **Trong kịch bản context 1M**, FLOPs suy luận trên mỗi token của V4-Pro chỉ bằng **27%** so với V3.2, và mức chiếm dụng KV cache chỉ bằng **10%**

Tên gọi và điểm số của các đối thủ cạnh tranh ở đây là ảnh chụp lịch sử tại thời điểm phát hành báo cáo V4 Preview, không đại diện cho bảng xếp hạng model tại thời điểm bạn đọc bài viết này.

![Dữ liệu Benchmark của V4](/media/jg/ext/oss.javaguide.cn/ai/coding/deepseek-v4/v4-benchmark-7b6548e4.png)

Xem tiếp về biểu giá:

| Biểu giá API (mỗi 1 triệu token, tính đến 24-08-2026) | `deepseek-v4-flash` | `deepseek-v4-pro` |
| --- | --- | --- |
| Input (Cache Miss) Giờ thấp điểm / Cao điểm | $0.22 / $0.44 | $0.66 / $1.32 |
| Input (Cache Hit) Giờ thấp điểm / Cao điểm | $0.007 / $0.014 | $0.022 / $0.044 |
| Output Giờ thấp điểm / Cao điểm | $0.66 / $1.32 | $1.98 / $3.96 |

> Giờ cao điểm tính theo giờ Bắc Kinh từ Thứ Hai đến Thứ Sáu: 9:00-12:00, 14:00-18:00; các khung giờ còn lại (gồm cả cuối tuần) là giờ thấp điểm, đơn giá bằng một nửa giờ cao điểm.

Chi phí hóa đơn thực tế phụ thuộc rất lớn vào tỷ lệ hit cache, độ dài context và dung lượng output. Việc so sánh chi phí giữa các nhà cung cấp cần quy chuẩn thống nhất về input, output, cache và số lần retry. Giá có thể biến động, bạn nên kiểm tra lại [Trang biểu giá chính thức của DeepSeek](https://api-docs.deepseek.com/quick_start/pricing/).

Nhìn vào biểu giá này, Flash phù hợp rõ rệt cho các tác vụ nhạy cảm về chi phí, kết quả dễ dàng kiểm tra; còn việc có phù hợp cho đối thoại hàng ngày, tạo nội dung hay hỏi đáp đơn giản hay không cần kiểm nghiệm thêm về chất lượng và độ trễ thực tế.

Bản thân việc chuyển đổi tên model không phức tạp, nhưng vẫn cần test hồi quy về độ dài context, khả năng gọi tool và xử lý lỗi, không thể xem đây là thao tác "không tốn chi phí chuyển đổi". Mốc thời gian nhà phát hành dừng hỗ trợ các model cũ là **2026-07-24 15:59 UTC (23:59 giờ Bắc Kinh)**; nếu đọc bài viết này sau thời điểm đó, hãy kiểm tra danh sách model để xác nhận ID cũ còn dùng được không.

## Đề xuất Kịch bản Sử dụng

| Kịch bản | Đề xuất | Trọng tâm kiểm chứng |
| --- | --- | --- |
| Đối thoại hàng ngày, tạo nội dung, hỏi đáp đơn giản | Ưu tiên thử `deepseek-v4-flash` | Chất lượng, độ trễ và tỷ lệ hit cache |
| Agent Coding, tái cấu trúc code, phân tích toàn bộ dự án | Ưu tiên thử `deepseek-v4-pro` | Gọi tool, sửa đổi xuyên file, tỷ lệ pass test và chi phí thực tế |
| Lập trình phức tạp rủi ro cao và thẩm định độc lập | So sánh đối chiếu với Claude Fable 5, GPT-5.6... | Tính khả dụng tài khoản, tỷ lệ thành công, ranh giới an toàn và tổng chi phí |

Dòng cuối cùng phản ánh ảnh chụp nhanh các dòng model tính đến 2026-07-24; loại model cụ thể và tính khả dụng cần căn cứ vào tài khoản và tài liệu chính thức.

## Tổng kết

Từ các tác vụ thực chiến trong bài viết, V4-Pro đã có thể hoàn thành tốt việc cập nhật cấu hình model, chẩn đoán migration và sàng lọc audit code ban đầu. Các số liệu như SWE-bench Verified 80.6% và Codeforces 3206 trong báo cáo chính thức có thể dùng làm tham khảo, nhưng không thể thay thế việc đánh giá trực tiếp trên codebase của chính đội ngũ bạn.

Việc V4-Pro có kinh tế hay không phụ thuộc nhiều vào tỷ lệ hit cache và độ dài tác vụ. V4-Flash rẻ hơn nhiều, nhưng trong tác vụ phỏng vấn vẫn xuất hiện câu trả lời bị bỏ sót, không nên dùng làm lực lượng lập trình chủ lực mà thiếu đi sự rà soát của con người.

Lập trình phức tạp, hỏi đáp chuyên sâu và suy luận khoa học tiên tiến vẫn cần đối chiếu linh hoạt giữa các model tùy theo từng bài toán. Lựa chọn thực tế của mình là: các tác vụ hàng loạt rủi ro thấp ưu tiên dùng Flash, các sửa đổi xuyên file và khắc phục sự cố trọng yếu giao cho model mạnh hơn, đồng thời luôn duy trì việc kiểm thử tự động và nghiệm thu thủ công.
