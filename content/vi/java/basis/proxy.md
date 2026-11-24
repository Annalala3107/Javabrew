---
title: Giải thích chi tiết Proxy Pattern trong Java
description: "Giải thích chi tiết nguyên lý và cách triển khai Proxy Pattern trong Java: so sánh sự khác biệt giữa Static Proxy và Dynamic Proxy, phân tích sâu cơ chế JDK Dynamic Proxy và CGLIB Proxy, giúp hiểu cách triển khai các mối quan tâm cắt ngang (cross-cutting concerns) trong AOP."
category: Java
tag:
  - Java cơ bản
lang: vi
sourceRef: zh-ref/java/basis/proxy.md
head:
  - - meta
    - name: keywords
      content: Java Proxy Pattern,Static Proxy,Dynamic Proxy,JDK Dynamic Proxy,CGLIB Proxy,AOP,Design Pattern,triển khai Proxy
---

## 1. Proxy Pattern (Mẫu Proxy)

Proxy Pattern là một Design Pattern khá dễ hiểu. Nói một cách đơn giản, **chúng ta sử dụng một đối tượng proxy (đối tượng đại diện) để thay thế cho việc truy cập trực tiếp vào đối tượng thực (real object), nhờ đó có thể cung cấp thêm các thao tác chức năng bổ sung và mở rộng chức năng của đối tượng đích mà không cần sửa đổi đối tượng đích ban đầu.**

**Tác dụng chính của Proxy Pattern là mở rộng chức năng cho đối tượng đích, chẳng hạn như bạn có thể thêm một số thao tác tùy chỉnh trước và sau khi một phương thức nào đó của đối tượng đích được thực thi.**

Ví dụ: Cô dâu nhờ dì của mình thay mặt xử lý các câu hỏi từ chú rể; những câu hỏi mà cô dâu nhận được đều đã qua sự xử lý và sàng lọc của người dì. Người dì ở đây có thể xem là đối tượng proxy đại diện cho bạn, còn hành vi (phương thức) được proxy là tiếp nhận và trả lời các câu hỏi của chú rể.

![Understanding the Proxy Design Pattern | by Mithun Sasidharan | Medium](/media/jg/ext/oss.javaguide.cn/2020-8/1-DjWCgTFm-xqbhbNQVsaWQw-dc7d1891.png)

<p style="text-align:right;font-size:13px;color:gray">https://medium.com/@mithunsasidharan/understanding-the-proxy-design-pattern-5e63fe38052a</p>

Proxy Pattern có hai cách triển khai là Static Proxy (proxy tĩnh) và Dynamic Proxy (proxy động). Trước tiên hãy cùng xem cách triển khai Static Proxy.

## 2. Static Proxy (Proxy tĩnh)

Trong Static Proxy, việc tăng cường cho từng phương thức của đối tượng đích đều được thực hiện thủ công (sẽ minh họa cụ thể bằng mã nguồn ở dưới), rất thiếu linh hoạt (ví dụ một khi interface thêm phương thức mới thì cả đối tượng đích và đối tượng proxy đều phải sửa theo) và rườm rà (phải viết riêng một lớp proxy cho mỗi lớp đích). Kịch bản ứng dụng thực tế cực kỳ ít, trong phát triển hằng ngày hầu như không thấy chỗ nào dùng Static Proxy.

Trên đây chúng ta nói về Static Proxy dưới góc độ triển khai và ứng dụng; còn từ góc độ JVM, **Static Proxy ngay tại thời điểm biên dịch đã biến interface, lớp triển khai và lớp proxy thành từng tệp `.class` thực tế.**

Các bước triển khai Static Proxy:

1. Định nghĩa một interface và lớp triển khai của nó;
2. Tạo một lớp proxy cũng triển khai interface này;
3. Truyền (inject) đối tượng đích vào lớp proxy, sau đó trong phương thức tương ứng của lớp proxy gọi tới phương thức tương ứng của lớp đích. Nhờ vậy, chúng ta có thể che chắn việc truy cập trực tiếp vào đối tượng đích thông qua lớp proxy, đồng thời có thể làm những việc mình muốn trước và sau khi phương thức đích thực thi.

Dưới đây là phần minh họa bằng mã nguồn!

**1. Định nghĩa interface gửi tin nhắn SMS**

```java
public interface SmsService {
    String send(String message);
}
```

**2. Triển khai interface gửi tin nhắn SMS**

