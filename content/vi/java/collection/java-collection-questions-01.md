---
title: Tổng hợp câu hỏi phỏng vấn thường gặp về Java Collections (Phần 1)
description: "Tổng hợp câu hỏi phỏng vấn Java Collections Framework: phân tích chuyên sâu các interface Collection/List/Set/Queue, so sánh các lớp collection phổ biến như ArrayList/LinkedList/HashMap, nắm vững cấu trúc dữ liệu nền tảng và kịch bản sử dụng."
category: Java
tag:
  - Java Collections
lang: vi
sourceRef: zh-ref/java/collection/java-collection-questions-01.md
head:
  - - meta
    - name: keywords
      content: Java Collections,Collection,List,Set,Queue,ArrayList,LinkedList,HashMap,Collections Framework,câu hỏi phỏng vấn Java
---

<!-- markdownlint-disable MD024 -->

## Tổng quan về Collections

### Tổng quan về Java Collections

Java Collections, còn được gọi là container (bộ chứa), chủ yếu được dẫn xuất từ hai interface lớn: một là interface `Collection`, chủ yếu dùng để lưu trữ các phần tử đơn lẻ; hai là interface `Map`, chủ yếu dùng để lưu trữ các cặp khóa-giá trị (key-value). Dưới interface `Collection` lại có ba interface con chính: `List`, `Set`, `Queue`.

Java Collections Framework được minh họa như hình dưới đây:

![Tổng quan về Java Collections Framework](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/java-collection-hierarchy-04d68439.png)

Lưu ý: Hình vẽ chỉ liệt kê các quan hệ kế thừa và dẫn xuất chính, không liệt kê toàn bộ mọi quan hệ. Ví dụ đã lược bỏ các lớp trừu tượng như `AbstractList`, `NavigableSet` cùng một số lớp bổ trợ khác; nếu muốn tìm hiểu sâu hơn, bạn có thể tự xem trực tiếp mã nguồn.

### ⭐️ Trình bày sự khác nhau giữa List, Set, Queue và Map?

- `List` (trợ thủ đắc lực để quản lý thứ tự): Các phần tử được lưu trữ có thứ tự và có thể trùng lặp.
- `Set` (chú trọng tính duy nhất): Các phần tử được lưu trữ không thể trùng lặp.
- `Queue` (máy lấy số xếp hàng thực hiện chức năng hàng đợi): Xác định thứ tự trước sau theo quy tắc xếp hàng cụ thể; các phần tử được lưu trữ có thứ tự và có thể trùng lặp.
- `Map` (chuyên gia tìm kiếm theo key): Lưu trữ bằng cặp khóa-giá trị (key-value), tương tự hàm số y=f(x) trong toán học, trong đó "x" đại diện cho key, "y" đại diện cho value; key không có thứ tự và không thể trùng lặp, value không có thứ tự và có thể trùng lặp, mỗi key ánh xạ tới tối đa một value. Lưu ý rằng "không có thứ tự" ở đây đề cập đến những hiện thực như `HashMap` — giữa các cặp key-value không có thứ tự liên kết tường minh. Các hiện thực như `LinkedHashMap` và `TreeMap` thì có thứ tự; chúng duy trì thứ tự của các cặp key-value thông qua cấu trúc dữ liệu bổ sung (danh sách liên kết đôi hoặc cây đỏ-đen (Red-Black Tree)).

### Tổng kết cấu trúc dữ liệu nền tảng của Collections Framework

Trước tiên hãy xem các collection bên dưới interface `Collection`.

#### List

- `ArrayList`: Mảng `Object[]`. Chi tiết có thể xem tại: [Phân tích mã nguồn ArrayList](./arraylist-source-code.md).
- `Vector`: Mảng `Object[]`.
- `LinkedList`: Danh sách liên kết đôi (trước JDK 1.6 là danh sách liên kết vòng, JDK 1.7 đã bỏ tính chất vòng). Chi tiết có thể xem tại: [Phân tích mã nguồn LinkedList](./linkedlist-source-code.md).

#### Set

- `HashSet` (không có thứ tự, duy nhất): Được hiện thực dựa trên `HashMap`, bên dưới sử dụng `HashMap` để lưu trữ phần tử.
- `LinkedHashSet`: `LinkedHashSet` là lớp con của `HashSet`, và bên trong nó được hiện thực thông qua `LinkedHashMap`.
- `TreeSet` (có thứ tự, duy nhất): Cây đỏ-đen (Red-Black Tree — cây nhị phân tìm kiếm tự cân bằng có thứ tự).

#### Queue

- `PriorityQueue`: Sử dụng mảng `Object[]` để hiện thực min-heap (đống cực tiểu, xem thêm `java.util.PriorityQueue`).
- `DelayQueue`: `PriorityQueue`. Chi tiết có thể xem tại: [Phân tích mã nguồn DelayQueue](./delayqueue-source-code.md).
- `ArrayDeque`: Mảng hai đầu động có thể mở rộng dung lượng (`resize`).

Tiếp theo hãy xem các collection bên dưới interface `Map`.

#### Map

- `HashMap`: Trước JDK 1.8, `HashMap` được cấu tạo từ mảng + danh sách liên kết; mảng là thành phần chính của `HashMap`, còn danh sách liên kết tồn tại chủ yếu để giải quyết xung đột băm (Hash Collision — phương pháp "nối chuỗi" / separate chaining). Từ JDK 1.8 trở đi, cách giải quyết xung đột băm có thay đổi lớn: khi độ dài danh sách liên kết lớn hơn ngưỡng (mặc định là 8) (trước khi chuyển danh sách liên kết sang cây đỏ-đen sẽ kiểm tra nếu độ dài mảng hiện tại nhỏ hơn 64 thì ưu tiên mở rộng dung lượng mảng trước thay vì chuyển sang cây đỏ-đen), danh sách liên kết sẽ được chuyển thành cây đỏ-đen nhằm giảm thời gian tìm kiếm. Chi tiết có thể xem tại: [Phân tích mã nguồn HashMap](./hashmap-source-code.md); phần khái niệm cơ bản có thể xem trước [Tổng hợp câu hỏi phỏng vấn bảng băm](../../cs-basics/data-structure/hash-table.md).
- `LinkedHashMap`: `LinkedHashMap` kế thừa từ `HashMap`, nên nền tảng bên dưới của nó vẫn dựa trên cấu trúc bảng băm nối chuỗi gồm mảng và danh sách liên kết hoặc cây đỏ-đen. Ngoài ra, `LinkedHashMap` bổ sung thêm một danh sách liên kết đôi trên nền cấu trúc đó để có thể giữ nguyên thứ tự chèn của các cặp key-value. Đồng thời thông qua các thao tác tương ứng trên danh sách liên kết, nó hiện thực logic liên quan đến thứ tự truy cập. Chi tiết có thể xem tại: [Phân tích mã nguồn LinkedHashMap](./linkedhashmap-source-code.md); bài tập code tay LRU có thể xem [Tổng hợp câu hỏi phỏng vấn LRU Cache](../../cs-basics/data-structure/lru-cache.md).
- `Hashtable`: Được cấu tạo từ mảng + danh sách liên kết; mảng là thành phần chính của `Hashtable`, còn danh sách liên kết tồn tại chủ yếu để giải quyết xung đột băm.
- `TreeMap`: Cây đỏ-đen (Red-Black Tree — cây nhị phân tìm kiếm tự cân bằng có thứ tự).

