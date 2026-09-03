---
title: Java 17 LTS 新特性完全指南
description: 深入剖析Java 17 LTS核心特性：密封类、模式匹配、记录类、文本块与Switch表达式
track: java
section: basics
difficulty: intermediate
tags:
  - Java
  - Java 17
  - LTS
  - Sealed Classes
  - Pattern Matching
  - Records
  - Text Blocks
  - Switch Expressions
status: imported
origin: old/src/content/docs/java/java17-features.zh.md
divergence: 0.418
issues:
  - divergent
legacy:
  category: Java
  subcategory: 语言特性
  order: 15
  lastUpdated: 2026-01-07
---

Java 17 是继 Java 11 之后的又一个长期支持版本（LTS），于 2021 年 9 月正式发布。它汇集了 Java 12 到 Java 17 期间引入的众多重要特性，是企业级应用升级的理想目标版本。本文将深入剖析 Java 17 中最重要的五大语言特性：密封类（Sealed Classes）、模式匹配（Pattern Matching for instanceof）、记录类（Records）、文本块（Text Blocks）和 Switch 表达式（Switch Expressions）。

## 概念解释

### Java 版本演进与 LTS 策略

自 Java 9 起，Oracle 采用了每六个月发布一个新版本的快速发布节奏，其中每三年发布一个长期支持（LTS）版本。LTS 版本会获得至少八年的支持周期，是企业生产环境的首选。

| LTS 版本 | 发布时间 | 主要特性 |
|---------|---------|---------|
| Java 8  | 2014年3月 | Lambda、Stream API、Optional |
| Java 11 | 2018年9月 | var、HTTP Client、模块化成熟 |
| Java 17 | 2021年9月 | Sealed Classes、Records、Pattern Matching |
| Java 21 | 2023年9月 | Virtual Threads、Record Patterns |

### 为什么选择 Java 17

Java 17 作为 LTS 版本，具有以下优势：

1. **长期支持**：获得 Oracle 和主流 JDK 供应商的长期维护支持
2. **特性成熟**：汇集了多个版本预览后正式发布的稳定特性
3. **性能提升**：包含大量 JVM 性能优化和垃圾收集器改进
4. **生态兼容**：Spring Boot 3.x、Jakarta EE 10 等主流框架要求 Java 17+
5. **安全增强**：移除了不安全的 API，增强了安全默认配置

### Java 17 核心新特性概览

Java 17 引入的五大核心语言特性相互配合，共同推动 Java 向更现代、更安全、更简洁的方向发展：

- **密封类（Sealed Classes）**：限制类的继承层次，增强类型安全
- **模式匹配（Pattern Matching for instanceof）**：简化类型检查和转换
- **记录类（Records）**：简洁的不可变数据类定义
- **文本块（Text Blocks）**：多行字符串的优雅表示
- **Switch 表达式**：增强的 switch 语句，支持表达式形式

## 核心原理

### 密封类（Sealed Classes）的设计原理

密封类通过 `sealed`、`permits`、`non-sealed` 和 `final` 关键字控制继承层次结构。

**类层次约束机制**：

```
sealed interface Shape
    ├── Circle (final)        → 不可再继承
    ├── Rectangle (final)     → 不可再继承
    └── Polygon (non-sealed)  → 开放继承
            └── Triangle
            └── Pentagon
            └── ... 任意子类
```

**编译器穷尽性检查**：当密封类用于 switch 表达式时，编译器可以验证是否覆盖了所有可能的子类型，无需 default 分支。

### 模式匹配的类型流分析

模式匹配基于类型流分析（Type Flow Analysis）技术，在 instanceof 检查为 true 的分支中，自动将变量绑定为目标类型。

**传统方式 vs 模式匹配**：

```java
// 传统方式：两步操作
if (obj instanceof String) {
    String s = (String) obj;  // 需要显式转换
    System.out.println(s.length());
}

// 模式匹配：一步完成
if (obj instanceof String s) {  // 类型检查 + 变量绑定
    System.out.println(s.length());  // s 已是 String 类型
}
```

**作用域规则**：模式变量只在类型检查为真的作用域内有效。

### 记录类的编译器魔法

Record 类通过编译器自动生成以下成员：

```java
public record Point(int x, int y) {}

// 编译器自动生成：
// 1. private final 字段：x, y
// 2. 规范构造器：public Point(int x, int y)
// 3. 访问器方法：public int x(), public int y()
// 4. equals(Object o)：基于所有组件的值比较
// 5. hashCode()：基于所有组件的哈希计算
// 6. toString()：返回 "Point[x=..., y=...]"
```

### 文本块的处理流程

文本块在编译时经过三个处理阶段：

1. **行终止符规范化**：所有行终止符转换为 LF（\n）
2. **偶发空白移除**：移除每行共同的前导空白
3. **转义序列解释**：处理转义字符

```java
String html = """
              <html>
                  <body>
                      <p>Hello</p>
                  </body>
              </html>
              """;
// 结闭定界符位置决定偶发空白的移除量
```

### Switch 表达式的求值语义

Switch 表达式具有以下特性：

- **表达式语义**：switch 可以返回值
- **箭头标签**：使用 `->` 避免贯穿（fall-through）
- **yield 语句**：在代码块中返回值
- **穷尽性检查**：必须覆盖所有可能的情况

## 核心要点

### 密封类（Sealed Classes）

| 关键字 | 作用 | 使用位置 |
|-------|------|---------|
| `sealed` | 声明密封类型 | 类/接口声明 |
| `permits` | 指定允许的子类 | 密封类型声明 |
| `final` | 禁止进一步继承 | 子类声明 |
| `non-sealed` | 打开继承限制 | 子类声明 |

**核心规则**：
- 密封类的子类必须是 `final`、`sealed` 或 `non-sealed`
- 子类必须与密封类在同一模块（或同一包，若为未命名模块）
- permits 子句可省略（当子类在同一文件中声明时）

### 模式匹配（Pattern Matching for instanceof）

**模式变量的作用域**：

```java
// 在 && 后可用
if (obj instanceof String s && s.length() > 5) { }

// 在 || 后不可用（编译错误）
// if (obj instanceof String s || s.isEmpty()) { }  // 错误！

// 在 else 分支取反后可用
if (!(obj instanceof String s)) {
    return;
}
// 这里 s 可用（因为如果不是 String 已经返回）
s.toUpperCase();
```

### 记录类（Records）

**Records 能做的事**：
- 定义组件（自动生成字段和访问器）
- 实现接口
- 定义静态字段和静态方法
- 定义实例方法
- 自定义规范构造器和紧凑构造器
- 添加其他构造器（必须委托给规范构造器）

**Records 不能做的事**：
- 继承其他类（隐式继承 java.lang.Record）
- 被其他类继承（隐式 final）
- 声明实例字段（除组件外）
- 是抽象的

### 文本块（Text Blocks）

**新转义序列**：
- `\<line-terminator>`：行终止符，不产生换行
- `\s`：单个空格，保留尾随空白

```java
// 使用 \ 避免换行
String singleLine = """
    这是一个很长的字符串，\
    但实际上只有一行\
    """;

// 使用 \s 保留尾随空白
String withTrailingSpace = """
    第一行   \s
    第二行   \s
    """;
```

### Switch 表达式

**语法形式对比**：

| 形式 | 贯穿行为 | 返回值 |
|-----|---------|-------|
| `case L:` | 会贯穿 | 无 |
| `case L ->` | 不贯穿 | 可选 |
| `yield value;` | - | 在块中返回 |

## 代码示例

### 示例1：密封类实现图形层次结构

