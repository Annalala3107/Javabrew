---
title: Tìm hiểu chi tiết về Heap (Max-Heap, Min-Heap, Priority Queue)
description: Phân tích tính chất và các thao tác của Heap, hiểu cách triển khai Priority Queue và ưu thế hiệu năng của Heap Sort, nắm vững độ phức tạp chèn/xóa cùng các kịch bản thực tế.
category: Khoa học Máy tính
tag:
  - Cấu trúc dữ liệu
head:
  - - meta
    - name: keywords
      content: Heap,Max-Heap,Min-Heap,Priority Queue,Heapify,Sift-Up,Sift-Down,Heap Sort
lang: vi
sourceRef: zh-ref/cs-basics/data-structure/heap.md
---

## Heap là gì?

Heap (đống) là một cấu trúc dạng cây thỏa mãn điều kiện sau:

Giá trị của mỗi node trong Heap đều lớn hơn hoặc bằng (hoặc nhỏ hơn hoặc bằng) giá trị của tất cả các node nằm trong cây con (subtree) của nó. Hay nói cách khác, giá trị của bất kỳ node nào cũng lớn hơn hoặc bằng (hoặc nhỏ hơn hoặc bằng) giá trị của mọi node con của nó.

> Bạn có thể hình dung Heap (Max-Heap) như một công ty rất công bằng: ai có năng lực mạnh nhất thì làm sếp lớn, không tồn tại chuyện người yếu kém làm sếp, và cấp dưới dưới trướng sếp chắc chắn không thể mạnh hơn sếp. Cách liên tưởng này sẽ giúp bạn dễ hiểu hơn về các thao tác trên Heap ở phần sau.

**!!! Lưu ý đặc biệt:**

- Nhiều bài blog nói rằng Heap là cây nhị phân hoàn chỉnh (Complete Binary Tree), thực ra không hẳn như vậy — **Heap không nhất thiết phải là cây nhị phân hoàn chỉnh**. Chỉ là để tiện lưu trữ và đánh chỉ mục (indexing), chúng ta thường biểu diễn Heap dưới dạng cây nhị phân hoàn chỉnh. Trên thực tế, Fibonacci Heap và Binomial Heap rất nổi tiếng không phải là cây nhị phân hoàn chỉnh, thậm chí chúng còn không phải là cây nhị phân.
- Một Heap (**nhị phân**) là một mảng có thể được xem như một **cây nhị phân gần hoàn chỉnh** (*nearly complete binary tree*). — *Introduction to Algorithms*, ấn bản thứ 3

Bạn hãy thử phán đoán xem các cây trong hình dưới đây có phải là Heap không nhé:

![Ví dụ kiểm tra xem các cây có thỏa mãn tính chất Heap hay không](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-1-414f9c96.png)

Hình thứ 1 và thứ 2 là Heap. Hình thứ 1 là Max-Heap (đống cực đại), mỗi node đều lớn hơn toàn bộ các node trong cây con của nó. Hình thứ 2 là Min-Heap (đống cực tiểu), mỗi node đều nhỏ hơn toàn bộ các node trong cây con của nó.

Hình thứ 3 thì không phải: ở hình thứ ba, node gốc `1` nhỏ hơn `2` và `15`, nhưng `15` lại lớn hơn `3` và `19` lớn hơn `5`, không thỏa mãn tính chất của Heap.

## Công dụng của Heap

Khi chúng ta chỉ quan tâm đến giá trị lớn nhất hoặc nhỏ nhất trong toàn bộ dữ liệu, đồng thời có nhu cầu lấy giá trị lớn nhất/nhỏ nhất nhiều lần kết hợp với thao tác chèn hoặc xóa dữ liệu nhiều lần, chúng ta có thể sử dụng Heap.

Một số bạn có thể nghĩ đến mảng đã sắp xếp (Sorted Array): khởi tạo một mảng đã sắp xếp mất độ phức tạp thời gian `O(nlog(n))`, tìm giá trị lớn nhất hoặc nhỏ nhất mất `O(1)`. Tuy nhiên, khi đụng tới thao tác cập nhật (chèn hoặc xóa) dữ liệu, độ phức tạp thời gian là `O(n)` — ngay cả khi dùng tìm kiếm nhị phân (Binary Search) có độ phức tạp `O(log(n))` để tìm vị trí cần chèn hoặc xóa, thì khi dịch chuyển phần tử vẫn tốn `O(n)` thời gian.

