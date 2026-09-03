---
title: Java JUnit 5 测试框架完全指南
description: 深入讲解 JUnit 5 (Jupiter) 测试框架，涵盖核心注解、生命周期、参数化测试、扩展机制等内容，帮助开发者编写高效的单元测试代码。
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - JUnit 5
  - 单元测试
  - 测试框架
  - TDD
  - 断言
  - Mock
  - 参数化测试
status: imported
origin: old/src/content/docs/java/junit5.zh.md
divergence: 0.227
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Java
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---


## 概念解释

### 什么是 JUnit 5？

JUnit 5 是 Java 生态中最现代的单元测试框架，于 2017 年发布。它是对 JUnit 4 的彻底重写，引入了全新的架构和更强大的功能。JUnit 5 的核心名称是 **Jupiter**，代表了其革新性的测试能力。

JUnit 5 并非一个单一的库，而是由三个主要组件组成的模块化框架：
- **Platform**：提供测试执行的基础设施
- **Jupiter**：新的编程模型和扩展机制
- **Vintage**：向后兼容 JUnit 3 和 JUnit 4

### 为什么选择 JUnit 5？

1. **模块化设计**：灵活的架构支持自定义扩展
2. **注解驱动**：丰富的注解简化测试编写
3. **参数化测试**：原生支持数据驱动测试
4. **生命周期管理**：精细控制测试类和方法的执行周期
5. **扩展机制**：强大的插件系统替代了 JUnit 4 的 Runner 和 Rule
6. **现代 Java 特性**：支持 Lambda 表达式和流 API
7. **IDE 支持**：主流 IDE（IntelliJ IDEA、Eclipse）原生支持

## 核心原理

### JUnit 5 架构

JUnit 5 采用分层架构，从下到上分别是：

```
测试代码 (Test Code)
    ↓
Jupiter API (编程模型)
    ↓
Platform (测试执行引擎)
    ↓
Launcher (启动器)
```

### 测试生命周期

```
1. 测试类实例化
   ↓
2. @BeforeAll (静态方法，全局初始化)
   ↓
3. 对于每个测试方法：
   ├─ @BeforeEach (初始化)
   ├─ @Test (执行测试)
   ├─ @AfterEach (清理)
   ↓
4. @AfterAll (静态方法，全局清理)
```

### 测试调度器工作原理

JUnit 5 Platform 提供的 `TestExecutionListener` 接口允许监听生命周期事件：

```java
// 事件调度顺序
testPlanExecutionStarted()
  └─ testPlanExecutionFinished()
      └─ containerExecutionStarted() // 测试类
          └─ executionStarted() // 测试方法
              └─ executionFinished()
          └─ containerExecutionFinished()
```

### 参数化测试的实现原理

参数化测试通过 `ParameterizedTest` 和 `ParameterProvider` 实现，允许同一个测试方法使用不同的参数集合运行多次。参数来源可以是：
- `@ValueSource`：单一参数值
- `@CsvSource`：CSV 格式数据
- `@MethodSource`：方法提供的参数
- `@ArgumentsSource`：自定义参数提供者

## 核心要点

### 基本注解

| 注解 | 说明 |
|------|------|
| `@Test` | 标记为测试方法 |
| `@DisplayName` | 自定义测试显示名称 |
| `@BeforeEach` | 每个测试方法前执行 |
| `@AfterEach` | 每个测试方法后执行 |
| `@BeforeAll` | 所有测试前执行（静态） |
| `@AfterAll` | 所有测试后执行（静态） |
| `@Disabled` | 禁用该测试 |
| `@Nested` | 嵌套测试类 |
| `@Tag` | 为测试分配标签 |
| `@ParameterizedTest` | 参数化测试 |

### 断言机制

JUnit 5 提供强大的断言工具，支持：
- 简单断言：`assertEquals()`, `assertTrue()`, `assertFalse()`
- 异常断言：`assertThrows()`
- 超时断言：`assertTimeout()`, `assertTimeoutPreemptively()`
- 组合断言：`assertAll()`
- 自定义消息：Lambda 表达式延迟计算

### 扩展机制

JUnit 5 使用 `Extension` 接口替代 JUnit 4 的 Runner 和 Rule，提供更灵活的扩展点：
- `BeforeEachCallback`
- `AfterEachCallback`
- `BeforeAllCallback`
- `AfterAllCallback`
- `ParameterResolver`
- `TestExecutionExceptionHandler`

