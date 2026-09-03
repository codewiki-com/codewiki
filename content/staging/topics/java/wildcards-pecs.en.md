---
title: Java Wildcards and PECS Principle
description: "A comprehensive guide to understanding Java generic wildcards: unbounded, upper-bounded, and lower-bounded wildcards with the PECS principle"
track: java
section: oop-generics
difficulty: intermediate
tags:
  - Java
  - Generics
  - Wildcards
  - PECS
  - Type System
status: imported
origin: old/src/content/docs/java/wildcards-pecs.en.md
divergence: 0.21
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: java
  subcategory: ""
  order: 4
  lastUpdated: 2026-01-07
---

Wildcards are among the most powerful yet confusing features in Java generics. We analyze three wildcard types and their underlying principles in depth, along with the PECS principle to guide you in making correct choices in real-world development.

## Concept Overview

### What Are Wildcards

Wildcards are represented by a question mark `?` and denote an unknown type. They are primarily used when declaring variables, parameters, or return types, especially when the concrete type is uncertain or flexibility is needed.

```java
// Without wildcards: can only accept List<Object>
public void printList(List<Object> list) {
    for (Object obj : list) {
        System.out.println(obj);
    }
}

// List<String> is NOT a subtype of List<Object>!
List<String> strings = Arrays.asList("Hello", "World");
// printList(strings);  // Compilation error!

// Using wildcards: can accept List of any type
public void printList(List<?> list) {
    for (Object obj : list) {
        System.out.println(obj);
    }
}

printList(strings);  // Now it works correctly
```

### Why Wildcards Are Needed

Java generics are invariant, meaning `List<String>` is not a subtype of `List<Object>`, even though `String` is a subtype of `Object`. This design ensures type safety but creates flexibility issues.

```java
// Generic invariance example
List<String> strings = new ArrayList<>();
// List<Object> objects = strings;  // Compilation error!

// If allowed, it would cause type safety issues:
// objects.add(123);  // Add Integer
// String s = strings.get(0);  // ClassCastException!
```

Wildcards solve this problem by allowing us to write more flexible code while maintaining type safety.

### Overview of Three Wildcard Types

| Wildcard Type | Syntax | Meaning | Read Ability | Write Ability |
|---------------|--------|---------|--------------|---------------|
| Unbounded | `?` | Any type | Can only read as Object | Can only write null |
| Upper-bounded | `? extends T` | T or its subclasses | Can read as T | Can only write null |
| Lower-bounded | `? super T` | T or its superclasses | Can only read as Object | Can write T and its subclasses |

## Core Principles

### Type Erasure and Wildcards

To understand how wildcards work, you must first understand Java's type erasure mechanism.

```java
// Before compilation
public void process(List<? extends Number> list) {
    for (Number n : list) {
        System.out.println(n.doubleValue());
    }
}

// After compilation (type erasure)
public void process(List list) {
    for (Object n : list) {
        System.out.println(((Number) n).doubleValue());
    }
}
```

The compiler inserts necessary type checks and casts after type erasure to ensure runtime type safety.

### Covariance, Contravariance, and Invariance

Understanding these three concepts is key to mastering wildcards:

**Invariance**: `List<String>` and `List<Object>` have no subtype relationship.

```java
List<String> strings = new ArrayList<>();
List<Object> objects = strings;  // Compilation error: invariance
```

**Covariance**: Implemented using `? extends T`, preserving subtype relationships.

```java
List<? extends Number> numbers;
numbers = new ArrayList<Integer>();   // Integer extends Number
numbers = new ArrayList<Double>();    // Double extends Number
// Covariance: List<Integer> is a subtype of List<? extends Number>
```

**Contravariance**: Implemented using `? super T`, reversing subtype relationships.

```java
List<? super Integer> list;
list = new ArrayList<Integer>();  // Integer
list = new ArrayList<Number>();   // Number super Integer
list = new ArrayList<Object>();   // Object super Integer
// Contravariance: List<Object> is a subtype of List<? super Integer>
```

### Wildcard Capture

The compiler sometimes needs to "capture" the unknown type represented by a wildcard:

```java
public static void swap(List<?> list, int i, int j) {
    // Direct manipulation will cause errors
    // Object temp = list.get(i);
    // list.set(i, list.get(j));  // Compilation error!
    // list.set(j, temp);

    // Use helper method to capture wildcard
    swapHelper(list, i, j);
}

// Helper method captures wildcard type
private static <T> void swapHelper(List<T> list, int i, int j) {
    T temp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, temp);
}
```

## Key Points

### Unbounded Wildcard `?`

The unbounded wildcard represents any unknown type and is suitable for these scenarios:

1. **Only Need Object Methods**

```java
public static void printList(List<?> list) {
    for (Object obj : list) {
        System.out.println(obj);  // Calls Object.toString()
    }
}
```

2. **Type Parameter-Independent Operations**

```java
public static int getSize(List<?> list) {
    return list.size();  // size() doesn't depend on element type
}

public static boolean isEmpty(Collection<?> collection) {
    return collection.isEmpty();
}
```

3. **Using Class<?> to Represent Any Type**

```java
public static void printClassName(Class<?> clazz) {
    System.out.println(clazz.getName());
}

printClassName(String.class);
printClassName(Integer.class);
```

**Limitations of Unbounded Wildcards**

```java
List<?> list = new ArrayList<String>();

// Read: can only read as Object
Object obj = list.get(0);  // Correct
// String str = list.get(0);  // Compilation error

// Write: can only write null
list.add(null);  // Correct
// list.add("Hello");  // Compilation error
// list.add(new Object());  // Compilation error
```

### Upper-Bounded Wildcard `? extends T`

The upper-bounded wildcard represents T or any of its subclasses, primarily used for reading data from collections.

```java
// Can accept List<Number>, List<Integer>, List<Double>, etc.
public static double sum(List<? extends Number> numbers) {
    double total = 0;
    for (Number num : numbers) {
        total += num.doubleValue();
    }
    return total;
}

// Usage examples
List<Integer> integers = Arrays.asList(1, 2, 3);
List<Double> doubles = Arrays.asList(1.5, 2.5, 3.5);
List<BigDecimal> bigDecimals = Arrays.asList(
    new BigDecimal("1.1"),
    new BigDecimal("2.2")
);

System.out.println(sum(integers));     // 6.0
System.out.println(sum(doubles));      // 7.5
System.out.println(sum(bigDecimals));  // 3.3
```

**Why Writing Is Not Allowed**

```java
List<? extends Number> numbers = new ArrayList<Integer>();

// Read: can read as Number
Number num = numbers.get(0);  // Correct

// Write: compiler doesn't know the concrete type, so prevents writing
// numbers.add(new Integer(1));  // Compilation error
// numbers.add(new Double(1.0)); // Compilation error
// numbers.add(new Number() {}); // Compilation error
numbers.add(null);  // Only null is allowed
```

Imagine: if `List<? extends Number>` actually points to `List<Integer>`, and you try to add `Double`, it would break type safety.

### Lower-Bounded Wildcard `? super T`

The lower-bounded wildcard represents T or any of its superclasses, primarily used for writing data to collections.

```java
// Can accept List<Integer>, List<Number>, List<Object>
public static void addIntegers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
    list.add(3);
}

// Usage examples
List<Integer> integers = new ArrayList<>();
List<Number> numbers = new ArrayList<>();
List<Object> objects = new ArrayList<>();

addIntegers(integers);  // Correct
addIntegers(numbers);   // Correct
addIntegers(objects);   // Correct
```

**Why Only T and Its Subclasses Can Be Written**

```java
List<? super Integer> list = new ArrayList<Number>();

// Write: can safely add Integer and its subclasses
list.add(1);                    // Integer - Correct
list.add(Integer.valueOf(2));   // Integer - Correct
// list.add(1.0);              // Double - Compilation error
// list.add(new Number() {});  // Number - Compilation error

// Read: can only read as Object
Object obj = list.get(0);  // Correct
// Integer i = list.get(0); // Compilation error
// Number n = list.get(0);  // Compilation error
```

### PECS Principle Explained

**PECS** stands for "**P**roducer **E**xtends, **C**onsumer **S**uper", introduced by Joshua Bloch in "Effective Java".

- **Producer (reads from collection)**: Use `? extends T`
- **Consumer (writes to collection)**: Use `? super T`

