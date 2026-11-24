---
title: Thực hành tốt nhất với Maven (Best Practices)
description: "Tổng hợp các thực hành tốt nhất (Best Practices) thường dùng của Maven trong dự án Java, bao gồm cấu trúc thư mục chuẩn, phiên bản biên dịch, quản lý dependency, Profile, Maven Wrapper, build CI và sử dụng plugin."
category: Công cụ phát triển
head:
  - - meta
    - name: keywords
      content: Tọa độ Maven,Maven Repository,Vòng đời Maven,Quản lý đa module Maven,Maven Wrapper,Quản lý dependency
lang: vi
sourceRef: zh-ref/tools/maven/maven-best-practices.md
---

> Bài viết này được JavaGuide dịch và hoàn thiện, bài gốc tại: <https://medium.com/@AlexanderObregon/maven-best-practices-tips-and-tricks-for-java-developers-438eca03f72b>.

Maven là một công cụ tự động hóa build dự án Java được sử dụng rộng rãi. Nó đơn giản hóa quy trình build và giúp chúng ta quản lý các dependency. Để xem giới thiệu chi tiết về Maven, bạn có thể tham khảo bài viết này: [Tổng kết khái niệm cốt lõi Maven](./maven-core-concepts.md).

Bài viết này không đi sâu vào các khái niệm cơ bản của Maven, mà chủ yếu thảo luận về những vấn đề thực tế rất dễ vướng lỗi trong dự án: cấu trúc thư mục, phiên bản biên dịch, phiên bản dependency, cấu hình môi trường, Wrapper, CI và quản lý plugin.

## Cấu trúc thư mục chuẩn của Maven

Maven tuân theo một cấu trúc thư mục chuẩn để duy trì tính nhất quán giữa các dự án. Việc tuân thủ cấu trúc này giúp các lập trình viên khác dễ dàng hiểu dự án của chúng ta hơn.

Cấu trúc thư mục chuẩn của một dự án Maven như sau:

```groovy
src/
  main/
    java/
    resources/
  test/
    java/
    resources/
pom.xml
```

- `src/main/java`: Thư mục mã nguồn chính
- `src/main/resources`: Thư mục file tài nguyên
- `src/test/java`: Thư mục mã kiểm thử
- `src/test/resources`: Thư mục file tài nguyên kiểm thử

Đây chỉ là ví dụ cấu trúc dự án Maven đơn giản nhất. Trong dự án thực tế, chúng ta sẽ tiếp tục phân chia chi tiết hơn nữa theo quy chuẩn của dự án.

## Chỉ định tường minh phiên bản biên dịch Java

Đừng phụ thuộc vào phiên bản biên dịch mặc định của Maven hay của plugin; dự án nên khai báo rõ ràng phiên bản Java mục tiêu trong `pom.xml`. Đối với các dự án Java hiện đại, ưu tiên sử dụng `maven.compiler.release`—thuộc tính này tương ứng với `javac --release` và an toàn hơn việc cấu hình riêng lẻ `source` và `target`.

Cần lưu ý rằng `javac --release` được cung cấp từ JDK 9 trở đi; từ phiên bản Maven Compiler Plugin 3.13.0 trở lên, trên JDK 8 cũng đã hỗ trợ `maven.compiler.release` và sẽ tự động chuyển đổi sang `source` và `target`. Nếu dự án vẫn dùng plugin hoặc môi trường build cũ hơn, hãy cấu hình tường minh `source` và `target`.

Ví dụ, dự án cần biên dịch theo Java 17 thì có thể viết như sau:

```xml
<properties>
  <maven.compiler.release>17</maven.compiler.release>
</properties>
```

Nếu cần cấu hình trực tiếp `Maven Compiler Plugin`, bạn cũng có thể viết như sau:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <version>3.15.0</version>
      <configuration>
        <release>17</release>
      </configuration>
    </plugin>
  </plugins>
