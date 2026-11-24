---
title: MySQL Common Interview Questions Summary
description: "High-frequency MySQL interview questions explained: basic architecture, InnoDB engine, index internals, B+ Tree, transaction ACID properties, MVCC, redo/undo/binlog logs, row/table locks, and slow query optimization — master the must-know topics for top tech interviews in one guide!"
category: Database
tag:
  - MySQL
  - Tech Interviews
head:
  - - meta
    - name: keywords
      content: MySQL interview questions,MySQL basic architecture,InnoDB storage engine,MySQL indexes,B+ Tree index,transaction isolation levels,redo log,undo log,binlog,MVCC,row-level locks,slow query optimization
lang: en
sourceRef: zh-ref/database/mysql/mysql-questions-01.md
---

## MySQL Basics

### What Is a Relational Database?

As the name suggests, a Relational Database (RDB) is a database built upon the relational model. The relational model defines the relationships among the data stored in the database (one-to-one, one-to-many, many-to-many).

In a relational database, our data is stored in various tables (such as a user table), where each row in a table stores a single record (such as information for one user).

![Relational database table relationships](/media/jg/ext/oss.javaguide.cn/java-guide-blog/5e3c1a71724a38245aa43b02_99bf70d46cc247be878de9d-25cda5c4.png)

Most relational databases use SQL to manipulate data stored in the database. Moreover, most relational databases support the four transaction properties (ACID).

**What are some common relational databases?**

MySQL, PostgreSQL, Oracle, SQL Server, SQLite (for example, WeChat stores local chat history using SQLite) ...

### What Is SQL?

SQL stands for Structured Query Language, a language designed specifically for interacting with databases, aiming to provide a simple and effective way to read and write data in a database.

Almost all mainstream relational databases support SQL, giving it very broad applicability. In addition, some non-relational databases are also compatible with SQL or use SQL-like query languages.

SQL helps us:

- Create databases, tables, and columns;
- Insert, delete, update, and query data in a database;
- Create views, functions, and stored procedures;
- Perform simple data analysis on data stored in a database;
- Work with Hive and Spark SQL for big data processing;
- Work with SQLFlow for machine learning;
- ...

### What Is MySQL?

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/20210327143351823-6c1ddf24.png)

**MySQL is a relational database primarily used to persist data in our systems, such as user information.**

Because MySQL is open-source, free, and mature, it is widely used across various systems. Anyone can download it under the GPL (General Public License) and modify it to fit their custom needs. MySQL's default port number is **3306**.

### ⭐️What Are the Advantages of MySQL?

This question essentially asks why MySQL is so popular.

MySQL's success can be attributed to its combined strengths across three dimensions: **ecosystem, features, and operations**.

**First, from an ecosystem and cost perspective, its moat is very deep.**

- **Open-source and free:** This is the foundation of its widespread adoption. Any company or individual can use it for free, greatly lowering the technical barrier and initial cost.
- **Large community and mature ecosystem:** After decades of development, MySQL has an extremely active community and a rich ecosystem. That means no matter what issue you encounter, you can almost always find a solution online. At the same time, all mainstream programming languages, frameworks, ORM tools, and monitoring systems provide seamless support for MySQL. Its documentation is also very thorough, making learning resources readily available.

**Second, from a core technical capability standpoint, it is powerful and well-balanced.**

- **Strong transaction support:** This is its core value as a relational database. Notably, InnoDB's default Repeatable Read (`REPEATABLE-READ`) isolation level largely avoids phantom reads through MVCC and Next-Key Lock mechanisms—something many other databases require a higher isolation level to achieve—balancing performance and consistency. For a detailed explanation, see my article: [Detailed Explanation of MySQL Transaction Isolation Levels](https://javaguide.cn/database/mysql/transaction-isolation-level.html).
- **Excellent performance and scalability:** MySQL has been battle-tested by massive internet workloads and delivers strong single-node performance. More importantly, a mature set of horizontal scaling architectures has formed around it, such as primary-replica replication, read-write splitting, and database/table sharding via middleware. This enables it to support businesses ranging from startups to large internet platforms.

**Third, from an operations and usability perspective, it is very "approachable."**

- **Out-of-the-box and easy to get started:** Compared to large commercial databases like Oracle, MySQL's installation, configuration, and daily usage are very simple and intuitive, with a gentle learning curve that is friendly to developers and junior DBAs.
- **Low maintenance cost:** Thanks to its simplicity and massive community, finding experienced operations engineers and troubleshooting solutions is relatively easy, keeping overall maintenance costs lower.

It is worth mentioning that in recent years, PostgreSQL has gained huge momentum and has even overtaken MySQL in some areas. Many articles bashing and disparaging MySQL have appeared online. In my view, blindly attacking one side or overhyping the other is not a sound approach.

I also wrote an article sharing my thoughts on these two flagship relational databases; if you're interested, take a look: [Has MySQL Been Pushed Into Second Place? (in Chinese)](https://mp.weixin.qq.com/s/APWD-PzTcTqGUuibAw7GGw).

## MySQL Data Types

MySQL field types can be broadly divided into three main categories:

- **Numeric types**: Integer types (`TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, and `BIGINT`), floating-point types (`FLOAT` and `DOUBLE`), fixed-point type (`DECIMAL`), and bit-field data type (`BIT`).
- **String types**: `CHAR`, `VARCHAR`, `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT`, `BINARY`, `TINYBLOB`, `BLOB`, `MEDIUMBLOB`, `LONGBLOB`, etc.; the most commonly used are `CHAR` and `VARCHAR`.
- **Date and time types**: `YEAR`, `TIME`, `DATE`, `DATETIME`, `TIMESTAMP`, etc.

I didn't draw the diagram below and forgot where I saved it from, but it summarizes things quite well.

![Summary of common MySQL data types](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/summary-of-mysql-field-types-2a225bc2.png)

There are many MySQL field types, so here I will pick the ones used frequently in daily development and commonly asked in interviews, and explain them in an interview Q&A format. Unless otherwise specified, all details refer to the InnoDB storage engine.

Also, I recommend reading Chapter 4 of *High Performance MySQL (3rd Edition)*, which covers MySQL data type optimization in detail.

### ⭐️What Is the Purpose of the UNSIGNED Attribute on Integer Types?

Integer types in MySQL can use the optional `UNSIGNED` attribute to represent unsigned integers that do not allow negative values. Using `UNSIGNED` doubles the upper bound of positive integers because no space needs to be reserved for negative values.

For example, the range of `TINYINT UNSIGNED` is `0 ~ 255`, whereas the range of ordinary `TINYINT` is `-128 ~ 127`. The range of `INT UNSIGNED` is `0 ~ 4,294,967,295`, whereas ordinary `INT` is `-2,147,483,648 ~ 2,147,483,647`.

For auto-incrementing ID columns starting from 0, `UNSIGNED` is very suitable because negative values are disallowed and you get a larger upper range, providing more available ID values.

### What Is the Difference Between CHAR and VARCHAR?

`CHAR` and `VARCHAR` are the two most commonly used string types. Their main difference is: **`CHAR` is a fixed-length string, while `VARCHAR` is a variable-length string.**

When storing values, `CHAR` pads spaces on the right to reach the specified length and strips trailing spaces upon retrieval; `VARCHAR` uses 1 or 2 extra bytes during storage to record the string's length and needs no trimming on retrieval.

`CHAR` is better suited for storing strings that are short or roughly uniform in length, such as passwords hashed by Bcrypt or MD5, or national ID numbers. `VARCHAR` is suitable for strings with uncertain or widely varying lengths, such as user nicknames and article titles.

In both `CHAR(M)` and `VARCHAR(M)`, `M` represents the maximum number of characters that can be stored—whether a letter, digit, or Chinese character, each counts as a single character.

### What Is the Difference Between VARCHAR(100) and VARCHAR(10)?

Both `VARCHAR(100)` and `VARCHAR(10)` are variable-length types, meaning they can store at most 100 characters and 10 characters, respectively. Therefore, `VARCHAR(100)` accommodates a larger range of character lengths and offers better business extensibility, whereas storing more than 10 characters in `VARCHAR(10)` requires altering the table schema.

Although `VARCHAR(100)` and `VARCHAR(10)` allow different maximum character lengths, storing the exact same string in both takes up the same amount of disk storage space—a point many people misunderstand.

However, `VARCHAR(100)` consumes more memory. That is because when operating on `VARCHAR` values in memory, MySQL typically allocates a fixed-size memory block using the defined column length to hold the value. For example, during sorting, `VARCHAR(100)` allocates according to length 100, thereby consuming more memory.

### What Is the Difference Between DECIMAL and FLOAT/DOUBLE?

The difference between `DECIMAL` and `FLOAT` is: **`DECIMAL` is a fixed-point number, while `FLOAT`/`DOUBLE` are floating-point numbers. `DECIMAL` can store exact decimal values, whereas `FLOAT`/`DOUBLE` can only store approximate decimal values.**

`DECIMAL` is used to store decimals with precision requirements, such as currency-related data, avoiding precision loss caused by floating-point representation.

In Java, MySQL's `DECIMAL` type maps to the Java class `java.math.BigDecimal`.

### Why Are TEXT and BLOB Not Recommended?

The `TEXT` type is similar to `CHAR` (0–255 bytes) and `VARCHAR` (0–65,535 bytes), but can store longer strings—that is, long text data such as blog post content.

| Type       | Storage Capacity     | Use Case               |
| ---------- | -------------------- | ---------------------- |
| TINYTEXT   | 0–255 bytes          | General text strings   |
| TEXT       | 0–65,535 bytes       | Long text strings      |
| MEDIUMTEXT | 0–16,772,150 bytes   | Larger text data       |
| LONGTEXT   | 0–4,294,967,295 bytes| Extremely large text   |

The `BLOB` type is mainly used to store Binary Large Objects, such as images, audio, and video files.

| Type       | Storage Capacity | Use Case                         |
| ---------- | ---------------- | -------------------------------- |
| TINYBLOB   | 0–255 bytes      | Short binary strings             |
| BLOB       | 0–65 KB          | Binary strings                   |
| MEDIUMBLOB | 0–16 MB          | Long text data in binary form    |
| LONGBLOB   | 0–4 GB           | Extremely large data in binary form |

In daily development, `TEXT` is rarely used (only occasionally), and `BLOB` is almost never used. If the expected length range can be satisfied by `VARCHAR`, it is recommended to avoid `TEXT`.

Database coding guidelines generally advise against using `BLOB` and `TEXT` types because they come with several drawbacks and limitations, such as:

- They cannot have default values.
- When temporary tables are needed, in-memory temporary tables cannot be used; temporary tables must be created on disk (as mentioned in *High Performance MySQL*).
- Retrieval efficiency is relatively low.
- Indexes cannot be created directly on the full column; a prefix length must be specified.
- They may consume large amounts of network and I/O bandwidth.
- They may slow down DML operations on the table.
- ...

### ⭐️What Is the Difference Between DATETIME and TIMESTAMP? How Should You Choose?

`DATETIME` has no time zone information, whereas `TIMESTAMP` is time-zone-aware.

`TIMESTAMP` only requires 4 bytes of storage space, whereas `DATETIME` consumes 8 bytes. However, this also introduces a limitation: `TIMESTAMP` covers a much smaller time range.

- `DATETIME`: `'1000-01-01 00:00:00.000000'` to `'9999-12-31 23:59:59.999999'`
- `TIMESTAMP`: `'1970-01-01 00:00:01.000000'` UTC to `'2038-01-19 03:14:07.999999'` UTC

The core advantage of `TIMESTAMP` lies in its built-in time zone handling. The database handles UTC storage and automatic conversion based on the session time zone, simplifying development for applications that operate across multiple time zones. If your application needs to handle multiple time zones or wants the database to automatically manage time zone conversions, `TIMESTAMP` is the natural choice (while keeping its time range limit—the Year 2038 problem—in mind).

If your scenario does not involve time zone conversion, or you prefer the application layer to fully control time zone logic and need to represent dates beyond 2038, `DATETIME` is the safer choice.

For a detailed comparison between the two and recommendations on storing date/time values, please refer to my article: [Recommendations for Storing Time Data Types in MySQL](./some-thoughts-on-database-storage-time.md).

### What Is the Difference Between NULL and ''?

`NULL` and `''` (empty string) are two completely different values; they carry different meanings and exhibit different behaviors in a database. `NULL` represents missing or unknown data, whereas `''` represents a known, existing empty string. Their main differences are as follows:

1. **Meaning**:
   - `NULL` represents an indeterminate value that does not equal any value, including itself. Therefore, `SELECT NULL = NULL` evaluates to `NULL`, not `true` or `false`. `NULL` means missing or unknown information. Although `NULL` does not equal any value, in certain operations database systems group `NULL` values into the same bucket—for example, in `DISTINCT`, `GROUP BY`, and `ORDER BY`. Note that grouping `NULL` values together in these operations does not mean `NULL` values are equal to one another; they are simply handled specially in specific operations to ensure correctness and consistency of results. This facilitates data operations without changing the semantics of `NULL`.
   - `''` represents an empty string, which is a known value.
2. **Storage Space**:
   - The storage overhead of `NULL` depends on the database implementation and typically requires space (e.g., a null bitmap flag) to mark the value as null.
   - The storage overhead of `''` is usually small, as it only stores the marker/length for an empty string and no actual characters.
3. **Comparison Operations**:
   - Comparing any value with `NULL` (e.g., `=`, `!=`, `>`, `<`) yields `NULL`, indicating an unknown result. To test whether a value is `NULL`, you must use `IS NULL` or `IS NOT NULL`.
   - `''` can be compared like any other string. For example, `'' = ''` evaluates to `true`.
4. **Aggregate Functions**:
   - Most aggregate functions (such as `SUM`, `AVG`, `MIN`, `MAX`) ignore `NULL` values.
   - `COUNT(*)` counts all rows, including rows containing `NULL` values. `COUNT(column_name)` counts the number of non-`NULL` rows in the specified column.
   - The empty string `''` is included in aggregate function calculations. For example, `SUM` treats it as 0 (upon numeric conversion), and `MIN` and `MAX` treat it as an empty string.

After reading the explanation above, you now also have the answer to another frequent interview question: "Why does MySQL discourage using `NULL` as a column default value?"

### ⭐️How Is the Boolean Type Represented?

MySQL does not have a dedicated boolean data type; `BOOL` and `BOOLEAN` are synonyms for `TINYINT(1)`, where `0` typically represents `false` and non-zero values represent `true`. `BIT(1)` is a bit-field type that can also store `0` or `1`, but it is not the actual underlying mapping for `BOOL`/`BOOLEAN`.

### ⭐️Should Phone Numbers Be Stored as INT or VARCHAR?

For storing mobile phone numbers, **`VARCHAR` is strongly recommended** over `INT` or `BIGINT`. The main reasons are as follows:

1. **Format Compatibility and Integrity:**
   - Phone numbers may contain leading zeros (such as landline area codes in certain regions), country code prefixes (`'+'`), or even delimiters (`'-'` or spaces). Numeric types like `INT` or `BIGINT` automatically discard such critical formatting details (e.g., leading zeros are stripped, and `'+'` and `'-'` cannot be stored).
   - `VARCHAR` preserves all formats verbatim, cleanly accommodating both 11-digit domestic mobile numbers and international numbers with country codes.
2. **Non-Arithmetic Nature:** Although phone numbers look like digits, we never perform mathematical operations on them (such as summing or averaging). Essentially, a phone number is an identifier, much more like a string. Using `VARCHAR` better reflects the nature of the data.
3. **Query Flexibility:**
   - Business requirements frequently involve querying by number prefix (segment), such as finding all users whose phone numbers start with `"138"`. With `VARCHAR`, a query like `LIKE '138%'` is both intuitive and efficient.
   - If numeric types are used, similar prefix matching requires cumbersome function conversions (such as `CAST` or `SUBSTRING`) or range queries (such as `WHERE phone >= 13800000000 AND phone < 13900000000`), which are verbose and may fail to use indexes effectively, degrading performance.
4. **Encrypted Storage Requirements (Crucial):**
   - For data security and privacy compliance, sensitive personal information like phone numbers must usually be stored encrypted in the database.
   - Encrypted data (ciphertext) is a long string (often containing letters, digits, symbols, or Base64/Hex encoding) that `INT` or `BIGINT` simply cannot store. Only types like `VARCHAR`, `TEXT`, or `BLOB` can hold it.

**Choosing the `VARCHAR` Length:**

- **If stored unencrypted (strongly discouraged!):** Considering international numbers and possible formatting characters, `VARCHAR(20)` to `VARCHAR(32)` is generally a safe range, sufficient for virtually all global phone number formats. `VARCHAR(15)` may be insufficient for certain numbers with country codes and separators.
- **If stored encrypted (the recommended standard practice):** The length must be calculated precisely based on the maximum ciphertext length produced by the chosen encryption algorithm and any encoding scheme (e.g., Base64 increases length by about 1/3). A longer `VARCHAR` is usually needed, such as `VARCHAR(128)`, `VARCHAR(256)`, or even longer.

Finally, here is a summary table:

| Comparison Dimension     | `VARCHAR` Type (Recommended)                  | `INT`/`BIGINT` Type (Not Recommended)             | Notes / Remarks                                                                             |
| ------------------------ | --------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Format Compatibility** | ✔ Can store leading zeros, `"+"`, `"-"`, spaces, etc. | ✘ Automatically drops leading zeros; cannot store symbols | `VARCHAR` stores various phone formats verbatim; `INT`/`BIGINT` only hold plain digits and lose leading zeros |
| **Data Integrity**       | ✔ Loses no format information                 | ✘ Loses format information                        | E.g., `"013800012345"` stored in `INT` becomes `13800012345`, and `"+"` cannot be stored     |
| **Non-Arithmetic**       | ✔ Suitable for storing "identifiers"          | ✘ Only suited for numerical calculations          | Phone numbers are essentially string identifiers without math operations; `VARCHAR` fits best |
| **Query Flexibility**    | ✔ Supports `LIKE '138%'`, etc.                | ✘ Prefix queries are awkward or slow              | `VARCHAR` enables efficient prefix/segment queries; numeric types need string casts or complex logic |
| **Encrypted Storage**    | ✔ Can store ciphertext (letters, symbols, etc.) | ✘ Cannot store ciphertext                       | Encrypted phone ciphertext is string/binary data; only `VARCHAR`, `TEXT`, `BLOB`, etc. support it |
| **Length Recommendation**| 15–20 (unencrypted); depends on algorithm if encrypted | Meaningless                               | `VARCHAR(15–20)` is common when unencrypted; encrypted length depends on algorithm and encoding |

## MySQL Basic Architecture

> It is recommended to read this alongside [How a SQL Statement Is Executed in MySQL](./how-sql-executed-in-mysql.md) to better understand MySQL's basic architecture. Moreover, "the execution flow of a SQL statement in MySQL" is a very common interview question.

Below is a simplified architecture diagram of MySQL, from which you can clearly see how a client's SQL statement is executed inside MySQL.

![](/media/jg/ext/oss.javaguide.cn/javaguide/13526879-3037b144ed09eb88-5b872a4e.png)

As shown in the diagram, MySQL consists primarily of the following components:

- **Connector:** Handles authentication and permission checks (when logging into MySQL).
- **Query Cache:** Checks the cache first when executing a `SELECT` query (removed in MySQL 8.0 because this feature was not very practical).
- **Analyzer:** On a cache miss, the SQL statement passes through the Analyzer. Simply put, the Analyzer determines what your SQL statement intends to do and verifies that its syntax is valid.
- **Optimizer:** Chooses the execution plan that MySQL considers optimal.
- **Executor:** Executes the statement and returns data from the storage engine. Before execution, it checks whether the user has the required permissions; if not, an error is thrown.
- **Pluggable Storage Engines:** Responsible for storing and retrieving data using a pluggable architecture supporting InnoDB, MyISAM, Memory, and other storage engines. InnoDB is MySQL's default storage engine and is the best choice for the vast majority of use cases.

## MySQL Storage Engines

Storage engines are at the core of MySQL. To master MySQL in depth, you must thoroughly study its storage engines.

### Which Storage Engines Does MySQL Support? Which One Is Default?

MySQL supports multiple storage engines. You can inspect all supported storage engines using the `SHOW ENGINES` command.

![Viewing all storage engines provided by MySQL](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/image-20220510105408703-1ff77737.png)

From the output above, we can see that MySQL's current default storage engine is InnoDB. Moreover, among all storage engines, only InnoDB is a transactional storage engine—meaning only InnoDB supports transactions.

The MySQL version used here is 8.x; details may vary across different MySQL versions.

Prior to MySQL 5.5.5, MyISAM was the default storage engine. Starting from MySQL 5.5.5, InnoDB became the default storage engine.

You can check your MySQL version using `SELECT VERSION()`:

```bash
mysql> SELECT VERSION();
+-----------+
| VERSION() |
+-----------+
| 8.0.27    |
+-----------+
1 row in set (0.00 sec)
```

You can also view the current default storage engine directly via `SHOW VARIABLES LIKE '%storage_engine%'`:

```bash
mysql> SHOW VARIABLES  LIKE '%storage_engine%';
+---------------------------------+-----------+
| Variable_name                   | Value     |
+---------------------------------+-----------+
| default_storage_engine          | InnoDB    |
| default_tmp_storage_engine      | InnoDB    |
| disabled_storage_engines        |           |
| internal_tmp_mem_storage_engine | TempTable |
+---------------------------------+-----------+
4 rows in set (0.00 sec)
```

If you want a deeper understanding of each storage engine and how they differ, check the official MySQL documentation (interviews won't drill this deep; a general awareness suffices):

- InnoDB Storage Engine: <https://dev.mysql.com/doc/refman/8.0/en/innodb-storage-engine.html>
- Alternative Storage Engines: <https://dev.mysql.com/doc/refman/8.0/en/storage-engines.html>

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/image-20220510155143458-5ec93a89.png)

### Do You Know MySQL's Storage Engine Architecture?

MySQL storage engines use a **pluggable architecture**, supporting multiple storage engines; we can even assign different storage engines to different tables within the same database to suit different workload needs. **Storage engines operate at the table level, not the database level.**

The diagram below illustrates the MySQL architecture with pluggable storage engines:

![MySQL architecture diagram showing connectors, interfaces, pluggable storage engines, the file system with files and logs.](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/mysql-architecture-a9cf127e.png)

You can also write your own storage engine by implementing the standard storage engine interfaces defined by MySQL. Unofficial engines are called third-party storage engines, as opposed to official built-in engines. In fact, InnoDB itself started out as a third-party storage engine and was later acquired outright by Oracle because it was so outstanding.

The official MySQL documentation also explains how to write a custom storage engine: <https://dev.mysql.com/doc/internals/en/custom-engine.html>.

### ⭐️What Are the Differences Between MyISAM and InnoDB?

Before MySQL 5.5, the MyISAM engine was MySQL's default storage engine and enjoyed widespread popularity.

Although MyISAM had decent performance and useful features (such as full-text indexing, compression, and spatial functions), it does not support transactions or row-level locking, and its biggest flaw is that it cannot safely recover after a crash.

Since MySQL 5.5, InnoDB has been the default storage engine.

Back to the topic! Let's compare the two across key dimensions:

**1. Support for Row-Level Locking**

MyISAM only supports table-level locking, whereas InnoDB supports both row-level locking and table-level locking, with row-level locking as the default.

That means MyISAM locks the entire table on every write, which is terrible under concurrent writes! That's why InnoDB delivers far better performance for concurrent write workloads.

**2. Support for Transactions**

MyISAM does not provide transaction support.

InnoDB provides transaction support, implements the four isolation levels defined by the SQL standard, and supports committing (`COMMIT`) and rolling back (`ROLLBACK`) transactions. Moreover, InnoDB's default `REPEATABLE-READ` isolation level prevents phantom reads (via MVCC and Next-Key Locks).

For more on MySQL transactions, read my article: [Detailed Explanation of MySQL Transaction Isolation Levels](./transaction-isolation-level.md).

**3. Support for Foreign Keys**

MyISAM does not support foreign keys, whereas InnoDB does.

Foreign keys are very helpful for maintaining data consistency, but they incur performance overhead. Therefore, in real-world production projects, we generally advise against using foreign keys at the database level and instead enforce constraints in business logic code!

Alibaba's *Java Development Manual* also explicitly prohibits using foreign keys.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/image-20220510090309427-64be0036.png)

However, enforcing constraints in application code places higher demands on developers' discipline and skill, so whether to use foreign keys should still be decided based on your project's actual situation.

Summary: Generally, using foreign keys at the database layer is not recommended since constraints can be handled in the application layer, though this puts data consistency at risk if mishandled. Ultimately, decide based on your project's requirements.

**4. Crash Recovery Support**

MyISAM does not support safe crash recovery, whereas InnoDB does.

An InnoDB database guarantees recovery to its pre-crash consistent state upon restart after an unexpected crash. This recovery process relies on the `redo log`.

**5. Support for MVCC**

MyISAM does not support MVCC, whereas InnoDB does.

Honestly, this point almost goes without saying—MyISAM doesn't even support row-level locks. MVCC can be viewed as an enhancement over row-level locking that effectively reduces locking overhead and improves performance.

**6. Different Index Implementations**

Although both MyISAM and InnoDB use B+ Trees as their index data structure, their implementations differ significantly.

In InnoDB, the data file itself is the index file (clustered index). In contrast, in MyISAM, the index file and data file are separate; InnoDB's table data file is itself organized as a B+ Tree index structure where leaf nodes store the complete data rows in their `data` payload.

For detailed differences, see my article: [Detailed Explanation of MySQL Indexes](./mysql-index.md).

**7. Performance Differences**

InnoDB outperforms MyISAM significantly. In both mixed read-write and read-only workloads, InnoDB's throughput scales roughly linearly as CPU core count increases. Because MyISAM cannot run reads and writes concurrently, its throughput does not scale with CPU core count.

![InnoDB vs. MyISAM performance comparison](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/innodb-myisam-performance-comparison-c12f5364.png)

**8. Different Data Caching Strategies and Mechanisms**

InnoDB uses the **Buffer Pool** to cache both data pages and index pages, whereas MyISAM uses the **Key Cache** to cache only index pages, not data pages.

**Summary**:

- InnoDB supports row-level lock granularity, whereas MyISAM only supports table-level lock granularity.
- MyISAM does not support transactions; InnoDB supports transactions and implements the four SQL standard isolation levels.
- MyISAM does not support foreign keys; InnoDB supports them.
- MyISAM does not support MVCC; InnoDB supports it.
- Although both MyISAM and InnoDB use B+ Tree indexes, their underlying implementations differ.
- MyISAM does not support safe crash recovery; InnoDB supports it.
- InnoDB delivers much stronger overall performance than MyISAM.

Finally, here is a diagram comparing several common MySQL storage engines in detail.

![Comparison of common MySQL storage engines](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/comparison-of-common-mysql-storage-engines-5d055dea.png)

### How to Choose Between MyISAM and InnoDB?

Most of the time we use the InnoDB storage engine. In certain read-heavy scenarios, using MyISAM can also work—provided your project doesn't mind MyISAM's lack of transactions, crash recovery, and other drawbacks (though in practice we almost always do mind!).

*High Performance MySQL* puts it this way:

> Don't blindly trust rules of thumb like "MyISAM is faster than InnoDB"—that conclusion is rarely absolute. In many well-known scenarios, InnoDB leaves MyISAM far behind, especially when clustered indexes are used or when the working set fits into memory.

Therefore, for typical business systems we build every day, there is practically no reason to use MyISAM—just stick with the default InnoDB!

## ⭐️MySQL Indexes

There are many interview questions around MySQL indexes, and they are critically important. For a deeper dive, read my article: [Detailed Explanation of MySQL Indexes](./mysql-index.md).

### What Is an Index?

**An index is a data structure used for fast querying and retrieval of data; in essence, it can be viewed as a pre-sorted data structure.**

An index serves the same purpose as a book's table of contents. For example, when looking up a word in a dictionary without a directory, we have to flip through page by page, which is very slow; with a directory, we simply look up the word's page number first and jump straight to that page.

There are many underlying data structures for indexes, such as B-Trees, B+ Trees, Hash tables, and Red-Black Trees. In MySQL, both InnoDB and MyISAM use **B+ Trees** as their primary index structure.

**Advantages of Indexes:**

1. **Dramatically faster queries (primary goal):** With indexes, the database **greatly reduces the amount of data scanned**, locating matching records directly, significantly speeding up retrieval and reducing disk I/O operations.
2. **Enforce data uniqueness:** Creating a **Unique Index** guarantees that values in a column (or combination of columns) are unique across the table, such as user IDs or email addresses. A primary key itself is a type of unique index.
3. **Speed up sorting and grouping:** When `ORDER BY` or `GROUP BY` clauses operate on indexed columns, the database can often leverage the already-sorted nature of the index to avoid extra sorting steps, boosting performance.

**Disadvantages of Indexes:**

1. **Time-consuming to create and maintain:** Creating an index takes time, especially on large tables. More importantly, during **inserts, deletes, and updates (DML operations)**, not only must the data be modified, but all related indexes must also be dynamically updated and maintained, which **slows down DML execution**.
2. **Consume storage space:** An index is itself a data structure that must be persisted as physical structures on disk (and cached in memory), **occupying additional disk space**. The more indexes and the larger they are, the more space they consume.
3. **Risk of misuse or non-usage:** If indexes are poorly designed or queries are poorly written, the query optimizer may ignore the index (or pick the wrong index), actually hurting performance.

**So, does using an index always improve query performance?**

**Not necessarily.** In most cases, proper indexing is indeed much faster than a full table scan, but there are exceptions:

- **Table is too small:** If a table has very few rows (e.g., only a few hundred records), a full table scan may be faster than an index lookup because traversing the index has its own overhead.
- **Query returns a large percentage of the table:** If the matching rows make up a large fraction of the table (e.g., over 20%–30%), the optimizer may judge a sequential full table scan cheaper than performing many random I/O index lookups (table lookups / back-to-table operations).
- **Poorly maintained indexes or stale statistics:** These can cause the optimizer to make suboptimal plan choices.

### Why Are Indexes Fast?

The core reason indexes are fast is that they **dramatically reduce the number of disk I/Os**.

An index is essentially a **sorted data structure**—just like a book's index—so we don't have to flip through every single page (full table scan).

In MySQL, this data structure is the **B+ Tree**. The B+ Tree optimizes performance in two main ways:

1. A B+ Tree is "short and wide": for a table with tens of millions of rows, the tree height is typically only 3–4 levels. That means at most **3–4 disk I/Os** are needed to pinpoint the desired record, whereas a full table scan might require thousands or tens of thousands of I/Os—making indexed lookups blazingly fast.
2. The leaf nodes of a B+ Tree are **linked together in a linked list**. Once the starting point is located, MySQL can scan **sequentially** along the linked list, which is very disk-friendly and enables read-ahead prefetching.

### What Is the Underlying Data Structure of MySQL Indexes?

In MySQL, both the MyISAM and InnoDB engines use **B+ Trees** as their index structure. For detailed internals, see my article: [Detailed Explanation of MySQL Indexes](https://javaguide.cn/database/mysql/mysql-index.html).

### Why Didn't InnoDB Use Hash Tables as Its Index Data Structure?

> I've noticed that many candidates and even interviewers have a misconception here—assuming MySQL doesn't use hash or B-Tree structures under the hood at all.
>
> In reality, both the question and the answer must distinguish the storage engine. For example, the MEMORY storage engine supports both Hash and B-Tree indexes.

A hash index is backed by a hash table. Its advantage is that for **exact equality lookups**, the theoretical time complexity is **$O(1)$**, making lookups extremely fast—for example, `WHERE id = 123`.

However, it has several fatal drawbacks for general-purpose databases:

1. **No range query support:** This is the primary reason. A hash function maps adjacent input values (e.g., `id=100` and `id=101`) to completely unrelated positions in the hash table. Because ordering is destroyed, hash indexes cannot handle range queries like `WHERE age > 30` or `BETWEEN 100 AND 200`; for such queries, a hash index degrades to a full table scan.
2. **No sorting support:** Similarly, because hash values are unordered, hash indexes cannot be used to optimize `ORDER BY` clauses.
3. **No partial-key lookup on composite indexes:** For a composite index like `(col1, col2)`, a hash index hashes all indexed columns together and cannot accelerate queries filtering solely on `col1`.
4. **Hash collisions:** When different keys produce the same hash value, extra collision handling (chaining or open addressing) is required, which degrades performance.

Given that range queries and sorting are ubiquitous in database workloads, an index structure that cannot support them clearly cannot serve as the default general-purpose index type.

### Why Didn't InnoDB Use B-Trees Instead of B+ Trees?

Both B-Trees and B+ Trees are excellent multi-way balanced search trees well-suited for disk storage because they are "short and wide," maximizing the utility of every disk I/O.

However, a B+ Tree is an enhanced variant of a B-Tree with several critical optimizations for database workloads:

1. **Higher I/O efficiency:** In a B+ Tree, only leaf nodes store actual data (or data pointers), while non-leaf nodes store only index keys. Because non-leaf nodes hold no row payloads, each page can fit far more index keys. This gives the B+ Tree a higher **fan-out**; for the same dataset size, a B+ Tree is shorter than a B-Tree, requiring fewer disk I/Os per lookup.
2. **More stable query latency:** In a B+ Tree, every search must traverse from the root down to a leaf node, so path lengths are uniform. In a B-Tree, a search might terminate early at a non-leaf node if lucky or traverse all the way to a leaf if unlucky, making query performance less predictable.
3. **Far better range query performance:** This is the B+ Tree's signature advantage. All leaf nodes are connected via a doubly linked list. When executing a range query (such as `WHERE id > 100`), the engine simply traverses the tree to the leaf node for `id=100` and then scans sequentially along the leaf-node linked list without backtracking up the tree. This drastically accelerates range scans.

### What Is a Covering Index?

If an index contains (or "covers") the values of all columns needed by a query, it is called a **Covering Index**.

In the InnoDB storage engine, the leaf nodes of secondary (non-primary) indexes store the primary key value. This means that when querying via a secondary index, the database first locates the corresponding primary key value and then traverses the primary key (clustered) index to retrieve the complete row data. This second lookup is called a **table lookup** (or *bookmark lookup* / *back-to-table*).

**A covering index means that all columns requested by the query happen to exist in the index itself, so data can be returned directly from the index without performing an extra lookup back to the clustered index.**

### Explain MySQL Composite Indexes and the Leftmost Prefix Rule

An index created on multiple columns of a table is called a **Composite Index** (also known as a **Joint Index** or **Compound Index**).

Creating a composite index on `score` and `name`:

```sql
ALTER TABLE `cus_order` ADD INDEX id_score_name(score, name);
```

The **Leftmost Prefix Matching Rule** means that when using a composite index, MySQL matches query predicates against the index columns sequentially from left to right. If the query predicates match the leftmost column(s) of the index, MySQL can use the index to filter data, improving query efficiency.

The leftmost match continues rightward until it encounters a range condition (such as `>` or `<`). Note that for `>=`, `<=`, `BETWEEN`, and prefix-matching `LIKE`, matching does **not** necessarily stop immediately (related reading: [A Common Misconception About the Leftmost Prefix Rule of Composite Indexes (in Chinese)](https://mp.weixin.qq.com/s/8qemhRg5MgXs1So5YCv0fQ)).

Suppose you have a composite index `(column1, column2, column3)`. Its prefixes from left to right are `(column1)`, `(column1, column2)`, and `(column1, column2, column3)` (creating 1 composite index is effectively like having 3 indexes). Queries using these leftmost prefixes can utilize the index instead of doing a full table scan.

When designing a composite index, place columns with higher selectivity (cardinality) on the far left so they filter out more rows early.

Let's briefly demonstrate the leftmost prefix matching behavior:

1. Create a table named `student` with three columns: `id`, `name`, and `class`.

```sql
CREATE TABLE `student` (
  `id` int NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `class` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name_class_idx` (`name`,`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

2. Next, let's test three different SQL statements.

![](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/leftmost-prefix-matching-rule-a8a5555c.png)

```sql
# Uses the index
SELECT * FROM student WHERE name = 'Anne Henry';
EXPLAIN SELECT * FROM student WHERE name = 'Anne Henry' AND class = 'lIrm08RYVk';
# Cannot use the index
SELECT * FROM student WHERE class = 'lIrm08RYVk';
```

Now look at another common interview question: Given a composite index `(a, b, c)`, will a query with `a=1 AND c=1` use the index? What about `c=1`? `b=1 AND c=1`? `b=1 AND a=1 AND c=1`?

Don't look at the answers right away—give yourself 3 minutes to think through them.

1. Query `a=1 AND c=1`: By the leftmost prefix rule, the query can use the prefix portion of the index. Thus, it uses the index on `a=1` and then filters the remaining rows for `c=1` (or checks `c=1` via Index Condition Pushdown).
2. Query `c=1`: Because the query omits the leftmost column `a`, by the leftmost prefix rule, the index cannot be used.
3. Query `b=1 AND c=1`: Same as the second case—the index will not be used.
4. Query `b=1 AND a=1 AND c=1`: This query **can** use the index! When the query optimizer analyzes the SQL statement, it reorders `AND` predicates for composite indexes so the index can be matched—turning `b=1 AND a=1 AND c=1` into `a=1 AND b=1 AND c=1`.

MySQL 8.0.13 introduced **Index Skip Scan (ISS)**, which improves query efficiency in certain index lookup scenarios. Before ISS, composite index queries that did not satisfy the leftmost prefix rule had to perform a full table scan. ISS allows MySQL to avoid a full table scan in certain cases even when the leftmost prefix isn't specified. However, this feature is somewhat limited compared to Oracle's implementation, and MySQL 8.0.31 even had a reported bug: [Bug #109145 Using index for skip scan cause incorrect result](https://bugs.mysql.com/bug.php?id=109145) (fixed in subsequent versions). Personally, I recommend just knowing it exists—no need to dig too deeply, as you may not rely on it in real projects.

### Does `SELECT *` Cause Index Invalidation?

`SELECT *` does **not** directly cause an index to become invalid (if an index isn't chosen, it's usually because the `WHERE` filter matches too large a portion of the table), but it can introduce other performance issues such as wasted network bandwidth, unnecessary data processing, and inability to use a covering index.

### Which Columns Are Good Candidates for Indexing?

- **Non-NULL columns:** Indexed columns should avoid `NULL` values whenever possible, as columns containing `NULL` are harder for the database optimizer to optimize. If a frequently queried column cannot avoid `NULL`, consider using clear short sentinel values like `0`, `1`, `true`, or `false` instead.
- **Frequently queried columns:** Columns that are queried very frequently should be indexed.
- **Columns used in `WHERE` conditions:** Columns commonly used as filtering predicates in `WHERE` clauses are prime candidates for indexing.
- **Columns frequently sorted:** Since indexes are already sorted, queries can leverage the index ordering to speed up `ORDER BY` operations.
- **Columns frequently used in joins:** Columns commonly used in table joins are often foreign key columns; you don't necessarily have to define a physical foreign key constraint, just recognize that the column links tables together. Indexing frequently joined columns improves multi-table join efficiency.

### What Causes Indexes to Become Unused / Invalid?

1. A composite index exists, but the query condition violates the leftmost prefix matching rule;
2. Performing calculations, functions, or type conversions on the indexed column;
3. `LIKE` patterns starting with `%`, such as `LIKE '%abc'`;
4. Using `OR` in the `WHERE` clause where one of the conditions involves an unindexed column—none of the indexes involved will be used;
5. An `IN` list with a very large value range can cause the optimizer to abandon the index and fall back to a full table scan (`NOT IN` behaves similarly);
6. [Implicit type conversion](https://javaguide.cn/database/mysql/index-invalidation-caused-by-implicit-conversion.html "Implicit conversion") occurs.

## MySQL Query Cache

The MySQL Query Cache caches query result sets. When a query is executed, MySQL first checks the cache; if a matching cached result exists, it returns that result directly.

Add the following configuration to `my.cnf` and restart MySQL to enable the query cache:

```properties
query_cache_type=1
query_cache_size=600000
```

You can also enable it dynamically by running these commands in MySQL:

```properties
set global  query_cache_type=1;
set global  query_cache_size=600000;
```

The query cache returns cached results directly when both the query condition and underlying data remain identical. However, matching rules are extremely strict—even the tiniest discrepancy results in a cache miss. Matching criteria include the exact SQL text itself, the current database, client protocol version, and other session factors that could affect results.

**Cases That Cause Query Cache Misses:**

1. Any two queries that differ by even a single character will miss the cache.
2. Queries containing user-defined functions, stored functions, user variables, temporary tables, or MySQL system tables will not be cached.
3. After a cache entry is created, MySQL tracks every table involved in the query; if any of those tables changes (either data or structure), all cached entries referencing that table are immediately invalidated.

**Although caching can boost read performance, the query cache introduces significant overhead—every query requires cache lookups/writes, and invalidations require purging entries.** Therefore, enable the query cache cautiously, especially in write-heavy applications. If enabled, size it sensibly (typically a few tens of megabytes). You can also control whether an individual query uses the cache via `sql_cache` and `sql_no_cache`:

```sql
SELECT sql_no_cache COUNT(*) FROM usr;
```

Starting in MySQL 5.6, the query cache was disabled by default. As of MySQL 8.0, support for the query cache has been completely removed (for details, see: [MySQL 8.0: Retiring Support for the Query Cache](https://dev.mysql.com/blog-archive/mysql-8-0-retiring-support-for-the-query-cache/)).

![MySQL 8.0: Retiring Support for the Query Cache](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/mysql8.0-retiring-support-for-the-query-cache-56234f85.png)

## ⭐️MySQL Logs

Answers to the questions above can be found in the **"Technical Interview Questions"** section of [*Java Interview Guide* (paid; click the link to claim a discount coupon)](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html).

![Technical Interview Questions section of Java Interview Guide](/media/jg/ext/oss.javaguide.cn/javamianshizhibei/technical-interview-questions-41fe5561.png)

Article URL: <https://www.yuque.com/snailclimb/mf2z3k/zr4kfk> (Password available via: <https://t.zsxq.com/avfM0>).

## ⭐️MySQL Transactions

### What Is a Transaction?

Imagine a scenario where we need to insert multiple related pieces of data into a database. Unfortunately, the following failures can occur midway:

- The database suddenly crashes for some reason;
- The client loses network connectivity to the database;
- During concurrent access, multiple threads write to the database simultaneously, overwriting each other's changes;
- ...

Any of these problems can leave the data in an inconsistent state. To guarantee data consistency, a system must be able to handle these failures. Transactions are the primary abstraction we rely on to simplify handling these problems. While the concept of transactions originated in databases, it has become a broad foundational concept in computing.

**What is a transaction?** In one sentence: **a transaction is a logical unit of work consisting of a group of operations that either all execute or none execute.**

The most classic example of a transaction is a bank transfer. Suppose Xiao Ming transfers 1,000 yuan to Xiao Hong. This transfer involves two critical operations, both of which must succeed or both fail:

1. Deduct 1,000 yuan from Xiao Ming's balance.
2. Add 1,000 yuan to Xiao Hong's balance.

A transaction treats these two operations as a single logical unit so that either both succeed or both fail—preventing a state where Xiao Ming's balance decreases while Xiao Hong's does not increase.

![Transaction diagram](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/.png-a0059ccb.png)

### What Is a Database Transaction?

In most cases, when we talk about transactions without specifically saying **distributed transactions**, we mean **database transactions**.

Database transactions are what we encounter most often in everyday development. If your project uses a monolithic architecture, database transactions are usually all you need.

**So what does a database transaction do?**

Put simply, a database transaction ensures that multiple database operations (SQL statements) form a single logical unit that follows the rule: **either all operations succeed, or none of them take effect.**

```sql
# Start a transaction
START TRANSACTION;
# Multiple SQL statements
SQL1,SQL2...
## Commit the transaction
COMMIT;
```

![Database transaction diagram](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/.png-34ac1d2d.png)

Furthermore, relational database transactions (such as in `MySQL`, `SQL Server`, `Oracle`, etc.) possess the **ACID** properties:

![ACID](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/ACID-ad1efa4f.png)

1. **Atomicity**: A transaction is the smallest indivisible unit of execution. Atomicity guarantees that all actions in a transaction either complete in full or have no effect at all;
2. **Consistency**: Data remains in a consistent valid state before and after transaction execution—for example, in a fund transfer, whether the transaction succeeds or fails, the sum of the sender's and receiver's balances remains unchanged;
3. **Isolation**: When accessing the database concurrently, one user's transaction is shielded from interference by other transactions, and concurrent transactions appear isolated from one another;
4. **Durability**: Once a transaction is committed, its changes to database data are permanent and will not be lost even if the database crashes.

🌈 One extra note here: **Consistency can only be guaranteed when Durability, Atomicity, and Isolation are ensured. That is to say, A, I, and D are the means, while C is the goal!** Many of us were misled by the acronym ACID for a long time—I didn't fully realize this until watching Teacher Zhou Zhiming's open course [*Zhou Zhiming's Software Architecture Course* (in Chinese)](https://time.geekbang.org/opencourse/intro/100064201) (always read great books!).

![AID->C](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/AID--C-78c67e55.png)

Additionally, the author of DDIA, [*Designing Data-Intensive Applications*](https://book.douban.com/subject/30329536/), writes in his book:

> Atomicity, isolation, and durability are properties of the database, whereas consis‐
> tency (in the ACID sense) is a property of the application. The application may rely
> on the database’s atomicity and isolation properties in order to achieve consistency,
> but it’s not up to the database alone.
>
> Put simply, this means: atomicity, isolation, and durability are properties of the database, whereas consistency (in the ACID sense) is a property of the application. An application may rely on the database's atomicity and isolation properties to achieve consistency, yet it is not up to the database alone—so in that sense, the letter C doesn't truly belong in ACID.

I strongly recommend *Designing Data-Intensive Applications*—it's worth reading multiple times! Nearly 90% of readers on Douban gave it a five-star rating. A Chinese translation is also open-sourced on GitHub at: [https://github.com/Vonng/ddia](https://github.com/Vonng/ddia).

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/books/ddia-795bef19.png)

### What Concurrency Problems Can Concurrent Transactions Cause?

In typical applications, multiple transactions run concurrently and frequently operate on the same data to accomplish their respective tasks (multiple users operating on the same data). While concurrency is essential, it can lead to the following anomalies:

#### Dirty Read

One transaction reads data and modifies it, and this modification becomes visible to other transactions even though the modifying transaction has not yet committed. Another transaction then reads this uncommitted data, after which the first transaction rolls back—meaning the modification is never persisted to the database. The second transaction has read invalid "dirty" data, hence the term *dirty read*.

Example: Transaction 1 reads `A=20` from a table and updates `A=A-1`. Transaction 2 reads `A=19`. Transaction 1 then rolls back, so the modification to `A` is never committed and `A` remains `20`.

![Dirty Read](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/concurrency-consistency-issues-dirty-reading-25db2e8b.png)

#### Lost Update

When one transaction reads a piece of data and another transaction accesses the same data, if the first transaction modifies the data and then the second transaction also modifies it, the first transaction's update gets overwritten and lost—hence *lost update*.

Example: Transaction 1 reads `A=20` and Transaction 2 also reads `A=20`. Transaction 1 first modifies `A=A-1`, and Transaction 2 later modifies `A=A-1` as well. The final result is `A=19`, losing Transaction 1's update.

![Lost Update](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/concurrency-consistency-issues-missing-modificat-daf6a627.png)

#### Non-Repeatable Read (Unrepeatable Read)

Refers to reading the same row multiple times within a single transaction. Before this transaction ends, another concurrent transaction accesses and modifies that same data. As a result, between the first transaction's two reads, the second transaction's modification causes the first transaction to observe two different values for the same row—hence *non-repeatable read*.

Example: Transaction 1 reads `A=20` from a table, and Transaction 2 also reads `A=20`. Transaction 1 modifies `A=A-1` (and commits), and when Transaction 2 reads `A` again, it gets `A=19`, differing from its first read.

![Non-Repeatable Read](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/concurrency-consistency-issues-unrepeatable-read-66118df3.png)

#### Phantom Read

Phantom read is similar to non-repeatable read. It occurs when one transaction reads several rows matching a condition, and another concurrent transaction inserts new rows matching that condition. When the first transaction executes the same query again, it discovers additional rows that did not exist before—as if seeing phantoms—hence *phantom read*.

Example: Transaction 2 reads rows within a certain range, Transaction 1 inserts new rows within that range, and when Transaction 2 queries the same range again, it finds more rows than in its first read.

![Phantom Read](/media/jg/ext/oss.javaguide.cn/javaguide/database/mysql/concurrency-consistency-issues-phantom-read-96030f2a.png)

### What Is the Difference Between Non-Repeatable Read and Phantom Read?

- **Non-repeatable read:** Within the same transaction, the same existing row is modified or deleted by another transaction, causing subsequent reads to see changed content or missing rows.
- **Phantom read:** Within the same transaction, executing the same range query multiple times returns a different set of matching rows, with new rows appearing (or disappearing).

Phantom read can actually be viewed as a special case of non-repeatable read. They are distinguished separately primarily because the mechanisms required to prevent them differ.

For example, when executing `DELETE` and `UPDATE`, locking the existing records directly ensures transaction safety. When executing `INSERT`, however, because a Record Lock can only lock rows that already exist, preventing new rows from being inserted into the range requires a **Gap Lock**. In other words, preventing phantom reads requires **Next-Key Locks** (`Record Lock + Gap Lock`).

### What Concurrency Control Mechanisms Exist for Concurrent Transactions?

MySQL essentially has two concurrency control mechanisms: **Locks** and **MVCC**. Locking can be viewed as a pessimistic concurrency control model, while Multi-Version Concurrency Control (**MVCC**) can be viewed as an optimistic concurrency control model.

Under **locking**, shared resources are explicitly controlled via locks rather than scheduling alone. MySQL mainly uses **read-write locks** for concurrency control:

- **Shared Lock (S Lock):** Also known as a read lock. A transaction acquires a shared lock when reading records; multiple transactions may hold S locks simultaneously (locks are compatible).
- **Exclusive Lock (X Lock):** Also known as a write lock. A transaction acquires an exclusive lock when modifying records; multiple transactions cannot hold X locks simultaneously. Once a record holds an X lock, no other transaction can acquire any lock on that record (locks are incompatible).

Read-write locks allow concurrent reads (read-read parallelism), but not concurrent read-write or write-write access. In addition, by lock granularity, locks are divided into **table-level locks** and **row-level locks**. InnoDB supports both table-level and row-level locks, defaulting to row-level locks. Row-level locks have finer granularity, locking only the relevant records (one or more rows), giving InnoDB much higher performance for concurrent writes. Both table-level and row-level locks include Shared Locks (S locks) and Exclusive Locks (X locks).

**MVCC** (Multi-Version Concurrency Control) maintains multiple versions of a row and uses transaction visibility rules to ensure each transaction sees only the version it is supposed to see. Typically, a global version/transaction ID allocator assigns a unique version number to each modification.

In MySQL, MVCC is implemented primarily through **hidden columns, Read View, and undo log**:

- `undo log`: Records multiple historical versions of row data.
- `Read View` and hidden columns: Determine the visibility of a given row version to the current transaction.

For details on how InnoDB implements MVCC, see this article: [InnoDB Storage Engine Implementation of MVCC](./innodb-implementation-of-mvcc.md).

### What Transaction Isolation Levels Are Defined by the SQL Standard?

The SQL standard defines four transaction isolation levels to balance transaction isolation and concurrency performance. Higher levels provide stronger consistency but potentially lower concurrency:

- **READ-UNCOMMITTED:** The lowest isolation level. Allows reading uncommitted changes from other transactions, which can lead to dirty reads, phantom reads, or non-repeatable reads. Rarely used in practice due to weak consistency guarantees.
- **READ-COMMITTED:** Allows reading changes already committed by concurrent transactions. Prevents dirty reads, while non-repeatable reads and phantom reads may still occur. This is the default isolation level in most databases (e.g., Oracle, SQL Server).
- **REPEATABLE-READ:** Guarantees consistent results across repeated reads of the same row within a transaction unless modified by the transaction itself. Prevents dirty reads and non-repeatable reads, though phantom reads remain possible under the SQL standard. This is the default isolation level of MySQL's InnoDB storage engine. Moreover, under this level, InnoDB largely resolves phantom reads through MVCC and Next-Key Locks (Gap Lock + Record Lock).
- **SERIALIZABLE:** The highest isolation level, strictly compliant with full ACID isolation. All transactions execute sequentially one by one so that interference between transactions is impossible, preventing dirty reads, non-repeatable reads, and phantom reads.

| Isolation Level  | Dirty Read | Non-Repeatable Read | Phantom Read                     |
| ---------------- | ---------- | ------------------- | -------------------------------- |
| READ UNCOMMITTED | √          | √                   | √                                |
| READ COMMITTED   | ×          | √                   | √                                |
| REPEATABLE READ  | ×          | ×                   | √ (SQL Standard) / ≈× (InnoDB)   |
| SERIALIZABLE     | ×          | ×                   | ×                                |

### What Is MySQL's Default Isolation Level?

The default isolation level of MySQL's InnoDB storage engine is **REPEATABLE READ**. You can check it with:

- Before MySQL 8.0: `SELECT @@tx_isolation;`
- MySQL 8.0 and later: `SELECT @@transaction_isolation;`

```sql
mysql> SELECT @@tx_isolation;
+-----------------+
| @@tx_isolation  |
+-----------------+
| REPEATABLE-READ |
+-----------------+
```

For a detailed walkthrough of MySQL transaction isolation levels, see my article: [Detailed Explanation of MySQL Transaction Isolation Levels](./transaction-isolation-level.md).

### Are MySQL's Isolation Levels Implemented Solely via Locks?

MySQL's isolation levels are implemented using both **locking** and **MVCC**.

`SERIALIZABLE` is implemented via locks, while `READ-COMMITTED` and `REPEATABLE-READ` are largely implemented via MVCC. However, isolation levels other than `SERIALIZABLE` may still use locking—for example, `REPEATABLE-READ` relies on locking reads (Next-Key Locks) during current reads to prevent phantom reads.

## MySQL Locks

Locking is a classic concurrency control mechanism for transactions.

### Do You Know Table-Level Locks and Row-Level Locks? What Are the Differences?

MyISAM only supports table-level locking, locking the entire table at once, which results in very poor performance under concurrent writes. InnoDB supports both table-level locking and row-level locking, with row-level locking as the default.

Row-level locks have finer granularity, locking only the affected row(s), so InnoDB achieves much better performance for concurrent write workloads.

**Table-Level Lock vs. Row-Level Lock:**

- **Table-Level Lock:** The coarsest lock granularity in MySQL (aside from global locks). Applied when locking an entire table (or when predicates don't use an index). Simple to implement, low resource overhead, fast to acquire, and never causes deadlocks. However, it has the highest lock contention probability and terrible concurrency performance. Table-level locks are independent of storage engines; both MyISAM and InnoDB support them.
- **Row-Level Lock:** The finest lock granularity in MySQL, applied **to index records**, locking only the target row records being operated on. Row-level locks significantly reduce contention, offer the finest granularity and highest concurrency, but incur greater locking overhead, are slower to acquire, and can cause deadlocks. Row-level locks depend on the storage engine and are implemented at the storage engine layer.

### What Should You Watch Out for When Using Row-Level Locks?

InnoDB's row-level locks are placed on index entries, whereas non-indexed predicates fall back to locking all rows (effectively behaving like a table lock). When executing `UPDATE` or `DELETE`, if the `WHERE` condition column does not hit an index (or the index becomes invalid), InnoDB performs a full table scan and locks every row in the table! This happens frequently in production development—always pay close attention to this!

Note also that even when an index exists, the MySQL optimizer might still choose a full table scan based on cost estimation.

### What Types of Row Locks Does InnoDB Have?

InnoDB implements row-level locking by locking records on index pages. It supports three types of row locks:

- **Record Lock:** A lock on a single index record.
- **Gap Lock:** A lock on a gap between index records, excluding the record itself.
- **Next-Key Lock:** `Record Lock + Gap Lock`, locking both a range and the record itself, primarily designed to prevent phantom reads (as mentioned in the Transactions section). Since a Record Lock only locks existing rows, a Gap Lock is required to prevent new rows from being inserted into the gap.

**Under InnoDB's default `REPEATABLE-READ` isolation level, row locking defaults to Next-Key Locks. However, if the queried column uses a unique index or primary key (for an exact match on an existing row), InnoDB optimizes the Next-Key Lock by downgrading it to a Record Lock—locking only the index record itself rather than a range.**

### What About Shared Locks and Exclusive Locks?

For both table-level and row-level locks, there are two fundamental modes: **Shared Lock (S Lock)** and **Exclusive Lock (X Lock)**:

- **Shared Lock (S Lock):** Also called a read lock. Acquired when reading records; multiple transactions can hold S locks simultaneously (compatible).
- **Exclusive Lock (X Lock):** Also called a write/exclusive lock. Acquired when modifying records; multiple transactions cannot hold X locks at the same time. Once a record has an X lock, no other transaction can acquire any type of lock on that record (incompatible).

An exclusive lock is incompatible with every other lock, while a shared lock is compatible only with another shared lock.

|      | S Lock       | X Lock       |
| :--- | :----------- | :----------- |
| S Lock | Compatible | Incompatible |
| X Lock | Incompatible | Incompatible |

Thanks to MVCC, plain `SELECT` statements in InnoDB acquire no locks at all. However, you can explicitly acquire shared or exclusive locks using the following statements:

```sql
# Shared lock (supported in MySQL 5.7 and MySQL 8.0)
SELECT ... LOCK IN SHARE MODE;
# Shared lock (supported in MySQL 8.0)
SELECT ... FOR SHARE;
# Exclusive lock
SELECT ... FOR UPDATE;
```

### What Is the Purpose of Intention Locks?

If a transaction needs to acquire a table-level lock, how can it determine whether any rows in that table currently hold row-level locks? Scanning every row one by one would be terribly slow. We need **Intention Locks** to quickly determine whether a table-level lock can be granted on a table.

Intention locks are table-level locks with two modes:

- **Intention Shared Lock (IS Lock):** Indicates a transaction intends to set S locks on individual rows in the table; before acquiring a row-level S lock, the transaction must first acquire an IS lock on the table.
- **Intention Exclusive Lock (IX Lock):** Indicates a transaction intends to set X locks on individual rows in the table; before acquiring a row-level X lock, the transaction must first acquire an IX lock on the table.

**Intention locks are automatically maintained by the storage engine—users cannot manipulate them manually. Before acquiring a shared or exclusive lock on a row, InnoDB automatically acquires the corresponding intention lock on the table.**

Intention locks are mutually compatible with each other:

|       | IS Lock    | IX Lock    |
| ----- | ---------- | ---------- |
| IS Lock | Compatible | Compatible |
| IX Lock | Compatible | Compatible |

Intention locks conflict with **table-level** S and X locks as follows (note: intention locks never conflict with **row-level** S and X locks):

|      | IS Lock    | IX Lock      |
| ---- | ---------- | ------------ |
| S Lock | Compatible | Incompatible |
| X Lock | Incompatible | Incompatible |

The corresponding description in *MySQL Technology Insider: InnoDB Storage Engine* appears to contain a typo on this compatibility rule.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/image-20220511171419081-cc6c116c.png)

### What Is the Difference Between Current Read and Snapshot Read?

**Snapshot Read** (consistent non-locking read) refers to plain `SELECT` statements, excluding these two categories of locking `SELECT` statements:

```sql
# Exclusive lock (supported in MySQL 5.7 and MySQL 8.0)
SELECT ... FOR UPDATE
# Shared lock (supported in MySQL 5.7 and MySQL 8.0)
SELECT ... LOCK IN SHARE MODE;
# Shared lock (supported in MySQL 8.0)
SELECT ... FOR SHARE;
```

A snapshot refers to a historical version of a record; each row may have multiple historical versions (multi-versioning).

Under a snapshot read, if a target row is currently undergoing an `UPDATE` or `DELETE`, the read operation does not block waiting for the row's X lock to be released; instead, it reads a snapshot version of the row.

InnoDB uses consistent non-locking reads only under the `RC` (Read Committed) and `RR` (Repeatable Read) isolation levels:

- Under `RC`, a consistent non-locking read always reads the most recently committed snapshot of the locked row.
- Under `RR`, a consistent non-locking read always reads the row version as of when the current transaction started (its first read).

Snapshot reads are ideal for scenarios that prioritize maximum read performance over strict real-time locking consistency.

**Current Read** (consistent locking read) reads the latest committed version of a row and places an X lock or S lock on the record.

Common SQL statements that perform a current read include:

```sql
# Places an X lock on read records
SELECT...FOR UPDATE
# Places an S lock on read records
SELECT...LOCK IN SHARE MODE
# Places an S lock on read records
SELECT...FOR SHARE
# Places an X lock on modified records
INSERT...
UPDATE...
DELETE...
```

### Do You Know About Auto-Increment Locks (AUTO-INC Locks)?

> Not a high-priority interview topic—a basic understanding is enough.

When designing relational database tables, we often designate a column as an auto-incrementing primary key. Auto-increment keys in InnoDB involve a special kind of table-level lock—**AUTO-INC Locks**.

```sql
CREATE TABLE `sequence_id` (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `stub` CHAR(10) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `stub` (`stub`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

More precisely, any column with `AUTO_INCREMENT` involves auto-increment locking, not only primary keys, since non-primary-key columns can also be configured as auto-incrementing.

When a transaction inserts data into a table with an `AUTO_INCREMENT` column, it must first acquire an AUTO-INC lock; if it cannot acquire it immediately, it may block. This blocking behavior is only one mode of AUTO-INC locking—you can think of the AUTO-INC lock as an interface with multiple implementation modes controlled by `innodb_autoinc_lock_mode` (introduced in MySQL 5.1.22):

| `innodb_autoinc_lock_mode` | Description                              |
| :------------------------- | :--------------------------------------- |
| 0                          | Traditional lock mode                    |
| 1                          | Consecutive lock mode (default prior to MySQL 8.0) |
| 2                          | Interleaved lock mode (default since MySQL 8.0) |

In interleaved mode, all `"INSERT-LIKE"` statements (including `INSERT`, `REPLACE`, `INSERT...SELECT`, `REPLACE...SELECT`, `LOAD DATA`, etc.) do not use a table-level lock; instead, they use a lightweight mutex, allowing multiple insert statements to execute concurrently with higher throughput and better scalability.

However, if your MySQL deployment uses primary-replica replication with `Statement`-based binary logging (`binlog_format=STATEMENT`), do **not** set `innodb_autoinc_lock_mode` to interleaved mode, as doing so can cause data inconsistency between primary and replicas because the execution order of concurrent inserts is not guaranteed.

> When MySQL uses Statement-based replication, it replicates individual SQL statements one by one to replicas.

Finally, here is one more recommended article: [Why MySQL Auto-Increment Primary Keys Are Neither Strictly Monotonic Nor Contiguous (in Chinese)](https://draveness.me/whys-the-design-mysql-auto-increment/).

## ⭐️MySQL Performance Optimization

For a comprehensive checklist of MySQL performance optimization best practices, see: [MySQL High-Performance Optimization Guidelines Summary](./mysql-high-performance-optimization-specification-recommendations.md).

### Can You Store Files (Like Images) Directly in MySQL?

You technically can, by storing the file's binary data directly in a `BLOB` column. However, storing files directly in the database is strongly discouraged because it severely degrades database performance and consumes excessive storage space.

Instead, you can use out-of-the-box object storage services offered by cloud providers—mature, reliable, and relatively inexpensive.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/oss-search-15c7d5a2.png)

You can also self-host a distributed file storage service; it's straightforward using open-source projects like FastDFS or MinIO (recommended).

**Store only the file path/URL in the database, and let the file storage service store the actual files.**

### How Should IP Addresses Be Stored in MySQL?

You can convert IP addresses into integer values for storage—delivering better query performance and smaller storage footprints.

MySQL provides two built-in functions for handling IPv4 addresses:

- `INET_ATON()`: Converts an IP address into an unsigned integer (4–8 bytes in original text; for IPv4 it is a 4-byte 32-bit unsigned integer).
- `INET_NTOA()`: Converts an integer IP representation back into an IP address string.

Before inserting, call `INET_ATON()` to convert the IP address to an integer; when querying for display, call `INET_NTOA()` to convert it back to a dotted IP address string.

### What Are Common SQL Optimization Techniques?

There is a dedicated article in the **"Technical Interview Questions"** section of [*Java Interview Guide* (paid)](https://javaguide.cn/zhuanlan/java-mian-shi-zhi-bei.html) covering common SQL optimization techniques in a thorough, clear, and easy-to-follow way!

![Common SQL optimization techniques](/media/jg/ext/oss.javaguide.cn/javamianshizhibei/javamianshizhibei-sql-optimization-3cdc5f03.png)

Article URL: <https://www.yuque.com/snailclimb/mf2z3k/abc2sv> (Password available via: <https://t.zsxq.com/avfM0>).

### How Do You Analyze SQL Performance?

We can use the `EXPLAIN` statement to inspect a SQL query's **execution plan**—which shows how MySQL actually executes a statement after the query optimizer finishes optimizing it.

`EXPLAIN` does not actually execute the query; instead, it analyzes the statement through the **query optimizer**, determines the optimal execution strategy, and outputs the plan details.

`EXPLAIN` works with `SELECT`, `DELETE`, `INSERT`, `REPLACE`, and `UPDATE` statements, though we most commonly analyze `SELECT` queries.

Here is a quick demonstration of `EXPLAIN`.

The output format of `EXPLAIN` looks like this:

```sql
mysql> EXPLAIN SELECT `score`,`name` FROM `cus_order` ORDER BY `score` DESC;
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
| id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra          |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
|  1 | SIMPLE      | cus_order | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 997572 |   100.00 | Using filesort |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
1 row in set, 1 warning (0.00 sec)
```

The meaning of each column is as follows:

| **Column**    | **Meaning**                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| id            | Sequential identifier of the `SELECT` query                                                  |
| select_type   | Type of the `SELECT` query                                                                   |
| table         | Name of the table accessed                                                                   |
| partitions    | Matching partitions (`NULL` for non-partitioned tables)                                      |
| type          | Table access method (join/scan type)                                                         |
| possible_keys | Indexes that MySQL could potentially use                                                     |
| key           | Index actually chosen by MySQL                                                               |
| key_len       | Byte length of the chosen index key                                                          |
| ref           | Columns or constants compared against the index during equality lookups                      |
| rows          | Estimated number of rows to examine                                                          |
| filtered      | Percentage of table rows estimated to remain after filtering by table conditions             |
| Extra         | Additional execution information                                                             |

Due to space constraints, this is only a brief introduction to MySQL execution plans. For full details, see: [SQL Execution Plans](./mysql-query-execution-plan.md).

### Do You Know Read-Write Splitting and Database/Table Sharding?

There are many questions around read-write splitting and sharding, so I wrote a dedicated article covering them: [Detailed Explanation of Read-Write Splitting and Database/Table Sharding](../../high-performance/read-and-write-separation-and-library-subtable.md).

### How Do You Optimize Deep Pagination?

[Introduction to Deep Pagination and Optimization Recommendations](../../high-performance/deep-pagination-optimization.md)

### How Do You Implement Hot-Cold Data Separation?

[Detailed Explanation of Hot-Cold Data Separation](../../high-performance/data-cold-hot-separation.md)

### How Do You Optimize MySQL Performance Overall?

MySQL performance optimization is a systematic engineering effort spanning many areas, and it's impossible to cover every single detail in an interview. Therefore, structure your answer using a "point → line → plane" approach—starting from core diagnostics and expanding outward to demonstrate both depth of thought and practical problem-solving ability.

**1. Start at the Core: Identifying and Analyzing Slow SQL**

The first step of performance optimization is always locating the bottleneck. In an interview, start with **slow SQL identification and analysis**, which showcases both your troubleshooting methodology and your mastery of database observability tools:

- **Monitoring tools:** Explain familiar slow SQL monitoring tools such as the **MySQL Slow Query Log** and **Performance Schema**, and how you use them to pinpoint problematic queries.
- **`EXPLAIN` command:** Walk through using `EXPLAIN` to inspect query plans and index usage, ideally backed by a concrete case showing how you interpret execution order, index selection, full table scans, etc.

**2. Expand From Point to Line: Index, Schema, and SQL Optimization**

Once you have pinpointed slow SQL statements, optimize them systematically across indexes, table design, and SQL coding practices:

- **Index optimization:** This is the centerpiece of MySQL tuning—cover index design principles, covering indexes, and the leftmost prefix rule. Sharing real examples of how you chose indexes in past projects earns major bonus points.
- **Schema design optimization:** Choose appropriate column types, avoid unnecessary redundant fields, and strike the right balance between normalization and denormalization.
- **SQL optimization:** Avoid `SELECT *`, query only required columns, prefer joins over correlated subqueries where appropriate, paginate efficiently, and batch bulk operations.

**3. Advanced Strategies: Architecture-Level Optimization**

If the interviewer is satisfied with foundational tuning, they may probe architecture-level scaling strategies:

- **Read-write splitting:** Separate read and write workloads across different database instances to boost overall concurrency.
- **Database/table sharding:** Distribute data across multiple database instances or tables to reduce per-table row counts and accelerate queries—while weighing the added complexity and operational cost carefully.
- **Hot-cold data separation:** Separate cold and hot data based on access frequency and business criticality, storing cold data on cheaper, lower-performance storage and hot data on high-performance media.
- **Caching:** Use caching middleware like Redis to hold hot data in memory and offload database pressure—extremely common, highly effective, and very cost-efficient!

**4. Additional Tuning Measures**

Beyond slow SQL diagnostics, indexes, and architecture, mention supporting optimizations to show holistic mastery:

- **Connection pool tuning:** Properly configure database connection pools (such as **pool size** and **timeouts**) to improve connection efficiency and avoid repeated connection overhead.
- **Hardware upgrades:** Upgrading hardware—using higher-spec servers, adding RAM (for a larger Buffer Pool), and adopting **SSD** storage—can also meaningfully improve overall database throughput.

**5. Summary**

In interviews, present optimizations in priority order: slow SQL identification, [index optimization](./mysql-index.md), schema design, and [SQL optimization](../../high-performance/sql-optimization.md). Architecture-level strategies such as [read-write splitting and sharding](../../high-performance/read-and-write-separation-and-library-subtable.md) and [hot-cold data separation](../../high-performance/data-cold-hot-separation.md) should be treated as later resorts—do not introduce them lightly unless facing clear bottlenecks in specific scenarios, because the added complexity brings substantial maintenance costs.

## Recommended MySQL Learning Resources

**Recommended Articles**:

- [Yishu Yixi's MySQL Tutorial Series (in Chinese)](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=Mzg3NTc3NjM4Nw==&action=getalbum&album_id=2372043523518300162&scene=173&from_msgid=2247484308&from_itemidx=1&count=3&nolastread=1#wechat_redirect)
- [Yes's MySQL Tutorial Series (in Chinese)](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzkxNTE3NjQ3MA==&action=getalbum&album_id=1903249596194095112&scene=173&from_msgid=2247490365&from_itemidx=1&count=3&nolastread=1#wechat_redirect)
- [After Finishing This Article, My SQL Optimization Skills Reached a New Level - Biancheng Paidaxing - 2022 (in Chinese)](https://juejin.cn/post/7161964571853815822)
- [20,000-Word Deep Dive! InnoDB Locking Special! - Jian Tianluo de Xiaonanhai - 2022 (in Chinese)](https://juejin.cn/post/7094049650428084232)
- [Are MySQL Auto-Increment Primary Keys Always Contiguous? - Feitian Xiaoniuro - 2022 (in Chinese)](https://mp.weixin.qq.com/s/qci10h9rJx_COZbHV3aygQ)
- [Deep Dive Into MySQL Index Internals - Tencent Tech Engineering - 2020 (in Chinese)](https://zhuanlan.zhihu.com/p/113917726)

## References

- *High Performance MySQL*, Chapter 7: Advanced MySQL Features
- *MySQL Technology Insider: InnoDB Storage Engine*, Chapter 6: Locks
- Relational Database: <https://www.omnisci.com/technical-glossary/relational-database>
- Understand in One Article How Many Chinese Characters and Digits `varchar` Can Store in MySQL, and the Difference Between `varchar(100)` and `varchar(10)` (in Chinese): <https://www.cnblogs.com/zhuyeshen/p/11642211.html>
- Tech Sharing | Isolation Levels: Correctly Understanding Phantom Reads (in Chinese): <https://opensource.actionsky.com/20210818-mysql/>
- MySQL Server Logs - MySQL 5.7 Reference Manual: <https://dev.mysql.com/doc/refman/5.7/en/server-logs.html>
- Redo Log - MySQL 5.7 Reference Manual: <https://dev.mysql.com/doc/refman/5.7/en/innodb-redo-log.html>
- Locking Reads - MySQL 5.7 Reference Manual: <https://dev.mysql.com/doc/refman/5.7/en/innodb-locking-reads.html>
- Deep Understanding of Database Row Locks and Table Locks (in Chinese): <https://zhuanlan.zhihu.com/p/52678870>
- Detailed Explanation of the Role of Intention Locks in MySQL InnoDB (in Chinese): <https://juejin.cn/post/6844903666332368909>
- Deep Analysis of MySQL Auto-Increment Locks (in Chinese): <https://juejin.cn/post/6968420054287253540>
- How Exactly Should Non-Repeatable Reads and Phantom Reads Be Distinguished in Databases? (in Chinese): <https://www.zhihu.com/question/392569386>
