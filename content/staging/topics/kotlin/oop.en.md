---
title: Object-Oriented Programming
description: Complete guide to Kotlin OOP, classes, inheritance, interfaces and data classes
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - Kotlin
  - OOP
  - Classes
  - Inheritance
status: imported
origin: old/src/content/docs/kotlin/oop.en.md
divergence: 0.23
issues: []
legacy:
  category: Kotlin
  subcategory: Object-Oriented
  order: 3
  lastUpdated: 2026-01-07
---

Kotlin is a modern, statically-typed language that embraces object-oriented programming while introducing powerful features that reduce boilerplate and increase type safety. This comprehensive guide covers all fundamental and advanced OOP concepts in Kotlin, providing practical examples for real-world development.

---

## Classes and Objects

In Kotlin, classes are the fundamental building blocks of object-oriented programming. They encapsulate data and behavior into reusable units.

### Basic Class Declaration

The simplest class declaration requires only the `class` keyword and a name:

```kotlin
class Empty
```

A class with properties and methods:

```kotlin
class Person {
    var name: String = ""
    var age: Int = 0

    fun introduce() {
        println("Hi, I'm $name and I'm $age years old.")
    }
}

fun main() {
    val person = Person()
    person.name = "Alice"
    person.age = 28
    person.introduce() // Output: Hi, I'm Alice and I'm 28 years old.
}
```

### Creating Instances

Kotlin does not use the `new` keyword. Objects are created by calling the constructor directly:

```kotlin
val car = Car()
val user = User("john@example.com")
val point = Point(10, 20)
```

### Class Members

Classes can contain:
- **Properties** (fields with automatic getters/setters)
- **Methods** (functions that operate on the object)
- **Initializer blocks** (code that runs during object creation)
- **Nested and inner classes**
- **Object declarations** (companion objects)

```kotlin
class BankAccount(val accountNumber: String) {
    // Property
    var balance: Double = 0.0
        private set

    // Initializer block
    init {
        println("Account $accountNumber created")
    }

    // Methods
    fun deposit(amount: Double) {
        require(amount > 0) { "Deposit amount must be positive" }
        balance += amount
    }

    fun withdraw(amount: Double): Boolean {
        return if (amount <= balance) {
            balance -= amount
            true
        } else {
            false
        }
    }

    // Nested class
    class TransactionRecord(val type: String, val amount: Double)
}
```

---

## Properties

Properties in Kotlin combine the field, getter, and setter into a single declaration. This eliminates the verbose getter/setter patterns common in Java.

### Declaring Properties

```kotlin
class Rectangle(val width: Int, val height: Int) {
    // Read-only computed property
    val area: Int
        get() = width * height

    // Read-only property with backing field
    val perimeter: Int = 2 * (width + height)

    // Mutable property
    var name: String = "Rectangle"
}
```

### Val vs Var

- `val` declares a read-only property (like `final` in Java)
- `var` declares a mutable property

```kotlin
class User(val id: Long) {  // id cannot be changed after construction
    var email: String = ""  // email can be modified
    var isActive: Boolean = true
}
```

### Custom Getters and Setters

```kotlin
class Temperature {
    var celsius: Double = 0.0

    // Computed property based on another property
    var fahrenheit: Double
        get() = celsius * 9 / 5 + 32
        set(value) {
            celsius = (value - 32) * 5 / 9
        }

    // Property with validation in setter
    var kelvin: Double
        get() = celsius + 273.15
        set(value) {
            require(value >= 0) { "Temperature cannot be below absolute zero" }
            celsius = value - 273.15
        }
}

fun main() {
    val temp = Temperature()
    temp.celsius = 25.0
    println("${temp.celsius}C = ${temp.fahrenheit}F = ${temp.kelvin}K")
    // Output: 25.0C = 77.0F = 298.15K

    temp.fahrenheit = 100.0
    println("Celsius: ${temp.celsius}") // Output: Celsius: 37.77...
}
```

### Backing Fields

When you need to reference the actual stored value within a custom accessor, use the `field` identifier:

```kotlin
class Person {
    var name: String = ""
        set(value) {
            field = value.trim().replaceFirstChar { it.uppercase() }
        }

    var age: Int = 0
        set(value) {
            if (value >= 0) {
                field = value
            }
        }
}
```

### Late-Initialized Properties

For properties that cannot be initialized in the constructor but will be set before first use:

```kotlin
class DatabaseService {
    lateinit var connection: Connection

    fun connect(url: String) {
        connection = DriverManager.getConnection(url)
    }

    fun isConnected(): Boolean = ::connection.isInitialized
}
```

**Note:** `lateinit` can only be used with `var` properties of non-nullable, non-primitive types.

### Lazy Properties

For expensive computations that should be deferred until first access:

