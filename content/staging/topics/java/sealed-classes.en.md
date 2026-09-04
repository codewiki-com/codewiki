---
title: Sealed Classes
description: Complete guide to Java Sealed Classes, restricting inheritance and pattern matching
track: java
section: basics
difficulty: intermediate
tags:
  - Java
  - Sealed Classes
  - Inheritance
  - Pattern Matching
status: imported
origin: old/src/content/docs/java/sealed-classes.en.md
divergence: 0.315
issues: []
legacy:
  category: Java
  subcategory: Language Features
  order: 18
  lastUpdated: 2026-01-07
---

Sealed classes, introduced as a preview feature in Java 15 and finalized in Java 17, provide a powerful mechanism for controlling class inheritance. They allow developers to explicitly declare which classes or interfaces are permitted to extend or implement a sealed type, enabling more precise domain modeling and enhanced pattern matching capabilities.

## Introduction to Sealed Classes

In traditional Java inheritance, a class can be either:
- **Open for extension** (default behavior)
- **Completely closed** (using the `final` keyword)

Sealed classes introduce a middle ground: controlled extension. You can specify exactly which classes are allowed to inherit from your sealed class, providing fine-grained control over your type hierarchy.

### Why Use Sealed Classes?

Sealed classes solve several important problems:

1. **Domain Modeling**: Express that a type has a fixed set of subtypes known at compile time
2. **Security**: Prevent unauthorized extensions of sensitive classes
3. **Pattern Matching**: Enable exhaustive pattern matching without a default case
4. **API Design**: Provide clear contracts about which implementations exist

## The `sealed` Keyword

To declare a sealed class, use the `sealed` modifier along with the `permits` clause to specify allowed subclasses.

### Basic Syntax

```java
public sealed class Shape permits Circle, Rectangle, Triangle {
    // Common shape properties and methods
    private final String color;

    public Shape(String color) {
        this.color = color;
    }

    public String getColor() {
        return color;
    }

    public abstract double area();
}
```

In this example, `Shape` is a sealed class that only permits three subclasses: `Circle`, `Rectangle`, and `Triangle`. Any attempt to create another subclass will result in a compilation error.

### Rules for Sealed Classes

1. The sealed class and its permitted subclasses must belong to the same module (or the same package if in the unnamed module)
2. Every permitted subclass must directly extend the sealed class
3. Every permitted subclass must use one of three modifiers:
   - `final` - prevents further extension
   - `sealed` - allows controlled further extension
   - `non-sealed` - reopens the class for unrestricted extension

## The `permits` Clause

The `permits` clause explicitly lists all classes that are allowed to extend the sealed class.

### Explicit Permits

```java
public sealed class Vehicle permits Car, Motorcycle, Truck {
    protected String brand;
    protected int year;

    public Vehicle(String brand, int year) {
        this.brand = brand;
        this.year = year;
    }
}
```

### Implicit Permits

When all permitted subclasses are declared in the same source file as the sealed class, the `permits` clause can be omitted:

```java
// All in the same file: Shapes.java
public sealed class Shape {
    // permits clause is implicit
}

final class Circle extends Shape {
    private final double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    public double area() {
        return Math.PI * radius * radius;
    }
}

final class Rectangle extends Shape {
    private final double width;
    private final double height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    public double area() {
        return width * height;
    }
}
```

## Subclass Modifiers

Each permitted subclass must declare its extensibility using one of three modifiers.

### Final Subclasses

A `final` subclass cannot be extended further:

```java
public sealed class Payment permits CreditCard, DebitCard, Cash {
    protected double amount;

    public Payment(double amount) {
        this.amount = amount;
    }
}

public final class CreditCard extends Payment {
    private final String cardNumber;
    private final String cvv;

    public CreditCard(double amount, String cardNumber, String cvv) {
        super(amount);
        this.cardNumber = cardNumber;
        this.cvv = cvv;
    }

    public void process() {
        System.out.println("Processing credit card payment of $" + amount);
    }
}

public final class Cash extends Payment {
    public Cash(double amount) {
        super(amount);
    }

    public void process() {
        System.out.println("Processing cash payment of $" + amount);
    }
}
```

### Sealed Subclasses

A `sealed` subclass can be extended, but only by its own set of permitted classes:

```java
public sealed class Account permits SavingsAccount, CheckingAccount {
    protected String accountNumber;
    protected double balance;

    public Account(String accountNumber, double balance) {
        this.accountNumber = accountNumber;
        this.balance = balance;
    }
}

public sealed class SavingsAccount extends Account
        permits RegularSavings, HighYieldSavings {

    protected double interestRate;

    public SavingsAccount(String accountNumber, double balance, double interestRate) {
        super(accountNumber, balance);
        this.interestRate = interestRate;
    }
}

public final class RegularSavings extends SavingsAccount {
    public RegularSavings(String accountNumber, double balance) {
        super(accountNumber, balance, 0.01); // 1% interest
    }
}

public final class HighYieldSavings extends SavingsAccount {
    public HighYieldSavings(String accountNumber, double balance) {
        super(accountNumber, balance, 0.05); // 5% interest
    }
}

public final class CheckingAccount extends Account {
    private double overdraftLimit;

    public CheckingAccount(String accountNumber, double balance, double overdraftLimit) {
        super(accountNumber, balance);
        this.overdraftLimit = overdraftLimit;
    }
}
```

### Non-Sealed Subclasses

A `non-sealed` subclass reopens the hierarchy for unrestricted extension:

```java
public sealed class Animal permits Dog, Cat, Bird {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }
}

public final class Dog extends Animal {
    public Dog(String name) {
        super(name);
    }

    public void bark() {
        System.out.println(name + " says: Woof!");
    }
}

public final class Cat extends Animal {
    public Cat(String name) {
        super(name);
    }

    public void meow() {
        System.out.println(name + " says: Meow!");
    }
}

// Bird is non-sealed, allowing any class to extend it
public non-sealed class Bird extends Animal {
    public Bird(String name) {
        super(name);
    }

    public void fly() {
        System.out.println(name + " is flying!");
    }
}

// Anyone can extend Bird
public class Parrot extends Bird {
    public Parrot(String name) {
        super(name);
    }

    public void talk() {
        System.out.println(name + " says: Hello!");
    }
}

public class Eagle extends Bird {
    public Eagle(String name) {
        super(name);
    }

    public void soar() {
        System.out.println(name + " is soaring high!");
    }
}
```

## Sealed Interfaces

Interfaces can also be sealed, following the same rules as sealed classes:

```java
public sealed interface Expression
        permits Constant, Variable, BinaryOperation, UnaryOperation {

    double evaluate();
}

public final class Constant implements Expression {
    private final double value;

    public Constant(double value) {
        this.value = value;
    }

    @Override
    public double evaluate() {
        return value;
    }
}

public final class Variable implements Expression {
    private final String name;
    private final double value;

    public Variable(String name, double value) {
        this.name = name;
        this.value = value;
    }

    @Override
    public double evaluate() {
        return value;
    }

    public String getName() {
        return name;
    }
}

public sealed interface BinaryOperation extends Expression
        permits Addition, Subtraction, Multiplication, Division {

    Expression left();
    Expression right();
}

public record Addition(Expression left, Expression right) implements BinaryOperation {
    @Override
    public double evaluate() {
        return left.evaluate() + right.evaluate();
    }
}

public record Subtraction(Expression left, Expression right) implements BinaryOperation {
    @Override
    public double evaluate() {
        return left.evaluate() - right.evaluate();
    }
}

public record Multiplication(Expression left, Expression right) implements BinaryOperation {
    @Override
    public double evaluate() {
        return left.evaluate() * right.evaluate();
    }
}

public record Division(Expression left, Expression right) implements BinaryOperation {
    @Override
    public double evaluate() {
        if (right.evaluate() == 0) {
            throw new ArithmeticException("Division by zero");
        }
        return left.evaluate() / right.evaluate();
    }
}

public sealed interface UnaryOperation extends Expression
        permits Negation, Absolute {

    Expression operand();
}

public record Negation(Expression operand) implements UnaryOperation {
    @Override
    public double evaluate() {
        return -operand.evaluate();
    }
}

public record Absolute(Expression operand) implements UnaryOperation {
    @Override
    public double evaluate() {
        return Math.abs(operand.evaluate());
    }
}
```

## Pattern Matching with Sealed Types

One of the most powerful benefits of sealed classes is exhaustive pattern matching. Since the compiler knows all possible subtypes, it can verify that switch expressions handle all cases.

### Exhaustive Switch Expressions

