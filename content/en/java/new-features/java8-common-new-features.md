---
title: Java 8 New Features in Practice
description: Practical walkthrough of core Java 8 new features, including Lambda expressions, Stream API, Optional, Date-Time API, and interface default methods.
category: Java
tag:
  - Java New Features
lang: en
sourceRef: zh-ref/java/new-features/java8-common-new-features.md
head:
  - - meta
    - name: keywords
      content: Java 8,Lambda,Stream API,Optional,Date/Time API,Default Methods,Functional Interfaces
---

> This article was contributed by [cowbi](https://github.com/cowbi).

<!-- markdownlint-disable MD024 -->

JDK 8 was released on March 18, 2014. It is an LTS (Long-Term Support) release and one of the most widely used versions in the Java ecosystem over the long term. The LTS releases currently listed by Oracle include JDK 8, JDK 11, JDK 17, JDK 21, and JDK 25.

JDK 8 introduced many important new features, and this article selects several of the most important ones for a detailed introduction:

- Lambda expressions
- Stream API
- `Optional` class
- Date-Time API
- Interface default methods
- Functional interfaces

The chart below shows the number of new features and release dates for each release from JDK 8 to JDK 24:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

Oracle released Java 8 (JDK 1.8) in 2014, and since then it has seen long-term, widespread adoption across the Java ecosystem. Many programmers are still not familiar enough with some of its new features, especially developers accustomed to versions prior to Java 8, such as myself.

To avoid falling too far behind, it is well worth summarizing and organizing these new features. Compared with JDK 7, Java 8 brings many changes and optimizations—for example, an `interface` can have static methods with method bodies, which overturned earlier assumptions; `java.util.HashMap` added a Red-Black Tree to its internal data structure; and there are the well-known Lambda expressions, among others. This article cannot cover every single new feature, so it focuses on explaining the more commonly used ones in detail. For more related content, see [Oracle's official introduction to Java 8 new features](https://www.oracle.com/java/technologies/javase/8-whats-new.html).

## Interface

An `interface` was originally designed around abstraction to improve extensibility. However, that also came with a drawback: whenever an `interface` was modified, every class implementing it had to be modified as well.

To solve the incompatibility issue between modifying an interface and its existing implementations, methods in a new `interface` can be modified with `default` or `static`. This allows them to have a method body, so implementing classes do not have to override them.

A single `interface` can have multiple methods declared with these modifiers. The difference between the two modifiers is essentially the difference between regular instance methods and static methods:

1. Methods modified with `default` are regular instance methods; they can be invoked via `this` and can be inherited and overridden by subclasses.
2. Methods modified with `static` behave just like static methods in a regular class. However, they cannot be inherited by subclasses and can only be invoked using the `Interface` name.

Let's look at a practical example.

```java
public interface InterfaceNew {
    static void sm() {
        System.out.println("Implementation provided by interface");
    }
    static void sm2() {
        System.out.println("Implementation provided by interface");
    }

    default void def() {
        System.out.println("interface default method");
    }
    default void def2() {
        System.out.println("interface default2 method");
    }
    // Must be overridden by implementing classes
    void f();
}

public interface InterfaceNew1 {
    default void def() {
        System.out.println("InterfaceNew1 default method");
    }
}
```

If a class implements both `InterfaceNew` and `InterfaceNew1`, both interfaces define `def()`, and there is no inheritance relationship between `InterfaceNew` and `InterfaceNew1`, then the class must override `def()`. Otherwise, a compilation error will occur.

```java
public class InterfaceNewImpl implements InterfaceNew , InterfaceNew1{
    public static void main(String[] args) {
        InterfaceNewImpl interfaceNew = new InterfaceNewImpl();
        interfaceNew.def();
    }

    @Override
    public void def() {
        InterfaceNew1.super.def();
    }

    @Override
    public void f() {
    }
}
```

**In Java 8, what is the difference between an interface and an abstract class?**

Many developers think: "Since an interface can also have its own method implementations now, it doesn't seem much different from an abstract class."

In reality, they are still different:

1. The differences between an `interface` and a `class`—which may sound obvious—mainly include:

   - A class can implement multiple interfaces, while it can extend only a single class.
   - Instance methods without a method body in an interface are implicitly `public abstract`, and fields are implicitly `public static final`; in addition, an interface can declare methods such as `default` and `static`. Members of an `abstract class` can use a wider variety of modifiers.

2. Interface methods act more like an extension plugin, whereas abstract class methods are meant to be inherited.

As mentioned at the beginning, `default` and `static` methods were added to `interface` to solve the backward-compatibility issue when modifying interfaces with existing implementations—not to replace `abstract class`. In practice, wherever an `abstract class` should be used, you should still use an `abstract class` and not replace it with an `interface` just because of the new features.

**Remember that an interface is forever different from a class.**

## Functional Interfaces

**Definition**: Also known as a SAM interface (Single Abstract Method interface), it is an interface that has exactly one abstract method, while allowing multiple non-abstract methods.

In Java 8, there is a dedicated package for functional interfaces, `java.util.function`. Every interface in this package is annotated with `@FunctionalInterface` to support functional programming.

There are also functional interfaces in other packages, some of which do not carry the `@FunctionalInterface` annotation. However, as long as an interface satisfies the definition of a functional interface, it is a functional interface regardless of whether `@FunctionalInterface` is present—the annotation only serves to enforce the definition at compile time. Functional interfaces are widely used in Lambda expressions.

## Lambda Expressions

Next, let's talk about the well-known Lambda expressions. They are the most important new feature driving the release of Java 8, and the biggest language change since `Generics` and `Annotation`.

Using Lambda expressions makes code much more concise and compact, enabling Java to support simple *functional programming* as well.

> A Lambda expression is an anonymous function; Java 8 allows functions to be passed into methods as arguments.

### Syntax Format

```java
(parameters) -> expression or
(parameters) ->{ statements; }
```

### Lambda in Practice

Let's experience the convenience brought by Lambda through common practical examples.

#### Replacing Anonymous Inner Classes

In the past, the only way to pass dynamic behavior as a parameter to a method was to use an inner class. For example:

**1. `Runnable` Interface**

```java
new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("The runable now is using!");
            }
}).start();
// With lambda
new Thread(() -> System.out.println("It's a lambda function!")).start();
```

**2. `Comparator` Interface**

```java
List<Integer> strings = Arrays.asList(1, 2, 3);

Collections.sort(strings, new Comparator<Integer>() {
@Override
public int compare(Integer o1, Integer o2) {
    return Integer.compare(o1, o2);}
});

// Lambda
Collections.sort(strings, (Integer o1, Integer o2) -> Integer.compare(o1, o2));
// Broken down
Comparator<Integer> comparator = (Integer o1, Integer o2) -> Integer.compare(o1, o2);
Collections.sort(strings, comparator);
```

**3. `Listener` Interface**

```java
JButton button = new JButton();
button.addItemListener(new ItemListener() {
@Override
public void itemStateChanged(ItemEvent e) {
   e.getItem();
}
});
// lambda
button.addItemListener(e -> e.getItem());
```

**4. Custom Interfaces**

The three examples above are the ones we encounter most frequently in development, and from them you can already feel the convenience and clarity that Lambda brings. It keeps only the code actually being used and omits all boilerplate. So does Lambda impose any requirement on the interface? Notice that these anonymous inner classes override only one method of the interface—and of course there is only one method that needs to be overridden. That is the **functional interface** we mentioned earlier; in other words, as long as a method parameter is a functional interface, you can pass a Lambda expression.

```java
@FunctionalInterface
public interface Comparator<T>{
    int compare(T o1, T o2);
}

@FunctionalInterface
public interface Runnable{
    void run();
}
```

Let's define a custom functional interface:

```java
@FunctionalInterface
public interface LambdaInterface {
 void f();
}
// Usage
public class LambdaClass {
    public static void forEg() {
        lambdaInterfaceDemo(()-> System.out.println("Custom functional interface"));
    }
    // Functional interface parameter
    static void lambdaInterfaceDemo(LambdaInterface i){
        i.f();
    }
}
```

#### Collection Iteration

```java
void lamndaFor() {
        List<String> strings = Arrays.asList("1", "2", "3");
        // Traditional foreach
        for (String s : strings) {
            System.out.println(s);
        }
        // Lambda foreach
        strings.forEach((s) -> System.out.println(s));
        // or
        strings.forEach(System.out::println);
     // map
        Map<Integer, String> map = new HashMap<>();
        map.forEach((k,v)->System.out.println(v));
}
```

#### Method References

Java 8 allows using the `::` operator to pass references to methods or constructors. In all cases, the target type of the expression must be a functional interface.

```java
public class LambdaClassSuper {
    LambdaInterface sf(){
        return null;
    }
}

public class LambdaClass extends LambdaClassSuper {
    public static LambdaInterface staticF() {
        return null;
    }

    public LambdaInterface f() {
        return null;
    }

    void show() {
        // 1. Static method reference; target type must be a functional-interface
        LambdaInterface t = LambdaClass::staticF;

        // 2. Instance method reference
        LambdaClass lambdaClass = new LambdaClass();
        LambdaInterface lambdaInterface = lambdaClass::f;

        // 3. Superclass method reference
        LambdaInterface superf = super::sf;

        // 4. Constructor reference
        LambdaInterface tt = LambdaClassSuper::new;
    }
}
```

#### Accessing Variables

```java
int i = 0;
Collections.sort(strings, (Integer o1, Integer o2) -> o1 - i);
// i =3;
```

A Lambda expression can reference external local variables, but those variables must be `final` or effectively final (never reassigned after initialization). The compiler does not automatically add the `final` modifier to the variable.

## Stream

Java added the `java.util.stream` package, which shares the name "stream" with earlier streams, though the idea is somewhat different. Previously, the streams we encountered most often were resource streams such as `java.io.FileInputStream`, which transfer file data from one place to another—they only act as content carriers and do not perform any *CRUD* operations on the file contents.

`Stream` still does not store data, but unlike I/O streams, it can retrieve and logically process collection data, including filtering, sorting, statistics, counting, and more. You can think of it like SQL statements.

Its data source can be a `Collection`, an `Array`, and so on. Because its method parameters are all functional interface types, it is generally used together with Lambda expressions.

### Stream Types

1. `stream`: sequential stream
2. `parallelStream`: parallel stream, capable of multi-threaded execution

### Common Methods

Next, let's look at the commonly used methods of `java.util.stream.Stream`:

```java
/**
* Returns a sequential stream
*/
default Stream<E> stream()

/**
* Returns a parallel stream
*/
default Stream<E> parallelStream()

/**
* Returns a stream containing a single element T
*/
public static<T> Stream<T> of(T t)

/**
* Returns a sequential ordered stream whose elements are the specified values.
*/
public static<T> Stream<T> of(T... values) {
    return Arrays.stream(values);
}


/**
* Filters and returns a stream consisting of the elements of this stream that match the given predicate
*/
Stream<T> filter(Predicate<? super T> predicate);

/**
* Returns whether all elements of this stream match the provided predicate.
*/
boolean allMatch(Predicate<? super T> predicate)

/**
* Returns whether any elements of this stream match the provided predicate.
*/
boolean anyMatch(Predicate<? super T> predicate);

/**
* Returns a builder for a Stream.
*/
public static<T> Builder<T> builder();

/**
* Performs a mutable reduction operation on the elements of this stream using a Collector
*/
<R, A> R collect(Collector<? super T, A, R> collector);

/**
 * Returns the count of elements in this stream.
*/
long count();

/**
* Returns a stream consisting of the distinct elements (according to Object.equals(Object)) of this stream.
*/
Stream<T> distinct();

/**
 * Iterates over each element
*/
void forEach(Consumer<? super T> action);

/**
* Truncates the stream to obtain no longer than maxSize elements.
*/
Stream<T> limit(long maxSize);

/**
* Maps each element to its corresponding result
*/
<R> Stream<R> map(Function<? super T, ? extends R> mapper);

/**
* Sorts the stream according to the provided Comparator.
*/
Stream<T> sorted(Comparator<? super T> comparator);

/**
* Discards the first n elements of this stream and returns a new stream of the remaining elements.
*/
Stream<T> skip(long n);

/**
* Returns an array containing the elements of this stream.
*/
Object[] toArray();

/**
* Returns an array containing the elements of this stream, using the provided generator function to allocate the returned array, as well as any additional arrays that might be required for a partitioned execution or resizing.
*/
<A> A[] toArray(IntFunction<A[]> generator);

/**
* Concatenates two streams
*/
public static <T> Stream<T> concat(Stream<? extends T> a, Stream<? extends T> b)
```

### Practical Examples

This article demonstrates the usage of representative `Stream` methods; for more methods, please refer to the API documentation.

```java
@Test
public void test() {
  List<String> strings = Arrays.asList("abc", "def", "gkh", "abc");
    // Returns a stream matching the condition
    Stream<String> stringStream = strings.stream().filter(s -> "abc".equals(s));
    // Counts the number of elements matching the condition in the stream
    long count = stringStream.count();

    // forEach traversal -> prints elements
    strings.stream().forEach(System.out::println);

    // limit gets a stream of 1 element
    Stream<String> limit = strings.stream().limit(1);
    // toArray, e.g., when we want to inspect what is in limitStream by converting to String[] or looping
    String[] array = limit.toArray(String[]::new);

    // map transforms each element and returns a new stream
    Stream<String> map = strings.stream().map(s -> s + "22");

    // sorted sorts and prints
    strings.stream().sorted().forEach(System.out::println);

    // Collectors.collect puts "abc" elements into a container
    List<String> collect = strings.stream().filter(string -> "abc".equals(string)).collect(Collectors.toList());
    // Converts the list to a string with elements separated by commas
    String mergedString = strings.stream().filter(string -> !string.isEmpty()).collect(Collectors.joining(","));

    // Statistics on numeric collections, e.g.
    List<Integer> number = Arrays.asList(1, 2, 5, 4);

    IntSummaryStatistics statistics = number.stream().mapToInt((x) -> x).summaryStatistics();
    System.out.println("Largest number in list : "+statistics.getMax());
    System.out.println("Smallest number in list : "+statistics.getMin());
    System.out.println("Average : "+statistics.getAverage());
    System.out.println("Sum of all numbers : "+statistics.getSum());

    // concat merges streams
    List<String> strings2 = Arrays.asList("xyz", "jqx");
    Stream.concat(strings2.stream(),strings.stream()).count();

    // Note: A Stream can only be operated upon once and cannot be reused after closing, otherwise an error is thrown.
    Stream stream = strings.stream();
    // First use
    stream.limit(2);
    // Second use
    stream.forEach(System.out::println);
    // Throws java.lang.IllegalStateException: stream has already been operated upon or closed

    // Chained calls can be invoked continuously on the same pipeline
    strings.stream().limit(2).forEach(System.out::println);
}
```

### Lazy Execution

When calling methods that return a `Stream`, execution does not happen immediately; instead, execution is triggered only when a method that returns a non-`Stream` result is called. Because obtaining a `Stream` itself cannot be used directly—it needs to be processed into a regular type. You can think of `Stream` here somewhat like a binary stream (though they are two completely different things): you cannot read it directly just by holding the stream.

Let's break down the `filter` method below.

```java
@Test
public void laziness(){
  List<String> strings = Arrays.asList("abc", "def", "gkh", "abc");
  Stream<Integer> stream = strings.stream().filter(new Predicate() {
      @Override
      public boolean test(Object o) {
        System.out.println("Predicate.test executed");
        return true;
        }
      });

   System.out.println("count executed");
   stream.count();
}
/*-------Execution Result--------*/
count executed
Predicate.test executed
Predicate.test executed
Predicate.test executed
Predicate.test executed
```

Judging by statement order, one might expect "`Predicate.test` executed" to be printed 4 times first, followed by "`count` executed". The actual result is just the opposite. This proves that the predicate in `filter` does not execute immediately, and only runs after the `count()` method is invoked.

The examples above all use sequential `Stream`. Parallel `parallelStream` has the same API usage as sequential streams. The main difference is that `parallelStream` can execute across multiple threads, implemented on top of the `ForkJoin` framework—when you have time, you can look into the `ForkJoin` framework and `ForkJoinPool`. Here you can simply understand it as being backed by a thread pool, which brings considerations such as thread safety and thread overhead. Let's experience the multi-threaded execution of a parallel stream through code.

```java
@Test
public void parallelStreamTest(){
   List<Integer> numbers = Arrays.asList(1, 2, 5, 4);
   numbers.parallelStream() .forEach(num->System.out.println(Thread.currentThread().getName()+">>"+num));
}
// Execution result
main>>5
ForkJoinPool.commonPool-worker-2>>4
ForkJoinPool.commonPool-worker-11>>1
ForkJoinPool.commonPool-worker-9>>2
```

From the output, we can see that `forEach` uses multiple threads.

### Summary

From the source code and examples, we can summarize several characteristics of `Stream`:

1. Through clean chained programming, it makes it convenient to further process data during and after traversal.
2. Method parameters are all functional interface types.
3. A `Stream` can only be operated on once; once consumed, it is closed, and continuing to use that stream will throw an error.
4. `Stream` does not store data and does not modify the data source.

## Optional

In the [Alibaba Java Development Manual section on Optional](https://share.weiyun.com/ThuqEbD5), it states:

> Preventing NPE is a basic discipline for programmers. Watch out for scenarios that produce NPE:
>
> 1) When the return type is a primitive data type and a wrapper object is returned, auto-unboxing may produce an NPE.
>
> Counter-example: `public int f() { return Integer object }`, if it is `null`, auto-unboxing throws an NPE.
>
> 2) Database query results may be `null`.
>
> 3) Even if a collection passes `isNotEmpty`, an element retrieved from it may still be `null`.
>
> 4) When an object is returned from a remote call, always perform a null-pointer check to prevent NPE.
>
> 5) For data retrieved from a `Session`, it is recommended to perform an NPE check to avoid null pointers.
>
> 6) Chained calls such as `obj.getA().getB().getC()` are prone to producing NPEs.
>
> Positive example: Use JDK 8's `Optional` class to prevent NPE issues.

