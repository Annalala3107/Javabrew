---
title: Giải thích chi tiết IoC & AOP (Hiểu nhanh bản chất)
description: "Giải thích chi tiết nguyên lý cốt lõi của Spring IoC và AOP, đi sâu vào Inversion of Control, Dependency Injection, lập trình hướng khía cạnh (AOP) và cơ chế Dynamic Proxy."
category: Framework
tag:
  - Spring
head:
  - - meta
    - name: keywords
      content: "IoC,DI,AOP,Spring IoC Container,Dependency Injection,Lập trình hướng khía cạnh,Dynamic Proxy,Nguyên lý Spring"
lang: vi
sourceRef: zh-ref/system-design/framework/spring/ioc-and-aop.md
---

Bài viết này sẽ giải thích về IoC & AOP xoay quanh các câu hỏi sau:

- IoC là gì?
- IoC giải quyết vấn đề gì?
- Sự khác biệt giữa IoC và DI là gì?
- AOP là gì?
- AOP giải quyết vấn đề gì?
- Các kịch bản ứng dụng của AOP là gì?
- Vì sao AOP lại được gọi là lập trình hướng khía cạnh?
- Có những cách nào để triển khai AOP?

Trước hết xin khẳng định: IoC & AOP không phải do Spring nghĩ ra, chúng thực tế đã tồn tại trước khi có Spring, chỉ là khi đó thiên về lý thuyết hơn. Spring đã hiện thực hóa hai tư tưởng này rất tốt ở tầng kỹ thuật.

## IoC (Inversion of Control)

### IoC là gì?

IoC (Inversion of Control) tức là Đảo ngược quyền kiểm soát. Đây là một tư tưởng thiết kế chứ không phải một kỹ thuật cài đặt cụ thể, dùng để mô tả bài toán khởi tạo và quản lý đối tượng trong lĩnh vực lập trình Java.

Ví dụ: hiện có lớp A phụ thuộc vào lớp B:

- **Cách lập trình truyền thống**: Thường là tự tay dùng từ khóa `new` ngay trong lớp A để khởi tạo một đối tượng của lớp B.
- **Cách lập trình theo tư tưởng IoC**: Không dùng từ khóa `new` để tạo đối tượng nữa, mà để IoC Container (framework Spring) giúp chúng ta khởi tạo đối tượng. Khi cần đối tượng nào, chỉ việc lấy trực tiếp từ trong IoC Container ra dùng.

Nhìn từ phép so sánh hai cách làm trên: chúng ta "mất đi một quyền" (quyền khởi tạo và quản lý đối tượng), đổi lại nhận được một lợi ích (không cần bận tâm tới hàng loạt công việc tạo lập và quản lý đối tượng nữa).

**Vì sao lại gọi là Đảo ngược quyền kiểm soát?**

- **Kiểm soát (Control)**: Chỉ quyền tạo lập (khởi tạo thực thể và quản lý) đối tượng.
- **Đảo ngược (Inversion)**: Quyền kiểm soát được trao cho môi trường bên ngoài (IoC Container).

![Minh họa IoC](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-00567db2.png)

### IoC giải quyết vấn đề gì?

Tư tưởng của IoC là hai bên không phụ thuộc trực tiếp vào việc khởi tạo lẫn nhau, mà giao cho một Container bên thứ ba quản lý các tài nguyên liên quan. Cách làm này mang lại lợi ích gì?

1. Giảm mức độ ghép nối (coupling), hay nói cách khác là giảm sự phụ thuộc giữa các đối tượng;
2. Tài nguyên trở nên dễ quản lý; ví dụ khi dùng Spring Container, bạn có thể tạo một Singleton rất dễ dàng.

Ví dụ: hiện có một nghiệp vụ thao tác với `User`, phát triển theo cấu trúc hai tầng Service và DAO.

