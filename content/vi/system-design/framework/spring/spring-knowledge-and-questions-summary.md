---
title: Tổng hợp câu hỏi phỏng vấn Spring thường gặp
description: Giải thích chi tiết các câu hỏi phỏng vấn cốt lõi về Spring Framework, bao gồm IoC Container, nguyên lý AOP, vòng đời Bean, Dependency Injection, quản lý Transaction và các kiến thức trọng tâm khác của Spring.
category: Framework
tag:
  - Spring
lang: vi
sourceRef: zh-ref/system-design/framework/spring/spring-knowledge-and-questions-summary.md
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn Spring,Spring Framework,Vòng đời Bean,IoC,AOP,Dependency Injection,Transaction,Câu hỏi thường gặp Spring
---

Bài viết này chủ yếu muốn thông qua một số câu hỏi để giúp mọi người hiểu sâu hơn về Spring, nên sẽ không đi vào quá nhiều mã nguồn!

Nhiều câu hỏi dưới đây bản thân mình trong quá trình sử dụng Spring cũng không để ý tới, mình cũng phải tranh thủ tra cứu rất nhiều tài liệu và sách để bổ sung vào. Trên mạng cũng có khá nhiều bài viết tổng hợp các câu hỏi thường gặp/phỏng vấn về Spring, mình thấy phần lớn đều copy qua lại lẫn nhau, hơn nữa nhiều câu hỏi không thực sự hay, thậm chí một số câu trả lời còn có vấn đề. Vì vậy, mình đã dành một tuần thời gian rảnh để tự tổng hợp lại, hy vọng sẽ giúp ích cho mọi người.

## Kiến thức cơ bản về Spring

### Spring Framework là gì?

Spring là một framework phát triển Java nhẹ (lightweight), mã nguồn mở, hướng tới việc nâng cao hiệu suất phát triển của lập trình viên cũng như khả năng bảo trì của hệ thống.

Khi nhắc đến Spring Framework, thông thường chúng ta đang nói đến tập hợp của nhiều module; việc sử dụng các module này giúp chúng ta phát triển ứng dụng một cách thuận tiện hơn rất nhiều. Chẳng hạn, Spring hỗ trợ IoC (Inversion of Control: Đảo ngược điều khiển) và AOP (Aspect-Oriented Programming: Lập trình hướng khía cạnh), cho phép truy cập cơ sở dữ liệu dễ dàng, tích hợp thuận tiện với các thành phần bên thứ ba (email, tác vụ, lập lịch, cache, v.v.), hỗ trợ rất tốt cho unit test và hỗ trợ phát triển các ứng dụng Java RESTful.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/38ef122122de4375abcd27c3de8f60b4-d6c7da9d.png)

Tư tưởng cốt lõi nhất của Spring là không phát minh lại bánh xe, dùng được ngay (out-of-the-box), nâng cao hiệu suất phát triển.

Spring dịch ra có nghĩa là mùa xuân, cho thấy mục tiêu và sứ mệnh của nó chính là mang lại mùa xuân cho lập trình viên Java! Thật cảm động!

🤐 Nói thêm một chút: **Sự phổ biến của một ngôn ngữ thường cần một ứng dụng sát thủ (killer application), và Spring chính là một framework ứng dụng sát thủ của hệ sinh thái Java.**

Hai tính năng cốt lõi nhất mà Spring cung cấp là IoC và AOP. Khi học Spring, nhất định phải nắm vững tư tưởng cốt lõi của IoC và AOP!

- Trang chủ chính thức của Spring: <https://spring.io/>
- Địa chỉ GitHub: <https://github.com/spring-projects/spring-framework>

### Spring bao gồm những module nào?

**Phiên bản Spring 4.x**:

![Các module chính của Spring 4.x](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/jvme0c60b4606711fc4a0b6faf03230247a-e87ccaaa.png)

**Phiên bản Spring 5.x**:

![Các module chính của Spring 5.x](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/20200831175708-a59422a9.png)

Trong phiên bản Spring 5.x, thành phần Portlet trong module Web đã bị loại bỏ (deprecated), đồng thời bổ sung thêm thành phần WebFlux phục vụ xử lý bất đồng bộ phản ứng (asynchronous reactive).

Mối quan hệ phụ thuộc giữa các module trong Spring như sau:

![Mối quan hệ phụ thuộc giữa các module Spring](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/20200902100038-5bbb84c8.png)

#### Core Container

Là module cốt lõi của Spring Framework, cũng có thể gọi là module nền tảng, chủ yếu cung cấp hỗ trợ cho tính năng IoC Dependency Injection. Hầu như tất cả các tính năng khác của Spring đều phải phụ thuộc vào module này, điều này có thể thấy rõ qua sơ đồ phụ thuộc giữa các module của Spring ở trên.

- **spring-core**: Các lớp tiện ích cốt lõi cơ bản của Spring Framework.
- **spring-beans**: Cung cấp hỗ trợ cho việc tạo, cấu hình và quản lý bean.
- **spring-context**: Cung cấp hỗ trợ cho đa ngôn ngữ hóa (i18n), lan truyền sự kiện (event propagation), nạp tài nguyên (resource loading), v.v.
- **spring-expression**: Cung cấp hỗ trợ cho ngôn ngữ biểu thức SpEL (Spring Expression Language). Module này chỉ phụ thuộc vào module core, không phụ thuộc vào các module khác và có thể sử dụng độc lập.

#### AOP

- **spring-aspects**: Module này cung cấp hỗ trợ tích hợp với AspectJ.
- **spring-aop**: Cung cấp hiện thực cho lập trình hướng khía cạnh (AOP).
- **spring-instrument**: Cung cấp chức năng thêm agent cho JVM. Cụ thể hơn, nó cung cấp một weaving agent cho Tomcat, có khả năng truyền các file class cho Tomcat như thể chúng được nạp bởi ClassLoader. Nếu chưa hiểu cũng không sao, phạm vi sử dụng của module này rất hạn chế.

#### Data Access/Integration

Danh sách module dưới đây chủ yếu dựa trên Spring Framework 5.x. Các phiên bản Spring Framework hiện đại đã loại bỏ tích hợp với một số công nghệ cũ; khi sử dụng thực tế, bạn nên đối chiếu với danh sách module chính thức của phiên bản Spring mục tiêu.

- **spring-jdbc**: Cung cấp lớp trừu tượng JDBC cho việc truy cập cơ sở dữ liệu. Mỗi cơ sở dữ liệu khác nhau đều có API riêng độc lập để thao tác, còn chương trình Java chỉ cần tương tác với JDBC API, qua đó che giấu sự khác biệt giữa các cơ sở dữ liệu.
- **spring-tx**: Cung cấp hỗ trợ cho Transaction.
- **spring-orm**: Trong Spring Framework 5.x, cung cấp hỗ trợ cho các công nghệ ORM như Hibernate, JPA; các phiên bản Spring cũ hơn còn từng hỗ trợ tích hợp iBATIS.
- **spring-oxm**: Cung cấp lớp trừu tượng OXM (Object-to-XML Mapping). Các phiên bản Spring khác nhau hỗ trợ các hiện thực cụ thể khác nhau, ví dụ JAXB; còn Castor, XMLBeans, JiBX thuộc về tích hợp ở các phiên bản cũ.
- **spring-jms**: Dịch vụ nhắn tin (Messaging service). Kể từ Spring Framework 4.1 trở đi, nó còn kế thừa hỗ trợ cho module `spring-messaging`.

#### Spring Web

- **spring-web**: Cung cấp các hỗ trợ cơ bản nhất cho việc triển khai các tính năng Web.
- **spring-webmvc**: Cung cấp hiện thực cho Spring MVC.
- **spring-websocket**: Cung cấp hỗ trợ cho WebSocket, cho phép client và server giao tiếp hai chiều.
- **spring-webflux**: Cung cấp hỗ trợ cho WebFlux. WebFlux là web framework phản ứng (reactive) và không chặn (Non-blocking) được giới thiệu từ Spring Framework 5.0, có thể chạy trên Netty hoặc trên các Servlet container hỗ trợ Non-blocking I/O. Việc ứng dụng có đạt được non-blocking đầu-cuối (end-to-end) hay không còn phụ thuộc vào việc tầng truy cập dữ liệu và các lời gọi downstream khác có chứa thao tác blocking hay không.

#### Messaging

**spring-messaging** là một module mới được thêm vào từ Spring 4.0, với trách nhiệm chính là tích hợp một số khả năng truyền thông điệp cơ bản vào Spring Framework.

#### Spring Test

Đội ngũ Spring khuyến khích phát triển hướng kiểm thử (TDD - Test-Driven Development). Nhờ sự hỗ trợ của Inversion of Control (IoC), việc viết Unit Test và Integration Test trở nên đơn giản hơn rất nhiều.

Module kiểm thử của Spring hỗ trợ rất tốt các framework kiểm thử phổ biến như JUnit (framework kiểm thử đơn vị), TestNG (tương tự JUnit), Mockito (chủ yếu dùng để Mock đối tượng), PowerMock (giải quyết các hạn chế của Mockito như không thể mock các phương thức `final`, `static`, `private`), v.v.

### ⭐️Mối quan hệ giữa Spring, Spring MVC và Spring Boot là gì?

Rất nhiều người bị nhầm lẫn hoàn toàn giữa ba khái niệm Spring, Spring MVC và Spring Boot! Ở đây mình sẽ giới thiệu ngắn gọn về cả ba, thực ra rất đơn giản, không có gì cao siêu cả.

Spring bao gồm nhiều module chức năng (vừa nhắc ở trên), trong đó quan trọng nhất là module `spring-core` (chủ yếu cung cấp hỗ trợ IoC Dependency Injection). Việc triển khai các tính năng của các module khác trong Spring (như Spring MVC) nhìn chung đều phải phụ thuộc vào module này.

Hình dưới đây tương ứng với phiên bản Spring 4.x. Spring 5.0 đã giới thiệu WebFlux cho xử lý reactive và dần loại bỏ hỗ trợ liên quan đến Portlet; cấu trúc module của các phiên bản Spring hiện đại vui lòng tham khảo tài liệu chính thức.

![Các module chính của Spring](/media/jg/ext/oss.javaguide.cn/github/javaguide/jvme0c60b4606711fc4a0b6faf03230247a-6446e28d.png)

Spring MVC là một module rất quan trọng trong Spring, chủ yếu cung cấp cho Spring khả năng xây dựng nhanh chóng các ứng dụng Web theo kiến trúc MVC. MVC là viết tắt của Model (Mô hình), View (Giao diện), Controller (Bộ điều khiển), với tư tưởng cốt lõi là tổ chức mã nguồn thông qua việc tách biệt logic nghiệp vụ, dữ liệu và hiển thị.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210809181452421-6736fa66.png)

Khi phát triển bằng Spring thuần, cấu hình rất rườm rà—chẳng hạn khi bật một số tính năng của Spring, bạn cần cấu hình tường minh bằng XML hoặc Java. Vì thế, Spring Boot đã ra đời!

Spring nhằm đơn giản hóa việc phát triển ứng dụng doanh nghiệp J2EE. Còn Spring Boot nhằm đơn giản hóa việc phát triển với Spring (giảm thiểu file cấu hình, chạy ngay không cần thiết lập phức tạp!).

