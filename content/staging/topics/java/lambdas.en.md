---
title: Java Lambda Expressions
description: Master Java Lambda expressions including functional interfaces, method references and best practices
track: java
section: collections-streams
difficulty: intermediate
tags:
  - Java
  - Lambda
  - functional programming
status: imported
origin: old/src/content/docs/java/lambdas.en.md
divergence: 0.377
issues:
  - divergent
legacy:
  category: Java
  subcategory: Functional Programming
  order: 21
  lastUpdated: 2026-01-07
---

Lambda expressions, introduced in Java 8, represent one of the most significant changes to the Java language. They enable functional programming paradigms, making code more concise, readable, and expressive. Lambdas allow you to treat functionality as a method argument or pass code as data.

## What are Lambda Expressions?

A lambda expression is an anonymous function that can be passed around as a value. It provides a clear and concise way to represent a single method interface (functional interface) using an expression.

### Before and After Lambdas

```java
// Before Java 8: Anonymous inner class
Runnable runnable = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello from thread!");
    }
};

// With Lambda
Runnable runnableLambda = () -> System.out.println("Hello from thread!");

// Before: Comparator with anonymous class
Comparator<String> comparator = new Comparator<String>() {
    @Override
    public int compare(String s1, String s2) {
        return s1.length() - s2.length();
    }
};

// With Lambda
Comparator<String> comparatorLambda = (s1, s2) -> s1.length() - s2.length();
```

### Key Benefits

- **Conciseness**: Reduces boilerplate code significantly
- **Readability**: Makes intent clearer by focusing on behavior
- **Functional Programming**: Enables functional programming patterns
- **Deferred Execution**: Code is executed only when needed
- **Parallelism**: Works seamlessly with parallel streams

## Lambda Syntax

Lambda expressions follow a specific syntax pattern: `(parameters) -> expression` or `(parameters) -> { statements; }`

### Basic Syntax Variations

```java
// No parameters
() -> System.out.println("Hello")

// Single parameter (parentheses optional)
x -> x * 2
(x) -> x * 2

// Multiple parameters
(x, y) -> x + y

// Explicit parameter types
(int x, int y) -> x + y

// With code block
(x, y) -> {
    int sum = x + y;
    return sum;
}

// Return statement (required in blocks)
(String s) -> {
    return s.toUpperCase();
}
```

### Syntax Rules

```java
// Single expression - return is implicit
Function<Integer, Integer> square = x -> x * x;

// Block with multiple statements - return is explicit
Function<Integer, Integer> squareBlock = x -> {
    int result = x * x;
    return result;
};

// Void return type - no return needed
Consumer<String> printer = s -> System.out.println(s);

// Multiple statements in void lambda
Consumer<String> multiPrinter = s -> {
    System.out.println("Processing: " + s);
    System.out.println("Length: " + s.length());
};
```

### Type Inference

The compiler infers types from the context, so explicit types are usually unnecessary.

```java
// Type inference in action
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// Compiler knows s is String from list type
names.forEach(s -> System.out.println(s));

// Explicit type (optional)
names.forEach((String s) -> System.out.println(s));

// BiFunction type inference
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;

// Compiler infers types from BiFunction<Integer, Integer, Integer>
```

## Functional Interfaces

A functional interface is an interface with exactly one abstract method. Lambda expressions can be used wherever a functional interface is expected.

### Defining Functional Interfaces

```java
// Basic functional interface
@FunctionalInterface
public interface Calculator {
    int calculate(int a, int b);
}

// Usage
Calculator add = (a, b) -> a + b;
Calculator multiply = (a, b) -> a * b;
Calculator subtract = (a, b) -> a - b;

System.out.println(add.calculate(5, 3));       // 8
System.out.println(multiply.calculate(5, 3)); // 15
System.out.println(subtract.calculate(5, 3)); // 2
```

### The @FunctionalInterface Annotation

```java
// The annotation is optional but recommended
// It causes a compile error if the interface has more than one abstract method
@FunctionalInterface
public interface StringProcessor {
    String process(String input);

    // Default methods are allowed
    default String processAndPrint(String input) {
        String result = process(input);
        System.out.println(result);
        return result;
    }

    // Static methods are allowed
    static StringProcessor identity() {
        return s -> s;
    }
}

// Usage
StringProcessor upper = s -> s.toUpperCase();
StringProcessor trim = String::trim;
StringProcessor reverse = s -> new StringBuilder(s).reverse().toString();

System.out.println(upper.process("hello"));   // HELLO
System.out.println(reverse.process("hello")); // olleh
```

### Functional Interfaces with Generics

