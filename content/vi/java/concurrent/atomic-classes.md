---
title: Tổng hợp về các lớp Atomic
description: "Giải thích chi tiết các lớp Atomic trong Java: tổng hợp toàn diện hệ thống lớp Atomic trong gói JUC, các lớp thường dùng như AtomicInteger/AtomicLong/AtomicReference, cài đặt thread-safe dựa trên CAS, kịch bản sử dụng và ưu thế hiệu năng."
category: Java
tag:
  - Java Concurrency
lang: vi
sourceRef: zh-ref/java/concurrent/atomic-classes.md
head:
  - - meta
    - name: keywords
      content: Lớp Atomic,AtomicInteger,AtomicLong,AtomicReference,thao tác nguyên tử CAS,gói đồng thời JUC,cách dùng lớp Atomic
---

## Giới thiệu các lớp Atomic

`Atomic` dịch sang tiếng Việt có nghĩa là "nguyên tử". Trong hóa học, nguyên tử là đơn vị nhỏ nhất cấu thành vật chất và không thể phân chia trong các phản ứng hóa học. Trong lập trình, `Atomic` chỉ một thao tác có tính nguyên tử (`Atomicity`), nghĩa là thao tác đó không thể chia cắt và không thể bị ngắt quãng. Ngay cả khi có nhiều Thread cùng thực thi đồng thời, thao tác đó hoặc là hoàn tất toàn bộ, hoặc là không thực hiện gì cả, tuyệt đối không để Thread khác nhìn thấy trạng thái mới hoàn thành một phần.

Nói một cách đơn giản, lớp nguyên tử (`Atomic` class) là lớp mang đặc tính thực thi các thao tác một cách nguyên tử.

Các lớp `Atomic` trong gói `java.util.concurrent.atomic` cung cấp một cách thức an toàn luồng (thread-safe) để thao tác trên một biến đơn lẻ.

Các lớp `Atomic` dựa vào khóa lạc quan (`Optimistic Lock`) CAS (Compare-And-Swap — so sánh và hoán đổi) để đảm bảo tính nguyên tử (`Atomicity`) cho các phương thức của chúng, mà không cần sử dụng các cơ chế khóa truyền thống (như khối `synchronized` hoặc `ReentrantLock`).

Trong bài viết này, chúng ta chỉ giới thiệu khái niệm và cách dùng các lớp Atomic; về nguyên lý cài đặt cụ thể, bạn có thể đọc bài viết sau: [Giải thích chi tiết CAS](./cas.md).

![Tổng quan các lớp Atomic trong JUC](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/JUC-064976d1.png)

Dựa theo kiểu dữ liệu thao tác, có thể chia các lớp Atomic trong gói JUC thành 4 nhóm:

**1. Kiểu dữ liệu cơ bản**

Cập nhật các kiểu dữ liệu cơ bản theo cách nguyên tử:

- `AtomicInteger`: Lớp nguyên tử kiểu số nguyên (`int`)
- `AtomicLong`: Lớp nguyên tử kiểu số nguyên dài (`long`)
- `AtomicBoolean`: Lớp nguyên tử kiểu `boolean`

**2. Kiểu mảng**

Cập nhật một phần tử nào đó bên trong mảng theo cách nguyên tử:

- `AtomicIntegerArray`: Lớp nguyên tử mảng số nguyên (`int[]`)
- `AtomicLongArray`: Lớp nguyên tử mảng số nguyên dài (`long[]`)
- `AtomicReferenceArray`: Lớp nguyên tử mảng kiểu tham chiếu

**3. Kiểu tham chiếu**

- `AtomicReference`: Lớp nguyên tử kiểu tham chiếu
- `AtomicMarkableReference`: Cập nhật nguyên tử kiểu tham chiếu có gắn cờ đánh dấu (`mark`). Lớp này liên kết một cờ `boolean` với tham chiếu, có thể phát hiện sự thay đổi giữa hai trạng thái do nghiệp vụ quy ước, nhưng một bit đánh dấu không thể ghi nhận số lần thay đổi phiên bản tùy ý.
- `AtomicStampedReference`: Cập nhật nguyên tử kiểu tham chiếu có gắn số phiên bản (`stamp`). Lớp này liên kết một giá trị số nguyên với tham chiếu, dùng để cập nhật nguyên tử đồng thời cả dữ liệu và số phiên bản của dữ liệu, giúp giải quyết vấn đề ABA có thể xảy ra khi dùng CAS để cập nhật nguyên tử.

