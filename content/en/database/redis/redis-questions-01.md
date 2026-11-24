---
title: Common Redis Interview Questions Summary (Part 1)
description: "Latest Redis interview questions summary (Part 1): an in-depth explanation of Redis fundamentals, the five common data structures, the single-threaded model principles, persistence mechanisms, memory eviction and expiration policies, and distributed lock and message queue implementations. Ideal for developers preparing for backend interviews!"
category: Databases
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis Interview Questions,Redis Fundamentals,Redis Data Structures,Redis Thread Model,Redis Persistence,Redis Memory Management,Redis Performance Optimization,Redis Distributed Lock,Redis Message Queue,Redis Delayed Queue,Redis Cache Strategy,Redis Single Thread,Redis Multi-Thread,Redis Expiration Policy,Redis Eviction Policy
lang: en
sourceRef: zh-ref/database/redis/redis-questions-01.md
---

## Redis Fundamentals

### What Is Redis?

[Redis](https://redis.io/) (**RE**mote **DI**ctionary **S**erver) is an open-source NoSQL database developed in C (under the BSD license). Unlike traditional databases, Redis stores data in memory (an in-memory database that supports persistence), which makes its read and write speeds extremely fast and leads to its wide adoption in distributed caching. Moreover, Redis stores data as key-value (KV) pairs.

To serve different business scenarios, Redis comes with built-in implementations of multiple data types (such as String, Hash, Sorted Set, Bitmap, HyperLogLog, and GEO). In addition, Redis supports transactions, persistence, Lua scripts, the publish/subscribe (Pub/Sub) model, and multiple out-of-the-box clustering solutions (Redis Sentinel, Redis Cluster).

![Overview of Redis Data Types](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-overview-of-data-types-2023-09-28-6335ecff.jpg)

Redis has no external dependencies. Linux and OS X are the two operating systems on which Redis is most widely developed and tested, and Linux is officially recommended for deploying Redis in production.

For personal learning, you can install Redis locally or try it hands-on via the [online Redis environment](https://try.redis.io/) provided on the official Redis website (a small subset of commands is unavailable there).

![try-redis](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/try.redis.io-34d730cc.png)

A huge number of websites worldwide use Redis. [techstacks.io](https://techstacks.io/) maintains a [list of popular sites using Redis](https://techstacks.io/tech/redis) if you are interested in checking it out.

### ⭐️Why Is Redis So Fast?

Redis incorporates extensive internal performance optimizations; four of the most important are:

1. **Memory-Based Storage (Pure In-Memory Operations)**: This is the primary reason. All Redis data read and write operations occur in memory, where access speeds are on the order of nanoseconds, whereas frequent disk reads and writes in traditional databases operate on the order of milliseconds—a difference of several orders of magnitude.
2. **Efficient I/O Model (I/O Multiplexing & Single-Threaded Event Loop)**: Redis uses a single-threaded event loop combined with I/O multiplexing, enabling a single thread to simultaneously handle I/O events (such as reads and writes) across many network connections. This avoids context switching and lock contention found in multi-threaded models. Even though it is single-threaded, combining the efficiency of in-memory operations with I/O multiplexing allows Redis to handle massive concurrent requests effortlessly (the Redis thread model will be covered in detail later).
3. **Optimized Internal Data Structures**: Redis provides multiple data types (such as String, List, Hash, Set, Sorted Set, etc.), whose internal implementations use highly optimized encodings (such as ziplist, quicklist, skiplist, hashtable, etc.). Redis dynamically selects the most suitable internal encoding based on data size and type to strike the best balance between performance and space efficiency.
4. **Simple and Efficient Communication Protocol (Simple Protocol - RESP)**: Redis uses its own custom-designed RESP (REdis Serialization Protocol). This protocol is straightforward to implement, parses efficiently, and is binary-safe. The serialization/deserialization overhead between client and server is minimal, helping boost overall interaction speed.

> The image below summarizes this very well and is worth sharing—sourced from [Why is Redis so fast?](https://twitter.com/alexxubyte/status/1498703822528544770).

![why-redis-so-fast](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/why-redis-so-fast-c4e8975b.jpg)

Since Redis is so fast, why not just use Redis as the primary database? Mainly because memory is too expensive, and even with the persistence mechanisms Redis provides, there is still a risk of data loss.

### Besides Redis, What Other Distributed Caching Solutions Do You Know?

If an interviewer asks this question, they primarily want to assess:

1. Whether your choice of Redis as a distributed cache was based on thorough research and deliberate evaluation, or simply because Redis happens to be the "trendy" technology right now.
2. Your technical breadth in the distributed caching space.

If you are familiar with other solutions and can explain why Redis was ultimately chosen (even better!), it will significantly boost your interview performance!

Let us briefly discuss common distributed cache technology choices.

For distributed caching, the most established and widely used options are still **Memcached** and **Redis**. However, nowadays almost no projects use **Memcached** for caching anymore—everyone goes straight for **Redis**.

Memcached was commonly used back when distributed caching first emerged. Later, as Redis matured, teams gradually migrated to the much more capable Redis.

Some major tech companies have also open-sourced Redis-like distributed high-performance KV storage databases—for example, [**Tendis**](https://github.com/Tencent/Tendis), open-sourced by Tencent. Tendis uses the well-known open-source project [RocksDB](https://github.com/facebook/rocksdb) as its storage engine and is 100% compatible with the Redis protocol and all Redis 4.0 data models. Regarding the comparison between Redis and Tendis, Tencent officially published an article: [Redis vs. Tendis: Unveiling the Hot-Cold Hybrid Storage Edition Architecture (in Chinese)](https://mp.weixin.qq.com/s/MeYkfOIdnU6LYlsGb24KjQ), which you can refer to briefly.

However, judging from the GitHub commit history of Tendis, the open-source edition of Tendis is barely maintained or updated anymore; combined with its relatively low community attention and limited adoption across companies, it is not recommended to use Tendis for distributed caching.

Currently, the industry-recognized alternatives to Redis are mainly the following two open-source distributed caches (both gained popularity by positioning themselves against Redis):

- [Dragonfly](https://github.com/dragonflydb/dragonfly): An in-memory database built for modern application workloads, fully compatible with Redis and Memcached APIs so migration requires zero code changes, claiming to be the world's fastest in-memory database.
- [KeyDB](https://github.com/Snapchat/KeyDB): A high-performance fork of Redis focused on multi-threading, memory efficiency, and high throughput.

Nevertheless, I still recommend choosing Redis first for distributed caching—after all, it has stood the test of years in production, boasts a superb ecosystem, and has comprehensive documentation!

PS: Due to space constraints, I have not provided an in-depth breakdown and comparison of the distributed caching options mentioned above; feel free to research them further on your own if interested.

### Explain the Similarities and Differences Between Redis and Memcached

Nowadays companies generally use Redis to implement caching, and Redis itself has grown increasingly powerful! Still, understanding the similarities and differences between Redis and Memcached helps us make well-reasoned decisions during technology selection!

**Similarities**:

1. Both are in-memory databases, typically used as caches.
2. Both have expiration policies.
3. Both offer very high performance.

**Differences**:

1. **Data Types**: Redis supports richer data types (supporting more complex application scenarios). Redis not only supports simple key-value data, but also provides storage for data structures such as List, Set, ZSet, and Hash; whereas Memcached only supports the simplest key-value data type.
2. **Data Persistence**: Redis supports data persistence, allowing in-memory data to be saved to disk and reloaded upon restart; whereas Memcached stores all data strictly in memory. In other words, Redis has disaster recovery mechanisms, while Memcached does not.
3. **Cluster Mode Support**: Memcached lacks a native cluster mode and relies on clients to perform sharded writes into a cluster; whereas Redis has natively supported cluster mode since version 3.0.
4. **Thread Model**: Memcached uses a multi-threaded, non-blocking I/O multiplexing network model; whereas Redis uses a single-threaded I/O multiplexing model (Redis 6.0 introduced multi-threading for network data reads and writes).
5. **Feature Support**: Redis supports the Pub/Sub model, Lua scripting, transactions, and more, which Memcached does not. Moreover, Redis supports a wider range of programming languages.
6. **Expired Data Deletion**: Memcached's deletion policy for expired data uses only lazy deletion, whereas Redis uses a combination of lazy deletion and periodic deletion.

After seeing the comparison above, there is really little reason left to choose Memcached as a project's distributed cache.

### ⭐️Why Use Redis?

**1. Faster Access Speed**

Traditional databases store data on disk, whereas Redis is memory-based, and memory access is vastly faster than disk access. By introducing Redis, we can place frequently accessed data in Redis so subsequent requests read directly from memory, boosting speed by dozens or even hundreds of times.

**2. High Concurrency**

Generally, a database like MySQL handles around 4k QPS (on a 4-core, 8 GB machine), whereas using a Redis cache easily reaches 50k+ QPS, or even 100k+ QPS (for a standalone Redis instance—a Redis cluster goes even higher).

> QPS (Queries Per Second): The number of queries a server can execute per second.

Clearly, operating directly on a cache can sustain far more requests than hitting the database directly. Therefore, we can move part of the database data into the cache so a portion of user requests go straight to the cache without touching the database—thereby improving the system's overall concurrency.

**3. Comprehensive Features**

Beyond acting as a cache, Redis can also be used for distributed locks, rate limiting, message queues, delayed queues, and more—its feature set is remarkably powerful!

### ⭐️Why Use Redis Instead of a Local Cache?

| Feature               | Local Cache                                                     | Redis                                                        |
| --------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| Data Consistency      | Data inconsistency issues arise in multi-server deployments     | Data remains consistent                                      |
| Memory Limit          | Limited by the memory of a single server                        | Independently deployed, offering much larger memory capacity |
| Data Loss Risk        | Data is lost if the server crashes                              | Persistent storage supported; data is less likely to be lost |
| Management & Ops      | Decentralized and inconvenient to manage                        | Centrally managed with rich management tools                 |
| Feature Richness      | Limited features; typically only provides basic key-value store | Feature-rich, supporting multiple data structures and capabilities |

For a detailed introduction to local caches, distributed caches, and multi-level caches, see my article: [Common Cache Fundamentals Interview Questions Summary](https://javaguide.cn/database/redis/cache-basics.html).

### What Are the Common Cache Read/Write Strategies?

For a detailed explanation of common cache read/write strategies, see my article: [Detailed Explanation of 3 Commonly Used Cache Read and Write Strategies](https://javaguide.cn/database/redis/3-commonly-used-cache-read-and-write-strategies.html).

### What Is a Redis Module? What Is It Used For?

Starting from version 4.0, Redis supports extending its functionality via Modules to meet specialized requirements. These Modules are loaded into Redis as dynamically linked libraries (`.so` files), which is a very flexible approach to dynamic feature extension worth studying and adopting!

Anyone can build custom Modules on top of Redis—for instance, implementing search engine capabilities, custom distributed locks, and distributed rate limiting.

Currently, the Modules officially recommended by Redis include:

- [RediSearch](https://github.com/RediSearch/RediSearch): A module for implementing search engine functionality.
- [RedisJSON](https://github.com/RedisJSON/RedisJSON): A module for processing JSON data.
- [RedisGraph](https://github.com/RedisGraph/RedisGraph): A module for implementing a graph database.
- [RedisTimeSeries](https://github.com/RedisTimeSeries/RedisTimeSeries): A module for handling time-series data.
- [RedisBloom](https://github.com/RedisBloom/RedisBloom): A module for implementing Bloom filters.
- [RedisAI](https://github.com/RedisAI/RedisAI): A module for executing deep learning / machine learning models and managing their data.
- [RedisCell](https://github.com/brandur/redis-cell): A module for implementing distributed rate limiting.
- ...

For detailed information on Redis Modules, see the official documentation: <https://redis.io/modules>.

## ⭐️Redis Applications

### Besides Caching, What Else Can Redis Do?

- **Distributed Locks**: Implementing distributed locks via Redis is a very common approach. Typically, we implement distributed locks using Redisson. For a detailed explanation of implementing distributed locks with Redis, see my article: [Distributed Locks Explained](https://javaguide.cn/distributed-system/distributed-lock.html).
- **Rate Limiting**: Usually implemented using Redis + Lua scripts. If you prefer not to write Lua scripts yourself, you can directly use `RRateLimiter` in Redisson for distributed rate limiting, whose underlying implementation is based on Lua scripts + the Token Bucket algorithm.
- **Message Queues**: Redis's built-in List data structure can serve as a simple queue. The Stream data structure introduced in Redis 5.0 is even better suited for message queues—it is somewhat similar to Kafka, featuring concepts such as topics and consumer groups, and supporting message persistence as well as ACK mechanisms.
- **Delayed Queues**: Redisson provides a built-in delayed queue (implemented on top of Sorted Set).
- **Distributed Sessions**: Store Session data using String or Hash data types so that all servers can access it.
- **Complex Business Scenarios**: Using the data structures provided by Redis and Redis extensions (such as Redisson), we can easily handle many complex business scenarios—such as counting active users with Bitmap, maintaining leaderboards with Sorted Set, and tracking website UV and PV with HyperLogLog.
- ...

### How to Implement a Distributed Lock Based on Redis?

For a detailed explanation of implementing distributed locks with Redis, see my article: [Distributed Lock Implementations Explained](https://javaguide.cn/distributed-system/distributed-lock-implementations.html).

### Can Redis Be Used as a Message Queue? How?

Let us start with the conclusion:

- **If the business logic is simple, traffic volume is small, and extreme performance is desired**, and you can tolerate an extremely small probability of data loss, using **Redis Stream** is the optimal solution because it eliminates the deployment and maintenance overhead of a dedicated MQ and lets you reuse existing Redis infrastructure (most projects that need an MQ already need Redis anyway).
- **For financial-grade systems, massive data volumes, and strict guarantees against message loss**, you must choose a more mature MQ such as **Kafka or RabbitMQ**.

This question is quite important and also comes up during technology selection. I wrote a dedicated article explaining and analyzing it in detail—if you have time, I recommend reading through it carefully and bookmarking it: [Can Redis Serve as a Message Queue? How to Implement It?](https://javaguide.cn/database/redis/redis-stream-mq.html).

### How to Implement Delayed Tasks Based on Redis?

> Similar questions:
>
> - How do you use Redis to invalidate an unpaid order after 10 minutes?
> - How do you use Redis to automatically refund a red packet if it goes unclaimed for 24 hours?

There are essentially two approaches to implementing delayed tasks with Redis:

1. Listening to Redis expiration events.
2. Redisson's built-in delayed queue.

Listening to Redis expiration events suffers from poor timeliness, message loss, and duplicate message consumption across multiple service instances, so it is not recommended.

Redisson's built-in delayed queue offers the following advantages:

1. **Reduces the possibility of message loss**: Messages in `DelayedQueue` are persisted. Even if Redis goes down, depending on the persistence mechanism, only a tiny number of messages might be lost, with minimal impact. Of course, you can also use database scanning as a compensation mechanism.
2. **No duplicate message consumption**: Every client pulls tasks from the same target queue, so duplicate consumption does not occur.

For a detailed guide on implementing delayed tasks with Redis, see my article: [How to Implement Delayed Tasks Based on Redis?](./redis-delayed-task.md).

## ⭐️Redis Data Types

For detailed introductions to Redis's 5 basic data types and 3 special data types, see the two articles below as well as the [official Redis documentation](https://redis.io/docs/data-types/):

- [Detailed Explanation of the 5 Basic Redis Data Types](https://javaguide.cn/database/redis/redis-data-structures-01.html)
- [Detailed Explanation of the 3 Special Redis Data Types](https://javaguide.cn/database/redis/redis-data-structures-02.html)

### What Are the Commonly Used Data Types in Redis?

The most commonly used data types in Redis include:

- **5 Basic Data Types**: String, List, Set, Hash, Zset (Sorted Set).
- **3 Special Data Types**: HyperLogLog (cardinality estimation), Bitmap, Geospatial.

In addition to those listed above, there are others such as [Bloom Filter](https://javaguide.cn/cs-basics/data-structure/bloom-filter.html) and Bitfield.

### What Are the Use Cases for String?

String is the simplest and most commonly used data type in Redis. It is a binary-safe data type that can store any kind of data, such as strings, integers, floating-point numbers, images (base64-encoded/decoded image data or image paths), and serialized objects.

Common use cases for String include:

- Caching regular data (such as Sessions, Tokens, serialized objects, and image paths);
- Counting, such as user requests per unit of time (useful for simple rate limiting) or page views per unit of time;
- Distributed locks (a rudimentary distributed lock can be implemented using the `SETNX key value` command);
- ...

For a detailed explanation of String, see this article: [Detailed Explanation of the 5 Basic Redis Data Types](https://javaguide.cn/database/redis/redis-data-structures-01.html).

### Is String or Hash Better for Storing Object Data?

Let us briefly compare the two:

- **Object Storage Approach**: String stores serialized object data—storing the entire object as a whole, making operations simple and direct. Hash stores each field of the object separately, allowing you to retrieve partial field information or modify/add individual fields, which saves network bandwidth. If certain fields of an object change frequently or you often need to query specific fields individually, Hash is a great fit.
- **Memory Consumption**: Hash is typically more memory-efficient than String, especially when an object has many fields with short field lengths. Redis optimizes small Hashes (such as storing them using ziplist), further reducing memory usage.
- **Complex Object Storage**: String is more convenient when dealing with deeply nested or complex object structures, because there is no need to manage independent storage and operations for each field.
- **Performance**: String operations typically have O(1) time complexity because it stores the entire object with simple, direct operations, yielding good overall read/write performance. Because Hash handles CRUD operations across multiple fields, it may incur extra performance overhead when there are many fields that change frequently.

Summary:

- In the vast majority of cases, **String** is better suited for storing object data, especially when the object structure is simple and reading/writing the entire object is the primary access pattern.
- If you need to frequently manipulate partial fields of an object or save memory, **Hash** may be the better choice.

### What Is the Underlying Implementation of String?

Redis is written in C, yet the underlying implementation of Redis's String type is not a standard C string (i.e., a character array terminated by a null character `\0`). Instead, Redis implemented its own [SDS](https://github.com/antirez/sds) (Simple Dynamic String) as the underlying implementation.

SDS was originally designed by Redis's author as a C string library for everyday C development; later it was adopted in Redis and heavily modified and refined to suit high-performance operations.

Part of the SDS source code in Redis 7.0 is shown below (<https://github.com/redis/redis/blob/7.0/src/sds.h>):

```c
/* Note: sdshdr5 is never used, we just access the flags byte directly.
 * However is here to document the layout of type 5 SDS strings. */
struct __attribute__ ((__packed__)) sdshdr5 {
    unsigned char flags; /* 3 lsb of type, and 5 msb of string length */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr8 {
    uint8_t len; /* used */
    uint8_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr16 {
    uint16_t len; /* used */
    uint16_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr32 {
    uint32_t len; /* used */
    uint32_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr64 {
    uint64_t len; /* used */
    uint64_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
```

From the source code, SDS has five implementations: `SDS_TYPE_5` (unused), `SDS_TYPE_8`, `SDS_TYPE_16`, `SDS_TYPE_32`, and `SDS_TYPE_64`, of which only the last four are actually used. Redis decides which type to use based on the initialized length, thereby reducing memory usage.

| Type     | Bytes | Bits |
| -------- | ----- | ---- |
| sdshdr5  | < 1   | <8   |
| sdshdr8  | 1     | 8    |
| sdshdr16 | 2     | 16   |
| sdshdr32 | 4     | 32   |
| sdshdr64 | 8     | 64   |

The latter four implementations all contain the following 4 attributes:

- `len`: The length of the string, i.e., the number of bytes currently used.
- `alloc`: The total available character space; `alloc - len` gives the remaining free space in the SDS.
- `buf[]`: The array that actually stores the string.
- `flags`: The lowest three bits store the type flag.

Compared with standard C strings, SDS offers the following improvements:

1. **Prevents buffer overflows**: When a C string is modified (e.g., concatenated), if sufficient memory space has not been allocated beforehand, a buffer overflow occurs. When an SDS is modified, it first checks the `len` attribute to verify whether the available space meets the requirement; if not, it expands the space to the required size before performing the modification.
2. **Lower time complexity for obtaining string length**: Obtaining the length of a C string normally requires traversing and counting characters, with O(n) time complexity. SDS retrieves its length directly by reading the `len` attribute, with O(1) time complexity.
3. **Reduces the number of memory allocations**: To avoid reallocating memory every time a string is modified (grown or shrunk, as happens with C strings), SDS implements two optimization strategies: space pre-allocation and lazy space deallocation. When an SDS needs to grow, Redis allocates memory for the SDS plus extra space according to a specific algorithm, reducing the number of memory reallocations required for consecutive string growth operations. When an SDS shrinks, that freed memory is not reclaimed immediately; instead it is recorded for future reuse (manual release is also supported via dedicated APIs).
4. **Binary safety**: C strings use the null character `\0` to mark the end of a string, which causes problems for binary files (such as images, videos, and audio) that may contain null bytes and thus cannot be stored properly by C strings. SDS uses the `len` attribute to determine where the string ends, eliminating this issue.

🤐 As a side note, in many articles SDS is defined like this:

```c
struct sdshdr {
    unsigned int len;
    unsigned int free;
    char buf[];
};
```

That is not wrong either—it was defined that way prior to Redis 3.2. Later, because that definition had a drawback (`len` and `free` each took 4 bytes, wasting memory), Redis 3.2 and onward redesigned SDS into the 5 types we have today.

### Is String or Hash Better for Storing Shopping Cart Information?

Because items in a shopping cart are modified and updated frequently, Hash is recommended for storing shopping cart information:

- User ID as the key
- Product ID as the field, and product quantity as the value

![Maintaining simple shopping cart information with Hash](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/hash-shopping-cart-ba56bc6c.png)

How are shopping cart operations performed?

- Adding an item to the cart simply adds a new field and value to the Hash;
- Querying cart info iterates through the corresponding Hash;
- Changing item quantity updates the corresponding value directly (either by setting it directly or performing arithmetic operations);
- Removing an item deletes the corresponding field from the Hash;
- Clearing the cart simply deletes the corresponding key.

This example uses a relatively simple cart scenario; in real-world e-commerce systems, storing only a product ID in the field is not sufficient to meet all requirements.

### How to Implement a Leaderboard Using Redis?

Redis provides a data type called `Sorted Set` that is frequently used in all kinds of leaderboard scenarios—such as gift-sending leaderboards in livestreams, WeChat step-count leaderboards in Moments, rank tier leaderboards in Honor of Kings, trending topic leaderboards, and more.

Relevant Redis commands include: `ZRANGE` (sorted in ascending order), `ZREVRANGE` (sorted in descending order), and `ZREVRANK` (rank of a specified element).

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/2021060714195385-ae2278e1.png)

The "Technical Interview Questions" section of [*Java Interview Guidebook*](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html) has an article detailing how to design and build a leaderboard using Sorted Set—check it out if you are interested.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220719071115140-61c4235c.png)

### Why Does Redis's Sorted Set Use a Skip List Under the Hood Instead of a Balanced Tree, Red-Black Tree, or B+ Tree?

Major tech companies love asking this interview question, and it is fairly challenging.

- **Balanced Tree vs. Skip List**: The time complexity of insertion, deletion, and lookup in a balanced tree is **O(log n)**, the same as a skip list. For range queries, a balanced tree can also achieve the same result as a skip list via in-order traversal. However, every insertion or deletion in a balanced tree must guarantee strict balance between the left and right subtrees across the entire tree; whenever an imbalance occurs, rotation operations are needed to restore balance, which is relatively time-consuming. Skip lists were originally invented to overcome some drawbacks of balanced trees. Skip lists use probabilistic balancing rather than strictly enforced balancing, making insertion and deletion algorithms in skip lists much simpler and faster than their balanced tree equivalents.
- **Red-Black Tree vs. Skip List**: Compared with a Red-Black Tree, a skip list is also simpler to implement—it does not require rotations and recoloring (red-black transformations) to maintain black-height balance. Moreover, for range-based lookups, Red-Black Trees are not as efficient as skip lists.
- **B+ Tree vs. Skip List**: B+ Trees are better suited as index structures commonly used in databases and file systems, whose core idea is to locate as many index entries as possible with as few disk I/Os as possible to retrieve query data. For an in-memory database like Redis, this concern does not apply: because Redis is an in-memory database, it does not store massive datasets on disk, so its index does not need to be maintained via a B+ Tree—maintaining it probabilistically at random suffices and saves memory. Furthermore, implementing ZSet with a skip list is simpler than with a B+ Tree: on insertion, you only need to locate the right position in the linked list via the index, insert the node, and randomly maintain an index of a certain height—without needing node splits and merges upon imbalance as B+ Trees do.

Additionally, I wrote a dedicated article covering everything from basic Sorted Set usage to skip list source-code analysis and implementation so you can gain a deeper understanding of the skip list backing Redis Sorted Sets: [Why Does Redis Use Skip Lists to Implement Sorted Sets?](https://javaguide.cn/database/redis/redis-skiplist.html). If you just want a quick walkthrough of skip list fundamentals, complexity, and range queries first, see [Skip List Interview Questions Summary](https://javaguide.cn/cs-basics/data-structure/skip-list.html).

### What Are the Use Cases for Set?

In Redis, `Set` is an unordered collection in which elements have no fixed order and are all unique—somewhat similar to Java's `HashSet`.

Common use cases for `Set` include:

- Scenarios where stored data must not have duplicates: website UV statistics (though `HyperLogLog` is better suited when data volume is huge), article likes, post/status likes, etc.
- Scenarios requiring intersections, unions, and differences across multiple data sources: mutual friends (intersection), mutual followers (intersection), mutual followings (intersection), friend recommendations (difference), music recommendations (difference), official account recommendations (difference + intersection), etc.
- Scenarios requiring random retrieval of elements from a data source: lottery/raffle systems, random roll call, etc.

### How to Implement a Lottery System Using Set?

To implement a simple lottery system using `Set`, you only need the following commands:

- `SADD key member1 member2 ...`: Adds one or more elements to the specified set.
- `SPOP key count`: Randomly removes and returns one or more elements from the specified set—suitable when repeat winners are not allowed.
- `SRANDMEMBER key count`: Randomly retrieves a specified number of elements from the specified set—suitable when repeat winners are allowed.

### How to Count Active Users Using Bitmap?

Bitmap stores contiguous binary digits (0 and 1). Using a Bitmap, only a single bit is needed to represent the value or status of a given element, with the key representing the collection itself. Since 8 bits make up 1 byte, Bitmap inherently saves a huge amount of storage space.

You can think of a Bitmap as an array storing binary digits (0 and 1), where the index of each element in the array is called the `offset`.

![img](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/image-20220720194154133-ab812d2d.png)

To count active users with a Bitmap, you can use the date (to the day) as the key and the user ID as the offset, setting the bit to 1 if the user was active on that day.

Initialize data:

```bash
> SETBIT 20210308 1 1
(integer) 0
> SETBIT 20210308 2 1
(integer) 0
> SETBIT 20210309 1 1
(integer) 0
```

Count users active on both 20210308 and 20210309 (total consecutively active users):

```bash
> BITOP and desk1 20210308 20210309
(integer) 1
> BITCOUNT desk1
(integer) 1
```

Count users active on either 20210308 or 20210309 (online active users):

```bash
> BITOP or desk2 20210308 20210309
(integer) 1
> BITCOUNT desk2
(integer) 2
```

### What Scenarios Is HyperLogLog Suited For?

HyperLogLog (HLL) is a very clever probabilistic data structure specifically designed to solve a tricky big-data problem: estimating the number of unique elements in a set—commonly known as **Cardinality**—across massive datasets using minimal memory.

The core trade-off HLL makes is sacrificing a tiny bit of accuracy in exchange for huge memory savings. It returns not a 100% exact number, but an approximation with a very small standard error (0.81% by default in Redis).

**Based on this core trade-off, HyperLogLog is best suited for scenarios with the following characteristics:**

1. **Massive data volume and memory sensitivity**: This is HLL's primary battlefield. For instance, counting daily unique visitors for an app with hundreds of millions of daily active users. If you used a traditional Set to store user IDs, with each ID occupying dozens of bytes, hundreds of millions of IDs could require several GB or even tens of GB of memory—unacceptable in many scenarios. HLL, by contrast, needs only a fixed 12 KB of memory in Redis to handle astronomical cardinalities, a game-changing advantage.
2. **100% exactness is not required**: This is the prerequisite for using HLL. For example, a product manager wants to know whether a trending post's UV (unique visitors) is roughly 10 million or 10.1 million—this slight difference usually does not affect business decisions. However, if the scenario involves counting the exact number of transactions in a trading system, HLL is completely unsuitable because financial scenarios demand 100% accuracy.

**Therefore, the concrete use cases for HyperLogLog are very clear:**

- **Website/App UV (Unique Visitor) statistics**: For example, counting how many distinct IPs or user IDs visit the homepage each day.
- **Search engine keyword statistics**: Counting how many distinct users search for a given keyword each day.
- **Social network interaction statistics**: For example, counting how many distinct users reposted a Weibo post.

In these scenarios, we care about orders of magnitude and trends rather than single-digit differences.

Finally, Redis's implementation is also very smart: internally, based on the cardinality size, it automatically switches between a **sparse matrix** (which consumes even less space) and a **dense matrix** (fixed at 12 KB), further optimizing memory usage. In short, whenever you need deduplicated counting over massive data and can tolerate a tiny margin of error, HyperLogLog is the ideal choice.

### How to Count Page UV Using HyperLogLog?

Counting page UV with HyperLogLog mainly relies on these two commands:

- `PFADD key element1 element2 ...`: Adds one or more elements to the HyperLogLog.
- `PFCOUNT key1 key2`: Retrieves the unique count of one or more HyperLogLogs.

1. Add each user ID that visits a given page to the `HyperLogLog`:

```bash
PFADD PAGE_1:UV USER1 USER2 ...... USERn
```

2. Count the UV of the given page:

```bash
PFCOUNT PAGE_1:UV
```

### What Data Type Should Be Used to Check Whether an Element Is Absent from a Massive Collection?

This is the classic use case for a Bloom Filter. A Bloom Filter can tell you that an element **definitely does not exist** or **probably exists**; it offers extremely high space efficiency with a certain false positive rate, yet never produces false negatives. In other words, when a Bloom Filter says an element exists, there is a small probability of a false positive; when it says an element does not exist, that element is guaranteed not to exist.

A simple schematic diagram of a Bloom Filter is shown below:

![Simple schematic diagram of a Bloom Filter](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/algorithms/bloom-filter-simple-schematic-diagram-ecf8f3d1.png)

When a string is added to a Bloom Filter, multiple hash functions first generate different hash values for the string, and the corresponding indices in the bit array are set to 1 (all positions in the bit array are initialized to 0). When the same string is stored a second time, because its corresponding positions have already been set to 1, it is easy to tell that the value already exists (making deduplication very convenient).

When we need to check whether a string exists in the Bloom Filter, we simply apply the same hash functions to the given string and inspect whether every corresponding position in the bit array is 1. If all of them are 1, the value may exist in the Bloom Filter; if even one position is not 1, the element is definitely not in the Bloom Filter.

For more on Bloom Filter false positives, deletion difficulties, and using Guava and RedisBloom, continue reading [Bloom Filter Explained](https://javaguide.cn/cs-basics/data-structure/bloom-filter.html).

## ⭐️Redis Persistence Mechanisms (Important)

There are quite a few important questions regarding Redis persistence mechanisms (RDB persistence, AOF persistence, and hybrid RDB+AOF persistence), so I put together a separate article summarizing the concepts and questions around Redis persistence: [Redis Persistence Mechanisms Explained](https://javaguide.cn/database/redis/redis-persistence.html).

## ⭐️Redis Thread Model (Important)

For read and write commands, Redis has always followed a single-threaded model. However, since Redis 4.0, multi-threading was introduced to execute asynchronous deletion of large key-value pairs, and since Redis 6.0, multi-threading was introduced to handle network requests (to improve network I/O read/write performance).

### Do You Understand Redis's Single-Threaded Model?

**Redis designed and developed an efficient event-handling model based on the Reactor pattern** (Netty's thread model is also based on the Reactor pattern—the Reactor pattern truly is the cornerstone of high-performance I/O). This event-handling model corresponds to the **file event handler** in Redis. Because the file event handler runs in a single-threaded manner, we generally say that Redis uses a single-threaded model.

*Redis Design and Implementation* introduces the file event handler in a passage that I think is very well written:

> Redis developed its own network event handler based on the Reactor pattern: this handler is called the file event handler.
>
> - The file event handler uses an I/O multiplexing program to monitor multiple sockets simultaneously and associates different event handlers with sockets according to the tasks those sockets are currently performing.
> - When a monitored socket becomes ready to perform operations such as `accept`, `read`, `write`, or `close`, the corresponding file event is generated, and the file event handler invokes the event handler previously associated with that socket to process the event.
>
> **Although the file event handler runs in a single-threaded manner, by using an I/O multiplexing program to monitor multiple sockets**, it achieves both a high-performance network communication model and seamless integration with other modules inside the Redis server that also run single-threadedly, preserving the simplicity of Redis's single-threaded internal design.

**If it is single-threaded, how does it monitor a large number of client connections?**

Redis uses an **I/O multiplexing program** to monitor a large number of client connections (i.e., monitoring multiple sockets); it registers the events and event types of interest (read, write) with the kernel and listens for whether each event occurs.

The benefit is clear: **Using I/O multiplexing eliminates the need for Redis to create extra threads to monitor massive numbers of client connections, reducing resource consumption** (much like the `Selector` component in Java NIO).

The file event handler consists mainly of 4 components:

- Multiple sockets (client connections)
- I/O multiplexing program (the key to supporting multiple client connections)
- File event dispatcher (associates sockets with their corresponding event handlers)
- Event handlers (connection accept handler, command request handler, command reply handler)

![File event handler](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-event-handler-2997bc21.png)

### Why Didn't Redis Use Multi-Threading Before Redis 6.0?

Although Redis is described as single-threaded, **Redis actually added support for multi-threading starting in versions after 4.0.**

However, the multi-threading introduced in Redis 4.0 mainly targeted commands that delete large key-value pairs—executing those commands delegates the work to threads other than the main thread for "asynchronous processing," reducing impact on the main thread.

To that end, Redis 4.0 introduced several asynchronous commands:

- `UNLINK`: Can be viewed as the asynchronous version of the `DEL` command.
- `FLUSHALL ASYNC`: Clears all keys across all databases, not limited to the currently `SELECT`ed database.
- `FLUSHDB ASYNC`: Clears all keys in the currently `SELECT`ed database.

![redis4.0 more thread](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis4.0-more-thread-0ffdad94.png)

Overall, up until Redis 6.0, Redis's core operations were still processed on a single thread.

**So why didn't Redis use multi-threading before Redis 6.0?** I believe there are 3 main reasons:

- Single-threaded programming is straightforward and much easier to maintain;
- Redis's performance bottleneck is not the CPU, but primarily memory and network;
- Multi-threading introduces problems such as deadlocks and thread context switching, which can even degrade performance.

Further reading: [Why Does Redis Choose a Single-Threaded Model? (in Chinese)](https://draveness.me/whys-the-design-redis-single-thread/).

### Why Did Redis Introduce Multi-Threading Starting in Redis 6.0?

**Redis 6.0 introduced multi-threading mainly to improve network I/O read and write performance**, because network I/O had become a performance bottleneck in Redis (Redis's bottlenecks are mainly memory and network).

Even though Redis 6.0 introduced multi-threading, it is used only for time-consuming network data read/write operations; command execution itself remains single-threaded and sequential. Therefore, you do not need to worry about thread-safety issues.

Multi-threading in Redis 6.0 is disabled by default, using only the main thread. To enable it, you need to set the number of I/O threads > 1 by modifying the Redis configuration file `redis.conf`:

```bash
io-threads 4 # Setting 1 enables only the main thread; the official docs recommend 2 or 3 threads on a 4-core machine, and 6 threads on an 8-core machine
```

Additionally:

- Once the number of `io-threads` is configured, it cannot be changed dynamically via `CONFIG`.
- When SSL is enabled, `io-threads` will not take effect.

Once multi-threading is enabled, by default Redis uses multiple threads only for I/O writes (i.e., sending data back to clients). If you also want to enable multi-threaded I/O reads, you must likewise modify `redis.conf`:

```bash
io-threads-do-reads yes
```

However, the official documentation notes that enabling multi-threaded reads does not bring significant performance gains, so it is generally not recommended.

Further reading:

- [Redis 6.0 New Features — 13 Follow-Up Questions on Multi-Threading! (in Chinese)](https://mp.weixin.qq.com/s/FZu3acwK6zrCBZQ_3HoUgw)
- [A Comprehensive Deep Dive into Redis's Multi-Threaded Network Model (in Chinese)](https://segmentfault.com/a/1190000039223696) (Recommended)

### Do You Know About Redis Background Threads?

Although we often say Redis is single-threaded (meaning the core command logic runs on a single thread), it actually uses several background threads to execute time-consuming operations:

- The `bio_close_file` background thread releases temporary file resources generated during processes like AOF / RDB.
- The `bio_aof_fsync` background thread invokes `fsync` to force data sitting in the OS kernel buffer that has not yet been flushed to disk into the disk (AOF file).
- The `bio_lazy_free` background thread frees memory space occupied by deleted large objects.

These are defined in `bio.h` (Redis 6.0, source URL: <https://github.com/redis/redis/blob/6.0/src/bio.h>):

```java
#ifndef __BIO_H
#define __BIO_H

/* Exported API */
void bioInit(void);
void bioCreateBackgroundJob(int type, void *arg1, void *arg2, void *arg3);
unsigned long long bioPendingJobsOfType(int type);
unsigned long long bioWaitStepOfType(int type);
time_t bioOlderJobOfType(int type);
void bioKillThreads(void);

/* Background job opcodes */
#define BIO_CLOSE_FILE    0 /* Deferred close(2) syscall. */
#define BIO_AOF_FSYNC     1 /* Deferred AOF fsync. */
#define BIO_LAZY_FREE     2 /* Deferred objects freeing. */
#define BIO_NUM_OPS       3

#endif
```

For a detailed introduction to Redis background threads, see [What Background Threads Exist in Redis 6.0? (in Chinese)](https://juejin.cn/post/7102780434739626014).

## ⭐️Redis Memory Management

### Why Set Expiration Times on Cached Data in Redis?

Normally, whenever we store cached data, we set an expiration time on it. Why?

Memory is finite and precious. If cached data is never given an expiration time, memory usage will keep growing indefinitely and eventually lead to an Out of Memory (OOM) failure. By configuring reasonable expiration times, Redis automatically deletes data that is temporarily unneeded, freeing up space for new cache entries.

Redis provides built-in functionality to set expiration times on cached data, for example:

```bash
127.0.0.1:6379> expire key 60 # Data expires after 60s
(integer) 1
127.0.0.1:6379> setex key 60 value # Data expires after 60s (setex:[set] + [ex]pire)
OK
127.0.0.1:6379> ttl key # Check how long until the data expires
(integer) 56
```

Note ⚠️: In Redis, apart from the String type which has its own dedicated command `setex` for setting expiration times, all other types rely on the `expire` command to set expiration times. Additionally, the `persist` command can remove the expiration time from a key.

**Besides helping curb memory consumption, what else are expiration times useful for?**

Very often, our business scenarios require data to exist only for a specific window of time—for example, SMS verification codes may only be valid for 1 minute, and user login Tokens may only be valid for 1 day.

Handling expiration in a traditional database typically means checking expiration manually in application or SQL logic, which is far more cumbersome and performs much worse.

### How Does Redis Determine Whether Data Has Expired?

Redis uses a structure called an expires dictionary (which can be thought of as a hash table) to record data expiration times. Each key in the expires dictionary points to a specific key in the Redis database, and the value in the expires dictionary is a `long long` integer storing the key's expiration timestamp (a UNIX timestamp with millisecond precision).

![Redis expires dictionary](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis-expired-dictionary-28e28389.png)

The expires dictionary is stored inside the `redisDb` struct:

```c
typedef struct redisDb {
    ...

    dict *dict;     // Database keyspace, storing all key-value pairs in the database
    dict *expires   // Expires dictionary, storing the expiration time of keys
    ...
} redisDb;
```

When querying a key, Redis first checks whether the key exists in the expires dictionary (with O(1) time complexity). If it is not present, Redis returns directly; if it is present, Redis checks whether the key has expired, and if expired, deletes the key directly and returns `null`.

### Do You Know Redis's Expired Key Deletion Policies?

Suppose you set a batch of keys to live for only 1 minute—after 1 minute, how does Redis delete those keys?

Common deletion policies for expired data include the following:

1. **Lazy Deletion**: Checks for expiration only when a key is fetched/queried. This approach is friendliest to the CPU, but can leave too many expired keys undeleted in memory.
2. **Periodic Deletion**: Periodically draws a random sample of keys with expiration times set, checks each of them one by one, and deletes any that have expired. Compared with lazy deletion, periodic deletion is friendlier to memory and less friendly to CPU.
3. **Delayed Queue**: Places keys with expiration times into a delayed queue and deletes them once their time is up. This guarantees every expired key can be deleted, but maintaining a delayed queue is too cumbersome and the queue itself consumes resources.
4. **Scheduled Deletion**: Every key with an expiration time is deleted immediately when its expiration time arrives. This ensures no expired keys remain in memory, but puts the heaviest pressure on CPU because a timer must be set for every single key.

**Which deletion policy does Redis adopt?**

Redis adopts a combination of **Periodic Deletion + Lazy Deletion**, which is also the choice of most caching frameworks. Periodic deletion is friendlier to memory, while lazy deletion is friendlier to CPU. Each has its strengths, and combining them balances both CPU friendliness and memory friendliness.

Let us look closely at how periodic deletion works in Redis.

Redis's periodic deletion process is randomized (periodically drawing a random batch of keys that have expiration times), so it does not guarantee that all expired keys are deleted immediately. This explains why some keys remain in memory even after expiring. Furthermore, Redis internally restricts the execution duration and frequency of deletion operations to minimize their impact on CPU time.

Additionally, periodic deletion is governed by execution time and the ratio of expired keys:

- If the execution time exceeds a threshold, the current periodic deletion cycle terminates immediately to avoid consuming too much CPU time.
- If the proportion of expired keys in the sampled batch exceeds a given ratio, the deletion cycle repeats to clean up expired keys more aggressively. Conversely, if the ratio of expired keys falls below that threshold, the periodic deletion cycle stops to avoid doing excessive work for very little memory reclamation.

In Redis 7.2, the execution time threshold is **25ms** and the expired-key ratio threshold is **10%**.

```c
#define ACTIVE_EXPIRE_CYCLE_FAST_DURATION 1000 /* Microseconds. */
#define ACTIVE_EXPIRE_CYCLE_SLOW_TIME_PERC 25 /* Max % of CPU to use. */
#define ACTIVE_EXPIRE_CYCLE_ACCEPTABLE_STALE 10 /* % of stale keys after which
                                                   we do extra efforts. */
```

**How many keys are randomly sampled each time?**

`expire.c` defines the number of keys randomly sampled per cycle; in Redis 7.2 it is 20, meaning each loop randomly selects 20 keys with expiration times to check whether they have expired.

```c
#define ACTIVE_EXPIRE_CYCLE_KEYS_PER_LOOP 20 /* Keys for each DB loop. */
```

**How is the execution frequency of periodic deletion controlled?**

In Redis, the frequency of periodic deletion is controlled by the **`hz`** parameter. `hz` defaults to 10, meaning it runs 10 times per second—making 10 attempts every second to find and delete expired keys.

The valid range for `hz` is 1–500. Increasing `hz` raises the frequency of periodic deletion. If you want expired-key cleanup to run more frequently, you can increase `hz` appropriately, though this increases CPU utilization. According to Redis's official recommendation, `hz` should not exceed 100, and the default value of 10 is sufficient for most users.

Below is the official comment on the `hz` parameter, with key details translated (from Redis 7.2).

![Comments on hz in redis.conf](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/redis.conf-hz-262948fc.png)

There is a related parameter called **`dynamic-hz`**. When enabled, Redis dynamically computes an adjusted value based on `hz`. Redis provides and enables adaptive `hz` by default.

Both parameters live in the Redis configuration file `redis.conf`:

```properties
# Defaults to 10
hz 10
# Enabled by default
dynamic-hz yes
```

As an extra note, in addition to periodically deleting expired keys, other periodic tasks—such as closing timed-out client connections and updating statistics—also have their execution frequency determined by the `hz` parameter.

**Why doesn't periodic deletion delete every single expired key?**

Doing so would impose too severe a performance penalty. If we have a huge number of keys, scanning through every single one would be extremely time-consuming and severely hurt performance. Redis designed this strategy to balance memory usage and performance.

**Why not delete a key immediately the moment it expires? Doesn't keeping it waste lots of memory?**

Because it is hard to achieve—or rather, the cost of doing so is too high. If we used a delayed queue as the deletion policy, we would face the following issues:

1. The queue itself can carry huge overhead: when there are many keys, a single delayed queue might not even fit them all.
2. Maintaining a delayed queue is cumbersome: modifying a key's expiration time requires adjusting its position in the delayed queue, and concurrency control would also have to be introduced.

### What If a Large Number of Keys Expire at the Same Time?

When a massive number of keys in Redis expire simultaneously at the exact same point in time, it can lead to the following problems:

- **Increased request latency**: Redis consumes CPU resources while processing expired keys. If the number of expired keys is huge, the CPU usage of the Redis instance spikes, slowing down the processing of other requests and increasing latency.
- **Excessive memory usage**: Even though expired keys are no longer valid, they continue to occupy memory space until Redis actually deletes them. If expired keys are not cleaned up promptly, memory usage can climb too high or even trigger an OOM condition.

To avoid these problems, you can take the following measures:

1. **Avoid synchronized key expirations as much as possible**: Add some randomness when setting key expiration times.
2. **Enable the lazy free mechanism**: Edit the `redis.conf` configuration file and set `lazyfree-lazy-expire` to `yes` to enable lazy free. Once enabled, Redis deletes expired keys asynchronously in the background without blocking the main thread, reducing the impact on Redis performance.

### Do You Know Redis's Memory Eviction Policies?

> Related question: There are 20 million records in MySQL, and Redis stores only 200k records. How do you ensure that the data in Redis consists solely of hot data?

Redis's memory eviction policy is triggered only when runtime memory usage reaches the configured maximum memory threshold, which is defined by the `maxmemory` parameter in `redis.conf`. On 64-bit operating systems, `maxmemory` defaults to 0, meaning no memory size limit; on 32-bit operating systems, the default maximum memory is 3 GB.

You can check the `maxmemory` value using the `config get maxmemory` command:

```bash
> config get maxmemory
maxmemory
0
```

Redis provides 6 memory eviction policies:

1. **volatile-lru (least recently used)**: Evicts the least recently used keys from the dataset of keys with an expiration set (`server.db[i].expires`).
2. **volatile-ttl**: Evicts the keys closest to expiration from the dataset of keys with an expiration set (`server.db[i].expires`).
3. **volatile-random**: Randomly evicts keys from the dataset of keys with an expiration set (`server.db[i].expires`).
4. **allkeys-lru (least recently used)**: Evicts the least recently used keys from the entire dataset (`server.db[i].dict`).
5. **allkeys-random**: Randomly evicts keys from the entire dataset (`server.db[i].dict`).
6. **no-eviction** (default memory eviction policy): Prohibits evicting data; when memory is insufficient to accommodate newly written data, new write operations return an error.

Two more were added in version 4.0:

7. **volatile-lfu (least frequently used)**: Evicts the least frequently used keys from the dataset of keys with an expiration set (`server.db[i].expires`).
8. **allkeys-lfu (least frequently used)**: Evicts the least frequently used keys from the entire dataset (`server.db[i].dict`).

`allkeys-xxx` indicates evicting from all key-value pairs, whereas `volatile-xxx` indicates evicting only from key-value pairs that have an expiration time set.

`config.c` defines the enum array of memory eviction policies:

```c
configEnum maxmemory_policy_enum[] = {
    {"volatile-lru", MAXMEMORY_VOLATILE_LRU},
    {"volatile-lfu", MAXMEMORY_VOLATILE_LFU},
    {"volatile-random",MAXMEMORY_VOLATILE_RANDOM},
    {"volatile-ttl",MAXMEMORY_VOLATILE_TTL},
    {"allkeys-lru",MAXMEMORY_ALLKEYS_LRU},
    {"allkeys-lfu",MAXMEMORY_ALLKEYS_LFU},
    {"allkeys-random",MAXMEMORY_ALLKEYS_RANDOM},
    {"noeviction",MAXMEMORY_NO_EVICTION},
    {NULL, 0}
};
```

You can run `config get maxmemory-policy` to inspect Redis's current memory eviction policy:

```bash
> config get maxmemory-policy
maxmemory-policy
noeviction
```

You can modify the memory eviction policy using `config set maxmemory-policy <eviction-policy>`, which takes effect immediately, though the change is lost after Redis restarts. Modifying the `maxmemory-policy` parameter in `redis.conf` persists across restarts, though a restart is required for the change to take effect.

```properties
maxmemory-policy noeviction
```

For a detailed explanation of eviction policies, refer to the official Redis documentation: <https://redis.io/docs/reference/eviction/>.

## References

- *Redis Development and Operations* (in Chinese)
- *Redis Design and Implementation* (in Chinese)
- *Redis Core Principles and Practice* (in Chinese)
- Redis Command Reference (in Chinese): <https://www.redis.com.cn/commands.html>
- The Ultimate Guide to RedisSearch You Should Have! (in Chinese): <https://mp.weixin.qq.com/s/FA4XVAXJksTOHUXMsayy2g>
- WHY Redis choose single thread (vs multi threads): [https://medium.com/@jychen7/sharing-redis-single-thread-vs-multi-threads-5870bd44d153](https://medium.com/@jychen7/sharing-redis-single-thread-vs-multi-threads-5870bd44d153)