**So với mảng đã sắp xếp, ưu thế chính của Heap nằm ở hiệu suất chèn và xóa dữ liệu cao hơn.** Do Heap được triển khai dựa trên cây nhị phân hoàn chỉnh, nên khi chèn hoặc xóa dữ liệu, chỉ cần di chuyển node lên hoặc xuống trong cây nhị phân với độ phức tạp thời gian `O(log(n))` — hiệu quả hơn hẳn mức `O(n)` của mảng đã sắp xếp.

Tuy nhiên, cần chú ý: nếu dùng phương pháp dựng Heap của Floyd (Floyd's heap construction), thực hiện thao tác chìm xuống (`sift-down`) lần lượt từ node không phải lá cuối cùng, độ phức tạp thời gian là `O(n)`; còn nếu bắt đầu từ Heap rỗng rồi chèn lần lượt `n` phần tử vào, độ phức tạp thời gian sẽ là `O(nlogn)`.

## Phân loại Heap

Heap được chia thành **Max-Heap** (đống cực đại) và **Min-Heap** (đống cực tiểu). Sự khác biệt giữa hai loại nằm ở cách sắp xếp thứ tự các node.

- **Max-Heap**: Giá trị của mỗi node trong Heap đều lớn hơn hoặc bằng giá trị của tất cả các node trong cây con của nó.
- **Min-Heap**: Giá trị của mỗi node trong Heap đều nhỏ hơn hoặc bằng giá trị của tất cả các node trong cây con của nó.

Như minh họa dưới đây, Hình 1 là Max-Heap và Hình 2 là Min-Heap:

![Ví dụ về Max-Heap và Min-Heap](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-2-54fdf932.png)

## Lưu trữ Heap

Khi giới thiệu về cấu trúc cây trước đây, chúng ta đã biết nhờ tính chất tuyệt vời của cây nhị phân hoàn chỉnh, việc dùng mảng để lưu trữ cây nhị phân vừa tiết kiệm bộ nhớ vừa thuận tiện truy xuất chỉ mục (nếu chỉ số của node gốc là `1`, thì với bất kỳ node `i` nào trong cây, node con trái có chỉ số `2*i`, node con phải có chỉ số `2*i+1`).

Để thuận tiện cho việc lưu trữ và đánh chỉ mục, Heap (nhị phân) có thể được lưu trữ dưới dạng cây nhị phân hoàn chỉnh. Cách lưu trữ được minh họa như hình dưới đây:

![Sơ đồ lưu trữ tuần tự bằng mảng của Heap](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-storage-54382500.png)

## Các thao tác trên Heap

Thao tác cập nhật Heap chủ yếu gồm hai loại: **chèn phần tử** và **xóa phần tử đỉnh Heap**. Bạn cần nắm chắc và hiểu rõ quá trình thực hiện hai thao tác này.

> Trước khi đi vào chi tiết, xin nhắc lại một lần nữa: Heap là một công ty công bằng, người có năng lực tự nhiên sẽ đi đến vị trí tương xứng với năng lực của mình.

### Chèn phần tử

> Chèn phần tử giống như một nhân viên mới vào làm: chân ướt chân ráo mới tới, nhân viên này cần bắt đầu từ cấp cơ sở.

**1. Đặt phần tử cần chèn vào vị trí cuối cùng**

![Chèn phần tử vào Heap: đặt phần tử mới vào cuối mảng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-insert-1-e099b811.png)

> Người có năng lực sẽ dần được thăng chức tăng lương — vàng thật rồi sẽ tỏa sáng!!!

**2. Đi từ dưới lên trên: nếu node cha nhỏ hơn phần tử này thì hoán đổi node đó với node cha, cho đến khi không thể hoán đổi được nữa**

![Chèn phần tử vào Heap: so sánh với node cha và đẩy lên (sift-up)](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-insert-2-30956baa.png)

![Chèn phần tử vào Heap: khôi phục tính chất Heap sau khi sift-up](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-insert-3-315817b4.png)

### Xóa phần tử đỉnh Heap

Theo tính chất của Heap, phần tử đỉnh của Max-Heap là phần tử lớn nhất trong tất cả các phần tử, còn phần tử đỉnh của Min-Heap là phần tử nhỏ nhất trong tất cả các phần tử. Khi cần nhiều lần tìm phần tử lớn nhất hoặc nhỏ nhất, ta có thể tận dụng Heap.

Sau khi xóa phần tử đỉnh Heap, để duy trì tính chất của Heap, ta cần điều chỉnh lại cấu trúc của Heap; quá trình này được gọi là "**heapify**" (vun đống). Có hai hướng điều chỉnh phổ biến:

- Heapify từ dưới lên (Bottom-up heapify): Khi chèn phần tử, phần tử mới di chuyển từ cuối lên trên, còn gọi là **sift-up** (đẩy lên).
- Heapify từ trên xuống (Top-down heapify): Khi xóa đỉnh Heap, phần tử cuối cùng được đưa lên đỉnh rồi di chuyển xuống dưới, còn gọi là **sift-down** (chìm xuống).

#### Một quá trình dịch chuyển ô trống lên trên chưa hoàn chỉnh

> Trong công ty mang tên Heap này, sẽ có lúc sếp lớn nghỉ việc; sau khi sếp lớn rời đi, vị trí của ông ấy bị bỏ trống.

Trước tiên hãy xem một cách làm dễ nghĩ ra nhưng chưa hoàn chỉnh: xóa trực tiếp phần tử đỉnh Heap, khiến vị trí có chỉ số `1` trong mảng bị trống.

![Xóa đỉnh Heap: loại bỏ node gốc](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-1-03f3be69.png)

> Vậy vị trí của ông ấy sẽ do ai tiếp quản? Đương nhiên là cấp dưới trực tiếp rồi, ai năng lực mạnh hơn thì cho người đó lên.

So sánh node con trái và node con phải của node gốc — tức là các phần tử ở chỉ số `2` và `3` trong mảng — rồi đưa phần tử lớn hơn lên lấp vào vị trí node gốc (chỉ số `1`).

![Xóa đỉnh Heap: node con lớn hơn di chuyển lên node gốc](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-2-cc68826f.png)

> Lúc này lại trống ra một vị trí nữa; theo luật cũ, ai có năng lực thì lên.

Lặp lại vòng lặp so sánh hai node con trái phải của vị trí vừa trống và đưa node lớn hơn lên ô trống, cho đến tận đáy của Heap.

![Xóa đỉnh Heap: để lại ô trống bên trong sau khi dịch chuyển từ dưới lên](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-3-bc5fe5ab.png)

Lúc này tuy các node con lớn hơn đã lần lượt đi lên theo đường dẫn, nhưng bên trong mảng lại để lại một ô trống, không còn thỏa mãn cấu trúc cây nhị phân hoàn chỉnh nữa, do đó không thể coi là một lần xóa đỉnh Heap hoàn chỉnh và hợp lệ. Cách làm chuẩn là lấy phần tử cuối cùng lấp lên đỉnh Heap trước, rồi cho nó tự điều chỉnh đi xuống.

#### Heapify từ trên xuống

Heapify từ trên xuống có thể ví như "hòn đá chìm xuống đáy biển". Việc đầu tiên là nhấc hòn đá lên rồi thả từ mặt biển xuống. Hòn đá này chính là phần tử cuối cùng của Heap: chúng ta chuyển phần tử cuối cùng lên đỉnh Heap.

![Xóa đỉnh Heap: đưa phần tử cuối cùng lên đỉnh Heap](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-4-a3c8126e.png)

Sau đó bắt đầu cho hòn đá này chìm xuống đáy biển: liên tục so sánh giá trị với node con trái và node con phải, hoán đổi vị trí với node con lớn hơn, cho đến khi không thể hoán đổi được nữa.

![Xóa đỉnh Heap: phần tử đỉnh Heap điều chỉnh đi xuống](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-5-96ab3ce6.png)

![Xóa đỉnh Heap: hoàn tất quá trình heapify từ trên xuống](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-delete-top-6-7d213d9d.png)

### Tổng kết các thao tác Heap

- **Chèn phần tử**: Đặt phần tử vào cuối mảng trước, sau đó thực hiện heapify từ dưới lên để đẩy phần tử cuối lên trên (`sift-up`).
- **Xóa phần tử đỉnh Heap**: Hoán đổi phần tử đỉnh Heap với phần tử cuối cùng, thu nhỏ kích thước Heap, rồi từ đỉnh Heap bắt đầu điều chỉnh đi xuống (`sift-down`) cho đến khi khôi phục tính chất Heap.

## Sắp xếp Heap (Heap Sort)

Quá trình của Heap Sort gồm hai bước:

- Bước thứ nhất là dựng Heap (Build Heap): biến một mảng chưa sắp xếp thành một Heap.
- Bước thứ hai là sắp xếp: lấy phần tử đỉnh Heap ra, sau đó heapify các phần tử còn lại, lặp đi lặp lại cho đến khi toàn bộ phần tử được lấy ra hết.

### Dựng Heap

Nếu bạn đã hiểu đủ rõ quá trình heapify, thì quá trình dựng Heap sẽ khá dễ nắm bắt. Quá trình dựng Heap chính là thực hiện heapify từ trên xuống đối với tất cả các node không phải lá (non-leaf nodes).

Trước tiên cần biết những node nào là node không phải lá: node cha của node cuối cùng và các phần tử đứng trước nó đều là node không phải lá. Nghĩa là nếu số lượng node là `n`, chúng ta cần thực hiện heapify từ trên xuống (sift-down) cho các node từ `n/2` về `1`.

Quá trình cụ thể như hình dưới đây:

![Quá trình dựng Heap: cây nhị phân hoàn chỉnh tương ứng với mảng chưa sắp xếp ban đầu](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-build-1-4f8ae254.png)

Trừu tượng hóa mảng chưa sắp xếp ban đầu thành một cái cây: số node trong hình là `6`, nên các node `4`, `5`, `6` là node lá, còn các node `1`, `2`, `3` là node không phải lá. Do đó cần thực hiện heapify từ trên xuống (sift-down) cho các node từ `1` đến `3`. Lưu ý thứ tự là heapify từ sau ra trước: bắt đầu từ node `3` cho đến node `1`.

Kết quả sau khi heapify node `3`:

![Quá trình dựng Heap: node 3 hoàn tất sift-down](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-build-2-9b2bfa01.png)

Kết quả sau khi heapify node `2`:

![Quá trình dựng Heap: node 2 hoàn tất sift-down](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-build-3-44f0d89a.png)

Kết quả sau khi heapify node `1`:

![Quá trình dựng Heap: node 1 hoàn tất sift-down và hình thành Max-Heap](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-build-4-9da0cb4e.png)

Đến đây, cây tương ứng với mảng đã trở thành một Max-Heap, quá trình dựng Heap hoàn tất!

### Sắp xếp

Do phần tử đỉnh Heap là phần tử lớn nhất trong toàn bộ các phần tử, nên ta lặp lại việc lấy phần tử đỉnh Heap ra, đặt phần tử đỉnh lớn nhất này vào cuối mảng, rồi thực hiện heapify đối với các phần tử còn lại.

Bây giờ hãy suy nghĩ hai câu hỏi:

- Sau khi xóa phần tử đỉnh Heap thì cần thực hiện heapify từ trên xuống (`sift-down`) hay từ dưới lên (`sift-up`)?
- Phần tử đỉnh Heap được lấy ra sẽ lưu ở đâu — có cần tạo một mảng mới để chứa không?

Trả lời câu hỏi đầu tiên trước: chúng ta cần thực hiện heapify từ trên xuống (`sift-down`). Ngay từ đầu quá trình heapify này, phần tử cuối cùng sẽ được chuyển lên đỉnh Heap, khi đó vị trí cuối mảng bị trống ra; vì số phần tử trong Heap đã giảm đi nên vị trí này sẽ không còn được Heap sử dụng nữa, do đó ta có thể đặt luôn phần tử vừa lấy ra vào cuối mảng.

Những bạn tinh ý chắc đã nhận ra: thực chất đây là thực hiện một phép hoán đổi — đổi chỗ phần tử đỉnh Heap và phần tử cuối cùng, qua đó gộp bước lấy phần tử đỉnh Heap và bước đầu tiên của quá trình heapify (đưa phần tử cuối lên vị trí node gốc) thành một.

Quá trình chi tiết được minh họa như hình dưới đây:

Lấy phần tử thứ nhất ra và heapify:

![Quá trình Heap Sort: vòng 1 lấy phần tử đỉnh Heap và heapify](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-1-b09b4648.png)

Lấy phần tử thứ hai ra và heapify:

![Quá trình Heap Sort: vòng 2 lấy phần tử đỉnh Heap và heapify](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-2-197dfe5b.png)

Lấy phần tử thứ ba ra và heapify:

![Quá trình Heap Sort: vòng 3 lấy phần tử đỉnh Heap và heapify](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-3-2c5da8c5.png)

Lấy phần tử thứ tư ra và heapify:

![Quá trình Heap Sort: vòng 4 lấy phần tử đỉnh Heap và heapify](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-4-7bcf059d.png)

Lấy phần tử thứ năm ra và heapify:

![Quá trình Heap Sort: vòng 5 lấy phần tử đỉnh Heap và heapify](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-5-1ce576f5.png)

Lấy phần tử thứ sáu ra và heapify:

![Quá trình Heap Sort: toàn bộ phần tử đã được sắp xếp xong](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/heap-sort-6-9194349a.png)

Heap Sort hoàn tất!

## Trọng tâm ôn tập phỏng vấn

Trong phỏng vấn, Heap thường được hỏi kèm với Priority Queue (hàng đợi ưu tiên), bài toán Top K, tác vụ định thời (scheduled tasks) và hàng đợi trễ (delayed queue).

| Thao tác       | Độ phức tạp thời gian | Ghi chú                                                  |
| -------------- | --------------------- | -------------------------------------------------------- |
| Xem đỉnh Heap  | `O(1)`                | Max-Heap có đỉnh lớn nhất, Min-Heap có đỉnh nhỏ nhất     |
| Chèn phần tử   | `O(logn)`             | Chèn vào cuối rồi sift-up                                |
| Xóa đỉnh Heap  | `O(logn)`             | Đưa phần tử cuối lên đỉnh rồi sift-down                  |
| Dựng Heap      | `O(n)`                | Sift-down bắt đầu từ node không phải lá cuối cùng        |
| Heap Sort      | `O(nlogn)`            | Sắp xếp tại chỗ (in-place), nhưng không ổn định (unstable) |

`PriorityQueue` trong Java mặc định là Min-Heap:

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a, b) -> Integer.compare(b, a));
```

Không nên viết là `b - a`, vì với các giá trị số nguyên cực đoan có thể bị tràn số (overflow), dẫn đến kết quả so sánh sai.

Các lựa chọn phổ biến cho bài toán Top K:

- Kịch bản tổng quát hoặc tìm phần tử lớn thứ K trong luồng dữ liệu (data stream): Duy trì một Min-Heap kích thước `K`, độ phức tạp thời gian là `O(nlogk)`, độ phức tạp không gian là `O(k)`.
- Tìm phần tử lớn thứ K trong mảng một lần và yêu cầu thời gian tuyến tính: Dùng Quickselect (chọn nhanh), độ phức tạp thời gian trung bình là `O(n)`.
- Tìm K phần tử xuất hiện nhiều nhất: Dùng bảng băm (Hash Table) để đếm tần suất trước, sau đó dùng Min-Heap giữ lại `K` phần tử có tần suất cao nhất.
- Trung vị (median) của luồng dữ liệu: Một Max-Heap lưu nửa nhỏ hơn, một Min-Heap lưu nửa lớn hơn.

Cần lưu ý rằng Min-Heap là lời giải tổng quát để tìm phần tử lớn thứ K, nhưng không đáp ứng yêu cầu độ phức tạp của mọi bài toán. Ví dụ, bài [LeetCode 215. Kth Largest Element in an Array](https://leetcode.cn/problems/kth-largest-element-in-an-array/) yêu cầu thuật toán có độ phức tạp thời gian `O(n)`, thông thường nên áp dụng Quickselect ngẫu nhiên hóa (randomized Quickselect) với độ phức tạp thời gian kỳ vọng là `O(n)`; nếu yêu cầu nghiêm ngặt độ phức tạp thời gian trường hợp xấu nhất là `O(n)` thì cần dùng thuật toán BFPRT. Để xem so sánh chi tiết các phương án, có thể tham khảo [Tổng hợp câu hỏi phỏng vấn bài toán Top K](../algorithms/top-k.md#快排分区思路).

## Mẫu code Java

Bài toán tìm phần tử lớn thứ K có thể dùng Min-Heap kích thước `K`. Đỉnh Heap luôn là phần tử nhỏ nhất trong top `K` phần tử lớn nhất hiện tại; nếu phần tử mới lớn hơn đỉnh Heap thì thay thế đỉnh Heap. Cách viết này có độ phức tạp thời gian là `O(nlogk)`, độ phức tạp không gian là `O(k)`, phù hợp cho kịch bản Top K tổng quát và luồng dữ liệu.

```java
int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int num : nums) {
        if (heap.size() < k) {
            heap.offer(num);
        } else if (num > heap.peek()) {
            heap.poll();
            heap.offer(num);
        }
    }
    return heap.peek();
}
```

Bài toán Top K phần tử có tần suất cao nhất thường dùng mẫu "đếm bằng Hash Table + Min-Heap":

```java
int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    for (int num : nums) {
        count.put(num, count.getOrDefault(num, 0) + 1);
    }
    PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));
    for (Map.Entry<Integer, Integer> entry : count.entrySet()) {
        heap.offer(new int[] {entry.getKey(), entry.getValue()});
        if (heap.size() > k) {
            heap.poll();
        }
    }
    int[] ans = new int[k];
    for (int i = k - 1; i >= 0; i--) {
        ans[i] = heap.poll()[0];
    }
    return ans;
}
```

## Minh họa quá trình và các trường hợp biên

Khi duy trì Min-Heap kích thước `K`, có thể xem Heap như một "nhóm ứng viên" (candidate pool):

```text
1. Nhóm ứng viên chưa đầy: đưa trực tiếp vào.
2. Nhóm ứng viên đã đầy, phần tử mới <= đỉnh Heap: không thể lọt vào top K, bỏ qua.
3. Nhóm ứng viên đã đầy, phần tử mới > đỉnh Heap: lấy đỉnh Heap ra, đưa phần tử mới vào.
4. Sau khi duyệt xong, đỉnh Heap chính là phần tử lớn thứ K.
```

Nên rà soát trước một vài trường hợp biên (edge cases):

- `k == 1`: Tìm giá trị lớn nhất.
- `k == nums.length`: Tìm giá trị nhỏ nhất.
- Mảng có các phần tử trùng lặp: Phần tử lớn thứ K thường tính theo vị trí sau sắp xếp, không phải phần tử phân biệt lớn thứ K.
- Bộ so sánh (Comparator) không được viết `b - a`, vì giá trị cực đoan có thể gây tràn số.

## Bài tập luyện tập gợi ý

- [215. Kth Largest Element in an Array](https://leetcode.cn/problems/kth-largest-element-in-an-array/) (bài yêu cầu độ phức tạp thời gian `O(n)`, ưu tiên luyện tập Quickselect)
- [347. Top K Frequent Elements](https://leetcode.cn/problems/top-k-frequent-elements/)
- [703. Kth Largest Element in a Stream](https://leetcode.cn/problems/kth-largest-element-in-a-stream/)
- [295. Find Median from Data Stream](https://leetcode.cn/problems/find-median-from-data-stream/)
