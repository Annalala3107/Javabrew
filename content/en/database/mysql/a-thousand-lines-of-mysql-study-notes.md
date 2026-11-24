---
title: A Thousand Lines of MySQL Study Notes
description: Essential summary of a thousand lines of MySQL study notes, covering core topics such as database operations, table management, SQL syntax, indexes, views, stored procedures, and triggers—ideal for quick reference and review.
category: Databases
tag:
  - MySQL
head:
  - - meta
    - name: keywords
      content: MySQL Study Notes,MySQL Command Reference,SQL Syntax,Database Operations,Table Operations,Indexes,Views,Stored Procedures,Triggers
lang: en
sourceRef: zh-ref/database/mysql/a-thousand-lines-of-mysql-study-notes.md
---

> Original source: <https://shockerli.net/post/1000-line-mysql-note/>. JavaGuide performed light formatting on this article and added a table of contents.

A very solid summary—strongly recommended to bookmark it and refer back to it whenever needed.

### Basic Operations

```sql
/* Windows Service */
-- Start MySQL
			net start mysql
-- Create Windows Service
				sc create mysql binPath= mysqld_bin_path(Note: there must be a space between the equals sign and the value)
/* Connect to and Disconnect from Server */
-- Connect to MySQL
				mysql -h host -P port -u username -p password
-- Show currently running threads
				SHOW PROCESSLIST
-- Show system variable information
				SHOW VARIABLES
```

### Database Operations

```sql
/* Database Operations */
-- View current database
    SELECT DATABASE();
-- Display current time, username, and database version
    SELECT now(), user(), version();
-- Create database
    CREATE DATABASE[ IF NOT EXISTS] db_name db_options
    db_options:
        CHARACTER SET charset_name
        COLLATE collation_name
-- View existing databases
    SHOW DATABASES[ LIKE 'PATTERN']
-- View info of a database
    SHOW CREATE DATABASE db_name
-- Modify database options
    ALTER DATABASE db_name option_info
-- Delete database
    DROP DATABASE[ IF EXISTS] db_name
        Also deletes the directory associated with this database and its contents
```

### Table Operations

```sql
/* Table Operations */
-- Create table
    CREATE [TEMPORARY] TABLE[ IF NOT EXISTS] [db_name.]table_name ( table_structure_definition )[ table_options]
        Every column must have a data type
        No trailing comma after the last column
        TEMPORARY temporary table; automatically disappears when the session ends
        For column definitions:
            column_name data_type [NOT NULL | NULL] [DEFAULT default_value] [AUTO_INCREMENT] [UNIQUE [KEY] | [PRIMARY] KEY] [COMMENT 'string']
-- Table options
    -- Character set
        CHARSET = charset_name
        If not specified on the table, the database character set is used
    -- Storage engine
        ENGINE = engine_name
        Different data structures used by tables when managing data; different structures result in different processing methods and supported features
        Common engines: InnoDB MyISAM Memory/Heap BDB Merge Example CSV MaxDB Archive
        Different engines store table structures and data in different ways
        MyISAM table files: .frm table definition, .MYD table data, .MYI table index
        InnoDB table files: .frm table definition, tablespace data and log files
        SHOW ENGINES -- Display storage engine status information
        SHOW ENGINE engine_name {LOGS|STATUS} -- Display log or status info for a storage engine
    -- Auto-increment starting value
    	AUTO_INCREMENT = row_number
    -- Data file directory
        DATA DIRECTORY = 'directory'
    -- Index file directory
        INDEX DIRECTORY = 'directory'
    -- Table comment
        COMMENT = 'string'
    -- Partition options
        PARTITION BY ... (see manual for details)
-- View all tables
    SHOW TABLES[ LIKE 'pattern']
    SHOW TABLES FROM db_name
-- View table structure
    SHOW CREATE TABLE table_name (more detailed information)
    DESC table_name / DESCRIBE table_name / EXPLAIN table_name / SHOW COLUMNS FROM table_name [LIKE 'PATTERN']
    SHOW TABLE STATUS [FROM db_name] [LIKE 'pattern']
-- Alter table
    -- Modify table-level options
        ALTER TABLE table_name table_options
        eg: ALTER TABLE table_name ENGINE=MYISAM;
    -- Rename table
        RENAME TABLE old_table_name TO new_table_name
        RENAME TABLE old_table_name TO db_name.table_name (can move a table to another database)
        -- RENAME can swap two table names
    -- Modify table column structure (13.1.2. ALTER TABLE syntax)
        ALTER TABLE table_name operation_name
        -- operation_name
            ADD[ COLUMN] column_definition -- Add column
                AFTER column_name          -- Add after the specified column
                FIRST                      -- Add as the first column
            ADD PRIMARY KEY(column_name)   -- Create primary key
            ADD UNIQUE [index_name] (column_name) -- Create unique index
            ADD INDEX [index_name] (column_name)  -- Create regular index
            DROP[ COLUMN] column_name      -- Drop column
            MODIFY[ COLUMN] column_name column_attributes -- Supports modifying column attributes, cannot rename the column (all original attributes must also be included)
            CHANGE[ COLUMN] old_column_name new_column_name column_attributes -- Supports renaming a column
            DROP PRIMARY KEY    -- Drop primary key (must remove its AUTO_INCREMENT attribute before dropping)
            DROP INDEX index_name -- Drop index
            DROP FOREIGN KEY foreign_key_name -- Drop foreign key
-- Drop table
    DROP TABLE[ IF EXISTS] table_name ...
-- Empty table data
    TRUNCATE [TABLE] table_name
-- Copy table structure
    CREATE TABLE table_name LIKE source_table_name
-- Copy table structure and data
    CREATE TABLE table_name [AS] SELECT * FROM source_table_name
-- Check table for errors
    CHECK TABLE tbl_name [, tbl_name] ... [option] ...
-- Optimize table
    OPTIMIZE [LOCAL | NO_WRITE_TO_BINLOG] TABLE tbl_name [, tbl_name] ...
-- Repair table
    REPAIR [LOCAL | NO_WRITE_TO_BINLOG] TABLE tbl_name [, tbl_name] ... [QUICK] [EXTENDED] [USE_FRM]
-- Analyze table
    ANALYZE [LOCAL | NO_WRITE_TO_BINLOG] TABLE tbl_name [, tbl_name] ...
```

