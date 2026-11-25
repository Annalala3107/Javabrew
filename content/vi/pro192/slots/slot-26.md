---
slot: 26
stage: 7
title: "Slot 26: Cấu trúc Set (HashSet vs TreeSet) & Map (HashMap vs TreeMap)"
category: PRO192
lang: vi
examFocus:
  - "Thi PE (Q3/Q4)"
  - "Thi FE"
estimatedMinutes: 30
slidePdf: "/media/pro192/resources/Collections.pdf"
slidePptx: "/media/pro192/slides/Collections.pptx"
peRefs:
  - "PE5-Q4"
---

# Slot 26: Cấu trúc Set (HashSet vs TreeSet) & Map (HashMap vs TreeMap)

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 7: Java Collections Framework, Collections/Arrays & So sánh
- **Trọng tâm thi:** `Thi PE (Q3/Q4)` `Thi FE` | **Thời lượng gợi ý:** ~30 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Collections.pdf) · [Slide PPTX](/media/pro192/slides/Collections.pptx)
- **Liên kết đề PE thật:** `PE5-Q4` (xem [Kho Đề PE](../pe-challenges.md))

**Sau khi hoàn thành Slot này, bạn có thể:**
- Phân biệt `HashSet` (`O(1)`) vs `TreeSet` (Red-Black Tree `O(log n)`, cấm `null`) và hợp đồng vàng `hashCode()` + `equals()`.
- Sử dụng `HashMap` / `TreeMap` để đếm tần suất, tra cứu và duyệt đúng hiệu năng bằng `entrySet()`.
- Ứng dụng `Set<Character>` đếm chữ số/ký tự **phân biệt** (exact distinct count) trong các bài Q4 PE (`PE5-Q4`).

## 2. Lý thuyết cốt lõi

*Tài liệu bài giảng đối chiếu: `Collections.pptx`*

---

### I. GIAO DIỆN `Set` VÀ CƠ CHẾ LOẠI TRÙNG LẶP
Giao diện `Set<E>` định nghĩa một tập hợp các phần tử không có thứ tự chỉ mục và tuyệt đối **không chứa phần tử trùng lặp (no duplicates)**.

### So sánh hai lớp triển khai chủ đạo của `Set`:
| Tiêu chí | `HashSet` | `TreeSet` |
| :--- | :--- | :--- |
| **Cấu trúc dữ liệu nền tảng** | Bảng băm (Hash Table) | Cây đỏ-đen (Red-Black Tree / Cây nhị phân tự cân bằng) |
| **Thứ tự của phần tử** | Hoàn toàn ngẫu nhiên/không duy trì thứ tự | **Tự động sắp xếp có thứ tự** (tăng dần theo tự nhiên hoặc Comparator) |
| **Hiệu năng thêm/xóa/tìm kiếm** | **Cực nhanh: `O(1)`** | **`O(log n)`** do phải duy trì tính cân bằng của cây |
| **Chứa phần tử `null`** | **Cho phép** chứa 1 phần tử `null` | **CẤM tuyệt đối `null`** (ném `NullPointerException` vì không thể so sánh) |

### Cơ chế kiểm tra trùng lặp của `HashSet` (Quy ước `hashCode()` và `equals()`):
Khi gọi `set.add(obj)`:
1. `HashSet` gọi `obj.hashCode()` để tính toán vị trí thùng băm (bucket index). Nếu thùng băm trống, phần tử được chèn ngay.
2. Nếu xảy ra hiện tượng trùng mã băm (hash collision), `HashSet` mới gọi tiếp phương thức `obj.equals(existingObj)`. Nếu trả về `true`, đối tượng bị coi là trùng lặp và bị loại bỏ; nếu trả về `false`, đối tượng được lưu vào danh sách liên kết/cây con của thùng băm đó.
3. ⚠️ **Quy tắc vàng:** Khi định nghĩa các lớp đối tượng thực thể (như `Student`, `Product`), **bắt buộc phải ghi đè đồng thời cả hai phương thức `equals()` và `hashCode()`**.

---

### II. GIAO DIỆN `Map` VÀ ÁNH XẠ KHÓA - GIÁ TRỊ
* **Bản chất của `Map<K, V>`:**
  * Lưu trữ dữ liệu theo cặp Khóa - Giá trị (`Key - Value`).
  * Tập hợp Khóa (`Keys`): Không được trùng lặp (hoạt động như một `Set`).
  * Tập hợp Giá trị (`Values`): Cho phép trùng lặp.
  * Nếu gọi `map.put(key, newValue)` với một `key` đã tồn tại, giá trị cũ sẽ bị ghi đè hoàn toàn.

