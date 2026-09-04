---
title: Kotlin 测试
description: 学习 Kotlin 测试框架，包括 JUnit 5、Kotest 和 MockK 进行单元测试
track: kotlin
section: tooling
difficulty: intermediate
tags:
  - Kotlin
  - 测试
  - JUnit
  - MockK
status: imported
origin: old/src/content/docs/kotlin/testing.zh.md
divergence: 0.209
issues:
  - title-lang-en
  - title-language
legacy:
  category: Kotlin
  subcategory: 测试
  order: 15
  lastUpdated: 2026-01-07
---

测试是保证代码质量的关键环节。Kotlin 生态系统提供了丰富的测试工具，从经典的 JUnit 5 到 Kotlin 原生的 Kotest，再到专为 Kotlin 设计的 MockK 模拟框架。本文将全面介绍 Kotlin 测试的各个方面，帮助你构建健壮的测试套件。

## 测试框架概览

### 为什么需要专门的 Kotlin 测试工具

虽然 Java 的测试框架可以直接在 Kotlin 中使用，但 Kotlin 的语言特性（如空安全、扩展函数、协程、内联类等）需要专门的工具来更好地支持：

| 框架 | 特点 | 适用场景 |
|------|------|----------|
| JUnit 5 | 行业标准，广泛支持 | 通用单元测试 |
| Kotest | Kotlin 原生，多种测试风格 | BDD 风格、属性测试 |
| MockK | Kotlin 原生模拟库 | 模拟 Kotlin 特性 |
| kotlinx-coroutines-test | 协程测试支持 | 异步代码测试 |
| Testcontainers | 容器化集成测试 | 数据库、消息队列测试 |

## 项目配置

### Gradle 配置（Kotlin DSL）

```kotlin
plugins {
    kotlin("jvm") version "2.0.0"
}

dependencies {
    // JUnit 5
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.2")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // Kotest
    testImplementation("io.kotest:kotest-runner-junit5:5.8.0")
    testImplementation("io.kotest:kotest-assertions-core:5.8.0")
    testImplementation("io.kotest:kotest-property:5.8.0")

    // MockK
    testImplementation("io.mockk:mockk:1.13.10")

    // 协程测试
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")

    // Testcontainers
    testImplementation("org.testcontainers:testcontainers:1.19.7")
    testImplementation("org.testcontainers:junit-jupiter:1.19.7")
    testImplementation("org.testcontainers:postgresql:1.19.7")
}

tasks.test {
    useJUnitPlatform()
}
```

### Maven 配置

```xml
<dependencies>
    <!-- JUnit 5 -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.2</version>
        <scope>test</scope>
    </dependency>

    <!-- MockK -->
    <dependency>
        <groupId>io.mockk</groupId>
        <artifactId>mockk-jvm</artifactId>
        <version>1.13.10</version>
        <scope>test</scope>
    </dependency>

    <!-- 协程测试 -->
    <dependency>
        <groupId>org.jetbrains.kotlinx</groupId>
        <artifactId>kotlinx-coroutines-test</artifactId>
        <version>1.8.0</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

## JUnit 5 与 Kotlin

### 基础测试

JUnit 5 是 Java 生态中最广泛使用的测试框架，与 Kotlin 配合良好：

```kotlin
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*

class CalculatorTest {

    private lateinit var calculator: Calculator

    @BeforeEach
    fun setUp() {
        calculator = Calculator()
    }

    @Test
    fun `加法应该返回两数之和`() {
        // Given
        val a = 5
        val b = 3

        // When
        val result = calculator.add(a, b)

        // Then
        assertEquals(8, result)
    }

    @Test
    fun `除法遇到除数为零应该抛出异常`() {
        assertThrows<ArithmeticException> {
            calculator.divide(10, 0)
        }
    }

    @Test
    @DisplayName("测试负数相加")
    fun testNegativeNumbers() {
        assertEquals(-8, calculator.add(-5, -3))
    }
}

class Calculator {
    fun add(a: Int, b: Int): Int = a + b
    fun divide(a: Int, b: Int): Int = a / b
}
```

### 嵌套测试

使用 `@Nested` 组织相关测试，提高可读性：

```kotlin
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Assertions.*

class UserServiceTest {

    private lateinit var userService: UserService

    @BeforeEach
    fun setUp() {
        userService = UserService()
    }

    @Nested
    inner class `用户注册` {

        @Test
        fun `有效用户数据应该注册成功`() {
            val result = userService.register("alice", "alice@example.com")
            assertTrue(result.isSuccess)
        }

        @Test
        fun `空用户名应该注册失败`() {
            val result = userService.register("", "alice@example.com")
            assertTrue(result.isFailure)
        }

        @Test
        fun `无效邮箱应该注册失败`() {
            val result = userService.register("alice", "invalid-email")
            assertTrue(result.isFailure)
        }
    }

    @Nested
    inner class `用户查询` {

        @BeforeEach
        fun registerUser() {
            userService.register("bob", "bob@example.com")
        }

        @Test
        fun `按用户名查询存在的用户应该返回用户`() {
            val user = userService.findByUsername("bob")
            assertNotNull(user)
            assertEquals("bob@example.com", user?.email)
        }

        @Test
        fun `查询不存在的用户应该返回null`() {
            val user = userService.findByUsername("unknown")
            assertNull(user)
        }
    }
}
```

### 参数化测试

使用不同参数运行同一测试：

```kotlin
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.*
import org.junit.jupiter.api.Assertions.*

class StringUtilsTest {

    @ParameterizedTest
    @ValueSource(strings = ["", "  ", "\t", "\n"])
    fun `空白字符串应该被识别为空`(input: String) {
        assertTrue(input.isBlank())
    }

