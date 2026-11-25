---
slot: 25
stage: 7
title: "Slot 25: Tổng quan Java Collections Framework, List & Iterator An toàn"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q3)"
  - "Thi FE"
estimatedMinutes: 30
slidePdf: "/media/pro192/resources/Collections.pdf"
slidePptx: "/media/pro192/slides/Collections.pptx"
peRefs:
  - "PE1-Q3"
  - "PE2-Q3"
  - "PE3-Q3"
  - "PE4-Q3"
  - "PE5-Q3"
---

# Slot 25: Tổng quan Java Collections Framework, List & Iterator An toàn

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 7: Java Collections Framework, Collections/Arrays & So sánh
- **Trọng tâm thi:** `Thi PE (Q3)` `Thi FE` | **Thời lượng gợi ý:** ~30 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Collections.pdf) · [Slide PPTX](/media/pro192/slides/Collections.pptx)
- **Liên kết đề PE thật:** `PE1-Q3` · `PE2-Q3` · `PE3-Q3` · `PE4-Q3` · `PE5-Q3` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Hiểu cây phân cấp Java Collections Framework (`Collection` vs `Map`) và cách chọn `ArrayList` / `LinkedList` / `Vector`.
- Duyệt và **xóa phần tử an toàn** trong `List` bằng `Iterator.remove()` hoặc duyệt lùi chỉ mục cho Q3 PE (`PE4-Q3`, `PE5-Q3`).
- Biết kỹ thuật `class TicketList extends ArrayList<Ticket>` thường gặp trong các biến thể Q3 PE (`PE2-Q3`, `PE3-Q3`).

## 2. Lý thuyết cốt lõi

*Tài liệu bài giảng đối chiếu: `Collections.pptx`*

---

### I. HẠN CHẾ CỦA MẢNG NGUYÊN THỦY & SỰ RA ĐỜI CỦA JCF
1. **Hạn chế cố hữu của Mảng thuần túy (Primitive Array):**
   * **Kích thước cố định (Fixed size):** Khi một mảng được khởi tạo (ví dụ `int[] arr = new int[10];`), độ dài của mảng là bất biến trong suốt vòng đời đối tượng. Khi cần mở rộng hoặc thu hẹp, lập trình viên buộc phải tạo mảng mới và sao chép thủ công từng phần tử.
   * **Thao tác dữ liệu phức tạp:** Các phép toán cơ bản như chèn phần tử vào giữa, xóa một phần tử bất kỳ, tìm kiếm hoặc sắp xếp đòi hỏi phải viết các đoạn mã dồn dịch chỉ mục phức tạp, dễ gây lỗi `ArrayIndexOutOfBoundsException`.
2. **Bản chất của Java Collections Framework (JCF):**
   * JCF là một kiến trúc thống nhất (unified architecture) nằm trong gói `java.util`, cung cấp sẵn:
     * **Giao diện (Interfaces):** Định nghĩa các kiểu dữ liệu trừu tượng (`Collection`, `List`, `Set`, `Queue`, `Map`).
     * **Lớp triển khai (Implementations):** Các cấu trúc dữ liệu cụ thể đã được tối ưu hóa sẵn (`ArrayList`, `LinkedList`, `HashSet`, `TreeSet`, `HashMap`, `TreeMap`).
     * **Thuật toán đa hình (Algorithms):** Các giải thuật tĩnh dùng chung để sắp xếp, xáo trộn, tìm kiếm nhị phân được đóng gói trong các lớp `Collections` và `Arrays`.
3. **Lợi ích kiến trúc:**
   * Giảm thiểu công sức viết mã (Reduces programming effort).
   * Tăng tốc độ thực thi và độ tin cậy của phần mềm (Increases performance & quality).
   * Chuẩn hóa giao diện giao tiếp giữa các thành phần phần mềm độc lập.

---

### II. CÂY PHÂN CẤP GIAO DIỆN CỐT LÕI

![Tổng quan cây phân cấp Java Collections Framework](/media/pro192/images/7.01.gif)

![Sơ đồ các giao diện Collection và Map](/media/pro192/images/7.02.gif)

Trong `java.util`, hệ thống phân chia thành hai nhánh độc lập ở tầng cao nhất:

```text
                  java.util.Collection                        java.util.Map
                  /         |        \                              |
                 /          |         \                             |
         java.util.List  java.util.Set  java.util.Queue     [HashMap, TreeMap]
         [ArrayList,     [HashSet,      [LinkedList,
          Vector,         TreeSet]       PriorityQueue]
          LinkedList]
```

* **Nhánh `java.util.Collection`:**
  * Là giao diện gốc quản lý một nhóm các phần tử độc lập.
  * Phân tách thành 3 nhánh con chủ đạo:
    1. **`List`:** Tập hợp có thứ tự (ordered sequence), quản lý phần tử dựa trên chỉ mục số nguyên (zero-based index) và **cho phép phần tử trùng lặp (duplicates allowed)**.
    2. **`Set`:** Tập hợp **không cho phép phần tử trùng lặp (no duplicates)**, mô phỏng khái niệm tập hợp toán học thuần túy.
    3. **`Queue`:** Tập hợp mô phỏng hàng đợi, quản lý thứ tự nạp và xuất phần tử theo quy tắc xác định (FIFO - First In First Out hoặc theo mức độ ưu tiên Priority).
* **Nhánh `java.util.Map`:**
  * **Hoàn toàn KHÔNG kế thừa từ `java.util.Collection`**.
  * Quản lý dữ liệu theo cặp **Khóa - Giá trị (`Key - Value`)**, trong đó mỗi Khóa là duy nhất và ánh xạ tới đúng một Giá trị.

---

### III. GIAO DIỆN `List` VÀ CÁC LỚP TRIỂN KHAI
Giao diện `List<E>` cung cấp các thao tác thêm, đọc, sửa, xóa phần tử tại vị trí chỉ mục xác định (`add(index, element)`, `get(index)`, `set(index, element)`, `remove(index)`).

### Bảng so sánh 3 lớp cài đặt cốt lõi của `List`:
| Tiêu chí | `ArrayList` | `Vector` | `LinkedList` |
| :--- | :--- | :--- | :--- |
| **Cấu trúc lưu trữ** | Mảng động có thể co giãn (Resizable array) | Mảng động có thể co giãn | Danh sách liên kết đôi (Doubly-linked list) |
| **Truy xuất ngẫu nhiên (`get(i)`)** | **Cực nhanh: `O(1)`** (tính toán địa chỉ ô nhớ trực tiếp) | Nhanh: `O(1)` | Chậm: `O(n)` (phải duyệt tuần tự qua các nút) |
| **Chèn/Xóa ở đầu hoặc giữa** | Chậm: `O(n)` (phải dịch chuyển hàng loạt phần tử) | Chậm: `O(n)` | **Rất nhanh: `O(1)`** (chỉ cần đổi con trỏ nút) |
| **Tính an toàn đa luồng (Thread-safe)**| ❌ Không đồng bộ (Not thread-safe) | ✅ **Có đồng bộ (Thread-safe)** nhờ từ khóa `synchronized` | ❌ Không đồng bộ (Not thread-safe) |
| **Hiệu năng đơn luồng** | Tối ưu, nhanh nhất | Chậm hơn do chi phí khóa đồng bộ | Tối ưu cho thao tác thêm/xóa đầu đuôi |

---

### IV. DUYỆT TẬP HỢP VỚI `Iterator` & NGOẠI LỆ `ConcurrentModificationException`
1. **Giao diện `java.util.Iterator<E>`:**
   * Cung cấp cơ chế duyệt qua mọi tập hợp `Collection` mà không làm lộ cấu trúc lưu trữ nội tại của tập hợp.
   * **3 phương thức then chốt:**
     * `boolean hasNext()`: Trả về `true` nếu còn phần tử tiếp theo trong tập hợp.
     * `E next()`: Trả về phần tử kế tiếp và dịch chuyển con trỏ duyệt.
     * `void remove()`: Xóa phần tử hiện tại vừa được trả về bởi `next()` ra khỏi tập hợp gốc.
