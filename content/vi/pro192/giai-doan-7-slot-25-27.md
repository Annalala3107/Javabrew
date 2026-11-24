---
title: "Giai đoạn 7 (Slot 25–27): Java Collections Framework, Collections/Arrays & So sánh"
category: PRO192
slots: "Slot 25 – 27"
lang: vi
description: "List/Set/Map, Iterator & ConcurrentModificationException, HashSet vs TreeSet, HashMap vs TreeMap, Comparable vs Comparator và Collections utility."
---

# GIÁO TRÌNH CHUYÊN SÂU JAVA CƠ BẢN ĐẾN NÂNG CAO
## GIAI ĐOẠN 7: JAVA COLLECTIONS FRAMEWORK, THUẬT TOÁN HỖ TRỢ & BỘ SO SÁNH (SLOT 25 – 27)

---

### MỤC LỤC TỔNG QUAN GIAI ĐOẠN 7
1. **Slot 25:** Tổng quan Java Collections Framework, Cấu trúc `List` (`ArrayList`, `Vector`, `LinkedList`) & Duyệt tập hợp với `Iterator`
   * Bài tập tự luyện Slot 25 (Bài 25.1 – Bài 25.5 kèm lời giải chi tiết)
2. **Slot 26:** Cấu trúc `Set` (`HashSet` vs `TreeSet`) & Cấu trúc `Map` (`HashMap` vs `TreeMap`)
   * Bài tập tự luyện Slot 26 (Bài 26.1 – Bài 26.5 kèm lời giải chi tiết)
3. **Slot 27:** Các lớp tiện ích thuật toán (`Collections`, `Arrays`) & Kỹ thuật so sánh (`Comparable` vs `Comparator`)
   * Bài tập tự luyện Slot 27 (Bài 27.1 – Bài 27.5 kèm lời giải chi tiết)

---

# SLOT 25: TỔNG QUAN JAVA COLLECTIONS FRAMEWORK, CẤU TRÚC `List` & `Iterator`
*Tài liệu bài giảng đối chiếu: `Collections.pptx`*

---

## I. HẠN CHẾ CỦA MẢNG NGUYÊN THỦY & SỰ RA ĐỜI CỦA JCF
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

## II. CÂY PHÂN CẤP GIAO DIỆN CỐT LÕI

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

## III. GIAO DIỆN `List` VÀ CÁC LỚP TRIỂN KHAI
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

## IV. DUYỆT TẬP HỢP VỚI `Iterator` & NGOẠI LỆ `ConcurrentModificationException`
1. **Giao diện `java.util.Iterator<E>`:**
   * Cung cấp cơ chế duyệt qua mọi tập hợp `Collection` mà không làm lộ cấu trúc lưu trữ nội tại của tập hợp.
   * **3 phương thức then chốt:**
     * `boolean hasNext()`: Trả về `true` nếu còn phần tử tiếp theo trong tập hợp.
     * `E next()`: Trả về phần tử kế tiếp và dịch chuyển con trỏ duyệt.
     * `void remove()`: Xóa phần tử hiện tại vừa được trả về bởi `next()` ra khỏi tập hợp gốc.
2. **Ngoại lệ `ConcurrentModificationException`:**
   * Nếu đang sử dụng vòng lặp `for-each` hoặc vòng lặp `for` thường mà lập trình viên gọi trực tiếp phương thức xóa của danh sách (ví dụ: `list.remove(item);`), cấu trúc danh sách bị biến đổi trong khi bộ đếm chỉ mục hoặc con trỏ nội bộ của vòng lặp không đồng bộ. Trình lặp phát hiện sự sai lệch bộ đếm chỉnh sửa (`modCount != expectedModCount`) và lập tức ném ra ngoại lệ `ConcurrentModificationException`.
   * **Giải pháp chuẩn:** Bắt buộc phải sử dụng phương thức `it.remove()` của chính đối tượng `Iterator`.

---

## BỘ BÀI TẬP TỰ LUYỆN SLOT 25 (KÈM LỜI GIẢI CHI TIẾT)

