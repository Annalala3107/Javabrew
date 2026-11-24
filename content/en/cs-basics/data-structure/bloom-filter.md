---
title: "Comprehensive Guide to Bloom Filter (Principles, Implementation, and Application Scenarios)"
description: An in-depth analysis of Bloom Filter principles and false positive characteristics, combined with hash functions and bit array implementation, suitable for massive data deduplication and cache penetration prevention.
category: Computer Science Fundamentals
tag:
  - Data Structures
head:
  - - meta
    - name: keywords
      content: Bloom Filter,False Positive Rate,Hash Function,Bit Array,Deduplication,Cache Penetration
lang: en
sourceRef: zh-ref/cs-basics/data-structure/bloom-filter.md
---

# Bloom Filter

Even if you haven't used a Bloom Filter before, you have likely heard of it.

A Bloom Filter is primarily designed to solve membership testing (existence queries) over massive datasets. It is exceptionally well-suited for scenarios where you need to determine whether a certain piece of data exists among billions of records while tolerating a minor error margin (such as cache penetration protection and massive data deduplication).

Table of Contents:

1. What is a Bloom Filter?
2. Working principles of a Bloom Filter.
3. Common application scenarios for a Bloom Filter.
4. Manually implementing a Bloom Filter in Java.
5. Using Google's open-source Guava Bloom Filter.
6. Bloom Filters in Redis.

## What is a Bloom Filter?

First, we need to understand the concept of a Bloom Filter.

A Bloom Filter (BF) was proposed by Burton Howard Bloom in 1970. We can think of it as a data structure consisting of two parts: a binary vector (or bit array) and a series of random mapping functions (hash functions). Compared to data structures we commonly use like List, Map, or Set, it consumes significantly less memory and operates with higher efficiency. However, its disadvantage is that its returned results are probabilistic rather than 100% accurate. Theoretically, the more elements added to the set, the higher the probability of false positives. Furthermore, elements stored in a Bloom Filter cannot be easily deleted.

A Bloom Filter uses a relatively large bit array to represent data. Each element in the array takes up only 1 bit, and each element can only be 0 or 1 (representing false or true). This is the core reason why a Bloom Filter saves so much memory. By this calculation, allocating a bit array for 1,000,000 elements requires only 1,000,000 Bits / 8 = 125,000 Bytes = 125,000 / 1024 KB ≈ 122 KB of memory space.

![Bit array structure used by Bloom Filter](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/bloom-filter-bit-table-b8f56b57.png)

Summary: **A man named Bloom proposed a data structure used to test whether an element is a member of a large set. This data structure is highly efficient and performant, but has a non-zero false positive rate and makes deletions difficult. Furthermore, theoretically, the more elements added to the set, the greater the likelihood of false positives.**

## Working Principles of a Bloom Filter

**When an element is added to a Bloom Filter, the following operations occur:**

1. The element value is hashed using the hash functions in the Bloom Filter to obtain hash values (as many hash values as there are hash functions).
2. Based on the calculated hash values, the corresponding indices in the bit array are set to 1.

**When we need to check whether an element exists in a Bloom Filter, the following operations occur:**

1. The same hash calculations are performed on the given element.
2. The bits corresponding to these hash values are inspected: if any bit is not 1, the element definitely has NOT been inserted; if all bits are 1, it only indicates that the element MIGHT have been inserted, and a false positive may still have occurred.

A simplified schematic of a Bloom Filter is shown below:

![Simple schematic diagram of Bloom Filter](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/bloom-filter-simple-schematic-diagram-ecf8f3d1.png)

As shown in the diagram, when a string is added to the Bloom Filter, multiple hash functions generate different hash values from this string, and the corresponding bit positions in the bit array are set to 1 (all positions are initialized to 0). When querying the same string later, all corresponding positions will be 1, so the Bloom Filter returns "might exist"; whether it truly exists must still be confirmed against business data.

If you need to determine whether a string is in the Bloom Filter, simply compute the same hashes again. If any corresponding position is 0, the element was definitely never inserted. If all corresponding positions are 1, the element might have been inserted, or it could be a false positive caused collectively by other elements.

**Different strings may hash to the same bit positions. In this case, we can appropriately increase the bit array size or adjust our hash functions.**

In summary, we can conclude: **When a Bloom Filter says an element exists, there is a small probability of a false positive. When a Bloom Filter says an element does not exist, that element definitely does not exist.**

## Application Scenarios for Bloom Filters

1. Determining whether given data exists: for example, checking if a number exists in a massive dataset containing hundreds of millions of numbers; preventing cache penetration (checking whether requested data is valid to avoid bypassing the cache directly to query the database); spam email filtering (checking if an email address is in a spam blacklist); blacklist functionality (checking if an IP address or phone number is on a blacklist), etc.
2. Deduplication: for example, deduplicating visited URLs when crawling a website; deduplicating massive user IDs or order numbers.

