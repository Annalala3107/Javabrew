---
title: "Trong Java, tiền tệ nên dùng long hay BigDecimal?"
description: "Hướng dẫn lựa chọn kiểu dữ liệu cho tiền tệ trong Java: giải thích rõ kịch bản áp dụng giữa long lưu đơn vị tiền tệ nhỏ nhất và BigDecimal tính toán chính xác, cùng với làm tròn, tràn số (overflow), chuyển đổi đơn vị và thiết kế cột cơ sở dữ liệu."
category: Java
tag:
  - Java cơ bản
  - Tính toán tiền tệ Java
lang: vi
sourceRef: zh-ref/java/basis/money-long-vs-bigdecimal.md
head:
  - - meta
    - name: keywords
      content: kiểu dữ liệu tiền tệ Java,lưu tiền bằng long,Long lưu xu,tính toán tiền tệ BigDecimal,độ chính xác tiền tệ,làm tròn tiền tệ,DECIMAL,BIGINT
---

Trong phần bình luận của một bài viết thảo luận về kiểu dữ liệu cho trường tiền tệ, tôi thấy xuất hiện nhiều câu trả lời hoàn toàn trái ngược nhau: có người khăng khăng dùng `Long` để lưu theo đơn vị xu/phân, có người bảo các kịch bản như lãi suất hay tỷ giá phải dùng `BigDecimal`, lại có người nhắc tới việc truyền thẳng chuỗi (`String`) qua API.

Những quan điểm đó thực chất không nói về cùng một vấn đề. Dùng `Long` lưu theo đơn vị nhỏ nhất là nói về cách **lưu trữ** số tiền; lãi suất và tỷ giá dùng `BigDecimal` là nói về cách **tính toán** số tiền; còn truyền chuỗi qua API thường chỉ là định dạng **truyền tải dữ liệu**.

Số tiền đã xác định rõ đơn vị nhỏ nhất có thể lưu bằng `long`. Nếu trong quá trình tính toán cần giữ lại phần thập phân hoặc cần chỉ định rõ cách thức làm tròn thì dùng `BigDecimal`. Cả hai kiểu dữ liệu này hoàn toàn có thể cùng tồn tại trong một hệ thống.

Phương án `Long` được đề cập xuyên suốt bài viết này đều chỉ việc dùng số nguyên để lưu đơn vị tiền tệ nhỏ nhất. Trong mã Java khi tham gia tính toán thường sử dụng kiểu nguyên thủy `long`, chỉ khi cần biểu diễn giá trị rỗng (`null`) mới dùng lớp bao (`wrapper`) `Long`.

| Tiêu chí so sánh | `long` | `BigDecimal` |
| --- | --- | --- |
| Cách biểu diễn | Số nguyên theo đơn vị nhỏ nhất cố định | Số thập phân đi kèm `scale` |
| Ứng dụng phổ biến | Số tiền đơn hàng, số dư, số tiền ghi có đã xác định đơn vị nhỏ nhất | Tính chiết khấu, thuế phí, lãi suất, tỷ giá |
| Rủi ro chính | Nhầm lẫn đơn vị, tràn số âm thầm (silent overflow), khó mở rộng độ chính xác | Cách khởi tạo, quy tắc làm tròn, chênh lệch `scale` |
| Kiểu CSDL phổ biến | `BIGINT` | `DECIMAL(p, s)` |

## Vì sao tiền tệ không thể dùng `double`?

`double` và `float` lưu trữ số dấu phẩy động nhị phân. Nhiều số thập phân hữu hạn khi chuyển sang hệ nhị phân sẽ trở thành số thập phân vô hạn tuần hoàn, nên chỉ có thể lấy một giá trị xấp xỉ gần nhất có thể biểu diễn được.

```java
double a = 1.0;
double b = 0.9;

System.out.println(a - b);
// 0.09999999999999998

System.out.println(0.1 + 0.1 + 0.1);
// 0.30000000000000004
```