Here it is recommended to use `Optional` to explicitly express "there may be no result" in order to reduce certain NPE (`java.lang.NullPointerException`) risks. An `Optional` either contains a non-`null` value or is empty—it never stores `null` internally. Next, let's peel back the layers of `Optional` step by step through its source code.

Suppose there is a `Zoo` class containing a `Dog` property, and the requirement is to get the `Dog`'s `age`.

```java
class Zoo {
   private Dog dog;
}

class Dog {
   private int age;
}
```

The traditional way to prevent an NPE is as follows:

```java
Zoo zoo = getZoo();
if(zoo != null){
   Dog dog = zoo.getDog();
   if(dog != null){
      int age = dog.getAge();
      System.out.println(age);
   }
}
```

Checking non-null at every level—some say this style is ugly and inelegant, though I don't think so. In fact, it looks quite clean, readable, and easy to understand. What do you think?

With `Optional`, it is implemented like this:

```java
Optional.ofNullable(zoo).map(o -> o.getDog()).map(d -> d.getAge()).ifPresent(age ->
    System.out.println(age)
);
```

Isn't that much more concise?

### How to Create an Optional

In the example above, `Optional.ofNullable` is one way to create an `Optional`. Let's first look at what it means along with the source code of the other methods for creating an `Optional`.