```java
/**
 * 使用密封类定义一个完整的图形类型层次结构
 * 演示密封类的声明、继承约束和模式匹配配合
 */

// 密封接口定义允许的实现类型
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
    double perimeter();
    String describe();
}

// final 实现类 - 不可继承
public final class Circle implements Shape {
    private final double radius;

    public Circle(double radius) {
        if (radius <= 0) {
            throw new IllegalArgumentException("半径必须为正数: " + radius);
        }
        this.radius = radius;
    }

    public double radius() {
        return radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }

    @Override
    public double perimeter() {
        return 2 * Math.PI * radius;
    }

    @Override
    public String describe() {
        return String.format("圆形 [半径=%.2f, 面积=%.2f]", radius, area());
    }
}

// final 实现类 - 不可继承
public final class Rectangle implements Shape {
    private final double width;
    private final double height;

    public Rectangle(double width, double height) {
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("宽度和高度必须为正数");
        }
        this.width = width;
        this.height = height;
    }

    public double width() { return width; }
    public double height() { return height; }
    public boolean isSquare() { return width == height; }

    @Override
    public double area() {
        return width * height;
    }

    @Override
    public double perimeter() {
        return 2 * (width + height);
    }

    @Override
    public String describe() {
        String type = isSquare() ? "正方形" : "矩形";
        return String.format("%s [宽=%.2f, 高=%.2f, 面积=%.2f]",
            type, width, height, area());
    }
}

// non-sealed 实现类 - 开放继承
public non-sealed class Triangle implements Shape {
    protected final double a, b, c;

    public Triangle(double a, double b, double c) {
        if (a <= 0 || b <= 0 || c <= 0) {
            throw new IllegalArgumentException("边长必须为正数");
        }
        if (!isValidTriangle(a, b, c)) {
            throw new IllegalArgumentException("不满足三角形不等式");
        }
        this.a = a;
        this.b = b;
        this.c = c;
    }

    private static boolean isValidTriangle(double a, double b, double c) {
        return a + b > c && b + c > a && a + c > b;
    }

    @Override
    public double area() {
        double s = perimeter() / 2;
        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }

    @Override
    public double perimeter() {
        return a + b + c;
    }

    @Override
    public String describe() {
        return String.format("三角形 [边长=%.2f,%.2f,%.2f, 面积=%.2f]",
            a, b, c, area());
    }
}

// 等边三角形 - 继承自 non-sealed 的 Triangle
public class EquilateralTriangle extends Triangle {
    public EquilateralTriangle(double side) {
        super(side, side, side);
    }

    @Override
    public String describe() {
        return String.format("等边三角形 [边长=%.2f, 面积=%.2f]", a, area());
    }
}

// 图形处理工具类
public class ShapeProcessor {

    /**
     * 使用 switch 表达式处理密封类层次结构
     * 编译器保证穷尽性检查，无需 default 分支
     */
    public static String classify(Shape shape) {
        return switch (shape) {
            case Circle c -> "圆形，半径 " + c.radius();
            case Rectangle r when r.isSquare() -> "正方形，边长 " + r.width();
            case Rectangle r -> "矩形，尺寸 " + r.width() + "x" + r.height();
            case Triangle t -> "三角形，周长 " + t.perimeter();
        };
    }

    /**
     * 计算形状数组的总面积
     */
    public static double totalArea(Shape... shapes) {
        double total = 0;
        for (Shape shape : shapes) {
            total += switch (shape) {
                case Circle c -> c.area();
                case Rectangle r -> r.area();
                case Triangle t -> t.area();
            };
        }
        return total;
    }

    public static void main(String[] args) {
        Shape[] shapes = {
            new Circle(5),
            new Rectangle(4, 6),
            new Rectangle(5, 5),
            new Triangle(3, 4, 5),
            new EquilateralTriangle(6)
        };

        System.out.println("=== 图形分类 ===");
        for (Shape shape : shapes) {
            System.out.println(classify(shape));
            System.out.println("  详情: " + shape.describe());
        }

        System.out.println("\n总面积: " + String.format("%.2f", totalArea(shapes)));
    }
}
```

### 示例2：模式匹配实现类型安全的数据处理

```java
import java.time.LocalDate;
import java.util.*;

/**
 * 演示 Pattern Matching for instanceof 的各种使用场景
 */
public class PatternMatchingDemo {

    // 模拟不同类型的数据库查询结果
    sealed interface QueryResult permits
        SingleResult, MultipleResults, EmptyResult, ErrorResult {
    }

    record SingleResult(Object value) implements QueryResult {}
    record MultipleResults(List<Object> values) implements QueryResult {}
    record EmptyResult() implements QueryResult {}
    record ErrorResult(String message, Exception cause) implements QueryResult {}

    /**
     * 基本模式匹配：类型检查 + 变量绑定
     */
    public static String formatValue(Object value) {
        if (value instanceof String s) {
            return "字符串: \"" + s + "\" (长度=" + s.length() + ")";
        } else if (value instanceof Integer i) {
            return "整数: " + i + " (十六进制=0x" + Integer.toHexString(i) + ")";
        } else if (value instanceof Double d) {
            return String.format("浮点数: %.4f", d);
        } else if (value instanceof LocalDate date) {
            return "日期: " + date.getYear() + "年" +
                   date.getMonthValue() + "月" + date.getDayOfMonth() + "日";
        } else if (value instanceof List<?> list) {
            return "列表: " + list.size() + " 个元素";
        } else if (value instanceof Map<?, ?> map) {
            return "映射: " + map.size() + " 个键值对";
        } else if (value == null) {
            return "空值";
        }
        return "未知类型: " + value.getClass().getSimpleName();
    }

    /**
     * 模式匹配与条件组合
     */
    public static String categorizeNumber(Object obj) {
        // 模式匹配可以与 && 结合使用
        if (obj instanceof Integer i && i > 0) {
            if (i < 10) return "小正整数";
            if (i < 100) return "中等正整数";
            return "大正整数";
        }
        if (obj instanceof Integer i && i < 0) {
            return "负整数";
        }
        if (obj instanceof Integer i && i == 0) {
            return "零";
        }
        if (obj instanceof Double d && !d.isNaN() && !d.isInfinite()) {
            return "有限浮点数";
        }
        if (obj instanceof Number) {
            return "其他数值类型";
        }
        return "非数值类型";
    }

    /**
     * 模式变量的作用域 - 否定条件后的使用
     */
    public static String processInput(Object input) {
        // 如果不是字符串，提前返回
        if (!(input instanceof String s)) {
            return "输入必须是字符串";
        }

        // 在这里，s 已经是 String 类型（因为非字符串的情况已经返回）
        // 编译器通过数据流分析确定 s 的可用性
        if (s.isBlank()) {
            return "输入不能为空白";
        }

        return "处理结果: " + s.trim().toUpperCase();
    }

    /**
     * 处理查询结果的类型安全实现
     */
    public static void handleQueryResult(QueryResult result) {
        if (result instanceof SingleResult sr) {
            System.out.println("单一结果: " + formatValue(sr.value()));
        } else if (result instanceof MultipleResults mr && !mr.values().isEmpty()) {
            System.out.println("多个结果 (" + mr.values().size() + " 条):");
            mr.values().forEach(v -> System.out.println("  - " + formatValue(v)));
        } else if (result instanceof MultipleResults mr) {
            System.out.println("查询返回空列表");
        } else if (result instanceof EmptyResult) {
            System.out.println("无匹配结果");
        } else if (result instanceof ErrorResult err) {
            System.err.println("查询错误: " + err.message());
            if (err.cause() != null) {
                System.err.println("原因: " + err.cause().getMessage());
            }
        }
    }

    /**
     * 复杂对象的递归模式匹配
     */
    public static int calculateDepth(Object obj) {
        if (obj instanceof List<?> list && !list.isEmpty()) {
            int maxDepth = 0;
            for (Object item : list) {
                maxDepth = Math.max(maxDepth, calculateDepth(item));
            }
            return 1 + maxDepth;
        }
        if (obj instanceof Map<?, ?> map && !map.isEmpty()) {
            int maxDepth = 0;
            for (Object value : map.values()) {
                maxDepth = Math.max(maxDepth, calculateDepth(value));
            }
            return 1 + maxDepth;
        }
        return 0;
    }

    public static void main(String[] args) {
        // 测试基本类型格式化
        System.out.println("=== 值格式化测试 ===");
        Object[] values = {
            "Hello, 世界",
            42,
            3.14159265,
            LocalDate.of(2024, 1, 15),
            List.of(1, 2, 3),
            Map.of("a", 1, "b", 2),
            null
        };

        for (Object value : values) {
            System.out.println(formatValue(value));
        }

        // 测试数字分类
        System.out.println("\n=== 数字分类测试 ===");
        Object[] numbers = {5, 50, 500, -10, 0, 3.14, Double.NaN, "not a number"};
        for (Object num : numbers) {
            System.out.println(num + " -> " + categorizeNumber(num));
        }

        // 测试查询结果处理
        System.out.println("\n=== 查询结果处理测试 ===");
        QueryResult[] results = {
            new SingleResult("用户张三"),
            new MultipleResults(List.of("订单1", "订单2", "订单3")),
            new MultipleResults(List.of()),
            new EmptyResult(),
            new ErrorResult("连接超时", new RuntimeException("网络不可达"))
        };

        for (QueryResult result : results) {
            handleQueryResult(result);
        }

        // 测试嵌套深度计算
        System.out.println("\n=== 嵌套深度计算 ===");
        Object nested = List.of(
            1,
            List.of(2, 3),
            List.of(List.of(4, 5), List.of(6))
        );
        System.out.println("嵌套深度: " + calculateDepth(nested));
    }
}
```