Sai số này không liên quan đến cách cài đặt của Java — bất kỳ ngôn ngữ nào sử dụng chuẩn số dấu phẩy động nhị phân IEEE 754 đều gặp phải. Tính toán tiền tệ thường đòi hỏi kết quả tuân thủ độ chính xác thập phân và quy tắc làm tròn rõ ràng, điều mà giá trị xấp xỉ rất khó đáp ứng.

`new BigDecimal(0.1)` có thể phơi bày trọn vẹn giá trị xấp xỉ đang được lưu bên trong `double`:

```java
System.out.println(new BigDecimal(0.1));
// 0.1000000000000000055511151231257827021181583404541015625
```

Đây cũng là lý do không bao giờ nên khởi tạo đối tượng tiền tệ từ `double`. Một giá trị đã phát sinh sai số rồi thì dù sau đó có chuyển sang `BigDecimal` cũng không thể tự động khôi phục lại đúng số thập phân ban đầu.

## Những loại số tiền nào phù hợp dùng `Long`?

Nếu nghiệp vụ quy định số tiền Nhân dân tệ (RMB) thống nhất chính xác đến đơn vị phân (cent, 1/100 tệ), thì `19.99` tệ có thể lưu thành `1999` phân. Phép cộng trừ đều thực hiện trên số nguyên nên không phát sinh sai số thập phân.

```java
long priceCents = 1_999L;
long shippingCents = 500L;
long totalCents = Math.addExact(priceCents, shippingCents);
```

`long` phù hợp với những giá trị đã hoàn tất làm tròn như số tiền đơn hàng, số dư tài khoản, số tiền thanh toán; trong cơ sở dữ liệu có thể dùng `BIGINT`.

Khi lưu vào cơ sở dữ liệu, tên cột tốt nhất nên kèm theo đơn vị để nhìn vào là thấy rõ ngay:

```sql
CREATE TABLE orders (
    id           BIGINT PRIMARY KEY,
    amount_cents BIGINT NOT NULL
);
```

Nếu chỉ đặt tên là `amount`, khi nhìn `amount = 100` thì không thể tự đoán được đó là 100 tệ hay 100 phân. Đổi thành `amount_cents = 100` sẽ loại bỏ hoàn toàn sự mơ hồ đó.

**Cần lưu ý gì khi dùng `long`?**

Khi lưu thống nhất số tiền theo đơn vị nhỏ nhất (cent/phân), độ chính xác cũng bị cố định ở mức hai chữ số thập phân. Các kết quả trung gian của tỷ giá, lãi suất, thuế phí hay tính cước theo lưu lượng có thể cần đến bốn, sáu hoặc thậm chí nhiều chữ số thập phân hơn — những phép tính này không thể ép dùng mãi đơn vị "cent/phân" để tính được.

Ngoài ra còn phải đề phòng tràn số (overflow). Các toán tử `+` và `*` thông thường khi tràn số sẽ không báo lỗi; mã nguồn xử lý tiền tệ có thể chuyển sang dùng `Math.addExact()`, `Math.subtractExact()` và `Math.multiplyExact()`:

```java
long subtotalCents = Math.multiplyExact(unitPriceCents, quantity);
long balanceCents = Math.subtractExact(currentBalanceCents, paymentCents);
```

Với phép nhân còn phải kiểm tra cả kết quả trung gian. Số tiền cuối cùng không vượt quá `Long.MAX_VALUE` không đồng nghĩa với việc một bước trung gian trong phép tính `đơn giá × số lượng × hệ số` sẽ không bị tràn số.

Hệ thống đa tiền tệ cũng không thể mặc định rằng mọi loại tiền đều có hai chữ số thập phân. Số tiền tối thiểu phải luôn đi kèm với mã tiền tệ (currency); số chữ số thập phân của đơn vị nhỏ nhất do loại tiền hoặc quy tắc nghiệp vụ quyết định, không thể suy luận từ một giá trị `long` đứng đơn lẻ.

## Những loại số tiền nào phù hợp dùng `BigDecimal`?

Chiết khấu, thuế phí, lãi suất và quy đổi tỷ giá thường xuyên tạo ra các kết quả trung gian nhỏ hơn đơn vị tiền tệ tối thiểu.

