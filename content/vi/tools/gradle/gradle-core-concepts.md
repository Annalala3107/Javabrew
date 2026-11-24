---
title: Tổng kết khái niệm cốt lõi Gradle
description: "Gradle là một công cụ build tự động chạy trên JVM, hỗ trợ điều phối task linh hoạt, quản lý dependency, mở rộng bằng plugin và build đa dự án (multi-project)."
category: Công cụ phát triển
head:
  - - meta
    - name: keywords
      content: Gradle,Groovy,Gradle Wrapper,Trình bao bọc Gradle,Plugin Gradle
lang: vi
sourceRef: zh-ref/tools/gradle/gradle-core-concepts.md
---

> Phần nội dung này chủ yếu được tổng hợp từ tài liệu chính thức của Gradle và có lược bớt cho gọn, chủ yếu giữ lại các phần quan trọng, không đi vào thực chiến mà tập trung giới thiệu những khái niệm cốt lõi.

Phần nội dung Gradle này thuộc phần tùy chọn, bạn có thể tự quyết định có học hay không tùy theo nhu cầu bản thân. Trong các dự án Java Backend tại Trung Quốc, Maven vẫn phổ biến hơn, nhưng ở Android, một số dự án Spring Boot cũng như các dự án đòi hỏi tùy biến cao quy trình build thì Gradle cũng được sử dụng rất nhiều.

## Giới thiệu Gradle

Tài liệu chính thức của Gradle giới thiệu về Gradle như sau:

> Gradle is an open-source [build automation](https://en.wikipedia.org/wiki/Build_automation) tool flexible enough to build almost any type of software. Gradle makes few assumptions about what you’re trying to build or how to build it. This makes Gradle particularly flexible.
>
> Gradle là một công cụ tự động hóa build mã nguồn mở, đủ linh hoạt để build hầu như bất kỳ loại phần mềm nào. Gradle đặt ra rất ít giả định về việc bạn đang cố gắng build cái gì hoặc build như thế nào. Điều này giúp Gradle trở nên đặc biệt linh hoạt.

Nói một cách đơn giản, Gradle là một công cụ build dự án tự động chạy trên JVM, dùng để giúp chúng ta hoàn thành các tác vụ build như biên dịch, kiểm thử, đóng gói, phát hành, v.v.

Đối với lập trình viên, Gradle có 3 vai trò chính:

1. **Build dự án**: Cung cấp phương thức build dự án tự động, chuẩn hóa và đa nền tảng.
2. **Quản lý dependency**: Quản lý nhanh chóng và thuận tiện các tài nguyên mà dự án phụ thuộc (file JAR), tránh vấn đề xung đột phiên bản giữa các tài nguyên.
3. **Thống nhất cấu trúc phát triển**: Cung cấp cấu trúc dự án chuẩn mực và thống nhất.

Script build của Gradle có thể viết bằng Groovy DSL hoặc Kotlin DSL. Hiện nay trong các dự án mới, Kotlin DSL cũng rất phổ biến vì khả năng gợi ý kiểu (type hint) và hỗ trợ từ IDE thường tốt hơn.

## Giới thiệu Groovy

Gradle là một chương trình chạy trên JVM, script build có thể viết bằng Groovy hoặc Kotlin. Trong lịch sử, rất nhiều ví dụ Gradle sử dụng Groovy DSL, vì vậy tìm hiểu qua một chút cú pháp Groovy sẽ rất hữu ích khi đọc các dự án cũ.

Groovy là một ngôn ngữ kịch bản (scripting language) chạy trên JVM, là ngôn ngữ động được mở rộng dựa trên Java; cú pháp của nó rất giống với Java và có thể sử dụng các thư viện lớp của Java. Groovy có thể dùng cho lập trình hướng đối tượng và cũng có thể dùng thuần túy như một ngôn ngữ kịch bản. Về mặt thiết kế ngôn ngữ, nó tiếp thu những đặc tính ưu việt của Java, Python, Ruby và Smalltalk, chẳng hạn như ép kiểu động, closure và hỗ trợ metaprogramming.

Chúng ta có thể học Groovy theo cách học Java nên chi phí học tập tương đối thấp; ngay cả khi quên cú pháp Groovy trong quá trình phát triển, bạn vẫn có thể tiếp tục code bằng cú pháp Java.

Có rất nhiều ngôn ngữ chạy trên nền tảng JVM như Groovy, Kotlin, Java, Scala; cuối cùng tất cả chúng đều được biên dịch thành file Java bytecode và chạy trên JVM.

## Ưu điểm của Gradle

Gradle là hệ thống build thế hệ mới, sở hữu nhiều ưu điểm như hiệu năng cao và tính linh hoạt, được sử dụng rộng rãi trong phát triển Java. Không chỉ Android chọn nó làm hệ thống build chính thức, ngày càng nhiều dự án Java như Spring Boot cũng dần chuyển sang Gradle.

- **Về tính linh hoạt**: Gradle hỗ trợ viết script dựa trên ngôn ngữ Groovy, chú trọng tính linh hoạt của quá trình build, phù hợp với các dự án có độ phức tạp cao và có thể xử lý những quy trình build rất phức tạp.
- **Về độ chi tiết (granularity)**: Độ chi tiết build của Gradle được chia nhỏ đến từng Task. Hơn nữa toàn bộ mã nguồn các Task của nó đều là mã nguồn mở; sau khi nắm được trọn vẹn quy trình đóng gói này, chúng ta có thể sửa đổi Task của nó để thay đổi động luồng thực thi.
- **Về khả năng mở rộng**: Gradle hỗ trợ cơ chế plugin, nên chúng ta có thể tái sử dụng các plugin này đơn giản và tiện lợi như tái sử dụng thư viện.

## Giới thiệu Gradle Wrapper

Tài liệu chính thức của Gradle giới thiệu về Gradle Wrapper như sau:

> The recommended way to execute any Gradle build is with the help of the Gradle Wrapper (in short just “Wrapper”). The Wrapper is a script that invokes a declared version of Gradle, downloading it beforehand if necessary. As a result, developers can get up and running with a Gradle project quickly without having to follow manual installation processes saving your company time and money.
>
> Cách được khuyến nghị để thực thi bất kỳ bản build Gradle nào là thông qua Gradle Wrapper (gọi tắt là "Wrapper"). Wrapper là một script gọi đến phiên bản Gradle đã được khai báo và tải trước phiên bản đó nếu cần thiết. Nhờ vậy, lập trình viên có thể nhanh chóng khởi chạy dự án Gradle mà không phải làm theo các bước cài đặt thủ công, giúp công ty tiết kiệm thời gian và chi phí.

Chúng ta có thể gọi Gradle Wrapper là trình bao bọc Gradle; nó bao bọc lại Gradle thêm một lớp để mọi lệnh build Gradle đều chạy thông qua Gradle Wrapper.

Sơ đồ quy trình hoạt động của Gradle Wrapper như dưới đây (nguồn ảnh: [Tài liệu chính thức về Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html)):

![Quy trình hoạt động của Gradle Wrapper](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/efa7a0006b04051e2b84cd116c6ccdfc-6b4abbc2.png)

Toàn bộ quy trình chủ yếu gồm 3 bước sau:

1. Trước tiên khi mới thiết lập, nếu phiên bản được chỉ định chưa được tải về, nó sẽ truy cập máy chủ của Gradle để tải file nén của phiên bản tương ứng;
2. Sau khi tải xong, cần giải nén và thực thi file batch/script;
3. Những lần build dự án tiếp theo sẽ tái sử dụng phiên bản Gradle đã giải nén này.

Gradle Wrapper mang lại cho chúng ta những lợi ích sau:

1. Chuẩn hóa dự án trên một phiên bản Gradle xác định, giúp quá trình build ổn định và tin cậy hơn.
2. Cho phép chạy dự án Gradle mà không cần cài đặt sẵn môi trường Gradle trên máy tính.
3. Việc cung cấp phiên bản Gradle mới cho các người dùng và môi trường thực thi khác nhau (như IDE hay máy chủ Tích hợp liên tục) đơn giản chỉ như thay đổi cấu hình định nghĩa Wrapper.

### Tạo Gradle Wrapper

Nếu muốn tạo Gradle Wrapper lần đầu, máy cục bộ cần có sẵn Gradle khả dụng. Gradle đã tích hợp sẵn Task `wrapper`; chỉ cần chạy lệnh `gradle wrapper` tại thư mục gốc của dự án là có thể tạo ra Gradle Wrapper.

Khi chạy lệnh `gradle wrapper`, có thể chỉ định một số tham số để điều khiển việc tạo wrapper. Cụ thể có các tham số cấu hình sau đây:

- `--gradle-version`: Dùng để chỉ định phiên bản Gradle sử dụng.
- `--gradle-distribution-url`: Dùng để chỉ định URL tải bản phân phối (distribution) của Gradle; giá trị này thường có dạng `https://services.gradle.org/distributions/gradle-${gradleVersion}-bin.zip`.
- `--gradle-distribution-sha256-sum`: Dùng để chỉ định mã kiểm tra SHA-256 của gói nén distribution, giúp giảm rủi ro file tải về bị chỉnh sửa trái phép.

Sau khi chạy lệnh `gradle wrapper`, Gradle Wrapper sẽ được tạo xong, sinh ra các file sau trong thư mục gốc của dự án:

```plain
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
└── gradlew.bat
```

Ý nghĩa của từng file như sau:

- `gradle-wrapper.jar`: Chứa mã logic runtime của Gradle Wrapper.
- `gradle-wrapper.properties`: Định nghĩa số phiên bản Gradle và các thuộc tính hành vi khi chạy của Gradle Wrapper.
- `gradlew`: Script wrapper dùng để chạy các lệnh Gradle trên nền tảng Linux/macOS.
- `gradlew.bat`: Script wrapper dùng để chạy các lệnh Gradle trên nền tảng Windows.

Nội dung của file `gradle-wrapper.properties` như sau:

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-6.0.1-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

- `distributionBase`: Thư mục cha lưu trữ Gradle sau khi giải nén.
- `distributionPath`: Thư mục con của thư mục được chỉ định bởi `distributionBase`. `distributionBase + distributionPath` chính là thư mục cụ thể chứa Gradle sau khi giải nén.
- `distributionUrl`: Địa chỉ tải về gói nén của phiên bản Gradle chỉ định.
- `zipStoreBase`: Thư mục cha lưu trữ gói nén Gradle sau khi tải về.
- `zipStorePath`: Thư mục con của thư mục được chỉ định bởi `zipStoreBase`. `zipStoreBase + zipStorePath` chính là vị trí lưu gói nén Gradle.

### Cập nhật Gradle Wrapper

Có 2 cách để cập nhật Gradle Wrapper:

1. Sửa trực tiếp trường `distributionUrl`, sau đó chạy lệnh Gradle.
2. Chạy lệnh `./gradlew wrapper --gradle-version [version]`.

Lệnh dưới đây sẽ nâng cấp phiên bản Gradle lên `9.5.1`.

```shell
./gradlew wrapper --gradle-version 9.5.1
```

Thuộc tính `distributionUrl` trong file `gradle-wrapper.properties` cũng sẽ thay đổi theo:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-9.5.1-bin.zip
```

Sau khi dự án đã tạo Wrapper, trong quá trình build hằng ngày hãy ưu tiên dùng `./gradlew build` thay vì dùng trực tiếp lệnh `gradle build` cài sẵn trên máy. Cách này đảm bảo các thành viên trong nhóm và môi trường CI sử dụng cùng một phiên bản Gradle.

### Tùy biến Gradle Wrapper

Gradle đã tích hợp sẵn Task `wrapper`, vì vậy việc chạy Task này sẽ tạo file thuộc tính cho Gradle Wrapper, và file thuộc tính này có thể được thiết lập bằng cách tùy biến Task `wrapper`. Ví dụ, nếu muốn đổi phiên bản Gradle cần tải về thành `9.5.1`, ta có thể thiết lập như sau:

```groovy
tasks.wrapper {
    gradleVersion = '9.5.1'
}
```

Bạn cũng có thể cấu hình địa chỉ tải gói nén distribution của Gradle và đường dẫn lưu trữ cục bộ sau khi giải nén Gradle:

```groovy
tasks.wrapper {
    gradleVersion = '9.5.1'
    distributionUrl = '../../gradle-9.5.1-bin.zip'
    distributionPath = 'wrapper/dists'
}
```

Thuộc tính `distributionUrl` có thể đặt thành đường dẫn thư mục cục bộ của dự án, hoặc cũng có thể đặt thành địa chỉ mạng.

## Gradle Task

Trong Gradle, **Task** (tác vụ) là một đơn vị công việc đơn lẻ được thực thi trong quá trình build.

Quá trình build của Gradle được thực hiện dựa trên Task: khi bạn chạy một dự án, thực chất bạn đang thực thi một chuỗi các Task, chẳng hạn như Task biên dịch mã nguồn Java hay Task tạo file JAR.

Cách khai báo Task như sau (còn một số cách khai báo khác nữa):

```groovy
// Khai báo một Task tên là helloTask
task helloTask{
     doLast{
       println "Hello"
     }
}
```

Sau khi tạo một Task, bạn có thể thêm các Action khác nhau vào Task tùy theo nhu cầu; `doLast` ở trên là thêm một Action vào cuối hàng đợi.

```groovy
 // Thêm Action vào đầu hàng đợi Action
 Task doFirst(Action<? super Task> action);
 Task doFirst(Closure action);

 // Thêm Action vào cuối hàng đợi Action
 Task doLast(Action<? super Task> action);
 Task doLast(Closure action);

 // Xóa toàn bộ Action
 Task deleteAllActions();
```

Một Task có thể chứa nhiều Action và các Action sẽ được thực thi lần lượt từ đầu hàng đợi đến cuối hàng đợi.

Action đại diện cho từng hàm, từng phương thức; mỗi Task là một đồ thị thực thi được cấu thành từ tập hợp các Action theo thứ tự.

Từ khóa để khai báo sự phụ thuộc giữa các Task là `dependsOn`, hỗ trợ khai báo một hoặc nhiều phụ thuộc:

```groovy
task first {
 doLast {
        println "+++++first+++++"
    }
}
task second {
 doLast {
        println "+++++second+++++"
    }
}

// Chỉ định nhiều task phụ thuộc
task print(dependsOn :[second,first]) {
 doLast {
      logger.quiet "Chỉ định nhiều task phụ thuộc"
    }
}

// Chỉ định một task phụ thuộc
task third(dependsOn : print) {
 doLast {
      println '+++++third+++++'
    }
}
```

Trước khi thực thi một Task, các Task mà nó phụ thuộc vào sẽ được thực thi trước.

Chúng ta cũng có thể thiết lập Task mặc định (default Task); ngay cả khi không gọi Task mặc định đó, nó vẫn sẽ được thực thi:

```groovy
defaultTasks 'clean', 'run'

task clean {
    doLast {
        println 'Default Cleaning!'
    }
}

task run {
    doLast {
        println 'Default Running!'
    }
}
```

Bản thân Gradle cũng tích hợp sẵn rất nhiều Task như `copy` (sao chép file), `delete` (xóa file):

```groovy
task deleteFile(type: Delete) {
    delete "C:\\Users\\guide\\Desktop\\test"
}
```

## Gradle Plugin

Gradle cung cấp một bộ cơ chế build cốt lõi, còn Gradle Plugin là những logic build cụ thể chạy trên cơ chế đó—về bản chất chúng giống với file `.gradle`. Bạn có thể xem Gradle Plugin như một công cụ đóng gói một chuỗi các Task và thực thi chúng.

Gradle Plugin chủ yếu được chia thành hai loại:

- **Script plugin**: Script plugin chỉ là một file kịch bản thông thường, có thể được import vào các script build khác.
- **Binary plugin / Object plugin**: Được định nghĩa trong một module plugin độc lập, các module khác áp dụng plugin thông qua Plugin ID. Vì cách này thuận tiện hơn nhiều cho việc phát hành và tái sử dụng, các Gradle Plugin mà chúng ta thường tiếp xúc nhìn chung đều ở dạng binary plugin.

Mặc dù Gradle Plugin và file `.gradle` về bản chất không có gì khác biệt, và file `.gradle` cũng có thể thực hiện chức năng tương tự Gradle Plugin, nhưng Gradle Plugin sử dụng một module độc lập để đóng gói logic build nên xét từ góc độ phát triển đến sử dụng, trải nghiệm tổng thể của Gradle Plugin vẫn tốt hơn:

- **Tái sử dụng logic**: Đưa cùng một logic cho nhiều dự án tương tự nhau tái sử dụng, giảm chi phí bảo trì lặp lại các logic giống nhau. Tất nhiên file `.gradle` cũng tái sử dụng logic được, nhưng tính đóng gói của Gradle Plugin tốt hơn;
- **Phát hành thành phần**: Có thể phát hành plugin lên Maven Repository để quản lý, các dự án khác có thể phụ thuộc thông qua Plugin ID. Tất nhiên file `.gradle` cũng có thể đặt ở một đường dẫn từ xa để các dự án khác tham chiếu;
- **Cấu hình build**: Gradle Plugin có thể khai báo plugin extension để mở ra các thuộc tính có thể cấu hình, cung cấp khả năng tùy biến. Tất nhiên file `.gradle` cũng làm được, nhưng cách triển khai sẽ rườm rà hơn.

## Vòng đời build Gradle (Build Lifecycle)

Vòng đời build của Gradle có ba giai đoạn: **Giai đoạn khởi tạo (Initialization)**, **Giai đoạn cấu hình (Configuration)** và **Giai đoạn thực thi (Execution)**.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/dadbdf59fccd9a2ebf60a2d018541e52-7b92535e.png)

Giữa giai đoạn khởi tạo và giai đoạn cấu hình, sau khi giai đoạn cấu hình kết thúc và sau khi giai đoạn thực thi kết thúc, chúng ta đều có thể chèn thêm các Hook tùy biến.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/5c297ccc4dac83229ff3e19caee9d1d2-7361439b.png)

### Giai đoạn khởi tạo (Initialization)

Gradle hỗ trợ build đơn dự án và đa dự án. Trong giai đoạn khởi tạo, Gradle xác định những dự án nào sẽ tham gia vào quá trình build và tạo ra một [đối tượng `Project`](https://docs.gradle.org/current/dsl/org.gradle.api.Project.html) cho mỗi dự án. Về bản chất chính là thực thi script `settings.gradle` để đọc xem toàn bộ dự án có bao nhiêu đối tượng `Project`.

### Giai đoạn cấu hình (Configuration)

Trong giai đoạn cấu hình, Gradle sẽ phân tích cú pháp file `build.gradle` của từng dự án, tạo tập con các task cần thực thi và xác định mối quan hệ giữa các task để giai đoạn thực thi chạy theo đúng thứ tự, đồng thời thực hiện một số cấu hình khởi tạo cho các task.

Mỗi file `build.gradle` tương ứng với một đối tượng `Project`; mã được chạy trong giai đoạn cấu hình bao gồm các câu lệnh, closure trong `build.gradle` cũng như các câu lệnh cấu hình bên trong Task.

Sau khi giai đoạn cấu hình kết thúc, Gradle sẽ tạo ra một **đồ thị có hướng không chu trình (DAG)** dựa trên quan hệ phụ thuộc của các Task.

### Giai đoạn thực thi (Execution)

Trong giai đoạn thực thi, Gradle dựa vào tập con các task đã được tạo và cấu hình ở giai đoạn cấu hình để tiến hành thực thi các task.

## Tài liệu tham khảo

- Tài liệu chính thức của Gradle: <https://docs.gradle.org/current/userguide/userguide.html>
- Hướng dẫn nhập môn Gradle: <https://www.imooc.com/wiki/gradlebase>
- Nhập môn nhanh Groovy chỉ cần đọc bài này là đủ: <https://cloud.tencent.com/developer/article/1358357>
- [Gradle] Giải thích chi tiết vòng đời của Gradle: <https://juejin.cn/post/7067719629874921508>
- Hướng dẫn từng bước tự tùy biến Gradle Plugin —— Series Gradle (2): <https://www.cnblogs.com/pengxurui/p/16281537.html>
- Cẩm nang tránh bẫy Gradle -- Hiểu về Plugin, Task và quy trình build: <https://juejin.cn/post/6889090530593112077>
