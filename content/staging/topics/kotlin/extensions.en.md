---
title: Extension Functions
description: Complete guide to Kotlin extension functions, adding new functionality to existing classes
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - Kotlin
  - Extension Functions
  - Extension Properties
  - Functional
status: imported
origin: old/src/content/docs/kotlin/extensions.en.md
divergence: 0.203
issues: []
legacy:
  category: Kotlin
  subcategory: Language Features
  order: 10
  lastUpdated: 2026-01-07
---

Extension functions are one of Kotlin's most powerful features, allowing you to add new functionality to existing classes without inheriting from them or using design patterns like Decorator. This capability enables you to extend classes from third-party libraries, the standard library, or even classes you cannot modify, making your code more expressive and readable.

## What Are Extension Functions?

An extension function is a function that can be called as if it were a member of a class, but is defined outside of that class. The class being extended is called the "receiver type," and the object on which the extension function is called is called the "receiver object."

### Basic Syntax

To declare an extension function, prefix the function name with the receiver type:

```kotlin
fun String.addExclamation(): String {
    return this + "!"
}

// Usage
val greeting = "Hello"
println(greeting.addExclamation())  // "Hello!"
```

In this example:
- `String` is the receiver type
- `this` refers to the receiver object (the string instance)
- The function can be called on any String as if it were a built-in method

### How Extension Functions Work

Under the hood, extension functions are compiled to static methods where the receiver object becomes the first parameter. The extension function above compiles to something equivalent to:

```kotlin
// What the compiler generates (conceptually)
fun addExclamation(receiver: String): String {
    return receiver + "!"
}
```

This means extension functions are dispatched statically based on the declared type of the expression, not dynamically based on the runtime type.

## Practical Extension Function Examples

### Extending Standard Library Classes

Extension functions shine when adding utility methods to standard classes:

```kotlin
// Check if a string is a valid email (simplified)
fun String.isValidEmail(): Boolean {
    return this.contains("@") && this.contains(".")
}

// Capitalize each word in a string
fun String.capitalizeWords(): String {
    return this.split(" ").joinToString(" ") { word ->
        word.replaceFirstChar { it.uppercase() }
    }
}

// Usage
val email = "user@example.com"
println(email.isValidEmail())  // true

val title = "the quick brown fox"
println(title.capitalizeWords())  // "The Quick Brown Fox"
```

### Extending Collections

Collections are frequently extended to add domain-specific operations:

```kotlin
// Get the second element or null
fun <T> List<T>.secondOrNull(): T? {
    return if (this.size >= 2) this[1] else null
}

// Swap two elements in a mutable list
fun <T> MutableList<T>.swap(index1: Int, index2: Int) {
    val temp = this[index1]
    this[index1] = this[index2]
    this[index2] = temp
}

// Calculate the product of all numbers
fun List<Int>.product(): Long {
    return this.fold(1L) { acc, value -> acc * value }
}

// Usage
val numbers = listOf(1, 2, 3, 4, 5)
println(numbers.secondOrNull())  // 2
println(numbers.product())       // 120

val mutableNumbers = mutableListOf(1, 2, 3)
mutableNumbers.swap(0, 2)
println(mutableNumbers)  // [3, 2, 1]
```

### Extending Your Own Classes

Extension functions work with any class, including your own:

```kotlin
data class User(val name: String, val email: String, val age: Int)

fun User.isAdult(): Boolean = this.age >= 18

fun User.toDisplayString(): String {
    return "${this.name} (${this.email})"
}

fun List<User>.filterAdults(): List<User> {
    return this.filter { it.isAdult() }
}

// Usage
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

## Extension Properties

In addition to extension functions, Kotlin also supports extension properties. These allow you to add computed properties to existing classes.

### Basic Extension Properties

```kotlin
val String.wordCount: Int
    get() = this.split(Regex("\\s+")).filter { it.isNotEmpty() }.size

val List<Int>.average: Double
    get() = if (this.isEmpty()) 0.0 else this.sum().toDouble() / this.size

// Usage
val text = "The quick brown fox"
println(text.wordCount)  // 4

val numbers = listOf(1, 2, 3, 4, 5)
println(numbers.average)  // 3.0
```

### Limitations of Extension Properties

Extension properties cannot have backing fields because extensions do not actually insert members into classes. This means:

```kotlin
// This is NOT allowed - no backing field
// val String.lastCharacter: Char = ' '  // Error!

