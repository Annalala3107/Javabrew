---
title: "Tổng hợp câu hỏi phỏng vấn Bảng băm: Xung đột băm, Mở rộng dung lượng và Java HashMap"
description: "Tổng hợp câu hỏi phỏng vấn bảng băm, giải thích chi tiết hàm băm, xung đột băm, phương pháp nối chuỗi (chaining), phương pháp định địa chỉ mở (open addressing), hệ số tải, mở rộng dung lượng (resize), Java HashMap và các bài toán LeetCode tần suất cao."
category: Khoa học máy tính cơ bản
tag:
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: Bảng băm,HashMap,Hàm băm,Xung đột băm,Chaining,Open Addressing,Hệ số tải,Mở rộng dung lượng,Java Collections,Câu hỏi phỏng vấn cấu trúc dữ liệu
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/hash-table.md
---

Bảng băm (Hash Table, hay còn gọi là bảng tán xạ) có giá trị phỏng vấn rất lớn, bởi vì một đầu nó liên kết với việc tìm kiếm nhanh và đếm tần suất trong các bài toán thuật toán, đầu còn lại liên kết với `HashMap` trong Java, bộ nhớ đệm (cache), khử trùng lặp và định tuyến phân mảnh (sharding routing) trong các hệ thống phân tán.

Vấn đề cốt lõi mà người phỏng vấn muốn kiểm tra là: Làm thế nào để ánh xạ nhanh một key thành chỉ số mảng, đồng thời vẫn duy trì được hiệu suất truy vấn ở mức chấp nhận được khi xảy ra xung đột, mở rộng dung lượng và gặp phải dữ liệu đầu vào bất lợi.

Tổng quan nội dung bài viết:

1. Bảng băm là gì?
2. Bảng băm định vị chỉ số mảng từ key như thế nào?
3. Xung đột băm, hệ số tải và mở rộng dung lượng giải quyết những vấn đề gì?
4. Mối quan hệ giữa `HashMap` trong Java và bảng băm thông thường là gì?
5. Bảng băm được ứng dụng như thế nào trong các bài toán thuật toán và các tình huống kỹ thuật thực tế?

![Sơ đồ cấu trúc bảng băm ánh xạ key tới vị trí mảng thông qua hàm băm](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/hash-table-8efd5f49.png)

## Bảng băm là gì?

Bảng băm là một cấu trúc dữ liệu dùng để lưu trữ mối quan hệ ánh xạ khóa - giá trị (key-value). Những khái niệm mà chúng ta thường gọi là Map, Dictionary hay Associative Array về bản chất đều có thể được cài đặt bằng bảng băm.

Nếu key là các số nguyên liên tục, chẳng hạn mã số sinh viên vừa vặn từ `0` đến `999`, ta chỉ cần dùng mảng là có thể truy cập `O(1)` thông qua `students[id]`. Nhưng trong thực tế nghiệp vụ, key thường không ngăn nắp như vậy: chúng có thể là chuỗi ký tự, mã định danh người dùng (UUID), mã đơn hàng, URL, hoặc các đối tượng tùy chỉnh. Nhiệm vụ của bảng băm là chuyển đổi các key có kiểu dữ liệu và độ dài khác nhau này thành một số nguyên thông qua hàm băm (hash function), sau đó ánh xạ số nguyên này thành chỉ số mảng.

Có thể chia bảng băm thành 3 tầng để xem xét:

1. **Mảng**: Vị trí thực sự lưu trữ dữ liệu, thường được gọi là các thùng (bucket).
2. **Hàm băm**: Chịu trách nhiệm chuyển đổi key thành giá trị băm (hash value).
3. **Chiến lược giải quyết xung đột**: Quyết định cách tiếp tục lưu trữ các key khi có nhiều key cùng rơi vào một bucket.

Do đó, bảng băm không phải là "hoàn toàn không có quá trình tìm kiếm", mà là thông qua hàm băm để thu hẹp đáng kể phạm vi tìm kiếm: trong điều kiện lý tưởng, chỉ một thao tác định vị là tìm thấy bucket mục tiêu; khi xảy ra xung đột, chỉ cần thực hiện một số ít phép so sánh bên trong bucket đó.

