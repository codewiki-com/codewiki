---
title: 扩展函数
description: Kotlin 扩展函数完整指南，向现有类添加新功能
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - Kotlin
  - Extension Functions
  - Extension Properties
  - Functional
status: imported
origin: old/src/content/docs/kotlin/extensions.zh.md
divergence: 0.203
issues: []
legacy:
  category: Kotlin
  subcategory: Language Features
  order: 10
  lastUpdated: 2026-01-07
---

扩展函数是 Kotlin 最强大的特性之一，允许你在不继承现有类或使用装饰器等设计模式的情况下向其添加新功能。这种能力使你能够扩展第三方库、标准库甚至无法修改的类，使代码更具表达力和可读性。

## 什么是扩展函数？

扩展函数是一个可以像类的成员一样被调用的函数，但定义在该类之外。被扩展的类称为"接收者类型"，调用扩展函数的对象称为"接收者对象"。

### 基本语法

要声明扩展函数，在函数名前加上接收者类型：

```kotlin
fun String.addExclamation(): String {
    return this + "!"
}

// 用法
val greeting = "Hello"
println(greeting.addExclamation())  // "Hello!"
```

在这个例子中：
- `String` 是接收者类型
- `this` 引用接收者对象（字符串实例）
- 该函数可以在任何 String 上调用，就像它是内置方法一样

### 扩展函数的工作原理

在底层，扩展函数被编译为静态方法，其中接收者对象成为第一个参数。上面的扩展函数编译为类似于：

```kotlin
// 编译器生成的内容（概念上）
fun addExclamation(receiver: String): String {
    return receiver + "!"
}
```

这意味着扩展函数是根据表达式的声明类型静态分派的，而不是根据运行时类型动态分派的。

## 实用扩展函数示例

### 扩展标准库类

扩展函数在向标准类添加实用方法时大放异彩：

```kotlin
// 检查字符串是否是有效的电子邮件（简化版）
fun String.isValidEmail(): Boolean {
    return this.contains("@") && this.contains(".")
}

// 将字符串中每个单词首字母大写
fun String.capitalizeWords(): String {
    return this.split(" ").joinToString(" ") { word ->
        word.replaceFirstChar { it.uppercase() }
    }
}

// 用法
val email = "user@example.com"
println(email.isValidEmail())  // true

val title = "the quick brown fox"
println(title.capitalizeWords())  // "The Quick Brown Fox"
```

### 扩展集合

集合经常被扩展以添加领域特定的操作：

```kotlin
// 获取第二个元素或 null
fun <T> List<T>.secondOrNull(): T? {
    return if (this.size >= 2) this[1] else null
}

// 交换可变列表中的两个元素
fun <T> MutableList<T>.swap(index1: Int, index2: Int) {
    val temp = this[index1]
    this[index1] = this[index2]
    this[index2] = temp
}

// 计算所有数字的乘积
fun List<Int>.product(): Long {
    return this.fold(1L) { acc, value -> acc * value }
}

// 用法
val numbers = listOf(1, 2, 3, 4, 5)
println(numbers.secondOrNull())  // 2
println(numbers.product())       // 120

val mutableNumbers = mutableListOf(1, 2, 3)
mutableNumbers.swap(0, 2)
println(mutableNumbers)  // [3, 2, 1]
```

### 扩展你自己的类

扩展函数适用于任何类，包括你自己的类：

```kotlin
data class User(val name: String, val email: String, val age: Int)

fun User.isAdult(): Boolean = this.age >= 18

fun User.toDisplayString(): String {
    return "${this.name} (${this.email})"
}

fun List<User>.filterAdults(): List<User> {
    return this.filter { it.isAdult() }
}

// 用法
val user = User("Alice", "alice@example.com", 25)
println(user.isAdult())         // true
println(user.toDisplayString()) // "Alice (alice@example.com)"

val users = listOf(
    User("Alice", "alice@example.com", 25),
    User("Bob", "bob@example.com", 17),
    User("Charlie", "charlie@example.com", 30)
)
println(users.filterAdults().map { it.name })  // [Alice, Charlie]
```

