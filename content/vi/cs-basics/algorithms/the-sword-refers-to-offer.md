---
title: Tuyển tập các bài toán lập trình trong "Kiếm Chỉ Offer" (Point to Offer)
description: Tuyển chọn các bài toán lập trình kinh điển trong "Kiếm Chỉ Offer", cung cấp nhiều hướng tư duy và ví dụ như đệ quy và lặp để ôn tập hiệu quả các dạng bài phỏng vấn tần suất cao.
category: Kiến thức cơ sở máy tính
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: Kiếm Chỉ Offer,Sword Refers to Offer,Fibonacci,đệ quy,lặp,danh sách liên kết,mảng,câu hỏi phỏng vấn
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/the-sword-refers-to-offer.md
---

# Tuyển tập các bài toán lập trình trong "Kiếm Chỉ Offer"

## Dãy số Fibonacci

**Mô tả bài toán:**

Chắc hẳn mọi người đều đã quen thuộc với dãy số Fibonacci. Đề bài yêu cầu nhập vào một số nguyên $n$, hãy in ra số hạng thứ $n$ của dãy Fibonacci, với $n \le 39$.

**Phân tích bài toán:**

Chắc chắn bài này giải bằng phương pháp đệ quy thì hoàn toàn làm được, tuy nhiên cách này sẽ gặp vấn đề rất lớn: đệ quy tạo ra lượng tính toán trùng lặp khổng lồ dẫn đến tràn bộ nhớ (hoặc thời gian chạy quá lâu). Ngoài ra ta có thể dùng phương pháp lặp (iteration), sử dụng các biến `first` và `second` để lưu kết quả trong quá trình tính toán và tái sử dụng chúng. Dưới đây tôi sẽ đưa ra mã nguồn mẫu của cả hai phương pháp kèm theo so sánh.

**Mã nguồn mẫu:**

Sử dụng phương pháp lặp:

```java
int Fibonacci(int number) {
    if (number <= 0) {
        return 0;
    }
    if (number == 1 || number == 2) {
        return 1;
    }
    int first = 1, second = 1, third = 0;
    for (int i = 3; i <= number; i++) {
        third = first + second;
        first = second;
        second = third;
    }
    return third;
}
```

Sử dụng phương pháp đệ quy:

```java
public int Fibonacci(int n) {
    if (n <= 0) {
        return 0;
    }
    if (n == 1||n==2) {
        return 1;
    }

    return Fibonacci(n - 2) + Fibonacci(n - 1);
}
```

## Bài toán ếch nhảy bậc thang

**Mô tả bài toán:**

Một con ếch mỗi lần có thể nhảy lên 1 bậc hoặc 2 bậc. Hỏi có tổng cộng bao nhiêu cách nhảy để con ếch nhảy lên hết một cầu thang gồm $n$ bậc?

**Phân tích bài toán:**

Cách phân tích thông thường:

> a. Nếu có 2 cách nhảy, 1 bậc hoặc 2 bậc: giả sử lần nhảy đầu tiên nhảy 1 bậc, thì số bậc còn lại là $n-1$, số cách nhảy là $f(n-1)$;
> b. Giả sử lần nhảy đầu tiên nhảy 2 bậc, thì số bậc còn lại là $n-2$, số cách nhảy là $f(n-2)$;
> c. Từ hai giả định a và b suy ra tổng số cách nhảy là: $f(n) = f(n-1) + f(n-2)$;
> d. Sau đó căn cứ theo tình huống thực tế suy ra: khi chỉ có 1 bậc thì $f(1) = 1$, khi có 2 bậc thì $f(2) = 2$.

Cách phân tích tìm quy luật:

> $f(1) = 1, f(2) = 2, f(3) = 3, f(4) = 5$, từ đó có thể tổng kết quy luật $f(n) = f(n-1) + f(n-2)$. Nhưng vì sao lại xuất hiện quy luật như vậy? Giả sử hiện tại có 6 bậc, ta có thể từ bậc 5 nhảy 1 bước lên bậc 6 (như vậy có bao nhiêu cách nhảy đến bậc 5 thì sẽ có bấy nhiêu cách nhảy đến bậc 6 theo hướng này), ngoài ra ta cũng có thể từ bậc 4 nhảy 2 bước lên bậc 6 (như vậy có bao nhiêu cách nhảy đến bậc 4 thì sẽ có bấy nhiêu cách nhảy đến bậc 6 theo hướng này), không thể từ bậc 3 nhảy một bước lên bậc 6 được, vì vậy cuối cùng $f(6) = f(5) + f(4)$. Tư duy này cũng giúp hiểu rất dễ dàng bài toán ếch nhảy bậc thang biến thái.

**Vì vậy bài toán này thực chất chính là bài toán dãy số Fibonacci.**

Mã nguồn chỉ cần sửa đổi một chút từ bài toán trước. Điểm khác biệt duy nhất là các phần tử khởi đầu trong bài này lần lượt là 1, 2, 3, 5, 8... trong khi bài trước là 1, 1, 2, 3, 5... Ngoài ra bài này cũng có thể dùng đệ quy, nhưng vì hiệu suất đệ quy quá thấp nên ở đây tôi chỉ cung cấp mã nguồn theo phương pháp lặp.

**Mã nguồn mẫu:**

```java
int jumpFloor(int number) {
    if (number <= 0) {
        return 0;
    }
    if (number == 1) {
        return 1;
    }
    if (number == 2) {
        return 2;
    }
    int first = 1, second = 2, third = 0;
    for (int i = 3; i <= number; i++) {
        third = first + second;
        first = second;
        second = third;
    }
    return third;
}
```

## Bài toán ếch nhảy bậc thang biến thái (nhảy tùy ý)

**Mô tả bài toán:**

Một con ếch mỗi lần có thể nhảy lên 1 bậc, 2 bậc... hoặc có thể nhảy một bước lên $n$ bậc. Hỏi con ếch có tổng cộng bao nhiêu cách nhảy để lên hết một cầu thang gồm $n$ bậc?

**Phân tích bài toán:**

Giả sử $n \ge 2$, bước đầu tiên có $n$ cách nhảy: nhảy 1 bậc, nhảy 2 bậc... cho đến nhảy $n$ bậc:
- Nhảy 1 bậc, còn lại $n-1$ bậc, số cách nhảy còn lại là $f(n-1)$
- Nhảy 2 bậc, còn lại $n-2$ bậc, số cách nhảy còn lại là $f(n-2)$
- ...
- Nhảy $n-1$ bậc, còn lại 1 bậc, số cách nhảy còn lại là $f(1)$
- Nhảy $n$ bậc, còn lại 0 bậc, số cách nhảy còn lại là $f(0)$

Do đó trong trường hợp $n \ge 2$:
$f(n) = f(n-1) + f(n-2) + \dots + f(1)$
Vì $f(n-1) = f(n-2) + f(n-3) + \dots + f(1)$
Nên lấy hiệu hai vế ta được: $f(n) = 2 \times f(n-1)$. Lại có $f(1) = 1$, do đó suy ra: **$f(n) = 2^{number-1}$**.

**Mã nguồn mẫu:**

```java
int JumpFloorII(int number) {
    return 1 << --number; // 2^(number-1) dùng phép dịch bit sẽ nhanh hơn
}
```

**Bổ sung:**

Trong Java có 3 toán tử dịch bit:

1. `<<`: **Toán tử dịch trái**, tương đương nhân với $2^n$
2. `>>`: **Toán tử dịch phải có dấu**, tương đương chia cho $2^n$
3. `>>>`: **Toán tử dịch phải không dấu**, bất kể bit cao nhất trước khi dịch là 0 hay 1, các vị trí trống bên trái sinh ra sau khi dịch đều được lấp đầy bằng 0.

```java
int a = 16;
int b = a << 2; // Dịch trái 2, tương đương 16 * 2^2, tức là 16 * 4
int c = a >> 2; // Dịch phải 2, tương đương 16 / 2^2, tức là 16 / 4
```

