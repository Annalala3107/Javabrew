---
title: BigDecimal Explained
description: "A detailed guide to using BigDecimal: solving floating-point precision loss, mastering addition/subtraction/multiplication/division operations, RoundingMode rounding rules, and the compareTo comparison method for financial and other high-precision computing scenarios."
category: Java
tag:
  - Java Basics
lang: en
sourceRef: zh-ref/java/basis/bigdecimal.md
head:
  - - meta
    - name: keywords
      content: BigDecimal,floating-point precision,decimal arithmetic,RoundingMode rounding modes,BigDecimal comparison,monetary calculation,precision loss
---

The *Alibaba Java Coding Guidelines* states: "To avoid precision loss, `BigDecimal` can be used for floating-point operations."

Can floating-point operations really suffer from precision loss? Indeed they can!

Example code:

```java
float a = 2.0f - 1.9f;
float b = 1.8f - 1.7f;
System.out.println(a);// 0.100000024
System.out.println(b);// 0.099999905
System.out.println(a == b);// false
```

**Why do `float` or `double` floating-point operations carry the risk of precision loss?**

This has a lot to do with how computers store fractional numbers. As we know, computers operate in binary and have a finite bit width when representing a number. Many decimal fractions turn into infinitely repeating fractions when converted to binary and must be rounded to a finite number of bits, creating a risk of precision loss. However, values like `0.5` and `0.25` that can be represented as finite binary fractions can be represented exactly.

For example, the decimal number `0.2` cannot be converted exactly into a binary fraction:

```java
// The process of converting 0.2 into binary is to repeatedly multiply by 2 until no fractional part remains.
// During this calculation, taking the integer parts from top to bottom yields the binary result.
0.2 * 2 = 0.4 -> 0
0.4 * 2 = 0.8 -> 0
0.8 * 2 = 1.6 -> 1
0.6 * 2 = 1.2 -> 1
0.2 * 2 = 0.4 -> 0 (cycle begins)
...
```

For more on floating-point numbers, it is recommended to read the article [Computer Systems Basics (4): Floating-Point Numbers](http://kaito-kidd.com/2018/08/08/computer-system-float-point/).

## Introduction to `BigDecimal`

`BigDecimal` can represent decimal numbers accurately and provides arithmetic operations with explicitly specifiable precision and rounding rules. However, rounding can still occur when using a finite-precision `MathContext`, performing division that requires rounding, or converting the result to `float` or `double`.

Typically, most business scenarios that require exact decimal arithmetic results (such as those involving money) are implemented using `BigDecimal`.

The *Alibaba Java Coding Guidelines* notes: **For equality checks between floating-point numbers, primitive types must not be compared with `==`, and wrapper types must not be compared with `equals`.**

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211213101646884-607e6238.png)

We already explained the exact reason in detail above, so we won't repeat it here.

To solve the precision-loss problem in floating-point arithmetic, you can simply define decimal values using `BigDecimal` and then perform the arithmetic operations.

```java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("0.9");
BigDecimal c = new BigDecimal("0.8");

BigDecimal x = a.subtract(b);
BigDecimal y = b.subtract(c);

System.out.println(x.compareTo(y));// 0
```

## Common `BigDecimal` Methods

### Creation

When using `BigDecimal`, to prevent precision loss, it is recommended to create objects using its `BigDecimal(String val)` constructor or the `BigDecimal.valueOf(double val)` static method.

The *Alibaba Java Coding Guidelines* also mentions this, as shown below.

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211213102222601-69f48ecc.png)

### Addition, Subtraction, Multiplication, and Division

The `add` method adds two `BigDecimal` objects, `subtract` subtracts two `BigDecimal` objects, `multiply` multiplies two `BigDecimal` objects, and `divide` divides two `BigDecimal` objects.

```java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("0.9");
System.out.println(a.add(b));// 1.9
System.out.println(a.subtract(b));// 0.1
System.out.println(a.multiply(b));// 0.90
System.out.println(a.divide(b));// Cannot divide evenly; throws ArithmeticException
System.out.println(a.divide(b, 2, RoundingMode.HALF_UP));// 1.11
```

