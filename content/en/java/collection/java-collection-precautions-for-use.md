---
title: Summary of Precautions for Using Java Collections
description: "Summary of Precautions for Using Java Collections: A guide based on the Alibaba Java Coding Guidelines covering best practices such as collection empty checks, Arrays.asList pitfalls, subList issues, and concurrent collection selection to help avoid common mistakes."
category: Java
tag:
  - Java Collections
lang: en
sourceRef: zh-ref/java/collection/java-collection-precautions-for-use.md
head:
  - - meta
    - name: keywords
      content: Java Collections Best Practices,Collection Empty Check,Arrays.asList,subList,Concurrent Containers,Collection Usage Precautions,Performance Optimization
---

In this article, I summarize common precautions for using collections along with their underlying principles based on the *Alibaba Java Coding Guidelines*.

I strongly recommend reading through this a few times to avoid making these elementary mistakes in your own code.

## Collection Empty Checks

The *Alibaba Java Coding Guidelines* states:

> **To check whether a collection contains any elements, use the `isEmpty()` method instead of `size() == 0`.**

This is because `isEmpty()` offers better readability and has a time complexity of `O(1)`.

Most collections we use also have an `O(1)` `size()` method; however, many do not, such as `ConcurrentLinkedQueue` under the `java.util.concurrent` package. `ConcurrentLinkedQueue`'s `isEmpty()` method checks via the `first()` method, where `first()` returns the first node in the queue whose value is not `null` (node values become `null` due to logical deletion used in iterators):

```java
public boolean isEmpty() { return first() == null; }

Node<E> first() {
    restartFromHead:
    for (;;) {
        for (Node<E> h = head, p = h, q;;) {
            boolean hasItem = (p.item != null);
            if (hasItem || (q = p.next) == null) {  // Current node item is non-null or reached the tail
                updateHead(h, p);  // Set head to p
                return hasItem ? p : null;
            }
            else if (p == q) continue restartFromHead;
            else p = q;  // p = p.next
        }
    }
}
```

Because `updateHead(h, p)` is executed during element insertion and deletion, the time complexity of `first()` (and thus `isEmpty()`) can be approximated as `O(1)`. In contrast, `size()` needs to traverse the entire linked list, giving a time complexity of `O(n)`:

```java
public int size() {
    int count = 0;
    for (Node<E> p = first(); p != null; p = succ(p))
        if (p.item != null)
            if (++count == Integer.MAX_VALUE)
                break;
    return count;
}
```

In addition, in `ConcurrentHashMap` 1.7, the time complexities of `size()` and `isEmpty()` are also different. `ConcurrentHashMap` 1.7 stores element counts in each `Segment`, so `size()` must sum the counts across every `Segment`, whereas `isEmpty()` only needs to find the first non-empty `Segment`. However, in `ConcurrentHashMap` 1.8, both `size()` and `isEmpty()` call `sumCount()` to aggregate the counts in `baseCount` and `CounterCell[]`. Below is the source code of `sumCount()`:

```java
final long sumCount() {
    CounterCell[] as = counterCells; CounterCell a;
    long sum = baseCount;
    if (as != null)
        for (int i = 0; i < as.length; ++i)
            if ((a = as[i]) != null)
                sum += a.value;
    return sum;
}
```

In a concurrent environment, `ConcurrentHashMap` 1.8 uses `baseCount` and `CounterCell[]` to distribute contention during count updates, rather than storing the node count in each `Node`. In `ConcurrentHashMap` 1.7, element counts are stored in each `Segment`, so `size()` needs to sum the counts across every `Segment`, whereas `isEmpty()` only needs to find the first non-empty `Segment`.

## Converting a Collection to a Map

The *Alibaba Java Coding Guidelines* states:

> **When using the `toMap()` method of `java.util.stream.Collectors` to convert a stream into a `Map`, be sure to note that an NPE will be thrown if a value is `null`.**

```java
class Person {
    private String name;
    private String phoneNumber;
     // getters and setters
}

List<Person> bookList = new ArrayList<>();
bookList.add(new Person("jack","18163138123"));
bookList.add(new Person("martin",null));
// NullPointerException
bookList.stream().collect(Collectors.toMap(Person::getName, Person::getPhoneNumber));
```

Let's explain why this happens.

