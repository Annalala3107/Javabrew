---
title: Kiến thức cơ bản về J2EE
description: Giải thích chi tiết kiến thức nền tảng J2EE, bao gồm vòng đời Servlet, Forward và Redirect, cơ chế Session và Cookie cùng các khái niệm cốt lõi của Java Web.
category: Thiết kế hệ thống (System Design)
head:
  - - meta
    - name: keywords
      content: J2EE,Java Web,Servlet,JSP,HTTP Request và Response,Vòng đời Servlet,Session,Cookie
lang: vi
sourceRef: zh-ref/system-design/J2EE基础知识.md
---

## Tổng kết về Servlet

> Lưu ý: J2EE là tên gọi lịch sử, sau này đổi tên thành Java EE và tên đặc tả hiện tại là Jakarta EE. Bài viết này chủ yếu giới thiệu mô hình lập trình Servlet/JSP truyền thống.

Trong ứng dụng Java Web, **Servlet** chủ yếu đảm nhiệm việc tiếp nhận request từ người dùng (`HttpServletRequest`), xử lý trong các phương thức như `doGet()`, `doPost()` rồi trả về phản hồi thông qua `HttpServletResponse`. Có thể thiết lập các tham số khởi tạo cho Servlet để dùng nội bộ. Trong môi trường không phân tán, Servlet Container thường chỉ tạo một instance duy nhất cho **mỗi khai báo Servlet**; nếu cùng một lớp Servlet có nhiều khai báo khác nhau thì vẫn có thể tồn tại nhiều instance. Container gọi `init()` khi khởi tạo và gọi `destroy()` khi instance ngừng phục vụ. Servlet có thể được khai báo qua `@WebServlet`, `web.xml` hoặc API lập trình, và một khai báo Servlet cũng có thể ánh xạ tới nhiều URL. Container có thể cho phép nhiều Thread thực thi đồng thời phương thức `service()` trên cùng một instance, vì vậy không nên lưu trạng thái biến đổi theo từng request trong các trường (field) của instance.

## Trình bày sự khác nhau giữa Servlet và CGI?

### Hạn chế của CGI

1. Cần khởi tạo một tiến trình (Process) hệ điều hành chạy chương trình CGI cho mỗi request. Nếu lượng request lớn và liên tục, điều này sẽ tạo ra chi phí tài nguyên rất cao.

2. Cần nạp và chạy một chương trình CGI cho mỗi request, gây ra chi phí vận hành lớn.

3. Cần viết lặp đi lặp lại mã xử lý giao thức mạng và mã hóa dữ liệu; những công việc này rất tốn thời gian.

### Ưu điểm của Servlet

1. Chỉ cần khởi chạy một tiến trình hệ điều hành và nạp một JVM, giúp giảm đáng kể chi phí hệ thống.

2. Khi nhiều request cần thực hiện cùng một xử lý, chỉ cần nạp một lớp duy nhất, từ đó giảm mạnh chi phí.

3. Tất cả các lớp được nạp động có thể dùng chung phần xử lý giao thức mạng và giải mã request, giảm đáng kể khối lượng công việc.

4. Servlet có thể tương tác trực tiếp với Web Server, trong khi chương trình CGI thông thường thì không. Servlet cũng có thể chia sẻ dữ liệu giữa các thành phần với nhau, giúp những tính năng như Database Connection Pool trở nên rất dễ triển khai.

Bổ sung: Sun Microsystems ra mắt công nghệ Servlet vào năm 1996 nhằm cạnh tranh với CGI. Servlet là một chương trình Java đặc biệt; một ứng dụng Web nền Java thường chứa một hoặc nhiều lớp Servlet. Servlet không thể tự khởi tạo và tự chạy mà vận hành bên trong Servlet Container; Container chuyển request của người dùng tới chương trình Servlet rồi gửi lại phản hồi của Servlet cho người dùng. Thông thường một Servlet sẽ gắn với một hoặc nhiều trang JSP. Trước đây CGI thường bị chê trách về chi phí hiệu năng, tuy nhiên FastCGI từ lâu đã giải quyết vấn đề hiệu quả của CGI, vì vậy khi phỏng vấn không nên phê bình CGI một cách võ đoán — thực tế rất nhiều website quen thuộc vẫn sử dụng công nghệ CGI.

Tham khảo: *Java Web Integrated Development: Return of the King*, trang 7

