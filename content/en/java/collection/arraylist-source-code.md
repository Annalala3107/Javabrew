---
title: ArrayList Source Code Analysis
description: "In-depth analysis of ArrayList source code: detailed explanation of ArrayList's underlying array structure, 1.5x resizing mechanism, RandomAccess fast random access, serialization implementation, and performance comparison with Vector."
category: Java
tag:
  - Java Collections
lang: en
sourceRef: zh-ref/java/collection/arraylist-source-code.md
head:
  - - meta
    - name: keywords
      content: ArrayList source code,ArrayList resizing mechanism,dynamic array,RandomAccess,ArrayList serialization,ArrayList vs Vector
---

## Introduction to ArrayList

The underlying implementation of `ArrayList` is an array-backed list, which is equivalent to a dynamic array. Compared with standard arrays in Java, its capacity can grow dynamically. Before adding a large number of elements, an application can increase the capacity of an `ArrayList` instance using the `ensureCapacity` operation. This can reduce the number of incremental reallocations.

`ArrayList` extends `AbstractList` and implements the `List`, `RandomAccess`, `Cloneable`, and `java.io.Serializable` interfaces.

```java

public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable{

  }
```

- `List`: Indicates that it is a list, supporting operations such as adding, removing, and searching, and can be accessed by index.
- `RandomAccess`: This is a marker interface indicating that a `List` collection implementing this interface supports **fast random access**. In `ArrayList`, we can quickly retrieve an element object by its index (ordinal position)—this is fast random access.
- `Cloneable`: Indicates that it supports copying via the `clone()` method; `ArrayList#clone()` returns a shallow copy.
- `Serializable`: Indicates that it can perform serialization operations—that is, an object can be converted into a byte stream for persistent storage or network transmission, which is very convenient.

![ArrayList Class Diagram](/media/jg/ext/oss.javaguide.cn/javaguide/java/collection/arraylist-class-diagram-1c1e5618.png)

### What Is the Difference Between ArrayList and Vector? (Good to Know)

- `ArrayList` is the primary implementation class of `List`. It uses `Object[]` for underlying storage, is suitable for frequent lookup operations, and is not thread-safe.
- `Vector` is a legacy implementation class of `List`. It uses `Object[]` for underlying storage and is thread-safe.

### Can ArrayList Add null Values?

`ArrayList` can store any type of object, including `null` values. However, adding `null` values to an `ArrayList` is not recommended: `null` values are meaningless and make code harder to maintain—for example, forgetting to perform a null check can result in a `NullPointerException`.

Example code:

```java
ArrayList<String> listOfStrings = new ArrayList<>();
listOfStrings.add(null);
listOfStrings.add("java");
System.out.println(listOfStrings);
```

Output:

```plain
[null, java]
```

### What Are the Differences Between ArrayList and LinkedList?

- **Thread safety:** Neither `ArrayList` nor `LinkedList` is synchronized, meaning neither guarantees thread safety.
- **Underlying data structure:** `ArrayList` uses an **`Object` array** under the hood; `LinkedList` uses a **doubly linked list** data structure (before JDK 1.6 it was a circular linked list, and JDK 1.7 removed the circularity. Note the difference between a doubly linked list and a doubly circular linked list, which is covered below!).
- **Whether insertion and deletion are affected by element position:**
  - `ArrayList` uses an array for storage, so the time complexity of inserting and removing elements is affected by the element's position. For example, when executing the `add(E e)` method, `ArrayList` appends the specified element to the end of the list by default, in which case the time complexity is O(1). However, if you want to insert or remove an element at a specified position `i` (`add(int index, E element)`), the time complexity is O(n), because during these operations the `i`-th element and the `(n-i)` elements after the `i`-th element in the collection must all shift one position backward or forward.
  - `LinkedList` uses a linked list for storage, so inserting or removing elements at the head or tail (`add(E e)`, `addFirst(E e)`, `addLast(E e)`, `removeFirst()`, `removeLast()`) is not affected by element position, and the time complexity is O(1). If you want to insert or remove an element at a specified position `i` (`add(int index, E element)`, `remove(Object o)`, `remove(int index)`), the time complexity is O(n), because it must first traverse to the specified position before inserting or deleting.
