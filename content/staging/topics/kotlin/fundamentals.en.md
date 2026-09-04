---
title: Kotlin Fundamentals
description: Complete guide to Kotlin basics, variables, types, null safety and control flow
track: kotlin
section: basics
difficulty: beginner
tags:
  - Kotlin
  - Variables
  - Null Safety
  - Control Flow
status: imported
origin: old/src/content/docs/kotlin/fundamentals.en.md
divergence: 0.152
issues: []
legacy:
  category: Kotlin
  subcategory: Language Basics
  order: 1
  lastUpdated: 2026-01-07
---

Kotlin is a modern, statically typed programming language developed by JetBrains. It runs on the Java Virtual Machine (JVM) and can be compiled to JavaScript or native code. Kotlin is designed to be concise, safe, and fully interoperable with Java, making it an excellent choice for Android development, server-side applications, and multiplatform projects.

## Variables: val and var

Kotlin provides two keywords for declaring variables: `val` and `var`. Understanding the difference between them is fundamental to writing effective Kotlin code.

### Immutable Variables with val

The `val` keyword declares a read-only (immutable) variable. Once assigned, its value cannot be changed. This is similar to `final` in Java or `const` in JavaScript.

```kotlin
val name = "Alice"
val age = 25
val pi = 3.14159

// This would cause a compilation error:
// name = "Bob"  // Error: Val cannot be reassigned
```

Using `val` is recommended whenever possible because immutable variables make code easier to reason about and help prevent bugs.

### Mutable Variables with var

The `var` keyword declares a mutable variable that can be reassigned after initialization.

```kotlin
var counter = 0
counter = 1  // OK
counter = 2  // OK

var message = "Hello"
message = "World"  // OK
```

### Type Inference and Explicit Types

Kotlin has powerful type inference, meaning the compiler can automatically determine the type of a variable based on its initial value.

```kotlin
// Type inference
val number = 42          // Inferred as Int
val greeting = "Hello"   // Inferred as String
val price = 19.99        // Inferred as Double

// Explicit type declaration
val count: Int = 100
val name: String = "Kotlin"
val rate: Double = 4.5
```

Explicit types are useful when you want to declare a variable without immediate initialization or when you need a specific type.

```kotlin
val score: Int  // Declared without initialization
score = 95      // Assigned later (only once for val)

val amount: Long = 100  // Explicitly Long, not Int
```

## Data Types

Kotlin provides a rich set of built-in data types for representing different kinds of values.

### Numeric Types

```kotlin
// Integer types
val byte: Byte = 127                    // 8-bit signed integer (-128 to 127)
val short: Short = 32767                // 16-bit signed integer
val int: Int = 2147483647               // 32-bit signed integer (default)
val long: Long = 9223372036854775807L   // 64-bit signed integer

// Floating-point types
val float: Float = 3.14f                // 32-bit floating point
val double: Double = 3.14159265359      // 64-bit floating point (default)

// Unsigned integers (Kotlin 1.5+)
val uByte: UByte = 255u
val uInt: UInt = 42u
val uLong: ULong = 100uL
```

### Boolean Type

```kotlin
val isActive: Boolean = true
val isComplete: Boolean = false

val result = 10 > 5  // true
val check = "a" == "b"  // false
```

### Character and String Types

```kotlin
// Characters
val letter: Char = 'A'
val digit: Char = '7'
val unicode: Char = '\u0041'  // 'A'

// Strings
val greeting: String = "Hello, World!"
val multiline: String = """
    This is a
    multiline string
    in Kotlin
""".trimIndent()
```

### String Templates

Kotlin supports string interpolation through string templates, making it easy to embed expressions within strings.

```kotlin
val name = "Alice"
val age = 30

// Simple variable reference
val intro = "My name is $name"

// Expression in curly braces
val info = "In 5 years, I will be ${age + 5} years old"

// Accessing properties and methods
val message = "Name length: ${name.length}"
val upper = "Uppercase: ${name.uppercase()}"
```

### Arrays