## 扩展属性

除了扩展函数，Kotlin 还支持扩展属性。这允许你向现有类添加计算属性。

### 基本扩展属性

```kotlin
val String.wordCount: Int
    get() = this.split(Regex("\\s+")).filter { it.isNotEmpty() }.size

val List<Int>.average: Double
    get() = if (this.isEmpty()) 0.0 else this.sum().toDouble() / this.size

// 用法
val text = "The quick brown fox"
println(text.wordCount)  // 4

val numbers = listOf(1, 2, 3, 4, 5)
println(numbers.average)  // 3.0
```

### 扩展属性的限制

扩展属性不能有后备字段，因为扩展实际上并不将成员插入到类中。这意味着：

```kotlin
// 这是不允许的 - 没有后备字段
// val String.lastCharacter: Char = ' '  // 错误！

// 必须使用 getter（对于 var 可选地使用 setter）
val String.lastCharacter: Char
    get() = this[this.length - 1]
```

### 可变扩展属性

你可以定义同时有 getter 和 setter 的可变扩展属性：

```kotlin
var StringBuilder.lastChar: Char
    get() = this[this.length - 1]
    set(value) {
        this.setCharAt(this.length - 1, value)
    }

// 用法
val sb = StringBuilder("Hello")
println(sb.lastChar)  // 'o'
sb.lastChar = '!'
println(sb)  // "Hell!"
```

## 可空接收者

扩展函数可以用可空接收者类型定义。这允许你在 null 值上调用扩展并在函数内处理 null 情况。

### 在可空类型上定义扩展

```kotlin
fun String?.orEmpty(): String {
    return this ?: ""
}

fun String?.isNullOrBlank(): Boolean {
    return this == null || this.isBlank()
}

fun <T> List<T>?.orEmpty(): List<T> {
    return this ?: emptyList()
}

// 用法
val nullableString: String? = null
println(nullableString.orEmpty())      // ""
println(nullableString.isNullOrBlank()) // true

val name: String? = "  "
println(name.isNullOrBlank())  // true

val nullableList: List<Int>? = null
println(nullableList.orEmpty())  // []
```

### 可空接收者上的安全操作

当接收者可空时，你必须在函数内处理 null 情况：

```kotlin
fun String?.toUppercaseOrDefault(default: String = "N/A"): String {
    return this?.uppercase() ?: default
}

fun <T> List<T>?.sizeOrZero(): Int {
    return this?.size ?: 0
}

// 对日志记录有用
fun Any?.toLogString(): String {
    return when (this) {
        null -> "null"
        is String -> "\"$this\""
        is Collection<*> -> "Collection(size=${this.size})"
        else -> this.toString()
    }
}

// 用法
val name: String? = null
println(name.toUppercaseOrDefault())  // "N/A"

val list: List<Int>? = null
println(list.sizeOrZero())  // 0
```

### 比较可空和非空接收者

可空和非空接收者之间的区别影响扩展的调用方式：

```kotlin
// 非空接收者 - 在可空值上需要安全调用
fun String.wrap(prefix: String, suffix: String): String {
    return "$prefix$this$suffix"
}

// 可空接收者 - 可以直接在可空值上调用
fun String?.wrapOrNull(prefix: String, suffix: String): String? {
    return this?.let { "$prefix$it$suffix" }
}

// 用法
val text: String? = "Hello"
val nullText: String? = null

// 非空接收者需要 ?.
println(text?.wrap("[", "]"))      // "[Hello]"
println(nullText?.wrap("[", "]"))  // null

// 可空接收者可以直接调用
println(text.wrapOrNull("[", "]"))      // "[Hello]"
println(nullText.wrapOrNull("[", "]"))  // null
```

