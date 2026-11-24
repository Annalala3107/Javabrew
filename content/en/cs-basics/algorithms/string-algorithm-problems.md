---
title: Common String Algorithm Problems
description: Summary of high-frequency string algorithms and problem types, focusing on KMP/BM principles and sliding window techniques to help readers master efficient matching and implementation.
category: Computer Science Basics
tag:
  - Algorithms
head:
  - - meta
    - name: keywords
      content: string algorithms,KMP,BM,sliding window,substring,matching,complexity
lang: en
sourceRef: zh-ref/cs-basics/algorithms/string-algorithm-problems.md
---

> Author: wwwxmu
>
> Original URL: <https://www.weiweiblog.cn/13string/>

## 1. KMP Algorithm

When discussing string problems, one cannot avoid mentioning the KMP algorithm. It is used to solve the string search problem, finding the occurrences and positions of a substring (pattern W) in a main text string (S). The KMP algorithm reduces the time complexity of character matching to `O(m + n)` with a space complexity of only `O(m)`. Because "brute-force search" repeatedly backtracks the pointer in the main string, leading to poor efficiency, the KMP algorithm leverages the effective information of partial matches already achieved. It keeps the main string pointer from backtracking, and by adjusting the substring pointer, shifts the pattern string to the most effective position possible.

For specific algorithm details, please refer to:

- [Thoroughly Understanding KMP from Start to Finish (Chinese)](https://blog.csdn.net/v_july_v/article/details/7041827)
- [How to Better Understand and Master the KMP Algorithm? (Zhihu)](https://www.zhihu.com/question/21923021)
- [Detailed Analysis of the KMP Algorithm](https://blog.sengxian.com/algorithms/kmp)
- [Illustrated Guide to the KMP Algorithm](http://blog.jobbole.com/76611/)
- [KMP String Matching Algorithm Explained so Anyone Can Understand [Bilingual Subtitles]](https://www.bilibili.com/video/av3246487/?from=search&seid=17173603269940723925)
- [KMP String Matching Algorithm 1](https://www.bilibili.com/video/av11866460?from=search&seid=12730654434238709250)

**In addition, let's also understand the BM algorithm!**

> The BM (Boyer-Moore) algorithm is also an exact string-matching algorithm. It compares characters from right to left and applies two heuristic rules—the Bad Character Rule and the Good Suffix Rule—to determine the shift distance to the right. The core idea is to perform character matching from right to left; upon encountering a mismatch, calculate the maximum rightward shift value from the bad character table and good suffix table, and shift the pattern string to continue matching.
> "The KMP Algorithm for String Matching": <http://www.ruanyifeng.com/blog/2013/05/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm.html>

## 2. Replace Spaces

> Sword to Offer: Please implement a function that replaces every space in a string with "%20". For example, given the string `We Are Happy.`, the string after replacement is `We%20Are%20Happy.`.

Here, two methods are provided: ① Conventional method; ② Utilizing existing APIs.

```java
//https://www.weiweiblog.cn/replacespace/
public class Solution {

  /**
   * Method 1: Conventional method. Use String.charAt(i) and String.valueOf(char).equals(" ")
   * to iterate through the string and check if the character is a space. If so, replace with "%20", otherwise keep it.
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
   * Method 2: Use API to replace all spaces in one line of code
   */
  public static String replaceSpace2(StringBuffer str) {

    return str.toString().replace(" ", "%20");
  }
}

```

For replacing a fixed character (such as space), the second method can simply use the `replace` method, which provides better performance!

```java
str.toString().replace(" ","%20");
```

## 3. Longest Common Prefix

> LeetCode: Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string `""`.

Example 1:

```plain
Input: ["flower","flow","flight"]
Output: "fl"
```

Example 2:

```plain
Input: ["dog","racecar","car"]
Output: ""
Explanation: There is no common prefix among the input strings.
```

The approach is straightforward! First sort the array using `Arrays.sort(strs)`, then compare characters from front to back between the first and last elements in the array!

```java
public class Main {
 public static String replaceSpace(String[] strs) {

  // If validation fails, return empty string
  if (!checkStrs(strs)) {
   return "";
  }
  // Array length
  int len = strs.length;
  // Used to store result
  StringBuilder res = new StringBuilder();
  // Sort elements of the string array in ascending order (if digits are included, digits come first)
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
   // Iterate over strs to check element values
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

 // Test
 public static void main(String[] args) {
  String[] strs = { "customer", "car", "cat" };
  // String[] strs = { "customer", "car", null }; // empty string
  // String[] strs = {}; // empty string
  // String[] strs = null; // empty string
  System.out.println(Main.replaceSpace(strs)); // c
 }
}

```

## 4. Palindromes

### 4.1. Longest Palindrome

> LeetCode: Given a string containing lowercase and uppercase letters, return the length of the longest palindrome that can be built with those letters. Letters are case sensitive, for example, `"Aa"` is not considered a palindrome here. Note: Assume the length of the given string will not exceed 1010.
>
> Palindrome: A palindrome is a string that reads the same forwards and backwards, such as "level" or "noon". — Baidu Baike URL: <https://baike.baidu.com/item/%E5%9B%9E%E6%96%87%E4%B8%B2/1274921?fr=aladdin>

Example 1:

```plain
Input:
"abccccdd"

Output:
7

Explanation:
One longest palindrome that can be built is "dccaccd", whose length is 7.
```

We now know what a palindrome is. Let us consider the two cases that can form a palindrome:

- Combinations where character counts are even
- **Combinations where character counts are even + a single character with the maximum odd count placed in the center** (refer to **[issue665](https://github.com/Snailclimb/JavaGuide/issues/665)**)

Simply count the occurrences of each character, as only pairs can form symmetric parts. Because a single character is allowed to appear alone in the center, such as in "abcba", if any character is left unpaired at the end, the total length can be increased by 1. First convert the string into a character array. Then iterate over the array, checking if the corresponding character is already in a `HashSet`. If not, add it; if it is, increment `count++` and remove that character! In this way, we find the number of character pairs.

```java
//https://leetcode-cn.com/problems/longest-palindrome/description/
class Solution {
  public  int longestPalindrome(String s) {
    if (s.length() == 0)
      return 0;
    // Used to store characters
    HashSet<Character> hashset = new HashSet<Character>();
    char[] chars = s.toCharArray();
    int count = 0;
    for (int i = 0; i < chars.length; i++) {
      if (!hashset.contains(chars[i])) { // If hashset doesn't have this character, add it
        hashset.add(chars[i]);
      } else { // If already present, increment count++ (pair found), and remove the character
        hashset.remove(chars[i]);
        count++;
      }
    }
    return hashset.isEmpty() ? count * 2 : count * 2 + 1;
  }
}
```

### 4.2. Valid Palindrome

> LeetCode: Given a string, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases. Note: For the purpose of this problem, we define empty string as valid palindrome.

Example 1:

```plain
Input: "A man, a plan, a canal: Panama"
Output: true
```

Example 2:

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
      // Traverse inward from both ends
      if (!Character.isLetterOrDigit(s.charAt(l))) { // Character is not letter or digit
        l++;
      } else if (!Character.isLetterOrDigit(s.charAt(r))) { // Character is not letter or digit
        r--;
      } else {
        // Check if characters match
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

### 4.3. Longest Palindromic Substring

> LeetCode: Given a string `s`, find the longest palindromic substring in `s`. You may assume that the maximum length of `s` is 1000.

Example 1:

```plain
Input: "babad"
Output: "bab"
Note: "aba" is also a valid answer.
```

Example 2:

```plain
Input: "cbbd"
Output: "bb"
```

Using each element as a center, expand outwards to compute the maximum palindrome length for both odd and even lengths.

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

### 4.4. Longest Palindromic Subsequence

> LeetCode: Longest Palindromic Subsequence
> Given a string `s`, find the longest palindromic subsequence's length in `s`. You may assume that the maximum length of `s` is 1000.
> **The difference between the longest palindromic subsequence and the longest palindromic substring in the previous problem is that a substring is a contiguous sequence in the string, whereas a subsequence is a sequence of characters preserving relative order without requiring contiguity. For example, "bbbb" is a subsequence of "bbbab", but not a substring.**

Given a string `s`, find the longest palindromic subsequence in `s`. You may assume the maximum length of `s` is 1000.

Example 1:

```plain
Input:
"bbbab"
Output:
4
```

One possible longest palindromic subsequence is "bbbb".

Example 2:

```plain
Input:
"cbbd"
Output:
2
```

One possible longest palindromic subsequence is "bb".

**Dynamic Programming:** `dp[i][j] = dp[i+1][j-1] + 2 if s.charAt(i) == s.charAt(j) otherwise, dp[i][j] = Math.max(dp[i+1][j], dp[i][j-1])`

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

## 5. Parentheses Matching Depth

> iQIYI 2018 Autumn Campus Recruitment Java:
> A valid parentheses matching sequence is defined as follows:
>
> 1. The empty string `""` is a valid parentheses matching sequence.
> 2. If `"X"` and `"Y"` are both valid parentheses matching sequences, `"XY"` is also a valid parentheses matching sequence.
> 3. If `"X"` is a valid parentheses matching sequence, then `"(X)"` is also a valid parentheses matching sequence.
> 4. Every valid parentheses sequence can be generated by the above rules.
>
> For example: `""`, `"()"`, `"()()"`, `"((()))"` are all valid parentheses sequences.
> For a valid parentheses sequence, its depth is defined as follows:
>
> 1. The depth of the empty string `""` is 0.
> 2. If the depth of string `"X"` is x and the depth of string `"Y"` is y, then the depth of string `"XY"` is `max(x, y)`.
> 3. If the depth of string `"X"` is x, then the depth of string `"(X)"` is `x + 1`.
>
> For example: the depth of `"()()()"` is 1, and the depth of `"((()))"` is 3. Given a valid parentheses sequence, calculate its depth.

```plain
Input Description:
The input includes a valid parentheses sequence s, with length (2 <= length <= 50), containing only '(' and ')'.

Output Description:
Output a positive integer representing the depth of this sequence.
```

Example:

```plain
Input:
(())
Output:
2
```

The code is as follows:

```java
import java.util.Scanner;

/**
 * https://www.nowcoder.com/test/8246651/summary
 *
 * @author Snailclimb
 * @date September 6, 2018
 * @Description: Find the depth of a given valid parentheses sequence
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

## 6. Convert String to Integer (atoi)

> Sword to Offer: Convert a string into an integer (implementing the functionality of `Integer.valueOf(string)`, but returning 0 when the string does not meet numeric requirements). The use of standard library string-to-integer conversion functions is prohibited. If the value is 0 or the string is not a valid numeric representation, return 0.

```java
//https://www.weiweiblog.cn/strtoint/
public class Main {

  public static int StrToInt(String str) {
    if (str.length() == 0)
      return 0;
    char[] chars = str.toCharArray();
    // Check for sign bit
    int flag = 0;
    if (chars[0] == '+')
      flag = 1;
    else if (chars[0] == '-')
      flag = 2;
    int start = flag > 0 ? 1 : 0;
    int res = 0; // Store result
    for (int i = start; i < chars.length; i++) {
      if (Character.isDigit(chars[i])) { // Call Character.isDigit(char) to check if numeric; returns true if digit, false otherwise
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
    System.out.println("Converted using library function: " + Integer.valueOf(s));
    int res = Main.StrToInt(s);
    System.out.println("Converted using custom implementation: " + res);

  }

}

```

## Interview Review Key Points

String questions may seem diverse, but in practice there are only a few common templates: hash counting, two pointers, sliding window, KMP, palindrome techniques, and stack simulation.

| Problem Type | Common Method | Representative Problem |
| ------------ | ------------- | ---------------------- |
| Character Counting | Array or Hash Table | Valid Anagram, Group Anagrams |
| Substring Problems | Sliding Window | Longest Substring Without Repeating Characters, Minimum Window Substring |
| Palindrome Problems | Two Pointers, Center Expansion, DP | Valid Palindrome, Longest Palindromic Substring |
| String Matching | KMP, Hashing | Implement `strStr()` |
| Parentheses & Encoding | Stack | Valid Parentheses, Decode String |
| Number Conversion | Simulation | String to Integer (atoi) |

When approaching string problems, you can start by asking yourself 3 questions:

1. Does the problem ask about substrings or subsequences? Substrings must be contiguous; subsequences do not need to be contiguous.
2. How large is the character set? When only lowercase English letters are involved, array-based counting is more direct than a hash table.
3. Do you need to handle boundary conditions such as integer overflow, empty strings, whitespace, and sign indicators?

A few error-prone points:

- In Java, `String` is immutable; frequent concatenations should use `StringBuilder`.
- A single `char` may not suffice for non-BMP Unicode characters; standard interview questions usually only test ASCII or lowercase English letters.
- Palindromic substring and palindromic subsequence belong to different categories; the former commonly uses center expansion, while the latter uses DP.
- In interviews, you are rarely expected to derive the `next` array computation for KMP from scratch, but you must understand its role in skipping already matched prefixes to avoid redundant comparisons.
