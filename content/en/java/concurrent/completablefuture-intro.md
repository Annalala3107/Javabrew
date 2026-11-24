---
title: CompletableFuture Explained
description: "Detailed guide to asynchronous programming with CompletableFuture: core APIs, asynchronous task orchestration, thenCompose/thenCombine composition, allOf/anyOf aggregation, thread pool configuration, and best practices."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/completablefuture-intro.md
head:
  - - meta
    - name: keywords
      content: CompletableFuture,asynchronous programming,async orchestration,Future,thenCompose,thenCombine,allOf,parallel tasks
---

In real-world projects, it is quite common for an API endpoint to fetch multiple different pieces of data simultaneously and then aggregate and return them. For example, when a user requests order information, the system may need to fetch user information, product details, logistics information, product recommendations, and so on at the same time.

If these tasks are executed serially (one after another in sequence), the API's response speed will be very slow. Considering that most of these tasks **have no sequential dependencies**, they can be **executed in parallel**—for instance, while calling the service to fetch product details, we can simultaneously call the service to fetch logistics information. By executing multiple tasks in parallel, the API's response speed can be greatly optimized.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-performance/serial-to-parallel-198beea8.png)

For tasks that do have sequential call dependencies, we can perform task orchestration.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-performance/serial-to-parallel2-3a41b928.png)

1. The product details and logistics information APIs can only be called after fetching the user information.
2. The product recommendation API can only be called after successfully fetching the product details and logistics information.

Scenarios where multi-threaded asynchronous task orchestration may be used (these are just examples; data does not necessarily have to be returned all at once, and APIs may be split):

1. Homepage: For example, the homepage of a tech community may need to simultaneously fetch the recommended article list, banner ads, article rankings, trending topics, and other information.
2. Detail page: For example, the article detail page of a tech community may need to simultaneously fetch author information, article details, article comments, and other information.
3. Statistics module: For example, the backend statistics module of a tech community may need to simultaneously fetch follower count summaries, article metrics summaries (views, comments, bookmarks), and other information.

For Java applications, `CompletableFuture`, introduced in Java 8, can help us orchestrate multiple tasks and is very powerful.

This article is a brief introduction to `CompletableFuture`, walking you through its commonly used APIs.

## Introduction to Future

The `Future` interface is a classic application of asynchronous thinking. It is mainly used in scenarios that require executing time-consuming tasks, preventing the program from sitting idle and waiting for the slow task to finish, which would result in very low execution efficiency. Specifically, it works like this: when we need to execute a time-consuming task, we can hand that task off to a child thread to run asynchronously while we work on other things instead of blindly waiting for the time-consuming task to finish. Once our other work is done, we retrieve the execution result of the time-consuming task via `Future`. In this way, program execution efficiency is noticeably improved.

This is actually the classic **Future Pattern** in multithreading. You can view it as a design pattern whose core idea is asynchronous invocation; it is primarily used in multithreading and is not unique to the Java language.

In Java, `Future` is a generic interface located in the `java.util.concurrent` package. It has 5 classic abstract methods covering the following 4 categories of functionality; starting from JDK 19, three default query methods—`resultNow()`, `exceptionNow()`, and `state()`—were added:

- Cancel a task;
- Check whether a task has been cancelled;
- Check whether a task has completed execution;
- Retrieve the task execution result.

```java
// V represents the return value type of the task executed by Future
public interface Future<V> {
    // Cancel task execution
    // Returns true if successfully cancelled, otherwise returns false
    boolean cancel(boolean mayInterruptIfRunning);
    // Check whether the task has been cancelled
    boolean isCancelled();
    // Check whether the task has completed execution
    boolean isDone();
    // Retrieve the task execution result
    V get() throws InterruptedException, ExecutionException;
    // Throws TimeoutException if the computation result is not returned within the specified time
    V get(long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException;
}
```

Put simply: I have a task and submit it to `Future` to handle. While the task is executing, I can go do whatever I want. Moreover, during this period I can also cancel the task and check its execution status. After a period of time, I can directly retrieve the task execution result from `Future`.

