---
title: 密封类(Sealed Classes)
description: Java Sealed Classes完全指南，限制继承与模式匹配
track: java
section: basics
difficulty: intermediate
tags:
  - Java
  - Sealed Classes
  - 继承
  - 模式匹配
status: imported
origin: old/src/content/docs/java/sealed-classes.zh.md
divergence: 0.315
issues: []
legacy:
  category: Java
  subcategory: 语言特性
  order: 18
  lastUpdated: 2026-01-07
---

密封类是 Java 17 正式引入的一项重要语言特性，它允许开发者精确控制哪些类可以继承或实现某个类或接口。这一特性填补了 Java 类型系统中的一个重要空白，使得类层次结构的设计更加灵活和安全。

## 为什么需要密封类

在传统 Java 中，控制继承只有两种极端方式：

1. **完全开放**：使用普通类，任何类都可以继承
2. **完全封闭**：使用 `final` 关键字，禁止任何继承

```java
// 完全开放 - 任何类都可以继承
public class Shape {
    // ...
}

// 完全封闭 - 无法继承
public final class String {
    // ...
}
```

这两种方式都有明显的局限性。在很多实际场景中，我们需要一种**受限继承**的能力——只允许特定的类进行继承。例如，在定义领域模型时，我们可能确切知道一个类型的所有可能子类型。

## sealed 关键字

`sealed` 关键字用于声明一个密封类或接口，表示它的继承是受限的。

### 基本语法

```java
public sealed class Shape permits Circle, Rectangle, Triangle {
    // 类的实现
}
```

在这个声明中：
- `sealed` 表示这是一个密封类
- `permits` 子句列出了所有允许继承的子类

### permits 子句

`permits` 子句明确指定了哪些类可以直接继承密封类：

```java
public sealed class Vehicle permits Car, Motorcycle, Truck {
    private String brand;
    private int year;

    public Vehicle(String brand, int year) {
        this.brand = brand;
        this.year = year;
    }

    public String getBrand() {
        return brand;
    }

    public int getYear() {
        return year;
    }
}
```

**重要规则：**

1. `permits` 中列出的所有类都必须直接继承密封类
2. 这些子类必须与密封类在同一个模块中（如果使用模块系统）
3. 如果不使用模块系统，子类必须与密封类在同一个包中
4. 每个允许的子类必须使用 `final`、`sealed` 或 `non-sealed` 修饰符

### 省略 permits 子句

当所有子类与密封类定义在同一个源文件中时，可以省略 `permits` 子句：

```java
// 所有类在同一个文件中
public sealed class Expression {
    // 密封类
}

final class Constant extends Expression {
    private final int value;

    Constant(int value) {
        this.value = value;
    }
}

final class Variable extends Expression {
    private final String name;

    Variable(String name) {
        this.name = name;
    }
}

final class BinaryOp extends Expression {
    private final Expression left;
    private final Expression right;
    private final String operator;

    BinaryOp(Expression left, Expression right, String operator) {
        this.left = left;
        this.right = right;
        this.operator = operator;
    }
}
```

编译器会自动推断 `permits` 列表。

## 子类的三种修饰符

密封类的直接子类必须使用以下三种修饰符之一：

### final 子类

使用 `final` 表示该子类不能再被继承，继承链在此终止：

```java
public sealed class Shape permits Circle, Rectangle {
    public abstract double area();
}

// final 子类 - 不能再被继承
public final class Circle extends Shape {
    private final double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }

    public double getRadius() {
        return radius;
    }
}

public final class Rectangle extends Shape {
    private final double width;
    private final double height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() {
        return width * height;
    }
}
```

### sealed 子类

子类本身也可以是密封的，继续限制其子类：

```java
public sealed class Vehicle permits Car, Motorcycle {
    // 父密封类
}

// sealed 子类 - 继续限制继承
public sealed class Car extends Vehicle permits Sedan, SUV, SportsCar {
    private int numberOfDoors;

    public Car(int numberOfDoors) {
        this.numberOfDoors = numberOfDoors;
    }
}

public final class Sedan extends Car {
    public Sedan() {
        super(4);
    }
}

public final class SUV extends Car {
    private boolean fourWheelDrive;

    public SUV(boolean fourWheelDrive) {
        super(4);
        this.fourWheelDrive = fourWheelDrive;
    }
}

public final class SportsCar extends Car {
    public SportsCar() {
        super(2);
    }
}
```

