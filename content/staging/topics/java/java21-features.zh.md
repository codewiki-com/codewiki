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
origin: old/src/content/docs/java/java21-features.zh.md
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

Java 21 是继 Java 17 之后的又一个长期支持（LTS）版本，于 2023 年 9 月发布。这个版本带来了多项革命性的特性，彻底改变了 Java 的并发编程模型和语言表达能力。本文将深入剖析 Java 21 中最重要的五大特性：虚拟线程、结构化并发、模式匹配 Switch、记录模式和字符串模板。

## 概念解释

### 什么是 Java 21 LTS

Java 21 是 Oracle 的长期支持版本，这意味着它将获得至少 8 年的安全更新和技术支持。对于企业级应用来说，选择 LTS 版本意味着稳定性和长期可维护性的保障。

Java 21 引入的核心特性包括：

| 特性 | JEP 编号 | 状态 | 描述 |
|------|---------|------|------|
| **虚拟线程** | JEP 444 | 正式发布 | 轻量级线程，大幅提升并发性能 |
| **结构化并发** | JEP 453 | 预览 | 简化多线程任务的管理和取消 |
| **模式匹配 Switch** | JEP 441 | 正式发布 | 增强 switch 表达式的模式匹配能力 |
| **记录模式** | JEP 440 | 正式发布 | 解构 Record 类型的强大模式 |
| **字符串模板** | JEP 430 | 预览 | 更安全、更灵活的字符串插值 |

### 为什么这些特性很重要

**并发编程革命**：虚拟线程和结构化并发解决了 Java 传统线程模型的根本问题——线程资源昂贵且难以管理。现在可以轻松创建数百万个并发任务。

**类型安全增强**：模式匹配 Switch 和记录模式让代码更加简洁、类型安全，减少了大量样板代码和潜在的运行时错误。

**字符串处理现代化**：字符串模板提供了安全的字符串插值机制，避免了 SQL 注入等安全问题。

## 核心原理

### 虚拟线程的工作原理

虚拟线程（Virtual Threads）采用 M:N 调度模型，将大量虚拟线程映射到少量的平台线程（载体线程）上。

```
┌─────────────────────────────────────────────────────────────┐
│                        应用层                                │
│  ┌────────┐ ┌────────┐ ┌────────┐      ┌────────┐          │
│  │VThread1│ │VThread2│ │VThread3│ ... │VThreadN│          │
│  └───┬────┘ └───┬────┘ └───┬────┘      └───┬────┘          │
├──────┼─────────┼─────────┼──────────────┼──────────────────┤
│      └─────────┴─────────┴──────────────┘                   │
│                        ↓                                     │
│              JVM 虚拟线程调度器                               │
│           (ForkJoinPool 工作窃取)                            │
├─────────────────────────────────────────────────────────────┤
│                     载体线程层                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │Carrier1│ │Carrier2│ │Carrier3│ │Carrier4│               │
│  │(平台线程)│ │(平台线程)│ │(平台线程)│ │(平台线程)│               │
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘               │
├──────┴─────────┴─────────┴─────────┴───────────────────────┤
│                     操作系统调度器                            │
└─────────────────────────────────────────────────────────────┘
```

**关键机制**：

1. **挂载/卸载**：当虚拟线程执行阻塞 I/O 时，它会从载体线程上"卸载"，让载体线程执行其他虚拟线程
2. **续体（Continuation）**：虚拟线程的执行状态被保存在堆内存中，可以随时暂停和恢复
3. **工作窃取**：调度器使用 ForkJoinPool 的工作窃取算法，高效利用 CPU 资源

### 模式匹配的类型系统

模式匹配 Switch 基于 Java 类型系统的子类型关系，在编译期进行穷尽性检查：

```java
// 编译器会检查所有可能的类型
sealed interface Shape permits Circle, Rectangle, Triangle {}

String describe(Shape shape) {
    return switch (shape) {
        case Circle c    -> "圆形，半径: " + c.radius();
        case Rectangle r -> "矩形，宽: " + r.width() + "，高: " + r.height();
        case Triangle t  -> "三角形";
        // 不需要 default，因为 sealed 类型保证了穷尽性
    };
}
```

### 字符串模板的处理流程

字符串模板（String Templates）在编译期将模板拆分为字符串片段和嵌入表达式，运行时由模板处理器组合：

```
模板: "Hello, \{name}! You have \{count} messages."
        ↓ 编译期拆分
片段: ["Hello, ", "! You have ", " messages."]
表达式: [name, count]
        ↓ 运行时处理
模板处理器: STR / FMT / 自定义处理器
        ↓
最终结果: "Hello, Alice! You have 5 messages."
```

## 核心要点

### 虚拟线程核心要点

| 特性 | 平台线程 | 虚拟线程 |
|------|---------|---------|
| 内存占用 | 1-2 MB/线程 | ~1 KB/线程 |
| 创建成本 | 高（涉及 OS 调用） | 极低（JVM 内部操作） |
| 最大数量 | 数千个 | 数百万个 |
| 调度方式 | OS 内核调度 | JVM 用户态调度 |
| 适用场景 | CPU 密集型 | I/O 密集型 |
| 阻塞代价 | 高（浪费 OS 线程） | 低（仅暂停虚拟线程） |

**虚拟线程创建方式**：

```java
// 方式一：直接启动
Thread vThread = Thread.startVirtualThread(() -> doTask());

// 方式二：构建器模式
Thread vThread = Thread.ofVirtual()
    .name("worker-", 1)
    .start(() -> doTask());

// 方式三：执行器（推荐）
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> doTask());
}
```

### 模式匹配 Switch 核心要点

**支持的模式类型**：

