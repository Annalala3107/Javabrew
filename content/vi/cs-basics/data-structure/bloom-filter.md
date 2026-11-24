---
title: "Tìm hiểu chi tiết về Bloom Filter (Nguyên lý, Triển khai, Kịch bản ứng dụng)"
description: Phân tích chuyên sâu về nguyên lý và đặc tính dương tính giả của Bloom Filter, kết hợp hàm băm và mảng bit, áp dụng cho khử trùng lặp dữ liệu lớn và phòng chống xuyên thủng bộ nhớ đệm (cache penetration).
category: Khoa học Máy tính
tag:
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: Bloom Filter,Bộ lọc Bloom,Tỷ lệ báo nhầm,Hàm băm,Mảng bit,Khử trùng lặp,Cache Penetration
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/bloom-filter.md
---

# Bloom Filter

Bloom Filter (bộ lọc Bloom) chắc hẳn là một khái niệm mà dù bạn chưa từng trực tiếp sử dụng thì cũng đã từng nghe nhắc tới.

Bloom Filter sinh ra chủ yếu để giải quyết bài toán kiểm tra sự tồn tại của phần tử trong các tập dữ liệu khổng lồ (massive data). Nó đặc biệt phù hợp cho các kịch bản cần xác định xem một dữ liệu nào đó có tồn tại trong khối dữ liệu khổng lồ hay không mà vẫn chấp nhận được một sai số nhỏ (chẳng hạn như chống xuyên thủng bộ nhớ đệm - cache penetration, khử trùng lặp dữ liệu quy mô lớn).

Tổng quan nội dung bài viết:

1. Bloom Filter là gì?
2. Giới thiệu nguyên lý hoạt động của Bloom Filter.
3. Kịch bản ứng dụng của Bloom Filter.
4. Tự tay lập trình triển khai Bloom Filter bằng Java.
5. Sử dụng Bloom Filter có sẵn trong thư viện mã nguồn mở Guava của Google.
6. Bloom Filter trong Redis.

## Bloom Filter là gì?

Trước hết, chúng ta cần nắm rõ khái niệm về Bloom Filter.

Bloom Filter (BF) là một cấu trúc dữ liệu do một tác giả tên là Burton Howard Bloom đề xuất vào năm 1970. Chúng ta có thể coi nó là một cấu trúc dữ liệu gồm hai thành phần: một vector nhị phân (hay mảng bit - bit array) và một tập hợp các hàm ánh xạ ngẫu nhiên (hàm băm - hash function). So với các cấu trúc dữ liệu quen thuộc như List, Map, Set, nó chiếm ít bộ nhớ hơn rất nhiều và có hiệu năng xử lý cực cao. Tuy nhiên, nhược điểm là kết quả trả về mang tính xác suất chứ không chính xác tuyệt đối 100%. Về mặt lý thuyết, số lượng phần tử đưa vào tập hợp càng nhiều thì xác suất báo nhầm (false positive - dương tính giả) càng lớn. Thêm vào đó, dữ liệu một khi đã lưu vào Bloom Filter thì rất khó để xóa bỏ.

Bloom Filter sử dụng một mảng bit tương đối lớn để lưu trữ trạng thái của toàn bộ dữ liệu. Mỗi phần tử trong mảng chỉ chiếm đúng 1 bit, và mỗi bit chỉ có thể mang giá trị 0 hoặc 1 (đại diện cho false hoặc true). Đây cũng chính là yếu tố cốt lõi giúp Bloom Filter tiết kiệm bộ nhớ vượt trội. Nếu tính toán như vậy, việc cấp phát một mảng bit cho 1.000.000 phần tử chỉ tốn: 1.000.000 Bit / 8 = 125.000 Byte = 125.000 / 1024 KB ≈ 122 KB dung lượng bộ nhớ.

![Cấu trúc mảng bit được Bloom Filter sử dụng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/bloom-filter-bit-table-b8f56b57.png)

