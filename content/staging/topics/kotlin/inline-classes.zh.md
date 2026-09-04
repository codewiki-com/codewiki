---
title: Kotlin 内联类与值类
description: 深入理解 Kotlin 内联类和值类，包括 @JvmInline、value class、类型安全、装箱机制和最佳实践
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - Kotlin
  - 内联类
  - 值类
  - 类型安全
  - 性能优化
status: imported
origin: old/src/content/docs/kotlin/inline-classes.zh.md
divergence: 0.203
issues:
  - title-lang-en
  - title-language
legacy:
  category: Kotlin
  subcategory: 核心概念
  order: 14
  lastUpdated: 2026-01-07
---

在软件开发中，我们经常使用原始类型（如 `Int`、`String`）来表示业务概念，这可能导致类型混淆和错误。例如，将用户ID误传给订单ID参数，或将价格误传给数量参数。Kotlin 的内联类（Inline Class）和值类（Value Class）提供了一种零成本抽象的方式来创建类型安全的包装器，在编译时保证类型安全，同时在运行时几乎没有性能开销。

## 概念解释

### 什么是内联类/值类

内联类（现在称为值类）是 Kotlin 中一种特殊的类，它包装一个单一的值，在编译时提供类型安全保证，同时在运行时尽可能地使用底层类型来避免对象分配的开销。

```kotlin
// 定义值类
@JvmInline
value class UserId(val id: Long)

@JvmInline
value class OrderId(val id: Long)

// 使用值类实现类型安全
fun findUser(userId: UserId): User? { /* ... */ }
fun findOrder(orderId: OrderId): Order? { /* ... */ }

fun main() {
    val userId = UserId(123L)
    val orderId = OrderId(456L)

    findUser(userId)   // 正确
    // findUser(orderId)  // 编译错误！类型不匹配
}
```

### 历史演进

1. **Kotlin 1.3**：引入 `inline class` 作为实验性特性
2. **Kotlin 1.5**：`inline class` 更名为 `value class`，需要 `@JvmInline` 注解
3. **未来版本**：计划支持多属性的值类（Valhalla 项目）

```kotlin
// Kotlin 1.3-1.4 语法（已弃用）
inline class OldStyle(val value: String)

// Kotlin 1.5+ 语法（当前标准）
@JvmInline
value class NewStyle(val value: String)
```

### 解决的问题

值类主要解决以下问题：

1. **原始类型痴迷**（Primitive Obsession）：避免使用原始类型表示领域概念
2. **类型安全**：防止类型混淆导致的逻辑错误
3. **性能开销**：传统包装类的对象分配成本
4. **代码可读性**：使代码更具表达力和自文档性

## 核心原理

### 编译时内联机制

值类在编译时会被"内联"，即在大多数情况下，编译器会用底层类型替换值类的使用：

```kotlin
@JvmInline
value class Password(val value: String)

fun validatePassword(password: Password): Boolean {
    return password.value.length >= 8
}

// 编译后的等效代码（简化表示）
fun validatePassword(password: String): Boolean {
    return password.length >= 8
}
```

### 字节码分析

让我们看看值类在字节码层面的表现：

```kotlin
@JvmInline
value class Age(val years: Int) {
    fun isAdult(): Boolean = years >= 18
}

fun checkAge(age: Age): String {
    return if (age.isAdult()) "成年" else "未成年"
}
```

编译后的 Java 等效代码：

```java
// Age 类仍然存在（用于装箱场景）
public final class Age {
    private final int years;

    public Age(int years) {
        this.years = years;
    }

    public int getYears() {
        return years;
    }

    // 静态方法版本（用于内联调用）
    public static boolean isAdult-impl(int years) {
        return years >= 18;
    }

    // 装箱版本
    public boolean isAdult() {
        return isAdult-impl(this.years);
    }

    // box/unbox 方法
    public static Age box-impl(int v) {
        return new Age(v);
    }

    public int unbox-impl() {
        return this.years;
    }
}

// 使用处被内联
public static String checkAge-<hash>(int age) {
    return Age.isAdult-impl(age) ? "成年" : "未成年";
}
```

### 装箱（Boxing）机制

虽然值类会尽量避免装箱，但在某些情况下装箱是必要的：

```kotlin
@JvmInline
value class Token(val value: String)

// 场景1：作为泛型参数 - 需要装箱
fun <T> process(item: T) { println(item) }

fun main() {
    val token = Token("abc123")
    process(token)  // Token 被装箱
}

// 场景2：作为可空类型 - 需要装箱
fun validateToken(token: Token?): Boolean {
    return token != null && token.value.isNotEmpty()
}

// 场景3：作为接口类型 - 需要装箱
interface Printable {
    fun print()
}

@JvmInline
value class PrintableToken(val value: String) : Printable {
    override fun print() = println(value)
}

fun usePrintable(p: Printable) {
    p.print()  // 需要装箱
}
```

### 装箱规则详解

| 场景 | 是否装箱 | 说明 |
|------|----------|------|
| 直接使用 | 否 | 使用底层类型 |
| 作为泛型参数 | 是 | 泛型类型擦除 |
| 可空类型 | 是 | 需要表示 null |
| 实现接口并以接口类型使用 | 是 | 多态调用 |
| 存储在 Array 中 | 是 | 数组元素类型 |
| 类型检查 (is) | 是 | 运行时类型信息 |
| 作为 Any 类型 | 是 | 需要对象引用 |

## 核心要点

### 定义语法