### Bài 25.1: Phân biệt cấu trúc `List`, `Set` và `Map`
* **Đề bài:** Hãy phân biệt 3 giao diện nền tảng `List`, `Set`, và `Map` trong Java Collections Framework dựa trên 2 tiêu chí: tính thứ tự của phần tử và khả năng chứa giá trị trùng lặp.
* **Lời giải chi tiết:**
  * **`List`:** Là tập hợp **có thứ tự xác định** theo vị trí chèn (chỉ mục số nguyên từ 0) và **hoàn toàn cho phép chứa các phần tử trùng lặp**.
  * **`Set`:** Là tập hợp **không cho phép phần tử trùng lặp** (mọi phần tử đều là duy nhất); đa số các cài đặt của Set (như `HashSet`) không bảo đảm duy trì thứ tự chèn.
  * **`Map`:** Lưu trữ dữ liệu dưới dạng **cặp Khóa - Giá trị (`Key - Value`)**. Trong đó tập hợp các Khóa (`Keys`) hoạt động như một `Set` (không được trùng lặp), còn các Giá trị (`Values`) có thể trùng lặp nhau. `Map` không kế thừa từ `Collection`.

---

### Bài 25.2: Lựa chọn giữa `ArrayList` và `LinkedList`
* **Đề bài:** Một ứng dụng xử lý dữ liệu yêu cầu thực hiện 1.000.000 thao tác tra cứu phần tử ngẫu nhiên theo chỉ mục `get(index)`, nhưng rất hiếm khi thêm hoặc bớt dữ liệu. Bạn nên chọn `ArrayList` hay `LinkedList`? Giải thích bản chất cấu trúc dữ liệu dẫn đến sự lựa chọn đó.
* **Lời giải chi tiết:**
  * **Lựa chọn tối ưu:** Bắt buộc phải chọn **`ArrayList`**.
  * **Giải thích bản chất:** 
    * `ArrayList` lưu trữ dữ liệu trên các ô nhớ liên tiếp của mảng (contiguous array), cho phép CPU tính toán địa chỉ ô nhớ và truy xuất ngẫu nhiên trực tiếp tới bất kỳ vị trí `index` nào với độ phức tạp hằng số `O(1)`.
    * Trong khi đó, `LinkedList` lưu trữ dưới dạng các nút rời rạc liên kết bằng con trỏ; để đọc phần tử tại vị trí `index`, chương trình buộc phải duyệt tuần tự qua từng nút từ đầu hoặc từ đuôi với độ phức tạp tuyến tính `O(n)`, gây suy giảm hiệu năng nghiêm trọng khi dữ liệu lớn.

---

### Bài 25.3: Duyệt danh sách bằng `Iterator`
* **Đề bài:** Cho danh sách `List<String> names = new ArrayList<>();` chứa các tên: `"An"`, `"Binh"`, `"Chau"`. Hãy viết một đoạn mã sử dụng giao diện `Iterator` để duyệt qua danh sách và in từng tên ra màn hình console.
* **Lời giải chi tiết:**
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

---

### Bài 25.4: Ngoại lệ `ConcurrentModificationException` và cách xóa phần tử an toàn
* **Đề bài:** Đoạn mã sau bị lỗi gì khi chạy? Hãy sửa lại cho đúng bằng phương thức `remove()` của `Iterator`:
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
* **Lời giải chi tiết:**
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

---

### Bài 25.5: Tính an toàn đa luồng giữa `Vector` và `ArrayList`
* **Đề bài:** Tại sao trong các ứng dụng đơn luồng (single-thread) hiện đại, lập trình viên Java luôn ưu tiên sử dụng `ArrayList` thay vì lớp cổ điển `Vector`? Khi nào thì `Vector` phát huy tác dụng?
* **Lời giải chi tiết:**
  * **Lý do ưu tiên `ArrayList` trong đơn luồng:** Hầu hết các phương thức của `Vector` đều có từ khóa `synchronized` (đồng bộ hóa để khóa ô nhớ). Việc khóa và mở khóa này gây ra chi phí phụ trội (overhead) lớn về thời gian thực thi của CPU. Do `ArrayList` không đồng bộ hóa, nó có tốc độ xử lý nhanh hơn đáng kể so với `Vector`.
  * **Khi nào `Vector` phát huy tác dụng:** `Vector` phù hợp trong các ứng dụng đa luồng (multi-threaded applications), nơi có nhiều luồng cùng lúc truy cập, thêm hoặc sửa đổi danh sách mà không muốn dữ liệu bị xung đột hoặc hỏng trạng thái nội bộ.

---

# SLOT 26: CẤU TRÚC `Set` (HashSet vs TreeSet) & CẤU TRÚC `Map` (HashMap vs TreeMap)
*Tài liệu bài giảng đối chiếu: `Collections.pptx`*