Deduplication scenarios also rely on testing the existence of given data, which is why Bloom Filters primarily address membership testing in massive datasets.

## Coding Practice

### Manually Implementing a Bloom Filter in Java

We have already explained the principles of a Bloom Filter above. Once you understand the principles, you can implement one by hand.

If you want to implement one manually, you need:

1. A bit array of appropriate size to hold data.
2. Several different hash functions.
3. An implementation of an `add` method to insert elements into the bit array (Bloom Filter).
4. An implementation of a `contains` method to check if a given element exists in the bit array (Bloom Filter).

Below is a clean implementation (adapted and improved from existing open-source code, applicable to all object types):

```java
import java.util.BitSet;

public class MyBloomFilter {

    /**
     * Size of the bit array
     */
    private static final int DEFAULT_SIZE = 2 << 24;
    /**
     * Used to create 6 different hash functions
     */
    private static final int[] SEEDS = new int[]{3, 13, 46, 71, 91, 134};

    /**
     * Bit array. Elements in the array can only be 0 or 1
     */
    private BitSet bits = new BitSet(DEFAULT_SIZE);

    /**
     * Array storing classes that contain hash functions
     */
    private SimpleHash[] func = new SimpleHash[SEEDS.length];

    /**
     * Initialize an array containing hash function classes, each with a different hash function
     */
    public MyBloomFilter() {
        // Initialize multiple different Hash functions
        for (int i = 0; i < SEEDS.length; i++) {
            func[i] = new SimpleHash(DEFAULT_SIZE, SEEDS[i]);
        }
    }

    /**
     * Add an element to the bit array
     */
    public void add(Object value) {
        for (SimpleHash f : func) {
            bits.set(f.hash(value), true);
        }
    }

    /**
     * Check if the specified element exists in the bit array
     */
    public boolean contains(Object value) {
        boolean ret = true;
        for (SimpleHash f : func) {
            ret = bits.get(f.hash(value));
            if(!ret)
              return ret;
        }
        return ret;
    }

    /**
     * Static inner class used for hash operations
     */
    public static class SimpleHash {

        private int cap;
        private int seed;

        public SimpleHash(int cap, int seed) {
            this.cap = cap;
            this.seed = seed;
        }

        /**
         * Calculate hash value
         */
        public int hash(Object value) {
            int h;
            return (value == null) ? 0 : Math.abs((cap - 1) & seed * ((h = value.hashCode()) ^ (h >>> 16)));
        }

    }
}
```

Testing:

```java
String value1 = "https://javaguide.cn/";
String value2 = "https://github.com/Snailclimb";
MyBloomFilter filter = new MyBloomFilter();
System.out.println(filter.contains(value1));
System.out.println(filter.contains(value2));
filter.add(value1);
filter.add(value2);
System.out.println(filter.contains(value1));
System.out.println(filter.contains(value2));
```

Output:

```plain
false
false
true
true
```

Testing:

```java
Integer value1 = 13423;
Integer value2 = 22131;
MyBloomFilter filter = new MyBloomFilter();
System.out.println(filter.contains(value1));
System.out.println(filter.contains(value2));
filter.add(value1);
filter.add(value2);
System.out.println(filter.contains(value1));
System.out.println(filter.contains(value2));
```

Output:

```java
false
false
true
true
```

### Using Google's Open-Source Guava Bloom Filter

The primary purpose of writing your own implementation is to deeply understand how a Bloom Filter works. Guava's Bloom Filter implementation is authoritative and production-tested, so in real projects there is no need to write one manually.

First, we need to introduce the Guava dependency into the project. It is recommended to manage the version uniformly via your project's dependency management and select an actively maintained version based on [Guava Releases](https://github.com/google/guava/releases):

```xml
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>${guava.version}</version>
</dependency>
```

Actual usage is as follows:

We create a Bloom Filter with an expected insertion of 1,500 integers and set the target false positive rate to 1% (0.01). The 1,500 here is a capacity estimate, not a hard ceiling that causes immediate failure once reached.

```java
// Create a BloomFilter object
BloomFilter<Integer> filter = BloomFilter.create(
    Funnels.integerFunnel(),
    1500,
    0.01);
// Check if the specified element exists
System.out.println(filter.mightContain(1));
System.out.println(filter.mightContain(2));
// Add elements to the BloomFilter
filter.put(1);
filter.put(2);
System.out.println(filter.mightContain(1));
System.out.println(filter.mightContain(2));
```

In this example, `mightContain()` returning `false` means that the element definitely was NOT inserted; returning `true` only means that it MIGHT have been inserted. The parameter `0.01` means that under the capacity estimate and implementation assumptions, the target false positive probability for querying an uninserted element is approximately 1%. It cannot be interpreted as "there is a 99% probability that it truly exists once it returns true."

