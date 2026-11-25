---
title: "Kho Đề Thực hành PRO192 Practical Exam (PE1–PE5)"
category: PRO192
slots: "PE Prep (Q1–Q4)"
lang: vi
description: "Trọn bộ 19 câu đề thi thực hành PRO192 thật (PE1–PE5) chuẩn Java JDK 1.8 và default package, kèm sơ đồ UML, bảng Input/Output mẫu, bẫy thường gặp và lời giải sạch."
---

# Kho Đề Thực hành PRO192 Practical Exam (`M5 & M7`)

Kho đề dưới đây số hóa nguyên bản **5 đề thi Practical Exam PRO192 chính thức của FPT (`PE1`–`PE5`, tổng cộng 19 câu Q1–Q4)**. Toàn bộ mã nguồn tuân thủ tuyệt đối chuẩn chấm tự động PEA / EOS: **Java JDK 1.8**, **`default package`** (không khai báo `package`), không dùng API Java 11+, và không dùng tiếng Việt có dấu trong comment.

> [!TIP]
> Trước khi luyện đề, hãy đọc [Bí kíp & 7 Khuôn mẫu Giải Đề PE PRO192 (Chuẩn JDK 8)](./pe-patterns.md) để nắm checklist 9 quy tắc chống 0 điểm và các mẫu code lặp lại trong Q1–Q4.

> [!NOTE]
> Thư mục đề nguồn gồm đủ 4 câu (`Q1–Q4`) cho **PE1, PE3, PE4, PE5** và 3 câu (`Q1–Q3`) cho **PE2** (`Paper No: 1` không lưu ảnh `Q4`).

---

## Đề PE 01 — PE1-Q1: Crocus — Encapsulation & Xử lý Chữ số (PE1 · Q1 · 2 điểm · 15 phút)

### Yêu cầu đề bài

Viết lớp `Crocus` (trong `default package`) theo thiết kế sau:
- Thuộc tính (`private`): `-name: String`, `-weight: int`
- Phương thức (`public`):
  - `Crocus()` — default constructor
  - `Crocus(String name, int weight)` — khởi tạo `name` và `weight`
  - `getName(): String` — trả về chuỗi `name` sau khi **xóa chữ số cuối cùng** xuất hiện trong `name` (nếu không có chữ số thì giữ nguyên)
  - `getWeight(): int` — trả về `weight`
  - `setWeight(int weight): void` — cập nhật `this.weight = weight - n` (trong đó `n` là **số ký tự không phải chữ số** trong `name`)
- Lưu ý đề bài: *Do not format the result.*

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`getName`) | `name = "crocus3"`, `weight = 2` | `crocus` |
| TC 2 (`setWeight`) | `name = "crocus3"`, `weight = 2`, `newWeight = 10` | `4` |

### Bẫy thường gặp
- Nhầm lẫn `getName()` là *xóa ký tự cuối cùng* (`PE5-Q1 Coral`) thay vì *xóa chữ số cuối cùng*: ví dụ `"cro2cus"` phải thành `"crocus"`, không phải `"cro2cu"`.
- Quên xử lý `name == null` trong `getName()` và `setWeight()`.

### Lời giải chuẩn

```java
// Crocus.java (JDK 1.8 - default package)
public class Crocus {
    private String name;
    private int weight;

    public Crocus() {
    }

    public Crocus(String name, int weight) {
        this.name = name;
        this.weight = weight;
    }

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

    public int getWeight() {
        return weight;
    }

    public void setWeight(int weight) {
        int nonDigitCount = 0;
        if (name != null) {
            for (int i = 0; i < name.length(); i++) {
                if (!Character.isDigit(name.charAt(i))) {
                    nonDigitCount++;
                }
            }
        }
        this.weight = weight - nonDigitCount;
    }
}
```

---

## Đề PE 02 — PE1-Q2: SpecDaisy — Kế thừa & Xử lý Chữ thường (PE1 · Q2 · 3 điểm · 20 phút)

### Yêu cầu đề bài

Viết lớp cha `Daisy` và lớp con `SpecDaisy extends Daisy` (trong `default package`):
1. Lớp `Daisy`: `-name: String`, `-age: int`, `Daisy()`, `Daisy(String name, int age)`, `getName()`, `getAge()`, `setName(String name)`, `toString()` trả về định dạng `name, age`.
2. Lớp `SpecDaisy`: `-color: String`, `SpecDaisy()`, `SpecDaisy(String name, int age, String color)`, `getColor()`:
   - `toString(): String` — trả về `name, color, age`.
   - `setData(): void` — **đảo chỗ 2 chữ cái viết thường (`a-z`) đầu tiên** xuất hiện trong `name`.
   - `getValue(): String` — nếu `color` có ít nhất 1 chữ cái thường (`a-z`), trả về `name` đã **xóa toàn bộ chữ cái thường (`a-z`)**; ngược lại trả về `name` gốc.

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`toString`) | `name = "daisy", age = 2, color = "yellow"` | `daisy, 2` / `daisy, yellow, 2` |
| TC 2 (`setData`) | `name = "DaIsy", age = 2, color = "yellow"` | `DsIay, 2` |
| TC 3a (`getValue`) | `name = "Daisy123", age = 2, color = "Yellow"` | `D123` |
| TC 3b (`getValue`) | `name = "Daisy123", age = 2, color = "YELLOW"` | `Daisy123` |

### Bẫy thường gặp
- Kiểm tra `c >= 'a' && c <= 'z'` thay vì `Character.isLetter(c)`: với `"DaIsy"` (`'I'` viết hoa), 2 chữ thường đầu tiên là `'a'` (index 1) và `'s'` (index 3) -> đổi thành `"DsIay"`.
- Nhầm định dạng `toString()` có dấu cách sau dấu phẩy (`name + ", " + color + ", " + age`).

### Lời giải chuẩn

```java
// Daisy.java (JDK 1.8 - default package)
public class Daisy {
    private String name;
    private int age;

    public Daisy() {
    }

    public Daisy(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return name + ", " + age;
    }
}
```

```java
// SpecDaisy.java (JDK 1.8 - default package)
public class SpecDaisy extends Daisy {
    private String color;

    public SpecDaisy() {
    }

    public SpecDaisy(String name, int age, String color) {
        super(name, age);
        this.color = color;
    }

    public String getColor() {
        return color;
    }

    @Override
    public String toString() {
        return getName() + ", " + color + ", " + getAge();
    }

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
            char[] arr = s.toCharArray();
            char tmp = arr[first];
            arr[first] = arr[second];
            arr[second] = tmp;
            setName(new String(arr));
        }
    }

    public String getValue() {
        String s = getName();
        if (s == null) {
            return "";
        }
        boolean hasLower = false;
        if (color != null) {
            for (int i = 0; i < color.length(); i++) {
                char c = color.charAt(i);
                if (c >= 'a' && c <= 'z') {
                    hasLower = true;
                    break;
                }
            }
        }
        if (!hasLower) {
            return s;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c < 'a' || c > 'z') {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
```

---

## Đề PE 03 — PE1-Q3: MyDaisy — Partial Sort & Palindrome (PE1 · Q3 · 3 điểm · 30 phút)

### Yêu cầu đề bài