### non-sealed 子类

使用 `non-sealed` 表示该子类放弃密封限制，恢复为普通的开放类：

```java
public sealed class Animal permits Dog, Cat, Fish {
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
        System.out.println(name + " is barking!");
    }
}

public final class Cat extends Animal {
    public Cat(String name) {
        super(name);
    }

    public void meow() {
        System.out.println(name + " is meowing!");
    }
}

// non-sealed 子类 - 开放继承
public non-sealed class Fish extends Animal {
    public Fish(String name) {
        super(name);
    }

    public void swim() {
        System.out.println(name + " is swimming!");
    }
}

// 可以自由继承 Fish
public class Goldfish extends Fish {
    public Goldfish(String name) {
        super(name);
    }
}

public class Shark extends Fish {
    public Shark(String name) {
        super(name);
    }

    public void hunt() {
        System.out.println(name + " is hunting!");
    }
}
```

## 密封接口

密封特性同样适用于接口：

```java
public sealed interface PaymentMethod permits CreditCard, DebitCard, DigitalWallet {
    void processPayment(double amount);
    String getPaymentDetails();
}

public final class CreditCard implements PaymentMethod {
    private String cardNumber;
    private String expiryDate;

    public CreditCard(String cardNumber, String expiryDate) {
        this.cardNumber = cardNumber;
        this.expiryDate = expiryDate;
    }

    @Override
    public void processPayment(double amount) {
        System.out.println("Processing credit card payment of $" + amount);
    }

    @Override
    public String getPaymentDetails() {
        return "Credit Card ending in " + cardNumber.substring(cardNumber.length() - 4);
    }
}

public final class DebitCard implements PaymentMethod {
    private String cardNumber;
    private String bankName;

    public DebitCard(String cardNumber, String bankName) {
        this.cardNumber = cardNumber;
        this.bankName = bankName;
    }

    @Override
    public void processPayment(double amount) {
        System.out.println("Processing debit card payment of $" + amount);
    }

    @Override
    public String getPaymentDetails() {
        return "Debit Card from " + bankName;
    }
}

public non-sealed class DigitalWallet implements PaymentMethod {
    private String walletId;
    private String provider;

    public DigitalWallet(String walletId, String provider) {
        this.walletId = walletId;
        this.provider = provider;
    }

    @Override
    public void processPayment(double amount) {
        System.out.println("Processing " + provider + " payment of $" + amount);
    }

    @Override
    public String getPaymentDetails() {
        return provider + " Wallet: " + walletId;
    }
}
```

### 接口的多重继承

一个类可以实现多个密封接口：

```java
public sealed interface Printable permits Document {
    void print();
}

public sealed interface Scannable permits Document {
    void scan();
}

// Document 同时实现两个密封接口
public final class Document implements Printable, Scannable {
    private String content;

    public Document(String content) {
        this.content = content;
    }

    @Override
    public void print() {
        System.out.println("Printing: " + content);
    }

    @Override
    public void scan() {
        System.out.println("Scanning document...");
    }
}
```

## 与模式匹配结合使用

密封类与 Java 的模式匹配特性结合使用时，可以发挥更大的威力。

### switch 模式匹配

从 Java 21 开始，可以在 switch 表达式中对密封类进行模式匹配：

```java
public sealed interface Result<T> permits Success, Failure {
    // 结果接口
}

public record Success<T>(T value) implements Result<T> {}

public record Failure<T>(String errorMessage, Exception cause) implements Result<T> {}

// 使用 switch 模式匹配
public class ResultHandler {

    public static <T> void handleResult(Result<T> result) {
        switch (result) {
            case Success<T> s -> System.out.println("Success: " + s.value());
            case Failure<T> f -> System.out.println("Error: " + f.errorMessage());
            // 不需要 default 分支，因为编译器知道所有可能的子类型
        }
    }

    public static <T> String describeResult(Result<T> result) {
        return switch (result) {
            case Success<T> s -> "Operation succeeded with value: " + s.value();
            case Failure<T> f -> "Operation failed: " + f.errorMessage();
        };
    }
}
```

