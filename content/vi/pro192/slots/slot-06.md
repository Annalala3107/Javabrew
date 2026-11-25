---
slot: 6
stage: 2
title: "Slot 06: Kiến trúc Bộ nhớ JVM (Stack / Heap & Modern JVM Note)"
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

# Slot 06: Kiến trúc Bộ nhớ JVM (Stack / Heap & Modern JVM Note)

## 1. Mục tiêu đầu ra & Định vị bài học

- **Giai đoạn:** Giai đoạn 2: Quản lý Bộ nhớ, Wrapper/Math & Chuỗi String/Scanner
- **Trọng tâm thi:** `Thi FE` `Nền tảng JVM` | **Thời lượng gợi ý:** ~25 phút
- **Tài liệu gốc offline:** [Slide PDF](/media/pro192/resources/Memory%20Management%20in%20Java.pdf) · [Slide PPTX](/media/pro192/slides/Memory%20Management%20in%20Java.pptx)
- **Liên kết đề PE thật:** Chủ yếu phục vụ kiến thức nền tảng & câu hỏi trắc nghiệm Final Exam (FE)

**Sau khi hoàn thành Slot này, bạn có thể:**
- Phân biệt dữ liệu nằm trên JVM Stack (biến cục bộ nguyên thủy, con trỏ tham chiếu) và Heap (đối tượng `new`).
- Nắm rõ vòng đời Stack Frame khi gọi/thoát phương thức và hiện tượng `StackOverflowError`.
- Đối chiếu thuật ngữ cũ trên slide ("Static/Dynamic Heap") sang kiến trúc HotSpot hiện đại (**Metaspace / Heap / Stack**).

## 2. Lý thuyết cốt lõi

* **Tài liệu học tập tương ứng:** Bộ slide `Memory Management in Java.pptx` (từ slide *Review: In C* đến slide *Heap structure in Java / Static heap & Dynamic heap*).

### 1.1. So sánh mô hình quản lý bộ nhớ giữa C và Java
Trong ngôn ngữ lập trình C, bộ nhớ chương trình được chia thành 4 phân vùng chính:
* **Data segment:** Chứa dữ liệu toàn cục (global data).
* **Code segment:** Chứa các chỉ thị lệnh thực thi của chương trình.
* **Stack:** Cấp phát cho dữ liệu cục bộ của hàm khi hàm được gọi.
* **Heap:** Cấp phát dữ liệu động thông qua các hàm như `malloc()`, `calloc()`.

Lập trình viên C có trách nhiệm phải quản lý vùng nhớ Heap một cách tường minh. Khi không còn sử dụng một vùng nhớ đã cấp phát, lập trình viên bắt buộc phải tự gọi hàm `free()` để giải phóng. Nếu quên thao tác này, hệ thống sẽ rơi vào tình trạng rò rỉ bộ nhớ (Memory Leak), làm cạn kiệt tài nguyên máy tính.

Ngược lại, trong nền tảng Java, lập trình viên hoàn toàn được giải phóng khỏi việc quản lý bộ nhớ đống thủ công nhờ sự hỗ trợ của Bộ dọn rác tự động (Garbage Collector - GC). Khi cần tạo dữ liệu mới, lập trình viên chỉ cần sử dụng từ khóa `new`. Máy ảo Java (JVM) sẽ tự động theo dõi, phân bổ và thu hồi vùng nhớ. Bộ nhớ của ứng dụng Java được JVM tổ chức thành hai phân vùng cơ bản: **Stack** và **Heap** (bao gồm Static Heap và Dynamic Heap).

### 1.2. Vùng nhớ ngăn xếp (Stack Memory)

![Phân vùng bộ nhớ Stack và Heap](/media/pro192/images/memory.png)