- **Whether fast random access is supported:** `LinkedList` does not support efficient random element access, whereas `ArrayList` (which implements the `RandomAccess` interface) does. Fast random access means quickly retrieving an element object by its ordinal index (corresponding to the `get(int index)` method).
- **Memory space usage:** `ArrayList`'s space waste is mainly reflected in reserving a certain amount of capacity at the end of the list, whereas `LinkedList`'s space cost is reflected in each element consuming more space than in `ArrayList` (because it has to store references to its immediate successor and immediate predecessor along with the data).

## Core ArrayList Source Code Walkthrough

Using JDK 1.8 as an example, let's analyze the underlying source code of `ArrayList`.

```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable {
    private static final long serialVersionUID = 8683452581122892189L;

    /**
     * Default initial capacity size
     */
    private static final int DEFAULT_CAPACITY = 10;

    /**
     * Empty array (used for empty instances).
     */
    private static final Object[] EMPTY_ELEMENTDATA = {};

    // Shared empty array instance used for default-sized empty instances.
    // We distinguish this from the EMPTY_ELEMENTDATA array to know how much to inflate when the first element is added.
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};

    /**
     * Array storing the elements of the ArrayList
     */
    transient Object[] elementData; // non-private to simplify nested class access

    /**
     * Number of elements contained in the ArrayList
     */
    private int size;

    /**
     * Constructor with an initial capacity parameter (users can specify the initial size of the collection when creating an ArrayList object)
     */
    public ArrayList(int initialCapacity) {
        if (initialCapacity > 0) {
            // If the passed argument is greater than 0, create an array of size initialCapacity
            this.elementData = new Object[initialCapacity];
        } else if (initialCapacity == 0) {
            // If the passed argument equals 0, create an empty array
            this.elementData = EMPTY_ELEMENTDATA;
        } else {
            // Otherwise, throw an exception
            throw new IllegalArgumentException("Illegal Capacity: " +
                    initialCapacity);
        }
    }

    /**
     * Default no-argument constructor
     * DEFAULTCAPACITY_EMPTY_ELEMENTDATA has size 0. Default capacity is 10, meaning it actually starts as an empty array and only expands to capacity 10 when the first element is added
     */
    public ArrayList() {
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
    }

    /**
     * Constructs a list containing the elements of the specified collection, in the order they are returned by the collection's iterator.
     */
    public ArrayList(Collection<? extends E> c) {
        // Convert the specified collection to an array
        elementData = c.toArray();
        // If the length of elementData is not 0
        if ((size = elementData.length) != 0) {
            // If elementData is not of Object[] type (c.toArray might not return an Object[] array, hence the check below)
            if (elementData.getClass() != Object[].class)
                // Copy the contents of the non-Object[] elementData array into a new Object[] elementData array
                elementData = Arrays.copyOf(elementData, size, Object[].class);
        } else {
            // Otherwise, replace with an empty array
            this.elementData = EMPTY_ELEMENTDATA;
        }
    }

    /**
     * Trims the capacity of this ArrayList instance to be the list's current size. An application can use this operation to minimize the storage of an ArrayList instance.
     */
    public void trimToSize() {
        modCount++;
        if (size < elementData.length) {
            elementData = (size == 0)
                    ? EMPTY_ELEMENTDATA
                    : Arrays.copyOf(elementData, size);
        }
    }
// Below is the resizing mechanism of ArrayList
// ArrayList's resizing mechanism improves performance; if it only expanded by one each time,
// frequent insertions would cause frequent copying and lower performance, and ArrayList's resizing mechanism avoids this situation.

    /**
     * Increases the capacity of this ArrayList instance, if necessary, to ensure that it can hold at least the specified number of elements
     *
     * @param minCapacity the desired minimum capacity
     */
    public void ensureCapacity(int minCapacity) {
        // If not the default empty array, minExpand is 0;
        // if it is the default empty array, minExpand is 10
        int minExpand = (elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA)
                // If not the default element table, any size can be used
                ? 0
                // If it is the default empty array, it should already be at the default size
                : DEFAULT_CAPACITY;

        // If the minimum capacity is greater than the existing expansion threshold
        if (minCapacity > minExpand) {
            // Ensure capacity is sufficient according to the required minimum capacity
            ensureExplicitCapacity(minCapacity);
        }
    }


    // Calculate the required capacity based on the given minimum capacity and current array elements.
    private static int calculateCapacity(Object[] elementData, int minCapacity) {
        // If the current array is the default empty array (initial state), return the larger of the default capacity and minCapacity as the required capacity
        if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
            return Math.max(DEFAULT_CAPACITY, minCapacity);
        }
        // Otherwise, directly return minCapacity
        return minCapacity;
    }

    // Ensure that the internal capacity reaches the specified minimum capacity.
    private void ensureCapacityInternal(int minCapacity) {
        ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
    }

    // Determine whether resizing is needed
    private void ensureExplicitCapacity(int minCapacity) {
        modCount++;
        // overflow-conscious code
        if (minCapacity - elementData.length > 0)
            // Call grow() to resize; calling this method means resizing has begun
            grow(minCapacity);
    }

    /**
     * Maximum array size to allocate
     */
    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

    /**
     * Core method for ArrayList resizing.
     */
    private void grow(int minCapacity) {
        // oldCapacity is the old capacity, newCapacity is the new capacity
        int oldCapacity = elementData.length;
        // Right-shifting oldCapacity by 1 bit is equivalent to oldCapacity / 2.
        // We know bitwise operations are much faster than integer division; the entire expression updates newCapacity to 1.5 times oldCapacity.
        int newCapacity = oldCapacity + (oldCapacity >> 1);
        // Then check whether newCapacity is greater than the minimum required capacity; if it is still less than minCapacity, use minCapacity as the new array capacity.
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;
        // Then check whether newCapacity exceeds the maximum capacity defined by ArrayList;
        // if exceeded, call hugeCapacity() to compare minCapacity and MAX_ARRAY_SIZE;
        // if minCapacity > MAX_ARRAY_SIZE, newCapacity is Integer.MAX_VALUE; otherwise, newCapacity is MAX_ARRAY_SIZE.
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
        // minCapacity is usually close to size, so this is a win:
        elementData = Arrays.copyOf(elementData, newCapacity);
    }

    // Compare minCapacity and MAX_ARRAY_SIZE
    private static int hugeCapacity(int minCapacity) {
        if (minCapacity < 0) // overflow
            throw new OutOfMemoryError();
        return (minCapacity > MAX_ARRAY_SIZE) ?
                Integer.MAX_VALUE :
                MAX_ARRAY_SIZE;
    }

    /**
     * Returns the number of elements in this list.
     */
    public int size() {
        return size;
    }

    /**
     * Returns true if this list contains no elements.
     */
    public boolean isEmpty() {
        // Note the difference between = and ==
        return size == 0;
    }

    /**
     * Returns true if this list contains the specified element.
     */
    public boolean contains(Object o) {
        // indexOf(): returns the index of the first occurrence of the specified element in this list, or -1 if this list does not contain the element
        return indexOf(o) >= 0;
    }

    /**
     * Returns the index of the first occurrence of the specified element in this list, or -1 if this list does not contain the element
     */
    public int indexOf(Object o) {
        if (o == null) {
            for (int i = 0; i < size; i++)
                if (elementData[i] == null)
                    return i;
        } else {
            for (int i = 0; i < size; i++)
                // Compare with equals()
                if (o.equals(elementData[i]))
                    return i;
        }
        return -1;
    }

    /**
     * Returns the index of the last occurrence of the specified element in this list, or -1 if this list does not contain the element.
     */
    public int lastIndexOf(Object o) {
        if (o == null) {
            for (int i = size - 1; i >= 0; i--)
                if (elementData[i] == null)
                    return i;
        } else {
            for (int i = size - 1; i >= 0; i--)
                if (o.equals(elementData[i]))
                    return i;
        }
        return -1;
    }

    /**
     * Returns a shallow copy of this ArrayList instance. (The elements themselves are not copied.)
     */
    public Object clone() {
        try {
            ArrayList<?> v = (ArrayList<?>) super.clone();
            // Arrays.copyOf copies the array and returns the copied array. Parameters are the source array and the copy length
            v.elementData = Arrays.copyOf(elementData, size);
            v.modCount = 0;
            return v;
        } catch (CloneNotSupportedException e) {
            // This shouldn't happen, since we are Cloneable
            throw new InternalError(e);
        }
    }

    /**
     * Returns an array containing all of the elements in this list in proper sequence (from first to last element).
     * The returned array will be "safe" in that no references to it are maintained by this list.
     * (In other words, this method must allocate a new array).
     * The caller is thus free to modify the returned array structure.
     * Note: If the elements are reference types, modifying the contents of an element will affect the object in the original list.
     * This method acts as a bridge between array-based and collection-based APIs.
     */
    public Object[] toArray() {
        return Arrays.copyOf(elementData, size);
    }

    /**
     * Returns an array containing all of the elements in this list in proper sequence (from first to last element);
     * the runtime type of the returned array is that of the specified array. If the list fits in the specified array, it is returned therein.
     * Otherwise, a new array is allocated with the runtime type of the specified array and the size of this list.
     * If the list fits in the specified array with room to spare (i.e., the array has more elements than the list), the element in the array immediately following the end of the collection is set to null.
     * (This is useful in determining the length of the list only if the caller knows that the list does not contain any null elements.)
     */
    @SuppressWarnings("unchecked")
    public <T> T[] toArray(T[] a) {
        if (a.length < size)
            // Create a new array of the runtime type, containing the contents of the ArrayList array
            return (T[]) Arrays.copyOf(elementData, size, a.getClass());
        // Call System.arraycopy() to copy between arrays
        System.arraycopy(elementData, 0, a, 0, size);
        if (a.length > size)
            a[size] = null;
        return a;
    }

    // Positional Access Operations

    @SuppressWarnings("unchecked")
    E elementData(int index) {
        return (E) elementData[index];
    }

    /**
     * Returns the element at the specified position in this list.
     */
    public E get(int index) {
        rangeCheck(index);

        return elementData(index);
    }

    /**
     * Replaces the element at the specified position in this list with the specified element.
     */
    public E set(int index, E element) {
        // Perform bounds check on index
        rangeCheck(index);

        E oldValue = elementData(index);
        elementData[index] = element;
        // Return the element previously at this position
        return oldValue;
    }

    /**
     * Appends the specified element to the end of this list.
     */
    public boolean add(E e) {
        ensureCapacityInternal(size + 1);  // Increments modCount!!
        // Here we see that adding an element to ArrayList is essentially assigning a value into the array
        elementData[size++] = e;
        return true;
    }

    /**
     * Inserts the specified element at the specified position in this list.
     * First calls rangeCheckForAdd to check index bounds; then calls ensureCapacityInternal to ensure capacity is large enough;
     * then shifts all members starting from index one position to the right; inserts element at index; finally increments size by 1.
     */
    public void add(int index, E element) {
        rangeCheckForAdd(index);

        ensureCapacityInternal(size + 1);  // Increments modCount!!
        // Be sure to examine arraycopy() for copying arrays; below it is used to copy an array onto itself
        System.arraycopy(elementData, index, elementData, index + 1,
                size - index);
        elementData[index] = element;
        size++;
    }

    /**
     * Removes the element at the specified position in this list. Shifts any subsequent elements to the left (subtracts one from their indices).
     */
    public E remove(int index) {
        rangeCheck(index);

        modCount++;
        E oldValue = elementData(index);

        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index + 1, elementData, index,
                    numMoved);
        elementData[--size] = null; // clear to let GC do its work
        // Element removed from the list
        return oldValue;
    }

    /**
     * Removes the first occurrence of the specified element from this list, if it is present. If the list does not contain the element, it is unchanged.
     * Returns true if this list contained the specified element
     */
    public boolean remove(Object o) {
        if (o == null) {
            for (int index = 0; index < size; index++)
                if (elementData[index] == null) {
                    fastRemove(index);
                    return true;
                }
        } else {
            for (int index = 0; index < size; index++)
                if (o.equals(elementData[index])) {
                    fastRemove(index);
                    return true;
                }
        }
        return false;
    }

    /*
     * Private remove method that skips bounds checking and does not return the value removed.
     */
    private void fastRemove(int index) {
        modCount++;
        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index + 1, elementData, index,
                    numMoved);
        elementData[--size] = null; // After removing the element, set this slot to null so the garbage collector (GC) can reclaim it.
    }

    /**
     * Removes all of the elements from this list.
     */
    public void clear() {
        modCount++;

        // Set all elements in the array to null
        for (int i = 0; i < size; i++)
            elementData[i] = null;

        size = 0;
    }

    /**
     * Appends all of the elements in the specified collection to the end of this list, in the order that they are returned by the specified collection's Iterator.
     */
    public boolean addAll(Collection<? extends E> c) {
        Object[] a = c.toArray();
        int numNew = a.length;
        ensureCapacityInternal(size + numNew);  // Increments modCount
        System.arraycopy(a, 0, elementData, size, numNew);
        size += numNew;
        return numNew != 0;
    }

    /**
     * Inserts all of the elements in the specified collection into this list, starting at the specified position.
     */
    public boolean addAll(int index, Collection<? extends E> c) {
        rangeCheckForAdd(index);

        Object[] a = c.toArray();
        int numNew = a.length;
        ensureCapacityInternal(size + numNew);  // Increments modCount

        int numMoved = size - index;
        if (numMoved > 0)
            System.arraycopy(elementData, index, elementData, index + numNew,
                    numMoved);

        System.arraycopy(a, 0, elementData, index, numNew);
        size += numNew;
        return numNew != 0;
    }

    /**
     * Removes from this list all of the elements whose index is between fromIndex, inclusive, and toIndex, exclusive.
     * Shifts any succeeding elements to the left (reduces their index).
     */
    protected void removeRange(int fromIndex, int toIndex) {
        modCount++;
        int numMoved = size - toIndex;
        System.arraycopy(elementData, toIndex, elementData, fromIndex,
                numMoved);

        // clear to let GC do its work
        int newSize = size - (toIndex - fromIndex);
        for (int i = newSize; i < size; i++) {
            elementData[i] = null;
        }
        size = newSize;
    }

    /**
     * Checks if the given index is in range.
     */
    private void rangeCheck(int index) {
        if (index >= size)
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }

    /**
     * A version of rangeCheck used by add and addAll
     */
    private void rangeCheckForAdd(int index) {
        if (index > size || index < 0)
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }

    /**
     * Returns IndexOutOfBoundsException detail message
     */
    private String outOfBoundsMsg(int index) {
        return "Index: " + index + ", Size: " + size;
    }

    /**
     * Removes from this list all of its elements that are contained in the specified collection.
     */
    public boolean removeAll(Collection<?> c) {
        Objects.requireNonNull(c);
        // Return true if this list was modified
        return batchRemove(c, false);
    }

    /**
     * Retains only the elements in this list that are contained in the specified collection.
     * In other words, removes from this list all of its elements that are not contained in the specified collection.
     */
    public boolean retainAll(Collection<?> c) {
        Objects.requireNonNull(c);
        return batchRemove(c, true);
    }


    /**
     * Returns a list iterator over the elements in this list (in proper sequence), starting at the specified position in the list.
     * The specified index indicates the first element that would be returned by an initial call to next. An initial call to previous would return the element with the specified index minus one.
     * The returned list iterator is fail-fast.
     */
    public ListIterator<E> listIterator(int index) {
        if (index < 0 || index > size)
            throw new IndexOutOfBoundsException("Index: " + index);
        return new ListItr(index);
    }

    /**
     * Returns a list iterator over the elements in this list (in proper sequence).
     * The returned list iterator is fail-fast.
     */
    public ListIterator<E> listIterator() {
        return new ListItr(0);
    }

    /**
     * Returns an iterator over the elements in this list in proper sequence.
     * The returned iterator is fail-fast.
     */
    public Iterator<E> iterator() {
        return new Itr();
    }
```

