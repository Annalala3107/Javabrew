---
title: Tổng hợp câu hỏi phỏng vấn Java cơ bản thường gặp (Phần 3)
description: "Tổng hợp câu hỏi phỏng vấn về các tính năng nâng cao của Java: giải thích chuyên sâu cơ chế xử lý ngoại lệ, nguyên lý Generics, ứng dụng Reflection, Annotation, cơ chế SPI, Serialization, mô hình luồng I/O (BIO/NIO/AIO), Syntactic Sugar và các kiến thức cốt lõi khác."
category: Java
tag:
  - Java cơ bản
head:
  - - meta
    - name: keywords
      content: Java exception,generics,reflection,annotation,SPI,serialization,IO stream,syntactic sugar,try-with-resources,BIO NIO AIO,câu hỏi phỏng vấn Java
lang: vi
sourceRef: zh-ref/java/basis/java-basic-questions-03.md
---

## Ngoại lệ (Exception)

**Tổng quan sơ đồ phân cấp lớp ngoại lệ trong Java**:

![Sơ đồ phân cấp lớp ngoại lệ trong Java](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/types-of-exceptions-in-java-3b100929.png)

### Sự khác biệt giữa Exception và Error là gì?

Trong Java, tất cả các ngoại lệ đều có một lớp tổ tiên chung là `Throwable` trong gói `java.lang`. Lớp `Throwable` có hai lớp con quan trọng:

- **`Exception`**: Các ngoại lệ mà bản thân chương trình có thể xử lý và có thể bắt thông qua `catch`. `Exception` lại được chia thành Checked Exception (ngoại lệ được kiểm tra, bắt buộc phải xử lý) và Unchecked Exception (ngoại lệ không kiểm tra, có thể không xử lý).
- **`Error`**: `Error` thuộc về những lỗi mà chương trình không thể xử lý được, ~~chúng ta không có cách nào dùng `catch` để bắt~~ không nên dùng `catch` để bắt. Ví dụ như lỗi vận hành máy ảo Java (`Virtual MachineError`), lỗi thiếu bộ nhớ máy ảo (`OutOfMemoryError`), lỗi định nghĩa lớp (`NoClassDefFoundError`), v.v. Khi các lỗi này xảy ra, Java Virtual Machine (JVM) thường sẽ chọn kết thúc Thread hiện tại.

### Sự khác biệt giữa ClassNotFoundException và NoClassDefFoundError

- `ClassNotFoundException` là một `Exception`, xảy ra khi không tìm thấy lớp trong quá trình tải lớp động như sử dụng Reflection; đây là tình huống có thể dự đoán trước và có thể bắt để xử lý.
- `NoClassDefFoundError` là một `Error`, biểu thị JVM hoặc `ClassLoader` cố gắng tải định nghĩa lớp nhưng không tìm thấy định nghĩa đó. Ngoài trường hợp thiếu file JAR lúc chạy (runtime), lỗi này còn có thể bị kích hoạt khi lớp khởi tạo thất bại rồi tiếp tục được sử dụng lại sau đó. Nó thường sẽ kết thúc Thread hiện tại, nhưng không đồng nghĩa toàn bộ JVM chắc chắn không thể tiếp tục chạy.

### ⭐️ Sự khác biệt giữa Checked Exception và Unchecked Exception là gì?

**Checked Exception** là ngoại lệ được kiểm tra. Trong quá trình biên dịch mã nguồn Java, nếu Checked Exception không được xử lý bằng `catch` hoặc khai báo bằng từ khóa `throws`, chương trình sẽ không thể biên dịch thành công.

Ví dụ như đoạn mã thao tác I/O dưới đây:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/checked-exception-0d2526e0.png)

Ngoài `RuntimeException` và các lớp con của nó, tất cả các lớp `Exception` còn lại cùng các lớp con của chúng đều thuộc Checked Exception. Các Checked Exception phổ biến gồm: các ngoại lệ liên quan đến I/O, `ClassNotFoundException`, `SQLException`, v.v.

**Unchecked Exception** là **ngoại lệ không bị kiểm tra**. Trong quá trình biên dịch mã Java, ngay cả khi chúng ta không xử lý Unchecked Exception thì mã nguồn vẫn có thể biên dịch bình thường.

`RuntimeException` và các lớp con của nó thuộc Unchecked Exception; xét theo phân loại của JLS, `Error` và các lớp con của nó cũng thuộc Unchecked Exception. Các `RuntimeException` thường gặp gồm:

- `NullPointerException` (lỗi con trỏ null)
- `IllegalArgumentException` (lỗi tham số, ví dụ sai kiểu tham số truyền vào phương thức)
- `NumberFormatException` (lỗi định dạng khi chuyển chuỗi sang số, là lớp con của `IllegalArgumentException`)
- `ArrayIndexOutOfBoundsException` (lỗi vượt quá giới hạn chỉ số mảng)
- `ClassCastException` (lỗi ép kiểu)
- `ArithmeticException` (lỗi số học)
- `SecurityException` (lỗi bảo mật, ví dụ không đủ quyền)
- `UnsupportedOperationException` (lỗi thao tác không được hỗ trợ, ví dụ tạo trùng cùng một người dùng)
- ...

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/unchecked-exception-3bbef05c.png)

### Bạn ưu tiên sử dụng Checked Exception hay Unchecked Exception hơn?

Mặc định sử dụng Unchecked Exception, chỉ dùng Checked Exception khi thực sự cần thiết.

Chúng ta có thể xem Unchecked Exception (chẳng hạn như `NullPointerException`) là bug trong code. Đối với bug, cách tốt nhất là để nó lộ ra rồi sửa lại code, chứ không phải dùng `try-catch` để che đậy nó.

Nhìn chung, chỉ dùng Checked Exception trong một trường hợp: khi ngoại lệ đó là một phần của logic nghiệp vụ và bên gọi bắt buộc phải xử lý nó. Ví dụ như một ngoại lệ số dư không đủ. Đây không phải là bug, mà là một nhánh nghiệp vụ bình thường; tôi cần dùng Checked Exception để ép buộc bên gọi phải xử lý tình huống này, chẳng hạn như nhắc người dùng nạp tiền. Nhờ vậy vừa đảm bảo tính toàn vẹn của các logic nghiệp vụ trọng yếu, vừa giữ cho code gọn gàng nhất có thể.

### Các phương thức thường dùng của lớp Throwable là gì?

