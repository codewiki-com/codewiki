---
title: 作用域函数
description: Kotlin作用域函数完全指南，let、run、with、apply与also
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - Kotlin
  - 作用域函数
  - let
  - apply
status: imported
origin: old/src/content/docs/kotlin/scope-functions.en.md
divergence: 0.198
issues:
  - title-lang-en
  - title-language
legacy:
  category: Kotlin
  subcategory: 语言特性
  order: 5
  lastUpdated: 2026-01-07
---

Scope Functions are one of the most distinctive features in the Kotlin standard library. They allow you to execute a block of code within the context of an object, making your code more concise and expressive. Kotlin provides five scope functions: `let`, `run`, `with`, `apply`, and `also`.

## What Are Scope Functions

The core idea behind scope functions is this: when you call these functions on an object, they create a temporary scope. Within this scope, you can access the object without using its name.

```kotlin
// Without scope functions
val person = Person()
person.name = "John"
person.age = 25
person.city = "New York"
println(person)

// Using the apply scope function
val person = Person().apply {
    name = "John"
    age = 25
    city = "New York"
}.also { println(it) }
```

## Differences Between the Five Scope Functions

Each scope function has two main distinguishing characteristics:

1. **How the context object is referenced**: `this` or `it`
2. **Return value**: The context object itself or the result of the lambda expression

| Function | Object Reference | Return Value | Is Extension Function |
|----------|------------------|--------------|----------------------|
| `let` | `it` | Lambda result | Yes |
| `run` | `this` | Lambda result | Yes |
| `with` | `this` | Lambda result | No (takes object as argument) |
| `apply` | `this` | Context object | Yes |
| `also` | `it` | Context object | Yes |

## The let Function

The `let` function uses `it` to reference the context object and returns the result of the lambda expression. It is ideal for handling nullable types and chain calls.

### Basic Syntax

```kotlin
public inline fun <T, R> T.let(block: (T) -> R): R
```

### Use Cases

#### Null-safe Calls

```kotlin
val name: String? = "Kotlin"

// Traditional approach
if (name != null) {
    println("Name length: ${name.length}")
}

// Using let
name?.let {
    println("Name length: ${it.length}")
}

// Inside let, it is non-null
name?.let { nonNullName ->
    println("Name length: ${nonNullName.length}")
}
```

#### Introducing Expression Results into Local Scope

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

numbers.filter { it > 2 }.let { filtered ->
    println("Filtered list: $filtered")
    println("Element count: ${filtered.size}")
}

// Avoid polluting outer scope with intermediate variables
val result = numbers.map { it * 2 }
    .filter { it > 5 }
    .let { list ->
        list.sum() / list.size
    }
println("Average: $result")
```

#### Chain Transformations

```kotlin
data class User(val name: String, val email: String)
data class UserDTO(val displayName: String, val contact: String)

fun getUserFromDb(id: Int): User? = User("John", "john@example.com")

val userDTO = getUserFromDb(1)?.let { user ->
    UserDTO(
        displayName = user.name.uppercase(),
        contact = user.email
    )
}
```

### Practical Examples

```kotlin
// Processing network request results
fun processResponse(response: Response?) {
    response?.let { res ->
        when (res.code) {
            200 -> parseData(res.body)
            404 -> showError("Resource not found")
            else -> showError("Unknown error: ${res.code}")
        }
    } ?: showError("Response is null")
}

// String processing
val input = "  Hello Kotlin  "
val processed = input.let {
    it.trim()
}.let {
    it.lowercase()
}.let {
    it.replace("kotlin", "World")
}
println(processed) // Output: hello world
```

## The run Function

The `run` function uses `this` to reference the context object and returns the result of the lambda expression. It combines the ability to configure an object and compute a result.

### Basic Syntax

```kotlin
// Extension function form
public inline fun <T, R> T.run(block: T.() -> R): R

