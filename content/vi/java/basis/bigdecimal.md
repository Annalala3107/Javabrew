---
title: Giải thích chi tiết về BigDecimal
description: "Giải thích chi tiết cách sử dụng BigDecimal: khắc phục lỗi mất độ chính xác của số dấu phẩy động, nắm vững phép cộng trừ nhân chia, quy tắc làm tròn RoundingMode, phương thức so sánh compareTo, phù hợp cho tính toán tài chính và các bài toán đòi hỏi độ chính xác cao."
category: Java
tag:
  - Java cơ bản
lang: vi
sourceRef: zh-ref/java/basis/bigdecimal.md
head:
  - - meta
    - name: keywords
      content: BigDecimal,độ chính xác số thực,phép toán số thập phân,chế độ làm tròn RoundingMode,so sánh BigDecimal,tính toán tiền tệ,mất độ chính xác
---

Trong *Alibaba Java Coding Guidelines* (Sổ tay Lập trình Java của Alibaba) có đề cập: "Để tránh mất độ chính xác, có thể sử dụng `BigDecimal` để thực hiện các phép toán với số thực dấu phẩy động".

Phép toán số thực dấu phẩy động mà cũng có nguy cơ mất độ chính xác sao? Đúng là như vậy!

Mã ví dụ:

```java
float a = 2.0f - 1.9f;
float b = 1.8f - 1.7f;
System.out.println(a);// 0.100000024
System.out.println(b);// 0.099999905
System.out.println(a == b);// false
```

**Tại sao phép toán với số thực `float` hoặc `double` lại có nguy cơ mất độ chính xác?**

Điều này liên quan rất lớn đến cơ chế lưu trữ số thập phân của máy tính. Như chúng ta đã biết, máy tính sử dụng hệ nhị phân và độ rộng bit để biểu diễn một con số là hữu hạn. Nhiều số thập phân sau khi chuyển sang hệ nhị phân sẽ lặp vô hạn, chỉ có thể làm tròn thành số chữ số hữu hạn, do đó tồn tại nguy cơ mất độ chính xác. Tuy nhiên, những giá trị như `0.5` hay `0.25` có thể biểu diễn thành số nhị phân hữu hạn thì vẫn được lưu trữ chính xác.

Ví dụ, số `0.2` trong hệ thập phân không thể chuyển đổi chính xác thành số thập phân nhị phân:

```java
// Quá trình chuyển đổi 0.2 sang số nhị phân là liên tục nhân với 2 cho đến khi không còn phần thập phân nữa,
// Trong quá trình tính toán này, các phần nguyên thu được xếp từ trên xuống dưới chính là kết quả nhị phân.
0.2 * 2 = 0.4 -> 0
0.4 * 2 = 0.8 -> 0
0.8 * 2 = 1.6 -> 1
0.6 * 2 = 1.2 -> 1
0.2 * 2 = 0.4 -> 0 (bắt đầu lặp lại)
...
```

Về nội dung sâu hơn của số thực dấu phẩy động, bạn nên đọc thêm bài viết [Nền tảng hệ thống máy tính (4): Số thực dấu phẩy động](http://kaito-kidd.com/2018/08/08/computer-system-float-point/).

## Giới thiệu về `BigDecimal`

`BigDecimal` có thể biểu diễn chính xác số thập phân và cung cấp các phép toán cho phép chỉ định tường minh độ chính xác cũng như quy tắc làm tròn. Tuy nhiên, khi dùng `MathContext` với độ chính xác hữu hạn, thực hiện phép chia cần làm tròn, hoặc chuyển đổi kết quả sang `float`, `double`, việc làm tròn vẫn có thể xảy ra.

Thông thường, phần lớn các bài toán nghiệp vụ đòi hỏi kết quả tính toán số thập phân chính xác (ví dụ các bài toán liên quan đến tiền tệ) đều được thực hiện thông qua `BigDecimal`.

*Alibaba Java Coding Guidelines* có nhắc: **Khi kiểm tra bằng nhau giữa các số thực dấu phẩy động, kiểu dữ liệu nguyên thủy không được dùng `==` để so sánh, còn kiểu wrapper không được dùng `equals` để kiểm tra.**

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211213101646884-607e6238.png)

