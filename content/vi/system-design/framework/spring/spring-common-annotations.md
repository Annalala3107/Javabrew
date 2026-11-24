---
title: Tổng hợp các Annotation thường dùng trong Spring, Spring MVC & Spring Boot
description: "Tổng hợp đầy đủ các annotation thường dùng trong Spring và Spring Boot, giải thích chi tiết cách sử dụng những annotation cốt lõi như @Autowired, @Component và @RequestMapping."
category: Framework
tag:
  - SpringBoot
  - Spring
lang: vi
sourceRef: zh-ref/system-design/framework/spring/spring-common-annotations.md
head:
  - - meta
    - name: keywords
      content: Spring Annotation,Spring Boot Annotation,@SpringBootApplication,@Autowired,@RequestMapping,@Configuration,@Component,Annotation thường dùng
---

Không quá lời khi nói rằng các annotation thường dùng trong Spring/Spring Boot được giới thiệu trong bài viết này đã bao quát hầu hết các tình huống phổ biến mà bạn sẽ gặp trong công việc hàng ngày. Mỗi annotation đều đi kèm hướng dẫn sử dụng cụ thể—nắm vững các nội dung này rồi thì việc phát triển dự án với Spring Boot cơ bản sẽ không còn gặp trở ngại lớn nào nữa!

**Vì sao mình viết bài này?**

Gần đây mình thấy trên mạng có một bài viết về các annotation thường dùng trong Spring Boot được chia sẻ rất rộng rãi, nhưng nội dung bên trong có vài điểm dễ gây hiểu nhầm, không thực sự thân thiện với các lập trình viên chưa có nhiều kinh nghiệm thực chiến. Vì vậy mình đã dành vài ngày tổng hợp lại bài viết này, hy vọng có thể giúp mọi người hiểu rõ và sử dụng các Spring annotation đúng cách hơn.

**Do năng lực và thời gian cá nhân có hạn, nếu có bất kỳ sai sót hay thiếu sót nào, rất mong nhận được góp ý từ các bạn! Xin chân thành cảm ơn!**

## Annotation nền tảng của Spring Boot

`@SpringBootApplication` là annotation cốt lõi của một ứng dụng Spring Boot, thường được dùng để đánh dấu lớp khởi chạy chính (main startup class).

Ví dụ:

```java
@SpringBootApplication
public class SpringSecurityJwtGuideApplication {
      public static void main(java.lang.String[] args) {
        SpringApplication.run(SpringSecurityJwtGuideApplication.class, args);
    }
}
```

Chúng ta có thể xem `@SpringBootApplication` như sự kết hợp của ba annotation sau:

- **`@EnableAutoConfiguration`**: Kích hoạt cơ chế tự động cấu hình (Auto-Configuration) của Spring Boot.
- **`@ComponentScan`**: Quét các lớp được gắn annotation như `@Component`, `@Service`, `@Repository`, `@Controller`, v.v.
- **`@Configuration`**: Cho phép đăng ký thêm các Spring Bean bổ sung hoặc import các lớp cấu hình khác.

Mã nguồn như sau:

```java
package org.springframework.boot.autoconfigure;
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(excludeFilters = {
    @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
    @Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class) })
public @interface SpringBootApplication {
   ......
}

package org.springframework.boot;
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Configuration
public @interface SpringBootConfiguration {

}
```

## Spring Bean

### Dependency Injection (DI)

`@Autowired` được dùng để tự động tiêm các phụ thuộc (tức là các Spring Bean khác). Annotation này có thể được đặt trên constructor, field, phương thức setter hoặc phương thức cấu hình; Spring container sẽ tự động tìm Bean có kiểu khớp và inject vào.

```java
@Service
public class UserServiceImpl implements UserService {
    // ...
}

@RestController
public class UserController {
    // Field injection
    @Autowired
    private UserService userService;
    // ...
}
```

Khi có nhiều Bean cùng một kiểu dữ liệu, cơ chế inject mặc định theo kiểu (by type) của `@Autowired` có thể gây nhập nhằng. Lúc này, bạn có thể kết hợp với `@Qualifier` để chỉ định tên Bean nhằm chọn chính xác instance cần inject.

```java
@Repository("userRepositoryA")
public class UserRepositoryA implements UserRepository { /* ... */ }

@Repository("userRepositoryB")
public class UserRepositoryB implements UserRepository { /* ... */ }

@Service
public class UserService {
    @Autowired
    @Qualifier("userRepositoryA") // Chỉ định inject Bean có tên "userRepositoryA"
    private UserRepository userRepository;
    // ...
}
```

`@Primary` cũng nhằm giải quyết bài toán inject khi tồn tại nhiều Bean instance cùng kiểu. Khi định nghĩa Bean (ví dụ dùng `@Bean` hoặc annotation trên class), việc gắn thêm `@Primary` biểu thị rằng Bean đó là đối tượng **được ưu tiên hàng đầu** khi inject. Khi dùng `@Autowired` mà không chỉ định tên qua `@Qualifier`, Spring sẽ ưu tiên chọn Bean có `@Primary`.

```java
@Primary // Đặt UserRepositoryA làm đối tượng ưu tiên inject
@Repository("userRepositoryA")
public class UserRepositoryA implements UserRepository { /* ... */ }

@Repository("userRepositoryB")
public class UserRepositoryB implements UserRepository { /* ... */ }

@Service
public class UserService {
    @Autowired // Tự động inject UserRepositoryA vì nó được đánh dấu @Primary
    private UserRepository userRepository;
    // ...
}
```

`@Resource(name="beanName")` là annotation thuộc đặc tả JSR-250, cũng được dùng cho Dependency Injection. Mặc định nó tìm Bean **theo tên (by Name)** để inject, trong khi `@Autowired` mặc định inject **theo kiểu (by Type)**. Nếu không chỉ định thuộc tính `name`, nó sẽ thử tìm theo tên field hoặc tên phương thức; nếu không tìm thấy, nó sẽ quay về tìm theo kiểu (tương tự `@Autowired`).

`@Resource` chỉ có thể gắn trên field và phương thức setter, không hỗ trợ constructor injection.

```java
@Service
public class UserService {
    @Resource(name = "userRepositoryA")
    private UserRepository userRepository;
    // ...
}
```

### Scope của Bean

`@Scope("scopeName")` định nghĩa phạm vi (scope) của Spring Bean, tức vòng đời và phạm vi hiển thị của Bean instance. Các scope thường dùng gồm:

- **singleton**: Chỉ có duy nhất một Bean instance trong IoC container. Mặc định mọi Bean trong Spring đều là singleton, là ứng dụng của design pattern Singleton.
- **prototype**: Mỗi lần lấy ra đều tạo một Bean instance mới. Nghĩa là gọi `getBean()` hai lần liên tiếp sẽ thu được hai Bean instance khác nhau.
- **request** (chỉ khả dụng trong ứng dụng Web): Mỗi HTTP request sẽ tạo ra một Bean mới (request Bean), và Bean này chỉ có hiệu lực trong phạm vi HTTP request hiện tại.
- **session** (chỉ khả dụng trong ứng dụng Web): Mỗi HTTP request đến từ một session mới sẽ tạo ra một Bean mới (session Bean), và Bean này chỉ có hiệu lực trong phạm vi HTTP session hiện tại.
- **application/global-session** (chỉ khả dụng trong ứng dụng Web): Mỗi ứng dụng Web khi khởi động sẽ tạo một Bean (application Bean), và Bean này có hiệu lực trong suốt thời gian ứng dụng hoạt động.
- **websocket** (chỉ khả dụng trong ứng dụng Web): Mỗi phiên WebSocket sẽ tạo ra một Bean mới.

```java
@Component
// Mỗi lần lấy ra đều tạo một instance PrototypeBean mới
@Scope("prototype")
public class PrototypeBean {
    // ...
}
```

### Đăng ký Bean

Spring container cần biết những class nào cần được quản lý như Bean. Ngoài cách khai báo tường minh bằng phương thức `@Bean` (thường nằm trong class `@Configuration`), cách phổ biến hơn là dùng các Stereotype annotation đánh dấu lên class, kết hợp với cơ chế Component Scanning để Spring tự động phát hiện và đăng ký các class đó thành Bean. Sau đó các Bean này có thể được inject vào component khác thông qua `@Autowired` hoặc các cách tương tự.

Dưới đây là một số annotation đăng ký Bean thường gặp:

- `@Component`: Annotation dùng chung, có thể đánh dấu bất kỳ class nào là một component của `Spring`. Nếu chưa rõ một Bean thuộc tầng nào, bạn có thể dùng annotation `@Component`.
- `@Repository`: Tương ứng với tầng Persistence (tức tầng DAO), chủ yếu dùng cho các thao tác liên quan đến cơ sở dữ liệu.
- `@Service`: Tương ứng với tầng Service, chủ yếu xử lý các nghiệp vụ phức tạp và cần gọi xuống tầng DAO.
- `@Controller`: Tương ứng với tầng Controller của Spring MVC, chủ yếu tiếp nhận request từ người dùng, gọi tầng Service và trả dữ liệu về giao diện frontend.
- `@RestController`: Một composed annotation, tương đương với `@Controller` + `@ResponseBody`. Nó chuyên dùng để xây dựng controller cho các dịch vụ Web RESTful. Trong class được gắn `@RestController`, giá trị trả về của tất cả handler method đều được tự động serialize (thường là JSON) và ghi trực tiếp vào HTTP response body thay vì được phân giải thành tên view.

`@Controller` vs `@RestController`:

- `@Controller`: Chủ yếu dùng trong các ứng dụng Spring MVC truyền thống, giá trị trả về của phương thức thường là tên view logic, cần ViewResolver phối hợp để render trang. Nếu cần trả về dữ liệu (như JSON), bạn phải gắn thêm `@ResponseBody` lên phương thức đó.
- `@RestController`: Được thiết kế chuyên biệt cho RESTful API trả về dữ liệu. Khi gắn annotation này lên class, giá trị trả về của mọi phương thức mặc định được coi là nội dung response body (tương đương việc ngầm thêm `@ResponseBody` cho từng phương thức), thường dùng để trả về dữ liệu JSON hoặc XML. Trong các ứng dụng tách biệt frontend–backend hiện đại, `@RestController` là lựa chọn phổ biến hơn.

