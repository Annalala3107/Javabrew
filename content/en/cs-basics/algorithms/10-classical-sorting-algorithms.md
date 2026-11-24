---
title: Summary of Top 10 Classical Sorting Algorithms
description: A systematic overview of the ten classical sorting algorithms, including comparisons of complexity and stability, covering core principles and implementation scenarios for comparison and non-comparison sorts to assist in rapid selection and optimization.
category: Computer Basics
tag:
  - Algorithms
head:
  - - meta
    - name: keywords
      content: sorting algorithms,quick sort,merge sort,heap sort,bubble sort,selection sort,insertion sort,shell sort,bucket sort,counting sort,radix sort,time complexity,space complexity,stability
lang: en
sourceRef: zh-ref/cs-basics/algorithms/10-classical-sorting-algorithms.md
---

<!-- markdownlint-disable MD024 -->

## Introduction

Sorting refers to the operation of arranging a sequence of records in ascending or descending order based on the magnitude of one or more of their keys. A sorting algorithm is the method by which records are arranged according to requirements. Sorting algorithms receive considerable attention across many fields, especially in processing large volumes of data. An efficient algorithm can save vast computational resources. Considering the various constraints and specifications of data across different domains, obtaining an optimal algorithm suited for practical applications requires extensive reasoning and analysis.

## Overview

### Sorting Algorithm Summary

Common internal sorting algorithms include: **Insertion Sort**, **Shell Sort**, **Selection Sort**, **Bubble Sort**, **Merge Sort**, **Quick Sort**, **Heap Sort**, **Radix Sort**, etc. This article focuses exclusively on internal sorting algorithms. The following table provides an overview:

| Sorting Algorithm | Time Complexity (Average) | Time Complexity (Worst) | Time Complexity (Best) | Space Complexity | In-place? | Stability |
| --- | --- | --- | --- | --- | --- | --- |
| Bubble Sort | O(n^2) | O(n^2) | O(n) | O(1) | Yes | Stable |
| Selection Sort | O(n^2) | O(n^2) | O(n^2) | O(1) | Yes | Unstable |
| Insertion Sort | O(n^2) | O(n^2) | O(n) | O(1) | Yes | Stable |
| Shell Sort | Depends on gap sequence | O(n^2) | O(nlogn) | O(1) | Yes | Unstable |
| Merge Sort | O(nlogn) | O(nlogn) | O(nlogn) | O(n) | No | Stable |
| Quick Sort | O(nlogn) | O(n^2) | O(nlogn) | Average O(logn), Worst O(n) | Yes | Unstable |
| Heap Sort | O(nlogn) | O(nlogn) | O(nlogn) | O(1) | Yes | Unstable |
| Counting Sort | O(n+k) | O(n+k) | O(n+k) | O(n+k) | No | Stable |
| Bucket Sort | Depends on data distribution | Depends on inner-bucket sort | O(n+k) | O(n+k) | No | Depends on inner-bucket sort |
| Radix Sort | O(d(n+r)) | O(d(n+r)) | O(d(n+r)) | O(n+r) | No | Stable |

**Terminology Definitions**:

- **n**: Data scale, representing the volume/size of data to be sorted.
- **k**: Counting range size or the number of buckets, depending on the specific algorithm.
- **d**: The maximum number of digits processed in radix sort.
- **r**: The radix (base) used in radix sort, such as `r=10` for decimal numbers.
- **Internal Sorting**: All data to be sorted can fit entirely into main memory, and sorting operations are executed primarily in RAM. All code implementations in this article are internal sorting algorithms.
- **External Sorting**: When the data volume is too large to fit entirely into main memory, external storage devices (such as disks) are utilized to process data in batches. A single algorithm can have an in-memory implementation or be adapted into an external sorting scheme; hence, this is not an intrinsic classification label of an algorithm.
- **Stable**: If element A originally appears before element B and $A = B$, element A remains before element B after sorting.
- **Unstable**: If element A originally appears before element B and $A = B$, element A may appear after element B after sorting.
- **Time Complexity**: A qualitative description of the execution time consumed by an algorithm.
- **Space Complexity**: A qualitative description of the memory space required by an algorithm during execution.

### Classification of Sorting Algorithms

The ten common sorting algorithms can be classified into two major categories: **Comparison-based Sorting** and **Non-comparison Sorting**.