## Analysis of the ArrayList Resizing Mechanism

### Starting with the ArrayList Constructors

`ArrayList` can be initialized in three ways. The constructor source code is as follows (JDK 8):

```java
/**
 * Default initial capacity size
 */
private static final int DEFAULT_CAPACITY = 10;

private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};

/**
 * Default constructor, constructs an empty list with an initial capacity of 10 (no-argument constructor)
 */
public ArrayList() {
    this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
}

/**
 * Constructor with an initial capacity parameter (capacity specified by the user)
 */
public ArrayList(int initialCapacity) {
    if (initialCapacity > 0) {// Initial capacity greater than 0
        // Create an array of size initialCapacity
        this.elementData = new Object[initialCapacity];
    } else if (initialCapacity == 0) {// Initial capacity equal to 0
        // Create an empty array
        this.elementData = EMPTY_ELEMENTDATA;
    } else {// Initial capacity less than 0, throw an exception
        throw new IllegalArgumentException("Illegal Capacity: " + initialCapacity);
    }
}


/**
 * Constructs a list containing the elements of the specified collection, in the order they are returned by the collection's iterator
 * If the specified collection is null, throws NullPointerException.
 */
public ArrayList(Collection<? extends E> c) {
    elementData = c.toArray();
    if ((size = elementData.length) != 0) {
        // c.toArray might (incorrectly) not return Object[] (see 6260652)
        if (elementData.getClass() != Object[].class)
            elementData = Arrays.copyOf(elementData, size, Object[].class);
    } else {
        // replace with empty array.
        this.elementData = EMPTY_ELEMENTDATA;
    }
}
```

