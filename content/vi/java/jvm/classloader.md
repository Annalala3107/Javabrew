---
title: Giải thích chi tiết về ClassLoader (Trọng tâm)
description: "Giải thích chi tiết Java ClassLoader: phân tích sâu cơ chế nạp lớp của ClassLoader, nguyên lý Mô hình ủy quyền cha (Parent Delegation Model), Bootstrap/Platform/Application ClassLoader, cách triển khai ClassLoader tùy chỉnh và các tình huống phá vỡ ủy quyền cha."
category: Java
tag:
  - JVM
lang: vi
sourceRef: zh-ref/java/jvm/classloader.md
head:
  - - meta
    - name: keywords
      content: ClassLoader,Mô hình ủy quyền cha,Parent Delegation Model,quá trình nạp lớp,ClassLoader tùy chỉnh,phá vỡ ủy quyền cha
---

## Ôn lại quá trình Class Loading

Trước khi giới thiệu về ClassLoader và Mô hình ủy quyền cha (Parent Delegation Model), hãy cùng ôn lại ngắn gọn quá trình Class Loading.

- Quá trình Class Loading: **Loading (Nạp) -> Linking (Liên kết) -> Initialization (Khởi tạo)**.
- Quá trình Linking có thể chia tiếp thành 3 bước: **Verification (Xác minh) -> Preparation (Chuẩn bị) -> Resolution (Phân giải)**.

![Quá trình Class Loading](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/class-loading-procedure-a4b72893.png)

Loading là bước đầu tiên của quá trình Class Loading, chủ yếu hoàn thành 3 công việc dưới đây:

1. Dựa vào tên lớp đầy đủ (fully qualified class name) để lấy luồng byte nhị phân (binary byte stream) định nghĩa lớp này.
2. Chuyển đổi cấu trúc lưu trữ tĩnh do luồng byte biểu diễn thành cấu trúc dữ liệu runtime của Method Area.
3. Tạo ra một đối tượng `Class` đại diện cho lớp này trong bộ nhớ, đóng vai trò là điểm truy cập vào các dữ liệu đó trong Method Area.

## ClassLoader

### Giới thiệu về ClassLoader

ClassLoader đã xuất hiện từ JDK 1.0, ban đầu chỉ để đáp ứng nhu cầu của Java Applet (hiện đã bị loại bỏ). Về sau, nó dần trở thành một thành phần quan trọng trong chương trình Java, mang lại khả năng nạp động các lớp Java vào JVM và thực thi chúng.

Theo giới thiệu trong tài liệu API chính thức:

> A class loader is an object that is responsible for loading classes. The class ClassLoader is an abstract class. Given the binary name of a class, a class loader should attempt to locate or generate data that constitutes a definition for the class. A typical strategy is to transform the name into a file name and then read a "class file" of that name from a file system.
>
> Every Class object contains a reference to the ClassLoader that defined it.
>
> Class objects for array classes are not created by class loaders, but are created automatically as required by the Java runtime. The class loader for an array class, as returned by Class.getClassLoader() is the same as the class loader for its element type; if the element type is a primitive type, then the array class has no class loader.

Dịch đại ý sang tiếng Việt là:

> ClassLoader là một đối tượng chịu trách nhiệm nạp các lớp. `ClassLoader` là một lớp trừu tượng (abstract class). Khi được cung cấp tên nhị phân (binary name) của một lớp, ClassLoader sẽ cố gắng định vị hoặc sinh ra dữ liệu cấu thành định nghĩa của lớp đó. Chiến lược điển hình là chuyển đổi tên lớp thành tên tệp rồi đọc "tệp lớp" (class file) có tên đó từ hệ thống tệp.
>
> Mỗi lớp không phải mảng (non-array class) hoặc interface đều có một tham chiếu trỏ tới `ClassLoader` đã định nghĩa nó. Các lớp mảng (array class) không được tạo thông qua `ClassLoader` mà được JVM tự động tạo khi cần; ClassLoader của mảng kiểu tham chiếu trùng với ClassLoader của kiểu phần tử (element type) của nó, còn mảng kiểu nguyên thủy (primitive type) thì không có ClassLoader, `getClassLoader()` trả về `null`.

Từ phần giới thiệu trên có thể thấy:

- ClassLoader là một đối tượng chịu trách nhiệm nạp lớp, dùng để thực hiện bước Loading trong quá trình nạp lớp.
- Mỗi lớp không phải mảng hoặc interface đều ghi nhận `ClassLoader` đã định nghĩa ra nó.
- Lớp mảng không được tạo bởi `ClassLoader` (lớp mảng không có luồng byte nhị phân tương ứng) mà do JVM tạo trực tiếp; mảng kiểu tham chiếu kế thừa defining ClassLoader của kiểu phần tử, còn mảng kiểu nguyên thủy không có ClassLoader.

```java
class Class<T> {
  ...
  private final ClassLoader classLoader;
  @CallerSensitive
  public ClassLoader getClassLoader() {
     //...
  }
  ...
}
```

Nói một cách đơn giản, **vai trò chính của ClassLoader là nạp động bytecode của lớp Java (tệp `.class`) vào JVM (tạo ra một đối tượng `Class` đại diện cho lớp đó trong bộ nhớ).** Bytecode có thể được biên dịch từ mã nguồn Java (tệp `.java`) thông qua `javac`, cũng có thể được tạo động bằng công cụ hoặc tải về qua mạng.

Thực ra ngoài việc nạp lớp, ClassLoader còn có thể nạp các tài nguyên mà ứng dụng Java cần như văn bản, hình ảnh, tệp cấu hình, video và nhiều loại tệp tài nguyên khác. Bài viết này chỉ thảo luận chức năng cốt lõi của nó: nạp lớp.

### Quy tắc nạp lớp của ClassLoader

Khi JVM khởi động, nó sẽ không nạp toàn bộ tất cả các lớp cùng một lúc, mà nạp động tùy theo nhu cầu. Nghĩa là phần lớn các lớp chỉ được nạp khi thực sự dùng đến, như vậy sẽ thân thiện với bộ nhớ hơn.

Khi nạp lớp, `ClassLoader#loadClass` trước tiên sẽ gọi `findLoadedClass` để kiểm tra xem JVM đã ghi nhận ClassLoader hiện tại là initiating loader (bộ nạp khởi xướng) cho lớp tương ứng với tên nhị phân đó hay chưa; nếu tìm thấy sẽ trả về trực tiếp, ngược lại mới tiếp tục ủy quyền hoặc tìm kiếm. Một ClassLoader không thể định nghĩa trùng lặp hai lớp có cùng tên nhị phân.

```java
// Các trường và phương thức dưới đây trích từ cài đặt ClassLoader của JDK 8, chỉ dùng để minh họa cách ghi nhận của phiên bản đó
public abstract class ClassLoader {
  ...
  private final ClassLoader parent;
  // Các lớp được nạp bởi ClassLoader này.
  private final Vector<Class<?>> classes = new Vector<>();
  // Được VM gọi để ghi nhận mọi lớp đã nạp cùng với ClassLoader này.
  void addClass(Class<?> c) {
        classes.addElement(c);
   }
  ...
}
```

### Tổng kết các loại ClassLoader

Ba ClassLoader quan trọng thường gặp trong JDK 8 gồm:

1. **`BootstrapClassLoader` (Bootstrap ClassLoader)**: ClassLoader tích hợp sẵn ở tầng cao nhất của máy ảo, trong Java API thường được biểu diễn là `null` và không có ClassLoader cha. Trong HotSpot JDK 8, nó chủ yếu nạp thư viện lớp cốt lõi lúc chạy (như `rt.jar`) và các lớp trong đường dẫn do `-Xbootclasspath` chỉ định.
2. **`ExtensionClassLoader` (Extension ClassLoader)**: Chủ yếu chịu trách nhiệm nạp các gói JAR và lớp nằm trong thư mục `%JRE_HOME%/lib/ext`, cũng như toàn bộ các lớp trong đường dẫn được chỉ định bởi biến hệ thống `java.ext.dirs`.
3. **`AppClassLoader` (Application ClassLoader)**: ClassLoader hướng tới người dùng, chịu trách nhiệm nạp tất cả các gói JAR và lớp nằm trong classpath của ứng dụng hiện tại.

> 🌈 Mở rộng thêm:
>
> - **`rt.jar`**: `rt` là viết tắt của "RunTime". `rt.jar` là thư viện lớp nền tảng của Java, chứa các tệp lớp của toàn bộ những lớp mà bạn thấy trong Javadoc. Nghĩa là các gói thư viện tích hợp thường dùng như `java.xxx.*` đều nằm trong đó, ví dụ `java.util.*`, `java.io.*`, `java.nio.*`, `java.lang.*`, `java.sql.*`, `java.math.*`.
> - Sau khi Java 9 đưa vào hệ thống module (module system), `rt.jar` và cơ chế thư mục mở rộng không còn được sử dụng nữa, và Extension ClassLoader được thay thế bởi Platform ClassLoader. Bootstrap, Platform và Application ClassLoader lần lượt định nghĩa các runtime module khác nhau; không thể khái quát đơn giản rằng toàn bộ mọi module ngoài `java.base` đều do Platform ClassLoader nạp.

