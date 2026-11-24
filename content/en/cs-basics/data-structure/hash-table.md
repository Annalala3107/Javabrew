---
title: "Hash Table Interview Questions Summary: Hash Collisions, Resizing, and Java HashMap"
description: "A comprehensive summary of hash table interview questions covering hash functions, hash collisions, chaining, open addressing, load factor, resizing, Java HashMap, and high-frequency LeetCode problems."
category: Computer Science Basics
tag:
  - Data Structure
head:
  - - meta
    - name: keywords
      content: Hash Table,HashMap,Hash Function,Hash Collision,Chaining,Open Addressing,Load Factor,Resizing,Java Collections,Data Structure Interview Questions
lang: en
sourceRef: zh-ref/cs-basics/data-structure/hash-table.md
---

Hash tables (also known as scatter tables) have immense interview value because they bridge the gap between fast lookups and frequency counting in algorithm problems on one end, and Java's `HashMap`, caching systems, deduplication, and sharded routing in distributed architectures on the other.

The fundamental problem being evaluated is: how to map a key to an array index rapidly while maintaining acceptable query performance in the presence of collisions, resizing, and adversarial input data.

Article Overview:

1. What is a hash table?
2. How does a hash table locate an array index from a key?
3. What specific problems do hash collisions, load factors, and resizing solve?
4. What is the relationship between Java's `HashMap` and a general hash table?
5. How are hash tables applied in algorithmic problems and production engineering scenarios?

![Schematic diagram showing how a hash table maps keys to array positions via a hash function](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/hash-table-8efd5f49.png)

## What Is a Hash Table?

A hash table is a data structure used to store key-value mappings. Concepts we commonly refer to as Maps, Dictionaries, or Associative Arrays can fundamentally all be implemented using a hash table.

If keys are contiguous integers—for example, student IDs ranging precisely from `0` to `999`—a plain array achieves `O(1)` access directly via `students[id]`. However, keys in real-world business scenarios are rarely that well-behaved: they can be strings, user UUIDs, order numbers, URLs, or custom objects. What a hash table does is convert these arbitrary keys of varying types and lengths into an integer via a hash function, and then map that integer to an array index.

You can break a hash table down into three conceptual layers:

1. **Array**: The actual storage location for data, often referred to as buckets.
2. **Hash Function**: Responsible for computing a hash value from the key.
3. **Collision Resolution Strategy**: Dictates how to store multiple keys when they map to the same bucket.

Therefore, a hash table does not "eliminate the search process entirely"; rather, it drastically narrows down the search space via the hash function: ideally, a single operation locates the target bucket; when collisions occur, a minimal number of comparisons are performed within that bucket.

## Why Do We Need a Hash Table?

Suppose you need to determine whether a URL has already been crawled. The most straightforward approach is to store crawled URLs in a list and perform a full linear scan whenever a new URL arrives. When data volume is small, this is acceptable; but once millions of URLs have been crawled, scanning the entire list each time immediately causes performance to collapse.

The hash table approach trades space for time: allocate extra array space and distribute URLs across different buckets using a hash function. During a query, instead of traversing all URLs from the beginning, the system computes the hash value first and jumps directly to the corresponding bucket.

This is precisely why hash tables excel at lookups, counting, deduplication, and cache indexing. A hash table does not care about the relative order of elements, nor does it guarantee sorting; it focuses strictly on: "Given a key, can I locate the corresponding value as quickly as possible?"

## What Problem Does a Hash Function Solve?

The goal of a hash function is not to obscure the key, but to distribute keys as uniformly as possible across the array. A well-designed hash function typically satisfies three criteria:

| Requirement | Meaning |
| ----------- | ------- |
| Deterministic / Stable | The same key must always produce the identical hash value across multiple computations |
| Fast Computation | Computing the hash function itself must be fast; otherwise, it negates the performance benefits of the hash table |
| Uniform Distribution | Distinct keys should map to different positions as evenly as possible to minimize hash collisions |

It is worth noting that hash functions in general hash tables are fundamentally different from cryptographic hash functions. Hash tables prioritize speed and distribution uniformity, whereas cryptographic hashes prioritize collision resistance, preimage resistance, and tamper-proofing.

In Java, when using a custom object as a `HashMap` key, `hashCode()` and `equals()` must be implemented consistently: if two objects are equal according to `equals()`, their `hashCode()` must be identical; conversely, two objects having the same `hashCode()` does not guarantee that they are equal. This asymmetry is one of the fundamental reasons hash collisions exist.

## Interview Focus Points

- The hash function maps a key into an array index.
- Hash collisions cannot be entirely avoided; they can only be mitigated and resolved through strategy.
- Average lookup, insertion, and deletion times in a hash table are `O(1)`, but can degrade in the worst case.
- Java's `HashMap` utilizes an array + linked list + Red-Black tree structure; starting in JDK 8, sufficiently long chains undergo treeification.
- Hash tables are predominantly used for fast lookup, frequency counting, deduplication, and cache indexing.