Careful readers will notice: **when creating an `ArrayList` using the no-argument constructor, what is actually assigned at initialization is an empty array. Capacity is only truly allocated when an operation to add elements to the array is performed—that is, when the first element is added to the array, the array capacity expands to 10.** We will discuss this point below when analyzing `ArrayList` resizing!

> Note: In JDK 6, calling `new ArrayList()` with the no-argument constructor directly created an `Object[]` array `elementData` of length 10.

### Step-by-Step Analysis of the ArrayList Resizing Mechanism

Here we take an `ArrayList` created by the no-argument constructor as an example.

#### The add Method

```java
/**
* Appends the specified element to the end of this list.
*/
public boolean add(E e) {
    // Before adding the element, call the ensureCapacityInternal method
    ensureCapacityInternal(size + 1);  // Increments modCount!!
    // Here we see that adding an element to ArrayList is essentially assigning a value into the array
    elementData[size++] = e;
    return true;
}
```

**Note**: JDK 11 removed the `ensureCapacityInternal()` and `ensureExplicitCapacity()` methods.

The source code of `ensureCapacityInternal` is as follows:

```java
// Calculate the required capacity based on the given minimum capacity and current array elements.
private static int calculateCapacity(Object[] elementData, int minCapacity) {
    // If the current array is the default empty array (initial state), return the larger of the default capacity and minCapacity as the required capacity
    if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
        return Math.max(DEFAULT_CAPACITY, minCapacity);
    }
    // Otherwise, directly return minCapacity
    return minCapacity;
}

// Ensure that the internal capacity reaches the specified minimum capacity.
private void ensureCapacityInternal(int minCapacity) {
    ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
}
```