    @ParameterizedTest
    @CsvSource(
        "hello, HELLO",
        "world, WORLD",
        "Kotlin, KOTLIN"
    )
    fun `字符串应该正确转换为大写`(input: String, expected: String) {
        assertEquals(expected, input.uppercase())
    }

    @ParameterizedTest
    @MethodSource("provideEmailTestData")
    fun `邮箱验证测试`(email: String, isValid: Boolean) {
        assertEquals(isValid, isValidEmail(email))
    }

    companion object {
        @JvmStatic
        fun provideEmailTestData(): List<Arguments> = listOf(
            Arguments.of("user@example.com", true),
            Arguments.of("user.name@example.co.uk", true),
            Arguments.of("invalid-email", false),
            Arguments.of("@example.com", false),
            Arguments.of("user@", false)
        )
    }

    private fun isValidEmail(email: String): Boolean {
        return email.matches(Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"))
    }
}
```

### 测试生命周期

```kotlin
import org.junit.jupiter.api.*

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LifecycleTest {

    companion object {
        @JvmStatic
        @BeforeAll
        fun setUpAll() {
            println("所有测试开始前执行一次")
        }

        @JvmStatic
        @AfterAll
        fun tearDownAll() {
            println("所有测试结束后执行一次")
        }
    }

    @BeforeEach
    fun setUp() {
        println("每个测试方法前执行")
    }

    @AfterEach
    fun tearDown() {
        println("每个测试方法后执行")
    }

    @Test
    fun test1() {
        println("执行测试1")
    }

    @Test
    fun test2() {
        println("执行测试2")
    }
}
```

使用 `PER_CLASS` 生命周期可以简化伴生对象中的静态方法：

```kotlin
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SimplifiedLifecycleTest {

    @BeforeAll
    fun setUpAll() {
        // 不需要 @JvmStatic
        println("设置共享资源")
    }

    @AfterAll
    fun tearDownAll() {
        println("清理共享资源")
    }
}
```

## Kotest 测试框架

### Kotest 简介

Kotest 是一个 Kotlin 原生的测试框架，提供多种测试风格、强大的断言库和属性测试支持。

### 测试风格

Kotest 支持多种测试规范风格：

#### StringSpec - 最简洁的风格

```kotlin
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe

class StringSpecExample : StringSpec({

    "字符串长度应该正确计算" {
        "hello".length shouldBe 5
    }

    "空字符串长度应该为0" {
        "".length shouldBe 0
    }

    "字符串相加应该连接" {
        ("hello" + " " + "world") shouldBe "hello world"
    }
})
```

#### FunSpec - 函数式风格

```kotlin
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe

class FunSpecExample : FunSpec({

    test("列表应该包含添加的元素") {
        val list = mutableListOf<Int>()
        list.add(1)
        list.add(2)

        list.size shouldBe 2
        list shouldBe listOf(1, 2)
    }

    context("空列表") {
        test("size应该为0") {
            emptyList<Int>().size shouldBe 0
        }

        test("isEmpty应该返回true") {
            emptyList<Int>().isEmpty() shouldBe true
        }
    }
})
```

#### BehaviorSpec - BDD 风格

```kotlin
import io.kotest.core.spec.style.BehaviorSpec
import io.kotest.matchers.shouldBe

class BehaviorSpecExample : BehaviorSpec({

    Given("一个购物车") {
        val cart = ShoppingCart()

        When("添加商品") {
            cart.addItem(Item("苹果", 5.0))

            Then("购物车不应该为空") {
                cart.isEmpty() shouldBe false
            }

            Then("商品数量应该为1") {
                cart.itemCount shouldBe 1
            }
        }

        When("清空购物车") {
            cart.clear()

            Then("购物车应该为空") {
                cart.isEmpty() shouldBe true
            }
        }
    }
})

class ShoppingCart {
    private val items = mutableListOf<Item>()

