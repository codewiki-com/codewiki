---
title: Java Generics
description: "Deep dive into Java generics: type parameters, wildcards, type erasure and PECS"
track: java
section: oop-generics
difficulty: intermediate
tags:
  - Java
  - Generics
  - Wildcards
  - PECS
status: imported
origin: old/src/content/docs/java/generics.en.md
divergence: 0.219
issues: []
legacy:
  category: Java
  subcategory: Generics
  order: 3
  lastUpdated: 2026-01-07
---

Java Generics, introduced in Java 5, provide compile-time type safety and eliminate the need for explicit type casting. They allow you to write flexible, reusable code while catching type errors at compile time rather than runtime.

## Introduction to Generics

Before generics, collections could hold any type of object, requiring explicit casting and risking runtime errors:

```java
// Pre-generics code (Java 1.4 and earlier)
List list = new ArrayList();
list.add("Hello");
list.add(Integer.valueOf(42));

String s = (String) list.get(0); // Explicit cast required
String s2 = (String) list.get(1); // Runtime ClassCastException!
```

With generics, type safety is enforced at compile time:

```java
// Modern code with generics
List<String> list = new ArrayList<>();
list.add("Hello");
// list.add(42); // Compile-time error!

String s = list.get(0); // No cast needed
```

## Generic Classes

Generic classes are parameterized with one or more type parameters, defined within angle brackets `<>`.

### Basic Generic Class

```java
public class Box<T> {
    private T content;

    public void set(T content) {
        this.content = content;
    }

    public T get() {
        return content;
    }
}

// Usage
Box<String> stringBox = new Box<>();
stringBox.set("Hello");
String value = stringBox.get();

Box<Integer> intBox = new Box<>();
intBox.set(42);
Integer number = intBox.get();
```

### Multiple Type Parameters

```java
public class Pair<K, V> {
    private K key;
    private V value;

    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }

    public K getKey() {
        return key;
    }

    public V getValue() {
        return value;
    }
}

// Usage
Pair<String, Integer> pair = new Pair<>("Age", 25);
String key = pair.getKey();
Integer value = pair.getValue();
```

### Common Type Parameter Naming Conventions

- `E` - Element (used extensively by collections)
- `K` - Key
- `V` - Value
- `N` - Number
- `T` - Type
- `S`, `U`, `V` - 2nd, 3rd, 4th types

## Generic Methods

Generic methods have their own type parameters, independent of the class type parameters.

### Basic Generic Method

```java
public class Utils {
    // Generic method
    public static <T> void printArray(T[] array) {
        for (T element : array) {
            System.out.print(element + " ");
        }
        System.out.println();
    }
}

// Usage
Integer[] intArray = {1, 2, 3, 4, 5};
String[] strArray = {"Hello", "World"};

Utils.printArray(intArray);
Utils.printArray(strArray);
```

### Generic Method with Return Type

```java
public class Collections {
    public static <T> T getFirst(List<T> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.get(0);
    }

    public static <T> T getLast(List<T> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.get(list.size() - 1);
    }
}

// Usage
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
String first = Collections.getFirst(names); // "Alice"
String last = Collections.getLast(names);   // "Charlie"
```

### Generic Method with Multiple Type Parameters

```java
public class Converter {
    public static <T, R> List<R> map(List<T> list, Function<T, R> mapper) {
        List<R> result = new ArrayList<>();
        for (T item : list) {
            result.add(mapper.apply(item));
        }
        return result;
    }
}

// Usage
List<String> strings = Arrays.asList("1", "2", "3");
List<Integer> integers = Converter.map(strings, Integer::parseInt);
```

## Generic Interfaces

Interfaces can be generic just like classes.

```java
public interface Repository<T, ID> {
    T findById(ID id);
    List<T> findAll();
    void save(T entity);
    void delete(ID id);
}

// Implementation
public class UserRepository implements Repository<User, Long> {
    private Map<Long, User> storage = new HashMap<>();

    @Override
    public User findById(Long id) {
        return storage.get(id);
    }

    @Override
    public List<User> findAll() {
        return new ArrayList<>(storage.values());
    }

    @Override
    public void save(User entity) {
        storage.put(entity.getId(), entity);
    }

    @Override
    public void delete(Long id) {
        storage.remove(id);
    }
}
```

### Comparable and Comparator