```java
@FunctionalInterface
public interface Transformer<T, R> {
    R transform(T input);
}

// String to Integer
Transformer<String, Integer> length = s -> s.length();

// Integer to String
Transformer<Integer, String> stringify = i -> "Number: " + i;

// Object to Boolean
Transformer<Object, Boolean> isNull = obj -> obj == null;

System.out.println(length.transform("Hello"));    // 5
System.out.println(stringify.transform(42));      // Number: 42
System.out.println(isNull.transform(null));       // true
```

### Composing Functional Interfaces

```java
@FunctionalInterface
public interface Validator<T> {
    boolean validate(T value);

    default Validator<T> and(Validator<T> other) {
        return value -> this.validate(value) && other.validate(value);
    }

    default Validator<T> or(Validator<T> other) {
        return value -> this.validate(value) || other.validate(value);
    }

    default Validator<T> negate() {
        return value -> !this.validate(value);
    }
}

// Usage
Validator<String> notEmpty = s -> s != null && !s.isEmpty();
Validator<String> notTooLong = s -> s.length() < 100;
Validator<String> containsAt = s -> s.contains("@");

Validator<String> emailValidator = notEmpty
    .and(notTooLong)
    .and(containsAt);

System.out.println(emailValidator.validate("user@example.com")); // true
System.out.println(emailValidator.validate("invalid"));          // false
```

## Built-in Functional Interfaces

Java 8 introduced the `java.util.function` package with many commonly used functional interfaces.

### Predicate

Tests a condition and returns boolean.

```java
import java.util.function.Predicate;

// Basic Predicate
Predicate<Integer> isPositive = n -> n > 0;
Predicate<Integer> isEven = n -> n % 2 == 0;

System.out.println(isPositive.test(5));  // true
System.out.println(isEven.test(5));      // false

// Combining Predicates
Predicate<Integer> isPositiveAndEven = isPositive.and(isEven);
Predicate<Integer> isPositiveOrEven = isPositive.or(isEven);
Predicate<Integer> isNotPositive = isPositive.negate();

System.out.println(isPositiveAndEven.test(4));  // true
System.out.println(isPositiveAndEven.test(3));  // false
System.out.println(isNotPositive.test(-5));     // true

// BiPredicate
BiPredicate<String, Integer> hasLength = (s, len) -> s.length() == len;
System.out.println(hasLength.test("Hello", 5)); // true
```

### Function

Transforms input to output.

```java
import java.util.function.Function;

// Basic Function
Function<String, Integer> strLength = s -> s.length();
Function<Integer, Integer> square = n -> n * n;

System.out.println(strLength.apply("Hello")); // 5
System.out.println(square.apply(4));          // 16

// Function composition
Function<String, Integer> lengthSquared = strLength.andThen(square);
System.out.println(lengthSquared.apply("Hello")); // 25

Function<Integer, Integer> addOne = n -> n + 1;
Function<Integer, Integer> squareThenAdd = square.andThen(addOne);
Function<Integer, Integer> addThenSquare = square.compose(addOne);

System.out.println(squareThenAdd.apply(3)); // 10 (3*3 + 1)
System.out.println(addThenSquare.apply(3)); // 16 ((3+1) * (3+1))

// BiFunction
BiFunction<String, String, Integer> combinedLength =
    (s1, s2) -> s1.length() + s2.length();
System.out.println(combinedLength.apply("Hello", "World")); // 10
```

### Consumer

Accepts input and performs an action (no return).

```java
import java.util.function.Consumer;

// Basic Consumer
Consumer<String> printer = s -> System.out.println(s);
Consumer<String> logger = s -> System.out.println("[LOG] " + s);

printer.accept("Hello");  // Hello
logger.accept("Hello");   // [LOG] Hello

// Chaining Consumers
Consumer<String> printAndLog = printer.andThen(logger);
printAndLog.accept("Message");
// Output:
// Message
// [LOG] Message

// BiConsumer
BiConsumer<String, Integer> repeat = (s, n) -> {
    for (int i = 0; i < n; i++) {
        System.out.println(s);
    }
};
repeat.accept("Hi", 3);
// Output: Hi (3 times)
```

### Supplier

Provides a value without taking input.

```java
import java.util.function.Supplier;

// Basic Supplier
Supplier<Double> randomSupplier = () -> Math.random();
Supplier<String> helloSupplier = () -> "Hello";
Supplier<LocalDateTime> nowSupplier = LocalDateTime::now;

System.out.println(randomSupplier.get()); // Random number
System.out.println(helloSupplier.get());  // Hello
System.out.println(nowSupplier.get());    // Current date/time

// Lazy evaluation with Supplier
public <T> T getValueOrDefault(T value, Supplier<T> defaultSupplier) {
    return value != null ? value : defaultSupplier.get();
}

// Expensive computation only runs if needed
String result = getValueOrDefault(null, () -> {
    System.out.println("Computing default...");
    return "Default Value";
});
```

