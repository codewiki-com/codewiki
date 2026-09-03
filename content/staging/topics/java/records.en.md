---
title: Records
description: "Complete Guide to Java Records: Immutable Data Classes and Pattern Matching"
track: java
section: basics
difficulty: intermediate
tags:
  - Java
  - Records
  - Immutable
  - Data Classes
status: imported
origin: old/src/content/docs/java/records.en.md
divergence: 0.218
issues: []
legacy:
  category: Java
  subcategory: Language Features
  order: 14
  lastUpdated: 2026-01-07
---

Java Records is a preview feature introduced in Java 14 and officially released in Java 16. A Record is a special type of class specifically designed for creating immutable data carrier classes. It automatically generates constructors, accessors, `equals()`, `hashCode()`, and `toString()` methods through concise syntax, significantly reducing boilerplate code.

## Why Records Are Needed

Before Records, creating a simple immutable data class required substantial boilerplate code:

```java
public final class Person {
    private final String name;
    private final int age;
    private final String email;

    public Person(String name, int age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }

    public String name() {
        return name;
    }

    public int age() {
        return age;
    }

    public String email() {
        return email;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Person person = (Person) o;
        return age == person.age &&
               Objects.equals(name, person.name) &&
               Objects.equals(email, person.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age, email);
    }

    @Override
    public String toString() {
        return "Person[name=" + name + ", age=" + age + ", email=" + email + "]";
    }
}
```

With Record, the above 50+ lines of code can be simplified to one line:

```java
public record Person(String name, int age, String email) {}
```

This one line of code automatically generates:
- Private final fields
- Canonical constructor
- Accessor methods for each component
- `equals()` method based on all components
- `hashCode()` method based on all components
- `toString()` method containing all components

## Record Basic Syntax

### Defining a Record

Records are defined using the `record` keyword, with components declared in parentheses after the class name:

```java
// Basic Record
public record Point(int x, int y) {}

// Record with reference types
public record Book(String title, String author, double price) {}

// Generic Record
public record Pair<K, V>(K key, V value) {}

// Nested Record
public record Line(Point start, Point end) {}
```

### Creating and Using Record Instances

```java
// Creating instances
Point point = new Point(10, 20);
Book book = new Book("Effective Java", "Joshua Bloch", 45.99);
Pair<String, Integer> pair = new Pair<>("age", 25);

// Accessing components (note: not getXxx, but directly using component name)
System.out.println(point.x());      // 10
System.out.println(point.y());      // 20
System.out.println(book.title());   // Effective Java
System.out.println(book.author());  // Joshua Bloch

// Auto-generated toString()
System.out.println(point);  // Point[x=10, y=20]
System.out.println(book);   // Book[title=Effective Java, author=Joshua Bloch, price=45.99]

// Auto-generated equals() and hashCode()
Point p1 = new Point(10, 20);
Point p2 = new Point(10, 20);
System.out.println(p1.equals(p2));  // true
System.out.println(p1.hashCode() == p2.hashCode());  // true

// Can be used as Map keys
Map<Point, String> pointNames = new HashMap<>();
pointNames.put(new Point(0, 0), "origin");
System.out.println(pointNames.get(new Point(0, 0)));  // origin
```

### The Nature of Records

A Record is essentially a special final class that implicitly extends `java.lang.Record`:

```java
// This Record definition
public record Point(int x, int y) {}

// Is roughly equivalent to (compiler-generated)
public final class Point extends Record {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int x() { return x; }
    public int y() { return y; }

    @Override
    public boolean equals(Object o) { /* implementation based on x and y */ }

    @Override
    public int hashCode() { /* implementation based on x and y */ }

    @Override
    public String toString() { return "Point[x=" + x + ", y=" + y + "]"; }
}
```

## Constructor Details

Records provide flexible constructor definition methods, allowing validation and transformation during instance creation.

### Canonical Constructor

The canonical constructor corresponds one-to-one with Record components. You can explicitly define it to add validation logic:

```java
public record Temperature(double celsius) {
    // Explicit canonical constructor
    public Temperature(double celsius) {
        if (celsius < -273.15) {
            throw new IllegalArgumentException(
                "Temperature cannot be below absolute zero: " + celsius + " C");
        }
        this.celsius = celsius;
    }

    // Helper methods
    public double fahrenheit() {
        return celsius * 9 / 5 + 32;
    }

    public double kelvin() {
        return celsius + 273.15;
    }
}

// Usage
Temperature temp = new Temperature(25.0);
System.out.println(temp.celsius());    // 25.0
System.out.println(temp.fahrenheit()); // 77.0
System.out.println(temp.kelvin());     // 298.15

// Temperature invalid = new Temperature(-300);  // Throws IllegalArgumentException
```

### Compact Constructor

The compact constructor is a simplified syntax that omits the parameter list and field assignments, with field assignments done automatically by the compiler:

```java
public record Email(String address) {
    // Compact constructor: no parameter list, no explicit assignment
    public Email {
        // Validation
        if (address == null || address.isBlank()) {
            throw new IllegalArgumentException("Email address cannot be empty");
        }
        if (!address.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            throw new IllegalArgumentException("Invalid email format: " + address);
        }
        // Normalization
        address = address.toLowerCase().trim();
        // Compiler automatically adds: this.address = address;
    }
}

// Usage
Email email = new Email("  John.Doe@Example.COM  ");
System.out.println(email.address());  // john.doe@example.com
```

Advantages of compact constructor:
1. More concise code, no need to repeat parameter declarations
2. Parameter values can be modified, and modified values are assigned to fields
3. Compiler automatically adds field assignment statements at the end of the constructor