## Tại sao cần bảng băm?

Giả sử cần xác định một URL đã được thu thập (crawled) hay chưa, cách trực tiếp nhất là lưu các URL đã duyệt vào một danh sách, mỗi khi có URL mới đến lại quét từ đầu đến cuối danh sách. Khi lượng dữ liệu còn nhỏ thì không thành vấn đề, nhưng nếu đã thu thập hàng triệu URL, việc quét tuyến tính mỗi lần sẽ khiến hiệu năng nhanh chóng sụp đổ.

Tư duy của bảng băm là dùng không gian để đổi lấy thời gian: cấp phát thêm không gian mảng, dùng hàm băm phân tán các URL vào các bucket khác nhau. Khi truy vấn, thay vì duyệt toàn bộ danh sách URL từ đầu, hệ thống sẽ tính giá trị băm trước và nhảy thẳng tới vị trí bucket tương ứng để tìm kiếm.

Đây cũng là lý do tại sao bảng băm rất phù hợp cho việc tìm kiếm, đếm tần suất, khử trùng lặp và làm chỉ mục cache. Nó không quan tâm đến mối quan hệ lớn nhỏ giữa các phần tử, cũng không đảm bảo thứ tự; nó tập trung vào mục tiêu: "Với một key cho trước, liệu có thể tìm thấy value tương ứng càng nhanh càng tốt hay không".

## Hàm băm cần giải quyết vấn đề gì?

Mục tiêu của hàm băm không phải là làm cho key trở nên bí ẩn, mà là cố gắng phân tán các key vào mảng một cách đồng đều nhất có thể. Một hàm băm tốt thường phải thỏa mãn 3 yêu cầu:

| Yêu cầu | Ý nghĩa |
| ------- | ------- |
| Ổn định (Deterministic) | Cùng một key sau nhiều lần tính toán phải luôn cho ra giá trị băm giống nhau |
| Tính toán nhanh | Bản thân hàm băm không được quá chậm, nếu không sẽ triệt tiêu lợi thế hiệu năng của bảng băm |
| Phân bố càng đều càng tốt | Các key khác nhau cố gắng rơi vào các vị trí khác nhau để giảm thiểu xung đột băm |

Cần lưu ý rằng hàm băm trong bảng băm thông thường và hàm băm mật mã học (cryptographic hash) là hai khái niệm khác nhau. Bảng băm quan tâm nhiều hơn đến tốc độ và chất lượng phân bố đồng đều; hàm băm mật mã học lại chú trọng đến tính kháng va chạm (collision resistance), chống giả mạo và các đặc tính an toàn bảo mật.

Trong Java, khi dùng đối tượng tùy chỉnh làm key của `HashMap`, phương thức `hashCode()` và `equals()` phải phối hợp chuẩn xác: nếu hai đối tượng bằng nhau theo phép so sánh `equals()`, thì `hashCode()` của chúng bắt buộc phải giống nhau; nhưng hai đối tượng có `hashCode()` giống nhau không đồng nghĩa với việc chúng nhất định bằng nhau. Điểm này chính là một trong những nguồn gốc dẫn đến sự tồn tại của xung đột băm.

## Trọng tâm đánh giá trong phỏng vấn

- Hàm băm chịu trách nhiệm ánh xạ key thành chỉ số của mảng.
- Xung đột băm là không thể tránh khỏi hoàn toàn, chỉ có thể thiết kế các chiến lược để xử lý.
- Truy vấn, chèn và xóa trong bảng băm trung bình đạt `O(1)`, nhưng trường hợp xấu nhất có thể bị thoái hóa.
- `HashMap` trong Java sử dụng mảng + danh sách liên kết + cây đỏ-đen; từ JDK 8 trở đi, chuỗi liên kết quá dài sẽ được biến đổi thành cây (treeify).
- Bảng băm thường được sử dụng cho tìm kiếm nhanh, đếm tần suất, loại bỏ trùng lặp và chỉ mục cache.