Cho lớp `Daisy` (`name: String`, `age: int`, đủ getter/setter) và interface `IDaisy` đã biên dịch sẵn dạng bytecode (**không tạo lại file `IDaisy.java`**):

```java
import java.util.List;

public interface IDaisy {
    public int f1(List<Daisy> t);
    public void f2(List<Daisy> t);
    public void f3(List<Daisy> t);
}
```

Viết lớp `MyDaisy implements IDaisy`:
- `f1(List<Daisy> t)`: Trả về tổng `age` các `Daisy` có `name` chứa ít nhất 1 chữ hoa (`A-Z`) và ít nhất 1 chữ thường (`a-z`).
- `f2(List<Daisy> t)`: Sắp xếp tăng dần theo `age` **chỉ với các `Daisy` có `name` chứa ít nhất 1 chữ thường (`a-z`)**, giữ nguyên vị trí của mọi phần tử còn lại.
- `f3(List<Daisy> t)`: Thay thế mọi `Daisy` có `name` là chuỗi đối xứng (*palindrome*, phân biệt hoa/thường) bằng **phần tử `Daisy` đầu tiên không phải palindrome**. Nếu tất cả đều là palindrome thì không thay đổi danh sách.

| Test Case mẫu | Danh sách đầu vào | Kết quả kỳ vọng |
|---|---|---|
| TC 1 (`f1`) | `(Ab1,6) (CD2,9) (ef2,11) (gH2,14)` | `20` |
| TC 2 (`f2`) | `(A11,5) (b12,9) (C23,1) (d45,5) (E56,11) (f67,2)` | `(A11,5) (f67,2) (C23,1) (d45,5) (E56,11) (b12,9)` |
| TC 3 (`f3`) | `(C1C,16) (B1b,7) (C1,10) (D1,14)` | `(B1b,7) (B1b,7) (C1,10) (D1,14)` |

### Bẫy thường gặp
- Trong `f2`: gọi `Collections.sort(t, ...)` trực tiếp làm xáo trộn vị trí của `(A11,5)`, `(C23,1)`, `(E56,11)`! Phải tách 2 danh sách `indices` và `matched`, sort `matched`, rồi gán lại bằng `t.set(indices.get(k), matched.get(k))`.
- Trong `f3`: `"B1b"` không phải palindrome vì kiểm tra **case-sensitive** (`'B' != 'b'`). Ngoài ra phải tìm `firstNonPalin` xong hoàn toàn trước khi chạy vòng lặp thay thế.

### Lời giải chuẩn

```java
// MyDaisy.java (JDK 1.8 - default package, khong tao IDaisy.java)
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class MyDaisy implements IDaisy {

    private boolean hasLower(String s) {
        if (s == null) {
            return false;
        }
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c >= 'a' && c <= 'z') {
                return true;
            }
        }
        return false;
    }

    private boolean hasUpperAndLower(String s) {
        if (s == null) {
            return false;
        }
        boolean upper = false;
        boolean lower = false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c >= 'A' && c <= 'Z') {
                upper = true;
            } else if (c >= 'a' && c <= 'z') {
                lower = true;
            }
        }
        return upper && lower;
    }

    private boolean isPalindrome(String s) {
        if (s == null) {
            return false;
        }
        int l = 0;
        int r = s.length() - 1;
        while (l < r) {
            if (s.charAt(l) != s.charAt(r)) {
                return false;
            }
            l++;
            r--;
        }
        return true;
    }

    @Override
    public int f1(List<Daisy> t) {
        if (t == null) {
            return 0;
        }
        int sum = 0;
        for (Daisy d : t) {
            if (d != null && hasUpperAndLower(d.getName())) {
                sum += d.getAge();
            }
        }
        return sum;
    }

    @Override
    public void f2(List<Daisy> t) {
        if (t == null || t.isEmpty()) {
            return;
        }
        List<Integer> indices = new ArrayList<Integer>();
        List<Daisy> matched = new ArrayList<Daisy>();
        for (int i = 0; i < t.size(); i++) {
            Daisy d = t.get(i);
            if (d != null && hasLower(d.getName())) {
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

    @Override
    public void f3(List<Daisy> t) {
        if (t == null || t.isEmpty()) {
            return;
        }
        Daisy firstNonPalin = null;
        for (Daisy d : t) {
            if (d != null && !isPalindrome(d.getName())) {
                firstNonPalin = d;
                break;
            }
        }
        if (firstNonPalin == null) {
            return;
        }
        for (int i = 0; i < t.size(); i++) {
            Daisy d = t.get(i);
            if (d != null && isPalindrome(d.getName())) {
                t.set(i, new Daisy(firstNonPalin.getName(), firstNonPalin.getAge()));
            }
        }
    }
}
```

---

## Đề PE 04 — PE1-Q4: MyString — Vị trí Chữ cái và Chữ số (PE1 · Q4 · 2 điểm · 20 phút)

### Yêu cầu đề bài

Cho interface `IString` đã biên dịch sẵn dạng bytecode (**không tạo lại `IString.java`**):

```java
public interface IString {
    public int f1(String str);
    public String f2(String str);
}
```

Viết lớp `MyString implements IString`:
- `f1(String str)`: Đếm số từ (từ = chuỗi con không chứa dấu cách) mà **chữ cái đầu tiên đứng trước chữ số đầu tiên** VÀ **chữ cái cuối cùng đứng sau chữ số cuối cùng**.
- `f2(String str)`: Với mỗi từ, **thay chữ số đầu tiên** trong từ bằng **số lượng chữ cái** có trong từ đó, giữ nguyên các ký tự còn lại. Nếu từ không có chữ số thì giữ nguyên. Các từ kết quả cách nhau 1 dấu cách, không có dấu cách thừa đầu/cuối.

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`f1`) | `"abc12def A12B C123 abc123 xyz"` | `2` |
| TC 2 (`f2`) | `"ab12 xyz A1B2 hello3"` | `"ab22 xyz A2B2 hello5"` |

### Bẫy thường gặp
- Từ chỉ có chữ cái (`"xyz"`) hoặc chỉ có chữ số (`"123"`): nếu không kiểm tra `firstLetter != -1 && firstDigit != -1`, phép so sánh `-1 < 2` sẽ sai.
- Quên xử lý từ có chữ số nhưng `0` chữ cái (nên đếm bằng `Character.isLetter`), hoặc dư dấu cách cuối khi nối chuỗi.

### Lời giải chuẩn

```java
// MyString.java (JDK 1.8 - default package, khong tao IString.java)
public class MyString implements IString {

    @Override
    public int f1(String str) {
        if (str == null) {
            return 0;
        }
        String trimmed = str.trim();
        if (trimmed.isEmpty()) {
            return 0;
        }
        String[] words = trimmed.split("\\s+");
        int count = 0;
        for (String w : words) {
            int firstLetter = -1;
            int lastLetter = -1;
            int firstDigit = -1;
            int lastDigit = -1;
            for (int i = 0; i < w.length(); i++) {
                char c = w.charAt(i);
                if (Character.isLetter(c)) {
                    if (firstLetter == -1) {
                        firstLetter = i;
                    }
                    lastLetter = i;
                } else if (Character.isDigit(c)) {
                    if (firstDigit == -1) {
                        firstDigit = i;
                    }
                    lastDigit = i;
                }
            }
            if (firstLetter != -1 && firstDigit != -1
                    && firstLetter < firstDigit && lastLetter > lastDigit) {
                count++;
            }
        }
        return count;
    }

    @Override
    public String f2(String str) {
        if (str == null) {
            return "";
        }
        String trimmed = str.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        String[] words = trimmed.split("\\s+");
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            int letters = 0;
            int firstDigit = -1;
            for (int j = 0; j < w.length(); j++) {
                char c = w.charAt(j);
                if (Character.isLetter(c)) {
                    letters++;
                } else if (Character.isDigit(c) && firstDigit == -1) {
                    firstDigit = j;
                }
            }
            String replaced = (firstDigit == -1)
                    ? w
                    : w.substring(0, firstDigit) + letters + w.substring(firstDigit + 1);
            if (i > 0) {
                out.append(' ');
            }
            out.append(replaced);
        }
        return out.toString();
    }
}
```