// Must use getter (and optionally setter for var)
val String.lastCharacter: Char
    get() = this[this.length - 1]
```

### Mutable Extension Properties

You can define mutable extension properties with both getter and setter:

```kotlin
var StringBuilder.lastChar: Char
    get() = this[this.length - 1]
    set(value) {
        this.setCharAt(this.length - 1, value)
    }

// Usage
val sb = StringBuilder("Hello")
println(sb.lastChar)  // 'o'
sb.lastChar = '!'
println(sb)  // "Hell!"
```

## Nullable Receivers

Extension functions can be defined with a nullable receiver type. This allows you to call the extension on null values and handle the null case inside the function.

### Defining Extensions on Nullable Types

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

// Usage
val nullableString: String? = null
println(nullableString.orEmpty())      // ""
println(nullableString.isNullOrBlank()) // true

val name: String? = "  "
println(name.isNullOrBlank())  // true

val nullableList: List<Int>? = null
println(nullableList.orEmpty())  // []
```

### Safe Operations on Nullable Receivers

When the receiver is nullable, you must handle the null case within the function:

```kotlin
fun String?.toUppercaseOrDefault(default: String = "N/A"): String {
    return this?.uppercase() ?: default
}

fun <T> List<T>?.sizeOrZero(): Int {
    return this?.size ?: 0
}

// Useful for logging
fun Any?.toLogString(): String {
    return when (this) {
        null -> "null"
        is String -> "\"$this\""
        is Collection<*> -> "Collection(size=${this.size})"
        else -> this.toString()
    }
}

// Usage
val name: String? = null
println(name.toUppercaseOrDefault())  // "N/A"

val list: List<Int>? = null
println(list.sizeOrZero())  // 0
```

### Comparing Nullable and Non-Nullable Receivers

The difference between nullable and non-nullable receivers affects how the extension can be called:

```kotlin
// Non-nullable receiver - requires safe call on nullable
fun String.wrap(prefix: String, suffix: String): String {
    return "$prefix$this$suffix"
}

// Nullable receiver - can be called directly on nullable
fun String?.wrapOrNull(prefix: String, suffix: String): String? {
    return this?.let { "$prefix$it$suffix" }
}

// Usage
val text: String? = "Hello"
val nullText: String? = null

// Non-nullable receiver requires ?.
println(text?.wrap("[", "]"))      // "[Hello]"
println(nullText?.wrap("[", "]"))  // null

// Nullable receiver can be called directly
println(text.wrapOrNull("[", "]"))      // "[Hello]"
println(nullText.wrapOrNull("[", "]"))  // null
```

## Companion Object Extensions

You can extend companion objects to add what looks like static methods to a class. This is useful when you want to add factory methods or utility functions that belong conceptually to the class but don't require an instance.

### Extending Companion Objects

```kotlin
class User(val name: String, val email: String) {
    companion object {
        // Companion object can be empty
    }
}

// Extension function on the companion object
fun User.Companion.fromEmail(email: String): User {
    val name = email.substringBefore("@")
    return User(name, email)
}

fun User.Companion.guest(): User {
    return User("Guest", "guest@example.com")
}

// Usage - called on the class name
val user = User.fromEmail("alice@example.com")
println(user.name)  // "alice"

val guest = User.guest()
println(guest.name)  // "Guest"
```

### Named Companion Objects

If the companion object has a name, use that name instead of `Companion`:

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

// Usage
val logger = Logger.createWithPrefix("APP")
```

### Practical Example: JSON Parsing

Companion object extensions are often used for parsing or deserialization:

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
    // Simplified parsing - in reality you'd use a JSON library
    val id = Regex("\"id\":\\s*(\\d+)").find(json)?.groupValues?.get(1)?.toInt() ?: 0
    val name = Regex("\"name\":\\s*\"([^\"]+)\"").find(json)?.groupValues?.get(1) ?: ""
    val price = Regex("\"price\":\\s*([\\d.]+)").find(json)?.groupValues?.get(1)?.toDouble() ?: 0.0
    return Product(id, name, price)
}

// Usage
val productMap = mapOf("id" to 1, "name" to "Widget", "price" to 9.99)
val product = Product.fromMap(productMap)
println(product)  // Product(id=1, name=Widget, price=9.99)
```

