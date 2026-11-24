---
title: Tại sao cả Frontend và Backend đều cần Kiểm tra Dữ liệu (Data Validation)?
description: "Giải thích chi tiết sự cần thiết của kiểm tra dữ liệu ở cả frontend và backend, làm rõ tầm quan trọng của kiểm tra tham số, kiểm tra quyền hạn và các biện pháp bảo mật chống vượt qua lớp kiểm tra frontend."
category: Thiết kế hệ thống
tag:
  - Bảo mật
head:
  - - meta
    - name: keywords
      content: Kiểm tra dữ liệu,Kiểm tra Frontend,Kiểm tra Backend,Kiểm tra tham số,Kiểm tra quyền,Xác thực đầu vào,Bảo mật hệ thống,Chống injection
lang: vi
sourceRef: zh-ref/system-design/security/data-validation.md
---

> Câu hỏi phỏng vấn liên quan:
>
> - Frontend đã kiểm tra dữ liệu rồi thì Backend còn cần kiểm tra nữa không?
> - Tại sao Frontend đã thực hiện kiểm tra dữ liệu mà Backend vẫn cần kiểm tra lại tương tự (thậm chí nghiêm ngặt hơn)?
> - Frontend và Backend cần kiểm tra những nội dung nào?

Khi phát triển Web hằng ngày, dù viết giao diện frontend hay viết API backend thì chúng ta đều luôn phải làm việc với dữ liệu. Vậy làm sao đảm bảo dữ liệu truyền qua lại giữa hai bên luôn đáng tin cậy và an toàn? Điều đó phụ thuộc vào **kiểm tra dữ liệu (Data Validation)**. Không những vậy, việc này frontend phải làm, backend **càng phải làm**, và còn phải khóa thêm một lớp cực kỳ quan trọng nữa là **kiểm tra quyền (Authorization Check)** — không thể thiếu bước nào!

Tại sao lại như vậy? Hãy nghĩ xem: kiểm tra ở frontend chủ yếu nhằm nâng cao trải nghiệm người dùng và chặn bớt dữ liệu nhập bừa rõ rệt, nhưng một người chỉ cần biết chút kỹ thuật là có thể vượt qua lớp kiểm tra frontend một cách cực kỳ dễ dàng (chẳng hạn dùng công cụ như Postman gửi thẳng request lên server). Do đó, **kiểm tra ở backend mới là tuyến phòng thủ cuối cùng và kiên cố nhất cho bảo mật hệ thống cũng như tính chính xác của dữ liệu**. Nó phải đảm bảo dữ liệu đi vào hệ thống không chỉ đúng định dạng, mà còn tuân thủ quy tắc nghiệp vụ, và quan trọng nhất là người thực hiện thao tác đó phải có **quyền**!

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/user-input-validation-ffbd7ed5.png)

## Kiểm tra ở Frontend (Frontend Validation)

Kiểm tra ở frontend giống như một người gác cổng tận tâm, mục đích chính là ngay khi người dùng đang nhập dữ liệu sẽ báo ngay chỗ nào chưa đúng để họ sửa kịp thời — tránh việc nhấn gửi mãi mới bị backend báo lỗi rồi phải nhập lại từ đầu. Lợi ích mang lại rất rõ ràng:

1. **Trải nghiệm người dùng tốt hơn:** Nhập tới đâu có nhắc nhở tới đó, sai là biết ngay để sửa thuận tiện, mang lại cảm giác mượt mà, dễ chịu.
2. **Giảm tải cho backend:** Chặn ngay các dữ liệu sai định dạng rõ rệt hoặc thiếu trường bắt buộc ngay từ frontend giúp giảm bớt request vô ích gửi tới backend, tiết kiệm tài nguyên máy chủ và băng thông mạng. Cần lưu ý là backend vẫn bắt buộc phải kiểm tra lại, nhưng có thêm kiểm tra frontend sẽ cắt giảm được rất nhiều request không hợp lệ.

Vậy frontend thường phải kiểm tra những gì?

