---
title: Giải thích chi tiết nguyên lý Auto-Configuration trong Spring Boot
description: "Phân tích chuyên sâu nguyên lý Auto-Configuration (tự động cấu hình) của Spring Boot, giải thích chi tiết @EnableAutoConfiguration, cơ chế nạp SpringFactories và nguyên lý hoạt động của các conditional annotation."
category: Framework
tag:
  - SpringBoot
lang: vi
sourceRef: zh-ref/system-design/framework/spring/spring-boot-auto-assembly-principles.md
head:
  - - meta
    - name: keywords
      content: Spring Boot Auto-Configuration,AutoConfiguration,EnableAutoConfiguration,SpringFactories,Conditional Annotation,Starter,Nguyên lý Spring Boot
---

> Tác giả: [Miki-byte-1024](https://github.com/Miki-byte-1024) & [Snailclimb](https://github.com/Snailclimb)

Mỗi khi nhắc đến Spring Boot, người phỏng vấn rất thích hỏi câu này: "Hãy trình bày nguyên lý tự động cấu hình (Auto-Configuration) của Spring Boot?".

Theo mình, chúng ta có thể trả lời theo các khía cạnh sau:

1. Auto-Configuration trong Spring Boot là gì?
2. Spring Boot triển khai Auto-Configuration như thế nào? Làm thế nào để nạp theo nhu cầu (on-demand)?
3. Làm thế nào để tự xây dựng một Starter?

Do giới hạn độ dài, bài viết này chưa đi sâu quá mức vào từng chi tiết, các bạn cũng có thể dùng trực tiếp debug để xem phần mã nguồn Auto-Configuration của Spring Boot.

## Lời mở đầu

Những bạn từng dùng Spring hẳn đều từng trải qua nỗi ám ảnh bị cấu hình XML "thống trị". Ngay cả khi Spring sau này giới thiệu cấu hình dựa trên annotation, mỗi khi bật một số tính năng của Spring hoặc tích hợp thư viện bên thứ ba, chúng ta vẫn phải cấu hình tường minh bằng XML hoặc Java.

Ví dụ, khi chưa có Spring Boot, để viết một dịch vụ Web RESTful, trước tiên ta vẫn phải cấu hình như sau:

```java
@Configuration
public class RESTConfiguration
{
    @Bean
    public View jsonTemplate() {
        MappingJackson2JsonView view = new MappingJackson2JsonView();
        view.setPrettyPrint(true);
        return view;
    }

    @Bean
    public ViewResolver viewResolver() {
        return new BeanNameViewResolver();
    }
}
```

`spring-servlet.xml`

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:context="http://www.springframework.org/schema/context"
    xmlns:mvc="http://www.springframework.org/schema/mvc"
    xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
    http://www.springframework.org/schema/context/ http://www.springframework.org/schema/context/spring-context.xsd
    http://www.springframework.org/schema/mvc/ http://www.springframework.org/schema/mvc/spring-mvc.xsd">

    <context:component-scan base-package="com.howtodoinjava.demo" />
    <mvc:annotation-driven />

    <!-- JSON Support -->
    <bean name="viewResolver" class="org.springframework.web.servlet.view.BeanNameViewResolver"/>
    <bean name="jsonTemplate" class="org.springframework.web.servlet.view.json.MappingJackson2JsonView"/>

</beans>
```

Nhưng với dự án Spring Boot, chúng ta chỉ cần thêm các dependency liên quan, không cần cấu hình rườm rà, chỉ việc chạy phương thức `main` bên dưới là xong:

```java
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

Hơn nữa, thông qua file cấu hình toàn cục `application.properties` hoặc `application.yml` của Spring Boot, ta có thể dễ dàng thiết lập cho dự án như đổi port, cấu hình các thuộc tính JPA, v.v.

**Tại sao dùng Spring Boot lại sướng đến vậy?** Đó là nhờ cơ chế Auto-Configuration (tự động cấu hình / tự động lắp ráp). **Có thể nói Auto-Configuration là cốt lõi của Spring Boot, vậy rốt cuộc Auto-Configuration là gì?**

## Auto-Configuration trong Spring Boot là gì?

Hiện nay khi nhắc tới Auto-Configuration, mọi người thường gắn nó với Spring Boot. Nhưng thực ra Spring Framework đã hiện thực tính năng nền tảng này từ rất sớm. Spring Boot chỉ đứng trên nền tảng đó và tối ưu thêm thông qua cơ chế SPI.

> Ở Spring Boot 2.6 trở về trước, các class Auto-Configuration chủ yếu được đăng ký thông qua `META-INF/spring.factories` trong các file jar bên ngoài. Spring Boot 2.7 giới thiệu `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`, đồng thời vẫn tương thích với cách đăng ký cũ; Spring Boot 3.0 đã gỡ bỏ hỗ trợ đăng ký class Auto-Configuration thông qua key `EnableAutoConfiguration` trong `spring.factories`, tuy nhiên các mục đích sử dụng khác của `spring.factories` không bị ảnh hưởng.

Khi không có Spring Boot, nếu cần tích hợp dependency bên thứ ba, ta phải tự cấu hình thủ công rất phiền phức. Nhưng trong Spring Boot, ta chỉ cần thêm trực tiếp một starter là đủ. Chẳng hạn nếu muốn dùng Redis trong dự án, bạn chỉ cần thêm starter tương ứng:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

Sau khi thêm starter, chúng ta chỉ cần một vài annotation và ít cấu hình đơn giản là có thể sử dụng được tính năng do thành phần bên thứ ba cung cấp.

Theo góc nhìn của mình, Auto-Configuration có thể hiểu đơn giản là: **chỉ thông qua annotation hoặc một vài cấu hình đơn giản là đã có thể hiện thực một phần chức năng nào đó nhờ sự hỗ trợ của Spring Boot.**

## Spring Boot triển khai Auto-Configuration như thế nào?

Trước tiên hãy xem annotation cốt lõi của Spring Boot là `SpringBootApplication`.

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
<1.>@SpringBootConfiguration
<2.>@ComponentScan
<3.>@EnableAutoConfiguration
public @interface SpringBootApplication {

}

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Configuration // Thực chất nó cũng là một configuration class
public @interface SpringBootConfiguration {
}
```

Có thể xem `@SpringBootApplication` gần như là tập hợp của 3 annotation `@Configuration`, `@EnableAutoConfiguration` và `@ComponentScan`. Theo tài liệu chính thức của Spring Boot, vai trò của 3 annotation này lần lượt là:

- `@EnableAutoConfiguration`: Bật cơ chế tự động cấu hình của Spring Boot.
- `@Configuration`: Cho phép đăng ký thêm Bean vào ApplicationContext hoặc import các configuration class khác.
- `@ComponentScan`: Quét các Bean được đánh dấu bằng `@Component` (`@Service`, `@Controller`), mặc định sẽ quét toàn bộ các class nằm dưới package chứa class khởi chạy chính; có thể tùy chỉnh để không quét một số Bean nhất định. Như hình bên dưới, container sẽ loại trừ `TypeExcludeFilter` và `AutoConfigurationExcludeFilter`.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/bcc73490afbe4c6ba62acde6a94ffdfd-tplv-k3u1fbpfcp-12946f5e.png)

`@EnableAutoConfiguration` là annotation quan trọng để thực hiện Auto-Configuration, hãy bắt đầu từ annotation này.

### @EnableAutoConfiguration: Annotation cốt lõi để triển khai Auto-Configuration

`EnableAutoConfiguration` chỉ là một annotation khá đơn giản; phần triển khai chức năng cốt lõi của Auto-Configuration thực tế nằm ở class `AutoConfigurationImportSelector`.

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage // Tác dụng: đăng ký tất cả component dưới package main vào container
@Import({AutoConfigurationImportSelector.class}) // Nạp các class auto-configuration xxxAutoConfiguration
public @interface EnableAutoConfiguration {
    String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";

    Class<?>[] exclude() default {};

    String[] excludeName() default {};
}
```

Bây giờ hãy tập trung phân tích xem class `AutoConfigurationImportSelector` rốt cuộc đã làm những gì?

### AutoConfigurationImportSelector: Nạp các class Auto-Configuration

Dưới đây lấy đoạn trích mã nguồn của Spring Boot 2.1.x làm ví dụ để phân tích `AutoConfigurationImportSelector`. Các đoạn code này đã lược bỏ một phần cài đặt không ảnh hưởng đến luồng chính, nên không thể biên dịch trực tiếp thành một class độc lập. Từ Spring Boot 2.7 trở lên, danh sách ứng viên class Auto-Configuration chủ yếu được đọc từ file `AutoConfiguration.imports`, nên cấu trúc mã nguồn cụ thể sẽ có khác biệt so với phiên bản cũ bên dưới.

Hệ thống kế thừa của class `AutoConfigurationImportSelector` như sau:

```java
public class AutoConfigurationImportSelector implements DeferredImportSelector, BeanClassLoaderAware, ResourceLoaderAware, BeanFactoryAware, EnvironmentAware, Ordered {

}

public interface DeferredImportSelector extends ImportSelector {

}

public interface ImportSelector {
    String[] selectImports(AnnotationMetadata var1);
}
```

Có thể thấy class `AutoConfigurationImportSelector` triển khai interface `ImportSelector`, tức là triển khai phương thức `selectImports` trong interface này; phương thức này chủ yếu dùng để **lấy tên đầy đủ (fully qualified class name) của tất cả các class thỏa mãn điều kiện cần được nạp vào IoC container**.

```java
private static final String[] NO_IMPORTS = new String[0];

public String[] selectImports(AnnotationMetadata annotationMetadata) {
        // <1>. Kiểm tra công tắc auto-configuration có đang bật hay không
        if (!this.isEnabled(annotationMetadata)) {
            return NO_IMPORTS;
        } else {
          // <2>. Lấy tất cả các bean cần auto-configure
            AutoConfigurationMetadata autoConfigurationMetadata = AutoConfigurationMetadataLoader.loadMetadata(this.beanClassLoader);
            AutoConfigurationImportSelector.AutoConfigurationEntry autoConfigurationEntry = this.getAutoConfigurationEntry(autoConfigurationMetadata, annotationMetadata);
            return StringUtils.toStringArray(autoConfigurationEntry.getConfigurations());
        }
    }
```

Ở đây chúng ta cần đặc biệt chú ý đến phương thức `getAutoConfigurationEntry()`, phương thức này chịu trách nhiệm chính cho việc nạp các class Auto-Configuration.

Chuỗi lời gọi (call chain) của phương thức này như sau:

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/3c1200712655443ca4b38500d615bb70-tplv-k3u1fbpfcp-664260af.png)