### UnaryOperator and BinaryOperator

Special cases of Function for same input/output types.

```java
import java.util.function.UnaryOperator;
import java.util.function.BinaryOperator;

// UnaryOperator (same input and output type)
UnaryOperator<Integer> increment = n -> n + 1;
UnaryOperator<String> uppercase = String::toUpperCase;

System.out.println(increment.apply(5));      // 6
System.out.println(uppercase.apply("hello")); // HELLO

// BinaryOperator (two inputs of same type, same output type)
BinaryOperator<Integer> add = (a, b) -> a + b;
BinaryOperator<Integer> max = Integer::max;
BinaryOperator<String> concat = String::concat;

System.out.println(add.apply(5, 3));           // 8
System.out.println(max.apply(5, 3));           // 5
System.out.println(concat.apply("Hello", "!")); // Hello!
```

### Primitive Functional Interfaces

To avoid boxing/unboxing overhead, Java provides primitive specializations.

```java
import java.util.function.*;

// IntPredicate, LongPredicate, DoublePredicate
IntPredicate isEven = n -> n % 2 == 0;
System.out.println(isEven.test(4)); // true

// IntFunction, LongFunction, DoubleFunction
IntFunction<String> intToString = i -> "Number: " + i;
System.out.println(intToString.apply(42)); // Number: 42

// IntConsumer, LongConsumer, DoubleConsumer
IntConsumer printInt = System.out::println;
printInt.accept(42); // 42

// IntSupplier, LongSupplier, DoubleSupplier
IntSupplier randomInt = () -> (int) (Math.random() * 100);
System.out.println(randomInt.getAsInt()); // Random int 0-99

// IntUnaryOperator, LongUnaryOperator, DoubleUnaryOperator
IntUnaryOperator square = n -> n * n;
System.out.println(square.applyAsInt(5)); // 25

// IntBinaryOperator, LongBinaryOperator, DoubleBinaryOperator
IntBinaryOperator multiply = (a, b) -> a * b;
System.out.println(multiply.applyAsInt(5, 3)); // 15

// ToIntFunction, ToLongFunction, ToDoubleFunction
ToIntFunction<String> length = String::length;
System.out.println(length.applyAsInt("Hello")); // 5
```

## Method References

Method references provide a shorthand notation for lambdas that simply call an existing method. They make code more readable and concise.

### Types of Method References

```java
// 1. Static method reference: ClassName::staticMethod
Function<String, Integer> parseInt = Integer::parseInt;
System.out.println(parseInt.apply("42")); // 42

// Equivalent lambda
Function<String, Integer> parseIntLambda = s -> Integer.parseInt(s);

// 2. Instance method of particular object: instance::method
String prefix = "Hello, ";
Function<String, String> greeter = prefix::concat;
System.out.println(greeter.apply("World")); // Hello, World

// Equivalent lambda
Function<String, String> greeterLambda = s -> prefix.concat(s);

// 3. Instance method of arbitrary object: ClassName::instanceMethod
Function<String, String> toUpper = String::toUpperCase;
System.out.println(toUpper.apply("hello")); // HELLO

// Equivalent lambda
Function<String, String> toUpperLambda = s -> s.toUpperCase();

// 4. Constructor reference: ClassName::new
Supplier<ArrayList<String>> listFactory = ArrayList::new;
List<String> list = listFactory.get();

Function<Integer, ArrayList<String>> sizedListFactory = ArrayList::new;
List<String> sizedList = sizedListFactory.apply(100);
```

### Method Reference Examples

```java
// Static method references
List<String> numbers = Arrays.asList("1", "2", "3", "4", "5");

// Using Integer::parseInt
List<Integer> integers = numbers.stream()
    .map(Integer::parseInt)
    .collect(Collectors.toList());

// Using Math::abs
List<Integer> values = Arrays.asList(-1, -2, 3, -4, 5);
List<Integer> absolute = values.stream()
    .map(Math::abs)
    .collect(Collectors.toList());

// Instance method references
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// String::toLowerCase on each element
List<String> lowerNames = names.stream()
    .map(String::toLowerCase)
    .collect(Collectors.toList());

// System.out::println for each element
names.forEach(System.out::println);

// Instance method with specific object
StringBuilder sb = new StringBuilder();
names.forEach(sb::append);
System.out.println(sb.toString()); // AliceBobCharlie
```

