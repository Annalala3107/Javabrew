---
title: Detailed Guide to Redis's 5 Basic Data Types
description: Detailed explanation of the usage and application scenarios of Redis's five basic data types—String, List, Set, Hash, and Zset—with an in-depth analysis of underlying data structure implementations such as SDS, SkipList, and ZipList.
category: Databases
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis Data Types,String,List,Set,Hash,Zset,SDS,SkipList,ZipList,Redis Commands
lang: en
sourceRef: zh-ref/database/redis/redis-data-structures-01.md
---

Redis has 5 basic data types: String, List, Set, Hash, and Zset (Sorted Set).

These 5 data types are directly exposed to users as the forms in which data is stored, while their underlying implementations mainly rely on these 8 data structures: Simple Dynamic String (SDS), LinkedList (doubly linked list), Dict (hash table / dictionary), SkipList, Intset (integer set), ZipList, and QuickList.

The mapping between the 5 basic Redis data types and their underlying data structure implementations is shown in the table below:

| String | List                         | Hash          | Set          | Zset              |
| :----- | :--------------------------- | :------------ | :----------- | :---------------- |
| SDS    | LinkedList/ZipList/QuickList | Dict, ZipList | Dict, Intset | ZipList, SkipList |

Before Redis 3.2, the underlying implementation of List was either LinkedList or ZipList. Starting from Redis 3.2, QuickList—a combination of LinkedList and ZipList—was introduced, and QuickList became the underlying implementation of List. Starting from Redis 7.0, ZipList was replaced by ListPack.

You can find very detailed introductions to Redis data types and structures on the official Redis website:

- [Redis Data Structures](https://redis.com/redis-enterprise/data-structures/)
- [Redis Data types tutorial](https://redis.io/docs/manual/data-types/data-types-tutorial/)

As new versions of Redis are released in the future, new data structures may emerge. By checking the corresponding documentation on the official Redis website, you will always get the most reliable information.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220720181630203-1eca43a6.png)

## String

### Introduction

String is the simplest and most commonly used data type in Redis.

String is a binary-safe data type that can be used to store any kind of data, such as strings, integers, floating-point numbers, images (base64-encoded/decoded image data or image paths), and serialized objects.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719124403897-bb5e9fd5.png)

Although Redis is written in C, it does not use C's native string representation. Instead, it builds its own **Simple Dynamic String** (**SDS**). Compared to native C strings, Redis's SDS can store not only text data but also binary data, and obtaining the string length has a time complexity of O(1) (compared to O(N) for C strings). Furthermore, the Redis SDS API is safe and will not cause buffer overflows.

### Common Commands

| Command                         | Description                                                     |
| ------------------------------- | --------------------------------------------------------------- |
| SET key value                   | Set the value of the specified key                              |
| SETNX key value                 | Set the value of the key only if the key does not already exist |
| GET key                         | Get the value of the specified key                              |
| MSET key1 value1 key2 value2 …… | Set the values of one or more specified keys                    |
| MGET key1 key2 ...              | Get the values of one or more specified keys                    |
| STRLEN key                      | Return the length of the string value stored at key             |
| INCR key                        | Increment the integer value stored at key by one                |
| DECR key                        | Decrement the integer value stored at key by one                |
| EXISTS key                      | Check whether the specified key exists                          |
| DEL key (General)               | Delete the specified key                                        |
| EXPIRE key seconds (General)    | Set an expiration time on the specified key                     |

For more Redis String commands and detailed usage guides, please refer to the official Redis documentation: <https://redis.io/commands/?group=string>.

**Basic operations**:

```bash
> SET key value
OK
> GET key
"value"
> EXISTS key
(integer) 1
> STRLEN key
(integer) 5
> DEL key
(integer) 1
> GET key
(nil)
```

**Batch operations**:

```bash
> MSET key1 value1 key2 value2
OK
> MGET key1 key2 # Batch get values corresponding to multiple keys
1) "value1"
2) "value2"
```

**Counter (usable when the string content is an integer):**