First, look at the `toMap()` method in `java.util.stream.Collectors`: we can see that internally it calls the `merge()` method of the `Map` interface.

```java
public static <T, K, U, M extends Map<K, U>>
Collector<T, ?, M> toMap(Function<? super T, ? extends K> keyMapper,
                            Function<? super T, ? extends U> valueMapper,
                            BinaryOperator<U> mergeFunction,
                            Supplier<M> mapSupplier) {
    BiConsumer<M, T> accumulator
            = (map, element) -> map.merge(keyMapper.apply(element),
                                          valueMapper.apply(element), mergeFunction);
    return new CollectorImpl<>(mapSupplier, accumulator, mapMerger(mergeFunction), CH_ID);
}
```

The `merge()` method of the `Map` interface is shown below; it is a default implementation in the interface.

> If you are not yet familiar with Java 8's new features, please read this article: [Java 8 New Features Summary](https://mp.weixin.qq.com/s/ojyl7B6PiHaTWADqmUq2rw).

```java
default V merge(K key, V value,
        BiFunction<? super V, ? super V, ? extends V> remappingFunction) {
    Objects.requireNonNull(remappingFunction);
    Objects.requireNonNull(value);
    V oldValue = get(key);
    V newValue = (oldValue == null) ? value :
               remappingFunction.apply(oldValue, value);
    if(newValue == null) {
        remove(key);
    } else {
        put(key, newValue);
    }
    return newValue;
}
```

`merge()` first calls `Objects.requireNonNull()` to check whether `value` is `null`.

```java
public static <T> T requireNonNull(T obj) {
    if (obj == null)
        throw new NullPointerException();
    return obj;
}
```

> `Collectors` also provides a `toMap()` overload without `mergeFunction`, but in that case, if a key collision occurs, it throws `duplicateKeyException`. Therefore, it is strongly recommended to always provide `mergeFunction` when using `toMap()`.

## Iterating Over a Collection

The *Alibaba Java Coding Guidelines* states:

> **Do not perform `remove/add` operations on elements inside a `foreach` loop. To remove elements, use an `Iterator`; if operating concurrently, synchronize on the `Iterator` object.**

Note that locking only the `Iterator` object cannot prevent other threads from modifying the collection. Taking the synchronized wrappers returned by `Collections.synchronizedXxx()` as an example, when iterating you should synchronize on the wrapped collection object itself and ensure that all accesses go through that wrapper.

By decompiling the code, you will find that the `foreach` syntax still relies on `Iterator` under the hood. However, `remove/add` inside the loop directly calls the collection's own method instead of the `Iterator`'s `remove/add` method.

This causes the `Iterator` to unexpectedly discover that an element has been removed or added, and it throws a `ConcurrentModificationException` to alert the user of concurrent modification. This is the **fail-fast mechanism** occurring in a single-threaded context.