**Guava's Bloom Filter is stored in the current JVM process memory. It is simple to use and ideal for single-process architectures or scenarios where cross-node sharing is not required. If multiple nodes must share the same filter state, centralized solutions like RedisBloom should be considered.**

## Bloom Filters in Redis

### Introduction

RedisBloom provides probabilistic data structures such as Bloom Filters and Cuckoo Filters. Starting from Redis 8, these capabilities are included directly in Redis Open Source, eliminating the need to install the legacy third-party `rebloom` image. For specific command syntax and client support, refer to the [Redis Bloom Filter Official Documentation](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/).

### Installation via Docker

You can spin up Redis 8 using Docker to experiment with it. For production projects, it is recommended to pin a verified specific version rather than relying on the `latest` tag:

```bash
docker run -d --name redis -p 6379:6379 redis:8
docker exec -it redis redis-cli
```

For production installation and version selection, please refer to the [Redis Open Source Installation Documentation](https://redis.io/docs/latest/operate/oss_and_stack/).

### Overview of Common Commands

> Note: `key`: name of the Bloom Filter; `item`: element to add.

1. `BF.ADD`: Adds an element to the Bloom Filter, creating the filter if it does not yet exist. Format: `BF.ADD {key} {item}`.
2. `BF.MADD`: Adds one or more elements to the Bloom Filter, creating the filter if it does not yet exist. This command operates similarly to `BF.ADD`, except that it accepts multiple inputs and returns multiple values. Format: `BF.MADD {key} {item} [item ...]`.
3. `BF.EXISTS`: Determines whether an element exists in the Bloom Filter. Format: `BF.EXISTS {key} {item}`.
4. `BF.MEXISTS`: Determines whether one or more elements exist in the Bloom Filter. Format: `BF.MEXISTS {key} {item} [item ...]`.

Additionally, the `BF.RESERVE` command deserves a dedicated introduction:

The format of this command is as follows:

`BF.RESERVE {key} {error_rate} {capacity} [EXPANSION expansion]`.

Here is a brief description of each parameter:

1. `key`: Name of the Bloom Filter.
2. `error_rate`: Desired false positive probability. This value must be between 0 and 1. For example, for an expected error rate of 0.1% (1 in 1000), `error_rate` should be set to 0.001. The closer this number is to zero, the larger the memory consumption per item and the higher the CPU usage per operation.
3. `capacity`: Expected number of items to be inserted. For scalable filters, once this capacity is exceeded, sub-filters will be created, requiring queries to inspect more sub-filters; if `NONSCALING` is specified to create a fixed-capacity filter, continuing to insert items will cause the actual false positive rate to exceed the configured value.

Optional parameter:

- `expansion`: If a new sub-filter is created, its size will be the size of the current filter multiplied by `expansion`. The default expansion factor is 2, meaning each subsequent sub-filter will be twice the size of the previous one.

### Practical Usage

```shell
127.0.0.1:6379> BF.ADD myFilter java
(integer) 1
127.0.0.1:6379> BF.ADD myFilter javaguide
(integer) 1
127.0.0.1:6379> BF.EXISTS myFilter java
(integer) 1
127.0.0.1:6379> BF.EXISTS myFilter javaguide
(integer) 1
127.0.0.1:6379> BF.EXISTS myFilter github
(integer) 0
```

## Interview Review Highlights

The 4 most common interview questions about Bloom Filters are: why is it fast, why does it save space, why can it produce false positives, and why is deletion difficult?

| Question | Key Answer Points |
| --- | --- |
| Why does it save space? | Uses a bit array and multiple hash functions to represent sets without storing original elements. |
| Why can it produce false positives? | Multiple elements may set the same batch of bits to 1, causing queries to mistakenly conclude an element is present. |
| Can it produce false negatives? | A standard Bloom Filter will never judge an already inserted element as non-existent (zero false negatives). |
| Why is deletion difficult? | A single bit may be shared by multiple elements; clearing it to 0 would affect other elements. |

Typical engineering scenarios:

- Cache penetration: First use a Bloom Filter to determine whether a key might exist; if it does not exist, do not query the database.
- Large-scale deduplication: Such as URL deduplication, blacklist filtering, and already-read item filtering in recommendation systems.
- Distributed scenarios: Standalone Guava is simple, but cross-node sharing typically favors RedisBloom.

When answering, proactively mention its limitation: Bloom Filters are suitable for scenarios that "tolerate a small rate of false positives, but cannot tolerate false negatives." If the business demands 100% accurate existence verification, you cannot rely solely on a Bloom Filter.

## Common Follow-up Questions

- What is the relationship between the false positive rate, bit array size, and the number of hash functions?
- Can elements in a Bloom Filter be deleted?
- What are cache penetration, cache breakdown, and cache avalanche respectively?
- How do you choose between Guava Bloom Filter and RedisBloom?
- What happens if the estimated capacity is wrong?
