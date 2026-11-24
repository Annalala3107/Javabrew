---
title: Giải thích chi tiết CompletableFuture
description: "Hướng dẫn chi tiết lập trình bất đồng bộ với CompletableFuture: giải thích toàn diện các API cốt lõi của CompletableFuture, điều phối tác vụ bất đồng bộ, kết hợp thenCompose/thenCombine, tổng hợp allOf/anyOf, cấu hình Thread Pool và các best practices."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/completablefuture-intro.md
head:
  - - meta
    - name: keywords
      content: CompletableFuture,lập trình bất đồng bộ,điều phối bất đồng bộ,Future,thenCompose,thenCombine,allOf,tác vụ song song
---

Trong các dự án thực tế, một API endpoint cần đồng thời lấy nhiều loại dữ liệu khác nhau rồi tổng hợp lại để trả về là kịch bản khá phổ biến. Lấy ví dụ: khi người dùng gửi yêu cầu lấy thông tin đơn hàng, hệ thống có thể cần lấy đồng thời các dữ liệu như thông tin người dùng, chi tiết sản phẩm, thông tin vận chuyển, gợi ý sản phẩm, v.v.

Nếu thực thi tuần tự (chạy lần lượt từng tác vụ theo thứ tự), tốc độ phản hồi của API sẽ rất chậm. Xét thấy phần lớn các tác vụ này **không có sự phụ thuộc trước sau**, chúng ta có thể **thực thi song song**—chẳng hạn khi gọi lấy chi tiết sản phẩm thì có thể đồng thời gọi lấy thông tin vận chuyển. Thông qua việc thực thi song song nhiều tác vụ, tốc độ phản hồi của API sẽ được tối ưu đáng kể.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-performance/serial-to-parallel-198beea8.png)

Đối với các tác vụ có quan hệ thứ tự gọi trước sau, chúng ta có thể tiến hành điều phối tác vụ (task orchestration).

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/high-performance/serial-to-parallel2-3a41b928.png)

1. Sau khi lấy được thông tin người dùng mới có thể gọi API chi tiết sản phẩm và thông tin vận chuyển.
2. Sau khi lấy thành công chi tiết sản phẩm và thông tin vận chuyển mới có thể gọi API gợi ý sản phẩm.

Một số kịch bản có thể cần dùng đến điều phối tác vụ bất đồng bộ đa luồng (đây chỉ là ví dụ minh họa, dữ liệu không nhất thiết phải trả về trong một lần mà có thể tách thành nhiều API):

1. Trang chủ: Ví dụ trang chủ của một cộng đồng kỹ thuật có thể cần đồng thời lấy danh sách bài viết đề xuất, banner quảng cáo, bảng xếp hạng bài viết, chủ đề nổi bật, v.v.
2. Trang chi tiết: Ví dụ trang chi tiết bài viết của một cộng đồng kỹ thuật có thể cần đồng thời lấy thông tin tác giả, nội dung chi tiết bài viết, bình luận bài viết, v.v.
3. Mô-đun thống kê: Ví dụ mô-đun thống kê ở trang quản trị của một cộng đồng kỹ thuật có thể cần đồng thời lấy tổng số người theo dõi, tổng hợp dữ liệu bài viết (lượt đọc, lượt bình luận, lượt lưu), v.v.

Đối với chương trình Java, `CompletableFuture` được giới thiệu từ Java 8 có thể giúp chúng ta điều phối nhiều tác vụ với khả năng cực kỳ mạnh mẽ.

Bài viết này là phần nhập môn ngắn gọn về `CompletableFuture`, giúp bạn nắm qua các API thường dùng của `CompletableFuture`.

## Giới thiệu về Future

Interface `Future` là ứng dụng điển hình của tư duy bất đồng bộ, chủ yếu dùng trong những kịch bản cần thực thi các tác vụ tốn nhiều thời gian, tránh việc chương trình phải đứng yên chờ tác vụ hoàn thành khiến hiệu suất thực thi quá thấp. Cụ thể là thế này: khi cần thực thi một tác vụ tốn thời gian, chúng ta có thể giao tác vụ đó cho một thread con thực thi bất đồng bộ, đồng thời bản thân luồng chính có thể làm những việc khác mà không cần chờ đợi thụ động. Sau khi làm xong việc của mình, ta lấy kết quả thực thi của tác vụ tốn thời gian đó thông qua `Future`. Nhờ vậy, hiệu suất thực thi của chương trình được nâng cao rõ rệt.

