---
title: Summary of Common Spring, Spring MVC & Spring Boot Annotations
description: "A comprehensive guide to common Spring and Spring Boot annotations, covering detailed usage of core annotations such as @Autowired, @Component, and @RequestMapping."
category: Framework
tag:
  - SpringBoot
  - Spring
lang: en
sourceRef: zh-ref/system-design/framework/spring/spring-common-annotations.md
head:
  - - meta
    - name: keywords
      content: Spring Annotations,Spring Boot Annotations,@SpringBootApplication,@Autowired,@RequestMapping,@Configuration,@Component,Common Annotations
---

It is no exaggeration to say that the commonly used Spring/Spring Boot annotations covered in this article already encompass most of the typical scenarios you will encounter at work. Concrete usage examples are provided for every annotation—once you master these, building projects with Spring Boot will be largely smooth sailing!

**Why write this article?**

I recently saw a widely reposted article online about common Spring Boot annotations, but some of its content was misleading and potentially confusing for developers without much hands-on experience. So I spent several days putting together this summary in hopes of helping everyone better understand and use Spring annotations.

**Since my personal ability and time are limited, if you spot any errors or omissions, corrections are very welcome! Much appreciated!**

## Spring Boot Core Annotations

`@SpringBootApplication` is the core annotation of a Spring Boot application and is typically placed on the main startup class.

Example:

```java
@SpringBootApplication
public class SpringSecurityJwtGuideApplication {
      public static void main(java.lang.String[] args) {
        SpringApplication.run(SpringSecurityJwtGuideApplication.class, args);
    }
}
```

We can think of `@SpringBootApplication` as a combination of the following three annotations:

- **`@EnableAutoConfiguration`**: Enables Spring Boot's auto-configuration mechanism.
- **`@ComponentScan`**: Scans for classes annotated with `@Component`, `@Service`, `@Repository`, `@Controller`, etc.
- **`@Configuration`**: Allows registering additional Spring Beans or importing other configuration classes.

Its source code is as follows:

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

`@Autowired` is used to automatically inject dependencies (i.e., other Spring Beans). It can be placed on constructors, fields, setter methods, or configuration methods, and the Spring container will automatically look up a Bean of matching type and inject it.

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

When multiple Beans of the same type exist, `@Autowired` injects by type by default, which can cause ambiguity. In such cases, it can be combined with `@Qualifier` to specify the Bean name and precisely select the instance to inject.

```java
@Repository("userRepositoryA")
public class UserRepositoryA implements UserRepository { /* ... */ }

@Repository("userRepositoryB")
public class UserRepositoryB implements UserRepository { /* ... */ }

@Service
public class UserService {
    @Autowired
    @Qualifier("userRepositoryA") // Specify injecting the Bean named "userRepositoryA"
    private UserRepository userRepository;
    // ...
}
```

`@Primary` also solves the problem of injecting when multiple Bean instances of the same type exist. Adding `@Primary` to a Bean definition (for example, on a `@Bean` method or class-level annotation) marks that Bean as the **preferred** candidate for injection. When performing `@Autowired` injection without specifying a name via `@Qualifier`, Spring will prioritize the Bean annotated with `@Primary`.

```java
@Primary // Set UserRepositoryA as the preferred injection candidate
@Repository("userRepositoryA")
public class UserRepositoryA implements UserRepository { /* ... */ }

@Repository("userRepositoryB")
public class UserRepositoryB implements UserRepository { /* ... */ }

@Service
public class UserService {
    @Autowired // Automatically injects UserRepositoryA because it is @Primary
    private UserRepository userRepository;
    // ...
}
```

`@Resource(name="beanName")` is an annotation defined by the JSR-250 specification, also used for dependency injection. By default, it looks up Beans **by Name**, whereas `@Autowired` injects **by Type** by default. If the `name` attribute is not specified, it attempts to look up by the field name or method name, and if not found, falls back to lookup by type (similar to `@Autowired`).

`@Resource` can only be placed on fields and setter methods; it does not support constructor injection.

```java
@Service
public class UserService {
    @Resource(name = "userRepositoryA")
    private UserRepository userRepository;
    // ...
}
```

### Bean Scopes

`@Scope("scopeName")` defines the scope of a Spring Bean—that is, the lifecycle and visibility range of Bean instances. Common scopes include:

- **singleton**: Only a single Bean instance exists in the IoC container. Beans in Spring are singletons by default, applying the Singleton design pattern.
- **prototype**: A new Bean instance is created each time it is retrieved. That is, calling `getBean()` twice in a row yields two different Bean instances.
- **request** (Web applications only): A new Bean (request Bean) is created for each HTTP request, and it is valid only within the current HTTP request.
- **session** (Web applications only): A new Bean (session Bean) is created for each HTTP request from a new session, and it is valid only within the current HTTP session.
- **application/global-session** (Web applications only): One Bean (application Bean) is created when each Web application starts, and it remains valid for the lifetime of the running application.
- **websocket** (Web applications only): A new Bean is created for each WebSocket session.

```java
@Component
// Creates a new PrototypeBean instance on each retrieval
@Scope("prototype")
public class PrototypeBean {
    // ...
}
```

### Bean Registration

The Spring container needs to know which classes should be managed as Beans. Besides explicit declaration using `@Bean` methods (typically inside `@Configuration` classes), a more common approach is to annotate classes with Stereotype annotations and combine them with Component Scanning so that Spring automatically discovers and registers those classes as Beans. These Beans can then be injected into other components via `@Autowired` and similar mechanisms.

Here are some common annotations for registering Beans:

- `@Component`: A general-purpose annotation that marks any class as a `Spring` component. If it is unclear which layer a Bean belongs to, you can annotate it with `@Component`.
- `@Repository`: Corresponds to the persistence layer (the DAO layer), primarily used for database-related operations.
- `@Service`: Corresponds to the service layer, primarily handling complex business logic that requires using the DAO layer.
- `@Controller`: Corresponds to the Spring MVC controller layer, primarily responsible for receiving user requests, invoking the Service layer, and returning data to frontend views.
- `@RestController`: A composed annotation equivalent to `@Controller` + `@ResponseBody`. It is specifically designed for building controllers for RESTful Web services. In a class annotated with `@RestController`, the return values of all handler methods are automatically serialized (typically as JSON) and written directly to the HTTP response body instead of being resolved as view names.

`@Controller` vs `@RestController`:

- `@Controller`: Primarily used in traditional Spring MVC applications, where method return values are typically logical view names requiring a view resolver to render pages. If you need to return data (such as JSON), you must additionally annotate the method with `@ResponseBody`.
- `@RestController`: Designed specifically for building RESTful APIs that return data. When placed on a class, the return values of all methods are treated as response body content by default (equivalent to implicitly adding `@ResponseBody` to every method), typically used to return JSON or XML data. In modern frontend-backend decoupled applications, `@RestController` is the more commonly used choice.

For a comparison between `@RestController` and `@Controller`, see this article: [@RestController vs @Controller](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247485544&idx=1&sn=3cc95b88979e28fe3bfe539eb421c6d8&chksm=cea247a3f9d5ceb5e324ff4b8697adc3e828ecf71a3468445e70221cce768d1e722085359907&token=1725092312&lang=zh_CN#rd).

## Configuration

### Declaring Configuration Classes

`@Configuration` is primarily used to declare that a class is a Spring configuration class. Although `@Component` can also be used instead, `@Configuration` expresses the purpose of the class (defining Beans) much more explicitly, provides clearer semantics, and allows Spring to apply specialized handling (for example, using CGLIB proxies to ensure singleton behavior for `@Bean` methods).

```java
@Configuration
public class AppConfig {

    // The @Bean annotation is used to declare a Bean in a configuration class
    @Bean
    public TransferService transferService() {
        return new TransferServiceImpl();
    }

    // A configuration class can contain one or more @Bean methods.
}
```

### Reading Configuration Properties

In application development, we often need to manage configuration details such as database connection settings, keys or endpoints for third-party services (like Alibaba Cloud OSS, SMS services, or WeChat authentication), and so on. Typically, this information is **stored centrally in configuration files** (such as `application.yml` or `application.properties`) for easy management and updates.

Spring provides several convenient ways to read these configuration values. Suppose we have the following `application.yml` file:

```yaml
wuhan2020: In early 2020, COVID-19 broke out in Wuhan. The epidemic was severe, but I believe everything will pass! Stay strong, Wuhan! Stay strong, China!

my-profile:
  name: Brother Guide
  email: koushuangbwcx@163.com

library:
  location: Wuhan, Hubei - Stay strong, China!
  books:
    - name: The Heart of Genius
      description: On the day her father is diagnosed with Alzheimer's disease, 22-year-old Lin Zhaoxi learns that Pei Zhi, her longtime campus crush, is about to study abroad—at the very university her father once gave up for her sake.
    - name: The Order of Time
      description: Why do we remember the past and not the future? What does it mean for time to "flow"? Do we exist inside time, or does time exist inside us? With poetic prose, Carlo Rovelli invites us to ponder this age-old mystery—the nature of time.
    - name: The Amazing Me
      description: How do you build a new habit? How do you become mentally more mature? How do you cultivate high-quality relationships? And how do you walk through life's hardest moments?
```

Below are several common ways to read configuration properties:

1. `@Value("${property.key}")` injects a single property value from a configuration file (such as `application.properties` or `application.yml`). It also supports Spring Expression Language (SpEL) for more complex injection logic.

```java
@Value("${wuhan2020}")
String wuhan2020;
```

2. `@ConfigurationProperties` can read configuration properties and bind them to a Bean, and is used even more frequently.

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
  // getters/setters omitted
  ......
}
```

You can inject it into other classes and use it just like a regular Spring Bean.

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

### Loading Specified Configuration Files

The `@PropertySource` annotation allows loading custom configuration files. It is useful in scenarios where a subset of configuration properties needs to be stored separately.

```java
@Component
@PropertySource("classpath:website.properties")