Trong trường hợp chưa dùng tư tưởng IoC, nếu tầng Service muốn dùng bản cài đặt cụ thể của tầng DAO, ta phải tự dùng từ khóa `new` trong `UserServiceImpl` để tạo đối tượng của lớp cài đặt cụ thể `UserDaoImpl` cho interface `IUserDao` (vì không thể `new` trực tiếp một interface).

Nghe rất ổn, cách này vẫn chạy bình thường, nhưng hãy thử tưởng tượng kịch bản sau:

Giữa chừng quá trình phát triển bỗng có yêu cầu mới: viết một lớp cài đặt cụ thể khác cho interface `IUserDao`. Vì tầng Service đang phụ thuộc vào bản cài đặt cụ thể của `IUserDao`, ta buộc phải sửa lại chỗ `new` đối tượng trong `UserServiceImpl`. Nếu chỉ có một lớp tham chiếu tới bản cài đặt cụ thể của `IUserDao` thì việc sửa có vẻ không quá vất vả; nhưng nếu có rất nhiều nơi cùng tham chiếu trực tiếp tới nó, một khi cần thay đổi cách cài đặt của `IUserDao` thì việc sửa đổi sẽ vô cùng đau đầu.

![Minh họa IoC & AOP giữa tầng DAO và Service](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-dao-service-d83e5d28.png)

Áp dụng tư tưởng IoC, ta giao quyền kiểm soát đối tượng (khởi tạo, quản lý) cho IoC Container đảm nhận; khi cần dùng chỉ việc "xin" trực tiếp từ IoC Container là xong.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/IoC-Aop-ioc-illustration-dao-5c2d69f4.png)

### IoC và DI có khác nhau không?

IoC (Inversion of Control: Đảo ngược quyền kiểm soát) là một tư tưởng thiết kế hay một mô hình thiết kế. Tư tưởng này chính là **giao quyền kiểm soát việc tự khởi tạo đối tượng trong chương trình cho bên thứ ba, chẳng hạn như IoC Container.** Đối với framework Spring mà ta hay dùng, IoC Container thực chất là một `Map` (key, value), bên trong `Map` chứa các đối tượng khác nhau. Tuy nhiên, IoC cũng được áp dụng trong các ngôn ngữ khác chứ không phải đặc sản riêng của Spring.

Cách cài đặt phổ biến và hợp lý nhất của IoC được gọi là Dependency Injection (viết tắt là DI — Tiêm phụ thuộc).

Martin Fowler từng viết một bài báo đề xuất đổi tên IoC thành DI; nguyên văn như bên dưới, đường dẫn bài gốc: <https://martinfowler.com/articles/injection.html>.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/martin-fowler-injection-b5c323e6.png)

Ý chính của Martin Fowler là thuật ngữ IoC quá chung chung và không diễn đạt rõ ý nghĩa, khiến nhiều người dễ bối rối, nên dùng DI để gọi tên chính xác mẫu thiết kế này sẽ hay hơn.

## AOP (Aspect-Oriented Programming)

Phần này sẽ không đi quá sâu vào các thuật ngữ hàn lâm nặng nề; mục đích cốt lõi là nói rõ ràng tư tưởng của AOP.

### AOP là gì?

AOP (Aspect-Oriented Programming) tức là Lập trình hướng khía cạnh. AOP là sự tiếp nối của OOP (Lập trình hướng đối tượng), hai phương pháp này bổ trợ cho nhau chứ không đối lập.

Mục đích của AOP là tách các mối quan tâm cắt ngang (cross-cutting concerns — như ghi log, quản lý Transaction, kiểm soát phân quyền, giới hạn tốc độ API, đảm bảo tính lũy đẳng cho API,...) ra khỏi logic nghiệp vụ cốt lõi, thông qua các kỹ thuật như Dynamic Proxy hay thao tác bytecode để đạt được tái sử dụng code và tách rời sự phụ thuộc (decoupling), nâng cao khả năng bảo trì và mở rộng của mã nguồn. Còn mục đích của OOP là đóng gói logic nghiệp vụ theo thuộc tính và hành vi của đối tượng thông qua lớp, đối tượng, kế thừa, đa hình,... giúp module hóa và phân tầng mã nguồn (cũng tái sử dụng được code), nâng cao khả năng đọc hiểu và bảo trì.