## Bảng băm hoạt động như thế nào?

Lấy ví dụ thao tác chèn một cặp key-value, bảng băm thường thực hiện các bước sau:

1. Tính toán giá trị băm cho key.
2. Dựa vào độ dài của mảng để ánh xạ giá trị băm thành chỉ số mảng (index).
3. Nếu vị trí đó còn trống, đặt trực tiếp phần tử vào.
4. Nếu xảy ra xung đột, xử lý tiếp theo chiến lược giải quyết xung đột đã chọn.

```java
int index = hash(key) & (table.length - 1);
```

Khi dung lượng của `HashMap` là lũy thừa của 2, ta có thể dùng phép toán thao tác bit thay cho phép chia lấy dư (modulo). Phép toán bit thực thi nhanh hơn nhiều và rất thuận tiện cho việc tái phân phối phần tử sau khi mở rộng dung lượng.

Hàm `hash(key)` ở đây thường không sử dụng trực tiếp `hashCode()` nguyên bản của đối tượng, mà thực hiện thêm một phép làm nhiễu (perturbation), cho phép thông tin ở các bit bậc cao cùng tham gia vào việc tính toán chỉ số ở các bit bậc thấp. Nguyên do rất dễ hiểu: khi độ dài mảng là lũy thừa của 2, biểu diễn nhị phân của `length - 1` toàn là các bit 1 ở phía thấp, việc trực tiếp dùng phép `&` sẽ phụ thuộc hoàn toàn vào các bit thấp của giá trị băm. Nếu các bit thấp phân bố không đều, xung đột sẽ tập trung dày đặc.

## Xung đột băm được giải quyết như thế nào?

| Phương pháp | Ý tưởng | Ứng dụng điển hình | Điểm cần lưu ý |
| ----------- | ------- | ------------------ | -------------- |
| Nối chuỗi (Chaining) | Gắn thêm danh sách liên kết hoặc cây tại vị trí mảng | Java `HashMap` | Chuỗi liên kết quá dài sẽ làm chậm truy vấn |
| Định địa chỉ mở (Open Addressing) | Khi xung đột, tiếp tục dò tìm vị trí trống tiếp theo | Một số bảng băm hiệu năng cao | Việc xóa phần tử và kiểm soát hệ số tải phức tạp hơn |
| Tái băm (Rehashing) | Khi xung đột, đổi sang dùng một hàm băm khác | Thường thấy trong các phương án lý thuyết | Chi phí hiện thực và tính toán cao hơn |

`HashMap` trong Java chủ yếu sử dụng phương pháp nối chuỗi (chaining). Bắt đầu từ JDK 8, khi độ dài danh sách liên kết đạt ngưỡng quy định và dung lượng mảng đủ lớn, danh sách liên kết sẽ được chuyển đổi thành cây đỏ-đen, giúp giảm chi phí truy vấn trong các tình huống xung đột khắc nghiệt.

Ưu điểm của phương pháp nối chuỗi là cài đặt trực quan và thao tác xóa tương đối dễ dàng. Mỗi bucket trong mảng không chỉ chứa một phần tử duy nhất mà là điểm neo của một danh sách liên kết; các phần tử bị xung đột sẽ được nối tiếp vào danh sách này. Khi truy vấn, trước hết định vị bucket thông qua giá trị băm, sau đó duyệt danh sách liên kết hoặc cây trong bucket để so sánh key.

Ngược lại, phương pháp định địa chỉ mở không gắn thêm danh sách liên kết bên ngoài mà toàn bộ các phần tử đều nằm trực tiếp trong mảng. Khi xảy ra xung đột, nó sẽ dựa theo một quy tắc dò tìm nhất định để tìm vị trí khả dụng tiếp theo, chẳng hạn như dò tìm tuyến tính (linear probing), dò tìm bậc hai (quadratic probing), hoặc băm kép (double hashing). Lợi thế của nó là tính cục bộ của bộ nhớ (cache locality) thường tốt hơn, nhưng việc xóa phần tử, kiểm soát hệ số tải và xử lý hiện tượng tụ cụm (clustering) lại phức tạp hơn đáng kể.