### Data Operations

```sql
/* Data Operations */ ------------------
-- Insert
    INSERT [INTO] table_name [(column_list)] VALUES (value_list)[, (value_list), ...]
        -- If the value list to insert covers all columns in the exact order, the column list can be omitted.
        -- Multiple data records can be inserted at the same time!
        REPLACE is similar to INSERT, the only difference being that for a matching row, the existing row's data (compared against primary/unique key) is replaced; if there is no existing row, a new row is inserted.
    INSERT [INTO] table_name SET column_name=value[, column_name=value, ...]
-- Query
    SELECT column_list FROM table_name[ other_clauses]
        -- Columns can come from multiple tables
        -- Other clauses are optional
        -- column_list can be replaced with * to represent all columns
-- Delete
    DELETE FROM table_name[ where_condition_clause]
        Without a condition clause, all rows will be deleted
-- Update
    UPDATE table_name SET column_name=new_value[, column_name=new_value] [update_condition]
```

### Character Set Encoding

```sql
/* Character Set Encoding */ ------------------
-- MySQL server, databases, tables, and columns can all configure character sets
-- Data encoding and client encoding do not need to be identical
SHOW VARIABLES LIKE 'character_set_%'   -- View all character set encoding variables
    character_set_client        Encoding used by the client when sending data to the server
    character_set_results       Encoding used by the server when returning results to the client
    character_set_connection    Connection layer encoding
SET var_name = var_value
    SET character_set_client = gbk;
    SET character_set_results = gbk;
    SET character_set_connection = gbk;
SET NAMES GBK;  -- Equivalent to completing the three settings above
-- Collation
    Collations are used for sorting
    SHOW CHARACTER SET [LIKE 'pattern']/SHOW CHARSET [LIKE 'pattern']   View all character sets
    SHOW COLLATION [LIKE 'pattern']     View all collations
    CHARSET charset_encoding            Set character set encoding
    COLLATE collation_encoding          Set collation encoding
```

### Data Types (Column Types)

```sql
/* Data Types (Column Types) */ ------------------
1. Numeric Types
-- a. Integer Types ----------
    Type        Bytes    Range (Signed)
    tinyint     1 byte   -128 ~ 127      Unsigned: 0 ~ 255
    smallint    2 bytes  -32768 ~ 32767
    mediumint   3 bytes  -8388608 ~ 8388607
    int         4 bytes
    bigint      8 bytes
    int(M)  M indicates total display digits
    - Signed by default; modified via the unsigned attribute
    - Display width: if a number has fewer digits than configured on the column, leading 0s are padded; modified via the zerofill attribute
        Example: int(5)   Inserting '123' pads it to '00123'
    - When requirements are met, smaller is better.
    - 1 represents boolean true, 0 represents boolean false. MySQL has no native boolean type and represents it via integers 0 and 1. tinyint(1) is commonly used for boolean.
-- b. Floating-Point Types ----------
    Type                    Bytes    Range
    float (single precision) 4 bytes
    double (double precision) 8 bytes
    Floating-point types support both the unsigned attribute and the zerofill display-width attribute.
        Unlike integer types, 0s are padded at both the front and back.
    When defining floating-point types, specify total digits and decimal digits.
        float(M, D)     double(M, D)
        M indicates total digits, D indicates decimal digits.
        The values of M and D determine the range of the floating-point number, unlike the fixed range of integers.
        M indicates both total digits (excluding decimal point and sign) and display width (including all displayed symbols).
        Scientific notation is supported.
        Floating-point numbers represent approximate values.
-- c. Fixed-Point Type ----------
    decimal -- variable length
    decimal(M, D)   M also indicates total digits, D indicates decimal digits.
    Stores an exact numeric value without value alteration, unlike floating-point rounding.
    Converts the number into a string for storage, packing every 9 digits into 4 bytes.
2. String Types
-- a. char, varchar ----------
    char    Fixed-length string; fast, but wastes space
    varchar Variable-length string; slower, but saves space
    M indicates the maximum length that can be stored; this length is in characters, not bytes.
    Different encodings occupy different amounts of space.
    char: maximum 255 characters, independent of encoding.
    varchar: maximum 65535 characters, dependent on encoding.
    A valid row cannot exceed 65535 bytes in total.
        utf8 max is 21844 characters, gbk max is 32766 characters, latin1 max is 65532 characters
    varchar is variable-length and needs storage space to store its length; if data is under 255 bytes, 1 byte stores the length; otherwise 2 bytes are needed.
    The maximum effective length of varchar is determined by the maximum row size and the character set used.
    The maximum effective length is 65532 bytes, because when storing a varchar string, the first byte is unused/empty containing no data, and 2 more bytes are needed to store the string length, so effective length is 65535-1-2=65532 bytes.
    Example: If a table is defined as CREATE TABLE tb(c1 int, c2 char(30), c3 varchar(N)) charset=utf8; what is the maximum value of N? Answer: (65535-1-2-4-30*3)/3
-- b. blob, text ----------
    blob binary string (byte string)
        tinyblob, blob, mediumblob, longblob
    text non-binary string (character string)
        tinytext, text, mediumtext, longtext
    When defining text, no length needs to be specified, nor does it count toward total row length.
    text columns cannot be given a default value upon definition
-- c. binary, varbinary ----------
    Similar to char and varchar, used to store binary strings, i.e., byte strings rather than character strings.
    char, varchar, text correspond to binary, varbinary, blob.
3. Date and Time Types
    Timestamps are commonly stored as integers, because PHP can easily format timestamps.
    datetime    8 bytes  Date and time  1000-01-01 00:00:00 to 9999-12-31 23:59:59
    date        3 bytes  Date           1000-01-01 to 9999-12-31
    timestamp   4 bytes  Timestamp      19700101000000 to 2038-01-19 03:14:07
    time        3 bytes  Time           -838:59:59 to 838:59:59
    year        1 byte   Year           1901 - 2155
datetime    YYYY-MM-DD hh:mm:ss
timestamp   YY-MM-DD hh:mm:ss
            YYYYMMDDhhmmss
            YYMMDDhhmmss
            YYYYMMDDhhmmss
            YYMMDDhhmmss
date        YYYY-MM-DD
            YY-MM-DD
            YYYYMMDD
            YYMMDD
            YYYYMMDD
            YYMMDD
time        hh:mm:ss
            hhmmss
            hhmmss
year        YYYY
            YY
            YYYY
            YY
4. Enumeration and Set
-- Enumeration (enum) ----------
enum(val1, val2, val3...)
    Single selection from a set of known values. Maximum count is 65535.
    When stored, enum values are saved as 2-byte integers (smallint). Each enum value increments sequentially starting from 1 according to its position order.
    Appears as a string type, but is stored as an integer.
    The index of NULL is NULL.
    The index value of an empty-string error value is 0.
-- Set (set) ----------
set(val1, val2, val3...)
    create table tab ( gender set('Male', 'Female', 'None') );
    insert into tab values ('Male, Female');
    Can have at most 64 distinct members. Stored as bigint, totaling 8 bytes, using bitwise operations.
    When creating a table, trailing spaces in SET member values are automatically removed.
```