Ngoài 3 loại ClassLoader này, người dùng còn có thể tự thêm ClassLoader tùy chỉnh để mở rộng nhằm đáp ứng các nhu cầu đặc biệt. Chẳng hạn, chúng ta có thể mã hóa bytecode của lớp Java (tệp `.class`), rồi khi nạp sẽ dùng ClassLoader tùy chỉnh để giải mã.

![Sơ đồ phân cấp ClassLoader](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/class-loader-parents-delegation-model-48efa806.png)

Bootstrap ClassLoader được tích hợp sẵn trong máy ảo, thường được biểu diễn là `null` trong Java API. Platform ClassLoader, Application ClassLoader và các ClassLoader tùy chỉnh thông thường đều là thể hiện (instance) của `ClassLoader`. Nhờ đó người dùng có thể tự định nghĩa ClassLoader để ứng dụng quyết định cách lấy các lớp cần thiết.

Mỗi `ClassLoader` có thể lấy ClassLoader cha của nó thông qua `getParent()`; nếu `ClassLoader` lấy được là `null`, thì ClassLoader cha của ClassLoader đó chính là `BootstrapClassLoader`.

```java
public abstract class ClassLoader {
  ...
  // ClassLoader cha
  private final ClassLoader parent;
  @CallerSensitive
  public final ClassLoader getParent() {
     //...
  }
  ...
}
```

**Tại sao lớp do Bootstrap ClassLoader định nghĩa khi gọi `getClassLoader()` lại nhận về `null`?** Bởi vì Bootstrap ClassLoader là ClassLoader tích hợp sẵn bên trong JVM, quy ước của Java API thường dùng `null` để đại diện cho nó; ngôn ngữ cài đặt cụ thể của nó không nằm trong đặc tả Java.

Dưới đây là một ví dụ nhỏ về cách lấy `ClassLoader`:

```java
public class PrintClassLoaderTree {

    public static void main(String[] args) {

        ClassLoader classLoader = PrintClassLoaderTree.class.getClassLoader();

        StringBuilder split = new StringBuilder("|--");
        boolean needContinue = true;
        while (needContinue){
            System.out.println(split.toString() + classLoader);
            if(classLoader == null){
                needContinue = false;
            }else{
                classLoader = classLoader.getParent();
                split.insert(0, "\t");
            }
        }
    }

}
```

Kết quả đầu ra (JDK 8):

```plain
|--sun.misc.Launcher$AppClassLoader@18b4aac2
    |--sun.misc.Launcher$ExtClassLoader@53bd815b
        |--null
```

Từ kết quả đầu ra có thể thấy:

- `ClassLoader` của lớp Java `PrintClassLoaderTree` do chúng ta viết là `AppClassLoader`;
- `ClassLoader` cha của `AppClassLoader` là `ExtClassLoader`;
- `ClassLoader` cha của `ExtClassLoader` là `Bootstrap ClassLoader`, vì vậy kết quả in ra là `null`.

### ClassLoader tùy chỉnh

Như đã nói ở trên, ngoại trừ `BootstrapClassLoader`, tất cả các ClassLoader khác đều được viết bằng Java và kế thừa từ `java.lang.ClassLoader`. Nếu muốn tự tạo ClassLoader riêng, rõ ràng chúng ta cần kế thừa lớp trừu tượng `ClassLoader`.

Lớp `ClassLoader` có 2 phương thức then chốt:

- `protected Class loadClass(String name, boolean resolve)`: Nạp lớp có tên nhị phân chỉ định, nơi hiện thực cơ chế ủy quyền cha. `name` là tên nhị phân của lớp; nếu `resolve` là `true`, trong quá trình nạp sẽ gọi phương thức `resolveClass(Class<?> c)` để liên kết/phân giải lớp đó.
- `protected Class findClass(String name)`: Tìm kiếm lớp theo tên nhị phân; cài đặt mặc định sẽ ném trực tiếp ngoại lệ `ClassNotFoundException`.

Tài liệu API chính thức có viết:

> Subclasses of `ClassLoader` are encouraged to override `findClass(String name)`, rather than this method.
>
> Khuyến nghị các lớp con của `ClassLoader` ghi đè (`override`) phương thức `findClass(String name)` thay vì phương thức `loadClass(String name, boolean resolve)`.

