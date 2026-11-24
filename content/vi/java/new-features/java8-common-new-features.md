---
title: Thực hành các tính năng mới của Java 8
description: Hướng dẫn thực hành các tính năng mới cốt lõi của Java 8, bao gồm biểu thức Lambda, Stream API, Optional, Date-Time API và phương thức mặc định trong interface.
category: Java
tag:
  - Tính năng mới của Java
lang: vi
sourceRef: zh-ref/java/new-features/java8-common-new-features.md
head:
  - - meta
    - name: keywords
      content: Java 8,Lambda,Stream API,Optional,Date/Time API,Default Method,Functional Interface
---

> Bài viết này được đóng góp bởi [cowbi](https://github.com/cowbi).

<!-- markdownlint-disable MD024 -->

JDK 8 được phát hành vào ngày 18 tháng 3 năm 2014. Đây là một phiên bản LTS (Long-Term Support — hỗ trợ dài hạn) và cũng là một trong những phiên bản được sử dụng rộng rãi lâu dài nhất trong hệ sinh thái Java. Các phiên bản LTS hiện được Oracle liệt kê bao gồm JDK 8, JDK 11, JDK 17, JDK 21 và JDK 25.

JDK 8 đã giới thiệu nhiều tính năng mới quan trọng; bài viết này sẽ chọn lọc một số tính năng tiêu biểu để giới thiệu chi tiết:

- Biểu thức Lambda (Lambda Expression)
- Stream API
- Lớp `Optional`
- Date-Time API
- Phương thức mặc định trong interface (`default` method)
- Functional Interface (interface hàm)

Hình dưới đây minh họa số lượng tính năng mới và thời điểm phát hành của từng phiên bản từ JDK 8 đến JDK 24:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

Oracle phát hành Java 8 (JDK 1.8) vào năm 2014, và kể từ đó phiên bản này được sử dụng rộng rãi lâu dài trong hệ sinh thái Java. Nhiều lập trình viên vẫn chưa nắm rõ hết một số tính năng mới của nó, đặc biệt là những người đã quen với các phiên bản trước Java 8, chẳng hạn như tôi.

Để không bị tụt lại quá xa, việc tổng hợp và hệ thống lại các tính năng mới này là rất cần thiết. So với JDK 7, Java 8 có rất nhiều thay đổi cũng như tối ưu hóa — ví dụ, trong `interface` có thể chứa phương thức `static` kèm phần thân hàm (method body), điều này đã phá vỡ quan niệm trước đây; cấu trúc dữ liệu của `java.util.HashMap` được bổ sung Cây đỏ-đen (Red-Black Tree); ngoài ra còn có biểu thức Lambda nổi tiếng, v.v. Bài viết này không thể chia sẻ hết toàn bộ các tính năng mới, mà chỉ liệt kê những tính năng thường dùng để giải thích chi tiết. Để biết thêm thông tin liên quan, vui lòng xem [giới thiệu chính thức về các tính năng mới của Java 8](https://www.oracle.com/java/technologies/javase/8-whats-new.html).

## Interface

Mục đích thiết kế ban đầu của `interface` là hướng tới tính trừu tượng và nâng cao khả năng mở rộng. Điều này cũng để lại một hạn chế: mỗi khi `interface` thay đổi, các lớp triển khai (implement) nó cũng bắt buộc phải sửa theo.

Để giải quyết vấn đề không tương thích giữa việc sửa đổi `interface` với các lớp triển khai hiện có, phương thức trong `interface` mới có thể được bổ sung modifier `default` hoặc `static`, nhờ đó có thể có phần thân phương thức, và lớp triển khai không bắt buộc phải ghi đè (`Override`) phương thức này.

Một `interface` có thể có nhiều phương thức được khai báo với các modifier này. Sự khác biệt giữa 2 modifier này chủ yếu cũng giống như sự khác biệt giữa phương thức thông thường (instance method) và phương thức tĩnh (static method):

1. Phương thức được khai báo với `default` là phương thức instance thông thường, có thể gọi bằng `this`, và có thể được lớp con kế thừa, ghi đè (`Override`).
2. Phương thức được khai báo với `static` có cách dùng giống phương thức tĩnh ở lớp thông thường. Tuy nhiên, nó không thể được lớp con kế thừa và chỉ có thể gọi thông qua tên `Interface`.

Hãy cùng xem một ví dụ thực tế.

```java
public interface InterfaceNew {
    static void sm() {
        System.out.println("Triển khai do interface cung cấp");
    }
    static void sm2() {
        System.out.println("Triển khai do interface cung cấp");
    }

    default void def() {
        System.out.println("Phương thức default của interface");
    }
    default void def2() {
        System.out.println("Phương thức default2 của interface");
    }
    // Lớp triển khai bắt buộc phải ghi đè (override)
    void f();
}

public interface InterfaceNew1 {
    default void def() {
        System.out.println("Phương thức default của InterfaceNew1");
    }
}
```

Nếu một lớp vừa triển khai interface `InterfaceNew` vừa triển khai interface `InterfaceNew1`, cả hai đều có phương thức `def()`, và giữa `InterfaceNew` với `InterfaceNew1` không có quan hệ kế thừa thì lúc này bắt buộc phải ghi đè (`Override`) `def()`. Nếu không, quá trình biên dịch sẽ báo lỗi.

```java
public class InterfaceNewImpl implements InterfaceNew , InterfaceNew1{
    public static void main(String[] args) {
        InterfaceNewImpl interfaceNew = new InterfaceNewImpl();
        interfaceNew.def();
    }

    @Override
    public void def() {
        InterfaceNew1.super.def();
    }

    @Override
    public void f() {
    }
}
```

**Trong Java 8, `interface` và `abstract class` có gì khác nhau?**

Nhiều bạn nghĩ rằng: "Vì `interface` giờ cũng có thể tự cài đặt phương thức riêng rồi, nên có vẻ không khác gì mấy so với `abstract class`."

Thực chất chúng vẫn có sự khác biệt:

1. Sự khác biệt giữa `interface` và `class` — nghe có vẻ hiển nhiên — chủ yếu gồm:

   - Một lớp có thể triển khai nhiều interface, nhưng chỉ kế thừa đơn một lớp.
   - Các phương thức instance không có phần thân trong `interface` ngầm định là `public abstract`, còn trường dữ liệu (field) ngầm định là `public static final`; ngoài ra, `interface` còn có thể khai báo phương thức `default`, `static`, v.v. Thành viên của `abstract class` có thể sử dụng nhiều modifier đa dạng hơn.

2. Phương thức của `interface` giống như một plugin mở rộng hơn, trong khi phương thức của `abstract class` sinh ra để được kế thừa.

Như đã đề cập ở đầu bài, `interface` bổ sung phương thức `default` và `static` nhằm giải quyết vấn đề không tương thích khi thay đổi interface đối với các lớp triển khai sẵn có, chứ không phải để thay thế `abstract class`. Khi sử dụng thực tế, chỗ nào cần dùng `abstract class` thì vẫn phải dùng `abstract class`, đừng vì tính năng mới của `interface` mà thay thế nó.

**Hãy nhớ rằng `interface` mãi mãi khác với `class`.**

## Functional Interface (Interface hàm)

**Định nghĩa**: Còn gọi là SAM interface, tức Single Abstract Method interface — là interface chỉ có duy nhất một phương thức trừu tượng, nhưng có thể có nhiều phương thức không trừu tượng.

Trong Java 8 có một package dành riêng cho các functional interface là `java.util.function`; toàn bộ các interface trong package này đều có annotation `@FunctionalInterface` để phục vụ lập trình hàm.

Ở các package khác cũng có các functional interface; một số trong đó không gắn `@FunctionalInterface`, nhưng chỉ cần thỏa mãn định nghĩa của functional interface thì nó vẫn là functional interface, không phụ thuộc vào việc có annotation `@FunctionalInterface` hay không — annotation chỉ có tác dụng ép buộc kiểm tra định nghĩa tại thời điểm biên dịch. Nó được ứng dụng rất rộng rãi trong biểu thức Lambda.

## Biểu thức Lambda

Tiếp theo hãy nói về biểu thức Lambda nổi tiếng. Đây là tính năng mới quan trọng nhất thúc đẩy sự ra đời của Java 8, và là thay đổi lớn nhất kể từ `Generics` và `Annotation`.

Sử dụng biểu thức Lambda giúp mã nguồn trở nên ngắn gọn và súc tích hơn nhiều, giúp Java cũng hỗ trợ *lập trình hàm* (functional programming) đơn giản.

> Biểu thức Lambda là một hàm ẩn danh; Java 8 cho phép truyền hàm vào phương thức như một tham số.

### Cú pháp

```java
(parameters) -> expression hoặc
(parameters) ->{ statements; }
```

### Thực hành Lambda

Hãy dùng các ví dụ thực tế phổ biến để cảm nhận sự tiện lợi mà Lambda mang lại.

#### Thay thế lớp nội danh ẩn danh (Anonymous Inner Class)

Trước đây, cách duy nhất để truyền tham số động (hành vi) vào phương thức là dùng lớp nội danh (inner class). Ví dụ:

**1. Interface `Runnable`**

```java
new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("The runable now is using!");
            }
}).start();
// Dùng lambda
new Thread(() -> System.out.println("It's a lambda function!")).start();
```

**2. Interface `Comparator`**

```java
List<Integer> strings = Arrays.asList(1, 2, 3);

Collections.sort(strings, new Comparator<Integer>() {
@Override
public int compare(Integer o1, Integer o2) {
    return Integer.compare(o1, o2);}
});

// Lambda
Collections.sort(strings, (Integer o1, Integer o2) -> Integer.compare(o1, o2));
// Tách riêng ra
Comparator<Integer> comparator = (Integer o1, Integer o2) -> Integer.compare(o1, o2);
Collections.sort(strings, comparator);
```

**3. Interface `Listener`**

```java
JButton button = new JButton();
button.addItemListener(new ItemListener() {
@Override
public void itemStateChanged(ItemEvent e) {
   e.getItem();
}
});
// lambda
button.addItemListener(e -> e.getItem());
```

**4. Interface tự định nghĩa**

Ba ví dụ trên là những trường hợp thường gặp nhất trong quá trình phát triển, qua đó cũng thấy được sự tiện lợi và gọn gàng mà Lambda mang lại. Nó chỉ giữ lại phần mã thực sự dùng đến, lược bỏ toàn bộ phần mã dư thừa. Vậy nó có yêu cầu gì đối với interface không? Chúng ta nhận thấy các lớp nội danh ẩn danh này chỉ ghi đè (`Override`) đúng một phương thức của interface — đương nhiên cũng chỉ có đúng một phương thức cần ghi đè. Đó chính là **Functional Interface** đã nhắc ở trên; nói cách khác, chỉ cần tham số của phương thức là một Functional Interface thì đều có thể dùng biểu thức Lambda.

```java
@FunctionalInterface
public interface Comparator<T>{
    int compare(T o1, T o2);
}

@FunctionalInterface
public interface Runnable{
    void run();
}
```

Chúng ta tự định nghĩa một Functional Interface:

```java
@FunctionalInterface
public interface LambdaInterface {
 void f();
}
// Cách sử dụng
public class LambdaClass {
    public static void forEg() {
        lambdaInterfaceDemo(()-> System.out.println("Functional Interface tự định nghĩa"));
    }
    // Tham số là Functional Interface
    static void lambdaInterfaceDemo(LambdaInterface i){
        i.f();
    }
}
```

#### Duyệt Collection

```java
void lamndaFor() {
        List<String> strings = Arrays.asList("1", "2", "3");
        // foreach truyền thống
        for (String s : strings) {
            System.out.println(s);
        }
        // Lambda foreach
        strings.forEach((s) -> System.out.println(s));
        // hoặc
        strings.forEach(System.out::println);
     // map
        Map<Integer, String> map = new HashMap<>();
        map.forEach((k,v)->System.out.println(v));
}
```

#### Tham chiếu phương thức (Method Reference)

Java 8 cho phép dùng từ khóa `::` để truyền tham chiếu tới phương thức hoặc hàm khởi tạo (constructor); trong mọi trường hợp, kiểu trả về của biểu thức phải là một functional-interface.

```java
public class LambdaClassSuper {
    LambdaInterface sf(){
        return null;
    }
}

public class LambdaClass extends LambdaClassSuper {
    public static LambdaInterface staticF() {
        return null;
    }

    public LambdaInterface f() {
        return null;
    }

    void show() {
        // 1. Gọi hàm static, kiểu trả về phải là functional-interface
        LambdaInterface t = LambdaClass::staticF;

        // 2. Gọi phương thức instance
        LambdaClass lambdaClass = new LambdaClass();
        LambdaInterface lambdaInterface = lambdaClass::f;

        // 3. Gọi phương thức trên lớp cha
        LambdaInterface superf = super::sf;

        // 4. Gọi constructor
        LambdaInterface tt = LambdaClassSuper::new;
    }
}
```

#### Truy cập biến

```java
int i = 0;
Collections.sort(strings, (Integer o1, Integer o2) -> o1 - i);
// i =3;
```

Biểu thức Lambda có thể tham chiếu tới biến cục bộ bên ngoài, nhưng biến đó phải là `final` hoặc effectively final (không gán lại giá trị sau khi khởi tạo). Trình biên dịch sẽ không tự động thêm từ khóa `final` cho biến.

## Stream

Java bổ sung package `java.util.stream`; nó khá tương đồng về tên gọi với khái niệm stream trước đây nhưng khác về bản chất. Trước đây, thứ ta tiếp xúc nhiều nhất là stream tài nguyên, chẳng hạn `java.io.FileInputStream`, dùng stream để chuyển dữ liệu tệp từ nơi này sang nơi khác — nó chỉ là công cụ vận chuyển nội dung, không thực hiện bất kỳ thao tác *CRUD* nào lên nội dung tệp.

`Stream` vẫn không lưu trữ dữ liệu, điểm khác biệt là nó có thể truy xuất (Retrieve) và xử lý logic trên dữ liệu của collection, bao gồm lọc, sắp xếp, thống kê, đếm, v.v. Có thể hình dung nó giống như câu lệnh SQL.

Dữ liệu nguồn của nó có thể là `Collection`, `Array`, v.v. Vì tham số phương thức của nó đều là kiểu Functional Interface nên thường được kết hợp cùng Lambda.

### Các loại Stream

1. `stream`: luồng tuần tự (sequential stream)
2. `parallelStream`: luồng song song (parallel stream), có thể thực thi đa luồng (multi-threaded)

### Các phương thức thường dùng

Tiếp theo chúng ta xem các phương thức thường dùng của `java.util.stream.Stream`:

```java
/**
* Trả về một sequential stream (luồng tuần tự)
*/
default Stream<E> stream()

/**
* Trả về một parallel stream (luồng song song)
*/
default Stream<E> parallelStream()

/**
* Trả về stream chứa phần tử T
*/
public static<T> Stream<T> of(T t)

/**
* Trả về một stream tuần tự có các phần tử là những giá trị được chỉ định.
*/
public static<T> Stream<T> of(T... values) {
    return Arrays.stream(values);
}


/**
* Lọc, trả về stream gồm các phần tử của stream này khớp với predicate đã cho
*/
Stream<T> filter(Predicate<? super T> predicate);

/**
* Kiểm tra xem tất cả phần tử của stream này có khớp với predicate được cung cấp hay không.
*/
boolean allMatch(Predicate<? super T> predicate)

/**
* Kiểm tra xem có bất kỳ phần tử nào của stream này khớp với predicate được cung cấp hay không.
*/
boolean anyMatch(Predicate<? super T> predicate);

/**
* Trả về một Builder cho Stream.
*/
public static<T> Builder<T> builder();

/**
* Dùng Collector để thu gọn/gom nhóm các phần tử của stream này
*/
<R, A> R collect(Collector<? super T, A, R> collector);

/**
 * Trả về số lượng phần tử trong stream này.
*/
long count();

/**
* Trả về stream gồm các phần tử khác nhau (dựa theo Object.equals(Object)) của stream này.
*/
Stream<T> distinct();

/**
 * Duyệt qua từng phần tử
*/
void forEach(Consumer<? super T> action);

/**
* Dùng để lấy stream có số lượng phần tử chỉ định, độ dài cắt ngắn không vượt quá maxSize.
*/
Stream<T> limit(long maxSize);

/**
* Dùng để ánh xạ từng phần tử sang kết quả tương ứng
*/
<R> Stream<R> map(Function<? super T, ? extends R> mapper);

/**
* Sắp xếp dựa theo Comparator được cung cấp.
*/
Stream<T> sorted(Comparator<? super T> comparator);

/**
* Bỏ qua n phần tử đầu tiên của stream này, trả về stream mới gồm các phần tử còn lại.
*/
Stream<T> skip(long n);

/**
* Trả về một mảng chứa các phần tử của stream này.
*/
Object[] toArray();

/**
* Sử dụng hàm generator được cung cấp để trả về một mảng chứa các phần tử của stream này, nhằm cấp phát mảng trả về cũng như bất kỳ mảng bổ sung nào có thể cần cho việc phân vùng thực thi hoặc thay đổi kích thước.
*/
<A> A[] toArray(IntFunction<A[]> generator);

/**
* Nối hai stream lại với nhau
*/
public static <T> Stream<T> concat(Stream<? extends T> a, Stream<? extends T> b)
```

### Thực hành

Bài viết liệt kê cách dùng các phương thức tiêu biểu của `Stream`; để biết thêm các phương thức khác, bạn vẫn nên xem tài liệu API.

```java
@Test
public void test() {
  List<String> strings = Arrays.asList("abc", "def", "gkh", "abc");
    // Trả về stream thỏa mãn điều kiện
    Stream<String> stringStream = strings.stream().filter(s -> "abc".equals(s));
    // Đếm số lượng phần tử khớp điều kiện trong stream
    long count = stringStream.count();

    // Duyệt forEach -> in ra từng phần tử
    strings.stream().forEach(System.out::println);

    // limit lấy ra stream gồm 1 phần tử
    Stream<String> limit = strings.stream().limit(1);
    // toArray, ví dụ khi muốn xem bên trong limitStream có gì, như chuyển sang String[] hoặc lặp
    String[] array = limit.toArray(String[]::new);

    // map thao tác trên từng phần tử và trả về stream mới
    Stream<String> map = strings.stream().map(s -> s + "22");

    // sorted sắp xếp và in ra
    strings.stream().sorted().forEach(System.out::println);

    // Collectors.collect đưa các phần tử "abc" vào container
    List<String> collect = strings.stream().filter(string -> "abc".equals(string)).collect(Collectors.toList());
    // Chuyển list thành string, các phần tử cách nhau bằng dấu phẩy
    String mergedString = strings.stream().filter(string -> !string.isEmpty()).collect(Collectors.joining(","));

    // Thống kê trên tập hợp số, ví dụ
    List<Integer> number = Arrays.asList(1, 2, 5, 4);

    IntSummaryStatistics statistics = number.stream().mapToInt((x) -> x).summaryStatistics();
    System.out.println("Số lớn nhất trong danh sách : "+statistics.getMax());
    System.out.println("Số nhỏ nhất trong danh sách : "+statistics.getMin());
    System.out.println("Trung bình cộng : "+statistics.getAverage());
    System.out.println("Tổng tất cả các số : "+statistics.getSum());

    // concat nối các stream
    List<String> strings2 = Arrays.asList("xyz", "jqx");
    Stream.concat(strings2.stream(),strings.stream()).count();

    // Lưu ý: Một Stream chỉ có thể thao tác một lần, không thể tách rời rồi dùng lại, nếu không sẽ báo lỗi.
    Stream stream = strings.stream();
    // Lần sử dụng thứ nhất
    stream.limit(2);
    // Lần sử dụng thứ hai
    stream.forEach(System.out::println);
    // Báo lỗi java.lang.IllegalStateException: stream has already been operated upon or closed

    // Có thể gọi liên tiếp trên cùng một pipeline
    strings.stream().limit(2).forEach(System.out::println);
}
```

### Thực thi trễ (Lazy Execution)

Khi gọi các phương thức trả về `Stream`, nó không thực thi ngay lập tức mà đợi đến khi gọi một phương thức trả về kiểu không phải `Stream` mới bắt đầu thực thi. Vì cầm được `Stream` thì chưa dùng trực tiếp ngay được, mà cần xử lý thành một kiểu dữ liệu thông thường. Bạn có thể tưởng tượng `Stream` ở đây giống như luồng nhị phân (tuy là 2 thứ hoàn toàn khác nhau): cầm luồng không thôi cũng không đọc hiểu trực tiếp được.

Dưới đây chúng ta phân tích kỹ phương thức `filter`.

```java
@Test
public void laziness(){
  List<String> strings = Arrays.asList("abc", "def", "gkh", "abc");
  Stream<Integer> stream = strings.stream().filter(new Predicate() {
      @Override
      public boolean test(Object o) {
        System.out.println("Predicate.test thực thi");
        return true;
        }
      });

   System.out.println("count thực thi");
   stream.count();
}
/*-------Kết quả thực thi--------*/
count thực thi
Predicate.test thực thi
Predicate.test thực thi
Predicate.test thực thi
Predicate.test thực thi
```

Theo thứ tự câu lệnh thông thường, lẽ ra phải in 4 lần "`Predicate.test` thực thi", rồi mới in "`count` thực thi". Kết quả thực tế lại hoàn toàn ngược lại. Điều này chứng tỏ phương thức trong `filter` không hề chạy ngay lập tức, mà chỉ chạy sau khi gọi phương thức `count()`.

Các ví dụ trên đều là `Stream` tuần tự. Luồng song song `parallelStream` có cách sử dụng API giống hệt luồng tuần tự. Điểm khác biệt chính là `parallelStream` có thể thực thi đa luồng (multi-threaded), được xây dựng dựa trên framework `ForkJoin` — có thời gian các bạn có thể tìm hiểu thêm về framework `ForkJoin` và `ForkJoinPool`. Ở đây có thể hiểu đơn giản là nó được hiện thực thông qua Thread Pool, nên sẽ liên quan đến các vấn đề như an toàn luồng (`thread-safe`), tiêu tốn tài nguyên thread, v.v. Hãy cùng trải nghiệm quá trình chạy đa luồng của parallel stream qua đoạn code sau.

```java
@Test
public void parallelStreamTest(){
   List<Integer> numbers = Arrays.asList(1, 2, 5, 4);
   numbers.parallelStream() .forEach(num->System.out.println(Thread.currentThread().getName()+">>"+num));
}
// Kết quả thực thi
main>>5
ForkJoinPool.commonPool-worker-2>>4
ForkJoinPool.commonPool-worker-11>>1
ForkJoinPool.commonPool-worker-9>>2
```

Từ kết quả có thể thấy, `forEach` đã sử dụng nhiều thread khác nhau.

### Tổng kết

Từ mã nguồn và ví dụ, chúng ta có thể đúc kết một số đặc điểm của `Stream`:

1. Nhờ lập trình dạng chuỗi (method chaining) đơn giản, giúp dễ dàng xử lý tiếp dữ liệu sau khi duyệt qua.
2. Tham số của các phương thức đều là kiểu Functional Interface.
3. Một `Stream` chỉ được thao tác một lần; thao tác xong thì stream đóng lại, tiếp tục sử dụng lại stream này sẽ báo lỗi.
4. `Stream` không lưu trữ dữ liệu và không làm thay đổi nguồn dữ liệu gốc.

## Optional

Trong [Sổ tay phát triển Java của Alibaba phần giới thiệu về Optional](https://share.weiyun.com/ThuqEbD5) có viết như sau:

> Phòng tránh NPE là phẩm chất cơ bản của lập trình viên; hãy chú ý các tình huống phát sinh NPE:
>
> 1) Khi kiểu trả về là kiểu dữ liệu nguyên thủy (primitive type) mà `return` đối tượng thuộc lớp bao (wrapper class), quá trình tự động mở hộp (`auto-unboxing`) có thể gây ra NPE.
>
> Phản ví dụ: `public int f() { return đối tượng Integer }`, nếu là `null`, auto-unboxing sẽ ném NPE.
>
> 2) Kết quả truy vấn cơ sở dữ liệu có thể là `null`.
>
> 3) Phần tử trong collection dù `isNotEmpty` thì phần tử lấy ra vẫn có thể là `null`.
>
> 4) Khi gọi từ xa (remote call) trả về đối tượng, nhất loạt phải kiểm tra con trỏ null để phòng tránh NPE.
>
> 5) Với dữ liệu lấy từ `Session`, khuyến nghị kiểm tra NPE để tránh lỗi con trỏ null.
>
> 6) Gọi móc xích (chained calls) như `obj.getA().getB().getC()` rất dễ phát sinh NPE.
>
> Ví dụ chuẩn: Sử dụng lớp `Optional` của JDK 8 để phòng tránh vấn đề NPE.