```java
/**
* Common instance for {@code empty()}. Global EMPTY object
*/
private static final Optional<?> EMPTY = new Optional<>();

/**
* Value maintained by Optional
*/
private final T value;

/**
* Returns EMPTY if value is null, otherwise returns of(T)
*/
public static <T> Optional<T> ofNullable(T value) {
   return value == null ? empty() : of(value);
}
/**
* Returns the EMPTY object
*/
public static<T> Optional<T> empty() {
   Optional<T> t = (Optional<T>) EMPTY;
   return t;
}
/**
* Returns an Optional object
*/
public static <T> Optional<T> of(T value) {
    return new Optional<>(value);
}
/**
* Private constructor that assigns value
*/
private Optional(T value) {
  this.value = Objects.requireNonNull(value);
}
/**
* Therefore, if the value passed to of(T value) is null, a NullPointerException is thrown, which seemingly does not solve the NPE issue
*/
public static <T> T requireNonNull(T obj) {
  if (obj == null)
         throw new NullPointerException();
  return obj;
}
```

The main difference between `ofNullable` and `of` is: when `value` is `null`, `ofNullable` returns an empty `Optional`, whereas `of` throws a `NullPointerException`. Use `ofNullable` when `null` represents a valid "no value" case; use `of` when the argument is expected by contract to be non-`null` so errors are exposed early.