---

## Đề PE 05 — PE2-Q1: Camel — Encapsulation & Chuẩn hóa Uppercase (PE2 · Q1 · 2 điểm · 10 phút)

### Yêu cầu đề bài

Viết lớp `Camel` (trong `default package`):
- Thuộc tính (`private`): `-desert: String`, `-step: int`
- Phương thức (`public`):
  - `Camel()` — default constructor
  - `Camel(String desert, int step)`
  - `getDesert(): String` — trả về `desert` ở dạng **chữ in hoa (`uppercase`)**
  - `getStep(): int` — trả về `step`
  - `setStep(int step): void` — cập nhật `step`

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`getDesert`) | `desert = "alan", step = 5` | `ALAN` |
| TC 2 (`setStep`) | `desert = "alan", step = 12, newStep = 15` | `15` |

### Bẫy thường gặp
- Gọi thẳng `desert.toUpperCase()` khi tạo đối tượng bằng constructor mặc định `new Camel()` gây `NullPointerException`.

### Lời giải chuẩn

```java
// Camel.java (JDK 1.8 - default package)
public class Camel {
    private String desert;
    private int step;

    public Camel() {
    }

    public Camel(String desert, int step) {
        this.desert = desert;
        this.step = step;
    }

    public String getDesert() {
        return (desert == null) ? "" : desert.toUpperCase();
    }

    public int getStep() {
        return step;
    }

    public void setStep(int step) {
        this.step = step;
    }
}
```

---

## Đề PE 06 — PE2-Q2: SpecCala — Kế thừa & Bẫy Thứ tự Tham số (PE2 · Q2 · 3 điểm · 20 phút)

### Yêu cầu đề bài

Viết lớp cha `Cala` và lớp con `SpecCala extends Cala` (trong `default package`):
1. Lớp `Cala`: `-owner: String`, `-price: int`, `Cala()`, `Cala(String owner, int price)`, `getOwner()`, `getPrice()`, `setOwner(String owner)`, `toString()` trả về `owner, price`.
2. Lớp `SpecCala`: `-color: int`, `SpecCala()`, **`SpecCala(int color, String owner, int price)`** (chú ý thứ tự `color` đứng đầu!), `toString()` trả về `owner, price, color`:
   - `setData(): void` — thay **ký tự thứ 2** trong `owner` bằng chuỗi `"XX"`.
   - `getValue(): int` — nếu `color` là số lẻ trả về `price + 3`, ngược lại trả về `price + 7`.

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`toString`) | `owner = "alan", price = 3, color = 4` | `alan, 3` / `alan, 3, 4` |
| TC 2 (`setData`) | `owner = "alan", price = 3, color = 4` | `aXXan, 3` |
| TC 3a (`getValue`) | `owner = "alan", price = 3, color = 5` | `6` |
| TC 3b (`getValue`) | `owner = "alan", price = 3, color = 4` | `10` |

### Bẫy thường gặp
- **Bẫy chết người:** Viết constructor `SpecCala(String owner, int price, int color)` theo thói quen thay vì `SpecCala(int color, String owner, int price)` như đề yêu cầu làm lớp `Main` chấm bài báo lỗi biên dịch!
- Thay nhầm chỉ số `2` (ký tự thứ 3) thay vì chỉ số `1` (ký tự thứ 2, 0-based).

### Lời giải chuẩn

```java
// Cala.java (JDK 1.8 - default package)
public class Cala {
    private String owner;
    private int price;

    public Cala() {
    }

    public Cala(String owner, int price) {
        this.owner = owner;
        this.price = price;
    }

    public String getOwner() {
        return owner;
    }

    public int getPrice() {
        return price;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    @Override
    public String toString() {
        return owner + ", " + price;
    }
}
```

```java
// SpecCala.java (JDK 1.8 - default package)
public class SpecCala extends Cala {
    private int color;

    public SpecCala() {
    }

    public SpecCala(int color, String owner, int price) {
        super(owner, price);
        this.color = color;
    }

    @Override
    public String toString() {
        return getOwner() + ", " + getPrice() + ", " + color;
    }

    public void setData() {
        String s = getOwner();
        if (s != null && s.length() >= 2) {
            setOwner(s.substring(0, 1) + "XX" + s.substring(2));
        }
    }

    public int getValue() {
        if (color % 2 != 0) {
            return getPrice() + 3;
        }
        return getPrice() + 7;
    }
}
```

---

## Đề PE 07 — PE2-Q3: TicketList — Kế thừa ArrayList & Lọc Giá vé (PE2 · Q3 · 2 điểm · 20 phút)

### Yêu cầu đề bài

Viết lớp `Ticket` và `TicketList extends ArrayList<Ticket>` (trong `default package`):
1. Lớp `Ticket`: `-code: String`, `-type: String`, `-price: double`, constructor `Ticket(String code, String type, double price)`, `getCode()`, `getType()`, `getPrice()`, và `toString()` trả về `code,type,price` với **`price` làm tròn 2 chữ số thập phân và KHÔNG có dấu cách** (VD: `V001,VIP,150.00`).
2. Lớp `TicketList extends ArrayList<Ticket>`:
   - `addTicket(Ticket ticket): void` — thêm vé vào `TicketList`.
   - `getCheapestTicket(): Ticket` — trả về `Ticket` có giá thấp nhất trong danh sách.
   - `countTicketsByType(String value): int` — đếm số vé có `type` bằng `value` (**không phân biệt hoa/thường**); nếu không có trả về `0`.

| Test Case mẫu | Dữ liệu mẫu | Mục tiêu |
|---|---|---|
| TC 1 (`getCheapestTicket`) | `V001,VIP,150.00; N002,NORMAL,80.00; S005,STUDENT,45.00; N006,Normal,100.00` | `S005,STUDENT,45.00` |
| TC 2 (`countTicketsByType`) | Đếm `value = "Normal"` | `3` |

### Bẫy thường gặp
- Định dạng `toString()` thiếu `Locale.US` / `%.2f` hoặc thêm dấu cách `, `.
- So sánh `type.equals(value)` phân biệt hoa/thường khiến `"NORMAL"` không khớp `"Normal"` (phải dùng `equalsIgnoreCase`).

### Lời giải chuẩn