```java
// Comparable - natural ordering
public class Person implements Comparable<Person> {
    private String name;
    private int age;

    @Override
    public int compareTo(Person other) {
        return this.name.compareTo(other.name);
    }
}

// Comparator - custom ordering
Comparator<Person> ageComparator = new Comparator<Person>() {
    @Override
    public int compare(Person p1, Person p2) {
        return Integer.compare(p1.getAge(), p2.getAge());
    }
};

// Lambda version
Comparator<Person> ageComparator = (p1, p2) -> Integer.compare(p1.getAge(), p2.getAge());
```

## Bounded Type Parameters

Type parameters can be restricted to specific types using bounds.

### Upper Bounds (extends)

```java
// T must be a Number or subclass of Number
public class Calculator<T extends Number> {
    private T value;

    public Calculator(T value) {
        this.value = value;
    }

    public double doubleValue() {
        return value.doubleValue();
    }

    public int intValue() {
        return value.intValue();
    }
}

// Usage
Calculator<Integer> intCalc = new Calculator<>(42);
Calculator<Double> doubleCalc = new Calculator<>(3.14);
// Calculator<String> strCalc = new Calculator<>("text"); // Compile error!
```

### Multiple Bounds

```java
// T must implement both Comparable and Serializable
public class SortableStorage<T extends Comparable<T> & Serializable> {
    private List<T> items = new ArrayList<>();

    public void add(T item) {
        items.add(item);
    }

    public void sort() {
        Collections.sort(items);
    }

    public List<T> getItems() {
        return new ArrayList<>(items);
    }
}
```

### Bounded Type Parameters in Methods

```java
public class ArrayUtils {
    // Method with bounded type parameter
    public static <T extends Comparable<T>> T max(T[] array) {
        if (array == null || array.length == 0) {
            return null;
        }

        T max = array[0];
        for (int i = 1; i < array.length; i++) {
            if (array[i].compareTo(max) > 0) {
                max = array[i];
            }
        }
        return max;
    }
}

// Usage
Integer[] numbers = {3, 7, 2, 9, 1};
Integer maxNumber = ArrayUtils.max(numbers); // 9

String[] words = {"apple", "zebra", "banana"};
String maxWord = ArrayUtils.max(words); // "zebra"
```

## Wildcards

Wildcards (`?`) represent unknown types and provide flexibility when working with generic types.

### Unbounded Wildcard (`?`)

```java
public class WildcardExample {
    // Accepts a list of any type
    public static void printList(List<?> list) {
        for (Object item : list) {
            System.out.println(item);
        }
    }
}

// Usage
List<String> strings = Arrays.asList("a", "b", "c");
List<Integer> integers = Arrays.asList(1, 2, 3);

WildcardExample.printList(strings);
WildcardExample.printList(integers);
```

### Upper Bounded Wildcard (`? extends T`)

Use when you want to **read** from a structure (Producer).

```java
public class NumberProcessor {
    // Accepts List of Number or any subtype (Integer, Double, etc.)
    public static double sum(List<? extends Number> numbers) {
        double total = 0.0;
        for (Number num : numbers) {
            total += num.doubleValue();
        }
        return total;
    }
}

// Usage
List<Integer> integers = Arrays.asList(1, 2, 3);
List<Double> doubles = Arrays.asList(1.5, 2.5, 3.5);

double sum1 = NumberProcessor.sum(integers); // 6.0
double sum2 = NumberProcessor.sum(doubles);  // 7.5
```

**Important:** With `? extends T`, you can read elements as type `T`, but you cannot add elements (except `null`).

```java
List<? extends Number> numbers = new ArrayList<Integer>();
Number n = numbers.get(0); // OK - reading
// numbers.add(42);        // Compile error - cannot add
// numbers.add(3.14);      // Compile error - cannot add
numbers.add(null);         // OK - null is allowed
```

### Lower Bounded Wildcard (`? super T`)

Use when you want to **write** to a structure (Consumer).

```java
public class ListUtils {
    // Accepts List of Integer or any supertype (Number, Object)
    public static void addIntegers(List<? super Integer> list) {
        list.add(1);
        list.add(2);
        list.add(3);
    }
}

// Usage
List<Integer> integers = new ArrayList<>();
List<Number> numbers = new ArrayList<>();
List<Object> objects = new ArrayList<>();

ListUtils.addIntegers(integers); // OK
ListUtils.addIntegers(numbers);  // OK
ListUtils.addIntegers(objects);  // OK
```

**Important:** With `? super T`, you can add elements of type `T`, but when reading, you only get `Object`.