```kotlin
class DataProcessor {
    val expensiveData: List<String> by lazy {
        println("Computing expensive data...")
        loadDataFromDatabase()
    }

    private fun loadDataFromDatabase(): List<String> {
        // Simulate expensive operation
        return listOf("data1", "data2", "data3")
    }
}

fun main() {
    val processor = DataProcessor()
    println("Processor created")
    println(processor.expensiveData) // "Computing expensive data..." prints here
    println(processor.expensiveData) // Uses cached value, no recomputation
}
```

---

## Constructors

Kotlin distinguishes between primary constructors (declared in the class header) and secondary constructors (declared in the class body).

### Primary Constructor

The primary constructor is part of the class header:

```kotlin
class Person(val name: String, var age: Int)
```

This concise declaration creates a class with two properties and a constructor that initializes them.

### Primary Constructor with Init Block

For initialization logic, use `init` blocks:

```kotlin
class Person(val name: String, var age: Int) {
    init {
        require(name.isNotBlank()) { "Name cannot be blank" }
        require(age >= 0) { "Age cannot be negative" }
        println("Created person: $name, $age")
    }
}
```

Multiple `init` blocks execute in order of appearance:

```kotlin
class InitOrderDemo(name: String) {
    val firstProperty = "First: $name".also(::println)

    init {
        println("First init block: $name")
    }

    val secondProperty = "Second: $name".also(::println)

    init {
        println("Second init block: $name")
    }
}
// Output order:
// First: Demo
// First init block: Demo
// Second: Demo
// Second init block: Demo
```

### Default Parameter Values

```kotlin
class Connection(
    val host: String = "localhost",
    val port: Int = 8080,
    val timeout: Int = 30000,
    val secure: Boolean = false
)

fun main() {
    val conn1 = Connection()
    val conn2 = Connection("api.example.com")
    val conn3 = Connection("api.example.com", 443, secure = true)
    val conn4 = Connection(port = 3000)  // Named argument
}
```

### Secondary Constructors

Secondary constructors provide alternative ways to create objects:

```kotlin
class Person(val name: String, val age: Int) {
    var email: String = ""
    var phone: String = ""

    // Secondary constructor must delegate to primary
    constructor(name: String, age: Int, email: String) : this(name, age) {
        this.email = email
    }

    constructor(name: String, age: Int, email: String, phone: String) : this(name, age, email) {
        this.phone = phone
    }
}
```

### Private Constructors

Use private constructors to control object creation (factory pattern):

```kotlin
class DatabaseConnection private constructor(val connectionString: String) {
    companion object {
        private var instance: DatabaseConnection? = null

        fun getInstance(connectionString: String): DatabaseConnection {
            return instance ?: DatabaseConnection(connectionString).also {
                instance = it
            }
        }
    }
}
```

---

## Inheritance

Kotlin classes are **final by default**. To allow inheritance, mark the class as `open`.

### Basic Inheritance

```kotlin
open class Animal(val name: String) {
    open fun makeSound() {
        println("Some generic animal sound")
    }

    fun eat() {
        println("$name is eating")
    }
}

class Dog(name: String, val breed: String) : Animal(name) {
    override fun makeSound() {
        println("$name says: Woof!")
    }

    fun fetch() {
        println("$name is fetching the ball")
    }
}

class Cat(name: String) : Animal(name) {
    override fun makeSound() {
        println("$name says: Meow!")
    }
}

fun main() {
    val dog = Dog("Buddy", "Golden Retriever")
    val cat = Cat("Whiskers")

    dog.makeSound() // Buddy says: Woof!
    cat.makeSound() // Whiskers says: Meow!
    dog.eat()       // Buddy is eating
    dog.fetch()     // Buddy is fetching the ball
}
```

### Calling Superclass Methods

Use the `super` keyword to call parent implementations:

```kotlin
open class Vehicle(val brand: String) {
    open fun start() {
        println("$brand vehicle starting...")
    }
}

class ElectricCar(brand: String, val batteryCapacity: Int) : Vehicle(brand) {
    override fun start() {
        super.start()
        println("Electric motor initialized. Battery: $batteryCapacity kWh")
    }
}
```

### Abstract Classes

Abstract classes cannot be instantiated and may contain abstract members:

```kotlin
abstract class Shape(val name: String) {
    // Abstract property - must be overridden
    abstract val area: Double

    // Abstract method - must be overridden
    abstract fun draw()

    // Concrete method - inherited as-is
    fun describe() {
        println("This is a $name with area $area")
    }
}

class Circle(val radius: Double) : Shape("Circle") {
    override val area: Double
        get() = Math.PI * radius * radius

    override fun draw() {
        println("Drawing a circle with radius $radius")
    }
}

class Rectangle(val width: Double, val height: Double) : Shape("Rectangle") {
    override val area: Double = width * height

    override fun draw() {
        println("Drawing a rectangle ${width}x${height}")
    }
}

fun main() {
    val shapes: List<Shape> = listOf(
        Circle(5.0),
        Rectangle(4.0, 6.0)
    )

    for (shape in shapes) {
        shape.draw()
        shape.describe()
    }
}
```

