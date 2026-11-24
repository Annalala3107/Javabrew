---
title: Tổng kết 10 thuật toán sắp xếp kinh điển
description: Tổng hợp có hệ thống 10 thuật toán sắp xếp kinh điển kèm so sánh độ phức tạp và tính ổn định, bao gồm nguyên lý cốt lõi và kịch bản áp dụng của sắp xếp so sánh và phi so sánh, giúp lựa chọn và tối ưu nhanh chóng.
category: Kiến thức cơ sở máy tính
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: thuật toán sắp xếp,quick sort,merge sort,heap sort,bubble sort,selection sort,insertion sort,shell sort,bucket sort,counting sort,radix sort,độ phức tạp thời gian,độ phức tạp không gian,tính ổn định
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/10-classical-sorting-algorithms.md
---

<!-- markdownlint-disable MD024 -->

## Mở đầu

Sắp xếp là thao tác sắp đặt một chuỗi các bản ghi theo thứ tự tăng dần hoặc giảm dần dựa trên độ lớn của một hoặc nhiều khóa (key). Thuật toán sắp xếp là phương pháp giúp các bản ghi được xếp đặt theo đúng yêu cầu. Thuật toán sắp xếp rất được coi trọng trong nhiều lĩnh vực, đặc biệt là trong xử lý dữ liệu quy mô lớn. Một thuật toán tối ưu có thể tiết kiệm rất nhiều tài nguyên tính toán. Xét đến các ràng buộc và quy chuẩn dữ liệu đa dạng trong từng bài toán thực tế, để tìm ra một thuật toán phù hợp đòi hỏi phải trải qua nhiều bước phân tích và suy luận.

## Giới thiệu tổng quan

### Tổng hợp các thuật toán sắp xếp

Các thuật toán sắp xếp nội bộ (internal sorting) phổ biến gồm: **Sắp xếp chèn (Insertion Sort)**, **Sắp xếp Shell (Shell Sort)**, **Sắp xếp chọn (Selection Sort)**, **Sắp xếp nổi bọt (Bubble Sort)**, **Sắp xếp trộn (Merge Sort)**, **Sắp xếp nhanh (Quick Sort)**, **Sắp xếp vun đống (Heap Sort)**, **Sắp xếp theo cơ số (Radix Sort)**... Bài viết này chỉ tập trung phân tích các thuật toán sắp xếp nội bộ. Bảng tổng hợp dưới đây khái quát các đặc tính chính:

| Thuật toán sắp xếp | Độ phức tạp thời gian (Trung bình) | Độ phức tạp thời gian (Xấu nhất) | Độ phức tạp thời gian (Tốt nhất) | Độ phức tạp không gian | In-place? | Tính ổn định |
| --- | --- | --- | --- | --- | --- | --- |
| Sắp xếp nổi bọt (Bubble Sort) | O(n^2) | O(n^2) | O(n) | O(1) | Có | Ổn định |
| Sắp xếp chọn (Selection Sort) | O(n^2) | O(n^2) | O(n^2) | O(1) | Có | Không ổn định |
| Sắp xếp chèn (Insertion Sort) | O(n^2) | O(n^2) | O(n) | O(1) | Có | Ổn định |
| Sắp xếp Shell (Shell Sort) | Phụ thuộc vào chuỗi gap | O(n^2) | O(nlogn) | O(1) | Có | Không ổn định |
| Sắp xếp trộn (Merge Sort) | O(nlogn) | O(nlogn) | O(nlogn) | O(n) | Không | Ổn định |
| Sắp xếp nhanh (Quick Sort) | O(nlogn) | O(n^2) | O(nlogn) | Trung bình O(logn), Xấu nhất O(n) | Có | Không ổn định |
| Sắp xếp vun đống (Heap Sort) | O(nlogn) | O(nlogn) | O(nlogn) | O(1) | Có | Không ổn định |
| Sắp xếp đếm (Counting Sort) | O(n+k) | O(n+k) | O(n+k) | O(n+k) | Không | Ổn định |
| Sắp xếp theo thùng (Bucket Sort) | Phụ thuộc vào phân phối dữ liệu | Phụ thuộc vào sắp xếp trong thùng | O(n+k) | O(n+k) | Không | Phụ thuộc vào sắp xếp trong thùng |
| Sắp xếp theo cơ số (Radix Sort) | O(d(n+r)) | O(d(n+r)) | O(d(n+r)) | O(n+r) | Không | Ổn định |

**Giải thích thuật ngữ**:

- **n**: Quy mô dữ liệu, biểu thị số lượng phần tử cần sắp xếp.
- **k**: Phạm vi giá trị đếm hoặc số lượng thùng (bucket), ý nghĩa cụ thể tùy thuộc vào từng thuật toán.
- **d**: Số chữ số tối đa cần xử lý trong Radix Sort.
- **r**: Cơ số (radix) dùng trong Radix Sort, ví dụ với hệ thập phân thì `r=10`.
- **Sắp xếp nội bộ (Internal Sorting)**: Dữ liệu cần sắp xếp có thể nạp toàn bộ vào bộ nhớ chính (RAM), các thao tác sắp xếp chủ yếu diễn ra trong bộ nhớ. Mã nguồn trong bài viết này đều là cài đặt sắp xếp nội bộ.
- **Sắp xếp ngoại vi (External Sorting)**: Khi lượng dữ liệu quá lớn không thể nạp hết vào bộ nhớ, cần nhờ đến bộ nhớ ngoài (như ổ đĩa) để chia thành từng đợt xử lý. Cùng một thuật toán có thể có bản cài đặt trên bộ nhớ trong hoặc biến thể cho sắp xếp ngoài, do đó đây không phải nhãn phân loại cố định của thuật toán.
- **Ổn định (Stable)**: Nếu phần tử A ban đầu đứng trước B và $A=B$, sau khi sắp xếp A vẫn đứng trước B.
- **Không ổn định (Unstable)**: Nếu phần tử A ban đầu đứng trước B và $A=B$, sau khi sắp xếp A có thể bị đưa ra phía sau B.
- **Độ phức tạp thời gian (Time Complexity)**: Mô tả định tính thời gian thực thi của thuật toán.
- **Độ phức tạp không gian (Space Complexity)**: Mô tả định tính dung lượng bộ nhớ thuật toán cần tiêu tốn khi chạy.

### Phân loại thuật toán sắp xếp

10 thuật toán sắp xếp phổ biến có thể chia thành hai nhóm lớn: **Sắp xếp so sánh (Comparison-based Sorting)** và **Sắp xếp phi so sánh (Non-comparison Sorting)**.

![Phân loại thuật toán sắp xếp](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/sort2-20982b02.png)

