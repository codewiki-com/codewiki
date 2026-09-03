---
title: Java 21 LTS 新特性全解析
description: 深入剖析 Java 21 LTS 核心新特性：虚拟线程、结构化并发、模式匹配 Switch、记录模式、字符串模板
track: java
section: basics
difficulty: advanced
tags:
  - Java
  - Java 21
  - LTS
  - 虚拟线程
  - 模式匹配
  - 记录模式
status: imported
origin: old/src/content/docs/java/java21-features.en.md
divergence: 0.215
issues:
  - title-lang-en
  - title-language
legacy:
  category: Java
  subcategory: 新特性
  order: 20
  lastUpdated: 2026-01-07
---

Java 21 is the next Long-Term Support (LTS) version after Java 17, released in September 2023. This version brings several revolutionary features that fundamentally change Java's concurrent programming model and language expressiveness. We analyze in depth the five most important features in Java 21: Virtual Threads, Structured Concurrency, Pattern Matching for Switch, Record Patterns, and String Templates.

## Concept Explanation

### What is Java 21 LTS

Java 21 is Oracle's Long-Term Support version, meaning it will receive at least 8 years of security updates and technical support. For enterprise applications, choosing an LTS version ensures stability and long-term maintainability.

The core features introduced in Java 21 include:

| Feature | JEP Number | Status | Description |
|---------|------------|--------|-------------|
| **Virtual Threads** | JEP 444 | Final | Lightweight threads that significantly improve concurrency performance |
| **Structured Concurrency** | JEP 453 | Preview | Simplifies management and cancellation of multi-threaded tasks |
| **Pattern Matching for Switch** | JEP 441 | Final | Enhances pattern matching capabilities of switch expressions |
| **Record Patterns** | JEP 440 | Final | Powerful patterns for destructuring Record types |
| **String Templates** | JEP 430 | Preview | Safer and more flexible string interpolation |

### Why These Features Matter

**Concurrent Programming Revolution**: Virtual threads and structured concurrency address the fundamental problems of Java's traditional thread model - threads are expensive resources and difficult to manage. Now you can easily create millions of concurrent tasks.

**Enhanced Type Safety**: Pattern Matching for Switch and Record Patterns make code more concise and type-safe, eliminating a lot of boilerplate code and potential runtime errors.

**Modernized String Handling**: String templates provide a safe string interpolation mechanism, preventing security issues like SQL injection.

## Core Principles

### How Virtual Threads Work

Virtual Threads employ an M:N scheduling model, mapping many virtual threads to a small number of platform threads (carrier threads).

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌────────┐ ┌────────┐ ┌────────┐      ┌────────┐          │
│  │VThread1│ │VThread2│ │VThread3│ ... │VThreadN│          │
│  └───┬────┘ └───┬────┘ └───┬────┘      └───┬────┘          │
├──────┼─────────┼─────────┼──────────────┼──────────────────┤
│      └─────────┴─────────┴──────────────┘                   │
│                        ↓                                     │
│              JVM Virtual Thread Scheduler                    │
│           (ForkJoinPool Work-Stealing)                       │
├─────────────────────────────────────────────────────────────┤
│                     Carrier Thread Layer                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │Carrier1│ │Carrier2│ │Carrier3│ │Carrier4│               │
│  │(Platform│ │(Platform│ │(Platform│ │(Platform│               │
│  │ Thread) │ │ Thread) │ │ Thread) │ │ Thread) │               │
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘               │
├──────┴─────────┴─────────┴─────────┴───────────────────────┤
│                     OS Scheduler                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Mechanisms**:

1. **Mount/Unmount**: When a virtual thread executes blocking I/O, it "unmounts" from the carrier thread, allowing the carrier thread to execute other virtual threads
2. **Continuation**: The execution state of virtual threads is stored in heap memory and can be suspended and resumed at any time
3. **Work-Stealing**: The scheduler uses ForkJoinPool's work-stealing algorithm to efficiently utilize CPU resources

### Pattern Matching Type System

Pattern Matching for Switch is based on Java's type system subtyping relationships, performing exhaustiveness checking at compile time:

```java
// The compiler checks all possible types
sealed interface Shape permits Circle, Rectangle, Triangle {}

String describe(Shape shape) {
    return switch (shape) {
        case Circle c    -> "Circle, radius: " + c.radius();
        case Rectangle r -> "Rectangle, width: " + r.width() + ", height: " + r.height();
        case Triangle t  -> "Triangle";
        // No default needed because sealed types guarantee exhaustiveness
    };
}
```

### String Template Processing Flow

String Templates are split into string fragments and embedded expressions at compile time, then combined by template processors at runtime:

```
Template: "Hello, \{name}! You have \{count} messages."
        ↓ Compile-time split
Fragments: ["Hello, ", "! You have ", " messages."]
Expressions: [name, count]
        ↓ Runtime processing
Template Processor: STR / FMT / Custom processor
        ↓
Final Result: "Hello, Alice! You have 5 messages."
```

## Key Points

### Virtual Threads Key Points

| Characteristic | Platform Threads | Virtual Threads |
|----------------|------------------|-----------------|
| Memory Usage | 1-2 MB/thread | ~1 KB/thread |
| Creation Cost | High (involves OS calls) | Very low (JVM internal operation) |
| Maximum Count | Thousands | Millions |
| Scheduling Method | OS kernel scheduling | JVM user-space scheduling |
| Suitable Scenarios | CPU-intensive | I/O-intensive |
| Blocking Cost | High (wastes OS thread) | Low (only suspends virtual thread) |

**Virtual Thread Creation Methods**:

```java
// Method 1: Direct start
Thread vThread = Thread.startVirtualThread(() -> doTask());

// Method 2: Builder pattern
Thread vThread = Thread.ofVirtual()
    .name("worker-", 1)
    .start(() -> doTask());

// Method 3: Executor (recommended)
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> doTask());
}
```

### Pattern Matching for Switch Key Points

**Supported Pattern Types**:

1. **Type patterns**: `case String s`
2. **Guarded patterns**: `case String s when s.length() > 5`
3. **null patterns**: `case null`
4. **Record patterns**: `case Point(int x, int y)`
5. **Nested patterns**: `case Box(Point(int x, int y))`

**Exhaustiveness Rules**:

- `sealed` types: Must cover all subtypes
- Non-sealed types: Must have a `default` branch
- Enum types: Must cover all enum values

### Record Patterns Key Points

Record patterns allow simultaneous type checking and component extraction in a single operation:

```java
// Traditional approach
if (obj instanceof Point) {
    Point p = (Point) obj;
    int x = p.x();
    int y = p.y();
    // Use x and y
}

// Record pattern (Java 21)
if (obj instanceof Point(int x, int y)) {
    // Use x and y directly
}
```

### String Templates Key Points

**Built-in Processors**:

| Processor | Purpose | Example |
|-----------|---------|---------|
| `STR` | Basic string interpolation | `STR."Hello, \{name}!"` |
| `FMT` | Formatted strings | `FMT."%.2f\{price}"` |
| `RAW` | Returns StringTemplate object | Custom processing |

**Security Advantages**:

- Template processors can validate and escape embedded values
- Prevents SQL injection, XSS, and other security vulnerabilities
- Compile-time type checking of embedded expressions

## Code Examples

### Example 1: High-Concurrency Server with Virtual Threads

