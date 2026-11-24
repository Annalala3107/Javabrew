---
title: Selected Coding Problems from "Point to Offer" (Sword Refers to Offer)
description: Selected classic coding problems from "Point to Offer", providing multiple approaches and examples such as recursion and iteration for efficient review of high-frequency interview topics.
category: Computer Basics
tag:
  - Algorithms
head:
  - - meta
    - name: keywords
      content: Sword Refers to Offer,Point to Offer,Fibonacci,recursion,iteration,linked list,array,interview questions
lang: en
sourceRef: zh-ref/cs-basics/algorithms/the-sword-refers-to-offer.md
---

# Selected Coding Problems from "Point to Offer"

## Fibonacci Sequence

**Problem Description:**

Everyone is familiar with the Fibonacci sequence. Given an integer $n$, output the $n$-th term of the Fibonacci sequence, where $n \le 39$.

**Problem Analysis:**

It is certain that this problem can be solved using recursion, but doing so presents a major drawback: extensive duplicate calculations in recursion will cause performance degradation or stack overflow. Alternatively, an iterative approach can be employed, storing intermediate results in variables like `fn1` and `fn2` and reusing them. Below, example code for both approaches is provided along with a discussion of their characteristics.

**Example Code:**

Iterative Approach:

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

Recursive Approach:

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

## Frog Jump Stairs Problem

**Problem Description:**

A frog can jump either 1 step or 2 steps at a time. Calculate the total number of distinct ways the frog can climb an $n$-step staircase.

**Problem Analysis:**

Analytical Reasoning:

> a. If there are two jump sizes, 1 step or 2 steps: suppose the first jump is 1 step, then $n-1$ steps remain, with $f(n-1)$ ways to jump;
> b. Suppose the first jump is 2 steps, then $n-2$ steps remain, with $f(n-2)$ ways to jump;
> c. From assumptions a and b, the total number of ways is: $f(n) = f(n-1) + f(n-2)$;
> d. Analyzing base cases from practical circumstances: when there is only 1 step, $f(1) = 1$; when there are 2 steps, $f(2) = 2$.

Pattern Recognition:

> $f(1) = 1, f(2) = 2, f(3) = 3, f(4) = 5$, from which we deduce the recurrence relation $f(n) = f(n-1) + f(n-2)$. Why does this pattern arise? Suppose there are 6 steps: we can jump one step from step 5 to step 6 (so however many ways exist to reach step 5, there are that many ways to reach step 6 via this path), or we can jump two steps from step 4 to step 6 (so however many ways exist to reach step 4, there are that many ways to reach step 6 via this path). No jump can go directly from step 3 to step 6, so ultimately $f(6) = f(5) + f(4)$. This also makes understanding the "Crazy Frog Jump" variation much more intuitive.

**Therefore, this problem is essentially a Fibonacci sequence problem.**

The code only requires a minor tweak from the previous problem. The only difference is that the initial terms in this problem are 1, 2, 3, 5, 8... whereas in the previous problem they were 1, 1, 2, 3, 5... This problem can also be solved recursively, but recursion is too inefficient, so only iterative code is provided here.

**Example Code:**

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

## Crazy Frog Jump (Jump Stairs II)

**Problem Description:**

A frog can jump up 1 step, 2 steps... or even up to $n$ steps at a time. Calculate the total number of distinct ways the frog can climb an $n$-step staircase.

**Problem Analysis:**

Assume $n \ge 2$, the first jump has $n$ possible choices: jump 1 step, jump 2 steps... up to jump $n$ steps:
- Jump 1 step: $n-1$ steps remain, with $f(n-1)$ remaining ways
- Jump 2 steps: $n-2$ steps remain, with $f(n-2)$ remaining ways
- ...
- Jump $n-1$ steps: 1 step remains, with $f(1)$ remaining ways
- Jump $n$ steps: 0 steps remain, with $f(0)$ remaining ways

Therefore, when $n \ge 2$:
$f(n) = f(n-1) + f(n-2) + \dots + f(1)$
Since $f(n-1) = f(n-2) + f(n-3) + \dots + f(1)$
Subtracting the two gives $f(n) = 2 \times f(n-1)$. Since $f(1) = 1$, we derive: **$f(n) = 2^{number-1}$**.

**Example Code:**

```java
int JumpFloorII(int number) {
    return 1 << --number; // 2^(number-1) implemented using bit shift, which is faster
}
```

**Supplementary Note:**

There are three bitwise shift operators in Java:

1. `<<`: **Left shift operator**, equivalent to multiplying by $2^n$
2. `>>`: **Signed right shift operator**, equivalent to dividing by $2^n$
3. `>>>`: **Unsigned right shift operator**, regardless of whether the highest bit before shifting was 0 or 1, the empty positions on the left are always filled with 0s.

