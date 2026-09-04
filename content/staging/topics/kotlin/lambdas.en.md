---
title: Lambda 表达式
description: Kotlin Lambda 表达式深入解析：语法、it 关键字、尾随 Lambda、函数类型与内联函数
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - Kotlin
  - Lambda
  - 高阶函数
  - 内联函数
  - 函数式编程
status: imported
origin: old/src/content/docs/kotlin/lambdas.en.md
divergence: 0.19
issues:
  - title-lang-en
  - title-language
legacy:
  category: Kotlin
  subcategory: 函数式编程
  order: 6
  lastUpdated: 2026-01-07
---

Lambda expressions are the core building blocks of functional programming in Kotlin. They provide a concise way to represent functions that can be passed as values. Understanding lambda expressions is crucial for writing elegant, concise Kotlin code - whether you're working with collection operations, scope functions, or building DSLs, lambdas are everywhere.

## Concept Explanation

### What is a Lambda Expression

A lambda expression (also known as an anonymous function) is a function without a name that can be passed directly as an expression. It essentially implements "code as data," making functions first-class citizens.

```kotlin
// Regular function
fun double(x: Int): Int {
    return x * 2
}

// Equivalent lambda expression
val double: (Int) -> Int = { x: Int -> x * 2 }

// Simplified form
val double = { x: Int -> x * 2 }
```

### Historical Background of Lambda

Lambda expressions originated from Lambda Calculus, proposed by Alonzo Church in the 1930s. This is a formal system for studying function definition, function application, and recursion. Lambda expressions in modern programming languages are practical applications of this mathematical concept.

Kotlin was designed from the beginning with lambda as a core language feature, drawing from the experiences of Java 8, Scala, and other languages, while introducing unique syntactic sugar like trailing lambdas and the `it` keyword, making lambda usage more natural and fluent.

### Problems Lambda Solves

1. **Reducing boilerplate code**: Replaces anonymous inner classes, reducing redundant code
2. **Supporting functional programming**: Allows functions to be passed and returned as values
3. **Improving code expressiveness**: Uses declarative style to express "what to do" rather than "how to do it"
4. **Deferred execution**: Encapsulates computation logic to be executed when needed

```kotlin
// Java style (anonymous inner class)
button.setOnClickListener(object : View.OnClickListener {
    override fun onClick(v: View) {
        println("Button clicked")
    }
})

// Kotlin Lambda
button.setOnClickListener { println("Button clicked") }
```

## Core Principles

### Internal Structure of Lambda

In Kotlin, every lambda expression is converted at compile time into an implementation of a `Function` interface. The Kotlin standard library defines a series of `FunctionN` interfaces:

```kotlin
// Function interfaces in Kotlin standard library
interface Function0<out R> : Function<R> {
    operator fun invoke(): R
}

interface Function1<in P1, out R> : Function<R> {
    operator fun invoke(p1: P1): R
}

interface Function2<in P1, in P2, out R> : Function<R> {
    operator fun invoke(p1: P1, p2: P2): R
}
// ... up to Function22
```

When you write a lambda, the compiler generates an anonymous class implementing the corresponding `FunctionN` interface:

```kotlin
// Source code
val sum = { a: Int, b: Int -> a + b }

// After compilation (conceptually)
val sum = object : Function2<Int, Int, Int> {
    override fun invoke(a: Int, b: Int): Int = a + b
}
```

### Closure Mechanism

Lambda expressions can capture variables from their defining scope - this is called a closure. Unlike Java, Kotlin lambdas can capture and modify external variables:

```kotlin
fun createCounter(): () -> Int {
    var count = 0
    return {
        count++  // Captures and modifies external variable
        count
    }
}

val counter = createCounter()
println(counter()) // 1
println(counter()) // 2
println(counter()) // 3
```

The implementation of closures works by wrapping captured variables in a holder object:

```kotlin
// Source code
fun example() {
    var x = 10
    val lambda = { println(x) }
    x = 20
    lambda() // Outputs 20
}

// After compilation (conceptually)
fun example() {
    val x = Ref<Int>()
    x.element = 10
    val lambda = { println(x.element) }
    x.element = 20
    lambda()
}
```

### The Nature of Function Types

Function types in Kotlin are special types that describe the signature of a function:

```kotlin
// Function type syntax
(ParameterTypes) -> ReturnType

// Examples
val action: () -> Unit                    // No parameters, no return value
val predicate: (Int) -> Boolean           // One Int parameter, returns Boolean
val transformer: (String, Int) -> String  // Two parameters, returns String
val factory: () -> List<String>           // No parameters, returns List<String>

// Function type with receiver
val builderAction: StringBuilder.() -> Unit
```

## Key Points

### Basic Lambda Syntax

The complete syntax form of a lambda expression:

```kotlin
val lambda: (ParameterType) -> ReturnType = { parameterName: ParameterType ->
    // Function body
    returnValueExpression
}
```

Syntax essentials:
1. Lambda is always surrounded by curly braces `{}`
2. Parameter list comes before `->`
3. Function body comes after `->`
4. The value of the last expression serves as the return value

```kotlin
// Complete form
val sum: (Int, Int) -> Int = { a: Int, b: Int -> a + b }

// Type inference, omitting parameter types in lambda
val sum: (Int, Int) -> Int = { a, b -> a + b }

// Type inference, omitting variable type annotation
val sum = { a: Int, b: Int -> a + b }

// Multi-line lambda
val process = { x: Int ->
    val doubled = x * 2
    val squared = doubled * doubled
    squared  // Return value
}
```

### The it Keyword

When a lambda has only one parameter, you can omit the parameter declaration and `->`, using the implicit parameter name `it`:

```kotlin
// Explicit parameter
val square: (Int) -> Int = { x -> x * x }

// Using it
val square: (Int) -> Int = { it * it }

// Practical applications
val numbers = listOf(1, 2, 3, 4, 5)
numbers.filter { it > 2 }           // Filter elements greater than 2
numbers.map { it * 2 }              // Multiply each element by 2
numbers.forEach { println(it) }     // Print each element
```

Use cases and limitations of `it`:

```kotlin
// Appropriate cases for using it
list.filter { it.isNotEmpty() }
list.map { it.uppercase() }

// Cases where named parameters should be used
// 1. When lambdas are nested
list.flatMap { outer ->
    other.map { inner ->
        outer + inner  // Use named parameters to avoid confusion
    }
}

// 2. When parameter meaning is not obvious
users.sortedBy { user -> user.age }  // Clearer than it.age

// 3. When lambda body is long
data.process { item ->
    val validated = validate(item)
    val transformed = transform(validated)
    store(transformed)
    transformed
}
```

### Trailing Lambda

When the last parameter of a function is a lambda, the lambda can be placed outside the parentheses:

```kotlin
// Standard syntax
list.fold(0, { acc, i -> acc + i })

// Trailing lambda
list.fold(0) { acc, i -> acc + i }

// When lambda is the only parameter, parentheses can be omitted
list.forEach { println(it) }

// Equivalent to
list.forEach({ println(it) })
```

This syntax makes code look more like built-in language constructs:

```kotlin
// Looks like a control structure
repeat(3) {
    println("Hello!")
}

// DSL style
html {
    head {
        title("My Page")
    }
    body {
        p("Hello, World!")
    }
}
```

### Function Types in Detail

Complete forms and variants of function types:

```kotlin
// 1. Basic function type
val f1: (Int) -> Int = { it * 2 }

// 2. Multi-parameter function type
val f2: (Int, String) -> Boolean = { num, str -> str.length > num }

// 3. No-parameter function type
val f3: () -> String = { "Hello" }

// 4. Function type returning Unit
val f4: (String) -> Unit = { println(it) }

// 5. Nullable function type
val f5: ((Int) -> Int)? = null

// 6. Function type returning nullable value
val f6: (Int) -> Int? = { if (it > 0) it else null }

// 7. Function type with nullable parameter
val f7: (Int?) -> Int = { it ?: 0 }

// 8. Function type with receiver
val f8: Int.() -> Int = { this * 2 }

// 9. Suspend function type (coroutines)
val f9: suspend () -> String = { delay(1000); "Done" }
```

### Lambda with Receiver

Lambda with receiver allows you to directly access members of the receiver object inside the lambda:

```kotlin
// Function type with receiver
val greet: String.() -> String = { "Hello, $this!" }

// Calling methods
val result = "World".greet()  // "Hello, World!"
// or
val result = greet("World")   // "Hello, World!"
```

This is the foundation of Kotlin DSLs:

```kotlin
// HTML DSL example
class HTML {
    private val children = mutableListOf<String>()

    fun body(init: BODY.() -> Unit) {
        val body = BODY().apply(init)
        children.add(body.toString())
    }

    override fun toString() = children.joinToString("\n")
}

class BODY {
    private val content = StringBuilder()

    fun p(text: String) {
        content.append("<p>$text</p>")
    }

    override fun toString() = "<body>$content</body>"
}

fun html(init: HTML.() -> Unit): HTML = HTML().apply(init)

// Using the DSL
val page = html {
    body {
        p("Hello, World!")
    }
}
```

### Anonymous Functions

Besides lambda expressions, Kotlin also supports anonymous functions, which provide the ability to explicitly specify return types and use `return`:

```kotlin
// Lambda expression
val lambda = { x: Int -> x * 2 }

// Anonymous function
val anonymous = fun(x: Int): Int { return x * 2 }

// Shorthand form of anonymous function
val anonymous = fun(x: Int) = x * 2
```

Differences between lambda and anonymous functions:

```kotlin
// 1. Different return behavior
listOf(1, 2, 3).forEach {
    if (it == 2) return  // Returns from the outer function! Not from lambda
    println(it)
}

listOf(1, 2, 3).forEach(fun(value) {
    if (value == 2) return  // Only returns from the anonymous function
    println(value)
})

// 2. Anonymous functions can explicitly specify return type
val parser = fun(s: String): Int? {
    return s.toIntOrNull()
}
```

## Code Examples

### Basic Lambda Operations

```kotlin
// 1. Defining and calling lambda
val greet = { name: String -> "Hello, $name!" }
println(greet("Kotlin"))  // Hello, Kotlin!

// 2. Higher-order function: function as parameter
fun operateOnNumbers(a: Int, b: Int, operation: (Int, Int) -> Int): Int {
    return operation(a, b)
}

val sum = operateOnNumbers(5, 3) { x, y -> x + y }      // 8
val product = operateOnNumbers(5, 3) { x, y -> x * y }  // 15
val max = operateOnNumbers(5, 3) { x, y -> maxOf(x, y) } // 5

// 3. Higher-order function: function as return value
fun createMultiplier(factor: Int): (Int) -> Int {
    return { number -> number * factor }
}

val triple = createMultiplier(3)
println(triple(7))  // 21
```

### Lambda in Collection Operations

```kotlin
data class Person(val name: String, val age: Int, val city: String)

val people = listOf(
    Person("Zhang San", 28, "Beijing"),
    Person("Li Si", 35, "Shanghai"),
    Person("Wang Wu", 22, "Guangzhou"),
    Person("Zhao Liu", 28, "Beijing"),
    Person("Qian Qi", 40, "Shenzhen")
)

// filter: Filtering
val adults = people.filter { it.age >= 30 }
val beijingPeople = people.filter { it.city == "Beijing" }

// map: Transformation
val names = people.map { it.name }
val ageStrings = people.map { "${it.name}: ${it.age} years old" }

// flatMap: Flat mapping
val cities = listOf(
    listOf("Beijing", "Shanghai"),
    listOf("Guangzhou", "Shenzhen")
)
val allCities = cities.flatMap { it }  // [Beijing, Shanghai, Guangzhou, Shenzhen]

// groupBy: Grouping
val byCity = people.groupBy { it.city }
val byAge = people.groupBy { it.age }

// sortedBy: Sorting
val sortedByAge = people.sortedBy { it.age }
val sortedByNameDesc = people.sortedByDescending { it.name }

// reduce: Reduction
val totalAge = people.map { it.age }.reduce { acc, age -> acc + age }

// fold: Reduction with initial value
val ageSum = people.fold(0) { acc, person -> acc + person.age }

// partition: Partitioning
val (young, old) = people.partition { it.age < 30 }

// any, all, none: Predicates
val hasAdult = people.any { it.age >= 18 }
val allAdults = people.all { it.age >= 18 }
val noChildren = people.none { it.age < 10 }

// find, first, last
val firstBeijing = people.find { it.city == "Beijing" }
val lastPerson = people.last { it.age > 25 }

// associate: Convert to Map
val nameToAge = people.associate { it.name to it.age }
val nameToCity = people.associateWith { it.city }

// Chained operations
val result = people
    .filter { it.age >= 25 }
    .sortedBy { it.age }
    .take(3)
    .map { "${it.name} (${it.age})" }
    .joinToString(", ")

println(result)  // Zhang San (28), Zhao Liu (28), Li Si (35)
```

### Custom Higher-Order Functions