Các thuật toán quen thuộc như **Quick Sort**, **Merge Sort**, **Heap Sort** và **Bubble Sort** đều thuộc nhóm **thuật toán sắp xếp so sánh**. Nhóm này xác định thứ tự tương đối giữa các phần tử bằng phép so sánh. Trong mô hình so sánh, sắp xếp tổng quát trong trường hợp xấu nhất đòi hỏi `Ω(nlogn)` phép so sánh. Bubble Sort cần nhiều lượt quét, độ phức tạp trung bình là `O(n²)`; Merge Sort và Quick Sort ứng dụng chia để trị để chia bài toán thành các bài toán con nhỏ hơn, đạt độ phức tạp trung bình `O(nlogn)`.

Ưu điểm của sắp xếp so sánh là áp dụng được cho dữ liệu ở mọi quy mô, không quan tâm đến phân phối của dữ liệu. Có thể nói sắp xếp so sánh phù hợp với hầu hết mọi bài toán sắp xếp tổng quát.

Trong khi đó, **Counting Sort**, **Radix Sort**, **Bucket Sort** thuộc nhóm **thuật toán sắp xếp phi so sánh**. Chúng tận dụng các thông tin bổ sung như phạm vi giá trị khóa, phân phối dữ liệu hoặc số lượng chữ số để vượt qua cận dưới của sắp xếp so sánh, tuy nhiên không phải thuật toán nào cũng quét một lượt là xong trong `O(n)`. Counting Sort thường là `O(n+k)`, hiệu năng của Bucket Sort phụ thuộc vào phân phối dữ liệu và thuật toán sắp xếp bên trong từng thùng, còn Radix Sort thường là `O(d(n+r))`.

Sắp xếp phi so sánh có độ phức tạp thời gian thấp, nhưng vì cần tiêu tốn không gian bộ nhớ để xác định vị trí duy nhất nên đòi hỏi các ràng buộc nhất định về quy mô và phân phối dữ liệu.

## Sắp xếp nổi bọt (Bubble Sort)

Bubble Sort là thuật toán sắp xếp đơn giản. Thuật toán duyệt qua dãy cần sắp xếp nhiều lần, so sánh từng cặp phần tử liền kề, nếu thứ tự sai thì hoán đổi chúng lại. Quá trình duyệt được lặp lại cho đến khi không còn cặp nào cần hoán đổi, nghĩa là dãy đã được sắp xếp xong. Tên gọi của thuật toán bắt nguồn từ việc các phần tử nhỏ hơn sẽ từ từ "nổi" lên đầu dãy qua từng lần hoán đổi (hoặc phần tử lớn chìm xuống cuối).

### Các bước thuật toán

1. So sánh hai phần tử liền kề. Nếu phần tử đứng trước lớn hơn phần tử đứng sau, hoán đổi vị trí của chúng;
2. Thực hiện tương tự cho từng cặp phần tử liền kề, từ cặp đầu tiên đến cặp cuối cùng; sau lượt này, phần tử lớn nhất sẽ nằm ở vị trí cuối cùng;
3. Lặp lại các bước trên với tất cả phần tử còn lại, trừ phần tử cuối cùng vừa được xếp đúng;
4. Lặp lại bước 1~3 cho đến khi toàn bộ mảng được sắp xếp hoàn tất.

### Minh họa thuật toán

![Minh họa sắp xếp nổi bọt](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/bubble_sort-672a65a3.gif)

### Cài đặt mã nguồn

```java
/**
 * Sắp xếp nổi bọt (Bubble Sort)
 * @param arr
 * @return arr
 */
public static int[] bubbleSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        // Đặt cờ flag, nếu true nghĩa là vòng lặp không phát sinh hoán đổi,
        // tức dãy đã có thứ tự, hoàn tất sắp xếp.
        boolean flag = true;
        for (int j = 0; j < arr.length - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
                // Có hoán đổi, đổi flag
                flag = false;
            }
        }
        if (flag) {
            break;
        }
    }
    return arr;
}
```

**Ở đây mã nguồn đã được tối ưu nhẹ bằng cờ `flag` (tương đương `is_sorted`), mục đích là tối ưu độ phức tạp thời gian trong trường hợp tốt nhất về `O(n)`, tức là khi mảng đầu vào vốn đã được sắp xếp, thuật toán chỉ mất `O(n)`.**

### Phân tích thuật toán

- **Tính ổn định**: Ổn định
- **Độ phức tạp thời gian**: Tốt nhất: $O(n)$, Xấu nhất: $O(n^2)$, Trung bình: $O(n^2)$
- **Độ phức tạp không gian**: $O(1)$
- **Cách thức sắp xếp**: In-place

## Sắp xếp chọn (Selection Sort)

Selection Sort là thuật toán sắp xếp đơn giản, trực quan, dù gặp bất kỳ dữ liệu nào cũng tốn $O(n^2)$ thời gian. Vì vậy khi cần dùng đến, quy mô dữ liệu càng nhỏ càng tốt. Điểm cộng duy nhất có lẽ là không tốn thêm bộ nhớ bổ sung. Nguyên lý hoạt động: đầu tiên tìm phần tử nhỏ nhất (hoặc lớn nhất) trong dãy chưa sắp xếp, đặt vào vị trí khởi đầu của mảng kết quả, sau đó tiếp tục tìm phần tử nhỏ nhất trong phần còn lại chưa sắp xếp rồi đưa vào cuối phần đã sắp xếp. Cứ thế lặp lại cho đến khi toàn bộ mảng được sắp xếp xong.

### Các bước thuật toán

1. Tìm phần tử nhỏ nhất (hoặc lớn nhất) trong mảng chưa sắp xếp, đưa về vị trí đầu của mảng đã sắp xếp;
2. Tiếp tục tìm phần tử nhỏ nhất (hoặc lớn nhất) trong các phần tử chưa sắp xếp còn lại, đưa vào cuối phần đã sắp xếp;
3. Lặp lại bước 2 cho đến khi toàn bộ phần tử được sắp xếp xong.

### Minh họa thuật toán

![Sắp xếp chọn mỗi lượt chọn phần tử nhỏ nhất đặt vào cuối vùng đã sắp xếp](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/selection_sort-44ff5287.gif)

### Cài đặt mã nguồn

```java
/**
 * Sắp xếp chọn (Selection Sort)
 * @param arr
 * @return arr
 */
public static int[] selectionSort(int[] arr) {
    for (int i = 0; i < arr.length - 1; i++) {
        int minIndex = i;
        for (int j = i + 1; j < arr.length; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }
        if (minIndex != i) {
            int tmp = arr[i];
            arr[i] = arr[minIndex];
            arr[minIndex] = tmp;
        }
    }
    return arr;
}
```

### Phân tích thuật toán