### Visibility Modifiers

Kotlin provides four visibility modifiers:

| Modifier | Class Member | Top-level Declaration |
|----------|--------------|----------------------|
| `public` (default) | Visible everywhere | Visible everywhere |
| `private` | Visible inside the class | Visible inside the file |
| `protected` | Visible in class and subclasses | N/A |
| `internal` | Visible in the same module | Visible in the same module |

```kotlin
open class Base {
    private val privateVal = 1      // Only in Base
    protected val protectedVal = 2  // Base and subclasses
    internal val internalVal = 3    // Same module
    val publicVal = 4               // Everywhere

    protected fun protectedMethod() {
        println("Protected method called")
    }
}

class Derived : Base() {
    fun accessParent() {
        // println(privateVal)    // Error: private
        println(protectedVal)     // OK: protected accessible in subclass
        println(internalVal)      // OK
        println(publicVal)        // OK
        protectedMethod()         // OK
    }
}
```

---

## Interfaces

Interfaces define contracts that classes can implement. Kotlin interfaces can contain abstract methods, default implementations, and abstract properties.

### Basic Interface

```kotlin
interface Drawable {
    fun draw()
}

class Circle(val radius: Double) : Drawable {
    override fun draw() {
        println("Drawing circle with radius $radius")
    }
}
```

### Interface with Default Implementation

```kotlin
interface Logger {
    val tag: String
        get() = this::class.simpleName ?: "Unknown"

    fun log(message: String) {
        println("[$tag] $message")
    }

    fun logError(message: String) {
        println("[$tag] ERROR: $message")
    }

    // Abstract method - must be implemented
    fun getLogLevel(): Int
}

class FileLogger(private val filename: String) : Logger {
    override val tag: String = "FileLogger"

    override fun getLogLevel(): Int = 2

    override fun log(message: String) {
        // Custom implementation
        println("Writing to $filename: $message")
    }
    // logError uses default implementation
}
```

### Multiple Interface Implementation

```kotlin
interface Flyable {
    fun fly()
    val maxAltitude: Int
}

interface Swimmable {
    fun swim()
    val maxDepth: Int
}

class Duck(val name: String) : Flyable, Swimmable {
    override val maxAltitude: Int = 1000
    override val maxDepth: Int = 5

    override fun fly() {
        println("$name is flying up to $maxAltitude meters")
    }

    override fun swim() {
        println("$name is swimming up to $maxDepth meters deep")
    }
}
```

### Resolving Interface Conflicts

When multiple interfaces have methods with the same signature:

```kotlin
interface A {
    fun greet() {
        println("Hello from A")
    }
}

interface B {
    fun greet() {
        println("Hello from B")
    }
}

class C : A, B {
    override fun greet() {
        super<A>.greet()
        super<B>.greet()
        println("Hello from C")
    }
}

fun main() {
    C().greet()
    // Output:
    // Hello from A
    // Hello from B
    // Hello from C
}
```

### Interface Inheritance

Interfaces can extend other interfaces:

```kotlin
interface Named {
    val name: String
}

interface Identifiable : Named {
    val id: Long
}

interface Entity : Identifiable {
    val createdAt: Long

    fun getDisplayName(): String = "$name (#$id)"
}

data class User(
    override val id: Long,
    override val name: String,
    override val createdAt: Long,
    val email: String
) : Entity
```

### Functional Interfaces (SAM)

Single Abstract Method interfaces can be implemented with lambdas:

```kotlin
fun interface ClickListener {
    fun onClick(x: Int, y: Int)
}

fun setClickListener(listener: ClickListener) {
    listener.onClick(100, 200)
}

fun main() {
    // Lambda syntax
    setClickListener { x, y ->
        println("Clicked at ($x, $y)")
    }

    // Anonymous object syntax
    setClickListener(object : ClickListener {
        override fun onClick(x: Int, y: Int) {
            println("Clicked at ($x, $y)")
        }
    })
}
```

---

## Data Classes

Data classes are specialized classes designed to hold data. Kotlin automatically generates useful methods based on properties declared in the primary constructor.

### Basic Data Class

```kotlin
data class User(
    val id: Long,
    val username: String,
    val email: String,
    val isActive: Boolean = true
)

fun main() {
    val user = User(1, "johndoe", "john@example.com")
    println(user)
    // Output: User(id=1, username=johndoe, email=john@example.com, isActive=true)
}
```

### Generated Methods

Data classes automatically generate:

1. **`equals()`/`hashCode()`** - Based on primary constructor properties
2. **`toString()`** - Human-readable representation
3. **`copy()`** - Create modified copies
4. **`componentN()`** - For destructuring