Spring Boot chỉ đơn giản hóa phần cấu hình. Nếu bạn cần xây dựng một ứng dụng Web theo kiến trúc MVC, bạn vẫn phải sử dụng Spring MVC làm framework MVC—chỉ là Spring Boot đã giúp bạn đơn giản hóa rất nhiều cấu hình của Spring MVC, thực sự đạt được trạng thái out-of-the-box!

## Spring IoC

### ⭐️IoC là gì?

IoC (Inversion of Control) tức là Đảo ngược điều khiển. Đây là một tư tưởng thiết kế, không phải một hiện thực kỹ thuật cụ thể. Nó mô tả bài toán tạo lập và quản lý đối tượng trong lĩnh vực phát triển Java.

Ví dụ: Giả sử có lớp A phụ thuộc vào lớp B:

- **Cách phát triển truyền thống**: Thường là ngay trong lớp A tự tay dùng từ khóa `new` để khởi tạo một đối tượng B.
- **Cách phát triển theo tư tưởng IoC**: Không tự tạo đối tượng bằng từ khóa `new`, mà nhờ IoC Container (Spring Framework) khởi tạo đối tượng giúp chúng ta. Khi cần đối tượng nào, chỉ việc lấy trực tiếp từ trong IoC Container.

Nhìn từ sự so sánh giữa hai cách phát triển trên: chúng ta "mất đi một quyền" (quyền tạo và quản lý đối tượng), và đổi lại nhận được một lợi ích lớn (không cần bận tâm đến hàng loạt việc như khởi tạo, quản lý đối tượng nữa).

**Tại sao gọi là Đảo ngược điều khiển (Inversion of Control)?**

- **Điều khiển (Control)**: Chỉ quyền tạo lập (khởi tạo, quản lý) đối tượng.
- **Đảo ngược (Inversion)**: Quyền điều khiển được giao cho môi trường bên ngoài (IoC Container).

![Minh họa IoC](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-00567db2.png)

### ⭐️IoC giải quyết vấn đề gì?

Tư tưởng của IoC là hai bên không trực tiếp phụ thuộc vào việc khởi tạo cụ thể của nhau, mà để một container bên thứ ba quản lý các tài nguyên liên quan. Điều này mang lại lợi ích gì?

1. Giảm mức độ ghép nối (coupling) hoặc mức độ phụ thuộc giữa các đối tượng;
2. Tài nguyên trở nên dễ quản lý hơn; ví dụ nếu để Spring Container cung cấp thì có thể dễ dàng hiện thực một Singleton.

Ví dụ: Giả sử có một nghiệp vụ xử lý cho `User`, phát triển theo cấu trúc hai tầng Service và Dao.

Khi chưa áp dụng tư tưởng IoC, nếu tầng Service muốn sử dụng một hiện thực cụ thể của tầng Dao, thì cần phải dùng từ khóa `new` trong `UserServiceImpl` để tự tay khởi tạo lớp hiện thực cụ thể `UserDaoImpl` của `IUserDao` (không thể `new` trực tiếp một interface).

Rất ổn, cách này vẫn chạy được, nhưng hãy thử tưởng tượng kịch bản sau:

Trong quá trình phát triển đột nhiên nhận được một yêu cầu mới, cần phát triển thêm một lớp hiện thực cụ thể khác cho interface `IUserDao`. Vì tầng Service đã phụ thuộc vào hiện thực cụ thể của `IUserDao`, nên chúng ta phải sửa lại đối tượng được `new` trong `UserServiceImpl`. Nếu chỉ có một lớp tham chiếu tới hiện thực cụ thể của `IUserDao` thì việc sửa có lẽ không quá mất sức; nhưng nếu có rất nhiều nơi cùng tham chiếu tới hiện thực cụ thể của `IUserDao`, thì một khi cần thay đổi cách hiện thực của `IUserDao`, việc sửa code sẽ trở thành cơn ác mộng.

![IoC&Aop-ioc-illustration-dao-service](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-dao-service-d83e5d28.png)

Khi sử dụng tư tưởng IoC, chúng ta giao quyền điều khiển đối tượng (tạo và quản lý) cho IoC Container đảm nhận; lúc cần dùng, chúng ta chỉ việc "hỏi xin" từ IoC Container là được.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-dao-5c2d69f4.png)

### Spring Bean là gì?

Nói một cách đơn giản, Bean dùng để chỉ những đối tượng được quản lý bởi IoC Container.

Chúng ta cần cho IoC Container biết cần giúp mình quản lý những đối tượng nào, việc này được định nghĩa thông qua siêu dữ liệu cấu hình (configuration metadata). Siêu dữ liệu cấu hình có thể là file XML, annotation hoặc lớp cấu hình Java.

```xml
<!-- Constructor-arg with 'value' attribute -->
<bean id="..." class="...">
   <constructor-arg value="..."/>
</bean>
```

Hình dưới đây minh họa đơn giản cách IoC Container sử dụng configuration metadata để quản lý đối tượng.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/062b422bd7ac4d53afd28fb74b2bc94d-6ce3218e.png)

Hai package `org.springframework.beans` và `org.springframework.context` chính là nền tảng cho việc hiện thực IoC; nếu muốn nghiên cứu mã nguồn liên quan đến IoC, bạn có thể bắt đầu tìm hiểu từ đây.

### Có những annotation nào dùng để khai báo một lớp là Bean?

- `@Component`: Annotation tổng quát, có thể đánh dấu bất kỳ lớp nào là một thành phần (component) của Spring. Nếu một Bean chưa xác định rõ thuộc tầng nào, có thể dùng `@Component` để đánh dấu.
- `@Repository`: Tương ứng với tầng lưu trữ (tầng Dao), chủ yếu dùng cho các thao tác liên quan đến cơ sở dữ liệu.
- `@Service`: Tương ứng với tầng dịch vụ (Service), chủ yếu xử lý các logic nghiệp vụ phức tạp và có sử dụng đến tầng Dao.
- `@Controller`: Tương ứng với tầng điều khiển (Controller) trong Spring MVC, chủ yếu tiếp nhận request từ người dùng, gọi tầng `Service` và trả dữ liệu về cho trang giao diện phía client.

### Sự khác biệt giữa @Component và @Bean là gì?

- Annotation `@Component` tác động lên cấp độ lớp (class), còn annotation `@Bean` tác động lên cấp độ phương thức (method).
- `@Component` thường được tự động phát hiện thông qua quét classpath (classpath scanning) và tự động đăng ký vào Spring Container (chúng ta có thể dùng annotation `@ComponentScan` để chỉ định đường dẫn cần quét nhằm tìm các lớp đã được đánh dấu cần lắp ráp để đưa tự động vào bean container của Spring). Annotation `@Bean` thường được đặt trên phương thức dùng để định nghĩa cách tạo ra bean đó; `@Bean` cho Spring biết đây là một instance của lớp nào đó, khi tôi cần dùng thì hãy trả nó lại cho tôi.
- Annotation `@Bean` có khả năng tùy biến mạnh hơn `@Component`, và ở rất nhiều nơi chúng ta chỉ có thể đăng ký bean thông qua `@Bean`. Ví dụ khi cần đưa một lớp nằm trong thư viện bên thứ ba vào `Spring` container, ta bắt buộc phải dùng `@Bean`.

Ví dụ sử dụng annotation `@Bean`:

```java
@Configuration
public class AppConfig {
    @Bean
    public TransferService transferService() {
        return new TransferServiceImpl();
    }

}
```

Đoạn code trên tương đương với cấu hình XML dưới đây:

```xml
<beans>
    <bean id="transferService" class="com.acme.TransferServiceImpl"/>
</beans>
```

Ví dụ dưới đây là trường hợp mà `@Component` không thể thực hiện được:

```java
@Bean
public OneService getService(status) {
    case (status)  {
        when 1:
                return new serviceImpl1();
        when 2:
                return new serviceImpl2();
        when 3:
                return new serviceImpl3();
    }
}
```

### Có những annotation nào dùng để inject Bean?

`@Autowired` do Spring cung cấp, cùng với `@Resource` và `@Inject` do đặc tả Jakarta cung cấp, đều có thể dùng để inject Bean.

| Annotation   | Package                                        | Source                                 |
| ------------ | ---------------------------------------------- | -------------------------------------- |
| `@Autowired` | `org.springframework.beans.factory.annotation` | Spring 2.5+                            |
| `@Resource`  | `jakarta.annotation` (Spring 6+)               | Jakarta Annotations / JSR-250          |
| `@Inject`    | `jakarta.inject` (Spring 6+)                   | Jakarta Dependency Injection / JSR-330 |

`@Autowired` và `@Resource` được sử dụng nhiều hơn cả.

### ⭐️Sự khác biệt giữa @Autowired và @Resource là gì?

`@Autowired` là annotation tích hợp sẵn của Spring, logic inject mặc định là **khớp theo kiểu (`byType`) trước; nếu tồn tại nhiều Bean cùng kiểu thì tiếp tục thử lọc theo tên (`byName`)**.

Cụ thể như sau:

1. Ưu tiên tìm các Bean phù hợp trong Spring Container theo kiểu của interface/class. Nếu chỉ tìm thấy đúng một Bean phù hợp kiểu thì inject trực tiếp mà không cần xét tên;
2. Nếu tìm thấy nhiều Bean cùng kiểu (ví dụ một interface có nhiều lớp hiện thực), nó sẽ thử đối chiếu **tên thuộc tính hoặc tên tham số** với tên của Bean (tên Bean mặc định là tên lớp viết thường chữ cái đầu, trừ khi được chỉ định tường minh qua `@Bean(name = "...")` hoặc `@Component("...")`).

Khi một interface có nhiều lớp hiện thực:

- Nếu tên thuộc tính trùng với tên của một Bean nào đó thì inject Bean đó;
- Nếu tên thuộc tính không khớp với bất kỳ tên Bean nào thì sẽ ném ra ngoại lệ `NoUniqueBeanDefinitionException`; lúc này cần dùng `@Qualifier` để chỉ định tường minh tên Bean muốn inject.

Ví dụ minh họa:

```java
// Interface SmsService có hai lớp hiện thực: SmsServiceImpl1 và SmsServiceImpl2 (cả hai đều do Spring quản lý)

// Lỗi: byType khớp được nhiều Bean, và tên thuộc tính "smsService" không khớp với tên mặc định của cả hai lớp hiện thực (smsServiceImpl1, smsServiceImpl2)
@Autowired
private SmsService smsService;

// Hợp lệ: tên thuộc tính "smsServiceImpl1" khớp với tên mặc định của lớp hiện thực SmsServiceImpl1
@Autowired
private SmsService smsServiceImpl1;

// Hợp lệ: dùng @Qualifier chỉ định tường minh tên Bean là "smsServiceImpl1"
@Autowired
@Qualifier(value = "smsServiceImpl1")
private SmsService smsService;
```

Trong thực tế phát triển, chúng ta vẫn nên dùng annotation `@Qualifier` để chỉ định tên một cách tường minh thay vì phụ thuộc vào tên biến.

`@Resource` bắt nguồn từ đặc tả **JSR-250**. Từ JDK 6 đến JDK 10, `javax.annotation.Resource` được đi kèm sẵn với JDK; bắt đầu từ JDK 11 trở đi cần thêm dependency API riêng. Các dự án Spring 5 / Java EE 8 thường dùng `javax.annotation-api`, còn các dự án Spring 6 / Jakarta EE 9 trở lên dùng `jakarta.annotation-api`.

