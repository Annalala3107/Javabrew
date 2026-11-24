---
title: "Tổng hợp câu hỏi phỏng vấn về Skip List: Multi-Level Indexing, Range Query và Redis ZSet"
description: Tổng hợp câu hỏi phỏng vấn Skip List, giải thích chỉ mục đa tầng (multi-level index), tìm kiếm, chèn, xóa, độ phức tạp, truy vấn theo khoảng (range query), so sánh với Red-Black Tree và kiến trúc tầng dưới của Redis ZSet.
category: Khoa học Máy tính
tag:
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: Skip List,Bảng nhảy,Redis ZSet,Sorted Set,Range Query,Multi-level Index,So sánh Red-Black Tree,Phỏng vấn Redis,Phỏng vấn Cấu trúc dữ liệu
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/skip-list.md
---

Skip List (danh sách nhảy) có thể hiểu đơn giản là một "danh sách liên kết có thứ tự đi kèm chỉ mục đa tầng (multi-level index)". Một danh sách liên kết có thứ tự thông thường cần duyệt từ đầu đến cuối khi truy vấn, dẫn đến độ phức tạp thời gian là `O(n)`. Skip List bổ sung thêm nhiều tầng chỉ mục phía trên danh sách liên kết; khi tìm kiếm, nó có thể bỏ qua nhanh một loạt các node từ các tầng chỉ mục cao rồi hạ dần từng tầng xuống dưới.

Cấu trúc Sorted Set (ZSet) của Redis sử dụng sự kết hợp giữa Skip List và Hash Table ở tầng dưới cùng, do đó Skip List thường xuyên xuất hiện song hành cùng Redis trong các buổi phỏng vấn backend.

Tổng quan nội dung bài viết:

1. Skip List là gì?
2. Tại sao Skip List có thể giảm thời gian tìm kiếm từ `O(n)` xuống mức trung bình `O(logn)`?
3. Skip List thực hiện tìm kiếm, chèn và xóa như thế nào?
4. Nên so sánh Skip List với Red-Black Tree như thế nào?
5. Tại sao Redis ZSet lại sử dụng Skip List?

![Skip List xây dựng chỉ mục đa tầng trên danh sách liên kết có thứ tự để tăng tốc tìm kiếm](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/skip-list-60942a9b.png)

## Skip List là gì?

Skip List là một cấu trúc dữ liệu dựa trên danh sách liên kết có thứ tự. Tầng dưới cùng của nó vẫn là một danh sách liên kết hoàn chỉnh chứa tất cả các phần tử; phía trên danh sách liên kết đáy này, Skip List xây dựng thêm một số tầng chỉ mục thưa thớt hơn.

Bạn có thể hình dung nó giống như mục lục của một cuốn sách:

- Tầng danh sách liên kết dưới cùng giống như các trang nội dung chính: thông tin đầy đủ nhất, nhưng lật từng trang từ đầu đến cuối thì rất chậm.
- Các tầng chỉ mục phía trên giống như mục lục sách: ít thông tin hơn, nhưng giúp bạn nhảy nhanh đến vị trí gần mục tiêu.
- Khi truy vấn, bắt đầu nhảy sang phải từ tầng chỉ mục cao nhất; khi không thể tiến sang phải được nữa thì hạ xuống một tầng, lặp lại cho đến tầng đáy.

Khác biệt lớn nhất giữa Skip List và danh sách liên kết thông thường nằm ở điểm này: danh sách liên kết thông thường mỗi lần chỉ có thể bước tới một bước; Skip List có thể nhảy qua nhiều node cùng lúc trên các tầng chỉ mục cao.

## Node của Skip List trông như thế nào?

Node của danh sách liên kết thông thường thường chỉ có một con trỏ `next`, trong khi node của Skip List lại sở hữu nhiều con trỏ tiến (forward pointers). Một node nếu xuất hiện ở tầng 3 đồng nghĩa với việc nó đều có các con trỏ tương ứng ở các tầng 0, 1 và 2.

Về mặt trừu tượng, node của Skip List có thể được mô tả như sau:

```java
class SkipListNode {
    int value;
    SkipListNode[] forward;
}
```

Ở đây, `forward[i]` biểu thị node tiếp theo mà node hiện tại trỏ tới ở tầng `i`. Trong triển khai thực tế của các hệ thống phần mềm, node còn có thể lưu thêm các thông tin như score, member, con trỏ lùi (backward pointer), span (bước nhảy),... nhằm hỗ trợ xếp hạng (rank), duyệt ngược và truy vấn theo khoảng.

## Số tầng được tạo ra như thế nào?

Skip List không duy trì trạng thái cân bằng bằng cách quay cây hay đổi màu node như cây cân bằng, mà nó dựa vào số tầng ngẫu nhiên (randomized levels).

Khi chèn một node mới, một hàm ngẫu nhiên thường được sử dụng để quyết định xem nó có thể được nâng lên bao nhiêu tầng. Bạn có thể hình dung quá trình này giống như tung đồng xu: một node chắc chắn sẽ xuất hiện ở tầng đáy (tầng 0); nếu lần tung đầu tiên ra mặt ngửa, nó được nâng lên 1 tầng; nếu tiếp tục ra mặt ngửa, lại nâng lên thêm 1 tầng; cứ tiếp tục cho đến khi ra mặt sấp hoặc chạm mức số tầng tối đa cho phép.

Kết quả của cơ chế này là: tầng càng cao thì số lượng node càng ít, tầng càng thấp thì mật độ node càng dày. Ở trạng thái lý tưởng, tầng 1 giữ lại khoảng một nửa số node, tầng 2 giữ lại một nửa của tầng 1, tầng 3 tiếp tục giảm dần. Dù không phải cân bằng tuyệt đối, nhưng xét trên xác suất thống kê, chiều cao của Skip List sẽ được duy trì ổn định ở mức `O(logn)`.

Đây cũng chính là nguồn gốc của từ "Skip" (nhảy) trong tên gọi: các tầng chỉ mục trên cao cho phép quá trình tìm kiếm nhảy qua từng đoạn phần tử một cách nhanh chóng.

## Trọng tâm ôn luyện phỏng vấn

- Trình bày rõ ràng tại sao Skip List lại tìm kiếm nhanh hơn danh sách liên kết thông thường.
- Mô tả được quy trình tổng quát của các thao tác tìm kiếm, chèn và xóa.
- Giải thích được tại sao độ phức tạp trung bình của tìm kiếm, chèn, xóa trong Skip List là `O(logn)`.
- Phân tích được sự đánh đổi giữa Skip List và Red-Black Tree.
- Liên hệ được với kịch bản truy vấn theo khoảng (range query) trong Redis ZSet.

## Skip List tìm kiếm như thế nào?

Quá trình tìm kiếm bắt đầu từ tầng chỉ mục cao nhất:

1. Nếu giá trị của node kế tiếp của node hiện tại nhỏ hơn giá trị mục tiêu, tiếp tục đi sang phải.
2. Nếu giá trị của node kế tiếp lớn hơn giá trị mục tiêu hoặc bằng null, hạ xuống một tầng.
3. Sau khi xuống đến tầng đáy cùng, tiếp tục tìm kiếm node mục tiêu.

Quá trình này có phần tương tự như tìm kiếm nhị phân (binary search) trên mảng đã sắp xếp, nhưng bản chất cấu trúc bên dưới của Skip List vẫn là danh sách liên kết.

Chính xác hơn, mỗi tầng của Skip List đều là một danh sách liên kết có thứ tự. Khi truy vấn luôn tuân theo một nguyên tắc: đi sang phải được thì đi sang phải, không đi sang phải được thì đi xuống dưới.

Giả sử cần tìm giá trị `26`:

1. Bắt đầu từ node đầu (head) ở tầng cao nhất.
2. Nếu giá trị của node bên phải nhỏ hơn `26`, chứng tỏ mục tiêu vẫn nằm ở phía bên phải, có thể tiếp tục dịch sang phải.
3. Nếu giá trị của node bên phải lớn hơn `26`, nghĩa là nếu tiếp tục sang phải sẽ vượt quá mục tiêu, do đó hạ xuống một tầng.
4. Lặp lại quá trình này, và cuối cùng xác nhận xem mục tiêu có tồn tại hay không ở tầng đáy cùng.

