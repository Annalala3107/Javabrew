---
title: Vì sao file JAR của Spring Boot có thể chạy trực tiếp?
description: "Giải thích cơ chế đóng gói và khởi chạy executable JAR thông qua java -jar, Main-Class, Start-Class, BOOT-INF và Spring Boot Loader, đồng thời phân biệt rõ vai trò của container nhúng và Auto-Configuration."
category: Framework
tag:
  - Spring Boot
  - Java
head:
  - - meta
    - name: keywords
      content: "Spring Boot,Executable JAR,java -jar,JarLauncher,Main-Class,Start-Class,BOOT-INF,repackage"
lang: vi
sourceRef: zh-ref/system-design/framework/spring/spring-boot-executable-jar.md
---

**Điểm mấu chốt giúp file executable JAR của Spring Boot chạy được nằm ở điểm vào khởi động khai báo trong manifest và Boot Loader có khả năng nạp các dependency lồng nhau.** Tomcat nhúng chịu trách nhiệm cung cấp dịch vụ HTTP và chỉ là một thành phần sau khi ứng dụng Web khởi động; một ứng dụng dòng lệnh không có Web Container cũng có thể đóng gói và chạy tương tự.

## File JAR thông thường có chạy được bằng `java -jar` không?

Có. JAR là một định dạng lưu trữ nén, không phải định dạng độc quyền của Spring Boot. Khi dùng `java -jar app.jar`, trình khởi chạy Java sẽ đọc `Main-Class` trong `META-INF/MANIFEST.MF` rồi gọi tới điểm vào tương ứng. Ứng dụng Java thông thường chỉ cần có điểm vào đáp ứng yêu cầu của JDK mục tiêu và đảm bảo các dependency nạp được thì vẫn khởi chạy theo cách này. Xem chi tiết tại [tài liệu lệnh `java` của Java 17](https://docs.oracle.com/en/java/javase/17/docs/specs/man/java.html).

Phần mà Spring Boot giải quyết thêm là làm sao đóng gói các dependency đi cùng ứng dụng và nạp được chúng từ bên trong file JAR lớp ngoài. Cơ chế `ClassLoader` chuẩn của Java không tự động nạp đệ quy các file JAR nằm bên trong một file JAR khác, nên chỉ chép các file dependency vào gói nén là chưa đủ.

## Bên trong Boot executable JAR có những gì?

Dưới đây là cấu trúc bố cục phổ biến của Boot Loader (đã lược bỏ một số file):

```text
app.jar
├── META-INF/MANIFEST.MF
├── org/springframework/boot/loader/...
└── BOOT-INF/
    ├── classes/
    │   ├── com/example/Application.class
    │   ├── application.yml
    │   └── static/...
    └── lib/
        ├── spring-context-*.jar
        └── other-dependency-*.jar
```

Các lớp của ứng dụng và tài nguyên trên classpath nằm ở `BOOT-INF/classes/`, các dependency vẫn giữ dạng từng file JAR độc lập trong `BOOT-INF/lib/`, còn các lớp Loader được đặt ở vị trí mà file JAR ngoài có thể nạp trực tiếp. Các dependency không bị giải nén hết rồi gộp phẳng thành một tập file `.class` duy nhất — điểm này khác với cách làm shaded JAR thông thường. Xem thêm tại [Đặc tả Nested JAR của Spring Boot](https://docs.spring.io/spring-boot/specification/executable-jar/nested-jars.html).

## `Main-Class` và `Start-Class` khác nhau ở điểm nào?

Khi dùng Loader mới được đưa vào mặc định từ Spring Boot 3.2, hai trường trong manifest trông giống như sau:

```text
Main-Class: org.springframework.boot.loader.launch.JarLauncher
Start-Class: com.example.Application
```

- **`Main-Class`**: Lớp dẫn đường (bootstrap class) được trình khởi chạy Java gọi đầu tiên.
- **`Start-Class`**: Lớp `main` thực sự của ứng dụng mà Boot Launcher sẽ gọi sau cùng.

Các bản Loader cũ thường có điểm vào là `org.springframework.boot.loader.JarLauncher`, không có package `launch` ở giữa. Spring Boot 3.2 đã viết lại Loader và điều chỉnh tên lớp điểm vào mặc định; khi kiểm tra sự cố cần đối chiếu theo manifest trong sản phẩm build thực tế. Xem chi tiết tại [Ghi chú phát hành Spring Boot 3.2](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.2-Release-Notes).

`Start-Class` là metadata do Spring Boot sử dụng, không phải điểm vào ứng dụng mà trình khởi chạy Java tự động nhận diện. `@SpringBootApplication` cũng không thể thay thế cấu hình điểm vào trong manifest.

## Từ `java -jar` đến lúc ứng dụng khởi động đã diễn ra những gì?

1. Trình khởi chạy Java đọc `Main-Class` và thực thi `JarLauncher`.
2. Launcher sắp xếp đường dẫn nạp cho các lớp ứng dụng và dependency lồng nhau theo bố cục Boot, đồng thời tạo `ClassLoader` tương ứng.
3. Launcher đọc `Start-Class`, nạp lớp chính của ứng dụng và gọi phương thức `main` của nó.
4. Lớp chính của ứng dụng thường gọi `SpringApplication.run(...)` để tạo `ApplicationContext`, đăng ký Bean và chạy Auto-Configuration.
5. Nếu ứng dụng thỏa mãn điều kiện của ứng dụng Web và cấu hình server tương ứng, nó tiếp tục tạo và khởi động server nhúng.

Vì vậy, `JarLauncher` là lớp dẫn đường khởi động chứ không đồng nhất với `ClassLoader`; Auto-Configuration và Web Server cũng không phải lý do giúp JVM nhận diện được executable JAR. Cơ chế điểm vào xem tại [Launching Executable Jars](https://docs.spring.io/spring-boot/specification/executable-jar/launching.html), còn chi tiết Auto-Configuration xem tại [Nguyên lý Auto-Configuration của Spring Boot](./spring-boot-auto-assembly-principles.md).

Boot Loader có thể đọc các mục lồng nhau dựa theo vị trí bên trong gói nén ngoài, thông thường không cần giải nén toàn bộ JAR ra ổ đĩa trước, cũng không cần đọc toàn bộ mọi dependency vào bộ nhớ cùng một lúc. Trường hợp một số dependency đặc biệt cần giải nén là cơ chế thích ứng riêng, không thể đánh đồng rằng "khởi động Boot là giải nén toàn bộ mọi JAR trước". Xem thêm [Mô tả `NestedJarFile`](https://docs.spring.io/spring-boot/specification/executable-jar/jarfile-class.html).

## Làm sao kiểm chứng sản phẩm đóng gói là executable JAR?

Với dự án Maven, thông thường mục tiêu `repackage` của `spring-boot-maven-plugin` sẽ tổ chức lại file JAR thông thường. Khi kế thừa `spring-boot-starter-parent`, cấu hình thực thi tương ứng đã được thiết lập sẵn nhưng bạn vẫn phải khai báo plugin; chỉ import BOM quản lý dependency sẽ không tự động gắn mục tiêu đóng gói này. Với dự án Gradle thì sử dụng task `bootJar` do plugin Spring Boot cung cấp.

Ví dụ, build trong một dự án đã cấu hình đúng Maven plugin rồi kiểm tra sản phẩm thực tế:

```bash
mvn package
jar tf target/app.jar
unzip -p target/app.jar META-INF/MANIFEST.MF
java -jar target/app.jar
```

Cần thay `app.jar` bằng tên file thực tế mà dự án sinh ra. Maven plugin mặc định có thể giữ lại bản gốc `.original`, và dự án Gradle cũng có thể sinh đồng thời file JAR thường; trước khi triển khai cần xác nhận đã chọn đúng file đã được Boot đóng gói lại (`repackage`). Tham khảo hành vi đóng gói tại [Tài liệu Maven Plugin](https://docs.spring.io/spring-boot/maven-plugin/packaging.html) và [Tài liệu Gradle Plugin](https://docs.spring.io/spring-boot/gradle-plugin/packaging.html).

Khi gặp lỗi khởi động, bạn có thể rà soát theo đúng chuỗi trên:

| Hiện tượng                         | Kiểm tra ưu tiên                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| Thiếu main manifest attribute      | Có đang chạy nhầm file JAR thường không, bước `repackage` đã chạy chưa                   |
| Không tìm thấy `JarLauncher`       | Tên lớp trong manifest có khớp với phiên bản Loader và nội dung bên trong gói nén không  |
| Không tìm thấy lớp ứng dụng hoặc lớp thư viện | `Start-Class`, thư mục lớp ứng dụng và dependency lúc chạy đã được đóng gói đúng chưa |
| Ứng dụng khởi động nhưng không mở cổng HTTP | Có phải ứng dụng Web không, đã khai báo và bật server tương ứng chưa                |
| `UnsupportedClassVersionError`     | JDK lúc chạy (runtime) có thấp hơn phiên bản mà file `.class` yêu cầu hay không          |

Executable JAR đóng gói ứng dụng và các dependency Java đi kèm, nhưng vẫn cần môi trường chạy Java tương thích; các phụ thuộc môi trường như cơ sở dữ liệu, cấu hình bên ngoài hay thư viện native của hệ điều hành cũng không vì thế mà tự biến mất.