```kotlin
data class Point(val x: Int, val y: Int)

fun main() {
    val p1 = Point(1, 2)
    val p2 = Point(1, 2)
    val p3 = Point(3, 4)

    // equals()
    println(p1 == p2)  // true (structural equality)
    println(p1 === p2) // false (referential equality)
    println(p1 == p3)  // false

    // hashCode() - equal objects have same hash
    println(p1.hashCode() == p2.hashCode()) // true

    // toString()
    println(p1) // Point(x=1, y=2)

    // copy() - create modified copies
    val p4 = p1.copy(x = 10)
    println(p4) // Point(x=10, y=2)

    val p5 = p1.copy(x = 5, y = 5)
    println(p5) // Point(x=5, y=5)

    // Destructuring with componentN()
    val (x, y) = p1
    println("x=$x, y=$y") // x=1, y=2
}
```

### Data Class Requirements

- Primary constructor must have at least one parameter
- All primary constructor parameters must be `val` or `var`
- Cannot be abstract, open, sealed, or inner

### Properties Outside Constructor

Properties declared outside the primary constructor are not included in generated methods:

```kotlin
data class Person(val name: String, val age: Int) {
    var nickname: String = ""  // Not in equals/hashCode/toString/copy
}

fun main() {
    val p1 = Person("Alice", 30)
    val p2 = Person("Alice", 30)

    p1.nickname = "Ali"
    p2.nickname = "Alice"

    println(p1 == p2) // true - nickname not compared
    println(p1)       // Person(name=Alice, age=30) - nickname not shown
}
```

### Data Classes with Complex Types

```kotlin
data class Order(
    val id: String,
    val items: List<OrderItem>,
    val customer: Customer,
    val createdAt: Long = System.currentTimeMillis()
)

data class OrderItem(
    val productId: String,
    val quantity: Int,
    val price: Double
)

data class Customer(
    val id: String,
    val name: String,
    val email: String
)

fun main() {
    val order = Order(
        id = "ORD-001",
        items = listOf(
            OrderItem("PROD-1", 2, 29.99),
            OrderItem("PROD-2", 1, 49.99)
        ),
        customer = Customer("CUST-1", "John Doe", "john@example.com")
    )

    // Deep copy with modifications
    val modifiedOrder = order.copy(
        items = order.items + OrderItem("PROD-3", 1, 19.99)
    )

    println(modifiedOrder.items.size) // 3
}
```

### Destructuring Declarations

Use destructuring with data classes in various contexts:

```kotlin
data class Coordinates(val lat: Double, val lng: Double)

fun main() {
    val coords = Coordinates(40.7128, -74.0060)

    // Variable destructuring
    val (latitude, longitude) = coords

    // In loops
    val locations = listOf(
        Coordinates(40.7128, -74.0060),
        Coordinates(34.0522, -118.2437),
        Coordinates(51.5074, -0.1278)
    )

    for ((lat, lng) in locations) {
        println("Location: $lat, $lng")
    }

    // In lambdas
    locations.forEach { (lat, lng) ->
        println("Lat: $lat, Lng: $lng")
    }

    // Ignore components with underscore
    val (_, lng) = coords
    println("Longitude only: $lng")
}
```

---

## Sealed Classes

Sealed classes represent restricted class hierarchies where all subclasses are known at compile time. This enables exhaustive `when` expressions and type-safe state modeling.

### Basic Sealed Class

```kotlin
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String, val cause: Throwable? = null) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

fun <T> handleResult(result: Result<T>) {
    when (result) {
        is Result.Success -> println("Success: ${result.data}")
        is Result.Error -> println("Error: ${result.message}")
        Result.Loading -> println("Loading...")
        // No else needed - compiler knows all cases
    }
}

fun main() {
    handleResult(Result.Success("Data loaded"))
    handleResult(Result.Error("Network error"))
    handleResult(Result.Loading)
}
```

### Sealed Class vs Enum

| Feature | Enum | Sealed Class |
|---------|------|--------------|
| Instances | Single instance per constant | Multiple instances possible |
| State | Each constant has same structure | Subclasses can have different properties |
| Hierarchy | Flat | Can have nested hierarchies |

```kotlin
// Enum - all variants have same structure
enum class Color(val rgb: Int) {
    RED(0xFF0000),
    GREEN(0x00FF00),
    BLUE(0x0000FF)
}

// Sealed class - variants have different structures
sealed class NetworkState {
    object Disconnected : NetworkState()
    object Connecting : NetworkState()
    data class Connected(val ip: String, val speed: Int) : NetworkState()
    data class Error(val code: Int, val message: String) : NetworkState()
}
```

### Real-World Example: UI State

