---
title: "Tính năng mới Java 21 (JDK 21): Virtual Thread, Generational ZGC và Sequenced Collections"
description: "Giải thích chi tiết các tính năng mới của Java 21 (JDK 21), bao gồm Virtual Thread, Generational ZGC, Sequenced Collections, Record Patterns, Pattern Matching cho switch, chu kỳ hỗ trợ LTS và lưu ý về tính năng Preview String Templates đã bị rút lại."
category: Java
tag:
  - Tính năng mới Java
head:
  - - meta
    - name: keywords
      content: Java 21,JDK 21,tính năng mới JDK 21,tính năng mới Java 21,LTS,Virtual Thread,Sequenced Collections,Generational ZGC,Record Patterns,Pattern Matching cho switch,String Templates,Foreign Function & Memory API
lang: vi
sourceRef: zh-ref/java/new-features/java21.md
---

Java 21 (JDK 21) chính thức phát hành vào ngày 19/09/2023 và là phiên bản hỗ trợ dài hạn (LTS) được Oracle xác nhận.

Theo lộ trình hỗ trợ Java SE (Java SE Support Roadmap) của Oracle cập nhật vào tháng 4/2026, Oracle JDK 21 được hỗ trợ Premier Support đến tháng 9/2028 và Extended Support đến tháng 9/2031. Chu kỳ cập nhật miễn phí và hỗ trợ thương mại của các bản phân phối JDK khác nhau có thể khác nhau.

JDK 21 có tổng cộng 15 tính năng mới. Bài viết này sẽ chọn lọc những tính năng quan trọng hơn để giới thiệu chi tiết:

- [JEP 430: String Templates (Chuỗi mẫu)](https://openjdk.org/jeps/430) (Preview)
- [JEP 431: Sequenced Collections (Collection có thứ tự)](https://openjdk.org/jeps/431)
- [JEP 439: Generational ZGC (ZGC phân thế hệ)](https://openjdk.org/jeps/439)
- [JEP 440: Record Patterns (Mẫu bản ghi)](https://openjdk.org/jeps/440)
- [JEP 441: Pattern Matching for switch (Pattern Matching cho switch)](https://openjdk.org/jeps/441)
- [JEP 442: Foreign Function & Memory API](https://openjdk.org/jeps/442) (Preview lần 3)
- [JEP 443: Unnamed Patterns and Variables (Mẫu và biến ẩn danh)](https://openjdk.org/jeps/443) (Preview)
- [JEP 444: Virtual Threads (Luồng ảo)](https://openjdk.org/jeps/444)
- [JEP 445: Unnamed Classes and Instance Main Methods (Lớp ẩn danh và phương thức main thể hiện)](https://openjdk.org/jeps/445) (Preview)

Nếu chủ yếu quan tâm đến việc nâng cấp hệ thống production, bạn có thể xem trước Sequenced Collections, Generational ZGC và Virtual Thread. String Templates chỉ được cung cấp dưới dạng bản thử nghiệm Preview trong JDK 21 và JDK 22; đề xuất sau đó đã bị rút lại nên các phiên bản JDK hiện tại không còn cung cấp bộ API và cú pháp này nữa.

Biểu đồ dưới đây thống kê số lượng tính năng mới và thời gian phát hành của từng phiên bản từ JDK 8 đến JDK 24:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 430: String Templates (Preview)

String Templates (chuỗi mẫu) là một tính năng Preview trong JDK 21. Tính năng này tiếp tục có bản Preview lần 2 trong JDK 22 nhưng sau đó đã bị rút lại, vì vậy các phiên bản JDK hiện tại không còn hỗ trợ bộ API và cú pháp này.

String Templates từng cung cấp một cách ngắn gọn và trực quan hơn để xây dựng chuỗi động. Cú pháp Preview của JDK 21 sử dụng `\{biểu thức}` làm biểu thức nhúng và được bộ xử lý mẫu (template processor) xử lý. Biểu thức hỗ trợ biến cục bộ, trường static hoặc non-static, lời gọi phương thức và kết quả tính toán.

Thực tế, String Templates đã tồn tại trong hầu hết các ngôn ngữ lập trình khác:

```typescript
"Greetings {{ name }}!";  //Angular
`Greetings ${ name }!`;    //Typescript
$"Greetings { name }!"    //Visual basic
f"Greetings { name }!"    //Python
```

Trước khi có String Templates trong Java, chúng ta thường dùng phép nối chuỗi hoặc các phương thức định dạng để tạo chuỗi:

```java
//concatenation
message = "Greetings " + name + "!";

//String.format()
message = String.format("Greetings %s!", name);  //concatenation

//MessageFormat
message = new MessageFormat("Greetings {0}!").format(name);

//StringBuilder
message = new StringBuilder().append("Greetings ").append(name).append("!").toString();
```

Các cách làm này ít nhiều đều có nhược điểm như khó đọc, dài dòng hoặc phức tạp.

Khi dùng String Templates để nối chuỗi trong Java, bạn có thể nhúng trực tiếp biểu thức vào trong chuỗi mà không cần bước xử lý bổ sung:

```java
String message = STR."Greetings \{name}!";
```

Trong biểu thức mẫu ở trên:

- `STR` là template processor (bộ xử lý mẫu).
- `\{name}` là biểu thức nhúng; tại runtime, các biểu thức này sẽ được thay thế bằng giá trị biến tương ứng.

Java từng hỗ trợ ba template processor mặc định:

- `STR`: Tự động thực hiện nội suy chuỗi (string interpolation), tức là thay thế từng biểu thức nhúng trong mẫu bằng giá trị của nó (được chuyển thành chuỗi).
- `FMT`: Tương tự `STR`, nhưng còn chấp nhận các chuỗi đặc tả định dạng (format specifier) đặt ở bên trái biểu thức nhúng để kiểm soát kiểu định dạng đầu ra.
- `RAW`: Không tự động xử lý chuỗi mẫu như `STR` và `FMT`, mà trả về một đối tượng `StringTemplate` chứa thông tin về văn bản và các biểu thức trong mẫu.

```java
String name = "Lokesh";

//STR
String message = STR."Greetings \{name}.";

//FMT
String message = FMT."Greetings %-12s\{name}.";

//RAW
StringTemplate st = RAW."Greetings \{name}.";
String message = STR.process(st);
```

Ngoài ba template processor tích hợp sẵn trong JDK, bạn cũng có thể tự tạo template processor riêng bằng cách implement interface `StringTemplate.Processor` rồi cài đặt phương thức `process`.

Chúng ta có thể dùng biến cục bộ, trường static/non-static hoặc thậm chí lời gọi phương thức làm biểu thức nhúng:

```java
//variable
message = STR."Greetings \{name}!";

//method
message = STR."Greetings \{getName()}!";

//field
message = STR."Greetings \{this.name}!";
```

Cũng có thể thực hiện phép tính ngay trong biểu thức và in ra kết quả:

```java
int x = 10, y = 20;
String s = STR."\{x} + \{y} = \{x + y}";  //"10 + 20 = 30"
```

Để tăng tính dễ đọc, chúng ta có thể tách biểu thức nhúng thành nhiều dòng:

```java
String time = STR."The current time is \{
    //sample comment - current time in HH:mm:ss
    DateTimeFormatter
      .ofPattern("HH:mm:ss")
      .format(LocalTime.now())
  }.";
```

## JEP 431: Sequenced Collections (Collection có thứ tự)

JDK 21 giới thiệu một nhóm interface Collection mới: **Sequenced Collections** (Collection có thứ tự). Nhóm Collection này có thứ tự duyệt xác định (encounter order) và cung cấp các phương thức truy cập phần tử đầu/cuối cũng như lấy view đảo ngược (reversed view).

Sequenced Collections bao gồm ba interface sau:

- [`SequencedCollection`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedCollection.html)
- [`SequencedSet`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedSet.html)
- [`SequencedMap`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedMap.html)

Interface `SequencedCollection` kế thừa `Collection`, cung cấp các phương thức truy cập, thêm hoặc xóa phần tử ở cả hai đầu của Collection và lấy view đảo ngược của Collection.

```java
interface SequencedCollection<E> extends Collection<E> {

  // New Method

  SequencedCollection<E> reversed();

  // Promoted methods from Deque<E>

  void addFirst(E);
  void addLast(E);

  E getFirst();
  E getLast();

  E removeFirst();
  E removeLast();
}
```

Hai interface `List` và `Deque` đều kế thừa `SequencedCollection`.

Dưới đây là ví dụ minh họa thực tế với `ArrayList`:

```java
ArrayList<Integer> arrayList = new ArrayList<>();

arrayList.add(1);   // List contains: [1]

arrayList.addFirst(0);  // List contains: [0, 1]
arrayList.addLast(2);   // List contains: [0, 1, 2]

Integer firstElement = arrayList.getFirst();  // 0
Integer lastElement = arrayList.getLast();  // 2

List<Integer> reversed = arrayList.reversed();
System.out.println(reversed); // Prints [2, 1, 0]
```

Interface `SequencedSet` kế thừa trực tiếp `SequencedCollection` và ghi đè (`Override`) phương thức `reversed()`.

```java
interface SequencedSet<E> extends SequencedCollection<E>, Set<E> {

    SequencedSet<E> reversed();
}
```

Interface `SortedSet` kế thừa `SequencedSet`, còn `LinkedHashSet` triển khai `SequencedSet`.

Dưới đây là ví dụ minh họa thực tế với `LinkedHashSet`:

```java
LinkedHashSet<Integer> linkedHashSet = new LinkedHashSet<>(List.of(1, 2, 3));

Integer firstElement = linkedHashSet.getFirst();   // 1
Integer lastElement = linkedHashSet.getLast();    // 3

linkedHashSet.addFirst(0);  //List contains: [0, 1, 2, 3]
linkedHashSet.addLast(4);   //List contains: [0, 1, 2, 3, 4]

System.out.println(linkedHashSet.reversed());   //Prints [4, 3, 2, 1, 0]
```

Interface `SequencedMap` kế thừa `Map`, cung cấp các phương thức truy cập, thêm hoặc xóa cặp key-value ở cả hai đầu, lấy `SequencedSet` chứa các key, `SequencedCollection` chứa các value, `SequencedSet` chứa các entry (cặp key-value), cũng như lấy view đảo ngược của Map.

```java
interface SequencedMap<K,V> extends Map<K,V> {

  // New Methods

  SequencedMap<K,V> reversed();

  SequencedSet<K> sequencedKeySet();
  SequencedCollection<V> sequencedValues();
  SequencedSet<Entry<K,V>> sequencedEntrySet();

  V putFirst(K, V);
  V putLast(K, V);


  // Promoted Methods from NavigableMap<K, V>

  Entry<K, V> firstEntry();
  Entry<K, V> lastEntry();

  Entry<K, V> pollFirstEntry();
  Entry<K, V> pollLastEntry();
}
```

Interface `SortedMap` kế thừa `SequencedMap`, còn `LinkedHashMap` triển khai `SequencedMap`.

Dưới đây là ví dụ minh họa thực tế với `LinkedHashMap`:

```java
LinkedHashMap<Integer, String> map = new LinkedHashMap<>();

map.put(1, "One");
map.put(2, "Two");
map.put(3, "Three");

map.firstEntry();   //1=One
map.lastEntry();    //3=Three

System.out.println(map);  //{1=One, 2=Two, 3=Three}

Map.Entry<Integer, String> first = map.pollFirstEntry();   //1=One
Map.Entry<Integer, String> last = map.pollLastEntry();    //3=Three

System.out.println(map);  //{2=Two}

map.putFirst(1, "One");     //{1=One, 2=Two}
map.putLast(3, "Three");    //{1=One, 2=Two, 3=Three}

System.out.println(map);  //{1=One, 2=Two, 3=Three}
System.out.println(map.reversed());   //{3=Three, 2=Two, 1=One}
```

## JEP 439: Generational ZGC (ZGC phân thế hệ)

JDK 21 mở rộng ZGC bằng việc bổ sung tính năng Garbage Collection phân thế hệ (Generational GC). Tuy nhiên, tính năng này mặc định đang tắt và cần bật qua cấu hình tham số JVM:

```bash
# Bật Generational ZGC trong JDK 21
java -XX:+UseZGC -XX:+ZGenerational ...
```

Các phiên bản tiếp theo đã hoàn tất lộ trình tiến hóa hai bước này: JDK 23 thông qua [JEP 474](https://openjdk.org/jeps/474) đã đặt chế độ phân thế hệ làm chế độ mặc định của ZGC, và JDK 24 thông qua [JEP 490](https://openjdk.org/jeps/490) đã gỡ bỏ chế độ không phân thế hệ. Do đó, từ JDK 23 trở đi, chỉ cần dùng `-XX:+UseZGC` là đã kích hoạt Generational ZGC mà không cần thêm `-XX:+ZGenerational`. Điều này không có nghĩa JVM mặc định chọn ZGC; JDK 21 và 22 vẫn phải bật chế độ phân thế hệ một cách tường minh theo lệnh ở trên.

Generational ZGC vừa giữ nguyên mục tiêu độ trễ tạm dừng thấp (low-pause) của ZGC, vừa thu gom thường xuyên hơn các đối tượng non trẻ (young objects) để giảm nguy cơ tắc nghẽn cấp phát (allocation stall), giảm dung lượng bộ nhớ Heap cần thiết và nâng cao thông lượng (throughput).

## JEP 440: Record Patterns (Mẫu bản ghi)

Record Patterns trải qua bản Preview lần 1 trong Java 19 qua [JEP 405](https://openjdk.org/jeps/405), và bản Preview lần 2 trong JDK 20 qua [JEP 432](https://openjdk.org/jeps/432). Cuối cùng, Record Patterns đã chính thức được chuẩn hóa (finalized) trong JDK 21.

Bài [Tổng quan tính năng mới Java 20](./java20.md) đã giới thiệu chi tiết về Record Patterns nên mình không lặp lại ở đây.

## JEP 441: Pattern Matching for switch (Pattern Matching cho switch)

Cải tiến biểu thức và câu lệnh `switch` trong Java, cho phép sử dụng pattern trong các nhãn `case`. Khi pattern khớp, đoạn mã tương ứng với nhãn `case` đó sẽ được thực thi.

Trong đoạn code dưới đây, biểu thức `switch` sử dụng Type Pattern để đối khớp:

```java
static String formatterPatternSwitch(Object obj) {
    return switch (obj) {
        case Integer i -> String.format("int %d", i);
        case Long l    -> String.format("long %d", l);
        case Double d  -> String.format("double %f", d);
        case String s  -> String.format("String %s", s);
        default        -> obj.toString();
    };
}
```

## JEP 442: Foreign Function & Memory API (Preview lần 3)

Thông qua API này, chương trình Java có thể tương tác với mã và dữ liệu nằm ngoài Java runtime. Bằng cách gọi các hàm bên ngoài (foreign functions — mã nằm ngoài JVM) một cách hiệu quả và truy cập an toàn vào bộ nhớ bên ngoài (foreign memory — bộ nhớ không do JVM quản lý), API này cho phép chương trình Java gọi các thư viện native và xử lý dữ liệu native mà không nguy hiểm hay dễ lỗi như JNI.

Foreign Function & Memory API trải qua vòng Incubator lần 1 trong Java 17 qua [JEP 412](https://openjdk.java.net/jeps/412), vòng Incubator lần 2 trong Java 18 qua [JEP 419](https://openjdk.org/jeps/419), bản Preview lần 1 trong Java 19 qua [JEP 424](https://openjdk.org/jeps/424), bản Preview lần 2 trong JDK 20 qua [JEP 434](https://openjdk.org/jeps/434) và bản Preview lần 3 trong JDK 21 qua [JEP 442](https://openjdk.org/jeps/442).

Mình đã giới thiệu chi tiết về Foreign Function & Memory API trong bài [Tổng quan tính năng mới Java 19](./java19.md), nên sẽ không lặp lại thêm ở đây.

## JEP 443: Unnamed Patterns and Variables (Mẫu và biến ẩn danh, Preview)

Unnamed Patterns and Variables cho phép sử dụng dấu gạch dưới `_` để biểu thị các biến không đặt tên và các thành phần không sử dụng khi thực hiện Pattern Matching, nhằm nâng cao tính dễ đọc và khả năng bảo trì của code.

Các tình huống tiêu biểu cho biến ẩn danh (unnamed variables) là câu lệnh `try-with-resources`, biến ngoại lệ trong mệnh đề `catch` và vòng lặp `for`. Khi không cần sử dụng đến biến, bạn có thể thay bằng dấu gạch dưới `_` để đánh dấu rõ ràng rằng biến đó không được dùng tới.

```java
try (var _ = ScopedContext.acquire()) {
  // No use of acquired resource
}
try { ... }
catch (Exception _) { ... }
catch (Throwable _) { ... }

for (int i = 0, _ = runOnce(); i < arr.length; i++) {
  ...
}
```

Unnamed Pattern là một mẫu vô điều kiện (unconditional pattern) và không gắn kết (bind) bất kỳ giá trị nào. Biến mẫu ẩn danh xuất hiện bên trong các Type Pattern:

```java
if (r instanceof ColoredPoint(_, Color c)) { ... c ... }

switch (b) {
    case Box(RedBall _), Box(BlueBall _) -> processBox(b);
    case Box(GreenBall _)                -> stopProcessing();
    case Box(_)                          -> pickAnotherBox();
}
```

## JEP 444: Virtual Threads (Luồng ảo)

Virtual Thread là một bản cập nhật cực kỳ quan trọng, nhất định phải đặc biệt chú ý!

Virtual Thread đã có bản Preview lần 1 trong Java 19 qua [JEP 425](https://openjdk.org/jeps/425) và bản Preview lần 2 trong JDK 20. Cuối cùng, Virtual Thread đã chính thức được chuẩn hóa trong JDK 21.

Bài [Tổng quan tính năng mới Java 20](./java20.md) đã giới thiệu chi tiết về Virtual Thread nên mình không lặp lại ở đây.

## JEP 445: Unnamed Classes and Instance Main Methods (Lớp ẩn danh và phương thức main thể hiện, Preview)

Tính năng này chủ yếu nhằm đơn giản hóa cách khai báo phương thức `main`. Đối với người mới học Java, cú pháp khai báo phương thức `main` truyền thống đưa vào quá nhiều khái niệm cú pháp Java cùng lúc, gây khó khăn cho việc tiếp cận nhanh.

Khai báo phương thức `main` trước khi dùng tính năng này:

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

Khai báo phương thức `main` sau khi sử dụng tính năng mới này:

```java
class HelloWorld {
    void main() {
        System.out.println("Hello, World!");
    }
}
```

Tinh gọn thêm nữa (Unnamed Class cho phép bỏ luôn việc định nghĩa tên lớp):

```java
void main() {
   System.out.println("Hello, World!");
}
```

## Tài liệu tham khảo

- Java 21 String Templates: <https://howtodoinjava.com/java/java-string-templates/>
- Java 21 Sequenced Collections: <https://howtodoinjava.com/java/sequenced-collections/>