### 依赖注入

JUnit 5 支持通过 `ParameterResolver` 实现的方法参数注入：

```java
// JUnit 5 内置提供
@Test
void testWithTestInfo(TestInfo info) {
    // 可以注入 TestInfo, TestReporter 等
}
```

### 动态测试

`@TestFactory` 允许在运行时动态生成测试用例，返回 `Stream<DynamicTest>` 或 `Iterable<DynamicTest>`。

## 代码示例

### 基本测试结构

```java
import org.junit.jupiter.api.*;

@DisplayName("计算器测试套件")
class CalculatorTests {
    private Calculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new Calculator();
    }

    @Test
    @DisplayName("测试两个数的加法")
    void testAddition() {
        int result = calculator.add(2, 3);
        Assertions.assertEquals(5, result, "2 + 3 应该等于 5");
    }

    @Test
    @DisplayName("测试除数为零的异常")
    void testDivisionByZero() {
        // 验证是否抛出异常
        Assertions.assertThrows(
            ArithmeticException.class,
            () -> calculator.divide(10, 0),
            "除数为零应该抛出异常"
        );
    }

    @Test
    @DisplayName("测试超时")
    void testTimeout() {
        // 验证方法在指定时间内完成
        Assertions.assertTimeout(
            java.time.Duration.ofSeconds(1),
            () -> calculator.slowOperation()
        );
    }

    @AfterEach
    void tearDown() {
        calculator = null;
    }
}

// 被测试的类
class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public int divide(int a, int b) {
        if (b == 0) {
            throw new ArithmeticException("除数不能为零");
        }
        return a / b;
    }

    public void slowOperation() throws InterruptedException {
        Thread.sleep(500);
    }
}
```

### 参数化测试

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;

class ParameterizedCalculatorTests {
    private Calculator calculator = new Calculator();

    // 使用 @ValueSource 提供单一参数
    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5})
    @DisplayName("测试单个参数")
    void testWithValueSource(int value) {
        Assertions.assertTrue(value > 0);
    }

    // 使用 @CsvSource 提供多参数
    @ParameterizedTest(name = "{0} + {1} = {2}")
    @CsvSource({
        "1, 1, 2",
        "0, 0, 0",
        "2, 3, 5",
        "-1, -1, -2"
    })
    @DisplayName("测试加法的多个场景")
    void testAdditionWithCsv(int a, int b, int expected) {
        Assertions.assertEquals(expected, calculator.add(a, b));
    }

    // 使用 @MethodSource 提供复杂参数
    @ParameterizedTest
    @MethodSource("provideStringsForIsBlank")
    @DisplayName("测试字符串是否为空")
    void testIsBlank(String input, boolean expected) {
        Assertions.assertEquals(expected, input.isBlank());
    }

    // 参数提供方法
    private static java.util.stream.Stream<org.junit.jupiter.params.provider.Arguments>
    provideStringsForIsBlank() {
        return java.util.stream.Stream.of(
            org.junit.jupiter.params.provider.Arguments.of("", true),
            org.junit.jupiter.params.provider.Arguments.of("   ", true),
            org.junit.jupiter.params.provider.Arguments.of("hello", false)
        );
    }

    // 使用 CSV 文件作为参数源
    @ParameterizedTest
    @CsvFileSource(resources = "/test-data.csv")
    @DisplayName("从 CSV 文件读取测试数据")
    void testWithCsvFile(String name, int age) {
        Assertions.assertNotNull(name);
        Assertions.assertTrue(age >= 0);
    }
}
```

### 异常和超时测试

```java
class ExceptionAndTimeoutTests {

    @Test
    @DisplayName("验证异常类型和消息")
    void testExceptionDetails() {
        // 使用 assertThrows 获取异常对象
        IllegalArgumentException exception = Assertions.assertThrows(
            IllegalArgumentException.class,
            () -> {
                throw new IllegalArgumentException("参数不合法");
            }
        );
        Assertions.assertEquals("参数不合法", exception.getMessage());
    }

    @Test
    @DisplayName("验证多个异常")
    void testMultipleExceptions() {
        Assertions.assertThrows(NullPointerException.class, () -> {
            String str = null;
            str.length();
        });
    }

    @Test
    @DisplayName("验证非抢占式超时（允许后续代码继续）")
    void testNonPreemptiveTimeout() {
        Assertions.assertTimeout(
            java.time.Duration.ofMillis(100),
            () -> {
                Thread.sleep(50);
                System.out.println("执行完成");
            }
        );
    }