Logic xử lý của Spring đối với `@Resource` (trường hợp không truyền tham số) như sau:

1. **Khớp theo tên (`byName`)**: Mặc định lấy tên trường (Field Name) làm tên bean để tìm kiếm trong container. Nếu tìm thấy Bean có tên đó thì inject trực tiếp.
2. **Dự phòng (fallback) sang khớp theo kiểu (`byType`)**: Nếu **không** tìm thấy Bean nào cùng tên, Spring sẽ lùi lại một bước, thử tìm kiếm theo **kiểu (type)** của trường đó. **Cách đánh giá kết quả khớp theo kiểu**:
   - **Tìm thấy 1 Bean**: Inject thành công.
   - **Tìm thấy 0 Bean**: Ném ngoại lệ (`NoSuchBeanDefinitionException`).
   - **Tìm thấy >1 Bean**: Ném ngoại lệ (`NoUniqueBeanDefinitionException`).

`@Resource` có hai thuộc tính khá quan trọng và thường dùng trong phát triển hằng ngày: `name` (tên) và `type` (kiểu).

```java
public @interface Resource {
    String name() default "";
    Class<?> type() default Object.class;
}
```

Nếu chỉ định riêng thuộc tính `name` thì phương thức inject là `byName`; nếu chỉ định riêng thuộc tính `type` thì phương thức inject là `byType`; nếu chỉ định đồng thời cả `name` và `type` (không khuyến nghị làm vậy) thì phương thức inject là `byType` + `byName`.

```java
// Lỗi, cả byName lẫn byType đều không thể khớp duy nhất được bean
@Resource
private SmsService smsService;
// Inject chính xác bean tương ứng với đối tượng SmsServiceImpl1
@Resource
private SmsService smsServiceImpl1;
// Inject chính xác bean tương ứng với đối tượng SmsServiceImpl1 (cách này khá được khuyến nghị)
@Resource(name = "smsServiceImpl1")
private SmsService smsService;
```

**Tóm tắt ngắn gọn**:

- `@Autowired` là annotation do Spring cung cấp, còn `@Resource` là annotation do đặc tả Jakarta Annotations / JSR-250 cung cấp.
- Cách inject mặc định của `@Autowired` là `byType` (khớp theo kiểu), còn cách inject mặc định của `@Resource` là `byName` (khớp theo tên).
- Khi một interface có nhiều lớp hiện thực, cả `@Autowired` và `@Resource` đều cần thông qua tên mới có thể khớp chính xác Bean tương ứng. `@Autowired` có thể dùng `@Qualifier` để chỉ định tên tường minh, còn `@Resource` có thể dùng thuộc tính `name` để chỉ định tên tường minh.
- `@Autowired` hỗ trợ sử dụng trên constructor, method, field và tham số (parameter). `@Resource` chủ yếu dùng cho field và method injection, không hỗ trợ trên constructor hoặc tham số.

Xét thấy `@Resource` có ngữ nghĩa rõ ràng hơn (ưu tiên theo tên), lại là chuẩn Java giúp giảm sự phụ thuộc chặt chẽ vào Spring Framework, chúng ta thường **khuyến khích dùng `@Resource` hơn**, đặc biệt trong các tình huống cần inject theo tên. Trong khi đó, `@Autowired` kết hợp với Constructor Injection lại có ưu thế về tính bất biến (immutability) và tính bắt buộc của dependency, cũng là một thực hành rất tốt.

### Có những cách nào để inject Bean?

Các cách phổ biến của Dependency Injection (DI):

1. Constructor Injection (tiêm qua hàm khởi tạo): Inject các dependency thông qua constructor của lớp.
2. Setter Injection (tiêm qua phương thức Setter): Inject các dependency thông qua các phương thức Setter của lớp.
3. Field Injection (tiêm trực tiếp vào trường): Dùng trực tiếp annotation (như `@Autowired` hoặc `@Resource`) trên trường (field) của lớp để inject dependency.

Ví dụ Constructor Injection:

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    //...
}
```

Ví dụ Setter Injection:

```java
@Service
public class UserService {

    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    //...
}
```

Ví dụ Field Injection:

```java
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    //...
}
```

### ⭐️Nên dùng Constructor Injection hay Setter Injection?

Tài liệu chính thức của Spring có câu trả lời cho vấn đề này: <https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html#beans-setter-injection>.

Ở đây mình chủ yếu trích lọc, tổng hợp và hoàn thiện lại khuyến nghị chính thức của Spring.

**Spring chính thức khuyến nghị dùng Constructor Injection**, phương thức inject này có các ưu điểm sau:

1. Tính toàn vẹn của dependency: Đảm bảo tất cả các dependency bắt buộc đều được inject ngay khi đối tượng được tạo ra, tránh nguy cơ lỗi `NullPointerException`.
2. Tính bất biến (Immutability): Giúp tạo ra các đối tượng bất biến, nâng cao tính an toàn luồng (thread safety).
3. Đảm bảo khởi tạo: Thành phần (component) đã được khởi tạo hoàn chỉnh trước khi sử dụng, giảm thiểu lỗi tiềm ẩn.
4. Thuận tiện cho kiểm thử: Trong Unit Test, có thể truyền trực tiếp các dependency giả lập (mock) qua constructor mà không cần phụ thuộc vào Spring Container để inject.

Constructor Injection phù hợp để xử lý các **dependency bắt buộc**, trong khi **Setter Injection** phù hợp hơn cho các **dependency tùy chọn (optional)**—những dependency có thể mang giá trị mặc định hoặc được thiết lập động trong vòng đời đối tượng. Mặc dù `@Autowired` có thể dùng trên phương thức Setter cho các dependency bắt buộc, Constructor Injection vẫn là lựa chọn tốt hơn.

Trong một số trường hợp (chẳng hạn các lớp từ thư viện bên thứ ba không cung cấp phương thức Setter), Constructor Injection có thể là **lựa chọn duy nhất**.

### ⭐️Các Scope (phạm vi) của Bean trong Spring là gì?

Scope của Bean trong Spring thường có các loại dưới đây:

- **singleton**: Trong IoC Container chỉ có duy nhất một instance của bean. Bean trong Spring mặc định đều là singleton, là ứng dụng của Singleton Design Pattern.
- **prototype**: Mỗi lần lấy đều tạo ra một bean instance mới. Nghĩa là gọi `getBean()` hai lần liên tiếp sẽ thu được hai instance Bean khác nhau.
- **request** (chỉ khả dụng trong ứng dụng Web): Mỗi một HTTP request sẽ tạo ra một bean mới (request bean), bean này chỉ có hiệu lực trong phạm vi HTTP request hiện tại.
- **session** (chỉ khả dụng trong ứng dụng Web): Mỗi HTTP request đến từ một session mới sẽ tạo ra một bean mới (session bean), bean này chỉ có hiệu lực trong phạm vi HTTP session hiện tại.
- **application/global-session** (chỉ khả dụng trong ứng dụng Web): Mỗi ứng dụng Web tạo ra một Bean khi khởi động (application bean), bean này chỉ có hiệu lực trong suốt thời gian chạy của ứng dụng hiện tại.
- **websocket** (chỉ khả dụng trong ứng dụng Web): Mỗi phiên WebSocket tạo ra một bean mới.

**Cấu hình scope của bean như thế nào?**

Cách dùng XML:

```xml
<bean id="..." class="..." scope="singleton"></bean>
```

Cách dùng Annotation:

```java
@Bean
@Scope(value = ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public Person personPrototype() {
    return new Person();
}
```

### ⭐️Bean có an toàn luồng (thread-safe) không?

Bean trong Spring Framework có thread-safe hay không phụ thuộc vào scope và trạng thái của nó.

Ở đây chúng ta lấy hai scope phổ biến nhất là `prototype` và `singleton` làm ví dụ. Hầu hết mọi kịch bản đều sử dụng scope mặc định `singleton`, nên chủ yếu cần quan tâm đến scope `singleton`.

Ở scope `prototype`, mỗi lần lấy từ container sẽ tạo ra một bean instance mới, giúp giảm xác suất chia sẻ ở cấp độ container, nhưng bản thân scope không đảm bảo an toàn luồng: nếu bên gọi chia sẻ cùng một instance `prototype` cho nhiều Thread, vẫn có thể xảy ra tranh chấp tài nguyên. Ở scope `singleton`, trong IoC Container chỉ có duy nhất một bean instance, nên càng dễ phát sinh vấn đề tranh chấp trạng thái dùng chung (tùy thuộc vào việc Bean có trạng thái hay không).

Ví dụ Bean có trạng thái (Stateful Bean):

```java
// Định nghĩa một lớp giỏ hàng, trong đó chứa một List lưu các sản phẩm trong giỏ hàng của người dùng
@Component
public class ShoppingCart {
    private List<String> items = new ArrayList<>();

    public void addItem(String item) {
        items.add(item);
    }

    public List<String> getItems() {
        return items;
    }
}
```

Tuy nhiên, phần lớn Bean trên thực tế đều là không trạng thái (Stateless — không định nghĩa các biến thành viên có thể thay đổi), chẳng hạn như Dao, Service; trong trường hợp này, Bean là thread-safe.

Ví dụ Bean không trạng thái (Stateless Bean):

```java
// Định nghĩa một dịch vụ người dùng, chỉ chứa logic nghiệp vụ mà không lưu giữ bất kỳ trạng thái nào
@Component
public class UserService {

    public User findUserById(Long id) {
        //...
    }
    //...
}
```

Đối với vấn đề thread-safe của singleton Bean có trạng thái, có ba cách giải quyết phổ biến:

1. **Tránh biến thành viên có thể thay đổi (mutable)**: Cố gắng thiết kế Bean theo hướng stateless.
2. **Sử dụng `ThreadLocal`**: Lưu các biến thành viên có thể thay đổi vào trong `ThreadLocal` để đảm bảo tính độc lập theo từng Thread.
3. **Sử dụng cơ chế đồng bộ hóa**: Dùng `synchronized` hoặc `ReentrantLock` để kiểm soát đồng bộ, đảm bảo thread-safe.

Dưới đây lấy `ThreadLocal` làm ví dụ, minh họa kịch bản dùng `ThreadLocal` lưu thông tin đăng nhập người dùng:

```java
public class UserThreadLocal {

    private UserThreadLocal() {}

    private static final ThreadLocal<SysUser> LOCAL = ThreadLocal.withInitial(() -> null);

    public static void put(SysUser sysUser) {
        LOCAL.set(sysUser);
    }

    public static SysUser get() {
        return LOCAL.get();
    }

    public static void remove() {
        LOCAL.remove();
    }
}
```

### ⭐️Bạn có nắm rõ vòng đời (Lifecycle) của Bean không?

1. **Khởi tạo instance của Bean**: Trước tiên, Bean Container tìm định nghĩa Bean trong file cấu hình, sau đó chọn chiến lược khởi tạo phù hợp (factory method, tự động lắp ráp qua constructor hoặc khởi tạo đơn giản) để tạo instance Bean thông qua Java Reflection API.
2. **Gán/điền thuộc tính cho Bean (Populate Properties)**: Thiết lập các thuộc tính và dependency liên quan cho Bean, ví dụ xử lý các annotation như `@Autowired`, `@Value`, `@Resource` được đánh dấu trên field hoặc phương thức Setter.
3. **Khởi tạo Bean (Initialization)**:
   - Nếu Bean hiện thực interface `BeanNameAware`, gọi phương thức `setBeanName()`, truyền vào tên của Bean.
   - Nếu Bean hiện thực interface `BeanClassLoaderAware`, gọi phương thức `setBeanClassLoader()`, truyền vào instance của đối tượng `ClassLoader`.
   - Nếu Bean hiện thực interface `BeanFactoryAware`, gọi phương thức `setBeanFactory()`, truyền vào instance của đối tượng `BeanFactory`.
   - Tương tự như trên, nếu hiện thực các interface `*.Aware` khác thì gọi phương thức tương ứng.
   - Nếu có các đối tượng `BeanPostProcessor` liên kết với Spring Container đang nạp Bean này, thực thi phương thức `postProcessBeforeInitialization()`.
   - Nếu Bean hiện thực interface `InitializingBean`, thực thi phương thức `afterPropertiesSet()`.
   - Nếu định nghĩa Bean trong file cấu hình có chứa thuộc tính `init-method`, thực thi phương thức được chỉ định.
   - Nếu có các đối tượng `BeanPostProcessor` liên kết với Spring Container đang nạp Bean này, thực thi phương thức `postProcessAfterInitialization()`.
4. **Hủy Bean (Destruction)**: Hủy ở đây không có nghĩa là hủy ngay lập tức Bean, mà là ghi nhận lại các phương thức hủy của Bean để sau này khi cần hủy Bean hoặc hủy container thì gọi các phương thức đó nhằm giải phóng tài nguyên mà Bean đang nắm giữ.
   - Nếu Bean hiện thực interface `DisposableBean`, thực thi phương thức `destroy()`.
   - Nếu định nghĩa Bean trong file cấu hình có chứa thuộc tính `destroy-method`, thực thi phương thức hủy Bean được chỉ định. Hoặc có thể dùng trực tiếp annotation `@PreDestroy` để đánh dấu phương thức chạy trước khi Bean bị hủy.

Trong phương thức `doCreateBean()` của `AbstractAutowireCapableBeanFactory`, có thể thấy 4 giai đoạn này được thực thi tuần tự:

```java
protected Object doCreateBean(final String beanName, final RootBeanDefinition mbd, final @Nullable Object[] args)
    throws BeanCreationException {

    // 1. Tạo instance của Bean
    BeanWrapper instanceWrapper = null;
    if (instanceWrapper == null) {
        instanceWrapper = createBeanInstance(beanName, mbd, args);
    }

    Object exposedObject = bean;
    try {
        // 2. Gán / điền thuộc tính cho Bean
        populateBean(beanName, mbd, instanceWrapper);
        // 3. Khởi tạo Bean
        exposedObject = initializeBean(beanName, exposedObject, mbd);
    }

    // 4. Hủy Bean - đăng ký các callback hủy
    try {
        registerDisposableBeanIfNecessary(beanName, bean, mbd);
    }

    return exposedObject;
}
```

Các interface `Aware` cho phép Bean lấy được tài nguyên của Spring Container.

Các interface `Aware` chính được Spring cung cấp gồm có:

1. `BeanNameAware`: Inject `beanName` tương ứng với bean hiện tại;
2. `BeanClassLoaderAware`: Inject `ClassLoader` đã nạp bean hiện tại;
3. `BeanFactoryAware`: Inject tham chiếu tới container `BeanFactory` hiện tại.

Interface `BeanPostProcessor` là điểm mở rộng (extension point) mạnh mẽ do Spring cung cấp để chỉnh sửa Bean.

```java
public interface BeanPostProcessor {

	// Xử lý tiền khởi tạo
	default Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}

	// Xử lý hậu khởi tạo
	default Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}

}
```

- `postProcessBeforeInitialization`: Chạy sau khi Bean được khởi tạo instance và inject thuộc tính, và trước `InitializingBean#afterPropertiesSet` cũng như phương thức `init-method` tùy chỉnh;
- `postProcessAfterInitialization`: Tương tự như trên, nhưng chạy sau `InitializingBean#afterPropertiesSet` và phương thức `init-method` tùy chỉnh.