Đây thực chất chính là **Future Pattern** kinh điển trong lập trình đa luồng. Bạn có thể xem nó như một Design Pattern với tư tưởng cốt lõi là gọi bất đồng bộ (asynchronous invocation), chủ yếu dùng trong lĩnh vực đa luồng chứ không phải chỉ riêng ngôn ngữ Java mới có.

Trong Java, `Future` là một generic interface nằm trong package `java.util.concurrent`. Nó có 5 phương thức trừu tượng kinh điển, chủ yếu bao gồm 4 nhóm chức năng dưới đây; kể từ JDK 19 trở đi đã bổ sung thêm ba phương thức truy vấn mặc định là `resultNow()`, `exceptionNow()` và `state()`.

- Hủy tác vụ;
- Kiểm tra tác vụ đã bị hủy hay chưa;
- Kiểm tra tác vụ đã thực thi hoàn tất hay chưa;
- Lấy kết quả thực thi của tác vụ.

```java
// V đại diện cho kiểu giá trị trả về của tác vụ do Future thực thi
public interface Future<V> {
    // Hủy thực thi tác vụ
    // Trả về true nếu hủy thành công, ngược lại trả về false
    boolean cancel(boolean mayInterruptIfRunning);
    // Kiểm tra tác vụ đã bị hủy hay chưa
    boolean isCancelled();
    // Kiểm tra tác vụ đã thực thi hoàn tất hay chưa
    boolean isDone();
    // Lấy kết quả thực thi của tác vụ
    V get() throws InterruptedException, ExecutionException;
    // Nếu quá thời gian chỉ định mà chưa trả về kết quả tính toán thì ném ngoại lệ TimeoutException
    V get(long timeout, TimeUnit unit)
        throws InterruptedException, ExecutionException, TimeoutException;
}
```

Hiểu một cách đơn giản: tôi có một tác vụ và giao cho `Future` xử lý. Trong thời gian tác vụ đang thực thi, tôi có thể làm bất cứ việc gì mình muốn. Hơn nữa, trong khoảng thời gian đó tôi vẫn có thể hủy tác vụ cũng như kiểm tra trạng thái thực thi của nó. Sau một thời gian, tôi có thể lấy trực tiếp kết quả thực thi tác vụ từ `Future`.

## Giới thiệu về CompletableFuture

Trong quá trình sử dụng thực tế, `Future` tồn tại một số hạn chế, chẳng hạn không hỗ trợ điều phối và kết hợp nhiều tác vụ bất đồng bộ, còn phương thức `get()` để lấy kết quả tính toán lại là lời gọi chặn (blocking call).

Lớp `CompletableFuture` được giới thiệu từ Java 8 có thể khắc phục những nhược điểm này của `Future`. Ngoài việc cung cấp các tính năng `Future` tiện dụng và mạnh mẽ hơn, `CompletableFuture` còn hỗ trợ lập trình hàm (functional programming) cũng như khả năng điều phối và kết hợp tác vụ bất đồng bộ (có thể nối nhiều tác vụ bất đồng bộ thành một chuỗi lời gọi liên hoàn hoàn chỉnh).

Dưới đây chúng ta hãy xem qua định nghĩa của lớp `CompletableFuture`.

```java
public class CompletableFuture<T> implements Future<T>, CompletionStage<T> {
}
```

Có thể thấy, `CompletableFuture` triển khai đồng thời cả hai interface `Future` và `CompletionStage`.

![](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/completablefuture-class-diagram-f01a3bb2.jpg)

Ngoài việc cung cấp các tính năng `Future` dễ dùng và mạnh mẽ hơn, `CompletableFuture` còn mang lại khả năng lập trình hàm.

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20210902092441434-8e6e65c9.png)

Interface `Future` có 5 phương thức:

- `boolean cancel(boolean mayInterruptIfRunning)`: Thử hủy việc thực thi tác vụ.
- `boolean isCancelled()`: Kiểm tra tác vụ có bị hủy hay không.
- `boolean isDone()`: Kiểm tra tác vụ đã hoàn tất thực thi hay chưa.
- `get()`: Chờ tác vụ thực thi xong và lấy kết quả tính toán.
- `get(long timeout, TimeUnit unit)`: Bổ sung thêm thời gian chờ tối đa (timeout).