```kotlin
// Retry mechanism
inline fun <T> retry(
    times: Int = 3,
    initialDelay: Long = 100,
    maxDelay: Long = 1000,
    factor: Double = 2.0,
    block: () -> T
): T {
    var currentDelay = initialDelay
    repeat(times - 1) { attempt ->
        try {
            return block()
        } catch (e: Exception) {
            println("Attempt ${attempt + 1} failed: ${e.message}")
        }
        Thread.sleep(currentDelay)
        currentDelay = (currentDelay * factor).toLong().coerceAtMost(maxDelay)
    }
    return block() // Last attempt
}

// Usage
val result = retry(times = 3) {
    fetchDataFromNetwork()
}

// Timing function
inline fun <T> measureTimeAndReturn(block: () -> T): Pair<T, Long> {
    val start = System.currentTimeMillis()
    val result = block()
    val end = System.currentTimeMillis()
    return result to (end - start)
}

val (data, time) = measureTimeAndReturn {
    loadLargeFile()
}
println("Loading complete, took ${time}ms")

// Resource management
inline fun <T : AutoCloseable, R> T.useAndTransform(block: (T) -> R): R {
    return try {
        block(this)
    } finally {
        close()
    }
}

// Conditional execution
inline fun <T> T.applyIf(condition: Boolean, block: T.() -> Unit): T {
    if (condition) block()
    return this
}

val config = Config()
    .applyIf(isDebug) { enableLogging() }
    .applyIf(isProduction) { enableMinification() }
```

### Lambda and SAM Conversion

Kotlin can automatically convert lambdas to Java Single Abstract Method (SAM) interfaces:

```kotlin
// Java interface
// public interface Runnable {
//     void run();
// }

// Usage in Kotlin
val runnable = Runnable { println("Running!") }

// Passing to Java methods
Thread { println("Thread running") }.start()

// Comparator interface
val comparator = Comparator<String> { a, b -> a.length - b.length }
val sorted = listOf("apple", "pie", "banana").sortedWith(comparator)

// Complete SAM conversion example
button.setOnClickListener { view ->
    handleClick(view)
}

executor.submit {
    processData()
}
```

### Function References

Kotlin allows using the `::` operator to reference existing functions:

```kotlin
// 1. Top-level function reference
fun isEven(n: Int) = n % 2 == 0
val numbers = listOf(1, 2, 3, 4, 5)
val evens = numbers.filter(::isEven)

// 2. Member function reference
class StringProcessor {
    fun process(s: String) = s.uppercase()
}

val processor = StringProcessor()
val strings = listOf("hello", "world")
val processed = strings.map(processor::process)

// 3. Extension function reference
fun String.addPrefix(prefix: String) = "$prefix$this"
val addHello: (String) -> String = String::addPrefix.let {
    { s: String -> s.addPrefix("Hello, ") }
}

// 4. Constructor reference
data class User(val name: String, val age: Int)
val createUser: (String, Int) -> User = ::User
val users = names.zip(ages).map { (name, age) -> createUser(name, age) }

// 5. Property reference
data class Person(val name: String, val age: Int)
val people = listOf(Person("Alice", 30), Person("Bob", 25))
val names = people.map(Person::name)
val ages = people.sortedBy(Person::age)

// 6. Bound reference
val str = "Hello"
val getLength: () -> Int = str::length
println(getLength())  // 5
```

## Best Practices

### Keep Lambda Concise

```kotlin
// Not recommended: overly long lambda
users.filter { user ->
    val isActive = user.status == "active"
    val isVerified = user.verified
    val hasPermission = user.permissions.contains("read")
    val isNotExpired = user.expiryDate > Date()
    isActive && isVerified && hasPermission && isNotExpired
}

// Recommended: extract to function
fun User.isEligible(): Boolean {
    return status == "active" &&
           verified &&
           permissions.contains("read") &&
           expiryDate > Date()
}

users.filter { it.isEligible() }
// Or use function reference
users.filter(User::isEligible)
```

### Use it Appropriately

```kotlin
// Recommended: use it for simple operations
list.filter { it > 0 }.map { it * 2 }

// Recommended: use named parameters for complex or nested cases
list.flatMap { outer ->
    otherList.map { inner ->
        combine(outer, inner)
    }
}

// Recommended: use named parameters when lambda body is long
items.forEach { item ->
    validate(item)
    process(item)
    save(item)
    log(item)
}
```

### Prefer Function References