The `ensureCapacityInternal` method is very simple; internally it directly calls the `ensureExplicitCapacity` method:

```java
// Determine whether resizing is needed
private void ensureExplicitCapacity(int minCapacity) {
    modCount++;
    // Check whether the current array capacity is sufficient to store minCapacity elements
    if (minCapacity - elementData.length > 0)
        // Call grow() to resize
        grow(minCapacity);
}
```

Let's analyze this carefully:

- When we `add` the 1st element to `ArrayList`, `elementData.length` is 0 (because it is still an empty list). Because `ensureCapacityInternal()` is executed, `minCapacity` becomes 10. At this point, `minCapacity - elementData.length > 0` holds, so it enters the `grow(minCapacity)` method.
- When we `add` the 2nd element, `minCapacity` is 2, while `elementData.length` (the capacity) was already expanded to `10` after adding the first element. At this point, `minCapacity - elementData.length > 0` does not hold, so it does not enter (execute) `grow(minCapacity)`.
- When adding the 3rd, 4th, ..., up to the 10th element, the `grow` method is still not executed, and the array capacity remains 10.

Not until adding the 11th element is `minCapacity` (11) greater than `elementData.length` (10), entering the `grow` method to resize.

#### The grow Method

```java
/**
 * Maximum array size to allocate
 */
private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

/**
 * Core method for ArrayList resizing.
 */
private void grow(int minCapacity) {
    // oldCapacity is the old capacity, newCapacity is the new capacity
    int oldCapacity = elementData.length;
    // Right-shifting oldCapacity by 1 bit is equivalent to oldCapacity / 2.
    // We know bitwise operations are much faster than integer division; the entire expression updates newCapacity to 1.5 times oldCapacity.
    int newCapacity = oldCapacity + (oldCapacity >> 1);

    // Then check whether newCapacity is greater than the minimum required capacity; if it is still less than minCapacity, use minCapacity as the new array capacity.
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;

    // If newCapacity > MAX_ARRAY_SIZE, enter (execute) hugeCapacity() to compare minCapacity and MAX_ARRAY_SIZE;
    // if minCapacity > max capacity, newCapacity is Integer.MAX_VALUE; otherwise, newCapacity is MAX_ARRAY_SIZE, i.e., Integer.MAX_VALUE - 8.
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);

    // minCapacity is usually close to size, so this is a win:
    elementData = Arrays.copyOf(elementData, newCapacity);
}
```