```java
public sealed interface Result<T> permits Success, Failure {
    // Marker interface for result types
}

public record Success<T>(T value) implements Result<T> {}

public record Failure<T>(String errorMessage, Exception cause) implements Result<T> {
    public Failure(String errorMessage) {
        this(errorMessage, null);
    }
}

public class ResultHandler {

    public static <T> String handleResult(Result<T> result) {
        // No default case needed - compiler knows all subtypes
        return switch (result) {
            case Success<T> s -> "Success: " + s.value();
            case Failure<T> f -> "Error: " + f.errorMessage();
        };
    }

    public static void main(String[] args) {
        Result<Integer> success = new Success<>(42);
        Result<Integer> failure = new Failure<>("Something went wrong");

        System.out.println(handleResult(success)); // Success: 42
        System.out.println(handleResult(failure)); // Error: Something went wrong
    }
}
```

### Pattern Matching with Guards

You can combine sealed types with pattern guards for more sophisticated matching:

```java
public sealed interface HttpResponse permits
        OkResponse, RedirectResponse, ClientError, ServerError {

    int statusCode();
}

public record OkResponse(int statusCode, String body) implements HttpResponse {}

public record RedirectResponse(int statusCode, String location) implements HttpResponse {}

public record ClientError(int statusCode, String message) implements HttpResponse {}

public record ServerError(int statusCode, String message, Exception cause)
        implements HttpResponse {}

public class HttpResponseHandler {

    public static String describeResponse(HttpResponse response) {
        return switch (response) {
            case OkResponse r when r.statusCode() == 200 ->
                "OK: " + r.body();
            case OkResponse r when r.statusCode() == 201 ->
                "Created: " + r.body();
            case OkResponse r ->
                "Success (" + r.statusCode() + "): " + r.body();

            case RedirectResponse r when r.statusCode() == 301 ->
                "Permanently moved to: " + r.location();
            case RedirectResponse r when r.statusCode() == 302 ->
                "Temporarily moved to: " + r.location();
            case RedirectResponse r ->
                "Redirect (" + r.statusCode() + ") to: " + r.location();

            case ClientError e when e.statusCode() == 404 ->
                "Not Found: " + e.message();
            case ClientError e when e.statusCode() == 401 ->
                "Unauthorized: " + e.message();
            case ClientError e when e.statusCode() == 403 ->
                "Forbidden: " + e.message();
            case ClientError e ->
                "Client Error (" + e.statusCode() + "): " + e.message();

            case ServerError e when e.statusCode() == 500 ->
                "Internal Server Error: " + e.message();
            case ServerError e when e.statusCode() == 503 ->
                "Service Unavailable: " + e.message();
            case ServerError e ->
                "Server Error (" + e.statusCode() + "): " + e.message();
        };
    }
}
```

### Nested Pattern Matching

Sealed classes work seamlessly with nested patterns:

```java
public sealed interface JsonValue permits
        JsonNull, JsonBoolean, JsonNumber, JsonString, JsonArray, JsonObject {
}

public record JsonNull() implements JsonValue {}

public record JsonBoolean(boolean value) implements JsonValue {}

public record JsonNumber(double value) implements JsonValue {}

public record JsonString(String value) implements JsonValue {}

public record JsonArray(java.util.List<JsonValue> elements) implements JsonValue {}

public record JsonObject(java.util.Map<String, JsonValue> properties) implements JsonValue {}

public class JsonPrinter {

    public static String stringify(JsonValue value) {
        return switch (value) {
            case JsonNull() -> "null";
            case JsonBoolean(boolean b) -> String.valueOf(b);
            case JsonNumber(double n) -> String.valueOf(n);
            case JsonString(String s) -> "\"" + escapeString(s) + "\"";
            case JsonArray(var elements) -> "[" +
                elements.stream()
                    .map(JsonPrinter::stringify)
                    .collect(java.util.stream.Collectors.joining(", ")) + "]";
            case JsonObject(var props) -> "{" +
                props.entrySet().stream()
                    .map(e -> "\"" + e.getKey() + "\": " + stringify(e.getValue()))
                    .collect(java.util.stream.Collectors.joining(", ")) + "}";
        };
    }

    private static String escapeString(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\t", "\\t");
    }
}
```

## Practical Examples

### State Machine Implementation

Sealed classes are excellent for implementing state machines:

```java
public sealed interface OrderState permits
        Pending, Confirmed, Shipped, Delivered, Cancelled {

    String getDescription();
}

public record Pending(java.time.LocalDateTime createdAt) implements OrderState {
    @Override
    public String getDescription() {
        return "Order pending since " + createdAt;
    }
}

public record Confirmed(java.time.LocalDateTime confirmedAt, String confirmationId)
        implements OrderState {
    @Override
    public String getDescription() {
        return "Order confirmed at " + confirmedAt + " (ID: " + confirmationId + ")";
    }
}

public record Shipped(java.time.LocalDateTime shippedAt, String trackingNumber)
        implements OrderState {
    @Override
    public String getDescription() {
        return "Order shipped at " + shippedAt + " (Tracking: " + trackingNumber + ")";
    }
}

public record Delivered(java.time.LocalDateTime deliveredAt, String signedBy)
        implements OrderState {
    @Override
    public String getDescription() {
        return "Order delivered at " + deliveredAt + " (Signed by: " + signedBy + ")";
    }
}

public record Cancelled(java.time.LocalDateTime cancelledAt, String reason)
        implements OrderState {
    @Override
    public String getDescription() {
        return "Order cancelled at " + cancelledAt + " (Reason: " + reason + ")";
    }
}

public class Order {
    private final String orderId;
    private OrderState state;

    public Order(String orderId) {
        this.orderId = orderId;
        this.state = new Pending(java.time.LocalDateTime.now());
    }

    public OrderState getState() {
        return state;
    }

    public void confirm(String confirmationId) {
        state = switch (state) {
            case Pending p -> new Confirmed(
                java.time.LocalDateTime.now(),
                confirmationId
            );
            default -> throw new IllegalStateException(
                "Cannot confirm order in state: " + state.getClass().getSimpleName()
            );
        };
    }

    public void ship(String trackingNumber) {
        state = switch (state) {
            case Confirmed c -> new Shipped(
                java.time.LocalDateTime.now(),
                trackingNumber
            );
            default -> throw new IllegalStateException(
                "Cannot ship order in state: " + state.getClass().getSimpleName()
            );
        };
    }

    public void deliver(String signedBy) {
        state = switch (state) {
            case Shipped s -> new Delivered(
                java.time.LocalDateTime.now(),
                signedBy
            );
            default -> throw new IllegalStateException(
                "Cannot deliver order in state: " + state.getClass().getSimpleName()
            );
        };
    }

    public void cancel(String reason) {
        state = switch (state) {
            case Pending p -> new Cancelled(java.time.LocalDateTime.now(), reason);
            case Confirmed c -> new Cancelled(java.time.LocalDateTime.now(), reason);
            case Shipped s -> throw new IllegalStateException("Cannot cancel shipped order");
            case Delivered d -> throw new IllegalStateException("Cannot cancel delivered order");
            case Cancelled c -> throw new IllegalStateException("Order already cancelled");
        };
    }

    public boolean canBeCancelled() {
        return switch (state) {
            case Pending p -> true;
            case Confirmed c -> true;
            case Shipped s -> false;
            case Delivered d -> false;
            case Cancelled c -> false;
        };
    }
}
```

### Abstract Syntax Tree (AST)

Sealed classes are ideal for representing AST nodes:

```java
public sealed interface Statement permits
        VariableDeclaration, Assignment, IfStatement,
        WhileLoop, Block, ReturnStatement, ExpressionStatement {
}

public record VariableDeclaration(
    String type,
    String name,
    Expression initializer
) implements Statement {}

public record Assignment(
    String variable,
    Expression value
) implements Statement {}

public record IfStatement(
    Expression condition,
    Statement thenBranch,
    Statement elseBranch
) implements Statement {}

public record WhileLoop(
    Expression condition,
    Statement body
) implements Statement {}

public record Block(
    java.util.List<Statement> statements
) implements Statement {}

public record ReturnStatement(
    Expression value
) implements Statement {}

public record ExpressionStatement(
    Expression expression
) implements Statement {}

// Interpreter using pattern matching
public class Interpreter {
    private final java.util.Map<String, Object> variables = new java.util.HashMap<>();

    public void execute(Statement stmt) {
        switch (stmt) {
            case VariableDeclaration(var type, var name, var init) -> {
                Object value = init != null ? evaluate(init) : getDefaultValue(type);
                variables.put(name, value);
            }

            case Assignment(var variable, var value) -> {
                if (!variables.containsKey(variable)) {
                    throw new RuntimeException("Undefined variable: " + variable);
                }
                variables.put(variable, evaluate(value));
            }

            case IfStatement(var condition, var thenBranch, var elseBranch) -> {
                if (isTruthy(evaluate(condition))) {
                    execute(thenBranch);
                } else if (elseBranch != null) {
                    execute(elseBranch);
                }
            }

            case WhileLoop(var condition, var body) -> {
                while (isTruthy(evaluate(condition))) {
                    execute(body);
                }
            }

            case Block(var statements) -> {
                for (Statement s : statements) {
                    execute(s);
                }
            }

            case ReturnStatement(var value) -> {
                throw new ReturnException(evaluate(value));
            }

            case ExpressionStatement(var expr) -> {
                evaluate(expr);
            }
        }
    }

    private Object evaluate(Expression expr) {
        // Expression evaluation logic
        return null;
    }

    private Object getDefaultValue(String type) {
        return switch (type) {
            case "int", "long" -> 0;
            case "double", "float" -> 0.0;
            case "boolean" -> false;
            default -> null;
        };
    }

    private boolean isTruthy(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean b) return b;
        return true;
    }
}

class ReturnException extends RuntimeException {
    final Object value;

    ReturnException(Object value) {
        this.value = value;
    }
}
```