```java
public class SmsServiceImpl implements SmsService {
    public String send(String message) {
        System.out.println("send message:" + message);
        return message;
    }
}
```

**3. Tạo lớp proxy và cũng triển khai interface gửi tin nhắn SMS**

```java
public class SmsProxy implements SmsService {

    private final SmsService smsService;

    public SmsProxy(SmsService smsService) {
        this.smsService = smsService;
    }

    @Override
    public String send(String message) {
        // Trước khi gọi phương thức, ta có thể thêm thao tác của riêng mình
        System.out.println("before method send()");
        smsService.send(message);
        // Sau khi gọi phương thức, ta cũng có thể thêm thao tác của riêng mình
        System.out.println("after method send()");
        return null;
    }
}
```

**4. Sử dụng thực tế**

```java
public class Main {
    public static void main(String[] args) {
        SmsService smsService = new SmsServiceImpl();
        SmsProxy smsProxy = new SmsProxy(smsService);
        smsProxy.send("java");
    }
}
```

Sau khi chạy đoạn mã trên, màn hình console in ra:

```bash
before method send()
send message:java
after method send()
```

Có thể thấy từ kết quả đầu ra rằng chúng ta đã mở rộng thêm cho phương thức `send()` của `SmsServiceImpl`.

## 3. Dynamic Proxy (Proxy động)

So với Static Proxy, Dynamic Proxy linh hoạt hơn nhiều. Chúng ta không cần tạo riêng một lớp proxy cho từng lớp đích, và cũng không bắt buộc phải triển khai interface mà có thể proxy trực tiếp lớp triển khai (cơ chế CGLIB Dynamic Proxy).

**Từ góc độ JVM, Dynamic Proxy tự động sinh bytecode của lớp ngay tại thời điểm runtime rồi nạp vào JVM.**

Nhắc đến Dynamic Proxy, Spring AOP và các framework RPC chắc chắn là hai cái tên không thể bỏ qua — việc triển khai chúng đều dựa vào Dynamic Proxy.

**Dynamic Proxy được dùng trực tiếp tương đối ít trong lập trình nghiệp vụ hằng ngày, nhưng lại là công nghệ gần như bắt buộc bên trong các framework. Học tốt Dynamic Proxy cũng giúp ích rất nhiều cho việc hiểu và nghiên cứu nguyên lý hoạt động của các framework khác nhau.**

Đối với Java, có nhiều cách triển khai Dynamic Proxy, ví dụ như **JDK Dynamic Proxy**, **CGLIB Dynamic Proxy**, v.v.

