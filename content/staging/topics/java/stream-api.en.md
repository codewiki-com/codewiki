---
title: Java Stream API
description: "Master Java Stream API: creation, intermediate operations, terminal operations and parallel streams"
track: java
section: collections-streams
difficulty: intermediate
tags:
  - Java
  - Stream
  - Functional Programming
  - Lambda
status: imported
origin: old/src/content/docs/java/stream-api.en.md
divergence: 0.243
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Java
  subcategory: Java 8+
  order: 7
  lastUpdated: 2026-01-07
---

The Java Stream API, introduced in Java 8, provides a powerful and expressive way to process collections of data using functional programming concepts. Streams allow you to write cleaner, more readable code for data manipulation tasks.

## What is a Stream?

A Stream is a sequence of elements that supports sequential and parallel aggregate operations. Key characteristics:

- **Not a data structure**: Streams don't store data; they convey elements from a source
- **Functional in nature**: Operations on streams produce results but don't modify the source
- **Lazy evaluation**: Intermediate operations are not executed until a terminal operation is invoked
- **Possibly unbounded**: Streams can be infinite
- **Consumable**: Stream elements can only be visited once

```java
// Traditional approach
List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");
List<String> filteredNames = new ArrayList<>();
for (String name : names) {
    if (name.length() > 3) {
        filteredNames.add(name.toUpperCase());
    }
}
Collections.sort(filteredNames);

// Stream API approach
List<String> result = names.stream()
    .filter(name -> name.length() > 3)
    .map(String::toUpperCase)
    .sorted()
    .collect(Collectors.toList());
```

## Stream Creation

There are multiple ways to create streams in Java:

### From Collections

```java
// From List
List<String> list = Arrays.asList("a", "b", "c");
Stream<String> streamFromList = list.stream();

// From Set
Set<Integer> set = new HashSet<>(Arrays.asList(1, 2, 3));
Stream<Integer> streamFromSet = set.stream();

// From Map
Map<String, Integer> map = new HashMap<>();
map.put("one", 1);
map.put("two", 2);
Stream<Map.Entry<String, Integer>> streamFromMap = map.entrySet().stream();
```

### From Arrays

```java
// Using Arrays.stream()
String[] array = {"a", "b", "c"};
Stream<String> streamFromArray = Arrays.stream(array);

// Using Stream.of()
Stream<String> streamOf = Stream.of("a", "b", "c");

// Primitive streams
int[] numbers = {1, 2, 3, 4, 5};
IntStream intStream = Arrays.stream(numbers);
```

### Using Stream Builders

```java
// Stream.builder()
Stream<String> streamBuilder = Stream.<String>builder()
    .add("a")
    .add("b")
    .add("c")
    .build();

// Stream.generate() - infinite stream
Stream<Double> randomNumbers = Stream.generate(Math::random)
    .limit(10);

// Stream.iterate() - infinite stream
Stream<Integer> evenNumbers = Stream.iterate(0, n -> n + 2)
    .limit(10);
```

### From Files

```java
// Reading lines from a file
try (Stream<String> lines = Files.lines(Paths.get("file.txt"))) {
    lines.forEach(System.out::println);
} catch (IOException e) {
    e.printStackTrace();
}
```

### Primitive Streams

```java
// IntStream, LongStream, DoubleStream
IntStream intStream = IntStream.range(1, 10);        // 1 to 9
IntStream intStreamClosed = IntStream.rangeClosed(1, 10);  // 1 to 10

LongStream longStream = LongStream.of(1L, 2L, 3L);
DoubleStream doubleStream = DoubleStream.of(1.0, 2.0, 3.0);
```

## Intermediate Operations

Intermediate operations return a new stream and are lazy (not executed until a terminal operation is called). They can be chained together.

### filter()

Filters elements based on a predicate.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// Get even numbers
List<Integer> evenNumbers = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());
// Result: [2, 4, 6, 8, 10]

// Multiple filters
List<Integer> filtered = numbers.stream()
    .filter(n -> n > 3)
    .filter(n -> n < 8)
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());
// Result: [4, 6]
```

### map()

Transforms each element using a function.

```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

// Convert to uppercase
List<String> upperCaseNames = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList());
// Result: ["ALICE", "BOB", "CHARLIE"]

// Get lengths
List<Integer> nameLengths = names.stream()
    .map(String::length)
    .collect(Collectors.toList());
