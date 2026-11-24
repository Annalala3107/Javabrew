---
title: Recommendations for Choosing MySQL Date and Time Types
description: In-depth comparison of DATETIME and TIMESTAMP in MySQL, analyzing differences in time zone handling, storage space, and value ranges, along with best-practice recommendations for choosing date and time types.
category: Databases
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL Time Storage,DATETIME,TIMESTAMP,Unix Timestamp,Time Zone Handling,Date Type Selection,MySQL Date Functions
lang: en
sourceRef: zh-ref/database/mysql/some-thoughts-on-database-storage-time.md
---

In daily software development, storing time is a fundamental and frequent requirement. Whether recording the operation time of data, the occurrence time of financial transactions, the departure time of an itinerary, or the order placement time of a user, time information is closely tied to our business logic and system functionality. Therefore, choosing and using MySQL date and time types properly is critical—whether chosen well or poorly, it can even have a significant impact on business accuracy and system stability.

This article aims to help developers re-examine and deeply understand the different ways time is stored in MySQL so they can make better choices tailored to their project's business scenarios.

## Do Not Store Dates as Strings

Like many database beginners, the author also tried using string types (such as `VARCHAR`) to store dates and times in early learning stages, and even once thought it was a simple and intuitive approach. After all, a format like `'YYYY-MM-DD HH:MM:SS'` looks clear and easy to understand.

However, this is an incorrect practice, mainly causing the following two problems:

1. **Storage efficiency**: Compared with MySQL's built-in date and time types, strings generally take more storage space to represent the same time information.
2. **Low query and computation efficiency**:
   - **Complex and inefficient comparison operations**: String-based date comparisons must be performed character by character in lexicographical order, which is not only unintuitive (for example, `'2024-05-01'` would be less than `'2024-1-10'`), but also far less efficient than numeric or point-in-time comparisons using native date and time types.
   - **Limited computation capabilities**: You cannot directly leverage the rich date and time functions provided by the database for calculations (such as computing the interval between two dates or adding/subtracting intervals from a date); format conversion is required first, increasing complexity.
   - **Poor index performance**: When handling range queries (such as finding data within a specific time period), string-based indexes are usually less efficient and less flexible than indexes on native date and time types.

## Choosing Between DATETIME and TIMESTAMP

`DATETIME` and `TIMESTAMP` are two very commonly used data types in MySQL for storing values that contain both date and time information. Both can store time values accurate to the second (MySQL 5.6.4+ supports higher-precision fractional seconds). So, in real-world applications, how should we choose between the two?

Below, we compare them across several key dimensions:

### Time Zone Information

The `DATETIME` type stores **literal date and time values** and **does not contain any time zone information** itself. When you insert a `DATETIME` value, MySQL stores the exact value you provide without performing any time zone conversion.

**What problem can this cause?** If your application needs to support multiple time zones, or if server and client time zones may change, then when using `DATETIME`, the application must handle time zone conversion and interpretation itself. If handled improperly (for example, assuming all stored times belong to the same time zone while the actual environment changes), it can lead to confusion in displaying or calculating times.

**`TIMESTAMP` is time-zone-aware.** When storing a value, MySQL converts the time value in the current session's time zone into UTC (Coordinated Universal Time) for internal storage. When querying a `TIMESTAMP` field, MySQL converts the stored UTC time back into the time zone configured for the current session for display.

This means that for the same record's `TIMESTAMP` field, querying it under different session time zone settings may display different local time representations, yet they all correspond to the exact same absolute point in time (UTC time). This is very useful for applications that require globalization and multi-time-zone support.

Let's demonstrate this in practice!

Table creation SQL statement:

```sql
CREATE TABLE `time_zone_test` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `date_time` datetime DEFAULT NULL,
  `time_stamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

Insert a row (assuming the current session time zone is the system default, such as UTC+0):

```sql
INSERT INTO time_zone_test(date_time,time_stamp) VALUES(NOW(),NOW());
```