## Tìm kiếm trong mảng hai chiều

**Mô tả bài toán:**

Trong một mảng hai chiều, mỗi hàng đều được sắp xếp theo thứ tự tăng dần từ trái sang phải, và mỗi cột đều được sắp xếp theo thứ tự tăng dần từ trên xuống dưới. Hãy hoàn thành một hàm nhận vào một mảng hai chiều như vậy và một số nguyên, phán đoán xem mảng có chứa số nguyên đó hay không.

**Phân tích bài toán:**

Bài này tương đối đơn giản, điều ta cần cân nhắc là làm sao để đạt hiệu suất nhanh nhất. Dưới đây là một hướng tư duy rất dễ hiểu:

> Ma trận đã có thứ tự. Nếu nhìn từ góc dưới cùng bên trái, đi lên phía trên các số sẽ giảm dần, đi sang bên phải các số sẽ tăng dần.
> Vì vậy hãy bắt đầu tìm kiếm từ góc dưới cùng bên trái: khi số cần tìm lớn hơn số ở góc dưới trái, ta dịch sang phải;
> Khi số cần tìm nhỏ hơn số ở góc dưới trái, ta dịch lên trên. Cách tìm này đạt tốc độ nhanh nhất.

**Mã nguồn mẫu:**

```java
public boolean Find(int target, int [][] array) {
    // Ý tưởng cơ bản: bắt đầu tìm từ góc dưới cùng bên trái để đạt tốc độ nhanh nhất
    int row = array.length-1; // Hàng
    int column = 0; // Cột
    // Điều kiện lặp thỏa mãn khi số hàng >= 0 và số cột hiện tại < tổng số cột
    while((row >= 0)&& (column< array[0].length)){
        if(array[row][column] > target){
            row--;
        }else if(array[row][column] < target){
            column++;
        }else{
            return true;
        }
    }
    return false;
}
```

## Thay thế khoảng trắng

**Mô tả bài toán:**

Hãy hiện thực một hàm thay thế tất cả khoảng trắng trong một chuỗi ký tự thành `"%20"`. Ví dụ: khi chuỗi là `"We Are Happy."`, chuỗi sau khi thay thế sẽ là `"We%20Are%20Happy."`.

**Phân tích bài toán:**

Bài toán này không khó, ta có thể duyệt qua từng ký tự của chuỗi: nếu là khoảng trắng thì dùng phương thức `append()` nối thêm `"%20"`, ngược lại vẫn nối ký tự gốc.

Ngoài ra cũng có thể dùng trực tiếp `String.replace()` để thay thế khoảng trắng nguyên văn chỉ với một dòng code.

**Mã nguồn mẫu:**

Cách làm thông thường:

```java
public String replaceSpace(StringBuffer str) {
    StringBuffer out = new StringBuffer();
    for (int i = 0; i < str.toString().length(); i++) {
        char b = str.charAt(i);
        if(String.valueOf(b).equals(" ")){
            out.append("%20");
        }else{
            out.append(b);
        }
    }
    return out.toString();
}
```

Cách làm một dòng:

```java
public String replaceSpace(StringBuffer str) {
    return str.toString().replace(" ", "%20");
}
```

## Lũy thừa nguyên của một số

**Mô tả bài toán:**

Cho một số thực dấu phẩy động `base` kiểu `double` và một số nguyên `exponent` kiểu `int`, hãy tính `base` lũy thừa `exponent`.

**Phân tích bài toán:**

Bài này có thể áp dụng thuật toán **lũy thừa nhanh (fast power / binary exponentiation)**. Cần đặc biệt xử lý hai trường hợp biên: khi cơ số bằng 0 và số mũ âm thì không thể lấy nghịch đảo; khi số mũ là `Integer.MIN_VALUE`, nếu đổi dấu âm trực tiếp sẽ bị tràn số nguyên, do đó cần chuyển số mũ sang kiểu `long` trước.

Đối với điều kiện nghiệp vụ "cơ số có chính xác bằng 0 hay không", có thể trực tiếp dùng `base == 0.0` để phán đoán. Việc dùng sai số epsilon so sánh có thể khiến các cơ số rất nhỏ nhưng khác 0 bị nhận định nhầm thành 0.