Nếu không muốn phá vỡ Mô hình ủy quyền cha, ta chỉ cần ghi đè (`override`) phương thức `findClass()` trong lớp `ClassLoader`; những lớp mà ClassLoader cha không thể nạp cuối cùng sẽ được nạp thông qua phương thức này. Ngược lại, nếu muốn phá vỡ Mô hình ủy quyền cha thì cần ghi đè phương thức `loadClass()`.

## Mô hình ủy quyền cha (Parent Delegation Model)

### Giới thiệu về Mô hình ủy quyền cha

Có rất nhiều loại ClassLoader, vậy khi ta muốn nạp một lớp, cụ thể ClassLoader nào sẽ thực hiện nạp? Lúc này cần nhắc đến Mô hình ủy quyền cha (Parent Delegation Model).

Theo giới thiệu từ trang chủ chính thức:

> The ClassLoader class uses a delegation model to search for classes and resources. Each instance of ClassLoader has an associated parent class loader. When requested to find a class or resource, a ClassLoader instance will delegate the search for the class or resource to its parent class loader before attempting to find the class or resource itself. The virtual machine's built-in class loader, called the "bootstrap class loader", does not itself have a parent but may serve as the parent of a ClassLoader instance.

Dịch đại ý sang tiếng Việt là:

> Lớp `ClassLoader` sử dụng mô hình ủy quyền để tìm kiếm lớp và tài nguyên. Mỗi thể hiện của `ClassLoader` đều có một ClassLoader cha liên kết với nó. Khi được yêu cầu tìm một lớp hoặc tài nguyên, thể hiện `ClassLoader` sẽ ủy quyền nhiệm vụ tìm kiếm lớp hoặc tài nguyên đó cho ClassLoader cha của nó trước khi tự mình thử tìm kiếm.
> ClassLoader tích hợp sẵn trong máy ảo được gọi là "bootstrap class loader" bản thân nó không có ClassLoader cha, nhưng có thể đóng vai trò là ClassLoader cha của một thể hiện `ClassLoader`.

Từ phần giới thiệu trên có thể thấy:

- Lớp `ClassLoader` sử dụng mô hình ủy quyền để tìm kiếm lớp và tài nguyên.
- Mô hình ủy quyền cha yêu cầu ngoài Bootstrap ClassLoader ở tầng cao nhất ra, các ClassLoader còn lại đều phải có ClassLoader cha của riêng mình.
- Thể hiện `ClassLoader` sẽ ủy quyền nhiệm vụ tìm kiếm lớp hoặc tài nguyên cho ClassLoader cha trước khi tự mình thử tìm kiếm.

Mối quan hệ phân cấp giữa các ClassLoader khác nhau thể hiện trong sơ đồ dưới đây được gọi là "**Mô hình ủy quyền cha (Parents Delegation Model)**" của ClassLoader.

![Sơ đồ phân cấp ClassLoader](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/class-loader-parents-delegation-model-48efa806.png)

Lưu ý ⚠️: Mô hình ủy quyền cha không phải là một ràng buộc bắt buộc, mà chỉ là một cách làm được JDK khuyến nghị. Nếu vì một số nhu cầu đặc biệt mà chúng ta muốn phá vỡ Mô hình ủy quyền cha thì hoàn toàn có thể làm được; các phương pháp cụ thể sẽ được giới thiệu ở phần sau.

Thực ra cách dịch phổ biến trong tiếng Trung là "mô hình ủy quyền song thân" rất dễ khiến người khác hiểu nhầm, vì thông thường ta hiểu "song thân" là cả cha lẫn mẹ, nhưng từ này ở đây chỉ nhằm diễn đạt "thế hệ bậc cha mẹ" chứ không phải thực sự có một `MotherClassLoader` và một `FatherClassLoader`. Cá nhân mình thấy gọi là mô hình ủy quyền đơn phụ (single-parent delegation model) sẽ chuẩn hơn, nhưng vì cách gọi "song thân" đã lan truyền thành thông lệ nên dùng theo cũng không sao, miễn sao đừng hiểu nhầm là được.

Ngoài ra, mối quan hệ cha-con giữa các ClassLoader thường không được cài đặt bằng quan hệ kế thừa (inheritance), mà thường dùng quan hệ kết hợp (composition) để tái sử dụng mã nguồn của ClassLoader cha.

