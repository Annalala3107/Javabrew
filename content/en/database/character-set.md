---
title: "Character Sets Explained: What Is a Character Set and How to Use It?"
description: Detailed explanation of character sets and character encoding principles, analyzing common encodings such as ASCII, GB2312, GBK, UTF-8, and UTF-16, and explaining the difference between utf8 and utf8mb4 in MySQL along with solutions for storing emojis.
category: Databases
tag:
  - Database Fundamentals
head:
  - - meta
    - name: keywords
      content: Character Set,Character Encoding,UTF-8,UTF-16,GBK,GB2312,utf8mb4,ASCII,Unicode,MySQL Character Set,Emoji Storage
lang: en
sourceRef: zh-ref/database/character-set.md
---

MySQL's character encoding collection has two implementations of UTF-8: **`utf8`** and **`utf8mb4`**.

If you use **`utf8`**, errors will occur when storing emoji symbols as well as certain complex Chinese characters and Traditional Chinese characters.

Why does this happen? This article answers that question from the ground up.

## What Is a Character Set?

"Characters" is a general term for all kinds of written symbols, including scripts from various countries, punctuation marks, emojis, digits, and so on. A **character set** is a collection of characters. There are many types of character sets, and the range of characters each character set can represent usually differs—for example, some character sets cannot represent Chinese characters at all.

**Computers can only store binary data, so how should English letters, Chinese characters, emojis, and other characters be stored?**

We need to establish a one-to-one mapping between these characters and binary data—for example, the character `"a"` corresponds to `"01100001"`, and conversely `"01100001"` corresponds to `"a"`. We call the process of mapping characters to binary data "**character encoding**," and the reverse process of parsing binary data back into characters "**character decoding**."

## What Is Character Encoding?

Character encoding is a method of converting between characters in a character set and binary data in a computer; it can be thought of as a set of mapping rules. In other words, the purpose of character encoding is to enable computers to store and transmit various kinds of textual information.

Each character set has its own character encoding rules. Commonly used character encoding rules include ASCII, GB2312, GBK, GB18030, Big5, UTF-8, UTF-16, and so on.

## What Are the Common Character Sets?

Common character sets include ASCII, GB2312, GB18030, GBK, Unicode, and more.

The main differences among different character sets lie in:

- The range of characters they can represent
- Their encoding scheme

### ASCII

**ASCII** (**A**merican **S**tandard **C**ode for **I**nformation **I**nterchange) is a character set designed primarily for modern American English (which is also where ASCII's limitations lie).

**Why didn't the ASCII character set consider Chinese or other characters?** Because computers were invented by Americans, and at that time computing was still in its infancy and not yet widely used in other countries. Therefore, when the United States published the ASCII character set, compatibility with other languages was not considered.

To date, the ASCII character set defines a total of 128 characters, of which 33 are non-printable control characters (such as carriage return and delete).

An ASCII code is 1 byte (8 bits) long; for example, the ASCII code for `"a"` is `"01100001"`. However, the most significant bit is fixed to `0` merely as a check/reserved bit, while the remaining 7 bits use combinations of `0` and `1`. Thus, the ASCII character set can define 128 ($2^7$) characters.

Because the number of characters ASCII could represent was far too small, it was later extended to create **Extended ASCII**. Extended ASCII uses all 8 bits to represent a character, so Extended ASCII can define 256 ($2^8$) characters.

![ASCII Character Encoding](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/c1c6375d08ca268690cef2b13591a5b4-23b9e1ea.png)

### GB2312

As mentioned above, the ASCII character set is designed for modern American English. Consequently, many countries created character sets tailored to their own national languages.

The GB2312 character set is friendly to Chinese characters, containing over 6,700 Chinese characters and essentially covering the vast majority of commonly used Chinese characters. However, GB2312 does not support most rare characters or Traditional Chinese characters.

For English characters, GB2312 encoding is identical to ASCII and requires only 1 byte. For non-English characters, 2 bytes are required.

### GBK

The GBK character set can be regarded as an extension of GB2312; it is backward-compatible with GB2312 and includes over 20,000 Chinese characters.

The "K" in GBK is the first letter of "Kuo" in the Chinese Pinyin *Kuo Zhan* (meaning "extension").

### GB18030

GB18030 is fully compatible with both GB2312 and GBK, incorporates ethnic minority scripts used in China, and also includes Japanese and Korean Chinese-origin characters (Kanji/Hanja). It is the most comprehensive Chinese character set to date, containing over 70,000 Chinese characters.

### BIG5

BIG5 is mainly aimed at Traditional Chinese and includes over 13,000 Chinese characters.

### Unicode & UTF-8

To better support local languages, many different character sets were born.

As noted earlier, different character sets differ in the range of characters they can represent and their encoding rules. This led to a very serious problem: **opening a file containing text with the wrong encoding produces garbled text (mojibake).**

For example, opening a GB2312-encoded file using UTF-8 results in garbled characters. Example: the Chinese character `"牛"` has a hexadecimal value of `"C5A3"` when encoded in GB2312, whereas decoding `"C5A3"` with UTF-8 yields `"ţ"`.

You can encode and decode online using this website: <https://www.haomeili.net/HanZi/ZiFuBianMaZhuanHuan>

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/836c49b117ee4408871b0020b74c991d-9d827be0.png)

