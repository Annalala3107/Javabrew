---
title: Tổng hợp giải pháp ẩn dữ liệu nhạy cảm (Data Desensitization)
description: Giải thích chi tiết các giải pháp ẩn dữ liệu nhạy cảm, bao gồm quy tắc che mờ cho số điện thoại, CMND/CCCD, thẻ ngân hàng và cách triển khai bằng thư viện Hutool.
category: Thiết kế hệ thống
tag:
  - Bảo mật
head:
  - - meta
    - name: keywords
      content: Ẩn dữ liệu nhạy cảm,Data Desensitization,Bảo vệ quyền riêng tư,Ẩn số điện thoại,Ẩn số CCCD,Quy tắc che mờ,Dữ liệu nhạy cảm,Dữ liệu kiểm thử,Tuân thủ
lang: vi
sourceRef: zh-ref/system-design/security/data-desensitization.md
---


> Bài viết này được biên tập và bổ sung từ [Hutool: Ẩn dữ liệu nhạy cảm chỉ với một dòng code - JD Cloud Developer](https://mp.weixin.qq.com/s/1qFWczesU50ndPPLtABHFg).

## Ẩn dữ liệu nhạy cảm là gì

### Định nghĩa ẩn dữ liệu nhạy cảm

Baidu Baike định nghĩa về ẩn dữ liệu nhạy cảm (Data Desensitization) như sau:

> Ẩn dữ liệu nhạy cảm là việc biến đổi một số thông tin nhạy cảm thông qua các quy tắc che mờ hoặc biến dạng dữ liệu, nhằm bảo vệ đáng tin cậy dữ liệu riêng tư nhạy cảm. Nhờ đó, tập dữ liệu thực tế đã được xử lý ẩn thông tin có thể được sử dụng an toàn trong môi trường phát triển, kiểm thử, các môi trường phi sản xuất (non-production) khác và môi trường thuê ngoài (outsourcing). Trong các trường hợp liên quan đến dữ liệu bảo mật của khách hàng hoặc dữ liệu thương mại nhạy cảm, khi không vi phạm quy tắc hệ thống, dữ liệu thật sẽ được biến đổi để phục vụ kiểm thử; các thông tin cá nhân như số CMND/CCCD, số điện thoại di động, số thẻ, mã khách hàng đều cần được ẩn dữ liệu. Đây là một trong những kỹ thuật bảo mật cơ sở dữ liệu.

Nhìn chung, ẩn dữ liệu nhạy cảm là quá trình biến đổi một số thông tin nhạy cảm thông qua các quy tắc định sẵn để bảo vệ đáng tin cậy dữ liệu riêng tư nhạy cảm.

Trong quá trình ẩn dữ liệu, tùy theo yêu cầu và kịch bản khác nhau mà các thuật toán và kỹ thuật khác nhau thường được áp dụng để xử lý dữ liệu. Ví dụ, đối với số CMND/CCCD, có thể dùng thuật toán che mờ (masking) để giữ lại vài chữ số đầu và thay các vị trí còn lại bằng `"X"` hoặc `"\*"`; đối với họ tên, có thể dùng thuật toán giả danh (pseudonymization) để thay tên thật bằng một tên giả được sinh ngẫu nhiên.

### Các quy tắc ẩn dữ liệu phổ biến

Các quy tắc ẩn dữ liệu phổ biến được dùng để bảo vệ tính an toàn của dữ liệu nhạy cảm bằng cách biến đổi hoặc chỉnh sửa dữ liệu trong quá trình xử lý và lưu trữ.

Dưới đây là một số quy tắc ẩn dữ liệu thường gặp:

- **Thay thế (thường dùng)**: Thay thế các ký tự hoặc chuỗi ký tự cụ thể trong dữ liệu nhạy cảm bằng ký tự khác. Ví dụ: thay các chữ số ở giữa của số thẻ tín dụng bằng dấu hoa thị (`\*`) hoặc ký tự khác.
- **Xóa bỏ**: Xóa ngẫu nhiên một phần nội dung trong dữ liệu nhạy cảm. Ví dụ: xóa ngẫu nhiên 3 chữ số trong số điện thoại.
- **Hoán vị / Xáo trộn**: Đảo lộn thứ tự của một số ký tự hoặc trường trong dữ liệu gốc. Ví dụ: tráo đổi chéo các vị trí ngẫu nhiên của số CMND/CCCD.
- **Thêm nhiễu (Noise Addition)**: Đưa thêm một lượng sai số hoặc dữ liệu nhiễu vào dữ liệu để đạt hiệu quả ẩn thông tin. Ví dụ: chèn thêm một số ký tự sinh ngẫu nhiên vào dữ liệu nhạy cảm.
- **Mã hóa hoặc Tokenization (thường dùng)**: Khi cần khôi phục nguyên văn, có thể sử dụng thuật toán mã hóa có bảo vệ tính toàn vẹn; khi không cần khôi phục nguyên văn, tùy mục đích sử dụng mà có thể chọn cắt ngắn (truncation), tokenization hoặc HMAC dùng khóa bí mật độc lập. Các hàm băm như MD5, SHA-256 không phải là thuật toán mã hóa; việc băm trực tiếp không kèm khóa (unkeyed hash) đối với dữ liệu có cấu trúc như số thẻ ngân hàng vẫn có thể bị vét cạn (enumeration). Bạn có thể tham khảo bài tổng hợp các thuật toán mã hóa phổ biến tại đây: <https://javaguide.cn/system-design/security/encryption-algorithms.html>.
- ...

## Các công cụ ẩn dữ liệu phổ biến

### Hutool

Hutool là một bộ thư viện tiện ích nền tảng cho Java, đóng gói các phương thức JDK liên quan đến file, stream, mã hóa/giải mã, chuyển mã, biểu thức chính quy, thread, XML... thành các lớp `Util` đa dạng, đồng thời cung cấp các module sau:

|       Module       |                                                     Giới thiệu                                                      |
| :----------------: | :-----------------------------------------------------------------------------------------------------------------: |
|     hutool-aop     |                  Đóng gói JDK Dynamic Proxy, hỗ trợ AOP mà không cần IoC container                                  |
| hutool-bloomFilter |                    Bloom Filter, cung cấp triển khai bộ lọc Bloom với nhiều thuật toán Hash                         |
|    hutool-cache    |                                           Triển khai bộ nhớ đệm (Cache) đơn giản                                    |
|    hutool-core     |                     Thành phần lõi, bao gồm thao tác Bean, ngày giờ, các lớp Util đa dạng...                        |
|    hutool-cron     |                    Module tác vụ định kỳ, cung cấp lịch chạy dạng biểu thức Crontab                                 |
|   hutool-crypto    |          Module mã hóa/giải mã, đóng gói các thuật toán đối xứng, bất đối xứng và hàm băm (digest)                  |
|     hutool-db      |                    Thao tác dữ liệu đóng gói trên JDBC, dựa trên tư tưởng ActiveRecord                              |
|     hutool-dfa     |                         Tìm kiếm đa từ khóa dựa trên mô hình DFA                                                    |
|    hutool-extra    | Module mở rộng, đóng gói tích hợp bên thứ ba (template engine, email, Servlet, mã QR, Emoji, FTP, tách từ...)        |
|    hutool-http     |                           Đóng gói HTTP client dựa trên `HttpUrlConnection`                                         |
|     hutool-log     |                          Logging facade tự động nhận diện thư viện log được sử dụng                                 |
|   hutool-script    |                             Đóng gói thực thi script, ví dụ như JavaScript                                          |
|   hutool-setting   |                    Đóng gói file cấu hình `Setting` và `Properties` mạnh mẽ hơn                                     |
|   hutool-system    |                         Đóng gói gọi tham số hệ thống (thông tin JVM...)                                            |
|    hutool-json     |                                             Triển khai xử lý JSON                                                   |
|   hutool-captcha   |                                         Triển khai mã xác thực CAPTCHA dạng ảnh                                     |
|     hutool-poi     |                              Đóng gói xử lý Excel và Word trong Apache POI                                          |
|   hutool-socket    |                           Đóng gói Socket dựa trên Java NIO và AIO                                                  |
|     hutool-jwt     |                                 Triển khai đóng gói JSON Web Token (JWT)                                            |

Bạn có thể nhúng riêng từng module theo nhu cầu, hoặc nhúng toàn bộ qua `hutool-all`. Công cụ ẩn dữ liệu nhạy cảm được sử dụng trong bài viết này nằm trong module `hutool.core`.

Hiện tại, phiên bản mới nhất của Hutool hỗ trợ các loại dữ liệu cần ẩn sau, cơ bản bao phủ hầu hết các thông tin nhạy cảm thường gặp:

1. User ID (`userId`)
2. Họ tên tiếng Trung
3. Số CMND/CCCD
4. Số điện thoại cố định
5. Số điện thoại di động
6. Địa chỉ
7. Email
8. Mật khẩu
9. Biển số xe Trung Quốc đại lục, bao gồm xe thường và xe năng lượng mới
10. Thẻ ngân hàng

#### Ẩn dữ liệu chỉ với một dòng code

Các phương thức ẩn dữ liệu do Hutool cung cấp được minh họa như hình dưới đây:

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/2023-08-01-10-2119fnVCIDozqHgRGx-5cdbf751.png)