Ở đây khuyến nghị dùng `Optional` để diễn đạt tường minh rằng "có thể không có kết quả", nhằm giảm bớt một phần rủi ro NPE (`java.lang.NullPointerException`). `Optional` hoặc chứa một giá trị khác `null`, hoặc ở trạng thái rỗng, chứ không lưu trữ `null` bên trong. Dưới đây chúng ta từng bước tìm hiểu sâu hơn về `Optional` thông qua mã nguồn của nó.

Giả sử có lớp `Zoo`, bên trong có thuộc tính `Dog`, và yêu cầu là lấy ra `age` của `Dog`.

```java
class Zoo {
   private Dog dog;
}

class Dog {
   private int age;
}
```

Cách truyền thống để phòng tránh NPE như sau:

```java
Zoo zoo = getZoo();
if(zoo != null){
   Dog dog = zoo.getDog();
   if(dog != null){
      int age = dog.getAge();
      System.out.println(age);
   }
}
```

Kiểm tra khác `null` hết tầng này đến tầng khác — có người nói cách viết này xấu xí, thiếu thanh lịch, nhưng tôi lại không nghĩ vậy. Ngược lại tôi thấy rất gọn gàng, dễ đọc, dễ hiểu. Còn các bạn thấy sao?

Với `Optional`, cách viết sẽ như sau:

```java
Optional.ofNullable(zoo).map(o -> o.getDog()).map(d -> d.getAge()).ifPresent(age ->
    System.out.println(age)
);
```

Chẳng phải ngắn gọn hơn rất nhiều sao?

### Cách tạo Optional

Trong ví dụ trên, `Optional.ofNullable` là một trong những cách tạo `Optional`. Trước hết hãy xem ý nghĩa của nó cùng mã nguồn của các phương thức tạo `Optional` khác.

```java
/**
* Common instance for {@code empty()}. Đối tượng EMPTY toàn cục
*/
private static final Optional<?> EMPTY = new Optional<>();

/**
* Giá trị mà Optional quản lý
*/
private final T value;

/**
* Nếu value là null thì trả về EMPTY, ngược lại trả về of(T)
*/
public static <T> Optional<T> ofNullable(T value) {
   return value == null ? empty() : of(value);
}
/**
* Trả về đối tượng EMPTY
*/
public static<T> Optional<T> empty() {
   Optional<T> t = (Optional<T>) EMPTY;
   return t;
}
/**
* Trả về đối tượng Optional
*/
public static <T> Optional<T> of(T value) {
    return new Optional<>(value);
}
/**
* Constructor private, gán giá trị cho value
*/
private Optional(T value) {
  this.value = Objects.requireNonNull(value);
}
/**
* Vì vậy nếu value của of(T value) là null thì sẽ ném ngoại lệ NullPointerException; như vậy dường như vẫn chưa xử lý vấn đề NPE
*/
public static <T> T requireNonNull(T obj) {
  if (obj == null)
         throw new NullPointerException();
  return obj;
}
```

