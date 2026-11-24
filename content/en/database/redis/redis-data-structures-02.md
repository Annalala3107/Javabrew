---
title: Detailed Guide to Redis's 3 Special Data Types
description: Detailed explanation of the usage and application scenarios of Redis's three special data types—Bitmap, HyperLogLog, and GEO—including implementations for typical business scenarios such as check-in statistics, UV statistics, and nearby users.
category: Databases
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis Special Data Types,Bitmap,HyperLogLog,GEO,Cardinality Statistics,Geospatial,Check-in Statistics,UV Statistics
lang: en
sourceRef: zh-ref/database/redis/redis-data-structures-02.md
---

In addition to the 5 basic data types, Redis also supports 3 special data types: Bitmap, HyperLogLog, and GEO.

## Bitmap

### Introduction

According to the official documentation:

> Bitmaps are not an actual data type, but a set of bit-oriented operations defined on the String type which is treated like a bit vector. Since strings are binary safe blobs and their maximum length is 512 MB, they are suitable to set up to 2^32 different bits.

Bitmap stores consecutive binary digits (0 and 1). Through Bitmap, only a single bit is needed to represent the value or state corresponding to an element, where the key corresponds to the element itself. As we know, 8 bits make up 1 byte, so Bitmap itself greatly saves storage space.

You can think of a Bitmap as an array storing binary digits (0 and 1), where the index of each element in the array is called the offset.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220720194154133-ab812d2d.png)

### Common Commands

| Command                               | Description                                                                             |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| SETBIT key offset value               | Set the value at the specified `offset` position                                        |
| GETBIT key offset                     | Get the value at the specified `offset` position                                        |
| BITCOUNT key start end                | Get the count of elements with value `1` between `start` and `end`                      |
| BITOP operation destkey key1 key2 ... | Perform operations on one or more Bitmaps; available operators are AND, OR, XOR, and NOT |

**Demonstration of basic Bitmap operations**:

```bash
# SETBIT returns the previous bit value (0 by default); this will generate 7 bits
> SETBIT mykey 7 1
(integer) 0
> SETBIT mykey 7 0
(integer) 1
> GETBIT mykey 7
(integer) 0
> SETBIT mykey 6 1
(integer) 0
> SETBIT mykey 8 1
(integer) 0
# Count the number of bits set to 1 using bitcount.
> BITCOUNT mykey
(integer) 2
```

### Application Scenarios

**Scenarios that need to store state information (representable with 0/1)**

- Examples: User check-in status, active user status, user behavior statistics (such as whether a user has liked a certain video).
- Related commands: `SETBIT`, `GETBIT`, `BITCOUNT`, `BITOP`.

## HyperLogLog (Cardinality Statistics)

### Introduction

HyperLogLog is a well-known probabilistic cardinality counting algorithm, improved and optimized based on LogLog Counting (LLC). It is not unique to Redis—Redis simply implements this algorithm and provides some out-of-the-box APIs.

The HyperLogLog provided by Redis consumes an extremely small amount of space—needing only 12 KB of space to store close to `2^64` distinct elements. That really is impressive—is this the magic of mathematics! Moreover, Redis optimizes the storage structure of HyperLogLog by adopting two counting modes:

- **Sparse representation (sparse matrix)**: When the count is relatively small, it takes up very little space.
- **Dense representation (dense matrix)**: When the count reaches a certain threshold, it occupies 12 KB of space.

There is a corresponding detailed explanation in the official Redis documentation:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220721091424563-dce29bee.png)

To save memory, probabilistic cardinality counting algorithms do not store the raw metadata directly; instead, they estimate the cardinality value (the number of distinct elements contained in a set) through probabilistic statistical methods. Therefore, the count result of HyperLogLog is not an exact value and has a certain margin of error (the standard error is `0.81%`).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220720194154133-ab812d2d.png)