### Constructor References

```java
// Simple constructor reference
Supplier<List<String>> listSupplier = ArrayList::new;
List<String> newList = listSupplier.get();

// Constructor with parameter
Function<String, StringBuilder> sbFactory = StringBuilder::new;
StringBuilder sb = sbFactory.apply("Initial");

// Array constructor reference
Function<Integer, String[]> arrayFactory = String[]::new;
String[] array = arrayFactory.apply(10);
System.out.println(array.length); // 10

// Using with Stream
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// Create Person objects from names
class Person {
    private String name;
    public Person(String name) { this.name = name; }
    public String getName() { return name; }
}

Function<String, Person> personFactory = Person::new;
List<Person> people = names.stream()
    .map(Person::new)
    .collect(Collectors.toList());

// Collecting to array using constructor reference
String[] nameArray = names.stream()
    .toArray(String[]::new);
```

### Choosing Between Lambda and Method Reference

```java
// Method reference preferred when simply delegating
list.forEach(System.out::println);        // Clear and concise
list.forEach(s -> System.out.println(s)); // More verbose

// Lambda preferred for complex logic
list.stream()
    .map(s -> s.substring(0, Math.min(s.length(), 10)))
    .forEach(System.out::println);

// Lambda preferred for clarity in some cases
BinaryOperator<Integer> add = Integer::sum;  // Less clear what sum does
BinaryOperator<Integer> add2 = (a, b) -> a + b; // Intent is obvious

// Method reference with specific instance
PrintStream out = System.out;
list.forEach(out::println);  // Works with specific instance
```

## Variable Capture and Scope

Lambdas can access variables from their enclosing scope, but with certain restrictions.

### Effectively Final Variables

```java
// Local variable capture - must be effectively final
String greeting = "Hello";  // effectively final
Consumer<String> greeter = name -> System.out.println(greeting + ", " + name);
greeter.accept("World"); // Hello, World

// This would cause a compile error:
// greeting = "Hi";  // Cannot modify - makes it not effectively final

// Capturing method parameters
public void processWithPrefix(String prefix, List<String> items) {
    // prefix is effectively final
    items.forEach(item -> System.out.println(prefix + item));
}
```

### Instance and Static Variables

```java
public class Counter {
    private int count = 0;          // Instance variable - can be modified
    private static int total = 0;   // Static variable - can be modified

    public void increment() {
        // Can access and modify instance/static variables
        Runnable r = () -> {
            count++;
            total++;
            System.out.println("Count: " + count + ", Total: " + total);
        };
        r.run();
    }

    public void process(List<String> items) {
        // Can modify instance variable in lambda
        items.forEach(item -> {
            count++;
            System.out.println(count + ": " + item);
        });
    }
}
```

### Working Around Final Restrictions

```java
// Using single-element arrays
public void processWithCounter(List<String> items) {
    int[] counter = {0};  // Array reference is final, contents can change
    items.forEach(item -> {
        counter[0]++;
        System.out.println(counter[0] + ": " + item);
    });
}

// Using AtomicInteger
public void processWithAtomicCounter(List<String> items) {
    AtomicInteger counter = new AtomicInteger(0);
    items.forEach(item -> {
        int current = counter.incrementAndGet();
        System.out.println(current + ": " + item);
    });
}

// Using a mutable container class
public void processWithHolder(List<String> items) {
    class Holder<T> {
        T value;
        Holder(T value) { this.value = value; }
    }

    Holder<Integer> counter = new Holder<>(0);
    items.forEach(item -> {
        counter.value++;
        System.out.println(counter.value + ": " + item);
    });
}
```

### Shadowing and Scope

```java
public class ScopeExample {
    private String name = "instance";

    public void demonstrateScope() {
        String name = "local";

        // Lambda can access enclosing scope
        Consumer<String> c1 = s -> {
            // 'name' here refers to local variable
            System.out.println(name);  // "local"

            // Access instance variable explicitly
            System.out.println(this.name);  // "instance"
        };

        // Lambda parameter can shadow local variable
        // (but this is usually confusing - avoid it)
        Consumer<String> c2 = name2 -> {
            // 'name2' is the parameter, 'name' is still local
            System.out.println(name2);
            System.out.println(name);
        };

        // Cannot redeclare variable from enclosing scope
        // This would not compile:
        // Consumer<String> c3 = name -> System.out.println(name);
    }

    public void thisKeyword() {
        // 'this' in lambda refers to enclosing class
        Runnable r = () -> {
            System.out.println(this.name);  // "instance"
            System.out.println(this.getClass().getName()); // ScopeExample
        };

        // Compare with anonymous class
        Runnable r2 = new Runnable() {
            @Override
            public void run() {
                // 'this' refers to anonymous class instance
                System.out.println(this.getClass().getName()); // ScopeExample$1
            }
        };
    }
}
```