### Cách lựa chọn Collection phù hợp?

Chúng ta chủ yếu dựa vào đặc điểm của từng collection để lựa chọn loại phù hợp. Ví dụ:

- Khi cần lấy giá trị phần tử dựa theo khóa (key-value), chọn collection thuộc interface `Map`: cần sắp xếp thì chọn `TreeMap`, không cần sắp xếp thì chọn `HashMap`, cần đảm bảo an toàn luồng (thread-safe) thì chọn `ConcurrentHashMap`.
- Khi chỉ cần lưu trữ giá trị phần tử, chọn collection hiện thực interface `Collection`: cần đảm bảo phần tử duy nhất thì chọn collection hiện thực `Set` như `TreeSet` hoặc `HashSet`; không cần thì chọn lớp hiện thực `List` như `ArrayList` hoặc `LinkedList`, sau đó tùy vào đặc điểm của từng lớp hiện thực mà lựa chọn tiếp.

### Tại sao cần sử dụng Collection?

Khi cần lưu trữ một nhóm dữ liệu cùng kiểu, mảng (`Array`) là một trong những bộ chứa cơ bản và phổ biến nhất. Tuy nhiên, việc dùng mảng để lưu trữ đối tượng tồn tại một số hạn chế, bởi trong phát triển thực tế, kiểu dữ liệu cần lưu trữ rất đa dạng và số lượng không cố định. Lúc này, Java Collection phát huy tác dụng. So với mảng, Java Collection cung cấp cách thức linh hoạt và hiệu quả hơn để lưu trữ nhiều đối tượng dữ liệu. Các lớp và interface đa dạng trong Java Collections Framework có thể lưu trữ các đối tượng thuộc nhiều kiểu và số lượng khác nhau, đồng thời cung cấp nhiều phương thức thao tác phong phú. So với mảng, ưu thế của Java Collection nằm ở kích thước thay đổi linh hoạt, hỗ trợ `Generics`, có sẵn các thuật toán tích hợp, v.v. Nhìn chung, Java Collection nâng cao tính linh hoạt trong lưu trữ và xử lý dữ liệu, thích ứng tốt hơn với nhu cầu dữ liệu đa dạng trong phát triển phần mềm hiện đại và hỗ trợ viết mã nguồn chất lượng cao.

## List

### ⭐️ Sự khác nhau giữa ArrayList và Array (mảng)?

`ArrayList` được hiện thực bên trong dựa trên mảng động, linh hoạt hơn khi sử dụng so với `Array` (mảng tĩnh):

- `ArrayList` tự động mở rộng dung lượng theo số lượng phần tử thực tế được lưu trữ, và cũng có thể chủ động thu nhỏ mảng nền tảng thông qua `trimToSize()`, trong khi `Array` sau khi được tạo ra thì không thể thay đổi độ dài nữa.
- `ArrayList` cho phép bạn sử dụng `Generics` để đảm bảo an toàn kiểu (type safety), còn `Array` thì không.
- `ArrayList` chỉ có thể lưu trữ đối tượng. Đối với dữ liệu kiểu nguyên thủy (primitive), cần sử dụng lớp bao (wrapper class) tương ứng của nó (như `Integer`, `Double`, v.v.). `Array` có thể lưu trực tiếp dữ liệu kiểu nguyên thủy lẫn đối tượng.
- `ArrayList` hỗ trợ các thao tác phổ biến như chèn, xóa, duyệt và cung cấp API thao tác phong phú như `add()`, `remove()`, v.v. `Array` chỉ là một mảng có độ dài cố định, chỉ có thể truy cập phần tử theo chỉ số, không có khả năng thêm hay xóa phần tử động.
- `ArrayList` khi khởi tạo không bắt buộc chỉ định kích thước, còn `Array` khi khởi tạo bắt buộc phải chỉ định kích thước.

Dưới đây là so sánh đơn giản về cách sử dụng của cả hai:

`Array`:

```java
 // Khởi tạo một mảng kiểu String
 String[] stringArr = new String[]{"hello", "world", "!"};
 // Sửa giá trị của phần tử trong mảng
 stringArr[0] = "goodbye";
 System.out.println(Arrays.toString(stringArr));// [goodbye, world, !]
 // Xóa phần tử trong mảng, cần tự dịch chuyển các phần tử phía sau
 for (int i = 0; i < stringArr.length - 1; i++) {
     stringArr[i] = stringArr[i + 1];
 }
 stringArr[stringArr.length - 1] = null;
 System.out.println(Arrays.toString(stringArr));// [world, !, null]
```

`ArrayList`:

```java
// Khởi tạo một ArrayList kiểu String
 ArrayList<String> stringList = new ArrayList<>(Arrays.asList("hello", "world", "!"));
// Thêm phần tử vào ArrayList
 stringList.add("goodbye");
 System.out.println(stringList);// [hello, world, !, goodbye]
 // Sửa phần tử trong ArrayList
 stringList.set(0, "hi");
 System.out.println(stringList);// [hi, world, !, goodbye]
 // Xóa phần tử trong ArrayList
 stringList.remove(0);
 System.out.println(stringList); // [world, !, goodbye]
```

### Sự khác nhau giữa ArrayList và Vector? (Biết để nắm thêm)

- `ArrayList` là lớp hiện thực chính của `List`, bên dưới sử dụng `Object[]` để lưu trữ, phù hợp với các tác vụ tìm kiếm thường xuyên, không an toàn luồng (thread-safe).
- `Vector` là lớp hiện thực cũ của `List`, bên dưới sử dụng `Object[]` để lưu trữ, có tính an toàn luồng.

### Sự khác nhau giữa Vector và Stack? (Biết để nắm thêm)