```kotlin
// 基本语法
@JvmInline
value class ClassName(val property: UnderlyingType)

// 实际示例
@JvmInline
value class Email(val address: String) {
    // 可以有 init 块进行验证
    init {
        require(address.contains("@")) { "无效的邮箱地址" }
    }

    // 可以有计算属性
    val domain: String
        get() = address.substringAfter("@")

    // 可以有成员函数
    fun isCompanyEmail(): Boolean = domain.endsWith(".com")

    // 可以重写 toString
    override fun toString(): String = "Email($address)"
}
```

### 值类的要求

1. **必须有且仅有一个主构造函数参数**
2. **参数必须是 `val`**（不能是 `var`）
3. **不能有 backing field 的属性**
4. **不能有 `init` 块之外的初始化逻辑**
5. **不能继承其他类**（可以实现接口）
6. **必须是 final 的**（不能被继承）

```kotlin
// 正确的值类
@JvmInline
value class Percentage(val value: Double) {
    init {
        require(value in 0.0..100.0) { "百分比必须在 0-100 之间" }
    }

    val decimal: Double get() = value / 100.0  // 计算属性，无 backing field
}

// 错误示例
@JvmInline
value class Invalid(
    val a: Int,
    val b: Int  // 错误：只能有一个参数
)

@JvmInline
value class AlsoInvalid(var value: Int)  // 错误：必须是 val

@JvmInline
value class StillInvalid(val value: Int) {
    var counter: Int = 0  // 错误：不能有 backing field
}
```

### 与接口配合

值类可以实现接口：

```kotlin
interface Displayable {
    fun display(): String
}

interface Validatable {
    fun isValid(): Boolean
}

@JvmInline
value class PhoneNumber(val number: String) : Displayable, Validatable {
    override fun display(): String = formatPhone()

    override fun isValid(): Boolean = number.matches(Regex("^\\d{11}$"))

    private fun formatPhone(): String {
        return "${number.substring(0, 3)}-${number.substring(3, 7)}-${number.substring(7)}"
    }
}

fun main() {
    val phone = PhoneNumber("13812345678")

    // 直接使用 - 不装箱
    println(phone.display())  // 138-1234-5678
    println(phone.isValid())  // true

    // 作为接口类型使用 - 装箱
    val displayable: Displayable = phone
    println(displayable.display())
}
```

### 类型别名 vs 值类

类型别名（Type Alias）与值类有本质区别：

```kotlin
// 类型别名 - 仅仅是别名，无类型安全
typealias UserId = Long
typealias OrderId = Long

fun findUser(id: UserId) { /* ... */ }
fun findOrder(id: OrderId) { /* ... */ }

val userId: UserId = 123L
val orderId: OrderId = 456L

findUser(orderId)  // 编译通过！没有类型检查

// 值类 - 真正的类型安全
@JvmInline
value class SafeUserId(val id: Long)

@JvmInline
value class SafeOrderId(val id: Long)

fun findUserSafe(id: SafeUserId) { /* ... */ }
fun findOrderSafe(id: SafeOrderId) { /* ... */ }

val safeUserId = SafeUserId(123L)
val safeOrderId = SafeOrderId(456L)

// findUserSafe(safeOrderId)  // 编译错误！
```

| 特性 | 类型别名 | 值类 |
|------|----------|------|
| 类型安全 | 无 | 有 |
| 运行时开销 | 无 | 极小（大多数情况无） |
| 可添加方法 | 否 | 是 |
| 可添加验证 | 否 | 是 |
| 互操作性 | 透明 | 需要注意 |

## 代码示例

### 领域建模

```kotlin
// 电商领域模型
@JvmInline
value class ProductId(val id: String) {
    init {
        require(id.isNotBlank()) { "产品ID不能为空" }
    }
}

@JvmInline
value class Money(val cents: Long) {
    init {
        require(cents >= 0) { "金额不能为负" }
    }

    val dollars: Double get() = cents / 100.0

    operator fun plus(other: Money) = Money(cents + other.cents)
    operator fun minus(other: Money) = Money(cents - other.cents)
    operator fun times(quantity: Int) = Money(cents * quantity)

    fun format(): String = "¥${String.format("%.2f", dollars)}"

    companion object {
        fun fromDollars(dollars: Double): Money =
            Money((dollars * 100).toLong())
    }
}

@JvmInline
value class Quantity(val value: Int) {
    init {
        require(value > 0) { "数量必须大于0" }
    }

    operator fun plus(other: Quantity) = Quantity(value + other.value)
    operator fun minus(other: Quantity) = Quantity(value - other.value)
}

@JvmInline
value class Discount(val percentage: Double) {
    init {
        require(percentage in 0.0..100.0) { "折扣必须在 0-100 之间" }
    }

    fun apply(money: Money): Money {
        val discountAmount = (money.cents * percentage / 100).toLong()
        return Money(money.cents - discountAmount)
    }
}

// 使用示例
data class Product(
    val id: ProductId,
    val name: String,
    val price: Money
)

data class CartItem(
    val product: Product,
    val quantity: Quantity
) {
    val subtotal: Money get() = product.price * quantity.value
}

class ShoppingCart {
    private val items = mutableListOf<CartItem>()

    fun addItem(product: Product, quantity: Quantity) {
        items.add(CartItem(product, quantity))
    }

    fun total(): Money = items.fold(Money(0)) { acc, item ->
        acc + item.subtotal
    }

    fun applyDiscount(discount: Discount): Money = discount.apply(total())
}

fun main() {
    val cart = ShoppingCart()

    val product1 = Product(
        id = ProductId("PROD-001"),
        name = "Kotlin 编程指南",
        price = Money.fromDollars(59.99)
    )

    val product2 = Product(
        id = ProductId("PROD-002"),
        name = "Android 开发实战",
        price = Money.fromDollars(79.99)
    )

    cart.addItem(product1, Quantity(2))
    cart.addItem(product2, Quantity(1))

    println("购物车总价: ${cart.total().format()}")  // ¥199.97

    val discount = Discount(10.0)  // 10% 折扣
    println("折后价格: ${cart.applyDiscount(discount).format()}")  // ¥179.97
}
```

