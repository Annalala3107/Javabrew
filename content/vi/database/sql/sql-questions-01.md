---
title: Tổng hợp câu hỏi phỏng vấn SQL thường gặp (Phần 1)
description: Phần 1 trong chuỗi bài tổng hợp câu hỏi phỏng vấn SQL thường gặp, bao gồm các thao tác truy vấn cơ bản như SELECT truy xuất dữ liệu, WHERE lọc điều kiện, ORDER BY sắp xếp, DISTINCT loại bỏ trùng lặp, LIMIT phân trang cùng lời giải chi tiết các bài tập thực tế trên Nowcoder.
category: Cơ sở dữ liệu
tag:
  - Nền tảng cơ sở dữ liệu
  - SQL
head:
  - - meta
    - name: keywords
      content: Câu hỏi phỏng vấn SQL,truy vấn SELECT,điều kiện WHERE,sắp xếp ORDER BY,DISTINCT loại bỏ trùng lặp,phân trang LIMIT,SQL cơ bản
lang: vi
sourceRef: zh-ref/database/sql/sql-questions-01.md
---

> Nguồn bài tập: [Nowcoder - SQL Must-Know & Must-Master](https://www.nowcoder.com/exam/oj?page=1&tab=SQL%E7%AF%87&topicId=298)

## Truy xuất dữ liệu

`SELECT` được dùng để truy vấn dữ liệu từ cơ sở dữ liệu.

### Truy xuất tất cả ID từ bảng Customers

Cho bảng `Customers` như sau:

| cust_id |
| ------- |
| A       |
| B       |
| C       |

Hãy viết câu lệnh SQL để truy xuất tất cả `cust_id` từ bảng `Customers`.

Đáp án:

```sql
SELECT cust_id
FROM Customers
```

### Truy xuất và liệt kê danh sách các sản phẩm đã được đặt hàng

Bảng `OrderItems` chứa cột không rỗng `prod_id` đại diện cho ID sản phẩm, bao gồm tất cả các sản phẩm đã được đặt hàng (một số sản phẩm đã được đặt nhiều lần).

| prod_id |
| ------- |
| a1      |
| a2      |
| a3      |
| a4      |
| a5      |
| a6      |
| a7      |

Hãy viết câu lệnh SQL để truy xuất và liệt kê danh sách tất cả sản phẩm đã được đặt hàng (`prod_id`) sau khi đã loại bỏ trùng lặp.

Đáp án:

```sql
SELECT DISTINCT prod_id
FROM OrderItems
```

Kiến thức trọng tâm: `DISTINCT` được dùng để trả về các giá trị duy nhất khác nhau trong một cột.

### Truy xuất tất cả các cột

Hiện có bảng `Customers` (trong bảng có cột `cust_id` đại diện cho ID khách hàng và `cust_name` đại diện cho tên khách hàng):

| cust_id | cust_name |
| ------- | --------- |
| a1      | andy      |
| a2      | ben       |
| a3      | tony      |
| a4      | tom       |
| a5      | an        |
| a6      | lee       |
| a7      | hex       |

Cần viết câu lệnh SQL để truy xuất tất cả các cột.

Đáp án:

```sql
SELECT cust_id, cust_name
FROM Customers
```

## Sắp xếp dữ liệu truy xuất

`ORDER BY` được dùng để sắp xếp tập kết quả theo một hoặc nhiều cột. Mặc định các bản ghi được sắp xếp theo thứ tự tăng dần; nếu cần sắp xếp giảm dần, bạn có thể sử dụng từ khóa `DESC`.

### Truy xuất tên khách hàng và sắp xếp

Cho bảng `Customers`, trong đó `cust_id` đại diện cho ID khách hàng và `cust_name` đại diện cho tên khách hàng.

| cust_id | cust_name |
| ------- | --------- |
| a1      | andy      |
| a2      | ben       |
| a3      | tony      |
| a4      | tom       |
| a5      | an        |
| a6      | lee       |
| a7      | hex       |

Truy xuất tất cả tên khách hàng (`cust_name`) từ bảng `Customers` và hiển thị kết quả theo thứ tự từ Z đến A.

Đáp án:

```sql
SELECT cust_name
FROM Customers
ORDER BY cust_name DESC
```

### Sắp xếp theo ID khách hàng và ngày đặt hàng

Cho bảng `Orders`:

| cust_id | order_num | order_date          |
| ------- | --------- | ------------------- |
| andy    | aaaa      | 2021-01-01 00:00:00 |
| andy    | bbbb      | 2021-01-01 12:00:00 |
| bob     | cccc      | 2021-01-10 12:00:00 |
| dick    | dddd      | 2021-01-11 00:00:00 |

Hãy viết câu lệnh SQL để truy xuất ID khách hàng (`cust_id`) và mã đơn hàng (`order_num`) từ bảng `Orders`, trước tiên sắp xếp kết quả theo ID khách hàng, sau đó sắp xếp giảm dần theo ngày đặt hàng.

Đáp án:

```sql
# Sắp xếp theo tên cột
# Lưu ý: order_date sắp xếp giảm dần, không phải order_num
SELECT cust_id, order_num
FROM Orders
ORDER BY cust_id,order_date DESC
```

Kiến thức trọng tâm: Khi `ORDER BY` sắp xếp theo nhiều cột, cột sắp xếp trước đặt ở phía trước, cột sắp xếp sau đặt ở phía sau. Ngoài ra, các cột khác nhau có thể áp dụng quy tắc sắp xếp khác nhau.

### Sắp xếp theo số lượng và giá

Giả sử có bảng `OrderItems`:

| quantity | item_price |
| -------- | ---------- |
| 1        | 100        |
| 10       | 1003       |
| 2        | 500        |

Hãy viết câu lệnh SQL hiển thị số lượng (`quantity`) và giá (`item_price`) trong bảng `OrderItems`, sắp xếp theo số lượng từ nhiều đến ít, giá từ cao đến thấp.

Đáp án:

```sql
SELECT quantity, item_price
FROM OrderItems
ORDER BY quantity DESC,item_price DESC
```

### Kiểm tra câu lệnh SQL

Cho bảng `Vendors`:

| vend_name   |
| ----------- |
| Haidilao    |
| Xiaolongkan |
| Dalongyi    |

Câu lệnh SQL dưới đây có vấn đề gì không? Hãy thử sửa lại cho đúng để nó chạy thành công và trả về kết quả sắp xếp ngược theo `vend_name`.

```sql
SELECT vend_name,
FROM Vendors
ORDER vend_name DESC
```

Sau khi sửa:

```sql
SELECT vend_name
FROM Vendors
ORDER BY vend_name DESC
```

Kiến thức trọng tâm:

- Dấu phẩy được dùng để ngăn cách giữa các cột với nhau.
- `ORDER BY` phải có từ khóa `BY`, cần viết đầy đủ và đặt đúng vị trí.

## Lọc dữ liệu

`WHERE` dùng để lọc dữ liệu trả về.

Các toán tử dưới đây có thể sử dụng trong mệnh đề `WHERE`:

| Toán tử | Mô tả                                                                             |
| :------ | :-------------------------------------------------------------------------------- |
| =       | Bằng                                                                              |
| <>      | Không bằng (khác). **Lưu ý:** Trong một số phiên bản SQL, toán tử này có thể viết là != |
| >       | Lớn hơn                                                                           |
| <       | Nhỏ hơn                                                                           |
| >=      | Lớn hơn hoặc bằng                                                                 |
| <=      | Nhỏ hơn hoặc bằng                                                                 |
| BETWEEN | Nằm trong một khoảng giá trị                                                      |
| LIKE    | Tìm kiếm theo một mẫu (pattern)                                                   |
| IN      | Chỉ định nhiều giá trị khả dĩ cho một cột                                         |

### Trả về sản phẩm có giá cố định

Cho bảng `Products`:

| prod_id | prod_name      | prod_price |
| ------- | -------------- | ---------- |
| a0018   | sockets        | 9.49       |
| a0019   | iphone13       | 600        |
| b0018   | gucci t-shirts | 1000       |

【Câu hỏi】Truy xuất ID sản phẩm (`prod_id`) và tên sản phẩm (`prod_name`) từ bảng `Products`, chỉ trả về các sản phẩm có giá là 9.49 đô la.

Đáp án:

```sql
SELECT prod_id, prod_name
FROM Products
WHERE prod_price = 9.49
```

### Trả về sản phẩm có giá cao hơn

Cho bảng `Products`:

| prod_id | prod_name      | prod_price |
| ------- | -------------- | ---------- |
| a0018   | sockets        | 9.49       |
| a0019   | iphone13       | 600        |
| b0019   | gucci t-shirts | 1000       |

【Câu hỏi】Viết câu lệnh SQL để truy xuất ID sản phẩm (`prod_id`) và tên sản phẩm (`prod_name`) từ bảng `Products`, chỉ trả về các sản phẩm có giá từ 9 đô la trở lên.

Đáp án:

```sql
SELECT prod_id, prod_name
FROM Products
WHERE prod_price >= 9
```

### Trả về sản phẩm và sắp xếp theo giá

Cho bảng `Products`:

| prod_id | prod_name | prod_price |
| ------- | --------- | ---------- |
| a0011   | egg       | 3          |
| a0019   | sockets   | 4          |
| b0019   | coffee    | 15         |

【Câu hỏi】Viết câu lệnh SQL trả về tên (`prod_name`) và giá (`prod_price`) của tất cả các sản phẩm trong bảng `Products` có giá từ 3 đô la đến 6 đô la, sau đó sắp xếp kết quả theo giá.

Đáp án:

```sql
SELECT prod_name, prod_price
FROM Products
WHERE prod_price BETWEEN 3 AND 6
ORDER BY prod_price

# Hoặc
SELECT prod_name, prod_price
FROM Products
WHERE prod_price >= 3 AND prod_price <= 6
ORDER BY prod_price
```

### Trả về nhiều sản phẩm hơn

Bảng `OrderItems` chứa: mã đơn hàng `order_num`, số lượng sản phẩm `quantity`

| order_num | quantity |
| --------- | -------- |
| a1        | 105      |
| a2        | 1100     |
| a2        | 200      |
| a4        | 1121     |
| a5        | 10       |
| a2        | 19       |
| a7        | 5        |

【Câu hỏi】Truy xuất từ bảng `OrderItems` tất cả các mã đơn hàng (`order_num`) khác nhau và không trùng lặp, trong đó mỗi đơn hàng phải chứa từ 100 sản phẩm trở lên.

Đáp án:

```sql
SELECT order_num
FROM OrderItems
GROUP BY order_num
HAVING SUM(quantity) >= 100
```

## Lọc dữ liệu nâng cao

Toán tử `AND` và `OR` được dùng để lọc bản ghi dựa trên nhiều hơn một điều kiện; cả hai có thể kết hợp với nhau. `AND` yêu cầu cả 2 điều kiện đều phải thỏa mãn, còn `OR` chỉ cần một trong 2 điều kiện thỏa mãn là được.

### Truy xuất tên nhà cung cấp

Bảng `Vendors` có các trường: tên nhà cung cấp (`vend_name`), quốc gia nhà cung cấp (`vend_country`), bang của nhà cung cấp (`vend_state`)

| vend_name | vend_country | vend_state |
| --------- | ------------ | ---------- |
| apple     | USA          | CA         |
| vivo      | CNA          | shenzhen   |
| huawei    | CNA          | xian       |

【Câu hỏi】Viết câu lệnh SQL truy xuất tên nhà cung cấp (`vend_name`) từ bảng `Vendors`, chỉ trả về các nhà cung cấp ở bang California (cần lọc theo cả quốc gia [USA] và bang [CA], vì có thể ở quốc gia khác cũng tồn tại mã bang CA).

Đáp án:

```sql
SELECT vend_name
FROM Vendors
WHERE vend_country = 'USA' AND vend_state = 'CA'
```

### Truy xuất và liệt kê danh sách các sản phẩm đã được đặt hàng

Bảng `OrderItems` chứa tất cả các sản phẩm đã được đặt hàng (một số đã được đặt nhiều lần).

| prod_id | order_num | quantity |
| ------- | --------- | -------- |
| BR01    | a1        | 105      |
| BR02    | a2        | 1100     |
| BR02    | a2        | 200      |
| BR03    | a4        | 1121     |
| BR017   | a5        | 10       |
| BR02    | a2        | 19       |
| BR017   | a7        | 5        |

【Câu hỏi】Viết câu lệnh SQL tìm tất cả các đơn hàng đã đặt `BR01`, `BR02` hoặc `BR03` với số lượng ít nhất 100 sản phẩm. Bạn cần trả về mã đơn hàng (`order_num`), ID sản phẩm (`prod_id`) và số lượng (`quantity`) của bảng `OrderItems`, đồng thời lọc theo ID sản phẩm và số lượng.

Đáp án:

```sql
SELECT order_num, prod_id, quantity
FROM OrderItems
WHERE prod_id IN ('BR01', 'BR02', 'BR03') AND quantity >= 100
```

### Trả về tên và giá của tất cả sản phẩm có giá từ 3 đô la đến 6 đô la

Cho bảng `Products`:

| prod_id | prod_name | prod_price |
| ------- | --------- | ---------- |
| a0011   | egg       | 3          |
| a0019   | sockets   | 4          |
| b0019   | coffee    | 15         |

【Câu hỏi】Viết câu lệnh SQL trả về tên (`prod_name`) và giá (`prod_price`) của tất cả các sản phẩm có giá từ 3 đô la đến 6 đô la, sử dụng toán tử `AND`, sau đó sắp xếp kết quả tăng dần theo giá.

Đáp án:

```sql
SELECT prod_name, prod_price
FROM Products
WHERE prod_price >= 3 and prod_price <= 6
ORDER BY prod_price
```

### Kiểm tra câu lệnh SQL

Bảng nhà cung cấp `Vendors` có các trường: tên nhà cung cấp `vend_name`, quốc gia nhà cung cấp `vend_country`, tỉnh/bang nhà cung cấp `vend_state`

| vend_name | vend_country | vend_state |
| --------- | ------------ | ---------- |
| apple     | USA          | CA         |
| vivo      | CNA          | shenzhen   |
| huawei    | CNA          | xian       |

【Câu hỏi】Sửa lại câu SQL dưới đây cho đúng để trả về kết quả chính xác.

```sql
SELECT vend_name
FROM Vendors
ORDER BY vend_name
WHERE vend_country = 'USA' AND vend_state = 'CA';
```

Sau khi sửa:

```sql
SELECT vend_name
FROM Vendors
WHERE vend_country = 'USA' AND vend_state = 'CA'
ORDER BY vend_name
```

Mệnh đề `ORDER BY` bắt buộc phải đặt sau `WHERE`.

## Lọc bằng ký tự đại diện (Wildcard)

Ký tự đại diện (Wildcard) trong SQL phải được sử dụng cùng với toán tử `LIKE`.

Trong SQL, có thể sử dụng các ký tự đại diện sau:

| Ký tự đại diện                    | Mô tả                                                            |
| :-------------------------------- | :--------------------------------------------------------------- |
| `%`                               | Đại diện cho không hoặc nhiều ký tự                              |
| `_`                               | Chỉ thay thế cho đúng một ký tự                                  |
| `[charlist]`                      | Bất kỳ ký tự đơn nào nằm trong danh sách ký tự                   |
| `[^charlist]` hoặc `[!charlist]`  | Bất kỳ ký tự đơn nào không nằm trong danh sách ký tự             |

### Truy xuất tên và mô tả sản phẩm (1)

Bảng `Products` như sau:

| prod_name | prod_desc      |
| --------- | -------------- |
| a0011     | usb            |
| a0019     | iphone13       |
| b0019     | gucci t-shirts |
| c0019     | gucci toy      |
| d0019     | lego toy       |

【Câu hỏi】Viết câu lệnh SQL truy xuất tên sản phẩm (`prod_name`) và mô tả (`prod_desc`) từ bảng `Products`, chỉ trả về những sản phẩm có từ `toy` trong phần mô tả.

Đáp án:

```sql
SELECT prod_name, prod_desc
FROM Products
WHERE prod_desc LIKE '%toy%'
```

### Truy xuất tên và mô tả sản phẩm (2)

Bảng `Products` như sau:

| prod_name | prod_desc      |
| --------- | -------------- |
| a0011     | usb            |
| a0019     | iphone13       |
| b0019     | gucci t-shirts |
| c0019     | gucci toy      |
| d0019     | lego toy       |

【Câu hỏi】Viết câu lệnh SQL truy xuất tên sản phẩm (`prod_name`) và mô tả (`prod_desc`) từ bảng `Products`, chỉ trả về những sản phẩm không xuất hiện từ `toy` trong mô tả, cuối cùng sắp xếp kết quả theo "tên sản phẩm".

Đáp án:

```sql
SELECT prod_name, prod_desc
FROM Products
WHERE prod_desc NOT LIKE '%toy%'
ORDER BY prod_name
```

### Truy xuất tên và mô tả sản phẩm (3)

Bảng `Products` như sau:

| prod_name | prod_desc        |
| --------- | ---------------- |
| a0011     | usb              |
| a0019     | iphone13         |
| b0019     | gucci t-shirts   |
| c0019     | gucci toy        |
| d0019     | lego carrots toy |

【Câu hỏi】Viết câu lệnh SQL truy xuất tên sản phẩm (`prod_name`) và mô tả (`prod_desc`) từ bảng `Products`, chỉ trả về những sản phẩm có cả `toy` và `carrots` cùng xuất hiện trong mô tả. Có nhiều cách để thực hiện việc này, nhưng đối với bài tập thử thách này, hãy sử dụng `AND` và hai phép so sánh `LIKE`.

Đáp án:

```sql
SELECT prod_name, prod_desc
FROM Products
WHERE prod_desc LIKE '%toy%' AND prod_desc LIKE "%carrots%"
```

### Truy xuất tên và mô tả sản phẩm (4)

Bảng `Products` như sau:

| prod_name | prod_desc        |
| --------- | ---------------- |
| a0011     | usb              |
| a0019     | iphone13         |
| b0019     | gucci t-shirts   |
| c0019     | gucci toy        |
| d0019     | lego toy carrots |

【Câu hỏi】Viết câu lệnh SQL truy xuất tên sản phẩm (`prod_name`) và mô tả (`prod_desc`) từ bảng `Products`, chỉ trả về những sản phẩm có `toy` và `carrots` cùng xuất hiện trong mô tả theo **đúng thứ tự trước sau**. Gợi ý: chỉ cần dùng `LIKE` với ba ký hiệu `%` là được.

Đáp án:

```sql
SELECT prod_name, prod_desc
FROM Products
WHERE prod_desc LIKE '%toy%carrots%'
```

## Tạo trường tính toán

### Bí danh (Alias)

Cách dùng phổ biến của bí danh (Alias) là đổi tên các cột của bảng trong kết quả truy xuất (nhằm đáp ứng yêu cầu báo cáo cụ thể hoặc nhu cầu của khách hàng). Cho bảng `Vendors` đại diện cho thông tin nhà cung cấp, gồm `vend_id` (ID nhà cung cấp), `vend_name` (tên nhà cung cấp), `vend_address` (địa chỉ nhà cung cấp), `vend_city` (thành phố nhà cung cấp).

| vend_id | vend_name     | vend_address | vend_city |
| ------- | ------------- | ------------ | --------- |
| a001    | tencent cloud | address1     | shenzhen  |
| a002    | huawei cloud  | address2     | dongguan  |
| a003    | aliyun cloud  | address3     | hangzhou  |
| a003    | netease cloud | address4     | guangzhou |

【Câu hỏi】Viết câu lệnh SQL truy xuất `vend_id`, `vend_name`, `vend_address` và `vend_city` từ bảng `Vendors`, đổi tên `vend_name` thành `vname`, `vend_city` thành `vcity`, `vend_address` thành `vaddress`, và sắp xếp kết quả tăng dần theo tên nhà cung cấp.

Đáp án:

```sql
SELECT vend_id, vend_name AS vname, vend_address AS vaddress, vend_city AS vcity
FROM Vendors
ORDER BY vname
# Có thể lược bỏ AS
SELECT vend_id, vend_name vname, vend_address vaddress, vend_city vcity
FROM Vendors
ORDER BY vname
```

### Giảm giá

Cửa hàng mẫu của chúng ta đang thực hiện chương trình khuyến mãi giảm giá, tất cả sản phẩm đều giảm 10%. Bảng `Products` chứa `prod_id` (ID sản phẩm) và `prod_price` (giá sản phẩm).

【Câu hỏi】Viết câu lệnh SQL trả về `prod_id`, `prod_price` và `sale_price` từ bảng `Products`. `sale_price` là một trường tính toán chứa giá khuyến mãi. Gợi ý: có thể nhân với 0.9 để thu được 90% giá gốc (tức giảm giá 10%).

Đáp án:

```sql
SELECT prod_id, prod_price, prod_price * 0.9 AS sale_price
FROM Products
```

Lưu ý: `sale_price` là tên đặt cho kết quả tính toán, chứ không phải tên cột có sẵn ban đầu.

## Xử lý dữ liệu bằng hàm

### Tên đăng nhập của khách hàng

Cửa hàng của chúng ta đã đi vào hoạt động và đang tạo tài khoản cho khách hàng. Tất cả người dùng đều cần tên đăng nhập, tên đăng nhập mặc định là sự kết hợp giữa tên của họ và thành phố nơi họ sinh sống.

Cho bảng `Customers` như sau:

| cust_id | cust_name | cust_contact | cust_city |
| ------- | --------- | ------------ | --------- |
| a1      | Andy Li   | Andy Li      | Oak Park  |
| a2      | Ben Liu   | Ben Liu      | Oak Park  |
| a3      | Tony Dai  | Tony Dai     | Oak Park  |
| a4      | Tom Chen  | Tom Chen     | Oak Park  |
| a5      | An Li     | An Li        | Oak Park  |
| a6      | Lee Chen  | Lee Chen     | Oak Park  |
| a7      | Hex Liu   | Hex Liu      | Oak Park  |

【Câu hỏi】Viết câu lệnh SQL trả về ID khách hàng (`cust_id`), tên khách hàng (`cust_name`) và tên đăng nhập (`user_login`), trong đó tên đăng nhập toàn bộ viết bằng chữ in hoa, được ghép từ 2 ký tự đầu của người liên hệ khách hàng (`cust_contact`) và 3 ký tự đầu của thành phố nơi khách hàng cư trú (`cust_city`). Gợi ý: cần sử dụng hàm, ghép chuỗi và bí danh.

Đáp án:

```sql
SELECT cust_id, cust_name, UPPER(CONCAT(SUBSTRING(cust_contact, 1, 2), SUBSTRING(cust_city, 1, 3))) AS user_login
FROM Customers
```

Kiến thức trọng tâm:

- Hàm cắt chuỗi `SUBSTRING()`: cắt chuỗi ký tự, `substring(str ,n ,m)` (`n` biểu thị vị trí bắt đầu cắt, `m` biểu thị số lượng ký tự cần cắt) trả về `m` ký tự được cắt từ ký tự thứ `n` của chuỗi `str`;
- Hàm ghép chuỗi `CONCAT()`: nối hai hoặc nhiều chuỗi thành một chuỗi, `select concat(A,B)` nối chuỗi A và B;
- Hàm viết hoa `UPPER()`: chuyển đổi chuỗi chỉ định thành chữ in hoa.

### Trả về mã đơn hàng và ngày đặt hàng của tất cả các đơn hàng trong tháng 1 năm 2020

Bảng đơn hàng `Orders` như sau:

| order_num | order_date          |
| --------- | ------------------- |
| a0001     | 2020-01-01 00:00:00 |
| a0002     | 2020-01-02 00:00:00 |
| a0003     | 2020-01-01 12:00:00 |
| a0004     | 2020-02-01 00:00:00 |
| a0005     | 2020-03-01 00:00:00 |

【Câu hỏi】Viết câu lệnh SQL trả về mã đơn hàng (`order_num`) và ngày đặt hàng (`order_date`) của tất cả các đơn hàng trong tháng 1 năm 2020, sắp xếp tăng dần theo ngày đặt hàng.

Đáp án:

```sql
SELECT order_num, order_date
FROM Orders
WHERE month(order_date) = '01' AND YEAR(order_date) = '2020'
ORDER BY order_date
```

Cũng có thể dùng ký tự đại diện để làm:

```sql
SELECT order_num, order_date
FROM Orders
WHERE order_date LIKE '2020-01%'
ORDER BY order_date
```

Kiến thức trọng tâm:

- Định dạng ngày: `YYYY-MM-DD`
- Định dạng giờ: `HH:MM:SS`

Các hàm thường dùng liên quan đến xử lý ngày và giờ:

| Hàm             | Mô tả                                                        |
| --------------- | ------------------------------------------------------------ |
| `ADDDATE()`     | Cộng thêm một khoảng thời gian vào ngày (ngày, tuần, v.v.)   |
| `ADDTIME()`     | Cộng thêm một khoảng thời gian vào giờ (giờ, phút, v.v.)     |
| `CURDATE()`     | Trả về ngày hiện tại                                         |
| `CURTIME()`     | Trả về thời gian hiện tại                                    |
| `DATE()`        | Trả về phần ngày của giá trị datetime                        |
| `DATEDIFF`      | Tính khoảng chênh lệch giữa hai ngày                         |
| `DATE_FORMAT()` | Trả về chuỗi ngày hoặc giờ đã được định dạng                 |
| `DAY()`         | Trả về phần ngày trong tháng của một ngày                    |
| `DAYOFWEEK()`   | Trả về thứ trong tuần tương ứng của một ngày                 |
| `HOUR()`        | Trả về phần giờ của một giá trị thời gian                    |
| `MINUTE()`      | Trả về phần phút của một giá trị thời gian                   |
| `MONTH()`       | Trả về phần tháng của một ngày                               |
| `NOW()`         | Trả về ngày và giờ hiện tại                                  |
| `SECOND()`      | Trả về phần giây của một giá trị thời gian                   |
| `TIME()`        | Trả về phần thời gian của giá trị datetime                   |
| `YEAR()`        | Trả về phần năm của một ngày                                 |

## Tổng hợp dữ liệu

Các hàm liên quan đến tổng hợp dữ liệu:

| Hàm       | Mô tả                                      |
| --------- | ------------------------------------------ |
| `AVG()`   | Trả về giá trị trung bình của một cột      |
| `COUNT()` | Trả về số dòng của một cột                 |
| `MAX()`   | Trả về giá trị lớn nhất của một cột        |
| `MIN()`   | Trả về giá trị nhỏ nhất của một cột        |
| `SUM()`   | Trả về tổng các giá trị của một cột        |

### Xác định tổng số lượng sản phẩm đã bán

Bảng `OrderItems` đại diện cho các sản phẩm đã bán, `quantity` đại diện cho số lượng sản phẩm bán ra.

| quantity |
| -------- |
| 10       |
| 100      |
| 1000     |
| 10001    |
| 2        |
| 15       |

【Câu hỏi】Viết câu lệnh SQL để xác định tổng số lượng sản phẩm đã bán.

Đáp án:

```sql
SELECT Sum(quantity) AS items_ordered
FROM OrderItems
```

### Xác định tổng số lượng mặt hàng sản phẩm BR01 đã bán

Bảng `OrderItems` đại diện cho các sản phẩm đã bán, `quantity` đại diện cho số lượng sản phẩm bán ra, mã mặt hàng sản phẩm là `prod_id`.

| quantity | prod_id |
| -------- | ------- |
| 10       | AR01    |
| 100      | AR10    |
| 1000     | BR01    |
| 10001    | BR010   |

【Câu hỏi】Sửa lại câu lệnh đã tạo để xác định tổng số lượng mặt hàng sản phẩm (`prod_id`) là "BR01" đã bán.

Đáp án:

```sql
SELECT Sum(quantity) AS items_ordered
FROM OrderItems
WHERE prod_id = 'BR01'
```

### Xác định giá sản phẩm đắt nhất không quá 10 đô la trong bảng Products

Cho bảng `Products` như sau, `prod_price` đại diện cho giá của sản phẩm.

| prod_price |
| ---------- |
| 9.49       |
| 600        |
| 1000       |

【Câu hỏi】Viết câu lệnh SQL để xác định giá (`prod_price`) của sản phẩm đắt nhất có giá không quá 10 đô la trong bảng `Products`. Đặt tên cho trường tính toán thu được là `max_price`.

Đáp án:

```sql
SELECT Max(prod_price) AS max_price
FROM Products
WHERE prod_price <= 10
```

## Nhóm dữ liệu

`GROUP BY`:

- Mệnh đề `GROUP BY` gom các bản ghi vào thành các dòng tổng hợp.
- `GROUP BY` trả về một bản ghi cho mỗi nhóm.
- `GROUP BY` thường đi kèm với các hàm tổng hợp như `COUNT`, `MAX`, `SUM`, `AVG`, v.v.
- `GROUP BY` có thể gom nhóm theo một cột hoặc nhiều cột.
- Sau khi `GROUP BY` gom nhóm theo trường phân nhóm, `ORDER BY` có thể sắp xếp theo trường tổng hợp.

`HAVING`:

- `HAVING` dùng để lọc kết quả đã được tổng hợp bởi `GROUP BY`.
- `HAVING` bắt buộc phải dùng cùng với `GROUP BY`.
- `WHERE` và `HAVING` có thể xuất hiện cùng nhau trong một câu truy vấn.

`HAVING` vs `WHERE`:

- `WHERE`: lọc các dòng được chỉ định, phía sau không được đặt hàm tổng hợp (hàm gom nhóm).
- `HAVING`: lọc các nhóm, bắt buộc phải dùng cùng với `GROUP BY`, không thể dùng độc lập.

### Trả về số dòng của mỗi mã đơn hàng

Bảng `OrderItems` chứa từng sản phẩm của mỗi đơn hàng

| order_num |
| --------- |
| a002      |
| a002      |
| a002      |
| a004      |
| a007      |

【Câu hỏi】Viết câu lệnh SQL trả về số dòng (`order_lines`) của mỗi mã đơn hàng (`order_num`), và sắp xếp kết quả tăng dần theo `order_lines`.

Đáp án:

```sql
SELECT order_num, Count(order_num) AS order_lines
FROM OrderItems
GROUP BY order_num
ORDER BY order_lines
```

Kiến thức trọng tâm:

1. `count(*)` và `count(tên_cột)` đều dùng được, điểm khác biệt là `count(tên_cột)` chỉ thống kê các dòng khác `NULL`;
2. `order by` được thực thi cuối cùng, vì vậy có thể sử dụng bí danh cột;
3. Khi tổng hợp theo nhóm nhất định không được quên thêm `group by`, nếu không kết quả sẽ chỉ có một dòng duy nhất.

### Sản phẩm có chi phí thấp nhất của mỗi nhà cung cấp

Cho bảng `Products`, chứa trường `prod_price` đại diện cho giá sản phẩm và `vend_id` đại diện cho ID nhà cung cấp

| vend_id | prod_price |
| ------- | ---------- |
| a0011   | 100        |
| a0019   | 0.1        |
| b0019   | 1000       |
| b0019   | 6980       |
| b0019   | 20         |

【Câu hỏi】Viết câu lệnh SQL trả về trường có tên `cheapest_item`, chứa sản phẩm có chi phí thấp nhất của mỗi nhà cung cấp (sử dụng `prod_price` trong bảng `Products`), sau đó sắp xếp kết quả tăng dần từ chi phí thấp nhất đến cao nhất.

Đáp án:

```sql
SELECT vend_id, Min(prod_price) AS cheapest_item
FROM Products
GROUP BY vend_id
ORDER BY cheapest_item
```

### Trả về mã đơn hàng của tất cả các đơn hàng có tổng số lượng không nhỏ hơn 100

`OrderItems` đại diện cho bảng sản phẩm trong đơn hàng, bao gồm: mã đơn hàng `order_num` và số lượng đặt hàng `quantity`.

| order_num | quantity |
| --------- | -------- |
| a1        | 105      |
| a2        | 1100     |
| a2        | 200      |
| a4        | 1121     |
| a5        | 10       |
| a2        | 19       |
| a7        | 5        |

【Câu hỏi】Hãy viết câu lệnh SQL trả về tất cả các mã đơn hàng có tổng số lượng đặt hàng không nhỏ hơn 100, kết quả cuối cùng sắp xếp tăng dần theo mã đơn hàng.

Đáp án:

```sql
# Tổng hợp trực tiếp
SELECT order_num
FROM OrderItems
GROUP BY order_num
HAVING Sum(quantity) >= 100
ORDER BY order_num

# Subquery
SELECT a.order_num
FROM (SELECT order_num, Sum(quantity) AS sum_num
    FROM OrderItems
    GROUP BY order_num
    HAVING sum_num >= 100) a
ORDER BY a.order_num
```

Kiến thức trọng tâm:

- `where`: lọc các dòng được chỉ định, phía sau không thể đặt hàm tổng hợp (hàm gom nhóm).
- `having`: lọc nhóm, dùng cùng với `group by`, không thể sử dụng đơn lẻ.

### Tính tổng tiền

Bảng `OrderItems` đại diện cho thông tin đơn hàng, bao gồm các trường: mã đơn hàng `order_num`, giá bán sản phẩm `item_price` và số lượng sản phẩm `quantity`.

| order_num | item_price | quantity |
| --------- | ---------- | -------- |
| a1        | 10         | 105      |
| a2        | 1          | 1100     |
| a2        | 1          | 200      |
| a4        | 2          | 1121     |
| a5        | 5          | 10       |
| a2        | 1          | 19       |
| a7        | 7          | 5        |

【Câu hỏi】Viết câu lệnh SQL tổng hợp theo mã đơn hàng, trả về tất cả mã đơn hàng có tổng giá trị đơn hàng không nhỏ hơn 1000, kết quả cuối cùng sắp xếp tăng dần theo mã đơn hàng.

Gợi ý: Tổng giá trị = `item_price` nhân với `quantity`

Đáp án:

```sql
SELECT order_num, Sum(item_price * quantity) AS total_price
FROM OrderItems
GROUP BY order_num
HAVING total_price >= 1000
ORDER BY order_num
```

### Kiểm tra câu lệnh SQL

Bảng `OrderItems` chứa `order_num` (mã đơn hàng)

| order_num |
| --------- |
| a002      |
| a002      |
| a002      |
| a004      |
| a007      |

【Câu hỏi】Sửa đoạn mã dưới đây cho đúng rồi thực thi

```sql
SELECT order_num, COUNT(*) AS items
FROM OrderItems
GROUP BY items
HAVING COUNT(*) >= 3
ORDER BY items, order_num;
```

Sau khi sửa:

```sql
SELECT order_num, COUNT(*) AS items
FROM OrderItems
GROUP BY order_num
HAVING items >= 3
ORDER BY items, order_num;
```

## Sử dụng Subquery (Truy vấn con)

Subquery (truy vấn con) là một câu truy vấn SQL được lồng bên trong một câu truy vấn lớn hơn, còn được gọi là truy vấn trong (inner query) hoặc lựa chọn trong (inner select); câu lệnh chứa subquery được gọi là truy vấn ngoài (outer query) hoặc lựa chọn ngoài (outer select). Nói đơn giản, subquery là việc sử dụng kết quả của một câu truy vấn `SELECT` (truy vấn con) làm nguồn dữ liệu hoặc điều kiện phán đoán cho một câu lệnh SQL khác (truy vấn chính).

Subquery có thể được nhúng vào các câu lệnh `SELECT`, `INSERT`, `UPDATE` và `DELETE`, đồng thời cũng có thể dùng kết hợp với các toán tử như `=`, `<`, `>`, `IN`, `BETWEEN`, `EXISTS`, v.v.

Subquery thường được đặt sau mệnh đề `WHERE` và mệnh đề `FROM`:

- Khi dùng trong mệnh đề `WHERE`, tùy theo toán tử khác nhau, subquery có thể trả về dữ liệu một dòng một cột, nhiều dòng một cột hoặc một dòng nhiều cột. Mục đích của subquery là trả về giá trị có thể làm điều kiện lọc cho mệnh đề `WHERE`.
- Khi dùng trong mệnh đề `FROM`, thông thường subquery trả về dữ liệu nhiều dòng nhiều cột, tương đương với một bảng tạm, như vậy mới phù hợp với quy tắc phía sau `FROM` là một bảng. Cách làm này cho phép thực hiện truy vấn kết hợp nhiều bảng.

> Lưu ý: Cơ sở dữ liệu MySQL chỉ bắt đầu hỗ trợ subquery từ phiên bản 4.1, các phiên bản cũ hơn không hỗ trợ.

Cú pháp cơ bản của subquery dùng cho mệnh đề `WHERE` như sau:

```sql
SELECT column_name [, column_name ]
FROM table1 [, table2 ]
WHERE column_name operator
(SELECT column_name [, column_name ]
FROM table1 [, table2 ]
[WHERE])
```

- Subquery cần được đặt bên trong cặp dấu ngoặc tròn `( )`.
- `operator` biểu thị toán tử dùng cho mệnh đề `WHERE`, có thể là toán tử so sánh (như `=`, `<`, `>`, `<>`, v.v.) hoặc toán tử logic (như `IN`, `NOT IN`, `EXISTS`, `NOT EXISTS`, v.v.), tùy theo nhu cầu cụ thể để xác định.

Cú pháp cơ bản của subquery dùng cho mệnh đề `FROM` như sau:

```sql
SELECT column_name [, column_name ]
FROM (SELECT column_name [, column_name ]
      FROM table1 [, table2 ]
      [WHERE]) AS temp_table_name [, ...]
[JOIN type JOIN table_name ON condition]
WHERE condition;
```

- Kết quả trả về của subquery dùng cho `FROM` tương đương với một bảng tạm, do đó cần dùng từ khóa `AS` để đặt tên cho bảng tạm này.
- Subquery cần được đặt bên trong cặp dấu ngoặc tròn `( )`.
- Có thể chỉ định nhiều tên bảng tạm và dùng câu lệnh `JOIN` để nối các bảng này lại với nhau.

### Trả về danh sách khách hàng đã mua sản phẩm có giá từ 10 đô la trở lên

`OrderItems` biểu thị bảng sản phẩm trong đơn hàng, chứa các trường: mã đơn hàng `order_num`, giá sản phẩm `item_price`; bảng `Orders` đại diện cho bảng thông tin đơn hàng, chứa ID khách hàng `cust_id` và mã đơn hàng `order_num`.

Bảng `OrderItems`:

| order_num | item_price |
| --------- | ---------- |
| a1        | 10         |
| a2        | 1          |
| a2        | 1          |
| a4        | 2          |
| a5        | 5          |
| a2        | 1          |
| a7        | 7          |

Bảng `Orders`:

| order_num | cust_id |
| --------- | ------- |
| a1        | cust10  |
| a2        | cust1   |
| a2        | cust1   |
| a4        | cust2   |
| a5        | cust5   |
| a2        | cust1   |
| a7        | cust7   |

【Câu hỏi】Sử dụng subquery, trả về danh sách khách hàng đã mua sản phẩm có giá từ 10 đô la trở lên, kết quả không cần sắp xếp.

Đáp án:

```sql
SELECT cust_id
FROM Orders
WHERE order_num IN (SELECT DISTINCT order_num
    FROM OrderItems
    where item_price >= 10)
```

### Xác định những đơn hàng nào đã mua sản phẩm có prod_id là BR01 (1)

Bảng `OrderItems` đại diện cho bảng thông tin sản phẩm đơn hàng, `prod_id` là ID sản phẩm; bảng `Orders` đại diện cho bảng đơn hàng có `cust_id` đại diện cho ID khách hàng và ngày đặt hàng `order_date`.

Bảng `OrderItems`:

| prod_id | order_num |
| ------- | --------- |
| BR01    | a0001     |
| BR01    | a0002     |
| BR02    | a0003     |
| BR02    | a0013     |

Bảng `Orders`:

| order_num | cust_id | order_date          |
| --------- | ------- | ------------------- |
| a0001     | cust10  | 2022-01-01 00:00:00 |
| a0002     | cust1   | 2022-01-01 00:01:00 |
| a0003     | cust1   | 2022-01-02 00:00:00 |
| a0013     | cust2   | 2022-01-01 00:20:00 |

【Câu hỏi】

Viết câu lệnh SQL sử dụng subquery để xác định những đơn hàng nào (trong `OrderItems`) đã mua sản phẩm có `prod_id` là "BR01", sau đó từ bảng `Orders` trả về ID khách hàng (`cust_id`) và ngày đặt hàng (`order_date`) tương ứng cho mỗi sản phẩm, sắp xếp kết quả tăng dần theo ngày đặt hàng.

Đáp án:

```sql
# Cách 1: Subquery
SELECT cust_id,order_date
FROM Orders
WHERE order_num IN
    (SELECT order_num
     FROM OrderItems
     WHERE prod_id = 'BR01' )
ORDER BY order_date;

# Cách 2: Nối bảng (Join)
SELECT b.cust_id, b.order_date
FROM OrderItems a,Orders b
WHERE a.order_num = b.order_num AND a.prod_id = 'BR01'
ORDER BY order_date
```

### Trả về email của tất cả khách hàng đã mua sản phẩm có prod_id là BR01 (1)

Bạn muốn biết ngày đặt mua sản phẩm BR01; có bảng `OrderItems` đại diện cho bảng thông tin sản phẩm đơn hàng, `prod_id` là ID sản phẩm; bảng `Orders` đại diện cho bảng đơn hàng có `cust_id` đại diện cho ID khách hàng và ngày đặt hàng `order_date`; bảng `Customers` chứa email khách hàng `cust_email` và ID khách hàng `cust_id`.

Bảng `OrderItems`:

| prod_id | order_num |
| ------- | --------- |
| BR01    | a0001     |
| BR01    | a0002     |
| BR02    | a0003     |
| BR02    | a0013     |

Bảng `Orders`:

| order_num | cust_id | order_date          |
| --------- | ------- | ------------------- |
| a0001     | cust10  | 2022-01-01 00:00:00 |
| a0002     | cust1   | 2022-01-01 00:01:00 |
| a0003     | cust1   | 2022-01-02 00:00:00 |
| a0013     | cust2   | 2022-01-01 00:20:00 |

Bảng `Customers` đại diện cho thông tin khách hàng, `cust_id` là ID khách hàng, `cust_email` là email khách hàng:

| cust_id | cust_email        |
| ------- | ----------------- |
| cust10  | <cust10@cust.com> |
| cust1   | <cust1@cust.com>  |
| cust2   | <cust2@cust.com>  |

【Câu hỏi】Trả về email (`cust_email` trong bảng `Customers`) của tất cả khách hàng đã mua sản phẩm có `prod_id` là `BR01`, kết quả không cần sắp xếp.

Gợi ý: Bài này liên quan đến nhiều câu lệnh `SELECT`, lớp trong cùng trả về `order_num` từ bảng `OrderItems`, lớp ở giữa trả về `cust_id` từ bảng `Customers` (lưu ý thực tế là từ bảng `Orders`).

Đáp án:

```sql
# Cách 1: Subquery
SELECT cust_email
FROM Customers
WHERE cust_id IN (SELECT cust_id
    FROM Orders
    WHERE order_num IN (SELECT order_num
        FROM OrderItems
        WHERE prod_id = 'BR01'))

# Cách 2: Nối bảng (inner join)
SELECT c.cust_email
FROM OrderItems a,Orders b,Customers c
WHERE a.order_num = b.order_num AND b.cust_id = c.cust_id AND a.prod_id = 'BR01'

# Cách 3: Nối bảng (left join)
SELECT c.cust_email
FROM Orders a LEFT JOIN
  OrderItems b ON a.order_num = b.order_num LEFT JOIN
  Customers c ON a.cust_id = c.cust_id
WHERE b.prod_id = 'BR01'
```

### Trả về tổng số tiền của các đơn hàng khác nhau cho mỗi khách hàng

Chúng ta cần một danh sách các ID khách hàng bao gồm tổng số tiền mà họ đã đặt hàng.

Bảng `OrderItems` đại diện cho thông tin đơn hàng, bảng `OrderItems` có mã đơn hàng `order_num`, giá bán sản phẩm `item_price`, số lượng sản phẩm `quantity`.

| order_num | item_price | quantity |
| --------- | ---------- | -------- |
| a0001     | 10         | 105      |
| a0002     | 1          | 1100     |
| a0002     | 1          | 200      |
| a0013     | 2          | 1121     |
| a0003     | 5          | 10       |
| a0003     | 1          | 19       |
| a0003     | 7          | 5        |

Bảng `Orders` có mã đơn hàng `order_num`, ID khách hàng `cust_id`:

| order_num | cust_id |
| --------- | ------- |
| a0001     | cust10  |
| a0002     | cust1   |
| a0003     | cust1   |
| a0013     | cust2   |

【Câu hỏi】

Viết câu lệnh SQL trả về ID khách hàng (`cust_id` trong bảng `Orders`), sử dụng subquery trả về `total_ordered` để cho biết tổng giá trị đơn hàng của mỗi khách hàng, sắp xếp kết quả theo số tiền từ lớn đến nhỏ.

Đáp án:

```sql
# Cách 1: Subquery
SELECT o.cust_id, SUM(tb.total_ordered) AS `total_ordered`
FROM (SELECT order_num, SUM(item_price * quantity) AS total_ordered
    FROM OrderItems
    GROUP BY order_num) AS tb,
  Orders o
WHERE tb.order_num = o.order_num
GROUP BY o.cust_id
ORDER BY total_ordered DESC;

# Cách 2: Nối bảng
SELECT b.cust_id, Sum(a.quantity * a.item_price) AS total_ordered
FROM OrderItems a,Orders b
WHERE a.order_num = b.order_num
GROUP BY cust_id
ORDER BY total_ordered DESC
```

Để tìm hiểu chi tiết hơn về Cách 1, bạn có thể tham khảo: [issue#2402: Lỗi tồn tại ở Cách 1 và cách sửa](https://github.com/Snailclimb/JavaGuide/issues/2402).

### Truy xuất tất cả tên sản phẩm cùng tổng số lượng bán tương ứng từ bảng Products

Từ bảng `Products` truy xuất tên sản phẩm `prod_name`, ID sản phẩm `prod_id`:

| prod_id | prod_name |
| ------- | --------- |
| a0001   | egg       |
| a0002   | sockets   |
| a0013   | coffee    |
| a0003   | cola      |

Bảng `OrderItems` đại diện cho bảng sản phẩm đơn hàng, có sản phẩm đặt hàng `prod_id`, số lượng đã bán `quantity`:

| prod_id | quantity |
| ------- | -------- |
| a0001   | 105      |
| a0002   | 1100     |
| a0002   | 200      |
| a0013   | 1121     |
| a0003   | 10       |
| a0003   | 19       |
| a0003   | 5        |

【Câu hỏi】

Viết câu lệnh SQL truy xuất tất cả tên sản phẩm (`prod_name`) từ bảng `Products`, cùng với một cột tính toán có tên `quant_sold` chứa tổng số lượng sản phẩm đã bán (truy xuất trên bảng `OrderItems` bằng subquery và `SUM(quantity)`).

Đáp án:

```sql
# Cách 1: Subquery
SELECT p.prod_name, tb.quant_sold
FROM (SELECT prod_id, Sum(quantity) AS quant_sold
    FROM OrderItems
    GROUP BY prod_id) AS tb,
  Products p
WHERE tb.prod_id = p.prod_id

# Cách 2: Nối bảng
SELECT p.prod_name, Sum(o.quantity) AS quant_sold
FROM Products p,
  OrderItems o
WHERE p.prod_id = o.prod_id
GROUP BY p.prod_name # Không thể dùng p.prod_id ở đây vì sẽ báo lỗi
```

## Nối bảng (JOIN)

JOIN có nghĩa là "kết nối" hay "nối"; đúng như tên gọi, mệnh đề SQL `JOIN` được dùng để kết hợp hai hoặc nhiều bảng lại với nhau để thực hiện truy vấn.

Khi nối bảng, cần chọn một trường ở mỗi bảng và so sánh giá trị của các trường này; hai bản ghi có giá trị bằng nhau sẽ được gộp thành một bản ghi. **Bản chất của việc nối bảng là gộp các bản ghi của các bảng khác nhau lại để tạo thành một bảng mới. Tất nhiên, bảng mới này chỉ là bảng tạm, nó chỉ tồn tại trong suốt quá trình thực thi truy vấn lần này.**

Cú pháp cơ bản để dùng `JOIN` nối hai bảng như sau:

```sql
SELECT table1.column1, table2.column2...
FROM table1
JOIN table2
ON table1.common_column1 = table2.common_column2;
```

`table1.common_column1 = table2.common_column2` là điều kiện nối; chỉ những bản ghi thỏa mãn điều kiện này mới được gộp thành một dòng. Bạn có thể sử dụng nhiều toán tử để nối bảng, chẳng hạn như `=`, `>`, `<`, `<>`, `<=`, `>=`, `!=`, `between`, `like` hoặc `not`, nhưng phổ biến nhất vẫn là dùng `=`.

Khi hai bảng có các trường trùng tên, để giúp database engine phân biệt trường đó thuộc bảng nào, cần viết kèm tên bảng trước tên trường. Tất nhiên, nếu tên trường được viết là duy nhất trong cả hai bảng thì không cần dùng định dạng trên, chỉ cần viết tên trường là đủ.

Ngoài ra, nếu tên trường liên kết của hai bảng giống nhau, bạn cũng có thể sử dụng mệnh đề `USING` để thay thế cho `ON`, ví dụ:

```sql
# join....on
SELECT c.cust_name, o.order_num
FROM Customers c
INNER JOIN Orders o
ON c.cust_id = o.cust_id
ORDER BY c.cust_name

# Nếu tên trường liên kết của hai bảng giống nhau, cũng có thể dùng mệnh đề USING: JOIN....USING()
SELECT c.cust_name, o.order_num
FROM Customers c
INNER JOIN Orders o
USING(cust_id)
ORDER BY c.cust_name
```

**Sự khác biệt giữa `ON` và `WHERE`**:

- Khi nối bảng, SQL sẽ tạo ra một bảng tạm mới dựa trên điều kiện nối. `ON` chính là điều kiện nối, nó quyết định việc tạo ra bảng tạm đó.
- `WHERE` thực hiện sau khi bảng tạm đã được tạo xong, dùng để lọc dữ liệu trong bảng tạm đó nhằm tạo ra tập kết quả cuối cùng; ở thời điểm này không còn `JOIN-ON` nữa.

Do đó, tóm lại là: **SQL trước tiên dựa vào `ON` để tạo ra một bảng tạm, sau đó mới dựa vào `WHERE` để lọc bảng tạm đó**.

SQL cho phép thêm một số từ khóa bổ trợ ở bên trái `JOIN` để tạo thành các kiểu nối khác nhau, như trong bảng sau:

| Kiểu nối                                      | Mô tả                                                                                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| INNER JOIN (Nối trong)                        | (Kiểu nối mặc định) Chỉ trả về dòng khi cả hai bảng đều tồn tại bản ghi thỏa mãn điều kiện.                                         |
| LEFT JOIN / LEFT OUTER JOIN (Nối ngoài trái)  | Trả về tất cả các dòng từ bảng bên trái, ngay cả khi không có dòng nào khớp điều kiện trong bảng bên phải.                          |
| RIGHT JOIN / RIGHT OUTER JOIN (Nối ngoài phải)| Trả về tất cả các dòng từ bảng bên phải, ngay cả khi không có dòng nào khớp điều kiện trong bảng bên trái.                          |
| FULL JOIN / FULL OUTER JOIN (Nối ngoài đầy đủ)| Chỉ cần một trong hai bảng có bản ghi thỏa mãn điều kiện thì sẽ trả về dòng.                                                        |
| SELF JOIN (Tự nối)                            | Nối một bảng với chính nó, giống như bảng đó là hai bảng tách biệt. Để phân biệt hai bảng, trong câu SQL cần đặt lại ít nhất một bí danh bảng. |
| CROSS JOIN (Nối chéo)                         | Nối chéo, trả về tích Đề-các (Cartesian product) của các tập bản ghi từ hai hay nhiều bảng được nối.                                |

Hình dưới đây minh họa 7 cách sử dụng liên quan đến `LEFT JOIN`, `RIGHT JOIN`, `INNER JOIN` và `OUTER JOIN`.

![7 cách dùng SQL JOIN](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/d1794312b448516831369f869814ab39-73a6c29d.png)

Nếu không thêm bất kỳ từ khóa bổ trợ nào mà chỉ viết `JOIN`, thì mặc định đó là `INNER JOIN`.

Đối với `INNER JOIN`, còn có một cách viết ngầm định gọi là "**Inner Join ngầm định**" (Implicit Inner Join), tức là không có từ khóa `INNER JOIN` mà dùng mệnh đề `WHERE` để thực hiện chức năng nối trong:

```sql
# Inner Join ngầm định
SELECT c.cust_name, o.order_num
FROM Customers c,Orders o
WHERE c.cust_id = o.cust_id
ORDER BY c.cust_name

# Inner Join tường minh
SELECT c.cust_name, o.order_num
FROM Customers c
INNER JOIN Orders o
USING(cust_id)
ORDER BY c.cust_name;
```

### Trả về tên khách hàng và mã đơn hàng liên quan

Bảng `Customers` có các trường: tên khách hàng `cust_name`, ID khách hàng `cust_id`:

| cust_id  | cust_name |
| -------- | --------- |
| cust10   | andy      |
| cust1    | ben       |
| cust2    | tony      |
| cust22   | tom       |
| cust221  | an        |
| cust2217 | hex       |

Bảng thông tin đơn hàng `Orders` chứa các trường: mã đơn hàng `order_num`, ID khách hàng `cust_id`:

| order_num | cust_id  |
| --------- | -------- |
| a1        | cust10   |
| a2        | cust1    |
| a3        | cust2    |
| a4        | cust22   |
| a5        | cust221  |
| a7        | cust2217 |

【Câu hỏi】Viết câu lệnh SQL trả về tên khách hàng (`cust_name`) từ bảng `Customers` và mã đơn hàng liên quan (`order_num`) từ bảng `Orders`, đồng thời sắp xếp kết quả tăng dần theo tên khách hàng rồi đến mã đơn hàng. Bạn có thể thử viết bằng hai cách khác nhau: một cách dùng cú pháp nối bằng (equi-join) đơn giản, cách còn lại dùng `INNER JOIN`.

Đáp án:

```sql
# Inner Join ngầm định
SELECT c.cust_name, o.order_num
FROM Customers c,Orders o
WHERE c.cust_id = o.cust_id
ORDER BY c.cust_name,o.order_num

# Inner Join tường minh
SELECT c.cust_name, o.order_num
FROM Customers c
INNER JOIN Orders o
USING(cust_id)
ORDER BY c.cust_name,o.order_num;
```

### Trả về tên khách hàng, mã đơn hàng liên quan và tổng giá của mỗi đơn hàng

Bảng `Customers` có các trường: tên khách hàng `cust_name`, ID khách hàng `cust_id`:

| cust_id  | cust_name |
| -------- | --------- |
| cust10   | andy      |
| cust1    | ben       |
| cust2    | tony      |
| cust22   | tom       |
| cust221  | an        |
| cust2217 | hex       |

Bảng thông tin đơn hàng `Orders` có các trường: mã đơn hàng `order_num`, ID khách hàng `cust_id`:

| order_num | cust_id  |
| --------- | -------- |
| a1        | cust10   |
| a2        | cust1    |
| a3        | cust2    |
| a4        | cust22   |
| a5        | cust221  |
| a7        | cust2217 |

Bảng `OrderItems` có các trường: mã đơn hàng sản phẩm `order_num`, số lượng sản phẩm `quantity`, giá sản phẩm `item_price`:

| order_num | quantity | item_price |
| --------- | -------- | ---------- |
| a1        | 1000     | 10         |
| a2        | 200      | 10         |
| a3        | 10       | 15         |
| a4        | 25       | 50         |
| a5        | 15       | 25         |
| a7        | 7        | 7          |

【Câu hỏi】Ngoài việc trả về tên khách hàng và mã đơn hàng, hãy trả về tên khách hàng (`cust_name`) trong bảng `Customers` và mã đơn hàng liên quan (`order_num`) trong bảng `Orders`, thêm cột thứ ba `OrderTotal` chứa tổng giá trị của mỗi đơn hàng, sau đó sắp xếp kết quả tăng dần theo tên khách hàng rồi đến mã đơn hàng.

```sql
# Cú pháp nối bằng đơn giản
SELECT c.cust_name, o.order_num, SUM(quantity * item_price) AS OrderTotal
FROM Customers c,Orders o,OrderItems oi
WHERE c.cust_id = o.cust_id AND o.order_num = oi.order_num
GROUP BY c.cust_name, o.order_num
ORDER BY c.cust_name, o.order_num
```

Lưu ý, có thể có bạn sẽ viết như thế này:

```sql
SELECT c.cust_name, o.order_num, SUM(quantity * item_price) AS OrderTotal
FROM Customers c,Orders o,OrderItems oi
WHERE c.cust_id = o.cust_id AND o.order_num = oi.order_num
GROUP BY c.cust_name
ORDER BY c.cust_name,o.order_num
```

Cách viết này là sai! Chỉ gom nhóm theo `cust_name` tuy đúng với ý đồ bài toán nhưng lại không đúng cú pháp của `GROUP BY`.

Trong câu lệnh `SELECT`, nếu không có mệnh đề `GROUP BY`, thì `cust_name` và `order_num` sẽ trả về nhiều giá trị, trong khi `sum(quantity * item_price)` chỉ trả về một giá trị duy nhất; thông qua `group by` theo `cust_name` có thể giúp `cust_name` tương ứng 1-1 với `sum(quantity * item_price)` (tức là **gom nhóm**), nên tương tự như vậy, cũng phải gom nhóm cả `order_num`.

> **Nói một cách ngắn gọn: các cột trong `SELECT` hoặc là đều phải được gom nhóm (nằm trong `GROUP BY` / hàm tổng hợp), hoặc là đều không gom nhóm.**

### Xác định những đơn hàng nào đã mua sản phẩm có prod_id là BR01 (2)

Bảng `OrderItems` đại diện cho bảng thông tin sản phẩm đơn hàng, `prod_id` là ID sản phẩm; bảng `Orders` đại diện cho bảng đơn hàng có `cust_id` đại diện cho ID khách hàng và ngày đặt hàng `order_date`.

Bảng `OrderItems`:

| prod_id | order_num |
| ------- | --------- |
| BR01    | a0001     |
| BR01    | a0002     |
| BR02    | a0003     |
| BR02    | a0013     |

Bảng `Orders`:

| order_num | cust_id | order_date          |
| --------- | ------- | ------------------- |
| a0001     | cust10  | 2022-01-01 00:00:00 |
| a0002     | cust1   | 2022-01-01 00:01:00 |
| a0003     | cust1   | 2022-01-02 00:00:00 |
| a0013     | cust2   | 2022-01-01 00:20:00 |

【Câu hỏi】

Viết câu lệnh SQL sử dụng subquery để xác định những đơn hàng nào (trong `OrderItems`) đã mua sản phẩm có `prod_id` là "BR01", sau đó từ bảng `Orders` trả về ID khách hàng (`cust_id`) và ngày đặt hàng (`order_date`) tương ứng cho mỗi sản phẩm, sắp xếp kết quả tăng dần theo ngày đặt hàng.

Gợi ý: Lần này hãy sử dụng phép nối (JOIN) và cú pháp nối bằng đơn giản.

```sql
# Cách 1: Subquery
SELECT cust_id, order_date
FROM Orders
WHERE order_num IN (SELECT order_num
    FROM OrderItems
    WHERE prod_id = 'BR01')
ORDER BY order_date

# Cách 2: Nối bảng inner join
SELECT cust_id, order_date
FROM Orders o INNER JOIN
  (SELECT order_num
    FROM OrderItems
    WHERE prod_id = 'BR01') tb ON o.order_num = tb.order_num
ORDER BY order_date

# Cách 3: Phiên bản rút gọn của Cách 2
SELECT cust_id, order_date
FROM Orders
INNER JOIN OrderItems USING(order_num)
WHERE OrderItems.prod_id = 'BR01'
ORDER BY order_date
```

### Trả về email của tất cả khách hàng đã mua sản phẩm có prod_id là BR01 (2)

Cho bảng `OrderItems` đại diện cho bảng thông tin sản phẩm đơn hàng, `prod_id` là ID sản phẩm; bảng `Orders` đại diện cho bảng đơn hàng có `cust_id` đại diện cho ID khách hàng và ngày đặt hàng `order_date`; bảng `Customers` chứa email khách hàng `cust_email` và ID khách hàng `cust_id`.

Bảng `OrderItems`:

| prod_id | order_num |
| ------- | --------- |
| BR01    | a0001     |
| BR01    | a0002     |
| BR02    | a0003     |
| BR02    | a0013     |

Bảng `Orders`:

| order_num | cust_id | order_date          |
| --------- | ------- | ------------------- |
| a0001     | cust10  | 2022-01-01 00:00:00 |
| a0002     | cust1   | 2022-01-01 00:01:00 |
| a0003     | cust1   | 2022-01-02 00:00:00 |
| a0013     | cust2   | 2022-01-01 00:20:00 |

Bảng `Customers` đại diện cho thông tin khách hàng, `cust_id` là ID khách hàng, `cust_email` là email khách hàng:

| cust_id | cust_email        |
| ------- | ----------------- |
| cust10  | <cust10@cust.com> |
| cust1   | <cust1@cust.com>  |
| cust2   | <cust2@cust.com>  |

【Câu hỏi】Trả về email (`cust_email` trong bảng `Customers`) của tất cả khách hàng đã mua sản phẩm có `prod_id` là BR01, kết quả không cần sắp xếp.

Gợi ý: Liên quan đến các câu lệnh `SELECT`, lớp trong cùng trả về `order_num` từ bảng `OrderItems`, lớp ở giữa trả về `cust_id` từ bảng `Customers` (lưu ý thực tế là từ bảng `Orders`), nhưng bắt buộc phải sử dụng cú pháp `INNER JOIN`.

```sql
SELECT cust_email
FROM Customers
INNER JOIN Orders using(cust_id)
INNER JOIN OrderItems using(order_num)
WHERE OrderItems.prod_id = 'BR01'
```

### Một cách khác để xác định khách hàng tốt nhất (2)

Bảng `OrderItems` đại diện cho thông tin đơn hàng; một cách khác để xác định khách hàng tốt nhất là xem họ đã chi bao nhiêu tiền. Bảng `OrderItems` có mã đơn hàng `order_num`, giá bán sản phẩm `item_price`, số lượng sản phẩm `quantity`.

| order_num | item_price | quantity |
| --------- | ---------- | -------- |
| a1        | 10         | 105      |
| a2        | 1          | 1100     |
| a2        | 1          | 200      |
| a4        | 2          | 1121     |
| a5        | 5          | 10       |
| a2        | 1          | 19       |
| a7        | 7          | 5        |

Bảng `Orders` chứa các trường: mã đơn hàng `order_num`, ID khách hàng `cust_id`:

| order_num | cust_id  |
| --------- | -------- |
| a1        | cust10   |
| a2        | cust1    |
| a3        | cust2    |
| a4        | cust22   |
| a5        | cust221  |
| a7        | cust2217 |

Bảng khách hàng `Customers` có các trường: ID khách hàng `cust_id`, tên khách hàng `cust_name`:

| cust_id  | cust_name |
| -------- | --------- |
| cust10   | andy      |
| cust1    | ben       |
| cust2    | tony      |
| cust22   | tom       |
| cust221  | an        |
| cust2217 | hex       |

【Câu hỏi】Viết câu lệnh SQL trả về tên khách hàng và tổng số tiền (`order_num` trong bảng `OrderItems`) có tổng giá trị đơn hàng không nhỏ hơn 1000.

Gợi ý: Cần tính tổng (`item_price` nhân với `quantity`). Sắp xếp kết quả theo tổng số tiền, vui lòng sử dụng cú pháp `INNER JOIN`.

```sql
SELECT cust_name, SUM(item_price * quantity) AS total_price
FROM Customers
INNER JOIN Orders USING(cust_id)
INNER JOIN OrderItems USING(order_num)
GROUP BY cust_name
HAVING total_price >= 1000
ORDER BY total_price
```

## Tạo các phép nối nâng cao

### Truy xuất tên của từng khách hàng và tất cả mã đơn hàng (1)

Bảng `Customers` đại diện cho thông tin khách hàng, chứa ID khách hàng `cust_id` và tên khách hàng `cust_name`:

| cust_id  | cust_name |
| -------- | --------- |
| cust10   | andy      |
| cust1    | ben       |
| cust2    | tony      |
| cust22   | tom       |
| cust221  | an        |
| cust2217 | hex       |

Bảng `Orders` đại diện cho thông tin đơn hàng, chứa mã đơn hàng `order_num` và ID khách hàng `cust_id`:

| order_num | cust_id  |
| --------- | -------- |
| a1        | cust10   |
| a2        | cust1    |
| a3        | cust2    |
| a4        | cust22   |
| a5        | cust221  |
| a7        | cust2217 |

【Câu hỏi】Viết câu lệnh SQL sử dụng `INNER JOIN` để truy xuất tên của từng khách hàng (`cust_name` trong bảng `Customers`) và tất cả mã đơn hàng (`order_num` trong bảng `Orders`), cuối cùng trả về kết quả sắp xếp tăng dần theo tên khách hàng `cust_name`.

```sql
SELECT cust_name, order_num
FROM Customers
INNER JOIN Orders
USING(cust_id)
ORDER BY cust_name
```

### Truy xuất tên của từng khách hàng và tất cả mã đơn hàng (2)

Bảng `Orders` đại diện cho thông tin đơn hàng, chứa mã đơn hàng `order_num` và ID khách hàng `cust_id`:

| order_num | cust_id  |
| --------- | -------- |
| a1        | cust10   |
| a2        | cust1    |
| a3        | cust2    |
| a4        | cust22   |
| a5        | cust221  |
| a7        | cust2217 |

Bảng `Customers` đại diện cho thông tin khách hàng, chứa ID khách hàng `cust_id` và tên khách hàng `cust_name`:

| cust_id  | cust_name |
| -------- | --------- |
| cust10   | andy      |
| cust1    | ben       |
| cust2    | tony      |
| cust22   | tom       |
| cust221  | an        |
| cust2217 | hex       |
| cust40   | ace       |

【Câu hỏi】Truy xuất tên của từng khách hàng (`cust_name` trong bảng `Customers`) và tất cả mã đơn hàng (`order_num` trong bảng `Orders`), liệt kê tất cả khách hàng ngay cả khi họ chưa từng đặt đơn hàng nào. Cuối cùng trả về kết quả sắp xếp tăng dần theo tên khách hàng `cust_name`.

```sql
SELECT cust_name, order_num
FROM Customers
LEFT JOIN Orders
USING(cust_id)
ORDER BY cust_name
```

### Trả về tên sản phẩm và mã đơn hàng liên quan

Bảng `Products` là bảng thông tin sản phẩm chứa các trường: ID sản phẩm `prod_id`, tên sản phẩm `prod_name`:

| prod_id | prod_name |
| ------- | --------- |
| a0001   | egg       |
| a0002   | sockets   |
| a0013   | coffee    |
| a0003   | cola      |
| a0023   | soda      |

Bảng `OrderItems` là bảng thông tin đơn hàng chứa các trường: mã đơn hàng `order_num` và ID sản phẩm `prod_id`:

| prod_id | order_num |
| ------- | --------- |
| a0001   | a105      |
| a0002   | a1100     |
| a0002   | a200      |
| a0013   | a1121     |
| a0003   | a10       |
| a0003   | a19       |
| a0003   | a5        |

【Câu hỏi】Sử dụng outer join (`left join`, `right join`, `full join`) để nối bảng `Products` và bảng `OrderItems`, trả về danh sách gồm tên sản phẩm (`prod_name`) và mã đơn hàng liên quan (`order_num`), đồng thời sắp xếp tăng dần theo tên sản phẩm.

```sql
SELECT prod_name, order_num
FROM Products
LEFT JOIN OrderItems
USING(prod_id)
ORDER BY prod_name
```

### Trả về tên sản phẩm và tổng số đơn hàng của từng mặt hàng sản phẩm

Bảng `Products` là bảng thông tin sản phẩm chứa các trường: ID sản phẩm `prod_id`, tên sản phẩm `prod_name`:

| prod_id | prod_name |
| ------- | --------- |
| a0001   | egg       |
| a0002   | sockets   |
| a0013   | coffee    |
| a0003   | cola      |
| a0023   | soda      |

Bảng `OrderItems` là bảng thông tin đơn hàng chứa các trường: mã đơn hàng `order_num` và ID sản phẩm `prod_id`:

| prod_id | order_num |
| ------- | --------- |
| a0001   | a105      |
| a0002   | a1100     |
| a0002   | a200      |
| a0013   | a1121     |
| a0003   | a10       |
| a0003   | a19       |
| a0003   | a5        |

【Câu hỏi】

Sử dụng `OUTER JOIN` để nối bảng `Products` và bảng `OrderItems`, trả về tên sản phẩm (`prod_name`) và tổng số đơn hàng của từng mặt hàng sản phẩm (không phải mã đơn hàng), sắp xếp tăng dần theo tên sản phẩm.

```sql
SELECT prod_name, COUNT(order_num) AS orders
FROM Products
LEFT JOIN OrderItems
USING(prod_id)
GROUP BY prod_name
ORDER BY prod_name
```

### Liệt kê các nhà cung cấp và số lượng sản phẩm mà họ có thể cung cấp

Cho bảng `Vendors` chứa `vend_id` (ID nhà cung cấp):

| vend_id |
| ------- |
| a0002   |
| a0013   |
| a0003   |
| a0010   |

Cho bảng `Products` chứa `vend_id` (ID nhà cung cấp) và `prod_id` (ID sản phẩm cung cấp):

| vend_id | prod_id              |
| ------- | -------------------- |
| a0001   | egg                  |
| a0002   | prod_id_iphone       |
| a00113  | prod_id_tea          |
| a0003   | prod_id_vivo phone   |
| a0010   | prod_id_huawei phone |

【Câu hỏi】Liệt kê các nhà cung cấp (`vend_id` trong bảng `Vendors`) và số lượng sản phẩm họ có thể cung cấp, bao gồm cả những nhà cung cấp không có sản phẩm nào. Bạn cần sử dụng `OUTER JOIN` và hàm tổng hợp `COUNT()` để tính số lượng từng loại sản phẩm trong bảng `Products`, cuối cùng sắp xếp tăng dần theo `vend_id`.

Lưu ý: Cột `vend_id` xuất hiện trong nhiều bảng, vì vậy mỗi lần tham chiếu đến nó cần chỉ định đầy đủ tên bảng (fully qualify).

```sql
SELECT v.vend_id, COUNT(prod_id) AS prod_id
FROM Vendors v
LEFT JOIN Products p
USING(vend_id)
GROUP BY v.vend_id
ORDER BY v.vend_id
```

## Truy vấn kết hợp (UNION)

Toán tử `UNION` kết hợp kết quả của hai hoặc nhiều câu truy vấn lại và tạo ra một tập kết quả chứa các dòng được trích xuất từ các câu truy vấn tham gia trong `UNION`.

Các quy tắc cơ bản của `UNION`:

- Số lượng cột và thứ tự các cột của tất cả các câu truy vấn phải giống nhau.
- Kiểu dữ liệu của các cột tương ứng trong mỗi câu truy vấn phải giống nhau hoặc tương thích với nhau.
- Thông thường tên cột trả về sẽ được lấy theo câu truy vấn đầu tiên.

Mặc định, toán tử `UNION` chỉ chọn ra các giá trị khác nhau (loại bỏ trùng lặp). Nếu cho phép giữ lại các giá trị trùng lặp, hãy sử dụng `UNION ALL`.

```sql
SELECT column_name(s) FROM table1
UNION ALL
SELECT column_name(s) FROM table2;
```

Tên cột trong tập kết quả của `UNION` luôn bằng tên cột trong câu lệnh `SELECT` đầu tiên của `UNION`.

`JOIN` vs `UNION`:

- Trong `JOIN`, các cột của các bảng được nối có thể khác nhau, nhưng trong `UNION`, số lượng cột và thứ tự cột của mọi truy vấn bắt buộc phải giống nhau.
- `UNION` xếp các dòng sau khi truy vấn lại với nhau (xếp theo chiều dọc), còn `JOIN` xếp các cột sau khi truy vấn lại với nhau (xếp theo chiều ngang), tức là nó tạo thành một tích Đề-các.

### Kết hợp hai câu lệnh SELECT lại với nhau (1)

Bảng `OrderItems` chứa thông tin sản phẩm đơn hàng, trường `prod_id` đại diện cho ID sản phẩm, `quantity` đại diện cho số lượng sản phẩm:

| prod_id | quantity |
| ------- | -------- |
| a0001   | 105      |
| a0002   | 100      |
| a0002   | 200      |
| a0013   | 1121     |
| a0003   | 10       |
| a0003   | 19       |
| a0003   | 5        |
| BNBG    | 10002    |

【Câu hỏi】Kết hợp hai câu lệnh `SELECT` lại với nhau để truy xuất ID sản phẩm (`prod_id`) và `quantity` từ bảng `OrderItems`. Trong đó, một câu lệnh `SELECT` lọc các dòng có số lượng bằng 100, câu lệnh `SELECT` còn lại lọc các sản phẩm có ID bắt đầu bằng `BNBG`, cuối cùng sắp xếp kết quả tăng dần theo ID sản phẩm.

```sql
SELECT prod_id, quantity
FROM OrderItems
WHERE quantity = 100
UNION
SELECT prod_id, quantity
FROM OrderItems
WHERE prod_id LIKE 'BNBG%'
ORDER BY prod_id;
```

> **Lưu ý**: Khi sử dụng `ORDER BY` trong truy vấn `UNION`, chỉ được dùng một lần sau câu lệnh `SELECT` cuối cùng, nó sẽ sắp xếp toàn bộ tập kết quả sau khi kết hợp.

### Kết hợp hai câu lệnh SELECT lại với nhau (2)

Bảng `OrderItems` chứa thông tin sản phẩm đơn hàng, trường `prod_id` đại diện cho ID sản phẩm, `quantity` đại diện cho số lượng sản phẩm.

| prod_id | quantity |
| ------- | -------- |
| a0001   | 105      |
| a0002   | 100      |
| a0002   | 200      |
| a0013   | 1121     |
| a0003   | 10       |
| a0003   | 19       |
| a0003   | 5        |
| BNBG    | 10002    |

【Câu hỏi】Kết hợp hai câu lệnh `SELECT` lại với nhau để truy xuất ID sản phẩm (`prod_id`) và `quantity` từ bảng `OrderItems`. Trong đó, một câu lệnh `SELECT` lọc các dòng có số lượng bằng 100, câu lệnh `SELECT` còn lại lọc các sản phẩm có ID bắt đầu bằng `BNBG`, cuối cùng sắp xếp kết quả tăng dần theo ID sản phẩm. Lưu ý: **Lần này chỉ được sử dụng một câu lệnh SELECT duy nhất.**

Đáp án:

Yêu cầu chỉ dùng một câu lệnh `SELECT`, vậy thì ta dùng `OR` chứ không dùng `UNION` nữa.

```sql
SELECT prod_id, quantity
FROM OrderItems
WHERE quantity = 100 OR prod_id LIKE 'BNBG%'
ORDER BY prod_id;
```

### Kết hợp tên sản phẩm trong bảng Products và tên khách hàng trong bảng Customers

Bảng `Products` chứa trường `prod_name` đại diện cho tên sản phẩm:

| prod_name |
| --------- |
| flower    |
| rice      |
| ring      |
| umbrella  |

Bảng `Customers` đại diện cho thông tin khách hàng, `cust_name` đại diện cho tên khách hàng:

| cust_name |
| --------- |
| andy      |
| ben       |
| tony      |
| tom       |
| an        |
| lee       |
| hex       |

【Câu hỏi】Viết câu lệnh SQL kết hợp tên sản phẩm (`prod_name`) trong bảng `Products` và tên khách hàng (`cust_name`) trong bảng `Customers` rồi trả về, sau đó sắp xếp kết quả tăng dần theo tên sản phẩm.

```sql
# Tên cột trong tập kết quả UNION luôn bằng tên cột trong câu lệnh SELECT đầu tiên của UNION.
SELECT prod_name
FROM Products
UNION
SELECT cust_name
FROM Customers
ORDER BY prod_name
```

### Kiểm tra câu lệnh SQL

Bảng `Customers` chứa các trường: tên khách hàng `cust_name`, thông tin liên hệ khách hàng `cust_contact`, bang của khách hàng `cust_state`, email khách hàng `cust_email`:

| cust_name | cust_contact | cust_state | cust_email        |
| --------- | ------------ | ---------- | ----------------- |
| cust10    | 8695192      | MI         | <cust10@cust.com> |
| cust1     | 8695193      | MI         | <cust1@cust.com>  |
| cust2     | 8695194      | IL         | <cust2@cust.com>  |

【Câu hỏi】Sửa lại câu SQL bị lỗi dưới đây

```sql
SELECT cust_name, cust_contact, cust_email
FROM Customers
WHERE cust_state = 'MI'
ORDER BY cust_name;
UNION
SELECT cust_name, cust_contact, cust_email
FROM Customers
WHERE cust_state = 'IL'ORDER BY cust_name;
```

Sau khi sửa:

```sql
SELECT cust_name, cust_contact, cust_email
FROM Customers
WHERE cust_state = 'MI'
UNION
SELECT cust_name, cust_contact, cust_email
FROM Customers
WHERE cust_state = 'IL'
ORDER BY cust_name;
```

Khi kết hợp truy vấn bằng `UNION`, chỉ được phép sử dụng một mệnh đề `ORDER BY` duy nhất, và nó phải nằm sau câu lệnh `SELECT` cuối cùng.

Hoặc dùng trực tiếp `OR` để làm:

```sql
SELECT cust_name, cust_contact, cust_email
FROM Customers
WHERE cust_state = 'MI' or cust_state = 'IL'
ORDER BY cust_name;
```
