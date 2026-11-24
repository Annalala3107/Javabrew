---
title: Common Linked List Algorithm Problems
description: Curated solutions and insights for high-frequency linked list problems, covering scenarios like adding two numbers, reversing, and cycle detection, with emphasis on edge cases and complexity analysis.
category: Computer Science Basics
tag:
  - Algorithms
head:
  - - meta
    - name: keywords
      content: linked list algorithms,add two numbers,reverse linked list,cycle detection,merge linked lists,complexity analysis
lang: en
sourceRef: zh-ref/cs-basics/algorithms/linkedlist-algorithm-problems.md
---

<!-- markdownlint-disable MD024 -->

## 1. Add Two Numbers

### Problem Description

> LeetCode: You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.
>
> You may assume the two numbers do not contain any leading zero, except the number 0 itself.

Example:

```plain
Input: (2 -> 4 -> 3) + (5 -> 6 -> 4)
Output: 7 -> 0 -> 8
Explanation: 342 + 465 = 807
```

### Problem Analysis

LeetCode official detailed solution URL:

<https://leetcode-cn.com/problems/add-two-numbers/solution/>

> When you need to operate on the head node, consider creating a dummy node `dummy`, and use `dummy->next` to represent the real head node. This avoids edge case handling when the head node is null.

We use a variable to track the carry and simulate digit-by-digit addition starting from the list heads that contain the least significant digits.

![Figure 1: Visualizing the Add Two Numbers method: 342 + 465 = 807, each node contains a single digit, and digits are stored in reverse order.](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/34910956-b0579be2.png)

### Solution

**We first start adding from the least significant digits, which are the heads of lists l1 and l2. Note that carry conditions must be handled!**

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
 //https://leetcode-cn.com/problems/add-two-numbers/description/
class Solution {
public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    ListNode dummyHead = new ListNode(0);
    ListNode p = l1, q = l2, curr = dummyHead;
    // carry represents carry digit
    int carry = 0;
    while (p != null || q != null) {
        int x = (p != null) ? p.val : 0;
        int y = (q != null) ? q.val : 0;
        int sum = carry + x + y;
        // Carry
        carry = sum / 10;
        // The value of the new node is sum % 10
        curr.next = new ListNode(sum % 10);
        curr = curr.next;
        if (p != null) p = p.next;
        if (q != null) q = q.next;
    }
    if (carry > 0) {
        curr.next = new ListNode(carry);
    }
    return dummyHead.next;
}
}
```

## 2. Reverse Linked List

### Problem Description

> Sword to Offer: Given a linked list, reverse the linked list, and then output all elements of the linked list.

![Reverse Linked List](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/81431871-2a45237b.png)

### Problem Analysis

To put it plainly, this algorithm problem is: how to make the next node point to the previous node! In the code below, a `next` node is defined, primarily to save the node that needs to be reversed to the head, preventing the linked list from "breaking".

### Solution

```java
public class ListNode {
  int val;
  ListNode next = null;

  ListNode(int val) {
    this.val = val;
  }
}
```

```java
/**
 *
 * @author Snailclimb
 * @date September 19, 2018
 * @Description: Reverse a singly-linked list
 */
public class Solution {

  public ListNode ReverseList(ListNode head) {

    ListNode next = null;
    ListNode pre = null;

    while (head != null) {
      // Save the node to be reversed to the head
      next = head.next;
      // Point the node to be reversed to the previous already reversed node (Note: points to null on the first reversal)
      head.next = pre;
      // The previous node that has already been reversed to the head
      pre = head;
      // Move forward along the linked list
      head = next;
    }
    return pre;
  }

}
```

Test method:

```java
  public static void main(String[] args) {

    ListNode a = new ListNode(1);
    ListNode b = new ListNode(2);
    ListNode c = new ListNode(3);
    ListNode d = new ListNode(4);
    ListNode e = new ListNode(5);
    a.next = b;
    b.next = c;
    c.next = d;
    d.next = e;
    new Solution().ReverseList(a);
    while (e != null) {
      System.out.println(e.val);
      e = e.next;
    }
  }