```java
// Collections.copy is a classic example of PECS
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (int i = 0; i < src.size(); i++) {
        T element = src.get(i);   // src is producer, reads data
        dest.set(i, element);     // dest is consumer, writes data
    }
}

// Usage example
List<Integer> src = Arrays.asList(1, 2, 3);
List<Number> dest = new ArrayList<>(Arrays.asList(0.0, 0.0, 0.0));
Collections.copy(dest, src);  // Copy from Integer list to Number list
```

## Code Examples

### Example 1: Implementing a Generic Stack

```java
import java.util.*;

public class GenericStack<E> {
    private final List<E> elements = new ArrayList<>();

    public void push(E element) {
        elements.add(element);
    }

    public E pop() {
        if (elements.isEmpty()) {
            throw new EmptyStackException();
        }
        return elements.remove(elements.size() - 1);
    }

    public E peek() {
        if (elements.isEmpty()) {
            throw new EmptyStackException();
        }
        return elements.get(elements.size() - 1);
    }

    public boolean isEmpty() {
        return elements.isEmpty();
    }

    public int size() {
        return elements.size();
    }

    /**
     * Bulk push elements from Iterable
     * Use extends: src is producer (reads data)
     */
    public void pushAll(Iterable<? extends E> src) {
        for (E element : src) {
            push(element);
        }
    }

    /**
     * Bulk pop elements to Collection
     * Use super: dst is consumer (writes data)
     */
    public void popAll(Collection<? super E> dst) {
        while (!isEmpty()) {
            dst.add(pop());
        }
    }
}

// Usage example
public class StackDemo {
    public static void main(String[] args) {
        GenericStack<Number> numberStack = new GenericStack<>();

        // pushAll uses extends, can accept Integer list
        List<Integer> integers = Arrays.asList(1, 2, 3);
        numberStack.pushAll(integers);

        // Also can accept Double list
        List<Double> doubles = Arrays.asList(4.0, 5.0);
        numberStack.pushAll(doubles);

        // popAll uses super, can pop to Object list
        List<Object> result = new ArrayList<>();
        numberStack.popAll(result);

        System.out.println(result);  // [5.0, 4.0, 3, 2, 1]
    }
}
```

### Example 2: Implementing Generic Collection Utility Methods

```java
import java.util.*;
import java.util.function.Predicate;

public class CollectionUtils {

    /**
     * Find maximum value in collection
     * Use recursive type bound to ensure elements are comparable
     */
    public static <T extends Comparable<? super T>> T max(Collection<? extends T> collection) {
        if (collection.isEmpty()) {
            throw new NoSuchElementException("Collection is empty");
        }

        Iterator<? extends T> iterator = collection.iterator();
        T max = iterator.next();

        while (iterator.hasNext()) {
            T current = iterator.next();
            if (current.compareTo(max) > 0) {
                max = current;
            }
        }

        return max;
    }

    /**
     * Copy elements matching condition
     * src: producer (read) → extends
     * dest: consumer (write) → super
     */
    public static <T> void copyIf(
            Collection<? extends T> src,
            Collection<? super T> dest,
            Predicate<? super T> predicate) {
        for (T element : src) {
            if (predicate.test(element)) {
                dest.add(element);
            }
        }
    }

    /**
     * Merge multiple collections
     * sources: each source is a producer
     */
    @SafeVarargs
    public static <T> List<T> merge(Collection<? extends T>... sources) {
        List<T> result = new ArrayList<>();
        for (Collection<? extends T> source : sources) {
            result.addAll(source);
        }
        return result;
    }

    /**
     * Calculate intersection of two sets
     */
    public static <T> Set<T> intersection(
            Set<? extends T> set1,
            Set<? extends T> set2) {
        Set<T> result = new HashSet<>();
        for (T element : set1) {
            if (set2.contains(element)) {
                result.add(element);
            }
        }
        return result;
    }
}

// Usage example
public class UtilsDemo {
    public static void main(String[] args) {
        // max example
        List<Integer> numbers = Arrays.asList(3, 1, 4, 1, 5, 9, 2, 6);
        Integer max = CollectionUtils.max(numbers);
        System.out.println("Max: " + max);  // Max: 9

        // copyIf example
        List<Integer> source = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        List<Number> evens = new ArrayList<>();
        CollectionUtils.copyIf(source, evens, n -> n % 2 == 0);
        System.out.println("Evens: " + evens);  // Evens: [2, 4, 6, 8, 10]

        // merge example
        List<Integer> list1 = Arrays.asList(1, 2, 3);
        List<Integer> list2 = Arrays.asList(4, 5, 6);
        List<Number> merged = CollectionUtils.merge(list1, list2);
        System.out.println("Merged: " + merged);  // Merged: [1, 2, 3, 4, 5, 6]
    }
}
```

