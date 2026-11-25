---
title: "Bí kíp & 7 Khuôn mẫu Giải Đề PE PRO192 (Chuẩn JDK 8)"
category: PRO192
slots: "Ôn thi PE (Q1–Q4)"
lang: vi
description: "Cẩm nang phòng thi thực hành PRO192 (PEA/EOS): 9 quy tắc chống 0 điểm, 7 khuôn mẫu code chuẩn Java JDK 1.8 cho Q1–Q4, xử lý interface biên dịch sẵn và ma trận tra nhanh 19 câu đề PE1–PE5."
---

# Bí kíp & 7 Khuôn mẫu Giải Đề PE PRO192 (Chuẩn JDK 8)

Tài liệu này tổng hợp **quy chế chấm tự động PEA / EOS** cùng **7 khuôn mẫu (patterns) lặp lại trên 90%** trong 5 bộ đề thi thật [Kho Đề Practical Exam PE1–PE5](./pe-challenges.md) của môn **PRO192**. Mọi đoạn mã mẫu dưới đây tuân thủ tuyệt đối **Java JDK 1.8** và `default package`.

---

## 1. Checklist 9 Quy tắc Chống 0 Điểm PEA / EOS

Trước khi bấm nút Submit, rà soát đủ 9 điều kiện bắt buộc in trên mọi đề thi chính thức của trường:

| STT | Quy tắc phòng thi | Cách kiểm tra nhanh | Hậu quả nếu vi phạm |
|---:|---|---|---|
| 1 | Dùng đúng **Java JDK 1.8** (hoặc chuẩn bytecode 1.8) | Không dùng `var`, `List.of()`, `String.isBlank()`, `.toList()` | Lỗi biên dịch trên máy chấm -> **0 điểm** |
| 2 | **Không khai báo `package`** (`default package`) | Dòng đầu tiên không có `package ...;` | Máy chấm tìm sai class -> **0 điểm** |
| 3 | **Không gõ tiếng Việt có dấu** trong comment hoặc chuỗi tự thêm | Chỉ dùng ASCII không dấu trong mọi file `.java` | Lỗi encoding UTF-8/MS932 trên trình chấm |
| 4 | **Không tạo file `.java` trùng tên Interface có sẵn** (`I*.class`) | Không tạo `IDaisy.java`, `IString.java`, `IShoes.java`, `ILink.java`, `ILadder.java`, `IStringNumberTool.java` | Đè chữ ký hoặc lệch serial/bytecode |
| 5 | **Không sửa, không xóa các file được cấp sẵn (`given`)** | Chỉ viết/sửa phần class bài làm được yêu cầu | Mất `Main.class` chấm bài -> **0 điểm** |
| 6 | **Không tự tạo Project NetBeans mới** | Mở đúng folder `Q1`, `Q2`, `Q3`, `Q4` trong gói đề tải về | Sai cấu trúc file `.jar` -> **0 điểm** |
| 7 | Dùng đúng **Clean and Build (`Shift + F11`)** trước khi nộp | Xóa thư mục `run` cũ (nếu có), đổi tên `dist` thành `run` | Máy chấm chạy bản build cũ chưa có lời giải |
| 8 | Thư mục `run` chỉ chứa **duy nhất 1 tệp `.jar`** (VD: `Q1.jar`) | Không để file rác, `.txt`, hoặc nộp cả project chưa sửa | Tự động hủy bài -> **0 điểm** |
| 9 | Đúng chính xác từng ký tự định dạng `toString()` và làm tròn | Phân biệt *có dấu cách sau dấu phẩy* vs *không dấu cách*, *Do not format* vs `%.2f` | Fail toàn bộ Test Case so chuỗi |

> [!WARNING]
> **Mẹo xử lý lỗi NetBeans kinh điển (ghi cuối đề PE1):** Nếu project đề cho (ví dụ `Q1`) chạy bị lỗi cache hoặc không nhận `.jar`, hãy bấm **Clean and Build Project (`Shift + F11`)**. Nếu vẫn lỗi, copy/rename folder project từ `Q1` sang `Q1X` rồi mở lại trong NetBeans.

---

## 2. 7 Khuôn mẫu Giải Đề PE Chuẩn JDK 8

### Khuôn mẫu 1 (Q1 — 2đ): Encapsulation & Biến đổi Chuỗi / Chữ số trong Getter/Setter

