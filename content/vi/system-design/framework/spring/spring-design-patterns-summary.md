---
title: Giải thích chi tiết các Design Pattern trong Spring
description: "Giải thích chi tiết các Design Pattern trong Spring Framework, bao gồm ứng dụng thực tế của Factory Pattern, Proxy Pattern, Singleton Pattern, Template Method, Observer, Adapter và Decorator trong mã nguồn Spring."
category: Framework
tag:
  - Spring
lang: vi
sourceRef: zh-ref/system-design/framework/spring/spring-design-patterns-summary.md
head:
  - - meta
    - name: keywords
      content: Spring Design Pattern,Factory Pattern,Proxy Pattern,Template Method,Singleton,Strategy Pattern,Adapter Pattern,Mã nguồn Spring
---

"Trong JDK đã sử dụng những Design Pattern nào? Trong Spring đã sử dụng những Design Pattern nào?" Hai câu hỏi này khá phổ biến trong các buổi phỏng vấn.

Mình đã tìm thử trên mạng các bài giải thích về Design Pattern trong Spring thì gần như đều na ná nhau, hơn nữa phần lớn đã khá cũ. Vì vậy, mình đã dành vài ngày tự tổng hợp lại một bài riêng.

Do năng lực cá nhân còn hạn chế, nếu trong bài có sai sót gì mong mọi người góp ý chỉ ra. Ngoài ra, do giới hạn độ dài, phần diễn giải về từng Design Pattern cũng như mã nguồn mình chỉ lướt qua ý chính; mục đích chính của bài viết này là hệ thống lại các Design Pattern có mặt trong Spring.

## Inversion of Control (IoC) và Dependency Injection (DI)

**IoC (Inversion of Control - Đảo ngược điều khiển)** là một khái niệm cực kỳ quan trọng trong Spring; nó không phải là một công nghệ cụ thể, mà là một tư tưởng thiết kế nhằm giảm sự phụ thuộc (decoupling). Mục đích chính của IoC là nhờ vào "bên thứ ba" (IoC container trong Spring) để tách rời sự phụ thuộc trực tiếp giữa các đối tượng với nhau (IoC container quản lý đối tượng, bạn chỉ việc lấy ra dùng), qua đó giảm mức độ phụ thuộc chặt (coupling) trong mã nguồn.

**IoC là một nguyên lý (principle), không phải một pattern; các pattern sau đây (nhưng không giới hạn ở đó) hiện thực hóa nguyên lý IoC.**

![ioc-patterns](/media/jg/ext/oss.javaguide.cn/github/javaguide/ioc-patterns-fbb73446.png)

**Spring IoC container giống như một nhà máy vậy: khi cần tạo một đối tượng, chúng ta chỉ cần khai báo xong trong file cấu hình hoặc annotation là được, hoàn toàn không cần quan tâm đối tượng đó được tạo ra như thế nào.** IoC container chịu trách nhiệm tạo đối tượng, liên kết các đối tượng lại với nhau, cấu hình chúng và quản lý toàn bộ vòng đời từ lúc khởi tạo cho đến khi bị hủy hoàn toàn.

Trong dự án thực tế, một class `Service` có thể có hàng trăm thậm chí hàng nghìn class ở tầng dưới làm phụ thuộc; nếu phải tự khởi tạo `Service` này, có lẽ mỗi lần khởi tạo bạn đều phải lần theo constructor của toàn bộ các class tầng dưới đó, điều này đủ làm bất kỳ ai phát điên. Nếu dùng IoC, bạn chỉ cần cấu hình sẵn một lần rồi tham chiếu/tiêm vào nơi cần dùng là xong, giúp tăng đáng kể khả năng bảo trì của dự án và giảm độ khó khi phát triển.

> Để hiểu sâu về Spring IoC, bạn nên đọc câu trả lời rất hay này trên Zhihu: <https://www.zhihu.com/question/23277575/answer/169698662>.