// Result: [5, 3, 7]

// Complex transformation
List<Person> people = Arrays.asList(
    new Person("Alice", 25),
    new Person("Bob", 30)
);

List<String> descriptions = people.stream()
    .map(p -> p.getName() + " is " + p.getAge() + " years old")
    .collect(Collectors.toList());
```

### flatMap()

Flattens nested structures into a single stream.

```java
// Flatten list of lists
List<List<Integer>> listOfLists = Arrays.asList(
    Arrays.asList(1, 2, 3),
    Arrays.asList(4, 5, 6),
    Arrays.asList(7, 8, 9)
);

List<Integer> flatList = listOfLists.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList());
// Result: [1, 2, 3, 4, 5, 6, 7, 8, 9]

// Split strings into words
List<String> sentences = Arrays.asList("Hello World", "Java Stream API");
List<String> words = sentences.stream()
    .flatMap(sentence -> Arrays.stream(sentence.split(" ")))
    .collect(Collectors.toList());
// Result: ["Hello", "World", "Java", "Stream", "API"]

// Flatten Optional values
List<Optional<String>> optionals = Arrays.asList(
    Optional.of("a"),
    Optional.empty(),
    Optional.of("b")
);

List<String> values = optionals.stream()
    .flatMap(Optional::stream)
    .collect(Collectors.toList());
// Result: ["a", "b"]
```

### distinct()

Removes duplicate elements.

```java
List<Integer> numbers = Arrays.asList(1, 2, 2, 3, 3, 3, 4, 5, 5);

List<Integer> uniqueNumbers = numbers.stream()
    .distinct()
    .collect(Collectors.toList());
// Result: [1, 2, 3, 4, 5]

// With custom objects (requires proper equals/hashCode)
List<Person> people = Arrays.asList(
    new Person("Alice", 25),
    new Person("Bob", 30),
    new Person("Alice", 25)
);

List<Person> uniquePeople = people.stream()
    .distinct()
    .collect(Collectors.toList());
```

### sorted()

Sorts elements in natural order or using a comparator.

```java
List<Integer> numbers = Arrays.asList(5, 3, 8, 1, 9, 2);

// Natural order
List<Integer> sorted = numbers.stream()
    .sorted()
    .collect(Collectors.toList());
// Result: [1, 2, 3, 5, 8, 9]

// Reverse order
List<Integer> sortedReverse = numbers.stream()
    .sorted(Comparator.reverseOrder())
    .collect(Collectors.toList());
// Result: [9, 8, 5, 3, 2, 1]

// Custom comparator
List<Person> people = Arrays.asList(
    new Person("Charlie", 25),
    new Person("Alice", 30),
    new Person("Bob", 25)
);

List<Person> sortedByName = people.stream()
    .sorted(Comparator.comparing(Person::getName))
    .collect(Collectors.toList());

// Multiple comparators
List<Person> sortedByAgeAndName = people.stream()
    .sorted(Comparator.comparing(Person::getAge)
                      .thenComparing(Person::getName))
    .collect(Collectors.toList());
```

### peek()

Performs an action on each element without modifying the stream (useful for debugging).

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

List<Integer> result = numbers.stream()
    .peek(n -> System.out.println("Original: " + n))
    .map(n -> n * 2)
    .peek(n -> System.out.println("After map: " + n))
    .filter(n -> n > 5)
    .peek(n -> System.out.println("After filter: " + n))
    .collect(Collectors.toList());
```

### limit() and skip()

Control the size and starting point of the stream.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// Take first 5 elements
List<Integer> first5 = numbers.stream()
    .limit(5)
    .collect(Collectors.toList());
// Result: [1, 2, 3, 4, 5]

// Skip first 5 elements
List<Integer> after5 = numbers.stream()
    .skip(5)
    .collect(Collectors.toList());
// Result: [6, 7, 8, 9, 10]

// Pagination: skip 5, take 3
List<Integer> page = numbers.stream()
    .skip(5)
    .limit(3)
    .collect(Collectors.toList());
// Result: [6, 7, 8]
```

### takeWhile() and dropWhile()

Take or drop elements based on a predicate (Java 9+).

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 4, 3, 2, 1);

// Take while condition is true
List<Integer> taken = numbers.stream()
    .takeWhile(n -> n < 5)
    .collect(Collectors.toList());
// Result: [1, 2, 3, 4]

// Drop while condition is true
List<Integer> dropped = numbers.stream()
    .dropWhile(n -> n < 5)
    .collect(Collectors.toList());
// Result: [5, 4, 3, 2, 1]
```