## Generic Extensions

Extension functions can be generic, allowing you to create reusable extensions that work with multiple types.

### Basic Generic Extensions

```kotlin
// Generic extension on any type
fun <T> T.toSingletonList(): List<T> {
    return listOf(this)
}

// Generic extension with constraints
fun <T : Comparable<T>> List<T>.isSorted(): Boolean {
    return this.zipWithNext().all { (a, b) -> a <= b }
}

// Usage
val number = 42.toSingletonList()       // [42]
val string = "Hello".toSingletonList()  // ["Hello"]

val sorted = listOf(1, 2, 3, 4, 5)
val unsorted = listOf(3, 1, 4, 1, 5)
println(sorted.isSorted())    // true
println(unsorted.isSorted())  // false
```

### Multiple Type Parameters

```kotlin
// Transform a pair
fun <A, B, C> Pair<A, B>.mapFirst(transform: (A) -> C): Pair<C, B> {
    return Pair(transform(this.first), this.second)
}

fun <A, B, C> Pair<A, B>.mapSecond(transform: (B) -> C): Pair<A, C> {
    return Pair(this.first, transform(this.second))
}

// Combine two lists with a transform
fun <T, R, V> List<T>.zipWith(other: List<R>, transform: (T, R) -> V): List<V> {
    return this.zip(other).map { (a, b) -> transform(a, b) }
}

// Usage
val pair = 1 to "hello"
println(pair.mapFirst { it * 2 })      // (2, hello)
println(pair.mapSecond { it.length })  // (1, 5)

val nums = listOf(1, 2, 3)
val strs = listOf("a", "b", "c")
println(nums.zipWith(strs) { n, s -> "$s$n" })  // [a1, b2, c3]
```

### Reified Type Parameters

Using `inline` and `reified` allows access to type information at runtime:

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

// Usage
val value: Any = "Hello"
println(value.isType<String>())  // true
println(value.isType<Int>())     // false

val mixed = listOf(1, "two", 3, "four", 5.0)
println(mixed.filterIsInstanceTo<String>())  // [two, four]
println(mixed.countInstancesOf<Int>())       // 2
```

### Generic Extensions with Nullable Bounds

```kotlin
// Extension that works with any nullable type
fun <T : Any> T?.ifNotNull(action: (T) -> Unit) {
    if (this != null) {
        action(this)
    }
}

// Transform or provide default
fun <T, R> T?.letOrDefault(default: R, transform: (T) -> R): R {
    return if (this != null) transform(this) else default
}

// Usage
val name: String? = "Alice"
name.ifNotNull { println("Name is $it") }  // "Name is Alice"

val nullName: String? = null
nullName.ifNotNull { println("This won't print") }

val length = name.letOrDefault(0) { it.length }  // 5
val nullLength = nullName.letOrDefault(0) { it.length }  // 0
```

## Member vs Extension Functions

Understanding the difference between member functions and extension functions is crucial for writing predictable code.

### Resolution Order: Members Win

When a class has a member function with the same signature as an extension function, the member function always takes precedence:

```kotlin
class Example {
    fun greet() = "Hello from member"
}

fun Example.greet() = "Hello from extension"

val example = Example()
println(example.greet())  // "Hello from member"
```

This behavior ensures that adding extension functions cannot accidentally change the behavior of existing code.

### Different Signatures

If signatures differ, both member and extension functions can coexist:

```kotlin
class Calculator {
    fun add(a: Int, b: Int): Int = a + b
}

// Different signature - works as extension
fun Calculator.add(a: Int, b: Int, c: Int): Int = a + b + c

val calc = Calculator()
println(calc.add(1, 2))     // 3 (member)
println(calc.add(1, 2, 3))  // 6 (extension)
```

### Static Dispatch vs Dynamic Dispatch

Extension functions are resolved statically based on the declared type, not the runtime type. This is a key difference from virtual member functions:

```kotlin
open class Animal {
    open fun speak() = "Some sound"
}

class Dog : Animal() {
    override fun speak() = "Bark"
}

// Extension functions
fun Animal.describe() = "This is an animal"
fun Dog.describe() = "This is a dog"

fun printDescription(animal: Animal) {
    println(animal.speak())     // Dynamic dispatch
    println(animal.describe())  // Static dispatch
}