### Vì sao AOP lại gọi là lập trình hướng khía cạnh?

Sở dĩ AOP được gọi là lập trình hướng khía cạnh vì tư tưởng cốt lõi của nó là tách các mối quan tâm cắt ngang ra khỏi logic nghiệp vụ cốt lõi để tạo thành từng **Aspect (khía cạnh)** riêng biệt.

![Minh họa lập trình hướng khía cạnh](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/aop-program-execution-d5c9954f.jpg)

Tiện đây tổng kết nhanh các thuật ngữ then chốt của AOP (chưa hiểu ngay cũng không sao, bạn cứ đọc tiếp xuống dưới):

- **Cross-cutting concerns (Mối quan tâm cắt ngang)**: Hành vi dùng chung ở nhiều lớp hoặc nhiều đối tượng (như ghi log, quản lý Transaction, kiểm soát phân quyền, giới hạn tốc độ API, tính lũy đẳng cho API,...).
- **Aspect (Khía cạnh)**: Lớp đóng gói các mối quan tâm cắt ngang; một Aspect là một lớp. Một Aspect có thể định nghĩa nhiều Advice để cài đặt các chức năng cụ thể.
- **JoinPoint (Điểm kết nối)**: Một thời điểm cụ thể trong quá trình gọi hoặc thực thi phương thức (như lúc gọi phương thức, lúc ném ngoại lệ,...).
- **Advice (Thông báo/Hành động chèn)**: Thao tác mà Aspect sẽ thực thi tại một JoinPoint cụ thể. Có 5 loại Advice gồm: `Before`, `After`, `AfterReturning`, `AfterThrowing` và `Around`. Bốn loại đầu chạy trước hoặc sau phương thức mục tiêu, còn `Around` có thể kiểm soát toàn bộ quá trình thực thi của phương thức mục tiêu.
- **Pointcut (Điểm cắt)**: Một biểu thức dùng để khớp xem những JoinPoint nào cần được Aspect tăng cường (enhance). Pointcut có thể định nghĩa bằng annotation, biểu thức mẫu, phép toán logic,... Ví dụ `execution(* com.xyz.service..*(..))` khớp với các lớp hoặc interface trong package `com.xyz.service` và các package con của nó.
- **Weaving (Đan/Gắn kết)**: Quá trình kết nối Aspect với đối tượng mục tiêu, tức là áp dụng Advice lên các JoinPoint khớp với Pointcut. Có hai thời điểm weaving phổ biến là weaving lúc biên dịch (Compile-Time Weaving, ví dụ AspectJ) và weaving lúc chạy (Runtime Weaving, ví dụ AspectJ, Spring AOP).

### Các loại Advice phổ biến trong AOP là gì?

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/aspectj-advice-types-ace45b9f.jpg)

- **Before**: Kích hoạt trước khi gọi phương thức của đối tượng mục tiêu.
- **After**: Kích hoạt sau khi gọi phương thức của đối tượng mục tiêu.
- **AfterReturning**: Kích hoạt sau khi phương thức của đối tượng mục tiêu gọi xong và trả về giá trị kết quả.
- **AfterThrowing**: Kích hoạt sau khi phương thức của đối tượng mục tiêu ném ra / phát sinh ngoại lệ trong lúc chạy. `AfterReturning` và `AfterThrowing` loại trừ lẫn nhau: nếu phương thức chạy thành công không có ngoại lệ thì có giá trị trả về; nếu ném ngoại lệ thì không có giá trị trả về.
- **Around**: Điều khiển bằng code quá trình gọi phương thức của đối tượng mục tiêu. `Around` là loại Advice có phạm vi can thiệp lớn nhất trong tất cả các loại Advice, vì nó lấy được trực tiếp cả đối tượng mục tiêu lẫn phương thức sắp thực thi, nên có thể tùy ý chèn xử lý trước và sau lời gọi phương thức mục tiêu, thậm chí không gọi phương thức mục tiêu luôn cũng được.

