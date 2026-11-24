---
title: Tổng hợp các từ khóa trong Java
description: Tổng hợp hệ thống các từ khóa thường dùng trong Java, giải thích chi tiết cách dùng và sự khác biệt của final, static, this, super, volatile, transient, synchronized, giúp lập trình viên Java nắm vững cú pháp cốt lõi.
category: Java
tag:
  - Java cơ bản
lang: vi
sourceRef: zh-ref/java/basis/java-keyword-summary.md
head:
  - - meta
    - name: keywords
      content: từ khóa Java,từ khóa final,từ khóa static,từ khóa this,từ khóa super,volatile,transient,synchronized
---

# Tổng hợp từ khóa `final`, `static`, `this`, `super`

## Từ khóa `final`

**Từ khóa `final` mang nghĩa là cuối cùng, không thể chỉnh sửa, không cho phép thay đổi, dùng để bổ nghĩa cho lớp (`class`), phương thức (`method`) và biến (`variable`), với các đặc điểm sau:**

1. Lớp được khai báo `final` không thể bị kế thừa; mọi phương thức thành viên bên trong lớp `final` đều được ngầm định là phương thức `final`;

2. Phương thức được khai báo `final` không thể bị ghi đè (`Override`);

3. Biến được khai báo `final` chỉ có thể được gán giá trị một lần. Nếu là biến kiểu dữ liệu nguyên thủy (`primitive type`), giá trị của nó không thể thay đổi sau khi khởi tạo; nếu là biến kiểu tham chiếu (`reference type`), sau khi khởi tạo không thể trỏ sang một đối tượng khác, nhưng bản thân đối tượng được tham chiếu vẫn có thể thay đổi trạng thái. Chỉ những biến `final` thỏa mãn điều kiện "biến hằng" (`constant variable`) của JLS mới là hằng số thời điểm biên dịch (compile-time constant).

Giải thích: Có hai lý do để sử dụng phương thức `final`:

1. Khóa phương thức lại, ngăn bất kỳ lớp con kế thừa nào làm thay đổi ngữ nghĩa của nó;
2. Hiệu năng. Trong các phiên bản Java đời đầu, phương thức `final` được chuyển thành lời gọi nội tuyến (inline call). Tuy nhiên, nếu phương thức quá lớn, có thể không thấy bất kỳ sự cải thiện hiệu năng nào từ việc inlining (các phiên bản Java hiện đại không còn cần dùng phương thức `final` cho các tối ưu hóa này nữa).

## Từ khóa `static`

**Từ khóa `static` chủ yếu có 4 kịch bản sử dụng sau:**

1. **Bổ nghĩa cho biến thành viên và phương thức thành viên:** Các thành viên được đánh dấu `static` thuộc về lớp, không thuộc về một đối tượng cụ thể nào của lớp đó, được chia sẻ giữa tất cả các đối tượng trong lớp và có thể — cũng như được khuyến nghị — gọi thông qua tên lớp. Vị trí lưu trữ cụ thể của biến `static` thuộc về chi tiết cài đặt của JVM; lấy HotSpot từ JDK 8 trở đi làm ví dụ, metadata của lớp nằm ở vùng `Metaspace` trong bộ nhớ native, còn biến `static` của lớp nằm trong Java `Heap`. Cú pháp gọi: `ClassName.staticVariableName`, `ClassName.staticMethodName()`
2. **Khối code static (`static block`):** Khối code `static` được định nghĩa trong lớp nhưng nằm ngoài phương thức, và chạy trước khối code non-static (khối code static —> khối code non-static —> constructor). Dù lớp đó tạo ra bao nhiêu đối tượng đi nữa, khối code `static` chỉ thực thi đúng một lần.
3. **Lớp lồng static (nếu `static` bổ nghĩa cho lớp thì chỉ có thể dùng với lớp lồng bên trong - nested class):** Giữa lớp lồng `static` và lớp nội non-static (inner class) tồn tại một điểm khác biệt lớn nhất: lớp nội non-static sau khi biên dịch xong sẽ ngầm lưu một tham chiếu trỏ tới lớp bao ngoài (outer class) đã tạo ra nó, nhưng lớp lồng `static` thì không. Không có tham chiếu này đồng nghĩa với: 1. Việc khởi tạo nó không phụ thuộc vào việc tạo đối tượng lớp bao ngoài. 2. Nó không thể sử dụng bất kỳ biến thành viên hay phương thức non-`static` nào của lớp bao ngoài.
4. **Static import (dùng để import các tài nguyên `static` trong lớp, tính năng mới từ JDK 1.5):** Cú pháp là `import static`. Kết hợp hai từ khóa này cho phép chỉ định import một tài nguyên `static` cụ thể trong một lớp, và không cần dùng tên lớp để gọi thành viên `static` mà có thể sử dụng trực tiếp biến và phương thức `static` của lớp đó.

