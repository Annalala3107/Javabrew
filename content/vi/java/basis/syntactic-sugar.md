---
title: Giải thích chi tiết Java Syntactic Sugar
description: "Phân tích chuyên sâu nguyên lý Java Syntactic Sugar: giải thích cơ chế biên dịch của autoboxing/unboxing, xóa kiểu generics, vòng lặp for-each, varargs, enum, lambda và các syntactic sugar khác nhằm tránh bẫy sử dụng."
category: Java
tag:
  - Java cơ bản
head:
  - - meta
    - name: keywords
      content: Java syntactic sugar,autoboxing và unboxing,xóa kiểu generics,vòng lặp for-each,varargs,enum,inner class,biểu thức lambda,nguyên lý syntactic sugar
lang: vi
sourceRef: zh-ref/java/basis/syntactic-sugar.md
---

> Tác giả: Hollis
>
> Bài viết gốc: <https://mp.weixin.qq.com/s/o4XdEMq1DL-nBS-f8Za5Aw>

Syntactic Sugar là một chủ đề rất thường gặp trong các buổi phỏng vấn Java ở các công ty công nghệ lớn.

Bài viết này tiếp cận từ góc độ nguyên lý biên dịch Java, đi sâu vào bytecode và file `.class`, bóc tách từng lớp để tìm hiểu nguyên lý và cách sử dụng các Syntactic Sugar trong Java, giúp các bạn vừa biết cách sử dụng vừa nắm được nguyên lý đằng sau chúng.

## Syntactic Sugar là gì?

**Syntactic Sugar (cú pháp rút gọn)**, còn gọi là cú pháp bọc đường, là một thuật ngữ do nhà khoa học máy tính người Anh Peter.J.Landin đặt ra, chỉ một loại cú pháp được thêm vào ngôn ngữ lập trình; cú pháp này không làm thay đổi chức năng của ngôn ngữ nhưng giúp lập trình viên sử dụng thuận tiện hơn. Nói ngắn gọn, Syntactic Sugar làm cho chương trình súc tích và dễ đọc hơn.

![](/media/jg/ext/oss.javaguide.cn/java/basis/syntactic-sugar/image-20220818175953954-6d27291c.png)

> Thú vị là trong lĩnh vực lập trình, ngoài Syntactic Sugar còn có khái niệm Syntactic Salt (muối cú pháp) và Syntactic Saccharin (đường hóa học cú pháp); do khuôn khổ bài viết có hạn nên xin không mở rộng thêm ở đây.

Hầu hết các ngôn ngữ lập trình quen thuộc với chúng ta đều có Syntactic Sugar. Theo tác giả, số lượng Syntactic Sugar là một trong những tiêu chí để đánh giá một ngôn ngữ có đủ "xịn" hay không. Nhiều người nói Java là một "ngôn ngữ ít đường (low-sugar)", thực tế từ Java 7 trở đi Java ở cấp độ ngôn ngữ đã liên tục bổ sung nhiều loại "đường", chủ yếu được phát triển trong dự án "Project Coin". Dù hiện tại vẫn có người cho rằng Java còn ít đường, nhưng trong tương lai nó sẽ tiếp tục tiến theo hướng "nhiều đường (high-sugar)".

## Java có những loại Syntactic Sugar phổ biến nào?

Như đã đề cập ở trên, sự tồn tại của Syntactic Sugar chủ yếu nhằm tạo thuận tiện cho lập trình viên. Nhưng thực chất, **Java Virtual Machine (JVM) không trực tiếp hỗ trợ các Syntactic Sugar này. Trong giai đoạn biên dịch, các Syntactic Sugar sẽ được hoàn nguyên về cấu trúc cú pháp cơ bản đơn giản — quá trình này gọi là desugaring (giải mã syntactic sugar).**

Nói đến biên dịch, chắc hẳn ai cũng biết trong Java, lệnh `javac` có thể biên dịch file mã nguồn đuôi `.java` thành bytecode đuôi `.class` chạy được trên JVM. Nếu xem mã nguồn của `com.sun.tools.javac.main.JavaCompiler`, bạn sẽ thấy trong `compile()` có một bước gọi `desugar()` — phương thức này chính là nơi hiện thực việc giải mã syntactic sugar.

Các Syntactic Sugar thường dùng nhất trong Java chủ yếu gồm Generics, tham số có độ dài thay đổi (varargs), biên dịch có điều kiện, autoboxing/unboxing, inner class, v.v. Bài viết này chủ yếu phân tích nguyên lý đằng sau các Syntactic Sugar này, từng bước bóc lớp vỏ đường để xem bản chất của chúng.

