# JavAncode — JavaBrew Bilingual Knowledge Base (EN / VI)

Kho tri thức kỹ thuật offline được xây dựng từ nguồn **Snailclimb/JavaGuide** (chọn lọc 354 bài kỹ thuật cốt lõi + AI, lọc bỏ quảng cáo/paywall, tải toàn bộ ảnh về nội bộ) và tổ chức song ngữ **English (`content/en/`)** + **Tiếng Việt (`content/vi/`)** để tích hợp vào nền tảng học tập **JavaBrew (`PRO192 × JavaGuide`)**.

## Cấu trúc thư mục

```text
e:\JavAncode\
├── content/
│   ├── zh-ref/          # 354 bài nguồn tiếng Trung đã làm sạch & trỏ ảnh local
│   ├── en/              # Bản dịch chuẩn tiếng Anh kỹ thuật
│   └── vi/              # Bản dịch tiếng Việt chuẩn thuật ngữ + giáo trình PRO192 (content/vi/pro192/)
├── public/
│   └── media/
│       ├── jg/
│       │   ├── ext/     # Ảnh kỹ thuật tải về từ CDN/host ngoài (dùng chung EN & VI)
│       │   └── local/   # Ảnh cục bộ trích từ repo gốc (đã chuẩn hóa tên ASCII)
│       └── pro192/      # Tài nguyên PRO192 offline (187 ảnh/GIF, 14 slide .pptx, 14 .pdf + banking.rar)
├── metadata/
│   ├── manifest.json             # Cây danh mục & metadata cho 354 bài JavaGuide
│   ├── navigation.json           # Cây điều hướng đa tầng cho giao diện học tập
│   ├── pro192.json               # Dữ liệu 30 Slots PRO192, 150 bài tập, Study Bridge & 4 đề PE
│   └── translation-glossary.md   # Quy chuẩn thuật ngữ & cú pháp dịch EN/VI
├── scripts/
│   ├── verify-translations.mjs   # Kiểm định chất lượng dịch, code fence, ảnh & CJK
│   ├── verify-pro192.mjs         # Kiểm định bộ giáo trình PRO192, ảnh, slide & Study Bridge
│   ├── check-links.mjs           # Kiểm tra liên kết nội bộ và đường dẫn ảnh (/media/jg & /media/pro192)
│   ├── sync-manifest-titles.mjs  # Đồng bộ tiêu đề EN/VI vào manifest.json
│   └── build-navigation.mjs      # Sinh cây điều hướng metadata/navigation.json
└── LICENSE                       # Apache License 2.0 (từ Snailclimb/JavaGuide)
```

## Phạm vi 10 cụm nội dung (`354` bài sạch)

1. `java/` (`79` bài — **Ưu tiên dịch đợt 1**)
2. `cs-basics/` (`68` bài)
3. `database/` (`44` bài)
4. `system-design/` (`33` bài)
5. `distributed-system/` (`28` bài)
6. `high-performance/` (`15` bài)
7. `high-availability/` (`9` bài)
8. `tools/` (`11` bài)
9. `ai/` (`39` bài)
10. `ai-coding/` (`28` bài)

## Giáo trình Trường PRO192 (`content/vi/pro192/`)

- **10 tệp Markdown chuẩn hóa:** [README.md](./content/vi/pro192/README.md), 8 tệp giai đoạn (`giai-doan-1-slot-01-05.md` → `giai-doan-8-slot-28-30.md`, đủ 30 Slots & 150 bài tập tự luyện có lời giải), và [pe-challenges.md](./content/vi/pro192/pe-challenges.md) (4 bộ đề thực chiến PE Q1–Q4).
- **Tài nguyên offline:** `187` ảnh/GIF, `14` slide `.pptx`, `14` tài liệu `.pdf` và `banking.rar` tại `public/media/pro192/`, kèm bảng ánh xạ Study Bridge trong [pro192.json](./metadata/pro192.json).

## Bản quyền & Nguồn gốc

- Nội dung kiến thức gốc từ repository [Snailclimb/JavaGuide](https://github.com/Snailclimb/JavaGuide) theo giấy phép **Apache License 2.0** (xem [LICENSE](./LICENSE)).
- Đã loại bỏ các thành phần thương mại (`GlobalUnlock`, snippet quảng cáo WeChat/ZhiShiXingQiu, 7 bài stub trả phí ngắn trong các thư mục giữ lại) và xử lý trùng lặp tên file `Async.md` / `async.md` trên Windows.
