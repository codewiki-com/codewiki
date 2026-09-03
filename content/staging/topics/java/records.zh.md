---
title: 记录类(Records)
description: Java Records完全指南，不可变数据类与模式匹配
track: java
section: basics
difficulty: intermediate
tags:
  - Java
  - Records
  - 不可变
  - 数据类
status: imported
origin: old/src/content/docs/java/records.zh.md
divergence: 0.218
issues: []
legacy:
  category: Java
  subcategory: 语言特性
  order: 14
  lastUpdated: 2026-01-07
---

Java Records 是 Java 14 引入的预览特性，在 Java 16 中正式发布。Record 是一种特殊的类，专门用于创建不可变的数据载体类（data carrier classes）。它通过简洁的语法自动生成构造器、访问器、`equals()`、`hashCode()` 和 `toString()` 方法，大幅减少样板代码。

## 为什么需要 Records

在 Records 出现之前，创建一个简单的不可变数据类需要大量样板代码：

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

使用 Record，上述 50 多行代码可以简化为一行：

```java
public record Person(String name, int age, String email) {}
```

这一行代码自动生成了：
- 私有 final 字段
- 规范构造器（canonical constructor）
- 每个组件的访问器方法
- 基于所有组件的 `equals()` 方法
- 基于所有组件的 `hashCode()` 方法
- 包含所有组件的 `toString()` 方法

## Record 基本语法

### 定义 Record

Record 使用 `record` 关键字定义，组件（components）在类名后的括号中声明：

```java
// 基本 Record
public record Point(int x, int y) {}

// 带有引用类型的 Record
public record Book(String title, String author, double price) {}

// 泛型 Record
public record Pair<K, V>(K key, V value) {}

// 嵌套 Record
public record Line(Point start, Point end) {}
```

### 创建和使用 Record 实例

```java
// 创建实例
Point point = new Point(10, 20);
Book book = new Book("Effective Java", "Joshua Bloch", 45.99);
Pair<String, Integer> pair = new Pair<>("age", 25);

// 访问组件（注意：不是 getXxx，而是直接用组件名）
System.out.println(point.x());      // 10
System.out.println(point.y());      // 20
System.out.println(book.title());   // Effective Java
System.out.println(book.author());  // Joshua Bloch

// 自动生成的 toString()
System.out.println(point);  // Point[x=10, y=20]
System.out.println(book);   // Book[title=Effective Java, author=Joshua Bloch, price=45.99]

// 自动生成的 equals() 和 hashCode()
Point p1 = new Point(10, 20);
Point p2 = new Point(10, 20);
System.out.println(p1.equals(p2));  // true
System.out.println(p1.hashCode() == p2.hashCode());  // true

// 可以用作 Map 的键
Map<Point, String> pointNames = new HashMap<>();
pointNames.put(new Point(0, 0), "原点");
System.out.println(pointNames.get(new Point(0, 0)));  // 原点
```

### Record 的本质

Record 本质上是一个特殊的 final 类，隐式继承自 `java.lang.Record`：

```java
// 这个 Record 定义
public record Point(int x, int y) {}

// 大致等价于（编译器生成）
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
    public boolean equals(Object o) { /* 基于 x 和 y 的实现 */ }

    @Override
    public int hashCode() { /* 基于 x 和 y 的实现 */ }

    @Override
    public String toString() { return "Point[x=" + x + ", y=" + y + "]"; }
}
```

## 构造器详解

Record 提供了灵活的构造器定义方式，允许在创建实例时进行验证和转换。

### 规范构造器（Canonical Constructor）

规范构造器是与 Record 组件一一对应的构造器，可以显式定义来添加验证逻辑：