```java
public abstract class ClassLoader {
  ...
  // Kết hợp (Composition)
  private final ClassLoader parent;
  protected ClassLoader(ClassLoader parent) {
       this(checkCreateClassLoader(), parent);
  }
  ...
}
```

Trong Lập trình hướng đối tượng (OOP), có một nguyên tắc thiết kế rất kinh điển: **Ưu tiên kết hợp hơn kế thừa, dùng nhiều composition và hạn chế inheritance.**

### Quy trình thực thi của Mô hình ủy quyền cha

Logic chính của Mô hình ủy quyền cha tập trung trong phương thức `loadClass()` của `java.lang.ClassLoader`. Dưới đây là đoạn mã cài đặt liên quan trong JDK 8:

```java
protected Class<?> loadClass(String name, boolean resolve)
    throws ClassNotFoundException
{
    synchronized (getClassLoadingLock(name)) {
        // Trước tiên, kiểm tra xem lớp này đã được nạp hay chưa
        Class c = findLoadedClass(name);
        if (c == null) {
            // Nếu c là null, nghĩa là lớp này chưa từng được nạp
            long t0 = System.nanoTime();
            try {
                if (parent != null) {
                    // Khi ClassLoader cha khác null, ủy quyền qua parent.loadClass để nạp lớp
                    c = parent.loadClass(name, false);
                } else {
                    // Khi ClassLoader cha là null, gọi Bootstrap ClassLoader để nạp lớp
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // Ném ngoại lệ nếu ClassLoader cha khác null không tìm thấy lớp tương ứng
            }

            if (c == null) {
                // Khi ClassLoader cha không thể nạp, gọi findClass để nạp lớp đó
                // Người dùng có thể ghi đè phương thức này để tạo ClassLoader tùy chỉnh
                long t1 = System.nanoTime();
                c = findClass(name);

                // Dùng để thống kê các thông số liên quan đến ClassLoader
                sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                sun.misc.PerfCounter.getFindClasses().increment();
            }
        }
        if (resolve) {
            // Thực hiện thao tác link đối với lớp
            resolveClass(c);
        }
        return c;
    }
}
```

Mỗi khi một ClassLoader nhận được yêu cầu nạp lớp, nó sẽ chuyển tiếp yêu cầu đó lên ClassLoader cha trước. Chỉ trong trường hợp ClassLoader cha không tìm thấy lớp được yêu cầu thì ClassLoader này mới tự mình thử nạp.

Kết hợp với mã nguồn trên, có thể tóm tắt ngắn gọn quy trình thực thi của Mô hình ủy quyền cha như sau:

- Khi nạp lớp, hệ thống trước hết sẽ kiểm tra xem lớp hiện tại đã được nạp chưa. Lớp đã được nạp sẽ được trả về trực tiếp, nếu chưa mới thử nạp (mỗi ClassLoader cha đều đi qua quy trình này).
- Khi tiến hành nạp lớp, ClassLoader ban đầu không tự mình thử nạp ngay, mà ủy quyền yêu cầu này cho ClassLoader cha thực hiện (gọi phương thức `loadClass()` của ClassLoader cha để nạp lớp). Như vậy, mọi yêu cầu cuối cùng đều sẽ được chuyển tới `BootstrapClassLoader` ở tầng cao nhất.
- Chỉ khi ClassLoader cha phản hồi rằng không thể hoàn thành yêu cầu nạp này (không tìm thấy lớp cần thiết trong phạm vi tìm kiếm của nó) thì ClassLoader con mới tự mình thử nạp (gọi phương thức `findClass()` của chính nó để nạp lớp).
- Nếu ClassLoader con cũng không nạp được lớp này, nó sẽ ném ra ngoại lệ `ClassNotFoundException`.

🌈 Mở rộng thêm:

**Quy tắc cụ thể để JVM xác định hai lớp Java có giống nhau hay không**: JVM không chỉ xem tên đầy đủ của lớp có giống nhau hay không, mà còn xem ClassLoader đã nạp lớp đó có giống nhau hay không. Chỉ khi cả hai yếu tố đều giống nhau thì hai lớp mới được coi là cùng một lớp. Ngay cả khi hai lớp cùng xuất phát từ một tệp `Class` duy nhất và được nạp bởi cùng một máy ảo, chỉ cần ClassLoader nạp chúng khác nhau thì hai lớp đó chắc chắn không giống nhau.

### Lợi ích của Mô hình ủy quyền cha

