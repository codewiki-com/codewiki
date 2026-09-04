---
title: Java 接口
description: 深入学习 Java 接口，包括默认方法、静态方法、函数式接口和设计模式
track: java
section: oop-generics
difficulty: intermediate
tags:
  - Java
  - 接口
  - OOP
  - 设计模式
status: imported
origin: old/src/content/docs/java/interfaces.zh.md
divergence: 0.22
issues: []
legacy:
  category: Java
  subcategory: OOP
  order: 20
  lastUpdated: 2026-01-07
---

Java 接口是该语言中最强大的抽象机制之一。接口定义了实现类必须遵循的契约，指定类能做什么而不规定如何实现。从 Java 8 开始，接口已经有了显著的发展，增加了默认方法、静态方法和私有方法（Java 9），使其更加多功能化。

## 接口简介

Java 中的接口是一种引用类型，定义了实现类必须提供的行为契约。在 Java 8 之前，接口只能包含抽象方法声明和常量。现代 Java 已经扩展了接口，使其包含默认方法、静态方法和私有方法，同时保持向后兼容性。

### 为什么使用接口？

```java
// 不使用接口 - 紧耦合代码
public class EmailNotificationService {
    public void sendNotification(String message) {
        System.out.println("发送邮件: " + message);
    }
}

public class OrderProcessor {
    private EmailNotificationService emailService;

    public OrderProcessor() {
        // 与 EmailNotificationService 紧耦合
        this.emailService = new EmailNotificationService();
    }

    public void processOrder(Order order) {
        // 处理订单...
        emailService.sendNotification("订单已处理: " + order.getId());
    }
}

// 使用接口 - 松耦合、灵活的代码
public interface NotificationService {
    void sendNotification(String message);
}

public class EmailNotificationService implements NotificationService {
    @Override
    public void sendNotification(String message) {
        System.out.println("发送邮件: " + message);
    }
}

public class SMSNotificationService implements NotificationService {
    @Override
    public void sendNotification(String message) {
        System.out.println("发送短信: " + message);
    }
}

public class OrderProcessor {
    private NotificationService notificationService;

    // 依赖注入 - 任何 NotificationService 实现都可以工作
    public OrderProcessor(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    public void processOrder(Order order) {
        // 处理订单...
        notificationService.sendNotification("订单已处理: " + order.getId());
    }
}
```

## 基本接口语法

### 定义接口

```java
public interface Drawable {
    // 常量（默认为 public static final）
    int DEFAULT_COLOR = 0x000000;

    // 抽象方法（默认为 public abstract）
    void draw();

    // 带参数和返回值的抽象方法
    boolean resize(int width, int height);

    // 带泛型参数的抽象方法
    void setColor(String color);
}
```

### 接口特性

接口的所有成员都有隐式修饰符：

```java
public interface InterfaceCharacteristics {
    // 变量隐式为：public static final
    int CONSTANT = 100;  // 等同于：public static final int CONSTANT = 100;

    // 方法隐式为：public abstract（Java 8 之前）
    void doSomething();  // 等同于：public abstract void doSomething();

    // 不能有实例字段
    // private int instanceField;  // 编译错误

    // 不能有构造函数
    // public InterfaceCharacteristics() {}  // 编译错误
}
```

## 实现接口

### 单接口实现

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
        System.out.println(brand + " 汽车已启动");
    }

    @Override
    public void stop() {
        isRunning = false;
        currentSpeed = 0;
        System.out.println(brand + " 汽车已停止");
    }

    @Override
    public int getSpeed() {
        return currentSpeed;
    }

    @Override
    public void accelerate(int increment) {
        if (isRunning) {
            currentSpeed += increment;
            System.out.println("加速到 " + currentSpeed + " 公里/小时");
        } else {
            System.out.println("无法加速 - 汽车未启动");
        }
    }
}