`InitializingBean` và `init-method` là các điểm mở rộng do Spring cung cấp cho bước khởi tạo Bean.

```java
public interface InitializingBean {
 // Logic khởi tạo
	void afterPropertiesSet() throws Exception;
}
```

Chỉ định phương thức `init-method` để định nghĩa phương thức khởi tạo:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="demo" class="com.chaycao.Demo" init-method="init"/>

</beans>
```

**Làm sao để ghi nhớ?**

1. Nhìn tổng thể có thể chia đơn giản thành bốn bước: Khởi tạo instance -> Điền thuộc tính -> Khởi tạo (Initialization) -> Hủy (Destruction).
2. Bước khởi tạo liên quan đến nhiều bước nhỏ hơn, bao gồm việc inject phụ thuộc qua các interface `Aware`, xử lý trước và sau khi khởi tạo của `BeanPostProcessor`, cũng như các thao tác khởi tạo của `InitializingBean` và `init-method`.
3. Bước hủy sẽ đăng ký các callback hủy tương ứng, và cuối cùng thực hiện hủy thông qua `DisposableBean` và `destroy-method`.

Cuối cùng, chia sẻ thêm một sơ đồ minh họa rất rõ ràng (nguồn ảnh: [Cách ghi nhớ vòng đời Spring Bean](https://chaycao.github.io/2020/02/15/如何记忆Spring-Bean的生命周期.html)).

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/spring-bean-lifestyle-b04e8cd5.png)

## Spring AOP

### ⭐️Hãy chia sẻ hiểu biết của bạn về AOP

AOP (Aspect-Oriented Programming: Lập trình hướng khía cạnh) có thể đóng gói các logic hoặc trách nhiệm không liên quan đến nghiệp vụ chính nhưng lại được các module nghiệp vụ cùng gọi chung (ví dụ xử lý giao dịch Transaction, quản lý log, kiểm soát phân quyền, v.v.), giúp giảm thiểu code trùng lặp trong hệ thống, hạ thấp mức độ phụ thuộc giữa các module và có lợi cho khả năng mở rộng cũng như bảo trì về sau.

Spring AOP dựa trên Dynamic Proxy. Nếu đối tượng cần được proxy có hiện thực một interface nào đó, Spring AOP sẽ dùng **JDK Proxy** để tạo đối tượng proxy; còn đối với đối tượng không hiện thực interface nào thì không thể dùng JDK Proxy, lúc này Spring AOP sẽ dùng **Cglib** để sinh ra một lớp con (subclass) của đối tượng được proxy làm proxy, như minh họa dưới đây:

![SpringAOPProcess](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/230ae587a322d6e4d09510161987d346-1e9492d2.jpg)

Tất nhiên bạn cũng có thể dùng **AspectJ**! Spring AOP đã tích hợp sẵn AspectJ; AspectJ có thể xem là AOP framework hoàn thiện nhất trong hệ sinh thái Java.

Một số thuật ngữ chuyên môn liên quan đến lập trình hướng khía cạnh AOP:

| Thuật ngữ        |                                               Ý nghĩa                                                |
| :--------------- | :--------------------------------------------------------------------------------------------------: |
| Target (Mục tiêu) |                                  Đối tượng được áp dụng Advice (tác động)                             |
| Proxy            |                      Đối tượng proxy được tạo ra sau khi áp dụng Advice lên đối tượng Target          |
| JoinPoint (Điểm nối) |               Tất cả các phương thức được định nghĩa trong lớp của đối tượng Target đều là JoinPoint  |
| Pointcut (Điểm cắt) | Các JoinPoint bị Aspect chặn / tăng cường (Pointcut chắc chắn là JoinPoint, nhưng JoinPoint chưa chắc là Pointcut) |
| Advice (Thông báo / Logic tăng cường) | Logic / mã nguồn tăng cường, tức là việc cần làm sau khi chặn được JoinPoint của đối tượng Target |
| Aspect (Khía cạnh) |                                         Pointcut + Advice                                            |
| Weaving (Dệt)    |                      Quá trình áp dụng Advice vào đối tượng Target để tạo ra đối tượng Proxy          |

### ⭐️Spring AOP và AspectJ AOP khác nhau như thế nào?

| Đặc điểm              | Spring AOP                                                                       | AspectJ                                                                  |
| --------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Cách thức tăng cường** | Tăng cường lúc chạy (runtime enhancement, dựa trên Dynamic Proxy)             | Tăng cường lúc biên dịch hoặc lúc nạp lớp (thao tác trực tiếp bytecode)  |
| **Hỗ trợ Pointcut**   | Cấp độ phương thức (trong phạm vi Spring Bean, không hỗ trợ phương thức `final` và `static`) | Phương thức, trường (field), constructor, phương thức static, v.v.      |
| **Hiệu năng**         | Lúc chạy phụ thuộc vào proxy nên có chi phí nhất định; hiệu năng giảm khi nhiều Aspect | Không tốn chi phí proxy lúc chạy, hiệu năng cao hơn                     |
| **Độ phức tạp**       | Đơn giản, dễ dùng, phù hợp với đa số kịch bản                                    | Tính năng mạnh mẽ, nhưng tương đối phức tạp                              |
| **Kịch bản sử dụng**  | Các nhu cầu AOP tương đối đơn giản trong ứng dụng Spring                         | Các nhu cầu AOP đòi hỏi hiệu năng cao, độ phức tạp cao                   |

**Lựa chọn như thế nào?**

- **Xét về tính năng**: AspectJ hỗ trợ các kịch bản AOP phức tạp hơn, còn Spring AOP đơn giản và dễ dùng hơn. Nếu bạn cần tăng cường cho phương thức `final`, phương thức `static`, truy cập trường (field), gọi constructor, v.v., hoặc cần áp dụng logic tăng cường lên các đối tượng không do Spring quản lý, AspectJ là lựa chọn duy nhất.
- **Xét về hiệu năng**: Khi số lượng Aspect ít, sự khác biệt hiệu năng giữa hai bên không lớn; nhưng khi số lượng Aspect nhiều, AspectJ cho hiệu năng vượt trội hơn.

**Tóm tắt trong một câu**: Kịch bản đơn giản ưu tiên dùng Spring AOP; khi gặp kịch bản phức tạp hoặc yêu cầu hiệu năng cao, hãy chọn AspectJ.

### ⭐️Có những loại Advice phổ biến nào trong AOP?

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/aspectj-advice-types-ace45b9f.jpg)

- **Before** (Tiền thông báo): Kích hoạt trước khi gọi phương thức của đối tượng mục tiêu.
- **After** (Hậu thông báo): Kích hoạt sau khi gọi phương thức của đối tượng mục tiêu.
- **AfterReturning** (Thông báo khi trả về): Kích hoạt sau khi phương thức của đối tượng mục tiêu gọi xong và trả về giá trị kết quả.
- **AfterThrowing** (Thông báo khi có ngoại lệ): Kích hoạt sau khi phương thức của đối tượng mục tiêu ném / phát sinh ngoại lệ trong lúc chạy. `AfterReturning` và `AfterThrowing` loại trừ lẫn nhau: nếu phương thức chạy thành công không có ngoại lệ thì có giá trị trả về; nếu phương thức ném ra ngoại lệ thì sẽ không có giá trị trả về.
- **Around** (Thông báo bao quanh): Kiểm soát bằng lập trình đối với việc gọi phương thức của đối tượng mục tiêu. Around là loại Advice có phạm vi thao tác lớn nhất trong tất cả các loại Advice, bởi vì nó có thể lấy trực tiếp đối tượng mục tiêu cũng như phương thức sắp thực thi, nên Around có thể tùy ý thực hiện các thao tác trước và sau khi gọi phương thức của đối tượng mục tiêu, thậm chí không gọi phương thức của đối tượng mục tiêu luôn.

### Làm thế nào để kiểm soát thứ tự thực thi của nhiều Aspect?

1. Thông thường dùng trực tiếp annotation `@Order` để định nghĩa thứ tự của Aspect:

```java
// Giá trị càng nhỏ thì độ ưu tiên càng cao
@Order(3)
@Component
@Aspect
public class LoggingAspect implements Ordered {
```

**2. Hiện thực interface `Ordered` và ghi đè phương thức `getOrder`.**

```java
@Component
@Aspect
public class LoggingAspect implements Ordered {