2. **Ngoại lệ `ConcurrentModificationException`:**
   * Nếu đang sử dụng vòng lặp `for-each` hoặc vòng lặp `for` thường mà lập trình viên gọi trực tiếp phương thức xóa của danh sách (ví dụ: `list.remove(item);`), cấu trúc danh sách bị biến đổi trong khi bộ đếm chỉ mục hoặc con trỏ nội bộ của vòng lặp không đồng bộ. Trình lặp phát hiện sự sai lệch bộ đếm chỉnh sửa (`modCount != expectedModCount`) và lập tức ném ra ngoại lệ `ConcurrentModificationException`.
   * **Giải pháp chuẩn:** Bắt buộc phải sử dụng phương thức `it.remove()` của chính đối tượng `Iterator`.

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 25:**
> - Bẫy **chết người ở Q3 PE** (`PE4-Q3 MyShoes.f3`, `PE5-Q3 MyLadder.f3`): Dùng `for (Shoes s : t) { t.remove(s); }` sẽ nổ **`ConcurrentModificationException`** ngay lúc chạy; còn dùng `for (int i = 0; ...)` xóa xuôi mà quên `i--` sẽ **bỏ sót phần tử liền kề** → Hãy dùng `Iterator` hoặc duyệt ngược `i = t.size() - 1` về `0`!
> - Trong JDK 8, nhớ kiểm tra `t == null || t.isEmpty()` trước khi tìm phần tử đầu/lớn nhất.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 25.1: Phân biệt cấu trúc `List`, `Set` và `Map`

**Đề bài:** Hãy phân biệt 3 giao diện nền tảng `List`, `Set`, và `Map` trong Java Collections Framework dựa trên 2 tiêu chí: tính thứ tự của phần tử và khả năng chứa giá trị trùng lặp.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **`List`:** Là tập hợp **có thứ tự xác định** theo vị trí chèn (chỉ mục số nguyên từ 0) và **hoàn toàn cho phép chứa các phần tử trùng lặp**.
* **`Set`:** Là tập hợp **không cho phép phần tử trùng lặp** (mọi phần tử đều là duy nhất); đa số các cài đặt của Set (như `HashSet`) không bảo đảm duy trì thứ tự chèn.
* **`Map`:** Lưu trữ dữ liệu dưới dạng **cặp Khóa - Giá trị (`Key - Value`)**. Trong đó tập hợp các Khóa (`Keys`) hoạt động như một `Set` (không được trùng lặp), còn các Giá trị (`Values`) có thể trùng lặp nhau. `Map` không kế thừa từ `Collection`.

</details>

---

### Bài 25.2: Lựa chọn giữa `ArrayList` và `LinkedList`

**Đề bài:** Một ứng dụng xử lý dữ liệu yêu cầu thực hiện 1.000.000 thao tác tra cứu phần tử ngẫu nhiên theo chỉ mục `get(index)`, nhưng rất hiếm khi thêm hoặc bớt dữ liệu. Bạn nên chọn `ArrayList` hay `LinkedList`? Giải thích bản chất cấu trúc dữ liệu dẫn đến sự lựa chọn đó.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Lựa chọn tối ưu:** Bắt buộc phải chọn **`ArrayList`**.
* **Giải thích bản chất:** 
  * `ArrayList` lưu trữ dữ liệu trên các ô nhớ liên tiếp của mảng (contiguous array), cho phép CPU tính toán địa chỉ ô nhớ và truy xuất ngẫu nhiên trực tiếp tới bất kỳ vị trí `index` nào với độ phức tạp hằng số `O(1)`.
  * Trong khi đó, `LinkedList` lưu trữ dưới dạng các nút rời rạc liên kết bằng con trỏ; để đọc phần tử tại vị trí `index`, chương trình buộc phải duyệt tuần tự qua từng nút từ đầu hoặc từ đuôi với độ phức tạp tuyến tính `O(n)`, gây suy giảm hiệu năng nghiêm trọng khi dữ liệu lớn.

</details>

---

### Bài 25.3: Duyệt danh sách bằng `Iterator`