## Terminal Operations

Terminal operations trigger the processing of the stream and produce a result. After a terminal operation, the stream is consumed and cannot be reused.

### forEach() and forEachOrdered()

Performs an action for each element.

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// forEach (order not guaranteed in parallel streams)
names.stream()
    .forEach(System.out::println);

// forEachOrdered (maintains order even in parallel streams)
names.parallelStream()
    .forEachOrdered(System.out::println);

// With side effects (not recommended)
List<String> result = new ArrayList<>();
names.stream()
    .forEach(result::add);
```

### collect()

Accumulates elements into a collection or other data structure.

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// To List
List<String> list = names.stream()
    .collect(Collectors.toList());

// To Set
Set<String> set = names.stream()
    .collect(Collectors.toSet());

// To specific collection
LinkedList<String> linkedList = names.stream()
    .collect(Collectors.toCollection(LinkedList::new));

// To array
String[] array = names.stream()
    .toArray(String[]::new);
```

### reduce()

Combines elements using an associative accumulation function.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// Sum
Optional<Integer> sum = numbers.stream()
    .reduce((a, b) -> a + b);
// Or with method reference
Optional<Integer> sum2 = numbers.stream()
    .reduce(Integer::sum);

// With identity value
Integer sumWithIdentity = numbers.stream()
    .reduce(0, (a, b) -> a + b);
// Result: 15

// Product
Integer product = numbers.stream()
    .reduce(1, (a, b) -> a * b);
// Result: 120

// Find max
Optional<Integer> max = numbers.stream()
    .reduce(Integer::max);

// String concatenation
List<String> words = Arrays.asList("Hello", "World", "From", "Java");
String sentence = words.stream()
    .reduce("", (a, b) -> a + " " + b)
    .trim();
// Result: "Hello World From Java"
```

### count()

Returns the count of elements in the stream.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

long count = numbers.stream()
    .filter(n -> n > 2)
    .count();
// Result: 3
```

### min() and max()

Finds the minimum or maximum element.

```java
List<Integer> numbers = Arrays.asList(5, 3, 8, 1, 9, 2);

Optional<Integer> min = numbers.stream()
    .min(Integer::compareTo);
// Result: Optional[1]

Optional<Integer> max = numbers.stream()
    .max(Integer::compareTo);
// Result: Optional[9]

// With custom comparator
List<Person> people = Arrays.asList(
    new Person("Alice", 25),
    new Person("Bob", 30),
    new Person("Charlie", 20)
);

Optional<Person> youngest = people.stream()
    .min(Comparator.comparing(Person::getAge));
// Result: Optional[Charlie (20)]
```

### anyMatch(), allMatch(), noneMatch()

Check if elements match a predicate.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// Check if any element is even
boolean hasEven = numbers.stream()
    .anyMatch(n -> n % 2 == 0);
// Result: true

// Check if all elements are positive
boolean allPositive = numbers.stream()
    .allMatch(n -> n > 0);
// Result: true

// Check if no element is greater than 10
boolean noneGreaterThan10 = numbers.stream()
    .noneMatch(n -> n > 10);
// Result: true

// Short-circuiting behavior
List<Integer> largeList = IntStream.range(1, 1_000_000)
    .boxed()
    .collect(Collectors.toList());

boolean hasMatch = largeList.stream()
    .anyMatch(n -> n == 500);
// Stops after finding first match
```

### findFirst() and findAny()

Finds an element in the stream.

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// Find first element
Optional<Integer> first = numbers.stream()
    .findFirst();
// Result: Optional[1]

// Find first even number
Optional<Integer> firstEven = numbers.stream()
    .filter(n -> n % 2 == 0)
    .findFirst();
// Result: Optional[2]

// Find any (useful in parallel streams)
Optional<Integer> any = numbers.parallelStream()
    .filter(n -> n > 3)
    .findAny();
// Result: Optional[4] or Optional[5] (non-deterministic)
```

### sum(), average(), summaryStatistics()

Aggregate operations for primitive streams.