Now we understand the root cause of garbled text: **different or incompatible character sets were used during encoding and decoding.**

![](/media/jg/ext/oss.javaguide.cn/javaguide/a8808cbabeea49caa3af27d314fa3c02-1-bf9ca9fb.jpg)

To solve this problem, people thought: "Wouldn't it be great if we had a single character set that included all characters in the world?"

Thus, **Unicode** was born with that mission.

The Unicode character set includes nearly every known character in the world. However, Unicode itself does not specify how to store these characters (that is, how to represent them using binary data).

Then came **UTF-8** (**8**-bit **U**nicode **T**ransformation **F**ormat). Similar encodings include UTF-16 and UTF-32.

UTF-8 uses 1 to 4 bytes to encode each character, UTF-16 uses 2 or 4 bytes per character, and UTF-32 uses a fixed 4 bytes per character.

UTF-8 automatically chooses the encoding length depending on the symbol; English characters require only 1 byte, just like ASCII. Therefore, for English characters, UTF-8 encoding is identical to ASCII.

UTF-32 has the simplest rules, but its drawback is obvious: for characters like English letters, it consumes 4 times as much space as UTF-8.

**UTF-8** is currently the most widely used character encoding.

![](/media/jg/ext/oss.javaguide.cn/javaguide/1280px-Utf8webgrowth.svg-0d67cd0f.png)

## MySQL Character Sets

MySQL supports many character sets, such as GB2312, GBK, BIG5, and multiple Unicode encodings (UTF-8, UTF-16, UCS-2, UTF-32, etc.).

### Viewing Supported Character Sets

You can check supported character sets using the `SHOW CHARSET` command, which supports `LIKE` and `WHERE` clauses.

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211008164229671-612d69e3.png)

### Default Character Set

In MySQL 5.7, the default character set is `latin1`; in MySQL 8.0, the default character set is `utf8mb4`.

### Hierarchy Levels of Character Sets

Character sets in MySQL have the following hierarchy levels:

- `server` (MySQL instance level)
- `database` (database level)
- `table` (table level)
- `column` (column level)

Their precedence can simply be understood as increasing from top to bottom—meaning `column` has higher priority than `table` and the other levels above it. For example, if the MySQL instance-level character set is `utf8mb4` and a particular table's character set is `latin1`, then any column in that table without an explicit character set will use `latin1`.

#### server

Different versions of MySQL have different default `server`-level character sets: in MySQL 5.7, the default is `latin1`; in MySQL 8.0, the default is `utf8mb4`.

Of course, you can also set the `server`-level character set by specifying `--character-set-server` when starting `mysqld`.

```bash
mysqld
mysqld --character-set-server=utf8mb4
mysqld --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_0900_ai_ci
```

Or if you built and launched MySQL from source, you can specify options in the `cmake` command:

```sh
cmake . -DDEFAULT_CHARSET=latin1
# or
cmake . -DDEFAULT_CHARSET=latin1 \
  -DDEFAULT_COLLATION=latin1_german1_ci
```

In addition, you can change the value of `character_set_server` at runtime to modify the `server`-level character set.

The `server`-level character set is a global setting for the MySQL server. It not only serves as the default character set when creating or altering a database (if no other character set is specified), but also affects the connection character set between the client and the server. For details, see [MySQL Connector/J 8.0 - 6.7 Using Character Sets and Unicode](https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-reference-charsets.html).

#### database

The `database`-level character set is specified when creating or altering a database:

```sql
CREATE DATABASE db_name
    [[DEFAULT] CHARACTER SET charset_name]
    [[DEFAULT] COLLATE collation_name]

ALTER DATABASE db_name
    [[DEFAULT] CHARACTER SET charset_name]
    [[DEFAULT] COLLATE collation_name]
```

As mentioned earlier, if no character set is specified when executing the statements above, MySQL uses the `server`-level character set.

You can check a database's character set in the following ways:

```sql
USE db_name;
SELECT @@character_set_database, @@collation_database;
```

```sql
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'db_name';
```

#### table

The `table`-level character set is specified when creating or altering a table:

```sql
CREATE TABLE tbl_name (column_list)
    [[DEFAULT] CHARACTER SET charset_name]
    [COLLATE collation_name]]

ALTER TABLE tbl_name
    [[DEFAULT] CHARACTER SET charset_name]
    [COLLATE collation_name]
```

If no character set is specified when creating or altering a table, the `database`-level character set will be used.

#### column

The `column`-level character set is likewise specified when creating or altering a table, except it is defined directly on the column. Here is an example:

```sql
CREATE TABLE t1
(
    col1 VARCHAR(5)
      CHARACTER SET latin1
      COLLATE latin1_german1_ci
);
```

If no column-level character set is specified, the table-level character set will be used.

### Connection Character Sets