### Custom Constructors

Additional constructors can be added, but they must delegate to the canonical constructor:

```java
public record Rectangle(double width, double height) {

    // Compact constructor for validation
    public Rectangle {
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("Width and height must be positive");
        }
    }

    // Convenience constructor for creating squares
    public Rectangle(double side) {
        this(side, side);  // Must delegate to canonical constructor
    }

    // Create from diagonal coordinates
    public Rectangle(Point topLeft, Point bottomRight) {
        this(
            Math.abs(bottomRight.x() - topLeft.x()),
            Math.abs(bottomRight.y() - topLeft.y())
        );
    }

    // Instance methods
    public double area() {
        return width * height;
    }

    public double perimeter() {
        return 2 * (width + height);
    }

    public boolean isSquare() {
        return width == height;
    }
}

// Usage
Rectangle rect1 = new Rectangle(10, 20);
Rectangle square = new Rectangle(15);          // Square
Rectangle rect2 = new Rectangle(
    new Point(0, 0),
    new Point(100, 50)
);

System.out.println(rect1.area());      // 200.0
System.out.println(square.isSquare()); // true
System.out.println(rect2.width());     // 100.0
```

### Complex Validation and Transformation Example

```java
public record Money(BigDecimal amount, Currency currency) {

    public Money {
        // Null check
        Objects.requireNonNull(amount, "Amount cannot be null");
        Objects.requireNonNull(currency, "Currency cannot be null");

        // Amount validation
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount cannot be negative: " + amount);
        }

        // Normalization: set decimal places
        amount = amount.setScale(
            currency.getDefaultFractionDigits(),
            RoundingMode.HALF_UP
        );
    }

    // Create from string
    public Money(String amount, String currencyCode) {
        this(new BigDecimal(amount), Currency.getInstance(currencyCode));
    }

    // Currency operations
    public Money add(Money other) {
        validateSameCurrency(other);
        return new Money(amount.add(other.amount), currency);
    }

    public Money subtract(Money other) {
        validateSameCurrency(other);
        BigDecimal result = amount.subtract(other.amount);
        if (result.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Result cannot be negative");
        }
        return new Money(result, currency);
    }

    public Money multiply(int factor) {
        return new Money(amount.multiply(BigDecimal.valueOf(factor)), currency);
    }

    private void validateSameCurrency(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException(
                "Currency mismatch: " + currency + " vs " + other.currency);
        }
    }

    // Formatted output
    public String formatted() {
        NumberFormat format = NumberFormat.getCurrencyInstance();
        format.setCurrency(currency);
        return format.format(amount);
    }
}

// Usage
Money price = new Money("99.999", "USD");
System.out.println(price.amount());    // 100.00
System.out.println(price.formatted()); // $100.00

Money discount = new Money("20", "USD");
Money finalPrice = price.subtract(discount);
System.out.println(finalPrice.formatted()); // $80.00
```

## Accessor Methods

Records automatically generate accessor methods for each component, with method names matching component names (not the `getXxx` pattern).

### Default Accessors

```java
public record User(String username, String email, LocalDateTime createdAt) {}

User user = new User("zhangsan", "zhangsan@example.com", LocalDateTime.now());

// Accessor method names match component names
String name = user.username();
String email = user.email();
LocalDateTime created = user.createdAt();
```

### Overriding Accessor Methods

Accessor methods can be overridden to add additional logic, such as defensive copying:

```java
public record MutableContainer(List<String> items, Date timestamp) {

    // Compact constructor for defensive copying
    public MutableContainer {
        // Create immutable copy
        items = List.copyOf(items);
        timestamp = new Date(timestamp.getTime());
    }

    // Override accessor to return defensive copy
    @Override
    public List<String> items() {
        return items;  // Already immutable
    }

    @Override
    public Date timestamp() {
        return new Date(timestamp.getTime());  // Return copy
    }
}

// Usage
List<String> originalList = new ArrayList<>(List.of("A", "B"));
Date originalDate = new Date();

MutableContainer container = new MutableContainer(originalList, originalDate);

// Modifying original objects doesn't affect the Record
originalList.add("C");
originalDate.setTime(0);

System.out.println(container.items());  // [A, B]
System.out.println(container.timestamp().getTime() != 0);  // true

// Cannot modify the retrieved list
// container.items().add("D");  // Throws UnsupportedOperationException
```

### Accessors and Annotations

Annotations can be added to components, and these annotations propagate to corresponding fields, constructor parameters, and accessor methods:

```java
public record Product(
    @NotNull @Size(min = 1, max = 100) String name,
    @Positive BigDecimal price,
    @NotNull Category category
) {}

// Annotations are applied to:
// 1. The corresponding private field
// 2. The canonical constructor parameter
// 3. The accessor method
```

## Custom Methods and Static Members

Records can contain instance methods, static methods, static fields, and static initialization blocks.

### Instance Methods

```java
public record Circle(double radius) {

    public Circle {
        if (radius <= 0) {
            throw new IllegalArgumentException("Radius must be positive");
        }
    }

    // Calculate area
    public double area() {
        return Math.PI * radius * radius;
    }

    // Calculate circumference
    public double circumference() {
        return 2 * Math.PI * radius;
    }

    // Calculate diameter
    public double diameter() {
        return 2 * radius;
    }

    // Check if a point is contained
    public boolean contains(Point point) {
        double distance = Math.sqrt(point.x() * point.x() + point.y() * point.y());
        return distance <= radius;
    }

    // Create a larger circle
    public Circle scale(double factor) {
        return new Circle(radius * factor);
    }
}

// Usage
Circle circle = new Circle(5.0);
System.out.println("Area: " + circle.area());         // 78.54
System.out.println("Circumference: " + circle.circumference()); // 31.42
System.out.println("Contains origin: " + circle.contains(new Point(0, 0))); // true

Circle bigger = circle.scale(2);
System.out.println("Scaled radius: " + bigger.radius()); // 10.0
```

