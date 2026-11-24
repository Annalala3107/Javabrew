---
title: Summary of Atomic Classes
description: "Detailed guide to Java Atomic classes: a comprehensive summary of the JUC Atomic class hierarchy, common classes such as AtomicInteger/AtomicLong/AtomicReference, CAS-based thread-safe implementation, use cases, and performance advantages."
category: Java
tag:
  - Java Concurrency
lang: en
sourceRef: zh-ref/java/concurrent/atomic-classes.md
head:
  - - meta
    - name: keywords
      content: Atomic classes,AtomicInteger,AtomicLong,AtomicReference,CAS atomic operations,JUC concurrency package,Atomic class usage
---

## Introduction to Atomic Classes

The word `Atomic` literally means "atom" (indivisible unit). In chemistry, an atom is the smallest constituent unit of matter and cannot be divided during a chemical reaction. In programming, `Atomic` refers to an operation having atomicity—that is, the operation is indivisible and cannot be interrupted. Even when multiple threads execute concurrently, the operation either completes entirely or does not execute at all; other threads will never observe a partially completed state.

Put simply, an atomic class is a class characterized by atomic operations.

The `Atomic` classes in the `java.util.concurrent.atomic` package provide a thread-safe way to operate on a single variable.

`Atomic` classes rely on CAS (Compare-And-Swap) optimistic locking to guarantee the atomicity of their methods, without requiring traditional locking mechanisms (such as `synchronized` blocks or `ReentrantLock`).

In this article, we only cover the concepts and usage of Atomic classes. For the underlying implementation principles, you can read this article: [Detailed Explanation of CAS](./cas.md).

![Overview of JUC Atomic Classes](/media/jg/ext/oss.javaguide.cn/github/javaguide/java/JUC-064976d1.png)

Based on the data types they operate on, the atomic classes in the JUC package can be divided into 4 categories:

**1. Primitive Types**

Atomically update primitive types:

- `AtomicInteger`: Integer atomic class
- `AtomicLong`: Long integer atomic class
- `AtomicBoolean`: Boolean atomic class

**2. Array Types**

Atomically update a specific element in an array:

- `AtomicIntegerArray`: Integer array atomic class
- `AtomicLongArray`: Long integer array atomic class
- `AtomicReferenceArray`: Reference type array atomic class

**3. Reference Types**

- `AtomicReference`: Reference type atomic class
- `AtomicMarkableReference`: Atomically updates a reference type with a mark bit. This class associates a `boolean` mark with a reference, enabling detection of transitions between two states agreed upon by business logic, though a single-bit mark cannot record an arbitrary number of version changes.
- `AtomicStampedReference`: Atomically updates a reference type with a version stamp. This class associates an integer value with a reference, which can be used to atomically update both the data and its version number, solving the ABA problem that can occur when using CAS for atomic updates.

By comparison, `AtomicStampedReference` uses an integer version number and is better suited for detecting whether a reference has undergone multiple changes between two reads.

**4. Object Field Updaters**

- `AtomicIntegerFieldUpdater`: Updater for atomically updating `int` fields of an object
- `AtomicLongFieldUpdater`: Updater for atomically updating `long` fields of an object
- `AtomicReferenceFieldUpdater`: Updater for atomically updating reference-type fields of an object

## Primitive Type Atomic Classes

Atomically update primitive types:

- `AtomicInteger`: Integer atomic class
- `AtomicLong`: Long integer atomic class
- `AtomicBoolean`: Boolean atomic class

The three classes above provide nearly identical methods, so here we use `AtomicInteger` as an example.

**Common methods of `AtomicInteger`**:

```java
public final int get() // Get the current value
public final int getAndSet(int newValue) // Get the current value and set a new value
public final int getAndIncrement() // Get the current value and increment by 1
public final int getAndDecrement() // Get the current value and decrement by 1
public final int getAndAdd(int delta) // Get the current value and add the specified delta
boolean compareAndSet(int expect, int update) // If the current value equals expect, atomically set the value to update
public final void lazySet(int newValue) // Eventually sets the value to newValue; lazySet provides weaker semantics than set, which may allow other threads to read the old value for a short time afterward, but can be more efficient.
```