// 使用示例
public class VehicleDemo {
    public static void main(String[] args) {
        Vehicle car = new Car("丰田");
        car.start();
        car.accelerate(50);
        car.accelerate(30);
        System.out.println("当前速度: " + car.getSpeed());
        car.stop();
    }
}
```

### 使用接口实现多态

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
        System.out.println("绘制半径为 " + radius + " 的圆");
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
        System.out.println("绘制 " + width + "x" + height + " 的矩形");
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
        // 海伦公式
        double s = (a + b + c) / 2;
        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }

    @Override
    public double calculatePerimeter() {
        return a + b + c;
    }

    @Override
    public void draw() {
        System.out.println("绘制边长为 " + a + ", " + b + ", " + c + " 的三角形");
    }
}

// 多态使用
public class ShapeProcessor {
    public static void processShapes(Shape[] shapes) {
        double totalArea = 0;

        for (Shape shape : shapes) {
            shape.draw();
            System.out.println("  面积: " + shape.calculateArea());
            System.out.println("  周长: " + shape.calculatePerimeter());
            totalArea += shape.calculateArea();
        }

        System.out.println("所有形状的总面积: " + totalArea);
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

## 多接口实现

Java 允许一个类实现多个接口，提供了一种行为的多重继承形式。

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

// 鸭子实现了所有三个接口
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

    // Flyable 实现
    @Override
    public void takeOff() {
        altitude = 10;
        System.out.println(name + " 正在起飞！");
    }

    @Override
    public void fly() {
        altitude += 50;
        System.out.println(name + " 正在 " + altitude + " 米高空飞行");
    }

    @Override
    public void land() {
        altitude = 0;
        System.out.println(name + " 已降落");
    }

    @Override
    public int getAltitude() {
        return altitude;
    }

    // Swimmable 实现
    @Override
    public void dive() {
        depth = 5;
        System.out.println(name + " 正在潜水！");
    }

    @Override
    public void swim() {
        System.out.println(name + " 正在 " + depth + " 米深处游泳");
    }

    @Override
    public void surface() {
        depth = 0;
        System.out.println(name + " 已浮出水面");
    }

    @Override
    public int getDepth() {
        return depth;
    }

    // Walkable 实现
    @Override
    public void walk() {
        speed = 2;
        System.out.println(name + " 正以 " + speed + " 公里/小时的速度行走");
    }

    @Override
    public void run() {
        speed = 8;
        System.out.println(name + " 正以 " + speed + " 公里/小时的速度奔跑");
    }

    @Override
    public void stop() {
        speed = 0;
        System.out.println(name + " 已停止");
    }

    @Override
    public int getSpeed() {
        return speed;
    }
}

// 演示接口隔离的使用
public class MultipleInterfaceDemo {
    public static void main(String[] args) {
        Duck duck = new Duck("唐老鸭");

        // 作为 Flyable 使用
        Flyable flyer = duck;
        flyer.takeOff();
        flyer.fly();
        flyer.land();

        System.out.println("---");

        // 作为 Swimmable 使用
        Swimmable swimmer = duck;
        swimmer.dive();
        swimmer.swim();
        swimmer.surface();

        System.out.println("---");

        // 作为 Walkable 使用
        Walkable walker = duck;
        walker.walk();
        walker.run();
        walker.stop();
    }
}
```

## 接口继承

接口可以继承其他接口，创建继承层次结构。

```java
// 基础接口
public interface Entity {
    Long getId();
    void setId(Long id);
}

// 扩展接口
public interface Auditable extends Entity {
    LocalDateTime getCreatedAt();
    void setCreatedAt(LocalDateTime createdAt);
    LocalDateTime getUpdatedAt();
    void setUpdatedAt(LocalDateTime updatedAt);
    String getCreatedBy();
    void setCreatedBy(String createdBy);
}

// 多接口继承
public interface SoftDeletable {
    boolean isDeleted();
    void setDeleted(boolean deleted);
    LocalDateTime getDeletedAt();
    void setDeletedAt(LocalDateTime deletedAt);
}

// 继承多个接口的接口
public interface BaseEntity extends Auditable, SoftDeletable {
    // 继承 Auditable 和 SoftDeletable 的所有方法
    // 可以添加更多方法
    int getVersion();
    void setVersion(int version);
}

// 实现
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

    // 构造函数
    public User(String username, String email) {
        this.username = username;
        this.email = email;
        this.createdAt = LocalDateTime.now();
        this.version = 1;
    }

    // Entity 方法
    @Override
    public Long getId() { return id; }

    @Override
    public void setId(Long id) { this.id = id; }

    // Auditable 方法
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

    // SoftDeletable 方法
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

    // BaseEntity 方法
    @Override
    public int getVersion() { return version; }

    @Override
    public void setVersion(int version) { this.version = version; }

    // 领域特定的 getter/setter
    public String getUsername() { return username; }
    public String getEmail() { return email; }
}
```

## 默认方法

Java 8 引入的默认方法允许接口提供方法实现。这使得接口可以在不破坏现有实现的情况下进行演化。

### 基本默认方法

```java
public interface Collection<E> {
    // 抽象方法
    int size();
    boolean isEmpty();
    boolean contains(E element);
    void add(E element);
    void remove(E element);
    void clear();

    // 带实现的默认方法
    default boolean addAll(Collection<? extends E> collection) {
        boolean modified = false;
        for (E element : collection) {
            add(element);
            modified = true;
        }
        return modified;
    }

    // 使用其他方法的默认方法
    default boolean isNotEmpty() {
        return !isEmpty();
    }

    // 带复杂逻辑的默认方法
    default void forEach(Consumer<? super E> action) {
        Objects.requireNonNull(action);
        for (E element : this) {
            action.accept(element);
        }
    }
}
```

### 用于接口演化的默认方法