Lũy thừa nhanh chia đôi số mũ ở mỗi vòng lặp: khi bit thấp nhất của số mũ hiện tại là 1, nhân cơ số hiện tại vào kết quả; sau đó bình phương cơ số và dịch phải số mũ 1 bit. Độ phức tạp thời gian là $O(logn)$.

**Độ phức tạp thời gian**: $O(logn)$

**Mã nguồn mẫu:**

```java
public class Solution {
    public double Power(double base, int exponent) {
        if (base == 0.0 && exponent < 0) {
            throw new ArithmeticException("zero cannot be raised to a negative exponent");
        }

        long exp = exponent;
        if (exp < 0) {
            base = 1.0 / base;
            exp = -exp;
        }

        double result = 1.0;
        while (exp > 0) {
            if ((exp & 1L) != 0) {
                result *= base;
            }
            base *= base;
            exp >>= 1;
        }
        return result;
    }
}
```

Tất nhiên bài này cũng có thể dùng cách thủ công: nhân dồn. Nhưng cách này có độ phức tạp thời gian $O(n)$, hiệu suất không cao bằng phương pháp trên.

```java
// Dùng phép nhân dồn
public double powerAnother(double base, int exponent) {
    if (base == 0.0 && exponent < 0) {
        throw new ArithmeticException("zero cannot be raised to a negative exponent");
    }
    long exp = exponent;
    if (exp < 0) {
        exp = -exp;
    }
    double result = 1.0;
    for (long i = 0; i < exp; i++) {
        result *= base;
    }
    if (exponent >= 0) {
        return result;
    }
    return 1.0 / result;
}
```

## Điều chỉnh thứ tự mảng sao cho số lẻ đứng trước số chẵn

**Mô tả bài toán:**

Cho một mảng số nguyên, hãy viết hàm điều chỉnh thứ tự các số trong mảng sao cho tất cả số lẻ nằm ở nửa đầu của mảng, tất cả số chẵn nằm ở nửa sau của mảng, đồng thời đảm bảo thứ tự tương đối giữa các số lẻ với nhau và giữa các số chẵn với nhau không bị thay đổi (tính ổn định).

**Phân tích bài toán:**

Bài này có khá nhiều cách giải, xin giới thiệu một cách tiếp cận trực quan, dễ hiểu:
Đầu tiên đếm số lượng số lẻ trong mảng, giả sử là $n$. Tiếp theo tạo một mảng mới có cùng độ dài, duyệt qua mảng ban đầu để kiểm tra từng phần tử là chẵn hay lẻ. Nếu là số lẻ thì bắt đầu thêm vào mảng mới từ chỉ số 0; nếu là số chẵn thì bắt đầu thêm vào mảng mới từ chỉ số $n$.

**Mã nguồn mẫu:**

Thuật toán có độ phức tạp thời gian $O(n)$, độ phức tạp không gian $O(n)$:

```java
public class Solution {
    public void reOrderArray(int [] array) {
        // Nếu độ dài mảng bằng 0 hoặc bằng 1 thì không cần làm gì, trả về trực tiếp
        if(array.length==0||array.length==1)
            return;
        // oddCount: lưu số lượng số lẻ
        // oddBegin: số lẻ được thêm từ đầu mảng mới
        int oddCount=0,oddBegin=0;
        // Tạo một mảng mới
        int[] newArray=new int[array.length];
        // Đếm số lượng số lẻ trong mảng
        for(int i=0;i<array.length;i++){
            if((array[i]&1)==1) oddCount++;
        }
        for(int i=0;i<array.length;i++){
            // Nếu là số lẻ thì thêm từ đầu mảng mới
            // Nếu là số chẵn thì thêm từ vị trí oddCount (số lượng số lẻ trong mảng)
            if((array[i]&1)==1)
                newArray[oddBegin++]=array[i];
            else newArray[oddCount++]=array[i];
        }
        for(int i=0;i<array.length;i++){
            array[i]=newArray[i];
        }
    }
}
```

