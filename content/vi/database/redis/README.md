---
title: "Chuyên đề Redis: Cache, Cấu trúc dữ liệu, Persistence, Cluster, Blocking và Thực hành kỹ thuật"
description: "Lộ trình ôn tập phỏng vấn và học tập về Redis và Cache, bao gồm Cache Penetration, Cache Breakdown, Cache Avalanche, chiến lược đọc/ghi, cấu trúc dữ liệu Redis, Persistence, vấn đề blocking, tác vụ trễ và Cluster."
category: Cơ sở dữ liệu
tag:
  - Redis
  - Cache
  - Phỏng vấn Backend
sitemap:
  changefreq: weekly
  priority: 0.9
head:
  - - meta
    - name: keywords
      content: Redis,Câu hỏi phỏng vấn Redis,Cache,Cache Penetration,Cache Breakdown,Cache Avalanche,Cấu trúc dữ liệu Redis,Redis Persistence,Redis Cluster,Redis Blocking,Redis Skiplist,Tác vụ trễ Redis,Message Queue Redis,Phỏng vấn Backend
lang: vi
sourceRef: zh-ref/database/redis/README.md
---

Redis là một trong những bộ nhớ đệm (Cache) và hệ thống lưu trữ dữ liệu trên bộ nhớ hiệu năng cao được sử dụng phổ biến nhất trong phát triển Backend. Khi học Redis, không nên chỉ dừng lại ở các câu lệnh và kiểu dữ liệu, mà còn phải hiểu các vấn đề kỹ thuật như chiến lược đọc/ghi Cache, cấu trúc dữ liệu tầng dưới, cơ chế bền vững dữ liệu (Persistence), nguyên nhân gây nghẽn (blocking), quản lý bộ nhớ, sao chép (Replication) và Cluster.

## Phù hợp với ai

- Lập trình viên Backend muốn học bài bản về nguyên lý Redis, thiết kế Cache và thực hành kỹ thuật.
- Các bạn chuẩn bị trả lời câu hỏi phỏng vấn liên quan đến cấu trúc dữ liệu Redis, Persistence, Cluster, tính sẵn sàng cao (High Availability) và tính nhất quán của Cache (Cache Consistency).
- Độc giả đã sử dụng Redis trong dự án, nhưng chưa nắm vững các bất thường của Cache, vấn đề blocking, phân mảnh bộ nhớ (Memory Fragmentation) và cơ chế Cluster.
- Kỹ sư cần triển khai tác vụ trễ (Delayed Task), Message Queue, bảng xếp hạng, giỏ hàng và các tính năng tương tự dựa trên Redis.

## Trọng tâm học tập

- Các cấu trúc dữ liệu thường dùng của Redis lần lượt phù hợp với những kịch bản nghiệp vụ nào, và cách mã hóa tầng dưới (underlying encoding) ảnh hưởng đến hiệu năng ra sao?
- Cần thiết kế phương án xử lý các vấn đề Cache Penetration, Cache Breakdown, Cache Avalanche và tính nhất quán của Cache như thế nào?
- Trong cơ chế Persistence của Redis, RDB, AOF, viết lại AOF (AOF Rewrite) và Hybrid Persistence khác nhau ở điểm nào?
- Vì sao Redis có thể bị blocking, và làm thế nào để định vị các lệnh chậm (slow command), big key, hot key và tác động từ Persistence?
- Master-Replica Replication, Sentinel và Cluster lần lượt giải quyết những bài toán nào, và quá trình chuyển đổi dự phòng (Failover) gồm những bước then chốt nào?
- Khi dùng Redis để làm tác vụ trễ hoặc Message Queue, có những giới hạn năng lực và rủi ro độ tin cậy nào?

## Thứ tự đọc khuyến nghị

1. [Tổng hợp câu hỏi phỏng vấn thường gặp về nền tảng Cache](./cache-basics.md): Hiểu trước các kịch bản sử dụng Cache, các lỗi bất thường của Cache và bài toán tính nhất quán.
2. [Tổng hợp câu hỏi phỏng vấn Redis thường gặp (Phần 1)](./redis-questions-01.md), [Tổng hợp câu hỏi phỏng vấn Redis thường gặp (Phần 2)](./redis-questions-02.md): Xây dựng danh sách các câu hỏi Redis có tần suất xuất hiện cao.
3. [Giải thích chi tiết 5 kiểu dữ liệu cơ bản của Redis](./redis-data-structures-01.md), [Giải thích chi tiết 3 kiểu dữ liệu đặc biệt của Redis](./redis-data-structures-02.md): Nắm vững có hệ thống cấu trúc dữ liệu và kịch bản ứng dụng.
4. [Giải thích chi tiết 3 chiến lược đọc ghi Cache thường dùng](./3-commonly-used-cache-read-and-write-strategies.md), [Giải thích chi tiết cơ chế Persistence của Redis](./redis-persistence.md): Bổ sung năng lực xử lý tính nhất quán Cache và khôi phục dữ liệu.
5. [Tổng hợp các nguyên nhân gây blocking thường gặp trong Redis](./redis-common-blocking-problems-summary.md): Đặt Redis vào môi trường Production để hiểu sâu hơn.

