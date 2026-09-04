---
title: Java JUnit 5 单元测试
description: 掌握 JUnit 5 进行 Java 单元测试，包括断言、生命周期、参数化测试和扩展
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - JUnit
  - 测试
  - TDD
status: imported
origin: old/src/content/docs/java/junit.zh.md
divergence: 0.333
issues: []
legacy:
  category: Java
  subcategory: 测试
  order: 23
  lastUpdated: 2026-01-07
---

JUnit 5 是 Java 生态系统中最流行的单元测试框架，它由三个主要模块组成：JUnit Platform、JUnit Jupiter 和 JUnit Vintage。本文将全面介绍 JUnit 5 的核心功能、最佳实践以及与 Mockito 的集成。

## JUnit 5 架构概述

JUnit 5 采用模块化架构，由以下三个子项目组成：

- **JUnit Platform**: 在 JVM 上启动测试框架的基础，定义了 TestEngine API
- **JUnit Jupiter**: JUnit 5 的新编程模型和扩展模型
- **JUnit Vintage**: 向后兼容 JUnit 3 和 JUnit 4

### Maven 依赖配置

```xml
<dependencies>
    <!-- JUnit Jupiter API -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter-api</artifactId>
        <version>5.10.2</version>
        <scope>test</scope>
    </dependency>

    <!-- JUnit Jupiter 参数化测试 -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter-params</artifactId>
        <version>5.10.2</version>
        <scope>test</scope>
    </dependency>

    <!-- JUnit Jupiter 引擎 -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter-engine</artifactId>
        <version>5.10.2</version>
        <scope>test</scope>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.2.5</version>
        </plugin>
    </plugins>
</build>
```

### Gradle 依赖配置

```groovy
dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter-api:5.10.2'
    testImplementation 'org.junit.jupiter:junit-jupiter-params:5.10.2'
    testRuntimeOnly 'org.junit.jupiter:junit-jupiter-engine:5.10.2'
}

test {
    useJUnitPlatform()
}
```

## 基础测试

### 第一个测试

JUnit 5 使用 `@Test` 注解标记测试方法，测试方法必须是非私有的且无返回值。

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CalculatorTest {

    @Test
    void testAddition() {
        Calculator calc = new Calculator();
        assertEquals(5, calc.add(2, 3));
    }

    @Test
    void testSubtraction() {
        Calculator calc = new Calculator();
        assertEquals(2, calc.subtract(5, 3));
    }

    @Test
    void testMultiplication() {
        Calculator calc = new Calculator();
        assertEquals(15, calc.multiply(3, 5));
    }

    @Test
    void testDivision() {
        Calculator calc = new Calculator();
        assertEquals(2.5, calc.divide(5, 2));
    }
}

class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public int subtract(int a, int b) {
        return a - b;
    }

    public int multiply(int a, int b) {
        return a * b;
    }

    public double divide(int a, int b) {
        if (b == 0) {
            throw new ArithmeticException("除数不能为零");
        }
        return (double) a / b;
    }
}
```

### 测试显示名称

使用 `@DisplayName` 注解可以为测试类和测试方法指定可读性更好的名称。

```java
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("计算器测试套件")
class CalculatorDisplayNameTest {

    @Test
    @DisplayName("两个正整数相加应返回正确结果")
    void addPositiveNumbers() {
        Calculator calc = new Calculator();
        assertEquals(8, calc.add(3, 5));
    }

    @Test
    @DisplayName("正数减负数应返回正确结果")
    void subtractNegativeNumber() {
        Calculator calc = new Calculator();
        assertEquals(8, calc.subtract(5, -3));
    }

    @Test
    @DisplayName("除以零应抛出 ArithmeticException")
    void divideByZeroThrowsException() {
        Calculator calc = new Calculator();
        assertThrows(ArithmeticException.class, () -> calc.divide(10, 0));
    }
}
```

### 禁用测试

使用 `@Disabled` 注解可以暂时禁用测试。

```java
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class DisabledTestExample {

    @Test
    void enabledTest() {
        // 这个测试会执行
        assertTrue(true);
    }

    @Test
    @Disabled("功能尚未实现")
    void disabledTest() {
        // 这个测试会被跳过
        fail("这个测试不应该执行");
    }

    @Test
    @Disabled("等待 BUG-123 修复")
    void waitingForBugFix() {
        // 等待问题修复后再启用
    }
}
```

## 断言详解

JUnit 5 提供了丰富的断言方法，位于 `org.junit.jupiter.api.Assertions` 类中。

### 基本断言

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BasicAssertionsTest {

    @Test
    void standardAssertions() {
        // 相等断言
        assertEquals(4, 2 + 2);
        assertEquals("hello", "hello");
        assertEquals(3.14, 3.14159, 0.01); // 浮点数比较，指定误差范围

        // 不相等断言
        assertNotEquals(5, 2 + 2);

        // 真假断言
        assertTrue(5 > 3);
        assertFalse(2 > 3);

        // 空值断言
        assertNull(null);
        assertNotNull("not null");

        // 同一对象断言
        String str = "test";
        assertSame(str, str);
        assertNotSame(new String("test"), new String("test"));
    }

    @Test
    void assertionWithMessage() {
        // 断言失败时显示自定义消息
        assertEquals(4, 2 + 2, "两数之和应该等于4");

        // 使用 Supplier 延迟计算消息（只在断言失败时才计算）
        assertTrue(5 > 3, () -> "复杂消息计算：" + computeExpensiveMessage());
    }

    private String computeExpensiveMessage() {
        return "这是一个复杂的计算结果";
    }
}
```

### 数组和集合断言