### 穷尽性检查

编译器可以验证 switch 表达式是否覆盖了密封类的所有子类型：

```java
public sealed interface TrafficLight permits Red, Yellow, Green {
    String getAction();
}

public record Red() implements TrafficLight {
    @Override
    public String getAction() {
        return "Stop";
    }
}

public record Yellow() implements TrafficLight {
    @Override
    public String getAction() {
        return "Caution";
    }
}

public record Green() implements TrafficLight {
    @Override
    public String getAction() {
        return "Go";
    }
}

public class TrafficController {

    // 编译器确保所有情况都被处理
    public static int getWaitTime(TrafficLight light) {
        return switch (light) {
            case Red r -> 30;
            case Yellow y -> 5;
            case Green g -> 25;
            // 如果遗漏任何一个，编译器会报错
        };
    }

    // 使用守卫条件的高级匹配
    public static String getDetailedAction(TrafficLight light, boolean isEmergency) {
        return switch (light) {
            case Red r when isEmergency -> "Proceed with extreme caution";
            case Red r -> "Stop and wait";
            case Yellow y -> "Prepare to stop";
            case Green g -> "Proceed normally";
        };
    }
}
```

### instanceof 模式匹配

密封类也可以与 `instanceof` 模式匹配结合：

```java
public sealed interface JsonValue permits JsonString, JsonNumber, JsonBoolean, JsonArray, JsonObject, JsonNull {
    // JSON 值接口
}

public record JsonString(String value) implements JsonValue {}
public record JsonNumber(double value) implements JsonValue {}
public record JsonBoolean(boolean value) implements JsonValue {}
public record JsonArray(java.util.List<JsonValue> elements) implements JsonValue {}
public record JsonObject(java.util.Map<String, JsonValue> properties) implements JsonValue {}
public record JsonNull() implements JsonValue {}

public class JsonProcessor {

    public static String stringify(JsonValue value) {
        if (value instanceof JsonString s) {
            return "\"" + s.value() + "\"";
        } else if (value instanceof JsonNumber n) {
            return String.valueOf(n.value());
        } else if (value instanceof JsonBoolean b) {
            return String.valueOf(b.value());
        } else if (value instanceof JsonNull) {
            return "null";
        } else if (value instanceof JsonArray arr) {
            return arr.elements().stream()
                    .map(JsonProcessor::stringify)
                    .collect(java.util.stream.Collectors.joining(", ", "[", "]"));
        } else if (value instanceof JsonObject obj) {
            return obj.properties().entrySet().stream()
                    .map(e -> "\"" + e.getKey() + "\": " + stringify(e.getValue()))
                    .collect(java.util.stream.Collectors.joining(", ", "{", "}"));
        }
        throw new IllegalStateException("Unexpected value: " + value);
    }
}
```

## 实际应用示例

### 状态机实现

密封类非常适合实现状态机：