```java
List<? super Integer> list = new ArrayList<Number>();
list.add(42);              // OK - writing
list.add(100);             // OK - writing
Object obj = list.get(0);  // OK - but only as Object
// Integer i = list.get(0); // Compile error
```

## The PECS Principle

**PECS stands for "Producer Extends, Consumer Super"**

This principle helps you choose the correct wildcard:

- **Producer Extends**: If a parameterized type **produces** values (you read from it), use `? extends T`
- **Consumer Super**: If a parameterized type **consumes** values (you write to it), use `? super T`

### PECS in Action

```java
public class Stack<E> {
    private List<E> elements = new ArrayList<>();

    public void push(E element) {
        elements.add(element);
    }

    public E pop() {
        if (elements.isEmpty()) {
            throw new EmptyStackException();
        }
        return elements.remove(elements.size() - 1);
    }

    // Producer - reading from src (use extends)
    // Consumer - writing to this stack (implicit)
    public void pushAll(Iterable<? extends E> src) {
        for (E e : src) {
            push(e);
        }
    }

    // Consumer - writing to dst (use super)
    // Producer - reading from this stack (implicit)
    public void popAll(Collection<? super E> dst) {
        while (!elements.isEmpty()) {
            dst.add(pop());
        }
    }
}

// Usage example
Stack<Number> numberStack = new Stack<>();

// pushAll - src is a producer
List<Integer> integers = Arrays.asList(1, 2, 3);
numberStack.pushAll(integers); // OK - Integer extends Number

// popAll - dst is a consumer
List<Object> objects = new ArrayList<>();
numberStack.popAll(objects); // OK - Object is super of Number
```

### Real-World PECS Example: Collections.copy()

```java
// From java.util.Collections
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    // src is a producer (we read from it) - use extends
    // dest is a consumer (we write to it) - use super

    for (int i = 0; i < src.size(); i++) {
        dest.set(i, src.get(i));
    }
}

// Usage
List<Integer> integers = Arrays.asList(1, 2, 3);
List<Number> numbers = Arrays.asList(0.0, 0.0, 0.0);

Collections.copy(numbers, integers); // OK
// numbers is now [1, 2, 3]
```

### Choosing the Right Wildcard

```java
public class WildcardChoice {
    // Reading only - use extends
    public static double average(List<? extends Number> numbers) {
        double sum = 0;
        for (Number n : numbers) {
            sum += n.doubleValue();
        }
        return sum / numbers.size();
    }

    // Writing only - use super
    public static void fillWithZeros(List<? super Integer> list, int count) {
        for (int i = 0; i < count; i++) {
            list.add(0);
        }
    }

    // Both reading and writing - no wildcard
    public static void swap(List<Integer> list, int i, int j) {
        Integer temp = list.get(i);
        list.set(i, list.get(j));
        list.set(j, temp);
    }
}
```

## Type Erasure

Java implements generics through **type erasure**: generic type information is removed during compilation and is not available at runtime.

### How Type Erasure Works

```java
// Source code
public class Box<T> {
    private T value;

    public void set(T value) {
        this.value = value;
    }

    public T get() {
        return value;
    }
}

// After type erasure (bytecode equivalent)
public class Box {
    private Object value;

    public void set(Object value) {
        this.value = value;
    }

    public Object get() {
        return value;
    }
}
```

### Type Erasure with Bounds

```java
// Source code with bounded type
public class Calculator<T extends Number> {
    private T value;

    public double doubleValue() {
        return value.doubleValue();
    }
}

// After type erasure
public class Calculator {
    private Number value; // Erased to the bound

    public double doubleValue() {
        return value.doubleValue();
    }
}
```

### Implications of Type Erasure

#### Cannot Create Instances of Type Parameters

```java
public class Container<T> {
    private T instance;

    public void createInstance() {
        // instance = new T(); // Compile error!
    }
}
```

**Workaround using Class object:**

```java
public class Container<T> {
    private Class<T> type;

    public Container(Class<T> type) {
        this.type = type;
    }

    public T createInstance() throws Exception {
        return type.getDeclaredConstructor().newInstance();
    }
}

// Usage
Container<String> container = new Container<>(String.class);
String instance = container.createInstance();
```

#### Cannot Create Arrays of Parameterized Types

```java
public class ArrayExample<T> {
    // private T[] array = new T[10]; // Compile error!

    // Workaround 1: Use List instead
    private List<T> list = new ArrayList<>();

    // Workaround 2: Use Array.newInstance
    @SuppressWarnings("unchecked")
    private T[] createArray(Class<T> type, int size) {
        return (T[]) Array.newInstance(type, size);
    }
}
```

