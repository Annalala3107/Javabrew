---
title: Giải thích chi tiết về cơ chế Reflection trong Java
description: "Phân tích chuyên sâu nguyên lý và ứng dụng của cơ chế Reflection trong Java: nắm vững các API cốt lõi như Class, Method, Field, hiểu cách Reflection được sử dụng trong các framework như Spring, MyBatis và tìm hiểu cách cài đặt Dynamic Proxy."
category: Java
tag:
  - Java cơ bản
lang: vi
sourceRef: zh-ref/java/basis/reflection.md
head:
  - - meta
    - name: keywords
      content: Java Reflection,cơ chế Reflection,lớp Class,phương thức Method,trường Field,Dynamic Proxy,nguyên lý framework,thao tác runtime
---

## Reflection là gì?

Nếu bạn đã từng tìm hiểu nguyên lý tầng dưới của các framework hoặc tự tay viết framework, chắc hẳn bạn không còn xa lạ với khái niệm Reflection.

Reflection được mệnh danh là "linh hồn của các framework", chủ yếu vì nó trao cho chúng ta khả năng phân tích lớp (`Class`) và gọi thực thi phương thức của lớp ngay tại thời điểm runtime.

Thông qua Reflection, ta có thể lấy thông tin các trường (`Field`), phương thức (`Method`), hàm tạo (`Constructor`), v.v. của một lớp, đồng thời thực hiện gọi hàm hoặc đọc/ghi dữ liệu trong phạm vi mà cơ chế kiểm soát truy cập và ranh giới module cho phép. Phạm vi trả về của các API cũng khác nhau: ví dụ `getMethods()` trả về các phương thức `public` có thể truy cập (bao gồm cả phương thức kế thừa), còn `getDeclaredMethods()` trả về tất cả phương thức được khai báo trực tiếp trong lớp hiện tại nhưng không bao gồm phương thức kế thừa.

## Các tình huống ứng dụng của Reflection là gì?

Trong công việc hằng ngày, phần lớn thời gian chúng ta viết code nghiệp vụ nên rất ít khi phải đụng trực tiếp đến cơ chế Reflection.

Tuy nhiên, điều đó không có nghĩa là Reflection vô dụng. Ngược lại, chính nhờ có Reflection mà bạn mới có thể sử dụng các framework một cách nhẹ nhàng như vậy. Những framework như Spring/Spring Boot, MyBatis đều sử dụng Reflection với tần suất rất cao.

**Các framework này cũng sử dụng rất nhiều Dynamic Proxy, mà bản thân cách cài đặt Dynamic Proxy lại phụ thuộc vào Reflection.**

Ví dụ dưới đây là đoạn mã cài đặt Dynamic Proxy bằng JDK, trong đó sử dụng lớp Reflection `Method` để gọi tới phương thức đích được chỉ định.

```java
public class DebugInvocationHandler implements InvocationHandler {
    /**
     * Đối tượng thực tế (target) trong lớp proxy
     */
    private final Object target;

    public DebugInvocationHandler(Object target) {
        this.target = target;
    }


    public Object invoke(Object proxy, Method method, Object[] args) throws InvocationTargetException, IllegalAccessException {
        System.out.println("before method " + method.getName());
        Object result = method.invoke(target, args);
        System.out.println("after method " + method.getName());
        return result;
    }
}

```

Ngoài ra, một "vũ khí lợi hại" khác trong Java là **Annotation** cũng sử dụng Reflection để hiện thực hóa.

Vì sao khi dùng Spring, chỉ một annotation `@Component` đã có thể khai báo một lớp trở thành Spring Bean? Vì sao chỉ thông qua annotation `@Value` lại đọc được giá trị từ file cấu hình? Rốt cuộc mọi thứ hoạt động ra sao?

Tất cả đều nhờ việc bạn có thể phân tích lớp dựa trên Reflection, từ đó lấy được các annotation gắn trên lớp, thuộc tính, phương thức hoặc tham số của phương thức. Sau khi lấy được annotation, bạn có thể thực hiện các bước xử lý tiếp theo.

## Bàn về ưu và nhược điểm của cơ chế Reflection

**Ưu điểm**: Giúp mã nguồn trở nên linh hoạt hơn nhiều, tạo điều kiện thuận lợi để các framework cung cấp những tính năng dùng ngay (out-of-the-box).