```java
public sealed interface OrderState
        permits Pending, Confirmed, Shipped, Delivered, Cancelled {

    String getDescription();
    boolean canTransitionTo(OrderState newState);
}

public record Pending(java.time.LocalDateTime createdAt) implements OrderState {
    @Override
    public String getDescription() {
        return "Order is pending confirmation";
    }

    @Override
    public boolean canTransitionTo(OrderState newState) {
        return newState instanceof Confirmed || newState instanceof Cancelled;
    }
}

public record Confirmed(java.time.LocalDateTime confirmedAt) implements OrderState {
    @Override
    public String getDescription() {
        return "Order has been confirmed";
    }

    @Override
    public boolean canTransitionTo(OrderState newState) {
        return newState instanceof Shipped || newState instanceof Cancelled;
    }
}

public record Shipped(String trackingNumber, java.time.LocalDateTime shippedAt) implements OrderState {
    @Override
    public String getDescription() {
        return "Order has been shipped. Tracking: " + trackingNumber;
    }

    @Override
    public boolean canTransitionTo(OrderState newState) {
        return newState instanceof Delivered;
    }
}

public record Delivered(java.time.LocalDateTime deliveredAt) implements OrderState {
    @Override
    public String getDescription() {
        return "Order has been delivered";
    }

    @Override
    public boolean canTransitionTo(OrderState newState) {
        return false; // 终态
    }
}

public record Cancelled(String reason, java.time.LocalDateTime cancelledAt) implements OrderState {
    @Override
    public String getDescription() {
        return "Order was cancelled: " + reason;
    }

    @Override
    public boolean canTransitionTo(OrderState newState) {
        return false; // 终态
    }
}

// 订单类
public class Order {
    private final String orderId;
    private OrderState state;

    public Order(String orderId) {
        this.orderId = orderId;
        this.state = new Pending(java.time.LocalDateTime.now());
    }

    public void transition(OrderState newState) {
        if (!state.canTransitionTo(newState)) {
            throw new IllegalStateException(
                "Cannot transition from " + state.getClass().getSimpleName() +
                " to " + newState.getClass().getSimpleName()
            );
        }
        this.state = newState;
    }

    public String getStatus() {
        return switch (state) {
            case Pending p -> "Pending since " + p.createdAt();
            case Confirmed c -> "Confirmed at " + c.confirmedAt();
            case Shipped s -> "Shipped via " + s.trackingNumber();
            case Delivered d -> "Delivered at " + d.deliveredAt();
            case Cancelled c -> "Cancelled: " + c.reason();
        };
    }
}
```

### 抽象语法树(AST)

密封类是构建 AST 的理想选择：

```java
public sealed interface Expr permits Literal, Variable, BinaryExpr, UnaryExpr, CallExpr {
    <T> T accept(ExprVisitor<T> visitor);
}

public record Literal(Object value) implements Expr {
    @Override
    public <T> T accept(ExprVisitor<T> visitor) {
        return visitor.visitLiteral(this);
    }
}

public record Variable(String name) implements Expr {
    @Override
    public <T> T accept(ExprVisitor<T> visitor) {
        return visitor.visitVariable(this);
    }
}

public record BinaryExpr(Expr left, String operator, Expr right) implements Expr {
    @Override
    public <T> T accept(ExprVisitor<T> visitor) {
        return visitor.visitBinaryExpr(this);
    }
}

public record UnaryExpr(String operator, Expr operand) implements Expr {
    @Override
    public <T> T accept(ExprVisitor<T> visitor) {
        return visitor.visitUnaryExpr(this);
    }
}

public record CallExpr(String functionName, java.util.List<Expr> arguments) implements Expr {
    @Override
    public <T> T accept(ExprVisitor<T> visitor) {
        return visitor.visitCallExpr(this);
    }
}

// 访问者接口
public interface ExprVisitor<T> {
    T visitLiteral(Literal expr);
    T visitVariable(Variable expr);
    T visitBinaryExpr(BinaryExpr expr);
    T visitUnaryExpr(UnaryExpr expr);
    T visitCallExpr(CallExpr expr);
}

// 表达式求值器
public class Evaluator implements ExprVisitor<Double> {
    private final java.util.Map<String, Double> variables;

    public Evaluator(java.util.Map<String, Double> variables) {
        this.variables = variables;
    }

    @Override
    public Double visitLiteral(Literal expr) {
        if (expr.value() instanceof Number n) {
            return n.doubleValue();
        }
        throw new IllegalArgumentException("Cannot evaluate: " + expr.value());
    }

    @Override
    public Double visitVariable(Variable expr) {
        Double value = variables.get(expr.name());
        if (value == null) {
            throw new IllegalArgumentException("Unknown variable: " + expr.name());
        }
        return value;
    }

    @Override
    public Double visitBinaryExpr(BinaryExpr expr) {
        double left = expr.left().accept(this);
        double right = expr.right().accept(this);

        return switch (expr.operator()) {
            case "+" -> left + right;
            case "-" -> left - right;
            case "*" -> left * right;
            case "/" -> left / right;
            default -> throw new IllegalArgumentException("Unknown operator: " + expr.operator());
        };
    }

    @Override
    public Double visitUnaryExpr(UnaryExpr expr) {
        double operand = expr.operand().accept(this);
        return switch (expr.operator()) {
            case "-" -> -operand;
            case "+" -> operand;
            default -> throw new IllegalArgumentException("Unknown operator: " + expr.operator());
        };
    }

    @Override
    public Double visitCallExpr(CallExpr expr) {
        java.util.List<Double> args = expr.arguments().stream()
                .map(arg -> arg.accept(this))
                .toList();

        return switch (expr.functionName()) {
            case "sqrt" -> Math.sqrt(args.get(0));
            case "pow" -> Math.pow(args.get(0), args.get(1));
            case "max" -> args.stream().mapToDouble(Double::doubleValue).max().orElse(0);
            case "min" -> args.stream().mapToDouble(Double::doubleValue).min().orElse(0);
            default -> throw new IllegalArgumentException("Unknown function: " + expr.functionName());
        };
    }
}
```