```kotlin
// Creating arrays
val numbers = arrayOf(1, 2, 3, 4, 5)
val strings = arrayOf("a", "b", "c")

// Typed arrays
val intArray = intArrayOf(1, 2, 3)
val doubleArray = doubleArrayOf(1.0, 2.0, 3.0)

// Accessing elements
val first = numbers[0]  // 1
numbers[0] = 10         // Modify element

// Array size
val size = numbers.size  // 5
```

## Null Safety

One of Kotlin's most powerful features is its built-in null safety system. Kotlin distinguishes between nullable and non-nullable types at the compiler level, preventing the dreaded NullPointerException at runtime.

### Non-Nullable Types

By default, variables in Kotlin cannot hold null values.

```kotlin
var name: String = "Alice"
// name = null  // Error: Null cannot be a value of a non-null type String
```

### Nullable Types

To allow a variable to hold null, add a question mark `?` after the type.

```kotlin
var nullableName: String? = "Bob"
nullableName = null  // OK

var nullableNumber: Int? = null
nullableNumber = 42  // OK
```

### Safe Call Operator (?.)

The safe call operator allows you to safely access properties or methods on nullable objects. If the object is null, the entire expression returns null instead of throwing an exception.

```kotlin
val name: String? = null
val length = name?.length  // Returns null instead of throwing NPE

// Chaining safe calls
val city: String? = user?.address?.city

// Safe call with method
val uppercase = name?.uppercase()  // null
```

### Elvis Operator (?:)

The Elvis operator provides a default value when an expression is null.

```kotlin
val name: String? = null
val displayName = name ?: "Anonymous"  // "Anonymous"

val length = name?.length ?: 0  // 0

// Can also be used with throw or return
val nonNullName = name ?: throw IllegalArgumentException("Name required")
val validName = name ?: return
```

### Not-Null Assertion (!!)

The not-null assertion operator converts a nullable type to a non-nullable type. If the value is null, it throws a NullPointerException. Use this sparingly and only when you're certain the value won't be null.

```kotlin
val name: String? = "Alice"
val length = name!!.length  // 5

val nullName: String? = null
// val crash = nullName!!.length  // Throws NullPointerException!
```

### Safe Casts

The safe cast operator `as?` returns null if the cast fails instead of throwing an exception.

```kotlin
val obj: Any = "Hello"
val str: String? = obj as? String  // "Hello"
val num: Int? = obj as? Int        // null
```

### Let Function with Null Safety

The `let` function is commonly used with safe calls to execute a block of code only when a value is not null.

```kotlin
val name: String? = "Alice"

name?.let {
    println("Name is $it")
    println("Length is ${it.length}")
}

// Can also provide a value
val length = name?.let { it.length } ?: 0
```

## Control Flow

Kotlin provides familiar control flow structures with some enhancements over other languages.

### If Expression

In Kotlin, `if` is an expression that returns a value, not just a statement.

```kotlin
// Traditional if-else
val max: Int
if (a > b) {
    max = a
} else {
    max = b
}

// If as an expression
val max = if (a > b) a else b

// With blocks
val max = if (a > b) {
    println("a is larger")
    a  // Last expression is the return value
} else {
    println("b is larger")
    b
}
```

### When Expression

The `when` expression is Kotlin's powerful replacement for the switch statement. It's more versatile and expressive.

```kotlin
// Basic when
val result = when (x) {
    1 -> "One"
    2 -> "Two"
    3 -> "Three"
    else -> "Unknown"
}

// Multiple conditions
when (x) {
    0, 1 -> println("x is 0 or 1")
    else -> println("x is neither 0 nor 1")
}

// Range checking
when (score) {
    in 90..100 -> "A"
    in 80..89 -> "B"
    in 70..79 -> "C"
    in 60..69 -> "D"
    else -> "F"
}

// Type checking
when (obj) {
    is String -> println("String of length ${obj.length}")
    is Int -> println("Integer: $obj")
    is List<*> -> println("List of size ${obj.size}")
    else -> println("Unknown type")
}

// Arbitrary conditions
when {
    x.isOdd() -> println("x is odd")
    y.isEven() -> println("y is even")
    else -> println("Neither condition met")
}
```

### For Loops

Kotlin's `for` loop iterates over anything that provides an iterator.