### So sánh `HashMap` và `TreeMap`:

![Minh họa bảng băm và Map trong Java](/media/pro192/images/7.13.gif)

| Tiêu chí | `HashMap` | `TreeMap` |
| :--- | :--- | :--- |
| **Cấu trúc nền tảng** | Bảng băm (Hash Table) | Cây cân bằng đỏ-đen (Red-Black Tree) |
| **Thứ tự của Khóa** | Không duy trì thứ tự | **Tự động sắp xếp các Khóa tăng dần** |
| **Hiệu năng (`get`, `put`)** | `O(1)` | `O(log n)` |
| **Khóa `null`** | Cho phép 1 Khóa `null` | **CẤM tuyệt đối Khóa `null`** |

### Ba góc nhìn (Views) để duyệt dữ liệu trong `Map`:
```java
Map<String, Integer> map = new HashMap<>();
// 1. Duyệt qua tập hợp Khóa:
for (String key : map.keySet()) { ... }

// 2. Duyệt qua tập hợp Giá trị:
for (Integer value : map.values()) { ... }

// 3. Duyệt qua từng cặp Khóa - Giá trị (Tối ưu hiệu năng nhất):
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + " : " + entry.getValue());
}
```

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 26:**
> - Nếu bạn chỉ override `equals()` mà **quên `hashCode()`** trên class tự viết (như `Student`, `Product`), `HashSet`/`HashMap` sẽ coi 2 đối tượng giống hệt nhau là **2 khóa khác nhau**.
> - `TreeSet` và `TreeMap` không cho phép khóa `null` (ném `NullPointerException`), và yêu cầu phần tử/key cài `Comparable` hoặc truyền `Comparator`.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 26.1: Cơ chế loại bỏ phần tử trùng lặp trong `Set`

**Đề bài:** Xét đoạn mã sau:
```java
Set<String> set = new HashSet<>();
set.add("Apple");
set.add("Banana");
set.add("Apple");
set.add("Orange");
System.out.println(set.size());
```
Màn hình sẽ in ra kích thước `set.size()` là bao nhiêu? Thứ tự các phần tử khi in toàn bộ `set` ra màn hình có chắc chắn là `"Apple", "Banana", "Orange"` không?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Kích thước in ra:** **`3`**.
* **Giải thích:** Cấu trúc `Set` không chấp nhận phần tử trùng lặp. Lần gọi `set.add("Apple")` thứ hai sẽ bị bỏ qua và trả về `false`, do đó trong tập hợp chỉ còn lại 3 phần tử duy nhất: `"Apple"`, `"Banana"`, `"Orange"`.
* **Về thứ tự in ra:** **KHÔNG chắc chắn**. `HashSet` sử dụng bảng băm, các phần tử được phân bổ vào các thùng băm dựa trên giá trị băm ngẫu nhiên của chuỗi chứ không lưu vết thứ tự chèn. Nếu muốn bảo đảm thứ tự sắp xếp chữ cái, phải dùng `TreeSet`.

</details>

---

### Bài 26.2: Hiện tượng khi thêm `null` vào `TreeSet`

**Đề bài:** Đoạn mã sau có chạy thành công không?
```java
Set<String> treeSet = new TreeSet<>();
treeSet.add("Java");
treeSet.add(null); // Dòng 3
```
Nếu có lỗi, hãy nêu tên ngoại lệ phát sinh tại Dòng 3 và giải thích nguyên nhân dựa trên bản chất cấu trúc dữ liệu của `TreeSet`.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Đoạn mã trên **BỊ LỖI THỜI GIAN CHẠY (Runtime Exception)** tại Dòng 3.
* **Tên ngoại lệ phát sinh:** `java.lang.NullPointerException`.
* **Nguyên nhân:** `TreeSet` lưu trữ dữ liệu dưới dạng Cây nhị phân tự cân bằng (Red-Black Tree). Mỗi khi chèn thêm một phần tử mới, nó bắt buộc phải gọi phương thức `compareTo()` để so sánh phần tử đó với các nút đã có trên cây nhằm tìm vị trí chèn. Việc gọi hàm so sánh trên giá trị `null` lập tức kích hoạt `NullPointerException`. (Ngược lại, `HashSet` thì hoàn toàn cho phép lưu `null`).