### Static Members

```java
public record HttpStatus(int code, String message) {

    // Static constants
    public static final HttpStatus OK = new HttpStatus(200, "OK");
    public static final HttpStatus CREATED = new HttpStatus(201, "Created");
    public static final HttpStatus BAD_REQUEST = new HttpStatus(400, "Bad Request");
    public static final HttpStatus NOT_FOUND = new HttpStatus(404, "Not Found");
    public static final HttpStatus INTERNAL_ERROR = new HttpStatus(500, "Internal Server Error");

    // Static factory method
    public static HttpStatus of(int code) {
        return switch (code) {
            case 200 -> OK;
            case 201 -> CREATED;
            case 400 -> BAD_REQUEST;
            case 404 -> NOT_FOUND;
            case 500 -> INTERNAL_ERROR;
            default -> new HttpStatus(code, "Unknown");
        };
    }

    // Validation
    public HttpStatus {
        if (code < 100 || code > 599) {
            throw new IllegalArgumentException("Invalid HTTP status code: " + code);
        }
    }

    // Instance methods
    public boolean isSuccessful() {
        return code >= 200 && code < 300;
    }

    public boolean isClientError() {
        return code >= 400 && code < 500;
    }

    public boolean isServerError() {
        return code >= 500;
    }

    public StatusCategory category() {
        return switch (code / 100) {
            case 1 -> StatusCategory.INFORMATIONAL;
            case 2 -> StatusCategory.SUCCESS;
            case 3 -> StatusCategory.REDIRECTION;
            case 4 -> StatusCategory.CLIENT_ERROR;
            case 5 -> StatusCategory.SERVER_ERROR;
            default -> throw new IllegalStateException();
        };
    }

    public enum StatusCategory {
        INFORMATIONAL, SUCCESS, REDIRECTION, CLIENT_ERROR, SERVER_ERROR
    }
}

// Usage
HttpStatus status = HttpStatus.of(404);
System.out.println(status);              // HttpStatus[code=404, message=Not Found]
System.out.println(status.isClientError()); // true
System.out.println(status.category());      // CLIENT_ERROR

if (status == HttpStatus.NOT_FOUND) {
    System.out.println("Resource not found");
}
```

## Implementing Interfaces

Records can implement one or more interfaces but cannot inherit from other classes (since they implicitly inherit from `java.lang.Record`).

### Basic Interface Implementation

```java
// Define interfaces
interface Printable {
    String toPrettyString();
}

interface Calculable {
    double calculate();
}

// Record implementing multiple interfaces
public record Invoice(
    String id,
    String customer,
    List<LineItem> items,
    LocalDate date
) implements Printable, Calculable {

    public Invoice {
        Objects.requireNonNull(id);
        Objects.requireNonNull(customer);
        items = List.copyOf(items);  // Immutable copy
        Objects.requireNonNull(date);
    }

    @Override
    public String toPrettyString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Invoice ID: ").append(id).append("\n");
        sb.append("Customer: ").append(customer).append("\n");
        sb.append("Date: ").append(date).append("\n");
        sb.append("Items:\n");
        for (LineItem item : items) {
            sb.append("  - ").append(item.toPrettyString()).append("\n");
        }
        sb.append("Total: ").append(String.format("%.2f", calculate()));
        return sb.toString();
    }

    @Override
    public double calculate() {
        return items.stream()
            .mapToDouble(LineItem::calculate)
            .sum();
    }
}

public record LineItem(
    String name,
    int quantity,
    double unitPrice
) implements Printable, Calculable {

    public LineItem {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        if (unitPrice < 0) {
            throw new IllegalArgumentException("Unit price cannot be negative");
        }
    }

    @Override
    public String toPrettyString() {
        return String.format("%s x %d @ %.2f = %.2f",
            name, quantity, unitPrice, calculate());
    }

    @Override
    public double calculate() {
        return quantity * unitPrice;
    }
}

// Usage
List<LineItem> items = List.of(
    new LineItem("Laptop", 2, 5999.00),
    new LineItem("Wireless Mouse", 3, 99.00)
);

Invoice invoice = new Invoice("INV-001", "John Doe", items, LocalDate.now());
System.out.println(invoice.toPrettyString());
```

### Implementing Comparable Interface

```java
public record Student(
    String id,
    String name,
    double gpa
) implements Comparable<Student> {

    public Student {
        Objects.requireNonNull(id);
        Objects.requireNonNull(name);
        if (gpa < 0 || gpa > 4.0) {
            throw new IllegalArgumentException("GPA must be between 0 and 4.0");
        }
    }

    @Override
    public int compareTo(Student other) {
        // Sort by GPA in descending order
        int gpaCompare = Double.compare(other.gpa, this.gpa);
        if (gpaCompare != 0) return gpaCompare;
        // If GPA is same, sort by name
        return this.name.compareTo(other.name);
    }

    // Static comparators
    public static Comparator<Student> byName() {
        return Comparator.comparing(Student::name);
    }

    public static Comparator<Student> byGpa() {
        return Comparator.comparingDouble(Student::gpa).reversed();
    }
}

// Usage
List<Student> students = new ArrayList<>(List.of(
    new Student("001", "Alice", 3.8),
    new Student("002", "Bob", 3.9),
    new Student("003", "Charlie", 3.8)
));

Collections.sort(students);
students.forEach(System.out::println);
// Student[id=002, name=Bob, gpa=3.9]
// Student[id=003, name=Charlie, gpa=3.8]
// Student[id=001, name=Alice, gpa=3.8]
```