- `String getMessage()`: Trả về thông tin chi tiết khi ngoại lệ xảy ra
- `String toString()`: Trả về mô tả ngắn gọn khi ngoại lệ xảy ra
- `String getLocalizedMessage()`: Trả về thông tin đã được bản địa hóa (localized) của đối tượng ngoại lệ. Có thể dùng lớp con của `Throwable` để ghi đè (`Override`) phương thức này nhằm tạo thông báo theo ngôn ngữ địa phương. Nếu lớp con không ghi đè phương thức này, kết quả trả về sẽ giống với `getMessage()`
- `void printStackTrace()`: In thông tin ngoại lệ được đóng gói trong đối tượng `Throwable` ra console

### Cách sử dụng `try-catch-finally` như thế nào?

- Khối `try`: Dùng để bắt ngoại lệ. Theo sau nó có thể có không hoặc nhiều khối `catch`; nếu không có khối `catch` nào thì bắt buộc phải đi kèm một khối `finally`.
- Khối `catch`: Dùng để xử lý ngoại lệ được khối `try` bắt.
- Khối `finally`: Dù ngoại lệ có được bắt hay xử lý hay không, các câu lệnh bên trong khối `finally` đều sẽ được thực thi. Khi gặp câu lệnh `return` trong khối `try` hoặc khối `catch`, khối `finally` sẽ được thực thi trước khi phương thức trả về.

Ví dụ minh họa:

```java
try {
    System.out.println("Try to do something");
    throw new RuntimeException("RuntimeException");
} catch (Exception e) {
    System.out.println("Catch Exception -> " + e.getMessage());
} finally {
    System.out.println("Finally");
}
```

Kết quả đầu ra:

```plain
Try to do something
Catch Exception -> RuntimeException
Finally
```

**Lưu ý: Không sử dụng `return` bên trong khối `finally`!** Khi cả khối `try` và khối `finally` đều có câu lệnh `return`, câu lệnh `return` trong khối `try` sẽ bị bỏ qua. Lý do là giá trị trả về của `return` trong câu lệnh `try` trước tiên sẽ được lưu tạm vào một biến cục bộ; sau khi thực thi đến `return` trong câu lệnh `finally`, giá trị của biến cục bộ đó sẽ trở thành giá trị `return` của câu lệnh `finally`.

Ví dụ minh họa:

```java
public static void main(String[] args) {
    System.out.println(f(2));
}

public static int f(int value) {
    try {
        return value * value;
    } finally {
        if (value == 2) {
            return 0;
        }
    }
}
```

Kết quả đầu ra:

```plain
0
```

### Mã trong khối `finally` có chắc chắn luôn được thực thi không?

Không hẳn! Trong một số trường hợp, mã trong khối `finally` sẽ không được thực thi.

Ví dụ như nếu trước khi đến `finally` máy ảo bị dừng hoạt động, thì mã trong khối `finally` sẽ không được thực thi.

```java
try {
    System.out.println("Try to do something");
    throw new RuntimeException("RuntimeException");
} catch (Exception e) {
    System.out.println("Catch Exception -> " + e.getMessage());
    // Dừng Java Virtual Machine đang chạy hiện tại
    System.exit(1);
} finally {
    System.out.println("Finally");
}
```

Kết quả đầu ra:

```plain
Try to do something
Catch Exception -> RuntimeException
```

Ngoài ra, nếu tiến trình JVM bị dừng cưỡng bức — ví dụ gọi `Runtime.halt()`, hệ điều hành kết thúc trực tiếp tiến trình hoặc máy bị mất điện — khối `finally` cũng có thể không kịp thực thi. Đối với một ngoại lệ thông thường chưa được bắt, ngay cả khi cuối cùng nó làm Thread hiện tại kết thúc thì trước khi Thread kết thúc, khối `finally` vẫn sẽ được thực thi theo quy tắc của ngôn ngữ.

Issue liên quan: <https://github.com/Snailclimb/JavaGuide/issues/190>.

🧗🏻 Nâng cao: Phân tích nguyên lý hiện thực đằng sau Syntactic Sugar `try catch finally` từ góc độ bytecode.

### Cách sử dụng `try-with-resources` thay thế cho `try-catch-finally`?

1. **Phạm vi áp dụng (định nghĩa tài nguyên):** Bất kỳ đối tượng nào triển khai `java.lang.AutoCloseable` hoặc `java.io.Closeable`
2. **Thứ tự thực thi giữa việc đóng tài nguyên và khối `finally`:** Trong câu lệnh `try-with-resources`, bất kỳ khối `catch` hoặc `finally` nào đều chạy sau khi các tài nguyên đã khai báo được đóng lại

Cuốn *Effective Java* chỉ rõ:

> Đối với các tài nguyên bắt buộc phải đóng, chúng ta luôn nên ưu tiên sử dụng `try-with-resources` thay vì `try-finally`. Mã nguồn tạo ra sẽ ngắn gọn hơn, rõ ràng hơn và các ngoại lệ sinh ra cũng hữu ích hơn đối với chúng ta. Câu lệnh `try-with-resources` giúp chúng ta dễ dàng viết mã xử lý các tài nguyên bắt buộc phải đóng — điều mà nếu dùng `try-finally` thì gần như không thể làm được.

Các tài nguyên trong Java như `InputStream`, `OutputStream`, `Scanner`, `PrintWriter`, v.v. đều cần chúng ta gọi phương thức `close()` để đóng thủ công; thông thường chúng ta thực hiện yêu cầu này thông qua câu lệnh `try-catch-finally` như sau:

```java
// Đọc nội dung tệp văn bản
Scanner scanner = null;
try {
    scanner = new Scanner(new File("D://read.txt"));
    while (scanner.hasNext()) {
        System.out.println(scanner.nextLine());
    }
} catch (FileNotFoundException e) {
    e.printStackTrace();
} finally {
    if (scanner != null) {
        scanner.close();
    }
}
```

Cải tiến đoạn mã trên bằng câu lệnh `try-with-resources` từ Java 7 trở đi:

```java
try (Scanner scanner = new Scanner(new File("test.txt"))) {
    while (scanner.hasNext()) {
        System.out.println(scanner.nextLine());
    }
} catch (FileNotFoundException fnfe) {
    fnfe.printStackTrace();
}
```

Tất nhiên, khi có nhiều tài nguyên cần đóng, việc hiện thực bằng `try-with-resources` cũng rất đơn giản; nếu bạn vẫn dùng `try-catch-finally` thì có thể nảy sinh rất nhiều vấn đề.

Bằng cách phân tách bởi dấu chấm phẩy, bạn có thể khai báo nhiều tài nguyên trong một khối `try-with-resources`.