```java
IntStream numbers = IntStream.of(1, 2, 3, 4, 5);

// Sum
int sum = numbers.sum();
// Result: 15

// Average
OptionalDouble average = IntStream.of(1, 2, 3, 4, 5)
    .average();
// Result: OptionalDouble[3.0]

// Summary statistics
IntSummaryStatistics stats = IntStream.of(1, 2, 3, 4, 5)
    .summaryStatistics();

System.out.println("Count: " + stats.getCount());      // 5
System.out.println("Sum: " + stats.getSum());          // 15
System.out.println("Min: " + stats.getMin());          // 1
System.out.println("Max: " + stats.getMax());          // 5
System.out.println("Average: " + stats.getAverage());  // 3.0
```

## Optional Class

The `Optional` class is a container object that may or may not contain a non-null value. It's commonly used with Stream operations to avoid `NullPointerException`.

### Creating Optional

```java
// Empty Optional
Optional<String> empty = Optional.empty();

// Optional with value
Optional<String> optional = Optional.of("value");

// Optional that may be null
Optional<String> nullable = Optional.ofNullable(null);
```

### Checking and Retrieving Values

```java
Optional<String> optional = Optional.of("value");

// Check if value is present
if (optional.isPresent()) {
    System.out.println(optional.get());
}

// Modern approach (Java 11+)
if (optional.isEmpty()) {
    System.out.println("Empty");
}

// ifPresent with consumer
optional.ifPresent(System.out::println);

// ifPresentOrElse (Java 9+)
optional.ifPresentOrElse(
    value -> System.out.println("Value: " + value),
    () -> System.out.println("Empty")
);
```

### Default Values

```java
Optional<String> optional = Optional.empty();

// orElse - provides default value
String value1 = optional.orElse("default");
// Result: "default"

// orElseGet - provides default value from supplier
String value2 = optional.orElseGet(() -> "computed default");

// orElseThrow - throws exception if empty
String value3 = optional.orElseThrow();
// Or with custom exception
String value4 = optional.orElseThrow(() -> new RuntimeException("No value"));
```

### Transforming Optional

```java
Optional<String> optional = Optional.of("value");

// map - transforms the value
Optional<Integer> length = optional.map(String::length);
// Result: Optional[5]

// flatMap - for nested Optionals
Optional<Optional<String>> nested = Optional.of(Optional.of("value"));
Optional<String> flattened = nested.flatMap(o -> o);

// filter - filters the value
Optional<String> filtered = optional.filter(s -> s.length() > 3);
// Result: Optional[value]
```

### Optional in Streams

```java
List<Optional<String>> optionals = Arrays.asList(
    Optional.of("a"),
    Optional.empty(),
    Optional.of("b"),
    Optional.empty(),
    Optional.of("c")
);

// Filter and extract present values
List<String> values = optionals.stream()
    .filter(Optional::isPresent)
    .map(Optional::get)
    .collect(Collectors.toList());
// Result: ["a", "b", "c"]

// Using flatMap (Java 9+)
List<String> values2 = optionals.stream()
    .flatMap(Optional::stream)
    .collect(Collectors.toList());
// Result: ["a", "b", "c"]
```

## Collectors

The `Collectors` class provides various reduction operations for collecting stream elements.

### Basic Collectors

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");

// toList
List<String> list = names.stream()
    .collect(Collectors.toList());

// toSet
Set<String> set = names.stream()
    .collect(Collectors.toSet());

// toMap
Map<String, Integer> nameToLength = names.stream()
    .collect(Collectors.toMap(
        name -> name,
        String::length
    ));
// Result: {Alice=5, Bob=3, Charlie=7, David=5}

// Handle duplicate keys
Map<Integer, String> lengthToName = names.stream()
    .collect(Collectors.toMap(
        String::length,
        name -> name,
        (existing, replacement) -> existing + ", " + replacement
    ));
// Result: {3=Bob, 5=Alice, David, 7=Charlie}
```

### Joining

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// Simple joining
String joined = names.stream()
    .collect(Collectors.joining());
// Result: "AliceBobCharlie"

// With delimiter
String joinedWithComma = names.stream()
    .collect(Collectors.joining(", "));
// Result: "Alice, Bob, Charlie"

// With delimiter, prefix, and suffix
String formatted = names.stream()
    .collect(Collectors.joining(", ", "[", "]"));
// Result: "[Alice, Bob, Charlie]"
```

### Counting and Summing

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// Counting
long count = numbers.stream()
    .collect(Collectors.counting());
// Result: 5

// Summing
int sum = numbers.stream()
    .collect(Collectors.summingInt(Integer::intValue));