```bash
> SET number 1
OK
> INCR number # Increment the numeric value stored at key by 1
(integer) 2
> GET number
"2"
> DECR number # Decrement the numeric value stored at key by 1
(integer) 1
> GET number
"1"
```

**Setting expiration time (never expires by default)**:

```bash
> EXPIRE key 60
(integer) 1
> SETEX key 60 value # Set the value and set an expiration time
OK
> TTL key
(integer) 56
```

### Application Scenarios

**Scenarios requiring storage of regular data**

- Examples: Caching Sessions, Tokens, image URLs, and serialized objects (saves more memory compared to Hash storage).
- Related commands: `SET`, `GET`.

**Scenarios requiring counting**

- Examples: User request count per unit time (can be used for simple rate limiting), page views per unit time.
- Related commands: `SET`, `GET`, `INCR`, `DECR`.

**Distributed lock**

Using the `SETNX key value` command, you can implement the simplest distributed lock (it has some flaws and is generally not recommended to implement a distributed lock this way).

## List

### Introduction

List in Redis is actually an implementation of the linked list data structure. I have covered the linked list data structure in detail in the article [Linear Data Structures: Arrays, Linked Lists, Stacks, and Queues](https://javaguide.cn/cs-basics/data-structure/linear-data-structure.html), so I won't repeat it here.

Many high-level programming languages have built-in linked list implementations, such as `LinkedList` in Java. However, C does not have a built-in linked list, so Redis implemented its own linked list data structure. Redis's List is implemented as a **doubly linked list**, which supports reverse lookup and traversal, making operations more convenient, though it incurs some extra memory overhead.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719124413287-d935c3fc.png)

### Common Commands

| Command                     | Description                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| RPUSH key value1 value2 ... | Append one or more elements to the tail (right) of a list        |
| LPUSH key value1 value2 ... | Prepend one or more elements to the head (left) of a list        |
| LSET key index value        | Set the value of an element in a list at the specified index     |
| LPOP key                    | Remove and return the first (leftmost) element of a list         |
| RPOP key                    | Remove and return the last (rightmost) element of a list         |
| LLEN key                    | Get the number of elements in a list                             |
| LRANGE key start end        | Get the elements in a list between indices `start` and `end`     |

For more Redis List commands and detailed usage guides, please refer to the official Redis documentation: <https://redis.io/commands/?group=list>.

**Implementing a queue with `RPUSH/LPOP` or `LPUSH/RPOP`**:

```bash
> RPUSH myList value1
(integer) 1
> RPUSH myList value2 value3
(integer) 3
> LPOP myList
"value1"
> LRANGE myList 0 1
1) "value2"
2) "value3"
> LRANGE myList 0 -1
1) "value2"
2) "value3"
```

**Implementing a stack with `RPUSH/RPOP` or `LPUSH/LPOP`**:

```bash
> RPUSH myList2 value1 value2 value3
(integer) 3
> RPOP myList2 # Pop the rightmost element of the list
"value3"
```

I drew a diagram specifically to help everyone understand the `RPUSH`, `LPOP`, `LPUSH`, and `RPOP` commands:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-list-a1006c6c.png)

**Viewing list elements within a specific index range with `LRANGE`**:

```bash
> RPUSH myList value1 value2 value3
(integer) 3
> LRANGE myList 0 1
1) "value1"
2) "value2"
> LRANGE myList 0 -1
1) "value1"
2) "value2"
3) "value3"
```

With the `LRANGE` command, you can implement paginated queries based on List with very high performance!

**Checking list length with `LLEN`**:

```bash
> LLEN myList
(integer) 3
```

### Application Scenarios

**Information feed display**

- Examples: Latest articles, latest updates.
- Related commands: `LPUSH`, `LRANGE`.

**Message queue**

`List` can be used as a message queue, but its functionality is overly simple and has many flaws, so it is not recommended.