```java
// 原始接口（v1.0）
public interface PaymentProcessor {
    void processPayment(double amount);
    boolean refund(String transactionId);
}

// 演化后的接口（v2.0）- 通过默认方法向后兼容
public interface PaymentProcessor {
    void processPayment(double amount);
    boolean refund(String transactionId);

    // 带默认实现的新方法 - 现有类仍然可以工作
    default void processPayment(double amount, String currency) {
        if (!"USD".equals(currency)) {
            amount = convertToUSD(amount, currency);
        }
        processPayment(amount);
    }

    // 辅助默认方法
    default double convertToUSD(double amount, String currency) {
        // 简化转换
        switch (currency) {
            case "EUR": return amount * 1.10;
            case "GBP": return amount * 1.27;
            case "JPY": return amount * 0.0067;
            default: return amount;
        }
    }

    // 带合理默认值的新功能
    default boolean supportsRecurringPayments() {
        return false;  // 现有实现的安全默认值
    }
}
```

### 解决默认方法冲突

当一个类实现多个具有冲突默认方法的接口时，需要显式解决。

```java
public interface InterfaceA {
    default void greet() {
        System.out.println("来自接口 A 的问候");
    }

    default void commonMethod() {
        System.out.println("来自 A 的通用方法");
    }
}

public interface InterfaceB {
    default void greet() {
        System.out.println("来自接口 B 的问候");
    }

    default void commonMethod() {
        System.out.println("来自 B 的通用方法");
    }
}

public class ConflictResolver implements InterfaceA, InterfaceB {
    // 必须重写以解决冲突
    @Override
    public void greet() {
        // 选项 1：提供自己的实现
        System.out.println("来自 ConflictResolver 的问候");
    }

    @Override
    public void commonMethod() {
        // 选项 2：委托给特定接口
        InterfaceA.super.commonMethod();
    }

    public void demonstrateBoth() {
        // 可以显式调用任一默认方法
        InterfaceA.super.greet();
        InterfaceB.super.greet();
    }
}

public class DefaultMethodConflictDemo {
    public static void main(String[] args) {
        ConflictResolver resolver = new ConflictResolver();

        resolver.greet();         // "来自 ConflictResolver 的问候"
        resolver.commonMethod();  // "来自 A 的通用方法"

        System.out.println("---");
        resolver.demonstrateBoth();
    }
}
```

### 默认方法 vs 类方法

```java
public interface Printable {
    default void print() {
        System.out.println("Printable.print()");
    }
}

public class Document implements Printable {
    // 类方法覆盖默认方法
    @Override
    public void print() {
        System.out.println("Document.print()");
    }
}

public class Report implements Printable {
    // 使用接口的默认实现
}

// 规则：类方法始终优先于默认方法
public class DefaultMethodPrecedenceDemo {
    public static void main(String[] args) {
        Printable doc = new Document();
        Printable report = new Report();

        doc.print();    // "Document.print()" - 类方法获胜
        report.print(); // "Printable.print()" - 使用默认方法
    }
}
```

## 静态方法

Java 8 还在接口中引入了静态方法。这些是属于接口本身而非实现类的工具方法。

```java
public interface StringUtils {
    // 静态方法 - 工具函数
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

    // 工厂方法模式
    static Comparator<String> caseInsensitiveComparator() {
        return String.CASE_INSENSITIVE_ORDER;
    }
}

// 使用 - 静态方法在接口上调用，而不是实现类
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

### 接口中的静态工厂方法

```java
public interface Logger {
    void log(String message);
    void error(String message);
    void debug(String message);

    // 静态工厂方法
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
        System.out.println("[信息] " + message);
    }

    @Override
    public void error(String message) {
        System.err.println("[错误] " + message);
    }

    @Override
    public void debug(String message) {
        System.out.println("[调试] " + message);
    }
}

class FileLogger implements Logger {
    private final String filename;

    FileLogger(String filename) {
        this.filename = filename;
    }

    @Override
    public void log(String message) {
        writeToFile("[信息] " + message);
    }

    @Override
    public void error(String message) {
        writeToFile("[错误] " + message);
    }

    @Override
    public void debug(String message) {
        writeToFile("[调试] " + message);
    }

    private void writeToFile(String message) {
        // 文件写入逻辑
        System.out.println("写入到 " + filename + ": " + message);
    }
}

class NullLogger implements Logger {
    @Override
    public void log(String message) { /* 不做任何事 */ }

    @Override
    public void error(String message) { /* 不做任何事 */ }

    @Override
    public void debug(String message) { /* 不做任何事 */ }
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

// 使用示例
public class LoggerDemo {
    public static void main(String[] args) {
        Logger consoleLogger = Logger.console();
        Logger fileLogger = Logger.file("app.log");
        Logger composite = Logger.composite(consoleLogger, fileLogger);

        composite.log("应用程序已启动");
        composite.error("发生错误");
    }
}
```

## 私有方法

Java 9 在接口中引入了私有方法，以减少默认方法之间的代码重复。

```java
public interface DataValidator {
    // 抽象方法
    boolean validate(String data);