### 示例3：Records 构建领域模型

```java
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 使用 Records 构建电商领域模型
 * 展示 Records 的各种高级用法
 */

// 值对象：金额
public record Money(BigDecimal amount, String currency) {

    // 紧凑构造器进行验证和规范化
    public Money {
        Objects.requireNonNull(amount, "金额不能为空");
        Objects.requireNonNull(currency, "货币代码不能为空");

        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("金额不能为负数: " + amount);
        }

        currency = currency.toUpperCase();
        amount = amount.setScale(2, RoundingMode.HALF_UP);
    }

    // 静态工厂方法
    public static Money of(double amount, String currency) {
        return new Money(BigDecimal.valueOf(amount), currency);
    }

    public static Money cny(double amount) {
        return of(amount, "CNY");
    }

    public static Money usd(double amount) {
        return of(amount, "USD");
    }

    public static final Money ZERO_CNY = cny(0);
    public static final Money ZERO_USD = usd(0);

    // 货币运算
    public Money add(Money other) {
        validateSameCurrency(other);
        return new Money(amount.add(other.amount), currency);
    }

    public Money subtract(Money other) {
        validateSameCurrency(other);
        return new Money(amount.subtract(other.amount), currency);
    }

    public Money multiply(int quantity) {
        return new Money(amount.multiply(BigDecimal.valueOf(quantity)), currency);
    }

    public Money multiply(BigDecimal factor) {
        return new Money(amount.multiply(factor), currency);
    }

    private void validateSameCurrency(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException(
                "货币类型不匹配: " + currency + " vs " + other.currency);
        }
    }

    // 比较方法
    public boolean isGreaterThan(Money other) {
        validateSameCurrency(other);
        return amount.compareTo(other.amount) > 0;
    }

    public boolean isLessThan(Money other) {
        validateSameCurrency(other);
        return amount.compareTo(other.amount) < 0;
    }

    public String formatted() {
        return switch (currency) {
            case "CNY" -> "¥" + amount;
            case "USD" -> "$" + amount;
            case "EUR" -> "€" + amount;
            default -> amount + " " + currency;
        };
    }
}

// 值对象：地址
public record Address(
    String province,
    String city,
    String district,
    String street,
    String zipCode
) {
    public Address {
        Objects.requireNonNull(province, "省份不能为空");
        Objects.requireNonNull(city, "城市不能为空");
        Objects.requireNonNull(district, "区县不能为空");
        Objects.requireNonNull(street, "街道地址不能为空");

        province = province.trim();
        city = city.trim();
        district = district.trim();
        street = street.trim();

        if (zipCode != null) {
            zipCode = zipCode.trim();
        }
    }

    public String fullAddress() {
        return province + city + district + street;
    }
}

// 实体：商品
public record Product(
    String id,
    String name,
    String description,
    Money price,
    int stock,
    String category
) {
    public Product {
        Objects.requireNonNull(id, "商品ID不能为空");
        Objects.requireNonNull(name, "商品名称不能为空");
        Objects.requireNonNull(price, "商品价格不能为空");

        if (stock < 0) {
            throw new IllegalArgumentException("库存不能为负数");
        }
    }

    public boolean isAvailable() {
        return stock > 0;
    }

    public Product withStock(int newStock) {
        return new Product(id, name, description, price, newStock, category);
    }

    public Product reduceStock(int quantity) {
        if (quantity > stock) {
            throw new IllegalStateException("库存不足");
        }
        return withStock(stock - quantity);
    }
}

// 值对象：订单项
public record OrderItem(Product product, int quantity) {

    public OrderItem {
        Objects.requireNonNull(product, "商品不能为空");
        if (quantity <= 0) {
            throw new IllegalArgumentException("数量必须大于0");
        }
    }

    public Money subtotal() {
        return product.price().multiply(quantity);
    }
}

// 订单状态
public enum OrderStatus {
    PENDING("待支付"),
    PAID("已支付"),
    SHIPPED("已发货"),
    DELIVERED("已送达"),
    CANCELLED("已取消");

    private final String displayName;

    OrderStatus(String displayName) {
        this.displayName = displayName;
    }

    public String displayName() {
        return displayName;
    }
}

// 聚合根：订单
public record Order(
    String orderId,
    String customerId,
    List<OrderItem> items,
    Address shippingAddress,
    OrderStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public Order {
        Objects.requireNonNull(orderId);
        Objects.requireNonNull(customerId);
        Objects.requireNonNull(shippingAddress);
        Objects.requireNonNull(status);

        items = items != null ? List.copyOf(items) : List.of();

        if (items.isEmpty() && status != OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("订单必须包含至少一个商品");
        }

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = createdAt;
        }
    }

    // 静态工厂方法
    public static Order create(
        String customerId,
        List<OrderItem> items,
        Address shippingAddress
    ) {
        String orderId = "ORD-" + System.currentTimeMillis();
        return new Order(
            orderId,
            customerId,
            items,
            shippingAddress,
            OrderStatus.PENDING,
            null,
            null
        );
    }

    // 计算总金额
    public Money totalAmount() {
        return items.stream()
            .map(OrderItem::subtotal)
            .reduce(Money.ZERO_CNY, Money::add);
    }

    // 获取商品数量
    public int totalItems() {
        return items.stream()
            .mapToInt(OrderItem::quantity)
            .sum();
    }

    // 状态转换方法
    public Order pay() {
        if (status != OrderStatus.PENDING) {
            throw new IllegalStateException("只有待支付订单可以支付");
        }
        return withStatus(OrderStatus.PAID);
    }

    public Order ship() {
        if (status != OrderStatus.PAID) {
            throw new IllegalStateException("只有已支付订单可以发货");
        }
        return withStatus(OrderStatus.SHIPPED);
    }

    public Order deliver() {
        if (status != OrderStatus.SHIPPED) {
            throw new IllegalStateException("只有已发货订单可以确认送达");
        }
        return withStatus(OrderStatus.DELIVERED);
    }

    public Order cancel() {
        if (status == OrderStatus.DELIVERED) {
            throw new IllegalStateException("已送达订单无法取消");
        }
        return withStatus(OrderStatus.CANCELLED);
    }

    private Order withStatus(OrderStatus newStatus) {
        return new Order(
            orderId, customerId, items, shippingAddress,
            newStatus, createdAt, LocalDateTime.now()
        );
    }

    // 格式化输出
    public String summary() {
        return String.format(
            "订单 %s [%s] - %d 件商品，总计 %s",
            orderId, status.displayName(), totalItems(), totalAmount().formatted()
        );
    }
}

// 订单服务
public class OrderService {

    public static void main(String[] args) {
        // 创建商品
        Product laptop = new Product(
            "P001", "MacBook Pro 14", "Apple 笔记本电脑",
            Money.cny(14999), 50, "电子产品"
        );

        Product mouse = new Product(
            "P002", "Magic Mouse", "Apple 无线鼠标",
            Money.cny(699), 100, "电子产品"
        );

        // 创建订单项
        List<OrderItem> items = List.of(
            new OrderItem(laptop, 1),
            new OrderItem(mouse, 2)
        );

        // 创建收货地址
        Address address = new Address(
            "北京市", "北京市", "海淀区",
            "中关村大街1号科技大厦A座1001室",
            "100080"
        );

        // 创建订单
        Order order = Order.create("C001", items, address);
        System.out.println("创建订单: " + order.summary());
        System.out.println("收货地址: " + address.fullAddress());

        // 订单状态流转
        order = order.pay();
        System.out.println("支付订单: " + order.summary());

        order = order.ship();
        System.out.println("发货订单: " + order.summary());

        order = order.deliver();
        System.out.println("送达订单: " + order.summary());

        // 打印订单详情
        System.out.println("\n=== 订单详情 ===");
        System.out.println("订单编号: " + order.orderId());
        System.out.println("订单状态: " + order.status().displayName());
        System.out.println("创建时间: " + order.createdAt());
        System.out.println("更新时间: " + order.updatedAt());
        System.out.println("订单明细:");
        for (OrderItem item : order.items()) {
            System.out.printf("  - %s x %d = %s%n",
                item.product().name(),
                item.quantity(),
                item.subtotal().formatted()
            );
        }
        System.out.println("订单总额: " + order.totalAmount().formatted());
    }
}
```