**What is the difference between `map()` and `flatMap()`?**

Both `map` and `flatMap` apply a function to each element in a collection, but the difference is that `map` returns a new collection of mapped results, whereas `flatMap` maps each element to a collection/stream and then flattens all of those into one.

In practical scenarios, if `map` returns arrays, what you end up with is a two-dimensional structure; `flatMap` is used to flatten that two-dimensional structure into a one-dimensional collection.

```java
public class MapAndFlatMapExample {
    public static void main(String[] args) {
        List<String[]> listOfArrays = Arrays.asList(
                new String[]{"apple", "banana", "cherry"},
                new String[]{"orange", "grape", "pear"},
                new String[]{"kiwi", "melon", "pineapple"}
        );

        List<String[]> mapResult = listOfArrays.stream()
                .map(array -> Arrays.stream(array).map(String::toUpperCase).toArray(String[]::new))
                .collect(Collectors.toList());

        System.out.println("Using map:");
        mapResult.forEach(arrays-> System.out.println(Arrays.toString(arrays)));

        List<String> flatMapResult = listOfArrays.stream()
                .flatMap(array -> Arrays.stream(array).map(String::toUpperCase))
                .collect(Collectors.toList());

        System.out.println("Using flatMap:");
        System.out.println(flatMapResult);
    }
}

```