    // 共享通用逻辑的默认方法
    default boolean validateEmail(String email) {
        if (!checkNotEmpty(email, "邮箱")) {
            return false;
        }
        return email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }

    default boolean validatePhone(String phone) {
        if (!checkNotEmpty(phone, "电话")) {
            return false;
        }
        return phone.matches("^\\+?[1-9]\\d{1,14}$");
    }

    default boolean validateUsername(String username) {
        if (!checkNotEmpty(username, "用户名")) {
            return false;
        }
        if (!checkLength(username, 3, 20, "用户名")) {
            return false;
        }
        return username.matches("^[a-zA-Z0-9_]+$");
    }

    default boolean validatePassword(String password) {
        if (!checkNotEmpty(password, "密码")) {
            return false;
        }
        if (!checkLength(password, 8, 50, "密码")) {
            return false;
        }
        return checkPasswordStrength(password);
    }

    // 私有方法 - 共享验证逻辑
    private boolean checkNotEmpty(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            logValidationError(fieldName + " 不能为空");
            return false;
        }
        return true;
    }

    // 私有方法 - 共享长度验证
    private boolean checkLength(String value, int min, int max, String fieldName) {
        if (value.length() < min || value.length() > max) {
            logValidationError(fieldName + " 必须在 " + min + " 到 " + max + " 个字符之间");
            return false;
        }
        return true;
    }

    // 私有方法 - 密码强度检查
    private boolean checkPasswordStrength(String password) {
        boolean hasUppercase = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLowercase = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));

        if (!(hasUppercase && hasLowercase && hasDigit && hasSpecial)) {
            logValidationError("密码必须包含大写字母、小写字母、数字和特殊字符");
            return false;
        }
        return true;
    }

    // 私有静态方法 - 可以从静态和非静态上下文调用
    private static void logValidationError(String message) {
        System.out.println("验证错误: " + message);
    }
}

// 实现
public class UserValidator implements DataValidator {
    @Override
    public boolean validate(String data) {
        // 对整个用户数据的自定义验证
        return data != null && !data.isEmpty();
    }
}

// 使用示例
public class PrivateMethodDemo {
    public static void main(String[] args) {
        DataValidator validator = new UserValidator();

        System.out.println("邮箱验证:");
        System.out.println(validator.validateEmail("user@example.com")); // true
        System.out.println(validator.validateEmail("invalid-email"));    // false

        System.out.println("\n电话验证:");
        System.out.println(validator.validatePhone("+1234567890")); // true
        System.out.println(validator.validatePhone("abc"));          // false

        System.out.println("\n用户名验证:");
        System.out.println(validator.validateUsername("john_doe")); // true
        System.out.println(validator.validateUsername("ab"));       // false（太短）

        System.out.println("\n密码验证:");
        System.out.println(validator.validatePassword("Secure@123")); // true
        System.out.println(validator.validatePassword("weak"));       // false
    }
}
```

## 函数式接口

函数式接口只有一个抽象方法，可以与 Lambda 表达式一起使用。`@FunctionalInterface` 注解确保编译时检查。

### 定义函数式接口

```java
@FunctionalInterface
public interface Transformer<T, R> {
    R transform(T input);

    // 可以有默认方法
    default <V> Transformer<T, V> andThen(Transformer<? super R, ? extends V> after) {
        Objects.requireNonNull(after);
        return (T t) -> after.transform(transform(t));
    }