Dạng Q1 luôn yêu cầu viết một class độc lập trong `default package` gồm 2–4 thuộc tính `private`, constructor mặc định + đầy đủ tham số, và các hàm getter/setter có xử lý chuỗi hoặc công thức toán học nhẹ:
- **Xóa chữ số / ký tự cuối trong getter:** Duyệt ngược từ cuối chuỗi (`i = s.length() - 1` về `0`) để tìm vị trí khớp đầu tiên (`Character.isDigit(c)`), rồi ghép `substring(0, idx) + substring(idx + 1)`.
- **Chuẩn hóa Capitalize (`PE3-Q1 CoffeeShop`):** `Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase()` sau khi kiểm tra `null` và `isEmpty()`.
- **Phân biệt "Do not format the result" vs `String.format("%.2f", ...)`:**
  - Nếu đề ghi *`Do not format the result`* cho getter số thực/nguyên (ví dụ `getTotalRevenue()`), trả về thẳng `double` gốc, chỉ format ở hàm `toString()` nếu đề yêu cầu.

```java
// Mau Q1: Xoa chu so cuoi cung va dem ky tu khong phai chu so (PE1-Q1 Crocus)
public String getName() {
    if (name == null) {
        return "";
    }
    for (int i = name.length() - 1; i >= 0; i--) {
        if (Character.isDigit(name.charAt(i))) {
            return name.substring(0, i) + name.substring(i + 1);
        }
    }
    return name;
}

public void setWeight(int weight) {
    int nonDigits = 0;
    if (name != null) {
        for (int i = 0; i < name.length(); i++) {
            if (!Character.isDigit(name.charAt(i))) {
                nonDigits++;
            }
        }
    }
    this.weight = weight - nonDigits;
}
```

### Khuôn mẫu 2 (Q2 — 3đ): Kế thừa `extends`, Bẫy Tham số `super(...)` & `toString()`

Dạng Q2 gồm lớp cha (ví dụ `Daisy`, `Cala`, `Screen`, `Chair`, `Ladder`) và lớp con (`SpecDaisy`, `SpecCala`, `OLEDScreen`, `SpecChair`, `SpecLadder`) cùng 3 phương thức đặc trưng `toString()`, `setData()`/`setType()` và `getValue()`:
1. **Kiểm tra cực kỹ thứ tự tham số Constructor lớp con!** Không phải lúc nào cũng là `(thuộc_tính_cha..., thuộc_tính_con)`. Ví dụ trong `PE2-Q2`, đề quy định `SpecCala(int color, String owner, int price)` — biến `color` của lớp con đứng **đầu tiên**!
2. **Dùng `@Override` cho `toString()` và kiểm tra dấu cách sau dấu phẩy:**
   - Có dấu cách: `getName() + ", " + color + ", " + getAge()` (`PE1-Q2`, `PE2-Q2`, `PE5-Q2`).
   - Không có dấu cách: `String.format("%s,%d,%s", getColor(), getQuantity(), type)` (`PE3-Q2`, `PE4-Q2`).
3. **Thao tác ký tự trên `String` bất biến:** Dùng `char[] arr = s.toCharArray()` hoặc `StringBuilder` để hoán đổi/thay thế rồi cập nhật lại bằng `setName(...)` / `setType(...)`.

```java
// Mau Q2: Hoan doi 2 chu thuong (a-z) dau tien trong name (PE1-Q2 SpecDaisy)
// Luu y test case "DaIsy" -> "DsIay" (chu 'I' viet hoa khong bi hoan doi)
public void setData() {
    String s = getName();
    if (s == null) {
        return;
    }
    int first = -1;
    int second = -1;
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (c >= 'a' && c <= 'z') {
            if (first == -1) {
                first = i;
            } else {
                second = i;
                break;
            }
        }
    }
    if (second != -1) {
        char[] chars = s.toCharArray();
        char tmp = chars[first];
        chars[first] = chars[second];
        chars[second] = tmp;
        setName(new String(chars));
    }
}
```

### Khuôn mẫu 3 (Q3A — 2đ): Lớp Danh sách Kế thừa `ArrayList<T>` (`TicketList`, `EmployeeList`)

Một biến thể phổ biến của Q3 (`PE2-Q3`, `PE3-Q3`) cho lớp quản lý kế thừa trực tiếp `ArrayList<T>`:
- `public class TicketList extends ArrayList<Ticket>` -> bản thân `this` chính là `List<Ticket>`.
- **Tìm Min/Max trên `this`:** Luôn kiểm tra `if (isEmpty()) return null;` trước khi khởi tạo `T best = this.get(0);`.
- **So sánh chuỗi không phân biệt hoa/thường:** Kiểm tra `null` ở cả 2 phía rồi gọi `t.getType().equalsIgnoreCase(value)` (`PE2-Q3`).
- **So sánh chuỗi chính xác (`ID`):** Dùng `e.getEmployeeId().equals(id)` (`PE3-Q3`).