```java
try (BufferedInputStream bin = new BufferedInputStream(new FileInputStream(new File("test.txt")));
     BufferedOutputStream bout = new BufferedOutputStream(new FileOutputStream(new File("out.txt")))) {
    int b;
    while ((b = bin.read()) != -1) {
        bout.write(b);
    }
}
catch (IOException e) {
    e.printStackTrace();
}
```

### ⭐️ Cần lưu ý những điểm nào khi sử dụng ngoại lệ?

- Không khai báo ngoại lệ dưới dạng biến `static`, vì làm như vậy sẽ khiến thông tin stack trace của ngoại lệ bị rối loạn. Mỗi lần chủ động ném ngoại lệ, chúng ta đều cần tự tạo một đối tượng ngoại lệ mới bằng `new` để ném ra.
- Thông điệp ngoại lệ được ném ra phải có ý nghĩa.
- Khuyến khích ném các ngoại lệ cụ thể hơn; ví dụ khi chuyển đổi chuỗi sang định dạng số bị lỗi, nên ném `NumberFormatException` thay vì lớp cha của nó là `IllegalArgumentException`.
- Tránh ghi log trùng lặp: nếu tại nơi bắt ngoại lệ đã ghi lại đầy đủ thông tin (bao gồm loại ngoại lệ, thông báo lỗi và stack trace, v.v.), thì khi ném lại ngoại lệ này trong mã nghiệp vụ không nên ghi lại cùng một thông tin lỗi nữa. Việc ghi log trùng lặp làm phình to tệp log và có thể che lấp nguyên nhân thực sự của vấn đề, khiến việc truy vết và giải quyết vấn đề trở nên khó khăn hơn.
- ...

## Generics

### Generics là gì? Có tác dụng gì?

**Java Generics** là một tính năng mới được giới thiệu trong JDK 5. Việc sử dụng tham số kiểu tổng quát giúp tăng cường tính dễ đọc và độ ổn định của mã nguồn.

Trình biên dịch có thể kiểm tra tham số Generics và thông qua tham số Generics có thể chỉ định kiểu đối tượng được truyền vào. Ví dụ dòng mã `ArrayList<Person> persons = new ArrayList<Person>()` chỉ rõ đối tượng `ArrayList` này chỉ được truyền vào đối tượng `Person`; nếu truyền đối tượng thuộc kiểu khác vào sẽ báo lỗi ngay.

```java
ArrayList<E> extends AbstractList<E>
```

Hơn nữa, `List` nguyên thủy có kiểu trả về là `Object` nên cần ép kiểu thủ công mới dùng được, còn khi dùng Generics trình biên dịch sẽ tự động thực hiện chuyển đổi kiểu.

### Có những cách sử dụng Generics nào?

Generics nhìn chung có ba cách sử dụng: **lớp generic (Generic Class)**, **interface generic (Generic Interface)** và **phương thức generic (Generic Method)**.

**1. Lớp generic (Generic Class)**:

```java
// Ở đây T có thể đặt là bất kỳ ký hiệu nào; các tham số phổ biến như T, E, K, V thường dùng để biểu diễn Generics
// Khi khởi tạo lớp generic, bắt buộc phải chỉ định kiểu cụ thể của T
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
```

**2. Interface generic (Generic Interface)**:

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