Lưu ý: Hutool thực hiện ẩn dữ liệu bằng cách thay thông tin nhạy cảm bằng ký tự `*`, cụ thể nằm trong phương thức `StrUtil.hide`. Nếu muốn tùy chỉnh ký tự che mờ khác, bạn có thể sao chép mã nguồn của Hutool ra và tự cài đặt lại.

Dưới đây là mã kiểm thử minh họa việc ẩn số điện thoại di động, số thẻ ngân hàng, số CMND/CCCD và mật khẩu:

```java
import cn.hutool.core.util.DesensitizedUtil;
import org.junit.Test;
import org.springframework.boot.test.context.Spring BootTest;

/**
 *
 * @description: Triển khai ẩn dữ liệu nhạy cảm với Hutool
 */
@Spring BootTest
public class HuToolDesensitizationTest {

    @Test
    public void testPhoneDesensitization(){
        String phone="13723231234";
        System.out.println(DesensitizedUtil.mobilePhone(phone)); // Kết quả: 137****1234
    }
    @Test
    public void testBankCardDesensitization(){
        String bankCard="6217000130008255666";
        System.out.println(DesensitizedUtil.bankCard(bankCard)); // Kết quả: 6217 **** **** *** 5666
    }

    @Test
    public void testIdCardNumDesensitization(){
        String idCardNum="411021199901102321";
        // Chỉ hiển thị 4 chữ số đầu và 2 chữ số cuối
        System.out.println(DesensitizedUtil.idCardNum(idCardNum,4,2)); // Kết quả: 4110************21
    }
    @Test
    public void testPasswordDesensitization(){
        String password="www.jd.com_35711";
        System.out.println(DesensitizedUtil.password(password)); // Kết quả: ****************
    }
}
```