[guide-rpc-framework](https://github.com/Snailclimb/guide-rpc-framework) sử dụng JDK Dynamic Proxy; trước tiên hãy cùng xem cách sử dụng JDK Dynamic Proxy.

Ngoài ra, dù [guide-rpc-framework](https://github.com/Snailclimb/guide-rpc-framework) không dùng **CGLIB Dynamic Proxy**, ở đây chúng ta vẫn sẽ giới thiệu sơ lược cách sử dụng và so sánh nó với **JDK Dynamic Proxy**.

### 3.1. Cơ chế JDK Dynamic Proxy

#### 3.1.1. Giới thiệu

**Trong cơ chế Dynamic Proxy của Java, interface `InvocationHandler` và lớp `Proxy` là cốt lõi.**

Phương thức được sử dụng nhiều nhất trong lớp `Proxy` là `newProxyInstance()`, phương thức này chủ yếu dùng để tạo ra một đối tượng proxy.

```java
    public static Object newProxyInstance(ClassLoader loader,
                                          Class<?>[] interfaces,
                                          InvocationHandler h)
        throws IllegalArgumentException
    {
        ......
    }
```

Phương thức này có tổng cộng 3 tham số:

1. **loader**: `ClassLoader`, dùng để nạp đối tượng proxy.
2. **interfaces**: Các interface mà lớp được proxy triển khai;
3. **h**: Đối tượng triển khai interface `InvocationHandler`;

Muốn triển khai Dynamic Proxy, bạn còn phải triển khai `InvocationHandler` để tự định nghĩa logic xử lý. Khi đối tượng proxy động gọi một phương thức, lời gọi phương thức đó sẽ được chuyển tiếp tới phương thức `invoke` của lớp triển khai interface `InvocationHandler`.

```java
public interface InvocationHandler {

    /**
     * Khi bạn dùng đối tượng proxy để gọi phương thức, thực tế sẽ gọi vào phương thức này
     */
    public Object invoke(Object proxy, Method method, Object[] args)
        throws Throwable;
}
```

Phương thức `invoke()` có ba tham số sau:

1. **proxy**: Đối tượng proxy được sinh động
2. **method**: Tương ứng với phương thức được gọi trên đối tượng proxy
3. **args**: Các đối số của phương thức `method` hiện tại

Nói cách khác: **khi đối tượng proxy mà bạn tạo qua `Proxy.newProxyInstance()` gọi một phương thức, thực tế nó sẽ gọi vào phương thức `invoke()` của lớp triển khai interface `InvocationHandler`.** Bạn có thể tùy biến logic xử lý bên trong `invoke()`, ví dụ như làm việc gì đó trước và sau khi phương thức thực thi.

#### 3.1.2. Các bước sử dụng JDK Dynamic Proxy

1. Định nghĩa một interface và lớp triển khai của nó;
2. Tự định nghĩa `InvocationHandler` và ghi đè (`Override`) phương thức `invoke`; trong `invoke`, chúng ta sẽ gọi phương thức gốc (phương thức của lớp được proxy) và tùy biến thêm một số logic xử lý;
3. Tạo đối tượng proxy thông qua phương thức `Proxy.newProxyInstance(ClassLoader loader, Class<?>[] interfaces, InvocationHandler h)`;

#### 3.1.3. Ví dụ mã nguồn

Nói suông như vậy có thể hơi trừu tượng và khó hiểu, hãy xem một ví dụ để mọi người dễ hình dung nhé!

**1. Định nghĩa interface gửi tin nhắn SMS**

```java
public interface SmsService {
    String send(String message);
}
```

**2. Triển khai interface gửi tin nhắn SMS**

```java
public class SmsServiceImpl implements SmsService {
    public String send(String message) {
        System.out.println("send message:" + message);
        return message;
    }
}
```

**3. Định nghĩa một lớp handler cho JDK Dynamic Proxy**

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * @author shuang.kou
 * @createTime 2020-05-11 11:23:00
 */
public class DebugInvocationHandler implements InvocationHandler {
    /**
     * Đối tượng thực bên trong lớp proxy
     */
    private final Object target;

    public DebugInvocationHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws InvocationTargetException, IllegalAccessException {
        // Trước khi gọi phương thức, ta có thể thêm thao tác của riêng mình
        System.out.println("before method " + method.getName());
        Object result = method.invoke(target, args);
        // Sau khi gọi phương thức, ta cũng có thể thêm thao tác của riêng mình
        System.out.println("after method " + method.getName());
        return result;
    }
}

```

Phương thức `invoke()`: Khi đối tượng proxy động gọi phương thức gốc, cuối cùng thực tế nó gọi tới phương thức `invoke()`, sau đó `invoke()` thay mặt chúng ta gọi phương thức gốc của đối tượng được proxy.

**4. Lớp factory để lấy đối tượng proxy**

```java
public class JdkProxyFactory {
    public static Object getProxy(Object target) {
        return Proxy.newProxyInstance(
                target.getClass().getClassLoader(), // ClassLoader của lớp đích
                target.getClass().getInterfaces(),  // Các interface mà proxy cần triển khai, có thể chỉ định nhiều interface
                new DebugInvocationHandler(target)   // InvocationHandler tùy chỉnh tương ứng với đối tượng proxy
        );
    }
}
```

`getProxy()`: Chủ yếu lấy đối tượng proxy của một lớp thông qua phương thức `Proxy.newProxyInstance()`.

**5. Sử dụng thực tế**

```java
SmsService smsService = (SmsService) JdkProxyFactory.getProxy(new SmsServiceImpl());
smsService.send("java");
```

Sau khi chạy đoạn mã trên, màn hình console in ra:

```plain
before method send
send message:java
after method send
```

### 3.2. Cơ chế CGLIB Dynamic Proxy

#### 3.2.1. Giới thiệu

**JDK Dynamic Proxy có một nhược điểm chí mạng là chỉ có thể proxy những lớp có triển khai interface.**

**Để khắc phục vấn đề này, chúng ta có thể dùng cơ chế CGLIB Dynamic Proxy để thay thế.**

[CGLIB](https://github.com/cglib/cglib) (_Code Generation Library_) là một thư viện sinh bytecode dựa trên [ASM](http://www.baeldung.com/java-asm), cho phép chúng ta chỉnh sửa và sinh động bytecode tại thời điểm runtime. CGLIB triển khai proxy thông qua kế thừa. Nhiều framework mã nguồn mở nổi tiếng đều sử dụng [CGLIB](https://github.com/cglib/cglib), ví dụ trong module AOP của Spring: nếu đối tượng đích có triển khai interface thì mặc định dùng JDK Dynamic Proxy, ngược lại sẽ dùng CGLIB Dynamic Proxy.

**Trong cơ chế CGLIB Dynamic Proxy, interface `MethodInterceptor` và lớp `Enhancer` là cốt lõi.**

Bạn cần tự định nghĩa `MethodInterceptor` và ghi đè (`Override`) phương thức `intercept`; `intercept` dùng để chặn (intercept) và tăng cường phương thức của lớp được proxy.

```java
public interface MethodInterceptor
extends Callback{
    // Chặn phương thức trong lớp được proxy
    public Object intercept(Object obj, java.lang.reflect.Method method, Object[] args, MethodProxy proxy) throws Throwable;
}

```

1. **obj**: Đối tượng được proxy (đối tượng cần tăng cường)
2. **method**: Phương thức bị chặn (phương thức cần tăng cường)
3. **args**: Các tham số đầu vào của phương thức
4. **proxy**: Dùng để gọi phương thức gốc

Bạn có thể tạo động proxy cho lớp cần proxy thông qua lớp `Enhancer`; khi lớp proxy gọi phương thức, thực tế sẽ gọi tới `intercept` trong `MethodInterceptor`.

#### 3.2.2. Các bước sử dụng CGLIB Dynamic Proxy

1. Định nghĩa một lớp;
2. Tự định nghĩa `MethodInterceptor` và ghi đè phương thức `intercept`; `intercept` dùng để chặn và tăng cường phương thức của lớp được proxy, tương tự như phương thức `invoke` trong JDK Dynamic Proxy;
3. Tạo đối tượng proxy thông qua `create()` của lớp `Enhancer`;

#### 3.2.3. Ví dụ mã nguồn

Khác với JDK Dynamic Proxy không cần thêm thư viện phụ thuộc ngoài, [CGLIB](https://github.com/cglib/cglib) (_Code Generation Library_) thực chất là một dự án mã nguồn mở, nên nếu muốn sử dụng bạn cần thêm dependency tương ứng một cách thủ công.

```xml
<dependency>
  <groupId>cglib</groupId>
  <artifactId>cglib</artifactId>
  <version>3.3.0</version>
</dependency>
```

**1. Triển khai một lớp gửi tin nhắn SMS sử dụng Alibaba Cloud**

```java
package github.javaguide.dynamicProxy.cglibDynamicProxy;

public class AliSmsService {
    public String send(String message) {
        System.out.println("send message:" + message);
        return message;
    }
}
```

**2. Tự định nghĩa `MethodInterceptor` (bộ chặn phương thức)**

```java
import net.sf.cglib.proxy.MethodInterceptor;
import net.sf.cglib.proxy.MethodProxy;

import java.lang.reflect.Method;

/**
 * MethodInterceptor tùy chỉnh
 */
public class DebugMethodInterceptor implements MethodInterceptor {


    /**
     * @param o           Bản thân đối tượng proxy (lưu ý không phải đối tượng gốc; nếu dùng method.invoke(o, args) sẽ dẫn tới gọi đệ quy vô hạn)
     * @param method      Phương thức bị chặn (phương thức cần tăng cường)
     * @param args        Tham số đầu vào của phương thức
     * @param methodProxy Cơ chế gọi phương thức hiệu năng cao, tránh chi phí Reflection
     */
    @Override
    public Object intercept(Object o, Method method, Object[] args, MethodProxy methodProxy) throws Throwable {
        // Trước khi gọi phương thức, ta có thể thêm thao tác của riêng mình
        System.out.println("before method " + method.getName());
        Object object = methodProxy.invokeSuper(o, args);
        // Sau khi gọi phương thức, ta cũng có thể thêm thao tác của riêng mình
        System.out.println("after method " + method.getName());
        return object;
    }

}
```

**3. Lấy đối tượng proxy**

```java
import net.sf.cglib.proxy.Enhancer;

public class CglibProxyFactory {

    public static Object getProxy(Class<?> clazz) {
        // Tạo lớp tăng cường proxy động
        Enhancer enhancer = new Enhancer();
        // Thiết lập ClassLoader
        enhancer.setClassLoader(clazz.getClassLoader());
        // Thiết lập lớp được proxy (lớp cha)
        enhancer.setSuperclass(clazz);
        // Thiết lập bộ chặn phương thức
        enhancer.setCallback(new DebugMethodInterceptor());
        // Tạo đối tượng proxy
        return enhancer.create();
    }
}
```

**4. Sử dụng thực tế**

```java
AliSmsService aliSmsService = (AliSmsService) CglibProxyFactory.getProxy(AliSmsService.class);
aliSmsService.send("java");
```

Sau khi chạy đoạn mã trên, màn hình console in ra:

```bash
before method send
send message:java
after method send
```

### 3.3. So sánh JDK Dynamic Proxy và CGLIB Dynamic Proxy

1. JDK Dynamic Proxy là tính năng chính thức của Java, yêu cầu lớp được proxy bắt buộc phải triển khai interface. Nguyên lý của nó là sinh động một lớp triển khai interface đó để làm proxy. CGLIB là thư viện bên thứ ba và không cần interface; nguyên lý của nó là sinh động một lớp con kế thừa lớp được proxy để làm proxy. Nhưng cũng chính vì dựa trên kế thừa nên nó không thể proxy lớp `final`, và phương thức được proxy cũng không thể là `final` hoặc `private`.
2. Xét về hiệu năng của cả hai, trong phần lớn trường hợp JDK Dynamic Proxy vượt trội hơn, và cùng với việc nâng cấp phiên bản JDK thì lợi thế này càng rõ rệt hơn.

## 4. So sánh Static Proxy và Dynamic Proxy

Sự khác biệt cốt lõi giữa Static Proxy và Dynamic Proxy nằm ở **thời điểm xác định quan hệ proxy, tính linh hoạt khi triển khai và chi phí bảo trì**.

| Tiêu chí so sánh | Static Proxy | Dynamic Proxy |
| ---------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Thời điểm xác định quan hệ proxy | Thời điểm biên dịch (sau khi biên dịch sinh ra các tệp bytecode `.class` cố định) | Thời điểm runtime (sinh động bytecode của lớp proxy và nạp vào JVM) |
| Cách thức triển khai | Viết thủ công lớp proxy trước khi biên dịch, thường gọi đối tượng đích thông qua kết hợp (composition) và ủy quyền (delegation) | Không cần viết thủ công từng lớp proxy cụ thể, đóng gói logic tăng cường qua `Handler` / `Interceptor` |
| Phụ thuộc vào interface | Không bắt buộc; Static Proxy dựa trên interface thường cho lớp proxy và lớp đích tuân theo cùng một interface | JDK Dynamic Proxy hướng tới interface, còn proxy dựa trên lớp con như CGLIB hướng tới các lớp triển khai có thể kế thừa |
| Lượng mã nguồn & Khả năng bảo trì | Lượng mã lớn (càng nhiều lớp đích thì càng nhiều lớp proxy), chi phí bảo trì cao; khi interface thêm phương thức mới, cả lớp đích và lớp proxy phải sửa đồng bộ | Lượng mã cực ít (logic tăng cường dùng chung có thể tái sử dụng), dễ bảo trì; tách rời khỏi interface nên thay đổi interface không ảnh hưởng tới logic proxy |
| Ưu điểm cốt lõi | Triển khai đơn giản, logic trực quan, không phụ thuộc thêm framework ngoài | Tính linh hoạt cao, tái sử dụng tốt, giảm viết mã lặp lại, phù hợp cho kịch bản phức tạp |
| Kịch bản ứng dụng tiêu biểu | Decorator Pattern đơn giản, nhu cầu tăng cường cho một số ít lớp cố định | Spring AOP, các framework RPC (như Dubbo), các framework ORM |

## 5. Tổng kết

Bài viết này chủ yếu giới thiệu hai cách triển khai của Proxy Pattern: Static Proxy và Dynamic Proxy, bao gồm thực hành Static Proxy và Dynamic Proxy, sự khác biệt giữa Static Proxy và Dynamic Proxy, cũng như sự khác biệt giữa JDK Dynamic Proxy và CGLIB Dynamic Proxy.

Toàn bộ mã nguồn được đề cập trong bài viết, bạn có thể tìm thấy tại đây: [https://github.com/Snailclimb/guide-rpc-framework-learning/tree/master/src/main/java/github/javaguide/proxy](https://github.com/Snailclimb/guide-rpc-framework-learning/tree/master/src/main/java/github/javaguide/proxy).