```

Output:

```plain
5
4
3
2
1
```

## 3. Kth Node From End of List

### Problem Description

> Sword to Offer: Given a linked list, output the kth node from the end of this list.

### Problem Analysis

> **The kth node from the end of a linked list is the (L - K + 1)-th node from the front. Once you know this, this problem is essentially solved!**

First, use two nodes/pointers. One node `node1` starts moving first. After pointer `node1` traverses `k - 1` nodes, the other node `node2` starts moving. When `node1` reaches the end, the node pointed to by `node2` is the kth node from the end, which is the (L - K + 1)-th node from the front.

### Solution

```java
/*
public class ListNode {
    int val;
    ListNode next = null;

    ListNode(int val) {
        this.val = val;
    }
}*/

// Time complexity O(n), can be done in a single pass
// https://www.nowcoder.com/practice/529d3ae5a407492994ad2a246518148a?tpId=13&tqId=11167&tPage=1&rp=1&ru=/ta/coding-interviews&qru=/ta/coding-interviews/question-ranking
public class Solution {
  public ListNode FindKthToTail(ListNode head, int k) {
    // If the list is empty or k is less than or equal to 0
    if (head == null || k <= 0) {
      return null;
    }
    // Declare two nodes pointing to the head node
    ListNode node1 = head, node2 = head;
    // Record the number of nodes
    int count = 0;
    // Record the value of k, used later
    int index = k;
    // Pointer node1 runs first and counts nodes; after node1 advances k - 1 nodes, node2 starts running.
    // When node1 reaches the end, node2 points to the kth node from the end.
    while (node1 != null) {
      node1 = node1.next;
      count++;
      if (k < 1) {
        node2 = node2.next;
      }
      k--;
    }
    // If total nodes are fewer than the requested kth node from the end, return null
    if (count < index)
      return null;
    return node2;

  }
}
```

## 4. Remove Nth Node From End of List

> LeetCode: Given a linked list, remove the nth node from the end of the list and return its head.

**Example:**

```plain
Given linked list: 1->2->3->4->5, and n = 2.

After removing the second node from the end, the linked list becomes 1->2->3->5.

```

**Note:**

The given `n` will always be valid.

**Follow-up:**

Could you do this in one pass?

This problem has a detailed explanation on LeetCode; please refer to LeetCode for details.

### Problem Analysis

We notice that this problem can easily be simplified into another problem: remove the (L - n + 1)-th node from the beginning of the list, where L is the length of the list. As long as we find the length L of the list, this problem is easy to solve.

![Figure 1. Removing the (L - n + 1)-th element from the list](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/94354387-f7f7748c.png)

### Solution

**Two-Pass Approach**

First, we add a **dummy node** as an auxiliary node located at the head of the list. The dummy node simplifies certain edge cases, such as when the list contains only one node or when the head of the list needs to be deleted. In the first pass, we find the length L of the list. Then we set a pointer pointing to the dummy node and move it through the list until it reaches the (L - n)-th node. **We relink the `next` pointer of the (L - n)-th node to the (L - n + 2)-th node to complete the algorithm.**

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
// https://leetcode-cn.com/problems/remove-nth-node-from-end-of-list/description/
public class Solution {
  public ListNode removeNthFromEnd(ListNode head, int n) {
    // Dummy node, used to simplify edge cases such as a single-element list or deleting the head
    ListNode dummy = new ListNode(0);
    // Dummy node points to head
    dummy.next = head;
    // Store list length
    int length = 0;
    ListNode len = head;
    while (len != null) {
      length++;
      len = len.next;
    }
    length = length - n;
    ListNode target = dummy;
    // Find the node at position L - n
    while (length > 0) {
      target = target.next;
      length--;
    }
    // Relink the next pointer of the (L - n)-th node to the (L - n + 2)-th node
    target.next = target.next.next;
    return dummy.next;
  }
}
```

**Follow-up — One-Pass Approach:**

> The Nth node from the end of the list is the (L - n + 1)-th node from the front.