```java
// Ticket.java (JDK 1.8 - default package)
public class Ticket {
    private String code;
    private String type;
    private double price;

    public Ticket(String code, String type, double price) {
        this.code = code;
        this.type = type;
        this.price = price;
    }

    public String getCode() {
        return code;
    }

    public String getType() {
        return type;
    }

    public double getPrice() {
        return price;
    }

    @Override
    public String toString() {
        return String.format("%s,%s,%.2f", code, type, price);
    }
}
```

```java
// TicketList.java (JDK 1.8 - default package)
import java.util.ArrayList;

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
            Ticket current = this.get(i);
            if (current.getPrice() < cheapest.getPrice()) {
                cheapest = current;
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

---

## Đề PE 08 — PE3-Q1: CoffeeShop — Encapsulation & Doanh thu Quán Cà phê (PE3 · Q1 · 2 điểm · 20 phút)

### Yêu cầu đề bài

Viết lớp `CoffeeShop` (trong `default package`):
- Thuộc tính (`private`): `-id: int`, `-storeName: String`, `-pricePerCup: double`, `-numberOfCups: int`
- Phương thức (`public`):
  - `CoffeeShop()` và `CoffeeShop(int id, String storeName, double pricePerCup, int numberOfCups)`
  - `getStoreName(): String` — trả về `storeName` với **chữ cái đầu viết hoa, toàn bộ phần còn lại viết thường** (`"passio Coffee"` -> `"Passio coffee"`).
  - `getTotalRevenue(): double` — nếu `numberOfCups >= 100` trả về `pricePerCup * numberOfCups * 1.2`, ngược lại trả về `pricePerCup * numberOfCups`.
  - `getProfitRevenue(double costPerCup): double` — trả về `getTotalRevenue() - (costPerCup * numberOfCups)`.
  - `toString(): String` — trả về `storeName` viết HOA toàn bộ, dấu `:`, và `getTotalRevenue()` định dạng **2 chữ số thập phân**.

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`getTotalRevenue`) | `id=1, "Coffee World", 3.5, 50` | `175.00` |
| TC 2 (`getStoreName`) | `id=2, "passio Coffee", 4.0, 150` | `Passio coffee` |
| TC 3 (`getProfitRevenue`) | `id=3, "orange bar bistro", 5.5, 120, cost=1.5` | `612.00` |
| TC 4 (`toString`) | `id=4, "brew haven", 6.0, 200` | `BREW HAVEN:1440.00` |

### Bẫy thường gặp
- Viết hoa chữ cái đầu **mỗi từ** (*Title Case*: `"Passio Coffee"`) thay vì chỉ chữ cái đầu cả chuỗi (`"Passio coffee"`).
- Quên viết HOA toàn bộ `storeName` trong `toString()` hoặc thêm dấu cách quanh `:`.

### Lời giải chuẩn

```java
// CoffeeShop.java (JDK 1.8 - default package)
public class CoffeeShop {
    private int id;
    private String storeName;
    private double pricePerCup;
    private int numberOfCups;

    public CoffeeShop() {
    }

    public CoffeeShop(int id, String storeName, double pricePerCup, int numberOfCups) {
        this.id = id;
        this.storeName = storeName;
        this.pricePerCup = pricePerCup;
        this.numberOfCups = numberOfCups;
    }

    public String getStoreName() {
        if (storeName == null || storeName.isEmpty()) {
            return "";
        }
        return Character.toUpperCase(storeName.charAt(0)) + storeName.substring(1).toLowerCase();
    }

    public double getTotalRevenue() {
        double base = pricePerCup * numberOfCups;
        if (numberOfCups >= 100) {
            return base * 1.2;
        }
        return base;
    }

    public double getProfitRevenue(double costPerCup) {
        return getTotalRevenue() - (costPerCup * numberOfCups);
    }

    @Override
    public String toString() {
        String upper = (storeName == null) ? "" : storeName.toUpperCase();
        return String.format("%s:%.2f", upper, getTotalRevenue());
    }
}
```

---

## Đề PE 09 — PE3-Q2: OLEDScreen — Kế thừa & Định dạng 2 Chữ số Thập phân (PE3 · Q2 · 3 điểm · 25 phút)

### Yêu cầu đề bài

Viết lớp cha `Screen` và lớp con `OLEDScreen extends Screen` (trong `default package`):
1. Lớp `Screen`: `-diagonal: double`, `-brightness: int`, `Screen()` (gán `0` và `0`), `Screen(double diagonal, int brightness)`, đủ getter/setter, `getQualityIndex()` trả về `diagonal * (brightness / 100.0)`, `toString()` trả về `diagonal, brightness`.
2. Lớp `OLEDScreen`: `-refresh: double`, `OLEDScreen()`, `OLEDScreen(double diagonal, int brightness, double refresh)` (nếu `refresh < 0` thì gán `0`), `getRefresh()`, `setRefresh(double refresh)` (nếu `refresh < 0` thì gán `0`):
   - `calculatePrice(): double` — `getQualityIndex() * 20 + (refresh >= 120 ? 120 : 60)`
   - `estimateBurnInRisk(): double` — `(getBrightness() / 100.0) * (refresh / 60.0)`
   - `toString(): String` — `diagonal,brightness,refresh` (`diagonal` và `refresh` định dạng **2 chữ số thập phân**, dùng dấu phẩy, **không có dấu cách**).

| Test Case mẫu | Input (`diagonal`, `brightness`, `refresh`) | Output |
|---|---|---|
| TC 1 (`calculatePrice`) | `5`, `400`, `60` | `460.00` |
| TC 2 (`estimateBurnInRisk`) | `6`, `500`, `90` | `7.50` |
| TC 3 (`toString`) | `6.5`, `750`, `120` | `6.50,750,120.00` |

### Bẫy thường gặp
- Chia số nguyên `brightness / 100` hoặc `refresh / 60` khiến `750 / 100 = 7` bị mất phần thập phân (luôn chia cho `100.0` và `60.0`).
- Thêm dấu cách sau dấu phẩy trong `OLEDScreen.toString()` làm lệch chuỗi kết quả.

### Lời giải chuẩn

```java
// Screen.java (JDK 1.8 - default package)
public class Screen {
    private double diagonal;
    private int brightness;

    public Screen() {
        this.diagonal = 0;
        this.brightness = 0;
    }

    public Screen(double diagonal, int brightness) {
        this.diagonal = diagonal;
        this.brightness = brightness;
    }

    public double getDiagonal() {
        return diagonal;
    }

    public void setDiagonal(double diagonal) {
        this.diagonal = diagonal;
    }

    public int getBrightness() {
        return brightness;
    }

    public void setBrightness(int brightness) {
        this.brightness = brightness;
    }

    public double getQualityIndex() {
        return diagonal * (brightness / 100.0);
    }

    @Override
    public String toString() {
        return diagonal + ", " + brightness;
    }
}
```

```java
// OLEDScreen.java (JDK 1.8 - default package)
public class OLEDScreen extends Screen {
    private double refresh;

    public OLEDScreen() {
    }

    public OLEDScreen(double diagonal, int brightness, double refresh) {
        super(diagonal, brightness);
        this.refresh = (refresh < 0) ? 0 : refresh;
    }

    public double getRefresh() {
        return refresh;
    }

    public void setRefresh(double refresh) {
        this.refresh = (refresh < 0) ? 0 : refresh;
    }