Relatively speaking, the `Stream` data structure introduced in Redis 5.0 is more suitable for building a message queue, though its features are still quite rudimentary. Compared with professional message queues, it still has many shortcomings—for instance, issues like message loss and message backlog are difficult to solve cleanly.

## Hash

### Introduction

A Hash in Redis is a mapping table of String-type field-value pairs, making it particularly suitable for storing objects. In subsequent operations, you can directly modify the values of specific fields in the object.

Hash is similar to `HashMap` prior to JDK 1.8, and its internal implementation is also quite similar (array + linked list). However, Redis's Hash introduces additional optimizations.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719124421703-50a6fb86.png)

### Common Commands

| Command                                   | Description                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| HSET key field value                      | Set the value of a specified field in the specified hash table            |
| HSETNX key field value                    | Set the value of a field only if the field does not already exist         |
| HMSET key field1 value1 field2 value2 ... | Simultaneously set one or more field-value pairs into the specified hash  |
| HGET key field                            | Get the value of a specified field in the specified hash table            |
| HMGET key field1 field2 ...               | Get the values of one or more specified fields in the specified hash      |
| HGETALL key                               | Get all field-value pairs in the specified hash table                     |
| HEXISTS key field                         | Check whether a specified field exists in the specified hash table        |
| HDEL key field1 field2 ...                | Delete one or more hash table fields                                      |
| HLEN key                                  | Get the number of fields in the specified hash table                      |
| HINCRBY key field increment               | Perform an arithmetic operation on a specified field (positive to add, negative to subtract) |

For more Redis Hash commands and detailed usage guides, please refer to the official Redis documentation: <https://redis.io/commands/?group=hash>.

**Simulating object data storage**:

```bash
> HMSET userInfoKey name "guide" description "dev" age 24
OK
> HEXISTS userInfoKey name # Check if the specified field exists in the value corresponding to the key
(integer) 1
> HGET userInfoKey name # Get the value of a specified field stored in the hash table
"guide"
> HGET userInfoKey age
"24"
> HGETALL userInfoKey # Get all fields and values in the hash table for the specified key
1) "name"
2) "guide"
3) "description"
4) "dev"
5) "age"
6) "24"
> HSET userInfoKey name "GuideGeGe"
> HGET userInfoKey name
"GuideGeGe"
> HINCRBY userInfoKey age 2
(integer) 26
```

### Application Scenarios

**Object data storage scenarios**

- Examples: User info, product info, article info, shopping cart info.
- Related commands: `HSET` (set a single field's value), `HMSET` (set multiple fields' values), `HGET` (get a single field's value), `HMGET` (get multiple fields' values).

## Set

### Introduction

The Set type in Redis is an unordered collection whose elements have no specific order and are all unique—somewhat similar to `HashSet` in Java. When you need to store a list of data without duplicates, Set is a great choice. Moreover, Set provides an important interface for checking whether an element exists within the Set, which List cannot provide.

Based on Set, you can easily perform intersection, union, and difference operations. For example, you can store all accounts a user follows in one set and all their followers in another set. This makes it very convenient to implement features like mutual following, mutual followers, and shared interests—essentially by computing set intersections.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719124430264-b249fe9b.png)

### Common Commands

| Command                               | Description                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| SADD key member1 member2 ...          | Add one or more elements to the specified set                                |
| SMEMBERS key                          | Get all elements in the specified set                                        |
| SCARD key                             | Get the number of elements in the specified set                              |
| SISMEMBER key member                  | Determine whether the specified element is in the specified set              |
| SINTER key1 key2 ...                  | Get the intersection of all given sets                                       |
| SINTERSTORE destination key1 key2 ... | Store the intersection of all given sets into `destination`                  |
| SUNION key1 key2 ...                  | Get the union of all given sets                                              |
| SUNIONSTORE destination key1 key2 ... | Store the union of all given sets into `destination`                         |
| SDIFF key1 key2 ...                   | Get the difference of all given sets                                         |
| SDIFFSTORE destination key1 key2 ...  | Store the difference of all given sets into `destination`                    |
| SPOP key count                        | Randomly remove and return one or more elements from the specified set       |
| SRANDMEMBER key count                 | Randomly get a specified number of elements from the specified set           |