Điểm khác biệt chính giữa phương thức `ofNullable` và `of` là: khi `value` bằng `null`, `ofNullable` trả về một `Optional` rỗng, còn `of` sẽ ném ra `NullPointerException`. Khi `null` mang ý nghĩa hợp lệ là "không có giá trị" thì dùng `ofNullable`; khi tham số theo quy ước bắt buộc phải khác `null` thì có thể dùng `of` để phát hiện lỗi sớm.

**`map()` và `flatMap()` khác nhau như thế nào?**

`map` và `flatMap` đều áp dụng một hàm lên từng phần tử trong collection, nhưng điểm khác biệt là `map` trả về một collection mới chứa kết quả ánh xạ, còn `flatMap` ánh xạ từng phần tử thành một collection/stream rồi sau đó làm phẳng (flatten) các collection đó lại.

Trong các tình huống ứng dụng thực tế, nếu `map` trả về mảng, thì kết quả cuối cùng thu được sẽ là một cấu trúc mảng hai chiều; việc dùng `flatMap` chính là để làm phẳng cấu trúc hai chiều đó thành một mảng/danh sách một chiều.

```java
public class MapAndFlatMapExample {
    public static void main(String[] args) {
        List<String[]> listOfArrays = Arrays.asList(
                new String[]{"apple", "banana", "cherry"},
                new String[]{"orange", "grape", "pear"},
                new String[]{"kiwi", "melon", "pineapple"}
        );

        List<String[]> mapResult = listOfArrays.stream()
                .map(array -> Arrays.stream(array).map(String::toUpperCase).toArray(String[]::new))
                .collect(Collectors.toList());

        System.out.println("Using map:");
        mapResult.forEach(arrays-> System.out.println(Arrays.toString(arrays)));

        List<String> flatMapResult = listOfArrays.stream()
                .flatMap(array -> Arrays.stream(array).map(String::toUpperCase))
                .collect(Collectors.toList());

        System.out.println("Using flatMap:");
        System.out.println(flatMapResult);
    }
}

```