    fun addItem(item: Item) { items.add(item) }
    fun clear() { items.clear() }
    fun isEmpty(): Boolean = items.isEmpty()
    val itemCount: Int get() = items.size
}

data class Item(val name: String, val price: Double)
```

#### DescribeSpec - 类似 RSpec/Mocha 风格

```kotlin
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe

class DescribeSpecExample : DescribeSpec({

    describe("Calculator") {
        val calculator = Calculator()

        describe("add") {
            it("应该正确计算两个正数之和") {
                calculator.add(2, 3) shouldBe 5
            }

            it("应该正确处理负数") {
                calculator.add(-1, 1) shouldBe 0
            }
        }

        describe("divide") {
            it("应该正确计算除法") {
                calculator.divide(10, 2) shouldBe 5
            }

            xit("应该处理除以零的情况") {
                // 跳过此测试
            }
        }
    }
})
```

### Kotest 断言

Kotest 提供了丰富的断言方法：

```kotlin
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.*
import io.kotest.matchers.collections.*
import io.kotest.matchers.string.*
import io.kotest.matchers.types.*
import io.kotest.matchers.nulls.*

class AssertionsExample : StringSpec({

    "基本断言" {
        val value = 42

        value shouldBe 42
        value shouldNotBe 0
        value shouldBeGreaterThan 40
        value shouldBeLessThanOrEqualTo 42
        value shouldBeInRange 1..100
    }

    "字符串断言" {
        val str = "Hello Kotlin"

        str shouldStartWith "Hello"
        str shouldEndWith "Kotlin"
        str shouldContain "lo Ko"
        str shouldMatch Regex("Hello.*")
        str.shouldHaveLength(12)
        str.shouldBeUpperCase().not()
    }

    "集合断言" {
        val list = listOf(1, 2, 3, 4, 5)

        list shouldHaveSize 5
        list shouldContain 3
        list shouldContainAll listOf(1, 3, 5)
        list shouldContainExactly listOf(1, 2, 3, 4, 5)
        list.shouldBeSorted()
        list shouldNotContain 10
    }

    "空值断言" {
        val nullable: String? = null
        val nonNull: String? = "value"

        nullable.shouldBeNull()
        nonNull.shouldNotBeNull()
        nonNull shouldBe "value"
    }

    "类型断言" {
        val obj: Any = "string"

        obj.shouldBeInstanceOf<String>()
        obj.shouldBeTypeOf<String>()
    }

    "异常断言" {
        val exception = shouldThrow<IllegalArgumentException> {
            require(false) { "参数无效" }
        }
        exception.message shouldContain "参数无效"
    }
})
```

### 属性测试（Property-Based Testing）

属性测试可以自动生成大量测试数据：

```kotlin
import io.kotest.core.spec.style.StringSpec
import io.kotest.property.forAll
import io.kotest.property.Arb
import io.kotest.property.arbitrary.*
import io.kotest.property.checkAll

class PropertyTestExample : StringSpec({

    "字符串反转两次应该得到原字符串" {
        forAll<String> { str ->
            str.reversed().reversed() == str
        }
    }

    "列表排序后长度不变" {
        forAll<List<Int>> { list ->
            list.sorted().size == list.size
        }
    }

    "加法交换律" {
        forAll<Int, Int> { a, b ->
            a + b == b + a
        }
    }

    "使用自定义生成器" {
        val positiveInts = Arb.int(1..1000)
        val emails = Arb.email()

        checkAll(positiveInts, positiveInts) { a, b ->
            a + b > a
            a + b > b
        }
    }

    "生成自定义对象" {
        val userArb = Arb.bind(
            Arb.string(minSize = 1, maxSize = 20),
            Arb.int(18..100)
        ) { name, age -> User(name, age) }

        checkAll(userArb) { user ->
            user.age >= 18
            user.name.isNotEmpty()
        }
    }
})

data class User(val name: String, val age: Int)
```

### 测试生命周期与配置

```kotlin
import io.kotest.core.spec.style.FunSpec
import io.kotest.core.spec.IsolationMode
import io.kotest.core.test.TestCaseOrder

class LifecycleExample : FunSpec({

    // 每个测试使用独立实例（默认行为）
    isolationMode = IsolationMode.InstancePerLeaf

    // 测试执行顺序
    testOrder = TestCaseOrder.Sequential

    // 设置超时
    timeout = 5000 // 5秒

    // 在所有测试前执行
    beforeSpec {
        println("规范开始")
    }

    // 在每个测试前执行
    beforeTest {
        println("测试 ${it.name.testName} 开始")
    }

    // 在每个测试后执行
    afterTest { (testCase, result) ->
        println("测试 ${testCase.name.testName} 结束: ${result.isSuccess}")
    }

    // 在所有测试后执行
    afterSpec {
        println("规范结束")
    }

    test("测试1") {
        // ...
    }

    test("测试2") {
        // ...
    }
})
```

## MockK 模拟框架

### MockK 简介

MockK 是专为 Kotlin 设计的模拟库，完美支持 Kotlin 的语言特性：

- 支持 final 类（Kotlin 类默认为 final）
- 支持扩展函数
- 支持协程
- 支持伴生对象
- DSL 风格的 API

### 基础模拟

```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Assertions.*

class MockKBasicTest {

    private lateinit var userRepository: UserRepository
    private lateinit var userService: UserService

    @BeforeEach
    fun setUp() {
        userRepository = mockk()
        userService = UserService(userRepository)
    }

    @Test
    fun `findById 应该返回正确的用户`() {
        // Given - 设置模拟行为
        val expectedUser = User(1, "Alice", "alice@example.com")
        every { userRepository.findById(1) } returns expectedUser

        // When
        val result = userService.getUser(1)

        // Then
        assertEquals(expectedUser, result)
        verify { userRepository.findById(1) }
    }

    @Test
    fun `save 应该调用 repository`() {
        // Given
        val user = User(0, "Bob", "bob@example.com")
        every { userRepository.save(any()) } returns User(1, "Bob", "bob@example.com")

        // When
        val result = userService.createUser("Bob", "bob@example.com")

        // Then
        assertNotNull(result)
        assertEquals(1, result.id)
        verify(exactly = 1) { userRepository.save(any()) }
    }

    @Test
    fun `findById 不存在的用户应该返回 null`() {
        // Given
        every { userRepository.findById(999) } returns null

        // When
        val result = userService.getUser(999)

        // Then
        assertNull(result)
    }
}

interface UserRepository {
    fun findById(id: Long): User?
    fun save(user: User): User
    fun findAll(): List<User>
}

class UserService(private val repository: UserRepository) {
    fun getUser(id: Long): User? = repository.findById(id)
    fun createUser(name: String, email: String): User =
        repository.save(User(0, name, email))
}

data class User(val id: Long, val name: String, val email: String)
```

### 参数匹配

```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class ArgumentMatchingTest {

    @Test
    fun `使用参数匹配器`() {
        val service = mockk<DataService>()

        // any() - 匹配任何值
        every { service.process(any()) } returns "processed"

        // 具体值匹配
        every { service.process("special") } returns "special processed"

        // 匹配条件
        every { service.calculate(match { it > 0 }) } returns 100
        every { service.calculate(match { it <= 0 }) } returns 0

        // 捕获参数
        val slot = slot<String>()
        every { service.log(capture(slot)) } just Runs

        // 验证
        assertEquals("processed", service.process("anything"))
        assertEquals("special processed", service.process("special"))
        assertEquals(100, service.calculate(5))
        assertEquals(0, service.calculate(-1))

        service.log("test message")
        assertEquals("test message", slot.captured)
    }

    @Test
    fun `捕获多个调用的参数`() {
        val service = mockk<DataService>()
        val captured = mutableListOf<String>()

        every { service.log(capture(captured)) } just Runs

        service.log("first")
        service.log("second")
        service.log("third")

        assertEquals(listOf("first", "second", "third"), captured)
    }
}

interface DataService {
    fun process(data: String): String
    fun calculate(value: Int): Int
    fun log(message: String)
}
```

### 验证调用

```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test

class VerificationTest {