Về so sánh giữa `@RestController` và `@Controller`, hãy xem thêm bài viết này: [@RestController vs @Controller](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247485544&idx=1&sn=3cc95b88979e28fe3bfe539eb421c6d8&chksm=cea247a3f9d5ceb5e324ff4b8697adc3e828ecf71a3468445e70221cce768d1e722085359907&token=1725092312&lang=zh_CN#rd).

## Cấu hình (Configuration)

### Khai báo lớp cấu hình

`@Configuration` chủ yếu dùng để khai báo một class là lớp cấu hình của Spring. Dù cũng có thể thay bằng annotation `@Component`, `@Configuration` thể hiện mục đích của class (định nghĩa Bean) một cách tường minh hơn, ngữ nghĩa rõ ràng hơn, và giúp Spring thực hiện các xử lý đặc thù (ví dụ: dùng CGLIB proxy để đảm bảo hành vi singleton cho các phương thức `@Bean`).

```java
@Configuration
public class AppConfig {

    // Annotation @Bean dùng để khai báo một Bean trong lớp cấu hình
    @Bean
    public TransferService transferService() {
        return new TransferServiceImpl();
    }

    // Một lớp cấu hình có thể chứa một hoặc nhiều phương thức @Bean.
}
```

### Đọc thông tin cấu hình

Trong quá trình phát triển ứng dụng, chúng ta thường xuyên cần quản lý nhiều thông tin cấu hình như chi tiết kết nối database, khóa bí mật hoặc endpoint của các dịch vụ bên thứ ba (như Alibaba Cloud OSS, dịch vụ SMS, xác thực WeChat), v.v. Thông thường, các thông tin này được **lưu tập trung trong file cấu hình** (như `application.yml` hoặc `application.properties`) để tiện quản lý và chỉnh sửa.

Spring cung cấp nhiều cách thuận tiện để đọc các thông tin cấu hình này. Giả sử chúng ta có file `application.yml` sau:

```yaml
wuhan2020: Đầu năm 2020 dịch COVID-19 bùng phát tại Vũ Hán, tình hình dịch bệnh rất nghiêm trọng, nhưng mình tin mọi chuyện rồi sẽ qua! Vũ Hán cố lên! Trung Quốc cố lên!

my-profile:
  name: Anh Guide
  email: koushuangbwcx@163.com

library:
  location: Vũ Hán, Hồ Bắc - Cố lên Trung Quốc!
  books:
    - name: Thiên Tài Cơ Bản Pháp
      description: Vào ngày cha mình được chẩn đoán mắc bệnh Alzheimer, cô gái hai mươi hai tuổi Lâm Triêu Tịch hay tin Bùi Chi—nam thần học đường mà cô thầm thương nhiều năm—sắp ra nước ngoài học lên cao; ngôi trường đối phương thi đỗ lại chính là ngôi trường năm xưa cha cô đã từ bỏ vì cô.
    - name: Trật Tự Của Thời Gian
      description: Vì sao chúng ta nhớ quá khứ chứ không phải tương lai? Thời gian "trôi qua" có nghĩa là gì? Chúng ta tồn tại trong thời gian, hay thời gian tồn tại trong chúng ta? Bằng ngôn từ giàu chất thơ, Carlo Rovelli mời gọi chúng ta suy ngẫm về bài toán muôn thuở này—bản chất của thời gian.
    - name: Phiên Bản Tuyệt Vời Của Chính Mình
      description: Làm thế nào để hình thành một thói quen mới? Làm sao để tâm trí trưởng thành hơn? Làm thế nào để có những mối quan hệ chất lượng? Và làm sao để bước qua những thời khắc khó khăn của cuộc đời?
```

Dưới đây là một số cách đọc cấu hình thường dùng:

1. `@Value("${property.key}")` inject giá trị của một thuộc tính đơn lẻ trong file cấu hình (như `application.properties` hoặc `application.yml`). Nó cũng hỗ trợ Spring Expression Language (SpEL), cho phép thực hiện các logic inject phức tạp hơn.

```java
@Value("${wuhan2020}")
String wuhan2020;
```

2. `@ConfigurationProperties` có thể đọc thông tin cấu hình và binding vào một Bean, được sử dụng phổ biến hơn.

```java
@Component
@ConfigurationProperties(prefix = "library")
class LibraryProperties {
    @NotEmpty
    private String location;
    private List<Book> books;

    @Setter
    @Getter
    @ToString
    static class Book {
        String name;
        String description;
    }
  // lược bỏ getter/setter
  ......
}
```

Bạn có thể inject nó vào class khác để sử dụng giống như một Spring Bean thông thường.

```java
@Service
public class LibraryService {

    private final LibraryProperties libraryProperties;

    @Autowired
    public LibraryService(LibraryProperties libraryProperties) {
        this.libraryProperties = libraryProperties;
    }

    public void printLibraryInfo() {
        System.out.println(libraryProperties);
    }
}
```

### Nạp file cấu hình chỉ định

Annotation `@PropertySource` cho phép nạp các file cấu hình tùy chỉnh, phù hợp cho các tình huống cần tách riêng một phần thông tin cấu hình ra file độc lập.

```java
@Component
@PropertySource("classpath:website.properties")

class WebSite {
    @Value("${url}")
    private String url;

  // lược bỏ getter/setter
  ......
}
```

**Lưu ý**: Khi sử dụng `@PropertySource`, hãy đảm bảo đường dẫn file bên ngoài là chính xác và file đó nằm trong classpath.

Để xem thêm nội dung chi tiết, hãy tham khảo bài viết của mình: [10 phút làm chủ cách đọc file cấu hình thanh lịch trong Spring Boot](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247486181&idx=2&sn=10db0ae64ef501f96a5b0dbc4bd78786&chksm=cea2452ef9d5cc384678e456427328600971180a77e40c13936b19369672ca3e342c26e92b50&token=816772476&lang=zh_CN#rd).

## MVC

### HTTP Request

**5 loại request thường gặp:**

- **GET**: Yêu cầu lấy một tài nguyên cụ thể từ server. Ví dụ: `GET /users` (lấy tất cả sinh viên).
- **POST**: Tạo một tài nguyên mới trên server. Ví dụ: `POST /users` (tạo mới sinh viên).
- **PUT**: Cập nhật tài nguyên trên server (client gửi lên toàn bộ tài nguyên sau khi cập nhật). Ví dụ: `PUT /users/12` (cập nhật sinh viên có mã 12).
- **DELETE**: Xóa một tài nguyên cụ thể khỏi server. Ví dụ: `DELETE /users/12` (xóa sinh viên có mã 12).
- **PATCH**: Cập nhật tài nguyên trên server (client chỉ gửi các thuộc tính thay đổi, có thể coi là cập nhật một phần); ít được sử dụng hơn nên không nêu ví dụ ở đây.

#### GET Request

`@GetMapping("users")` tương đương với `@RequestMapping(value="/users",method=RequestMethod.GET)`.

```java
@GetMapping("/users")
public ResponseEntity<List<User>> getAllUsers() {
  return ResponseEntity.ok(userRepository.findAll());
}
```

#### POST Request

`@PostMapping("users")` tương đương với `@RequestMapping(value="/users",method=RequestMethod.POST)`.

`@PostMapping` thường đi kèm với `@RequestBody` để nhận dữ liệu JSON và ánh xạ thành đối tượng Java.

```java
@PostMapping("/users")
public ResponseEntity<User> createUser(@Valid @RequestBody UserCreateRequest userCreateRequest) {
  User user = userService.create(userCreateRequest);
  return ResponseEntity.status(HttpStatus.CREATED).body(user);
}
```

#### PUT Request

`@PutMapping("/users/{userId}")` tương đương với `@RequestMapping(value="/users/{userId}",method=RequestMethod.PUT)`.

```java
@PutMapping("/users/{userId}")
public ResponseEntity<User> updateUser(@PathVariable(value = "userId") Long userId,
  @Valid @RequestBody UserUpdateRequest userUpdateRequest) {
  ......
}
```

#### DELETE Request

`@DeleteMapping("/users/{userId}")` tương đương với `@RequestMapping(value="/users/{userId}",method=RequestMethod.DELETE)`.

```java
@DeleteMapping("/users/{userId}")
public ResponseEntity deleteUser(@PathVariable(value = "userId") Long userId){
  ......
}
```

#### PATCH Request

Thông thường trong dự án thực tế, chỉ khi `PUT` không đáp ứng đủ nhu cầu thì chúng ta mới dùng `PATCH` request để cập nhật dữ liệu.

```java
  @PatchMapping("/profile")
  public ResponseEntity updateStudent(@RequestBody StudentUpdateRequest studentUpdateRequest) {
        studentRepository.updateDetail(studentUpdateRequest);
        return ResponseEntity.ok().build();
    }
```

### Binding tham số (Parameter Binding)

Khi xử lý HTTP request, Spring MVC cung cấp nhiều annotation để bind tham số từ request vào tham số của phương thức. Dưới đây là các cách bind tham số phổ biến:

#### Trích xuất tham số từ đường dẫn URL

`@PathVariable` được dùng để trích xuất tham số từ đường dẫn URL. Ví dụ:

```java
@GetMapping("/klasses/{klassId}/teachers")
public List<Teacher> getTeachersByClass(@PathVariable("klassId") Long klassId) {
    return teacherService.findTeachersByClass(klassId);
}
```

Nếu URL request là `/klasses/123/teachers`, thì `klassId = 123`.

#### Binding Query Parameter

`@RequestParam` được dùng để bind các tham số truy vấn (query parameters). Ví dụ:

```java
@GetMapping("/klasses/{klassId}/teachers")
public List<Teacher> getTeachersByClass(@PathVariable Long klassId,
                                        @RequestParam(value = "type", required = false) String type) {
    return teacherService.findTeachersByClassAndType(klassId, type);
}
```

Nếu URL request là `/klasses/123/teachers?type=web`, thì `klassId = 123`, `type = web`.

#### Binding dữ liệu JSON trong Request Body

`@RequestBody` được dùng để đọc phần body của Request (có thể là POST, PUT, DELETE, GET) với định dạng **`Content-Type: application/json`**, sau đó tự động bind dữ liệu nhận được vào đối tượng Java. Hệ thống sẽ dùng `HttpMessageConverter` hoặc `HttpMessageConverter` tùy chỉnh để chuyển chuỗi JSON trong request body thành đối tượng Java.

Mình sẽ lấy một ví dụ đơn giản để minh họa cách sử dụng cơ bản!

Chúng ta có một API đăng ký:

```java
@PostMapping("/sign-up")
public ResponseEntity signUp(@RequestBody @Valid UserRegisterRequest userRegisterRequest) {
  userService.save(userRegisterRequest);
  return ResponseEntity.ok().build();
}
```

Đối tượng `UserRegisterRequest`:

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserRegisterRequest {
    @NotBlank
    private String userName;
    @NotBlank
    private String password;
    @NotBlank
    private String fullName;
}
```

Chúng ta gửi một POST request đến API này kèm dữ liệu JSON trong body:

```json
{ "userName": "coder", "fullName": "shuangkou", "password": "123456" }
```

Như vậy backend có thể ánh xạ trực tiếp dữ liệu định dạng JSON lên class `UserRegisterRequest` của chúng ta.

![](/media/jg/local/system-design/framework/spring/images/spring-annotations/RequestBody-df51ab.png)

**Lưu ý**:

- Một phương thức chỉ có thể có duy nhất một tham số `@RequestBody`, nhưng có thể có nhiều tham số `@PathVariable` và `@RequestParam`.
- Nếu cần nhận nhiều đối tượng phức tạp, bạn nên gộp chúng lại thành một đối tượng duy nhất.

## Kiểm tra hợp lệ dữ liệu (Data Validation)

Kiểm tra hợp lệ dữ liệu là khâu then chốt để đảm bảo tính ổn định và an toàn của hệ thống. Ngay cả khi giao diện người dùng (frontend) đã thực hiện kiểm tra dữ liệu, **dịch vụ backend vẫn bắt buộc phải kiểm tra lại dữ liệu nhận được**. Nguyên nhân là kiểm tra ở frontend có thể dễ dàng bị qua mặt (chẳng hạn sửa request qua công cụ lập trình viên của trình duyệt hoặc dùng Postman, curl và các công cụ HTTP khác gọi thẳng API), khiến dữ liệu độc hại hoặc sai định dạng đi thẳng vào backend. Do đó, kiểm tra ở backend là tuyến phòng thủ cuối cùng—và cũng là quan trọng nhất—để ngăn chặn dữ liệu không hợp lệ, duy trì tính nhất quán dữ liệu và đảm bảo logic nghiệp vụ vận hành đúng đắn.

Bean Validation là một bộ đặc tả chuẩn định nghĩa việc kiểm tra tham số cho JavaBean (JSR 303, 349, 380). Nó cung cấp một loạt annotation có thể gắn trực tiếp lên các thuộc tính của JavaBean, giúp thực hiện việc kiểm tra tham số một cách gọn gàng.

- **JSR 303 (Bean Validation 1.0):** Đặt nền móng ban đầu, giới thiệu các annotation kiểm tra cốt lõi (như `@NotNull`, `@Size`, `@Min`, `@Max`, v.v.), định nghĩa cách kiểm tra thuộc tính JavaBean thông qua annotation, đồng thời hỗ trợ kiểm tra đối tượng lồng nhau và validator tùy chỉnh.
- **JSR 349 (Bean Validation 1.1):** Mở rộng trên nền tảng 1.0, chẳng hạn bổ sung hỗ trợ kiểm tra tham số và giá trị trả về của phương thức, tăng cường xử lý kiểm tra theo nhóm (Group Validation).
- **JSR 380 (Bean Validation 2.0):** Đón nhận các tính năng mới của Java 8 và mang lại một số cải tiến, như hỗ trợ các kiểu ngày giờ trong gói `java.time` và bổ sung thêm các annotation kiểm tra mới (như `@NotEmpty`, `@NotBlank`, v.v.).

Bản thân Bean Validation chỉ là một bộ **đặc tả (gồm các interface và annotation)**; chúng ta cần một **framework cụ thể** triển khai bộ đặc tả này để thực thi logic kiểm tra. Hiện nay, **Hibernate Validator** là bản cài đặt tham chiếu uy tín và được sử dụng rộng rãi nhất của đặc tả Bean Validation.

- Hibernate Validator 4.x triển khai Bean Validation 1.0 (JSR 303).
- Hibernate Validator 5.x triển khai Bean Validation 1.1 (JSR 349).
- Hibernate Validator 6.x triển khai Bean Validation 2.0 (JSR 380), sử dụng tên package `javax.validation`.
- Hibernate Validator 7.x và 8.x triển khai Jakarta Bean Validation 3.0, sử dụng tên package `jakarta.validation`; Hibernate Validator 9.x triển khai Jakarta Validation 3.1.

Sử dụng Bean Validation trong dự án Spring Boot rất thuận tiện nhờ khả năng tự động cấu hình của Spring Boot. Về phần khai báo dependency, cần lưu ý:

- Ở các phiên bản Spring Boot cũ hơn (thường là trước 2.3.x), dependency `spring-boot-starter-web` mặc định đã bao gồm `hibernate-validator`. Vì vậy chỉ cần thêm Web Starter là không cần thêm dependency kiểm tra dữ liệu riêng.
- Từ phiên bản Spring Boot 2.3.x trở đi, để quản lý dependency tinh gọn hơn, các dependency liên quan đến validation đã được tách ra khỏi `spring-boot-starter-web`. Nếu dự án của bạn dùng phiên bản này hoặc mới hơn và cần dùng tính năng Bean Validation, bạn cần khai báo tường minh dependency `spring-boot-starter-validation`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

![](/media/jg/ext/oss.javaguide.cn/2021/03/c7bacd12-1c1a-4e41-aaaf-4cad840fc073-deea861a.png)

Các dự án không dùng Spring Boot cần tự thêm các dependency liên quan, phần này mình không đi sâu ở đây; chi tiết bạn có thể xem bài viết: [Làm thế nào để kiểm tra tham số trong Spring/Spring Boot? Mọi thứ bạn cần biết đều ở đây!](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247485783&idx=1&sn=a407f3b75efa17c643407daa7fb2acd6&chksm=cea2469cf9d5cf8afbcd0a8a1c9cc4294d6805b8e01bee6f76bb2884c5bc15478e91459def49&token=292197051&lang=zh_CN#rd).

👉 Lưu ý: Hãy ưu tiên sử dụng các constraint annotation do đặc tả Bean Validation / Jakarta Validation cung cấp, thay vì các ràng buộc riêng của Hibernate Validator. Spring Boot 2.x thường dùng `javax.validation.constraints`, còn Spring Boot 3.x trở lên dùng `jakarta.validation.constraints`.

### Một số Annotation kiểm tra trường thường dùng

Đặc tả Bean Validation cùng các bản triển khai của nó (như Hibernate Validator) cung cấp nhiều annotation giúp định nghĩa quy tắc kiểm tra theo kiểu khai báo (declarative). Dưới đây là một số annotation phổ biến và giải thích đi kèm:

- `@NotNull`: Kiểm tra phần tử được gắn annotation (kiểu bất kỳ) không được là `null`.
- `@NotEmpty`: Kiểm tra phần tử được gắn annotation (như `CharSequence`, `Collection`, `Map`, `Array`) không được là `null` và kích thước/độ dài của nó không được bằng 0. Lưu ý: đối với chuỗi, `@NotEmpty` vẫn chấp nhận chuỗi chứa ký tự khoảng trắng như `" "`.
- `@NotBlank`: Kiểm tra `CharSequence` được gắn annotation (như `String`) không được là `null` và độ dài sau khi cắt khoảng trắng đầu cuối phải lớn hơn 0 (tức không được là chuỗi toàn khoảng trắng).
- `@Null`: Kiểm tra phần tử được gắn annotation bắt buộc phải là `null`.
- `@AssertTrue` / `@AssertFalse`: Kiểm tra phần tử kiểu `boolean` hoặc `Boolean` được gắn annotation phải có giá trị `true` / `false`.
- `@Min(value)` / `@Max(value)`: Kiểm tra giá trị của kiểu số được gắn annotation (hoặc dạng biểu diễn chuỗi của nó) phải lớn hơn hoặc bằng / nhỏ hơn hoặc bằng `value` chỉ định. Áp dụng cho các kiểu số nguyên (`byte`, `short`, `int`, `long`, `BigInteger`, v.v.).
- `@DecimalMin(value)` / `@DecimalMax(value)`: Chức năng tương tự `@Min` / `@Max`, nhưng áp dụng cho cả kiểu số có phần thập phân (`BigDecimal`, `BigInteger`, `CharSequence`, `byte`, `short`, `int`, `long` cùng các lớp wrapper tương ứng). `value` phải là chuỗi biểu diễn của một số.
- `@Size(min=, max=)`: Kiểm tra kích thước/độ dài của phần tử được gắn annotation (như `CharSequence`, `Collection`, `Map`, `Array`) phải nằm trong khoảng từ `min` đến `max` (bao gồm cả hai đầu mút).
- `@Digits(integer=, fraction=)`: Kiểm tra giá trị kiểu số được gắn annotation (hoặc dạng biểu diễn chuỗi của nó) phải có số chữ số phần nguyên ≤ `integer` và số chữ số phần thập phân ≤ `fraction`.
- `@Pattern(regexp=, flags=)`: Kiểm tra `CharSequence` được gắn annotation (như `String`) có khớp với biểu thức chính quy (`regexp`) chỉ định hay không. `flags` có thể chỉ định chế độ so khớp (như không phân biệt hoa thường).
- `@Email`: Kiểm tra `CharSequence` được gắn annotation (như `String`) có đúng định dạng email hay không (tích hợp sẵn một biểu thức chính quy tương đối thoáng).
- `@Past` / `@Future`: Kiểm tra kiểu ngày hoặc thời gian được gắn annotation (`java.util.Date`, `java.util.Calendar`, các kiểu thuộc gói JSR 310 `java.time`) phải nằm trước / sau thời điểm hiện tại.
- `@PastOrPresent` / `@FutureOrPresent`: Tương tự `@Past` / `@Future`, nhưng cho phép bằng thời điểm hiện tại.
- ……

### Kiểm tra Request Body (`RequestBody`)

Khi phương thức Controller sử dụng annotation `@RequestBody` để nhận request body và bind vào một đối tượng, bạn có thể thêm annotation `@Valid` trước tham số đó để kích hoạt việc kiểm tra đối tượng. Nếu kiểm tra thất bại, nó sẽ ném ra `MethodArgumentNotValidException`.

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

### Kiểm tra tham số Request (Path Variables và Request Parameters)

Đối với dữ liệu kiểu đơn giản được ánh xạ trực tiếp vào tham số phương thức (như biến đường dẫn `@PathVariable` hoặc tham số truy vấn `@RequestParam`), cách kiểm tra sẽ khác nhau tùy theo phiên bản Spring Framework:

1. **Spring Framework 6.1 trở lên**: Spring MVC hỗ trợ sẵn Handler Method Validation. Chỉ cần đặt trực tiếp các constraint annotation như `@Min`, `@Max`, `@Size`, `@Pattern` lên tham số phương thức, và không gắn `@Validated` lên class Controller—nếu không hệ thống sẽ chuyển sang cơ chế method validation dựa trên AOP.
2. **Spring Framework 6.0 trở về trước**: Thường cần gắn annotation `@Validated` của Spring lên class Controller để xử lý ràng buộc tham số thông qua hạ tầng method validation.

Dưới đây là ví dụ theo cơ chế kiểm tra tích hợp sẵn của Spring Framework 6.1 trở lên:

```java
@RestController
@RequestMapping("/api")
public class PersonController {

    @GetMapping("/person/{id}")
    public ResponseEntity<Integer> getPersonByID(
            @PathVariable("id")
            @Max(value = 5, message = "ID không được vượt quá 5")
            Integer id
    ) {
        // Spring MVC 6.1+ sẽ ném ra HandlerMethodValidationException trước khi đi vào thân phương thức.
        return ResponseEntity.ok().body(id);
    }

    @GetMapping("/person")
    public ResponseEntity<String> findPersonByName(
            @RequestParam("name")
            @NotBlank(message = "Tên không được để trống") // Tương tự với @RequestParam
            @Size(max = 10, message = "Độ dài tên không được vượt quá 10")
            String name
    ) {
        return ResponseEntity.ok().body("Found person: " + name);
    }
}
```

## Xử lý ngoại lệ toàn cục (Global Exception Handling)

Giới thiệu cơ chế xử lý ngoại lệ toàn cục cho tầng Controller—thành phần không thể thiếu trong các dự án Spring.

**Các annotation liên quan:**

1. `@ControllerAdvice`: Annotation định nghĩa lớp xử lý ngoại lệ toàn cục.
2. `@ExceptionHandler`: Annotation khai báo phương thức xử lý ngoại lệ.

Sử dụng như thế nào? Hãy lấy phần kiểm tra hợp lệ tham số ở Mục 5 làm ví dụ. Nếu tham số phương thức không hợp lệ, `MethodArgumentNotValidException` sẽ được ném ra, và chúng ta sẽ xử lý ngoại lệ này.

```java
@ControllerAdvice
@ResponseBody
public class GlobalExceptionHandler {

    /**
     * Xử lý ngoại lệ tham số request
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex, HttpServletRequest request) {
       ......
    }
}
```

Để xem thêm về xử lý ngoại lệ trong Spring Boot, hãy đọc hai bài viết sau của mình:

1. [Các cách xử lý ngoại lệ phổ biến trong Spring Boot](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247485568&idx=2&sn=c5ba880fd0c5d82e39531fa42cb036ac&chksm=cea2474bf9d5ce5dcbc6a5f6580198fdce4bc92ef577579183a729cb5d1430e4994720d59b34&token=2133161636&lang=zh_CN#rd)
2. [Dùng Enum đóng gói đơn giản một Global Exception Handler thanh lịch cho Spring Boot!](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247486379&idx=2&sn=48c29ae65b3ed874749f0803f0e4d90e&chksm=cea24460f9d5cd769ed53ad7e17c97a7963a89f5350e370be633db0ae8d783c3a3dbd58c70f8&token=1054498516&lang=zh_CN#rd)

## Giao dịch (Transaction)

Chỉ cần gắn annotation `@Transactional` lên phương thức muốn bật transaction là được!

```java
@Transactional(rollbackFor = Exception.class)
public void save() {
  ......
}

```

Như chúng ta đã biết, `Exception` được chia thành `RuntimeException` (ngoại lệ runtime) và các ngoại lệ không phải runtime (checked exception). Trong annotation `@Transactional`, nếu không cấu hình thuộc tính `rollbackFor`, transaction sẽ chỉ rollback khi gặp `RuntimeException`; khi thêm `rollbackFor=Exception.class`, transaction cũng sẽ rollback cả khi gặp các ngoại lệ không phải runtime.

Annotation `@Transactional` thường có thể áp dụng ở cấp độ `class` hoặc `method`.

- **Áp dụng trên class**: Khi đặt `@Transactional` trên class, tất cả các phương thức `public` của class đó đều được áp dụng cùng một cấu hình thuộc tính transaction.
- **Áp dụng trên phương thức**: Khi cả class và phương thức đều được cấu hình `@Transactional`, cấu hình transaction ở cấp phương thức sẽ ghi đè cấu hình của class.

Để tìm hiểu thêm về quản lý transaction trong Spring, hãy xem bài viết của mình: [Có lẽ là bài giải thích quản lý Transaction trong Spring đẹp nhất](./spring-transaction.md).

## JPA

Spring Data JPA cung cấp hàng loạt annotation và tính năng giúp lập trình viên dễ dàng triển khai ORM (Object-Relational Mapping).

### Tạo bảng

`@Entity` dùng để khai báo một class là JPA Entity, ánh xạ với bảng trong cơ sở dữ liệu. `@Table` chỉ định tên bảng tương ứng với Entity.

```java
@Entity
@Table(name = "role")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    // lược bỏ getter/setter
}
```

### Chiến lược sinh khóa chính (Primary Key Generation)

`@Id` khai báo trường là khóa chính. `@GeneratedValue` chỉ định chiến lược sinh khóa chính.

Jakarta Persistence 3.1 cung cấp 5 chiến lược sinh khóa chính:

- **`GenerationType.TABLE`**: Sinh khóa chính thông qua một bảng trong cơ sở dữ liệu.
- **`GenerationType.SEQUENCE`**: Sinh khóa chính thông qua database sequence (phù hợp với các hệ quản trị như Oracle).
- **`GenerationType.IDENTITY`**: Khóa chính tự tăng (phù hợp với các hệ quản trị như MySQL).
- **`GenerationType.UUID`**: Sinh UUID theo chuẩn RFC 4122, phù hợp cho khóa chính kiểu `UUID` hoặc `String`.
- **`GenerationType.AUTO`**: Để JPA tự động chọn chiến lược sinh phù hợp (chiến lược mặc định).

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

Khai báo chiến lược sinh khóa chính tùy chỉnh thông qua `@GenericGenerator`:

```java
@Id
@GeneratedValue(generator = "IdentityIdGenerator")
@GenericGenerator(name = "IdentityIdGenerator", strategy = "identity")
private Long id;
```

Tương đương với:

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

Dưới đây là trích đoạn mã nguồn nội bộ của phiên bản Hibernate cũ hơn, minh họa các chiến lược generator dạng chuỗi mà Hibernate hỗ trợ tại thời điểm đó. Nó không thuộc API chuẩn của JPA / Jakarta Persistence và cũng không thể thay thế enum `GenerationType` chuẩn ở trên; các dự án mới nên tham chiếu tài liệu chính thức của đúng phiên bản Hibernate đang sử dụng.

```java
public class DefaultIdentifierGeneratorFactory
    implements MutableIdentifierGeneratorFactory, Serializable, ServiceRegistryAwareService {

  @SuppressWarnings("deprecation")
  public DefaultIdentifierGeneratorFactory() {
    register( "uuid2", UUIDGenerator.class );
    register( "guid", GUIDGenerator.class );      // can be done with UUIDGenerator + strategy
    register( "uuid", UUIDHexGenerator.class );      // "deprecated" for new use
    register( "uuid.hex", UUIDHexGenerator.class );   // uuid.hex is deprecated
    register( "assigned", Assigned.class );
    register( "identity", IdentityGenerator.class );
    register( "select", SelectGenerator.class );
    register( "sequence", SequenceStyleGenerator.class );
    register( "seqhilo", SequenceHiLoGenerator.class );
    register( "increment", IncrementGenerator.class );
    register( "foreign", ForeignGenerator.class );
    register( "sequence-identity", SequenceIdentityGenerator.class );
    register( "enhanced-sequence", SequenceStyleGenerator.class );
    register( "enhanced-table", TableGenerator.class );
  }

  public void register(String strategy, Class generatorClass) {
    LOG.debugf( "Registering IdentifierGenerator strategy [%s] -> [%s]", strategy, generatorClass.getName() );
    final Class previous = generatorStrategyToClassNameMap.put( strategy, generatorClass );
    if ( previous != null ) {
      LOG.debugf( "    - overriding [%s]", previous.getName() );
    }
  }

}
```

### Ánh xạ trường (Field Mapping)

`@Column` dùng để chỉ định mối quan hệ ánh xạ giữa trường của Entity và cột trong bảng cơ sở dữ liệu.

- **`name`**: Chỉ định tên cột trong cơ sở dữ liệu.
- **`nullable`**: Chỉ định có cho phép giá trị `null` hay không.
- **`length`**: Thiết lập độ dài tối đa của trường (chỉ áp dụng cho kiểu `String`).
- **`columnDefinition`**: Chỉ định kiểu dữ liệu trong database và giá trị mặc định cho trường.

```java
@Column(name = "user_name", nullable = false, length = 32)
private String userName;

@Column(columnDefinition = "tinyint(1) default 1")
private Boolean enabled;
```

### Bỏ qua trường (Ignoring Fields)

`@Transient` dùng để khai báo trường không cần lưu trữ bền vững (persist) xuống cơ sở dữ liệu.

```java
@Entity
public class User {

    @Transient
    private String temporaryField; // Sẽ không được ánh xạ vào bảng cơ sở dữ liệu
}
```

Các cách khác khiến một trường không được persist:

- **`static`**: Các trường `static` sẽ không được persist.
- **`final`**: Các trường `final` sẽ không được persist.
- **`transient`**: Các trường được khai báo với từ khóa `transient` của Java sẽ không được tuần tự hóa (`Serialization`) hoặc persist.

### Lưu trữ trường dữ liệu lớn (LOB)

`@Lob` dùng để khai báo các trường dữ liệu lớn (như `CLOB` hoặc `BLOB`).

```java
@Lob
@Column(name = "content", columnDefinition = "LONGTEXT NOT NULL")
private String content;
```

### Ánh xạ kiểu Enum

`@Enumerated` dùng để ánh xạ kiểu enum thành cột trong cơ sở dữ liệu.

- **`EnumType.ORDINAL`**: Lưu chỉ số thứ tự (ordinal) của enum (mặc định).
- **`EnumType.STRING`**: Lưu tên của enum (khuyên dùng).

```java
public enum Gender {
    MALE,
    FEMALE
}

@Entity
public class User {

    @Enumerated(EnumType.STRING)
    private Gender gender;
}
```

Giá trị lưu trong cơ sở dữ liệu sẽ là `MALE` hoặc `FEMALE`.

### Tính năng Auditing

Thông qua tính năng Auditing của JPA, bạn có thể tự động ghi lại các thông tin như thời gian tạo, thời gian cập nhật, người tạo và người cập nhật trên Entity.

Lớp cơ sở cho Auditing:

```java
@Data
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AbstractAuditBase {

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;
}
```

Cấu hình tính năng Auditing:

```java
@Configuration
@EnableJpaAuditing
public class AuditConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> Optional.ofNullable(SecurityContextHolder.getContext())
                .map(SecurityContext::getAuthentication)
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getName);
    }
}
```

Giới thiệu ngắn gọn các annotation được dùng ở trên:

1. `@CreatedDate`: Biểu thị đây là trường lưu thời gian tạo; khi Entity được insert, giá trị sẽ tự động được gán.
2. `@CreatedBy`: Biểu thị đây là trường lưu người tạo; khi Entity được insert, giá trị sẽ tự động được gán. `@LastModifiedDate` và `@LastModifiedBy` hoạt động tương tự khi cập nhật.
3. `@EnableJpaAuditing`: Bật tính năng Auditing của JPA.

### Thao tác cập nhật và xóa

`@Modifying` dùng để đánh dấu câu lệnh được khai báo qua `@Query` là thao tác chỉnh sửa dữ liệu như INSERT, UPDATE, DELETE hoặc DDL. Các phương thức xóa dạng dẫn xuất (derived delete methods, ví dụ `deleteByUserName`) không cần `@Modifying`. Ranh giới transaction có thể được khai báo ngay trên phương thức Repository hoặc được quản lý thống nhất bởi Unit of Work ở tầng Service phía trên.

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Modifying
    @Transactional
    @Query("delete from User user where user.userName = :userName")
    int deleteByUserName(@Param("userName") String userName);
}
```

### Quan hệ liên kết (Associations)

JPA cung cấp 4 annotation cho các mối quan hệ liên kết giữa các Entity:

- **`@OneToOne`**: Quan hệ một-một (1-1).
- **`@OneToMany`**: Quan hệ một-nhiều (1-N).
- **`@ManyToOne`**: Quan hệ nhiều-một (N-1).
- **`@ManyToMany`**: Quan hệ nhiều-nhiều (N-N).

```java
@Entity
public class User {

    @OneToOne
    private Profile profile;

    @OneToMany(mappedBy = "user")
    private List<Order> orders;
}
```

## Xử lý dữ liệu JSON

Trong phát triển Web, chúng ta thường xuyên phải chuyển đổi qua lại giữa đối tượng Java và định dạng JSON. Spring thường tích hợp thư viện Jackson để thực hiện nhiệm vụ này; dưới đây là một số Jackson annotation thường dùng giúp tùy biến quá trình tuần tự hóa (`Serialization` - chuyển đối tượng Java sang JSON) và giải tuần tự hóa (`Deserialization` - chuyển JSON sang đối tượng Java).

### Lọc trường JSON

Đôi khi chúng ta không muốn một số trường của đối tượng Java xuất hiện trong chuỗi JSON đầu ra, hoặc không muốn xử lý một số thuộc tính JSON nhất định khi chuyển JSON thành đối tượng Java.

`@JsonIgnoreProperties` được đặt ở cấp độ class để lọc bỏ các trường cụ thể, không trả về hoặc không parse.

```java
// Bỏ qua thuộc tính userRoles khi tạo JSON
// Nếu cho phép các thuộc tính lạ (có trong JSON nhưng không có trong class), có thể thêm ignoreUnknown = true
@JsonIgnoreProperties({"userRoles"})
public class User {
    private String userName;
    private String fullName;
    private String password;
    private List<UserRole> userRoles = new ArrayList<>();
    // getters and setters...
}
```

`@JsonIgnore` được đặt ở cấp độ field hoặc phương thức `getter/setter` để chỉ định bỏ qua thuộc tính cụ thể đó khi serialize hoặc deserialize.

```java
public class User {
    private String userName;
    private String fullName;
    private String password;

    // Bỏ qua thuộc tính userRoles khi tạo JSON
    @JsonIgnore
    private List<UserRole> userRoles = new ArrayList<>();
    // getters and setters...
}
```

`@JsonIgnoreProperties` phù hợp hơn để loại trừ rõ ràng nhiều trường ngay khi định nghĩa class hoặc loại trừ trường trong các kịch bản kế thừa; còn `@JsonIgnore` thì trực tiếp hơn khi đánh dấu từng trường đơn lẻ cụ thể.

### Định dạng dữ liệu JSON

`@JsonFormat` dùng để chỉ định định dạng của thuộc tính khi serialize và deserialize, thường được dùng để định dạng các kiểu ngày giờ.

Ví dụ:

```java
// Chỉ định kiểu Date được serialize thành chuỗi chuẩn ISO 8601 và đặt múi giờ là GMT
@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "GMT")
private Date date;
```

### Làm phẳng đối tượng JSON (Flattening JSON Objects)

Annotation `@JsonUnwrapped` được đặt trên field để "đẩy" các thuộc tính của đối tượng lồng bên trong lên cùng cấp với đối tượng hiện tại khi serialize, và thực hiện thao tác ngược lại khi deserialize. Điều này giúp cấu trúc JSON trở nên phẳng hơn.

Giả sử ta có class `Account` chứa hai đối tượng lồng nhau là `Location` và `PersonInfo`.

```java
@Getter
@Setter
@ToString
public class Account {
    private Location location;
    private PersonInfo personInfo;

  @Getter
  @Setter
  @ToString
  public static class Location {
     private String provinceName;
     private String countyName;
  }
  @Getter
  @Setter
  @ToString
  public static class PersonInfo {
    private String userName;
    private String fullName;
  }
}

```

Cấu trúc JSON trước khi làm phẳng:

```json
{
  "location": {
    "provinceName": "Hồ Bắc",
    "countyName": "Vũ Hán"
  },
  "personInfo": {
    "userName": "coder1234",
    "fullName": "shaungkou"
  }
}
```

Dùng `@JsonUnwrapped` để làm phẳng đối tượng:

```java
@Getter
@Setter
@ToString
public class Account {
    @JsonUnwrapped
    private Location location;
    @JsonUnwrapped
    private PersonInfo personInfo;
    ......
}
```

Cấu trúc JSON sau khi làm phẳng:

```json
{
  "provinceName": "Hồ Bắc",
  "countyName": "Vũ Hán",
  "userName": "coder1234",
  "fullName": "shaungkou"
}
```

## Kiểm thử (Testing)

`@ActiveProfiles` thường được đặt trên class kiểm thử để khai báo các Spring profile đang được kích hoạt.

```java
// Chỉ định khởi chạy application context trên RANDOM_PORT và kích hoạt profile "test"
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Slf4j
public abstract class TestBase {
    // Common test setup or abstract methods...
}
```

`@Test` là annotation do framework JUnit (thường là JUnit 5 Jupiter) cung cấp để đánh dấu một phương thức là phương thức kiểm thử. Dù không phải annotation của chính Spring, đây là nền tảng để thực thi Unit Test và Integration Test.

Các phương thức kiểm thử gắn `@Transactional` được Spring TestContext quản lý trên luồng kiểm thử sẽ mặc định rollback sau khi test kết thúc nhằm tránh làm bẩn dữ liệu kiểm thử. Cần lưu ý rằng nếu sử dụng `RANDOM_PORT` để gửi HTTP request thực, quá trình xử lý phía server chạy trên một thread và transaction khác, nên sẽ không tự động rollback cùng với transaction của luồng test—trong trường hợp này cần sử dụng cơ sở dữ liệu cô lập hoặc dọn dẹp dữ liệu một cách tường minh.

`@WithMockUser` là annotation do module Spring Security Test cung cấp, dùng để giả lập (mock) một người dùng đã được xác thực trong quá trình kiểm thử. Nó cho phép chỉ định nhanh username, password, các quyền (`authorities`), v.v. để kiểm thử các endpoint hoặc phương thức được bảo vệ bởi cơ chế bảo mật.

```java
public class MyServiceTest extends TestBase { // Giả sử TestBase cung cấp Spring context

    @Test
    @Transactional // Dữ liệu test sẽ được rollback
    @WithMockUser(username = "test-user", authorities = { "ROLE_TEACHER", "read" }) // Giả lập user tên "test-user", có vai trò TEACHER và quyền read
    void should_perform_action_requiring_teacher_role() throws Exception {
        // ... logic kiểm thử ...
        // Tại đây có thể gọi các phương thức service yêu cầu quyền "ROLE_TEACHER"
    }
}
```