Tóm lại: **Một nhà khoa học tên là Bloom đã đề xuất một cấu trúc dữ liệu dùng để truy vấn xem một phần tử có nằm trong một tập hợp dữ liệu lớn hay không. Cấu trúc dữ liệu này cực kỳ hiệu quả và có hiệu năng cao, nhưng nhược điểm là tồn tại một tỷ lệ nhận diện nhầm nhất định và rất khó xóa phần tử. Hơn nữa, về mặt lý thuyết, số lượng phần tử thêm vào tập hợp càng lớn thì khả năng báo nhầm càng tăng.**

## Giới thiệu nguyên lý hoạt động của Bloom Filter

**Khi một phần tử được thêm vào Bloom Filter, các thao tác sau sẽ diễn ra:**

1. Sử dụng các hàm băm trong Bloom Filter để tính toán giá trị của phần tử, thu được các giá trị băm (có bao nhiêu hàm băm thì thu được bấy nhiêu giá trị băm).
2. Dựa vào các giá trị băm nhận được, thiết lập giá trị tại các vị trí chỉ mục tương ứng trong mảng bit thành 1.

**Khi chúng ta cần kiểm tra xem một phần tử có tồn tại trong Bloom Filter hay không, các thao tác sau sẽ diễn ra:**

1. Tiến hành tính toán băm tương tự trên phần tử cần kiểm tra;
2. Kiểm tra các bit tương ứng với các giá trị băm này: nếu tồn tại dù chỉ một bit không bằng 1, chắc chắn phần tử này CHƯA TỪNG được thêm vào; nếu toàn bộ các bit đều bằng 1, điều này chỉ cho thấy phần tử đó CÓ THỂ đã được thêm vào, nghĩa là vẫn tồn tại nguy cơ dương tính giả (nhận diện nhầm).

Sơ đồ nguyên lý đơn giản của Bloom Filter như sau:

![Sơ đồ nguyên lý đơn giản của Bloom Filter](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/bloom-filter-simple-schematic-diagram-ecf8f3d1.png)

Như hình minh họa, khi một chuỗi ký tự được thêm vào Bloom Filter, chuỗi này trước tiên sẽ đi qua nhiều hàm băm để tạo ra các giá trị băm khác nhau, sau đó các vị trí tương ứng trong mảng bit sẽ được đặt thành 1 (khi mảng bit được khởi tạo, toàn bộ các vị trí đều bằng 0). Khi truy vấn lại chính chuỗi ký tự đó, các vị trí tương ứng đều sẽ bằng 1, vì vậy Bloom Filter sẽ trả về "có thể tồn tại"; việc nó có thực sự tồn tại hay không vẫn cần đối chiếu xác nhận lại với dữ liệu nghiệp vụ gốc.

Nếu cần xác định một chuỗi ký tự bất kỳ có nằm trong Bloom Filter hay không, chỉ cần thực hiện lại phép tính băm tương tự với chuỗi đó. Nếu bất kỳ vị trí tương ứng nào bằng 0, phần tử đó chắc chắn chưa từng được đưa vào; nếu tất cả các vị trí tương ứng đều là 1, phần tử đó có thể đã được đưa vào, hoặc cũng có thể là dương tính giả do các phần tử khác vô tình kết hợp cùng nhau tạo nên.

**Các chuỗi ký tự khác nhau hoàn toàn có thể bị băm ra các vị trí trùng lặp. Trong tình huống này, chúng ta có thể tăng kích thước mảng bit lên một cách hợp lý hoặc điều chỉnh lại các hàm băm.**

Tổng kết lại, chúng ta có thể rút ra quy luật: **Bloom Filter bảo một phần tử tồn tại thì có xác suất nhỏ là báo nhầm (dương tính giả). Nhưng Bloom Filter bảo một phần tử không tồn tại thì phần tử đó CHẮC CHẮN 100% không tồn tại.**

