---
title: Giải thích chi tiết cấu trúc tệp Class
description: Giới thiệu cấu trúc tệp Class bytecode của Java cùng các thành phần cốt lõi như Constant Pool để hỗ trợ hiểu rõ sản phẩm sau biên dịch.
category: Java
tag:
  - JVM
lang: vi
sourceRef: zh-ref/java/jvm/class-file-structure.md
head:
  - - meta
    - name: keywords
      content: Class file,Constant Pool,Magic Number,phiên bản,field,method,attribute
---

## Ôn lại về Bytecode

Trong Java, đoạn mã mà JVM có thể hiểu được gọi là `bytecode` (tức tệp có phần mở rộng là `.class`). Nó không hướng tới bất kỳ bộ vi xử lý cụ thể nào mà chỉ hướng tới máy ảo. Thông qua bytecode, ngôn ngữ Java phần nào giải quyết được vấn đề hiệu năng thực thi thấp của các ngôn ngữ thông dịch truyền thống, đồng thời vẫn giữ được đặc tính khả chuyển (portable) của ngôn ngữ thông dịch. Nhờ vậy chương trình Java chạy khá hiệu quả, và vì bytecode không phụ thuộc vào một loại máy cụ thể nào, chương trình Java không cần biên dịch lại mà vẫn chạy được trên nhiều máy tính với hệ điều hành khác nhau.

Các ngôn ngữ như Clojure (một phương ngữ của Lisp), Groovy, Scala, JRuby, Kotlin... đều chạy trên nền tảng Máy ảo Java (JVM). Hình dưới đây minh họa việc các ngôn ngữ khác nhau được các trình biên dịch khác nhau biên dịch thành tệp `.class` và cuối cùng chạy trên Máy ảo Java. Định dạng nhị phân của tệp `.class` có thể được xem bằng [WinHex](https://www.x-ways.net/winhex/).

![Các ngôn ngữ lập trình chạy trên Máy ảo Java](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/java-virtual-machine-program-language-os-feab1dfc.png)

Có thể nói tệp `.class` là cầu nối quan trọng giữa các ngôn ngữ khác nhau với Máy ảo Java, đồng thời cũng là một lý do quan trọng giúp Java hỗ trợ chạy đa nền tảng.

## Tổng kết cấu trúc tệp Class

Theo đặc tả Máy ảo Java (Java Virtual Machine Specification), tệp Class được định nghĩa thông qua cấu trúc `ClassFile`, khá giống với `struct` trong ngôn ngữ C.

Cấu trúc của `ClassFile` như sau:

```java
ClassFile {
    u4             magic; // Dấu hiệu nhận diện của tệp Class
    u2             minor_version;// Số phiên bản phụ (minor) của Class
    u2             major_version;// Số phiên bản chính (major) của Class
    u2             constant_pool_count;// Số lượng mục trong Constant Pool
    cp_info        constant_pool[constant_pool_count-1];// Constant Pool
    u2             access_flags;// Cờ truy cập (access flags) của Class
    u2             this_class;// Lớp hiện tại
    u2             super_class;// Lớp cha
    u2             interfaces_count;// Số lượng interface
    u2             interfaces[interfaces_count];// Một lớp có thể triển khai nhiều interface
    u2             fields_count;// Số lượng field
    field_info     fields[fields_count];// Một lớp có thể có nhiều field
    u2             methods_count;// Số lượng phương thức
    method_info    methods[methods_count];// Một lớp có thể có nhiều phương thức
    u2             attributes_count;// Số lượng thuộc tính trong bảng thuộc tính của lớp này
    attribute_info attributes[attributes_count];// Tập hợp bảng thuộc tính
}
```

Thông qua việc phân tích nội dung của `ClassFile`, chúng ta có thể biết được thành phần cấu tạo của một tệp class.

![Phân tích nội dung ClassFile](/media/jg/ext/oss.javaguide.cn/java-guide-blog/16d5ec47609818fc-1ba5ad24.jpg)

Hình dưới đây được xem bằng plugin `jclasslib` của IDEA, giúp bạn quan sát cấu trúc tệp Class một cách trực quan hơn.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210401170711475-26926aec.png)

