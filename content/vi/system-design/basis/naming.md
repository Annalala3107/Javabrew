---
title: Hướng dẫn đặt tên code
description: Hướng dẫn quy chuẩn đặt tên code, bao gồm nguyên tắc và mẹo đặt tên biến, phương thức, lớp nhằm nâng cao tính dễ đọc và khả năng bảo trì của code.
category: Chất lượng code
head:
  - - meta
    - name: keywords
      content: Đặt tên code,Quy chuẩn đặt tên,Đặt tên biến,Đặt tên hàm,Đặt tên lớp,Tính dễ đọc,Chất lượng code,Code Review
lang: vi
sourceRef: zh-ref/system-design/basis/naming.md
---

Tôi vẫn nhớ hồi mới đi làm, khi Code Review dự án, tôi thường xuyên bị "diss" vì đặt tên biến không đúng chuẩn!

Nghĩ lại thì nguyên nhân cũng là do lúc đó mình còn thiếu kinh nghiệm; hơn nữa, hồi đại học làm đồ án cũng ít để ý mấy vấn đề này, chỉ nghĩ miễn sao chạy được tính năng là xong.

Nhưng khi đi làm thì khác: để đảm bảo tính dễ đọc (Readability) và khả năng bảo trì (Maintainability) của code, đội ngũ dự án đặt yêu cầu rất cao về chất lượng code!

Thời gian trước, một bạn thực tập sinh mới vào nhóm cũng thường xuyên bị "diss" trong lúc Code Review vì đặt tên biến không chuẩn, khiến tôi nhớ lại quãng thời gian mình mới vào công ty viết code.

Thế nên, tôi viết bài chia sẻ ngắn về quy chuẩn đặt tên biến này, hy vọng có thể giúp ích phần nào cho những bạn đang gặp rắc rối tương tự.

Quả thực, trong quá trình lập trình có quá nhiều thứ khiến chúng ta đau đầu, chẳng hạn như đặt tên, bảo trì code của người khác, viết test, trao đổi giao tiếp với đồng nghiệp,...

Nghe nói trước đây trên trang Quora, trong cuộc bình chọn của gần 5.000 lập trình viên, việc khó nhất được bầu chọn chính là "đặt tên".

Martin Fowler, tác giả nổi tiếng của cuốn *Refactoring*, từng nhắc đến trong bài viết [TwoHardThings](https://martinfowler.com/bliki/TwoHardThings.html) rằng trong lĩnh vực Khoa học máy tính (CS) có hai việc khó nhất: một là **vô hiệu hóa Cache (Cache Invalidation)**, hai là **đặt tên (Naming Things)**.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/marting-naming-fb3105be.png)

Thực ra câu nói này cũng là Martin Fowler trích dẫn lại từ người khác, và có rất nhiều cách nói tương tự như vậy. Ví dụ trong lĩnh vực hệ thống phân tán có hai việc khó nhất: một là **đảm bảo thứ tự thông điệp (Guaranteed Message Ordering)**, hai là **truyền tải chính xác một lần (Exactly-once Delivery)**.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/20210629104844645-f379029e.png)

Hôm nay chúng ta hãy tách riêng chủ đề "**đặt tên**" ra để cùng bàn luận nhé!