## Sealed Classes with Records

Records and sealed classes work exceptionally well together, as records are implicitly final:

```java
public sealed interface Notification permits
        EmailNotification, SmsNotification, PushNotification {

    String getMessage();
    java.time.LocalDateTime getTimestamp();
}

public record EmailNotification(
    String recipient,
    String subject,
    String body,
    java.time.LocalDateTime timestamp
) implements Notification {

    @Override
    public String getMessage() {
        return subject + ": " + body;
    }

    @Override
    public java.time.LocalDateTime getTimestamp() {
        return timestamp;
    }
}

public record SmsNotification(
    String phoneNumber,
    String message,
    java.time.LocalDateTime timestamp
) implements Notification {

    @Override
    public String getMessage() {
        return message;
    }

    @Override
    public java.time.LocalDateTime getTimestamp() {
        return timestamp;
    }
}

public record PushNotification(
    String deviceToken,
    String title,
    String body,
    java.util.Map<String, String> data,
    java.time.LocalDateTime timestamp
) implements Notification {

    @Override
    public String getMessage() {
        return title + ": " + body;
    }

    @Override
    public java.time.LocalDateTime getTimestamp() {
        return timestamp;
    }
}

public class NotificationService {

    public void send(Notification notification) {
        switch (notification) {
            case EmailNotification e -> sendEmail(e);
            case SmsNotification s -> sendSms(s);
            case PushNotification p -> sendPush(p);
        }
    }

    private void sendEmail(EmailNotification email) {
        System.out.printf("Sending email to %s: %s%n",
            email.recipient(), email.subject());
    }

    private void sendSms(SmsNotification sms) {
        System.out.printf("Sending SMS to %s: %s%n",
            sms.phoneNumber(), sms.message());
    }

    private void sendPush(PushNotification push) {
        System.out.printf("Sending push to device %s: %s%n",
            push.deviceToken(), push.title());
    }
}
```

## Reflection and Sealed Classes

You can inspect sealed class hierarchies at runtime using reflection:

```java
public class SealedClassInspector {

    public static void printHierarchy(Class<?> sealedClass) {
        if (!sealedClass.isSealed()) {
            System.out.println(sealedClass.getName() + " is not sealed");
            return;
        }

        System.out.println("Sealed class: " + sealedClass.getName());
        printPermittedSubclasses(sealedClass, 1);
    }

    private static void printPermittedSubclasses(Class<?> clazz, int indent) {
        Class<?>[] permitted = clazz.getPermittedSubclasses();

        for (Class<?> subclass : permitted) {
            String prefix = "  ".repeat(indent);
            String modifier = getModifier(subclass);

            System.out.println(prefix + "- " + modifier + " " + subclass.getSimpleName());

            if (subclass.isSealed()) {
                printPermittedSubclasses(subclass, indent + 1);
            }
        }
    }

    private static String getModifier(Class<?> clazz) {
        if (clazz.isSealed()) return "[sealed]";
        if (java.lang.reflect.Modifier.isFinal(clazz.getModifiers())) return "[final]";
        return "[non-sealed]";
    }

    public static void main(String[] args) {
        printHierarchy(Account.class);
        // Output:
        // Sealed class: Account
        //   - [sealed] SavingsAccount
        //     - [final] RegularSavings
        //     - [final] HighYieldSavings
        //   - [final] CheckingAccount
    }
}
```

## Best Practices

### Use Sealed Classes for Fixed Hierarchies

