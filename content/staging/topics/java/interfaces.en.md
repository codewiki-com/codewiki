---
title: Java Interfaces
description: Deep dive into Java interfaces including default methods, static methods, functional interfaces and design patterns
track: java
section: oop-generics
difficulty: intermediate
tags:
  - Java
  - interfaces
  - OOP
  - design patterns
status: imported
origin: old/src/content/docs/java/interfaces.en.md
divergence: 0.22
issues: []
legacy:
  category: Java
  subcategory: OOP
  order: 20
  lastUpdated: 2026-01-07
---

Java interfaces are one of the most powerful abstraction mechanisms in the language. An interface defines a contract that implementing classes must follow, specifying what a class can do without dictating how it should do it. Since Java 8, interfaces have evolved significantly with the addition of default methods, static methods, and private methods (Java 9), making them even more versatile.

## Introduction to Interfaces

An interface in Java is a reference type that defines a contract of behaviors that implementing classes must provide. Before Java 8, interfaces could only contain abstract method declarations and constants. Modern Java has expanded interfaces to include default methods, static methods, and private methods while maintaining backward compatibility.

### Why Use Interfaces?

```java
// Without interfaces - tightly coupled code
public class EmailNotificationService {
    public void sendNotification(String message) {
        System.out.println("Sending email: " + message);
    }
}

public class OrderProcessor {
    private EmailNotificationService emailService;

    public OrderProcessor() {
        // Tightly coupled to EmailNotificationService
        this.emailService = new EmailNotificationService();
    }

    public void processOrder(Order order) {
        // Process order...
        emailService.sendNotification("Order processed: " + order.getId());
    }
}

// With interfaces - loosely coupled, flexible code
public interface NotificationService {
    void sendNotification(String message);
}

public class EmailNotificationService implements NotificationService {
    @Override
    public void sendNotification(String message) {
        System.out.println("Sending email: " + message);
    }
}

public class SMSNotificationService implements NotificationService {
    @Override
    public void sendNotification(String message) {
        System.out.println("Sending SMS: " + message);
    }
}

public class OrderProcessor {
    private NotificationService notificationService;

    // Dependency injection - any NotificationService implementation works
    public OrderProcessor(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    public void processOrder(Order order) {
        // Process order...
        notificationService.sendNotification("Order processed: " + order.getId());
    }
}
```

## Basic Interface Syntax

### Defining an Interface

```java
public interface Drawable {
    // Constant (public static final by default)
    int DEFAULT_COLOR = 0x000000;

    // Abstract method (public abstract by default)
    void draw();

    // Abstract method with parameters and return value
    boolean resize(int width, int height);

    // Abstract method with generic parameter
    void setColor(String color);
}
```

### Interface Characteristics

All members of an interface have implicit modifiers:

```java
public interface InterfaceCharacteristics {
    // Variables are implicitly: public static final
    int CONSTANT = 100;  // Same as: public static final int CONSTANT = 100;

    // Methods are implicitly: public abstract (before Java 8)
    void doSomething();  // Same as: public abstract void doSomething();

    // Cannot have instance fields
    // private int instanceField;  // Compile error

    // Cannot have constructors
    // public InterfaceCharacteristics() {}  // Compile error
}
```

## Implementing Interfaces

### Single Interface Implementation

```java
public interface Vehicle {
    void start();
    void stop();
    int getSpeed();
    void accelerate(int increment);
}

public class Car implements Vehicle {
    private String brand;
    private int currentSpeed;
    private boolean isRunning;

    public Car(String brand) {
        this.brand = brand;
        this.currentSpeed = 0;
        this.isRunning = false;
    }

    @Override
    public void start() {
        isRunning = true;
        System.out.println(brand + " car started");
    }

    @Override
    public void stop() {
        isRunning = false;
        currentSpeed = 0;
        System.out.println(brand + " car stopped");
    }

    @Override
    public int getSpeed() {
        return currentSpeed;
    }

    @Override
    public void accelerate(int increment) {
        if (isRunning) {
            currentSpeed += increment;
            System.out.println("Accelerating to " + currentSpeed + " km/h");
        } else {
            System.out.println("Cannot accelerate - car is not running");
        }
    }
}

// Usage
public class VehicleDemo {
    public static void main(String[] args) {
        Vehicle car = new Car("Toyota");
        car.start();
        car.accelerate(50);
        car.accelerate(30);
        System.out.println("Current speed: " + car.getSpeed());
        car.stop();
    }
}
```

### Polymorphism with Interfaces

```java
public interface Shape {
    double calculateArea();
    double calculatePerimeter();
    void draw();
}

public class Circle implements Shape {
    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double calculateArea() {
        return Math.PI * radius * radius;
    }

    @Override
    public double calculatePerimeter() {
        return 2 * Math.PI * radius;
    }

    @Override
    public void draw() {
        System.out.println("Drawing circle with radius " + radius);
    }
}

public class Rectangle implements Shape {
    private double width;
    private double height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double calculateArea() {
        return width * height;
    }

    @Override
    public double calculatePerimeter() {
        return 2 * (width + height);
    }

    @Override
    public void draw() {
        System.out.println("Drawing rectangle " + width + "x" + height);
    }
}

public class Triangle implements Shape {
    private double a, b, c;

    public Triangle(double a, double b, double c) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    @Override
    public double calculateArea() {
        // Heron's formula
        double s = (a + b + c) / 2;
        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }

    @Override
    public double calculatePerimeter() {
        return a + b + c;
    }

    @Override
    public void draw() {
        System.out.println("Drawing triangle with sides " + a + ", " + b + ", " + c);
    }
}

// Polymorphic usage
public class ShapeProcessor {
    public static void processShapes(Shape[] shapes) {
        double totalArea = 0;

        for (Shape shape : shapes) {
            shape.draw();
            System.out.println("  Area: " + shape.calculateArea());
            System.out.println("  Perimeter: " + shape.calculatePerimeter());
            totalArea += shape.calculateArea();
        }

        System.out.println("Total area of all shapes: " + totalArea);
    }

    public static void main(String[] args) {
        Shape[] shapes = {
            new Circle(5),
            new Rectangle(4, 6),
            new Triangle(3, 4, 5)
        };

        processShapes(shapes);
    }
}
```

## Multiple Interface Implementation

Java allows a class to implement multiple interfaces, providing a form of multiple inheritance for behavior.