- **Kiểm tra trường bắt buộc (Required):** Cơ bản nhất, những ô bắt buộc điền thì không được để trống.
- **Kiểm tra định dạng (Format):** Ví dụ email phải đúng dạng email (như `xxx@xx.com`), số điện thoại di động phải đủ 11 chữ số (theo chuẩn Trung Quốc). Biểu thức chính quy (Regex) sẽ phát huy tác dụng ngay lúc này.
- **Kiểm tra nhập lặp lại:** Đảm bảo hai lần nhập khớp nhau, ví dụ trường "Xác nhận mật khẩu" khi đăng ký tài khoản.
- **Kiểm tra phạm vi / độ dài:** Tuổi không thể là số âm; độ dài mật khẩu phải từ 6 đến 20 ký tự — những ràng buộc này đều cần kiểm soát.
- **Kiểm tra tính hợp lệ / nghiệp vụ:** Chẳng hạn tên tài khoản đã có người đăng ký chưa? Sản phẩm vừa chọn còn hàng trong kho không? Phần này phụ thuộc vào nghiệp vụ cụ thể và thường cần phối hợp với backend.
- **Kiểm tra tải tệp tin lên (File Upload):** Giới hạn định dạng tệp cho phép (ví dụ chỉ hỗ trợ `.jpg`, `.png`) và dung lượng tối đa của tệp.
- **Kiểm tra bảo mật:** Phòng tránh các kiểu tấn công như XSS (Cross-Site Scripting) bằng cách xử lý dữ liệu người dùng nhập vào để không cho các đoạn script độc hại chạy trên trang web.
- ...v.v., tùy theo yêu cầu nghiệp vụ.

Tóm lại, cốt lõi của kiểm tra ở frontend là **hướng dẫn người dùng nhập đúng** và **nâng cao trải nghiệm tương tác**.

## Kiểm tra ở Backend (Backend Validation)

Kiểm tra ở frontend chỉ là lớp phòng thủ đầu tiên; tuy cải thiện trải nghiệm người dùng nhưng hoàn toàn có thể bị qua mặt. Thành phần thực sự mang tính quyết định là kiểm tra ở backend. Backend cần tiếp cận mọi dữ liệu do frontend gửi lên với tâm thế "có thể có vấn đề" để thẩm tra toàn diện. Kiểm tra ở backend không chỉ phải bao phủ các kiểm tra cơ bản như ở frontend (định dạng, phạm vi, độ dài, v.v.), mà còn cần xác thực chặt chẽ hơn và sâu hơn để bảo đảm an toàn hệ thống và tính nhất quán dữ liệu. Dưới đây là các nội dung trọng tâm của kiểm tra ở backend:

1. **Kiểm tra tính đầy đủ:** Các trường được quy định bắt buộc trong tài liệu API phải có mặt đầy đủ, ví dụ `userId` và `orderId`. Nếu thiếu bất kỳ trường bắt buộc nào, backend phải lập tức trả về lỗi và từ chối xử lý request.
2. **Kiểm tra tính hợp lệ / tồn tại:** Xác minh dữ liệu truyền vào có thực sự hợp lệ và tồn tại hay không. Chẳng hạn `productId` gửi lên có tồn tại trong cơ sở dữ liệu không? `couponId` đã hết hạn hoặc đã được sử dụng chưa? Việc này thường cần truy vấn DB hoặc gọi sang các service khác để xác nhận.
3. **Kiểm tra tính nhất quán:** Đối với các thao tác liên quan đến nhiều đối tượng dữ liệu, xác minh xem chúng có phù hợp với logic nghiệp vụ không. Ví dụ: trước khi cập nhật trạng thái đơn hàng, phải đảm bảo trạng thái hiện tại cho phép chuyển đổi — không thể nhảy cóc trực tiếp từ "Chưa thanh toán" sang "Hoàn thành". Kiểm tra tính nhất quán là chìa khóa đảm bảo luồng chuyển dịch trạng thái dữ liệu chính xác.
4. **Kiểm tra bảo mật:** Backend bắt buộc phải phòng chống nhiều loại tấn công độc hại, bao gồm nhưng không giới hạn ở XSS, SQL Injection, v.v. Mọi dữ liệu đầu vào từ bên ngoài đều phải được lọc và kiểm tra nghiêm ngặt, chẳng hạn dùng truy vấn tham số hóa (parameterized query) để ngăn SQL Injection, hoặc thoát ký tự (escape) dữ liệu HTML trả về để tránh XSS.
5. ...Về cơ bản, mọi thứ frontend kiểm tra được thì vì lý do bảo mật, backend đều phải kiểm tra lại một lần nữa.