    @Test
    @DisplayName("验证抢占式超时（立即停止）")
    void testPreemptiveTimeout() {
        Assertions.assertTimeoutPreemptively(
            java.time.Duration.ofMillis(100),
            () -> {
                // 如果超过 100ms，立即抛出异常
                Thread.sleep(150);
            }
        );
    }
}
```

### 组合断言

```java
class AssertAllTests {
    @Test
    @DisplayName("测试多个断言条件")
    void testAssertAll() {
        Person person = new Person("Alice", 30, "alice@example.com");

        // assertAll 会执行所有断言，即使某些失败
        Assertions.assertAll("验证 Person 对象",
            () -> Assertions.assertEquals("Alice", person.getName()),
            () -> Assertions.assertEquals(30, person.getAge()),
            () -> Assertions.assertTrue(person.getEmail().contains("@")),
            () -> Assertions.assertFalse(person.getName().isBlank())
        );
    }
}

class Person {
    private String name;
    private int age;
    private String email;

    public Person(String name, int age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
    public String getEmail() { return email; }
}
```

### 动态测试

```java
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;
import java.util.stream.Stream;

class DynamicTestsExample {

    @TestFactory
    @DisplayName("动态生成乘法表测试")
    java.util.stream.Stream<DynamicTest> generateMultiplicationTests() {
        return java.util.stream.Stream.of(1, 2, 3, 4, 5)
            .flatMap(i -> java.util.stream.Stream.of(1, 2, 3, 4, 5)
                .map(j -> DynamicTest.dynamicTest(
                    i + " x " + j + " = " + (i * j),
                    () -> Assertions.assertEquals(i * j, i * j)
                ))
            );
    }

    @TestFactory
    @DisplayName("从集合生成动态测试")
    java.util.Collection<DynamicTest> generateDynamicTests() {
        var testCases = java.util.List.of(
            new TestCase("test-1", "input1", "expected1"),
            new TestCase("test-2", "input2", "expected2"),
            new TestCase("test-3", "input3", "expected3")
        );

        return testCases.stream()
            .map(testCase -> DynamicTest.dynamicTest(
                testCase.name,
                () -> {
                    // 执行测试逻辑
                    Assertions.assertNotNull(testCase.input);
                    Assertions.assertNotNull(testCase.expected);
                }
            ))
            .toList();
    }

    static class TestCase {
        String name;
        String input;
        String expected;

        TestCase(String name, String input, String expected) {
            this.name = name;
            this.input = input;
            this.expected = expected;
        }
    }
}
```

### 嵌套测试

```java
import org.junit.jupiter.api.Nested;

@DisplayName("栈数据结构测试")
class StackTests {
    private Stack<String> stack;

    @BeforeEach
    void init() {
        stack = new Stack<>();
    }

    @Nested
    @DisplayName("空栈测试")
    class EmptyStackTests {
        @Test
        @DisplayName("空栈是否为空")
        void isEmpty() {
            Assertions.assertTrue(stack.isEmpty());
        }

        @Test
        @DisplayName("弹出空栈抛出异常")
        void popEmptyStackThrowsException() {
            Assertions.assertThrows(EmptyStackException.class, stack::pop);
        }
    }

    @Nested
    @DisplayName("非空栈测试")
    class NonEmptyStackTests {
        @BeforeEach
        void pushItem() {
            stack.push("一个元素");
        }

        @Test
        @DisplayName("非空栈不为空")
        void isNotEmpty() {
            Assertions.assertFalse(stack.isEmpty());
        }

        @Test
        @DisplayName("弹出元素返回正确值")
        void popReturnsCorrectElement() {
            Assertions.assertEquals("一个元素", stack.pop());
        }
    }
}
```

### 自定义扩展

```java
import org.junit.jupiter.api.extension.*;

// 自定义扩展：记录测试执行时间
class TimingExtension implements BeforeEachCallback, AfterEachCallback {

    private static final String START_TIME = "start time";

    @Override
    public void beforeEach(ExtensionContext context) {
        context.getStore(ExtensionContext.Namespace.create(
            getClass(), context.getRequiredTestMethod()
        )).put(START_TIME, System.currentTimeMillis());
    }

