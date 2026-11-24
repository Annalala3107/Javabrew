---
title: "SQL Common Interview Questions Summary (Part 1)"
description: "Part 1 of the SQL common interview questions summary, covering basic query operations such as SELECT data retrieval, WHERE condition filtering, ORDER BY sorting, DISTINCT deduplication, and LIMIT pagination, along with Nowcoder real problem walkthroughs."
category: Database
tag:
  - Database Fundamentals
  - SQL
head:
  - - meta
    - name: keywords
      content: SQL Interview Questions,SELECT Query,WHERE Condition,ORDER BY Sorting,DISTINCT Deduplication,LIMIT Pagination,SQL Fundamentals
lang: en
sourceRef: zh-ref/database/sql/sql-questions-01.md
---

> Problem source: [Nowcoder Coding Practice - SQL Must-Know Basics](https://www.nowcoder.com/exam/oj?page=1&tab=SQL%E7%AF%87&topicId=298)

## Retrieving Data

`SELECT` is used to query data from a database.

### Retrieve All IDs from the Customers Table

Suppose we have the `Customers` table as follows:

| cust_id |
| ------- |
| A       |
| B       |
| C       |

Write a SQL statement to retrieve all `cust_id` values from the `Customers` table.

Answer:

```sql
SELECT cust_id
FROM Customers
```

### Retrieve and List Ordered Products

The `OrderItems` table has a non-null column `prod_id` representing the product ID, and contains all ordered products (some of which have been ordered multiple times).

| prod_id |
| ------- |
| a1      |
| a2      |
| a3      |
| a4      |
| a5      |
| a6      |
| a7      |

Write a SQL statement to retrieve and list a deduplicated list of all ordered products (`prod_id`).

Answer:

```sql
SELECT DISTINCT prod_id
FROM OrderItems
```

Key takeaway: `DISTINCT` is used to return only distinct (unique) values in a column.

### Retrieve All Columns

Suppose we have the `Customers` table (containing column `cust_id` representing customer ID and `cust_name` representing customer name):

| cust_id | cust_name |
| ------- | --------- |
| a1      | andy      |
| a2      | ben       |
| a3      | tony      |
| a4      | tom       |
| a5      | an        |
| a6      | lee       |
| a7      | hex       |

Write a SQL statement to retrieve all columns.

Answer:

```sql
SELECT cust_id, cust_name
FROM Customers
```

## Sorting Retrieved Data

`ORDER BY` is used to sort the result set by one or more columns. By default, records are sorted in ascending order. If you need to sort records in descending order, you can use the `DESC` keyword.

### Retrieve Customer Names and Sort Them

Given the `Customers` table, where `cust_id` represents customer ID and `cust_name` represents customer name:

| cust_id | cust_name |
| ------- | --------- |
| a1      | andy      |
| a2      | ben       |
| a3      | tony      |
| a4      | tom       |
| a5      | an        |
| a6      | lee       |
| a7      | hex       |

Retrieve all customer names (`cust_name`) from `Customers`, and display the results in reverse alphabetical order from Z to A.

Answer:

```sql
SELECT cust_name
FROM Customers
ORDER BY cust_name DESC
```

### Sort by Customer ID and Date

Given the `Orders` table:

| cust_id | order_num | order_date          |
| ------- | --------- | ------------------- |
| andy    | aaaa      | 2021-01-01 00:00:00 |
| andy    | bbbb      | 2021-01-01 12:00:00 |
| bob     | cccc      | 2021-01-10 12:00:00 |
| dick    | dddd      | 2021-01-11 00:00:00 |

Write a SQL statement to retrieve the customer ID (`cust_id`) and order number (`order_num`) from the `Orders` table, sorting the results first by customer ID and then by order date in descending order.

Answer:

```sql
# Sort by column name
# Note: order_date is descending, not order_num
SELECT cust_id, order_num
FROM Orders
ORDER BY cust_id,order_date DESC
```

Key takeaway: When `order by` sorts by multiple columns, the column sorted first is placed in front, and the column sorted later is placed behind. Furthermore, different columns can have different sort orders.

### Sort by Quantity and Price

Suppose there is an `OrderItems` table:

| quantity | item_price |
| -------- | ---------- |
| 1        | 100        |
| 10       | 1003       |
| 2        | 500        |

Write a SQL statement to display the quantity (`quantity`) and price (`item_price`) in the `OrderItems` table, sorted by quantity from highest to lowest and then by price from highest to lowest.

Answer:

```sql
SELECT quantity, item_price
FROM OrderItems
ORDER BY quantity DESC,item_price DESC
```

### Check the SQL Statement

Given the `Vendors` table:

| vend_name   |
| ----------- |
| Haidilao    |
| Xiaolongkan |
| Dalongyi    |

Is there anything wrong with the following SQL statement? Try to fix it so that it runs properly and returns results sorted in reverse order by `vend_name`.

```sql
SELECT vend_name,
FROM Vendors
ORDER vend_name DESC
```

Corrected:

```sql
SELECT vend_name
FROM Vendors
ORDER BY vend_name DESC
```

Key takeaways:

- Commas are used to separate columns from one another.
- `ORDER BY` includes `BY`, so it must be written in full and in the correct position.

## Filtering Data

`WHERE` can filter the returned data.

The following operators can be used in the `WHERE` clause:

| Operator | Description                                                             |
| :------- | :---------------------------------------------------------------------- |
| =        | Equal                                                                   |
| <>       | Not equal. **Note:** In some versions of SQL, this operator may be written as != |
| >        | Greater than                                                            |
| <        | Less than                                                               |
| >=       | Greater than or equal to                                                |
| <=       | Less than or equal to                                                   |
| BETWEEN  | Within a certain range                                                  |
| LIKE     | Search for a pattern                                                    |
| IN       | Specify multiple possible values for a column                           |

### Return Products with a Fixed Price

Given the `Products` table:

| prod_id | prod_name      | prod_price |
| ------- | -------------- | ---------- |
| a0018   | sockets        | 9.49       |
| a0019   | iphone13       | 600        |
| b0018   | gucci t-shirts | 1000       |

[Problem] Retrieve the product ID (`prod_id`) and product name (`prod_name`) from the `Products` table, returning only products priced at $9.49.

Answer:

```sql
SELECT prod_id, prod_name
FROM Products
WHERE prod_price = 9.49
```

### Return Higher-Priced Products

Given the `Products` table:

| prod_id | prod_name      | prod_price |
| ------- | -------------- | ---------- |
| a0018   | sockets        | 9.49       |
| a0019   | iphone13       | 600        |
| b0019   | gucci t-shirts | 1000       |

[Problem] Write a SQL statement to retrieve the product ID (`prod_id`) and product name (`prod_name`) from the `Products` table, returning only products priced at $9 or higher.

Answer:

```sql
SELECT prod_id, prod_name
FROM Products
WHERE prod_price >= 9
```

### Return Products and Sort by Price

Given the `Products` table:

| prod_id | prod_name | prod_price |
| ------- | --------- | ---------- |
| a0011   | egg       | 3          |
| a0019   | sockets   | 4          |
| b0019   | coffee    | 15         |

[Problem] Write a SQL statement to return the name (`prod_name`) and price (`prod_price`) of all products in the `Products` table priced between $3 and $6, and then sort the results by price.

Answer:

```sql
SELECT prod_name, prod_price
FROM Products
WHERE prod_price BETWEEN 3 AND 6
ORDER BY prod_price

# Or
SELECT prod_name, prod_price
FROM Products
WHERE prod_price >= 3 AND prod_price <= 6
ORDER BY prod_price
```

### Return More Products

The `OrderItems` table contains: order number `order_num`, and product quantity `quantity`.

| order_num | quantity |
| --------- | -------- |
| a1        | 105      |
| a2        | 1100     |
| a2        | 200      |
| a4        | 1121     |
| a5        | 10       |
| a2        | 19       |
| a7        | 5        |

[Problem] Retrieve all distinct, non-duplicate order numbers (`order_num`) from the `OrderItems` table where each order contains 100 or more items.

Answer:

```sql
SELECT order_num
FROM OrderItems
GROUP BY order_num
HAVING SUM(quantity) >= 100
```

## Advanced Data Filtering

The `AND` and `OR` operators are used to filter records based on more than one condition, and both can be combined. `AND` requires both conditions to be true, whereas `OR` only requires one of the two conditions to be true.

### Retrieve Vendor Names

The `Vendors` table has columns for vendor name (`vend_name`), vendor country (`vend_country`), and vendor state (`vend_state`).

| vend_name | vend_country | vend_state |
| --------- | ------------ | ---------- |
| apple     | USA          | CA         |
| vivo      | CNA          | shenzhen   |
| huawei    | CNA          | xian       |

[Problem] Write a SQL statement to retrieve vendor names (`vend_name`) from the `Vendors` table, returning only vendors in California (this requires filtering by both country [USA] and state [CA], as another country might also have a CA).

Answer:

```sql
SELECT vend_name
FROM Vendors
WHERE vend_country = 'USA' AND vend_state = 'CA'
```

### Retrieve and List Ordered Products

The `OrderItems` table contains all ordered products (some of which have been ordered multiple times).

| prod_id | order_num | quantity |
| ------- | --------- | -------- |
| BR01    | a1        | 105      |
| BR02    | a2        | 1100     |
| BR02    | a2        | 200      |
| BR03    | a4        | 1121     |
| BR017   | a5        | 10       |
| BR02    | a2        | 19       |
| BR017   | a7        | 5        |

[Problem] Write a SQL statement to find all orders that ordered at least 100 units of `BR01`, `BR02`, or `BR03`. You need to return the order number (`order_num`), product ID (`prod_id`), and quantity (`quantity`) from the `OrderItems` table, filtering by product ID and quantity.

Answer:

```sql
SELECT order_num, prod_id, quantity
FROM OrderItems
WHERE prod_id IN ('BR01', 'BR02', 'BR03') AND quantity >= 100
```

### Return the Names and Prices of All Products Priced Between $3 and $6

Given the `Products` table:

| prod_id | prod_name | prod_price |
| ------- | --------- | ---------- |
| a0011   | egg       | 3          |
| a0019   | sockets   | 4          |
| b0019   | coffee    | 15         |

[Problem] Write a SQL statement to return the name (`prod_name`) and price (`prod_price`) of all products priced between $3 and $6 using the `AND` operator, and then sort the results by price in ascending order.

Answer:

```sql
SELECT prod_name, prod_price
FROM Products
WHERE prod_price >= 3 and prod_price <= 6
ORDER BY prod_price
```

### Check the SQL Statement

The vendor table `Vendors` has columns for vendor name `vend_name`, vendor country `vend_country`, and vendor state/province `vend_state`.

| vend_name | vend_country | vend_state |
| --------- | ------------ | ---------- |
| apple     | USA          | CA         |
| vivo      | CNA          | shenzhen   |
| huawei    | CNA          | xian       |

[Problem] Fix the following SQL so that it returns the expected results correctly.

```sql
SELECT vend_name
FROM Vendors
ORDER BY vend_name
WHERE vend_country = 'USA' AND vend_state = 'CA';
```

Corrected:

```sql
SELECT vend_name
FROM Vendors
WHERE vend_country = 'USA' AND vend_state = 'CA'
ORDER BY vend_name
```

The `ORDER BY` clause must be placed after `WHERE`.

## Filtering with Wildcards

SQL wildcards must be used with the `LIKE` operator.

In SQL, the following wildcards can be used:

| Wildcard                         | Description                                       |
| :------------------------------- | :------------------------------------------------ |
| `%`                              | Represents zero or more characters                |
| `_`                              | Substitutes for a single character only           |
| `[charlist]`                     | Any single character in the character list        |
| `[^charlist]` or `[!charlist]`   | Any single character not in the character list    |

### Retrieve Product Names and Descriptions (1)

The `Products` table is as follows:

| prod_name | prod_desc      |
| --------- | -------------- |
| a0011     | usb            |
| a0019     | iphone13       |
| b0019     | gucci t-shirts |
| c0019     | gucci toy      |
| d0019     | lego toy       |

[Problem] Write a SQL statement to retrieve the product name (`prod_name`) and description (`prod_desc`) from the `Products` table, returning only products whose description contains the word `toy`.

Answer:

```sql
SELECT prod_name, prod_desc
FROM Products
WHERE prod_desc LIKE '%toy%'
```

### Retrieve Product Names and Descriptions (2)

The `Products` table is as follows:

| prod_name | prod_desc      |
| --------- | -------------- |
| a0011     | usb            |
| a0019     | iphone13       |
| b0019     | gucci t-shirts |
| c0019     | gucci toy      |
| d0019     | lego toy       |

[Problem] Write a SQL statement to retrieve the product name (`prod_name`) and description (`prod_desc`) from the `Products` table, returning only products where the word `toy` does not appear in the description, and finally sort the results by "product name".

Answer:

```sql
SELECT prod_name, prod_desc
FROM Products
WHERE prod_desc NOT LIKE '%toy%'
ORDER BY prod_name
```

### Retrieve Product Names and Descriptions (3)

The `Products` table is as follows:

| prod_name | prod_desc        |
| --------- | ---------------- |
| a0011     | usb              |
| a0019     | iphone13         |
| b0019     | gucci t-shirts   |
| c0019     | gucci toy        |
| d0019     | lego carrots toy |

[Problem] Write a SQL statement to retrieve the product name (`prod_name`) and description (`prod_desc`) from the `Products` table, returning only products where both `toy` and `carrots` appear in the description. There are several ways to do this, but for this challenge, use `AND` and two `LIKE` comparisons.

Answer:

```sql
SELECT prod_name, prod_desc
FROM Products
WHERE prod_desc LIKE '%toy%' AND prod_desc LIKE "%carrots%"
```

### Retrieve Product Names and Descriptions (4)

The `Products` table is as follows:

| prod_name | prod_desc        |
| --------- | ---------------- |
| a0011     | usb              |
| a0019     | iphone13         |
| b0019     | gucci t-shirts   |
| c0019     | gucci toy        |
| d0019     | lego toy carrots |

[Problem] Write a SQL statement to retrieve the product name (`prod_name`) and description (`prod_desc`) from the `Products` table, returning only products where `toy` and `carrots` both appear in the description **in that order**. Hint: You only need a single `LIKE` with three `%` symbols.

Answer:

```sql
SELECT prod_name, prod_desc
FROM Products
WHERE prod_desc LIKE '%toy%carrots%'
```

## Creating Calculated Fields

### Aliases

A common use of aliases is to rename table column fields in the retrieved results (to meet specific reporting or client requirements). Given the `Vendors` table representing supplier information, with `vend_id` for vendor ID, `vend_name` for vendor name, `vend_address` for vendor address, and `vend_city` for vendor city:

| vend_id | vend_name     | vend_address | vend_city |
| ------- | ------------- | ------------ | --------- |
| a001    | tencent cloud | address1     | shenzhen  |
| a002    | huawei cloud  | address2     | dongguan  |
| a003    | aliyun cloud  | address3     | hangzhou  |
| a003    | netease cloud | address4     | guangzhou |

[Problem] Write a SQL statement to retrieve `vend_id`, `vend_name`, `vend_address`, and `vend_city` from the `Vendors` table, renaming `vend_name` to `vname`, `vend_city` to `vcity`, and `vend_address` to `vaddress`, and sort the results in ascending order by vendor name.

Answer:

```sql
SELECT vend_id, vend_name AS vname, vend_address AS vaddress, vend_city AS vcity
FROM Vendors
ORDER BY vname
# AS can be omitted
SELECT vend_id, vend_name vname, vend_address vaddress, vend_city vcity
FROM Vendors
ORDER BY vname
```

### Discount

Our sample store is running a promotional discount, reducing all product prices by 10%. The `Products` table contains `prod_id` (product ID) and `prod_price` (product price).

[Problem] Write a SQL statement to return `prod_id`, `prod_price`, and `sale_price` from the `Products` table. `sale_price` is a calculated field containing the promotional price. Hint: You can multiply by 0.9 to get 90% of the original price (i.e., a 10% discount).

Answer:

```sql
SELECT prod_id, prod_price, prod_price * 0.9 AS sale_price
FROM Products
```

Note: `sale_price` is the name given to the calculated result, not an existing column name.

## Using Functions to Manipulate Data

### Customer Login Names

Our store is now live and creating customer accounts. All users need a login name, and the default login name is a combination of their name and city.

Given the `Customers` table below:

| cust_id | cust_name | cust_contact | cust_city |
| ------- | --------- | ------------ | --------- |
| a1      | Andy Li   | Andy Li      | Oak Park  |
| a2      | Ben Liu   | Ben Liu      | Oak Park  |
| a3      | Tony Dai  | Tony Dai     | Oak Park  |
| a4      | Tom Chen  | Tom Chen     | Oak Park  |
| a5      | An Li     | An Li        | Oak Park  |
| a6      | Lee Chen  | Lee Chen     | Oak Park  |
| a7      | Hex Liu   | Hex Liu      | Oak Park  |

[Problem] Write a SQL statement to return customer ID (`cust_id`), customer name (`cust_name`), and login name (`user_login`), where the login name is all uppercase and consists of the first two characters of the customer contact (`cust_contact`) and the first three characters of their city (`cust_city`). Hint: You need to use functions, concatenation, and aliases.

Answer:

```sql
SELECT cust_id, cust_name, UPPER(CONCAT(SUBSTRING(cust_contact, 1, 2), SUBSTRING(cust_city, 1, 3))) AS user_login
FROM Customers
```

Key takeaways:

- Substring function `SUBSTRING()`: extracts a substring; `substring(str ,n ,m)` (where `n` is the starting position and `m` is the number of characters to extract) returns `m` characters from string `str` starting at character `n`.
- Concatenation function `CONCAT()`: joins two or more strings into one string; `select concat(A,B)` concatenates strings A and B.
- Uppercase function `UPPER()`: converts the specified string to uppercase.

### Return Order Numbers and Order Dates for All Orders in January 2020

The `Orders` table is as follows:

| order_num | order_date          |
| --------- | ------------------- |
| a0001     | 2020-01-01 00:00:00 |
| a0002     | 2020-01-02 00:00:00 |
| a0003     | 2020-01-01 12:00:00 |
| a0004     | 2020-02-01 00:00:00 |
| a0005     | 2020-03-01 00:00:00 |

[Problem] Write a SQL statement to return the order number (`order_num`) and order date (`order_date`) of all orders in January 2020, and sort by order date in ascending order.

Answer:

```sql
SELECT order_num, order_date
FROM Orders
WHERE month(order_date) = '01' AND YEAR(order_date) = '2020'
ORDER BY order_date
```

You can also use wildcards:

```sql
SELECT order_num, order_date
FROM Orders
WHERE order_date LIKE '2020-01%'
ORDER BY order_date
```

Key takeaways:

- Date format: `YYYY-MM-DD`
- Time format: `HH:MM:SS`

Common functions related to date and time processing:

| Function        | Description                                            |
| --------------- | ------------------------------------------------------ |
| `ADDDATE()`     | Add to a date (days, weeks, etc.)                      |
| `ADDTIME()`     | Add to a time (hours, minutes, etc.)                   |
| `CURDATE()`     | Return the current date                                |
| `CURTIME()`     | Return the current time                                |
| `DATE()`        | Return the date part of a datetime                     |
| `DATEDIFF`      | Calculate the difference between two dates             |
| `DATE_FORMAT()` | Return a formatted date or time string                 |
| `DAY()`         | Return the day part of a date                          |
| `DAYOFWEEK()`   | Return the day of the week corresponding to a date     |
| `HOUR()`        | Return the hour part of a time                         |
| `MINUTE()`      | Return the minute part of a time                       |
| `MONTH()`       | Return the month part of a date                        |
| `NOW()`         | Return the current date and time                       |
| `SECOND()`      | Return the second part of a time                       |
| `TIME()`        | Return the time part of a datetime                     |
| `YEAR()`        | Return the year part of a date                         |

## Summarizing Data

Functions related to summarizing data:

| Function  | Description                           |
| --------- | ------------------------------------- |
| `AVG()`   | Return the average value of a column  |
| `COUNT()` | Return the number of rows in a column |
| `MAX()`   | Return the maximum value of a column  |
| `MIN()`   | Return the minimum value of a column  |
| `SUM()`   | Return the sum of values in a column  |

### Determine the Total Number of Products Sold

The `OrderItems` table represents products sold, and `quantity` represents the quantity of products sold.

| quantity |
| -------- |
| 10       |
| 100      |
| 1000     |
| 10001    |
| 2        |
| 15       |

[Problem] Write a SQL statement to determine the total number of products sold.

Answer:

```sql
SELECT Sum(quantity) AS items_ordered
FROM OrderItems
```

### Determine the Total Number of Product Item BR01 Sold

The `OrderItems` table represents products sold, `quantity` represents the quantity of products sold, and the product item is `prod_id`.

| quantity | prod_id |
| -------- | ------- |
| 10       | AR01    |
| 100      | AR10    |
| 1000     | BR01    |
| 10001    | BR010   |

[Problem] Modify the statement created above to determine the total quantity sold for product item (`prod_id`) "BR01".

Answer:

```sql
SELECT Sum(quantity) AS items_ordered
FROM OrderItems
WHERE prod_id = 'BR01'
```

### Determine the Price of the Most Expensive Product Under $10 in the Products Table

The `Products` table is as follows, where `prod_price` represents the price of the product.

| prod_price |
| ---------- |
| 9.49       |
| 600        |
| 1000       |

[Problem] Write a SQL statement to determine the price (`prod_price`) of the most expensive product in the `Products` table that costs no more than $10. Name the calculated field `max_price`.

Answer:

```sql
SELECT Max(prod_price) AS max_price
FROM Products
WHERE prod_price <= 10
```

## Grouping Data

`GROUP BY`:

- The `GROUP BY` clause groups records into summary rows.
- `GROUP BY` returns one record per group.
- `GROUP BY` usually also involves aggregate functions such as `COUNT`, `MAX`, `SUM`, `AVG`, etc.
- `GROUP BY` can group by one or more columns.
- After `GROUP BY` sorts/groups by the grouping fields, `ORDER BY` can sort by the aggregated summary fields.

`HAVING`:

- `HAVING` is used to filter the summarized `GROUP BY` results.
- `HAVING` must be used together with `GROUP BY`.
- `WHERE` and `HAVING` can be used in the same query.

`HAVING` vs `WHERE`:

- `WHERE`: filters specified rows and cannot be followed by aggregate (grouping) functions.
- `HAVING`: filters groups, must be used with `GROUP BY`, and cannot be used alone.

### Return the Number of Order Lines for Each Order Number

The `OrderItems` table contains every item of every order.

| order_num |
| --------- |
| a002      |
| a002      |
| a002      |
| a004      |
| a007      |

[Problem] Write a SQL statement to return the number of lines (`order_lines`) for each order number (`order_num`), and sort the results in ascending order by `order_lines`.

Answer:

```sql
SELECT order_num, Count(order_num) AS order_lines
FROM OrderItems
GROUP BY order_num
ORDER BY order_lines
```

Key takeaways:

1. Either `count(*)` or `count(column_name)` works; the difference is that `count(column_name)` counts non-NULL rows.
2. `order by` executes last, so column aliases can be used in it.
3. For grouped aggregation, never forget to add `group by`; otherwise, only a single row will be returned.

### Cheapest Product from Each Supplier

Given the `Products` table with column `prod_price` representing product price and `vend_id` representing vendor ID:

| vend_id | prod_price |
| ------- | ---------- |
| a0011   | 100        |
| a0019   | 0.1        |
| b0019   | 1000       |
| b0019   | 6980       |
| b0019   | 20         |

[Problem] Write a SQL statement to return a field named `cheapest_item` containing the lowest-cost product for each supplier (using `prod_price` from the `Products` table), and sort the results in ascending order from lowest cost to highest cost.

Answer:

```sql
SELECT vend_id, Min(prod_price) AS cheapest_item
FROM Products
GROUP BY vend_id
ORDER BY cheapest_item
```

### Return Order Numbers for All Orders with a Total Quantity of at Least 100

`OrderItems` represents the order items table, including: order number `order_num` and order quantity `quantity`.

| order_num | quantity |
| --------- | -------- |
| a1        | 105      |
| a2        | 1100     |
| a2        | 200      |
| a4        | 1121     |
| a5        | 10       |
| a2        | 19       |
| a7        | 5        |

[Problem] Write a SQL statement to return all order numbers whose total order quantity is at least 100, and sort the final results by order number in ascending order.

Answer:

```sql
# Direct aggregation
SELECT order_num
FROM OrderItems
GROUP BY order_num
HAVING Sum(quantity) >= 100
ORDER BY order_num

# Subquery
SELECT a.order_num
FROM (SELECT order_num, Sum(quantity) AS sum_num
    FROM OrderItems
    GROUP BY order_num
    HAVING sum_num >= 100) a
ORDER BY a.order_num
```

Key takeaways:

- `where`: filters specific rows and cannot be followed by aggregate (grouping) functions.
- `having`: filters groups, is used together with `group by`, and cannot be used alone.

### Calculate the Total

The `OrderItems` table represents order information, including columns: order number `order_num`, item selling price `item_price`, and product quantity `quantity`.

| order_num | item_price | quantity |
| --------- | ---------- | -------- |
| a1        | 10         | 105      |
| a2        | 1          | 1100     |
| a2        | 1          | 200      |
| a4        | 2          | 1121     |
| a5        | 5          | 10       |
| a2        | 1          | 19       |
| a7        | 7          | 5        |

[Problem] Write a SQL statement to aggregate by order number and return all order numbers whose total order price is at least 1000, sorting the final results by order number in ascending order.

Hint: Total price = `item_price` multiplied by `quantity`.

Answer:

```sql
SELECT order_num, Sum(item_price * quantity) AS total_price
FROM OrderItems
GROUP BY order_num
HAVING total_price >= 1000
ORDER BY order_num
```

### Check the SQL Statement

The `OrderItems` table contains `order_num` (order number).

| order_num |
| --------- |
| a002      |
| a002      |
| a002      |
| a004      |
| a007      |

[Problem] Fix the following code so that it executes properly.

```sql
SELECT order_num, COUNT(*) AS items
FROM OrderItems
GROUP BY items
HAVING COUNT(*) >= 3
ORDER BY items, order_num;
```

Corrected:

```sql
SELECT order_num, COUNT(*) AS items
FROM OrderItems
GROUP BY order_num
HAVING items >= 3
ORDER BY items, order_num;
```

## Using Subqueries

A subquery is a SQL query nested inside a larger query, also known as an inner query or inner select, while the statement containing the subquery is called an outer query or outer select. Simply put, a subquery uses the result of one `SELECT` query (the subquery) as the data source or filter condition for another SQL statement (the main query).

Subqueries can be embedded in `SELECT`, `INSERT`, `UPDATE`, and `DELETE` statements, and can be used with operators such as `=`, `<`, `>`, `IN`, `BETWEEN`, and `EXISTS`.

Subqueries are commonly placed after the `WHERE` clause and the `FROM` clause:

- When used in the `WHERE` clause, depending on the operator, a subquery can return a single row with a single column, multiple rows with a single column, or a single row with multiple columns. The purpose of the subquery is to return values that can serve as query conditions in the `WHERE` clause.
- When used in the `FROM` clause, it generally returns multiple rows and multiple columns, which acts like a temporary table and satisfies the rule that `FROM` is followed by a table. This approach enables multi-table join queries.

> Note: MySQL only started supporting subqueries in version 4.1; earlier versions did not support them.

The basic syntax for a subquery used in the `WHERE` clause is as follows:

```sql
SELECT column_name [, column_name ]
FROM table1 [, table2 ]
WHERE column_name operator
(SELECT column_name [, column_name ]
FROM table1 [, table2 ]
[WHERE])
```

- Subqueries must be enclosed in parentheses `( )`.
- `operator` represents the operator used in the `WHERE` clause, which can be a comparison operator (such as `=`, `<`, `>`, `<>`, etc.) or a logical operator (such as `IN`, `NOT IN`, `EXISTS`, `NOT EXISTS`, etc.), determined according to actual requirements.

The basic syntax for a subquery used in the `FROM` clause is as follows:

```sql
SELECT column_name [, column_name ]
FROM (SELECT column_name [, column_name ]
      FROM table1 [, table2 ]
      [WHERE]) AS temp_table_name [, ...]
[JOIN type JOIN table_name ON condition]
WHERE condition;
```

- Because the result returned by a subquery in `FROM` acts as a temporary table, you need to use the `AS` keyword to give this temporary table a name.
- Subqueries must be enclosed in parentheses `( )`.
- You can specify multiple temporary table names and join these tables using `JOIN` statements.

### Return a List of Customers Who Purchased Products Priced at $10 or More

`OrderItems` represents the order items table, containing order number `order_num` and item price `item_price`; the `Orders` table represents the orders information table, containing customer ID `cust_id` and order number `order_num`.

`OrderItems` table:

| order_num | item_price |
| --------- | ---------- |
| a1        | 10         |
| a2        | 1          |
| a2        | 1          |
| a4        | 2          |
| a5        | 5          |
| a2        | 1          |
| a7        | 7          |

`Orders` table:

| order_num | cust_id |
| --------- | ------- |
| a1        | cust10  |
| a2        | cust1   |
| a2        | cust1   |
| a4        | cust2   |
| a5        | cust5   |
| a2        | cust1   |
| a7        | cust7   |

[Problem] Using a subquery, return a list of customers who purchased products priced at $10 or more. The results do not need to be sorted.

Answer:

```sql
SELECT cust_id
FROM Orders
WHERE order_num IN (SELECT DISTINCT order_num
    FROM OrderItems
    where item_price >= 10)
```

### Determine Which Orders Purchased Product with prod_id BR01 (1)

The `OrderItems` table represents order items information, where `prod_id` is product ID; the `Orders` table represents orders, with `cust_id` representing customer ID and `order_date` representing order date.

`OrderItems` table:

| prod_id | order_num |
| ------- | --------- |
| BR01    | a0001     |
| BR01    | a0002     |
| BR02    | a0003     |
| BR02    | a0013     |

`Orders` table:

| order_num | cust_id | order_date          |
| --------- | ------- | ------------------- |
| a0001     | cust10  | 2022-01-01 00:00:00 |
| a0002     | cust1   | 2022-01-01 00:01:00 |
| a0003     | cust1   | 2022-01-02 00:00:00 |
| a0013     | cust2   | 2022-01-01 00:20:00 |

[Problem]

Write a SQL statement using a subquery to determine which orders (in `OrderItems`) purchased the product with `prod_id` `"BR01"`, and then return the customer ID (`cust_id`) and order date (`order_date`) corresponding to each product from the `Orders` table, sorted in ascending order by order date.

Answer:

```sql
# Approach 1: Subquery
SELECT cust_id,order_date
FROM Orders
WHERE order_num IN
    (SELECT order_num
     FROM OrderItems
     WHERE prod_id = 'BR01' )
ORDER BY order_date;

# Approach 2: Joining tables
SELECT b.cust_id, b.order_date
FROM OrderItems a,Orders b
WHERE a.order_num = b.order_num AND a.prod_id = 'BR01'
ORDER BY order_date
```

### Return Email Addresses of All Customers Who Purchased Product with prod_id BR01 (1)

You want to know the date when product BR01 was ordered. Given the `OrderItems` table representing order items information with `prod_id` as product ID; the `Orders` table representing orders with `cust_id` as customer ID and `order_date` as order date; and the `Customers` table containing `cust_email` (customer email) and `cust_id` (customer ID):

`OrderItems` table:

| prod_id | order_num |
| ------- | --------- |
| BR01    | a0001     |
| BR01    | a0002     |
| BR02    | a0003     |
| BR02    | a0013     |

`Orders` table:

| order_num | cust_id | order_date          |
| --------- | ------- | ------------------- |
| a0001     | cust10  | 2022-01-01 00:00:00 |
| a0002     | cust1   | 2022-01-01 00:01:00 |
| a0003     | cust1   | 2022-01-02 00:00:00 |
| a0013     | cust2   | 2022-01-01 00:20:00 |

`Customers` table represents customer information, where `cust_id` is customer ID and `cust_email` is customer email:

| cust_id | cust_email        |
| ------- | ----------------- |
| cust10  | <cust10@cust.com> |
| cust1   | <cust1@cust.com>  |
| cust2   | <cust2@cust.com>  |

[Problem] Return the email addresses (`cust_email` in the `Customers` table) of all customers who purchased the product with `prod_id` `BR01`. The results do not need to be sorted.

Hint: This involves `SELECT` statements where the innermost one returns `order_num` from the `OrderItems` table, and the middle one returns `cust_id` from the `Customers` table.

Answer:

```sql
# Approach 1: Subquery
SELECT cust_email
FROM Customers
WHERE cust_id IN (SELECT cust_id
    FROM Orders
    WHERE order_num IN (SELECT order_num
        FROM OrderItems
        WHERE prod_id = 'BR01'))

# Approach 2: Joining tables (inner join)
SELECT c.cust_email
FROM OrderItems a,Orders b,Customers c
WHERE a.order_num = b.order_num AND b.cust_id = c.cust_id AND a.prod_id = 'BR01'

# Approach 3: Joining tables (left join)
SELECT c.cust_email
FROM Orders a LEFT JOIN
  OrderItems b ON a.order_num = b.order_num LEFT JOIN
  Customers c ON a.cust_id = c.cust_id
WHERE b.prod_id = 'BR01'
```

### Return the Total Order Amount for Each Customer

We need a list of customer IDs along with the total amount they have ordered.

The `OrderItems` table represents order item information, containing order number `order_num`, item selling price `item_price`, and product quantity `quantity`.

| order_num | item_price | quantity |
| --------- | ---------- | -------- |
| a0001     | 10         | 105      |
| a0002     | 1          | 1100     |
| a0002     | 1          | 200      |
| a0013     | 2          | 1121     |
| a0003     | 5          | 10       |
| a0003     | 1          | 19       |
| a0003     | 7          | 5        |

`Orders` table has order number `order_num` and customer ID `cust_id`.

| order_num | cust_id |
| --------- | ------- |
| a0001     | cust10  |
| a0002     | cust1   |
| a0003     | cust1   |
| a0013     | cust2   |

[Problem]

Write a SQL statement to return the customer ID (`cust_id` in the `Orders` table), and use a subquery to return `total_ordered` so that the total order amount for each customer is returned, sorting the results from largest to smallest amount.

Answer:

```sql
# Approach 1: Subquery
SELECT o.cust_id, SUM(tb.total_ordered) AS `total_ordered`
FROM (SELECT order_num, SUM(item_price * quantity) AS total_ordered
    FROM OrderItems
    GROUP BY order_num) AS tb,
  Orders o
WHERE tb.order_num = o.order_num
GROUP BY o.cust_id
ORDER BY total_ordered DESC;

# Approach 2: Joining tables
SELECT b.cust_id, Sum(a.quantity * a.item_price) AS total_ordered
FROM OrderItems a,Orders b
WHERE a.order_num = b.order_num
GROUP BY cust_id
ORDER BY total_ordered DESC
```

For a detailed explanation of Approach 1, please refer to: [issue#2402: Error in Approach 1 and How to Fix It](https://github.com/Snailclimb/JavaGuide/issues/2402).

### Retrieve All Product Names and Their Total Units Sold from the Products Table

Retrieve all product names (`prod_name`) and product IDs (`prod_id`) from the `Products` table:

| prod_id | prod_name |
| ------- | --------- |
| a0001   | egg       |
| a0002   | sockets   |
| a0013   | coffee    |
| a0003   | cola      |

`OrderItems` represents the order items table, with ordered product `prod_id` and quantity sold `quantity`:

| prod_id | quantity |
| ------- | -------- |
| a0001   | 105      |
| a0002   | 1100     |
| a0002   | 200      |
| a0013   | 1121     |
| a0003   | 10       |
| a0003   | 19       |
| a0003   | 5        |

[Problem]

Write a SQL statement to retrieve all product names (`prod_name`) from the `Products` table, along with a calculated column named `quant_sold` containing the total number of units sold for each product (retrieved using a subquery and `SUM(quantity)` on the `OrderItems` table).

Answer:

```sql
# Approach 1: Subquery
SELECT p.prod_name, tb.quant_sold
FROM (SELECT prod_id, Sum(quantity) AS quant_sold
    FROM OrderItems
    GROUP BY prod_id) AS tb,
  Products p
WHERE tb.prod_id = p.prod_id

# Approach 2: Joining tables
SELECT p.prod_name, Sum(o.quantity) AS quant_sold
FROM Products p,
  OrderItems o
WHERE p.prod_id = o.prod_id
GROUP BY p.prod_name # (Cannot use p.prod_id here; it will throw an error)
```

## Joining Tables

`JOIN` means "to connect/join." As the name implies, the SQL `JOIN` clause is used to combine two or more tables for querying.

When joining tables, you select a field in each table and compare the values of these fields; two records with matching values are merged into one row. **The essence of joining tables is to combine records from different tables to form a new table. Of course, this new table is only temporary—it exists solely for the duration of the current query.**

The basic syntax for joining two tables using `JOIN` is as follows:

```sql
SELECT table1.column1, table2.column2...
FROM table1
JOIN table2
ON table1.common_column1 = table2.common_column2;
```

`table1.common_column1 = table2.common_column2` is the join condition; only records that satisfy this condition are merged into one row. You can use various operators to join tables, such as `=`, `>`, `<`, `<>`, `<=`, `>=`, `!=`, `between`, `like`, or `not`, though `=` is the most common.

When two tables contain columns with the same name, you must prefix the column name with the table name to help the database engine distinguish which table the column belongs to. Of course, if the column name is unique across both tables, you can omit the table prefix and write only the column name.

In addition, if the join column has the same name in both tables, you can also use the `USING` clause instead of `ON`. For example:

```sql
# join....on
SELECT c.cust_name, o.order_num
FROM Customers c
INNER JOIN Orders o
ON c.cust_id = o.cust_id
ORDER BY c.cust_name

# If the join column name is the same in both tables, you can also use the USING clause: JOIN....USING()
SELECT c.cust_name, o.order_num
FROM Customers c
INNER JOIN Orders o
USING(cust_id)
ORDER BY c.cust_name
```

**Difference between `ON` and `WHERE`**:

- When joining tables, SQL generates a new temporary table based on the join condition. `ON` is the join condition, and it determines how that temporary table is generated.
- `WHERE` filters the data in the temporary table after it has been generated to produce the final result set; at that stage, there is no longer a `JOIN-ON`.

So in summary: **SQL first generates a temporary table according to `ON`, and then filters that temporary table according to `WHERE`.**

SQL allows adding modifier keywords before `JOIN` to form different types of joins, as shown in the table below:

| Join Type                                | Description                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| INNER JOIN (Inner Join)                  | (Default join type) Returns rows only when matching records satisfying the condition exist in both tables.               |
| LEFT JOIN / LEFT OUTER JOIN              | Returns all rows from the left table, even if there are no matching rows in the right table.                             |
| RIGHT JOIN / RIGHT OUTER JOIN            | Returns all rows from the right table, even if there are no matching rows in the left table.                             |
| FULL JOIN / FULL OUTER JOIN              | Returns rows whenever there is a matching record in either table.                                                        |
| SELF JOIN                                | Joins a table to itself as if it were two separate tables. To distinguish them, at least one alias must be used in SQL.  |
| CROSS JOIN                               | Cross join; returns the Cartesian product of the record sets from two or more joined tables.                             |

The diagram below illustrates the 7 common usage patterns related to `LEFT JOIN`, `RIGHT JOIN`, `INNER JOIN`, and `OUTER JOIN`.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/csdn/d1794312b448516831369f869814ab39-73a6c29d.png)

If no modifier keyword is added and only `JOIN` is written, it defaults to `INNER JOIN`.

For `INNER JOIN`, there is also an implicit syntax called an "**implicit inner join**", which omits the `INNER JOIN` keyword and achieves the inner join functionality using the `WHERE` clause:

```sql
# Implicit inner join
SELECT c.cust_name, o.order_num
FROM Customers c,Orders o
WHERE c.cust_id = o.cust_id
ORDER BY c.cust_name

# Explicit inner join
SELECT c.cust_name, o.order_num
FROM Customers c
INNER JOIN Orders o
USING(cust_id)
ORDER BY c.cust_name;
```

### Return Customer Names and Related Order Numbers

The `Customers` table has columns for customer name `cust_name` and customer ID `cust_id`.

| cust_id  | cust_name |
| -------- | --------- |
| cust10   | andy      |
| cust1    | ben       |
| cust2    | tony      |
| cust22   | tom       |
| cust221  | an        |
| cust2217 | hex       |

The `Orders` order information table contains columns `order_num` (order number) and `cust_id` (customer ID).

| order_num | cust_id  |
| --------- | -------- |
| a1        | cust10   |
| a2        | cust1    |
| a3        | cust2    |
| a4        | cust22   |
| a5        | cust221  |
| a7        | cust2217 |

[Problem] Write a SQL statement to return customer names (`cust_name`) from the `Customers` table and related order numbers (`order_num`) from the `Orders` table, sorted in ascending order first by customer name and then by order number. You can try two different approaches: one using simple equijoin syntax, and the other using `INNER JOIN`.

Answer:

```sql
# Implicit inner join
SELECT c.cust_name, o.order_num
FROM Customers c,Orders o
WHERE c.cust_id = o.cust_id
ORDER BY c.cust_name,o.order_num

# Explicit inner join
SELECT c.cust_name, o.order_num
FROM Customers c
INNER JOIN Orders o
USING(cust_id)
ORDER BY c.cust_name,o.order_num;
```

### Return Customer Names, Related Order Numbers, and the Total Price of Each Order

The `Customers` table has columns for customer name `cust_name` and customer ID `cust_id`.

| cust_id  | cust_name |
| -------- | --------- |
| cust10   | andy      |
| cust1    | ben       |
| cust2    | tony      |
| cust22   | tom       |
| cust221  | an        |
| cust2217 | hex       |

The `Orders` order information table contains columns for order number `order_num` and customer ID `cust_id`.

| order_num | cust_id  |
| --------- | -------- |
| a1        | cust10   |
| a2        | cust1    |
| a3        | cust2    |
| a4        | cust22   |
| a5        | cust221  |
| a7        | cust2217 |

The `OrderItems` table contains columns for product order number `order_num`, item quantity `quantity`, and item price `item_price`.

| order_num | quantity | item_price |
| --------- | -------- | ---------- |
| a1        | 1000     | 10         |
| a2        | 200      | 10         |
| a3        | 10       | 15         |
| a4        | 25       | 50         |
| a5        | 15       | 25         |
| a7        | 7        | 7          |

[Problem] In addition to returning customer names and order numbers, return `cust_name` from the `Customers` table and the related `order_num` from the `Orders` table, add a third column `OrderTotal` containing the total price of each order, and sort the results in ascending order by customer name and then by order number.

```sql
# Simple equijoin syntax
SELECT c.cust_name, o.order_num, SUM(quantity * item_price) AS OrderTotal
FROM Customers c,Orders o,OrderItems oi
WHERE c.cust_id = o.cust_id AND o.order_num = oi.order_num
GROUP BY c.cust_name, o.order_num
ORDER BY c.cust_name, o.order_num
```

Note that some people might write it like this:

```sql
SELECT c.cust_name, o.order_num, SUM(quantity * item_price) AS OrderTotal
FROM Customers c,Orders o,OrderItems oi
WHERE c.cust_id = o.cust_id AND o.order_num = oi.order_num
GROUP BY c.cust_name
ORDER BY c.cust_name,o.order_num
```

This is wrong! Grouping only by `cust_name` does fit the problem logic, but it violates `GROUP BY` syntax rules.

In a `SELECT` statement without `GROUP BY`, `cust_name` and `order_num` can return multiple rows, whereas `sum(quantity * item_price)` returns only a single value. Using `group by cust_name` establishes a one-to-one correspondence (**grouping/aggregation**) between `cust_name` and `sum(quantity * item_price)`, so likewise `order_num` must also be included in the grouping.

> **In short, columns in `SELECT` must either all be grouped/aggregated, or none of them should be.**

### Determine Which Orders Purchased Product with prod_id BR01 (2)

The `OrderItems` table represents order items information with `prod_id` as product ID; the `Orders` table represents orders with `cust_id` as customer ID and `order_date` as order date.

`OrderItems` table:

| prod_id | order_num |
| ------- | --------- |
| BR01    | a0001     |
| BR01    | a0002     |
| BR02    | a0003     |
| BR02    | a0013     |

`Orders` table:

| order_num | cust_id | order_date          |
| --------- | ------- | ------------------- |
| a0001     | cust10  | 2022-01-01 00:00:00 |
| a0002     | cust1   | 2022-01-01 00:01:00 |
| a0003     | cust1   | 2022-01-02 00:00:00 |
| a0013     | cust2   | 2022-01-01 00:20:00 |

[Problem]

Write a SQL statement using a subquery to determine which orders (in `OrderItems`) purchased the product with `prod_id` `"BR01"`, and then return the customer ID (`cust_id`) and order date (`order_date`) corresponding to each product from the `Orders` table, sorted in ascending order by order date.

Hint: This time, use joins and simple equijoin syntax.

```sql
# Approach 1: Subquery
SELECT cust_id, order_date
FROM Orders
WHERE order_num IN (SELECT order_num
    FROM OrderItems
    WHERE prod_id = 'BR01')
ORDER BY order_date

# Approach 2: Joining tables (inner join)
SELECT cust_id, order_date
FROM Orders o INNER JOIN
  (SELECT order_num
    FROM OrderItems
    WHERE prod_id = 'BR01') tb ON o.order_num = tb.order_num
ORDER BY order_date

# Approach 3: Simplified version of Approach 2
SELECT cust_id, order_date
FROM Orders
INNER JOIN OrderItems USING(order_num)
WHERE OrderItems.prod_id = 'BR01'
ORDER BY order_date
```

### Return Email Addresses of All Customers Who Purchased Product with prod_id BR01 (2)

Given the `OrderItems` table representing order items information with `prod_id` as product ID; the `Orders` table representing orders with `cust_id` as customer ID and `order_date` as order date; and the `Customers` table containing `cust_email` (customer email) and `cust_id` (customer ID):

`OrderItems` table:

| prod_id | order_num |
| ------- | --------- |
| BR01    | a0001     |
| BR01    | a0002     |
| BR02    | a0003     |
| BR02    | a0013     |

`Orders` table:

| order_num | cust_id | order_date          |
| --------- | ------- | ------------------- |
| a0001     | cust10  | 2022-01-01 00:00:00 |
| a0002     | cust1   | 2022-01-01 00:01:00 |
| a0003     | cust1   | 2022-01-02 00:00:00 |
| a0013     | cust2   | 2022-01-01 00:20:00 |

`Customers` table represents customer information, where `cust_id` is customer ID and `cust_email` is customer email:

| cust_id | cust_email        |
| ------- | ----------------- |
| cust10  | <cust10@cust.com> |
| cust1   | <cust1@cust.com>  |
| cust2   | <cust2@cust.com>  |

[Problem] Return the email addresses (`cust_email` in the `Customers` table) of all customers who purchased the product with `prod_id` `BR01`. The results do not need to be sorted.

Hint: This involves `SELECT` statements where the innermost one returns `order_num` from the `OrderItems` table and the middle one returns `cust_id` from the `Customers` table, except you must use `INNER JOIN` syntax.

```sql
SELECT cust_email
FROM Customers
INNER JOIN Orders using(cust_id)
INNER JOIN OrderItems using(order_num)
WHERE OrderItems.prod_id = 'BR01'
```

### Another Way to Determine the Best Customers (2)

The `OrderItems` table represents order item information. Another way to determine the best customers is to look at how much money they spent. The `OrderItems` table has order number `order_num`, item selling price `item_price`, and product quantity `quantity`.

| order_num | item_price | quantity |
| --------- | ---------- | -------- |
| a1        | 10         | 105      |
| a2        | 1          | 1100     |
| a2        | 1          | 200      |
| a4        | 2          | 1121     |
| a5        | 5          | 10       |
| a2        | 1          | 19       |
| a7        | 7          | 5        |

The `Orders` table has columns `order_num` (order number) and `cust_id` (customer ID).

| order_num | cust_id  |
| --------- | -------- |
| a1        | cust10   |
| a2        | cust1    |
| a3        | cust2    |
| a4        | cust22   |
| a5        | cust221  |
| a7        | cust2217 |

The `Customers` table has columns `cust_id` (customer ID) and `cust_name` (customer name).

| cust_id  | cust_name |
| -------- | --------- |
| cust10   | andy      |
| cust1    | ben       |
| cust2    | tony      |
| cust22   | tom       |
| cust221  | an        |
| cust2217 | hex       |

[Problem] Write a SQL statement to return the customer name and total amount (`order_num` in the `OrderItems` table) for orders with a total order price of at least 1000.

Hint: You need to calculate the sum (`item_price` multiplied by `quantity`). Sort the results by the total amount, and use `INNER JOIN` syntax.

```sql
SELECT cust_name, SUM(item_price * quantity) AS total_price
FROM Customers
INNER JOIN Orders USING(cust_id)
INNER JOIN OrderItems USING(order_num)
GROUP BY cust_name
HAVING total_price >= 1000
ORDER BY total_price
```

## Creating Advanced Joins

### Retrieve Each Customer's Name and All Order Numbers (1)

The `Customers` table represents customer information, containing customer ID `cust_id` and customer name `cust_name`.

| cust_id  | cust_name |
| -------- | --------- |
| cust10   | andy      |
| cust1    | ben       |
| cust2    | tony      |
| cust22   | tom       |
| cust221  | an        |
| cust2217 | hex       |

The `Orders` table represents order information, containing order number `order_num` and customer ID `cust_id`.

| order_num | cust_id  |
| --------- | -------- |
| a1        | cust10   |
| a2        | cust1    |
| a3        | cust2    |
| a4        | cust22   |
| a5        | cust221  |
| a7        | cust2217 |

[Problem] Write a SQL statement using `INNER JOIN` to retrieve each customer's name (`cust_name` in the `Customers` table) and all order numbers (`order_num` in the `Orders` table), and finally return the results sorted in ascending order by customer name `cust_name`.

```sql
SELECT cust_name, order_num
FROM Customers
INNER JOIN Orders
USING(cust_id)
ORDER BY cust_name
```

### Retrieve Each Customer's Name and All Order Numbers (2)

The `Orders` table represents order information, containing order number `order_num` and customer ID `cust_id`.

| order_num | cust_id  |
| --------- | -------- |
| a1        | cust10   |
| a2        | cust1    |
| a3        | cust2    |
| a4        | cust22   |
| a5        | cust221  |
| a7        | cust2217 |

The `Customers` table represents customer information, containing customer ID `cust_id` and customer name `cust_name`.

| cust_id  | cust_name |
| -------- | --------- |
| cust10   | andy      |
| cust1    | ben       |
| cust2    | tony      |
| cust22   | tom       |
| cust221  | an        |
| cust2217 | hex       |
| cust40   | ace       |

[Problem] Retrieve each customer's name (`cust_name` in the `Customers` table) and all order numbers (`order_num` in the `Orders` table), listing all customers even if they have never placed an order. Finally, return the results sorted in ascending order by customer name `cust_name`.

```sql
SELECT cust_name, order_num
FROM Customers
LEFT JOIN Orders
USING(cust_id)
ORDER BY cust_name
```

### Return Product Names and Related Order Numbers

The `Products` table is the product information table, containing columns `prod_id` (product ID) and `prod_name` (product name).

| prod_id | prod_name |
| ------- | --------- |
| a0001   | egg       |
| a0002   | sockets   |
| a0013   | coffee    |
| a0003   | cola      |
| a0023   | soda      |

The `OrderItems` table is the order item information table, containing columns `order_num` (order number) and `prod_id` (product ID).

| prod_id | order_num |
| ------- | --------- |
| a0001   | a105      |
| a0002   | a1100     |
| a0002   | a200      |
| a0013   | a1121     |
| a0003   | a10       |
| a0003   | a19       |
| a0003   | a5        |

[Problem] Use an outer join (`left join`, `right join`, `full join`) to join the `Products` table and the `OrderItems` table, return a list of product names (`prod_name`) and their associated order numbers (`order_num`), and sort in ascending order by product name.

```sql
SELECT prod_name, order_num
FROM Products
LEFT JOIN OrderItems
USING(prod_id)
ORDER BY prod_name
```

### Return Product Names and Total Number of Orders for Each Product

The `Products` table is the product information table, containing columns `prod_id` (product ID) and `prod_name` (product name).

| prod_id | prod_name |
| ------- | --------- |
| a0001   | egg       |
| a0002   | sockets   |
| a0013   | coffee    |
| a0003   | cola      |
| a0023   | soda      |

The `OrderItems` table is the order item information table, containing columns `order_num` (order number) and `prod_id` (product ID).

| prod_id | order_num |
| ------- | --------- |
| a0001   | a105      |
| a0002   | a1100     |
| a0002   | a200      |
| a0013   | a1121     |
| a0003   | a10       |
| a0003   | a19       |
| a0003   | a5        |

[Problem]

Use `OUTER JOIN` to join the `Products` table and the `OrderItems` table, return the product name (`prod_name`) and the total number of orders for each product (not the order numbers), and sort in ascending order by product name.

```sql
SELECT prod_name, COUNT(order_num) AS orders
FROM Products
LEFT JOIN OrderItems
USING(prod_id)
GROUP BY prod_name
ORDER BY prod_name
```

### List Suppliers and the Number of Products They Offer

Given the `Vendors` table containing `vend_id` (vendor ID):

| vend_id |
| ------- |
| a0002   |
| a0013   |
| a0003   |
| a0010   |

And the `Products` table containing `vend_id` (vendor ID) and `prod_id` (supplied product ID):

| vend_id | prod_id              |
| ------- | -------------------- |
| a0001   | egg                  |
| a0002   | prod_id_iphone       |
| a00113  | prod_id_tea          |
| a0003   | prod_id_vivo phone   |
| a0010   | prod_id_huawei phone |

[Problem] List suppliers (`vend_id` in the `Vendors` table) and the number of products they supply, including suppliers with no products. You need to use `OUTER JOIN` and the `COUNT()` aggregate function to count the number of each product in the `Products` table, and finally sort in ascending order by `vend_id`.

Note: The `vend_id` column appears in multiple tables, so it needs to be fully qualified each time it is referenced.

```sql
SELECT v.vend_id, COUNT(prod_id) AS prod_id
FROM Vendors v
LEFT JOIN Products p
USING(vend_id)
GROUP BY v.vend_id
ORDER BY v.vend_id
```

## Combining Queries

The `UNION` operator combines the results of two or more queries and produces a single result set containing all rows returned by the queries participating in the `UNION`.

Basic rules for `UNION`:

- The number of columns and the order of columns must be the same in all queries.
- The data types of the corresponding columns in each query must be identical or compatible.
- By convention, the returned column names are taken from the first query.

By default, the `UNION` operator selects distinct values. If duplicate values are allowed, use `UNION ALL`.

```sql
SELECT column_name(s) FROM table1
UNION ALL
SELECT column_name(s) FROM table2;
```

The column names in a `UNION` result set are always equal to the column names in the first `SELECT` statement in the `UNION`.

`JOIN` vs `UNION`:

- In `JOIN`, the columns of the joined tables may differ, whereas in `UNION`, the number of columns and column order must be identical across all queries.
- `UNION` places rows from queries together (vertically), whereas `JOIN` places columns from queries together (horizontally)—that is, it forms a Cartesian product.

### Combine Two SELECT Statements (1)

The `OrderItems` table contains order product information, with column `prod_id` representing product ID and `quantity` representing product quantity.

| prod_id | quantity |
| ------- | -------- |
| a0001   | 105      |
| a0002   | 100      |
| a0002   | 200      |
| a0013   | 1121     |
| a0003   | 10       |
| a0003   | 19       |
| a0003   | 5        |
| BNBG    | 10002    |

[Problem] Combine two `SELECT` statements to retrieve product ID (`prod_id`) and `quantity` from the `OrderItems` table. One `SELECT` statement filters for rows with a quantity of 100, and the other `SELECT` statement filters for products whose ID starts with `BNBG`. Finally, sort the results in ascending order by product ID.

```sql
SELECT prod_id, quantity
FROM OrderItems
WHERE quantity = 100
UNION
SELECT prod_id, quantity
FROM OrderItems
WHERE prod_id LIKE 'BNBG%'
ORDER BY prod_id;
```

> **Note:** When using `ORDER BY` in a `UNION` query, it can only be used once after the final `SELECT` statement, and it sorts the entire combined result set.

### Combine Two SELECT Statements (2)

The `OrderItems` table contains order product information, with column `prod_id` representing product ID and `quantity` representing product quantity.

| prod_id | quantity |
| ------- | -------- |
| a0001   | 105      |
| a0002   | 100      |
| a0002   | 200      |
| a0013   | 1121     |
| a0003   | 10       |
| a0003   | 19       |
| a0003   | 5        |
| BNBG    | 10002    |

[Problem] Combine two `SELECT` statements to retrieve product ID (`prod_id`) and `quantity` from the `OrderItems` table. One `SELECT` statement filters for rows with a quantity of 100, and the other `SELECT` statement filters for products whose ID starts with `BNBG`. Finally, sort the results in ascending order by product ID. Note: **This time, use only a single SELECT statement.**

Answer:

Since only a single `SELECT` statement is required, use `OR` instead of `UNION`.

```sql
SELECT prod_id, quantity
FROM OrderItems
WHERE quantity = 100 OR prod_id LIKE 'BNBG%'
ORDER BY prod_id;
```

### Combine Product Names from the Products Table and Customer Names from the Customers Table

The `Products` table contains column `prod_name` representing product name.

| prod_name |
| --------- |
| flower    |
| rice      |
| ring      |
| umbrella  |

The `Customers` table represents customer information, where `cust_name` represents customer name.

| cust_name |
| --------- |
| andy      |
| ben       |
| tony      |
| tom       |
| an        |
| lee       |
| hex       |

[Problem] Write a SQL statement to combine and return product names (`prod_name`) from the `Products` table and customer names (`cust_name`) from the `Customers` table, and then sort the results in ascending order by product name.

```sql
# The column names in a UNION result set always match the column names in the first SELECT statement of the UNION.
SELECT prod_name
FROM Products
UNION
SELECT cust_name
FROM Customers
ORDER BY prod_name
```

### Check the SQL Statement

The `Customers` table contains columns `cust_name` (customer name), `cust_contact` (customer contact), `cust_state` (customer state), and `cust_email` (customer email).

| cust_name | cust_contact | cust_state | cust_email        |
| --------- | ------------ | ---------- | ----------------- |
| cust10    | 8695192      | MI         | <cust10@cust.com> |
| cust1     | 8695193      | MI         | <cust1@cust.com>  |
| cust2     | 8695194      | IL         | <cust2@cust.com>  |

[Problem] Fix the incorrect SQL below.

```sql
SELECT cust_name, cust_contact, cust_email
FROM Customers
WHERE cust_state = 'MI'
ORDER BY cust_name;
UNION
SELECT cust_name, cust_contact, cust_email
FROM Customers
WHERE cust_state = 'IL'ORDER BY cust_name;
```

Corrected:

```sql
SELECT cust_name, cust_contact, cust_email
FROM Customers
WHERE cust_state = 'MI'
UNION
SELECT cust_name, cust_contact, cust_email
FROM Customers
WHERE cust_state = 'IL'
ORDER BY cust_name;
```

When combining queries with `UNION`, only one `ORDER BY` clause can be used, and it must be placed after the final `SELECT` statement.

Or simply use `OR`:

```sql
SELECT cust_name, cust_contact, cust_email
FROM Customers
WHERE cust_state = 'MI' or cust_state = 'IL'
ORDER BY cust_name;
```