```java
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.Executors;

/**
 * High-concurrency HTTP server using virtual threads
 * Can handle hundreds of thousands of concurrent connections
 */
public class VirtualThreadServer {

    public static void main(String[] args) throws Exception {
        try (var serverSocket = new ServerSocket(8080);
             // One virtual thread per connection, no need to worry about pool size
             var executor = Executors.newVirtualThreadPerTaskExecutor()) {

            System.out.println("Server started on port 8080, handling requests with virtual threads");

            while (true) {
                Socket clientSocket = serverSocket.accept();
                executor.submit(() -> handleRequest(clientSocket));
            }
        }
    }

    private static void handleRequest(Socket socket) {
        try (socket) {
            // Read request
            var reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(socket.getInputStream()));
            String requestLine = reader.readLine();

            // Simulate database query (blocking operation)
            Thread.sleep(100);

            // Send response
            var writer = socket.getOutputStream();
            String response = """
                HTTP/1.1 200 OK
                Content-Type: text/plain

                Hello from Virtual Thread!
                Thread: %s
                Is Virtual: %s
                """.formatted(
                    Thread.currentThread().getName(),
                    Thread.currentThread().isVirtual()
                );
            writer.write(response.getBytes());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Example 2: Structured Concurrency for Service Aggregation

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.Future;

/**
 * Using structured concurrency to call multiple services in parallel
 */
public class StructuredConcurrencyExample {

    record UserData(String profile, String orders, String recommendations) {}

    /**
     * Fetch multiple types of user data in parallel, cancel all if any fails
     */
    public static UserData fetchUserData(String userId) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

            // Execute three subtasks in parallel
            Future<String> profileFuture = scope.fork(() -> fetchProfile(userId));
            Future<String> ordersFuture = scope.fork(() -> fetchOrders(userId));
            Future<String> recommendationsFuture = scope.fork(() -> fetchRecommendations(userId));

            // Wait for all tasks to complete or any to fail
            scope.join();

            // Throw exception if any task failed
            scope.throwIfFailed();

            // Combine results
            return new UserData(
                profileFuture.resultNow(),
                ordersFuture.resultNow(),
                recommendationsFuture.resultNow()
            );
        }
    }

    /**
     * Racing mode: Return the first successful result
     */
    public static String fetchFromFastestSource(String key) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {

            // Fetch from multiple data sources simultaneously
            scope.fork(() -> fetchFromCache(key));
            scope.fork(() -> fetchFromPrimaryDB(key));
            scope.fork(() -> fetchFromReplicaDB(key));

            // Wait for the first successful result
            scope.join();

            return scope.result();
        }
    }

    // Simulated service calls
    private static String fetchProfile(String userId) throws InterruptedException {
        Thread.sleep(100);
        return "{\"name\": \"John Doe\", \"email\": \"john@example.com\"}";
    }

    private static String fetchOrders(String userId) throws InterruptedException {
        Thread.sleep(150);
        return "[{\"orderId\": \"001\", \"amount\": 299.99}]";
    }

    private static String fetchRecommendations(String userId) throws InterruptedException {
        Thread.sleep(80);
        return "[\"Product A\", \"Product B\", \"Product C\"]";
    }

    private static String fetchFromCache(String key) throws InterruptedException {
        Thread.sleep(20);
        return "Cache data: " + key;
    }

    private static String fetchFromPrimaryDB(String key) throws InterruptedException {
        Thread.sleep(100);
        return "Primary DB data: " + key;
    }

    private static String fetchFromReplicaDB(String key) throws InterruptedException {
        Thread.sleep(80);
        return "Replica DB data: " + key;
    }

    public static void main(String[] args) throws Exception {
        // Test parallel fetch
        UserData userData = fetchUserData("user-123");
        System.out.println("User data: " + userData);

        // Test racing mode
        String fastResult = fetchFromFastestSource("config-key");
        System.out.println("Fastest result: " + fastResult);
    }
}
```

### Example 3: Comprehensive Pattern Matching for Switch

```java
/**
 * Various uses of Pattern Matching for Switch
 */
public class PatternMatchingSwitchExample {

    // Sealed interface definition
    sealed interface JsonValue permits JsonString, JsonNumber, JsonBoolean, JsonNull, JsonArray, JsonObject {}

    record JsonString(String value) implements JsonValue {}
    record JsonNumber(double value) implements JsonValue {}
    record JsonBoolean(boolean value) implements JsonValue {}
    record JsonNull() implements JsonValue {}
    record JsonArray(java.util.List<JsonValue> values) implements JsonValue {}
    record JsonObject(java.util.Map<String, JsonValue> fields) implements JsonValue {}

    /**
     * Type pattern matching
     */
    public static String formatValue(Object obj) {
        return switch (obj) {
            case null -> "null";
            case Integer i -> "Integer: " + i;
            case Long l -> "Long: " + l;
            case Double d -> "Double: %.2f".formatted(d);
            case String s -> "String: \"" + s + "\"";
            case int[] arr -> "Integer array, length: " + arr.length;
            default -> "Unknown type: " + obj.getClass().getSimpleName();
        };
    }

    /**
     * Pattern matching with guard conditions
     */
    public static String classifyNumber(Number n) {
        return switch (n) {
            case Integer i when i < 0 -> "Negative integer";
            case Integer i when i == 0 -> "Zero";
            case Integer i when i > 0 && i <= 100 -> "Small positive integer (1-100)";
            case Integer i -> "Large positive integer (>100)";
            case Double d when d.isNaN() -> "Not a number";
            case Double d when d.isInfinite() -> "Infinity";
            case Double d when d < 0 -> "Negative double";
            case Double d -> "Positive double";
            default -> "Other numeric type";
        };
    }

    /**
     * Handle JSON values (sealed type exhaustiveness matching)
     */
    public static String jsonToString(JsonValue value) {
        return switch (value) {
            case JsonNull() -> "null";
            case JsonBoolean(boolean b) -> b ? "true" : "false";
            case JsonNumber(double d) -> String.valueOf(d);
            case JsonString(String s) -> "\"" + escapeString(s) + "\"";
            case JsonArray(var values) -> {
                var elements = values.stream()
                    .map(PatternMatchingSwitchExample::jsonToString)
                    .toList();
                yield "[" + String.join(", ", elements) + "]";
            }
            case JsonObject(var fields) -> {
                var entries = fields.entrySet().stream()
                    .map(e -> "\"" + e.getKey() + "\": " + jsonToString(e.getValue()))
                    .toList();
                yield "{" + String.join(", ", entries) + "}";
            }
            // No default needed, sealed type guarantees exhaustiveness
        };
    }

    /**
     * Null handling
     */
    public static String handleNullable(String input) {
        return switch (input) {
            case null -> "Input is null";
            case String s when s.isBlank() -> "Input is blank string";
            case String s -> "Input content: " + s;
        };
    }

    private static String escapeString(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\t", "\\t");
    }

    public static void main(String[] args) {
        // Type pattern tests
        System.out.println(formatValue(42));
        System.out.println(formatValue(3.14159));
        System.out.println(formatValue("Hello"));
        System.out.println(formatValue(null));

        // Guard condition tests
        System.out.println(classifyNumber(-5));
        System.out.println(classifyNumber(0));
        System.out.println(classifyNumber(50));
        System.out.println(classifyNumber(200));

        // JSON tests
        var json = new JsonObject(java.util.Map.of(
            "name", new JsonString("John"),
            "age", new JsonNumber(25),
            "active", new JsonBoolean(true),
            "tags", new JsonArray(java.util.List.of(
                new JsonString("java"),
                new JsonString("kotlin")
            ))
        ));
        System.out.println(jsonToString(json));
    }
}
```

