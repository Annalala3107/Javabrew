---
title: Một số bài toán thuật toán chuỗi ký tự thường gặp
description: Tổng hợp các thuật toán và dạng bài tập chuỗi ký tự tần suất cao, tập trung giải thích nguyên lý KMP/BM, kỹ thuật Sliding Window, giúp người đọc nắm vững đối sánh chuỗi hiệu quả và hiện thực chuẩn xác.
category: Kiến thức cơ sở máy tính
tag:
  - Thuật toán
head:
  - - meta
    - name: keywords
      content: thuật toán chuỗi,KMP,BM,sliding window,chuỗi con,đối sánh chuỗi,độ phức tạp
lang: vi
sourceRef: zh-ref/cs-basics/algorithms/string-algorithm-problems.md
---

> Tác giả: wwwxmu
>
> Địa chỉ bài viết gốc: <https://www.weiweiblog.cn/13string/>

## 1. Thuật toán KMP

Nhắc đến các bài toán chuỗi, không thể không nhắc tới thuật toán KMP. Đây là thuật toán dùng để giải quyết bài toán tìm kiếm chuỗi, có thể tìm vị trí xuất hiện của một chuỗi mẫu con (W) trong một chuỗi văn bản chính (S). Thuật toán KMP giảm độ phức tạp thời gian đối sánh ký tự xuống còn `O(m + n)`, trong khi độ phức tạp không gian chỉ là `O(m)`. Do phương pháp "vét cạn (Brute-force Search)" phải liên tục quay lui (backtrack) con trỏ trên chuỗi chính dẫn đến hiệu suất thấp, thuật toán KMP tận dụng thông tin hữu ích từ phần chuỗi đã khớp thành công trước đó, giữ cho con trỏ trên chuỗi chính không bao giờ phải quay lui, bằng cách điều chỉnh con trỏ của chuỗi con để chuỗi mẫu dịch chuyển tới vị trí hợp lý nhất có thể.

Chi tiết cụ thể về giải thuật vui lòng tham khảo:

- [Hiểu cặn kẽ thuật toán KMP từ đầu đến cuối (tiếng Trung):](https://blog.csdn.net/v_july_v/article/details/7041827)
- [Làm thế nào để hiểu và nắm vững thuật toán KMP tốt hơn? (Zhihu)](https://www.zhihu.com/question/21923021)
- [Phân tích chi tiết thuật toán KMP](https://blog.sengxian.com/algorithms/kmp)
- [Minh họa trực quan thuật toán KMP](http://blog.jobbole.com/76611/)
- [Giải thích thuật toán đối sánh chuỗi KMP dễ hiểu nhất [Phụ đề song ngữ]](https://www.bilibili.com/video/av3246487/?from=search&seid=17173603269940723925)
- [Thuật toán đối sánh chuỗi KMP 1](https://www.bilibili.com/video/av11866460?from=search&seid=12730654434238709250)

**Bên cạnh đó, hãy cùng tìm hiểu thêm về thuật toán BM!**

> Thuật toán BM (Boyer-Moore) cũng là một thuật toán đối sánh chuỗi chính xác. Nó áp dụng phương pháp so sánh từ phải sang trái, đồng thời vận dụng hai quy tắc heuristic: quy tắc ký tự xấu (Bad Character Rule) và quy tắc hậu tố tốt (Good Suffix Rule) để quyết định khoảng cách nhảy sang phải. Tư tưởng cơ bản là so khớp ký tự từ phải sang trái; khi gặp ký tự không khớp, tra bảng ký tự xấu và bảng hậu tố tốt để tìm giá trị dịch chuyển sang phải lớn nhất, sau đó dịch chuỗi mẫu sang phải rồi tiếp tục so khớp.
> "Thuật toán KMP trong đối sánh chuỗi": <http://www.ruanyifeng.com/blog/2013/05/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm.html>

## 2. Thay thế khoảng trắng (Replace Spaces)

> Kiếm chỉ Offer: Hãy hiện thực một hàm thay thế mỗi ký tự khoảng trắng trong chuỗi bằng "%20". Ví dụ, khi chuỗi là `We Are Happy.`, chuỗi sau khi thay thế sẽ là `We%20Are%20Happy.`.

Ở đây cung cấp hai phương pháp: ① Phương pháp thông thường; ② Sử dụng API có sẵn.

```java
//https://www.weiweiblog.cn/replacespace/
public class Solution {

  /**
   * Phương pháp 1: Phương pháp thông thường. Sử dụng String.charAt(i) và String.valueOf(char).equals(" ")
   * để duyệt qua chuỗi và kiểm tra phần tử có phải là khoảng trắng hay không. Nếu phải thì thay bằng "%20", ngược lại giữ nguyên.
   */
  public static String replaceSpace(StringBuffer str) {

    int length = str.length();
    // System.out.println("length=" + length);
    StringBuffer result = new StringBuffer();
    for (int i = 0; i < length; i++) {
      char b = str.charAt(i);
      if (String.valueOf(b).equals(" ")) {
        result.append("%20");
      } else {
        result.append(b);
      }
    }
    return result.toString();

  }

  /**
   * Phương pháp 2: Sử dụng API thay thế toàn bộ khoảng trắng, giải quyết vấn đề chỉ với một dòng code
   */
  public static String replaceSpace2(StringBuffer str) {

    return str.toString().replace(" ", "%20");
  }
}

```

Đối với trường hợp thay thế ký tự cố định (như khoảng trắng), phương pháp thứ hai thực chất có thể dùng phương thức `replace`, hiệu năng sẽ tốt hơn!

```java
str.toString().replace(" ","%20");
```

## 3. Tiền tố chung dài nhất (Longest Common Prefix)

> LeetCode: Viết một hàm để tìm chuỗi tiền tố chung dài nhất trong một mảng các chuỗi. Nếu không tồn tại tiền tố chung, trả về chuỗi rỗng `""`.

Ví dụ 1:

```plain
Input: ["flower","flow","flight"]
Output: "fl"
```

Ví dụ 2:

```plain
Input: ["dog","racecar","car"]
Output: ""
Giải thích: Không tồn tại tiền tố chung giữa các chuỗi đầu vào.
```

Ý tưởng rất đơn giản! Đầu tiên sử dụng `Arrays.sort(strs)` để sắp xếp mảng chuỗi, sau đó so sánh từng ký tự từ trước ra sau giữa phần tử đầu tiên và phần tử cuối cùng trong mảng!

```java
public class Main {
 public static String replaceSpace(String[] strs) {

  // Nếu giá trị kiểm tra không hợp lệ thì trả về chuỗi rỗng
  if (!checkStrs(strs)) {
   return "";
  }
  // Độ dài mảng
  int len = strs.length;
  // Dùng để lưu trữ kết quả
  StringBuilder res = new StringBuilder();
  // Sắp xếp các phần tử mảng chuỗi theo thứ tự tăng dần (nếu chứa số thì số xếp trước)
  Arrays.sort(strs);
  int m = strs[0].length();
  int n = strs[len - 1].length();
  int num = Math.min(m, n);
  for (int i = 0; i < num; i++) {
   if (strs[0].charAt(i) == strs[len - 1].charAt(i)) {
    res.append(strs[0].charAt(i));
   } else
    break;

  }
  return res.toString();

 }

 private static boolean checkStrs(String[] strs) {
  boolean flag = false;
  if (strs != null) {
   // Duyệt qua strs kiểm tra giá trị phần tử
   for (int i = 0; i < strs.length; i++) {
    if (strs[i] != null && strs[i].length() != 0) {
     flag = true;
    } else {
     flag = false;
     break;
    }
   }
  }
  return flag;
 }

 // Kiểm thử
 public static void main(String[] args) {
  String[] strs = { "customer", "car", "cat" };
  // String[] strs = { "customer", "car", null }; // chuỗi rỗng
  // String[] strs = {}; // chuỗi rỗng
  // String[] strs = null; // chuỗi rỗng
  System.out.println(Main.replaceSpace(strs)); // c
 }
}

```

## 4. Chuỗi Palindrome (Chuỗi đối xứng)

### 4.1. Chuỗi Palindrome dài nhất (Longest Palindrome)

> LeetCode: Cho một chuỗi chứa các chữ cái viết hoa và viết thường, hãy tìm độ dài chuỗi palindrome dài nhất có thể tạo thành từ các chữ cái đó. Trong quá trình tạo chuỗi, chú ý phân biệt chữ hoa và chữ thường. Ví dụ: `"Aa"` không được coi là một chuỗi palindrome. Lưu ý: Giả định độ dài chuỗi không vượt quá 1010.
>
> Chuỗi Palindrome: "Chuỗi Palindrome" là chuỗi đọc xuôi hay đọc ngược đều giống hệt nhau, ví dụ như "level" hoặc "noon" v.v. chính là chuỗi palindrome. — Bách khoa Baidu: <https://baike.baidu.com/item/%E5%9B%9E%E6%96%87%E4%B8%B2/1274921?fr=aladdin>

Ví dụ 1:

```plain
Input:
"abccccdd"

Output:
7

Giải thích:
Chuỗi palindrome dài nhất chúng ta có thể tạo thành là "dccaccd", có độ dài là 7.
```

Ở trên chúng ta đã hiểu chuỗi palindrome là gì. Bây giờ ta xét hai trường hợp có thể tạo nên chuỗi palindrome:

- Các cặp ký tự xuất hiện số lần chẵn
- **Tập hợp các ký tự xuất hiện số lần chẵn + một ký tự đơn lẻ xuất hiện số lần lẻ nhiều nhất đặt ở chính giữa** (xem thêm **[issue665](https://github.com/Snailclimb/JavaGuide/issues/665)**)

Chỉ cần đếm số lần xuất hiện của các ký tự, số lần chẵn mới tạo thành cấu trúc đối xứng. Vì ở chính giữa cho phép một ký tự xuất hiện đơn lẻ, ví dụ như "abcba", nên nếu cuối cùng còn sót lại ký tự lẻ, tổng độ dài có thể cộng thêm 1. Đầu tiên chuyển chuỗi thành mảng ký tự. Sau đó duyệt mảng này, kiểm tra ký tự tương ứng đã có trong `HashSet` chưa: nếu chưa thì thêm vào, nếu đã có thì tăng `count++` (nghĩa là đã tìm thấy một cặp ký tự) rồi xóa ký tự đó khỏi tập hợp! Bằng cách này, ta xác định được số lượng các ký tự xuất hiện theo cặp.

```java
//https://leetcode-cn.com/problems/longest-palindrome/description/
class Solution {
  public  int longestPalindrome(String s) {
    if (s.length() == 0)
      return 0;
    // Dùng để lưu trữ ký tự
    HashSet<Character> hashset = new HashSet<Character>();
    char[] chars = s.toCharArray();
    int count = 0;
    for (int i = 0; i < chars.length; i++) {
      if (!hashset.contains(chars[i])) { // Nếu hashset chưa có ký tự này thì lưu vào
        hashset.add(chars[i]);
      } else { // Nếu đã có, tăng count++ (tìm thấy một cặp), rồi xóa ký tự đó đi
        hashset.remove(chars[i]);
        count++;
      }
    }
    return hashset.isEmpty() ? count * 2 : count * 2 + 1;
  }
}
```

### 4.2. Xác thực chuỗi Palindrome (Valid Palindrome)

> LeetCode: Cho một chuỗi, hãy xác thực xem nó có phải là chuỗi palindrome hay không, chỉ xét các ký tự chữ cái và chữ số, bỏ qua phân biệt hoa thường. Ghi chú: Trong bài toán này, chuỗi rỗng được định nghĩa là chuỗi palindrome hợp lệ.

Ví dụ 1:

```plain
Input: "A man, a plan, a canal: Panama"
Output: true
```

Ví dụ 2:

```plain
Input: "race a car"
Output: false
```

```java
//https://leetcode-cn.com/problems/valid-palindrome/description/
class Solution {
  public  boolean isPalindrome(String s) {
    if (s.length() == 0)
      return true;
    int l = 0, r = s.length() - 1;
    while (l < r) {
      // Duyệt từ đầu và đuôi tiến dần vào giữa
      if (!Character.isLetterOrDigit(s.charAt(l))) { // Ký tự không phải chữ cái hoặc chữ số
        l++;
      } else if (!Character.isLetterOrDigit(s.charAt(r))) { // Ký tự không phải chữ cái hoặc chữ số
        r--;
      } else {
        // Kiểm tra xem hai ký tự có bằng nhau hay không
        if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r)))
          return false;
        l++;
        r--;
      }
    }
    return true;
  }
}
```

### 4.3. Chuỗi con Palindrome dài nhất (Longest Palindromic Substring)

> LeetCode: Cho một chuỗi `s`, hãy tìm chuỗi con palindrome dài nhất trong `s`. Bạn có thể giả định độ dài tối đa của `s` là 1000.

Ví dụ 1:

```plain
Input: "babad"
Output: "bab"
Lưu ý: "aba" cũng là một đáp án hợp lệ.
```

Ví dụ 2:

```plain
Input: "cbbd"
Output: "bb"
```

Lấy từng phần tử làm tâm, lần lượt tính toán độ dài palindrome tối đa đối với độ dài chẵn và độ dài lẻ (Center Expansion).

```java
//https://leetcode-cn.com/problems/longest-palindromic-substring/description/
class Solution {
  private int index, len;

  public String longestPalindrome(String s) {
    if (s.length() < 2)
      return s;
    for (int i = 0; i < s.length() - 1; i++) {
      PalindromeHelper(s, i, i);
      PalindromeHelper(s, i, i + 1);
    }
    return s.substring(index, index + len);
  }

  public void PalindromeHelper(String s, int l, int r) {
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
      l--;
      r++;
    }
    if (len < r - l - 1) {
      index = l + 1;
      len = r - l - 1;
    }
  }
}
```

### 4.4. Dãy con Palindrome dài nhất (Longest Palindromic Subsequence)

> LeetCode: Cho một chuỗi `s`, hãy tìm độ dài dãy con palindrome dài nhất trong chuỗi đó. Có thể giả định độ dài tối đa của `s` là 1000.
> **Sự khác biệt giữa dãy con palindrome dài nhất và bài toán chuỗi con palindrome dài nhất ở mục trước là: chuỗi con (substring) là một đoạn liên tục trong chuỗi, trong khi dãy con (subsequence) chỉ cần giữ nguyên thứ tự tương đối giữa các ký tự mà không yêu cầu liên tục. Ví dụ: "bbbb" có thể là dãy con của chuỗi "bbbab" nhưng không phải là chuỗi con.**

Cho một chuỗi `s`, hãy tìm dãy con palindrome dài nhất trong `s`. Bạn có thể giả định độ dài tối đa của `s` là 1000.

Ví dụ 1:

```plain
Input:
"bbbab"
Output:
4
```

Một dãy con palindrome dài nhất có thể là "bbbb".

Ví dụ 2:

```plain
Input:
"cbbd"
Output:
2
```

Một dãy con palindrome dài nhất có thể là "bb".

**Quy hoạch động (Dynamic Programming):** `dp[i][j] = dp[i+1][j-1] + 2 nếu s.charAt(i) == s.charAt(j); ngược lại, dp[i][j] = Math.max(dp[i+1][j], dp[i][j-1])`

```java
class Solution {
    public int longestPalindromeSubseq(String s) {
        int len = s.length();
        int [][] dp = new int[len][len];
        for(int i = len - 1; i>=0; i--){
            dp[i][i] = 1;
            for(int j = i+1; j < len; j++){
                if(s.charAt(i) == s.charAt(j))
                    dp[i][j] = dp[i+1][j-1] + 2;
                else
                    dp[i][j] = Math.max(dp[i+1][j], dp[i][j-1]);
            }
        }
        return dp[0][len-1];
    }
}
```

## 5. Độ sâu ngoặc hợp lệ (Parentheses Matching Depth)

> Tuyển dụng mùa thu iQIYI 2018 (Java):
> Một chuỗi ngoặc khớp hợp lệ được định nghĩa như sau:
>
> 1. Chuỗi rỗng `""` là một chuỗi ngoặc hợp lệ.
> 2. Nếu `"X"` và `"Y"` đều là chuỗi ngoặc hợp lệ, thì `"XY"` cũng là một chuỗi ngoặc hợp lệ.
> 3. Nếu `"X"` là một chuỗi ngoặc hợp lệ, thì `"(X)"` cũng là một chuỗi ngoặc hợp lệ.
> 4. Mọi chuỗi ngoặc hợp lệ đều có thể được sinh ra từ các quy tắc trên.
>
> Ví dụ: `""`, `"()"`, `"()()"`, `"((()))"` đều là các chuỗi ngoặc hợp lệ.
> Đối với một chuỗi ngoặc hợp lệ, độ sâu của nó được định nghĩa như sau:
>
> 1. Độ sâu của chuỗi rỗng `""` là 0.
> 2. Nếu độ sâu của chuỗi `"X"` là x, độ sâu của chuỗi `"Y"` là y, thì độ sâu của chuỗi `"XY"` là `max(x, y)`.
> 3. Nếu độ sâu của chuỗi `"X"` là x, thì độ sâu của chuỗi `"(X)"` là `x + 1`.
>
> Ví dụ: Độ sâu của `"()()()"` là 1, độ sâu của `"((()))"` là 3. Bây giờ đề bài cho bạn một chuỗi ngoặc hợp lệ, yêu cầu bạn tính độ sâu của nó.

```plain
Mô tả đầu vào:
Đầu vào gồm một chuỗi ngoặc hợp lệ s, độ dài length (2 <= length <= 50), chuỗi chỉ chứa ký tự '(' và ')'.

Mô tả đầu ra:
In ra một số nguyên dương, chính là độ sâu của chuỗi ngoặc này.
```

Ví dụ:

```plain
Input:
(())
Output:
2
```

Mã nguồn như sau:

```java
import java.util.Scanner;

/**
 * https://www.nowcoder.com/test/8246651/summary
 *
 * @author Snailclimb
 * @date 6 tháng 9, 2018
 * @Description: Tìm độ sâu của chuỗi ngoặc hợp lệ cho trước
 */
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String s = sc.nextLine();
    int cnt = 0, max = 0, i;
    for (i = 0; i < s.length(); ++i) {
      if (s.charAt(i) == '(')
        cnt++;
      else
        cnt--;
      max = Math.max(max, cnt);
    }
    sc.close();
    System.out.println(max);
  }
}

```

## 6. Chuyển đổi chuỗi thành số nguyên (Convert String to Integer)

> Kiếm chỉ Offer: Chuyển đổi một chuỗi thành một số nguyên (hiện thực chức năng tương đương `Integer.valueOf(string)`, nhưng khi chuỗi không thỏa mãn yêu cầu số thì trả về 0), yêu cầu không được dùng các hàm thư viện có sẵn để chuyển đổi chuỗi thành số nguyên. Nếu giá trị là 0 hoặc chuỗi không phải là một giá trị số hợp lệ thì trả về 0.

```java
//https://www.weiweiblog.cn/strtoint/
public class Main {

  public static int StrToInt(String str) {
    if (str.length() == 0)
      return 0;
    char[] chars = str.toCharArray();
    // Kiểm tra xem có dấu hay không
    int flag = 0;
    if (chars[0] == '+')
      flag = 1;
    else if (chars[0] == '-')
      flag = 2;
    int start = flag > 0 ? 1 : 0;
    int res = 0; // Lưu kết quả
    for (int i = start; i < chars.length; i++) {
      if (Character.isDigit(chars[i])) { // Gọi phương thức Character.isDigit(char) kiểm tra có phải là chữ số không, đúng trả về True, sai trả về False
        int temp = chars[i] - '0';
        res = res * 10 + temp;
      } else {
        return 0;
      }
    }
   return flag != 2 ? res : -res;

  }

  public static void main(String[] args) {
    String s = "-12312312";
    System.out.println("Chuyển đổi bằng hàm thư viện: " + Integer.valueOf(s));
    int res = Main.StrToInt(s);
    System.out.println("Chuyển đổi bằng phương thức tự viết: " + res);

  }

}

```

## Trọng tâm ôn tập phỏng vấn

Các bài toán về chuỗi nhìn qua có vẻ rất đa dạng, nhưng thực tế các template phổ biến không nhiều: đếm tần suất bằng bảng băm (hash count), hai con trỏ (Two Pointers), cửa sổ trượt (Sliding Window), KMP, xử lý Palindrome, và mô phỏng bằng Stack.

| Dạng bài | Phương pháp thường dùng | Bài toán tiêu biểu |
| -------- | ----------------------- | ------------------ |
| Đếm ký tự | Mảng hoặc Bảng băm (Hash Table) | Anagram hợp lệ (Valid Anagram), Nhóm chuỗi đảo mẫu tử (Group Anagrams) |
| Bài toán chuỗi con | Cửa sổ trượt (Sliding Window) | Chuỗi con không lặp dài nhất, Chuỗi con bao phủ nhỏ nhất |
| Bài toán Palindrome | Hai con trỏ, Mở rộng từ tâm, DP | Xác thực chuỗi Palindrome, Chuỗi con Palindrome dài nhất |
| Đối sánh chuỗi | KMP, Hash | Hiện thực `strStr()` |
| Dấu ngoặc và mã hóa | Stack | Dấu ngoặc hợp lệ, Giải mã chuỗi |
| Chuyển đổi số | Mô phỏng (Simulation) | Chuyển đổi chuỗi thành số nguyên (atoi) |

Khi giải quyết các bài toán chuỗi, bạn có thể tự đặt ra 3 câu hỏi trước:

1. Đề bài quan tâm đến chuỗi con (substring) hay dãy con (subsequence)? Chuỗi con bắt buộc phải liên tục, dãy con không yêu cầu liên tục.
2. Tập ký tự có phạm vi rộng bao nhiêu? Nếu chỉ gồm các chữ cái tiếng Anh in thường, dùng mảng đếm (array counting) sẽ trực tiếp và nhanh hơn bảng băm.
3. Có cần xử lý các trường hợp biên như tràn số (overflow), chuỗi rỗng, khoảng trắng thừa hay dấu âm/dương không?

Một số điểm rất dễ mắc lỗi:

- Trong Java, `String` là bất biến (immutable), nếu nối chuỗi thường xuyên hãy ưu tiên dùng `StringBuilder`.
- Kiểu `char` có thể không đủ để biểu diễn toàn bộ Unicode (ngoài BMP), tuy nhiên đa số câu hỏi phỏng vấn thuật toán chỉ kiểm tra mã ASCII hoặc chữ cái in thường.
- Chuỗi con palindrome và dãy con palindrome không cùng một dạng bài: chuỗi con thường dùng kỹ thuật mở rộng từ tâm, còn dãy con thường dùng Quy hoạch động (DP).
- Trong phỏng vấn, nhà tuyển dụng thường không bắt buộc bạn phải viết tay từng bước tính toán mảng `next` của KMP từ con số 0, nhưng bạn phải hiểu rõ tác dụng của nó là bỏ qua tiền tố đã khớp để tránh đối sánh lặp lại lãng phí thời gian.