```kotlin
// Not recommended
list.map { it.toString() }
list.filter { isValid(it) }

// Recommended
list.map(Any::toString)
list.filter(::isValid)

// But use lambda when additional logic is needed
list.map { it.toString().uppercase() }
```

### Use Trailing Lambda for Better Readability

```kotlin
// Recommended: trailing lambda
list.fold(0) { acc, item -> acc + item }

repeat(3) {
    println("Hello")
}

with(config) {
    timeout = 30
    retryCount = 3
}

// Not recommended: not using trailing lambda (less readable)
list.fold(0, { acc, item -> acc + item })
```

### Consider Using Sequences for Large Collections

```kotlin
// For large collections, use sequences to avoid intermediate collections
val result = largeList.asSequence()
    .filter { it.isValid() }
    .map { it.transform() }
    .take(10)
    .toList()
```

## Common Pitfalls

### Return in Lambda

```kotlin
fun processItems(items: List<Int>) {
    items.forEach {
        if (it == 0) return  // Returns from processItems! Not from lambda
        println(it)
    }
    println("Processing complete")  // Won't execute when it == 0
}

// Solution 1: Use labeled return
fun processItems(items: List<Int>) {
    items.forEach label@{
        if (it == 0) return@label  // Only returns from lambda
        println(it)
    }
    println("Processing complete")  // Will execute
}

// Solution 2: Use implicit label
fun processItems(items: List<Int>) {
    items.forEach {
        if (it == 0) return@forEach  // Use function name as label
        println(it)
    }
    println("Processing complete")
}

// Solution 3: Use anonymous function
fun processItems(items: List<Int>) {
    items.forEach(fun(item) {
        if (item == 0) return  // Returns from anonymous function
        println(item)
    })
    println("Processing complete")
}
```

### Closure Variable Capture Issues

```kotlin
// Problem: all lambdas capture the same variable
fun createFunctions(): List<() -> Int> {
    val functions = mutableListOf<() -> Int>()
    for (i in 0..2) {
        functions.add { i }  // All lambdas return 3!
    }
    return functions
}

// In Kotlin this problem doesn't actually exist because for loop creates new variable each iteration
// But be careful when using while or manually managing variables

// Potential problem scenario
var counter = 0
val functions = mutableListOf<() -> Int>()
while (counter < 3) {
    functions.add { counter }  // All capture the same counter
    counter++
}

// Solution: create local copy
while (counter < 3) {
    val current = counter
    functions.add { current }
    counter++
}
```

### Inline Functions and Non-local Return

```kotlin
// inline functions allow non-local return
inline fun performOperation(action: () -> Unit) {
    println("Start")
    action()
    println("End")  // Won't execute if action has return
}

fun main() {
    performOperation {
        println("Executing operation")
        return  // Returns from main!
    }
    println("main ends")  // Won't execute
}

// Use crossinline to prohibit non-local return
inline fun safeOperation(crossinline action: () -> Unit) {
    println("Start")
    action()  // action cannot use non-local return
    println("End")
}
```

### Lambda Parameter Shadowing

```kotlin
val it = "External variable"

listOf(1, 2, 3).forEach {
    // Here it is the lambda parameter, shadowing the external it
    println(it)  // 1, 2, 3
}

// Clearer approach
listOf(1, 2, 3).forEach { number ->
    println(number)
    println(it)  // Now can access external it
}
```

### Forgetting Return Value

```kotlin
// Problem: map needs a return value
val result = list.map {
    println(it)  // Returns Unit, not the desired result
}

// Correct approach
val result = list.map {
    println(it)
    it * 2  // Explicit return value
}

// Or use also for side effects
val result = list.map { it * 2 }.also {
    it.forEach { println(it) }
}
```

## Performance Considerations

### Inline Functions

Lambda expressions generate anonymous classes at compile time, potentially creating new objects on each invocation. Inline functions eliminate this overhead by expanding the function body at the call site:

```kotlin
// Non-inline function
fun nonInlined(block: () -> Unit) {
    block()
}

// Inline function
inline fun inlined(block: () -> Unit) {
    block()
}

fun main() {
    // Non-inline: creates a Function0 object on each call
    nonInlined { println("Hello") }

    // Inline: lambda code is directly inserted at call site
    inlined { println("Hello") }

    // After inlining, equivalent to
    println("Hello")
}
```

### When to Use Inline