So với `AtomicMarkableReference`, `AtomicStampedReference` sử dụng số phiên bản kiểu nguyên nên phù hợp hơn để phát hiện xem tham chiếu có trải qua nhiều lần thay đổi giữa hai lần đọc hay không.

**4. Kiểu cập nhật thuộc tính đối tượng**

- `AtomicIntegerFieldUpdater`: Bộ cập nhật nguyên tử cho trường kiểu `int` của đối tượng
- `AtomicLongFieldUpdater`: Bộ cập nhật nguyên tử cho trường kiểu `long` của đối tượng
- `AtomicReferenceFieldUpdater`: Bộ cập nhật nguyên tử cho trường kiểu tham chiếu bên trong đối tượng

## Các lớp Atomic kiểu dữ liệu cơ bản

Cập nhật kiểu dữ liệu cơ bản theo cách nguyên tử:

- `AtomicInteger`: Lớp nguyên tử kiểu số nguyên (`int`)
- `AtomicLong`: Lớp nguyên tử kiểu số nguyên dài (`long`)
- `AtomicBoolean`: Lớp nguyên tử kiểu `boolean`

Ba lớp trên cung cấp các phương thức gần như giống hệt nhau, nên ở đây chúng ta lấy `AtomicInteger` làm ví dụ minh họa.

**Các phương thức thường dùng của lớp `AtomicInteger`**:

```java
public final int get() // Lấy giá trị hiện tại
public final int getAndSet(int newValue) // Lấy giá trị hiện tại và thiết lập giá trị mới
public final int getAndIncrement() // Lấy giá trị hiện tại và tăng thêm 1
public final int getAndDecrement() // Lấy giá trị hiện tại và giảm đi 1
public final int getAndAdd(int delta) // Lấy giá trị hiện tại và cộng thêm giá trị kỳ vọng
boolean compareAndSet(int expect, int update) // Nếu giá trị hiện tại bằng giá trị kỳ vọng, cập nhật nguyên tử giá trị thành update
public final void lazySet(int newValue) // Cuối cùng sẽ thiết lập thành newValue; lazySet cung cấp ngữ nghĩa yếu hơn phương thức set, có thể khiến các Thread khác vẫn đọc thấy giá trị cũ trong một khoảng thời gian ngắn sau đó, nhưng có thể đạt hiệu năng cao hơn.
```

**Ví dụ sử dụng lớp `AtomicInteger`**:

```java
// Khởi tạo đối tượng AtomicInteger với giá trị ban đầu là 0
AtomicInteger atomicInt = new AtomicInteger(0);

// Dùng phương thức getAndSet để lấy giá trị hiện tại và đặt giá trị mới là 3
int tempValue = atomicInt.getAndSet(3);
System.out.println("tempValue: " + tempValue + "; atomicInt: " + atomicInt);

// Dùng phương thức getAndIncrement để lấy giá trị hiện tại và tăng thêm 1
tempValue = atomicInt.getAndIncrement();
System.out.println("tempValue: " + tempValue + "; atomicInt: " + atomicInt);

// Dùng phương thức getAndAdd để lấy giá trị hiện tại và cộng thêm giá trị chỉ định là 5
tempValue = atomicInt.getAndAdd(5);
System.out.println("tempValue: " + tempValue + "; atomicInt: " + atomicInt);

// Dùng phương thức compareAndSet để cập nhật có điều kiện nguyên tử, giá trị kỳ vọng là 9, giá trị mới là 10
boolean updateSuccess = atomicInt.compareAndSet(9, 10);
System.out.println("Update Success: " + updateSuccess + "; atomicInt: " + atomicInt);

// Lấy giá trị hiện tại
int currentValue = atomicInt.get();
System.out.println("Current value: " + currentValue);

// Dùng phương thức lazySet để đặt giá trị mới là 15
atomicInt.lazySet(15);
System.out.println("After lazySet, atomicInt: " + atomicInt);
```

Kết quả đầu ra:

```java
tempValue: 0; atomicInt: 3
tempValue: 3; atomicInt: 4
tempValue: 4; atomicInt: 9
Update Success: true; atomicInt: 10
Current value: 10
After lazySet, atomicInt: 15
```

## Các lớp Atomic kiểu mảng

Cập nhật một phần tử nào đó trong mảng theo cách nguyên tử:

- `AtomicIntegerArray`: Lớp nguyên tử mảng kiểu số nguyên (`int`)
- `AtomicLongArray`: Lớp nguyên tử mảng kiểu số nguyên dài (`long`)
- `AtomicReferenceArray`: Lớp nguyên tử mảng kiểu tham chiếu