## Kịch bản ứng dụng của Bloom Filter

1. Kiểm tra dữ liệu cho trước có tồn tại hay không: ví dụ kiểm tra một con số có nằm trong tập hợp chứa hàng trăm triệu con số hay không; phòng chống xuyên thủng bộ nhớ đệm (Cache Penetration - kiểm tra dữ liệu yêu cầu có hợp lệ hay không để tránh trường hợp truy vấn đi thẳng xuống cơ sở dữ liệu làm sập hệ thống); bộ lọc thư rác (kiểm tra một địa chỉ email có nằm trong danh sách đen phát tán spam hay không); tính năng danh sách đen (kiểm tra một địa chỉ IP hay số điện thoại có nằm trong blacklist hay không),...
2. Khử trùng lặp (Deduplication): ví dụ khi thu thập dữ liệu web (web crawler), dùng để lọc bỏ các URL đã từng cào qua; khử trùng lặp các mã tài khoản, mã đơn hàng quy mô hàng tỷ bản ghi.

Các kịch bản khử trùng lặp cũng cần dùng đến thao tác kiểm tra sự tồn tại của dữ liệu, vì thế Bloom Filter sinh ra chủ yếu để giải quyết bài toán kiểm tra sự tồn tại trên tập dữ liệu quy mô lớn.

## Thực hành code

### Tự tay triển khai Bloom Filter bằng Java

Phía trên chúng ta đã tìm hiểu kỹ nguyên lý của Bloom Filter. Sau khi nắm được nguyên lý, bạn hoàn toàn có thể tự tay hiện thực một bản.

Nếu muốn tự triển khai, bạn cần chuẩn bị:

1. Một mảng bit với kích thước phù hợp để lưu trữ dữ liệu.
2. Một vài hàm băm độc lập khác nhau.
3. Phương thức thêm phần tử vào mảng bit (Bloom Filter).
4. Phương thức kiểm tra một phần tử cho trước có tồn tại trong mảng bit (Bloom Filter) hay không.

Dưới đây là một đoạn code mẫu hoàn chỉnh và trực quan (được cải tiến từ mã nguồn mở phổ biến, áp dụng được cho mọi loại đối tượng):

```java
import java.util.BitSet;

public class MyBloomFilter {

    /**
     * Kích thước của bit array
     */
    private static final int DEFAULT_SIZE = 2 << 24;
    /**
     * Mảng này được dùng để tạo 6 hàm băm khác nhau
     */
    private static final int[] SEEDS = new int[]{3, 13, 46, 71, 91, 134};

    /**
     * Bit array. Các phần tử trong mảng chỉ có thể là 0 hoặc 1
     */
    private BitSet bits = new BitSet(DEFAULT_SIZE);

    /**
     * Mảng chứa các đối tượng SimpleHash chứa hàm băm
     */
    private SimpleHash[] func = new SimpleHash[SEEDS.length];

    /**
     * Khởi tạo mảng chứa các đối tượng hàm băm, mỗi đối tượng có một seed băm khác nhau
     */
    public MyBloomFilter() {
        // Khởi tạo nhiều hàm băm khác nhau
        for (int i = 0; i < SEEDS.length; i++) {
            func[i] = new SimpleHash(DEFAULT_SIZE, SEEDS[i]);
        }
    }

    /**
     * Thêm phần tử vào bit array
     */
    public void add(Object value) {
        for (SimpleHash f : func) {
            bits.set(f.hash(value), true);
        }
    }

    /**
     * Kiểm tra phần tử chỉ định có tồn tại trong bit array hay không
     */
    public boolean contains(Object value) {
        boolean ret = true;
        for (SimpleHash f : func) {
            ret = bits.get(f.hash(value));
            if(!ret)
              return ret;
        }
        return ret;
    }

    /**
     * Static inner class dùng cho các thao tác băm
     */
    public static class SimpleHash {

        private int cap;
        private int seed;

        public SimpleHash(int cap, int seed) {
            this.cap = cap;
            this.seed = seed;
        }

        /**
         * Tính toán giá trị băm
         */
        public int hash(Object value) {
            int h;
            return (value == null) ? 0 : Math.abs((cap - 1) & seed * ((h = value.hashCode()) ^ (h >>> 16)));
        }

    }
}
```