**Đề bài:** Cho danh sách `List<String> names = new ArrayList<>();` chứa các tên: `"An"`, `"Binh"`, `"Chau"`. Hãy viết một đoạn mã sử dụng giao diện `Iterator` để duyệt qua danh sách và in từng tên ra màn hình console.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class IteratorDemo {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("An");
        names.add("Binh");
        names.add("Chau");

        // Khởi tạo Iterator từ danh sách
        Iterator<String> it = names.iterator();
        while (it.hasNext()) {
            String name = it.next();
            System.out.println(name);
        }
    }
}
```
* **Giải thích:** Vòng lặp `while (it.hasNext())` kiểm tra xem còn phần tử phía sau hay không, và `it.next()` vừa đọc dữ liệu vừa bước con trỏ tới phần tử tiếp theo.

</details>

---

### Bài 25.4: Ngoại lệ `ConcurrentModificationException` và cách xóa phần tử an toàn

**Đề bài:** Đoạn mã sau bị lỗi gì khi chạy? Hãy sửa lại cho đúng bằng phương thức `remove()` của `Iterator`:
```java
List<Integer> numbers = new ArrayList<>();
numbers.add(10);
numbers.add(15);
numbers.add(20);

for (Integer n : numbers) {
    if (n % 2 != 0) {
        numbers.remove(n); // Xóa số lẻ
    }
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Hiện tượng khi chạy:** Đoạn mã trên ném ra ngoại lệ thời gian chạy `java.util.ConcurrentModificationException`.
* **Nguyên nhân:** Vòng lặp `for-each` bản chất sử dụng một `Iterator` ẩn bên dưới. Khi gọi trực tiếp phương thức `numbers.remove(n)` của cấu trúc List, số lượng phần tử của danh sách bị thay đổi nhưng con trỏ duyệt của `Iterator` không được đồng bộ, vi phạm tính toàn vẹn của vòng lặp.
* **Đoạn mã sửa lại chuẩn mực với `Iterator`:**
  ```java
  Iterator<Integer> it = numbers.iterator();
  while (it.hasNext()) {
      Integer n = it.next();
      if (n % 2 != 0) {
          it.remove(); // Xóa an toàn thông qua Iterator
      }
  }
  ```

</details>

---

### Bài 25.5: Tính an toàn đa luồng giữa `Vector` và `ArrayList`

**Đề bài:** Tại sao trong các ứng dụng đơn luồng (single-thread) hiện đại, lập trình viên Java luôn ưu tiên sử dụng `ArrayList` thay vì lớp cổ điển `Vector`? Khi nào thì `Vector` phát huy tác dụng?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Lý do ưu tiên `ArrayList` trong đơn luồng:** Hầu hết các phương thức của `Vector` đều có từ khóa `synchronized` (đồng bộ hóa để khóa ô nhớ). Việc khóa và mở khóa này gây ra chi phí phụ trội (overhead) lớn về thời gian thực thi của CPU. Do `ArrayList` không đồng bộ hóa, nó có tốc độ xử lý nhanh hơn đáng kể so với `Vector`.
* **Khi nào `Vector` phát huy tác dụng:** `Vector` phù hợp trong các ứng dụng đa luồng (multi-threaded applications), nơi có nhiều luồng cùng lúc truy cập, thêm hoặc sửa đổi danh sách mà không muốn dữ liệu bị xung đột hoặc hỏng trạng thái nội bộ.

</details>


---

### 💻 Luyện Code Thực hành (Phong cách W3Schools Tryit)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **Code Studio Tryit**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 25A: W3Schools ArrayList — Thêm, Sửa (`set`) & Duyệt `ArrayList<String>`
- **Mục tiêu:** Tạo danh sách môn học, thay thế phần tử tại chỉ mục `1` bằng `set(1, "DBI202")` và in kích thước.
- **Expected Output:**
  - `[PRO192, DBI202, CSD201] (size=3)`

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> courses = new ArrayList<String>();
        courses.add("PRO192");
        courses.add("PRF192");
        courses.add("CSD201");
        // TODO: Sua phan tu index 1 thanh "DBI202" bang courses.set(...)
        System.out.println(courses + " (size=" + courses.size() + ")");
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 25A)</summary>

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> courses = new ArrayList<String>();
        courses.add("PRO192");
        courses.add("PRF192");
        courses.add("CSD201");
        courses.set(1, "DBI202");
        System.out.println(courses + " (size=" + courses.size() + ")");
    }
}
```

* **Giải thích:** Trong PE Q3 JDK 8, nhớ viết `new ArrayList<String>()` (hoặc diamond `<>` JDK 7+); tuyệt đối không dùng `List.of(...)` vì đây là API từ Java 9.

</details>

---

#### 🟡 Thực hành 25B: W3Schools Iterator (Cầu nối PE4/PE5-Q3) — Sửa Lỗi `ConcurrentModificationException`
- **Mục tiêu:** Chuyển vòng lặp `for-each` xóa trực tiếp sang `Iterator<Integer>` với `it.remove()` để xóa mọi số lẻ an toàn.
- **Expected Output:**
  - `Even only: [10, 30]`
- 🔗 [Mở bài lab Slot 25 trên Code Studio Tryit](/studio/playground?example=slot-25-lab)

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<Integer>(Arrays.asList(10, 15, 21, 30, 33));
        // TODO: Thay vong lap for-each gay ConcurrentModificationException bang Iterator
        for (Integer n : nums) {
            if (n % 2 != 0) {
                nums.remove(n);
            }
        }
        System.out.println("Even only: " + nums);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 25B)</summary>

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<Integer>(Arrays.asList(10, 15, 21, 30, 33));
        Iterator<Integer> it = nums.iterator();
        while (it.hasNext()) {
            Integer n = it.next();
            if (n % 2 != 0) {
                it.remove();
            }
        }
        System.out.println("Even only: " + nums);
    }
}
```