In fact, this method shares the exact same idea as the one used in finding the "kth node from the end of the list" in section 3 above. **The basic approach is:** define two nodes `node1` and `node2`; `node1` starts advancing first. When `node1` reaches the (n + 1)-th node, `node2` begins to advance. When `node1` reaches the last node, `node2` is positioned at the (L - n)-th node (where L represents total list length, which is the (n + 1)-th node from the end).

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
public class Solution {
  public ListNode removeNthFromEnd(ListNode head, int n) {

    ListNode dummy = new ListNode(0);
    dummy.next = head;
    // Declare two nodes pointing to the head node
    ListNode node1 = dummy, node2 = dummy;

    // node1 advances first; when node1 reaches the nth node, node2 starts advancing
    // When node1 reaches the last node, node2 is at the (L - n)-th node, which is the (n + 1)-th node from the end (L represents list length)
    while (node1 != null) {
      node1 = node1.next;
      if (n < 1 && node1 != null) {
        node2 = node2.next;
      }
      n--;
    }

    node2.next = node2.next.next;

    return dummy.next;

  }
}
```

## 5. Merge Two Sorted Lists

### Problem Description

> Sword to Offer: Given two monotonically increasing linked lists, output the merged linked list. Of course, the merged linked list must also satisfy the monotonically non-decreasing rule.

### Problem Analysis

We can analyze it as follows:

1. Suppose we have two lists A and B;
2. Compare the value of A's head node A1 with the value of B's head node B1; assuming A1 is smaller, A1 becomes the head node;
3. Next, compare A2 with B1; assuming B1 is smaller, A1 points to B1;
4. Next, compare A2 with B2;
5. Repeating this cycle is all that is needed; it should be straightforward to understand.

Consider implementing it recursively!

### Solution

**Recursive Version:**

```java
/*
public class ListNode {
    int val;
    ListNode next = null;

    ListNode(int val) {
        this.val = val;
    }
}*/
//https://www.nowcoder.com/practice/d8b6b4358f774294a89de2a6ac4d9337?tpId=13&tqId=11169&tPage=1&rp=1&ru=/ta/coding-interviews&qru=/ta/coding-interviews/question-ranking
public class Solution {
  public ListNode Merge(ListNode list1, ListNode list2) {
    if (list1 == null) {
      return list2;
    }
    if (list2 == null) {
      return list1;
    }
    if (list1.val <= list2.val) {
      list1.next = Merge(list1.next, list2);
      return list1;
    } else {
      list2.next = Merge(list1, list2.next);
      return list2;
    }
  }
}
```

## Interview Review Key Points

Code for linked list problems is usually not long, but the order of pointer updates is very prone to mistakes. Before an interview, master at least 4 templates: Dummy Head Node, Reverse Linked List, Fast and Slow Pointers, and Merge Linked Lists.

| Template | Applicable Problem Types | Key Points |
| -------- | ------------------------ | ---------- |
| Dummy Head Node | Node deletion, list merging, head node may change | Return `dummy.next` |
| Reverse Linked List | Full reversal, sub-segment reversal, reverse in K-group | Save `next`, then update `cur.next` |
| Fast and Slow Pointers | Cycle detection, kth from end, midpoint | Check `fast` and `fast.next` first |
| Merge Linked Lists | Two sorted lists, K sorted lists | Recursion or iteration; remember to attach the remaining list at the tail |

The iterative template for reversing a linked list should be memorized thoroughly:

```java
ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode cur = head;
    while (cur != null) {
        ListNode next = cur.next;
        cur.next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}
```

## Process Demonstration and Edge Cases

When reversing a linked list, the core is to save `next` first, then modify `cur.next`. You can remember the pointer transitions as follows:

```text
Initial: prev = null, cur = head

Each iteration:
next = cur.next
cur.next = prev
prev = cur
cur = next

Termination: cur == null, prev points to the new head node
```

For problems like node deletion and list merging, give priority to a dummy head node:

```java
ListNode dummy = new ListNode(0);
dummy.next = head;
// Operate uniformly on the list after dummy
return dummy.next;
```

A few error-prone points:

- When deleting the Nth node from the end, a dummy head node uniformly handles the case where the head node itself is deleted.
- Sub-segment reversal requires saving the node before the segment and the node after the segment beforehand.
- When determining if a linked list has a cycle, the loop condition is `fast != null && fast.next != null`.
- Merging linked lists recursively has concise code, but carries call stack overflow risk when the list is very long.
- Always step through edge cases individually: empty list, single-node list, deleting head node, deleting tail node.
