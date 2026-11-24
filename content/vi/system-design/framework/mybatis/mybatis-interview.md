---
title: Tổng hợp câu hỏi phỏng vấn MyBatis thường gặp
description: "Giải thích chi tiết các câu hỏi phỏng vấn MyBatis thường gặp, bao gồm luồng thực thi, Dynamic Proxy cho Mapper, #{} và ${}, Dynamic SQL, ánh xạ kết quả, cache cấp 1 và cấp 2, Executor, plugin phân trang, xử lý hàng loạt (Batch) và Transaction trong Spring."
category: Framework
icon: "mdi:database-outline"
tag:
  - MyBatis
head:
  - - meta
    - name: keywords
      content: "Câu hỏi phỏng vấn MyBatis,Luồng thực thi MyBatis,Mapper Dynamic Proxy,#{} và ${},Dynamic SQL,Cache cấp 1,Cache cấp 2,Plugin phân trang,BatchExecutor,MyBatis Plugin"
lang: vi
sourceRef: zh-ref/system-design/framework/mybatis/mybatis-interview.md
---

> Bài viết này ban đầu được tổng hợp từ tài liệu trên mạng, không còn xác minh được nguồn gốc ban đầu. Lần viết lại này dựa chủ yếu vào tài liệu chính thức của MyBatis 3.5.x và MyBatis-Spring, đồng thời bổ sung các chủ đề tần suất cao như cache, xử lý hàng loạt (Batch), Transaction trong Spring và xử lý tập kết quả lớn.

## Nền tảng MyBatis

### MyBatis là gì? Vì sao nói nó là một ORM bán tự động?

MyBatis là một framework tầng lưu trữ dữ liệu (persistence layer). Nó đóng gói sẵn các công việc lặp đi lặp lại trong JDBC như tạo kết nối, gán tham số, thực thi SQL, duyệt tập kết quả và đóng tài nguyên, đồng thời cho phép lập trình viên tự viết câu lệnh SQL và ánh xạ tham số lẫn kết quả truy vấn thành đối tượng Java.

MyBatis thường được gọi là ORM bán tự động vì câu lệnh SQL, ánh xạ cột và truy vấn liên kết (association query) vẫn do lập trình viên kiểm soát. Các ORM như Hibernate/JPA thiên về sinh SQL dựa trên quan hệ giữa các entity và metadata ánh xạ, còn MyBatis trao lại quyền kiểm soát SQL cho lập trình viên.

Thiết kế này phù hợp với các dự án có câu SQL phức tạp, cần tối ưu hiệu năng chi tiết hoặc tận dụng nhiều tính năng riêng của cơ sở dữ liệu; đánh đổi lại là phải viết nhiều SQL và cấu hình ánh xạ hơn, đồng thời việc chuyển đổi dialect cơ sở dữ liệu, nạp dữ liệu liên kết và xử lý hàng loạt cũng do lập trình viên tự chủ động xử lý.

### MyBatis và JPA/Hibernate khác nhau ở điểm nào?

| Tiêu chí so sánh            | MyBatis                                                               | JPA/Hibernate                                                                 |
| --------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| SQL                         | Thường do lập trình viên tự viết                                      | Thường do framework tự sinh từ thông tin ánh xạ                               |
| Mức độ kiểm soát            | Dễ kiểm soát chính xác SQL, index và tính năng riêng của database     | Tập trung nhiều hơn vào mô hình đối tượng và trạng thái lưu trữ (persistence) |
| Chi phí phát triển          | Nhiều code ánh xạ và SQL hơn                                          | Ít code lặp lại hơn cho các thao tác CRUD thông thường                        |
| Chuyển đổi database         | SQL viết tay có thể phụ thuộc vào dialect                             | Các truy vấn chuẩn thường có tính di động cao hơn                             |
| Truy vấn liên kết           | Chủ động chọn `JOIN` hoặc truy vấn lồng nhau                          | Hỗ trợ liên kết đối tượng và các chiến lược fetch                             |
| Rủi ro thường gặp           | SQL phân tán, lỗi ánh xạ, SQL Injection do nối chuỗi                  | Lỗi N+1, fetch quá nhiều dữ liệu không cần thiết, SQL sinh ra khó kiểm soát   |

Không có giải pháp nào phù hợp cho mọi dự án. Khi đa số thao tác là CRUD đơn giản và mô hình nghiệp vụ ổn định, JPA/Hibernate giúp giảm code lặp lại; khi có nhiều báo cáo, truy vấn phức tạp và cần tối ưu SQL, MyBatis sẽ trực diện hơn. Bạn cũng có thể lựa chọn theo nhu cầu riêng ở từng module trong cùng một hệ thống.

### MyBatis gồm những thành phần cốt lõi nào?

- **`SqlSessionFactoryBuilder`**: Đọc cấu hình và tạo ra `SqlSessionFactory`. Sau khi dựng xong thường có thể giải phóng.
- **`SqlSessionFactory`**: Tạo ra `SqlSession`; chi phí khởi tạo cao nên thông thường chỉ giữ một instance trong suốt vòng đời ứng dụng.
- **`SqlSession`**: Thực thi SQL, quản lý Transaction và lấy Mapper. Nó không an toàn luồng (not thread-safe), cần giới hạn phạm vi trong một request, một phương thức hoặc một Transaction.
- **`Configuration`**: Lưu các thiết lập toàn cục, `MappedStatement`, `ResultMap`, `TypeHandler`, plugin và các metadata khi chạy (runtime).
- **`MappedStatement`**: Tương ứng với một thẻ ánh xạ `<select>`, `<insert>`, `<update>` hoặc `<delete>`.
- **`Executor`**: Phụ trách truy vấn, cập nhật, cache cấp 1 và các lời gọi liên quan đến Transaction.
- **`StatementHandler`**: Tạo và thao tác với JDBC `Statement`.
- **`ParameterHandler`**: Gán tham số vào `PreparedStatement`.
- **`ResultSetHandler`**: Ánh xạ JDBC `ResultSet` thành các đối tượng Java.

`SqlSource` lưu logic sinh SQL; khi thực thi thực tế, nó sẽ căn cứ vào tham số để tạo ra `BoundSql`, trong đó chứa câu SQL cuối cùng, danh sách ánh xạ tham số và các tham số bổ sung.