### Column Attributes (Column Constraints)

```sql
/* Column Attributes (Column Constraints) */ ------------------
1. PRIMARY Key
    - A column that uniquely identifies a record can serve as the primary key.
    - A table can have only one primary key.
    - Primary keys guarantee uniqueness.
    - Marked with primary key when declaring a column.
        Can also be declared after the column list
            Example: create table tab ( id int, stu varchar(10), primary key (id));
    - Primary key column values cannot be null.
    - A primary key can consist of multiple columns together. In that case it must be declared after the column list.
        Example: create table tab ( id int, stu varchar(10), age int, primary key (stu, age));
2. UNIQUE Index (Unique Constraint)
    Prevents duplicate values in a column as well.
3. NULL Constraint
    null is not a data type; it is a column attribute.
    Indicates whether the current column may be null, meaning nothing/absent.
    null, allows null. Default.
    not null, does not allow null.
    insert into tab values (null, 'val');
        -- Sets the first column value to null, depending on whether that column allows null
4. DEFAULT Value Attribute
    Default value for the current column.
    insert into tab values (default, 'val');    -- Forces using the default value.
    create table tab ( add_time timestamp default current_timestamp );
        -- Sets the current timestamp as the default value.
        current_date, current_time
5. AUTO_INCREMENT Constraint
    Auto-increment must be on an index (primary key or unique)
    At most one column can be auto-increment.
    Auto-increments starting from 1 by default. Can be set via table option auto_increment = x, or alter table tbl auto_increment = x;
6. COMMENT
    Example: create table tab ( id int ) comment 'comment content';
7. FOREIGN KEY Constraint
    Used to enforce data integrity between parent and child tables.
    alter table t1 add constraint `t1_t2_fk` foreign key (t1_id) references t2(id);
        -- Links foreign key t1_id of table t1 to column id of table t2.
        -- Every foreign key has a name, which can be specified via constraint
    The table containing the foreign key is called the child (slave) table; the referenced table is called the parent (master) table.
    Purpose: maintain data consistency and integrity, primarily to control data stored in the foreign-key table (child table).
    In MySQL, foreign key constraints can be used with the InnoDB engine:
    Syntax:
    foreign key (fk_column) references parent_table (ref_column) [action on parent delete] [action on parent update]
    This enforces that the child table's foreign key value must exist in the parent table. When unassociated, a foreign key may be set to null, provided that the foreign key column does not have not null.
    If no action is specified for parent record modification or update, operations on the parent table are rejected.
    If on update or on delete is specified, the following actions can be chosen on delete or update:
    1. cascade: cascading operation. When parent data is updated (primary key value updated), the child table is also updated (foreign key value updated). When a parent record is deleted, related child records are also deleted.
    2. set null: set to null. When parent data is updated (primary key value updated), the child table's foreign key is set to null. When a parent record is deleted, the foreign key in related child records is set to null. Note that this requires the foreign key column not to have a not null constraint.
    3. restrict: rejects parent table deletion and updates.
    Note that foreign keys are only supported by the InnoDB storage engine; other engines do not support them.

```

### Table Design Standards