```java
public record Temperature(double celsius) {
    // 显式规范构造器
    public Temperature(double celsius) {
        if (celsius < -273.15) {
            throw new IllegalArgumentException(
                "温度不能低于绝对零度: " + celsius + "°C");
        }
        this.celsius = celsius;
    }

    // 辅助方法
    public double fahrenheit() {
        return celsius * 9 / 5 + 32;
    }

    public double kelvin() {
        return celsius + 273.15;
    }
}

// 使用
Temperature temp = new Temperature(25.0);
System.out.println(temp.celsius());    // 25.0
System.out.println(temp.fahrenheit()); // 77.0
System.out.println(temp.kelvin());     // 298.15

// Temperature invalid = new Temperature(-300);  // 抛出 IllegalArgumentException
```

### 紧凑构造器（Compact Constructor）

紧凑构造器是一种简化的语法，省略了参数列表和字段赋值，字段赋值由编译器自动完成：

```java
public record Email(String address) {
    // 紧凑构造器：无参数列表，无显式赋值
    public Email {
        // 验证
        if (address == null || address.isBlank()) {
            throw new IllegalArgumentException("邮箱地址不能为空");
        }
        if (!address.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            throw new IllegalArgumentException("无效的邮箱格式: " + address);
        }
        // 规范化处理
        address = address.toLowerCase().trim();
        // 编译器自动添加: this.address = address;
    }
}

// 使用
Email email = new Email("  John.Doe@Example.COM  ");
System.out.println(email.address());  // john.doe@example.com
```

紧凑构造器的优势：
1. 代码更简洁，无需重复参数声明
2. 可以修改参数值，修改后的值将被赋给字段
3. 编译器自动在构造器末尾添加字段赋值语句

### 自定义构造器

可以添加额外的构造器，但必须委托给规范构造器：

```java
public record Rectangle(double width, double height) {

    // 紧凑构造器进行验证
    public Rectangle {
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("宽度和高度必须为正数");
        }
    }

    // 创建正方形的便捷构造器
    public Rectangle(double side) {
        this(side, side);  // 必须委托给规范构造器
    }

    // 从对角线坐标创建
    public Rectangle(Point topLeft, Point bottomRight) {
        this(
            Math.abs(bottomRight.x() - topLeft.x()),
            Math.abs(bottomRight.y() - topLeft.y())
        );
    }

    // 实例方法
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

// 使用
Rectangle rect1 = new Rectangle(10, 20);
Rectangle square = new Rectangle(15);          // 正方形
Rectangle rect2 = new Rectangle(
    new Point(0, 0),
    new Point(100, 50)
);

System.out.println(rect1.area());      // 200.0
System.out.println(square.isSquare()); // true
System.out.println(rect2.width());     // 100.0
```

### 复杂验证与转换示例

```java
public record Money(BigDecimal amount, Currency currency) {

    public Money {
        // 空值检查
        Objects.requireNonNull(amount, "金额不能为空");
        Objects.requireNonNull(currency, "货币不能为空");

        // 金额验证
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("金额不能为负数: " + amount);
        }

        // 规范化：设置小数位数
        amount = amount.setScale(
            currency.getDefaultFractionDigits(),
            RoundingMode.HALF_UP
        );
    }

    // 从字符串创建
    public Money(String amount, String currencyCode) {
        this(new BigDecimal(amount), Currency.getInstance(currencyCode));
    }

    // 货币运算
    public Money add(Money other) {
        validateSameCurrency(other);
        return new Money(amount.add(other.amount), currency);
    }

    public Money subtract(Money other) {
        validateSameCurrency(other);
        BigDecimal result = amount.subtract(other.amount);
        if (result.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("结果不能为负数");
        }
        return new Money(result, currency);
    }

    public Money multiply(int factor) {
        return new Money(amount.multiply(BigDecimal.valueOf(factor)), currency);
    }

    private void validateSameCurrency(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException(
                "货币不匹配: " + currency + " vs " + other.currency);
        }
    }

    // 格式化输出
    public String formatted() {
        NumberFormat format = NumberFormat.getCurrencyInstance();
        format.setCurrency(currency);
        return format.format(amount);
    }
}

// 使用
Money price = new Money("99.999", "CNY");
System.out.println(price.amount());    // 100.00
System.out.println(price.formatted()); // ￥100.00

Money discount = new Money("20", "CNY");
Money finalPrice = price.subtract(discount);
System.out.println(finalPrice.formatted()); // ￥80.00
```