## Sealed Types and Records

Sealed Classes introduced in Java 17 pair perfectly with Records to build type-safe Algebraic Data Types (ADT).

### Sealed Interface with Record Implementation

```java
// Sealed interface defines all permitted implementation types
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
    double perimeter();
}

// Record as sealed interface implementation
public record Circle(double radius) implements Shape {
    public Circle {
        if (radius <= 0) throw new IllegalArgumentException("Radius must be positive");
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }

    @Override
    public double perimeter() {
        return 2 * Math.PI * radius;
    }
}

public record Rectangle(double width, double height) implements Shape {
    public Rectangle {
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("Width and height must be positive");
        }
    }

    @Override
    public double area() {
        return width * height;
    }

    @Override
    public double perimeter() {
        return 2 * (width + height);
    }
}

public record Triangle(double a, double b, double c) implements Shape {
    public Triangle {
        if (a <= 0 || b <= 0 || c <= 0) {
            throw new IllegalArgumentException("Side lengths must be positive");
        }
        if (a + b <= c || b + c <= a || a + c <= b) {
            throw new IllegalArgumentException("Triangle inequality not satisfied");
        }
    }

    @Override
    public double area() {
        double s = (a + b + c) / 2;
        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }

    @Override
    public double perimeter() {
        return a + b + c;
    }
}
```

### Expression Tree Example

```java
// Sealed interface representing mathematical expressions
public sealed interface Expr permits Num, Add, Mul, Var {
    double compute(Map<String, Double> env);
    String format();
}

public record Num(double value) implements Expr {
    @Override
    public double compute(Map<String, Double> env) {
        return value;
    }

    @Override
    public String format() {
        return String.valueOf(value);
    }
}

public record Var(String name) implements Expr {
    public Var {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Variable name cannot be empty");
        }
    }

    @Override
    public double compute(Map<String, Double> env) {
        Double val = env.get(name);
        if (val == null) {
            throw new IllegalArgumentException("Undefined variable: " + name);
        }
        return val;
    }

    @Override
    public String format() {
        return name;
    }
}

public record Add(Expr left, Expr right) implements Expr {
    @Override
    public double compute(Map<String, Double> env) {
        return left.compute(env) + right.compute(env);
    }

    @Override
    public String format() {
        return "(" + left.format() + " + " + right.format() + ")";
    }
}

public record Mul(Expr left, Expr right) implements Expr {
    @Override
    public double compute(Map<String, Double> env) {
        return left.compute(env) * right.compute(env);
    }

    @Override
    public String format() {
        return "(" + left.format() + " * " + right.format() + ")";
    }
}

// Usage: compute (x + 2) * 3
Expr expr = new Mul(
    new Add(new Var("x"), new Num(2)),
    new Num(3)
);

System.out.println(expr.format());  // ((x + 2) * 3)

Map<String, Double> env = Map.of("x", 5.0);
System.out.println(expr.compute(env));  // 21.0
```

### Result Pattern

```java
// Sealed interface representing operation result
public sealed interface Result<T> permits Result.Success, Result.Failure {

    boolean isSuccess();
    T getOrThrow();
    <U> Result<U> map(Function<T, U> mapper);
    <U> Result<U> flatMap(Function<T, Result<U>> mapper);

    record Success<T>(T value) implements Result<T> {
        @Override
        public boolean isSuccess() { return true; }

        @Override
        public T getOrThrow() { return value; }

        @Override
        public <U> Result<U> map(Function<T, U> mapper) {
            return new Success<>(mapper.apply(value));
        }

        @Override
        public <U> Result<U> flatMap(Function<T, Result<U>> mapper) {
            return mapper.apply(value);
        }
    }

    record Failure<T>(String error) implements Result<T> {
        @Override
        public boolean isSuccess() { return false; }

        @Override
        public T getOrThrow() {
            throw new IllegalStateException(error);
        }

        @Override
        @SuppressWarnings("unchecked")
        public <U> Result<U> map(Function<T, U> mapper) {
            return (Result<U>) this;
        }

        @Override
        @SuppressWarnings("unchecked")
        public <U> Result<U> flatMap(Function<T, Result<U>> mapper) {
            return (Result<U>) this;
        }
    }

    // Static factory methods
    static <T> Result<T> success(T value) {
        return new Success<>(value);
    }

    static <T> Result<T> failure(String error) {
        return new Failure<>(error);
    }

    static <T> Result<T> of(Supplier<T> supplier) {
        try {
            return success(supplier.get());
        } catch (Exception e) {
            return failure(e.getMessage());
        }
    }
}

// Usage
Result<Integer> result = Result.of(() -> Integer.parseInt("42"))
    .map(n -> n * 2)
    .flatMap(n -> n > 0 ? Result.success(n) : Result.failure("Must be positive"));

if (result.isSuccess()) {
    System.out.println("Result: " + result.getOrThrow());  // Result: 84
}
```

## Pattern Matching

Pattern matching introduced in Java 16+ combined with Records provides powerful data destructuring capabilities.

### instanceof Pattern Matching