### 密码与敏感数据处理

```kotlin
@JvmInline
value class Password private constructor(private val hash: String) {
    companion object {
        fun fromPlainText(plainText: String): Password {
            require(plainText.length >= 8) { "密码至少8位" }
            require(plainText.any { it.isDigit() }) { "密码必须包含数字" }
            require(plainText.any { it.isUpperCase() }) { "密码必须包含大写字母" }

            // 实际应使用安全的哈希算法如 BCrypt
            val hash = plainText.hashCode().toString(16)
            return Password(hash)
        }
    }

    fun verify(plainText: String): Boolean {
        return plainText.hashCode().toString(16) == hash
    }

    // 防止日志泄露
    override fun toString(): String = "Password(****)"
}

@JvmInline
value class ApiKey(private val key: String) {
    init {
        require(key.length == 32) { "API Key 必须是 32 位" }
    }

    // 只暴露部分内容用于日志
    fun masked(): String = "${key.take(4)}...${key.takeLast(4)}"

    // 完整密钥只在需要时获取
    fun reveal(): String = key

    override fun toString(): String = "ApiKey(${masked()})"
}

@JvmInline
value class CreditCard(private val number: String) {
    init {
        require(number.length == 16) { "信用卡号必须是 16 位" }
        require(number.all { it.isDigit() }) { "信用卡号只能包含数字" }
        require(isValidLuhn()) { "信用卡号校验失败" }
    }

    private fun isValidLuhn(): Boolean {
        var sum = 0
        var isSecond = false

        for (i in number.length - 1 downTo 0) {
            var d = number[i] - '0'
            if (isSecond) {
                d *= 2
                if (d > 9) d -= 9
            }
            sum += d
            isSecond = !isSecond
        }

        return sum % 10 == 0
    }

    fun lastFourDigits(): String = number.takeLast(4)

    fun masked(): String = "**** **** **** ${lastFourDigits()}"

    override fun toString(): String = "CreditCard(${masked()})"
}

fun main() {
    val password = Password.fromPlainText("SecurePass123")
    println(password)  // Password(****)
    println(password.verify("SecurePass123"))  // true
    println(password.verify("WrongPass"))  // false

    val apiKey = ApiKey("abcd1234567890abcd1234567890ab")
    println(apiKey)  // ApiKey(abcd...90ab)

    // 只在真正需要时获取完整密钥
    val fullKey = apiKey.reveal()

    val card = CreditCard("4532015112830366")
    println(card)  // CreditCard(**** **** **** 0366)
}
```

### 单位类型

```kotlin
// 长度单位
@JvmInline
value class Meters(val value: Double) {
    fun toKilometers() = Kilometers(value / 1000)
    fun toCentimeters() = Centimeters(value * 100)
    fun toFeet() = Feet(value * 3.28084)

    operator fun plus(other: Meters) = Meters(value + other.value)
    operator fun minus(other: Meters) = Meters(value - other.value)
    operator fun times(factor: Double) = Meters(value * factor)
    operator fun div(factor: Double) = Meters(value / factor)
    operator fun compareTo(other: Meters) = value.compareTo(other.value)
}

@JvmInline
value class Kilometers(val value: Double) {
    fun toMeters() = Meters(value * 1000)
}

@JvmInline
value class Centimeters(val value: Double) {
    fun toMeters() = Meters(value / 100)
}

@JvmInline
value class Feet(val value: Double) {
    fun toMeters() = Meters(value / 3.28084)
}

// 时间单位
@JvmInline
value class Milliseconds(val value: Long) {
    fun toSeconds() = Seconds(value / 1000.0)
    fun toMinutes() = Minutes(value / 60000.0)

    operator fun plus(other: Milliseconds) = Milliseconds(value + other.value)
    operator fun minus(other: Milliseconds) = Milliseconds(value - other.value)
}

@JvmInline
value class Seconds(val value: Double) {
    fun toMilliseconds() = Milliseconds((value * 1000).toLong())
    fun toMinutes() = Minutes(value / 60)
}

@JvmInline
value class Minutes(val value: Double) {
    fun toSeconds() = Seconds(value * 60)
    fun toMilliseconds() = Milliseconds((value * 60000).toLong())
}

// 温度单位
@JvmInline
value class Celsius(val value: Double) {
    fun toFahrenheit() = Fahrenheit(value * 9 / 5 + 32)
    fun toKelvin() = Kelvin(value + 273.15)

    companion object {
        val ABSOLUTE_ZERO = Celsius(-273.15)
        val WATER_FREEZING = Celsius(0.0)
        val WATER_BOILING = Celsius(100.0)
    }
}

@JvmInline
value class Fahrenheit(val value: Double) {
    fun toCelsius() = Celsius((value - 32) * 5 / 9)
}

@JvmInline
value class Kelvin(val value: Double) {
    init {
        require(value >= 0) { "开尔文温度不能为负" }
    }

    fun toCelsius() = Celsius(value - 273.15)
}

// 使用示例
fun main() {
    // 长度转换
    val distance = Meters(1500.0)
    println("${distance.value}m = ${distance.toKilometers().value}km")  // 1.5km
    println("${distance.value}m = ${distance.toFeet().value}ft")  // 4921.26ft

    // 时间计算
    val duration = Minutes(5.0)
    println("${duration.value}min = ${duration.toSeconds().value}s")  // 300s
    println("${duration.value}min = ${duration.toMilliseconds().value}ms")  // 300000ms

    // 温度转换
    val temp = Celsius(25.0)
    println("${temp.value}°C = ${temp.toFahrenheit().value}°F")  // 77°F
    println("${temp.value}°C = ${temp.toKelvin().value}K")  // 298.15K

    // 防止单位混淆
    fun calculateSpeed(distance: Meters, time: Seconds): Double {
        return distance.value / time.value  // m/s
    }

    val speed = calculateSpeed(Meters(100.0), Seconds(10.0))
    println("速度: ${speed} m/s")  // 10 m/s

    // 编译时类型安全
    // calculateSpeed(Feet(100.0), Minutes(1.0))  // 编译错误！
}
```