```sql
/* Table Design Standards */ ------------------
    -- Normal Format, NF
        - Each table stores information for one entity
        - Each table has an ID column as its primary key
        - ID primary key + atomic tables
    -- 1NF, First Normal Form
        Satisfies First Normal Form when columns cannot be further subdivided.
    -- 2NF, Second Normal Form
        On the premise of satisfying 1NF, partial dependencies must not occur.
        Eliminating composite primary keys avoids partial dependencies. Add a single-column primary key.
    -- 3NF, Third Normal Form
        On the premise of satisfying 2NF, transitive dependencies must not occur.
        A column depends on the primary key, and another column depends on that column—this is transitive dependency.
        Place all information of one entity inside one table.
```

### SELECT

```sql
/* SELECT */ ------------------
SELECT [ALL|DISTINCT] select_expr FROM -> WHERE -> GROUP BY [aggregate_functions] -> HAVING -> ORDER BY -> LIMIT
a. select_expr
    -- * can be used to represent all columns.
        select * from tb;
    -- Expressions can be used (calculation formulas, function calls; columns are also expressions)
        select stu, 29+25, now() from tb;
    -- Aliases can be assigned to each column. Useful for simplifying column identifiers and avoiding duplicate identifiers across columns.
        - Use the as keyword, or omit as.
        select stu+10 as add10 from tb;
b. FROM Clause
    Identifies query data sources.
    -- Tables can be given aliases using the as keyword.
        SELECT * FROM tb1 AS tt, tb2 AS bb;
    -- Multiple tables can appear together after the from clause.
        -- Multiple tables are combined horizontally, forming a Cartesian product of rows.
        SELECT * FROM tb1, tb2;
    -- Hint to the optimizer on how to choose indexes
        USE INDEX, IGNORE INDEX, FORCE INDEX
        SELECT * FROM table1 USE INDEX (key1,key2) WHERE key1=1 AND key2=2 AND key3=3;
        SELECT * FROM table1 IGNORE INDEX (key3) WHERE key1=1 AND key2=2 AND key3=3;
c. WHERE Clause
    -- Filters the data source obtained from FROM.
    -- Integer 1 represents true, 0 represents false.
    -- Expressions consist of operators and operands.
        -- Operands: variables (columns), values, function return values
        -- Operators:
            =, <=>, <>, !=, <=, <, >=, >, !, &&, ||,
            in (not) null, (not) like, (not) in, (not) between and, is (not), and, or, not, xor
            is/is not with true/false/unknown tests the truth value of a value
            <=> works like <>, and <=> can be used for null comparisons
d. GROUP BY Clause (Grouping Clause)
    GROUP BY column_or_alias [sort_order]
    Sorting happens after grouping. Ascending: ASC, Descending: DESC
    The following [aggregate functions] are used with GROUP BY:
    count returns the count of distinct non-NULL values: count(*), count(column)
    sum calculates sum
    max finds maximum value
    min finds minimum value
    avg calculates average
    group_concat returns a string result with concatenated non-NULL values from a group. Intra-group string concatenation.
e. HAVING Clause (Condition Clause)
    Same functionality and usage as where, different execution timing.
    where checks data at the start to filter original rows.
    having filters the already screened/grouped results again.
    having columns must be in the selected query output, whereas where columns must exist in the data table.
    where cannot use column aliases, whereas having can. Because when WHERE executes, column values might not yet be determined.
    where cannot use aggregate functions. Typically having is used when aggregate functions are needed.
    The SQL standard requires HAVING to reference columns in the GROUP BY clause or columns used in aggregate functions.
f. ORDER BY Clause (Sorting Clause)
    order by sort_column_or_alias sort_order [,sort_column_or_alias sort_order]...
    Ascending: ASC, Descending: DESC
    Supports multi-column sorting.
g. LIMIT Clause (Result Count Limit Clause)
    Only limits the number of processed results. Treats processed results as a collection, indexed starting from 0 in order of appearance.
    limit start_offset, row_count
    Omitting the first parameter starts from index 0: limit row_count
h. DISTINCT, ALL Options
    distinct removes duplicate rows
    Default is all, returning all rows
```

### UNION

```sql
/* UNION */ ------------------
      Combines the results of multiple select queries into a single result set.
      SELECT ... UNION [ALL|DISTINCT] SELECT ...
      Default is DISTINCT mode, meaning all returned rows are unique
      It is recommended to wrap each SELECT query in parentheses.
      When sorting with ORDER BY, it must be combined with LIMIT.
      Each select query must have the same number of columns.
      The column lists (count, types) of each select query should match, because column names in the result are determined by the first select statement.
```

### Subqueries

```sql
/* Subqueries */ ------------------
    - Subqueries must be wrapped in parentheses.
-- FROM-clause subquery
    from expects a table, so the subquery result must be given an alias.
    - Simplifies conditions inside each query.
    - FROM-clause subqueries materialize results into a temporary table, which can release locks on the original table.
    - A subquery returning a table is a table subquery.
    select * from (select * from tb where id>0) as subfrom where id>1;
-- WHERE-clause subquery
    - A subquery returning a single value is a scalar subquery.
    - No alias is needed for the subquery.
    - Tables referenced inside a WHERE subquery cannot be directly used for updating.
    select * from tb where money = (select max(money) from tb);
    -- Column subquery
        When the subquery returns a single column.
        Use in or not in to perform the query
        exists and not exists conditions
            Returns 1 or 0 if the subquery returns rows. Commonly used for conditional checks.
            select column1 from t1 where exists (select * from t2);
    -- Row subquery
        The query condition is a row.
        select * from t1 where (id, gender) in (select id, gender from t2);
        Row constructor: (col1, col2, ...) or ROW(col1, col2, ...)
        Row constructors are typically used for comparison with subqueries that return two or more columns.
    -- Special operators
    != all()    Equivalent to not in
    = some()    Equivalent to in. any is an alias for some
    != some()   Not equivalent to not in; means not equal to at least one item.
    all and some can be combined with other operators.
```