### `SqlSessionFactory`, `SqlSession` và Mapper có an toàn luồng (Thread-Safe) không?

`SqlSessionFactory` sau khi khởi tạo xong có thể dùng chung trong toàn bộ ứng dụng. `SqlSession` chứa các trạng thái có thể thay đổi như kết nối database, Transaction và cache cấp 1 nên không được chia sẻ giữa các thread. Proxy của Mapper lấy từ một `SqlSession` cụ thể cũng phải tuân theo vòng đời tương tự.

Trong MyBatis-Spring, Mapper được inject do `SqlSessionTemplate` hỗ trợ. `SqlSessionTemplate` là thread-safe; nó sẽ tìm `SqlSession` tương ứng với Spring Transaction hiện tại và chịu trách nhiệm quản lý vòng đời như commit, rollback và đóng session. Vì vậy, Service singleton của Spring có thể inject Mapper một cách an toàn, nhưng tuyệt đối không được lưu `SqlSession` thuần tự tạo vào một trường singleton.

### ⭐️ Nguyên lý hoạt động của Mapper Interface là gì?

MyBatis sử dụng JDK Dynamic Proxy để tạo đối tượng proxy cho Mapper interface. Khi gọi một phương thức của Mapper, luồng xử lý nhìn chung sẽ đi qua chuỗi sau:

1. `MapperProxy` chặn (intercept) lời gọi phương thức interface.
2. MyBatis lấy tên đầy đủ (fully qualified name) của Mapper interface ghép với tên phương thức để ra Statement ID, ví dụ `com.example.UserMapper.selectById`.
3. `MapperMethod` phân tích tham số và kiểu trả về, rồi gọi phương thức tương ứng của `SqlSession` như `selectOne()`, `selectList()`, `insert()`,...
4. `SqlSession` tìm `MappedStatement` dựa trên Statement ID rồi giao cho `Executor` thực thi.
5. Kết quả truy vấn sau khi qua `ResultSetHandler` ánh xạ sẽ được trả về đúng theo kiểu trả về đã khai báo trên phương thức Mapper.

Bản thân Mapper interface thường không có lớp cài đặt (implementation class). Tên đầy đủ của interface phải khớp với `namespace` trong XML, và tên phương thức phải khớp với `id` của câu lệnh ánh xạ.

### Phương thức của Mapper Interface có thể nạp chồng (`Overload`) không?

Java cho phép khai báo các phương thức nạp chồng (`Overload`) trong Mapper interface, nhưng khi MyBatis tra cứu câu lệnh ánh xạ, nó dùng "tên đầy đủ của interface + tên phương thức" mà không đưa kiểu tham số vào Statement ID. Trong XML cũng không thể định nghĩa hai câu lệnh có cùng `id` trong cùng một `namespace`.

Trong một số ít trường hợp, nhiều phương thức nạp chồng có thể dùng chung một đoạn Dynamic SQL, nhưng MyBatis không thể giống trình biên dịch Java để chọn các câu SQL khác nhau dựa theo chữ ký tham số; hơn nữa tên tham số, kiểu trả về và các điều kiện động rất dễ xung đột. Trong dự án thực tế, nên dùng tên phương thức khác nhau để biểu đạt các truy vấn khác nhau.

### ⭐️ Quy trình đầy đủ để MyBatis thực thi một câu truy vấn là gì?

Bạn có thể trả lời theo hai giai đoạn: phân tích lúc khởi động và thực thi lúc chạy (runtime).

Lúc khởi động:

1. Đọc cấu hình toàn cục của MyBatis và tạo `Configuration`.
2. Phân tích Mapper XML hoặc annotation, đăng ký SQL, ánh xạ tham số, ánh xạ kết quả,... thành các đối tượng `MappedStatement`, `ResultMap` và `SqlSource`.
3. Tạo `SqlSessionFactory`; với dự án Spring thì đăng ký thêm các Mapper proxy.

Lúc chạy (runtime):

1. Gọi Mapper proxy và tìm `MappedStatement` dựa vào tên interface và tên phương thức.
2. `SqlSource` sinh ra `BoundSql` dựa trên đối số thực tế.
3. `Executor` kiểm tra cache cấp 1 theo quy tắc trước; nếu cache miss thì tiếp tục truy cập database.
4. `StatementHandler` tạo JDBC `Statement`, còn `ParameterHandler` gán tham số.
5. JDBC thực thi SQL, và `ResultSetHandler` ánh xạ tập kết quả thành các đối tượng Java.
6. Kết quả được ghi vào cache theo quy tắc rồi trả về; sau khi kết thúc Transaction thì commit hoặc rollback.

Các plugin có thể bọc quanh `Executor`, `StatementHandler`, `ParameterHandler` và `ResultSetHandler`, do đó phân trang, kiểm toán (audit) và viết lại SQL có thể chèn vào chuỗi xử lý này.

## Xử lý tham số và Dynamic SQL

### ⭐️ `#{}` và `${}` khác nhau ở điểm nào?

Trong SQL ánh xạ:

- `#{}` sẽ sinh ra placeholder `?` của JDBC, sau đó MyBatis gán giá trị thông qua `ParameterHandler` và `TypeHandler`. Tham số được truyền xuống database dưới dạng dữ liệu nên thông thường giúp phòng tránh SQL Injection tại vị trí đó.
- `${}` sẽ thay thế trực tiếp kết quả biểu thức vào chuỗi SQL mà không tạo tham số ràng buộc (bind parameter). Nó có thể thay đổi tên cột, tên bảng, chiều sắp xếp hoặc cả một đoạn SQL, nên đi kèm rủi ro SQL Injection.

```xml
<select id="findByName" resultType="User">
  SELECT id, name
  FROM users
  WHERE name = #{name}
  ORDER BY ${orderBy}
</select>
```

`name` nên dùng `#{}`. Với `orderBy`, nếu lấy trực tiếp từ request thì kẻ tấn công có thể thay đổi câu SQL; cần ánh xạ giá trị bên ngoài trong code Java sang tên cột và chiều sắp xếp đã định nghĩa trước ở phía server.