```java
import org.junit.jupiter.api.Test;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ArrayCollectionAssertionsTest {

    @Test
    void arrayAssertions() {
        int[] expected = {1, 2, 3, 4, 5};
        int[] actual = {1, 2, 3, 4, 5};

        assertArrayEquals(expected, actual);

        String[] strExpected = {"苹果", "香蕉", "橙子"};
        String[] strActual = {"苹果", "香蕉", "橙子"};
        assertArrayEquals(strExpected, strActual);
    }

    @Test
    void iterableAssertions() {
        List<String> expected = Arrays.asList("A", "B", "C");
        List<String> actual = Arrays.asList("A", "B", "C");

        assertIterableEquals(expected, actual);

        // 即使实现类不同，只要元素相同即可
        List<String> linkedList = new java.util.LinkedList<>(Arrays.asList("A", "B", "C"));
        assertIterableEquals(expected, linkedList);
    }

    @Test
    void linesAssertions() {
        String expected = "第一行\n第二行\n第三行";
        String actual = "第一行\n第二行\n第三行";

        assertLinesMatch(
            Arrays.asList("第一行", "第二行", "第三行"),
            actual.lines().toList()
        );
    }
}
```

### 异常断言

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ExceptionAssertionsTest {

    @Test
    void exceptionTesting() {
        // 断言抛出指定类型的异常
        ArithmeticException exception = assertThrows(
            ArithmeticException.class,
            () -> divide(10, 0)
        );

        // 验证异常消息
        assertEquals("除数不能为零", exception.getMessage());
    }

    @Test
    void exceptionWithSubclass() {
        // assertThrows 也会匹配异常的子类
        Exception exception = assertThrows(
            Exception.class,
            () -> { throw new IllegalArgumentException("参数错误"); }
        );

        assertTrue(exception instanceof IllegalArgumentException);
    }

    @Test
    void assertDoesNotThrow() {
        // 断言不抛出任何异常
        assertDoesNotThrow(() -> divide(10, 2));

        // 获取返回值
        double result = assertDoesNotThrow(() -> divide(10, 2));
        assertEquals(5.0, result);
    }

    private double divide(int a, int b) {
        if (b == 0) {
            throw new ArithmeticException("除数不能为零");
        }
        return (double) a / b;
    }
}
```

### 分组断言

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GroupedAssertionsTest {

    @Test
    void groupedAssertions() {
        User user = new User("张三", "zhangsan@example.com", 25);

        // 使用 assertAll 进行分组断言
        // 所有断言都会执行，最后报告所有失败的断言
        assertAll("用户属性验证",
            () -> assertEquals("张三", user.getName(), "用户名验证失败"),
            () -> assertEquals("zhangsan@example.com", user.getEmail(), "邮箱验证失败"),
            () -> assertEquals(25, user.getAge(), "年龄验证失败"),
            () -> assertTrue(user.getAge() >= 18, "用户应该是成年人")
        );
    }

    @Test
    void nestedGroupedAssertions() {
        User user = new User("李四", "lisi@example.com", 30);

        // 嵌套分组断言
        assertAll("用户完整验证",
            () -> assertAll("基本信息",
                () -> assertNotNull(user.getName()),
                () -> assertNotNull(user.getEmail())
            ),
            () -> assertAll("业务规则",
                () -> assertTrue(user.getAge() >= 0),
                () -> assertTrue(user.getEmail().contains("@"))
            )
        );
    }

    static class User {
        private final String name;
        private final String email;
        private final int age;

        public User(String name, String email, int age) {
            this.name = name;
            this.email = email;
            this.age = age;
        }

        public String getName() { return name; }
        public String getEmail() { return email; }
        public int getAge() { return age; }
    }
}
```

### 超时断言

```java
import org.junit.jupiter.api.Test;
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.*;

class TimeoutAssertionsTest {

    @Test
    void timeoutNotExceeded() {
        // 断言操作在指定时间内完成
        assertTimeout(Duration.ofMillis(100), () -> {
            // 快速操作
            Thread.sleep(10);
        });
    }

    @Test
    void timeoutNotExceededWithResult() {
        // 带返回值的超时断言
        String result = assertTimeout(Duration.ofMillis(100), () -> {
            Thread.sleep(10);
            return "计算结果";
        });

        assertEquals("计算结果", result);
    }

    @Test
    void timeoutExceeded() {
        // 这个测试会失败，因为操作超时
        // assertTimeout(Duration.ofMillis(10), () -> {
        //     Thread.sleep(100);
        // });
    }

    @Test
    void timeoutExceededWithPreemptiveTermination() {
        // assertTimeoutPreemptively 会在超时后立即终止执行
        // 注意：这会在不同的线程中执行，可能影响 ThreadLocal 等
        assertTimeoutPreemptively(Duration.ofMillis(100), () -> {
            Thread.sleep(10);
            return "快速结果";
        });
    }
}
```

## 生命周期方法

JUnit 5 提供了多个生命周期注解，用于在测试执行的不同阶段执行代码。

### 生命周期注解

```java
import org.junit.jupiter.api.*;

class LifecycleTest {

    @BeforeAll
    static void beforeAll() {
        // 在所有测试方法执行前执行一次
        // 必须是静态方法（除非使用 @TestInstance(Lifecycle.PER_CLASS)）
        System.out.println("=== 测试类开始 ===");
    }

    @AfterAll
    static void afterAll() {
        // 在所有测试方法执行后执行一次
        System.out.println("=== 测试类结束 ===");
    }

    @BeforeEach
    void beforeEach() {
        // 在每个测试方法执行前执行
        System.out.println("--- 测试方法开始 ---");
    }

    @AfterEach
    void afterEach() {
        // 在每个测试方法执行后执行
        System.out.println("--- 测试方法结束 ---");
    }

    @Test
    void testOne() {
        System.out.println("执行测试一");
    }

    @Test
    void testTwo() {
        System.out.println("执行测试二");
    }
}
```