## Giao diện Servlet có những phương thức nào & Khám phá vòng đời Servlet

Giao diện `Servlet` định nghĩa 5 phương thức, trong đó **3 phương thức đầu tiên liên quan đến vòng đời Servlet**:

- `void init(ServletConfig config) throws ServletException`
- `void service(ServletRequest req, ServletResponse resp) throws ServletException, java.io.IOException`
- `void destroy()`
- `java.lang.String getServletInfo()`
- `ServletConfig getServletConfig()`

**Vòng đời (Lifecycle):** **Sau khi Web Container nạp và khởi tạo đối tượng Servlet, vòng đời của Servlet bắt đầu.** Container chạy phương thức **`init()`** để khởi tạo Servlet; khi có request đến sẽ gọi phương thức **`service()`** của Servlet, phương thức này tùy theo loại request mà gọi tới **`doGet` hoặc `doPost`** tương ứng; khi máy chủ tắt hoặc dự án bị gỡ bỏ (undeploy), máy chủ sẽ hủy instance Servlet và gọi phương thức **`destroy()`**. **Phương thức `init` và `destroy` chỉ chạy một lần duy nhất, còn phương thức `service` sẽ chạy mỗi khi Client gửi request tới Servlet.** Trong Servlet đôi khi cần dùng các tài nguyên phải khởi tạo và giải phóng, vì vậy có thể đặt mã khởi tạo tài nguyên vào `init` và mã giải phóng tài nguyên vào `destroy` để không phải khởi tạo và hủy tài nguyên ở mọi lần xử lý request của Client.

Tham khảo: *Java Web Integrated Development: Return of the King*, trang 81

## Sự khác nhau giữa GET và POST

Chủ đề này từng được thảo luận rất sôi nổi trên Zhihu tại: <https://www.zhihu.com/question/28586791>.

![](/media/jg/ext/static001.geekbang.org/infoq/04/0454a5fff1437c32754f1dfcc3881148-de486259.webp)

GET và POST là hai phương thức request phổ biến trong giao thức HTTP, có đặc điểm và cách dùng khác nhau tùy kịch bản và mục đích. Nhìn chung có thể phân biệt qua các khía cạnh sau:

- Khác biệt về ngữ nghĩa: GET dùng để lấy biểu diễn của tài nguyên đích, là phương thức an toàn (safe) và có tính lũy đẳng (idempotent). POST dùng để yêu cầu tài nguyên đích xử lý nội dung request theo ngữ nghĩa riêng của nó, thường dùng để tạo tài nguyên, gửi dữ liệu hoặc kích hoạt thao tác, và mặc định không có tính lũy đẳng.
- Khác biệt về định dạng: Điều kiện truy vấn của request GET thường đặt trong query string của URL, còn POST thường truyền dữ liệu qua phần thân (body) của request với các kiểu nội dung như `application/x-www-form-urlencoded`, `multipart/form-data`, `application/json`, v.v. Đặc tả HTTP không quy định một giới hạn cố định chung cho độ dài URL hay thân request POST; giới hạn thực tế do trình duyệt, máy chủ, gateway và các thành phần trung gian quyết định.
- Khác biệt về bộ nhớ đệm (Cache): Phản hồi GET mặc định có thể được cache, nhưng vẫn chịu ràng buộc bởi các header phản hồi như `Cache-Control`. Phản hồi POST không phải tuyệt đối không thể cache, chỉ là phía Server phải khai báo rõ thông tin cho phép cache, và thực tế ít khi dùng theo cách này.
- Khác biệt về bảo mật: Cả GET và POST đều không an toàn tuyệt đối vì bản thân giao thức HTTP truyền dữ liệu dạng văn bản thuần (plaintext) — dù là URL, header hay body đều có thể bị nghe lén hoặc chỉnh sửa. Để đảm bảo an toàn, bắt buộc phải dùng HTTPS để mã hóa dữ liệu truyền tải. Tuy vậy, trong một số kịch bản, request GET dễ làm lộ dữ liệu nhạy cảm hơn POST vì tham số GET nằm trực tiếp trên URL, mà URL có thể bị lưu lại trong lịch sử trình duyệt, log máy chủ, log proxy... Do đó, thông thường dữ liệu riêng tư nên truyền qua POST kèm request body.

