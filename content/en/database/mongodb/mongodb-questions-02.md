---
title: "MongoDB Common Interview Questions Summary (Part 2)"
description: "Part 2 of the MongoDB common interview questions summary, providing an in-depth explanation of the principles, use cases, and query optimization techniques for various MongoDB index types (single field, compound, multikey, text, geospatial, TTL)."
category: Database
tag:
  - NoSQL
  - MongoDB
head:
  - - meta
    - name: keywords
      content: MongoDB Indexes,Compound Index,Multikey Index,Text Index,Geospatial Index,TTL Index,MongoDB Query Optimization,Index Design
lang: en
sourceRef: zh-ref/database/mongodb/mongodb-questions-02.md
---

## MongoDB Indexes

### What Are MongoDB Indexes Used For?

Similar to relational databases, MongoDB also has indexes. The primary purpose of indexes is to improve query efficiency. Without an index, MongoDB must perform a **collection scan**, i.e., scan every document in the collection to select the documents that match the query statement. If an appropriate index exists for the query, MongoDB can use that index to limit the number of documents it must inspect. Furthermore, MongoDB can return sorted results using the ordering already stored in the index.

Although indexes can significantly shorten query times, using and maintaining indexes comes at a cost. When performing write operations, in addition to updating the document itself, MongoDB must also update the indexes, which inevitably impacts write performance. Therefore, when there are heavy write operations and few read operations, or when read performance is not a concern, creating indexes is not recommended.

### What Types of Indexes Does MongoDB Support?

**MongoDB supports multiple types of indexes, including single field indexes, compound indexes, multikey indexes, hashed indexes, text indexes, geospatial indexes, and more, each suited to different use cases.**

- **Single Field Index**: An index created on a single field. The sort order specified when creating the index does not matter because MongoDB can traverse it starting from either the beginning or the end.
- **Compound Index**: An index created on multiple fields, also referred to as a composite index or joint index.
- **Multikey Index**: A field in MongoDB may be an array; creating an index on such a field creates a multikey index. MongoDB creates an index entry for every element in the array. That means you can query using values inside the array as conditions, and the query will still use the index.
- **Hashed Index**: Indexes based on the hash value of the data, used in hashed sharded clusters.
- **Text Index**: Supports text search queries on string content. A text index can include any field whose value is a string or an array of string elements. A collection can have at most one text search index, though that index can cover multiple fields. Although MongoDB supports full-text indexes, their performance is relatively low, so they are generally not recommended for heavy use.
- **Geospatial Index**: Indexes based on latitude and longitude, suitable for 2D and 3D location queries.
- **Unique Index**: Ensures that the indexed field does not store duplicate values. If the collection already contains documents that violate the unique constraint of the index, creating a unique index in the background will fail.
- **TTL Index**: A TTL index provides an expiration mechanism that lets you set an expiration time for each document; once a document reaches its preset expiration time, it is deleted.
- ...

### Does the Field Order in a Compound Index Matter?

The order of fields in a compound index is very important. For example, the compound index shown in the figure below consists of `{userid:1, score:-1}`: this compound index is first sorted by `userid` in ascending order, and then within each value of `userid`, sorted by `score` in descending order.

![Compound Index](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/mongodb-composite-index-0ead2e46.png)

In a compound index, the sort order determines whether the index can be used by a query.

Sort orders that use the compound index:

```sql
db.s2.find().sort({"userid": 1, "score": -1})
db.s2.find().sort({"userid": -1, "score": 1})
```

Sort orders that do not use the compound index:

```sql
db.s2.find().sort({"userid": 1, "score": 1})
db.s2.find().sort({"userid": -1, "score": -1})
db.s2.find().sort({"score": 1, "userid": -1})
db.s2.find().sort({"score": 1, "userid": 1})
db.s2.find().sort({"score": -1, "userid": -1})
db.s2.find().sort({"score": -1, "userid": 1})
```

We can analyze this using `explain`:

```sql
db.s2.find().sort({"score": -1, "userid": 1}).explain()
```

### Do Compound Indexes Follow the Leftmost Prefix Principle?

**MongoDB compound indexes follow the leftmost prefix principle**: an index with multiple keys simultaneously provides indexes made up of all prefixes of those keys, excluding subsets that are not leftmost prefixes. For instance, if you have an index like `{a: 1, b: 1, c: 1, ..., z: 1}`, you effectively also have a series of prefix indexes such as `{a: 1}`, `{a: 1, b: 1}`, `{a: 1, b: 1, c: 1}`, etc., but you do not have a non-leftmost-prefix index such as `{b: 1}`.

### What Is a TTL Index?

A TTL index provides an expiration mechanism that allows you to set an expiration time `expireAfterSeconds` for documents; when a document reaches the preset expiration time, it is deleted. Aside from the `expireAfterSeconds` property, a TTL index behaves just like a regular index.

Data expiration is useful for certain types of information, such as machine-generated event data, logs, and session information, which only need to be retained in the database for a limited amount of time.

**How TTL Indexes Work**:

- MongoDB starts a background thread that reads the TTL index values to determine whether documents have expired. However, it does not guarantee that expired data is deleted immediately, because the background thread triggers the deletion task every 60 seconds; moreover, if the volume of data to delete is large, the next task may start before the previous deletion has finished, causing expired data to remain beyond the retention period by more than 60 seconds.
- For a replica set, the TTL index background thread runs only on the Primary node and remains idle on Secondary nodes; deletions on Secondary nodes are synchronized via the oplog generated when the Primary deletes the documents.

**TTL Index Restrictions**:

- TTL indexes are single-field indexes. Compound indexes do not support TTL.
- The `_id` field does not support TTL indexes.
- You cannot create a TTL index on a Capped Collection because MongoDB cannot delete documents from a capped collection.
- If a non-TTL index already exists on a field, you cannot create a TTL index on that same field.

### What Is a Covered Index Query?

According to the official documentation, a covered query is a query in which:

- All fields in the query are part of an index.
- All fields returned in the results are in the same index.
- No fields in the query are equal to `null`.

Because all fields appearing in the query are part of the index, MongoDB does not need to inspect the full data documents to match the query conditions or return results using the same index. Because indexes reside in memory, retrieving data directly from an index is much faster than reading data by scanning documents.

For example, suppose we have the following `users` collection:

```json
{
   "_id": ObjectId("53402597d852426020000002"),
   "contact": "987654321",
   "dob": "01-01-1991",
   "gender": "M",
   "name": "Tom Benzamin",
   "user_name": "tombenzamin"
}
```

We create a compound index on the `users` collection with the fields `gender` and `user_name`:

```sql
db.users.ensureIndex({gender:1,user_name:1})
```

Now, this index will cover the following query:

```sql
db.users.find({gender:"M"},{user_name:1,_id:0})
```

For the specified index to cover the query, you must explicitly specify `_id: 0` to exclude the `_id` field from the result, because the index does not include the `_id` field.

## MongoDB High Availability

### Replica Sets

#### What Is a Replica Set?

A MongoDB replica set (replication cluster) is a group of `mongod` processes that maintain the same data set.

Clients connect to the entire MongoDB replica set. The Primary node handles writes for the entire replica set; Secondary nodes can serve read operations, though by default the Primary node also handles reads for the entire replica set. When the Primary node fails, a new Primary node is automatically elected from the Secondary nodes to ensure normal operation of the cluster, transparently to clients.

Typically, a replica set consists of 1 Primary node, multiple Secondary nodes, and zero or 1 Arbiter node.

- **Primary**: The entry point for write operations across the entire cluster; it receives all write operations and records all changes to collections in the operations log, i.e., the `oplog`. If the Primary node goes down, a new Primary node is elected automatically.
- **Secondary**: Synchronizes data from the Primary node and participates in electing a new Primary if the Primary goes down. However, a Secondary node can be configured with priority `0` to prevent it from becoming Primary in an election.
- **Arbiter**: Used to save resources or for multi-datacenter disaster recovery; it only votes in Primary elections and does not store data, ensuring a node can obtain a majority of votes.