```java
public interface Flyable {
    void takeOff();
    void fly();
    void land();
    int getAltitude();
}

public interface Swimmable {
    void dive();
    void swim();
    void surface();
    int getDepth();
}

public interface Walkable {
    void walk();
    void run();
    void stop();
    int getSpeed();
}

// Duck implements all three interfaces
public class Duck implements Flyable, Swimmable, Walkable {
    private String name;
    private int altitude;
    private int depth;
    private int speed;

    public Duck(String name) {
        this.name = name;
        this.altitude = 0;
        this.depth = 0;
        this.speed = 0;
    }

    // Flyable implementation
    @Override
    public void takeOff() {
        altitude = 10;
        System.out.println(name + " is taking off!");
    }

    @Override
    public void fly() {
        altitude += 50;
        System.out.println(name + " is flying at " + altitude + " meters");
    }

    @Override
    public void land() {
        altitude = 0;
        System.out.println(name + " has landed");
    }

    @Override
    public int getAltitude() {
        return altitude;
    }

    // Swimmable implementation
    @Override
    public void dive() {
        depth = 5;
        System.out.println(name + " is diving!");
    }

    @Override
    public void swim() {
        System.out.println(name + " is swimming at depth " + depth + " meters");
    }

    @Override
    public void surface() {
        depth = 0;
        System.out.println(name + " has surfaced");
    }

    @Override
    public int getDepth() {
        return depth;
    }

    // Walkable implementation
    @Override
    public void walk() {
        speed = 2;
        System.out.println(name + " is walking at " + speed + " km/h");
    }

    @Override
    public void run() {
        speed = 8;
        System.out.println(name + " is running at " + speed + " km/h");
    }

    @Override
    public void stop() {
        speed = 0;
        System.out.println(name + " has stopped");
    }

    @Override
    public int getSpeed() {
        return speed;
    }
}

// Usage demonstrating interface segregation
public class MultipleInterfaceDemo {
    public static void main(String[] args) {
        Duck duck = new Duck("Donald");

        // Use as Flyable
        Flyable flyer = duck;
        flyer.takeOff();
        flyer.fly();
        flyer.land();

        System.out.println("---");

        // Use as Swimmable
        Swimmable swimmer = duck;
        swimmer.dive();
        swimmer.swim();
        swimmer.surface();

        System.out.println("---");

        // Use as Walkable
        Walkable walker = duck;
        walker.walk();
        walker.run();
        walker.stop();
    }
}
```

## Interface Inheritance

Interfaces can extend other interfaces, creating an inheritance hierarchy.

```java
// Base interface
public interface Entity {
    Long getId();
    void setId(Long id);
}

// Extended interface
public interface Auditable extends Entity {
    LocalDateTime getCreatedAt();
    void setCreatedAt(LocalDateTime createdAt);
    LocalDateTime getUpdatedAt();
    void setUpdatedAt(LocalDateTime updatedAt);
    String getCreatedBy();
    void setCreatedBy(String createdBy);
}

// Multiple interface inheritance
public interface SoftDeletable {
    boolean isDeleted();
    void setDeleted(boolean deleted);
    LocalDateTime getDeletedAt();
    void setDeletedAt(LocalDateTime deletedAt);
}

// Interface extending multiple interfaces
public interface BaseEntity extends Auditable, SoftDeletable {
    // Inherits all methods from Auditable and SoftDeletable
    // Can add more methods
    int getVersion();
    void setVersion(int version);
}

// Implementation
public class User implements BaseEntity {
    private Long id;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private boolean deleted;
    private LocalDateTime deletedAt;
    private int version;

    private String username;
    private String email;

    // Constructor
    public User(String username, String email) {
        this.username = username;
        this.email = email;
        this.createdAt = LocalDateTime.now();
        this.version = 1;
    }

    // Entity methods
    @Override
    public Long getId() { return id; }

    @Override
    public void setId(Long id) { this.id = id; }

    // Auditable methods
    @Override
    public LocalDateTime getCreatedAt() { return createdAt; }

    @Override
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @Override
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String getCreatedBy() { return createdBy; }

    @Override
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    // SoftDeletable methods
    @Override
    public boolean isDeleted() { return deleted; }

    @Override
    public void setDeleted(boolean deleted) { this.deleted = deleted; }

    @Override
    public LocalDateTime getDeletedAt() { return deletedAt; }

    @Override
    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    // BaseEntity methods
    @Override
    public int getVersion() { return version; }

    @Override
    public void setVersion(int version) { this.version = version; }

    // Domain-specific getters/setters
    public String getUsername() { return username; }
    public String getEmail() { return email; }
}
```

## Default Methods

Introduced in Java 8, default methods allow interfaces to provide method implementations. This enables interface evolution without breaking existing implementations.

### Basic Default Methods

```java
public interface Collection<E> {
    // Abstract methods
    int size();
    boolean isEmpty();
    boolean contains(E element);
    void add(E element);
    void remove(E element);
    void clear();

    // Default method with implementation
    default boolean addAll(Collection<? extends E> collection) {
        boolean modified = false;
        for (E element : collection) {
            add(element);
            modified = true;
        }
        return modified;
    }

    // Default method using other methods
    default boolean isNotEmpty() {
        return !isEmpty();
    }

    // Default method with complex logic
    default void forEach(Consumer<? super E> action) {
        Objects.requireNonNull(action);
        for (E element : this) {
            action.accept(element);
        }
    }
}
```

### Default Methods for Interface Evolution

```java
// Original interface (v1.0)
public interface PaymentProcessor {
    void processPayment(double amount);
    boolean refund(String transactionId);
}

// Evolved interface (v2.0) - backward compatible with default methods
public interface PaymentProcessor {
    void processPayment(double amount);
    boolean refund(String transactionId);

    // New method with default implementation - existing classes still work
    default void processPayment(double amount, String currency) {
        if (!"USD".equals(currency)) {
            amount = convertToUSD(amount, currency);
        }
        processPayment(amount);
    }

    // Helper default method
    default double convertToUSD(double amount, String currency) {
        // Simplified conversion
        switch (currency) {
            case "EUR": return amount * 1.10;
            case "GBP": return amount * 1.27;
            case "JPY": return amount * 0.0067;
            default: return amount;
        }
    }

    // New feature with sensible default
    default boolean supportsRecurringPayments() {
        return false;  // Safe default for existing implementations
    }
}
```

