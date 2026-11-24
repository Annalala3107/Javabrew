---
title: Giải thích chi tiết cơ chế truyền tham trị (Pass-by-Value) trong Java
description: "Phân tích sâu vì sao Java chỉ có truyền tham trị (pass-by-value): làm rõ cơ chế truyền tham số trong Java qua các ví dụ cụ thể, giải đáp hiểu nhầm phổ biến giữa truyền tham trị và truyền tham chiếu, đồng thời nắm vững bản chất khác nhau giữa tham số hình thức và đối số thực tế."
category: Java
tag:
  - Java cơ bản
lang: vi
sourceRef: zh-ref/java/basis/why-there-only-value-passing-in-java.md
head:
  - - meta
    - name: keywords
      content: truyền tham trị Java,truyền tham chiếu,truyền tham số,tham số hình thức và đối số thực tế,tham chiếu đối tượng,gọi phương thức,cơ chế truyền tham số Java
---

Trước khi bắt đầu, hãy cùng làm rõ hai cặp khái niệm dưới đây:

- Tham số hình thức (Parameters) & Đối số thực tế (Arguments)
- Truyền tham trị (pass-by-value) & Truyền tham chiếu (pass-by-reference)

## Tham số hình thức & Đối số thực tế

Phần định nghĩa phương thức có thể sử dụng **tham số** (phương thức có tham số). Trong ngôn ngữ lập trình, tham số được chia thành:

- **Đối số thực tế (Actual Arguments / Arguments)**: Giá trị được truyền vào hàm/phương thức, bắt buộc phải có giá trị xác định.
- **Tham số hình thức (Formal Parameters / Parameters)**: Dùng khi định nghĩa hàm/phương thức để tiếp nhận đối số thực tế, không cần có giá trị xác định trước.

```java
String hello = "Hello!";
// hello là đối số thực tế (argument)
sayHello(hello);
// str là tham số hình thức (parameter)
void sayHello(String str) {
    System.out.println(str);
}
```

## Truyền tham trị (pass-by-value) & Truyền tham chiếu (pass-by-reference)

Các ngôn ngữ lập trình có hai cách truyền đối số thực tế vào phương thức (hoặc hàm):

- **Truyền tham trị (pass-by-value)**: Phương thức nhận được bản sao giá trị của đối số thực tế, tức là tạo ra một bản copy.
- **Truyền tham chiếu (pass-by-reference)**: Phương thức nhận trực tiếp địa chỉ bộ nhớ của đối số thực tế chứ không phải giá trị bên trong nó (đây chính là cơ chế con trỏ/bí danh). Lúc này tham số hình thức chính là đối số thực tế, mọi thay đổi trên tham số hình thức đều phản ánh trực tiếp lên đối số thực tế, bao gồm cả việc gán lại giá trị mới.

Nhiều ngôn ngữ lập trình (như C++, Pascal) cung cấp cả hai cách truyền tham số; tuy nhiên, trong Java chỉ có truyền tham trị (pass-by-value).

## Vì sao Java chỉ có truyền tham trị?

**Vì sao nói Java chỉ có truyền tham trị?** Không cần dài dòng, tôi sẽ chứng minh cho bạn thấy qua 3 ví dụ dưới đây.

### Ví dụ 1: Truyền tham số kiểu nguyên thủy (Primitive Type)

Mã nguồn:

```java
public static void main(String[] args) {
    int num1 = 10;
    int num2 = 20;
    swap(num1, num2);
    System.out.println("num1 = " + num1);
    System.out.println("num2 = " + num2);
}

public static void swap(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
    System.out.println("a = " + a);
    System.out.println("b = " + b);
}
```

Kết quả đầu ra:

```plain
a = 20
b = 10
num1 = 10
num2 = 20
```

Phân tích:

Trong phương thức `swap()`, việc hoán đổi giá trị của `a` và `b` không hề ảnh hưởng đến `num1` và `num2`. Bởi vì giá trị của `a` và `b` chỉ được sao chép từ `num1` và `num2` sang. Nói cách khác, `a` và `b` tương đương với bản sao của `num1` và `num2`; nội dung bản sao có bị sửa đổi thế nào đi nữa cũng không bao giờ làm thay đổi bản gốc.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/java-value-passing-01-2909fc2c.png)

Qua ví dụ trên, chúng ta đã biết một phương thức không thể làm thay đổi tham số có kiểu dữ liệu nguyên thủy. Nhưng khi tham số là tham chiếu đối tượng thì lại khác — hãy xem Ví dụ 2.

### Ví dụ 2: Truyền tham số kiểu tham chiếu (1)

Mã nguồn:

```java
  public static void main(String[] args) {
      int[] arr = { 1, 2, 3, 4, 5 };
      System.out.println(arr[0]);
      change(arr);
      System.out.println(arr[0]);
  }

  public static void change(int[] array) {
      // Đổi phần tử đầu tiên của mảng thành 0
      array[0] = 0;
  }
```

Kết quả đầu ra:

```plain
1
0
```

Phân tích:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/java-value-passing-02-ba12c098.png)

Sau khi xem ví dụ này, chắc hẳn nhiều người sẽ nghĩ rằng Java áp dụng cơ chế truyền tham chiếu đối với các tham số kiểu tham chiếu.

Thực tế không phải vậy; thứ được truyền ở đây vẫn là **giá trị**, chỉ có điều giá trị này là bản sao của tham chiếu đối tượng.

Nói cách khác, tham số của phương thức `change` sao chép giá trị tham chiếu được lưu trong `arr`, do đó cả tham số hình thức và `arr` đều trỏ đến cùng một đối tượng mảng. Điều này giải thích vì sao việc thay đổi nội dung mảng thông qua tham số hình thức lại có thể được quan sát thấy từ phía lời gọi hàm.

Để bác bỏ mạnh mẽ hơn nữa quan điểm cho rằng Java dùng truyền tham chiếu cho các tham số kiểu tham chiếu, hãy cùng xem tiếp ví dụ dưới đây!

### Ví dụ 3: Truyền tham số kiểu tham chiếu (2)

```java
public class Person {
    private String name;
   // Lược bỏ constructor và các phương thức Getter/Setter
}

public static void main(String[] args) {
    Person xiaoZhang = new Person("小张");
    Person xiaoLi = new Person("小李");
    swap(xiaoZhang, xiaoLi);
    System.out.println("xiaoZhang:" + xiaoZhang.getName());
    System.out.println("xiaoLi:" + xiaoLi.getName());
}

public static void swap(Person person1, Person person2) {
    Person temp = person1;
    person1 = person2;
    person2 = temp;
    System.out.println("person1:" + person1.getName());
    System.out.println("person2:" + person2.getName());
}
```

Kết quả đầu ra:

```plain
person1:小李
person2:小张
xiaoZhang:小张
xiaoLi:小李
```

Phân tích:

Chuyện gì xảy ra vậy??? Hai tham số hình thức kiểu tham chiếu đã hoán đổi cho nhau nhưng lại không hề ảnh hưởng tới hai đối số thực tế!

Tham số `person1` và `person2` của phương thức `swap` chỉ sao chép giá trị tham chiếu được lưu trong đối số `xiaoZhang` và `xiaoLi`. Do đó, việc hoán đổi `person1` và `person2` thực chất chỉ là hoán đổi hai bản sao tham chiếu mà mỗi tham số hình thức đang giữ, hoàn toàn không làm thay đổi giá trị của biến `xiaoZhang` và `xiaoLi` ở phía gọi hàm.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/java-value-passing-03-46cd446e.png)

## Truyền tham chiếu thực sự trông như thế nào?