### Join Queries (join)

```sql
/* Join Queries (join) */ ------------------
    Joins columns from multiple tables with an optional join condition.
-- Inner Join (inner join)
    - Default join type; inner can be omitted.
    - A join occurs only when matching data exists, meaning no null-padded empty rows appear in the result.
    on specifies the join condition. Its conditional expression is similar to where. The condition can also be omitted (meaning always true)
    where can also express join conditions.
    There is also using, which requires identical column names: using(column_name)
    -- Cross Join (cross join)
        That is, an inner join without a condition.
        select * from tb1 cross join tb2;
-- Outer Join (outer join)
    - Rows appear in the join result even if matching data does not exist.
    -- Left Outer Join (left join)
        If matching data does not exist, rows from the left table still appear, with the right side padded with null
    -- Right Outer Join (right join)
        If matching data does not exist, rows from the right table still appear, with the left side padded with null
-- Natural Join (natural join)
    Automatically determines join conditions to complete the join.
    Equivalent to omitting using; automatically looks up columns with the same name.
    natural join
    natural left join
    natural right join
select info.id, info.name, info.stu_num, extra_info.hobby, extra_info.sex from info, extra_info where info.stu_num = extra_info.stu_id;
```

### TRUNCATE

```sql
/* TRUNCATE */ ------------------
TRUNCATE [TABLE] tbl_name
Empty table data
Drop and recreate the table
Differences:
1. truncate drops and recreates the table, whereas delete deletes row by row
2. truncate resets the auto_increment counter, whereas delete does not
3. truncate does not know how many rows were deleted, whereas delete does.
4. When used on partitioned tables, truncate preserves the partitions
```

### Backup and Restore

```sql
/* Backup and Restore */ ------------------
Backup saves both table structure and table data.
Performed using the mysqldump command.
-- Export
mysqldump [options] db_name [tables]
mysqldump [options] ---database DB1 [DB2 DB3...]
mysqldump [options] --all--database
1. Export a single table
　　mysqldump -uusername -ppassword db_name table_name > filename(D:/a.sql)
2. Export multiple tables
　　mysqldump -uusername -ppassword db_name table1 table2 table3 > filename(D:/a.sql)
3. Export all tables
　　mysqldump -uusername -ppassword db_name > filename(D:/a.sql)
4. Export a database
　　mysqldump -uusername -ppassword --lock-all-tables --database db_name > filename(D:/a.sql)
Can include -w to pass a WHERE condition
-- Import
1. When logged into mysql:
　　source backup_file
2. When not logged into mysql:
　　mysql -uusername -ppassword db_name < backup_file
```

### Views

```sql
What is a view:
    A view is a virtual table whose contents are defined by a query. Like a real table, a view consists of a set of named columns and row data. However, a view does not exist as a stored set of data values in the database. Row and column data come from tables referenced by the query defining the view, and are generated dynamically when the view is referenced.
    A view has a table definition file, but no data file.
    With respect to the underlying base tables it references, a view acts like a filter. The filter defining a view can come from one or more tables in the current or other databases, or from other views. There are no restrictions on querying through a view, and few restrictions on modifying data through it.
    A view is a SQL query statement stored in the database. It is primarily used for two reasons: security—a view can hide sensitive data (for instance, on a social insurance fund table, a view can show only name and address while hiding SSN and salary); and simplicity—making complex queries easier to understand and use.
-- Create view
CREATE [OR REPLACE] [ALGORITHM = {UNDEFINED | MERGE | TEMPTABLE}] VIEW view_name [(column_list)] AS select_statement
    - The view name must be unique and cannot match an existing table name.
    - The view can use the column names selected by the select statement, or specify custom column names.
    - The execution algorithm for the view can be specified via ALGORITHM.
    - If column_list is present, its count must equal the number of columns retrieved by the SELECT statement
-- View structure
    SHOW CREATE VIEW view_name
-- Drop view
    - After dropping a view, the underlying data still exists.
    - Multiple views can be dropped at once.
    DROP VIEW [IF EXISTS] view_name ...
-- Alter view structure
    - Views are generally not altered, because not all updates to a view map back to the underlying tables.
    ALTER VIEW view_name [(column_list)] AS select_statement
-- Roles of views
    1. Simplify business logic
    2. Hide actual table structures from clients
-- View algorithms (ALGORITHM)
    MERGE       Merge
        Merges the view's query statement with the outer query first, then executes!
    TEMPTABLE   Temporary table
        Executes the view first to form a temporary table, then executes the outer query!
    UNDEFINED   Undefined (default), meaning MySQL automatically chooses the appropriate algorithm.
```

### Transactions