- Cả `Vector` và `Stack` đều an toàn luồng, đều sử dụng từ khóa `synchronized` để đồng bộ hóa.
- `Stack` kế thừa từ `Vector`, là một ngăn xếp vào sau ra trước (LIFO), trong khi `Vector` là một danh sách.

Cùng với sự phát triển của lập trình đồng thời (concurrency) trong Java, `Vector` và `Stack` đã lỗi thời; nên ưu tiên sử dụng các lớp collection đồng thời (như `ConcurrentHashMap`, `CopyOnWriteArrayList`, v.v.) hoặc tự hiện thực các cơ chế thread-safe để hỗ trợ thao tác đa luồng an toàn.

### ArrayList có thể thêm giá trị null không?

`ArrayList` có thể lưu trữ bất kỳ kiểu đối tượng nào, bao gồm cả giá trị `null`. Tuy nhiên, không khuyến khích thêm giá trị `null` vào `ArrayList`, vì `null` không mang ý nghĩa và sẽ khiến mã nguồn khó bảo trì — chẳng hạn quên kiểm tra null sẽ dẫn đến `NullPointerException`.

Mã ví dụ:

```java
ArrayList<String> listOfStrings = new ArrayList<>();
listOfStrings.add(null);
listOfStrings.add("java");
System.out.println(listOfStrings);
```

Kết quả đầu ra:

```plain
[null, java]
```

### ⭐️ Độ phức tạp thời gian khi chèn và xóa phần tử trong ArrayList?

Đối với thao tác chèn:

- Chèn ở đầu: Do phải dịch chuyển lần lượt toàn bộ phần tử ra sau một vị trí nên độ phức tạp thời gian là O(n).
- Chèn ở cuối: Khi dung lượng của `ArrayList` chưa đạt giới hạn, độ phức tạp thời gian để chèn phần tử vào cuối danh sách là O(1), vì chỉ cần thêm một phần tử vào cuối mảng; khi dung lượng đã đạt giới hạn và cần mở rộng dung lượng (`resize`), phải thực hiện một thao tác O(n) để sao chép mảng cũ sang mảng mới lớn hơn, rồi thực hiện thao tác O(1) để thêm phần tử.
- Chèn tại vị trí chỉ định: Cần dịch chuyển toàn bộ các phần tử sau vị trí mục tiêu ra sau một vị trí rồi mới đặt phần tử mới vào vị trí chỉ định. Quá trình này cần dịch chuyển trung bình n/2 phần tử, nên độ phức tạp thời gian là O(n).

Đối với thao tác xóa:

- Xóa ở đầu: Do phải dịch chuyển lần lượt toàn bộ phần tử lên trước một vị trí nên độ phức tạp thời gian là O(n).
- Xóa ở cuối: Khi phần tử cần xóa nằm ở cuối danh sách, độ phức tạp thời gian là O(1).
- Xóa tại vị trí chỉ định: Cần dịch chuyển toàn bộ các phần tử sau phần tử mục tiêu lên trước một vị trí để lấp đầy chỗ trống bị xóa, nên cần dịch chuyển trung bình n/2 phần tử, độ phức tạp thời gian là O(n).

Dưới đây là một ví dụ minh họa đơn giản:

```java
// Kích thước mảng nền tảng của ArrayList là 10, hiện đang lưu trữ 7 phần tử
+---+---+---+---+---+---+---+---+---+---+
| 1 | 2 | 3 | 4 | 5 | 6 | 7 |   |   |   |
+---+---+---+---+---+---+---+---+---+---+
  0   1   2   3   4   5   6   7   8   9
// Chèn phần tử 8 tại chỉ số 1, toàn bộ các phần tử phía sau nó phải dịch sang phải một vị trí
+---+---+---+---+---+---+---+---+---+---+
| 1 | 8 | 2 | 3 | 4 | 5 | 6 | 7 |   |   |
+---+---+---+---+---+---+---+---+---+---+
  0   1   2   3   4   5   6   7   8   9
// Xóa phần tử tại chỉ số 1, toàn bộ các phần tử phía sau nó phải dịch sang trái một vị trí
+---+---+---+---+---+---+---+---+---+---+
| 1 | 2 | 3 | 4 | 5 | 6 | 7 |   |   |   |
+---+---+---+---+---+---+---+---+---+---+
  0   1   2   3   4   5   6   7   8   9
```

### ⭐️ Độ phức tạp thời gian khi chèn và xóa phần tử trong LinkedList?

- Chèn/xóa ở đầu: Chỉ cần sửa con trỏ của nút đầu là hoàn thành thao tác chèn/xóa, nên độ phức tạp thời gian là O(1).
- Chèn/xóa ở cuối: Chỉ cần sửa con trỏ của nút cuối là hoàn thành thao tác chèn/xóa, nên độ phức tạp thời gian là O(1).
- Chèn/xóa tại vị trí chỉ định: Cần di chuyển đến vị trí chỉ định trước rồi mới sửa con trỏ của nút chỉ định để hoàn tất chèn/xóa; tuy nhiên vì có con trỏ đầu và cuối nên có thể xuất phát từ con trỏ gần hơn, do đó cần duyệt trung bình n/4 phần tử, độ phức tạp thời gian là O(n).