    // ....

    @Override
    public int getOrder() {
        // Giá trị trả về càng nhỏ thì độ ưu tiên càng cao
        return 1;
    }
}
```

## Spring MVC

### Hãy chia sẻ hiểu biết của bạn về Spring MVC

MVC là viết tắt của Model (Mô hình), View (Giao diện), Controller (Bộ điều khiển), với tư tưởng cốt lõi là tổ chức mã nguồn thông qua việc tách biệt logic nghiệp vụ, dữ liệu và hiển thị.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210809181452421-6736fa66.png)

Trên mạng có nhiều người nói MVC không phải là Design Pattern mà chỉ là quy chuẩn thiết kế phần mềm; cá nhân mình thiên về quan điểm MVC cũng là một trong số rất nhiều Design Pattern. Trong dự án **[java-design-patterns](https://github.com/iluwatar/java-design-patterns)** cũng có giới thiệu về MVC.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/159b3d3e70dd45e6afa81bf06d09264e-302b7137.png)

Để thực sự hiểu được Spring MVC, trước tiên hãy cùng nhìn lại hai thời kỳ Model 1 và Model 2 khi chưa có Spring MVC.

**Thời kỳ Model 1**

Nhiều bạn học Java backend muộn hơn có thể chưa từng tiếp xúc với việc phát triển ứng dụng JavaWeb ở thời kỳ Model 1. Trong mô hình Model 1, gần như toàn bộ ứng dụng Web được cấu thành từ các trang JSP, chỉ dùng một lượng nhỏ JavaBean để xử lý kết nối và truy vấn cơ sở dữ liệu.

Trong mô hình này, JSP vừa là tầng điều khiển (Controller) vừa là tầng trình bày (View). Rõ ràng, mô hình này tồn tại rất nhiều vấn đề: logic điều khiển và logic hiển thị trộn lẫn vào nhau khiến tỷ lệ tái sử dụng code cực thấp; ngoài ra frontend và backend phụ thuộc lẫn nhau, rất khó kiểm thử, bảo trì và hiệu suất phát triển cực kỳ thấp.

![mvc-mode1](/media/jg/ext/oss.javaguide.cn/java-guide-blog/mvc-mode1-54ff9f98.png)

**Thời kỳ Model 2**

Những bạn từng học Servlet và làm các Demo liên quan chắc hẳn đều biết đến mô hình phát triển "Java Bean (Model) + JSP (View) + Servlet (Controller)"—đây chính là mô hình phát triển MVC thời kỳ đầu của JavaWeb.

- Model: Dữ liệu liên quan đến hệ thống, tức là các DAO và Bean.
- View: Hiển thị dữ liệu trong model, chỉ dùng để trình bày.
- Controller: Tiếp nhận request của người dùng, chuyển tiếp request tới Model, cuối cùng trả dữ liệu về JSP để hiển thị cho người dùng.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/mvc-model2-b3630bee.png)

Ở mô hình Model 2 vẫn còn nhiều vấn đề: mức độ trừu tượng hóa và đóng gói của Model 2 còn kém xa mức cần thiết; khi phát triển bằng Model 2 khó tránh khỏi việc phải viết lặp lại các thành phần cơ bản (phát minh lại bánh xe), làm giảm mạnh khả năng bảo trì và tái sử dụng của chương trình.

Vì thế, rất nhiều framework MVC cho phát triển JavaWeb đã ra đời như Struts2, nhưng Struts2 khá cồng kềnh.

**Thời kỳ Spring MVC**

Cùng với sự phổ biến của framework phát triển nhẹ Spring, hệ sinh thái Spring xuất hiện framework Spring MVC—và Spring MVC là framework MVC xuất sắc nhất hiện nay. So với Struts2, Spring MVC dễ sử dụng và thuận tiện hơn, hiệu suất phát triển cao hơn, đồng thời tốc độ chạy cũng nhanh hơn.

MVC là một Design Pattern, còn Spring MVC là một MVC framework rất xuất sắc. Spring MVC giúp chúng ta phát triển tầng Web một cách gọn gàng hơn và tích hợp tự nhiên với Spring Framework. Với Spring MVC, dự án backend thường được chia thành tầng Service (xử lý nghiệp vụ), tầng Dao (thao tác cơ sở dữ liệu), tầng Entity (các lớp thực thể) và tầng Controller (tầng điều khiển, trả dữ liệu về giao diện phía client).

### Các thành phần cốt lõi của Spring MVC là gì?

Ghi nhớ những thành phần dưới đây cũng chính là ghi nhớ nguyên lý hoạt động của Spring MVC:

- **`DispatcherServlet`**: **Bộ điều phối trung tâm cốt lõi**, chịu trách nhiệm tiếp nhận request, phân phối request và trả response về cho client.
- **`HandlerMapping`**: **Bộ ánh xạ handler**, dựa vào URL để tìm kiếm `Handler` có thể xử lý, đồng thời đóng gói các interceptor liên quan cùng với `Handler`.
- **`HandlerAdapter`**: **Bộ điều hợp handler**, dựa vào `Handler` mà `HandlerMapping` tìm được để thích ứng và thực thi `Handler` tương ứng.
- **`Handler`**: **Bộ xử lý request**, thành phần thực sự xử lý yêu cầu.
- **`ViewResolver`**: **Bộ phân giải View**, dựa vào logical view / view mà `Handler` trả về để phân giải và render ra View thực sự, rồi chuyển cho `DispatcherServlet` phản hồi về client.

### ⭐️Bạn có hiểu nguyên lý hoạt động của Spring MVC không?

**Nguyên lý hoạt động của Spring MVC được minh họa như hình dưới đây:**

> Sơ đồ nguyên lý hoạt động của Spring MVC này mình không tự vẽ, mà lấy cho tiện một sơ đồ cực kỳ rõ ràng trực quan tìm được trên mạng (không rõ nguồn gốc ban đầu).

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/de6d2b213f112297298f3e223bf08f28-f647bc8f.png)

**Giải thích luồng xử lý (quan trọng):**

1. Client (trình duyệt) gửi request, `DispatcherServlet` chặn request đó.
2. `DispatcherServlet` dựa vào thông tin request để gọi `HandlerMapping`. `HandlerMapping` căn cứ theo URL để đối chiếu tìm `Handler` có thể xử lý (tức là `Controller` mà chúng ta thường nói), đồng thời đóng gói các interceptor liên quan cùng với `Handler`.
3. `DispatcherServlet` gọi bộ điều hợp `HandlerAdapter` để thực thi `Handler`.
4. Sau khi `Handler` xử lý xong request của người dùng, nó trả về một đối tượng `ModelAndView` cho `DispatcherServlet`. Đúng như tên gọi, `ModelAndView` chứa cả mô hình dữ liệu lẫn thông tin view tương ứng: `Model` là đối tượng dữ liệu trả về, còn `View` là một `View` mang tính logic.
5. `ViewResolver` căn cứ theo `View` logic để tìm ra `View` thực tế.
6. `DispatcherServlet` truyền `Model` trả về sang cho `View` (quá trình render View).
7. Trả `View` đã render về cho bên yêu cầu (trình duyệt).

Luồng trên là nguyên lý hoạt động theo mô hình phát triển truyền thống (JSP, Thymeleaf, v.v.). Tuy nhiên hiện nay phương thức phát triển chủ đạo là tách biệt frontend-backend (frontend-backend separation), trong trường hợp này khái niệm `View` của Spring MVC đã có sự thay đổi. Vì `View` thường được xử lý bởi các framework frontend (Vue, React, v.v.), backend không còn chịu trách nhiệm render trang nữa mà chỉ chịu trách nhiệm cung cấp dữ liệu, do đó:

- Khi tách biệt frontend-backend, backend thường không còn trả về một view cụ thể mà trả về **dữ liệu thuần túy** (thường ở định dạng JSON), để frontend tự render và hiển thị.
- Phần `View` trong mô hình tách biệt frontend-backend thường không cần thiết lập nữa; các phương thức trong Controller của Spring MVC chỉ cần trả dữ liệu trực tiếp thay vì trả về `ModelAndView`, Spring sẽ tự động chuyển đổi sang định dạng JSON. Tương ứng, `ViewResolver` cũng không còn được sử dụng nữa.

Làm thế nào để đạt được điều đó?

- Dùng annotation `@RestController` thay thế cho `@Controller` truyền thống; như vậy tất cả các phương thức mặc định sẽ trả về dữ liệu dạng JSON thay vì cố gắng phân giải View.
- Nếu bạn dùng `@Controller`, có thể kết hợp thêm annotation `@ResponseBody` để trả về JSON.

### Xử lý ngoại lệ tập trung (Global Exception Handling) làm thế nào?

Khuyến nghị dùng cách xử lý ngoại lệ tập trung bằng annotation, cụ thể là kết hợp hai annotation `@ControllerAdvice` + `@ExceptionHandler`.

```java
@ControllerAdvice
@ResponseBody
public class GlobalExceptionHandler {

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<?> handleAppException(BaseException ex, HttpServletRequest request) {
      //......
    }

