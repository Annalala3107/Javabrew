---
title: Summary of SQL Syntax Fundamentals
description: Summary of SQL syntax fundamentals, systematically explaining DDL (Data Definition), DML (Data Manipulation), DQL (Data Query), and DCL (Data Control Language), covering core topics such as table operations, constraints, indexes, transactions, and join queries.
category: Databases
tag:
  - Database Fundamentals
  - SQL
head:
  - - meta
    - name: keywords
      content: SQL Syntax,DDL,DML,DQL,DCL,CREATE,SELECT,INSERT,UPDATE,DELETE,JOIN,Subquery
lang: en
sourceRef: zh-ref/database/sql/sql-syntax-summary.md
---

> This article is compiled and refined from the following two resources:
>
> - [SQL Syntax Crash Course](https://juejin.cn/post/6844903790571700231)
> - [Comprehensive MySQL Tutorial](https://www.begtut.com/mysql/mysql-tutorial.html)

## Basic Concepts

### Database Terminology

- `Database (database)` - A container that stores organized data (usually a file or a set of files).
- `Table (table)` - A structured list of data of a specific type.
- `Schema (schema)` - Information about the layout and properties of databases and tables. A schema defines how data is stored in a table, including what kind of data is stored, how the data is decomposed, how each part of the information is named, and so on. Both databases and tables have schemas.
- `Column (column)` - A field in a table. All tables consist of one or more columns.
- `Row (row)` - A record in a table.
- `Primary Key (primary key)` - A column (or a set of columns) whose values can uniquely identify each row in a table.

### SQL Syntax

SQL (Structured Query Language): standard SQL is governed by the ANSI standards committee and is therefore referred to as ANSI SQL. Each DBMS has its own implementation, such as PL/SQL, Transact-SQL, and so on.

#### SQL Syntax Structure

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/cb684d4c75fc430e92aaee226069c7da-tplv-k3u1fbpfcp-6a7eac92.png)

SQL syntax structure includes:

- **`Clause`** - A constituent component of statements and queries. (In some cases, these are optional.)
- **`Expression`** - Can produce any scalar value, or a database table consisting of columns and rows.
- **`Predicate`** - Specifies conditions that need to be evaluated under SQL three-valued logic (3VL) (true/false/unknown) or Boolean truth values, restricting the effect of statements and queries or altering program flow.
- **`Query`** - Retrieves data based on specific criteria. This is an essential component of SQL.
- **`Statement`** - Can persistently affect schemas and data, or control database transactions, program flow, connections, sessions, or diagnostics.

#### Key Points of SQL Syntax

- **SQL statements are case-insensitive**, whereas whether database table names, column names, and values are case-sensitive depends on the specific DBMS and its configuration. For example: `SELECT` is the same as `select` and `Select`.
- **Multiple SQL statements must be separated by semicolons (`;`)**.
- When processing SQL statements, **all extra whitespace is ignored**.

SQL statements can be written on a single line or split across multiple lines.

```sql
-- Single-line SQL statement

UPDATE user SET username='robot', password='robot' WHERE username = 'root';

-- Multi-line SQL statement
UPDATE user
SET username='robot', password='robot'
WHERE username = 'root';
```

SQL supports three styles of comments:

```sql
## Comment 1
-- Comment 2
/* Comment 3 */
```

### SQL Classification

#### Data Definition Language (DDL)

Data Definition Language (DDL) is the part of SQL responsible for defining data structures and database objects.

The primary function of DDL is **defining database objects**.

The core DDL commands are `CREATE`, `ALTER`, and `DROP`.

#### Data Manipulation Language (DML)

Data Manipulation Language (DML) consists of programming statements used for database operations—performing access operations on objects and data within a database.

The primary function of DML is **accessing data**, so its syntax mainly revolves around **reading from and writing to the database**.

The core DML commands are `INSERT`, `UPDATE`, `DELETE`, and `SELECT`. Together, these four commands are referred to as CRUD (Create, Read, Update, Delete).

#### Transaction Control Language (TCL)

Transaction Control Language (TCL) is used to **manage transactions in a database**. These statements are used to manage changes made by DML statements, and they also allow statements to be grouped into logical transactions.

The core TCL commands are `COMMIT` and `ROLLBACK`.

#### Data Control Language (DCL)

Data Control Language (DCL) consists of commands that control data access rights. It controls the permissions that specific user accounts have on database objects such as tables, views, stored procedures, and user-defined functions.

The core DCL commands are `GRANT` and `REVOKE`.

DCL focuses on **controlling user access permissions**, so its syntax is relatively straightforward. Privileges that can be controlled using DCL include: `CONNECT`, `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `EXECUTE`, `USAGE`, and `REFERENCES`.

Depending on the DBMS and security principals, the supported privilege controls may vary.

**Let's first introduce DML statement usage. The primary function of DML is reading from and writing to the database to perform CRUD operations.**

## CRUD Operations

CRUD (Create, Read, Update, Delete) represents the most fundamental operations among basic database operations.

### Inserting Data

The `INSERT INTO` statement is used to insert new records into a table.

**Inserting Complete Rows**

```sql
# Insert one row
INSERT INTO user
VALUES (10, 'root', 'root', 'xxxx@163.com');
# Insert multiple rows
INSERT INTO user
VALUES (10, 'root', 'root', 'xxxx@163.com'), (12, 'user1', 'user1', 'xxxx@163.com'), (18, 'user2', 'user2', 'xxxx@163.com');
```

**Inserting Partial Rows**

```sql
INSERT INTO user(username, password, email)
VALUES ('admin', 'admin', 'xxxx@163.com');
```

**Inserting Queried Data**

```sql
INSERT INTO user(username)
SELECT name
FROM account;
```

### Updating Data

The `UPDATE` statement is used to update records in a table.

```sql
UPDATE user
SET username='robot', password='robot'
WHERE username = 'root';
```

### Deleting Data

- The `DELETE` statement is used to delete records from a table.
- `TRUNCATE TABLE` empties a table, meaning it deletes all rows. Note: The `TRUNCATE` statement does not belong to DML syntax; it belongs to DDL syntax.

**Deleting Specified Data from a Table**

```sql
DELETE FROM user
WHERE username = 'robot';
```

**Emptying All Data in a Table**

```sql
TRUNCATE TABLE user;
```

### Querying Data

The `SELECT` statement is used to query data from a database.

`DISTINCT` is used to return unique, distinct values. It applies to all selected columns—meaning rows are considered identical only when the values of all columns match.

`LIMIT` restricts the number of rows returned. It can take two parameters: the first parameter is the starting row offset (0-based), and the second parameter is the total number of rows to return.

- `ASC`: Ascending order (default)
- `DESC`: Descending order

**Querying a Single Column**

```sql
SELECT prod_name
FROM products;
```

**Querying Multiple Columns**

```sql
SELECT prod_id, prod_name, prod_price
FROM products;
```

**Querying All Columns**

```sql
SELECT *
FROM products;
```

**Querying Distinct Values**

```sql
SELECT DISTINCT
vend_id FROM products;
```

**Limiting Query Results**

```sql
-- Return the first 5 rows
SELECT * FROM mytable LIMIT 5;
SELECT * FROM mytable LIMIT 0, 5;
-- Return rows 3 to 5
SELECT * FROM mytable LIMIT 2, 3;
```

## Sorting

`order by` is used to sort the result set by one or more columns. By default, records are sorted in ascending order; if you need to sort records in descending order, you can use the `desc` keyword.

When `order by` sorts by multiple columns, the column sorted first is placed in front, and subsequent columns follow after. Moreover, different columns can have different sorting rules.

```sql
SELECT * FROM products
ORDER BY prod_price DESC, prod_name ASC;
```

## Grouping

**`group by`**:

- The `group by` clause groups records into summary rows.
- `group by` returns one record per group.
- `group by` usually involves aggregate functions such as `count`, `max`, `sum`, `avg`, etc.
- `group by` can group by one or more columns.
- After `group by` groups by the grouping fields, `order by` can sort by the aggregated summary fields.

**Grouping**

```sql
SELECT cust_name, COUNT(cust_address) AS addr_num
FROM Customers GROUP BY cust_name;
```

**Sorting After Grouping**

```sql
SELECT cust_name, COUNT(cust_address) AS addr_num
FROM Customers GROUP BY cust_name
ORDER BY cust_name DESC;
```

**`having`**:

- `having` is used to filter the summarized `group by` results.
- `having` is generally used together with `group by`.
- `where` and `having` can appear in the same query.

**Filtering Data Using WHERE and HAVING**

```sql
SELECT cust_name, COUNT(*) AS NumberOfOrders
FROM Customers
WHERE cust_email IS NOT NULL
GROUP BY cust_name
HAVING COUNT(*) > 1;
```

**`having` vs `where`**:

- `where`: Filters specified rows; aggregate (grouping) functions cannot follow it. `where` comes before `group by`.
- `having`: Filters groups; generally used together with `group by` and cannot be used standalone. `having` comes after `group by`.

## Subqueries

A subquery is a SQL query nested inside a larger query, also known as an inner query or inner select; the statement containing the subquery is called an outer query or outer select. Simply put, a subquery means using the result of one `select` query (the subquery) as the data source or evaluation condition for another SQL statement (the main query).

Subqueries can be embedded in `SELECT`, `INSERT`, `UPDATE`, and `DELETE` statements, and can also be used with operators such as `=`, `<`, `>`, `IN`, `BETWEEN`, and `EXISTS`.

Subqueries are commonly used after the `WHERE` clause and the `FROM` clause:

- When used in a `WHERE` clause, depending on the operator, a subquery can return a single row and single column, multiple rows and a single column, or a single row and multiple columns. The goal is to return values that serve as conditions in the `WHERE` clause.
- When used in a `FROM` clause, it generally returns multiple rows and multiple columns, which is equivalent to returning a temporary table—matching the rule that `FROM` is followed by a table. This approach enables multi-table join queries.

> Note: MySQL only began supporting subqueries in version 4.1; earlier versions did not support them.

The basic syntax for a subquery used in a `WHERE` clause is as follows:

```sql
select column_name [, column_name ]
from   table1 [, table2 ]
where  column_name operator
    (select column_name [, column_name ]
    from table1 [, table2 ]
    [where])
```

- Subqueries must be enclosed in parentheses `( )`.
- `operator` represents the operator used in the `WHERE` clause.

The basic syntax for a subquery used in a `FROM` clause is as follows:

```sql
select column_name [, column_name ]
from (select column_name [, column_name ]
      from table1 [, table2 ]
      [where]) as temp_table_name
where  condition
```

The result returned by a subquery used in `FROM` acts like a temporary table, so you need to use the `AS` keyword to assign an alias to that temporary table.

**Nested Subqueries (Subquery Within a Subquery)**

```sql
SELECT cust_name, cust_contact
FROM customers
WHERE cust_id IN (SELECT cust_id
                  FROM orders
                  WHERE order_num IN (SELECT order_num
                                      FROM orderitems
                                      WHERE prod_id = 'RGAN01'));
```

The inner query executes before its parent query so that the result of the inner query can be passed to the outer query. You can refer to the execution process in the diagram below:

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/c439da1f5d4e4b00bdfa4316b933d764-tplv-k3u1fbpfcp-a64850d7.png)

### WHERE

- The `WHERE` clause is used to filter records, i.e., narrow down the scope of accessed data.
- `WHERE` is followed by a condition that evaluates to `true` or `false`.
- `WHERE` can be used with `SELECT`, `UPDATE`, and `DELETE`.
- Operators that can be used in a `WHERE` clause:

| Operator | Description                                                                   |
| -------- | ----------------------------------------------------------------------------- |
| =        | Equal to                                                                      |
| <>       | Not equal to. Note: In some versions of SQL, this operator may be written !=  |
| >        | Greater than                                                                  |
| <        | Less than                                                                     |
| >=       | Greater than or equal to                                                      |
| <=       | Less than or equal to                                                         |
| BETWEEN  | Within a certain range                                                        |
| LIKE     | Search for a pattern                                                          |
| IN       | Specify multiple possible values for a column                                 |

**`WHERE` Clause in a `SELECT` Statement**

```ini
SELECT * FROM Customers
WHERE cust_name = 'Kids Place';
```

**`WHERE` Clause in an `UPDATE` Statement**

```ini
UPDATE Customers
SET cust_name = 'Jack Jones'
WHERE cust_name = 'Kids Place';
```

**`WHERE` Clause in a `DELETE` Statement**

```ini
DELETE FROM Customers
WHERE cust_name = 'Kids Place';
```

### IN and BETWEEN

- The `IN` operator is used in the `WHERE` clause to match any value from a specified list of values.
- The `BETWEEN` operator is used in the `WHERE` clause to select values within a given range.

**IN Example**

```sql
SELECT *
FROM products
WHERE vend_id IN ('DLL01', 'BRS01');
```

**BETWEEN Example**

```sql
SELECT *
FROM products
WHERE prod_price BETWEEN 3 AND 5;
```

### AND, OR, NOT

- `AND`, `OR`, and `NOT` are logical operators used to combine or negate filtering conditions.
- `AND` has higher precedence than `OR`; to make evaluation order explicit, use `()`.
- The `AND` operator requires both left and right conditions to be satisfied.
- The `OR` operator requires either the left or right condition to be satisfied.
- The `NOT` operator is used to negate a condition.

**AND Example**

```sql
SELECT prod_id, prod_name, prod_price
FROM products
WHERE vend_id = 'DLL01' AND prod_price <= 4;
```

**OR Example**

```ini
SELECT prod_id, prod_name, prod_price
FROM products
WHERE vend_id = 'DLL01' OR vend_id = 'BRS01';
```

**NOT Example**

```sql
SELECT *
FROM products
WHERE prod_price NOT BETWEEN 3 AND 5;
```

### LIKE

- The `LIKE` operator is used in the `WHERE` clause to determine whether a string matches a pattern.
- Use `LIKE` only when the column stores text values.
- `LIKE` supports two wildcard matching options: `%` and `_`.
- Do not overuse wildcards; placing a wildcard at the beginning of a pattern makes matching very slow.
- `%` represents any character occurring any number of times (zero or more).
- `_` represents any single character occurring once.

**% Example**

```sql
SELECT prod_id, prod_name, prod_price
FROM products
WHERE prod_name LIKE '%bean bag%';
```

**\_ Example**

```sql
SELECT prod_id, prod_name, prod_price
FROM products
WHERE prod_name LIKE '__ inch teddy bear';
```

## Joins

`JOIN` means "to join/connect"; as the name implies, the SQL `JOIN` clause is used to combine two or more tables for querying.

When joining tables, you choose a column in each table and compare their values; two records with matching values are merged into one row. **The essence of joining tables is merging records from different tables to form a new table. Of course, this new table is temporary and exists only for the duration of the current query.**

The basic syntax for joining two tables using `JOIN` is as follows:

```sql
select table1.column1, table2.column2...
from table1
join table2
on table1.common_column1 = table2.common_column2;
```

`table1.common_column1 = table2.common_column2` is the join condition; only records satisfying this condition are merged into a single row. You can use various operators to join tables, such as `=`, `>`, `<`, `<>`, `<=`, `>=`, `!=`, `between`, `like`, or `not`, though `=` is the most common.

When two tables contain columns with the same name, you must prefix the column name with the table name to help the database engine distinguish which table the column belongs to. However, if a column name is unique across both tables, you can omit the table prefix and write only the column name.

In addition, if the join column has the same name in both tables, you can also use the `USING` clause instead of `ON`. For example:

```sql
# join....on
select c.cust_name, o.order_num
from Customers c
inner join Orders o
on c.cust_id = o.cust_id
order by c.cust_name;

# If the join column name is identical in both tables, you can also use the USING clause: join....using()
select c.cust_name, o.order_num
from Customers c
inner join Orders o
using(cust_id)
order by c.cust_name;
```

**Difference Between `ON` and `WHERE`**:

- When joining tables, SQL generates a new temporary table according to the join condition. `ON` is the join condition that determines how the temporary table is generated.
- `WHERE` filters the data in the temporary table after it has been generated to produce the final result set; at this stage, `JOIN-ON` is no longer involved.

In summary: **SQL first generates a temporary table based on `ON`, and then filters that temporary table based on `WHERE`**.

SQL allows adding modifier keywords to the left of `JOIN` to form different types of joins, as shown in the table below:

| Join Type                                | Description                                                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| INNER JOIN (Inner Join)                  | (Default join type) Returns rows only when matching records exist in both tables.                                          |
| LEFT JOIN / LEFT OUTER JOIN              | Returns all rows from the left table, even if there are no matching rows in the right table.                               |
| RIGHT JOIN / RIGHT OUTER JOIN            | Returns all rows from the right table, even if there are no matching rows in the left table.                               |
| FULL JOIN / FULL OUTER JOIN              | Returns rows whenever there is a match in either of the tables.                                                            |
| SELF JOIN                                | Joins a table to itself as if it were two tables. To distinguish the two instances, at least one table alias is required.  |
| CROSS JOIN                               | Cross join; returns the Cartesian product of the record sets from two or more joined tables.                               |

The diagram below illustrates the 7 usage patterns related to `LEFT JOIN`, `RIGHT JOIN`, `INNER JOIN`, and `OUTER JOIN`.

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/701670942f0f45d3a3a2187cd04a12ad-tplv-k3u1fbpfcp-3d53f3fd.png)

If no modifier keyword is specified and only `JOIN` is written, it defaults to `INNER JOIN`.

For `INNER JOIN`, there is also an implicit syntax called an "**implicit inner join**," which omits the `INNER JOIN` keyword and uses the `WHERE` clause to achieve the inner join effect:

```sql
# Implicit inner join
select c.cust_name, o.order_num
from Customers c, Orders o
where c.cust_id = o.cust_id
order by c.cust_name;

# Explicit inner join
select c.cust_name, o.order_num
from Customers c inner join Orders o
using(cust_id)
order by c.cust_name;
```

## Combining Queries

The `UNION` operator combines the results of two or more queries and produces a single result set containing the rows retrieved from the queries participating in the `UNION`.

Basic rules for `UNION`:

- All queries must have the same number of columns in the same order.
- The data types of corresponding columns across queries must be the same or compatible.
- Returned column names are usually taken from the first query.

By default, the `UNION` operator selects distinct values. If duplicate values are allowed, use `UNION ALL`.

```sql
SELECT column_name(s) FROM table1
UNION ALL
SELECT column_name(s) FROM table2;
```

The column names in a `UNION` result set are always equal to the column names in the first `SELECT` statement of the `UNION`.

`JOIN` vs `UNION`:

- In `JOIN`, the columns of the joined tables may differ, whereas in `UNION`, all queries must have the same number and order of columns.
- `UNION` stacks rows from queries together (vertically), whereas `JOIN` places columns from queries side by side (horizontally), i.e., forming a Cartesian product.

## Functions

Functions often vary across different database systems and are therefore not portable. This section mainly uses MySQL functions as examples.

### Text Processing

| Function             | Description                       |
| -------------------- | --------------------------------- |
| `LEFT()`, `RIGHT()`  | Leftmost or rightmost characters  |
| `LOWER()`, `UPPER()` | Convert to lowercase or uppercase |
| `LTRIM()`, `RTRIM()` | Trim leading or trailing spaces   |
| `LENGTH()`           | Length, in bytes                  |
| `SOUNDEX()`          | Convert to a phonetic Soundex value |

Among them, **`SOUNDEX()`** converts a string into an alphanumeric pattern describing its phonetic representation.

```sql
SELECT *
FROM mytable
WHERE SOUNDEX(col1) = SOUNDEX('apple')
```

### Date and Time Processing

- Date format: `YYYY-MM-DD`
- Time format: `HH:MM:SS`

| Function        | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `AddDate()`     | Adds an interval to a date (days, weeks, etc.)             |
| `AddTime()`     | Adds an interval to a time (hours, minutes, etc.)          |
| `CurDate()`     | Returns the current date                                   |
| `CurTime()`     | Returns the current time                                   |
| `Date()`        | Returns the date part of a datetime value                  |
| `DateDiff()`    | Calculates the difference between two dates                |
| `Date_Add()`    | Highly flexible date arithmetic function                   |
| `Date_Format()` | Returns a formatted date or time string                    |
| `Day()`         | Returns the day-of-month part of a date                    |
| `DayOfWeek()`   | Returns the weekday index for a date                       |
| `Hour()`        | Returns the hour part of a time                            |
| `Minute()`      | Returns the minute part of a time                          |
| `Month()`       | Returns the month part of a date                           |
| `Now()`         | Returns the current date and time                          |
| `Second()`      | Returns the second part of a time                          |
| `Time()`        | Returns the time part of a datetime value                  |
| `Year()`        | Returns the year part of a date                            |

### Numeric Processing

| Function | Description        |
| -------- | ------------------ |
| SIN()    | Sine               |
| COS()    | Cosine             |
| TAN()    | Tangent            |
| ABS()    | Absolute value     |
| SQRT()   | Square root        |
| MOD()    | Remainder (modulo) |
| EXP()    | Exponential        |
| PI()     | Pi                 |
| RAND()   | Random number      |

### Aggregate Functions

| Function  | Description                           |
| --------- | ------------------------------------- |
| `AVG()`   | Returns the average value of a column |
| `COUNT()` | Returns the number of rows in a column |
| `MAX()`   | Returns the maximum value of a column |
| `MIN()`   | Returns the minimum value of a column |
| `SUM()`   | Returns the sum of values in a column |

`AVG()` ignores `NULL` rows.

Using `DISTINCT` allows aggregate functions to aggregate only distinct values.

```sql
SELECT AVG(DISTINCT col1) AS avg_col
FROM mytable
```

**Next, let's introduce DDL statement usage. The primary function of DDL is defining database objects (such as databases, tables, views, indexes, etc.).**

## Data Definition

### Database (DATABASE)

#### Creating a Database

```sql
CREATE DATABASE test;
```

#### Dropping a Database

```sql
DROP DATABASE test;
```

#### Selecting a Database

```sql
USE test;
```

### Table (TABLE)

#### Creating a Table

**Standard Creation**

```sql
CREATE TABLE user (
  id int(10) unsigned NOT NULL COMMENT 'Id',
  username varchar(64) NOT NULL DEFAULT 'default' COMMENT 'Username',
  password varchar(64) NOT NULL DEFAULT 'default' COMMENT 'Password',
  email varchar(64) NOT NULL DEFAULT 'default' COMMENT 'Email'
) COMMENT='User table';
```

**Creating a New Table from an Existing Table**

```sql
CREATE TABLE vip_user AS
SELECT * FROM user;
```

#### Dropping a Table

```sql
DROP TABLE user;
```

#### Altering a Table

**Adding a Column**

```sql
ALTER TABLE user
ADD age int(3);
```

**Dropping a Column**

```sql
ALTER TABLE user
DROP COLUMN age;
```

**Modifying a Column**

```sql
ALTER TABLE `user`
MODIFY COLUMN age tinyint;
```

**Adding a Primary Key**

```sql
ALTER TABLE user
ADD PRIMARY KEY (id);
```

**Dropping a Primary Key**

```sql
ALTER TABLE user
DROP PRIMARY KEY;
```

### View (VIEW)

Definition:

- A view is a virtual visual table based on the result set of a SQL statement.
- A view is a virtual table that contains no data itself, so indexes cannot be created on it. Operations on views work the same way as operations on regular tables.

Purpose:

- Simplify complex SQL operations, such as complex joins;
- Expose only a subset of data from the underlying tables;
- Ensure data security by granting users access only to views;
- Change data formatting and presentation.

![MySQL View](/media/jg/ext/oss.javaguide.cn/p3-juejin/ec4c975296ea4a7097879dac7c353878-tplv-k3u1fbpfcp-70171dfb.jpg)

#### Creating a View

```sql
CREATE VIEW top_10_user_view AS
SELECT id, username
FROM user
WHERE id < 10;
```

#### Dropping a View

```sql
DROP VIEW top_10_user_view;
```

### Index (INDEX)

**An index is a data structure used for fast querying and data retrieval; its essence can be viewed as a sorted data structure.**

An index serves the same purpose as a book's table of contents. For example: when looking up a character in a dictionary without an index/contents, we have to flip page by page to find the word we want, which is very slow. With a table of contents, we only need to look up the character's position there and jump straight to that page.

**Advantages**:

- Using indexes can greatly speed up data retrieval (significantly reducing the amount of data scanned), which is the primary reason for creating indexes.
- By creating unique indexes, you can ensure the uniqueness of every row of data in a database table.

**Disadvantages**:

- Creating and maintaining indexes takes considerable time. When inserting, updating, or deleting data in a table, any indexes on that data must also be dynamically updated, which reduces SQL write execution efficiency.
- Indexes require physical file storage and also consume disk space.

However, **does using an index always improve query performance?**

In most cases, index-based queries are faster than full table scans. However, if the amount of data in the database table is small, using an index may not bring much improvement.

For a detailed introduction to indexes, please read my article [Detailed Explanation of MySQL Indexes](https://javaguide.cn/database/mysql/mysql-index.html).

#### Creating an Index

```sql
CREATE INDEX user_index
ON user (id);
```

#### Adding an Index

```sql
ALTER table user ADD INDEX user_index(id)
```

#### Creating a Unique Index

```sql
CREATE UNIQUE INDEX user_index
ON user (id);
```

#### Dropping an Index

```sql
ALTER TABLE user
DROP INDEX user_index;
```

### Constraints

SQL constraints are used to specify rules for the data in a table.

If there is any violation between the constraint and a data action, the action is aborted by the constraint.

Constraints can be specified when the table is created (via the `CREATE TABLE` statement) or after the table is created (via the `ALTER TABLE` statement).

Constraint types:

- `NOT NULL` - Indicates that a column cannot store `NULL` values.
- `UNIQUE` - Ensures that every row for a column must have a unique value.
- `PRIMARY KEY` - A combination of `NOT NULL` and `UNIQUE`. Ensures a column (or a combination of two or more columns) has a unique identifier, helping to find a specific record in a table more easily and quickly.
- `FOREIGN KEY` - Ensures referential integrity so that data in one table matches values in another table.
- `CHECK` - Ensures that values in a column satisfy a specified condition.
- `DEFAULT` - Specifies a default value when no value is assigned to a column.

Using constraints when creating a table:

```sql
CREATE TABLE Users (
  Id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Auto-increment ID',
  Username VARCHAR(64) NOT NULL UNIQUE DEFAULT 'default' COMMENT 'Username',
  Password VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT 'Password',
  Email VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT 'Email address',
  Enabled TINYINT(4) DEFAULT NULL COMMENT 'Whether active',
  PRIMARY KEY (Id)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COMMENT='User table';
```

**Next, let's introduce TCL statement usage. The primary function of TCL is managing transactions in a database.**

## Transaction Processing

You cannot roll back `SELECT` statements, nor does rolling back a `SELECT` statement make sense; you also cannot roll back `CREATE` and `DROP` statements.

**MySQL uses implicit commit (autocommit) by default**, treating each executed statement as a transaction and committing it automatically. When a `START TRANSACTION` statement appears, implicit commit is turned off; once a `COMMIT` or `ROLLBACK` statement executes, the transaction closes automatically and implicit commit resumes.

You can disable autocommit via `set autocommit=0`, so changes are not committed until `set autocommit=1` (or `COMMIT`) is executed; the `autocommit` flag is per connection rather than server-wide.

Commands:

- `START TRANSACTION` - Marks the starting point of a transaction.
- `SAVEPOINT` - Creates a savepoint.
- `ROLLBACK TO` - Rolls back to a specified savepoint; if no savepoint is set, rolls back to the `START TRANSACTION` statement.
- `COMMIT` - Commits the transaction.

```sql
-- Start transaction
START TRANSACTION;

-- Insert operation A
INSERT INTO `user`
VALUES (1, 'root1', 'root1', 'xxxx@163.com');

-- Create savepoint updateA
SAVEPOINT updateA;

-- Insert operation B
INSERT INTO `user`
VALUES (2, 'root2', 'root2', 'xxxx@163.com');

-- Roll back to savepoint updateA
ROLLBACK TO updateA;

-- Commit transaction; only operation A takes effect
COMMIT;
```

**Next, let's introduce DCL statement usage. The primary function of DCL is controlling user access permissions.**

## Access Control

To grant privileges to a user account, you can use the `GRANT` command. To revoke privileges from a user, you can use the `REVOKE` command. Here we use MySQL as an example to introduce practical access control usage.

`GRANT` privilege syntax:

```sql
GRANT privilege,[privilege],.. ON privilege_level
TO user [IDENTIFIED BY password]
[REQUIRE tsl_option]
[WITH [GRANT_OPTION | resource_option]];
```

Brief explanation:

1. Specify one or more privileges after the `GRANT` keyword. If granting multiple privileges to a user, separate each privilege with a comma.
2. `ON privilege_level` determines the scope level at which the privileges apply. MySQL supports global (`*.*`), database (`database.*`), table (`database.table`), and column levels. If using the column privilege level, you must specify a single column or a comma-separated list of columns after each privilege.
3. `user` is the user to whom privileges are granted. If the user already exists, the `GRANT` statement modifies their privileges; otherwise, the `GRANT` statement creates a new user. The optional `IDENTIFIED BY` clause allows you to set a new password for the user.
4. `REQUIRE tsl_option` specifies whether the user must connect to the database server over a secure connection such as SSL or X059.
5. The optional `WITH GRANT OPTION` clause allows you to grant your own privileges to other users or revoke them from other users. In addition, you can use the `WITH` clause to allocate MySQL database server resources—for example, setting the number of connections or statements a user can make per hour. This is very useful in shared environments such as MySQL shared hosting.

`REVOKE` privilege syntax:

```sql
REVOKE   privilege_type [(column_list)]
        [, priv_type [(column_list)]]...
ON [object_type] privilege_level
FROM user [, user]...
```

Brief explanation:

1. After the `REVOKE` keyword, specify the list of privileges to revoke from the user. You need to separate privileges with commas.
2. Specify the privilege level to revoke in the `ON` clause.
3. Specify the user account(s) whose privileges are being revoked in the `FROM` clause.

`GRANT` and `REVOKE` can control access privileges at several levels:

- The entire server, using `GRANT ALL` and `REVOKE ALL`;
- An entire database, using `ON database.*`;
- A specific table, using `ON database.table`;
- Specific columns;
- Specific stored procedures.

Newly created accounts have no privileges. Accounts are defined in the form `username@host`, where `username@%` uses the default wildcard host. MySQL stores account information in the `mysql` database.

```sql
USE mysql;
SELECT user FROM user;
```

The table below describes all allowed privileges that can be used in `GRANT` and `REVOKE` statements:

| **Privilege**           | **Description**                                                                                                             | **Level**  |              |           |            |             |           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------ | --------- | ---------- | ----------- | --------- |
|                         |                                                                                                                             | **Global** | **Database** | **Table** | **Column** | **Routine** | **Proxy** |
| ALL [PRIVILEGES]        | Grants all privileges at the specified access level except `GRANT OPTION`                                                   |            |              |           |            |             |           |
| ALTER                   | Allows the user to use the `ALTER TABLE` statement                                                                          | X          | X            | X         |            |             |           |
| ALTER ROUTINE           | Allows the user to alter or drop stored routines                                                                            | X          | X            |           |            | X           |           |
| CREATE                  | Allows the user to create databases and tables                                                                              | X          | X            | X         |            |             |           |
| CREATE ROUTINE          | Allows the user to create stored routines                                                                                   | X          | X            |           |            |             |           |
| CREATE TABLESPACE       | Allows the user to create, alter, or drop tablespaces and log file groups                                                   | X          |              |           |            |             |           |
| CREATE TEMPORARY TABLES | Allows the user to create temporary tables using `CREATE TEMPORARY TABLE`                                                   | X          | X            |           |            |             |           |
| CREATE USER             | Allows the user to use `CREATE USER`, `DROP USER`, `RENAME USER`, and `REVOKE ALL PRIVILEGES` statements.                   | X          |              |           |            |             |           |
| CREATE VIEW             | Allows the user to create or modify views.                                                                                  | X          | X            | X         |            |             |           |
| DELETE                  | Allows the user to use `DELETE`                                                                                             | X          | X            | X         |            |             |           |
| DROP                    | Allows the user to drop databases, tables, and views                                                                        | X          | X            | X         |            |             |           |
| EVENT                   | Enables use of events for the Event Scheduler.                                                                              | X          | X            |           |            |             |           |
| EXECUTE                 | Allows the user to execute stored routines                                                                                  | X          | X            | X         |            |             |           |
| FILE                    | Allows the user to read any file in the database directory.                                                                 | X          |              |           |            |             |           |
| GRANT OPTION            | Allows the user to grant or revoke privileges of other accounts.                                                            | X          | X            | X         |            | X           | X         |
| INDEX                   | Allows the user to create or drop indexes.                                                                                  | X          | X            | X         |            |             |           |
| INSERT                  | Allows the user to use the `INSERT` statement                                                                               | X          | X            | X         | X          |             |           |
| LOCK TABLES             | Allows the user to use `LOCK TABLES` on tables for which they have the `SELECT` privilege                                   | X          | X            |           |            |             |           |
| PROCESS                 | Allows the user to view all processes using the `SHOW PROCESSLIST` statement.                                               | X          |              |           |            |             |           |
| PROXY                   | Enables user proxying.                                                                                                      |            |              |           |            |             |           |
| REFERENCES              | Allows the user to create foreign keys                                                                                      | X          | X            | X         | X          |             |           |
| RELOAD                  | Allows the user to use `FLUSH` operations                                                                                   | X          |              |           |            |             |           |
| REPLICATION CLIENT      | Allows the user to query to view the position of master or slave servers                                                    | X          |              |           |            |             |           |
| REPLICATION SLAVE       | Allows a replication slave to read binary log events from the master server.                                                 | X          |              |           |            |             |           |
| SELECT                  | Allows the user to use the `SELECT` statement                                                                               | X          | X            | X         | X          |             |           |
| SHOW DATABASES          | Allows the user to display all databases                                                                                    | X          |              |           |            |             |           |
| SHOW VIEW               | Allows the user to use the `SHOW CREATE VIEW` statement                                                                     | X          | X            | X         |            |             |           |
| SHUTDOWN                | Allows the user to use the `mysqladmin shutdown` command                                                                    | X          |              |           |            |             |           |
| SUPER                   | Allows the user to use other administrative operations, such as `CHANGE MASTER TO`, `KILL`, `PURGE BINARY LOGS`, `SET GLOBAL`, and `mysqladmin` commands | X | | | | | |
| TRIGGER                 | Allows the user to use `TRIGGER` operations.                                                                                | X          | X            | X         |            |             |           |
| UPDATE                  | Allows the user to use the `UPDATE` statement                                                                               | X          | X            | X         | X          |             |           |
| USAGE                   | Equivalent to "no privileges"                                                                                               |            |              |           |            |             |           |

### Creating an Account

```sql
CREATE USER myuser IDENTIFIED BY 'mypassword';
```

### Renaming an Account

```sql
UPDATE user SET user='newuser' WHERE user='myuser';
FLUSH PRIVILEGES;
```

### Dropping an Account

```sql
DROP USER myuser;
```

### Viewing Privileges

```sql
SHOW GRANTS FOR myuser;
```

### Granting Privileges

```sql
GRANT SELECT, INSERT ON *.* TO myuser;
```

### Revoking Privileges

```sql
REVOKE SELECT, INSERT ON *.* FROM myuser;
```

### Changing Passwords

```sql
SET PASSWORD FOR myuser = 'mypass';
```

## Stored Procedures

A stored procedure can be regarded as a batch of a series of SQL operations. Stored procedures can be invoked by triggers, other stored procedures, and applications written in Java, Python, PHP, and other languages.

![MySQL Stored Procedure](/media/jg/ext/oss.javaguide.cn/p3-juejin/60afdc9c9a594f079727ec64a2e698a3-tplv-k3u1fbpfcp-ade90deb.jpg)

Benefits of using stored procedures:

- Code encapsulation, ensuring a certain level of security;
- Code reuse;
- High performance because they are precompiled.

Creating stored procedures:

- Creating a stored procedure from the command line requires defining a custom delimiter, because the command line uses `;` as the statement terminator, while stored procedures themselves contain semicolons; otherwise, those semicolons would be mistaken for terminators and cause syntax errors.
- Supports three parameter types: `in`, `out`, and `inout`.
- Assigning values to variables requires using the `select into` statement.
- Only one variable can be assigned at a time; set-based operations are not supported.

Note that: **Alibaba's *Java Development Manual* strictly prohibits the use of stored procedures, because stored procedures are difficult to debug and scale, and lack portability.**

![](/media/jg/ext/oss.javaguide.cn/p3-juejin/93a5e011ade4450ebfa5d82057532a49-tplv-k3u1fbpfcp-14aedce4.png)

As for whether to use them in a project, it depends on the actual needs of the project—just weigh the pros and cons carefully!

### Creating a Stored Procedure

```sql
DROP PROCEDURE IF EXISTS `proc_adder`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `proc_adder`(IN a int, IN b int, OUT sum int)
BEGIN
    DECLARE c int;
    if a is null then set a = 0;
    end if;

    if b is null then set b = 0;
    end if;

    set sum  = a + b;
END
;;
DELIMITER ;
```

### Using a Stored Procedure

```less
set @b=5;
call proc_adder(2,@b,@s);
select @s as sum;
```

## Cursors

A cursor is a database query stored on the DBMS server; it is not a `SELECT` statement itself, but the result set retrieved by that statement.

Using a cursor inside a stored procedure allows iterating through a result set row by row.

Cursors are primarily used in interactive applications where users need to scroll through data on the screen and browse or modify it.

Clear steps for using a cursor:

- Before using a cursor, you must declare (define) it. This step does not actually retrieve any data; it merely defines the `SELECT` statement and cursor options to use.

- Once declared, the cursor must be opened for use. This process actually retrieves the data using the previously defined `SELECT` statement.

- For a cursor populated with data, fetch (retrieve) individual rows as needed.

- When finished using the cursor, you must close it and, if possible, deallocate/release it (depending on the specific DBMS).

```sql
DELIMITER $
CREATE  PROCEDURE getTotal()
BEGIN
    DECLARE total INT;
    -- Create variables to receive cursor data
    DECLARE sid INT;
    DECLARE sname VARCHAR(10);
    -- Create total variable
    DECLARE sage INT;
    -- Create end flag variable
    DECLARE done INT DEFAULT false;
    -- Create cursor
    DECLARE cur CURSOR FOR SELECT id,name,age from cursor_table where age>30;
    -- Specify handler value when cursor loop ends
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = true;
    SET total = 0;
    OPEN cur;
    FETCH cur INTO sid, sname, sage;
    WHILE(NOT done)
    DO
        SET total = total + 1;
        FETCH cur INTO sid, sname, sage;
    END WHILE;

    CLOSE cur;
    SELECT total;
END $
DELIMITER ;

-- Call stored procedure
call getTotal();
```

## Triggers

A trigger is a database object associated with table operations. When a specified event occurs on the table to which the trigger belongs, that object is invoked—that is, table operations trigger the execution of the trigger defined on the table.

We can use triggers for audit trails, recording modifications into another table.

Advantages of using triggers:

- SQL triggers provide an alternative way to check data integrity.
- SQL triggers can catch errors in business logic at the database layer.
- SQL triggers provide an alternative way to run scheduled tasks. Using SQL triggers, you do not have to wait for scheduled tasks to run, because triggers are automatically invoked before or after data changes in a table.
- SQL triggers are very useful for auditing data changes in tables.

Disadvantages of using triggers:

- SQL triggers can only provide extended validation and cannot replace all validation. Simple validations still need to be performed at the application layer—for example, validating user input on the client side using JavaScript or on the server side using server-side scripting languages (such as JSP, PHP, ASP.NET, Perl).
- Invoking and executing SQL triggers is invisible from the client application, making it difficult to figure out what is happening at the database layer.
- SQL triggers may increase database server overhead.

MySQL does not allow using `CALL` statements inside triggers—that is, triggers cannot invoke stored procedures.

> Note: In MySQL, the semicolon `;` is the statement terminator; encountering a semicolon signals that the statement has ended and MySQL can start executing it. Therefore, when the interpreter encounters a semicolon inside a trigger's action body, it starts executing immediately and throws an error because it has not yet found the `END` matching `BEGIN`.
>
> That is when the `DELIMITER` command is used (`DELIMITER` means delimiter/separator). It is a command that does not require a statement terminator, with syntax `DELIMITER new_delimiter`. `new_delimiter` can be set to a symbol of one or more characters; the default is the semicolon `;`, and we can change it to another symbol, such as `$` via `DELIMITER $`. Subsequent statements ending with semicolons will not be executed by the interpreter until `$` is encountered as the end of the statement. Remember to change it back afterward.

Prior to MySQL 5.7.2, at most six triggers could be defined per table:

- `BEFORE INSERT` - Activated before inserting data into the table.
- `AFTER INSERT` - Activated after inserting data into the table.
- `BEFORE UPDATE` - Activated before updating data in the table.
- `AFTER UPDATE` - Activated after updating data in the table.
- `BEFORE DELETE` - Activated before deleting data from the table.
- `AFTER DELETE` - Activated after deleting data from the table.

However, starting from MySQL 5.7.2+, multiple triggers can be defined for the same trigger event and action time.

**`NEW` and `OLD`**:

- MySQL defines the `NEW` and `OLD` keywords to represent the row in the trigger's table that fired the trigger.
- In an `INSERT` trigger, `NEW` represents the new data that is about to be (`BEFORE`) or has already been (`AFTER`) inserted;
- In an `UPDATE` trigger, `OLD` represents the original data about to be or already modified, and `NEW` represents the new data about to be or already updated to;
- In a `DELETE` trigger, `OLD` represents the original data about to be or already deleted;
- Usage: `NEW.columnName` (`columnName` is the name of a column in the corresponding table).

### Creating a Trigger

> Tip: To understand the key aspects of triggers, it helps to first learn the command for creating a trigger.

The `CREATE TRIGGER` command is used to create a trigger.

Syntax:

```sql
CREATE TRIGGER trigger_name
trigger_time
trigger_event
ON table_name
FOR EACH ROW
BEGIN
  trigger_statements
END;
```

Explanation:

- `trigger_name`: Name of the trigger
- `trigger_time`: Trigger timing. Takes the value `BEFORE` or `AFTER`.
- `trigger_event`: Trigger listening event. Takes the value `INSERT`, `UPDATE`, or `DELETE`.
- `table_name`: Target table monitored by the trigger. Specifies which table the trigger is created on.
- `FOR EACH ROW`: Row-level monitoring; fixed MySQL syntax (differs in other DBMSs).
- `trigger_statements`: Trigger execution body. A list of one or more SQL statements, each of which must end with a semicolon `;`.

When the trigger condition is met, the trigger action statements between `BEGIN` and `END` will be executed.

Example:

```sql
DELIMITER $
CREATE TRIGGER `trigger_insert_user`
AFTER INSERT ON `user`
FOR EACH ROW
BEGIN
    INSERT INTO `user_history`(user_id, operate_type, operate_time)
    VALUES (NEW.id, 'add a user',  now());
END $
DELIMITER ;
```

### Viewing Triggers

```sql
SHOW TRIGGERS;
```

### Dropping Triggers

```sql
DROP TRIGGER IF EXISTS trigger_insert_user;
```

## Recommended Reading

- [Essential for Backend Developers: High-Performance SQL Optimization Guide! 35+ Optimization Tips to Master Right Away!](https://mp.weixin.qq.com/s/I-ZT3zGTNBZ6egS7T09jyQ)
- [Essential for Backend Developers: 30 Tips for Writing High-Quality SQL](https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247486461&idx=1&sn=60a22279196d084cc398936fe3b37772&chksm=cea24436f9d5cd20a4fa0e907590f3e700d7378b3f608d7b33bb52cfb96f503b7ccb65a1deed&token=1987003517&lang=zh_CN#rd)