### Example 3: Implementing a Type-Safe Heterogeneous Container

```java
import java.util.*;

/**
 * Type-safe heterogeneous container
 * Can store objects of different types while maintaining type safety
 */
public class TypeSafeContainer {
    private final Map<Class<?>, Object> container = new HashMap<>();

    /**
     * Store value of specified type
     */
    public <T> void put(Class<T> type, T instance) {
        container.put(Objects.requireNonNull(type), instance);
    }

    /**
     * Get value of specified type
     */
    public <T> T get(Class<T> type) {
        return type.cast(container.get(type));
    }

    /**
     * Store value supporting subtypes
     * Use extends to allow passing subclasses
     */
    public <T> void putWithSubtype(Class<T> type, T instance) {
        container.put(Objects.requireNonNull(type), instance);
    }

    /**
     * Get value that might be supertype
     * Use super to allow value to be viewed as supertype
     */
    @SuppressWarnings("unchecked")
    public <T> T getAsType(Class<? super T> type, Class<T> actualType) {
        Object value = container.get(type);
        return actualType.cast(value);
    }
}

// Usage example
public class ContainerDemo {
    public static void main(String[] args) {
        TypeSafeContainer container = new TypeSafeContainer();

        // Store values of different types
        container.put(String.class, "Hello");
        container.put(Integer.class, 42);
        container.put(List.class, Arrays.asList(1, 2, 3));

        // Get values type-safely
        String str = container.get(String.class);
        Integer num = container.get(Integer.class);
        List<?> list = container.get(List.class);

        System.out.println(str);   // Hello
        System.out.println(num);   // 42
        System.out.println(list);  // [1, 2, 3]
    }
}
```

### Example 4: Implementing a Comparator Factory

```java
import java.util.*;
import java.util.function.Function;

public class ComparatorFactory {

    /**
     * Create a comparator supporting comparison of supertypes
     * Comparator<? super T> can compare T and its subclasses
     */
    public static <T, U extends Comparable<? super U>> Comparator<T> comparing(
            Function<? super T, ? extends U> keyExtractor) {
        return (o1, o2) -> {
            U key1 = keyExtractor.apply(o1);
            U key2 = keyExtractor.apply(o2);
            return key1.compareTo(key2);
        };
    }

    /**
     * Compose multiple comparators
     * Use super so comparators can compare subtypes
     */
    @SafeVarargs
    public static <T> Comparator<T> compose(Comparator<? super T>... comparators) {
        return (o1, o2) -> {
            for (Comparator<? super T> comparator : comparators) {
                int result = comparator.compare(o1, o2);
                if (result != 0) {
                    return result;
                }
            }
            return 0;
        };
    }

    /**
     * Reverse comparator
     */
    public static <T> Comparator<T> reverse(Comparator<? super T> comparator) {
        return (o1, o2) -> comparator.compare(o2, o1);
    }

    /**
     * Null-safe comparator
     */
    public static <T> Comparator<T> nullsFirst(Comparator<? super T> comparator) {
        return (o1, o2) -> {
            if (o1 == null && o2 == null) return 0;
            if (o1 == null) return -1;
            if (o2 == null) return 1;
            return comparator.compare(o1, o2);
        };
    }
}

// Usage example
class Person {
    private final String name;
    private final int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }

    @Override
    public String toString() {
        return name + "(" + age + ")";
    }
}

public class ComparatorDemo {
    public static void main(String[] args) {
        List<Person> people = Arrays.asList(
            new Person("Alice", 30),
            new Person("Bob", 25),
            new Person("Charlie", 30),
            new Person("David", 25)
        );

        // Sort by age
        Comparator<Person> byAge = ComparatorFactory.comparing(Person::getAge);

        // Sort by name
        Comparator<Person> byName = ComparatorFactory.comparing(Person::getName);

        // Compose: sort by age first, then name
        Comparator<Person> byAgeAndName = ComparatorFactory.compose(byAge, byName);

        List<Person> sorted = new ArrayList<>(people);
        sorted.sort(byAgeAndName);
        System.out.println(sorted);
        // [Bob(25), David(25), Alice(30), Charlie(30)]

        // Reverse sorting
        sorted.sort(ComparatorFactory.reverse(byAgeAndName));
        System.out.println(sorted);
        // [Charlie(30), Alice(30), David(25), Bob(25)]
    }
}
```