    @Test
    fun `验证调用次数`() {
        val service = mockk<NotificationService>(relaxed = true)

        service.send("user1", "Hello")
        service.send("user2", "World")
        service.send("user1", "Again")

        // 验证至少调用一次
        verify { service.send("user1", any()) }

        // 验证精确调用次数
        verify(exactly = 2) { service.send("user1", any()) }
        verify(exactly = 1) { service.send("user2", "World") }

        // 验证调用范围
        verify(atLeast = 1, atMost = 3) { service.send(any(), any()) }

        // 验证从未调用
        verify(exactly = 0) { service.send("user3", any()) }
    }

    @Test
    fun `验证调用顺序`() {
        val service = mockk<NotificationService>(relaxed = true)

        service.connect()
        service.send("user", "message")
        service.disconnect()

        // 验证调用顺序
        verifyOrder {
            service.connect()
            service.send(any(), any())
            service.disconnect()
        }

        // 严格顺序验证（不允许其他调用）
        verifySequence {
            service.connect()
            service.send("user", "message")
            service.disconnect()
        }
    }

    @Test
    fun `验证所有调用都被验证`() {
        val service = mockk<NotificationService>(relaxed = true)

        service.connect()
        service.send("user", "message")

        verify { service.connect() }
        verify { service.send("user", "message") }

        // 确认所有调用都已验证
        confirmVerified(service)
    }
}

interface NotificationService {
    fun connect()
    fun disconnect()
    fun send(user: String, message: String)
}
```

### 模拟返回值与异常

```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.assertThrows

class MockReturnValuesTest {

    @Test
    fun `返回多个值`() {
        val service = mockk<DataService>()

        // 每次调用返回不同的值
        every { service.getData() } returnsMany listOf("first", "second", "third")

        assertEquals("first", service.getData())
        assertEquals("second", service.getData())
        assertEquals("third", service.getData())
        // 之后继续返回最后一个值
        assertEquals("third", service.getData())
    }

    @Test
    fun `动态计算返回值`() {
        val service = mockk<DataService>()

        every { service.transform(any()) } answers {
            val input = firstArg<String>()
            input.uppercase()
        }

        assertEquals("HELLO", service.transform("hello"))
        assertEquals("WORLD", service.transform("world"))
    }

    @Test
    fun `模拟抛出异常`() {
        val service = mockk<DataService>()

        every { service.riskyOperation() } throws RuntimeException("模拟错误")

        val exception = assertThrows<RuntimeException> {
            service.riskyOperation()
        }
        assertEquals("模拟错误", exception.message)
    }

    @Test
    fun `先返回值后抛出异常`() {
        val service = mockk<DataService>()

        every { service.getData() } returns "success" andThenThrows RuntimeException("失败")

        assertEquals("success", service.getData())
        assertThrows<RuntimeException> {
            service.getData()
        }
    }
}

interface DataService {
    fun getData(): String
    fun transform(input: String): String
    fun riskyOperation(): Unit
}
```

### Spy 与部分模拟

```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class SpyTest {

    @Test
    fun `spyk 保留真实行为但可以覆盖`() {
        val realCalculator = Calculator()
        val spy = spyk(realCalculator)

        // 使用真实方法
        assertEquals(8, spy.add(5, 3))

        // 覆盖特定行为
        every { spy.multiply(any(), any()) } returns 100
        assertEquals(100, spy.multiply(2, 3)) // 返回模拟值
        assertEquals(8, spy.add(5, 3)) // 仍使用真实方法

        // 验证调用
        verify { spy.add(5, 3) }
        verify { spy.multiply(2, 3) }
    }

    @Test
    fun `使用 callOriginal 在特定条件下调用真实方法`() {
        val spy = spyk(Calculator())

        every { spy.add(any(), any()) } answers {
            val a = firstArg<Int>()
            val b = secondArg<Int>()
            if (a < 0 || b < 0) {
                throw IllegalArgumentException("不支持负数")
            }
            callOriginal()
        }

        assertEquals(8, spy.add(5, 3))
        assertThrows<IllegalArgumentException> {
            spy.add(-1, 3)
        }
    }
}

class Calculator {
    fun add(a: Int, b: Int): Int = a + b
    fun multiply(a: Int, b: Int): Int = a * b
}
```

### 模拟伴生对象与静态方法

```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*

class CompanionObjectTest {

    @AfterEach
    fun tearDown() {
        unmockkAll()
    }

    @Test
    fun `模拟伴生对象方法`() {
        mockkObject(IdGenerator)

        every { IdGenerator.generate() } returns "mocked-id"

        assertEquals("mocked-id", IdGenerator.generate())

        verify { IdGenerator.generate() }
    }

    @Test
    fun `模拟类的伴生对象`() {
        mockkObject(User.Companion)

        every { User.create("test") } returns User("mocked", "mocked@test.com")

        val user = User.create("test")
        assertEquals("mocked", user.name)
    }
}

object IdGenerator {
    fun generate(): String = java.util.UUID.randomUUID().toString()
}

data class User(val name: String, val email: String) {
    companion object {
        fun create(name: String): User = User(name, "$name@example.com")
    }
}
```

### 模拟扩展函数

```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*

class ExtensionFunctionTest {

    @AfterEach
    fun tearDown() {
        unmockkAll()
    }

    @Test
    fun `模拟扩展函数`() {
        // 模拟定义在模块级别的扩展函数
        mockkStatic("com.example.ExtensionsKt")

        every { any<String>().customExtension() } returns "mocked"

        assertEquals("mocked", "hello".customExtension())
    }