Trên đây là cách sử dụng lớp tiện ích đóng gói sẵn của Hutool để thực hiện ẩn dữ liệu nhạy cảm.

Cần đặc biệt lưu ý: Mật khẩu không thuộc nhóm các trường thông thường "có thể tiếp tục hiển thị hoặc lưu trữ sau khi che mờ". Mật khẩu phải được xử lý càng sớm càng tốt ngay tại cổng vào của server bằng thuật toán băm mật khẩu chuyên dụng, tuyệt đối không được lưu trữ, trả về hoặc ghi log dưới dạng văn bản thuần (plaintext). Phương thức `password()` ở đây chỉ biểu thị việc thay toàn bộ chuỗi thành `*`, hoàn toàn không thể thay thế cho băm mật khẩu.

#### Kết hợp với Jackson để ẩn dữ liệu qua Annotation

Khi đã có lớp tiện ích ẩn dữ liệu, nếu frontend có rất nhiều nơi cần hiển thị dữ liệu, chúng ta không thể gọi hàm tiện ích ở từng chỗ được vì code sẽ trở nên rất dư thừa. Vậy làm thế nào để thực hiện ẩn dữ liệu một cách gọn gàng thông qua Annotation?

Nếu dự án là web application xây dựng trên Spring Boot, có thể tận dụng thư viện Jackson tích hợp sẵn của Spring Boot để tùy chỉnh quá trình Serialization. Nguyên lý hoạt động thực chất là thực hiện ẩn dữ liệu ngay khi tuần tự hóa (serialize) đối tượng thành JSON để trả về cho frontend.

**Bước 1: Enum định nghĩa các chiến lược ẩn dữ liệu.**