- **Tính ổn định**: Không ổn định
- **Độ phức tạp thời gian**: Tốt nhất: $O(n^2)$, Xấu nhất: $O(n^2)$, Trung bình: $O(n^2)$
- **Độ phức tạp không gian**: $O(1)$
- **Cách thức sắp xếp**: In-place

## Sắp xếp chèn (Insertion Sort)

Insertion Sort là một thuật toán sắp xếp đơn giản và trực quan. Nguyên lý hoạt động là xây dựng dãy có thứ tự: với mỗi phần tử chưa sắp xếp, quét từ sau ra trước trong đoạn đã sắp xếp để tìm vị trí thích hợp và chèn vào. Về mặt cài đặt, Insertion Sort thường dùng cách sắp xếp tại chỗ (in-place, chỉ tốn $O(1)$ không gian bổ sung), do đó trong quá trình quét ngược từ sau ra trước, các phần tử đã sắp xếp sẽ lần lượt bị dịch chuyển về sau để tạo chỗ trống cho phần tử mới.

Cài đặt mã nguồn của Insertion Sort tuy không đơn giản thô ráp như Bubble Sort hay Selection Sort, nhưng nguyên lý của nó lại dễ hình dung nhất—ai từng chơi bài tú lơ khơ xếp bài trên tay đều có thể hiểu ngay. Insertion Sort xây dựng dãy có thứ tự bằng cách lấy từng phần tử chưa xếp, quét ngược trong phần đã xếp để tìm vị trí tương ứng rồi chèn vào.

Tương tự như Bubble Sort, Insertion Sort cũng có một biến thể tối ưu gọi là chèn nhị phân (binary insertion sort).

### Các bước thuật toán

1. Bắt đầu từ phần tử đầu tiên, phần tử này được xem là đã sắp xếp;
2. Lấy phần tử tiếp theo, quét từ sau ra trước trong dãy phần tử đã được sắp xếp;
3. Nếu phần tử đã sắp xếp lớn hơn phần tử mới, dịch phần tử đó sang vị trí tiếp theo;
4. Lặp lại bước 3 cho đến khi tìm được vị trí mà phần tử đã sắp xếp nhỏ hơn hoặc bằng phần tử mới;
5. Chèn phần tử mới vào vị trí đó;
6. Lặp lại các bước 2~5.

### Minh họa thuật toán

![Minh họa quá trình sắp xếp chèn](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/insertion_sort-8adb9197.gif)

### Cài đặt mã nguồn

```java
/**
 * Sắp xếp chèn (Insertion Sort)
 * @param arr
 * @return arr
 */
public static int[] insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int preIndex = i - 1;
        int current = arr[i];
        while (preIndex >= 0 && current < arr[preIndex]) {
            arr[preIndex + 1] = arr[preIndex];
            preIndex -= 1;
        }
        arr[preIndex + 1] = current;
    }
    return arr;
}
```

### Phân tích thuật toán

- **Tính ổn định**: Ổn định
- **Độ phức tạp thời gian**: Tốt nhất: $O(n)$, Xấu nhất: $O(n^2)$, Trung bình: $O(n^2)$
- **Độ phức tạp không gian**: $O(1)$
- **Cách thức sắp xếp**: In-place

## Sắp xếp Shell (Shell Sort)

Shell Sort do Donald Shell đề xuất vào năm 1959. Shell Sort cũng là một dạng sắp xếp chèn, là phiên bản cải tiến hiệu quả hơn của Insertion Sort đơn giản, còn được gọi là thuật toán sắp xếp với bước nhảy giảm dần (diminishing increment sort). Hiệu năng của nó phụ thuộc rất lớn vào chuỗi bước nhảy (gap sequence): một số chuỗi gap được thiết kế sau này có thể đạt cận trên dưới bậc hai (sub-quadratic), nhưng chuỗi Shell nguyên bản được dùng trong bài này ở trường hợp xấu nhất vẫn là $O(n^2)$.

Tư tưởng cơ bản của Shell Sort là: chia toàn bộ dãy cần sắp xếp thành nhiều dãy con theo bước nhảy để thực hiện sắp xếp chèn trực tiếp, đợi đến khi các phần tử trong dãy "cơ bản có thứ tự", mới tiến hành một lượt sắp xếp chèn trực tiếp trên toàn bộ dãy.

### Các bước thuật toán

Xét các bước cơ bản của Shell Sort. Ở đây ta chọn bước nhảy $gap = length/2$, thu hẹp dần bước nhảy theo cách $gap = gap/2$. Cách chọn bước nhảy này có thể biểu diễn bằng một chuỗi $\lbrace \frac{n}{2}, \frac{(n/2)}{2}, \dots, 1 \rbrace$, gọi là **chuỗi bước nhảy (gap sequence)**. Việc lựa chọn và chứng minh chuỗi gap trong Shell Sort là một bài toán toán học khó. Chuỗi gap được chọn ở đây khá phổ biến và là đề xuất gốc của Shell, gọi là Shell increment, tuy nhiên trên thực tế chuỗi này chưa phải tối ưu nhất. Ở đây chúng ta dùng nó làm ví dụ minh họa.

Chia toàn bộ dãy cần sắp xếp thành nhiều dãy con để thực hiện chèn trực tiếp, mô tả thuật toán cụ thể:

- Chọn một chuỗi bước nhảy $\lbrace t_1, t_2, \dots, t_k \rbrace$, trong đó $t_i \gt t_j, i \lt j, t_k = 1$;
- Theo số lượng $k$ bước nhảy, tiến hành $k$ lượt sắp xếp trên dãy;
- Trong mỗi lượt, căn cứ theo bước nhảy $t$ tương ứng, chia dãy thành các dãy con có độ dài $m$, thực hiện chèn trực tiếp trên từng dãy con. Chỉ khi bước nhảy bằng 1, toàn bộ dãy mới được xử lý như một bảng duy nhất với độ dài bằng độ dài toàn mảng.

### Minh họa thuật toán

![Quá trình phân nhóm theo bước nhảy và sắp xếp chèn trong Shell Sort](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/shell_sort-913a592b.png)

### Cài đặt mã nguồn

```java
/**
 * Sắp xếp Shell (Shell Sort)
 *
 * @param arr
 * @return arr
 */
public static int[] shellSort(int[] arr) {
    int n = arr.length;
    int gap = n / 2;
    while (gap > 0) {
        for (int i = gap; i < n; i++) {
            int current = arr[i];
            int preIndex = i - gap;
            // Sắp xếp chèn
            while (preIndex >= 0 && arr[preIndex] > current) {
                arr[preIndex + gap] = arr[preIndex];
                preIndex -= gap;
            }
            arr[preIndex + gap] = current;

        }
        gap /= 2;
    }
    return arr;
}
```

