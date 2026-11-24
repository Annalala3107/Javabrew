---
title: Detailed Guide to Java Syntactic Sugar
description: "In-depth analysis of Java syntactic sugar principles: explaining compile-time desugaring mechanisms for autoboxing/unboxing, generics erasure, enhanced for loop, varargs, enums, lambdas, and more, along with common pitfalls to avoid."
category: Java
tag:
  - Java Basics
head:
  - - meta
    - name: keywords
      content: Java syntactic sugar,autoboxing and unboxing,generics type erasure,enhanced for loop,varargs,enum,inner class,lambda expression,syntactic sugar principles
lang: en
sourceRef: zh-ref/java/basis/syntactic-sugar.md
---

> Author: Hollis
>
> Original article: <https://mp.weixin.qq.com/s/o4XdEMq1DL-nBS-f8Za5Aw>

Syntactic sugar is a topic frequently asked in Java interviews at major tech companies.

From the perspective of Java compilation principles, this article dives deep into bytecode and `.class` files to peel back the layers and understand the principles and usage of syntactic sugar in Java, helping you master both how to use Java syntactic sugar and the underlying mechanisms behind it.

## What Is Syntactic Sugar?

**Syntactic Sugar** is a term coined by the British computer scientist Peter.J.Landin, referring to a certain syntax added to a computer language. This syntax has no impact on the functionality of the language itself, but makes it more convenient for programmers to use. In short, syntactic sugar makes programs more concise and more readable.

![](/media/jg/ext/oss.javaguide.cn/java/basis/syntactic-sugar/image-20220818175953954-6d27291c.png)

> Interestingly, in the programming field, besides syntactic sugar, there are also the concepts of syntactic salt and syntactic saccharin. Due to space limitations, we won't expand on them here.

Almost all programming languages we are familiar with have syntactic sugar. In the author's opinion, the amount of syntactic sugar is one of the criteria for judging how great a language is. Many people say Java is a "low-sugar language"; in fact, starting from Java 7, Java has continuously added various forms of syntactic sugar at the language level, mainly developed under "Project Coin". Even though some still consider current Java to be low-sugar, it will continue evolving toward "high-sugar" in the future.

## What Are the Common Syntactic Sugars in Java?

As mentioned earlier, syntactic sugar mainly exists for developer convenience. In reality, **the Java Virtual Machine does not support these syntactic sugars directly. During the compilation phase, these syntactic sugars are lowered back into simple foundational syntax constructs — a process called desugaring.**

Speaking of compilation, everyone knows that in Java, the `javac` command compiles `.java` source files into `.class` bytecode files that can run on the Java Virtual Machine. If you look at the source code of `com.sun.tools.javac.main.JavaCompiler`, you'll find a step inside `compile()` that calls `desugar()`, which is the method responsible for implementing desugaring.

The most commonly used syntactic sugars in Java mainly include Generics, variable-length arguments, conditional compilation, autoboxing/unboxing, inner classes, and so on. This article mainly analyzes the principles behind these syntactic sugars — peeling off the sugar coating step by step to see their true nature.