Output:

```plain
Using map:
[[APPLE, BANANA, CHERRY], [ORANGE, GRAPE, PEAR], [KIWI, MELON, PINEAPPLE]]

Using flatMap:
[APPLE, BANANA, CHERRY, ORANGE, GRAPE, PEAR, KIWI, MELON, PINEAPPLE]
```

The simplest way to understand it is that `flatMap()` can flatten the result of `map()`.

In `Optional`, when using `map()`, if the mapping function returns a normal value, it wraps that value in a new `Optional`. When using `flatMap()`, if the mapping function returns an `Optional`, it flattens that returned `Optional` instead of wrapping it inside a nested `Optional`.

Below is a comparison example:

```java
public static void main(String[] args) {
        int userId = 1;

        // Code using flatMap
        String cityUsingFlatMap = getUserById(userId)
                .flatMap(OptionalExample::getAddressByUser)
                .map(Address::getCity)
                .orElse("Unknown");

        System.out.println("User's city using flatMap: " + cityUsingFlatMap);

        // Code without flatMap
        Optional<Optional<Address>> optionalAddress = getUserById(userId)
                .map(OptionalExample::getAddressByUser);

        String cityWithoutFlatMap;
        if (optionalAddress.isPresent()) {
            Optional<Address> addressOptional = optionalAddress.get();
            if (addressOptional.isPresent()) {
                Address address = addressOptional.get();
                cityWithoutFlatMap = address.getCity();
            } else {
                cityWithoutFlatMap = "Unknown";
            }
        } else {
            cityWithoutFlatMap = "Unknown";
        }

        System.out.println("User's city without flatMap: " + cityWithoutFlatMap);
    }
```