## Các bài viết cốt lõi

### Nền tảng Cache & Chiến lược đọc/ghi

- [Tổng hợp câu hỏi phỏng vấn thường gặp về nền tảng Cache](./cache-basics.md): Giải thích kịch bản ứng dụng Cache, Cache Penetration, Cache Breakdown, Cache Avalanche, tính nhất quán của Cache và cơ chế loại bỏ Cache (Cache Eviction).
- [Giải thích chi tiết 3 chiến lược đọc ghi Cache thường dùng](./3-commonly-used-cache-read-and-write-strategies.md): So sánh các chiến lược phổ biến như Cache Aside, Read/Write Through, Write Behind.
- [Tổng hợp câu hỏi phỏng vấn Redis thường gặp (Phần 1)](./redis-questions-01.md) và [Tổng hợp câu hỏi phỏng vấn Redis thường gặp (Phần 2)](./redis-questions-02.md): Xâu chuỗi nền tảng Redis, mô hình Thread, cấu trúc dữ liệu, Persistence, Cluster và các vấn đề trên Production.

### Cấu trúc dữ liệu & Ứng dụng tiêu biểu

- [Giải thích chi tiết 5 kiểu dữ liệu cơ bản của Redis](./redis-data-structures-01.md): Hiểu cấu trúc tầng dưới và kịch bản nghiệp vụ của String, List, Hash, Set và Sorted Set.
- [Giải thích chi tiết 3 kiểu dữ liệu đặc biệt của Redis](./redis-data-structures-02.md): Hiểu cách dùng và kịch bản phù hợp của Bitmap, HyperLogLog và Geospatial.
- [Vì sao Redis dùng Skiplist để triển khai Sorted Set?](./redis-skiplist.md): Hiểu cấu trúc Skiplist, độ phức tạp truy vấn và lựa chọn triển khai của Sorted Set.
- [Cách triển khai tác vụ trễ (Delayed Task) dựa trên Redis?](./redis-delayed-task.md): So sánh các cách triển khai như sự kiện hết hạn (Expiration Events), Sorted Set và Stream.
- [Cách triển khai Message Queue dựa trên Redis?](./redis-stream-mq.md): Hiểu sự khác biệt khi làm Message Queue bằng List, Pub/Sub và Stream.

### Persistence, Bộ nhớ & Cluster

- [Giải thích chi tiết cơ chế Persistence của Redis](./redis-persistence.md): Trình bày có hệ thống về RDB, AOF, AOF Rewrite và Hybrid Persistence.
- [Giải thích chi tiết về phân mảnh bộ nhớ (Memory Fragmentation) trong Redis](./redis-memory-fragmentation.md): Hiểu nguyên nhân sinh ra phân mảnh bộ nhớ, cách theo dõi chỉ số và chiến lược dọn dẹp.
- [Tổng hợp các nguyên nhân gây blocking thường gặp trong Redis](./redis-common-blocking-problems-summary.md): Tổng hợp các nguồn gây blocking như lệnh chậm, big key, Persistence, đồng bộ Master-Replica, CPU và mạng.

## Câu hỏi tần suất cao

- Vì sao Redis nhanh? Vì sao dùng đơn luồng (single-threaded) vẫn chịu được đồng thời cao (high concurrency)?
- Các kiểu dữ liệu phổ biến của Redis lần lượt phù hợp với những kịch bản nghiệp vụ nào?
- Vì sao Sorted Set sử dụng Skiplist?
- Cache Penetration, Cache Breakdown và Cache Avalanche khác nhau thế nào, xử lý ra sao?
- Làm thế nào để đảm bảo tính nhất quán giữa Cache và Database?
- RDB và AOF khác nhau như thế nào? AOF Rewrite giải quyết vấn đề gì?
- Những nguyên nhân phổ biến nào khiến Redis bị blocking? Làm sao truy vết big key và lệnh chậm?
- Redis Master-Replica Replication, Sentinel và Cluster khác nhau ở điểm nào?
- Redis triển khai tác vụ trễ như thế nào? Rủi ro về độ tin cậy nằm ở đâu?
- So với Message Queue truyền thống, Redis Stream có những giới hạn gì?

## Chuyên đề liên quan

- [Hệ thống kiến thức Cơ sở dữ liệu](../)
- [Hệ thống kiến thức High Performance](../../high-performance/)
- [Hệ thống kiến thức High Availability](../../high-availability/)
- [Chuyên đề Message Queue](../../high-performance/message-queue/)