## Lambda Expression Use Cases

### Event Handling

```java
// Swing button action
JButton button = new JButton("Click me");

// Before lambdas
button.addActionListener(new ActionListener() {
    @Override
    public void actionPerformed(ActionEvent e) {
        System.out.println("Button clicked!");
    }
});

// With lambda
button.addActionListener(e -> System.out.println("Button clicked!"));

// Multiple event handlers
button.addActionListener(e -> System.out.println("Handler 1"));
button.addActionListener(e -> System.out.println("Handler 2"));

// JavaFX event handling
Button fxButton = new Button("Click");
fxButton.setOnAction(e -> System.out.println("FX Button clicked!"));
```

### Threading

```java
// Creating threads
Thread thread1 = new Thread(() -> {
    for (int i = 0; i < 5; i++) {
        System.out.println("Thread 1: " + i);
    }
});

// Using ExecutorService
ExecutorService executor = Executors.newFixedThreadPool(4);

executor.submit(() -> {
    System.out.println("Task executing in: " + Thread.currentThread().getName());
    return "Result";
});

// Callable with lambda
Callable<Integer> task = () -> {
    Thread.sleep(1000);
    return 42;
};

Future<Integer> future = executor.submit(task);
System.out.println(future.get()); // 42

executor.shutdown();
```

### Comparators

```java
List<Person> people = Arrays.asList(
    new Person("Alice", 30),
    new Person("Bob", 25),
    new Person("Charlie", 35)
);

// Sort by name
people.sort((p1, p2) -> p1.getName().compareTo(p2.getName()));

// Using Comparator.comparing
people.sort(Comparator.comparing(Person::getName));

// Reverse order
people.sort(Comparator.comparing(Person::getName).reversed());

// Multiple criteria
people.sort(Comparator
    .comparing(Person::getAge)
    .thenComparing(Person::getName));

// Null-safe comparison
people.sort(Comparator
    .comparing(Person::getName, Comparator.nullsLast(String::compareTo)));

// Custom comparator with complex logic
Comparator<Person> customComparator = (p1, p2) -> {
    if (p1.getAge() < 30 && p2.getAge() >= 30) return -1;
    if (p1.getAge() >= 30 && p2.getAge() < 30) return 1;
    return p1.getName().compareTo(p2.getName());
};
```

### Callbacks and Strategy Pattern

```java
// Callback pattern
public interface DataCallback<T> {
    void onSuccess(T data);
    void onError(Exception e);
}

public void fetchDataAsync(DataCallback<String> callback) {
    new Thread(() -> {
        try {
            // Simulate async operation
            Thread.sleep(1000);
            callback.onSuccess("Data loaded!");
        } catch (Exception e) {
            callback.onError(e);
        }
    }).start();
}

// Usage with lambdas (using a wrapper)
fetchDataAsync(new DataCallback<String>() {
    @Override
    public void onSuccess(String data) {
        System.out.println("Success: " + data);
    }

    @Override
    public void onError(Exception e) {
        System.err.println("Error: " + e.getMessage());
    }
});

// Strategy pattern with lambdas
@FunctionalInterface
interface PricingStrategy {
    double calculatePrice(double basePrice);
}

class Order {
    private double basePrice;
    private PricingStrategy strategy;

    public Order(double basePrice, PricingStrategy strategy) {
        this.basePrice = basePrice;
        this.strategy = strategy;
    }

    public double getFinalPrice() {
        return strategy.calculatePrice(basePrice);
    }
}

// Different strategies as lambdas
PricingStrategy regularPrice = price -> price;
PricingStrategy memberDiscount = price -> price * 0.9;
PricingStrategy vipDiscount = price -> price * 0.8;
PricingStrategy blackFriday = price -> price * 0.5;

Order order1 = new Order(100, memberDiscount);
System.out.println(order1.getFinalPrice()); // 90.0
```

## Lambdas with Collections

### Iterating Collections

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// forEach with lambda
names.forEach(name -> System.out.println(name));

// forEach with method reference
names.forEach(System.out::println);

// Map iteration
Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 95);
scores.put("Bob", 87);
scores.put("Charlie", 92);

scores.forEach((name, score) ->
    System.out.println(name + ": " + score));
```

### Removing Elements

```java
List<Integer> numbers = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));