// Result: 15

// Averaging
double average = numbers.stream()
    .collect(Collectors.averagingInt(Integer::intValue));
// Result: 3.0

// Summary statistics
IntSummaryStatistics stats = numbers.stream()
    .collect(Collectors.summarizingInt(Integer::intValue));
```

### Grouping

```java
List<Person> people = Arrays.asList(
    new Person("Alice", 25),
    new Person("Bob", 30),
    new Person("Charlie", 25),
    new Person("David", 30),
    new Person("Eve", 35)
);

// Group by age
Map<Integer, List<Person>> byAge = people.stream()
    .collect(Collectors.groupingBy(Person::getAge));
// Result: {25=[Alice, Charlie], 30=[Bob, David], 35=[Eve]}

// Group by age with counting
Map<Integer, Long> countByAge = people.stream()
    .collect(Collectors.groupingBy(
        Person::getAge,
        Collectors.counting()
    ));
// Result: {25=2, 30=2, 35=1}

// Group by age, collect names
Map<Integer, List<String>> namesByAge = people.stream()
    .collect(Collectors.groupingBy(
        Person::getAge,
        Collectors.mapping(Person::getName, Collectors.toList())
    ));
// Result: {25=[Alice, Charlie], 30=[Bob, David], 35=[Eve]}

// Multi-level grouping
Map<Integer, Map<String, List<Person>>> multiLevel = people.stream()
    .collect(Collectors.groupingBy(
        Person::getAge,
        Collectors.groupingBy(p -> p.getName().substring(0, 1))
    ));
```

### Partitioning

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// Partition by even/odd
Map<Boolean, List<Integer>> partitioned = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0));
// Result: {false=[1, 3, 5, 7, 9], true=[2, 4, 6, 8, 10]}

// Partition with downstream collector
Map<Boolean, Long> countByParity = numbers.stream()
    .collect(Collectors.partitioningBy(
        n -> n % 2 == 0,
        Collectors.counting()
    ));
// Result: {false=5, true=5}
```

### Custom Collectors

```java
// Using toCollection
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

TreeSet<String> treeSet = names.stream()
    .collect(Collectors.toCollection(TreeSet::new));

// Using collectingAndThen
String result = names.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.toList(),
        list -> String.join(", ", list)
    ));

// Custom collector with Collector.of()
Collector<String, StringBuilder, String> customCollector = Collector.of(
    StringBuilder::new,                    // supplier
    StringBuilder::append,                 // accumulator
    StringBuilder::append,                 // combiner
    StringBuilder::toString                // finisher
);

String concatenated = names.stream()
    .collect(customCollector);
```

## Parallel Streams

Parallel streams allow you to leverage multi-core processors for faster processing of large datasets.

### Creating Parallel Streams

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// From collection
Stream<Integer> parallelStream = numbers.parallelStream();

// Convert sequential to parallel
Stream<Integer> parallel = numbers.stream().parallel();

// Check if stream is parallel
boolean isParallel = parallelStream.isParallel();
// Result: true

// Convert parallel to sequential
Stream<Integer> sequential = parallelStream.sequential();
```

### When to Use Parallel Streams

```java
// Good use case: CPU-intensive operations on large datasets
List<Integer> largeList = IntStream.range(1, 1_000_000)
    .boxed()
    .collect(Collectors.toList());

// Sequential
long start = System.currentTimeMillis();
long sum = largeList.stream()
    .mapToInt(Integer::intValue)
    .map(n -> n * n)
    .sum();
long sequential Time = System.currentTimeMillis() - start;

// Parallel
start = System.currentTimeMillis();
sum = largeList.parallelStream()
    .mapToInt(Integer::intValue)
    .map(n -> n * n)
    .sum();
long parallelTime = System.currentTimeMillis() - start;

System.out.println("Sequential: " + sequentialTime + "ms");
System.out.println("Parallel: " + parallelTime + "ms");
```

### Parallel Stream Considerations

```java
// Thread safety issues
List<Integer> numbers = IntStream.range(1, 1000)
    .boxed()
    .collect(Collectors.toList());

// BAD: Not thread-safe
List<Integer> resultList = new ArrayList<>();
numbers.parallelStream()
    .forEach(resultList::add);  // Race condition!

// GOOD: Use concurrent collection
List<Integer> safeList = new CopyOnWriteArrayList<>();
numbers.parallelStream()
    .forEach(safeList::add);