Query the data (in the same time zone session):

```sql
SELECT date_time, time_stamp FROM time_zone_test;
```

Result:

```plain
+---------------------+---------------------+
| date_time           | time_stamp          |
+---------------------+---------------------+
| 2020-01-11 09:53:32 | 2020-01-11 09:53:32 |
+---------------------+---------------------+
```

Now change the current session's time zone to UTC+8:

```sql
SET time_zone = '+8:00';
```

Query the data again:

```bash
# The TIMESTAMP value is automatically converted to UTC+8
+---------------------+---------------------+
| date_time           | time_stamp          |
+---------------------+---------------------+
| 2020-01-11 09:53:32 | 2020-01-11 17:53:32 |
+---------------------+---------------------+
```

**Bonus: Common SQL Commands for MySQL Time Zone Settings**

```sql
# View the current session time zone
SELECT @@session.time_zone;
# Set the current session time zone
SET time_zone = 'Europe/Helsinki';
SET time_zone = "+00:00";
# View the database global time zone setting
SELECT @@global.time_zone;
# Set the global time zone
SET GLOBAL time_zone = '+8:00';
SET GLOBAL time_zone = 'Europe/Helsinki';
```

### Storage Space

The figure below shows the storage space occupied by MySQL date and time types (official documentation link: <https://dev.mysql.com/doc/refman/8.0/en/storage-requirements.html>):

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/FhRGUVHFK0ujRPNA75f6CuOXQHTE-2973221a.jpg)

Before MySQL 5.6.4, the storage space of `DATETIME` and `TIMESTAMP` was fixed at 8 bytes and 4 bytes, respectively. Starting from MySQL 5.6.4, however, their storage space varies depending on fractional-second precision: `DATETIME` ranges from 5 to 8 bytes, and `TIMESTAMP` ranges from 4 to 7 bytes.

### Value Range

`TIMESTAMP` has a smaller representable range and can only go up to the year 2038:

- `DATETIME`: `'1000-01-01 00:00:00.000000'` to `'9999-12-31 23:59:59.999999'`
- `TIMESTAMP`: `'1970-01-01 00:00:01.000000'` UTC to `'2038-01-19 03:14:07.999999'` UTC

### Performance

Because `TIMESTAMP` requires conversion between UTC and the current session's time zone during storage and retrieval, this process may involve extra computational overhead, especially when underlying operating system interfaces must be invoked to obtain or process time zone information. Although modern databases and operating systems optimize this, in certain extreme high-concurrency or ultra-latency-sensitive scenarios, `DATETIME`—since it involves no time zone conversion and has simpler, more direct processing logic—may exhibit a slight performance advantage.

To obtain predictable behavior and potentially reduce `TIMESTAMP` conversion overhead, the recommended practice is to manage time zones uniformly at the application layer, or explicitly set the `time_zone` parameter at the database connection/session level rather than relying on the server's default or OS time zone.

## Is a Numeric Timestamp a Better Choice?

Beyond the two types above, integer types (`INT` or `BIGINT`) are also commonly used in practice to store so-called "Unix timestamps" (the total number of seconds, or milliseconds, elapsed from `1970-01-01 00:00:00 UTC` to the target time).

This storage approach shares some advantages of `TIMESTAMP`, and using it for date sorting and comparison operations is even more efficient and convenient across systems—after all, it simply stores numbers. Its drawback is also obvious: poor human readability, as you cannot intuitively see the exact date and time at a glance.

A timestamp is defined as follows:

> A timestamp is measured starting from a baseline time: `1970-1-1 00:00:00 +0:00`. Starting from this time, it is represented as an integer counting in seconds; as time passes, this integer keeps increasing. Thus, a single number can perfectly represent time, and this number is an absolute value—no matter where you are on Earth, the timestamp representing that moment is identical, generating the exact same number with no concept of time zones. Therefore, when transmitting time across systems, no extra conversions are needed; it is only converted into a human-readable local time string when displayed to users.