---

## I. GIAO DIỆN `Set` VÀ CƠ CHẾ LOẠI TRÙNG LẶP
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

## II. GIAO DIỆN `Map` VÀ ÁNH XẠ KHÓA - GIÁ TRỊ
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

---

## BỘ BÀI TẬP TỰ LUYỆN SLOT 26 (KÈM LỜI GIẢI CHI TIẾT)

### Bài 26.1: Cơ chế loại bỏ phần tử trùng lặp trong `Set`
* **Đề bài:** Xét đoạn mã sau:
  ```java
  Set<String> set = new HashSet<>();
  set.add("Apple");
  set.add("Banana");
  set.add("Apple");
  set.add("Orange");
  System.out.println(set.size());
  ```
  Màn hình sẽ in ra kích thước `set.size()` là bao nhiêu? Thứ tự các phần tử khi in toàn bộ `set` ra màn hình có chắc chắn là `"Apple", "Banana", "Orange"` không?
* **Lời giải chi tiết:**
  * **Kích thước in ra:** **`3`**.
  * **Giải thích:** Cấu trúc `Set` không chấp nhận phần tử trùng lặp. Lần gọi `set.add("Apple")` thứ hai sẽ bị bỏ qua và trả về `false`, do đó trong tập hợp chỉ còn lại 3 phần tử duy nhất: `"Apple"`, `"Banana"`, `"Orange"`.
  * **Về thứ tự in ra:** **KHÔNG chắc chắn**. `HashSet` sử dụng bảng băm, các phần tử được phân bổ vào các thùng băm dựa trên giá trị băm ngẫu nhiên của chuỗi chứ không lưu vết thứ tự chèn. Nếu muốn bảo đảm thứ tự sắp xếp chữ cái, phải dùng `TreeSet`.

---

### Bài 26.2: Hiện tượng khi thêm `null` vào `TreeSet`
* **Đề bài:** Đoạn mã sau có chạy thành công không?
  ```java
  Set<String> treeSet = new TreeSet<>();
  treeSet.add("Java");
  treeSet.add(null); // Dòng 3
  ```
  Nếu có lỗi, hãy nêu tên ngoại lệ phát sinh tại Dòng 3 và giải thích nguyên nhân dựa trên bản chất cấu trúc dữ liệu của `TreeSet`.
* **Lời giải chi tiết:**
  * Đoạn mã trên **BỊ LỖI THỜI GIAN CHẠY (Runtime Exception)** tại Dòng 3.
  * **Tên ngoại lệ phát sinh:** `java.lang.NullPointerException`.
  * **Nguyên nhân:** `TreeSet` lưu trữ dữ liệu dưới dạng Cây nhị phân tự cân bằng (Red-Black Tree). Mỗi khi chèn thêm một phần tử mới, nó bắt buộc phải gọi phương thức `compareTo()` để so sánh phần tử đó với các nút đã có trên cây nhằm tìm vị trí chèn. Việc gọi hàm so sánh trên giá trị `null` lập tức kích hoạt `NullPointerException`. (Ngược lại, `HashSet` thì hoàn toàn cho phép lưu `null`).

---

### Bài 26.3: Ứng dụng `HashMap` đếm tần suất xuất hiện của từ (Word Counting Pattern)
* **Đề bài:** Cho mảng các từ: `String[] words = {"apple", "banana", "apple", "orange", "banana", "apple"};`. Hãy sử dụng `Map<String, Integer>` để đếm số lần xuất hiện của từng từ và in kết quả ra màn hình.
* **Lời giải chi tiết:**
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

---

### Bài 26.4: Cơ chế ghi đè giá trị khi trùng Khóa (Key) trong `Map`
* **Đề bài:** Xét đoạn mã sau:
  ```java
  Map<Integer, String> students = new HashMap<>();
  students.put(101, "Nguyen Van A");
  students.put(102, "Tran Thi B");
  students.put(101, "Le Van C");
  System.out.println(students.size());
  System.out.println(students.get(101));
  ```
  Chương trình sẽ in ra kích thước `students.size()` và giá trị của `students.get(101)` là gì?