class WebSite {
    @Value("${url}")
    private String url;

  // getters/setters omitted
  ......
}
```

**Note**: When using `@PropertySource`, ensure that the external file path is correct and that the file is on the classpath.

For more details, see my article: [Master How to Elegantly Read Configuration Files in Spring Boot in 10 Minutes](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247486181&idx=2&sn=10db0ae64ef501f96a5b0dbc4bd78786&chksm=cea2452ef9d5cc384678e456427328600971180a77e40c13936b19369672ca3e342c26e92b50&token=816772476&lang=zh_CN#rd).

## MVC

### HTTP Requests

**5 common request types:**

- **GET**: Requests a specific resource from the server. For example: `GET /users` (retrieve all students).
- **POST**: Creates a new resource on the server. For example: `POST /users` (create a student).
- **PUT**: Updates a resource on the server (the client supplies the complete updated resource). For example: `PUT /users/12` (update student with ID 12).
- **DELETE**: Deletes a specific resource from the server. For example: `DELETE /users/12` (delete student with ID 12).
- **PATCH**: Updates a resource on the server (the client supplies only the changed attributes, which can be seen as a partial update). It is used less frequently, so no example is given here.

#### GET Requests

`@GetMapping("users")` is equivalent to `@RequestMapping(value="/users",method=RequestMethod.GET)`.

```java
@GetMapping("/users")
public ResponseEntity<List<User>> getAllUsers() {
  return ResponseEntity.ok(userRepository.findAll());
}
```

#### POST Requests

`@PostMapping("users")` is equivalent to `@RequestMapping(value="/users",method=RequestMethod.POST)`.

`@PostMapping` is commonly paired with `@RequestBody` to receive JSON data and map it to a Java object.

```java
@PostMapping("/users")
public ResponseEntity<User> createUser(@Valid @RequestBody UserCreateRequest userCreateRequest) {
  User user = userService.create(userCreateRequest);
  return ResponseEntity.status(HttpStatus.CREATED).body(user);
}
```

#### PUT Requests

`@PutMapping("/users/{userId}")` is equivalent to `@RequestMapping(value="/users/{userId}",method=RequestMethod.PUT)`.

```java
@PutMapping("/users/{userId}")
public ResponseEntity<User> updateUser(@PathVariable(value = "userId") Long userId,
  @Valid @RequestBody UserUpdateRequest userUpdateRequest) {
  ......
}
```

#### DELETE Requests

`@DeleteMapping("/users/{userId}")` is equivalent to `@RequestMapping(value="/users/{userId}",method=RequestMethod.DELETE)`.

```java
@DeleteMapping("/users/{userId}")
public ResponseEntity deleteUser(@PathVariable(value = "userId") Long userId){
  ......
}
```

#### PATCH Requests

In real-world projects, we generally only use `PATCH` requests to update data when `PUT` is no longer sufficient.

```java
  @PatchMapping("/profile")
  public ResponseEntity updateStudent(@RequestBody StudentUpdateRequest studentUpdateRequest) {
        studentRepository.updateDetail(studentUpdateRequest);
        return ResponseEntity.ok().build();
    }