**Hiểu thế nào về Inversion of Control (đảo ngược điều khiển)?** Lấy ví dụ: "Đối tượng `a` phụ thuộc vào đối tượng `b`. Khi đối tượng `a` cần dùng đối tượng `b` thì buộc phải tự tay tạo ra `b`. Nhưng khi hệ thống đưa IoC container vào, đối tượng `a` và đối tượng `b` không còn liên hệ trực tiếp nữa. Lúc này, khi đối tượng `a` cần dùng đối tượng `b`, ta có thể chỉ định IoC container tạo ra một đối tượng `b` rồi tiêm (inject) vào đối tượng `a`." Quá trình đối tượng `a` nhận được đối tượng phụ thuộc `b` chuyển từ hành vi chủ động sang bị động—quyền điều khiển bị đảo ngược, và đó chính là nguồn gốc tên gọi Inversion of Control.

**DI (Dependency Injection - Tiêm phụ thuộc) là một Design Pattern hiện thực hóa Inversion of Control; Dependency Injection chính là việc truyền các biến thực thể (instance dependency) từ bên ngoài vào một đối tượng.**

## Factory Design Pattern

Spring sử dụng Factory Pattern để tạo các đối tượng Bean thông qua `BeanFactory` hoặc `ApplicationContext`.

**So sánh giữa hai thành phần này:**

- `BeanFactory`: Cung cấp năng lực nền tảng của Spring IoC container. Khi sử dụng trực tiếp `BeanFactory` cơ bản, container thường không chủ động khởi tạo trước tất cả singleton Bean mà sẽ khởi tạo khi Bean được yêu cầu lần đầu.
- `ApplicationContext`: Mở rộng `BeanFactory`, bổ sung các khả năng như phát hành sự kiện (event publishing), quốc tế hóa (i18n), nạp tài nguyên (resource loading), đồng thời mặc định khởi tạo trước các singleton Bean không đánh dấu lazy ngay trong giai đoạn khởi động container; các `prototype` Bean và các Bean được đánh dấu lazy sẽ không bị tạo hàng loạt theo cách này.

Ba class triển khai phổ biến của `ApplicationContext`:

1. `ClassPathXmlApplicationContext`: Xem file context như một tài nguyên trên classpath.
2. `FileSystemXmlApplicationContext`: Nạp thông tin định nghĩa context từ file XML trong hệ thống tệp (filesystem).
3. `XmlWebApplicationContext`: Nạp thông tin định nghĩa context từ file XML trong hệ thống Web.

Ví dụ:

```java
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.FileSystemXmlApplicationContext;

public class App {
  public static void main(String[] args) {
    ApplicationContext context = new FileSystemXmlApplicationContext(
        "C:/work/IOC Containers/springframework.applicationcontext/src/main/resources/bean-factory-config.xml");

    HelloApplicationContext obj = (HelloApplicationContext) context.getBean("helloApplicationContext");
    obj.getMsg();
  }
}
```

## Singleton Design Pattern

Trong hệ thống của chúng ta có một số đối tượng thực chất chỉ cần một bản thể duy nhất, chẳng hạn như: Thread Pool, cache, hộp thoại (dialog), registry, đối tượng ghi log, hay các đối tượng driver thiết bị đóng vai trò điều khiển máy in, card đồ họa. Thực tế, nhóm đối tượng này chỉ được phép có một instance; nếu tạo ra nhiều instance thì có thể phát sinh hàng loạt vấn đề như hành vi chương trình bất thường, tiêu tốn tài nguyên quá mức hoặc kết quả thiếu nhất quán.

**Lợi ích khi sử dụng Singleton Pattern**:

- Đối với các đối tượng được dùng thường xuyên, có thể lược bỏ thời gian tiêu tốn cho việc tạo mới đối tượng; với các đối tượng nặng (heavyweight), đây là khoản tiết kiệm chi phí hệ thống rất đáng kể.
- Do số lần thực hiện toán tử `new` giảm đi, tần suất cấp phát bộ nhớ hệ thống cũng giảm theo, giúp giảm áp lực cho GC và rút ngắn thời gian tạm dừng GC (GC pause).