**`int newCapacity = oldCapacity + (oldCapacity >> 1)`, so after each resize, the capacity of `ArrayList` becomes roughly 1.5 times the original capacity (exact 1.5x when `oldCapacity` is even, and approximately 1.5x otherwise)!** Even and odd numbers behave differently—for example, `10 + 10 / 2 = 15`, and `33 + 33 / 2 = 49`. If it is an odd number, the fractional part is discarded.

> `>>` (shift operator): `>> 1` shifts right by 1 bit, which is equivalent to dividing by 2; shifting right by `n` bits is equivalent to dividing by 2 to the power of `n`. Here `oldCapacity` is shifted right by 1 bit, so it is equivalent to `oldCapacity / 2`. For binary arithmetic on large numbers, bitwise shift operators are much faster than ordinary arithmetic operators because the program simply shifts bits without performing calculation, which improves efficiency and saves resources.

**Let's explore the `grow()` method further through an example:**

- When adding the 1st element, `oldCapacity` is 0. After comparison, the first `if` check holds, so `newCapacity = minCapacity` (which is 10). However, the second `if` check does not hold—that is, `newCapacity` is not larger than `MAX_ARRAY_SIZE`—so it does not enter `hugeCapacity`. The array capacity becomes 10, `add` returns `true`, and `size` increments to 1.
- When adding the 11th element and entering `grow`, `newCapacity` is 15, which is larger than `minCapacity` (11), so the first `if` check does not hold. The new capacity is not larger than the maximum array size, so it does not enter `hugeCapacity`. The array capacity expands to 15, `add` returns `true`, and `size` increments to 11.
- And so on...