The diagram below shows a typical three-member replica set:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/replica-set-read-write-operations-primary-343f1504.png)

The Primary and Secondary nodes synchronize data through the **oplog (operations log)**. The oplog is a special **Capped Collection** under the `local` database that stores incremental logs generated by write operations, similar to Binlog in MySQL.

> A Capped Collection is similar to a fixed-size circular queue: data is appended sequentially to the end of the collection, and when the collection reaches its space limit, it overwrites the oldest documents in the collection. Data in a capped collection is written sequentially into a fixed disk space, so I/O speed is very fast—and performance is even better without indexes.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/replica-set-primary-with-two-secondaries-ae5b0705.png)

When a write operation completes on the Primary node, a corresponding log entry is written to the `oplog` collection. Secondary nodes continuously pull new entries from this oplog and replay them locally to achieve data synchronization.

A replica set can have at most one Primary node. If the current Primary becomes unavailable, an election selects a new Primary node. MongoDB's node election rules guarantee that after the Primary goes down, the newly elected node is always the one with the most up-to-date data in the cluster.

#### Why Use a Replica Set?

- **Achieve failover**: Provides automatic fault recovery—when the Primary node fails, a new Primary is automatically elected from the Secondaries to keep the cluster operating normally, transparently to clients.
- **Achieve read/write splitting**: You can configure Secondary nodes to allow reads while the Primary handles writes, implementing read/write splitting and relieving excessive read/write pressure on the Primary node. Prior to MongoDB 4.0, if the Primary was not under heavy load, read/write splitting was not recommended because writes blocked reads, unless the business was not very sensitive to response latency and could tolerate some staleness when reading historical data.

### Sharded Clusters

#### What Is a Sharded Cluster?

A sharded cluster is the distributed architecture of MongoDB. Compared with a replica set, data in a sharded cluster is evenly distributed across different shards, which not only greatly increases the total data capacity limit of the cluster, but also distributes read and write load across shards to overcome the performance bottlenecks of a single replica set.