## Best Practices

### Prefer Generic Methods Over Wildcards

When a type parameter is used only once, consider using a wildcard; when establishing type relationships, use generic methods.

```java
// Good: wildcard is more concise
public static void printList(List<?> list) {
    for (Object obj : list) {
        System.out.println(obj);
    }
}

// Good: use generic method when establishing type relationships
public static <T> void copy(List<T> dest, List<T> src) {
    // dest and src must be same type
}

// Better: use PECS to increase flexibility
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    // More flexible
}
```

### Don't Use Wildcards in Return Types

Wildcards in return types force callers to handle wildcards, reducing API usability.

```java
// Bad: caller must handle wildcard
public List<? extends Number> getNumbers() {
    return Arrays.asList(1, 2, 3);
}

// Good: return concrete type
public List<Number> getNumbers() {
    return Arrays.asList(1, 2, 3);
}

// Or use generic method
public <T extends Number> List<T> getNumbers(Class<T> type) {
    // ...
}
```

### Use Bounded Wildcards to Increase API Flexibility

```java
// Bad: can only accept List<Number>
public static double sum(List<Number> numbers) {
    return numbers.stream()
        .mapToDouble(Number::doubleValue)
        .sum();
}

// Good: can accept List<Integer>, List<Double>, etc.
public static double sum(List<? extends Number> numbers) {
    return numbers.stream()
        .mapToDouble(Number::doubleValue)
        .sum();
}
```

### Wildcards in Comparable and Comparator

```java
// Standard pattern: supports comparing Comparable implemented in superclass
public static <T extends Comparable<? super T>> T max(Collection<? extends T> c) {
    // ...
}

// Why use Comparable<? super T>?
// Consider: class Apple extends Fruit implements Comparable<Fruit>
// If using Comparable<T>, Apple cannot use this method
// Because Apple implements Comparable<Fruit>, not Comparable<Apple>
```

### Use @SafeVarargs to Suppress Heap Pollution Warnings

```java
@SafeVarargs
public static <T> List<T> asList(T... elements) {
    List<T> result = new ArrayList<>();
    for (T element : elements) {
        result.add(element);
    }
    return result;
}
```

## Common Pitfalls

### Pitfall 1: Confusing `List<Object>` and `List<?>`

```java
// List<Object> can add any object
List<Object> objects = new ArrayList<>();
objects.add("Hello");
objects.add(123);
objects.add(new Object());

// List<?> can barely add any object (except null)
List<?> unknown = new ArrayList<>();
// unknown.add("Hello");  // Compilation error
// unknown.add(123);       // Compilation error
unknown.add(null);         // This is the only allowed operation
```

### Pitfall 2: Trying to Add to `? extends`

```java
List<? extends Number> numbers = new ArrayList<Integer>();

// Common error: thinking you can add Number or its subclasses
// numbers.add(1);      // Compilation error
// numbers.add(1.0);    // Compilation error
// numbers.add(new Integer(1));  // Compilation error

// Reason: compiler doesn't know the actual type
// Could be List<Integer>, List<Double>, List<BigDecimal>, etc.
```

### Pitfall 3: Trying to Read `? super` as Concrete Type

```java
List<? super Integer> list = new ArrayList<Number>();
list.add(1);
list.add(2);

// Common error: thinking you can read as Integer or Number
// Integer i = list.get(0);  // Compilation error
// Number n = list.get(0);   // Compilation error

// Correct: can only read as Object
Object obj = list.get(0);  // Correct
```