### Phân tích thuật toán

- **Tính ổn định**: Không ổn định
- **Độ phức tạp thời gian**: Tốt nhất: $O(nlogn)$, Xấu nhất: $O(n^2)$, độ phức tạp trung bình phụ thuộc vào chuỗi bước nhảy (gap sequence)
- **Độ phức tạp không gian**: $O(1)$

## Sắp xếp trộn (Merge Sort)

Merge Sort là thuật toán sắp xếp hiệu quả được xây dựng dựa trên thao tác trộn (merge). Đây là ứng dụng hết sức điển hình của phương pháp Chia để trị (Divide and Conquer). Merge Sort là một phương pháp sắp xếp ổn định. Thuật toán tiến hành trộn các dãy con đã có thứ tự để thu được dãy hoàn chỉnh có thứ tự; tức là làm cho từng dãy con có thứ tự trước, rồi làm cho các đoạn dãy con có thứ tự với nhau. Việc gộp hai bảng có thứ tự thành một bảng có thứ tự gọi là trộn 2 đường (2-way merge).

Tương tự Selection Sort, hiệu năng của Merge Sort không bị ảnh hưởng bởi dữ liệu đầu vào, nhưng thể hiện tốt hơn Selection Sort rất nhiều vì luôn duy trì độ phức tạp thời gian $O(nlogn)$. Cái giá phải trả là cần thêm không gian bộ nhớ phụ.

### Các bước thuật toán

Merge Sort là một quá trình đệ quy với điều kiện dừng là khi dãy đầu vào chỉ có một phần tử thì trả về trực tiếp, các bước cụ thể:

1. Nếu mảng đầu vào chỉ có một phần tử, trả về trực tiếp; ngược lại chia mảng độ dài $n$ thành hai dãy con độ dài $n/2$;
2. Áp dụng Merge Sort đệ quy lên hai dãy con này để làm cho chúng có thứ tự;
3. Thiết lập hai con trỏ trỏ vào vị trí bắt đầu của hai dãy con đã sắp xếp;
4. So sánh hai phần tử do hai con trỏ trỏ tới, chọn phần tử nhỏ hơn đưa vào vùng nhớ trộn (dùng chứa kết quả sắp xếp), đồng thời dịch chuyển con trỏ tương ứng sang vị trí kế tiếp;
5. Lặp lại bước 3 ~ 4 cho đến khi một con trỏ đi đến cuối dãy;
6. Sao chép trực tiếp toàn bộ phần tử còn lại của dãy kia vào cuối dãy trộn.

### Minh họa thuật toán

![Merge Sort chia mảng đệ quy và trộn các mảng con có thứ tự](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/merge_sort-1eb5655c.gif)

### Cài đặt mã nguồn

```java
/**
 * Sắp xếp trộn (Merge Sort)
 *
 * @param arr
 * @return arr
 */
public static int[] mergeSort(int[] arr) {
    if (arr.length <= 1) {
        return arr;
    }
    int middle = arr.length / 2;
    int[] arr_1 = Arrays.copyOfRange(arr, 0, middle);
    int[] arr_2 = Arrays.copyOfRange(arr, middle, arr.length);
    return merge(mergeSort(arr_1), mergeSort(arr_2));
}

/**
 * Trộn hai mảng đã sắp xếp
 *
 * @param arr_1
 * @param arr_2
 * @return sorted_arr
 */
public static int[] merge(int[] arr_1, int[] arr_2) {
    int[] sorted_arr = new int[arr_1.length + arr_2.length];
    int idx = 0, idx_1 = 0, idx_2 = 0;
    while (idx_1 < arr_1.length && idx_2 < arr_2.length) {
        if (arr_1[idx_1] <= arr_2[idx_2]) {
            sorted_arr[idx] = arr_1[idx_1];
            idx_1 += 1;
        } else {
            sorted_arr[idx] = arr_2[idx_2];
            idx_2 += 1;
        }
        idx += 1;
    }
    if (idx_1 < arr_1.length) {
        while (idx_1 < arr_1.length) {
            sorted_arr[idx] = arr_1[idx_1];
            idx_1 += 1;
            idx += 1;
        }
    } else {
        while (idx_2 < arr_2.length) {
            sorted_arr[idx] = arr_2[idx_2];
            idx_2 += 1;
            idx += 1;
        }
    }
    return sorted_arr;
}
```

### Phân tích thuật toán

- **Tính ổn định**: Ổn định
- **Độ phức tạp thời gian**: Tốt nhất: $O(nlogn)$, Xấu nhất: $O(nlogn)$, Trung bình: $O(nlogn)$
- **Độ phức tạp không gian**: $O(n)$

## Sắp xếp nhanh (Quick Sort)

Quick Sort vận dụng tư tưởng chia để trị tương tự như Merge Sort. Thoạt nhìn Quick Sort và Merge Sort rất giống nhau: đều thu nhỏ bài toán, sắp xếp các chuỗi con trước rồi gộp lại sau cùng. Điểm khác biệt là Quick Sort xử lý thêm một bước phân vùng (partition) khi chia nhỏ bài toán con, phân hai nhóm dữ liệu thành một nhóm lớn và một nhóm nhỏ, nhờ vậy khi kết hợp cuối cùng không cần phải so sánh lại như Merge Sort. Nhưng cũng chính vì thế, tính bất định trong phân vùng khiến độ phức tạp thời gian của Quick Sort không hoàn toàn cố định.

Tư tưởng cơ bản của Quick Sort: thông qua một lượt sắp xếp, phân chia dãy cần sắp xếp thành hai phần độc lập, trong đó mọi phần tử ở một phần đều nhỏ hơn các phần tử ở phần kia, sau đó tiếp tục đệ quy sắp xếp độc lập hai phần này để đưa toàn bộ dãy về trạng thái có thứ tự.

### Các bước thuật toán