## 访问器方法

Record 自动为每个组件生成访问器方法，方法名与组件名相同（不是 `getXxx` 模式）。

### 默认访问器

```java
public record User(String username, String email, LocalDateTime createdAt) {}

User user = new User("zhangsan", "zhangsan@example.com", LocalDateTime.now());

// 访问器方法名与组件名相同
String name = user.username();
String email = user.email();
LocalDateTime created = user.createdAt();
```

### 重写访问器方法

可以重写访问器方法来添加额外逻辑，如防御性拷贝：

```java
public record MutableContainer(List<String> items, Date timestamp) {

    // 紧凑构造器进行防御性拷贝
    public MutableContainer {
        // 创建不可变副本
        items = List.copyOf(items);
        timestamp = new Date(timestamp.getTime());
    }

    // 重写访问器以返回防御性拷贝
    @Override
    public List<String> items() {
        return items;  // 已经是不可变的
    }

    @Override
    public Date timestamp() {
        return new Date(timestamp.getTime());  // 返回副本
    }
}

// 使用
List<String> originalList = new ArrayList<>(List.of("A", "B"));
Date originalDate = new Date();

MutableContainer container = new MutableContainer(originalList, originalDate);

// 修改原始对象不影响 Record
originalList.add("C");
originalDate.setTime(0);

System.out.println(container.items());  // [A, B]
System.out.println(container.timestamp().getTime() != 0);  // true

// 无法修改获取的列表
// container.items().add("D");  // 抛出 UnsupportedOperationException
```

### 访问器与注解

可以在组件上添加注解，这些注解会传播到对应的字段、构造器参数和访问器方法：

```java
public record Product(
    @NotNull @Size(min = 1, max = 100) String name,
    @Positive BigDecimal price,
    @NotNull Category category
) {}

// 注解会应用到：
// 1. 对应的私有字段
// 2. 规范构造器的参数
// 3. 访问器方法
```

## 自定义方法与静态成员

Record 可以包含实例方法、静态方法、静态字段和静态初始化块。

### 实例方法

```java
public record Circle(double radius) {

    public Circle {
        if (radius <= 0) {
            throw new IllegalArgumentException("半径必须为正数");
        }
    }

    // 计算面积
    public double area() {
        return Math.PI * radius * radius;
    }

    // 计算周长
    public double circumference() {
        return 2 * Math.PI * radius;
    }

    // 计算直径
    public double diameter() {
        return 2 * radius;
    }

    // 判断是否包含某点
    public boolean contains(Point point) {
        double distance = Math.sqrt(point.x() * point.x() + point.y() * point.y());
        return distance <= radius;
    }

    // 创建更大的圆
    public Circle scale(double factor) {
        return new Circle(radius * factor);
    }
}

// 使用
Circle circle = new Circle(5.0);
System.out.println("面积: " + circle.area());         // 78.54
System.out.println("周长: " + circle.circumference()); // 31.42
System.out.println("包含原点: " + circle.contains(new Point(0, 0))); // true

Circle bigger = circle.scale(2);
System.out.println("放大后半径: " + bigger.radius()); // 10.0
```

### 静态成员

```java
public record HttpStatus(int code, String message) {

    // 静态常量
    public static final HttpStatus OK = new HttpStatus(200, "OK");
    public static final HttpStatus CREATED = new HttpStatus(201, "Created");
    public static final HttpStatus BAD_REQUEST = new HttpStatus(400, "Bad Request");
    public static final HttpStatus NOT_FOUND = new HttpStatus(404, "Not Found");
    public static final HttpStatus INTERNAL_ERROR = new HttpStatus(500, "Internal Server Error");

    // 静态工厂方法
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

    // 验证
    public HttpStatus {
        if (code < 100 || code > 599) {
            throw new IllegalArgumentException("无效的 HTTP 状态码: " + code);
        }
    }

    // 实例方法
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

// 使用
HttpStatus status = HttpStatus.of(404);
System.out.println(status);              // HttpStatus[code=404, message=Not Found]
System.out.println(status.isClientError()); // true
System.out.println(status.category());      // CLIENT_ERROR

if (status == HttpStatus.NOT_FOUND) {
    System.out.println("资源未找到");
}
```