Dưới đây là một ví dụ minh họa đơn giản: giả sử ta muốn xóa nút 9, trước tiên cần duyệt danh sách liên kết để tìm thấy nút đó. Sau đó mới cập nhật lại hướng trỏ của các nút liên quan; mã nguồn cụ thể có thể tham khảo tại: [Phân tích mã nguồn LinkedList](https://javaguide.cn/java/collection/linkedlist-source-code.html).

![Logic phương thức unlink](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/linkedlist-unlink-e57a9bf4.jpg)

### Tại sao LinkedList không thể hiện thực interface RandomAccess?

`RandomAccess` là một marker interface (interface đánh dấu), dùng để biểu thị rằng lớp hiện thực interface này hỗ trợ truy cập ngẫu nhiên (tức là có thể truy cập nhanh phần tử thông qua chỉ số). Do cấu trúc dữ liệu nền tảng của `LinkedList` là danh sách liên kết, địa chỉ bộ nhớ không liên tục và chỉ có thể định vị qua con trỏ, không hỗ trợ truy cập nhanh ngẫu nhiên, nên nó không thể hiện thực interface `RandomAccess`.

### ⭐️ Sự khác nhau giữa ArrayList và LinkedList?

- **Đảm bảo an toàn luồng hay không:** Cả `ArrayList` và `LinkedList` đều không được đồng bộ, tức là không đảm bảo an toàn luồng (thread-safe).
- **Cấu trúc dữ liệu nền tảng:** `ArrayList` bên dưới sử dụng **mảng `Object`**; `LinkedList` bên dưới sử dụng cấu trúc dữ liệu **danh sách liên kết đôi** (trước JDK 1.6 là danh sách liên kết vòng, JDK 1.7 đã bỏ tính chất vòng. Lưu ý sự khác biệt giữa danh sách liên kết đôi và danh sách liên kết đôi dạng vòng, sẽ được giới thiệu bên dưới!).
- **Việc chèn và xóa có bị ảnh hưởng bởi vị trí phần tử hay không:**
  - `ArrayList` lưu trữ bằng mảng, nên độ phức tạp thời gian khi chèn và xóa phần tử chịu ảnh hưởng bởi vị trí phần tử. Ví dụ: khi gọi phương thức `add(E e)`, `ArrayList` mặc định nối phần tử được chỉ định vào cuối danh sách, trường hợp này độ phức tạp thời gian là O(1). Nhưng nếu muốn chèn hoặc xóa phần tử tại vị trí chỉ định `i` (`add(int index, E element)`), độ phức tạp thời gian là O(n). Vì khi thực hiện thao tác trên, phần tử thứ i và (n-i) phần tử phía sau nó trong collection đều phải dịch chuyển về sau/lên trước một vị trí.
  - `LinkedList` lưu trữ bằng danh sách liên kết, nên việc chèn hoặc xóa phần tử ở đầu và cuối không bị ảnh hưởng bởi vị trí (`add(E e)`, `addFirst(E e)`, `addLast(E e)`, `removeFirst()`, `removeLast()`), độ phức tạp thời gian là O(1); còn nếu muốn chèn hoặc xóa phần tử tại vị trí chỉ định `i` (`add(int index, E element)`, `remove(Object o)`, `remove(int index)`), độ phức tạp thời gian là O(n) vì cần di chuyển tới vị trí chỉ định trước rồi mới chèn và xóa.
- **Có hỗ trợ truy cập ngẫu nhiên nhanh không:** `LinkedList` không hỗ trợ truy cập ngẫu nhiên phần tử hiệu quả, còn `ArrayList` (có hiện thực interface `RandomAccess`) thì hỗ trợ. Truy cập ngẫu nhiên nhanh chính là lấy nhanh đối tượng phần tử thông qua số thứ tự của phần tử (tương ứng với phương thức `get(int index)`).
- **Mức độ tiêu tốn bộ nhớ:** Sự lãng phí không gian của `ArrayList` chủ yếu thể hiện ở việc cuối danh sách luôn dự trữ một lượng dung lượng nhất định, còn chi phí không gian của `LinkedList` thể hiện ở chỗ mỗi phần tử của nó đều tiêu tốn nhiều bộ nhớ hơn `ArrayList` (vì phải lưu cả tham chiếu phần tử kế tiếp trực tiếp, phần tử liền trước trực tiếp và dữ liệu).

Trong các dự án thực tế, chúng ta thường không sử dụng `LinkedList`; hầu như mọi kịch bản cần dùng `LinkedList` đều có thể thay thế bằng `ArrayList`, và hiệu năng thường còn tốt hơn! Ngay cả tác giả của `LinkedList` là Joshua Bloch cũng từng nói ông chưa bao giờ dùng `LinkedList`.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/redisimage-20220412110853807-8b87ce5d.png)

Ngoài ra, đừng theo quán tính mà cho rằng `LinkedList` là danh sách liên kết nên phù hợp nhất cho các kịch bản thêm/xóa phần tử. Như tôi đã nói ở trên, `LinkedList` chỉ đạt độ phức tạp thời gian xấp xỉ O(1) khi chèn hoặc xóa phần tử ở đầu và cuối; các trường hợp thêm/xóa khác đều có độ phức tạp thời gian trung bình là O(n).

#### Nội dung bổ sung: Danh sách liên kết đôi và Danh sách liên kết đôi dạng vòng

**Danh sách liên kết đôi:** Gồm hai con trỏ, một con trỏ `prev` trỏ tới nút trước đó và một con trỏ `next` trỏ tới nút kế tiếp.

![Danh sách liên kết đôi](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/bidirectional-linkedlist-a47e8dae.png)

**Danh sách liên kết đôi dạng vòng:** Con trỏ `next` của nút cuối cùng trỏ tới `head`, còn con trỏ `prev` của `head` trỏ tới nút cuối cùng, tạo thành một vòng khép kín.

![Danh sách liên kết đôi dạng vòng](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/bidirectional-circular-linkedlist-236d879c.png)

#### Nội dung bổ sung: Interface RandomAccess

```java
public interface RandomAccess {
}
```

Khi xem mã nguồn, ta phát hiện thực tế trong interface `RandomAccess` không hề định nghĩa bất kỳ thứ gì. Vì vậy theo tôi, interface `RandomAccess` chỉ đơn giản là một dấu hiệu (marker). Đánh dấu điều gì? Đánh dấu rằng lớp hiện thực interface này có khả năng truy cập ngẫu nhiên.

Trong phương thức `binarySearch()`, nó sẽ kiểm tra xem `list` được truyền vào có phải là một thể hiện của `RandomAccess` hay không: nếu đúng thì gọi `indexedBinarySearch()`, nếu không thì gọi `iteratorBinarySearch()`:

```java
    public static <T>
    int binarySearch(List<? extends Comparable<? super T>> list, T key) {
        if (list instanceof RandomAccess || list.size()<BINARYSEARCH_THRESHOLD)
            return Collections.indexedBinarySearch(list, key);
        else
            return Collections.iteratorBinarySearch(list, key);
    }
```

`ArrayList` hiện thực interface `RandomAccess`, còn `LinkedList` thì không. Tại sao? Tôi cho rằng vẫn liên quan đến cấu trúc dữ liệu nền tảng! `ArrayList` bên dưới là mảng, còn `LinkedList` bên dưới là danh sách liên kết. Mảng vốn dĩ hỗ trợ truy cập ngẫu nhiên với độ phức tạp thời gian O(1), nên được gọi là truy cập ngẫu nhiên nhanh. Danh sách liên kết cần duyệt đến vị trí cụ thể mới truy cập được phần tử tại vị trí đó với độ phức tạp O(n), nên không hỗ trợ truy cập ngẫu nhiên nhanh. `ArrayList` hiện thực interface `RandomAccess` để biểu thị nó có chức năng truy cập ngẫu nhiên nhanh. Interface `RandomAccess` chỉ là dấu hiệu nhận biết, chứ không phải nhờ hiện thực `RandomAccess` thì `ArrayList` mới có khả năng truy cập ngẫu nhiên nhanh!