Nếu mục tiêu không tồn tại, Skip List cũng có thể xác định được vị trí mà nó nên được chèn vào: node cuối cùng ở tầng đáy có giá trị nhỏ hơn giá trị mục tiêu chính là node tiền nhiệm (predecessor) của vị trí chèn.

## Chèn và xóa

Khi chèn một node, trước tiên cần tìm ra node tiền nhiệm của nó ở mỗi tầng, sau đó liên kết node mới vào. Số tầng mà node mới có thể nâng lên thường được quyết định bởi một hàm ngẫu nhiên.

Khi xóa một node, cũng cần xác định các node tiền nhiệm ở từng tầng, sau đó trỏ các con trỏ vòng qua node mục tiêu để loại bỏ nó.

Skip List không dựa vào phép quay để giữ cân bằng, mà dùng số tầng ngẫu nhiên để giữ cho chiều cao chỉ mục luôn nằm trong khoảng hợp lý. Đây cũng chính là lý do khiến việc hiện thực Skip List đơn giản hơn Red-Black Tree rất nhiều.

Trong code chèn thực tế, lập trình viên thường duy trì một mảng `update`: `update[i]` biểu thị node mới nên được chèn vào phía sau node nào ở tầng `i`. Trong quá trình tìm kiếm vị trí chèn, các node tiền nhiệm này sẽ được ghi nhận lại; sau khi có được số tầng ngẫu nhiên, ta có thể sửa đổi con trỏ trên từng tầng một cách thuận tiện.

Thao tác xóa cũng mang tư duy tương tự: trước hết tìm các node tiền nhiệm ở mỗi tầng; nếu node tiếp theo ở tầng đó chính là node mục tiêu, ta gán con trỏ `forward` của node tiền nhiệm trỏ thẳng tới node tiếp theo của node mục tiêu.

Vì vậy, thao tác chèn và xóa trong Skip List không chỉ sửa đổi danh sách liên kết đáy, mà còn phải đồng bộ cập nhật trên tất cả các tầng chỉ mục mà node mục tiêu xuất hiện.

## Độ phức tạp

| Thao tác | Độ phức tạp trung bình | Giải thích |
| --- | --- | --- |
| Tìm kiếm | `O(logn)` | Nhảy qua các node nhờ chỉ mục đa tầng |
| Chèn | `O(logn)` | Tìm vị trí rồi cập nhật con trỏ trên nhiều tầng |
| Xóa | `O(logn)` | Tìm node tiền nhiệm rồi ngắt kết nối con trỏ |
| Truy vấn theo khoảng | `O(logn + k)` | Định vị điểm bắt đầu, sau đó tuần tự trả về k phần tử |

Độ phức tạp không gian ở mức `O(n)`, nhưng sẽ tốn thêm một lượng bộ nhớ nhất định cho các con trỏ chỉ mục so với danh sách liên kết thông thường.

Giá trị `O(logn)` ở đây là độ phức tạp tính trên mức trung bình, phụ thuộc vào tính cân bằng xác suất do số tầng ngẫu nhiên mang lại. Skip List không cung cấp ràng buộc cân bằng trong trường hợp xấu nhất một cách khắt khe như Red-Black Tree, nhưng trong điều kiện hàm ngẫu nhiên hoạt động bình thường và thiết lập tham số hợp lý, hiệu năng của nó thường rất ổn định.

Truy vấn theo khoảng là kịch bản thế mạnh tuyệt đối của Skip List: trước tiên dùng `O(logn)` để định vị điểm bắt đầu của khoảng, sau đó duyệt tuần tự tiến về phía trước dọc theo danh sách liên kết ở tầng đáy để lấy ra `k` kết quả.

## Nên chọn Skip List hay Red-Black Tree?