### Example 4: Deep Destructuring with Record Patterns

```java
import java.util.List;
import java.util.Optional;

/**
 * Various uses of record patterns
 */
public class RecordPatternsExample {

    // Define record types
    record Point(int x, int y) {}
    record Size(int width, int height) {}
    record Rectangle(Point topLeft, Size size) {}
    record Circle(Point center, int radius) {}
    record ColoredShape<T>(T shape, String color) {}

    // Nested records
    record Person(String name, Address address) {}
    record Address(String city, String street, int zipCode) {}

    // Expression tree
    sealed interface Expr permits Num, Add, Mul, Neg {}
    record Num(int value) implements Expr {}
    record Add(Expr left, Expr right) implements Expr {}
    record Mul(Expr left, Expr right) implements Expr {}
    record Neg(Expr operand) implements Expr {}

    /**
     * Basic record pattern matching
     */
    public static double calculateArea(Object shape) {
        return switch (shape) {
            case Rectangle(Point p, Size(int w, int h)) -> (double) w * h;
            case Circle(Point c, int r) -> Math.PI * r * r;
            default -> 0.0;
        };
    }

    /**
     * Nested record destructuring
     */
    public static String getPersonLocation(Person person) {
        return switch (person) {
            case Person(var name, Address(var city, _, _)) ->
                name + " lives in " + city;
        };
    }

    /**
     * Generic record patterns
     */
    public static String describeColoredShape(ColoredShape<?> cs) {
        return switch (cs) {
            case ColoredShape(Rectangle(_, Size(int w, int h)), String color) ->
                color + " rectangle, area: " + (w * h);
            case ColoredShape(Circle(_, int r), String color) ->
                color + " circle, area: " + (Math.PI * r * r);
            case ColoredShape(var shape, String color) ->
                color + " " + shape.getClass().getSimpleName();
        };
    }

    /**
     * Expression evaluation (recursive pattern matching)
     */
    public static int evaluate(Expr expr) {
        return switch (expr) {
            case Num(int value) -> value;
            case Add(Expr left, Expr right) -> evaluate(left) + evaluate(right);
            case Mul(Expr left, Expr right) -> evaluate(left) * evaluate(right);
            case Neg(Expr operand) -> -evaluate(operand);
        };
    }

    /**
     * Expression simplification (pattern matching optimization)
     */
    public static Expr simplify(Expr expr) {
        return switch (expr) {
            // 0 + x = x
            case Add(Num(0), Expr right) -> simplify(right);
            // x + 0 = x
            case Add(Expr left, Num(0)) -> simplify(left);
            // 0 * x = 0
            case Mul(Num(0), _) -> new Num(0);
            // x * 0 = 0
            case Mul(_, Num(0)) -> new Num(0);
            // 1 * x = x
            case Mul(Num(1), Expr right) -> simplify(right);
            // x * 1 = x
            case Mul(Expr left, Num(1)) -> simplify(left);
            // --x = x
            case Neg(Neg(Expr inner)) -> simplify(inner);
            // Constant folding
            case Add(Num(int a), Num(int b)) -> new Num(a + b);
            case Mul(Num(int a), Num(int b)) -> new Num(a * b);
            case Neg(Num(int v)) -> new Num(-v);
            // Recursive simplification
            case Add(Expr left, Expr right) -> new Add(simplify(left), simplify(right));
            case Mul(Expr left, Expr right) -> new Mul(simplify(left), simplify(right));
            case Neg(Expr operand) -> new Neg(simplify(operand));
            case Num n -> n;
        };
    }

    /**
     * Using record patterns in if-instanceof
     */
    public static Optional<Point> extractCenter(Object obj) {
        if (obj instanceof Circle(Point center, _)) {
            return Optional.of(center);
        }
        if (obj instanceof Rectangle(Point topLeft, Size(int w, int h))) {
            return Optional.of(new Point(topLeft.x() + w/2, topLeft.y() + h/2));
        }
        return Optional.empty();
    }

    public static void main(String[] args) {
        // Basic record patterns
        var rect = new Rectangle(new Point(0, 0), new Size(10, 20));
        var circle = new Circle(new Point(5, 5), 7);
        System.out.println("Rectangle area: " + calculateArea(rect));
        System.out.println("Circle area: " + calculateArea(circle));

        // Nested destructuring
        var person = new Person("John", new Address("New York", "Broadway", 10001));
        System.out.println(getPersonLocation(person));

        // Generic record patterns
        var coloredRect = new ColoredShape<>(rect, "Red");
        System.out.println(describeColoredShape(coloredRect));

        // Expression evaluation
        // Expression: (3 + 5) * 2 - 1 = 15
        Expr expr = new Add(
            new Mul(new Add(new Num(3), new Num(5)), new Num(2)),
            new Neg(new Num(1))
        );
        System.out.println("Expression result: " + evaluate(expr));

        // Expression simplification
        Expr toSimplify = new Add(new Num(0), new Mul(new Num(1), new Num(5)));
        System.out.println("Before simplification: " + toSimplify);
        System.out.println("After simplification: " + simplify(toSimplify));
    }
}
```

### Example 5: String Templates in Practice