## 实现接口

Record 可以实现一个或多个接口，但不能继承其他类（因为已经隐式继承了 `java.lang.Record`）。

### 基本接口实现

```java
// 定义接口
interface Printable {
    String toPrettyString();
}

interface Calculable {
    double calculate();
}

// Record 实现多个接口
public record Invoice(
    String id,
    String customer,
    List<LineItem> items,
    LocalDate date
) implements Printable, Calculable {

    public Invoice {
        Objects.requireNonNull(id);
        Objects.requireNonNull(customer);
        items = List.copyOf(items);  // 不可变副本
        Objects.requireNonNull(date);
    }

    @Override
    public String toPrettyString() {
        StringBuilder sb = new StringBuilder();
        sb.append("发票编号: ").append(id).append("\n");
        sb.append("客户: ").append(customer).append("\n");
        sb.append("日期: ").append(date).append("\n");
        sb.append("明细:\n");
        for (LineItem item : items) {
            sb.append("  - ").append(item.toPrettyString()).append("\n");
        }
        sb.append("总计: ").append(String.format("%.2f", calculate()));
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
            throw new IllegalArgumentException("数量必须为正数");
        }
        if (unitPrice < 0) {
            throw new IllegalArgumentException("单价不能为负数");
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

// 使用
List<LineItem> items = List.of(
    new LineItem("笔记本电脑", 2, 5999.00),
    new LineItem("无线鼠标", 3, 99.00)
);

Invoice invoice = new Invoice("INV-001", "张三", items, LocalDate.now());
System.out.println(invoice.toPrettyString());
```

### 实现 Comparable 接口

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
            throw new IllegalArgumentException("GPA 必须在 0-4.0 之间");
        }
    }

    @Override
    public int compareTo(Student other) {
        // 按 GPA 降序排列
        int gpaCompare = Double.compare(other.gpa, this.gpa);
        if (gpaCompare != 0) return gpaCompare;
        // GPA 相同则按姓名排序
        return this.name.compareTo(other.name);
    }

    // 静态比较器
    public static Comparator<Student> byName() {
        return Comparator.comparing(Student::name);
    }

    public static Comparator<Student> byGpa() {
        return Comparator.comparingDouble(Student::gpa).reversed();
    }
}

// 使用
List<Student> students = new ArrayList<>(List.of(
    new Student("001", "张三", 3.8),
    new Student("002", "李四", 3.9),
    new Student("003", "王五", 3.8)
));

Collections.sort(students);
students.forEach(System.out::println);
// Student[id=002, name=李四, gpa=3.9]
// Student[id=003, name=王五, gpa=3.8]
// Student[id=001, name=张三, gpa=3.8]
```

## 密封类型与 Records

Java 17 引入的密封类（Sealed Classes）与 Records 完美配合，可以构建类型安全的代数数据类型（ADT）。

### 密封接口与 Record 实现

```java
// 密封接口定义所有允许的实现类型
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
    double perimeter();
}