```kotlin
sealed class UiState<out T> {
    object Initial : UiState<Nothing>()
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val exception: Throwable) : UiState<Nothing>()

    val isLoading: Boolean get() = this is Loading
    val isError: Boolean get() = this is Error

    fun getOrNull(): T? = (this as? Success)?.data
}

class UserViewModel {
    private var _state: UiState<User> = UiState.Initial
    val state: UiState<User> get() = _state

    suspend fun loadUser(id: String) {
        _state = UiState.Loading
        _state = try {
            val user = fetchUser(id)
            UiState.Success(user)
        } catch (e: Exception) {
            UiState.Error(e)
        }
    }

    private suspend fun fetchUser(id: String): User {
        // Simulate network call
        return User(1, "John", "john@example.com", true)
    }
}

// In UI layer
fun render(state: UiState<User>) {
    when (state) {
        UiState.Initial -> showEmptyState()
        UiState.Loading -> showLoadingSpinner()
        is UiState.Success -> showUser(state.data)
        is UiState.Error -> showError(state.exception.message)
    }
}

fun showEmptyState() = println("No data yet")
fun showLoadingSpinner() = println("Loading...")
fun showUser(user: User) = println("User: $user")
fun showError(message: String?) = println("Error: $message")
```

### Sealed Interfaces

Kotlin also supports sealed interfaces:

```kotlin
sealed interface Command {
    data class Execute(val action: String) : Command
    data class Undo(val steps: Int) : Command
    data class Redo(val steps: Int) : Command
    object Save : Command
    object Load : Command
}

// A class can implement multiple sealed interfaces
sealed interface Loggable {
    fun log(): String
}

data class ExecuteCommand(val action: String) : Command, Loggable {
    override fun log() = "Executing: $action"
}
```

### Nested Sealed Classes

```kotlin
sealed class Expression {
    data class Constant(val value: Double) : Expression()
    data class Variable(val name: String) : Expression()

    sealed class Binary : Expression() {
        abstract val left: Expression
        abstract val right: Expression

        data class Add(override val left: Expression, override val right: Expression) : Binary()
        data class Subtract(override val left: Expression, override val right: Expression) : Binary()
        data class Multiply(override val left: Expression, override val right: Expression) : Binary()
        data class Divide(override val left: Expression, override val right: Expression) : Binary()
    }

    sealed class Unary : Expression() {
        abstract val operand: Expression

        data class Negate(override val operand: Expression) : Unary()
        data class Sqrt(override val operand: Expression) : Unary()
    }
}

fun evaluate(expr: Expression, variables: Map<String, Double> = emptyMap()): Double {
    return when (expr) {
        is Expression.Constant -> expr.value
        is Expression.Variable -> variables[expr.name] ?: error("Unknown variable: ${expr.name}")
        is Expression.Binary.Add -> evaluate(expr.left, variables) + evaluate(expr.right, variables)
        is Expression.Binary.Subtract -> evaluate(expr.left, variables) - evaluate(expr.right, variables)
        is Expression.Binary.Multiply -> evaluate(expr.left, variables) * evaluate(expr.right, variables)
        is Expression.Binary.Divide -> evaluate(expr.left, variables) / evaluate(expr.right, variables)
        is Expression.Unary.Negate -> -evaluate(expr.operand, variables)
        is Expression.Unary.Sqrt -> kotlin.math.sqrt(evaluate(expr.operand, variables))
    }
}

fun main() {
    // Expression: sqrt(x^2 + y^2)
    val expr = Expression.Unary.Sqrt(
        Expression.Binary.Add(
            Expression.Binary.Multiply(
                Expression.Variable("x"),
                Expression.Variable("x")
            ),
            Expression.Binary.Multiply(
                Expression.Variable("y"),
                Expression.Variable("y")
            )
        )
    )

    val result = evaluate(expr, mapOf("x" to 3.0, "y" to 4.0))
    println(result) // 5.0
}
```

---

## Object Declarations

Object declarations create singleton instances - classes with exactly one instance.

### Basic Singleton

```kotlin
object AppConfig {
    const val APP_NAME = "MyApp"
    const val VERSION = "1.0.0"

    var debugMode: Boolean = false

    fun getFullName(): String = "$APP_NAME v$VERSION"
}

fun main() {
    println(AppConfig.APP_NAME)
    println(AppConfig.getFullName())

    AppConfig.debugMode = true
    println("Debug mode: ${AppConfig.debugMode}")
}
```

### Object Implementing Interface

```kotlin
interface DataSource {
    fun getData(): List<String>
    fun saveData(data: List<String>)
}

object InMemoryDataSource : DataSource {
    private val storage = mutableListOf<String>()

    override fun getData(): List<String> = storage.toList()

    override fun saveData(data: List<String>) {
        storage.clear()
        storage.addAll(data)
    }
}

fun main() {
    InMemoryDataSource.saveData(listOf("one", "two", "three"))
    println(InMemoryDataSource.getData())
}
```

### Object Expressions (Anonymous Objects)

Create one-time objects without declaring a named class:

```kotlin
interface EventListener {
    fun onEvent(event: String)
}

fun registerListener(listener: EventListener) {
    listener.onEvent("Test Event")
}

fun main() {
    // Anonymous object implementing interface
    registerListener(object : EventListener {
        override fun onEvent(event: String) {
            println("Received: $event")
        }
    })

    // Anonymous object with multiple interfaces
    val combined = object : Runnable, EventListener {
        override fun run() {
            println("Running...")
        }

        override fun onEvent(event: String) {
            println("Event: $event")
        }
    }

    // Anonymous object without supertypes
    val adhoc = object {
        val x = 10
        val y = 20
        fun sum() = x + y
    }
    println(adhoc.sum()) // 30
}
```