`${}` cũng xuất hiện trong file cấu hình MyBatis, ví dụ `${driver}`, `${url}`. Cách viết này thuộc cơ chế thay thế thuộc tính cấu hình lúc phân tích file config, khác với ngữ cảnh thay thế văn bản động trong SQL ánh xạ.

### Khi phương thức Mapper có nhiều tham số, làm sao tham chiếu tới từng tham số?

Khuyến nghị dùng `@Param` để chỉ định rõ tên tham số:

```java
User selectByTenantAndId(
    @Param("tenantId") Long tenantId,
    @Param("userId") Long userId
);
```

```xml
<select id="selectByTenantAndId" resultType="User">
  SELECT id, name
  FROM users
  WHERE tenant_id = #{tenantId}
    AND id = #{userId}
</select>
```

Khi không có `@Param`, MyBatis cung cấp các tên chung như `param1`, `param2`; nếu dự án biên dịch với cờ `-parameters` và bật `useActualParamName`, MyBatis cũng có thể đọc được tên tham số thực tế. Tuy nhiên, thay đổi cấu hình biên dịch có thể làm tên tham số thực tế không còn khả dụng, vì vậy dùng `@Param` cho các Mapper công khai sẽ ổn định hơn.

Tham số dạng tập hợp (collection) có thể truy cập qua các tên như `collection`, `list` hoặc `array`, tùy vào kiểu tham số và `@Param`. Gắn rõ `@Param("ids")` cho tập hợp rồi dùng trong `<foreach collection="ids">` sẽ dễ đọc hơn nhiều.

### ⭐️ Dynamic SQL của MyBatis có những thẻ nào? Nguyên lý là gì?

Các thẻ thường dùng gồm:

- `<if>`: Ghép nối SQL theo điều kiện.
- `<choose>`, `<when>`, `<otherwise>`: Chọn một nhánh trong nhiều nhánh điều kiện.
- `<trim>`, `<where>`, `<set>`: Xử lý tiền tố/hậu tố, loại bỏ từ khóa `AND` hoặc dấu phẩy dư thừa.
- `<foreach>`: Duyệt qua tập hợp, thường dùng cho điều kiện `IN` và chèn hàng loạt (batch insert).
- `<bind>`: Tạo biến dùng được trong phạm vi đoạn Dynamic SQL hiện tại.

Khi phân tích Dynamic SQL, MyBatis biến các node XML thành một cây cấu trúc kết hợp gồm các `SqlNode`. Sau khi gọi phương thức Mapper, từng node dựa vào ngữ cảnh tham số và biểu thức OGNL để quyết định có xuất ra đoạn SQL hay không, cuối cùng `DynamicSqlSource` tạo ra `BoundSql`.

```xml
<select id="find" resultType="User">
  SELECT id, name, status
  FROM users
  <where>
    <if test="name != null and name != ''">
      name = #{name}
    </if>
    <if test="status != null">
      AND status = #{status}
    </if>
  </where>
</select>
```

`<where>` chỉ xuất ra từ khóa `WHERE` khi bên trong có nội dung, đồng thời xử lý các từ khóa `AND` hoặc `OR` bị thừa ở đầu.

### Mapper XML có những thẻ phần tử phổ biến nào?

- `<cache>`, `<cache-ref>`: Cấu hình cache cấp 2 cho namespace hiện tại hoặc tham chiếu tới cache của namespace khác.
- `<resultMap>`: Định nghĩa ánh xạ giữa tập kết quả và đối tượng.
- `<sql>`, `<include>`: Định nghĩa và tái sử dụng các đoạn SQL.
- `<select>`, `<insert>`, `<update>`, `<delete>`: Định nghĩa các câu lệnh ánh xạ.
- `<selectKey>`: Thực thi truy vấn lấy khóa chính trước hoặc sau khi chèn bản ghi.

Tài liệu cũ hay nhắc đến `<parameterMap>`, nhưng nó đã bị khai tử (deprecated); nên dùng cách ánh xạ tham số nội tuyến (inline parameter mapping).

`<sql>` có thể được định nghĩa phía sau thẻ `<include>` tham chiếu đến nó. Khi phân tích Mapper XML, MyBatis sẽ thu thập và đăng ký trước các đoạn `<sql>` trong file hiện tại rồi mới phân tích các câu lệnh CRUD, nên không bắt buộc đoạn được tham chiếu phải viết ở phía trên. Với những tham chiếu xuyên tài nguyên mà tạm thời chưa phân giải được, MyBatis sẽ đưa vào tập chờ xử lý và thử lại sau khi các định nghĩa liên quan đã được nạp. Tuy nhiên, file ánh xạ vẫn nên sắp xếp theo thứ tự khuyến nghị của tài liệu chính thức để tránh tham chiếu vòng và các phụ thuộc chéo file khó bảo trì.

### Mapper XML được phân tích thành những đối tượng nội bộ nào?

- Mỗi `<select>`, `<insert>`, `<update>`, `<delete>` được đăng ký thành một `MappedStatement`.
- SQL tĩnh thường tương ứng với `RawSqlSource`, còn Dynamic SQL thường tương ứng với `DynamicSqlSource`.
- Khi thực thi, `SqlSource` tạo ra `BoundSql`, trong đó chứa SQL cuối cùng và danh sách `ParameterMapping`.
- `<resultMap>` được phân tích thành `ResultMap`, còn các ánh xạ con được phân tích thành `ResultMapping`.
- `<cache>` tạo và bọc (decorate) một instance cache ở cấp namespace.

Những đối tượng này cuối cùng được lưu trong `Configuration`. Trong lúc ứng dụng đang chạy, thông thường chỉ nên đọc metadata này chứ không nên tùy tiện sửa đổi `Configuration` toàn cục.

## Ánh xạ kết quả (Result Mapping)

### `resultType` và `resultMap` khác nhau thế nào?

`resultType` chỉ định trực tiếp kiểu đối tượng trả về, phù hợp cho các truy vấn đơn giản có tên cột và tên thuộc tính dễ khớp tự động. Có thể dùng bí danh cột (column alias) trong SQL để hỗ trợ khớp tên, ví dụ `user_name AS userName`.

`resultMap` cho phép mô tả tường minh quan hệ giữa cột và thuộc tính, đồng thời hỗ trợ ánh xạ qua constructor, `TypeHandler`, discriminator cũng như `<association>` và `<collection>` lồng nhau, phù hợp cho đối tượng phức tạp và truy vấn liên kết.

