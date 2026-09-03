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
origin: old/src/content/docs/kotlin/inline-classes.en.md
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

In software development, we often use primitive types (such as `Int`, `String`) to represent business concepts, which can lead to type confusion and errors. For example, passing a user ID to an order ID parameter, or passing a price to a quantity parameter. Kotlin's inline classes and value classes provide a zero-cost abstraction approach to creating type-safe wrappers that guarantee type safety at compile time while having virtually no performance overhead at runtime.

## Concept Explanation

### What are Inline Classes/Value Classes

Inline classes (now called value classes) are a special type of class in Kotlin that wraps a single value, provides type safety guarantees at compile time, while using the underlying type as much as possible at runtime to avoid the overhead of object allocation.

```kotlin
// Defining value classes
@JvmInline
value class UserId(val id: Long)

@JvmInline
value class OrderId(val id: Long)

// Using value classes for type safety
fun findUser(userId: UserId): User? { /* ... */ }
fun findOrder(orderId: OrderId): Order? { /* ... */ }

fun main() {
    val userId = UserId(123L)
    val orderId = OrderId(456L)

    findUser(userId)   // Correct
    // findUser(orderId)  // Compilation error! Type mismatch
}
```

### Historical Evolution

1. **Kotlin 1.3**: Introduced `inline class` as an experimental feature
2. **Kotlin 1.5**: `inline class` renamed to `value class`, requires `@JvmInline` annotation
3. **Future versions**: Planning to support multi-property value classes (Project Valhalla)

```kotlin
// Kotlin 1.3-1.4 syntax (deprecated)
inline class OldStyle(val value: String)

// Kotlin 1.5+ syntax (current standard)
@JvmInline
value class NewStyle(val value: String)
```

### Problems Solved

Value classes primarily solve the following problems:

1. **Primitive Obsession**: Avoiding the use of primitive types to represent domain concepts
2. **Type Safety**: Preventing logic errors caused by type confusion
3. **Performance Overhead**: Object allocation costs of traditional wrapper classes
4. **Code Readability**: Making code more expressive and self-documenting

## Core Principles

### Compile-time Inlining Mechanism

Value classes are "inlined" at compile time, meaning that in most cases, the compiler replaces the use of value classes with the underlying type:

```kotlin
@JvmInline
value class Password(val value: String)

fun validatePassword(password: Password): Boolean {
    return password.value.length >= 8
}

// Equivalent compiled code (simplified representation)
fun validatePassword(password: String): Boolean {
    return password.length >= 8
}
```

### Bytecode Analysis

Let's look at how value classes behave at the bytecode level:

```kotlin
@JvmInline
value class Age(val years: Int) {
    fun isAdult(): Boolean = years >= 18
}

fun checkAge(age: Age): String {
    return if (age.isAdult()) "Adult" else "Minor"
}
```

Equivalent compiled Java code:

```java
// Age class still exists (for boxing scenarios)
public final class Age {
    private final int years;

    public Age(int years) {
        this.years = years;
    }

    public int getYears() {
        return years;
    }

    // Static method version (for inlined calls)
    public static boolean isAdult-impl(int years) {
        return years >= 18;
    }

    // Boxed version
    public boolean isAdult() {
        return isAdult-impl(this.years);
    }

    // box/unbox methods
    public static Age box-impl(int v) {
        return new Age(v);
    }

    public int unbox-impl() {
        return this.years;
    }
}

// Usage site is inlined
public static String checkAge-<hash>(int age) {
    return Age.isAdult-impl(age) ? "Adult" : "Minor";
}
```

### Boxing Mechanism

While value classes try to avoid boxing whenever possible, boxing is necessary in certain situations:

```kotlin
@JvmInline
value class Token(val value: String)

// Scenario 1: As a generic parameter - requires boxing
fun <T> process(item: T) { println(item) }

fun main() {
    val token = Token("abc123")
    process(token)  // Token is boxed
}

// Scenario 2: As a nullable type - requires boxing
fun validateToken(token: Token?): Boolean {
    return token != null && token.value.isNotEmpty()
}

// Scenario 3: As an interface type - requires boxing
interface Printable {
    fun print()
}

@JvmInline
value class PrintableToken(val value: String) : Printable {
    override fun print() = println(value)
}

fun usePrintable(p: Printable) {
    p.print()  // Requires boxing
}
```