```java
// Mau Q3A: Ke thua ArrayList<Ticket> (PE2-Q3 TicketList)
public class TicketList extends ArrayList<Ticket> {
    public void addTicket(Ticket ticket) {
        if (ticket != null) {
            this.add(ticket);
        }
    }

    public Ticket getCheapestTicket() {
        if (this.isEmpty()) {
            return null;
        }
        Ticket cheapest = this.get(0);
        for (int i = 1; i < this.size(); i++) {
            if (this.get(i).getPrice() < cheapest.getPrice()) {
                cheapest = this.get(i);
            }
        }
        return cheapest;
    }

    public int countTicketsByType(String value) {
        if (value == null) {
            return 0;
        }
        int count = 0;
        for (Ticket t : this) {
            if (t.getType() != null && t.getType().equalsIgnoreCase(value)) {
                count++;
            }
        }
        return count;
    }
}
```

### Khuôn mẫu 4 (Q3B — 3đ): Partial Sort (Sắp xếp Cục bộ, Giữ Nguyên Vị trí Phần tử Không Khớp)

Đây là **bẫy phân loại điểm 9–10** xuất hiện trong `PE1-Q3 (f2)`: chỉ sắp xếp những phần tử thỏa điều kiện `P` (ví dụ `name` có ít nhất 1 chữ thường `a-z`) tăng dần theo `age`, còn các phần tử không thỏa `P` **phải đứng nguyên tại chỉ số ban đầu**.

Nếu gọi thẳng `Collections.sort(t, ...)` trên toàn danh sách sẽ **sai hoàn toàn**! Hãy dùng thuật toán **3 bước Tách – Sắp xếp – Trả về vị trí**:
1. Duyệt `i = 0 .. t.size() - 1`: nếu `t.get(i)` thỏa điều kiện, lưu `i` vào `List<Integer> indices` và lưu `t.get(i)` vào `List<Daisy> matched`.
2. Gọi `Collections.sort(matched, ...)` với `Comparator` chuẩn JDK 8.
3. Duyệt `k = 0 .. indices.size() - 1`, ghi đè `t.set(indices.get(k), matched.get(k))`.

```java
// Mau Q3B: Partial Sort giu nguyen vi tri phan tu khong khop (PE1-Q3 f2)
@Override
public void f2(List<Daisy> t) {
    List<Integer> indices = new ArrayList<Integer>();
    List<Daisy> matched = new ArrayList<Daisy>();
    for (int i = 0; i < t.size(); i++) {
        Daisy d = t.get(i);
        if (hasLowercase(d.getName())) {
            indices.add(i);
            matched.add(d);
        }
    }
    Collections.sort(matched, new Comparator<Daisy>() {
        @Override
        public int compare(Daisy a, Daisy b) {
            return Integer.compare(a.getAge(), b.getAge());
        }
    });
    for (int k = 0; k < indices.size(); k++) {
        t.set(indices.get(k), matched.get(k));
    }
}
```

### Khuôn mẫu 5 (Q3C — 3đ): Xóa & Thay thế An toàn trên `List<T>` (Tránh `ConcurrentModificationException`)

Trong `f3` của `PE1-Q3`, `PE4-Q3`, `PE5-Q3`:
- **Xóa nhiều phần tử thỏa điều kiện (`PE4-Q3` xóa tên bắt đầu bằng `'s'`, `PE5-Q3` xóa tất cả item có số chữ cái lớn nhất):**
  - **CẤM** dùng `for (T item : t) { t.remove(item); }` -> ném `ConcurrentModificationException`.
  - **CẤM** dùng `for (int i = 0; i < t.size(); i++)` tăng `i` bình thường khi xóa -> bỏ sót phần tử đứng ngay sau phần tử vừa bị xóa!
  - **LUÔN** dùng `Iterator<T>` + `it.remove()`, hoặc duyệt ngược `for (int i = t.size() - 1; i >= 0; i--)`.
- **Thay thế dựa trên phần tử đại diện (`PE1-Q3 f3`):** Phải hoàn tất vòng lặp tìm phần tử thay thế đầu tiên (`firstNonPalin`) trước, **không được vừa tìm vừa thay thế trong cùng 1 vòng lặp**. Lưu ý kiểm tra `t.set(i, new Daisy(first.getName(), first.getAge()))` hoặc `t.set(i, first)` đúng như đặc tả tham chiếu đối tượng của đề.