</details>

---

### Bài 26.3: Ứng dụng `HashMap` đếm tần suất xuất hiện của từ (Word Counting Pattern)

**Đề bài:** Cho mảng các từ: `String[] words = {"apple", "banana", "apple", "orange", "banana", "apple"};`. Hãy sử dụng `Map<String, Integer>` để đếm số lần xuất hiện của từng từ và in kết quả ra màn hình.

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

```java
import java.util.HashMap;
import java.util.Map;

public class WordCount {
    public static void main(String[] args) {
        String[] words = {"apple", "banana", "apple", "orange", "banana", "apple"};
        Map<String, Integer> countMap = new HashMap<>();

        for (String w : words) {
            if (countMap.containsKey(w)) {
                countMap.put(w, countMap.get(w) + 1); // Đã có: tăng số lượng lên 1
            } else {
                countMap.put(w, 1); // Chưa có: gán số lượng ban đầu là 1
            }
        }

        // In kết quả qua entrySet
        for (Map.Entry<String, Integer> entry : countMap.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }
    }
}
```

</details>

---

### Bài 26.4: Cơ chế ghi đè giá trị khi trùng Khóa (Key) trong `Map`

**Đề bài:** Xét đoạn mã sau:
```java
Map<Integer, String> students = new HashMap<>();
students.put(101, "Nguyen Van A");
students.put(102, "Tran Thi B");
students.put(101, "Le Van C");
System.out.println(students.size());
System.out.println(students.get(101));
```
Chương trình sẽ in ra kích thước `students.size()` và giá trị của `students.get(101)` là gì?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* `students.size()` in ra: **`2`**.
* `students.get(101)` in ra: **`Le Van C`**.
* **Giải thích:** Khóa `101` là duy nhất trong `Map`. Lần gọi `put(101, "Le Van C")` sau sẽ tìm thấy khóa `101` đã tồn tại, hệ thống lập tức cập nhật và ghi đè giá trị `"Le Van C"` lên giá trị cũ `"Nguyen Van A"`. Kích thước của Map vẫn giữ nguyên là 2 (gồm khóa 101 và 102).

</details>

---

### Bài 26.5: Tối ưu hiệu năng duyệt Map bằng `entrySet()`

**Đề bài:** Quan sát hai cách duyệt `Map<String, String> map` sau:
* **Cách 1:**
  ```java
  for (String key : map.keySet()) {
      String val = map.get(key);
      System.out.println(key + " = " + val);
  }
  ```
* **Cách 2:**
  ```java
  for (Map.Entry<String, String> entry : map.entrySet()) {
      System.out.println(entry.getKey() + " = " + entry.getValue());
  }
  ```
Tại sao Cách 2 lại được các chuyên gia đánh giá là có hiệu năng cao hơn Cách 1 khi làm việc với `HashMap` kích thước lớn?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Bản chất hiệu năng:**
  * Ở **Cách 1**: Vòng lặp lấy ra tập hợp Khóa. Trong mỗi bước lặp, hàm `map.get(key)` lại phải **tính toán lại hàm băm một lần nữa** và quét thùng băm để tìm giá trị tương ứng. Với `N` phần tử, chương trình phải thực hiện `N` lần tra cứu băm độc lập.
  * Ở **Cách 2**: `entrySet()` trả về một tập hợp các đối tượng `Map.Entry` chứa sẵn cả con trỏ tới `Key` và con trỏ tới `Value` nằm cạnh nhau trên ô nhớ. Việc gọi `entry.getKey()` và `entry.getValue()` chỉ là thao tác đọc trường dữ liệu trực tiếp, hoàn toàn **không tốn thêm bất kỳ phép băm hay tìm kiếm nào**, giúp tiết kiệm đáng kể chu kỳ xử lý của CPU.

</details>


---