### Boxing Rules in Detail

| Scenario | Boxing Required | Explanation |
|----------|-----------------|-------------|
| Direct use | No | Uses underlying type |
| As generic parameter | Yes | Generic type erasure |
| Nullable type | Yes | Needs to represent null |
| Implementing interface and used as interface type | Yes | Polymorphic calls |
| Stored in Array | Yes | Array element type |
| Type check (is) | Yes | Runtime type information |
| As Any type | Yes | Needs object reference |

## Key Points

### Definition Syntax

```kotlin
// Basic syntax
@JvmInline
value class ClassName(val property: UnderlyingType)

// Practical example
@JvmInline
value class Email(val address: String) {
    // Can have init block for validation
    init {
        require(address.contains("@")) { "Invalid email address" }
    }

    // Can have computed properties
    val domain: String
        get() = address.substringAfter("@")

    // Can have member functions
    fun isCompanyEmail(): Boolean = domain.endsWith(".com")

    // Can override toString
    override fun toString(): String = "Email($address)"
}
```

### Requirements for Value Classes

1. **Must have exactly one primary constructor parameter**
2. **Parameter must be `val`** (cannot be `var`)
3. **Cannot have properties with backing fields**
4. **Cannot have initialization logic outside the `init` block**
5. **Cannot inherit from other classes** (can implement interfaces)
6. **Must be final** (cannot be inherited)

```kotlin
// Correct value class
@JvmInline
value class Percentage(val value: Double) {
    init {
        require(value in 0.0..100.0) { "Percentage must be between 0 and 100" }
    }

    val decimal: Double get() = value / 100.0  // Computed property, no backing field
}

// Error examples
@JvmInline
value class Invalid(
    val a: Int,
    val b: Int  // Error: Can only have one parameter
)

@JvmInline
value class AlsoInvalid(var value: Int)  // Error: Must be val

@JvmInline
value class StillInvalid(val value: Int) {
    var counter: Int = 0  // Error: Cannot have backing field
}
```

### Working with Interfaces

Value classes can implement interfaces:

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

    // Direct use - no boxing
    println(phone.display())  // 138-1234-5678
    println(phone.isValid())  // true

    // Used as interface type - boxing
    val displayable: Displayable = phone
    println(displayable.display())
}
```

### Type Alias vs Value Class

Type aliases have fundamental differences from value classes:

```kotlin
// Type alias - just an alias, no type safety
typealias UserId = Long
typealias OrderId = Long

fun findUser(id: UserId) { /* ... */ }
fun findOrder(id: OrderId) { /* ... */ }

val userId: UserId = 123L
val orderId: OrderId = 456L

findUser(orderId)  // Compiles! No type checking

// Value class - true type safety
@JvmInline
value class SafeUserId(val id: Long)

@JvmInline
value class SafeOrderId(val id: Long)

fun findUserSafe(id: SafeUserId) { /* ... */ }
fun findOrderSafe(id: SafeOrderId) { /* ... */ }

val safeUserId = SafeUserId(123L)
val safeOrderId = SafeOrderId(456L)

// findUserSafe(safeOrderId)  // Compilation error!
```

| Feature | Type Alias | Value Class |
|---------|------------|-------------|
| Type safety | None | Yes |
| Runtime overhead | None | Minimal (none in most cases) |
| Can add methods | No | Yes |
| Can add validation | No | Yes |
| Interoperability | Transparent | Requires attention |

## Code Examples

### Domain Modeling

```kotlin
// E-commerce domain model
@JvmInline
value class ProductId(val id: String) {
    init {
        require(id.isNotBlank()) { "Product ID cannot be empty" }
    }
}

@JvmInline
value class Money(val cents: Long) {
    init {
        require(cents >= 0) { "Amount cannot be negative" }
    }

    val dollars: Double get() = cents / 100.0

    operator fun plus(other: Money) = Money(cents + other.cents)
    operator fun minus(other: Money) = Money(cents - other.cents)
    operator fun times(quantity: Int) = Money(cents * quantity)

    fun format(): String = "$${String.format("%.2f", dollars)}"

    companion object {
        fun fromDollars(dollars: Double): Money =
            Money((dollars * 100).toLong())
    }
}