### 示例4：文本块处理多行文本

```java
import java.util.Map;

/**
 * 演示文本块的各种使用场景
 */
public class TextBlocksDemo {

    // HTML 模板
    public static String generateHtmlPage(String title, String content) {
        return """
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        line-height: 1.6;
                    }
                    .content {
                        background: #f5f5f5;
                        padding: 20px;
                        border-radius: 8px;
                    }
                </style>
            </head>
            <body>
                <h1>%s</h1>
                <div class="content">
                    %s
                </div>
            </body>
            </html>
            """.formatted(title, title, content);
    }

    // JSON 配置模板
    public static String generateJsonConfig(
        String appName,
        int port,
        String dbHost,
        String dbName
    ) {
        return """
            {
                "application": {
                    "name": "%s",
                    "version": "1.0.0",
                    "environment": "production"
                },
                "server": {
                    "host": "0.0.0.0",
                    "port": %d,
                    "ssl": {
                        "enabled": true,
                        "keyStore": "/etc/ssl/keystore.jks"
                    }
                },
                "database": {
                    "host": "%s",
                    "port": 5432,
                    "name": "%s",
                    "pool": {
                        "minSize": 5,
                        "maxSize": 20,
                        "idleTimeout": 300000
                    }
                },
                "logging": {
                    "level": "INFO",
                    "pattern": "%%d{yyyy-MM-dd HH:mm:ss} [%%thread] %%-5level %%logger{36} - %%msg%%n"
                }
            }
            """.formatted(appName, port, dbHost, dbName);
    }

    // SQL 查询模板
    public static String buildComplexQuery(
        String tableName,
        String statusFilter,
        int limit
    ) {
        return """
            WITH recent_orders AS (
                SELECT
                    o.id,
                    o.customer_id,
                    o.total_amount,
                    o.status,
                    o.created_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY o.customer_id
                        ORDER BY o.created_at DESC
                    ) AS rn
                FROM %s o
                WHERE o.status = '%s'
                  AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
            ),
            customer_stats AS (
                SELECT
                    customer_id,
                    COUNT(*) AS order_count,
                    SUM(total_amount) AS total_spent,
                    AVG(total_amount) AS avg_order_value
                FROM recent_orders
                WHERE rn <= 10
                GROUP BY customer_id
            )
            SELECT
                c.id AS customer_id,
                c.name AS customer_name,
                c.email,
                cs.order_count,
                cs.total_spent,
                cs.avg_order_value,
                CASE
                    WHEN cs.total_spent >= 10000 THEN 'VIP'
                    WHEN cs.total_spent >= 5000 THEN 'Gold'
                    WHEN cs.total_spent >= 1000 THEN 'Silver'
                    ELSE 'Bronze'
                END AS tier
            FROM customer_stats cs
            JOIN customers c ON c.id = cs.customer_id
            ORDER BY cs.total_spent DESC
            LIMIT %d;
            """.formatted(tableName, statusFilter, limit);
    }

    // Markdown 文档生成
    public static String generateApiDoc(
        String endpoint,
        String method,
        String description,
        Map<String, String> params,
        String responseExample
    ) {
        StringBuilder paramsTable = new StringBuilder();
        paramsTable.append("| 参数名 | 说明 |\n");
        paramsTable.append("|--------|------|\n");
        for (var entry : params.entrySet()) {
            paramsTable.append("| `").append(entry.getKey())
                       .append("` | ").append(entry.getValue()).append(" |\n");
        }

        return """
            ## %s

            **请求方式**: `%s`

            ### 接口说明

            %s

            ### 请求参数

            %s

            ### 响应示例

            ```json
            %s
            ```

            ### 错误码

            | 错误码 | 说明 |
            |--------|------|
            | 400 | 请求参数错误 |
            | 401 | 未授权访问 |
            | 404 | 资源不存在 |
            | 500 | 服务器内部错误 |

            ---
            """.formatted(endpoint, method, description, paramsTable, responseExample);
    }

    // 使用 \ 避免换行（行连续）
    public static String buildLongString() {
        return """
            这是一个很长的字符串，为了代码可读性，\
            我们可以在源代码中将它分成多行，\
            但实际上它会被编译成单行文本。\
            这在构建 URL 或长字符串时很有用。\
            """;
    }

    // 使用 \s 保留尾随空格
    public static String buildTableWithSpaces() {
        return """
            名称        价格    \s
            --------    ----    \s
            苹果        5.00    \s
            香蕉        3.50    \s
            橙子        4.00    \s
            """;
    }

    // 处理缩进控制
    public static void demonstrateIndentation() {
        // 结束定界符在内容之前 - 保留缩进
        String withIndent = """
                保留的缩进
                    更多缩进
            """;

        // 结束定界符与内容对齐 - 移除共同缩进
        String noIndent = """
            无额外缩进
                相对缩进
            """;

        System.out.println("=== 带缩进 ===");
        System.out.println(withIndent);
        System.out.println("=== 无缩进 ===");
        System.out.println(noIndent);
    }

    // Shell 脚本模板
    public static String generateDeployScript(
        String appName,
        String version,
        String dockerRegistry
    ) {
        return """
            #!/bin/bash
            set -euo pipefail

            # 部署脚本: %s v%s
            # 生成时间: $(date)

            APP_NAME="%s"
            VERSION="%s"
            REGISTRY="%s"
            IMAGE="${REGISTRY}/${APP_NAME}:${VERSION}"

            echo "开始部署 ${APP_NAME} 版本 ${VERSION}..."

            # 拉取最新镜像
            docker pull "${IMAGE}"

            # 停止旧容器
            docker stop "${APP_NAME}" 2>/dev/null || true
            docker rm "${APP_NAME}" 2>/dev/null || true

            # 启动新容器
            docker run -d \\
                --name "${APP_NAME}" \\
                --restart unless-stopped \\
                -p 8080:8080 \\
                -e SPRING_PROFILES_ACTIVE=prod \\
                -v /var/log/${APP_NAME}:/app/logs \\
                "${IMAGE}"

            # 健康检查
            echo "等待服务启动..."
            for i in {1..30}; do
                if curl -sf http://localhost:8080/actuator/health > /dev/null; then
                    echo "服务启动成功!"
                    exit 0
                fi
                sleep 2
            done

            echo "服务启动超时!"
            exit 1
            """.formatted(appName, version, appName, version, dockerRegistry);
    }

    public static void main(String[] args) {
        // HTML 示例
        System.out.println("=== HTML 页面 ===");
        System.out.println(generateHtmlPage("欢迎", "这是一个示例页面。"));

        // JSON 配置示例
        System.out.println("\n=== JSON 配置 ===");
        System.out.println(generateJsonConfig("myapp", 8080, "db.example.com", "mydb"));

        // SQL 查询示例
        System.out.println("\n=== SQL 查询 ===");
        System.out.println(buildComplexQuery("orders", "completed", 100));

        // API 文档示例
        System.out.println("\n=== API 文档 ===");
        System.out.println(generateApiDoc(
            "/api/users/{id}",
            "GET",
            "根据用户ID获取用户详细信息",
            Map.of("id", "用户唯一标识符", "fields", "可选，指定返回的字段"),
            """
            {
                "id": "12345",
                "name": "张三",
                "email": "zhangsan@example.com"
            }
            """
        ));

        // 其他演示
        System.out.println("\n=== 行连续 ===");
        System.out.println(buildLongString());

        System.out.println("\n=== 保留空格的表格 ===");
        System.out.println(buildTableWithSpaces());

        System.out.println("\n=== 缩进演示 ===");
        demonstrateIndentation();

        // 部署脚本
        System.out.println("\n=== 部署脚本 ===");
        System.out.println(generateDeployScript("order-service", "1.2.3", "registry.example.com"));
    }
}
```

### 示例5：Switch 表达式完整应用

```java
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;

/**
 * 演示 Switch 表达式的各种用法
 */
public class SwitchExpressionsDemo {

    // 基本的 switch 表达式 - 使用箭头标签
    public static String getDayType(DayOfWeek day) {
        return switch (day) {
            case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> "工作日";
            case SATURDAY, SUNDAY -> "周末";
        };
    }