### AOP giải quyết vấn đề gì?

OOP không xử lý tốt được những hành vi dùng chung nằm rải rác ở nhiều lớp hoặc đối tượng (như ghi log, quản lý Transaction, kiểm soát phân quyền, giới hạn tốc độ API, tính lũy đẳng cho API,...), những hành vi này thường được gọi là **cross-cutting concerns (mối quan tâm cắt ngang)**. Nếu phải cài đặt lặp đi lặp lại các hành vi này trong từng lớp hay đối tượng, mã nguồn sẽ dư thừa, rối rắm và khó bảo trì.

AOP giúp tách các mối quan tâm cắt ngang (như ghi log, quản lý Transaction, kiểm soát phân quyền, giới hạn tốc độ API, tính lũy đẳng cho API,...) ra khỏi **core concerns (logic nghiệp vụ cốt lõi)**, hiện thực hóa nguyên tắc tách biệt mối quan tâm (separation of concerns).

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/crosscut-logic-and-businesslogic-separation--9d4036a7.png)

Lấy việc ghi log làm ví dụ. Giả sử ta cần ghi log theo một định dạng thống nhất cho một số phương thức; khi chưa dùng kỹ thuật AOP, ta phải viết code ghi log ở từng phương thức một, toàn bộ đều là logic lặp lại:

```java
public CommonResponse<Object> method1() {
      // Logic nghiệp vụ
      xxService.method1();
      // Lược bỏ logic xử lý nghiệp vụ cụ thể
      // Ghi log
      ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
      HttpServletRequest request = attributes.getRequest();
      // Lược bỏ logic ghi log cụ thể, ví dụ: lấy các thông tin, ghi vào database,...
      return CommonResponse.success();
}

public CommonResponse<Object> method2() {
      // Logic nghiệp vụ
      xxService.method2();
      // Lược bỏ logic xử lý nghiệp vụ cụ thể
      // Ghi log
      ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
      HttpServletRequest request = attributes.getRequest();
      // Lược bỏ logic ghi log cụ thể, ví dụ: lấy các thông tin, ghi vào database,...
      return CommonResponse.success();
}

// ...
```

Sau khi dùng kỹ thuật AOP, ta có thể đóng gói logic ghi log thành một Aspect, rồi thông qua Pointcut và Advice để chỉ định phương thức nào cần thực thi thao tác ghi log:

```java

// Annotation ghi log
@Target({ElementType.PARAMETER,ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Log {

    /**
     * Mô tả
     */
    String description() default "";

    /**
     * Loại phương thức: INSERT, DELETE, UPDATE, OTHER
     */
    MethodType methodType() default MethodType.OTHER;
}

// Aspect ghi log
@Component
@Aspect
public class LogAspect {
  // Pointcut: tất cả các phương thức được gắn annotation Log
  @Pointcut("@annotation(cn.javaguide.annotation.Log)")
  public void webLog() {
  }

   /**
   * Around Advice
   */
  @Around("webLog()")
  public Object doAround(ProceedingJoinPoint joinPoint) throws Throwable {
    // Lược bỏ logic xử lý cụ thể
  }

  // Lược bỏ các đoạn code khác
}
```

Khi đó, ta chỉ cần một dòng annotation là thực hiện được việc ghi log:

```java
@Log(description = "method1",methodType = MethodType.INSERT)
public CommonResponse<Object> method1() {
      // Logic nghiệp vụ
      xxService.method1();
      // Lược bỏ logic xử lý nghiệp vụ cụ thể
      return CommonResponse.success();
}
```