@JvmInline
value class Quantity(val value: Int) {
    init {
        require(value > 0) { "Quantity must be greater than 0" }
    }

    operator fun plus(other: Quantity) = Quantity(value + other.value)
    operator fun minus(other: Quantity) = Quantity(value - other.value)
}

@JvmInline
value class Discount(val percentage: Double) {
    init {
        require(percentage in 0.0..100.0) { "Discount must be between 0 and 100" }
    }

    fun apply(money: Money): Money {
        val discountAmount = (money.cents * percentage / 100).toLong()
        return Money(money.cents - discountAmount)
    }
}

// Usage example
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
        name = "Kotlin Programming Guide",
        price = Money.fromDollars(59.99)
    )

    val product2 = Product(
        id = ProductId("PROD-002"),
        name = "Android Development in Practice",
        price = Money.fromDollars(79.99)
    )

    cart.addItem(product1, Quantity(2))
    cart.addItem(product2, Quantity(1))

    println("Cart total: ${cart.total().format()}")  // $199.97

    val discount = Discount(10.0)  // 10% discount
    println("Price after discount: ${cart.applyDiscount(discount).format()}")  // $179.97
}
```

### Password and Sensitive Data Handling

```kotlin
@JvmInline
value class Password private constructor(private val hash: String) {
    companion object {
        fun fromPlainText(plainText: String): Password {
            require(plainText.length >= 8) { "Password must be at least 8 characters" }
            require(plainText.any { it.isDigit() }) { "Password must contain a digit" }
            require(plainText.any { it.isUpperCase() }) { "Password must contain an uppercase letter" }

            // In practice, use a secure hashing algorithm like BCrypt
            val hash = plainText.hashCode().toString(16)
            return Password(hash)
        }
    }

    fun verify(plainText: String): Boolean {
        return plainText.hashCode().toString(16) == hash
    }

    // Prevent log leakage
    override fun toString(): String = "Password(****)"
}

@JvmInline
value class ApiKey(private val key: String) {
    init {
        require(key.length == 32) { "API Key must be 32 characters" }
    }

    // Only expose partial content for logging
    fun masked(): String = "${key.take(4)}...${key.takeLast(4)}"

    // Full key only when needed
    fun reveal(): String = key

    override fun toString(): String = "ApiKey(${masked()})"
}

@JvmInline
value class CreditCard(private val number: String) {
    init {
        require(number.length == 16) { "Credit card number must be 16 digits" }
        require(number.all { it.isDigit() }) { "Credit card number must contain only digits" }
        require(isValidLuhn()) { "Credit card number validation failed" }
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

    // Only get full key when actually needed
    val fullKey = apiKey.reveal()

    val card = CreditCard("4532015112830366")
    println(card)  // CreditCard(**** **** **** 0366)
}
```

### Unit Types

```kotlin
// Length units
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

// Time units
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

// Temperature units
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
        require(value >= 0) { "Kelvin temperature cannot be negative" }
    }

    fun toCelsius() = Celsius(value - 273.15)
}

// Usage example
fun main() {
    // Length conversion
    val distance = Meters(1500.0)
    println("${distance.value}m = ${distance.toKilometers().value}km")  // 1.5km
    println("${distance.value}m = ${distance.toFeet().value}ft")  // 4921.26ft

    // Time calculation
    val duration = Minutes(5.0)
    println("${duration.value}min = ${duration.toSeconds().value}s")  // 300s
    println("${duration.value}min = ${duration.toMilliseconds().value}ms")  // 300000ms

    // Temperature conversion
    val temp = Celsius(25.0)
    println("${temp.value}C = ${temp.toFahrenheit().value}F")  // 77F
    println("${temp.value}C = ${temp.toKelvin().value}K")  // 298.15K

    // Prevent unit confusion
    fun calculateSpeed(distance: Meters, time: Seconds): Double {
        return distance.value / time.value  // m/s
    }

    val speed = calculateSpeed(Meters(100.0), Seconds(10.0))
    println("Speed: ${speed} m/s")  // 10 m/s

    // Compile-time type safety
    // calculateSpeed(Feet(100.0), Minutes(1.0))  // Compilation error!
}
```

### Validation and Constraints

```kotlin
@JvmInline
value class Email(val address: String) {
    init {
        require(isValidEmail(address)) { "Invalid email format: $address" }
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
            "URL must start with http:// or https://"
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
        require(value.isNotBlank()) { "String cannot be empty or contain only whitespace" }
    }

    val length: Int get() = value.length
    val trimmed: NonEmptyString get() = NonEmptyString(value.trim())
}