Vùng nhớ Stack vận hành theo nguyên lý Vào sau, Ra trước (LIFO - Last In, First Out) nhằm quản lý luồng thực thi của các phương thức:
* **Dữ liệu cục bộ (Local data):** Chứa giá trị trả về (return data), các tham số truyền vào phương thức và các biến cục bộ được khai báo bên trong thân phương thức.
* **Biến kiểu dữ liệu nguyên thủy (Primitive variables):** Giá trị cụ thể của các biến như `int`, `double`, `boolean`, `char` được lưu trữ trực tiếp ngay tại ô nhớ trên Stack.
* **Biến tham chiếu (Reference variables):** Bản thân biến tham chiếu (ví dụ `String s`, `Student st`) được lưu trên Stack, nhưng giá trị của nó là địa chỉ con trỏ trỏ đến đối tượng thực tế đang cư trú trên Heap.
* **Vòng đời (Lifetime):** Biến cục bộ được cấp phát trên Stack khi phương thức được gọi và lập tức bị hủy bỏ (discarded) khi phương thức kết thúc và thoát ra ngoài.

### 1.3. Vùng nhớ đống tĩnh (Static Heap)
Static Heap được khởi tạo ngay khi các lớp được trình nạp lớp (Class Loader) của JVM tải vào bộ nhớ, trước khi bất kỳ đối tượng nào của lớp được sinh ra:
* **Đặc tính bất biến (Invariable):** Cấu trúc khai báo lớp tồn tại cố định suốt vòng đời của ứng dụng, do đó vùng nhớ này không cần áp dụng dọn rác (Garbage collection is not needed).
* **Thành phần lưu trữ:**
  1. **Khai báo lớp (Class declarations):** Định nghĩa cấu trúc, danh sách thuộc tính và phương thức của lớp.
  2. **Biến tĩnh và hằng số (Static fields / Constants):** Những biến được khai báo với từ khóa `static`, chỉ chiếm một ô nhớ duy nhất dùng chung cho toàn bộ các đối tượng của lớp.
  3. **Bảng phương thức (Method table):** Bảng danh mục lưu ánh xạ giữa tên phương thức và địa chỉ vùng nhớ chứa mã bytecode thực thi của phương thức đó.
  4. **Mã thực thi của phương thức (Code of methods):** Đoạn mã bytecode thực tế của toàn bộ các phương thức nằm tập trung tại Static Heap.

### 1.4. Vùng nhớ đống động (Dynamic Heap)
Dynamic Heap là phân vùng bộ nhớ lưu trữ toàn bộ các đối tượng (instances) được khởi tạo trong thời gian chạy (Runtime) thông qua toán tử `new`. Dynamic Heap được chia thành hai phân khu (Sections) có mối liên kết chặt chẽ:
* **Section 1 (Vùng dữ liệu đối tượng - Objects Data Area):** 
  * Chứa giá trị dữ liệu thực tế của các thuộc tính thể hiện (Instance variables / Non-static fields) của từng đối tượng cụ thể.
  * Khi một đối tượng được tạo ra, JVM tự động bổ sung một trường tham chiếu trỏ ngược về khai báo lớp của nó.
  * Đây là phân khu trực tiếp chịu sự quản lý và thu hồi của Bộ dọn rác tự động khi đối tượng không còn được sử dụng.
* **Section 2 (Vùng quan hệ Đối tượng - Phương thức - Relations Object-Method):**
  * Lưu trữ các bản ghi liên kết giữa đối tượng cụ thể ở Section 1 và phương thức phù hợp trong Static Heap.
  * Mỗi bản ghi gồm hai tham chiếu: địa chỉ của đối tượng và tên phương thức cần gọi.

Quy trình thực thi một lời gọi phương thức từ đối tượng (ví dụ `obj1.m1()`):
1. Chương trình thông qua biến `obj1` trên Stack truy xuất đến địa chỉ đối tượng trong Section 1.
2. Tra cứu Section 2 để tìm bản ghi liên kết tương ứng với phương thức `m1`.
3. Từ Section 2, lần theo địa chỉ tham chiếu đến bảng phương thức (Method table) của lớp trong Static Heap.
4. Lấy địa chỉ điểm vào của phương thức `m1` từ Method table.
5. Nạp và thực thi đoạn mã bytecode của `m1()` trong Static Heap.