// Record 作为密封接口的实现
public record Circle(double radius) implements Shape {
    public Circle {
        if (radius <= 0) throw new IllegalArgumentException("半径必须为正数");
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
            throw new IllegalArgumentException("宽度和高度必须为正数");
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
            throw new IllegalArgumentException("边长必须为正数");
        }
        if (a + b <= c || b + c <= a || a + c <= b) {
            throw new IllegalArgumentException("不满足三角形不等式");
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

### 表达式树示例

```java
// 密封接口表示数学表达式
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
            throw new IllegalArgumentException("变量名不能为空");
        }
    }

    @Override
    public double compute(Map<String, Double> env) {
        Double val = env.get(name);
        if (val == null) {
            throw new IllegalArgumentException("未定义的变量: " + name);
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

// 使用：计算 (x + 2) * 3
Expr expr = new Mul(
    new Add(new Var("x"), new Num(2)),
    new Num(3)
);

System.out.println(expr.format());  // ((x + 2) * 3)

Map<String, Double> env = Map.of("x", 5.0);
System.out.println(expr.compute(env));  // 21.0
```

### 结果类型模式（Result Pattern）

```java
// 密封接口表示操作结果
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

    // 静态工厂方法
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

// 使用
Result<Integer> result = Result.of(() -> Integer.parseInt("42"))
    .map(n -> n * 2)
    .flatMap(n -> n > 0 ? Result.success(n) : Result.failure("必须为正数"));

if (result.isSuccess()) {
    System.out.println("结果: " + result.getOrThrow());  // 结果: 84
}
```

## 模式匹配

Java 16+ 引入的模式匹配与 Records 结合使用，提供了强大的数据解构能力。

### instanceof 模式匹配

```java
public record Point(int x, int y) {}
public record Circle(Point center, double radius) {}

public static String describe(Object obj) {
    if (obj instanceof Point p) {
        return String.format("点 (%d, %d)", p.x(), p.y());
    } else if (obj instanceof Circle c) {
        return String.format("圆心在 %s，半径 %.2f",
            describe(c.center()), c.radius());
    } else {
        return "未知对象";
    }
}

// 使用
System.out.println(describe(new Point(10, 20)));
// 点 (10, 20)

System.out.println(describe(new Circle(new Point(0, 0), 5.0)));
// 圆心在 点 (0, 0)，半径 5.00
```

### switch 表达式模式匹配（Java 21+）

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
        case Circle(double r) when r > 10 -> "大圆";
        case Circle(double r) -> "小圆";
        case Rectangle(double w, double h) when w == h -> "正方形";
        case Rectangle(double w, double h) -> "矩形";
        case Triangle t -> "三角形";
    };
}

// 使用
Shape circle = new Circle(15);
Shape rectangle = new Rectangle(10, 10);

System.out.println(calculateArea(circle));      // 706.86
System.out.println(describeShape(circle));      // 大圆
System.out.println(describeShape(rectangle));   // 正方形
```

### 嵌套模式解构（Java 21+）

```java
public record Point(int x, int y) {}
public record Line(Point start, Point end) {}
public record ColoredLine(Line line, String color) {}

public static String analyzeLine(Object obj) {
    return switch (obj) {
        // 嵌套解构：直接提取深层组件
        case Line(Point(int x1, int y1), Point(int x2, int y2)) ->
            String.format("线段从 (%d, %d) 到 (%d, %d)", x1, y1, x2, y2);

        // 更深层嵌套
        case ColoredLine(Line(Point(int x1, int y1), Point(int x2, int y2)), String color) ->
            String.format("%s 线段从 (%d, %d) 到 (%d, %d)", color, x1, y1, x2, y2);

        default -> "未知类型";
    };
}

// 使用
Line line = new Line(new Point(0, 0), new Point(3, 4));
ColoredLine coloredLine = new ColoredLine(line, "红色");

System.out.println(analyzeLine(line));
// 线段从 (0, 0) 到 (3, 4)

System.out.println(analyzeLine(coloredLine));
// 红色 线段从 (0, 0) 到 (3, 4)
```

### 守卫模式（Guarded Patterns）

```java
public record Order(String id, double amount, OrderStatus status) {}

public enum OrderStatus {
    PENDING, PAID, SHIPPED, DELIVERED, CANCELLED
}

public static String processOrder(Order order) {
    return switch (order) {
        case Order(String id, double amt, OrderStatus s) when amt > 10000 && s == OrderStatus.PENDING ->
            "大额订单待处理: " + id;

        case Order(String id, double amt, OrderStatus s) when amt > 10000 ->
            "大额订单 " + id + " 状态: " + s;

        case Order(String id, _, OrderStatus.CANCELLED) ->
            "已取消订单: " + id;

        case Order(String id, _, OrderStatus.DELIVERED) ->
            "已完成订单: " + id;

        case Order(String id, double amt, _) ->
            String.format("普通订单 %s，金额 %.2f", id, amt);
    };
}