Bây giờ hãy kết hợp với mã nguồn của `getAutoConfigurationEntry()` để phân tích chi tiết:

```java
private static final AutoConfigurationEntry EMPTY_ENTRY = new AutoConfigurationEntry();

AutoConfigurationEntry getAutoConfigurationEntry(AutoConfigurationMetadata autoConfigurationMetadata, AnnotationMetadata annotationMetadata) {
        // <1>.
        if (!this.isEnabled(annotationMetadata)) {
            return EMPTY_ENTRY;
        } else {
            // <2>.
            AnnotationAttributes attributes = this.getAttributes(annotationMetadata);
            // <3>.
            List<String> configurations = this.getCandidateConfigurations(annotationMetadata, attributes);
            // <4>.
            configurations = this.removeDuplicates(configurations);
            Set<String> exclusions = this.getExclusions(annotationMetadata, attributes);
            this.checkExcludedClasses(configurations, exclusions);
            configurations.removeAll(exclusions);
            configurations = this.filter(configurations, autoConfigurationMetadata);
            this.fireAutoConfigurationImportEvents(configurations, exclusions);
            return new AutoConfigurationImportSelector.AutoConfigurationEntry(configurations, exclusions);
        }
    }
```

**Bước 1**:

Kiểm tra công tắc Auto-Configuration có đang bật hay không. Mặc định `spring.boot.enableautoconfiguration=true`, có thể thiết lập trong `application.properties` hoặc `application.yml`.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/77aa6a3727ea4392870f5cccd09844ab-tplv-k3u1fbpfcp-9a7db9da.png)