```kotlin
// Appropriate cases for inlining
// 1. Small functions accepting lambda parameters
inline fun <T> measureTime(block: () -> T): T {
    val start = System.currentTimeMillis()
    val result = block()
    println("Time taken: ${System.currentTimeMillis() - start}ms")
    return result
}

// 2. Functions needing reified type parameters
inline fun <reified T> isInstance(value: Any): Boolean {
    return value is T
}

// Cases not suitable for inlining
// 1. Large functions (increases bytecode size)
// 2. Functions called from many places
// 3. Lambdas being stored or passed to other non-inline functions
```

### noinline and crossinline

```kotlin
// noinline: prevents specific lambda parameter from being inlined
inline fun execute(
    inlinedAction: () -> Unit,
    noinline storedAction: () -> Unit  // This won't be inlined
) {
    inlinedAction()
    saveForLater(storedAction)  // Can be passed to other functions
}

// crossinline: allows inlining but prohibits non-local return
inline fun runInThread(crossinline action: () -> Unit) {
    Thread {
        action()  // action cannot use return
    }.start()
}
```

### Sequences vs Collections

```kotlin
// Collection operations: each operation creates intermediate collections
val result1 = (1..1000000)
    .filter { it % 2 == 0 }    // Creates new List
    .map { it * 2 }            // Creates new List
    .take(10)                  // Creates new List
    .toList()

// Sequence operations: lazy evaluation, no intermediate collections
val result2 = (1..1000000)
    .asSequence()
    .filter { it % 2 == 0 }    // Returns Sequence
    .map { it * 2 }            // Returns Sequence
    .take(10)                  // Returns Sequence
    .toList()                  // Finally creates List
```

### Memory Impact

```kotlin
// Problem: lambda captures large object
fun createProcessor(): () -> Unit {
    val largeData = ByteArray(10_000_000)
    return {
        // Even though only size is used, entire largeData is captured
        println(largeData.size)
    }
}

// Optimization: only capture needed values
fun createProcessor(): () -> Unit {
    val largeData = ByteArray(10_000_000)
    val size = largeData.size
    return {
        println(size)  // Only captures size
    }
}
```

## Real-World Scenarios

### Scenario 1: Event Handling System

```kotlin
typealias EventHandler<T> = (T) -> Unit

class EventBus {
    private val handlers = mutableMapOf<String, MutableList<EventHandler<Any>>>()

    @Suppress("UNCHECKED_CAST")
    fun <T> on(event: String, handler: EventHandler<T>) {
        handlers.getOrPut(event) { mutableListOf() }
            .add(handler as EventHandler<Any>)
    }

    fun <T> emit(event: String, data: T) {
        handlers[event]?.forEach { handler ->
            handler(data as Any)
        }
    }

    fun off(event: String) {
        handlers.remove(event)
    }
}

// Usage
val bus = EventBus()

bus.on<String>("message") { msg ->
    println("Message received: $msg")
}

bus.on<Int>("count") { count ->
    println("Count: $count")
}

bus.emit("message", "Hello!")
bus.emit("count", 42)
```

### Scenario 2: Data Validation Framework

```kotlin
class Validator<T> {
    private val rules = mutableListOf<Pair<String, (T) -> Boolean>>()

    fun rule(message: String, predicate: (T) -> Boolean): Validator<T> {
        rules.add(message to predicate)
        return this
    }

    fun validate(value: T): ValidationResult {
        val errors = rules
            .filter { (_, predicate) -> !predicate(value) }
            .map { (message, _) -> message }
        return ValidationResult(errors.isEmpty(), errors)
    }
}

data class ValidationResult(val isValid: Boolean, val errors: List<String>)

// Usage
val userValidator = Validator<User>()
    .rule("Username cannot be empty") { it.username.isNotBlank() }
    .rule("Username length must be between 3-20") { it.username.length in 3..20 }
    .rule("Invalid email format") { it.email.contains("@") }
    .rule("Age must be between 0-150") { it.age in 0..150 }

val user = User("ab", "invalid", 200)
val result = userValidator.validate(user)
if (!result.isValid) {
    result.errors.forEach { println("Validation failed: $it") }
}
```

### Scenario 3: Fluent API Builder