**Example of using `AtomicInteger`**:

```java
// Initialize an AtomicInteger object with an initial value of 0
AtomicInteger atomicInt = new AtomicInteger(0);

// Use getAndSet to get the current value and set the new value to 3
int tempValue = atomicInt.getAndSet(3);
System.out.println("tempValue: " + tempValue + "; atomicInt: " + atomicInt);

// Use getAndIncrement to get the current value and increment by 1
tempValue = atomicInt.getAndIncrement();
System.out.println("tempValue: " + tempValue + "; atomicInt: " + atomicInt);

// Use getAndAdd to get the current value and add 5
tempValue = atomicInt.getAndAdd(5);
System.out.println("tempValue: " + tempValue + "; atomicInt: " + atomicInt);

// Use compareAndSet for an atomic conditional update: expected value is 9, new value is 10
boolean updateSuccess = atomicInt.compareAndSet(9, 10);
System.out.println("Update Success: " + updateSuccess + "; atomicInt: " + atomicInt);

// Get the current value
int currentValue = atomicInt.get();
System.out.println("Current value: " + currentValue);

// Use lazySet to set the new value to 15
atomicInt.lazySet(15);
System.out.println("After lazySet, atomicInt: " + atomicInt);
```

Output:

```java
tempValue: 0; atomicInt: 3
tempValue: 3; atomicInt: 4
tempValue: 4; atomicInt: 9
Update Success: true; atomicInt: 10
Current value: 10
After lazySet, atomicInt: 15
```

## Array Type Atomic Classes

Atomically update a specific element in an array:

- `AtomicIntegerArray`: Integer array atomic class
- `AtomicLongArray`: Long integer array atomic class
- `AtomicReferenceArray`: Reference type array atomic class

The three classes above provide nearly identical methods, so here we use `AtomicIntegerArray` as an example.

**Common methods of `AtomicIntegerArray`**:

```java
public final int get(int i) // Get the value of the element at index=i
public final int getAndSet(int i, int newValue) // Return the current value at index=i and set it to newValue
public final int getAndIncrement(int i) // Get the value at index=i and increment the element at that index by 1
public final int getAndDecrement(int i) // Get the value at index=i and decrement the element at that index by 1
public final int getAndAdd(int i, int delta) // Get the value at index=i and add the specified delta
boolean compareAndSet(int i, int expect, int update) // If the current value equals expect, atomically set the element at index=i to update
public final void lazySet(int i, int newValue) // Eventually sets the element at index=i to newValue; after using lazySet, other threads may still read the old value for a short period of time.
```

**Example of using `AtomicIntegerArray`**:

```java
int[] nums = {1, 2, 3, 4, 5, 6};
// Create an AtomicIntegerArray
AtomicIntegerArray atomicArray = new AtomicIntegerArray(nums);

// Print initial values in AtomicIntegerArray
System.out.println("Initial values in AtomicIntegerArray:");
for (int j = 0; j < nums.length; j++) {
    System.out.print("Index " + j + ": " + atomicArray.get(j) + " ");
}

// Use getAndSet to set the value at index 0 to 2 and return the old value
int tempValue = atomicArray.getAndSet(0, 2);
System.out.println("\nAfter getAndSet(0, 2):");
System.out.println("Returned value: " + tempValue);
for (int j = 0; j < atomicArray.length(); j++) {
    System.out.print("Index " + j + ": " + atomicArray.get(j) + " ");
}

// Use getAndIncrement to increment the value at index 0 by 1 and return the old value
tempValue = atomicArray.getAndIncrement(0);
System.out.println("\nAfter getAndIncrement(0):");
System.out.println("Returned value: " + tempValue);
for (int j = 0; j < atomicArray.length(); j++) {
    System.out.print("Index " + j + ": " + atomicArray.get(j) + " ");
}

// Use getAndAdd to add 5 to the value at index 0 and return the old value
tempValue = atomicArray.getAndAdd(0, 5);
System.out.println("\nAfter getAndAdd(0, 5):");
System.out.println("Returned value: " + tempValue);
for (int j = 0; j < atomicArray.length(); j++) {
    System.out.print("Index " + j + ": " + atomicArray.get(j) + " ");
}
```