    public double calculatePrice() {
        return getQualityIndex() * 20.0 + (refresh >= 120 ? 120.0 : 60.0);
    }

    public double estimateBurnInRisk() {
        return (getBrightness() / 100.0) * (refresh / 60.0);
    }

    @Override
    public String toString() {
        return String.format("%.2f,%d,%.2f", getDiagonal(), getBrightness(), refresh);
    }
}
```

---

## Đề PE 10 — PE3-Q3: EmployeeList — Kế thừa ArrayList & Tra cứu Nhân sự (PE3 · Q3 · 2 điểm · 20 phút)

### Yêu cầu đề bài

Viết lớp `Employee` và `EmployeeList extends ArrayList<Employee>` (trong `default package`):
1. Lớp `Employee`: `-employeeId: String`, `-fullName: String`, `-department: String`, `-salary: double`. `Employee()` gán `""`, `""`, `""`, `0.0`. Đủ getter/setter và `toString()` trả về `employeeId,fullName,department,salary` (không dấu cách, VD: `E001,John Smith,IT,75000.0`).
2. Lớp `EmployeeList extends ArrayList<Employee>`:
   - `getEmployeeById(String id): Employee` — tìm nhân viên có mã khớp `id` (trả về `null` nếu không tìm thấy).
   - `countEmployeesBySalary(double salary): int` — đếm số nhân viên có lương **`>= salary`**.

| Test Case mẫu | Dữ liệu | Output |
|---|---|---|
| TC 1 (`getEmployeeById`) | `id = "E003"` | `E003,Michael Brown,Sales,70000.0` |
| TC 2 (`countEmployeesBySalary`) | `minimum salary = 70000` (5 NV + NV mới 78000) | `4` |
| TC 3 (`countEmployeesBySalary`) | `minimum salary = 68000` (5 NV + NV mới 70000) | `5` |

### Bẫy thường gặp
- So sánh chuỗi `e.getEmployeeId() == id` thay vì `.equals(id)`.
- Dùng dấu `>` thay vì `>=` trong `countEmployeesBySalary`.

### Lời giải chuẩn

```java
// Employee.java (JDK 1.8 - default package)
public class Employee {
    private String employeeId;
    private String fullName;
    private String department;
    private double salary;

    public Employee() {
        this.employeeId = "";
        this.fullName = "";
        this.department = "";
        this.salary = 0.0;
    }

    public Employee(String employeeId, String fullName, String department, double salary) {
        this.employeeId = employeeId;
        this.fullName = fullName;
        this.department = department;
        this.salary = salary;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public double getSalary() {
        return salary;
    }

    public void setSalary(double salary) {
        this.salary = salary;
    }

    @Override
    public String toString() {
        return employeeId + "," + fullName + "," + department + "," + salary;
    }
}
```

```java
// EmployeeList.java (JDK 1.8 - default package)
import java.util.ArrayList;

public class EmployeeList extends ArrayList<Employee> {

    public Employee getEmployeeById(String id) {
        if (id == null) {
            return null;
        }
        for (Employee e : this) {
            if (e != null && id.equals(e.getEmployeeId())) {
                return e;
            }
        }
        return null;
    }

    public int countEmployeesBySalary(double salary) {
        int count = 0;
        for (Employee e : this) {
            if (e != null && e.getSalary() >= salary) {
                count++;
            }
        }
        return count;
    }
}
```

---

## Đề PE 11 — PE3-Q4: MyStringNumberTool — Từ Viết tắt & Đổi Nhị phân Thủ công (PE3 · Q4 · 3 điểm · 20 phút)

### Yêu cầu đề bài

Cho interface `IStringNumberTool` đã biên dịch sẵn (**không tạo lại `IStringNumberTool.java`**):

```java
public interface IStringNumberTool {
    public String buildAcronym(String string);
    public String decimalToBinary(int n);
}
```

Viết lớp `MyStringNumberTool implements IStringNumberTool`:
- `buildAcronym(String string)`: Nếu `null` hoặc rỗng trả về `""`. Tách các từ theo dấu cách đơn `" "`, lấy **ký tự đầu tiên của mỗi từ nếu nó là chữ cái (`A-Z` hoặc `a-z`)**, chuyển sang chữ in hoa và nối liền không khoảng trắng.
- `decimalToBinary(int n)`: Chuyển số nguyên không âm `n` sang chuỗi nhị phân (`n == 0` -> `"0"`). **Cấm dùng các hàm dựng sẵn như `Integer.toBinaryString()`**.

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`buildAcronym`) | `"object oriented program"` | `"OOP"` |
| TC 2 (`buildAcronym`) | `"123 data structure"` | `"DS"` |
| TC 3 (`decimalToBinary`) | `10` | `"1010"` |

### Bẫy thường gặp
- Lấy luôn ký tự `'1'` trong từ `"123"` thay vì kiểm tra `Character.isLetter(first)`.
- Dùng `Integer.toBinaryString(n)` hoặc quên xử lý riêng `n == 0` khiến vòng lặp `while (n > 0)` trả về `""`.

### Lời giải chuẩn

```java
// MyStringNumberTool.java (JDK 1.8 - default package, khong tao IStringNumberTool.java)
public class MyStringNumberTool implements IStringNumberTool {

    @Override
    public String buildAcronym(String string) {
        if (string == null || string.isEmpty()) {
            return "";
        }
        String[] words = string.split(" ");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isEmpty()) {
                char first = w.charAt(0);
                if ((first >= 'A' && first <= 'Z') || (first >= 'a' && first <= 'z')) {
                    sb.append(Character.toUpperCase(first));
                }
            }
        }
        return sb.toString();
    }

    @Override
    public String decimalToBinary(int n) {
        if (n == 0) {
            return "0";
        }
        StringBuilder sb = new StringBuilder();
        int val = n;
        while (val > 0) {
            sb.append(val % 2);
            val /= 2;
        }
        return sb.reverse().toString();
    }
}
```

---

## Đề PE 12 — PE4-Q1: Person — Encapsulation & Nối chuỗi và toString (PE4 · Q1 · 2 điểm · 10 phút)

### Yêu cầu đề bài

Viết lớp `Person` (trong `default package`):
- Thuộc tính (`private`): `-name: String`, `-sickLeave: double`
- Phương thức (`public`):
  - `Person()`, `Person(String name, double sickLeave)`
  - `getSickLeave(): double`
  - `setName(String newname): void` — **nối `newname` vào sau tên cũ** cách nhau 1 dấu cách (`this.name = this.name + " " + newname`).
  - `toString(): String` — trả về `name,sickLeave` (**không có dấu cách sau dấu phẩy**).

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`getSickLeave`) | `name = "nguyen anh", sickLeave = 4.5` | `4.5` |
| TC 2 (`setName` + `toString`) | `name = "ly hung", sickLeave = 5.5, newname = "anh"` | `ly hung anh,5.5` |

### Bẫy thường gặp
- Viết nhầm `this.name = newname;` như setter thông thường khiến mất tên cũ `"ly hung"`.
- Thêm dấu cách sau dấu phẩy trong `toString()` (`"ly hung anh, 5.5"`).

### Lời giải chuẩn

```java
// Person.java (JDK 1.8 - default package)
public class Person {
    private String name;
    private double sickLeave;

    public Person() {
    }