// Non-extension function form
public inline fun <R> run(block: () -> R): R
```

### Use Cases

#### Configure Object and Return Result

```kotlin
class DatabaseConfig {
    var host: String = ""
    var port: Int = 0
    var database: String = ""

    fun connectionString() = "jdbc:mysql://$host:$port/$database"
}

val connectionString = DatabaseConfig().run {
    host = "localhost"
    port = 3306
    database = "myapp"
    connectionString() // Returns connection string
}
println(connectionString)
```

#### Running Statement Blocks Where Expressions Are Needed

```kotlin
// Non-extension function form of run
val hexColor = run {
    val red = 255
    val green = 128
    val blue = 0
    String.format("#%02X%02X%02X", red, green, blue)
}
println(hexColor) // Output: #FF8000
```

#### Null-safe Calls and Return Result

```kotlin
data class Service(val url: String, val port: Int) {
    fun connect(): Connection = Connection(this)
}

data class Connection(val service: Service) {
    fun query(sql: String): List<String> = listOf("result1", "result2")
}

val service: Service? = Service("api.example.com", 8080)

val results = service?.run {
    connect().query("SELECT * FROM users")
} ?: emptyList()
```

### Choosing Between run and let

```kotlin
data class Person(var name: String, var age: Int)

val person = Person("John", 25)

// Using run - more concise when frequently accessing object properties
person.run {
    println("Name: $name")  // Direct access, no need for it.name
    println("Age: $age")
    "$name, $age years old"
}

// Using let - when you need to clearly distinguish the context object
person.let {
    println("Name: ${it.name}")
    println("Age: ${it.age}")
    "${it.name}, ${it.age} years old"
}
```

## The with Function

`with` is a non-extension function that takes the context object as an argument. Inside the lambda, you reference the object using `this`.

### Basic Syntax

```kotlin
public inline fun <T, R> with(receiver: T, block: T.() -> R): R
```

### Use Cases

#### Calling Multiple Functions on the Same Object

```kotlin
data class Canvas(var width: Int = 0, var height: Int = 0) {
    fun setBackground(color: String) = println("Background color: $color")
    fun drawLine(x1: Int, y1: Int, x2: Int, y2: Int) =
        println("Draw line: ($x1,$y1) -> ($x2,$y2)")
    fun drawCircle(x: Int, y: Int, radius: Int) =
        println("Draw circle: center($x,$y), radius $radius")
}

val canvas = Canvas()
with(canvas) {
    width = 800
    height = 600
    setBackground("#FFFFFF")
    drawLine(0, 0, 100, 100)
    drawCircle(400, 300, 50)
}
```

#### Using Helper Object to Compute Results

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

val stats = with(numbers) {
    """
    List: $this
    Size: $size
    Min: ${minOrNull()}
    Max: ${maxOrNull()}
    Average: ${average()}
    Sum: ${sum()}
    """.trimIndent()
}
println(stats)
```

#### Building Strings

```kotlin
fun buildReport(title: String, items: List<String>): String {
    return with(StringBuilder()) {
        appendLine("====== $title ======")
        appendLine()
        items.forEachIndexed { index, item ->
            appendLine("${index + 1}. $item")
        }
        appendLine()
        appendLine("Total: ${items.size} items")
        toString()
    }
}

val report = buildReport("Task List", listOf("Learn Kotlin", "Write code", "Test"))
println(report)
```

### Important Notes About with

```kotlin
// with is not suitable for nullable objects
val nullableList: List<Int>? = listOf(1, 2, 3)

// Not recommended
with(nullableList) {
    this?.forEach { println(it) }  // Requires null-safe call
}

// Recommended: use let or run
nullableList?.let { list ->
    list.forEach { println(it) }
}
```

## The apply Function

The `apply` function uses `this` to reference the context object and **returns the object itself**. It is the preferred function for object configuration.

### Basic Syntax

```kotlin
public inline fun <T> T.apply(block: T.() -> Unit): T
```

