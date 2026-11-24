---
title: Why Do Both the Frontend and Backend Need Data Validation?
description: "Detailed explanation of why both frontend and backend data validation are necessary, covering parameter validation, authorization checks, and security measures against bypassing frontend validation."
category: System Design
tag:
  - Security
head:
  - - meta
    - name: keywords
      content: Data Validation,Frontend Validation,Backend Validation,Parameter Validation,Authorization Check,Input Validation,Security Protection,Injection Prevention
lang: en
sourceRef: zh-ref/system-design/security/data-validation.md
---

> Related Interview Questions:
>
> - If the frontend already performs validation, does the backend still need to do validation?
> - Why does the backend still need to run the same (or even stricter) validation even after the frontend has already validated the data?
> - What aspects need to be validated on the frontend vs. the backend?

In day-to-day web development, whether we are writing frontend pages or backend APIs, we are constantly dealing with data. How do we ensure that the data flowing back and forth is reliable and secure? That relies on **data validation**. Moreover, the frontend must do it, the backend **must definitely do it**, and we also need the critical lock of **authorization checks (permission validation)**—none of these can be omitted!

Why is that? Think about it: frontend validation primarily exists to improve user experience and catch obvious junk input, yet anyone with basic technical knowledge can easily bypass frontend validation (for example, by sending requests directly with tools like Postman). Therefore, **backend validation is the final and most critical line of defense for system security and data accuracy**. It ensures that data entering the system is not only properly formatted, but also complies with business rules—and most importantly, that the user performing the operation actually has **permission** to do so!

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/user-input-validation-ffbd7ed5.png)

## Frontend Validation

Frontend validation acts like an attentive gatekeeper. Its main purpose is to notify the user immediately while they are filling out data if something is wrong so they can fix it right away—instead of waiting until after submission only to be rejected by the backend and forced to start over. The benefits are clear:

1. **Better user experience:** Immediate feedback during input lets users know right away when something is wrong and fix it conveniently, creating a smooth and frustration-free experience.
2. **Reduced backend load:** Intercepting obviously malformed data or missing required fields on the frontend reduces invalid requests sent to the backend, saving server resources and network bandwidth. Note that the backend still has to perform validation regardless, though frontend validation eliminates a large volume of invalid requests.

So what does the frontend typically validate?

- **Required field validation:** The most basic check—mandatory fields must not be left empty.
- **Format validation:** For instance, an email must look like an email address (such as `xxx@xx.com`), and a mobile phone number must be 11 digits (in China). Regular expressions come in handy here.
- **Duplicate input confirmation:** Ensuring two entries match, such as the "Confirm Password" field during registration.
- **Range / length validation:** Age cannot be negative; password length must be between 6 and 20 characters—checks like these need enforcement.
- **Validity / business validation:** For example, has the username already been registered? Is the selected product still in stock? This depends on specific business logic and requires coordination with the backend.
- **File upload validation:** Restricting allowed file types (such as supporting only `.jpg` and `.png`) and file sizes.
- **Security validation:** Defending against malicious inputs like XSS (Cross-Site Scripting) by sanitizing or handling user input so scripts injected by attackers cannot execute on the page.
- ...and more, depending on business requirements.

In short, the core purpose of frontend validation is to **guide users to enter valid input** and **enhance interactive user experience**.

## Backend Validation

Frontend validation is only the first line of defense; while it improves user experience, it can always be bypassed. What truly determines security is backend validation. The backend must treat all incoming data from the frontend as "potentially untrusted" and conduct a thorough inspection. Backend validation must not only cover the basic checks performed on the frontend (such as format, range, and length), but also perform stricter and deeper verification to guarantee system security and data consistency. Key areas of backend validation include:

1. **Completeness validation:** Fields explicitly required by the API specification must be present, such as `userId` and `orderId`. If any required field is missing, the backend should immediately return an error and reject the request.
2. **Validity / existence validation:** Verifying whether the submitted data is genuinely valid and exists. For instance, does the supplied `productId` exist in the database? Has the `couponId` expired or already been used? This usually requires querying the database or calling other services.
3. **Consistency validation:** For operations involving multiple data entities, verifying that the transition conforms to business logic. For example, before updating an order status, ensuring the current status permits the transition—an order cannot jump directly from "Unpaid" to "Completed". Consistency validation is essential to guarantee correct state transitions.
4. **Security validation:** The backend must guard against all kinds of malicious attacks, including but not limited to XSS and SQL injection. All external input must undergo strict filtering and validation—for example, using parameterized queries to prevent SQL injection, or properly escaping returned HTML data to prevent Cross-Site Scripting.
5. ...Essentially, for security, the backend must re-verify everything the frontend checks as well.

In a Java backend, writing manual `if-else` statements everywhere for these basic validations gets tedious quickly. Fortunately, the Java ecosystem provides the **Bean Validation** standard specification, which lets us declare validation rules directly on the properties of JavaBeans (such as DTO objects) using **annotations**—very convenient.