Kết quả chạy:

```plain
Using map:
[[APPLE, BANANA, CHERRY], [ORANGE, GRAPE, PEAR], [KIWI, MELON, PINEAPPLE]]

Using flatMap:
[APPLE, BANANA, CHERRY, ORANGE, GRAPE, PEAR, KIWI, MELON, PINEAPPLE]
```

Cách hiểu đơn giản nhất là `flatMap()` có thể làm phẳng (trải ra) kết quả của `map()`.

Trong `Optional`, khi sử dụng `map()`, nếu hàm ánh xạ trả về một giá trị thông thường, nó sẽ bọc giá trị đó vào trong một `Optional` mới. Còn khi sử dụng `flatMap()`, nếu hàm ánh xạ trả về một `Optional`, nó sẽ làm phẳng `Optional` trả về đó, không bọc thành các `Optional` lồng nhau nữa.

Dưới đây là đoạn mã ví dụ đối chiếu:

```java
public static void main(String[] args) {
        int userId = 1;

        // Mã nguồn dùng flatMap
        String cityUsingFlatMap = getUserById(userId)
                .flatMap(OptionalExample::getAddressByUser)
                .map(Address::getCity)
                .orElse("Unknown");

        System.out.println("User's city using flatMap: " + cityUsingFlatMap);

        // Mã nguồn không dùng flatMap
        Optional<Optional<Address>> optionalAddress = getUserById(userId)
                .map(OptionalExample::getAddressByUser);

        String cityWithoutFlatMap;
        if (optionalAddress.isPresent()) {
            Optional<Address> addressOptional = optionalAddress.get();
            if (addressOptional.isPresent()) {
                Address address = addressOptional.get();
                cityWithoutFlatMap = address.getCity();
            } else {
                cityWithoutFlatMap = "Unknown";
            }
        } else {
            cityWithoutFlatMap = "Unknown";
        }

        System.out.println("User's city without flatMap: " + cityWithoutFlatMap);
    }
```