    // 使用 yield 在代码块中返回值
    public static int getDayNumber(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> 1;
            case TUESDAY -> 2;
            case WEDNESDAY -> 3;
            case THURSDAY -> 4;
            case FRIDAY -> 5;
            case SATURDAY -> {
                System.out.println("周六休息");
                yield 6;
            }
            case SUNDAY -> {
                System.out.println("周日休息");
                yield 7;
            }
        };
    }

    // 使用 switch 表达式处理枚举
    public enum TrafficLight {
        RED, YELLOW, GREEN
    }

    public static String getTrafficAction(TrafficLight light) {
        return switch (light) {
            case RED -> "停止";
            case YELLOW -> "减速";
            case GREEN -> "通行";
        };
    }

    // 结合模式匹配（Java 17 预览，Java 21 正式）
    // 注意：此示例需要 Java 21+ 或启用预览特性
    public static String describeObject(Object obj) {
        // Java 17 中使用 instanceof 模式匹配
        if (obj == null) {
            return "空值";
        } else if (obj instanceof Integer i) {
            return i >= 0 ? "非负整数: " + i : "负整数: " + i;
        } else if (obj instanceof String s) {
            return s.isEmpty() ? "空字符串" : "字符串: " + s;
        } else if (obj instanceof Double d) {
            return "浮点数: " + d;
        } else if (obj instanceof Boolean b) {
            return b ? "真" : "假";
        }
        return "其他类型: " + obj.getClass().getSimpleName();
    }

    // 复杂业务逻辑：订单状态处理
    public enum OrderStatus {
        CREATED, PENDING_PAYMENT, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
    }

    public record OrderAction(String action, String message, boolean requiresNotification) {}

    public static OrderAction processOrderStatus(OrderStatus status, boolean hasPaymentIssue) {
        return switch (status) {
            case CREATED -> new OrderAction(
                "await_payment",
                "等待用户支付",
                false
            );

            case PENDING_PAYMENT -> {
                if (hasPaymentIssue) {
                    yield new OrderAction(
                        "retry_payment",
                        "支付遇到问题，请重试",
                        true
                    );
                }
                yield new OrderAction(
                    "processing_payment",
                    "支付处理中",
                    false
                );
            }

            case PAID -> new OrderAction(
                "start_processing",
                "支付成功，开始处理订单",
                true
            );

            case PROCESSING -> new OrderAction(
                "prepare_shipment",
                "订单处理中，准备发货",
                false
            );

            case SHIPPED -> new OrderAction(
                "track_delivery",
                "订单已发货，可追踪物流",
                true
            );

            case DELIVERED -> new OrderAction(
                "confirm_receipt",
                "订单已送达，请确认收货",
                true
            );

            case CANCELLED -> new OrderAction(
                "process_refund",
                "订单已取消，处理退款",
                true
            );

            case REFUNDED -> new OrderAction(
                "close_order",
                "退款完成，订单关闭",
                true
            );
        };
    }

    // 使用 switch 表达式计算结果
    public static double calculateDiscount(String customerLevel, double amount) {
        double discountRate = switch (customerLevel.toUpperCase()) {
            case "BRONZE" -> 0.0;
            case "SILVER" -> 0.05;
            case "GOLD" -> 0.10;
            case "PLATINUM" -> 0.15;
            case "DIAMOND" -> 0.20;
            default -> {
                System.out.println("未知会员等级: " + customerLevel);
                yield 0.0;
            }
        };

        return amount * discountRate;
    }

    // 季节判断
    public static String getSeason(Month month) {
        return switch (month) {
            case MARCH, APRIL, MAY -> "春季";
            case JUNE, JULY, AUGUST -> "夏季";
            case SEPTEMBER, OCTOBER, NOVEMBER -> "秋季";
            case DECEMBER, JANUARY, FEBRUARY -> "冬季";
        };
    }

    // 获取季节活动
    public static String getSeasonalActivity(LocalDate date) {
        String season = getSeason(date.getMonth());
        DayOfWeek dayOfWeek = date.getDayOfWeek();

        return switch (season) {
            case "春季" -> switch (getDayType(dayOfWeek)) {
                case "工作日" -> "春季工作：项目冲刺";
                case "周末" -> "春游踏青";
                default -> "未知";
            };
            case "夏季" -> switch (getDayType(dayOfWeek)) {
                case "工作日" -> "夏季工作：高效产出";
                case "周末" -> "海滩度假";
                default -> "未知";
            };
            case "秋季" -> switch (getDayType(dayOfWeek)) {
                case "工作日" -> "秋季工作：收获成果";
                case "周末" -> "登山赏秋";
                default -> "未知";
            };
            case "冬季" -> switch (getDayType(dayOfWeek)) {
                case "工作日" -> "冬季工作：年终总结";
                case "周末" -> "滑雪温泉";
                default -> "未知";
            };
            default -> "未知季节活动";
        };
    }

    // HTTP 状态码处理
    public record HttpResponse(int code, String category, String message) {}

    public static HttpResponse categorizeHttpStatus(int statusCode) {
        return switch (statusCode / 100) {
            case 1 -> new HttpResponse(statusCode, "Informational", "信息性响应");
            case 2 -> switch (statusCode) {
                case 200 -> new HttpResponse(200, "Success", "请求成功");
                case 201 -> new HttpResponse(201, "Success", "资源已创建");
                case 204 -> new HttpResponse(204, "Success", "无内容");
                default -> new HttpResponse(statusCode, "Success", "操作成功");
            };
            case 3 -> switch (statusCode) {
                case 301 -> new HttpResponse(301, "Redirection", "永久重定向");
                case 302 -> new HttpResponse(302, "Redirection", "临时重定向");
                case 304 -> new HttpResponse(304, "Redirection", "未修改");
                default -> new HttpResponse(statusCode, "Redirection", "重定向");
            };
            case 4 -> switch (statusCode) {
                case 400 -> new HttpResponse(400, "Client Error", "错误请求");
                case 401 -> new HttpResponse(401, "Client Error", "未授权");
                case 403 -> new HttpResponse(403, "Client Error", "禁止访问");
                case 404 -> new HttpResponse(404, "Client Error", "资源不存在");
                case 429 -> new HttpResponse(429, "Client Error", "请求过于频繁");
                default -> new HttpResponse(statusCode, "Client Error", "客户端错误");
            };
            case 5 -> switch (statusCode) {
                case 500 -> new HttpResponse(500, "Server Error", "服务器内部错误");
                case 502 -> new HttpResponse(502, "Server Error", "网关错误");
                case 503 -> new HttpResponse(503, "Server Error", "服务不可用");
                case 504 -> new HttpResponse(504, "Server Error", "网关超时");
                default -> new HttpResponse(statusCode, "Server Error", "服务器错误");
            };
            default -> new HttpResponse(statusCode, "Unknown", "未知状态码");
        };
    }

    // 计算器实现
    public static double calculate(double a, String operator, double b) {
        return switch (operator) {
            case "+" -> a + b;
            case "-" -> a - b;
            case "*", "×" -> a * b;
            case "/", "÷" -> {
                if (b == 0) {
                    throw new ArithmeticException("除数不能为零");
                }
                yield a / b;
            }
            case "%" -> a % b;
            case "^", "**" -> Math.pow(a, b);
            default -> throw new IllegalArgumentException("不支持的运算符: " + operator);
        };
    }

    public static void main(String[] args) {
        // 星期测试
        System.out.println("=== 星期类型测试 ===");
        for (DayOfWeek day : DayOfWeek.values()) {
            System.out.printf("%s: %s (第%d天)%n",
                day, getDayType(day), getDayNumber(day));
        }

        // 交通灯测试
        System.out.println("\n=== 交通灯测试 ===");
        for (TrafficLight light : TrafficLight.values()) {
            System.out.printf("%s -> %s%n", light, getTrafficAction(light));
        }

        // 对象描述测试
        System.out.println("\n=== 对象描述测试 ===");
        Object[] objects = {42, -10, "Hello", "", 3.14, true, null, new int[]{1, 2, 3}};
        for (Object obj : objects) {
            System.out.println(describeObject(obj));
        }

        // 订单状态测试
        System.out.println("\n=== 订单状态处理 ===");
        for (OrderStatus status : OrderStatus.values()) {
            OrderAction action = processOrderStatus(status, status == OrderStatus.PENDING_PAYMENT);
            System.out.printf("%s -> [%s] %s (通知: %s)%n",
                status, action.action(), action.message(), action.requiresNotification());
        }

        // 折扣计算测试
        System.out.println("\n=== 折扣计算测试 ===");
        String[] levels = {"bronze", "silver", "gold", "platinum", "diamond", "unknown"};
        double amount = 1000.0;
        for (String level : levels) {
            double discount = calculateDiscount(level, amount);
            System.out.printf("%s 会员, 消费 %.2f, 折扣 %.2f%n", level, amount, discount);
        }

        // 季节活动测试
        System.out.println("\n=== 季节活动测试 ===");
        LocalDate[] dates = {
            LocalDate.of(2024, 4, 15),   // 春季工作日
            LocalDate.of(2024, 7, 20),   // 夏季周末
            LocalDate.of(2024, 10, 5),   // 秋季周末
            LocalDate.of(2024, 1, 8)     // 冬季工作日
        };
        for (LocalDate date : dates) {
            System.out.printf("%s (%s, %s): %s%n",
                date,
                getSeason(date.getMonth()),
                getDayType(date.getDayOfWeek()),
                getSeasonalActivity(date)
            );
        }

        // HTTP 状态码测试
        System.out.println("\n=== HTTP 状态码测试 ===");
        int[] statusCodes = {100, 200, 201, 301, 400, 401, 404, 500, 503, 999};
        for (int code : statusCodes) {
            HttpResponse response = categorizeHttpStatus(code);
            System.out.printf("%d [%s]: %s%n",
                response.code(), response.category(), response.message());
        }

        // 计算器测试
        System.out.println("\n=== 计算器测试 ===");
        System.out.println("10 + 3 = " + calculate(10, "+", 3));
        System.out.println("10 - 3 = " + calculate(10, "-", 3));
        System.out.println("10 * 3 = " + calculate(10, "*", 3));
        System.out.println("10 / 3 = " + calculate(10, "/", 3));
        System.out.println("10 % 3 = " + calculate(10, "%", 3));
        System.out.println("2 ^ 10 = " + calculate(2, "^", 10));
    }
}
```

## 最佳实践

### 密封类最佳实践

1. **用于建模有限的类型层次**
```java
// 好：类型有限且固定
public sealed interface PaymentMethod permits
    CreditCard, DebitCard, BankTransfer, DigitalWallet {}