Mô hình ủy quyền cha là một thành phần quan trọng của cơ chế nạp lớp trong Java. Việc ưu tiên ClassLoader cha giúp mã nguồn trong cùng chuỗi ủy quyền tái sử dụng được các kiểu dữ liệu đã được ClassLoader cha định nghĩa và giảm nguy cơ mã ứng dụng giả mạo API nền tảng; tuy nhiên nó không ngăn cản các ClassLoader độc lập với nhau định nghĩa riêng các lớp trùng tên.

Căn cứ để JVM phân biệt kiểu dữ liệu lúc runtime bao gồm tên nhị phân của lớp hoặc interface cùng với ClassLoader đã định nghĩa ra nó. Mô hình ủy quyền cha giúp các lớp nền tảng được ưu tiên định nghĩa bởi ClassLoader tích hợp tương ứng, nhưng không phải mọi API cốt lõi hoặc nền tảng đều do Bootstrap ClassLoader nạp: từ JDK 9 trở đi còn có Platform ClassLoader chịu trách nhiệm định nghĩa các lớp nền tảng.

Ví dụ, JVM sẽ ưu tiên giao yêu cầu nạp các lớp cốt lõi như `java.lang.Object` cho `BootstrapClassLoader` xử lý; nhưng trên thực tế, `ClassLoader#preDefineClass` còn kiểm tra tên lớp ở giai đoạn định nghĩa, bất kỳ tên lớp nào bắt đầu bằng `java.` đều sẽ bị từ chối, do đó không thể giả mạo lớp cốt lõi thông qua ClassLoader tùy chỉnh.

Nhiều bạn sẽ thắc mắc: "Vậy tôi đi vòng qua Mô hình ủy quyền cha chẳng phải được sao?".

Tuy nhiên, ngay cả khi kẻ tấn công đi vòng qua Mô hình ủy quyền cha, Java vẫn có cơ chế bảo mật ở tầng sâu hơn để bảo vệ thư viện lớp cốt lõi. Phương thức `preDefineClass` của `ClassLoader` sẽ kiểm tra tính hợp lệ của tên lớp trước khi định nghĩa lớp. Bất kỳ tên lớp nào bắt đầu bằng `"java."` đều sẽ kích hoạt `SecurityException`, ngăn chặn mã độc định nghĩa hoặc nạp lớp cốt lõi giả mạo.

Mã nguồn phương thức `ClassLoader#preDefineClass` trong JDK 8 như sau:

```java
private ProtectionDomain preDefineClass(String name,
                                            ProtectionDomain pd)
    {
        // Kiểm tra tên lớp có hợp lệ không
        if (!checkName(name)) {
            throw new NoClassDefFoundError("IllegalName: " + name);
        }

        // Ngăn chặn việc định nghĩa lớp trong package "java.*".
        // Kiểm tra này tối quan trọng cho bảo mật, vì nó ngăn mã độc thay thế các lớp Java cốt lõi.
        // JDK 9 tận dụng Platform ClassLoader để tăng cường bảo mật cho phương thức preDefineClass
        if ((name != null) && name.startsWith("java.")) {
            throw new SecurityException
                ("Prohibited package name: " +
                 name.substring(0, name.lastIndexOf('.')));
        }

         // Nếu không chỉ định ProtectionDomain, sử dụng domain mặc định (defaultDomain).
        if (pd == null) {
            pd = defaultDomain;
        }

        if (name != null) {
            checkCerts(name, pd.getCodeSource());
        }

        return pd;
    }
```

JDK 9 đã đưa vào Platform ClassLoader, có thể lấy thông qua `ClassLoader.getPlatformClassLoader()`. Hạn chế của `defineClass` đối với tên package `java.*` vẫn tồn tại, nhưng mã cài đặt cụ thể khác với JDK 8.

### Cách phá vỡ Mô hình ủy quyền cha

~~Để tránh cơ chế ủy quyền cha, chúng ta có thể tự định nghĩa một ClassLoader rồi ghi đè `loadClass()` là được.~~