输出顺序：
```
=== 测试类开始 ===
--- 测试方法开始 ---
执行测试一
--- 测试方法结束 ---
--- 测试方法开始 ---
执行测试二
--- 测试方法结束 ---
=== 测试类结束 ===
```

### 测试实例生命周期

默认情况下，JUnit 5 为每个测试方法创建一个新的测试类实例。可以使用 `@TestInstance` 注解改变这个行为。

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.TestInstance.Lifecycle;

@TestInstance(Lifecycle.PER_CLASS)
class PerClassLifecycleTest {

    private int counter = 0;

    @BeforeAll
    void beforeAll() {
        // 现在可以是非静态方法
        System.out.println("初始化资源");
    }

    @AfterAll
    void afterAll() {
        // 现在可以是非静态方法
        System.out.println("清理资源");
    }

    @Test
    void testOne() {
        counter++;
        System.out.println("测试一，计数器: " + counter);
    }

    @Test
    void testTwo() {
        counter++;
        System.out.println("测试二，计数器: " + counter);
    }

    // 使用 PER_CLASS 时，counter 会在测试之间共享
}
```

### 数据库测试示例

```java
import org.junit.jupiter.api.*;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

class DatabaseLifecycleTest {

    private static Connection connection;
    private Statement statement;

    @BeforeAll
    static void initDatabase() throws Exception {
        // 初始化数据库连接
        connection = DriverManager.getConnection("jdbc:h2:mem:testdb");

        // 创建表
        Statement stmt = connection.createStatement();
        stmt.execute("""
            CREATE TABLE users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100),
                email VARCHAR(100)
            )
        """);
        stmt.close();
    }

    @AfterAll
    static void closeDatabase() throws Exception {
        // 关闭数据库连接
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        statement = connection.createStatement();
        // 清空数据
        statement.execute("DELETE FROM users");
    }

    @AfterEach
    void tearDown() throws Exception {
        if (statement != null && !statement.isClosed()) {
            statement.close();
        }
    }

    @Test
    void testInsertUser() throws Exception {
        statement.execute("INSERT INTO users (name, email) VALUES ('张三', 'zhangsan@test.com')");

        var rs = statement.executeQuery("SELECT COUNT(*) FROM users");
        rs.next();
        assertEquals(1, rs.getInt(1));
    }

    @Test
    void testQueryUser() throws Exception {
        statement.execute("INSERT INTO users (name, email) VALUES ('李四', 'lisi@test.com')");

        var rs = statement.executeQuery("SELECT name FROM users WHERE email = 'lisi@test.com'");
        assertTrue(rs.next());
        assertEquals("李四", rs.getString("name"));
    }
}
```

## 参数化测试

参数化测试允许使用不同的参数多次运行同一个测试方法，是 JUnit 5 的强大特性之一。

### 基本参数化测试

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.EmptySource;
import static org.junit.jupiter.api.Assertions.*;

class BasicParameterizedTest {

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5})
    void testPositiveNumbers(int number) {
        assertTrue(number > 0);
    }

    @ParameterizedTest
    @ValueSource(strings = {"hello", "world", "junit"})
    void testStringNotEmpty(String str) {
        assertFalse(str.isEmpty());
    }

    @ParameterizedTest
    @ValueSource(doubles = {1.1, 2.2, 3.3})
    void testDoubleValues(double value) {
        assertTrue(value > 0);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  ", "\t", "\n"})
    void testBlankStrings(String text) {
        assertTrue(text == null || text.isBlank());
    }

    @ParameterizedTest
    @NullSource
    void testNullValue(String text) {
        assertNull(text);
    }

    @ParameterizedTest
    @EmptySource
    void testEmptyString(String text) {
        assertTrue(text.isEmpty());
    }
}
```

### 枚举参数源

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import static org.junit.jupiter.api.Assertions.*;

class EnumSourceTest {

    enum DayOfWeek {
        MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
    }

    @ParameterizedTest
    @EnumSource(DayOfWeek.class)
    void testAllDays(DayOfWeek day) {
        assertNotNull(day);
    }

    @ParameterizedTest
    @EnumSource(names = {"SATURDAY", "SUNDAY"})
    void testWeekends(DayOfWeek day) {
        assertTrue(day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY);
    }

    @ParameterizedTest
    @EnumSource(mode = EnumSource.Mode.EXCLUDE, names = {"SATURDAY", "SUNDAY"})
    void testWeekdays(DayOfWeek day) {
        assertFalse(day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY);
    }

    @ParameterizedTest
    @EnumSource(mode = EnumSource.Mode.MATCH_ALL, names = "^.*DAY$")
    void testDaysEndingWithDay(DayOfWeek day) {
        assertTrue(day.name().endsWith("DAY"));
    }
}
```

### CSV 参数源

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.CsvFileSource;
import static org.junit.jupiter.api.Assertions.*;

class CsvSourceTest {

    @ParameterizedTest
    @CsvSource({
        "1, 2, 3",
        "5, 3, 8",
        "10, -5, 5",
        "0, 0, 0"
    })
    void testAddition(int a, int b, int expected) {
        assertEquals(expected, a + b);
    }

    @ParameterizedTest
    @CsvSource({
        "张三, 25, true",
        "李四, 17, false",
        "王五, 18, true"
    })
    void testUserAge(String name, int age, boolean isAdult) {
        assertEquals(isAdult, age >= 18, name + " 的成年判断失败");
    }

    @ParameterizedTest
    @CsvSource(value = {
        "hello:HELLO",
        "world:WORLD",
        "JUnit:JUNIT"
    }, delimiter = ':')
    void testUpperCase(String input, String expected) {
        assertEquals(expected, input.toUpperCase());
    }

    @ParameterizedTest
    @CsvSource(value = {
        "'hello, world', 12",
        "'foo', 3",
        "'', 0"
    })
    void testStringLength(String input, int expectedLength) {
        assertEquals(expectedLength, input.length());
    }

    // 从 CSV 文件读取参数
    // 文件位置: src/test/resources/test-data.csv
    @ParameterizedTest
    @CsvFileSource(resources = "/test-data.csv", numLinesToSkip = 1)
    void testFromCsvFile(String username, String email, int age) {
        assertNotNull(username);
        assertTrue(email.contains("@"));
        assertTrue(age > 0);
    }
}
```