Điểm mấu chốt là lựa chọn GET hay POST dựa theo ngữ nghĩa chuẩn của phương thức HTTP. Thiết kế mọi request đều thành POST tuy khả thi về mặt kỹ thuật, nhưng sẽ đánh mất lợi thế của GET về caching, retry an toàn và ngữ nghĩa với các thành phần trung gian; không nên chỉ lấy "thống nhất nội bộ trong nhóm" làm căn cứ thiết kế.

## Khi nào gọi `doGet()` và `doPost()`?

Khi thuộc tính `method` trong thẻ `<form>` là `get` thì gọi `doGet()`, khi là `post` thì gọi `doPost()`.

## Sự khác nhau giữa Forward và Redirect

**Forward là hành vi phía Server, còn Redirect là hành vi phía Client.**

**Forward (Chuyển tiếp nội bộ)**
Được thực hiện thông qua phương thức `forward(HttpServletRequest request, HttpServletResponse response)` của đối tượng `RequestDispatcher`. `RequestDispatcher` có thể lấy từ phương thức `getRequestDispatcher()` của `HttpServletRequest`. Ví dụ đoạn mã sau chuyển tiếp tới trang `login_success.jsp`:

```java
     request.getRequestDispatcher("login_success.jsp").forward(request, response);
```

**Redirect (Chuyển hướng)** do Server trả về mã trạng thái 3xx kèm header phản hồi `Location`, sau đó Client tự gửi request mới tới địa chỉ mới. Trong Servlet thường dùng `HttpServletResponse#sendRedirect()`, hoặc cũng có thể tự thiết lập mã trạng thái và `Location`. Trong các hiện thực lịch sử, mã 301, 302, 303 có thể đổi request POST tiếp theo thành GET; khi cần giữ nguyên phương thức request ban đầu một cách rõ ràng, nên dùng 307 hoặc 308 tùy kịch bản.

1. **Hiển thị trên thanh địa chỉ**

   Với `forward`, Server trực tiếp truy cập URL đích để yêu cầu tài nguyên, đọc nội dung phản hồi từ URL đó rồi gửi nội dung này về trình duyệt. Trình duyệt hoàn toàn không biết Server lấy nội dung từ đâu, nên thanh địa chỉ vẫn giữ nguyên địa chỉ cũ.
   Với `redirect`, Server dựa vào logic để gửi về một mã trạng thái, yêu cầu trình duyệt tự gửi lại request đến địa chỉ mới đó. Vì vậy thanh địa chỉ sẽ hiển thị URL mới.

2. **Chia sẻ dữ liệu**

   `forward`: Trang chuyển tiếp và trang đích có thể dùng chung dữ liệu trong `request`.
   `redirect`: Không thể dùng chung dữ liệu trong `request`.

3. **Ngữ cảnh áp dụng**

   `forward`: Thường dùng khi người dùng đăng nhập, căn cứ theo vai trò để chuyển tiếp tới module tương ứng.
   `redirect`: Thường dùng khi người dùng đăng xuất để quay về trang chủ, hoặc chuyển hướng sang website khác.

4. **Hiệu suất**

   `forward`: Cao hơn.
   `redirect`: Thấp hơn.

## Tự động làm mới (Refresh)

Một số trình duyệt hỗ trợ header phản hồi không chuẩn `Refresh` để tự động làm mới hoặc chuyển trang sau một khoảng trễ. Trong Servlet có thể thiết lập qua `HttpServletResponse`:

```java
response.setHeader("Refresh", "5; url=http://localhost:8080/servlet/example.htm");
```

Trong đó `5` có đơn vị là giây. Do `Refresh` không phải header HTTP chuẩn nên không được dùng thay thế cho chuyển hướng 3xx chuẩn; việc làm mới trang cũng có thể triển khai ở phía Frontend tùy nhu cầu.

## Servlet và tính an toàn luồng (Thread Safety)

**Servlet không an toàn với đa luồng (Thread-safe); việc nhiều Thread đọc ghi đồng thời sẽ gây ra lỗi không đồng bộ dữ liệu.** Cách giải quyết là hạn chế tối đa việc khai báo thuộc tính như `name` ở cấp instance, thay vào đó khai báo các biến cục bộ riêng bên trong `doGet()` và `doPost()`. Tuy dùng khối lệnh `synchronized(name){}` có thể giải quyết vấn đề, nhưng nó khiến các Thread phải chờ nhau nên không phải cách làm khoa học.
Lưu ý: Nhiều Thread đọc ghi đồng thời thuộc tính lớp Servlet sẽ gây sai lệch dữ liệu, nhưng nếu chỉ đọc đồng thời mà không ghi thì không xảy ra vấn đề này. Vì vậy các thuộc tính chỉ đọc trong Servlet tốt nhất nên khai báo là `final`.