A MongoDB sharded cluster consists of the following three components (the diagram below is from the [official documentation on sharded clusters](https://www.mongodb.com/docs/manual/sharding/)):

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/sharded-cluster-production-architecture-b694ee08.png)

- **Config Servers**: Configuration servers, essentially a MongoDB replica set, responsible for storing various cluster metadata and configuration such as shard addresses and Chunks.
- **Mongos**: Routing service; it does not store actual data, instead retrieving cluster configuration from Config Servers, routing requests to specific shards, and merging results from shards before returning them to the client.
- **Shard**: Each shard holds a subset of the overall data. Starting from MongoDB 3.6, every Shard must be deployed as a replica set architecture.

#### Why Use a Sharded Cluster?

As a system's data volume and throughput grow, there are two common solutions: vertical scaling and horizontal scaling.

Vertical scaling increases the capacity of a single server—such as disk space, memory capacity, or CPU count—whereas horizontal scaling stores data across multiple servers, adding additional servers as needed to increase capacity.

Similar to Redis Cluster, MongoDB can also achieve **horizontal scaling** through sharding. Horizontal scaling is more flexible, meets larger data storage requirements, and supports higher throughput. Moreover, the overall cost of horizontal scaling is lower because it only requires relatively modest single-machine servers, at the expense of greater deployment infrastructure and maintenance complexity.

In other words, you can use a sharded cluster to solve the following problems:

- Storage capacity is limited by a single machine—i.e., disk resources hit a bottleneck.
- Read/write capability is limited by a single machine—CPU, memory, or network interface resources hit a bottleneck, preventing read/write throughput from scaling.

#### What Is a Shard Key?

A **Shard Key** is the prerequisite for data partitioning, enabling data to be distributed across different servers to reduce the burden on any single server. That is, the shard key determines how documents within a collection are distributed across multiple shards in the cluster.

A shard key is a field inside a document, though it is not just an ordinary field—it has specific requirements:

- It must appear in every document.
- It must be an index on the collection—either a single-field index or a prefix of a compound index; it cannot be a multikey index, text index, or geospatial index.
- Prior to MongoDB 4.2, a document's shard key field value was immutable. Starting in MongoDB 4.2, you can update a document's shard key value unless the shard key field is the immutable `_id` field. Starting in MongoDB 5.0, live resharding is supported, allowing you to completely change a collection's shard key.
- Its size cannot exceed 512 bytes.

#### How to Choose a Shard Key?

Choosing an appropriate shard key has a huge impact on sharding efficiency, primarily based on the following four factors (excerpted from [Sharded Cluster Usage Precautions - Tencent Cloud Docs](https://cloud.tencent.com/document/product/240/44611)):

- **Cardinality**: The cardinality of values should be as large as possible. If a low-cardinality shard key is used, because the number of distinct values is limited, the total number of chunks is limited; as data grows, chunk sizes grow larger and larger, making it very difficult to move chunks during horizontal scaling. For example, if age is chosen as the shard key, there are at most ~100 possible values; as data accumulates with too many documents sharing the same value, a chunk can grow beyond `chunkSize`, causing a jumbo chunk that cannot be migrated and leading to uneven data distribution and performance bottlenecks.
- **Value Distribution**: Values should be distributed as evenly as possible. An unevenly distributed shard key causes certain chunks to hold a disproportionately large amount of data, causing the same uneven data distribution and performance bottleneck issues described above.
- **Queries Include the Shard Key**: Queries should include the shard key whenever possible. When querying with the shard key in the condition, `mongos` can route directly to the specific shard; otherwise, `mongos` must broadcast the query to all shards and wait for responses to return.
- **Avoid Monotonically Increasing or Decreasing Keys**: With a monotonically increasing shard key, data file movement is small, yet writes concentrate on one side, causing the data volume on the last shard/chunk to keep growing and triggering constant migrations. The same applies to monotonically decreasing keys.

In summary, when selecting a shard key, you should consider these 4 criteria and satisfy as many as possible to minimize the performance impact of `MoveChunks` and achieve the best performance.

#### What Sharding Strategies Exist?

MongoDB supports two sharding algorithms to satisfy different query requirements (excerpted from [MongoDB Sharded Cluster Introduction - Alibaba Cloud Docs](https://help.aliyun.com/document_detail/64561.html?spm=a2c4g.11186623.0.0.3121565eQhUGGB#h2--shard-key-3)):

**1. Ranged Sharding**:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/example-of-scope-based-sharding-60f88e26.png)

MongoDB splits data into different Chunks based on ranges of the Shard Key's values, where each Chunk contains data within a specific range. Ranged sharding is more efficient when the shard key has high cardinality, low frequency of repeated values, and non-monotonic changes.

- Pros: `mongos` can quickly locate the shard holding the requested data and forward the request to the corresponding Shard node.
- Cons: May cause uneven data distribution across Shard nodes, easily creating read/write hotspots without write dispersion.
- Use Cases: Business scenarios where shard key values are not monotonically increasing or decreasing, have high cardinality and low repetition frequency, and require range queries.

**2. Hashed Sharding**:

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/example-of-hash-based-sharding-eb1d6215.png)

MongoDB computes the hash value of a single field as the index value and splits data into different Chunks based on ranges of those hash values.

- Pros: Distributes data more evenly across Shard nodes and provides write dispersion.
- Cons: Not suitable for range queries; during a range query, read requests must be broadcast to all Shard nodes.
- Use Cases: Business scenarios where shard key values are monotonically increasing or decreasing, have high cardinality and low repetition frequency, require random write distribution, or involve highly random data reads.

In addition to the two strategies above, you can also configure a **compound shard key**, for example combining a low-cardinality key with a monotonically increasing key.

#### How Is Sharded Data Stored?

A **Chunk** is a core concept in a MongoDB sharded cluster; essentially, it is a logical unit of data composed of a group of Documents. Each Chunk contains data within a specific range of the shard key—mutually disjoint, and their union equals the entire dataset—corresponding to the concept of a **partition** in discrete mathematics.

A sharded cluster does not track which shard every individual document lives on; instead, it records which shard each Chunk resides on as well as which data range that Chunk contains.

By default, the maximum size of a Chunk is 64 MB (adjustable within a range of 1–1024 MB; unless there are special requirements, keeping the default value is recommended). During inserts, updates, or deletes, if `mongos` detects that the target Chunk's size or document count exceeds the upper limit, it triggers **Chunk Splitting**.

![Chunk Splitting](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/chunk-splitting-shard-a-e2635dc0.png)

As data grows, Chunks split more and more. At that point, the number of Chunks across different shards may become unbalanced. The **Balancer** component in MongoDB then performs automatic balancing, attempting to keep the number of Chunks even across all Shards—this process is called **Rebalance**. By default, rebalancing is enabled for databases and collections.

As shown in the figure below, as data is inserted, Chunk splitting leaves Shards A and B with 3 Chunks while Shard C has only 1; one Chunk from Shard B is then migrated to Shard C to balance the cluster data.

![Chunk Migration](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/mongo-reblance-three-shards-68d13f07.png)

> The Balancer is a background process in MongoDB that runs on the Primary node of the Config Server (starting from MongoDB 3.4). It monitors the number of Chunks on each shard and initiates migrations when a shard's Chunk count imbalance reaches a threshold.

Chunks only split and never merge, even if `chunkSize` is later increased.

Rebalance operations consume significant system resources. We can reduce their impact on normal MongoDB operations by executing them during off-peak business hours, using pre-splitting, or configuring a balancing window.

#### How Does Chunk Migration Work?

For a detailed explanation of how Chunk migration works, we recommend reading the MongoDB Chinese Community article [Understanding MongoDB Chunk Migration in One Article](https://mongoing.com/archives/77479).

## Recommended Learning Resources

- [MongoDB Chinese Manual | Official Docs Chinese Edition](https://docs.mongoing.com/) (Recommended): Based on version 4.2 and continuously kept in sync with the latest official release.
- [MongoDB Beginner's Tutorial — Learn MongoDB in 7 Days](https://mongoing.com/archives/docs/mongodb%e5%88%9d%e5%ad%a6%e8%80%85%e6%95%99%e7%a8%8b/mongodb%e5%a6%82%e4%bd%95%e5%88%9b%e5%bb%ba%e6%95%b0%e6%8d%ae%e5%ba%93%e5%92%8c%e9%9b%86%e5%90%88): Quick start.
- [Spring Boot + MongoDB Integration in Practice - 2022](https://www.cnblogs.com/dxflqm/p/16643981.html): A great introductory MongoDB article focusing on basic CRUD operations using the MongoDB Java client.

## References

- Official MongoDB Documentation (primary reference; defer to the official docs): <https://www.mongodb.com/docs/manual/>
- *MongoDB: The Definitive Guide*
- Indexes - Official MongoDB Documentation: <https://www.mongodb.com/docs/manual/indexes/>
- MongoDB - Index Knowledge - Programmer Xiangzai - 2022: <https://fatedeity.cn/posts/database/mongodb-index-knowledge.html>
- MongoDB - Indexes: <https://www.cnblogs.com/Neeo/articles/14325130.html>
- Sharding - Official MongoDB Documentation: <https://www.mongodb.com/docs/manual/sharding/>
- MongoDB Sharded Cluster Introduction - Alibaba Cloud Documentation: <https://help.aliyun.com/document_detail/64561.html>
- Sharded Cluster Usage Precautions - Tencent Cloud Documentation: <https://cloud.tencent.com/document/product/240/44611>