**🐛 Đính chính (xem: [issue871](https://github.com/Snailclimb/JavaGuide/issues/871))**: Khi viết ClassLoader tùy chỉnh, cần kế thừa `ClassLoader`. Nếu không muốn phá vỡ Mô hình ủy quyền cha thì chỉ cần ghi đè phương thức `findClass()` trong lớp `ClassLoader`, những lớp không được ClassLoader cha nạp cuối cùng sẽ được nạp qua phương thức này. Nhưng nếu muốn phá vỡ Mô hình ủy quyền cha thì cần phải ghi đè phương thức `loadClass()`.

Tại sao ghi đè phương thức `loadClass()` lại phá vỡ được Mô hình ủy quyền cha? Quy trình thực thi của Mô hình ủy quyền cha đã giải thích rõ:

> Khi tiến hành nạp lớp, ClassLoader ban đầu không tự mình thử nạp ngay, mà ủy quyền yêu cầu này cho ClassLoader cha thực hiện (gọi phương thức `loadClass()` của ClassLoader cha để nạp lớp).

Sau khi ghi đè phương thức `loadClass()`, ta có thể thay đổi quy trình thực thi của Mô hình ủy quyền cha truyền thống. Ví dụ, ClassLoader con có thể tự thử nạp lớp trước khi ủy quyền cho ClassLoader cha, hoặc thử nạp từ nơi khác sau khi ClassLoader cha trả về. Quy tắc cụ thể do chính chúng ta cài đặt, tùy chỉnh theo nhu cầu dự án.

Máy chủ Tomcat khá quen thuộc với chúng ta để có thể ưu tiên nạp các lớp trong thư mục ứng dụng Web rồi mới nạp các lớp ở thư mục khác đã tự định nghĩa ClassLoader `WebAppClassLoader` nhằm phá vỡ cơ chế ủy quyền cha. Đây cũng chính là nguyên lý cụ thể giúp cách ly lớp giữa các ứng dụng Web trong Tomcat.

Cấu trúc phân cấp ClassLoader của Tomcat như sau:

![Cấu trúc phân cấp ClassLoader của Tomcat](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/tomcat-class-loader-parents-delegation-model-0938e048.png)

Tomcat hiện đại mặc định sử dụng cấu trúc phân cấp `Bootstrap -> System -> Common -> WebappX`. Vị trí tìm kiếm của từng ClassLoader như sau:

- Vị trí tìm kiếm của `Common` được cấu hình bởi `common.loader` trong `$CATALINA_BASE/conf/catalina.properties`, mặc định chủ yếu bao gồm `$CATALINA_BASE/lib` và `$CATALINA_HOME/lib`.
- Mỗi ClassLoader `WebappX` chịu trách nhiệm cho `/WEB-INF/classes` và `/WEB-INF/lib/*.jar` của ứng dụng Web tương ứng.
- Hai ClassLoader `Server` và `Shared` mặc định không được định nghĩa; chúng chỉ xuất hiện trong cấu trúc phân cấp phức tạp hơn khi cấu hình `server.loader` hoặc `shared.loader`.

Từ quan hệ ủy quyền trong sơ đồ có thể thấy:

- Các lớp mà ClassLoader `Common` nhìn thấy có thể được dùng chung bởi các thành phần nội bộ của Tomcat và toàn bộ ứng dụng Web.
- Nếu được cấu hình tường minh, `Server` chỉ hiển thị với nội bộ Tomcat, còn `Shared` hiển thị với toàn bộ ứng dụng Web. Cấu hình mặc định không có hai ClassLoader này, ClassLoader của ứng dụng Web lấy trực tiếp `Common` làm ClassLoader cha.
- Mỗi ứng dụng Web đều tạo một `WebAppClassLoader` riêng biệt và thiết lập Thread Context ClassLoader cho Thread khởi chạy ứng dụng Web đó thành `WebAppClassLoader`. Các thể hiện `WebAppClassLoader` tách biệt lẫn nhau, qua đó thực hiện cách ly lớp giữa các ứng dụng Web.

Chỉ dựa vào ClassLoader tùy chỉnh đơn thuần không thể đáp ứng yêu cầu của một số tình huống; ví dụ, trong một số trường hợp, ClassLoader tầng cao cần nạp những lớp mà chỉ ClassLoader tầng thấp mới có thể nạp được.

Chẳng hạn trong SPI, các interface của SPI (như `java.sql.Driver`) được cung cấp bởi thư viện lõi Java và do `BootstrapClassLoader` nạp. Trong khi đó, các bản cài đặt SPI (như `com.mysql.cj.jdbc.Driver`) lại do nhà cung cấp bên thứ ba cung cấp, được nạp bởi Application ClassLoader hoặc ClassLoader tùy chỉnh. Theo mặc định, một lớp và các lớp phụ thuộc của nó được nạp bởi cùng một ClassLoader. Do đó, ClassLoader đã nạp interface của SPI (`BootstrapClassLoader`) cũng sẽ được dùng để nạp lớp cài đặt của SPI. Theo Mô hình ủy quyền cha, `BootstrapClassLoader` không thể tìm thấy lớp cài đặt SPI vì nó không thể ủy quyền xuống ClassLoader con để thử nạp.

Cần lưu ý ở đây: sau khi JDK 9+ đưa vào hệ thống module, JDBC API được tách vào module `java.sql`, không còn do `BootstrapClassLoader` nạp trực tiếp nữa mà do `PlatformClassLoader` nạp.

```java
public class ClassLoaderTest {
    public static void main(String[] args) throws ClassNotFoundException {
        Class<?> clazz = Class.forName("java.sql.Driver");
        ClassLoader loader = clazz.getClassLoader();
        System.out.println("Loader for java.sql.Driver: " + loader);

        // Trong môi trường .jdks/corretto-1.8.0_442/bin/java kết quả là Loader for java.sql.Driver: null

        // Trong môi trường .jdks/jbr-17.0.12/bin/java kết quả là Loader for java.sql.Driver: jdk.internal.loader.ClassLoaders$PlatformClassLoader@30f39991
    }
}
```

Thêm một ví dụ khác: giả sử dự án của chúng ta có các gói JAR của Spring, vì được dùng chung giữa các ứng dụng Web nên chúng sẽ do `SharedClassLoader` nạp (với Web server là Tomcat). Trong dự án có một số lớp nghiệp vụ sử dụng Spring, chẳng hạn implement các interface do Spring cung cấp hoặc dùng các annotation của Spring. Do vậy, ClassLoader đã nạp Spring (tức `SharedClassLoader`) cũng sẽ được dùng để nạp các lớp nghiệp vụ này. Nhưng các lớp nghiệp vụ nằm trong thư mục của ứng dụng Web, không thuộc đường dẫn nạp của `SharedClassLoader`, nên `SharedClassLoader` không tìm thấy chúng và cũng không thể nạp chúng.

Làm thế nào để giải quyết vấn đề này? Lúc này cần dùng đến **Thread Context ClassLoader (`ThreadContextClassLoader`)**.

Lấy chính ví dụ Spring ở trên: khi Spring cần nạp các lớp nghiệp vụ, nó không dùng ClassLoader của chính mình mà dùng Thread Context ClassLoader của Thread hiện tại. Bạn còn nhớ điều chúng ta vừa nói ở trên chứ? Mỗi ứng dụng Web đều tạo một `WebAppClassLoader` riêng biệt và thiết lập Thread Context ClassLoader của Thread khởi chạy ứng dụng Web đó thành `WebAppClassLoader`. Nhờ vậy, ClassLoader tầng cao (`SharedClassLoader`) có thể mượn ClassLoader con (`WebAppClassLoader`) để nạp các lớp nghiệp vụ, phá vỡ cơ chế ủy quyền nạp lớp của Java và cho phép ứng dụng sử dụng ClassLoader theo chiều ngược lại.

Nguyên lý của Thread Context ClassLoader là lưu một ClassLoader vào dữ liệu riêng của Thread, gắn với Thread đó, rồi lấy ra dùng khi cần. ClassLoader này thường do ứng dụng hoặc container (như Tomcat) thiết lập.

`getContextClassLoader()` và `setContextClassLoader(ClassLoader cl)` trong `java.lang.Thread` lần lượt dùng để lấy và thiết lập Thread Context ClassLoader cho Thread. Nếu không thiết lập thông qua `setContextClassLoader(ClassLoader cl)`, Thread sẽ kế thừa Thread Context ClassLoader từ Thread cha của nó.

Mã nguồn Spring lấy Thread Context ClassLoader như sau:

```java
cl = Thread.currentThread().getContextClassLoader();
```

Nếu bạn quan tâm có thể tự nghiên cứu sâu hơn nguyên lý Tomcat phá vỡ Mô hình ủy quyền cha, tài liệu gợi ý: [Phân tích chuyên sâu Tomcat & Jetty](http://gk.link/a/10Egr).

## Đọc thêm

- *Phân tích chuyên sâu Java Virtual Machine*
- Phân tích chuyên sâu nguyên lý Java ClassLoader: <https://blog.csdn.net/xyang81/article/details/7292380>
- Java ClassLoader: <http://gityuan.com/2016/01/24/java-classloader/>
- Class Loaders in Java: <https://www.baeldung.com/java-classloaders>
- Class ClassLoader - Tài liệu chính thức của Oracle: <https://docs.oracle.com/javase/8/docs/api/java/lang/ClassLoader.html>
- Java ClassLoader khó nhằn — Không hiểu ngay bây giờ là muộn đấy: <https://zhuanlan.zhihu.com/p/51374915>