**Here is an important point that is often overlooked:**

- The `length` field in Java applies to arrays—for instance, if you declare an array and want to know its length, you use the `length` field.
- The `length()` method in Java applies to strings—if you want to check the length of a string, you use the `length()` method.
- The `size()` method in Java applies to generic collections—if you want to see how many elements a generic collection has, you call this method!

#### The hugeCapacity() Method

From the `grow()` source code above, we know that if the new capacity is greater than `MAX_ARRAY_SIZE`, it enters (executes) `hugeCapacity()` to compare `minCapacity` and `MAX_ARRAY_SIZE`. If `minCapacity` is greater than `MAX_ARRAY_SIZE`, the new capacity becomes `Integer.MAX_VALUE`; otherwise, the new capacity is `MAX_ARRAY_SIZE`, which is `Integer.MAX_VALUE - 8`.

```java
private static int hugeCapacity(int minCapacity) {
    if (minCapacity < 0) // overflow
        throw new OutOfMemoryError();
    // Compare minCapacity and MAX_ARRAY_SIZE
    // If minCapacity is larger, use Integer.MAX_VALUE as the new array size
    // If MAX_ARRAY_SIZE is larger, use MAX_ARRAY_SIZE as the new array size
    // MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;
    return (minCapacity > MAX_ARRAY_SIZE) ?
        Integer.MAX_VALUE :
        MAX_ARRAY_SIZE;
}
```

### The `System.arraycopy()` and `Arrays.copyOf()` Methods

When reading the source code, we find that `ArrayList` calls these two methods extensively. For example, both the resizing operation discussed above and methods like `add(int index, E element)` and `toArray()` use them!

#### The `System.arraycopy()` Method

Source code:

```java
    // We see that arraycopy is a native method; below we explain the meaning of each parameter
    /**
    *   Copy array
    * @param src source array
    * @param srcPos starting position in the source array
    * @param dest destination array
    * @param destPos starting position in the destination array
    * @param length number of array elements to copy
    */
    public static native void arraycopy(Object src,  int  srcPos,
                                        Object dest, int destPos,
                                        int length);
```

Usage scenario:

```java
    /**
     * Inserts the specified element at the specified position in this list.
     * First calls rangeCheckForAdd to check index bounds; then calls ensureCapacityInternal to ensure capacity is large enough;
     * then shifts all members starting from index one position to the right; inserts element at index; finally increments size by 1.
     */
    public void add(int index, E element) {
        rangeCheckForAdd(index);

        ensureCapacityInternal(size + 1);  // Increments modCount!!
        // arraycopy() copies an array onto itself
        // elementData: source array; index: starting position in source array; elementData: destination array; index + 1: starting position in destination array; size - index: number of array elements to copy
        System.arraycopy(elementData, index, elementData, index + 1, size - index);
        elementData[index] = element;
        size++;
    }
```