### 验证与约束

```kotlin
@JvmInline
value class Email(val address: String) {
    init {
        require(isValidEmail(address)) { "无效的邮箱格式: $address" }
    }

    val username: String get() = address.substringBefore("@")
    val domain: String get() = address.substringAfter("@")

    fun isFromDomain(domain: String): Boolean =
        this.domain.equals(domain, ignoreCase = true)

    companion object {
        private val EMAIL_REGEX = Regex(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
        )

        private fun isValidEmail(email: String): Boolean =
            EMAIL_REGEX.matches(email)

        fun tryCreate(address: String): Email? =
            if (isValidEmail(address)) Email(address) else null
    }
}

@JvmInline
value class Url(val value: String) {
    init {
        require(value.startsWith("http://") || value.startsWith("https://")) {
            "URL 必须以 http:// 或 https:// 开头"
        }
    }

    val protocol: String get() = value.substringBefore("://")
    val host: String get() = value.substringAfter("://").substringBefore("/")
    val path: String get() = "/" + value.substringAfter("://").substringAfter("/", "")

    fun isSecure(): Boolean = protocol == "https"
}

@JvmInline
value class NonEmptyString(val value: String) {
    init {
        require(value.isNotBlank()) { "字符串不能为空或仅包含空白字符" }
    }

    val length: Int get() = value.length
    val trimmed: NonEmptyString get() = NonEmptyString(value.trim())
}

@JvmInline
value class PositiveInt(val value: Int) {
    init {
        require(value > 0) { "值必须为正整数: $value" }
    }

    operator fun plus(other: PositiveInt) = PositiveInt(value + other.value)
    operator fun times(other: PositiveInt) = PositiveInt(value * other.value)

    // 减法可能导致非正数，返回 Int
    operator fun minus(other: PositiveInt): Int = value - other.value
}

@JvmInline
value class Percentage(val value: Double) {
    init {
        require(value in 0.0..100.0) { "百分比必须在 0-100 之间: $value" }
    }

    val decimal: Double get() = value / 100.0
    val fraction: Double get() = value / 100.0

    fun of(amount: Double): Double = amount * decimal

    companion object {
        val ZERO = Percentage(0.0)
        val HALF = Percentage(50.0)
        val FULL = Percentage(100.0)
    }
}

// 使用示例
fun main() {
    // Email
    val email = Email("user@example.com")
    println("用户名: ${email.username}, 域名: ${email.domain}")

    val maybeEmail = Email.tryCreate("invalid-email")
    println("无效邮箱: $maybeEmail")  // null

    // URL
    val url = Url("https://api.example.com/users/123")
    println("协议: ${url.protocol}, 主机: ${url.host}, 路径: ${url.path}")
    println("是否安全: ${url.isSecure()}")

    // 百分比
    val tax = Percentage(8.5)
    val price = 100.0
    println("税额: ${tax.of(price)}")  // 8.5

    // 正整数
    val a = PositiveInt(5)
    val b = PositiveInt(3)
    println("和: ${(a + b).value}")  // 8
    println("差: ${a - b}")  // 2（返回 Int，因为可能为负）
}
```

### 集合与泛型

```kotlin
@JvmInline
value class UserId(val id: Long)

@JvmInline
value class Username(val name: String)

// 值类作为 Map 键
fun main() {
    val usernames = mapOf(
        UserId(1L) to Username("alice"),
        UserId(2L) to Username("bob"),
        UserId(3L) to Username("charlie")
    )

    val userId = UserId(1L)
    println(usernames[userId])  // Username(name=alice)

    // 值类列表
    val userIds = listOf(UserId(1L), UserId(2L), UserId(3L))
    val filteredIds = userIds.filter { it.id > 1 }
    println(filteredIds)  // [UserId(id=2), UserId(id=3)]

    // 注意：在集合中使用时会发生装箱
}

// 自定义集合操作
@JvmInline
value class Score(val value: Int) {
    init {
        require(value in 0..100) { "分数必须在 0-100 之间" }
    }
}

class ScoreBoard {
    private val scores = mutableMapOf<Username, Score>()

    fun addScore(username: Username, score: Score) {
        scores[username] = score
    }

    fun getScore(username: Username): Score? = scores[username]

    fun average(): Double {
        if (scores.isEmpty()) return 0.0
        return scores.values.map { it.value }.average()
    }

    fun highest(): Pair<Username, Score>? {
        return scores.maxByOrNull { it.value.value }?.toPair()
    }

    fun passing(threshold: Score = Score(60)): List<Username> {
        return scores.filter { it.value.value >= threshold.value }.keys.toList()
    }
}

fun main() {
    val board = ScoreBoard()
    board.addScore(Username("Alice"), Score(85))
    board.addScore(Username("Bob"), Score(72))
    board.addScore(Username("Charlie"), Score(91))
    board.addScore(Username("Diana"), Score(55))

    println("平均分: ${board.average()}")  // 75.75
    println("最高分: ${board.highest()}")  // (Username(name=Charlie), Score(value=91))
    println("及格学生: ${board.passing()}")  // [Username(name=Alice), Username(name=Bob), Username(name=Charlie)]
}
```