```java
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Various uses of string templates
 * Note: This is a preview feature, requires --enable-preview for compilation and execution
 */
public class StringTemplatesExample {

    /**
     * Basic string templates - STR processor
     */
    public static void basicTemplates() {
        String name = "John";
        int age = 25;
        double score = 95.5;

        // Basic interpolation
        String greeting = STR."Hello, \{name}!";
        System.out.println(greeting);

        // Multi-value interpolation
        String info = STR."Name: \{name}, Age: \{age}, Score: \{score}";
        System.out.println(info);

        // Expression interpolation
        String calculation = STR."Next year \{name} will be \{age + 1} years old";
        System.out.println(calculation);

        // Method call
        String upperName = STR."Uppercase name: \{name.toUpperCase()}";
        System.out.println(upperName);

        // Multi-line template
        String html = STR."""
            <html>
                <head><title>User Info</title></head>
                <body>
                    <h1>Welcome, \{name}!</h1>
                    <p>Your age is \{age} years.</p>
                    <p>Your score is \{score} points.</p>
                </body>
            </html>
            """;
        System.out.println(html);
    }

    /**
     * FMT processor - Formatted strings
     */
    public static void formattedTemplates() {
        double price = 1234.5678;
        int quantity = 42;
        double total = price * quantity;

        // Format numbers
        String formatted = FMT."Unit price: $%.2f\{price}, Quantity: %d\{quantity}, Total: $%,.2f\{total}";
        System.out.println(formatted);

        // Date formatting
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String dateStr = FMT."Current time: %tF %<tT\{now}";
        System.out.println(dateStr);

        // Alignment formatting
        String[] items = {"Apple", "Banana", "Orange"};
        double[] prices = {5.5, 3.2, 4.8};
        System.out.println("Product list:");
        for (int i = 0; i < items.length; i++) {
            System.out.println(FMT."  %-10s\{items[i]} $%6.2f\{prices[i]}");
        }
    }

    /**
     * Custom template processor - Safe SQL builder
     */
    public static StringTemplate.Processor<PreparedStatement, java.sql.SQLException> SQL(Connection conn) {
        return template -> {
            // Convert template to PreparedStatement
            StringBuilder sql = new StringBuilder();
            var fragments = template.fragments();

            for (int i = 0; i < fragments.size(); i++) {
                sql.append(fragments.get(i));
                if (i < template.values().size()) {
                    sql.append("?");
                }
            }

            PreparedStatement stmt = conn.prepareStatement(sql.toString());

            // Set parameters
            int paramIndex = 1;
            for (Object value : template.values()) {
                stmt.setObject(paramIndex++, value);
            }

            return stmt;
        };
    }

    /**
     * Using safe SQL templates
     */
    public static void safeSqlExample(Connection conn) throws Exception {
        String userName = "John'; DROP TABLE users; --"; // Malicious input
        int minAge = 18;

        // Using custom SQL processor, automatically prevents SQL injection
        var SQL = SQL(conn);
        try (PreparedStatement stmt = SQL."""
            SELECT * FROM users
            WHERE name = \{userName}
            AND age >= \{minAge}
            """) {

            ResultSet rs = stmt.executeQuery();
            // Process results...
        }
    }

    /**
     * Custom template processor - JSON builder
     */
    public static final StringTemplate.Processor<String, RuntimeException> JSON = template -> {
        var fragments = template.fragments();
        var values = template.values();
        var result = new StringBuilder();

        for (int i = 0; i < fragments.size(); i++) {
            result.append(fragments.get(i));
            if (i < values.size()) {
                result.append(escapeJson(values.get(i)));
            }
        }

        return result.toString();
    };

    private static String escapeJson(Object value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof String s) {
            return "\"" + s.replace("\\", "\\\\")
                          .replace("\"", "\\\"")
                          .replace("\n", "\\n")
                          .replace("\t", "\\t") + "\"";
        }
        if (value instanceof Number || value instanceof Boolean) {
            return value.toString();
        }
        return "\"" + value.toString() + "\"";
    }

    public static void jsonTemplateExample() {
        String name = "Jane";
        int age = 30;
        boolean active = true;
        String bio = "Loves programming\nPassionate about open source";

        String json = JSON."""
            {
                "name": \{name},
                "age": \{age},
                "active": \{active},
                "bio": \{bio}
            }
            """;
        System.out.println(json);
    }

    /**
     * RAW processor - Get raw template
     */
    public static void rawTemplateExample() {
        String name = "Alice";
        int count = 5;

        // RAW returns StringTemplate object for custom processing
        StringTemplate template = RAW."User \{name} has \{count} messages";

        System.out.println("Fragments: " + template.fragments());
        System.out.println("Values: " + template.values());

        // Can be processed manually
        String result = template.interpolate();
        System.out.println("Interpolated result: " + result);
    }

    public static void main(String[] args) {
        System.out.println("=== Basic Templates ===");
        basicTemplates();

        System.out.println("\n=== Formatted Templates ===");
        formattedTemplates();

        System.out.println("\n=== JSON Templates ===");
        jsonTemplateExample();

        System.out.println("\n=== RAW Templates ===");
        rawTemplateExample();
    }
}
```

## Best Practices

### Virtual Threads Best Practices

```java
/**
 * Virtual threads usage best practices
 */
public class VirtualThreadBestPractices {

    // 1. One virtual thread per task, don't pool them
    public void goodPractice() {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 100000; i++) {
                executor.submit(() -> handleRequest());
            }
        }
    }

    // Wrong: Don't create fixed-size pools for virtual threads
    public void badPractice() {
        // This defeats the purpose of virtual threads
        // ExecutorService badPool = Executors.newFixedThreadPool(100, Thread.ofVirtual().factory());
    }

    // 2. Use ReentrantLock instead of synchronized to avoid pinning
    private final java.util.concurrent.locks.ReentrantLock lock =
        new java.util.concurrent.locks.ReentrantLock();

    public void avoidPinning() {
        lock.lock();
        try {
            // Blocking operations inside lock won't cause pinning
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    // 3. Use try-with-resources to manage executors
    public void properResourceManagement() {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            executor.submit(() -> task1());
            executor.submit(() -> task2());
        } // Automatically waits for all tasks to complete and closes
    }

    // 4. Virtual threads for I/O-intensive, platform threads for CPU-intensive
    public void chooseRightThreadType() {
        // I/O-intensive: virtual threads
        try (var ioExecutor = Executors.newVirtualThreadPerTaskExecutor()) {
            ioExecutor.submit(() -> makeHttpRequest());
            ioExecutor.submit(() -> queryDatabase());
        }

        // CPU-intensive: platform threads
        int cpuCores = Runtime.getRuntime().availableProcessors();
        try (var cpuExecutor = Executors.newFixedThreadPool(cpuCores)) {
            cpuExecutor.submit(() -> complexCalculation());
        }
    }

    private void handleRequest() {}
    private void task1() {}
    private void task2() {}
    private void makeHttpRequest() {}
    private void queryDatabase() {}
    private void complexCalculation() {}
}
```

### Pattern Matching Best Practices

```java
/**
 * Pattern matching best practices
 */
public class PatternMatchingBestPractices {

    // 1. Prefer sealed types to let the compiler check exhaustiveness
    sealed interface Result<T> permits Success, Failure {}
    record Success<T>(T value) implements Result<T> {}
    record Failure<T>(String error) implements Result<T> {}

    public <T> T handleResult(Result<T> result) {
        return switch (result) {
            case Success<T>(T value) -> value;
            case Failure<T>(String error) -> throw new RuntimeException(error);
            // No default needed, compiler guarantees exhaustiveness
        };
    }

    // 2. Put more specific patterns first
    public String process(Object obj) {
        return switch (obj) {
            // Specific types first
            case String s when s.isEmpty() -> "Empty string";
            case String s -> "String: " + s;
            // General types later
            case CharSequence cs -> "CharSequence: " + cs;
            default -> "Other type";
        };
    }

    // 3. Use guard conditions instead of complex if-else
    public String classifyAge(Object obj) {
        return switch (obj) {
            case Integer age when age < 0 -> "Invalid age";
            case Integer age when age < 18 -> "Minor";
            case Integer age when age < 60 -> "Adult";
            case Integer age -> "Senior";
            default -> "Non-integer type";
        };
    }

    // 4. Use record patterns to simplify data extraction
    record Order(String id, Customer customer, java.util.List<Item> items) {}
    record Customer(String name, String email) {}
    record Item(String product, int quantity, double price) {}

    public String formatOrderEmail(Order order) {
        return switch (order) {
            case Order(String id, Customer(String name, String email), var items) ->
                STR."""
                Order ID: \{id}
                Customer: \{name} (\{email})
                Item count: \{items.size()}
                """;
        };
    }

    // 5. Use _ to ignore unneeded components
    public int getOrderItemCount(Order order) {
        return switch (order) {
            case Order(_, _, var items) -> items.size();
        };
    }
}
```

### String Templates Best Practices