// 避免：类型可能无限扩展的场景
// sealed interface Animal permits Cat, Dog, ...  // 不适合
```

2. **与 Records 配合使用**
```java
public sealed interface Result<T> permits Success, Failure {
    <R> R fold(Function<T, R> onSuccess, Function<String, R> onFailure);
}

public record Success<T>(T value) implements Result<T> {
    @Override
    public <R> R fold(Function<T, R> onSuccess, Function<String, R> onFailure) {
        return onSuccess.apply(value);
    }
}

public record Failure<T>(String error) implements Result<T> {
    @Override
    public <R> R fold(Function<T, R> onSuccess, Function<String, R> onFailure) {
        return onFailure.apply(error);
    }
}
```

3. **利用编译器穷尽性检查**
```java
// 编译器会确保处理所有情况，无需 default
public static double calculateArea(Shape shape) {
    return switch (shape) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.width() * r.height();
        case Triangle t -> calculateTriangleArea(t);
    };
}
```

### 模式匹配最佳实践

1. **尽早进行类型检查并返回**
```java
public String process(Object input) {
    // 好：尽早返回，减少嵌套
    if (!(input instanceof String s)) {
        return "不支持的类型";
    }

    if (s.isBlank()) {
        return "输入为空";
    }

    return processString(s);
}
```

2. **合理使用条件与模式匹配的组合**
```java
// 好：清晰表达意图
if (obj instanceof List<?> list && !list.isEmpty()) {
    process(list);
}

// 避免：过于复杂的条件
if (obj instanceof Map<?,?> map
    && map.size() > 10
    && map.containsKey("key1")
    && map.get("key1") instanceof String s
    && s.length() > 5) {
    // 过于复杂，应该拆分
}
```

### Records 最佳实践

1. **在紧凑构造器中验证**
```java
public record Email(String value) {
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    public Email {
        Objects.requireNonNull(value, "邮箱不能为空");
        if (!EMAIL_PATTERN.matcher(value).matches()) {
            throw new IllegalArgumentException("无效的邮箱格式: " + value);
        }
        value = value.toLowerCase().trim();
    }
}
```

2. **确保组件的不可变性**
```java
public record ImmutableConfig(Map<String, String> properties) {
    public ImmutableConfig {
        properties = properties != null
            ? Map.copyOf(properties)
            : Map.of();
    }
}
```

3. **提供有意义的派生方法**
```java
public record DateRange(LocalDate start, LocalDate end) {
    public DateRange {
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("开始日期不能晚于结束日期");
        }
    }

    public long days() {
        return ChronoUnit.DAYS.between(start, end);
    }

    public boolean contains(LocalDate date) {
        return !date.isBefore(start) && !date.isAfter(end);
    }

    public boolean overlaps(DateRange other) {
        return !end.isBefore(other.start) && !start.isAfter(other.end);
    }
}
```

### 文本块最佳实践

1. **注意结束定界符的位置**
```java
// 推荐：结束定界符单独一行，控制缩进
String json = """
    {
        "name": "value"
    }
    """;

// 避免：结束定界符导致额外换行
String json = """
    {
        "name": "value"
    }""";  // 结尾无换行
```

2. **使用 formatted() 进行字符串插值**
```java
String template = """
    Dear %s,

    Your order #%s has been shipped.
    Estimated delivery: %s

    Best regards,
    Customer Service
    """.formatted(customerName, orderId, deliveryDate);
```

3. **使用适当的转义序列**
```java
// 使用 \ 实现长行连续
String longLine = """
    This is a very long line that would be hard to read \
    if we didn't break it up in the source code, but it \
    will appear as a single line in the output.\
    """;

// 使用 \s 保留尾随空格（如表格对齐）
String table = """
    Name        Age \s
    John        25  \s
    Jane        30  \s
    """;
```

### Switch 表达式最佳实践

1. **优先使用箭头标签**
```java
// 推荐：使用箭头标签，无贯穿风险
String result = switch (status) {
    case ACTIVE -> "活跃";
    case INACTIVE -> "非活跃";
    case PENDING -> "待处理";
};

// 避免：除非需要贯穿，否则不使用冒号标签
```

2. **复杂逻辑使用代码块和 yield**
```java
int priority = switch (task.getType()) {
    case BUG -> {
        int basePriority = 5;
        if (task.getSeverity() == Severity.CRITICAL) {
            basePriority += 5;
        }
        yield basePriority;
    }
    case FEATURE -> 3;
    case IMPROVEMENT -> 2;
    case DOCUMENTATION -> 1;
};
```

3. **利用穷尽性检查**
```java
// 枚举类型无需 default（编译器保证穷尽性）
public static String getSymbol(Currency currency) {
    return switch (currency) {
        case USD -> "$";
        case EUR -> "€";
        case CNY -> "¥";
        case GBP -> "£";
        case JPY -> "¥";
    };
}
```

## 常见陷阱

### 密封类陷阱

1. **忘记在子类上声明 final/sealed/non-sealed**
```java
public sealed interface Vehicle permits Car, Truck {}

// 错误：缺少修饰符
// public class Car implements Vehicle {}  // 编译错误

// 正确
public final class Car implements Vehicle {}
public sealed class Truck implements Vehicle permits PickupTruck, SemiTruck {}
public non-sealed class PickupTruck extends Truck {}
```

2. **子类不在允许的位置**
```java
// Animal.java
public sealed interface Animal permits Cat, Dog {}

// WrongPackage.java (不同的包或模块)
// public final class Cat implements Animal {}  // 编译错误
```

### 模式匹配陷阱

1. **模式变量的作用域误解**
```java
// 错误：s 在 || 后不可用
// if (obj instanceof String s || s.isEmpty()) { }

// 正确：使用 && 或重构逻辑
if (obj instanceof String s && !s.isEmpty()) {
    // s 可用
}
```

2. **忘记 null 检查**
```java
// obj 为 null 时，instanceof 返回 false
Object obj = null;
if (obj instanceof String s) {
    // 不会执行
}

// 如需处理 null，显式检查
if (obj == null) {
    return "空值";
} else if (obj instanceof String s) {
    return s;
}
```

### Records 陷阱

1. **可变对象作为组件**
```java
// 问题：组件是可变的
public record BadExample(List<String> items, Date date) {}

var list = new ArrayList<String>();
list.add("item1");
var record = new BadExample(list, new Date());

list.add("item2");  // 修改了 record 内部的列表！

// 解决：在构造器中创建不可变副本
public record GoodExample(List<String> items, Date date) {
    public GoodExample {
        items = List.copyOf(items);
        date = new Date(date.getTime());
    }

    @Override
    public Date date() {
        return new Date(date.getTime());  // 返回副本
    }
}
```

2. **误以为可以添加实例字段**
```java
// 错误：Records 不能有额外的实例字段
// public record Person(String name) {
//     private int age;  // 编译错误
// }