// removeIf with Predicate
numbers.removeIf(n -> n % 2 == 0);  // Remove even numbers
System.out.println(numbers); // [1, 3, 5, 7, 9]

// Remove null values
List<String> names = new ArrayList<>(Arrays.asList("Alice", null, "Bob", null, "Charlie"));
names.removeIf(Objects::isNull);
System.out.println(names); // [Alice, Bob, Charlie]
```

### Replacing Elements

```java
List<String> names = new ArrayList<>(Arrays.asList("alice", "bob", "charlie"));

// replaceAll with UnaryOperator
names.replaceAll(String::toUpperCase);
System.out.println(names); // [ALICE, BOB, CHARLIE]

// Custom transformation
names.replaceAll(name -> name.substring(0, 1) + name.substring(1).toLowerCase());
System.out.println(names); // [Alice, Bob, Charlie]
```

### Map Operations

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 85);
scores.put("Bob", 90);

// compute - update value based on key and current value
scores.compute("Alice", (key, value) -> value + 5);
System.out.println(scores.get("Alice")); // 90

// computeIfAbsent - set value only if key is absent
scores.computeIfAbsent("Charlie", key -> 100);
System.out.println(scores.get("Charlie")); // 100

// computeIfPresent - update only if key is present
scores.computeIfPresent("Bob", (key, value) -> value + 10);
System.out.println(scores.get("Bob")); // 100

// merge - combine new value with existing
scores.merge("Alice", 10, Integer::sum);
System.out.println(scores.get("Alice")); // 100

// getOrDefault
int score = scores.getOrDefault("David", 0);
System.out.println(score); // 0

// putIfAbsent
scores.putIfAbsent("Eve", 95);
```

### Sorting Collections

```java
List<Person> people = new ArrayList<>();
people.add(new Person("Charlie", 30));
people.add(new Person("Alice", 25));
people.add(new Person("Bob", 35));

// Sort with lambda
people.sort((p1, p2) -> p1.getName().compareTo(p2.getName()));

// Sort with Comparator.comparing
people.sort(Comparator.comparing(Person::getName));

// Sort with multiple criteria
people.sort(Comparator
    .comparing(Person::getAge)
    .thenComparing(Person::getName)
    .reversed());

// Sort a list of strings ignoring case
List<String> names = Arrays.asList("charlie", "Alice", "bob");
names.sort(String::compareToIgnoreCase);
```

## Exception Handling in Lambdas

### The Challenge with Checked Exceptions

```java
// This won't compile - IOException is checked
List<String> filePaths = Arrays.asList("file1.txt", "file2.txt");

// Compile error: Unhandled exception
// filePaths.forEach(path -> Files.readAllLines(Paths.get(path)));
```

### Handling Exceptions Within Lambda

```java
// Option 1: Try-catch inside lambda
List<String> filePaths = Arrays.asList("file1.txt", "file2.txt");

filePaths.forEach(path -> {
    try {
        List<String> lines = Files.readAllLines(Paths.get(path));
        lines.forEach(System.out::println);
    } catch (IOException e) {
        System.err.println("Error reading " + path + ": " + e.getMessage());
    }
});
```

### Creating Wrapper Functions

```java
// Generic wrapper for functions that throw exceptions
@FunctionalInterface
public interface ThrowingFunction<T, R, E extends Exception> {
    R apply(T t) throws E;
}

public static <T, R> Function<T, R> wrap(ThrowingFunction<T, R, Exception> f) {
    return t -> {
        try {
            return f.apply(t);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    };
}

// Usage
List<String> filePaths = Arrays.asList("file1.txt", "file2.txt");
List<List<String>> contents = filePaths.stream()
    .map(wrap(path -> Files.readAllLines(Paths.get(path))))
    .collect(Collectors.toList());
```

### Custom Functional Interfaces for Exceptions

```java
// Consumer that throws exception
@FunctionalInterface
public interface ThrowingConsumer<T, E extends Exception> {
    void accept(T t) throws E;
}

public static <T> Consumer<T> throwingConsumer(ThrowingConsumer<T, Exception> consumer) {
    return t -> {
        try {
            consumer.accept(t);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    };
}

// Usage
List<String> paths = Arrays.asList("file1.txt", "file2.txt");
paths.forEach(throwingConsumer(path -> {
    Files.delete(Paths.get(path));
}));
```

### Either Pattern for Error Handling