## Introduction to CompletableFuture

`Future` has some limitations in practical use—for example, it does not support orchestrating and composing asynchronous tasks, and its `get()` method for obtaining computation results is a blocking call.

The `CompletableFuture` class introduced in Java 8 addresses these shortcomings of `Future`. In addition to providing more convenient and powerful `Future` features, `CompletableFuture` also provides functional programming capabilities as well as asynchronous task orchestration and composition (allowing multiple asynchronous tasks to be chained together into a complete fluent call chain).

Let's briefly look at the definition of the `CompletableFuture` class below.

```java
public class CompletableFuture<T> implements Future<T>, CompletionStage<T> {
}
```

As you can see, `CompletableFuture` implements both the `Future` and `CompletionStage` interfaces.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/completablefuture-class-diagram-f01a3bb2.jpg)

Besides providing more convenient and powerful `Future` features, `CompletableFuture` also provides functional programming capabilities.

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20210902092441434-8e6e65c9.png)

The `Future` interface has 5 methods:

- `boolean cancel(boolean mayInterruptIfRunning)`: Attempts to cancel execution of the task.
- `boolean isCancelled()`: Checks whether the task was cancelled.
- `boolean isDone()`: Checks whether the task has finished executing.
- `get()`: Waits for the task to finish executing and retrieves the computation result.
- `get(long timeout, TimeUnit unit)`: Adds a timeout duration.

The `CompletionStage` interface describes a stage of an asynchronous computation. Many computations can be split into multiple stages or steps, and it allows all steps to be composed together to form an asynchronous computation pipeline.

The `CompletionStage` interface contains quite a few methods, and `CompletableFuture`'s functional programming capabilities come from this interface. From the parameter types of its methods, you can immediately tell that it makes heavy use of the functional programming features introduced in Java 8.

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20210902093026059-f1354d4c.png)

Because there are so many methods, we cannot cover every single one here; below, I will walk through the usage of most of the commonly used methods.

## Common CompletableFuture Operations

### Creating a CompletableFuture

The common ways to create a `CompletableFuture` object are as follows:

1. Via the `new` keyword.
2. Via the built-in static factory methods of `CompletableFuture`: `runAsync()`, `supplyAsync()`.

#### The `new` Keyword

Creating a `CompletableFuture` object with the `new` keyword can be thought of as using `CompletableFuture` just like a `Future`.