// BETTER: Use collect
List<Integer> bestList = numbers.parallelStream()
    .collect(Collectors.toList());

// Order preservation
numbers.parallelStream()
    .forEach(System.out::println);  // Order not guaranteed

numbers.parallelStream()
    .forEachOrdered(System.out::println);  // Order preserved
```

### Controlling Parallelism

```java
// By default, parallel streams use ForkJoinPool.commonPool()
// Number of threads = number of processors - 1

// Check available processors
int processors = Runtime.getRuntime().availableProcessors();
System.out.println("Available processors: " + processors);

// Custom ForkJoinPool (advanced)
ForkJoinPool customPool = new ForkJoinPool(4);
try {
    long sum = customPool.submit(() ->
        IntStream.range(1, 1_000_000)
            .parallel()
            .sum()
    ).get();
    System.out.println("Sum: " + sum);
} catch (InterruptedException | ExecutionException e) {
    e.printStackTrace();
} finally {
    customPool.shutdown();
}
```

### Performance Guidelines

```java
// Good candidates for parallel streams:
// 1. Large datasets (thousands of elements)
// 2. CPU-intensive operations
// 3. Independent operations (no shared state)

// Poor candidates:
// 1. Small datasets (overhead > benefit)
// 2. I/O operations (threads waiting)
// 3. Operations with side effects

// Example: File processing (sequential better)
try (Stream<String> lines = Files.lines(Paths.get("file.txt"))) {
    long count = lines
        .filter(line -> line.contains("error"))
        .count();
    // Don't use parallel() here - I/O bound
} catch (IOException e) {
    e.printStackTrace();
}

// Example: Mathematical computation (parallel better)
List<Double> numbers = IntStream.range(1, 1_000_000)
    .mapToDouble(i -> (double) i)
    .boxed()
    .collect(Collectors.toList());

double result = numbers.parallelStream()
    .map(Math::sqrt)
    .map(Math::log)
    .reduce(0.0, Double::sum);
```

## Best Practices

### Use Method References

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// Less readable
names.stream()
    .map(name -> name.toUpperCase())
    .forEach(name -> System.out.println(name));

// More readable
names.stream()
    .map(String::toUpperCase)
    .forEach(System.out::println);
```

### Avoid Side Effects

```java
// BAD: Side effects in stream operations
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
List<Integer> result = new ArrayList<>();

numbers.stream()
    .filter(n -> n % 2 == 0)
    .forEach(result::add);  // Side effect!

// GOOD: Use collect
List<Integer> result2 = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());
```

### Handle Empty Streams

```java
List<Integer> numbers = new ArrayList<>();

// BAD: May throw NoSuchElementException
// int max = numbers.stream().max(Integer::compareTo).get();

// GOOD: Use Optional properly
Optional<Integer> max = numbers.stream().max(Integer::compareTo);
int maxValue = max.orElse(0);

// Or
int maxValue2 = numbers.stream()
    .max(Integer::compareTo)
    .orElseGet(() -> 0);
```

### Choose Appropriate Stream Type

```java
// Use primitive streams for better performance
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// Less efficient
int sum = numbers.stream()
    .reduce(0, Integer::sum);

// More efficient
int sum2 = numbers.stream()
    .mapToInt(Integer::intValue)
    .sum();

// Best
int sum3 = IntStream.of(1, 2, 3, 4, 5)
    .sum();
```

### Don't Reuse Streams

```java
// BAD: Stream can only be consumed once
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
Stream<Integer> stream = numbers.stream();

long count = stream.count();
// IllegalStateException: stream has already been operated upon or closed
// long sum = stream.mapToInt(Integer::intValue).sum();

// GOOD: Create new stream for each operation
long count2 = numbers.stream().count();
long sum = numbers.stream().mapToInt(Integer::intValue).sum();
```

### Be Careful with Parallel Streams

```java
// Consider these factors before using parallel streams:
// - Dataset size (large enough to benefit)
// - Operation cost (expensive enough to parallelize)
// - Source characteristics (easily splittable)
// - Terminal operation (allows parallel execution)

List<Integer> numbers = IntStream.range(1, 1000)
    .boxed()
    .collect(Collectors.toList());

// Small dataset - sequential is faster
numbers.stream().count();

// Large dataset with expensive operation - parallel may be faster
List<Integer> largeList = IntStream.range(1, 10_000_000)
    .boxed()
    .collect(Collectors.toList());

largeList.parallelStream()
    .map(n -> expensiveOperation(n))
    .collect(Collectors.toList());
```

