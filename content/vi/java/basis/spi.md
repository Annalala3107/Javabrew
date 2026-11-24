---
title: Giải thích chi tiết cơ chế Java SPI
description: "Phân tích toàn diện nguyên lý và ứng dụng của cơ chế Java SPI: hiểu rõ cơ chế service discovery của ServiceLoader, ứng dụng SPI trong JDBC/Dubbo/Spring, so sánh với API và các best practices."
category: Java
tag:
  - Java cơ bản
head:
  - - meta
    - name: keywords
      content: Java SPI,cơ chế SPI,ServiceLoader,service discovery,kiến trúc plugin,nạp driver JDBC,mở rộng Dubbo,ứng dụng SPI
lang: vi
sourceRef: zh-ref/java/basis/spi.md
---

> Bài viết này do [Kingshion](https://github.com/jjx0708) đóng góp. Hoan nghênh thêm nhiều bạn tham gia vào công tác duy trì JavaGuide — đây là một việc rất có ý nghĩa. Thông tin chi tiết vui lòng xem tại: [Hướng dẫn đóng góp JavaGuide](https://javaguide.cn/javaguide/contribution-guideline.html).

Thiết kế hướng đối tượng khuyến khích các module giao tiếp với nhau dựa trên interface thay vì implementation cụ thể, nhằm giảm mức độ gắn kết (coupling) giữa các module, tuân thủ nguyên lý đảo ngược phụ thuộc (Dependency Inversion Principle) và hỗ trợ nguyên lý đóng/mở (Open-Closed Principle — mở cho mở rộng, đóng cho sửa đổi). Tuy nhiên, việc phụ thuộc trực tiếp vào một implementation cụ thể sẽ dẫn đến phải sửa code khi thay thế implementation, vi phạm nguyên lý đóng/mở. Để giải quyết vấn đề này, SPI ra đời, cung cấp một cơ chế khám phá dịch vụ (service discovery) cho phép chỉ định linh hoạt implementation cụ thể từ bên ngoài chương trình. Tư tưởng này tương đồng với Inversion of Control (IoC), chuyển quyền kiểm soát việc lắp ráp thành phần ra bên ngoài ứng dụng.

Cơ chế SPI cũng giải quyết những hạn chế do Mô hình ủy quyền cha (Parent Delegation Model) trong hệ thống nạp lớp của Java mang lại. Mặc dù [Mô hình ủy quyền cha](https://javaguide.cn/java/jvm/classloader.html) đảm bảo tính bảo mật và tính nhất quán của thư viện lõi, nhưng nó lại hạn chế thư viện lõi hoặc thư viện mở rộng nạp các class nằm trên classpath của ứng dụng (thường do bên thứ ba triển khai). SPI cho phép thư viện lõi hoặc thư viện mở rộng định nghĩa service interface, các nhà phát triển bên thứ ba cung cấp và triển khai implementation, còn cơ chế nạp dịch vụ của SPI sẽ tự động phát hiện và nạp các implementation này tại runtime. Ví dụ, JDBC 4.0 trở đi sử dụng SPI để tự động phát hiện và nạp driver cơ sở dữ liệu; lập trình viên chỉ cần đặt file JAR driver vào classpath mà không cần dùng `Class.forName()` để nạp lớp driver một cách tường minh.

## Giới thiệu về SPI

### SPI là gì?

SPI là viết tắt của Service Provider Interface, nghĩa đen là "giao diện dành cho nhà cung cấp dịch vụ". Theo cách hiểu của mình, đây là một interface được cung cấp chuyên biệt cho các service provider hoặc các lập trình viên mở rộng chức năng của framework sử dụng.

SPI tách biệt service interface khỏi các service implementation cụ thể, giúp tách rời (decouple) bên gọi dịch vụ và bên cung cấp dịch vụ, nâng cao khả năng mở rộng và bảo trì của chương trình. Việc sửa đổi hoặc thay thế service implementation không đòi hỏi phải sửa đổi bên gọi.

Rất nhiều framework sử dụng cơ chế SPI của Java, ví dụ như: Spring framework, nạp driver cơ sở dữ liệu, interface logging, và cơ chế mở rộng của Dubbo, v.v.

<img src="/media/jg/ext/oss.javaguide.cn/java/basis/spi/22e1830e0b0e4115a882751f6c417857tplv-k3u1fbpfcp--cf39285f.jpg" style="zoom:50%;" />

### SPI và API khác nhau như thế nào?

**Vậy SPI và API có gì khác nhau?**

Nhắc đến SPI thì không thể không nhắc đến API (Application Programming Interface). Xét theo nghĩa rộng, cả hai đều thuộc về interface và rất dễ bị nhầm lẫn. Trước tiên hãy xem một hình minh họa bên dưới:

![So sánh SPI và API](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/spi-vs-api-b7a94519.png)

Thông thường các module giao tiếp với nhau thông qua interface, vì vậy ta đưa vào một "interface" giữa bên gọi dịch vụ và bên triển khai dịch vụ (còn gọi là service provider).

- Khi bên triển khai cung cấp cả interface lẫn implementation, chúng ta gọi vào interface của bên triển khai để sử dụng năng lực mà bên triển khai cung cấp — đó chính là **API**. Trong trường hợp này, cả interface và implementation đều nằm trong package của bên triển khai. Bên gọi sử dụng chức năng của bên triển khai thông qua interface mà không cần quan tâm tới chi tiết triển khai cụ thể.
- Khi interface nằm ở phía bên gọi, đó chính là **SPI**. Bên gọi interface xác định quy tắc của interface, sau đó các nhà cung cấp khác nhau triển khai interface này theo quy tắc đó để cung cấp dịch vụ.

Lấy một ví dụ dễ hiểu: Công ty H là một công ty công nghệ vừa thiết kế xong một con chip mới và nay cần sản xuất hàng loạt, trong khi trên thị trường có nhiều công ty sản xuất chip. Lúc này, chỉ cần công ty H quy định rõ tiêu chuẩn sản xuất con chip (định nghĩa xong chuẩn interface), thì các công ty sản xuất chip hợp tác (service provider) sẽ dựa theo tiêu chuẩn đó để bàn giao con chip mang đặc trưng riêng của mình (cung cấp các implementation với phương án khác nhau nhưng kết quả đầu ra là như nhau).

## Demo thực tế

SLF4J (Simple Logging Facade for Java) là một logging facade (interface) của Java, có nhiều implementation cụ thể như Logback, Log4j, Log4j2, v.v., và có thể chuyển đổi qua lại. Khi chuyển đổi implementation ghi log cụ thể, chúng ta không cần sửa code dự án, chỉ cần chỉnh sửa dependency Maven trong `pom.xml` là được.

![](/media/jg/ext/oss.javaguide.cn/java/basis/spi/image-20220723213306039-165858318917813-1623720d.png)

Điều này được hiện thực hóa nhờ cơ chế SPI. Tiếp theo, chúng ta sẽ tự xây dựng một logging framework phiên bản đơn giản.

### Service Provider Interface

Tạo một dự án Java mới `service-provider-interface` với cấu trúc thư mục như sau: (Lưu ý: chỉ cần tạo dự án Java thuần trực tiếp, không cần tạo dự án Maven; dự án Maven liên quan đến một số cấu hình biên dịch, nếu có private repository thì deploy trực tiếp sẽ tiện, còn nếu không có thì trong quá trình làm có thể gặp một số lỗi kỳ lạ.)

```plain
│  service-provider-interface.iml
│
├─.idea
│  │  .gitignore
│  │  misc.xml
│  │  modules.xml
│  └─ workspace.xml
│
└─src
    └─edu
        └─jiangxuan
            └─up
                └─spi
                        Logger.java
                        LoggerService.java
                        Main.class
```

Tạo interface `Logger` — đây chính là SPI (Service Provider Interface). Các service provider sau này sẽ triển khai dựa trên interface này.

```java
package edu.jiangxuan.up.spi;

public interface Logger {
    void info(String msg);
    void debug(String msg);
}
```

Tiếp theo là lớp `LoggerService`, lớp này chủ yếu cung cấp các chức năng cụ thể cho bên sử dụng dịch vụ (bên gọi). Lớp này cũng là mấu chốt để triển khai cơ chế Java SPI; nếu còn chỗ nào chưa rõ, bạn có thể tiếp tục đọc xuống phần sau.

```java
package edu.jiangxuan.up.spi;

import java.util.ArrayList;
import java.util.List;
import java.util.ServiceLoader;

public class LoggerService {
    private static final LoggerService SERVICE = new LoggerService();

    private final Logger logger;

    private final List<Logger> loggerList;

    private LoggerService() {
        ServiceLoader<Logger> loader = ServiceLoader.load(Logger.class);
        List<Logger> list = new ArrayList<>();
        for (Logger log : loader) {
            list.add(log);
        }
        // loggerList là danh sách toàn bộ ServiceProvider
        loggerList = list;
        if (!list.isEmpty()) {
            // logger chỉ lấy phần tử đầu tiên
            logger = list.get(0);
        } else {
            logger = null;
        }
    }

    public static LoggerService getService() {
        return SERVICE;
    }

    public void info(String msg) {
        if (logger == null) {
            System.out.println("info 中没有发现 Logger 服务提供者");
        } else {
            logger.info(msg);
        }
    }

    public void debug(String msg) {
        if (loggerList.isEmpty()) {
            System.out.println("debug 中没有发现 Logger 服务提供者");
        }
        loggerList.forEach(log -> log.debug(msg));
    }
}
```

Tạo lớp `Main` (bên sử dụng dịch vụ, bên gọi), chạy chương trình để xem kết quả.

```java
package org.spi.service;

public class Main {
    public static void main(String[] args) {
        LoggerService service = LoggerService.getService();

        service.info("Hello SPI");
        service.debug("Hello SPI");
    }
}
```

Kết quả chương trình:

> Không tìm thấy Logger service provider trong info
> Không tìm thấy Logger service provider trong debug

Lúc này chúng ta mới chỉ có interface rỗng, chưa cung cấp bất kỳ implementation nào cho interface `Logger`, nên kết quả in ra không hiển thị thông tin log như kỳ vọng.

Bạn có thể dùng dòng lệnh hoặc dùng trực tiếp IDEA để đóng gói toàn bộ chương trình thành file JAR.

### Service Provider

Tiếp theo tạo một dự án mới để triển khai interface `Logger`.

Tạo dự án `service-provider` với cấu trúc thư mục như sau:

```plain
│  service-provider.iml
│
├─.idea
│  │  .gitignore
│  │  misc.xml
│  │  modules.xml
│  └─ workspace.xml
│
├─lib
│      service-provider-interface.jar
|
└─src
    ├─edu
    │  └─jiangxuan
    │      └─up
    │          └─spi
    │              └─service
    │                      Logback.java
    │
    └─META-INF
        └─services
                edu.jiangxuan.up.spi.Logger

```

Tạo lớp `Logback`:

```java
package edu.jiangxuan.up.spi.service;

import edu.jiangxuan.up.spi.Logger;

public class Logback implements Logger {
    @Override
    public void info(String s) {
        System.out.println("Logback info 打印日志：" + s);
    }

    @Override
    public void debug(String s) {
        System.out.println("Logback debug 打印日志：" + s);
    }
}

```

Import file JAR `service-provider-interface` vào trong dự án.

Tạo thư mục `lib`, copy file JAR sang rồi thêm vào dự án.

![](/media/jg/ext/oss.javaguide.cn/java/basis/spi/523d5e25198444d3b112baf68ce49daetplv-k3u1fbpfcp--e9033589.png)

Sau đó nhấn OK.

![](/media/jg/ext/oss.javaguide.cn/java/basis/spi/f4ba0aa71e9b4d509b9159892a220850tplv-k3u1fbpfcp--5f2c8df8.png)

Tiếp theo bạn có thể import các class và phương thức trong file JAR vào dự án, giống hệt như cách import các lớp tiện ích của JDK.

Để triển khai interface `Logger`, tạo thư mục `META-INF/services` dưới thư mục `src`, sau đó tạo file `edu.jiangxuan.up.spi.Logger` (tên lớp đầy đủ của SPI). Nội dung bên trong file là: `edu.jiangxuan.up.spi.service.Logback` (tên lớp đầy đủ của `Logback`, tức tên package + tên class của lớp triển khai SPI).

**Đây là quy chuẩn đã được thỏa thuận sẵn của cơ chế JDK SPI `ServiceLoader`.**

Ở đây giải thích sơ qua trước: gọi `ServiceLoader.load()` sẽ tạo ra bộ nạp dịch vụ (service loader). Khi duyệt `ServiceLoader`, bộ nạp sẽ định vị và khởi tạo các provider theo nhu cầu; khi gọi `stream()`, kết quả trả về là một stream các `ServiceLoader.Provider`, cho phép kiểm tra kiểu của provider trước thông qua `type()`, và chỉ khi gọi `Provider.get()` mới lấy ra instance tương ứng của service provider. `ServiceLoader` sẽ cache lại các provider đã được nạp. Đối với các provider nằm trên classpath, file cấu hình đặt tại `META-INF/services`; đối với các named module từ Java 9 trở đi, còn có thể khai báo quan hệ dịch vụ thông qua `uses` và `provides ... with ...` trong module descriptor.

Vì vậy sẽ đặt ra một số yêu cầu chuẩn mực: tên file bắt buộc phải là tên lớp đầy đủ (fully qualified class name) của interface, còn nội dung bên trong bắt buộc phải là tên lớp đầy đủ của lớp triển khai; có thể có nhiều lớp triển khai, chỉ cần xuống dòng là được, khi có nhiều lớp triển khai thì chúng sẽ được duyệt và nạp lần lượt từng cái một.

Tiếp theo cũng đóng gói dự án `service-provider` thành file JAR — file JAR này chính là implementation của phía cung cấp dịch vụ. Thông thường khi ta thêm dependency `pom` của Maven cũng tương tự như thế này, chỉ có điều hiện tại ta chưa đẩy file JAR này lên Maven public repository, nên ở nơi cần dùng đành phải thêm thủ công vào dự án.

### Trình diễn kết quả

Để minh họa hiệu quả trực quan hơn, ở đây mình tạo thêm một dự án chuyên dùng để kiểm thử: `java-spi-test`.

Trước tiên import file JAR interface của `Logger`, sau đó import tiếp file JAR chứa lớp triển khai cụ thể.

![](/media/jg/ext/oss.javaguide.cn/java/basis/spi/image-20220723215812708-165858469599214-2951f8e6.png)

Tạo phương thức `main` để kiểm thử:

```java
package edu.jiangxuan.up.service;

import edu.jiangxuan.up.spi.LoggerService;

public class TestJavaSPI {
    public static void main(String[] args) {
        LoggerService loggerService = LoggerService.getService();
        loggerService.info("你好");
        loggerService.debug("测试Java SPI 机制");
    }
}
```

Kết quả chạy như sau:

> Logback info ghi log: Xin chào
> Logback debug ghi log: Kiểm thử cơ chế Java SPI

Điều này cho thấy lớp triển khai trong file JAR được import vào đã phát huy tác dụng.

Nếu chúng ta không import file JAR của lớp triển khai cụ thể, lúc này kết quả chạy chương trình sẽ là:

> Không tìm thấy Logger service provider trong info
> Không tìm thấy Logger service provider trong debug

Thông qua việc sử dụng cơ chế SPI, có thể thấy mức độ gắn kết (coupling) giữa dịch vụ (`LoggerService`) và service provider rất thấp. Nếu muốn đổi sang một implementation khác, thực chất chỉ cần chỉnh sửa implementation cụ thể cho interface `Logger` trong dự án `service-provider` là được, chỉ cần thay một file JAR, hoặc cũng có thể có nhiều implementation trong cùng một dự án — đây chẳng phải chính là nguyên lý của SLF4J hay sao?

Nếu một ngày nào đó yêu cầu thay đổi, lúc này cần xuất log ra message queue hoặc làm một số thao tác khác, thì hoàn toàn không cần sửa implementation của Logback, chỉ cần bổ sung một service implementation mới (`service-provider`) — có thể thêm trực tiếp implementation trong dự án hiện tại hoặc đưa từ bên ngoài vào một file JAR service implementation mới. Chúng ta có thể lựa chọn một service implementation (`service-provider`) cụ thể bên trong dịch vụ (`LoggerService`) để hoàn thành thao tác cần thiết.

Tiếp theo chúng ta sẽ đi sâu vào nguyên lý cốt lõi trong hoạt động của Java SPI — **ServiceLoader**.

## ServiceLoader

### Hiện thực cụ thể của ServiceLoader

> Dưới đây trình bày hiện thực của `ServiceLoader` trong JDK 8. Từ Java 9 trở đi đã bổ sung thêm module layer, `stream()`, `findFirst()` và provider method cùng các cơ chế khác, nên cấu trúc mã nguồn hiện tại đã khác.

Muốn sử dụng cơ chế SPI của Java thì cần dựa vào `ServiceLoader`, vậy tiếp theo hãy cùng xem cụ thể `ServiceLoader` làm những gì:

`ServiceLoader` là một lớp tiện ích do JDK cung cấp, nằm trong package `package java.util;`.

```plain
A facility to load implementations of a service.
```

Đây là chú thích chính thức của JDK: **một công cụ để nạp các implementation của một dịch vụ.**

Nhìn xuống tiếp, ta thấy lớp này có từ khóa `final`, nên không thể bị kế thừa để sửa đổi, đồng thời nó triển khai interface `Iterable`. Lý do nó triển khai iterator là để về sau ta có thể lấy ra các service implementation tương ứng thông qua việc duyệt (iteration).

```java
public final class ServiceLoader<S> implements Iterable<S>{ xxx...}
```

Có thể thấy một định nghĩa hằng số rất quen thuộc:

`private static final String PREFIX = "META-INF/services/";`

Dưới đây là phương thức `load`: có thể thấy `load` hỗ trợ hai dạng tham số nạp chồng (`Overload`):

```java
public static <S> ServiceLoader<S> load(Class<S> service) {
    ClassLoader cl = Thread.currentThread().getContextClassLoader();
    return ServiceLoader.load(service, cl);
}

public static <S> ServiceLoader<S> load(Class<S> service,
                                        ClassLoader loader) {
    return new ServiceLoader<>(service, loader);
}

private ServiceLoader(Class<S> svc, ClassLoader cl) {
    service = Objects.requireNonNull(svc, "Service interface cannot be null");
    loader = (cl == null) ? ClassLoader.getSystemClassLoader() : cl;
    acc = (System.getSecurityManager() != null) ? AccessController.getContext() : null;
    reload();
}

public void reload() {
    providers.clear();
    lookupIterator = new LazyIterator(service, loader);
}
```

Cơ chế giải quyết việc nạp lớp của bên thứ ba thực chất nằm ngay trong `ClassLoader cl = Thread.currentThread().getContextClassLoader();`, trong đó `cl` chính là **Thread Context ClassLoader** (ClassLoader ngữ cảnh của luồng). Đây là `ClassLoader` mà mỗi thread nắm giữ; thiết kế của JDK cho phép ứng dụng hoặc container (như Web Application Server) thiết lập `ClassLoader` này để thư viện lõi có thể thông qua nó nạp các class của ứng dụng.

Mặc định, Thread Context ClassLoader là Application ClassLoader, chịu trách nhiệm nạp các class trên classpath. Khi thư viện lõi cần nạp các class do ứng dụng cung cấp, nó có thể dùng Thread Context ClassLoader để thực hiện. Nhờ vậy, ngay cả mã nguồn thư viện lõi được nạp bởi Bootstrap ClassLoader vẫn có thể nạp và sử dụng các class được nạp bởi Application ClassLoader.

Theo thứ tự gọi code, trong phương thức `reload()` việc nạp được thực hiện thông qua một lớp nội bộ `LazyIterator`. Hãy tiếp tục xem xuống bên dưới.

Sau khi `ServiceLoader` triển khai các phương thức của interface `Iterable`, nó có khả năng duyệt. Khi phương thức `iterator` này được gọi, trước tiên nó sẽ tìm trong bộ nhớ đệm `providers` của `ServiceLoader`; nếu trong cache không có (cache miss) thì sẽ tìm kiếm thông qua `LazyIterator`.

```java

public Iterator<S> iterator() {
    return new Iterator<S>() {

        Iterator<Map.Entry<String, S>> knownProviders
                = providers.entrySet().iterator();

        public boolean hasNext() {
            if (knownProviders.hasNext())
                return true;
            return lookupIterator.hasNext(); // Gọi LazyIterator
        }

        public S next() {
            if (knownProviders.hasNext())
                return knownProviders.next().getValue();
            return lookupIterator.next(); // Gọi LazyIterator
        }

        public void remove() {
            throw new UnsupportedOperationException();
        }

    };
}
```

Khi gọi `LazyIterator`, hiện thực cụ thể như sau:

```java

public boolean hasNext() {
    if (acc == null) {
        return hasNextService();
    } else {
        PrivilegedAction<Boolean> action = new PrivilegedAction<Boolean>() {
            public Boolean run() {
                return hasNextService();
            }
        };
        return AccessController.doPrivileged(action, acc);
    }
}

private boolean hasNextService() {
    if (nextName != null) {
        return true;
    }
    if (configs == null) {
        try {
            // Kết hợp PREFIX (META-INF/services/) và tên lớp để lấy file cấu hình tương ứng và thu được các lớp triển khai cụ thể
            String fullName = PREFIX + service.getName();
            if (loader == null)
                configs = ClassLoader.getSystemResources(fullName);
            else
                configs = loader.getResources(fullName);
        } catch (IOException x) {
            fail(service, "Error locating configuration files", x);
        }
    }
    while ((pending == null) || !pending.hasNext()) {
        if (!configs.hasMoreElements()) {
            return false;
        }
        pending = parse(service, configs.nextElement());
    }
    nextName = pending.next();
    return true;
}


public S next() {
    if (acc == null) {
        return nextService();
    } else {
        PrivilegedAction<S> action = new PrivilegedAction<S>() {
            public S run() {
                return nextService();
            }
        };
        return AccessController.doPrivileged(action, acc);
    }
}

private S nextService() {
    if (!hasNextService())
        throw new NoSuchElementException();
    String cn = nextName;
    nextName = null;
    Class<?> c = null;
    try {
        c = Class.forName(cn, false, loader);
    } catch (ClassNotFoundException x) {
        fail(service,
                "Provider " + cn + " not found");
    }
    if (!service.isAssignableFrom(c)) {
        fail(service,
                "Provider " + cn + " not a subtype");
    }
    try {
        S p = service.cast(c.newInstance());
        providers.put(cn, p);
        return p;
    } catch (Throwable x) {
        fail(service,
                "Provider " + cn + " could not be instantiated",
                x);
    }
    throw new Error();          // This cannot happen
}
```

Có thể nhiều bạn nhìn đoạn này sẽ thấy hơi phức tạp. Không sao cả, ở đây mình đã tự cài đặt một mô hình `ServiceLoader` nhỏ đơn giản để minh họa ý tưởng cốt lõi của việc đọc tên lớp triển khai từ file cấu hình trên classpath và tạo instance. Nó không bao phủ đầy đủ các hành vi của bản JDK như nạp lười (lazy loading), khử trùng lặp, xử lý lỗi hay module provider:

### Tự cài đặt một ServiceLoader

Trước tiên mình dán code ra đây:

```java
package edu.jiangxuan.up.service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Constructor;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;

public class MyServiceLoader<S> {

    // Đối tượng Class tương ứng của interface
    private final Class<S> service;

    // Có thể có nhiều lớp triển khai, dùng List để chứa
    private final List<S> providers = new ArrayList<>();

    // ClassLoader
    private final ClassLoader classLoader;

    // Phương thức public cho bên ngoài gọi để bắt đầu quy trình nạp tùy chỉnh
    public static <S> MyServiceLoader<S> load(Class<S> service) {
        return new MyServiceLoader<>(service);
    }

    // Đặt constructor là private
    private MyServiceLoader(Class<S> service) {
        this.service = service;
        this.classLoader = Thread.currentThread().getContextClassLoader();
        doLoad();
    }

    // Phương thức then chốt: logic nạp các lớp triển khai cụ thể
    private void doLoad() {
        try {
            // Đọc các file dưới META-INF/services trong mọi file JAR; tên file là tên interface, nội dung bên trong là đường dẫn package và tên lớp đầy đủ của các lớp triển khai cụ thể
            Enumeration<URL> urls = classLoader.getResources("META-INF/services/" + service.getName());
            // Duyệt từng file lấy được
            while (urls.hasMoreElements()) {
                // Lấy ra file hiện tại
                URL url = urls.nextElement();
                System.out.println("File = " + url.getPath());
                // Mở kết nối
                URLConnection urlConnection = url.openConnection();
                urlConnection.setUseCaches(false);
                // Lấy input stream của file
                InputStream inputStream = urlConnection.getInputStream();
                // Tạo BufferedReader từ input stream của file
                BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
                // Lấy tên lớp đầy đủ của lớp triển khai từ nội dung file
                String className = bufferedReader.readLine();

                while (className != null) {
                    // Dùng Reflection lấy lớp triển khai
                    Class<?> clazz = Class.forName(className, false, classLoader);
                    // Nếu interface khai báo tương thích kiểu với lớp triển khai cụ thể này (có thể hiểu như tính đa hình trong Java: interface với lớp triển khai, lớp cha với lớp con...) thì khởi tạo instance
                    if (service.isAssignableFrom(clazz)) {
                        Constructor<? extends S> constructor = (Constructor<? extends S>) clazz.getConstructor();
                        S instance = constructor.newInstance();
                        // Thêm đối tượng vừa khởi tạo vào danh sách providers
                        providers.add(instance);
                    }
                    // Tiếp tục đọc lớp triển khai ở dòng tiếp theo; có thể có nhiều lớp triển khai, chỉ cần xuống dòng là được
                    className = bufferedReader.readLine();
                }
            }
        } catch (Exception e) {
            System.out.println("读取文件异常。。。");
        }
    }

    // Trả về danh sách các lớp triển khai cụ thể tương ứng với SPI interface
    public List<S> getProviders() {
        return providers;
    }
}
```

Các thông tin mấu chốt về cơ bản đã được mô tả thông qua các comment trong code.

Quy trình chính gồm:

1. Dùng công cụ `URL` để tìm file tương ứng trong thư mục `/META-INF/services` của các file JAR;
2. Dựa vào tên của file này để đối chiếu với SPI interface tương ứng;
3. Thông qua luồng `InputStream` để đọc ra tên lớp đầy đủ của các implementation cụ thể bên trong file;
4. Dựa vào tên lớp đầy đủ lấy được, kiểm tra trước xem có cùng kiểu với SPI interface hay không, nếu đúng thì thông qua cơ chế Reflection để khởi tạo đối tượng instance tương ứng;
5. Thêm đối tượng instance vừa khởi tạo vào danh sách `providers`.

## Tổng kết

Không khó để nhận ra rằng, cách hiện thực cụ thể của cơ chế SPI đòi hỏi phải định vị và khởi tạo các service provider một cách linh hoạt (dynamic). Các provider trên classpath cần được khai báo trong file cấu hình `META-INF/services/`; còn các provider trong named module thì được khai báo qua `provides ... with ...` trong module descriptor.

Ngoài ra, cơ chế SPI được ứng dụng trong rất nhiều framework: nguyên lý cơ bản của Spring framework cũng theo cách tương tự. Framework Dubbo cũng cung cấp cơ chế mở rộng SPI tương tự; chỉ có điều cách cài đặt cụ thể cơ chế SPI trong Dubbo và Spring có một vài khác biệt nhỏ so với những gì chúng ta học hôm nay, nhưng nguyên lý tổng thể là nhất quán. Tin rằng thông qua việc tìm hiểu cơ chế SPI trong JDK, mọi người có thể liên thông kiến thức và hiểu sâu hơn về các framework phức tạp khác.

Thông qua cơ chế SPI có thể nâng cao đáng kể tính linh hoạt trong thiết kế interface, nhưng cơ chế SPI cũng tồn tại một số nhược điểm, chẳng hạn như:

1. `ServiceLoader` nạp các provider theo cơ chế lazy loading; tuy nhiên nếu bên gọi duyệt qua toàn bộ các provider để chọn một implementation thì vẫn có thể phát sinh chi phí phụ trội;
2. Một instance `ServiceLoader` đơn lẻ không đảm bảo an toàn đa luồng (thread-safe); nếu cần chia sẻ giữa nhiều thread thì bên gọi phải tự thực hiện đồng bộ hóa (synchronization). Việc các instance `ServiceLoader` khác nhau cùng lúc gọi `load` sẽ không vì thế mà tất yếu gây ra xung đột đồng thời.