### Các kịch bản ứng dụng của AOP là gì?

- **Ghi log**: Tự định nghĩa annotation ghi log, tận dụng AOP để ghi log chỉ với một dòng code.
- **Thống kê hiệu năng**: Dùng AOP đo thời gian thực thi trước và sau khi phương thức mục tiêu chạy, thuận tiện cho việc tối ưu và phân tích.
- **Quản lý Transaction**: Annotation `@Transactional` giúp Spring tự động quản lý Transaction như rollback khi gặp ngoại lệ, loại bỏ các đoạn code quản lý Transaction lặp lại. `@Transactional` được xây dựng dựa trên AOP.
- **Kiểm soát phân quyền**: Dùng AOP kiểm tra trước khi chạy phương thức mục tiêu xem người dùng có đủ quyền cần thiết hay không; nếu có thì cho chạy tiếp, ngược lại thì chặn. Ví dụ Spring Security dùng annotation `@PreAuthorize` để kiểm tra quyền tùy biến chỉ với một dòng code.
- **Giới hạn tốc độ API (Rate Limiting)**: Dùng AOP áp dụng thuật toán và cài đặt giới hạn tốc độ lên request trước khi phương thức mục tiêu thực thi.
- **Quản lý Cache**: Dùng AOP đọc và cập nhật cache trước và sau khi phương thức mục tiêu chạy.
- ...

### Có những cách nào để triển khai AOP?

Các cách triển khai AOP phổ biến gồm Dynamic Proxy, thao tác bytecode,...

Spring AOP hoạt động dựa trên Dynamic Proxy. Nếu đối tượng cần tạo proxy có cài đặt một interface nào đó, Spring AOP sẽ dùng **JDK Proxy** để tạo đối tượng proxy; còn với đối tượng không cài đặt interface, không thể dùng JDK Proxy được thì Spring AOP sẽ dùng **CGLIB** để sinh ra một lớp con của đối tượng mục tiêu làm proxy, như hình dưới đây:

![SpringAOPProcess](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/230ae587a322d6e4d09510161987d346-1e9492d2.jpg)

**Chiến lược Dynamic Proxy của Spring Boot và Spring có giống hệt nhau không?** Thực tế là không giống, và rất nhiều người hiểu nhầm chỗ này.

Trước Spring Boot 2.0, `spring.aop.proxy-target-class` có giá trị mặc định là `false`: khi lớp mục tiêu có interface người dùng thì thường dùng **JDK Dynamic Proxy**; nếu lớp mục tiêu không có interface khả dụng, Spring AOP vẫn lùi về dùng **CGLIB Dynamic Proxy** chứ không chỉ vì lớp mục tiêu không implement interface mà ném ngoại lệ. Code Auto-Configuration cho AOP của Spring Boot 1.5.x như sau:

```java
@Configuration
@ConditionalOnClass({ EnableAspectJAutoProxy.class, Aspect.class, Advice.class })
@ConditionalOnProperty(prefix = "spring.aop", name = "auto", havingValue = "true", matchIfMissing = true)
public class AopAutoConfiguration {

	@Configuration
	@EnableAspectJAutoProxy(proxyTargetClass = false)
 // Lớp cấu hình này chỉ có hiệu lực khi spring.aop.proxy-target-class=false hoặc không cấu hình tường minh.
 // Tức là nếu lập trình viên không chọn rõ cơ chế proxy, Spring mặc định sẽ nạp JDK Dynamic Proxy.
	@ConditionalOnProperty(prefix = "spring.aop", name = "proxy-target-class", havingValue = "false", matchIfMissing = true)
	public static class JdkDynamicAutoProxyConfiguration {

	}

	@Configuration
	@EnableAspectJAutoProxy(proxyTargetClass = true)
 // Lớp cấu hình này chỉ có hiệu lực khi spring.aop.proxy-target-class=true.
 // Nghĩa là khi lập trình viên cấu hình rõ thuộc tính để chỉ định dùng CGLIB Dynamic Proxy, Spring sẽ nạp lớp cấu hình này.
	@ConditionalOnProperty(prefix = "spring.aop", name = "proxy-target-class", havingValue = "true", matchIfMissing = false)
	public static class CglibAutoProxyConfiguration {

	}

}
```