- **JSR 303 (1.0):** Laid the foundation, introducing classic annotations such as `@NotNull`, `@Size`, `@Min`, and `@Max`.
- **JSR 349 (1.1):** Added validation for method parameters and return values, as well as enhancements like group validation.
- **JSR 380 (2.0):** Embraced Java 8, added support for the new Date and Time API, and introduced even more practical annotations such as `@NotEmpty`, `@NotBlank`, and `@Email`.

In earlier Spring Boot versions (roughly before 2.3.x), `spring-boot-starter-web` included `hibernate-validator` out of the box, so no extra dependency was required.

In Spring Boot 2.3.x and later, validation dependencies were separated out for greater modularity, so you need to manually add the `spring-boot-starter-validation` dependency:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

The Bean Validation specification and its implementations (such as Hibernate Validator) provide a rich set of annotations for declaratively defining validation rules. Below are commonly used annotations and their descriptions:

- `@NotNull`: Checks that the annotated element (of any type) is not `null`.
- `@NotEmpty`: Checks that the annotated element (such as `CharSequence`, `Collection`, `Map`, or `Array`) is not `null` and its size/length is greater than 0. Note: for strings, `@NotEmpty` allows strings containing only whitespace characters, such as `" "`.
- `@NotBlank`: Checks that the annotated `CharSequence` (such as `String`) is not `null` and that its trimmed length is greater than 0 (i.e., it cannot be a blank/whitespace-only string).
- `@Null`: Checks that the annotated element must be `null`.
- `@AssertTrue` / `@AssertFalse`: Checks that the annotated `boolean` or `Boolean` element must be `true` / `false`.
- `@Min(value)` / `@Max(value)`: Checks that the annotated numeric value (or its string representation) is greater than or equal to / less than or equal to the specified `value`. Intended for integer types (`byte`, `short`, `int`, `long`, `BigInteger`, etc.).
- `@DecimalMin(value)` / `@DecimalMax(value)`: Functions similarly to `@Min` / `@Max`, but applies to numeric types that support decimals (`BigDecimal`, `BigInteger`, `CharSequence`, `byte`, `short`, `int`, `long`, and their wrapper classes). `value` must be a string representation of a number.
- `@Size(min=, max=)`: Checks that the size/length of the annotated element (such as `CharSequence`, `Collection`, `Map`, or `Array`) falls within the inclusive range `[min, max]`.
- `@Digits(integer=, fraction=)`: Checks that the annotated numeric value (or its string representation) has at most `integer` integer digits and at most `fraction` fractional digits.
- `@Pattern(regexp=, flags=)`: Checks that the annotated `CharSequence` (such as `String`) matches the specified regular expression (`regexp`). `flags` can specify matching options (such as case-insensitivity).
- `@Email`: Checks that the annotated `CharSequence` (such as `String`) conforms to a valid email format (uses a relatively permissive built-in regular expression).
- `@Past` / `@Future`: Checks that the annotated date or time value (`java.util.Date`, `java.util.Calendar`, or JSR-310 `java.time` types) is before / after the current time.
- `@PastOrPresent` / `@FutureOrPresent`: Similar to `@Past` / `@Future`, but also allows values equal to the current time.
- ...