1. **类型模式**：`case String s`
2. **守卫模式**：`case String s when s.length() > 5`
3. **null 模式**：`case null`
4. **记录模式**：`case Point(int x, int y)`
5. **嵌套模式**：`case Box(Point(int x, int y))`

**穷尽性规则**：

- `sealed` 类型：必须覆盖所有子类型
- 非密封类型：必须有 `default` 分支
- 枚举类型：必须覆盖所有枚举值

### 记录模式核心要点

记录模式允许在一次操作中同时进行类型检查和组件提取：

```java
// 传统方式
if (obj instanceof Point) {
    Point p = (Point) obj;
    int x = p.x();
    int y = p.y();
    // 使用 x 和 y
}

// 记录模式（Java 21）
if (obj instanceof Point(int x, int y)) {
    // 直接使用 x 和 y
}
```

### 字符串模板核心要点

**内置处理器**：

| 处理器 | 用途 | 示例 |
|--------|------|------|
| `STR` | 基本字符串插值 | `STR."Hello, \{name}!"` |
| `FMT` | 格式化字符串 | `FMT."%.2f\{price}"` |
| `RAW` | 返回 StringTemplate 对象 | 自定义处理 |

**安全优势**：

- 模板处理器可以验证和转义嵌入的值
- 防止 SQL 注入、XSS 等安全漏洞
- 编译期检查嵌入表达式的类型

## 代码示例

### 示例一：虚拟线程高并发服务器

```java
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.Executors;

/**
 * 使用虚拟线程的高并发 HTTP 服务器
 * 可以同时处理数十万个并发连接
 */
public class VirtualThreadServer {

    public static void main(String[] args) throws Exception {
        try (var serverSocket = new ServerSocket(8080);
             // 每个连接一个虚拟线程，无需担心线程池大小
             var executor = Executors.newVirtualThreadPerTaskExecutor()) {

            System.out.println("服务器启动在端口 8080，使用虚拟线程处理请求");

            while (true) {
                Socket clientSocket = serverSocket.accept();
                executor.submit(() -> handleRequest(clientSocket));
            }
        }
    }

    private static void handleRequest(Socket socket) {
        try (socket) {
            // 读取请求
            var reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(socket.getInputStream()));
            String requestLine = reader.readLine();

            // 模拟数据库查询（阻塞操作）
            Thread.sleep(100);

            // 发送响应
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

### 示例二：结构化并发聚合服务

```java
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.Future;

/**
 * 使用结构化并发并行调用多个服务
 */
public class StructuredConcurrencyExample {

    record UserData(String profile, String orders, String recommendations) {}

    /**
     * 并行获取用户的多种数据，任一失败则全部取消
     */
    public static UserData fetchUserData(String userId) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

            // 并行执行三个子任务
            Future<String> profileFuture = scope.fork(() -> fetchProfile(userId));
            Future<String> ordersFuture = scope.fork(() -> fetchOrders(userId));
            Future<String> recommendationsFuture = scope.fork(() -> fetchRecommendations(userId));

            // 等待所有任务完成或任一失败
            scope.join();

            // 如果有任务失败，抛出异常
            scope.throwIfFailed();

            // 组合结果
            return new UserData(
                profileFuture.resultNow(),
                ordersFuture.resultNow(),
                recommendationsFuture.resultNow()
            );
        }
    }

    /**
     * 竞速模式：返回最快完成的结果
     */
    public static String fetchFromFastestSource(String key) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {

            // 同时从多个数据源获取
            scope.fork(() -> fetchFromCache(key));
            scope.fork(() -> fetchFromPrimaryDB(key));
            scope.fork(() -> fetchFromReplicaDB(key));

            // 等待第一个成功的结果
            scope.join();

            return scope.result();
        }
    }

    // 模拟服务调用
    private static String fetchProfile(String userId) throws InterruptedException {
        Thread.sleep(100);
        return "{\"name\": \"张三\", \"email\": \"zhangsan@example.com\"}";
    }

    private static String fetchOrders(String userId) throws InterruptedException {
        Thread.sleep(150);
        return "[{\"orderId\": \"001\", \"amount\": 299.99}]";
    }

    private static String fetchRecommendations(String userId) throws InterruptedException {
        Thread.sleep(80);
        return "[\"商品A\", \"商品B\", \"商品C\"]";
    }

    private static String fetchFromCache(String key) throws InterruptedException {
        Thread.sleep(20);
        return "缓存数据: " + key;
    }

    private static String fetchFromPrimaryDB(String key) throws InterruptedException {
        Thread.sleep(100);
        return "主库数据: " + key;
    }

    private static String fetchFromReplicaDB(String key) throws InterruptedException {
        Thread.sleep(80);
        return "从库数据: " + key;
    }

    public static void main(String[] args) throws Exception {
        // 测试并行获取
        UserData userData = fetchUserData("user-123");
        System.out.println("用户数据: " + userData);

        // 测试竞速模式
        String fastResult = fetchFromFastestSource("config-key");
        System.out.println("最快结果: " + fastResult);
    }
}
```

### 示例三：模式匹配 Switch 综合示例

```java
/**
 * 模式匹配 Switch 的各种用法
 */
public class PatternMatchingSwitchExample {

    // 密封接口定义
    sealed interface JsonValue permits JsonString, JsonNumber, JsonBoolean, JsonNull, JsonArray, JsonObject {}

    record JsonString(String value) implements JsonValue {}
    record JsonNumber(double value) implements JsonValue {}
    record JsonBoolean(boolean value) implements JsonValue {}
    record JsonNull() implements JsonValue {}
    record JsonArray(java.util.List<JsonValue> values) implements JsonValue {}
    record JsonObject(java.util.Map<String, JsonValue> fields) implements JsonValue {}