> [!WARNING]
> **Modern JVM Note (Đính chính kỹ thuật từ JavaGuide — giữ thuật ngữ slide để đi thi, dùng thuật ngữ chuẩn khi đi làm):**
> Thuật ngữ **"Static Heap"** và **"Dynamic Heap"** trong slide `Memory Management in Java.pptx` là cách mô hình hóa đơn giản hóa từ giáo trình C++/Java cũ. Trên **HotSpot JVM (Java 8–21+)** thực tế:
> - Siêu dữ liệu lớp (Class metadata) và bytecode nằm ở **Metaspace** (Native Memory, thay cho PermGen từ Java 8).
> - Toàn bộ đối tượng (`new`), mảng và biến `static` (gắn với đối tượng `java.lang.Class` tương ứng) nằm trong **JVM Heap**.
> - Khung gọi hàm & biến cục bộ nằm trên **JVM Stack** riêng của từng Thread.
> - Đọc chi tiết chuẩn hiện đại tại: [Cấu trúc Vùng nhớ Runtime JVM (JavaGuide)](../../java/jvm/memory-area.md).

![Sơ đồ cấp phát Stack và Heap trong Java](/media/pro192/images/allocation.png)

![Mô hình phân chia vùng nhớ trong bộ nhớ Java](/media/pro192/images/memory2.png)

## 3. Góc Giảng viên: Bẫy thi FE/PE & Lưu ý JDK 8

> [!WARNING]
> **Các lỗi sinh viên hay mất điểm ở Slot 06:**
> - Phân biệt thi FE vs phỏng vấn: Slide gọi vùng chứa class/static là *"Static Heap"*, nhưng câu hỏi JVM chuẩn Java 8+ dùng **Metaspace** + **JVM Heap** + **JVM Stack**.
> - Khi hàm kết thúc, biến tham chiếu trên Stack biến mất ngay, nhưng đối tượng trên Heap **không biến mất tức thì** mà chờ Garbage Collector thu hồi.

## 4. Luyện tập Chủ động (Active Recall — 5 bài tập)

> Hãy tự suy nghĩ hoặc viết nháp code trên giấy/IDE trước khi bấm mở đáp án để tránh "ảo giác đã hiểu".

### Bài 6.1: Phân bổ dữ liệu giữa Stack và Section 1 của Dynamic Heap

**Đề bài:** Xét đoạn mã sau:
```java
public void test() {
    int age = 20;
    String name = new String("Java");
}
```
Hãy chỉ rõ giá trị `20`, biến `age`, biến `name` và chuỗi đối tượng `"Java"` nằm ở phân vùng bộ nhớ nào (Stack hay Dynamic Heap)?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Biến `age` và giá trị nguyên thủy `20`: Nằm trực tiếp trên **Stack** (thuộc khung ngăn xếp của phương thức `test`).
* Biến `name`: Là một biến tham chiếu, bản thân nó nằm trên **Stack** và lưu địa chỉ vùng nhớ tham chiếu.
* Đối tượng chuỗi `"Java"`: Được tạo ra bởi toán tử `new`, nằm trên **Dynamic Heap** (cụ thể là Section 1). Biến `name` trên Stack trỏ đến ô nhớ của đối tượng này trên Heap.

</details>

---

### Bài 6.2: Bản chất của biến tĩnh (`static`) trong kiến trúc bộ nhớ