Here we will use [decompilation](https://mp.weixin.qq.com/s?__biz=MzI3NzE0NjcwMg==&mid=2650120609&idx=1&sn=5659f96310963ad57d55b48cee63c788&chksm=f36bbc80c41c3596a1e4bf9501c6280481f1b9e06d07af354474e6f3ed366fef016df673a7ba&scene=21#wechat_redirect); you can decompile Class files online via [Decompilers online](http://www.javadecompilers.com/).

### switch Supporting String and Enum

As mentioned earlier, starting from Java 7, syntactic sugar in the Java language has gradually grown richer, and one notable addition in Java 7 is that `switch` began supporting `String`.

Before we begin, a quick bit of background: early Java `switch` statements supported `byte`, `short`, `char`, `int` and their corresponding wrapper types, and did not support `boolean`, `long`, `float`, or `double`. `char` represents a UTF-16 code unit, not an ASCII type. Later, Java added support for reference types such as `enum` and `String`.

Now let's look at `switch` support for `String`, with the following code:

```java
public class switchDemoString {
    public static void main(String[] args) {
        String str = "world";
        switch (str) {
        case "hello":
            System.out.println("hello");
            break;
        case "world":
            System.out.println("world");
            break;
        default:
            break;
        }
    }
}
```

The decompiled output is as follows:

```java
public class switchDemoString
{
    public switchDemoString()
    {
    }
    public static void main(String args[])
    {
        String str = "world";
        String s;
        switch((s = str).hashCode())
        {
        default:
            break;
        case 99162322:
            if(s.equals("hello"))
                System.out.println("hello");
            break;
        case 113318802:
            if(s.equals("world"))
                System.out.println("world");
            break;
        }
    }
}
```

As can be seen from the code generated and decompiled from this specific version of `javac`, **the `String` `switch` is transformed into `hashCode()` dispatch combined with `equals()` verification.** This is a compiler implementation strategy, not a bytecode form mandated by the JLS.

Looking closely, you can see that the `switch` actually operates on the hash value and then performs a safety check using the `equals` method. This check is necessary because hash collisions can occur. Therefore, its performance is not as good as using `enum` or pure integer constants in `switch`, though it is still not bad.

### Generics

We all know that many languages support generics, but what many people don't know is that different compilers handle generics differently. Typically, there are two approaches a compiler takes to handle generics: `Code specialization` and `Code sharing`. C++ and C# use `Code specialization`, whereas Java uses `Code sharing`.

> The `Code sharing` approach creates a single bytecode representation for each generic type and maps all instances of that generic type onto this single bytecode representation. Mapping multiple generic type instances to a single bytecode representation is achieved through type erasure (`type erasure`).

In other words, **to the Java Virtual Machine, syntax like `Map<String, String> map` is completely unrecognizable. It needs to be desugared during the compilation phase via type erasure.**

The main steps of type erasure are as follows: 1. Replace all generic parameters with their leftmost bound (top-most parent type). 2. Remove all type parameters.

The following code:

```java
Map<String, String> map = new HashMap<String, String>();
map.put("name", "hollis");
map.put("wechat", "Hollis");
map.put("blog", "www.hollischuang.com");
```

Becomes after desugaring:

```java
Map map = new HashMap();
map.put("name", "hollis");
map.put("wechat", "Hollis");
map.put("blog", "www.hollischuang.com");
```

The following code:

```java
public static <A extends Comparable<A>> A max(Collection<A> xs) {
    Iterator<A> xi = xs.iterator();
    A w = xi.next();
    while (xi.hasNext()) {
        A x = xi.next();
        if (w.compareTo(x) < 0)
            w = x;
    }
    return w;
}
```

Becomes after type erasure:

```java
 public static Comparable max(Collection xs){
    Iterator xi = xs.iterator();
    Comparable w = (Comparable)xi.next();
    while(xi.hasNext())
    {
        Comparable x = (Comparable)xi.next();
        if(w.compareTo(x) < 0)
            w = x;
    }
    return w;
}
```

**There are no generics in the JVM — only ordinary classes and ordinary methods. All type parameters of generic classes are erased at compile time, and generic classes do not have their own distinct `Class` objects. For example, `List<String>.class` or `List<Integer>.class` does not exist; only `List.class` exists.**

### Autoboxing and Unboxing

Autoboxing is when Java automatically converts a primitive type value into its corresponding object — for example, converting an `int` variable into an `Integer` object; this process is called boxing. Conversely, converting an `Integer` object into an `int` value is called unboxing. Because the boxing and unboxing here happen automatically without manual conversion, it is called autoboxing and unboxing. The primitive types `byte`, `short`, `char`, `int`, `long`, `float`, `double`, and `boolean` correspond to the wrapper classes `Byte`, `Short`, `Character`, `Integer`, `Long`, `Float`, `Double`, and `Boolean`.

First, let's look at an autoboxing example:

```java
 public static void main(String[] args) {
    int i = 10;
    Integer n = i;
}
```

The decompiled code is as follows:

```java
public static void main(String args[])
{
    int i = 10;
    Integer n = Integer.valueOf(i);
}
```

Next, let's look at an unboxing example:

```java
public static void main(String[] args) {

    Integer i = 10;
    int n = i;
}
```

The decompiled code is as follows:

```java
public static void main(String args[])
{
    Integer i = Integer.valueOf(10);
    int n = i.intValue();
}
```

From the decompiled output, we can see that during boxing, `Integer.valueOf(int)` is automatically called, whereas during unboxing, `Integer.intValue()` is automatically called.

Therefore, **the boxing process is implemented by calling the wrapper's `valueOf` method, while the unboxing process is implemented by calling the wrapper's `xxxValue` method.**

### Variable-Length Arguments

Variable arguments (`variable arguments` / varargs) were introduced in Java 1.5. They allow a method to accept an arbitrary number of values as arguments.

Look at the following varargs code, where the `print` method takes variable arguments:

```java
public static void main(String[] args)
    {
        print("Holis", "公众号:Hollis", "博客：www.hollischuang.com", "QQ：907607222");
    }

public static void print(String... strs)
{
    for (int i = 0; i < strs.length; i++)
    {
        System.out.println(strs[i]);
    }
}
```

Decompiled code:

```java
 public static void main(String args[])
{
    print(new String[] {
        "Holis", "\u516C\u4F17\u53F7:Hollis", "\u535A\u5BA2\uFF1Awww.hollischuang.com", "QQ\uFF1A907607222"
    });
}

public static transient void print(String strs[])
{
    for(int i = 0; i < strs.length; i++)
        System.out.println(strs[i]);

}
```

From the decompiled code, we can see that when varargs are used, an array is created first with a length equal to the number of arguments passed when calling the method, all the argument values are placed into that array, and then the array is passed as a parameter into the invoked method. (Note: `transient` only has meaning when modifying member fields; its appearance here as a "method modifier" is because Javassist uses the same numeric flag value to represent both `transient` and `vararg`, see [here](https://github.com/jboss-javassist/javassist/blob/7302b8b0a09f04d344a26ebe57f29f3db43f2a3e/src/main/javassist/bytecode/AccessFlag.java#L32).)

### Enum

Java SE 5 introduced a new type — Java's enumeration type. The `enum` keyword allows a finite set of named values to be created as a new type, and these named values can be used as regular program components, which is a very useful feature.

To inspect the source/bytecode, we first need a class. So what class is an `enum` type actually? Is it `enum`? Obviously not — just like `class`, `enum` is only a keyword, not a class. Then what class maintains an enum? Let's write a simple enum:

```java
public enum t {
    SPRING,SUMMER;
}
```

Then let's decompile it to see how this code is actually implemented. The decompiled output is as follows:

```java
// The binary name of the enum is still t; Java identifiers are case-sensitive
public final class t extends Enum
{
    private t(String s, int i)
    {
        super(s, i);
    }
    public static t[] values()
    {
        t at[];
        int i;
        t at1[];
        System.arraycopy(at = ENUM$VALUES, 0, at1 = new t[i = at.length], 0, i);
        return at1;
    }

    public static t valueOf(String s)
    {
        return (t) Enum.valueOf(t.class, s);
    }

    public static final t SPRING;
    public static final t SUMMER;
    private static final t ENUM$VALUES[];
    static
    {
        SPRING = new t("SPRING", 0);
        SUMMER = new t("SUMMER", 1);
        ENUM$VALUES = (new t[] {
            SPRING, SUMMER
        });
    }
}
```

From the decompiled code we can see `public final class t extends Enum`, indicating that the class extends `Enum`; since this enum does not contain any constant-specific class bodies, it is implicitly `final`.

**An enum class defined using `enum` directly extends `Enum`, so it cannot explicitly extend any other class, nor can it be extended by ordinary classes. An enum class without constant-specific class bodies is implicitly `final`; as soon as any enum constant declares a constant-specific class body, the enum class is implicitly `sealed`, and those class bodies correspond to its permitted anonymous subclasses.**

### Inner Classes

Inner classes are also known as nested classes; an inner class can be understood as an ordinary member of its outer class.

**Inner classes are also syntactic sugar because they are purely a compile-time concept. When an inner class `inner` is defined inside `outer.java`, once compilation succeeds, two completely separate `.class` files are generated: `outer.class` and `outer$inner.class`. However, the JLS explicitly prohibits a nested class from having the same simple name as any enclosing class or interface.**

```java
public class OuterClass {
    private String userName;

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public static void main(String[] args) {

    }

    class InnerClass{
        private String name;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
}
```

After compiling the code above, two class files are generated: `OuterClass$InnerClass.class` and `OuterClass.class`. When we try to decompile `OuterClass.class`, the command line prints: `Parsing OuterClass.class...Parsing inner class OuterClass$InnerClass.class... Generating OuterClass.jad`. It decompiles both files and merges them into a single `OuterClass.jad` file. The file contents are as follows:

```java
public class OuterClass
{
    class InnerClass
    {
        public String getName()
        {
            return name;
        }
        public void setName(String name)
        {
            this.name = name;
        }
        private String name;
        final OuterClass this$0;

        InnerClass()
        {
            this.this$0 = OuterClass.this;
            super();
        }
    }

    public OuterClass()
    {
    }
    public String getUserName()
    {
        return userName;
    }
    public void setUserName(String userName){
        this.userName = userName;
    }
    public static void main(String args1[])
    {
    }
    private String userName;
}
```

**Why an inner class can access the outer class's `private` attributes**:

Let's add a method in `InnerClass` to print the `userName` attribute of the outer class:

```java
// Other fields omitted
public class OuterClass {
    private String userName;
    ......
    class InnerClass{
    ......
        public void printOut(){
            System.out.println("Username from OuterClass:"+userName);
        }
    }
}

// Decompilation result of OuterClass using javap -p:
public classOuterClass {
    private String userName;
    ......
    static String access$000(OuterClass);
}
// Decompilation result of InnerClass:
class OuterClass$InnerClass {
    final OuterClass this$0;
    ......
    public void printOut();
}

```

In fact, after compilation, the inner instance typically holds a reference `this$0` pointing to the outer instance. In class files generated by JDK 10 and earlier, the compiler typically implements `private` member access between nested classes through synthetic accessor methods like `access$000`, so the decompiled `printOut()` method looks roughly as shown below. Starting from JDK 11, nest-based access control was introduced, allowing classes in the same nest to directly access each other's `private` members without needing such synthetic accessor methods:

```java
public void printOut() {
    System.out.println("Username from OuterClass:" + OuterClass.access$000(this.this$0));
}
```

Additional notes:

1. In typical `javac` output from JDK 10 and earlier, anonymous inner classes, local inner classes, and static nested classes may also access `private` attributes via synthetic accessor methods; from JDK 11 onward, nest-based access control is generally used.
2. Static nested classes do not have a `this$0` reference.
3. Anonymous inner classes and local inner classes use local variables by copying them, so once initialized, those variables cannot be modified. Below is an example:

```java
public class OuterClass {
    private String userName;

    public void test(){
        // Once initialized to 1 here, i cannot be modified anymore
        int i=1;
        class Inner{
            public void printName(){
                System.out.println(userName);
                System.out.println(i);
            }
        }
    }
}
```

After decompilation:

```java
// Result of decompiling Inner with javap
// i is copied into the inner class and marked final
class OuterClass$1Inner {
  final int val$i;
  final OuterClass this$0;
  OuterClass$1Inner();
  public void printName();
}

```

### Conditional Compilation

Normally, every line of code in a program participates in compilation. However, sometimes for program optimization considerations, we may want only part of the code to be compiled. In that case, we need to add conditions to the program so that the compiler compiles only the code meeting the condition and discards the code that does not — this is conditional compilation.

For example, in C or C++, conditional compilation can be achieved via preprocessor directives. In fact, conditional compilation can also be achieved in Java. Let's first look at a piece of code:

```java
public class ConditionalCompilation {
    public static void main(String[] args) {
        final boolean DEBUG = true;
        if(DEBUG) {
            System.out.println("Hello, DEBUG!");
        }

        final boolean ONLINE = false;

        if(ONLINE){
            System.out.println("Hello, ONLINE!");
        }
    }
}
```

The decompiled code is as follows:

```java
public class ConditionalCompilation
{

    public ConditionalCompilation()
    {
    }

    public static void main(String args[])
    {
        boolean DEBUG = true;
        System.out.println("Hello, DEBUG!");
        boolean ONLINE = false;
    }
}
```

First, we observe that `System.out.println("Hello, ONLINE!");` is absent from the decompiled code — this is actually conditional compilation. When `if(ONLINE)` evaluates to `false`, the compiler does not compile the code inside it.

Therefore, **conditional compilation in Java syntax is achieved through `if` statements whose condition is a compile-time constant. Its principle is also a Java syntactic sugar: based on the truth value of the `if` condition, the compiler directly eliminates the code block whose branch is `false`. Conditional compilation implemented this way must be placed inside a method body and cannot be applied across the overall structure of a Java class or its class attributes. Compared with C/C++ conditional compilation, this is indeed more limited. Java did not introduce a dedicated conditional compilation feature at its inception; while limited, it is still better than nothing.**

### Assertions

In Java, the `assert` keyword was introduced in Java SE 1.4. To avoid breaking legacy Java code that already used `assert` as an identifier, Java disables assertion checks by default at runtime (in which case all assertion statements are ignored!). To enable assertion checks, you must turn them on using the `-enableassertions` or `-ea` flag.

Let's look at a piece of code containing assertions:

```java
public class AssertTest {
    public static void main(String args[]) {
        int a = 1;
        int b = 1;
        assert a == b;
        System.out.println("公众号：Hollis");
        assert a != b : "Hollis";
        System.out.println("博客：www.hollischuang.com");
    }
}
```

The decompiled code is as follows:

```java
public class AssertTest {
   public AssertTest()
    {
    }
    public static void main(String args[])
{
    int a = 1;
    int b = 1;
    if(!$assertionsDisabled && a != b)
        throw new AssertionError();
    System.out.println("\u516C\u4F17\u53F7\uFF1AHollis");
    if(!$assertionsDisabled && a == b)
    {
        throw new AssertionError("Hollis");
    } else
    {
        System.out.println("\u535A\u5BA2\uFF1Awww.hollischuang.com");
        return;
    }
}

static final boolean $assertionsDisabled = !com/hollis/suguar/AssertTest.desiredAssertionStatus();

}
```

Clearly, the decompiled code is much more complex than the code we wrote. So using the `assert` syntactic sugar saves us a lot of boilerplate. **In fact, the underlying implementation of assertions is simply an `if` statement: if the assertion evaluates to `true`, nothing happens and execution continues; if it evaluates to `false`, the program throws an `AssertionError` to interrupt execution.** `-enableassertions` sets the value of the `\$assertionsDisabled` field.

### Numeric Literals

In Java 7, numeric literals — whether integers or floating-point numbers — allow inserting any number of underscores between digits. These underscores do not affect the numeric value of the literal; their sole purpose is to improve readability.

For example:

```java
public class Test {
    public static void main(String... args) {
        int i = 10_000;
        System.out.println(i);
    }
}
```

After decompilation:

```java
public class Test
{
  public static void main(String[] args)
  {
    int i = 10000;
    System.out.println(i);
  }
}
```

The `_` does not appear in the decompiled result because it is purely part of the literal syntax in source code; it neither changes the value nor is recorded in the class file. **The compiler must recognize and validate the placement of `_`, and then write the numeric value of the literal into bytecode.**

### for-each

Everyone is surely familiar with the enhanced `for` loop (`for-each`), which is frequently used in daily development and requires much less code than a standard `for` loop. So how is this syntactic sugar implemented under the hood?

```java
public static void main(String... args) {
    String[] strs = {"Hollis", "公众号：Hollis", "博客：www.hollischuang.com"};
    for (String s : strs) {
        System.out.println(s);
    }
    List<String> strList = ImmutableList.of("Hollis", "公众号：Hollis", "博客：www.hollischuang.com");
    for (String s : strList) {
        System.out.println(s);
    }
}
```

The decompiled code is as follows:

```java
public static transient void main(String args[])
{
    String strs[] = {
        "Hollis", "\u516C\u4F17\u53F7\uFF1AHollis", "\u535A\u5BA2\uFF1Awww.hollischuang.com"
    };
    String args1[] = strs;
    int i = args1.length;
    for(int j = 0; j < i; j++)
    {
        String s = args1[j];
        System.out.println(s);
    }

    List strList = ImmutableList.of("Hollis", "\u516C\u4F17\u53F7\uFF1AHollis", "\u535A\u5BA2\uFF1Awww.hollischuang.com");
    String s;
    for(Iterator iterator = strList.iterator(); iterator.hasNext(); System.out.println(s))
        s = (String)iterator.next();

}
```

The code is very straightforward: **the implementation principle of `for-each` is simply using an ordinary `for` loop (for arrays) and an `Iterator` (for collections).**

### try-with-resource

In Java, expensive resources such as file I/O streams and database connections must be promptly closed via their `close` method after use; otherwise, the resources remain open, which can lead to issues such as memory leaks.

The conventional way to close resources is to release them inside a `finally` block by calling `close`. For example, we often write code like this:

```java
public static void main(String[] args) {
    BufferedReader br = null;
    try {
        String line;
        br = new BufferedReader(new FileReader("d:\\hollischuang.xml"));
        while ((line = br.readLine()) != null) {
            System.out.println(line);
        }
    } catch (IOException e) {
        // handle exception
    } finally {
        try {
            if (br != null) {
                br.close();
            }
        } catch (IOException ex) {
            // handle exception
        }
    }
}
```

Starting from Java 7, the JDK provides a better way to close resources using the `try-with-resources` statement. Rewriting the code above gives the following:

```java
public static void main(String... args) {
    try (BufferedReader br = new BufferedReader(new FileReader("d:\\ hollischuang.xml"))) {
        String line;
        while ((line = br.readLine()) != null) {
            System.out.println(line);
        }
    } catch (IOException e) {
        // handle exception
    }
}
```

Look, this is truly a great relief! Although I previously used `IOUtils` to close streams rather than writing lots of boilerplate in `finally`, this new syntactic sugar looks much more elegant. Let's see what happens under the hood:

```java
public static transient void main(String args[])
    {
        BufferedReader br;
        Throwable throwable;
        br = new BufferedReader(new FileReader("d:\\ hollischuang.xml"));
        throwable = null;
        String line;
        try
        {
            while((line = br.readLine()) != null)
                System.out.println(line);
        }
        catch(Throwable throwable2)
        {
            throwable = throwable2;
            throw throwable2;
        }
        finally
        {
            if(br != null)
                if(throwable != null)
                    try
                    {
                        br.close();
                    }
                    catch(Throwable throwable1)
                    {
                        throwable.addSuppressed(throwable1);
                    }
                else
                    br.close();
        }
    }
}
```

**Actually, the underlying principle is simple as well: all the resource-closing operations we didn't write ourselves are generated for us by the compiler. This once again confirms that syntactic sugar serves to make things convenient for programmers, while ultimately still needing to be translated into syntax the compiler/JVM understands.**

### Lambda Expressions

Some people may have doubts about lambda expressions because some online articles claim they are not syntactic sugar. Let me correct that claim: **Lambda expressions are not syntactic sugar for anonymous inner classes, but they are still syntactic sugar. Their implementation actually relies on several low-level lambda-related APIs provided by the JVM.**

First, let's look at a simple lambda expression iterating over a `List`:

```java
public static void main(String... args) {
    List<String> strList = ImmutableList.of("Hollis", "公众号：Hollis", "博客：www.hollischuang.com");

    strList.forEach( s -> { System.out.println(s); } );
}
```

Why do we say it is not syntactic sugar for inner classes? As mentioned in the inner class section earlier, compiling an inner class produces two `.class` files, whereas a class containing a lambda expression compiles into only one file.

The decompiled code is as follows:

```java
public static /* varargs */ void main(String ... args) {
    ImmutableList strList = ImmutableList.of((Object)"Hollis", (Object)"\u516c\u4f17\u53f7\uff1aHollis", (Object)"\u535a\u5ba2\uff1awww.hollischuang.com");
    strList.forEach((Consumer<String>)LambdaMetafactory.metafactory(null, null, null, (Ljava/lang/Object;)V, lambda$main$0(java.lang.String ), (Ljava/lang/String;)V)());
}

private static /* synthetic */ void lambda$main$0(String s) {
    System.out.println(s);
}
```

We can see that inside `forEach`, `java.lang.invoke.LambdaMetafactory#metafactory` is invoked, whose fourth parameter `implMethod` specifies the method implementation. Here we can see that it actually invokes a `lambda$main$0` method to print the output.

Now let's look at a slightly more complex example: filtering the `List` first and then printing it:

```java
public static void main(String... args) {
    List<String> strList = ImmutableList.of("Hollis", "公众号：Hollis", "博客：www.hollischuang.com");

    List HollisList = strList.stream().filter(string -> string.contains("Hollis")).collect(Collectors.toList());

    HollisList.forEach( s -> { System.out.println(s); } );
}
```

The decompiled code is as follows:

```java
public static /* varargs */ void main(String ... args) {
    ImmutableList strList = ImmutableList.of((Object)"Hollis", (Object)"\u516c\u4f17\u53f7\uff1aHollis", (Object)"\u535a\u5ba2\uff1awww.hollischuang.com");
    List<Object> HollisList = strList.stream().filter((Predicate<String>)LambdaMetafactory.metafactory(null, null, null, (Ljava/lang/Object;)Z, lambda$main$0(java.lang.String ), (Ljava/lang/String;)Z)()).collect(Collectors.toList());
    HollisList.forEach((Consumer<Object>)LambdaMetafactory.metafactory(null, null, null, (Ljava/lang/Object;)V, lambda$main$1(java.lang.Object ), (Ljava/lang/Object;)V)());
}

private static /* synthetic */ void lambda$main$1(Object s) {
    System.out.println(s);
}

private static /* synthetic */ boolean lambda$main$0(String string) {
    return string.contains("Hollis");
}
```

The two lambda expressions respectively invoke the two methods `lambda$main$1` and `lambda$main$0`.

**Therefore, the implementation of lambda expressions relies on low-level APIs; during compilation, the compiler desugars lambda expressions into calls to internal APIs.**

## Potential Pitfalls

### Generics

**1. When Generics Meet Overloading**

```java
public class GenericTypes {

    public static void method(List<String> list) {
        System.out.println("invoke method(List<String> list)");
    }

    public static void method(List<Integer> list) {
        System.out.println("invoke method(List<Integer> list)");
    }
}
```

In the code above, there are two overloaded methods because their parameter types differ — one is `List<String>` and the other is `List<Integer>`. However, this code will not compile. As we discussed earlier, after compilation, the parameters `List<Integer>` and `List<String>` are both erased to the same raw type `List`, causing the signatures of both methods to become identical.

**2. When Generics Meet `catch`**

Generic type parameters cannot be used in Java exception `catch` clauses. Because exception handling is performed by the JVM at runtime, and type information has been erased, the JVM cannot distinguish between two exception types such as `MyException<String>` and `MyException<Integer>`.

**3. When Generics Contain Static Variables**

```java
public class StaticTest{
    public static void main(String[] args){
        GT<Integer> gti = new GT<Integer>();
        gti.var=1;
        GT<String> gts = new GT<String>();
        gts.var=2;
        System.out.println(gti.var);
    }
}
class GT<T>{
    public static int var=0;
    public void nothing(T x){}
}
```

The output of the code above is: `2`!

Some students might mistakenly think that generic classes with different type arguments are different classes corresponding to different bytecode. In reality, due to type erasure, all instances of a generic class share the exact same bytecode, so `static` variables of a generic class are shared. In the example above, `GT<Integer>.var` and `GT<String>.var` are actually the same variable.

### Autoboxing and Unboxing

**Object Equality Comparison**

```java
public static void main(String[] args) {
    Integer a = 1000;
    Integer b = 1000;
    Integer c = 100;
    Integer d = 100;
    System.out.println("a == b is " + (a == b));
    System.out.println(("c == d is " + (c == d)));
}
```

Output:

```plain
a == b is false
c == d is true
```

In Java 5, a new feature was introduced for `Integer` operations to save memory and improve performance: integer objects are cached and reused by returning the same object reference.

> Applies to integer values in the range `-128` to `+127`.
>
> Applies only to autoboxing; it does not apply when creating objects via a constructor.

### Enhanced for Loop

```java
for (Student stu : students) {
    if (stu.getId() == 2)
        students.remove(stu);
}
```

This will throw a `ConcurrentModificationException`.

This involves the **fail-fast** mechanism of collections. Taking `ArrayList` as an example, it internally maintains a `modCount` counter that is incremented every time the structure of the collection is modified (such as adding or removing elements). When an `Iterator` is created, it records the current `modCount` as `expectedModCount`. Each time `next()` is called, the `Iterator` checks whether `modCount` equals `expectedModCount`; if they are not equal, it means the collection was modified by other means during iteration, and `java.util.ConcurrentModificationException` is thrown.

Therefore, while an `Iterator` is working, the collection being iterated over is not allowed to be structurally modified directly. Instead, you can use `Iterator`'s own `remove()` method to remove elements, as `Iterator.remove()` updates `expectedModCount` synchronously after removing the element, thereby avoiding triggering this exception.

## Summary

We introduced 12 commonly used syntactic sugars in Java above. Syntactic sugar is simply syntax provided to make development easier for programmers. However, only developers understand this syntax; to be executed, it must be desugared — i.e., converted into syntax that the JVM understands. Once we desugar these constructs, we realize that the convenient syntax we use every day is actually composed of other simpler constructs.

With these syntactic sugars, we can greatly improve productivity in daily development, while also avoiding overusing them. Before using them, it is best to understand their underlying principles to avoid falling into pitfalls.