```kotlin
class QueryBuilder {
    private var table: String = ""
    private val conditions = mutableListOf<String>()
    private var orderBy: String? = null
    private var limit: Int? = null

    fun from(table: String) = apply { this.table = table }

    fun where(condition: () -> String) = apply {
        conditions.add(condition())
    }

    fun orderBy(column: String, desc: Boolean = false) = apply {
        orderBy = if (desc) "$column DESC" else column
    }

    fun limit(n: Int) = apply { limit = n }

    fun build(): String {
        val query = StringBuilder("SELECT * FROM $table")
        if (conditions.isNotEmpty()) {
            query.append(" WHERE ")
            query.append(conditions.joinToString(" AND "))
        }
        orderBy?.let { query.append(" ORDER BY $it") }
        limit?.let { query.append(" LIMIT $it") }
        return query.toString()
    }
}

// Usage
val query = QueryBuilder()
    .from("users")
    .where { "status = 'active'" }
    .where { "age >= 18" }
    .orderBy("created_at", desc = true)
    .limit(10)
    .build()

println(query)
// SELECT * FROM users WHERE status = 'active' AND age >= 18 ORDER BY created_at DESC LIMIT 10
```

### Scenario 4: Configuration DSL

```kotlin
@DslMarker
annotation class ServerDsl

@ServerDsl
class ServerConfig {
    var host: String = "localhost"
    var port: Int = 8080
    private val routes = mutableListOf<Route>()

    fun route(path: String, init: Route.() -> Unit) {
        routes.add(Route(path).apply(init))
    }

    fun build(): Server = Server(host, port, routes)
}

@ServerDsl
class Route(val path: String) {
    var method: String = "GET"
    var handler: (Request) -> Response = { Response(200, "OK") }
}

data class Request(val params: Map<String, String>)
data class Response(val status: Int, val body: String)
data class Server(val host: String, val port: Int, val routes: List<Route>)

fun server(init: ServerConfig.() -> Unit): Server {
    return ServerConfig().apply(init).build()
}

// Usage
val myServer = server {
    host = "0.0.0.0"
    port = 3000

    route("/hello") {
        method = "GET"
        handler = { Response(200, "Hello, World!") }
    }

    route("/users") {
        method = "POST"
        handler = { request ->
            val name = request.params["name"] ?: "Unknown"
            Response(201, "Created user: $name")
        }
    }
}
```

### Scenario 5: Async Task Orchestration

```kotlin
class TaskChain<T>(private val initial: T) {
    private val tasks = mutableListOf<suspend (Any?) -> Any?>()

    @Suppress("UNCHECKED_CAST")
    fun <R> then(task: suspend (T) -> R): TaskChain<R> {
        tasks.add(task as suspend (Any?) -> Any?)
        return this as TaskChain<R>
    }

    fun catch(handler: (Throwable) -> Unit): TaskChain<T> {
        // Error handling logic
        return this
    }

    suspend fun execute(): Any? {
        var result: Any? = initial
        for (task in tasks) {
            result = task(result)
        }
        return result
    }
}

fun <T> startWith(value: T) = TaskChain(value)

// Usage
suspend fun main() {
    val result = startWith(1)
        .then { it + 1 }
        .then { it * 2 }
        .then { "Result: $it" }
        .execute()

    println(result)  // Result: 4
}
```

## Interview Key Points

### Common Interview Questions

**Q1: What are the differences between lambda expressions and anonymous functions in Kotlin?**

```kotlin
// Lambda expression
val lambda = { x: Int -> x * 2 }

// Anonymous function
val anonymous = fun(x: Int): Int { return x * 2 }
```

Main differences:
1. **Return behavior**: `return` in lambda returns from the outer function (non-local return), while `return` in anonymous function only returns from itself
2. **Type inference**: Anonymous functions can explicitly specify return type, lambda relies on inference
3. **Syntax**: Anonymous functions have `fun` keyword, lambda is more concise

**Q2: What are inline functions? Why use them?**

```kotlin
inline fun performAction(action: () -> Unit) {
    action()
}
```

Inline functions insert the function body directly at the call site during compilation. Benefits:
1. Eliminates overhead of lambda object creation
2. Supports non-local return
3. Supports reified type parameters

**Q3: Explain trailing lambda syntax**

When the last parameter of a function is a lambda, the lambda can be placed outside the parentheses:

```kotlin
// Regular syntax
list.fold(0, { acc, item -> acc + item })

// Trailing lambda
list.fold(0) { acc, item -> acc + item }

// If lambda is the only parameter, parentheses can be omitted
list.forEach { println(it) }
```

**Q4: What is lambda with receiver? What are its use cases?**

```kotlin
// Lambda with receiver
val greet: String.() -> String = { "Hello, $this!" }
"World".greet()  // "Hello, World!"
```