In my open-source project [guide-rpc-framework](https://github.com/Snailclimb/guide-rpc-framework), I create `CompletableFuture` objects in this exact way.

Let's look at a simple example below.

We create a `CompletableFuture` whose result type is `RpcResponse<Object>`. You can think of `resultFuture` as a carrier for the asynchronous computation result.

```java
CompletableFuture<RpcResponse<Object>> resultFuture = new CompletableFuture<>();
```

Suppose at some point in the future we obtain the final result. At that time, we can call the `complete()` method to pass the result into it, indicating that `resultFuture` has been completed.

```java
// complete() can only be called once; subsequent calls will be ignored.
resultFuture.complete(rpcResponse);
```

You can check whether it has completed using the `isDone()` method.

```java
public boolean isDone() {
    return result != null;
}
```

Retrieving the asynchronous computation result is also very simple—just call the `get()` method. The thread calling `get()` will block until the `CompletableFuture` finishes its computation.

```java
rpcResponse = completableFuture.get();
```

If you already know the computation result beforehand, you can use the static method `completedFuture()` to create a `CompletableFuture`.

```java
CompletableFuture<String> future = CompletableFuture.completedFuture("hello!");
assertEquals("hello!", future.get());
```

Under the hood, the `completedFuture()` method calls a parameterized constructor via `new`, except that this constructor is not publicly exposed.

```java
public static <U> CompletableFuture<U> completedFuture(U value) {
    return new CompletableFuture<U>((value == null) ? NIL : value);
}
```

#### Static Factory Methods

These two methods help us encapsulate computation logic.

```java
static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier);
// Use a custom thread pool (recommended)
static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier, Executor executor);
static CompletableFuture<Void> runAsync(Runnable runnable);
// Use a custom thread pool (recommended)
static CompletableFuture<Void> runAsync(Runnable runnable, Executor executor);
```

The `runAsync()` method accepts a `Runnable`, which is a functional interface that does not allow a return value. When you need an asynchronous operation and do not care about the return value, you can use `runAsync()`.

```java
@FunctionalInterface
public interface Runnable {
    public abstract void run();
}
```

The `supplyAsync()` method accepts a `Supplier<U>`, which is also a functional interface, where `U` is the type of the returned result value.

```java
@FunctionalInterface
public interface Supplier<T> {

    /**
     * Gets a result.
     *
     * @return a result
     */
    T get();
}
```

When you need an asynchronous operation and do care about the return result, you can use `supplyAsync()`.

```java
CompletableFuture<Void> future = CompletableFuture.runAsync(() -> System.out.println("hello!"));
future.get();// Outputs "hello!"
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "hello!");
assertEquals("hello!", future2.get());
```

### Handling Asynchronous Computation Results

Once we obtain the result of an asynchronous computation, we can process it further. The commonly used methods are listed below:

- `thenApply()`
- `thenAccept()`
- `thenRun()`
- `whenComplete()`

The `thenApply()` method accepts a `Function` instance and uses it to process the result.

```java
// Non-async callback: may be executed by the thread that completed the previous stage; if already complete, may be executed by the current calling thread
public <U> CompletableFuture<U> thenApply(
    Function<? super T,? extends U> fn) {
    return uniApplyStage(null, fn);
}

// Uses the default ForkJoinPool thread pool (not recommended)
public <U> CompletableFuture<U> thenApplyAsync(
    Function<? super T,? extends U> fn) {
    return uniApplyStage(defaultExecutor(), fn);
}
// Uses a custom thread pool (recommended)
public <U> CompletableFuture<U> thenApplyAsync(
    Function<? super T,? extends U> fn, Executor executor) {
    return uniApplyStage(screenExecutor(executor), fn);
}
```

An example of using `thenApply()` is shown below:

```java
CompletableFuture<String> future = CompletableFuture.completedFuture("hello!")
        .thenApply(s -> s + "world!");
assertEquals("hello!world!", future.get());
// This call will be ignored.
future.thenApply(s -> s + "nice!");
assertEquals("hello!world!", future.get());
```

You can also perform **fluent chaining**:

```java
CompletableFuture<String> future = CompletableFuture.completedFuture("hello!")
        .thenApply(s -> s + "world!").thenApply(s -> s + "nice!");
assertEquals("hello!world!nice!", future.get());
```

**If you do not need to obtain a return value from the callback function, you can use `thenAccept()` or `thenRun()`. The difference between these two methods is that `thenRun()` cannot access the result of the asynchronous computation.**

The parameter of `thenAccept()` is `Consumer<? super T>`.

```java
public CompletableFuture<Void> thenAccept(Consumer<? super T> action) {
    return uniAcceptStage(null, action);
}

public CompletableFuture<Void> thenAcceptAsync(Consumer<? super T> action) {
    return uniAcceptStage(defaultExecutor(), action);
}

public CompletableFuture<Void> thenAcceptAsync(Consumer<? super T> action,
                                               Executor executor) {
    return uniAcceptStage(screenExecutor(executor), action);
}
```

As its name implies, `Consumer` is a consumer-style interface: it takes 1 input object and "consumes" it.

```java
@FunctionalInterface
public interface Consumer<T> {

    void accept(T t);

    default Consumer<T> andThen(Consumer<? super T> after) {
        Objects.requireNonNull(after);
        return (T t) -> { accept(t); after.accept(t); };
    }
}
```

The parameter of `thenRun()` is `Runnable`.

```java
public CompletableFuture<Void> thenRun(Runnable action) {
    return uniRunStage(null, action);
}

public CompletableFuture<Void> thenRunAsync(Runnable action) {
    return uniRunStage(defaultExecutor(), action);
}

public CompletableFuture<Void> thenRunAsync(Runnable action,
                                            Executor executor) {
    return uniRunStage(screenExecutor(executor), action);
}
```

Examples of using `thenAccept()` and `thenRun()` are shown below:

```java
CompletableFuture.completedFuture("hello!")
        .thenApply(s -> s + "world!").thenApply(s -> s + "nice!").thenAccept(System.out::println);//hello!world!nice!

CompletableFuture.completedFuture("hello!")
        .thenApply(s -> s + "world!").thenApply(s -> s + "nice!").thenRun(() -> System.out.println("hello!"));//hello!
```

The parameter of `whenComplete()` is `BiConsumer<? super T, ? super Throwable>`.

```java
public CompletableFuture<T> whenComplete(
    BiConsumer<? super T, ? super Throwable> action) {
    return uniWhenCompleteStage(null, action);
}


public CompletableFuture<T> whenCompleteAsync(
    BiConsumer<? super T, ? super Throwable> action) {
    return uniWhenCompleteStage(defaultExecutor(), action);
}
// Uses a custom thread pool (recommended)
public CompletableFuture<T> whenCompleteAsync(
    BiConsumer<? super T, ? super Throwable> action, Executor executor) {
    return uniWhenCompleteStage(screenExecutor(executor), action);
}
```

Compared with `Consumer`, `BiConsumer` can accept 2 input objects and "consume" them.

```java
@FunctionalInterface
public interface BiConsumer<T, U> {
    void accept(T t, U u);

    default BiConsumer<T, U> andThen(BiConsumer<? super T, ? super U> after) {
        Objects.requireNonNull(after);

        return (l, r) -> {
            accept(l, r);
            after.accept(l, r);
        };
    }
}
```

An example of using `whenComplete()` is shown below:

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "hello!")
        .whenComplete((res, ex) -> {
            // res represents the returned result
            // ex is of type Throwable, representing the thrown exception
            System.out.println(res);
            // No exception is thrown here, so ex is null
            assertNull(ex);
        });