### Object Inheriting from Class

```kotlin
open class Cache<T> {
    protected val items = mutableMapOf<String, T>()

    open fun get(key: String): T? = items[key]
    open fun put(key: String, value: T) {
        items[key] = value
    }
}

object StringCache : Cache<String>() {
    override fun put(key: String, value: String) {
        super.put(key.lowercase(), value.trim())
    }
}

fun main() {
    StringCache.put("NAME", "  John Doe  ")
    println(StringCache.get("name")) // "John Doe"
}
```

---

## Companion Objects

Companion objects provide a way to define class-level functionality, similar to static members in Java but with more power.

### Basic Companion Object

```kotlin
class MyClass {
    companion object {
        const val CONSTANT = "constant value"

        fun create(): MyClass = MyClass()

        fun doSomething() {
            println("Companion object function")
        }
    }

    fun instanceMethod() {
        println("Instance method")
    }
}

fun main() {
    println(MyClass.CONSTANT)
    MyClass.doSomething()

    val instance = MyClass.create()
    instance.instanceMethod()
}
```

### Named Companion Objects

```kotlin
class Person private constructor(val name: String, val age: Int) {
    companion object Factory {
        fun fromName(name: String): Person = Person(name, 0)

        fun fromNameAndAge(name: String, age: Int): Person {
            require(age >= 0) { "Age must be non-negative" }
            return Person(name, age)
        }
    }
}

fun main() {
    val p1 = Person.fromName("Alice")
    val p2 = Person.Factory.fromNameAndAge("Bob", 25)
    // Both ways work
}
```

### Companion Object with Interface

```kotlin
interface JsonFactory<T> {
    fun fromJson(json: String): T
    fun toJson(obj: T): String
}

data class User(val id: Long, val name: String) {
    companion object : JsonFactory<User> {
        override fun fromJson(json: String): User {
            // Simplified parsing
            val parts = json.removeSurrounding("{", "}").split(",")
            val id = parts[0].substringAfter(":").trim().toLong()
            val name = parts[1].substringAfter(":").trim().removeSurrounding("\"")
            return User(id, name)
        }

        override fun toJson(obj: User): String {
            return """{"id":${obj.id},"name":"${obj.name}"}"""
        }
    }
}

fun main() {
    val json = """{"id":1,"name":"John"}"""
    val user = User.fromJson(json)
    println(user) // User(id=1, name=John)

    println(User.toJson(user)) // {"id":1,"name":"John"}
}
```

### Factory Pattern with Companion Object

```kotlin
sealed class Database {
    abstract fun query(sql: String): List<Map<String, Any>>
    abstract fun execute(sql: String): Int

    class MySqlDatabase(private val connectionString: String) : Database() {
        override fun query(sql: String): List<Map<String, Any>> {
            println("MySQL querying: $sql")
            return emptyList()
        }

        override fun execute(sql: String): Int {
            println("MySQL executing: $sql")
            return 1
        }
    }

    class PostgresDatabase(private val connectionString: String) : Database() {
        override fun query(sql: String): List<Map<String, Any>> {
            println("PostgreSQL querying: $sql")
            return emptyList()
        }

        override fun execute(sql: String): Int {
            println("PostgreSQL executing: $sql")
            return 1
        }
    }

    companion object {
        fun create(type: String, connectionString: String): Database {
            return when (type.lowercase()) {
                "mysql" -> MySqlDatabase(connectionString)
                "postgres", "postgresql" -> PostgresDatabase(connectionString)
                else -> throw IllegalArgumentException("Unknown database type: $type")
            }
        }
    }
}

fun main() {
    val db = Database.create("postgres", "jdbc:postgresql://localhost/mydb")
    db.execute("INSERT INTO users VALUES (1, 'John')")
}
```

### Extension Functions on Companion Objects

```kotlin
class Host(val hostname: String) {
    companion object
}

// Extension function on companion object
fun Host.Companion.localhost(): Host = Host("localhost")

fun Host.Companion.parse(url: String): Host {
    val hostname = url.removePrefix("http://").removePrefix("https://").split("/")[0]
    return Host(hostname)
}

fun main() {
    val local = Host.localhost()
    val parsed = Host.parse("https://example.com/path")

    println(local.hostname)  // localhost
    println(parsed.hostname) // example.com
}
```

### Companion Object with Lazy Initialization