Output:

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

## Reference Type Atomic Classes

Primitive type atomic classes can only update a single variable; if you need to atomically update multiple variables, you need to use reference type atomic classes.

- `AtomicReference`: Reference type atomic class
- `AtomicStampedReference`: Atomically updates a reference type with a version stamp. This class associates an integer value with a reference, which can be used to atomically update both the data and its version number, solving the ABA problem that can occur when using CAS for atomic updates.
- `AtomicMarkableReference`: Atomically updates a reference type with a mark bit. This class associates a `boolean` mark with a reference, ~~and can also solve the ABA problem that may occur when using CAS for atomic updates.~~

The three classes above provide nearly identical methods, so here we use `AtomicReference` as an example.

**Example of using `AtomicReference`**:

```java
// Person class
class Person {
    private String name;
    private int age;
    // getter/setter and toString omitted
}


// Create an AtomicReference object and set its initial value
AtomicReference<Person> ar = new AtomicReference<>(new Person("SnailClimb", 22));

// Print initial value
System.out.println("Initial Person: " + ar.get().toString());

// Update value
Person updatePerson = new Person("Daisy", 20);
ar.compareAndSet(ar.get(), updatePerson);

// Print updated value
System.out.println("Updated Person: " + ar.get().toString());

// Attempt to update again
Person anotherUpdatePerson = new Person("John", 30);
boolean isUpdated = ar.compareAndSet(updatePerson, anotherUpdatePerson);

// Print whether update succeeded and the final value
System.out.println("Second Update Success: " + isUpdated);
System.out.println("Final Person: " + ar.get().toString());
```

Output:

```plain
Initial Person: Person{name='SnailClimb', age=22}
Updated Person: Person{name='Daisy', age=20}
Second Update Success: true
Final Person: Person{name='John', age=30}
```

**Example of using `AtomicStampedReference`**:

```java
// Create an AtomicStampedReference object with initial value "SnailClimb" and initial stamp 1
AtomicStampedReference<String> asr = new AtomicStampedReference<>("SnailClimb", 1);

// Print initial value and stamp
int[] initialStamp = new int[1];
String initialRef = asr.get(initialStamp);
System.out.println("Initial Reference: " + initialRef + ", Initial Stamp: " + initialStamp[0]);

// Update value and stamp
int oldStamp = initialStamp[0];
String oldRef = initialRef;
String newRef = "Daisy";
int newStamp = oldStamp + 1;

boolean isUpdated = asr.compareAndSet(oldRef, newRef, oldStamp, newStamp);
System.out.println("Update Success: " + isUpdated);

// Print updated value and stamp
int[] updatedStamp = new int[1];
String updatedRef = asr.get(updatedStamp);
System.out.println("Updated Reference: " + updatedRef + ", Updated Stamp: " + updatedStamp[0]);

// Attempt to update with a wrong stamp
boolean isUpdatedWithWrongStamp = asr.compareAndSet(newRef, "John", oldStamp, newStamp + 1);
System.out.println("Update with Wrong Stamp Success: " + isUpdatedWithWrongStamp);

// Print final value and stamp
int[] finalStamp = new int[1];
String finalRef = asr.get(finalStamp);
System.out.println("Final Reference: " + finalRef + ", Final Stamp: " + finalStamp[0]);
```

The output is as follows:

```plain
Initial Reference: SnailClimb, Initial Stamp: 1
Update Success: true
Updated Reference: Daisy, Updated Stamp: 2
Update with Wrong Stamp Success: false
Final Reference: Daisy, Final Stamp: 2
```

**Example of using `AtomicMarkableReference`**:

```java
// Create an AtomicMarkableReference object with initial value "SnailClimb" and initial mark false
AtomicMarkableReference<String> amr = new AtomicMarkableReference<>("SnailClimb", false);

// Print initial value and mark
boolean[] initialMark = new boolean[1];
String initialRef = amr.get(initialMark);
System.out.println("Initial Reference: " + initialRef + ", Initial Mark: " + initialMark[0]);

// Update value and mark
String oldRef = initialRef;
String newRef = "Daisy";
boolean oldMark = initialMark[0];
boolean newMark = true;

boolean isUpdated = amr.compareAndSet(oldRef, newRef, oldMark, newMark);
System.out.println("Update Success: " + isUpdated);

// Print updated value and mark
boolean[] updatedMark = new boolean[1];
String updatedRef = amr.get(updatedMark);
System.out.println("Updated Reference: " + updatedRef + ", Updated Mark: " + updatedMark[0]);

// Attempt to update with a wrong mark
boolean isUpdatedWithWrongMark = amr.compareAndSet(newRef, "John", oldMark, !newMark);
System.out.println("Update with Wrong Mark Success: " + isUpdatedWithWrongMark);

// Print final value and mark
boolean[] finalMark = new boolean[1];
String finalRef = amr.get(finalMark);
System.out.println("Final Reference: " + finalRef + ", Final Mark: " + finalMark[0]);
```

The output is as follows:

```plain
Initial Reference: SnailClimb, Initial Mark: false
Update Success: true
Updated Reference: Daisy, Updated Mark: true
Update with Wrong Mark Success: false
Final Reference: Daisy, Final Mark: true
```

## Object Field Updater Atomic Classes

If you need to atomically update a specific field inside a class, you need to use object field updater atomic classes.

- `AtomicIntegerFieldUpdater`: Updater for atomically updating `int` fields
- `AtomicLongFieldUpdater`: Updater for atomically updating `long` fields
- `AtomicReferenceFieldUpdater`: Updater for atomically updating reference-type fields

Atomically updating an object's field requires two steps. First, because object field updater atomic classes are all abstract classes, each time you use one you must create an updater via the static method `newUpdater()` and specify the target class and field name you want to update. Second, the target field must be modified with `volatile` and match the updater's type (`int`, `long`, or a reference type respectively); at the same time, it cannot be a `static` or `final` field.

The three classes above provide nearly identical methods, so here we use `AtomicIntegerFieldUpdater` as an example.

**Example of using `AtomicIntegerFieldUpdater`**:

```java
// Person class
class Person {
    private String name;
    // To use AtomicIntegerFieldUpdater, the field must be volatile int
    volatile int age;
    // getter/setter and toString omitted
}

// Create an AtomicIntegerFieldUpdater object
AtomicIntegerFieldUpdater<Person> ageUpdater = AtomicIntegerFieldUpdater.newUpdater(Person.class, "age");

// Create a Person object
Person person = new Person("SnailClimb", 22);

// Print initial value
System.out.println("Initial Person: " + person);

// Update age field
ageUpdater.incrementAndGet(person); // Increment by 1
System.out.println("After Increment: " + person);

ageUpdater.addAndGet(person, 5); // Add 5
System.out.println("After Adding 5: " + person);

ageUpdater.compareAndSet(person, 28, 30); // If current value is 28, set to 30
System.out.println("After Compare and Set (28 to 30): " + person);

// Attempt to update using an incorrect expected value
boolean isUpdated = ageUpdater.compareAndSet(person, 28, 35); // This should fail
System.out.println("Compare and Set (28 to 35) Success: " + isUpdated);
System.out.println("Final Person: " + person);
```

Output:

```plain
Initial Person: Name: SnailClimb, Age: 22
After Increment: Name: SnailClimb, Age: 23
After Adding 5: Name: SnailClimb, Age: 28
After Compare and Set (28 to 30): Name: SnailClimb, Age: 30
Compare and Set (28 to 35) Success: false
Final Person: Name: SnailClimb, Age: 30
```

## References

- *The Art of Java Concurrency Programming*