assertEquals("hello!", future.get());
```

### Exception Handling

You can use the `handle()` method to deal with exceptions that may be thrown during task execution.

```java
public <U> CompletableFuture<U> handle(
    BiFunction<? super T, Throwable, ? extends U> fn) {
    return uniHandleStage(null, fn);
}

public <U> CompletableFuture<U> handleAsync(
    BiFunction<? super T, Throwable, ? extends U> fn) {
    return uniHandleStage(defaultExecutor(), fn);
}

public <U> CompletableFuture<U> handleAsync(
    BiFunction<? super T, Throwable, ? extends U> fn, Executor executor) {
    return uniHandleStage(screenExecutor(executor), fn);
}
```

Example code is as follows:

```java
CompletableFuture<String> future
        = CompletableFuture.supplyAsync(() -> {
    if (true) {
        throw new RuntimeException("Computation error!");
    }
    return "hello!";
}).handle((res, ex) -> {
    // res represents the returned result
    // ex is of type Throwable, representing the thrown exception
    return res != null ? res : "world!";
});
assertEquals("world!", future.get());
```

You can also handle exceptional cases using the `exceptionally()` method.

```java
CompletableFuture<String> future
        = CompletableFuture.supplyAsync(() -> {
    if (true) {
        throw new RuntimeException("Computation error!");
    }
    return "hello!";
}).exceptionally(ex -> {
    System.out.println(ex.toString());// CompletionException
    return "world!";
});
assertEquals("world!", future.get());
```

If you want the result of a `CompletableFuture` itself to be an exception, you can assign it using the `completeExceptionally()` method.

```java
CompletableFuture<String> completableFuture = new CompletableFuture<>();
// ...
completableFuture.completeExceptionally(
  new RuntimeException("Calculation failed!"));