## Nút thứ k tính từ cuối danh sách liên kết

**Mô tả bài toán:**

Cho một danh sách liên kết, hãy trả về nút thứ $k$ tính từ cuối danh sách lên.

**Phân tích bài toán:**

**Khái quát trong một câu:**
Dùng hai con trỏ, con trỏ `p1` chạy trước. Sau khi `p1` đã đi được $k-1$ nút thì con trỏ `p2` bắt đầu chạy. Khi `p1` chạm đến nút cuối cùng thì `p2` chính là nút trỏ vào vị trí thứ $k$ tính từ cuối danh sách.

**Diễn giải trực quan về tư tưởng:**
Giả thiết tiền đề: số lượng nút (độ dài) của danh sách liên kết là $n$.
Quy luật 1: Để tìm nút thứ $k$ tính từ cuối lên, cần tiến về phía trước bao nhiêu bước? Ví dụ nút thứ nhất tính từ cuối (nút cuối cùng) cần đi $n$ bước, vậy nút thứ hai tính từ cuối thì sao? Rõ ràng là đi $n-1$ bước, do đó ta tìm được quy luật: để đến nút thứ $k$ tính từ cuối lên, cần đi từ đầu $n-k+1$ bước.

**Các bước thuật toán:**

1. Đặt hai con trỏ `p1` và `p2` cùng trỏ vào `head`. Khi `p1` đi được $k-1$ bước thì dừng lại. Trước đó `p2` hoàn toàn đứng yên.
2. Bước tiếp theo của `p1` là đi bước thứ $k$, lúc này `p2` bắt đầu di chuyển cùng nhịp với `p1`. Vì sao lúc này `p2` mới bắt đầu chạy? Xem phân tích bên dưới.
3. Khi `p1` đi đến cuối danh sách liên kết, tức là `p1` đã đi $n$ bước. Vì ta biết `p2` chỉ bắt đầu chạy sau khi `p1` đã đi được $k-1$ bước, nghĩa là `p1` và `p2` vĩnh viễn cách nhau $k-1$ bước. Do đó khi `p1` đi được $n$ bước thì `p2` đã đi được $n-(k-1) = n-k+1$ bước. Điều kỳ diệu là lúc này `p2` trỏ đúng vào vị trí nút thứ $k$ tính từ cuối lên theo Quy luật 1.
Giải thích như vậy có phải rất dễ hình dung không?

**Nội dung kiểm tra:**

Danh sách liên kết (Linked List) + tính ổn định vững chắc của mã nguồn (code robustness).

**Mã nguồn mẫu:**

```java
/*
// Lớp nút danh sách liên kết
public class ListNode {
    int val;
    ListNode next = null;

    ListNode(int val) {
        this.val = val;
    }
}*/

// Độ phức tạp thời gian O(n), chỉ cần duyệt 1 lần
public class Solution {
    public ListNode FindKthToTail(ListNode head,int k) {
        ListNode pre=null,p=null;
        // Cả hai con trỏ đều trỏ vào nút đầu
        p=head;
        pre=head;
        // Ghi lại giá trị k
        int a=k;
        // Ghi lại số lượng nút
        int count=0;
        // Con trỏ p chạy trước và đếm số nút; khi p chạy được k-1 nút thì pre bắt đầu chạy;
        // khi p chạy đến cuối cùng thì con trỏ pre trỏ đúng nút thứ k tính từ cuối lên
        while(p!=null){
            p=p.next;
            count++;
            if(k<1){
                pre=pre.next;
            }
            k--;
        }
        // Nếu số lượng nút nhỏ hơn k cần tìm thì trả về null
        if(count<a) return null;
        return pre;

    }
}
```

## Đảo ngược danh sách liên kết

**Mô tả bài toán:**

Cho một danh sách liên kết, sau khi đảo ngược danh sách liên kết, hãy in ra tất cả các phần tử của danh sách đó.

**Phân tích bài toán:**