**Scope mặc định của Bean trong Spring chính là `singleton`.** Ngoài scope `singleton`, Bean trong Spring còn có các scope sau:

- **prototype**: Mỗi lần lấy ra đều tạo một instance Bean mới. Nghĩa là gọi `getBean()` liên tiếp hai lần sẽ thu được hai Bean instance khác nhau.
- **request** (chỉ khả dụng trong ứng dụng Web): Mỗi HTTP request sẽ sinh ra một Bean mới (request bean), Bean này chỉ có hiệu lực trong phạm vi HTTP request hiện tại.
- **session** (chỉ khả dụng trong ứng dụng Web): Mỗi HTTP request đến từ một session mới sẽ sinh ra một Bean mới (session bean), Bean này chỉ có hiệu lực trong phạm vi HTTP session hiện tại.
- **application** (chỉ khả dụng trong ứng dụng Web): Mỗi `ServletContext` tương ứng với một Bean instance, Bean này chỉ có hiệu lực trong vòng đời ứng dụng Web hiện tại. Các phiên bản Spring cũ từng cung cấp thêm scope `globalSession` riêng cho ứng dụng Portlet, tuy nhiên nó không thuộc danh sách scope tiêu chuẩn hiện nay.
- **websocket** (chỉ khả dụng trong ứng dụng Web): Mỗi phiên WebSocket sinh ra một Bean mới.

Spring hiện thực Singleton Pattern theo cách đặc biệt thông qua singleton registry dùng `ConcurrentHashMap`.

Mã nguồn cốt lõi hiện thực singleton trong Spring như sau:

```java
// Triển khai singleton registry thông qua ConcurrentHashMap (thread-safe)
private final Map<String, Object> singletonObjects = new ConcurrentHashMap<String, Object>(64);

public Object getSingleton(String beanName, ObjectFactory<?> singletonFactory) {
        Assert.notNull(beanName, "'beanName' must not be null");
        synchronized (this.singletonObjects) {
            // Kiểm tra xem instance đã có trong cache chưa
            Object singletonObject = this.singletonObjects.get(beanName);
            if (singletonObject == null) {
                //... đã lược bỏ rất nhiều đoạn code
                try {
                    singletonObject = singletonFactory.getObject();
                }
                //... đã lược bỏ rất nhiều đoạn code
                // Nếu instance chưa tồn tại thì đăng ký vào singleton registry.
                addSingleton(beanName, singletonObject);
            }
            return (singletonObject != NULL_OBJECT ? singletonObject : null);
        }
    }
    // Thêm đối tượng vào singleton registry
    protected void addSingleton(String beanName, Object singletonObject) {
            synchronized (this.singletonObjects) {
                this.singletonObjects.put(beanName, (singletonObject != null ? singletonObject : NULL_OBJECT));

            }
        }
}
```

**Singleton Bean có vấn đề về thread-safety không?**

Phần lớn thời gian chúng ta không tự thao tác đa luồng trực tiếp trong logic thông thường nên ít người để ý tới vấn đề này. Singleton Bean tồn tại vấn đề thread-safety chủ yếu là do khi nhiều Thread cùng thao tác trên cùng một đối tượng sẽ xảy ra tranh chấp tài nguyên (race condition).

Thường có hai cách giải quyết phổ biến:

1. Hạn chế tối đa việc khai báo biến thành viên (member variable) có thể thay đổi trạng thái (mutable) trong Bean.
2. Khai báo một biến thành viên `ThreadLocal` trong class và lưu trữ các biến mutable cần dùng vào trong `ThreadLocal` (cách làm được khuyến nghị).