**Đề bài:** Biến được khai báo với từ khóa `static` (ví dụ `public static int count = 0;`) được cấp phát trên Stack, Static Heap hay Dynamic Heap? Nếu chúng ta tạo ra 1.000 đối tượng của lớp chứa biến này thì có bao nhiêu biến `count` được tạo ra trong bộ nhớ?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Biến `static` được lưu trữ tại **Static Heap** ngay khi lớp được JVM nạp vào bộ nhớ.
* Dù tạo ra 1.000 đối tượng (hay bất kỳ số lượng nào), **chỉ có duy nhất 1 bản sao** của biến `count` tồn tại trong Static Heap. Toàn bộ 1.000 đối tượng đó đều chia sẻ chung ô nhớ này.

</details>

---

### Bài 6.3: Cơ chế gọi phương thức và bảng Method Table

**Đề bài:** Theo cấu trúc trong slide `Memory Management in Java.pptx`, khi một đối tượng gọi phương thức `obj.display()`, mã thực thi của phương thức `display()` được lấy trực tiếp từ Section 1 của Dynamic Heap hay từ đâu?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Mã thực thi của phương thức **không nằm trong Section 1** của Dynamic Heap (Section 1 chỉ lưu giá trị các biến thể hiện của đối tượng).
* Đối tượng thông qua **Section 2 (Object-Method Linkage Area)** truy xuất con trỏ liên kết trỏ về **bảng phương thức (Method table) nằm trong Static Heap** để nạp và thực thi đoạn mã bytecode của `display()`.

</details>

---

### Bài 6.4: Cơ chế giải phóng ngăn xếp khi phương thức kết thúc

**Đề bài:** Điều gì xảy ra với các biến cục bộ nằm trên Stack khi phương thức chứa chúng thực thi xong và gặp lệnh `return`? Các đối tượng trên Heap mà các biến đó từng trỏ tới có lập tức biến mất ngay thời điểm đó không?

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* Khi phương thức kết thúc, toàn bộ khung ngăn xếp (Stack Frame) của phương thức đó lập tức bị **thu hồi (pop khỏi Stack)**, các biến cục bộ và biến tham chiếu trên Stack biến mất ngay lập tức.
* Tuy nhiên, các đối tượng trên Dynamic Heap mà các biến tham chiếu từng trỏ tới **không bị biến mất ngay lập tức**. Chúng chỉ trở thành đối tượng không còn tham chiếu và sẽ được thu hồi sau đó bởi Bộ dọn rác tự động (Garbage Collector).

</details>

---

### Bài 6.5: Hiện tượng tràn bộ nhớ Stack (StackOverflowError)

**Đề bài:** Đoạn mã đệ quy vô hạn sau sẽ gây ra lỗi gì trong hệ thống bộ nhớ Java? Tại sao?
```java
public class InfiniteCall {
    public static void recurse() {
        recurse();
    }
    public static void main(String[] args) {
        recurse();
    }
}
```

<details>
<summary>👁️ Hiện đáp án &amp; lời giải chi tiết</summary>

* **Lỗi runtime:** Ném ra lỗi `java.lang.StackOverflowError`.
* **Giải thích cơ chế:** Mỗi lần phương thức `recurse()` được gọi, một khung ngăn xếp mới được đẩy vào Stack. Do đệ quy không có điều kiện dừng, các khung ngăn xếp liên tục được xếp chồng lên nhau mà không có khung nào được giải phóng, dẫn đến việc vùng nhớ **Stack bị cạn kiệt dung lượng** được cấp phát bởi JVM.

</details>


---

### 💻 Luyện Code Thực hành (Phong cách W3Schools Tryit)

> Bấm **▶ Chạy thử** ở góc trên khung code để mở trong **Code Studio Tryit**, sửa theo `// TODO` rồi tự đối chiếu với **Expected Output**.

#### 🟢 Thực hành 6A: JVM Stack vs Heap — Truyền Tham trị Nguyên thủy vs Tham chiếu Mảng
- **Mục tiêu:** Hoàn thiện 2 hàm `swap` (kiểu `int`) và `doubleFirst` (`int[]`) để chứng minh mọi lời gọi hàm trong Java đều là Pass-by-Value.
- **Expected Output:**
  - `a=10, b=20`
  - `arr[0]=14`