Ở backend Java, nếu chỗ nào cũng tự viết tay `if-else` để làm mấy bước kiểm tra cơ bản này thì rất mệt mỏi. Rất may là cộng đồng Java đã cung cấp bộ đặc tả chuẩn **Bean Validation**, cho phép chúng ta dùng **Annotation** để khai báo quy tắc kiểm tra ngay trên các thuộc tính của JavaBean (ví dụ các đối tượng DTO), vô cùng tiện lợi.

- **JSR 303 (1.0):** Đặt nền móng ban đầu, giới thiệu những annotation quen thuộc như `@NotNull`, `@Size`, `@Min`, `@Max`.
- **JSR 349 (1.1):** Bổ sung khả năng kiểm tra cho tham số phương thức và giá trị trả về, cùng các cải tiến như kiểm tra theo nhóm (group validation).
- **JSR 380 (2.0):** Đồng hành cùng Java 8, hỗ trợ Date/Time API mới, đồng thời bổ sung các annotation rất hữu ích như `@NotEmpty`, `@NotBlank`, `@Email`.

Với các phiên bản Spring Boot cũ (khoảng trước 2.3.x), `spring-boot-starter-web` đã tích hợp sẵn `hibernate-validator` nên bạn không cần thêm gì cả.

Từ Spring Boot 2.3.x trở về sau, để linh hoạt hơn, các dependency liên quan đến validation được tách riêng ra. Bạn cần tự thêm dependency `spring-boot-starter-validation`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

Đặc tả Bean Validation cùng các thư viện triển khai (như Hibernate Validator) cung cấp nhiều annotation phong phú giúp định nghĩa quy tắc kiểm tra theo lối khai báo. Dưới đây là một số annotation thường dùng và ý nghĩa của chúng:

- `@NotNull`: Kiểm tra phần tử được gắn annotation (kiểu bất kỳ) không được là `null`.
- `@NotEmpty`: Kiểm tra phần tử được gắn annotation (như `CharSequence`, `Collection`, `Map`, `Array`) không được là `null` và kích thước/độ dài phải lớn hơn 0. Lưu ý: với chuỗi, `@NotEmpty` vẫn chấp nhận chuỗi chỉ chứa khoảng trắng như `" "`.
- `@NotBlank`: Kiểm tra `CharSequence` (như `String`) không được là `null`, đồng thời độ dài sau khi cắt bỏ khoảng trắng hai đầu (`trim`) phải lớn hơn 0 (tức không được là chuỗi trắng).
- `@Null`: Kiểm tra phần tử được gắn annotation bắt buộc phải là `null`.
- `@AssertTrue` / `@AssertFalse`: Kiểm tra phần tử kiểu `boolean` hoặc `Boolean` phải có giá trị là `true` / `false`.
- `@Min(value)` / `@Max(value)`: Kiểm tra giá trị số (hoặc biểu diễn chuỗi của số) phải lớn hơn hoặc bằng / nhỏ hơn hoặc bằng `value` chỉ định. Áp dụng cho các kiểu số nguyên (`byte`, `short`, `int`, `long`, `BigInteger`, v.v.).
- `@DecimalMin(value)` / `@DecimalMax(value)`: Chức năng tương tự `@Min` / `@Max`, nhưng hỗ trợ các kiểu số có phần thập phân (`BigDecimal`, `BigInteger`, `CharSequence`, `byte`, `short`, `int`, `long` cùng các lớp wrapper). `value` phải là chuỗi biểu diễn của số.
- `@Size(min=, max=)`: Kiểm tra kích thước/độ dài của phần tử (như `CharSequence`, `Collection`, `Map`, `Array`) phải nằm trong khoảng `[min, max]` (bao gồm cả hai đầu mút).
- `@Digits(integer=, fraction=)`: Kiểm tra giá trị số (hoặc chuỗi biểu diễn của số) phải có số chữ số phần nguyên `<= integer` và số chữ số phần thập phân `<= fraction`.
- `@Pattern(regexp=, flags=)`: Kiểm tra `CharSequence` (như `String`) có khớp với biểu thức chính quy (`regexp`) chỉ định hay không. `flags` có thể cấu hình chế độ khớp (ví dụ không phân biệt hoa thường).
- `@Email`: Kiểm tra `CharSequence` (như `String`) có đúng định dạng Email hay không (tích hợp sẵn một regex tương đối thoáng).
- `@Past` / `@Future`: Kiểm tra giá trị ngày hoặc giờ (`java.util.Date`, `java.util.Calendar`, hoặc các kiểu trong gói `java.time` của JSR 310) có nằm trước / sau thời điểm hiện tại hay không.
- `@PastOrPresent` / `@FutureOrPresent`: Tương tự `@Past` / `@Future`, nhưng cho phép bằng với thời điểm hiện tại.
- ……