Tuy nhiên, phần lớn Bean trong thực tế đều là stateless (không có instance variable lưu trạng thái)—ví dụ như DAO hay Service—trong trường hợp đó Bean hoàn toàn thread-safe.

## Proxy Design Pattern

### Ứng dụng Proxy Pattern trong AOP

**AOP (Aspect-Oriented Programming - Lập trình hướng khía cạnh)** có thể đóng gói các logic hoặc trách nhiệm không liên quan trực tiếp đến nghiệp vụ nhưng lại được nhiều module nghiệp vụ cùng gọi (chẳng hạn xử lý transaction, quản lý log, kiểm soát phân quyền...), giúp giảm mã nguồn trùng lặp trong hệ thống, giảm mức độ gắn kết giữa các module, đồng thời có lợi cho khả năng mở rộng và bảo trì về sau.

Spring AOP được xây dựng dựa trên Dynamic Proxy. Nếu đối tượng cần tạo proxy có triển khai một interface nào đó, Spring AOP sẽ dùng **JDK Proxy** để tạo đối tượng proxy; còn với đối tượng không triển khai interface nào thì không thể dùng JDK Proxy được, khi đó Spring AOP sẽ dùng **CGLIB** để sinh ra một class con kế thừa đối tượng được proxy làm proxy, như hình dưới đây:

![SpringAOPProcess](/media/jg/ext/oss.javaguide.cn/github/javaguide/SpringAOPProcess-59a6425d.jpg)

Tất nhiên, bạn cũng có thể sử dụng AspectJ. Spring AOP đã tích hợp sẵn AspectJ—và AspectJ có thể xem là framework AOP hoàn chỉnh nhất trong hệ sinh thái Java.

Sau khi dùng AOP, chúng ta có thể tách riêng các tính năng dùng chung ra ngoài và áp dụng ở bất kỳ đâu cần thiết, giúp giảm đáng kể lượng code. Khi cần thêm tính năng mới cũng rất thuận tiện, từ đó nâng cao khả năng mở rộng của hệ thống. Các kịch bản như ghi log, quản lý transaction đều sử dụng AOP.

### Sự khác biệt giữa Spring AOP và AspectJ AOP là gì?

**Spring AOP thuộc loại tăng cường tại thời điểm chạy (runtime weaving/enhancement), còn AspectJ là tăng cường tại thời điểm biên dịch (compile-time).** Spring AOP dựa trên cơ chế proxy (Proxying), trong khi AspectJ dựa trên thao tác bytecode (Bytecode Manipulation).

Spring AOP đã tích hợp sẵn AspectJ—framework AOP đầy đủ nhất trong hệ sinh thái Java. AspectJ mạnh mẽ hơn so với Spring AOP, nhưng Spring AOP lại tương đối đơn giản và dễ sử dụng hơn.

Nếu số lượng aspect ít thì hiệu năng giữa hai bên không chênh lệch đáng kể. Tuy nhiên, khi có quá nhiều aspect, tốt nhất nên chọn AspectJ vì nó nhanh hơn Spring AOP rất nhiều.

## Template Method Pattern

Template Method Pattern là một Design Pattern thuộc nhóm hành vi (behavioral), định nghĩa bộ khung của một thuật toán trong một thao tác và trì hoãn một số bước cụ thể xuống cho các class con. Template Method cho phép class con định nghĩa lại cách triển khai của một số bước nhất định trong thuật toán mà không làm thay đổi cấu trúc tổng thể của thuật toán đó.

```java
public abstract class Template {
    // Đây là template method của chúng ta
    public final void TemplateMethod(){
        PrimitiveOperation1();
        PrimitiveOperation2();
        PrimitiveOperation3();
    }

    protected void  PrimitiveOperation1(){
        // Triển khai ngay tại class hiện tại
    }

    // Các phương thức do class con triển khai
    protected abstract void PrimitiveOperation2();
    protected abstract void PrimitiveOperation3();

}
public class TemplateImpl extends Template {

    @Override
    public void PrimitiveOperation2() {
        // Triển khai tại class con
    }

    @Override
    public void PrimitiveOperation3() {
        // Triển khai tại class con
    }
}

```