Use cases:
1. Building DSLs (e.g., HTML builders, configuration builders)
2. Foundation for scope functions (apply, run, with)
3. Allows direct access to receiver members inside lambda

**Q5: What is SAM conversion?**

SAM (Single Abstract Method) conversion allows automatically converting a lambda to an instance of a Java interface with only one abstract method:

```kotlin
// Java Runnable interface
val runnable: Runnable = Runnable { println("Running") }

// Equivalent to
val runnable: Runnable = object : Runnable {
    override fun run() {
        println("Running")
    }
}
```

**Q6: What are crossinline and noinline for?**

```kotlin
inline fun example(
    noinline stored: () -> Unit,      // Not inlined, can be stored
    crossinline noReturn: () -> Unit   // Inlined but prohibits non-local return
) {
    saveForLater(stored)  // noinline allows passing to other functions
    Thread { noReturn() }.start()  // crossinline allows use in non-direct call locations
}
```

**Q7: How to implement "return only from lambda"?**

```kotlin
// Method 1: Labeled return
list.forEach {
    if (condition) return@forEach  // Only returns from lambda
    process(it)
}

// Method 2: Anonymous function
list.forEach(fun(item) {
    if (condition) return  // Only returns from anonymous function
    process(item)
})
```

### Coding Exercises

**Exercise 1: Implement memoize function**

```kotlin
fun <T, R> ((T) -> R).memoize(): (T) -> R {
    val cache = mutableMapOf<T, R>()
    return { input ->
        cache.getOrPut(input) { this(input) }
    }
}

// Usage
val expensiveOperation = { n: Int ->
    Thread.sleep(1000)
    n * n
}.memoize()

println(expensiveOperation(5))  // Slow
println(expensiveOperation(5))  // Fast (from cache)
```

**Exercise 2: Implement compose function**

```kotlin
infix fun <A, B, C> ((B) -> C).compose(other: (A) -> B): (A) -> C {
    return { a -> this(other(a)) }
}

// Usage
val addOne: (Int) -> Int = { it + 1 }
val double: (Int) -> Int = { it * 2 }
val addOneThenDouble = double compose addOne
println(addOneThenDouble(3))  // 8
```

## Further Reading

### Official Documentation

- [Kotlin Official Documentation - Lambdas](https://kotlinlang.org/docs/lambdas.html)
- [Kotlin Official Documentation - Inline Functions](https://kotlinlang.org/docs/inline-functions.html)
- [Kotlin Official Documentation - Higher-Order Functions](https://kotlinlang.org/docs/higher-order-functions.html)

### Related Topics

- **Scope Functions**: let, run, with, apply, also are all utility tools based on lambdas
- **Coroutines**: Suspend lambdas (`suspend () -> T`) are the foundation of coroutines
- **DSL Building**: Lambda with receiver is the core technique for Kotlin DSLs
- **Collection Operations**: filter, map, reduce all accept lambda parameters

### Recommended Books

- "Kotlin in Action" Chapter 5: Lambda Programming
- "Core Kotlin Programming" Functional Programming chapters
- "Effective Kotlin" Items 46-50

### Advanced Learning

- Functional programming concepts: pure functions, immutability, higher-order functions
- Lambda calculus theoretical foundation
- JVM bytecode analysis: understanding lambda implementation after compilation
- Kotlin compiler plugin development

## Summary

Lambda expressions are the cornerstone of functional programming in Kotlin. Mastering them is crucial for writing elegant, concise Kotlin code.

**Core Points Review:**

1. **Syntax**: Lambda is surrounded by `{}`, parameters before `->`, last expression serves as return value
2. **it keyword**: Single-parameter lambdas can use implicit parameter name `it`
3. **Trailing lambda**: Last lambda parameter can be placed outside parentheses
4. **Function types**: `(ParameterTypes) -> ReturnType` describes function signature
5. **Inline functions**: Use `inline` to eliminate lambda object creation overhead
6. **Lambda with receiver**: Foundation for DSL building

**Practical Recommendations:**

- Keep lambdas concise; extract complex logic to named functions
- Choose between `it` or named parameters based on context
- Use function references instead of simple lambdas
- Consider using sequences for large collection processing
- Be aware of `return` behavior in lambdas
- Use inline functions appropriately to optimize performance

Lambda expressions make Kotlin code more declarative and expressive - they are an indispensable tool for building modern Kotlin applications.
