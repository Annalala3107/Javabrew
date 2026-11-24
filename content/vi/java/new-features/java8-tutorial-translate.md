---
title: Hướng dẫn Java 8 (Bản dịch & Chú giải)
description: Biên dịch và tổng hợp hướng dẫn Java 8, bao gồm các tính năng mới và ví dụ mã nguồn như biểu thức Lambda, Method Reference, Default Method trong Interface, Stream API, v.v.
category: Java
tag:
  - Tính năng mới Java
head:
  - - meta
    - name: keywords
      content: Java 8,Hướng dẫn,Lambda,Method Reference,Default Method,Stream API,Functional Interface,Date/Time API
lang: vi
sourceRef: zh-ref/java/new-features/java8-tutorial-translate.md
---

# Hướng dẫn Java 8 (Bản dịch & Chú giải)

JDK 8 được phát hành vào ngày 18/03/2014. Đây là một phiên bản LTS (Long-Term Support — hỗ trợ dài hạn) và là một trong những phiên bản quan trọng nhất trong lịch sử Java. Tính đến nay, đã có năm phiên bản LTS gồm JDK 8, JDK 11, JDK 17, JDK 21 và JDK 25.

JDK 8 đã giới thiệu nhiều tính năng mới quan trọng. Bài viết này sẽ chọn lọc những tính năng tiêu biểu nhất để giới thiệu chi tiết:

- Biểu thức Lambda (Lambda expressions)
- Tham chiếu phương thức (Method Reference)
- Phương thức mặc định trong Interface (Default Method)
- Stream API
- Functional Interface (giao diện hàm)
- Lớp `Optional`
- Date/Time API
- Cải tiến về Annotation

Biểu đồ dưới đây thống kê số lượng tính năng mới và thời gian phát hành của từng bản cập nhật từ JDK 8 đến JDK 24:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