### Pitfall 4: Raw Types vs. Wildcards

```java
// Raw type: completely bypasses generic checks (not recommended)
List rawList = new ArrayList();
rawList.add("Hello");
rawList.add(123);  // No compilation error, but unsafe

// Unbounded wildcard: still maintains type safety
List<?> wildcardList = new ArrayList<>();
// wildcardList.add("Hello");  // Compilation error
```

### Pitfall 5: Multiple Bounds and Wildcards

```java
// Generics can have multiple bounds
public class Box<T extends Number & Comparable<T>> { }

// But wildcards can only have one bound
List<? extends Number> list1;  // Correct
// List<? extends Number & Comparable<?>> list2;  // Syntax error
```

### Pitfall 6: Wildcard Capture Issues

```java
public static void swap(List<?> list, int i, int j) {
    // This code looks reasonable but fails compilation
    // Object temp = list.get(i);
    // list.set(i, list.get(j));  // Compilation error!
    // list.set(j, temp);         // Compilation error!
}

// Solution: use helper method
public static void swap(List<?> list, int i, int j) {
    swapHelper(list, i, j);
}

private static <T> void swapHelper(List<T> list, int i, int j) {
    T temp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, temp);
}
```

### Pitfall 7: instanceof with Generics

```java
// Error: cannot use parameterized type with instanceof
// if (obj instanceof List<String>) { }  // Compilation error

// Correct: use unbounded wildcard
if (obj instanceof List<?>) {
    List<?> list = (List<?>) obj;
    // ...
}
```

## Performance Considerations

### Impact of Type Erasure

Because of type erasure, wildcards themselves have no runtime overhead. All generic checks are done at compile time.

```java
// Before compilation
public void process(List<? extends Number> numbers) {
    for (Number n : numbers) {
        System.out.println(n.doubleValue());
    }
}

// After compilation (no generic overhead)
public void process(List numbers) {
    for (Object obj : numbers) {
        Number n = (Number) obj;  // Type cast
        System.out.println(n.doubleValue());
    }
}
```

### Boxing/Unboxing Overhead

Wildcards cannot use primitive types, potentially incurring boxing/unboxing overhead.

```java
// Must use wrapper types, boxing overhead
List<? extends Number> numbers = Arrays.asList(1, 2, 3);  // Auto-boxing

// For performance-sensitive scenarios, consider specialized primitive collections
// Such as Eclipse Collections' IntList, DoubleList, etc.
```

### Avoid Unnecessary Wildcards

```java
// Unnecessary wildcard
public void process(List<? extends String> strings) {
    // String is final, has no subclasses
    // Just use List<String>
}

// Better
public void process(List<String> strings) {
    // More concise, same performance
}
```

## Real-World Scenarios

### Scenario 1: Event Handling System

```java
// Event base class
abstract class Event {
    private final long timestamp = System.currentTimeMillis();
    public long getTimestamp() { return timestamp; }
}

// Concrete event types
class UserEvent extends Event {
    private final String userId;
    public UserEvent(String userId) { this.userId = userId; }
    public String getUserId() { return userId; }
}

class OrderEvent extends Event {
    private final String orderId;
    public OrderEvent(String orderId) { this.orderId = orderId; }
    public String getOrderId() { return orderId; }
}

// Event handler interface
interface EventHandler<E extends Event> {
    void handle(E event);
}

// Event bus
class EventBus {
    private final Map<Class<? extends Event>,
                      List<EventHandler<? super Event>>> handlers = new HashMap<>();

    // Register handler
    // Use ? super E to allow registering handlers that can handle parent events
    public <E extends Event> void register(
            Class<E> eventType,
            EventHandler<? super E> handler) {
        handlers.computeIfAbsent(eventType, k -> new ArrayList<>())
                .add((EventHandler<? super Event>) handler);
    }

    // Publish event
    @SuppressWarnings("unchecked")
    public <E extends Event> void publish(E event) {
        List<EventHandler<? super Event>> eventHandlers =
            handlers.get(event.getClass());
        if (eventHandlers != null) {
            for (EventHandler<? super Event> handler : eventHandlers) {
                handler.handle(event);
            }
        }
    }
}

// Usage example
public class EventDemo {
    public static void main(String[] args) {
        EventBus bus = new EventBus();

        // Register UserEvent handler
        bus.register(UserEvent.class, event -> {
            System.out.println("User: " + event.getUserId());
        });

        // Register handler that can handle any Event
        EventHandler<Event> genericHandler = event -> {
            System.out.println("Event at: " + event.getTimestamp());
        };
        bus.register(UserEvent.class, genericHandler);
        bus.register(OrderEvent.class, genericHandler);

        // Publish events
        bus.publish(new UserEvent("user123"));
        bus.publish(new OrderEvent("order456"));
    }
}
```

