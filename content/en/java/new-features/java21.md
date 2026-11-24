---
title: "Java 21 (JDK 21) New Features: Virtual Threads, Generational ZGC, and Sequenced Collections"
description: "Detailed guide to Java 21 (JDK 21) new features, covering Virtual Threads, Generational ZGC, Sequenced Collections, Record Patterns, Pattern Matching for switch, LTS support lifecycle, and noting the withdrawn String Templates preview feature."
category: Java
tag:
  - Java New Features
head:
  - - meta
    - name: keywords
      content: Java 21,JDK 21,JDK 21 new features,Java 21 new features,LTS,Virtual Threads,Sequenced Collections,Generational ZGC,Record Patterns,Pattern Matching for switch,String Templates,Foreign Function & Memory API
lang: en
sourceRef: zh-ref/java/new-features/java21.md
---

Java 21 (JDK 21) was officially released on September 19, 2023, and is designated by Oracle as a Long-Term Support (LTS) release.

According to Oracle's Java SE Support Roadmap updated in April 2026, Oracle JDK 21 receives Premier Support through September 2028 and Extended Support through September 2031. Free update and commercial support lifecycles may vary across different JDK distributions.

JDK 21 introduces 15 new features in total. This article selects the more important ones for a detailed introduction:

- [JEP 430: String Templates](https://openjdk.org/jeps/430) (Preview)
- [JEP 431: Sequenced Collections](https://openjdk.org/jeps/431)
- [JEP 439: Generational ZGC](https://openjdk.org/jeps/439)
- [JEP 440: Record Patterns](https://openjdk.org/jeps/440)
- [JEP 441: Pattern Matching for switch](https://openjdk.org/jeps/441)
- [JEP 442: Foreign Function & Memory API](https://openjdk.org/jeps/442) (Third Preview)
- [JEP 443: Unnamed Patterns and Variables](https://openjdk.org/jeps/443) (Preview)
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [JEP 445: Unnamed Classes and Instance Main Methods](https://openjdk.org/jeps/445) (Preview)

If your primary focus is upgrading production workloads, start with Sequenced Collections, Generational ZGC, and Virtual Threads. String Templates was only available as a preview feature in JDK 21 and JDK 22; the proposal was subsequently withdrawn, so this API and syntax are no longer provided in current JDK releases.

The chart below shows the number of new features and release dates for each JDK version from JDK 8 to JDK 24:

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/new-features/jdk8-jdk24-a3e32dd5.png)

## JEP 430: String Templates (Preview)

String Templates was a preview feature in JDK 21. It underwent a second preview in JDK 22 and was subsequently withdrawn, so current JDK releases no longer provide this API or syntax.

String Templates offered a cleaner and more intuitive way to dynamically construct strings. The JDK 21 preview syntax used `\{expression}` for embedded expressions, with templates evaluated by a template processor. Expressions supported local variables, static or non-static fields, method calls, and computed results.

In fact, string templates exist in most programming languages:

```typescript
"Greetings {{ name }}!";  //Angular
`Greetings ${ name }!`;    //Typescript
$"Greetings { name }!"    //Visual basic
f"Greetings { name }!"    //Python
```

Before String Templates in Java, we typically used string concatenation or formatting methods to construct strings:

```java
//concatenation
message = "Greetings " + name + "!";

//String.format()
message = String.format("Greetings %s!", name);  //concatenation

//MessageFormat
message = new MessageFormat("Greetings {0}!").format(name);

//StringBuilder
message = new StringBuilder().append("Greetings ").append(name).append("!").toString();
```

Each of these approaches has drawbacks to some degree, such as poor readability, verbosity, or complexity.

Using String Templates in Java allows expressions to be embedded directly within a string without extra processing steps:

```java
String message = STR."Greetings \{name}!";
```

In the template expression above:

- `STR` is a template processor.
- `\{name}` is an embedded expression; at runtime, these expressions are replaced with the corresponding variable values.

Java supported three built-in template processors:

- `STR`: Automatically performs string interpolation, replacing each embedded expression in the template with its value (converted to a string).
- `FMT`: Similar to `STR`, except it also accepts format specifiers placed to the left of an embedded expression to control output formatting.
- `RAW`: Unlike the `STR` and `FMT` template processors, it does not automatically evaluate the template; instead, it returns a `StringTemplate` object containing the template's text fragments and expression values.

```java
String name = "Lokesh";

//STR
String message = STR."Greetings \{name}.";

//FMT
String message = FMT."Greetings %-12s\{name}.";

//RAW
StringTemplate st = RAW."Greetings \{name}.";
String message = STR.process(st);
```

In addition to the three built-in template processors, you can create your own template processor by implementing the `StringTemplate.Processor` interface and its `process` method.

We can use local variables, static/non-static fields, or even methods as embedded expressions:

```java
//variable
message = STR."Greetings \{name}!";

//method
message = STR."Greetings \{getName()}!";

//field
message = STR."Greetings \{this.name}!";
```

You can also perform calculations directly inside expressions and print the result:

```java
int x = 10, y = 20;
String s = STR."\{x} + \{y} = \{x + y}";  //"10 + 20 = 30"
```

To improve readability, embedded expressions can span multiple lines:

```java
String time = STR."The current time is \{
    //sample comment - current time in HH:mm:ss
    DateTimeFormatter
      .ofPattern("HH:mm:ss")
      .format(LocalTime.now())
  }.";
```

## JEP 431: Sequenced Collections

JDK 21 introduces a new set of collection interfaces: **Sequenced Collections**. These collections have a well-defined encounter order and provide uniform methods to access the first and last elements as well as obtain a reversed view.

Sequenced Collections consist of the following three interfaces:

- [`SequencedCollection`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedCollection.html)
- [`SequencedSet`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedSet.html)
- [`SequencedMap`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedMap.html)

The `SequencedCollection` interface extends `Collection` and provides methods to access, add, or remove elements at both ends of the collection, as well as obtain a reversed view.

```java
interface SequencedCollection<E> extends Collection<E> {

  // New Method

  SequencedCollection<E> reversed();

  // Promoted methods from Deque<E>

  void addFirst(E);
  void addLast(E);

  E getFirst();
  E getLast();

  E removeFirst();
  E removeLast();
}
```

The `List` and `Deque` interfaces extend `SequencedCollection`.

Let's use `ArrayList` as an example to demonstrate this in practice:

```java
ArrayList<Integer> arrayList = new ArrayList<>();

arrayList.add(1);   // List contains: [1]

arrayList.addFirst(0);  // List contains: [0, 1]
arrayList.addLast(2);   // List contains: [0, 1, 2]

Integer firstElement = arrayList.getFirst();  // 0
Integer lastElement = arrayList.getLast();  // 2

List<Integer> reversed = arrayList.reversed();
System.out.println(reversed); // Prints [2, 1, 0]
```

The `SequencedSet` interface directly extends `SequencedCollection` and overrides the `reversed()` method.

```java
interface SequencedSet<E> extends SequencedCollection<E>, Set<E> {

    SequencedSet<E> reversed();
}
```

The `SortedSet` interface extends `SequencedSet`, and `LinkedHashSet` implements `SequencedSet`.

Let's use `LinkedHashSet` as an example to demonstrate this in practice:

```java
LinkedHashSet<Integer> linkedHashSet = new LinkedHashSet<>(List.of(1, 2, 3));

Integer firstElement = linkedHashSet.getFirst();   // 1
Integer lastElement = linkedHashSet.getLast();    // 3

linkedHashSet.addFirst(0);  //List contains: [0, 1, 2, 3]
linkedHashSet.addLast(4);   //List contains: [0, 1, 2, 3, 4]

System.out.println(linkedHashSet.reversed());   //Prints [4, 3, 2, 1, 0]
```

The `SequencedMap` interface extends `Map` and provides methods to access, add, or remove key-value entries at both ends, obtain a `SequencedSet` of keys, a `SequencedCollection` of values, a `SequencedSet` of entries, and a reversed view of the map.

```java
interface SequencedMap<K,V> extends Map<K,V> {

  // New Methods

  SequencedMap<K,V> reversed();

  SequencedSet<K> sequencedKeySet();
  SequencedCollection<V> sequencedValues();
  SequencedSet<Entry<K,V>> sequencedEntrySet();

  V putFirst(K, V);
  V putLast(K, V);


  // Promoted Methods from NavigableMap<K, V>

  Entry<K, V> firstEntry();
  Entry<K, V> lastEntry();

  Entry<K, V> pollFirstEntry();
  Entry<K, V> pollLastEntry();
}
```

The `SortedMap` interface extends `SequencedMap`, and `LinkedHashMap` implements `SequencedMap`.

Let's use `LinkedHashMap` as an example to demonstrate this in practice:

```java
LinkedHashMap<Integer, String> map = new LinkedHashMap<>();

map.put(1, "One");
map.put(2, "Two");
map.put(3, "Three");

map.firstEntry();   //1=One
map.lastEntry();    //3=Three

System.out.println(map);  //{1=One, 2=Two, 3=Three}

Map.Entry<Integer, String> first = map.pollFirstEntry();   //1=One
Map.Entry<Integer, String> last = map.pollLastEntry();    //3=Three

System.out.println(map);  //{2=Two}

map.putFirst(1, "One");     //{1=One, 2=Two}
map.putLast(3, "Three");    //{1=One, 2=Two, 3=Three}

System.out.println(map);  //{1=One, 2=Two, 3=Three}
System.out.println(map.reversed());   //{3=Three, 2=Two, 1=One}
```

## JEP 439: Generational ZGC

JDK 21 extends ZGC by adding generational garbage collection support. However, it is disabled by default and must be enabled via JVM flags:

```bash
# Enable Generational ZGC in JDK 21
java -XX:+UseZGC -XX:+ZGenerational ...
```

Subsequent releases completed this two-step evolution: JDK 23 made generational mode the default for ZGC via [JEP 474](https://openjdk.org/jeps/474), and JDK 24 removed non-generational mode via [JEP 490](https://openjdk.org/jeps/490). Consequently, in JDK 23 and later, passing `-XX:+UseZGC` alone enables Generational ZGC without needing `-XX:+ZGenerational`. Note that this does not mean the JVM selects ZGC by default; JDK 21 and 22 still require enabling generational mode explicitly with the command above.

While maintaining ZGC's low-pause-time goal, Generational ZGC collects young objects more frequently to lower the risk of allocation stalls, reduce required heap memory overhead, and improve throughput.

## JEP 440: Record Patterns

Record Patterns entered their first preview in Java 19 via [JEP 405](https://openjdk.org/jeps/405), and their second preview in JDK 20 via [JEP 432](https://openjdk.org/jeps/432). Finally, Record Patterns became a finalized feature in JDK 21.

[Java 20 New Features Overview](./java20.md) already covered Record Patterns in detail, so it will not be repeated here.

## JEP 441: Pattern Matching for switch

Enhances `switch` expressions and statements in Java by allowing patterns in `case` labels. When a pattern matches, the code corresponding to that `case` label is executed.

In the code below, the `switch` expression uses type patterns for matching:

```java
static String formatterPatternSwitch(Object obj) {
    return switch (obj) {
        case Integer i -> String.format("int %d", i);
        case Long l    -> String.format("long %d", l);
        case Double d  -> String.format("double %f", d);
        case String s  -> String.format("String %s", s);
        default        -> obj.toString();
    };
}
```

## JEP 442: Foreign Function & Memory API (Third Preview)

This API allows Java programs to interoperate with code and data outside the Java runtime. By efficiently invoking foreign functions (code outside the JVM) and safely accessing foreign memory (memory not managed by the JVM), it enables Java programs to call native libraries and process native data without the danger and fragility of JNI.

The Foreign Function & Memory API completed its first incubator round in Java 17 via [JEP 412](https://openjdk.java.net/jeps/412), its second incubator round in Java 18 via [JEP 419](https://openjdk.org/jeps/419), its first preview in Java 19 via [JEP 424](https://openjdk.org/jeps/424), its second preview in JDK 20 via [JEP 434](https://openjdk.org/jeps/434), and its third preview in JDK 21 via [JEP 442](https://openjdk.org/jeps/442).

I have covered the Foreign Function & Memory API in detail in [Java 19 New Features Overview](./java19.md), so it will not be repeated here.

## JEP 443: Unnamed Patterns and Variables (Preview)

Unnamed Patterns and Variables allow using an underscore `_` to denote unnamed variables and unused components in pattern matching, aiming to improve code readability and maintainability.

Typical use cases for unnamed variables include `try-with-resources` statements, exception parameters in `catch` clauses, and `for` loops. When a variable is not needed, it can be replaced with `_` to clearly signal that the variable is intentionally unused.

```java
try (var _ = ScopedContext.acquire()) {
  // No use of acquired resource
}
try { ... }
catch (Exception _) { ... }
catch (Throwable _) { ... }

for (int i = 0, _ = runOnce(); i < arr.length; i++) {
  ...
}
```

An unnamed pattern is an unconditional pattern that binds no value. Unnamed pattern variables appear inside type patterns:

```java
if (r instanceof ColoredPoint(_, Color c)) { ... c ... }

switch (b) {
    case Box(RedBall _), Box(BlueBall _) -> processBox(b);
    case Box(GreenBall _)                -> stopProcessing();
    case Box(_)                          -> pickAnotherBox();
}
```

## JEP 444: Virtual Threads

Virtual Threads is a major, landmark update—make sure to pay close attention to it!

Virtual Threads entered their first preview in Java 19 via [JEP 425](https://openjdk.org/jeps/425), followed by a second preview in JDK 20. Finally, Virtual Threads became a finalized feature in JDK 21.

[Java 20 New Features Overview](./java20.md) already covered Virtual Threads in detail, so it will not be repeated here.

## JEP 445: Unnamed Classes and Instance Main Methods (Preview)

This feature primarily simplifies the declaration of the `main` method. For Java beginners, the traditional `main` method signature introduces too many Java language concepts at once, making it harder to get started quickly.

Declaring a `main` method before this feature:

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

Declaring a `main` method with this new feature:

```java
class HelloWorld {
    void main() {
        System.out.println("Hello, World!");
    }
}
```

Further simplified (unnamed classes allow omitting the class declaration altogether):

```java
void main() {
   System.out.println("Hello, World!");
}
```

## References

- Java 21 String Templates: <https://howtodoinjava.com/java/java-string-templates/>
- Java 21 Sequenced Collections: <https://howtodoinjava.com/java/sequenced-collections/>