#### Cannot Use instanceof with Parameterized Types

```java
public class TypeCheck<T> {
    public void check(Object obj) {
        // if (obj instanceof List<String>) { } // Compile error!

        if (obj instanceof List<?>) { // OK - using wildcard
            System.out.println("Is a List");
        }
    }
}
```

#### Cannot Overload Methods with Same Erasure

```java
public class Overload {
    // These two methods have the same erasure
    // public void process(List<String> list) { }  // Compile error!
    // public void process(List<Integer> list) { }

    // Workaround: use different method names
    public void processStrings(List<String> list) { }
    public void processIntegers(List<Integer> list) { }
}
```

### Bridge Methods

The compiler generates bridge methods to preserve polymorphism after type erasure.

```java
public class Node<T> {
    private T data;

    public void setData(T data) {
        this.data = data;
    }
}

public class IntegerNode extends Node<Integer> {
    @Override
    public void setData(Integer data) {
        super.setData(data);
    }
}

// After type erasure, compiler generates a bridge method:
// public void setData(Object data) {
//     setData((Integer) data);
// }
```

## Generics and Reflection

Due to type erasure, generic type information is limited at runtime, but some information is preserved through reflection.

### Getting Generic Type Information

```java
import java.lang.reflect.*;

public class ReflectionExample {

    public static void printTypeInfo(Field field) {
        System.out.println("Field: " + field.getName());
        System.out.println("Type: " + field.getType());
        System.out.println("Generic Type: " + field.getGenericType());

        Type genericType = field.getGenericType();
        if (genericType instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) genericType;
            System.out.println("Raw Type: " + pt.getRawType());
            System.out.println("Type Arguments:");
            for (Type arg : pt.getActualTypeArguments()) {
                System.out.println("  " + arg);
            }
        }
        System.out.println();
    }

    public static void main(String[] args) throws Exception {
        class Example {
            List<String> stringList;
            Map<String, Integer> map;
            List<? extends Number> boundedList;
        }

        for (Field field : Example.class.getDeclaredFields()) {
            printTypeInfo(field);
        }
    }
}

// Output:
// Field: stringList
// Type: interface java.util.List
// Generic Type: java.util.List<java.lang.String>
// Raw Type: interface java.util.List
// Type Arguments:
//   class java.lang.String
//
// Field: map
// Type: interface java.util.Map
// Generic Type: java.util.Map<java.lang.String, java.lang.Integer>
// Raw Type: interface java.util.Map
// Type Arguments:
//   class java.lang.String
//   class java.lang.Integer
```

### Getting Type Parameters from Superclass

```java
public abstract class GenericDAO<T> {
    private Class<T> entityClass;

    @SuppressWarnings("unchecked")
    public GenericDAO() {
        // Get the actual type parameter at runtime
        Type type = getClass().getGenericSuperclass();
        if (type instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) type;
            this.entityClass = (Class<T>) pt.getActualTypeArguments()[0];
        }
    }

    public Class<T> getEntityClass() {
        return entityClass;
    }

    public T createInstance() throws Exception {
        return entityClass.getDeclaredConstructor().newInstance();
    }
}

// Usage
public class UserDAO extends GenericDAO<User> {
}

// Test
UserDAO dao = new UserDAO();
System.out.println(dao.getEntityClass()); // class User
User user = dao.createInstance();
```

### TypeToken Pattern (Super Type Token)

Popular pattern used by libraries like Gson and Guice:

```java
public abstract class TypeReference<T> {
    private final Type type;

    protected TypeReference() {
        Type superclass = getClass().getGenericSuperclass();
        if (superclass instanceof ParameterizedType) {
            this.type = ((ParameterizedType) superclass).getActualTypeArguments()[0];
        } else {
            throw new IllegalArgumentException("TypeReference must be parameterized");
        }
    }

    public Type getType() {
        return type;
    }
}

// Usage
TypeReference<List<String>> typeRef = new TypeReference<List<String>>() {};
Type type = typeRef.getType();
System.out.println(type); // java.util.List<java.lang.String>

// Used in libraries like this:
List<String> list = gson.fromJson(json, new TypeReference<List<String>>() {}.getType());
```

### Reflection Limitations