```java
int a = 16;
int b = a << 2; // Left shift by 2, equivalent to 16 * 2^2, which is 16 * 4
int c = a >> 2; // Right shift by 2, equivalent to 16 / 2^2, which is 16 / 4
```

## Search in a 2D Array

**Problem Description:**

In a two-dimensional array, every row is sorted in ascending order from left to right, and every column is sorted in ascending order from top to bottom. Implement a function that takes such a 2D array and an integer to determine whether the array contains that integer.

**Problem Analysis:**

This problem is relatively straightforward; what we need to consider is how to achieve the fastest efficiency. Here is an intuitive approach:

> The matrix is sorted. Looking from the bottom-left corner, numbers decrease upwards and increase to the right.
> Therefore, starting from the bottom-left corner: when the target number is larger than the current number, move right.
> When the target number is smaller than the current number, move up. This achieves the fastest search speed.

**Example Code:**

```java
public boolean Find(int target, int [][] array) {
    // Basic idea: start searching from the bottom-left corner for fastest speed
    int row = array.length-1; // row
    int column = 0; // column
    // Loop condition holds while row >= 0 and current column < total columns
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

## Replace Spaces

**Problem Description:**

Implement a function to replace each space in a string with `"%20"`. For example, given the string `"We Are Happy."`, the replaced string should be `"We%20Are%20Happy."`.

**Problem Analysis:**

This problem is not difficult. We can iterate through the characters of the string: if a character is a space, append `"%20"` using the `append()` method; otherwise, append the original character.

Alternatively, `String.replace()` can be used directly to replace literal spaces in a single line of code.

**Example Code:**

Standard Approach:

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

One-line Solution:

```java
public String replaceSpace(StringBuffer str) {
    return str.toString().replace(" ", "%20");
}
```

## Integer Exponentiation of a Number (Power)

**Problem Description:**

Given a floating-point number `base` of type `double` and an integer `exponent` of type `int`, compute `base` raised to the power of `exponent`.

**Problem Analysis:**

This problem can be solved using **fast power (exponentiation by squaring)**. Two key boundary conditions must be handled: when base is 0 and exponent is negative, taking the reciprocal is undefined; when `Integer.MIN_VALUE` is negated directly, it overflows, so the exponent should first be converted to `long`.

For the business requirement of checking "whether base is exactly 0", `base == 0.0` can be used directly. Using an epsilon comparison would erroneously misclassify extremely small non-zero bases as 0.

Fast power halves the exponent in each round: when the lowest bit of the exponent is 1, multiply the current base into the result; then square the base and shift the exponent right by one bit. The time complexity is $O(logn)$.

**Time Complexity**: $O(logn)$

**Example Code:**

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

Of course, this problem can also be solved using a naive approach: cumulative multiplication. However, its time complexity is $O(n)$, which is less efficient than the fast power method.

```java
// Using cumulative multiplication
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

## Reorder Array to Place Odd Numbers Before Even Numbers

**Problem Description:**

Given an integer array, implement a function to adjust the order of elements so that all odd numbers precede all even numbers in the array, while preserving the relative ordering among odd numbers and among even numbers.

**Problem Analysis:**

There are multiple ways to solve this problem. Here is an intuitive approach:
First, count the number of odd elements, say $n$. Then create a new array of the same length, and loop through the original array to check whether each element is odd or even. If odd, add it to the new array starting from index 0; if even, add it starting from index $n$.

**Example Code:**

Algorithm with $O(n)$ time complexity and $O(n)$ space complexity:

```java
public class Solution {
    public void reOrderArray(int [] array) {
        // If array length is 0 or 1, return directly without doing anything
        if(array.length==0||array.length==1)
            return;
        // oddCount: stores the count of odd numbers
        // oddBegin: odd numbers are added starting from the beginning of the array
        int oddCount=0,oddBegin=0;
        // Create a new array
        int[] newArray=new int[array.length];
        // Calculate the number of odd elements in the array
        for(int i=0;i<array.length;i++){
            if((array[i]&1)==1) oddCount++;
        }
        for(int i=0;i<array.length;i++){
            // If the number is odd, add it from the start of the new array
            // If even, add it starting at index oddCount (count of odd elements)
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

## K-th Node from the End of a Linked List

**Problem Description:**

Given a linked list, output the $k$-th node from the end of the list.

**Problem Analysis:**

**In a Nutshell:**
Use two pointers: pointer `p1` starts advancing first. Once `p1` has traversed $k-1$ nodes, pointer `p2` begins moving. When `p1` reaches the final node, `p2` points precisely to the $k$-th node from the end.

**Intuitive Explanation of the Logic:**
Prerequisite assumption: the linked list contains $n$ nodes.
Rule 1: How many steps forward are needed to reach the $k$-th node from the end? For example, the 1st node from the end requires walking $n$ steps; the 2nd node from the end requires walking $n-1$ steps. Clearly, reaching the $k$-th node from the end requires walking $n-k+1$ steps from the start.

**Algorithm Execution:**

1. Initialize two pointers `p1` and `p2` both pointing to `head`. When `p1` has taken $k-1$ steps, pause. `p2` remains stationary until now.
2. When `p1` takes its $k$-th step, `p2` begins moving simultaneously. Why does `p2` start moving at this point? See below.
3. When `p1` reaches the end of the list, `p1` has taken $n$ steps. Since `p2` started moving after `p1` had already taken $k-1$ steps, `p1` and `p2` are always separated by $k-1$ steps. Therefore, when `p1` has taken $n$ steps, `p2` has taken $n-(k-1) = n-k+1$ steps. Ingeniously, `p2` points exactly to the $k$-th node from the end according to Rule 1.
Does this make the concept easy to understand?

**Examined Skills:**

Linked lists + code robustness.

**Example Code:**

```java
/*
// Linked list node class
public class ListNode {
    int val;
    ListNode next = null;

    ListNode(int val) {
        this.val = val;
    }
}*/

// Time complexity O(n), single pass
public class Solution {
    public ListNode FindKthToTail(ListNode head,int k) {
        ListNode pre=null,p=null;
        // Both pointers point to the head node
        p=head;
        pre=head;
        // Record k value
        int a=k;
        // Record node count
        int count=0;
        // Pointer p runs first and counts nodes; after p has traversed k-1 nodes, pre starts moving;
        // when p reaches the end, pre points to the k-th node from the end
        while(p!=null){
            p=p.next;
            count++;
            if(k<1){
                pre=pre.next;
            }
            k--;
        }
        // If total node count is less than the requested k-th node, return null
        if(count<a) return null;
        return pre;

    }
}
```

## Reverse Linked List

**Problem Description:**

Given a linked list, reverse it and output all elements of the reversed linked list.

**Problem Analysis:**

This is a classic linked list question. While the intuition is not difficult, implementing it from scratch can sometimes leave one unsure where to begin. Here we reference the standard approach.
Based on the properties of a linked list—where each node points to the next—we reverse the pointers so that each subsequent node points to its predecessor.
As illustrated below: we adjust node 1 and node 2, then have node 3 point to node 2, node 4 point to node 3, thereby reversing the list.

![Process of reversing linked list by switching adjacent node pointers](/media/jg/ext/oss.javaguide.cn/p3-juejin/844773c7300e4373922bb1a6ae2a55a3-tplv-k3u1fbpfcp-e8aa0d0f.png)

**Examined Skills:**

Linked lists + code robustness.

**Example Code:**

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
              // Save the next node to be traversed
               next = head.next;
               // Point current node to previously reversed node
               head.next = pre;
               // Advance pre to current node
               pre = head;
               // Move head forward along the list
               head = next;
        }
        return pre;
    }
}
```

## Merge Two Sorted Linked Lists

**Problem Description:**

Given two monotonically increasing linked lists, merge them into a single sorted linked list that satisfies the non-decreasing order requirement.

**Problem Analysis:**

We can break down the logic as follows:

1. Suppose we have two lists $A$ and $B$;
2. Compare the value of $A$'s head node $A_1$ with $B$'s head node $B_1$; assuming $A_1$ is smaller, $A_1$ serves as the merged head;
3. Next, compare $A_2$ with $B_1$; assuming $B_1$ is smaller, $A_1$ points to $B_1$;
4. Then compare $A_2$ with $B_2$...
Repeating this comparison loop sequentially merges the lists cleanly.

**Examined Skills:**

Linked lists + code robustness.

**Example Code:**