// 正确：使用静态字段或计算派生值
public record Person(String name, LocalDate birthDate) {
    private static final DateTimeFormatter FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public int age() {
        return Period.between(birthDate, LocalDate.now()).getYears();
    }
}
```

### 文本块陷阱

1. **意外的空白处理**
```java
// 问题：尾随空白被移除
String text = """
    Line with spaces
    """;
// "Line with spaces" 后面的空格被移除了

// 解决：使用 \s 保留空白
String text = """
    Line with spaces   \s
    """;
```

2. **缩进控制不当**
```java
// 问题：缩进不符合预期
String html = """
<html>
    <body>
    </body>
</html>
""";
// 整体没有缩进，因为 <html> 在最左边

// 预期效果：整体缩进
String html = """
        <html>
            <body>
            </body>
        </html>
        """;
// 共同前导空白被移除，保持相对缩进
```

### Switch 表达式陷阱

1. **混用箭头和冒号标签**
```java
// 错误：不能混用
// String result = switch (x) {
//     case 1 -> "one";
//     case 2: yield "two";  // 编译错误
// };

// 正确：统一使用一种风格
String result = switch (x) {
    case 1 -> "one";
    case 2 -> "two";
    default -> "other";
};
```

2. **忘记 yield 或使用 return**
```java
// 错误：在 switch 表达式的代码块中使用 return
// String result = switch (x) {
//     case 1 -> {
//         return "one";  // 编译错误
//     }
//     default -> "other";
// };

// 正确：使用 yield
String result = switch (x) {
    case 1 -> {
        // 复杂逻辑
        yield "one";
    }
    default -> "other";
};
```

3. **default 分支的穷尽性**
```java
// 对于非枚举类型，通常需要 default
String result = switch (obj) {
    case Integer i -> "整数";
    case String s -> "字符串";
    // default 是必需的，因为 obj 可能是任何类型
    default -> "其他";
};
```

## 性能考量

### 密封类性能

密封类在运行时几乎没有性能开销：

- **编译时检查**：类型约束在编译时验证
- **switch 优化**：JVM 可以对密封类型的 switch 进行优化
- **内联机会**：final 子类有更多内联优化机会

```java
// 密封类的 switch 可以被高效编译
public double area(Shape shape) {
    return switch (shape) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.width() * r.height();
        case Triangle t -> t.area();
    };
}
// JVM 可以生成高效的分发代码，无需虚方法调用开销
```

### 模式匹配性能

模式匹配与传统的 instanceof + 强制转换性能相当：

```java
// 传统方式
if (obj instanceof String) {
    String s = (String) obj;
    // 使用 s
}

// 模式匹配（性能相当或更优）
if (obj instanceof String s) {
    // 使用 s
}
// 编译器可以优化掉冗余的类型检查
```

### Records 性能

Records 的访问器和 equals/hashCode 方法是经过优化的：

- **不可变性优势**：JVM 可以进行更激进的优化
- **内联访问器**：简单的访问器通常被内联
- **hashCode 缓存**：某些 JVM 实现会缓存 hashCode

```java
// Records 作为 Map 键性能良好
Map<Point, String> pointMap = new HashMap<>();

// equals 和 hashCode 被自动生成并优化
record Point(int x, int y) {}

// 大量 Records 的性能测试
@Benchmark
public void recordCreation() {
    for (int i = 0; i < 1000000; i++) {
        new Point(i, i);
    }
}
```

### 文本块性能

文本块在编译时处理，运行时与普通字符串完全相同：

```java
// 编译后等效于普通字符串连接
String textBlock = """
    Hello
    World
    """;

// 等同于
String normal = "Hello\nWorld\n";
```

### Switch 表达式性能

Switch 表达式编译为高效的字节码：

- **表查找（tableswitch）**：连续整数值
- **查找表（lookupswitch）**：离散值
- **字符串 switch**：使用 hashCode 优化

```java
// 枚举 switch 特别高效
public String status(OrderStatus status) {
    return switch (status) {
        case PENDING -> "待处理";
        case PROCESSING -> "处理中";
        case COMPLETED -> "已完成";
    };
}
// 编译为高效的 tableswitch 指令
```

## 实战场景

### 场景1：API 响应处理

```java
// 使用密封类型建模 API 响应
public sealed interface ApiResponse<T> permits ApiResponse.Success, ApiResponse.Error {

    boolean isSuccess();

    record Success<T>(T data, Map<String, String> headers) implements ApiResponse<T> {
        public Success {
            headers = headers != null ? Map.copyOf(headers) : Map.of();
        }

        @Override
        public boolean isSuccess() { return true; }
    }

    record Error<T>(int code, String message, List<String> details) implements ApiResponse<T> {
        public Error {
            details = details != null ? List.copyOf(details) : List.of();
        }

        @Override
        public boolean isSuccess() { return false; }
    }

    static <T> ApiResponse<T> success(T data) {
        return new Success<>(data, Map.of());
    }

    static <T> ApiResponse<T> error(int code, String message) {
        return new Error<>(code, message, List.of());
    }
}

// 使用模式匹配处理响应
public void handleResponse(ApiResponse<?> response) {
    switch (response) {
        case ApiResponse.Success<?> s -> {
            System.out.println("成功: " + s.data());
            s.headers().forEach((k, v) -> System.out.println(k + ": " + v));
        }
        case ApiResponse.Error<?> e -> {
            System.err.println("错误 " + e.code() + ": " + e.message());
            e.details().forEach(d -> System.err.println("  - " + d));
        }
    }
}
```

### 场景2：配置管理

```java
// 使用 Records 和文本块构建配置
public record AppConfig(
    ServerConfig server,
    DatabaseConfig database,
    LogConfig logging
) {
    public AppConfig {
        Objects.requireNonNull(server);
        Objects.requireNonNull(database);
        Objects.requireNonNull(logging);
    }

    public String toYaml() {
        return """
            server:
              host: %s
              port: %d
              ssl: %s

            database:
              url: %s
              username: %s
              poolSize: %d

            logging:
              level: %s
              pattern: %s
            """.formatted(
                server.host(), server.port(), server.ssl(),
                database.url(), database.username(), database.poolSize(),
                logging.level(), logging.pattern()
            );
    }
}

public record ServerConfig(String host, int port, boolean ssl) {
    public ServerConfig {
        if (host == null || host.isBlank()) host = "localhost";
        if (port <= 0 || port > 65535) port = 8080;
    }
}

public record DatabaseConfig(String url, String username, String password, int poolSize) {
    public DatabaseConfig {
        Objects.requireNonNull(url);
        Objects.requireNonNull(username);
        if (poolSize <= 0) poolSize = 10;
    }
}

public record LogConfig(String level, String pattern) {
    public LogConfig {
        if (level == null) level = "INFO";
        if (pattern == null) pattern = "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n";
    }
}
```

### 场景3：状态机实现

```java
// 使用密封类实现状态机
public sealed interface OrderState permits
    Created, Paid, Shipped, Delivered, Cancelled {

    String name();

    default OrderState pay() {
        throw new IllegalStateException("当前状态不支持支付: " + name());
    }

    default OrderState ship() {
        throw new IllegalStateException("当前状态不支持发货: " + name());
    }

    default OrderState deliver() {
        throw new IllegalStateException("当前状态不支持确认送达: " + name());
    }

    default OrderState cancel() {
        throw new IllegalStateException("当前状态不支持取消: " + name());
    }
}

public record Created() implements OrderState {
    @Override public String name() { return "已创建"; }

    @Override
    public OrderState pay() { return new Paid(); }

    @Override
    public OrderState cancel() { return new Cancelled("用户取消"); }
}

public record Paid() implements OrderState {
    @Override public String name() { return "已支付"; }

    @Override
    public OrderState ship() { return new Shipped(LocalDateTime.now()); }

    @Override
    public OrderState cancel() { return new Cancelled("退款取消"); }
}

public record Shipped(LocalDateTime shippedAt) implements OrderState {
    @Override public String name() { return "已发货"; }

    @Override
    public OrderState deliver() { return new Delivered(LocalDateTime.now()); }
}

public record Delivered(LocalDateTime deliveredAt) implements OrderState {
    @Override public String name() { return "已送达"; }
}

public record Cancelled(String reason) implements OrderState {
    @Override public String name() { return "已取消"; }
}

// 订单类使用状态机
public class Order {
    private final String id;
    private OrderState state;