### 💻 Luyện Code Thực hành (Phong cách W3Schools Tryit)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **Code Studio Tryit**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 26A: W3Schools HashSet/TreeSet (Cầu nối `PE5-Q4`) — Đếm Chữ số Khác nhau
- **Mục tiêu:** Dùng `TreeSet<Character>` lọc và đếm các chữ số *duy nhất* trong chuỗi `"a1b2c1d9a2"`.
- **Expected Output:**
  - `Digits: [1, 2, 9] -> count = 3`

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String s = "a1b2c1d9a2";
        Set<Character> digits = new TreeSet<Character>();
        // TODO: Duyet tung ky tu, neu Character.isDigit(c) thi them vao digits
        System.out.println("Digits: " + digits + " -> count = " + digits.size());
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 26A)</summary>

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String s = "a1b2c1d9a2";
        Set<Character> digits = new TreeSet<Character>();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isDigit(c)) {
                digits.add(c);
            }
        }
        System.out.println("Digits: " + digits + " -> count = " + digits.size());
    }
}
```

* **Giải thích:** `Set` tự động loại phần tử trùng, còn `TreeSet` tự giữ thứ tự tăng dần — rất tiện cho các bài đếm "distinct digits / distinct letters" trong PE Q4.

</details>

---

#### 🟡 Thực hành 26B: W3Schools *HashMap Loop* — Đếm Tần suất Từ qua `entrySet()`
- **Mục tiêu:** Dùng `HashMap<String, Integer>` đếm số lần xuất hiện từng từ trong câu và duyệt in kết quả bằng `Map.Entry` (thứ tự khóa của `HashMap` có thể khác nhau; đổi sang `TreeMap` nếu muốn sort A–Z).
- **Expected Output:**
  - `java=3`
  - `mal/map -> map=1, oop=1`
- 🔗 [Mở bài lab Slot 26 trên Code Studio Tryit](/studio/playground?example=slot-26-lab)

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String text = "java oop java java map";
        Map<String, Integer> freq = new HashMap<String, Integer>();
        for (String w : text.trim().split("\\s+")) {
            // TODO: Tang so dem trong freq (JDK 8 co the kiem tra get(w) == null)
        }
        for (Map.Entry<String, Integer> e : freq.entrySet()) {
            System.out.println(e.getKey() + "=" + e.getValue());
        }
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 26B)</summary>

```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String text = "java oop java java map";
        Map<String, Integer> freq = new HashMap<String, Integer>();
        for (String w : text.trim().split("\\s+")) {
            Integer old = freq.get(w);
            freq.put(w, old == null ? 1 : old + 1);
        }
        for (Map.Entry<String, Integer> e : freq.entrySet()) {
            System.out.println(e.getKey() + "=" + e.getValue());
        }
    }
}
```

* **Giải thích:** Duyệt qua `freq.entrySet()` nhanh hơn duyệt `keySet()` rồi gọi `freq.get(key)` lại một lần nữa.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Phân tích Mã nguồn `HashMap`](../../java/collection/hashmap-source-code.md) · [Java Collections — Phần 1 (`List`, `Set`, `Map`)](../../java/collection/java-collection-questions-01.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Collections.pdf) · [PPTX](/media/pro192/slides/Collections.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (15 ảnh)</summary>

![Sơ đồ Slot 26: 7.08](/media/pro192/images/7.08.gif)

![Sơ đồ Slot 26: 7.09](/media/pro192/images/7.09.gif)

![Sơ đồ Slot 26: 7.10](/media/pro192/images/7.10.gif)

![Sơ đồ Slot 26: 7.11](/media/pro192/images/7.11.gif)

![Sơ đồ Slot 26: 7.12](/media/pro192/images/7.12.gif)

![Sơ đồ Slot 26: 7.13](/media/pro192/images/7.13.gif)

![Sơ đồ Slot 26: 7.14](/media/pro192/images/7.14.gif)

![Sơ đồ Slot 26: 7.15a](/media/pro192/images/7.15a.gif)

![Sơ đồ Slot 26: 7.15b](/media/pro192/images/7.15b.gif)

![Sơ đồ Slot 26: 7.15c](/media/pro192/images/7.15c.gif)

![Sơ đồ Slot 26: 7.15d](/media/pro192/images/7.15d.gif)

![Sơ đồ Slot 26: 7.15e](/media/pro192/images/7.15e.gif)

![Sơ đồ Slot 26: 7.15f](/media/pro192/images/7.15f.gif)

![Sơ đồ Slot 26: 7.16](/media/pro192/images/7.16.gif)

![Sơ đồ Slot 26: 7.17](/media/pro192/images/7.17.gif)

</details>

---

**Điều hướng:** [← Slot 25](./slot-25.md) | [Mục lục PRO192](../README.md) | [Slot 27 →](./slot-27.md)