Sử dụng đúng `flatMap` trong `Stream` và `Optional` có thể giảm thiểu rất nhiều mã nguồn không cần thiết.

### Kiểm tra `value` có phải `null` không

```java
/**
* Kiểm tra value có khác null hay không
*/
public boolean isPresent() {
    return value != null;
}
/**
* Nếu value khác null thì thực thi consumer.accept
*/
public void ifPresent(Consumer<? super T> consumer) {
   if (value != null)
    consumer.accept(value);
}
```

### Lấy giá trị (`value`)

```java
/**
* Return the value if present, otherwise invoke {@code other} and return
* the result of that invocation.
* Nếu value != null thì trả về value, ngược lại trả về kết quả thực thi của other
*/
public T orElseGet(Supplier<? extends T> other) {
    return value != null ? value : other.get();
}

/**
* Nếu value != null thì trả về value, ngược lại trả về other
*/
public T orElse(T other) {
    return value != null ? value : other;
}

/**
* Nếu value != null thì trả về value, ngược lại ném ra ngoại lệ do tham số trả về
*/
public <X extends Throwable> T orElseThrow(Supplier<? extends X> exceptionSupplier) throws X {
        if (value != null) {
            return value;
        } else {
            throw exceptionSupplier.get();
        }
}
/**
* Nếu value là null thì ném NoSuchElementException, không rỗng thì trả về value.
*/
public T get() {
  if (value == null) {
      throw new NoSuchElementException("No value present");
  }
  return value;
}
```

### Lọc giá trị

```java
/**
* 1. Nếu là empty thì trả về empty
* 2. Nếu predicate.test(value)==true thì trả về this, ngược lại trả về empty
*/
public Optional<T> filter(Predicate<? super T> predicate) {
        Objects.requireNonNull(predicate);
        if (!isPresent())
            return this;
        else
            return predicate.test(value) ? this : empty();
}
```

### Tổng kết

Sau khi xem qua mã nguồn `Optional`, ta có thể thấy `of()` yêu cầu tham số khác `null`, `get()` khi `Optional` rỗng sẽ ném ra `NoSuchElementException`, còn `flatMap()` dùng để làm phẳng kết quả ánh xạ trả về `Optional`, chứ không phải là phương thức cần né tránh. Thông thường nên dựa vào việc giá trị có được phép vắng mặt hay không để chọn `of()` hay `ofNullable()`, đồng thời ưu tiên dùng các phương thức như `orElse`, `orElseGet`, `orElseThrow` để xử lý giá trị rỗng. Cuối cùng, hãy kết hợp lại các phương thức thường dùng nhất của `Optional`.

```java
Optional.ofNullable(zoo).map(o -> o.getDog()).map(d -> d.getAge()).filter(v->v==1).orElse(3);
```

## Date-Time API

Đây là sự bổ sung mạnh mẽ cho `java.util.Date`, giải quyết được phần lớn các điểm bất cập của lớp `Date`:

1. Không an toàn luồng (not thread-safe)
2. Xử lý múi giờ (time zone) phiền phức
3. Các thao tác định dạng và tính toán thời gian rườm rà
4. Thiết kế có khiếm khuyết: lớp `Date` chứa đồng thời cả ngày và giờ; lại còn có `java.sql.Date` rất dễ gây nhầm lẫn.

Chúng ta hãy đối chiếu sự khác biệt giữa `java.util.Date` và Date-Time API mới qua các ví dụ thời gian thường gặp. Những đoạn mã đang dùng `java.util.Date` đã đến lúc nên sửa lại rồi.

### Các lớp chính trong `java.time`

`java.util.Date` vừa chứa ngày vừa chứa giờ, trong khi `java.time` tách biệt chúng ra:

```java
LocalDateTime.class // Ngày + giờ format: yyyy-MM-ddTHH:mm:ss.SSS
LocalDate.class // Ngày format: yyyy-MM-dd
LocalTime.class // Giờ format: HH:mm:ss
```

### Định dạng (Formatting)

**Trước Java 8:**

```java
public void oldFormat(){
    Date now = new Date();
    // format yyyy-MM-dd
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
    String date  = sdf.format(now);
    System.out.println(String.format("date format : %s", date));

    // format HH:mm:ss
    SimpleDateFormat sdft = new SimpleDateFormat("HH:mm:ss");
    String time = sdft.format(now);
    System.out.println(String.format("time format : %s", time));

    // format yyyy-MM-dd HH:mm:ss
    SimpleDateFormat sdfdt = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    String datetime = sdfdt.format(now);
    System.out.println(String.format("dateTime format : %s", datetime));
}
```

**Từ Java 8 trở đi:**

```java
public void newFormat(){
    // format yyyy-MM-dd
    LocalDate date = LocalDate.now();
    System.out.println(String.format("date format : %s", date));

    // format HH:mm:ss
    LocalTime time = LocalTime.now().withNano(0);
    System.out.println(String.format("time format : %s", time));

    // format yyyy-MM-dd HH:mm:ss
    LocalDateTime dateTime = LocalDateTime.now();
    DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    String dateTimeStr = dateTime.format(dateTimeFormatter);
    System.out.println(String.format("dateTime format : %s", dateTimeStr));
}
```