    @Override
    public void afterEach(ExtensionContext context) {
        long startTime = context.getStore(ExtensionContext.Namespace.create(
            getClass(), context.getRequiredTestMethod()
        )).remove(START_TIME, long.class);

        long duration = System.currentTimeMillis() - startTime;
        System.out.println("测试 " + context.getDisplayName() +
                         " 耗时: " + duration + " ms");
    }
}

// 使用自定义扩展
@ExtendWith(TimingExtension.class)
class TimedTests {
    @Test
    void testSomething() throws InterruptedException {
        Thread.sleep(100);
    }
}

// 自定义扩展：条件化测试执行
class OnlyOnLinuxCondition implements ExecutionCondition {
    @Override
    public ConditionEvaluationResult evaluateExecutionCondition(
            ExtensionContext context) {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("linux")) {
            return ConditionEvaluationResult.enabled("Linux 系统上运行");
        }
        return ConditionEvaluationResult.disabled("非 Linux 系统");
    }
}

@ExtendWith(OnlyOnLinuxCondition.class)
class LinuxOnlyTests {
    @Test
    void testLinuxFeature() {
        // 仅在 Linux 上运行
    }
}
```

### 参数解析器扩展

```java
import org.junit.jupiter.api.extension.ParameterContext;
import org.junit.jupiter.api.extension.ParameterResolver;

// 自定义参数解析器：注入自定义对象
class RandomParameterResolver implements ParameterResolver {

    @Override
    public boolean supportsParameter(ParameterContext parameterContext,
                                    ExtensionContext extensionContext) {
        return parameterContext.getParameter()
            .isAnnotationPresent(RandomInt.class);
    }

    @Override
    public Object resolveParameter(ParameterContext parameterContext,
                                  ExtensionContext extensionContext) {
        RandomInt annotation = parameterContext.getParameter()
            .getAnnotation(RandomInt.class);
        return java.util.concurrent.ThreadLocalRandom.current()
            .nextInt(annotation.min(), annotation.max() + 1);
    }
}

// 自定义注解
@java.lang.annotation.Target(java.lang.annotation.ElementType.PARAMETER)
@java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
public @interface RandomInt {
    int min() default 0;
    int max() default 100;
}

// 使用参数解析器
@ExtendWith(RandomParameterResolver.class)
class RandomParameterTests {
    @Test
    void testWithRandomInt(@RandomInt(min = 1, max = 100) int value) {
        Assertions.assertTrue(value >= 1 && value <= 100);
    }
}
```

## 最佳实践

### 测试命名约定

```java
// 好的命名方式
class UserServiceTests {
    @Test
    void shouldThrowExceptionWhenUserIdIsNull() { }

    @Test
    void shouldReturnUserWhenIdExists() { }

    @Test
    void shouldReturnEmptyOptionalWhenIdDoesNotExist() { }
}

// 使用 @DisplayName 提供更清晰的描述
@DisplayName("用户服务功能测试")
class UserServiceTests {
    @Test
    @DisplayName("当用户 ID 为空时应抛出异常")
    void testNullUserId() { }
}
```

### 一个测试只测试一个逻辑

```java
// 不好的做法：测试多个不相关的逻辑
@Test
void testUserCreationAndDeletion() {
    User user = userService.create("Alice");
    Assertions.assertNotNull(user);
    userService.delete(user.getId());
    Assertions.assertNull(userService.findById(user.getId()));
}

// 好的做法：分离成两个测试
@Test
void testUserCreation() {
    User user = userService.create("Alice");
    Assertions.assertNotNull(user);
    Assertions.assertEquals("Alice", user.getName());
}

@Test
void testUserDeletion() {
    User user = userService.create("Alice");
    userService.delete(user.getId());
    Assertions.assertNull(userService.findById(user.getId()));
}
```

### 使用测试工厂构建复杂对象

```java
// 创建测试工厂类
class UserTestFactory {
    public static User createDefaultUser() {
        return new User("Alice", "alice@example.com", 30);
    }

    public static User createUserWithAge(int age) {
        return new User("Bob", "bob@example.com", age);
    }
}

// 在测试中使用
class UserServiceTests {
    @Test
    void testUserService() {
        User user = UserTestFactory.createDefaultUser();
        // 测试逻辑
    }
}
```

### 使用 Mockito 和 JUnit 5

```java
import org.mockito.*;

@DisplayName("订单服务测试")
class OrderServiceTests {

    @Mock
    private PaymentGateway paymentGateway;