Quick Sort sử dụng chiến lược [Chia để trị (Divide and Conquer)](https://en.wikipedia.org/wiki/Divide-and-conquer_algorithm) để chia một dãy thành hai dãy con (nhỏ hơn và lớn hơn) rồi đệ quy sắp xếp hai dãy con đó. Mô tả thuật toán cụ thể:

1. **Chọn điểm chốt (Pivot)**: Chọn một phần tử trong mảng làm pivot. Để tránh trường hợp xấu nhất, thường chọn ngẫu nhiên.
2. **Phân vùng (Partition)**: Sắp xếp lại dãy sao cho mọi phần tử nhỏ hơn pivot đứng trước pivot, mọi phần tử lớn hơn pivot đứng sau pivot (các phần tử bằng pivot có thể đứng về phía nào cũng được). Sau thao tác này, pivot nằm đúng vị trí cuối cùng của nó trong mảng có thứ tự.
3. **Đệ quy (Recurse)**: Đệ quy thực hiện Quick Sort trên dãy con các phần tử nhỏ hơn pivot và dãy con các phần tử lớn hơn pivot.

**Về mặt hiệu năng, đây chính là điểm khác biệt mấu chốt so với Merge Sort:**

- **Trường hợp trung bình và tốt nhất:** Độ phức tạp thời gian là $O(nlogn)$. Xảy ra khi mỗi lần phân vùng đều chia mảng thành hai nửa bằng nhau.
- **Trường hợp xấu nhất:** Độ phức tạp thời gian thoái hóa về $O(n^2)$. Xảy ra khi mỗi lần chọn pivot đều trúng giá trị nhỏ nhất hoặc lớn nhất của mảng hiện tại—chẳng hạn với mảng đã sắp xếp sẵn mà mỗi lần lại chọn phần tử đầu tiên làm pivot, dẫn đến phân vùng cực kỳ lệch và thuật toán thoái hóa tương tự Bubble Sort. Đây là lý do vì sao việc **chọn pivot ngẫu nhiên** là vô cùng quan trọng.

### Minh họa thuật toán

![Quick Sort ngẫu nhiên chọn pivot và đệ quy phân vùng các mảng con](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/random_quick_sort-76fd9f32.gif)

### Cài đặt mã nguồn

```java
import java.util.concurrent.ThreadLocalRandom;

class Solution {
    public int[] sortArray(int[] a) {
        quick(a, 0, a.length - 1);
        return a;
    }

    // Hàm đệ quy cốt lõi của Quick Sort
    void quick(int[] a, int left, int right) {
        if (left >= right) { // Điều kiện dừng đệ quy: khoảng chỉ có 1 hoặc không có phần tử
            return;
        }
        int p = partition(a, left, right); // Thao tác phân vùng, trả về chỉ số pivot
        quick(a, left, p - 1); // Đệ quy sắp xếp mảng con bên trái
        quick(a, p + 1, right); // Đệ quy sắp xếp mảng con bên phải
    }

    // Hàm phân vùng: chia mảng thành hai phần, nhỏ hơn pivot ở bên trái, lớn hơn ở bên phải
    int partition(int[] a, int left, int right) {
        // Chọn ngẫu nhiên một pivot để tránh trường hợp xấu nhất (như mảng gần như đã sắp xếp)
        int idx = ThreadLocalRandom.current().nextInt(right - left + 1) + left;
        swap(a, left, idx); // Đưa pivot về đầu mảng bên trái
        int pv = a[left]; // Giá trị pivot
        int i = left + 1; // Con trỏ trái, trỏ vào phần tử hiện tại cần kiểm tra
        int j = right; // Con trỏ phải, tìm từ phải sang trái phần tử nhỏ hơn pivot

        while (i <= j) {
            // Con trỏ trái dịch sang phải cho đến khi tìm thấy phần tử >= pivot
            while (i <= j && a[i] < pv) {
                i++;
            }
            // Con trỏ phải dịch sang trái cho đến khi tìm thấy phần tử <= pivot
            while (i <= j && a[j] > pv) {
                j--;
            }
            // Nếu con trỏ trái chưa vượt qua con trỏ phải, hoán đổi hai phần tử sai vị trí
            if (i <= j) {
                swap(a, i, j);
                i++;
                j--;
            }
        }
        // Đặt pivot vào vị trí phân vùng, sao cho bên trái nhỏ hơn và bên phải lớn hơn nó
        swap(a, j, left);
        return j;
    }

    // Hoán đổi vị trí hai phần tử trong mảng
    void swap(int[] a, int i, int j) {
        int t = a[i];
        a[i] = a[j];
        a[j] = t;
    }
}
```

### Phân tích thuật toán

- **Tính ổn định**: Không ổn định
- **Độ phức tạp thời gian**: Tốt nhất: $O(nlogn)$, Xấu nhất: $O(n^2)$, Trung bình: $O(nlogn)$
- **Độ phức tạp không gian**: Trung bình $O(logn)$, Xấu nhất $O(n)$ (ngăn xếp gọi đệ quy)

## Sắp xếp vun đống (Heap Sort)

Heap Sort là thuật toán sắp xếp được thiết kế dựa trên cấu trúc dữ liệu Heap. Heap là một cấu trúc cây nhị phân gần hoàn chỉnh, đồng thời thỏa mãn **tính chất Heap**: **giá trị nút con luôn nhỏ hơn (hoặc lớn hơn) giá trị nút cha**.

### Các bước thuật toán

1. Dựng dãy ban đầu $(R_1, R_2, \dots, R_n)$ thành một Max Heap, đống này đóng vai trò là vùng chưa sắp xếp ban đầu;
2. Hoán đổi phần tử đỉnh đống $R_1$ với phần tử cuối cùng $R_n$, thu được vùng chưa sắp xếp mới $(R_1, R_2, \dots, R_{n-1})$ và vùng đã sắp xếp mới $R_n$, thỏa mãn $R_i \leqslant R_n (i \in 1, 2,\dots, n-1)$;
3. Vì sau khi hoán đổi đỉnh đống mới $R_1$ có thể vi phạm tính chất heap, nên cần hiệu chỉnh vùng chưa sắp xếp $(R_1, R_2, \dots, R_{n-1})$ thành heap mới, sau đó lại hoán đổi $R_1$ với phần tử cuối của vùng chưa sắp xếp để có vùng chưa sắp xếp $(R_1, R_2, \dots, R_{n-2})$ và vùng đã sắp xếp $(R_{n-1}, R_n)$. Lặp lại liên tục quá trình này cho đến khi số phần tử trong vùng đã sắp xếp đạt $n-1$, khi đó toàn bộ quá trình sắp xếp hoàn tất.

### Minh họa thuật toán

![Heap Sort dựng Max Heap và lần lượt lấy ra phần tử đỉnh đống](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/heap_sort-67c4db1d.gif)

### Cài đặt mã nguồn

```java
// Biến toàn cục ghi lại độ dài mảng heap
static int heapLen;

/**
 * Hoán đổi hai phần tử trong mảng
 * @param arr
 * @param i
 * @param j
 */
private static void swap(int[] arr, int i, int j) {
    int tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}

/**
 * Xây dựng Max Heap
 * @param arr
 */
private static void buildMaxHeap(int[] arr) {
    for (int i = arr.length / 2 - 1; i >= 0; i--) {
        heapify(arr, i);
    }
}

/**
 * Hiệu chỉnh thành Max Heap
 * @param arr
 * @param i
 */
private static void heapify(int[] arr, int i) {
    int left = 2 * i + 1;
    int right = 2 * i + 2;
    int largest = i;
    if (right < heapLen && arr[right] > arr[largest]) {
        largest = right;
    }
    if (left < heapLen && arr[left] > arr[largest]) {
        largest = left;
    }
    if (largest != i) {
        swap(arr, largest, i);
        heapify(arr, largest);
    }
}

/**
 * Sắp xếp vun đống (Heap Sort)
 * @param arr
 * @return
 */
public static int[] heapSort(int[] arr) {
    // Chỉ số cuối heap
    heapLen = arr.length;
    // Dựng Max Heap
    buildMaxHeap(arr);
    for (int i = arr.length - 1; i > 0; i--) {
        // Lần lượt chuyển đỉnh heap về cuối heap
        swap(arr, 0, i);
        heapLen -= 1;
        heapify(arr, 0);
    }
    return arr;
}
```

### Phân tích thuật toán

- **Tính ổn định**: Không ổn định
- **Độ phức tạp thời gian**: Tốt nhất: $O(nlogn)$, Xấu nhất: $O(nlogn)$, Trung bình: $O(nlogn)$
- **Độ phức tạp không gian**: $O(1)$

## Sắp xếp đếm (Counting Sort)

Cốt lõi của Counting Sort là chuyển đổi giá trị dữ liệu đầu vào thành khóa (key) lưu trong không gian mảng được cấp phát phụ trợ. Là một thuật toán sắp xếp có độ phức tạp thời gian tuyến tính, **Counting Sort đòi hỏi dữ liệu đầu vào phải là số nguyên có phạm vi xác định**.

Counting Sort là thuật toán sắp xếp ổn định. Thuật toán sử dụng một mảng phụ trợ `C`, trong đó phần tử thứ `i` lưu số lượng phần tử có giá trị bằng `i` trong mảng cần sắp xếp `A`. Sau đó dựa vào mảng `C` để đặt các phần tử của `A` vào đúng vị trí. **Thuật toán chỉ dùng để sắp xếp các số nguyên**.

### Các bước thuật toán

1. Tìm giá trị lớn nhất `max` và nhỏ nhất `min` trong mảng;
2. Tạo một mảng mới `C` có độ dài `max - min + 1`, giá trị mặc định của các phần tử đều là 0;
3. Duyệt qua các phần tử `A[i]` trong mảng gốc `A`, lấy `A[i] - min` làm chỉ số mảng `C`, và tăng số lần xuất hiện `C[A[i] - min]` lên 1;
4. Biến đổi mảng `C`: **giá trị phần tử mới bằng tổng của nó và phần tử liền trước**, tức là khi `i > 0` thì `C[i] = C[i] + C[i - 1]`;
5. Tạo mảng kết quả `R` có độ dài bằng mảng ban đầu;
6. **Duyệt ngược từ sau ra trước** mảng gốc `A`: với mỗi phần tử `A[i]`, lấy `A[i] - min` làm chỉ số tra trong mảng đếm `C` để lấy giá trị `C[A[i] - min]`, khi đó `C[A[i] - min] - 1` chính là vị trí của `A[i]` trong mảng kết quả `R`. Sau khi đặt xong, giảm `count[A[i] - min]` đi 1.

### Minh họa thuật toán

![Counting Sort xác định vị trí có thứ tự thông qua việc đếm số lần xuất hiện của phần tử](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/counting_sort-7605b0f0.gif)

### Cài đặt mã nguồn

```java
/**
 * Lấy giá trị lớn nhất và nhỏ nhất trong mảng
 *
 * @param arr
 * @return
 */
private static int[] getMinAndMax(int[] arr) {
    int maxValue = arr[0];
    int minValue = arr[0];
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] > maxValue) {
            maxValue = arr[i];
        } else if (arr[i] < minValue) {
            minValue = arr[i];
        }
    }
    return new int[] { minValue, maxValue };
}

/**
 * Sắp xếp đếm (Counting Sort)
 *
 * @param arr
 * @return
 */
public static int[] countingSort(int[] arr) {
    if (arr.length < 2) {
        return arr;
    }
    int[] extremum = getMinAndMax(arr);
    int minValue = extremum[0];
    int maxValue = extremum[1];
    int[] countArr = new int[maxValue - minValue + 1];
    int[] result = new int[arr.length];

    for (int i = 0; i < arr.length; i++) {
        countArr[arr[i] - minValue] += 1;
    }
    for (int i = 1; i < countArr.length; i++) {
        countArr[i] += countArr[i - 1];
    }
    for (int i = arr.length - 1; i >= 0; i--) {
        int idx = countArr[arr[i] - minValue] - 1;
        result[idx] = arr[i];
        countArr[arr[i] - minValue] -= 1;
    }
    return result;
}
```

### Phân tích thuật toán

Khi các phần tử đầu vào là $n$ số nguyên nằm trong khoảng từ $0$ đến $k$, thời gian chạy là $O(n+k)$. Counting Sort không phải sắp xếp so sánh nên tốc độ thực thi nhanh hơn bất kỳ thuật toán sắp xếp so sánh nào. Do độ dài mảng đếm `C` phụ thuộc vào phạm vi dữ liệu trong mảng cần sắp xếp (bằng **hiệu số giữa giá trị lớn nhất và nhỏ nhất cộng thêm 1**), điều này khiến Counting Sort tiêu tốn lượng bộ nhớ phụ rất lớn đối với các mảng có dải dữ liệu quá rộng.

- **Tính ổn định**: Ổn định
- **Độ phức tạp thời gian**: Tốt nhất: $O(n+k)$, Xấu nhất: $O(n+k)$, Trung bình: $O(n+k)$
- **Độ phức tạp không gian**: $O(n+k)$

## Sắp xếp theo thùng (Bucket Sort)

Bucket Sort là phiên bản nâng cấp của Counting Sort. Thuật toán tận dụng quan hệ ánh xạ của hàm số, hiệu quả của nó phụ thuộc quyết định vào việc xác định hàm ánh xạ này. Để Bucket Sort đạt hiệu quả cao, cần đảm bảo hai yếu tố:

1. Khi không gian bộ nhớ phụ dồi dào, hãy cố gắng tăng tối đa số lượng thùng (bucket)
2. Hàm ánh xạ được chọn có thể phân phối đều $N$ phần tử đầu vào vào $K$ thùng

Nguyên lý hoạt động của Bucket Sort: giả định dữ liệu đầu vào tuân theo phân phối đều, chia dữ liệu vào một số lượng hữu hạn các thùng, sau đó sắp xếp độc lập từng thùng (có thể sử dụng các thuật toán sắp xếp khác hoặc đệ quy áp dụng Bucket Sort).

### Các bước thuật toán

1. Thiết lập một `bucket_size`, đại diện cho số lượng giá trị phân biệt tối đa mà mỗi thùng có thể chứa;
2. Duyệt qua dữ liệu đầu vào và lần lượt ánh xạ từng phần tử vào thùng tương ứng;
3. Sắp xếp từng thùng không rỗng, có thể dùng thuật toán sắp xếp khác hoặc áp dụng đệ quy Bucket Sort;
4. Nối tuần tự dữ liệu đã sắp xếp từ các thùng không rỗng lại với nhau.

### Minh họa thuật toán

![Bucket Sort phân phối dữ liệu vào nhiều thùng rồi sắp xếp riêng và gộp lại](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/bucket_sort-7aae71fe.gif)

### Cài đặt mã nguồn

```java
/**
 * Lấy giá trị lớn nhất và nhỏ nhất trong danh sách
 * @param arr
 * @return
 */
private static int[] getMinAndMax(List<Integer> arr) {
    int maxValue = arr.get(0);
    int minValue = arr.get(0);
    for (int i : arr) {
        if (i > maxValue) {
            maxValue = i;
        } else if (i < minValue) {
            minValue = i;
        }
    }
    return new int[] { minValue, maxValue };
}

/**
 * Sắp xếp theo thùng (Bucket Sort)
 * @param arr
 * @return
 */
public static List<Integer> bucketSort(List<Integer> arr, int bucket_size) {
    if (bucket_size <= 0) {
        throw new IllegalArgumentException("bucket_size must be positive");
    }
    if (arr.size() < 2) {
        return arr;
    }
    int[] extremum = getMinAndMax(arr);
    int minValue = extremum[0];
    int maxValue = extremum[1];
    int bucket_cnt = (maxValue - minValue) / bucket_size + 1;
    List<List<Integer>> buckets = new ArrayList<>();
    for (int i = 0; i < bucket_cnt; i++) {
        buckets.add(new ArrayList<Integer>());
    }
    for (int element : arr) {
        int idx = (element - minValue) / bucket_size;
        buckets.get(idx).add(element);
    }
    for (int i = 0; i < buckets.size(); i++) {
        if (buckets.get(i).size() > 1) {
            buckets.get(i).sort(Integer::compareTo);
        }
    }
    ArrayList<Integer> result = new ArrayList<>();
    for (List<Integer> bucket : buckets) {
        for (int element : bucket) {
            result.add(element);
        }
    }
    return result;
}
```

### Phân tích thuật toán

- **Tính ổn định**: Phụ thuộc vào thuật toán sắp xếp bên trong thùng. Bản cài đặt hiện tại đưa phần tử vào thùng theo đúng thứ tự gốc và sử dụng `List.sort` vốn có tính ổn định, vì vậy thuật toán mang tính ổn định.
- **Độ phức tạp thời gian**: Bản cài đặt hiện tại có trường hợp tốt nhất là $O(n+k)$; khi dữ liệu phân phối đều, kỳ vọng tiệm cận $O(n+k)$; trường hợp xấu nhất là $O(nlogn+k)$. Nếu đổi sang dùng Insertion Sort bên trong thùng, trường hợp xấu nhất sẽ thoái hóa về $O(n^2)$.
- **Độ phức tạp không gian**: $O(n+k)$

## Sắp xếp theo cơ số (Radix Sort)

Radix Sort cũng là thuật toán sắp xếp phi so sánh, sắp xếp từng chữ số của phần tử, bắt đầu từ chữ số hàng thấp nhất (LSD). Giả sử độ dài mảng là $n$, số chữ số tối đa là $d$, cơ số là $r$, độ phức tạp là $O(d(n+r))$. Cài đặt LSD hệ thập phân dưới đây chỉ hỗ trợ các số nguyên không âm.

Radix Sort hoạt động theo nguyên tắc: sắp xếp theo chữ số hàng thấp trước rồi thu thập; tiếp tục sắp xếp theo chữ số hàng cao hơn rồi thu thập; cứ thế cho đến chữ số hàng cao nhất. Đôi khi một số thuộc tính có thứ tự ưu tiên nhất định, ta sẽ sắp xếp theo ưu tiên thấp trước, rồi sắp xếp theo ưu tiên cao sau. Thứ tự cuối cùng đảm bảo phần tử có độ ưu tiên cao hơn đứng trước, còn khi cùng độ ưu tiên cao thì phần tử có ưu tiên thấp hơn lớn hơn sẽ đứng trước. Do Radix Sort dựa trên từng lượt phân phối và thu thập riêng biệt nên mang tính ổn định.

### Các bước thuật toán

1. Lấy số lớn nhất trong mảng và tính số chữ số của nó, đây chính là số vòng lặp $N$ (ví dụ: số lớn nhất là 1000 thì $N=4$);
2. Gọi `A` là mảng ban đầu; bắt đầu từ chữ số hàng thấp nhất lấy ra từng chữ số để đưa vào mảng `radix`;
3. Áp dụng Counting Sort lên `radix` (tận dụng ưu thế của Counting Sort khi xử lý tập số phạm vi nhỏ);
4. Lần lượt gán các giá trị từ `radix` về lại mảng ban đầu;
5. Lặp lại các bước 2~4 đúng $N$ lần.

### Minh họa thuật toán

![Radix Sort sắp xếp và thu thập các chữ số từ thấp đến cao](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/radix_sort-da1fa3af.gif)

### Cài đặt mã nguồn

```java
/**
 * Sắp xếp theo cơ số (Radix Sort)
 *
 * @param arr
 * @return
 */
public static int[] radixSort(int[] arr) {
    if (arr.length < 2) {
        return arr;
    }
    for (int element : arr) {
        if (element < 0) {
            throw new IllegalArgumentException("radixSort only supports non-negative integers");
        }
    }
    int N = 1;
    int maxValue = arr[0];
    for (int element : arr) {
        if (element > maxValue) {
            maxValue = element;
        }
    }
    while (maxValue / 10 != 0) {
        maxValue = maxValue / 10;
        N += 1;
    }
    for (int i = 0; i < N; i++) {
        List<List<Integer>> radix = new ArrayList<>();
        for (int k = 0; k < 10; k++) {
            radix.add(new ArrayList<Integer>());
        }
        for (int element : arr) {
            int idx = (element / (int) Math.pow(10, i)) % 10;
            radix.get(idx).add(element);
        }
        int idx = 0;
        for (List<Integer> l : radix) {
            for (int n : l) {
                arr[idx++] = n;
            }
        }
    }
    return arr;
}
```

### Phân tích thuật toán

- **Tính ổn định**: Ổn định
- **Độ phức tạp thời gian**: Tốt nhất, xấu nhất và trung bình đều là $O(d(n+r))$
- **Độ phức tạp không gian**: $O(n+r)$

**So sánh Radix Sort vs Counting Sort vs Bucket Sort**

Cả ba thuật toán này đều sử dụng khái niệm thùng (bucket), nhưng cách sử dụng thùng có sự khác biệt rõ rệt:

- Radix Sort: Phân phối thùng dựa trên từng chữ số của giá trị khóa.
- Counting Sort: Mỗi thùng chỉ lưu trữ một giá trị khóa duy nhất.
- Bucket Sort: Mỗi thùng lưu trữ một khoảng giá trị nhất định.

## Tài liệu tham khảo

- [Tổng kết các thuật toán sắp xếp (Nguồn tham khảo chính)](https://www.cnblogs.com/guoyaohua/p/8600214.html)
- <https://en.wikipedia.org/wiki/Sorting_algorithm>
- <https://sort.hust.cc/>

## Trọng tâm ôn tập phỏng vấn

Trong phỏng vấn về thuật toán sắp xếp, người phỏng vấn thường không bắt bạn phải viết tay toàn bộ 10 thuật toán, nhưng bạn phải giải thích rõ ràng về độ phức tạp, tính ổn định, sắp xếp tại chỗ (in-place) và các tình huống ứng dụng phù hợp.

| Thuật toán sắp xếp | Độ phức tạp thời gian TB | Độ phức tạp thời gian xấu nhất | Độ phức tạp không gian | Tính ổn định | In-place? |
| --- | --- | --- | --- | --- | --- |
| Sắp xếp nổi bọt (Bubble Sort) | `O(n^2)` | `O(n^2)` | `O(1)` | Ổn định | Có |
| Sắp xếp chọn (Selection Sort) | `O(n^2)` | `O(n^2)` | `O(1)` | Không ổn định | Có |
| Sắp xếp chèn (Insertion Sort) | `O(n^2)` | `O(n^2)` | `O(1)` | Ổn định | Có |
| Sắp xếp trộn (Merge Sort) | `O(nlogn)` | `O(nlogn)` | `O(n)` | Ổn định | Không |
| Sắp xếp nhanh (Quick Sort) | `O(nlogn)` | `O(n^2)` | Trung bình `O(logn)`, Xấu nhất `O(n)` | Không ổn định | Có |
| Sắp xếp vun đống (Heap Sort) | `O(nlogn)` | `O(nlogn)` | `O(1)` | Không ổn định | Có |
| Sắp xếp đếm (Counting Sort) | `O(n+k)` | `O(n+k)` | `O(n+k)` | Ổn định | Không |
| Sắp xếp theo thùng (Bucket Sort) | Phụ thuộc vào phân phối dữ liệu | Phụ thuộc vào sắp xếp trong thùng | `O(n+k)` | Phụ thuộc vào sắp xếp trong thùng | Không |
| Sắp xếp theo cơ số (Radix Sort) | `O(d(n+r))` | `O(d(n+r))` | `O(n+r)` | Ổn định | Không |

Một số câu hỏi truy vấn thường gặp:

- **Vì sao Quick Sort ở trường hợp xấu nhất là `O(n^2)`? Làm thế nào giảm thiểu xác suất thoái hóa?** Có thể chọn pivot ngẫu nhiên hoặc dùng phương pháp lấy trung vị ba số (median-of-three).
- **Vì sao Merge Sort lại ổn định?** Vì khi trộn, nếu gặp hai phần tử bằng nhau, ta có thể ưu tiên lấy phần tử thuộc mảng con bên trái trước.
- **Vì sao Heap Sort lại không ổn định?** Vì quá trình hiệu chỉnh đống (heapify) và hoán đổi có thể làm xáo trộn thứ tự xuất hiện ban đầu của các phần tử bằng nhau.
- **Khi nào Insertion Sort thể hiện hiệu năng tốt nhất?** Khi mảng cơ bản đã có thứ tự và quy mô mảng không quá lớn.
- **Vì sao Counting Sort, Bucket Sort, Radix Sort không phải là thuật toán sắp xếp tổng quát?** Vì chúng phụ thuộc vào phạm vi giá trị, phân phối hoặc số lượng chữ số của dữ liệu.

## Template mã nguồn Java

Khi phỏng vấn viết tay code thuật toán sắp xếp, hai thuật toán hay gặp nhất là Quick Sort và Merge Sort. Với Quick Sort, cần đặc biệt lưu ý ranh giới phân vùng, dưới đây là cách viết thông dụng:

```java
void quickSort(int[] nums, int left, int right) {
    if (left >= right) {
        return;
    }
    int pivotIndex = partition(nums, left, right);
    quickSort(nums, left, pivotIndex - 1);
    quickSort(nums, pivotIndex + 1, right);
}

int partition(int[] nums, int left, int right) {
    int pivot = nums[right];
    int less = left;
    for (int i = left; i < right; i++) {
        if (nums[i] <= pivot) {
            swap(nums, less, i);
            less++;
        }
    }
    swap(nums, less, right);
    return less;
}

void swap(int[] nums, int i, int j) {
    int temp = nums[i];
    nums[i] = nums[j];
    nums[j] = temp;
}
```

Nếu lo ngại mảng đã có thứ tự khiến Quick Sort bị thoái hóa, có thể chọn ngẫu nhiên pivot trước khi phân vùng và hoán đổi nó về vị trí `right`:

```java
int randomIndex = left + new Random().nextInt(right - left + 1);
swap(nums, randomIndex, right);
```

## Sơ đồ quy trình và các ca biên (edge cases)

Một lượt phân vùng của Quick Sort có thể hình dung như sau:

```text
Khoảng mảng ban đầu: [left ... right]
pivot: chọn nums[right]
less: trỏ tới vị trí tiếp theo của "vùng nhỏ hơn hoặc bằng pivot"
i: quét từ left đến right - 1

Sau khi quét xong:
[left ... less - 1] <= pivot
[less ... right - 1] > pivot
Đổi pivot về vị trí less, rồi đệ quy độc lập hai phía trái phải của pivot
```

Một số trường hợp biên nên tự rà soát trước khi viết code:

- **Mảng rỗng hoặc chỉ có một phần tử:** Trả về trực tiếp.
- **Đã có thứ tự hoặc có thứ tự ngược:** Việc cố định chọn phần tử đầu hoặc cuối làm pivot rất dễ thoái hóa.
- **Có lượng lớn phần tử trùng lặp:** Phân vùng 2 chiều thông thường có thể không tối ưu, có thể tìm hiểu thêm phân vùng 3 chiều (3-way quick sort).
- **Khi người phỏng vấn hỏi về tính ổn định:** Tuyệt đối không trả lời Quick Sort ổn định; các thao tác hoán đổi phần tử của Quick Sort thông thường sẽ phá vỡ thứ tự tương đối của các phần tử bằng nhau.