```xml
<resultMap id="userMap" type="User">
  <id property="id" column="user_id" />
  <result property="userName" column="user_name" />
</resultMap>
```

Ánh xạ tự động có thể kết hợp với `mapUnderscoreToCamelCase=true` để ánh xạ `user_name` sang `userName`. Với các truy vấn `JOIN` phức tạp, không nên quá phụ thuộc vào ánh xạ tự động hoàn toàn; các cột trùng tên phải đặt bí danh và cấu hình rõ ràng trong `resultMap`.

### ⭐️ `association` và `collection` khác nhau ở điểm nào?

- `<association>` ánh xạ quan hệ "có một" (has-one), ví dụ một đơn hàng tương ứng với một người dùng.
- `<collection>` ánh xạ quan hệ "có nhiều" (has-many), ví dụ một người dùng tương ứng với nhiều đơn hàng.

Có hai cách phổ biến để nạp dữ liệu liên kết:

1. **Ánh xạ kết quả lồng nhau (Nested Results)**: Dùng `JOIN` để truy vấn đối tượng chính và đối tượng liên kết trong một lần, sau đó căn cứ vào `<id>` và các ánh xạ liên quan để gộp các dòng trùng lặp. Số lần chạy SQL ít nhưng tập kết quả có thể phình to.
2. **Truy vấn lồng nhau (Nested Select)**: Truy vấn đối tượng chính trước, rồi chạy thêm một câu lệnh ánh xạ khác cho thuộc tính liên kết. Cấu trúc đơn giản và hỗ trợ nạp trễ (Lazy Loading), nhưng rất dễ sinh ra lỗi truy vấn N+1.

Khi dùng `JOIN` để ánh xạ quan hệ một-nhiều, cả đối tượng cha lẫn đối tượng con đều phải cấu hình đúng `<id>`. MyBatis dựa vào các định danh này để tái sử dụng đối tượng đã có và lắp ghép vào collection; nếu thiếu định danh có thể làm tăng chi phí tạo và ánh xạ đối tượng, thậm chí cho ra kết quả sai.

### Truy vấn N+1 là gì? Làm thế nào để tránh?

Truy vấn trước N bản ghi chính, sau đó ứng với mỗi bản ghi lại chạy thêm một truy vấn lấy đối tượng liên kết, tổng cộng thực thi 1 + N câu SQL — đó chính là lỗi truy vấn N+1. Cả truy vấn lồng nhau lẫn Lazy Loading đều có thể kích hoạt tình trạng này.

Các cách xử lý phổ biến gồm:

- Dùng `JOIN` kết hợp ánh xạ kết quả lồng nhau để lấy trong một lần.
- Truy vấn hàng loạt các bản ghi chính trước, rồi dựa vào tập khóa chính để truy vấn hàng loạt các bản ghi liên kết, sau đó tự ghép trong bộ nhớ.
- Trong các kịch bản như GraphQL/DataLoader, thực hiện gộp lô (batching) cho cùng một đợt request.
- Chỉ dùng Lazy Loading khi chắc chắn chỉ truy cập một lượng nhỏ thuộc tính liên kết, đồng thời theo dõi qua giám sát SQL để kiểm chứng số lần truy vấn.

`JOIN` càng nhiều cũng không hẳn là tốt. Khi quan hệ một-nhiều có nhiều tầng lồng sâu, tích Đề-các (Cartesian product) sẽ làm tập kết quả phình to đột biến; tách thành hai truy vấn hàng loạt thường dễ kiểm soát hơn.

### MyBatis có hỗ trợ Lazy Loading không? Nguyên lý thế nào?

MyBatis hỗ trợ Lazy Loading cho `<association>` và `<collection>` được cấu hình bằng truy vấn lồng nhau. Sau khi bật `lazyLoadingEnabled`, MyBatis dùng một đối tượng proxy để giữ thuộc tính chờ nạp; khi truy cập vào thuộc tính liên quan, proxy mới thực thi câu truy vấn đã đăng ký và ghi kết quả ngược lại.

`fetchType="lazy"` hoặc `fetchType="eager"` có thể ghi đè cấu hình toàn cục cho từng liên kết riêng lẻ. MyBatis 3.5.x mặc định dùng Javassist để tạo proxy cho Lazy Loading; CGLIB đã bị loại bỏ dần (deprecated) từ bản 3.5.10.

Lazy Loading có hai vấn đề hay gặp: một là khi duyệt tập hợp sẽ kích hoạt N+1; hai là sau khi đối tượng rời khỏi phạm vi `SqlSession` hoặc Transaction mới truy cập thuộc tính thì có thể không nạp được dữ liệu. Khi API trả về DTO, thông thường nên chủ động truy vấn đủ dữ liệu cần thiết ngay trong tầng Service.

### `TypeHandler` có tác dụng gì? Ánh xạ Enum như thế nào?

`TypeHandler` đảm nhận việc chuyển đổi giữa kiểu dữ liệu Java và kiểu JDBC: khi gán tham số cho `PreparedStatement` thì chuyển giá trị Java thành giá trị JDBC, còn khi đọc `ResultSet` thì chuyển ngược lại thành giá trị Java.

MyBatis mặc định dùng `EnumTypeHandler` để lưu theo tên hằng số enum, ví dụ `ACTIVE`. `EnumOrdinalTypeHandler` lưu theo số thứ tự (ordinal), nhưng khi đổi thứ tự các phần tử enum ở phiên bản sau sẽ rất dễ sai dữ liệu, nên nhìn chung không khuyến nghị lưu ordinal làm giá trị lâu dài trong database.

Các enum nghiệp vụ thường có một trường `code` ổn định; bạn có thể tự viết lớp kế thừa `BaseTypeHandler` để hoàn thành ánh xạ giữa `code` và đối tượng enum. Khi đăng ký, cần khai báo rõ `javaType`, `jdbcType` nếu cần và quy tắc xử lý giá trị `null`.

### Khi kết quả truy vấn bị rỗng hoặc ánh xạ thiếu dữ liệu, nên kiểm tra như thế nào?

Bạn có thể kiểm tra lần lượt theo thứ tự sau:

1. Câu SQL có thực sự trả về dữ liệu không, giá trị tham số và kiểu JDBC đã đúng chưa.
2. `namespace`, Statement ID và phương thức Mapper có khớp nhau không.
3. Bí danh cột có khớp với thuộc tính Java không, và cấu hình ánh xạ camel-case đã được bật đúng như kỳ vọng chưa.
4. `column`, `property`, `javaType` và `typeHandler` trong `resultMap` có chính xác không.
5. `JOIN` có bị trùng tên cột dẫn đến ghi đè không, và các thẻ `<id>` trong kết quả lồng nhau đã đầy đủ chưa.
6. Trường dữ liệu có thiếu setter, tham số constructor có không khớp, hay phương thức do Lombok sinh ra có khác với kỳ vọng không.
7. Cache cấp 1 có đang trả lại kết quả từ một truy vấn trước đó trong cùng `SqlSession` hay không.

Khi bật log SQL của MyBatis, cần xem đồng thời cả giá trị tham số thực tế; chỉ nhìn câu SQL có placeholder `?` không đủ để kết luận điều kiện truy vấn thực tế.

### Nếu `selectOne()` truy vấn ra nhiều bản ghi thì sao?

Khi không có bản ghi nào, `selectOne()` trả về `null`; khi có đúng một bản ghi thì trả về đối tượng đó; khi có nhiều hơn một bản ghi thì ném ra ngoại lệ `TooManyResultsException`. Nó không tự động lấy bản ghi đầu tiên.

Nếu nghiệp vụ yêu cầu kết quả là duy nhất, phải dùng ràng buộc duy nhất (unique constraint) để đảm bảo tính nhất quán dữ liệu. Chỉ dùng sắp xếp kèm `LIMIT 1` khi nghiệp vụ cho phép rõ ràng việc "chọn đại một bản ghi" hoặc "lấy bản ghi mới nhất", tuyệt đối không dùng nó để che giấu dữ liệu rác.

## Cache trong MyBatis

### ⭐️ Cache cấp 1 của MyBatis là gì?

Cache cấp 1 là bộ nhớ đệm cục bộ ở cấp `SqlSession`, phạm vi mặc định là `SESSION`. Trong cùng một `SqlSession`, khi thông tin của hai lần truy vấn gồm Statement, SQL cuối cùng, tham số, phân trang và môi trường tạo thành cùng một cache key, lần truy vấn thứ hai có thể trả về trực tiếp kết quả từ cache.

Cache cấp 1 cũng được dùng để xử lý tham chiếu vòng trong ánh xạ kết quả lồng nhau. Khi đặt `localCacheScope` thành `STATEMENT`, cache cục bộ chỉ được dùng trong một lần thực thi câu lệnh và không còn chia sẻ giữa hai truy vấn khác nhau.

Những thao tác sau sẽ làm mất hiệu lực hoặc xóa cache cấp 1 liên quan:

- Thực thi `insert`, `update`, `delete`.
- Gọi `clearCache()`.
- Commit, rollback hoặc đóng `SqlSession`.
- Câu truy vấn cấu hình `flushCache="true"`.

### Vì sao trong dự án Spring có cảm giác cache cấp 1 không có tác dụng?

Cache cấp 1 gắn liền với `SqlSession` thực sự bên dưới. Trong Spring, `SqlSessionTemplate` sẽ tái sử dụng `SqlSession` đang gắn với Spring Transaction hiện tại; nếu không có Transaction, mỗi lần gọi Mapper xong sẽ đóng Session vừa tạo, nên lần gọi tiếp theo có thể đã là một Session mới.

Do đó, khi gọi Mapper hai lần liên tiếp trong cùng một phương thức Service mà không nằm trong Spring Transaction, không thể mặc định rằng chúng dùng chung cache cấp 1. Cũng không nên vì muốn "trúng cache" mà tùy tiện mở rộng phạm vi Transaction — độ dài Transaction vẫn phải do yêu cầu nhất quán nghiệp vụ quyết định.

### ⭐️ Cache cấp 2 của MyBatis là gì? Bật như thế nào?

Cache cấp 2 gắn với `namespace` của Mapper XML và có thể chia sẻ giữa các `SqlSession` khác nhau. Thiết lập toàn cục `cacheEnabled` mặc định đang bật, nhưng từng namespace cụ thể vẫn phải cấu hình `<cache/>` hoặc dùng `<cache-ref>` để tham chiếu tới cache của namespace khác.

```xml
<mapper namespace="com.example.UserMapper">
  <cache />

  <select id="selectById" resultType="User" useCache="true">
    SELECT id, name FROM users WHERE id = #{id}
  </select>
</mapper>
```

Kết quả truy vấn thường phải đợi sau khi Transaction commit mới hiển thị trong cache cấp 2 cho các Session khác. Khi namespace đó thực hiện thêm, sửa, xóa, mặc định cache sẽ bị xóa sạch. Có thể tinh chỉnh hành vi trên từng câu lệnh qua `useCache` và `flushCache`.

Cấu hình cache mặc định có thể yêu cầu đối tượng kết quả phải hỗ trợ `Serialization`; nếu đổi sang cache bên thứ ba hoặc chỉnh `readOnly`, ngữ nghĩa sao chép đối tượng và an toàn luồng (thread-safety) cũng thay đổi theo và cần xác nhận lại theo cài đặt cụ thể.

### Vì sao dự án production cần thận trọng khi dùng cache cấp 2 của MyBatis?

- Cache được tổ chức theo `namespace`; khi một Mapper khác sửa cùng một bảng, cache của các namespace còn lại sẽ không tự động biết.
- Dữ liệu có thể bị thay đổi bởi ứng dụng khác, script hoặc SQL chạy trực tiếp, mà MyBatis không thể tự phát hiện.
- Cache cấp 2 cục bộ chỉ tồn tại trên instance ứng dụng hiện tại và không tự đồng bộ giữa nhiều instance.
- Các truy vấn `JOIN` phụ thuộc vào nhiều bảng; bất kỳ bảng nào thay đổi đều có thể khiến kết quả bị cũ (stale).
- Khi đối tượng lưu cache lớn hoặc tỷ lệ trúng cache (hit rate) thấp, nó sẽ chiếm bộ nhớ mà hiệu quả thu lại không đáng kể.