    public Order(String id) {
        this.id = id;
        this.state = new Created();
    }

    public void pay() {
        state = state.pay();
        log("订单已支付");
    }

    public void ship() {
        state = state.ship();
        log("订单已发货");
    }

    public void deliver() {
        state = state.deliver();
        log("订单已送达");
    }

    public void cancel() {
        state = state.cancel();
        log("订单已取消");
    }

    public String getStatus() {
        return switch (state) {
            case Created c -> "待支付";
            case Paid p -> "待发货";
            case Shipped s -> "运输中，发货时间: " + s.shippedAt();
            case Delivered d -> "已完成，送达时间: " + d.deliveredAt();
            case Cancelled c -> "已取消，原因: " + c.reason();
        };
    }

    private void log(String message) {
        System.out.println("[订单 " + id + "] " + message + " - 状态: " + state.name());
    }
}
```

### 场景4：JSON 序列化/反序列化

```java
// 使用 Records 进行 JSON 数据传输
public record UserDTO(
    String id,
    String username,
    String email,
    UserProfile profile,
    List<String> roles,
    LocalDateTime createdAt
) {
    public UserDTO {
        Objects.requireNonNull(id);
        Objects.requireNonNull(username);
        roles = roles != null ? List.copyOf(roles) : List.of();
    }
}

public record UserProfile(
    String displayName,
    String avatar,
    String bio
) {
    public UserProfile {
        if (displayName == null || displayName.isBlank()) {
            displayName = "用户";
        }
    }
}

// 使用文本块作为 JSON 测试数据
public class JsonTestData {
    public static final String USER_JSON = """
        {
            "id": "user-001",
            "username": "zhangsan",
            "email": "zhangsan@example.com",
            "profile": {
                "displayName": "张三",
                "avatar": "https://example.com/avatar.jpg",
                "bio": "Java 开发者"
            },
            "roles": ["USER", "ADMIN"],
            "createdAt": "2024-01-15T10:30:00"
        }
        """;

    public static final String USER_LIST_JSON = """
        [
            {"id": "user-001", "username": "zhangsan"},
            {"id": "user-002", "username": "lisi"},
            {"id": "user-003", "username": "wangwu"}
        ]
        """;
}
```

## 面试要点

### 高频面试题

**1. 密封类与 final 类、抽象类的区别是什么？**

| 特性 | final 类 | 抽象类 | 密封类 |
|------|---------|-------|-------|
| 可继承 | 否 | 是（无限制） | 是（受限制） |
| 可实例化 | 是 | 否 | 取决于是否抽象 |
| 穷尽性检查 | 无意义 | 不支持 | 支持 |
| 使用场景 | 禁止继承 | 模板模式 | 受控类型层次 |

**2. 模式匹配中的作用域规则是什么？**

- 模式变量在 instanceof 返回 true 的分支中有效
- 可以与 `&&` 组合使用（在右侧表达式中有效）
- 不能与 `||` 组合使用（因为左侧为 false 时会短路）
- 在否定条件后，如果之后的代码必然执行，变量也有效

**3. Records 可以被继承吗？为什么？**

不可以。Records 是隐式 final 的，原因：
- Records 的语义是数据载体，其等价性基于所有组件
- 如果允许继承，子类可能添加新组件，破坏等价性语义
- 不可变性保证也会被破坏

**4. 文本块与字符串连接有什么区别？**

- **编译时处理**：文本块在编译时处理，运行时是普通字符串
- **空白处理**：自动移除偶发空白（公共前导空白）
- **可读性**：多行文本更加清晰
- **性能**：没有运行时连接开销

**5. Switch 表达式中 yield 和 return 的区别？**

- `yield` 用于从 switch 表达式的代码块中返回值
- `return` 用于从方法中返回
- 在 switch 表达式的代码块中，必须使用 `yield`，不能使用 `return`

### 进阶问题

**6. 如何设计一个类型安全的 Result 类型？**

```java
public sealed interface Result<T> permits Result.Ok, Result.Err {

    record Ok<T>(T value) implements Result<T> {}
    record Err<T>(Exception error) implements Result<T> {}

    default T getOrThrow() {
        return switch (this) {
            case Ok<T> ok -> ok.value();
            case Err<T> err -> throw new RuntimeException(err.error());
        };
    }

    default <U> Result<U> map(Function<T, U> mapper) {
        return switch (this) {
            case Ok<T> ok -> new Ok<>(mapper.apply(ok.value()));
            case Err<T> err -> new Err<>(err.error());
        };
    }
}
```

**7. Records 的紧凑构造器和规范构造器有什么区别？**

- **规范构造器**：显式声明参数，需要手动赋值字段
- **紧凑构造器**：省略参数列表，编译器自动在末尾添加字段赋值
- 紧凑构造器可以修改参数值，修改后的值会被赋给字段
- 两者不能同时存在

**8. 密封类的子类必须满足什么条件？**

- 必须直接继承/实现密封类型
- 必须位于同一模块（如果密封类型在命名模块中）或同一包（如果在未命名模块中）
- 必须使用 `final`、`sealed` 或 `non-sealed` 修饰
- 如果是 sealed，必须有自己的 permits 子句
- 如果是 non-sealed，则打开了继承限制

**9. 模式匹配如何处理泛型？**

```java
// 由于类型擦除，泛型信息在运行时不可用
if (obj instanceof List<String> list) {  // 编译错误
    // ...
}

// 正确方式：使用通配符
if (obj instanceof List<?> list) {
    // 需要运行时检查元素类型
    boolean allStrings = list.stream().allMatch(e -> e instanceof String);
}
```

**10. Java 17 新特性如何改进领域驱动设计（DDD）的实现？**

- **值对象**：使用 Records 实现不可变值对象
- **领域事件**：使用 sealed interface + Records 建模事件类型
- **聚合状态**：使用 sealed classes 表示有限的状态转换
- **规格模式**：使用模式匹配实现复杂业务规则

## 延伸阅读

### 官方文档

- [JEP 409: Sealed Classes](https://openjdk.org/jeps/409)
- [JEP 394: Pattern Matching for instanceof](https://openjdk.org/jeps/394)
- [JEP 395: Records](https://openjdk.org/jeps/395)
- [JEP 378: Text Blocks](https://openjdk.org/jeps/378)
- [JEP 361: Switch Expressions](https://openjdk.org/jeps/361)
- [Oracle Java 17 Release Notes](https://www.oracle.com/java/technologies/javase/17-relnote-issues.html)

### 推荐书籍

- **《Effective Java》第三版** - Joshua Bloch（虽然主要针对 Java 8/9，但原则仍然适用）
- **《Modern Java in Action》** - Raoul-Gabriel Urma（深入讲解 Java 8+ 特性）
- **《Java: The Complete Reference》第12版** - Herbert Schildt（包含 Java 17 内容）

### 相关资源

- [Baeldung Java 17 Features](https://www.baeldung.com/java-17-new-features)
- [InfoQ Java 17 Coverage](https://www.infoq.com/java-17/)
- [Inside Java (Oracle 官方博客)](https://inside.java/)
- [OpenJDK 官方网站](https://openjdk.org/)

### 迁移指南

- [Oracle Java 17 Migration Guide](https://docs.oracle.com/en/java/javase/17/migrate/)
- [Spring Boot 3.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide)（要求 Java 17）

### 相关技术

- **Project Amber**：Java 语言增强项目，包括更多模式匹配特性
- **Project Valhalla**：值类型和泛型特化
- **Project Loom**：虚拟线程（Java 21 正式发布）
- **Project Panama**：外部函数和内存 API

## 总结

Java 17 作为重要的 LTS 版本，引入了多项改变 Java 编程方式的重要特性：

1. **密封类**：提供了精确控制类继承层次的能力，结合模式匹配实现类型安全的多态处理

2. **模式匹配**：简化了类型检查和转换的代码，消除了冗余的强制类型转换

3. **记录类**：为不可变数据类提供了简洁的语法，减少了大量样板代码

4. **文本块**：改善了多行字符串的处理方式，特别适合 HTML、JSON、SQL 等场景

5. **Switch 表达式**：增强了 switch 的表达能力，支持返回值和穷尽性检查

这些特性相互配合，使 Java 代码更加简洁、安全、可维护。建议开发者：

- 在新项目中积极采用这些特性
- 现有项目升级到 Java 17 时，逐步重构代码以利用新特性
- 关注 Java 的持续演进，如 Java 21 中的虚拟线程、Record 模式等

掌握 Java 17 的新特性，是成为现代 Java 开发者的必备技能。