// ...
completableFuture.get(); // ExecutionException
```

### Composing CompletableFuture

You can use `thenCompose()` to sequentially link two `CompletableFuture` objects, implementing an asynchronous task chain. Its role is to pass the return result of the previous task as the input parameter to the next task, thereby forming a dependency relationship.

```java
public <U> CompletableFuture<U> thenCompose(
    Function<? super T, ? extends CompletionStage<U>> fn) {
    return uniComposeStage(null, fn);
}

public <U> CompletableFuture<U> thenComposeAsync(
    Function<? super T, ? extends CompletionStage<U>> fn) {
    return uniComposeStage(defaultExecutor(), fn);
}

public <U> CompletableFuture<U> thenComposeAsync(
    Function<? super T, ? extends CompletionStage<U>> fn,
    Executor executor) {
    return uniComposeStage(screenExecutor(executor), fn);
}
```

An example of using `thenCompose()` is shown below:

```java
CompletableFuture<String> future
        = CompletableFuture.supplyAsync(() -> "hello!")
        .thenCompose(s -> CompletableFuture.supplyAsync(() -> s + "world!"));
assertEquals("hello!world!", future.get());
```

In real-world development, this method is quite useful. For example, both `task1` and `task2` are executed asynchronously, yet `task1` must finish executing before `task2` can start (`task2` depends on the execution result of `task1`).

Similar to `thenCompose()` is the `thenCombine()` method, which can also combine two `CompletableFuture` objects.

```java
CompletableFuture<String> completableFuture
        = CompletableFuture.supplyAsync(() -> "hello!")
        .thenCombine(CompletableFuture.supplyAsync(
                () -> "world!"), (s1, s2) -> s1 + s2)
        .thenCompose(s -> CompletableFuture.supplyAsync(() -> s + "nice!"));
assertEquals("hello!world!nice!", completableFuture.get());
```

**So what is the difference between `thenCompose()` and `thenCombine()`?**

- `thenCompose()` links two `CompletableFuture` objects and passes the return result of the previous task as an argument to the next task, establishing a sequential order between them.
- `thenCombine()` merges the results of two stages after both have completed normally. The two stages can be independent of each other, though whether they execute in parallel depends on how they were created and which executor they use; `thenCombine()` itself is not responsible for starting tasks.

Besides `thenCompose()` and `thenCombine()`, there are other methods for composing `CompletableFuture` objects to achieve different behaviors and satisfy various business requirements.

For example, in a scenario where both `task1` and `task2` complete normally, you can use `acceptEither()` to have `task3` receive the result of whichever task completes first. Note that it cannot serve as a reliable selector for the "first successful result": as soon as either stage completes exceptionally, the result of the returned stage must follow `CompletionStage`'s exception rules for `either` composition.

```java
public CompletableFuture<Void> acceptEither(
    CompletionStage<? extends T> other, Consumer<? super T> action) {
    return orAcceptStage(null, other, action);
}