Note here that you should choose the `divide` overload based on whether business requirements allow rounding. When an exact result is required, use the overload without a rounding rule; if the result cannot be represented exactly, an `ArithmeticException` will be thrown. When rounding is allowed, explicitly specify `scale` and `roundingMode`. `RoundingMode.UNNECESSARY` is used to assert that the result requires no rounding, and likewise throws `ArithmeticException` if rounding is actually needed.

```java
public BigDecimal divide(BigDecimal divisor, int scale, RoundingMode roundingMode) {
    return divide(divisor, scale, roundingMode.oldMode);
}
```

There are many rounding rules; here are a few of them:

```java
public enum RoundingMode {
   // 2.4 -> 3 , 1.6 -> 2
   // -1.6 -> -2 , -2.4 -> -3
   UP(BigDecimal.ROUND_UP),
   // 2.4 -> 2 , 1.6 -> 1
   // -1.6 -> -1 , -2.4 -> -2
   DOWN(BigDecimal.ROUND_DOWN),
   // 2.4 -> 3 , 1.6 -> 2
   // -1.6 -> -1 , -2.4 -> -2
   CEILING(BigDecimal.ROUND_CEILING),
   // 2.5 -> 2 , 1.6 -> 1
   // -1.6 -> -2 , -2.5 -> -3
   FLOOR(BigDecimal.ROUND_FLOOR),
   // 2.4 -> 2 , 1.6 -> 2
   // -1.6 -> -2 , -2.4 -> -2
   HALF_UP(BigDecimal.ROUND_HALF_UP),
   //......
}
```

### Value Comparison

`a.compareTo(b)`: returns `-1` if `a` is less than `b`, `0` if `a` equals `b`, and `1` if `a` is greater than `b`.

```java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("0.9");
System.out.println(a.compareTo(b));// 1
```

### Keeping a Specific Number of Decimal Places

Use the `setScale` method to set the number of decimal places to keep and the rounding rule. There are quite a few rounding rules—no need to memorize them, as IntelliJ IDEA will autocomplete and prompt you.

```java
BigDecimal m = new BigDecimal("1.255433");
BigDecimal n = m.setScale(3,RoundingMode.HALF_DOWN);
System.out.println(n);// 1.255
```

## Equality Comparison Issues with `BigDecimal`

The *Alibaba Java Coding Guidelines* states:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/image-20220714161315993-0fedb69e.png)

Code example showing the issue when using `equals()` for equality comparison on `BigDecimal`:

```java
BigDecimal a = new BigDecimal("1");
BigDecimal b = new BigDecimal("1.0");
System.out.println(a.equals(b));//false
```

This is because `equals()` compares not only the numerical value (`value`) but also the precision (`scale`), whereas `compareTo()` ignores precision when comparing.

`1.0` has a scale of `1`, while `1` has a scale of `0`, so `a.equals(b)` evaluates to `false`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/image-20220714164706390-456d97c3.png)

The `compareTo()` method compares the values of two `BigDecimal` instances: if they are equal it returns `0`; if the first number is greater than the second it returns `1`; otherwise it returns `-1`.

```java
BigDecimal a = new BigDecimal("1");
BigDecimal b = new BigDecimal("1.0");
System.out.println(a.compareTo(b));//0
```

## Sharing a `BigDecimal` Utility Class

There is a widely used `BigDecimal` utility class online that provides several static methods to simplify `BigDecimal` operations.

I made a few simple improvements to it and am sharing the source code here:

```java
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * A small utility class to simplify BigDecimal calculations
 */
public class BigDecimalUtil {

    /**
     * Default division scale
     */
    private static final int DEF_DIV_SCALE = 10;

    private BigDecimalUtil() {
    }

    /**
     * Performs addition using BigDecimal; rounding may still occur when converting the result to double.
     *
     * @param v1 augend
     * @param v2 addend
     * @return sum of the two arguments
     */
    public static double add(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.add(b2).doubleValue();
    }

    /**
     * Performs subtraction using BigDecimal; rounding may still occur when converting the result to double.
     *
     * @param v1 minuend
     * @param v2 subtrahend
     * @return difference of the two arguments
     */
    public static double subtract(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.subtract(b2).doubleValue();
    }

    /**
     * Performs multiplication using BigDecimal; rounding may still occur when converting the result to double.
     *
     * @param v1 multiplicand
     * @param v2 multiplier
     * @return product of the two arguments
     */
    public static double multiply(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.multiply(b2).doubleValue();
    }

    /**
     * Provides (relatively) exact division; when division does not terminate,
     * rounds to 10 decimal places using round-half-to-even (banker's rounding).
     *
     * @param v1 dividend
     * @param v2 divisor
     * @return quotient of the two arguments
     */
    public static double divide(double v1, double v2) {
        return divide(v1, v2, DEF_DIV_SCALE);
    }

    /**
     * Provides (relatively) exact division. When division does not terminate,
     * precision is specified by the scale parameter, using round-half-to-even (banker's rounding).
     *
     * @param v1    dividend
     * @param v2    divisor
     * @param scale specifies the number of decimal places of precision
     * @return quotient of the two arguments
     */
    public static double divide(double v1, double v2, int scale) {
        if (scale < 0) {
            throw new IllegalArgumentException(
                    "The scale must be a positive integer or zero");
        }
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.divide(b2, scale, RoundingMode.HALF_EVEN).doubleValue();
    }

    /**
     * Rounds to the specified number of decimal places using HALF_EVEN.
     *
     * @param v     number to round using half-to-even
     * @param scale number of decimal places to keep
     * @return rounded result using half-to-even
     */
    public static double round(double v, int scale) {
        if (scale < 0) {
            throw new IllegalArgumentException(
                    "The scale must be a positive integer or zero");
        }
        BigDecimal b = BigDecimal.valueOf(v);
        BigDecimal one = new BigDecimal("1");
        return b.divide(one, scale, RoundingMode.HALF_EVEN).doubleValue();
    }

    /**
     * Converts to float; rounding or overflow may occur if exceeding float precision or range
     *
     * @param v number to convert
     * @return converted result
     */
    public static float convertToFloat(double v) {
        BigDecimal b = BigDecimal.valueOf(v);
        return b.floatValue();
    }

    /**
     * Converts to int without rounding; the fractional part is truncated, and high bits are lost if out of range
     *
     * @param v number to convert
     * @return converted result
     */
    public static int convertsToInt(double v) {
        BigDecimal b = BigDecimal.valueOf(v);
        return b.intValue();
    }

    /**
     * Converts to long without rounding; the fractional part is truncated, and high bits are lost if out of range
     *
     * @param v number to convert
     * @return converted result
     */
    public static long convertsToLong(double v) {
        BigDecimal b = BigDecimal.valueOf(v);
        return b.longValue();
    }

    /**
     * Returns the larger of two numbers
     *
     * @param v1 first number to compare
     * @param v2 second number to compare
     * @return the larger of the two numbers
     */
    public static double returnMax(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.max(b2).doubleValue();
    }

    /**
     * Returns the smaller of two numbers
     *
     * @param v1 first number to compare
     * @param v2 second number to compare
     * @return the smaller of the two numbers
     */
    public static double returnMin(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.min(b2).doubleValue();
    }

    /**
     * Compares two numbers accurately
     *
     * @param v1 first number to compare
     * @param v2 second number to compare
     * @return 0 if equal, 1 if the first number is greater than the second, -1 otherwise
     */
    public static int compareTo(double v1, double v2) {
        BigDecimal b1 = BigDecimal.valueOf(v1);
        BigDecimal b2 = BigDecimal.valueOf(v2);
        return b1.compareTo(b2);
    }

}
```

Related issue: [Suggestion to set the rounding rule to RoundingMode.HALF_EVEN (banker's rounding), #2129](https://github.com/Snailclimb/JavaGuide/issues/2129).

![RoundingMode.HALF_EVEN](/media/jg/ext/oss.javaguide.cn/javaguide/java/basis/RoundingMode.HALF_EVEN-105f4ff1.png)

## Summary

Many decimal fractions cannot be represented exactly with a finite number of binary digits, so performing arithmetic with `float` or `double` carries the risk of precision loss.

However, Java provides `BigDecimal` for operating on decimal/floating-point numbers. `BigDecimal`'s implementation builds on `BigInteger` (used for big integer arithmetic), except that `BigDecimal` adds the concept of decimal places (`scale`).