```java
public record Point(int x, int y) {}
public record Circle(Point center, double radius) {}

public static String describe(Object obj) {
    if (obj instanceof Point p) {
        return String.format("Point (%d, %d)", p.x(), p.y());
    } else if (obj instanceof Circle c) {
        return String.format("Circle centered at %s with radius %.2f",
            describe(c.center()), c.radius());
    } else {
        return "Unknown object";
    }
}

// Usage
System.out.println(describe(new Point(10, 20)));
// Point (10, 20)

System.out.println(describe(new Circle(new Point(0, 0), 5.0)));
// Circle centered at Point (0, 0) with radius 5.00
```

### switch Expression Pattern Matching (Java 21+)

```java
sealed interface Shape permits Circle, Rectangle, Triangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}
record Triangle(double a, double b, double c) implements Shape {}

public static double calculateArea(Shape shape) {
    return switch (shape) {
        case Circle(double r) -> Math.PI * r * r;
        case Rectangle(double w, double h) -> w * h;
        case Triangle(double a, double b, double c) -> {
            double s = (a + b + c) / 2;
            yield Math.sqrt(s * (s - a) * (s - b) * (s - c));
        }
    };
}

public static String describeShape(Shape shape) {
    return switch (shape) {
        case Circle(double r) when r > 10 -> "Large circle";
        case Circle(double r) -> "Small circle";
        case Rectangle(double w, double h) when w == h -> "Square";
        case Rectangle(double w, double h) -> "Rectangle";
        case Triangle t -> "Triangle";
    };
}

// Usage
Shape circle = new Circle(15);
Shape rectangle = new Rectangle(10, 10);

System.out.println(calculateArea(circle));      // 706.86
System.out.println(describeShape(circle));      // Large circle
System.out.println(describeShape(rectangle));   // Square
```

### Nested Pattern Deconstruction (Java 21+)

```java
public record Point(int x, int y) {}
public record Line(Point start, Point end) {}
public record ColoredLine(Line line, String color) {}

public static String analyzeLine(Object obj) {
    return switch (obj) {
        // Nested deconstruction: directly extract deep components
        case Line(Point(int x1, int y1), Point(int x2, int y2)) ->
            String.format("Line from (%d, %d) to (%d, %d)", x1, y1, x2, y2);

        // Deeper nesting
        case ColoredLine(Line(Point(int x1, int y1), Point(int x2, int y2)), String color) ->
            String.format("%s line from (%d, %d) to (%d, %d)", color, x1, y1, x2, y2);

        default -> "Unknown type";
    };
}

// Usage
Line line = new Line(new Point(0, 0), new Point(3, 4));
ColoredLine coloredLine = new ColoredLine(line, "Red");

System.out.println(analyzeLine(line));
// Line from (0, 0) to (3, 4)

System.out.println(analyzeLine(coloredLine));
// Red line from (0, 0) to (3, 4)
```

### Guarded Patterns

```java
public record Order(String id, double amount, OrderStatus status) {}

public enum OrderStatus {
    PENDING, PAID, SHIPPED, DELIVERED, CANCELLED
}

public static String processOrder(Order order) {
    return switch (order) {
        case Order(String id, double amt, OrderStatus s) when amt > 10000 && s == OrderStatus.PENDING ->
            "Large order pending: " + id;

        case Order(String id, double amt, OrderStatus s) when amt > 10000 ->
            "Large order " + id + " status: " + s;

        case Order(String id, _, OrderStatus.CANCELLED) ->
            "Cancelled order: " + id;

        case Order(String id, _, OrderStatus.DELIVERED) ->
            "Completed order: " + id;

        case Order(String id, double amt, _) ->
            String.format("Regular order %s, amount %.2f", id, amt);
    };
}

// Usage
Order bigOrder = new Order("ORD-001", 15000, OrderStatus.PENDING);
Order cancelled = new Order("ORD-002", 500, OrderStatus.CANCELLED);

System.out.println(processOrder(bigOrder));   // Large order pending: ORD-001
System.out.println(processOrder(cancelled));  // Cancelled order: ORD-002
```

## Records and Collections

Records are naturally suited for collection operations, especially when combined with the Stream API.

### As Collection Elements

```java
public record Employee(String id, String name, String department, double salary) {}

List<Employee> employees = List.of(
    new Employee("E001", "Alice", "Engineering", 15000),
    new Employee("E002", "Bob", "Engineering", 18000),
    new Employee("E003", "Charlie", "Sales", 12000),
    new Employee("E004", "Diana", "Sales", 14000),
    new Employee("E005", "Eve", "Engineering", 20000)
);

// Group by department
Map<String, List<Employee>> byDepartment = employees.stream()
    .collect(Collectors.groupingBy(Employee::department));

// Average salary by department
Map<String, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::department,
        Collectors.averagingDouble(Employee::salary)
    ));

// Highest paid employee
Optional<Employee> highest = employees.stream()
    .max(Comparator.comparingDouble(Employee::salary));

// Names of employees earning over 15000
List<String> highEarners = employees.stream()
    .filter(e -> e.salary() > 15000)
    .map(Employee::name)
    .toList();

System.out.println("By department: " + byDepartment);
System.out.println("Average salary: " + avgSalaryByDept);
System.out.println("Highest salary: " + highest);
System.out.println("High earners: " + highEarners);
```

### As Map Keys

Since Records automatically generate correct `equals()` and `hashCode()`, they are ideal as Map keys:

```java
public record Coordinate(int row, int col) {}

// Game board
Map<Coordinate, String> board = new HashMap<>();
board.put(new Coordinate(0, 0), "Rook");
board.put(new Coordinate(0, 4), "King");
board.put(new Coordinate(7, 0), "Rook");

// Lookup
String piece = board.get(new Coordinate(0, 0));  // "Rook"

// Cache example
public record CacheKey(String userId, String resourceType, String resourceId) {}

Map<CacheKey, Object> cache = new ConcurrentHashMap<>();
cache.put(new CacheKey("user1", "product", "prod123"), productData);
```