Sealed classes work best when you know all subtypes at design time:

```java
// Good: HTTP methods are well-defined
public sealed interface HttpMethod permits GET, POST, PUT, DELETE, PATCH {}

// Avoid: User-defined types should remain extensible
// public sealed class Plugin permits ... // Bad - plugins should be extensible
```

### Prefer Records for Immutable Data

When subtypes are simple data carriers, use records:

```java
public sealed interface Event permits
        UserCreated, UserUpdated, UserDeleted {
    String userId();
    java.time.Instant timestamp();
}

public record UserCreated(
    String userId,
    String email,
    java.time.Instant timestamp
) implements Event {}

public record UserUpdated(
    String userId,
    java.util.Map<String, Object> changes,
    java.time.Instant timestamp
) implements Event {}

public record UserDeleted(
    String userId,
    String reason,
    java.time.Instant timestamp
) implements Event {}
```

### Keep Hierarchies Shallow

Deep sealed hierarchies can become complex. Prefer flat structures:

```java
// Prefer this flat structure
public sealed interface Shape permits Circle, Rectangle, Triangle, Polygon {}

// Over deeply nested hierarchies
// public sealed interface Shape permits TwoDimensional, ThreeDimensional {}
// public sealed interface TwoDimensional extends Shape permits ... {}
```

### Document the Design Intent

Explain why the hierarchy is sealed:

```java
/**
 * Represents the possible states of a finite state machine for order processing.
 * This hierarchy is sealed because:
 * - All valid states are known at compile time
 * - Adding new states requires careful consideration of transitions
 * - Exhaustive pattern matching is required for correctness
 */
public sealed interface OrderState permits Pending, Processing, Completed, Failed {}
```

### Consider Non-Sealed for Extension Points

Use `non-sealed` strategically to provide extension points:

```java
public sealed interface Validator<T> permits
        RequiredValidator, RangeValidator, PatternValidator, CustomValidator {

    ValidationResult validate(T value);
}

// Built-in validators are final
public final class RequiredValidator<T> implements Validator<T> { /* ... */ }
public final class RangeValidator implements Validator<Number> { /* ... */ }
public final class PatternValidator implements Validator<String> { /* ... */ }

// Extension point for custom validators
public non-sealed class CustomValidator<T> implements Validator<T> {
    private final java.util.function.Predicate<T> predicate;
    private final String errorMessage;

    public CustomValidator(java.util.function.Predicate<T> predicate, String errorMessage) {
        this.predicate = predicate;
        this.errorMessage = errorMessage;
    }

    @Override
    public ValidationResult validate(T value) {
        return predicate.test(value)
            ? ValidationResult.valid()
            : ValidationResult.invalid(errorMessage);
    }
}
```

## Common Pitfalls

### Forgetting Subclass Modifiers

Every permitted subclass must specify `final`, `sealed`, or `non-sealed`:

```java
// Compilation error - missing modifier
public class Circle extends Shape { } // Error!

// Correct
public final class Circle extends Shape { }
```

### Cross-Package Permits

Sealed classes and permitted subclasses must be in the same package (or module):

```java
// In package com.example.shapes
public sealed class Shape permits Circle { }

// In package com.example.shapes.impl
// Compilation error - different package!
public final class Circle extends Shape { }
```

### Incomplete Switch Expressions

Adding a new permitted subclass requires updating all switch expressions:

```java
// If you add a new permitted subclass, this becomes incomplete
public String describe(Shape shape) {
    return switch (shape) {
        case Circle c -> "Circle";
        case Rectangle r -> "Rectangle";
        // Compilation error if Triangle is added as permitted subclass
    };
}
```

## Conclusion

Sealed classes are a powerful addition to Java that enable precise control over type hierarchies. They work seamlessly with pattern matching to provide exhaustive, type-safe handling of all possible subtypes. By combining sealed classes with records, you can create elegant, immutable data models that are both expressive and maintainable.

Key takeaways:

- Use `sealed` to create controlled hierarchies with known subtypes
- Permitted subclasses must use `final`, `sealed`, or `non-sealed`
- Sealed interfaces work the same way as sealed classes
- Pattern matching with sealed types enables exhaustive switch expressions
- Records are naturally `final` and work perfectly with sealed hierarchies
- Use `non-sealed` to create extension points when needed

Sealed classes are particularly valuable for domain modeling, state machines, AST representations, and any scenario where you need to enumerate all possible variants of a type at compile time.