Interface `CompletionStage` mô tả một giai đoạn (stage) của phép tính toán bất đồng bộ. Nhiều phép tính có thể chia thành nhiều giai đoạn hoặc nhiều bước, khi đó ta có thể kết hợp toàn bộ các bước lại thông qua `CompletionStage` để tạo thành một pipeline tính toán bất đồng bộ.

Interface `CompletionStage` có khá nhiều phương thức; khả năng lập trình hàm của `CompletableFuture` chính là do interface này mang lại. Nhìn vào tham số các phương thức của interface này, bạn sẽ nhận ra ngay nó sử dụng rất nhiều tính năng lập trình hàm được giới thiệu trong Java 8.

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20210902093026059-f1354d4c.png)

Vì số lượng phương thức rất nhiều nên ở đây không thể giải thích từng phương thức một; phần dưới đây tôi sẽ giới thiệu cách sử dụng của hầu hết các phương thức phổ biến.

## Các thao tác thường dùng với CompletableFuture

### Khởi tạo CompletableFuture

Các cách phổ biến để khởi tạo đối tượng `CompletableFuture` như sau:

1. Thông qua từ khóa `new`.
2. Dựa trên các phương thức static factory có sẵn của `CompletableFuture`: `runAsync()`, `supplyAsync()`.

#### Từ khóa `new`

Cách khởi tạo đối tượng `CompletableFuture` thông qua từ khóa `new` có thể xem như việc sử dụng `CompletableFuture` giống với `Future`.