## 伴生对象扩展

你可以扩展伴生对象来添加看起来像类的静态方法的功能。当你想要添加在概念上属于类但不需要实例的工厂方法或实用函数时，这很有用。

### 扩展伴生对象

```kotlin
class User(val name: String, val email: String) {
    companion object {
        // 伴生对象可以为空
    }
}

// 伴生对象上的扩展函数
fun User.Companion.fromEmail(email: String): User {
    val name = email.substringBefore("@")
    return User(name, email)
}

fun User.Companion.guest(): User {
    return User("Guest", "guest@example.com")
}

// 用法 - 在类名上调用
val user = User.fromEmail("alice@example.com")
println(user.name)  // "alice"

val guest = User.guest()
println(guest.name)  // "Guest"
```

### 命名伴生对象

如果伴生对象有名称，使用该名称而不是 `Companion`：

```kotlin
class Logger {
    companion object Factory {
        fun create(): Logger = Logger()
    }
}

fun Logger.Factory.createWithPrefix(prefix: String): Logger {
    println("Creating logger with prefix: $prefix")
    return Logger()
}

// 用法
val logger = Logger.createWithPrefix("APP")
```

### 实际示例：JSON 解析

伴生对象扩展通常用于解析或反序列化：

```kotlin
data class Product(
    val id: Int,
    val name: String,
    val price: Double
) {
    companion object
}

fun Product.Companion.fromMap(map: Map<String, Any>): Product {
    return Product(
        id = map["id"] as Int,
        name = map["name"] as String,
        price = map["price"] as Double
    )
}

fun Product.Companion.fromJson(json: String): Product {
    // 简化解析 - 实际中你会使用 JSON 库
    val id = Regex("\"id\":\\s*(\\d+)").find(json)?.groupValues?.get(1)?.toInt() ?: 0
    val name = Regex("\"name\":\\s*\"([^\"]+)\"").find(json)?.groupValues?.get(1) ?: ""
    val price = Regex("\"price\":\\s*([\\d.]+)").find(json)?.groupValues?.get(1)?.toDouble() ?: 0.0
    return Product(id, name, price)
}

// 用法
val productMap = mapOf("id" to 1, "name" to "Widget", "price" to 9.99)
val product = Product.fromMap(productMap)
println(product)  // Product(id=1, name=Widget, price=9.99)
```

## 泛型扩展

扩展函数可以是泛型的，允许你创建适用于多种类型的可重用扩展。

### 基本泛型扩展

```kotlin
// 任何类型上的泛型扩展
fun <T> T.toSingletonList(): List<T> {
    return listOf(this)
}

// 带约束的泛型扩展
fun <T : Comparable<T>> List<T>.isSorted(): Boolean {
    return this.zipWithNext().all { (a, b) -> a <= b }
}

// 用法
val number = 42.toSingletonList()       // [42]
val string = "Hello".toSingletonList()  // ["Hello"]

val sorted = listOf(1, 2, 3, 4, 5)
val unsorted = listOf(3, 1, 4, 1, 5)
println(sorted.isSorted())    // true
println(unsorted.isSorted())  // false
```

### 多类型参数

```kotlin
// 转换 Pair
fun <A, B, C> Pair<A, B>.mapFirst(transform: (A) -> C): Pair<C, B> {
    return Pair(transform(this.first), this.second)
}

fun <A, B, C> Pair<A, B>.mapSecond(transform: (B) -> C): Pair<A, C> {
    return Pair(this.first, transform(this.second))
}

// 用转换组合两个列表
fun <T, R, V> List<T>.zipWith(other: List<R>, transform: (T, R) -> V): List<V> {
    return this.zip(other).map { (a, b) -> transform(a, b) }
}

// 用法
val pair = 1 to "hello"
println(pair.mapFirst { it * 2 })      // (2, hello)
println(pair.mapSecond { it.length })  // (1, 5)

val nums = listOf(1, 2, 3)
val strs = listOf("a", "b", "c")
println(nums.zipWith(strs) { n, s -> "$s$n" })  // [a1, b2, c3]
```