```java
public class Either<L, R> {
    private final L left;
    private final R right;

    private Either(L left, R right) {
        this.left = left;
        this.right = right;
    }

    public static <L, R> Either<L, R> left(L value) {
        return new Either<>(value, null);
    }

    public static <L, R> Either<L, R> right(R value) {
        return new Either<>(null, value);
    }

    public boolean isLeft() { return left != null; }
    public boolean isRight() { return right != null; }
    public L getLeft() { return left; }
    public R getRight() { return right; }
}

// Usage
public static <T, R> Function<T, Either<Exception, R>> lift(
        ThrowingFunction<T, R, Exception> f) {
    return t -> {
        try {
            return Either.right(f.apply(t));
        } catch (Exception e) {
            return Either.left(e);
        }
    };
}

List<String> paths = Arrays.asList("file1.txt", "file2.txt");
List<Either<Exception, List<String>>> results = paths.stream()
    .map(lift(path -> Files.readAllLines(Paths.get(path))))
    .collect(Collectors.toList());

// Process results
results.forEach(either -> {
    if (either.isRight()) {
        System.out.println("Success: " + either.getRight().size() + " lines");
    } else {
        System.err.println("Error: " + either.getLeft().getMessage());
    }
});
```

## Performance Considerations

### Lambda vs Anonymous Class

```java
// Lambdas are generally more efficient than anonymous classes
// - No additional .class file generated
// - Uses invokedynamic for efficient runtime binding
// - JVM can optimize lambda call sites

// Anonymous class - creates new class file
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println("Anonymous");
    }
};

// Lambda - uses invokedynamic
Runnable r2 = () -> System.out.println("Lambda");
```

### Avoiding Boxing Overhead

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// With boxing/unboxing overhead
int sum1 = numbers.stream()
    .reduce(0, (a, b) -> a + b);

// More efficient with primitive stream
int sum2 = numbers.stream()
    .mapToInt(Integer::intValue)
    .sum();

// Best: Use primitive stream from start
int sum3 = IntStream.of(1, 2, 3, 4, 5).sum();
```

### Reusing Lambda Instances

```java
// Lambda can be stored and reused
Predicate<String> notEmpty = s -> s != null && !s.isEmpty();

// Reused across multiple operations
list1.stream().filter(notEmpty).collect(Collectors.toList());
list2.stream().filter(notEmpty).collect(Collectors.toList());
list3.stream().filter(notEmpty).collect(Collectors.toList());

// Method reference creates single instance
Consumer<String> printer = System.out::println;
```

### Memory Considerations

```java
// Be careful with capturing variables
public class MemoryExample {
    public List<Runnable> createTasks() {
        List<Runnable> tasks = new ArrayList<>();

        for (int i = 0; i < 1000; i++) {
            final int taskId = i;
            // Each lambda captures taskId
            tasks.add(() -> System.out.println("Task: " + taskId));
        }

        return tasks;
    }

    // Capturing large objects can cause memory issues
    public Consumer<String> badPractice() {
        byte[] largeData = new byte[10_000_000];  // 10MB

        // Lambda captures reference to largeData
        // largeData won't be garbage collected while lambda exists
        return s -> {
            System.out.println(s + largeData.length);
        };
    }
}
```

## Best Practices

### Keep Lambdas Short and Simple

```java
// Good: Short, clear lambda
list.stream()
    .filter(s -> s.length() > 5)
    .map(String::toUpperCase)
    .forEach(System.out::println);

// Bad: Complex logic in lambda
list.stream()
    .filter(s -> {
        if (s == null) return false;
        if (s.isEmpty()) return false;
        if (s.length() < 3) return false;
        if (!Character.isUpperCase(s.charAt(0))) return false;
        return s.chars().allMatch(Character::isLetterOrDigit);
    })
    .forEach(System.out::println);

// Better: Extract to method
list.stream()
    .filter(this::isValidString)
    .forEach(System.out::println);

private boolean isValidString(String s) {
    if (s == null || s.isEmpty() || s.length() < 3) return false;
    if (!Character.isUpperCase(s.charAt(0))) return false;
    return s.chars().allMatch(Character::isLetterOrDigit);
}
```

### Use Method References When Appropriate

```java
// Prefer method references for simple delegation
list.forEach(System.out::println);           // Good
list.forEach(s -> System.out.println(s));    // Less concise

list.stream().map(String::toUpperCase);      // Good
list.stream().map(s -> s.toUpperCase());     // Less concise

// Use lambda when additional logic is needed
list.stream().map(s -> s.toUpperCase() + "!");  // Lambda needed
```

### Avoid Side Effects

```java
// Bad: Side effect in stream operation
List<String> results = new ArrayList<>();
list.stream()
    .filter(s -> s.length() > 3)
    .forEach(results::add);  // Side effect!

// Good: Use collect
List<String> results = list.stream()
    .filter(s -> s.length() > 3)
    .collect(Collectors.toList());