* **Lời giải chi tiết:**
  * `students.size()` in ra: **`2`**.
  * `students.get(101)` in ra: **`Le Van C`**.
  * **Giải thích:** Khóa `101` là duy nhất trong `Map`. Lần gọi `put(101, "Le Van C")` sau sẽ tìm thấy khóa `101` đã tồn tại, hệ thống lập tức cập nhật và ghi đè giá trị `"Le Van C"` lên giá trị cũ `"Nguyen Van A"`. Kích thước của Map vẫn giữ nguyên là 2 (gồm khóa 101 và 102).

---

### Bài 26.5: Tối ưu hiệu năng duyệt Map bằng `entrySet()`
* **Đề bài:** Quan sát hai cách duyệt `Map<String, String> map` sau:
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
* **Lời giải chi tiết:**
  * **Bản chất hiệu năng:**
    * Ở **Cách 1**: Vòng lặp lấy ra tập hợp Khóa. Trong mỗi bước lặp, hàm `map.get(key)` lại phải **tính toán lại hàm băm một lần nữa** và quét thùng băm để tìm giá trị tương ứng. Với `N` phần tử, chương trình phải thực hiện `N` lần tra cứu băm độc lập.
    * Ở **Cách 2**: `entrySet()` trả về một tập hợp các đối tượng `Map.Entry` chứa sẵn cả con trỏ tới `Key` và con trỏ tới `Value` nằm cạnh nhau trên ô nhớ. Việc gọi `entry.getKey()` và `entry.getValue()` chỉ là thao tác đọc trường dữ liệu trực tiếp, hoàn toàn **không tốn thêm bất kỳ phép băm hay tìm kiếm nào**, giúp tiết kiệm đáng kể chu kỳ xử lý của CPU.

---

# SLOT 27: THUẬT TOÁN HỖ TRỢ `Collections` / `Arrays` & BỘ SO SÁNH `Comparable` VS `Comparator`
*Tài liệu bài giảng đối chiếu: `Support Classes.pptx` & `Collections.pptx`*

---

## I. CÁC LỚP HỖ TRỢ THUẬT TOÁN TĨNH: `Collections` VÀ `Arrays`
* **Bản chất:** `java.util.Collections` và `java.util.Arrays` là các lớp tiện ích (utility classes) chỉ chứa toàn bộ các **phương thức tĩnh (static methods)** thực thi các giải thuật kinh điển.
  * `Collections`: Thao tác trên các đối tượng `Collection` hoặc `List`.
  * `Arrays`: Thao tác trực tiếp trên các mảng thuần túy (`primitive/object arrays`).

### Các thuật toán tiêu biểu trong `java.util.Collections`:
1. **Sắp xếp & Xáo trộn:**
   * `Collections.sort(List<T> list)`: Sắp xếp danh sách theo thứ tự tự nhiên tăng dần.
   * `Collections.shuffle(List<?> list)`: Xáo trộn ngẫu nhiên vị trí các phần tử.
2. **Tìm kiếm nhị phân (Binary Search):**
   * `Collections.binarySearch(List list, key)`: **Bắt buộc danh sách phải được sắp xếp tăng dần từ trước**. Trả về chỉ mục `>= 0` nếu tìm thấy, hoặc số âm `< 0` nếu không tìm thấy.
3. **Thao tác cấu trúc:**
   * `Collections.reverse(list)`: Đảo ngược thứ tự danh sách.
   * `Collections.swap(list, i, j)`: Hoán vị vị trí giữa hai phần tử.
   * `Collections.fill(list, val)`: Thay thế toàn bộ phần tử trong danh sách bằng giá trị `val`.
4. **Hàm tổng hợp & Thống kê:**
   * `Collections.min(coll)` / `Collections.max(coll)`: Trả về phần tử nhỏ nhất / lớn nhất.
   * `Collections.frequency(coll, obj)`: Đếm số lần xuất hiện của phần tử `obj` trong tập hợp.
   * `Collections.disjoint(coll1, coll2)`: Trả về `true` nếu hai tập hợp không có phần tử chung nào.

---

## II. THỨ TỰ TỰ NHIÊN VỚI GIAO DIỆN `java.lang.Comparable<T>`
* **Định nghĩa:** Áp đặt **thứ tự tự nhiên (natural ordering)** lên chính bản thân lớp đối tượng. Lớp đối tượng tự cài đặt phương thức so sánh của chính nó.
* **Phương thức duy nhất:**
  `public int compareTo(T other);`