```

### Parameter Binding

When handling HTTP requests, Spring MVC provides several annotations for binding request parameters to method parameters. Below are the common parameter-binding approaches:

#### Extracting Parameters from URL Paths

`@PathVariable` is used to extract parameters from the URL path. For example:

```java
@GetMapping("/klasses/{klassId}/teachers")
public List<Teacher> getTeachersByClass(@PathVariable("klassId") Long klassId) {
    return teacherService.findTeachersByClass(klassId);
}
```

If the request URL is `/klasses/123/teachers`, then `klassId = 123`.

#### Binding Query Parameters

`@RequestParam` is used to bind query parameters. For example:

```java
@GetMapping("/klasses/{klassId}/teachers")
public List<Teacher> getTeachersByClass(@PathVariable Long klassId,
                                        @RequestParam(value = "type", required = false) String type) {
    return teacherService.findTeachersByClassAndType(klassId, type);
}
```

If the request URL is `/klasses/123/teachers?type=web`, then `klassId = 123` and `type = web`.

#### Binding JSON Data in the Request Body

`@RequestBody` is used to read the body of an HTTP request (which may be POST, PUT, DELETE, or GET) with **`Content-Type: application/json`**, and automatically bind the received data to a Java object. The framework uses `HttpMessageConverter` or a custom `HttpMessageConverter` to convert the JSON string in the request body into a Java object.

Let me demonstrate its basic usage with a simple example!

Suppose we have a sign-up endpoint:

```java
@PostMapping("/sign-up")
public ResponseEntity signUp(@RequestBody @Valid UserRegisterRequest userRegisterRequest) {
  userService.save(userRegisterRequest);
  return ResponseEntity.ok().build();
}
```

The `UserRegisterRequest` class:

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

We send a POST request to this endpoint with JSON data in the body:

```json
{ "userName": "coder", "fullName": "shuangkou", "password": "123456" }
```

This allows our backend to directly map the JSON data onto our `UserRegisterRequest` class.

![](/media/jg/local/system-design/framework/spring/images/spring-annotations/RequestBody-df51ab.png)

**Note**:

- A method can have only one `@RequestBody` parameter, but it can have multiple `@PathVariable` and `@RequestParam` parameters.
- If you need to receive multiple complex objects, it is recommended to combine them into a single wrapper object.

## Data Validation

Data validation is a critical link in ensuring system stability and security. Even when validation has already been implemented on the user interface (frontend), **backend services must still validate incoming data again**. This is because frontend validation can easily be bypassed (for instance, modifying requests via browser developer tools or calling APIs directly with HTTP tools like Postman or curl), allowing malicious or malformed data to reach the backend directly. Therefore, backend validation is the last—and most important—line of defense for preventing invalid data, maintaining data consistency, and ensuring business logic executes properly.

Bean Validation is a standard specification (JSR 303, 349, 380) defining JavaBean parameter validation. It provides a set of annotations that can be applied directly to JavaBean properties to achieve convenient parameter validation.

- **JSR 303 (Bean Validation 1.0):** Laid the foundation, introducing core validation annotations (such as `@NotNull`, `@Size`, `@Min`, `@Max`, etc.), defining how to validate JavaBean properties via annotations, and supporting nested object validation as well as custom validators.
- **JSR 349 (Bean Validation 1.1):** Extended 1.0, for example by introducing support for validating method parameters and return values, and enhancing support for Group Validation.
- **JSR 380 (Bean Validation 2.0):** Embraced new Java 8 features and introduced improvements such as supporting date and time types in the `java.time` package and adding new validation annotations (such as `@NotEmpty`, `@NotBlank`, etc.).

Bean Validation itself is only a **specification (interfaces and annotations)**; we need a **concrete framework** implementing this specification to execute the validation logic. Currently, **Hibernate Validator** is the most authoritative and widely used reference implementation of the Bean Validation specification.

- Hibernate Validator 4.x implements Bean Validation 1.0 (JSR 303).
- Hibernate Validator 5.x implements Bean Validation 1.1 (JSR 349).
- Hibernate Validator 6.x implements Bean Validation 2.0 (JSR 380), using the `javax.validation` package name.
- Hibernate Validator 7.x and 8.x implement Jakarta Bean Validation 3.0, using the `jakarta.validation` package name; Hibernate Validator 9.x implements Jakarta Validation 3.1.

Using Bean Validation in a Spring Boot project is very convenient thanks to Spring Boot's auto-configuration capabilities. Regarding dependency management, keep in mind:

- In earlier versions of Spring Boot (typically before 2.3.x), the `spring-boot-starter-web` dependency included `hibernate-validator` by default. Thus, as long as the Web Starter was included, no additional validation dependency was needed.
- Starting from Spring Boot 2.3.x, for finer-grained dependency management, validation-related dependencies were removed from `spring-boot-starter-web`. If your project uses this version or newer and needs Bean Validation features, you must explicitly add the `spring-boot-starter-validation` dependency:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

![](/media/jg/ext/oss.javaguide.cn/2021/03/c7bacd12-1c1a-4e41-aaaf-4cad840fc073-deea861a.png)

Non-Spring Boot projects need to manually include the relevant dependencies, which we will not elaborate on here. For details, you can read my article: [How to Do Parameter Validation in Spring/Spring Boot? Everything You Need to Know Is Here!](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247485783&idx=1&sn=a407f3b75efa17c643407daa7fb2acd6&chksm=cea2469cf9d5cf8afbcd0a8a1c9cc4294d6805b8e01bee6f76bb2884c5bc15478e91459def49&token=292197051&lang=zh_CN#rd).

👉 Note: Prefer constraint annotations provided by the Bean Validation / Jakarta Validation specification rather than Hibernate Validator's proprietary constraints. Spring Boot 2.x typically uses `javax.validation.constraints`, while Spring Boot 3.x and later use `jakarta.validation.constraints`.

### Commonly Used Field Validation Annotations

The Bean Validation specification and its implementations (such as Hibernate Validator) provide a rich set of annotations for declaratively defining validation rules. Below are some commonly used annotations and their descriptions:

- `@NotNull`: Checks that the annotated element (any type) is not `null`.
- `@NotEmpty`: Checks that the annotated element (such as `CharSequence`, `Collection`, `Map`, `Array`) is not `null` and its size/length is not 0. Note: for strings, `@NotEmpty` allows strings containing only whitespace characters, such as `" "`.
- `@NotBlank`: Checks that the annotated `CharSequence` (such as `String`) is not `null` and its length after trimming leading and trailing whitespace is greater than 0 (i.e., it must not be a blank string).
- `@Null`: Checks that the annotated element must be `null`.
- `@AssertTrue` / `@AssertFalse`: Checks that the annotated `boolean` or `Boolean` element must be `true` / `false`.
- `@Min(value)` / `@Max(value)`: Checks that the value of the annotated numeric type (or its string representation) must be greater than or equal to / less than or equal to the specified `value`. Applies to integer types (`byte`, `short`, `int`, `long`, `BigInteger`, etc.).
- `@DecimalMin(value)` / `@DecimalMax(value)`: Similar to `@Min` / `@Max`, but applicable to numeric types including decimals (`BigDecimal`, `BigInteger`, `CharSequence`, `byte`, `short`, `int`, `long` and their wrapper classes). `value` must be a string representation of a number.
- `@Size(min=, max=)`: Checks that the size/length of the annotated element (such as `CharSequence`, `Collection`, `Map`, `Array`) is within the specified `min` and `max` range (inclusive).
- `@Digits(integer=, fraction=)`: Checks that the value of the annotated numeric type (or its string representation) has at most `integer` digits in its integer part and at most `fraction` digits in its fractional part.
- `@Pattern(regexp=, flags=)`: Checks that the annotated `CharSequence` (such as `String`) matches the specified regular expression (`regexp`). `flags` can specify matching modes (such as case-insensitivity).
- `@Email`: Checks that the annotated `CharSequence` (such as `String`) conforms to an email format (built-in relatively lenient regular expression).
- `@Past` / `@Future`: Checks that the annotated date or time type (`java.util.Date`, `java.util.Calendar`, types under JSR 310 `java.time`) is before / after the current time.
- `@PastOrPresent` / `@FutureOrPresent`: Similar to `@Past` / `@Future`, but also allows values equal to the current time.
- ...

### Validating the Request Body (RequestBody)

When a Controller method uses `@RequestBody` to receive a request body and bind it to an object, you can add `@Valid` before that parameter to trigger validation of the object. If validation fails, it throws `MethodArgumentNotValidException`.

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Person {
    @NotNull(message = "classId must not be null")
    private String classId;

    @Size(max = 33)
    @NotNull(message = "name must not be null")
    private String name;

    @Pattern(regexp = "((^Man$|^Woman$|^UGM$))", message = "sex value is out of allowed range")
    @NotNull(message = "sex must not be null")
    private String sex;

    @Email(message = "Invalid email format")
    @NotNull(message = "email must not be null")
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

### Validating Request Parameters (Path Variables and Request Parameters)

For simple types mapped directly to method parameters (such as path variables `@PathVariable` or request parameters `@RequestParam`), the validation approach differs depending on the Spring Framework version:

1. **Spring Framework 6.1 and later**: Spring MVC has built-in support for Handler Method Validation. Simply place constraint annotations like `@Min`, `@Max`, `@Size`, and `@Pattern` directly on the method parameters, and do not add `@Validated` on the Controller class—otherwise it switches to AOP-based method validation instead.
2. **Spring Framework 6.0 and earlier**: You typically need to add Spring's `@Validated` annotation on the Controller class to process parameter constraints via the method validation infrastructure.

Below is an example using the built-in validation approach in Spring Framework 6.1 and later:

```java
@RestController
@RequestMapping("/api")
public class PersonController {

