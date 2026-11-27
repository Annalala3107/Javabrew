# JavaBrew — PRO192 × JavaGuide (The Night Coffee Lab)

Không gian học Java OOP **PRO192 (30 Slots, 150 bài tập, 19 câu đề PE thật PE1–PE5)** kết hợp **354 bài JavaGuide song ngữ EN/VI**, trình biên dịch **OpenJDK Sandbox**, **Phòng thi thử PE tính giờ** và hệ thống **AI Mentor** chạy qua Vercel Serverless Functions + Upstash Redis.

---

## Tính năng nổi bật

- **Lộ trình PRO192 chuẩn JDK 8 (30 Slots / 8 Stages):** Ghi chú cá nhân, bookmark, đếm tiến độ, bài tập lý thuyết, Live Lab Coding Drills và **FE Mini-Quiz AI** từng Slot (5 câu trắc nghiệm, cache 24h).
- **JavaGuide Song ngữ (354 bài EN/VI):** Chuyển đổi ngôn ngữ tức thì, Table of Contents, code block có nút chạy thử trong Live Lab và **Lesson AI Tutor Drawer** giải thích đoạn văn bản được bôi đen.
- **Code Studio & Live Lab (`/studio/:id`, `/studio/playground`):**
  - Trình soạn thảo CodeMirror 6 đa tệp (`Main`, Entity, Interface `🔒 readonly`), kiểm tra quy chế PRO192 (default package, quy định từng câu PE), Diff View, và Sandbox OpenJDK (`api/java-run.mjs`).
  - **AI Code Mentor** 2 phong cách (*Socratic* & *Deep Review*), giải thích lỗi `javac`, test case fail và chấm Clean Code.
- **Phòng thi thử PE (`/pe/mock`, `/pe/mock/:paper`):**
  - Mô phỏng đề thi hoàn chỉnh (`PE1`, `PE3`, `PE4`, `PE5`: 85 phút / 10 điểm; `PE2`: 60 phút / 7 điểm).
  - Khóa Diff & AI Mentor trong lúc làm bài, tách biệt nháp thi (`javabrew:mock_exam_drafts_v1`), tự chấm toàn bộ câu hỏi khi nộp bài, ghi lỗi vào Sổ tay và gọi **AI Giám khảo PE** nhận xét tổng quan.
- **AI Study Coach (`/dashboard`) & Search RAG (`/search` / `Ctrl+K`):**
  - 3 gợi ý học tập tức thì trên Dashboard + nút lập thời khóa biểu 30 phút bằng AI.
  - Hỏi đáp trực tiếp trên kho học liệu nội bộ trong `SearchModal` (`Shift + Enter`), đính kèm trích dẫn nội bộ bấm-mở trực tiếp và cache 12 giờ (`Cache · 0 lượt`).
- **PWA & SEO:** Hỗ trợ cài đặt Web App (`manifest.webmanifest`, `sw.js` bỏ qua `/api/*`), `robots.txt` và `sitemap.xml` sinh tự động khi build.

---

## Biến môi trường (Vercel / Local `.env.local`)

| Biến | Giá trị mẫu / Mặc định | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | `AIza...` | Có (cho AI server-side) | API key phía server, không lộ ra client; người dùng vẫn có thể nhập BYOK riêng |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Khuyến nghị | Lưu quota `/IP/ngày` và cache `slot-quiz` / `rag-search` bền vững |
| `UPSTASH_REDIS_REST_TOKEN` | `...` | Khuyến nghị | Token Upstash Redis REST (tự fallback bộ nhớ tạm nếu bỏ trống) |
| `AI_DAILY_LIMIT` | `30` | Tùy chọn | Giới hạn lượt AI server-side / IP / ngày (tối đa 500) |
| `GEMINI_DEFAULT_MODEL` | `gemini-3.5-flash-lite` | Tùy chọn | Model mặc định (`gemini-3.5-flash-lite` hoặc `gemini-4-hydrogen`) |
| `ALLOWED_ORIGINS` | `https://domain-phu.com` | Tùy chọn | Danh sách origin hợp lệ bổ sung (phân tách bằng dấu phẩy) |
| `SITE_URL` | `https://javabrew.vercel.app` | Tùy chọn | Origin dùng khi sinh `public/sitemap.xml` |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Tùy chọn (Khuyến nghị bảo mật) | Project URL từ Supabase Dashboard (bỏ trống nếu chạy mở không khóa) |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` / `sb_publishable_...` | Tùy chọn (Khuyến nghị bảo mật) | Anon / Publishable public key từ Supabase Dashboard |

---

## Lệnh phát triển & kiểm thử

```bash
# Chạy dev (tự dựng public/data/search-index.json)
npm run dev

# Kiểm tra TypeScript & toàn bộ unit/UI tests (Vitest)
npx tsc -b --noEmit
npm test

# Kiểm tra tính toàn vẹn nội dung, bản dịch & Java snippets
npm run verify:content
npm run verify:translations
npm run verify:java

# Quét báo cáo ảnh > 50 KB trong public/media/ (dry-run an toàn)
npm run optimize:media

# Build production (search index + sitemap + tsc + api/*.mjs + Vite dist)
npm run build
```