Khi phương thức trong Controller dùng annotation `@RequestBody` để nhận Request Body và ánh xạ vào một đối tượng, có thể thêm annotation `@Valid` trước tham số đó để kích hoạt kiểm tra cho đối tượng. Nếu kiểm tra thất bại, Spring sẽ ném ra ngoại lệ `MethodArgumentNotValidException`.

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Person {
    @NotNull(message = "classId không được để trống")
    private String classId;

    @Size(max = 33)
    @NotNull(message = "name không được để trống")
    private String name;

    @Pattern(regexp = "((^Man$|^Woman$|^UGM$))", message = "Giá trị sex không nằm trong phạm vi cho phép")
    @NotNull(message = "sex không được để trống")
    private String sex;

    @Email(message = "Định dạng email không hợp lệ")
    @NotNull(message = "email không được để trống")
    private String email;
}


@RestController
@RequestMapping("/api")
public class PersonController {
    @PostMapping("/person")
    public ResponseEntity<Person> getPerson(@RequestBody @Valid Person person) {
        return ResponseEntity.ok().body(person);
    }
}
```

Đối với dữ liệu kiểu đơn giản ánh xạ trực tiếp vào tham số phương thức (như Path Variable `@PathVariable` hoặc Request Parameter `@RequestParam`), cách kiểm tra hơi khác một chút:

1. **Thêm annotation `@Validated` lên lớp Controller:** Đây là annotation do Spring cung cấp (không thuộc chuẩn JSR), cho phép Spring xử lý các annotation kiểm tra ở cấp tham số phương thức. **Đây là bước bắt buộc.**
2. **Đặt annotation kiểm tra trực tiếp trên tham số phương thức:** Gắn trực tiếp `@Min`, `@Max`, `@Size`, `@Pattern`, v.v. lên tham số `@PathVariable` hoặc `@RequestParam` tương ứng.

Tuyệt đối đừng quên gắn `@Validated` lên lớp Controller, tham số này giúp báo cho Spring biết cần kiểm tra tham số phương thức.

```java
@RestController
@RequestMapping("/api")
@Validated // Bước quan trọng 1: Bắt buộc phải thêm @Validated lên lớp
public class PersonController {

    @GetMapping("/person/{id}")
    public ResponseEntity<Integer> getPersonByID(
            @PathVariable("id")
            @Max(value = 5, message = "ID không được vượt quá 5") // Bước quan trọng 2: Đặt annotation kiểm tra trực tiếp lên tham số
            Integer id
    ) {
        // Nếu truyền vào id > 5, Spring sẽ ném ngoại lệ ConstraintViolationException trước khi đi vào thân hàm.
        // Bộ xử lý ngoại lệ toàn cục (Global Exception Handler) cũng cần bắt và xử lý ngoại lệ này.
        return ResponseEntity.ok().body(id);
    }