### Resolving Default Method Conflicts

When a class implements multiple interfaces with conflicting default methods, explicit resolution is required.

```java
public interface InterfaceA {
    default void greet() {
        System.out.println("Hello from Interface A");
    }

    default void commonMethod() {
        System.out.println("Common method from A");
    }
}

public interface InterfaceB {
    default void greet() {
        System.out.println("Hello from Interface B");
    }

    default void commonMethod() {
        System.out.println("Common method from B");
    }
}

public class ConflictResolver implements InterfaceA, InterfaceB {
    // Must override to resolve conflict
    @Override
    public void greet() {
        // Option 1: Provide own implementation
        System.out.println("Hello from ConflictResolver");
    }

    @Override
    public void commonMethod() {
        // Option 2: Delegate to specific interface
        InterfaceA.super.commonMethod();
    }

    public void demonstrateBoth() {
        // Can explicitly call either default method
        InterfaceA.super.greet();
        InterfaceB.super.greet();
    }
}

public class DefaultMethodConflictDemo {
    public static void main(String[] args) {
        ConflictResolver resolver = new ConflictResolver();

        resolver.greet();         // "Hello from ConflictResolver"
        resolver.commonMethod();  // "Common method from A"

        System.out.println("---");
        resolver.demonstrateBoth();
    }
}
```

### Default Methods vs Class Methods

```java
public interface Printable {
    default void print() {
        System.out.println("Printable.print()");
    }
}

public class Document implements Printable {
    // Class method overrides default method
    @Override
    public void print() {
        System.out.println("Document.print()");
    }
}

public class Report implements Printable {
    // Uses default implementation from interface
}

// Rule: Class methods always win over default methods
public class DefaultMethodPrecedenceDemo {
    public static void main(String[] args) {
        Printable doc = new Document();
        Printable report = new Report();

        doc.print();    // "Document.print()" - class method wins
        report.print(); // "Printable.print()" - default method used
    }
}
```

## Static Methods

Java 8 also introduced static methods in interfaces. These are utility methods that belong to the interface itself, not to implementing classes.

```java
public interface StringUtils {
    // Static method - utility function
    static boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    static boolean isNotEmpty(String str) {
        return !isEmpty(str);
    }

    static String capitalize(String str) {
        if (isEmpty(str)) {
            return str;
        }
        return Character.toUpperCase(str.charAt(0)) + str.substring(1).toLowerCase();
    }

    static String reverse(String str) {
        if (isEmpty(str)) {
            return str;
        }
        return new StringBuilder(str).reverse().toString();
    }

    static String repeat(String str, int times) {
        if (isEmpty(str) || times <= 0) {
            return "";
        }
        return str.repeat(times);
    }

    // Factory method pattern
    static Comparator<String> caseInsensitiveComparator() {
        return String.CASE_INSENSITIVE_ORDER;
    }
}

// Usage - static methods are called on the interface, not implementations
public class StaticMethodDemo {
    public static void main(String[] args) {
        System.out.println(StringUtils.isEmpty(""));        // true
        System.out.println(StringUtils.isEmpty("Hello"));   // false
        System.out.println(StringUtils.capitalize("hELLO")); // "Hello"
        System.out.println(StringUtils.reverse("Java"));    // "avaJ"
        System.out.println(StringUtils.repeat("ab", 3));    // "ababab"
    }
}
```

### Static Factory Methods in Interfaces

```java
public interface Logger {
    void log(String message);
    void error(String message);
    void debug(String message);

    // Static factory methods
    static Logger console() {
        return new ConsoleLogger();
    }

    static Logger file(String filename) {
        return new FileLogger(filename);
    }

    static Logger nullLogger() {
        return new NullLogger();
    }

    static Logger composite(Logger... loggers) {
        return new CompositeLogger(loggers);
    }
}

class ConsoleLogger implements Logger {
    @Override
    public void log(String message) {
        System.out.println("[INFO] " + message);
    }

    @Override
    public void error(String message) {
        System.err.println("[ERROR] " + message);
    }

    @Override
    public void debug(String message) {
        System.out.println("[DEBUG] " + message);
    }
}

class FileLogger implements Logger {
    private final String filename;

    FileLogger(String filename) {
        this.filename = filename;
    }

    @Override
    public void log(String message) {
        writeToFile("[INFO] " + message);
    }

    @Override
    public void error(String message) {
        writeToFile("[ERROR] " + message);
    }

    @Override
    public void debug(String message) {
        writeToFile("[DEBUG] " + message);
    }

    private void writeToFile(String message) {
        // File writing logic
        System.out.println("Writing to " + filename + ": " + message);
    }
}

class NullLogger implements Logger {
    @Override
    public void log(String message) { /* Do nothing */ }

    @Override
    public void error(String message) { /* Do nothing */ }

    @Override
    public void debug(String message) { /* Do nothing */ }
}

class CompositeLogger implements Logger {
    private final Logger[] loggers;

    CompositeLogger(Logger... loggers) {
        this.loggers = loggers;
    }

    @Override
    public void log(String message) {
        for (Logger logger : loggers) {
            logger.log(message);
        }
    }

    @Override
    public void error(String message) {
        for (Logger logger : loggers) {
            logger.error(message);
        }
    }

    @Override
    public void debug(String message) {
        for (Logger logger : loggers) {
            logger.debug(message);
        }
    }
}

// Usage
public class LoggerDemo {
    public static void main(String[] args) {
        Logger consoleLogger = Logger.console();
        Logger fileLogger = Logger.file("app.log");
        Logger composite = Logger.composite(consoleLogger, fileLogger);

        composite.log("Application started");
        composite.error("An error occurred");
    }
}
```

## Private Methods

Java 9 introduced private methods in interfaces to reduce code duplication between default methods.