**3. Phương thức generic (Generic Method)**:

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
// Tạo các mảng thuộc những kiểu khác nhau: Integer, Double và Character
Integer[] intArray = { 1, 2, 3 };
String[] stringArray = { "Hello", "World" };
printArray( intArray  );
printArray( stringArray  );
```

> Lưu ý: `public static <E> void printArray(E[] inputArray)` là phương thức generic tĩnh. Ngữ cảnh tĩnh (`static`) không có thể hiện (`instance`) hiện tại, do đó không thể tham chiếu đến tham số kiểu do lớp khai báo; điều này không liên quan đến việc "phương thức `static` được tải trước". Phương thức `static` có thể tự khai báo và sử dụng tham số kiểu `<E>` của riêng nó.

### Generics được sử dụng ở đâu trong dự án?

- Kết quả trả về chung cho API tự định nghĩa `CommonResult<T>` thông qua tham số `T` để chỉ định động kiểu dữ liệu của kết quả tùy theo kiểu trả về cụ thể
- Định nghĩa lớp xử lý `Excel` là `ExcelUtil<T>` để chỉ định động kiểu dữ liệu khi xuất `Excel`
- Xây dựng các lớp tiện ích cho Collection (tham khảo các phương thức `sort`, `binarySearch` trong `Collections`).
- ...

## ⭐️ Reflection

Để tìm hiểu chi tiết về Reflection, hãy xem bài viết [Giải thích chi tiết cơ chế Reflection trong Java](https://javaguide.cn/java/basis/reflection.html).

### Reflection là gì?

Nói một cách đơn giản, Java Reflection là **khả năng lấy thông tin của lớp và thao tác với lớp hoặc đối tượng (phương thức, thuộc tính) một cách linh hoạt tại thời điểm chạy của chương trình (runtime)**.

Thông thường, mã nguồn chúng ta viết đã xác định rõ kiểu ngay tại thời điểm biên dịch, biết rõ sẽ gọi phương thức nào hay truy cập trường dữ liệu nào. Nhưng Reflection cho phép chúng ta đến **lúc chạy (runtime)** mới dò tìm xem một lớp có những phương thức nào, những thuộc tính nào, constructor của nó ra sao, và trong phạm vi kiểm soát truy cập cũng như ranh giới module cho phép có thể tạo đối tượng động, gọi phương thức hoặc sửa đổi thuộc tính.

Chính khả năng "tự quan sát bản thân" và thực hiện thao tác tại runtime này đã giúp Reflection trở thành **nền tảng của rất nhiều framework và thư viện dùng chung**. Nó giúp code linh hoạt hơn, có thể xử lý được các kiểu chưa biết trước tại thời điểm biên dịch.

### Ưu và nhược điểm của Reflection là gì?

**Ưu điểm:**

1. **Tính linh hoạt và tính động**: Reflection cho phép chương trình tải lớp động, tạo đối tượng, gọi phương thức và truy cập trường dữ liệu tại runtime, thích ứng và mở rộng hành vi chương trình một cách linh hoạt theo nhu cầu thực tế (như tệp cấu hình, dữ liệu người dùng nhập, Annotation, v.v.). Nhiều framework Java hiện đại (như Spring, Hibernate, MyBatis) chính là dựa vào đặc tính này để hiện thực các chức năng cốt lõi như Dependency Injection (DI), Lập trình hướng khía cạnh (AOP), Ánh xạ quan hệ đối tượng (ORM), xử lý Annotation, v.v. Có thể nói Reflection là nền tảng không thể thiếu trong phát triển framework.
2. **Giảm sự phụ thuộc (Decoupling) và tính tổng quát**: Thông qua Reflection, có thể viết mã tổng quát hơn, dễ tái sử dụng và ít phụ thuộc chéo hơn, giảm sự ràng buộc giữa các module. Ví dụ có thể dùng Reflection để hiện thực sao chép đối tượng tổng quát, Serialization, Bean utility, v.v.

**Nhược điểm:**

1. **Chi phí hiệu năng**: Thao tác Reflection thường chậm hơn so với gọi code trực tiếp. Bởi vì nó liên quan đến phân giải kiểu động, tìm kiếm phương thức cũng như việc tối ưu hóa của trình biên dịch JIT bị hạn chế. Tuy nhiên, đối với phần lớn kịch bản của framework, mức tiêu hao hiệu năng này thường chấp nhận được, hoặc bản thân framework cũng sẽ thực hiện một số tối ưu bằng cache.
2. **Vấn đề bảo mật**: Khi đáp ứng các điều kiện như kiểm tra truy cập, quy tắc mở module, v.v., Reflection có thể vô hiệu hóa một phần cơ chế kiểm tra truy cập của ngôn ngữ Java (như truy cập các trường và phương thức `private`), có khả năng phá vỡ tính đóng gói (Encapsulation). Ngoài ra, Reflection còn có thể vượt qua kiểm tra Generics lúc biên dịch, tiềm ẩn rủi ro mất an toàn kiểu. Từ Java 9 trở đi, ranh giới module có thể từ chối truy cập Reflection sâu như vậy và ném ra `InaccessibleObjectException`.
3. **Tính dễ đọc và bảo trì của mã nguồn**: Lạm dụng Reflection sẽ khiến code trở nên phức tạp, khó hiểu và khó debug. Lỗi thường chỉ bộc lộ vào thời điểm chạy, không dễ phát hiện sớm như lỗi lúc biên dịch.

Đọc thêm: [Java Reflection: Why is it so slow?](https://stackoverflow.com/questions/1392351/java-reflection-why-is-it-so-slow).

### Các kịch bản ứng dụng của Reflection là gì?

Khi viết code nghiệp vụ hằng ngày, chúng ta có thể rất ít khi làm việc trực tiếp với Java Reflection. Nhưng có thể bạn không để ý rằng ngày nào bạn cũng đang tận hưởng sự tiện lợi mà Reflection mang lại! **Nhiều framework phổ biến như Spring/Spring Boot, MyBatis, v.v. ở tầng dưới đều sử dụng rất nhiều cơ chế Reflection**, điều đó mới giúp chúng linh hoạt và mạnh mẽ như vậy.

Dưới đây liệt kê đơn giản một số kịch bản phổ biến nhất giúp các bạn dễ hình dung.

**1. Dependency Injection và Inversion of Control (IoC)**

Các framework IoC tiêu biểu như Spring/Spring Boot khi khởi động sẽ quét các lớp có gắn Annotation đặc biệt (như `@Component`, `@Service`, `@Repository`, `@Controller`), dùng Reflection để khởi tạo đối tượng (Bean), và thông qua Reflection để tiêm phụ thuộc (như `@Autowired`, tiêm qua constructor, v.v.).

**2. Xử lý Annotation**

Bản thân Annotation chỉ là một "ký hiệu đánh dấu", phải có thứ gì đó đọc ký hiệu này mới biết cần làm gì. Reflection chính là "bộ đọc" đó. Framework thông qua Reflection để kiểm tra xem trên lớp, phương thức, trường dữ liệu có gắn Annotation cụ thể nào không, sau đó dựa vào thông tin của Annotation để thực thi logic tương ứng. Ví dụ, khi thấy `@Value`, nó dùng Reflection đọc nội dung Annotation, tìm giá trị tương ứng trong tệp cấu hình, rồi lại dùng Reflection gán giá trị đó cho trường dữ liệu.

**3. Dynamic Proxy và AOP**

Bạn muốn tự động chèn thêm xử lý trước và sau khi gọi một phương thức nào đó (như ghi log, mở transaction, kiểm tra quyền)? AOP (Lập trình hướng khía cạnh) sinh ra để làm việc này, và Dynamic Proxy là phương thức phổ biến để hiện thực AOP. Dynamic Proxy có sẵn trong JDK (`Proxy` và `InvocationHandler`) không thể thiếu Reflection. Khi đối tượng proxy bên trong gọi phương thức của đối tượng thực, nó thực hiện thông qua `Method.invoke` của Reflection.

```java
public class DebugInvocationHandler implements InvocationHandler {
    private final Object target; // Đối tượng thực

    public DebugInvocationHandler(Object target) { this.target = target; }