val dog = Dog()
printDescription(dog)
// Output:
// Bark           (dynamic - uses Dog.speak())
// This is an animal  (static - uses Animal.describe())
```

### Accessing Private Members

Extension functions cannot access private or protected members of the receiver class. They only have access to public and internal members:

```kotlin
class Secret {
    private val privateValue = "secret"
    internal val internalValue = "internal"
    val publicValue = "public"
}

fun Secret.tryAccess(): String {
    // return privateValue   // Error: Cannot access 'privateValue'
    // return internalValue  // OK if in same module
    return publicValue       // OK
}
```

### When to Use Extensions vs Members

Use extension functions when:
- You cannot modify the class (third-party library, standard library)
- The functionality is not core to the class's responsibility
- You want to add domain-specific operations without cluttering the class
- You want to organize utility functions by context

Use member functions when:
- The functionality is central to the class's purpose
- You need access to private state
- You need polymorphic behavior (overriding in subclasses)
- The function should be visible to all users of the class

## Scope and Visibility

Extension functions follow Kotlin's standard visibility rules and must be imported when defined in a different package.

### Importing Extensions

```kotlin
// File: StringExtensions.kt
package com.example.utils

fun String.reverse(): String = this.reversed()
fun String.isPalindrome(): Boolean = this == this.reversed()
```

```kotlin
// File: Main.kt
package com.example.app

// Import specific extensions
import com.example.utils.reverse
import com.example.utils.isPalindrome

// Or import all extensions from the package
import com.example.utils.*

fun main() {
    println("hello".reverse())       // "olleh"
    println("radar".isPalindrome())  // true
}
```

### Visibility Modifiers

Extension functions can have visibility modifiers:

```kotlin
// Public - accessible everywhere (default)
fun String.publicExtension() = this

// Internal - accessible within the same module
internal fun String.internalExtension() = this

// Private - accessible within the same file only
private fun String.privateExtension() = this
```

### Local Extensions

Extensions can be defined locally within a function:

```kotlin
fun processStrings(strings: List<String>): List<String> {
    // Local extension - only available within this function
    fun String.process(): String {
        return this.trim().lowercase().replace(" ", "_")
    }

    return strings.map { it.process() }
}

val result = processStrings(listOf("Hello World", "  KOTLIN  "))
println(result)  // [hello_world, kotlin]
```

### Extensions in Classes

Extensions can be declared inside a class, making them available only within that class:

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

// "hello".process()  // Error: Extension not accessible outside the class
```

## Best Practices

### Keep Extensions Focused

Each extension should do one thing well:

```kotlin
// Good: Focused, single-purpose extensions
fun String.removeWhitespace(): String = this.replace("\\s".toRegex(), "")
fun String.countWords(): Int = this.split("\\s+".toRegex()).size

// Avoid: Extensions that do too much
fun String.processAndValidateAndFormat(): String {
    // Too many responsibilities
    return this
}
```

### Name Extensions Clearly

Extension names should clearly indicate what they do:

```kotlin
// Good: Clear, descriptive names
fun List<Int>.sumOfSquares(): Int = this.sumOf { it * it }
fun String.toTitleCase(): String = this.split(" ").joinToString(" ") {
    it.replaceFirstChar { c -> c.uppercase() }
}

// Avoid: Vague or ambiguous names
fun String.process(): String = this.trim()  // What kind of processing?
fun List<Int>.calc(): Int = this.sum()      // What calculation?
```

### Document Complex Extensions

Add documentation for extensions with non-obvious behavior:

```kotlin
/**
 * Returns the element at the given index, wrapping around if the index
 * exceeds the list bounds. Supports negative indices for accessing
 * elements from the end of the list.
 *
 * @param index The index to access, can be negative or exceed list size
 * @return The element at the wrapped index
 * @throws NoSuchElementException if the list is empty
 */
fun <T> List<T>.getWrapped(index: Int): T {
    if (this.isEmpty()) throw NoSuchElementException("List is empty")
    val wrappedIndex = ((index % this.size) + this.size) % this.size
    return this[wrappedIndex]
}
```

### Avoid Shadowing Standard Library Functions

Do not create extensions that shadow well-known standard library functions with different behavior:

```kotlin
// Avoid: Shadowing standard library with different behavior
fun String.reversed(): String = this  // Confusing! Returns same string

// Better: Use a distinct name
fun String.reversedWords(): String = this.split(" ").reversed().joinToString(" ")
```

### Organize Extensions by Domain

Group related extensions in files or packages organized by domain:

```kotlin
// File: DateExtensions.kt
package com.example.extensions.dates

fun Long.toFormattedDate(): String { /* ... */ }
fun String.parseDate(): Long { /* ... */ }

// File: StringExtensions.kt
package com.example.extensions.strings

fun String.toSlug(): String { /* ... */ }
fun String.truncate(maxLength: Int): String { /* ... */ }

// File: CollectionExtensions.kt
package com.example.extensions.collections

fun <T> List<T>.randomOrNull(): T? { /* ... */ }
fun <K, V> Map<K, V>.getOrThrow(key: K): V { /* ... */ }
```

## Real-World Examples

### Building a Fluent API

Extension functions enable fluent, readable APIs:

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

// Usage
val query = QueryBuilder("users")
    .select("id", "name", "email")
    .where("age > 18")
    .orderBy("name")
    .limit(10)
    .toSql()

println(query)
// SELECT id, name, email FROM users WHERE age > 18 ORDER BY name ASC LIMIT 10
```

### Android View Extensions

Extensions are commonly used in Android development:

```kotlin
// View visibility extensions
fun View.show() {
    this.visibility = View.VISIBLE
}

fun View.hide() {
    this.visibility = View.GONE
}

fun View.invisible() {
    this.visibility = View.INVISIBLE
}

// Toast extension
fun Context.showToast(message: String, duration: Int = Toast.LENGTH_SHORT) {
    Toast.makeText(this, message, duration).show()
}

// EditText extensions
fun EditText.textString(): String = this.text.toString()

fun EditText.isEmpty(): Boolean = this.text.isNullOrEmpty()

// Usage in Activity
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

### Validation Extensions

Create a validation framework using extensions:

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

// Usage
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

### Functional Programming Extensions

Enhance functional programming capabilities:

```kotlin
// Result type extensions
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

// Sequence extensions
fun <T> Sequence<T>.takeWhileInclusive(predicate: (T) -> Boolean): Sequence<T> {
    var shouldContinue = true
    return this.takeWhile {
        val result = shouldContinue
        shouldContinue = predicate(it)
        result
    }
}

// Composition
infix fun <A, B, C> ((B) -> C).compose(other: (A) -> B): (A) -> C {
    return { a -> this(other(a)) }
}

infix fun <A, B, C> ((A) -> B).andThen(other: (B) -> C): (A) -> C {
    return { a -> other(this(a)) }
}

// Usage
val addOne: (Int) -> Int = { it + 1 }
val double: (Int) -> Int = { it * 2 }

val addThenDouble = addOne andThen double
val doubleThenAdd = addOne compose double

println(addThenDouble(5))  // 12  ((5 + 1) * 2)
println(doubleThenAdd(5))  // 11  ((5 * 2) + 1)
```

## Summary

Extension functions are a cornerstone of idiomatic Kotlin programming. They provide a powerful mechanism for enhancing existing types with new functionality while maintaining clean, readable code. Key takeaways include:

- **Extension Functions** add new functions to existing classes without modifying them. They use the receiver type syntax (`fun ReceiverType.functionName()`) and are compiled to static methods.

- **Extension Properties** work similarly to extension functions but provide property syntax. They cannot have backing fields and must use getters (and setters for mutable properties).

- **Nullable Receivers** allow extensions to be defined on nullable types, enabling null-safe operations and eliminating the need for safe calls in many scenarios.

- **Companion Object Extensions** add what appear to be static methods to classes, useful for factory functions and utility methods that logically belong to a class.

- **Generic Extensions** make extensions reusable across multiple types, with support for type constraints and reified type parameters for runtime type access.

- **Member vs Extension Resolution** follows a simple rule: member functions always win when signatures match. Extensions are resolved statically based on the declared type.

- **Best Practices** include keeping extensions focused, using clear names, documenting complex behavior, and organizing extensions by domain.

Extension functions transform how you interact with existing code, allowing you to create expressive, domain-specific APIs and utility functions that feel native to the types they extend. Master this feature, and you will write more readable, maintainable, and elegant Kotlin code.