```

### Prefer Specific Functional Interfaces

```java
// Use specific interfaces when available
IntPredicate isPositive = n -> n > 0;           // Better for primitives
Predicate<Integer> isPositiveBoxed = n -> n > 0; // Boxing overhead

ToIntFunction<String> length = String::length;   // Returns primitive
Function<String, Integer> lengthBoxed = String::length; // Returns boxed
```

### Handle Null Values Properly

```java
// Null-safe lambda
Function<String, String> safeUpper = s ->
    s == null ? null : s.toUpperCase();

// Or use Optional
Function<String, Optional<String>> optionalUpper = s ->
    Optional.ofNullable(s).map(String::toUpperCase);

// Filter nulls in stream
list.stream()
    .filter(Objects::nonNull)
    .map(String::toUpperCase)
    .forEach(System.out::println);
```

### Name Complex Lambdas

```java
// Store complex lambdas in well-named variables
Predicate<Person> isAdultEmployee = person ->
    person.getAge() >= 18 &&
    person.getEmploymentStatus() == Status.EMPLOYED;

Comparator<Person> byAgeDescThenName = Comparator
    .comparing(Person::getAge)
    .reversed()
    .thenComparing(Person::getName);

// Use in stream
employees.stream()
    .filter(isAdultEmployee)
    .sorted(byAgeDescThenName)
    .forEach(System.out::println);
```

## Common Pitfalls

### Modifying Variables from Enclosing Scope

```java
// Won't compile - count must be effectively final
int count = 0;
list.forEach(item -> count++);  // Error!

// Workaround with AtomicInteger
AtomicInteger count = new AtomicInteger(0);
list.forEach(item -> count.incrementAndGet());
```

### Forgetting Stream is Consumed

```java
Stream<String> stream = list.stream().filter(s -> s.length() > 3);

long count = stream.count();
// stream is now closed!
// List<String> result = stream.collect(Collectors.toList()); // Error!

// Create new stream for each operation
long count = list.stream().filter(s -> s.length() > 3).count();
List<String> result = list.stream().filter(s -> s.length() > 3).collect(Collectors.toList());
```

### Incorrect Parallel Stream Usage

```java
// Dangerous: Non-thread-safe collection
List<String> results = new ArrayList<>();
list.parallelStream()
    .forEach(results::add);  // Race condition!

// Safe: Use thread-safe collector
List<String> results = list.parallelStream()
    .collect(Collectors.toList());
```

### Exception Handling Confusion

```java
// This won't work - forEach doesn't handle checked exceptions
// list.forEach(item -> Files.delete(Paths.get(item))); // Won't compile

// Need to wrap the exception
list.forEach(item -> {
    try {
        Files.delete(Paths.get(item));
    } catch (IOException e) {
        throw new RuntimeException(e);
    }
});
```

### Overusing Lambdas

```java
// Too many nested lambdas - hard to read
Function<String, Function<Integer, Function<Boolean, String>>> complex =
    s -> i -> b -> s + i + b;

// Better: Use clear method signatures
public String combine(String s, int i, boolean b) {
    return s + i + b;
}
```

### Ignoring Return Values

```java
// Wrong: replaceAll needs return value
List<String> names = new ArrayList<>(Arrays.asList("alice", "bob"));
names.replaceAll(name -> {
    System.out.println(name);  // Side effect only
    // Missing return - won't compile
});

// Correct
names.replaceAll(name -> {
    System.out.println(name);
    return name.toUpperCase();
});
```

## Conclusion

Lambda expressions are a powerful feature that enables functional programming in Java. They provide several key benefits:

- **Concise syntax** for implementing functional interfaces
- **Improved readability** by reducing boilerplate code
- **Better API design** with functional interfaces
- **Enhanced collection processing** with Stream API integration
- **Support for functional programming patterns**

Key takeaways:

- Use lambdas for short, focused operations
- Prefer method references when simply delegating to existing methods
- Understand variable capture and scope rules
- Handle exceptions appropriately within lambdas
- Avoid side effects in stream operations
- Consider performance implications with primitive streams

By mastering lambda expressions, you can write more expressive, maintainable, and efficient Java code while embracing modern functional programming paradigms.

## Further Reading

- [Java Lambda Expressions Documentation](https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html)
- [java.util.function Package Documentation](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/function/package-summary.html)
- [Effective Java by Joshua Bloch - Chapter 7: Lambdas and Streams](https://www.oreilly.com/library/view/effective-java/9780134686097/)
- [Modern Java in Action](https://www.manning.com/books/modern-java-in-action)