### Complex Data Transformation

```java
public record RawData(String date, String category, double value) {}
public record Summary(String category, double total, double average, long count) {}

List<RawData> rawDataList = List.of(
    new RawData("2024-01-01", "A", 100),
    new RawData("2024-01-01", "B", 200),
    new RawData("2024-01-02", "A", 150),
    new RawData("2024-01-02", "A", 120),
    new RawData("2024-01-02", "B", 180)
);

// Summarize by category
List<Summary> summaries = rawDataList.stream()
    .collect(Collectors.groupingBy(RawData::category))
    .entrySet().stream()
    .map(entry -> {
        String category = entry.getKey();
        List<RawData> data = entry.getValue();
        double total = data.stream().mapToDouble(RawData::value).sum();
        double average = data.stream().mapToDouble(RawData::value).average().orElse(0);
        return new Summary(category, total, average, data.size());
    })
    .toList();

summaries.forEach(System.out::println);
// Summary[category=A, total=370.0, average=123.33, count=3]
// Summary[category=B, total=380.0, average=190.0, count=2]
```

## Serialization and JSON

Records naturally support serialization and integrate well with common JSON libraries.

### Java Serialization

```java
public record User(String name, int age) implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;
}

// Serialization
User user = new User("Alice", 25);
try (ObjectOutputStream oos = new ObjectOutputStream(
        new FileOutputStream("user.ser"))) {
    oos.writeObject(user);
}

// Deserialization
try (ObjectInputStream ois = new ObjectInputStream(
        new FileInputStream("user.ser"))) {
    User loaded = (User) ois.readObject();
    System.out.println(loaded);  // User[name=Alice, age=25]
}
```

### Jackson JSON

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

public record Event(
    String id,
    String name,
    LocalDateTime timestamp,
    List<String> tags
) {}

ObjectMapper mapper = new ObjectMapper();
mapper.registerModule(new JavaTimeModule());

// Serialize to JSON
Event event = new Event(
    "evt-001",
    "User Login",
    LocalDateTime.now(),
    List.of("security", "audit")
);

String json = mapper.writeValueAsString(event);
System.out.println(json);
// {"id":"evt-001","name":"User Login","timestamp":"2024-01-15T10:30:00","tags":["security","audit"]}

// Deserialize from JSON
Event deserialized = mapper.readValue(json, Event.class);
System.out.println(deserialized.name());  // User Login
```

### Gson

```java
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public record Product(String name, double price, boolean inStock) {}

Gson gson = new GsonBuilder().setPrettyPrinting().create();

Product product = new Product("Laptop", 5999.00, true);

// Serialization
String json = gson.toJson(product);
System.out.println(json);
/*
{
  "name": "Laptop",
  "price": 5999.0,
  "inStock": true
}
*/

// Deserialization
Product fromJson = gson.fromJson(json, Product.class);
System.out.println(fromJson.name());  // Laptop
```

## Record Limitations

Understanding Record limitations helps in using them correctly.

### Cannot Inherit Other Classes

```java
// Error: Records cannot extend classes
// public record SpecialPoint(int x, int y) extends Point {}  // Compilation error

// Correct: Can implement interfaces
public record Point(int x, int y) implements Serializable, Comparable<Point> {
    @Override
    public int compareTo(Point other) {
        int result = Integer.compare(this.x, other.x);
        return result != 0 ? result : Integer.compare(this.y, other.y);
    }
}
```

### Cannot Declare Additional Instance Fields

```java
// Error: Cannot declare instance fields
public record Counter(int value) {
    // private int additionalField;  // Compilation error
}

// Correct: Can derive values through methods
public record Counter(int value) {
    public int doubled() {
        return value * 2;
    }

    public boolean isPositive() {
        return value > 0;
    }
}
```

### Implicitly Final, Cannot Be Extended

```java
// Error: Records are implicitly final
// public record BaseRecord(String name) {}
// public record ExtendedRecord(String name, int age) extends BaseRecord {}  // Compilation error

// Correct: Use composition instead of inheritance
public record Address(String street, String city) {}
public record Person(String name, Address address) {}  // Composition
```

### Cannot Be Abstract

```java
// Error: Records cannot be abstract
// public abstract record Shape(String name) {}  // Compilation error

// Correct: Use sealed interface
public sealed interface Shape permits Circle, Rectangle {}
public record Circle(double radius) implements Shape {}
public record Rectangle(double width, double height) implements Shape {}
```

### Components Cannot Use var Type

```java
// Error: Components cannot use var
// public record Point(var x, var y) {}  // Compilation error

// Correct: Must explicitly declare types
public record Point(int x, int y) {}
```

## Best Practices

### Keep Records Simple and Pure

Records should focus on storing data, avoid adding too much business logic:

```java
// Good: Simple data carrier
public record UserDTO(String id, String username, String email) {}

// Bad: Contains too much business logic (should be in service class)
public record User(String id, String username, String email) {
    public void sendEmail(String subject, String body) { /* ... */ }
    public void updateDatabase() { /* ... */ }
    public void validatePermissions() { /* ... */ }
}
```

### Validate in Compact Constructor

```java
public record Age(int value) {
    public Age {
        if (value < 0 || value > 150) {
            throw new IllegalArgumentException(
                "Age must be between 0 and 150: " + value);
        }
    }
}