Cùng với sự phổ biến ngày càng rộng rãi của Java 8, nhiều bạn cũng chia sẻ rằng kiến thức về Java 8 rất thường xuyên được hỏi trong phỏng vấn. Đáp ứng yêu cầu và nhu cầu của mọi người, tôi dự định tổng hợp lại phần kiến thức này. Ban đầu tôi định tự tổng hợp, nhưng sau đó thấy trên GitHub có một repository liên quan tại địa chỉ:
[https://github.com/winterbe/java8-tutorial](https://github.com/winterbe/java8-tutorial). Repository này viết bằng tiếng Anh, tôi đã dịch lại, đồng thời bổ sung và chỉnh sửa một phần nội dung. Dưới đây là nội dung chính.

---

Chào mừng bạn đến với bài giới thiệu về Java 8 của tôi. Tài liệu hướng dẫn này sẽ dẫn dắt bạn đi qua từng tính năng ngôn ngữ mới. Thông qua các ví dụ mã nguồn ngắn gọn, bạn sẽ học cách sử dụng Default Method trong Interface, biểu thức Lambda, Method Reference và Repeatable Annotation. Ở phần cuối bài viết, bạn sẽ làm quen với những thay đổi API mới nhất như Stream, Functional Interface, các phương thức mở rộng của `Map` và Date API mới. Không có những đoạn văn bản khô khan dài dòng, chỉ có các đoạn code được chú thích rõ ràng.

## Phương thức mặc định của Interface (Default Methods for Interfaces)

Java 8 cho phép chúng ta thêm phần triển khai phương thức không trừu tượng (non-abstract) vào interface bằng cách sử dụng từ khóa `default`. Tính năng này còn được gọi là [phương thức mở rộng ảo (virtual extension methods)](http://stackoverflow.com/a/24102730).

Ví dụ đầu tiên:

```java
interface Formula{

    double calculate(int a);

    default double sqrt(int a) {
        return Math.sqrt(a);
    }

}
```

Trong interface `Formula`, ngoài phương thức trừu tượng `calculate`, còn định nghĩa thêm phương thức mặc định `sqrt`. Lớp triển khai interface này chỉ cần cài đặt phương thức trừu tượng `calculate`, còn phương thức mặc định `sqrt` có thể sử dụng trực tiếp. Tất nhiên bạn cũng có thể tạo đối tượng thông qua interface rồi triển khai phương thức trong interface đó — hãy cùng minh họa cách này bằng code.

```java
public class Main {

  public static void main(String[] args) {
    // Truy cập interface thông qua anonymous inner class
    Formula formula = new Formula() {
        @Override
        public double calculate(int a) {
            return sqrt(a * 100);
        }
    };

    System.out.println(formula.calculate(100));     // 100.0
    System.out.println(formula.sqrt(16));           // 4.0

  }

}
```

`formula` được triển khai dưới dạng một đối tượng ẩn danh (anonymous object). Đoạn code rất dễ hiểu: 6 dòng code thực hiện phép tính `sqrt(a * 100)`. Trong phần tiếp theo, chúng ta sẽ thấy một cách hay hơn và tiện lợi hơn để triển khai đối tượng chỉ có một phương thức trong Java 8.

**Ghi chú của người dịch:** Dù là abstract class hay interface, chúng ta đều có thể truy cập thông qua anonymous inner class (lớp nội danh ẩn). Không thể dùng abstract class hoặc interface để tạo đối tượng trực tiếp. Với cách truy cập interface qua anonymous inner class ở trên, ta có thể hiểu như sau: một lớp nội danh triển khai phương thức trừu tượng trong interface và trả về một đối tượng của lớp nội danh đó, sau đó ta dùng tham chiếu kiểu interface trỏ tới đối tượng này.

## Biểu thức Lambda (Lambda expressions)

Trước tiên hãy xem trong các phiên bản Java cũ, chuỗi ký tự được sắp xếp như thế nào:

```java
List<String> names = Arrays.asList("peter", "anna", "mike", "xenia");

Collections.sort(names, new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return b.compareTo(a);
    }
});
```

Chỉ cần truyền một đối tượng `List` và một bộ so sánh (`Comparator`) vào phương thức tĩnh `Collections.sort` để sắp xếp theo thứ tự chỉ định. Cách làm thông thường là tạo một đối tượng comparator ẩn danh rồi truyền vào phương thức `sort`.

Trong Java 8, bạn không còn cần dùng cách tạo đối tượng ẩn danh truyền thống này nữa; Java 8 cung cấp cú pháp ngắn gọn hơn — biểu thức Lambda:

```java
Collections.sort(names, (String a, String b) -> {
    return b.compareTo(a);
});
```

Có thể thấy code trở nên ngắn hơn và dễ đọc hơn, nhưng thực tế vẫn có thể viết ngắn hơn nữa:

```java
Collections.sort(names, (String a, String b) -> b.compareTo(a));
```

Đối với thân hàm chỉ có một dòng code, bạn có thể bỏ cặp dấu ngoặc nhọn `{}` và từ khóa `return`, thậm chí còn có thể viết gọn hơn nữa:

```java
names.sort((a, b) -> b.compareTo(a));
```

Bản thân lớp `List` đã có sẵn phương thức `sort`. Hơn nữa, trình biên dịch Java có thể tự động suy luận kiểu tham số (type inference), nên bạn không cần phải viết lại kiểu dữ liệu. Tiếp theo hãy xem biểu thức Lambda còn có những cách dùng nào khác.

## Functional Interface (Giao diện hàm)

**Ghi chú của người dịch:** Bản gốc giải thích phần này chưa được rõ ràng nên đã được chỉnh sửa lại!

Các nhà thiết kế ngôn ngữ Java đã đầu tư rất nhiều công sức để suy nghĩ cách giúp các hàm hiện có hỗ trợ Lambda một cách thân thiện. Giải pháp cuối cùng được áp dụng là bổ sung khái niệm Functional Interface. **"Functional Interface" là interface chỉ chứa duy nhất một phương thức trừu tượng (abstract method), nhưng có thể có nhiều phương thức không trừu tượng (chính là các Default Method đã nhắc ở trên).** Những interface như vậy có thể đóng vai trò là kiểu mục tiêu (target type) của biểu thức Lambda. `java.lang.Runnable` và `java.util.concurrent.Callable` là hai ví dụ kinh điển nhất của Functional Interface. Java 8 bổ sung thêm một annotation đặc biệt là `@FunctionalInterface`, nhưng annotation này thường không bắt buộc. Chỉ cần interface thỏa mãn định nghĩa của Functional Interface, trình biên dịch Java đều có thể dùng nó làm kiểu mục tiêu cho biểu thức Lambda. Thông thường nên gắn annotation `@FunctionalInterface` lên interface để khi trình biên dịch phát hiện interface đó không đáp ứng yêu cầu của Functional Interface thì sẽ báo lỗi ngay, như hình dưới đây.

![Annotation @FunctionalInterface](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/FunctionalInterface-206fcd2d.png)

Ví dụ:

```java
@FunctionalInterface
public interface Converter<F, T> {
  T convert(F from);
}
```

```java
    // TODO Chuyển đổi chuỗi số sang kiểu số nguyên
    Converter<String, Integer> converter = (from) -> Integer.valueOf(from);
    Integer converted = converter.convert("123");
    System.out.println(converted.getClass()); //class java.lang.Integer
```

**Ghi chú của người dịch:** Hầu hết các Functional Interface chúng ta đều không cần tự viết, Java 8 đã triển khai sẵn cho chúng ta trong gói `java.util.function`.

## Tham chiếu phương thức và hàm khởi tạo (Method and Constructor References)

Đoạn code ở phần trước còn có thể biểu diễn bằng tham chiếu phương thức tĩnh (static method reference):

```java
    Converter<String, Integer> converter = Integer::valueOf;
    Integer converted = converter.convert("123");
    System.out.println(converted.getClass());   //class java.lang.Integer
```

Java 8 cho phép bạn truyền tham chiếu của phương thức hoặc hàm khởi tạo (constructor) thông qua toán tử `::`. Ví dụ trên minh họa cách tham chiếu phương thức tĩnh. Tuy nhiên, chúng ta cũng có thể tham chiếu phương thức của đối tượng (instance method):

```java
class Something {
    String startsWith(String s) {
        return String.valueOf(s.charAt(0));
    }
}
```

```java
Something something = new Something();
Converter<String, String> converter = something::startsWith;
String converted = converter.convert("Java");
System.out.println(converted);    // "J"
```

Tiếp theo, hãy xem constructor được tham chiếu bằng toán tử `::` như thế nào. Đầu tiên, chúng ta định nghĩa một lớp đơn giản có nhiều constructor:

```java
class Person {
    String firstName;
    String lastName;

    Person() {}

    Person(String firstName, String lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }
}
```

Tiếp theo, chúng ta định nghĩa một interface factory dùng để tạo đối tượng `Person`:

```java
interface PersonFactory<P extends Person> {
    P create(String firstName, String lastName);
}
```

Ở đây chúng ta sử dụng tham chiếu constructor để liên kết chúng lại với nhau thay vì phải tự cài đặt thủ công một factory đầy đủ:

```java
PersonFactory<Person> personFactory = Person::new;
Person person = personFactory.create("Peter", "Parker");
```

Chúng ta chỉ cần dùng `Person::new` để lấy tham chiếu tới constructor của lớp `Person`; trình biên dịch Java sẽ tự động lựa chọn constructor phù hợp dựa trên kiểu tham số của phương thức `PersonFactory.create`.

## Phạm vi của biểu thức Lambda (Lambda Scopes)

### Truy cập biến cục bộ (Local Variables)

Chúng ta có thể truy cập trực tiếp biến cục bộ bên ngoài từ bên trong biểu thức Lambda:

```java
final int num = 1;
Converter<Integer, String> stringConverter =
        (from) -> String.valueOf(from + num);

stringConverter.convert(2);     // 3
```

Tuy nhiên, khác với đối tượng ẩn danh, biến `num` ở đây không bắt buộc phải khai báo là `final`, đoạn code sau vẫn hoàn toàn hợp lệ:

```java
int num = 1;
Converter<Integer, String> stringConverter =
        (from) -> String.valueOf(from + num);

stringConverter.convert(2);     // 3
```

Nhưng biến `num` ở đây không được phép bị thay đổi bởi code phía sau (tức mang ngữ nghĩa `final` ngầm định — effectively final), ví dụ đoạn code sau sẽ không thể biên dịch:

```java
int num = 1;
Converter<Integer, String> stringConverter =
        (from) -> String.valueOf(from + num);
num = 3; // Cố gắng thay đổi num bên trong biểu thức lambda cũng không được phép.
```

### Truy cập trường dữ liệu (Fields) và biến tĩnh (Static Variables)

So với biến cục bộ, bên trong biểu thức Lambda chúng ta có cả quyền đọc và ghi đối với các trường của instance (instance fields) và biến tĩnh (static variables). Hành vi này nhất quán với đối tượng ẩn danh.

```java
class Lambda4 {
    static int outerStaticNum;
    int outerNum;

    void testScopes() {
        Converter<Integer, String> stringConverter1 = (from) -> {
            outerNum = 23;
            return String.valueOf(from);
        };

        Converter<Integer, String> stringConverter2 = (from) -> {
            outerStaticNum = 72;
            return String.valueOf(from);
        };
    }
}
```

### Truy cập Default Method của Interface

Còn nhớ ví dụ `Formula` ở phần đầu tiên không? Interface `Formula` đã định nghĩa một phương thức mặc định `sqrt`, có thể được gọi từ mọi thể hiện `formula` chứa đối tượng ẩn danh. Điều này không áp dụng được cho biểu thức Lambda.

Không thể truy cập các phương thức mặc định (default method) từ bên trong biểu thức Lambda, do đó đoạn code dưới đây không biên dịch được:

```java
Formula formula = (a) -> sqrt(a * 100);
```

## Các Functional Interface tích hợp sẵn (Built-in Functional Interfaces)

API của JDK 1.8 chứa rất nhiều Functional Interface tích hợp sẵn. Một số trong đó khá quen thuộc từ các phiên bản Java cũ như `Comparator` hoặc `Runnable`; các interface này đều đã được gắn thêm annotation `@FunctionalInterface` để có thể dùng với biểu thức Lambda.

Bên cạnh đó, Java 8 API cũng cung cấp rất nhiều Functional Interface hoàn toàn mới giúp công việc lập trình thuận tiện hơn. Một số interface bắt nguồn từ thư viện [Google Guava](https://code.google.com/p/guava-libraries/); ngay cả khi bạn đã quen thuộc với chúng, việc tìm hiểu cách chúng được mở rộng để dùng với Lambda vẫn rất hữu ích.

### Predicate

Interface `Predicate` là một interface **khẳng định (predicate)** chỉ nhận một tham số và trả về giá trị kiểu boolean. Interface này chứa nhiều phương thức mặc định để kết hợp các `Predicate` thành các biểu thức logic phức tạp hơn (như AND, OR, NOT):

**Ghi chú của người dịch:** Mã nguồn của interface `Predicate` như sau

```java
package java.util.function;
import java.util.Objects;

@FunctionalInterface
public interface Predicate<T> {

    // Nhận một tham số đầu vào và trả về giá trị boolean. Phương thức này dùng để kiểm tra điều kiện.
    boolean test(T t);

    // Tương tự toán tử logic "&&", chỉ trả về true khi cả hai vế đều đúng
    default Predicate<T> and(Predicate<? super T> other) {
        Objects.requireNonNull(other);
        return (t) -> test(t) && other.test(t);
    }
    // Tương tự toán tử logic "!", phủ định kết quả kiểm tra
    default Predicate<T> negate() {
        return (t) -> !test(t);
    }
    // Tương tự toán tử logic "||", chỉ cần một trong hai vế đúng thì trả về true
    default Predicate<T> or(Predicate<? super T> other) {
        Objects.requireNonNull(other);
        return (t) -> test(t) || other.test(t);
    }
   // Nhận một đối tượng Object và trả về một Predicate. Dùng để kiểm tra đối tượng truyền vào có bằng (equal) targetRef hay không.
    static <T> Predicate<T> isEqual(Object targetRef) {
        return (null == targetRef)
                ? Objects::isNull
                : object -> targetRef.equals(object);
    }
```

Ví dụ:

```java
Predicate<String> predicate = (s) -> s.length() > 0;

predicate.test("foo");              // true
predicate.negate().test("foo");     // false

Predicate<Boolean> nonNull = Objects::nonNull;
Predicate<Boolean> isNull = Objects::isNull;

Predicate<String> isEmpty = String::isEmpty;
Predicate<String> isNotEmpty = isEmpty.negate();
```

### Function

Interface `Function` nhận một tham số và tạo ra một kết quả. Các phương thức mặc định có thể dùng để nối chuỗi nhiều hàm lại với nhau (`compose`, `andThen`):

**Ghi chú của người dịch:** Mã nguồn của interface `Function` như sau

```java

package java.util.function;

import java.util.Objects;

@FunctionalInterface
public interface Function<T, R> {

    // Áp dụng đối tượng Function lên tham số đầu vào và trả về kết quả tính toán.
    R apply(T t);
    // Kết hợp hai Function và trả về một Function thực thi chức năng của cả hai.
    default <V> Function<V, R> compose(Function<? super V, ? extends T> before) {
        Objects.requireNonNull(before);
        return (V v) -> apply(before.apply(v));
    }
    //
    default <V> Function<T, V> andThen(Function<? super R, ? extends V> after) {
        Objects.requireNonNull(after);
        return (T t) -> after.apply(apply(t));
    }

    static <T> Function<T, T> identity() {
        return t -> t;
    }
}
```

```java
Function<String, Integer> toInteger = Integer::valueOf;
Function<String, String> backToString = toInteger.andThen(String::valueOf);
backToString.apply("123");     // "123"
```

### Supplier

Interface `Supplier` tạo ra kết quả theo một kiểu generic xác định. Khác với `Function`, interface `Supplier` không nhận tham số đầu vào.

```java
Supplier<Person> personSupplier = Person::new;
personSupplier.get();   // new Person
```

### Consumer

Interface `Consumer` biểu diễn một thao tác sẽ được thực thi trên một tham số đầu vào duy nhất.

```java
Consumer<Person> greeter = (p) -> System.out.println("Hello, " + p.firstName);
greeter.accept(new Person("Luke", "Skywalker"));
```

### Comparator

`Comparator` là interface kinh điển từ các phiên bản Java cũ, trên đó Java 8 đã bổ sung nhiều phương thức mặc định:

```java
Comparator<Person> comparator = (p1, p2) -> p1.firstName.compareTo(p2.firstName);

Person p1 = new Person("John", "Doe");
Person p2 = new Person("Alice", "Wonderland");

comparator.compare(p1, p2);             // > 0
comparator.reversed().compare(p1, p2);  // < 0
```

## Optional

`Optional` không phải là Functional Interface, mà là một container dùng để biểu diễn một cách tường minh rằng giá trị "có thể không tồn tại". Sử dụng đúng cách giúp giảm bớt một phần việc kiểm tra `null` thủ công, nhưng không thể đảm bảo chương trình hoàn toàn không bao giờ gặp `NullPointerException`. Đây là một khái niệm quan trọng cho phần tiếp theo, hãy cùng tìm hiểu nhanh cách `Optional` hoạt động.

`Optional` là một container đơn giản: nó hoặc chứa một giá trị khác `null`, hoặc ở trạng thái rỗng. Trong các tình huống cần thể hiện giá trị trả về "có thể không tồn tại kết quả", ta có thể trả về `Optional` thay vì dùng `null` để biểu thị không có kết quả.

Ghi chú của người dịch: Đã bổ sung giải thích tác dụng của từng phương thức trong ví dụ.

```java
// of(): Tạo một Optional cho giá trị khác null
Optional<String> optional = Optional.of("bam");
// isPresent(): Trả về true nếu giá trị tồn tại, ngược lại trả về false
optional.isPresent();           // true
// get(): Trả về giá trị nếu Optional có giá trị, ngược lại ném ra NoSuchElementException
optional.get();                 // "bam"
// orElse(): Trả về giá trị nếu có, ngược lại trả về giá trị mặc định được chỉ định
optional.orElse("fallback");    // "bam"
// ifPresent(): Nếu Optional có giá trị thì gọi consumer với giá trị đó, ngược lại không làm gì
optional.ifPresent((s) -> System.out.println(s.charAt(0)));     // "b"
```

Đọc thêm đề xuất: [[Java 8] Cách sử dụng Optional đúng cách](https://blog.kaaass.net/archives/764)

## Streams (Luồng)

`java.util.stream.Stream` biểu diễn một chuỗi các thao tác có thể được áp dụng tuần tự trên một tập hợp phần tử. Thao tác trên Stream được chia thành thao tác trung gian (intermediate operation) và thao tác kết thúc (terminal operation): thao tác kết thúc trả về một kết quả tính toán thuộc một kiểu cụ thể, trong khi thao tác trung gian trả về chính Stream đó để bạn có thể nối tiếp nhiều thao tác lại với nhau. Stream có thể được tạo từ nhiều nguồn dữ liệu khác nhau như collection, mảng, hàm sinh dữ liệu; bản thân `Map` không có phương thức `stream()`, nhưng có thể tạo luồng thông qua các view key, value hoặc entry của nó. Các thao tác trên Stream có thể thực thi tuần tự hoặc song song.

Trước tiên hãy xem Stream được dùng như thế nào bằng cách tạo một `List` dữ liệu phục vụ cho các ví dụ:

```java
List<String> stringList = new ArrayList<>();
stringList.add("ddd2");
stringList.add("aaa2");
stringList.add("bbb1");
stringList.add("aaa1");
stringList.add("bbb3");
stringList.add("ccc");
stringList.add("bbb2");
stringList.add("ddd1");
```

Java 8 mở rộng các lớp collection để có thể tạo Stream thông qua `Collection.stream()` hoặc `Collection.parallelStream()`. Các mục dưới đây sẽ giải thích chi tiết những thao tác Stream thường dùng:

### Filter (Lọc)

`filter` lọc thông qua một interface `Predicate` và chỉ giữ lại các phần tử thỏa mãn điều kiện. Thao tác này thuộc **thao tác trung gian (intermediate operation)**, nên chúng ta có thể tiếp tục áp dụng các thao tác Stream khác (chẳng hạn như `forEach`) lên kết quả sau khi lọc. `forEach` cần một hàm để lần lượt thực thi trên từng phần tử đã lọc. `forEach` là một thao tác kết thúc (terminal operation), do đó chúng ta không thể thực thi thêm thao tác Stream nào sau `forEach`.

```java
        // Kiểm thử Filter (lọc)
        stringList
                .stream()
                .filter((s) -> s.startsWith("a"))
                .forEach(System.out::println);//aaa2 aaa1
```

`forEach` được thiết kế dành cho Lambda, giữ được phong cách gọn nhẹ nhất. Hơn nữa bản thân biểu thức Lambda có thể tái sử dụng nên rất tiện lợi.

### Sorted (Sắp xếp)

Sắp xếp là một **thao tác trung gian (intermediate operation)** trả về một Stream đã được sắp xếp. **Nếu bạn không chỉ định một `Comparator` tùy chỉnh thì hệ thống sẽ dùng thứ tự sắp xếp mặc định.**

```java
        // Kiểm thử Sort (sắp xếp)
        stringList
                .stream()
                .sorted()
                .filter((s) -> s.startsWith("a"))
                .forEach(System.out::println);// aaa1 aaa2
```

Cần lưu ý rằng việc sắp xếp chỉ tạo ra một Stream đã sắp xếp mới mà không làm ảnh hưởng đến nguồn dữ liệu gốc; sau khi sắp xếp, dữ liệu ban đầu `stringList` sẽ không bị thay đổi:

```java
    System.out.println(stringList);// ddd2, aaa2, bbb1, aaa1, bbb3, ccc, bbb2, ddd1
```

### Map (Ánh xạ)

Thao tác trung gian `map` sẽ lần lượt chuyển đổi từng phần tử thành một đối tượng khác dựa theo interface `Function` được chỉ định.

Ví dụ dưới đây minh họa việc chuyển chuỗi thành chữ in hoa. Bạn cũng có thể dùng `map` để chuyển đổi đối tượng sang kiểu khác; kiểu của Stream mà `map` trả về được quyết định bởi kiểu trả về của hàm bạn truyền vào `map`.

```java
        // Kiểm thử thao tác Map
        stringList
                .stream()
                .map(String::toUpperCase)
                .sorted((a, b) -> b.compareTo(a))
                .forEach(System.out::println);// "DDD2", "DDD1", "CCC", "BBB3", "BBB2", "BBB1", "AAA2", "AAA1"
```

### Match (Khớp điều kiện)

Stream cung cấp nhiều thao tác kiểm tra khớp điều kiện, cho phép kiểm tra xem `Predicate` chỉ định có khớp với Stream hay không. Tất cả các thao tác khớp đều là **thao tác kết thúc (terminal operation)** và trả về giá trị kiểu `boolean`.

```java
        // Kiểm thử thao tác Match (khớp điều kiện)
        boolean anyStartsWithA =
                stringList
                        .stream()
                        .anyMatch((s) -> s.startsWith("a"));
        System.out.println(anyStartsWithA);      // true

        boolean allStartsWithA =
                stringList
                        .stream()
                        .allMatch((s) -> s.startsWith("a"));

        System.out.println(allStartsWithA);      // false

        boolean noneStartsWithZ =
                stringList
                        .stream()
                        .noneMatch((s) -> s.startsWith("z"));

        System.out.println(noneStartsWithZ);      // true
```

### Count (Đếm)

Đếm là một **thao tác kết thúc (terminal operation)**, trả về số lượng phần tử trong Stream; **kiểu giá trị trả về là `long`**.

```java
      // Kiểm thử thao tác Count (đếm)
        long startsWithB =
                stringList
                        .stream()
                        .filter((s) -> s.startsWith("b"))
                        .count();
        System.out.println(startsWithB);    // 3
```

### Reduce (Rút gọn / Quy ước)

Đây là một **thao tác kết thúc (terminal operation)** cho phép rút gọn nhiều phần tử trong Stream thành một phần tử duy nhất thông qua hàm chỉ định; kết quả sau khi rút gọn được biểu diễn qua interface `Optional`:

```java
        // Kiểm thử thao tác Reduce (rút gọn)
        Optional<String> reduced =
                stringList
                        .stream()
                        .sorted()
                        .reduce((s1, s2) -> s1 + "#" + s2);

        reduced.ifPresent(System.out::println);//aaa1#aaa2#bbb1#bbb2#bbb3#ccc#ddd1#ddd2
```

**Ghi chú của người dịch:** Tác dụng chính của phương thức này là kết hợp các phần tử của Stream lại với nhau. Nó cung cấp một giá trị khởi tạo (seed), rồi dựa theo quy tắc tính toán (`BinaryOperator`) để lần lượt kết hợp với phần tử thứ nhất, thứ hai, ..., thứ n của Stream. Theo nghĩa đó, nối chuỗi hay tính `sum`, `min`, `max`, `average` đều là những trường hợp đặc biệt của `reduce`. Ví dụ, phép tính tổng `sum` của Stream tương đương với `Integer sum = integers.reduce(0, (a, b) -> a+b);`. Cũng có trường hợp không có giá trị khởi tạo: lúc này nó sẽ kết hợp hai phần tử đầu tiên của Stream và kiểu trả về sẽ là `Optional`.

```java
// Nối chuỗi, concat = "ABCD"
String concat = Stream.of("A", "B", "C", "D").reduce("", String::concat);
// Tìm giá trị nhỏ nhất, minValue = -3.0
double minValue = Stream.of(-1.5, 1.0, -3.0, -2.0).reduce(Double.MAX_VALUE, Double::min);
// Tính tổng có giá trị khởi tạo, sumValue = 10
int sumValue = Stream.of(1, 2, 3, 4).reduce(0, Integer::sum);
// Tính tổng không có giá trị khởi tạo, sumValue = 10
sumValue = Stream.of(1, 2, 3, 4).reduce(Integer::sum).get();
// Lọc và nối chuỗi, concat = "ace"
concat = Stream.of("a", "B", "c", "D", "e", "F").
 filter(x -> x.compareTo("Z") > 0).
 reduce("", String::concat);
```

Ở đoạn code trên, chẳng hạn trong ví dụ `reduce()` đầu tiên, tham số thứ nhất (chuỗi rỗng) chính là giá trị khởi tạo, còn tham số thứ hai (`String::concat`) là `BinaryOperator`. Những lời gọi `reduce()` có giá trị khởi tạo như vậy đều trả về một đối tượng cụ thể. Còn với ví dụ thứ tư không có giá trị khởi tạo, vì có thể không đủ phần tử nên giá trị trả về là `Optional` — hãy lưu ý sự khác biệt này. Xem thêm nội dung chi tiết tại: [IBM: Giải thích chi tiết về Streams API trong Java 8](https://www.ibm.com/developerworks/cn/java/j-lo-java8streamapi/index.html)

## Parallel Streams (Luồng song song)

Như đã đề cập trước đó, Stream có hai dạng là tuần tự (sequential) và song song (parallel). Các thao tác trên Stream tuần tự được hoàn thành lần lượt trong một Thread duy nhất, trong khi Parallel Stream sẽ thực thi đồng thời trên nhiều Thread.

Ví dụ dưới đây minh họa cách tăng hiệu năng bằng Parallel Stream:

Đầu tiên chúng ta tạo một danh sách lớn không chứa phần tử trùng lặp:

```java
int max = 1000000;
List<String> values = new ArrayList<>(max);
for (int i = 0; i < max; i++) {
    UUID uuid = UUID.randomUUID();
    values.add(uuid.toString());
}
```

Chúng ta lần lượt sắp xếp danh sách này theo hai cách tuần tự và song song, cuối cùng so sánh thời gian tiêu tốn.

### Sequential Sort (Sắp xếp tuần tự)

```java
// Sắp xếp tuần tự
long t0 = System.nanoTime();
long count = Arrays.stream(list.stream().sorted().toArray()).count();
System.out.println(count);

long t1 = System.nanoTime();

long millis = TimeUnit.NANOSECONDS.toMillis(t1 - t0);
System.out.println(String.format("sequential sort took: %d ms", millis));
```

```plain
1000000
sequential sort took: 709 ms // Thời gian thực hiện sắp xếp tuần tự
```

### Parallel Sort (Sắp xếp song song)

```java
// Sắp xếp song song
long t0 = System.nanoTime();

long count = Arrays.stream(list.parallelStream().sorted().toArray()).count();
System.out.println(count);

long t1 = System.nanoTime();

long millis = TimeUnit.NANOSECONDS.toMillis(t1 - t0);
System.out.println(String.format("parallel sort took: %d ms", millis));

```

```java
1000000
parallel sort took: 475 ms // Thời gian thực hiện sắp xếp song song
```

Hai đoạn code trên gần như giống hệt nhau, nhưng phiên bản song song nhanh hơn khoảng 50%; thay đổi duy nhất cần làm là đổi `stream()` thành `parallelStream()`.

## Maps

Như đã nhắc ở phần trước, kiểu `Map` không hỗ trợ trực tiếp Stream, nhưng `Map` cung cấp một số phương thức mới hữu ích để xử lý các tác vụ thường ngày. Bản thân interface `Map` không có sẵn phương thức `stream()`, nhưng bạn có thể tạo luồng chuyên biệt trên key hoặc value thông qua `map.keySet().stream()`, `map.values().stream()` và `map.entrySet().stream()`.

Ngoài ra, `Map` hỗ trợ nhiều phương thức mới và hữu ích để thực hiện các tác vụ phổ biến.

```java
Map<Integer, String> map = new HashMap<>();

for (int i = 0; i < 10; i++) {
    map.putIfAbsent(i, "val" + i);
}

map.forEach((id, val) -> System.out.println(val));//val0 val1 val2 val3 val4 val5 val6 val7 val8 val9
```

`putIfAbsent` giúp chúng ta không phải viết thêm code kiểm tra `null`; `forEach` nhận một consumer để thao tác trên từng phần tử trong map.

Ví dụ này cho thấy cách dùng hàm để tính toán giá trị trên map:

```java
map.computeIfPresent(3, (num, val) -> val + num);
map.get(3);             // val33

map.computeIfPresent(9, (num, val) -> null);
map.containsKey(9);     // false

map.computeIfAbsent(23, num -> "val" + num);
map.containsKey(23);    // true

map.computeIfAbsent(3, num -> "bam");
map.get(3);             // val33
```

Tiếp theo minh họa cách xóa một mục trong `Map` khi cả key và value đều khớp:

```java
map.remove(3, "val3");
map.get(3);             // val33
map.remove(3, "val33");
map.get(3);             // null
```

Một phương thức hữu ích khác:

```java
map.getOrDefault(42, "not found");  // not found
```

Việc gộp các phần tử trong `Map` cũng trở nên rất dễ dàng:

```java
map.merge(9, "val9", (value, newValue) -> value.concat(newValue));
map.get(9);             // val9
map.merge(9, "concat", (value, newValue) -> value.concat(newValue));
map.get(9);             // val9concat
```

Tác dụng của `merge` là nếu tên key chưa tồn tại thì chèn vào, ngược lại sẽ thực hiện thao tác gộp trên giá trị cũ tương ứng với key đó rồi cập nhật lại vào map.

## Date API (API liên quan đến ngày giờ)

Java 8 bổ sung một API ngày và giờ hoàn toàn mới trong gói `java.time`. Date API mới tương tự với thư viện Joda-Time, nhưng chúng không giống nhau hoàn toàn. Các ví dụ sau bao quát những phần quan trọng nhất của API mới này. Người dịch đã tham khảo các sách liên quan để chỉnh sửa phần lớn nội dung mục này.

**Ghi chú của người dịch (Tóm tắt):**

- Lớp `Clock` cung cấp các phương thức truy cập ngày và giờ hiện tại. `Clock` có nhận biết múi giờ (timezone-aware) và có thể dùng để lấy số mili-giây hiện tại. Một thời điểm cụ thể cũng có thể biểu diễn bằng lớp `Instant`, và lớp `Instant` cũng có thể dùng để tạo đối tượng `java.util.Date` phiên bản cũ.

- Trong API mới, múi giờ được biểu diễn bằng `ZoneId`. Có thể lấy múi giờ rất thuận tiện thông qua phương thức tĩnh `of`. Lớp trừu tượng `ZoneId` (trong gói `java.time`) đại diện cho một mã định danh vùng (zone identifier). Nó có phương thức tĩnh tên `getAvailableZoneIds` trả về toàn bộ các mã định danh vùng.

- JDK 1.8 bổ sung các lớp như `LocalDate` và `LocalDateTime` để xử lý ngày tháng, đồng thời giới thiệu lớp mới `DateTimeFormatter` để giải quyết bài toán định dạng ngày giờ. Có thể dùng `Instant` thay cho `Date`, `LocalDateTime` thay cho `Calendar`, và `DateTimeFormatter` thay cho `SimpleDateFormat`.

### Clock

Lớp `Clock` cung cấp các phương thức truy cập ngày và giờ hiện tại. `Clock` có nhận biết múi giờ và có thể dùng để lấy số mili-giây hiện tại. Một thời điểm cụ thể cũng có thể biểu diễn bằng lớp `Instant`, và lớp `Instant` cũng có thể dùng để tạo đối tượng `java.util.Date` phiên bản cũ.

```java
Clock clock = Clock.systemDefaultZone();
long millis = clock.millis();
System.out.println(millis);//1552379579043
Instant instant = clock.instant();
System.out.println(instant);
Date legacyDate = Date.from(instant); //2019-03-12T08:46:42.588Z
System.out.println(legacyDate);//Tue Mar 12 16:32:59 CST 2019
```

### Timezones (Múi giờ)

Trong API mới, múi giờ được biểu diễn bằng `ZoneId`. Có thể lấy múi giờ rất thuận tiện thông qua phương thức tĩnh `of`. Lớp trừu tượng `ZoneId` (trong gói `java.time`) đại diện cho một mã định danh vùng. Nó có phương thức tĩnh tên `getAvailableZoneIds` trả về toàn bộ các mã định danh vùng.

```java
// In ra tất cả mã định danh vùng
System.out.println(ZoneId.getAvailableZoneIds());

ZoneId zone1 = ZoneId.of("Europe/Berlin");
ZoneId zone2 = ZoneId.of("Brazil/East");
System.out.println(zone1.getRules());// ZoneRules[currentStandardOffset=+01:00]
System.out.println(zone2.getRules());// ZoneRules[currentStandardOffset=-03:00]
```

### LocalTime (Giờ địa phương)

`LocalTime` định nghĩa một thời gian không chứa thông tin múi giờ, ví dụ 10 giờ tối hoặc 17:30:15. Ví dụ dưới đây sử dụng các múi giờ vừa tạo ở đoạn code trước để tạo ra hai thời gian địa phương, sau đó so sánh và tính khoảng chênh lệch giữa hai thời gian theo đơn vị giờ và phút:

```java
LocalTime now1 = LocalTime.now(zone1);
LocalTime now2 = LocalTime.now(zone2);
System.out.println(now1.isBefore(now2));  // false

long hoursBetween = ChronoUnit.HOURS.between(now1, now2);
long minutesBetween = ChronoUnit.MINUTES.between(now1, now2);

System.out.println(hoursBetween);       // -3
System.out.println(minutesBetween);     // -239
```

`LocalTime` cung cấp nhiều phương thức factory để đơn giản hóa việc tạo đối tượng, bao gồm cả việc phân tích (parse) chuỗi thời gian.

```java
LocalTime late = LocalTime.of(23, 59, 59);
System.out.println(late);       // 23:59:59
DateTimeFormatter germanFormatter =
    DateTimeFormatter
        .ofLocalizedTime(FormatStyle.SHORT)
        .withLocale(Locale.GERMAN);

LocalTime leetTime = LocalTime.parse("13:37", germanFormatter);
System.out.println(leetTime);   // 13:37
```

### LocalDate (Ngày địa phương)

`LocalDate` biểu diễn một ngày xác định, ví dụ `2014-03-11`. Giá trị của đối tượng này là bất biến (immutable), cách sử dụng cơ bản giống với `LocalTime`. Ví dụ dưới đây minh họa cách cộng trừ ngày/tháng/năm cho đối tượng ngày. Ngoài ra cần lưu ý các đối tượng này là bất biến, mọi thao tác luôn trả về một thực thể (instance) mới.

```java
LocalDate today = LocalDate.now();// Lấy ngày hiện tại
System.out.println("今天的日期: "+today);//2019-03-12
LocalDate tomorrow = today.plus(1, ChronoUnit.DAYS);
System.out.println("明天的日期: "+tomorrow);//2019-03-13
LocalDate yesterday = tomorrow.minusDays(2);
System.out.println("昨天的日期: "+yesterday);//2019-03-11
LocalDate independenceDay = LocalDate.of(2019, Month.MARCH, 12);
DayOfWeek dayOfWeek = independenceDay.getDayOfWeek();
System.out.println("今天是周几:"+dayOfWeek);//TUESDAY
```

Phân tích kiểu `LocalDate` từ chuỗi cũng đơn giản như phân tích `LocalTime`. Dưới đây là ví dụ sử dụng `DateTimeFormatter` để phân tích chuỗi:

```java
    String str1 = "2014==04==12 01时06分09秒";
        // Định nghĩa formatter tương ứng với chuỗi ngày, giờ cần phân tích
        DateTimeFormatter fomatter1 = DateTimeFormatter
                .ofPattern("yyyy==MM==dd HH时mm分ss秒");

        LocalDateTime dt1 = LocalDateTime.parse(str1, fomatter1);
        System.out.println(dt1); // Kết quả: 2014-04-12T01:06:09

        String str2 = "2014$$$四月$$$13 20小时";
        DateTimeFormatter fomatter2 = DateTimeFormatter
                .ofPattern("yyy$$$MMM$$$dd HH小时");
        LocalDateTime dt2 = LocalDateTime.parse(str2, fomatter2);
        System.out.println(dt2); // Kết quả: 2014-04-13T20:00

```

Hãy xem thêm một ví dụ định dạng ngày bằng `DateTimeFormatter`:

```java
LocalDateTime rightNow=LocalDateTime.now();
String date=DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(rightNow);
System.out.println(date);//2019-03-12T16:26:48.29
DateTimeFormatter formatter=DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
System.out.println(formatter.format(rightNow));//2019-03-12 16:26:48
```

**🐛 Sửa lỗi (xem: [issue#1157](https://github.com/Snailclimb/JavaGuide/issues/1157))**: Khi dùng `YYYY` để hiển thị năm, nó sẽ hiển thị năm của tuần chứa thời điểm hiện tại (week-based year), gây ra sai lệch vào tuần giao thừa giữa hai năm. Thông thường luôn phải dùng `yyyy` để hiển thị năm chính xác.

Ví dụ lỗi hiển thị ngày do tuần vắt qua năm mới:

```java
LocalDateTime rightNow = LocalDateTime.of(2020, 12, 31, 12, 0, 0);
String date= DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(rightNow);
// 2020-12-31T12:00:00
System.out.println(date);
DateTimeFormatter formatterOfYYYY = DateTimeFormatter.ofPattern("YYYY-MM-dd HH:mm:ss");
// 2021-12-31 12:00:00
System.out.println(formatterOfYYYY.format(rightNow));

DateTimeFormatter formatterOfYyyy = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
// 2020-12-31 12:00:00
System.out.println(formatterOfYyyy.format(rightNow));
```

Từ hình dưới đây có thể thấy rõ lỗi cụ thể hơn, và IntelliJ IDEA cũng đã gợi ý thông minh rằng nên ưu tiên dùng `yyyy` thay vì `YYYY`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/2021042717491413-86c79fbc.png)

### LocalDateTime (Ngày giờ địa phương)

`LocalDateTime` biểu diễn đồng thời cả thời gian và ngày tháng, tương đương với việc gộp nội dung của hai phần trước vào cùng một đối tượng. Giống như `LocalTime` và `LocalDate`, `LocalDateTime` là bất biến (immutable). `LocalDateTime` cung cấp một số phương thức để truy cập các trường cụ thể.

```java
LocalDateTime sylvester = LocalDateTime.of(2014, Month.DECEMBER, 31, 23, 59, 59);

DayOfWeek dayOfWeek = sylvester.getDayOfWeek();
System.out.println(dayOfWeek);      // WEDNESDAY

Month month = sylvester.getMonth();
System.out.println(month);          // DECEMBER

long minuteOfDay = sylvester.getLong(ChronoField.MINUTE_OF_DAY);
System.out.println(minuteOfDay);    // 1439
```

Chỉ cần gắn thêm thông tin múi giờ, ta có thể chuyển đổi nó thành một đối tượng điểm thời gian `Instant`, và đối tượng `Instant` có thể dễ dàng chuyển đổi sang kiểu `java.util.Date` cũ.

```java
Instant instant = sylvester
        .atZone(ZoneId.systemDefault())
        .toInstant();

Date legacyDate = Date.from(instant);
System.out.println(legacyDate);     // Wed Dec 31 23:59:59 CET 2014
```

Định dạng `LocalDateTime` cũng giống như định dạng thời gian và ngày tháng; ngoài việc dùng các định dạng được định nghĩa sẵn, chúng ta cũng có thể tự định nghĩa định dạng riêng:

```java
DateTimeFormatter formatter =
    DateTimeFormatter
        .ofPattern("MMM dd, yyyy - HH:mm");
LocalDateTime parsed = LocalDateTime.parse("Nov 03, 2014 - 07:13", formatter);
String string = formatter.format(parsed);
System.out.println(string);     // Nov 03, 2014 - 07:13
```

Khác với `java.text.NumberFormat`, phiên bản mới `DateTimeFormatter` là bất biến (immutable), do đó nó an toàn luồng (thread-safe).
Thông tin chi tiết về các định dạng ngày giờ xem [tại đây](https://docs.oracle.com/javase/8/docs/api/java/time/format/DateTimeFormatter.html).

## Annotations (Chú thích)

Trong Java 8 đã hỗ trợ đa annotation (repeatable annotations); trước tiên hãy xem một ví dụ để hiểu ý nghĩa của nó.
Đầu tiên định nghĩa một annotation bọc ngoài `Hints` dùng để chứa một tập các annotation `Hint` cụ thể:

```java
@Retention(RetentionPolicy.RUNTIME)
@interface Hints {
    Hint[] value();
}
@Repeatable(Hints.class)
@interface Hint {
    String value();
}
```

Java 8 cho phép chúng ta sử dụng cùng một loại annotation nhiều lần, chỉ cần gắn `@Repeatable` cho annotation đó là được.

Ví dụ 1: Dùng lớp bọc làm container để lưu nhiều annotation (cách cũ)

```java
@Hints({@Hint("hint1"), @Hint("hint2")})
class Person {}
```

Ví dụ 2: Dùng đa annotation (cách mới)

```java
@Hint("hint1")
@Hint("hint2")
class Person {}
```

Trong ví dụ thứ hai, trình biên dịch Java sẽ ngầm định nghĩa sẵn annotation `@Hints` giúp bạn; hiểu điều này sẽ giúp ích khi bạn dùng Reflection để lấy các thông tin này:

```java
Hint hint = Person.class.getAnnotation(Hint.class);
System.out.println(hint);                   // null
Hints hints1 = Person.class.getAnnotation(Hints.class);
System.out.println(hints1.value().length);  // 2

Hint[] hints2 = Person.class.getAnnotationsByType(Hint.class);
System.out.println(hints2.length);          // 2
```

Ngay cả khi chúng ta không khai báo annotation `@Hints` trên lớp `Person`, ta vẫn có thể lấy được annotation `@Hints` thông qua `getAnnotation(Hints.class)`; phương thức thuận tiện hơn là sử dụng `getAnnotationsByType` để lấy trực tiếp toàn bộ các annotation `@Hint`.
Ngoài ra, annotation trong Java 8 còn mở rộng thêm hai target mới:

```java
@Target({ElementType.TYPE_PARAMETER, ElementType.TYPE_USE})
@interface MyAnnotation {}
```

## Where to go from here?

Phần giới thiệu về các tính năng mới của Java 8 xin tạm dừng tại đây; chắc chắn vẫn còn nhiều tính năng khác đang chờ được khám phá. Trong JDK 1.8 còn rất nhiều thứ hữu ích khác, ví dụ như `Arrays.parallelSort`, `StampedLock` và `CompletableFuture`, v.v.