### Use Appropriate Collectors

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// Good: Simple joining
String joined = names.stream()
    .collect(Collectors.joining(", "));

// Avoid: Manual string concatenation in reduce
String joined2 = names.stream()
    .reduce("", (a, b) -> a.isEmpty() ? b : a + ", " + b);
```

### Keep Operations Stateless

```java
// BAD: Stateful lambda
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
int[] sum = {0};

numbers.stream()
    .forEach(n -> sum[0] += n);  // Modifies external state

// GOOD: Stateless operation
int total = numbers.stream()
    .mapToInt(Integer::intValue)
    .sum();
```

## Common Patterns and Examples

### Find and Transform

```java
class Product {
    private String name;
    private double price;
    private String category;

    // Constructor, getters, setters
}

List<Product> products = Arrays.asList(
    new Product("Laptop", 999.99, "Electronics"),
    new Product("Phone", 699.99, "Electronics"),
    new Product("Desk", 299.99, "Furniture"),
    new Product("Chair", 199.99, "Furniture")
);

// Find most expensive product
Optional<Product> mostExpensive = products.stream()
    .max(Comparator.comparing(Product::getPrice));

// Get products by category
Map<String, List<Product>> byCategory = products.stream()
    .collect(Collectors.groupingBy(Product::getCategory));

// Get average price by category
Map<String, Double> avgPriceByCategory = products.stream()
    .collect(Collectors.groupingBy(
        Product::getCategory,
        Collectors.averagingDouble(Product::getPrice)
    ));

// Find products in price range
List<Product> inRange = products.stream()
    .filter(p -> p.getPrice() >= 200 && p.getPrice() <= 700)
    .collect(Collectors.toList());
```

### String Processing

```java
String text = "The quick brown fox jumps over the lazy dog";

// Word frequency
Map<String, Long> wordFrequency = Arrays.stream(text.split(" "))
    .collect(Collectors.groupingBy(
        String::toLowerCase,
        Collectors.counting()
    ));

// Find longest word
Optional<String> longestWord = Arrays.stream(text.split(" "))
    .max(Comparator.comparing(String::length));

// Get unique characters
Set<Character> uniqueChars = text.chars()
    .mapToObj(c -> (char) c)
    .filter(Character::isLetter)
    .map(Character::toLowerCase)
    .collect(Collectors.toSet());
```

### Data Aggregation

```java
class Transaction {
    private String id;
    private double amount;
    private LocalDate date;
    private String type;

    // Constructor, getters, setters
}

List<Transaction> transactions = Arrays.asList(
    new Transaction("T1", 100.0, LocalDate.of(2026, 1, 1), "CREDIT"),
    new Transaction("T2", 50.0, LocalDate.of(2026, 1, 2), "DEBIT"),
    new Transaction("T3", 200.0, LocalDate.of(2026, 1, 3), "CREDIT")
);

// Total amount by type
Map<String, Double> totalByType = transactions.stream()
    .collect(Collectors.groupingBy(
        Transaction::getType,
        Collectors.summingDouble(Transaction::getAmount)
    ));

// Transactions by month
Map<Month, List<Transaction>> byMonth = transactions.stream()
    .collect(Collectors.groupingBy(
        t -> t.getDate().getMonth()
    ));

// Summary statistics
DoubleSummaryStatistics stats = transactions.stream()
    .mapToDouble(Transaction::getAmount)
    .summaryStatistics();
```

## Conclusion

The Java Stream API is a powerful tool for processing collections in a functional and declarative manner. Key takeaways:

- **Streams don't store data** - they process data from sources
- **Operations are lazy** - only executed when needed
- **Streams are consumable** - can only be used once
- **Use parallel streams wisely** - only for large datasets with CPU-intensive operations
- **Avoid side effects** - keep operations pure and stateless
- **Use appropriate collectors** - they provide powerful reduction operations

By mastering the Stream API, you can write more concise, readable, and maintainable Java code while potentially improving performance through parallelization.

## Further Reading

- [Java Stream API Documentation](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/stream/package-summary.html)
- [Effective Java by Joshua Bloch](https://www.oreilly.com/library/view/effective-java/9780134686097/)
- [Java 8 in Action](https://www.manning.com/books/java-8-in-action)