Nguyên nhân cụ thể chúng ta đã giải thích chi tiết ở trên, nên sẽ không nhắc lại ở đây nữa.

Muốn giải quyết vấn đề mất độ chính xác khi tính toán số thực dấu phẩy động, bạn có thể trực tiếp dùng `BigDecimal` để định nghĩa giá trị số thập phân rồi thực hiện các phép toán.

```java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("0.9");
BigDecimal c = new BigDecimal("0.8");

BigDecimal x = a.subtract(b);
BigDecimal y = b.subtract(c);

System.out.println(x.compareTo(y));// 0
```

## Các phương thức thường dùng của `BigDecimal`

### Khởi tạo

Khi sử dụng `BigDecimal`, để phòng tránh mất độ chính xác, khuyến nghị khởi tạo đối tượng bằng constructor `BigDecimal(String val)` hoặc phương thức static `BigDecimal.valueOf(double val)`.

*Alibaba Java Coding Guidelines* cũng có đề cập đến phần này, như hình dưới đây.

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211213102222601-69f48ecc.png)

### Cộng, trừ, nhân, chia

Phương thức `add` dùng để cộng hai đối tượng `BigDecimal`, phương thức `subtract` dùng để trừ hai đối tượng `BigDecimal`. Phương thức `multiply` dùng để nhân hai đối tượng `BigDecimal`, phương thức `divide` dùng để chia hai đối tượng `BigDecimal`.

```java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("0.9");
System.out.println(a.add(b));// 1.9
System.out.println(a.subtract(b));// 0.1
System.out.println(a.multiply(b));// 0.90
System.out.println(a.divide(b));// Không chia hết được, ném ra ngoại lệ ArithmeticException
System.out.println(a.divide(b, 2, RoundingMode.HALF_UP));// 1.11
```

Ở đây cần lưu ý rằng, nên chọn overload của `divide` tùy theo nghiệp vụ có cho phép làm tròn hay không. Khi yêu cầu kết quả chính xác tuyệt đối, có thể dùng phiên bản không chỉ định quy tắc làm tròn; nếu kết quả không thể biểu diễn chính xác thì sẽ ném `ArithmeticException`. Khi cho phép làm tròn, cần chỉ định tường minh `scale` và `roundingMode`. `RoundingMode.UNNECESSARY` được dùng để khẳng định kết quả không cần làm tròn; nếu thực tế bắt buộc phải làm tròn thì cũng sẽ ném `ArithmeticException`.

```java
public BigDecimal divide(BigDecimal divisor, int scale, RoundingMode roundingMode) {
    return divide(divisor, scale, roundingMode.oldMode);
}
```

Quy tắc làm tròn rất nhiều, ở đây liệt kê một vài loại:

```java
public enum RoundingMode {
   // 2.4 -> 3 , 1.6 -> 2
   // -1.6 -> -2 , -2.4 -> -3
   UP(BigDecimal.ROUND_UP),
   // 2.4 -> 2 , 1.6 -> 1
   // -1.6 -> -1 , -2.4 -> -2
   DOWN(BigDecimal.ROUND_DOWN),
   // 2.4 -> 3 , 1.6 -> 2
   // -1.6 -> -1 , -2.4 -> -2
   CEILING(BigDecimal.ROUND_CEILING),
   // 2.5 -> 2 , 1.6 -> 1
   // -1.6 -> -2 , -2.5 -> -3
   FLOOR(BigDecimal.ROUND_FLOOR),
   // 2.4 -> 2 , 1.6 -> 2
   // -1.6 -> -2 , -2.4 -> -2
   HALF_UP(BigDecimal.ROUND_HALF_UP),
   //......
}
```

### So sánh lớn nhỏ

`a.compareTo(b)`: Trả về `-1` biểu thị `a` nhỏ hơn `b`, `0` biểu thị `a` bằng `b`, `1` biểu thị `a` lớn hơn `b`.

```java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("0.9");
System.out.println(a.compareTo(b));// 1
```

### Giữ lại bao nhiêu chữ số thập phân

Thông qua phương thức `setScale` để thiết lập số chữ số thập phân muốn giữ lại và quy tắc làm tròn. Có khá nhiều quy tắc làm tròn, không cần phải học thuộc, IDEA sẽ tự động gợi ý.