## 最佳实践

### 领域驱动设计

使用值类表示领域概念：

```kotlin
// 好的实践：清晰的领域概念
@JvmInline
value class OrderNumber(val value: String)

@JvmInline
value class CustomerId(val id: Long)

@JvmInline
value class ProductSku(val sku: String)

data class Order(
    val orderNumber: OrderNumber,
    val customerId: CustomerId,
    val items: List<OrderItem>
)

data class OrderItem(
    val sku: ProductSku,
    val quantity: Quantity,
    val price: Money
)

// 不好的实践：使用原始类型
data class OrderBad(
    val orderNumber: String,  // 容易与其他字符串混淆
    val customerId: Long,     // 容易与其他数字混淆
    val items: List<OrderItemBad>
)
```

### 验证在构造时

```kotlin
// 好的实践：在 init 块中验证
@JvmInline
value class Age(val years: Int) {
    init {
        require(years >= 0) { "年龄不能为负" }
        require(years <= 150) { "年龄不能超过 150" }
    }
}

// 不好的实践：依赖外部验证
@JvmInline
value class AgeBad(val years: Int)

fun createAge(years: Int): AgeBad {
    require(years >= 0 && years <= 150)  // 可能被绕过
    return AgeBad(years)
}
```

### 提供工厂方法

```kotlin
@JvmInline
value class Slug(val value: String) {
    init {
        require(value.matches(Regex("^[a-z0-9-]+$"))) {
            "Slug 只能包含小写字母、数字和连字符"
        }
    }

    companion object {
        // 从标题生成 slug
        fun fromTitle(title: String): Slug {
            val slug = title
                .lowercase()
                .replace(Regex("[^a-z0-9\\s-]"), "")
                .replace(Regex("\\s+"), "-")
                .trim('-')
            return Slug(slug)
        }

        // 安全创建
        fun tryCreate(value: String): Slug? {
            return try {
                Slug(value)
            } catch (e: IllegalArgumentException) {
                null
            }
        }
    }
}

fun main() {
    val slug = Slug.fromTitle("Hello World! This is a Test")
    println(slug.value)  // hello-world-this-is-a-test
}
```

### 运算符重载

```kotlin
@JvmInline
value class Percentage(val value: Double) {
    init {
        require(value in 0.0..100.0)
    }

    // 运算符重载使语法更自然
    operator fun plus(other: Percentage): Percentage {
        return Percentage((value + other.value).coerceAtMost(100.0))
    }

    operator fun minus(other: Percentage): Percentage {
        return Percentage((value - other.value).coerceAtLeast(0.0))
    }

    operator fun times(factor: Double): Percentage {
        return Percentage((value * factor).coerceIn(0.0, 100.0))
    }

    operator fun compareTo(other: Percentage): Int {
        return value.compareTo(other.value)
    }
}

@JvmInline
value class Money(val cents: Long) {
    operator fun plus(other: Money) = Money(cents + other.cents)
    operator fun minus(other: Money) = Money(cents - other.cents)
    operator fun times(quantity: Int) = Money(cents * quantity)
    operator fun div(divisor: Int) = Money(cents / divisor)
    operator fun compareTo(other: Money) = cents.compareTo(other.cents)
    operator fun unaryMinus() = Money(-cents)
}

fun main() {
    val p1 = Percentage(30.0)
    val p2 = Percentage(25.0)
    println((p1 + p2).value)  // 55.0
    println((p1 > p2))  // true

    val m1 = Money(1000)
    val m2 = Money(500)
    println((m1 + m2).cents)  // 1500
    println((m1 * 3).cents)  // 3000
}
```

### toString 重写

```kotlin
@JvmInline
value class Money(val cents: Long) {
    // 提供有意义的字符串表示
    override fun toString(): String {
        val dollars = cents / 100
        val remainder = cents % 100
        return "¥$dollars.${remainder.toString().padStart(2, '0')}"
    }
}

@JvmInline
value class Duration(val milliseconds: Long) {
    override fun toString(): String {
        val seconds = milliseconds / 1000
        val minutes = seconds / 60
        val hours = minutes / 60

        return when {
            hours > 0 -> "${hours}h ${minutes % 60}m ${seconds % 60}s"
            minutes > 0 -> "${minutes}m ${seconds % 60}s"
            seconds > 0 -> "${seconds}s"
            else -> "${milliseconds}ms"
        }
    }
}

fun main() {
    println(Money(1234))  // ¥12.34
    println(Duration(3661000))  // 1h 1m 1s
}
```

## 常见陷阱

### 装箱导致的性能问题