    @ExceptionHandler(value = ResourceNotFoundException.class)
    public ResponseEntity<ErrorReponse> handleResourceNotFoundException(ResourceNotFoundException ex, HttpServletRequest request) {
      //......
    }
}
```

Cách xử lý ngoại lệ này không phải là tạo AOP Proxy cho `Controller`. Sau khi phương thức trong `Controller` ném ra ngoại lệ, Spring MVC sẽ đi qua chuỗi xử lý `HandlerExceptionResolver` để tìm phương thức `@ExceptionHandler` có khả năng xử lý ngoại lệ đó.

Phương thức `getMappedMethod` trong `ExceptionHandlerMethodResolver` quyết định ngoại lệ sẽ được phương thức gắn `@ExceptionHandler` nào xử lý:

```java
@Nullable
  private Method getMappedMethod(Class<? extends Throwable> exceptionType) {
    List<Class<? extends Throwable>> matches = new ArrayList<>();
    // Tìm tất cả thông tin ngoại lệ có thể xử lý. mappedMethods lưu ánh xạ giữa ngoại lệ và phương thức xử lý
    for (Class<? extends Throwable> mappedException : this.mappedMethods.keySet()) {
      if (mappedException.isAssignableFrom(exceptionType)) {
        matches.add(mappedException);
      }
    }
    // Không rỗng nghĩa là có phương thức xử lý được ngoại lệ
    if (!matches.isEmpty()) {
      // Sắp xếp tăng dần theo độ khớp
      matches.sort(new ExceptionDepthComparator(exceptionType));
      // Trả về phương thức xử lý ngoại lệ phù hợp nhất
      return this.mappedMethods.get(matches.get(0));
    }
    else {
      return null;
    }
  }
```

Nhìn từ mã nguồn có thể thấy: **`getMappedMethod()` trước tiên tìm tất cả các phương thức có thể khớp để xử lý ngoại lệ, sau đó sắp xếp chúng theo thứ tự tăng dần của độ sâu kế thừa, và cuối cùng chọn phương thức khớp nhỏ nhất (tức là phương thức có độ khớp cao nhất / sát nhất).**

## Spring Framework sử dụng những Design Pattern nào?

> Để xem giải thích chi tiết về các mẫu thiết kế dưới đây, bạn có thể đọc bài viết [Giải thích chi tiết các Design Pattern trong Spring](https://javaguide.cn/system-design/framework/spring/spring-design-patterns-summary.html).

- **Factory Pattern**: Spring sử dụng Factory Pattern để tạo đối tượng bean thông qua `BeanFactory` và `ApplicationContext`.
- **Proxy Pattern**: Hiện thực các tính năng của Spring AOP.
- **Singleton Pattern**: Các Bean trong Spring mặc định đều là Singleton.
- **Template Method Pattern**: Các lớp thao tác cơ sở dữ liệu có tên kết thúc bằng `Template` trong Spring như `JdbcTemplate`, `HibernateTemplate` sử dụng mẫu Template Method.
- **Wrapper/Decorator Pattern**: Dự án của chúng ta cần kết nối tới nhiều cơ sở dữ liệu và mỗi khách hàng trong từng lần truy cập có nhu cầu truy cập các cơ sở dữ liệu khác nhau. Mẫu thiết kế này cho phép chúng ta chuyển đổi linh hoạt các DataSource khác nhau theo nhu cầu của từng khách hàng.
- **Observer Pattern**: Mô hình hướng sự kiện (Event-driven model) của Spring là một ứng dụng kinh điển của Observer Pattern.
- **Adapter Pattern**: Các Advice trong Spring AOP sử dụng Adapter Pattern; Spring MVC cũng dùng Adapter Pattern để thích ứng (adapt) các `Controller`.
- ...

## ⭐️Phụ thuộc vòng (Circular Dependency) trong Spring

### Bạn có biết về Circular Dependency trong Spring không, và Spring giải quyết như thế nào?

Circular Dependency (phụ thuộc vòng) là tình trạng các đối tượng Bean tham chiếu vòng tròn lẫn nhau, tức là hai hoặc nhiều Bean cùng nắm giữ tham chiếu của nhau, ví dụ `CircularDependencyA` -> `CircularDependencyB` -> `CircularDependencyA`.

```java
@Component
public class CircularDependencyA {
    @Autowired
    private CircularDependencyB circB;
}

@Component
public class CircularDependencyB {
    @Autowired
    private CircularDependencyA circA;
}
```

Việc một đối tượng tự phụ thuộc vào chính nó cũng tạo ra Circular Dependency, nhưng xác suất xảy ra trường hợp này rất thấp và thuộc lỗi viết code.

```java
@Component
public class CircularDependencyA {
    @Autowired
    private CircularDependencyA circA;
}
```

Spring Framework có thể giải quyết một số tình huống Circular Dependency theo kiểu Setter/Field Injection đối với các Singleton Bean thông qua cơ chế bộ nhớ đệm ba cấp (Three-level Cache). Các kịch bản như Circular Dependency qua Constructor hay Prototype Bean không thể giải quyết bằng cơ chế này.

Three-level Cache trong Spring thực chất là ba `Map` như sau:

```java
// Cache cấp 1
/** Cache of singleton objects: bean name to bean instance. */
private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);

// Cache cấp 2
/** Cache of early singleton objects: bean name to bean instance. */
private final Map<String, Object> earlySingletonObjects = new HashMap<>(16);

// Cache cấp 3
/** Cache of singleton factories: bean name to ObjectFactory. */
private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);
```

Nói một cách đơn giản, Three-level Cache của Spring bao gồm:

1. **Cache cấp 1 (`singletonObjects`)**: Lưu trữ các Bean ở dạng hoàn chỉnh (đã khởi tạo instance, điền thuộc tính, khởi tạo xong), còn gọi là singleton pool, sinh ra để phục vụ đặc tính Singleton của Spring. Thông thường khi lấy Bean chúng ta đều lấy từ đây, nhưng không phải tất cả Bean đều nằm trong singleton pool, ví dụ Prototype Bean sẽ không nằm trong đây.
2. **Cache cấp 2 (`earlySingletonObjects`)**: Lưu trữ Bean chuyển tiếp (bán thành phẩm, chưa điền thuộc tính), tức là đối tượng được tạo ra bởi `ObjectFactory` trong cache cấp 3. Phối hợp với cache cấp 3 để ngăn chặn việc trong trường hợp có AOP, mỗi lần gọi `ObjectFactory#getObject()` lại sinh ra một đối tượng proxy mới.
3. **Cache cấp 3 (`singletonFactories`)**: Lưu trữ `ObjectFactory`; phương thức `getObject()` của `ObjectFactory` (cuối cùng gọi `getEarlyBeanReference()`) có thể tạo ra đối tượng Bean gốc hoặc đối tượng proxy (nếu Bean bị AOP aspect proxy). Cache cấp 3 chỉ có hiệu lực với Singleton Bean.

Tiếp theo hãy nói về quy trình tạo/lấy Bean của Spring:

1. Đầu tiên tìm trong **cache cấp 1 `singletonObjects`**, nếu có thì trả về;
2. Nếu không có hoặc đối tượng đang trong quá trình khởi tạo, chuyển sang tìm trong **cache cấp 2 `earlySingletonObjects`**;
3. Nếu vẫn không lấy được, tiếp tục tìm trong **cache cấp 3 `singletonFactories`**, thực thi `ObjectFactory.getObject()` để lấy đối tượng; sau khi lấy thành công thì xóa khỏi cache cấp 3 và đưa đối tượng đó vào cache cấp 2.

Trong cache cấp 3 lưu trữ `ObjectFactory`:

```java
public interface ObjectFactory<T> {
    T getObject() throws BeansException;
}
```

Khi Spring tạo Bean, nếu cho phép Circular Dependency, Spring sẽ phơi bày sớm (early expose) đối tượng Bean vừa khởi tạo instance xong nhưng chưa khởi tạo xong các thuộc tính ra bên ngoài thông qua phương thức `addSingletonFactory` để thêm một đối tượng `ObjectFactory` vào cache cấp 3:

```java
// AbstractAutowireCapableBeanFactory # doCreateBean #
public abstract class AbstractAutowireCapableBeanFactory ... {
	protected Object doCreateBean(...) {
        //...

        // Hỗ trợ Circular Dependency: thêm ()->getEarlyBeanReference làm phương thức getObject() của một ObjectFactory vào cache cấp 3
		addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
    }
}
```

Như đã nói trong quy trình tạo Bean của Spring ở trên, nếu cả cache cấp 1 và cache cấp 2 đều không lấy được đối tượng, Spring sẽ vào cache cấp 3 và gọi phương thức `getObject` của `ObjectFactory` để lấy đối tượng.

```java
class A {
    // Sử dụng B
    private B b;
}
class B {
    // Sử dụng A
    private A a;
}
```

Lấy đoạn code Circular Dependency trên làm ví dụ, toàn bộ quy trình giải quyết diễn ra như sau:

- Sau khi Spring tạo `A`, phát hiện `A` phụ thuộc vào `B` nên đi tạo `B`; `B` lại phụ thuộc vào `A` nên đi tạo `A`;
- Lúc `B` đi tạo `A`, lúc này trên `A` xảy ra Circular Dependency; do `A` lúc này vẫn chưa khởi tạo xong nên trong **cache cấp 1 và cấp 2** chắc chắn chưa có `A`;
- Khi đó Spring vào cache cấp 3 gọi phương thức `getObject()` để lấy **đối tượng được phơi bày sớm (early-exposed object)** của `A`, tức là gọi phương thức `getEarlyBeanReference()` đã thêm ở trên nhằm sinh ra một **đối tượng phơi bày sớm** cho `A`;
- Sau đó xóa `ObjectFactory` này khỏi cache cấp 3 và đưa đối tượng phơi bày sớm vào cache cấp 2; như vậy `B` có thể inject đối tượng phơi bày sớm này vào dependency của mình để hỗ trợ Circular Dependency.

**Chỉ dùng hai cấp cache có đủ không?** Trong trường hợp không có AOP, thực sự hoàn toàn có thể chỉ dùng cache cấp 1 và cấp 2 để giải quyết Circular Dependency. Tuy nhiên, khi có liên quan đến AOP, cache cấp 3 trở nên rất quan trọng, vì nó đảm bảo rằng dù có nhiều lần yêu cầu lấy tham chiếu sớm trong quá trình tạo Bean, hệ thống luôn chỉ trả về cùng một đối tượng proxy duy nhất, qua đó tránh được lỗi một Bean có nhiều đối tượng proxy khác nhau.

**Cuối cùng tóm tắt lại cách Spring giải quyết bằng Three-level Cache**:

Ở phần Three-level Cache, chủ yếu cần nhớ cách Spring hỗ trợ Circular Dependency: tức là khi xảy ra Circular Dependency, Spring vào **cache cấp 3 `singletonFactories`** lấy `ObjectFactory` lưu trong đó và gọi phương thức `getObject()` của nó để thu được đối tượng phơi bày sớm của Bean bị phụ thuộc vòng (tuy chưa khởi tạo hoàn chỉnh nhưng đã có được địa chỉ lưu trữ của đối tượng trong Heap), đồng thời đặt đối tượng phơi bày sớm này vào cache cấp 2, nhờ vậy khi phụ thuộc vòng sẽ không bị khởi tạo lặp lại!

Tuy nhiên, cơ chế này cũng có những nhược điểm như tăng tiêu tốn bộ nhớ (phải duy trì bộ nhớ đệm ba cấp, tức ba Map) và làm giảm hiệu năng (cần thực hiện nhiều lần kiểm tra và chuyển đổi). Cơ chế này chỉ áp dụng được cho một số kịch bản Circular Dependency kiểu Setter/Field Injection ở Singleton Bean; còn Non-singleton Bean, Constructor Circular Dependency, v.v. vẫn không thể giải quyết bằng Three-level Cache.

### @Lazy có thể giải quyết Circular Dependency không?

`@Lazy` dùng để đánh dấu một lớp hoặc bean có cần khởi tạo trễ / nạp trễ (Lazy Initialization / Lazy Loading) hay không, có thể đặt trên class, method, constructor, tham số phương thức và field.

Spring Boot 2.2 đã bổ sung thêm **thuộc tính lazy initialization toàn cục**; khi bật lên, toàn bộ bean ở mức toàn cục sẽ được thiết lập nạp trễ, chỉ tạo khi có nhu cầu sử dụng.

