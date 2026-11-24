---
title: "Should Java Use long or BigDecimal for Money?"
description: "A guide to choosing monetary types in Java: clearly explaining when to use long to store the smallest currency unit versus BigDecimal for exact calculations, along with rounding, overflow, unit conversion, and database column design."
category: Java
tag:
  - Java Fundamentals
  - Java Money Calculation
lang: en
sourceRef: zh-ref/java/basis/money-long-vs-bigdecimal.md
head:
  - - meta
    - name: keywords
      content: Java money type,store money with long,Long for cents,BigDecimal money calculation,monetary precision,monetary rounding,DECIMAL,BIGINT
---

In the comment section of an article discussing monetary field types, I saw several completely different answers: some people insisted on using `Long` to store cents, some said scenarios like interest and exchange rates require `BigDecimal`, and others mentioned passing strings directly in APIs.

Those arguments are not talking about the same thing. Using `Long` to store cents refers to how money is stored; using `BigDecimal` for interest and exchange rates refers to how money is calculated; and passing strings in APIs is usually just a data transport format.

Monetary amounts whose smallest unit is already fixed can be stored using `long`. When intermediate fractional digits must be preserved during calculation or an explicit rounding mode must be specified, use `BigDecimal`. Both types can coexist in the same system.

When this article refers to the `Long` approach, it means storing the smallest currency unit as an integer. In Java code, arithmetic typically uses the primitive type `long`, while the wrapper type `Long` is used only when nullability needs to be represented.

| Comparison Item | `long` | `BigDecimal` |
| --- | --- | --- |
| Representation | Integer in a fixed smallest unit | Decimal number with a `scale` |
| Common Use Cases | Order amounts, account balances, and settled amounts with a fixed smallest unit | Discounts, taxes, interest rates, and exchange rate calculations |
| Main Risks | Unit confusion, silent overflow, difficult precision expansion | Construction method, rounding rules, `scale` discrepancies |
| Common Database Type | `BIGINT` | `DECIMAL(p, s)` |

## Why Can't Money Use `double`?

`double` and `float` store binary floating-point numbers. Many finite decimal fractions become infinitely repeating fractions when converted to binary, so only the closest representable approximation can be stored.

```java
double a = 1.0;
double b = 0.9;

System.out.println(a - b);
// 0.09999999999999998

System.out.println(0.1 + 0.1 + 0.1);
// 0.30000000000000004
```

This error has nothing to do with Java's implementation—any language using IEEE 754 binary floating-point numbers encounters it. Monetary calculations generally require results to follow explicit decimal precision and rounding rules, which approximate values can rarely satisfy.

`new BigDecimal(0.1)` reveals the exact approximate value stored inside a `double`:

```java
System.out.println(new BigDecimal(0.1));
// 0.1000000000000000055511151231257827021181583404541015625
```

This is also why monetary objects should never be constructed from a `double`. Once a value has already suffered representation error, converting it to `BigDecimal` later will not automatically recover the original decimal fraction.

## Which Monetary Values Are Suitable for `Long`?

If business rules stipulate that RMB amounts are uniformly accurate to the cent (fen), then `19.99` yuan can be stored as `1999` cents. Addition and subtraction are performed entirely on integers without introducing decimal errors.

```java
long priceCents = 1_999L;
long shippingCents = 500L;
long totalCents = Math.addExact(priceCents, shippingCents);
```

`long` is well suited for values that have already been rounded, such as order amounts, account balances, and payment amounts, and can map to `BIGINT` in the database.

When storing them in a database, it is best to include the unit in the column name so it is immediately clear:

```sql
CREATE TABLE orders (
    id           BIGINT PRIMARY KEY,
    amount_cents BIGINT NOT NULL
);
```

If you just name it `amount`, looking at `amount = 100` alone cannot tell whether it means 100 yuan or 100 cents. Naming it `amount_cents = 100` removes any ambiguity.

**What should you watch out for when using `long`?**

Storing amounts uniformly in cents also locks precision at two decimal places. Intermediate results from exchange rates, interest, taxes, or metered billing may require four, six, or even more decimal places—those calculations cannot simply be forced into "cents".

You must also guard against integer overflow. Ordinary `+` and `*` operators do not throw errors on overflow; monetary code can instead use `Math.addExact()`, `Math.subtractExact()`, and `Math.multiplyExact()`:

```java
long subtotalCents = Math.multiplyExact(unitPriceCents, quantity);
long balanceCents = Math.subtractExact(currentBalanceCents, paymentCents);
```

For multiplication, you must also check intermediate results. Even if the final amount does not exceed `Long.MAX_VALUE`, that does not guarantee that an intermediate step in `unit price × quantity × multiplier` will not overflow.

Multi-currency systems also cannot assume that every currency has two decimal places. A monetary amount must always appear alongside its currency; the number of decimal places for the smallest unit is determined by the currency or business rules and cannot be inferred from an isolated `long` value alone.

## Which Monetary Values Are Suitable for `BigDecimal`?

Discounts, taxes, interest, and currency conversions frequently produce intermediate results finer than the currency's smallest unit.

`BigDecimal` represents decimal numbers using an arbitrary-precision unscaled integer and a `scale`, allowing these intermediate values to be preserved accurately and then rounded at the exact point required by business rules.

```java
BigDecimal price = new BigDecimal("19.99");
BigDecimal discountRate = new BigDecimal("0.95");

BigDecimal discountedPrice = price.multiply(discountRate);
// 18.9905
```