`BigDecimal` dùng số nguyên độ chính xác tùy ý kết hợp với `scale` để biểu diễn số thập phân, giúp giữ nguyên vẹn các giá trị trung gian này rồi mới làm tròn tại đúng vị trí mà nghiệp vụ quy định.

```java
BigDecimal price = new BigDecimal("19.99");
BigDecimal discountRate = new BigDecimal("0.95");

BigDecimal discountedPrice = price.multiply(discountRate);
// 18.9905
```

Hằng số tiền tệ luôn phải khởi tạo trực tiếp bằng chuỗi (`String`). Dữ liệu từ API truyền vào là chuỗi thì chuyển thẳng sang `BigDecimal`, cột CSDL là `DECIMAL` thì ánh xạ thẳng sang `BigDecimal`, tuyệt đối không chuyển qua trung gian `double`.

**Nếu `divide()` chia không hết thì xử lý thế nào?**

Khi đó cần chỉ định rõ số chữ số thập phân giữ lại và chế độ làm tròn (`RoundingMode`).

Đoạn mã dưới đây giữ lại 2 chữ số thập phân và dùng `HALF_UP` (làm tròn theo quy tắc >= 5 thì làm tròn lên). Nếu gọi thẳng `a.divide(b)` mà không chỉ định quy tắc làm tròn, chương trình sẽ ném ngoại lệ `ArithmeticException`.

```java
BigDecimal a = new BigDecimal("10");
BigDecimal b = new BigDecimal("3");

System.out.println(a.divide(b, 2, RoundingMode.HALF_UP)); // 3.33
```

Còn một điểm cần lưu ý: `BigDecimal` là lớp bất biến (immutable), nên kết quả phép tính phải được gán vào biến mới hoặc gán đè lại. Ở lần gọi `add()` đầu tiên dưới đây do không nhận giá trị trả về nên `amount` vẫn là `10.00`:

```java
BigDecimal amount = new BigDecimal("10.00");

amount.add(new BigDecimal("2.00"));
System.out.println(amount); // Vẫn là 10.00

amount = amount.add(new BigDecimal("2.00"));
System.out.println(amount); // 12.00
```

Khi so sánh độ lớn của số tiền, thông thường nên dùng `compareTo()`. Phương thức `equals()` còn so sánh cả `scale`, nên gọi `equals()` giữa `1.0` và `1.00` sẽ trả về `false`:

```java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("1.00");

System.out.println(a.equals(b));         // false
System.out.println(a.compareTo(b) == 0); // true
```

Sự khác biệt này cũng ảnh hưởng tới `HashMap` và `HashSet`. Nếu dùng `BigDecimal` làm khóa (key), tốt nhất nên chuẩn hóa `scale` trước, nếu không `1.0` và `1.00` sẽ bị coi là hai khóa khác nhau.

## Có thể kết hợp `Long` và `BigDecimal` với nhau không?

Hoàn toàn được. Lấy ví dụ sản phẩm có đơn giá `19.99` tệ, mua 3 sản phẩm, chiết khấu `0.95`: lúc tính toán dùng `BigDecimal`, sau đó mới chuyển số tiền thanh toán cuối cùng sang `long` tính theo đơn vị cent/phân:

```java
BigDecimal unitPrice = new BigDecimal("19.99");
BigDecimal discountRate = new BigDecimal("0.95");
long quantity = 3L;

BigDecimal payable = unitPrice
        .multiply(BigDecimal.valueOf(quantity))
        .multiply(discountRate)
        .setScale(2, RoundingMode.HALF_UP);

long payableCents = payable
        .movePointRight(2)
        .longValueExact();
```

Đoạn mã trên tính ra `payable` là `56.97`, `movePointRight(2)` dịch dấu phẩy để chuyển thành `5697`. `longValueExact()` chỉ chấp nhận số nguyên nằm trong phạm vi của `long`; chỉ cần vẫn còn phần thập phân khác 0 hoặc giá trị vượt ngưỡng, nó sẽ ném `ArithmeticException`.

Không được dùng trực tiếp `longValue()` để chuyển đổi tiền tệ vì nó sẽ cắt bỏ phần thập phân:

```java
long amount = new BigDecimal("19.99").longValue();
System.out.println(amount); // 19
```