### Use Cases

#### Object Initialization and Configuration

```kotlin
data class Request(
    var url: String = "",
    var method: String = "GET",
    var headers: MutableMap<String, String> = mutableMapOf(),
    var body: String? = null
)

val request = Request().apply {
    url = "https://api.example.com/users"
    method = "POST"
    headers["Content-Type"] = "application/json"
    headers["Authorization"] = "Bearer token123"
    body = """{"name": "John", "age": 25}"""
}
```

#### Alternative to Builder Pattern

```kotlin
class AlertDialog {
    var title: String = ""
    var message: String = ""
    var positiveButton: String = ""
    var negativeButton: String = ""
    var onPositiveClick: (() -> Unit)? = null
    var onNegativeClick: (() -> Unit)? = null

    fun show() {
        println("Showing dialog:")
        println("Title: $title")
        println("Content: $message")
        println("Confirm button: $positiveButton")
        println("Cancel button: $negativeButton")
    }
}

val dialog = AlertDialog().apply {
    title = "Confirm Delete"
    message = "Are you sure you want to delete this record?"
    positiveButton = "OK"
    negativeButton = "Cancel"
    onPositiveClick = { println("Executing delete") }
    onNegativeClick = { println("Canceling operation") }
}.also { it.show() }
```

#### Chain Configuration

```kotlin
class TextView {
    var text: String = ""
    var textSize: Float = 14f
    var textColor: String = "#000000"
    var backgroundColor: String = "#FFFFFF"
    var padding: Int = 0
}

fun createStyledTextView(content: String) = TextView().apply {
    text = content
    textSize = 16f
    textColor = "#333333"
    backgroundColor = "#F5F5F5"
    padding = 16
}
```

### Practical Application Example

```kotlin
// Android-style View configuration
class RecyclerView {
    var adapter: Any? = null
    var layoutManager: Any? = null
    var itemDecoration: Any? = null

    fun setHasFixedSize(fixed: Boolean) {}
}

class LinearLayoutManager(val orientation: String)
class DividerItemDecoration

fun setupRecyclerView(): RecyclerView {
    return RecyclerView().apply {
        layoutManager = LinearLayoutManager("vertical")
        adapter = MyAdapter()
        itemDecoration = DividerItemDecoration()
        setHasFixedSize(true)
    }
}

class MyAdapter
```

## The also Function

The `also` function uses `it` to reference the context object and **returns the object itself**. It is suitable for performing additional operations that don't modify the object.

### Basic Syntax

```kotlin
public inline fun <T> T.also(block: (T) -> Unit): T
```

### Use Cases

#### Performing Additional Actions (like logging)

```kotlin
fun generateToken(): String {
    return UUID.randomUUID().toString()
        .also { println("Generated Token: $it") }
}

fun fetchUser(id: Int): User {
    return database.findUser(id)
        .also { user -> logger.info("Fetched user: ${user.name}") }
}
```

#### Debugging and Validation

```kotlin
val numbers = mutableListOf(1, 2, 3)

numbers
    .also { println("Initial list: $it") }
    .add(4)

numbers
    .also { println("After adding 4: $it") }
    .removeAt(0)

println("Final list: $numbers")
```

#### Intermediate Operations in Chain Calls

```kotlin
data class Order(
    var items: MutableList<String> = mutableListOf(),
    var total: Double = 0.0,
    var status: String = "pending"
)

fun processOrder(order: Order): Order {
    return order
        .also { it.items.add("Packaging service") }
        .also { it.total += 5.0 }
        .also { it.status = "processing" }
        .also { sendNotification(it) }
}

fun sendNotification(order: Order) {
    println("Sending notification: Order status updated to ${order.status}")
}
```

### Choosing Between also and apply