    // 可以有静态方法
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

### 使用 Lambda 表达式与函数式接口

```java
public class FunctionalInterfaceDemo {
    public static void main(String[] args) {
        // Lambda 表达式
        Transformer<String, Integer> stringLength = s -> s.length();
        System.out.println(stringLength.transform("Hello")); // 5

        // 方法引用
        Transformer<String, String> toUpperCase = String::toUpperCase;
        System.out.println(toUpperCase.transform("hello")); // "HELLO"

        // 链接转换器
        Transformer<String, Integer> lengthOfUppercase =
            toUpperCase.andThen(stringLength);
        System.out.println(lengthOfUppercase.transform("hello")); // 5

        // 谓词
        Predicate<Integer> isPositive = n -> n > 0;
        Predicate<Integer> isEven = n -> n % 2 == 0;
        Predicate<Integer> isPositiveAndEven = isPositive.and(isEven);

        System.out.println(isPositiveAndEven.test(4));  // true
        System.out.println(isPositiveAndEven.test(-4)); // false
        System.out.println(isPositiveAndEven.test(3));  // false

        // BiFunction
        BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
        BiFunction<Integer, Integer, String> addAndFormat =
            add.andThen(result -> "结果: " + result);
        System.out.println(addAndFormat.apply(5, 3)); // "结果: 8"
    }
}
```

### 内置函数式接口

Java 在 `java.util.function` 中提供了许多内置函数式接口：

```java
import java.util.function.*;

public class BuiltInFunctionalInterfaces {
    public static void main(String[] args) {
        // Function<T, R> - 接受 T，返回 R
        Function<String, Integer> length = String::length;
        System.out.println(length.apply("Hello")); // 5

        // Consumer<T> - 接受 T，无返回值
        Consumer<String> printer = System.out::println;
        printer.accept("Hello World");

        // Supplier<T> - 无参数，返回 T
        Supplier<Double> randomSupplier = Math::random;
        System.out.println(randomSupplier.get());

        // Predicate<T> - 接受 T，返回 boolean
        Predicate<String> isEmpty = String::isEmpty;
        System.out.println(isEmpty.test("")); // true

        // UnaryOperator<T> - Function<T, T>
        UnaryOperator<Integer> square = x -> x * x;
        System.out.println(square.apply(5)); // 25

        // BinaryOperator<T> - BiFunction<T, T, T>
        BinaryOperator<Integer> multiply = (a, b) -> a * b;
        System.out.println(multiply.apply(3, 4)); // 12

        // BiConsumer<T, U> - 接受 T 和 U，无返回值
        BiConsumer<String, Integer> printPair =
            (s, i) -> System.out.println(s + ": " + i);
        printPair.accept("年龄", 25);

        // BiPredicate<T, U> - 接受 T 和 U，返回 boolean
        BiPredicate<String, Integer> hasLength =
            (s, len) -> s.length() == len;
        System.out.println(hasLength.test("Hello", 5)); // true
    }
}
```

### 原始类型的函数式接口

```java
public class PrimitiveFunctionalInterfaces {
    public static void main(String[] args) {
        // IntFunction<R> - 接受 int，返回 R
        IntFunction<String> intToString = Integer::toString;
        System.out.println(intToString.apply(42)); // "42"

        // ToIntFunction<T> - 接受 T，返回 int
        ToIntFunction<String> parseIntFunc = Integer::parseInt;
        System.out.println(parseIntFunc.applyAsInt("100")); // 100

        // IntPredicate - 接受 int，返回 boolean
        IntPredicate isPositive = x -> x > 0;
        System.out.println(isPositive.test(5)); // true

        // IntConsumer - 接受 int，无返回值
        IntConsumer printInt = System.out::println;
        printInt.accept(42);

        // IntSupplier - 无参数，返回 int
        IntSupplier randomInt = () -> (int)(Math.random() * 100);
        System.out.println(randomInt.getAsInt());

        // IntUnaryOperator - 接受 int，返回 int
        IntUnaryOperator doubleIt = x -> x * 2;
        System.out.println(doubleIt.applyAsInt(5)); // 10

        // IntBinaryOperator - 接受两个 int，返回 int
        IntBinaryOperator max = Math::max;
        System.out.println(max.applyAsInt(5, 10)); // 10

        // long 和 double 也有类似的接口
        LongUnaryOperator longSquare = x -> x * x;
        DoubleUnaryOperator sqrt = Math::sqrt;
    }
}
```

## 标记接口

标记接口是用于标记或标签类具有某些能力的空接口。

```java
// 内置标记接口
public interface Serializable { }
public interface Cloneable { }
public interface RandomAccess { }

// 自定义标记接口
public interface Auditable {
    // 标记应该被审计的类
}

public interface Cacheable {
    // 标记可以被缓存的类
}

public interface Exportable {
    // 标记可以被导出的类
}

// 使用
public class User implements Serializable, Auditable, Cacheable {
    private String username;
    private String email;

    // 构造函数和方法...
}

// 处理标记接口
public class MarkerInterfaceProcessor {
    public void process(Object obj) {
        if (obj instanceof Auditable) {
            System.out.println("为以下类创建审计日志: " + obj.getClass().getName());
        }

        if (obj instanceof Cacheable) {
            System.out.println("添加到缓存: " + obj.getClass().getName());
        }

        if (obj instanceof Exportable) {
            System.out.println("导出: " + obj.getClass().getName());
        }
    }
}

// 现代替代方案：注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Auditable { }

@Auditable
public class Order {
    // Order 实现
}
```

## 接口 vs 抽象类

理解何时使用接口与抽象类对于良好的设计至关重要。

### 比较表

| 特性 | 接口 | 抽象类 |
|---------|-----------|----------------|
| 多重继承 | 是（实现多个） | 否（只能继承一个） |
| 构造函数 | 否 | 是 |
| 实例字段 | 否（只有常量） | 是 |
| 方法访问修饰符 | 仅 public（Java 9 之前） | 任意 |
| 方法实现 | 默认、静态、私有（Java 8/9+） | 任意 |
| 状态 | 无状态 | 可以有状态 |
| 主要用途 | 定义能力 | 在相关类之间共享代码 |

### 何时使用接口

```java
// 定义能力/行为时使用接口
public interface Printable {
    void print();
}

public interface Scannable {
    byte[] scan();
}

public interface Faxable {
    void fax(String destination);
}

// 一个类可以有多种能力
public class MultiFunctionPrinter implements Printable, Scannable, Faxable {
    @Override
    public void print() {
        System.out.println("打印文档");
    }

    @Override
    public byte[] scan() {
        System.out.println("扫描文档");
        return new byte[0];
    }

    @Override
    public void fax(String destination) {
        System.out.println("传真到 " + destination);
    }
}
```

### 何时使用抽象类

```java
// 在相关类之间共享代码时使用抽象类
public abstract class Employee {
    protected String name;
    protected String id;
    protected double baseSalary;

    public Employee(String name, String id, double baseSalary) {
        this.name = name;
        this.id = id;
        this.baseSalary = baseSalary;
    }

    // 共享实现
    public String getName() {
        return name;
    }

    public String getId() {
        return id;
    }

    // 带通用行为的模板方法
    public final void processPayroll() {
        double salary = calculateSalary();
        double tax = calculateTax(salary);
        double netPay = salary - tax;
        generatePayslip(netPay);
    }

    // 抽象方法 - 每个子类实现不同
    public abstract double calculateSalary();

    // 可以被覆盖的默认实现
    protected double calculateTax(double salary) {
        return salary * 0.2; // 20% 默认税率
    }

    private void generatePayslip(double netPay) {
        System.out.println(name + " 的工资单: ¥" + netPay);
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
        return salary * 0.15; // 合同员工：15% 税率
    }
}
```

### 结合两者

```java
// 用于能力的接口
public interface Exportable {
    byte[] export(String format);
}

// 用于共享实现的抽象类
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
        // PDF 导出逻辑
        return ("PDF: " + content).getBytes();
    }

    protected byte[] exportToCsv(String content) {
        // CSV 导出逻辑
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
        sb.append("销售报告: ").append(title).append("\n");
        sb.append("日期: ").append(generatedDate).append("\n");
        for (Sale sale : sales) {
            sb.append(sale.toString()).append("\n");
        }
        return sb.toString();
    }
}
```

## 使用接口的设计模式

### 策略模式

```java
// 策略接口
public interface PaymentStrategy {
    void pay(double amount);
    String getPaymentType();
}

// 具体策略
public class CreditCardPayment implements PaymentStrategy {
    private String cardNumber;
    private String cvv;

    public CreditCardPayment(String cardNumber, String cvv) {
        this.cardNumber = cardNumber;
        this.cvv = cvv;
    }

    @Override
    public void pay(double amount) {
        System.out.println("使用尾号为 " +
            cardNumber.substring(cardNumber.length() - 4) + " 的信用卡支付 ¥" + amount);
    }

    @Override
    public String getPaymentType() {
        return "信用卡";
    }
}

public class PayPalPayment implements PaymentStrategy {
    private String email;

    public PayPalPayment(String email) {
        this.email = email;
    }

    @Override
    public void pay(double amount) {
        System.out.println("使用 PayPal 账户 " + email + " 支付 ¥" + amount);
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
        System.out.println("从钱包 " +
            walletAddress.substring(0, 8) + "... 支付价值 ¥" + amount + " 的加密货币");
    }

    @Override
    public String getPaymentType() {
        return "加密货币";
    }
}

// 上下文
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
        System.out.println("总计: ¥" + total);
        System.out.println("支付方式: " + paymentStrategy.getPaymentType());
        paymentStrategy.pay(total);
    }
}

// 使用示例
public class StrategyPatternDemo {
    public static void main(String[] args) {
        ShoppingCart cart = new ShoppingCart();
        cart.addItem(new Item("笔记本电脑", 999.99));
        cart.addItem(new Item("鼠标", 29.99));

        // 使用信用卡支付
        cart.setPaymentStrategy(new CreditCardPayment("1234567890123456", "123"));
        cart.checkout();

        System.out.println("---");

        // 使用 PayPal 支付
        cart.setPaymentStrategy(new PayPalPayment("user@example.com"));
        cart.checkout();
    }
}
```

### 观察者模式

```java
// 观察者接口
public interface Observer {
    void update(String event, Object data);
}

// 主题接口
public interface Subject {
    void registerObserver(Observer observer);
    void removeObserver(Observer observer);
    void notifyObservers(String event, Object data);
}

// 具体主题
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

// 具体观察者
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
            System.out.println(name + " 收到: " + stockData.get("symbol") +
                " 价格从 ¥" + stockData.get("oldPrice") +
                " 变为 ¥" + stockData.get("newPrice"));
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
                System.out.println("警报: " + stockData.get("symbol") +
                    " 变动 ¥" + change + "（超过阈值 ¥" + threshold + "）");
            }
        }
    }
}

// 使用示例
public class ObserverPatternDemo {
    public static void main(String[] args) {
        StockMarket market = new StockMarket();

        Observer trader1 = new StockTrader("张三");
        Observer trader2 = new StockTrader("李四");
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

### 工厂模式

```java
// 产品接口
public interface Document {
    void open();
    void save();
    void close();
    String getType();
}

// 具体产品
public class PDFDocument implements Document {
    private String filename;