### 具体化类型参数

使用 `inline` 和 `reified` 允许在运行时访问类型信息：

```kotlin
inline fun <reified T> Any.isType(): Boolean {
    return this is T
}

inline fun <reified T> List<*>.filterIsInstanceTo(): List<T> {
    return this.filterIsInstance<T>()
}

inline fun <reified T> List<*>.countInstancesOf(): Int {
    return this.count { it is T }
}

// 用法
val value: Any = "Hello"
println(value.isType<String>())  // true
println(value.isType<Int>())     // false

val mixed = listOf(1, "two", 3, "four", 5.0)
println(mixed.filterIsInstanceTo<String>())  // [two, four]
println(mixed.countInstancesOf<Int>())       // 2
```

### 带可空约束的泛型扩展

```kotlin
// 适用于任何可空类型的扩展
fun <T : Any> T?.ifNotNull(action: (T) -> Unit) {
    if (this != null) {
        action(this)
    }
}

// 转换或提供默认值
fun <T, R> T?.letOrDefault(default: R, transform: (T) -> R): R {
    return if (this != null) transform(this) else default
}

// 用法
val name: String? = "Alice"
name.ifNotNull { println("Name is $it") }  // "Name is Alice"

val nullName: String? = null
nullName.ifNotNull { println("This won't print") }

val length = name.letOrDefault(0) { it.length }  // 5
val nullLength = nullName.letOrDefault(0) { it.length }  // 0
```

## 成员函数 vs 扩展函数

理解成员函数和扩展函数之间的区别对于编写可预测的代码至关重要。

### 解析顺序：成员优先

当类有一个与扩展函数签名相同的成员函数时，成员函数总是优先：

```kotlin
class Example {
    fun greet() = "Hello from member"
}

fun Example.greet() = "Hello from extension"

val example = Example()
println(example.greet())  // "Hello from member"
```

这种行为确保添加扩展函数不会意外改变现有代码的行为。

### 不同签名

如果签名不同，成员函数和扩展函数可以共存：

```kotlin
class Calculator {
    fun add(a: Int, b: Int): Int = a + b
}

// 不同签名 - 作为扩展工作
fun Calculator.add(a: Int, b: Int, c: Int): Int = a + b + c

val calc = Calculator()
println(calc.add(1, 2))     // 3 (成员)
println(calc.add(1, 2, 3))  // 6 (扩展)
```

### 静态分派 vs 动态分派

扩展函数根据声明的类型静态解析，而不是运行时类型。这是与虚拟成员函数的关键区别：

```kotlin
open class Animal {
    open fun speak() = "Some sound"
}

class Dog : Animal() {
    override fun speak() = "Bark"
}

// 扩展函数
fun Animal.describe() = "This is an animal"
fun Dog.describe() = "This is a dog"

fun printDescription(animal: Animal) {
    println(animal.speak())     // 动态分派
    println(animal.describe())  // 静态分派
}

val dog = Dog()
printDescription(dog)
// 输出：
// Bark           (动态 - 使用 Dog.speak())
// This is an animal  (静态 - 使用 Animal.describe())
```

### 访问私有成员

扩展函数无法访问接收者类的私有或受保护成员。它们只能访问公共和内部成员：

```kotlin
class Secret {
    private val privateValue = "secret"
    internal val internalValue = "internal"
    val publicValue = "public"
}

fun Secret.tryAccess(): String {
    // return privateValue   // 错误：无法访问 'privateValue'
    // return internalValue  // 如果在同一模块中则可以
    return publicValue       // OK
}
```

### 何时使用扩展 vs 成员

使用扩展函数当：
- 你无法修改类（第三方库、标准库）
- 功能不是类核心职责的一部分
- 你想添加领域特定的操作而不使类变得杂乱
- 你想按上下文组织实用函数