![Classification of Sorting Algorithms](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/sort2-20982b02.png)

Common algorithms such as **Quick Sort**, **Merge Sort**, **Heap Sort**, and **Bubble Sort** all belong to **comparison-based sorting algorithms**. Comparison-based sorting determines the relative order between elements through comparisons. In the comparison model, general-purpose sorting requires `Ω(nlogn)` comparisons in the worst case. Bubble sort requires multiple passes of scanning, yielding an average time complexity of `O(n²)`; merge sort and quick sort leverage divide-and-conquer to break the problem into smaller subproblems, achieving an average time complexity of `O(nlogn)`.

The primary advantage of comparison-based sorting is that it applies to datasets of any scale regardless of data distribution. It is fair to say comparison sorting is applicable in virtually all sorting scenarios.

In contrast, **Counting Sort**, **Radix Sort**, and **Bucket Sort** belong to **non-comparison sorting algorithms**. They bypass the lower bound of comparison-based sorting by leveraging extra information such as key ranges, data distributions, or digit counts. However, they cannot all finish with a single pass in `O(n)`. Counting sort typically runs in `O(n+k)`, bucket sort efficiency depends on data distribution and inner-bucket sorting, and radix sort typically runs in `O(d(n+r))`.

Non-comparison sorting boasts lower theoretical time complexity, but because it requires extra memory space to establish unique element positions, it imposes specific requirements on data scale and distribution.

## Bubble Sort

Bubble Sort is a simple sorting algorithm. It repeatedly traverses the sequence to be sorted, compares two adjacent elements at a time, and swaps them if they are in the wrong order. Traversal passes are repeated until no swaps are needed, indicating that the sequence is fully sorted. The algorithm gets its name because smaller (or larger) elements gradually "bubble" to the top of the sequence through successive swaps.

### Algorithm Steps

1. Compare adjacent elements. If the first is greater than the second, swap them;
2. Perform the same work for each pair of adjacent elements, from the first pair to the last pair. After this pass, the largest element moves to the final position;
3. Repeat the above steps for all elements except the last one;
4. Repeat steps 1–3 until sorting is complete.

### Visual Walkthrough

![Bubble Sort](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/bubble_sort-672a65a3.gif)

### Code Implementation

