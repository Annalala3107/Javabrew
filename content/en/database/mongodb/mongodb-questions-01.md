---
title: "MongoDB Common Interview Questions Summary (Part 1)"
description: "Part 1 of the MongoDB common interview questions summary, explaining core topics including MongoDB fundamentals, storage structure, data types, replica set high availability, and sharded cluster horizontal scaling to help with backend interview preparation."
category: Database
tag:
  - NoSQL
  - MongoDB
head:
  - - meta
    - name: keywords
      content: MongoDB Interview Questions,Document Database,BSON,Replica Set,Sharded Cluster,MongoDB Indexes,WiredTiger,Aggregation Pipeline
lang: en
sourceRef: zh-ref/database/mongodb/mongodb-questions-01.md
---

> A small portion of the content references descriptions from the official MongoDB documentation, which is noted here.

## MongoDB Fundamentals

### What Is MongoDB?

MongoDB is an open-source NoSQL database system based on **distributed file storage**, written in **C++**. MongoDB provides a **document-oriented** storage model that is straightforward and easy to work with, supports "**schema-less**" data modeling, and can store relatively complex data types, making it a very popular **document database**.

Under high load, MongoDB natively supports horizontal scaling and high availability, allowing you to easily add more nodes/instances to ensure service performance and availability. In many scenarios, MongoDB can replace traditional relational databases or key-value stores, aiming to provide a scalable, highly available, high-performance data storage solution for web applications.

### What Is MongoDB's Storage Structure?

Unlike traditional relational databases, MongoDB's storage structure consists primarily of the following three units:

- **Document**: The most basic unit in MongoDB, composed of BSON key-value pairs, similar to a row in a relational database.
- **Collection**: A collection can contain multiple documents, similar to a table in a relational database.
- **Database**: A database can contain multiple collections, and you can create multiple databases in MongoDB, similar to a database in a relational database.