Đây là bài toán hết sức kinh điển về danh sách liên kết. Hướng tư duy bài này không khó, nhưng khi tự tay cài đặt có thể bạn sẽ thấy bỡ ngỡ chưa biết bắt đầu từ đâu. Ở đây chúng ta tham khảo hướng tiếp cận chuẩn mực.
Tư tưởng là căn cứ vào đặc điểm của danh sách liên kết (nút trước trỏ vào nút sau), ta đảo chiều con trỏ để các nút phía sau trỏ ngược lại nút phía trước.
Như hình vẽ dưới đây: ta đổi chiều giữa nút 1 và nút 2, sau đó cho nút 3 trỏ về nút 2, nút 4 trỏ về nút 3, cứ thế danh sách liên kết sẽ được đảo ngược hoàn toàn.

![Quá trình đảo ngược con trỏ giữa các nút liền kề trong danh sách liên kết](/media/jg/ext/oss.javaguide.cn/p3-juejin/844773c7300e4373922bb1a6ae2a55a3-tplv-k3u1fbpfcp-e8aa0d0f.png)

**Nội dung kiểm tra:**

Danh sách liên kết + tính vững chắc của mã nguồn (code robustness).

**Mã nguồn mẫu:**

```java
/*
public class ListNode {
    int val;
    ListNode next = null;

    ListNode(int val) {
        this.val = val;
    }
}*/
public class Solution {
    public ListNode ReverseList(ListNode head) {
       ListNode next = null;
       ListNode pre = null;
        while (head != null) {
              // Lưu nút tiếp theo cần đảo ngược
               next = head.next;
               // Đảo chiều: nút hiện tại trỏ về nút liền trước đã đảo ngược
               head.next = pre;
               // Cập nhật nút liền trước tiến lên nút hiện tại
               pre = head;
               // Tiến con trỏ head về phía sau danh sách
               head = next;
        }
        return pre;
    }
}
```

## Gộp hai danh sách liên kết đã sắp xếp

**Mô tả bài toán:**

Cho hai danh sách liên kết đơn đã sắp xếp tăng dần, hãy gộp hai danh sách lại thành một danh sách liên kết duy nhất thỏa mãn thứ tự không giảm.

**Phân tích bài toán:**

Ta có thể phân tích như sau:

1. Giả sử ta có hai danh sách liên kết $A$ và $B$;
2. So sánh giá trị nút đầu $A_1$ của $A$ với nút đầu $B_1$ của $B$, giả sử $A_1$ nhỏ hơn thì chọn $A_1$ làm nút đầu danh sách gộp;
3. Tiếp tục so sánh $A_2$ với $B_1$, giả sử $B_1$ nhỏ hơn thì cho $A_1$ trỏ vào $B_1$;
4. Tiếp tục so sánh $A_2$ với $B_2$...
Cứ lặp đi lặp lại như vậy là xong, logic rất rõ ràng và dễ hiểu.

**Nội dung kiểm tra:**

Danh sách liên kết + tính vững chắc của mã nguồn (code robustness).

**Mã nguồn mẫu:**

Phiên bản không đệ quy (lặp):

```java
/*
public class ListNode {
    int val;
    ListNode next = null;

    ListNode(int val) {
        this.val = val;
    }
}*/
public class Solution {
    public ListNode Merge(ListNode list1,ListNode list2) {
       // list1 rỗng, trả về list2 trực tiếp
       if(list1 == null){
            return list2;
        }
        // list2 rỗng, trả về list1 trực tiếp
        if(list2 == null){
            return list1;
        }
        ListNode mergeHead = null;
        ListNode current = null;
        // Khi cả list1 và list2 đều chưa rỗng
        while(list1!=null && list2!=null){
            // Lấy giá trị nhỏ hơn làm nút tiếp theo
            if(list1.val <= list2.val){
                if(mergeHead == null){
                   mergeHead = current = list1;
                }else{
                   current.next = list1;
                    // Nút current lưu nút list1 để dùng cho lần kế tiếp
                   current = list1;
                }
                // list1 trỏ tới nút tiếp theo
                list1 = list1.next;
            }else{
                if(mergeHead == null){
                   mergeHead = current = list2;
                }else{
                   current.next = list2;
                     // Nút current lưu nút list2 để dùng cho lần kế tiếp
                   current = list2;
                }
                // list2 trỏ tới nút tiếp theo
                list2 = list2.next;
            }
        }
        if(list1 == null){
            current.next = list2;
        }else{
            current.next = list1;
        }
        return mergeHead;
    }
}
```