    public Person(String name, double sickLeave) {
        this.name = name;
        this.sickLeave = sickLeave;
    }

    public double getSickLeave() {
        return sickLeave;
    }

    public void setName(String newname) {
        if (newname == null) {
            return;
        }
        if (this.name == null || this.name.isEmpty()) {
            this.name = newname;
        } else {
            this.name = this.name + " " + newname;
        }
    }

    @Override
    public String toString() {
        return name + "," + sickLeave;
    }
}
```

---

## Đề PE 13 — PE4-Q2: SpecChair — Kế thừa & Cắt Ký tự và Flash Sale (PE4 · Q2 · 3 điểm · 15 phút)

### Yêu cầu đề bài

Viết lớp cha `Chair` và lớp con `SpecChair extends Chair` (trong `default package`):
1. Lớp `Chair`: `-color: String`, `-quantity: int`, `Chair()`, `Chair(String color, int quantity)`, `getColor()`, `getQuantity()`, `setColor(String color)`, `toString()` trả về `color,quantity` (không dấu cách).
2. Lớp `SpecChair`: `-type: String`, `SpecChair()`, `SpecChair(String color, int quantity, String type)`:
   - `toString(): String` — trả về `color,quantity,type` (không dấu cách).
   - `getType(): String` — trả về `type` đã **xóa ký tự đầu tiên**.
   - `setType(): void` — nếu `quantity > 15` gán `type = "flash sale"`, ngược lại gán `type = "no sale"`.

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`toString`) | `color="blue", quantity=14, type="steel"` | `blue,14` / `blue,14,steel` |
| TC 2 (`setType` > 15) | `color="wooden", quantity=16, type="normal"` | `wooden,16,flash sale` |
| TC 3 (`setType` <= 15) | `color="wooden", quantity=6, type="6"` | `wooden,6,no sale` |
| TC 4 (`getType`) | `color="wooden", quantity=5, type="normal"` | `ormal` |

### Bẫy thường gặp
- Gọi `type.substring(1)` khi `type` rỗng hoặc `null` gây `StringIndexOutOfBoundsException`.
- Dùng nhầm `>= 15` thay vì `> 15`.

### Lời giải chuẩn

```java
// Chair.java (JDK 1.8 - default package)
public class Chair {
    private String color;
    private int quantity;

    public Chair() {
    }

    public Chair(String color, int quantity) {
        this.color = color;
        this.quantity = quantity;
    }

    public String getColor() {
        return color;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setColor(String color) {
        this.color = color;
    }

    @Override
    public String toString() {
        return color + "," + quantity;
    }
}
```

```java
// SpecChair.java (JDK 1.8 - default package)
public class SpecChair extends Chair {
    private String type;

    public SpecChair() {
    }

    public SpecChair(String color, int quantity, String type) {
        super(color, quantity);
        this.type = type;
    }

    public String getType() {
        if (type == null || type.isEmpty()) {
            return "";
        }
        return type.substring(1);
    }

    public void setType() {
        if (getQuantity() > 15) {
            this.type = "flash sale";
        } else {
            this.type = "no sale";
        }
    }

    @Override
    public String toString() {
        return getColor() + "," + getQuantity() + "," + type;
    }
}
```

---

## Đề PE 14 — PE4-Q3: MyShoes — Sắp xếp Giảm dần & Xóa bằng Iterator (PE4 · Q3 · 3 điểm · 20 phút)

### Yêu cầu đề bài

Viết lớp `Shoes` (`-name: String`, `-price: int`, constructors, getters/setters, `toString()` -> `(name, price)`) và lớp `MyShoes implements IShoes` (interface `IShoes` đã biên dịch sẵn dạng bytecode, **không tạo `IShoes.java`**), kèm phương thức `display(List<Shoes> t): void`:
- `f1(List<Shoes> t)`: Tìm và trả về đối tượng `Shoes` có `price` lớn nhất trong danh sách.
- `f2(List<Shoes> t)`: Sắp xếp danh sách theo `price` **giảm dần**.
- `f3(List<Shoes> t)`: Xóa các phần tử có `name` **bắt đầu bằng chữ cái `"s"`**.

| Test Case mẫu | Danh sách đầu vào | Output |
|---|---|---|
| TC 1 (`f1`) | `(sandal, 20) (tre em, 50) (the thao, 15) (cong so, 55)` | `(cong so, 55)` |
| TC 2 (`f2`) | `(sandal, 20) (tre em, 50) (the thao, 15)` | `(tre em, 50) (sandal, 20) (the thao, 15)` |
| TC 3 (`f3`) | `(sandal, 20) (tre em, 50) (the thao, 15)` | `(tre em, 50) (the thao, 15)` |

### Bẫy thường gặp
- Xóa bằng vòng lặp `for-each` trong `f3` ném `ConcurrentModificationException` (phải dùng `Iterator<Shoes>`).
- Quên viết hàm `display(List<Shoes> t)` nếu hàm `Main` gọi hiển thị danh sách.

### Lời giải chuẩn

```java
// Shoes.java (JDK 1.8 - default package)
public class Shoes {
    private String name;
    private int price;

    public Shoes() {
    }

    public Shoes(String name, int price) {
        this.name = name;
        this.price = price;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getPrice() {
        return price;
    }

    public void setPrice(int price) {
        this.price = price;
    }

    @Override
    public String toString() {
        return "(" + name + ", " + price + ")";
    }
}
```

```java
// MyShoes.java (JDK 1.8 - default package, khong tao IShoes.java)
import java.util.Collections;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;

public class MyShoes implements IShoes {

    @Override
    public Shoes f1(List<Shoes> t) {
        if (t == null || t.isEmpty()) {
            return null;
        }
        Shoes max = t.get(0);
        for (int i = 1; i < t.size(); i++) {
            if (t.get(i).getPrice() > max.getPrice()) {
                max = t.get(i);
            }
        }
        return max;
    }

    @Override
    public void f2(List<Shoes> t) {
        if (t == null || t.size() <= 1) {
            return;
        }
        Collections.sort(t, new Comparator<Shoes>() {
            @Override
            public int compare(Shoes a, Shoes b) {
                return Integer.compare(b.getPrice(), a.getPrice());
            }
        });
    }

    @Override
    public void f3(List<Shoes> t) {
        if (t == null) {
            return;
        }
        Iterator<Shoes> it = t.iterator();
        while (it.hasNext()) {
            Shoes s = it.next();
            if (s != null && s.getName() != null && s.getName().toLowerCase().startsWith("s")) {
                it.remove();
            }
        }
    }