```java
// Mau Q3C: Tim max letters roi xoa an toan bang Iterator (PE5-Q3 f3)
@Override
public void f3(List<Ladder> t) {
    if (t == null || t.isEmpty()) {
        return;
    }
    int maxLetters = -1;
    for (Ladder item : t) {
        int cnt = countLetters(item.getType());
        if (cnt > maxLetters) {
            maxLetters = cnt;
        }
    }
    Iterator<Ladder> it = t.iterator();
    while (it.hasNext()) {
        if (countLetters(it.next().getType()) == maxLetters) {
            it.remove();
        }
    }
}
```

### Khuôn mẫu 6 (Q4 — 2–3đ): Xử lý Chuỗi Nâng cao (`split("\\s+")`, `HashSet`, `replace` vs `replaceAll`)

Dạng Q4 cung cấp sẵn bytecode Interface (`IString`, `IStringNumberTool`, `ILink`) và yêu cầu viết lớp `My... implements I...`:
1. **Tách từ chuẩn mọi trường hợp (`PE1-Q4`, `PE5-Q4`):** `String trimmed = str.trim(); if (trimmed.isEmpty()) return 0;` -> `String[] words = trimmed.split("\\s+");`. Không dùng `str.isBlank()` vì đây là API từ Java 11!
2. **Bẫy Regex trong `replaceAll` (`PE4-Q4 MyLink`):**
   - Trong Regex, dấu chấm `.` khớp **mọi ký tự**! Gọi `str.replaceAll(".", ":")` sẽ biến cả URL thành chuỗi toàn dấu `:` (`::::::::::::::::::::`)!
   - Phải dùng **`str.replace(".", ":")`** (thay chuỗi thuần, an toàn, nhanh hơn).
3. **Đếm chữ số phân biệt (`PE5-Q4 f1`):** Dùng `Set<Character> digits = new HashSet<Character>();` thêm từng ký tự `Character.isDigit(c)` -> kiểm tra `digits.size() == 2`.
4. **Chuyển thập phân sang nhị phân không dùng hàm thư viện (`PE3-Q4`):** Khi đề cấm `Integer.toBinaryString(n)`, tự chia liên tiếp `% 2` và `/ 2` với `StringBuilder`, rồi `.reverse().toString()`, nhớ chặn riêng `n == 0` -> `"0"`.

```java
// Mau Q4: Dem tu co dung 2 chu so khac nhau va >= 1 chu thuong (PE5-Q4 f1)
@Override
public int f1(String str) {
    if (str == null) {
        return 0;
    }
    String trimmed = str.trim();
    if (trimmed.isEmpty()) {
        return 0;
    }
    int count = 0;
    String[] words = trimmed.split("\\s+");
    for (String w : words) {
        Set<Character> distinctDigits = new HashSet<Character>();
        boolean hasLower = false;
        for (int i = 0; i < w.length(); i++) {
            char c = w.charAt(i);
            if (Character.isDigit(c)) {
                distinctDigits.add(c);
            } else if (c >= 'a' && c <= 'z') {
                hasLower = true;
            }
        }
        if (distinctDigits.size() == 2 && hasLower) {
            count++;
        }
    }
    return count;
}
```

### Khuôn mẫu 7: Tự Viết Mock `Main` Test Cục bộ & So Khớp Bytecode `I*.class`

Trong phòng thi, bộ template NetBeans thường cung cấp sẵn `Main.class` (đọc `Scanner`) và `I*.class` nằm trong thư mục `build/classes` hoặc `lib`. Khi luyện tại nhà hoặc trong **Code Studio Playground** trên JavaBrew:
- **Không sửa/nộp `Main.java` trong gói bài thi**, nhưng có thể tạo tạm một lớp kiểm thử ngoài luồng (hoặc dùng nút **▶ Chấm Test Case PE** trong **Code Studio** từ [Kho Đề Thực hành PE](./pe-challenges.md)) để ép các ca biên rỗng, 1 ký tự, không có chữ số, chữ hoa toàn bộ (`YELLOW`), hoặc số `0`.
- Đối chiếu kỹ đầu ra từng ký tự: **khoảng trắng thừa đầu/cuối**, **dấu phẩy `, ` vs `,`**, và **chữ số thập phân `%.2f`**.

---

## 3. Ma trận Tra nhanh 19 Câu Đề PE Thật (`PE1–PE5`)

> [!NOTE]
> Bộ nguồn gốc lưu trữ đầy đủ **4 câu (`Q1–Q4`)** cho `PE1`, `PE3`, `PE4`, `PE5`, và **3 câu (`Q1–Q3`)** cho `PE2` (`Paper No: 1`, không có ảnh `Q4` trong thư mục nguồn), tổng cộng **19 bài thực chiến**.