使用成员函数当：
- 功能是类目的的核心
- 你需要访问私有状态
- 你需要多态行为（在子类中重写）
- 函数应该对类的所有用户可见

## 作用域和可见性

扩展函数遵循 Kotlin 的标准可见性规则，在不同包中定义时必须导入。

### 导入扩展

```kotlin
// 文件：StringExtensions.kt
package com.example.utils

fun String.reverse(): String = this.reversed()
fun String.isPalindrome(): Boolean = this == this.reversed()
```

```kotlin
// 文件：Main.kt
package com.example.app

// 导入特定扩展
import com.example.utils.reverse
import com.example.utils.isPalindrome

// 或导入包中的所有扩展
import com.example.utils.*

fun main() {
    println("hello".reverse())       // "olleh"
    println("radar".isPalindrome())  // true
}
```

### 可见性修饰符

扩展函数可以有可见性修饰符：

```kotlin
// Public - 随处可访问（默认）
fun String.publicExtension() = this

// Internal - 在同一模块内可访问
internal fun String.internalExtension() = this

// Private - 仅在同一文件内可访问
private fun String.privateExtension() = this
```

### 局部扩展

扩展可以在函数内部局部定义：

```kotlin
fun processStrings(strings: List<String>): List<String> {
    // 局部扩展 - 仅在此函数内可用
    fun String.process(): String {
        return this.trim().lowercase().replace(" ", "_")
    }

    return strings.map { it.process() }
}

val result = processStrings(listOf("Hello World", "  KOTLIN  "))
println(result)  // [hello_world, kotlin]
```

### 类中的扩展

扩展可以在类内部声明，使它们仅在该类内可用：

```kotlin
class StringProcessor {
    private fun String.process(): String {
        return this.trim().uppercase()
    }

    fun processAll(strings: List<String>): List<String> {
        return strings.map { it.process() }
    }
}

val processor = StringProcessor()
println(processor.processAll(listOf("hello", "world")))  // [HELLO, WORLD]

// "hello".process()  // 错误：扩展在类外部不可访问
```

## 最佳实践

### 保持扩展专注

每个扩展应该做好一件事：

```kotlin
// 好：专注、单一职责的扩展
fun String.removeWhitespace(): String = this.replace("\\s".toRegex(), "")
fun String.countWords(): Int = this.split("\\s+".toRegex()).size

// 避免：做太多事情的扩展
fun String.processAndValidateAndFormat(): String {
    // 太多职责
    return this
}
```

### 清晰命名扩展

扩展名称应该清晰表明它们的功能：

```kotlin
// 好：清晰、描述性的名称
fun List<Int>.sumOfSquares(): Int = this.sumOf { it * it }
fun String.toTitleCase(): String = this.split(" ").joinToString(" ") {
    it.replaceFirstChar { c -> c.uppercase() }
}

// 避免：模糊或歧义的名称
fun String.process(): String = this.trim()  // 什么类型的处理？
fun List<Int>.calc(): Int = this.sum()      // 什么计算？
```

### 为复杂扩展添加文档

为具有非显而易见行为的扩展添加文档：

```kotlin
/**
 * 返回给定索引处的元素，如果索引超出列表边界则环绕。
 * 支持负索引以从列表末尾访问元素。
 *
 * @param index 要访问的索引，可以是负数或超出列表大小
 * @return 环绕索引处的元素
 * @throws NoSuchElementException 如果列表为空
 */
fun <T> List<T>.getWrapped(index: Int): T {
    if (this.isEmpty()) throw NoSuchElementException("List is empty")
    val wrappedIndex = ((index % this.size) + this.size) % this.size
    return this[wrappedIndex]
}
```

### 避免遮蔽标准库函数

不要创建用不同行为遮蔽众所周知的标准库函数的扩展：