    public void display(List<Shoes> t) {
        if (t == null) {
            return;
        }
        for (Shoes s : t) {
            System.out.println(s);
        }
    }
}
```

---

## Đề PE 15 — PE4-Q4: MyLink — Xử lý URL & Bẫy Regex Dấu chấm (PE4 · Q4 · 2 điểm · 15 phút)

### Yêu cầu đề bài

Cho interface `ILink` đã biên dịch sẵn dạng bytecode (**không tạo `ILink.java`**):

```java
public interface ILink {
    public String f1(String str);
    public String f2(String str);
}
```

Viết lớp `MyLink implements ILink`:
- `f1(String str)`: Trả về chuỗi đã thay toàn bộ ký tự `"."` bằng `":"`.
- `f2(String str)`: Trả về chuỗi mới trong đó phần chuỗi con **tính từ sau dấu `"."` đầu tiên trở đi** được chuyển thành chữ **IN HOA**.

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`f1`) | `"https://fap.fpt.edu.vn"` | `"https://fap:fpt:edu:vn"` |
| TC 2 (`f2`) | `"https://fap.fpt.edu.vn"` | `"https://fap.FPT.EDU.VN"` |

### Bẫy thường gặp
- **Bẫy kinh điển:** Viết `str.replaceAll(".", ":")` khiến toàn bộ mọi ký tự trong URL đều biến thành `:` vì `.` là wildcard trong Regex! Phải dùng **`str.replace(".", ":")`** (hoặc `str.replaceAll("\\.", ":")`).
- Trong `f2`, quên kiểm tra `idx == -1` (nếu chuỗi đầu vào không có dấu chấm) hoặc lỡ biến luôn phần đầu `"https://fap."` thành chữ hoa.

### Lời giải chuẩn

```java
// MyLink.java (JDK 1.8 - default package, khong tao ILink.java)
public class MyLink implements ILink {

    @Override
    public String f1(String str) {
        if (str == null) {
            return "";
        }
        return str.replace(".", ":");
    }

    @Override
    public String f2(String str) {
        if (str == null) {
            return "";
        }
        int idx = str.indexOf('.');
        if (idx == -1 || idx + 1 >= str.length()) {
            return str;
        }
        return str.substring(0, idx + 1) + str.substring(idx + 1).toUpperCase();
    }
}
```

---

## Đề PE 16 — PE5-Q1: Coral — Encapsulation & Cắt Ký tự Cuối (PE5 · Q1 · 2 điểm · 10 phút)

### Yêu cầu đề bài

Viết lớp `Coral` (trong `default package`):
- Thuộc tính (`private`): `-name: String`, `-price: int`
- Phương thức (`public`):
  - `Coral()`, `Coral(String name, int price)`
  - `getName(): String` — trả về chuỗi sau khi **xóa ký tự cuối cùng** của `name`.
  - `getPrice(): int` — trả về `price`.
  - `setPrice(int price): void` — cập nhật `price`.

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`getName`) | `name = "vietnam", price = 10` | `vietna` |
| TC 2 (`setPrice`) | `name = "vietnam", price = 10, newPrice = 12` | `12` |

### Bẫy thường gặp
- Gọi `name.substring(0, name.length() - 1)` mà không kiểm tra `name == null || name.isEmpty()`.

### Lời giải chuẩn

```java
// Coral.java (JDK 1.8 - default package)
public class Coral {
    private String name;
    private int price;

    public Coral() {
    }

    public Coral(String name, int price) {
        this.name = name;
        this.price = price;
    }

    public String getName() {
        if (name == null || name.isEmpty()) {
            return "";
        }
        return name.substring(0, name.length() - 1);
    }

    public int getPrice() {
        return price;
    }

    public void setPrice(int price) {
        this.price = price;
    }
}
```

---

## Đề PE 17 — PE5-Q2: SpecLadder — Kế thừa & Đếm Chữ số Chẵn (PE5 · Q2 · 3 điểm · 20 phút)

### Yêu cầu đề bài

Viết lớp cha `Ladder` và lớp con `SpecLadder extends Ladder` (trong `default package`):
1. Lớp `Ladder`: `-type: String`, `-price: int`, `Ladder()`, `Ladder(String type, int price)`, `getType()`, `getPrice()`, `setType(String type)`, `toString()` trả về `type, price`.
2. Lớp `SpecLadder`: `-weight: int`, `SpecLadder()`, `SpecLadder(String type, int price, int weight)`, `getWeight()`, `toString()` trả về `type, price, weight`:
   - `setData(): void` — thay **ký tự chữ cái cuối cùng** trong `type` bằng **chữ số hàng đơn vị (chữ số cuối)** của `price`.
   - `getValue(): String` — nếu `weight` chứa **ít nhất 2 chữ số chẵn**, trả về `type` ghép với **số lượng chữ số chẵn** trong `weight`; ngược lại trả về `type` ghép với **tổng số chữ số** của `weight`.

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`toString`) | `"standard", 100, 50` | `standard, 100` / `standard, 100, 50` |
| TC 2 (`setData`) | `"standard", 21, 20` | `standar1, 21` |
| TC 3a (`getValue`) | `"standard", 123, 24` | `standard2` |
| TC 3b (`getValue`) | `"standard", 12, 135` | `standard3` |

### Bẫy thường gặp
- Trong `setData()`, nếu `type` kết thúc bằng chữ số (VD `"ab12"`), thay ký tự cuối cùng thay vì *chữ cái cuối cùng* sẽ sai! Phải duyệt ngược bằng `Character.isLetter(type.charAt(i))`.
- Trong `getValue()`, kiểm tra chữ số `0` là số chẵn (`0 % 2 == 0`).

### Lời giải chuẩn

```java
// Ladder.java (JDK 1.8 - default package)
public class Ladder {
    private String type;
    private int price;

    public Ladder() {
    }

    public Ladder(String type, int price) {
        this.type = type;
        this.price = price;
    }

    public String getType() {
        return type;
    }

    public int getPrice() {
        return price;
    }

    public void setType(String type) {
        this.type = type;
    }

    @Override
    public String toString() {
        return type + ", " + price;
    }
}
```

```java
// SpecLadder.java (JDK 1.8 - default package)
public class SpecLadder extends Ladder {
    private int weight;

    public SpecLadder() {
    }

    public SpecLadder(String type, int price, int weight) {
        super(type, price);
        this.weight = weight;
    }

    public int getWeight() {
        return weight;
    }

    @Override
    public String toString() {
        return getType() + ", " + getPrice() + ", " + weight;
    }

    public void setData() {
        String s = getType();
        if (s == null || s.isEmpty()) {
            return;
        }
        int lastDigit = Math.abs(getPrice()) % 10;
        for (int i = s.length() - 1; i >= 0; i--) {
            if (Character.isLetter(s.charAt(i))) {
                setType(s.substring(0, i) + lastDigit + s.substring(i + 1));
                return;
            }
        }
    }