### 方法参数源

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;
import java.util.stream.Stream;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class MethodSourceTest {

    @ParameterizedTest
    @MethodSource("provideStringsForIsBlank")
    void testIsBlank(String input, boolean expected) {
        assertEquals(expected, input == null || input.isBlank());
    }

    // 参数提供方法必须是静态的
    static Stream<Arguments> provideStringsForIsBlank() {
        return Stream.of(
            Arguments.of(null, true),
            Arguments.of("", true),
            Arguments.of("  ", true),
            Arguments.of("hello", false),
            Arguments.of("  hello  ", false)
        );
    }

    @ParameterizedTest
    @MethodSource("provideNumbers")
    void testSquare(int input, int expected) {
        assertEquals(expected, input * input);
    }

    static List<Arguments> provideNumbers() {
        return List.of(
            Arguments.of(1, 1),
            Arguments.of(2, 4),
            Arguments.of(3, 9),
            Arguments.of(4, 16),
            Arguments.of(5, 25)
        );
    }

    // 单参数可以直接返回流
    @ParameterizedTest
    @MethodSource("provideStrings")
    void testStringNotEmpty(String str) {
        assertFalse(str.isEmpty());
    }

    static Stream<String> provideStrings() {
        return Stream.of("hello", "world", "junit", "test");
    }

    // 从外部类获取参数
    @ParameterizedTest
    @MethodSource("com.example.TestDataProvider#provideUsers")
    void testExternalSource(User user) {
        assertNotNull(user.getName());
    }

    static class User {
        private final String name;
        public User(String name) { this.name = name; }
        public String getName() { return name; }
    }
}
```

### 自定义参数源

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ArgumentsSource;
import org.junit.jupiter.params.provider.ArgumentsProvider;
import org.junit.jupiter.api.extension.ExtensionContext;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;

class CustomArgumentsSourceTest {

    @ParameterizedTest
    @ArgumentsSource(CustomArgumentsProvider.class)
    void testWithCustomArguments(int value, String text) {
        assertTrue(value > 0);
        assertNotNull(text);
    }

    static class CustomArgumentsProvider implements ArgumentsProvider {
        @Override
        public Stream<? extends org.junit.jupiter.params.provider.Arguments> provideArguments(
                ExtensionContext context) {
            return Stream.of(
                org.junit.jupiter.params.provider.Arguments.of(1, "one"),
                org.junit.jupiter.params.provider.Arguments.of(2, "two"),
                org.junit.jupiter.params.provider.Arguments.of(3, "three")
            );
        }
    }
}
```

### 自定义显示名称

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

class ParameterizedDisplayNameTest {

    @ParameterizedTest(name = "第 {index} 次测试: {0} + {1} = {2}")
    @CsvSource({
        "1, 2, 3",
        "5, 3, 8",
        "10, 10, 20"
    })
    void testAdditionWithCustomName(int a, int b, int expected) {
        assertEquals(expected, a + b);
    }

    @DisplayName("用户年龄验证")
    @ParameterizedTest(name = "用户 [{0}] 年龄 [{1}] 是否成年: {2}")
    @CsvSource({
        "张三, 25, true",
        "李四, 16, false",
        "王五, 18, true"
    })
    void testAgeValidation(String name, int age, boolean isAdult) {
        assertEquals(isAdult, age >= 18);
    }
}
```

## 嵌套测试

嵌套测试使用 `@Nested` 注解，可以更好地组织相关的测试用例。

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("购物车测试")
class ShoppingCartTest {

    private ShoppingCart cart;

    @BeforeEach
    void setUp() {
        cart = new ShoppingCart();
    }

    @Nested
    @DisplayName("当购物车为空时")
    class WhenEmpty {

        @Test
        @DisplayName("总数应该为零")
        void totalShouldBeZero() {
            assertEquals(0, cart.getTotal());
        }

        @Test
        @DisplayName("商品数量应该为零")
        void itemCountShouldBeZero() {
            assertEquals(0, cart.getItemCount());
        }

        @Test
        @DisplayName("应该是空的")
        void shouldBeEmpty() {
            assertTrue(cart.isEmpty());
        }
    }

    @Nested
    @DisplayName("当添加商品后")
    class AfterAddingItems {

        @BeforeEach
        void addItem() {
            cart.addItem(new Item("商品A", 100));
        }

        @Test
        @DisplayName("不应该是空的")
        void shouldNotBeEmpty() {
            assertFalse(cart.isEmpty());
        }

        @Test
        @DisplayName("商品数量应该为1")
        void itemCountShouldBeOne() {
            assertEquals(1, cart.getItemCount());
        }

        @Test
        @DisplayName("总价应该正确")
        void totalShouldBeCorrect() {
            assertEquals(100, cart.getTotal());
        }

        @Nested
        @DisplayName("当添加更多商品后")
        class AfterAddingMoreItems {

            @BeforeEach
            void addMoreItems() {
                cart.addItem(new Item("商品B", 200));
                cart.addItem(new Item("商品C", 50));
            }

            @Test
            @DisplayName("商品数量应该为3")
            void itemCountShouldBeThree() {
                assertEquals(3, cart.getItemCount());
            }

            @Test
            @DisplayName("总价应该是所有商品的总和")
            void totalShouldBeSumOfAllItems() {
                assertEquals(350, cart.getTotal());
            }
        }

        @Nested
        @DisplayName("当移除商品后")
        class AfterRemovingItem {

            @BeforeEach
            void removeItem() {
                cart.removeItem("商品A");
            }

            @Test
            @DisplayName("购物车应该再次为空")
            void shouldBeEmptyAgain() {
                assertTrue(cart.isEmpty());
            }
        }
    }

    // 辅助类
    static class ShoppingCart {
        private final java.util.List<Item> items = new java.util.ArrayList<>();

        public void addItem(Item item) { items.add(item); }
        public void removeItem(String name) { items.removeIf(i -> i.name.equals(name)); }
        public int getTotal() { return items.stream().mapToInt(i -> i.price).sum(); }
        public int getItemCount() { return items.size(); }
        public boolean isEmpty() { return items.isEmpty(); }
    }

    static class Item {
        String name;
        int price;
        Item(String name, int price) { this.name = name; this.price = price; }
    }
}
```

