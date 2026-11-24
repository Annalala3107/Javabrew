---
title: Giải thích chi tiết về Generics & Wildcards
description: "Phân tích toàn diện Generics và Wildcard trong Java: hiểu sâu cơ chế xóa kiểu (Type Erasure), cách dùng wildcard cận trên và cận dưới, áp dụng nguyên lý PECS để làm chủ lập trình generic."
category: Java
tag:
  - Java cơ bản
lang: vi
sourceRef: zh-ref/java/basis/generics-and-wildcards.md
head:
  - - meta
    - name: keywords
      content: Java Generics,Wildcard,xóa kiểu,Type Erasure,biên generic,nguyên lý PECS,phương thức generic,wildcard cận trên cận dưới,interface generic
---

## Generics

### Generics là gì? Có tác dụng gì?

**Java Generics** là một tính năng mới được giới thiệu từ JDK 5. Việc sử dụng tham số kiểu generic giúp tăng khả năng đọc hiểu và tính ổn định của mã nguồn. **Nếu không có chú thích đặc biệt, các hành vi dưới đây tính theo Java 8.**

Trình biên dịch có thể kiểm tra các tham số generic, đồng thời thông qua tham số generic ta có thể chỉ định kiểu đối tượng được truyền vào. Ví dụ đoạn mã `ArrayList<Person> persons = new ArrayList<Person>()` chỉ rõ rằng `ArrayList` này chỉ được phép truyền vào các đối tượng thuộc kiểu `Person`; nếu truyền vào kiểu khác sẽ báo lỗi (từ JDK 7 trở đi có thể viết `new ArrayList<>()`, trình biên dịch sẽ tự suy luận tham số kiểu).

```java
ArrayList<E> extends AbstractList<E>
```

Hơn nữa, `List` nguyên thủy (raw type) trả về kiểu `Object`, cần phải ép kiểu thủ công mới dùng được; sau khi dùng Generics, trình biên dịch sẽ tự động ép kiểu.

### Có những cách sử dụng Generics nào?

Generics nhìn chung có 3 cách sử dụng: **lớp generic** (generic class), **interface generic** (generic interface), và **phương thức generic** (generic method).

**1. Lớp generic**:

```java
// Ở đây T có thể đặt thành bất kỳ định danh nào; thường dùng các ký hiệu như T, E, K, V để biểu diễn generic
// Khi khởi tạo lớp generic, phải chỉ định kiểu cụ thể cho T
public class Generic<T>{

    private T key;

    public Generic(T key) {
        this.key = key;
    }

    public T getKey(){
        return key;
    }
}
```

Cách khởi tạo lớp generic:

```java
Generic<Integer> genericInteger = new Generic<Integer>(123456);
// Từ JDK 7 trở đi có thể viết: new Generic<>(123456)
```

**2. Interface generic**:

```java
public interface Generator<T> {
    public T method();
}
```

Triển khai interface generic, không chỉ định kiểu:

```java
class GeneratorImpl<T> implements Generator<T>{
    @Override
    public T method() {
        return null;
    }
}
```

Triển khai interface generic, có chỉ định kiểu:

```java
class GeneratorImpl implements Generator<String> {
    @Override
    public String method() {
        return "hello";
    }
}
```

**3. Phương thức generic**:

```java
   public static < E > void printArray( E[] inputArray )
   {
         for ( E element : inputArray ){
            System.out.printf( "%s ", element );
         }
         System.out.println();
    }
```

Cách sử dụng:

```java
// Tạo các mảng thuộc các kiểu khác nhau: Integer, Double và Character
Integer[] intArray = { 1, 2, 3 };
String[] stringArray = { "Hello", "World" };
printArray( intArray  );
printArray( stringArray  );
```

### Generics được dùng ở đâu trong dự án thực tế?

- Lớp kết quả trả về dùng chung cho API tự định nghĩa `CommonResult<T>`: thông qua tham số `T` để chỉ định động kiểu dữ liệu của kết quả tùy theo từng kiểu trả về cụ thể
- Định nghĩa lớp xử lý `Excel` là `ExcelUtil<T>` để chỉ định động kiểu dữ liệu xuất ra `Excel`
- Xây dựng các lớp tiện ích cho collection (tham khảo phương thức `sort`, `binarySearch` trong `Collections`).
- ……

### Cơ chế Xóa kiểu (`Type Erasure`) trong Generics là gì? Tại sao phải xóa?