</build>
```

Giá trị của `release` không nên viết theo định dạng cũ như `1.8` nữa. Ví dụ Java 8 viết là `8`, Java 17 viết là `17`, Java 21 viết là `21`.

## Quản lý dependency hiệu quả

Hệ thống quản lý dependency của Maven là một trong những tính năng mạnh mẽ nhất của nó. Trong POM cha, việc định nghĩa phiên bản các dependency dùng chung thông qua `dependencyManagement` giúp tránh việc nhiều module cùng tự viết một số phiên bản, đồng thời giảm xác suất xung đột dependency.

Ví dụ, giả sử chúng ta có một module cha và hai module con A và B, muốn sử dụng JUnit 5 ở tất cả các module. Ta có thể định nghĩa phiên bản của JUnit trong file `pom.xml` của module cha thông qua `<dependencyManagement>`:

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>5.10.2</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

Trong file `pom.xml` của hai module con A và B, chỉ cần tham chiếu đến `groupId` và `artifactId` của JUnit là đủ:

```xml
<dependencies>
  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
  </dependency>
</dependencies>
```

Đối với các hệ sinh thái đã cung cấp sẵn BOM như Spring Boot, Spring Cloud, hãy ưu tiên import BOM chính thức rồi bỏ qua số phiên bản cụ thể của dependency trong các module nghiệp vụ. Cách làm này giúp giảm các vấn đề tương thích do "tự ghép phiên bản thủ công" gây ra.

## Sử dụng Profile cho các môi trường khác nhau

Profile trong Maven cho phép chúng ta cấu hình các thiết lập build cho từng môi trường khác nhau, ví dụ như môi trường phát triển (development), kiểm thử (test) và sản xuất (production). Định nghĩa các profile trong file `pom.xml` và kích hoạt chúng bằng tham số dòng lệnh:

```xml
<profiles>
  <profile>
    <id>development</id>
    <activation>
      <activeByDefault>true</activeByDefault>
    </activation>
    <properties>
      <environment>dev</environment>
    </properties>
  </profile>
  <profile>
    <id>production</id>
    <properties>
      <environment>prod</environment>
    </properties>
  </profile>
</profiles>
```

Kích hoạt profile bằng dòng lệnh:

```bash
mvn clean install -P production
```

## Giữ file pom.xml gọn gàng và có tổ chức

Một file `pom.xml` được tổ chức tốt sẽ dễ bảo trì và dễ hiểu hơn nhiều. Dưới đây là một số mẹo giúp giữ `pom.xml` luôn sạch sẽ:

- Gom nhóm các dependency và plugin tương tự nhau lại với nhau.
- Sử dụng chú thích (comment) để mô tả mục đích của một dependency hoặc plugin cụ thể.
- Đặt các số phiên bản dùng chung vào trong thẻ `<properties>`, hoặc gom về quản lý tập trung trong `dependencyManagement` / `pluginManagement` của POM cha.

```xml
<properties>
  <junit.version>5.10.2</junit.version>
  <mockito.version>5.12.0</mockito.version>