* **Giải thích:** Đây là bẫy phổ biến nhất ở câu Q3 `f3` (`PE4-Q3 MyShoes.f3`, `PE5-Q3 MyLadder.f3`). Nếu dùng `for (int i = 0; ...)` xóa xuôi mà quên `i--` khi gặp 2 phần tử liên tiếp (như `15`, `21`) cũng bị bỏ sót!

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Java Collections — Phần 1 (`List`, `Set`, `Map`)](../../java/collection/java-collection-questions-01.md) · [Phân tích Mã nguồn `ArrayList`](../../java/collection/arraylist-source-code.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Collections.pdf) · [PPTX](/media/pro192/slides/Collections.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (21 ảnh)</summary>

![Sơ đồ Slot 25: 7.01](/media/pro192/images/7.01.gif)

![Sơ đồ Slot 25: 7.0.1.1](/media/pro192/images/7.0.1.1.gif)

![Sơ đồ Slot 25: 7.02](/media/pro192/images/7.02.gif)

![Sơ đồ Slot 25: 7.0.2.2](/media/pro192/images/7.0.2.2.gif)

![Sơ đồ Slot 25: 7.03a](/media/pro192/images/7.03a.gif)

![Sơ đồ Slot 25: 7.03b](/media/pro192/images/7.03b.gif)

![Sơ đồ Slot 25: 7.04](/media/pro192/images/7.04.gif)

![Sơ đồ Slot 25: 7.05](/media/pro192/images/7.05.gif)

![Sơ đồ Slot 25: 7.06a](/media/pro192/images/7.06a.gif)

![Sơ đồ Slot 25: 7.06b](/media/pro192/images/7.06b.gif)

![Sơ đồ Slot 25: 7.06c](/media/pro192/images/7.06c.gif)

![Sơ đồ Slot 25: 7.06d](/media/pro192/images/7.06d.gif)

![Sơ đồ Slot 25: 7.06e](/media/pro192/images/7.06e.gif)

![Sơ đồ Slot 25: 7.06f](/media/pro192/images/7.06f.gif)

![Sơ đồ Slot 25: 7.06g](/media/pro192/images/7.06g.gif)

![Sơ đồ Slot 25: 7.06h](/media/pro192/images/7.06h.gif)

![Sơ đồ Slot 25: 7.06i](/media/pro192/images/7.06i.gif)

![Sơ đồ Slot 25: 7.06j](/media/pro192/images/7.06j.gif)

![Sơ đồ Slot 25: 7.06k](/media/pro192/images/7.06k.gif)

![Sơ đồ Slot 25: 7.0.6l](/media/pro192/images/7.0.6l.gif)

![Sơ đồ Slot 25: 7.07](/media/pro192/images/7.07.gif)

</details>

---

**Điều hướng:** [← Slot 24](./slot-24.md) | [Mục lục PRO192](../README.md) | [Slot 26 →](./slot-26.md)