### ⭐️ Trình bày cơ chế mở rộng dung lượng (resize) của ArrayList

Chi tiết xem bài viết của tác giả tại: [Phân tích cơ chế mở rộng dung lượng ArrayList](https://javaguide.cn/java/collection/arraylist-source-code.html#arraylist-扩容机制分析).

### ⭐️ Fail-Fast và Fail-Safe trong Collections là gì?

`Fail-Fast` và `Fail-Safe` là hai triết lý thiết kế và chiến lược chịu lỗi hoàn toàn trái ngược nhau trong Java Collections Framework khi xử lý vấn đề sửa đổi đồng thời (concurrent modification).

Về `fail-fast`, trích dẫn cách diễn đạt về `fail-fast` và `fail-safe` từ một bài viết trên `Medium`:

> Fail-fast systems are designed to immediately stop functioning upon encountering an unexpected condition. This immediate failure helps to catch errors early, making debugging more straightforward.
> *(Hệ thống fail-fast được thiết kế để ngừng hoạt động ngay lập tức khi gặp điều kiện bất ngờ. Việc lỗi ngay lập tức này giúp phát hiện lỗi sớm và làm cho việc debug trở nên trực quan hơn.)*

Tư tưởng của Fail-Fast là phát hiện sớm và dừng chạy ngay khi phát sinh ngoại lệ tiềm ẩn; nhờ phát hiện và chặn lỗi sớm nhất có thể, nó làm giảm nguy cơ lỗi lan truyền dây chuyền trong hệ thống.

Phần lớn các collection trong gói `java.util` (như `ArrayList`, `HashMap`) không hỗ trợ an toàn luồng (thread-safe). Để có thể phát hiện sớm rủi ro mất an toàn luồng do thao tác đồng thời gây ra, người ta duy trì một biến `modCount` để ghi lại số lần sửa đổi; trong quá trình duyệt bằng iterator, hệ thống đối chiếu số lần sửa đổi kỳ vọng `expectedModCount` và `modCount` xem có khớp nhau không để xác định xem có thao tác đồng thời hay không, qua đó thực hiện Fail-Fast và tránh thực thi các đoạn mã phức tạp không cần thiết khi đã xảy ra bất thường.

**Ví dụ ArrayList (fail-fast):**

```java
     // Sử dụng ArrayList không an toàn luồng, đây là một collection kiểu fail-fast
      List<Integer> list = new ArrayList<>();
      CountDownLatch latch = new CountDownLatch(2);

      for (int i = 0; i < 5; i++) {
          list.add(i);
      }
      System.out.println("Initial list: " + list);

      Thread t1 = new Thread(() -> {
          try {
              for (Integer i : list) {
                  System.out.println("Iterator Thread (t1) sees: " + i);
                  Thread.sleep(100);
              }
          } catch (ConcurrentModificationException e) {
              System.err.println("!!! Iterator Thread (t1) caught ConcurrentModificationException as expected.");
          } catch (InterruptedException e) {
              e.printStackTrace();
          } finally {
              latch.countDown();
          }
      });

      Thread t2 = new Thread(() -> {
          try {
              Thread.sleep(50);
              System.out.println("-> Modifier Thread (t2) is removing element 1...");
              list.remove(Integer.valueOf(1));
              System.out.println("-> Modifier Thread (t2) finished removal.");
          } catch (InterruptedException e) {
              e.printStackTrace();
          } finally {
              latch.countDown();
          }
      });

      t1.start();
      t2.start();
      latch.await();

      System.out.println("Final list state: " + list);
```

Kết quả đầu ra:

```
Initial list: [0, 1, 2, 3, 4]
Iterator Thread (t1) sees: 0
-> Modifier Thread (t2) is removing element 1...
-> Modifier Thread (t2) finished removal.
!!! Iterator Thread (t1) caught ConcurrentModificationException as expected.
Final list state: [0, 2, 3, 4]
```

Sau khi thread `t2` sửa đổi danh sách, ngay ở bước lặp kế tiếp, thread `t1` lập tức ném ra `ConcurrentModificationException`. Lý do là vì iterator của `ArrayList` trong mỗi lần gọi `next()` đều kiểm tra xem `modCount` có bị thay đổi hay không. Một khi phát hiện collection bị sửa đổi mà iterator không hề hay biết, nó sẽ lập tức "fail-fast" để ngăn việc tiếp tục thao tác trên dữ liệu không nhất quán và gây ra hậu quả khó lường.

Để minh họa rõ hơn, dưới đây là phương thức `next` dùng để lấy phần tử tiếp theo ở tầng iterator bên dưới vòng lặp `for`; có thể thấy bên trong nó có phương thức `checkForComodification` chứa logic đối chiếu số lần sửa đổi:

```java
 public E next() {
 			// Kiểm tra xem có sửa đổi đồng thời hay không
            checkForComodification();
            //......
            // Trả về phần tử tiếp theo
            return (E) elementData[lastRet = i];
        }

final void checkForComodification() {
		// Khi số lần sửa đổi hiện tại không khớp với số lần sửa đổi kỳ vọng, ném ra ConcurrentModificationException
            if (modCount != expectedModCount)
                throw new ConcurrentModificationException();
        }

```

Còn `Fail-Safe` hướng tới việc có thể phục hồi và tiếp tục vận hành ngay cả khi đối mặt với tình huống bất ngờ, điều này khiến nó đặc biệt phù hợp với các môi trường không chắc chắn hoặc dễ biến động:

> Fail-safe systems take a different approach, aiming to recover and continue even in the face of unexpected conditions. This makes them particularly suited for uncertain or volatile environments.
> *(Hệ thống fail-safe đi theo hướng tiếp cận khác, hướng tới khả năng phục hồi và tiếp tục vận hành ngay cả khi gặp điều kiện bất ngờ. Điều này khiến chúng đặc biệt phù hợp với các môi trường bất định hoặc nhiều biến động.)*

Tư tưởng này thường được áp dụng trong các container đồng thời (concurrent container), mà hiện thực kinh điển nhất là `CopyOnWriteArrayList`. Thông qua tư tưởng sao chép khi ghi (Copy-On-Write), khi thực hiện thao tác sửa đổi, nó sao chép ra một bản chụp (snapshot); sau khi hoàn tất thao tác thêm hoặc xóa trên bản chụp này, tham chiếu mảng nền tảng của `CopyOnWriteArrayList` được trỏ sang vùng mảng mới này. Nhờ vậy tránh được vấn đề an toàn đồng thời do bị sửa đổi song song trong lúc duyệt. Tất nhiên, cách làm này cũng có nhược điểm: trong quá trình duyệt sẽ không thu được kết quả theo thời gian thực:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/fail-fast-and-fail-safe-copyonwritearraylist-2217c50a.png)