```kotlin
class ResourceManager {
    companion object {
        private val resources: MutableMap<String, Any> by lazy {
            println("Initializing resource map...")
            mutableMapOf()
        }

        fun getResource(key: String): Any? = resources[key]

        fun registerResource(key: String, resource: Any) {
            resources[key] = resource
        }
    }
}

fun main() {
    println("Before accessing resources")
    ResourceManager.registerResource("config", "Configuration data")
    // "Initializing resource map..." prints here
    println(ResourceManager.getResource("config"))
}
```

---

## Advanced Patterns

### Delegation Pattern

Kotlin provides built-in support for the delegation pattern using the `by` keyword:

```kotlin
interface Printer {
    fun print(message: String)
}

class ConsolePrinter : Printer {
    override fun print(message: String) {
        println("Console: $message")
    }
}

class FilePrinter(private val filename: String) : Printer {
    override fun print(message: String) {
        println("Writing to $filename: $message")
    }
}

// Delegate implementation to another object
class PrefixedPrinter(
    private val prefix: String,
    printer: Printer
) : Printer by printer {
    // Can still override specific methods
    override fun print(message: String) {
        // Add prefix then delegate
        (printer as Printer).print("[$prefix] $message")
    }
}

// Multiple delegation
interface Reader {
    fun read(): String
}

class ConsoleReader : Reader {
    override fun read(): String = readLine() ?: ""
}

class IODevice(
    printer: Printer,
    reader: Reader
) : Printer by printer, Reader by reader

fun main() {
    val printer = ConsolePrinter()
    val prefixed = PrefixedPrinter("INFO", printer)
    prefixed.print("Application started")
}
```

### Property Delegation

```kotlin
import kotlin.properties.Delegates
import kotlin.reflect.KProperty

// Observable property
class User {
    var name: String by Delegates.observable("Unknown") { prop, old, new ->
        println("${prop.name} changed from '$old' to '$new'")
    }

    var age: Int by Delegates.vetoable(0) { _, old, new ->
        val valid = new in 0..150
        if (!valid) println("Invalid age: $new, keeping $old")
        valid
    }
}

// Custom delegate
class Trimmed {
    private var value: String = ""

    operator fun getValue(thisRef: Any?, property: KProperty<*>): String = value

    operator fun setValue(thisRef: Any?, property: KProperty<*>, newValue: String) {
        value = newValue.trim()
    }
}

class Form {
    var firstName: String by Trimmed()
    var lastName: String by Trimmed()
}

// Lazy delegate
class ExpensiveResource {
    val data: List<String> by lazy {
        println("Loading expensive data...")
        (1..1000).map { "Item $it" }
    }
}

fun main() {
    val user = User()
    user.name = "Alice"    // Prints: name changed from 'Unknown' to 'Alice'
    user.age = 25          // OK
    user.age = 200         // Prints: Invalid age: 200, keeping 25
    println(user.age)      // 25

    val form = Form()
    form.firstName = "  John  "
    println("'${form.firstName}'") // 'John'
}
```

### Type-Safe Builders (DSL)

```kotlin
// HTML DSL example
@DslMarker
annotation class HtmlDsl

@HtmlDsl
class HTML {
    private val children = mutableListOf<Element>()

    fun head(init: Head.() -> Unit) {
        children.add(Head().apply(init))
    }

    fun body(init: Body.() -> Unit) {
        children.add(Body().apply(init))
    }

    override fun toString(): String = "<html>${children.joinToString("")}</html>"
}

@HtmlDsl
abstract class Element {
    protected val children = mutableListOf<Any>()
    abstract val tagName: String

    operator fun String.unaryPlus() {
        children.add(this)
    }

    override fun toString(): String {
        val content = children.joinToString("")
        return "<$tagName>$content</$tagName>"
    }
}

@HtmlDsl
class Head : Element() {
    override val tagName = "head"

    fun title(text: String) {
        children.add("<title>$text</title>")
    }
}

@HtmlDsl
class Body : Element() {
    override val tagName = "body"

    fun h1(init: H1.() -> Unit) {
        children.add(H1().apply(init))
    }

    fun p(init: P.() -> Unit) {
        children.add(P().apply(init))
    }

    fun div(init: Div.() -> Unit) {
        children.add(Div().apply(init))
    }
}

@HtmlDsl
class H1 : Element() {
    override val tagName = "h1"
}

@HtmlDsl
class P : Element() {
    override val tagName = "p"
}

@HtmlDsl
class Div : Element() {
    override val tagName = "div"

    fun p(init: P.() -> Unit) {
        children.add(P().apply(init))
    }
}

fun html(init: HTML.() -> Unit): HTML = HTML().apply(init)

fun main() {
    val document = html {
        head {
            title("My Page")
        }
        body {
            h1 {
                +"Welcome to Kotlin"
            }
            div {
                p {
                    +"This is a paragraph inside a div."
                }
            }
            p {
                +"This is a standalone paragraph."
            }
        }
    }

    println(document)
}
```

### Generic Classes