```java
/**
 * Bubble Sort
 * @param arr
 * @return arr
 */
public static int[] bubbleSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        // Set a flag, if true, that means the loop has not been swapped,
        // that is, the sequence has been ordered, the sorting has been completed.
        boolean flag = true;
        for (int j = 0; j < arr.length - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
                // Change flag
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

**A minor optimization has been applied here by introducing the `is_sorted` flag (`flag`). The purpose is to optimize the best-case time complexity to `O(n)`, meaning that when the original input sequence is already sorted, the algorithm runs in `O(n)` time.**

### Algorithm Analysis

- **Stability**: Stable
- **Time Complexity**: Best: $O(n)$, Worst: $O(n^2)$, Average: $O(n^2)$
- **Space Complexity**: $O(1)$
- **Sorting Approach**: In-place

## Selection Sort

Selection Sort is a simple and intuitive sorting algorithm that exhibits $O(n^2)$ time complexity regardless of the input data. Therefore, when using it, the smaller the data scale, the better. Its sole advantage is that it requires no extra memory space. How it works: First, locate the minimum (or maximum) element in the unsorted sequence and place it at the starting position of the sorted sequence. Next, search for the minimum (or maximum) element among the remaining unsorted elements and append it to the end of the sorted sequence. Repeat this process until all elements are sorted.

### Algorithm Steps

1. Find the minimum (or maximum) element in the unsorted sequence and place it at the start of the sorted sequence.
2. Search for the minimum (or maximum) element from the remaining unsorted elements, then append it to the end of the sorted sequence.
3. Repeat step 2 until all elements are sorted.

### Visual Walkthrough

![Selection sort selects the minimum element in each pass and places it at the end of the sorted region](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/selection_sort-44ff5287.gif)

### Code Implementation

```java
/**
 * Selection Sort
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

### Algorithm Analysis

- **Stability**: Unstable
- **Time Complexity**: Best: $O(n^2)$, Worst: $O(n^2)$, Average: $O(n^2)$
- **Space Complexity**: $O(1)$
- **Sorting Approach**: In-place

## Insertion Sort

Insertion Sort is a simple and intuitive sorting algorithm. It works by constructing an ordered sequence: for each unsorted element, it scans backward through the already-sorted sequence, identifies its appropriate position, and inserts it. Implementation-wise, insertion sort is typically done in-place (requiring only $O(1)$ additional space). Consequently, during the backward scan, sorted elements must repeatedly be shifted backward to make room for the new element.

Although the code implementation of insertion sort is not as straightforward as bubble sort or selection sort, its underlying principle is perhaps the easiest to understand—anyone who has arranged playing cards in hand can grasp it immediately. Insertion sort builds an ordered sequence by taking each unsorted item and scanning from back to front in the sorted portion to find and insert it into the correct position.

Like bubble sort, insertion sort also has an optimized variant known as binary insertion sort (half-interval search insertion).

### Algorithm Steps

1. Begin with the first element, which can be considered already sorted;
2. Pick the next element and scan from back to front through the sorted sequence;
3. If the examined (sorted) element is greater than the new element, shift that element to the next position;
4. Repeat step 3 until finding a position where the sorted element is less than or equal to the new element;
5. Insert the new element into that position;
6. Repeat steps 2–5.

### Visual Walkthrough

![Demonstration of the insertion sort process](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/insertion_sort-8adb9197.gif)

### Code Implementation

```java
/**
 * Insertion Sort
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

### Algorithm Analysis

- **Stability**: Stable
- **Time Complexity**: Best: $O(n)$, Worst: $O(n^2)$, Average: $O(n^2)$
- **Space Complexity**: $O(1)$
- **Sorting Approach**: In-place

## Shell Sort

Shell Sort was proposed by Donald Shell in 1959. Shell sort is also a form of insertion sort, functioning as an improved, more efficient version of simple insertion sort, also known as diminishing increment sort. Its performance depends heavily on the chosen gap sequence: some later-designed sequences achieve sub-quadratic upper bounds, but the original Shell sequence used here still degrades to $O(n^2)$ in the worst case.

The fundamental idea of Shell sort is: first divide the entire sequence of records into several sub-sequences according to a gap and perform direct insertion sort on each. Once the records across the entire sequence are "nearly sorted", perform a direct insertion sort on the entire sequence.

### Algorithm Steps

Let us examine the basic steps of Shell sort. Here we choose the initial increment $gap = length / 2$ and diminish it successively via $gap = gap / 2$. This sequence of increments can be expressed as $\lbrace \frac{n}{2}, \frac{(n/2)}{2}, \dots, 1 \rbrace$, referred to as the **increment sequence (gap sequence)**. The selection and mathematical proof of gap sequences in Shell sort is a difficult mathematical challenge. The sequence chosen here is commonly used and was proposed by Shell himself (known as the Shell increment), although it is not optimal. We use it here for demonstration purposes.

First, partition the sequence into several sub-sequences and perform direct insertion sort. The detailed algorithm description:

- Choose an increment sequence $\lbrace t_1, t_2, \dots, t_k \rbrace$, where $t_i \gt t_j, i \lt j, t_k = 1$;
- Perform $k$ sorting passes over the sequence according to the number of increments $k$;
- In each pass, divide the sequence into sub-sequences of length $m$ based on the current increment $t$, and execute direct insertion sort on each sub-table. Only when the increment factor reaches 1 is the entire sequence processed as a single table, whose length equals the full sequence length.

### Visual Walkthrough

![Shell sort grouping elements by gap and applying insertion sort](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/shell_sort-913a592b.png)

### Code Implementation

```java
/**
 * Shell Sort
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
            // Insertion sort
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

### Algorithm Analysis

- **Stability**: Unstable
- **Time Complexity**: Best: $O(nlogn)$, Worst: $O(n^2)$, Average complexity depends on the gap sequence
- **Space Complexity**: $O(1)$

## Merge Sort

Merge Sort is an efficient sorting algorithm built upon the merge operation. It represents a quintessential application of the Divide and Conquer strategy. Merge sort is a stable sorting method. It merges already sorted sub-sequences to obtain a fully sorted sequence—that is, first making each sub-sequence ordered, and then making sub-sequence segments mutually ordered. Merging two ordered lists into a single ordered list is called 2-way merging.

Like selection sort, merge sort's running time is unaffected by input data patterns, but its performance is vastly superior to selection sort because it maintains an $O(nlogn)$ time complexity under all conditions. The trade-off is that it requires additional memory space.

### Algorithm Steps

Merge sort is a recursive process whose base case immediately returns when the input sequence has only one element. The detailed procedure is as follows:

1. If the input contains only one element, return directly; otherwise, divide the input sequence of length $n$ into two sub-sequences of length $n/2$;
2. Recursively apply merge sort to both sub-sequences to make them sorted;
3. Initialize two pointers pointing to the starting positions of the two sorted sub-sequences;
4. Compare the elements pointed to by the two pointers, place the smaller element into the merged buffer (used to store sorted results), and advance the corresponding pointer;
5. Repeat steps 3–4 until one pointer reaches the end of its sub-sequence;
6. Copy all remaining elements of the other sub-sequence directly to the end of the merged sequence.

### Visual Walkthrough

![Merge sort recursively dividing an array and merging sorted subarrays](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/merge_sort-1eb5655c.gif)

### Code Implementation

```java
/**
 * Merge Sort
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
 * Merge two sorted arrays
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

### Algorithm Analysis

- **Stability**: Stable
- **Time Complexity**: Best: $O(nlogn)$, Worst: $O(nlogn)$, Average: $O(nlogn)$
- **Space Complexity**: $O(n)$

## Quick Sort

Quick Sort employs the divide-and-conquer philosophy, just like merge sort. At first glance, quick sort and merge sort appear very similar: both break the problem down into smaller instances, sort sub-segments first, and ultimately combine them. The difference is that quick sort applies an additional partition step when breaking down subproblems, dividing the dataset into smaller and larger partitions so that the final combination step does not require comparisons like merge sort does. However, because partitioning is indeterminate, quick sort's time complexity can vary.

The fundamental idea of quick sort: partition the sequence into two independent sub-sequences in a single pass such that all elements in one sub-sequence are smaller than all elements in the other. Then, continue sorting both sub-sequences independently to achieve full ordering of the sequence.

### Algorithm Steps

Quick sort uses the [Divide and Conquer](https://en.wikipedia.org/wiki/Divide-and-conquer_algorithm) strategy to divide a sequence into two sub-sequences (smaller and larger elements) and recursively sorts them. The specific algorithm description is as follows:

1. **Pick a Pivot**: Select an element from the array as the pivot. To avoid worst-case scenarios, a random selection is typically used.
2. **Partition**: Rearrange the sequence so that all elements smaller than the pivot value are placed before it, and all elements larger than the pivot value are placed after it (equal values may go to either side). After this operation finishes, the pivot sits in its final sorted position.
3. **Recurse**: Recursively apply quick sort to the sub-sequence of elements smaller than the pivot and the sub-sequence of elements greater than the pivot.

**Regarding performance, this marks the crucial distinction between quick sort and merge sort:**

- **Average and Best Case:** The time complexity is $O(nlogn)$. This happens when each partition splits the array into two equal halves.
- **Worst Case:** The time complexity degrades to $O(n^2)$. This occurs when the chosen pivot is consistently the minimum or maximum element in the current array—such as choosing the first element as the pivot on an already sorted array. This leads to extremely unbalanced partitions, degrading the algorithm into something resembling bubble sort. This is why **random pivot selection** is critical.

### Visual Walkthrough

![Random quick sort selecting pivot and recursively partitioning subarrays](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/random_quick_sort-76fd9f32.gif)

### Code Implementation

```java
import java.util.concurrent.ThreadLocalRandom;

class Solution {
    public int[] sortArray(int[] a) {
        quick(a, 0, a.length - 1);
        return a;
    }

    // Core recursive function of quick sort
    void quick(int[] a, int left, int right) {
        if (left >= right) { // Recursion base case: interval has one or zero elements
            return;
        }
        int p = partition(a, left, right); // Partitioning operation, returns pivot index
        quick(a, left, p - 1); // Recursively sort left subarray
        quick(a, p + 1, right); // Recursively sort right subarray
    }

    // Partition function: splits array into two parts, smaller than pivot on left, larger on right
    int partition(int[] a, int left, int right) {
        // Randomly select a pivot index to avoid worst-case scenarios (e.g. nearly sorted arrays)
        int idx = ThreadLocalRandom.current().nextInt(right - left + 1) + left;
        swap(a, left, idx); // Place pivot at the leftmost end of the array
        int pv = a[left]; // Pivot value
        int i = left + 1; // Left pointer, points to current element to check
        int j = right; // Right pointer, searches from right to left for elements smaller than pivot

        while (i <= j) {
            // Move left pointer rightward until finding an element greater than or equal to pivot
            while (i <= j && a[i] < pv) {
                i++;
            }
            // Move right pointer leftward until finding an element less than or equal to pivot
            while (i <= j && a[j] > pv) {
                j--;
            }
            // If left pointer has not crossed right pointer, swap the two misplaced elements
            if (i <= j) {
                swap(a, i, j);
                i++;
                j--;
            }
        }
        // Place pivot at partition point, so left side is smaller and right side is larger
        swap(a, j, left);
        return j;
    }

    // Swap positions of two elements in array
    void swap(int[] a, int i, int j) {
        int t = a[i];
        a[i] = a[j];
        a[j] = t;
    }
}
```

### Algorithm Analysis

- **Stability**: Unstable
- **Time Complexity**: Best: $O(nlogn)$, Worst: $O(n^2)$, Average: $O(nlogn)$
- **Space Complexity**: Average $O(logn)$, Worst $O(n)$ (recursion call stack)

## Heap Sort

Heap Sort refers to a sorting algorithm designed using the heap data structure. A heap is an almost complete binary tree structure that satisfies the **heap property**: **a child node's value is always less than (or greater than) its parent node's value**.

### Algorithm Steps

1. Build the initial unsorted sequence $(R_1, R_2, \dots, R_n)$ into a max heap, which serves as the initial unsorted region;
2. Swap the root element $R_1$ with the last element $R_n$. This yields a new unsorted region $(R_1, R_2, \dots, R_{n-1})$ and a new sorted region $R_n$, satisfying $R_i \leqslant R_n (i \in 1, 2,\dots, n-1)$;
3. Since the new root $R_1$ after swapping may violate the heap property, adjust the unsorted region $(R_1, R_2, \dots, R_{n-1})$ back into a heap. Then swap $R_1$ with the last element of the unsorted region again to produce a new unsorted region $(R_1, R_2, \dots, R_{n-2})$ and sorted region $(R_{n-1}, R_n)$. Repeat this process until the sorted region contains $n-1$ elements, completing the entire sorting process.

### Visual Walkthrough

![Heap sort building max heap and sequentially extracting root elements](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/heap_sort-67c4db1d.gif)

### Code Implementation

```java
// Global variable that records the length of an array;
static int heapLen;

/**
 * Swap the two elements of an array
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
 * Build Max Heap
 * @param arr
 */
