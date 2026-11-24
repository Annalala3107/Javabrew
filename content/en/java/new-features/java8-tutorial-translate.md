---
title: Java 8 Tutorial (Translated & Annotated)
description: Translation and compilation of a Java 8 tutorial covering Lambda expressions, method references, default interface methods, Stream API, and other new features with code examples.
category: Java
tag:
  - Java New Features
head:
  - - meta
    - name: keywords
      content: Java 8,Tutorial,Lambda,Method References,Default Methods,Stream API,Functional Interfaces,Date/Time API
lang: en
sourceRef: zh-ref/java/new-features/java8-tutorial-translate.md
---

# Java 8 Tutorial (Translated & Annotated)

JDK 8 was released on March 18, 2014. It is an LTS (Long-Term Support) release and is one of the most important versions in Java history. So far, there are five Long-Term Support releases: JDK 8, JDK 11, JDK 17, JDK 21, and JDK 25.

JDK 8 introduced many important new features. This article picks several of the more important ones for a detailed introduction:

- Lambda expressions
- Method references
- Default interface methods
- Stream API
- Functional interfaces
- `Optional` class
- Date/Time API
- Annotation enhancements

The chart below shows the number of new features and release dates for each update from JDK 8 to JDK 24:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

As Java 8 has become increasingly popular, many people have mentioned that Java 8 is also a very frequently asked topic in interviews. In response to everyone's requests and needs, I decided to summarize this knowledge. Originally, I planned to write the summary myself, and later I saw a related repository on GitHub at:
[https://github.com/winterbe/java8-tutorial](https://github.com/winterbe/java8-tutorial). This repository is in English; I translated it and added and modified parts of the content. Below is the main text.

---

Welcome to my introduction to Java 8. This tutorial will guide you step by step through all the new language features. Based on short code examples, you will learn how to use default interface methods, lambda expressions, method references, and repeatable annotations. By the end of this article, you will be familiar with the latest API changes such as Streams, Functional Interfaces, extensions to the `Map` class, and the new Date API. No long blocks of dry text—just a collection of commented code snippets.

## Default Methods for Interfaces

Java 8 enables us to add non-abstract method implementations to interfaces by using the `default` keyword. This feature is also known as [virtual extension methods](http://stackoverflow.com/a/24102730).

First example:

```java
interface Formula{

    double calculate(int a);

    default double sqrt(int a) {
        return Math.sqrt(a);
    }

}
```

In addition to the abstract method `calculate`, the `Formula` interface defines a default method `sqrt`. Concrete classes implementing this interface only need to implement the abstract method `calculate`. The default method `sqrt` can be used directly. Of course, you can also create an object directly via the interface and implement the default method in the interface—let's demonstrate this approach in code.

```java
public class Main {

  public static void main(String[] args) {
    // Access the interface via an anonymous inner class
    Formula formula = new Formula() {
        @Override
        public double calculate(int a) {
            return sqrt(a * 100);
        }
    };

    System.out.println(formula.calculate(100));     // 100.0
    System.out.println(formula.sqrt(16));           // 4.0

  }

}
```

`formula` is implemented as an anonymous object. The code is very easy to understand: 6 lines of code implement computing `sqrt(a * 100)`. In the next section, we will see a better and more convenient way to implement single-method objects in Java 8.

**Translator's Note:** Whether it is an abstract class or an interface, it can be accessed via an anonymous inner class. You cannot instantiate an abstract class or an interface directly. For accessing an interface via an anonymous inner class as shown above, we can understand it this way: an inner class implements the abstract method in the interface and returns an inner class object, and then we have the interface reference point to this object.

## Lambda Expressions

First, let's see how strings were sorted in older versions of Java:

```java
List<String> names = Arrays.asList("peter", "anna", "mike", "xenia");

Collections.sort(names, new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return b.compareTo(a);
    }
});
```

You simply pass a `List` object and a comparator to the static method `Collections.sort` to sort in the specified order. The usual approach is to create an anonymous comparator object and pass it to the `sort` method.

In Java 8, you no longer have to use this traditional anonymous object approach; Java 8 provides a more concise syntax—lambda expressions:

```java
Collections.sort(names, (String a, String b) -> {
    return b.compareTo(a);
});
```

As you can see, the code becomes shorter and more readable, and in fact it can be written even shorter:

```java
Collections.sort(names, (String a, String b) -> b.compareTo(a));
```

For function bodies with only a single line of code, you can omit the curly braces `{}` and the `return` keyword—and you can write it even shorter:

```java
names.sort((a, b) -> b.compareTo(a));
```

The `List` class itself has a `sort` method. Furthermore, the Java compiler can automatically infer the parameter types, so you don't have to write the types again. Next, let's see what other uses lambda expressions have.

## Functional Interfaces

**Translator's Note:** The original text did not explain this part very clearly, so it has been modified!

The Java language designers invested a great deal of effort thinking about how to make existing functions support Lambdas smoothly. The approach ultimately adopted was to introduce the concept of functional interfaces. **A "functional interface" is an interface that contains only one abstract method, though it may have multiple non-abstract methods (that is, the default methods mentioned above).** Any such interface can serve as the target type of a lambda expression. `java.lang.Runnable` and `java.util.concurrent.Callable` are two classic examples of functional interfaces. Java 8 added a special annotation `@FunctionalInterface`, though this annotation is usually not mandatory. As long as an interface satisfies the definition of a functional interface, the Java compiler can use it as the target type of a lambda expression. It is generally recommended to declare the interface with the `@FunctionalInterface` annotation so that the compiler will report an error if it discovers that the annotated interface does not meet the requirements of a functional interface, as shown in the figure below.

![@FunctionalInterface Annotation](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/FunctionalInterface-206fcd2d.png)

Example:

```java
@FunctionalInterface
public interface Converter<F, T> {
  T convert(F from);
}
```

```java
    // TODO Convert a numeric string to an Integer
    Converter<String, Integer> converter = (from) -> Integer.valueOf(from);
    Integer converted = converter.convert("123");
    System.out.println(converted.getClass()); //class java.lang.Integer
```

**Translator's Note:** We don't have to write most functional interfaces ourselves; Java 8 has already implemented them for us, and these interfaces are in the `java.util.function` package.

## Method and Constructor References

The code in the previous section can also be expressed using a static method reference:

```java
    Converter<String, Integer> converter = Integer::valueOf;
    Integer converted = converter.convert("123");
    System.out.println(converted.getClass());   //class java.lang.Integer
```

Java 8 allows you to pass references to methods or constructors via the `::` keyword. The example above shows how to reference a static method. However, we can also reference object methods:

```java
class Something {
    String startsWith(String s) {
        return String.valueOf(s.charAt(0));
    }
}
```

```java
Something something = new Something();
Converter<String, String> converter = something::startsWith;
String converted = converter.convert("Java");
System.out.println(converted);    // "J"
```

Next, let's see how constructors are referenced using the `::` keyword. First, we define a simple class with multiple constructors:

```java
class Person {
    String firstName;
    String lastName;

    Person() {}

    Person(String firstName, String lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }
}
```

Next, we specify an object factory interface used to create `Person` objects:

```java
interface PersonFactory<P extends Person> {
    P create(String firstName, String lastName);
}
```

Here we use a constructor reference to tie them together instead of manually implementing a full factory:

```java
PersonFactory<Person> personFactory = Person::new;
Person person = personFactory.create("Peter", "Parker");
```

We only need to use `Person::new` to obtain a reference to the `Person` class constructor, and the Java compiler will automatically select the appropriate constructor based on the parameter types of the `PersonFactory.create` method.

## Lambda Scopes

### Accessing Local Variables

We can access outer local variables directly inside a lambda expression:

```java
final int num = 1;
Converter<Integer, String> stringConverter =
        (from) -> String.valueOf(from + num);

stringConverter.convert(2);     // 3
```

However, unlike anonymous objects, the variable `num` here does not need to be declared `final`; this code is equally valid:

```java
int num = 1;
Converter<Integer, String> stringConverter =
        (from) -> String.valueOf(from + num);

stringConverter.convert(2);     // 3
```

However, `num` here must not be modified by subsequent code (that is, it implicitly has `final` semantics). For example, the following will not compile:

```java
int num = 1;
Converter<Integer, String> stringConverter =
        (from) -> String.valueOf(from + num);
num = 3; // Attempting to modify num inside the lambda expression is also not allowed.
```

### Accessing Fields and Static Variables

In contrast to local variables, we have both read and write access to instance fields and static variables inside lambda expressions. This behavior is consistent with anonymous objects.

```java
class Lambda4 {
    static int outerStaticNum;
    int outerNum;

    void testScopes() {
        Converter<Integer, String> stringConverter1 = (from) -> {
            outerNum = 23;
            return String.valueOf(from);
        };

        Converter<Integer, String> stringConverter2 = (from) -> {
            outerStaticNum = 72;
            return String.valueOf(from);
        };
    }
}
```

### Accessing Default Interface Methods

Remember the `Formula` example from the first section? The `Formula` interface defined a default method `sqrt`, which could be accessed from every `formula` instance containing an anonymous object. This does not work with lambda expressions.

Default methods cannot be accessed from within a lambda expression, so the following code does not compile:

```java
Formula formula = (a) -> sqrt(a * 100);
```

## Built-in Functional Interfaces

The JDK 1.8 API contains many built-in functional interfaces. Some of these interfaces are familiar from older versions of Java, such as `Comparator` or `Runnable`; these interfaces have all been annotated with `@FunctionalInterface` so they can be used with lambda expressions.

However, the Java 8 API also provides many brand-new functional interfaces to make your programming work easier. Some of these interfaces come from the [Google Guava](https://code.google.com/p/guava-libraries/) library. Even if you are already familiar with them, it is still worth seeing how they extend to work with lambdas.

### Predicate

The `Predicate` interface is a **predicate** interface with a single parameter that returns a boolean value. This interface contains various default methods for combining `Predicate`s into complex logical expressions (such as AND, OR, NOT):

**Translator's Note:** The source code of the `Predicate` interface is as follows

```java
package java.util.function;
import java.util.Objects;

@FunctionalInterface
public interface Predicate<T> {

    // Accepts an input argument and returns a boolean value. Used for evaluation.
    boolean test(T t);

    // Similar to the logical "&&" operator; returns true only if both sides hold
    default Predicate<T> and(Predicate<? super T> other) {
        Objects.requireNonNull(other);
        return (t) -> test(t) && other.test(t);
    }
    // Similar to the logical "!" operator; negates the predicate evaluation
    default Predicate<T> negate() {
        return (t) -> !test(t);
    }
    // Similar to the logical "||" operator; returns true if either side holds
    default Predicate<T> or(Predicate<? super T> other) {
        Objects.requireNonNull(other);
        return (t) -> test(t) || other.test(t);
    }
   // Accepts an Object and returns a Predicate. Used to test whether the argument equals targetRef.
    static <T> Predicate<T> isEqual(Object targetRef) {
        return (null == targetRef)
                ? Objects::isNull
                : object -> targetRef.equals(object);
    }
```

Example:

```java
Predicate<String> predicate = (s) -> s.length() > 0;

predicate.test("foo");              // true
predicate.negate().test("foo");     // false

Predicate<Boolean> nonNull = Objects::nonNull;
Predicate<Boolean> isNull = Objects::isNull;

Predicate<String> isEmpty = String::isEmpty;
Predicate<String> isNotEmpty = isEmpty.negate();
```

### Function

The `Function` interface accepts one argument and produces a result. Default methods can be used to chain multiple functions together (`compose`, `andThen`):

**Translator's Note:** The source code of the `Function` interface is as follows

```java

package java.util.function;

import java.util.Objects;

@FunctionalInterface
public interface Function<T, R> {

    // Applies the Function object to the input argument and returns the computed result.
    R apply(T t);
    // Combines two Functions and returns a Function that executes both Functions' behavior.
    default <V> Function<V, R> compose(Function<? super V, ? extends T> before) {
        Objects.requireNonNull(before);
        return (V v) -> apply(before.apply(v));
    }
    //
    default <V> Function<T, V> andThen(Function<? super R, ? extends V> after) {
        Objects.requireNonNull(after);
        return (T t) -> after.apply(apply(t));
    }

    static <T> Function<T, T> identity() {
        return t -> t;
    }
}
```

```java
Function<String, Integer> toInteger = Integer::valueOf;
Function<String, String> backToString = toInteger.andThen(String::valueOf);
backToString.apply("123");     // "123"
```

### Supplier

The `Supplier` interface produces a result of a given generic type. Unlike the `Function` interface, the `Supplier` interface accepts no arguments.

```java
Supplier<Person> personSupplier = Person::new;
personSupplier.get();   // new Person
```

### Consumer

The `Consumer` interface represents an operation to be performed on a single input argument.

```java
Consumer<Person> greeter = (p) -> System.out.println("Hello, " + p.firstName);
greeter.accept(new Person("Luke", "Skywalker"));
```

### Comparator

`Comparator` is a classic interface from older Java, upon which Java 8 has added various default methods:

```java
Comparator<Person> comparator = (p1, p2) -> p1.firstName.compareTo(p2.firstName);

Person p1 = new Person("John", "Doe");
Person p2 = new Person("Alice", "Wonderland");

comparator.compare(p1, p2);             // > 0
comparator.reversed().compare(p1, p2);  // < 0
```

## Optional

`Optional` is not a functional interface, but rather a container used to explicitly represent that a value "may be absent." Using it properly can reduce some manual `null` checks, though it cannot guarantee that a program will never experience a `NullPointerException`. This is an important concept for the next section, so let's quickly see how `Optional` works.

`Optional` is a simple container that either holds a non-`null` value or is empty. In scenarios suited to expressing that a return value "may not exist," you can return an `Optional` instead of using `null` to represent the absence of a result.

Translator's Note: The purpose of each method has been added to the example.

```java
// of(): Creates an Optional for a non-null value
Optional<String> optional = Optional.of("bam");
// isPresent(): Returns true if a value is present, otherwise false
optional.isPresent();           // true
// get(): Returns the value if Optional has one, otherwise throws NoSuchElementException
optional.get();                 // "bam"
// orElse(): Returns the value if present, otherwise returns the specified fallback value
optional.orElse("fallback");    // "bam"
// ifPresent(): Invokes the consumer if the Optional instance has a value, otherwise does nothing
optional.ifPresent((s) -> System.out.println(s.charAt(0)));     // "b"
```

Recommended reading: [[Java 8] How to Use Optional Correctly](https://blog.kaaass.net/archives/764)

## Streams

`java.util.stream.Stream` represents a sequence of operations that can be applied sequentially to a group of elements. Stream operations are divided into intermediate operations and terminal operations: terminal operations return a computation result of a specific type, whereas intermediate operations return the Stream itself so you can chain multiple operations in sequence. Streams can be created from various data sources such as collections, arrays, and generator functions; `Map` itself does not have a `stream()` method, but streams can be created via its key, value, or entry views. Stream operations can be executed either sequentially or in parallel.

First, let's see how Streams are used by creating the `List` of data needed for the example code:

```java
List<String> stringList = new ArrayList<>();
stringList.add("ddd2");
stringList.add("aaa2");
stringList.add("bbb1");
stringList.add("aaa1");
stringList.add("bbb3");
stringList.add("ccc");
stringList.add("bbb2");
stringList.add("ddd1");
```

Java 8 extends collection classes so that you can create a Stream via `Collection.stream()` or `Collection.parallelStream()`. The following sections explain common Stream operations in detail:

### Filter

Filter uses a `Predicate` interface to filter elements and keep only those that satisfy the condition. This operation is an **intermediate operation**, so we can apply other Stream operations (such as `forEach`) to the filtered result. `forEach` requires a function to execute on each filtered element in turn. `forEach` is a terminal operation, so we cannot execute other Stream operations after `forEach`.

```java
        // Test Filter
        stringList
                .stream()
                .filter((s) -> s.startsWith("a"))
                .forEach(System.out::println);//aaa2 aaa1
```

`forEach` is designed for Lambdas, keeping the most compact style. Moreover, Lambda expressions themselves are reusable, which is very convenient.

### Sorted

Sorting is an **intermediate operation** that returns a sorted Stream. **If you do not specify a custom `Comparator`, the default ordering will be used.**

```java
        // Test Sort
        stringList
                .stream()
                .sorted()
                .filter((s) -> s.startsWith("a"))
                .forEach(System.out::println);// aaa1 aaa2
```

Note that sorting only creates a newly ordered Stream without affecting the original data source; the original `stringList` is not modified after sorting:

```java
    System.out.println(stringList);// ddd2, aaa2, bbb1, aaa1, bbb3, ccc, bbb2, ddd1
```

### Map

The intermediate operation `map` transforms each element into another object in turn according to the specified `Function` interface.

The example below shows converting strings to uppercase strings. You can also use `map` to convert objects to other types; the Stream type returned by `map` is determined by the return value of the function you pass into `map`.

```java
        // Test Map operation
        stringList
                .stream()
                .map(String::toUpperCase)
                .sorted((a, b) -> b.compareTo(a))
                .forEach(System.out::println);// "DDD2", "DDD1", "CCC", "BBB3", "BBB2", "BBB1", "AAA2", "AAA1"
```

### Match

Stream provides multiple matching operations, allowing you to test whether a specified `Predicate` matches the Stream. All matching operations are **terminal operations** and return a `boolean` value.

```java
        // Test Match operations
        boolean anyStartsWithA =
                stringList
                        .stream()
                        .anyMatch((s) -> s.startsWith("a"));
        System.out.println(anyStartsWithA);      // true

        boolean allStartsWithA =
                stringList
                        .stream()
                        .allMatch((s) -> s.startsWith("a"));

        System.out.println(allStartsWithA);      // false

        boolean noneStartsWithZ =
                stringList
                        .stream()
                        .noneMatch((s) -> s.startsWith("z"));

        System.out.println(noneStartsWithZ);      // true
```

### Count

Count is a **terminal operation** that returns the number of elements in the Stream; **the return value type is `long`**.

```java
      // Test Count operation
        long startsWithB =
                stringList
                        .stream()
                        .filter((s) -> s.startsWith("b"))
                        .count();
        System.out.println(startsWithB);    // 3
```

### Reduce

This is a **terminal operation** that allows reducing multiple elements in the stream into a single element via a specified function, and the reduced result is represented via the `Optional` interface:

```java
        // Test Reduce operation
        Optional<String> reduced =
                stringList
                        .stream()
                        .sorted()
                        .reduce((s1, s2) -> s1 + "#" + s2);

        reduced.ifPresent(System.out::println);//aaa1#aaa2#bbb1#bbb2#bbb3#ccc#ddd1#ddd2
```

**Translator's Note:** The main purpose of this method is to combine Stream elements together. It provides an initial value (seed), and then combines it according to an operation rule (`BinaryOperator`) with the first, second, ..., n-th elements of the Stream. In this sense, string concatenation as well as numeric `sum`, `min`, `max`, and `average` are all special cases of `reduce`. For example, Stream's `sum` is equivalent to `Integer sum = integers.reduce(0, (a, b) -> a+b);`. There is also a case without an initial value, where it combines the first two elements of the Stream and returns an `Optional`.

```java
// String concatenation, concat = "ABCD"
String concat = Stream.of("A", "B", "C", "D").reduce("", String::concat);
// Find minimum value, minValue = -3.0
double minValue = Stream.of(-1.5, 1.0, -3.0, -2.0).reduce(Double.MAX_VALUE, Double::min);
// Sum with an initial value, sumValue = 10
int sumValue = Stream.of(1, 2, 3, 4).reduce(0, Integer::sum);
// Sum without an initial value, sumValue = 10
sumValue = Stream.of(1, 2, 3, 4).reduce(Integer::sum).get();
// Filter and concatenate strings, concat = "ace"
concat = Stream.of("a", "B", "c", "D", "e", "F").
 filter(x -> x.compareTo("Z") > 0).
 reduce("", String::concat);
```

In the code above, for instance in the first `reduce()` example, the first argument (the empty string) is the initial value, and the second argument (`String::concat`) is the `BinaryOperator`. These `reduce()` calls with an initial value all return a concrete object. However, for the fourth example without an initial value, because there may not be enough elements, it returns an `Optional`—please note this difference. For more details, see: [IBM: Detailed Explanation of the Streams API in Java 8](https://www.ibm.com/developerworks/cn/java/j-lo-java8streamapi/index.html)

## Parallel Streams

As mentioned earlier, Streams have two modes: sequential and parallel. Operations on a sequential Stream are completed sequentially on a single thread, whereas a parallel Stream executes simultaneously across multiple threads.

The example below demonstrates how to improve performance using a parallel Stream:

First, we create a large list with no duplicate elements:

```java
int max = 1000000;
List<String> values = new ArrayList<>(max);
for (int i = 0; i < max; i++) {
    UUID uuid = UUID.randomUUID();
    values.add(uuid.toString());
}
```

We sort it using sequential and parallel approaches respectively, and then compare the time taken.

### Sequential Sort

```java
// Sequential sort
long t0 = System.nanoTime();
long count = Arrays.stream(list.stream().sorted().toArray()).count();
System.out.println(count);

long t1 = System.nanoTime();

long millis = TimeUnit.NANOSECONDS.toMillis(t1 - t0);
System.out.println(String.format("sequential sort took: %d ms", millis));
```

```plain
1000000
sequential sort took: 709 ms // Time taken by sequential sort
```

### Parallel Sort

```java
// Parallel sort
long t0 = System.nanoTime();

long count = Arrays.stream(list.parallelStream().sorted().toArray()).count();
System.out.println(count);

long t1 = System.nanoTime();

long millis = TimeUnit.NANOSECONDS.toMillis(t1 - t0);
System.out.println(String.format("parallel sort took: %d ms", millis));

```

```java
1000000
parallel sort took: 475 ms // Time taken by parallel sort
```

The two pieces of code above are almost identical, yet the parallel version is about 50% faster; the only change needed was replacing `stream()` with `parallelStream()`.

## Maps

As mentioned earlier, the `Map` type does not support streams directly, though `Map` provides several new useful methods to handle common daily tasks. The `Map` interface itself does not have a `stream()` method available, but you can create dedicated streams on keys or values, or via `map.keySet().stream()`, `map.values().stream()`, and `map.entrySet().stream()`.

In addition, `Map`s support various new and useful methods to perform common tasks.

```java
Map<Integer, String> map = new HashMap<>();

for (int i = 0; i < 10; i++) {
    map.putIfAbsent(i, "val" + i);
}

map.forEach((id, val) -> System.out.println(val));//val0 val1 val2 val3 val4 val5 val6 val7 val8 val9
```

`putIfAbsent` prevents us from writing extra code during null checks; `forEach` accepts a consumer to perform an operation on each element in the map.

This example shows how to compute values on a map using functions:

```java
map.computeIfPresent(3, (num, val) -> val + num);
map.get(3);             // val33

map.computeIfPresent(9, (num, val) -> null);
map.containsKey(9);     // false

map.computeIfAbsent(23, num -> "val" + num);
map.containsKey(23);    // true

map.computeIfAbsent(3, num -> "bam");
map.get(3);             // val33
```

Next, let's show how to remove an entry from a `Map` where both key and value match:

```java
map.remove(3, "val3");
map.get(3);             // val33
map.remove(3, "val33");
map.get(3);             // null
```

Another useful method:

```java
map.getOrDefault(42, "not found");  // not found
```

Merging elements of a `Map` has also become very easy:

```java
map.merge(9, "val9", (value, newValue) -> value.concat(newValue));
map.get(9);             // val9
map.merge(9, "concat", (value, newValue) -> value.concat(newValue));
map.get(9);             // val9concat
```

What `merge` does is insert the entry if the key name does not exist, otherwise perform a merge operation on the existing value corresponding to the key and re-insert it into the map.

## Date API

Java 8 includes a brand-new Date and Time API under the `java.time` package. The new Date API is similar to the Joda-Time library, though they are not identical. The following examples cover the most important parts of this new API. The translator modified most of this section by consulting relevant books.

**Translator's Note (Summary):**

- The `Clock` class provides methods to access the current date and time. `Clock` is timezone-aware and can be used to obtain the current milliseconds. A specific point in time can also be represented using the `Instant` class, and `Instant` can also be used to create legacy `java.util.Date` objects.

- In the new API, timezones are represented using `ZoneId`. A timezone can be easily obtained using the static method `of`. The abstract class `ZoneId` (in the `java.time` package) represents a zone identifier. It has a static method named `getAvailableZoneIds` that returns all zone identifiers.

- JDK 1.8 introduced classes such as `LocalDate` and `LocalDateTime` to handle date operations, and also introduced a new class `DateTimeFormatter` to handle date formatting issues. You can use `Instant` instead of `Date`, `LocalDateTime` instead of `Calendar`, and `DateTimeFormatter` instead of `SimpleDateFormat`.

### Clock

The `Clock` class provides methods to access the current date and time. `Clock` is timezone-aware and can be used to obtain the current milliseconds. A specific point in time can also be represented using the `Instant` class, and `Instant` can also be used to create legacy `java.util.Date` objects.

```java
Clock clock = Clock.systemDefaultZone();
long millis = clock.millis();
System.out.println(millis);//1552379579043
Instant instant = clock.instant();
System.out.println(instant);
Date legacyDate = Date.from(instant); //2019-03-12T08:46:42.588Z
System.out.println(legacyDate);//Tue Mar 12 16:32:59 CST 2019
```

### Timezones

In the new API, timezones are represented using `ZoneId`. A timezone can be easily obtained using the static method `of`. The abstract class `ZoneId` (in the `java.time` package) represents a zone identifier. It has a static method named `getAvailableZoneIds` that returns all zone identifiers.

```java
// Print all zone identifiers
System.out.println(ZoneId.getAvailableZoneIds());

ZoneId zone1 = ZoneId.of("Europe/Berlin");
ZoneId zone2 = ZoneId.of("Brazil/East");
System.out.println(zone1.getRules());// ZoneRules[currentStandardOffset=+01:00]
System.out.println(zone2.getRules());// ZoneRules[currentStandardOffset=-03:00]
```

### LocalTime

`LocalTime` defines a time without timezone information, such as 10 PM or 17:30:15. The example below creates two local times using the timezones created in the previous code, then compares the times and calculates the time difference between them in hours and minutes:

```java
LocalTime now1 = LocalTime.now(zone1);
LocalTime now2 = LocalTime.now(zone2);
System.out.println(now1.isBefore(now2));  // false

long hoursBetween = ChronoUnit.HOURS.between(now1, now2);
long minutesBetween = ChronoUnit.MINUTES.between(now1, now2);

System.out.println(hoursBetween);       // -3
System.out.println(minutesBetween);     // -239
```

`LocalTime` provides various factory methods to simplify object creation, including parsing time strings.

```java
LocalTime late = LocalTime.of(23, 59, 59);
System.out.println(late);       // 23:59:59
DateTimeFormatter germanFormatter =
    DateTimeFormatter
        .ofLocalizedTime(FormatStyle.SHORT)
        .withLocale(Locale.GERMAN);

LocalTime leetTime = LocalTime.parse("13:37", germanFormatter);
System.out.println(leetTime);   // 13:37
```

### LocalDate

`LocalDate` represents an exact date, such as 2014-03-11. Its value is immutable, and its usage is largely consistent with `LocalTime`. The example below demonstrates how to add or subtract days/months/years on a Date object. Also note that these objects are immutable, so operations always return a new instance.

```java
LocalDate today = LocalDate.now();// Get today's date
System.out.println("今天的日期: "+today);//2019-03-12
LocalDate tomorrow = today.plus(1, ChronoUnit.DAYS);
System.out.println("明天的日期: "+tomorrow);//2019-03-13
LocalDate yesterday = tomorrow.minusDays(2);
System.out.println("昨天的日期: "+yesterday);//2019-03-11
LocalDate independenceDay = LocalDate.of(2019, Month.MARCH, 12);
DayOfWeek dayOfWeek = independenceDay.getDayOfWeek();
System.out.println("今天是周几:"+dayOfWeek);//TUESDAY
```

Parsing a `LocalDate` from a string is just as simple as parsing a `LocalTime`. Below is an example of using `DateTimeFormatter` to parse strings:

```java
    String str1 = "2014==04==12 01时06分09秒";
        // Define the formatter used for parsing according to the date/time string
        DateTimeFormatter fomatter1 = DateTimeFormatter
                .ofPattern("yyyy==MM==dd HH时mm分ss秒");

        LocalDateTime dt1 = LocalDateTime.parse(str1, fomatter1);
        System.out.println(dt1); // Output: 2014-04-12T01:06:09

        String str2 = "2014$$$四月$$$13 20小时";
        DateTimeFormatter fomatter2 = DateTimeFormatter
                .ofPattern("yyy$$$MMM$$$dd HH小时");
        LocalDateTime dt2 = LocalDateTime.parse(str2, fomatter2);
        System.out.println(dt2); // Output: 2014-04-13T20:00

```

Let's look at another example of formatting a date using `DateTimeFormatter`:

```java
LocalDateTime rightNow=LocalDateTime.now();
String date=DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(rightNow);
System.out.println(date);//2019-03-12T16:26:48.29
DateTimeFormatter formatter=DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
System.out.println(formatter.format(rightNow));//2019-03-12 16:26:48
```

**🐛 Fix (see [issue#1157](https://github.com/Snailclimb/JavaGuide/issues/1157))**: When using `YYYY` to display the year, it displays the week-based year (the year of the current week), which causes problems during weeks spanning the turn of the year. In general, always use `yyyy` to display the accurate year.

Example of incorrect date display caused by a year-crossing week:

```java
LocalDateTime rightNow = LocalDateTime.of(2020, 12, 31, 12, 0, 0);
String date= DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(rightNow);
// 2020-12-31T12:00:00
System.out.println(date);
DateTimeFormatter formatterOfYYYY = DateTimeFormatter.ofPattern("YYYY-MM-dd HH:mm:ss");
// 2021-12-31 12:00:00
System.out.println(formatterOfYYYY.format(rightNow));

DateTimeFormatter formatterOfYyyy = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
// 2020-12-31 12:00:00
System.out.println(formatterOfYyyy.format(rightNow));
```

From the figure below you can see the specific error more clearly, and IntelliJ IDEA already smartly hints that `yyyy` is preferred over `YYYY`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/2021042717491413-86c79fbc.png)

### LocalDateTime

`LocalDateTime` represents both date and time, equivalent to combining the content of the previous two sections into a single object. Just like `LocalTime` and `LocalDate`, `LocalDateTime` is immutable. `LocalDateTime` provides methods for accessing specific fields.

```java
LocalDateTime sylvester = LocalDateTime.of(2014, Month.DECEMBER, 31, 23, 59, 59);

DayOfWeek dayOfWeek = sylvester.getDayOfWeek();
System.out.println(dayOfWeek);      // WEDNESDAY

Month month = sylvester.getMonth();
System.out.println(month);          // DECEMBER

long minuteOfDay = sylvester.getLong(ChronoField.MINUTE_OF_DAY);
System.out.println(minuteOfDay);    // 1439
```

As long as timezone information is attached, it can be converted to an `Instant` point-in-time object, and an `Instant` object can easily be converted to the legacy `java.util.Date`.

```java
Instant instant = sylvester
        .atZone(ZoneId.systemDefault())
        .toInstant();

Date legacyDate = Date.from(instant);
System.out.println(legacyDate);     // Wed Dec 31 23:59:59 CET 2014
```

Formatting a `LocalDateTime` is the same as formatting time and date; in addition to using predefined formats, we can also define custom formats:

```java
DateTimeFormatter formatter =
    DateTimeFormatter
        .ofPattern("MMM dd, yyyy - HH:mm");
LocalDateTime parsed = LocalDateTime.parse("Nov 03, 2014 - 07:13", formatter);
String string = formatter.format(parsed);
System.out.println(string);     // Nov 03, 2014 - 07:13
```

Unlike `java.text.NumberFormat`, the new `DateTimeFormatter` is immutable, so it is thread-safe.
Detailed information on date and time formats can be found [here](https://docs.oracle.com/javase/8/docs/api/java/time/format/DateTimeFormatter.html).

## Annotations

Java 8 supports repeatable (multiple) annotations. Let's look at an example first to understand what this means.
First, define a wrapper `Hints` annotation used to hold a group of specific `Hint` annotations:

```java
@Retention(RetentionPolicy.RUNTIME)
@interface Hints {
    Hint[] value();
}
@Repeatable(Hints.class)
@interface Hint {
    String value();
}
```

Java 8 allows us to use the same annotation type multiple times; we just need to annotate that annotation with `@Repeatable`.

Example 1: Using a wrapper class as a container to hold multiple annotations (the old approach)

```java
@Hints({@Hint("hint1"), @Hint("hint2")})
class Person {}
```

Example 2: Using repeatable annotations (the new approach)

```java
@Hint("hint1")
@Hint("hint2")
class Person {}
```

In the second example, the Java compiler implicitly defines the `@Hints` annotation for you. Understanding this helps when you retrieve this information using reflection:

```java
Hint hint = Person.class.getAnnotation(Hint.class);
System.out.println(hint);                   // null
Hints hints1 = Person.class.getAnnotation(Hints.class);
System.out.println(hints1.value().length);  // 2

Hint[] hints2 = Person.class.getAnnotationsByType(Hint.class);
System.out.println(hints2.length);          // 2
```

Even though we did not define the `@Hints` annotation on the `Person` class, we can still obtain the `@Hints` annotation via `getAnnotation(Hints.class)`. A more convenient method is using `getAnnotationsByType`, which directly retrieves all `@Hint` annotations.
Additionally, Java 8 expanded annotations to two new targets:

```java
@Target({ElementType.TYPE_PARAMETER, ElementType.TYPE_USE})
@interface MyAnnotation {}
```

## Where to go from here?

That's all for the new features of Java 8—there are certainly more features waiting to be explored. There are many other very useful things in JDK 1.8, such as `Arrays.parallelSort`, `StampedLock`, `CompletableFuture`, and so on.