## Từ khóa `this`

Từ khóa `this` dùng để tham chiếu tới thể hiện (instance) hiện tại của lớp. Ví dụ:

```java
class Manager {
    Employees[] employees;
    void manageEmployees() {
        int totalEmp = this.employees.length;
        System.out.println("Total employees: " + totalEmp);
        this.report();
    }
    void report() { }
}
```

Trong ví dụ trên, từ khóa `this` được dùng ở hai chỗ:

- `this.employees.length`: truy cập biến của instance hiện tại thuộc lớp `Manager`.
- `this.report()`: gọi phương thức của instance hiện tại thuộc lớp `Manager`.

Từ khóa này là tùy chọn, tức là ví dụ trên vẫn hoạt động giống hệt nếu không dùng nó. Tuy nhiên, việc sử dụng từ khóa này có thể giúp mã nguồn dễ đọc và dễ hiểu hơn.

## Từ khóa `super`

Từ khóa `super` dùng để truy cập biến và phương thức của lớp cha (superclass) từ lớp con (subclass). Ví dụ:

```java
public class Super {
    protected int number;
    protected void showNumber() {
        System.out.println("number = " + number);
    }
}
public class Sub extends Super {
    void bar() {
        super.number = 10;
        super.showNumber();
    }
}
```

Trong ví dụ trên, lớp `Sub` truy cập biến thành viên `number` của lớp cha và gọi phương thức `showNumber()` của lớp cha `Super`.

**Những vấn đề cần lưu ý khi sử dụng `this` và `super`:**

- Khi dùng `super()` trong constructor để gọi một constructor khác của lớp cha, câu lệnh này phải nằm ở dòng đầu tiên của constructor, nếu không trình biên dịch sẽ báo lỗi. Ngoài ra, khi dùng `this(...)` để gọi constructor khác trong cùng lớp, cũng phải đặt ở dòng đầu tiên.
- `this` và `super` không thể sử dụng bên trong phương thức `static`.

**Giải thích ngắn gọn:**

Các thành viên được đánh dấu `static` thuộc về lớp; trong ngữ cảnh `static` không tồn tại instance hiện tại nên không thể dùng `this`. `super` cũng không phải là một tham chiếu độc lập trỏ tới "đối tượng lớp cha", mà là một dạng cú pháp giới hạn dùng để truy cập thành viên của lớp cha hoặc gọi constructor lớp cha, do đó cũng không thể dùng trong ngữ cảnh `static`.

## Tài liệu tham khảo

- <https://www.codejava.net/java-core/the-java-language/java-keywords>
- <https://blog.csdn.net/u013393958/article/details/79881037>

# Giải thích chi tiết từ khóa `static`

## Bốn kịch bản sử dụng chính của từ khóa `static`

1. Bổ nghĩa cho biến thành viên và phương thức thành viên
2. Khối code static
3. Bổ nghĩa cho lớp (chỉ bổ nghĩa được cho lớp lồng bên trong)
4. Static import (dùng để import tài nguyên `static` trong lớp, tính năng mới từ JDK 1.5)

### Bổ nghĩa cho biến thành viên và phương thức thành viên (Thường dùng)