Always construct monetary constants directly from strings. If an API sends a string, parse it directly into `BigDecimal`; if the database column is `DECIMAL`, map it directly to `BigDecimal`—never convert through `double` in between.

**What if `divide()` yields a non-terminating decimal?**

In that case, you need to specify both the scale (number of decimal places) and the rounding mode.

The code below keeps two decimal places and uses `HALF_UP` (standard rounding). Calling `a.divide(b)` directly without a rounding mode will throw an `ArithmeticException`.

```java
BigDecimal a = new BigDecimal("10");
BigDecimal b = new BigDecimal("3");

System.out.println(a.divide(b, 2, RoundingMode.HALF_UP)); // 3.33
```

Another point to keep in mind: `BigDecimal` is an immutable class, so the result of any operation must be captured in a new variable or reassigned. In the example below, the return value of the first `add()` call is discarded, so `amount` remains `10.00`:

```java
BigDecimal amount = new BigDecimal("10.00");

amount.add(new BigDecimal("2.00"));
System.out.println(amount); // Still 10.00

amount = amount.add(new BigDecimal("2.00"));
System.out.println(amount); // 12.00
```

To compare monetary magnitudes, generally use `compareTo()`. `equals()` also compares `scale`, so calling `equals()` on `1.0` and `1.00` returns `false`:

```java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("1.00");

System.out.println(a.equals(b));         // false
System.out.println(a.compareTo(b) == 0); // true
```

This difference also affects `HashMap` and `HashSet`. If you use `BigDecimal` as a key, it is best to normalize its `scale` first; otherwise, `1.0` and `1.00` will be treated as two distinct keys.

## Can `Long` and `BigDecimal` Be Used Together?

Yes. Take an item with a unit price of `19.99` yuan, quantity 3, and a `0.95` discount as an example: perform the calculation using `BigDecimal`, then convert the final payable amount into a `long` denominated in cents:

```java
BigDecimal unitPrice = new BigDecimal("19.99");
BigDecimal discountRate = new BigDecimal("0.95");
long quantity = 3L;

BigDecimal payable = unitPrice
        .multiply(BigDecimal.valueOf(quantity))
        .multiply(discountRate)
        .setScale(2, RoundingMode.HALF_UP);

long payableCents = payable
        .movePointRight(2)
        .longValueExact();
```

This snippet computes `payable` as `56.97`, and `movePointRight(2)` shifts it into `5697`. `longValueExact()` only accepts integers within the `long` range; if any non-zero fractional part remains or the value overflows `long`, it throws an `ArithmeticException`.

Never use `longValue()` directly for monetary conversion, as it silently discards the fractional part:

```java
long amount = new BigDecimal("19.99").longValue();
System.out.println(amount); // 19
```

If an input amount is allowed at most two decimal places, you can also use `RoundingMode.UNNECESSARY` for validation:

```java
public static long toCentsExact(BigDecimal amount) {
    return amount
            .setScale(2, RoundingMode.UNNECESSARY)
            .movePointRight(2)
            .longValueExact();
}

public static BigDecimal fromCents(long cents) {
    return BigDecimal.valueOf(cents, 2);
}
```

`19.9` is padded to `19.90`, whereas `19.999` immediately throws an exception rather than silently truncating or rounding.

If a payment API expects cents, pass `5697`; if it expects a string denominated in yuan, pass `payable.toPlainString()`. Keep conversion logic in the API adapter layer, and avoid switching types and units back and forth in the middle of business calculations.

## Should the Database Use `BIGINT` or `DECIMAL`?

When Java stores the smallest unit in `long`, the database column typically uses `BIGINT`; when Java uses `BigDecimal`, the database column typically uses `DECIMAL(p, s)`.

```sql
CREATE TABLE settlement_detail (
    id               BIGINT PRIMARY KEY,
    payable_cents    BIGINT        NOT NULL,
    exchange_rate    DECIMAL(18, 8) NOT NULL,
    settlement_amount DECIMAL(18, 2) NOT NULL
);
```

MySQL classifies both integers and `DECIMAL` as exact-value types. In `DECIMAL(18, 2)`, `18` is the total precision (significant digits) and `2` is the scale (decimal places); whether it can accommodate business amounts should be derived backward from the maximum expected value rather than blindly applying a one-size-fits-all precision to every money column.

Do not rely on MySQL to automatically round values when writing to a `DECIMAL` column. Call `setScale()` in Java code to round or validate first before writing to the database, ensuring the persisted value matches the program's calculation result.

Whether a monetary column should have `DEFAULT 0` depends on business semantics. A missing amount and a zero amount are not always the same thing, and casually adding a default value can mask omitted fields. `NOT NULL` is usually worth keeping, while defaults should be decided by domain rules.

## Summary

Monetary values that have already been rounded and have a fixed smallest unit are well suited for storage in `long`; calculations requiring fractional precision such as discounts, taxes, interest rates, and exchange rates should use `BigDecimal`. When rounding, always explicitly specify both the scale and the `RoundingMode`.

Both types can work together. Keep `BigDecimal` during the calculation phase, and once the final amount is determined, shift the decimal point according to the number of decimal places of the smallest unit and convert to an integer with `longValueExact()`. Include the unit clearly in column/field names, check for overflow during integer arithmetic, and centralize type and unit conversions in API or database adapter code.