```java
public class Main {
    static void swap(int x, int y) {
        int tmp = x; x = y; y = tmp;
    }

    static void doubleFirst(int[] arr) {
        // TODO: Nhan doi arr[0] neu mang khac null va do dai > 0
    }

    public static void main(String[] args) {
        int a = 10, b = 20;
        swap(a, b);
        System.out.println("a=" + a + ", b=" + b);

        int[] heapArr = { 7, 9 };
        doubleFirst(heapArr);
        System.out.println("arr[0]=" + heapArr[0]);
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 6A)</summary>

```java
public class Main {
    static void swap(int x, int y) {
        int tmp = x;
        x = y;
        y = tmp;
    }

    static void doubleFirst(int[] arr) {
        if (arr != null && arr.length > 0) {
            arr[0] *= 2;
        }
    }

    public static void main(String[] args) {
        int a = 10, b = 20;
        swap(a, b);
        System.out.println("a=" + a + ", b=" + b);

        int[] heapArr = { 7, 9 };
        doubleFirst(heapArr);
        System.out.println("arr[0]=" + heapArr[0]);
    }
}
```

* **Giải thích:** Với `int[]`, Java sao chép *giá trị địa chỉ Heap* vào Stack Frame của hàm `doubleFirst`, nên hàm có thể chỉnh sửa đối tượng mảng gốc trên Heap; còn `swap(a, b)` chỉ hoán đổi bản sao cục bộ.

</details>

---

#### 🟡 Thực hành 6B: W3Schools Recursion — Đệ quy có Base Case tránh `StackOverflowError`
- **Mục tiêu:** Viết hàm đệ quy `factorial(int n)` với điều kiện dừng `n <= 1` và đếm số frame tạo ra.
- **Expected Output:**
  - `5! = 120`
- 🔗 [Mở bài lab Slot 06 trên Code Studio Tryit](/studio/playground?example=slot-06-lab)

```java
public class Main {
    static long factorial(int n) {
        // TODO: Bo sung base case (n <= 1 -> return 1) de khong tran JVM Stack!
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        System.out.println("5! = " + factorial(5));
    }
}
```

<details>
<summary>👁️ Hiện lời giải chuẩn &amp; giải thích (Thực hành 6B)</summary>

```java
public class Main {
    static long factorial(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        System.out.println("5! = " + factorial(5));
    }
}
```

* **Giải thích:** Mỗi lần gọi đệ quy đẩy thêm 1 Stack Frame vào JVM Stack. Thiếu Base Case làm Stack đầy dần rồi ném `StackOverflowError`.

</details>

## 5. Study Bridge (PRO192 × JavaGuide) & Tài nguyên Slide

- **Đọc sâu bản chất trên JavaGuide:** [Vùng nhớ Runtime JVM (Heap, Metaspace, JVM Stack)](../../java/jvm/memory-area.md)
- **Kho đề thực chiến:** [Kho Đề Practical Exam (PE)](../pe-challenges.md)
- **Tải Slide gốc offline:** [PDF](/media/pro192/resources/Memory%20Management%20in%20Java.pdf) · [PPTX](/media/pro192/slides/Memory%20Management%20in%20Java.pptx)

<details>
<summary>🖼️ Thư viện sơ đồ trực quan từ Slide gốc (3 ảnh)</summary>

![Sơ đồ Slot 6: memory](/media/pro192/images/memory.png)

![Sơ đồ Slot 6: memory2](/media/pro192/images/memory2.png)

![Sơ đồ Slot 6: allocation](/media/pro192/images/allocation.png)

</details>

---

**Điều hướng:** [← Slot 05](./slot-05.md) | [Mục lục PRO192](../README.md) | [Slot 07 →](./slot-07.md)