    @Test
    fun `模拟特定类的扩展函数`() {
        mockkStatic(String::customExtension)

        every { "hello".customExtension() } returns "mocked for hello"
        every { "world".customExtension() } returns "mocked for world"

        assertEquals("mocked for hello", "hello".customExtension())
        assertEquals("mocked for world", "world".customExtension())
    }
}

fun String.customExtension(): String = "real: $this"
```

### 模拟协程

```kotlin
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class CoroutineMockTest {

    @Test
    fun `模拟挂起函数`() = runTest {
        val repository = mockk<UserRepository>()
        val service = UserService(repository)

        // 使用 coEvery 模拟挂起函数
        coEvery { repository.findById(1L) } returns User(1L, "Alice", "alice@example.com")
        coEvery { repository.save(any()) } coAnswers { firstArg() }

        // When
        val user = service.getUser(1L)

        // Then
        assertNotNull(user)
        assertEquals("Alice", user?.name)

        // 使用 coVerify 验证挂起函数调用
        coVerify { repository.findById(1L) }
    }

    @Test
    fun `模拟挂起函数抛出异常`() = runTest {
        val repository = mockk<UserRepository>()

        coEvery { repository.findById(any()) } throws RuntimeException("网络错误")

        assertThrows<RuntimeException> {
            repository.findById(1L)
        }
    }
}

interface UserRepository {
    suspend fun findById(id: Long): User?
    suspend fun save(user: User): User
}

class UserService(private val repository: UserRepository) {
    suspend fun getUser(id: Long): User? = repository.findById(id)
}

data class User(val id: Long, val name: String, val email: String)
```

### 放松的模拟（Relaxed Mocks）

```kotlin
import io.mockk.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class RelaxedMockTest {

    @Test
    fun `relaxed mock 返回默认值`() {
        // relaxed = true 使未配置的方法返回默认值
        val service = mockk<DataService>(relaxed = true)

        // 返回基本类型的默认值
        assertEquals("", service.getString())
        assertEquals(0, service.getInt())
        assertEquals(false, service.getBoolean())
        assertEquals(emptyList<String>(), service.getList())

        // Unit 返回类型的方法不会抛出异常
        service.doSomething()
    }

    @Test
    fun `relaxUnitFun 只放松 Unit 返回类型`() {
        val service = mockk<DataService>(relaxUnitFun = true)

        // Unit 方法可以调用
        service.doSomething()

        // 非 Unit 方法仍需配置，否则抛出异常
        every { service.getString() } returns "configured"
        assertEquals("configured", service.getString())
    }
}

interface DataService {
    fun getString(): String
    fun getInt(): Int
    fun getBoolean(): Boolean
    fun getList(): List<String>
    fun doSomething()
}
```

## 协程测试

### kotlinx-coroutines-test 基础

`kotlinx-coroutines-test` 提供了测试协程代码的工具：

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.test.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class CoroutineBasicTest {

    @Test
    fun `runTest 自动跳过 delay`() = runTest {
        var result = 0

        launch {
            delay(1000) // 不会真正等待
            result = 42
        }

        advanceUntilIdle() // 推进虚拟时间直到所有协程完成
        assertEquals(42, result)
    }

    @Test
    fun `测试挂起函数`() = runTest {
        suspend fun fetchData(): String {
            delay(1000)
            return "data"
        }

        val result = fetchData()
        assertEquals("data", result)
        assertEquals(1000, currentTime) // 验证虚拟时间
    }

    @Test
    fun `验证时间流逝`() = runTest {
        var step = 0

        launch {
            delay(500)
            step = 1
            delay(500)
            step = 2
        }

        assertEquals(0, step)

        advanceTimeBy(500)
        runCurrent()
        assertEquals(1, step)

        advanceTimeBy(500)
        runCurrent()
        assertEquals(2, step)
    }
}
```

### TestDispatcher 使用

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.test.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Assertions.*

class TestDispatcherTest {

    private lateinit var testDispatcher: TestDispatcher
    private lateinit var testScope: TestScope

    @BeforeEach
    fun setUp() {
        testDispatcher = StandardTestDispatcher()
        testScope = TestScope(testDispatcher)
    }

    @Test
    fun `StandardTestDispatcher 需要手动推进`() = testScope.runTest {
        var executed = false

        launch {
            executed = true
        }

        // StandardTestDispatcher 需要手动推进
        assertFalse(executed)

        advanceUntilIdle()
        assertTrue(executed)
    }