private static void buildMaxHeap(int[] arr) {
    for (int i = arr.length / 2 - 1; i >= 0; i--) {
        heapify(arr, i);
    }
}

/**
 * Adjust it to the maximum heap
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
 * Heap Sort
 * @param arr
 * @return
 */
public static int[] heapSort(int[] arr) {
    // index at the end of the heap
    heapLen = arr.length;
    // build MaxHeap
    buildMaxHeap(arr);
    for (int i = arr.length - 1; i > 0; i--) {
        // Move the top of the heap to the tail of the heap in turn
        swap(arr, 0, i);
        heapLen -= 1;
        heapify(arr, 0);
    }
    return arr;
}
```

### Algorithm Analysis

- **Stability**: Unstable
- **Time Complexity**: Best: $O(nlogn)$, Worst: $O(nlogn)$, Average: $O(nlogn)$
- **Space Complexity**: $O(1)$

## Counting Sort

The core of Counting Sort lies in converting input data values into keys stored in an extra allocated array space. As an algorithm with linear time complexity, **counting sort requires that input data must be integers with a defined range**.

Counting Sort is a stable sorting algorithm. It utilizes an auxiliary array `C`, where the `i`-th element records the count of elements in the input array `A` whose value equals `i`. It then uses array `C` to place the elements of `A` into their correct positions. **It can only sort integers**.

### Algorithm Steps

1. Find the maximum value `max` and minimum value `min` in the array;
2. Create a new array `C` with length `max - min + 1`, initializing all elements to 0;
3. Traverse the elements `A[i]` in the original array `A`, using `A[i] - min` as the index in `C` and incrementing the count `C[A[i] - min]` for each occurrence;
4. Transform array `C` such that **each element is the prefix sum of itself and all previous elements**, i.e., when `i > 0`, `C[i] = C[i] + C[i - 1]`;
5. Create a result array `R` with the same length as the original array.
6. **Traverse the original array `A` from back to front**: for each element `A[i]`, compute index `A[i] - min` to find its corresponding value `C[A[i] - min]`. The position of `A[i]` in result array `R` is `C[A[i] - min] - 1`. After placing the element, decrement `count[A[i] - min]` by 1.

### Visual Walkthrough

![Counting sort determining ordered positions by counting element frequencies](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/counting_sort-7605b0f0.gif)

### Code Implementation

```java
/**
 * Gets the maximum and minimum values in the array
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
 * Counting Sort
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

### Algorithm Analysis

When the input consists of $n$ integers ranging between $0$ and $k$, its running time is $O(n+k)$. Counting sort is not a comparison sort, and its sorting speed surpasses any comparison-based sorting algorithm. Because the length of the counting array `C` depends on the data range of the array to be sorted (equal to the **difference between the maximum and minimum values plus 1**), counting sort requires substantial extra memory for arrays with large value ranges.

- **Stability**: Stable
- **Time Complexity**: Best: $O(n+k)$, Worst: $O(n+k)$, Average: $O(n+k)$
- **Space Complexity**: $O(n+k)$

## Bucket Sort

Bucket Sort is an enhanced version of counting sort. It leverages a mathematical mapping function, and its efficiency hinges entirely on the design of this mapping function. To maximize bucket sort efficiency, two conditions should be met:

1. When ample extra memory is available, maximize the number of buckets
2. Use a mapping function capable of distributing $N$ input items evenly across $K$ buckets

Bucket sort operates on this principle: assuming input data follows a uniform distribution, elements are partitioned into a finite number of buckets. Each bucket is then sorted independently (either by using another sorting algorithm or recursively applying bucket sort).

### Algorithm Steps

1. Define a `bucket_size`, representing how many distinct values each bucket can accommodate;
2. Traverse input data and map each element into its corresponding bucket;
3. Sort each non-empty bucket, using other sorting methods or recursively applying bucket sort;
4. Concatenate the sorted elements from each non-empty bucket sequentially.

### Visual Walkthrough

![Bucket sort distributing data into buckets, sorting individually, and merging](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/bucket_sort-7aae71fe.gif)

### Code Implementation

```java
/**
 * Gets the maximum and minimum values in the array
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
 * Bucket Sort
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

### Algorithm Analysis

- **Stability**: Depends on inner-bucket sorting. The current implementation inserts elements into buckets preserving original order and uses stable `List.sort`, so it is stable.
- **Time Complexity**: For the current implementation, best case is $O(n+k)$; when data is uniformly distributed, expected time approaches $O(n+k)$; worst case is $O(nlogn+k)$. If insertion sort were used within buckets, the worst case would degrade to $O(n^2)$.
- **Space Complexity**: $O(n+k)$

## Radix Sort

Radix Sort is another non-comparison sorting algorithm that sorts elements digit by digit, starting from the least significant digit (LSD). Given an array length $n$, maximum number of digits $d$, and radix $r$, its complexity is $O(d(n+r))$. The decimal LSD implementation below supports non-negative integers only.

Radix sort works by sorting by low-order digits first and collecting them, then sorting by higher-order digits and collecting them, repeating until the highest-order digit is processed. Occasionally attributes possess a hierarchy of priorities: sorting first by lower priority and then by higher priority. The final order ensures higher-priority items appear first, while among items with identical higher priority, those with higher lower priority appear first. Because radix sort relies on independent distribution and collection passes, it is stable.

### Algorithm Steps

1. Find the maximum number in the array and determine its number of digits, which becomes the iteration count $N$ (for example, if the maximum value is 1000, then $N=4$);
2. Let `A` be the original array; extract each digit starting from the least significant digit into `radix` buckets;
3. Perform counting sort on `radix` (leveraging counting sort's suitability for small value ranges);
4. Collect elements from `radix` back into the original array sequentially;
5. Repeat steps 2–4 $N$ times.

### Visual Walkthrough

![Radix sort ordering and collecting digits from lowest to highest](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/sorting-algorithms/radix_sort-da1fa3af.gif)

### Code Implementation

```java
/**
 * Radix Sort
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

### Algorithm Analysis

- **Stability**: Stable
- **Time Complexity**: Best, worst, and average are all $O(d(n+r))$
- **Space Complexity**: $O(n+r)$

**Radix Sort vs Counting Sort vs Bucket Sort**

All three sorting algorithms utilize the concept of "buckets", but differ significantly in how buckets are applied:

- Radix Sort: Distributes buckets based on each digit of the key.
- Counting Sort: Each bucket stores only a single distinct key value.
- Bucket Sort: Each bucket stores a specific range of values.

## Reference Articles

- [Summary of Sorting Algorithms (Primary Reference Source)](https://www.cnblogs.com/guoyaohua/p/8600214.html)
- <https://en.wikipedia.org/wiki/Sorting_algorithm>
- <https://sort.hust.cc/>

## Interview Review Highlights

In sorting algorithm interviews, you will generally not be required to hand-write all 10 sorting algorithms, but you must clearly articulate their complexity, stability, in-place characteristics, and applicable scenarios.

| Sorting Algorithm | Average Time Complexity | Worst Time Complexity | Space Complexity | Stability | In-place? |
| --- | --- | --- | --- | --- | --- |
| Bubble Sort | `O(n^2)` | `O(n^2)` | `O(1)` | Stable | Yes |
| Selection Sort | `O(n^2)` | `O(n^2)` | `O(1)` | Unstable | Yes |
| Insertion Sort | `O(n^2)` | `O(n^2)` | `O(1)` | Stable | Yes |
| Merge Sort | `O(nlogn)` | `O(nlogn)` | `O(n)` | Stable | No |
| Quick Sort | `O(nlogn)` | `O(n^2)` | Average `O(logn)`, Worst `O(n)` | Unstable | Yes |
| Heap Sort | `O(nlogn)` | `O(nlogn)` | `O(1)` | Unstable | Yes |
| Counting Sort | `O(n+k)` | `O(n+k)` | `O(n+k)` | Stable | No |
| Bucket Sort | Depends on data distribution | Depends on inner-bucket sort | `O(n+k)` | Depends on inner-bucket sort | No |
| Radix Sort | `O(d(n+r))` | `O(d(n+r))` | `O(n+r)` | Stable | No |

Several high-frequency follow-up questions:

- **Why is Quick Sort $O(n^2)$ in the worst case? How can we reduce degradation probability?** Random pivot selection or median-of-three can be used.
- **Why is Merge Sort stable?** Because during merging, equal elements can prioritize the element from the left array.
- **Why is Heap Sort unstable?** Because heap adjustment and swapping can disrupt the original relative ordering of equal elements.
- **When does Insertion Sort perform best?** When the array is nearly sorted and of moderate/small size.
- **Why are Counting Sort, Bucket Sort, and Radix Sort not general-purpose sorts?** Because they depend on specific data ranges, distributions, or digit representations.

## Java Code Template

In sorting interviews, the most frequently hand-written algorithms are Quick Sort and Merge Sort. For Quick Sort, special attention must be paid to partition boundaries. Below is a common implementation pattern:

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

If you are concerned that an already sorted array could cause quick sort to degrade, you can randomly select a pivot prior to partitioning and swap it to the `right` position:

```java
int randomIndex = left + new Random().nextInt(right - left + 1);
swap(nums, randomIndex, right);
```

## Process Diagram and Boundary Test Cases

A single partition pass in Quick Sort can be understood as follows:

```text
Original array range: [left ... right]
pivot: choose nums[right]
less: points to the next position in the "less than or equal to pivot region"
i: scans from left to right - 1

After scanning finishes:
[left ... less - 1] <= pivot
[less ... right - 1] > pivot
Swap pivot to position `less`, and recurse on left and right sides of pivot respectively
```

A few boundary test cases worth reviewing before hand-writing code:

- **Empty array or single element:** Return immediately.
- **Already sorted or reversed:** Consistently choosing the first or last element as pivot easily causes degradation.
- **Substantial duplicate elements:** Standard 2-way partitioning may be suboptimal; 3-way quick sort can be explored.
- **When the interviewer asks about stability:** Never claim quick sort is stable; standard quick sort swaps disrupt the relative ordering of equal elements.