Cấu hình lazy initialization toàn cục qua file cấu hình:

```properties
# Mặc định false
spring.main.lazy-initialization=true
```

Thiết lập lazy initialization toàn cục bằng code:

```java
SpringApplication springApplication=new SpringApplication(Start.class);
springApplication.setLazyInitialization(true);
springApplication.run(args);
```

Nếu không thực sự cần thiết, cố gắng đừng dùng lazy initialization toàn cục. Lazy initialization toàn cục sẽ khiến lần sử dụng đầu tiên của Bean bị chậm đi, đồng thời làm chậm quá trình phát hiện lỗi của ứng dụng (chỉ khi Bean được khởi tạo thì vấn đề mới bộc lộ).

Nếu một Bean không được đánh dấu là lazy, nó sẽ được tạo và khởi tạo ngay trong quá trình Spring IoC Container khởi động. Nếu một Bean được đánh dấu là lazy, nó sẽ không được khởi tạo instance ngay khi Spring IoC Container khởi động mà chỉ được tạo khi được yêu cầu lần đầu tiên. Điều này giúp giảm thời gian khởi tạo khi ứng dụng khởi động, và cũng có thể dùng để giải quyết vấn đề Circular Dependency.

Circular Dependency được giải quyết bằng `@Lazy` như thế nào? Lấy một ví dụ: giả sử có hai Bean `A` và `B` xảy ra Circular Dependency với nhau; ta có thể thêm `@Lazy` tại điểm inject `B` của `A`, ví dụ trên tham số constructor `A(@Lazy B b)`. Lúc này, đối tượng được phân giải trễ là dependency `B`, chứ không phải đơn thuần gắn `@Lazy` lên constructor hay kiểu của `A`.

- Đầu tiên Spring sẽ đi tạo Bean `A`, khi tạo cần inject thuộc tính `B`;
- Do tại điểm inject `B` của `A` có gắn `@Lazy`, nên Spring sẽ tạo ra một đối tượng proxy phân giải trễ (lazy-resolution proxy) cho `B` và inject đối tượng proxy này vào `A`;
- Sau đó tiến hành khởi tạo instance và initialization cho `B`; khi inject thuộc tính `A` trong `B`, lúc này `A` đã tạo xong nên có thể inject `A` vào ngay.

Từ quy trình nạp trên có thể thấy: mấu chốt để `@Lazy` giải quyết Circular Dependency nằm ở việc sử dụng đối tượng proxy:

- **Khi không có `@Lazy`**: Trong lúc Spring Container khởi tạo `A`, nó sẽ lập tức thử tạo `B`, và trong quá trình tạo `B` lại thử tạo `A`, cuối cùng dẫn đến Circular Dependency (tức đệ quy vô hạn rồi ném ra ngoại lệ).
- **Khi có `@Lazy`**: Spring sẽ không tạo `B` ngay lập tức, mà inject một đối tượng proxy của `B`. Vì lúc này `B` vẫn chưa thực sự được khởi tạo, quá trình khởi tạo của `A` có thể hoàn tất suôn sẻ. Đợi đến khi instance `A` thực sự gọi phương thức của `B`, đối tượng proxy mới kích hoạt quá trình khởi tạo thật sự của `B`.

Proxy tại điểm inject `@Lazy` có thể phá vỡ chuỗi Circular Dependency ở một mức độ nhất định, bao gồm cả một số kịch bản Constructor Injection. Tuy nhiên điều này không xóa bỏ Circular Dependency về mặt thiết kế; trong các mối quan hệ phụ thuộc phức tạp nó còn có thể gây ra những lỗi khởi tạo khó lường hơn, nên best practice vẫn là cố gắng tránh Circular Dependency ngay từ khâu thiết kế.

### Spring Boot có cho phép xảy ra Circular Dependency không?

Trước Spring Boot 2.6.x, mặc định hệ thống cho phép Circular Dependency, tức là nếu code của bạn gặp vấn đề Circular Dependency thì thông thường cũng không báo lỗi. Từ Spring Boot 2.6.x trở đi, phía chính thức không còn khuyến khích viết code có Circular Dependency nữa và đề xuất lập trình viên chủ động giảm bớt các phụ thuộc chéo không cần thiết khi viết code. Đây thực chất cũng là điều chúng ta nên làm nhất: bản thân Circular Dependency là một khiếm khuyết thiết kế, chúng ta không nên quá ỷ lại vào Spring mà bỏ qua quy chuẩn và chất lượng code—biết đâu một phiên bản Spring Boot trong tương lai sẽ cấm hoàn toàn code có Circular Dependency.

Từ Spring Boot 2.6.x trở đi, nếu bạn chưa muốn tái cấu trúc (refactor) phần code có Circular Dependency, bạn cũng có thể áp dụng các cách sau:

- Thiết lập cho phép Circular Reference trong file cấu hình toàn cục: `spring.main.allow-circular-references=true`. Đây là cách đơn giản thô bạo nhất, không khuyến khích.
- Thêm annotation `@Lazy` lên Bean/điểm inject gây ra Circular Dependency—đây là cách được khuyến nghị hơn. `@Lazy` dùng để đánh dấu lớp/dependency có cần khởi tạo trễ hay không, có thể đặt trên class, method, constructor, tham số phương thức và field.
- ...

## ⭐️Spring Transaction (Giao dịch trong Spring)

Để xem giới thiệu chi tiết về Spring Transaction, bạn có thể đọc bài viết [Giải thích chi tiết Spring Transaction](https://javaguide.cn/system-design/framework/spring/spring-transaction.html).

### Spring có mấy cách quản lý Transaction?

- **Quản lý Transaction bằng lập trình (Programmatic Transaction)**: Viết cứng trong code (khuyến khích dùng trong hệ thống phân tán): quản lý Transaction thủ công thông qua `TransactionTemplate` hoặc `TransactionManager`. Nếu phạm vi Transaction quá lớn sẽ xảy ra tình trạng Transaction chưa commit dẫn đến timeout, vì vậy độ mịn (granularity) của Transaction cần nhỏ hơn độ mịn của Lock.
- **Quản lý Transaction khai báo (Declarative Transaction)**: Cấu hình trong file XML hoặc dùng trực tiếp annotation (khuyến khích dùng trong ứng dụng nguyên khối Monolithic hoặc hệ thống nghiệp vụ đơn giản): thực chất được hiện thực thông qua AOP (cách dùng hoàn toàn bằng annotation dựa trên `@Transactional` được sử dụng nhiều nhất).

### Spring Transaction có những hành vi lan truyền (Transaction Propagation) nào?

**Hành vi lan truyền Transaction sinh ra nhằm giải quyết vấn đề Transaction khi các phương thức ở tầng nghiệp vụ gọi lẫn nhau**.

Khi một phương thức có Transaction được gọi bởi một phương thức có Transaction khác, cần phải chỉ định cách thức Transaction lan truyền như thế nào. Ví dụ: phương thức đó có thể tiếp tục chạy trong Transaction hiện có, hoặc mở một Transaction mới và chạy trong Transaction riêng của mình.

Các giá trị hợp lệ của hành vi lan truyền Transaction như sau:

**1. `TransactionDefinition.PROPAGATION_REQUIRED`**

Đây là hành vi lan truyền Transaction được sử dụng nhiều nhất, và `@Transactional` mà chúng ta hay dùng mặc định sử dụng chính hành vi này. Nếu hiện tại đang có Transaction thì tham gia vào Transaction đó; nếu hiện tại chưa có Transaction thì tạo một Transaction mới.

**2. `TransactionDefinition.PROPAGATION_REQUIRES_NEW`**

Tạo một Transaction mới; nếu hiện tại đang có Transaction thì tạm treo (suspend) Transaction hiện tại. Nói cách khác, bất kể phương thức bên ngoài có mở Transaction hay không, phương thức bên trong được gắn `Propagation.REQUIRES_NEW` sẽ mở một Transaction mới của riêng nó, và hai Transaction này độc lập với nhau, không ảnh hưởng lẫn nhau.

**3. `TransactionDefinition.PROPAGATION_NESTED`**

Nếu hiện tại đang có Transaction thì tạo một Transaction chạy như Transaction lồng nhau (nested transaction) của Transaction hiện tại; nếu hiện tại chưa có Transaction thì giá trị này tương đương với `TransactionDefinition.PROPAGATION_REQUIRED`.

**4. `TransactionDefinition.PROPAGATION_MANDATORY`**

Nếu hiện tại đang có Transaction thì tham gia vào Transaction đó; nếu hiện tại chưa có Transaction thì ném ra ngoại lệ (mandatory: bắt buộc).

Loại này rất ít khi được sử dụng.

Ngoài ra, 3 hành vi lan truyền Transaction còn lại cũng là các cấu hình hợp lệ, cần hiểu dựa trên việc có tồn tại Transaction bên ngoài hay không:

- **`TransactionDefinition.PROPAGATION_SUPPORTS`**: Nếu hiện tại đang có Transaction thì tham gia vào Transaction đó; nếu hiện tại chưa có Transaction thì tiếp tục chạy theo cách không có Transaction.
- **`TransactionDefinition.PROPAGATION_NOT_SUPPORTED`**: Chạy theo cách không có Transaction; nếu hiện tại đang có Transaction thì tạm treo Transaction đó.
- **`TransactionDefinition.PROPAGATION_NEVER`**: Chạy theo cách không có Transaction; nếu hiện tại đang có Transaction thì ném ra ngoại lệ.

### Spring Transaction có những mức độ cô lập (Isolation Level) nào?

Tương tự phần hành vi lan truyền Transaction, để tiện sử dụng, Spring cũng định nghĩa một enum tương ứng là: `Isolation`.

```java
public enum Isolation {

    DEFAULT(TransactionDefinition.ISOLATION_DEFAULT),
    READ_UNCOMMITTED(TransactionDefinition.ISOLATION_READ_UNCOMMITTED),
    READ_COMMITTED(TransactionDefinition.ISOLATION_READ_COMMITTED),
    REPEATABLE_READ(TransactionDefinition.ISOLATION_REPEATABLE_READ),
    SERIALIZABLE(TransactionDefinition.ISOLATION_SERIALIZABLE);

    private final int value;

    Isolation(int value) {
        this.value = value;
    }

    public int value() {
        return this.value;
    }

}
```

Dưới đây lần lượt giới thiệu từng mức độ cô lập Transaction:

- **`TransactionDefinition.ISOLATION_DEFAULT`**: Sử dụng mức độ cô lập mặc định của cơ sở dữ liệu phía dưới; MySQL mặc định áp dụng mức cô lập `REPEATABLE_READ`, còn Oracle mặc định áp dụng mức cô lập `READ_COMMITTED`.
- **`TransactionDefinition.ISOLATION_READ_UNCOMMITTED`**: Mức độ cô lập thấp nhất, rất ít được sử dụng vì nó cho phép đọc các thay đổi dữ liệu chưa được commit, **có thể dẫn đến đọc bẩn (`Dirty Read`), đọc bóng ma (`Phantom Read`) hoặc đọc không lặp lại (`Non-repeatable Read`)**.
- **`TransactionDefinition.ISOLATION_READ_COMMITTED`**: Cho phép đọc dữ liệu đã được commit bởi các Transaction đồng thời; **có thể ngăn chặn `Dirty Read`, nhưng `Phantom Read` hoặc `Non-repeatable Read` vẫn có khả năng xảy ra**.
- **`TransactionDefinition.ISOLATION_REPEATABLE_READ`**: Kết quả của nhiều lần đọc cùng một trường dữ liệu luôn nhất quán, trừ khi dữ liệu bị chính Transaction đó tự sửa đổi; **có thể ngăn chặn `Dirty Read` và `Non-repeatable Read`, nhưng `Phantom Read` vẫn có thể xảy ra.**
- **`TransactionDefinition.ISOLATION_SERIALIZABLE`**: Mức độ cô lập cao nhất, tuân thủ hoàn toàn ACID. Tất cả các Transaction được thực thi tuần tự từng cái một, nên hoàn toàn không thể gây nhiễu lẫn nhau; nói cách khác, **mức độ này có thể ngăn chặn cả `Dirty Read`, `Non-repeatable Read` lẫn `Phantom Read`**. Tuy nhiên điều này sẽ ảnh hưởng nghiêm trọng đến hiệu năng của chương trình, nên thông thường cũng không dùng đến mức này.

### Bạn có hiểu về annotation `@Transactional(rollbackFor = Exception.class)` không?

`Exception` được chia thành ngoại lệ runtime (`RuntimeException`) và ngoại lệ không phải runtime (`Checked Exception`). Quản lý Transaction cực kỳ quan trọng đối với ứng dụng doanh nghiệp—ngay cả khi xảy ra ngoại lệ, nó vẫn đảm bảo được tính nhất quán của dữ liệu.

Khi annotation `@Transactional` được đặt trên cấp độ lớp, tất cả các phương thức `public` của lớp đó đều sẽ có các thuộc tính Transaction tương ứng; đồng thời, chúng ta cũng có thể đặt annotation này ở cấp độ phương thức để ghi đè định nghĩa ở cấp độ lớp.

Chiến lược rollback mặc định của annotation `@Transactional` là chỉ rollback Transaction khi gặp `RuntimeException` (ngoại lệ runtime) hoặc `Error`, chứ không rollback đối với `Checked Exception` (ngoại lệ được kiểm tra). Lý do là Spring coi `RuntimeException` và `Error` là những lỗi không thể lường trước, còn `Checked Exception` là lỗi có thể dự đoán trước và có thể xử lý thông qua logic nghiệp vụ.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/spring-transactional-rollbackfor-78674728.png)