Khi cần chia sẻ giữa nhiều instance và chiến lược hủy cache rõ ràng, hệ thống thường dùng Redis hoặc Caffeine ở tầng nghiệp vụ và coi database là nguồn dữ liệu chuẩn xác (source of truth). Cache cấp 2 của MyBatis phù hợp hơn với dữ liệu ít thay đổi, đọc nhiều ghi ít và có quan hệ phụ thuộc rõ ràng.

### Cache cấp 1 có thể gây đọc bẩn (Dirty Read) không?

Trong cùng một `SqlSession`, sau lần truy vấn đầu tiên, nếu database bị một Transaction hoặc ứng dụng khác cập nhật, khi Session này chạy lại đúng truy vấn đó vẫn có thể nhận được đối tượng cũ từ cache cấp 1. Đây không phải Dirty Read theo đúng nghĩa mức cô lập (isolation level) của database, nhưng về phía ứng dụng sẽ biểu hiện là nhìn thấy dữ liệu cũ.

Khi cần lấy dữ liệu mới nhất từ bên ngoài, có thể gọi `clearCache()`, rút ngắn vòng đời Session, đặt `localCacheScope` thành `STATEMENT`, hoặc chạy truy vấn trong một Transaction/Session mới. Đừng kỳ vọng rằng cứ xóa cache tùy tiện giữa một Transaction thì database chắc chắn sẽ thấy giá trị mới của Transaction khác — kết quả cuối cùng vẫn chịu sự chi phối của mức cô lập database.

## Executor, Xử lý hàng loạt (Batch) và Plugin

### MyBatis có những loại Executor nào?

| ExecutorType | Hành vi                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| `SIMPLE`     | Mỗi lần thực thi tạo một `PreparedStatement` mới; đây là loại mặc định                                     |
| `REUSE`      | Tái sử dụng `PreparedStatement` tương ứng với câu SQL trong phạm vi `SqlSession` hiện tại                  |
| `BATCH`      | Với câu lệnh cập nhật thì tái sử dụng Statement và gọi JDBC Batch; đẩy lô trước khi truy vấn hoặc khi commit |

Phạm vi tác dụng của cả ba loại Executor đều đi theo `SqlSession`. `REUSE` tái sử dụng Statement chứ không đồng nghĩa với tái sử dụng kết quả truy vấn; việc tái sử dụng kết quả truy vấn do cache đảm nhận.

Bạn có thể chọn loại Executor thông qua `defaultExecutorType` toàn cục, `openSession(ExecutorType)` hoặc tham số constructor của `SqlSessionTemplate`. Trong cùng một Spring Transaction, không được chuyển đổi `ExecutorType`; nếu thực sự cần dùng loại khác, hãy chạy trong Transaction độc lập hoặc ngoài Transaction.

### ⭐️ MyBatis thực thi xử lý hàng loạt (Batch) như thế nào?

Bạn có thể dùng `ExecutorType.BATCH`, gọi lặp lại các phương thức `insert`, `update` hoặc `delete` của Mapper, cuối cùng gọi `flushStatements()` hoặc commit Transaction. `BatchExecutor` sẽ gom nhóm theo Statement và câu SQL, sau đó gọi JDBC `addBatch()` và `executeBatch()`.

Các lưu ý khi chạy Batch:

- Không nên tích lũy lượng dữ liệu quá lớn trong một lần; nên gọi `flushStatements()` và dọn cache của Session theo từng kích thước lô cố định.
- Chạy một câu truy vấn xen giữa sẽ kích hoạt việc đẩy (flush) các lô đang chờ.
- Giá trị trả về của từng lần gọi Mapper không nhất thiết là số dòng bị ảnh hưởng cuối cùng; kết quả theo lô phải lấy sau khi flush.
- Khi xảy ra `BatchUpdateException`, một số câu lệnh phía trước có thể đã được database thực thi; cần đánh giá kết hợp với rollback Transaction và kết quả trả về từ driver.
- SQL chèn nhiều dòng (multi-row insert), JDBC Batch và Bulk Load do database cung cấp là các phương án khác nhau, hiệu năng và khả năng điền ngược khóa chính cũng khác nhau.

Trong MyBatis-Spring, không được tự tay commit hay đóng `SqlSessionTemplate`; hãy để trình quản lý Transaction của Spring xử lý commit và rollback.

### Chèn hàng loạt (Batch Insert) có thể điền ngược khóa chính được không?

Với điều kiện database và JDBC driver hỗ trợ, có thể điền ngược khóa chính tự tăng thông qua `useGeneratedKeys="true"` và `keyProperty`. Khi tham số là danh sách đối tượng, driver cần trả về đúng các generated keys cho từng dòng thì MyBatis mới gán ngược lại lần lượt vào đối tượng được.

```xml
<insert id="batchInsert"
        useGeneratedKeys="true"
        keyProperty="id">
  INSERT INTO users (name, status)
  VALUES
  <foreach collection="list" item="item" separator=",">
    (#{item.name}, #{item.status})
  </foreach>
</insert>
```

Mức độ hỗ trợ giữa các database, phiên bản driver và cách viết SQL hàng loạt khác nhau khá lớn, nên cần viết integration test để kiểm chứng số lượng và thứ tự khóa chính. Khi không thể phụ thuộc vào JDBC generated keys, có thể sinh UUID hoặc Snowflake ID ở phía ứng dụng, hoặc dùng `<selectKey>` theo khả năng của database.

### `useGeneratedKeys` và `<selectKey>` khác nhau thế nào?

- `useGeneratedKeys` sử dụng JDBC `getGeneratedKeys()`, thường dùng cho khóa chính tự tăng của database.
- `<selectKey>` sẽ chạy thêm một câu truy vấn, có thể cấu hình chạy trước hoặc sau khi chèn, phù hợp với sequence, hàm đặc thù của database hoặc database cũ (legacy).

`keyProperty` chỉ định điền ngược vào thuộc tính Java nào, và khi cần thiết dùng `keyColumn` để chỉ định cột trong database. Các kịch bản chèn hàng loạt, khóa chính kết hợp (composite key) và nhiều datasource cần được kiểm chứng riêng, không thể suy ra hành vi hàng loạt sẽ giống hệt chỉ vì chèn đơn lẻ thành công.