```kotlin
// Generic class with type parameter
class Box<T>(var content: T) {
    fun replace(newContent: T): T {
        val old = content
        content = newContent
        return old
    }
}

// Generic class with constraints
class NumberBox<T : Number>(val value: T) {
    fun toDouble(): Double = value.toDouble()
}

// Generic class with multiple type parameters
class Pair<A, B>(val first: A, val second: B) {
    fun swap(): Pair<B, A> = Pair(second, first)

    override fun toString(): String = "($first, $second)"
}

// Covariance (out) - can only produce T
class Producer<out T>(private val value: T) {
    fun get(): T = value
}

// Contravariance (in) - can only consume T
class Consumer<in T> {
    fun accept(value: T) {
        println("Consumed: $value")
    }
}

// Generic functions
fun <T> singletonList(item: T): List<T> = listOf(item)

fun <T : Comparable<T>> List<T>.quickSort(): List<T> {
    if (size <= 1) return this
    val pivot = this[size / 2]
    val less = filter { it < pivot }
    val equal = filter { it == pivot }
    val greater = filter { it > pivot }
    return less.quickSort() + equal + greater.quickSort()
}

fun main() {
    val stringBox = Box("Hello")
    val intBox = Box(42)

    println(stringBox.content)
    println(intBox.replace(100)) // Returns 42

    val numbers = listOf(3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5)
    println(numbers.quickSort()) // [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]
}
```

---

## Best Practices

### Prefer Immutability

```kotlin
// Prefer val over var
data class User(val id: Long, val name: String)  // Good
data class User(var id: Long, var name: String)  // Avoid unless mutation is needed

// Use immutable collections
val items: List<String> = listOf("a", "b", "c")  // Good
val items: MutableList<String> = mutableListOf() // Only when needed
```

### Use Data Classes for DTOs

```kotlin
// Good - automatic equals, hashCode, toString, copy
data class UserDto(
    val id: Long,
    val username: String,
    val email: String
)

// Avoid - manual boilerplate
class UserDto(val id: Long, val username: String, val email: String) {
    override fun equals(other: Any?): Boolean { /* ... */ }
    override fun hashCode(): Int { /* ... */ }
    override fun toString(): String { /* ... */ }
}
```

### Use Sealed Classes for State

```kotlin
// Good - exhaustive when, type-safe
sealed class ViewState {
    object Loading : ViewState()
    data class Success(val data: List<Item>) : ViewState()
    data class Error(val message: String) : ViewState()
}

// Avoid - stringly-typed state
class ViewState(
    val status: String,  // "loading", "success", "error"
    val data: List<Item>?,
    val error: String?
)
```

### Prefer Composition Over Inheritance

```kotlin
// Good - composition with delegation
interface Logger { fun log(msg: String) }
class ConsoleLogger : Logger { /* ... */ }

class Service(private val logger: Logger) {
    fun doWork() {
        logger.log("Working...")
    }
}

// Avoid deep inheritance hierarchies
open class BaseService : Logger { /* ... */ }
open class LoggingService : BaseService() { /* ... */ }
class MyService : LoggingService() { /* ... */ }
```

### Use Meaningful Names

```kotlin
// Good
class OrderProcessor(private val orderRepository: OrderRepository)
data class Customer(val firstName: String, val lastName: String)
fun calculateTotalPrice(items: List<OrderItem>): Double

// Avoid
class OP(private val repo: Any)
data class C(val fn: String, val ln: String)
fun calc(l: List<Any>): Double
```

### Handle Nullability Explicitly

```kotlin
// Good - explicit nullable handling
fun findUser(id: Long): User? {
    return userRepository.find(id)
}

val user = findUser(1) ?: throw UserNotFoundException(1)
val name = user?.name ?: "Unknown"

// Avoid - using !! without proper checks
val user = findUser(1)!!  // May throw NPE
```

---

## Summary

Kotlin's object-oriented programming features combine the best of traditional OOP with modern language innovations:

| Feature | Purpose | Key Benefit |
|---------|---------|-------------|
| **Classes** | Encapsulation | Concise property syntax, primary constructors |
| **Properties** | Data with behavior | Automatic getters/setters, custom accessors |
| **Inheritance** | Code reuse | Final by default, explicit `open` |
| **Interfaces** | Contracts | Default implementations, multiple inheritance |
| **Data Classes** | Value objects | Automatic equals, copy, destructuring |
| **Sealed Classes** | Restricted hierarchies | Exhaustive when, type-safe state |
| **Objects** | Singletons | Thread-safe, lazy initialization |
| **Companion Objects** | Class-level members | Factory methods, constants |

By mastering these concepts, you can write Kotlin code that is:
- **Concise** - Less boilerplate than traditional OOP languages
- **Safe** - Null safety, exhaustive when expressions
- **Expressive** - DSLs, property delegation, extension functions
- **Maintainable** - Clear hierarchies, immutable data structures

Kotlin's OOP features work seamlessly with its functional programming capabilities, allowing you to choose the best paradigm for each situation while maintaining clean, idiomatic code.