### 领域驱动设计中的值对象

```java
public sealed interface Money permits USD, EUR, GBP, JPY {
    java.math.BigDecimal amount();
    String currencyCode();

    default Money add(Money other) {
        if (!this.currencyCode().equals(other.currencyCode())) {
            throw new IllegalArgumentException("Cannot add different currencies");
        }
        return create(currencyCode(), amount().add(other.amount()));
    }

    static Money create(String currencyCode, java.math.BigDecimal amount) {
        return switch (currencyCode) {
            case "USD" -> new USD(amount);
            case "EUR" -> new EUR(amount);
            case "GBP" -> new GBP(amount);
            case "JPY" -> new JPY(amount);
            default -> throw new IllegalArgumentException("Unsupported currency: " + currencyCode);
        };
    }
}

public record USD(java.math.BigDecimal amount) implements Money {
    @Override
    public String currencyCode() {
        return "USD";
    }

    @Override
    public String toString() {
        return "$" + amount.setScale(2, java.math.RoundingMode.HALF_UP);
    }
}

public record EUR(java.math.BigDecimal amount) implements Money {
    @Override
    public String currencyCode() {
        return "EUR";
    }

    @Override
    public String toString() {
        return "€" + amount.setScale(2, java.math.RoundingMode.HALF_UP);
    }
}

public record GBP(java.math.BigDecimal amount) implements Money {
    @Override
    public String currencyCode() {
        return "GBP";
    }

    @Override
    public String toString() {
        return "£" + amount.setScale(2, java.math.RoundingMode.HALF_UP);
    }
}

public record JPY(java.math.BigDecimal amount) implements Money {
    @Override
    public String currencyCode() {
        return "JPY";
    }

    @Override
    public String toString() {
        return "¥" + amount.setScale(0, java.math.RoundingMode.HALF_UP);
    }
}
```

## 反射 API

Java 反射 API 提供了检查密封类的方法：

```java
public class SealedClassInspector {

    public static void inspect(Class<?> clazz) {
        System.out.println("Class: " + clazz.getName());
        System.out.println("Is sealed: " + clazz.isSealed());

        if (clazz.isSealed()) {
            System.out.println("Permitted subclasses:");
            for (Class<?> permitted : clazz.getPermittedSubclasses()) {
                System.out.println("  - " + permitted.getName());

                if (java.lang.reflect.Modifier.isFinal(permitted.getModifiers())) {
                    System.out.println("    (final)");
                } else if (permitted.isSealed()) {
                    System.out.println("    (sealed)");
                } else {
                    System.out.println("    (non-sealed)");
                }
            }
        }
    }

    public static void main(String[] args) {
        inspect(Shape.class);  // 假设 Shape 是一个密封类
    }
}
```

## 最佳实践

### 优先使用 final 子类

除非有明确的需求，否则子类应该声明为 `final`：

```java
// 推荐：使用 final
public sealed interface Command permits CreateCommand, UpdateCommand, DeleteCommand {}

public final class CreateCommand implements Command {
    private final String data;
    public CreateCommand(String data) { this.data = data; }
}

public final class UpdateCommand implements Command {
    private final String id;
    private final String newData;
    public UpdateCommand(String id, String newData) {
        this.id = id;
        this.newData = newData;
    }
}

public final class DeleteCommand implements Command {
    private final String id;
    public DeleteCommand(String id) { this.id = id; }
}
```