Ở đây chúng ta sẽ sử dụng [dịch ngược (decompilation)](https://mp.weixin.qq.com/s?__biz=MzI3NzE0NjcwMg==&mid=2650120609&idx=1&sn=5659f96310963ad57d55b48cee63c788&chksm=f36bbc80c41c3596a1e4bf9501c6280481f1b9e06d07af354474e6f3ed366fef016df673a7ba&scene=21#wechat_redirect); bạn có thể dịch ngược file Class trực tuyến thông qua [Decompilers online](http://www.javadecompilers.com/).

### switch hỗ trợ String và Enum

Như đã đề cập trước đó, bắt đầu từ Java 7, Syntactic Sugar trong ngôn ngữ Java dần phong phú hơn, trong đó một điểm quan trọng là từ Java 7 `switch` bắt đầu hỗ trợ `String`.

Trước khi bắt đầu xin phổ cập qua một chút: `switch` của Java thời kỳ đầu hỗ trợ `byte`, `short`, `char`, `int` cùng các lớp wrapper tương ứng, và không hỗ trợ `boolean`, `long`, `float`, `double`. `char` biểu diễn một đơn vị mã UTF-16 chứ không phải kiểu ASCII. Về sau, Java bổ sung thêm hỗ trợ cho các kiểu tham chiếu như enum và `String`.

Vậy hãy cùng xem cách `switch` hỗ trợ `String` với đoạn code sau:

```java
public class switchDemoString {
    public static void main(String[] args) {
        String str = "world";
        switch (str) {
        case "hello":
            System.out.println("hello");
            break;
        case "world":
            System.out.println("world");
            break;
        default:
            break;
        }
    }
}
```

Nội dung sau khi dịch ngược như sau:

```java
public class switchDemoString
{
    public switchDemoString()
    {
    }
    public static void main(String args[])
    {
        String str = "world";
        String s;
        switch((s = str).hashCode())
        {
        default:
            break;
        case 99162322:
            if(s.equals("hello"))
                System.out.println("hello");
            break;
        case 113318802:
            if(s.equals("world"))
                System.out.println("world");
            break;
        }
    }
}
```

Từ đoạn code được sinh ra bởi phiên bản `javac` cụ thể này và dịch ngược lại, có thể thấy **`switch` trên chuỗi được chuyển đổi thành phân nhánh theo `hashCode()` và kiểm tra xác thực bằng `equals()`.** Đây là chiến lược cài đặt của trình biên dịch, không phải dạng bytecode bắt buộc do JLS quy định.

Nhìn kỹ có thể thấy việc thực hiện `switch` thực chất là trên giá trị băm (hash value), rồi sau đó dùng phương thức `equals` để kiểm tra an toàn; bước kiểm tra này là cần thiết vì có thể xảy ra xung đột băm (Hash Collision). Do đó hiệu năng của nó không bằng việc dùng enum trong `switch` hay dùng hằng số nguyên thuần túy, nhưng cũng không hề tệ.

### Generics

Chúng ta đều biết nhiều ngôn ngữ hỗ trợ Generics, nhưng điều nhiều người chưa biết là các trình biên dịch khác nhau xử lý Generics theo những cách khác nhau. Thông thường, một trình biên dịch có hai cách xử lý Generics: `Code specialization` và `Code sharing`. C++ và C# sử dụng cơ chế `Code specialization`, còn Java sử dụng cơ chế `Code sharing`.

> Cách tiếp cận `Code sharing` tạo ra một biểu diễn bytecode duy nhất cho mỗi kiểu generic và ánh xạ mọi instance của kiểu generic đó vào biểu diễn bytecode duy nhất này. Việc ánh xạ nhiều instance kiểu generic khác nhau về một biểu diễn bytecode duy nhất được thực hiện thông qua Xóa kiểu (`type erasure`).

Nói cách khác, **đối với Java Virtual Machine, nó hoàn toàn không nhận biết được cú pháp như `Map<String, String> map`. Cần phải giải mã syntactic sugar thông qua xóa kiểu (`Type Erasure`) trong giai đoạn biên dịch.**

Quá trình chính của xóa kiểu như sau: 1. Thay thế toàn bộ tham số generic bằng kiểu giới hạn ngoài cùng bên trái (kiểu cha cao nhất). 2. Loại bỏ toàn bộ tham số kiểu.

Đoạn code dưới đây:

```java
Map<String, String> map = new HashMap<String, String>();
map.put("name", "hollis");
map.put("wechat", "Hollis");
map.put("blog", "www.hollischuang.com");
```

Sau khi desugar sẽ trở thành:

```java
Map map = new HashMap();
map.put("name", "hollis");
map.put("wechat", "Hollis");
map.put("blog", "www.hollischuang.com");
```

Đoạn code dưới đây:

```java
public static <A extends Comparable<A>> A max(Collection<A> xs) {
    Iterator<A> xi = xs.iterator();
    A w = xi.next();
    while (xi.hasNext()) {
        A x = xi.next();
        if (w.compareTo(x) < 0)
            w = x;
    }
    return w;
}
```

Sau khi xóa kiểu sẽ trở thành:

```java
 public static Comparable max(Collection xs){
    Iterator xi = xs.iterator();
    Comparable w = (Comparable)xi.next();
    while(xi.hasNext())
    {
        Comparable x = (Comparable)xi.next();
        if(w.compareTo(x) < 0)
            w = x;
    }
    return w;
}
```

**Trong máy ảo JVM không tồn tại Generics, chỉ có các lớp thông thường và phương thức thông thường; mọi tham số kiểu của lớp generic đều bị xóa lúc biên dịch, và lớp generic không có đối tượng `Class` riêng biệt của chính nó. Ví dụ không hề tồn tại `List<String>.class` hay `List<Integer>.class`, mà chỉ có `List.class`.**

### Autoboxing và Unboxing

Autoboxing là việc Java tự động chuyển đổi giá trị kiểu nguyên thủy (primitive type) thành đối tượng tương ứng, ví dụ chuyển biến `int` thành đối tượng `Integer`, quá trình này gọi là boxing; ngược lại, chuyển đối tượng `Integer` thành giá trị kiểu `int` gọi là unboxing. Vì việc boxing và unboxing ở đây diễn ra tự động mà không cần lập trình viên tự chuyển đổi thủ công, nên gọi là autoboxing và unboxing. Các kiểu nguyên thủy `byte`, `short`, `char`, `int`, `long`, `float`, `double` và `boolean` có các lớp wrapper tương ứng là `Byte`, `Short`, `Character`, `Integer`, `Long`, `Float`, `Double`, `Boolean`.

Trước tiên hãy xem một đoạn code autoboxing:

```java
 public static void main(String[] args) {
    int i = 10;
    Integer n = i;
}
```

Code sau khi dịch ngược như sau:

```java
public static void main(String args[])
{
    int i = 10;
    Integer n = Integer.valueOf(i);
}
```

Tiếp theo hãy xem một đoạn code unboxing tự động:

```java
public static void main(String[] args) {

    Integer i = 10;
    int n = i;
}
```

Code sau khi dịch ngược như sau:

```java
public static void main(String args[])
{
    Integer i = Integer.valueOf(10);
    int n = i.intValue();
}
```

Từ kết quả dịch ngược có thể thấy, khi boxing thì hệ thống tự động gọi phương thức `valueOf(int)` của `Integer`. Còn khi unboxing thì tự động gọi phương thức `intValue` của `Integer`.

Vì vậy, **quá trình boxing được thực hiện bằng cách gọi phương thức `valueOf` của lớp wrapper, còn quá trình unboxing được thực hiện bằng cách gọi phương thức `xxxValue` của lớp wrapper.**

### Tham số có độ dài thay đổi (Varargs)

Tham số biến thiên (`variable arguments`) là một tính năng được giới thiệu từ Java 1.5. Nó cho phép một phương thức nhận số lượng giá trị tùy ý làm đối số.

Hãy xem đoạn code varargs sau, trong đó phương thức `print` nhận tham số biến thiên:

```java
public static void main(String[] args)
    {
        print("Holis", "公众号:Hollis", "博客：www.hollischuang.com", "QQ：907607222");
    }

public static void print(String... strs)
{
    for (int i = 0; i < strs.length; i++)
    {
        System.out.println(strs[i]);
    }
}
```

Code sau khi dịch ngược:

```java
 public static void main(String args[])
{
    print(new String[] {
        "Holis", "\u516C\u4F17\u53F7:Hollis", "\u535A\u5BA2\uFF1Awww.hollischuang.com", "QQ\uFF1A907607222"
    });
}

public static transient void print(String strs[])
{
    for(int i = 0; i < strs.length; i++)
        System.out.println(strs[i]);

}
```

Từ code sau khi dịch ngược có thể thấy, khi varargs được sử dụng, trước tiên trình biên dịch sẽ tạo một mảng có độ dài bằng đúng số lượng đối số thực tế truyền vào khi gọi phương thức, sau đó đưa toàn bộ giá trị đối số vào mảng này rồi truyền mảng đó làm tham số vào phương thức được gọi. (Ghi chú: `transient` chỉ có ý nghĩa khi bổ nghĩa cho biến thành viên; việc nó xuất hiện như đang "bổ nghĩa phương thức" ở đây là do Javassist dùng cùng một giá trị số để biểu diễn `transient` và `vararg`, xem [tại đây](https://github.com/jboss-javassist/javassist/blob/7302b8b0a09f04d344a26ebe57f29f3db43f2a3e/src/main/javassist/bytecode/AccessFlag.java#L32).)

### Enum

Java SE 5 cung cấp một kiểu mới — kiểu liệt kê (`enum`) của Java. Từ khóa `enum` có thể tạo một tập hữu hạn các giá trị được đặt tên thành một kiểu dữ liệu mới, và các giá trị có tên này có thể được sử dụng như thành phần chương trình thông thường — đây là một tính năng rất hữu ích.

Muốn xem cấu trúc bên dưới thì trước hết phải có một lớp, vậy kiểu enum thực chất là lớp gì? Có phải là `enum` không? Câu trả lời rõ ràng là không: `enum` cũng giống như `class`, chỉ là một từ khóa chứ không phải một lớp. Vậy enum được quản lý bởi lớp nào? Ta hãy viết thử một enum đơn giản:

```java
public enum t {
    SPRING,SUMMER;
}
```

Sau đó chúng ta dùng công cụ dịch ngược để xem đoạn code này thực chất được hiện thực như thế nào; nội dung code sau khi dịch ngược như sau:

```java
// Tên nhị phân (binary name) của enum vẫn là t; định danh Java phân biệt chữ hoa chữ thường
public final class t extends Enum
{
    private t(String s, int i)
    {
        super(s, i);
    }
    public static t[] values()
    {
        t at[];
        int i;
        t at1[];
        System.arraycopy(at = ENUM$VALUES, 0, at1 = new t[i = at.length], 0, i);
        return at1;
    }

    public static t valueOf(String s)
    {
        return (t) Enum.valueOf(t.class, s);
    }

    public static final t SPRING;
    public static final t SUMMER;
    private static final t ENUM$VALUES[];
    static
    {
        SPRING = new t("SPRING", 0);
        SUMMER = new t("SUMMER", 1);
        ENUM$VALUES = (new t[] {
            SPRING, SUMMER
        });
    }
}
```

Qua đoạn code sau khi dịch ngược, ta thấy `public final class t extends Enum`, chứng tỏ lớp này kế thừa từ lớp `Enum`; enum hiện tại không chứa phần thân lớp riêng cho từng hằng số (constant-specific class body), nên nó ngầm định là `final`.

**Lớp enum định nghĩa bằng `enum` sẽ kế thừa trực tiếp từ `Enum`, vì vậy không thể kế thừa tường minh lớp khác và cũng không thể bị lớp thông thường kế thừa. Lớp enum không có phần thân lớp riêng cho hằng số thì ngầm định là `final`; chỉ cần có hằng số enum khai báo phần thân lớp riêng, lớp enum sẽ ngầm định là `sealed`, và các phần thân lớp riêng đó tương ứng với các lớp con ẩn danh được cấp phép (permitted anonymous subclasses).**

### Inner Class (Lớp nội bộ)

Inner Class còn được gọi là lớp lồng nhau (nested class); bạn có thể hiểu inner class như một thành viên thông thường của outer class.

**Inner class cũng là một Syntactic Sugar vì nó chỉ là một khái niệm lúc biên dịch: bên trong `outer.java` định nghĩa một inner class `inner`, một khi biên dịch thành công thì sẽ sinh ra hai file `.class` hoàn toàn tách biệt là `outer.class` và `outer$inner.class`. Tuy nhiên, JLS nghiêm cấm lớp lồng nhau có cùng tên đơn (simple name) với bất kỳ lớp hoặc interface bao ngoài nào.**

```java
public class OuterClass {
    private String userName;

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public static void main(String[] args) {

    }

    class InnerClass{
        private String name;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
}
```

Đoạn code trên sau khi biên dịch sẽ sinh ra hai file class: `OuterClass$InnerClass.class` và `OuterClass.class`. Khi ta thử dịch ngược file `OuterClass.class`, dòng lệnh sẽ in ra: `Parsing OuterClass.class...Parsing inner class OuterClass$InnerClass.class... Generating OuterClass.jad`. Nó sẽ dịch ngược cả hai file rồi gộp lại thành một file `OuterClass.jad`. Nội dung file như sau:

```java
public class OuterClass
{
    class InnerClass
    {
        public String getName()
        {
            return name;
        }
        public void setName(String name)
        {
            this.name = name;
        }
        private String name;
        final OuterClass this$0;

        InnerClass()
        {
            this.this$0 = OuterClass.this;
            super();
        }
    }

    public OuterClass()
    {
    }
    public String getUserName()
    {
        return userName;
    }
    public void setUserName(String userName){
        this.userName = userName;
    }
    public static void main(String args1[])
    {
    }
    private String userName;
}
```

**Tại sao inner class có thể dùng thuộc tính `private` của outer class**:

Ta thêm một phương thức vào `InnerClass` để in thuộc tính `userName` của outer class:

```java
// Lược bỏ các thuộc tính khác
public class OuterClass {
    private String userName;
    ......
    class InnerClass{
    ......
        public void printOut(){
            System.out.println("Username from OuterClass:"+userName);
        }
    }
}

// Lúc này, kết quả dịch ngược OuterClass bằng lệnh javap -p:
public classOuterClass {
    private String userName;
    ......
    static String access$000(OuterClass);
}
// Lúc này, kết quả dịch ngược của InnerClass:
class OuterClass$InnerClass {
    final OuterClass this$0;
    ......
    public void printOut();
}

```

Thực chất, sau khi biên dịch xong, bên trong instance của inner class thường có một tham chiếu `this$0` trỏ tới instance của outer class. Trong các file class được tạo bởi JDK 10 trở về trước, trình biên dịch thường thông qua phương thức truy cập tổng hợp (synthetic accessor) tương tự `access$000` để thực hiện việc truy cập thành viên `private` giữa các lớp lồng nhau, vì vậy phương thức `printOut()` sau khi dịch ngược đại khái sẽ như sau. Từ JDK 11 trở đi, kiểm soát truy cập dựa trên nest (nest-based access control) được đưa vào, các lớp trong cùng một nest có thể truy cập trực tiếp thành viên `private` của nhau và thường không còn cần đến các phương thức truy cập tổng hợp dạng này nữa:

```java
public void printOut() {
    System.out.println("Username from OuterClass:" + OuterClass.access$000(this.this$0));
}
```

Bổ sung:

1. Trong đầu ra điển hình của `javac` ở JDK 10 trở về trước, anonymous inner class, local inner class và static nested class cũng có thể lấy thuộc tính `private` thông qua phương thức truy cập tổng hợp; từ JDK 11 trở đi thường dùng nest-based access control.
2. Static nested class không có tham chiếu `this$0`.
3. Anonymous inner class và local inner class sử dụng biến cục bộ bằng cách sao chép lại nó, nên biến đó sau khi khởi tạo sẽ không thể bị sửa đổi. Dưới đây là một ví dụ:

```java
public class OuterClass {
    private String userName;

    public void test(){
        // Ở đây i sau khi khởi tạo bằng 1 thì không thể bị thay đổi nữa
        int i=1;
        class Inner{
            public void printName(){
                System.out.println(userName);
                System.out.println(i);
            }
        }
    }
}
```

Sau khi dịch ngược:

```java
// Kết quả dịch ngược Inner bằng lệnh javap
// i được sao chép vào inner class và có từ khóa final
class OuterClass$1Inner {
  final int val$i;
  final OuterClass this$0;
  OuterClass$1Inner();
  public void printName();
}

```

### Biên dịch có điều kiện (Conditional Compilation)

Thông thường, mọi dòng code trong chương trình đều tham gia vào quá trình biên dịch. Tuy nhiên đôi lúc vì mục đích tối ưu hóa chương trình, ta chỉ muốn biên dịch một phần nội dung nào đó; lúc này cần thêm điều kiện vào chương trình để trình biên dịch chỉ biên dịch phần code thỏa mãn điều kiện và loại bỏ phần code không thỏa mãn — đây gọi là biên dịch có điều kiện.

Ví dụ trong C hoặc C++, có thể thực hiện biên dịch có điều kiện thông qua các chỉ thị tiền xử lý (preprocessor directives). Thực ra trong Java cũng có thể làm biên dịch có điều kiện. Trước tiên hãy xem một đoạn code:

```java
public class ConditionalCompilation {
    public static void main(String[] args) {
        final boolean DEBUG = true;
        if(DEBUG) {
            System.out.println("Hello, DEBUG!");
        }

        final boolean ONLINE = false;

        if(ONLINE){
            System.out.println("Hello, ONLINE!");
        }
    }
}
```

Code sau khi dịch ngược như sau:

```java
public class ConditionalCompilation
{

    public ConditionalCompilation()
    {
    }

    public static void main(String args[])
    {
        boolean DEBUG = true;
        System.out.println("Hello, DEBUG!");
        boolean ONLINE = false;
    }
}
```

Trước tiên ta nhận thấy trong code sau khi dịch ngược không hề có `System.out.println("Hello, ONLINE!");` — đây chính là biên dịch có điều kiện. Khi `if(ONLINE)` là `false`, trình biên dịch đã không biên dịch đoạn code bên trong nó.

Vì vậy, **biên dịch có điều kiện trong cú pháp Java được thực hiện thông qua câu lệnh `if` với điều kiện kiểm tra là hằng số (constant). Nguyên lý của nó cũng là một Syntactic Sugar của ngôn ngữ Java: tùy vào giá trị đúng sai của điều kiện `if`, trình biên dịch sẽ trực tiếp loại bỏ khối lệnh thuộc nhánh `false`. Biên dịch có điều kiện theo cách này bắt buộc phải viết bên trong thân phương thức, không thể thực hiện trên toàn bộ cấu trúc lớp Java hay các thuộc tính của lớp — so với biên dịch có điều kiện của C/C++ thì quả thực có nhiều hạn chế hơn. Ngay từ khi thiết kế ban đầu Java đã không đưa vào tính năng biên dịch có điều kiện; tuy có hạn chế nhưng có vẫn hơn không.**

### Assertion (Khẳng định)

Trong Java, từ khóa `assert` được giới thiệu từ Java SE 1.4. Để tránh xung đột lỗi với các đoạn mã Java đời cũ vốn có sử dụng `assert` làm tên định danh, khi thực thi Java mặc định không bật kiểm tra assertion (lúc này mọi câu lệnh `assert` đều bị bỏ qua!). Nếu muốn bật kiểm tra assertion, cần dùng cờ `-enableassertions` hoặc `-ea`.

Hãy xem một đoạn code có chứa assertion:

```java
public class AssertTest {
    public static void main(String args[]) {
        int a = 1;
        int b = 1;
        assert a == b;
        System.out.println("公众号：Hollis");
        assert a != b : "Hollis";
        System.out.println("博客：www.hollischuang.com");
    }
}
```

Code sau khi dịch ngược như sau:

```java
public class AssertTest {
   public AssertTest()
    {
    }
    public static void main(String args[])
{
    int a = 1;
    int b = 1;
    if(!$assertionsDisabled && a != b)
        throw new AssertionError();
    System.out.println("\u516C\u4F17\u53F7\uFF1AHollis");
    if(!$assertionsDisabled && a == b)
    {
        throw new AssertionError("Hollis");
    } else
    {
        System.out.println("\u535A\u5BA2\uFF1Awww.hollischuang.com");
        return;
    }
}

static final boolean $assertionsDisabled = !com/hollis/suguar/AssertTest.desiredAssertionStatus();

}
```

Rõ ràng, code sau khi dịch ngược phức tạp hơn rất nhiều so với code chúng ta tự viết. Vì thế, sử dụng Syntactic Sugar `assert` giúp ta tiết kiệm được rất nhiều dòng lệnh. **Thực chất cách cài đặt bên dưới của assertion chính là câu lệnh `if`: nếu kết quả assertion là `true` thì không làm gì cả và chương trình chạy tiếp; nếu kết quả assertion là `false` thì chương trình ném ra `AssertionError` để ngắt quá trình thực thi.** Cờ `-enableassertions` sẽ thiết lập giá trị cho trường `\$assertionsDisabled`.

### Numeric Literals (Hằng số học)

Trong Java 7, các literal số — bất kể là số nguyên hay số thực dấu phẩy động — đều cho phép chèn bao nhiêu dấu gạch dưới `_` tùy ý vào giữa các chữ số. Các dấu gạch dưới này không làm thay đổi giá trị của literal mà chỉ nhằm mục đích giúp dễ đọc hơn.

Ví dụ:

```java
public class Test {
    public static void main(String... args) {
        int i = 10_000;
        System.out.println(i);
    }
}
```

Sau khi dịch ngược:

```java
public class Test
{
  public static void main(String[] args)
  {
    int i = 10000;
    System.out.println(i);
  }
}
```

Trong kết quả dịch ngược không thấy dấu `_`, vì nó chỉ là một phần cú pháp literal trong mã nguồn, không ảnh hưởng tới giá trị và cũng không được ghi vào file class. **Trình biên dịch phải nhận diện và kiểm tra vị trí hợp lệ của `_`, sau đó ghi giá trị số của literal vào bytecode.**

### for-each

Vòng lặp `for` cải tiến (`for-each`) chắc hẳn không xa lạ với bất kỳ ai; trong phát triển hằng ngày ta dùng rất thường xuyên vì viết ít code hơn hẳn vòng lặp `for` thông thường. Vậy đằng sau Syntactic Sugar này được cài đặt như thế nào?

```java
public static void main(String... args) {
    String[] strs = {"Hollis", "公众号：Hollis", "博客：www.hollischuang.com"};
    for (String s : strs) {
        System.out.println(s);
    }
    List<String> strList = ImmutableList.of("Hollis", "公众号：Hollis", "博客：www.hollischuang.com");
    for (String s : strList) {
        System.out.println(s);
    }
}
```

Code sau khi dịch ngược như sau:

```java
public static transient void main(String args[])
{
    String strs[] = {
        "Hollis", "\u516C\u4F17\u53F7\uFF1AHollis", "\u535A\u5BA2\uFF1Awww.hollischuang.com"
    };
    String args1[] = strs;
    int i = args1.length;
    for(int j = 0; j < i; j++)
    {
        String s = args1[j];
        System.out.println(s);
    }

    List strList = ImmutableList.of("Hollis", "\u516C\u4F17\u53F7\uFF1AHollis", "\u535A\u5BA2\uFF1Awww.hollischuang.com");
    String s;
    for(Iterator iterator = strList.iterator(); iterator.hasNext(); System.out.println(s))
        s = (String)iterator.next();

}
```

Đoạn code rất đơn giản: **nguyên lý hiện thực của `for-each` thực chất chính là sử dụng vòng lặp `for` thông thường (với mảng) và `Iterator` (với Collection).**

### try-with-resource

Trong Java, đối với các tài nguyên tốn kém chi phí như luồng I/O file hay kết nối cơ sở dữ liệu, sau khi dùng xong bắt buộc phải gọi phương thức `close` để đóng kịp thời; nếu không tài nguyên sẽ luôn ở trạng thái mở và có thể dẫn đến các vấn đề như rò rỉ bộ nhớ (Memory Leak).

Cách thường dùng để đóng tài nguyên là giải phóng trong khối `finally`, tức là gọi phương thức `close`. Ví dụ, chúng ta thường viết code như sau:

```java
public static void main(String[] args) {
    BufferedReader br = null;
    try {
        String line;
        br = new BufferedReader(new FileReader("d:\\hollischuang.xml"));
        while ((line = br.readLine()) != null) {
            System.out.println(line);
        }
    } catch (IOException e) {
        // handle exception
    } finally {
        try {
            if (br != null) {
                br.close();
            }
        } catch (IOException ex) {
            // handle exception
        }
    }
}
```

Từ Java 7 trở đi, JDK cung cấp một cách tốt hơn để đóng tài nguyên bằng câu lệnh `try-with-resources`; viết lại đoạn code trên ta được kết quả như sau:

```java
public static void main(String... args) {
    try (BufferedReader br = new BufferedReader(new FileReader("d:\\ hollischuang.xml"))) {
        String line;
        while ((line = br.readLine()) != null) {
            System.out.println(line);
        }
    } catch (IOException e) {
        // handle exception
    }
}
```

Nhìn xem, đây đúng là một cứu cánh lớn! Dù trước đây mình thường dùng `IOUtils` để đóng stream chứ không viết nhiều code trong `finally`, nhưng loại Syntactic Sugar mới này trông thanh lịch hơn nhiều. Hãy xem phía sau nó:

```java
public static transient void main(String args[])
    {
        BufferedReader br;
        Throwable throwable;
        br = new BufferedReader(new FileReader("d:\\ hollischuang.xml"));
        throwable = null;
        String line;
        try
        {
            while((line = br.readLine()) != null)
                System.out.println(line);
        }
        catch(Throwable throwable2)
        {
            throwable = throwable2;
            throw throwable2;
        }
        finally
        {
            if(br != null)
                if(throwable != null)
                    try
                    {
                        br.close();
                    }
                    catch(Throwable throwable1)
                    {
                        throwable.addSuppressed(throwable1);
                    }
                else
                    br.close();
        }
    }
}
```

**Thực ra nguyên lý đằng sau cũng rất đơn giản: những thao tác đóng tài nguyên mà chúng ta không tự viết đều đã được trình biên dịch làm giúp. Điều này một lần nữa chứng minh tác dụng của Syntactic Sugar là tạo thuận tiện cho lập trình viên sử dụng, nhưng cuối cùng vẫn phải chuyển về thứ ngôn ngữ mà trình biên dịch hiểu được.**

### Biểu thức Lambda

Về biểu thức lambda, có thể sẽ có người thắc mắc vì trên mạng có ý kiến cho rằng nó không phải là Syntactic Sugar. Thực ra mình muốn đính chính nhận định này: **Biểu thức Lambda không phải là Syntactic Sugar của anonymous inner class, nhưng nó vẫn là một Syntactic Sugar. Cách hiện thực thực chất dựa vào một số API cấp thấp liên quan đến lambda do JVM cung cấp.**

Trước tiên hãy xem một biểu thức lambda đơn giản để duyệt một `List`:

```java
public static void main(String... args) {
    List<String> strList = ImmutableList.of("Hollis", "公众号：Hollis", "博客：www.hollischuang.com");

    strList.forEach( s -> { System.out.println(s); } );
}
```

Vì sao nói nó không phải Syntactic Sugar của inner class? Ở phần inner class trước đó chúng ta đã nói rằng inner class sau khi biên dịch sẽ tạo ra hai file `.class`, nhưng một lớp chứa biểu thức lambda sau khi biên dịch chỉ tạo ra duy nhất một file.

Code sau khi dịch ngược như sau:

```java
public static /* varargs */ void main(String ... args) {
    ImmutableList strList = ImmutableList.of((Object)"Hollis", (Object)"\u516c\u4f17\u53f7\uff1aHollis", (Object)"\u535a\u5ba2\uff1awww.hollischuang.com");
    strList.forEach((Consumer<String>)LambdaMetafactory.metafactory(null, null, null, (Ljava/lang/Object;)V, lambda$main$0(java.lang.String ), (Ljava/lang/String;)V)());
}

private static /* synthetic */ void lambda$main$0(String s) {
    System.out.println(s);
}
```

Có thể thấy trong phương thức `forEach`, thực chất đã gọi phương thức `java.lang.invoke.LambdaMetafactory#metafactory`, trong đó tham số thứ tư `implMethod` chỉ định hiện thực của phương thức. Ở đây có thể thấy thực chất đã gọi một phương thức `lambda$main$0` để xuất dữ liệu.

Hãy xem thêm một ví dụ phức tạp hơn một chút: lọc `List` trước rồi mới in ra:

```java
public static void main(String... args) {
    List<String> strList = ImmutableList.of("Hollis", "公众号：Hollis", "博客：www.hollischuang.com");

    List HollisList = strList.stream().filter(string -> string.contains("Hollis")).collect(Collectors.toList());

    HollisList.forEach( s -> { System.out.println(s); } );
}
```

Code sau khi dịch ngược như sau:

```java
public static /* varargs */ void main(String ... args) {
    ImmutableList strList = ImmutableList.of((Object)"Hollis", (Object)"\u516c\u4f17\u53f7\uff1aHollis", (Object)"\u535a\u5ba2\uff1awww.hollischuang.com");
    List<Object> HollisList = strList.stream().filter((Predicate<String>)LambdaMetafactory.metafactory(null, null, null, (Ljava/lang/Object;)Z, lambda$main$0(java.lang.String ), (Ljava/lang/String;)Z)()).collect(Collectors.toList());
    HollisList.forEach((Consumer<Object>)LambdaMetafactory.metafactory(null, null, null, (Ljava/lang/Object;)V, lambda$main$1(java.lang.Object ), (Ljava/lang/Object;)V)());
}

private static /* synthetic */ void lambda$main$1(Object s) {
    System.out.println(s);
}

private static /* synthetic */ boolean lambda$main$0(String string) {
    return string.contains("Hollis");
}
```

Hai biểu thức lambda lần lượt gọi hai phương thức `lambda$main$1` và `lambda$main$0`.

**Vì vậy, hiện thực của biểu thức lambda thực chất dựa vào một số API cấp thấp; trong giai đoạn biên dịch, trình biên dịch sẽ desugar biểu thức lambda và chuyển thành lời gọi các API nội bộ.**

## Những cái bẫy có thể gặp

### Generics

**1. Khi Generics gặp nạp chồng (`Overload`)**

```java
public class GenericTypes {

    public static void method(List<String> list) {
        System.out.println("invoke method(List<String> list)");
    }

    public static void method(List<Integer> list) {
        System.out.println("invoke method(List<Integer> list)");
    }
}
```

Trong đoạn code trên có hai hàm nạp chồng vì kiểu tham số của chúng khác nhau — một là `List<String>` và một là `List<Integer>`. Tuy nhiên, đoạn code này không thể biên dịch được. Vì như chúng ta đã nói trước đó, hai tham số `List<Integer>` và `List<String>` sau khi biên dịch đều bị xóa kiểu thành cùng một kiểu nguyên thủy (raw type) `List`, thao tác xóa kiểu khiến chữ ký phương thức của hai hàm trở nên giống hệt nhau.

**2. Khi Generics gặp `catch`**

Tham số kiểu của Generics không thể dùng trong câu lệnh `catch` xử lý ngoại lệ của Java. Bởi vì việc xử lý ngoại lệ do JVM thực hiện tại thời điểm chạy (runtime); do thông tin kiểu đã bị xóa, JVM không thể phân biệt giữa hai kiểu ngoại lệ `MyException<String>` và `MyException<Integer>`.

**3. Khi bên trong Generics chứa biến `static`**

```java
public class StaticTest{
    public static void main(String[] args){
        GT<Integer> gti = new GT<Integer>();
        gti.var=1;
        GT<String> gts = new GT<String>();
        gts.var=2;
        System.out.println(gti.var);
    }
}
class GT<T>{
    public static int var=0;
    public void nothing(T x){}
}
```

Kết quả đầu ra của đoạn code trên là: `2`!

Một số bạn có thể hiểu nhầm rằng các lớp generic với tham số kiểu khác nhau là những lớp khác nhau và tương ứng với các bytecode khác nhau. Thực chất do đã trải qua quá trình xóa kiểu (`Type Erasure`), mọi instance của lớp generic đều gắn với cùng một bản bytecode duy nhất, nên biến `static` của lớp generic được dùng chung. Trong ví dụ trên, `GT<Integer>.var` và `GT<String>.var` thực chất là cùng một biến.

### Autoboxing và Unboxing

**So sánh bằng giữa các đối tượng**

```java
public static void main(String[] args) {
    Integer a = 1000;
    Integer b = 1000;
    Integer c = 100;
    Integer d = 100;
    System.out.println("a == b is " + (a == b));
    System.out.println(("c == d is " + (c == d)));
}
```

Kết quả đầu ra:

```plain
a == b is false
c == d is true
```

Trong Java 5, một tính năng mới đã được đưa vào cho các thao tác trên `Integer` nhằm tiết kiệm bộ nhớ và cải thiện hiệu năng. Các đối tượng số nguyên được cache và tái sử dụng bằng cách dùng chung cùng một tham chiếu đối tượng.

> Áp dụng cho khoảng giá trị số nguyên từ `-128` đến `+127`.
>
> Chỉ áp dụng cho autoboxing; không áp dụng khi khởi tạo đối tượng bằng constructor.

### Vòng lặp for cải tiến (`for-each`)

```java
for (Student stu : students) {
    if (stu.getId() == 2)
        students.remove(stu);
}
```

Đoạn code trên sẽ ném ra ngoại lệ `ConcurrentModificationException`.

Ở đây liên quan đến cơ chế **Fail-Fast** của Collection. Lấy `ArrayList` làm ví dụ: bên trong nó duy trì một bộ đếm `modCount`, mỗi lần cấu trúc của tập hợp bị thay đổi (như thêm hoặc xóa phần tử) thì bộ đếm này sẽ tăng lên. Khi tạo `Iterator`, giá trị `modCount` hiện tại sẽ được lưu thành `expectedModCount`. Mỗi lần gọi `next()`, `Iterator` đều kiểm tra xem `modCount` có bằng `expectedModCount` hay không; nếu không bằng, chứng tỏ tập hợp đã bị sửa đổi bằng cách khác trong lúc duyệt, và ngoại lệ `java.util.ConcurrentModificationException` sẽ được ném ra.

Do đó trong lúc `Iterator` đang hoạt động, đối tượng tập hợp đang được duyệt không được phép bị thay đổi trực tiếp. Tuy nhiên bạn có thể dùng chính phương thức `remove()` của `Iterator` để xóa phần tử, vì `Iterator.remove()` sau khi xóa phần tử sẽ đồng bộ cập nhật lại `expectedModCount`, nhờ đó tránh kích hoạt ngoại lệ này.

## Tổng kết

Phía trên đã giới thiệu 12 loại Syntactic Sugar thường dùng trong Java. Cái gọi là Syntactic Sugar thực chất chỉ là một dạng cú pháp cung cấp cho lập trình viên để thuận tiện hơn khi phát triển. Nhưng thứ cú pháp này chỉ có lập trình viên hiểu được; để chạy được thì phải trải qua quá trình desugar, tức là chuyển sang cú pháp mà JVM hiểu được. Khi chúng ta bóc tách lớp vỏ của Syntactic Sugar, bạn sẽ nhận ra rằng những cú pháp tiện lợi mà ta dùng hằng ngày thực ra đều được cấu thành từ những cú pháp khác đơn giản hơn.

Có những Syntactic Sugar này giúp chúng ta nâng cao đáng kể hiệu suất trong quá trình phát triển hằng ngày, nhưng đồng thời cũng cần tránh lạm dụng chúng. Trước khi sử dụng, tốt nhất nên hiểu rõ nguyên lý bên dưới để tránh rơi vào các cái bẫy.