For more Redis Set commands and detailed usage guides, please refer to the official Redis documentation: <https://redis.io/commands/?group=set>.

**Basic operations**:

```bash
> SADD mySet value1 value2
(integer) 2
> SADD mySet value1 # Duplicate elements are not allowed, so adding fails
(integer) 0
> SMEMBERS mySet
1) "value1"
2) "value2"
> SCARD mySet
(integer) 2
> SISMEMBER mySet value1
(integer) 1
> SADD mySet2 value2 value3
(integer) 2
```

- `mySet`: `value1`, `value2`.
- `mySet2`: `value2`, `value3`.

**Intersection**:

```bash
> SINTERSTORE mySet3 mySet mySet2
(integer) 1
> SMEMBERS mySet3
1) "value2"
```

**Union**:

```bash
> SUNION mySet mySet2
1) "value3"
2) "value2"
3) "value1"
```

**Difference**:

```bash
> SDIFF mySet mySet2 # The difference is the set of all elements belonging to mySet but not to A
1) "value1"
```

### Application Scenarios

**Scenarios where stored data must not contain duplicates**

- Examples: Website UV statistics (`HyperLogLog` is more suitable for massive data volumes), article likes, post likes, etc.
- Related commands: `SCARD` (get the number of elements in the set).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719073733851-c2639db3.png)

**Scenarios requiring intersection, union, and difference across multiple data sources**

- Examples: Mutual friends (intersection), mutual followers (intersection), mutual following (intersection), friend recommendations (difference), music recommendations (difference), official account recommendations (difference + intersection), etc.
- Related commands: `SINTER` (intersection), `SINTERSTORE` (intersection), `SUNION` (union), `SUNIONSTORE` (union), `SDIFF` (difference), `SDIFFSTORE` (difference).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719074543513-f08a950a.png)

**Scenarios requiring random retrieval of elements from a data source**

- Examples: Lottery/lucky draw systems, random roll call, etc.
- Related commands: `SPOP` (randomly get and remove elements from the set, suitable when repeat winners are not allowed), `SRANDMEMBER` (randomly get elements from the set, suitable when repeat winners are allowed).

## Sorted Set

### Introduction

Sorted Set is similar to Set, but compared to Set, Sorted Set adds a weight parameter called `score`, enabling elements in the collection to be sorted by `score`, as well as allowing you to retrieve lists of elements by `score` ranges. It is somewhat like a combination of `HashMap` and `TreeSet` in Java.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719124437791-c6796849.png)

### Common Commands

| Command                                       | Description                                                                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ZADD key score1 member1 score2 member2 ...    | Add one or more elements to the specified sorted set                                                                          |
| ZCARD KEY                                     | Get the number of elements in the specified sorted set                                                                        |
| ZSCORE key member                             | Get the `score` value of a specified element in the specified sorted set                                                      |
| ZINTERSTORE destination numkeys key1 key2 ... | Store the intersection of all given sorted sets into `destination`, aggregating identical elements' scores with SUM; `numkeys` is the number of sets |
| ZUNIONSTORE destination numkeys key1 key2 ... | Compute union; other parameters are similar to `ZINTERSTORE`                                                                  |
| ZDIFFSTORE destination numkeys key1 key2 ...  | Compute difference; other parameters are similar to `ZINTERSTORE`                                                             |
| ZRANGE key start end                          | Get elements between `start` and `end` in the specified sorted set (score from lowest to highest)                             |
| ZREVRANGE key start end                       | Get elements between `start` and `end` in the specified sorted set (score from highest to lowest)                             |
| ZREVRANK key member                           | Get the rank of a specified element in the specified sorted set (sorted by score from highest to lowest)                      |

For more Redis Sorted Set commands and detailed usage guides, please refer to the official Redis documentation: <https://redis.io/commands/?group=sorted-set>.

