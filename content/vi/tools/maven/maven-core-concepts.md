---
title: Tổng kết khái niệm cốt lõi Maven
description: "Bản chất của Apache Maven là một công cụ quản lý và diễn giải dự án phần mềm. Dựa trên khái niệm mô hình đối tượng dự án (Project Object Model, POM), Maven có thể quản lý quá trình build, báo cáo và tài liệu của dự án từ một nguồn thông tin trung tâm."
category: Công cụ phát triển
head:
  - - meta
    - name: keywords
      content: Tọa độ Maven,Maven Repository,Vòng đời Maven,Quản lý đa module Maven
lang: vi
sourceRef: zh-ref/tools/maven/maven-core-concepts.md
---

> Phần nội dung này chủ yếu được tổng hợp từ tài liệu chính thức của Maven và có lược bớt cho gọn, chủ yếu giữ lại các phần quan trọng, không đi vào thực chiến mà tập trung giới thiệu những khái niệm cốt lõi.

## Giới thiệu Maven

Tài liệu chính thức của [Maven](https://github.com/apache/maven) giới thiệu về Maven như sau:

> Apache Maven is a software project management and comprehension tool. Based on the concept of a project object model (POM), Maven can manage a project's build, reporting and documentation from a central piece of information.
>
> Bản chất của Apache Maven là một công cụ quản lý và diễn giải dự án phần mềm. Dựa trên khái niệm mô hình đối tượng dự án (Project Object Model, POM), Maven có thể quản lý quá trình build, báo cáo và tài liệu của dự án từ một nguồn thông tin trung tâm.

**POM là gì?** Mỗi dự án Maven đều có một file `pom.xml` nằm ở thư mục gốc, chứa thông tin chi tiết về vòng đời (lifecycle) build dự án. Thông qua file `pom.xml`, chúng ta có thể định nghĩa tọa độ dự án, dependency của dự án, thông tin dự án, thông tin plugin và nhiều cấu hình khác.

Đối với lập trình viên, Maven có 3 vai trò chính:

1. **Build dự án**: Cung cấp phương thức build dự án tự động, chuẩn hóa và đa nền tảng.
2. **Quản lý dependency**: Quản lý nhanh chóng và thuận tiện các tài nguyên mà dự án phụ thuộc (file JAR), tránh vấn đề xung đột phiên bản giữa các tài nguyên.
3. **Thống nhất cấu trúc phát triển**: Cung cấp cấu trúc dự án chuẩn mực và thống nhất.

Phần hướng dẫn sử dụng Maven cơ bản sẽ không trình bày ở đây; bạn nên xem hướng dẫn làm quen Maven trong 5 phút trên trang chủ: [Maven in 5 Minutes](https://maven.apache.org/guides/getting-started/maven-in-five-minutes.html).

## Tọa độ Maven (Coordinates)

Các thư viện bên thứ ba cũng như plugin mà dự án phụ thuộc vào có thể gọi chung là artifact (cấu kiện). Mỗi artifact đều có thể được định danh duy nhất bằng tọa độ Maven; các thành phần của tọa độ bao gồm:

- **groupId** (bắt buộc): Định nghĩa tổ chức hoặc công ty sở hữu dự án Maven hiện tại. `groupId` thường chia thành nhiều đoạn; thông thường đoạn đầu tiên là tên miền (domain) và đoạn thứ hai là tên công ty. Tên miền lại chia thành `org`, `com`, `cn`, v.v., trong đó `org` là tổ chức phi lợi nhuận, `com` là tổ chức thương mại, `cn` đại diện cho Trung Quốc. Lấy ví dụ dự án Tomcat của cộng đồng mã nguồn mở Apache: `groupId` của dự án này là `org.apache`, phần miền là `org` (vì Tomcat là dự án phi lợi nhuận), tên tổ chức là `apache` và `artifactId` là `tomcat`.
- **artifactId** (bắt buộc): Định nghĩa tên của dự án Maven hiện tại, là mã định danh duy nhất của dự án, tương ứng với tên thư mục gốc của dự án.
- **version** (bắt buộc): Định nghĩa phiên bản hiện tại của dự án Maven.
- **packaging** (tùy chọn): Định nghĩa cách đóng gói của dự án Maven (ví dụ `jar`, `war`...), mặc định dùng `jar`.
- **classifier** (tùy chọn): Thường dùng để phân biệt các artifact có nội dung khác nhau nhưng được build từ cùng một POM; có thể là một chuỗi bất kỳ gắn sau số phiên bản.

Chỉ cần bạn cung cấp đúng tọa độ, Maven có thể tìm thấy artifact tương ứng từ Maven Repository để sử dụng.

Ví dụ (thêm thư viện mã nguồn mở EasyExcel của Alibaba):

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>easyexcel</artifactId>
    <version>3.1.1</version>
</dependency>
```

Bạn có thể tìm thấy hầu hết các artifact khả dụng trên website <https://mvnrepository.com/>. Nếu dự án của bạn sử dụng Maven làm công cụ build, chắc chắn bạn sẽ thường xuyên truy cập trang web này.

![Kho lưu trữ Maven](/media/jg/ext/oss.javaguide.cn/javaguide/tools/maven/mvnrepository.com-e0948598.png)

## Dependency trong Maven

Nếu một artifact được tạo ra từ quá trình build Maven (ví dụ file JAR) được dự án khác tham chiếu đến, thì artifact đó chính là dependency (phần phụ thuộc) của dự án kia.

### Cấu hình Dependency

**Ví dụ cấu hình**:

```xml
<project>
    <dependencies>
        <dependency>
            <groupId></groupId>
            <artifactId></artifactId>
            <version></version>
            <type>...</type>
            <scope>...</scope>
            <optional>...</optional>
            <exclusions>
                <exclusion>
                  <groupId>...</groupId>
                  <artifactId>...</artifactId>
                </exclusion>
          </exclusions>
        </dependency>
      </dependencies>
</project>
```

**Giải thích cấu hình**:

- `dependencies`: Trong một file `pom.xml` chỉ được phép tồn tại một thẻ này, đây là thẻ tổng dùng để quản lý các dependency.
- `dependency`: Nằm bên trong thẻ `dependencies`, có thể có nhiều thẻ `dependency`, mỗi thẻ đại diện cho một dependency của dự án.
- `groupId`, `artifactId`, `version` (bắt buộc): Tọa độ cơ bản của dependency. Với bất kỳ dependency nào, tọa độ cơ bản là quan trọng nhất, Maven dựa vào tọa độ mới tìm được dependency cần thiết. Chúng ta đã giải thích ý nghĩa cụ thể của các phần tử này ở trên nên không nhắc lại ở đây.
- `type` (tùy chọn): Kiểu của dependency, tương ứng với `packaging` được định nghĩa trong tọa độ dự án. Trong phần lớn trường hợp không cần khai báo phần tử này, giá trị mặc định là `jar`.
- `scope` (tùy chọn): Phạm vi (scope) của dependency, giá trị mặc định là `compile`.
- `optional` (tùy chọn): Đánh dấu dependency có phải là tùy chọn hay không.
- `exclusions` (tùy chọn): Dùng để loại trừ các phụ thuộc bắc cầu (transitive dependency), ví dụ khi xảy ra xung đột gói JAR.

### Phạm vi Dependency (Dependency Scope)

**classpath** dùng để chỉ định vị trí lưu trữ các file `.class`; `ClassLoader` sẽ nạp các file `.class` cần thiết từ đường dẫn này vào bộ nhớ.

Maven có ba bộ classpath khác nhau trong lúc biên dịch, chạy kiểm thử và chạy thực tế:

- **Classpath biên dịch**: Có hiệu lực khi biên dịch mã nguồn chính.
- **Classpath kiểm thử**: Có hiệu lực khi biên dịch và chạy mã kiểm thử.
- **Classpath chạy (runtime)**: Có hiệu lực khi dự án vận hành thực tế.

Các phạm vi dependency của Maven như sau:

- **compile**: Phạm vi dependency biên dịch (mặc định). Dependency dùng phạm vi này có hiệu lực với cả ba giai đoạn biên dịch, kiểm thử và vận hành, tức là đều phải sử dụng gói JAR đó khi biên dịch, chạy test và chạy ứng dụng.
- **test**: Phạm vi dependency kiểm thử. Đúng như tên gọi, phạm vi này chỉ dùng cho kiểm thử, không thể dùng khi biên dịch hoặc chạy dự án chính; điển hình là JUnit, chỉ cần khi biên dịch và chạy mã test.
- **provided**: Phạm vi này có hiệu lực khi biên dịch và kiểm thử, nhưng không có hiệu lực khi chạy thực tế. Ví dụ `servlet-api.jar` đã được Tomcat cung cấp sẵn, chúng ta chỉ cần nó trong giai đoạn biên dịch mà thôi.
- **runtime**: Phạm vi dependency khi chạy (runtime). Có hiệu lực khi kiểm thử và vận hành thực tế, nhưng không có hiệu lực khi biên dịch mã nguồn chính; điển hình là các bản cài đặt JDBC driver.
- **system**: Phạm vi dependency hệ thống. Khi dùng dependency có phạm vi `system`, bắt buộc phải chỉ định tường minh đường dẫn file dependency thông qua thẻ `systemPath`, không dựa vào việc phân giải từ Maven repository nên có thể khiến quá trình build mất tính khả chuyển (non-portable).

### Phụ thuộc bắc cầu (Transitive Dependencies)

### Xung đột Dependency

**1. Đối với Maven, trong cùng một `groupId` và cùng một `artifactId`, chỉ có thể sử dụng duy nhất một `version`.**

```xml
<dependency>
    <groupId>in.hocg.boot</groupId>
    <artifactId>mybatis-plus-spring-boot-starter</artifactId>
    <version>1.0.48</version>
</dependency>
<!-- Chỉ sử dụng dependency phiên bản 1.0.49 này -->
<dependency>
    <groupId>in.hocg.boot</groupId>
    <artifactId>mybatis-plus-spring-boot-starter</artifactId>
    <version>1.0.49</version>
</dependency>
```

Nếu các dependency cùng loại nhưng khác phiên bản xuất hiện trong cùng một file `pom.xml`, Maven sẽ chỉ nạp dependency được khai báo sau.

**2. Hai dependency của dự án cùng kéo vào một dependency nào đó.**

Ví dụ, dự án tồn tại quan hệ phụ thuộc như sau:

```plain
Chuỗi dependency 1: A -> B -> C -> X(1.0)
Chuỗi dependency 2: A -> D -> X(2.0)
```

Trên hai đường dẫn phụ thuộc này có hai phiên bản của `X`. Để tránh trùng lặp dependency, Maven chỉ chọn một trong hai để phân giải.

**Phiên bản `X` nào sẽ được Maven phân giải và sử dụng?**

Khi gặp vấn đề này, Maven tuân theo hai nguyên tắc lớn: **Ưu tiên đường dẫn ngắn nhất** và **Ưu tiên thứ tự khai báo**. Quá trình giải quyết vấn đề này còn được gọi là **Điều giải dependency Maven (Maven Dependency Mediation)**.

**Ưu tiên đường dẫn ngắn nhất**

```plain
Chuỗi dependency 1: A -> B -> C -> X(1.0) // dist = 3
Chuỗi dependency 2: A -> D -> X(2.0) // dist = 2
```

Đường dẫn của chuỗi dependency 2 ngắn nhất, do đó `X(2.0)` sẽ được phân giải và sử dụng.

Tuy nhiên, bạn cũng có thể nhận ra nguyên tắc ưu tiên đường dẫn ngắn nhất không giải quyết được mọi trường hợp; với tình huống độ dài đường dẫn bằng nhau như dưới đây thì chỉ riêng nó sẽ không xử lý được:

```plain
Chuỗi dependency 1: A -> B -> X(1.0) // dist = 2
Chuỗi dependency 2: A -> D -> X(2.0) // dist = 2
```

Do đó, Maven tiếp tục định nghĩa nguyên tắc ưu tiên thứ tự khai báo.

Nguyên tắc điều giải dependency thứ nhất không thể giải quyết hết mọi tình huống, ví dụ quan hệ phụ thuộc như: `A->B->Y(1.0)`, `A->C->Y(2.0)`, độ dài đường dẫn dependency của `Y(1.0)` và `Y(2.0)` bằng nhau và đều bằng 2. Maven định nghĩa nguyên tắc thứ hai của điều giải dependency:

**Ưu tiên thứ tự khai báo**

Với điều kiện độ dài đường dẫn dependency bằng nhau, thứ tự khai báo dependency trong `pom.xml` quyết định dependency nào được phân giải và sử dụng; dependency được khai báo trước sẽ thắng. Trong ví dụ này, nếu dependency `B` được khai báo trước `D`, thì `X(1.0)` sẽ được phân giải và sử dụng.

```xml
<!-- A pom.xml -->
<dependencies>
    ...
    dependency B
    ...
    dependency D
</dependencies>
```

### Loại trừ Dependency

Việc chỉ phụ thuộc vào Maven để tự điều giải dependency trong nhiều trường hợp là không phù hợp, đòi hỏi chúng ta phải loại trừ dependency thủ công.

Ví dụ, dự án hiện tại có quan hệ phụ thuộc như sau:

```plain
Chuỗi dependency 1: A -> B -> C -> X(1.5) // dist = 3
Chuỗi dependency 2: A -> D -> X(1.0) // dist = 2
```

Theo nguyên tắc ưu tiên đường dẫn ngắn nhất, `X(1.0)` sẽ được phân giải và sử dụng, nghĩa là phiên bản thực tế được dùng là bản 1.0 của `X`.

NHƯNG!!! Điều này sẽ gây ra vấn đề: nếu dependency `C` dùng đến một class chỉ có trong phiên bản 1.5 của `X`, khi chạy dự án sẽ báo lỗi `NoClassDefFoundError`. Nếu dependency `C` dùng đến một phương thức chỉ có trong phiên bản 1.5 của `X`, khi chạy dự án sẽ báo lỗi `NoSuchMethodError`.

Giờ thì bạn đã hiểu tại sao dự án Maven của mình hay báo lỗi `NoClassDefFoundError` và `NoSuchMethodError` rồi chứ?

**Giải quyết thế nào?** Chúng ta có thể loại trừ thủ công `X(1.0)` thông qua thẻ `exclusion`.

```xml
<dependency>
    ......
    <exclusions>
      <exclusion>
        <artifactId>x</artifactId>
        <groupId>org.apache.x</groupId>
      </exclusion>
    </exclusions>
</dependency>
```

Thông thường khi xử lý xung đột dependency, chúng ta đều ưu tiên giữ lại phiên bản cao hơn. Đó là vì phần lớn các file JAR khi nâng cấp đều đảm bảo tương thích ngược (backward compatibility).

Nếu phiên bản cao đã sửa đổi một số class hoặc phương thức của phiên bản thấp, lúc này không thể giữ trực tiếp phiên bản cao được nữa, mà nên cân nhắc tối ưu hóa dependency tầng trên, chẳng hạn nâng cấp phiên bản của dependency tầng trên.

Vẫn là ví dụ trên:

```plain
Chuỗi dependency 1: A -> B -> C -> X(1.5) // dist = 3
Chuỗi dependency 2: A -> D -> X(1.0) // dist = 2
```

Chúng ta giữ lại phiên bản 1.5 của `X`, nhưng phiên bản `X` này đã xóa một số class có trong bản 1.0. Lúc này, chúng ta có thể cân nhắc nâng cấp phiên bản của `D` lên một phiên bản tương thích với `X(1.5)`.

## Maven Repository (Kho lưu trữ)

Trong thế giới Maven, bất kỳ dependency, plugin hay đầu ra từ quá trình build dự án nào đều có thể được gọi là **artifact (cấu kiện)**.

Tọa độ và dependency là cách biểu diễn logic của artifact trong thế giới Maven, còn biểu diễn vật lý của artifact là file; Maven quản lý thống nhất các file này thông qua repository. Bất kỳ artifact nào đều có một bộ tọa độ định danh duy nhất. Khi đã có repository, ta không cần tự tay đưa artifact vào dự án nữa mà chỉ cần cung cấp tọa độ của artifact là có thể tìm thấy artifact đó trong Maven repository.

Maven repository được chia thành:

- **Local Repository (Kho cục bộ)**: Một thư mục trên máy tính chạy Maven, dùng để cache các artifact tải từ xa về và chứa các artifact tạm thời chưa được phát hành. Có thể xem cấu hình đường dẫn local repository trong file `settings.xml`; mặc định đường dẫn local repository nằm ở `${user.home}/.m2/repository`.
- **Remote Repository (Kho từ xa)**: Kho Maven do đơn vị chính thức hoặc các tổ chức khác duy trì.

Remote repository của Maven có thể chia thành:

- **Central Repository (Kho trung tâm)**: Kho này do cộng đồng Maven duy trì, bên trong lưu trữ phần lớn các gói phần mềm mã nguồn mở và là cấu hình mặc định của Maven, không cần lập trình viên cấu hình thêm. Ngoài ra, để tiện tra cứu, Maven còn cung cấp một [địa chỉ tìm kiếm](https://central.sonatype.com/), giúp lập trình viên tìm nhanh tọa độ của artifact cần dùng.
- **Private Repository (Kho nội bộ / Private)**: Là một dạng remote repository đặc biệt của Maven, được dựng lên làm dịch vụ kho lưu trữ trong mạng nội bộ (LAN). Kho nội bộ thường được cấu hình làm mirror của các remote repository trên Internet để phục vụ người dùng Maven trong mạng nội bộ.
- **Các kho công cộng khác**: Có một số kho công cộng được tạo ra nhằm tăng tốc độ truy cập (như kho mirror Maven của Alibaba Cloud) hoặc lưu một số artifact không có trên Central Repository.

Thứ tự tìm kiếm gói dependency của Maven:

1. Tìm ở local repository trước; nếu có thì dùng trực tiếp.
2. Nếu không tìm thấy ở local repository, sẽ tìm ở remote repository rồi tải gói về local repository.
3. Nếu cũng không tìm thấy ở remote repository, sẽ báo lỗi.

## Vòng đời Maven (Lifecycle)

Vòng đời (lifecycle) của Maven sinh ra nhằm trừu tượng hóa và thống nhất toàn bộ quá trình build, bao gồm hầu như tất cả các bước build dự án như dọn dẹp, khởi tạo, biên dịch, kiểm thử, đóng gói, kiểm thử tích hợp, xác minh, triển khai và tạo trang tài liệu.

Maven định nghĩa 3 vòng đời trong `META-INF/plexus/components.xml`:

- Vòng đời `default`
- Vòng đời `clean`
- Vòng đời `site`

Các vòng đời này độc lập với nhau, mỗi vòng đời bao gồm nhiều giai đoạn (phase). Hơn nữa, các phase này có thứ tự, nghĩa là các phase phía sau phụ thuộc vào các phase phía trước. Khi thực thi một phase nào đó, các phase đứng trước nó sẽ được thực thi trước.

Cú pháp câu lệnh thực thi vòng đời Maven như sau:

```bash
mvn phase [phase2] ...[phasen]
```

### Vòng đời default

Vòng đời `default` được định nghĩa không gắn kèm bất kỳ plugin nào, là vòng đời chính của Maven dùng để build ứng dụng, gồm tổng cộng 23 phase.

```xml
<phases>
  <!-- Kiểm tra tính đúng đắn của dự án và đảm bảo đầy đủ thông tin cần thiết để hoàn tất quá trình build -->
  <phase>validate</phase>
  <!-- Thiết lập trạng thái khởi tạo, ví dụ thiết lập các thuộc tính (properties) -->
  <phase>initialize</phase>
  <!-- Sinh mã nguồn cần đưa vào giai đoạn biên dịch -->
  <phase>generate-sources</phase>
  <!-- Xử lý mã nguồn -->
  <phase>process-sources</phase>
  <!-- Sinh tài nguyên (resources) cần đưa vào gói build -->
  <phase>generate-resources</phase>
  <!-- Sao chép và xử lý tài nguyên vào thư mục đích để chuẩn bị cho giai đoạn đóng gói -->
  <phase>process-resources</phase>
  <!-- Biên dịch mã nguồn của dự án -->
  <phase>compile</phase>
  <!-- Xử lý hậu kỳ các file sinh ra sau khi biên dịch, ví dụ tối ưu/tăng cường bytecode cho các class Java -->
  <phase>process-classes</phase>
  <!-- Sinh mã nguồn kiểm thử cần đưa vào giai đoạn biên dịch -->
  <phase>generate-test-sources</phase>
  <!-- Xử lý mã nguồn kiểm thử -->
  <phase>process-test-sources</phase>
  <!-- Sinh mã nguồn kiểm thử cần đưa vào giai đoạn biên dịch -->
  <phase>generate-test-resources</phase>
  <!-- Xử lý các file được biên dịch từ mã nguồn kiểm thử -->
  <phase>process-test-resources</phase>
  <!-- Biên dịch mã nguồn kiểm thử -->
  <phase>test-compile</phase>
  <!-- Xử lý các file được biên dịch từ mã nguồn kiểm thử -->
  <phase>process-test-classes</phase>
  <!-- Chạy kiểm thử bằng framework unit test phù hợp (JUnit là một trong số đó) -->
  <phase>test</phase>
  <!-- Thực hiện các thao tác cần thiết trước khi đóng gói thực sự để chuẩn bị cho bước đóng gói -->
  <phase>prepare-package</phase>
  <!-- Lấy mã đã biên dịch và đóng gói thành định dạng có thể phân phối, ví dụ file JAR, WAR hoặc EAR -->
  <phase>package</phase>
  <!-- Thực hiện các thao tác cần thiết trước khi chạy kiểm thử tích hợp, ví dụ thiết lập môi trường cần thiết -->
  <phase>pre-integration-test</phase>
  <!-- Xử lý và triển khai gói phần mềm (nếu cần) vào môi trường có thể chạy kiểm thử tích hợp -->
  <phase>integration-test</phase>
  <!-- Thực hiện các thao tác cần thiết sau khi chạy kiểm thử tích hợp, ví dụ dọn dẹp môi trường -->
  <phase>post-integration-test</phase>
  <!-- Chạy các bước kiểm tra để xác minh gói đã đóng gói là hợp lệ và đạt tiêu chuẩn chất lượng -->
  <phase>verify</phase>
  <!-- Cài đặt gói vào local repository để làm dependency cho các dự án khác trên máy cục bộ -->
  <phase>install</phase>
  <!-- Sao chép gói dự án cuối cùng lên remote repository để chia sẻ với các lập trình viên và dự án khác -->
  <phase>deploy</phase>
</phases>
```

Dựa theo lý thuyết quan hệ phụ thuộc giữa các phase đã nêu ở trên, khi chúng ta chạy lệnh `mvn test`, toàn bộ các phase từ `validate` đến `test` đều sẽ được thực thi—điều này giải thích vì sao khi chạy kiểm thử, mã nguồn của dự án lại có thể tự động được biên dịch.

### Vòng đời clean

Mục đích của vòng đời `clean` là dọn dẹp dự án, gồm tổng cộng 3 phase:

1. `pre-clean`
2. `clean`
3. `post-clean`

```xml
<phases>
  <!-- Thực hiện một số công việc cần hoàn tất trước khi clean -->
  <phase>pre-clean</phase>
  <!-- Xóa toàn bộ các file sinh ra từ lần build trước đó -->
  <phase>clean</phase>
  <!-- Thực hiện một số công việc cần hoàn tất ngay sau khi clean -->
  <phase>post-clean</phase>
</phases>
<default-phases>
  <clean>
    org.apache.maven.plugins:maven-clean-plugin:2.5:clean
  </clean>
</default-phases>
```

Dựa theo lý thuyết quan hệ phụ thuộc giữa các phase đã nêu ở trên, khi chúng ta chạy lệnh `mvn clean`, hai phase `pre-clean` và `clean` trong vòng đời `clean` sẽ được thực thi.

### Vòng đời site

Mục đích của vòng đời `site` là xây dựng và phát hành trang tài liệu dự án, gồm tổng cộng 4 phase:

1. `pre-site`
2. `site`
3. `post-site`
4. `site-deploy`

```xml
<phases>
  <!-- Thực hiện một số công việc cần hoàn tất trước khi tạo tài liệu site -->
  <phase>pre-site</phase>
  <!-- Tạo tài liệu site cho dự án -->
  <phase>site</phase>
  <!-- Thực hiện một số công việc cần hoàn tất sau khi tạo tài liệu site và chuẩn bị cho bước triển khai -->
  <phase>post-site</phase>
  <!-- Triển khai tài liệu site đã tạo lên máy chủ chỉ định -->
  <phase>site-deploy</phase>
</phases>
<default-phases>
  <site>
    org.apache.maven.plugins:maven-site-plugin:3.3:site
  </site>
  <site-deploy>
    org.apache.maven.plugins:maven-site-plugin:3.3:deploy
  </site-deploy>
</default-phases>
```

Maven có thể tự động tạo ra một trang web dự án thân thiện dựa trên thông tin chứa trong `pom.xml`, giúp nhóm thuận tiện trao đổi và công bố thông tin dự án.

## Plugin Maven

Về bản chất, Maven là một framework thực thi plugin; mọi quá trình thực thi đều được hoàn thành độc lập bởi từng plugin một. Những lệnh chúng ta dùng hằng ngày như `install`, `clean`, `deploy` thực chất ở tầng dưới đều là từng plugin của Maven. Về các plugin cốt lõi của Maven, bạn có thể tham khảo tài liệu chính thức sau: <https://maven.apache.org/plugins/index.html>.

Đường dẫn plugin mặc định ở local: `${user.home}/.m2/repository/org/apache/maven/plugins`

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/maven/maven-plugins-7653c222.png)

Ngoài các plugin có sẵn của Maven, còn có một số plugin do bên thứ ba cung cấp như plugin độ phủ unit test `jacoco-maven-plugin`, plugin giúp kiểm tra các đoạn code chưa tuân thủ quy chuẩn `maven-checkstyle-plugin`, plugin phân tích chất lượng code `sonar-maven-plugin`. Hơn nữa, chúng ta còn có thể tự viết plugin tùy chỉnh để đáp ứng nhu cầu riêng.

Ví dụ sử dụng `jacoco-maven-plugin`:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.jacoco</groupId>
      <artifactId>jacoco-maven-plugin</artifactId>
      <version>0.8.8</version>
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

Bạn có thể hiểu plugin Maven là tập hợp của một nhóm các tác vụ (goal); người dùng có thể chạy trực tiếp tác vụ của một plugin chỉ định thông qua dòng lệnh, hoặc gắn tác vụ của plugin vào vòng đời build để chạy cùng vòng đời đó.

Plugin Maven được chia thành hai loại dưới đây:

- **Build plugins**: Thực thi trong quá trình build.
- **Reporting plugins**: Thực thi trong quá trình tạo trang web (site).

## Quản lý đa module trong Maven

Quản lý đa module hiểu đơn giản là chia một dự án thành nhiều module, mỗi module chỉ chịu trách nhiệm triển khai một chức năng đơn lẻ. Biểu hiện trực quan là trong một dự án Maven không chỉ có một file `pom.xml`, mà sẽ có nhiều file `pom.xml` nằm ở các thư mục khác nhau để thực hiện quản lý đa module.

Quản lý đa module ngoài việc giúp phát triển và quản lý dự án thuận tiện hơn, còn có các lợi ích sau:

1. Giảm mức độ ghép nối (coupling) giữa mã nguồn (nâng mức ghép nối từ cấp độ class lên cấp độ gói JAR);
2. Giảm trùng lặp, nâng cao khả năng tái sử dụng;
3. Mỗi module đều có khả năng tự giải thích (thông qua tên module hoặc tài liệu của module);
4. Module còn chuẩn hóa việc phân chia ranh giới mã nguồn, lập trình viên rất dễ xác định phần nội dung mình phụ trách thông qua các module.

Trong quản lý đa module, sẽ có một module cha (parent module), còn lại đều là các module con (child module). Module cha thường chỉ có một file `pom.xml` mà không có nội dung khác. File `pom.xml` của module cha nhìn chung chỉ định nghĩa số phiên bản của từng dependency, danh sách các module con và các plugin được sử dụng. Tuy nhiên cần lưu ý rằng, nếu một dependency chỉ dùng trong một dự án con nào đó thì có thể khai báo trực tiếp trong `pom.xml` của dự án con đó để tránh làm file POM cha trở nên quá cồng kềnh.

Như hình dưới đây, dự án Dubbo được chia thành nhiều module con như `dubbo-common` (module logic dùng chung), `dubbo-remoting` (module giao tiếp từ xa), `dubbo-rpc` (module gọi thủ tục từ xa).

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/maven/dubbo-maven-multi-module-dc124c7e.png)

## Bài viết đề xuất

- [Kỹ sư bảo mật giải thích cơ chế trọng tài của Maven trong kịch bản phụ thuộc gián tiếp - Alibaba Developer - 2022](https://mp.weixin.qq.com/s/flniMiP-eu3JSBnswfd_Ew)
- [Sử dụng hiệu quả công cụ build Java | Phần Maven - Alibaba Developer - 2022](https://mp.weixin.qq.com/s/Wvq7t2FC58jaCh4UFJ6GGQ)
- [Kỹ sư bảo mật kể câu chuyện đóng gói lại (repackaging) trong Maven - Alibaba Developer - 2022](https://mp.weixin.qq.com/s/xsJkB0onUkakrVH0wejcIg)

## Tài liệu tham khảo

- *Maven Thực Chiến (Maven in Action)*
- Introduction to Repositories - Tài liệu chính thức của Maven: <https://maven.apache.org/guides/introduction/introduction-to-repositories.html>
- Introduction to the Build Lifecycle - Tài liệu chính thức của Maven: <https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html#Lifecycle_Reference>
- Phạm vi Dependency trong Maven: <https://www.mvnbook.com/maven-dependency.html>
- Giải quyết xung đột dependency Maven, chỉ cần bài này là đủ!: <https://www.cnblogs.com/qdhxhz/p/16363532.html>
- Multi-Module Project with Maven: <https://www.baeldung.com/maven-multi-module>