    @InjectMocks
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void shouldProcessPaymentWhenOrderIsCreated() {
        Order order = new Order("order-1", 100.0);

        // 配置 mock
        Mockito.when(paymentGateway.processPayment(100.0))
            .thenReturn(true);

        // 执行
        boolean result = orderService.create(order);

        // 验证
        Assertions.assertTrue(result);
        Mockito.verify(paymentGateway)
            .processPayment(100.0);
    }
}
```

### AAA 测试模式

```java
// Arrange - Act - Assert 模式
@Test
void testTransferMoney() {
    // Arrange：准备测试数据
    Account fromAccount = new Account("Alice", 1000);
    Account toAccount = new Account("Bob", 500);

    // Act：执行操作
    fromAccount.transfer(toAccount, 200);

    // Assert：验证结果
    Assertions.assertEquals(800, fromAccount.getBalance());
    Assertions.assertEquals(700, toAccount.getBalance());
}
```

### 使用 @Tag 组织测试

```java
@DisplayName("用户服务测试")
class UserServiceTests {

    @Test
    @Tag("快速")
    @Tag("单元")
    void testFastOperation() {
        // 快速的单元测试
    }

    @Test
    @Tag("慢速")
    @Tag("集成")
    void testSlowOperation() {
        // 涉及数据库的集成测试
    }
}

// 运行标记为 "快速" 的测试
// mvn test -Dgroups="快速"
```

### 设置和清理的最佳实践

```java
class DatabaseTests {
    private static Database database;

    @BeforeAll
    static void setupDatabase() {
        // 一次性初始化数据库（昂贵操作）
        database = new Database();
        database.initialize();
    }

    @BeforeEach
    void clearTestData() {
        // 每个测试前清理测试数据
        database.clearAllTables();
    }

    @AfterEach
    void captureState() {
        // 测试失败时捕获状态（可选）
        if (TestInfo.currentTestFailed()) {
            database.dumpState();
        }
    }

    @AfterAll
    static void tearDownDatabase() {
        // 关闭数据库连接
        database.close();
    }
}
```

## 常见陷阱

### 测试顺序依赖

```java
// 不好的做法：测试依赖于执行顺序
class BadOrderDependentTests {
    private static int counter = 0;

    @Test
    void test1() {
        counter = 1;  // 依赖顺序
    }

    @Test
    void test2() {
        Assertions.assertEquals(1, counter);  // 错误：counter 可能为 0
    }
}

// 好的做法：测试独立运行
class GoodIndependentTests {
    @Test
    void test1() {
        int result = 1;
        Assertions.assertEquals(1, result);
    }

    @Test
    void test2() {
        int result = 2;
        Assertions.assertEquals(2, result);
    }
}
```

### 过度使用 Mock

```java
// 不好的做法：过度 Mock 导致测试无效
class OverMockedTests {
    @Test
    void testUserValidation() {
        User user = Mockito.mock(User.class);
        Mockito.when(user.isValid()).thenReturn(true);  // 完全模拟，无效测试
        Assertions.assertTrue(user.isValid());
    }
}

// 好的做法：只 Mock 外部依赖
class ProperMockTests {
    @Mock
    private UserRepository repository;

    @Test
    void testSaveUser() {
        User user = new User("Alice", "alice@example.com");
        Mockito.when(repository.save(user)).thenReturn(user);

        UserService service = new UserService(repository);
        User saved = service.register(user);

        Assertions.assertEquals("Alice", saved.getName());
    }
}
```

### 不清理资源

```java
// 不好的做法：没有清理
class ResourceLeakTest {
    @Test
    void testWithoutCleanup() {
        FileWriter writer = new FileWriter("test.txt");
        // 忘记关闭
    }
}

// 好的做法：使用 try-with-resources
class ProperResourceCleanup {
    @Test
    void testWithCleanup() {
        try (FileWriter writer = new FileWriter("test.txt")) {
            writer.write("test");
        } catch (IOException e) {
            Assertions.fail("文件操作失败");
        }
    }