Trong Spring, các class thao tác cơ sở dữ liệu kết thúc bằng `Template` như `JdbcTemplate`, `HibernateTemplate` đều sử dụng Template Method Pattern. Thông thường chúng ta hay dùng kế thừa để hiện thực Template Method Pattern, nhưng Spring không đi theo hướng đó mà kết hợp Callback Pattern cùng với Template Method Pattern, vừa đạt được hiệu quả tái sử dụng mã nguồn, vừa tăng tính linh hoạt.

## Observer Pattern

Observer Pattern là một Design Pattern thuộc nhóm hành vi đối tượng. Nó biểu diễn mối quan hệ phụ thuộc giữa đối tượng này với các đối tượng khác: khi một đối tượng thay đổi trạng thái, tất cả các đối tượng phụ thuộc vào nó đều nhận được thông báo và phản ứng theo. Mô hình hướng sự kiện (Event-Driven Model) của Spring là một ứng dụng rất kinh điển của Observer Pattern. Mô hình hướng sự kiện của Spring cực kỳ hữu ích và có thể giúp tách rời sự phụ thuộc trong mã nguồn ở nhiều tình huống. Chẳng hạn mỗi lần thêm mới sản phẩm đều cần cập nhật lại chỉ mục tìm kiếm sản phẩm—lúc này có thể dùng Observer Pattern để giải quyết bài toán.

### Ba vai trò trong mô hình Event-Driven của Spring

#### Vai trò Event

`ApplicationEvent` (nằm trong package `org.springframework.context`) đóng vai trò là Event. Đây là một abstract class kế thừa `java.util.EventObject` và triển khai interface `java.io.Serializable`.

Trong Spring mặc định có sẵn các Event sau, đều là lớp con kế thừa từ `ApplicationContextEvent`:

- `ContextStartedEvent`: Event được kích hoạt sau khi `ApplicationContext` khởi động;
- `ContextStoppedEvent`: Event được kích hoạt sau khi `ApplicationContext` dừng;
- `ContextRefreshedEvent`: Event được kích hoạt sau khi `ApplicationContext` khởi tạo hoặc làm mới (refresh) hoàn tất;
- `ContextClosedEvent`: Event được kích hoạt sau khi `ApplicationContext` đóng lại.

![ApplicationEvent-Subclass](/media/jg/ext/oss.javaguide.cn/github/javaguide/ApplicationEvent-Subclass-f53f4c0b.png)

#### Vai trò Event Listener

`ApplicationListener` đóng vai trò người lắng nghe sự kiện (Event Listener). Đây là một interface chỉ định nghĩa duy nhất phương thức `onApplicationEvent()` để xử lý `ApplicationEvent`. Từ mã nguồn của `ApplicationListener` bên dưới, có thể thấy bất kỳ sự kiện nào kế thừa `ApplicationEvent` đều có thể được lắng nghe. Do đó trong Spring, chỉ cần triển khai phương thức `onApplicationEvent()` của `ApplicationListener` là đã hoàn thành việc lắng nghe Event.

```java
package org.springframework.context;
import java.util.EventListener;
@FunctionalInterface
public interface ApplicationListener<E extends ApplicationEvent> extends EventListener {
    void onApplicationEvent(E var1);
}
```

#### Vai trò Event Publisher

`ApplicationEventPublisher` đóng vai trò người phát hành sự kiện (Event Publisher), và nó cũng là một interface.

```java
@FunctionalInterface
public interface ApplicationEventPublisher {
    default void publishEvent(ApplicationEvent event) {
        this.publishEvent((Object)event);
    }

    void publishEvent(Object var1);
}

```