```java
/**
 * String templates best practices
 */
public class StringTemplateBestPractices {

    // 1. Create dedicated processors for sensitive operations
    public static final StringTemplate.Processor<String, RuntimeException> HTML = template -> {
        var fragments = template.fragments();
        var values = template.values();
        var result = new StringBuilder();

        for (int i = 0; i < fragments.size(); i++) {
            result.append(fragments.get(i));
            if (i < values.size()) {
                result.append(escapeHtml(values.get(i).toString()));
            }
        }
        return result.toString();
    };

    private static String escapeHtml(String s) {
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }

    // 2. Use FMT for precise format control
    public static String formatPrice(double price, int quantity) {
        return FMT."Unit price: $%,.2f\{price} x %d\{quantity} = $%,.2f\{price * quantity}";
    }

    // 3. Use multi-line templates to improve readability
    public static String generateEmail(String name, String product, double price) {
        return STR."""
            Dear \{name},

            Thank you for purchasing our product!

            Order details:
            - Product: \{product}
            - Price: $\{String.format("%.2f", price)}

            If you have any questions, please feel free to contact us.

            Best regards,
            Sales Team
            """;
    }

    // 4. Avoid creating many temporary strings in loops
    public static String buildList(java.util.List<String> items) {
        var sb = new StringBuilder();
        for (int i = 0; i < items.size(); i++) {
            sb.append(STR."\{i + 1}. \{items.get(i)}\n");
        }
        return sb.toString();
    }
}
```

## Common Pitfalls

### Virtual Thread Pitfalls

```java
/**
 * Common virtual thread pitfalls
 */
public class VirtualThreadPitfalls {

    // Pitfall 1: Blocking operations inside synchronized blocks cause pinning
    private final Object monitor = new Object();

    // Wrong: Causes virtual thread pinning
    public void pinnedExample() {
        synchronized (monitor) {
            try {
                Thread.sleep(1000); // Blocking operation
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    // Correct: Use ReentrantLock
    private final java.util.concurrent.locks.ReentrantLock lock =
        new java.util.concurrent.locks.ReentrantLock();

    public void correctExample() {
        lock.lock();
        try {
            Thread.sleep(1000); // Virtual thread can unmount properly
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    // Pitfall 2: Over-reliance on ThreadLocal
    private static final ThreadLocal<byte[]> BUFFER = ThreadLocal.withInitial(() -> new byte[1024 * 1024]);

    // Wrong: Millions of virtual threads will consume massive memory
    public void threadLocalPitfall() {
        try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1_000_000; i++) {
                executor.submit(() -> {
                    byte[] buffer = BUFFER.get(); // 1MB per virtual thread
                    // Use buffer
                });
            }
        }
    }

    // Pitfall 3: Forgetting to handle interrupts
    public void interruptionPitfall() {
        Thread.startVirtualThread(() -> {
            while (true) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    // Wrong: Ignoring interrupt
                    // Correct approach:
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
    }

    // Pitfall 4: Using virtual threads for CPU-intensive tasks
    public void cpuIntensivePitfall() {
        // Wrong: Virtual threads provide no advantage for CPU-intensive tasks
        try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1000; i++) {
                executor.submit(() -> {
                    // CPU-intensive calculation
                    long sum = 0;
                    for (long j = 0; j < 1_000_000_000L; j++) {
                        sum += j;
                    }
                    return sum;
                });
            }
        }
    }
}
```

### Pattern Matching Pitfalls

```java
/**
 * Common pattern matching pitfalls
 */
public class PatternMatchingPitfalls {

    // Pitfall 1: Wrong pattern order causes unreachable code
    public String orderPitfall(Object obj) {
        return switch (obj) {
            // Wrong: String after CharSequence will never be matched
            // case CharSequence cs -> "CharSequence";
            // case String s -> "String"; // Compile error: unreachable code

            // Correct: Specific types first
            case String s -> "String";
            case CharSequence cs -> "CharSequence";
            default -> "Other";
        };
    }

    // Pitfall 2: Forgetting to handle null
    public String nullPitfall(String input) {
        // Wrong: Throws NullPointerException if input is null
        // return switch (input) {
        //     case String s when s.isEmpty() -> "Empty";
        //     case String s -> s;
        // };

        // Correct: Handle null explicitly
        return switch (input) {
            case null -> "Null value";
            case String s when s.isEmpty() -> "Empty";
            case String s -> s;
        };
    }

    // Pitfall 3: Side effects in guard conditions
    private int counter = 0;

    public String sideEffectPitfall(Object obj) {
        // Wrong: Guard conditions should not have side effects
        // return switch (obj) {
        //     case Integer i when (counter++ > 0) -> "Subsequent integer";
        //     case Integer i -> "First integer";
        //     default -> "Other";
        // };

        // Correct: Guard conditions should be pure expressions
        return switch (obj) {
            case Integer i when counter > 0 -> {
                counter++;
                yield "Subsequent integer";
            }
            case Integer i -> {
                counter++;
                yield "First integer";
            }
            default -> "Other";
        };
    }

    // Pitfall 4: Type mismatch in record patterns
    record Box<T>(T content) {}

    public String genericPitfall(Box<?> box) {
        // Note: Due to type erasure, generic types cannot be checked at runtime
        return switch (box) {
            // This only checks if content is String, not Box's type parameter
            case Box(String s) -> "String box: " + s;
            case Box(Integer i) -> "Integer box: " + i;
            case Box(var content) -> "Other box: " + content;
        };
    }
}
```

### String Template Pitfalls

```java
/**
 * Common string template pitfalls
 */
public class StringTemplatePitfalls {

    // Pitfall 1: Using complex logic in embedded expressions
    public String complexExpressionPitfall(String name, int score) {
        // Wrong: Expression too complex, hard to maintain
        // String result = STR."Result: \{score >= 90 ? "Excellent" : score >= 80 ? "Good" : score >= 60 ? "Pass" : "Fail"}";

        // Correct: Extract complex logic to a method
        return STR."Result: \{getGrade(score)}";
    }

    private String getGrade(int score) {
        if (score >= 90) return "Excellent";
        if (score >= 80) return "Good";
        if (score >= 60) return "Pass";
        return "Fail";
    }

    // Pitfall 2: Forgetting to handle special characters
    public String specialCharPitfall(String userInput) {
        // Wrong: User input may contain HTML special characters
        // String html = STR."<p>\{userInput}</p>";

        // Correct: Use custom processor to escape
        return STR."<p>\{escapeHtml(userInput)}</p>";
    }

    private String escapeHtml(String s) {
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    // Pitfall 3: Frequently creating string templates in loops
    public String loopPitfall(java.util.List<String> items) {
        // Less efficient: Creates new string each iteration
        String result = "";
        for (String item : items) {
            result = STR."\{result}\n- \{item}";
        }
        return result;

        // Better approach: Use StringBuilder or Stream
        // return items.stream()
        //     .map(item -> STR."- \{item}")
        //     .collect(java.util.stream.Collectors.joining("\n"));
    }

    // Pitfall 4: Confusing STR and FMT
    public void processorConfusion(double value) {
        // STR doesn't support format specifiers
        // String wrong = STR."Value: %.2f\{value}"; // Output: "Value: %.2f123.456789"

        // FMT supports format specifiers
        String correct = FMT."Value: %.2f\{value}"; // Output: "Value: 123.46"
        System.out.println(correct);
    }
}
```

## Performance Considerations

### Virtual Thread Performance Analysis