Nếu muốn thay đổi chiến lược rollback mặc định, có thể sử dụng thuộc tính `rollbackFor` và `noRollbackFor` của `@Transactional` để chỉ định ngoại lệ nào cần rollback và ngoại lệ nào không cần rollback. Ví dụ, nếu muốn mọi ngoại lệ đều rollback Transaction thì có thể dùng annotation như sau:

```java
@Transactional(rollbackFor = Exception.class)
public void someMethod() {
// some business logic
}
```

Nếu muốn một số ngoại lệ cụ thể không rollback Transaction thì có thể dùng annotation như sau:

```java
@Transactional(noRollbackFor = CustomException.class)
public void someMethod() {
// some business logic
}
```

## Spring Data JPA

Với JPA, điều quan trọng là thực hành thực tế; ở đây chỉ tổng kết một phần nhỏ các kiến thức.

### Làm thế nào để một trường không bị lưu trữ xuống cơ sở dữ liệu trong JPA?

Giả sử chúng ta có một lớp như sau:

```java
@Entity(name="USER")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "ID")
    private Long id;

    @Column(name="USER_NAME")
    private String userName;

    @Column(name="PASSWORD")
    private String password;

    private String secrect;

}
```

Nếu muốn trường `secrect` không được lưu xuống cơ sở dữ liệu (tức là không bị persist), chúng ta có thể áp dụng một số cách sau:

```java
static String transient1; // not persistent because of static
final String transient2 = "Satish"; // not persistent because of final
transient String transient3; // not persistent because of transient
@Transient
String transient4; // not persistent because of @Transient
```

Thông thường hai cách sau được dùng nhiều hơn, bản thân mình hay dùng cách gắn annotation hơn.

### Tính năng Auditing của JPA dùng để làm gì và có tác dụng gì?

Tính năng Auditing chủ yếu giúp chúng ta ghi lại các hành vi cụ thể của thao tác cơ sở dữ liệu, ví dụ một bản ghi nào đó được tạo bởi ai, vào thời điểm nào, người sửa đổi cuối cùng là ai và thời điểm sửa đổi cuối cùng là khi nào.

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
@MappedSuperclass
@EntityListeners(value = AuditingEntityListener.class)
public abstract class AbstractAuditBase {

    @CreatedDate
    @Column(updatable = false)
    @JsonIgnore
    private Instant createdAt;

    @LastModifiedDate
    @JsonIgnore
    private Instant updatedAt;

    @CreatedBy
    @Column(updatable = false)
    @JsonIgnore
    private String createdBy;

    @LastModifiedBy
    @JsonIgnore
    private String updatedBy;
}
```

- `@CreatedDate`: Đánh dấu trường này là trường thời gian tạo; khi entity này được insert, giá trị sẽ tự động được thiết lập.

- `@CreatedBy`: Đánh dấu trường này là người tạo; khi entity này được insert, giá trị sẽ tự động được thiết lập.

  `@LastModifiedDate` và `@LastModifiedBy` hoạt động tương tự.

### Có những annotation nào thể hiện mối quan hệ giữa các Entity?

- `@OneToOne`: Một - Một (One-to-One).
- `@ManyToMany`: Nhiều - Nhiều (Many-to-Many).
- `@OneToMany`: Một - Nhiều (One-to-Many).
- `@ManyToOne`: Nhiều - Một (Many-to-One).

Ngoài ra, kết hợp `@ManyToOne` và `@OneToMany` cũng có thể biểu diễn mối quan hệ nhiều - nhiều.

## Spring Security

Với Spring Security, điều quan trọng là thực hành thực tế; ở đây chỉ tổng kết một phần nhỏ các kiến thức.

### Có những phương thức nào dùng để kiểm soát quyền truy cập request?

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/image-20220728201854641-efc4be3a.png)

- `permitAll()`: Cho phép mọi hình thức truy cập vô điều kiện, bất kể bạn đã đăng nhập hay chưa.
- `anonymous()`: Cho phép truy cập ẩn danh, tức là chỉ khi chưa đăng nhập mới có thể truy cập.
- `denyAll()`: Từ chối mọi hình thức truy cập một cách vô điều kiện.
- `authenticated()`: Chỉ cho phép người dùng đã xác thực truy cập.
- `fullyAuthenticated()`: Chỉ cho phép người dùng đã xác thực đầy đủ truy cập, không chấp nhận xác thực ẩn danh hoặc remember-me.
- `hasRole(String)`: Chỉ cho phép người dùng có vai trò (role) được chỉ định truy cập.
- `hasAnyRole(String)`: Chỉ định một hoặc nhiều vai trò; người dùng thỏa mãn một trong số đó có thể truy cập.
- `hasAuthority(String)`: Chỉ cho phép người dùng có quyền hạn (authority) được chỉ định truy cập.
- `hasAnyAuthority(String)`: Chỉ định một hoặc nhiều quyền hạn; người dùng thỏa mãn một trong số đó có thể truy cập.
- `hasIpAddress(String)`: Chỉ cho phép người dùng từ địa chỉ IP được chỉ định truy cập.

### `hasRole` và `hasAuthority` có điểm gì khác nhau không?

Bạn có thể xem bài viết này của Song Ge: [hasRole và hasAuthority trong Spring Security có khác nhau không?](https://mp.weixin.qq.com/s/GTNOa2k9_n_H0w24upClRw), trong đó giải thích khá chi tiết.

### ⭐️Mã hóa mật khẩu như thế nào?

Khi cần lưu trữ dữ liệu nhạy cảm như mật khẩu vào cơ sở dữ liệu, chúng ta cần mã hóa bằng hàm băm một chiều thích ứng (adaptive one-way hash function) trước khi lưu, chứ không dùng mã hóa thuận nghịch (reversible encryption).

Spring Security cung cấp nhiều hiện thực thuật toán mã hóa mật khẩu dùng được ngay (out-of-the-box). Interface của các lớp hiện thực này là `PasswordEncoder`; nếu cần tự định nghĩa cơ chế mã hóa mật khẩu, bạn cũng cần hiện thực interface `PasswordEncoder`.

Interface `PasswordEncoder` có hai phương thức trừu tượng bắt buộc hiện thực là `encode()` và `matches()`, cùng một phương thức mặc định `upgradeEncoding()` có thể ghi đè tùy theo nhu cầu.

```java
public interface PasswordEncoder {
    // Mã hóa một chiều đối với mật khẩu gốc
    String encode(CharSequence var1);
    // Đối chiếu mật khẩu gốc với mật khẩu đã lưu trong cơ sở dữ liệu
    boolean matches(CharSequence var1, String var2);
    // Kiểm tra xem mật khẩu đã mã hóa có cần nâng cấp mã hóa hay không, mặc định trả về false
    default boolean upgradeEncoding(String encodedPassword) {
        return false;
    }
}
```

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/image-20220728183540954-b4a81c28.png)

Tài liệu chính thức khuyến nghị sử dụng hàm một chiều thích ứng có thể điều chỉnh hệ số công việc (work factor) và tinh chỉnh thời gian xác thực dựa theo hiệu năng hệ thống, ví dụ như bcrypt, PBKDF2, scrypt hoặc Argon2.

### Làm thế nào để thay đổi thuật toán mã hóa của hệ thống một cách thanh lịch (graceful)?

Nếu trong quá trình phát triển, đột nhiên phát hiện thuật toán mã hóa hiện tại không còn đáp ứng được nhu cầu và cần đổi sang một thuật toán mã hóa khác, lúc này phải làm sao?

Cách làm được khuyến nghị là sử dụng `DelegatingPasswordEncoder` để tương thích với nhiều cơ chế mã hóa mật khẩu khác nhau nhằm đáp ứng các yêu cầu nghiệp vụ khác nhau.

Ngay từ tên gọi cũng có thể nhận ra, `DelegatingPasswordEncoder` thực chất là một lớp ủy quyền (proxy), chứ không phải một thuật toán mã hóa hoàn toàn mới; việc nó làm là ủy quyền cho các lớp hiện thực thuật toán mã hóa đã nêu ở trên. Từ Spring Security 5.0 trở đi, mặc định việc mã hóa mật khẩu đã dựa trên `DelegatingPasswordEncoder`.

## Tài liệu tham khảo

- *Spring Internals* (Kỹ thuật bên trong Spring)
- *Tìm hiểu sâu về Spring từ con số 0*: <https://juejin.cn/book/6857911863016390663>
- <http://www.cnblogs.com/wmyskxz/p/8820371.html>
- <https://www.journaldev.com/2696/spring-interview-questions-and-answers>
- <https://www.edureka.co/blog/interview-questions/spring-interview-questions/>
- <https://www.cnblogs.com/clwydjgs/p/9317849.html>
- <https://howtodoinjava.com/interview-questions/top-spring-interview-questions-with-answers/>
- <http://www.tomaszezula.com/2014/02/09/spring-series-part-5-component-vs-bean/>
- <https://stackoverflow.com/questions/34172888/difference-between-bean-and-autowired>