```kotlin
@JvmInline
value class Id(val value: Long)

// 陷阱：在泛型上下文中频繁使用会导致装箱
fun <T> processList(items: List<T>) {
    items.forEach { println(it) }
}

fun main() {
    val ids = List(1000000) { Id(it.toLong()) }
    processList(ids)  // 每个 Id 都会被装箱
}

// 解决方案：使用原始类型的专门方法
fun processIds(ids: List<Id>) {
    ids.forEach { println(it.value) }
}

// 或者使用 Sequence 减少中间集合
val ids = (0 until 1000000).asSequence().map { Id(it.toLong()) }
```

### 可空类型的陷阱

```kotlin
@JvmInline
value class Token(val value: String)

// 陷阱：可空值类总是装箱
fun findToken(id: String): Token? {
    return if (id.isNotEmpty()) Token(id) else null
}

// 解决方案1：使用 sealed class 或 Result
sealed class TokenResult {
    data class Found(val token: Token) : TokenResult()
    data object NotFound : TokenResult()
}

// 解决方案2：使用特殊值表示空
@JvmInline
value class OptionalToken(val value: String) {
    val isPresent: Boolean get() = value.isNotEmpty()

    companion object {
        val EMPTY = OptionalToken("")
    }
}
```

### 相等性判断

```kotlin
@JvmInline
value class UserId(val id: Long)

fun main() {
    val id1 = UserId(1L)
    val id2 = UserId(1L)

    // 内联场景：直接比较底层类型
    println(id1 == id2)  // true

    // 装箱场景需要注意
    val list1: List<Any> = listOf(id1)
    val list2: List<Any> = listOf(id2)

    println(list1[0] == list2[0])  // true（使用 equals）
    println(list1[0] === list2[0])  // false（不同对象）
}
```

### Java 互操作问题

```kotlin
// Kotlin 值类
@JvmInline
value class UserId(val id: Long)

fun findUser(userId: UserId): User? = null
```

```java
// Java 调用
public class JavaCode {
    public void test() {
        // 编译后的方法签名使用原始类型
        User user = KotlinFileKt.findUser-<hash>(123L);

        // 创建值类实例需要使用 box 方法
        UserId userId = UserId.box-impl(123L);
    }
}
```

解决方案：提供 Java 友好的 API：

```kotlin
@JvmInline
value class UserId(val id: Long)

// 提供 Java 友好的重载
@JvmName("findUserById")
fun findUser(userId: Long): User? = findUser(UserId(userId))

fun findUser(userId: UserId): User? = null
```

### 序列化问题

```kotlin
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

// 需要显式添加序列化支持
@Serializable
@JvmInline
value class UserId(val id: Long)

@Serializable
data class User(val id: UserId, val name: String)

fun main() {
    val user = User(UserId(123), "Alice")
    val json = Json.encodeToString(User.serializer(), user)
    println(json)  // {"id":123,"name":"Alice"}

    val decoded = Json.decodeFromString(User.serializer(), json)
    println(decoded)  // User(id=UserId(id=123), name=Alice)
}
```

### 反射限制

```kotlin
@JvmInline
value class SecretId(val id: Long)

fun main() {
    val id = SecretId(123)

    // 反射访问可能遇到问题
    val klass = id::class
    println(klass.simpleName)  // SecretId

    // 在内联场景下，反射可能获取底层类型
    val any: Any = id  // 装箱
    println(any::class.simpleName)  // SecretId（装箱后的类型）
}
```

## 性能考量

### 内存分配对比

```kotlin
// 传统包装类
class TraditionalWrapper(val value: Long)

// 值类
@JvmInline
value class ValueWrapper(val value: Long)

fun benchmark() {
    val iterations = 10_000_000

    // 传统包装类 - 每次创建都分配对象
    val startTraditional = System.nanoTime()
    var sumTraditional = 0L
    repeat(iterations) {
        val wrapper = TraditionalWrapper(it.toLong())
        sumTraditional += wrapper.value
    }
    val endTraditional = System.nanoTime()

    // 值类 - 大多数情况不分配对象
    val startValue = System.nanoTime()
    var sumValue = 0L
    repeat(iterations) {
        val wrapper = ValueWrapper(it.toLong())
        sumValue += wrapper.value
    }
    val endValue = System.nanoTime()

    println("传统包装类: ${(endTraditional - startTraditional) / 1_000_000}ms")
    println("值类: ${(endValue - startValue) / 1_000_000}ms")
}
```

### 装箱场景的性能影响

```kotlin
@JvmInline
value class Id(val value: Long)

// 不装箱 - 高性能
fun sumIds(ids: LongArray): Long {
    return ids.sum()
}

// 装箱 - 有性能开销
fun sumIdsBoxed(ids: List<Id>): Long {
    return ids.sumOf { it.value }
}

// 折中方案 - 使用 Sequence
fun sumIdsSequence(ids: Sequence<Id>): Long {
    return ids.sumOf { it.value }
}
```

### 优化建议

1. **避免在热路径中使用可空值类**
2. **尽量避免在泛型上下文中使用值类**
3. **优先使用值类的底层类型进行批量操作**
4. **考虑使用 `@JvmInline` 的专用集合**

```kotlin
// 自定义专用集合避免装箱
@JvmInline
value class UserId(val id: Long)

class UserIdList(private val ids: LongArray) : Iterable<UserId> {
    val size: Int get() = ids.size

    operator fun get(index: Int): UserId = UserId(ids[index])

    override fun iterator(): Iterator<UserId> = object : Iterator<UserId> {
        private var index = 0
        override fun hasNext() = index < ids.size
        override fun next() = UserId(ids[index++])
    }

    fun sum(): Long = ids.sum()

    companion object {
        fun of(vararg ids: UserId): UserIdList =
            UserIdList(LongArray(ids.size) { ids[it].id })
    }
}
```