Nếu số tiền đầu vào chỉ được phép có tối đa hai chữ số thập phân, bạn cũng có thể dùng `RoundingMode.UNNECESSARY` để kiểm tra tính hợp lệ:

```java
public static long toCentsExact(BigDecimal amount) {
    return amount
            .setScale(2, RoundingMode.UNNECESSARY)
            .movePointRight(2)
            .longValueExact();
}

public static BigDecimal fromCents(long cents) {
    return BigDecimal.valueOf(cents, 2);
}
```

`19.9` sẽ được bù thành `19.90`, còn `19.999` sẽ ném ngoại lệ ngay lập tức chứ không âm thầm cắt cụt hay tự ý làm tròn.

Nếu API thanh toán nhận đơn vị nhỏ nhất (cent/phân) thì truyền `5697`; nếu nhận chuỗi theo đơn vị lớn (tệ/đồng) thì truyền `payable.toPlainString()`. Hãy đặt mã chuyển đổi ở tầng adapter giao tiếp API, tránh chuyển đổi qua lại giữa các kiểu và đơn vị ngay giữa luồng tính toán nghiệp vụ.

## Cơ sở dữ liệu nên dùng `BIGINT` hay `DECIMAL`?

Trong Java dùng `long` lưu đơn vị nhỏ nhất thì cột CSDL thường dùng `BIGINT`; trong Java dùng `BigDecimal` thì cột CSDL thường dùng `DECIMAL(p, s)`.

```sql
CREATE TABLE settlement_detail (
    id               BIGINT PRIMARY KEY,
    payable_cents    BIGINT        NOT NULL,
    exchange_rate    DECIMAL(18, 8) NOT NULL,
    settlement_amount DECIMAL(18, 2) NOT NULL
);
```

MySQL xếp cả số nguyên và `DECIMAL` vào nhóm kiểu giá trị chính xác (exact-value types). Trong `DECIMAL(18, 2)`, `18` là tổng số chữ số có nghĩa, còn `2` là số chữ số phần thập phân; việc nó có đáp ứng đủ số tiền nghiệp vụ hay không cần tính ngược từ giá trị tối đa thực tế chứ không nên thấy cột tiền nào cũng áp cứng một độ chính xác duy nhất.

Đừng phụ thuộc vào việc MySQL tự động làm tròn khi ghi vào cột `DECIMAL`. Hãy gọi `setScale()` trong mã Java để làm tròn hoặc kiểm tra hợp lệ trước rồi mới ghi xuống CSDL, có như vậy giá trị lưu trữ và kết quả tính toán trong chương trình mới khớp nhau.

Cột tiền tệ có dùng `DEFAULT 0` hay không còn tùy thuộc vào ngữ nghĩa nghiệp vụ. Thiếu dữ liệu số tiền và số tiền bằng 0 không phải lúc nào cũng giống nhau; việc tùy tiện thêm giá trị mặc định có thể che giấu lỗi truyền thiếu dữ liệu. Ràng buộc `NOT NULL` thường nên giữ lại, còn giá trị mặc định cần do quy tắc miền nghiệp vụ (domain rules) quyết định.

## Tổng kết

Số tiền đã hoàn tất làm tròn và có đơn vị nhỏ nhất cố định thì phù hợp lưu bằng `long`; các phép tính cần giữ phần thập phân như chiết khấu, thuế phí, lãi suất và tỷ giá nên dùng `BigDecimal`. Khi làm tròn phải ghi rõ số chữ số giữ lại và `RoundingMode`.

Hai kiểu dữ liệu có thể kết hợp dùng chung. Giai đoạn tính toán giữ nguyên `BigDecimal`, sau khi xác định xong số tiền cuối cùng thì dịch dấu phẩy thập phân theo số chữ số của đơn vị nhỏ nhất rồi dùng `longValueExact()` chuyển thành số nguyên. Tên trường/cột cần ghi rõ đơn vị, phép toán số nguyên phải kiểm tra tràn số, và việc chuyển đổi kiểu lẫn đơn vị nên gom tập trung vào tầng adapter của API hoặc cơ sở dữ liệu.