## Hệ số tải và Mở rộng dung lượng

Hệ số tải (load factor) biểu thị mức độ đầy của bảng băm:

```text
Hệ số tải = Số lượng phần tử / Dung lượng mảng
```

Hệ số tải mặc định của `HashMap` là `0.75`. Khi số lượng phần tử vượt quá `capacity * loadFactor`, cơ chế mở rộng dung lượng (resize) sẽ được kích hoạt, dung lượng thường tăng gấp đôi so với ban đầu.

Quá trình mở rộng dung lượng sẽ phát sinh chi phí tái băm (rehash). Trong phỏng vấn, bạn có thể trả lời như sau: Một thao tác chèn đơn lẻ vào bảng băm trung bình đạt `O(1)`, tuy nhiên lần chèn kích hoạt mở rộng dung lượng sẽ phải di dời phần tử; xét trên phương diện chi phí phân bổ dần (amortized), nhiều lần chèn vẫn có thể xem là trung bình đạt `O(1)`.

Không nên chỉ đánh giá hệ số tải dựa trên "tỷ lệ tận dụng không gian". Hệ số tải càng cao, mảng càng đầy, tiết kiệm không gian hơn nhưng xác suất xung đột cũng tăng theo; hệ số tải càng thấp, xung đột ít hơn nhưng lại lãng phí nhiều vị trí bucket. Giá trị `0.75` là một sự đánh đổi kinh nghiệm được `HashMap` trong Java lựa chọn nhằm cân bằng giữa thời gian và không gian.

## Tại sao bảng băm trung bình đạt O(1)?

Độ phức tạp `O(1)` của bảng băm là chỉ trường hợp trung bình hoặc kỳ vọng toán học, không phải là sự đảm bảo tuyệt đối trong mọi tình huống dữ liệu đầu vào.

Khi hàm băm phân bố tương đối đồng đều và hệ số tải được kiểm soát hợp lý, các phần tử sẽ phân tán rải rác và số lượng phần tử trong mỗi bucket rất ít. Do đó, chi phí chính khi truy vấn chỉ bao gồm: tính giá trị băm, định vị chỉ số mảng, thực hiện một số ít phép so sánh trong bucket; những thao tác này có thể coi là diễn ra trong thời gian hằng số.

Tuy nhiên, nếu một lượng lớn key cùng rơi vào một bucket duy nhất, bảng băm sẽ bị thoái hóa. Khi dùng phương pháp nối chuỗi, danh sách liên kết trong bucket quá dài sẽ khiến truy vấn tiệm cận `O(n)`; `HashMap` từ JDK 8 trở đi sẽ biến đổi thành cây khi đủ điều kiện, kéo chi phí truy vấn trong bucket ở kịch bản xung đột cực đoan xuống mức `O(log n)`, nhưng điều đó không đồng nghĩa với việc bảng băm vĩnh viễn không chịu ảnh hưởng bởi xung đột.

## Mối quan hệ với Java HashMap

Các câu hỏi đào sâu thường gặp về `HashMap`:

- Tại sao dung lượng khởi tạo lại khuyến nghị đặt là lũy thừa của 2?
- Tại sao hệ số tải mặc định lại là `0.75`?
- Tại sao JDK 8 lại đưa vào cấu trúc cây đỏ-đen?
- Tại sao `HashMap` không an toàn luồng (thread-safe)?
- Sự khác biệt giữa `HashMap` và `ConcurrentHashMap` là gì?

Những câu hỏi này tuy đã vượt ra ngoài phạm vi cấu trúc dữ liệu thuần túy, nhưng nền tảng tầng dưới vẫn là bảng băm: mảng chịu trách nhiệm định vị, danh sách liên kết hoặc cây đỏ-đen chịu trách nhiệm giải quyết xung đột, và mở rộng dung lượng chịu trách nhiệm kiểm soát tải.