## 扩展模型

JUnit 5 的扩展模型提供了强大的自定义能力。

### 生命周期回调扩展

```java
import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

// 自定义扩展
class TimingExtension implements BeforeTestExecutionCallback, AfterTestExecutionCallback {

    private static final String START_TIME = "start_time";

    @Override
    public void beforeTestExecution(ExtensionContext context) {
        context.getStore(ExtensionContext.Namespace.GLOBAL)
               .put(START_TIME, System.currentTimeMillis());
    }

    @Override
    public void afterTestExecution(ExtensionContext context) {
        long startTime = context.getStore(ExtensionContext.Namespace.GLOBAL)
                                .remove(START_TIME, long.class);
        long duration = System.currentTimeMillis() - startTime;

        System.out.println(context.getDisplayName() + " 执行时间: " + duration + " ms");
    }
}

// 使用扩展
@ExtendWith(TimingExtension.class)
class TimingTest {

    @Test
    void testQuickOperation() {
        // 快速操作
        assertTrue(true);
    }

    @Test
    void testSlowOperation() throws InterruptedException {
        Thread.sleep(100);
        assertTrue(true);
    }
}
```

### 条件测试扩展

```java
import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.Test;
import java.lang.annotation.*;

// 自定义条件注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith(DisabledOnWeekendCondition.class)
@interface DisabledOnWeekend {}

// 条件实现
class DisabledOnWeekendCondition implements ExecutionCondition {

    @Override
    public ConditionEvaluationResult evaluateExecutionCondition(ExtensionContext context) {
        java.time.DayOfWeek day = java.time.LocalDate.now().getDayOfWeek();

        if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) {
            return ConditionEvaluationResult.disabled("周末不运行测试");
        }

        return ConditionEvaluationResult.enabled("工作日运行测试");
    }
}

// 使用条件扩展
class ConditionalTest {

    @Test
    @DisabledOnWeekend
    void testOnlyOnWeekdays() {
        System.out.println("这个测试只在工作日运行");
    }
}
```

### 参数解析扩展

```java
import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.Test;
import java.lang.annotation.*;
import static org.junit.jupiter.api.Assertions.*;

// 自定义参数注解
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@interface RandomInt {
    int min() default 0;
    int max() default 100;
}

// 参数解析器
class RandomIntParameterResolver implements ParameterResolver {

    @Override
    public boolean supportsParameter(ParameterContext parameterContext,
                                     ExtensionContext extensionContext) {
        return parameterContext.isAnnotated(RandomInt.class);
    }

    @Override
    public Object resolveParameter(ParameterContext parameterContext,
                                   ExtensionContext extensionContext) {
        RandomInt annotation = parameterContext.findAnnotation(RandomInt.class).get();
        int min = annotation.min();
        int max = annotation.max();
        return new java.util.Random().nextInt(max - min + 1) + min;
    }
}

// 使用参数解析器
@ExtendWith(RandomIntParameterResolver.class)
class ParameterResolverTest {

    @Test
    void testWithRandomInt(@RandomInt(min = 1, max = 10) int value) {
        System.out.println("随机值: " + value);
        assertTrue(value >= 1 && value <= 10);
    }

    @Test
    void testWithDefaultRange(@RandomInt int value) {
        System.out.println("默认范围随机值: " + value);
        assertTrue(value >= 0 && value <= 100);
    }
}
```

### 测试模板扩展

```java
import org.junit.jupiter.api.extension.*;
import org.junit.jupiter.api.TestTemplate;
import java.util.*;
import java.util.stream.*;
import static org.junit.jupiter.api.Assertions.*;

// 测试模板扩展
class RepeatExtension implements TestTemplateInvocationContextProvider {

    @Override
    public boolean supportsTestTemplate(ExtensionContext context) {
        return true;
    }

    @Override
    public Stream<TestTemplateInvocationContext> provideTestTemplateInvocationContexts(
            ExtensionContext context) {
        return Stream.of(
            invocationContext("第一次"),
            invocationContext("第二次"),
            invocationContext("第三次")
        );
    }

    private TestTemplateInvocationContext invocationContext(String parameter) {
        return new TestTemplateInvocationContext() {
            @Override
            public String getDisplayName(int invocationIndex) {
                return parameter;
            }

            @Override
            public List<Extension> getAdditionalExtensions() {
                return Collections.singletonList(new ParameterResolver() {
                    @Override
                    public boolean supportsParameter(ParameterContext parameterContext,
                                                     ExtensionContext extensionContext) {
                        return parameterContext.getParameter().getType().equals(String.class);
                    }

                    @Override
                    public Object resolveParameter(ParameterContext parameterContext,
                                                   ExtensionContext extensionContext) {
                        return parameter;
                    }
                });
            }
        };
    }
}

// 使用测试模板
@ExtendWith(RepeatExtension.class)
class TestTemplateTest {

    @TestTemplate
    void testTemplate(String param) {
        System.out.println("执行: " + param);
        assertNotNull(param);
    }
}
```