Đến đây, tin rằng bạn đã biết Java chỉ có truyền tham trị (pass-by-value), hoàn toàn không có truyền tham chiếu (pass-by-reference).
Tuy vậy, truyền tham chiếu thực sự trông như thế nào? Dưới đây là một đoạn mã `C++` làm ví dụ để bạn thấy rõ diện mạo thật sự của cơ chế truyền tham chiếu.

```C++
#include <iostream>

void incr(int& num)
{
    std::cout << "incr before: " << num << "\n";
    num++;
    std::cout << "incr after: " << num << "\n";
}

int main()
{
    int age = 10;
    std::cout << "invoke before: " << age << "\n";
    incr(age);
    std::cout << "invoke after: " << age << "\n";
}
```

Kết quả đầu ra:

```plain
invoke before: 10
incr before: 10
incr after: 11
invoke after: 11
```

Phân tích: Có thể thấy trong hàm `incr`, việc sửa đổi tham số hình thức đã làm thay đổi giá trị của đối số thực tế. Cần lưu ý rằng kiểu dữ liệu tham số hình thức của `incr` ở đây là `int&` thì mới là truyền tham chiếu; nếu dùng `int` thì vẫn chỉ là truyền tham trị mà thôi!

## Vì sao Java không đưa vào cơ chế truyền tham chiếu?

Truyền tham chiếu nghe có vẻ rất tiện vì có thể sửa thẳng giá trị của đối số thực tế ngay bên trong phương thức, vậy tại sao Java lại không hỗ trợ cơ chế này?

**Lưu ý: Dưới đây là quan điểm cá nhân, không phải tuyên bố chính thức từ Java:**

1. Vì lý do an toàn: những thao tác bên trong phương thức tác động lên giá trị là điều mà bên gọi không thể biết trước (phương thức được định nghĩa như một giao diện/hợp đồng, phía gọi không cần quan tâm chi tiết cài đặt bên trong). Hãy thử tưởng tượng bạn cầm thẻ ngân hàng đi rút tiền: yêu cầu rút 100 nhưng tài khoản bị trừ 200 thì thật đáng sợ phải không nào!
2. James Gosling — cha đẻ của Java — ngay từ khi thiết kế ban đầu đã nhìn thấy rất nhiều bất cập của C và C++, nên mới muốn thiết kế ra một ngôn ngữ mới là Java. Khi thiết kế Java, ông tuân theo nguyên tắc đơn giản, dễ dùng và loại bỏ nhiều "tính năng" mà chỉ cần lập trình viên sơ sẩy một chút là gây ra lỗi. Bản thân ngôn ngữ gọn nhẹ hơn thì lượng kiến thức lập trình viên cần học cũng ít đi.

## Tổng kết

Cách Java truyền đối số thực tế vào phương thức (hoặc hàm) là **truyền tham trị (pass-by-value)**:

- Nếu tham số là kiểu nguyên thủy (primitive type), mọi thứ rất đơn giản: giá trị được truyền đi chính là bản sao giá trị literal của kiểu nguyên thủy đó.
- Nếu tham số là kiểu tham chiếu (reference type), giá trị được truyền đi là bản sao của giá trị tham chiếu. Tham số hình thức và đối số thực tế ban đầu cùng trỏ đến một đối tượng, nhưng việc gán lại giá trị mới cho tham số hình thức sẽ không làm thay đổi biến đối số thực tế.

## Tham khảo

- *Core Java, Volume I — Fundamentals*, Ấn bản lần thứ 10, Chương 4, Mục 4.5
- [Java là truyền tham trị hay truyền tham chiếu? - Câu trả lời của Hollis - Zhihu](https://www.zhihu.com/question/31203609/answer/576030121)
- [Oracle Java Tutorials - Passing Information to a Method or a Constructor](https://docs.oracle.com/javase/tutorial/java/javaOO/arguments.html)
- [Interview with James Gosling, Father of Java](https://mappingthejourney.com/single-post/2017/06/29/episode-3-interview-with-james-gosling-father-of-java/)