    /**
     * 类型模式匹配
     */
    public static String formatValue(Object obj) {
        return switch (obj) {
            case null -> "null";
            case Integer i -> "整数: " + i;
            case Long l -> "长整数: " + l;
            case Double d -> "浮点数: %.2f".formatted(d);
            case String s -> "字符串: \"" + s + "\"";
            case int[] arr -> "整数数组，长度: " + arr.length;
            default -> "未知类型: " + obj.getClass().getSimpleName();
        };
    }

    /**
     * 带守卫条件的模式匹配
     */
    public static String classifyNumber(Number n) {
        return switch (n) {
            case Integer i when i < 0 -> "负整数";
            case Integer i when i == 0 -> "零";
            case Integer i when i > 0 && i <= 100 -> "小正整数 (1-100)";
            case Integer i -> "大正整数 (>100)";
            case Double d when d.isNaN() -> "非数字";
            case Double d when d.isInfinite() -> "无穷大";
            case Double d when d < 0 -> "负浮点数";
            case Double d -> "正浮点数";
            default -> "其他数值类型";
        };
    }

    /**
     * 处理 JSON 值（密封类型穷尽性匹配）
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
            // 无需 default，sealed 类型保证穷尽性
        };
    }

    /**
     * null 处理
     */
    public static String handleNullable(String input) {
        return switch (input) {
            case null -> "输入为空";
            case String s when s.isBlank() -> "输入为空白字符串";
            case String s -> "输入内容: " + s;
        };
    }

    private static String escapeString(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\t", "\\t");
    }