</properties>
```

Phiên bản của plugin cũng được khuyến nghị khai báo tường minh. Đừng phụ thuộc vào phiên bản plugin mặc định của Maven, nếu không giữa các phiên bản Maven hoặc các môi trường build khác nhau có thể xuất hiện sự khác biệt về hành vi.

## Sử dụng Maven Wrapper

Maven Wrapper là một công cụ dùng để quản lý và sử dụng Maven, cho phép chạy và build dự án Maven ngay cả khi chưa cài đặt sẵn Maven trên máy.

Tài liệu chính thức của Maven giới thiệu về Maven Wrapper như sau:

> The Maven Wrapper is an easy way to ensure a user of your Maven build has everything necessary to run your Maven build.
>
> Maven Wrapper là một cách đơn giản để đảm bảo người dùng build Maven của bạn có đầy đủ mọi thứ cần thiết để chạy quá trình build Maven.

Maven Wrapper có thể đảm bảo quá trình build sử dụng đúng phiên bản Maven, rất tiện lợi. Để sử dụng Maven Wrapper, hãy chạy lệnh sau trong thư mục dự án:

```bash
mvn wrapper:wrapper
```

Lệnh này sẽ tạo ra các file Maven Wrapper trong dự án của chúng ta. Bây giờ chúng ta có thể dùng `./mvnw` (hoặc `./mvnw.cmd` trên Windows) thay cho `mvn` để thực thi các lệnh Maven.

Các dự án nhóm nên commit `mvnw`, `mvnw.cmd` và thư mục `.mvn/wrapper/`. Nhờ vậy, thành viên mới hoặc môi trường CI không cần cài đặt trước phiên bản Maven chỉ định mà vẫn có thể hoàn tất build bằng đúng phiên bản Maven mà dự án khai báo.

## Tự động hóa build thông qua Tích hợp liên tục (CI)

Tích hợp dự án Maven với hệ thống Tích hợp liên tục (CI) như Jenkins hoặc GitHub Actions giúp đảm bảo mã nguồn của chúng ta được tự động build, kiểm thử và triển khai. CI giúp phát hiện vấn đề sớm và mang lại quy trình build nhất quán trong toàn đội ngũ. Dưới đây là một ví dụ workflow GitHub Actions đơn giản cho dự án Maven:

```yaml
name: Java CI with Maven

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: "temurin"
          cache: "maven"

      - name: Build with Maven
        run: ./mvnw -B clean verify
```

Trong CI, khuyến nghị sử dụng `clean verify` vì nó sẽ chạy kiểm thử và các bước xác minh cần thiết. `install` sẽ cài đặt sản phẩm build vào local repository, nên chỉ cần dùng khi các bước tiếp theo thực sự phụ thuộc vào kết quả đã cài ở local đó.

## Tận dụng các Plugin Maven để mở rộng tính năng

Có rất nhiều plugin Maven giúp mở rộng khả năng của Maven. Một số plugin phổ biến bao gồm (ba cái đầu là plugin có sẵn của Maven, ba cái sau là plugin do bên thứ ba cung cấp):

- `maven-surefire-plugin`: Cấu hình và chạy unit test.
- `maven-failsafe-plugin`: Cấu hình và chạy integration test (kiểm thử tích hợp).
- `maven-javadoc-plugin`: Sinh tài liệu dự án theo định dạng Javadoc.
- `maven-checkstyle-plugin`: Ép buộc tuân thủ chuẩn coding và các thực hành tốt nhất.
- `jacoco-maven-plugin`: Đo độ phủ unit test.
- `sonar-maven-plugin`: Phân tích chất lượng mã nguồn.
- ...

Ví dụ sử dụng `jacoco-maven-plugin`:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.jacoco</groupId>
      <artifactId>jacoco-maven-plugin</artifactId>
      <version>0.8.12</version>
      <executions>
        <execution>
          <goals>
            <goal>prepare-agent</goal>
          </goals>
        </execution>
        <execution>
          <id>generate-code-coverage-report</id>
          <phase>test</phase>
          <goals>
            <goal>report</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

Nếu các plugin hiện có vẫn chưa đáp ứng được nhu cầu, chúng ta hoàn toàn có thể tự viết plugin tùy chỉnh.

Hãy khám phá các plugin sẵn có và cấu hình chúng trong file `pom.xml` để nâng cao quy trình phát triển của mình.

## Tổng kết

Điều quan trọng nhất đối với Maven không phải là "dự án có chạy lên được hay không", mà là giúp cả đội ngũ sử dụng một phương thức build nhất quán giữa máy cá nhân (local), môi trường CI và môi trường triển khai. Trong dự án thực tế, nên ưu tiên làm tốt những việc sau: sử dụng cấu trúc thư mục chuẩn, khai báo tường minh phiên bản Java và phiên bản plugin, quản lý phiên bản dependency thông qua parent POM, BOM và `dependencyManagement`, commit Maven Wrapper, đồng thời cố định phiên bản JDK và câu lệnh build Maven trong CI.