// 使用
Order bigOrder = new Order("ORD-001", 15000, OrderStatus.PENDING);
Order cancelled = new Order("ORD-002", 500, OrderStatus.CANCELLED);

System.out.println(processOrder(bigOrder));   // 大额订单待处理: ORD-001
System.out.println(processOrder(cancelled));  // 已取消订单: ORD-002
```

## Record 与集合

Record 天然适合用于集合操作，尤其是与 Stream API 结合。

### 作为集合元素

```java
public record Employee(String id, String name, String department, double salary) {}

List<Employee> employees = List.of(
    new Employee("E001", "张三", "技术部", 15000),
    new Employee("E002", "李四", "技术部", 18000),
    new Employee("E003", "王五", "销售部", 12000),
    new Employee("E004", "赵六", "销售部", 14000),
    new Employee("E005", "钱七", "技术部", 20000)
);

// 按部门分组
Map<String, List<Employee>> byDepartment = employees.stream()
    .collect(Collectors.groupingBy(Employee::department));

// 每个部门的平均工资
Map<String, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::department,
        Collectors.averagingDouble(Employee::salary)
    ));

// 工资最高的员工
Optional<Employee> highest = employees.stream()
    .max(Comparator.comparingDouble(Employee::salary));

// 薪资超过 15000 的员工姓名
List<String> highEarners = employees.stream()
    .filter(e -> e.salary() > 15000)
    .map(Employee::name)
    .toList();

System.out.println("部门分组: " + byDepartment);
System.out.println("平均工资: " + avgSalaryByDept);
System.out.println("最高薪资: " + highest);
System.out.println("高收入者: " + highEarners);
```

### 作为 Map 的键

由于 Record 自动生成正确的 `equals()` 和 `hashCode()`，非常适合作为 Map 的键：

```java
public record Coordinate(int row, int col) {}

// 游戏棋盘
Map<Coordinate, String> board = new HashMap<>();
board.put(new Coordinate(0, 0), "车");
board.put(new Coordinate(0, 4), "王");
board.put(new Coordinate(7, 0), "车");

// 查找
String piece = board.get(new Coordinate(0, 0));  // "车"

// 缓存示例
public record CacheKey(String userId, String resourceType, String resourceId) {}

Map<CacheKey, Object> cache = new ConcurrentHashMap<>();
cache.put(new CacheKey("user1", "product", "prod123"), productData);
```

### 复杂数据转换

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

// 按类别汇总
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

## 序列化与 JSON

Record 天然支持序列化，并且与常用的 JSON 库良好集成。

### Java 序列化

```java
public record User(String name, int age) implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;
}

// 序列化
User user = new User("张三", 25);
try (ObjectOutputStream oos = new ObjectOutputStream(
        new FileOutputStream("user.ser"))) {
    oos.writeObject(user);
}