**Bước 2**:

Dùng để lấy `exclude` và `excludeName` trong annotation `@EnableAutoConfiguration`.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/3d6ec93bbda1453aa08c52b49516c05a-tplv-k3u1fbpfcp-2075997d.png)

**Bước 3**:

Trong mã nguồn Spring Boot 2.1.x dùng ở bài viết này, khi lấy tất cả configuration class cần tự động cấu hình, hệ thống sẽ đọc file `META-INF/spring.factories`:

```plain
spring-boot/spring-boot-project/spring-boot-autoconfigure/src/main/resources/META-INF/spring.factories
```

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/58c51920efea4757aa1ec29c6d5f9e36-tplv-k3u1fbpfcp-55908136.png)

Từ hình dưới có thể thấy toàn bộ nội dung cấu hình trong file này đều đã được đọc lên. Vai trò của `XXXAutoConfiguration` chính là nạp các component theo nhu cầu.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/94d6e1a060ac41db97043e1758789026-tplv-k3u1fbpfcp-ca00402b.png)

Không chỉ `META-INF/spring.factories` thuộc dependency này được đọc, mà các tài nguyên cùng tên trong những file jar khác trên classpath cũng sẽ được `SpringFactoriesLoader` đọc và gộp lại. Cần lưu ý rằng Starter thường chỉ là jar dùng để gom nhóm các dependency; mã nguồn auto-configuration và file đăng ký có thể đặt trong một module `autoconfigure` riêng hoặc gộp chung với Starter, không phải mọi Starter đều bắt buộc phải chứa `spring.factories`.