Sử dụng `jclasslib` không chỉ giúp xem trực quan tệp bytecode tương ứng với một lớp, mà còn xem được thông tin cơ bản của lớp, Constant Pool, interface, thuộc tính, hàm và nhiều thông tin khác.

Dưới đây là phần giới thiệu chi tiết về các thành phần liên quan trong cấu trúc tệp Class.

### Magic Number

```java
    u4             magic; // Dấu hiệu nhận diện của tệp Class
```

4 byte đầu tiên của mỗi tệp Class được gọi là Magic Number. Tác dụng duy nhất của nó là **xác định tệp này có phải là một tệp Class có thể được máy ảo tiếp nhận hay không**. Đặc tả Java quy định Magic Number có giá trị cố định: `0xCAFEBABE`. Nếu tệp được đọc không bắt đầu bằng Magic Number này, Máy ảo Java sẽ từ chối nạp nó.

### Số phiên bản tệp Class (Minor & Major Version)

```java
    u2             minor_version;// Số phiên bản phụ (minor) của Class
    u2             major_version;// Số phiên bản chính (major) của Class
```

Bốn byte ngay sau Magic Number lưu số phiên bản của tệp Class: byte thứ 5 và thứ 6 là **số phiên bản phụ (minor version)**, byte thứ 7 và thứ 8 là **số phiên bản chính (major version)**.

Mỗi khi Java phát hành một phiên bản lớn (chẳng hạn Java 8, Java 9), số phiên bản chính sẽ tăng thêm 1. Bạn có thể dùng lệnh `javap -v` để xem nhanh thông tin phiên bản của tệp Class.

Máy ảo Java phiên bản cao có thể thực thi tệp Class được sinh ra bởi trình biên dịch phiên bản thấp, nhưng Máy ảo Java phiên bản thấp không thể thực thi tệp Class được sinh ra bởi trình biên dịch phiên bản cao. Vì vậy, trong quá trình phát triển thực tế, cần đảm bảo phiên bản JDK khi phát triển đồng nhất với phiên bản JDK trên môi trường production.

### Constant Pool

```java
    u2             constant_pool_count;// Số lượng mục trong Constant Pool
    cp_info        constant_pool[constant_pool_count-1];// Constant Pool
```

Ngay sau số phiên bản chính và phụ là Constant Pool. Số lượng mục trong Constant Pool là `constant_pool_count-1` (**bộ đếm của Constant Pool bắt đầu đếm từ 1; việc để trống mục thứ 0 có lý do đặc biệt: chỉ số 0 đại diện cho "không tham chiếu tới bất kỳ mục Constant Pool nào"**).

Constant Pool chủ yếu lưu trữ hai nhóm hằng số lớn: Literal (giá trị trực tiếp) và Symbolic Reference (tham chiếu ký hiệu). Literal gần với khái niệm hằng số ở tầng ngôn ngữ Java, như chuỗi văn bản, giá trị hằng số khai báo `final`, v.v. Còn Symbolic Reference thuộc về khái niệm trong nguyên lý trình biên dịch, bao gồm ba loại hằng số sau:

- Tên đầy đủ (fully qualified name) của lớp và interface
- Tên và descriptor của field
- Tên và descriptor của phương thức

Mỗi mục hằng số trong Constant Pool là một bảng. *Đặc tả Máy ảo Java* hiện tại định nghĩa 17 loại bảng Constant Pool, tất cả đều có một điểm chung: **mở đầu là một `tag` kiểu `u1` dùng để nhận diện loại của hằng số hiện tại.**