Tham khảo: *Java Web Integrated Development: Return of the King*, trang 92

## Mối quan hệ giữa JSP và Servlet là gì?

Như đã trình bày ở trên, Servlet là một chương trình Java đặc biệt chạy trong JVM của máy chủ, dựa vào hỗ trợ của máy chủ để cung cấp nội dung hiển thị cho trình duyệt. JSP về bản chất là một dạng giản lược của Servlet; JSP được máy chủ biên dịch thành một chương trình Java tương tự Servlet nhằm đơn giản hóa việc sinh nội dung trang web. Điểm khác biệt chính giữa Servlet và JSP là logic ứng dụng của Servlet nằm trong file Java và tách biệt hoàn toàn khỏi HTML ở tầng trình bày, còn với JSP thì Java và HTML có thể kết hợp trong một file có phần mở rộng `.jsp`. Có người nói Servlet là viết HTML trong Java, còn JSP là viết code Java trong HTML — tất nhiên nhận xét này còn phiến diện và chưa thật chính xác. JSP thiên về phần hiển thị (View), còn Servlet thiên về logic điều khiển (Controller). Trong mô hình kiến trúc MVC, JSP phù hợp đóng vai trò View, còn Servlet phù hợp đóng vai trò Controller.

## Nguyên lý hoạt động của JSP

Trang JSP được JSP Container chuyển đổi thành lớp cài đặt Servlet rồi biên dịch. Đối với HTTP, lớp được sinh ra phải triển khai giao diện `HttpJspPage` (giao diện này kế thừa từ `JspPage`). Trong cấu hình biên dịch theo nhu cầu (on-demand compilation) phổ biến, việc chuyển đổi và biên dịch diễn ra ở request đầu tiên; Container cũng có thể biên dịch trước (precompile) JSP nên đây không phải bước cố định chỉ xảy ra ở lần request đầu. Mã nguồn Java và file `.class` sinh ra thường được lưu trong thư mục làm việc của Container. Dưới đây là ví dụ minh họa trường hợp biên dịch theo nhu cầu.
Trong dự án `JspLoginDemo` có một file JSP tên là `login.jsp`. Sau khi triển khai dự án lên máy chủ lần đầu và truy cập vào file JSP này, ta thấy trong thư mục đó xuất hiện hai file mới.
File `.class` chính là Servlet tương ứng với JSP. Sau khi biên dịch xong, file `.class` sẽ được thực thi để phản hồi request của Client. Những lần sau khi Client truy cập `login.jsp`, Tomcat sẽ không biên dịch lại file JSP nữa mà gọi trực tiếp file `.class` để phục vụ request.

![Nguyên lý hoạt động của JSP](/media/jg/ext/oss.javaguide.cn/github/javaguide/1-d179fb5f.jpg)

Ở chế độ biên dịch theo nhu cầu, request đầu tiên phải thực hiện chuyển đổi và biên dịch nên thường chậm hơn các request tiếp theo. Nếu xóa file `.class` do Container tạo ra, Container sẽ biên dịch lại JSP khi trang đó được yêu cầu trở lại.

Khi phát triển ứng dụng Web, ta thường xuyên phải chỉnh sửa JSP. Tomcat có thể tự động phát hiện thay đổi trong mã nguồn JSP: nếu phát hiện file nguồn JSP có sửa đổi, Tomcat sẽ biên dịch lại JSP ở lần request tiếp theo của Client mà không cần khởi động lại Tomcat. Tính năng tự động kiểm tra này mặc định được bật; việc kiểm tra thay đổi tiêu tốn một chút thời gian nên khi triển khai ứng dụng Web lên môi trường chạy thật có thể tắt đi trong `web.xml`.

Tham khảo: *Java Web Integrated Development: Return of the King*, trang 97

## JSP có những đối tượng dựng sẵn (Built-in Objects) nào và tác dụng của từng đối tượng

