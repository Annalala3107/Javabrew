# Bilingual Translation Glossary & Style Guide (EN + VI)

Tài liệu này là quy chuẩn bắt buộc khi chuyển ngữ `content/zh-ref/` sang `content/en/` và `content/vi/`.

## 1. Quy tắc bảo toàn cấu trúc & kỹ thuật (Bất khả xâm phạm)

1. **Frontmatter YAML:** Giữ nguyên khóa (`title`, `category`, `tag`, `description`, `head`, `order`...). Chỉ dịch giá trị văn bản (`title`, `category`, `tag`, `description`) sang ngôn ngữ đích và bổ sung:
   - `lang: en` hoặc `lang: vi`
   - `sourceRef: zh-ref/<relative-path>`
2. **Code Blocks (` ```...``` `):**
   - **TUYỆT ĐỐI KHÔNG** đổi tên biến, tên lớp, tên hàm, từ khóa Java/SQL/Bash, annotation, hay cấu trúc câu lệnh.
   - Với comment tiếng Trung ngắn bên trong code (`// ...`, `/* ... */`), chỉ dịch phần comment giải thích sang EN/VI thật ngắn gọn và chính xác; giữ nguyên 100% mã nguồn thực thi.
3. **Mermaid Diagrams (` ```mermaid ... ``` `):**
   - Giữ nguyên node IDs (`A`, `B`, `node1`), mũi tên (`-->`, `-.->`), từ khóa sơ đồ (`flowchart`, `sequenceDiagram`, `classDiagram`, `stateDiagram-v2`).
   - Dịch nhãn hiển thị bên trong `["..."]` / `(...)` sang EN/VI; luôn đặt nhãn có dấu ngoặc hoặc ký tự đặc biệt trong dấu ngoặc kép `"..."` để tránh lỗi parse Mermaid.
4. **Đường dẫn ảnh & Liên kết:**
   - Giữ nguyên **100%** đường dẫn ảnh cục bộ `/media/jg/...` (chỉ dịch `alt` text bên trong `![alt](/media/jg/...)`).
   - Giữ nguyên đường dẫn file `.md` nội bộ (ví dụ `./why-there-only-value-passing-in-java.md`, `../jvm/memory-area.md`).
5. **Callouts & Bảng Markdown:**
   - Giữ nguyên cú pháp container (`::: tip`, `::: warning`, `::: info`, `::: details`, `:::` kết thúc) — dịch phần tiêu đề sau từ khóa nếu có (ví dụ `::: tip Lưu ý` / `::: tip Note`).
   - Giữ nguyên số cột và căn lề bảng Markdown.
6. **Không tóm tắt, không cắt xén:** Dịch đầy đủ từng mục, từng câu hỏi phỏng vấn, từng ví dụ và giải thích chi tiết từ bản `zh-ref`.

---

## 2. Bảng thuật ngữ chuẩn (Glossary EN ↔ VI)

> Nguyên tắc tiếng Việt: **Dùng thuật ngữ tiếng Anh chuyên ngành chuẩn cho các khái niệm Java/JVM/Concurrency cốt lõi** (hoặc kèm giải thích tiếng Việt lần đầu xuất hiện), tránh dịch gượng kiểu "dịch thô từng chữ" (ví dụ giữ `ThreadLocal`, `BlockingQueue`, `Garbage Collection`, `ClassLoader`, `Stack`, `Heap`, `Metaspace`, `Synchronized`, `Deadlock`, `Serialization`, `Reflection`, `Generics`).