```kotlin
// 避免：用不同行为遮蔽标准库
fun String.reversed(): String = this  // 令人困惑！返回相同字符串

// 更好：使用不同的名称
fun String.reversedWords(): String = this.split(" ").reversed().joinToString(" ")
```

### 按领域组织扩展

将相关扩展分组到按领域组织的文件或包中：

```kotlin
// 文件：DateExtensions.kt
package com.example.extensions.dates

fun Long.toFormattedDate(): String { /* ... */ }
fun String.parseDate(): Long { /* ... */ }

// 文件：StringExtensions.kt
package com.example.extensions.strings

fun String.toSlug(): String { /* ... */ }
fun String.truncate(maxLength: Int): String { /* ... */ }

// 文件：CollectionExtensions.kt
package com.example.extensions.collections

fun <T> List<T>.randomOrNull(): T? { /* ... */ }
fun <K, V> Map<K, V>.getOrThrow(key: K): V { /* ... */ }
```

## 实际示例

### 构建流畅的 API

扩展函数实现流畅、可读的 API：

```kotlin
data class QueryBuilder(
    val table: String,
    val columns: List<String> = listOf("*"),
    val whereClause: String? = null,
    val orderBy: String? = null,
    val limit: Int? = null
)

fun QueryBuilder.select(vararg columns: String): QueryBuilder {
    return this.copy(columns = columns.toList())
}

fun QueryBuilder.where(condition: String): QueryBuilder {
    return this.copy(whereClause = condition)
}

fun QueryBuilder.orderBy(column: String, ascending: Boolean = true): QueryBuilder {
    val order = if (ascending) "ASC" else "DESC"
    return this.copy(orderBy = "$column $order")
}

fun QueryBuilder.limit(count: Int): QueryBuilder {
    return this.copy(limit = count)
}

fun QueryBuilder.toSql(): String {
    val cols = columns.joinToString(", ")
    val sql = StringBuilder("SELECT $cols FROM $table")
    whereClause?.let { sql.append(" WHERE $it") }
    orderBy?.let { sql.append(" ORDER BY $it") }
    limit?.let { sql.append(" LIMIT $it") }
    return sql.toString()
}

// 用法
val query = QueryBuilder("users")
    .select("id", "name", "email")
    .where("age > 18")
    .orderBy("name")
    .limit(10)
    .toSql()

println(query)
// SELECT id, name, email FROM users WHERE age > 18 ORDER BY name ASC LIMIT 10
```

### Android View 扩展

扩展在 Android 开发中很常用：

```kotlin
// View 可见性扩展
fun View.show() {
    this.visibility = View.VISIBLE
}

fun View.hide() {
    this.visibility = View.GONE
}

fun View.invisible() {
    this.visibility = View.INVISIBLE
}

// Toast 扩展
fun Context.showToast(message: String, duration: Int = Toast.LENGTH_SHORT) {
    Toast.makeText(this, message, duration).show()
}

// EditText 扩展
fun EditText.textString(): String = this.text.toString()

fun EditText.isEmpty(): Boolean = this.text.isNullOrEmpty()

// 在 Activity 中使用
button.setOnClickListener {
    if (editText.isEmpty()) {
        showToast("Please enter a value")
        return@setOnClickListener
    }
    val value = editText.textString()
    processValue(value)
    progressBar.show()
}
```

### 验证扩展

使用扩展创建验证框架：