### ⭐️ MyBatis phân trang như thế nào? Nguyên lý của plugin phân trang là gì?

MyBatis cung cấp `RowBounds`, nhưng nó không tự động thêm `LIMIT` vào câu SQL. Mặc định, MyBatis vẫn chạy câu SQL gốc, rồi để logic xử lý tập kết quả bỏ qua `offset` và giới hạn số lượng trả về. Khi dữ liệu lớn hoặc offset sâu, cách này có thể đọc rất nhiều bản ghi vô ích.

Truy vấn trên production thường dùng một trong hai cách sau:

- Viết tường minh phân trang vật lý mà database hỗ trợ ngay trong SQL.
- Dùng các plugin phân trang như PageHelper để viết lại SQL theo dialect của database trước khi thực thi, và tự sinh truy vấn `COUNT` khi cần.

Plugin phân trang thông qua cơ chế plugin của MyBatis để chặn các đối tượng như `Executor` hoặc `StatementHandler`, đọc `MappedStatement`, `BoundSql` và tham số phân trang, rồi tạo ra câu SQL phân trang mới. Plugin vẫn phải xử lý các bài toán về dialect, thứ tự tham số, `COUNT` SQL, dọn dẹp ngữ cảnh theo thread (thread-local cleanup) và đa datasource.

Với phân trang sâu (deep pagination), ngay cả khi đã thêm `LIMIT offset, size`, database vẫn có thể quét rồi bỏ đi lượng lớn bản ghi. Có thể dùng phân trang dạng con trỏ (cursor pagination) dựa trên khóa sắp xếp ổn định, ví dụ `WHERE id > ? ORDER BY id LIMIT ?`.

### Nguyên lý của MyBatis Plugin là gì? Viết như thế nào?

MyBatis Plugin có thể chặn các phương thức cụ thể của 4 nhóm thành phần sau:

- `Executor`
- `StatementHandler`
- `ParameterHandler`
- `ResultSetHandler`

Plugin cài đặt interface `Interceptor`, dùng `@Intercepts` và `@Signature` để khai báo interface mục tiêu, tên phương thức và kiểu tham số. Khi MyBatis khởi tạo các thành phần trên sẽ gọi `pluginAll()`, các đối tượng mục tiêu khớp chữ ký sẽ được bọc bởi JDK Dynamic Proxy; khi gọi phương thức mục tiêu, luồng thực thi sẽ đi vào `intercept()`.

```java
@Intercepts({
    @Signature(
        type = Executor.class,
        method = "update",
        args = {MappedStatement.class, Object.class}
    )
})
public class AuditInterceptor implements Interceptor {
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        // Chỉ thực hiện xử lý cần thiết và đảm bảo cuối cùng vẫn gọi phương thức gốc
        return invocation.proceed();
    }
}
```

Plugin sẽ đi vào luồng chính của mọi câu SQL khớp điều kiện, nên code cần gọn nhẹ tối đa và tránh sửa đổi trực tiếp `MappedStatement` dùng chung. Thứ tự chạy của nhiều plugin chịu ảnh hưởng bởi thứ tự cấu hình và lớp lồng proxy; khi các plugin phân trang, kiểm toán và phân quyền dữ liệu cùng sửa lại SQL, cần phải kiểm thử tổ hợp (combination testing).

## Transaction, Hiệu năng và Các vấn đề kỹ thuật

### Transaction trong MyBatis-Spring hoạt động như thế nào?

MyBatis-Spring sử dụng `SqlSessionTemplate` để gắn `SqlSession` vào Spring Transaction hiện tại. Các lời gọi Mapper trong cùng một Transaction và dùng chung một `SqlSessionFactory` sẽ dùng chung một Session và kết nối database; Transaction sẽ commit khi phương thức kết thúc bình thường và rollback khi ném ra ngoại lệ khớp quy tắc rollback.

Các điểm cần lưu ý:

- `@Transactional` phải được gọi thông qua Spring proxy; tự gọi trong nội bộ lớp (self-invocation) có thể bỏ qua cơ chế chặn Transaction.
- Trình quản lý Transaction và `SqlSessionFactory` phải dùng chung một `DataSource`.
- Không được tự tay gọi `commit()`, `rollback()` hoặc `close()` trên `SqlSession` do Spring quản lý.
- Các thread bất đồng bộ (async thread) không tự động kế thừa Transaction của thread gốc.
- Bắt ngoại lệ (catch) rồi không ném lại nữa có thể khiến Spring hiểu nhầm là phương thức đã hoàn thành bình thường.

### Vì sao gọi Mapper thành công mà dữ liệu lại không được commit?

Các nguyên nhân phổ biến gồm:

- Tự dùng `openSession()` mà mặc định không bật auto-commit, cũng không gọi `commit()`.
- Spring Transaction cuối cùng bị rollback, hoặc phương thức có Transaction ném ra một `RuntimeException`.
- `@Transactional` không có hiệu lực do tự gọi nội bộ, đối tượng không do Spring quản lý hoặc phạm vi truy cập (visibility) của phương thức.
- Thao tác ghi và đọc sử dụng hai datasource khác nhau, trong khi database đọc chưa kịp đồng bộ sao chép (replication).
- Dùng `BatchExecutor` nhưng chưa flush các lô hoặc chưa commit Transaction.

Khi điều tra sự cố, cần theo dõi đồng thời log Transaction, datasource, trạng thái `auto-commit` của kết nối và ngoại lệ cuối cùng, chứ không thể chỉ nhìn xem phương thức Mapper có ném lỗi hay không.

### Dùng MyBatis xử lý tập kết quả lớn như thế nào?

Trả về một `List` trong một lần sẽ nạp toàn bộ kết quả và đối tượng ánh xạ vào bộ nhớ. Khi dữ liệu lớn, có thể cân nhắc:

- Dùng `Cursor<T>` để duyệt từng bản ghi một.
- Dùng `ResultHandler` để xử lý từng dòng dữ liệu trong callback.
- Truy vấn chia lô theo một khóa sắp xếp ổn định.
- Khi xuất dữ liệu (export), vừa đọc vừa ghi ra luồng và giới hạn kích thước bộ đệm (buffer).