|               Loại               | Cờ (tag) |          Mô tả          |
| :------------------------------: | :------: | :---------------------: |
|        CONSTANT_utf8_info        |    1     | Chuỗi mã hóa UTF-8 |
|      CONSTANT_Integer_info       |    3     | Literal kiểu số nguyên |
|       CONSTANT_Float_info        |    4     | Literal kiểu số thực dấu phẩy động |
|        CONSTANT_Long_info        |    5     | Literal kiểu số nguyên dài (long) |
|       CONSTANT_Double_info       |    6     | Literal kiểu số thực độ chính xác kép |
|       CONSTANT_Class_info        |    7     | Tham chiếu ký hiệu tới lớp hoặc interface |
|       CONSTANT_String_info       |    8     | Literal kiểu chuỗi (String) |
|      CONSTANT_FieldRef_info      |    9     | Tham chiếu ký hiệu tới field |
|     CONSTANT_MethodRef_info      |    10    | Tham chiếu ký hiệu tới phương thức trong lớp |
| CONSTANT_InterfaceMethodRef_info |    11    | Tham chiếu ký hiệu tới phương thức trong interface |
|    CONSTANT_NameAndType_info     |    12    | Tham chiếu ký hiệu tới field hoặc phương thức |
|     CONSTANT_MethodType_info     |    16    | Định danh kiểu phương thức (method type) |
|    CONSTANT_MethodHandle_info    |    15    | Biểu diễn method handle |
|      CONSTANT_Dynamic_info       |    17    | Biểu diễn hằng số tính toán động |
|   CONSTANT_InvokeDynamic_info    |    18    | Biểu diễn một điểm gọi phương thức động |
|       CONSTANT_Module_info       |    19    | Biểu diễn module |
|      CONSTANT_Package_info       |    20    | Biểu diễn package trong module |

Với tệp `.class`, bạn có thể xem thông tin trong Constant Pool bằng lệnh `javap -v ClassName` (`javap -v ClassName -> temp.txt` xuất kết quả ra tệp `temp.txt`).

### Access Flags

```java
    u2             access_flags;// Cờ truy cập (access flags) của Class
```

Sau khi Constant Pool kết thúc, hai byte liền kề tiếp theo đại diện cho Access Flags. Cờ này dùng để nhận diện các thông tin truy cập ở cấp độ lớp hoặc interface, bao gồm: Class này là lớp hay interface, có phải kiểu `public` hay `abstract` không, nếu là lớp thì có khai báo `final` hay không, v.v.

Các modifier truy cập và thuộc tính của lớp:

![Modifier truy cập và thuộc tính của lớp](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/.png-0bdfb487.png)

Giả sử chúng ta định nghĩa một lớp `Employee`:

```java
package top.snailclimb.bean;
public class Employee {
   ...
}
```

Dùng lệnh `javap -v ClassName` để xem Access Flags của lớp.

![Xem Access Flags của lớp](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/.png-3f162d9f.png)

### Tập hợp chỉ số This Class, Super Class và Interfaces

```java
    u2             this_class;// Lớp hiện tại
    u2             super_class;// Lớp cha
    u2             interfaces_count;// Số lượng interface
    u2             interfaces[interfaces_count];// Một lớp có thể triển khai nhiều interface
```

Quan hệ kế thừa của một lớp Java được xác định bởi ba thành phần: chỉ số lớp (`this_class`), chỉ số lớp cha (`super_class`) và tập hợp chỉ số interface (`interfaces`). Ba thành phần này được sắp xếp lần lượt ngay sau Access Flags.

Chỉ số lớp dùng để xác định tên đầy đủ của lớp hiện tại, còn chỉ số lớp cha dùng để xác định tên đầy đủ của lớp cha của lớp này. Do ngôn ngữ Java chỉ hỗ trợ đơn kế thừa nên chỉ số lớp cha chỉ có một; ngoại trừ `java.lang.Object`, tất cả các lớp Java đều có lớp cha, do đó ngoài `java.lang.Object` ra thì chỉ số lớp cha của mọi lớp Java đều khác 0.

Tập hợp chỉ số interface dùng để mô tả lớp này triển khai (implement) những interface nào; các interface được triển khai sẽ xếp theo thứ tự từ trái sang phải đúng như thứ tự xuất hiện sau `implements` (hoặc sau `extends` nếu bản thân lớp này là một interface) trong tập hợp chỉ số interface.

### Tập hợp bảng Fields

```java
    u2             fields_count;// Số lượng field
    field_info     fields[fields_count];// Một lớp có thể có nhiều field
```

Bảng field (`field_info`) dùng để mô tả các biến được khai báo trong interface hoặc lớp. Field bao gồm biến cấp lớp (class-level variable) và biến thực thể (instance variable), nhưng không bao gồm biến cục bộ (local variable) khai báo bên trong phương thức.

**Cấu trúc của `field_info` (bảng field):**

![Cấu trúc bảng field](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/.png-cd38ccb1.png)