```java
BigDecimal m = new BigDecimal("1.255433");
BigDecimal n = m.setScale(3,RoundingMode.HALF_DOWN);
System.out.println(n);// 1.255
```

## Vấn đề so sánh bằng nhau trong `BigDecimal`

Trong *Alibaba Java Coding Guidelines* có viết:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/image-20220714161315993-0fedb69e.png)

Ví dụ mã nguồn minh họa vấn đề xảy ra khi dùng phương thức `equals()` của `BigDecimal` để so sánh bằng nhau:

```java
BigDecimal a = new BigDecimal("1");
BigDecimal b = new BigDecimal("1.0");
System.out.println(a.equals(b));//false
```

Điều này là do phương thức `equals()` không chỉ so sánh độ lớn của giá trị (`value`) mà còn so sánh cả độ chính xác (`scale`), trong khi phương thức `compareTo()` khi so sánh sẽ bỏ qua `scale`.

`1.0` có `scale` là `1`, còn `1` có `scale` là `0`, vì vậy kết quả của `a.equals(b)` là `false`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/image-20220714164706390-456d97c3.png)

Phương thức `compareTo()` có thể so sánh giá trị của hai `BigDecimal`: nếu bằng nhau sẽ trả về `0`, nếu số thứ nhất lớn hơn số thứ hai sẽ trả về `1`, ngược lại trả về `-1`.

```java
BigDecimal a = new BigDecimal("1");
BigDecimal b = new BigDecimal("1.0");
System.out.println(a.compareTo(b));//0
```

## Chia sẻ lớp tiện ích `BigDecimal`

Trên mạng có một lớp tiện ích `BigDecimal` được sử dụng khá phổ biến, cung cấp nhiều phương thức static để đơn giản hóa các thao tác với `BigDecimal`.

Tôi đã cải tiến nhẹ lại nó và chia sẻ mã nguồn dưới đây:

```java
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Lớp tiện ích nhỏ giúp đơn giản hóa việc tính toán BigDecimal
 */
public class BigDecimalUtil {

    /**
     * Độ chính xác mặc định cho phép chia
     */
    private static final int DEF_DIV_SCALE = 10;

    private BigDecimalUtil() {
    }

    /**
     * Thực hiện phép cộng bằng BigDecimal; khi chuyển kết quả sang double vẫn có thể xảy ra làm tròn.
     *
     * @param v1 Số bị cộng
     * @param v2 Số cộng
     * @return Tổng của hai tham số
     */
    public static double add(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.add(b2).doubleValue();
    }

    /**
     * Thực hiện phép trừ bằng BigDecimal; khi chuyển kết quả sang double vẫn có thể xảy ra làm tròn.
     *
     * @param v1 Số bị trừ
     * @param v2 Số trừ
     * @return Hiệu của hai tham số
     */
    public static double subtract(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.subtract(b2).doubleValue();
    }

    /**
     * Thực hiện phép nhân bằng BigDecimal; khi chuyển kết quả sang double vẫn có thể xảy ra làm tròn.
     *
     * @param v1 Thừa số thứ nhất
     * @param v2 Thừa số thứ hai
     * @return Tích của hai tham số
     */
    public static double multiply(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.multiply(b2).doubleValue();
    }

    /**
     * Cung cấp phép chia chính xác (tương đối); khi xảy ra trường hợp không chia hết,
     * giữ chính xác đến 10 chữ số sau dấu thập phân, các chữ số sau làm tròn theo quy tắc HALF_EVEN (làm tròn về số chẵn gần nhất).
     *
     * @param v1 Số bị chia
     * @param v2 Số chia
     * @return Thương của hai tham số
     */
    public static double divide(double v1, double v2) {
        return divide(v1, v2, DEF_DIV_SCALE);
    }

    /**
     * Cung cấp phép chia chính xác (tương đối). Khi xảy ra trường hợp không chia hết,
     * độ chính xác được chỉ định bởi tham số scale, các chữ số sau làm tròn theo quy tắc HALF_EVEN (làm tròn về số chẵn gần nhất).
     *
     * @param v1    Số bị chia
     * @param v2    Số chia
     * @param scale Chỉ định số chữ số thập phân cần giữ lại sau dấu phẩy.
     * @return Thương của hai tham số
     */
    public static double divide(double v1, double v2, int scale) {
        if (scale < 0) {
            throw new IllegalArgumentException(
                    "The scale must be a positive integer or zero");
        }
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.divide(b2, scale, RoundingMode.HALF_EVEN).doubleValue();
    }

    /**
     * Xử lý làm tròn đến số chữ số thập phân chỉ định theo quy tắc HALF_EVEN.
     *
     * @param v     Số cần làm tròn theo HALF_EVEN
     * @param scale Số chữ số thập phân giữ lại sau dấu phẩy
     * @return Kết quả sau khi làm tròn theo HALF_EVEN
     */
    public static double round(double v, int scale) {
        if (scale < 0) {
            throw new IllegalArgumentException(
                    "The scale must be a positive integer or zero");
        }
        BigDecimal b = BigDecimal.valueOf(v);
        BigDecimal one = new BigDecimal("1");
        return b.divide(one, scale, RoundingMode.HALF_EVEN).doubleValue();
    }

    /**
     * Chuyển đổi sang float; có thể xảy ra làm tròn hoặc tràn số khi vượt quá độ chính xác hay phạm vi của float
     *
     * @param v Số cần chuyển đổi
     * @return Kết quả chuyển đổi
     */
    public static float convertToFloat(double v) {
        BigDecimal b = BigDecimal.valueOf(v);
        return b.floatValue();
    }

    /**
     * Chuyển đổi sang int không làm tròn; phần thập phân bị cắt bỏ, nếu vượt quá phạm vi sẽ mất các bit cao
     *
     * @param v Số cần chuyển đổi
     * @return Kết quả chuyển đổi
     */
    public static int convertsToInt(double v) {
        BigDecimal b = BigDecimal.valueOf(v);
        return b.intValue();
    }

    /**
     * Chuyển đổi sang long không làm tròn; phần thập phân bị cắt bỏ, nếu vượt quá phạm vi sẽ mất các bit cao
     *
     * @param v Số cần chuyển đổi
     * @return Kết quả chuyển đổi
     */
    public static long convertsToLong(double v) {
        BigDecimal b = BigDecimal.valueOf(v);
        return b.longValue();
    }

    /**
     * Trả về giá trị lớn hơn trong hai số
     *
     * @param v1 Số thứ nhất cần so sánh
     * @param v2 Số thứ hai cần so sánh
     * @return Giá trị lớn hơn trong hai số
     */
    public static double returnMax(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.max(b2).doubleValue();
    }

    /**
     * Trả về giá trị nhỏ hơn trong hai số
     *
     * @param v1 Số thứ nhất cần so sánh
     * @param v2 Số thứ hai cần so sánh
     * @return Giá trị nhỏ hơn trong hai số
     */
    public static double returnMin(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.min(b2).doubleValue();
    }

    /**
     * So sánh chính xác hai số
     *
     * @param v1 Số thứ nhất cần so sánh
     * @param v2 Số thứ hai cần so sánh
     * @return Trả về 0 nếu hai số bằng nhau, 1 nếu số thứ nhất lớn hơn số thứ hai, ngược lại trả về -1
     */
    public static int compareTo(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.compareTo(b2);
    }

}
```

Issue liên quan: [Đề xuất đặt quy tắc làm tròn là RoundingMode.HALF_EVEN (làm tròn về số chẵn gần nhất), #2129](https://github.com/Snailclimb/JavaGuide/issues/2129).

![RoundingMode.HALF_EVEN](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/RoundingMode.HALF_EVEN-105f4ff1.png)

## Tổng kết

Nhiều số thập phân không thể được biểu diễn chính xác bằng số lượng bit nhị phân hữu hạn, vì vậy việc tính toán bằng `float` hoặc `double` tiềm ẩn nguy cơ mất độ chính xác.

Tuy nhiên, Java cung cấp `BigDecimal` để thao tác với các số thực/thập phân. Bản cài đặt của `BigDecimal` tận dụng `BigInteger` (dùng để xử lý số nguyên lớn), điểm khác biệt là `BigDecimal` bổ sung thêm khái niệm số chữ số phần thập phân (`scale`).
