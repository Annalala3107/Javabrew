---
title: "Database Knowledge Base: SQL, MySQL, Redis, MongoDB, and Elasticsearch"
description: "Database interview and knowledge-system learning roadmap covering SQL, MySQL indexes, transactions, logs, MVCC, execution plans, Redis caching, MongoDB, and Elasticsearch."
category: Databases
tag:
  - Databases
  - MySQL
  - Redis
sitemap:
  changefreq: weekly
  priority: 0.95
head:
  - - meta
    - name: keywords
      content: Database,Database Interview Questions,SQL,MySQL,Redis,MongoDB,Elasticsearch,MySQL Index,MySQL Transaction,MySQL Logs,MVCC,Redis Cache,Redis Persistence,Redis Cluster,Backend Interview
lang: en
sourceRef: zh-ref/database/README.md
---


This **Database Knowledge Base** is designed for backend learning, engineering practice, and interview preparation. It organizes all database-related articles on this site in the progression: "Database Fundamentals -> SQL -> MySQL -> Redis -> NoSQL & Search."

If you are short on time, it is recommended to start with [Common Database Fundamentals Interview Questions Summary](./basis.md), [SQL Syntax Fundamentals Summary](./sql/sql-syntax-summary.md), [Common MySQL Interview Questions Summary](./mysql/mysql-questions-01.md), and [Common Redis Interview Questions Summary (Part 1)](./redis/redis-questions-01.md) to quickly build a checklist of high-frequency topics.

## Who Is This For

- Backend developers systematically studying database fundamentals, SQL, MySQL, and Redis.
- Candidates preparing for campus recruiting, experienced-hire roles, or backend interviews at mid-to-large tech companies.
- Engineers who want to strengthen their grasp of indexes, transactions, logs, execution plans, cache consistency, Redis persistence, and clustering.
- Readers who have already written business CRUD code, but are not yet familiar with database internals, performance optimization, and NoSQL selection.

## Learning Focus

- What problems are relational databases and NoSQL databases each best suited to solve, and where are the common selection boundaries?
- How should you master SQL querying, aggregation, joins, subqueries, and transaction semantics?
- How do MySQL indexes, transaction isolation, MVCC, the three major logs, and execution plans connect into one cohesive storyline?
- Why is Redis fast, and how should you understand its common data structures, caching strategies, persistence, blocking issues, and clustering mechanisms?
- What points about NoSQL/search systems like MongoDB and Elasticsearch are commonly tested in backend interviews and engineering selection?

## Recommended Reading Order

1. [Common Database Fundamentals Interview Questions Summary](./basis.md) and [Common NoSQL Fundamentals Interview Questions Summary](./nosql.md): First understand database classifications, transactions, normal forms, NoSQL types, and typical application scenarios.
2. [SQL Syntax Fundamentals Summary](./sql/sql-syntax-summary.md): Build solid SQL fundamentals across querying, filtering, sorting, aggregation, joins, subqueries, inserts, updates, and deletes.
3. [MySQL Topic](./mysql/): Focus on learning indexes, transaction isolation, MVCC, the three major logs, query execution flow, and execution plans.
4. [Redis Topic](./redis/): Focus on learning cache fundamentals, data structures, cache read/write strategies, persistence, blocking issues, memory fragmentation, and clustering.
5. [MongoDB Topic](./mongodb/): Supplement with document database knowledge according to role requirements.

## Core Articles

### Database Fundamentals & SQL

This section is ideal for establishing foundational database understanding, focusing on database types, transaction semantics, character sets, SQL basics, and common query questions.

- [Common Database Fundamentals Interview Questions Summary](./basis.md): Organizes fundamental database concepts, transaction properties, concurrency control, normal forms, and common interview questions.
- [Common NoSQL Fundamentals Interview Questions Summary](./nosql.md): Understand key-value, document, column-family, and graph NoSQL database types and their applicable scenarios.
- [Character Sets Explained: What Is a Character Set and How to Use It?](./character-set.md): Understand character sets, encoding, causes of garbled text, and MySQL character set configuration.
- [SQL Topic](./sql/): Covers everything from SQL syntax fundamentals to common SQL interview questions.
- [SQL Syntax Fundamentals Summary](./sql/sql-syntax-summary.md): Covers querying, filtering, sorting, aggregation, grouping, joins, subqueries, and data modification.