```kotlin
// Iterate over a range
for (i in 1..5) {
    println(i)  // 1, 2, 3, 4, 5
}

// Iterate with step
for (i in 0..10 step 2) {
    println(i)  // 0, 2, 4, 6, 8, 10
}

// Iterate in reverse
for (i in 5 downTo 1) {
    println(i)  // 5, 4, 3, 2, 1
}

// Exclude the end value
for (i in 0 until 5) {
    println(i)  // 0, 1, 2, 3, 4
}

// Iterate over a collection
val fruits = listOf("Apple", "Banana", "Cherry")
for (fruit in fruits) {
    println(fruit)
}

// Iterate with index
for ((index, fruit) in fruits.withIndex()) {
    println("$index: $fruit")
}

// Iterate over a map
val map = mapOf("a" to 1, "b" to 2)
for ((key, value) in map) {
    println("$key = $value")
}
```

### While and Do-While Loops

```kotlin
// While loop
var count = 5
while (count > 0) {
    println(count)
    count--
}

// Do-while loop (executes at least once)
var input: String
do {
    input = readLine() ?: ""
    println("You entered: $input")
} while (input != "quit")
```

### Break and Continue

```kotlin
// Break exits the loop
for (i in 1..10) {
    if (i == 5) break
    println(i)  // 1, 2, 3, 4
}

// Continue skips to the next iteration
for (i in 1..5) {
    if (i == 3) continue
    println(i)  // 1, 2, 4, 5
}

// Labeled breaks and continues
outer@ for (i in 1..3) {
    for (j in 1..3) {
        if (i == 2 && j == 2) break@outer
        println("$i, $j")
    }
}
```

## Functions

Functions in Kotlin are declared using the `fun` keyword and offer many powerful features.

### Basic Function Declaration

```kotlin
fun greet(name: String): String {
    return "Hello, $name!"
}

// Calling the function
val greeting = greet("Alice")  // "Hello, Alice!"
```

### Single-Expression Functions

For simple functions, you can use a more concise syntax.

```kotlin
fun double(x: Int): Int = x * 2

// Type inference works here too
fun triple(x: Int) = x * 3

fun greet(name: String) = "Hello, $name!"
```

### Default Parameter Values

```kotlin
fun greet(name: String = "World", greeting: String = "Hello"): String {
    return "$greeting, $name!"
}

greet()                    // "Hello, World!"
greet("Alice")             // "Hello, Alice!"
greet("Alice", "Hi")       // "Hi, Alice!"
```

### Named Arguments

Named arguments make function calls more readable and allow you to specify arguments in any order.

```kotlin
fun createUser(name: String, age: Int, email: String, isActive: Boolean = true) {
    // ...
}

// Using named arguments
createUser(
    name = "Alice",
    email = "alice@example.com",
    age = 30
)

// Mix positional and named arguments
createUser("Bob", age = 25, email = "bob@example.com")
```

### Variable Number of Arguments (Varargs)

```kotlin
fun sum(vararg numbers: Int): Int {
    return numbers.sum()
}

sum(1, 2, 3)           // 6
sum(1, 2, 3, 4, 5)     // 15

// Spread operator to pass an array
val array = intArrayOf(1, 2, 3)
sum(*array)            // 6
```

### Unit-Returning Functions

Functions that don't return a meaningful value have a return type of `Unit` (similar to `void` in other languages).

```kotlin
fun printMessage(message: String): Unit {
    println(message)
}

// Unit can be omitted
fun printMessage(message: String) {
    println(message)
}
```

### Local Functions

Functions can be nested inside other functions.

```kotlin
fun processUser(user: User) {
    fun validate(value: String, fieldName: String) {
        if (value.isEmpty()) {
            throw IllegalArgumentException("$fieldName cannot be empty")
        }
    }

    validate(user.name, "Name")
    validate(user.email, "Email")

    // Process the user...
}
```

## Classes Basics

Kotlin provides a concise and powerful syntax for defining classes.

### Basic Class Declaration

```kotlin
class Person {
    var name: String = ""
    var age: Int = 0

    fun introduce() {
        println("Hi, I'm $name and I'm $age years old.")
    }
}

// Creating an instance (no 'new' keyword needed)
val person = Person()
person.name = "Alice"
person.age = 30
person.introduce()
```