* **Quy ước giá trị trả về:**
  * Trả về **số dương (`> 0`)**: Đối tượng hiện tại (`this`) **lớn hơn** đối tượng `other`.
  * Trả về **số `0`**: Hai đối tượng **bằng nhau**.
  * Trả về **số âm (`< 0`)**: Đối tượng hiện tại (`this`) **nhỏ hơn** đối tượng `other`.

---

## III. THỨ TỰ TÙY BIẾN VỚI GIAO DIỆN `java.util.Comparator<T>`
* **Định nghĩa:** Là một đối tượng hàm so sánh độc lập bên ngoài, dùng để áp đặt các quy tắc sắp xếp linh hoạt mà **không cần sửa đổi mã nguồn của lớp đối tượng gốc**.
* **Phương thức chính:**
  `public int compare(T o1, T o2);`
  * Trả về `> 0`: `o1` đứng sau `o2`.
  * Trả về `0`: `o1` tương đương `o2`.
  * Trả về `< 0`: `o1` đứng trước `o2`.

### Bảng so sánh toàn diện giữa `Comparable` và `Comparator`:

![Ví dụ cài đặt Comparable và Comparator](/media/pro192/images/7.19a.gif)

| Tiêu chí | `Comparable<T>` | `Comparator<T>` |
| :--- | :--- | :--- |
| **Gói thư viện** | `java.lang` (mặc định có sẵn) | `java.util` (bắt buộc import) |
| **Phương thức** | `int compareTo(T o)` (1 tham số) | `int compare(T o1, T o2)` (2 tham số) |
| **Vị trí cài đặt** | Bên trong lớp đối tượng (`implements Comparable`) | Bên ngoài lớp đối tượng (lớp riêng hoặc Anonymous Class) |
| **Sửa đổi mã nguồn gốc**| **Bắt buộc phải sửa** lớp gốc | **Không cần can thiệp** lớp gốc |
| **Số lượng tiêu chí** | Duy nhất 1 tiêu chí mặc định | Vô số tiêu chí tùy biến theo từng bài toán |
| **Cú pháp gọi hàm** | `Collections.sort(list)` | `Collections.sort(list, customComparator)` |

---

## BỘ BÀI TẬP TỰ LUYỆN SLOT 27 (KÈM LỜI GIẢI CHI TIẾT)

### Bài 27.1: Điều kiện tiên quyết của thuật toán `binarySearch`
* **Đề bài:** Xét đoạn mã sau:
  ```java
  List<Integer> list = new ArrayList<>();
  list.add(20);
  list.add(5);
  list.add(40);
  list.add(10);

  int pos = Collections.binarySearch(list, 10);
  System.out.println("Position: " + pos);
  ```
  Kết quả in ra có bảo đảm tìm thấy đúng vị trí của phần tử `10` hay không? Điều kiện tiên quyết để thuật toán `Collections.binarySearch` hoặc `Arrays.binarySearch` hoạt động chính xác là gì?
* **Lời giải chi tiết:**
  * **Đánh giá kết quả:** **KHÔNG bảo đảm chính xác** (có thể trả về số âm hoặc sai vị trí).
  * **Điều kiện tiên quyết:** Theo slide `Support Classes.pptx`, danh sách hoặc mảng **bắt buộc phải được sắp xếp theo thứ tự tăng dần từ trước (The list must be in ascending order)** trước khi thực thi tìm kiếm nhị phân.
  * **Cách sửa chuẩn:**
    ```java
    Collections.sort(list); // Sắp xếp trước: [5, 10, 20, 40]
    int pos = Collections.binarySearch(list, 10); // Trả về chính xác pos = 1
    ```

---

### Bài 27.2: Đếm tần suất và kiểm tra tập hợp rời nhau với `Collections`
* **Đề bài:** Cho danh sách `List<Integer> list = Arrays.asList(2, 8, 5, 8, 9, 8, 1);`.
  1. Dùng phương thức nào của `Collections` để đếm xem số `8` xuất hiện bao nhiêu lần?
  2. Cho danh sách thứ hai `List<Integer> sub = Arrays.asList(3, 4, 6);`. Dùng phương thức nào để kiểm tra xem `list` và `sub` có điểm chung nào hay không?