Vì vậy, bạn có thể thấy rõ Spring Boot Starter của Druid connection pool đã tạo file `META-INF/spring.factories`.

Nếu cần viết auto-configuration cho Spring Boot 2.6 trở về trước, bạn phải dùng cách đăng ký này; còn với Spring Boot 3.x thì auto-configuration cần chuyển sang dùng `AutoConfiguration.imports`.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/68fa66aeee474b0385f94d23bcfe1745-tplv-k3u1fbpfcp-6062303a.png)

**Bước 4**:

Đến đây rất có thể người phỏng vấn sẽ hỏi bạn: "Trong `spring.factories` có nhiều cấu hình như vậy, chẳng lẽ mỗi lần khởi động đều phải nạp hết toàn bộ sao?".

Rõ ràng là điều đó không thực tế. Khi chúng ta debug tới bước sau, bạn sẽ thấy kích thước của `configurations` đã giảm đi đáng kể.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/267f8231ae2e48d982154140af6437b0-tplv-k3u1fbpfcp-5b518089.png)

Bởi vì ở bước này đã trải qua một lượt sàng lọc: class đó chỉ có hiệu lực khi tất cả các điều kiện trong `@ConditionalOnXXX` đều được thỏa mãn.

```java
@Configuration
// Kiểm tra các class liên quan: RabbitTemplate và Channel có tồn tại hay không
// Chỉ khi tồn tại mới nạp
@ConditionalOnClass({ RabbitTemplate.class, Channel.class })
@EnableConfigurationProperties(RabbitProperties.class)
@Import(RabbitAnnotationDrivenConfiguration.class)
public class RabbitAutoConfiguration {
}
```