Các thành viên được đánh dấu `static` thuộc về lớp, không thuộc về một đối tượng riêng lẻ nào của lớp đó, được chia sẻ bởi tất cả các đối tượng trong lớp và có thể — đồng thời được khuyến nghị — gọi qua tên lớp. Vị trí lưu trữ cụ thể của biến `static` thuộc về chi tiết cài đặt của JVM.

Giống như Java `Heap`, `Method Area` là vùng dữ liệu runtime được dùng chung giữa các `Thread`. Đặc tả JVM quy định rằng nó lưu trữ thông tin cấu trúc của từng lớp, ví dụ như runtime constant pool, dữ liệu field và method, cũng như mã lệnh của các phương thức và constructor. Bố cục lưu trữ cụ thể do từng bản triển khai JVM quyết định.

Trong HotSpot từ JDK 7 trở về trước, `Method Area` chủ yếu được triển khai bởi Permanent Generation (`PermGen`), nhưng `Method Area` và `PermGen` không đồng nhất với nhau. JDK 8 đã loại bỏ `PermGen`: metadata của lớp được chuyển sang lưu tại `Metaspace` trong bộ nhớ native, còn hằng số chuỗi và biến `static` của lớp nằm trong Java `Heap`.

Cú pháp gọi:

- `ClassName.staticVariableName`
- `ClassName.staticMethodName()`

Nếu biến hoặc phương thức được đánh dấu `private` thì thuộc tính hoặc phương thức đó chỉ có thể được truy cập bên trong lớp chứ không thể truy cập từ bên ngoài lớp.

Ví dụ kiểm thử:

```java
public class StaticBean {
    String name;
    // Biến static
    static int age;
    public StaticBean(String name) {
        this.name = name;
    }
    // Phương thức static
    static void sayHello() {
        System.out.println("Hello i am java");
    }
    @Override
    public String toString() {
        return "StaticBean{"+
                "name=" + name + ",age=" + age +
                "}";
    }
}
```

```java
public class StaticDemo {
    public static void main(String[] args) {
        StaticBean staticBean = new StaticBean("1");
        StaticBean staticBean2 = new StaticBean("2");
        StaticBean staticBean3 = new StaticBean("3");
        StaticBean staticBean4 = new StaticBean("4");
        StaticBean.age = 33;
        System.out.println(staticBean + " " + staticBean2 + " " + staticBean3 + " " + staticBean4);
        //StaticBean{name=1,age=33} StaticBean{name=2,age=33} StaticBean{name=3,age=33} StaticBean{name=4,age=33}
        StaticBean.sayHello();//Hello i am java
    }
}
```

### Khối code static

Khối code `static` được định nghĩa trong lớp và nằm ngoài phương thức; khối code `static` thực thi trước khối code non-static (khối code static —> khối code non-static —> constructor). Dù lớp này tạo ra bao nhiêu đối tượng, khối code `static` chỉ thực thi đúng một lần.

Cú pháp của khối code `static` là:

```plain
static {
// thân khối lệnh;
}
```

Một lớp có thể có nhiều khối code `static` đặt ở vị trí tùy ý, miễn là không nằm trong thân của bất kỳ phương thức nào. Khối code `static` thực thi khi khởi tạo lớp (class initialization); nếu có nhiều khối, JVM sẽ thực thi lần lượt theo đúng thứ tự xuất hiện của chúng trong lớp, và mỗi khối chỉ chạy một lần. Quá trình nạp lớp (class loading) có thể diễn ra sớm hơn quá trình khởi tạo.

![Thứ tự thực thi khối code static](/media/jg/ext/oss.javaguide.cn/github/javaguide/88531075-cb28c446.jpg)

Đối với biến `static` được định nghĩa sau khối code `static`, khối code `static` có thể gán giá trị nhưng không thể đọc/truy cập trực tiếp.

### Lớp lồng static

Giữa lớp lồng `static` và lớp nội non-static tồn tại một điểm khác biệt lớn nhất: như chúng ta đã biết, sau khi biên dịch xong, lớp nội non-static sẽ ngầm giữ một tham chiếu trỏ tới lớp bao ngoài đã tạo ra nó, nhưng lớp lồng `static` thì không. Không có tham chiếu này đồng nghĩa với:

1. Việc khởi tạo nó không phụ thuộc vào việc khởi tạo lớp bao ngoài.
2. Nó không thể sử dụng bất kỳ biến thành viên hay phương thức non-`static` nào của lớp bao ngoài.

Example (triển khai mẫu thiết kế Singleton bằng lớp lồng static):

```java
public class Singleton {
    // Khai báo là private để tránh gọi constructor mặc định tạo đối tượng
    private Singleton() {
    }
   // Khai báo là private để lớp lồng static này chỉ có thể được truy cập bên trong lớp Singleton
    private static class SingletonHolder {
        private static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton getUniqueInstance() {
        return SingletonHolder.INSTANCE;
    }
}
```

Khi gọi `getUniqueInstance()` và lần đầu tiên chủ động sử dụng `SingletonHolder.INSTANCE`, `SingletonHolder` mới được khởi tạo và khi đó `INSTANCE` được khởi tạo. JVM có thể nạp `SingletonHolder` sớm hơn, nhưng sẽ không vì thế mà chạy khởi tạo `static` của nó, đồng thời đảm bảo lớp này chỉ được khởi tạo một lần duy nhất.

Cách này không chỉ có ưu điểm khởi tạo trễ (lazy initialization), mà còn được JVM hỗ trợ sẵn tính an toàn luồng (thread-safe).

### Static import

Cú pháp: `import static`

Khi ghép hai từ khóa này, bạn có thể chỉ định import một tài nguyên `static` cụ thể từ một lớp, và không cần dùng tên lớp để gọi thành viên `static` mà có thể dùng trực tiếp biến thành viên và phương thức `static` trong lớp đó.

```java
 // Import toàn bộ tài nguyên static trong Math, lúc này có thể gọi trực tiếp phương thức static bên trong mà không cần qua tên lớp
 // Nếu chỉ muốn import một phương thức static duy nhất, chỉ cần thay * bằng tên phương thức tương ứng
import static java.lang.Math.*;// Đổi thành import static java.lang.Math.max; để chỉ import riêng phương thức static max
public class Demo {
  public static void main(String[] args) {
    int max = max(1,2);
    System.out.println(max);
  }
}
```

## Nội dung bổ sung

### Phương thức static và phương thức non-static

Phương thức `static` thuộc về bản thân lớp, còn phương thức non-static thuộc về từng đối tượng được tạo ra từ lớp đó. Nếu thao tác mà phương thức của bạn thực hiện không phụ thuộc vào các biến và phương thức của từng đối tượng trong lớp, hãy đặt nó là `static` (điều này giúp chương trình chiếm ít không gian hơn). Ngược lại, nó nên là non-static.

Example:

```java
class Foo {
    int i;
    public Foo(int i) {
       this.i = i;
    }
    public static String method1() {
       return "An example string that doesn't depend on i (an instance variable)";
    }
    public int method2() {
       return this.i + 1;  // Phụ thuộc vào i
    }
}
```

Bạn có thể gọi phương thức `static` như thế này: `Foo.method1()`. Nếu thử dùng cách này để gọi `method2` thì sẽ lỗi. Cách sau đây mới hợp lệ:

```java
Foo bar = new Foo(1);
bar.method2();
```

Tổng kết:

- Khi gọi phương thức `static` từ bên ngoài, có thể dùng cách `"ClassName.methodName"` hoặc `"objectName.methodName"`. Còn phương thức instance chỉ có cách thứ hai. Nói cách khác, gọi phương thức `static` không cần tạo đối tượng.
- Khi phương thức `static` truy cập thành viên của chính lớp đó, nó chỉ được phép truy cập thành viên `static` (tức biến thành viên `static` và phương thức `static`), không được phép truy cập biến thành viên instance và phương thức instance; phương thức instance thì không bị giới hạn này.

### Khối code static `static{}` và khối code non-static `{}` (khối khởi tạo đối tượng)

Điểm giống nhau: Đều có thể định nghĩa nhiều khối trong cùng một lớp; nhiều khối code `static` trong cùng một lớp được đưa vào quá trình khởi tạo lớp theo đúng thứ tự xuất hiện trong mã nguồn, và nhiều khối khởi tạo instance được đưa vào quá trình khởi tạo instance theo thứ tự trong mã nguồn.