```java
public interface DataValidator {
    // Abstract method
    boolean validate(String data);

    // Default methods sharing common logic
    default boolean validateEmail(String email) {
        if (!checkNotEmpty(email, "Email")) {
            return false;
        }
        return email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }

    default boolean validatePhone(String phone) {
        if (!checkNotEmpty(phone, "Phone")) {
            return false;
        }
        return phone.matches("^\\+?[1-9]\\d{1,14}$");
    }

    default boolean validateUsername(String username) {
        if (!checkNotEmpty(username, "Username")) {
            return false;
        }
        if (!checkLength(username, 3, 20, "Username")) {
            return false;
        }
        return username.matches("^[a-zA-Z0-9_]+$");
    }

    default boolean validatePassword(String password) {
        if (!checkNotEmpty(password, "Password")) {
            return false;
        }
        if (!checkLength(password, 8, 50, "Password")) {
            return false;
        }
        return checkPasswordStrength(password);
    }

    // Private method - shared validation logic
    private boolean checkNotEmpty(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            logValidationError(fieldName + " cannot be empty");
            return false;
        }
        return true;
    }

    // Private method - shared length validation
    private boolean checkLength(String value, int min, int max, String fieldName) {
        if (value.length() < min || value.length() > max) {
            logValidationError(fieldName + " must be between " + min + " and " + max + " characters");
            return false;
        }
        return true;
    }

    // Private method - password strength check
    private boolean checkPasswordStrength(String password) {
        boolean hasUppercase = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLowercase = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));

        if (!(hasUppercase && hasLowercase && hasDigit && hasSpecial)) {
            logValidationError("Password must contain uppercase, lowercase, digit, and special character");
            return false;
        }
        return true;
    }

    // Private static method - can be called from static and non-static contexts
    private static void logValidationError(String message) {
        System.out.println("Validation Error: " + message);
    }
}

// Implementation
public class UserValidator implements DataValidator {
    @Override
    public boolean validate(String data) {
        // Custom validation for the entire user data
        return data != null && !data.isEmpty();
    }
}

// Usage
public class PrivateMethodDemo {
    public static void main(String[] args) {
        DataValidator validator = new UserValidator();

        System.out.println("Email validation:");
        System.out.println(validator.validateEmail("user@example.com")); // true
        System.out.println(validator.validateEmail("invalid-email"));    // false

        System.out.println("\nPhone validation:");
        System.out.println(validator.validatePhone("+1234567890")); // true
        System.out.println(validator.validatePhone("abc"));          // false

        System.out.println("\nUsername validation:");
        System.out.println(validator.validateUsername("john_doe")); // true
        System.out.println(validator.validateUsername("ab"));       // false (too short)

        System.out.println("\nPassword validation:");
        System.out.println(validator.validatePassword("Secure@123")); // true
        System.out.println(validator.validatePassword("weak"));       // false
    }
}
```

## Functional Interfaces

A functional interface has exactly one abstract method and can be used with lambda expressions. The `@FunctionalInterface` annotation ensures compile-time checking.

### Defining Functional Interfaces

```java
@FunctionalInterface
public interface Transformer<T, R> {
    R transform(T input);

    // Can have default methods
    default <V> Transformer<T, V> andThen(Transformer<? super R, ? extends V> after) {
        Objects.requireNonNull(after);
        return (T t) -> after.transform(transform(t));
    }

    // Can have static methods
    static <T> Transformer<T, T> identity() {
        return t -> t;
    }
}

@FunctionalInterface
public interface Predicate<T> {
    boolean test(T t);

    default Predicate<T> and(Predicate<? super T> other) {
        Objects.requireNonNull(other);
        return (t) -> test(t) && other.test(t);
    }

    default Predicate<T> or(Predicate<? super T> other) {
        Objects.requireNonNull(other);
        return (t) -> test(t) || other.test(t);
    }

    default Predicate<T> negate() {
        return (t) -> !test(t);
    }

    static <T> Predicate<T> isEqual(Object targetRef) {
        return (null == targetRef)
                ? Objects::isNull
                : object -> targetRef.equals(object);
    }
}

@FunctionalInterface
public interface BiFunction<T, U, R> {
    R apply(T t, U u);

    default <V> BiFunction<T, U, V> andThen(Function<? super R, ? extends V> after) {
        Objects.requireNonNull(after);
        return (T t, U u) -> after.apply(apply(t, u));
    }
}
```

### Using Functional Interfaces with Lambda Expressions

```java
public class FunctionalInterfaceDemo {
    public static void main(String[] args) {
        // Lambda expression
        Transformer<String, Integer> stringLength = s -> s.length();
        System.out.println(stringLength.transform("Hello")); // 5

        // Method reference
        Transformer<String, String> toUpperCase = String::toUpperCase;
        System.out.println(toUpperCase.transform("hello")); // "HELLO"

        // Chaining transformers
        Transformer<String, Integer> lengthOfUppercase =
            toUpperCase.andThen(stringLength);
        System.out.println(lengthOfUppercase.transform("hello")); // 5

        // Predicates
        Predicate<Integer> isPositive = n -> n > 0;
        Predicate<Integer> isEven = n -> n % 2 == 0;
        Predicate<Integer> isPositiveAndEven = isPositive.and(isEven);

        System.out.println(isPositiveAndEven.test(4));  // true
        System.out.println(isPositiveAndEven.test(-4)); // false
        System.out.println(isPositiveAndEven.test(3));  // false

        // BiFunction
        BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
        BiFunction<Integer, Integer, String> addAndFormat =
            add.andThen(result -> "Result: " + result);
        System.out.println(addAndFormat.apply(5, 3)); // "Result: 8"
    }
}
```

### Built-in Functional Interfaces

Java provides many built-in functional interfaces in `java.util.function`:

```java
import java.util.function.*;

public class BuiltInFunctionalInterfaces {
    public static void main(String[] args) {
        // Function<T, R> - takes T, returns R
        Function<String, Integer> length = String::length;
        System.out.println(length.apply("Hello")); // 5

        // Consumer<T> - takes T, returns nothing
        Consumer<String> printer = System.out::println;
        printer.accept("Hello World");

        // Supplier<T> - takes nothing, returns T
        Supplier<Double> randomSupplier = Math::random;
        System.out.println(randomSupplier.get());

        // Predicate<T> - takes T, returns boolean
        Predicate<String> isEmpty = String::isEmpty;
        System.out.println(isEmpty.test("")); // true

        // UnaryOperator<T> - Function<T, T>
        UnaryOperator<Integer> square = x -> x * x;
        System.out.println(square.apply(5)); // 25

        // BinaryOperator<T> - BiFunction<T, T, T>
        BinaryOperator<Integer> multiply = (a, b) -> a * b;
        System.out.println(multiply.apply(3, 4)); // 12

        // BiConsumer<T, U> - takes T and U, returns nothing
        BiConsumer<String, Integer> printPair =
            (s, i) -> System.out.println(s + ": " + i);
        printPair.accept("Age", 25);

        // BiPredicate<T, U> - takes T and U, returns boolean
        BiPredicate<String, Integer> hasLength =
            (s, len) -> s.length() == len;
        System.out.println(hasLength.test("Hello", 5)); // true
    }
}
```