| Tiếng Trung (Gốc) | Tiếng Anh (`content/en/`) | Tiếng Việt (`content/vi/`) |
|---|---|---|
| 面向对象 (OOP) | Object-Oriented Programming (OOP) | Lập trình hướng đối tượng (OOP) |
| 封装 / 继承 / 多态 | Encapsulation / Inheritance / Polymorphism | Đóng gói / Kế thừa / Đa hình |
| 重写 / 重载 | Overriding / Overloading | Ghi đè (`Override`) / Nạp chồng (`Overload`) |
| 值传递 / 引用传递 | Pass-by-value / Pass-by-reference | Truyền tham trị (pass-by-value) / Truyền tham chiếu (pass-by-reference) |
| 序列化 / 反序列化 | Serialization / Deserialization | Tuần tự hóa (`Serialization`) / Giải tuần tự hóa (`Deserialization`) |
| 泛型 / 类型擦除 | Generics / Type Erasure | Generics / Xóa kiểu (`Type Erasure`) |
| 反射 / 动态代理 | Reflection / Dynamic Proxy | Reflection / Dynamic Proxy |
| 深拷贝 / 浅拷贝 | Deep Copy / Shallow Copy | Sao chép sâu (Deep Copy) / Sao chép nông (Shallow Copy) |
| 语法糖 | Syntactic Sugar | Syntactic Sugar (cú pháp rút gọn) |
| 集合框架 | Collections Framework | Collections Framework |
| 扩容机制 | Resizing / Capacity Expansion Mechanism | Cơ chế mở rộng dung lượng (`resize`) |
| 哈希冲突 / 链表 / 红黑树 | Hash Collision / Linked List / Red-Black Tree | Xung đột băm (Hash Collision) / Danh sách liên kết / Cây đỏ-đen (Red-Black Tree) |
| 快速失败 / 安全失败 | Fail-Fast / Fail-Safe | Fail-Fast / Fail-Safe |
| 线程 / 进程 / 协程 / 虚拟线程 | Thread / Process / Coroutine / Virtual Thread | Thread (luồng) / Process (tiến trình) / Coroutine / Virtual Thread (luồng ảo) |
| 线程池 / 核心线程数 / 最大线程数 | Thread Pool / Core Pool Size / Maximum Pool Size | Thread Pool / `corePoolSize` / `maximumPoolSize` |
| 阻塞队列 / 拒绝策略 | Blocking Queue / Rejection Policy | Blocking Queue / Rejection Policy (chính sách từ chối) |
| 死锁 / 活锁 / 饥饿 | Deadlock / Livelock / Starvation | Deadlock / Livelock / Starvation |
| 乐观锁 / 悲观锁 | Optimistic Locking / Pessimistic Locking | Khóa lạc quan (`Optimistic Lock`) / Khóa bi quan (`Pessimistic Lock`) |
| 可重入锁 / 公平锁 / 非公平锁 | Reentrant Lock / Fair Lock / Non-fair Lock | Reentrant Lock / Fair Lock / Non-fair Lock |
| 自旋锁 / 偏向锁 / 轻量级锁 / 重量级锁 | Spin Lock / Biased Lock / Lightweight Lock / Heavyweight Lock | Spin Lock / Biased Lock / Lightweight Lock / Heavyweight Lock |
| 内存模型 (JMM) / 可见性 / 原子性 / 有序性 | Java Memory Model (JMM) / Visibility / Atomicity / Ordering | Java Memory Model (JMM) / Tính khả kiến (`Visibility`) / Tính nguyên tử (`Atomicity`) / Tính tuần tự (`Ordering`) |
| 指令重排 / 内存屏障 | Instruction Reordering / Memory Barrier | Sắp xếp lại lệnh (Instruction Reordering) / Rào cản bộ nhớ (Memory Barrier) |
| 内存泄漏 / 内存溢出 | Memory Leak / Out of Memory (OOM) | Rò rỉ bộ nhớ (Memory Leak) / Tràn bộ nhớ (`OOM`) |
| 堆 / 栈 / 方法区 / 元空间 | Heap / Stack / Method Area / Metaspace | Heap / Stack / Method Area / Metaspace |
| 垃圾回收 / 可达性分析 / 引用计数 | Garbage Collection (GC) / Reachability Analysis / Reference Counting | Garbage Collection (GC) / Phân tích khả năng tiếp cận (Reachability Analysis) / Đếm tham chiếu |
| 类加载器 / 双亲委派模型 | ClassLoader / Parent Delegation Model | ClassLoader / Mô hình ủy quyền cha (Parent Delegation Model) |
| 阻塞 IO / 非阻塞 IO / IO 多路复用 | Blocking I/O / Non-blocking I/O / I/O Multiplexing | Blocking I/O / Non-blocking I/O / I/O Multiplexing |
| 字节流 / 字符流 / 缓冲流 | Byte Stream / Character Stream / Buffered Stream | Byte Stream / Character Stream / Buffered Stream |
| 常见面试题总结 | Common Interview Questions Summary | Tổng hợp câu hỏi phỏng vấn thường gặp |
| 上 / 中 / 下 (trong tiêu đề bài) | Part 1 / Part 2 / Part 3 | Phần 1 / Phần 2 / Phần 3 |