```java
public class ReflectionLimitations {
    public <T> void genericMethod(T param) {
        // Cannot get T at runtime
        // System.out.println(T.class); // Compile error

        // Can only get Object.class
        System.out.println(param.getClass());
    }

    public void testMethod() {
        List<String> stringList = new ArrayList<>();
        List<Integer> integerList = new ArrayList<>();

        // Both return true - type information lost at runtime
        System.out.println(stringList.getClass() == integerList.getClass()); // true
    }
}
```

## Common Pitfalls and Best Practices

### Raw Types - Avoid Them

```java
// BAD - Raw type, no type safety
List list = new ArrayList();
list.add("String");
list.add(42);

// GOOD - Parameterized type
List<String> list = new ArrayList<>();
list.add("String");
// list.add(42); // Compile error
```

### Heap Pollution

```java
// BAD - Heap pollution with varargs
@SafeVarargs // Suppresses warning
public static <T> void addToList(List<T> list, T... elements) {
    for (T element : elements) {
        list.add(element);
    }
}

// Be careful with generic varargs
public static void danger() {
    List<String> strings = new ArrayList<>();
    addToList(strings, "a", "b");
}
```

### Cannot Catch or Throw Generic Exceptions

```java
// BAD - Cannot catch generic exception
public class GenericException<T> extends Exception { } // OK to define

public <T extends Exception> void method() {
    try {
        // ...
    } catch (T e) { // Compile error!
        // ...
    }
}
```

### Static Context and Type Parameters

```java
public class Container<T> {
    // BAD - Cannot use type parameter in static context
    // private static T staticField; // Compile error!
    // public static T staticMethod() { } // Compile error!

    // GOOD - Static generic method with its own type parameter
    public static <E> E staticGenericMethod(E element) {
        return element;
    }
}
```

### Prefer Generic Methods to Parameterizing Classes

```java
// Less flexible
public class StringProcessor {
    public String process(List<String> list) {
        return list.get(0).toUpperCase();
    }
}

// More flexible
public class Processor {
    public <T> T process(List<T> list, Function<T, T> processor) {
        return processor.apply(list.get(0));
    }
}
```

### Use Bounded Wildcards for Greater Flexibility

```java
// Less flexible
public static void printCollection(Collection<Object> c) {
    for (Object o : c) {
        System.out.println(o);
    }
}

// More flexible
public static void printCollection(Collection<?> c) {
    for (Object o : c) {
        System.out.println(o);
    }
}
```

### Remember PECS (Producer Extends, Consumer Super)

```java
// GOOD - Following PECS
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (T item : src) {
        dest.add(item);
    }
}

// Usage demonstrates flexibility
List<Number> numbers = new ArrayList<>();
List<Integer> integers = Arrays.asList(1, 2, 3);
copy(numbers, integers); // Works perfectly
```

### Don't Use Wildcard Types as Return Types

```java
// BAD - Forces clients to deal with wildcards
public List<?> getItems() {
    return items;
}

// GOOD - Clear, specific return type
public <T> List<T> getItems() {
    return new ArrayList<>(items);
}
```

### Be Careful with Arrays and Generics

```java
// BAD - Arrays and generics don't mix well
List<String>[] arrayOfLists = new List<String>[10]; // Compile error!

// GOOD - Use List of Lists instead
List<List<String>> listOfLists = new ArrayList<>();
```

### Document Type Parameters

```java
/**
 * A generic container that holds a value of type T.
 *
 * @param <T> the type of value held in this container
 */
public class Container<T> {
    private T value;

    /**
     * Retrieves the value from the container.
     *
     * @return the value of type T
     */
    public T getValue() {
        return value;
    }
}
```

## Summary

Java Generics are a powerful feature that provides:

1. **Type Safety**: Catch errors at compile time rather than runtime
2. **Code Reusability**: Write methods and classes that work with different types
3. **Elimination of Casts**: No need for explicit type casting
4. **Better Documentation**: Type parameters document what types are expected

**Key Takeaways:**

- Use **generic classes** and **methods** to write reusable, type-safe code
- Apply **bounded type parameters** (`extends`) to restrict acceptable types
- Use **wildcards** (`?`, `? extends T`, `? super T`) for flexible APIs
- Follow the **PECS principle**: Producer Extends, Consumer Super
- Understand **type erasure** and its implications
- Use **reflection** carefully when you need runtime type information
- Avoid **raw types** and follow best practices

Generics may seem complex at first, but mastering them is essential for writing robust, maintainable Java code. They are extensively used in Java Collections Framework, Stream API, and virtually all modern Java libraries.