    public static void main(String[] args) {
        // 类型模式测试
        System.out.println(formatValue(42));
        System.out.println(formatValue(3.14159));
        System.out.println(formatValue("Hello"));
        System.out.println(formatValue(null));

        // 守卫条件测试
        System.out.println(classifyNumber(-5));
        System.out.println(classifyNumber(0));
        System.out.println(classifyNumber(50));
        System.out.println(classifyNumber(200));

        // JSON 测试
        var json = new JsonObject(java.util.Map.of(
            "name", new JsonString("张三"),
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

### 示例四：记录模式深度解构

```java
import java.util.List;
import java.util.Optional;

/**
 * 记录模式的各种用法
 */
public class RecordPatternsExample {

    // 定义记录类型
    record Point(int x, int y) {}
    record Size(int width, int height) {}
    record Rectangle(Point topLeft, Size size) {}
    record Circle(Point center, int radius) {}
    record ColoredShape<T>(T shape, String color) {}

    // 嵌套记录
    record Person(String name, Address address) {}
    record Address(String city, String street, int zipCode) {}

    // 表达式树
    sealed interface Expr permits Num, Add, Mul, Neg {}
    record Num(int value) implements Expr {}
    record Add(Expr left, Expr right) implements Expr {}
    record Mul(Expr left, Expr right) implements Expr {}
    record Neg(Expr operand) implements Expr {}

    /**
     * 基本记录模式匹配
     */
    public static double calculateArea(Object shape) {
        return switch (shape) {
            case Rectangle(Point p, Size(int w, int h)) -> (double) w * h;
            case Circle(Point c, int r) -> Math.PI * r * r;
            default -> 0.0;
        };
    }

    /**
     * 嵌套记录解构
     */
    public static String getPersonLocation(Person person) {
        return switch (person) {
            case Person(var name, Address(var city, _, _)) ->
                name + " 住在 " + city;
        };
    }

    /**
     * 泛型记录模式
     */
    public static String describeColoredShape(ColoredShape<?> cs) {
        return switch (cs) {
            case ColoredShape(Rectangle(_, Size(int w, int h)), String color) ->
                color + " 矩形，面积: " + (w * h);
            case ColoredShape(Circle(_, int r), String color) ->
                color + " 圆形，面积: " + (Math.PI * r * r);
            case ColoredShape(var shape, String color) ->
                color + " " + shape.getClass().getSimpleName();
        };
    }

    /**
     * 表达式求值（递归模式匹配）
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
     * 表达式简化（模式匹配优化）
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
            // 常量折叠
            case Add(Num(int a), Num(int b)) -> new Num(a + b);
            case Mul(Num(int a), Num(int b)) -> new Num(a * b);
            case Neg(Num(int v)) -> new Num(-v);
            // 递归简化
            case Add(Expr left, Expr right) -> new Add(simplify(left), simplify(right));
            case Mul(Expr left, Expr right) -> new Mul(simplify(left), simplify(right));
            case Neg(Expr operand) -> new Neg(simplify(operand));
            case Num n -> n;
        };
    }

    /**
     * if-instanceof 中使用记录模式
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
        // 基本记录模式
        var rect = new Rectangle(new Point(0, 0), new Size(10, 20));
        var circle = new Circle(new Point(5, 5), 7);
        System.out.println("矩形面积: " + calculateArea(rect));
        System.out.println("圆形面积: " + calculateArea(circle));

        // 嵌套解构
        var person = new Person("李四", new Address("北京", "长安街", 100000));
        System.out.println(getPersonLocation(person));

        // 泛型记录模式
        var coloredRect = new ColoredShape<>(rect, "红色");
        System.out.println(describeColoredShape(coloredRect));

        // 表达式求值
        // 表达式: (3 + 5) * 2 - 1 = 15
        Expr expr = new Add(
            new Mul(new Add(new Num(3), new Num(5)), new Num(2)),
            new Neg(new Num(1))
        );
        System.out.println("表达式结果: " + evaluate(expr));

        // 表达式简化
        Expr toSimplify = new Add(new Num(0), new Mul(new Num(1), new Num(5)));
        System.out.println("简化前: " + toSimplify);
        System.out.println("简化后: " + simplify(toSimplify));
    }
}
```

### 示例五：字符串模板实战

```java
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * 字符串模板的各种用法
 * 注意：这是预览功能，需要使用 --enable-preview 编译和运行
 */
public class StringTemplatesExample {

    /**
     * 基本字符串模板 - STR 处理器
     */
    public static void basicTemplates() {
        String name = "张三";
        int age = 25;
        double score = 95.5;

        // 基本插值
        String greeting = STR."你好，\{name}！";
        System.out.println(greeting);

        // 多值插值
        String info = STR."姓名: \{name}, 年龄: \{age}, 分数: \{score}";
        System.out.println(info);

        // 表达式插值
        String calculation = STR."明年 \{name} 将会 \{age + 1} 岁";
        System.out.println(calculation);

        // 方法调用
        String upperName = STR."大写名字: \{name.toUpperCase()}";
        System.out.println(upperName);

        // 多行模板
        String html = STR."""
            <html>
                <head><title>用户信息</title></head>
                <body>
                    <h1>欢迎，\{name}！</h1>
                    <p>您的年龄是 \{age} 岁。</p>
                    <p>您的分数是 \{score} 分。</p>
                </body>
            </html>
            """;
        System.out.println(html);
    }

    /**
     * FMT 处理器 - 格式化字符串
     */
    public static void formattedTemplates() {
        double price = 1234.5678;
        int quantity = 42;
        double total = price * quantity;

        // 格式化数字
        String formatted = FMT."单价: ￥%.2f\{price}, 数量: %d\{quantity}, 总计: ￥%,.2f\{total}";
        System.out.println(formatted);

        // 日期格式化
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String dateStr = FMT."当前时间: %tF %<tT\{now}";
        System.out.println(dateStr);

        // 对齐格式化
        String[] items = {"苹果", "香蕉", "橙子"};
        double[] prices = {5.5, 3.2, 4.8};
        System.out.println("商品列表：");
        for (int i = 0; i < items.length; i++) {
            System.out.println(FMT."  %-10s\{items[i]} ￥%6.2f\{prices[i]}");
        }
    }

    /**
     * 自定义模板处理器 - 安全的 SQL 构建
     */
    public static StringTemplate.Processor<PreparedStatement, java.sql.SQLException> SQL(Connection conn) {
        return template -> {
            // 将模板转换为 PreparedStatement
            StringBuilder sql = new StringBuilder();
            var fragments = template.fragments();

            for (int i = 0; i < fragments.size(); i++) {
                sql.append(fragments.get(i));
                if (i < template.values().size()) {
                    sql.append("?");
                }
            }

            PreparedStatement stmt = conn.prepareStatement(sql.toString());

            // 设置参数
            int paramIndex = 1;
            for (Object value : template.values()) {
                stmt.setObject(paramIndex++, value);
            }

            return stmt;
        };
    }

    /**
     * 使用安全 SQL 模板
     */
    public static void safeSqlExample(Connection conn) throws Exception {
        String userName = "张三'; DROP TABLE users; --"; // 恶意输入
        int minAge = 18;

        // 使用自定义 SQL 处理器，自动防止 SQL 注入
        var SQL = SQL(conn);
        try (PreparedStatement stmt = SQL."""
            SELECT * FROM users
            WHERE name = \{userName}
            AND age >= \{minAge}
            """) {

            ResultSet rs = stmt.executeQuery();
            // 处理结果...
        }
    }

    /**
     * 自定义模板处理器 - JSON 构建器
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
        String name = "李四";
        int age = 30;
        boolean active = true;
        String bio = "喜欢编程\n热爱开源";

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
     * RAW 处理器 - 获取原始模板
     */
    public static void rawTemplateExample() {
        String name = "王五";
        int count = 5;

        // RAW 返回 StringTemplate 对象，可用于自定义处理
        StringTemplate template = RAW."用户 \{name} 有 \{count} 条消息";

        System.out.println("片段: " + template.fragments());
        System.out.println("值: " + template.values());

        // 可以手动处理
        String result = template.interpolate();
        System.out.println("插值结果: " + result);
    }

    public static void main(String[] args) {
        System.out.println("=== 基本模板 ===");
        basicTemplates();

        System.out.println("\n=== 格式化模板 ===");
        formattedTemplates();

        System.out.println("\n=== JSON 模板 ===");
        jsonTemplateExample();

        System.out.println("\n=== RAW 模板 ===");
        rawTemplateExample();
    }
}
```

## 最佳实践

### 虚拟线程最佳实践

```java
/**
 * 虚拟线程使用最佳实践
 */
public class VirtualThreadBestPractices {

    // 1. 每个任务一个虚拟线程，不要池化
    public void goodPractice() {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 100000; i++) {
                executor.submit(() -> handleRequest());
            }
        }
    }

    // 错误：不要为虚拟线程创建固定大小的池
    public void badPractice() {
        // 这违背了虚拟线程的设计初衷
        // ExecutorService badPool = Executors.newFixedThreadPool(100, Thread.ofVirtual().factory());
    }

    // 2. 使用 ReentrantLock 替代 synchronized 避免固定
    private final java.util.concurrent.locks.ReentrantLock lock =
        new java.util.concurrent.locks.ReentrantLock();

    public void avoidPinning() {
        lock.lock();
        try {
            // 在锁内执行阻塞操作不会导致固定
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    // 3. 使用 try-with-resources 管理执行器
    public void properResourceManagement() {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            executor.submit(() -> task1());
            executor.submit(() -> task2());
        } // 自动等待所有任务完成并关闭
    }

    // 4. 虚拟线程适合 I/O 密集型，平台线程适合 CPU 密集型
    public void chooseRightThreadType() {
        // I/O 密集型：虚拟线程
        try (var ioExecutor = Executors.newVirtualThreadPerTaskExecutor()) {
            ioExecutor.submit(() -> makeHttpRequest());
            ioExecutor.submit(() -> queryDatabase());
        }

        // CPU 密集型：平台线程
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

### 模式匹配最佳实践

```java
/**
 * 模式匹配最佳实践
 */
public class PatternMatchingBestPractices {

    // 1. 优先使用密封类型，让编译器检查穷尽性
    sealed interface Result<T> permits Success, Failure {}
    record Success<T>(T value) implements Result<T> {}
    record Failure<T>(String error) implements Result<T> {}

    public <T> T handleResult(Result<T> result) {
        return switch (result) {
            case Success<T>(T value) -> value;
            case Failure<T>(String error) -> throw new RuntimeException(error);
            // 无需 default，编译器保证穷尽性
        };
    }

    // 2. 将最具体的模式放在前面
    public String process(Object obj) {
        return switch (obj) {
            // 具体类型优先
            case String s when s.isEmpty() -> "空字符串";
            case String s -> "字符串: " + s;
            // 通用类型在后
            case CharSequence cs -> "字符序列: " + cs;
            default -> "其他类型";
        };
    }

    // 3. 使用守卫条件代替复杂的 if-else
    public String classifyAge(Object obj) {
        return switch (obj) {
            case Integer age when age < 0 -> "无效年龄";
            case Integer age when age < 18 -> "未成年";
            case Integer age when age < 60 -> "成年人";
            case Integer age -> "老年人";
            default -> "非整数类型";
        };
    }

    // 4. 利用记录模式简化数据提取
    record Order(String id, Customer customer, java.util.List<Item> items) {}
    record Customer(String name, String email) {}
    record Item(String product, int quantity, double price) {}

    public String formatOrderEmail(Order order) {
        return switch (order) {
            case Order(String id, Customer(String name, String email), var items) ->
                STR."""
                订单号: \{id}
                客户: \{name} (\{email})
                商品数: \{items.size()}
                """;
        };
    }

    // 5. 使用 _ 忽略不需要的组件
    public int getOrderItemCount(Order order) {
        return switch (order) {
            case Order(_, _, var items) -> items.size();
        };
    }
}
```

### 字符串模板最佳实践

```java
/**
 * 字符串模板最佳实践
 */
public class StringTemplateBestPractices {

    // 1. 为敏感操作创建专用处理器
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

    // 2. 使用 FMT 进行精确的格式控制
    public static String formatPrice(double price, int quantity) {
        return FMT."单价: ￥%,.2f\{price} x %d\{quantity} = ￥%,.2f\{price * quantity}";
    }

    // 3. 利用多行模板提高可读性
    public static String generateEmail(String name, String product, double price) {
        return STR."""
            尊敬的 \{name}：

            感谢您购买我们的产品！

            订单详情：
            - 产品：\{product}
            - 价格：￥\{String.format("%.2f", price)}

            如有任何问题，请随时联系我们。

            此致
            销售团队
            """;
    }

    // 4. 避免在循环中创建大量临时字符串
    public static String buildList(java.util.List<String> items) {
        var sb = new StringBuilder();
        for (int i = 0; i < items.size(); i++) {
            sb.append(STR."\{i + 1}. \{items.get(i)}\n");
        }
        return sb.toString();
    }
}
```

## 常见陷阱

### 虚拟线程陷阱

```java
/**
 * 虚拟线程常见陷阱
 */
public class VirtualThreadPitfalls {

    // 陷阱 1：在 synchronized 块中执行阻塞操作导致固定
    private final Object monitor = new Object();

    // 错误：会导致虚拟线程固定
    public void pinnedExample() {
        synchronized (monitor) {
            try {
                Thread.sleep(1000); // 阻塞操作
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    // 正确：使用 ReentrantLock
    private final java.util.concurrent.locks.ReentrantLock lock =
        new java.util.concurrent.locks.ReentrantLock();

    public void correctExample() {
        lock.lock();
        try {
            Thread.sleep(1000); // 虚拟线程可以正常卸载
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    // 陷阱 2：过度依赖 ThreadLocal
    private static final ThreadLocal<byte[]> BUFFER = ThreadLocal.withInitial(() -> new byte[1024 * 1024]);

    // 错误：百万虚拟线程会消耗大量内存
    public void threadLocalPitfall() {
        try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1_000_000; i++) {
                executor.submit(() -> {
                    byte[] buffer = BUFFER.get(); // 每个虚拟线程 1MB
                    // 使用 buffer
                });
            }
        }
    }

    // 陷阱 3：忘记处理中断
    public void interruptionPitfall() {
        Thread.startVirtualThread(() -> {
            while (true) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    // 错误：忽略中断
                    // 正确做法：
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
    }

    // 陷阱 4：将虚拟线程用于 CPU 密集型任务
    public void cpuIntensivePitfall() {
        // 错误：CPU 密集型任务使用虚拟线程没有优势
        try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 1000; i++) {
                executor.submit(() -> {
                    // CPU 密集型计算
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

### 模式匹配陷阱

```java
/**
 * 模式匹配常见陷阱
 */
public class PatternMatchingPitfalls {

    // 陷阱 1：模式顺序错误导致无法到达的代码
    public String orderPitfall(Object obj) {
        return switch (obj) {
            // 错误：String 在 CharSequence 之后永远不会被匹配
            // case CharSequence cs -> "字符序列";
            // case String s -> "字符串"; // 编译错误：无法到达的代码

            // 正确：具体类型在前
            case String s -> "字符串";
            case CharSequence cs -> "字符序列";
            default -> "其他";
        };
    }

    // 陷阱 2：忘记处理 null
    public String nullPitfall(String input) {
        // 错误：如果 input 为 null，会抛出 NullPointerException
        // return switch (input) {
        //     case String s when s.isEmpty() -> "空";
        //     case String s -> s;
        // };

        // 正确：显式处理 null
        return switch (input) {
            case null -> "null 值";
            case String s when s.isEmpty() -> "空";
            case String s -> s;
        };
    }

    // 陷阱 3：守卫条件中的副作用
    private int counter = 0;

    public String sideEffectPitfall(Object obj) {
        // 错误：守卫条件不应有副作用
        // return switch (obj) {
        //     case Integer i when (counter++ > 0) -> "后续整数";
        //     case Integer i -> "第一个整数";
        //     default -> "其他";
        // };

        // 正确：守卫条件应该是纯表达式
        return switch (obj) {
            case Integer i when counter > 0 -> {
                counter++;
                yield "后续整数";
            }
            case Integer i -> {
                counter++;
                yield "第一个整数";
            }
            default -> "其他";
        };
    }

    // 陷阱 4：记录模式中的类型不匹配
    record Box<T>(T content) {}

    public String genericPitfall(Box<?> box) {
        // 注意：由于类型擦除，运行时无法检查泛型类型
        return switch (box) {
            // 这只检查 content 是否为 String，不检查 Box 的类型参数
            case Box(String s) -> "字符串盒子: " + s;
            case Box(Integer i) -> "整数盒子: " + i;
            case Box(var content) -> "其他盒子: " + content;
        };
    }
}
```

### 字符串模板陷阱

```java
/**
 * 字符串模板常见陷阱
 */
public class StringTemplatePitfalls {

    // 陷阱 1：在嵌入表达式中使用复杂逻辑
    public String complexExpressionPitfall(String name, int score) {
        // 错误：表达式过于复杂，难以维护
        // String result = STR."结果: \{score >= 90 ? "优秀" : score >= 80 ? "良好" : score >= 60 ? "及格" : "不及格"}";

        // 正确：将复杂逻辑提取到方法
        return STR."结果: \{getGrade(score)}";
    }

    private String getGrade(int score) {
        if (score >= 90) return "优秀";
        if (score >= 80) return "良好";
        if (score >= 60) return "及格";
        return "不及格";
    }

    // 陷阱 2：忘记处理特殊字符
    public String specialCharPitfall(String userInput) {
        // 错误：用户输入可能包含 HTML 特殊字符
        // String html = STR."<p>\{userInput}</p>";

        // 正确：使用自定义处理器转义
        return STR."<p>\{escapeHtml(userInput)}</p>";
    }

    private String escapeHtml(String s) {
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    // 陷阱 3：在循环中频繁创建字符串模板
    public String loopPitfall(java.util.List<String> items) {
        // 效率较低：每次迭代都创建新字符串
        String result = "";
        for (String item : items) {
            result = STR."\{result}\n- \{item}";
        }
        return result;

        // 更好的方式：使用 StringBuilder 或 Stream
        // return items.stream()
        //     .map(item -> STR."- \{item}")
        //     .collect(java.util.stream.Collectors.joining("\n"));
    }

    // 陷阱 4：混淆 STR 和 FMT
    public void processorConfusion(double value) {
        // STR 不支持格式说明符
        // String wrong = STR."值: %.2f\{value}"; // 输出: "值: %.2f123.456789"

        // FMT 支持格式说明符
        String correct = FMT."值: %.2f\{value}"; // 输出: "值: 123.46"
        System.out.println(correct);
    }
}
```

## 性能考量

### 虚拟线程性能分析

```java
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.*;

/**
 * 虚拟线程性能对比测试
 */
public class VirtualThreadPerformance {

    private static final int TASK_COUNT = 100_000;
    private static final Duration IO_DELAY = Duration.ofMillis(100);

    public static void main(String[] args) throws Exception {
        System.out.println("===== 虚拟线程 vs 平台线程性能对比 =====");
        System.out.println("任务数量: " + TASK_COUNT);
        System.out.println("模拟 I/O 延迟: " + IO_DELAY.toMillis() + "ms\n");

        // 预热
        warmUp();

        // 测试虚拟线程
        long virtualTime = testVirtualThreads();
        System.out.println("虚拟线程耗时: " + virtualTime + "ms");

        // 测试平台线程池
        long platformTime = testPlatformThreads();
        System.out.println("平台线程池(200)耗时: " + platformTime + "ms");

        System.out.println("\n虚拟线程快 " + (platformTime / (double) virtualTime) + " 倍");
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

**性能对比结果**（典型场景）：

| 场景 | 平台线程池(200) | 虚拟线程 | 提升 |
|------|----------------|---------|------|
| 10万个100ms I/O任务 | ~50秒 | ~1秒 | 50x |
| 内存占用（10万线程） | ~100GB | ~100MB | 1000x |
| 线程创建时间 | ~1ms/线程 | ~1us/线程 | 1000x |

### 模式匹配性能

模式匹配在编译时会被优化为高效的条件检查：

```java
/**
 * 模式匹配性能特点
 */
public class PatternMatchingPerformance {

    // 编译器会将模式匹配优化为类似于以下代码的形式
    // switch 表达式会被转换为高效的 tableswitch 或 lookupswitch 指令

    sealed interface Shape permits Circle, Rectangle, Triangle {}
    record Circle(double radius) implements Shape {}
    record Rectangle(double width, double height) implements Shape {}
    record Triangle(double base, double height) implements Shape {}

    // 模式匹配版本
    public double areaPatternMatching(Shape shape) {
        return switch (shape) {
            case Circle(double r) -> Math.PI * r * r;
            case Rectangle(double w, double h) -> w * h;
            case Triangle(double b, double h) -> 0.5 * b * h;
        };
    }

    // 传统版本（性能相当，但代码更冗长）
    public double areaTraditional(Shape shape) {
        if (shape instanceof Circle c) {
            return Math.PI * c.radius() * c.radius();
        } else if (shape instanceof Rectangle r) {
            return r.width() * r.height();
        } else if (shape instanceof Triangle t) {
            return 0.5 * t.base() * t.height();
        }
        throw new IllegalArgumentException("未知形状");
    }

    /**
     * 性能提示：
     * 1. 模式匹配不会带来额外的运行时开销
     * 2. 编译器会根据模式类型选择最优的匹配策略
     * 3. 守卫条件会在类型匹配成功后才求值
     * 4. 密封类型可以让编译器生成更优化的代码
     */
}
```

### 字符串模板性能

```java
/**
 * 字符串模板性能特点
 */
public class StringTemplatePerformance {

    /**
     * 字符串模板在编译时会被转换为方法调用，
     * 性能与 StringBuilder 相当，优于 String.format()
     */

    public static void performanceComparison() {
        String name = "张三";
        int age = 25;
        int iterations = 1_000_000;

        // 预热
        for (int i = 0; i < 10000; i++) {
            STR."Hello, \{name}! Age: \{age}";
        }

        // 测试 STR 模板
        long startStr = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            String s = STR."Hello, \{name}! Age: \{age}";
        }
        long strTime = System.nanoTime() - startStr;

        // 测试 String.format
        long startFormat = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            String s = String.format("Hello, %s! Age: %d", name, age);
        }
        long formatTime = System.nanoTime() - startFormat;

        // 测试 StringBuilder
        long startBuilder = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            String s = new StringBuilder()
                .append("Hello, ").append(name)
                .append("! Age: ").append(age)
                .toString();
        }
        long builderTime = System.nanoTime() - startBuilder;

        // 测试字符串连接
        long startConcat = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            String s = "Hello, " + name + "! Age: " + age;
        }
        long concatTime = System.nanoTime() - startConcat;

        System.out.println("STR 模板: " + strTime / 1_000_000 + "ms");
        System.out.println("String.format: " + formatTime / 1_000_000 + "ms");
        System.out.println("StringBuilder: " + builderTime / 1_000_000 + "ms");
        System.out.println("字符串连接: " + concatTime / 1_000_000 + "ms");
    }

    /**
     * 典型结果（相对性能）：
     * - STR 模板: 1.0x (基准)
     * - StringBuilder: 1.0x
     * - 字符串连接: 1.1x
     * - String.format: 5-10x (较慢)
     */
}
```

## 实战场景

### 场景一：微服务 API 网关

```java
import java.net.http.*;
import java.net.URI;
import java.time.Duration;
import java.util.concurrent.*;

/**
 * 使用 Java 21 特性构建 API 网关
 */
public class ApiGateway {

    private final HttpClient httpClient;

    public ApiGateway() {
        this.httpClient = HttpClient.newBuilder()
            .executor(Executors.newVirtualThreadPerTaskExecutor())
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    // 响应类型
    sealed interface ApiResponse permits SuccessResponse, ErrorResponse, TimeoutResponse {}
    record SuccessResponse(String data, Duration latency) implements ApiResponse {}
    record ErrorResponse(int code, String message) implements ApiResponse {}
    record TimeoutResponse(String service) implements ApiResponse {}

    /**
     * 聚合多个服务的数据
     */
    public String aggregateUserDashboard(String userId) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

            // 并行调用多个微服务
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

            // 使用模式匹配处理结果
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
                    new ErrorResponse(code, "客户端错误");
                case int code when code >= 500 ->
                    new ErrorResponse(code, "服务端错误");
                default -> new ErrorResponse(response.statusCode(), "未知状态");
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

### 场景二：规则引擎

```java
import java.util.*;

/**
 * 使用模式匹配构建规则引擎
 */
public class RuleEngine {

    // 规则定义
    sealed interface Rule permits
        AmountRule, CustomerTypeRule, DateRule, CompositeRule {}

    record AmountRule(double minAmount, double maxAmount, double discount) implements Rule {}
    record CustomerTypeRule(String customerType, double discount) implements Rule {}
    record DateRule(java.time.LocalDate startDate, java.time.LocalDate endDate, double discount) implements Rule {}
    record CompositeRule(List<Rule> rules, CombineStrategy strategy) implements Rule {}

    enum CombineStrategy { ALL_MATCH, ANY_MATCH, FIRST_MATCH }

    // 订单上下文
    record OrderContext(
        double amount,
        String customerType,
        java.time.LocalDate orderDate,
        List<String> productCategories
    ) {}

    /**
     * 评估规则
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
     * 使用示例
     */
    public static void main(String[] args) {
        var engine = new RuleEngine();

        // 定义规则
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

        // 订单上下文
        var context = new OrderContext(
            1500.0,
            "VIP",
            java.time.LocalDate.of(2024, 12, 25),
            List.of("电子产品")
        );

        // 评估规则
        var discount = engine.evaluateRule(compositeRule, context);
        System.out.println(STR."折扣: \{discount.map(d -> d * 100 + "%").orElse("无")}");
    }
}
```

### 场景三：数据转换管道

```java
import java.util.*;
import java.util.function.*;
import java.util.stream.*;

/**
 * 使用记录模式构建数据转换管道
 */
public class DataTransformationPipeline {

    // 数据模型
    sealed interface DataValue permits
        StringValue, NumberValue, BoolValue, ListValue, MapValue, NullValue {}

    record StringValue(String value) implements DataValue {}
    record NumberValue(double value) implements DataValue {}
    record BoolValue(boolean value) implements DataValue {}
    record ListValue(List<DataValue> values) implements DataValue {}
    record MapValue(Map<String, DataValue> fields) implements DataValue {}
    record NullValue() implements DataValue {}

    // 转换操作
    sealed interface Transform permits
        MapTransform, FilterTransform, FlatMapTransform, ReduceTransform {}

    record MapTransform(Function<DataValue, DataValue> mapper) implements Transform {}
    record FilterTransform(Predicate<DataValue> predicate) implements Transform {}
    record FlatMapTransform(Function<DataValue, List<DataValue>> mapper) implements Transform {}
    record ReduceTransform(BinaryOperator<DataValue> reducer, DataValue identity) implements Transform {}

    /**
     * 应用转换
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
     * 深度获取嵌套值
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
     * 格式化输出
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

## 面试要点

### 虚拟线程面试题

**Q1: 什么是虚拟线程？它与平台线程有什么区别？**

虚拟线程是 Java 21 引入的轻量级线程，由 JVM 管理而非操作系统。主要区别：

| 维度 | 平台线程 | 虚拟线程 |
|------|---------|---------|
| 管理者 | 操作系统 | JVM |
| 内存占用 | 1-2 MB | ~1 KB |
| 创建成本 | 高（系统调用） | 极低（JVM操作） |
| 最大数量 | 数千 | 数百万 |
| 调度模型 | 1:1（线程:OS线程） | M:N（虚拟线程:载体线程） |

**Q2: 什么是虚拟线程的"固定"（Pinning）？如何避免？**

固定是指虚拟线程无法从载体线程上卸载的情况，主要发生在：
- `synchronized` 块中执行阻塞操作
- 执行 native 方法时

避免方法：
- 使用 `ReentrantLock` 替代 `synchronized`
- 将阻塞操作移出同步块
- 使用 `-Djdk.tracePinnedThreads=full` 检测固定

**Q3: 虚拟线程适合什么场景？不适合什么场景？**

适合：I/O 密集型任务（HTTP请求、数据库查询、文件操作）
不适合：CPU 密集型任务（复杂计算、加密、图像处理）

### 模式匹配面试题

**Q4: switch 表达式中的模式匹配有哪些类型？**

1. **类型模式**：`case String s ->`
2. **守卫模式**：`case String s when s.length() > 5 ->`
3. **null 模式**：`case null ->`
4. **记录模式**：`case Point(int x, int y) ->`
5. **嵌套模式**：`case Box(Point(int x, int y)) ->`

**Q5: 什么是穷尽性检查？如何保证 switch 表达式的穷尽性？**

穷尽性检查确保 switch 表达式覆盖所有可能的输入值。保证方法：
- 使用 `sealed` 类型，编译器自动检查所有子类型
- 对于非密封类型，使用 `default` 分支
- 对于枚举，覆盖所有枚举值

**Q6: 记录模式与传统的 instanceof 有什么优势？**

```java
// 传统方式（5行代码）
if (obj instanceof Point) {
    Point p = (Point) obj;
    int x = p.x();
    int y = p.y();
    // 使用 x 和 y
}

// 记录模式（1行代码）
if (obj instanceof Point(int x, int y)) {
    // 直接使用 x 和 y
}
```

优势：代码更简洁、类型更安全、可嵌套解构

### 字符串模板面试题

**Q7: 字符串模板相比 String.format() 有什么优势？**

1. **类型安全**：编译期检查嵌入表达式
2. **更好的性能**：接近 StringBuilder 的性能
3. **可扩展性**：可以创建自定义模板处理器
4. **安全性**：处理器可以自动转义，防止注入攻击
5. **可读性**：表达式直接嵌入，更易理解

**Q8: 什么是模板处理器？如何创建自定义处理器？**

模板处理器是处理 `StringTemplate` 的函数式接口：

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

## 延伸阅读

### 官方文档

- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444) - 虚拟线程规范
- [JEP 453: Structured Concurrency (Preview)](https://openjdk.org/jeps/453) - 结构化并发规范
- [JEP 441: Pattern Matching for switch](https://openjdk.org/jeps/441) - 模式匹配 switch 规范
- [JEP 440: Record Patterns](https://openjdk.org/jeps/440) - 记录模式规范
- [JEP 430: String Templates (Preview)](https://openjdk.org/jeps/430) - 字符串模板规范

### 深入学习资源

- [Inside Java - Virtual Threads](https://inside.java/tag/loom/) - Oracle 官方博客
- [Java 21 新特性完整列表](https://openjdk.org/projects/jdk/21/) - OpenJDK 项目页面
- [Modern Java in Action](https://www.manning.com/books/modern-java-in-action) - Manning 出版社

### 框架支持

- **Spring Boot 3.2+**：原生支持虚拟线程
  ```properties
  spring.threads.virtual.enabled=true
  ```
- **Quarkus 3.0+**：虚拟线程支持
- **Micronaut 4.0+**：虚拟线程支持

### 迁移指南

1. **评估现有代码**：识别 I/O 密集型服务
2. **检查同步代码**：将 `synchronized` 替换为 `ReentrantLock`
3. **升级依赖**：确保第三方库兼容虚拟线程
4. **性能测试**：对比迁移前后的吞吐量和延迟
5. **逐步部署**：先在非关键服务上线

---

> **总结**：Java 21 LTS 是 Java 发展历程中的里程碑版本。虚拟线程彻底改变了并发编程模型，模式匹配让代码更加简洁类型安全，字符串模板提供了现代化的字符串处理能力。这些特性的组合使用将显著提升 Java 开发的效率和代码质量。建议开发者尽快学习并在新项目中采用这些特性。