```java
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.*;

/**
 * Virtual thread vs platform thread performance comparison
 */
public class VirtualThreadPerformance {

    private static final int TASK_COUNT = 100_000;
    private static final Duration IO_DELAY = Duration.ofMillis(100);

    public static void main(String[] args) throws Exception {
        System.out.println("===== Virtual Threads vs Platform Threads Performance Comparison =====");
        System.out.println("Task count: " + TASK_COUNT);
        System.out.println("Simulated I/O delay: " + IO_DELAY.toMillis() + "ms\n");

        // Warmup
        warmUp();

        // Test virtual threads
        long virtualTime = testVirtualThreads();
        System.out.println("Virtual threads time: " + virtualTime + "ms");

        // Test platform thread pool
        long platformTime = testPlatformThreads();
        System.out.println("Platform thread pool (200) time: " + platformTime + "ms");

        System.out.println("\nVirtual threads are " + (platformTime / (double) virtualTime) + "x faster");
    }

    private static void warmUp() throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1000; i++) {
                executor.submit(() -> Thread.sleep(1));
            }
        }
    }

    private static long testVirtualThreads() throws Exception {
        Instant start = Instant.now();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < TASK_COUNT; i++) {
                executor.submit(() -> {
                    Thread.sleep(IO_DELAY);
                    return null;
                });
            }
        }

        return Duration.between(start, Instant.now()).toMillis();
    }

    private static long testPlatformThreads() throws Exception {
        Instant start = Instant.now();

        try (var executor = Executors.newFixedThreadPool(200)) {
            var futures = new java.util.ArrayList<Future<?>>();
            for (int i = 0; i < TASK_COUNT; i++) {
                futures.add(executor.submit(() -> {
                    Thread.sleep(IO_DELAY);
                    return null;
                }));
            }
            for (var future : futures) {
                future.get();
            }
        }

        return Duration.between(start, Instant.now()).toMillis();
    }
}
```

**Performance Comparison Results** (typical scenario):

| Scenario | Platform Thread Pool (200) | Virtual Threads | Improvement |
|----------|----------------------------|-----------------|-------------|
| 100K tasks with 100ms I/O each | ~50 seconds | ~1 second | 50x |
| Memory usage (100K threads) | ~100GB | ~100MB | 1000x |
| Thread creation time | ~1ms/thread | ~1us/thread | 1000x |

### Pattern Matching Performance

Pattern matching is optimized at compile time into efficient conditional checks:

```java
/**
 * Pattern matching performance characteristics
 */
public class PatternMatchingPerformance {

    // The compiler optimizes pattern matching into code similar to the following
    // switch expressions are converted to efficient tableswitch or lookupswitch instructions

    sealed interface Shape permits Circle, Rectangle, Triangle {}
    record Circle(double radius) implements Shape {}
    record Rectangle(double width, double height) implements Shape {}
    record Triangle(double base, double height) implements Shape {}

    // Pattern matching version
    public double areaPatternMatching(Shape shape) {
        return switch (shape) {
            case Circle(double r) -> Math.PI * r * r;
            case Rectangle(double w, double h) -> w * h;
            case Triangle(double b, double h) -> 0.5 * b * h;
        };
    }

    // Traditional version (similar performance, but more verbose code)
    public double areaTraditional(Shape shape) {
        if (shape instanceof Circle c) {
            return Math.PI * c.radius() * c.radius();
        } else if (shape instanceof Rectangle r) {
            return r.width() * r.height();
        } else if (shape instanceof Triangle t) {
            return 0.5 * t.base() * t.height();
        }
        throw new IllegalArgumentException("Unknown shape");
    }

    /**
     * Performance tips:
     * 1. Pattern matching does not add runtime overhead
     * 2. The compiler chooses the optimal matching strategy based on pattern types
     * 3. Guard conditions are only evaluated after type matching succeeds
     * 4. Sealed types allow the compiler to generate more optimized code
     */
}
```

### String Template Performance

```java
/**
 * String template performance characteristics
 */
public class StringTemplatePerformance {

    /**
     * String templates are converted to method calls at compile time,
     * performance is comparable to StringBuilder, better than String.format()
     */

    public static void performanceComparison() {
        String name = "John";
        int age = 25;
        int iterations = 1_000_000;

        // Warmup
        for (int i = 0; i < 10000; i++) {
            STR."Hello, \{name}! Age: \{age}";
        }

        // Test STR template
        long startStr = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            String s = STR."Hello, \{name}! Age: \{age}";
        }
        long strTime = System.nanoTime() - startStr;

        // Test String.format
        long startFormat = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            String s = String.format("Hello, %s! Age: %d", name, age);
        }
        long formatTime = System.nanoTime() - startFormat;

        // Test StringBuilder
        long startBuilder = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            String s = new StringBuilder()
                .append("Hello, ").append(name)
                .append("! Age: ").append(age)
                .toString();
        }
        long builderTime = System.nanoTime() - startBuilder;

        // Test string concatenation
        long startConcat = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            String s = "Hello, " + name + "! Age: " + age;
        }
        long concatTime = System.nanoTime() - startConcat;

        System.out.println("STR template: " + strTime / 1_000_000 + "ms");
        System.out.println("String.format: " + formatTime / 1_000_000 + "ms");
        System.out.println("StringBuilder: " + builderTime / 1_000_000 + "ms");
        System.out.println("String concatenation: " + concatTime / 1_000_000 + "ms");
    }

    /**
     * Typical results (relative performance):
     * - STR template: 1.0x (baseline)
     * - StringBuilder: 1.0x
     * - String concatenation: 1.1x
     * - String.format: 5-10x (slower)
     */
}
```

## Real-World Scenarios

### Scenario 1: Microservices API Gateway

```java
import java.net.http.*;
import java.net.URI;
import java.time.Duration;
import java.util.concurrent.*;

/**
 * Building an API gateway using Java 21 features
 */
public class ApiGateway {

    private final HttpClient httpClient;

    public ApiGateway() {
        this.httpClient = HttpClient.newBuilder()
            .executor(Executors.newVirtualThreadPerTaskExecutor())
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    // Response types
    sealed interface ApiResponse permits SuccessResponse, ErrorResponse, TimeoutResponse {}
    record SuccessResponse(String data, Duration latency) implements ApiResponse {}
    record ErrorResponse(int code, String message) implements ApiResponse {}
    record TimeoutResponse(String service) implements ApiResponse {}

    /**
     * Aggregate data from multiple services
     */
    public String aggregateUserDashboard(String userId) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

            // Call multiple microservices in parallel
            var profileTask = scope.fork(() ->
                callService(STR."http://user-service/users/\{userId}"));
            var ordersTask = scope.fork(() ->
                callService(STR."http://order-service/users/\{userId}/orders"));
            var recommendationsTask = scope.fork(() ->
                callService(STR."http://recommendation-service/users/\{userId}"));
            var notificationsTask = scope.fork(() ->
                callService(STR."http://notification-service/users/\{userId}/unread"));

            scope.joinUntil(java.time.Instant.now().plusSeconds(5));
            scope.throwIfFailed();

            // Process results using pattern matching
            return formatDashboard(
                profileTask.resultNow(),
                ordersTask.resultNow(),
                recommendationsTask.resultNow(),
                notificationsTask.resultNow()
            );
        }
    }

    private ApiResponse callService(String url) {
        try {
            var start = java.time.Instant.now();
            var request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(3))
                .GET()
                .build();

            var response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            var latency = Duration.between(start, java.time.Instant.now());

            return switch (response.statusCode()) {
                case 200 -> new SuccessResponse(response.body(), latency);
                case int code when code >= 400 && code < 500 ->
                    new ErrorResponse(code, "Client error");
                case int code when code >= 500 ->
                    new ErrorResponse(code, "Server error");
                default -> new ErrorResponse(response.statusCode(), "Unknown status");
            };
        } catch (java.net.http.HttpTimeoutException e) {
            return new TimeoutResponse(url);
        } catch (Exception e) {
            return new ErrorResponse(500, e.getMessage());
        }
    }

    private String formatDashboard(ApiResponse profile, ApiResponse orders,
                                   ApiResponse recommendations, ApiResponse notifications) {
        return STR."""
            {
                "profile": \{formatResponse(profile)},
                "orders": \{formatResponse(orders)},
                "recommendations": \{formatResponse(recommendations)},
                "notifications": \{formatResponse(notifications)}
            }
            """;
    }

    private String formatResponse(ApiResponse response) {
        return switch (response) {
            case SuccessResponse(String data, Duration latency) ->
                STR."""
                    {"status": "success", "data": \{data}, "latencyMs": \{latency.toMillis()}}""";
            case ErrorResponse(int code, String message) ->
                STR."""
                    {"status": "error", "code": \{code}, "message": "\{message}"}""";
            case TimeoutResponse(String service) ->
                STR."""
                    {"status": "timeout", "service": "\{service}"}""";
        };
    }
}
```