public record NonEmptyList<T>(List<T> items) {
    public NonEmptyList {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("List cannot be empty");
        }
        items = List.copyOf(items);  // Defensive copy
    }
}
```

### Use Static Factory Methods

```java
public record Color(int red, int green, int blue) {

    public Color {
        validateComponent("red", red);
        validateComponent("green", green);
        validateComponent("blue", blue);
    }

    private static void validateComponent(String name, int value) {
        if (value < 0 || value > 255) {
            throw new IllegalArgumentException(
                name + " must be between 0 and 255: " + value);
        }
    }

    // Static factory methods
    public static Color fromHex(String hex) {
        if (hex.startsWith("#")) {
            hex = hex.substring(1);
        }
        int rgb = Integer.parseInt(hex, 16);
        return new Color(
            (rgb >> 16) & 0xFF,
            (rgb >> 8) & 0xFF,
            rgb & 0xFF
        );
    }

    // Predefined colors
    public static final Color RED = new Color(255, 0, 0);
    public static final Color GREEN = new Color(0, 255, 0);
    public static final Color BLUE = new Color(0, 0, 255);
    public static final Color WHITE = new Color(255, 255, 255);
    public static final Color BLACK = new Color(0, 0, 0);

    // Instance methods
    public String toHex() {
        return String.format("#%02X%02X%02X", red, green, blue);
    }
}

// Usage
Color color = Color.fromHex("#FF5733");
System.out.println(color);        // Color[red=255, green=87, blue=51]
System.out.println(color.toHex()); // #FF5733
```

### Ensure Collection Immutability

```java
public record Order(
    String orderId,
    List<OrderItem> items,
    Map<String, String> metadata
) {
    public Order {
        Objects.requireNonNull(orderId);
        // Create immutable copies
        items = items != null ? List.copyOf(items) : List.of();
        metadata = metadata != null ? Map.copyOf(metadata) : Map.of();
    }

    // Add new item (returns new Record)
    public Order withItem(OrderItem item) {
        List<OrderItem> newItems = new ArrayList<>(items);
        newItems.add(item);
        return new Order(orderId, newItems, metadata);
    }

    // Add metadata (returns new Record)
    public Order withMetadata(String key, String value) {
        Map<String, String> newMetadata = new HashMap<>(metadata);
        newMetadata.put(key, value);
        return new Order(orderId, items, newMetadata);
    }
}
```

### Use with-style Methods Appropriately

Since Records are immutable, provide "with" methods to create modified copies:

```java
public record Person(String name, int age, String email) {

    public Person withName(String name) {
        return new Person(name, this.age, this.email);
    }

    public Person withAge(int age) {
        return new Person(this.name, age, this.email);
    }

    public Person withEmail(String email) {
        return new Person(this.name, this.age, email);
    }
}

// Usage
Person person = new Person("Alice", 25, "alice@example.com");
Person updated = person.withAge(26).withEmail("new@example.com");

System.out.println(person);   // Original object unchanged
System.out.println(updated);  // New object
```

## Practical Examples

### API Response Wrapper

```java
public record ApiResponse<T>(
    int code,
    String message,
    T data,
    long timestamp
) {
    public ApiResponse {
        if (code < 0) {
            throw new IllegalArgumentException("Status code cannot be negative");
        }
        if (timestamp <= 0) {
            timestamp = System.currentTimeMillis();
        }
    }

    // Success response
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "success", data, System.currentTimeMillis());
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(200, message, data, System.currentTimeMillis());
    }

    // Error response
    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null, System.currentTimeMillis());
    }

    public static <T> ApiResponse<T> badRequest(String message) {
        return error(400, message);
    }

    public static <T> ApiResponse<T> notFound(String message) {
        return error(404, message);
    }

    public static <T> ApiResponse<T> serverError(String message) {
        return error(500, message);
    }

    // Utility method
    public boolean isSuccess() {
        return code >= 200 && code < 300;
    }
}

// Usage
ApiResponse<User> response = ApiResponse.success(new User("Alice", 25));
if (response.isSuccess()) {
    User user = response.data();
    // Process user data
}
```

### Domain Event Modeling

```java
// Sealed interface defines all domain events
public sealed interface DomainEvent permits
    UserRegistered, UserUpdated, OrderPlaced, OrderShipped, PaymentReceived {

    String eventId();
    LocalDateTime occurredAt();
}

public record UserRegistered(
    String eventId,
    LocalDateTime occurredAt,
    String userId,
    String username,
    String email
) implements DomainEvent {

    public UserRegistered {
        Objects.requireNonNull(userId);
        Objects.requireNonNull(username);
        if (eventId == null) {
            eventId = UUID.randomUUID().toString();
        }
        if (occurredAt == null) {
            occurredAt = LocalDateTime.now();
        }
    }

    public static UserRegistered create(String userId, String username, String email) {
        return new UserRegistered(null, null, userId, username, email);
    }
}

public record OrderPlaced(
    String eventId,
    LocalDateTime occurredAt,
    String orderId,
    String userId,
    List<String> productIds,
    BigDecimal totalAmount
) implements DomainEvent {

    public OrderPlaced {
        Objects.requireNonNull(orderId);
        Objects.requireNonNull(userId);
        productIds = List.copyOf(productIds);
        if (eventId == null) {
            eventId = UUID.randomUUID().toString();
        }
        if (occurredAt == null) {
            occurredAt = LocalDateTime.now();
        }
    }
}

public record OrderShipped(
    String eventId,
    LocalDateTime occurredAt,
    String orderId,
    String trackingNumber,
    String carrier
) implements DomainEvent {

    public OrderShipped {
        Objects.requireNonNull(orderId);
        if (eventId == null) {
            eventId = UUID.randomUUID().toString();
        }
        if (occurredAt == null) {
            occurredAt = LocalDateTime.now();
        }
    }
}