    @GetMapping("/person/{id}")
    public ResponseEntity<Integer> getPersonByID(
            @PathVariable("id")
            @Max(value = 5, message = "ID cannot exceed 5")
            Integer id
    ) {
        // Spring MVC 6.1+ throws HandlerMethodValidationException before entering the method body.
        return ResponseEntity.ok().body(id);
    }

    @GetMapping("/person")
    public ResponseEntity<String> findPersonByName(
            @RequestParam("name")
            @NotBlank(message = "Name must not be blank") // Also works for @RequestParam
            @Size(max = 10, message = "Name length cannot exceed 10")
            String name
    ) {
        return ResponseEntity.ok().body("Found person: " + name);
    }
}
```

## Global Exception Handling

Let's introduce the global Controller-layer exception handling that is essential in Spring projects.

**Related annotations:**

1. `@ControllerAdvice`: Annotation that defines a global exception handling class.
2. `@ExceptionHandler`: Annotation that declares an exception handling method.

How do we use them? Taking the parameter validation in Section 5 as an example, if a method parameter is invalid, `MethodArgumentNotValidException` is thrown, so we handle this exception.

```java
@ControllerAdvice
@ResponseBody
public class GlobalExceptionHandler {

    /**
     * Request parameter exception handling
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex, HttpServletRequest request) {
       ......
    }
}
```

For more on Spring Boot exception handling, check out these two articles of mine:

1. [Common Approaches to Handling Exceptions in Spring Boot](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247485568&idx=2&sn=c5ba880fd0c5d82e39531fa42cb036ac&chksm=cea2474bf9d5ce5dcbc6a5f6580198fdce4bc92ef577579183a729cb5d1430e4994720d59b34&token=2133161636&lang=zh_CN#rd)
2. [Using Enums to Simply Encapsulate an Elegant Spring Boot Global Exception Handler!](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247486379&idx=2&sn=48c29ae65b3ed874749f0803f0e4d90e&chksm=cea24460f9d5cd769ed53ad7e17c97a7963a89f5350e370be633db0ae8d783c3a3dbd58c70f8&token=1054498516&lang=zh_CN#rd)

## Transactions

Simply add the `@Transactional` annotation to methods where transactions need to be enabled!

```java
@Transactional(rollbackFor = Exception.class)
public void save() {
  ......
}

```

As we know, `Exception` is divided into runtime exceptions (`RuntimeException`) and non-runtime (checked) exceptions. In `@Transactional`, if you do not configure the `rollbackFor` attribute, the transaction will only roll back when encountering a `RuntimeException`; adding `rollbackFor=Exception.class` allows the transaction to roll back on non-runtime exceptions as well.

The `@Transactional` annotation can generally be applied to a `class` or a `method`.

- **Class-level**: Placing `@Transactional` on a class applies the same transaction attribute configuration to all `public` methods of that class.
- **Method-level**: When both the class and a method are configured with `@Transactional`, the method's transaction configuration overrides the class-level configuration.

For more on Spring transactions, check out my article: [Perhaps the Cleanest Guide to Spring Transaction Management](./spring-transaction.md).

## JPA

Spring Data JPA provides a set of annotations and features that help developers easily implement ORM (Object-Relational Mapping).

### Creating Tables

`@Entity` is used to declare a class as a JPA entity class mapped to a database table. `@Table` specifies the table name corresponding to the entity.

```java
@Entity
@Table(name = "role")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    // getters/setters omitted
}
```

### Primary Key Generation Strategies

`@Id` declares a field as the primary key. `@GeneratedValue` specifies the primary key generation strategy.

Jakarta Persistence 3.1 provides 5 primary key generation strategies:

- **`GenerationType.TABLE`**: Generates primary keys using a database table.
- **`GenerationType.SEQUENCE`**: Generates primary keys using a database sequence (suitable for databases like Oracle).
- **`GenerationType.IDENTITY`**: Auto-incrementing primary key (suitable for databases like MySQL).
- **`GenerationType.UUID`**: Generates an RFC 4122 UUID, suitable for `UUID` or `String` primary keys.
- **`GenerationType.AUTO`**: Lets JPA automatically choose an appropriate generation strategy (the default strategy).

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

Declaring a custom primary key generation strategy with `@GenericGenerator`:

```java
@Id
@GeneratedValue(generator = "IdentityIdGenerator")
@GenericGenerator(name = "IdentityIdGenerator", strategy = "identity")
private Long id;
```

Equivalent to:

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

Below is a source code excerpt from an older Hibernate internal implementation showing the string generator strategies supported by Hibernate at that time. It is not part of the standard JPA / Jakarta Persistence API and cannot replace the standard `GenerationType` enum above; new projects should refer to the official documentation for the Hibernate version in use.

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

### Field Mapping

`@Column` is used to specify the mapping relationship between an entity field and a database column.

- **`name`**: Specifies the database column name.
- **`nullable`**: Specifies whether `null` values are allowed.
- **`length`**: Sets the length of the field (applies only to `String` types).
- **`columnDefinition`**: Specifies the database column type and default value for the field.

```java
@Column(name = "user_name", nullable = false, length = 32)
private String userName;

@Column(columnDefinition = "tinyint(1) default 1")
private Boolean enabled;
```

### Ignoring Fields

`@Transient` is used to declare a field that does not need to be persisted.

```java
@Entity
public class User {

    @Transient
    private String temporaryField; // Will not be mapped to the database table
}
```

Other ways a field is not persisted:

- **`static`**: Static fields will not be persisted.
- **`final`**: Final fields will not be persisted.
- **`transient`**: Fields declared with Java's `transient` keyword will not be serialized or persisted.

### Large Field Storage

`@Lob` is used to declare large objects (such as `CLOB` or `BLOB`).

```java
@Lob
@Column(name = "content", columnDefinition = "LONGTEXT NOT NULL")
private String content;
```

### Enum Type Mapping

`@Enumerated` is used to map an enum type to a database column.

- **`EnumType.ORDINAL`**: Stores the ordinal index of the enum (default).
- **`EnumType.STRING`**: Stores the name of the enum (recommended).

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

The value stored in the database is `MALE` or `FEMALE`.

### Auditing

With JPA's auditing feature, you can automatically record information such as creation time, update time, creator, and modifier on entities.

Auditing base class:

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

Configuring auditing:

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

A brief overview of the annotations involved above:

1. `@CreatedDate`: Indicates that the field represents the creation timestamp; its value is automatically set when the entity is inserted.
2. `@CreatedBy`: Indicates that the field represents the creator; its value is automatically set when the entity is inserted. `@LastModifiedDate` and `@LastModifiedBy` work similarly on updates.
3. `@EnableJpaAuditing`: Enables JPA auditing.

### Update and Delete Operations

`@Modifying` marks a statement declared with `@Query` as a modifying operation such as INSERT, UPDATE, DELETE, or DDL. Derived delete methods (such as `deleteByUserName`) do not require `@Modifying`. Transaction boundaries can be declared either on the Repository method or managed uniformly by an upper-level Service unit of work.

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Modifying
    @Transactional
    @Query("delete from User user where user.userName = :userName")
    int deleteByUserName(@Param("userName") String userName);
}
```

### Associations

JPA provides 4 annotations for entity associations:

- **`@OneToOne`**: One-to-one relationship.
- **`@OneToMany`**: One-to-many relationship.
- **`@ManyToOne`**: Many-to-one relationship.
- **`@ManyToMany`**: Many-to-many relationship.

```java
@Entity
public class User {

    @OneToOne
    private Profile profile;

    @OneToMany(mappedBy = "user")
    private List<Order> orders;
}
```

## JSON Data Processing

In Web development, we frequently need to convert between Java objects and JSON format. Spring typically integrates the Jackson library for this task. Below are several commonly used Jackson annotations that help customize JSON Serialization (converting Java objects to JSON) and Deserialization (converting JSON to Java objects).

### Filtering JSON Fields

Sometimes we do not want certain fields of a Java object to be included in the generated JSON, or we want to ignore certain JSON properties when converting JSON into a Java object.

`@JsonIgnoreProperties` is applied at the class level to filter out specific fields from being serialized or parsed.

```java
// Ignore the userRoles property when generating JSON
// If unknown properties should be allowed (present in JSON but absent in the class), add ignoreUnknown = true
@JsonIgnoreProperties({"userRoles"})
public class User {
    private String userName;
    private String fullName;
    private String password;
    private List<UserRole> userRoles = new ArrayList<>();
    // getters and setters...
}
```

`@JsonIgnore` is applied at the field or `getter/setter` method level to specify ignoring that particular property during serialization or deserialization.

```java
public class User {
    private String userName;
    private String fullName;
    private String password;

    // Ignore the userRoles property when generating JSON
    @JsonIgnore
    private List<UserRole> userRoles = new ArrayList<>();
    // getters and setters...
}
```

`@JsonIgnoreProperties` is better suited for explicitly excluding multiple fields at the class definition level or excluding fields in inheritance scenarios, while `@JsonIgnore` is more direct for marking a single specific field.

### Formatting JSON Data

`@JsonFormat` is used to specify the format of a property during serialization and deserialization. It is commonly used for formatting date and time types.

For example:

```java
// Serialize the Date type into an ISO 8601 formatted string and set the time zone to GMT
@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "GMT")
private Date date;
```

### Flattening JSON Objects

The `@JsonUnwrapped` annotation is applied to a field to "lift" the properties of its nested object up to the current object's level during serialization, and perform the reverse during deserialization. This makes the JSON structure flatter.

Suppose we have an `Account` class containing two nested objects, `Location` and `PersonInfo`.

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

JSON structure before flattening:

```json
{
  "location": {
    "provinceName": "Hubei",
    "countyName": "Wuhan"
  },
  "personInfo": {
    "userName": "coder1234",
    "fullName": "shaungkou"
  }
}
```

Flattening the object with `@JsonUnwrapped`:

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

JSON structure after flattening:

```json
{
  "provinceName": "Hubei",
  "countyName": "Wuhan",
  "userName": "coder1234",
  "fullName": "shaungkou"
}
```

## Testing

`@ActiveProfiles` is generally placed on test classes to declare which Spring profiles are active.

```java
// Start the application context on RANDOM_PORT and activate the "test" profile
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Slf4j
public abstract class TestBase {
    // Common test setup or abstract methods...
}
```

`@Test` is an annotation provided by the JUnit framework (typically JUnit 5 Jupiter) to mark a method as a test method. Although it is not a Spring annotation itself, it is the foundation for running unit tests and integration tests.

A `@Transactional` test method managed by Spring TestContext on the test thread rolls back by default after the test finishes to avoid polluting test data. Keep in mind that if you issue real HTTP requests using `RANDOM_PORT`, server-side handling runs in a separate thread and transaction and will not roll back automatically with the test thread's transaction—in that case, you need an isolated database or explicit data cleanup.

`@WithMockUser` is an annotation provided by the Spring Security Test module to mock an authenticated user during tests. It lets you conveniently specify the username, password, roles (`authorities`), and other details to test security-protected endpoints or methods.

```java
public class MyServiceTest extends TestBase { // Assuming TestBase provides Spring context

    @Test
    @Transactional // Test data will be rolled back
    @WithMockUser(username = "test-user", authorities = { "ROLE_TEACHER", "read" }) // Mock a user named "test-user" with the TEACHER role and read authority
    void should_perform_action_requiring_teacher_role() throws Exception {
        // ... test logic ...
        // Here you can invoke service methods that require the "ROLE_TEACHER" authority
    }
}
```