Let's write a simple method to test this:

```java
public class ArraycopyTest {

  public static void main(String[] args) {
    // TODO Auto-generated method stub
    int[] a = new int[10];
    a[0] = 0;
    a[1] = 1;
    a[2] = 2;
    a[3] = 3;
    System.arraycopy(a, 2, a, 3, 3);
    a[2]=99;
    for (int i = 0; i < a.length; i++) {
      System.out.print(a[i] + " ");
    }
  }

}
```

Output:

```plain
0 1 99 2 3 0 0 0 0 0
```

#### The `Arrays.copyOf()` Method

Source code:

```java
    public static int[] copyOf(int[] original, int newLength) {
      // Allocate a new array
        int[] copy = new int[newLength];
  // Call System.arraycopy to copy data from the source array and return the new array
        System.arraycopy(original, 0, copy, 0,
                         Math.min(original.length, newLength));
        return copy;
    }
```

Usage scenario:

```java
   /**
     Returns an array containing all of the elements in this list in proper sequence (from first to last element); the runtime type of the returned array is that of the specified array.
     */
    public Object[] toArray() {
    // elementData: array to copy; size: length to copy
        return Arrays.copyOf(elementData, size);
    }
```

Personally, I think the `Arrays.copyOf()` method is mainly used to resize an existing array. The test code is as follows:

```java
public class ArrayscopyOfTest {

  public static void main(String[] args) {
    int[] a = new int[3];
    a[0] = 0;
    a[1] = 1;
    a[2] = 2;
    int[] b = Arrays.copyOf(a, 10);
    System.out.println("b.length"+b.length);
  }
}
```

Output:

```plain
10
```

#### Connection and Differences Between the Two

**Connection:**

Looking at the source code of both, you can see that `copyOf()` internally calls `System.arraycopy()`.

**Difference:**

`arraycopy()` requires a destination array—it copies the source array into an array you defined yourself or back into the source array, and allows you to specify the starting position and length to copy as well as the starting position in the destination array; `copyOf()` automatically creates a new array internally and returns that array.

### The `ensureCapacity` Method

I wonder if you noticed there is an `ensureCapacity` method in the `ArrayList` source code. This method is never called internally by `ArrayList`, so it is clearly provided for users to invoke. What is the purpose of this method?

```java
    /**
     Increases the capacity of this ArrayList instance, if necessary, to ensure that it can hold at least the number of elements specified by the minimum capacity argument.
     *
     * @param   minCapacity   the desired minimum capacity
     */
    public void ensureCapacity(int minCapacity) {
        int minExpand = (elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA)
            // any size if not default element table
            ? 0
            // larger than default for default empty table. It's already
            // supposed to be at default size.
            : DEFAULT_CAPACITY;

        if (minCapacity > minExpand) {
            ensureExplicitCapacity(minCapacity);
        }
    }

```

In theory, it is best to use the `ensureCapacity` method before adding a large number of elements to an `ArrayList` in order to reduce the number of incremental reallocations.

Let's test the effect of this method with the code below:

```java
public class EnsureCapacityTest {
  public static void main(String[] args) {
    ArrayList<Object> list = new ArrayList<Object>();
    final int N = 10000000;
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < N; i++) {
      list.add(i);
    }
    long endTime = System.currentTimeMillis();
    System.out.println("使用ensureCapacity方法前："+(endTime - startTime));

  }
}
```

Execution output:

```plain
使用ensureCapacity方法前：2158
```

```java
public class EnsureCapacityTest {
    public static void main(String[] args) {
        ArrayList<Object> list = new ArrayList<Object>();
        final int N = 10000000;
        long startTime1 = System.currentTimeMillis();
        list.ensureCapacity(N);
        for (int i = 0; i < N; i++) {
            list.add(i);
        }
        long endTime1 = System.currentTimeMillis();
        System.out.println("使用ensureCapacity方法后："+(endTime1 - startTime1));
    }
}
```

Execution output:

```plain
使用ensureCapacity方法后：1773
```

From the execution results, we can see that using the `ensureCapacity` method before adding a large number of elements to an `ArrayList` can improve performance. However, this performance difference is almost negligible. Moreover, in real-world projects you would virtually never add this many elements into an `ArrayList`.
