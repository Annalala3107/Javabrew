---
title: Hướng dẫn ngắn gọn về RESTful API
description: Giải thích chi tiết quy chuẩn thiết kế RESTful API, bao gồm nguyên tắc kiến trúc REST, thiết kế đường dẫn tài nguyên, cách sử dụng phương thức HTTP và quy chuẩn mã trạng thái.
category: Chất lượng code
head:
  - - meta
    - name: keywords
      content: RESTful API,REST,Thiết kế API,Đường dẫn tài nguyên,Phương thức HTTP,Mã trạng thái,Tính lũy đẳng,Quy chuẩn API
lang: vi
sourceRef: zh-ref/system-design/basis/RESTfulAPI.md
---

Bài viết này sẽ chia sẻ ngắn gọn những kiến thức về RESTful API mà lập trình viên Backend bắt buộc phải nắm.

Trước khi đi vào giới thiệu chính thức về RESTful API, trước tiên chúng ta cần làm rõ: **API thực chất là gì?**

## API là gì?

**API (Application Programming Interface)** dịch sang tiếng Việt là Giao diện lập trình ứng dụng.

Khi phát triển Backend, công việc chủ yếu của chúng ta là cung cấp API cho Frontend hoặc các dịch vụ Backend khác, ví dụ như API truy vấn dữ liệu người dùng.

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/basis/20210507130629538-201dc50b.png)

Tuy nhiên, API không chỉ đại diện cho các endpoint mà hệ thống Backend mở ra; những phương thức được cung cấp sẵn trong Framework cũng thuộc phạm vi của API.

Để mọi người dễ hình dung, tôi xin lấy thêm một vài ví dụ 🌰:

1. Bạn tìm kiếm một sản phẩm trên trang thương mại điện tử, lúc này Frontend của trang thương mại điện tử sẽ gọi API tìm kiếm sản phẩm do Backend cung cấp.
2. Bạn dùng JDK để phát triển chương trình Java và muốn đọc dữ liệu nhập từ người dùng thì phải sử dụng các API liên quan đến I/O do JDK cung cấp.
3. ......

Bạn có thể hiểu API như một cây cầu kết nối giao tiếp giữa chương trình với chương trình, bản chất của nó thực chất cũng chỉ là một hàm mà thôi. Ngoài ra, việc sử dụng API không phải muốn dùng thế nào cũng được—các quy tắc của nó (chẳng hạn định dạng dữ liệu đầu vào và đầu ra) do bên cung cấp API quy định.

## RESTful API là gì?

**RESTful API** thường còn được gọi là **REST API**, là API được xây dựng dựa trên REST. Cái REST này thực chất là gì thì phần sau chúng ta sẽ nói kỹ, vì nó liên quan đến khá nhiều khái niệm.

Nếu đọc các bài viết chuyên sâu về RESTful API, bạn sẽ thấy chúng thường khá hàn lâm và khó hiểu, chủ yếu vì một số khái niệm của REST tương đối trừu tượng. Nhưng trên thực tế, những kiến thức RESTful API mà chúng ta dùng trong công việc phát triển hằng ngày lại rất đơn giản và dễ tóm tắt!

Ví dụ, nếu tôi đưa cho bạn hai API dưới đây, có phải bạn biết ngay lập tức chúng dùng để làm gì không! Đó chính là sức mạnh của RESTful API.

```plain
GET    /classes: Liệt kê tất cả lớp học
POST   /classes: Tạo mới một lớp học
```

**RESTful API giúp bạn chỉ cần nhìn vào URL + HTTP Method là biết URL đó làm gì, và chỉ cần nhìn vào mã trạng thái HTTP (Status Code) là biết kết quả Request ra sao.**

Khi thiết kế API trong quá trình phát triển, tối thiểu chúng ta cũng nên đáp ứng những yêu cầu cơ bản nhất của RESTful API (ví dụ trong đường dẫn cố gắng dùng danh từ, dùng Request `POST` để tạo tài nguyên, Request `DELETE` để xóa tài nguyên,...; ví dụ `GET /notes/{id}`: lấy thông tin ghi chú có id chỉ định).

## Giải mã REST

**REST** là viết tắt của `REpresentational State Transfer` (Chuyển đổi trạng thái biểu diễn).