### MySQL

MySQL is one of the most central relational database topics in backend development. When studying, it is recommended to connect "Indexes -> Execution Plans -> Transactions -> MVCC -> Logs -> Performance Optimization."

- [MySQL Topic](./mysql/): Connects MySQL indexes, transactions, MVCC, logs, execution plans, and performance optimization.
- [Common MySQL Interview Questions Summary](./mysql/mysql-questions-01.md): Quickly build a high-frequency MySQL question checklist.
- [MySQL Indexes Explained](./mysql/mysql-index.md): Understand index data structures, the leftmost prefix rule, covering indexes, table lookups (back-to-table), and index design principles.
- [MySQL Transaction Isolation Levels Explained](./mysql/transaction-isolation-level.md): Understand dirty reads, non-repeatable reads, phantom reads, and trade-offs between different isolation levels.
- [InnoDB Storage Engine Implementation of MVCC](./mysql/innodb-implementation-of-mvcc.md): Understand Read View, hidden columns, undo logs, and snapshot reads.
- [The Three Major MySQL Logs Explained](./mysql/mysql-logs.md): Understand the roles and relationships of binlog, redo log, and undo log.
- [Syncing MySQL Data to Elasticsearch Explained](./mysql/mysql-to-elasticsearch-sync.md): Compare application-layer dual writes, scheduled sync, Canal, Debezium, and Flink CDC to understand full sync, incremental sync, and data consistency issues.
- [MySQL Execution Plan Analysis](./mysql/mysql-query-execution-plan.md): Master common `EXPLAIN` fields and the entry point for analyzing slow SQL queries.

### Redis

Redis is both a cache and a high-frequency middleware interview topic. When studying, do not merely memorize commands—understand caching strategies, data structures, persistence, causes of blocking, and clustering mechanisms.

- [Redis Topic](./redis/): Covers caching, data structures, persistence, clustering, blocking issues, and engineering practices.
- [Common Cache Fundamentals Interview Questions Summary](./redis/cache-basics.md): Understand cache usage scenarios, cache penetration, cache breakdown, cache avalanche, and consistency issues.
- [Common Redis Interview Questions Summary (Part 1)](./redis/redis-questions-01.md) and [Common Redis Interview Questions Summary (Part 2)](./redis/redis-questions-02.md): Quickly build a high-frequency Redis question checklist.
- [The 5 Basic Redis Data Types Explained](./redis/redis-data-structures-01.md): Understand the application scenarios of String, List, Hash, Set, and Sorted Set.
- [Redis Persistence Mechanisms Explained](./redis/redis-persistence.md): Understand RDB, AOF, AOF rewriting, and hybrid persistence.

### NoSQL & Search

This section is suitable for supplementing your knowledge after mastering relational databases and caching, helping you understand the selection boundaries of document databases and non-relational storage.

- [MongoDB Topic](./mongodb/): Organizes the MongoDB document model, indexes, replica sets, sharding, transactions, and common interview questions.
- [Common MongoDB Interview Questions Summary (Part 1)](./mongodb/mongodb-questions-01.md) and [Common MongoDB Interview Questions Summary (Part 2)](./mongodb/mongodb-questions-02.md): Understand MongoDB core concepts and engineering practices.

## High-Frequency Questions

- What are the differences between relational databases and NoSQL? What scenarios is each suited for?
- What is database transaction ACID? What problems do the different isolation levels solve?
- How should you understand the execution order of `WHERE`, `GROUP BY`, `HAVING`, and `ORDER BY` in SQL?
- Why can MySQL indexes speed up queries? Under what circumstances do indexes become invalidated?
- How does InnoDB achieve non-locking consistent reads through MVCC?
- What problems do `binlog`, `redo log`, and `undo log` each solve?
- How do you analyze a SQL execution plan using `EXPLAIN`?
- Why is Redis fast? How do you handle cache penetration, cache breakdown, and cache avalanche?
- What problems do Redis persistence, master-replica replication, Sentinel, and Cluster each solve?
- What business scenarios are MongoDB and Elasticsearch each suitable for?

## Related Topics

- [High-Performance Systems Knowledge Base](../high-performance/)
- [High-Availability Systems Knowledge Base](../high-availability/)
- [Distributed Systems Knowledge Base](../distributed-system/)
- [System Design](../system-design/)