    @Test
    void testWithSetupAndTeardown() {
        FileWriter writer = null;
        try {
            writer = new FileWriter("test.txt");
            writer.write("test");
        } catch (IOException e) {
            Assertions.fail("文件操作失败");
        } finally {
            if (writer != null) {
                try {
                    writer.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
```

### 忽略异常

```java
// 不好的做法：吞掉异常
@Test
void badExceptionTest() {
    try {
        riskyOperation();
    } catch (Exception e) {
        // 忽略异常，测试通过
    }
}

// 好的做法：明确处理异常
@Test
void goodExceptionTest() {
    Assertions.assertThrows(IllegalArgumentException.class,
        () -> riskyOperation());
}
```

### 硬编码路径和数据库连接

```java
// 不好的做法：硬编码
@Test
void badHardcodedTest() {
    String path = "/home/user/test.txt";  // 特定于某个系统
    String dbUrl = "jdbc:mysql://localhost:3306/testdb";  // 硬编码
}

// 好的做法：使用配置
@Test
void goodConfiguredTest() {
    String path = System.getProperty("test.data.dir") + "/test.txt";
    String dbUrl = System.getProperty("db.url");
}
```

## 性能考量

### 测试执行速度

```java
// 优化：并行执行测试
// junit-platform.properties
junit.jupiter.execution.parallel.enabled=true
junit.jupiter.execution.parallel.mode.default=concurrent
junit.jupiter.execution.parallel.mode.classes.default=concurrent

// 标记为并发不安全的测试
@org.junit.jupiter.api.parallel.Isolated
class NotThreadSafeTest {
    @Test
    void testNeedsSingleThreadExecution() { }
}
```

### 测试数据库连接

```java
// 优化：使用共享数据库连接
@ExtendWith(DatabaseExtension.class)
class DatabaseTests {
    private static final DataSource SHARED_DATA_SOURCE =
        createDataSource();

    @BeforeEach
    void setupTestData(Connection conn) {
        // 使用共享连接
    }
}
```

### 避免重复初始化

```java
// 优化：使用 @BeforeAll 进行昂贵操作
class ExpensiveSetupTest {
    private static ExpensiveResource resource;

    @BeforeAll
    static void setUpExpensiveResource() {
        resource = new ExpensiveResource();
        // 昂贵的初始化
    }

    @Test
    void test1() {
        // 使用 resource
    }

    @Test
    void test2() {
        // 使用 resource
    }

    @AfterAll
    static void cleanupExpensiveResource() {
        resource.cleanup();
    }
}
```

### 测试覆盖率工具

```bash
# 使用 JaCoCo 收集代码覆盖率
# Maven pom.xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.8</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>

# 运行测试生成覆盖率报告
mvn clean test
```

## 实战场景

### 场景 1：REST API 测试

```java
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerTests {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void testGetUserById() throws Exception {
        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Alice"));
    }

    @Test
    void testCreateUser() throws Exception {
        String userJson = "{\"name\": \"Bob\", \"email\": \"bob@example.com\"}";

        mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content(userJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists());
    }
}
```

### 场景 2：数据库操作测试

```java
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

@DataJpaTest
class UserRepositoryTests {
    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testFindByEmail() {
        User user = new User("Alice", "alice@example.com");
        entityManager.persistAndFlush(user);

        User found = userRepository.findByEmail("alice@example.com");
        Assertions.assertNotNull(found);
        Assertions.assertEquals("Alice", found.getName());
    }

    @Test
    void testFindByIdNotFound() {
        java.util.Optional<User> notFound = userRepository.findById(999L);
        Assertions.assertTrue(notFound.isEmpty());
    }
}
```

### 场景 3：服务层测试

```java
@DisplayName("用户服务业务测试")
class UserServiceTests {
    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegisterNewUser() {
        User newUser = new User("Carol", "carol@example.com");
        Mockito.when(userRepository.save(newUser)).thenReturn(newUser);

        User registered = userService.register(newUser);

        Assertions.assertNotNull(registered);
        Mockito.verify(emailService).sendWelcomeEmail("carol@example.com");
    }

    @Test
    void testRegisterWithDuplicateEmail() {
        User existingUser = new User("Alice", "alice@example.com");
        Mockito.when(userRepository.findByEmail("alice@example.com"))
            .thenReturn(existingUser);

        User newUser = new User("Another Alice", "alice@example.com");

        Assertions.assertThrows(DuplicateEmailException.class,
            () -> userService.register(newUser));
    }
}
```

### 场景 4：参数化测试的实际应用

```java
class EmailValidationTests {
    @ParameterizedTest(name = "验证邮箱: {0}")
    @CsvSource({
        "valid@example.com, true",
        "invalid@example, false",
        "user@domain.co.uk, true",
        "plaintext, false",
        "@example.com, false"
    })
    void testEmailValidation(String email, boolean isValid) {
        EmailValidator validator = new EmailValidator();
        Assertions.assertEquals(isValid, validator.isValid(email));
    }
}

class NumberRangeTests {
    @ParameterizedTest
    @ValueSource(ints = {0, 1, 2, 3, 4, 5})
    void testIsEven(int number) {
        Assertions.assertEquals(number % 2, 0);
    }
}
```

## 面试要点

### Q1: JUnit 5 相比 JUnit 4 的主要改进有哪些？

**A:**
- 模块化架构（Platform, Jupiter, Vintage）
- 更灵活的扩展机制（Extension 替代 Runner）
- 内置参数化测试支持
- 支持动态测试（@TestFactory）
- 更丰富的生命周期注解
- 更强大的断言库
- 支持嵌套测试（@Nested）
- 更好的显示名称控制（@DisplayName）

### Q2: 解释 JUnit 5 的生命周期

**A:**
1. 创建测试实例
2. @BeforeAll 静态方法（全局一次）
3. 对每个测试方法：
   - @BeforeEach
   - @Test 方法
   - @AfterEach
4. @AfterAll 静态方法（全局一次）

### Q3: 参数化测试有哪些数据源？

**A:**
- @ValueSource：单一参数值
- @CsvSource：CSV 格式
- @CsvFileSource：CSV 文件
- @MethodSource：方法提供的参数
- @ArgumentsSource：自定义参数源
- @EnumSource：枚举值

### Q4: 什么是 JUnit 5 的扩展机制？

**A:** Extension 接口提供了多个回调接口（如 BeforeEachCallback、AfterEachCallback、ParameterResolver 等），允许在测试执行的各个阶段注入自定义逻辑。

### Q5: 如何在 JUnit 5 中处理异常测试？

**A:** 使用 `assertThrows()` 方法验证异常的抛出，可获取异常对象进一步验证异常类型和消息。

### Q6: @BeforeEach 和 @BeforeAll 的区别？

**A:**
- @BeforeAll：静态方法，在所有测试执行前运行一次，用于全局初始化
- @BeforeEach：实例方法，在每个测试方法前运行，用于准备测试数据

### Q7: 什么是测试隔离？为什么重要？

**A:** 测试隔离确保每个测试都是独立的，结果不依赖于其他测试的执行顺序。重要性：
- 提高测试可靠性
- 便于并行执行
- 简化调试
- 提高代码质量

### Q8: 如何在 JUnit 5 中集成 Mockito？

**A:**
```java
@ExtendWith(MockitoExtension.class)
class MyTest {
    @Mock
    private Dependency dependency;

    @InjectMocks
    private MyService service;
}
```

## 延伸阅读

### 官方资源
- [JUnit 5 官方文档](https://junit.org/junit5/docs/current/user-guide/)
- [JUnit Platform](https://junit.org/junit5/docs/current/user-guide/#junit-platform)
- [Jupiter 扩展机制](https://junit.org/junit5/docs/current/user-guide/#extensions)

### 相关框架
- [Mockito - Java Mock 框架](https://site.mockito.org/)
- [TestContainers - 容器化测试](https://www.testcontainers.org/)
- [AssertJ - 流畅式断言库](https://assertj.github.io/assertj-core-features-highlight.html)
- [Hamcrest - 匹配器库](https://hamcrest.org/)

### 最佳实践文献
- 《Effective Java》- Joshua Bloch，第三部分测试相关内容
- 《Test Driven Development: By Example》- Kent Beck
- 《Working Effectively with Legacy Code》- Michael Feathers
- 《Clean Code》- Robert Martin，第 9 章测试

### 相关话题
- Spring Test 框架集成
- 数据库测试工具（TestContainers）
- 代码覆盖率工具（JaCoCo）
- 性能测试（JMH）
- 集成测试与端到端测试

### 在线资源
- [Baeldung - JUnit 5 教程](https://www.baeldung.com/junit-5)
- [DZone - Java 测试社区](https://dzone.com/java-testing)
- [GitHub - JUnit 5 示例项目](https://github.com/junit-team/junit5-samples)

### 推荐实践
- 采用 TDD（测试驱动开发）方法论
- 编写清晰、独立的单元测试
- 使用参数化测试减少代码重复
- 合理使用 Mock 和 Stub
- 定期检查代码覆盖率
- 在 CI/CD 流程中运行测试
- 维护测试代码的质量和可读性