[Các đối tượng dựng sẵn trong JSP - Blog CSDN](http://blog.csdn.net/qq_34337272/article/details/64310849)

JSP có 9 đối tượng dựng sẵn (implicit objects):

- `request`: Đóng gói request từ Client, bao gồm các tham số từ request GET hoặc POST;
- `response`: Đóng gói phản hồi của Server gửi về Client;
- `pageContext`: Thông qua đối tượng này có thể lấy được các đối tượng khác;
- `session`: Đối tượng đóng gói phiên làm việc (Session) của người dùng;
- `application`: Đối tượng đóng gói môi trường chạy của ứng dụng trên máy chủ (`ServletContext`);
- `out`: Đối tượng luồng xuất dùng để ghi nội dung phản hồi của máy chủ;
- `config`: Đối tượng cấu hình của ứng dụng Web / Servlet (`ServletConfig`);
- `page`: Bản thân trang JSP hiện tại (tương đương `this` trong chương trình Java);
- `exception`: Đối tượng đóng gói ngoại lệ (Exception) phát sinh trên trang.

## Các phương thức chính của đối tượng `Request`

- `setAttribute(String name,Object)`: Thiết lập giá trị thuộc tính request có tên `name`
- `getAttribute(String name)`: Trả về giá trị thuộc tính được chỉ định bởi `name`
- `getAttributeNames()`: Trả về tập tên của tất cả thuộc tính trên đối tượng request dưới dạng một `Enumeration`
- `getCookies()`: Trả về toàn bộ các đối tượng `Cookie` từ Client dưới dạng một mảng `Cookie[]`
- `getCharacterEncoding()`: Trả về bộ mã ký tự (character encoding) mà request sử dụng
- `getContentLength()`: Trả về số byte của thân request; trả về `-1` nếu chưa rõ độ dài hoặc vượt quá phạm vi `int`; với request lớn có thể dùng `getContentLengthLong()`
- `getHeader(String name)`: Lấy thông tin header HTTP theo tên `name`
- `getHeaders(String name)`: Trả về tất cả giá trị của request header có tên chỉ định dưới dạng một `Enumeration`
- `getHeaderNames()`: Trả về tên của tất cả request header dưới dạng một `Enumeration`
- `getInputStream()`: Trả về luồng nhập của request để đọc dữ liệu thô từ thân request
- `getMethod()`: Lấy phương thức HTTP mà Client dùng để gửi dữ liệu lên Server
- `getParameter(String name)`: Lấy giá trị tham số có tên `name` mà Client gửi lên Server
- `getParameterNames()`: Lấy tên của toàn bộ tham số Client gửi lên Server dưới dạng một `Enumeration`
- `getParameterValues(String name)`: Lấy tất cả các giá trị của tham số có tên `name`
- `getProtocol()`: Lấy tên giao thức mà Client dùng để truyền dữ liệu lên Server
- `getQueryString()`: Lấy chuỗi truy vấn (query string)
- `getRequestURI()`: Lấy phần đường dẫn URI trong dòng request nằm giữa tên giao thức và query string
- `getRemoteAddr()`: Lấy địa chỉ IP của Client
- `getRemoteHost()`: Lấy tên host của Client
- `getSession()`: Trả về `Session` gắn với request, tạo mới nếu chưa tồn tại
- `getSession(boolean create)`: Trả về `Session` gắn với request; khi `create` là `false` và `Session` chưa tồn tại thì trả về `null`
- `getServerName()`: Lấy tên của máy chủ
- `getServletPath()`: Lấy đường dẫn của tệp script / servlet mà Client yêu cầu
- `getServerPort()`: Lấy số cổng (port) của máy chủ
- `removeAttribute(String name)`: Xóa một thuộc tính khỏi request

## `request.getAttribute()` và `request.getParameter()` khác nhau như thế nào?

`getParameter()` đọc các tham số do Client gửi kèm request, chẳng hạn chuỗi truy vấn trên URL hoặc các trường dữ liệu form đã được phân tích. Phương thức này trả về `String`; khi cùng một tên tham số có nhiều giá trị thì có thể dùng `getParameterValues()`.

`getAttribute()` đọc đối tượng do code phía Server gắn vào request hiện tại thông qua `setAttribute()`, kiểu trả về là `Object`. Trong quá trình chuyển tiếp nội bộ phía Server như `forward`, các thành phần vẫn xử lý cùng một đối tượng request nên có thể chia sẻ request attribute; còn chuyển hướng phía Client (`redirect`) sẽ tạo request mới nên không giữ lại attribute của request cũ. Cơ chế này không phải là việc Container sao chép một vùng bộ nhớ giữa các trang.

## Sự khác nhau giữa chỉ thị `include` và hành động `include`

**Chỉ thị `include` (`include` directive):** JSP có thể nhúng các file khác bằng chỉ thị `include`. File được nhúng có thể là file JSP, HTML hoặc file văn bản thuần. File được nhúng giống như một phần của trang JSP đó, được biên dịch và thực thi cùng lúc. Cú pháp:
`<%@ include file="địa-chỉ-URL-tương-đối-của-file" %>`

**Hành động `include` (`include` action):** Phần tử hành động `<jsp:include>` dùng để nhúng các tài nguyên tĩnh và động, chèn kết quả của file chỉ định vào trang đang được sinh ra. Cú pháp:
`<jsp:include page="địa-chỉ-URL-tương-đối" flush="true" />`

## Chín đối tượng dựng sẵn, bảy hành động và ba chỉ thị trong JSP

[Tổng kết 9 đối tượng dựng sẵn, 7 hành động và 3 chỉ thị trong JSP](http://blog.csdn.net/qq_34337272/article/details/64310849)

## Giải thích bốn phạm vi (Scope) trong JSP

Bốn phạm vi trong JSP gồm `page`, `request`, `session` và `application`, cụ thể như sau:

- **`page`** đại diện cho các đối tượng và thuộc tính gắn với một trang JSP duy nhất.
- **`request`** đại diện cho các đối tượng và thuộc tính gắn với một request do Web Client gửi lên. Một request có thể đi qua nhiều trang và nhiều thành phần Web; dữ liệu tạm thời cần hiển thị ở các trang đó có thể đặt trong phạm vi này.
- **`session`** đại diện cho các đối tượng và thuộc tính gắn với một phiên làm việc giữa một người dùng cụ thể và máy chủ. Dữ liệu riêng của từng người dùng nên đặt trong `session` của chính người dùng đó.
- **`application`** đại diện cho các đối tượng và thuộc tính gắn với toàn bộ ứng dụng Web; về bản chất đây là phạm vi toàn cục xuyên suốt toàn bộ ứng dụng Web, bao gồm nhiều trang, nhiều request và nhiều phiên làm việc.

## Nên xử lý các request đồng thời trong Servlet như thế nào?

Trong lịch sử, JSP từng cung cấp `<%@ page isThreadSafe="false" %>`, và Servlet từng cung cấp giao diện đánh dấu (marker interface) `SingleThreadModel`. `SingleThreadModel` đã bị đánh dấu lỗi thời (deprecated) từ Servlet 2.4 và bị xóa bỏ trong Jakarta Servlet 6.0; ngoài ra nó cũng không đảm bảo tính an toàn luồng cho `Session` và trạng thái `static`, do đó không nên coi là giải pháp hiện tại.

Cách làm đúng đắn là giữ Servlet không trạng thái (stateless) hết mức có thể: đặt dữ liệu thay đổi theo từng request vào biến cục bộ trong phương thức, không lưu vào trường (field) của instance Servlet. Khi bắt buộc phải chia sẻ trạng thái, cần dùng cơ chế kiểm soát đồng thời phù hợp hoặc cấu trúc dữ liệu an toàn luồng (thread-safe), đồng thời thu hẹp vùng găng (critical section) nhỏ nhất có thể.

## Có những kỹ thuật nào để theo dõi phiên làm việc (Session Tracking)?

1. **Sử dụng Cookie**

   Gửi Cookie về Client:

   ```java
   Cookie c =new Cookie("name","value"); // Tạo Cookie
   c.setMaxAge(60*60*24); // Đặt thời gian sống tối đa, ở đây là 1 ngày
   response.addCookie(c); // Đưa Cookie vào phản hồi HTTP
   ```

   Đọc Cookie từ Client:

   ```java
   String name ="name";
   Cookie[]cookies =request.getCookies();
   if(cookies !=null){
      for(int i= 0;i<cookies.length;i++){
       Cookie cookie =cookies[i];
       if(name.equals(cookie.getName())) {
         // something is here.
         // you can get the value
         cookie.getValue();
       }

      }
    }

   ```

   **Ưu điểm:** Dữ liệu có thể lưu bền vững, không tốn tài nguyên máy chủ, đơn giản, lưu theo dạng Key-Value văn bản.

   **Nhược điểm:** Kích thước bị giới hạn, người dùng có thể tắt Cookie, và do lưu ở máy cục bộ nên tồn tại một số rủi ro bảo mật.

2. **Viết lại URL (URL Rewriting)**

   Thêm thông tin phiên của người dùng vào URL dưới dạng tham số truy vấn, hoặc gắn một Session ID duy nhất vào cuối URL để định danh một phiên làm việc.

   **Ưu điểm:** Vẫn sử dụng được khi Cookie bị vô hiệu hóa.

   **Nhược điểm:** Bắt buộc phải mã hóa mọi URL của website, tất cả các trang phải được sinh động, không thể truy cập bằng các URL tĩnh ghi sẵn từ trước.

3. **Trường biểu mẫu ẩn (Hidden Form Fields)**

   ```html
   <input type="hidden" name="session" value="..." />
   ```

   **Ưu điểm:** Sử dụng được khi Cookie bị tắt.

   **Nhược điểm:** Mọi trang đều phải là kết quả sau khi gửi form (submit).

4. **`HttpSession`**

   `HttpSession` không mặc nhiên tự động được tạo chỉ vì người dùng lần đầu truy cập website. Chỉ khi code gọi `HttpServletRequest#getSession()`, hoặc một framework/tính năng JSP yêu cầu `Session` cho request hiện tại, Container mới tạo `Session` nếu chưa tồn tại. Có thể lưu và đọc thuộc tính phiên thông qua `setAttribute()` và `getAttribute()`. Dữ liệu `HttpSession` được quản lý phía Server — có thể lưu trong bộ nhớ, bộ lưu trữ phân tán hoặc phương tiện lưu trữ bền vững — vì vậy không nên đưa các đối tượng quá lớn vào đó. Trong triển khai phân tán hoặc khi cần lưu bền vững Session, các thuộc tính thường còn phải hỗ trợ tuần tự hóa (`Serializable`), yêu cầu cụ thể tùy thuộc vào Container và giải pháp lưu trữ Session.

## Sự khác nhau giữa Cookie và Session

Cookie và Session đều là cơ chế phiên dùng để theo dõi danh tính người dùng trình duyệt, nhưng kịch bản áp dụng của hai cơ chế khác nhau.

**Cookie thường dùng để lưu thông tin người dùng.** Ví dụ: ① lưu thông tin người dùng đã đăng nhập vào Cookie để lần sau truy cập trang có thể tự động điền sẵn một số thông tin đăng nhập cơ bản; ② các website thường có tính năng duy trì đăng nhập, nghĩa là lần sau truy cập không cần đăng nhập lại — do khi đăng nhập ta lưu một Token vào Cookie, lần sau chỉ cần căn cứ vào giá trị Token để tra cứu người dùng (vì lý do bảo mật, khi đăng nhập lại thường sẽ cấp mới Token); ③ đăng nhập một lần rồi truy cập các trang khác trên website mà không cần đăng nhập lại. **Vai trò chính của Session là ghi nhận trạng thái người dùng ở phía Server.** Ví dụ điển hình là giỏ hàng: khi bạn thêm sản phẩm vào giỏ hàng, hệ thống sẽ không biết người dùng nào đang thao tác vì giao thức HTTP vốn không có trạng thái (stateless). Khi Server tạo một Session riêng cho từng người dùng cụ thể, hệ thống mới có thể định danh và theo dõi người dùng đó.

Dữ liệu Cookie được lưu ở phía Client (trình duyệt), còn dữ liệu Session được lưu ở phía Server.

Cookie lưu ở Client, trạng thái Session thường do Server quản lý, nhưng điều đó không có nghĩa cứ dùng Session là mặc nhiên an toàn hơn. Cơ chế Session thông thường vẫn phụ thuộc vào Cookie để truyền mã định danh phiên — một khi mã định danh này bị đánh cắp, kẻ tấn công vẫn có thể phát lại (replay). Cookie phiên nên sử dụng mã định danh ngẫu nhiên có độ entropy cao, không mang ý nghĩa nghiệp vụ, truyền qua HTTPS và tùy ngữ cảnh mà thiết lập các thuộc tính như `Secure`, `HttpOnly`, `SameSite`, `Path` và `Domain`. Không được ghi trực tiếp dữ liệu nghiệp vụ nhạy cảm như mật khẩu hay số thẻ ngân hàng vào Cookie; bản thân việc mã hóa cũng không thể thay thế cho cơ chế bảo vệ tính toàn vẹn, hết hạn, thu hồi và kiểm tra phân quyền phía Server.
