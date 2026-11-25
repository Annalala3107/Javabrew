---
slot: 7
stage: 2
title: "Slot 07: Cơ chế Cấp phát Bộ nhớ & Bộ dọn rác Tự động (Garbage Collection)"
category: PRO192
lang: vi
examFocus:
  - "Thi FE"
  - "Nền tảng JVM"
estimatedMinutes: 25
slidePdf: "/media/pro192/resources/Memory%20Management%20in%20Java.pdf"
slidePptx: "/media/pro192/slides/Memory%20Management%20in%20Java.pptx"
peRefs: []
---

# Slot 07: Cơ chế Cấp phát Bộ nhớ & Bộ dọn rác Tự động (Garbage Collection)

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 2: Quản lý Bộ nhớ, Wrapper/Math & Chuỗi String/Scanner
- **Trọng tâm thi:** `Thi FE` `Nền tảng JVM` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Memory%20Management%20in%20Java.pdf) · [Slide PPTX](/media/pro192/slides/Memory%20Management%20in%20Java.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Hiểu mô hình quản lý khối nhớ (Free Block List, First-Fit, Compacting Memory) trong bài giảng.
- Nhận diện chính xác thời điểm một đối tượng trên Heap trở thành "rác" (mất toàn bộ tham chiếu trỏ tới).
- Hiểu vai trò daemon thread của Garbage Collector, `System.gc()`, và cơ chế GC thực tế trên HotSpot.

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Memory Management in Java.pptx` (từ slide *How Java heap is managed?* đến slide *Garbage Collection*).

### 2.1. Quản lý Heap bằng danh sách khối nhớ (Free Block List & Allocated Block List)
Hệ thống quản lý bộ nhớ của JVM không coi Heap là một khối liền mạch cố định, mà liên tục theo dõi tình trạng sử dụng thông qua hai danh sách liên kết:
* **Free block list (Danh sách khối rỗng):** Quản lý các phân đoạn ô nhớ chưa được sử dụng hoặc vừa được thu hồi, sẵn sàng cấp phát cho đối tượng mới.
* **Allocated block list (Danh sách khối đã cấp phát):** Quản lý các phân đoạn ô nhớ đang lưu trữ dữ liệu của các đối tượng đang hoạt động.

Khi chương trình Java vừa khởi động, toàn bộ không gian của Heap là một khối tự do duy nhất thuộc `Free block list`. Qua nhiều lần cấp phát (`new`) và giải phóng dữ liệu trong suốt quá trình chạy, các khối nhớ trống không còn liền kề nhau mà bị phân tán thành nhiều mảnh nhỏ nằm rải rác giữa các khối đang sử dụng, gây ra hiện tượng **phân mảnh bộ nhớ (Memory Fragmentation)**.

### 2.2. Thuật toán cấp phát First-Fit & Cơ chế dồn bộ nhớ (Compacting Memory)
* **Giải thuật First-Fit (Khớp đầu tiên):** Khi có lệnh khởi tạo đối tượng mới, JVM quét `Free block list` từ đầu đến cuối và chọn ngay **khối nhớ trống đầu tiên có kích thước đủ lớn** để chứa vừa dữ liệu của đối tượng đó.
* **Cơ chế Dồn bộ nhớ (Compact Memory):** Nếu tổng dung lượng trống trên Heap vẫn còn đủ, nhưng không tìm thấy bất kỳ khối đơn lẻ nào đủ lớn để chứa đối tượng mới (do bị phân mảnh), bộ quản lý bộ nhớ Java sẽ thực hiện thao tác dồn bộ nhớ:
  1. Di chuyển các khối nhớ đang sử dụng dồn sát lại với nhau về một phía của Heap.
  2. Gộp toàn bộ các mảnh bộ nhớ trống rời rạc lại thành một khối rỗng liên tục có kích thước lớn hơn, sẵn sàng đáp ứng yêu cầu cấp phát.

### 2.3. Định nghĩa "Dữ liệu rác" (Garbage) trong Java
Một vùng nhớ đối tượng trên Heap bị coi là "Rác" (Garbage / Useless data) khi chương trình không còn bất kỳ biến tham chiếu nào có thể chạm tới nó nữa. Bài giảng nêu rõ hai trường hợp điển hình:
1. **Đối tượng bị vượt quá phạm vi hoạt động (Out of scope):** Khi một đối tượng được tạo bên trong một khối lệnh (ví dụ khối `if` hay thân phương thức), khi luồng thực thi đi ra ngoài dấu ngoặc nhọn đóng `}`, biến tham chiếu trên Stack bị hủy bỏ, đối tượng trên Heap bị mất tham chiếu và trở thành rác.
2. **Gán biến tham chiếu về `null`:** Khi lập trình viên chủ động gán `obj = null;`, mối liên kết giữa biến tham chiếu trên Stack và đối tượng trên Heap bị cắt đứt. Ô nhớ đối tượng đó trở thành dữ liệu rác.

### 2.4. Bản chất hoạt động của Bộ dọn rác tự động (Garbage Collector - GC)

> [!WARNING]
> **Modern JVM Note (Đính chính về thời điểm chạy Garbage Collector):**
> Slide trường ghi *"GC chỉ thực sự chạy khi Heap cạn kiệt (exhausted)"*. Thực tế trên **G1GC / ZGC / Parallel GC**, **Minor GC** tự động kích hoạt ngay khi vùng **Eden** đầy (trong khi tổng Heap còn rất nhiều dung lượng), hoặc theo ngưỡng tỷ lệ phân bổ (*InitiatingHeapOccupancyPercent*). Ngoài ra `Compacting` là một phần của chu trình *Mark-Sweep-Compact* / *Evacuation* trong GC hiện đại.
> - Đọc sâu hơn tại: [Chi tiết Garbage Collection trong JVM (JavaGuide)](../../java/jvm/jvm-garbage-collection.md).

![Minh họa quản lý khối nhớ Heap và thu hồi rác](/media/pro192/images/memory3.png)

* **Độ ưu tiên thấp nhất (Lowest Priority):** Garbage Collector chạy ngầm như một tiến trình luồng (daemon thread) có độ ưu tiên thấp nhất trong hệ thống nhằm không gây ảnh hưởng đến hiệu năng của các tác vụ chính.
* **Thời điểm kích hoạt:** Garbage Collector chỉ thực sự chạy quét và thu hồi khi bộ nhớ Heap của hệ thống bị cạn kiệt (exhausted). Nếu bộ nhớ RAM còn dư dả, GC có thể sẽ không chạy trong suốt thời gian thực thi của một chương trình ngắn.
* **Quyền kiểm soát:** Garbage Collector hoàn toàn do máy ảo JVM điều phối tự động. Lập trình viên không thể ép buộc GC chạy ngay lập tức. Lệnh `System.gc()` chỉ gửi một lời đề nghị tới JVM, quyền quyết định chạy vào thời điểm nào hoàn toàn thuộc về JVM.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 07:**
> - Bẫy trắc nghiệm FE: `System.gc()` **KHÔNG ép buộc** GC chạy ngay lập tức — chỉ là lời gợi ý gửi tới JVM.
> - Đừng hiểu nhầm `obj = null` làm mất đối tượng nếu vẫn còn biến tham chiếu thứ hai đang trỏ tới cùng đối tượng đó trên Heap.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 7.1: Hai danh sách quản lý bộ nhớ đống của JVM

**Đề bài:** Hệ thống quản lý bộ nhớ đống (Heap) của Java sử dụng hai danh sách nào để theo dõi việc sử dụng RAM? Trạng thái ban đầu của danh sách đó khi chương trình vừa khởi chạy như thế nào?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Hai danh sách quản lý gồm: **Free block list** (danh sách khối rỗng) và **Allocated block list** (danh sách khối đã cấp phát).
* Trạng thái ban đầu: Toàn bộ dung lượng vùng nhớ Heap là một khối rỗng duy nhất thuộc về **Free block list**, trong khi `Allocated block list` hoàn toàn trống rỗng.

</details>

---

### Bài 7.2: Giải thuật First-Fit và hiện tượng phân mảnh bộ nhớ

**Đề bài:** Giải thích cơ chế cấp phát bộ nhớ theo nguyên tắc **First-Fit** trong Java. Hiện tượng gì sẽ xảy ra sau nhiều lần cấp phát và giải phóng vùng nhớ liên tục?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Cơ chế First-Fit:** Khi có yêu cầu cấp phát bộ nhớ cho đối tượng mới, JVM duyệt danh sách `Free block list` và lấy ngay khối nhớ rỗng đầu tiên có kích thước đủ lớn để cấp phát.
* **Hiện tượng xảy ra:** Sau nhiều chu kỳ cấp phát và thu hồi, bộ nhớ rơi vào tình trạng **phân mảnh (memory fragmentation)**, các khối nhớ trống không còn nằm liền kề nhau mà bị chia cắt thành nhiều khoảng trống nhỏ nằm rải rác giữa các khối đang sử dụng.

</details>

---

### Bài 7.3: Cơ chế Dồn bộ nhớ (Compacting Memory)

**Đề bài:** Khi tổng dung lượng trống trên Heap vẫn còn đủ nhưng không tìm thấy bất kỳ khối rỗng đơn lẻ nào đủ lớn để chứa đối tượng mới, JVM sẽ xử lý như thế nào?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Bộ quản lý bộ nhớ Java sẽ thực hiện cơ chế **Dồn bộ nhớ (Compact memory)**: Di chuyển các khối nhớ đang chứa đối tượng dồn sát lại với nhau, dồn toàn bộ các phân mảnh nhớ trống rời rạc về một khu vực để tạo thành một khối trống liên tục có kích thước lớn hơn, đáp ứng yêu cầu cấp phát mới.

</details>

---

### Bài 7.4: Nhận diện đối tượng trở thành Rác (Garbage)

**Đề bài:** Xét đoạn mã sau:
```java
public class TestGC {
    public static void main(String[] args) {
        String s1 = new String("Java");
        String s2 = new String("Python");
        s1 = s2;
        s2 = null;
    }
}
```
Sau khi dòng lệnh `s2 = null;` thực thi xong, có đối tượng nào trên Heap trở thành "rác" (Garbage) chưa? Giải thích vì sao.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Đối tượng trở thành rác:** Đối tượng `"Java"` (do lệnh `new String("Java")` tạo ra) chính thức trở thành rác.
* **Giải thích cơ chế tham chiếu:**
  1. Ban đầu `s1` trỏ đến `"Java"`, `s2` trỏ đến `"Python"`.
  2. Khi gán `s1 = s2;`, biến `s1` đổi hướng trỏ sang đối tượng `"Python"`. Lúc này đối tượng `"Java"` hoàn toàn mất dấu tham chiếu, không còn biến nào trỏ đến nó nữa, trở thành **Rác**.
  3. Khi gán `s2 = null;`, chỉ có biến `s2` ngắt liên kết, nhưng đối tượng `"Python"` vẫn còn biến `s1` trỏ đến nên `"Python"` **vẫn còn sống** và không phải là rác.

</details>

---

### Bài 7.5: Độ ưu tiên và quyền kiểm soát Garbage Collector

**Đề bài:** Tại sao bài giảng lại nhấn mạnh rằng Garbage Collector có **độ ưu tiên thấp nhất (lowest priority)**? Lập trình viên có thể ép buộc Garbage Collector thu hồi bộ nhớ ngay lập tức bằng lệnh code nào không?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Lý do có độ ưu tiên thấp nhất:** Để bảo đảm hiệu năng tối đa cho các luồng xử lý nghiệp vụ chính của chương trình. Garbage Collector chỉ được kích hoạt chạy khi tài nguyên bộ nhớ đống (Heap) của hệ thống rơi vào trạng thái cạn kiệt (exhausted).
* **Khả năng kiểm soát:** Lập trình viên **không thể ép buộc GC chạy ngay lập tức**. Việc gọi phương thức `System.gc()` chỉ gửi tín hiệu yêu cầu đến JVM, quyền quyết định khi nào quét dọn hoàn toàn do máy ảo JVM tự động quyết định.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Chi tiết Garbage Collection trong JVM (G1GC / ZGC)](../../java/jvm/jvm-garbage-collection.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Memory%20Management%20in%20Java.pdf) · [PPTX](/media/pro192/slides/Memory%20Management%20in%20Java.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (1 ảnh)</summary>

![Sơ đồ Slot 7: memory3](/media/pro192/images/memory3.png)

</details>

---

**Điều hướng:** [← Slot 06](./slot-06.md) | [Mục lục PRO192](../README.md) | [Slot 08 →](./slot-08.md)