    public PDFDocument(String filename) {
        this.filename = filename;
    }

    @Override
    public void open() {
        System.out.println("打开 PDF 文档: " + filename);
    }

    @Override
    public void save() {
        System.out.println("保存 PDF 文档: " + filename);
    }

    @Override
    public void close() {
        System.out.println("关闭 PDF 文档: " + filename);
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
        System.out.println("打开 Word 文档: " + filename);
    }

    @Override
    public void save() {
        System.out.println("保存 Word 文档: " + filename);
    }

    @Override
    public void close() {
        System.out.println("关闭 Word 文档: " + filename);
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
        System.out.println("打开电子表格: " + filename);
    }

    @Override
    public void save() {
        System.out.println("保存电子表格: " + filename);
    }

    @Override
    public void close() {
        System.out.println("关闭电子表格: " + filename);
    }

    @Override
    public String getType() {
        return "电子表格";
    }
}

// 工厂接口
public interface DocumentFactory {
    Document createDocument(String filename);

    // 使用接口的静态工厂方法
    static DocumentFactory getFactory(String type) {
        switch (type.toLowerCase()) {
            case "pdf":
                return PDFDocument::new;
            case "word":
                return WordDocument::new;
            case "spreadsheet":
                return SpreadsheetDocument::new;
            default:
                throw new IllegalArgumentException("未知文档类型: " + type);
        }
    }
}

// 使用示例
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

### 使用接口的依赖注入

```java
// 服务接口
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

// 实现
public class JpaUserRepository implements UserRepository {
    @Override
    public User findById(Long id) {
        System.out.println("使用 JPA 通过 ID 查找用户: " + id);
        return new User(id, "user@example.com");
    }

    @Override
    public User findByEmail(String email) {
        System.out.println("使用 JPA 通过邮箱查找用户: " + email);
        return new User(1L, email);
    }

    @Override
    public void save(User user) {
        System.out.println("使用 JPA 保存用户: " + user.getEmail());
    }

    @Override
    public void delete(Long id) {
        System.out.println("使用 JPA 删除用户: " + id);
    }

    @Override
    public List<User> findAll() {
        System.out.println("使用 JPA 查找所有用户");
        return List.of(new User(1L, "user1@example.com"), new User(2L, "user2@example.com"));
    }
}

public class SmtpEmailService implements EmailService {
    @Override
    public void sendEmail(String to, String subject, String body) {
        System.out.println("通过 SMTP 发送邮件到: " + to);
        System.out.println("主题: " + subject);
    }
}

public class BCryptPasswordEncoder implements PasswordEncoder {
    @Override
    public String encode(String password) {
        // 简化实现 - 实际应使用 BCrypt
        return "encoded_" + password;
    }

    @Override
    public boolean matches(String rawPassword, String encodedPassword) {
        return encodedPassword.equals("encoded_" + rawPassword);
    }
}

// 使用依赖注入的服务
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // 构造函数注入 - 依赖是接口
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
        emailService.sendEmail(email, "欢迎!", "感谢您的注册。");
    }

    public boolean login(String email, String password) {
        User user = userRepository.findByEmail(email);
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            System.out.println("登录成功: " + email);
            return true;
        }
        System.out.println("登录失败: " + email);
        return false;
    }
}

// 使用真实实现
public class DependencyInjectionDemo {
    public static void main(String[] args) {
        // 创建实现
        UserRepository userRepo = new JpaUserRepository();
        EmailService emailService = new SmtpEmailService();
        PasswordEncoder encoder = new BCryptPasswordEncoder();

        // 注入依赖
        UserService userService = new UserService(userRepo, emailService, encoder);

        // 使用服务
        userService.registerUser("newuser@example.com", "password123");
    }
}

// 用于测试 - 可以注入模拟实现
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

## 最佳实践

### 面向接口编程，而非实现

```java
// 不好 - 面向实现编程
ArrayList<String> list = new ArrayList<>();

// 好 - 面向接口编程
List<String> list = new ArrayList<>();

// 更好 - 最大灵活性
Collection<String> collection = new ArrayList<>();
```

### 遵循接口隔离原则

```java
// 不好 - 臃肿接口
public interface Worker {
    void work();
    void eat();
    void sleep();
    void attendMeeting();
    void writeReport();
}

// 好 - 隔离的接口
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

// 类只实现需要的接口
public class Robot implements Workable {
    @Override
    public void work() {
        System.out.println("机器人工作中");
    }
    // 机器人不需要吃饭、睡觉或开会
}

public class Human implements Workable, Feedable, Restable, Meetable {
    @Override
    public void work() { System.out.println("人类工作中"); }