- **access_flags:** Phạm vi truy cập của field (các modifier `public`, `private`, `protected`), là biến thực thể hay biến lớp (modifier `static`), có thể tuần tự hóa (`Serialization`) hay không (modifier `transient`), tính khả biến (`final`), tính khả kiến (`Visibility` với modifier `volatile`, bắt buộc đọc/ghi từ bộ nhớ chính).
- **name_index:** Tham chiếu tới Constant Pool, biểu diễn tên của field.
- **descriptor_index:** Tham chiếu tới Constant Pool, biểu diễn descriptor của field hoặc phương thức.
- **attributes_count:** Một field có thể có thêm một số thuộc tính bổ sung; `attributes_count` lưu số lượng các thuộc tính đó.
- **attributes[attributes_count]:** Lưu nội dung cụ thể của từng thuộc tính.

Trong các thông tin nêu trên, các modifier đều mang giá trị boolean — hoặc có modifier đó, hoặc không có — nên rất phù hợp để biểu diễn bằng các bit cờ (flag bit). Trong khi đó, field tên gì và được định nghĩa với kiểu dữ liệu nào là những thông tin không thể cố định trước, nên chỉ có thể tham chiếu tới hằng số trong Constant Pool để mô tả.

**Các giá trị `access_flag` của field:**

![Các giá trị access_flag của field](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/class-file-fields-access_flag-f6327134.png)

### Tập hợp bảng Methods

```java
    u2             methods_count;// Số lượng phương thức
    method_info    methods[methods_count];// Một lớp có thể có nhiều phương thức
```

`methods_count` biểu thị số lượng phương thức, còn `method_info` biểu diễn bảng phương thức.

Trong định dạng lưu trữ của tệp Class, cách mô tả phương thức gần như hoàn toàn giống với cách mô tả field. Cấu trúc của bảng phương thức cũng giống bảng field, lần lượt bao gồm Access Flags, chỉ số tên, chỉ số descriptor và tập hợp bảng thuộc tính.

**Cấu trúc của `method_info` (bảng phương thức):**

![Cấu trúc bảng phương thức](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/.png-c66d230d.png)

**Các giá trị `access_flag` của bảng phương thức:**

![Các giá trị access_flag của bảng phương thức](/media/jg/ext/oss.javaguide.cn/javaguide/java/jvm/class-file-methods-access_flag-72428294.png)

Lưu ý: Do hai modifier `volatile` và `transient` không thể dùng để bổ nghĩa cho phương thức, nên Access Flags của bảng phương thức không có hai cờ tương ứng này; ngược lại, các từ khóa như `synchronized`, `native`, `abstract` có thể dùng cho phương thức, nên sẽ có thêm các cờ tương ứng với những từ khóa này.

### Tập hợp bảng Attributes

```java
   u2             attributes_count;// Số lượng thuộc tính trong bảng thuộc tính của lớp này
   attribute_info attributes[attributes_count];// Tập hợp bảng thuộc tính
```

Trong tệp Class, bảng field và bảng phương thức đều có thể mang theo tập hợp bảng thuộc tính riêng để mô tả thông tin đặc thù cho một số kịch bản nhất định. Khác với yêu cầu chặt chẽ về thứ tự, độ dài và nội dung của các hạng mục dữ liệu khác trong tệp Class, ràng buộc đối với tập hợp bảng thuộc tính có phần linh hoạt hơn: các bảng thuộc tính không bắt buộc phải tuân theo một thứ tự nghiêm ngặt, và chỉ cần không trùng với tên thuộc tính đã có, bất kỳ trình biên dịch nào cũng có thể ghi thông tin thuộc tính tự định nghĩa vào bảng thuộc tính; tại thời điểm chạy (runtime), Máy ảo Java sẽ bỏ qua những thuộc tính mà nó không nhận diện được.

## Tài liệu tham khảo

- *Practical Java Virtual Machine*
- Chapter 4. The class File Format - Java Virtual Machine Specification: <https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-4.html>
- Phân tích thực tế cấu trúc tệp JAVA CLASS: <https://coolshell.cn/articles/9229.html>
- *Minh họa nguyên lý Máy ảo Java* 1.2.2, Giải thích chi tiết Constant Pool trong tệp Class (Phần 1): <https://blog.csdn.net/luanlouis/article/details/39960815>