Đọc bài viết này kết hợp với bài [《Code 5 phút, đặt tên 2 tiếng? Tài liệu tham khảo quy chuẩn đặt tên Java đầy đủ nhất lịch sử!》](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247486449&idx=1&sn=c3b502529ff991c7180281bcc22877af&chksm=cea2443af9d5cd2c1c87049ed15ccf6f88275419c7dbe542406166a703b27d0f3ecf2af901f8&token=999884676&lang=zh_CN#rd) mà tôi từng đăng trước đó sẽ đạt hiệu quả tốt hơn nữa!

## Vì sao cần coi trọng việc đặt tên?

Trước tiên chúng ta cần hiểu vì sao phải coi trọng hành động đặt tên trong lập trình, và nó có ý nghĩa gì đối với công việc viết code hằng ngày.

**Vì sao việc đặt tên lại quan trọng?** Bởi vì **đặt tên tốt chính là chú thích (Comment)—người khác vừa nhìn vào tên của bạn là biết ngay biến, phương thức hay lớp đó dùng để làm gì!**

Nói đơn giản là **người khác chỉ cần dựa vào tên bạn đặt là có thể hiểu code của bạn muốn diễn đạt ý gì** (tất nhiên, tiền đề là người đó cũng phải có vốn tiếng Anh cơ bản và quen thuộc với những từ vựng thường gặp trong lập trình).

Hãy lấy một ví dụ đơn giản để minh họa tầm quan trọng của việc đặt tên.

Cuốn sách *Clean Code* chỉ rõ:

> **Code tốt tự bản thân nó đã là chú thích; chúng ta cần chuẩn hóa và làm đẹp code của mình hết mức có thể để giảm bớt những chú thích không cần thiết.**
>
> **Nếu ngôn ngữ lập trình đủ giàu sức biểu đạt thì không cần chú thích—hãy cố gắng diễn đạt trực tiếp thông qua code.**
>
> Ví dụ:
>
> Bỏ đi dòng chú thích rườm rà dưới đây bằng cách tạo một hàm diễn đạt đúng nội dung của chú thích đó:
>
> ```java
> // check to see if the employee is eligible for full benefits
> if ((employee.flags & HOURLY_FLAG) && (employee.age > 65))
> ```
>
> Nên thay thế thành:
>
> ```java
> if (employee.isEligibleForFullBenefits())
> ```

## Các quy tắc đặt tên phổ biến và kịch bản áp dụng

Ở đây chỉ giới thiệu 3 quy chuẩn đặt tên phổ biến nhất.

### Quy tắc lạc đà (CamelCase)

CamelCase có lẽ là kiểu đặt tên chúng ta gặp nhiều nhất. Kiểu đặt tên này dùng cách viết xen kẽ chữ hoa và chữ thường để phân tách các từ, và giữa các từ không dùng khoảng trắng hay ký tự nối.

#### Lạc đà lớn (UpperCamelCase)

**Tên lớp (Class) cần sử dụng kiểu UpperCamelCase.**

Ví dụ đúng:

```java
ServiceDiscovery, ServiceInstance, LruCacheFactory
```

Ví dụ sai:

```java
serviceDiscovery, Serviceinstance, LRUCacheFactory
```

#### Lạc đà nhỏ (lowerCamelCase)

**Tên phương thức, tên tham số, biến thành viên (Member Variable) và biến cục bộ (Local Variable) cần sử dụng kiểu lowerCamelCase.**

Ví dụ đúng:

```java
getUserInfo()
createCustomThreadPool()
setNameFormat(String nameFormat)
UserService userService;
```

Ví dụ sai:

```java
GetUserInfo(), CreateCustomThreadPool(), setNameFormat(String NameFormat)
UserService user_service;
```

### Quy tắc con rắn (snake_case)

**Tên phương thức kiểm thử (Test Method) có thể sử dụng `snake_case` tùy theo quy ước của đội ngũ, còn hằng số (Constant) và hằng số Enum thường sử dụng kiểu rắn viết hoa (`UPPER_SNAKE_CASE`).**

Trong `snake_case`, các từ được nối với nhau bằng dấu gạch dưới `_`, ví dụ `should_get_200_status_code_when_request_is_valid`, `CLIENT_CONNECT_SERVER_FAILURE`.

Ưu điểm của `snake_case` thể hiện rõ khi tên cần nhiều từ. Ví dụ, tôi chuyển tên ở trên sang kiểu `lowerCamelCase` để các bạn xem thử: `shouldGet200StatusCodeWhenRequestIsValid`.

Cảm giác thế nào? So với việc dùng `snake_case`, có phải đọc khó hơn hẳn không?

Ví dụ đúng:

```java
@Test
void should_get_200_status_code_when_request_is_valid() {
  ......
}
```

Một cách viết phổ biến khác:

```java
@Test
void shouldGet200StatusCodeWhenRequestIsValid() {
  ......
}
```

### Quy tắc xiên que (kebab-case)

Trong `kebab-case`, các từ được nối với nhau bằng dấu gạch nối `-`, ví dụ `dubbo-registry`.

Nên dùng `kebab-case` cho tên thư mục dự án; ví dụ cách đặt tên các module trong dự án Dubbo như hình dưới đây.

![](/media/jg/ext/oss.javaguide.cn/java-guide-blog/dubbo-naming-0e2bf261.png)

## Các quy chuẩn đặt tên phổ biến

### Quy chuẩn đặt tên cơ bản trong ngôn ngữ Java

**1. Tên lớp cần tuân theo phong cách UpperCamelCase. Tên phương thức, tên tham số, biến thành viên và biến cục bộ cần sử dụng lowerCamelCase.**

**2. Phương thức test không có một cách đặt tên đúng duy nhất; có thể dùng `snake_case` theo quy ước của nhóm**, ví dụ `should_get_200_status_code_when_request_is_valid`. Hằng số và hằng số Enum thường sử dụng chữ hoa `UPPER_SNAKE_CASE`, ví dụ `CLIENT_CONNECT_SERVER_FAILURE`; bản thân kiểu Enum vẫn sử dụng UpperCamelCase.

**3. Tên thư mục dự án sử dụng `kebab-case`, ví dụ `dubbo-registry`.**

**4. Tên Package thống nhất viết thường toàn bộ, cố gắng dùng danh từ đơn làm tên Package, các từ phân tách bằng dấu `.` và mỗi từ phải ở dạng số ít.**

Ví dụ đúng: `org.apache.dubbo.common.threadlocal`

Ví dụ sai: ~~`org.apache_dubbo.Common.threadLocals`~~

**5. Tên lớp trừu tượng (Abstract Class) bắt đầu bằng `Abstract`.**

```java
// Lớp trừu tượng được tách ra cho phần truyền tải từ xa (nguồn: mã nguồn Dubbo)
public abstract class AbstractClient extends AbstractEndpoint implements Client {

}
```

**6. Tên lớp ngoại lệ (Exception Class) kết thúc bằng `Exception`.**

```java
// NoSuchMethodException tùy chỉnh (nguồn: mã nguồn Dubbo)
public class NoSuchMethodException extends RuntimeException {
    private static final long serialVersionUID = -2725364246023268766L;

    public NoSuchMethodException() {
        super();
    }

    public NoSuchMethodException(String msg) {
        super(msg);
    }
}
```

**7. Tên lớp kiểm thử (Test Class) bắt đầu bằng tên của lớp cần test và kết thúc bằng `Test`.**

```java
// Lớp test viết cho AnnotationUtils (nguồn: mã nguồn Dubbo)
public class AnnotationUtilsTest {
  ......
}
```

Trường kiểu boolean trong lớp POJO có dùng tiền tố `is` hay không cần đánh giá kết hợp với quy tắc sinh Accessor (getter/setter) và Framework tuần tự hóa (`Serialization`). Thông thường có thể đặt tên trường kiểu nguyên thủy `boolean` là `active` và cung cấp `isActive()`, đặt tên trường kiểu bao bọc `Boolean` là `active` và cung cấp `getActive()`; nếu kết quả suy diễn của Framework không đúng như kỳ vọng, có thể cố định tên thuộc tính thông qua Accessor tường minh hoặc Annotation tuần tự hóa.

Nếu một module, Interface, Class hoặc phương thức có sử dụng Design Pattern, cần thể hiện rõ tên Pattern cụ thể trong cách đặt tên.

### Quy chuẩn về tính dễ đọc khi đặt tên

**1. Để tên dễ hiểu và dễ đọc hơn, hạn chế viết tắt/rút gọn từ, trừ khi các từ đó đã được công nhận rộng rãi cho phép viết tắt như vậy. Ví dụ `CustomThreadFactory` không được phép viết thành ~~`CustomTF`~~.**

**2. Đặt tên không giống viết hàm ở chỗ phải cố gắng thật ngắn—một cái tên dễ đọc được ưu tiên hơn cái tên ngắn gọn, dù cái tên dễ đọc có thể dài hơn một chút.** Điều này tương ứng với điểm số 1 ở trên.

**3. Tránh đặt tên vô nghĩa—mỗi cái tên bạn đặt ra đều phải thể hiện được ý nghĩa của nó.**

Ví dụ đúng: `UserService userService;` `int userCount;`

Ví dụ sai: ~~`UserService service`~~ ~~`int count`~~

**4. Tránh đặt tên quá dài (tốt nhất trong vòng 50 ký tự); tên quá dài vừa khó đọc vừa thiếu thẩm mỹ.**

**5. Không dùng phiên âm Pinyin (hay tiếng Việt không dấu), và tuyệt đối không dùng chữ Hán/chữ có dấu.** Tuy nhiên những danh từ phổ biến mang tính quốc tế như `alibaba`, `wuhan`, `taobao` có thể coi như từ tiếng Anh.

Ví dụ đúng: `discount`

Ví dụ sai: ~~`dazhe`~~ (phiên âm Pinyin tiếng Trung của từ giảm giá)

## Codelf: "Thần khí" đặt tên biến?

Đây là một trang web do lập trình viên Trung Quốc phát triển, trên mạng có rất nhiều người gọi nó là "thần khí đặt tên biến". Sau khi trực tiếp sử dụng thử vài ngày, tôi thấy nó không thực sự tiện dụng đến thế. Các bạn có thể tự trải nghiệm rồi đưa ra đánh giá riêng cho mình.

Codelf có phiên bản web trực tuyến tại địa chỉ [https://unbug.github.io/codelf/](https://unbug.github.io/codelf/), cách sử dụng cụ thể như sau:

Tôi chọn ngôn ngữ lập trình Java, rồi tìm kiếm từ khóa "serialization" (tuần tự hóa), và nó trả về rất nhiều gợi ý đặt tên liên quan đến tuần tự hóa.

![](/media/jg/local/system-design/basis/pictures/Codelf-637d0a.png)

Ngoài ra, Codelf còn cung cấp tiện ích mở rộng (Plugin) cho VS Code. Nhìn đánh giá này thì có vẻ mọi người cũng rất thích công cụ đặt tên này.

![](/media/jg/local/system-design/basis/pictures/vscode-codelf-89ace4.png)

## Tài liệu gợi ý đọc thêm

1. *Sổ tay phát triển Java của Alibaba (Alibaba Java Coding Guidelines)*
2. *Clean Code*
3. Hướng dẫn phong cách code Java của Google (Google Java Style Guide): <https://google.github.io/styleguide/javaguide.html>
4. [Code 5 phút, đặt tên 2 tiếng? Tài liệu tham khảo quy chuẩn đặt tên Java đầy đủ nhất lịch sử!](https://www.cnblogs.com/liqiangchn/p/12000361.html)

## Tổng kết

Là một lập trình viên đạt chuẩn, hẳn các bạn đều biết tầm quan trọng của việc code tự diễn đạt được ý nghĩa. Muốn viết ra code chất lượng cao, đặt tên tốt chính là bước đầu tiên!

Đặt tên tốt giúp người khác (bao gồm cả chính bản thân bạn) hiểu code của bạn dễ dàng hơn rất nhiều! Code càng dễ hiểu thì khả năng bảo trì càng cao, điều này gián tiếp cho thấy thiết kế code của bạn cũng tốt hơn!

Trong quá trình viết code hằng ngày, chúng ta cần ghi nhớ các quy chuẩn đặt tên phổ biến như tên lớp phải dùng UpperCamelCase, không dùng phiên âm Pinyin và càng không dùng chữ tượng hình trong định danh...

Ngoài ra, trang web Codelf do lập trình viên Trung Quốc phát triển được nhiều người gọi là "thần khí đặt tên biến"—khi nào bí ý tưởng đặt tên, bạn có thể vào đó tham khảo một số gợi ý đặt tên.

Cuối cùng, chúc tất cả mọi người không còn phải đau đầu vì chuyện đặt tên nữa!