### Primary Constructor

```kotlin
class Person(val name: String, var age: Int) {
    fun introduce() {
        println("Hi, I'm $name and I'm $age years old.")
    }
}

val person = Person("Alice", 30)
println(person.name)  // "Alice"
person.age = 31       // Can modify because it's var
```

### Init Blocks

```kotlin
class Person(val name: String, var age: Int) {
    init {
        require(name.isNotEmpty()) { "Name cannot be empty" }
        require(age >= 0) { "Age cannot be negative" }
        println("Person created: $name")
    }
}
```

### Secondary Constructors

```kotlin
class Person(val name: String, var age: Int) {
    var email: String = ""

    constructor(name: String, age: Int, email: String) : this(name, age) {
        this.email = email
    }
}

val person1 = Person("Alice", 30)
val person2 = Person("Bob", 25, "bob@example.com")
```

### Properties with Custom Getters and Setters

```kotlin
class Rectangle(val width: Int, val height: Int) {
    // Property with custom getter
    val area: Int
        get() = width * height

    // Property with custom getter and setter
    var scale: Double = 1.0
        set(value) {
            require(value > 0) { "Scale must be positive" }
            field = value  // 'field' refers to the backing field
        }

    val scaledArea: Double
        get() = area * scale
}

val rect = Rectangle(10, 5)
println(rect.area)  // 50
rect.scale = 2.0
println(rect.scaledArea)  // 100.0
```

### Data Classes

Data classes are perfect for holding data. Kotlin automatically generates `equals()`, `hashCode()`, `toString()`, `copy()`, and component functions.

```kotlin
data class User(
    val id: Int,
    val name: String,
    val email: String
)

val user1 = User(1, "Alice", "alice@example.com")
val user2 = User(1, "Alice", "alice@example.com")

println(user1)                // User(id=1, name=Alice, email=alice@example.com)
println(user1 == user2)       // true (structural equality)
println(user1.hashCode())     // Same as user2.hashCode()

// Copy with modifications
val user3 = user1.copy(name = "Bob")
println(user3)                // User(id=1, name=Bob, email=alice@example.com)

// Destructuring
val (id, name, email) = user1
println("$id: $name ($email)")
```

### Inheritance

```kotlin
// Open allows the class to be inherited
open class Animal(val name: String) {
    open fun speak() {
        println("$name makes a sound")
    }
}

class Dog(name: String, val breed: String) : Animal(name) {
    override fun speak() {
        println("$name barks!")
    }

    fun fetch() {
        println("$name fetches the ball")
    }
}

val dog = Dog("Buddy", "Golden Retriever")
dog.speak()   // "Buddy barks!"
dog.fetch()   // "Buddy fetches the ball"
```

### Visibility Modifiers

```kotlin
class Example {
    public val publicProperty = 1      // Visible everywhere (default)
    private val privateProperty = 2    // Visible only in this class
    protected val protectedProperty = 3 // Visible in this class and subclasses
    internal val internalProperty = 4  // Visible in the same module
}
```

## Summary

Kotlin provides a modern, safe, and expressive foundation for building applications. The key fundamentals covered in this guide include:

- **Variables**: Use `val` for immutable references and `var` for mutable ones. Prefer `val` when possible.
- **Data Types**: Kotlin offers numeric types, booleans, characters, strings with powerful templates, and arrays.
- **Null Safety**: The type system distinguishes nullable (`Type?`) from non-nullable (`Type`) types, with operators like `?.`, `?:`, and `!!` for safe handling.
- **Control Flow**: `if` and `when` are expressions that return values. For loops work with ranges and iterables. Labeled breaks and continues provide fine-grained control.
- **Functions**: Concise syntax with default parameters, named arguments, single-expression bodies, and local functions.
- **Classes**: Primary constructors, init blocks, data classes, and inheritance provide a clean object-oriented foundation.

These fundamentals form the building blocks for more advanced Kotlin features like extension functions, lambdas, coroutines, and the powerful standard library collections. Master these basics, and you'll be well-prepared to write idiomatic, safe, and maintainable Kotlin code.