| Mã đề | Bài toán & Lớp chính | Khuôn mẫu áp dụng | Slots liên quan | Luyện tập |
|---|---|---|---|---|
| **PE1-Q1** | `Crocus` — xóa chữ số cuối, đếm non-digit | Khuôn mẫu 1 | [Slot 04](./slots/slot-04.md), [Slot 08](./slots/slot-08.md), [Slot 12](./slots/slot-12.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE1-Q2** | `Daisy` / `SpecDaisy` — hoán đổi 2 chữ thường đầu | Khuôn mẫu 2 | [Slot 14](./slots/slot-14.md), [Slot 15](./slots/slot-15.md), [Slot 16](./slots/slot-16.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE1-Q3** | `MyDaisy` (`IDaisy`) — Partial Sort & Palindrome | Khuôn mẫu 4, 5 | [Slot 20](./slots/slot-20.md), [Slot 25](./slots/slot-25.md), [Slot 27](./slots/slot-27.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE1-Q4** | `MyString` (`IString`) — vị trí letter/digit | Khuôn mẫu 6 | [Slot 09](./slots/slot-09.md), [Slot 20](./slots/slot-20.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE2-Q1** | `Camel` — uppercase `desert` & `setStep` | Khuôn mẫu 1 | [Slot 09](./slots/slot-09.md), [Slot 12](./slots/slot-12.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE2-Q2** | `Cala` / `SpecCala` — bẫy tham số `color` đứng đầu | Khuôn mẫu 2 | [Slot 14](./slots/slot-14.md), [Slot 15](./slots/slot-15.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE2-Q3** | `Ticket` / `TicketList extends ArrayList` | Khuôn mẫu 3 | [Slot 17](./slots/slot-17.md), [Slot 25](./slots/slot-25.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE3-Q1** | `CoffeeShop` — capitalize, ngưỡng doanh thu 100 ly | Khuôn mẫu 1 | [Slot 04](./slots/slot-04.md), [Slot 09](./slots/slot-09.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE3-Q2** | `Screen` / `OLEDScreen` — clamp `< 0`, `%.2f` no-space | Khuôn mẫu 2 | [Slot 15](./slots/slot-15.md), [Slot 16](./slots/slot-16.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE3-Q3** | `Employee` / `EmployeeList extends ArrayList` | Khuôn mẫu 3 | [Slot 17](./slots/slot-17.md), [Slot 25](./slots/slot-25.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE3-Q4** | `MyStringNumberTool` — Acronym & Binary thủ công | Khuôn mẫu 6 | [Slot 05](./slots/slot-05.md), [Slot 09](./slots/slot-09.md), [Slot 20](./slots/slot-20.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE4-Q1** | `Person` — nối tên & format không dấu cách | Khuôn mẫu 1 | [Slot 09](./slots/slot-09.md), [Slot 13](./slots/slot-13.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE4-Q2** | `Chair` / `SpecChair` — cắt ký tự đầu & flash sale | Khuôn mẫu 2 | [Slot 14](./slots/slot-14.md), [Slot 16](./slots/slot-16.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE4-Q3** | `Shoes` / `MyShoes` (`IShoes`) — max, desc sort, Iterator remove | Khuôn mẫu 5 | [Slot 20](./slots/slot-20.md), [Slot 25](./slots/slot-25.md), [Slot 27](./slots/slot-27.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE4-Q4** | `MyLink` (`ILink`) — bẫy `replaceAll(".")` trên URL | Khuôn mẫu 6 | [Slot 09](./slots/slot-09.md), [Slot 20](./slots/slot-20.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE5-Q1** | `Coral` — cắt ký tự cuối cùng của `name` | Khuôn mẫu 1 | [Slot 09](./slots/slot-09.md), [Slot 12](./slots/slot-12.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE5-Q2** | `Ladder` / `SpecLadder` — đổi chữ cái cuối thành chữ số cuối | Khuôn mẫu 2 | [Slot 08](./slots/slot-08.md), [Slot 15](./slots/slot-15.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE5-Q3** | `Ladder` / `MyLadder` (`ILadder`) — longest length & remove max letters | Khuôn mẫu 5 | [Slot 20](./slots/slot-20.md), [Slot 25](./slots/slot-25.md) | [Kho Đề PE](./pe-challenges.md) |
| **PE5-Q4** | `MyString` (`IString`) — `HashSet` 2 chữ số khác nhau | Khuôn mẫu 6 | [Slot 05](./slots/slot-05.md), [Slot 20](./slots/slot-20.md), [Slot 26](./slots/slot-26.md) | [Kho Đề PE](./pe-challenges.md) |