Phiên bản đệ quy:

```java
public ListNode Merge(ListNode list1,ListNode list2) {
    if(list1 == null){
        return list2;
    }
    if(list2 == null){
        return list1;
    }
    if(list1.val <= list2.val){
        list1.next = Merge(list1.next, list2);
        return list1;
    }else{
        list2.next = Merge(list1, list2.next);
        return list2;
    }
}
```

## Dùng hai ngăn xếp (Stack) để cài đặt hàng đợi (Queue)

**Mô tả bài toán:**

Dùng hai ngăn xếp (Stack) để cài đặt một hàng đợi (Queue), hoàn thành các thao tác `push` và `pop` của hàng đợi. Các phần tử trong hàng đợi có kiểu `int`.

**Phân tích bài toán:**

Hãy cùng ôn lại đặc điểm cơ bản của ngăn xếp và hàng đợi:
**Ngăn xếp (Stack):** Vào sau ra trước (LIFO - Last In, First Out)
**Hàng đợi (Queue):** Vào trước ra trước (FIFO - First In, First Out)
Rõ ràng ta cần dựa trên các phương thức cơ bản mà lớp `Stack` trong JDK cung cấp để hiện thực. Trước tiên cùng xem qua một số phương thức cơ bản của lớp `Stack`:

![Một số phương thức thông dụng của lớp Stack](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/5985000-b8057d4f.jpg)

Vì đề bài cho ta hai ngăn xếp, ta có thể thiết kế như sau: khi `push` thì đẩy phần tử vào `stack1`; khi `pop` ta trước hết lấy toàn bộ phần tử của `stack1` đẩy sang `stack2`, sau đó mới thực hiện thao tác `pop` trên `stack2`. Như vậy qua hai lần đảo ngược thứ tự, ta đảm bảo được quy tắc vào trước ra trước (âm [pop] nhân âm [pop] thành dương [FIFO]).

**Nội dung kiểm tra:**

Hàng đợi (Queue) + Ngăn xếp (Stack).

**Mã nguồn mẫu:**

```java
// Lời giải tham khảo từ cuốn "Coding Interview Guide" của Tả Trình Vân (Zuo Chengyun)
import java.util.Stack;

public class Solution {
    Stack<Integer> stack1 = new Stack<Integer>();
    Stack<Integer> stack2 = new Stack<Integer>();

    // Khi thực hiện thao tác push, thêm phần tử vào stack1
    public void push(int node) {
        stack1.push(node);
    }

    public int pop() {
        // Nếu cả hai ngăn xếp đều rỗng thì ném ra ngoại lệ, chứng tỏ chưa push phần tử nào
        if(stack1.empty()&&stack2.empty()){
            throw new RuntimeException("Queue is empty!");
        }
        // Nếu stack2 rỗng thì chuyển toàn bộ phần tử từ stack1 sang stack2
        if(stack2.empty()){
            while(!stack1.empty()){
                // Đẩy phần tử từ stack1 sang stack2 theo thứ tự vào sau ra trước
                stack2.push(stack1.pop());
            }
        }
        return stack2.pop();
    }
}
```

## Dãy đẩy vào (push) và lấy ra (pop) của ngăn xếp

**Mô tả bài toán:**