**Java Generics được triển khai thông qua cơ chế xóa kiểu (`Type Erasure`): các instance generic không lưu giữ đối số kiểu cụ thể tại thời điểm runtime, nhưng tệp class vẫn có thể lưu thông tin khai báo generic trong các thuộc tính như `Signature` và có thể đọc thông qua `Reflection` API.**

Trong quá trình biên dịch, trình biên dịch sẽ tự động xóa generic `T` thành `Object` hoặc xóa `T extends xxx` thành kiểu giới hạn `xxx` của nó.

Cơ chế xóa kiểu giúp mã generic giữ được tính tương thích với các thư viện Java và mã nhị phân (binary code) có từ trước khi Generics ra đời. Trình biên dịch sẽ duy trì an toàn kiểu (type safety) và ngữ nghĩa đa hình thông qua các phép ép kiểu cần thiết và phương thức cầu nối (`Bridge Method`).

Nói thế này có lẽ hơi trừu tượng, tôi lấy một ví dụ:

```java
List<Integer> list = new ArrayList<>();

list.add(12);
// 1. Thêm trực tiếp lúc biên dịch sẽ báo lỗi
list.add("a");
Class<? extends List> clazz = list.getClass();
Method add = clazz.getDeclaredMethod("add", Object.class);
// 2. Thêm thông qua Reflection lúc runtime thì được
add.invoke(list, "kl");

System.out.println(list)
```

Thêm một ví dụ nữa: do vấn đề xóa kiểu trong Generics, việc nạp chồng (`Overload`) phương thức dưới đây sẽ báo lỗi.

```java
public void print(List<String> list)  { }
public void print(List<Integer> list) { }
```

![Vấn đề xóa kiểu trong Generics](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/generics-runtime-erasure-1383a1a3.png)

Nguyên nhân cũng rất đơn giản: sau khi xóa kiểu, cả `List<String>` và `List<Integer>` sau biên dịch đều trở thành `List`.

**Nếu trình biên dịch đã xóa generic đi rồi, tại sao vẫn phải dùng Generics? Dùng `Object` thay thế không được sao?**

Câu hỏi này thực chất đang gián tiếp kiểm tra vai trò của Generics:

- Sử dụng Generics giúp kiểm tra kiểu dữ liệu ngay tại thời điểm biên dịch.

- Sử dụng kiểu `Object` đòi hỏi phải ép kiểu tường minh thủ công, làm giảm khả năng đọc hiểu mã nguồn và tăng xác suất phát sinh lỗi.

- Generics có thể sử dụng các kiểu tự giới hạn (self-bounded types) như `T extends Comparable`.

### Bridge Method (Phương thức cầu nối) là gì?

Phương thức cầu nối (`Bridge Method`) được dùng để đảm bảo tính đa hình khi kế thừa lớp generic.

```java
class Node<T> {
    public T data;
    public Node(T data) { this.data = data; }
    public void setData(T data) {
        System.out.println("Node.setData");
        this.data = data;
    }
}

class MyNode extends Node<Integer> {
    public MyNode(Integer data) { super(data); }

  	// Node<T> sau khi xóa kiểu sẽ là setData(Object data), mà lớp con MyNode không ghi đè phương thức này, nên trình biên dịch sẽ thêm bridge method này để đảm bảo đa hình
   	public void setData(Object data) {
        setData((Integer) data);
    }

    public void setData(Integer data) {
        System.out.println("MyNode.setData");
        super.setData(data);
    }
}
```

⚠️**Lưu ý**: `Bridge Method` được trình biên dịch tự động sinh ra, không phải viết tay.

### Generics có những hạn chế nào? Tại sao?

Các hạn chế của Generics nhìn chung đều bắt nguồn từ cơ chế xóa kiểu (`Type Erasure`). Sau khi bị xóa thành `Object`, không thể kiểm tra kiểu tại thời điểm runtime.