In other words, MongoDB stores data records as documents (more specifically, [BSON documents](https://www.mongodb.com/docs/manual/core/document/#std-label-bson-document-format)), these documents are grouped together in collections, and a database stores one or more collections of documents.

**Comparison of Common SQL and MongoDB Terminology**:

| SQL                      | MongoDB                         |
| ------------------------ | ------------------------------- |
| Table                    | Collection                      |
| Row                      | Document                        |
| Column                   | Field                           |
| Primary Key              | Object ID (`ObjectId`)          |
| Index                    | Index                           |
| Embedded Table           | Embedded Document               |
| Array                    | Array                           |

#### Document

A record in MongoDB is a BSON document, which is a data structure composed of key-value pairs, similar to a JSON object, and serves as the fundamental unit of data in MongoDB. Field values may include other documents, arrays, and arrays of documents.

![MongoDB Document](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/crud-annotated-document.-b917150e.png)

Document keys are strings. With a few exceptions, keys may use any UTF-8 characters.

- Keys cannot contain `\0` (the null character), which is used to mark the end of a key.
- `.` and `$` have special meanings and can only be used under specific circumstances.
- Keys beginning with an underscore `_` are reserved (though this is not strictly enforced).

**BSON [bee·sahn]** is short for Binary [JSON](http://json.org/). It is a binary representation of JSON documents that supports embedding documents and arrays within other documents and arrays, and includes extensions that allow representation of data types not part of the JSON specification. For details on the BSON specification, refer to [bsonspec.org](http://bsonspec.org/); see also [BSON Types](https://www.mongodb.com/docs/manual/reference/bson-types/).

According to Wikipedia's description of BSON, BSON offers faster traversal speed than JSON, which is the primary reason MongoDB chose BSON, though BSON requires more storage space.

> Compared to JSON, BSON is designed to improve storage and scan efficiency. Large elements in a BSON document are prefixed with a length field to facilitate scanning. In some cases, BSON uses more space than JSON due to length prefixes and explicit array indices.

![BSON Official Homepage](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/bsonspec.org-d1a3c1dd.png)

#### Collection

MongoDB collections exist within databases and **have no fixed schema**—that is, they are **schema-less**, meaning you can insert data of different formats and types into the same collection. Normally, however, the documents inserted into a collection share some logical relationship.

![MongoDB Collection](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/crud-annotated-collection-b60932eb.png)

A collection does not need to be created in advance. When the first document is inserted or the first index is created, if the collection does not exist, a new collection is created automatically.

Collection names can be any UTF-8 string that satisfies the following conditions:

- A collection name cannot be an empty string `""`.
- A collection name cannot contain `\0` (the null character), which indicates the end of the collection name.
- A collection name cannot begin with `"system."`, a prefix reserved for system collections. For example, the `system.users` collection stores database user information, and the `system.namespaces` collection stores information about all collections in the database.
- A collection name must start with an underscore or an alphabetic character and cannot contain `$`.

#### Database

A database is used to store all collections, while collections store all documents. You can create multiple databases in a single MongoDB deployment, each with its own collections and permissions.

MongoDB reserves several special databases:

- **admin**: The `admin` database primarily stores root users and roles. For example, `system.users` stores users and `system.roles` stores roles. Direct manipulation of this database by users is generally not recommended. Adding a user to this database and granting it the `dbAdminAnyDatabase` role on `admin` automatically gives the user permissions across all databases. Certain server-side commands can also only be run from this database, such as shutting down the server.
- **local**: The `local` database is never replicated to other shards, so it can be used to store arbitrary collections local to a single server. Users are generally advised not to use `local` to store application data or perform CRUD operations on it, because the data cannot be backed up or restored normally.
- **config**: When MongoDB uses a sharded setup, the `config` database stores metadata and information related to sharding.
- **test**: The default test database created automatically. When connecting to a [mongod](https://mongoing.com/docs/reference/program/mongod.html) service without specifying a particular database, you connect to the `test` database by default.

Database names can be any UTF-8 string that satisfies the following conditions:

- Cannot be an empty string `""`.
- Must not contain `' '` (space), `.`, `$`, `/`, `\`, or `\0` (null character).
- Should be all lowercase.
- Maximum of 64 bytes.

Database names eventually map to files in the filesystem, which is why so many naming restrictions apply.

### What Are the Features of MongoDB?

- **Data records are stored as documents**: A record in MongoDB is a BSON document—a data structure made of key-value pairs similar to a JSON object—serving as the basic unit of data in MongoDB.
- **Schema-free**: A collection is analogous to a table in MySQL, except it does not require defining any schema and can represent complex domain model objects using fewer data objects.
- **Supports multiple query methods**: The MongoDB Query API supports read/write operations (CRUD), data aggregation, text search, and geospatial queries.
- **Supports ACID transactions**: NoSQL databases typically do not support transactions, making trade-offs for scalability and high performance. MongoDB is an exception. Just like relational databases, MongoDB transactions provide ACID properties. Single-document operations in MongoDB are natively atomic and thus exhibit transactional behavior. MongoDB 4.0 added support for multi-document transactions, limited to replica set deployments—meaning the transaction scope was restricted to a single replica set. MongoDB 4.2 introduced distributed transactions, adding support for multi-document transactions on sharded clusters and unifying it with existing multi-document transaction support on replica sets.
- **Efficient binary storage**: Documents stored in collections exist in key-value form. The key uniquely identifies a document (typically of type `ObjectId`), and the value is stored in BSON format. BSON = Binary JSON, which adds type information and metadata descriptions on top of JSON.
- **Built-in data compression**: Requires fewer storage resources to hold the same amount of data.
- **Supports map-reduce**: Completes complex aggregation tasks using a divide-and-conquer approach. However, starting from MongoDB 5.0, map-reduce is deprecated in favor of the [Aggregation Pipeline](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/), which provides better performance and usability than map-reduce.
- **Supports multiple index types**: MongoDB supports various index types, including single field indexes, compound indexes, multikey indexes, hashed indexes, text indexes, geospatial indexes, and more, each suited to different use cases.
- **Supports failover**: Provides automatic failover; when the primary node fails, a new primary is automatically elected from the secondary nodes to keep the cluster operating normally, transparently to clients.
- **Supports sharded clusters**: MongoDB supports automatically partitioning data across a cluster, enabling the cluster to store more data and achieve higher performance, with automatic routing and storage during inserts and updates.
- **Supports storing large files**: A single MongoDB document is limited to 16 MB. For files larger than 16 MB, MongoDB provides GridFS, which splits large files into chunks and stores those smaller chunk documents in the database.

### What Application Scenarios Is MongoDB Suitable For?

**MongoDB's strengths lie in the flexibility of its data model and storage engine, the scalability of its architecture, and its powerful indexing support.**

Whether to choose MongoDB should be decided by fully weighing its strengths against actual project requirements:

- As the project evolves, does storing data in a JSON-like format (BSON) meet project needs? A record in MongoDB is a BSON document composed of key-value pairs, similar to a JSON object, and serves as MongoDB's fundamental data unit.
- Do you need to store large volumes of data or scale horizontally quickly? MongoDB supports sharded clusters, making it easy to add more nodes (instances) so the cluster can store more data and deliver higher performance.
- Do you need diverse index types to cover more application scenarios? MongoDB supports many index types—including single field, compound, multikey, hashed, text, and geospatial indexes—each tailored to specific query patterns.
- ...

## MongoDB Storage Engines

### Which Storage Engines Does MongoDB Support?

A storage engine is the core component of a database responsible for managing how data is stored in memory and on disk.

Like MySQL, MongoDB adopts a **pluggable storage engine architecture**, supporting different storage engines where each solves problems for different workloads. You can specify a storage engine when creating a database or collection.

> A pluggable storage engine architecture decouples the server layer from the storage engine layer, allowing multiple storage engines to be supported—just as MySQL can support both the B-Tree-based InnoDB storage engine and the LSM-based RocksDB storage engine.

When storage engines were first introduced, MMAPv1 was the default; MongoDB 4.x no longer supports the MMAPv1 storage engine.

Today, there are primarily two storage engines:

- **WiredTiger Storage Engine**: Since MongoDB 3.2, the default storage engine has been the [WiredTiger Storage Engine](https://www.mongodb.com/docs/manual/core/wiredtiger/). It is well suited for most workloads and is recommended for new deployments. WiredTiger provides features such as a document-level concurrency model, checkpoints, and data compression (covered later).
- **In-Memory Storage Engine**: The [In-Memory Storage Engine](https://www.mongodb.com/docs/manual/core/inmemory/) is available in MongoDB Enterprise. Instead of storing documents on disk, it keeps them in memory for more predictable data latency.

In addition, MongoDB 3.0 introduced a **pluggable storage engine API**, allowing third parties to develop storage engines for MongoDB—similar in concept to MySQL.

### Is WiredTiger Based on an LSM Tree or a B+ Tree?

Currently, the vast majority of popular database storage engines are implemented using either a B/B+ Tree or an LSM (Log-Structured Merge) Tree. Most NoSQL databases (such as HBase, Cassandra, and RocksDB) are based on LSM Trees, whereas MongoDB is a bit different.

As noted above, since MongoDB 3.2, the default storage engine is WiredTiger. On WiredTiger's official website, we can see that WiredTiger uses a B+ Tree as its storage structure:

```plain
WiredTiger maintains a table's data in memory using a data structure called a B-Tree ( B+ Tree to be specific), referring to the nodes of a B-Tree as pages. Internal pages carry only keys. The leaf pages store both keys and values.
```

In addition, WiredTiger also supports [LSM (Log-Structured Merge)](https://source.wiredtiger.com/3.1.0/lsm.html) Trees as a storage structure, though when MongoDB uses WiredTiger as its storage engine, it uses B+ Trees by default.

If you want to understand why MongoDB uses B+ Trees, check out this article: [[Debunking Rote Interview Answers] Stop Guessing—MongoDB Uses a B+ Tree, Not the B-Tree You Thought](https://zhuanlan.zhihu.com/p/519658576).

When using a B+ Tree, WiredTiger reads and writes data to disk in units of a **page**. Each node in the B+ Tree is a page, and there are three types of pages:

- **root page**: The root node of the B+ Tree.
- **internal page**: Intermediate index nodes that do not store actual data.
- **leaf page**: Leaf nodes that store the actual data, containing a page header, a block header, and the actual data (key/value). The page header defines information such as the page type, the size of the actual payload in the page, and the number of records in the page; the block header defines information such as the page checksum and the block's addressing location on disk.

The overall structure is shown in the diagram below:

![WiredTiger B+ Tree Overall Structure](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/mongodb-b-plus-tree-integral-structure-387883ed.jpg)

If you want to study the WiredTiger storage engine in depth, it is recommended to read the MongoDB Chinese Community's [WiredTiger Storage Engine Series](https://mongoing.com/archives/category/wiredtiger%e5%ad%98%e5%82%a8%e5%bc%95%e6%93%8e%e7%b3%bb%e5%88%97).

## MongoDB Aggregation

### What Is MongoDB Aggregation Used For?

In real-world projects, we often need to bring together multiple documents or even multiple collections to compute and analyze values (such as calculating sums or finding maximums) and return the computed results. This process is called an **aggregation operation**.

According to the official documentation, we can use aggregation operations to:

- Group values from multiple documents together.
- Perform operations on the grouped data to return a single result.
- Analyze data changes over time.

### Which Methods Does MongoDB Provide to Perform Aggregation?

MongoDB provides two ways to perform aggregation:

- **Aggregation Pipeline**: The preferred method for performing aggregation operations.
- **Single Purpose Aggregation Methods**: Single-purpose aggregation functions such as `count()`, `distinct()`, and `estimatedDocumentCount()`.

Most articles also mention **map-reduce** as an aggregation method. However, starting in MongoDB 5.0, map-reduce is deprecated in favor of the [Aggregation Pipeline](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/), which offers better performance and usability than map-reduce.

A MongoDB aggregation pipeline consists of multiple stages, each transforming documents as they pass through the pipeline. Each stage receives the output from the previous stage, processes the data further, and passes it as input to the next stage.

The workflow of each pipeline is:

1. Accept a set of raw data documents.
2. Perform a series of operations on those documents.
3. Output the resulting documents to the next stage.

![Pipeline Workflow](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/mongodb-aggregation-stage-a09e1e52.png)

**Common Stage Operators**:

| Operator  | Description                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| \$match   | Match operator, used to filter the document collection                                                                               |
| \$project | Projection operator, used to reshape fields of each document—extracting fields, renaming fields, or adding computed fields           |
| \$sort    | Sort operator, used to sort documents by one or more fields                                                                          |
| \$limit   | Limit operator, used to restrict the number of returned documents                                                                    |
| \$skip    | Skip operator, used to skip a specified number of documents                                                                          |
| \$count   | Count operator, used to count the number of documents                                                                                |
| \$group   | Group operator, used to group a collection of documents                                                                              |
| \$unwind  | Unwind operator, used to split each element of an array into separate documents                                                      |
| \$lookup  | Join operator, used to join with another collection in the same database and retrieve matching documents, similar to `populate`      |

For more operators, see the official documentation: <https://docs.mongodb.com/manual/reference/operator/aggregation/>

Stage operators are used inside the `db.collection.aggregate` method at the top level of the array parameter.

```sql
db.collection.aggregate( [ { <stageOperator>: <expression> }, { <stageOperator>: <expression> }, ... ] )
```

Below is an example from the official MongoDB documentation:

```sql
db.orders.aggregate([
   # Stage 1: The $match stage filters documents by the status field and passes documents with status equal to "A" to the next stage.
    { $match: { status: "A" } },
  # Stage 2: The $group stage groups documents by the cust_id field to calculate the sum of amount for each unique cust_id value.
    { $group: { _id: "$cust_id", total: { $sum: "$amount" } } }
])
```

## MongoDB Transactions

> Understanding the internal principles of MongoDB transactions takes quite a bit of time, and I haven't completely figured out every detail myself either. Therefore, I will only give a brief introduction to MongoDB transactions here. Anyone interested in the underlying mechanics can search and read more materials on their own.
>
> Here are a few recommended articles for your reference:
>
> - [Technical Deep Dive | MongoDB Transaction Principles](https://mongoing.com/archives/82187)
> - [MongoDB Consistency Model Design and Implementation](https://developer.aliyun.com/article/782494)
> - [Official MongoDB Documentation on Transactions](https://www.mongodb.com/docs/upcoming/core/transactions/)

As we mentioned when introducing NoSQL databases, NoSQL databases generally do not support transactions, making trade-offs for scalability and high performance. However, there are exceptions, and MongoDB supports transactions.

Like relational databases, MongoDB transactions have ACID properties:

- **Atomicity**: A transaction is the smallest unit of execution and cannot be divided. Atomicity guarantees that all operations in a transaction either complete in full or have no effect at all.
- **Consistency**: Data remains consistent before and after executing a transaction. For example, in a fund transfer scenario, regardless of whether the transaction succeeds or fails, the combined balance of the sender and recipient should remain unchanged.
- **Isolation**: When accessing the database concurrently, one user's transaction is not interfered with by other transactions, and concurrent transactions see isolated database states. The WiredTiger storage engine supports `read-uncommitted`, `read-committed`, and `snapshot` isolation, with MongoDB defaulting to `snapshot` isolation at startup. Under different isolation levels, phenomena such as dirty reads, non-repeatable reads, and phantom reads may occur during a transaction's lifecycle.
- **Durability**: Once a transaction is committed, its changes to data in the database are permanent and should not be affected even if the database encounters a failure.

I won't go into exhaustive detail about transactions in this article; if you are interested, you can check out my [MySQL Common Interview Questions Summary](../mysql/mysql-questions-01.md), which covers them in depth.

MongoDB natively supports atomicity for single-document operations, which already exhibit transactional behavior. When people talk about MongoDB transactions, they usually mean **multi-document** transactions. MongoDB 4.0 added support for multi-document ACID transactions, but only for replica set deployments—meaning the transaction scope was limited to a single replica set. MongoDB 4.2 introduced **distributed transactions**, adding support for multi-document transactions across sharded clusters and unifying them with the existing multi-document transaction support on replica sets.

According to the official documentation:

> Starting in MongoDB 4.2, distributed transactions and multi-document transactions refer to the same concept in MongoDB. Distributed transactions are multi-document transactions on sharded clusters and replica sets. Beginning in MongoDB 4.2, multi-document transactions (whether on a sharded cluster or a replica set) are also referred to as distributed transactions.

In most cases, multi-document transactions incur a higher performance cost than single-document writes. For the majority of use cases, [denormalized data models (embedded documents and arrays)](https://www.mongodb.com/docs/upcoming/core/data-model-design/#std-label-data-modeling-embedding) remain the best choice. In other words, properly modeling your data can minimize the need for multi-document transactions.

**Note**:

- Starting in MongoDB 4.2, multi-document transactions are supported on both replica sets and sharded clusters where the primary uses the WiredTiger storage engine and secondaries use either WiredTiger or the In-Memory storage engine. In MongoDB 4.0, only replica sets using the WiredTiger storage engine supported transactions.
- In MongoDB 4.2 and earlier, you cannot create collections within a transaction. Starting in MongoDB 4.4, you can create collections and indexes inside transactions. For details, see [Create Collections and Indexes in a Transaction](https://www.mongodb.com/docs/upcoming/core/transactions/#std-label-transactions-create-collections-indexes).

## MongoDB Data Compression

With the WiredTiger storage engine (the default since MongoDB 3.2), MongoDB supports compression for all collections and indexes. Compression minimizes storage usage at the cost of additional CPU overhead.

By default, WiredTiger uses the [Snappy](https://github.com/google/snappy) compression algorithm (open-sourced by Google, designed for very high speed and reasonable compression with a 3x–5x compression ratio) for block compression on all collections and prefix compression on all indexes.

In addition to Snappy, the following compression algorithms are available for collections:

- [zlib](https://github.com/madler/zlib): A high-compression algorithm offering a 5x–7x compression ratio.
- [Zstandard](https://github.com/facebook/zstd) (abbreviated `zstd`): A fast lossless compression algorithm open-sourced by Facebook, providing higher compression ratios and lower CPU usage than zlib for real-time compression scenarios, available starting in MongoDB 4.2.

The WiredTiger journal is also compressed, using Snappy by default as well. If a journal record is less than or equal to 128 bytes, WiredTiger does not compress that record.

## Differences Between Amazon DocumentDB and MongoDB

Amazon DocumentDB (with MongoDB compatibility) is a fast, reliable, and fully managed database service. Amazon DocumentDB makes it easy to set up, operate, and scale MongoDB-compatible databases in the cloud.

### `$vectorSearch` Operator

Amazon DocumentDB does not support `$vectorSearch` as a standalone operator. Instead, `vectorSearch` is supported inside the `$search` operator. For more information, see [Vector Search for Amazon DocumentDB](https://docs.aws.amazon.com/zh_cn/documentdb/latest/developerguide/vector-search.html).

### `OpCountersCommand`

Amazon DocumentDB's `OpCountersCommand` behavior differs from MongoDB's `opcounters.command` as follows:

- MongoDB's `opcounters.command` counts all commands except inserts, updates, and deletes, whereas Amazon DocumentDB's `OpCountersCommand` also excludes the `find` command.
- Amazon DocumentDB counts internal commands (such as `getCloudWatchMetricsV2`) toward `OpCountersCommand`.

### Admin and Local Databases and Collections

Amazon DocumentDB does not support the `admin` or `local` databases, nor does it support MongoDB's `system.*` or `startup_log` collections.

### `cursor.maxTimeMS`

In Amazon DocumentDB, `cursor.maxTimeMS` resets its timer for each `getMore` request. Therefore, if a `maxTimeMS` of 3000 ms is specified, and the initial query takes 2800 ms while each subsequent `getMore` request takes 300 ms, the cursor will not time out. A cursor only times out if a single operation (either the query or an individual `getMore` request) takes longer than the specified `maxTimeMS` value. Additionally, the scanner that checks cursor execution times runs at five (5) minute intervals.

### `explain()`

Amazon DocumentDB emulates the MongoDB 4.0 API on a purpose-built database engine backed by a distributed, fault-tolerant, self-healing storage system. As a result, query plans and `explain()` output may differ between Amazon DocumentDB and MongoDB. Customers who wish to control their query plans can use the `$hint` operator to force the selection of a preferred index.

### Field Name Restrictions

Amazon DocumentDB does not support dots (`.`) in document field names—for example, `db.foo.insert({‘x.1’:1})`.

Amazon DocumentDB also does not support the `$` prefix in field names.

For example, try running the following command in Amazon DocumentDB or MongoDB:

```shell
rs0:PRIMARY< db.foo.insert({"a":{"$a":1}})
```

MongoDB returns the following:

```shell
WriteResult({ "nInserted" : 1 })
```

Amazon DocumentDB returns an error:

```shell
WriteResult({
  "nInserted" : 0,
  "writeError" : {
    "code" : 2,
    "errmsg" : "Document can't have $ prefix field names: $a"
  }
})
```

## References

- Official MongoDB Documentation (primary reference; defer to the official docs): <https://www.mongodb.com/docs/manual/>
- *MongoDB: The Definitive Guide*
- Technical Deep Dive | MongoDB Transaction Principles - MongoDB Chinese Community: <https://mongoing.com/archives/82187>
- Transactions - Official MongoDB Documentation: <https://www.mongodb.com/docs/manual/core/transactions/>
- WiredTiger Storage Engine - Official MongoDB Documentation: <https://www.mongodb.com/docs/manual/core/wiredtiger/>
- WiredTiger Storage Engine Part 1: Basic Data Structure Analysis: <https://mongoing.com/topic/archives-35143>