### Chuyển đổi chuỗi sang định dạng ngày giờ

**Trước Java 8:**

```java
// Đã bị đánh dấu lỗi thời (deprecated)
Date date = new Date("2021-01-26");
// Thay thế bằng
SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
Date date1 = sdf.parse("2021-01-26");
```

**Từ Java 8 trở đi:**

```java
LocalDate date = LocalDate.of(2021, 1, 26);
LocalDate.parse("2021-01-26");

LocalDateTime dateTime = LocalDateTime.of(2021, 1, 26, 12, 12, 22);
LocalDateTime.parse("2021-01-26T12:12:22");

LocalTime time = LocalTime.of(12, 12, 22);
LocalTime.parse("12:12:22");
```

**Trước Java 8**, việc chuyển đổi đều phải nhờ đến lớp `SimpleDateFormat`, còn **từ Java 8 trở đi** chỉ cần dùng phương thức `of` hoặc `parse` của `LocalDate`, `LocalTime`, `LocalDateTime`.

### Tính toán ngày tháng

Dưới đây chỉ lấy **ngày sau đó một tuần** làm ví dụ; các đơn vị khác (năm, tháng, ngày, nửa ngày, giờ, v.v.) cũng tương tự. Ngoài ra, toàn bộ các đơn vị này đều được định nghĩa trong enum _java.time.temporal.ChronoUnit_.

**Trước Java 8:**

```java
public void afterDay(){
     // Ngày sau đó một tuần
     SimpleDateFormat formatDate = new SimpleDateFormat("yyyy-MM-dd");
     Calendar ca = Calendar.getInstance();
     ca.add(Calendar.DATE, 7);
     Date d = ca.getTime();
     String after = formatDate.format(d);
     System.out.println("Ngày sau một tuần: " + after);

   // Tính khoảng cách giữa hai ngày là bao nhiêu ngày; tính cách nhau bao nhiêu năm, bao nhiêu tháng cũng tương tự
     String dates1 = "2021-12-23";
   String dates2 = "2021-02-26";
     SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
     Date date1 = format.parse(dates1);
     Date date2 = format.parse(dates2);
     int day = (int) ((date1.getTime() - date2.getTime()) / (1000 * 3600 * 24));
     System.out.println(dates1 + " và " + dates2 + " cách nhau " + day + " ngày");
     // Kết quả: 2021-02-26 và 2021-12-23 cách nhau 300 ngày
}
```

**Từ Java 8 trở đi:**

```java
public void pushWeek(){
     // Ngày sau đó một tuần
     LocalDate localDate = LocalDate.now();
     // Cách 1
     LocalDate after = localDate.plus(1, ChronoUnit.WEEKS);
     // Cách 2
     LocalDate after2 = localDate.plusWeeks(1);
     System.out.println("Ngày sau một tuần: " + after);

     // Tính khoảng cách giữa hai ngày (bao nhiêu ngày, tháng, năm)
     LocalDate date1 = LocalDate.parse("2021-02-26");
     LocalDate date2 = LocalDate.parse("2021-12-23");
     Period period = Period.between(date1, date2);
     System.out.println("Từ date1 đến date2 cách nhau: "
                + period.getYears() + " năm "
                + period.getMonths() + " tháng "
                + period.getDays() + " ngày");
   // Kết quả in ra là "Từ date1 đến date2 cách nhau: 0 năm 9 tháng 27 ngày"
     // Ở đây period.getDays() lấy ra số ngày dư sau khi đã trừ đi năm và tháng, chứ không phải tổng số ngày
     // Nếu muốn lấy tổng số ngày thuần túy thì nên dùng cách dưới đây
     long day = date2.toEpochDay() - date1.toEpochDay();
     System.out.println(date1 + " và " + date2 + " cách nhau " + day + " ngày");
     // Kết quả in ra: 2021-02-26 và 2021-12-23 cách nhau 300 ngày
}
```

### Lấy ngày cụ thể

Ngoài việc tính toán ngày tháng rườm rà, việc lấy một ngày cụ thể cũng rất phiền phức — chẳng hạn lấy ngày cuối cùng hoặc ngày đầu tiên của tháng hiện tại.

**Trước Java 8:**

```java
public void getDay() {

        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        // Lấy ngày đầu tiên của tháng hiện tại:
        Calendar c = Calendar.getInstance();
        c.set(Calendar.DAY_OF_MONTH, 1);
        String first = format.format(c.getTime());
        System.out.println("first day:" + first);

        // Lấy ngày cuối cùng của tháng hiện tại
        Calendar ca = Calendar.getInstance();
        ca.set(Calendar.DAY_OF_MONTH, ca.getActualMaximum(Calendar.DAY_OF_MONTH));
        String last = format.format(ca.getTime());
        System.out.println("last day:" + last);

        // Ngày cuối cùng của năm hiện tại
        Calendar currCal = Calendar.getInstance();
        Calendar calendar = Calendar.getInstance();
        calendar.clear();
        calendar.set(Calendar.YEAR, currCal.get(Calendar.YEAR));
        calendar.roll(Calendar.DAY_OF_YEAR, -1);
        Date time = calendar.getTime();
        System.out.println("last day:" + format.format(time));
}
```

**Từ Java 8 trở đi:**

```java
public void getDayNew() {
    LocalDate today = LocalDate.now();
    // Lấy ngày đầu tiên của tháng hiện tại:
    LocalDate firstDayOfThisMonth = today.with(TemporalAdjusters.firstDayOfMonth());
    // Lấy ngày cuối cùng của tháng hiện tại
    LocalDate lastDayOfThisMonth = today.with(TemporalAdjusters.lastDayOfMonth());
    // Lấy ngày tiếp theo:
    LocalDate nextDay = lastDayOfThisMonth.plusDays(1);
    // Ngày cuối cùng của năm hiện tại
    LocalDate lastday = today.with(TemporalAdjusters.lastDayOfYear());
    // Chủ nhật cuối cùng của năm 2021 — nếu dùng Calendar chắc chắn phát ngán.
    LocalDate lastMondayOf2021 = LocalDate.parse("2021-12-31").with(TemporalAdjusters.lastInMonth(DayOfWeek.SUNDAY));
}
```

