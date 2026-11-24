---
title: In-Depth Guide to Redis Memory Fragmentation
description: An in-depth analysis of the causes, diagnostic methods, and optimization strategies for Redis memory fragmentation, including memory fragmentation ratio calculation, jemalloc allocator principles, and automatic defragmentation configuration.
category: Database
tag:
  - Redis
head:
  - - meta
    - name: keywords
      content: Redis memory fragmentation,memory fragmentation ratio,jemalloc,memory allocation,activedefrag,memory optimization,Redis memory management
lang: en
sourceRef: zh-ref/database/redis/redis-memory-fragmentation.md
---

## What Is Memory Fragmentation?

You can simply understand memory fragmentation as free memory that cannot be effectively utilized.

For example, suppose the operating system allocates 32 bytes of contiguous memory space for you, but the data you actually need to store only requires 24 bytes. If the remaining 8 bytes cannot be subsequently allocated to store other data, those 8 bytes are considered memory fragmentation.

![Memory Fragmentation](/media/jg/ext/oss.javaguide.cn/github/javaguide/memory-fragmentation-9e762b3c.png)

Although memory fragmentation does not degrade Redis's operational execution performance directly, it inflates overall physical memory consumption.

## Why Does Redis Memory Fragmentation Occur?

Redis memory fragmentation typically stems from two common causes:

**1. When storing data, the memory space Redis requests from the operating system may exceed the space actually needed by the data.**

Here is a direct quote from the official Redis documentation:

> To store user keys, Redis allocates at most as much memory as the `maxmemory` setting enables (however there are small extra allocations possible).

When Redis allocates memory via its `zmalloc` method (Redis's proprietary wrapper around memory allocation), in addition to allocating the requested `size`, it allocates an extra `PREFIX_SIZE` bytes of memory.

The source code for `zmalloc` is as follows (source code URL: <https://github.com/antirez/redis-tools/blob/master/zmalloc.c>):

```c
void *zmalloc(size_t size) {
   // Allocate memory of specified size
   void *ptr = malloc(size+PREFIX_SIZE);
   if (!ptr) zmalloc_oom_handler(size);
#ifdef HAVE_MALLOC_SIZE
   update_zmalloc_stat_alloc(zmalloc_size(ptr));
   return ptr;
#else
   *((size_t*)ptr) = size;
   update_zmalloc_stat_alloc(size+PREFIX_SIZE);
   return (char*)ptr+PREFIX_SIZE;
#endif
}
```

Additionally, Redis can use different memory allocators (libc, jemalloc, tcmalloc), defaulting to [jemalloc](https://github.com/jemalloc/jemalloc). Jemalloc allocates memory in fixed-size blocks (8 bytes, 16 bytes, 32 bytes, etc.). The memory block division used by jemalloc is shown below:

![jemalloc Memory Block Allocation](/media/jg/ext/oss.javaguide.cn/javaguide/database/redis/6803d3929e3e46c1b1c9d0bb9ee8e717-da1a1cd1.png)

When an application requests a certain amount of memory, jemalloc rounds up and allocates a fixed block size closest to that request. For example, if the application needs 17 bytes, jemalloc directly allocates a 32-byte block, wasting 15 bytes. However, jemalloc is specifically tuned to mitigate memory fragmentation and generally prevents excessive fragmentation under normal workloads.

**2. Frequent modifications and deletions of Redis data also produce memory fragmentation.**

When data in Redis is deleted, Redis typically does not immediately return that memory to the operating system.

This behavior is explicitly noted in the official Redis documentation:

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/redis-docs-memory-optimization-f0be21e8.png)

Documentation URL: <https://redis.io/topics/memory-optimization>.

## How to View Redis Memory Fragmentation Information?

You can run the `info memory` command to inspect memory-related metrics in Redis. The exact meaning of each parameter is documented in detail on the official Redis website: <https://redis.io/commands/INFO>.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/redis-info-memory-8c8729ad.png)

The formula for calculating the Redis memory fragmentation ratio is:

`mem_fragmentation_ratio` (memory fragmentation ratio) = `used_memory_rss` (physical memory actually allocated to Redis by the OS) / `used_memory` (memory space actually requested and used by Redis's memory allocator to store data)

In other words, a higher `mem_fragmentation_ratio` value indicates more severe memory fragmentation.

Do not mistakenly assume that subtracting `used_memory` from `used_memory_rss` gives the exact memory fragmentation size! The difference includes not only fragmentation, but also process internal overhead, shared libraries, stack, and heap runtime allocations.

Many developers ask: "At what fragmentation ratio does defragmentation become necessary?"

Under normal circumstances, we consider that memory defragmentation is required when `mem_fragmentation_ratio > 1.5`. A ratio above 1.5 means that storing 2GB of actual data in Redis requires more than 3GB of physical memory.

To quickly check the current fragmentation ratio, you can run the following command:

```bash
> redis-cli -p 6379 info | grep mem_fragmentation_ratio
```

Additionally, `mem_fragmentation_ratio` can occasionally fall below 1. This scenario indicates that Redis's required memory exceeds the physical RAM allocated by the OS, meaning portions of Redis memory have been swapped out to disk (Swap). For more details on this condition, you can refer to: [Troubleshooting | What Should You Do When Redis Memory Fragmentation Ratio Is Too Low? - Actions Open Source Community](https://mp.weixin.qq.com/s/drlDvp7bfq5jt2M5pTqJCw).

## How to Clean Up Redis Memory Fragmentation?

Starting from Redis 4.0-RC3, Redis includes a built-in active defragmentation mechanism (`activedefrag`) to address excessive fragmentation.

You can enable it dynamically using the `config set` command:

```bash
config set activedefrag yes
```

The conditions under which defragmentation kicks in are controlled by the following two parameters:

```bash
# Start defragmentation when fragmentation overhead reaches 500MB
config set active-defrag-ignore-bytes 500mb
# Start defragmentation when fragmentation ratio exceeds 1.5 (50% overhead)
config set active-defrag-threshold-lower 50
```

Because automatic memory defragmentation can introduce CPU overhead and impact Redis latency, we can tune the following two parameters to limit its impact on Redis performance:

```bash
# Minimum CPU percentage allocated to memory defragmentation
config set active-defrag-cycle-min 20
# Maximum CPU percentage allocated to memory defragmentation
config set active-defrag-cycle-max 50
```

Alternatively, restarting an instance completely reclaims and reorganizes memory space. If you are operating a high-availability Redis cluster, you can failover a master node with high fragmentation to a replica, and then safely restart the old master.

## References

- Official Redis Documentation: <https://redis.io/topics/memory-optimization>
- Redis Core Technologies and Practice - Geek Time - Why Is Memory Usage Still High After Deleting Data?: <https://time.geekbang.org/column/article/289140>
- Redis Source Code Analysis — Memory Allocation: <https://shinerio.cc/2020/05/17/redis/Redis-源码解析——内存管理>