`Cursor` phụ thuộc vào `SqlSession`, kết nối và tập kết quả chưa bị đóng, nên quá trình tiêu thụ dữ liệu phải nằm trọn trong vòng đời của chúng. `fetchSize` chỉ là gợi ý cho JDBC driver; một số database khác nhau có thể yêu cầu thêm cấu hình cursor hoặc kết nối riêng. Trong lúc truy vấn dạng stream, kết nối bị giữ khá lâu, nên cần đặt timeout, giới hạn tốc độ (rate limiting) và tránh kích hoạt thêm truy vấn N+1 bên trong vòng lặp.

### Điều tra vấn đề hiệu năng SQL trong MyBatis như thế nào?

1. Lấy câu SQL cuối cùng và tham số thực tế, xác nhận các điều kiện động khớp với kỳ vọng.
2. Kiểm tra kế hoạch thực thi (execution plan) trong database, số dòng quét (rows scanned), số dòng trả về, bước sắp xếp và bảng tạm.
3. Kiểm tra index, ép kiểu ngầm (implicit type conversion), tính toán hàm trên cột, tìm kiếm mờ (`LIKE`) và phân trang sâu.
4. Kiểm tra xem có xảy ra N+1, tải quá nhiều cột không cần thiết, hoặc thao tác hàng loạt bị thoái hóa thành vòng lặp đơn lẻ hay không.
5. Phân tách thời gian tiêu tốn ở bước chờ connection pool, thực thi trên database, truyền tập kết quả qua mạng và ánh xạ đối tượng Java.
6. Kiểm tra tiếp xem plugin, `TypeHandler`, ghi log hay cache có làm tăng thêm chi phí phụ hay không.

MyBatis chỉ là một mắt xích trong chuỗi thực thi SQL. "Phương thức Mapper chạy chậm" không hẳn do bản thân câu SQL chậm, mà cũng có thể do cạn kiệt connection pool, tập kết quả quá lớn hoặc bước ánh xạ đối tượng ngốn nhiều CPU.

### Tránh SQL Injection khi dùng MyBatis như thế nào?

- Mặc định dùng `#{}` cho các tham số giá trị, không nối thẳng dữ liệu người dùng nhập vào câu SQL.
- Tên bảng, tên cột và chiều sắp xếp phải ánh xạ qua enum ở phía server sang các đoạn SQL cố định.
- Dynamic SQL chỉ điều khiển việc có xuất ra đoạn SQL đáng tin cậy hay không, không thực thi biểu thức do người dùng cung cấp.
- Tài khoản database tuân thủ nguyên tắc đặc quyền tối thiểu (least privilege) để giảm thiểu tác động nếu xảy ra lỗi tiêm nhiễm.
- Áp dụng cùng mức độ rà soát bảo mật cho các đoạn nối chuỗi bên trong plugin và SQL Provider.

Truy vấn tham số hóa chỉ bảo vệ được đúng vị trí của tham số. `ORDER BY ${sort}`, `${tableName}` và chuỗi SQL nối ghép trả về từ annotation Provider vẫn bắt buộc phải kiểm tra theo danh sách trắng (allowlist).

### Các file Mapper XML khác nhau có thể đặt trùng `id` không?

Có, với điều kiện `namespace` khác nhau. ID đầy đủ của `MappedStatement` là `namespace + id`, ví dụ:

```text
com.example.UserMapper.selectById
com.example.OrderMapper.selectById
```

Trong cùng một `namespace` không thể đăng ký hai ID đầy đủ giống nhau. Khi Mapper XML đi cặp với Mapper interface, `namespace` thường được đặt bằng tên đầy đủ của Mapper interface đó.

### Khi sử dụng MyBatis còn những hiểu lầm phổ biến nào?

- Cho rằng dùng MyBatis là hoàn toàn không thể bị SQL Injection mà bỏ qua `${}`, Provider và nối chuỗi trong plugin.
- Tưởng rằng nạp chồng phương thức Mapper có thể ánh xạ nhiều câu SQL trùng tên.
- Cho rằng `RowBounds` chắc chắn là phân trang vật lý ở tầng database.
- Coi cache cấp 2 là cache nghiệp vụ đồng nhất giữa nhiều ứng dụng.
- Lưu `SqlSession` thuần bên trong một đối tượng singleton.
- Lưu số thứ tự (`ordinal`) của enum xuống database nhưng lại đổi thứ tự phần tử enum ở phiên bản sau.
- Truy cập thuộc tính Lazy Loading bên trong vòng lặp, gây ra lỗi N+1.
- Khi ghi hàng loạt chỉ nhìn vào số lần gọi phương thức mà không kiểm tra JDBC driver có thực sự chạy ở chế độ Batch hay không.
- Dùng `LIMIT 1` để che giấu vấn đề dữ liệu trùng lặp lẽ ra phải được đảm bảo bằng ràng buộc duy nhất.

## Tài liệu tham khảo

- [Tài liệu chính thức MyBatis 3: Configuration](https://mybatis.org/mybatis-3/configuration.html)
- [Tài liệu chính thức MyBatis 3: Mapper XML Files](https://mybatis.org/mybatis-3/sqlmap-xml.html)
- [Tài liệu chính thức MyBatis 3: Dynamic SQL](https://mybatis.org/mybatis-3/dynamic-sql.html)
- [Tài liệu chính thức MyBatis 3: Java API](https://mybatis.org/mybatis-3/java-api.html)
- [Tài liệu chính thức MyBatis-Spring: Using an SqlSession](https://mybatis.org/spring/sqlsession.html)
- [Thảo luận về nạp chồng phương thức Mapper trong MyBatis](https://github.com/Snailclimb/JavaGuide/issues/1122)

## Bài viết đề xuất

- [Phân tích toàn diện 20.000 chữ về 9 Design Pattern trong MyBatis](https://juejin.cn/post/7273516671574687759)
- [Tự xây dựng Plugin mã hóa và giải mã MyBatis từ đầu](https://mp.weixin.qq.com/s/WUEAdFDwZsZ4EKO8ix0ijg)
- [Hướng dẫn sử dụng MyBatis đầy đủ nhất](https://juejin.cn/post/7051910683264286750)
- [MyBatis hóa ra cũng có vấn đề đồng thời (Concurrency)?](https://juejin.cn/post/7264921613551730722)