public record UserUpdated(
    String eventId,
    LocalDateTime occurredAt,
    String userId,
    Map<String, Object> changes
) implements DomainEvent {

    public UserUpdated {
        Objects.requireNonNull(userId);
        changes = Map.copyOf(changes);
        if (eventId == null) {
            eventId = UUID.randomUUID().toString();
        }
        if (occurredAt == null) {
            occurredAt = LocalDateTime.now();
        }
    }
}

public record PaymentReceived(
    String eventId,
    LocalDateTime occurredAt,
    String paymentId,
    String orderId,
    BigDecimal amount,
    String currency
) implements DomainEvent {

    public PaymentReceived {
        Objects.requireNonNull(paymentId);
        Objects.requireNonNull(orderId);
        if (eventId == null) {
            eventId = UUID.randomUUID().toString();
        }
        if (occurredAt == null) {
            occurredAt = LocalDateTime.now();
        }
    }
}

// Event processor using pattern matching
public class EventProcessor {

    public void process(DomainEvent event) {
        switch (event) {
            case UserRegistered(_, _, String userId, String username, String email) -> {
                System.out.println("New user registered: " + username);
                sendWelcomeEmail(email);
            }

            case OrderPlaced(_, _, String orderId, String userId, var products, var amount) -> {
                System.out.println("New order: " + orderId + ", amount: " + amount);
                notifyWarehouse(orderId, products);
            }

            case OrderShipped(_, _, String orderId, String tracking, String carrier) -> {
                System.out.println("Order shipped: " + orderId);
                notifyCustomer(orderId, tracking, carrier);
            }

            case UserUpdated(_, _, String userId, var changes) -> {
                System.out.println("User updated: " + userId);
                auditChanges(userId, changes);
            }

            case PaymentReceived(_, _, String paymentId, String orderId, var amount, _) -> {
                System.out.println("Payment received: " + paymentId + ", amount: " + amount);
                updateOrderStatus(orderId);
            }
        }
    }

    private void sendWelcomeEmail(String email) { /* ... */ }
    private void notifyWarehouse(String orderId, List<String> products) { /* ... */ }
    private void notifyCustomer(String orderId, String tracking, String carrier) { /* ... */ }
    private void auditChanges(String userId, Map<String, Object> changes) { /* ... */ }
    private void updateOrderStatus(String orderId) { /* ... */ }
}
```

### Configuration Management

```java
public record DatabaseConfig(
    String host,
    int port,
    String database,
    String username,
    String password,
    int poolSize,
    Duration connectionTimeout,
    boolean ssl
) {
    public DatabaseConfig {
        // Default value handling
        if (host == null || host.isBlank()) {
            host = "localhost";
        }
        if (port <= 0) {
            port = 5432;
        }
        if (poolSize <= 0) {
            poolSize = 10;
        }
        if (connectionTimeout == null) {
            connectionTimeout = Duration.ofSeconds(30);
        }

        // Validation
        Objects.requireNonNull(database, "Database name cannot be empty");
        Objects.requireNonNull(username, "Username cannot be empty");
        Objects.requireNonNull(password, "Password cannot be empty");
    }

    // Builder
    public static class Builder {
        private String host = "localhost";
        private int port = 5432;
        private String database;
        private String username;
        private String password;
        private int poolSize = 10;
        private Duration connectionTimeout = Duration.ofSeconds(30);
        private boolean ssl = false;

        public Builder host(String host) { this.host = host; return this; }
        public Builder port(int port) { this.port = port; return this; }
        public Builder database(String database) { this.database = database; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder password(String password) { this.password = password; return this; }
        public Builder poolSize(int poolSize) { this.poolSize = poolSize; return this; }
        public Builder connectionTimeout(Duration timeout) { this.connectionTimeout = timeout; return this; }
        public Builder ssl(boolean ssl) { this.ssl = ssl; return this; }

        public DatabaseConfig build() {
            return new DatabaseConfig(host, port, database, username, password,
                poolSize, connectionTimeout, ssl);
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    // JDBC URL generation
    public String jdbcUrl() {
        String protocol = ssl ? "jdbc:postgresql" : "jdbc:postgresql";
        return String.format("%s://%s:%d/%s%s",
            protocol, host, port, database,
            ssl ? "?ssl=true" : "");
    }
}

// Usage
DatabaseConfig config = DatabaseConfig.builder()
    .host("db.example.com")
    .port(5432)
    .database("myapp")
    .username("admin")
    .password("secret")
    .poolSize(20)
    .ssl(true)
    .build();

System.out.println(config.jdbcUrl());
// jdbc:postgresql://db.example.com:5432/myapp?ssl=true
```

## Summary

Java Records is an indispensable feature in modern Java development, providing:

- **Conciseness**: One line of code replaces dozens of lines of boilerplate code
- **Immutability**: Naturally thread-safe, suitable for functional programming
- **Transparency**: Clearly expresses the intent of data carriers
- **Pattern Matching**: Integrates perfectly with new Java features
- **Type Safety**: Compile-time checking reduces runtime errors

Records are particularly suitable for:
- Data Transfer Objects (DTO)
- API Request/Response objects
- Domain events and value objects
- Configuration objects
- Immutable data structures
- Building algebraic data types with sealed types

By using Records appropriately, you can write more concise, safer, and more maintainable Java code. As the Java language continues to evolve, the combination of Records and pattern matching will become increasingly powerful - a core skill every Java developer should master.