## 实战场景

### 数据库实体ID

```kotlin
@JvmInline
value class UserId(val id: Long) {
    companion object {
        fun fromString(s: String): UserId = UserId(s.toLong())
    }
}

@JvmInline
value class PostId(val id: Long)

@JvmInline
value class CommentId(val id: Long)

// 数据库实体
data class User(
    val id: UserId,
    val name: String,
    val email: Email
)

data class Post(
    val id: PostId,
    val authorId: UserId,  // 类型安全的外键引用
    val title: String,
    val content: String
)

data class Comment(
    val id: CommentId,
    val postId: PostId,    // 类型安全的外键引用
    val authorId: UserId,  // 类型安全的外键引用
    val content: String
)

// Repository 接口
interface UserRepository {
    fun findById(id: UserId): User?
    fun findPostsByAuthor(authorId: UserId): List<Post>
}

interface PostRepository {
    fun findById(id: PostId): Post?
    fun findComments(postId: PostId): List<Comment>
}

// 编译时防止错误
fun example(userRepo: UserRepository, postRepo: PostRepository) {
    val userId = UserId(1L)
    val postId = PostId(100L)

    userRepo.findById(userId)  // 正确
    // userRepo.findById(postId)  // 编译错误！

    postRepo.findComments(postId)  // 正确
    // postRepo.findComments(userId)  // 编译错误！
}
```

### API 请求参数

```kotlin
@JvmInline
value class PageNumber(val value: Int) {
    init {
        require(value >= 1) { "页码必须 >= 1" }
    }
}

@JvmInline
value class PageSize(val value: Int) {
    init {
        require(value in 1..100) { "每页数量必须在 1-100 之间" }
    }

    companion object {
        val DEFAULT = PageSize(20)
        val SMALL = PageSize(10)
        val LARGE = PageSize(50)
    }
}

@JvmInline
value class SortField(val field: String) {
    init {
        require(field.isNotBlank()) { "排序字段不能为空" }
        require(field.matches(Regex("^[a-zA-Z_]+$"))) {
            "排序字段只能包含字母和下划线"
        }
    }
}

@JvmInline
value class SortDirection(val direction: String) {
    init {
        require(direction in listOf("asc", "desc")) {
            "排序方向必须是 asc 或 desc"
        }
    }

    companion object {
        val ASC = SortDirection("asc")
        val DESC = SortDirection("desc")
    }
}

data class PaginationRequest(
    val page: PageNumber,
    val size: PageSize = PageSize.DEFAULT,
    val sortBy: SortField? = null,
    val sortDirection: SortDirection = SortDirection.ASC
)

data class PaginatedResponse<T>(
    val items: List<T>,
    val page: PageNumber,
    val size: PageSize,
    val totalItems: Long,
    val totalPages: Int
)

// API Controller
class UserController {
    fun listUsers(request: PaginationRequest): PaginatedResponse<User> {
        // 参数已经过验证，可以直接使用
        val offset = (request.page.value - 1) * request.size.value
        // ...
        return PaginatedResponse(
            items = emptyList(),
            page = request.page,
            size = request.size,
            totalItems = 0,
            totalPages = 0
        )
    }
}
```

### 配置管理

```kotlin
@JvmInline
value class Port(val value: Int) {
    init {
        require(value in 1..65535) { "端口号必须在 1-65535 之间" }
    }

    companion object {
        val HTTP = Port(80)
        val HTTPS = Port(443)
        val DEFAULT_SERVER = Port(8080)
    }
}

@JvmInline
value class Host(val value: String) {
    init {
        require(value.isNotBlank()) { "主机名不能为空" }
    }

    companion object {
        val LOCALHOST = Host("localhost")
        val ALL_INTERFACES = Host("0.0.0.0")
    }
}

@JvmInline
value class Timeout(val milliseconds: Long) {
    init {
        require(milliseconds > 0) { "超时时间必须大于0" }
    }

    val seconds: Long get() = milliseconds / 1000

    companion object {
        fun ofSeconds(seconds: Long) = Timeout(seconds * 1000)
        fun ofMinutes(minutes: Long) = Timeout(minutes * 60 * 1000)

        val SHORT = ofSeconds(5)
        val MEDIUM = ofSeconds(30)
        val LONG = ofMinutes(5)
    }
}

@JvmInline
value class MaxConnections(val value: Int) {
    init {
        require(value > 0) { "最大连接数必须大于0" }
    }
}

data class ServerConfig(
    val host: Host = Host.LOCALHOST,
    val port: Port = Port.DEFAULT_SERVER,
    val connectionTimeout: Timeout = Timeout.MEDIUM,
    val readTimeout: Timeout = Timeout.LONG,
    val maxConnections: MaxConnections = MaxConnections(100)
)

data class DatabaseConfig(
    val host: Host,
    val port: Port,
    val connectionTimeout: Timeout,
    val maxPoolSize: MaxConnections
)

// 配置加载
fun loadConfig(): ServerConfig {
    return ServerConfig(
        host = Host.ALL_INTERFACES,
        port = Port(8080),
        connectionTimeout = Timeout.ofSeconds(10),
        readTimeout = Timeout.ofSeconds(60),
        maxConnections = MaxConnections(200)
    )
}
```

### 事件系统