### 内置条件注解

JUnit 5 提供了许多内置的条件注解：

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.*;

class BuiltInConditionsTest {

    // 操作系统条件
    @Test
    @EnabledOnOs(OS.LINUX)
    void onlyOnLinux() {
        System.out.println("只在 Linux 上运行");
    }

    @Test
    @DisabledOnOs({OS.WINDOWS, OS.MAC})
    void notOnWindowsOrMac() {
        System.out.println("不在 Windows 或 Mac 上运行");
    }

    // JRE 版本条件
    @Test
    @EnabledOnJre(JRE.JAVA_17)
    void onlyOnJava17() {
        System.out.println("只在 Java 17 上运行");
    }

    @Test
    @EnabledForJreRange(min = JRE.JAVA_11, max = JRE.JAVA_21)
    void onJava11To21() {
        System.out.println("在 Java 11 到 21 上运行");
    }

    // 系统属性条件
    @Test
    @EnabledIfSystemProperty(named = "env", matches = "prod")
    void onlyInProduction() {
        System.out.println("只在生产环境运行");
    }

    // 环境变量条件
    @Test
    @EnabledIfEnvironmentVariable(named = "CI", matches = "true")
    void onlyInCI() {
        System.out.println("只在 CI 环境运行");
    }

    // 自定义条件
    @Test
    @EnabledIf("customCondition")
    void conditionalTest() {
        System.out.println("条件满足时运行");
    }

    boolean customCondition() {
        return java.time.LocalTime.now().getHour() < 12;
    }
}
```

## Mockito 集成

Mockito 是 Java 中最流行的 Mock 框架，与 JUnit 5 配合使用可以更好地进行单元测试。

### Maven 依赖

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
</dependency>
```