```java
/**
 * @author
 * @description: Enum chiến lược ẩn dữ liệu
 */
public enum DesensitizationTypeEnum {
    // Tùy chỉnh
    MY_RULE,
    // ID người dùng
    USER_ID,
    // Họ tên tiếng Trung
    CHINESE_NAME,
    // Số CMND/CCCD
    ID_CARD,
    // Số điện thoại cố định
    FIXED_PHONE,
    // Số điện thoại di động
    MOBILE_PHONE,
    // Địa chỉ
    ADDRESS,
    // Email
    EMAIL,
    // Mật khẩu
    PASSWORD,
    // Biển số xe Trung Quốc đại lục, gồm xe thường và xe năng lượng mới
    CAR_LICENSE,
    // Thẻ ngân hàng
    BANK_CARD
}
```

Đoạn code trên liệt kê các kiểu ẩn dữ liệu được hỗ trợ.

**Bước 2: Định nghĩa Annotation `Desensitization` phục vụ ẩn dữ liệu.**

- `@Retention (RetentionPolicy.RUNTIME)`: Có hiệu lực tại thời điểm chạy (`runtime`).
- `@Target (ElementType.FIELD)`: Áp dụng trên trường dữ liệu (`field`).
- `@JacksonAnnotationsInside`: Bạn có thể click vào xem định nghĩa của annotation này; đây là một meta-annotation chủ yếu dùng để gom gói nhiều annotation khác sử dụng cùng nhau.
- `@JsonSerialize`: Như đã đề cập ở trên, annotation này cho phép tùy chỉnh `Serialization`, có thể đặt trên annotation, phương thức, trường, lớp..., có hiệu lực ở runtime và thực hiện tuần tự hóa tùy chỉnh theo các phương thức được ghi đè (`Override`) trong lớp serializer chỉ định.

```java
/**
 * @author
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@JacksonAnnotationsInside
@JsonSerialize(using = DesensitizationSerialize.class)
public @interface Desensitization {
    /**
     * Kiểu dữ liệu cần ẩn; khi dùng MY_RULE thì startInclude và endExclude mới có hiệu lực
     */
    DesensitizationTypeEnum type() default DesensitizationTypeEnum.MY_RULE;

    /**
     * Vị trí bắt đầu ẩn dữ liệu (bao gồm)
     */
    int startInclude() default 0;

    /**
     * Vị trí kết thúc ẩn dữ liệu (không bao gồm)
     */
    int endExclude() default 0;
}
```

Lưu ý: Vị trí bắt đầu và vị trí kết thúc chỉ có hiệu lực khi sử dụng giá trị enum tùy chỉnh `MY_RULE`.

**Bước 3: Tạo lớp serializer tùy chỉnh.**

Đây là bước then chốt để thực hiện ẩn dữ liệu nhạy cảm. Lớp serializer tùy chỉnh kế thừa `JsonSerializer`, triển khai interface `ContextualSerializer` và ghi đè hai phương thức.