**Nhược điểm**: Việc cho phép phân tích và thao tác với lớp tại thời điểm runtime cũng làm phát sinh thêm vấn đề bảo mật. Ví dụ: có thể bỏ qua bước kiểm tra an toàn của tham số kiểu Generics (việc kiểm tra an toàn kiểu Generics diễn ra ở thời điểm biên dịch). Bên cạnh đó, hiệu năng của Reflection cũng kém hơn một chút; tuy nhiên, đối với các framework thì ảnh hưởng này trên thực tế không đáng kể. Đọc thêm: [Java Reflection: Why is it so slow?](https://stackoverflow.com/questions/1392351/java-reflection-why-is-it-so-slow)

## Thực hành Reflection

### Bốn cách lấy đối tượng Class

Để truy xuất động các thông tin của lớp, chúng ta cần dựa vào đối tượng `Class`. Đối tượng lớp `Class` cung cấp thông tin về phương thức, biến, v.v. của một lớp cho chương trình đang chạy. Java cung cấp bốn cách để lấy đối tượng `Class`:

**1. Khi đã biết rõ lớp cụ thể tại thời điểm biên dịch, có thể dùng trực tiếp class literal:**

```java
Class alunbarClass = TargetObject.class;
```

Cách này phù hợp với tình huống đã biết kiểu cụ thể ngay lúc biên dịch; bản thân việc lấy class literal không kích hoạt quá trình khởi tạo lớp (class initialization).

**2. Truyền đường dẫn đầy đủ (fully qualified name) của lớp thông qua `Class.forName()`:**

```java
Class alunbarClass1 = Class.forName("cn.javaguide.TargetObject");
```

**3. Thông qua thể hiện (instance) của đối tượng bằng `instance.getClass()`:**

```java
TargetObject o = new TargetObject();
Class alunbarClass2 = o.getClass();
```

**4. Truyền đường dẫn lớp thông qua ClassLoader bằng `xxxClassLoader.loadClass()`:**

```java
ClassLoader.getSystemClassLoader().loadClass("cn.javaguide.TargetObject");
```

Việc lấy đối tượng `Class` thông qua `ClassLoader` sẽ không thực hiện bước khởi tạo lớp (initialization), đồng nghĩa các khối lệnh `static` và việc khởi tạo biến `static` sẽ không được thực thi.

### Một số thao tác Reflection cơ bản

1. Tạo một lớp `TargetObject` để thao tác bằng Reflection.

```java
package cn.javaguide;

public class TargetObject {
    private String value;

    public TargetObject() {
        value = "JavaGuide";
    }

    public void publicMethod(String s) {
        System.out.println("I love " + s);
    }

    private void privateMethod() {
        System.out.println("value is " + value);
    }
}
```

2. Dùng Reflection để thao tác với các phương thức và thuộc tính của lớp này.

```java
package cn.javaguide;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public class Main {
    public static void main(String[] args) throws ClassNotFoundException, NoSuchMethodException, IllegalAccessException, InstantiationException, InvocationTargetException, NoSuchFieldException {
        /**
         * Lấy đối tượng Class của TargetObject và tạo một instance của lớp TargetObject
         */
        Class<?> targetClass = Class.forName("cn.javaguide.TargetObject");
        TargetObject targetObject = (TargetObject) targetClass.getDeclaredConstructor().newInstance();
        /**
         * Lấy tất cả các phương thức được định nghĩa trong lớp TargetObject
         */
        Method[] methods = targetClass.getDeclaredMethods();
        for (Method method : methods) {
            System.out.println(method.getName());
        }

        /**
         * Lấy phương thức chỉ định và gọi thực thi
         */
        Method publicMethod = targetClass.getDeclaredMethod("publicMethod",
                String.class);

        publicMethod.invoke(targetObject, "JavaGuide");

        /**
         * Lấy trường (field) chỉ định và sửa đổi giá trị của nó
         */
        Field field = targetClass.getDeclaredField("value");
        // Tắt kiểm tra quyền truy cập để sửa đổi field private trong lớp
        field.setAccessible(true);
        field.set(targetObject, "JavaGuide");

        /**
         * Gọi phương thức private
         */
        Method privateMethod = targetClass.getDeclaredMethod("privateMethod");
        // Tắt kiểm tra quyền truy cập để gọi phương thức private
        privateMethod.setAccessible(true);
        privateMethod.invoke(targetObject);
    }
}

```

Kết quả đầu ra:

```plain
publicMethod
privateMethod
I love JavaGuide
value is JavaGuide
```

**Lưu ý**: Có bạn đọc phản ánh khi chạy đoạn mã trên bị ném ngoại lệ `ClassNotFoundException`; nguyên nhân cụ thể là bạn chưa thay tên package trong dòng code dưới đây thành package chứa lớp `TargetObject` do chính bạn tạo.
Có thể tham khảo bài viết: <https://www.cnblogs.com/chanshuyi/p/head_first_of_reflection.html>.

```java
Class<?> targetClass = Class.forName("cn.javaguide.TargetObject");
```