> **Fail-fast mechanism**: When multiple threads modify a fail-fast collection, a `ConcurrentModificationException` may be thrown. As mentioned above, this can even happen in a single-threaded context.
>
> Related reading: [What is fail-fast](https://www.cnblogs.com/54chensongxia/p/12470446.html).

Starting from Java 8, you can use `Collection#removeIf()` to delete elements that satisfy a specific condition, for example:

```java
List<Integer> list = new ArrayList<>();
for (int i = 1; i <= 10; ++i) {
    list.add(i);
}
list.removeIf(filter -> filter % 2 == 0); /* Remove all even numbers from list */
System.out.println(list); /* [1, 3, 5, 7, 9] */
```

Besides directly using `Iterator` for traversal as introduced above, you can also:

- Use a standard `for` loop.
- Depending on the scenario, use collection classes that support snapshot iteration or weakly consistent iteration. For example, `CopyOnWriteArrayList`'s iterator is snapshot-based, and `ConcurrentHashMap`'s iterator is weakly consistent.
- ...

## Collection Deduplication

The *Alibaba Java Coding Guidelines* states:

> **Take advantage of `Set`'s unique-element property to quickly deduplicate a collection, and avoid iterating with `List`'s `contains()` for deduplication or membership checks.**

Here we use `HashSet` and `ArrayList` as examples.

```java
// Example code for deduplicating with Set
public static <T> Set<T> removeDuplicateBySet(List<T> data) {

    if (CollectionUtils.isEmpty(data)) {
        return new HashSet<>();
    }
    return new HashSet<>(data);
}

// Example code for deduplicating with List
public static <T> List<T> removeDuplicateByList(List<T> data) {

    if (CollectionUtils.isEmpty(data)) {
        return new ArrayList<>();

    }
    List<T> result = new ArrayList<>(data.size());
    for (T current : data) {
        if (!result.contains(current)) {
            result.add(current);
        }
    }
    return result;
}
```

The core difference between the two lies in the implementation of `contains()`.

`HashSet`'s `contains()` method delegates to `HashMap`'s `containsKey()` under the hood, whose time complexity is close to `O(1)` (`O(1)` when no hash collision occurs).

```java
private transient HashMap<E,Object> map;
public boolean contains(Object o) {
    return map.containsKey(o);
}
```

If we insert N elements into a `Set`, the overall time complexity is close to `O(n)`.

`ArrayList`'s `contains()` method works by traversing all elements, which has a time complexity close to `O(n)`.

```java
public boolean contains(Object o) {
    return indexOf(o) >= 0;
}
public int indexOf(Object o) {
    if (o == null) {
        for (int i = 0; i < size; i++)
            if (elementData[i]==null)
                return i;
    } else {
        for (int i = 0; i < size; i++)
            if (o.equals(elementData[i]))
                return i;
    }
    return -1;
}
```

## Converting a Collection to an Array

The *Alibaba Java Coding Guidelines* states:

> **When converting a collection to an array, you must use the collection's `toArray(T[] array)` method and pass in an empty array of the exact same type with length 0.**

The parameter of `toArray(T[] array)` is a generic array; if no argument is passed to `toArray()`, it returns an array of type `Object[]`.

```java
String [] s= new String[]{
    "dog", "lazy", "a", "over", "jumps", "fox", "brown", "quick", "A"
};
List<String> list = Arrays.asList(s);
Collections.reverse(list);
// Without specifying the type, a type conversion error will occur
s=list.toArray(new String[0]);
```

Due to JVM optimizations, using `new String[0]` as the argument to `Collection.toArray()` is now the better choice: `new String[0]` simply acts as a template specifying the type of the returned array, and length `0` saves space since it is only there to indicate the return type. For details, see: <https://shipilev.net/blog/2016/arrays-wisdom-ancients/>

## Converting an Array to a Collection

The *Alibaba Java Coding Guidelines* states:

> **When using the utility method `Arrays.asList()` to convert an array into a collection, you cannot use methods that modify the collection; its `add/remove/clear` methods will throw `UnsupportedOperationException`.**

I encountered a similar pitfall in one of my previous projects.

`Arrays.asList()` is fairly common in daily development; we can use it to convert an array into a `List` collection.

```java
String[] myArray = {"Apple", "Banana", "Orange"};
List<String> myList = Arrays.asList(myArray);
// The two statements above are equivalent to the single statement below
List<String> myList = Arrays.asList("Apple","Banana", "Orange");
```

The JDK source code documentation for this method explains:

```java
/**
  * Returns a fixed-size list backed by the specified array. This method acts as a
  * bridge between array-based and collection-based APIs, in combination with
  * Collection.toArray(). The returned list is serializable and implements RandomAccess.
  */
public static <T> List<T> asList(T... a) {
    return new ArrayList<>(a);
}
```

Let's summarize the precautions when using it.

**1. `Arrays.asList()` does not automatically box a primitive-type array and expand it into list elements.**

```java
int[] myArray = {1, 2, 3};
List myList = Arrays.asList(myArray);
System.out.println(myList.size());// 1
System.out.println(myList.get(0));// Array reference address
System.out.println(myList.get(1));// Error: ArrayIndexOutOfBoundsException
int[] array = (int[]) myList.get(0);
System.out.println(array[0]);// 1
```

When a primitive-type array is passed in, the actual argument received by `Arrays.asList()` is not the elements inside the array, but the array object itself! At that point, the sole element in the `List` is that array, which explains the behavior in the code above.

We can solve this problem by using a wrapper-type array instead:

```java
Integer[] myArray = {1, 2, 3};
```

**2. Calling collection modification methods (`add()`, `remove()`, `clear()`) will throw an exception.**

```java
List myList = Arrays.asList(1, 2, 3);
myList.add(4);// Runtime error: UnsupportedOperationException
myList.remove(1);// Runtime error: UnsupportedOperationException
myList.clear();// Runtime error: UnsupportedOperationException
```

What `Arrays.asList()` returns is not `java.util.ArrayList`, but an inner class of `java.util.Arrays`, which does not implement or override the collection modification methods.

```java
List myList = Arrays.asList(1, 2, 3);
System.out.println(myList.getClass());//class java.util.Arrays$ArrayList
```

Below is the simplified source code of `java.util.Arrays$ArrayList`, showing which methods this class overrides:

```java
  private static class ArrayList<E> extends AbstractList<E>
        implements RandomAccess, java.io.Serializable
    {
        ...

        @Override
        public E get(int index) {
          ...
        }

        @Override
        public E set(int index, E element) {
          ...
        }

        @Override
        public int indexOf(Object o) {
          ...
        }

        @Override
        public boolean contains(Object o) {
           ...
        }

        @Override
        public void forEach(Consumer<? super E> action) {
          ...
        }

        @Override
        public void replaceAll(UnaryOperator<E> operator) {
          ...
        }

        @Override
        public void sort(Comparator<? super E> c) {
          ...
        }
    }
```

If we check the `add/remove/clear` methods in `java.util.AbstractList`, we can immediately see why `UnsupportedOperationException` is thrown:

```java
public E remove(int index) {
    throw new UnsupportedOperationException();
}
public boolean add(E e) {
    add(size(), e);
    return true;
}
public void add(int index, E element) {
    throw new UnsupportedOperationException();
}

public void clear() {
    removeRange(0, size());
}
protected void removeRange(int fromIndex, int toIndex) {
    ListIterator<E> it = listIterator(fromIndex);
    for (int i=0, n=toIndex-fromIndex; i<n; i++) {
        it.next();
        it.remove();
    }
}
```

**So how do we properly convert an array into an `ArrayList`?**

1. Write a utility method manually

```java
// JDK 1.5+
static <T> List<T> arrayToList(final T[] array) {
  final List<T> l = new ArrayList<T>(array.length);

  for (final T s : array) {
    l.add(s);
  }
  return l;
}


Integer [] myArray = { 1, 2, 3 };
System.out.println(arrayToList(myArray).getClass());//class java.util.ArrayList
```

2. The simplest approach

```java
List list = new ArrayList<>(Arrays.asList("a", "b", "c"))
```

3. Using Java 8 `Stream` (Recommended)

```java
Integer [] myArray = { 1, 2, 3 };
List myList = Arrays.stream(myArray).collect(Collectors.toList());
// Primitive types can also be converted (relying on the boxing operation of boxed())
int [] myArray2 = { 1, 2, 3 };
List myList = Arrays.stream(myArray2).boxed().collect(Collectors.toList());
```

4. Using Guava

For immutable collections, you can use the [`ImmutableList`](https://github.com/google/guava/blob/master/guava/src/com/google/common/collect/ImmutableList.java) class and its [`of()`](https://github.com/google/guava/blob/master/guava/src/com/google/common/collect/ImmutableList.java#L101) and [`copyOf()`](https://github.com/google/guava/blob/master/guava/src/com/google/common/collect/ImmutableList.java#L225) factory methods (arguments cannot be null):

```java
List<String> il = ImmutableList.of("string", "elements");  // from varargs
List<String> il = ImmutableList.copyOf(aStringArray);      // from array
```

For mutable collections, you can use the [`Lists`](https://github.com/google/guava/blob/master/guava/src/com/google/common/collect/Lists.java) class and its [`newArrayList()`](https://github.com/google/guava/blob/master/guava/src/com/google/common/collect/Lists.java#L87) factory method:

```java
List<String> l1 = Lists.newArrayList(anotherListOrCollection);    // from collection
List<String> l2 = Lists.newArrayList(aStringArray);               // from array
List<String> l3 = Lists.newArrayList("or", "string", "elements"); // from varargs
```

5. Using Apache Commons Collections

```java
List<String> list = new ArrayList<String>();
CollectionUtils.addAll(list, str);
```

6. Using Java 9's `List.of()` method

```java
Integer[] array = {1, 2, 3};
List<Integer> list = List.of(array);
```