Using `flatMap` properly in `Stream` and `Optional` can eliminate a great deal of unnecessary code.

### Checking Whether `value` Is `null`

```java
/**
* Whether value is non-null
*/
public boolean isPresent() {
    return value != null;
}
/**
* Executes consumer.accept if value is not null
*/
public void ifPresent(Consumer<? super T> consumer) {
   if (value != null)
    consumer.accept(value);
}
```

### Retrieving `value`

```java
/**
* Return the value if present, otherwise invoke {@code other} and return
* the result of that invocation.
* Returns value if value != null, otherwise returns the result of executing other
*/
public T orElseGet(Supplier<? extends T> other) {
    return value != null ? value : other.get();
}

/**
* Returns value if value != null, otherwise returns other
*/
public T orElse(T other) {
    return value != null ? value : other;
}

/**
* Returns value if value != null, otherwise throws the exception returned by the supplier
*/
public <X extends Throwable> T orElseThrow(Supplier<? extends X> exceptionSupplier) throws X {
        if (value != null) {
            return value;
        } else {
            throw exceptionSupplier.get();
        }
}
/**
* Throws NoSuchElementException if value is null; returns value if non-null.
*/
public T get() {
  if (value == null) {
      throw new NoSuchElementException("No value present");
  }
  return value;
}
```

### Filtering Values

```java
/**
* 1. Returns empty if already empty
* 2. Returns this if predicate.test(value)==true, otherwise returns empty
*/
public Optional<T> filter(Predicate<? super T> predicate) {
        Objects.requireNonNull(predicate);
        if (!isPresent())
            return this;
        else
            return predicate.test(value) ? this : empty();
}
```

### Summary

After reading the `Optional` source code, we can see that `of()` requires a non-`null` argument, `get()` throws `NoSuchElementException` when the `Optional` is empty, and `flatMap()` is used to flatten mapping results that return an `Optional`—it is not a method to be avoided. Generally, you should choose `of()` or `ofNullable()` depending on whether absence is allowed, and prefer methods like `orElse`, `orElseGet`, and `orElseThrow` to handle empty values. Finally, let's combine the high-frequency `Optional` methods together:

```java
Optional.ofNullable(zoo).map(o -> o.getDog()).map(d -> d.getAge()).filter(v->v==1).orElse(3);
```

## Date-Time API

This is a powerful addition complementing `java.util.Date`, solving most of the pain points of the `Date` class:

1. Not thread-safe
2. Troublesome time zone handling
3. Cumbersome formatting and date calculations
4. Flawed design—the `Date` class contains both date and time, and there is also `java.sql.Date`, which is easy to confuse

Let's compare `java.util.Date` with the new Date-Time API using common date/time examples. Any code still using `java.util.Date` ought to be refactored.

### Main Classes in `java.time`

`java.util.Date` contains both date and time, whereas `java.time` separates them:

```java
LocalDateTime.class // Date + time format: yyyy-MM-ddTHH:mm:ss.SSS
LocalDate.class // Date format: yyyy-MM-dd
LocalTime.class // Time format: HH:mm:ss
```

### Formatting

**Before Java 8:**

```java
public void oldFormat(){
    Date now = new Date();
    // format yyyy-MM-dd
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
    String date  = sdf.format(now);
    System.out.println(String.format("date format : %s", date));

    // format HH:mm:ss
    SimpleDateFormat sdft = new SimpleDateFormat("HH:mm:ss");
    String time = sdft.format(now);
    System.out.println(String.format("time format : %s", time));

    // format yyyy-MM-dd HH:mm:ss
    SimpleDateFormat sdfdt = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    String datetime = sdfdt.format(now);
    System.out.println(String.format("dateTime format : %s", datetime));
}
```

**Java 8 and later:**

```java
public void newFormat(){
    // format yyyy-MM-dd
    LocalDate date = LocalDate.now();
    System.out.println(String.format("date format : %s", date));

    // format HH:mm:ss
    LocalTime time = LocalTime.now().withNano(0);
    System.out.println(String.format("time format : %s", time));

    // format yyyy-MM-dd HH:mm:ss
    LocalDateTime dateTime = LocalDateTime.now();
    DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    String dateTimeStr = dateTime.format(dateTimeFormatter);
    System.out.println(String.format("dateTime format : %s", dateTimeStr));
}
```