    // proxy: đối tượng proxy, method: phương thức được gọi, args: tham số phương thức
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("切面逻辑：调用方法 " + method.getName() + " 之前");
        // Gọi phương thức cùng tên của đối tượng thực thông qua Reflection
        Object result = method.invoke(target, args);
        System.out.println("切面逻辑：调用方法 " + method.getName() + " 之后");
        return result;
    }
}
```

**4. Ánh xạ quan hệ đối tượng (ORM)**

Những framework như MyBatis, Hibernate có thể giúp bạn tự động biến từng dòng dữ liệu truy vấn từ cơ sở dữ liệu thành từng đối tượng Java. Làm sao nó biết cột nào trong database tương ứng với thuộc tính nào của Java? Vẫn là nhờ Reflection. Nó dùng Reflection để lấy danh sách thuộc tính của lớp Java, sau đó đối chiếu kết quả truy vấn theo tên hoặc cấu hình, rồi dùng Reflection gọi setter hoặc sửa trực tiếp giá trị trường. Ngược lại, khi lưu đối tượng vào database, nó cũng dùng Reflection đọc giá trị thuộc tính để ghép thành câu lệnh SQL.

## Proxy

Để tìm hiểu chi tiết về Proxy trong Java, bạn có thể xem bài viết [Giải thích chi tiết Proxy Pattern trong Java](https://javaguide.cn/java/basis/proxy.html).

### Cách triển khai Dynamic Proxy như thế nào?

Dynamic Proxy là một Design Pattern rất mạnh mẽ, cho phép chúng ta **tăng cường chức năng (Enhancement)** cho phương thức của một lớp hoặc đối tượng **mà không cần sửa đổi mã nguồn gốc**.

Trong Java, có hai cách phổ biến nhất để hiện thực Dynamic Proxy: **JDK Dynamic Proxy** và **CGLIB Dynamic Proxy**.

**Cách thứ nhất: JDK Dynamic Proxy**

Do chính thức Java cung cấp, yêu cầu cốt lõi của nó là lớp mục tiêu phải triển khai một hoặc nhiều interface. Tại runtime, JDK Dynamic Proxy sử dụng phương thức `Proxy.newProxyInstance()` để tạo động một thể hiện của lớp proxy triển khai các interface này. Lớp proxy này được sinh ra trong bộ nhớ, bạn sẽ không thấy file `.java` hay `.class` của nó.

Khi bạn gọi bất kỳ phương thức nào của đối tượng proxy, lời gọi này sẽ được chuyển tiếp đến phương thức `invoke` của một interface `InvocationHandler` do chúng ta cung cấp. Trong phương thức `invoke`, chúng ta có thể thêm logic mở rộng của riêng mình trước hoặc sau khi gọi phương thức gốc (phương thức mục tiêu).

**Cách thứ hai: CGLIB Dynamic Proxy**

CGLIB là một thư viện sinh mã của bên thứ ba. Nguyên lý của nó hoàn toàn khác với JDK: nó không yêu cầu lớp được proxy phải triển khai interface. Tại runtime, nó tạo động một lớp con của lớp mục tiêu làm lớp proxy (thông qua kỹ thuật thao tác bytecode ASM). Sau đó, nó sẽ ghi đè (`Override`) tất cả các phương thức không phải `final`, `private` và `static` trong lớp cha (tức lớp được proxy).

Khi bạn gọi bất kỳ phương thức nào của đối tượng proxy, lời gọi này sẽ bị chặn bởi phương thức `intercept` của interface `MethodInterceptor` trong CGLIB. Tương tự như phương thức `invoke` của `InvocationHandler`, chúng ta có thể thêm logic mở rộng của mình vào bên trong phương thức `intercept` trước hoặc sau khi gọi phương thức gốc của lớp cha.

### Sự khác biệt giữa Static Proxy và Dynamic Proxy là gì?

Sự khác biệt cốt lõi giữa Static Proxy và Dynamic Proxy nằm ở **thời điểm xác định quan hệ proxy, tính linh hoạt khi triển khai và chi phí bảo trì**.

| Tiêu chí so sánh | Static Proxy | Dynamic Proxy |
| --- | --- | --- |
| Thời điểm xác định quan hệ proxy | Thời điểm biên dịch (sau khi biên dịch sinh ra các file bytecode `.class` cố định) | Thời điểm chạy (tạo động bytecode lớp proxy và tải vào JVM) |
| Cách thức triển khai | Viết thủ công lớp proxy trước khi biên dịch, thường gọi đối tượng mục tiêu thông qua kết hợp (composition) và ủy quyền | Không cần viết thủ công lớp proxy cụ thể; đóng gói logic mở rộng thông qua `Handler`/`Interceptor` |
| Phụ thuộc vào Interface | Không bắt buộc; Static Proxy dựa trên interface thường cho lớp proxy và lớp mục tiêu tuân theo cùng một interface | JDK Dynamic Proxy hướng đến interface; các proxy dạng lớp con như CGLIB hướng đến các lớp hiện thực có thể kế thừa được |
| Khối lượng mã & khả năng bảo trì | Lượng code lớn (càng nhiều lớp mục tiêu càng nhiều lớp proxy), chi phí bảo trì cao; khi interface thêm phương thức mới, lớp mục tiêu và lớp proxy cần sửa đồng bộ | Lượng code rất ít (logic mở rộng dùng chung có thể tái sử dụng), khả năng bảo trì tốt; tách rời khỏi interface nên thay đổi interface không ảnh hưởng logic proxy |
| Ưu điểm cốt lõi | Triển khai đơn giản, logic trực quan, không phụ thuộc thêm framework ngoài | Tính linh hoạt cao, khả năng tái sử dụng cao, giảm viết mã lặp lại, thích ứng với các kịch bản phức tạp |
| Kịch bản ứng dụng điển hình | Decorator Pattern đơn giản, nhu cầu mở rộng cho một số ít lớp cố định | Spring AOP, các RPC framework (như Dubbo), các ORM framework |

### ⭐️ Sự khác biệt giữa JDK Dynamic Proxy và CGLIB Dynamic Proxy là gì?

1. JDK Dynamic Proxy là cơ chế chính thức, yêu cầu lớp được proxy phải triển khai interface. Nguyên lý của nó là tạo động một lớp triển khai của interface để làm proxy. CGLIB là bên thứ ba, không cần interface. Nguyên lý của nó là tạo động một lớp con của lớp được proxy để làm proxy. Nhưng cũng chính vì dùng kế thừa nên nó không thể proxy các lớp `final`, và phương thức được proxy cũng không thể là `final` hoặc `private`.
2. Xét về hiệu suất giữa hai loại, trong phần lớn trường hợp JDK Dynamic Proxy vượt trội hơn; theo các bản nâng cấp của phiên bản JDK, lợi thế này càng trở nên rõ rệt.

### ⭐️ Giới thiệu các kịch bản ứng dụng thực tế của Dynamic Proxy trong Framework

Kịch bản ứng dụng điển hình nhất của Dynamic Proxy chính là **Spring AOP**.

AOP (Aspect-Oriented Programming: Lập trình hướng khía cạnh) có thể đóng gói các logic hoặc trách nhiệm không liên quan đến nghiệp vụ nhưng lại được nhiều module nghiệp vụ cùng gọi đến (ví dụ xử lý transaction, quản lý log, kiểm soát quyền hạn, v.v.), thuận tiện cho việc giảm mã lặp lại trong hệ thống, giảm mức độ phụ thuộc giữa các module và có lợi cho khả năng mở rộng cũng như bảo trì về sau.

Spring AOP dựa trên Dynamic Proxy. Nếu đối tượng cần proxy có triển khai một interface nào đó, Spring AOP sẽ sử dụng **JDK Proxy** để tạo đối tượng proxy; còn đối với đối tượng không triển khai interface thì không thể dùng JDK Proxy để proxy được, lúc này Spring AOP sẽ dùng **CGLIB** tạo một lớp con của đối tượng được proxy để làm proxy, như minh họa trong hình dưới đây:

![SpringAOPProcess](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/230ae587a322d6e4d09510161987d346-1e9492d2.jpg)

## Annotation

### Annotation là gì?

`Annotation` (chú thích) là tính năng mới được giới thiệu từ Java 5, có thể xem như một dạng chú thích đặc biệt, chủ yếu dùng để gắn lên lớp, phương thức hoặc biến, cung cấp một số thông tin cho chương trình sử dụng lúc biên dịch hoặc lúc chạy.

Về bản chất, Annotation là một interface đặc biệt kế thừa `Annotation`:

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.SOURCE)
public @interface Override {

}

public interface Override extends Annotation{

}
```