```kotlin
sealed class ValidationResult {
    object Valid : ValidationResult()
    data class Invalid(val message: String) : ValidationResult()
}

fun String.validateNotEmpty(fieldName: String): ValidationResult {
    return if (this.isNotEmpty()) {
        ValidationResult.Valid
    } else {
        ValidationResult.Invalid("$fieldName cannot be empty")
    }
}

fun String.validateEmail(): ValidationResult {
    val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$".toRegex()
    return if (this.matches(emailRegex)) {
        ValidationResult.Valid
    } else {
        ValidationResult.Invalid("Invalid email format")
    }
}

fun String.validateMinLength(minLength: Int, fieldName: String): ValidationResult {
    return if (this.length >= minLength) {
        ValidationResult.Valid
    } else {
        ValidationResult.Invalid("$fieldName must be at least $minLength characters")
    }
}

fun List<ValidationResult>.allValid(): Boolean {
    return this.all { it is ValidationResult.Valid }
}

fun List<ValidationResult>.getErrors(): List<String> {
    return this.filterIsInstance<ValidationResult.Invalid>().map { it.message }
}

// 用法
fun validateUser(name: String, email: String, password: String): List<String> {
    val validations = listOf(
        name.validateNotEmpty("Name"),
        email.validateNotEmpty("Email"),
        email.validateEmail(),
        password.validateMinLength(8, "Password")
    )

    return validations.getErrors()
}

val errors = validateUser("", "invalid-email", "123")
println(errors)
// [Name cannot be empty, Invalid email format, Password must be at least 8 characters]
```

### 函数式编程扩展

增强函数式编程能力：

```kotlin
// Result 类型扩展
fun <T, R> Result<T>.flatMap(transform: (T) -> Result<R>): Result<R> {
    return this.fold(
        onSuccess = { transform(it) },
        onFailure = { Result.failure(it) }
    )
}

fun <T> Result<T>.recover(transform: (Throwable) -> T): Result<T> {
    return this.fold(
        onSuccess = { Result.success(it) },
        onFailure = { Result.success(transform(it)) }
    )
}

// Sequence 扩展
fun <T> Sequence<T>.takeWhileInclusive(predicate: (T) -> Boolean): Sequence<T> {
    var shouldContinue = true
    return this.takeWhile {
        val result = shouldContinue
        shouldContinue = predicate(it)
        result
    }
}

// 组合
infix fun <A, B, C> ((B) -> C).compose(other: (A) -> B): (A) -> C {
    return { a -> this(other(a)) }
}

infix fun <A, B, C> ((A) -> B).andThen(other: (B) -> C): (A) -> C {
    return { a -> other(this(a)) }
}

// 用法
val addOne: (Int) -> Int = { it + 1 }
val double: (Int) -> Int = { it * 2 }

val addThenDouble = addOne andThen double
val doubleThenAdd = addOne compose double

println(addThenDouble(5))  // 12  ((5 + 1) * 2)
println(doubleThenAdd(5))  // 11  ((5 * 2) + 1)
```

## 总结

扩展函数是地道 Kotlin 编程的基石。它们提供了一种强大的机制，可以用新功能增强现有类型，同时保持干净、可读的代码。关键要点包括：

- **扩展函数** 向现有类添加新函数而不修改它们。它们使用接收者类型语法（`fun ReceiverType.functionName()`）并编译为静态方法。

- **扩展属性** 与扩展函数类似，但提供属性语法。它们不能有后备字段，必须使用 getter（可变属性还有 setter）。

- **可空接收者** 允许在可空类型上定义扩展，启用空安全操作并在许多场景中消除安全调用的需要。

- **伴生对象扩展** 向类添加看起来像静态方法的功能，对于工厂函数和逻辑上属于类的实用方法很有用。

- **泛型扩展** 使扩展可在多种类型之间重用，支持类型约束和具体化类型参数以进行运行时类型访问。

- **成员 vs 扩展解析** 遵循一个简单规则：当签名匹配时成员函数总是优先。扩展根据声明的类型静态解析。

- **最佳实践** 包括保持扩展专注、使用清晰的名称、为复杂行为添加文档以及按领域组织扩展。

扩展函数改变了你与现有代码交互的方式，允许你创建富有表达力的、领域特定的 API 和实用函数，感觉像是它们扩展的类型的原生功能。掌握这个特性，你将编写更可读、可维护和优雅的 Kotlin 代码。