### Scenario 2: Rule Engine

```java
import java.util.*;

/**
 * Building a rule engine using pattern matching
 */
public class RuleEngine {

    // Rule definitions
    sealed interface Rule permits
        AmountRule, CustomerTypeRule, DateRule, CompositeRule {}

    record AmountRule(double minAmount, double maxAmount, double discount) implements Rule {}
    record CustomerTypeRule(String customerType, double discount) implements Rule {}
    record DateRule(java.time.LocalDate startDate, java.time.LocalDate endDate, double discount) implements Rule {}
    record CompositeRule(List<Rule> rules, CombineStrategy strategy) implements Rule {}

    enum CombineStrategy { ALL_MATCH, ANY_MATCH, FIRST_MATCH }

    // Order context
    record OrderContext(
        double amount,
        String customerType,
        java.time.LocalDate orderDate,
        List<String> productCategories
    ) {}

    /**
     * Evaluate rule
     */
    public Optional<Double> evaluateRule(Rule rule, OrderContext context) {
        return switch (rule) {
            case AmountRule(double min, double max, double discount)
                when context.amount() >= min && context.amount() <= max ->
                    Optional.of(discount);

            case AmountRule _ -> Optional.empty();

            case CustomerTypeRule(String type, double discount)
                when type.equals(context.customerType()) ->
                    Optional.of(discount);

            case CustomerTypeRule _ -> Optional.empty();

            case DateRule(var start, var end, double discount)
                when !context.orderDate().isBefore(start) && !context.orderDate().isAfter(end) ->
                    Optional.of(discount);

            case DateRule _ -> Optional.empty();

            case CompositeRule(List<Rule> rules, CombineStrategy strategy) ->
                evaluateComposite(rules, strategy, context);
        };
    }

    private Optional<Double> evaluateComposite(List<Rule> rules, CombineStrategy strategy, OrderContext context) {
        var results = rules.stream()
            .map(rule -> evaluateRule(rule, context))
            .toList();

        return switch (strategy) {
            case ALL_MATCH -> {
                if (results.stream().allMatch(Optional::isPresent)) {
                    yield Optional.of(results.stream()
                        .mapToDouble(opt -> opt.orElse(0.0))
                        .max()
                        .orElse(0.0));
                }
                yield Optional.empty();
            }
            case ANY_MATCH -> results.stream()
                .filter(Optional::isPresent)
                .findFirst()
                .orElse(Optional.empty());
            case FIRST_MATCH -> results.stream()
                .filter(Optional::isPresent)
                .findFirst()
                .orElse(Optional.empty());
        };
    }

    /**
     * Usage example
     */
    public static void main(String[] args) {
        var engine = new RuleEngine();

        // Define rules
        var vipDiscount = new CustomerTypeRule("VIP", 0.20);
        var largeOrderDiscount = new AmountRule(1000, Double.MAX_VALUE, 0.15);
        var holidayPromotion = new DateRule(
            java.time.LocalDate.of(2024, 12, 20),
            java.time.LocalDate.of(2024, 12, 31),
            0.25
        );

        var compositeRule = new CompositeRule(
            List.of(vipDiscount, largeOrderDiscount),
            CombineStrategy.ALL_MATCH
        );

        // Order context
        var context = new OrderContext(
            1500.0,
            "VIP",
            java.time.LocalDate.of(2024, 12, 25),
            List.of("Electronics")
        );

        // Evaluate rule
        var discount = engine.evaluateRule(compositeRule, context);
        System.out.println(STR."Discount: \{discount.map(d -> d * 100 + "%").orElse("None")}");
    }
}
```

### Scenario 3: Data Transformation Pipeline

```java
import java.util.*;
import java.util.function.*;
import java.util.stream.*;

/**
 * Building a data transformation pipeline using record patterns
 */
public class DataTransformationPipeline {

    // Data model
    sealed interface DataValue permits
        StringValue, NumberValue, BoolValue, ListValue, MapValue, NullValue {}

    record StringValue(String value) implements DataValue {}
    record NumberValue(double value) implements DataValue {}
    record BoolValue(boolean value) implements DataValue {}
    record ListValue(List<DataValue> values) implements DataValue {}
    record MapValue(Map<String, DataValue> fields) implements DataValue {}
    record NullValue() implements DataValue {}

    // Transform operations
    sealed interface Transform permits
        MapTransform, FilterTransform, FlatMapTransform, ReduceTransform {}

    record MapTransform(Function<DataValue, DataValue> mapper) implements Transform {}
    record FilterTransform(Predicate<DataValue> predicate) implements Transform {}
    record FlatMapTransform(Function<DataValue, List<DataValue>> mapper) implements Transform {}
    record ReduceTransform(BinaryOperator<DataValue> reducer, DataValue identity) implements Transform {}

    /**
     * Apply transform
     */
    public DataValue apply(Transform transform, DataValue input) {
        return switch (transform) {
            case MapTransform(var mapper) -> applyMap(mapper, input);
            case FilterTransform(var predicate) -> applyFilter(predicate, input);
            case FlatMapTransform(var mapper) -> applyFlatMap(mapper, input);
            case ReduceTransform(var reducer, var identity) -> applyReduce(reducer, identity, input);
        };
    }

    private DataValue applyMap(Function<DataValue, DataValue> mapper, DataValue input) {
        return switch (input) {
            case ListValue(var values) ->
                new ListValue(values.stream().map(mapper).toList());
            case MapValue(var fields) ->
                new MapValue(fields.entrySet().stream()
                    .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> mapper.apply(e.getValue())
                    )));
            default -> mapper.apply(input);
        };
    }

    private DataValue applyFilter(Predicate<DataValue> predicate, DataValue input) {
        return switch (input) {
            case ListValue(var values) ->
                new ListValue(values.stream().filter(predicate).toList());
            case MapValue(var fields) ->
                new MapValue(fields.entrySet().stream()
                    .filter(e -> predicate.test(e.getValue()))
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)));
            default -> predicate.test(input) ? input : new NullValue();
        };
    }

    private DataValue applyFlatMap(Function<DataValue, List<DataValue>> mapper, DataValue input) {
        return switch (input) {
            case ListValue(var values) ->
                new ListValue(values.stream()
                    .flatMap(v -> mapper.apply(v).stream())
                    .toList());
            default -> new ListValue(mapper.apply(input));
        };
    }

    private DataValue applyReduce(BinaryOperator<DataValue> reducer, DataValue identity, DataValue input) {
        return switch (input) {
            case ListValue(var values) ->
                values.stream().reduce(identity, reducer);
            default -> reducer.apply(identity, input);
        };
    }

    /**
     * Deep get nested value
     */
    public Optional<DataValue> getPath(DataValue root, String... path) {
        DataValue current = root;
        for (String key : path) {
            current = switch (current) {
                case MapValue(var fields) when fields.containsKey(key) ->
                    fields.get(key);
                case ListValue(var values) -> {
                    try {
                        int index = Integer.parseInt(key);
                        yield index >= 0 && index < values.size()
                            ? values.get(index)
                            : new NullValue();
                    } catch (NumberFormatException e) {
                        yield new NullValue();
                    }
                }
                default -> new NullValue();
            };
            if (current instanceof NullValue) {
                return Optional.empty();
            }
        }
        return Optional.of(current);
    }

    /**
     * Format output
     */
    public String format(DataValue value) {
        return switch (value) {
            case NullValue() -> "null";
            case BoolValue(boolean b) -> String.valueOf(b);
            case NumberValue(double n) ->
                n == Math.floor(n) ? String.valueOf((long) n) : String.valueOf(n);
            case StringValue(String s) -> STR."\"\{s}\"";
            case ListValue(var values) ->
                STR."[\{values.stream().map(this::format).collect(Collectors.joining(", "))}]";
            case MapValue(var fields) ->
                STR."{\{fields.entrySet().stream()
                    .map(e -> STR."\"\{e.getKey()}\": \{format(e.getValue())}")
                    .collect(Collectors.joining(", "))}}";
        };
    }
}
```