Các bạn quan tâm có thể tìm hiểu chi tiết các conditional annotation do Spring Boot cung cấp:

- `@ConditionalOnBean`: Khi trong container có Bean được chỉ định
- `@ConditionalOnMissingBean`: Khi trong container không có Bean được chỉ định
- `@ConditionalOnSingleCandidate`: Khi Bean được chỉ định chỉ có duy nhất một bản trong container, hoặc tuy có nhiều nhưng đã chỉ định Bean ưu tiên (primary)
- `@ConditionalOnClass`: Khi trên classpath có class được chỉ định
- `@ConditionalOnMissingClass`: Khi trên classpath không có class được chỉ định
- `@ConditionalOnProperty`: Thuộc tính được chỉ định có giá trị tương ứng hay không
- `@ConditionalOnResource`: Trên classpath có tồn tại tài nguyên được chỉ định hay không
- `@ConditionalOnExpression`: Dựa trên biểu thức SpEL làm điều kiện đánh giá
- `@ConditionalOnJava`: Dựa trên phiên bản Java làm điều kiện đánh giá
- `@ConditionalOnJndi`: Khi JNDI tồn tại, tìm kiếm tại vị trí được chỉ định
- `@ConditionalOnNotWebApplication`: Khi dự án hiện tại không phải là ứng dụng Web
- `@ConditionalOnWebApplication`: Khi dự án hiện tại là ứng dụng Web

## Cách tự triển khai một Starter

Nói suông không bằng bắt tay làm thử, giờ hãy cùng viết một starter để triển khai Thread Pool tùy chỉnh.

Bước 1: Tạo project `threadpool-spring-boot-starter`.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/1ff0ebe7844f40289eb60213af72c5a6-tplv-k3u1fbpfcp-4b964b99.png)

Bước 2: Thêm các dependency liên quan của Spring Boot.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/5e14254276604f87b261e5a80a354cc0-tplv-k3u1fbpfcp-b700e257.png)

Bước 3: Tạo `ThreadPoolAutoConfiguration`.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/1843f1d12c5649fba85fd7b4e4a59e39-tplv-k3u1fbpfcp-9d898354.png)

Bước 4: Đăng ký class auto-configuration. Với Spring Boot 2.6 trở về trước, tạo file `META-INF/spring.factories` trong thư mục `resources` của project `threadpool-spring-boot-starter`; với Spring Boot 2.7 trở lên, cần dùng `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`, và khi hướng tới Spring Boot 3.x thì class auto-configuration thường được đánh dấu bằng `@AutoConfiguration`.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/97b738321f1542ea8140484d6aaf0728-tplv-k3u1fbpfcp-27bcba77.png)

Cuối cùng tạo project mới và thêm `threadpool-spring-boot-starter`.

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/edcdd8595a024aba85b6bb20d0e3fed4-tplv-k3u1fbpfcp-b4161c16.png)

Test chạy thành công!!!

![](/media/jg/ext/oss.javaguide.cn/system-design/framework/spring/9a265eea4de742a6bbdbbaa75f437307-tplv-k3u1fbpfcp-4d687394.png)

## Tổng kết

Spring Boot bật Auto-Configuration thông qua `@EnableAutoConfiguration` và nạp các class ứng viên auto-configuration đã đăng ký trên classpath. Spring Boot 2.6 trở về trước chủ yếu đăng ký qua `spring.factories`, còn Spring Boot 2.7 trở lên sử dụng `AutoConfiguration.imports`. Các class auto-configuration kết hợp cùng nhóm annotation `@Conditional` để kích hoạt theo nhu cầu; vai trò chính của Starter là gom các dependency thường dùng, chứ không phải là một tên package cố định bắt buộc phải có để auto-configuration hoạt động.