    @GetMapping("/person")
    public ResponseEntity<String> findPersonByName(
            @RequestParam("name")
            @NotBlank(message = "Tên không được để trống") // Áp dụng tương tự cho @RequestParam
            @Size(max = 10, message = "Độ dài tên không được vượt quá 10")
            String name
    ) {
        return ResponseEntity.ok().body("Found person: " + name);
    }
}
```

Bean Validation chủ yếu giải quyết việc kiểm tra ở mức **định dạng dữ liệu và cú pháp**. Nhưng chỉ có chừng đó vẫn chưa đủ.

## Kiểm tra Quyền hạn (Authorization Check)

Định dạng dữ liệu đã kiểm tra xong xuôi hết rồi. Nhưng **thao tác này, người dùng đang đăng nhập hiện tại có quyền làm không?** Đó chính là vấn đề mà **kiểm tra quyền hạn** phải giải quyết. Ví dụ:

- Người dùng bình thường có thể sửa đơn hàng của người khác không? (Không được)
- Khách vãng lai có thể truy cập API trang quản trị admin không? (Không được)
- Khách vãng lai có thể quản lý thông tin của người dùng khác không? (Không được)
- Người dùng VIP có thể dùng mã giảm giá dành riêng cho VIP không? (Được)
- ……

Kiểm tra dữ liệu và kiểm tra quyền hạn không phải lúc nào cũng tuân theo một thứ tự trước sau cố định giống hệt nhau ở mọi API. Thông thường, nên hoàn thành việc phân tích request (parsing), giới hạn độ dài và kiểm tra định dạng cơ bản trước, đồng thời xác nhận danh tính người dùng càng sớm càng tốt; trước khi tiết lộ cho bên gọi biết tài nguyên có tồn tại hay không hoặc trả về kết quả truy vấn, bắt buộc phải hoàn tất kiểm tra quyền thô (coarse-grained) và kiểm tra quyền ở cấp độ đối tượng (object-level). Khi việc phân quyền phụ thuộc vào thuộc tính của tài nguyên, có thể đưa thẳng điều kiện phân quyền vào câu truy vấn hoặc kiểm tra ngay sau khi đọc ra, nhưng tuyệt đối không được làm rò rỉ thông tin tài nguyên khi chưa được ủy quyền. Sau đó mới đưa phần kiểm tra tính nhất quán nghiệp vụ và phân quyền hạt mịn hơn vào tầng Service hoặc tầng truy cập dữ liệu để thực thi theo ngữ nghĩa giao dịch (transaction).

Kiểm tra quyền hạn quan tâm đến việc "**Ai (Who)** có thể thực hiện **Thao tác nào (Action)** đối với **Tài nguyên nào (What)**". Dù phân tầng luồng xử lý ra sao, cũng không bao giờ được phép trả về nội dung tài nguyên khi chưa có quyền, và cũng không thể chỉ dựa vào một lần kiểm tra ở Controller hay ở frontend.

**Tại sao kiểm tra quyền hạn lại quan trọng đến vậy?**

- **Nền tảng bảo mật:** Ngăn chặn truy cập và thao tác trái phép, bảo vệ dữ liệu người dùng và an toàn hệ thống.
- **Cô lập nghiệp vụ:** Đảm bảo các vai trò khác nhau (quản trị viên, người dùng thường, người dùng VIP, v.v.) chỉ có thể truy cập và thao tác các chức năng trong phạm vi quyền hạn của mình.
- **Yêu cầu tuân thủ (Compliance):** Nhiều quy định pháp lý và tiêu chuẩn ngành đặt ra yêu cầu rất nghiêm ngặt về quyền truy cập dữ liệu.

Hiện nay, phương thức phổ biến ở backend Java là sử dụng các framework bảo mật uy tín để triển khai phân quyền thay vì tự viết tay (dễ sai sót và khó bảo trì):

1. **Spring Security (Tiêu chuẩn ngành, được khuyến nghị):** Dựa trên chuỗi bộ lọc (`Filter Chain`) để chặn request, thực hiện xác thực (`Authentication` — Bạn là ai?) và ủy quyền (`Authorization` — Bạn được làm gì?). Spring Security rất mạnh mẽ, cộng đồng sôi động và tích hợp liền mạch với hệ sinh thái Spring. Tuy nhiên cấu hình tương đối phức tạp và đường cong học tập khá dốc.
2. **Apache Shiro:** Một framework bảo mật phổ biến khác, nhẹ hơn so với Spring Security, API trực quan và dễ hiểu hơn. Cũng cung cấp đầy đủ xác thực, phân quyền, quản lý phiên, mã hóa, v.v. Với các dự án không quen Spring hoặc thấy Spring Security quá nặng, đây là một lựa chọn rất ổn.
3. **Sa-Token:** Framework xác thực và phân quyền Java nhẹ xuất xứ từ Trung Quốc. Hỗ trợ xác thực phân quyền, SSO, đá người dùng đăng xuất (kick-out), tự động gia hạn token, v.v. So với Spring Security và Shiro, Sa-Token tích hợp sẵn nhiều tính năng dùng ngay hơn và cách sử dụng cũng đơn giản hơn.
4. **Kiểm tra thủ công (Không khuyến nghị cho kịch bản phức tạp):** Tự lấy thông tin người dùng hiện tại trong tầng Service hoặc Controller (ví dụ từ `SecurityContextHolder` hoặc `Session`), sau đó dùng `if-else` để kiểm tra vai trò hoặc quyền của người dùng. Cách này làm logic phân quyền bị trộn lẫn với logic nghiệp vụ, trùng lặp code, khó bảo trì và rất dễ bỏ sót. Chỉ phù hợp với các kịch bản phân quyền cực kỳ đơn giản.

**Giới thiệu ngắn về các mô hình phân quyền:**

- **RBAC (Role-Based Access Control):** Kiểm soát truy cập dựa trên vai trò. Gán vai trò cho người dùng và gán quyền cho vai trò; người dùng sở hữu tổng hợp quyền của tất cả vai trò mình nắm giữ. Đây là mô hình phổ biến nhất.
- **ABAC (Attribute-Based Access Control):** Kiểm soát truy cập dựa trên thuộc tính. Quyết định dựa trên thuộc tính người dùng, thuộc tính tài nguyên, thuộc tính thao tác và thuộc tính môi trường. Linh hoạt hơn nhưng cũng phức tạp hơn.

Thông thường, đại đa số hệ thống đều sử dụng mô hình phân quyền RBAC hoặc phiên bản rút gọn của nó, minh họa như sơ đồ dưới đây:

![Sơ đồ mô hình phân quyền RBAC](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/rbac-a304d5af.png)

Để tìm hiểu chi tiết về thiết kế hệ thống phân quyền, bạn có thể xem bài viết này: [Giải thích chi tiết về Thiết kế Hệ thống Phân quyền](https://javaguide.cn/system-design/security/design-of-authority-system.html).

## Tổng kết

Tóm lại, để xây dựng một ứng dụng Web an toàn, ổn định và có trải nghiệm người dùng tốt, cả ba chốt chặn là kiểm tra dữ liệu frontend, kiểm tra dữ liệu backend và kiểm tra quyền hạn backend đều phải được thiết lập bài bản, mỗi chốt có vai trò riêng:

- **Kiểm tra dữ liệu Frontend:** Nâng cao trải nghiệm người dùng, giảm request vô ích — là tuyến phòng thủ "thân thiện" đầu tiên.
- **Kiểm tra dữ liệu Backend:** Đảm bảo dữ liệu đúng định dạng, phù hợp quy tắc nghiệp vụ — là tuyến phòng thủ "kỹ thuật" ngăn "dữ liệu bẩn" lọt vào cơ sở dữ liệu. Bean Validation cho phép chúng ta dùng annotation để khai báo quy tắc kiểm tra trực tiếp trên thuộc tính của JavaBean (như các đối tượng DTO), vô cùng thuận tiện.
- **Kiểm tra quyền hạn Backend:** Đảm bảo "đúng người" làm "đúng việc" — là tuyến phòng thủ "bảo mật" ngăn chặn hành vi vượt quyền. Các framework như Spring Security, Shiro, Sa-Token giúp chúng ta triển khai việc phân quyền hiệu quả.

## Tài liệu tham khảo

- OWASP Authorization Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>
- Tại sao cả frontend và backend đều cần kiểm tra dữ liệu?: <https://juejin.cn/post/7306045519099658240>
- Giải thích chi tiết về Thiết kế Hệ thống Phân quyền: <https://javaguide.cn/system-design/security/design-of-authority-system.html>