### 基本 Mock 使用

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BasicMockTest {

    @Mock
    private UserRepository userRepository;

    @Test
    void testMockBasics() {
        // 设置 Mock 行为
        User mockUser = new User(1L, "张三", "zhangsan@test.com");
        when(userRepository.findById(1L)).thenReturn(mockUser);

        // 调用 Mock 方法
        User result = userRepository.findById(1L);

        // 验证结果
        assertNotNull(result);
        assertEquals("张三", result.getName());

        // 验证方法被调用
        verify(userRepository).findById(1L);
        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    void testMockWithDifferentMatchers() {
        when(userRepository.findById(anyLong())).thenReturn(new User(1L, "测试用户", "test@test.com"));

        assertNotNull(userRepository.findById(100L));
        assertNotNull(userRepository.findById(200L));

        verify(userRepository, times(2)).findById(anyLong());
    }

    static class User {
        private Long id;
        private String name;
        private String email;

        public User(Long id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }

        public Long getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
    }

    interface UserRepository {
        User findById(Long id);
        User save(User user);
        void delete(Long id);
    }
}
```

### 使用 @InjectMocks

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class InjectMocksTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    @Test
    void testUserRegistration() {
        // 设置 Mock 行为
        User newUser = new User(null, "李四", "lisi@test.com");
        User savedUser = new User(1L, "李四", "lisi@test.com");

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(emailService.sendWelcomeEmail(anyString())).thenReturn(true);

        // 调用被测试的服务
        User result = userService.register(newUser);

        // 验证
        assertNotNull(result);
        assertEquals(1L, result.getId());

        verify(userRepository).save(newUser);
        verify(emailService).sendWelcomeEmail("lisi@test.com");
    }

    static class User {
        private Long id;
        private String name;
        private String email;

        public User(Long id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }

        public Long getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
    }

    interface UserRepository {
        User save(User user);
    }

    interface EmailService {
        boolean sendWelcomeEmail(String email);
    }

    static class UserService {
        private final UserRepository userRepository;
        private final EmailService emailService;

        public UserService(UserRepository userRepository, EmailService emailService) {
            this.userRepository = userRepository;
            this.emailService = emailService;
        }

        public User register(User user) {
            User savedUser = userRepository.save(user);
            emailService.sendWelcomeEmail(user.getEmail());
            return savedUser;
        }
    }
}
```

### 验证方法调用

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.InOrder;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationTest {

    @Mock
    private OrderService orderService;

    @Test
    void testVerifyCallCount() {
        orderService.processOrder(1L);
        orderService.processOrder(2L);
        orderService.processOrder(3L);

        // 验证调用次数
        verify(orderService, times(3)).processOrder(anyLong());
        verify(orderService, atLeast(2)).processOrder(anyLong());
        verify(orderService, atMost(5)).processOrder(anyLong());

        // 验证从未调用
        verify(orderService, never()).cancelOrder(anyLong());
    }

    @Test
    void testVerifyOrder() {
        orderService.createOrder();
        orderService.processOrder(1L);
        orderService.completeOrder(1L);

        // 验证调用顺序
        InOrder inOrder = inOrder(orderService);
        inOrder.verify(orderService).createOrder();
        inOrder.verify(orderService).processOrder(1L);
        inOrder.verify(orderService).completeOrder(1L);
    }

    @Test
    void testVerifyNoMoreInteractions() {
        orderService.processOrder(1L);

        verify(orderService).processOrder(1L);

        // 验证没有其他调用
        verifyNoMoreInteractions(orderService);
    }

    interface OrderService {
        void createOrder();
        void processOrder(Long orderId);
        void completeOrder(Long orderId);
        void cancelOrder(Long orderId);
    }
}
```

### 模拟异常

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ExceptionMockTest {

    @Mock
    private PaymentService paymentService;

    @Test
    void testThrowException() {
        // 设置抛出异常
        when(paymentService.processPayment(anyDouble()))
            .thenThrow(new PaymentException("支付失败"));

        // 验证异常
        assertThrows(PaymentException.class, () -> {
            paymentService.processPayment(100.0);
        });
    }

    @Test
    void testThrowExceptionOnVoidMethod() {
        // void 方法抛出异常
        doThrow(new PaymentException("退款失败"))
            .when(paymentService).refund(anyLong());

        assertThrows(PaymentException.class, () -> {
            paymentService.refund(1L);
        });
    }

    @Test
    void testMultipleCallBehavior() {
        // 第一次返回成功，第二次抛出异常
        when(paymentService.processPayment(100.0))
            .thenReturn("SUCCESS")
            .thenThrow(new PaymentException("重复支付"));

        assertEquals("SUCCESS", paymentService.processPayment(100.0));

        assertThrows(PaymentException.class, () -> {
            paymentService.processPayment(100.0);
        });
    }

    interface PaymentService {
        String processPayment(double amount);
        void refund(Long transactionId);
    }

    static class PaymentException extends RuntimeException {
        public PaymentException(String message) { super(message); }
    }
}
```

### Spy - 部分模拟

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.ArrayList;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class SpyTest {

    @Spy
    private List<String> spyList = new ArrayList<>();

    @Test
    void testSpy() {
        // Spy 会调用真实方法
        spyList.add("元素1");
        spyList.add("元素2");

        assertEquals(2, spyList.size());
        assertTrue(spyList.contains("元素1"));

        // 可以覆盖特定方法
        doReturn(100).when(spyList).size();
        assertEquals(100, spyList.size());
    }

    @Test
    void testSpyPartialMock() {
        Calculator calculator = spy(new Calculator());

        // 调用真实方法
        assertEquals(5, calculator.add(2, 3));

        // 模拟特定方法
        doReturn(100).when(calculator).multiply(anyInt(), anyInt());
        assertEquals(100, calculator.multiply(2, 3));

        // 其他方法仍然调用真实实现
        assertEquals(10, calculator.add(4, 6));
    }

    static class Calculator {
        public int add(int a, int b) { return a + b; }
        public int multiply(int a, int b) { return a * b; }
    }
}
```

### 参数捕获

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ArgumentCaptorTest {

    @Mock
    private NotificationService notificationService;

    @Captor
    private ArgumentCaptor<Notification> notificationCaptor;

    @Test
    void testCaptureArgument() {
        // 调用方法
        notificationService.send(new Notification("用户123", "您的订单已发货", "email"));

        // 捕获参数
        verify(notificationService).send(notificationCaptor.capture());

        Notification captured = notificationCaptor.getValue();
        assertEquals("用户123", captured.getUserId());
        assertEquals("您的订单已发货", captured.getMessage());
        assertEquals("email", captured.getType());
    }

    @Test
    void testCaptureMultipleArguments() {
        notificationService.send(new Notification("用户1", "消息1", "email"));
        notificationService.send(new Notification("用户2", "消息2", "sms"));
        notificationService.send(new Notification("用户3", "消息3", "push"));

        verify(notificationService, times(3)).send(notificationCaptor.capture());

        var allNotifications = notificationCaptor.getAllValues();
        assertEquals(3, allNotifications.size());

        assertEquals("用户1", allNotifications.get(0).getUserId());
        assertEquals("用户2", allNotifications.get(1).getUserId());
        assertEquals("用户3", allNotifications.get(2).getUserId());
    }

    interface NotificationService {
        void send(Notification notification);
    }

    static class Notification {
        private final String userId;
        private final String message;
        private final String type;

        public Notification(String userId, String message, String type) {
            this.userId = userId;
            this.message = message;
            this.type = type;
        }

        public String getUserId() { return userId; }
        public String getMessage() { return message; }
        public String getType() { return type; }
    }
}
```

### BDD 风格 Mockito

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.BDDMockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BDDMockitoTest {

    @Mock
    private ProductRepository productRepository;

    @Test
    void testBDDStyle() {
        // Given - 准备
        Product product = new Product(1L, "iPhone", 9999.0);
        given(productRepository.findById(1L)).willReturn(product);

        // When - 执行
        Product result = productRepository.findById(1L);

        // Then - 验证
        then(productRepository).should().findById(1L);
        assertNotNull(result);
        assertEquals("iPhone", result.getName());
    }

    @Test
    void testBDDStyleWithException() {
        // Given
        given(productRepository.findById(999L))
            .willThrow(new ProductNotFoundException("商品不存在"));

        // When & Then
        assertThrows(ProductNotFoundException.class, () -> {
            productRepository.findById(999L);
        });

        then(productRepository).should().findById(999L);
    }

    interface ProductRepository {
        Product findById(Long id);
    }

    static class Product {
        private final Long id;
        private final String name;
        private final double price;

        public Product(Long id, String name, double price) {
            this.id = id;
            this.name = name;
            this.price = price;
        }

        public Long getId() { return id; }
        public String getName() { return name; }
        public double getPrice() { return price; }
    }

    static class ProductNotFoundException extends RuntimeException {
        public ProductNotFoundException(String message) { super(message); }
    }
}
```

## 最佳实践

### 测试命名规范

```java
class UserServiceTest {

    // 好的命名：描述行为和预期结果
    @Test
    void shouldReturnUserWhenIdExists() {}

    @Test
    void shouldThrowExceptionWhenUserNotFound() {}

    @Test
    void shouldSendWelcomeEmailAfterRegistration() {}

    // 避免的命名
    @Test
    void test1() {}

    @Test
    void testUser() {}
}
```

### 使用 AAA 模式

```java
@Test
void shouldCalculateTotalPrice() {
    // Arrange - 准备测试数据
    ShoppingCart cart = new ShoppingCart();
    cart.addItem(new Item("商品A", 100));
    cart.addItem(new Item("商品B", 200));

    // Act - 执行被测试的操作
    double total = cart.calculateTotal();

    // Assert - 验证结果
    assertEquals(300.0, total);
}
```

### 一个测试只测一件事

```java
// 好的做法：每个测试关注一个方面
@Test
void shouldCreateUserWithCorrectName() {
    User user = new User("张三", "zhangsan@test.com");
    assertEquals("张三", user.getName());
}

@Test
void shouldCreateUserWithCorrectEmail() {
    User user = new User("张三", "zhangsan@test.com");
    assertEquals("zhangsan@test.com", user.getEmail());
}

// 避免：一个测试测试多个不相关的东西
@Test
void testUser() {
    User user = new User("张三", "zhangsan@test.com");
    assertEquals("张三", user.getName());
    assertEquals("zhangsan@test.com", user.getEmail());
    assertTrue(user.isActive());
    assertNotNull(user.getCreatedAt());
}
```

### 使用 @BeforeEach 减少重复

```java
class OrderServiceTest {

    private OrderService orderService;
    private OrderRepository orderRepository;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        paymentService = mock(PaymentService.class);
        orderService = new OrderService(orderRepository, paymentService);
    }

    @Test
    void shouldCreateOrder() {
        // 直接使用已初始化的对象
    }

    @Test
    void shouldProcessPayment() {
        // 直接使用已初始化的对象
    }
}
```

### 使用参数化测试减少重复

```java
@ParameterizedTest
@CsvSource({
    "admin, true",
    "user, false",
    "guest, false",
    "superadmin, true"
})
void shouldCheckAdminRole(String role, boolean expected) {
    User user = new User("test", role);
    assertEquals(expected, user.isAdmin());
}
```

### 测试边界条件

```java
class BoundaryTest {