Non-recursive Version:

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
       // If list1 is null, return list2 directly
       if(list1 == null){
            return list2;
        }
        // If list2 is null, return list1 directly
        if(list2 == null){
            return list1;
        }
        ListNode mergeHead = null;
        ListNode current = null;
        // While neither list1 nor list2 is null
        while(list1!=null && list2!=null){
            // Choose the smaller value as head/next node
            if(list1.val <= list2.val){
                if(mergeHead == null){
                   mergeHead = current = list1;
                }else{
                   current.next = list1;
                    // Update current to list1 for subsequent connections
                   current = list1;
                }
                // Advance list1 to next node
                list1 = list1.next;
            }else{
                if(mergeHead == null){
                   mergeHead = current = list2;
                }else{
                   current.next = list2;
                     // Update current to list2 for subsequent connections
                   current = list2;
                }
                // Advance list2 to next node
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

Recursive Version:

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

## Implement a Queue Using Two Stacks

**Problem Description:**

Implement a queue using two stacks, providing `push` and `pop` operations. The elements in the queue are of type `int`.

**Problem Analysis:**

Review the core characteristics of stacks and queues:
**Stack:** Last In, First Out (LIFO)
**Queue:** First In, First Out (FIFO)
Clearly, we must implement queue behavior using the basic methods provided by JDK's `Stack` class:

![Common methods of the Stack class](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/5985000-b8057d4f.jpg)

Given two stacks, we can design the workflow as follows: when pushing, push elements into `stack1`; when popping, first transfer all elements from `stack1` into `stack2` by popping them one by one, and then pop from `stack2`. Reversing the order twice preserves the FIFO sequence: (negative [pop] $\times$ negative [pop] $=$ positive [FIFO]).

**Examined Skills:**

Queues + Stacks.

**Example Code:**

```java
// Solution referenced from Zuo Chengyun's "Coding Interview Guide"
import java.util.Stack;

public class Solution {
    Stack<Integer> stack1 = new Stack<Integer>();
    Stack<Integer> stack2 = new Stack<Integer>();

    // When executing push, add element to stack1
    public void push(int node) {
        stack1.push(node);
    }

    public int pop() {
        // If both stacks are empty, throw exception indicating queue is empty
        if(stack1.empty()&&stack2.empty()){
            throw new RuntimeException("Queue is empty!");
        }
        // If stack2 is empty, transfer all elements from stack1 into stack2
        if(stack2.empty()){
            while(!stack1.empty()){
                // Transfer elements from stack1 in LIFO order into stack2
                stack2.push(stack1.pop());
            }
        }
        return stack2.pop();
    }
}
```

## Stack Push and Pop Sequences

**Problem Description:**

Given two integer sequences where the first sequence represents the push order of a stack, determine whether the second sequence could be the pop order of that stack. Assume all numbers pushed into the stack are unique. For example, sequence `1, 2, 3, 4, 5` is a push order, and sequence `4, 5, 3, 2, 1` is a corresponding valid pop sequence, but `4, 3, 5, 1, 2` cannot be a valid pop sequence. (Note: both sequences have equal length).

**Problem Analysis:**

Referencing [Alias's answer](https://www.nowcoder.com/questionTerminal/d77d11405cc7470d82554cb392585106), which provides a clear and detailed explanation:

【Idea】Use an auxiliary stack. Iterate through the push sequence, pushing the first element (here 1) onto the stack. Check whether the top of the stack matches the first element in the pop sequence (here 4). Clearly $1 \ne 4$, so continue pushing elements until the top matches the pop target. Once matched, pop the element and advance the pointer in the pop sequence. Continue popping while elements match. Repeat this loop until the entire push sequence has been processed. If the auxiliary stack is empty at the end, the pop sequence is valid; otherwise, it is not.

Walkthrough:

Push sequence: `1, 2, 3, 4, 5`
Pop sequence: `4, 5, 3, 2, 1`

1. Push 1 into auxiliary stack; top is $1 \ne 4$; push 2
2. Top is $2 \ne 4$; push 3
3. Top is $3 \ne 4$; push 4
4. Top is $4 = 4$; pop 4; pop sequence pointer advances to 5; auxiliary stack contains `1, 2, 3`
5. Top is $3 \ne 5$; push 5
6. Top is $5 = 5$; pop 5; pop sequence pointer advances to 3; auxiliary stack contains `1, 2, 3`
7. ...
Continuing this process, the auxiliary stack ends up empty. If it remains non-empty, the sequence is invalid.

**Examined Skills:**

Stacks.

**Example Code:**

```java
import java.util.ArrayList;
import java.util.Stack;
// Solution referenced from Alias: https://www.nowcoder.com/questionTerminal/d77d11405cc7470d82554cb392585106
public class Solution {
    public boolean IsPopOrder(int [] pushA,int [] popA) {
        if(pushA.length == 0 || popA.length == 0)
            return false;
        Stack<Integer> s = new Stack<Integer>();
        // Used to track the current index in the pop sequence
        int popIndex = 0;
        for(int i = 0; i< pushA.length;i++){
            s.push(pushA[i]);
            // If stack is not empty and top element matches current pop target
            while(!s.empty() &&s.peek() == popA[popIndex]){
                // Pop element
                s.pop();
                // Advance pop sequence index
                popIndex++;
            }
        }
        return s.empty();
    }
}
```