## How Does a Hash Table Work?

Taking the insertion of a key-value pair as an example, a hash table typically executes the following steps:

1. Compute the hash code for the key.
2. Map the hash value to an array index based on the array length.
3. If the slot is empty, store the element directly.
4. If a collision occurs, resolve it according to the chosen collision resolution strategy.

```java
int index = hash(key) & (table.length - 1);
```

When the capacity of `HashMap` is a power of 2, a bitwise AND operation can replace the modulo operator. Bitwise operations are significantly faster and simplify redistributing elements during resizing.

Here, `hash(key)` typically does not use the object's raw `hashCode()` directly; it applies a perturbation function that mixes the higher bits into the lower bits before computing the index. The rationale is straightforward: when the array length is a power of 2, `length - 1` has all binary 1s in its lower bits, meaning a direct `&` relies almost entirely on the lower bits of the hash code. If those lower bits have poor distribution, collisions become severely concentrated.

## How Are Hash Collisions Resolved?

| Method | Core Concept | Typical Application | Key Considerations |
| ------ | ------------ | ------------------- | ------------------ |
| Chaining | Attach a linked list or tree to each array slot | Java `HashMap` | Excessively long chains degrade lookup performance |
| Open Addressing | Probe for the next available slot upon collision | High-performance specialized hash tables | Deletion and load factor management are more complex |
| Rehashing | Apply an alternative hash function upon collision | Common in theoretical designs | Higher computational and implementation overhead |

Java's `HashMap` primarily uses chaining. Starting in JDK 8, when the length of a linked list reaches a threshold and the array capacity is sufficiently large, the chain is converted into a Red-Black tree to reduce lookup overhead under severe collisions.

The advantage of chaining is intuitive implementation and straightforward deletion. Each bucket in the array holds more than just a single element; it anchors a linked list, and colliding elements are appended to this chain. Queries first locate the bucket via hashing and then traverse the chain or tree to match the key.

Open addressing, on the other hand, avoids external linked lists entirely—all elements reside directly within the array. Upon collision, it searches for the next available slot according to a specific probing sequence, such as linear probing, quadratic probing, or double hashing. Its benefit is superior cache locality, but deleting elements, controlling the load factor, and mitigating clustering become substantially more complex.

## Load Factor and Resizing

The load factor indicates how full the hash table is allowed to get before its capacity is automatically increased:

```text
Load Factor = Number of Elements / Array Capacity
```

The default load factor for `HashMap` is `0.75`. When the number of elements exceeds `capacity * loadFactor`, resizing is triggered, typically doubling the capacity.

Resizing incurs a rehash overhead. In an interview, you can articulate it this way: a single insertion into a hash table is `O(1)` on average, though the specific insertion that triggers resizing incurs element migration costs; amortized across many insertions, the time complexity remains `O(1)`.

The load factor should not be evaluated purely on "space utilization." A higher load factor means a fuller array and better memory efficiency, but the probability of collisions climbs; a lower load factor produces fewer collisions, but wastes more bucket space. The value `0.75` is an empirical trade-off chosen by Java's `HashMap` to balance time efficiency and memory consumption.

## Why Is a Hash Table O(1) on Average?

The `O(1)` time complexity of a hash table refers to the average or expected case, not an absolute guarantee across all adversarial inputs.

When the hash function distributes keys uniformly and the load factor is properly maintained, elements remain sparsely scattered, and the number of items per bucket is very small. Consequently, the primary query costs consist of computing the hash value, locating the array index, and performing a negligible number of comparisons within the bucket—operations that execute in constant time.

However, if a large volume of keys maps to the same bucket, performance degrades. Under chaining, an overly long list brings query time close to `O(n)`. In JDK 8 and later, `HashMap` mitigates severe collisions by treeifying qualifying chains, bounding bucket query time to `O(log n)`. Nevertheless, this does not mean hash tables are entirely immune to collision overhead.

## Relationship with Java HashMap

Common interview follow-up questions regarding `HashMap`:

- Why is the initial capacity recommended to be a power of 2?
- Why is the default load factor set to `0.75`?
- Why did JDK 8 introduce Red-Black trees?
- Why is `HashMap` not thread-safe?
- What are the differences between `HashMap` and `ConcurrentHashMap`?

While these questions extend beyond pure theoretical data structures, their foundations remain anchored in hash table mechanics: arrays provide indexing, chains or Red-Black trees resolve collisions, and resizing maintains acceptable load factors.

## Common Algorithm Problem Templates

Two Sum:

```java
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int need = target - nums[i];
        if (map.containsKey(need)) {
            return new int[] {map.get(need), i};
        }
        map.put(nums[i], i);
    }
    return new int[] {-1, -1};
}
```

This code snippet exemplifies the most common application of a hash table: trading space for time to reduce an `O(n)` search down to `O(1)` on average.

## In-Depth Problem Walkthrough: Subarray Sum Equals K

[560. Subarray Sum Equals K](https://leetcode.cn/problems/subarray-sum-equals-k/) is an ideal problem for understanding the "Prefix Sum + Hash Table" technique. The problem requires counting the total number of continuous subarrays whose sum equals `k`.

Brute-forcing all left and right endpoints yields an `O(n^2)` time complexity. Looking at it from another angle: suppose the current prefix sum is `sum`, and we want to find a prior prefix sum `prev` such that:

```text
sum - prev = k
```

This rearranges to `prev = sum - k`. Therefore, if we record the occurrence count of each prefix sum in a hash table as we traverse the array, we can instantly determine how many valid subarrays end at the current index with a sum equal to `k`.

```java
int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    count.put(0, 1);

    int sum = 0;
    int ans = 0;
    for (int num : nums) {
        sum += num;
        ans += count.getOrDefault(sum - k, 0);
        count.put(sum, count.getOrDefault(sum, 0) + 1);
    }
    return ans;
}
```

The initialization `count.put(0, 1)` is crucial: it signifies that an empty prefix has appeared once. This ensures that when the sum from the beginning of the array up to the current element equals `k` exactly, it is properly counted.

Another critical pitfall is "check first, insert later." If you add the current `sum` to the hash table before querying `sum - k`, an issue arises when `k = 0`: the current prefix sum might match against itself, producing an inflated result.

For instance, consider `nums = [1]` and `k = 0`. With the correct "check first, insert later" order, no non-empty subarray summing to 0 is found; if you instead insert the prefix sum `1` first and then check `sum - k = 1`, the prefix sum incorrectly pairs with itself, falsely adding 1 to the count.

## Java HashMap Interview Follow-up Questions

Simply knowing abstract concepts is insufficient; Java backend interviews routinely delve into `HashMap` specifics. Prepare along these lines:

| Follow-up Question | Key Answer Points |
| ------------------ | ----------------- |
| Why is capacity typically a power of 2? | Facilitates fast indexing via `hash & (length - 1)` and simplifies element migration during resizing |
| Why is the default load factor `0.75`? | Strikes a balance between space utilization and collision probability; lower values waste memory, higher values increase collisions |
| Why did JDK 8 introduce Red-Black trees? | Under extreme collision scenarios, linked lists degrade to linear searches; treeification bounds the search cost from list length down to logarithmic time |
| Why is `HashMap` not thread-safe? | Concurrent modifications can corrupt internal structural invariants, and read/write operations lack visibility and mutual exclusion guarantees |
| What should you watch out for with custom keys? | `equals()` and `hashCode()` must remain consistent, and fields used in hash calculation must not be modified after insertion |

In an interview, you do not need to recite every line of source code verbatim, but you must clearly articulate the central design narrative: array indexing, collision handling, resizing migration, and worst-case collision optimization together determine `HashMap`'s operational performance.

## Common Pitfalls

- Average `O(1)` performance does not mean `O(1)` under every conceivable scenario.
- When using custom objects as keys, both `equals()` and `hashCode()` must be properly overridden.
- Mutable objects are unsuitable as hash table keys if their hash-relevant state changes.
- For frequency counting over very small, fixed character sets, array indexing is more efficient than `HashMap`.
- While hash tables dramatically accelerate lookups, they introduce non-trivial memory overhead.

## High-Frequency Self-Assessment Questions

- Why is hash table lookup `O(1)` on average? Under what conditions does it degrade?
- What are the differences between chaining and open addressing?
- Why does `HashMap` need to resize? How should the cost of resizing be understood?
- Why must `equals()` and `hashCode()` be overridden together when using custom objects as keys?
- Why must you "check first, insert later" when combining prefix sums with a hash table?

## Recommended Practice Problems

- [1. Two Sum](https://leetcode.cn/problems/two-sum/)
- [242. Valid Anagram](https://leetcode.cn/problems/valid-anagram/)
- [49. Group Anagrams](https://leetcode.cn/problems/group-anagrams/)
- [560. Subarray Sum Equals K](https://leetcode.cn/problems/subarray-sum-equals-k/)
- [146. LRU Cache](https://leetcode.cn/problems/lru-cache/)

## References

- [Algorithms, 4th Edition: Hash Tables](https://algs4.cs.princeton.edu/34hash/)
- [Java SE 21 API: HashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
- [OpenJDK: HashMap Source Code](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java)
- [Java SE 21 API: Object#hashCode](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#hashCode%28%29)