Từ Spring Boot 2.0 trở đi, nếu người dùng không cấu hình gì cả thì mặc định dùng **CGLIB Dynamic Proxy**. Nếu cần ép buộc dùng JDK Dynamic Proxy, có thể thêm vào file cấu hình: `spring.aop.proxy-target-class=false`. Code Auto-Configuration cho AOP của Spring Boot 2.0 như sau:

```java
@Configuration
@ConditionalOnClass({ EnableAspectJAutoProxy.class, Aspect.class, Advice.class,
		AnnotatedElement.class })
@ConditionalOnProperty(prefix = "spring.aop", name = "auto", havingValue = "true", matchIfMissing = true)
public class AopAutoConfiguration {

	@Configuration
	@EnableAspectJAutoProxy(proxyTargetClass = false)
 // Lớp cấu hình này chỉ có hiệu lực khi spring.aop.proxy-target-class=false.
 // Nghĩa là khi lập trình viên cấu hình rõ thuộc tính để chỉ định dùng JDK Dynamic Proxy, Spring sẽ nạp lớp cấu hình này.
	@ConditionalOnProperty(prefix = "spring.aop", name = "proxy-target-class", havingValue = "false", matchIfMissing = false)
	public static class JdkDynamicAutoProxyConfiguration {

	}

	@Configuration
	@EnableAspectJAutoProxy(proxyTargetClass = true)
 // Lớp cấu hình này có hiệu lực khi spring.aop.proxy-target-class=true hoặc không cấu hình tường minh.
 // Tức là nếu lập trình viên không chọn rõ cơ chế proxy, Spring mặc định sẽ nạp CGLIB Proxy.
	@ConditionalOnProperty(prefix = "spring.aop", name = "proxy-target-class", havingValue = "true", matchIfMissing = true)
	public static class CglibAutoProxyConfiguration {

	}

}
```

Tất nhiên bạn cũng có thể dùng **AspectJ**! Spring AOP đã tích hợp sẵn AspectJ — framework AOP có thể coi là hoàn chỉnh nhất trong hệ sinh thái Java.

**Spring AOP thuộc dạng tăng cường lúc chạy (runtime enhancement), còn AspectJ hỗ trợ weaving lúc biên dịch (compile-time), sau biên dịch (post-compile) và lúc nạp lớp (load-time).** Spring AOP dựa trên cơ chế tạo proxy (Proxying), còn AspectJ dựa trên thao tác bytecode (Bytecode Manipulation).

Spring AOP đã tích hợp sẵn AspectJ — framework AOP có thể coi là hoàn chỉnh nhất trong hệ sinh thái Java. So với Spring AOP thì AspectJ mạnh mẽ hơn, nhưng đổi lại Spring AOP đơn giản hơn khi sử dụng.

Nếu số lượng Aspect tương đối ít thì sự chênh lệch hiệu năng giữa hai bên không lớn. Tuy nhiên, khi có quá nhiều Aspect, tốt nhất nên chọn AspectJ vì nó nhanh hơn Spring AOP rất nhiều.

## Tài liệu tham khảo

- AOP in Spring Boot, is it a JDK dynamic proxy or a Cglib dynamic proxy?: <https://www.springcloud.io/post/2022-01/springboot-aop/>
- Spring Proxying Mechanisms: <https://docs.spring.io/spring-framework/reference/core/aop/proxying.html>