Trong `java.time.temporal.TemporalAdjusters` còn rất nhiều thuật toán tiện lợi khác; ở đây tôi sẽ không đi sâu vào API nữa — tất cả đều rất đơn giản, nhìn vào là hiểu ngay.

### JDBC và Java 8

Hiện tại mối quan hệ ánh xạ giữa kiểu thời gian JDBC và kiểu thời gian Java 8 là:

1. `Date` ---> `LocalDate`
2. `Time` ---> `LocalTime`
3. `Timestamp` ---> `LocalDateTime`

Trước JDBC 4.2, người ta thường dùng `java.sql.Date`, `java.sql.Time` và `java.sql.Timestamp` để biểu diễn các kiểu thời gian SQL này tương ứng.

### Múi giờ (Time Zone)

> Múi giờ: Về mặt chính thức, múi giờ được chia theo mỗi 15° kinh độ thành một múi giờ, toàn cầu có tổng cộng 24 múi giờ, mỗi múi giờ chênh nhau 1 giờ. Tuy nhiên, để thuận tiện về mặt hành chính, người ta thường gộp cả một quốc gia hoặc một tỉnh thành vào chung một múi giờ — ví dụ Trung Quốc có lãnh thổ rộng lớn trải dài khoảng 5 múi giờ, nhưng trên thực tế chỉ sử dụng thống nhất giờ chuẩn múi giờ Đông 8 (UTC+8), tức giờ Bắc Kinh.

Đối tượng `java.util.Date` về bản chất lưu trữ số mili-giây tính từ 0 giờ ngày 1 tháng 1 năm 1970 (GMT) đến thời điểm mà đối tượng `Date` biểu diễn. Nói cách khác, dù bạn khởi tạo `new Date()` ở bất kỳ múi giờ nào, số mili-giây mà nó ghi nhận đều giống nhau, không liên quan đến múi giờ. Tuy nhiên, khi sử dụng thì cần chuyển nó sang giờ địa phương, và điều này liên quan đến quốc tế hóa thời gian. Bản thân `java.util.Date` không hỗ trợ trực tiếp điều đó mà phải nhờ tới `TimeZone`.

```java
// Giờ Bắc Kinh: Wed Jan 27 14:05:29 CST 2021
Date date = new Date();

SimpleDateFormat bjSdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
// Múi giờ Bắc Kinh
bjSdf.setTimeZone(TimeZone.getTimeZone("Asia/Shanghai"));
System.out.println("Số mili-giây:" + date.getTime() + ", Giờ Bắc Kinh:" + bjSdf.format(date));

// Múi giờ Tokyo
SimpleDateFormat tokyoSdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
tokyoSdf.setTimeZone(TimeZone.getTimeZone("Asia/Tokyo"));  // Thiết lập múi giờ Tokyo
System.out.println("Số mili-giây:" + date.getTime() + ", Giờ Tokyo:" + tokyoSdf.format(date));

// Nếu in trực tiếp sẽ tự động chuyển sang thời gian theo múi giờ hiện tại
System.out.println(date);
// Wed Jan 27 14:05:29 CST 2021
```

Trong tính năng mới, `java.time.ZonedDateTime` được giới thiệu để biểu diễn thời gian kèm múi giờ. Có thể xem nó là `LocalDateTime + ZoneId`.

```java
// Thời gian theo múi giờ hiện tại
ZonedDateTime zonedDateTime = ZonedDateTime.now();
System.out.println("Thời gian múi giờ hiện tại: " + zonedDateTime);

// Giờ Tokyo
ZoneId zoneId = ZoneId.of(ZoneId.SHORT_IDS.get("JST"));
ZonedDateTime tokyoTime = zonedDateTime.withZoneSameInstant(zoneId);
System.out.println("Giờ Tokyo: " + tokyoTime);

// Chuyển ZonedDateTime sang LocalDateTime
LocalDateTime localDateTime = tokyoTime.toLocalDateTime();
System.out.println("Giờ Tokyo chuyển sang giờ địa phương: " + localDateTime);

// Chuyển LocalDateTime sang ZonedDateTime
ZonedDateTime localZoned = localDateTime.atZone(ZoneId.systemDefault());
System.out.println("Thời gian múi giờ cục bộ: " + localZoned);

// Kết quả in ra
Thời gian múi giờ hiện tại: 2021-01-27T14:43:58.735+08:00[Asia/Shanghai]
Giờ Tokyo: 2021-01-27T15:43:58.735+09:00[Asia/Tokyo]
Giờ Tokyo chuyển sang giờ địa phương: 2021-01-27T15:43:58.735
Thời gian múi giờ cục bộ: 2021-01-27T15:43:58.735+08:00[Asia/Shanghai]
```

### Tổng kết

Qua việc so sánh sự khác biệt giữa `Date` cũ và mới ở trên — dĩ nhiên chỉ liệt kê một phần khác biệt về tính năng, còn nhiều khả năng khác cần bạn tự khám phá thêm — tóm lại Date-Time API mang lại lợi ích rất lớn cho các thao tác ngày giờ. Trong công việc hằng ngày, khi gặp các thao tác với kiểu ngày tháng, ưu tiên hàng đầu là sử dụng Date-Time API; chỉ khi nào thực sự không giải quyết được mới cân nhắc đến `Date` cũ.

## Kết luận

Những tính năng mới của Java 8 mà chúng ta đã hệ thống và tổng kết gồm:

- Interface & functional Interface
- Lambda
- Stream
- Optional
- Date time-api

Đây đều là những tính năng thường xuyên được sử dụng trong quá trình phát triển. Sau khi tổng hợp lại mới thấy chúng dùng cực kỳ "sướng", vậy mà trước đây tôi lại chưa áp dụng sớm hơn. Trước kia cứ nghĩ học tính năng mới của Java 8 phiền phức, nên vẫn dùng mãi cách viết cũ. Thực tế những tính năng mới này chỉ vài ngày là nắm vững được; một khi đã thành thạo, hiệu suất làm việc sẽ tăng lên rất nhiều. Thực ra việc tăng lương của chúng ta cũng là tiền trả cho việc học hỏi; nếu ngừng học thì sớm muộn cũng bị đào thải, và "khủng hoảng tuổi 35" sẽ ập đến sớm hơn.