### 结合 record 使用

密封类与 record 是完美的组合：

```java
public sealed interface Event permits UserCreated, UserUpdated, UserDeleted {
    String userId();
    java.time.Instant timestamp();
}

public record UserCreated(String userId, String email, java.time.Instant timestamp) implements Event {}

public record UserUpdated(String userId, java.util.Map<String, Object> changes, java.time.Instant timestamp) implements Event {}

public record UserDeleted(String userId, String reason, java.time.Instant timestamp) implements Event {}
```

### 在同一文件中定义小型层次结构

对于简单的类型层次结构，将所有类定义在同一个文件中可以提高可读性：

```java
// Option.java
public sealed interface Option<T> {

    static <T> Option<T> some(T value) {
        return new Some<>(value);
    }

    static <T> Option<T> none() {
        return new None<>();
    }

    default T getOrElse(T defaultValue) {
        return switch (this) {
            case Some<T> s -> s.value();
            case None<T> n -> defaultValue;
        };
    }

    default <U> Option<U> map(java.util.function.Function<T, U> mapper) {
        return switch (this) {
            case Some<T> s -> new Some<>(mapper.apply(s.value()));
            case None<T> n -> new None<>();
        };
    }
}

record Some<T>(T value) implements Option<T> {}

record None<T>() implements Option<T> {}
```

### 谨慎使用 non-sealed

`non-sealed` 打破了密封的保证，应该谨慎使用：

```java
// 仅在确实需要扩展点时使用 non-sealed
public sealed interface Plugin permits CorePlugin, ThirdPartyPlugin {}

public final class CorePlugin implements Plugin {
    // 核心插件，不允许扩展
}

// 第三方插件需要开放扩展
public non-sealed class ThirdPartyPlugin implements Plugin {
    // 允许第三方开发者继承
}
```

## 密封类 vs 枚举

密封类和枚举都可以表示有限的类型集合，但有重要区别：

| 特性 | 枚举 | 密封类 |
|------|------|--------|
| 实例数量 | 固定的常量集 | 可以创建多个实例 |
| 携带数据 | 所有常量共享相同字段 | 每个子类可以有不同的字段 |
| 继承 | 不能继承 | 支持类层次结构 |
| 模式匹配 | 支持 | 支持 |
| 序列化 | 内置支持 | 需要自定义 |

```java
// 枚举：适合固定常量集
public enum DayOfWeek {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}

// 密封类：适合需要不同数据的类型
public sealed interface Shape permits Circle, Rectangle, Triangle {}

public record Circle(double radius) implements Shape {}
public record Rectangle(double width, double height) implements Shape {}
public record Triangle(double a, double b, double c) implements Shape {}
```

## 注意事项与限制

1. **编译时检查**：permits 列表中的类必须在编译时存在且可访问

2. **模块边界**：在模块系统中，允许的子类必须与密封类在同一模块

3. **抽象方法**：密封类可以是抽象的，也可以包含抽象方法

4. **构造函数**：密封类的构造函数可以是任何访问级别

5. **嵌套类**：密封类可以包含嵌套类，嵌套类也可以是允许的子类

```java
public sealed class Outer {
    // 嵌套的密封子类
    public static final class Inner extends Outer {
        // ...
    }

    public static sealed class AnotherInner extends Outer permits AnotherInner.DeepNested {
        public static final class DeepNested extends AnotherInner {
            // ...
        }
    }
}
```

## 总结

密封类是 Java 类型系统的重要补充，它提供了一种在完全开放和完全封闭之间的中间选择。主要优势包括：

- **精确控制继承**：明确指定哪些类可以继承
- **更好的模式匹配**：编译器可以进行穷尽性检查
- **领域建模**：更准确地表达业务领域中的类型层次
- **API 设计**：构建更安全、更可预测的 API

结合 record、模式匹配等现代 Java 特性，密封类使得 Java 在函数式编程和代数数据类型方面有了长足的进步，为开发者提供了更强大的类型安全保障。