### Functional Interfaces for Primitive Types

```java
public class PrimitiveFunctionalInterfaces {
    public static void main(String[] args) {
        // IntFunction<R> - takes int, returns R
        IntFunction<String> intToString = Integer::toString;
        System.out.println(intToString.apply(42)); // "42"

        // ToIntFunction<T> - takes T, returns int
        ToIntFunction<String> parseIntFunc = Integer::parseInt;
        System.out.println(parseIntFunc.applyAsInt("100")); // 100

        // IntPredicate - takes int, returns boolean
        IntPredicate isPositive = x -> x > 0;
        System.out.println(isPositive.test(5)); // true

        // IntConsumer - takes int, returns nothing
        IntConsumer printInt = System.out::println;
        printInt.accept(42);

        // IntSupplier - takes nothing, returns int
        IntSupplier randomInt = () -> (int)(Math.random() * 100);
        System.out.println(randomInt.getAsInt());

        // IntUnaryOperator - takes int, returns int
        IntUnaryOperator doubleIt = x -> x * 2;
        System.out.println(doubleIt.applyAsInt(5)); // 10

        // IntBinaryOperator - takes two ints, returns int
        IntBinaryOperator max = Math::max;
        System.out.println(max.applyAsInt(5, 10)); // 10

        // Similar interfaces exist for long and double
        LongUnaryOperator longSquare = x -> x * x;
        DoubleUnaryOperator sqrt = Math::sqrt;
    }
}
```

## Marker Interfaces

Marker interfaces are empty interfaces used to mark or tag a class with certain capabilities.

```java
// Built-in marker interfaces
public interface Serializable { }
public interface Cloneable { }
public interface RandomAccess { }

// Custom marker interfaces
public interface Auditable {
    // Marks classes that should be audited
}

public interface Cacheable {
    // Marks classes that can be cached
}

public interface Exportable {
    // Marks classes that can be exported
}

// Usage
public class User implements Serializable, Auditable, Cacheable {
    private String username;
    private String email;

    // Constructor and methods...
}

// Processing marker interfaces
public class MarkerInterfaceProcessor {
    public void process(Object obj) {
        if (obj instanceof Auditable) {
            System.out.println("Creating audit log for: " + obj.getClass().getName());
        }

        if (obj instanceof Cacheable) {
            System.out.println("Adding to cache: " + obj.getClass().getName());
        }

        if (obj instanceof Exportable) {
            System.out.println("Exporting: " + obj.getClass().getName());
        }
    }
}

// Modern alternative: Annotations
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Auditable { }

@Auditable
public class Order {
    // Order implementation
}
```

## Interface vs Abstract Class

Understanding when to use interfaces versus abstract classes is crucial for good design.

### Comparison Table

| Feature | Interface | Abstract Class |
|---------|-----------|----------------|
| Multiple inheritance | Yes (implement multiple) | No (extend one only) |
| Constructor | No | Yes |
| Instance fields | No (only constants) | Yes |
| Access modifiers for methods | Public only (before Java 9) | Any |
| Method implementation | Default, static, private (Java 8/9+) | Any |
| State | Stateless | Can have state |
| Primary purpose | Define capabilities | Share code among related classes |

### When to Use Interface

```java
// Use interface when defining capabilities/behavior
public interface Printable {
    void print();
}

public interface Scannable {
    byte[] scan();
}

public interface Faxable {
    void fax(String destination);
}

// A class can have multiple capabilities
public class MultiFunctionPrinter implements Printable, Scannable, Faxable {
    @Override
    public void print() {
        System.out.println("Printing document");
    }

    @Override
    public byte[] scan() {
        System.out.println("Scanning document");
        return new byte[0];
    }

    @Override
    public void fax(String destination) {
        System.out.println("Faxing to " + destination);
    }
}
```

### When to Use Abstract Class

```java
// Use abstract class when sharing code among related classes
public abstract class Employee {
    protected String name;
    protected String id;
    protected double baseSalary;

    public Employee(String name, String id, double baseSalary) {
        this.name = name;
        this.id = id;
        this.baseSalary = baseSalary;
    }

    // Shared implementation
    public String getName() {
        return name;
    }

    public String getId() {
        return id;
    }

    // Template method with common behavior
    public final void processPayroll() {
        double salary = calculateSalary();
        double tax = calculateTax(salary);
        double netPay = salary - tax;
        generatePayslip(netPay);
    }

    // Abstract method - each subclass implements differently
    public abstract double calculateSalary();

    // Default implementation that can be overridden
    protected double calculateTax(double salary) {
        return salary * 0.2; // 20% default tax rate
    }

    private void generatePayslip(double netPay) {
        System.out.println("Payslip for " + name + ": $" + netPay);
    }
}

public class FullTimeEmployee extends Employee {
    public FullTimeEmployee(String name, String id, double baseSalary) {
        super(name, id, baseSalary);
    }

    @Override
    public double calculateSalary() {
        return baseSalary;
    }
}

public class ContractEmployee extends Employee {
    private int hoursWorked;
    private double hourlyRate;

    public ContractEmployee(String name, String id, double hourlyRate) {
        super(name, id, 0);
        this.hourlyRate = hourlyRate;
    }

    public void setHoursWorked(int hours) {
        this.hoursWorked = hours;
    }

    @Override
    public double calculateSalary() {
        return hoursWorked * hourlyRate;
    }

    @Override
    protected double calculateTax(double salary) {
        return salary * 0.15; // Contract employees: 15% tax
    }
}
```

### Combining Both