    @Override
    public void eat() { System.out.println("人类吃饭中"); }

    @Override
    public void sleep() { System.out.println("人类睡觉中"); }

    @Override
    public void attendMeeting() { System.out.println("人类开会中"); }
}
```

### 谨慎使用默认方法

```java
// 默认方法的好用法 - 提供可选的便捷方法
public interface Collection<E> {
    void add(E element);
    int size();

    // 带合理默认值的便捷方法
    default boolean isEmpty() {
        return size() == 0;
    }

    // 大多数实现会使用的复杂默认方法
    default void addAll(Collection<? extends E> other) {
        for (E element : other) {
            add(element);
        }
    }
}

// 不好 - 改变预期行为的默认方法
public interface Repository<T> {
    T findById(Long id);

    // 不好 - 默认值可能掩盖实现bug
    default T findByIdOrNull(Long id) {
        try {
            return findById(id);
        } catch (Exception e) {
            return null;  // 静默吞掉异常
        }
    }
}
```

### 清晰地记录接口契约

```java
/**
 * 表示处理金融交易的支付处理器。
 *
 * <p>实现必须是线程安全的并处理并发交易。
 * 所有货币金额以最小货币单位表示（例如，美元的美分）。
 *
 * @since 1.0
 */
public interface PaymentProcessor {