Trong dự án mã nguồn mở [guide-rpc-framework](https://github.com/Snailclimb/guide-rpc-framework) của tôi, tôi cũng tạo đối tượng `CompletableFuture` theo đúng cách này.

Dưới đây hãy xem một ví dụ đơn giản.

Chúng ta tạo một `CompletableFuture` có kiểu giá trị kết quả là `RpcResponse<Object>`; bạn có thể coi `resultFuture` là vật chứa kết quả của phép tính bất đồng bộ.

```java
CompletableFuture<RpcResponse<Object>> resultFuture = new CompletableFuture<>();
```

Giả sử tại một thời điểm nào đó trong tương lai, chúng ta nhận được kết quả cuối cùng. Lúc này, ta có thể gọi phương thức `complete()` để truyền kết quả vào cho nó, biểu thị rằng `resultFuture` đã hoàn thành.

```java
// Phương thức complete() chỉ có thể gọi một lần, các lần gọi sau sẽ bị bỏ qua.
resultFuture.complete(rpcResponse);
```

Bạn có thể kiểm tra xem nó đã hoàn thành hay chưa thông qua phương thức `isDone()`.

```java
public boolean isDone() {
    return result != null;
}
```

Lấy kết quả tính toán bất đồng bộ cũng rất đơn giản, chỉ cần gọi trực tiếp phương thức `get()`. Thread gọi `get()` sẽ bị block cho đến khi `CompletableFuture` hoàn tất tính toán.

```java
rpcResponse = completableFuture.get();
```

Nếu bạn đã biết trước kết quả tính toán, có thể dùng phương thức tĩnh `completedFuture()` để tạo `CompletableFuture`.

```java
CompletableFuture<String> future = CompletableFuture.completedFuture("hello!");
assertEquals("hello!", future.get());
```

Bên dưới, phương thức `completedFuture()` gọi constructor có tham số thông qua `new`, chỉ có điều constructor này không được public ra ngoài.

```java
public static <U> CompletableFuture<U> completedFuture(U value) {
    return new CompletableFuture<U>((value == null) ? NIL : value);
}
```

#### Phương thức Static Factory

Hai phương thức này giúp chúng ta đóng gói logic tính toán.

```java
static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier);
// Sử dụng Thread Pool tùy chỉnh (khuyến nghị)
static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier, Executor executor);
static CompletableFuture<Void> runAsync(Runnable runnable);
// Sử dụng Thread Pool tùy chỉnh (khuyến nghị)
static CompletableFuture<Void> runAsync(Runnable runnable, Executor executor);
```

Phương thức `runAsync()` nhận vào tham số là `Runnable`—đây là một functional interface không cho phép trả về giá trị. Khi bạn cần thao tác bất đồng bộ và không quan tâm đến giá trị trả về, có thể dùng phương thức `runAsync()`.

```java
@FunctionalInterface
public interface Runnable {
    public abstract void run();
}
```

Phương thức `supplyAsync()` nhận vào tham số là `Supplier<U>`—đây cũng là một functional interface, trong đó `U` là kiểu của giá trị kết quả trả về.

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

Khi bạn cần thao tác bất đồng bộ và có quan tâm đến kết quả trả về, có thể dùng phương thức `supplyAsync()`.

```java
CompletableFuture<Void> future = CompletableFuture.runAsync(() -> System.out.println("hello!"));
future.get();// In ra "hello!"
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "hello!");
assertEquals("hello!", future2.get());
```

### Xử lý kết quả tính toán bất đồng bộ

Sau khi nhận được kết quả của phép tính bất đồng bộ, chúng ta còn có thể xử lý tiếp kết quả đó; các phương thức thường dùng gồm có:

- `thenApply()`
- `thenAccept()`
- `thenRun()`
- `whenComplete()`

Phương thức `thenApply()` nhận vào một instance `Function` và dùng nó để xử lý kết quả.

```java
// Callback không bất đồng bộ: có thể do thread hoàn thành stage trước thực thi; nếu stage đã hoàn thành, cũng có thể do thread đang gọi thực thi
public <U> CompletableFuture<U> thenApply(
    Function<? super T,? extends U> fn) {
    return uniApplyStage(null, fn);
}

// Sử dụng Thread Pool mặc định ForkJoinPool (không khuyến nghị)
public <U> CompletableFuture<U> thenApplyAsync(
    Function<? super T,? extends U> fn) {
    return uniApplyStage(defaultExecutor(), fn);
}
// Sử dụng Thread Pool tùy chỉnh (khuyến nghị)
public <U> CompletableFuture<U> thenApplyAsync(
    Function<? super T,? extends U> fn, Executor executor) {
    return uniApplyStage(screenExecutor(executor), fn);
}
```

Ví dụ sử dụng phương thức `thenApply()` như sau:

```java
CompletableFuture<String> future = CompletableFuture.completedFuture("hello!")
        .thenApply(s -> s + "world!");
assertEquals("hello!world!", future.get());
// Lần gọi này sẽ bị bỏ qua.
future.thenApply(s -> s + "nice!");
assertEquals("hello!world!", future.get());
```

Bạn cũng có thể thực hiện **gọi chuỗi (fluent chaining)**:

```java
CompletableFuture<String> future = CompletableFuture.completedFuture("hello!")
        .thenApply(s -> s + "world!").thenApply(s -> s + "nice!");
assertEquals("hello!world!nice!", future.get());
```

**Nếu bạn không cần lấy giá trị trả về từ hàm callback, có thể sử dụng `thenAccept()` hoặc `thenRun()`. Sự khác biệt giữa hai phương thức này là `thenRun()` không thể truy cập kết quả của phép tính bất đồng bộ.**

Tham số của phương thức `thenAccept()` là `Consumer<? super T>`.

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

Đúng như tên gọi, `Consumer` là interface dạng tiêu thụ: nó có thể nhận 1 đối tượng đầu vào rồi thực hiện "tiêu thụ" (consume).

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

Tham số của phương thức `thenRun()` là `Runnable`.

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

Ví dụ sử dụng `thenAccept()` và `thenRun()` như sau:

```java
CompletableFuture.completedFuture("hello!")
        .thenApply(s -> s + "world!").thenApply(s -> s + "nice!").thenAccept(System.out::println);//hello!world!nice!

CompletableFuture.completedFuture("hello!")
        .thenApply(s -> s + "world!").thenApply(s -> s + "nice!").thenRun(() -> System.out.println("hello!"));//hello!
```

Tham số của phương thức `whenComplete()` là `BiConsumer<? super T, ? super Throwable>`.

```java
public CompletableFuture<T> whenComplete(
    BiConsumer<? super T, ? super Throwable> action) {
    return uniWhenCompleteStage(null, action);
}


public CompletableFuture<T> whenCompleteAsync(
    BiConsumer<? super T, ? super Throwable> action) {
    return uniWhenCompleteStage(defaultExecutor(), action);
}
// Sử dụng Thread Pool tùy chỉnh (khuyến nghị)
public CompletableFuture<T> whenCompleteAsync(
    BiConsumer<? super T, ? super Throwable> action, Executor executor) {
    return uniWhenCompleteStage(screenExecutor(executor), action);
}
```

So với `Consumer`, `BiConsumer` có thể nhận 2 đối tượng đầu vào rồi thực hiện "tiêu thụ".

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

Ví dụ sử dụng `whenComplete()` như sau:

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "hello!")
        .whenComplete((res, ex) -> {
            // res đại diện cho kết quả trả về
            // ex có kiểu Throwable, đại diện cho ngoại lệ được ném ra
            System.out.println(res);
            // Ở đây không ném ngoại lệ nên ex là null
            assertNull(ex);
        });