### Scenario 2: Data Transformation Pipeline

```java
// Transformer interface
interface Transformer<I, O> {
    O transform(I input);
}

// Transformation pipeline
class Pipeline<I, O> {
    private final List<Transformer<?, ?>> transformers = new ArrayList<>();
    private final Class<I> inputType;
    private final Class<O> outputType;

    private Pipeline(Class<I> inputType, Class<O> outputType) {
        this.inputType = inputType;
        this.outputType = outputType;
    }

    public static <T> Pipeline<T, T> of(Class<T> type) {
        return new Pipeline<>(type, type);
    }

    // Add transformation step
    // Use extends to ensure input type compatibility
    @SuppressWarnings("unchecked")
    public <R> Pipeline<I, R> then(Transformer<? super O, ? extends R> transformer) {
        Pipeline<I, R> newPipeline = new Pipeline<>(inputType, null);
        newPipeline.transformers.addAll(this.transformers);
        newPipeline.transformers.add(transformer);
        return newPipeline;
    }

    // Execute pipeline
    @SuppressWarnings("unchecked")
    public O execute(I input) {
        Object current = input;
        for (Transformer transformer : transformers) {
            current = transformer.transform(current);
        }
        return (O) current;
    }
}

// Usage example
public class PipelineDemo {
    public static void main(String[] args) {
        Pipeline<String, Integer> pipeline = Pipeline.of(String.class)
            .then(String::trim)
            .then(String::toLowerCase)
            .then(String::length);

        Integer result = pipeline.execute("  HELLO WORLD  ");
        System.out.println(result);  // 11
    }
}
```

### Scenario 3: Repository Pattern

```java
// Entity base class
abstract class Entity {
    protected Long id;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
}

// Concrete entities
class User extends Entity {
    private String name;
    public User(String name) { this.name = name; }
    public String getName() { return name; }
}

class Product extends Entity {
    private String title;
    public Product(String title) { this.title = title; }
    public String getTitle() { return title; }
}

// Generic Repository interface
interface Repository<E extends Entity> {
    E findById(Long id);
    List<E> findAll();
    void save(E entity);
    void delete(E entity);

    // Bulk save: use extends to accept subtype collections
    default void saveAll(Collection<? extends E> entities) {
        for (E entity : entities) {
            save(entity);
        }
    }

    // Bulk query results write: use super to write supertype collections
    default void findAllInto(Collection<? super E> dest) {
        dest.addAll(findAll());
    }
}

// In-memory implementation
class InMemoryRepository<E extends Entity> implements Repository<E> {
    private final Map<Long, E> store = new HashMap<>();
    private long idSequence = 0;

    @Override
    public E findById(Long id) {
        return store.get(id);
    }

    @Override
    public List<E> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public void save(E entity) {
        if (entity.getId() == null) {
            entity.setId(++idSequence);
        }
        store.put(entity.getId(), entity);
    }

    @Override
    public void delete(E entity) {
        store.remove(entity.getId());
    }
}

// Usage example
public class RepositoryDemo {
    public static void main(String[] args) {
        Repository<User> userRepo = new InMemoryRepository<>();

        // Bulk save
        List<User> users = Arrays.asList(
            new User("Alice"),
            new User("Bob")
        );
        userRepo.saveAll(users);

        // Query into Object list (demonstrates super usage)
        List<Object> allEntities = new ArrayList<>();
        userRepo.findAllInto(allEntities);

        for (Object entity : allEntities) {
            System.out.println(((User) entity).getName());
        }
    }
}
```

## Interview Questions

### Q1: What's the difference between `List<?>` and `List<Object>`?

**Answer**:

- `List<Object>` is a concrete parameterized type that can add any object
- `List<?>` is a wildcard type representing a List of unknown type
- `List<String>` is not a subtype of `List<Object>`, but is a subtype of `List<?>`
- `List<?>` can only add null, but can safely read as Object

```java
List<Object> objects = new ArrayList<>();
objects.add("Hello");  // Can add

List<?> unknown = new ArrayList<String>();
// unknown.add("Hello");  // Compilation error
```

### Q2: Explain the PECS Principle

**Answer**:

PECS stands for "Producer Extends, Consumer Super":
- **Producer Extends**: If you need to read data from a collection (producer), use `? extends T`
- **Consumer Super**: If you need to write data to a collection (consumer), use `? super T`

```java
// src is producer (read), dest is consumer (write)
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (T item : src) {
        dest.add(item);
    }
}
```

### Q3: Why can't you add Integer to `List<? extends Number>`?

**Answer**:

Because the compiler doesn't know the actual type of `List<? extends Number>`:
- Could be `List<Integer>`
- Could be `List<Double>`
- Could be `List<BigDecimal>`

If the actual type is `List<Double>`, adding `Integer` would break type safety.

```java
List<? extends Number> list = new ArrayList<Double>();
// list.add(new Integer(1));  // If allowed, would pollute Double list
```

### Q4: What is wildcard capture?

**Answer**:

Wildcard capture is the process where the compiler binds a wildcard to a concrete type. When you need read/write operations on wildcard types, you can use helper methods to capture the wildcard type.

```java
public static void swap(List<?> list, int i, int j) {
    swapHelper(list, i, j);  // Wildcard capture
}

private static <T> void swapHelper(List<T> list, int i, int j) {
    T temp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, temp);
}
```

### Q5: What's the difference between `Comparable<T>` and `Comparable<? super T>`?

**Answer**:

`Comparable<? super T>` is more flexible, allowing types to implement Comparable in their superclass:

```java
// If Apple extends Fruit implements Comparable<Fruit>
// Using Comparable<T>, Apple can't be sorted
// Using Comparable<? super T>, can leverage Fruit's comparison logic

public static <T extends Comparable<? super T>> T max(Collection<? extends T> c) {
    // Supports types implementing Comparable in superclass
}
```

### Q6: When should you NOT use wildcards?

**Answer**:

1. **Return types**: Returning wildcard types forces callers to handle wildcards
2. **Need simultaneous read/write**: Wildcards limit read or write capability
3. **Need type relationships**: When multiple parameters must have the same type

```java
// Bad: return wildcard
public List<? extends Number> getNumbers() { }

// Good: return concrete type
public List<Number> getNumbers() { }

// Need simultaneous read/write, use generic method
public static <T> void swap(List<T> list, int i, int j) {
    T temp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, temp);
}
```

## Further Reading

### Official Documentation

- [Java Generics Tutorial](https://docs.oracle.com/javase/tutorial/java/generics/)
- [Wildcards](https://docs.oracle.com/javase/tutorial/java/generics/wildcards.html)
- [Guidelines for Wildcard Use](https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html)

### Classic Books

- "Effective Java" Third Edition - Joshua Bloch (Chapter 5: Generics)
  - Item 31: Use bounded wildcards to increase API flexibility
  - Item 32: Combine generics and varargs judiciously
- "Java Generics and Collections" - Maurice Naftalin, Philip Wadler
- "Core Java Volume I" - Cay S. Horstmann (Generics Programming Chapter)

### Quality Articles

- [Java Generics FAQs](http://www.angelikalanger.com/GenericsFAQ/JavaGenericsFAQ.html) - Angelika Langer
- [The Java Generics Guide](https://www.baeldung.com/java-generics) - Baeldung
- [Understanding PECS](https://stackoverflow.com/questions/2723397/what-is-pecs-producer-extends-consumer-super) - Stack Overflow Classic Discussion

### Related Topics

- [Java Generics Basics](/java/generics) - Generic classes, interfaces, and methods
- [Java Type Erasure](/java/type-erasure) - Type erasure mechanism explained
- [Java Collections Framework](/java/collections) - Generics application in collections
- [Java Functional Interfaces](/java/functional-interfaces) - Generics in functional programming
