---
title: "Sử dụng Claude Code và Codex trong IDEA: Hướng dẫn nhập môn CC GUI"
description: "CC GUI là một plugin JetBrains mã nguồn mở cung cấp giao diện trực quan cho Claude Code và OpenAI Codex. Lấy bản v0.4.7 làm mốc, bài viết giới thiệu cài đặt, xác thực, Diff, Agent, MCP và các ranh giới thực tế."
category: Thực chiến AI Coding
lang: vi
sourceRef: zh-ref/ai-coding/project/cc-guide.md
head:
  - - meta
    - name: keywords
      content: CC GUI,Claude Code,Codex,Plugin IDEA,JetBrains,AI Coding,Agent,MCP,Lập trình trực quan
---

Xin chào các bạn, mình là Tiểu G. Trước đây mình đã chia sẻ bài viết [Thực chiến sử dụng IDEA kết hợp plugin Qoder](https://mp.weixin.qq.com/s/vz5A7fQh8WxqVBHscqHzQA). Trong bài viết này, chúng ta hãy cùng tìm hiểu thêm một plugin JetBrains khác: **CC GUI**.

> **Lưu ý về phiên bản**: Các tính năng và ảnh chụp màn hình bên dưới được tổng hợp theo CC GUI v0.4.7 (2026-07-24). Plugin này được cập nhật khá nhanh, cách thức cài đặt và xác thực vui lòng đối chiếu theo README của dự án và giao diện thực tế tại thời điểm bạn sử dụng.

## CC GUI là gì

**CC GUI** (tên ban đầu là Claude Code GUI) là một plugin JetBrains mã nguồn mở theo giấy phép MIT, cung cấp giao diện GUI trực quan cho Claude Code và OpenAI Codex.

![Giao diện dự án CC GUI trên GitHub](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/cc-gui-github-project-917b1486.png)

Địa chỉ dự án: [zhukunpenglinyutong/jetbrains-cc-gui](https://github.com/zhukunpenglinyutong/jetbrains-cc-gui).

Nếu bạn đã từng đọc các bài viết trước của mình, có lẽ bạn đã khá quen thuộc với giao thức **ACP (Agent Client Protocol)**. Nó định nghĩa một bộ giao diện tương tác chuẩn giữa Agent và IDE; việc có thực sự kết nối được hay không phụ thuộc vào phiên bản giao thức, năng lực và phương thức xác thực mà hai bên triển khai.

Tích hợp Agent có sẵn của JetBrains, các Agent trong ACP Registry và các ACP Agent do người dùng tự cấu hình thủ công là các tầng năng lực khác nhau, không thể gọi chung là "plugin chính thức". Các Agent khả dụng cũng sẽ thay đổi theo phiên bản IDE, plugin và tài khoản.

CC GUI và ACP là hai lộ trình khác nhau:

- **Lộ trình JetBrains/ACP**: Sử dụng tích hợp sẵn của IDE, Registry Agent hoặc ACP Agent tùy chỉnh, trọng tâm là tái sử dụng AI Chat, Diff và năng lực context của JetBrains; tính năng phụ thuộc vào triển khai cụ thể của từng Agent.
- **Lộ trình CC GUI**: Sử dụng plugin cộng đồng độc lập để bổ sung các tính năng GUI như quản lý phiên làm việc (session), gửi hình ảnh, Agent, MCP cho Claude Code và Codex; phạm vi hỗ trợ căn cứ theo phiên bản hiện tại của CC GUI.

Hai hướng tiếp cận này không xung đột lẫn nhau, bạn có thể lựa chọn tùy theo sở thích cá nhân.

Lấy bản v0.4.7 làm mốc, các năng lực được đề cập trong bài viết này bao gồm:

- **Hỗ trợ động cơ kép (Dual-Engine)**: Kết nối đồng thời cả Claude Code và OpenAI Codex, chuyển đổi linh hoạt theo nhu cầu trong phần cài đặt nhà cung cấp (provider).
- **Hội thoại trực quan**: Hỗ trợ tham chiếu `@file`, gửi hình ảnh, hoàn tác (rollback) hội thoại, trực quan hơn nhiều so với CLI.
- **Agent + MCP**: Tích hợp sẵn hệ thống Agent và các lệnh gạch chéo (Slash command, chẳng hạn như [điều phối /loop](https://mp.weixin.qq.com/s/apkuuxHmC1c6bR0kWhgmUA), [code review /simplify](https://mp.weixin.qq.com/s/Np3oaBmdJAE319wuT7zHBw)), hỗ trợ mở rộng MCP.
- **So sánh Diff**: Các thay đổi mã nguồn hiển thị Diff trực tiếp bên trong IDEA, hỗ trợ điều hướng tệp và nhảy đến mã nguồn (code navigation).
- **Quản lý phiên (Session Management)**: Lịch sử, tìm kiếm, đánh dấu yêu thích và xuất dữ liệu.

## Cài đặt và cấu hình

### Bước 1: Cài đặt plugin và SDK

Mở IDEA, vào **Settings → Plugins** (phím tắt `Cmd + ,` trên macOS hoặc `Ctrl + Alt + S` trên Windows), tìm kiếm **CC GUI** và tiến hành cài đặt.

![Plugin CC GUI trong IDEA](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/idea-plugin-cc-gui-2a5e3d62.png)

Sau khi cài đặt xong, bạn có thể tìm thấy biểu tượng CC GUI ở thanh công cụ bên phải của IDEA, nhấp vào biểu tượng để mở bảng điều khiển.

![Lối vào CC GUI trong IDEA](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/idea-cc-gui-entry-c260760d.png)

Lần đầu sử dụng, plugin sẽ nhắc bạn cài đặt Claude Code/Codex SDK. Đây là nền tảng để Agent vận hành, hãy nhấp vào và hoàn tất cài đặt theo hướng dẫn trên giao diện. Thời gian cài đặt phụ thuộc vào đường truyền mạng và môi trường máy của bạn.

![Cài đặt thành công Claude Code/Codex SDK](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/sdk-installed-success-1d7848b8.png)

**Gặp lỗi màn hình đen?** Một số người dùng trên IDEA 2026.1 khi mở bảng điều khiển CC GUI sẽ bị hiện tượng màn hình đen.

Trước tiên hãy thử xóa cache trình duyệt tích hợp của IDE. Nếu vẫn không được, trong phần Issue của dự án có người đã khắc phục bằng cách vào **Help → Edit Custom VM Options** và thêm các tham số sau:

```bash
-Dide.browser.jcef.out-of-process.enabled=false
-Dide.browser.jcef.gpu.disable=true
```

Sau khi thêm xong, hãy khởi động lại IDEA để kiểm tra lại. Tham số này chỉ là một giải pháp tình thế (workaround) có tác dụng trong một số môi trường JCEF/card đồ họa nhất định. Tính đến 2026-07-24, Issue liên quan vẫn chưa được đóng, vì vậy không nên coi đây là bản sửa lỗi dứt điểm; các tham số này cũng có thể ảnh hưởng đến cơ chế cô lập tiến trình hoặc tăng tốc phần cứng của JCEF. Chi tiết xem tại: <https://github.com/zhukunpenglinyutong/jetbrains-cc-gui/issues/813>.

### Bước 2: Cấu hình nhà cung cấp mô hình (Model Provider)

Nhấp vào cài đặt nhà cung cấp (Provider Settings) và cấu hình theo các phương thức xác thực mà plugin hiện đang hỗ trợ:

- **Đăng nhập Claude.ai OAuth**: Gói thuê bao Claude được ủy quyền qua tài khoản Claude.ai để sử dụng Claude Code.
- **Anthropic API Key**: API Key lấy từ Anthropic Console, tính phí riêng theo mức sử dụng API; thuê bao Claude.ai không tự động cấp API Key.
- **Tái sử dụng trạng thái đăng nhập của Claude Code CLI**: Nếu phiên bản plugin hiện tại hỗ trợ, bạn có thể tái sử dụng trạng thái đăng nhập Claude.ai OAuth sẵn có; điều này không đồng nghĩa với việc đọc thông tin xác thực từ `settings.json`.
- **Import cấu hình Provider cục bộ**: `settings.json` là tệp chứa cấu hình, có thể bao gồm các thiết lập về model, endpoint hoặc API. Trước khi import, cần xác nhận các trường mà plugin thực tế sẽ đọc cũng như cơ chế lưu trữ khóa bảo mật.
- **Import cấu hình cc-switch**: cc-switch là công cụ quản lý nhà cung cấp Claude Code phổ biến trong cộng đồng, CC GUI tương thích với cấu hình này, chỉ cần import là có thể dùng ngay.
- **Endpoint proxy của bên thứ ba**: Có thể cấu hình endpoint tùy chỉnh, tuy nhiên tính tương thích, xử lý dữ liệu và an toàn bảo mật khóa sẽ do dịch vụ proxy đó quyết định.

Về phương thức xác thực của Claude Code, bạn có thể tham khảo [Tài liệu xác thực chính thức](https://code.claude.com/docs/en/authentication). Codex chính thức hỗ trợ cả đăng nhập bằng tài khoản ChatGPT lẫn API Key, với các gói cước và cách tính phí khác nhau; việc CC GUI có hỗ trợ luồng đăng nhập tương ứng hay không tùy thuộc vào phiên bản plugin hiện tại, chi tiết xem tại [Tài liệu xác thực Codex](https://developers.openai.com/codex/auth).

Ảnh chụp màn hình trong bài viết sử dụng phương thức import trực tiếp cấu hình cc-switch.

![Import trực tiếp cấu hình cc-switch](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/cc-switch-config-import-a4adec2d.png)

### Bước 3: Bắt đầu sử dụng

Sau khi cấu hình hoàn tất, bạn có thể bắt đầu trò chuyện trực tiếp tại bảng điều khiển bên phải. Khuyến nghị bạn nên thử trước các tác vụ đơn giản, chẳng hạn như "Hãy phân tích cấu trúc thư mục của dự án hiện tại", để trải nghiệm khả năng nhận biết context của nó.

Ở đây chúng ta lấy một tình huống thường gặp trong phát triển hàng ngày làm ví dụ: **Review mã nguồn hiện có xem có đúng quy chuẩn không và sửa lỗi hàng loạt**. Việc này nếu làm thủ công thì cực kỳ nhàm chán—mở từng tệp, đối chiếu từng dòng với quy chuẩn, phát hiện vấn đề, sửa bằng tay, rồi sang tệp tiếp theo…

CC GUI hỗ trợ **Skill (lệnh gạch chéo /)**, giúp đóng gói quy trình review cụ thể thành hướng dẫn có thể tái sử dụng. Ví dụ, mình đã cấu hình một Skill tên là `java-coding-standards`, trong đó chứa các quy tắc review dự án Java và Spring Boot.

Ở đây chúng ta trực tiếp lấy dự án [Nền tảng phỏng vấn thông minh AI](https://javaguide.cn/zhuanlan/interview-guide.html) làm ví dụ. Khi sử dụng, chỉ cần nhập vào khung chat:

```
/java-coding-standards Kiểm tra code trong thư mục @infrastructure
```

`/java-coding-standards` sẽ tải các quy tắc review, còn `@infrastructure` chỉ định phạm vi kiểm tra. Trong lần thử nghiệm này, Agent đã đọc 14 tệp Java trong thư mục và xuất ra một báo cáo có cấu trúc:

| Mức độ nghiêm trọng | Vấn đề | Tệp liên quan | Số lượng |
| ------------------- | ------ | ------------- | -------- |
| Cao | Ghi log `log.error("xxx: {}", e.getMessage())` làm mất stack trace | FileHashService | 3 chỗ |
| Cao | BusinessException thiếu ErrorCode | RedisService | 1 chỗ |
| Trung bình | Dùng trực tiếp tên lớp đủ điều kiện (`java.util.function.Function`) | InterviewMapper, ResumeMapper | 7 chỗ |
| Trung bình | Trả về `Map<String, Object>` thay vì DTO chuyên dụng | InterviewMapper | 2 chỗ |
| Thấp | Tài nguyên font chữ không sử dụng try-with-resources | PdfExportService | 1 chỗ |
| Thấp | DateTimeFormatter bị tạo mới lặp đi lặp lại mỗi lần gọi | FileStorageService | 1 chỗ |

![Báo cáo review có cấu trúc từ java-coding-standards](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/java-coding-standards-structured-review-report-d7a4b769.webp)

Sau khi nhận được báo cáo, bạn có thể để AI sinh ra các phương án sửa đổi cho từng tệp, rồi kiểm tra từng thay đổi và lý do sửa trong bảng Diff.

Lần demo này liên quan đến 9 tệp và hơn 20 vị trí thay đổi. Từ khâu review, sinh code sửa lỗi đến hoàn thành một lần kiểm chứng biên dịch mất chưa đầy năm phút. Thời gian này chỉ đại diện cho trường hợp mẫu cụ thể; quy mô mã nguồn, mô hình, trạng thái cache và yêu cầu nghiệm thu khác nhau sẽ cho kết quả khác nhau.

**Giá trị của Skill**: Nó đóng gói "cần review cái gì, làm theo các bước nào" thành một lối vào có thể tái sử dụng, giảm bớt việc phải giải thích lặp đi lặp lại mỗi lần. Nó có thể nâng cao tính nhất quán trong tiêu chí kiểm tra, nhưng không thể đảm bảo kết quả hoàn toàn giống nhau giữa các mô hình hay các context khác nhau; các tiêu chuẩn nhóm vẫn nên được lưu trữ trong các quy tắc có kiểm soát phiên bản (version control), công cụ phân tích tĩnh (static analysis) và quy trình Review mã nguồn.

Để tham khảo danh sách các Vibe Coding Skills hữu ích và giải đáp thắc mắc thường gặp về Skills, bạn có thể đọc hai bài viết sau của mình:

1. [Danh sách chọn lọc AI Coding Skills: Làm rõ yêu cầu, TDD, Code Review và thiết kế UI](https://javaguide.cn/ai-coding/practices/programmer-essential-skills.html)
2. [Agent Skills là gì? Khác gì so với Prompt và MCP?](https://mp.weixin.qq.com/s/5iaTBH12VTH55jYwo4wmwA)

## Các tính năng tích hợp sẵn của CC GUI

CC GUI còn tích hợp sẵn tính năng thống kê sử dụng, giúp bạn thấy rõ lượng tiêu thụ Token, thống kê chi phí và phân tích xu hướng sử dụng.

![Thống kê sử dụng của CC GUI](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/cc-gui-usage-stats-50e5d0f9.png)

Plugin cũng hỗ trợ Commit AI, tùy chỉnh Agent, quản lý kho lưu trữ prompt, thêm MCP server và nhiều tính năng khác.

![Tính năng Commit AI của CC GUI](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/cc-gui-commit-ai-c5b569b1.png)

Ngoài ra, bạn cũng có thể xem lại lịch sử tin nhắn, hỗ trợ tìm kiếm và xóa:

![Lịch sử tin nhắn Claude Code](/media/jg/ext/oss.javaguide.cn/javaguide/ai/cc-guide/claude-code-history-c09b7b98.png)

## Nên chọn CC GUI hay Qoder?

Hai plugin này có định vị khác nhau, hãy cùng so sánh nhanh:

| Tiêu chí | CC GUI | Qoder |
| -------- | ------ | ----- |
| **Định vị** | Lớp vỏ GUI cho Claude Code / Codex | Agent lập trình AI độc lập |
| **Mã nguồn mở** | Giấy phép MIT, hoàn toàn mã nguồn mở | Mã nguồn đóng, do Alibaba phát triển |
| **Mô hình** | Claude Code + Codex, phạm vi hỗ trợ theo phiên bản | Mô hình tích hợp sẵn và tùy chọn hiện tại |
| **Context** | Tham chiếu `@file` + gửi ảnh | `@database` + `@file` |
| **Ngữ cảnh phù hợp** | Muốn dùng quy trình CLI hiện có bên trong JetBrains | Muốn sử dụng Agent tất-cả-trong-một (all-in-one) |
| **Tối ưu hóa Java** | Đa dụng chung | Tối ưu hóa rất tốt cho hệ sinh thái Java |

**Lời khuyên của mình:**

- **Đã có quy trình làm việc với Claude Code hoặc Codex** → Có thể đánh giá CC GUI, nhưng trước tiên hãy xác nhận phương thức xác thực và ánh xạ tính năng mà plugin hỗ trợ; GUI không đảm bảo kế thừa toàn bộ 100% năng lực của CLI.
- **Muốn dùng được ngay (out-of-the-box), không muốn mất công cấu hình API** → Chọn Qoder, chỉ cần đăng ký là dùng được.
- **Cài cả hai cũng hoàn toàn được** → Chúng không xung đột với nhau, có thể chuyển đổi sử dụng tùy theo ngữ cảnh tác vụ.

## Tổng kết

Giá trị cốt lõi của CC GUI là **hoàn thiện quy trình làm việc trực quan cho người dùng JetBrains**. Nó gom các thao tác vốn phân tán ở terminal, trình soạn thảo, công cụ chụp màn hình, trình quản lý tệp về lại một nơi duy nhất bên trong IDE.

Nếu bạn chủ yếu làm việc trên JetBrains và muốn quản lý các phiên làm việc của Claude Code hoặc Codex ngay trong IDE, bạn có thể dùng thử CC GUI trên một dự án thử nghiệm, sau đó căn cứ vào phương thức xác thực, tính tương thích tính năng và yêu cầu an toàn của nhóm để quyết định xem có nên đưa vào quy trình làm việc hàng ngày hay không.