```java
/**
 * @author
 * @description: Lớp serializer tùy chỉnh
 */
@AllArgsConstructor
@NoArgsConstructor
public class DesensitizationSerialize extends JsonSerializer<String> implements ContextualSerializer {
    private DesensitizationTypeEnum type;

    private Integer startInclude;

    private Integer endExclude;

    @Override
    public void serialize(String str, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException {
        switch (type) {
            // Ẩn dữ liệu theo quy tắc tùy chỉnh
            case MY_RULE:
                jsonGenerator.writeString(CharSequenceUtil.hide(str, startInclude, endExclude));
                break;
            // Ẩn userId
            case USER_ID:
                jsonGenerator.writeString(String.valueOf(DesensitizedUtil.userId()));
                break;
            // Ẩn họ tên tiếng Trung
            case CHINESE_NAME:
                jsonGenerator.writeString(DesensitizedUtil.chineseName(String.valueOf(str)));
                break;
            // Ẩn số CMND/CCCD
            case ID_CARD:
                jsonGenerator.writeString(DesensitizedUtil.idCardNum(String.valueOf(str), 1, 2));
                break;
            // Ẩn số điện thoại cố định
            case FIXED_PHONE:
                jsonGenerator.writeString(DesensitizedUtil.fixedPhone(String.valueOf(str)));
                break;
            // Ẩn số điện thoại di động
            case MOBILE_PHONE:
                jsonGenerator.writeString(DesensitizedUtil.mobilePhone(String.valueOf(str)));
                break;
            // Ẩn địa chỉ
            case ADDRESS:
                jsonGenerator.writeString(DesensitizedUtil.address(String.valueOf(str), 8));
                break;
            // Ẩn email
            case EMAIL:
                jsonGenerator.writeString(DesensitizedUtil.email(String.valueOf(str)));
                break;
            // Ẩn mật khẩu
            case PASSWORD:
                jsonGenerator.writeString(DesensitizedUtil.password(String.valueOf(str)));
                break;
            // Ẩn biển số xe Trung Quốc
            case CAR_LICENSE:
                jsonGenerator.writeString(DesensitizedUtil.carLicense(String.valueOf(str)));
                break;
            // Ẩn thẻ ngân hàng
            case BANK_CARD:
                jsonGenerator.writeString(DesensitizedUtil.bankCard(String.valueOf(str)));
                break;
            default:
        }

    }

    @Override
    public JsonSerializer<?> createContextual(SerializerProvider serializerProvider, BeanProperty beanProperty) throws JsonMappingException {
        if (beanProperty != null) {
            // Kiểm tra xem kiểu dữ liệu có phải String hay không
            if (Objects.equals(beanProperty.getType().getRawClass(), String.class)) {
                // Lấy annotation đã khai báo
                Desensitization desensitization = beanProperty.getAnnotation(Desensitization.class);
                // Nếu null
                if (desensitization == null) {
                    desensitization = beanProperty.getContextAnnotation(Desensitization.class);
                }
                // Nếu không null
                if (desensitization != null) {
                    // Tạo và trả về instance của lớp serializer tùy chỉnh với tham số là type, vị trí bắt đầu và vị trí kết thúc từ annotation
                    return new DesensitizationSerialize(desensitization.type(), desensitization.startInclude(),
                            desensitization.endExclude());
                }
            }

            return serializerProvider.findValueSerializer(beanProperty.getType(), beanProperty);
        }
        return serializerProvider.findNullValueSerializer(null);
    }
}
```

Sau ba bước trên, chúng ta đã hoàn thành việc ẩn dữ liệu thông qua Annotation; hãy cùng kiểm thử bên dưới.

Trước tiên, định nghĩa một POJO cần kiểm thử và gắn chiến lược ẩn dữ liệu tương ứng lên các trường:

```java
/**
 *
 * @description:
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestPojo {

    private String userName;

    @Desensitization(type = DesensitizationTypeEnum.MOBILE_PHONE)
    private String phone;

    @Desensitization(type = DesensitizationTypeEnum.MY_RULE, startInclude = 0, endExclude = 2)
    private String address;
}
```

Tiếp theo viết một Controller kiểm thử:

```java
@RestController
public class TestController {

    @RequestMapping("/test")
    public TestPojo testDesensitization(){
        TestPojo testPojo = new TestPojo();
        testPojo.setUserName("我是用户名");
        testPojo.setAddress("地球中国-北京市通州区京东总部2号楼");
        testPojo.setPhone("13782946666");
        return testPojo;
    }

}
```

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/2023-08-02-16-497DdCBy8vbf2D69g-44ed3e62.png)

Có thể thấy chúng ta đã triển khai ẩn dữ liệu nhạy cảm thành công.

### Apache ShardingSphere

ShardingSphere là một hệ sinh thái gồm các giải pháp middleware cơ sở dữ liệu phân tán mã nguồn mở, bao gồm 3 sản phẩm độc lập: Sharding-JDBC, Sharding-Proxy và Sharding-Sidecar (đang lên kế hoạch). Cả ba đều cung cấp các tính năng chuẩn hóa về phân mảnh dữ liệu (data sharding), giao dịch phân tán (distributed transaction) và quản trị cơ sở dữ liệu.

Trong Apache ShardingSphere có một module ẩn dữ liệu nhạy cảm tích hợp sẵn các tính năng che/mã hóa dữ liệu phổ biến. Nguyên lý cơ bản của nó là phân tích và chặn (intercept) câu lệnh SQL do người dùng gửi lên, viết lại SQL dựa trên cấu hình ẩn dữ liệu của người dùng, từ đó thực hiện mã hóa các trường văn bản gốc khi ghi và giải mã các trường đã mã hóa khi đọc. Cuối cùng, hệ thống đạt được khả năng lưu trữ mã hóa và truy vấn hoàn toàn trong suốt đối với người dùng.