@JvmInline
value class PositiveInt(val value: Int) {
    init {
        require(value > 0) { "Value must be a positive integer: $value" }
    }

    operator fun plus(other: PositiveInt) = PositiveInt(value + other.value)
    operator fun times(other: PositiveInt) = PositiveInt(value * other.value)

    // Subtraction may result in non-positive number, returns Int
    operator fun minus(other: PositiveInt): Int = value - other.value
}

@JvmInline
value class Percentage(val value: Double) {
    init {
        require(value in 0.0..100.0) { "Percentage must be between 0 and 100: $value" }
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

// Usage example
fun main() {
    // Email
    val email = Email("user@example.com")
    println("Username: ${email.username}, Domain: ${email.domain}")

    val maybeEmail = Email.tryCreate("invalid-email")
    println("Invalid email: $maybeEmail")  // null

    // URL
    val url = Url("https://api.example.com/users/123")
    println("Protocol: ${url.protocol}, Host: ${url.host}, Path: ${url.path}")
    println("Is secure: ${url.isSecure()}")

    // Percentage
    val tax = Percentage(8.5)
    val price = 100.0
    println("Tax amount: ${tax.of(price)}")  // 8.5

    // Positive integer
    val a = PositiveInt(5)
    val b = PositiveInt(3)
    println("Sum: ${(a + b).value}")  // 8
    println("Difference: ${a - b}")  // 2 (returns Int because it could be negative)
}
```

### Collections and Generics

```kotlin
@JvmInline
value class UserId(val id: Long)

@JvmInline
value class Username(val name: String)

// Value class as Map key
fun main() {
    val usernames = mapOf(
        UserId(1L) to Username("alice"),
        UserId(2L) to Username("bob"),
        UserId(3L) to Username("charlie")
    )

    val userId = UserId(1L)
    println(usernames[userId])  // Username(name=alice)

    // Value class list
    val userIds = listOf(UserId(1L), UserId(2L), UserId(3L))
    val filteredIds = userIds.filter { it.id > 1 }
    println(filteredIds)  // [UserId(id=2), UserId(id=3)]

    // Note: Boxing occurs when used in collections
}

// Custom collection operations
@JvmInline
value class Score(val value: Int) {
    init {
        require(value in 0..100) { "Score must be between 0 and 100" }
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

    println("Average score: ${board.average()}")  // 75.75
    println("Highest score: ${board.highest()}")  // (Username(name=Charlie), Score(value=91))
    println("Passing students: ${board.passing()}")  // [Username(name=Alice), Username(name=Bob), Username(name=Charlie)]
}
```

## Best Practices

### Domain-Driven Design

Use value classes to represent domain concepts:

```kotlin
// Good practice: Clear domain concepts
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

// Bad practice: Using primitive types
data class OrderBad(
    val orderNumber: String,  // Easy to confuse with other strings
    val customerId: Long,     // Easy to confuse with other numbers
    val items: List<OrderItemBad>
)
```

### Validation at Construction Time

```kotlin
// Good practice: Validate in init block
@JvmInline
value class Age(val years: Int) {
    init {
        require(years >= 0) { "Age cannot be negative" }
        require(years <= 150) { "Age cannot exceed 150" }
    }
}

// Bad practice: Relying on external validation
@JvmInline
value class AgeBad(val years: Int)

fun createAge(years: Int): AgeBad {
    require(years >= 0 && years <= 150)  // Can be bypassed
    return AgeBad(years)
}
```

### Provide Factory Methods

```kotlin
@JvmInline
value class Slug(val value: String) {
    init {
        require(value.matches(Regex("^[a-z0-9-]+$"))) {
            "Slug can only contain lowercase letters, numbers, and hyphens"
        }
    }

    companion object {
        // Generate slug from title
        fun fromTitle(title: String): Slug {
            val slug = title
                .lowercase()
                .replace(Regex("[^a-z0-9\\s-]"), "")
                .replace(Regex("\\s+"), "-")
                .trim('-')
            return Slug(slug)
        }

        // Safe creation
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

### Operator Overloading

```kotlin
@JvmInline
value class Percentage(val value: Double) {
    init {
        require(value in 0.0..100.0)
    }

    // Operator overloading for more natural syntax
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

### toString Override

```kotlin
@JvmInline
value class Money(val cents: Long) {
    // Provide meaningful string representation
    override fun toString(): String {
        val dollars = cents / 100
        val remainder = cents % 100
        return "$$dollars.${remainder.toString().padStart(2, '0')}"
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
    println(Money(1234))  // $12.34
    println(Duration(3661000))  // 1h 1m 1s
}
```

## Common Pitfalls

### Performance Issues from Boxing

```kotlin
@JvmInline
value class Id(val value: Long)

// Pitfall: Frequent use in generic context causes boxing
fun <T> processList(items: List<T>) {
    items.forEach { println(it) }
}

fun main() {
    val ids = List(1000000) { Id(it.toLong()) }
    processList(ids)  // Each Id is boxed
}

// Solution: Use specialized methods for primitive types
fun processIds(ids: List<Id>) {
    ids.forEach { println(it.value) }
}

// Or use Sequence to reduce intermediate collections
val ids = (0 until 1000000).asSequence().map { Id(it.toLong()) }
```

### Nullable Type Pitfalls

```kotlin
@JvmInline
value class Token(val value: String)

// Pitfall: Nullable value classes are always boxed
fun findToken(id: String): Token? {
    return if (id.isNotEmpty()) Token(id) else null
}

// Solution 1: Use sealed class or Result
sealed class TokenResult {
    data class Found(val token: Token) : TokenResult()
    data object NotFound : TokenResult()
}

// Solution 2: Use special value to represent empty
@JvmInline
value class OptionalToken(val value: String) {
    val isPresent: Boolean get() = value.isNotEmpty()

    companion object {
        val EMPTY = OptionalToken("")
    }
}
```

### Equality Comparison

```kotlin
@JvmInline
value class UserId(val id: Long)

fun main() {
    val id1 = UserId(1L)
    val id2 = UserId(1L)

    // Inlined scenario: Direct comparison of underlying type
    println(id1 == id2)  // true

    // Boxing scenario requires attention
    val list1: List<Any> = listOf(id1)
    val list2: List<Any> = listOf(id2)

    println(list1[0] == list2[0])  // true (uses equals)
    println(list1[0] === list2[0])  // false (different objects)
}
```

### Java Interoperability Issues

```kotlin
// Kotlin value class
@JvmInline
value class UserId(val id: Long)

fun findUser(userId: UserId): User? = null
```

```java
// Java invocation
public class JavaCode {
    public void test() {
        // Compiled method signature uses primitive type
        User user = KotlinFileKt.findUser-<hash>(123L);

        // Creating value class instance requires box method
        UserId userId = UserId.box-impl(123L);
    }
}
```

Solution: Provide Java-friendly API:

```kotlin
@JvmInline
value class UserId(val id: Long)

// Provide Java-friendly overload
@JvmName("findUserById")
fun findUser(userId: Long): User? = findUser(UserId(userId))

fun findUser(userId: UserId): User? = null
```

### Serialization Issues

```kotlin
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

// Need to explicitly add serialization support
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

### Reflection Limitations

```kotlin
@JvmInline
value class SecretId(val id: Long)

fun main() {
    val id = SecretId(123)

    // Reflection access may encounter issues
    val klass = id::class
    println(klass.simpleName)  // SecretId

    // In inlined scenarios, reflection may get underlying type
    val any: Any = id  // Boxing
    println(any::class.simpleName)  // SecretId (boxed type)
}
```

## Performance Considerations

### Memory Allocation Comparison

```kotlin
// Traditional wrapper class
class TraditionalWrapper(val value: Long)

// Value class
@JvmInline
value class ValueWrapper(val value: Long)

fun benchmark() {
    val iterations = 10_000_000

    // Traditional wrapper class - allocates object each time
    val startTraditional = System.nanoTime()
    var sumTraditional = 0L
    repeat(iterations) {
        val wrapper = TraditionalWrapper(it.toLong())
        sumTraditional += wrapper.value
    }
    val endTraditional = System.nanoTime()

    // Value class - no object allocation in most cases
    val startValue = System.nanoTime()
    var sumValue = 0L
    repeat(iterations) {
        val wrapper = ValueWrapper(it.toLong())
        sumValue += wrapper.value
    }
    val endValue = System.nanoTime()

    println("Traditional wrapper: ${(endTraditional - startTraditional) / 1_000_000}ms")
    println("Value class: ${(endValue - startValue) / 1_000_000}ms")
}
```

### Performance Impact of Boxing Scenarios

```kotlin
@JvmInline
value class Id(val value: Long)

// No boxing - high performance
fun sumIds(ids: LongArray): Long {
    return ids.sum()
}

// Boxing - has performance overhead
fun sumIdsBoxed(ids: List<Id>): Long {
    return ids.sumOf { it.value }
}

// Compromise - using Sequence
fun sumIdsSequence(ids: Sequence<Id>): Long {
    return ids.sumOf { it.value }
}
```

### Optimization Recommendations

1. **Avoid using nullable value classes in hot paths**
2. **Try to avoid using value classes in generic contexts**
3. **Prefer using underlying types of value classes for batch operations**
4. **Consider using specialized collections for `@JvmInline`**

```kotlin
// Custom specialized collection to avoid boxing
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

## Practical Scenarios

### Database Entity IDs

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

// Database entities
data class User(
    val id: UserId,
    val name: String,
    val email: Email
)

data class Post(
    val id: PostId,
    val authorId: UserId,  // Type-safe foreign key reference
    val title: String,
    val content: String
)

data class Comment(
    val id: CommentId,
    val postId: PostId,    // Type-safe foreign key reference
    val authorId: UserId,  // Type-safe foreign key reference
    val content: String
)

// Repository interfaces
interface UserRepository {
    fun findById(id: UserId): User?
    fun findPostsByAuthor(authorId: UserId): List<Post>
}

interface PostRepository {
    fun findById(id: PostId): Post?
    fun findComments(postId: PostId): List<Comment>
}

// Compile-time error prevention
fun example(userRepo: UserRepository, postRepo: PostRepository) {
    val userId = UserId(1L)
    val postId = PostId(100L)

    userRepo.findById(userId)  // Correct
    // userRepo.findById(postId)  // Compilation error!

    postRepo.findComments(postId)  // Correct
    // postRepo.findComments(userId)  // Compilation error!
}
```

### API Request Parameters

```kotlin
@JvmInline
value class PageNumber(val value: Int) {
    init {
        require(value >= 1) { "Page number must be >= 1" }
    }
}

@JvmInline
value class PageSize(val value: Int) {
    init {
        require(value in 1..100) { "Page size must be between 1 and 100" }
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
        require(field.isNotBlank()) { "Sort field cannot be empty" }
        require(field.matches(Regex("^[a-zA-Z_]+$"))) {
            "Sort field can only contain letters and underscores"
        }
    }
}

@JvmInline
value class SortDirection(val direction: String) {
    init {
        require(direction in listOf("asc", "desc")) {
            "Sort direction must be asc or desc"
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
        // Parameters are already validated, can use directly
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

### Configuration Management

```kotlin
@JvmInline
value class Port(val value: Int) {
    init {
        require(value in 1..65535) { "Port number must be between 1 and 65535" }
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
        require(value.isNotBlank()) { "Hostname cannot be empty" }
    }

    companion object {
        val LOCALHOST = Host("localhost")
        val ALL_INTERFACES = Host("0.0.0.0")
    }
}

@JvmInline
value class Timeout(val milliseconds: Long) {
    init {
        require(milliseconds > 0) { "Timeout must be greater than 0" }
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
        require(value > 0) { "Maximum connections must be greater than 0" }
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

// Configuration loading
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

### Event System

```kotlin
@JvmInline
value class EventId(val id: String) {
    init {
        require(id.isNotBlank()) { "Event ID cannot be empty" }
    }

    companion object {
        fun generate(): EventId = EventId(java.util.UUID.randomUUID().toString())
    }
}

@JvmInline
value class EventType(val type: String) {
    init {
        require(type.matches(Regex("^[a-z]+\\.[a-z]+$"))) {
            "Event type format: domain.action"
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

// Event handlers
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

## Interview Key Points

### What are Kotlin value classes? What problems do they solve?

**Key Points**:
- Value classes are a zero-cost abstraction for wrapping a single value
- They solve the Primitive Obsession problem
- They provide compile-time type safety, preventing parameter confusion
- At runtime, in most cases no object is created, performance is close to primitive types

### What's the difference between value classes and type aliases?

**Key Points**:
- Type aliases are just aliases, no type safety
- Value classes are new types with full type checking
- Value classes can have methods and validation logic
- Value classes have slight runtime overhead (in boxing scenarios)

### When do value classes get boxed?

**Key Points**:
- As generic type parameters
- As nullable types
- Implementing interface and used as interface type
- Stored in arrays
- Type checking (is)
- As Any type

### What limitations do value classes have?

**Key Points**:
- Can only have one primary constructor parameter
- Parameter must be val
- Cannot have properties with backing fields
- Cannot inherit from other classes (can implement interfaces)
- Cannot be inherited (final)
- Requires @JvmInline annotation

### How do you use Kotlin value classes in Java?

**Key Points**:
- Compiled method uses primitive type parameter
- Method name has hash suffix
- Can use box-impl method to create instance
- Recommend providing Java-friendly API overloads

### What are the best use cases for value classes?

**Key Points**:
- Value objects in Domain-Driven Design
- Various ID types (UserId, OrderId, etc.)
- Measurement units (Money, Distance, Duration)
- Validated data (Email, Url, PhoneNumber)
- Sensitive data wrappers (Password, ApiKey)

## Further Reading

### Official Documentation
- [Kotlin Official Documentation - Inline Value Classes](https://kotlinlang.org/docs/inline-classes.html)
- [Kotlin KEEP - Inline Classes](https://github.com/Kotlin/KEEP/blob/master/proposals/inline-classes.zh.md)
- [Kotlin KEEP - Value Classes](https://github.com/Kotlin/KEEP/blob/master/proposals/value-classes.zh.md)

### Related Concepts
- [Project Valhalla](https://openjdk.org/projects/valhalla/) - JVM-level value type support
- [Value Objects in Domain-Driven Design](https://martinfowler.com/bliki/ValueObject.html)
- [Primitive Obsession Code Smell](https://refactoring.guru/smells/primitive-obsession)

### Recommended Books
- "Kotlin in Action" - Chapter 4: Classes, Objects, and Interfaces
- "Domain-Driven Design" - Value Object Pattern
- "Effective Kotlin" - Item 47: Use inline classes to wrap types

### Related Libraries
- [kotlin-result](https://github.com/michaelbull/kotlin-result) - Result type implementation using value classes
- [arrow-kt](https://arrow-kt.io/) - Functional programming library that extensively uses value classes

## Summary

Kotlin value classes are a powerful type system feature that excels in the following areas:

| Aspect | Advantage |
|--------|-----------|
| Type Safety | Compile-time prevention of parameter confusion |
| Performance | Zero overhead in most cases |
| Readability | Self-documenting code |
| Validation | Enforced validation at construction |
| Domain Modeling | Clear expression of business concepts |

**Usage Recommendations**:

1. Create dedicated value classes for each business concept
2. Add validation logic in init blocks
3. Override toString to provide meaningful output
4. Provide factory methods for complex creation logic
5. Be aware of performance impact from boxing scenarios
6. Provide friendly APIs for Java interoperability

Value classes are an important tool for implementing type-driven development in Kotlin. Proper use can significantly improve code quality and maintainability.