```java
// Interface for capability
public interface Exportable {
    byte[] export(String format);
}

// Abstract class for shared implementation
public abstract class Report implements Exportable {
    protected String title;
    protected LocalDate generatedDate;

    public Report(String title) {
        this.title = title;
        this.generatedDate = LocalDate.now();
    }

    public abstract String generateContent();

    @Override
    public byte[] export(String format) {
        String content = generateContent();
        switch (format.toLowerCase()) {
            case "pdf":
                return exportToPdf(content);
            case "csv":
                return exportToCsv(content);
            default:
                return content.getBytes();
        }
    }

    protected byte[] exportToPdf(String content) {
        // PDF export logic
        return ("PDF: " + content).getBytes();
    }

    protected byte[] exportToCsv(String content) {
        // CSV export logic
        return ("CSV: " + content).getBytes();
    }
}

public class SalesReport extends Report {
    private List<Sale> sales;

    public SalesReport(String title, List<Sale> sales) {
        super(title);
        this.sales = sales;
    }

    @Override
    public String generateContent() {
        StringBuilder sb = new StringBuilder();
        sb.append("Sales Report: ").append(title).append("\n");
        sb.append("Date: ").append(generatedDate).append("\n");
        for (Sale sale : sales) {
            sb.append(sale.toString()).append("\n");
        }
        return sb.toString();
    }
}
```

## Design Patterns with Interfaces

### Strategy Pattern

```java
// Strategy interface
public interface PaymentStrategy {
    void pay(double amount);
    String getPaymentType();
}

// Concrete strategies
public class CreditCardPayment implements PaymentStrategy {
    private String cardNumber;
    private String cvv;

    public CreditCardPayment(String cardNumber, String cvv) {
        this.cardNumber = cardNumber;
        this.cvv = cvv;
    }

    @Override
    public void pay(double amount) {
        System.out.println("Paid $" + amount + " using Credit Card ending in " +
            cardNumber.substring(cardNumber.length() - 4));
    }

    @Override
    public String getPaymentType() {
        return "Credit Card";
    }
}

public class PayPalPayment implements PaymentStrategy {
    private String email;

    public PayPalPayment(String email) {
        this.email = email;
    }

    @Override
    public void pay(double amount) {
        System.out.println("Paid $" + amount + " using PayPal account: " + email);
    }

    @Override
    public String getPaymentType() {
        return "PayPal";
    }
}

public class CryptoPayment implements PaymentStrategy {
    private String walletAddress;

    public CryptoPayment(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    @Override
    public void pay(double amount) {
        System.out.println("Paid $" + amount + " worth of crypto from wallet: " +
            walletAddress.substring(0, 8) + "...");
    }

    @Override
    public String getPaymentType() {
        return "Cryptocurrency";
    }
}

// Context
public class ShoppingCart {
    private List<Item> items = new ArrayList<>();
    private PaymentStrategy paymentStrategy;

    public void addItem(Item item) {
        items.add(item);
    }

    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.paymentStrategy = strategy;
    }

    public double calculateTotal() {
        return items.stream()
            .mapToDouble(Item::getPrice)
            .sum();
    }

    public void checkout() {
        double total = calculateTotal();
        System.out.println("Total: $" + total);
        System.out.println("Payment method: " + paymentStrategy.getPaymentType());
        paymentStrategy.pay(total);
    }
}

// Usage
public class StrategyPatternDemo {
    public static void main(String[] args) {
        ShoppingCart cart = new ShoppingCart();
        cart.addItem(new Item("Laptop", 999.99));
        cart.addItem(new Item("Mouse", 29.99));

        // Pay with credit card
        cart.setPaymentStrategy(new CreditCardPayment("1234567890123456", "123"));
        cart.checkout();

        System.out.println("---");

        // Pay with PayPal
        cart.setPaymentStrategy(new PayPalPayment("user@example.com"));
        cart.checkout();
    }
}
```

### Observer Pattern

```java
// Observer interface
public interface Observer {
    void update(String event, Object data);
}

// Subject interface
public interface Subject {
    void registerObserver(Observer observer);
    void removeObserver(Observer observer);
    void notifyObservers(String event, Object data);
}

// Concrete subject
public class StockMarket implements Subject {
    private Map<String, Double> stockPrices = new HashMap<>();
    private List<Observer> observers = new ArrayList<>();

    @Override
    public void registerObserver(Observer observer) {
        observers.add(observer);
    }

    @Override
    public void removeObserver(Observer observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyObservers(String event, Object data) {
        for (Observer observer : observers) {
            observer.update(event, data);
        }
    }

    public void updateStockPrice(String symbol, double price) {
        double oldPrice = stockPrices.getOrDefault(symbol, 0.0);
        stockPrices.put(symbol, price);

        Map<String, Object> data = Map.of(
            "symbol", symbol,
            "oldPrice", oldPrice,
            "newPrice", price,
            "change", price - oldPrice
        );

        notifyObservers("PRICE_UPDATE", data);
    }
}

// Concrete observers
public class StockTrader implements Observer {
    private String name;

    public StockTrader(String name) {
        this.name = name;
    }

    @Override
    public void update(String event, Object data) {
        if ("PRICE_UPDATE".equals(event)) {
            @SuppressWarnings("unchecked")
            Map<String, Object> stockData = (Map<String, Object>) data;
            System.out.println(name + " received: " + stockData.get("symbol") +
                " price changed from $" + stockData.get("oldPrice") +
                " to $" + stockData.get("newPrice"));
        }
    }
}

public class StockAlertSystem implements Observer {
    private double threshold;

    public StockAlertSystem(double threshold) {
        this.threshold = threshold;
    }

    @Override
    public void update(String event, Object data) {
        if ("PRICE_UPDATE".equals(event)) {
            @SuppressWarnings("unchecked")
            Map<String, Object> stockData = (Map<String, Object>) data;
            double change = Math.abs((Double) stockData.get("change"));
            if (change > threshold) {
                System.out.println("ALERT: " + stockData.get("symbol") +
                    " moved by $" + change + " (exceeds threshold of $" + threshold + ")");
            }
        }
    }
}

// Usage
public class ObserverPatternDemo {
    public static void main(String[] args) {
        StockMarket market = new StockMarket();

        Observer trader1 = new StockTrader("Alice");
        Observer trader2 = new StockTrader("Bob");
        Observer alertSystem = new StockAlertSystem(5.0);

        market.registerObserver(trader1);
        market.registerObserver(trader2);
        market.registerObserver(alertSystem);

        market.updateStockPrice("AAPL", 150.0);
        System.out.println("---");
        market.updateStockPrice("AAPL", 158.0);
        System.out.println("---");
        market.updateStockPrice("GOOGL", 2800.0);
    }
}
```