```sql
A transaction is a logical group of operations; all units forming this group must either all succeed or all fail.
    - Supports collective commit or collective rollback of consecutive SQL statements.
    - Transactions are a database feature for data integrity.
    - Requires the InnoDB or BDB storage engine, built on support for autocommit control.
    - InnoDB is known as a transaction-safe storage engine.
-- Start transaction
    START TRANSACTION; or BEGIN;
    Once a transaction starts, all executed SQL statements are treated as statements within the current transaction.
-- Commit transaction
    COMMIT;
-- Rollback transaction
    ROLLBACK;
    If part of the operations encounters an issue, reverts to the state before the transaction began.
-- Properties of transactions
    1. Atomicity
        A transaction is an indivisible unit of work; operations in a transaction either all occur or none occur.
    2. Consistency
        Data integrity before and after a transaction must remain consistent.
        - External data is consistent at the start and end of the transaction
        - Operations are continuous throughout the entire transaction
    3. Isolation
        When multiple users concurrently access the database, one user's transaction must not be interfered with by other users' transactions; data across concurrent transactions must be isolated from one another.
    4. Durability
        Once a transaction is committed, its changes to database data are permanent.
-- Transaction execution flow
    1. Requires a table type that supports transactions
    2. Start a transaction before executing a group of related operations
    3. After the whole group completes, if all succeed, commit; if any fails, roll back to return to the state at the start of the transaction.
-- How transactions work
    Implemented using InnoDB's autocommit feature.
    After a normal MySQL statement executes, data changes are immediately committed and visible to other clients.
    A transaction temporarily disables the "autocommit" mechanism and requires commit to persist data changes.
-- Notes
    1. Data Definition Language (DDL) statements cannot be rolled back, such as statements creating or dropping databases, and statements creating, dropping, or altering tables or stored routines.
    2. Transactions cannot be nested
-- Savepoints
    SAVEPOINT savepoint_name -- Set a transaction savepoint
    ROLLBACK TO SAVEPOINT savepoint_name -- Roll back to a savepoint
    RELEASE SAVEPOINT savepoint_name -- Delete a savepoint
-- InnoDB autocommit configuration
    SET autocommit = 0|1;   0 disables autocommit, 1 enables autocommit.
    - If disabled, normal operation results are invisible to other clients and require commit to persist data changes.
    - You can also start a transaction by turning off autocommit. However, unlike START TRANSACTION:
        SET autocommit permanently changes the server session setting until modified again (applies to the current connection).
        Whereas START TRANSACTION records the prior state, and once the transaction commits or rolls back, a new transaction must be started again (applies to the current transaction).

```

### Table Locking

```sql
/* Table Locking */
Table locking is only used to prevent other clients from performing improper reads and writes
MyISAM supports table locks; InnoDB supports row locks
-- Lock
    LOCK TABLES tbl_name [AS alias]
-- Unlock
    UNLOCK TABLES
```

### Triggers

```sql
/* Triggers */ ------------------
    A trigger is a named database object associated with a table that activates when a specific event occurs on that table
    Monitors: insert, update, and delete on records.
-- Create trigger
CREATE TRIGGER trigger_name trigger_time trigger_event ON tbl_name FOR EACH ROW trigger_stmt
    Parameters:
    trigger_time is the trigger action time. It can be before or after, indicating whether the trigger fires before or after the activating statement.
    trigger_event specifies the type of statement that activates the trigger
        INSERT: activates the trigger when a new row is inserted into the table
        UPDATE: activates the trigger when a row is modified
        DELETE: activates the trigger when a row is deleted from the table
    tbl_name: the monitored table; must be a permanent table—triggers cannot be associated with TEMPORARY tables or views.
    trigger_stmt: the statement executed when the trigger activates. To execute multiple statements, use the BEGIN...END compound statement block
-- Drop
DROP TRIGGER [schema_name.]trigger_name
You can use old and new to refer to old and new row data
    For update operations, before update is old, after update is new.
    For delete operations, only old exists.
    For insert operations, only new exists.
-- Notes
    1. A given table cannot have two triggers with the same trigger action time and event.
-- String concatenation functions
concat(str1,str2,...])
concat_ws(separator,str1,str2,...)
-- Conditional branching statements
if condition then
    statements
elseif condition then
    statements
else
    statements
end if;
-- Change outermost statement delimiter
delimiter custom_delimiter
    SQL statements
custom_delimiter
delimiter ;     -- Restore back to the original semicolon
-- Statement block wrapper
begin
    statement_block
end
-- Special execution behavior
1. Whenever a record is added, the trigger fires.
2. Insert into on duplicate key update syntax triggers:
    If no duplicate record exists, triggers before insert, after insert;
    If a duplicate record exists and is updated, triggers before insert, before update, after update;
    If a duplicate record exists but no update occurs, triggers before insert, before update
3. Replace syntax: if a matching record exists, executes before insert, before delete, after delete, after insert
```

### SQL Programming