- Có thể khai báo biến kiểu `T`, nhưng không thể khởi tạo trực tiếp tham số kiểu bằng `new T()`.
- Tham số kiểu generic không thể là kiểu dữ liệu nguyên thủy (primitive type). Do kiểu nguyên thủy không phải lớp con của `Object`, nên cần dùng kiểu tham chiếu tương ứng (wrapper class) để thay thế.
- Không thể khởi tạo mảng của tham số kiểu generic. Sau khi xóa thành `Object`, không thể thực hiện kiểm tra kiểu.
- Không thể khởi tạo mảng generic.
- Generics không thể dùng `instanceof` để kiểm tra tham số kiểu `T` lúc runtime; `getClass()` sau khi xóa kiểu cũng không thể phân biệt các đối số kiểu generic khác nhau (ví dụ `List<String>` và `List<Integer>` đều trả về `List.class`).
- Không thể triển khai cùng một interface với hai tham số generic khác nhau, vì sau khi xóa kiểu các bridge method của nhiều interface cha sẽ xung đột với nhau.
- Ngữ cảnh `static` của lớp không thể tham chiếu tới tham số kiểu do lớp đó khai báo, nhưng phương thức generic `static` có thể khai báo và sử dụng tham số kiểu của riêng nó.
- ……

### Đoạn mã sau có biên dịch được không, tại sao?

```java
public final class Algorithm {
    public static <T> T max(T x, T y) {
        return x > y ? x : y;
    }
}
```

Không thể biên dịch, vì cả `x` và `y` đều sẽ bị xóa kiểu thành `Object`, mà `Object` không thể sử dụng toán tử `>` để so sánh.

```java
public class Singleton<T> {

    public static T getInstance() {
        if (instance == null)
            instance = new Singleton<T>();

        return instance;
    }

    private static T instance = null;
}
```

Không thể biên dịch, vì trường `static` và phương thức `static` của lớp không thể tham chiếu đến tham số kiểu `T` do lớp khai báo. Phương thức `static` có thể khai báo tham số kiểu của riêng mình, ví dụ `public static <T> T getInstance()`.

## Wildcard (Ký tự đại diện)

### Wildcard là gì? Có tác dụng gì?

Kiểu generic vốn có tính cố định (bất biến - invariant), trong một số kịch bản sử dụng sẽ hơi thiếu linh hoạt, vì vậy Wildcard ra đời! Wildcard cho phép tham số kiểu thay đổi, dùng để giải quyết vấn đề Generics không hỗ trợ hiệp biến (covariance).

Ví dụ:

```java
// Giới hạn kiểu phải là lớp con của Person
<? extends Person>
// Giới hạn kiểu phải là lớp cha của Manager
<? super Manager>
```

### Giữa Wildcard `?` và generic `T` thường dùng có điểm gì khác biệt?

- `T` có thể dùng để khai báo biến hoặc hằng số, còn `?` thì không.
- `T` thường dùng để khai báo lớp generic hoặc phương thức generic, còn wildcard `?` thường dùng ở mã phía gọi (call site) và tham số hình thức của phương thức generic.
- `T` tại thời điểm biên dịch sẽ bị xóa thành kiểu giới hạn hoặc `Object`. Còn wildcard `?` bên trong phương thức sẽ được trình biên dịch "capture" thành một kiểu cụ thể nhưng chưa biết (wildcard capture), do đó không thể ghi bất kỳ phần tử nào khác ngoài `null` vào `List<?>`, nhưng có thể kết hợp với phương thức generic để xử lý.

### Unbounded Wildcard (Wildcard không giới hạn) là gì?

Unbounded wildcard có thể tiếp nhận bất kỳ kiểu dữ liệu generic nào, dùng để triển khai các phương thức đơn giản không phụ thuộc vào tham số kiểu cụ thể; nó có thể capture kiểu tham số và giao cho phương thức generic xử lý.

```java
void testMethod(Person<?> p) {
  // Phương thức generic tự xử lý
}
```

**`List<?>` và `List` có khác nhau không?** Chắc chắn có!

- `List<?> list` biểu thị kiểu phần tử của `list` là **một kiểu chưa xác định nhưng cố định** (tức là "tồn tại một kiểu `T` nào đó sao cho `list` là `List<T>`"), do đó trình biên dịch không cho phép thêm bất kỳ phần tử nào khác ngoài `null` vào bên trong để tránh mất an toàn kiểu.
- `List list` là kiểu nguyên thủy (raw type), sẽ bỏ qua một phần kiểm tra kiểu generic và không đồng nghĩa với `List<Object>`. Khi thêm phần tử vào nó thường phát sinh cảnh báo unchecked và có thể đẩy lỗi kiểu dữ liệu sang thời điểm runtime.

```java
List<?> list = new ArrayList<>();
list.add("sss");// Báo lỗi
List list2 = new ArrayList<>();
list2.add("sss");// Thông báo cảnh báo (warning)
```

### Upper Bounded Wildcard (Wildcard cận trên) và Lower Bounded Wildcard (Wildcard cận dưới) là gì?