JDK cung cấp rất nhiều Annotation tích hợp sẵn (như `@Override`, `@Deprecated`), đồng thời chúng ta cũng có thể tự định nghĩa Annotation tùy chỉnh.

### Có những cách phân giải Annotation nào?

Annotation chỉ phát huy tác dụng sau khi được phân giải. Có hai cách phân giải phổ biến:

- **Quét trực tiếp ở thời điểm biên dịch**: Trình biên dịch trong quá trình biên dịch mã Java sẽ quét các Annotation tương ứng và xử lý; ví dụ một phương thức nào đó dùng Annotation `@Override`, trình biên dịch khi biên dịch sẽ kiểm tra xem phương thức hiện tại có ghi đè (`Override`) phương thức tương ứng của lớp cha hay không.
- **Xử lý thông qua Reflection ở thời điểm chạy**: Các Annotation có sẵn trong framework (như `@Value`, `@Component` của Spring framework) đều được xử lý thông qua Reflection.

## ⭐️ SPI

Để tìm hiểu chi tiết về SPI, hãy xem bài viết [Giải thích chi tiết cơ chế Java SPI](https://javaguide.cn/java/basis/spi.html).

### SPI là gì?

SPI là viết tắt của Service Provider Interface, hiểu theo nghĩa đen là: "interface của nhà cung cấp dịch vụ"; theo cách hiểu của tôi, đây là một interface được cung cấp chuyên biệt cho nhà cung cấp dịch vụ hoặc lập trình viên mở rộng tính năng của framework sử dụng.

SPI tách biệt service interface khỏi bản hiện thực dịch vụ cụ thể, tách rời bên gọi dịch vụ và bên hiện thực dịch vụ, giúp nâng cao tính mở rộng và khả năng bảo trì của chương trình. Sửa đổi hoặc thay thế bản hiện thực dịch vụ không cần phải sửa đổi bên gọi.

Rất nhiều framework sử dụng cơ chế SPI của Java, ví dụ: Spring framework, trình tải driver cơ sở dữ liệu, các interface log, hay các bản mở rộng của Dubbo, v.v.

<img src="/media/jg/ext/oss.javaguide.cn/java/basis/spi/22e1830e0b0e4115a882751f6c417857tplv-k3u1fbpfcp--cf39285f.jpg" style="zoom:50%;" />

### Sự khác biệt giữa SPI và API là gì?

**Vậy SPI và API khác nhau ở đâu?**

Nhắc đến SPI thì không thể không nói đến API (Application Programming Interface). Xét theo nghĩa rộng, chúng đều là interface và rất dễ bị nhầm lẫn. Trước tiên hãy minh họa bằng một hình vẽ sau:

![SPI VS API](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/spi-vs-api-b7a94519.png)

Thông thường các module đều giao tiếp với nhau qua interface, vì vậy chúng ta đưa vào một "interface" ở giữa bên gọi dịch vụ và bên hiện thực dịch vụ (còn gọi là nhà cung cấp dịch vụ).

- Khi bên hiện thực cung cấp cả interface và bản hiện thực, chúng ta thông qua việc gọi interface của bên hiện thực để có được năng lực mà bên hiện thực cung cấp cho chúng ta, thì đây là **API**. Trong trường hợp này, cả interface và phần hiện thực đều đặt trong package của bên hiện thực. Bên gọi thông qua interface để gọi chức năng của bên hiện thực mà không cần quan tâm đến chi tiết hiện thực cụ thể.
- Khi interface nằm ở phía bên gọi, thì đây là **SPI**. Bên gọi interface xác định quy chuẩn của interface, sau đó các nhà sản xuất khác nhau dựa trên quy chuẩn này để hiện thực interface đó, qua đó cung cấp dịch vụ.

Lấy một ví dụ dễ hiểu: Công ty H là một công ty công nghệ vừa thiết kế một con chip mới và nay cần sản xuất hàng loạt, trong khi trên thị trường có nhiều công ty sản xuất gia công chip. Lúc này, chỉ cần công ty H quy định xong tiêu chuẩn sản xuất con chip này (định nghĩa xong tiêu chuẩn interface), thì các công ty sản xuất chip hợp tác này (nhà cung cấp dịch vụ) sẽ giao con chip đặc trưng của nhà mình theo đúng tiêu chuẩn (cung cấp các phương án hiện thực khác nhau, nhưng kết quả đầu ra là giống nhau).

### Ưu và nhược điểm của SPI là gì?

Thông qua cơ chế SPI có thể nâng cao đáng kể tính linh hoạt trong thiết kế interface, nhưng cơ chế SPI cũng tồn tại một số nhược điểm, ví dụ:

- `ServiceLoader` định vị và khởi tạo nhà cung cấp theo nhu cầu; nếu bên gọi duyệt qua toàn bộ nhà cung cấp để chọn một bản hiện thực thì mới kích hoạt việc tải toàn bộ các nhà cung cấp khả dụng.
- Một thể hiện `ServiceLoader` đơn lẻ không đảm bảo an toàn đa luồng; giữa các thể hiện khác nhau thì không tồn tại quy tắc "cùng lúc `load` chắc chắn sẽ xung đột".

## ⭐️ Serialization và Deserialization

Để tìm hiểu chi tiết về Serialization và Deserialization, hãy xem bài viết [Giải thích chi tiết Serialization trong Java](https://javaguide.cn/java/basis/serialization.html), trong đó các kiến thức và câu hỏi phỏng vấn được đề cập toàn diện hơn.

### Serialization là gì? Deserialization là gì?

Nếu chúng ta cần lưu trữ bền vững (persist) đối tượng Java — chẳng hạn lưu đối tượng Java vào tệp tin — hoặc truyền tải đối tượng Java qua mạng, những kịch bản này đều cần dùng đến Serialization.

Nói một cách đơn giản:

- **Tuần tự hóa (`Serialization`)**: Chuyển đổi cấu trúc dữ liệu hoặc đối tượng thành dạng có thể lưu trữ hoặc truyền tải, thường là luồng byte nhị phân, cũng có thể là các định dạng văn bản như JSON, XML
- **Giải tuần tự hóa (`Deserialization`)**: Quá trình chuyển đổi dữ liệu sinh ra trong quá trình Serialization trở lại thành cấu trúc dữ liệu hoặc đối tượng ban đầu

Đối với một ngôn ngữ lập trình hướng đối tượng như Java, thứ chúng ta tuần tự hóa đều là đối tượng (`Object`) — tức là lớp (`Class`) đã được khởi tạo thể hiện; nhưng trong ngôn ngữ bán hướng đối tượng như C++, `struct` định nghĩa kiểu cấu trúc dữ liệu, còn `class` mới tương ứng với kiểu đối tượng.

Dưới đây là các kịch bản ứng dụng phổ biến của Serialization và Deserialization:

- Đối tượng trước khi truyền tải qua mạng (ví dụ khi gọi hàm từ xa RPC) cần được Serialization trước, sau khi nhận được đối tượng đã tuần tự hóa thì cần thực hiện Deserialization;
- Trước khi lưu đối tượng vào tệp tin cần thực hiện Serialization, khi đọc đối tượng từ tệp tin ra cần thực hiện Deserialization;
- Trước khi lưu đối tượng vào cơ sở dữ liệu (như Redis) cần dùng Serialization, khi đọc đối tượng từ cơ sở dữ liệu cache ra cần Deserialization;
- Khi cần chuyển đối tượng thành biểu diễn byte để lưu trữ lâu dài hoặc truyền giữa các thành phần khác nhau thì thường cần Serialization; đối tượng Java thông thường sử dụng trong bộ nhớ JVM thì không cần Serialization.

Wikipedia giới thiệu về Serialization như sau:

> **Tuần tự hóa** (`Serialization`) trong xử lý dữ liệu của khoa học máy tính là quá trình chuyển đổi cấu trúc dữ liệu hoặc trạng thái đối tượng sang một định dạng có thể sử dụng được (ví dụ lưu thành tệp tin, lưu trong bộ đệm hoặc gửi qua mạng) để sau đó có thể khôi phục lại trạng thái ban đầu trên cùng một máy tính hoặc trên một môi trường máy tính khác. Khi đọc lại kết quả byte theo đúng định dạng tuần tự hóa, có thể dùng nó để tạo ra một bản sao có ngữ nghĩa giống hệt đối tượng ban đầu. Đối với nhiều đối tượng, chẳng hạn các đối tượng phức tạp sử dụng lượng lớn tham chiếu, quá trình tái tạo tuần tự hóa này không hề dễ dàng. Tuần tự hóa đối tượng trong lập trình hướng đối tượng không bao hàm các hàm liên quan đến đối tượng ban đầu trước đó. Quá trình này cũng được gọi là *marshalling* đối tượng. Thao tác ngược lại nhằm trích xuất cấu trúc dữ liệu từ một chuỗi byte là giải tuần tự hóa (còn gọi là *deserialization*, *unmarshalling*).

Tóm lại: **Mục đích chính của Serialization là chuyển đối tượng thành biểu diễn phù hợp để truyền qua mạng hoặc lưu trữ lâu dài vào hệ thống tệp tin, cơ sở dữ liệu, bộ nhớ đệm (cache) và các phương tiện lưu trữ khác.**

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/a478c74d-2c48-40ae-9374-87aacf05188c-92692fb2.png)

<p style="text-align:right;font-size:13px;color:gray">https://www.corejavaguru.com/java/serialization/interview-questions-1</p>

**Giao thức Serialization tương ứng với tầng nào trong mô hình TCP/IP 4 tầng?**

Chúng ta biết hai bên giao tiếp mạng bắt buộc phải sử dụng và tuân thủ cùng một giao thức. Mô hình TCP/IP 4 tầng như sau — vậy giao thức Serialization thuộc tầng nào?

1. Tầng ứng dụng (Application Layer)
2. Tầng giao vận (Transport Layer)
3. Tầng mạng (Network Layer)
4. Tầng giao tiếp mạng (Network Interface Layer)

![Mô hình TCP/IP 4 tầng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/network/tcp-ip-4-model-6284e045.png)

Như hình trên, trong mô hình giao thức OSI 7 tầng, công việc chính mà tầng trình diễn (Presentation Layer) làm là xử lý dữ liệu người dùng của tầng ứng dụng để chuyển đổi thành luồng nhị phân. Ngược lại, nó chuyển đổi luồng nhị phân thành dữ liệu người dùng của tầng ứng dụng. Điều đó chẳng phải tương ứng với Serialization và Deserialization hay sao?

Bởi vì tầng ứng dụng, tầng trình diễn và tầng phiên trong mô hình OSI 7 tầng đều tương ứng với tầng ứng dụng trong mô hình TCP/IP 4 tầng, nên giao thức Serialization thuộc một phần của tầng ứng dụng trong giao thức TCP/IP.

### Nếu có một số trường không muốn thực hiện Serialization thì làm thế nào?

Đối với những biến không muốn thực hiện Serialization, hãy sử dụng từ khóa `transient` để đánh dấu.

Tác dụng của từ khóa `transient` là: ngăn các biến được đánh dấu bằng từ khóa này trong một thể hiện bị tuần tự hóa; khi đối tượng được giải tuần tự hóa, giá trị biến có gắn `transient` sẽ không được lưu trữ bền vững và không được khôi phục.

Cần lưu ý thêm một số điểm về `transient`:

- `transient` chỉ có thể gắn lên biến, không thể gắn lên lớp và phương thức.
- Biến được gắn `transient` sau khi giải tuần tự hóa sẽ được đặt thành giá trị mặc định của kiểu dữ liệu đó. Ví dụ, nếu gắn lên kiểu `int`, thì kết quả sau khi giải tuần tự hóa là `0`.
- Biến `static` do không thuộc về bất kỳ đối tượng (`Object`) nào nên dù có từ khóa `transient` đánh dấu hay không thì đều sẽ không bị tuần tự hóa.

### Các giao thức Serialization phổ biến là gì?

Cách Serialization mặc định của JDK thường không được sử dụng vì hiệu suất tuần tự hóa thấp và tồn tại vấn đề bảo mật. Các giao thức Serialization thường được sử dụng hơn gồm Hessian, Kryo, Protobuf, ProtoStuff — đây đều là các giao thức Serialization dựa trên nhị phân.

Còn những loại như JSON và XML thuộc phương thức tuần tự hóa dạng văn bản. Tuy khả năng đọc khá tốt nhưng hiệu năng kém hơn, nhìn chung ít được lựa chọn.

### Tại sao không khuyến khích sử dụng Serialization mặc định của JDK?

Chúng ta rất ít hoặc gần như không bao giờ dùng trực tiếp cách Serialization có sẵn của JDK, chủ yếu vì những lý do sau:

- **Không hỗ trợ gọi chéo ngôn ngữ (cross-language)**: Nếu gọi sang dịch vụ được phát triển bằng ngôn ngữ khác thì sẽ không được hỗ trợ.
- **Hiệu năng kém**: So với các framework Serialization khác thì hiệu năng thấp hơn, nguyên nhân chính là kích thước mảng byte sau khi tuần tự hóa khá lớn, dẫn đến chi phí truyền tải tăng cao.
- **Tồn tại vấn đề bảo mật**: Bản thân Serialization và Deserialization không có vấn đề gì. Nhưng khi dữ liệu đầu vào để giải tuần tự hóa có thể bị người dùng kiểm soát, kẻ tấn công có thể tạo dữ liệu đầu vào độc hại, khiến quá trình Deserialization sinh ra các đối tượng ngoài dự kiến và thực thi mã tùy ý đã được dựng sẵn trong quá trình đó. Đọc thêm: [An toàn ứng dụng: Nỗi đau từ lỗ hổng Deserialization trong Java](https://cryin.github.io/blog/secure-development-java-deserialization-vulnerability/).

## I/O

Để tìm hiểu chi tiết về I/O, hãy xem các bài viết dưới đây, trong đó đề cập đầy đủ hơn về kiến thức và câu hỏi phỏng vấn.

- [Tổng hợp kiến thức cơ bản về Java I/O](https://javaguide.cn/java/io/io-basis.html)
- [Tổng hợp Design Pattern trong Java I/O](https://javaguide.cn/java/io/io-design-patterns.html)
- [Giải thích chi tiết mô hình Java I/O](https://javaguide.cn/java/io/io-model.html)

### Bạn có nắm rõ về luồng Java I/O không?

IO là viết tắt của `Input/Output`, tức đầu vào và đầu ra. Quá trình đưa dữ liệu vào bộ nhớ máy tính gọi là nhập (Input), ngược lại quá trình xuất ra bộ nhớ ngoài (như cơ sở dữ liệu, tệp tin, máy chủ từ xa) gọi là xuất (Output). Quá trình truyền dữ liệu giống như dòng nước chảy nên gọi là luồng I/O (I/O Stream). Luồng I/O trong Java được chia thành luồng vào và luồng ra, còn xét theo cách xử lý dữ liệu lại chia thành Byte Stream và Character Stream.

Hơn 40 lớp của Java I/O Stream đều được kế thừa từ 4 lớp cơ sở trừu tượng sau đây:

- `InputStream`/`Reader`: Lớp cơ sở của mọi luồng đầu vào; lớp trước là Byte Stream đầu vào, lớp sau là Character Stream đầu vào.
- `OutputStream`/`Writer`: Lớp cơ sở của mọi luồng đầu ra; lớp trước là Byte Stream đầu ra, lớp sau là Character Stream đầu ra.

### Tại sao luồng I/O lại được chia thành Byte Stream và Character Stream?

Bản chất câu hỏi muốn hỏi là: **Dù là đọc ghi tệp tin hay gửi nhận qua mạng, đơn vị lưu trữ nhỏ nhất của thông tin đều là byte, vậy tại sao thao tác luồng I/O lại phải chia thành thao tác Byte Stream và thao tác Character Stream?**

Theo cá nhân tôi, chủ yếu có hai nguyên nhân:

- Character Stream được tạo ra do Java Virtual Machine chuyển đổi từ byte sang, quá trình này tương đối tốn thời gian;
- Nếu chúng ta không biết kiểu mã hóa (encoding) thì trong quá trình sử dụng Byte Stream rất dễ xảy ra lỗi ký tự bị biến dạng (lỗi font).

### Các Design Pattern có trong Java I/O là gì?

Đáp án tham khảo: [Tổng hợp Design Pattern trong Java I/O](https://javaguide.cn/java/io/io-design-patterns.html)

### ⭐️ Sự khác biệt giữa BIO, NIO và AIO là gì?

Đáp án tham khảo: [Giải thích chi tiết mô hình Java I/O](https://javaguide.cn/java/io/io-model.html)

## Syntactic Sugar

### Syntactic Sugar là gì?

**Syntactic Sugar (cú pháp rút gọn)** chỉ một loại cú pháp đặc biệt được ngôn ngữ lập trình thiết kế nhằm giúp lập trình viên phát triển chương trình thuận tiện hơn; loại cú pháp này không ảnh hưởng đến chức năng của ngôn ngữ lập trình. Để hiện thực cùng một chức năng, mã viết dựa trên Syntactic Sugar thường đơn giản, súc tích và dễ đọc hơn.

Ví dụ, `for-each` trong Java là một Syntactic Sugar thường dùng, nguyên lý của nó thực chất dựa trên vòng lặp `for` thông thường và Iterator.

```java
String[] strs = {"JavaGuide", "公众号：JavaGuide", "博客：https://javaguide.cn/"};
for (String s : strs) {
    System.out.println(s);
}
```

Tuy nhiên, JVM thực tế không thể nhận diện Syntactic Sugar. Để Syntactic Sugar của Java có thể chạy đúng, trước tiên nó cần được trình biên dịch giải mã (desugar), tức là trong giai đoạn biên dịch chuyển đổi nó sang cú pháp cơ bản mà JVM hiểu được. Điều này cũng gián tiếp cho thấy thứ thực sự hỗ trợ Syntactic Sugar trong Java là trình biên dịch Java chứ không phải JVM. Nếu bạn xem mã nguồn của `com.sun.tools.javac.main.JavaCompiler`, bạn sẽ thấy trong `compile()` có một bước là gọi `desugar()`, phương thức này chính là nơi chịu trách nhiệm thực hiện giải mã Syntactic Sugar.

### Những Syntactic Sugar phổ biến trong Java là gì?

Các Syntactic Sugar được sử dụng phổ biến nhất trong Java chủ yếu gồm Generics, autoboxing/unboxing, tham số biến thiên (varargs), Enum, Inner Class, vòng lặp `for` cải tiến, cú pháp `try-with-resources`, biểu thức Lambda, v.v.

Để tìm hiểu chi tiết về các Syntactic Sugar này, hãy xem bài viết [Giải thích chi tiết Java Syntactic Sugar](./syntactic-sugar.md).