```sql
/* SQL Programming */ ------------------
--// Local Variables ----------
-- Variable declaration
    declare var_name[,...] type [default value]
    This statement is used to declare local variables. To provide a default value for a variable, include a default clause. The value can be specified as an expression and does not need to be a constant. Without a default clause, the initial value is null.
-- Assignment
    Use set and select into statements to assign values to variables.
    - Note: global variables (user-defined variables) can be used inside functions
--// Global Variables ----------
-- Definition and assignment
The set statement can define and assign values to variables.
set @var = value;
You can also use select into to initialize and assign variables. This requires the select statement to return only one row, though it may return multiple columns, meaning multiple variables can be assigned simultaneously—the number of variables must match the number of selected columns.
You can also treat assignment as an expression executed via select. In that case, to avoid = being treated as a comparison operator, use := instead (set statements allow both = and :=).
select @var:=20;
select @v1:=id, @v2=name from t1 limit 1;
select * from tbl_name where @var:=30;
select into can assign data queried from a table to variables.
    -| select max(height) into @max_height from tb;
-- User-defined variable names
To avoid conflicts between user-defined variables and system identifiers (typically column names) in select statements, user-defined variables begin with @ before the variable name.
@var=10;
    - Once defined, the variable remains valid for the entire session lifecycle (from login to logout)
--// Control Structures ----------
-- if statement
if search_condition then
    statement_list
[elseif search_condition then
    statement_list]
...
[else
    statement_list]
end if;
-- case statement
CASE value WHEN [compare-value] THEN result
[WHEN [compare-value] THEN result ...]
[ELSE result]
END
-- while loop
[begin_label:] while search_condition do
    statement_list
end while [end_label];
- If you need to terminate a while loop early inside the loop, labels are required; labels must appear in pairs.
    -- Exit loop
        Exit the entire loop: leave
        Exit current iteration: iterate
        Determine which loop to exit by specifying the label
--// Built-in Functions ----------
-- Numeric functions
abs(x)          -- Absolute value: abs(-10.9) = 10
format(x, d)    -- Format number with thousand separators: format(1234567.456, 2) = 1,234,567.46
ceil(x)         -- Round up: ceil(10.1) = 11
floor(x)        -- Round down: floor(10.1) = 10
round(x)        -- Round to nearest integer
mod(m, n)       -- m%n m mod n modulo remainder: 10%3=1
pi()            -- Get value of pi
pow(m, n)       -- m^n
sqrt(x)         -- Square root
rand()          -- Random number
truncate(x, d)  -- Truncate to d decimal places
-- Date and time functions
now(), current_timestamp();     -- Current date and time
current_date();                 -- Current date
current_time();                 -- Current time
date('yyyy-mm-dd hh:ii:ss');    -- Extract date part
time('yyyy-mm-dd hh:ii:ss');    -- Extract time part
date_format('yyyy-mm-dd hh:ii:ss', '%d %y %a %d %m %b %j'); -- Format datetime
unix_timestamp();               -- Get unix timestamp
from_unixtime();                -- Convert timestamp to datetime
-- String functions
length(string)          -- String length in bytes
char_length(string)     -- Number of characters in string
substring(str, position [,length])      -- Extract length characters from str starting at position
replace(str ,search_str ,replace_str)   -- Replace search_str with replace_str in str
instr(string ,substring)    -- Return position of first occurrence of substring in string
concat(string [,...])   -- Concatenate strings
charset(str)            -- Return character set of string
lcase(string)           -- Convert to lowercase
left(string, length)    -- Take length characters from the left of string
load_file(file_name)    -- Read content from file
locate(substring, string [,start_position]) -- Same as instr, but allows specifying start position
lpad(string, length, pad)   -- Repeatedly prepend pad to string until length is reached
ltrim(string)           -- Remove leading spaces
repeat(string, count)   -- Repeat count times
rpad(string, length, pad)   -- Append pad after str until length is reached
rtrim(string)           -- Remove trailing spaces
strcmp(string1 ,string2)    -- Compare two strings character by character
-- Flow control functions
case when [condition] then result [when [condition] then result ...] [else result] end   Multi-branch
if(expr1,expr2,expr3)  Two-branch.
-- Aggregate functions
count()
sum();
max();
min();
avg();
group_concat()
-- Other common functions
md5();
default();
--// Stored Functions, User-Defined Functions ----------
-- Create
    CREATE FUNCTION function_name (param_list) RETURNS return_type
        function_body
    - The function name should be a valid identifier and should not conflict with existing keywords.
    - A function belongs to a database; you can use db_name.function_name to specify the owning database, otherwise it defaults to the current database.
    - The parameter list consists of "param_name" and "param_type". Separate multiple parameters with commas.
    - The function body consists of valid mysql statements, flow control, variable declarations, etc.
    - Multiple statements should be enclosed in a begin...end block.
    - There must be a return statement returning a value.
-- Drop
    DROP FUNCTION [IF EXISTS] function_name;
-- View
    SHOW FUNCTION STATUS LIKE 'partten'
    SHOW CREATE FUNCTION function_name;
-- Alter
    ALTER FUNCTION function_name function_options
--// Stored Procedures, Custom Routines ----------
-- Definition
A stored procedure is a block of code (procedure) composed of SQL statements stored in the database.
A stored procedure is typically used to complete a piece of business logic, such as registration, paying class fees, or order ingestion.
Whereas a function usually focuses on a specific computation/capability serving other programs and must be invoked inside other statements; a stored procedure cannot be called inline inside other statements and is executed standalone via call.
-- Create
CREATE PROCEDURE sp_name (param_list)
    procedure_body
Parameter list: unlike functions, parameter modes must be specified
IN, indicates input parameter
OUT, indicates output parameter
INOUT, indicates input-output parameter
Note: there is no return value.
```

### Stored Procedures

```sql
/* Stored Procedures */ ------------------
A stored procedure is a collection of executable code. Compared to functions, it is geared more toward business logic.
Invocation: CALL procedure_name
-- Notes
- Has no return value.
- Can only be called standalone; cannot be embedded inside other statements
-- Parameters
IN|OUT|INOUT param_name data_type
IN      Input: passes data from the caller into the procedure body
OUT     Output: returns processed results from the procedure body back to the client
INOUT   Input/Output: can both receive input and return output
-- Syntax
CREATE PROCEDURE procedure_name (param_list)
BEGIN
    procedure_body
END
```

### Users and Privilege Management