### Parsing Strings to Date Formats

**Before Java 8:**

```java
// Deprecated
Date date = new Date("2021-01-26");
// Replaced with
SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
Date date1 = sdf.parse("2021-01-26");
```

**Java 8 and later:**

```java
LocalDate date = LocalDate.of(2021, 1, 26);
LocalDate.parse("2021-01-26");

LocalDateTime dateTime = LocalDateTime.of(2021, 1, 26, 12, 12, 22);
LocalDateTime.parse("2021-01-26T12:12:22");

LocalTime time = LocalTime.of(12, 12, 22);
LocalTime.parse("12:12:22");
```

**Before Java 8**, conversions required the `SimpleDateFormat` class, whereas **from Java 8 onward**, you only need the `of` or `parse` methods on `LocalDate`, `LocalTime`, and `LocalDateTime`.

### Date Calculations

Below we take **the date one week later** as an example; other units (years, months, days, half-days, hours, etc.) follow the exact same pattern. Moreover, all of these units are defined in the _java.time.temporal.ChronoUnit_ enum.

**Before Java 8:**

```java
public void afterDay(){
     // Date one week later
     SimpleDateFormat formatDate = new SimpleDateFormat("yyyy-MM-dd");
     Calendar ca = Calendar.getInstance();
     ca.add(Calendar.DATE, 7);
     Date d = ca.getTime();
     String after = formatDate.format(d);
     System.out.println("Date one week later: " + after);

   // Calculate the number of days between two dates; calculating years or months apart is similar
     String dates1 = "2021-12-23";
   String dates2 = "2021-02-26";
     SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
     Date date1 = format.parse(dates1);
     Date date2 = format.parse(dates2);
     int day = (int) ((date1.getTime() - date2.getTime()) / (1000 * 3600 * 24));
     System.out.println(dates1 + " and " + dates2 + " differ by " + day + " days");
     // Result: 2021-02-26 and 2021-12-23 differ by 300 days
}
```

**Java 8 and later:**

```java
public void pushWeek(){
     // Date one week later
     LocalDate localDate = LocalDate.now();
     // Method 1
     LocalDate after = localDate.plus(1, ChronoUnit.WEEKS);
     // Method 2
     LocalDate after2 = localDate.plusWeeks(1);
     System.out.println("Date one week later: " + after);

     // Calculate the days, months, and years between two dates
     LocalDate date1 = LocalDate.parse("2021-02-26");
     LocalDate date2 = LocalDate.parse("2021-12-23");
     Period period = Period.between(date1, date2);
     System.out.println("Difference from date1 to date2: "
                + period.getYears() + " years "
                + period.getMonths() + " months "
                + period.getDays() + " days");
   // Output is "Difference from date1 to date2: 0 years 9 months 27 days"
     // Here period.getDays() returns the remaining days excluding years and months, not the total days
     // To get the pure total number of days, use the method below
     long day = date2.toEpochDay() - date1.toEpochDay();
     System.out.println(date1 + " and " + date2 + " differ by " + day + " days");
     // Output: 2021-02-26 and 2021-12-23 differ by 300 days
}
```

### Getting Specific Dates

Aside from cumbersome date arithmetic, getting a specific date was also tedious—such as getting the last day or first day of the current month.

**Before Java 8:**

```java
public void getDay() {

        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        // Get the first day of the current month:
        Calendar c = Calendar.getInstance();
        c.set(Calendar.DAY_OF_MONTH, 1);
        String first = format.format(c.getTime());
        System.out.println("first day:" + first);

        // Get the last day of the current month
        Calendar ca = Calendar.getInstance();
        ca.set(Calendar.DAY_OF_MONTH, ca.getActualMaximum(Calendar.DAY_OF_MONTH));
        String last = format.format(ca.getTime());
        System.out.println("last day:" + last);

        // Last day of the current year
        Calendar currCal = Calendar.getInstance();
        Calendar calendar = Calendar.getInstance();
        calendar.clear();
        calendar.set(Calendar.YEAR, currCal.get(Calendar.YEAR));
        calendar.roll(Calendar.DAY_OF_YEAR, -1);
        Date time = calendar.getTime();
        System.out.println("last day:" + format.format(time));
}
```

**Java 8 and later:**

```java
public void getDayNew() {
    LocalDate today = LocalDate.now();
    // Get the first day of the current month:
    LocalDate firstDayOfThisMonth = today.with(TemporalAdjusters.firstDayOfMonth());
    // Get the last day of the current month
    LocalDate lastDayOfThisMonth = today.with(TemporalAdjusters.lastDayOfMonth());
    // Get the next day:
    LocalDate nextDay = lastDayOfThisMonth.plusDays(1);
    // Last day of the current year
    LocalDate lastday = today.with(TemporalAdjusters.lastDayOfYear());
    // The last Sunday of 2021—doing this with Calendar would be terribly tedious.
    LocalDate lastMondayOf2021 = LocalDate.parse("2021-12-31").with(TemporalAdjusters.lastInMonth(DayOfWeek.SUNDAY));
}
```