    /**
     * 处理支付交易。
     *
     * @param amount 最小货币单位的支付金额（必须为正数）
     * @param currency ISO 4217 货币代码（例如，"USD"、"EUR"）
     * @param customerId 客户的唯一标识符
     * @return 包含交易ID和状态的交易结果
     * @throws IllegalArgumentException 如果金额不是正数或货币无效
     * @throws PaymentException 如果支付处理失败
     */
    TransactionResult processPayment(long amount, String currency, String customerId);

    /**
     * 退款之前处理的交易。
     *
     * @param transactionId 要退款的原始交易ID
     * @param amount 退款金额（不能超过原始金额）
     * @return 如果退款成功则返回true，否则返回false
     * @throws TransactionNotFoundException 如果未找到交易ID
     */
    boolean refund(String transactionId, long amount);
}
```

### 使用接口进行回调和事件处理

```java
// 回调接口
public interface AsyncCallback<T> {
    void onSuccess(T result);
    void onError(Exception error);

    default void onComplete() {
        // 可选的完成处理器
    }
}

// 事件监听器接口
public interface LifecycleListener {
    default void onStart() { }
    default void onStop() { }
    default void onPause() { }
    default void onResume() { }
}

// 使用
public class DataFetcher {
    public void fetchData(String url, AsyncCallback<String> callback) {
        try {
            // 模拟异步操作
            String result = performFetch(url);
            callback.onSuccess(result);
        } catch (Exception e) {
            callback.onError(e);
        } finally {
            callback.onComplete();
        }
    }

    private String performFetch(String url) {
        return "来自 " + url + " 的数据";
    }
}

// 使用函数式回调的 Lambda 用法
public class CallbackDemo {
    public static void main(String[] args) {
        DataFetcher fetcher = new DataFetcher();

        fetcher.fetchData("https://api.example.com/data", new AsyncCallback<String>() {
            @Override
            public void onSuccess(String result) {
                System.out.println("收到: " + result);
            }

            @Override
            public void onError(Exception error) {
                System.err.println("错误: " + error.getMessage());
            }
        });
    }
}
```

### 考虑密封接口（Java 17+）

```java
// 密封接口限制哪些类可以实现它
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

// 穷尽模式匹配（Java 21+）
public class SealedInterfaceDemo {
    public static String describeShape(Shape shape) {
        return switch (shape) {
            case Circle c -> "半径为 " + c.getRadius() + " 的圆";
            case Rectangle r -> r.getWidth() + "x" + r.getHeight() + " 的矩形";
            case Triangle t -> "底边为 " + t.getBase() + " 的三角形";
        };
    }
}
```

## 总结

Java 接口是构建灵活、可维护和可测试应用程序的基本工具：

1. **基本接口**：定义实现类必须遵循的契约
2. **多重实现**：启用行为的多重继承形式
3. **接口继承**：构建相关行为的层次结构
4. **默认方法**：提供可选实现并启用接口演化
5. **静态方法**：直接向接口添加工具方法
6. **私有方法**：减少默认方法中的代码重复
7. **函数式接口**：启用 Lambda 表达式和函数式编程
8. **标记接口**：用关于其能力的元数据标记类
9. **设计模式**：驱动策略、观察者和工厂等常见模式

**关键要点：**

- 面向接口编程，而非实现
- 使用接口定义类能做什么（能力）
- 遵循接口隔离原则 - 保持接口专注
- 使用默认方法进行接口演化和便捷方法
- 利用函数式接口与 Lambda 表达式编写更简洁的代码
- 当需要契约和共享实现时，将接口与抽象类结合使用
- 清晰地记录接口契约，包括前置条件和后置条件

掌握接口对于编写易于测试、扩展和维护的干净、模块化的 Java 代码至关重要。