Phương thức `publishEvent()` của interface `ApplicationEventPublisher` được triển khai trong class `AbstractApplicationContext`. Khi đọc phần triển khai phương thức này, bạn sẽ thấy thực chất sự kiện được phát tán ra ngoài thông qua `ApplicationEventMulticaster`. Nội dung chi tiết khá dài nên không phân tích sâu ở đây, có thể sau này sẽ viết một bài riêng để đề cập.

### Tổng kết luồng xử lý Event của Spring

1. Định nghĩa một Event: Tạo class kế thừa `ApplicationEvent` và viết constructor tương ứng;
2. Định nghĩa một Event Listener: Triển khai interface `ApplicationListener` và ghi đè (`Override`) phương thức `onApplicationEvent()`;
3. Phát hành thông điệp bằng Event Publisher: Có thể gọi phương thức `publishEvent()` của `ApplicationEventPublisher` để phát hành sự kiện.

Ví dụ:

```java
// Định nghĩa một Event kế thừa từ ApplicationEvent và viết constructor tương ứng
public class DemoEvent extends ApplicationEvent{
    private static final long serialVersionUID = 1L;

    private String message;

    public DemoEvent(Object source,String message){
        super(source);
        this.message = message;
    }

    public String getMessage() {
         return message;
          }


// Định nghĩa một Event Listener, triển khai interface ApplicationListener và ghi đè onApplicationEvent()
@Component
public class DemoListener implements ApplicationListener<DemoEvent>{

    // Dùng onApplicationEvent để nhận thông điệp
    @Override
    public void onApplicationEvent(DemoEvent event) {
        String msg = event.getMessage();
        System.out.println("Thông điệp nhận được là: "+msg);
    }

}
// Phát hành sự kiện thông qua phương thức publishEvent() của ApplicationEventPublisher
@Component
public class DemoPublisher {

    @Autowired
    ApplicationContext applicationContext;

    public void publish(String message){
        // Phát hành sự kiện
        applicationContext.publishEvent(new DemoEvent(this, message));
    }
}

```

Khi gọi phương thức `publish()` của `DemoPublisher`, ví dụ `demoPublisher.publish("Xin chào")`, console sẽ in ra: `Thông điệp nhận được là: Xin chào`.

## Adapter Pattern

Adapter Pattern chuyển đổi một interface thành một interface khác mà client mong muốn; Adapter Pattern cho phép những class có interface không tương thích có thể làm việc cùng nhau.

### Adapter Pattern trong Spring AOP

Chúng ta biết rằng Spring AOP được hiện thực dựa trên Proxy Pattern, nhưng phần tăng cường hay thông báo (Advice) của Spring AOP lại sử dụng Adapter Pattern, với interface liên quan là `AdvisorAdapter`.

Các loại Advice thường dùng gồm có: `BeforeAdvice` (chạy trước khi gọi phương thức mục tiêu), `AfterAdvice` (chạy sau khi gọi phương thức mục tiêu), `AfterReturningAdvice` (chạy sau khi phương thức mục tiêu thực thi xong và trước khi return), v.v. Mỗi loại Advice đều có interceptor tương ứng: `MethodBeforeAdviceInterceptor`, `AfterReturningAdviceInterceptor`, `ThrowsAdviceInterceptor`, v.v.

Các Advice được định nghĩa sẵn trong Spring cần phải thông qua adapter tương ứng để chuyển đổi sang đối tượng thuộc kiểu interface `MethodInterceptor` (ví dụ: `MethodBeforeAdviceAdapter` thông qua việc gọi phương thức `getInterceptor` để chuyển đổi `MethodBeforeAdvice` thành `MethodBeforeAdviceInterceptor`).

### Adapter Pattern trong Spring MVC

Trong Spring MVC, `DispatcherServlet` căn cứ vào thông tin request để gọi `HandlerMapping`, phân giải ra `Handler` tương ứng với request. Sau khi phân giải được `Handler` (tức `Controller` mà chúng ta vẫn thường gọi), bộ điều hợp `HandlerAdapter` bắt đầu xử lý. `HandlerAdapter` đóng vai trò là interface kỳ vọng, các class triển khai adapter cụ thể dùng để điều hợp class mục tiêu, còn `Controller` đóng vai trò class cần được điều hợp.