### Factory Pattern

```java
// Product interface
public interface Document {
    void open();
    void save();
    void close();
    String getType();
}

// Concrete products
public class PDFDocument implements Document {
    private String filename;

    public PDFDocument(String filename) {
        this.filename = filename;
    }

    @Override
    public void open() {
        System.out.println("Opening PDF document: " + filename);
    }

    @Override
    public void save() {
        System.out.println("Saving PDF document: " + filename);
    }

    @Override
    public void close() {
        System.out.println("Closing PDF document: " + filename);
    }

    @Override
    public String getType() {
        return "PDF";
    }
}

public class WordDocument implements Document {
    private String filename;

    public WordDocument(String filename) {
        this.filename = filename;
    }

    @Override
    public void open() {
        System.out.println("Opening Word document: " + filename);
    }

    @Override
    public void save() {
        System.out.println("Saving Word document: " + filename);
    }

    @Override
    public void close() {
        System.out.println("Closing Word document: " + filename);
    }

    @Override
    public String getType() {
        return "Word";
    }
}

public class SpreadsheetDocument implements Document {
    private String filename;

    public SpreadsheetDocument(String filename) {
        this.filename = filename;
    }

    @Override
    public void open() {
        System.out.println("Opening Spreadsheet: " + filename);
    }

    @Override
    public void save() {
        System.out.println("Saving Spreadsheet: " + filename);
    }

    @Override
    public void close() {
        System.out.println("Closing Spreadsheet: " + filename);
    }

    @Override
    public String getType() {
        return "Spreadsheet";
    }
}

// Factory interface
public interface DocumentFactory {
    Document createDocument(String filename);

    // Static factory method using interface
    static DocumentFactory getFactory(String type) {
        switch (type.toLowerCase()) {
            case "pdf":
                return PDFDocument::new;
            case "word":
                return WordDocument::new;
            case "spreadsheet":
                return SpreadsheetDocument::new;
            default:
                throw new IllegalArgumentException("Unknown document type: " + type);
        }
    }
}

// Usage
public class FactoryPatternDemo {
    public static void main(String[] args) {
        DocumentFactory pdfFactory = DocumentFactory.getFactory("pdf");
        DocumentFactory wordFactory = DocumentFactory.getFactory("word");

        Document pdf = pdfFactory.createDocument("report.pdf");
        Document word = wordFactory.createDocument("letter.docx");

        pdf.open();
        pdf.save();
        pdf.close();

        System.out.println("---");

        word.open();
        word.save();
        word.close();
    }
}
```

### Dependency Injection with Interfaces

```java
// Service interfaces
public interface UserRepository {
    User findById(Long id);
    User findByEmail(String email);
    void save(User user);
    void delete(Long id);
    List<User> findAll();
}

public interface EmailService {
    void sendEmail(String to, String subject, String body);
}

public interface PasswordEncoder {
    String encode(String password);
    boolean matches(String rawPassword, String encodedPassword);
}

// Implementations
public class JpaUserRepository implements UserRepository {
    @Override
    public User findById(Long id) {
        System.out.println("Finding user by ID using JPA: " + id);
        return new User(id, "user@example.com");
    }

    @Override
    public User findByEmail(String email) {
        System.out.println("Finding user by email using JPA: " + email);
        return new User(1L, email);
    }

    @Override
    public void save(User user) {
        System.out.println("Saving user using JPA: " + user.getEmail());
    }

    @Override
    public void delete(Long id) {
        System.out.println("Deleting user using JPA: " + id);
    }

    @Override
    public List<User> findAll() {
        System.out.println("Finding all users using JPA");
        return List.of(new User(1L, "user1@example.com"), new User(2L, "user2@example.com"));
    }
}

public class SmtpEmailService implements EmailService {
    @Override
    public void sendEmail(String to, String subject, String body) {
        System.out.println("Sending email via SMTP to: " + to);
        System.out.println("Subject: " + subject);
    }
}

public class BCryptPasswordEncoder implements PasswordEncoder {
    @Override
    public String encode(String password) {
        // Simplified - real implementation would use BCrypt
        return "encoded_" + password;
    }

    @Override
    public boolean matches(String rawPassword, String encodedPassword) {
        return encodedPassword.equals("encoded_" + rawPassword);
    }
}

// Service using dependency injection
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // Constructor injection - dependencies are interfaces
    public UserService(UserRepository userRepository,
                      EmailService emailService,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    public void registerUser(String email, String password) {
        String encodedPassword = passwordEncoder.encode(password);
        User user = new User(null, email, encodedPassword);
        userRepository.save(user);
        emailService.sendEmail(email, "Welcome!", "Thanks for registering.");
    }

    public boolean login(String email, String password) {
        User user = userRepository.findByEmail(email);
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            System.out.println("Login successful for: " + email);
            return true;
        }
        System.out.println("Login failed for: " + email);
        return false;
    }
}

// Usage with real implementations
public class DependencyInjectionDemo {
    public static void main(String[] args) {
        // Create implementations
        UserRepository userRepo = new JpaUserRepository();
        EmailService emailService = new SmtpEmailService();
        PasswordEncoder encoder = new BCryptPasswordEncoder();

        // Inject dependencies
        UserService userService = new UserService(userRepo, emailService, encoder);

        // Use the service
        userService.registerUser("newuser@example.com", "password123");
    }
}

// For testing - can inject mock implementations
public class MockUserRepository implements UserRepository {
    private Map<Long, User> users = new HashMap<>();
    private Long nextId = 1L;

    @Override
    public User findById(Long id) {
        return users.get(id);
    }

    @Override
    public User findByEmail(String email) {
        return users.values().stream()
            .filter(u -> u.getEmail().equals(email))
            .findFirst()
            .orElse(null);
    }

    @Override
    public void save(User user) {
        if (user.getId() == null) {
            user.setId(nextId++);
        }
        users.put(user.getId(), user);
    }

    @Override
    public void delete(Long id) {
        users.remove(id);
    }

    @Override
    public List<User> findAll() {
        return new ArrayList<>(users.values());
    }
}
```

## Best Practices

### Program to Interfaces, Not Implementations

```java
// Bad - programming to implementation
ArrayList<String> list = new ArrayList<>();

// Good - programming to interface
List<String> list = new ArrayList<>();

// Even better for maximum flexibility
Collection<String> collection = new ArrayList<>();
```