HyperLogLog is very simple to use, but its underlying principle is quite complex. You can read this article to learn about the principles of HyperLogLog and its implementation in Redis: [Explanation of the HyperLogLog Algorithm Principle and How Redis Applies It](https://juejin.cn/post/6844903785744056333).

Here is another recommended tool that can help you understand how HyperLogLog works: [Sketch of the Day: HyperLogLog — Cornerstone of a Big Data Infrastructure](http://content.research.neustar.biz/blog/hll.html).

In addition to HyperLogLog, Redis also provides other probabilistic data structures; the corresponding official documentation URL is: <https://redis.io/docs/data-types/probabilistic/>.

### Common Commands

There are very few commands related to HyperLogLog; the 3 most commonly used ones are listed below.

| Command                                   | Description                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| PFADD key element1 element2 ...           | Add one or more elements to the HyperLogLog                                                            |
| PFCOUNT key1 key2                         | Get the unique count of one or more HyperLogLogs                                                       |
| PFMERGE destkey sourcekey1 sourcekey2 ... | Merge multiple HyperLogLogs into `destkey`; `destkey` combines the sources to calculate the unique count |

**Demonstration of basic HyperLogLog operations**:

```bash
> PFADD hll foo bar zap
(integer) 1
> PFADD hll zap zap zap
(integer) 0
> PFADD hll foo bar
(integer) 0
> PFCOUNT hll
(integer) 3
> PFADD some-other-hll 1 2 3
(integer) 1
> PFCOUNT hll some-other-hll
(integer) 6
> PFMERGE desthll hll some-other-hll
"OK"
> PFCOUNT desthll
(integer) 6
```

### Application Scenarios

**Massive-scale counting scenarios (millions, tens of millions, or more)**

- Examples: Daily/weekly/monthly visitor IP count statistics on popular websites, UV statistics for popular posts.
- Related commands: `PFADD`, `PFCOUNT`.

## Geospatial

### Introduction

Geospatial index (abbreviated as GEO) is mainly used to store geographic location information and is implemented based on Sorted Set.

With GEO, we can easily calculate the distance between two locations, retrieve elements near a specified location, and more.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220720194359494-aed36ad8.png)

### Common Commands

| Command                                          | Description                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| GEOADD key longitude1 latitude1 member1 ...      | Add longitude and latitude information for one or more elements into GEO                                                 |
| GEOPOS key member1 member2 ...                   | Return the longitude and latitude information of the given elements                                                      |
| GEODIST key member1 member2 M/KM/FT/MI           | Return the distance between two given elements                                                                           |
| GEORADIUS key longitude latitude radius distance | Retrieve other elements within `distance` radius around the specified location; supports ASC, DESC, Count, etc.          |
| GEORADIUSBYMEMBER key member radius distance     | Similar to the `GEORADIUS` command, except the reference center point is an existing element in GEO                      |

**Basic operations**:

```bash
> GEOADD personLocation 116.33 39.89 user1 116.34 39.90 user2 116.35 39.88 user3
3
> GEOPOS personLocation user1
116.3299986720085144
39.89000061669732844
> GEODIST personLocation user1 user2 km
1.4018
```

Checking `personLocation` through a Redis GUI tool confirms that the underlying structure is indeed Sorted Set.

The longitude and latitude data of geographic locations stored in GEO are converted into an integer via the GeoHash algorithm, and this integer is used as the `score` (weight parameter) of the Sorted Set.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220721201545147-31c10f9f.png)

**Retrieving other elements within a specified location range**:

```bash
> GEORADIUS personLocation 116.33 39.87 3 km
user3
user1
> GEORADIUS personLocation 116.33 39.87 2 km
> GEORADIUS personLocation 116.33 39.87 5 km
user3
user1
user2
> GEORADIUSBYMEMBER personLocation user1 5 km
user3
user1
user2
> GEORADIUSBYMEMBER personLocation user1 2 km
user1
user2
```

For an analysis of the underlying principles of the `GEORADIUS` command, you can check out this article from Alibaba: [How Does Redis Actually Implement the "Nearby People" Feature?](https://juejin.cn/post/6844903966061363207).

**Removing elements**:

Since GEO is built on Sorted Set under the hood, you can use Sorted Set-related commands on GEO.

```bash
> ZREM personLocation user1
1
> ZRANGE personLocation 0 -1
user3
user2
> ZSCORE personLocation user2
4069879562983946
```

### Application Scenarios

**Scenarios requiring management and use of geospatial data**

- Examples: Nearby people.
- Related commands: `GEOADD`, `GEORADIUS`, `GEORADIUSBYMEMBER`.

## Summary

| Data Type        | Description                                                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bitmap           | You can think of Bitmap as an array storing binary digits (0 and 1), where the index of each element is called `offset`. With Bitmap, only a single bit is needed to represent an element's value or state, and the key corresponds to the element itself. Since 8 bits make 1 byte, Bitmap itself greatly saves storage space. |
| HyperLogLog      | The HyperLogLog provided by Redis takes up extremely little space, needing only 12 KB to store close to `2^64` distinct elements. However, the count result of HyperLogLog is not exact and has a certain margin of error (standard error is `0.81%`). |
| Geospatial index | Geospatial index (abbreviated as GEO) is mainly used to store geographic location information and is implemented based on Sorted Set.                                                                                                         |

## References

- Redis Data Structures: <https://redis.com/redis-enterprise/data-structures/>.
- *Redis Deep Dive: Core Principles and Application Practice* — Chapter 1.6 "Using Four Ounces to Deflect a Thousand Pounds — HyperLogLog"
- Bloom Filter, Bitmap, HyperLogLog: <https://hogwartsrico.github.io/2020/06/08/BloomFilter-HyperLogLog-BitMap/index.html>