Tương ứng, dưới đây là đoạn mã cốt lõi giúp `CopyOnWriteArrayList` hiện thực `fail-safe`: có thể thấy cách làm của nó là lấy tham chiếu mảng qua `getArray`, sau đó tạo một bản chụp mảng thông qua `Arrays.copyOf`, hoàn tất thao tác thêm trên bản chụp này rồi cập nhật địa chỉ tham chiếu của biến `array` nền tảng để hoàn thành Copy-On-Write:

```java
public boolean add(E e) {
        final ReentrantLock lock = this.lock;
        lock.lock();
        try {
        	// Lấy mảng gốc
            Object[] elements = getArray();
            int len = elements.length;
            // Sao chép một bản chụp bộ nhớ dựa trên mảng gốc
            Object[] newElements = Arrays.copyOf(elements, len + 1);
            // Thực hiện thao tác thêm
            newElements[len] = e;
            // Trỏ array sang mảng mới
            setArray(newElements);
            return true;
        } finally {
            lock.unlock();
        }
    }
```

## Set

### Sự khác nhau giữa Comparable và Comparator

Cả interface `Comparable` và interface `Comparator` đều là các interface dùng cho việc sắp xếp trong Java; chúng đóng vai trò quan trọng trong việc so sánh kích thước và sắp xếp giữa các đối tượng của lớp hiện thực:

- Interface `Comparable` xuất phát từ gói `java.lang`, có phương thức `compareTo(Object obj)` dùng để sắp xếp.
- Interface `Comparator` xuất phát từ gói `java.util`, có phương thức `compare(Object obj1, Object obj2)` dùng để sắp xếp.

Thông thường khi cần sắp xếp tùy chỉnh cho một collection, chúng ta cần ghi đè (`Override`) phương thức `compareTo()` hoặc `compare()`. Khi cần hiện thực hai cách sắp xếp cho cùng một collection — ví dụ một đối tượng `song` được sắp xếp riêng theo tên bài hát và theo tên ca sĩ — ta có thể ghi đè `compareTo()` kết hợp sử dụng thêm một `Comparator` tự định nghĩa, hoặc dùng hai `Comparator` để hiện thực sắp xếp theo tên bài hát và tên ca sĩ; cách thứ hai đồng nghĩa với việc ta chỉ có thể dùng phiên bản hai tham số của `Collections.sort()`.

#### Sắp xếp tùy chỉnh bằng Comparator

```java
ArrayList<Integer> arrayList = new ArrayList<Integer>();
arrayList.add(-1);
arrayList.add(3);
arrayList.add(3);
arrayList.add(-5);
arrayList.add(7);
arrayList.add(4);
arrayList.add(-9);
arrayList.add(-7);
System.out.println("原始数组:");
System.out.println(arrayList);
// void reverse(List list): đảo ngược danh sách
Collections.reverse(arrayList);
System.out.println("Collections.reverse(arrayList):");
System.out.println(arrayList);

// void sort(List list): sắp xếp tăng dần theo thứ tự tự nhiên
Collections.sort(arrayList);
System.out.println("Collections.sort(arrayList):");
System.out.println(arrayList);
// Cách dùng sắp xếp tùy chỉnh
Collections.sort(arrayList, new Comparator<Integer>() {
    @Override
    public int compare(Integer o1, Integer o2) {
        return o2.compareTo(o1);
    }
});
System.out.println("定制排序后：");
System.out.println(arrayList);
```

Kết quả đầu ra:

```plain
原始数组:
[-1, 3, 3, -5, 7, 4, -9, -7]
Collections.reverse(arrayList):
[-7, -9, 4, 7, -5, 3, 3, -1]
Collections.sort(arrayList):
[-9, -7, -5, -1, 3, 3, 4, 7]
定制排序后：
[7, 4, 3, 3, -1, -5, -7, -9]
```

#### Ghi đè phương thức compareTo để sắp xếp theo tuổi

```java
// Lớp Person chưa hiện thực interface Comparable nên bắt buộc phải hiện thực để tránh lỗi và giúp dữ liệu trong TreeMap được sắp xếp theo thứ tự
// Lớp String ở ví dụ trước đã hiện thực mặc định interface Comparable; chi tiết có thể xem tài liệu API của lớp String, ngoài ra các lớp khác
// như Integer cũng đều đã hiện thực interface Comparable nên không cần hiện thực thêm
public  class Person implements Comparable<Person> {
    private String name;
    private int age;

    public Person(String name, int age) {
        super();
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    /**
     * Ghi đè phương thức compareTo để sắp xếp theo tuổi
     */
    @Override
    public int compareTo(Person o) {
        if (this.age > o.getAge()) {
            return 1;
        }
        if (this.age < o.getAge()) {
            return -1;
        }
        return 0;
    }
}

```

```java
    public static void main(String[] args) {
        TreeMap<Person, String> pdata = new TreeMap<Person, String>();
        pdata.put(new Person("张三", 30), "zhangsan");
        pdata.put(new Person("李四", 20), "lisi");
        pdata.put(new Person("王五", 10), "wangwu");
        pdata.put(new Person("小红", 5), "xiaohong");
        // Lấy giá trị key đồng thời lấy giá trị tương ứng với key đó
        Set<Person> keys = pdata.keySet();
        for (Person key : keys) {
            System.out.println(key.getAge() + "-" + key.getName());

        }
    }
```

Kết quả đầu ra:

```plain
5-小红
10-王五
20-李四
30-张三
```

### Tính không có thứ tự và tính không trùng lặp có ý nghĩa gì?

- Tính không có thứ tự không đồng nghĩa với tính ngẫu nhiên. Tính không có thứ tự có nghĩa là dữ liệu lưu trữ không được thêm vào mảng nền tảng theo thứ tự chỉ số của mảng, mà được quyết định dựa trên giá trị băm (hash) của dữ liệu.
- Tính không trùng lặp có nghĩa là khi kiểm tra phần tử được thêm bằng `equals()`, kết quả trả về `false`; cần phải ghi đè đồng thời cả hai phương thức `equals()` và `hashCode()`.

### So sánh điểm giống và khác nhau giữa HashSet, LinkedHashSet và TreeSet