Cho hai dãy số nguyên, dãy thứ nhất biểu diễn thứ tự đẩy vào (push) của một ngăn xếp, hãy phán đoán xem dãy thứ hai có thể là thứ tự lấy ra (pop) tương ứng của ngăn xếp đó hay không. Giả định tất cả các số được đẩy vào ngăn xếp đều không trùng lặp. Ví dụ dãy `1, 2, 3, 4, 5` là thứ tự đẩy vào, dãy `4, 5, 3, 2, 1` là một dãy lấy ra hợp lệ tương ứng, nhưng `4, 3, 5, 1, 2` thì không thể là dãy lấy ra của thứ tự đẩy đó. (Lưu ý: độ dài của hai dãy là bằng nhau).

**Phân tích bài toán:**

Tham khảo [lời giải của Alias](https://www.nowcoder.com/questionTerminal/d77d11405cc7470d82554cb392585106), phần giải thích ý tưởng được trình bày rất chi tiết và dễ hiểu.

【Ý tưởng】Mượn một ngăn xếp phụ trợ. Duyệt qua dãy đẩy vào, trước tiên đưa phần tử đầu tiên vào ngăn xếp (ở đây là 1), sau đó kiểm tra xem phần tử đỉnh ngăn xếp có trùng với phần tử đầu tiên của dãy lấy ra hay không (ở đây là 4). Rõ ràng $1 \ne 4$, vì vậy tiếp tục đẩy phần tử tiếp theo vào ngăn xếp cho đến khi phần tử đỉnh bằng phần tử của dãy lấy ra thì bắt đầu lấy ra (pop). Mỗi khi lấy ra một phần tử thì dịch con trỏ của dãy lấy ra sang vị trí kế tiếp, tiếp tục pop cho đến khi không còn trùng. Cứ lặp lại như vậy cho đến khi duyệt hết dãy đẩy vào. Nếu ngăn xếp phụ trợ cuối cùng rỗng thì dãy lấy ra là hợp lệ, ngược lại nếu không rỗng thì đó không phải là dãy lấy ra hợp lệ.

Ví dụ minh họa:

Dãy vào: `1, 2, 3, 4, 5`
Dãy ra: `4, 5, 3, 2, 1`

1. Đưa 1 vào ngăn xếp phụ trợ, đỉnh là $1 \ne 4$, tiếp tục đưa 2 vào;
2. Đỉnh là $2 \ne 4$, tiếp tục đưa 3 vào;
3. Đỉnh là $3 \ne 4$, tiếp tục đưa 4 vào;
4. Đỉnh là $4 = 4$, lấy 4 ra khỏi ngăn xếp, con trỏ dãy lấy ra dịch sang số 5, trong ngăn xếp phụ trợ còn `1, 2, 3`;
5. Đỉnh là $3 \ne 5$, tiếp tục đưa 5 vào;
6. Đỉnh là $5 = 5$, lấy 5 ra khỏi ngăn xếp, con trỏ dãy lấy ra dịch sang số 3, trong ngăn xếp phụ trợ còn `1, 2, 3`;
7. ...
Lần lượt thực hiện tiếp, cuối cùng ngăn xếp phụ trợ rỗng. Nếu không rỗng thì chứng tỏ dãy lấy ra là không hợp lệ.

**Nội dung kiểm tra:**

Ngăn xếp (Stack).

**Mã nguồn mẫu:**

```java
import java.util.ArrayList;
import java.util.Stack;
// Tham khảo lời giải của bạn Alias: https://www.nowcoder.com/questionTerminal/d77d11405cc7470d82554cb392585106
public class Solution {
    public boolean IsPopOrder(int [] pushA,int [] popA) {
        if(pushA.length == 0 || popA.length == 0)
            return false;
        Stack<Integer> s = new Stack<Integer>();
        // Biến đánh dấu vị trí hiện tại của dãy lấy ra (pop)
        int popIndex = 0;
        for(int i = 0; i< pushA.length;i++){
            s.push(pushA[i]);
            // Nếu ngăn xếp không rỗng và phần tử đỉnh bằng phần tử hiện tại của dãy pop
            while(!s.empty() &&s.peek() == popA[popIndex]){
                // Lấy phần tử ra khỏi ngăn xếp
                s.pop();
                // Dịch con trỏ dãy pop sang vị trí tiếp theo
                popIndex++;
            }
        }
        return s.empty();
    }
}
```