`java.time.temporal.TemporalAdjusters` contains many other convenient helpers. I won't walk through the API here—they are all very simple and immediately clear at a glance.

### JDBC and Java 8

Now the mapping between JDBC temporal types and Java 8 date/time types is:

1. `Date` ---> `LocalDate`
2. `Time` ---> `LocalTime`
3. `Timestamp` ---> `LocalDateTime`

Prior to JDBC 4.2, `java.sql.Date`, `java.sql.Time`, and `java.sql.Timestamp` were typically used to represent these SQL temporal types respectively.

### Time Zones

> Time zones: Officially, time zones are divided every 15° of longitude, creating 24 time zones globally, with each zone differing by 1 hour. However, for administrative convenience, an entire country or province is often grouped together—for instance, China spans a vast territory across roughly 5 time zones, yet in practice uniformly uses the UTC+8 standard time, i.e., Beijing Time.

A `java.util.Date` object essentially stores the number of milliseconds elapsed from 00:00:00 on January 1, 1970 (GMT) to the instant represented by the `Date` object. That means regardless of which time zone you instantiate a `new Date()` in, the millisecond timestamp it records is the same and has nothing to do with time zones. In practice, however, it needs to be converted into local time, which involves internationalization of time. `java.util.Date` itself does not support time zone formatting directly and must rely on `TimeZone`.

```java
// Beijing Time: Wed Jan 27 14:05:29 CST 2021
Date date = new Date();

SimpleDateFormat bjSdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
// Beijing time zone
bjSdf.setTimeZone(TimeZone.getTimeZone("Asia/Shanghai"));
System.out.println("Milliseconds:" + date.getTime() + ", Beijing Time:" + bjSdf.format(date));

// Tokyo time zone
SimpleDateFormat tokyoSdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
tokyoSdf.setTimeZone(TimeZone.getTimeZone("Asia/Tokyo"));  // Set Tokyo time zone
System.out.println("Milliseconds:" + date.getTime() + ", Tokyo Time:" + tokyoSdf.format(date));

// Printing directly automatically converts to the current system time zone
System.out.println(date);
// Wed Jan 27 14:05:29 CST 2021
```

In the new Date-Time API, `java.time.ZonedDateTime` was introduced to represent date-time with a time zone. You can think of it as `LocalDateTime + ZoneId`.

```java
// Current time zone date-time
ZonedDateTime zonedDateTime = ZonedDateTime.now();
System.out.println("Current time zone: " + zonedDateTime);

// Tokyo time
ZoneId zoneId = ZoneId.of(ZoneId.SHORT_IDS.get("JST"));
ZonedDateTime tokyoTime = zonedDateTime.withZoneSameInstant(zoneId);
System.out.println("Tokyo time: " + tokyoTime);

// Convert ZonedDateTime to LocalDateTime
LocalDateTime localDateTime = tokyoTime.toLocalDateTime();
System.out.println("Tokyo time converted to LocalDateTime: " + localDateTime);

// Convert LocalDateTime to ZonedDateTime
ZonedDateTime localZoned = localDateTime.atZone(ZoneId.systemDefault());
System.out.println("Local time zone: " + localZoned);

// Output
Current time zone: 2021-01-27T14:43:58.735+08:00[Asia/Shanghai]
Tokyo time: 2021-01-27T15:43:58.735+09:00[Asia/Tokyo]
Tokyo time converted to LocalDateTime: 2021-01-27T15:43:58.735
Local time zone: 2021-01-27T15:43:58.735+08:00[Asia/Shanghai]
```

### Summary

Comparing the old and new `Date` APIs above only covers part of the functional differences; there are many more capabilities left for you to explore. In short, the Date-Time API is a huge boon for date/time operations. In daily work, whenever you need to deal with date operations, consider the Date-Time API first, and only fall back to the legacy `Date` if it genuinely cannot solve the case.

## Conclusion

The Java 8 new features we reviewed and summarized include:

- Interface & functional Interface
- Lambda
- Stream
- Optional
- Date time-api

These are all features frequently used in development. Going through them shows just how rewarding they are to use, and I only wish I had adopted them sooner. I used to feel that learning Java 8's new features was too much trouble and stuck with the old approaches. In reality, you can master these features in just a few days, and once you do, your productivity improves dramatically. After all, raises come from what we learn—if we stop learning, we will eventually fall behind, and the mid-career "age 35 crisis" will arrive even sooner.