assertEquals("hello!", future.get());
```

### Xử lý ngoại lệ

Bạn có thể sử dụng phương thức `handle()` để xử lý các trường hợp có thể phát sinh ngoại lệ trong quá trình thực thi tác vụ.

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

Mã ví dụ như sau:

```java
CompletableFuture<String> future
        = CompletableFuture.supplyAsync(() -> {
    if (true) {
        throw new RuntimeException("Computation error!");
    }
    return "hello!";
}).handle((res, ex) -> {
    // res đại diện cho kết quả trả về
    // ex có kiểu Throwable, đại diện cho ngoại lệ được ném ra
    return res != null ? res : "world!";
});
assertEquals("world!", future.get());
```

Bạn cũng có thể xử lý các tình huống ngoại lệ bằng phương thức `exceptionally()`.

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

Nếu muốn kết quả của `CompletableFuture` chính là một ngoại lệ, bạn có thể gán giá trị cho nó bằng phương thức `completeExceptionally()`.

```java
CompletableFuture<String> completableFuture = new CompletableFuture<>();
// ...
completableFuture.completeExceptionally(
  new RuntimeException("Calculation failed!"));
// ...
completableFuture.get(); // ExecutionException
```

### Kết hợp CompletableFuture

Bạn có thể sử dụng `thenCompose()` để liên kết tuần tự hai đối tượng `CompletableFuture`, tạo thành một chuỗi tác vụ bất đồng bộ. Tác dụng của nó là lấy kết quả trả về của tác vụ trước làm tham số đầu vào cho tác vụ tiếp theo, qua đó hình thành một mối quan hệ phụ thuộc.

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

Ví dụ sử dụng phương thức `thenCompose()` như sau:

```java
CompletableFuture<String> future
        = CompletableFuture.supplyAsync(() -> "hello!")
        .thenCompose(s -> CompletableFuture.supplyAsync(() -> s + "world!"));
assertEquals("hello!world!", future.get());
```

Trong phát triển thực tế, phương thức này rất hữu ích. Chẳng hạn, cả `task1` và `task2` đều được thực thi bất đồng bộ, nhưng `task1` phải thực thi xong thì `task2` mới có thể bắt đầu (`task2` phụ thuộc vào kết quả thực thi của `task1`).

Tương tự phương thức `thenCompose()` còn có phương thức `thenCombine()`, nó cũng có thể kết hợp hai đối tượng `CompletableFuture`.

```java
CompletableFuture<String> completableFuture
        = CompletableFuture.supplyAsync(() -> "hello!")
        .thenCombine(CompletableFuture.supplyAsync(
                () -> "world!"), (s1, s2) -> s1 + s2)
        .thenCompose(s -> CompletableFuture.supplyAsync(() -> s + "nice!"));