// 反序列化
try (ObjectInputStream ois = new ObjectInputStream(
        new FileInputStream("user.ser"))) {
    User loaded = (User) ois.readObject();
    System.out.println(loaded);  // User[name=张三, age=25]
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

// 序列化为 JSON
Event event = new Event(
    "evt-001",
    "用户登录",
    LocalDateTime.now(),
    List.of("安全", "审计")
);

String json = mapper.writeValueAsString(event);
System.out.println(json);
// {"id":"evt-001","name":"用户登录","timestamp":"2024-01-15T10:30:00","tags":["安全","审计"]}

// 从 JSON 反序列化
Event deserialized = mapper.readValue(json, Event.class);
System.out.println(deserialized.name());  // 用户登录
```

### Gson

```java
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public record Product(String name, double price, boolean inStock) {}

Gson gson = new GsonBuilder().setPrettyPrinting().create();

Product product = new Product("笔记本电脑", 5999.00, true);

// 序列化
String json = gson.toJson(product);
System.out.println(json);
/*
{
  "name": "笔记本电脑",
  "price": 5999.0,
  "inStock": true
}
*/

// 反序列化
Product fromJson = gson.fromJson(json, Product.class);
System.out.println(fromJson.name());  // 笔记本电脑
```

## Record 的限制

理解 Record 的限制有助于正确使用它们。

### 不能继承其他类

```java
// 错误：Record 不能继承类
// public record SpecialPoint(int x, int y) extends Point {}  // 编译错误

// 正确：可以实现接口
public record Point(int x, int y) implements Serializable, Comparable<Point> {
    @Override
    public int compareTo(Point other) {
        int result = Integer.compare(this.x, other.x);
        return result != 0 ? result : Integer.compare(this.y, other.y);
    }
}
```

### 不能声明额外的实例字段

```java
// 错误：不能声明实例字段
public record Counter(int value) {
    // private int additionalField;  // 编译错误
}

// 正确：可以通过方法派生值
public record Counter(int value) {
    public int doubled() {
        return value * 2;
    }

    public boolean isPositive() {
        return value > 0;
    }
}
```

### 隐式 final，不能被继承

```java
// 错误：Record 是隐式 final 的
// public record BaseRecord(String name) {}
// public record ExtendedRecord(String name, int age) extends BaseRecord {}  // 编译错误

// 正确：使用组合而非继承
public record Address(String street, String city) {}
public record Person(String name, Address address) {}  // 组合
```

### 不能是抽象的

```java
// 错误：Record 不能是抽象的
// public abstract record Shape(String name) {}  // 编译错误

// 正确：使用密封接口
public sealed interface Shape permits Circle, Rectangle {}
public record Circle(double radius) implements Shape {}
public record Rectangle(double width, double height) implements Shape {}
```

### 组件不能是 var 类型

```java
// 错误：组件不能使用 var
// public record Point(var x, var y) {}  // 编译错误

// 正确：必须显式声明类型
public record Point(int x, int y) {}
```

## 最佳实践

### 保持 Record 简单纯粹

Record 应该专注于存储数据，避免添加过多业务逻辑：

```java
// 好：简单的数据载体
public record UserDTO(String id, String username, String email) {}

// 不好：包含过多业务逻辑（应该放在服务类中）
public record User(String id, String username, String email) {
    public void sendEmail(String subject, String body) { /* ... */ }
    public void updateDatabase() { /* ... */ }
    public void validatePermissions() { /* ... */ }
}
```

### 在紧凑构造器中进行验证

```java
public record Age(int value) {
    public Age {
        if (value < 0 || value > 150) {
            throw new IllegalArgumentException(
                "年龄必须在 0-150 之间: " + value);
        }
    }
}

public record NonEmptyList<T>(List<T> items) {
    public NonEmptyList {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("列表不能为空");
        }
        items = List.copyOf(items);  // 防御性拷贝
    }
}
```

### 使用静态工厂方法

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
                name + " 必须在 0-255 之间: " + value);
        }
    }

    // 静态工厂方法
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

    // 预定义颜色
    public static final Color RED = new Color(255, 0, 0);
    public static final Color GREEN = new Color(0, 255, 0);
    public static final Color BLUE = new Color(0, 0, 255);
    public static final Color WHITE = new Color(255, 255, 255);
    public static final Color BLACK = new Color(0, 0, 0);

    // 实例方法
    public String toHex() {
        return String.format("#%02X%02X%02X", red, green, blue);
    }
}

// 使用
Color color = Color.fromHex("#FF5733");
System.out.println(color);        // Color[red=255, green=87, blue=51]
System.out.println(color.toHex()); // #FF5733
```

### 确保集合的不可变性

