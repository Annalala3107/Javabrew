---
title: Common NoSQL Fundamentals Interview Questions Summary
description: Summary of NoSQL database fundamentals interview questions and concepts, including differences between NoSQL and SQL, advantages of NoSQL, the four NoSQL database types (key-value, document, graph, wide-column), and application scenarios for representative products such as Redis, MongoDB, and Neo4j.
category: Databases
tag:
  - NoSQL
  - MongoDB
  - Redis
head:
  - - meta
    - name: keywords
      content: NoSQL,Redis,MongoDB,HBase,Cassandra,Key-Value Database,Document Database,Graph Database,Wide-Column Store,SQL vs NoSQL Differences
lang: en
sourceRef: zh-ref/database/nosql.md
---

## What Is NoSQL?

NoSQL (short for "Not Only SQL") broadly refers to non-relational databases, primarily targeting key-value, document, and graph-style data storage. Moreover, NoSQL databases natively support features such as distributed architecture, data redundancy, and data sharding, aiming to deliver scalable, highly available, and high-performance data storage solutions.

A common misconception is that NoSQL or non-relational databases cannot store relational data well. NoSQL databases can indeed store relational data—they simply store it differently from relational databases.

Representative NoSQL databases: HBase, Cassandra, MongoDB, Redis.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/sql-nosql-tushi-5c2e4f78.png)

## What Are the Differences Between SQL and NoSQL?

|              | SQL Databases                                                              | NoSQL Databases                                                                                                                         |
| :----------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Data Storage Model | Structured storage using tables with fixed rows and columns                | Unstructured/semi-structured storage. Document: JSON documents; Key-Value: key-value pairs; Wide-Column: tables with rows and dynamic columns; Graph: nodes and edges |
| History      | Developed in the 1970s, focusing on reducing data duplication              | Developed in the late 2000s, focusing on improving scalability and reducing storage costs for massive data                                |
| Examples     | Oracle, MySQL, Microsoft SQL Server, PostgreSQL                            | Document: MongoDB, CouchDB; Key-Value: Redis, DynamoDB; Wide-Column: Cassandra, HBase; Graph: Neo4j, Amazon Neptune, Giraph             |
| ACID Properties | Provides Atomicity, Consistency, Isolation, and Durability (ACID) properties | Typically does not support ACID transactions as a trade-off for scalability and high performance; a few (such as MongoDB) support it, though MongoDB's ACID transaction support differs from MySQL's |
| Performance  | Performance generally depends on the disk subsystem. To achieve optimal performance, queries, indexes, and table schemas usually need tuning | Performance is generally determined by the underlying hardware cluster size, network latency, and the calling application                |
| Scaling      | Vertical scaling (scaling up using more powerful servers), read/write splitting, database and table sharding | Horizontal scaling (scaling out by adding more servers, typically based on a sharding mechanism)                                        |
| Use Cases    | Data storage for general enterprise projects                               | Broad use cases: e.g., graph databases support analyzing and traversing relationships among connected data; key-value databases handle large-scale data expansion and extremely high rates of state changes |
| Query Syntax | Structured Query Language (SQL)                                            | Data access syntax varies depending on the database                                                                                     |

## What Are the Advantages of NoSQL Databases?

NoSQL databases are well suited for many modern applications—such as mobile, web, and gaming applications—that require flexible, scalable, high-performance, and feature-rich databases to deliver an exceptional user experience.

- **Flexibility:** NoSQL databases typically provide a flexible schema, enabling faster and more iterative development. Flexible data models make NoSQL databases ideal for semi-structured and unstructured data.
- **Scalability:** NoSQL databases are generally designed to scale out horizontally using distributed hardware clusters rather than scaling up vertically by adding expensive, high-powered servers.
- **High Performance:** NoSQL databases are optimized for specific data models and access patterns, which achieves higher performance compared to trying to accomplish similar functionality with a relational database.
- **Powerful Functionality:** NoSQL databases provide rich APIs and data types purpose-built for their respective data models.

## What Types of NoSQL Databases Exist?

NoSQL databases can mainly be divided into the following four types:

- **Key-Value:** Key-value databases are a relatively simple type of database in which each item contains a key and a value. This is an extremely flexible type of NoSQL database because the application has complete control over what is stored in the value field without restrictions. Redis and DynamoDB are two very popular key-value databases.
- **Document:** In document databases, data is stored in documents similar to JSON (JavaScript Object Notation) objects, which is very clear and intuitive. Each document contains pairs of fields and values. These values can generally be of various types—including strings, numbers, booleans, arrays, or objects—and their structure usually aligns closely with the objects developers use in code. MongoDB is a very popular document database.
- **Graph:** Graph databases are designed to make it easy to build and run applications that work with highly connected datasets. Typical use cases for graph databases include social networks, recommendation engines, fraud detection, and knowledge graphs. Neo4j and Giraph are two very popular graph databases.
- **Wide-Column:** Wide-column store databases are ideal for storing massive amounts of data. Cassandra and HBase are two very popular wide-column store databases.

The image below is sourced from [Microsoft Official Documentation | Relational data vs. NoSQL data](https://learn.microsoft.com/en-us/dotnet/architecture/cloud-native/relational-vs-nosql-data).

![NoSQL Data Models](/media/jg/ext/oss.javaguide.cn/javaguide/database/mongodb/types-of-nosql-datastores-acd3ac86.png)

## References

- What Is NoSQL? - MongoDB Official Documentation: <https://www.mongodb.com/zh-cn/nosql-explained>
- What Is NoSQL? - AWS: <https://aws.amazon.com/cn/nosql/>
- NoSQL vs. SQL Databases - MongoDB Official Documentation: <https://www.mongodb.com/zh-cn/nosql-explained/nosql-vs-sql>