assertEquals("hello!world!nice!", completableFuture.get());
```

**Vậy `thenCompose()` và `thenCombine()` có gì khác nhau?**

- `thenCompose()` có thể liên kết hai đối tượng `CompletableFuture` và truyền kết quả trả về của tác vụ trước làm tham số cho tác vụ tiếp theo; giữa chúng tồn tại thứ tự trước sau.
- `thenCombine()` sẽ gộp kết quả của hai stage lại sau khi cả hai đều hoàn thành bình thường. Hai stage này có thể độc lập với nhau, nhưng việc chúng có thực thi song song hay không phụ thuộc vào cách khởi tạo và Executor được sử dụng; bản thân `thenCombine()` không chịu trách nhiệm khởi chạy tác vụ.

Ngoài `thenCompose()` và `thenCombine()`, còn có một số phương thức kết hợp `CompletableFuture` khác dùng để đạt được các hiệu ứng khác nhau, đáp ứng những nhu cầu nghiệp vụ đa dạng.

Ví dụ, trong kịch bản cả `task1` và `task2` đều hoàn thành bình thường, có thể dùng `acceptEither()` để `task3` nhận kết quả của một trong hai tác vụ hoàn thành trước. Cần lưu ý rằng nó không thể dùng làm bộ chọn "kết quả thành công đầu tiên" đáng tin cậy: chỉ cần một trong hai stage hoàn thành với ngoại lệ, kết quả của stage trả về sẽ phải tuân theo quy tắc xử lý ngoại lệ của `CompletionStage` đối với tổ hợp `either`.

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

Lấy một ví dụ đơn giản:

```java
CompletableFuture<String> task = CompletableFuture.supplyAsync(() -> {
    System.out.println("Task 1 bắt đầu thực thi, thời gian hiện tại: " + System.currentTimeMillis());
    try {
        Thread.sleep(500);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    System.out.println("Task 1 thực thi xong, thời gian hiện tại: " + System.currentTimeMillis());
    return "task1";
});

CompletableFuture<String> task2 = CompletableFuture.supplyAsync(() -> {
    System.out.println("Task 2 bắt đầu thực thi, thời gian hiện tại: " + System.currentTimeMillis());
    try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    System.out.println("Task 2 thực thi xong, thời gian hiện tại: " + System.currentTimeMillis());
    return "task2";
});

task.acceptEitherAsync(task2, (res) -> {
    System.out.println("Task 3 bắt đầu thực thi, thời gian hiện tại: " + System.currentTimeMillis());
    System.out.println("Kết quả của task trước đó là: " + res);
});

// Thêm một khoảng thời gian trễ để đảm bảo các tác vụ bất đồng bộ có đủ thời gian hoàn thành
try {
    Thread.sleep(2000);
} catch (InterruptedException e) {
    e.printStackTrace();
}
```

Đầu ra:

```plain
Task 1 bắt đầu thực thi, thời gian hiện tại: 1695088058520
Task 2 bắt đầu thực thi, thời gian hiện tại: 1695088058521
Task 1 thực thi xong, thời gian hiện tại: 1695088059023
Task 3 bắt đầu thực thi, thời gian hiện tại: 1695088059023
Kết quả của task trước đó là: task1
Task 2 thực thi xong, thời gian hiện tại: 1695088059523
```

Khi cả hai stage đều hoàn thành bình thường, `acceptEitherAsync()` sẽ sử dụng kết quả của một trong hai stage đã hoàn thành để thực thi bất đồng bộ Task 3—thường là kết quả của stage hoàn thành trước. Tuy nhiên, nếu một trong hai stage hoàn thành với ngoại lệ trong khi stage còn lại chưa hoàn thành hoặc hoàn thành bình thường, đặc tả không đảm bảo stage trả về cuối cùng chắc chắn hoàn thành bình thường hay hoàn thành với ngoại lệ. Do đó, không thể dựa vào phương thức này để bỏ qua ngoại lệ xảy ra trước rồi tiếp tục chờ kết quả thành công còn lại.

### Chờ nhiều CompletableFuture hoàn thành

Bạn có thể sử dụng phương thức tĩnh `allOf()` của `CompletableFuture` để chờ toàn bộ nhiều `CompletableFuture` cùng hoàn thành. `allOf()` chỉ kết hợp trạng thái hoàn thành của các stage đã có, không chịu trách nhiệm khởi chạy các tác vụ đó; việc các tác vụ có chạy song song hay không phụ thuộc vào cách khởi tạo và Executor của chúng.

Trong các dự án thực tế, chúng ta thường cần chạy song song nhiều tác vụ không liên quan đến nhau; các tác vụ này không phụ thuộc lẫn nhau và có thể chạy độc lập.

Chẳng hạn như chúng ta cần đọc và xử lý 6 tệp tin: cả 6 tác vụ này đều không phụ thuộc thứ tự thực thi với nhau, nhưng trước khi trả về cho người dùng chúng ta cần tổng hợp và thống kê kết quả xử lý của các tệp tin đó. Trong những trường hợp như vậy, chúng ta có thể chạy song song nhiều `CompletableFuture` để xử lý.

Mã ví dụ như sau:

```java
CompletableFuture<Void> task1 =
  CompletableFuture.supplyAsync(()->{
    // Thao tác nghiệp vụ tùy chỉnh
  });
......
CompletableFuture<Void> task6 =
  CompletableFuture.supplyAsync(()->{
    // Thao tác nghiệp vụ tùy chỉnh
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

Phương thức thường được đem ra so sánh với `allOf()` là `anyOf()`.

**Phương thức `allOf()` sẽ chờ cho đến khi tất cả các `CompletableFuture` đều chạy xong mới trả về**

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

Gọi `join()` giúp chương trình chờ cho cả `future1` và `future2` đều chạy xong rồi mới tiếp tục thực thi.

```java
CompletableFuture<Void> completableFuture = CompletableFuture.allOf(future1, future2);
completableFuture.join();
assertTrue(completableFuture.isDone());
System.out.println("all futures done...");
```

Đầu ra:

```plain
future1 done...
future2 done...
all futures done...
```

**Phương thức `anyOf()` sẽ không chờ tất cả các `CompletableFuture` chạy xong mới trả về—chỉ cần có một tác vụ thực thi xong là được!**

```java
CompletableFuture<Object> f = CompletableFuture.anyOf(future1, future2);
System.out.println(f.get());
```

Kết quả đầu ra có thể là:

```plain
future2 done...
efg
```

Hoặc cũng có thể là:

```plain
future1 done...
abc
```

## Khuyến nghị khi sử dụng CompletableFuture

### Sử dụng Thread Pool tùy chỉnh

Trong các ví dụ mã nguồn ở trên, để tiện minh họa nên chúng ta đều không chọn sử dụng Thread Pool tùy chỉnh. Trong dự án thực tế, điều này là không nên.

Trong cài đặt mặc định của `CompletableFuture`, các phương thức bất đồng bộ không truyền tường minh `Executor` thường sử dụng `ForkJoinPool.commonPool()` được chia sẻ toàn cục; các lớp con có thể ghi đè (`Override`) `defaultExecutor()` để thay đổi Executor mặc định cho các phương thức bất đồng bộ không tĩnh. Điều này có nghĩa là nếu ứng dụng cùng nhiều thư viện hoặc framework đều dùng cài đặt mặc định, các tác vụ bất đồng bộ liên quan thường sẽ dùng chung một Thread Pool.

Mặc dù `ForkJoinPool` có hiệu năng rất cao, nhưng khi submit đồng thời một lượng lớn tác vụ, nó có thể dẫn đến tranh chấp tài nguyên và tình trạng đói luồng (`Starvation`), từ đó ảnh hưởng đến hiệu năng hệ thống.

Để tránh những vấn đề này, khuyến nghị cung cấp Thread Pool tùy chỉnh cho `CompletableFuture`, mang lại các lợi ích sau:

- **Tính cô lập (Isolation)**: Phân bổ Thread Pool riêng cho từng nhóm tác vụ khác nhau, tránh tranh giành tài nguyên của Thread Pool toàn cục.
- **Kiểm soát tài nguyên**: Điều chỉnh kích thước Thread Pool và loại hàng đợi (queue) dựa trên đặc tính của tác vụ để tối ưu hiệu năng.
- **Xử lý ngoại lệ**: Xử lý tốt hơn các ngoại lệ xảy ra bên trong thread thông qua `ThreadFactory` tùy chỉnh.

```java
private ThreadPoolExecutor executor = new ThreadPoolExecutor(10, 10,
        0L, TimeUnit.MILLISECONDS,
        new LinkedBlockingQueue<Runnable>());

CompletableFuture.runAsync(() -> {
     //...
}, executor);
```

### Hạn chế sử dụng `get()` hết mức có thể

Phương thức `get()` của `CompletableFuture` là phương thức chặn (blocking), nên hạn chế sử dụng tối đa. Nếu bắt buộc phải dùng, cần thiết lập thêm thời gian chờ tối đa (timeout), nếu không có thể khiến thread chính phải chờ vô thời hạn và không thể thực thi các tác vụ khác.

```java
    CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
        try {
            Thread.sleep(10_000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return "Hello, world!";
    });

    // Lấy giá trị trả về của tác vụ bất đồng bộ, thiết lập timeout là 5 giây
    try {
        String result = future.get(5, TimeUnit.SECONDS);
        System.out.println(result);
    } catch (InterruptedException | ExecutionException | TimeoutException e) {
        // Xử lý ngoại lệ
        e.printStackTrace();
    }
}
```

Đoạn mã trên khi gọi `get()` sẽ ném ra ngoại lệ `TimeoutException`. Nhờ vậy, chúng ta có thể thực hiện các thao tác tương ứng trong phần xử lý ngoại lệ, chẳng hạn như hủy tác vụ, thử lại tác vụ (retry), ghi log, v.v.

### Xử lý ngoại lệ đúng cách

Khi sử dụng `CompletableFuture`, nhất định phải xử lý ngoại lệ đúng cách để tránh thất lạc ngoại lệ hoặc phát sinh các vấn đề khó kiểm soát.

Dưới đây là một số gợi ý:

- `whenComplete` sẽ thực thi callback khi stage hoàn thành bình thường hoặc có ngoại lệ, phù hợp để quan sát kết quả và ghi log ngoại lệ; mặc định nó giữ nguyên kết quả hoặc ngoại lệ của stage ban đầu, không dùng để chuyển đổi ngoại lệ thành kết quả bình thường.
- `exceptionally` chỉ thực thi khi stage hoàn thành với ngoại lệ và dùng giá trị trả về của callback để khôi phục thành kết quả bình thường; nếu cần tiếp tục lan truyền ngoại lệ, có thể ném (`throw`) ngoại lệ một cách tường minh bên trong callback.
- `handle` luôn thực thi bất kể stage hoàn thành bình thường hay có ngoại lệ, và tạo ra một kết quả mới dựa trên kết quả và ngoại lệ nhận được.
- `CompletableFuture.allOf` có thể chờ nhiều stage cùng hoàn thành; chỉ cần một stage trong số đó hoàn thành với ngoại lệ thì `CompletableFuture` trả về cũng sẽ hoàn thành với ngoại lệ, nhưng vẫn cần kiểm tra riêng từng stage để lấy được kết quả hoặc ngoại lệ của mỗi tác vụ.
- ...

### Kết hợp hợp lý nhiều tác vụ bất đồng bộ

Sử dụng đúng các phương thức như `thenCompose()`, `thenCombine()`, `acceptEither()`, `allOf()`, `anyOf()`, v.v. để kết hợp nhiều tác vụ bất đồng bộ nhằm đáp ứng nhu cầu nghiệp vụ thực tế và nâng cao hiệu quả thực thi chương trình.

Trong sử dụng thực tế, chúng ta còn có thể tận dụng hoặc tham khảo các framework điều phối tác vụ bất đồng bộ có sẵn, chẳng hạn như [asyncTool](https://gitee.com/jd-platform-opensource/asyncTool) của JD.

![Tài liệu README của asyncTool](/media/jg/ext/oss.javaguide.cn/javaguide/java/concurrent/asyncTool-readme-b14669c5.png)

## Lời kết

Bài viết này chỉ giới thiệu sơ lược các khái niệm cốt lõi và một số API tương đối phổ biến của `CompletableFuture`. Nếu muốn tìm hiểu sâu hơn, bạn có thể tìm đọc thêm các sách và bài viết blog khác, chẳng hạn mấy bài viết dưới đây khá hay:

- [Nguyên lý và thực hành CompletableFuture - Bất đồng bộ hóa API phía nhà bán hàng Meituan Delivery - Đội ngũ kỹ thuật Meituan](https://tech.meituan.com/2022/05/12/principles-and-practices-of-completablefuture.html): Bài viết này giới thiệu chi tiết việc áp dụng `CompletableFuture` trong dự án thực tế. Tham khảo bài viết này, bạn có thể tối ưu cho các kịch bản tương tự trong dự án của mình và cũng có thể xem đây là một điểm nhấn nhỏ. Kiểu tối ưu hiệu năng này tương đối đơn giản mà hiệu quả mang lại lại khá tốt!
- [Đọc mã nguồn RocketMQ để học ba công cụ tối thượng trong lập trình đồng thời - Chia sẻ thực chiến Java của anh Dũng](https://mp.weixin.qq.com/s/32Ak-WFLynQfpn0Cg0N-0A): Bài viết này giới thiệu cách RocketMQ ứng dụng `CompletableFuture`. Cụ thể, từ RocketMQ 4.7 trở đi, RocketMQ đã đưa `CompletableFuture` vào để triển khai xử lý message bất đồng bộ.

Ngoài ra, khuyến khích các bạn đọc xem thêm framework đồng thời [asyncTool](https://gitee.com/jd-platform-opensource/asyncTool) của JD—bên trong sử dụng rất nhiều `CompletableFuture`.