```java
public record Order(
    String orderId,
    List<OrderItem> items,
    Map<String, String> metadata
) {
    public Order {
        Objects.requireNonNull(orderId);
        // 创建不可变副本
        items = items != null ? List.copyOf(items) : List.of();
        metadata = metadata != null ? Map.copyOf(metadata) : Map.of();
    }

    // 添加新商品（返回新 Record）
    public Order withItem(OrderItem item) {
        List<OrderItem> newItems = new ArrayList<>(items);
        newItems.add(item);
        return new Order(orderId, newItems, metadata);
    }

    // 添加元数据（返回新 Record）
    public Order withMetadata(String key, String value) {
        Map<String, String> newMetadata = new HashMap<>(metadata);
        newMetadata.put(key, value);
        return new Order(orderId, items, newMetadata);
    }
}
```

### 合理使用 with-style 方法

由于 Record 是不可变的，提供 "with" 方法来创建修改后的副本：

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

// 使用
Person person = new Person("张三", 25, "zhangsan@example.com");
Person updated = person.withAge(26).withEmail("new@example.com");

System.out.println(person);   // 原对象不变
System.out.println(updated);  // 新对象
```

## 实战案例

### API 响应封装

```java
public record ApiResponse<T>(
    int code,
    String message,
    T data,
    long timestamp
) {
    public ApiResponse {
        if (code < 0) {
            throw new IllegalArgumentException("状态码不能为负数");
        }
        if (timestamp <= 0) {
            timestamp = System.currentTimeMillis();
        }
    }

    // 成功响应
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "success", data, System.currentTimeMillis());
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(200, message, data, System.currentTimeMillis());
    }

    // 错误响应
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

    // 判断方法
    public boolean isSuccess() {
        return code >= 200 && code < 300;
    }
}

// 使用
ApiResponse<User> response = ApiResponse.success(new User("张三", 25));
if (response.isSuccess()) {
    User user = response.data();
    // 处理用户数据
}
```

### 领域事件建模

```java
// 密封接口定义所有领域事件
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

// 事件处理器使用模式匹配
public class EventProcessor {

    public void process(DomainEvent event) {
        switch (event) {
            case UserRegistered(_, _, String userId, String username, String email) -> {
                System.out.println("新用户注册: " + username);
                sendWelcomeEmail(email);
            }

            case OrderPlaced(_, _, String orderId, String userId, var products, var amount) -> {
                System.out.println("新订单: " + orderId + ", 金额: " + amount);
                notifyWarehouse(orderId, products);
            }

            case OrderShipped(_, _, String orderId, String tracking, String carrier) -> {
                System.out.println("订单发货: " + orderId);
                notifyCustomer(orderId, tracking, carrier);
            }

            case UserUpdated(_, _, String userId, var changes) -> {
                System.out.println("用户更新: " + userId);
                auditChanges(userId, changes);
            }

            case PaymentReceived(_, _, String paymentId, String orderId, var amount, _) -> {
                System.out.println("收到付款: " + paymentId + ", 金额: " + amount);
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

### 配置管理

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
        // 默认值处理
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

        // 验证
        Objects.requireNonNull(database, "数据库名不能为空");
        Objects.requireNonNull(username, "用户名不能为空");
        Objects.requireNonNull(password, "密码不能为空");
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

    // JDBC URL 生成
    public String jdbcUrl() {
        String protocol = ssl ? "jdbc:postgresql" : "jdbc:postgresql";
        return String.format("%s://%s:%d/%s%s",
            protocol, host, port, database,
            ssl ? "?ssl=true" : "");
    }
}

// 使用
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

## 总结

Java Records 是现代 Java 开发中不可或缺的特性，它提供了：

- **简洁性**：一行代码替代数十行样板代码
- **不可变性**：天然线程安全，适合函数式编程
- **透明性**：清晰表达数据载体的意图
- **模式匹配**：与 Java 新特性完美集成
- **类型安全**：编译时检查，减少运行时错误

Records 特别适用于：
- 数据传输对象（DTO）
- API 请求/响应对象
- 领域事件和值对象
- 配置对象
- 不可变数据结构
- 与密封类型结合构建代数数据类型

通过合理使用 Records，可以编写出更简洁、更安全、更易维护的 Java 代码。随着 Java 语言的持续演进，Records 与模式匹配的结合将变得越来越强大，是每个 Java 开发者都应该掌握的核心技能。