Ba lớp trên cung cấp các phương thức gần như giống hệt nhau, nên ở đây chúng ta lấy `AtomicIntegerArray` làm ví dụ minh họa.

**Các phương thức thường dùng của lớp `AtomicIntegerArray`**:

```java
public final int get(int i) // Lấy giá trị phần tử tại vị trí index=i
public final int getAndSet(int i, int newValue) // Trả về giá trị hiện tại ở vị trí index=i và đặt thành giá trị mới: newValue
public final int getAndIncrement(int i) // Lấy giá trị phần tử ở vị trí index=i và tăng phần tử đó thêm 1
public final int getAndDecrement(int i) // Lấy giá trị phần tử ở vị trí index=i và giảm phần tử đó đi 1
public final int getAndAdd(int i, int delta) // Lấy giá trị phần tử ở vị trí index=i và cộng thêm giá trị chỉ định
boolean compareAndSet(int i, int expect, int update) // Nếu giá trị hiện tại bằng giá trị kỳ vọng, cập nhật nguyên tử giá trị phần tử tại index=i thành update
public final void lazySet(int i, int newValue) // Cuối cùng đặt phần tử tại index=i thành newValue; sau khi dùng lazySet, các Thread khác có thể vẫn đọc thấy giá trị cũ trong một khoảng thời gian ngắn.
```

**Ví dụ sử dụng lớp `AtomicIntegerArray`**:

```java
int[] nums = {1, 2, 3, 4, 5, 6};
// Tạo AtomicIntegerArray
AtomicIntegerArray atomicArray = new AtomicIntegerArray(nums);

// In ra các giá trị ban đầu trong AtomicIntegerArray
System.out.println("Initial values in AtomicIntegerArray:");
for (int j = 0; j < nums.length; j++) {
    System.out.print("Index " + j + ": " + atomicArray.get(j) + " ");
}

// Dùng phương thức getAndSet đặt giá trị tại chỉ số 0 thành 2 và trả về giá trị cũ
int tempValue = atomicArray.getAndSet(0, 2);
System.out.println("\nAfter getAndSet(0, 2):");
System.out.println("Returned value: " + tempValue);
for (int j = 0; j < atomicArray.length(); j++) {
    System.out.print("Index " + j + ": " + atomicArray.get(j) + " ");
}

// Dùng phương thức getAndIncrement tăng giá trị tại chỉ số 0 thêm 1 và trả về giá trị cũ
tempValue = atomicArray.getAndIncrement(0);
System.out.println("\nAfter getAndIncrement(0):");
System.out.println("Returned value: " + tempValue);
for (int j = 0; j < atomicArray.length(); j++) {
    System.out.print("Index " + j + ": " + atomicArray.get(j) + " ");
}

// Dùng phương thức getAndAdd tăng giá trị tại chỉ số 0 thêm 5 và trả về giá trị cũ
tempValue = atomicArray.getAndAdd(0, 5);
System.out.println("\nAfter getAndAdd(0, 5):");
System.out.println("Returned value: " + tempValue);
for (int j = 0; j < atomicArray.length(); j++) {
    System.out.print("Index " + j + ": " + atomicArray.get(j) + " ");
}
```

Kết quả đầu ra:

```plain
Initial values in AtomicIntegerArray:
Index 0: 1 Index 1: 2 Index 2: 3 Index 3: 4 Index 4: 5 Index 5: 6
After getAndSet(0, 2):
Returned value: 1
Index 0: 2 Index 1: 2 Index 2: 3 Index 3: 4 Index 4: 5 Index 5: 6
After getAndIncrement(0):
Returned value: 2
Index 0: 3 Index 1: 2 Index 2: 3 Index 3: 4 Index 4: 5 Index 5: 6
After getAndAdd(0, 5):
Returned value: 3
Index 0: 8 Index 1: 2 Index 2: 3 Index 3: 4 Index 4: 5 Index 5: 6
```

## Các lớp Atomic kiểu tham chiếu

Các lớp Atomic kiểu dữ liệu cơ bản chỉ cập nhật được một biến; nếu cần cập nhật nguyên tử nhiều biến cùng lúc, bạn cần sử dụng các lớp Atomic kiểu tham chiếu.

- `AtomicReference`: Lớp nguyên tử kiểu tham chiếu
- `AtomicStampedReference`: Cập nhật nguyên tử kiểu tham chiếu có gắn số phiên bản. Lớp này liên kết một giá trị số nguyên với tham chiếu, dùng để cập nhật nguyên tử đồng thời cả dữ liệu và số phiên bản của dữ liệu, giúp giải quyết vấn đề ABA có thể xảy ra khi dùng CAS để cập nhật nguyên tử.
- `AtomicMarkableReference`: Cập nhật nguyên tử kiểu tham chiếu có gắn cờ đánh dấu. Lớp này liên kết một cờ `boolean` với tham chiếu, ~~cũng có thể giải quyết vấn đề ABA có thể xảy ra khi dùng CAS để cập nhật nguyên tử.~~