- `HashSet`, `LinkedHashSet` và `TreeSet` đều là các lớp hiện thực của interface `Set`, đều đảm bảo phần tử duy nhất và đều không an toàn luồng (thread-safe).
- Điểm khác biệt chính giữa `HashSet`, `LinkedHashSet` và `TreeSet` nằm ở cấu trúc dữ liệu nền tảng khác nhau. Cấu trúc dữ liệu nền tảng của `HashSet` là bảng băm (hiện thực dựa trên `HashMap`). Cấu trúc dữ liệu nền tảng của `LinkedHashSet` là danh sách liên kết và bảng băm; thứ tự chèn và lấy phần tử thỏa mãn FIFO. Cấu trúc dữ liệu nền tảng của `TreeSet` là cây đỏ-đen (Red-Black Tree); các phần tử có thứ tự, với các cách sắp xếp gồm sắp xếp tự nhiên và sắp xếp tùy chỉnh.
- Cấu trúc dữ liệu nền tảng khác nhau dẫn đến kịch bản ứng dụng của cả ba cũng khác nhau. `HashSet` dùng cho trường hợp không cần đảm bảo thứ tự chèn và lấy phần tử; `LinkedHashSet` dùng cho trường hợp cần đảm bảo thứ tự chèn và lấy phần tử thỏa mãn FIFO; `TreeSet` dùng cho trường hợp cần hỗ trợ quy tắc sắp xếp tùy chỉnh cho phần tử.

## Queue

### Sự khác nhau giữa Queue và Deque

`Queue` là hàng đợi một đầu, chỉ có thể chèn phần tử ở một đầu và xóa phần tử ở đầu còn lại; về mặt hiện thực thường tuân theo quy tắc **Vào trước ra trước (FIFO)**.

`Queue` mở rộng từ interface `Collection` và được chia thành hai nhóm phương thức dựa trên **cách xử lý khác nhau khi thao tác thất bại do vấn đề dung lượng**: một nhóm sẽ ném ra ngoại lệ khi thao tác thất bại, nhóm còn lại sẽ trả về một giá trị đặc biệt.

| Interface `Queue`      | Ném ngoại lệ | Trả về giá trị đặc biệt |
| ---------------------- | ------------ | ----------------------- |
| Chèn vào cuối hàng đợi | add(E e)     | offer(E e)              |
| Xóa ở đầu hàng đợi     | remove()     | poll()                  |
| Xem phần tử đầu        | element()    | peek()                  |

`Deque` là hàng đợi hai đầu (double-ended queue), có thể chèn hoặc xóa phần tử ở cả hai đầu của hàng đợi.

`Deque` mở rộng interface `Queue`, bổ sung thêm các phương thức chèn và xóa ở đầu và cuối hàng đợi, đồng thời cũng chia thành hai nhóm tùy theo cách xử lý khi thất bại:

| Interface `Deque`      | Ném ngoại lệ  | Trả về giá trị đặc biệt |
| ---------------------- | ------------- | ----------------------- |
| Chèn vào đầu hàng đợi  | addFirst(E e) | offerFirst(E e)         |
| Chèn vào cuối hàng đợi | addLast(E e)  | offerLast(E e)          |
| Xóa ở đầu hàng đợi     | removeFirst() | pollFirst()             |
| Xóa ở cuối hàng đợi    | removeLast()  | pollLast()              |
| Xem phần tử đầu        | getFirst()    | peekFirst()             |
| Xem phần tử cuối       | getLast()     | peekLast()              |

Thực tế, `Deque` còn cung cấp các phương thức khác như `push()` và `pop()`, có thể dùng để mô phỏng ngăn xếp (stack).

### Sự khác nhau giữa ArrayDeque và LinkedList

Cả `ArrayDeque` và `LinkedList` đều hiện thực interface `Deque` và đều có chức năng của hàng đợi, vậy giữa chúng có điểm gì khác nhau?

- `ArrayDeque` được hiện thực dựa trên mảng có độ dài thay đổi được và hai con trỏ, còn `LinkedList` được hiện thực thông qua danh sách liên kết.

- `ArrayDeque` không hỗ trợ lưu trữ dữ liệu `NULL`, nhưng `LinkedList` có hỗ trợ.

- `ArrayDeque` mới được đưa vào từ JDK 1.6, còn `LinkedList` đã tồn tại từ JDK 1.2.

- `ArrayDeque` có thể phát sinh quá trình mở rộng dung lượng (`resize`) khi chèn, tuy nhiên độ phức tạp khấu hao của thao tác chèn vẫn là O(1). Mặc dù `LinkedList` không cần mở rộng dung lượng, nhưng mỗi lần chèn dữ liệu đều phải cấp phát vùng nhớ mới trên `Heap`, nên hiệu năng khấu hao nhìn chung chậm hơn.

Xét từ góc độ hiệu năng, chọn `ArrayDeque` để hiện thực hàng đợi tốt hơn so với `LinkedList`. Ngoài ra, `ArrayDeque` cũng có thể được dùng để hiện thực ngăn xếp (stack).

### Trình bày về PriorityQueue

`PriorityQueue` được đưa vào từ JDK 1.5; điểm khác biệt của nó so với `Queue` là thứ tự phần tử ra khỏi hàng đợi phụ thuộc vào độ ưu tiên, tức là phần tử có độ ưu tiên cao nhất luôn ra khỏi hàng đợi trước.

Dưới đây là một số điểm chính liên quan:

- `PriorityQueue` tận dụng cấu trúc dữ liệu đống nhị phân (binary heap) để hiện thực và sử dụng mảng có độ dài thay đổi được ở tầng dưới để lưu trữ dữ liệu.
- Thông qua thao tác đẩy lên (sift up) và đẩy xuống (sift down) các phần tử trong heap, `PriorityQueue` đạt độ phức tạp thời gian O(logn) khi chèn phần tử và xóa phần tử đỉnh heap.
- `PriorityQueue` không an toàn luồng (thread-safe) và không hỗ trợ lưu `NULL`. Khi không truyền `Comparator`, các phần tử bắt buộc phải hiện thực `Comparable`; khi có truyền `Comparator`, các phần tử phải có khả năng so sánh lẫn nhau bằng bộ so sánh đó.
- `PriorityQueue` mặc định là min-heap, nhưng có thể nhận một `Comparator` làm tham số hàm khởi tạo để tự định nghĩa thứ tự ưu tiên của phần tử.

Trong phỏng vấn, `PriorityQueue` thường xuất hiện nhiều hơn khi giải thuật toán trực tiếp (live coding); các bài tập điển hình bao gồm Heap Sort, tìm phần tử lớn thứ K, duyệt đồ thị có trọng số, v.v., vì vậy cần sử dụng thành thạo.