    @Test
    fun `UnconfinedTestDispatcher 立即执行`() = runTest(UnconfinedTestDispatcher()) {
        var executed = false

        launch {
            executed = true
        }

        // UnconfinedTestDispatcher 立即执行
        assertTrue(executed)
    }
}
```

### 替换 Main Dispatcher

在 Android 或其他需要 `Dispatchers.Main` 的环境中测试：

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.test.*
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*

class MainDispatcherTest {

    @BeforeEach
    fun setUp() {
        Dispatchers.setMain(StandardTestDispatcher())
    }

    @AfterEach
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `测试使用 Main dispatcher 的代码`() = runTest {
        val viewModel = MyViewModel()

        viewModel.loadData()
        advanceUntilIdle()

        assertEquals("loaded", viewModel.state)
    }
}

class MyViewModel {
    var state: String = "initial"
        private set

    fun loadData() {
        CoroutineScope(Dispatchers.Main).launch {
            delay(1000)
            state = "loaded"
        }
    }
}
```

### 测试 Flow

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.test.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class FlowTest {

    @Test
    fun `测试简单 Flow`() = runTest {
        val flow = flow {
            emit(1)
            delay(100)
            emit(2)
            delay(100)
            emit(3)
        }

        val results = flow.toList()
        assertEquals(listOf(1, 2, 3), results)
    }

    @Test
    fun `使用 turbine 库测试 Flow`() = runTest {
        // Turbine 是一个流行的 Flow 测试库
        val flow = flow {
            emit("a")
            emit("b")
            emit("c")
        }

        val items = mutableListOf<String>()
        flow.collect { items.add(it) }

        assertEquals(listOf("a", "b", "c"), items)
    }

    @Test
    fun `测试 StateFlow`() = runTest {
        val stateFlow = MutableStateFlow(0)

        val values = mutableListOf<Int>()
        val job = launch(UnconfinedTestDispatcher()) {
            stateFlow.collect { values.add(it) }
        }

        stateFlow.value = 1
        stateFlow.value = 2
        stateFlow.value = 3

        job.cancel()

        assertEquals(listOf(0, 1, 2, 3), values)
    }

    @Test
    fun `测试 SharedFlow`() = runTest {
        val sharedFlow = MutableSharedFlow<String>()

        val emissions = mutableListOf<String>()
        val job = launch(UnconfinedTestDispatcher()) {
            sharedFlow.collect { emissions.add(it) }
        }

        sharedFlow.emit("first")
        sharedFlow.emit("second")

        job.cancel()

        assertEquals(listOf("first", "second"), emissions)
    }
}
```

### 测试超时和取消

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.test.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class TimeoutCancellationTest {

    @Test
    fun `测试协程取消`() = runTest {
        var cleanedUp = false

        val job = launch {
            try {
                delay(10000)
            } finally {
                cleanedUp = true
            }
        }

        advanceTimeBy(5000)
        job.cancel()
        advanceUntilIdle()

        assertTrue(job.isCancelled)
        assertTrue(cleanedUp)
    }

    @Test
    fun `测试 withTimeout`() = runTest {
        assertThrows<TimeoutCancellationException> {
            withTimeout(1000) {
                delay(2000)
            }
        }
    }

    @Test
    fun `测试 withTimeoutOrNull`() = runTest {
        val result = withTimeoutOrNull(1000) {
            delay(2000)
            "completed"
        }

        assertNull(result)
    }
}
```

## Testcontainers 集成测试

### 基础设置

Testcontainers 允许在 Docker 容器中运行真实的依赖服务：

```kotlin
import org.junit.jupiter.api.*
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.sql.DriverManager

@Testcontainers
class PostgreSQLIntegrationTest {

    companion object {
        @Container
        @JvmStatic
        val postgres = PostgreSQLContainer<Nothing>("postgres:15").apply {
            withDatabaseName("testdb")
            withUsername("test")
            withPassword("test")
        }
    }

    @Test
    fun `应该能连接到 PostgreSQL 容器`() {
        val connection = DriverManager.getConnection(
            postgres.jdbcUrl,
            postgres.username,
            postgres.password
        )

        connection.use {
            val statement = it.createStatement()
            val resultSet = statement.executeQuery("SELECT 1")
            resultSet.next()
            assertEquals(1, resultSet.getInt(1))
        }
    }

    @Test
    fun `应该能执行 SQL 操作`() {
        val connection = DriverManager.getConnection(
            postgres.jdbcUrl,
            postgres.username,
            postgres.password
        )

        connection.use { conn ->
            // 创建表
            conn.createStatement().execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL
                )
            """)

            // 插入数据
            conn.prepareStatement("INSERT INTO users (name) VALUES (?)").use { ps ->
                ps.setString(1, "Alice")
                ps.executeUpdate()
            }

            // 查询数据
            conn.createStatement().executeQuery("SELECT name FROM users").use { rs ->
                rs.next()
                assertEquals("Alice", rs.getString("name"))
            }
        }
    }
}
```

### Redis 容器测试

```kotlin
import org.junit.jupiter.api.*
import org.testcontainers.containers.GenericContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName
import redis.clients.jedis.Jedis

@Testcontainers
class RedisIntegrationTest {

    companion object {
        @Container
        @JvmStatic
        val redis = GenericContainer(DockerImageName.parse("redis:7")).apply {
            withExposedPorts(6379)
        }
    }

    private lateinit var jedis: Jedis

    @BeforeEach
    fun setUp() {
        jedis = Jedis(redis.host, redis.getMappedPort(6379))
    }

    @AfterEach
    fun tearDown() {
        jedis.close()
    }

    @Test
    fun `应该能存储和获取值`() {
        jedis.set("key", "value")
        assertEquals("value", jedis.get("key"))
    }

    @Test
    fun `应该能使用 hash`() {
        jedis.hset("user:1", "name", "Alice")
        jedis.hset("user:1", "email", "alice@example.com")

        val user = jedis.hgetAll("user:1")
        assertEquals("Alice", user["name"])
        assertEquals("alice@example.com", user["email"])
    }
}
```

### Kafka 容器测试

```kotlin
import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.clients.consumer.KafkaConsumer
import org.apache.kafka.clients.producer.KafkaProducer
import org.apache.kafka.clients.producer.ProducerConfig
import org.apache.kafka.clients.producer.ProducerRecord
import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.kafka.common.serialization.StringSerializer
import org.junit.jupiter.api.*
import org.testcontainers.containers.KafkaContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName
import java.time.Duration
import java.util.*

@Testcontainers
class KafkaIntegrationTest {

    companion object {
        @Container
        @JvmStatic
        val kafka = KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"))
    }

    @Test
    fun `应该能发送和接收消息`() {
        val topic = "test-topic"

        // 创建生产者
        val producerProps = Properties().apply {
            put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.bootstrapServers)
            put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer::class.java.name)
            put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer::class.java.name)
        }

        val producer = KafkaProducer<String, String>(producerProps)
        producer.send(ProducerRecord(topic, "key", "Hello Kafka!")).get()
        producer.close()

        // 创建消费者
        val consumerProps = Properties().apply {
            put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.bootstrapServers)
            put(ConsumerConfig.GROUP_ID_CONFIG, "test-group")
            put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest")
            put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer::class.java.name)
            put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer::class.java.name)
        }

        val consumer = KafkaConsumer<String, String>(consumerProps)
        consumer.subscribe(listOf(topic))

        val records = consumer.poll(Duration.ofSeconds(10))
        consumer.close()

        Assertions.assertEquals(1, records.count())
        Assertions.assertEquals("Hello Kafka!", records.first().value())
    }
}
```

### 共享容器实例

为了加快测试速度，可以在多个测试类之间共享容器：

```kotlin
import org.testcontainers.containers.PostgreSQLContainer

object SharedContainers {
    val postgres: PostgreSQLContainer<Nothing> by lazy {
        PostgreSQLContainer<Nothing>("postgres:15").apply {
            withDatabaseName("testdb")
            withUsername("test")
            withPassword("test")
            withReuse(true) // 启用容器复用
            start()
        }
    }
}

// 在测试中使用
class TestClass1 {
    private val postgres = SharedContainers.postgres

    @Test
    fun test1() {
        // 使用 postgres.jdbcUrl 等
    }
}

class TestClass2 {
    private val postgres = SharedContainers.postgres

    @Test
    fun test2() {
        // 复用同一个容器
    }
}
```

## 断言库对比

### JUnit 5 断言

```kotlin
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.assertAll
import org.junit.jupiter.api.assertThrows

class JUnitAssertionsTest {

    @Test
    fun `JUnit 基础断言`() {
        assertEquals(4, 2 + 2)
        assertNotEquals(5, 2 + 2)
        assertTrue(true)
        assertFalse(false)
        assertNull(null)
        assertNotNull("value")
    }

    @Test
    fun `分组断言`() {
        val person = Person("Alice", 25)

        assertAll(
            "person",
            { assertEquals("Alice", person.name) },
            { assertEquals(25, person.age) },
            { assertTrue(person.age >= 18) }
        )
    }

    @Test
    fun `异常断言`() {
        val exception = assertThrows<IllegalArgumentException> {
            throw IllegalArgumentException("错误消息")
        }
        assertEquals("错误消息", exception.message)
    }
}

data class Person(val name: String, val age: Int)
```

### Kotest 断言

```kotlin
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.*
import io.kotest.matchers.collections.*
import io.kotest.matchers.maps.*
import io.kotest.matchers.result.*
import io.kotest.matchers.optional.*

class KotestAssertionsTest : StringSpec({

    "基础断言" {
        42 shouldBe 42
        "hello" shouldNotBe "world"
        10 shouldBeGreaterThan 5
        5 shouldBeLessThanOrEqualTo 5
    }

    "集合断言" {
        val list = listOf(1, 2, 3)

        list shouldHaveSize 3
        list shouldContain 2
        list shouldContainAll listOf(1, 3)
        list.shouldBeSorted()
        list shouldNotContain 5
    }

    "Map 断言" {
        val map = mapOf("a" to 1, "b" to 2)

        map shouldHaveSize 2
        map shouldContainKey "a"
        map shouldContainValue 2
        map shouldContain ("a" to 1)
    }

    "Result 断言" {
        val success = Result.success("value")
        val failure = Result.failure<String>(RuntimeException("error"))

        success.shouldBeSuccess()
        success.shouldBeSuccess("value")
        failure.shouldBeFailure()
    }

    "软断言 - 收集所有失败" {
        io.kotest.assertions.assertSoftly {
            1 shouldBe 1
            "a" shouldBe "a"
            // 即使前面失败，后续断言仍会执行
        }
    }
})
```

## 最佳实践

### 测试命名规范

```kotlin
class NamingConventionsTest {

    // 方式1：反引号（推荐用于 Kotlin）
    @Test
    fun `用户注册时邮箱已存在应该返回错误`() { }

    // 方式2：Given-When-Then 格式
    @Test
    fun `given existing email when register then return error`() { }

    // 方式3：should 格式
    @Test
    fun `register should return error when email exists`() { }

    // 方式4：传统驼峰命名（兼容 Java）
    @Test
    fun registerShouldReturnErrorWhenEmailExists() { }
}
```

### 测试结构：AAA 模式

```kotlin
@Test
fun `AAA 模式示例`() {
    // Arrange（准备）- 设置测试数据和依赖
    val repository = mockk<UserRepository>()
    val service = UserService(repository)
    every { repository.findById(1) } returns User(1, "Alice")

    // Act（执行）- 调用被测试的方法
    val result = service.getUser(1)

    // Assert（断言）- 验证结果
    assertNotNull(result)
    assertEquals("Alice", result?.name)
    verify { repository.findById(1) }
}
```

### 测试数据构建器

```kotlin
// 使用数据类的 copy 方法
data class User(
    val id: Long = 0,
    val name: String = "default",
    val email: String = "default@example.com",
    val age: Int = 18,
    val active: Boolean = true
)

class UserTestDataBuilder {
    private var user = User()

    fun withId(id: Long) = apply { user = user.copy(id = id) }
    fun withName(name: String) = apply { user = user.copy(name = name) }
    fun withEmail(email: String) = apply { user = user.copy(email = email) }
    fun withAge(age: Int) = apply { user = user.copy(age = age) }
    fun inactive() = apply { user = user.copy(active = false) }

    fun build() = user

    companion object {
        fun aUser() = UserTestDataBuilder()
    }
}

// 使用示例
class UserBuilderTest {
    @Test
    fun `使用构建器创建测试数据`() {
        val user = UserTestDataBuilder.aUser()
            .withName("Alice")
            .withAge(25)
            .build()

        assertEquals("Alice", user.name)
        assertEquals(25, user.age)
        assertEquals("default@example.com", user.email) // 使用默认值
    }
}
```

### 测试隔离与清理

```kotlin
import io.mockk.*
import org.junit.jupiter.api.*

class TestIsolationExample {

    @BeforeEach
    fun setUp() {
        // 每个测试前重置所有模拟
        clearAllMocks()
    }

    @AfterEach
    fun tearDown() {
        // 清理静态模拟
        unmockkAll()
    }

    @Test
    fun `测试应该相互隔离`() {
        val mock = mockk<DataService>(relaxed = true)
        mock.process("data")
        verify { mock.process("data") }
    }

    @Test
    fun `另一个测试不应受前一个影响`() {
        val mock = mockk<DataService>(relaxed = true)
        // 这个验证应该失败如果没有正确隔离
        verify(exactly = 0) { mock.process(any()) }
    }
}

interface DataService {
    fun process(data: String)
}
```

### 异步测试超时

```kotlin
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Timeout
import java.util.concurrent.TimeUnit
import kotlin.time.Duration.Companion.seconds

class TimeoutTest {

    // JUnit 5 超时
    @Test
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    fun `JUnit 超时测试`() {
        // 如果超过5秒则测试失败
    }

    // runTest 默认60秒超时，可以自定义
    @Test
    fun `协程测试超时`() = runTest(timeout = 5.seconds) {
        // 如果超过5秒则测试失败
    }
}
```

## 常见问题与解决方案

### 问题1：测试 final 类

```kotlin
// Kotlin 类默认为 final，MockK 原生支持
val service = mockk<FinalService>()
every { service.method() } returns "mocked"

// 如果使用 Mockito，需要配置 mock-maker-inline
// 在 src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker 中添加：
// mock-maker-inline
```

### 问题2：测试私有方法

```kotlin
// 不建议直接测试私有方法
// 应该通过公共 API 间接测试

class Calculator {
    fun calculate(a: Int, b: Int): Int {
        return addInternal(a, b) // 私有方法
    }

    private fun addInternal(a: Int, b: Int): Int = a + b
}

// 正确做法：测试公共方法
@Test
fun `calculate 应该返回正确结果`() {
    val calculator = Calculator()
    assertEquals(5, calculator.calculate(2, 3))
}
```

### 问题3：测试单例对象

```kotlin
object SingletonService {
    fun doSomething(): String = "real"
}

@Test
fun `模拟单例对象`() {
    mockkObject(SingletonService)
    every { SingletonService.doSomething() } returns "mocked"

    assertEquals("mocked", SingletonService.doSomething())

    unmockkObject(SingletonService)
}
```

### 问题4：测试带 inline 函数的类

```kotlin
// inline 函数不能直接模拟，需要模拟其内部调用

class InlineExample {
    inline fun <reified T> process(): String {
        return T::class.simpleName ?: "unknown"
    }
}

// 正确做法：测试真实行为而非模拟
@Test
fun `测试 inline 函数`() {
    val example = InlineExample()
    assertEquals("String", example.process<String>())
}
```

### 问题5：协程测试中的调度问题

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.test.*
import org.junit.jupiter.api.*

class DispatcherIssueTest {