Nhờ Apache ShardingSphere, quy trình ẩn dữ liệu có thể được tự động hóa và trở nên trong suốt, giúp người dùng không cần quan tâm đến chi tiết cài đặt ở tầng trung gian. Ngoài ra, nó còn cung cấp nhiều chiến lược ẩn dữ liệu tích hợp sẵn cũng như của bên thứ ba (AKS), người dùng chỉ cần cấu hình đơn giản là có thể sử dụng.

Địa chỉ tài liệu chính thức: <https://shardingsphere.apache.org/document/4.1.1/cn/features/orchestration/encrypt/>.

### FastJSON

Trong quá trình phát triển dự án Web hằng ngày, ngoài công cụ tuần tự hóa mặc định của Spring, FastJSON cũng là một công cụ tuần tự hóa rất phổ biến cho các API RESTful trên Spring Web.

FastJSON chủ yếu có hai cách triển khai ẩn dữ liệu nhạy cảm:

- **Dựa trên Annotation `@JSONField`**: Cần tự định nghĩa một lớp serializer phục vụ ẩn dữ liệu, sau đó trên trường cần ẩn dữ liệu, chỉ định lớp serializer tùy chỉnh đó thông qua thuộc tính `serializeUsing` trong `@JSONField`.
- **Dựa trên bộ lọc tuần tự hóa (Serialization Filter)**: Cần triển khai interface `ValueFilter`, ghi đè phương thức `process` để xử lý ẩn dữ liệu tùy chỉnh, sau đó truyền chiến lược chuyển đổi tùy chỉnh này khi chuyển đổi JSON. Cách cài đặt cụ thể có thể tham khảo bài viết: <https://juejin.cn/post/7067916686141161479>.

### Mybatis-Mate

Trước tiên hãy giới thiệu qua mối quan hệ giữa ba công cụ MyBatis, MyBatis-Plus và Mybatis-Mate:

- MyBatis là một framework tầng lưu trữ (persistence layer) xuất sắc, hỗ trợ tùy chỉnh SQL, stored procedure và ánh xạ nâng cao.
- MyBatis-Plus là công cụ mở rộng tăng cường cho MyBatis, giúp đơn giản hóa đáng kể công việc phát triển ở tầng lưu trữ.
- Mybatis-Mate là module cấp doanh nghiệp dành cho MyBatis-Plus, nhằm xử lý dữ liệu linh hoạt và gọn gàng hơn. Tuy nhiên, trước khi sử dụng cần cấu hình mã bản quyền (trả phí).

Mybatis-Mate hỗ trợ ẩn dữ liệu nhạy cảm, tích hợp sẵn 9 quy tắc phổ biến như số điện thoại, email, số thẻ ngân hàng...

```java
@FieldSensitive("testStrategy")
private String username;

@Configuration
public class SensitiveStrategyConfig {

    /**
     * Đăng ký chiến lược ẩn dữ liệu
     */
    @Bean
    public ISensitiveStrategy sensitiveStrategy() {
        // Xử lý ẩn dữ liệu tùy chỉnh cho loại testStrategy
        return new SensitiveStrategy().addStrategy("testStrategy", t -> t + "***test***");
    }
}

// Bỏ qua xử lý ẩn dữ liệu, dùng cho kịch bản chỉnh sửa
RequestDataTransfer.skipSensitive();
```

### MyBatis-Flex

Tương tự như MybatisPlus, MyBatis-Flex cũng là một framework mở rộng cho MyBatis. MyBatis-Flex cũng cung cấp tính năng ẩn dữ liệu nhạy cảm và có thể sử dụng hoàn toàn miễn phí.

MyBatis-Flex cung cấp Annotation `@ColumnMask()` cùng 9 quy tắc ẩn dữ liệu tích hợp sẵn, dùng được ngay:

```java
/**
 * Các phương thức ẩn dữ liệu tích hợp sẵn
 */
public class Masks {
    /**
     * Ẩn số điện thoại di động
     */
    public static final String MOBILE = "mobile";
    /**
     * Ẩn số điện thoại cố định
     */
    public static final String FIXED_PHONE = "fixed_phone";
    /**
     * Ẩn số CMND/CCCD
     */
    public static final String ID_CARD_NUMBER = "id_card_number";
    /**
     * Ẩn họ tên tiếng Trung
     */
    public static final String CHINESE_NAME = "chinese_name";
    /**
     * Ẩn địa chỉ
     */
    public static final String ADDRESS = "address";
    /**
     * Ẩn email
     */
    public static final String EMAIL = "email";
    /**
     * Ẩn mật khẩu
     */
    public static final String PASSWORD = "password";
    /**
     * Ẩn biển số xe
     */
    public static final String CAR_LICENSE = "car_license";
    /**
     * Ẩn số thẻ ngân hàng
     */
    public static final String BANK_CARD_NUMBER = "bank_card_number";
    //...
}
```

Ví dụ sử dụng:

```java
@Table("tb_account")
public class Account {

    @Id(keyType = KeyType.Auto)
    private Long id;

    @ColumnMask(Masks.CHINESE_NAME)
    private String userName;

    @ColumnMask(Masks.EMAIL)
    private String email;

}
```

Nếu các quy tắc tích hợp sẵn này chưa đáp ứng được yêu cầu của bạn, bạn còn có thể tự định nghĩa quy tắc ẩn dữ liệu tùy chỉnh.

1. Đăng ký quy tắc ẩn dữ liệu mới thông qua `MaskManager`:

```java
MaskManager.registerMaskProcessor("自定义规则名称"
        , data -> {
            return data;
        })
```

2. Sử dụng quy tắc ẩn dữ liệu tùy chỉnh:

```java
@Table("tb_account")
public class Account {

    @Id(keyType = KeyType.Auto)
    private Long id;

    @ColumnMask("自定义规则名称")
    private String userName;
}
```

Ngoài ra, đối với các tình huống cần bỏ qua xử lý ẩn dữ liệu, chẳng hạn như khi vào trang chỉnh sửa để cập nhật dữ liệu người dùng, MyBatis-Flex cũng hỗ trợ đầy đủ:

1. **`MaskManager#execWithoutMask`** (khuyến nghị): Phương thức này áp dụng mẫu thiết kế Template Method, đảm bảo sau khi bỏ qua bước ẩn dữ liệu để thực thi logic liên quan sẽ tự động khôi phục lại cơ chế ẩn dữ liệu.
2. **`MaskManager#skipMask`**: Bỏ qua xử lý ẩn dữ liệu.
3. **`MaskManager#restoreMask`**: Khôi phục xử lý ẩn dữ liệu, đảm bảo các thao tác sau đó tiếp tục áp dụng logic ẩn dữ liệu.

Phương thức `MaskManager#execWithoutMask` được cài đặt như sau:

```java
public static <T> T execWithoutMask(Supplier<T> supplier) {
    try {
        skipMask();
        return supplier.get();
    } finally {
        restoreMask();
    }
}
```

Hai phương thức `skipMask` và `restoreMask` của `MaskManager` thường được dùng thành cặp, khuyến nghị sử dụng theo mẫu `try{...}finally{...}`.

## Tổng kết

Bài viết này chủ yếu đã giới thiệu:

- **Định nghĩa ẩn dữ liệu nhạy cảm**: Ẩn dữ liệu nhạy cảm là việc biến đổi một số thông tin nhạy cảm thông qua các quy tắc che mờ/biến dạng dữ liệu nhằm bảo vệ đáng tin cậy dữ liệu riêng tư nhạy cảm.
- **Các quy tắc ẩn dữ liệu phổ biến**: Thay thế, xóa bỏ, xáo trộn thứ tự, thêm nhiễu và mã hóa.
- **Các công cụ ẩn dữ liệu phổ biến**: Hutool, Apache ShardingSphere, FastJSON, Mybatis-Mate và MyBatis-Flex.

## Tài liệu tham khảo

- OWASP Cryptographic Storage Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html>
- PCI SSC FAQ 1492 - PAN masking: <https://www.pcisecuritystandards.org/faqs/1492/>
- Trang chủ tài liệu công cụ Hutool: <https://hutool.cn/docs/#/>
- Bàn về cách tùy chỉnh ẩn dữ liệu nhạy cảm: <https://juejin.cn/post/7046567603971719204>
- Triển khai ẩn dữ liệu nhạy cảm với FastJSON: <https://juejin.cn/post/7067916686141161479>