Nghe cụm từ này có vẻ hơi trừu tượng; nói một cách trực diện, REST mô tả việc Client chuyển từ một trạng thái ứng dụng này sang một trạng thái ứng dụng khác thông qua "hình thức biểu diễn" của tài nguyên. Nếu vẫn chưa hình dung được, hãy tiếp tục đọc xuống dưới—tin rằng phần giải thích sau sẽ giúp bạn hiểu rõ rốt cuộc REST là gì.

Chúng ta sẽ giải thích từng khái niệm liên quan ở trên để hiểu sâu hơn. Thực ra, bạn không cần hiểu hết các khái niệm lý thuyết này cũng vẫn đọc hiểu được phần quy chuẩn ở mục tiếp theo; tuy nhiên, để có thể trao đổi tự tin với người khác về "RESTful API", tôi khuyên bạn vẫn nên nắm vững!

- **Tài nguyên (Resource)**: Chúng ta có thể gọi các đối tượng dữ liệu thực tế là tài nguyên. Một tài nguyên có thể là một tập hợp hoặc một thực thể đơn lẻ. Ví dụ `classes` đại diện cho tài nguyên dạng tập hợp, còn một `class` cụ thể đại diện cho tài nguyên đơn lẻ. Mỗi tài nguyên đều có một URI (Uniform Resource Identifier - Định danh tài nguyên thống nhất) tương ứng; nếu cần lấy tài nguyên này, chỉ cần truy cập URI đó là được, chẳng hạn lấy lớp học cụ thể: `/classes/12`. Ngoài ra, tài nguyên còn có thể chứa tài nguyên con, ví dụ `/classes/{classId}/teachers`: liệt kê thông tin tất cả giáo viên của một lớp chỉ định.
- **Hình thức biểu diễn (Representation)**: "Tài nguyên" là một thực thể thông tin, nó có thể có nhiều hình thức thể hiện bên ngoài khác nhau. Hình thức cụ thể mà "tài nguyên" được trình bày ra—như `json`, `xml`, `image`, `txt`,...—được gọi là "tầng biểu diễn / hình thức biểu diễn" của nó.
- **Chuyển đổi trạng thái (State Transfer)**: Lần đầu tiên nhìn thấy cụm từ này hẳn ai cũng sẽ thấy hơi "lú" và thầm nghĩ trong bụng: *"Ủa, cái gì vậy trời?"* Nói một cách bình dân là: Client thông qua hình thức biểu diễn của tài nguyên cùng các thông tin điều khiển như liên kết bên trong đó để chuyển từ trạng thái ứng dụng này sang trạng thái ứng dụng khác. Việc thực hiện thêm/xóa/sửa/truy vấn qua các phương thức HTTP cũng có thể làm thay đổi trạng thái tài nguyên phía Server. *Lưu ý:* HTTP là một giao thức phi trạng thái (Stateless), Server không cần lưu trạng thái phiên (Session State) của Client giữa hai lần Request.

Tổng hợp lại phần giải thích ở trên, chúng ta đúc kết kiến trúc RESTful là gì:

1. Mỗi URI đại diện cho một loại tài nguyên;
2. Giữa Client và Server truyền qua lại một hình thức biểu diễn nào đó của tài nguyên này, như `json`, `xml`, `image`, `txt`,...;
3. Client thông qua các động từ HTTP (HTTP Verb) cụ thể để thao tác lên tài nguyên phía Server, thực hiện "Chuyển đổi trạng thái biểu diễn".

## Quy chuẩn RESTful API

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/basis/20210507154007779-b08d4a13.png)

### Hành động (Phương thức HTTP)

- `GET`: Yêu cầu lấy tài nguyên cụ thể từ Server. Ví dụ: `GET /classes` (lấy tất cả lớp học).
- `POST`: Để tài nguyên đích xử lý nội dung Request theo ngữ nghĩa của riêng nó, thường dùng để tạo mới tài nguyên. Ví dụ: `POST /classes` (tạo mới lớp học).
- `PUT`: Tạo mới hoặc thay thế trạng thái hiện tại của tài nguyên đích (Client thường cung cấp toàn bộ tài nguyên sau khi cập nhật). Ví dụ: `PUT /classes/12` (cập nhật lớp học mã 12).
- `DELETE`: Gỡ bỏ mối liên kết giữa URI đích và chức năng/tài nguyên hiện tại của nó. Ví dụ: `DELETE /classes/12` (xóa lớp học mã 12).
- `PATCH`: Cập nhật tài nguyên trên Server (Client chỉ cung cấp các thuộc tính cần thay đổi, có thể coi là cập nhật một phần); ít được dùng hơn nên ở đây không lấy ví dụ.