```kotlin
@JvmInline
value class EventId(val id: String) {
    init {
        require(id.isNotBlank()) { "事件ID不能为空" }
    }

    companion object {
        fun generate(): EventId = EventId(java.util.UUID.randomUUID().toString())
    }
}

@JvmInline
value class EventType(val type: String) {
    init {
        require(type.matches(Regex("^[a-z]+\\.[a-z]+$"))) {
            "事件类型格式: domain.action"
        }
    }

    val domain: String get() = type.substringBefore(".")
    val action: String get() = type.substringAfter(".")
}

@JvmInline
value class CorrelationId(val id: String) {
    companion object {
        fun generate(): CorrelationId = CorrelationId(java.util.UUID.randomUUID().toString())
    }
}

interface Event {
    val id: EventId
    val type: EventType
    val correlationId: CorrelationId
    val timestamp: Long
}

data class UserCreatedEvent(
    override val id: EventId = EventId.generate(),
    override val type: EventType = EventType("user.created"),
    override val correlationId: CorrelationId,
    override val timestamp: Long = System.currentTimeMillis(),
    val userId: UserId,
    val username: Username,
    val email: Email
) : Event

data class OrderPlacedEvent(
    override val id: EventId = EventId.generate(),
    override val type: EventType = EventType("order.placed"),
    override val correlationId: CorrelationId,
    override val timestamp: Long = System.currentTimeMillis(),
    val orderId: OrderId,
    val userId: UserId,
    val totalAmount: Money
) : Event

// 事件处理器
interface EventHandler<T : Event> {
    fun handle(event: T)
}

class EventBus {
    private val handlers = mutableMapOf<EventType, MutableList<EventHandler<*>>>()

    fun <T : Event> subscribe(type: EventType, handler: EventHandler<T>) {
        handlers.getOrPut(type) { mutableListOf() }.add(handler)
    }

    fun publish(event: Event) {
        handlers[event.type]?.forEach { handler ->
            @Suppress("UNCHECKED_CAST")
            (handler as EventHandler<Event>).handle(event)
        }
    }
}
```

## 面试要点

### 什么是 Kotlin 值类？它解决了什么问题？

**答案要点**：
- 值类是一种零成本抽象，用于包装单一值
- 解决原始类型痴迷（Primitive Obsession）问题
- 提供编译时类型安全，防止参数混淆
- 运行时大多数情况下不创建对象，性能接近原始类型

### 值类和类型别名有什么区别？

**答案要点**：
- 类型别名只是别名，无类型安全
- 值类是新类型，有完整的类型检查
- 值类可以有方法和验证逻辑
- 值类有轻微的运行时开销（在装箱场景）

### 什么情况下值类会被装箱？

**答案要点**：
- 作为泛型类型参数
- 作为可空类型
- 实现接口并以接口类型使用
- 存储在数组中
- 进行类型检查（is）
- 作为 Any 类型

### 值类有哪些限制？

**答案要点**：
- 只能有一个主构造函数参数
- 参数必须是 val
- 不能有带 backing field 的属性
- 不能继承其他类（可实现接口）
- 不能被继承（final）
- 需要 @JvmInline 注解

### 如何在 Java 中使用 Kotlin 值类？

**答案要点**：
- 编译后的方法使用原始类型参数
- 方法名会带有哈希后缀
- 可以使用 box-impl 方法创建实例
- 建议提供 Java 友好的 API 重载

### 值类的最佳使用场景是什么？

**答案要点**：
- 领域驱动设计中的值对象
- 各种 ID 类型（UserId, OrderId 等）
- 度量单位（Money, Distance, Duration）
- 验证过的数据（Email, Url, PhoneNumber）
- 敏感数据包装（Password, ApiKey）

## 延伸阅读

### 官方文档
- [Kotlin 官方文档 - 内联值类](https://kotlinlang.org/docs/inline-classes.html)
- [Kotlin KEEP - 内联类](https://github.com/Kotlin/KEEP/blob/master/proposals/inline-classes.zh.md)
- [Kotlin KEEP - 值类](https://github.com/Kotlin/KEEP/blob/master/proposals/value-classes.zh.md)

### 相关概念
- [Project Valhalla](https://openjdk.org/projects/valhalla/) - JVM 层面的值类型支持
- [领域驱动设计中的值对象](https://martinfowler.com/bliki/ValueObject.html)
- [原始类型痴迷代码异味](https://refactoring.guru/smells/primitive-obsession)

### 推荐书籍
- 《Kotlin 实战》- 第 4 章：类、对象和接口
- 《领域驱动设计》- 值对象模式
- 《Effective Kotlin》- Item 47: 使用内联类来包装类型

### 相关库
- [kotlin-result](https://github.com/michaelbull/kotlin-result) - 使用值类实现 Result 类型
- [arrow-kt](https://arrow-kt.io/) - 函数式编程库，广泛使用值类

## 总结

Kotlin 值类是一个强大的类型系统特性，它在以下方面表现出色：

| 方面 | 优势 |
|------|------|
| 类型安全 | 编译时防止参数混淆 |
| 性能 | 大多数情况零开销 |
| 可读性 | 代码自文档化 |
| 验证 | 构造时强制验证 |
| 领域建模 | 清晰表达业务概念 |

**使用建议**：

1. 为每个业务概念创建专用值类
2. 在 init 块中添加验证逻辑
3. 重写 toString 提供有意义的输出
4. 提供工厂方法处理复杂创建逻辑
5. 注意装箱场景对性能的影响
6. 为 Java 互操作提供友好 API

值类是 Kotlin 实现类型驱动开发的重要工具，合理使用可以显著提高代码质量和可维护性。