```sql
/* Users and Privilege Management */ ------------------
-- Reset root password
1. Stop the MySQL service
2.  [Linux] /usr/local/mysql/bin/safe_mysqld --skip-grant-tables &
    [Windows] mysqld --skip-grant-tables
3. use mysql;
4. UPDATE `user` SET PASSWORD=PASSWORD("password") WHERE `user` = "root";
5. FLUSH PRIVILEGES;
User information table: mysql.user
-- Flush privileges
FLUSH PRIVILEGES;
-- Add user
CREATE USER username IDENTIFIED BY [PASSWORD] password(string)
    - Must have the global CREATE USER privilege on the mysql database, or INSERT privilege.
    - Only creates the user; does not grant privileges.
    - Username, pay attention to quotes: e.g. 'user_name'@'192.168.1.1'
    - Password also requires quotes; numeric-only passwords must also be quoted
    - To specify a plain-text password, omit the PASSWORD keyword. To specify a hashed password returned by the PASSWORD() function, include the PASSWORD keyword
-- Rename user
RENAME USER old_user TO new_user
-- Set password
SET PASSWORD = PASSWORD('password')  -- Set password for the current user
SET PASSWORD FOR username = PASSWORD('password') -- Set password for a specified user
-- Delete user
DROP USER username
-- Grant privileges / add user
GRANT privilege_list ON table_name TO username [IDENTIFIED BY [PASSWORD] 'password']
    - all privileges indicates all privileges
    - *.* indicates all tables in all databases
    - db_name.table_name indicates a specific table in a specific database
    GRANT ALL PRIVILEGES ON `pms`.* TO 'pms'@'%' IDENTIFIED BY 'pms0817';
-- View privileges
SHOW GRANTS FOR username
    -- View current user privileges
    SHOW GRANTS; or SHOW GRANTS FOR CURRENT_USER; or SHOW GRANTS FOR CURRENT_USER();
-- Revoke privileges
REVOKE privilege_list ON table_name FROM username
REVOKE ALL PRIVILEGES, GRANT OPTION FROM username   -- Revoke all privileges
-- Privilege levels
-- To use GRANT or REVOKE, you must possess the GRANT OPTION privilege, and you must hold the privileges you are granting or revoking.
Global level: Global privileges apply to all databases on a given server, mysql.user
    GRANT ALL ON *.* and REVOKE ALL ON *.* grant and revoke only global privileges.
Database level: Database privileges apply to all objects in a given database, mysql.db, mysql.host
    GRANT ALL ON db_name.* and REVOKE ALL ON db_name.* grant and revoke only database privileges.
Table level: Table privileges apply to all columns in a given table, mysql.talbes_priv
    GRANT ALL ON db_name.tbl_name and REVOKE ALL ON db_name.tbl_name grant and revoke only table privileges.
Column level: Column privileges apply to a single column in a given table, mysql.columns_priv
    When using REVOKE, you must specify the exact same columns that were granted.
-- Privilege list
ALL [PRIVILEGES]    -- Sets all simple privileges except GRANT OPTION
ALTER   -- Allows use of ALTER TABLE
ALTER ROUTINE   -- Alter or drop stored routines
CREATE  -- Allows use of CREATE TABLE
CREATE ROUTINE  -- Create stored routines
CREATE TEMPORARY TABLES     -- Allows use of CREATE TEMPORARY TABLE
CREATE USER     -- Allows use of CREATE USER, DROP USER, RENAME USER, and REVOKE ALL PRIVILEGES.
CREATE VIEW     -- Allows use of CREATE VIEW
DELETE  -- Allows use of DELETE
DROP    -- Allows use of DROP TABLE
EXECUTE     -- Allows user to run stored routines
FILE    -- Allows use of SELECT...INTO OUTFILE and LOAD DATA INFILE
INDEX   -- Allows use of CREATE INDEX and DROP INDEX
INSERT  -- Allows use of INSERT
LOCK TABLES     -- Allows use of LOCK TABLES on tables for which you have SELECT privilege
PROCESS     -- Allows use of SHOW FULL PROCESSLIST
REFERENCES  -- Not implemented
RELOAD  -- Allows use of FLUSH
REPLICATION CLIENT  -- Allows user to query addresses of slave or master servers
REPLICATION SLAVE   -- Used for replication slave servers (reads binary log events from the master server)
SELECT  -- Allows use of SELECT
SHOW DATABASES  -- Show all databases
SHOW VIEW   -- Allows use of SHOW CREATE VIEW
SHUTDOWN    -- Allows use of mysqladmin shutdown
SUPER   -- Allows use of CHANGE MASTER, KILL, PURGE MASTER LOGS, and SET GLOBAL statements, and mysqladmin debug command; allows connecting (once) even when max_connections is reached.
UPDATE  -- Allows use of UPDATE
USAGE   -- Synonym for "no privileges"
GRANT OPTION    -- Allows granting privileges
```

### Table Maintenance

```sql
/* Table Maintenance */
-- Analyze and store the key distribution for a table
ANALYZE [LOCAL | NO_WRITE_TO_BINLOG] TABLE table_name ...
-- Check one or more tables for errors
CHECK TABLE tbl_name [, tbl_name] ... [option] ...
option = {QUICK | FAST | MEDIUM | EXTENDED | CHANGED}
-- Reclaim unused space and defragment the data file
OPTIMIZE [LOCAL | NO_WRITE_TO_BINLOG] TABLE tbl_name [, tbl_name] ...
```

### Miscellaneous

```sql
/* Miscellaneous */ ------------------
1. Backticks (`) can be used to wrap identifiers (database names, table names, column names, indexes, aliases) to avoid conflicting with reserved keywords! Chinese characters can also be used as identifiers!
2. Each database directory contains a db.opt file storing options for the current database.
3. Comments:
    Single-line comment: # comment content
    Multi-line comment: /* comment content */
    Single-line comment: -- comment content     (Standard SQL comment style; requires a whitespace character—space, TAB, newline, etc.—after the double hyphen)
4. Pattern wildcards:
    _   Any single character
    %   Any number of characters, including zero characters
    Single quotes need to be escaped as \'
5. Statement terminators in the CMD CLI can be ";", "\G", or "\g", which only affect how results are displayed. Elsewhere, always terminate with a semicolon. delimiter can modify the statement terminator for the current session.
6. SQL is case-insensitive
7. Clear the current input statement: \c
```