The character set hierarchy levels discussed above relate to storage, whereas connection character sets deal with communication with the MySQL server.

Connection character sets are closely tied to the following variables:

- `character_set_client`: Describes which character set the client uses for SQL statements sent to the server.
- `character_set_connection`: Describes which character set the server uses to translate incoming SQL statements.
- `character_set_results`: Describes which character set the server uses when returning results to the client.

Their values can be queried with the following SQL statements:

```sql
SELECT * FROM performance_schema.session_variables
WHERE VARIABLE_NAME IN (
'character_set_client', 'character_set_connection',
'character_set_results', 'collation_connection'
) ORDER BY VARIABLE_NAME;
```

```sql
SHOW SESSION VARIABLES LIKE 'character\_set\_%';
```

To modify the values of these variables, you have the following options:

1. Modify the configuration file

```properties
[mysql]
# Applies only to the MySQL client program
default-character-set=utf8mb4
```

2. Use SQL statements

```sql
set names utf8mb4
# Or modify them one by one
# SET character_set_client = utf8mb4;
# SET character_set_results = utf8mb4;
# SET collation_connection = utf8mb4;
```

### Impact of JDBC on Connection Character Sets

Have you ever encountered a situation where emojis are stored properly, yet when querying with tools like Navicat, the emojis turn into question marks? This issue is very likely caused by the JDBC driver.

As we learned above, connection character sets also affect stored and retrieved data, and the JDBC driver influences the connection character set.

`mysql-connector-java` (the JDBC driver) primarily affects the connection character set via these properties:

- `characterEncoding`
- `characterSetResults`

Take `DataGrip 2023.1.2` as an example: in its Advanced tab for data source configuration, you can see that the default value of `characterSetResults` is `utf8`. When using `mysql-connector-java 8.0.25`, the connection character set ends up being set to `utf8mb3`. In that situation, emojis are displayed as question marks, and that version of the driver does not even allow setting `characterSetResults` to `utf8mb4`—whereas upgrading to `mysql-connector-java driver 8.0.29` permits it.

For more details, see this StackOverflow answer: [DataGrip MySQL stores emojis correctly but displays them as?](https://stackoverflow.com/questions/54815419/datagrip-mysql-stores-emojis-correctly-but-displays-them-as).

### Using UTF-8

Normally, we recommend using UTF-8 as the default character encoding.

However, there is a subtle pitfall here.

MySQL's character encoding set has two UTF-8 implementations:

- **`utf8`**: The `utf8` encoding only supports `1–3` bytes. In `utf8`, Chinese characters occupy 3 bytes, while digits, English letters, and basic symbols occupy 1 byte. However, emoji symbols require 4 bytes, and some complex Chinese characters and Traditional Chinese characters also require 4 bytes.
- **`utf8mb4`**: The full, genuine implementation of UTF-8! It supports up to 4 bytes per character and therefore can store emoji symbols.

**Why are there two UTF-8 implementations?** The reason is as follows:

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211008164542347-509ed376.png)

Therefore, if you need to store `emoji` data or complex/Traditional Chinese characters in a MySQL database, the database encoding must be specified as `utf8mb4` instead of `utf8`; otherwise, an error will occur when storing the data.

Let's demonstrate this! (Environment: MySQL 5.7+)

Here is the table creation statement, where we specify the table CHARSET as `utf8`.

```sql
CREATE TABLE `user` (
  `id` varchar(66) CHARACTER SET utf8mb3 NOT NULL,
  `name` varchar(33) CHARACTER SET utf8mb3 NOT NULL,
  `phone` varchar(33) CHARACTER SET utf8mb3 DEFAULT NULL,
  `password` varchar(100) CHARACTER SET utf8mb3 DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

When we execute the following `INSERT` statement to insert data into the database, an error occurs as expected!

```sql
INSERT INTO `user` (`id`, `name`, `phone`, `password`)
VALUES
 ('A00003', 'guide哥😘😘😘', '181631312312', '123456');

```

The error message is as follows:

```plain
Incorrect string value: '\xF0\x9F\x98\x98\xF0\x9F...' for column 'name' at row 1
```

## References

- Character Sets and Character Encoding (Charset & Encoding): <https://www.cnblogs.com/skynet/archive/2011/05/03/2035105.html>
- Understand Character Sets and Character Encoding in Ten Minutes: <http://cenalulu.github.io/linux/character-encoding/>
- Unicode - Wikipedia: <https://zh.wikipedia.org/wiki/Unicode>
- GB2312 - Wikipedia: <https://zh.wikipedia.org/wiki/GB_2312>
- UTF-8 - Wikipedia: <https://zh.wikipedia.org/wiki/UTF-8>
- GB18030 - Wikipedia: <https://zh.wikipedia.org/wiki/GB_18030>
- MySQL 8.0 Documentation: <https://dev.mysql.com/doc/refman/8.0/en/charset.html>
- MySQL 5.7 Documentation: <https://dev.mysql.com/doc/refman/5.7/en/charset.html>
- MySQL Connector/J Documentation: <https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-reference-charsets.html>