Khi sử dụng Generics, chúng ta cũng có thể giới hạn cận trên và cận dưới cho đối số kiểu generic truyền vào, chẳng hạn như: **chỉ cho phép truyền vào lớp cha của một kiểu nào đó hoặc lớp con của một kiểu nào đó làm đối số kiểu**.

**Wildcard cận trên `extends`** biểu thị đối số kiểu phải là kiểu được chỉ định hoặc kiểu con của nó.

Ví dụ:

```java
// Giới hạn bắt buộc phải là lớp con của Person
<? extends Person>
```

Có thể thiết lập nhiều giới hạn kiểu (multiple bounds), và cũng có thể giới hạn cho kiểu `T`.

```java
<T extends T1 & T2>
<T extends XXX>
```

**Wildcard cận dưới `super`** biểu thị đối số kiểu phải là kiểu được chỉ định hoặc kiểu cha của nó.

Ví dụ:

```java
// Giới hạn bắt buộc phải là lớp cha của Employee
List<? super Employee>
```

**`? extends xxx` và `? super xxx` khác nhau như thế nào?**

Phạm vi đối số kiểu mà hai dạng này tiếp nhận là khác nhau. Với `List<? extends Xxx>`, có thể đọc phần tử ra dưới dạng `Xxx`, nhưng ngoài `null` ra thì không thể ghi vào một cách an toàn; với `List<? super Xxx>`, có thể ghi vào `Xxx` và các kiểu con của nó, còn kết quả đọc ra chỉ có thể xem một cách an toàn là `Object`.

**Nguyên lý PECS (Producer Extends, Consumer Super)**: Khi **lấy** phần tử từ cấu trúc dữ liệu ra thì dùng `extends` (Producer - bên sản xuất); khi **ghi** phần tử vào cấu trúc dữ liệu thì dùng `super` (Consumer - bên tiêu thụ). Ví dụ: `List<? extends Number>` chỉ có thể đọc `Number` từ đó ra, không thể ghi vào; `List<? super Integer>` có thể ghi vào `Integer` và các lớp con của nó, còn khi đọc ra sẽ nhận được `Object`. `Collections.copy(List<? super T> dest, List<? extends T> src)` chính là ví dụ kinh điển: đọc từ `src` và ghi vào `dest`.

**Vậy `T extends xxx` và `? extends xxx` khác nhau như thế nào?**

`T extends xxx` dùng để khai báo tham số kiểu có cận trên, sau khi xóa kiểu sẽ là `xxx`; `? extends xxx` là đối số wildcard trong kiểu được tham số hóa, có thể xuất hiện ở các vị trí như field, biến cục bộ, tham số phương thức và kiểu trả về.

**Sự khác biệt giữa `Class<?>` và `Class`?**

Dùng trực tiếp `Class` sẽ có một cảnh báo về kiểu (raw type warning), còn dùng `Class<?>` thì không, vì `Class` là một lớp generic và việc dùng kiểu nguyên thủy sẽ phát sinh cảnh báo.

### Đoạn mã sau có biên dịch được không, tại sao?

```java
class Shape { /* ... */ }
class Circle extends Shape { /* ... */ }
class Rectangle extends Shape { /* ... */ }

class Node<T> { /* ... */ }

Node<Circle> nc = new Node<>();
Node<Shape>  ns = nc;
```

Không thể, vì `Node<Circle>` không phải là lớp con của `Node<Shape>`.

```java
class Shape { /* ... */ }
class Circle extends Shape { /* ... */ }
class Rectangle extends Shape { /* ... */ }

class Node<T> { /* ... */ }
class ChildNode<T> extends Node<T>{

}
ChildNode<Circle> nc = new ChildNode<>();
Node<Circle>  ns = nc;
```

Biên dịch được, vì `ChildNode<Circle>` là lớp con của `Node<Circle>`.

```java
public static void print(List<? extends Number> list) {
    for (Number n : list)
        System.out.print(n + " ");
    System.out.println();
}
```

Biên dịch được; `List<? extends Number>` có thể lấy phần tử ra ngoài, nhưng không thể gọi `add()` để thêm phần tử vào.

## Tài liệu tham khảo

- Tài liệu chính thức của Java: https://docs.oracle.com/javase/tutorial/java/generics/index.html
- Java cơ bản - Hiểu trọn vẹn Generics trong một bài viết: https://www.cnblogs.com/XiiX/p/14719568.html