Practical usage in the database:

```sql
-- Convert a datetime string to a Unix timestamp (seconds)
mysql> SELECT UNIX_TIMESTAMP('2020-01-11 09:53:32');
+---------------------------------------+
| UNIX_TIMESTAMP('2020-01-11 09:53:32') |
+---------------------------------------+
|                            1578707612 |
+---------------------------------------+
1 row in set (0.00 sec)

-- Convert a Unix timestamp (seconds) to a datetime format
mysql> SELECT FROM_UNIXTIME(1578707612);
+---------------------------+
| FROM_UNIXTIME(1578707612) |
+---------------------------+
| 2020-01-11 09:53:32       |
+---------------------------+
1 row in set (0.01 sec)
```

## PostgreSQL Does Not Have DATETIME

Since some readers brought up PostgreSQL (PG) time types, here is an additional note. Official PG documentation on date/time types: <https://www.postgresql.org/docs/current/datatype-datetime.html>.

![Summary of PostgreSQL date/time types](/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql/pg-datetime-types-f8e8b460.png)

As you can see, PG does not have a type named `DATETIME`:

- PG's `TIMESTAMP WITHOUT TIME ZONE` is functionally closest to MySQL's `DATETIME`. It stores date and time without any time zone information, storing literal values.
- PG's `TIMESTAMP WITH TIME ZONE` (or `TIMESTAMPTZ`) is equivalent to MySQL's `TIMESTAMP`. It converts input values to UTC upon storage and converts them for display according to the current session's time zone upon retrieval.

For the vast majority of application scenarios that need to record exact points in time, `TIMESTAMPTZ` is the most recommended and robust choice in PostgreSQL because it handles time zone complexity best.

## Summary

So how should time be stored in MySQL? `DATETIME`? `TIMESTAMP`? Or a numeric timestamp?

There is no silver bullet. Many programmers feel numeric timestamps are truly great—high efficiency and highly compatible—while many others find them not intuitive enough to read.

The authors of the classic book *High Performance MySQL* recommend `TIMESTAMP` because numeric representations of time are not intuitive enough. Below is the original excerpt:

<img src="/media/jg/ext/oss.javaguide.cn/github/javaguide/mysql--3820a4ce.jpg" style="zoom:50%;" />

Each approach has its own advantages; choosing the most suitable option based on the actual scenario is the best policy. Below is a quick comparison of these three approaches to help you choose the right data type for storing time in real development:

| Type              | Storage Space | Date Format                    | Date Range                                                  | Includes Time Zone Info |
| ----------------- | ------------- | ------------------------------ | ----------------------------------------------------------- | ----------------------- |
| DATETIME          | 5~8 bytes     | YYYY-MM-DD hh:mm:ss[.fraction] | 1000-01-01 00:00:00[.000000] ~ 9999-12-31 23:59:59[.999999] | No                      |
| TIMESTAMP         | 4~7 bytes     | YYYY-MM-DD hh:mm:ss[.fraction] | 1970-01-01 00:00:01[.000000] ~ 2038-01-19 03:14:07[.999999] | Yes                     |
| Numeric Timestamp | 4 bytes       | Pure digits such as 1578707612 | Times after 1970-01-01 00:00:01                             | No                      |

**Selection Recommendations Summary:**

- The core advantage of `TIMESTAMP` lies in its built-in time zone handling capability. The database handles UTC storage and automatic conversion based on the session time zone, simplifying development for applications that need multi-time-zone support. If your application needs to handle multiple time zones, or if you want the database to manage time zone conversions automatically, `TIMESTAMP` is the natural choice (be mindful of its range limit, i.e., the Year 2038 problem).
- If the application scenario does not involve time zone conversion, or if you want the application to control time zone logic completely and need to represent dates beyond 2038, `DATETIME` is a safer choice.
- If you care heavily about comparison performance, or frequently transmit time data across systems, and can accept sacrificing readability (or always convert at the application layer), a numeric timestamp is a strong option.