Điểm khác nhau: Khối code `static` thực thi một lần khi khởi tạo lớp, thời điểm kích hoạt không nhất thiết là lần `new` đầu tiên; khối code non-static (instance initializer block) thực thi mỗi lần khởi tạo một instance mới và được đưa vào quá trình khởi tạo instance cùng với các trình khởi tạo field của instance theo thứ tự văn bản. Chúng chạy sau khi constructor lớp cha trả về và trước khi các câu lệnh tiếp theo của constructor thực thi; nếu constructor ủy quyền sang constructor khác trong cùng lớp thông qua `this(...)`, quá trình khởi tạo này do constructor nằm trong chuỗi ủy quyền thực sự gọi constructor lớp cha thực hiện. Một khối code trần (bare block) bên trong phương thức thông thường chỉ là khối cục bộ (local block), không phải khối khởi tạo instance.

> **🐛 Đính chính (xem [issue #677](https://github.com/Snailclimb/JavaGuide/issues/677))**: Khối code `static` có thể thực thi trong lần `new` đối tượng đầu tiên, nhưng không nhất thiết chỉ chạy khi `new` lần đầu. Ví dụ khi tạo đối tượng `Class` thông qua `Class.forName("ClassDemo")`, khối code `static` cũng sẽ chạy — tức là cả `new` lẫn `Class.forName("ClassDemo")` đều thực thi khối code `static`.
> Thông thường, nếu có một số đoạn mã như các biến hoặc đối tượng dùng nhiều nhất trong dự án bắt buộc phải chạy ngay khi khởi động dự án, ta cần dùng khối code `static` vì loại mã này chạy một cách chủ động. Nếu ta muốn thiết kế các phương thức trong lớp có thể gọi mà không cần tạo đối tượng, ví dụ như lớp `Arrays`, `Character`, `String`, thì cần dùng phương thức `static`. Điểm khác biệt giữa hai loại là khối code `static` tự động thực thi, còn phương thức `static` chỉ chạy khi được gọi.

Example:

```java
public class Test {
    public Test() {
        System.out.print("Constructor mặc định!--");
    }
    // Khối code non-static
    {
        System.out.print("Khối code non-static!--");
    }
    // Khối code static
    static {
        System.out.print("Khối code static!--");
    }
    private static void test() {
        System.out.print("Nội dung trong phương thức static!--");
        {
            System.out.print("Khối code trong phương thức static!--");
        }
    }
    public static void main(String[] args) {
        Test test = new Test();
        Test.test();//Khối code static!--Nội dung trong phương thức static!--Khối code trong phương thức static!--
    }
}
```

Kết quả đầu ra của đoạn mã trên:

```plain
Khối code static!--Khối code non-static!--Constructor mặc định!--Nội dung trong phương thức static!--Khối code trong phương thức static!--
```

Khi chỉ thực thi `Test.test();`, đầu ra là:

```plain
Khối code static!--Nội dung trong phương thức static!--Khối code trong phương thức static!--
```

Khi chỉ thực thi `Test test = new Test();`, đầu ra là:

```plain
Khối code static!--Khối code non-static!--Constructor mặc định!--
```

Điểm khác biệt giữa khối code non-static và constructor là: khối code non-static thực hiện khởi tạo thống nhất cho tất cả các đối tượng, còn constructor khởi tạo cho từng đối tượng tương ứng. Vì có thể có nhiều constructor, chạy constructor nào sẽ tạo ra đối tượng theo cách đó, nhưng bất kể tạo đối tượng nào thì khối code khởi tạo giống nhau luôn được thực thi trước. Nói cách khác, khối code khởi tạo định nghĩa nội dung khởi tạo dùng chung giữa các đối tượng khác nhau.

### Tài liệu tham khảo

- <https://blog.csdn.net/chen13579867831/article/details/78995480>
- <https://www.cnblogs.com/chenssy/p/3388487.html>
- <https://www.cnblogs.com/Qian123/p/5713440.html>