Nếu muốn ôn trước các mẫu thuật toán về Heap và Top K, bạn có thể xem [Giải thích chi tiết về Heap](../../cs-basics/data-structure/heap.md) và [Tổng hợp câu hỏi phỏng vấn bài toán Top K](../../cs-basics/algorithms/top-k.md).

### BlockingQueue là gì?

`BlockingQueue` (hàng đợi chặn) là một interface kế thừa từ `Queue`. Đối với thao tác chèn và lấy bỏ, nó cung cấp bốn cơ chế xử lý: ném ngoại lệ, trả về giá trị đặc biệt, chặn vô thời hạn và chờ có thời hạn (timeout). Trong đó, `take()` có thể chặn khi hàng đợi rỗng, còn `put()` có thể chặn khi hàng đợi bị giới hạn dung lượng đã đầy.

```java
public interface BlockingQueue<E> extends Queue<E> {
  // ...
}
```

`BlockingQueue` thường được sử dụng trong mô hình Producer-Consumer (nhà sản xuất - người tiêu dùng): thread sản xuất thêm dữ liệu vào hàng đợi, còn thread tiêu dùng lấy dữ liệu từ hàng đợi ra để xử lý.

![BlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/blocking-queue-860d78a6.png)

### Các lớp hiện thực của BlockingQueue gồm những lớp nào?

![Các lớp hiện thực của BlockingQueue](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/blocking-queue-hierarchy-755d1cd5.png)

Các lớp hiện thực Blocking Queue phổ biến trong Java bao gồm:

1. `ArrayBlockingQueue`: Blocking Queue có giới hạn (bounded) được hiện thực bằng mảng. Khi khởi tạo cần chỉ định kích thước dung lượng, đồng thời hỗ trợ cả cơ chế truy cập khóa công bằng (Fair Lock) và không công bằng (Non-fair Lock).
2. `LinkedBlockingQueue`: Blocking Queue tùy chọn giới hạn (optionally bounded) được hiện thực bằng danh sách liên kết đơn. Khi khởi tạo có thể chỉ định kích thước dung lượng; nếu không chỉ định thì mặc định là `Integer.MAX_VALUE`. Khác với `ArrayBlockingQueue`, nó chỉ hỗ trợ cơ chế khóa không công bằng (Non-fair Lock).
3. `PriorityBlockingQueue`: Blocking Queue không giới hạn (unbounded) hỗ trợ sắp xếp theo độ ưu tiên. Các phần tử phải hiện thực interface `Comparable` hoặc truyền đối tượng `Comparator` vào hàm khởi tạo, và không thể chèn phần tử `null`.
4. `SynchronousQueue`: Hàng đợi đồng bộ — một loại Blocking Queue không lưu trữ phần tử. Mỗi thao tác chèn phải chờ một thao tác xóa tương ứng, và ngược lại mỗi thao tác xóa cũng phải chờ một thao tác chèn. Do đó, `SynchronousQueue` thường được dùng để truyền dữ liệu trực tiếp giữa các thread.
5. `DelayQueue`: Hàng đợi trễ, trong đó các phần tử chỉ có thể được lấy ra khỏi hàng đợi khi đã hết khoảng thời gian trễ được chỉ định.
6. ……

Trong phát triển hằng ngày, các hàng đợi này thực ra ít được dùng trực tiếp, nắm được để hiểu là đủ.

### ⭐️ ArrayBlockingQueue và LinkedBlockingQueue có điểm gì khác nhau?

`ArrayBlockingQueue` và `LinkedBlockingQueue` là hai hiện thực Blocking Queue phổ biến trong gói concurrency của Java, cả hai đều an toàn luồng (thread-safe). Tuy nhiên, giữa chúng vẫn tồn tại những điểm khác biệt sau đây:

- Hiện thực nền tảng: `ArrayBlockingQueue` được hiện thực dựa trên mảng, còn `LinkedBlockingQueue` được hiện thực dựa trên danh sách liên kết.
- Tính có giới hạn: `ArrayBlockingQueue` là hàng đợi có giới hạn, bắt buộc phải chỉ định kích thước dung lượng khi tạo. `LinkedBlockingQueue` khi tạo có thể không chỉ định kích thước dung lượng và mặc định là `Integer.MAX_VALUE`, tức là không giới hạn; nhưng cũng có thể chỉ định kích thước hàng đợi để trở thành hàng đợi có giới hạn.
- Tách biệt khóa hay không: Trong `ArrayBlockingQueue`, khóa không được tách biệt, tức là sản xuất và tiêu dùng dùng chung một khóa; trong `LinkedBlockingQueue`, khóa được tách biệt — sản xuất dùng `putLock`, tiêu dùng dùng `takeLock`, nhờ đó có thể ngăn chặn tranh chấp khóa giữa các thread Producer và Consumer.
- Mức chiếm dụng bộ nhớ: `ArrayBlockingQueue` cần cấp phát trước bộ nhớ mảng, còn `LinkedBlockingQueue` cấp phát động bộ nhớ cho từng nút của danh sách liên kết. Điều này có nghĩa là `ArrayBlockingQueue` ngay khi khởi tạo đã chiếm một lượng không gian bộ nhớ nhất định và thường xin cấp phát bộ nhớ lớn hơn lượng thực tế sử dụng, trong khi `LinkedBlockingQueue` sẽ tăng dần mức chiếm dụng bộ nhớ theo số lượng phần tử được thêm vào.

## Đọc thêm về cấu trúc dữ liệu

Phỏng vấn về Java Collections thường đào sâu xuống cấu trúc dữ liệu nền tảng. Bạn nên ôn tập kết hợp cùng các bài viết dưới đây:

- [Giải thích chi tiết cấu trúc dữ liệu tuyến tính](../../cs-basics/data-structure/linear-data-structure.md): Hiểu rõ mảng, danh sách liên kết, ngăn xếp, hàng đợi và mối liên hệ với `ArrayList`, `LinkedList`, `ArrayDeque`.
- [Tổng hợp câu hỏi phỏng vấn bảng băm](../../cs-basics/data-structure/hash-table.md): Hiểu xung đột băm, mở rộng dung lượng và tư tưởng nền tảng của `HashMap`.
- [Giải thích chi tiết cây đỏ-đen (Red-Black Tree)](../../cs-basics/data-structure/red-black-tree.md): Hiểu về cây đỏ-đen liên quan trong `TreeMap`, `TreeSet` cũng như khi `HashMap` cây hóa danh sách liên kết.
- [Giải thích chi tiết về Heap](../../cs-basics/data-structure/heap.md): Hiểu cấu trúc nền tảng của `PriorityQueue` và các dạng bài Top K.