public CompletableFuture<Void> acceptEitherAsync(
    CompletionStage<? extends T> other, Consumer<? super T> action) {
    return orAcceptStage(asyncPool, other, action);
}
```

Here is a simple example:

```java
CompletableFuture<String> task = CompletableFuture.supplyAsync(() -> {
    System.out.println("Task 1 started at: " + System.currentTimeMillis());
    try {
        Thread.sleep(500);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    System.out.println("Task 1 finished at: " + System.currentTimeMillis());
    return "task1";
});

CompletableFuture<String> task2 = CompletableFuture.supplyAsync(() -> {
    System.out.println("Task 2 started at: " + System.currentTimeMillis());
    try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    System.out.println("Task 2 finished at: " + System.currentTimeMillis());
    return "task2";
});

task.acceptEitherAsync(task2, (res) -> {
    System.out.println("Task 3 started at: " + System.currentTimeMillis());
    System.out.println("Result of previous task: " + res);
});

// Add some delay to ensure the asynchronous tasks have enough time to finish
try {
    Thread.sleep(2000);
} catch (InterruptedException e) {
    e.printStackTrace();
}
```

Output:

```plain
Task 1 started at: 1695088058520
Task 2 started at: 1695088058521
Task 1 finished at: 1695088059023
Task 3 started at: 1695088059023
Result of previous task: task1
Task 2 finished at: 1695088059523
```

When both stages complete normally, `acceptEitherAsync()` asynchronously executes Task 3 using the result of one of the completed stages—typically the one that finished first. However, if one stage completes exceptionally while the other has not yet completed or completes normally, the specification does not guarantee whether the returned stage ultimately completes normally or exceptionally. Therefore, you cannot rely on this method to ignore an earlier exception and keep waiting for the other successful result.

### Waiting for Multiple CompletableFuture Instances to Complete

You can use the static `allOf()` method of `CompletableFuture` to wait for multiple `CompletableFuture` instances to all complete. `allOf()` only combines the completion state of existing stages and is not responsible for starting those tasks; whether the tasks run in parallel depends on how they were created and their executors.

In real-world projects, we often need to run multiple unrelated tasks in parallel. These tasks have no dependencies on each other and can run independently.

For instance, suppose we need to read and process 6 files. None of these 6 tasks depend on each other in execution order, yet before returning to the user we need to aggregate and summarize the processing results of all these files. In such cases, we can run multiple `CompletableFuture` instances in parallel to handle them.

Example code is as follows:

```java
CompletableFuture<Void> task1 =
  CompletableFuture.supplyAsync(()->{
    // Custom business operation
  });
......
CompletableFuture<Void> task6 =
  CompletableFuture.supplyAsync(()->{
    // Custom business operation
  });
......
 CompletableFuture<Void> headerFuture=CompletableFuture.allOf(task1,.....,task6);

  try {
    headerFuture.join();
  } catch (Exception ex) {
    ......
  }
System.out.println("all done. ");
```

A method often compared with `allOf()` is `anyOf()`.

**The `allOf()` method waits until all `CompletableFuture` instances have finished running before returning**

```java
Random rand = new Random();
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
    try {
        Thread.sleep(1000 + rand.nextInt(1000));
    } catch (InterruptedException e) {
        e.printStackTrace();
    } finally {
        System.out.println("future1 done...");
    }
    return "abc";
});
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
    try {
        Thread.sleep(1000 + rand.nextInt(1000));
    } catch (InterruptedException e) {
        e.printStackTrace();
    } finally {
        System.out.println("future2 done...");
    }
    return "efg";
});
```

Calling `join()` makes the program wait until both `future1` and `future2` have finished running before continuing execution.

```java
CompletableFuture<Void> completableFuture = CompletableFuture.allOf(future1, future2);
completableFuture.join();
assertTrue(completableFuture.isDone());
System.out.println("all futures done...");
```

Output:

```plain
future1 done...
future2 done...
all futures done...
```

**The `anyOf()` method does not wait for all `CompletableFuture` instances to finish running before returning—it returns as soon as any one of them finishes!**

```java
CompletableFuture<Object> f = CompletableFuture.anyOf(future1, future2);
System.out.println(f.get());
```

The output may be:

```plain
future2 done...
efg
```

Or it may be:

```plain
future1 done...
abc
```

## Recommendations for Using CompletableFuture

### Use a Custom Thread Pool

In the code examples above, for convenience, we did not choose a custom thread pool. In real projects, this is not advisable.

In the default implementation of `CompletableFuture`, asynchronous methods that do not explicitly pass in an `Executor` typically use the globally shared `ForkJoinPool.commonPool()`; subclasses can override `defaultExecutor()` to change the default executor for non-static asynchronous methods. This means that if an application and multiple libraries or frameworks all use the default implementation, the related asynchronous tasks will usually share the same thread pool.

Although `ForkJoinPool` is very efficient, submitting a large number of tasks simultaneously can lead to resource contention and thread starvation, thereby degrading system performance.

To avoid these issues, it is recommended to provide a custom thread pool for `CompletableFuture`, which brings the following advantages:

- **Isolation**: Assign separate thread pools to different tasks to avoid contention over the global thread pool.
- **Resource control**: Tune the thread pool size and queue type according to task characteristics to optimize performance.
- **Exception handling**: Better handle exceptions inside threads via a custom `ThreadFactory`.

```java
private ThreadPoolExecutor executor = new ThreadPoolExecutor(10, 10,
        0L, TimeUnit.MILLISECONDS,
        new LinkedBlockingQueue<Runnable>());