Kiểm thử:

```java
String value1 = "https://javaguide.cn/";
String value2 = "https://github.com/Snailclimb";
MyBloomFilter filter = new MyBloomFilter();
System.out.println(filter.contains(value1));
System.out.println(filter.contains(value2));
filter.add(value1);
filter.add(value2);
System.out.println(filter.contains(value1));
System.out.println(filter.contains(value2));
```

Output:

```plain
false
false
true
true
```

Kiểm thử:

```java
Integer value1 = 13423;
Integer value2 = 22131;
MyBloomFilter filter = new MyBloomFilter();
System.out.println(filter.contains(value1));
System.out.println(filter.contains(value2));
filter.add(value1);
filter.add(value2);
System.out.println(filter.contains(value1));
System.out.println(filter.contains(value2));
```

Output:

```java
false
false
true
true
```

### Sử dụng Bloom Filter có sẵn trong thư viện mã nguồn mở Guava của Google

Mục đích của việc tự viết là để chúng ta hiểu sâu sắc bản chất nguyên lý hoạt động của Bloom Filter. Trong thực tế, triển khai Bloom Filter trong thư viện Guava của Google đã rất chuẩn mực và tối ưu, nên trong các dự án thực tế chúng ta không cần phải tự tay code lại.

Trước tiên, chúng ta cần khai báo dependency của Guava vào project. Khuyến nghị quản lý phiên bản tập trung qua cơ chế quản lý dependency của dự án và chọn phiên bản vẫn đang được hỗ trợ dựa trên [Guava Releases](https://github.com/google/guava/releases):

```xml
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>${guava.version}</version>
</dependency>
```

Cách dùng thực tế như sau:

Chúng ta tạo một Bloom Filter dự kiến chèn 1.500 số nguyên, với tỷ lệ báo nhầm (false positive rate) mục tiêu là 1% (0.01). Con số 1.500 ở đây là dung lượng ước tính, chứ không phải giới hạn cứng làm bộ lọc mất hiệu lực ngay khi vượt ngưỡng.

```java
// Khởi tạo đối tượng BloomFilter
BloomFilter<Integer> filter = BloomFilter.create(
    Funnels.integerFunnel(),
    1500,
    0.01);
// Kiểm tra phần tử chỉ định có tồn tại hay không
System.out.println(filter.mightContain(1));
System.out.println(filter.mightContain(2));
// Thêm phần tử vào BloomFilter
filter.put(1);
filter.put(2);
System.out.println(filter.mightContain(1));
System.out.println(filter.mightContain(2));
```

Trong ví dụ này, `mightContain()` trả về `false` đồng nghĩa phần tử này chắc chắn chưa từng được chèn vào; trả về `true` chỉ thể hiện phần tử đó có thể đã được chèn vào. Tham số `0.01` biểu thị rằng khi ước tính dung lượng và các giả định thực thi được thỏa mãn, xác suất dương tính giả mục tiêu khi truy vấn một phần tử chưa từng chèn là khoảng 1%. Không thể suy diễn ngược lại rằng "khi trả về true thì có 99% xác suất nó chắc chắn tồn tại".

**Bloom Filter của Guava được lưu trữ trong bộ nhớ tiến trình (JVM memory) hiện tại, sử dụng đơn giản, thích hợp cho mô hình đơn tiến trình hoặc các kịch bản không yêu cầu chia sẻ trạng thái giữa nhiều node. Nếu nhiều node cần chia sẻ chung một bộ lọc, bạn nên cân nhắc các giải pháp tập trung như RedisBloom.**

## Bloom Filter trong Redis

### Giới thiệu

RedisBloom cung cấp các cấu trúc dữ liệu xác suất như Bloom Filter, Cuckoo Filter,... Từ phiên bản Redis 8 trở đi, các tính năng này đã được tích hợp sẵn trực tiếp trong Redis Open Source mà không cần cài đặt image của bên thứ ba `rebloom` như trước đây nữa. Bạn có thể tham khảo cú pháp lệnh và hỗ trợ thư viện client chi tiết tại [Tài liệu chính thức về Redis Bloom Filter](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/).

### Cài đặt thông qua Docker

Có thể khởi chạy Redis 8 qua Docker để trải nghiệm nhanh. Trong các dự án thực tế, khuyến nghị ghim cố định một phiên bản cụ thể đã qua kiểm thử, tránh phụ thuộc vào tag `latest`:

```bash
docker run -d --name redis -p 6379:6379 redis:8
docker exec -it redis redis-cli
```

Đối với việc cài đặt và lựa chọn phiên bản trên môi trường production, vui lòng tham khảo [Tài liệu cài đặt Redis Open Source](https://redis.io/docs/latest/operate/oss_and_stack/).

### Bảng lệnh thông dụng

> Lưu ý: `key`: tên của Bloom Filter, `item`: phần tử cần thêm.

1. `BF.ADD`: Thêm một phần tử vào Bloom Filter, nếu bộ lọc chưa tồn tại thì lệnh này sẽ tự động tạo mới. Cú pháp: `BF.ADD {key} {item}`.
2. `BF.MADD`: Thêm một hoặc nhiều phần tử vào Bloom Filter, đồng thời tạo mới bộ lọc nếu chưa tồn tại. Cách hoạt động tương tự `BF.ADD`, điểm khác là nó cho phép nhập nhiều giá trị đầu vào và trả về nhiều kết quả. Cú pháp: `BF.MADD {key} {item} [item ...]`.
3. `BF.EXISTS`: Kiểm tra xem một phần tử có tồn tại trong Bloom Filter hay không. Cú pháp: `BF.EXISTS {key} {item}`.
4. `BF.MEXISTS`: Kiểm tra xem một hoặc nhiều phần tử có tồn tại trong Bloom Filter hay không. Cú pháp: `BF.MEXISTS {key} {item} [item ...]`.

Ngoài ra, lệnh `BF.RESERVE` cần được giới thiệu riêng:

Cú pháp của lệnh như sau:

`BF.RESERVE {key} {error_rate} {capacity} [EXPANSION expansion]`.

Giải thích ngắn gọn ý nghĩa của từng tham số:

1. `key`: Tên của Bloom Filter.
2. `error_rate`: Tỷ lệ báo nhầm kỳ vọng. Giá trị này phải nằm trong khoảng từ 0 đến 1. Ví dụ: đối với tỷ lệ báo nhầm mong muốn là 0.1% (1 trên 1000), `error_rate` nên đặt là 0.001. Con số này càng tiến gần về 0 thì bộ nhớ tiêu thụ cho mỗi item càng lớn và mức chiếm dụng CPU cho mỗi thao tác càng cao.
3. `capacity`: Số lượng phần tử dự kiến sẽ chèn vào. Với bộ lọc có thể mở rộng (scalable), khi vượt quá dung lượng này hệ thống sẽ tạo các bộ lọc con (sub-filter), dẫn đến khi truy vấn phải duyệt qua nhiều bộ lọc con hơn; nếu sử dụng tùy chọn `NONSCALING` để tạo bộ lọc dung lượng cố định, việc tiếp tục chèn thêm sẽ làm cho tỷ lệ báo nhầm thực tế vượt quá ngưỡng cấu hình ban đầu.

Tham số tùy chọn:

- `expansion`: Nếu một bộ lọc con mới được tạo ra, kích thước của nó sẽ bằng kích thước bộ lọc hiện tại nhân với `expansion`. Giá trị mở rộng mặc định là 2. Điều này đồng nghĩa với việc mỗi bộ lọc con kế tiếp sẽ có kích thước gấp đôi bộ lọc con trước đó.

### Sử dụng thực tế

```shell
127.0.0.1:6379> BF.ADD myFilter java
(integer) 1
127.0.0.1:6379> BF.ADD myFilter javaguide
(integer) 1
127.0.0.1:6379> BF.EXISTS myFilter java
(integer) 1
127.0.0.1:6379> BF.EXISTS myFilter javaguide
(integer) 1
127.0.0.1:6379> BF.EXISTS myFilter github
(integer) 0
```

## Trọng tâm ôn luyện phỏng vấn

4 câu hỏi phỏng vấn phổ biến nhất về Bloom Filter là: tại sao nhanh, tại sao tiết kiệm dung lượng, tại sao lại báo nhầm, và tại sao khó xóa.

| Câu hỏi | Trọng tâm trả lời |
| --- | --- |
| Tại sao tiết kiệm bộ nhớ? | Dùng mảng bit và nhiều hàm băm để biểu diễn tập hợp, không lưu trữ phần tử dữ liệu gốc. |
| Tại sao lại báo nhầm? | Nhiều phần tử khác nhau có thể vô tình cùng đặt chung một tập hợp bit thành 1, khiến khi truy vấn ngỡ rằng phần tử mục tiêu đã tồn tại. |
| Có bị bỏ sót không (âm tính giả)? | Bloom Filter chuẩn chắc chắn không bao giờ đánh giá một phần tử đã từng thêm vào là không tồn tại (không có âm tính giả). |
| Tại sao khó xóa? | Một bit có thể được chia sẻ dùng chung bởi nhiều phần tử khác nhau; nếu đặt bit đó về 0 sẽ làm ảnh hưởng đến tính đúng đắn của các phần tử khác. |

Các kịch bản thực tế điển hình:

- Chống xuyên thủng bộ nhớ đệm (Cache Penetration): Sử dụng Bloom Filter để kiểm tra trước xem key có thể tồn tại hay không; nếu chắc chắn không tồn tại thì không cho truy vấn tiếp xuống cơ sở dữ liệu.
- Khử trùng lặp quy mô lớn: Ví dụ lọc trùng URL khi thu thập dữ liệu web, lọc danh sách đen IP/số điện thoại, lọc tin đã đọc trong hệ thống gợi ý.
- Kịch bản phân tán: Giải pháp Guava chạy đơn máy rất đơn giản, nhưng khi cần chia sẻ trạng thái bộ lọc giữa nhiều node độc lập thì thường ưu tiên chọn RedisBloom.

Khi trả lời phỏng vấn, hãy chủ động nêu thêm về giới hạn của nó: Bloom Filter chỉ thích hợp cho những bài toán "chấp nhận một lượng nhỏ sai số dương tính giả, nhưng tuyệt đối không chấp nhận bỏ sót âm tính giả". Nếu bài toán nghiệp vụ yêu cầu tính chính xác tuyệt đối 100% về sự tồn tại của dữ liệu, bạn không thể chỉ phụ thuộc vào Bloom Filter.

## Các câu hỏi truy vấn thường gặp

- Tỷ lệ báo nhầm có mối quan hệ như thế nào với kích thước mảng bit và số lượng hàm băm?
- Bloom Filter có thể xóa phần tử được không?
- Xuyên thủng bộ nhớ đệm (Cache Penetration), sụp đổ bộ nhớ đệm (Cache Breakdown), tuyết lở bộ nhớ đệm (Cache Avalanche) khác nhau như thế nào?
- Khi nào nên chọn Guava Bloom Filter và khi nào nên chọn RedisBloom?
- Điều gì sẽ xảy ra nếu ước tính sai dung lượng ban đầu của bộ lọc?