* **Lời giải chi tiết:**
  1. **Đếm tần suất:** Dùng phương thức tĩnh `Collections.frequency`:
     ```java
     int fre = Collections.frequency(list, 8);
     System.out.println("Occurrences of 8: " + fre); // In ra: 3
     ```
  2. **Kiểm tra rời nhau:** Dùng phương thức tĩnh `Collections.disjoint`:
     ```java
     boolean isDisjoint = Collections.disjoint(list, sub);
     System.out.println("Is disjoint: " + isDisjoint); // In ra: true (vì không có phần tử chung)
     ```

---

### Bài 27.3: Cài đặt `Comparable` sắp xếp đối tượng theo giá tiền tăng dần
* **Đề bài:** Cho lớp `Product` có thuộc tính `private String name;` và `private int price;`. Hãy cho lớp `Product` cài đặt giao diện `Comparable<Product>` sao cho khi gọi `Collections.sort(productList)`, danh sách tự động sắp xếp theo thứ tự **giá tiền (`price`) tăng dần**.
* **Lời giải chi tiết:**
  ```java
  public class Product implements Comparable<Product> {
      private String name;
      private int price;

      public Product(String name, int price) {
          this.name = name;
          this.price = price;
      }

      public int getPrice() { return price; }
      public String getName() { return name; }

      @Override
      public int compareTo(Product other) {
          // Sắp xếp tăng dần theo price
          return Integer.compare(this.price, other.price);
      }

      @Override
      public String toString() {
          return "[" + name + ", " + price + "]";
      }
  }
  ```

---

### Bài 27.4: Xây dựng `Comparator` sắp xếp chuỗi theo độ dài giảm dần
* **Đề bài:** Viết một đối tượng `Comparator<String>` (sử dụng Anonymous Class) để sắp xếp danh sách các chuỗi văn bản theo thứ tự **độ dài chuỗi giảm dần (chuỗi dài hơn đứng trước)**; nếu hai chuỗi có cùng độ dài thì sắp xếp theo thứ tự từ điển A-Z tăng dần.
* **Lời giải chi tiết:**
  ```java
  import java.util.Comparator;

  Comparator<String> customLengthComparator = new Comparator<String>() {
      @Override
      public int compare(String s1, String s2) {
          // So sánh độ dài giảm dần: s2.length() - s1.length()
          int lenDiff = s2.length() - s1.length();
          if (lenDiff != 0) {
              return lenDiff;
          }
          // Cùng độ dài: so sánh thứ tự từ điển tăng dần
          return s1.compareTo(s2);
      }
  };
  ```

---

### Bài 27.5: Chuyển đổi và in nhanh mảng với `Arrays.toString()`
* **Đề bài:** Xét đoạn mã sau:
  ```java
  int[] numbers = {10, 50, 30, 20};
  System.out.println(numbers); // Dòng 2
  ```
  Tại sao Dòng 2 không in ra các con số mà lại in ra chuỗi dạng `[I@15db9742`? Hãy dùng phương thức của lớp `java.util.Arrays` trong slide bài học để sửa lại dòng in ra màn hình đúng định dạng `[10, 50, 30, 20]`.
* **Lời giải chi tiết:**
  * **Nguyên nhân Dòng 2 in ra mã băm:** Mảng trong Java là một đối tượng tham chiếu nhưng nó **không ghi đè phương thức `toString()` của lớp `Object`**. Do đó, khi truyền trực tiếp biến mảng vào `println`, Java sẽ gọi `Object.toString()` mặc định in ra kiểu dữ liệu (`[I` nghĩa là mảng int 1 chiều) kèm mã băm hexadecimal của địa chỉ ô nhớ.
  * **Sửa lại đúng với `Arrays.toString`:**
    ```java
    import java.util.Arrays;
    // ...
    System.out.println(Arrays.toString(numbers));
    ```
  * **Kết quả in ra:** `[10, 50, 30, 20]`.

---

## Study Bridge (PRO192 × JavaGuide) & Tài liệu Slide Offline

- **Đào sâu từ JavaGuide:** [Java Collections Questions Part 1](../java/collection/java-collection-questions-01.md) · [Collections Part 2](../java/collection/java-collection-questions-02.md) · [HashMap Source Code](../java/collection/hashmap-source-code.md) · [ArrayList Source Code](../java/collection/arraylist-source-code.md) · [Collection Precautions](../java/collection/java-collection-precautions-for-use.md)
- **Slide & PDF gốc offline:** [Collections.pdf](/media/pro192/resources/Collections.pdf) · [Collections.pptx](/media/pro192/slides/Collections.pptx)