## Interview Key Points

### Virtual Thread Interview Questions

**Q1: What are virtual threads? How are they different from platform threads?**

Virtual threads are lightweight threads introduced in Java 21, managed by the JVM rather than the operating system. Key differences:

| Dimension | Platform Threads | Virtual Threads |
|-----------|------------------|-----------------|
| Manager | Operating System | JVM |
| Memory Usage | 1-2 MB | ~1 KB |
| Creation Cost | High (system call) | Very Low (JVM operation) |
| Maximum Count | Thousands | Millions |
| Scheduling Model | 1:1 (Thread:OS Thread) | M:N (Virtual Thread:Carrier Thread) |

**Q2: What is virtual thread "Pinning"? How to avoid it?**

Pinning occurs when a virtual thread cannot unmount from a carrier thread, mainly happening when:
- Executing blocking operations inside `synchronized` blocks
- Executing native methods

Avoidance methods:
- Use `ReentrantLock` instead of `synchronized`
- Move blocking operations outside synchronized blocks
- Use `-Djdk.tracePinnedThreads=full` to detect pinning

**Q3: What scenarios are virtual threads suitable for? What are they not suitable for?**

Suitable for: I/O-intensive tasks (HTTP requests, database queries, file operations)
Not suitable for: CPU-intensive tasks (complex calculations, encryption, image processing)

### Pattern Matching Interview Questions

**Q4: What types of patterns does switch expression pattern matching support?**

1. **Type patterns**: `case String s ->`
2. **Guarded patterns**: `case String s when s.length() > 5 ->`
3. **null patterns**: `case null ->`
4. **Record patterns**: `case Point(int x, int y) ->`
5. **Nested patterns**: `case Box(Point(int x, int y)) ->`

**Q5: What is exhaustiveness checking? How to guarantee exhaustiveness of switch expressions?**

Exhaustiveness checking ensures that switch expressions cover all possible input values. Guarantee methods:
- Use `sealed` types, the compiler automatically checks all subtypes
- For non-sealed types, use a `default` branch
- For enums, cover all enum values

**Q6: What advantages do record patterns have over traditional instanceof?**

```java
// Traditional approach (5 lines of code)
if (obj instanceof Point) {
    Point p = (Point) obj;
    int x = p.x();
    int y = p.y();
    // Use x and y
}

// Record pattern (1 line of code)
if (obj instanceof Point(int x, int y)) {
    // Use x and y directly
}
```

Advantages: More concise code, type safe, supports nested destructuring

### String Template Interview Questions

**Q7: What advantages do string templates have over String.format()?**

1. **Type Safety**: Compile-time checking of embedded expressions
2. **Better Performance**: Performance close to StringBuilder
3. **Extensibility**: Can create custom template processors
4. **Security**: Processors can auto-escape to prevent injection attacks
5. **Readability**: Expressions directly embedded, easier to understand

**Q8: What is a template processor? How to create a custom processor?**

A template processor is a functional interface that processes `StringTemplate`:

```java
StringTemplate.Processor<String, RuntimeException> SAFE_HTML = template -> {
    var result = new StringBuilder();
    var fragments = template.fragments();
    var values = template.values();

    for (int i = 0; i < fragments.size(); i++) {
        result.append(fragments.get(i));
        if (i < values.size()) {
            result.append(escapeHtml(values.get(i).toString()));
        }
    }
    return result.toString();
};
```

## Further Reading

### Official Documentation

- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444) - Virtual Threads Specification
- [JEP 453: Structured Concurrency (Preview)](https://openjdk.org/jeps/453) - Structured Concurrency Specification
- [JEP 441: Pattern Matching for switch](https://openjdk.org/jeps/441) - Pattern Matching for Switch Specification
- [JEP 440: Record Patterns](https://openjdk.org/jeps/440) - Record Patterns Specification
- [JEP 430: String Templates (Preview)](https://openjdk.org/jeps/430) - String Templates Specification

### Deep Learning Resources

- [Inside Java - Virtual Threads](https://inside.java/tag/loom/) - Oracle Official Blog
- [Java 21 Complete Feature List](https://openjdk.org/projects/jdk/21/) - OpenJDK Project Page
- [Modern Java in Action](https://www.manning.com/books/modern-java-in-action) - Manning Publications

### Framework Support

- **Spring Boot 3.2+**: Native virtual thread support
  ```properties
  spring.threads.virtual.enabled=true
  ```
- **Quarkus 3.0+**: Virtual thread support
- **Micronaut 4.0+**: Virtual thread support

### Migration Guide

1. **Evaluate existing code**: Identify I/O-intensive services
2. **Check synchronized code**: Replace `synchronized` with `ReentrantLock`
3. **Upgrade dependencies**: Ensure third-party libraries are compatible with virtual threads
4. **Performance testing**: Compare throughput and latency before and after migration
5. **Gradual deployment**: Start with non-critical services

---

> **Summary**: Java 21 LTS is a milestone version in Java's evolution. Virtual threads fundamentally change the concurrent programming model, pattern matching makes code more concise and type-safe, and string templates provide modern string handling capabilities. The combination of these features will significantly improve Java development efficiency and code quality. Developers are encouraged to learn and adopt these features in new projects as soon as possible.