    @Test
    void shouldHandleEmptyList() {
        List<Integer> emptyList = Collections.emptyList();
        assertThrows(NoSuchElementException.class, () -> {
            Collections.max(emptyList);
        });
    }

    @Test
    void shouldHandleNullInput() {
        assertThrows(NullPointerException.class, () -> {
            userService.create(null);
        });
    }

    @Test
    void shouldHandleMinValue() {
        assertEquals(Integer.MIN_VALUE, Math.min(Integer.MIN_VALUE, 0));
    }

    @Test
    void shouldHandleMaxValue() {
        assertEquals(Integer.MAX_VALUE, Math.max(Integer.MAX_VALUE, 0));
    }
}
```

### 隔离测试

```java
// 每个测试应该独立，不依赖其他测试的执行顺序
@TestInstance(TestInstance.Lifecycle.PER_METHOD) // 默认行为
class IsolatedTest {

    private List<String> list;

    @BeforeEach
    void setUp() {
        list = new ArrayList<>(); // 每个测试使用新的列表
    }

    @Test
    void testAdd() {
        list.add("A");
        assertEquals(1, list.size());
    }

    @Test
    void testAnotherAdd() {
        list.add("B");
        assertEquals(1, list.size()); // 不受上一个测试影响
    }
}
```

### 使用断言库增强可读性

```java
// 使用 AssertJ 增强断言可读性
import org.assertj.core.api.Assertions;

class AssertJExampleTest {

    @Test
    void testWithAssertJ() {
        List<String> names = List.of("张三", "李四", "王五");

        Assertions.assertThat(names)
            .hasSize(3)
            .contains("张三", "李四")
            .doesNotContain("赵六")
            .startsWith("张三")
            .endsWith("王五");
    }

    @Test
    void testObjectWithAssertJ() {
        User user = new User(1L, "张三", "zhangsan@test.com");

        Assertions.assertThat(user)
            .isNotNull()
            .extracting(User::getName)
            .isEqualTo("张三");
    }
}
```

## 测试配置

### junit-platform.properties

在 `src/test/resources` 目录下创建 `junit-platform.properties` 文件：

```properties
# 并行执行配置
junit.jupiter.execution.parallel.enabled = true
junit.jupiter.execution.parallel.mode.default = concurrent
junit.jupiter.execution.parallel.mode.classes.default = concurrent

# 默认测试实例生命周期
junit.jupiter.testinstance.lifecycle.default = per_class

# 显示名称生成器
junit.jupiter.displayname.generator.default = \
    org.junit.jupiter.api.DisplayNameGenerator$ReplaceUnderscores
```

### Maven Surefire 配置

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.5</version>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
            <include>**/*Tests.java</include>
        </includes>
        <excludes>
            <exclude>**/*IntegrationTest.java</exclude>
        </excludes>
        <argLine>-Xmx1024m</argLine>
        <parallel>methods</parallel>
        <threadCount>4</threadCount>
    </configuration>
</plugin>
```

## 总结

JUnit 5 是一个功能强大且灵活的测试框架，本文介绍了：

1. **架构概述**: JUnit Platform、Jupiter 和 Vintage 三个核心模块
2. **基础测试**: 测试注解、显示名称和禁用测试
3. **断言详解**: 基本断言、数组/集合断言、异常断言、分组断言和超时断言
4. **生命周期方法**: @BeforeAll、@AfterAll、@BeforeEach、@AfterEach
5. **参数化测试**: @ValueSource、@EnumSource、@CsvSource、@MethodSource 等
6. **嵌套测试**: 使用 @Nested 组织相关测试
7. **扩展模型**: 自定义扩展实现更复杂的测试场景
8. **Mockito 集成**: Mock、Spy、参数捕获和 BDD 风格测试

掌握这些知识，你将能够编写高质量、可维护的单元测试，提升代码质量和开发效率。

## 相关资源

- [JUnit 5 官方文档](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito 官方文档](https://site.mockito.org/)
- [AssertJ 官方文档](https://assertj.github.io/doc/)
- [测试驱动开发 (TDD) 实践指南](https://www.martinfowler.com/bliki/TestDrivenDevelopment.html)