Trong đó, `GET` vừa an toàn (Safe) vừa lũy đẳng (Idempotent), `PUT` và `DELETE` có tính lũy đẳng, còn `PATCH` mặc định không đảm bảo tính lũy đẳng.

### Đường dẫn (Đặt tên Endpoint)

Đường dẫn còn được gọi là "điểm cuối" (Endpoint), biểu thị địa chỉ URL cụ thể của API. Các quy chuẩn phổ biến trong phát triển thực tế như sau:

1. **URL của HTTP API hướng tài nguyên thường dùng danh từ, và danh từ thường ở dạng số nhiều.** Đây là quy ước đặt tên URI phổ biến chứ không phải ràng buộc bắt buộc của bản thân REST. Nếu lời gọi API khó trừu tượng hóa thành tài nguyên (như các thao tác tính toán, dịch thuật,...), cũng có thể dùng động từ. Ví dụ: `GET /calculate?param1=11&param2=33`.
2. **Không dùng chữ viết hoa, nên dùng dấu gạch nối `-` thay cho dấu gạch dưới `_`.** Ví dụ mã mời nên viết là `invitation-code` thay vì ~~`invitation_code`~~.
3. **Tận dụng tốt việc đánh phiên bản (Versioning) cho API.** Khi API có thay đổi lớn không tương thích với phiên bản cũ, chúng ta có thể phân phiên bản ngay trên URL, ví dụ `http://api.example.com/v1` hoặc `http://apiv1.example.com`. Phiên bản không nhất thiết cứ phải là con số, chẳng qua con số được dùng nhiều nhất thôi; ngày tháng hay mùa cũng đều có thể làm định danh phiên bản, miễn là đội ngũ dự án thống nhất với nhau là được.
4. **Endpoint cố gắng sử dụng danh từ, tránh dùng động từ.** RESTful API thao tác (qua HTTP Method) lên tài nguyên (danh từ) chứ không phải hành động (động từ).

Talk is cheap! Hãy lấy một ví dụ thực tế để minh họa nhé! Giả sử có một API cung cấp thông tin về lớp học (class), bao gồm cả thông tin học sinh và giáo viên trong lớp đó, thì các đường dẫn của nó nên được thiết kế như sau:

```plain
GET    /classes: Liệt kê tất cả lớp học
POST   /classes: Tạo mới một lớp học
GET    /classes/{classId}: Lấy thông tin của một lớp học chỉ định
PUT    /classes/{classId}: Cập nhật thông tin của một lớp học chỉ định (thường thiên về cập nhật toàn bộ)
PATCH  /classes/{classId}: Cập nhật thông tin của một lớp học chỉ định (thường thiên về cập nhật một phần)
DELETE /classes/{classId}: Xóa một lớp học
GET    /classes/{classId}/teachers: Liệt kê thông tin tất cả giáo viên của một lớp học chỉ định
GET    /classes/{classId}/students: Liệt kê thông tin tất cả học sinh của một lớp học chỉ định
DELETE /classes/{classId}/teachers/{ID}: Xóa thông tin của một giáo viên chỉ định thuộc một lớp học chỉ định
```

Ví dụ sai:

```plain
/getAllclasses
/createNewclass
/deleteAllActiveclasses
```

Cần làm rõ cấu trúc phân cấp của tài nguyên. Ví dụ, nếu phạm vi nghiệp vụ xoay quanh trường học, thì trường học sẽ là tài nguyên cấp một (`/schools`), còn giáo viên (`/schools/{schoolId}/teachers`) và học sinh (`/schools/{schoolId}/students`) là tài nguyên cấp hai.

### Lọc thông tin (Filtering)

Nếu trong lúc truy vấn cần thêm các điều kiện cụ thể, nên sử dụng hình thức tham số URL (Query Parameters). Ví dụ chúng ta muốn truy vấn các lớp học có trạng thái `state` là `active` và `name` là `guidegege`:

```plain
GET    /classes?state=active&name=guidegege
```

Ví dụ chúng ta muốn triển khai truy vấn phân trang:

```plain
GET    /classes?page=1&size=10 // Chỉ định trang 1, mỗi trang 10 bản ghi
```

### Mã trạng thái (Status Codes)

**Phạm vi mã trạng thái:**

| 2xx: Thành công          | 3xx: Chuyển hướng                 | 4xx: Lỗi phía Client                   | 5xx: Lỗi phía Server                 |
| ------------------------ | --------------------------------- | -------------------------------------- | ------------------------------------ |
| 200 Thành công (OK)      | 301 Chuyển hướng vĩnh viễn        | 400 Yêu cầu không hợp lệ (Bad Request) | 500 Lỗi máy chủ nội bộ               |
| 201 Đã tạo (Created)     | 304 Tài nguyên không thay đổi     | 401 Chưa xác thực (Unauthorized)       | 502 Lỗi Gateway (Bad Gateway)        |
|                          |                                   | 403 Bị cấm truy cập (Forbidden)        | 504 Hết thời gian chờ Gateway        |
|                          |                                   | 404 Không tìm thấy (Not Found)         |                                      |
|                          |                                   | 405 Phương thức không được phép        |                                      |

## HATEOAS trong REST

> **Trong định nghĩa ban đầu của Fielding về REST, HATEOAS là một phần của ràng buộc giao diện thống nhất (Uniform Interface). Tuy nhiên, trong thực tế kỹ thuật, rất nhiều HTTP/JSON API được gọi là REST API lại không triển khai nó.**

Những phần trên là kiến thức cơ bản nhất của RESTful API và cũng là phần dễ áp dụng nhất trong quá trình phát triển hằng ngày. HATEOAS yêu cầu điều khiển trạng thái ứng dụng thông qua Hypermedia, tức là trong kết quả trả về có cung cấp liên kết cùng các thông tin điều khiển khác, giúp người dùng không cần tra tài liệu mà vẫn biết bước tiếp theo nên làm gì.

Ví dụ, khi người dùng gửi Request tới đường dẫn gốc của `api.example.com`, họ sẽ nhận được kết quả trả về như sau:

```javascript
{"link": {
  "rel":   "collection",
  "href":  "https://api.example.com/classes",
  "title": "List of classes",
  "type":  "application/vnd.yourformat+json"
}}
```

Đoạn trên cho thấy trong tài liệu trả về có thuộc tính `link`; người dùng đọc thuộc tính này là biết ngay bước tiếp theo cần gọi API nào. `rel` biểu thị mối quan hệ giữa tài nguyên đích và ngữ cảnh hiện tại, `href` biểu thị đường dẫn tài nguyên đích, `title` biểu thị tiêu đề liên kết, còn `type` là gợi ý kiểu phương tiện (Media Type) cho hình thức biểu diễn của tài nguyên đích. Thiết kế `Hypermedia API` như vậy được gọi là [HATEOAS](https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven).

Trong Spring có một thư viện API tên là Spring HATEOAS giúp chúng ta tạo ra các API tuân thủ thiết kế HATEOAS dễ dàng hơn. Các bài viết liên quan:

- [Sử dụng HATEOAS trong Spring Boot](https://blog.aisensiy.me/2017/06/04/spring-boot-and-hateoas/)
- [Building REST services with Spring](https://spring.io/guides/tutorials/rest/) (Trang chủ Spring)
- [An Intro to Spring HATEOAS](https://www.baeldung.com/spring-hateoas-tutorial)
- [spring-hateoas-examples](https://github.com/spring-projects/spring-hateoas-examples/tree/master/hypermedia)
- [Spring HATEOAS](https://spring.io/projects/spring-hateoas#learn) (Trang chủ Spring)

## Tài liệu tham khảo

- [Luận án của Fielding: Representational State Transfer](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)

- [RFC 5789: PATCH Method for HTTP](https://www.rfc-editor.org/rfc/rfc5789.html)

- [RFC 8288: Web Linking](https://www.rfc-editor.org/rfc/rfc8288.html)

- <https://RESTfulapi.net/>

- <https://www.ruanyifeng.com/blog/2014/05/restful_api.html>

- <https://juejin.im/entry/59e460c951882542f578f2f0>

- <https://phauer.com/2016/testing-RESTful-services-java-best-practices/>

- <https://www.seobility.net/en/wiki/REST_API>

- <https://dev.to/duomly/rest-api-vs-graphql-comparison-3j6g>