CompletableFuture.runAsync(() -> {
     //...
}, executor);
```

### Avoid Using `get()` Whenever Possible

The `get()` method of `CompletableFuture` is blocking and should be avoided whenever possible. If you must use it, be sure to specify a timeout; otherwise, the main thread may wait indefinitely and be unable to execute other tasks.

```java
    CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
        try {
            Thread.sleep(10_000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "Hello, world!";
    });

    // Retrieve the return value of the asynchronous task with a timeout of 5 seconds
    try {
        String result = future.get(5, TimeUnit.SECONDS);
        System.out.println(result);
    } catch (InterruptedException | ExecutionException | TimeoutException e) {
        // Handle exception
        e.printStackTrace();
    }
}
```

In the code above, calling `get()` throws a `TimeoutException`. This allows us to take corresponding actions in exception handling, such as cancelling the task, retrying the task, logging, and so on.

### Handle Exceptions Properly

When using `CompletableFuture`, be sure to handle exceptions properly to avoid losing exceptions or running into unpredictable issues.

Here are a few recommendations:

- `whenComplete` executes its callback when the stage completes either normally or exceptionally, making it suitable for observing results and logging exceptions; by default, it preserves the original stage's result or exception and is not intended to convert an exception into a normal result.
- `exceptionally` executes only when the stage completes exceptionally and recovers to a normal result using the callback's return value; if you need to continue propagating the exception, you can explicitly throw an exception inside the callback.
- `handle` executes regardless of whether the stage completes normally or exceptionally, and produces a new result based on the result and exception.
- `CompletableFuture.allOf` can wait for multiple stages to all complete; if any one stage completes exceptionally, the returned `CompletableFuture` will also complete exceptionally, though you still need to inspect each individual stage to obtain each task's result or exception.
- ...

### Combine Multiple Asynchronous Tasks Properly

Properly use methods such as `thenCompose()`, `thenCombine()`, `acceptEither()`, `allOf()`, and `anyOf()` to combine multiple asynchronous tasks so as to meet real business requirements and improve program execution efficiency.

In practice, we can also leverage or learn from ready-made asynchronous task orchestration frameworks, such as JD's [asyncTool](https://gitee.com/jd-platform-opensource/asyncTool).

![asyncTool README documentation](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/asyncTool-readme-b14669c5.png)

## Afterword

This article only gives a brief introduction to the core concepts and some commonly used APIs of `CompletableFuture`. If you want to learn more deeply, you can read additional books and blog posts—for example, the following articles are quite good:

- [CompletableFuture Principles and Practice - Asynchronization of Meituan Delivery Merchant-Side APIs - Meituan Tech Team](https://tech.meituan.com/2022/05/12/principles-and-practices-of-completablefuture.html): This article explains how `CompletableFuture` is applied in real-world projects in detail. By referring to this article, you can optimize similar scenarios in your own projects, which also makes a nice highlight. This kind of performance optimization is relatively simple yet quite effective!
- [Reading RocketMQ Source Code to Learn the Three Core Concurrency Utilities - Brother Yong Java Practical Sharing](https://mp.weixin.qq.com/s/32Ak-WFLynQfpn0Cg0N-0A): This article introduces how RocketMQ uses `CompletableFuture`. Specifically, starting from RocketMQ 4.7, RocketMQ introduced `CompletableFuture` to implement asynchronous message processing.

In addition, readers are encouraged to check out JD's concurrency framework [asyncTool](https://gitee.com/jd-platform-opensource/asyncTool), which makes extensive use of `CompletableFuture`.