```kotlin
data class User(var name: String, var email: String)

// apply - configure object properties
val user1 = User("", "").apply {
    name = "John"
    email = "john@example.com"
}

// also - perform additional operations without directly modifying properties
val user2 = User("Jane", "jane@example.com").also {
    validateEmail(it.email)
    saveToDatabase(it)
    println("Created user: ${it.name}")
}

fun validateEmail(email: String) = require(email.contains("@"))
fun saveToDatabase(user: User) = println("Saving user to database")
```

## Chaining Scope Functions

Scope functions can be combined to create fluent processing chains.

### Common Combination Patterns

```kotlin
data class User(
    var id: Int = 0,
    var name: String = "",
    var email: String = "",
    var isActive: Boolean = false
)

// apply + also combination
fun createUser(name: String, email: String): User {
    return User()
        .apply {
            this.name = name
            this.email = email
            this.isActive = true
        }
        .also {
            println("User created successfully: ${it.name}")
            audit("User creation", it)
        }
}

fun audit(action: String, user: User) {
    println("Audit log: $action - ${user.name}")
}
```

### let + apply Combination

```kotlin
data class Config(
    var apiUrl: String = "",
    var timeout: Int = 0,
    var retryCount: Int = 0
)

fun loadConfig(path: String): Config? {
    // Simulate loading config from file
    return if (path.isNotEmpty()) Config() else null
}

fun initializeApp(configPath: String) {
    loadConfig(configPath)?.let { config ->
        config.apply {
            if (apiUrl.isEmpty()) apiUrl = "https://default.api.com"
            if (timeout == 0) timeout = 30000
            if (retryCount == 0) retryCount = 3
        }
    }?.also {
        println("App config: ${it.apiUrl}, timeout: ${it.timeout}ms")
    } ?: println("Config load failed, using default config")
}
```

### Complex Data Processing Chain

```kotlin
data class Product(
    val id: Int,
    val name: String,
    val price: Double,
    val category: String
)

data class CartItem(
    val product: Product,
    var quantity: Int,
    var discount: Double = 0.0
)

fun processCart(items: List<CartItem>?): String {
    return items
        ?.filter { it.quantity > 0 }
        ?.also { println("Valid items count: ${it.size}") }
        ?.map { item ->
            item.apply {
                if (quantity >= 10) discount = 0.1
                if (quantity >= 50) discount = 0.2
            }
        }
        ?.also { items ->
            items.forEach { println("${it.product.name}: ${it.discount * 100}% discount") }
        }
        ?.let { cartItems ->
            val total = cartItems.sumOf {
                it.product.price * it.quantity * (1 - it.discount)
            }
            "Total: $%.2f".format(total)
        }
        ?: "Cart is empty"
}
```

## Null Safety and Scope Functions

Scope functions are very useful when dealing with nullable types.

### Safe Call Patterns

```kotlin
data class Address(val city: String, val street: String)
data class Company(val name: String, val address: Address?)
data class Employee(val name: String, val company: Company?)

fun getEmployeeCity(employee: Employee?): String {
    return employee?.company?.address?.let { address ->
        "Employee ${employee.name} works in ${address.city}"
    } ?: "Unknown location"
}

// Using run approach
fun getEmployeeCityWithRun(employee: Employee?): String {
    return employee?.run {
        company?.address?.run {
            "Employee $name works in $city"
        }
    } ?: "Unknown location"
}
```

### Combining with Elvis Operator

```kotlin
fun processNullableString(input: String?): String {
    return input?.let { str ->
        str.trim().takeIf { it.isNotEmpty() }
    }?.let { trimmed ->
        trimmed.uppercase()
    } ?: "Default value"
}

// More concise approach
fun processNullableStringSimple(input: String?): String {
    return input
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.uppercase()
        ?: "Default value"
}
```

### takeIf and takeUnless

These two functions work well in combination with scope functions.