## Template các dạng bài thuật toán phổ biến

Bài toán Two Sum (Hai số có tổng bằng target):

```java
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int need = target - nums[i];
        if (map.containsKey(need)) {
            return new int[] {map.get(need), i};
        }
        map.put(nums[i], i);
    }
    return new int[] {-1, -1};
}
```

Đoạn mã này thể hiện rõ nét công dụng phổ biến nhất của bảng băm: dùng không gian đổi lấy thời gian, giảm độ phức tạp của một lần tìm kiếm từ `O(n)` xuống mức trung bình `O(1)`.

## Phân tích bài toán tiêu biểu: Mảng con có tổng bằng K

Bài toán [560. Mảng con có tổng bằng K (Subarray Sum Equals K)](https://leetcode.cn/problems/subarray-sum-equals-k/) rất thích hợp để nắm bắt kỹ thuật kết hợp "Tổng tiền tố (Prefix Sum) + Bảng băm". Đề bài yêu cầu đếm số lượng mảng con liên tục có tổng bằng `k`.

Nếu duyệt vét cạn hai đầu mút trái và phải, độ phức tạp sẽ là `O(n^2)`. Tiếp cận theo hướng khác: giả sử tổng tiền tố hiện tại là `sum`, ta muốn tìm một tổng tiền tố `prev` xuất hiện trước đó sao cho:

```text
sum - prev = k
```

tức là `prev = sum - k`. Do đó, chỉ cần dùng bảng băm ghi lại số lần xuất hiện của mỗi tổng tiền tố, khi duyệt tới vị trí hiện tại ta có thể biết ngay có bao nhiêu mảng con kết thúc tại vị trí này và có tổng bằng `k`.

```java
int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    count.put(0, 1);

    int sum = 0;
    int ans = 0;
    for (int num : nums) {
        sum += num;
        ans += count.getOrDefault(sum - k, 0);
        count.put(sum, count.getOrDefault(sum, 0) + 1);
    }
    return ans;
}
```

Dòng lệnh `count.put(0, 1)` ở đây cực kỳ quan trọng, nó đại diện cho việc tiền tố rỗng đã xuất hiện 1 lần. Nhờ vậy, khi tổng từ đầu mảng đến vị trí hiện tại vừa đúng bằng `k`, trường hợp đó cũng sẽ được tính vào kết quả.

Một điểm rất dễ mắc sai lầm khác là quy tắc "tra cứu trước rồi mới thêm vào sau". Nếu thêm `sum` hiện tại vào bảng băm trước rồi mới tra cứu `sum - k`, trong trường hợp `k = 0`, tổng tiền tố hiện tại có thể tự ghép đôi với chính nó, dẫn đến việc tính thừa kết quả.

Ví dụ với `nums = [1]`, `k = 0`. Quy tắc đúng "tra cứu trước rồi thêm sau" sẽ không tìm thấy mảng con không rỗng nào có tổng bằng 0; nhưng nếu thêm tổng tiền tố `1` vào trước rồi mới tra `sum - k = 1`, hệ thống sẽ bắt cặp tổng tiền tố hiện tại với chính nó và đếm thừa 1 lần không chính xác.

## Câu hỏi phỏng vấn đào sâu về Java HashMap

Chỉ trình bày khái niệm lý thuyết là chưa đủ, trong các buổi phỏng vấn Java backend, người phỏng vấn rất thường xuyên hỏi sâu về `HashMap`. Bạn có thể chuẩn bị theo các tầng nội dung sau:

| Câu hỏi đào sâu | Trọng tâm trả lời |
| --------------- | ----------------- |
| Tại sao dung lượng thường là lũy thừa của 2? | Thuận tiện cho việc định vị bằng phép toán bit `hash & (length - 1)`, đồng thời giúp di dời phần tử dễ dàng hơn khi mở rộng dung lượng |
| Tại sao hệ số tải mặc định là `0.75`? | Đạt được sự cân bằng giữa tỷ lệ tận dụng không gian và xác suất xung đột; quá nhỏ gây lãng phí bộ nhớ, quá lớn làm tăng xung đột |
| Tại sao JDK 8 đưa vào cây đỏ-đen? | Khi xung đột nghiêm trọng, việc tìm kiếm trên danh sách liên kết sẽ bị thoái hóa; việc chuyển sang cây giúp giảm chi phí tìm kiếm từ mức độ dài chuỗi xuống mức logarit |
| Tại sao `HashMap` không an toàn luồng? | Các thao tác ghi đồng thời từ nhiều luồng sẽ phá vỡ tính nhất quán của cấu trúc nội bộ, thao tác đọc ghi cũng không có bảo đảm về tính khả kiến (visibility) và loại trừ tương hỗ (mutual exclusion) |
| Cần lưu ý gì khi dùng đối tượng tùy chỉnh làm key? | `equals()` và `hashCode()` phải đồng nhất; các trường dữ liệu tham gia tính toán hash không được phép thay đổi sau khi đối tượng đã được đưa vào Map |

Trong buổi phỏng vấn, bạn không cần phải học thuộc lòng từng chi tiết mã nguồn, nhưng phải làm rõ một mạch logic xuyên suốt: định vị mảng, xử lý xung đột, di dời khi mở rộng dung lượng, tối ưu hóa xung đột cực đoan; 4 yếu tố này cùng nhau quyết định hiệu năng thực tế của `HashMap`.

## Các lỗi thường gặp

- Bảng băm trung bình đạt `O(1)` không đồng nghĩa với việc đạt `O(1)` trong mọi trường hợp.
- Khi sử dụng đối tượng tùy chỉnh làm key, bắt buộc phải override chính xác cả hai phương thức `equals()` và `hashCode()`.
- Các đối tượng có thể thay đổi trạng thái (mutable) không thích hợp để làm key của bảng băm.
- Khi thống kê tần suất với tập ký tự cố định và rất nhỏ, dùng mảng đếm sẽ hiệu quả hơn `HashMap`.
- Bảng băm giúp tăng tốc độ tìm kiếm vượt bậc nhưng sẽ tiêu tốn thêm không gian bộ nhớ.

## Tự kiểm tra câu hỏi tần suất cao

- Tại sao bảng băm có độ phức tạp truy vấn trung bình là `O(1)`? Trường hợp nào nó bị thoái hóa?
- Phương pháp nối chuỗi (chaining) và phương pháp định địa chỉ mở (open addressing) khác nhau như thế nào?
- Tại sao `HashMap` cần mở rộng dung lượng? Hiểu chi phí mở rộng dung lượng như thế nào cho đúng?
- Tại sao khi dùng đối tượng tùy chỉnh làm key lại phải đồng thời override cả `equals()` và `hashCode()`?
- Khi kết hợp tổng tiền tố và bảng băm, tại sao phải tuân thủ nguyên tắc "tra cứu trước rồi mới thêm vào sau"?

## Đề xuất bài tập luyện tập

- [1. Two Sum (Hai số có tổng bằng target)](https://leetcode.cn/problems/two-sum/)
- [242. Valid Anagram (Kiểm tra chuỗi đảo chữ)](https://leetcode.cn/problems/valid-anagram/)
- [49. Group Anagrams (Gom nhóm các chuỗi đảo chữ)](https://leetcode.cn/problems/group-anagrams/)
- [560. Subarray Sum Equals K (Mảng con có tổng bằng K)](https://leetcode.cn/problems/subarray-sum-equals-k/)
- [146. LRU Cache (Cài đặt bộ nhớ đệm LRU)](https://leetcode.cn/problems/lru-cache/)

## Tài liệu tham khảo

- [Algorithms, 4th Edition: Hash Tables](https://algs4.cs.princeton.edu/34hash/)
- [Java SE 21 API: HashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
- [Mã nguồn HashMap trên OpenJDK](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java)
- [Java SE 21 API: Object#hashCode](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#hashCode%28%29)