When a Controller method uses `@RequestBody` to receive a request body and bind it to an object, you can place the `@Valid` annotation before that parameter to trigger validation of the object. If validation fails, Spring throws a `MethodArgumentNotValidException`.

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Person {
    @NotNull(message = "classId cannot be null")
    private String classId;

    @Size(max = 33)
    @NotNull(message = "name cannot be null")
    private String name;

    @Pattern(regexp = "((^Man$|^Woman$|^UGM$))", message = "sex value is not in the allowed range")
    @NotNull(message = "sex cannot be null")
    private String sex;

    @Email(message = "Invalid email format")
    @NotNull(message = "email cannot be null")
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

For simple-type data mapped directly to method parameters (such as path variables `@PathVariable` or query parameters `@RequestParam`), validation works slightly differently:

1. **Add `@Validated` on the Controller class:** This annotation is provided by Spring (not part of the JSR standard) and enables Spring to process validation annotations at the method-parameter level. **This step is mandatory.**
2. **Place validation annotations directly on the method parameters:** Apply `@Min`, `@Max`, `@Size`, `@Pattern`, etc. directly to the corresponding `@PathVariable` or `@RequestParam` parameters.

Be absolutely sure not to forget adding `@Validated` on the class—it tells Spring to validate method parameters.

```java
@RestController
@RequestMapping("/api")
@Validated // Key step 1: @Validated must be added at the class level
public class PersonController {

    @GetMapping("/person/{id}")
    public ResponseEntity<Integer> getPersonByID(
            @PathVariable("id")
            @Max(value = 5, message = "ID cannot exceed 5") // Key step 2: Validation annotation placed directly on the parameter
            Integer id
    ) {
        // If id > 5 is passed, Spring throws ConstraintViolationException before entering the method body.
        // The global exception handler must also handle this exception.
        return ResponseEntity.ok().body(id);
    }

    @GetMapping("/person")
    public ResponseEntity<String> findPersonByName(
            @RequestParam("name")
            @NotBlank(message = "Name cannot be blank") // Also works on @RequestParam
            @Size(max = 10, message = "Name length cannot exceed 10")
            String name
    ) {
        return ResponseEntity.ok().body("Found person: " + name);
    }
}
```

Bean Validation primarily addresses **data format and syntactic validation**. However, that alone is not enough.

## Authorization Validation (Permission Check)

Once the data format has been validated and passes, a crucial question remains: **is the currently logged-in user actually authorized to perform this operation?** That is the problem **authorization validation** solves. For example:

- Can a regular user modify someone else's order? (No)
- Can a guest access admin backend endpoints? (No)
- Can a guest manage other users' information? (No)
- Can a VIP user redeem VIP-exclusive coupons? (Yes)
- ...

Data validation and authorization checks do not strictly follow a single identical order across every endpoint. Typically, request parsing, length limits, and basic format checks should run first, alongside confirming user identity as early as possible; before revealing whether a resource exists or returning query results to the caller, coarse-grained and object-level authorization checks must be completed. When authorization depends on resource attributes, authorization conditions can be pushed directly into the query or checked immediately after loading—but resource details must never be leaked prior to authorization. Afterwards, business consistency validation and finer-grained authorization checks are executed within the Service or data-access layer following transactional semantics.

Authorization checks answer "**Who** can perform **what Action** on **what Resource**." Regardless of how layers are structured, resource contents must never be returned without authorization, nor can the system rely solely on a single check in the Controller or on the frontend.

**Why are authorization checks so important?**

- **Security cornerstone:** Prevents unauthorized access and operations, protecting user data and system security.
- **Business isolation:** Ensures different roles (administrators, regular users, VIP users, etc.) can only access and operate features within their permitted scope.
- **Compliance requirements:** Many industry regulations impose strict rules on data access permissions.

Currently, the mainstream practice in Java backends is to use a mature security framework for authorization rather than hand-rolling your own logic (which is error-prone and hard to maintain):

1. **Spring Security (industry standard, recommended):** Intercepts requests via a Filter Chain to perform authentication ("Who are you?") and authorization ("What are you allowed to do?"). Spring Security is powerful, backed by an active community, and seamlessly integrated into the Spring ecosystem. However, its configuration is relatively complex and its learning curve is steeper.
2. **Apache Shiro:** Another popular security framework that is lighter than Spring Security with a more intuitive, easy-to-understand API. It also provides authentication, authorization, session management, cryptography, and more. It is a solid option for projects unfamiliar with Spring or finding Spring Security too heavyweight.
3. **Sa-Token:** A lightweight Java authentication and authorization framework from China. It supports authentication, authorization, SSO, forced sign-out ("kicking users offline"), automatic token renewal, and more. Compared with Spring Security and Shiro, Sa-Token includes more out-of-the-box features and is simpler to use.
4. **Manual checks (not recommended for complex scenarios):** Retrieving current user details manually in the Service or Controller layer (for instance, from `SecurityContextHolder` or `Session`) and checking user roles or permissions with `if-else`. This tightly couples authorization logic with business logic, leads to duplicated code, is hard to maintain, and is easy to miss. Suitable only for very simple permission scenarios.

**Brief Introduction to Access Control Models:**

- **RBAC (Role-Based Access Control):** Assigns roles to users and permissions to roles. A user holds the union of permissions across all assigned roles. This is the most common model.
- **ABAC (Attribute-Based Access Control):** Decisions are based on user attributes, resource attributes, action attributes, and environmental attributes. More flexible, yet also more complex.

In general, the vast majority of systems use the RBAC model or a simplified version of it, as illustrated below:

![RBAC Permission Model Diagram](/media/jg/ext/oss.javaguide.cn/system-design/security/design-of-authority-system/rbac-a304d5af.png)

For a detailed guide on authorization system design, refer to this article: [Authorization System Design Explained](https://javaguide.cn/system-design/security/design-of-authority-system.html).

## Summary

In summary, to build a secure, stable web application with a great user experience, all three checkpoints—frontend data validation, backend data validation, and backend authorization validation—must be properly established, each serving its distinct role:

- **Frontend data validation:** Enhances user experience and reduces invalid requests; it acts as the first "friendly" line of defense.
- **Backend data validation:** Ensures data format correctness and compliance with business rules; it serves as the "technical" line of defense preventing dirty data from entering the database. Bean Validation makes it easy to declare validation rules directly via annotations on JavaBean properties (such as DTO objects).
- **Backend authorization validation:** Ensures the "right person" performs the "right action"; it serves as the "security" line of defense against privilege escalation and unauthorized operations. Frameworks such as Spring Security, Shiro, and Sa-Token help implement authorization effectively.

## References

- OWASP Authorization Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>
- Why Do Both Frontend and Backend Need Data Validation?: <https://juejin.cn/post/7306045519099658240>
- Authorization System Design Explained: <https://javaguide.cn/system-design/security/design-of-authority-system.html>