### Follow Interface Segregation Principle

```java
// Bad - fat interface
public interface Worker {
    void work();
    void eat();
    void sleep();
    void attendMeeting();
    void writeReport();
}

// Good - segregated interfaces
public interface Workable {
    void work();
}

public interface Feedable {
    void eat();
}

public interface Restable {
    void sleep();
}

public interface Meetable {
    void attendMeeting();
}

// Classes implement only what they need
public class Robot implements Workable {
    @Override
    public void work() {
        System.out.println("Robot working");
    }
    // Robot doesn't need to eat, sleep, or attend meetings
}

public class Human implements Workable, Feedable, Restable, Meetable {
    @Override
    public void work() { System.out.println("Human working"); }

    @Override
    public void eat() { System.out.println("Human eating"); }

    @Override
    public void sleep() { System.out.println("Human sleeping"); }

    @Override
    public void attendMeeting() { System.out.println("Human in meeting"); }
}
```

### Use Default Methods Judiciously

```java
// Good use of default methods - providing optional convenience methods
public interface Collection<E> {
    void add(E element);
    int size();

    // Convenience method with sensible default
    default boolean isEmpty() {
        return size() == 0;
    }

    // Method with complex default that most implementations will use
    default void addAll(Collection<? extends E> other) {
        for (E element : other) {
            add(element);
        }
    }
}

// Bad - default method that changes expected behavior
public interface Repository<T> {
    T findById(Long id);

    // Bad - default could mask implementation bugs
    default T findByIdOrNull(Long id) {
        try {
            return findById(id);
        } catch (Exception e) {
            return null;  // Silently swallowing exceptions
        }
    }
}
```

### Document Interface Contracts Clearly

```java
/**
 * Represents a payment processor that handles financial transactions.
 *
 * <p>Implementations must be thread-safe and handle concurrent transactions.
 * All monetary amounts are in the smallest currency unit (e.g., cents for USD).
 *
 * @since 1.0
 */
public interface PaymentProcessor {

    /**
     * Processes a payment transaction.
     *
     * @param amount the payment amount in smallest currency unit (must be positive)
     * @param currency the ISO 4217 currency code (e.g., "USD", "EUR")
     * @param customerId the unique identifier of the customer
     * @return a transaction result containing the transaction ID and status
     * @throws IllegalArgumentException if amount is not positive or currency is invalid
     * @throws PaymentException if the payment processing fails
     */
    TransactionResult processPayment(long amount, String currency, String customerId);

    /**
     * Refunds a previously processed transaction.
     *
     * @param transactionId the ID of the original transaction to refund
     * @param amount the refund amount (must not exceed original amount)
     * @return true if refund was successful, false otherwise
     * @throws TransactionNotFoundException if the transaction ID is not found
     */
    boolean refund(String transactionId, long amount);
}
```

### Use Interfaces for Callbacks and Event Handling

```java
// Callback interface
public interface AsyncCallback<T> {
    void onSuccess(T result);
    void onError(Exception error);

    default void onComplete() {
        // Optional completion handler
    }
}

// Event listener interface
public interface LifecycleListener {
    default void onStart() { }
    default void onStop() { }
    default void onPause() { }
    default void onResume() { }
}

// Usage
public class DataFetcher {
    public void fetchData(String url, AsyncCallback<String> callback) {
        try {
            // Simulate async operation
            String result = performFetch(url);
            callback.onSuccess(result);
        } catch (Exception e) {
            callback.onError(e);
        } finally {
            callback.onComplete();
        }
    }

    private String performFetch(String url) {
        return "Data from " + url;
    }
}

// Lambda usage with functional callback
public class CallbackDemo {
    public static void main(String[] args) {
        DataFetcher fetcher = new DataFetcher();

        fetcher.fetchData("https://api.example.com/data", new AsyncCallback<String>() {
            @Override
            public void onSuccess(String result) {
                System.out.println("Received: " + result);
            }

            @Override
            public void onError(Exception error) {
                System.err.println("Error: " + error.getMessage());
            }
        });
    }
}
```

### Consider Sealed Interfaces (Java 17+)

```java
// Sealed interface restricts which classes can implement it
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double calculateArea();
}

public final class Circle implements Shape {
    private final double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double calculateArea() {
        return Math.PI * radius * radius;
    }
}

public final class Rectangle implements Shape {
    private final double width;
    private final double height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double calculateArea() {
        return width * height;
    }
}

public final class Triangle implements Shape {
    private final double base;
    private final double height;

    public Triangle(double base, double height) {
        this.base = base;
        this.height = height;
    }

    @Override
    public double calculateArea() {
        return 0.5 * base * height;
    }
}

// Exhaustive pattern matching (Java 21+)
public class SealedInterfaceDemo {
    public static String describeShape(Shape shape) {
        return switch (shape) {
            case Circle c -> "Circle with radius " + c.getRadius();
            case Rectangle r -> "Rectangle " + r.getWidth() + "x" + r.getHeight();
            case Triangle t -> "Triangle with base " + t.getBase();
        };
    }
}
```

## Summary

Java interfaces are a fundamental tool for building flexible, maintainable, and testable applications:

1. **Basic Interfaces**: Define contracts that implementing classes must follow
2. **Multiple Implementation**: Enable a form of multiple inheritance for behavior
3. **Interface Inheritance**: Build hierarchies of related behaviors
4. **Default Methods**: Provide optional implementations and enable interface evolution
5. **Static Methods**: Add utility methods directly to interfaces
6. **Private Methods**: Reduce code duplication in default methods
7. **Functional Interfaces**: Enable lambda expressions and functional programming
8. **Marker Interfaces**: Tag classes with metadata about their capabilities
9. **Design Patterns**: Power common patterns like Strategy, Observer, and Factory

**Key Takeaways:**

- Program to interfaces, not implementations
- Use interfaces to define what a class can do (capabilities)
- Follow the Interface Segregation Principle - keep interfaces focused
- Use default methods for interface evolution and convenience methods
- Leverage functional interfaces with lambda expressions for cleaner code
- Combine interfaces with abstract classes when you need both contract and shared implementation
- Document interface contracts clearly including preconditions and postconditions

Mastering interfaces is essential for writing clean, modular Java code that is easy to test, extend, and maintain.