```kotlin
fun validateAndProcess(value: Int?): String {
    return value
        ?.takeIf { it > 0 }
        ?.let { "Valid value: $it" }
        ?: "Invalid value"
}

fun findActiveUser(users: List<User>): User? {
    return users
        .firstOrNull()
        ?.takeIf { it.isActive }
        ?.also { println("Found active user: ${it.name}") }
}

// takeUnless - returns object when condition is false
fun getNonEmptyList(list: List<Int>): List<Int>? {
    return list.takeUnless { it.isEmpty() }
}
```

## Choosing the Right Scope Function

### Decision Guide

```kotlin
// 1. Need to configure an object?
//    -> Use apply (when you don't need a return value)
val config = Config().apply {
    host = "localhost"
    port = 8080
}

// 2. Need to configure and return a result?
//    -> Use run
val connection = Config().run {
    host = "localhost"
    port = 8080
    createConnection() // Returns Connection
}

// 3. Processing nullable object with transformation?
//    -> Use let
val length = nullableString?.let { it.length }

// 4. Grouping function calls on non-null object?
//    -> Use with
with(canvas) {
    drawRect(0, 0, 100, 100)
    drawCircle(50, 50, 25)
}

// 5. Executing side effects while keeping object unchanged?
//    -> Use also
val user = createUser()
    .also { logger.info("Created: $it") }
```

### Complete Comparison Example

```kotlin
data class Person(var name: String = "", var age: Int = 0)

fun main() {
    val person = Person()

    // let: transform and return result
    val nameLength = person.let {
        it.name = "John"
        it.name.length  // Returns length
    }

    // run: configure and return result
    val description = person.run {
        age = 25
        "$name, $age years old"  // Returns description
    }

    // with: grouped function calls on object
    val info = with(person) {
        "Name: $name, Age: $age"
    }

    // apply: configure and return object
    val configured = person.apply {
        name = "Jane"
        age = 30
    }  // Returns person

    // also: additional operations and return object
    val logged = person.also {
        println("Current: ${it.name}, ${it.age}")
    }  // Returns person
}
```

## Performance Considerations

All scope functions are inline functions, which means at compile time, the lambda expression is inlined at the call site, resulting in no additional object allocation or method call overhead.

```kotlin
// Before compilation
val result = "Hello".let { it.length }

// After compilation (conceptually)
val temp = "Hello"
val result = temp.length
```

## Best Practices

### Avoid Excessive Nesting

```kotlin
// Not recommended - too deeply nested
obj?.let { a ->
    a.process()?.let { b ->
        b.transform()?.let { c ->
            c.finalize()
        }
    }
}

// Recommended - use chain calls
obj?.process()
    ?.transform()
    ?.finalize()
```

### Choose the Appropriate Function

```kotlin
// Not recommended - using let to configure object
val view = TextView().let {
    it.text = "Hello"
    it.textSize = 16f
    it
}

// Recommended - use apply to configure object
val view = TextView().apply {
    text = "Hello"
    textSize = 16f
}
```

### Keep Lambdas Concise

```kotlin
// Not recommended - lambda too long
obj.apply {
    // 50 lines of configuration code...
}

// Recommended - extract to function
obj.apply(::configure)

fun configure(obj: MyObject) {
    // Configuration logic
}
```

### Name Lambda Parameters for Readability

```kotlin
// When context is unclear, name the it parameter
users.firstOrNull()?.let { user ->
    orders.filter { order -> order.userId == user.id }
}
```

## Summary

Kotlin's scope functions are powerful and flexible tools that can make your code more concise and expressive. The key is understanding each function's characteristics:

- **let**: Uses `it` reference, returns lambda result, suitable for null-safe calls and transformations
- **run**: Uses `this` reference, returns lambda result, suitable for object configuration with computed results
- **with**: Non-extension function, uses `this` reference, suitable for grouped function calls on an object
- **apply**: Uses `this` reference, returns the object itself, suitable for object initialization and configuration
- **also**: Uses `it` reference, returns the object itself, suitable for performing additional operations

With practice, these functions help you write more idiomatic Kotlin code.
