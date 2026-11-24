---
title: "Best Practices cho CLAUDE.md: Nên viết gì, không nên viết gì và cách chia nhỏ khi dự án phình to"
description: "Giải thích các quy tắc dự án phù hợp đưa vào CLAUDE.md, cùng cách phối hợp với .claude/rules và Auto Memory để quản lý, bảo trì các quy tắc này hiệu quả."
category: Thực chiến lập trình AI
head:
  - - meta
    - name: keywords
      content: CLAUDE.md, Claude Code, lập trình AI, quy chuẩn dự án AI, Agentic Coding, AI-assisted development, best practices CLAUDE.md, .claude/rules
lang: vi
sourceRef: zh-ref/ai-coding/practices/claude-md-best-practices.md
---

Xin chào, mình là Tiểu G. Mấy hôm trước khi chia sẻ về [Mẹo sử dụng Claude Code](https://javaguide.cn/ai-coding/practices/claudecode-tips.html), mình có giới thiệu sơ qua về `CLAUDE.md`. Dưới phần bình luận có bạn đọc hỏi liệu có thể viết riêng một bài chuyên sâu về file này hay không.

Nhiều bạn khi lần đầu nhìn thấy `CLAUDE.md` sẽ lầm tưởng nó là một bản README thứ hai. README chủ yếu viết cho con người đọc để hiểu tổng quan dự án, còn `CLAUDE.md` lại cung cấp chỉ dẫn làm việc cho Claude Code: ví dụ dự án khởi động thế nào, những file nào không được sửa, định dạng response của API là gì, sau khi sửa code xong bắt buộc phải chạy những bước kiểm tra nào.

Những nội dung này dĩ nhiên bạn có thể nhắc lại ở đầu mỗi session trò chuyện mới, nhưng rất dễ bị quên hoặc thiếu sót. Những quy tắc có hiệu lực dài hạn mà Claude không thể suy luận chính xác từ mã nguồn thì việc viết sẵn vào `CLAUDE.md` là cách làm tối ưu hơn cả.

Bài viết này kết hợp giữa [tài liệu chính thức của Claude Code](https://code.claude.com/docs/en/best-practices) và kinh nghiệm thực chiến của cá nhân mình, nhằm làm rõ `CLAUDE.md` nên viết gì, cách phân chia khi dự án lớn dần và bảo trì lâu dài ra sao.

Một lưu ý nhỏ: Claude Code cập nhật rất nhanh, hai phần `.claude/rules/` và Auto Memory đặc biệt dễ thay đổi theo phiên bản. Bài viết này được đối chiếu theo tài liệu chính thức ngày 2026-07-24. Trước khi áp dụng vào thực tế, bạn hãy dùng `claude --version` để kiểm tra phiên bản, rồi dùng `/context` để xem các chỉ dẫn thực tế được nạp vào session; lệnh `/memory` chủ yếu dùng để xem và chỉnh sửa vị trí cấu hình của rules và memory.

## CLAUDE.md là gì?

`CLAUDE.md` là file chỉ dẫn lâu dài của Claude Code, có thể đặt ở nhiều vị trí khác nhau như cấp user, cấp project... Sau khi đọc file này, Claude Code sẽ căn cứ vào các câu lệnh, quy ước và giới hạn bên trong để làm việc trên dự án hiện tại.

Những nội dung thích hợp đưa vào gồm có:

- Quy tắc mà Claude thường hay đoán sai
- Quy ước ngầm định không đọc được từ mã nguồn
- Quy chuẩn bắt buộc toàn team phải tuân thủ
- Phiên bản tech stack, câu lệnh thông dụng, đánh đổi kiến trúc và các "cạm bẫy" kinh nghiệm của dự án

Để đánh giá một nội dung có cần thiết giữ lại hay không, bạn hãy tự hỏi:

> Nếu xóa dòng này đi, Claude có dễ phạm lỗi hơn không?

Nếu có, hãy giữ lại; nếu không, nhiều khả năng nó chỉ đang làm lãng phí không gian context.

## CLAUDE.md khác gì so với các file quy tắc khác?

![Cách phân công giữa CLAUDE.md và các file quy tắc khác](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-rule-files-relationship-66d1a6af.png)

### CLAUDE.md vs AGENTS.md

| Tiêu chí | CLAUDE.md | AGENTS.md |
| --- | --- | --- |
| **Ai đọc** | Dành riêng cho Claude Code | Tiêu chuẩn mở dùng chung cho nhiều công cụ như OpenAI Codex, Cursor, Google Jules |
| **Định vị** | File quy tắc dự án của Claude Code | File chỉ dẫn Agent dùng chung xuyên suốt các công cụ |

![CLAUDE.md và AGENTS.md](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-agents-md-34bac2a9.png)

**AGENTS.md** hướng tới nhiều coding agent khác nhau, còn **CLAUDE.md** là lối vào chuyên biệt của Claude Code. Khi repository sử dụng cả hai loại file, bạn có thể để chúng cùng tái sử dụng một bộ chỉ dẫn nền tảng.

Trong `AGENTS.md`, team cũng có thể quy ước một khu vực dành riêng cho "Các lỗi phổ biến đã được xác nhận", nhưng Agent sẽ không tự động ghi nhận lỗi chỉ vì file đó tồn tại, và càng không đảm bảo rằng cứ ghi một quy tắc vào là lần sau nó sẽ không bao giờ tái phạm. Ghi cái gì vào, ai là người review và khi nào nên xóa cần được quy định rõ trong workflow của team.

Nếu dự án của bạn đã có sẵn `AGENTS.md` phục vụ các coding agent khác, bạn hoàn toàn có thể tạo một file `CLAUDE.md` import trực tiếp `AGENTS.md`, giúp cả hai công cụ cùng tái sử dụng một bộ quy tắc cơ sở mà không phải bảo trì hai nơi:

```markdown
@AGENTS.md

## Claude Code Specific Instructions

- Sử dụng plan mode khi thao tác với các thay đổi dưới `src/billing/`
```

Trong bài viết [Tìm hiểu toàn diện về Harness Engineering](https://javaguide.cn/ai/agent/harness-engineering.html), mình từng giới thiệu một ví dụ: file `AGENTS.md` nội bộ của OpenAI chỉ dài khoảng 100 dòng, chủ yếu đóng vai trò làm mục lục trỏ tới các tài liệu thiết kế chi tiết, sơ đồ kiến trúc, kế hoạch thực thi và tiêu chuẩn chất lượng trong thư mục `docs/`. Agent sẽ đọc file mục lục trước, khi làm đến tác vụ liên quan mới nạp thêm tài liệu chi tiết, tránh việc nhồi nhét toàn bộ thông tin vào context ngay từ đầu.

### CLAUDE.md vs .claude/rules/

| Tiêu chí | CLAUDE.md | `.claude/rules/` |
| --- | --- | --- |
| **Cách thức nạp** | File ở thư mục gốc/cấp dự án thường nạp khi session khởi động; file ở thư mục con nạp on-demand khi đọc thư mục đó | Quy tắc không có `paths` nạp khi khởi động; quy tắc có `paths` chỉ nạp khi Claude đọc các file khớp mẫu |
| **Kịch bản áp dụng** | Quy tắc chung toàn cục | Quy tắc chuyên biệt chỉ áp dụng cho file/thư mục cụ thể |
| **Tiêu tốn context** | Quy tắc gốc/cấp dự án chiếm dụng context liên tục | Chỉ các rule có path-scoped mới tiêu tốn context on-demand; rule toàn cục vẫn chiếm dụng liên tục |

Các quy tắc chuẩn hóa backend API, cấu hình test chỉ áp dụng cho thư mục cụ thể nên được đưa vào `.claude/rules/`, không cần nhồi nhét tiếp vào `CLAUDE.md` ở thư mục gốc.

Cần lưu ý hai điểm:

1. Thư mục `.claude/rules/` không phải là thư mục mặc định tự sinh ra sau khi cài Claude Code, bạn cần chủ động tạo thủ công khi cần.
2. Các rule có frontmatter `paths` sẽ nạp dựa theo kết quả khớp file; rule không có `paths` vẫn sẽ được nạp như một quy tắc toàn cục vào context. Do đó, bản thân việc tạo thư mục `.claude/rules/` không tự động giúp giảm tiêu tốn context nếu không cấu hình path scoping.

### CLAUDE.md vs SPEC.md

| Tiêu chí | CLAUDE.md | SPEC.md |
| --- | --- | --- |
| **Mục đích** | Quy tắc dự án (Làm việc như thế nào) | Đặc tả yêu cầu (Làm cái gì) |
| **Nội dung** | Chuẩn coding, lệnh thông dụng, kinh nghiệm tránh lỗi, quy ước team | Ranh giới yêu cầu, định nghĩa tính năng, tiêu chuẩn nghiệm thu (tương tự PRD dành cho AI) |
| **Đối tượng dùng** | AI coding assistant (lập trình hằng ngày) | Quy trình Spec Coding (phát triển dựa trên đặc tả) |

`SPEC.md` là tên file mà một số team thực hành **Spec Coding** thường dùng, với chu trình `Specify → Design → Implement → Test`. Mỗi công cụ có thể sử dụng các file và giai đoạn khác nhau như requirements, design, tasks, plan; không có một quy chuẩn cứng nhắc bắt buộc duy nhất nào.

![Pipeline quy trình Spec Coding phát triển dựa trên đặc tả](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/spec-coding-pipeline-flow-8a20fb26.png)

Trong sơ đồ trên, `requirements.md` là file yêu cầu sinh ra ở giai đoạn `Specify`; các team khác cũng có thể gom các đặc tả tác vụ tương tự vào `SPEC.md`.

Nói một cách ngắn gọn: **CLAUDE.md quản lý quy chuẩn hành vi dài hạn, còn Spec quản lý ràng buộc của nhiệm vụ hiện tại.**

### Lựa chọn thực tế thế nào?

- **CLAUDE.md**: Quy chuẩn hành vi dành riêng cho Claude Code; cấp gốc/user nạp lúc bắt đầu session, quy tắc thư mục con nạp theo nhu cầu.
- **AGENTS.md**: Quy tắc "làm việc thế nào" dùng chung cho nhiều công cụ, có thể được `CLAUDE.md` import để tái sử dụng.
- **`.claude/rules/`**: Thư mục quy tắc cục bộ; không có `paths` thì tương tự quy tắc toàn cục, có `paths` thì chỉ kích hoạt khi xử lý file phù hợp.
- **SPEC.md**: File đặc tả yêu cầu, định nghĩa lần này cần làm gì, là một mắt xích trong quy trình Spec Coding.

## CLAUDE.md rốt cuộc nên viết những gì?

Trước hết hãy xem một cách viết phản khuôn mẫu (antipattern) mà mình rất hay gặp. Rất nhiều bạn sau khi chạy `/init`, thấy Claude tự sinh ra một file `CLAUDE.md`, nghĩ bụng "có vẫn hơn không", thế là để nguyên xi không sửa dòng nào rồi commit lên Git:

```markdown
# Giới thiệu dự án

Đây là một dự án Spring Boot, sử dụng Java 17 và Maven.

# Phong cách code

- Viết code sạch sẽ
- Tuân thủ best practices
- Đảm bảo tính dễ đọc của code

# Workflow

- Chạy test trước khi commit
- Giữ cấu trúc code ngăn nắp
```

Những câu chữ này về mặt đạo lý không có gì sai, nhưng chúng hầu như không tác động được đến hành vi thực tế của Claude. Lấy câu "Viết code sạch sẽ" làm ví dụ: kể cả bạn xóa câu này đi, Claude khi sinh code vẫn sẽ cố gắng viết ra đoạn code dễ đọc nhất có thể. Để nó lại trong file chỉ làm lãng phí dung lượng context một cách vô ích.

`CLAUDE.md` sẽ chia sẻ không gian context cùng với system prompt, lịch sử hội thoại và các file được đọc vào. Anthropic đã chỉ rõ trong tài liệu chính thức: **Khi cửa sổ context bị lấp đầy, hiệu năng tổng thể của Claude sẽ suy giảm.**

![Tại sao context bị suy giảm hiệu quả](/media/jg/ext/oss.javaguide.cn/javaguide/ai/context-engineering/why-does-the-following-content-fail-7c336a26.png)

File càng dài, không gian dành cho hội thoại và code càng ít, và những quy tắc thực sự quan trọng sẽ càng dễ bị chìm nghỉm giữa hàng đống chữ.

Anthropic khuyến nghị nên giữ `CLAUDE.md` thật tinh gọn, không vượt quá 200 dòng, chỉ lưu lại những thông tin mà Claude không thể dễ dàng suy luận ra từ code. Nếu nội dung tiếp tục phình to, hãy tách sang `.claude/rules/` có `paths` hoặc đưa các tài liệu ít dùng vào Skills.

![Khuyến nghị của tài liệu chính thức Claude Code về CLAUDE.md](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claudemd-claude-docs-95f47141.png)

Khi rà soát `CLAUDE.md`, bạn hãy tự hỏi từng dòng: "Xóa dòng này đi, Claude có dễ phạm phải lỗi tương tự không?" Giữ lại những quy tắc có tác động rõ rệt; những câu vô thưởng vô phạt hãy mạnh dạn xóa bỏ, sau này gặp vấn đề thực tế thì mới bổ sung.

### Những thứ NÊN viết

Có năm nhóm nội dung thực sự đáng để đưa vào `CLAUDE.md`:

**1. Thông tin Tech Stack và phiên bản.**

Sự khác biệt về phiên bản framework ảnh hưởng trực tiếp đến kết quả sinh code. Ví dụ, Spring Boot 2 và 3 có cấu hình rất khác nhau ở nhiều điểm; nếu không nói rõ phiên bản, Claude có thể tạo ra code không tương thích với dự án. Những dependency như MyBatis-Plus có thể đọc được từ `pom.xml`, nhưng lý do tại sao chọn nó mà không dùng JPA thì bắt buộc phải giải thích thêm.

**2. Các câu lệnh thông dụng.**

Ghi trực tiếp các lệnh compile, test, lint và start của dự án vào `CLAUDE.md`. Dùng code block hoặc inline code để giữ nguyên các cờ tham số, giúp Claude khi thực thi không cần phải tốn công dịch từ ngôn ngữ tự nhiên sang lệnh shell.

```markdown
# Commands

- Build: `mvn clean package -DskipTests`
- Test: `mvn test -pl module-name`
- Run: `mvn spring-boot:run -pl bootstrap`
- Lint: `mvn checkstyle:check`
```

**3. Quyết định kiến trúc và lý do đằng sau.**

Lý do đằng sau quy tắc sẽ định hướng cách Claude xử lý các tình huống tương tự. Trước đây trong dự án của mình chỉ ghi "Không viết SQL trực tiếp, hãy dùng QueryWrapper", nhưng Claude thỉnh thoảng vẫn viết SQL trong một số truy vấn. Sau đó mình bổ sung lý do: "Hệ thống SQL audit phụ thuộc vào việc phân tích Wrapper AST để ghi log kiểm toán." Ranh giới áp dụng lập tức trở nên rõ ràng, và các truy vấn khác nó đều tự giác dùng Wrapper.

**4. Quy ước team và các cạm bẫy đặc thù của dự án.**

Định dạng commit message (như `feat(scope): message`), quy chuẩn đặt tên branch, các phụ thuộc biến môi trường đều khó có thể nắm bắt chỉ bằng việc đọc code. Những thông tin mà thành viên mới khi vào dự án bắt buộc phải hỏi han người cũ thì rất thích hợp viết vào `CLAUDE.md`.

**5. Thông tin nhiệm vụ cần lưu giữ xuyên suốt các session.**

Khi mô tả nhiệm vụ, tiêu chuẩn nghiệm thu, độ ưu tiên, phụ thuộc và các điểm nghẽn cần được bảo lưu qua nhiều session khác nhau, bạn có thể tạo một file nhiệm vụ riêng, rồi để `CLAUDE.md` hoặc `AGENTS.md` trỏ tới nó. Như vậy vừa giữ được tiến độ công việc, vừa không làm xáo trộn các quy tắc dài hạn với nội dung thay đổi liên tục.

### Những thứ KHÔNG NÊN viết

**1. Quy tắc định dạng code (Code Style).**

Thụt lề mấy space, import sắp xếp thế nào, có để dấu chấm phẩy cuối dòng không — những việc này hãy giao trọn gói cho công cụ format.

Nếu dự án chưa cấu hình Checkstyle hay Prettier, hãy cấu hình công cụ trước, đừng dùng ngôn ngữ tự nhiên để làm thay công việc của linter/formatter.

**2. Hành vi mặc định của ngôn ngữ hoặc framework.**

Ví dụ:

- "Vue dùng `ref` / `reactive` để quản lý state phản ứng."
- "Entity class trong JPA ánh xạ tới bảng trong cơ sở dữ liệu."
- "SQL dùng `WHERE` để lọc điều kiện."

Đây là những kiến thức cơ bản hiển nhiên, viết vào chỉ làm tăng gánh nặng hiểu ngữ cảnh cho AI.

**3. Những đoạn tài liệu tham khảo quá dài.**

Tài liệu API bên ngoài, bảng tham số SDK chi tiết tuyệt đối không nên nhồi nhét cả đoạn dài vào đây. Chỉ cần để link là đủ, khi nào Claude thực sự cần đến nó sẽ tự truy cập để đọc.

### Các mẫu CLAUDE.md chuẩn mực

#### Ví dụ cấp User: Chặn đứng các thói quen xấu phổ biến

[andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) là một dự án tổng hợp rules/skills cho Claude Code do cộng đồng xây dựng, lấy cảm hứng từ các quan sát công khai của Andrej Karpathy về lỗi coding của LLM. Các quy tắc bên trong không phụ thuộc vào repository cụ thể nào, rất thích hợp đặt ở cấp user để hạn chế tình trạng làm việc lệch hướng.

Dưới đây là hình ảnh ví dụ từ repository này:

![andrej-karpathy-claudemd](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/andrej-karpathy-claudemd-9bac8393.png)

File này chỉ xử lý vài vấn đề có tần suất cao: kiểm tra giả định trước khi code, tránh trừu tượng hóa thái quá, giới hạn sửa đổi trong phạm vi nhiệm vụ, hoàn thành xong phải chạy test đối chiếu tiêu chí nghiệm thu. Số lượng quy tắc không nhiều nhưng mỗi điều đều gắn chặt với một hành vi có thể quan sát được.

#### Ví dụ cấp Dự án: Tóm lược quy tắc dự án thành bảng tra cứu nhanh

Dự án [interview-guide](https://javaguide.cn/zhuanlan/interview-guide.html) của mình sử dụng `CLAUDE.md` cấp dự án. File ở thư mục gốc giữ lại tech stack, lệnh thông dụng, ranh giới phân tầng, xử lý ngoại lệ, quy tắc transaction và danh sách điều cấm, các quy chuẩn chi tiết hơn thì giao cho `.claude/rules/`.

File gốc sau khi tinh gọn có thể viết như sau:

```markdown
# AI Interview Platform Rules

Nền tảng phỏng vấn Spring Boot 4.0 + Java 21 + Spring AI 2.0 + React.

## Tech Stack

- Backend: Spring Boot 4.0 / Java 21 / Gradle / Spring AI 2.0
- Database: PostgreSQL + pgvector (1024 chiều COSINE)
- Cache & MQ: Redis / Redisson / Redis Stream
- Frontend: React 18 + TypeScript + Vite + TailwindCSS 4 (`frontend/`)
- Mapping & Docs: MapStruct / OpenAPI / iText 8 / Apache Tika

## Commands

- Build: `./gradlew build`
- Test: `./gradlew test`
- Chạy backend: `./gradlew bootRun`
- Chạy frontend: `cd frontend && npm run dev`
- Lint frontend: `cd frontend && npm run lint`

## Architecture

- Dự án Gradle đơn module, chia package theo tính năng.
- Backend tuân thủ nghiêm ngặt phân tầng `Controller -> Service -> Repository`.
- Hạ tầng dùng chung đặt ở `common/`, bao gồm rate limit, gọi AI, tác vụ bất đồng bộ, cấu hình, exception, response thống nhất.
- Mã nguồn frontend đặt ở `frontend/`.
- Chi tiết cấu trúc dự án xem tại `docs/architecture.md`.

## Must Follow

- Controller chỉ làm nhiệm vụ validate tham số và bọc response, không viết business logic.
- Service đảm nhiệm điều phối nghiệp vụ, `@Transactional` chỉ đặt ở tầng Service.
- Repository chỉ chịu trách nhiệm truy xuất dữ liệu, không viết business logic.
- Response trả ra ngoài thống nhất dùng `Result<T>`.
- Ngoại lệ nghiệp vụ bắt buộc dùng `BusinessException(ErrorCode.XXX, "thông báo lỗi")`.
- Ánh xạ Entity bắt buộc dùng MapStruct, cấm tự viết logic chuyển đổi trùng lặp bằng tay.
- Các lệnh gọi LLM, S3, HTTP bên ngoài tuyệt đối không được đặt trong transaction của database.
- Lấy `ChatClient` thống nhất thông qua `LlmProviderRegistry`.
- Structured Output thống nhất dùng `StructuredOutputInvoker` để bọc cơ chế retry.
- Sản xuất/tiêu thụ Redis Stream dùng template `AbstractStreamProducer` / `AbstractStreamConsumer`.
- Rate limiting dùng `@RateLimit`, không tự viết logic giới hạn Redis rải rác.
- Tìm kiếm vector database dùng PostgreSQL + pgvector, 1024 chiều, khoảng cách COSINE.

## Never Do

- Không `throw new RuntimeException(...)`, bắt buộc dùng `BusinessException`.
- Không trả Entity trực tiếp về cho frontend.
- Không dùng `@Value` rải rác trong Service, cấu hình tập trung vào `@ConfigurationProperties`.
- Không inline tên class đầy đủ (FQN), hãy dùng import.
- Không gọi LLM, S3 hoặc HTTP bên ngoài bên trong database transaction.
- Không tự gọi nội bộ (self-invocation) method có `@Transactional` trong cùng một class.
- Không `catch (Exception e) {}` nuốt ngoại lệ âm thầm.
- Không gọi DB trong vòng lặp, ưu tiên thao tác batch.
- Không hardcode secret hoặc khóa bảo mật.
- Không dùng `Executors.newXxxThreadPool()`, bắt buộc khai báo tường minh `ThreadPoolExecutor`.

## More Rules

- Quy chuẩn mã lỗi: `.claude/rules/error-handling.md`
- Quy chuẩn Rate Limit: `.claude/rules/rate-limit.md`
- Quy chuẩn Redis Stream: `.claude/rules/redis-stream.md`
- Quy chuẩn gọi AI Service: `.claude/rules/ai-service.md`
- Quy chuẩn Database: `.claude/rules/database.md`
- Quy chuẩn Frontend: `.claude/rules/frontend.md`
```

## Viết thế nào để Claude thực sự tuân thủ?

Quy tắc cần tương ứng với các hành động rõ ràng và có thể kiểm chứng được kết quả thực thi.

### Quy tắc phải cụ thể và có thể kiểm chứng

Câu "chú ý tính dễ đọc của code" không đưa ra tiêu chuẩn có thể kiểm tra được. Đổi thành "tên hàm phải bắt đầu bằng động từ, một hàm không vượt quá 40 dòng", Claude mới biết chính xác phải làm gì và khi code review bạn cũng có thể đối chiếu trực tiếp.

### Lệnh cấm phải đi kèm giải pháp thay thế

Khi cấm điều gì, tốt nhất hãy đưa ra phương án thay thế: Không làm X, gặp tình huống này hãy dùng Y.

Lấy một ví dụ từ chính dự án của mình: trước đây Claude hay dùng field injection `@Autowired`, nhưng quy chuẩn của team là dùng constructor injection.

Ban đầu mình chỉ ghi "Không dùng `@Autowired` field injection". Hiệu quả rất kém: nó đúng là không dùng field injection nữa, nhưng lúc thì tự viết constructor bằng tay rườm rà, lúc lại lách sang setter injection. Sau đó mình bổ sung quy tắc hoàn chỉnh:

```markdown
# Dependency Injection

- Không dùng @Autowired field injection
- Sử dụng constructor injection, kết hợp với @RequiredArgsConstructor của Lombok
- Tham khảo mẫu: cách viết trong UserController.java
```

Quy tắc sau khi bổ sung đã cung cấp đồng thời cả cách viết khuyến nghị lẫn file mẫu đối chiếu trong dự án, giúp Claude có ngay khuôn mẫu chuẩn mực để làm theo.

### Tận dụng từ khóa nhấn mạnh nhưng đừng lạm dụng

Khi Claude liên tục vi phạm một quy tắc nào đó, bạn có thể thêm tiền tố `IMPORTANT:` hoặc `YOU MUST:`. Những từ này chỉ nên dành cho số ít quy tắc then chốt; nếu điều gì cũng nhấn mạnh thì sự nhấn mạnh sẽ không còn giá trị phân loại nữa.

Nếu Claude vẫn tiếp tục phớt lờ quy tắc dù đã nhấn mạnh, bạn cần kiểm tra xem file có quá dài hay quy tắc bị đặt sai vị trí scope hay không. Càng cố thêm từ ngữ cảm thán thường không giải quyết được vấn đề cốt lõi này.

### Đặt tiêu đề theo các từ ngữ quy chuẩn thông thường

Những tiêu đề quen thuộc như Commands, Structure, Conventions, Testing đã mô tả rất chính xác nội dung. Claude sẽ dễ dàng dựa vào tiêu đề để định vị câu lệnh, cấu trúc thư mục và yêu cầu kiểm thử, các thành viên khác trong team khi đọc cũng không mất công học lại một bộ thuật ngữ lạ lẫm.

### Hooks

`CLAUDE.md` chỉ có thể đưa ra chỉ dẫn chứ không thể ngăn chặn một cách cơ học một lệnh gọi công cụ. Việc sửa các file nhạy cảm hay chạy các lệnh nguy hiểm nên được giao cho Hook kiểm soát. Ví dụ `PreToolUse` sẽ đón bắt thông tin lệnh gọi trước khi công cụ thực thi, rồi căn cứ vào quyền hạn và mức độ rủi ro để quyết định cho qua hay chặn lại:

![Claude Code PreToolUse Hook](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/claude-code-runs-rm-rf-tmp-build-what-happens-520c7930.svg)

Những yêu cầu có thể kiểm tra một cách cơ học hãy ưu tiên giao cho Linter, Hook hoặc CI. Ví dụ muốn ngăn Claude sửa file `.env`, hãy để `PreToolUse` Hook kiểm tra đường dẫn mục tiêu rồi từ chối thao tác; nếu chỉ dặn dò trong `CLAUDE.md` thì vẫn có nguy cơ bị bỏ sót.

Những việc phù hợp làm Hook:

- Tự động format sau khi sửa file
- Chạy test trước khi kết thúc session
- Cấm sửa đổi `migrations/` hoặc `.github/workflows/`
- Chặn các lệnh nguy hiểm như `curl | bash`, `rm -rf`, ngăn gửi dữ liệu nhạy cảm ra ngoài
- Tiêm thêm context bổ sung khi Sub-Agent khởi động

Những yêu cầu mà chỉ cần vi phạm một lần là gây ra rủi ro nghiêm trọng thì nên dùng Hook để cưỡng chế kiểm tra. Còn những quy ước chỉ nhằm giúp Claude hiểu ngữ cảnh dự án thì tiếp tục viết trong `CLAUDE.md`.

## CLAUDE.md đặt ở đâu?

Claude Code hỗ trợ đặt `CLAUDE.md` ở nhiều vị trí, phạm vi ảnh hưởng cụ thể như sau:

![Phân cấp và mức độ ưu tiên của CLAUDE.md](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-file-hierarchy-8abb6c01.png)

| Vị trí | Đường dẫn | Mục đích sử dụng |
| --- | --- | --- |
| **Cấp tổ chức** | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`<br/>Linux/WSL: `/etc/claude-code/CLAUDE.md`<br/>Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | IT/DevOps ban hành quy chuẩn lập trình, tuân thủ bảo mật và xử lý dữ liệu chung toàn công ty; không thể bị loại trừ bởi cấu hình cá nhân. |
| **Cấp user** | `~/.claude/CLAUDE.md` | Sở thích cá nhân của bạn, có hiệu lực trên mọi dự án ở máy cục bộ |
| **Cấp project** | `./CLAUDE.md` hoặc `./.claude/CLAUDE.md` | Quy chuẩn chung của team, commit lên Git |
| **Cấp local** | `./CLAUDE.local.md` | Cấu hình riêng của cá nhân trên dự án cụ thể, đưa vào `.gitignore` |
| **Thư mục con** | `./subdir/CLAUDE.md` | Nạp on-demand khi Claude truy cập file trong thư mục đó, không nạp lúc bắt đầu session |

Các file `CLAUDE.md` ở các tầng khác nhau sẽ cùng được nạp vào, file sau không ghi đè toàn bộ file trước. Quy tắc nào càng gần dự án hiện tại và có phạm vi càng cụ thể sẽ càng bám sát nhiệm vụ hiện tại hơn.

Ví dụ, quy tắc cấp user yêu cầu dùng space, nhưng quy tắc dự án lại yêu cầu dùng Tab, thì Claude trong dự án đó sẽ ưu tiên dùng Tab theo quy tắc dự án. Tuy nhiên, các chỉ dẫn xung đột nhau sẽ làm tăng tính bất định, khi phát hiện bạn nên dọn dẹp ngay.

Cách làm của mình rất đơn giản: file `CLAUDE.md` cấp dự án commit lên Git, chứa quy tắc cả team phải theo; sở thích riêng của cá nhân (như muốn commit message viết tiếng Việt) thì đưa vào `CLAUDE.local.md` và thêm vào `.gitignore`.

## Khi dự án phình to, quản lý CLAUDE.md thế nào?

Các dự án vừa và nhỏ thường chỉ cần một file `CLAUDE.md`. Khi số lượng module tăng lên, việc tiếp tục dồn toàn bộ quy tắc vào file gốc sẽ khiến mỗi session đều phải nạp một đống nội dung không liên quan đến nhiệm vụ đang làm.

![Sự tiến hóa trong cách tổ chức CLAUDE.md](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-scaling-evolution-8b6b3a7b.png)

### Khi dự án còn nhỏ: Chỉ duy trì một file duy nhất

Thông tin toàn cục như tech stack, câu lệnh thông dụng và ranh giới kiến trúc lưu tại file gốc. Đại đa số dự án vừa và nhỏ chỉ cần tầng này là đủ, file `CLAUDE.md` của mình thường cũng không vượt quá 50 dòng.

### Khi nội dung tăng lên: Để file chính đóng vai trò điều hướng

File gốc `CLAUDE.md` giữ lại phần tổng quan dự án và câu lệnh thông dụng, còn quy chuẩn kiến trúc, quy ước API, yêu cầu viết test thì tách ra các file độc lập rồi dùng cú pháp `@path/to/file` để dẫn chiếu:

```markdown
## Project

Dịch vụ quản lý đơn hàng Spring Boot 3.2 + MyBatis-Plus + MySQL 8.0.

## Commands

- Build: `mvn clean package`
- Test: `mvn test`

## Rules

- Quy ước API: @docs/api-conventions.md
- Quy chuẩn Database: @docs/database-rules.md
```

### Khi quy tắc chỉ áp dụng cho một phần code: Nạp theo đường dẫn (Path-Scoped)

Dùng frontmatter trong `.claude/rules/` để khớp theo đường dẫn file:

```markdown
---
paths:
  - "src/main/java/**/controller/**/*.java"
---

# Quy chuẩn Controller

- Thống nhất bọc giá trị trả về trong Result<T>
- Toàn bộ endpoint phải thêm annotation Swagger
```

Khi sửa Controller thì quy tắc của Controller mới được nạp, còn khi xử lý Service thì phần context này hoàn toàn không bị chiếm dụng. Trong thực tế, cơ chế nạp này có 3 ranh giới bạn cần biết:

**Khi tạo mới file, quy tắc theo path có thể chưa được nạp.** Các path-scoped rules được tiêm vào khi Claude **đọc** file khớp mẫu. Khi tạo một file hoàn toàn mới, quy tắc của file đó có thể chưa kịp đi vào context. Những yêu cầu như "tạo mới Controller bắt buộc phải có file header này" nên đưa vào global rules không có `paths`, `CLAUDE.md` ở thư mục gốc, hoặc giao cho Hook kiểm tra.

**Sau khi nén context, quy tắc cục bộ cần kích hoạt lại.** Sau lệnh `/compact`, `CLAUDE.md` ở thư mục gốc sẽ được tiêm lại tự động; còn `CLAUDE.md` thư mục con và các path-scoped rules phải đợi Claude đọc lại file khớp mẫu thì mới nạp lại. Trước khi sửa tiếp file, bạn có thể dùng `/context` để kiểm tra các chỉ dẫn đang có trong session.

**Cần kiểm tra thực tế xem quy tắc đã được nạp hay chưa.** Lệnh `/context` giúp bạn xem các file `CLAUDE.md`, `CLAUDE.local.md` và rules đã nạp; `/memory` dùng để xem và cấu hình nơi lưu trữ. Khi cần ghi log chi tiết quá trình nạp, bạn có thể cấu hình `InstructionsLoaded` Hook.

> **Lưu ý kỹ thuật**: Cú pháp `@path/to/file` sẽ nhúng toàn bộ nội dung file được trỏ vào context. Dẫn chiếu một file dài hàng trăm dòng sẽ khiến mỗi session ngay từ đầu đã bị tốn một lượng lớn không gian chỉ dẫn. Tài liệu chính thức hiện tại giới hạn import đệ quy tối đa 4 tầng. Với các file lớn, bạn có thể đổi thành câu "Chi tiết kiến trúc xem tại `docs/architecture.md`", để Claude tự truy cập đọc khi thực sự cần.

## Cách bảo trì lâu dài

Khi cấu trúc dự án, câu lệnh và workflow thay đổi, các quy tắc cũ trong `CLAUDE.md` cũng phải được dọn dẹp theo.

`CLAUDE.md` dùng để lưu trữ các chỉ dẫn dài hạn được chủ động bảo trì (như quy tắc team bắt buộc tuân thủ và sự thật dự án session nào cũng cần biết). Auto Memory là cơ chế tự động ghi nhớ của Claude Code v2.1.59+, giúp lưu lại các kết luận debug, sở thích và thói quen làm việc phát sinh trong quá trình cộng tác.

Thói quen của mình: những thứ ảnh hưởng đến sự cộng tác của cả team, session nào cũng phải tuân thủ thì viết vào `CLAUDE.md`; những kinh nghiệm nhỏ rút ra trong lúc debug thì giao cho Auto Memory.

Ví dụ "toàn bộ API trả về `Result<T>`" nên viết vào `CLAUDE.md`; còn "test Redis Stream của dự án này cần bật Redis cục bộ trước" là phát hiện debug thì để Auto Memory nhớ là đủ. Auto Memory mặc định được bật, có thể xem, sửa hoặc tắt trong `/memory`; nó duy trì thư mục memory riêng cho từng dự án, nhưng nó không phải là quy chuẩn chung của team và không thể thay thế cho `CLAUDE.md` được commit trong repository.

![Quy trình ra quyết định bảo trì CLAUDE.md](/media/jg/ext/oss.javaguide.cn/ai/coding/claudecode/claude-md-best-practices-maintenance-flow-f46367ef.png)

### Khi nào nên thêm quy tắc?

Khi Claude đã từng phạm phải một loại lỗi nào đó, và một câu chỉ dẫn rõ ràng có thể làm giảm xác suất tái phạm, lúc đó mới cân nhắc thêm vào. File quy tắc chỉ đóng vai trò hướng dẫn; những yêu cầu có thể kiểm tra cơ học thì hãy giao cho test, linter, Hook hoặc CI.

### Khi nào nên xóa quy tắc?

Khi ràng buộc dự án tương ứng đã không còn hiệu lực, hoặc sau khi xóa đi hành vi của Claude không có gì thay đổi, thì bạn có thể xóa quy tắc đó. Những sự thật hiển nhiên đọc code là thấy cũng không cần phải duy trì trùng lặp trong file quy tắc.

### Đánh giá thế nào khi quy tắc cần điều chỉnh?

Nếu Claude phản hồi "Xin lỗi, vừa rồi tôi đã bỏ quên quy tắc XX", trước hết bạn hãy xác nhận xem file quy tắc đó đã được nạp chưa, sau đó kiểm tra xem quy tắc đã đưa ra hành động cụ thể hay chưa. Nếu chỉ là những lời khuyên chung chung như "hãy chú ý", "cố gắng", bạn hãy đổi thành diễn đạt có thể thực thi và kiểm chứng được.

Nếu một quy tắc liên tục bị vi phạm qua nhiều session khác nhau, bạn cần rà soát xem file có quá dài, các quy tắc có xung đột nhau, hoặc quy tắc bị đặt sai phạm vi hay không. Càng in đậm hay thêm dấu chấm than thường không giải quyết được vấn đề này.

### Kiểm tra định kỳ thế nào?

Bạn có thể định kỳ chọn ra vài quy tắc rồi hỏi Claude: "Nếu xóa quy tắc này đi, bạn sẽ thay đổi hành vi nào?" Câu trả lời này chỉ mang tính sàng lọc sơ bộ vì khả năng tự dự đoán hành vi của Claude không hoàn toàn chính xác tuyệt đối. Khi chưa chắc chắn, bạn có thể mở hai session song song—một bên có quy tắc và một bên không có quy tắc trong `CLAUDE.md`—gửi cùng một prompt rồi so sánh kết quả.

Khi gặp lỗi, bạn cũng đừng vội yêu cầu Claude ghi bài học vào `CLAUDE.md` ngay lập tức. Hãy đánh giá xem lỗi đó có tính dài hạn không, có ảnh hưởng đến người khác trong team không, sau này có gặp lại không. Khi lỗi tương tự lặp lại thì mới đúc kết thành quy tắc; những thứ chỉ liên quan đến máy cá nhân hoặc kết luận của một lần debug thì hãy để ở Auto Memory.

## Các cạm bẫy thường gặp

- **Chỉ biết thêm quy tắc mà không nhớ xóa.** Cứ mỗi lần lỗi lại thêm một câu vào `CLAUDE.md` trong khi quy tắc cũ vẫn giữ nguyên khiến file ngày càng dài. Đến lúc Claude bắt đầu bỏ sót quy tắc thì việc in đậm hay thêm dấu chấm than chẳng còn ý nghĩa, hãy dọn bớt nội dung hết hạn và trùng lặp trước.
- **Dùng `@` import một lúc các file tài liệu quá lớn.** Cú pháp dẫn chiếu `@` sẽ nạp toàn bộ file vào context. Tài liệu hàng trăm dòng import thẳng vào sẽ ngốn một lượng lớn không gian ngay khi session vừa bắt đầu. Với tài liệu ít dùng, chỉ cần ghi "Chi tiết kiến trúc xem tại `docs/architecture.md`" để Claude tự đọc khi cần.
- **Đặt toàn bộ yêu cầu tạo file mới vào path-scoped rules.** Quy tắc theo path chỉ nạp khi Claude đọc file khớp mẫu. Khi tạo file mới toanh, các quy tắc này có thể chưa kịp vào context. Những yêu cầu bắt buộc khi tạo file mới nên đặt ở global rules, `CLAUDE.md` gốc hoặc Hook.
- **Các file quy tắc đá nhau.** Khi quy tắc cấp user, project và thư mục con xung đột nhau, Claude chưa chắc đã cảnh báo bạn và cũng không đảm bảo lần nào cũng đưa ra cùng một lựa chọn. Khi cập nhật quy tắc dự án, hãy tiện tay rà soát các tầng khác để dọn dẹp các nội dung xung đột.
- **Claude thỉnh thoảng phạm lỗi là lập tức thêm quy tắc vĩnh viễn.** Một lỗi hiếm gặp lại đổi lấy một quy tắc cố định khiến mọi session sau này đều phải gánh thêm dung lượng context. Chỉ khi vấn đề lặp lại và thực sự có thể chặn đứng bằng một chỉ dẫn rõ ràng thì mới nên viết vào.

## Tổng kết

Khi viết `CLAUDE.md`, bạn không cần phải cố nhét tất cả quy chuẩn của dự án vào bên trong, điều đó hoàn toàn vô nghĩa.

Tiêu chí đánh giá mà mình hay dùng nhất là: Thông tin này, Claude nếu chỉ nhìn vào code thì có đoán chuẩn được không? Nếu không nhìn ra được, mà đoán sai lại dễ làm hỏng việc, thì đó chính là thứ cần phải viết.

Phiên bản tech stack, lệnh khởi động và chạy test, ranh giới phân tầng kiến trúc, những cạm bẫy ngầm trong dự án thường là những thứ rất đáng giữ lại. Còn những việc như thụt lề, sắp xếp import thì giao trọn gói cho formatter sẽ đỡ tốn tâm trí hơn nhiều.

Khi dự án còn nhỏ, đừng vội dựng lên một hệ thống quy tắc quá phức tạp. Cứ đặt một file `CLAUDE.md` ngắn gọn ở thư mục gốc, đủ dùng là được. Khi nội dung thực sự nhiều lên, hãy tách các quy tắc cục bộ sang `.claude/rules/` hoặc tài liệu riêng. Tách xong nhớ dùng `/context` kiểm tra một lượt, đừng tưởng cứ đặt đúng file là Claude đã tự động đọc được.

`CLAUDE.md` cũng không phải là bản hướng dẫn viết xong là đóng khung để đó. Claude lặp lại lỗi thì bổ sung; dự án thay đổi thì xóa quy tắc cũ; cái gì có thể chặn bằng test, linter, Hook hoặc CI thì giao thẳng cho công cụ. File ngắn hơn một chút, quy tắc chuẩn xác hơn một chút, thường sẽ mang lại hiệu quả cao hơn nhiều so với một bản tài liệu ôm đồm mọi thứ.