    @Test
    fun `正确处理多个调度器`() = runTest {
        val testDispatcher = StandardTestDispatcher(testScheduler)

        val result = withContext(testDispatcher) {
            delay(1000)
            "completed"
        }

        assertEquals("completed", result)
    }

    @Test
    fun `处理 IO 调度器`() = runTest {
        // 替换 IO 调度器进行测试
        val testDispatcher = StandardTestDispatcher(testScheduler)

        val result = withContext(testDispatcher) {
            // 模拟 IO 操作
            delay(100)
            "data"
        }

        assertEquals("data", result)
    }
}
```

## 测试覆盖率

### JaCoCo 配置

```kotlin
// build.gradle.kts
plugins {
    jacoco
}

jacoco {
    toolVersion = "0.8.11"
}

tasks.jacocoTestReport {
    reports {
        xml.required.set(true)
        html.required.set(true)
    }

    dependsOn(tasks.test)
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.80".toBigDecimal()
            }
        }
    }
}
```

### Kover（Kotlin 官方覆盖率工具）

```kotlin
// build.gradle.kts
plugins {
    id("org.jetbrains.kotlinx.kover") version "0.7.6"
}

koverReport {
    filters {
        excludes {
            classes("*Generated*", "*Config*")
        }
    }

    verify {
        rule {
            minBound(80)
        }
    }
}
```

## 总结

本文介绍了 Kotlin 测试的核心工具和最佳实践：

| 工具 | 用途 | 关键特性 |
|------|------|----------|
| JUnit 5 | 通用测试框架 | 嵌套测试、参数化测试、生命周期钩子 |
| Kotest | Kotlin 原生测试 | 多种测试风格、强大断言、属性测试 |
| MockK | 模拟框架 | 支持 final 类、协程、扩展函数 |
| kotlinx-coroutines-test | 协程测试 | 虚拟时间、TestDispatcher |
| Testcontainers | 集成测试 | Docker 容器化依赖 |

### 推荐实践

1. **选择合适的框架**：小项目用 JUnit 5，大项目考虑 Kotest
2. **使用 MockK**：专为 Kotlin 设计，比 Mockito 更适合
3. **测试协程**：使用 `runTest` 和 `TestDispatcher`
4. **集成测试**：Testcontainers 提供真实环境
5. **保持测试隔离**：每个测试独立，使用 `@BeforeEach` 重置状态
6. **遵循 AAA 模式**：Arrange-Act-Assert 使测试结构清晰
7. **注重可读性**：使用描述性测试名称
8. **关注覆盖率**：但不要为了覆盖率而写无意义的测试

良好的测试实践能够提高代码质量、减少 bug、增强重构信心。希望本文能帮助你在 Kotlin 项目中建立完善的测试体系。