| Tiêu chí so sánh | Skip List | Red-Black Tree |
| --- | --- | --- |
| Cơ chế cân bằng | Số tầng ngẫu nhiên | Phép quay và đổi màu node |
| Độ khó triển khai | Tương đối trực quan, dễ viết | Xử lý cân bằng khi chèn/xóa rất phức tạp |
| Truy vấn theo khoảng | Quét dọc danh sách liên kết đáy, rất thuận tiện | Duyệt trung thứ (in-order) cũng được, nhưng phức tạp hơn |
| Độ phức tạp xấu nhất | Phụ thuộc vào tính ngẫu nhiên | Có ràng buộc cân bằng chặt chẽ |
| Đại diện trong thực tế | Redis ZSet | Java `TreeMap`, cơ chế treeify của `HashMap` |

## Tại sao Redis ZSet lại dùng Skip List?

ZSet cần hỗ trợ các thao tác:

- Tìm kiếm điểm số (score) nhanh chóng dựa theo member.
- Sắp xếp thứ tự theo score.
- Truy vấn theo khoảng dựa trên score.
- Lấy thứ hạng (rank).

Hash Table rất thích hợp để tra cứu score theo member, trong khi Skip List lại tối ưu cho việc sắp xếp theo score và truy vấn theo khoảng. Khi kết hợp cả hai cấu trúc này, ZSet có thể đồng thời hỗ trợ tra cứu nhanh và duyệt tuần tự có thứ tự.

Cụ thể hơn:

- Thông qua Hash Table, có thể dựa vào member để tìm trực tiếp score tương ứng.
- Thông qua Skip List, các phần tử được duy trì thứ tự từ bé đến lớn theo score.
- Khi thực hiện các truy vấn theo khoảng như `ZRANGE`, `ZRANGEBYSCORE`, Skip List có thể định vị điểm bắt đầu rồi duyệt liên tục trên danh sách liên kết để trả về kết quả.
- Nếu node của Skip List lưu thêm thông tin span (bước nhảy), cấu trúc còn hỗ trợ hiệu quả các thao tác liên quan đến thứ hạng.

Cần lưu ý rằng Redis sẽ sử dụng các kiểu mã hóa nội bộ (internal encoding) khác nhau tùy thuộc vào dung lượng dữ liệu và cấu hình để tiết kiệm bộ nhớ. Khi phỏng vấn nhắc đến câu "ZSet sử dụng Hash Table + Skip List", người ta thường đang bàn về cấu trúc lõi của nó khi xử lý tập hợp có thứ tự có quy mô dữ liệu lớn.

## Các điểm dễ nhầm lẫn

- Skip List không phải là mảng, cũng không phải cây nhị phân, bản chất tầng dưới của nó là danh sách liên kết.
- Độ phức tạp trung bình của Skip List là `O(logn)`, được đảm bảo dựa trên xác suất chứ không phải nhờ cân bằng cấu trúc khắt khe.
- Truy vấn theo khoảng là điểm mạnh vượt trội của Skip List: trước tiên định vị điểm đầu, sau đó duyệt dọc theo danh sách liên kết tầng đáy.
- Redis ZSet không chỉ dùng mỗi Skip List, mà còn phối hợp chặt chẽ với Hash Table.

## Tự kiểm tra câu hỏi tần suất cao

- Tại sao Skip List lại tìm kiếm nhanh?
- Skip List và Red-Black Tree khác nhau ở điểm nào?
- Tại sao Redis ZSet không dùng Red-Black Tree?
- Số tầng của Skip List được quyết định như thế nào?
- Độ phức tạp khi truy vấn theo khoảng của Skip List là bao nhiêu?

## Tài liệu tham khảo

- [Skip Lists: A Probabilistic Alternative to Balanced Trees](https://dl.acm.org/doi/10.1145/78973.78977)
- [William Pugh: A Skip List Cookbook](https://drum.lib.umd.edu/bitstreams/17176ef8-8330-4a6c-8b75-4cd18c570bec/download)
- [Redis Docs: Sorted Sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)
- [Mã nguồn Redis: t_zset.c](https://github.com/redis/redis/blob/unstable/src/t_zset.c)