**Basic operations**:

```bash
> ZADD myZset 2.0 value1 1.0 value2
(integer) 2
> ZCARD myZset
2
> ZSCORE myZset value1
2.0
> ZRANGE myZset 0 1
1) "value2"
2) "value1"
> ZREVRANGE myZset 0 1
1) "value1"
2) "value2"
> ZADD myZset2 4.0 value2 3.0 value3
(integer) 2

```

- `myZset`: `value1` (2.0), `value2` (1.0).
- `myZset2`: `value2` (4.0), `value3` (3.0).

**Getting the rank of a specified element**:

```bash
> ZREVRANK myZset value1
0
> ZREVRANK myZset value2
1
```

**Intersection**:

```bash
> ZINTERSTORE myZset3 2 myZset myZset2
1
> ZRANGE myZset3 0 1 WITHSCORES
value2
5
```

**Union**:

```bash
> ZUNIONSTORE myZset4 2 myZset myZset2
3
> ZRANGE myZset4 0 2 WITHSCORES
value1
2
value3
3
value2
5
```

**Difference**:

```bash
> ZDIFF 2 myZset myZset2 WITHSCORES
value1
2
```

### Application Scenarios

**Scenarios requiring elements from a data source to be retrieved or sorted according to a specific weight**

- Examples: Various leaderboards such as livestream gifting leaderboards, WeChat Moments step leaderboards, Honor of Kings rank leaderboards, trending topic leaderboards, etc.
- Related commands: `ZRANGE` (sorted ascending), `ZREVRANGE` (sorted descending), `ZREVRANK` (rank of a specified element).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/2021060714195385-ae2278e1.png)

In the "Technical Interview Questions" section of [*Java Interview Guide*](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html), there is an article detailing how to use Sorted Set to design and build a leaderboard.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719071115140-61c4235c.png)

**Scenarios where stored data has priority or importance levels** — such as a priority task queue.

- Examples: Priority task queue.
- Related commands: `ZRANGE` (sorted ascending), `ZREVRANGE` (sorted descending), `ZREVRANK` (rank of a specified element).

## Summary

| Data Type | Description                                                                                                                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| String    | A binary-safe data type that can store any type of data such as strings, integers, floating-point numbers, images (base64-encoded/decoded image data or image paths), and serialized objects.                  |
| List      | Implemented as a doubly linked list in Redis, supporting reverse lookup and traversal for more convenient operations, though it brings some additional memory overhead.                                         |
| Hash      | A mapping table of String-type field-value pairs, particularly suitable for storing objects; during subsequent operations, you can directly modify specific field values in the object.                         |
| Set       | An unordered collection whose elements have no order and are all unique, somewhat similar to `HashSet` in Java.                                                                                                |
| Zset      | Compared to Set, Sorted Set adds a weight parameter `score`, allowing elements in the collection to be sorted by `score` and retrieved by `score` ranges. Somewhat like a combination of Java `HashMap` and `TreeSet`. |

## Further Reading on Data Structures

Redis data types heavily rely on fundamental data structures under the hood. To strengthen your low-level knowledge from an interview perspective, you can read these articles alongside this guide:

- [Detailed Guide to Linear Data Structures](../../cs-basics/data-structure/linear-data-structure.md): Understand the relationship between List, queues, and linked lists.
- [Common Hash Table Interview Questions Summary](../../cs-basics/data-structure/hash-table.md): Understand lookup and collision handling behind structures like Hash and Set.
- [Common Skip List Interview Questions Summary](../../cs-basics/data-structure/skip-list.md): Understand the structural trade-offs behind Sorted Set's range query and ranking capabilities.

## References

- Redis Data Structures: <https://redis.com/redis-enterprise/data-structures/>.
- Redis Commands: <https://redis.io/commands/>.
- Redis Data types tutorial: <https://redis.io/docs/manual/data-types/data-types-tutorial/>.
- Whether to use Hash or String for storing object information in Redis: <https://segmentfault.com/a/1190000040032006>