    public String getValue() {
        String wStr = String.valueOf(Math.abs(weight));
        int evenDigits = 0;
        for (int i = 0; i < wStr.length(); i++) {
            int d = wStr.charAt(i) - '0';
            if (d % 2 == 0) {
                evenDigits++;
            }
        }
        String prefix = (getType() == null) ? "" : getType();
        if (evenDigits >= 2) {
            return prefix + evenDigits;
        }
        return prefix + wStr.length();
    }
}
```

---

## Đề PE 18 — PE5-Q3: MyLadder — Cập nhật theo Độ dài & Xóa Max Letters (PE5 · Q3 · 3 điểm · 25 phút)

### Yêu cầu đề bài

Cho lớp `Ladder` (`-type: String`, `-price: int`, getters & setters `setType`, `setPrice`) và interface `ILadder` đã biên dịch sẵn (**không tạo `ILadder.java`**):

```java
import java.util.List;

public interface ILadder {
    public int f1(List<Ladder> t);
    public void f2(List<Ladder> t);
    public void f3(List<Ladder> t);
}
```

Viết lớp `MyLadder implements ILadder`:
- `f1(List<Ladder> t)`: Tính tổng `price` của các `Ladder` có `type` chứa **số chữ hoa nhiều hơn số chữ thường**.
- `f2(List<Ladder> t)`: Đặt `price = 0` cho **tất cả các `Ladder` có độ dài chuỗi `type` dài nhất** trong danh sách.
- `f3(List<Ladder> t)`: Xóa **tất cả các phần tử có `type` chứa nhiều chữ cái (`Character.isLetter`) nhất** trong danh sách.

| Test Case mẫu | Danh sách đầu vào | Output |
|---|---|---|
| TC 1 (`f1`) | `(AB1,11) (BC1,9) (de1,16) (ef2,14)` | `20` |
| TC 2 (`f2`) | `(A1,6) (B1,9) (A12,2) (B12,5)` | `(A1,6) (B1,9) (A12,0) (B12,0)` |
| TC 3 (`f3`) | `(AB123,10) (AC1,11) (A1234,12) (B1,13)` | `(A1234,12) (B1,13)` |

### Bẫy thường gặp
- Trong `f2`, chỉ đặt `price = 0` cho phần tử dài nhất *đầu tiên* thay vì **tất cả** phần tử đạt `maxLength`.
- Trong `f3`, nhầm giữa `type.length()` (gồm cả chữ số) và số **chữ cái** (`Character.isLetter`): trong TC 3, `"A1234"` dài 5 ký tự nhưng chỉ có 1 chữ cái, còn `"AB123"` và `"AC1"` có 2 chữ cái nên bị xóa cả 2!

### Lời giải chuẩn

```java
// Ladder.java (JDK 1.8 - default package)
public class Ladder {
    private String type;
    private int price;

    public Ladder() {
    }

    public Ladder(String type, int price) {
        this.type = type;
        this.price = price;
    }

    public String getType() {
        return type;
    }

    public int getPrice() {
        return price;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setPrice(int price) {
        this.price = price;
    }
}
```

```java
// MyLadder.java (JDK 1.8 - default package, khong tao ILadder.java)
import java.util.Iterator;
import java.util.List;

public class MyLadder implements ILadder {

    private int countLetters(String s) {
        if (s == null) {
            return 0;
        }
        int cnt = 0;
        for (int i = 0; i < s.length(); i++) {
            if (Character.isLetter(s.charAt(i))) {
                cnt++;
            }
        }
        return cnt;
    }

    @Override
    public int f1(List<Ladder> t) {
        if (t == null) {
            return 0;
        }
        int sum = 0;
        for (Ladder l : t) {
            if (l == null || l.getType() == null) {
                continue;
            }
            int upper = 0;
            int lower = 0;
            String s = l.getType();
            for (int i = 0; i < s.length(); i++) {
                char c = s.charAt(i);
                if (c >= 'A' && c <= 'Z') {
                    upper++;
                } else if (c >= 'a' && c <= 'z') {
                    lower++;
                }
            }
            if (upper > lower) {
                sum += l.getPrice();
            }
        }
        return sum;
    }

    @Override
    public void f2(List<Ladder> t) {
        if (t == null || t.isEmpty()) {
            return;
        }
        int maxLen = 0;
        for (Ladder l : t) {
            if (l != null && l.getType() != null && l.getType().length() > maxLen) {
                maxLen = l.getType().length();
            }
        }
        for (Ladder l : t) {
            if (l != null && l.getType() != null && l.getType().length() == maxLen) {
                l.setPrice(0);
            }
        }
    }

    @Override
    public void f3(List<Ladder> t) {
        if (t == null || t.isEmpty()) {
            return;
        }
        int maxLetters = -1;
        for (Ladder l : t) {
            if (l != null) {
                int cnt = countLetters(l.getType());
                if (cnt > maxLetters) {
                    maxLetters = cnt;
                }
            }
        }
        Iterator<Ladder> it = t.iterator();
        while (it.hasNext()) {
            Ladder l = it.next();
            if (l != null && countLetters(l.getType()) == maxLetters) {
                it.remove();
            }
        }
    }
}
```

---

## Đề PE 19 — PE5-Q4: MyString — Chữ số Khác nhau & Cân bằng Ký tự (PE5 · Q4 · 2 điểm · 20 phút)

### Yêu cầu đề bài

Cho interface `IString` đã biên dịch sẵn (**không tạo `IString.java`**):

```java
public interface IString {
    public int f1(String str);
    public String f2(String str);
}
```

Viết lớp `MyString implements IString`:
- `f1(String str)`: Đếm số từ (không chứa dấu cách) chứa **đúng 2 chữ số khác nhau** VÀ **ít nhất 1 chữ cái thường**.
- `f2(String str)`: Trả về chuỗi mới gồm các từ có **số lượng chữ cái KHÁC số lượng ký tự không phải chữ cái**, giữ đúng thứ tự xuất hiện ban đầu. Các từ cách nhau 1 dấu cách, không dấu cách thừa đầu/cuối; trả về `""` nếu không có từ nào thỏa mãn.

| Test Case mẫu | Input | Output |
|---|---|---|
| TC 1 (`f1`) | `"A12b B121 c34D 111X"` | `2` |
| TC 2 (`f2`) | `"ab12 A#B# xyz"` | `"xyz"` |

### Bẫy thường gặp
- Ở TC 1: `"111X"` chỉ có 1 chữ số khác nhau (`'1'`) và không có chữ cái thường -> loại. Phải dùng `HashSet<Character>` thay vì đếm tổng số lần xuất hiện chữ số (`"B121"` có 3 ký tự số nhưng chỉ **2 chữ số khác nhau** là `'1'` và `'2'`!).
- Ở TC 2: `"A#B#"` có 2 chữ cái (`'A'`, `'B'`) và 2 ký tự không phải chữ cái (`'#'`, `'#'`) -> bằng nhau -> bị loại!

### Lời giải chuẩn

```java
// MyString.java (JDK 1.8 - default package, khong tao IString.java)
import java.util.HashSet;
import java.util.Set;

public class MyString implements IString {

    @Override
    public int f1(String str) {
        if (str == null) {
            return 0;
        }
        String trimmed = str.trim();
        if (trimmed.isEmpty()) {
            return 0;
        }
        String[] words = trimmed.split("\\s+");
        int count = 0;
        for (String w : words) {
            Set<Character> digits = new HashSet<Character>();
            boolean hasLower = false;
            for (int i = 0; i < w.length(); i++) {
                char c = w.charAt(i);
                if (Character.isDigit(c)) {
                    digits.add(c);
                } else if (c >= 'a' && c <= 'z') {
                    hasLower = true;
                }
            }
            if (digits.size() == 2 && hasLower) {
                count++;
            }
        }
        return count;
    }

    @Override
    public String f2(String str) {
        if (str == null) {
            return "";
        }
        String trimmed = str.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        String[] words = trimmed.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            int alpha = 0;
            int nonAlpha = 0;
            for (int i = 0; i < w.length(); i++) {
                if (Character.isLetter(w.charAt(i))) {
                    alpha++;
                } else {
                    nonAlpha++;
                }
            }
            if (alpha != nonAlpha) {
                if (sb.length() > 0) {
                    sb.append(' ');
                }
                sb.append(w);
            }
        }
        return sb.toString();
    }
}
```