Ba lớp trên cung cấp các phương thức gần như giống hệt nhau, nên ở đây chúng ta lấy `AtomicReference` làm ví dụ minh họa.

**Ví dụ sử dụng lớp `AtomicReference`**:

```java
// Lớp Person
class Person {
    private String name;
    private int age;
    // Lược bỏ getter/setter và toString
}


// Tạo đối tượng AtomicReference và đặt giá trị ban đầu
AtomicReference<Person> ar = new AtomicReference<>(new Person("SnailClimb", 22));

// In giá trị ban đầu
System.out.println("Initial Person: " + ar.get().toString());

// Cập nhật giá trị
Person updatePerson = new Person("Daisy", 20);
ar.compareAndSet(ar.get(), updatePerson);

// In giá trị sau khi cập nhật
System.out.println("Updated Person: " + ar.get().toString());

// Thử cập nhật lại lần nữa
Person anotherUpdatePerson = new Person("John", 30);
boolean isUpdated = ar.compareAndSet(updatePerson, anotherUpdatePerson);

// In kết quả cập nhật thành công hay không và giá trị cuối cùng
System.out.println("Second Update Success: " + isUpdated);
System.out.println("Final Person: " + ar.get().toString());
```

Kết quả đầu ra:

```plain
Initial Person: Person{name='SnailClimb', age=22}
Updated Person: Person{name='Daisy', age=20}
Second Update Success: true
Final Person: Person{name='John', age=30}
```

**Ví dụ sử dụng lớp `AtomicStampedReference`**:

```java
// Tạo đối tượng AtomicStampedReference với giá trị ban đầu là "SnailClimb", số phiên bản ban đầu là 1
AtomicStampedReference<String> asr = new AtomicStampedReference<>("SnailClimb", 1);

// In giá trị và số phiên bản ban đầu
int[] initialStamp = new int[1];
String initialRef = asr.get(initialStamp);
System.out.println("Initial Reference: " + initialRef + ", Initial Stamp: " + initialStamp[0]);

// Cập nhật giá trị và số phiên bản
int oldStamp = initialStamp[0];
String oldRef = initialRef;
String newRef = "Daisy";
int newStamp = oldStamp + 1;

boolean isUpdated = asr.compareAndSet(oldRef, newRef, oldStamp, newStamp);
System.out.println("Update Success: " + isUpdated);

// In giá trị và số phiên bản sau khi cập nhật
int[] updatedStamp = new int[1];
String updatedRef = asr.get(updatedStamp);
System.out.println("Updated Reference: " + updatedRef + ", Updated Stamp: " + updatedStamp[0]);

// Thử cập nhật với số phiên bản sai
boolean isUpdatedWithWrongStamp = asr.compareAndSet(newRef, "John", oldStamp, newStamp + 1);
System.out.println("Update with Wrong Stamp Success: " + isUpdatedWithWrongStamp);

// In giá trị và số phiên bản cuối cùng
int[] finalStamp = new int[1];
String finalRef = asr.get(finalStamp);
System.out.println("Final Reference: " + finalRef + ", Final Stamp: " + finalStamp[0]);
```

Kết quả đầu ra như sau:

```plain
Initial Reference: SnailClimb, Initial Stamp: 1
Update Success: true
Updated Reference: Daisy, Updated Stamp: 2
Update with Wrong Stamp Success: false
Final Reference: Daisy, Final Stamp: 2
```

**Ví dụ sử dụng lớp `AtomicMarkableReference`**:

```java
// Tạo đối tượng AtomicMarkableReference với giá trị ban đầu là "SnailClimb", cờ đánh dấu ban đầu là false
AtomicMarkableReference<String> amr = new AtomicMarkableReference<>("SnailClimb", false);

// In giá trị và cờ đánh dấu ban đầu
boolean[] initialMark = new boolean[1];
String initialRef = amr.get(initialMark);
System.out.println("Initial Reference: " + initialRef + ", Initial Mark: " + initialMark[0]);

// Cập nhật giá trị và cờ đánh dấu
String oldRef = initialRef;
String newRef = "Daisy";
boolean oldMark = initialMark[0];
boolean newMark = true;

boolean isUpdated = amr.compareAndSet(oldRef, newRef, oldMark, newMark);
System.out.println("Update Success: " + isUpdated);

// In giá trị và cờ đánh dấu sau khi cập nhật
boolean[] updatedMark = new boolean[1];
String updatedRef = amr.get(updatedMark);
System.out.println("Updated Reference: " + updatedRef + ", Updated Mark: " + updatedMark[0]);

// Thử cập nhật với cờ đánh dấu sai
boolean isUpdatedWithWrongMark = amr.compareAndSet(newRef, "John", oldMark, !newMark);
System.out.println("Update with Wrong Mark Success: " + isUpdatedWithWrongMark);

// In giá trị và cờ đánh dấu cuối cùng
boolean[] finalMark = new boolean[1];
String finalRef = amr.get(finalMark);
System.out.println("Final Reference: " + finalRef + ", Final Mark: " + finalMark[0]);
```

Kết quả đầu ra như sau:

```plain
Initial Reference: SnailClimb, Initial Mark: false
Update Success: true
Updated Reference: Daisy, Updated Mark: true
Update with Wrong Mark Success: false
Final Reference: Daisy, Final Mark: true
```

## Các lớp Atomic cập nhật thuộc tính của đối tượng

Nếu cần cập nhật nguyên tử một trường nào đó bên trong một lớp, ta cần sử dụng các lớp Atomic thuộc nhóm cập nhật thuộc tính đối tượng.

- `AtomicIntegerFieldUpdater`: Bộ cập nhật nguyên tử cho trường kiểu `int`
- `AtomicLongFieldUpdater`: Bộ cập nhật nguyên tử cho trường kiểu `long`
- `AtomicReferenceFieldUpdater`: Bộ cập nhật nguyên tử cho trường kiểu tham chiếu

Để cập nhật thuộc tính của đối tượng một cách nguyên tử cần hai bước. Bước thứ nhất, vì các lớp Atomic cập nhật thuộc tính đối tượng đều là lớp trừu tượng (`abstract class`), nên mỗi lần sử dụng đều phải dùng phương thức tĩnh `newUpdater()` để tạo một bộ cập nhật, đồng thời truyền vào lớp và tên thuộc tính muốn cập nhật. Bước thứ hai, trường mục tiêu bắt buộc phải được khai báo với `volatile` và khớp với kiểu của bộ cập nhật: lần lượt là `int`, `long` hoặc kiểu tham chiếu; đồng thời không được là trường `static` hoặc `final`.

Ba lớp trên cung cấp các phương thức gần như giống hệt nhau, nên ở đây chúng ta lấy `AtomicIntegerFieldUpdater` làm ví dụ minh họa.

**Ví dụ sử dụng lớp `AtomicIntegerFieldUpdater`**:

```java
// Lớp Person
class Person {
    private String name;
    // Để sử dụng AtomicIntegerFieldUpdater, trường này bắt buộc phải là volatile int
    volatile int age;
    // Lược bỏ getter/setter và toString
}

// Tạo đối tượng AtomicIntegerFieldUpdater
AtomicIntegerFieldUpdater<Person> ageUpdater = AtomicIntegerFieldUpdater.newUpdater(Person.class, "age");

// Tạo đối tượng Person
Person person = new Person("SnailClimb", 22);

// In giá trị ban đầu
System.out.println("Initial Person: " + person);

// Cập nhật trường age
ageUpdater.incrementAndGet(person); // Tăng thêm 1
System.out.println("After Increment: " + person);

ageUpdater.addAndGet(person, 5); // Cộng thêm 5
System.out.println("After Adding 5: " + person);

ageUpdater.compareAndSet(person, 28, 30); // Nếu giá trị hiện tại là 28, đặt thành 30
System.out.println("After Compare and Set (28 to 30): " + person);

// Thử cập nhật bằng giá trị so sánh sai
boolean isUpdated = ageUpdater.compareAndSet(person, 28, 35); // Lần này sẽ thất bại
System.out.println("Compare and Set (28 to 35) Success: " + isUpdated);
System.out.println("Final Person: " + person);
```

Kết quả đầu ra:

```plain
Initial Person: Name: SnailClimb, Age: 22
After Increment: Name: SnailClimb, Age: 23
After Adding 5: Name: SnailClimb, Age: 28
After Compare and Set (28 to 30): Name: SnailClimb, Age: 30
Compare and Set (28 to 35) Success: false
Final Person: Name: SnailClimb, Age: 30
```

## Tài liệu tham khảo

- *Nghệ thuật lập trình đồng thời trong Java* (*The Art of Java Concurrency Programming*)