**Tại sao phải sử dụng Adapter Pattern trong Spring MVC?**

Trong Spring MVC có rất nhiều loại `Controller`, mỗi loại `Controller` khác nhau xử lý request thông qua những phương thức khác nhau. Nếu không tận dụng Adapter Pattern, `DispatcherServlet` sẽ phải lấy trực tiếp từng loại `Controller` tương ứng rồi tự mình kiểm tra điều kiện, giống như đoạn code bên dưới:

```java
if(mappedHandler.getHandler() instanceof MultiActionController){
   ((MultiActionController)mappedHandler.getHandler()).xxx
}else if(mappedHandler.getHandler() instanceof XXX){
    ...
}else if(...){
   ...
}
```

Giả sử chúng ta thêm một loại `Controller` mới thì lại phải chèn thêm một nhánh điều kiện vào đoạn code trên; cách làm này khiến chương trình khó bảo trì, đồng thời vi phạm nguyên lý Đóng/Mở (Open-Closed Principle) trong thiết kế phần mềm – mở cho mở rộng, đóng cho sửa đổi.

## Decorator Pattern

Decorator Pattern có thể bổ sung thêm các thuộc tính hoặc hành vi cho đối tượng một cách linh hoạt tại runtime. So với việc dùng kế thừa, Decorator Pattern linh hoạt hơn nhiều. Nói một cách đơn giản, khi cần chỉnh sửa hoặc mở rộng tính năng có sẵn nhưng không muốn sửa trực tiếp vào mã nguồn gốc, ta thiết kế một Decorator bọc bên ngoài mã nguồn ban đầu. Thực tế ngay trong JDK cũng dùng Decorator Pattern ở rất nhiều nơi, chẳng hạn nhóm `InputStream`: bên dưới class `InputStream` có các lớp con như `FileInputStream` (đọc file), `BufferedInputStream` (bổ sung bộ đệm giúp tăng tốc độ đọc file đáng kể) giúp mở rộng tính năng của `InputStream` mà không làm thay đổi code của `InputStream`.

![Sơ đồ Decorator Pattern](/media/jg/ext/oss.javaguide.cn/github/javaguide/Decorator-675bb5dc.png)

## Tổng kết

Spring Framework đã sử dụng những Design Pattern nào?

- **Factory Design Pattern**: Spring dùng Factory Pattern thông qua `BeanFactory`, `ApplicationContext` để tạo đối tượng Bean.
- **Proxy Design Pattern**: Hiện thực chức năng của Spring AOP.
- **Singleton Design Pattern**: Các Bean trong Spring mặc định đều là singleton.
- **Template Method Pattern**: Các class thao tác cơ sở dữ liệu kết thúc bằng `Template` trong Spring như `JdbcTemplate`, `HibernateTemplate` đều sử dụng Template Method Pattern.
- **Observer Pattern**: Mô hình hướng sự kiện (Event-Driven Model) của Spring là một ứng dụng rất kinh điển của Observer Pattern.
- **Adapter Pattern**: Phần Advice của Spring AOP sử dụng Adapter Pattern, và trong Spring MVC cũng sử dụng Adapter Pattern để điều hợp `Controller`.
- ……

## Tài liệu tham khảo

- *Spring Technology Insider* (Kỹ thuật nội bộ Spring)
- <https://blog.eduonix.com/java-programming-2/learn-design-patterns-used-spring-framework/>
- <https://www.tutorialsteacher.com/ioc/inversion-of-control>
- <https://design-patterns.readthedocs.io/zh_CN/latest/behavioral_patterns/observer.html>
- <https://juejin.im/post/5a8eb261f265da4e9e307230>
- <https://juejin.im/post/5ba28986f265da0abc2b6084>
