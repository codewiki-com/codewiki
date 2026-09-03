---
title: Kotlin Sealed Classes and Interfaces
description: Master Kotlin sealed classes and sealed interfaces for type-safe pattern matching and restricted hierarchies. Learn best practices, design patterns, and real-world applications for building robust type systems.
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - sealed-classes
  - sealed-interfaces
  - type-safety
  - pattern-matching
  - inheritance
  - design-patterns
  - type-hierarchy
status: imported
origin: old/src/content/docs/kotlin/sealed-classes.en.md
divergence: 0.219
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Kotlin
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---


## Concept Explanation

Sealed classes and sealed interfaces are Kotlin's solution to restricting class hierarchies and enabling exhaustive pattern matching. They allow you to define a fixed set of possible subclasses or implementations, which the compiler can verify at compile-time.

Sealed classes were introduced in early versions of Kotlin, while sealed interfaces were added in Kotlin 1.5 to extend the pattern to interface hierarchies. This feature solves the problem of creating type-safe algebraic data types and discriminated unions, which are common patterns in functional programming.

### The Problem They Solve

In Java or traditional OOP, when you create an open class or interface, anyone can extend it. This creates several challenges:
- You cannot guarantee you've handled all possible subtypes in a `when` expression
- Type-safe pattern matching is difficult to implement
- The compiler cannot warn you if a new subtype invalidates your existing code
- Creating exhaustive `when` expressions requires an `else` clause that might hide bugs

Sealed classes and interfaces enforce a closed hierarchy where:
1. Only classes in the same package (or file, if declared in the same file) can inherit from the sealed type
2. All possible subtypes are known at compile-time
3. The compiler can perform exhaustiveness checking on `when` expressions
4. The code becomes more maintainable and type-safe

### Use Cases

**Sealed Classes:**
- Representing type-safe Result or Either types
- Creating discriminated unions
- Building abstract syntax trees (AST)
- Implementing state machines with finite states
- Creating validated domain models

**Sealed Interfaces:**
- Restricting interface implementation to a known set
- Creating family of related types
- Building plugin systems with controlled extension points
- Defining algebraic data types with multiple interface implementations

---

## Core Principles

### Closed Hierarchy Principle

Sealed types restrict the inheritance chain to a defined set of subclasses/implementations. This differs from open inheritance where anyone can extend a type.

```
Open Class (Java/Traditional):
    OpenClass
    ├── AnyClass (defined anywhere)
    ├── AnotherClass (defined anywhere)
    └── UnknownClass (defined anywhere)

Sealed Class (Kotlin):
    SealedClass
    ├── SubClass1 (same package only)
    ├── SubClass2 (same package only)
    └── SubClass3 (same package only)
    // No external subclasses allowed
```

### Compile-Time Exhaustiveness Checking

When you use a sealed type in a `when` expression, the compiler enforces that all possible subtypes are handled. This prevents the common bug of missing cases.

```kotlin
// Before: Must use else clause to compile
sealed class Result
data class Success(val data: String) : Result()
data class Failure(val error: Exception) : Result()

val result: Result = Success("data")
when (result) {
    is Success -> { }
    is Failure -> { }
    // else -> { } // Required with open classes, optional with sealed
}
```

### Type Safety and Smart Casting

After a successful type check in a `when` branch, the compiler automatically casts the object to the specific subtype (smart casting). Combined with sealed types, this ensures 100% safety.

```kotlin
sealed class Expression

when (expr) {
    is BinaryOp -> expr.left // Smart cast - expr is known to be BinaryOp
    is UnaryOp -> expr.operand // Smart cast - expr is known to be UnaryOp
    is Literal -> expr.value // Smart cast - expr is known to be Literal
}
```

### Encapsulation of Alternatives

Sealed types encapsulate all possible alternative implementations in one place, improving code organization and maintainability.

### ADT (Algebraic Data Type) Support

Sealed classes and interfaces enable functional programming patterns like algebraic data types, which are powerful for domain modeling.

---

## Key Points

### Sealed Class Fundamentals

1. **Declaration**: Use the `sealed` modifier before `class`
2. **Subclasses**: Must be direct children in the same package
3. **Visibility**: Subclasses can be nested, local, or declared at package level
4. **Constructor**: Sealed classes can have constructors (primary or secondary)
5. **Properties**: Can have abstract or concrete properties
6. **Methods**: Can have abstract or concrete methods
7. **Instantiation**: Cannot instantiate sealed classes directly

### Sealed Interface Fundamentals (Kotlin 1.5+)

1. **Declaration**: Use the `sealed` modifier before `interface`
2. **Implementations**: Only specific classes can implement it (same package)
3. **Multiple Inheritance**: Classes can implement multiple sealed interfaces
4. **Mixing**: Can implement both sealed and non-sealed interfaces
5. **No State**: Interfaces cannot have state (same as regular interfaces)

### Inheritance Rules

- Sealed class/interface + direct child in same file/package = valid
- Sealed class/interface + direct child in different file/package = compilation error
- Sealed class/interface + indirect child (subclass of subclass) = allowed anywhere
- Non-sealed subclass can be extended outside the package

### When Expression Exhaustiveness

- With sealed types: `when` expression doesn't require `else` if all subtypes are covered
- Without sealed types: `when` expression requires `else` clause
- Compiler warns if you add new subclasses but forget to update existing `when` expressions

---

## Code Examples

### Example 1: Basic Sealed Class

```kotlin
// Define a sealed class hierarchy for Result type
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Exception) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

// Usage with exhaustive when
fun handleResult(result: Result<String>) {
    when (result) {
        is Result.Success -> println("Success: ${result.data}")
        is Result.Error -> println("Error: ${result.exception.message}")
        is Result.Loading -> println("Loading...")
    }
}

// No else clause needed! Compiler ensures all cases are handled.
```

### Example 2: Sealed Class with Properties and Methods

```kotlin
sealed class Animal(val name: String) {
    abstract fun makeSound()

    class Dog(name: String) : Animal(name) {
        override fun makeSound() = println("$name: Woof!")
    }

    class Cat(name: String) : Animal(name) {
        override fun makeSound() = println("$name: Meow!")
    }

    data class Bird(val wingSpan: Double, val _name: String) : Animal(_name) {
        override fun makeSound() = println("$name: Tweet!")
    }
}

fun describeAnimal(animal: Animal) {
    animal.makeSound()
    when (animal) {
        is Animal.Dog -> println("${animal.name} is a loyal dog")
        is Animal.Cat -> println("${animal.name} is an independent cat")
        is Animal.Bird -> println("${animal.name} has a wingspan of ${animal.wingSpan}m")
    }
}
```

### Example 3: Sealed Interface

```kotlin
// Define a sealed interface for different payment methods
sealed interface PaymentMethod {
    data class CreditCard(val cardNumber: String, val cvv: String) : PaymentMethod
    data class PayPal(val email: String) : PaymentMethod
    data class Bitcoin(val walletAddress: String) : PaymentMethod
}

// Function that accepts sealed interface
fun processPayment(method: PaymentMethod): String {
    return when (method) {
        is PaymentMethod.CreditCard -> "Processing card ${method.cardNumber}"
        is PaymentMethod.PayPal -> "Processing PayPal account ${method.email}"
        is PaymentMethod.Bitcoin -> "Processing Bitcoin wallet ${method.walletAddress}"
    }
}
```

### Example 4: ADT for Expression Tree (Compiler/Parser)

```kotlin
// Algebraic Data Type for representing mathematical expressions
sealed class Expr {
    data class Const(val value: Int) : Expr()
    data class Binary(val left: Expr, val op: String, val right: Expr) : Expr()
    data class Unary(val op: String, val expr: Expr) : Expr()
}

// Evaluate expressions with exhaustive when
fun eval(expr: Expr): Int = when (expr) {
    is Expr.Const -> expr.value
    is Expr.Binary -> {
        val left = eval(expr.left)
        val right = eval(expr.right)
        when (expr.op) {
            "+" -> left + right
            "-" -> left - right
            "*" -> left * right
            "/" -> left / right
            else -> throw IllegalArgumentException("Unknown operator: ${expr.op}")
        }
    }
    is Expr.Unary -> {
        val value = eval(expr.expr)
        when (expr.op) {
            "-" -> -value
            "!" -> if (value != 0) 1 else 0
            else -> throw IllegalArgumentException("Unknown operator: ${expr.op}")
        }
    }
}

// Usage
val expr = Expr.Binary(
    Expr.Const(3),
    "+",
    Expr.Binary(Expr.Const(2), "*", Expr.Const(4))
)
println(eval(expr)) // Output: 11
```

### Example 5: State Machine with Sealed Class

```kotlin
sealed class OrderState {
    object Pending : OrderState()
    object Processing : OrderState()
    data class Shipped(val trackingNumber: String) : OrderState()
    data class Delivered : OrderState()
    data class Cancelled(val reason: String) : OrderState()
}

class Order(var state: OrderState = OrderState.Pending) {
    fun nextState(input: String = ""): Boolean {
        state = when (state) {
            OrderState.Pending -> OrderState.Processing
            OrderState.Processing -> OrderState.Shipped("TRK${System.currentTimeMillis()}")
            is OrderState.Shipped -> OrderState.Delivered
            is OrderState.Delivered -> return false // Cannot transition
            is OrderState.Cancelled -> return false // Terminal state
        }
        return true
    }

    fun getDescription(): String = when (state) {
        OrderState.Pending -> "Order is waiting to be processed"
        OrderState.Processing -> "Order is being processed"
        is OrderState.Shipped -> "Order has been shipped with tracking: ${state.trackingNumber}"
        is OrderState.Delivered -> "Order has been delivered"
        is OrderState.Cancelled -> "Order was cancelled: ${state.reason}"
    }
}
```

### Example 6: Generic Sealed Class (Either Type)

```kotlin
// Right-biased Either type for error handling
sealed class Either<out L, out R> {
    data class Left<L>(val value: L) : Either<L, Nothing>()
    data class Right<R>(val value: R) : Either<Nothing, R>()

    inline fun <T> fold(
        onLeft: (L) -> T,
        onRight: (R) -> T
    ): T = when (this) {
        is Left -> onLeft(value)
        is Right -> onRight(value)
    }

    inline fun <T> map(transform: (R) -> T): Either<L, T> = when (this) {
        is Left -> this
        is Right -> Right(transform(value))
    }

    inline fun <T> mapLeft(transform: (L) -> T): Either<T, R> = when (this) {
        is Left -> Left(transform(value))
        is Right -> this
    }

    inline fun <T> flatMap(transform: (R) -> Either<L, T>): Either<L, T> = when (this) {
        is Left -> this
        is Right -> transform(value)
    }
}

// Usage
fun parseInt(str: String): Either<String, Int> {
    return try {
        Either.Right(str.toInt())
    } catch (e: Exception) {
        Either.Left("Invalid integer: ${e.message}")
    }
}

val result = parseInt("42")
    .map { it * 2 }
    .fold(
        onLeft = { error -> "Error: $error" },
        onRight = { value -> "Result: $value" }
    )
println(result) // Output: Result: 84
```

### Example 7: Multiple Sealed Interfaces with Common Implementations

```kotlin
sealed interface Event
sealed interface Loggable

// A class can implement multiple sealed interfaces
data class UserCreated(val userId: String, val email: String) : Event, Loggable
data class UserDeleted(val userId: String) : Event, Loggable
data class OrderPlaced(val orderId: String, val amount: Double) : Event

fun handleEvent(event: Event) {
    when (event) {
        is UserCreated -> println("User created: ${event.email}")
        is UserDeleted -> println("User deleted: ${event.userId}")
        is OrderPlaced -> println("Order placed: ${event.amount}")
    }
}

fun logEvent(loggable: Loggable) {
    when (loggable) {
        is UserCreated -> println("Logged: User created event")
        is UserDeleted -> println("Logged: User deleted event")
    }
}
```

---

## Best Practices

### Use Sealed Classes for Data-Centric Hierarchies

Prefer sealed classes when your hierarchy represents different forms of data:

```kotlin
// Good: Sealed class for different response types
sealed class ApiResponse<T> {
    data class Success<T>(val data: T) : ApiResponse<T>()
    data class Error<T>(val code: Int, val message: String) : ApiResponse<T>()
    class Loading<T> : ApiResponse<T>()
}

// Less ideal: Generic open class requires else clause
open class Response<T>
```

### Use Sealed Interfaces for Behavior Contracts

Prefer sealed interfaces when you need to restrict implementations but allow behavior flexibility:

```kotlin
// Good: Sealed interface for different storage backends
sealed interface StorageBackend {
    suspend fun save(key: String, value: String)
    suspend fun load(key: String): String?
    suspend fun delete(key: String)
}

data class MemoryStorage(val cache: MutableMap<String, String>) : StorageBackend {
    // Implementation
}

class FileStorage(val directory: File) : StorageBackend {
    // Implementation
}
```

### Combine Sealed Classes with Data Classes

Use `data class` for sealed subclasses when you need value equality and automatic toString/hashCode:

```kotlin
sealed class Result<T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Failure<T>(val error: Exception) : Result<T>()
}

// Automatically get:
// - equals() and hashCode() based on value
// - toString() showing property values
// - copy() for creating modified copies
val result1 = Result.Success("data")
val result2 = Result.Success("data")
println(result1 == result2) // true - value equality
```

### Design for Exhaustiveness

Organize sealed hierarchies so the compiler can enforce exhaustiveness checking:

```kotlin
// Good: Sealed interface for UI State with all cases covered
sealed interface UiState {
    object Loading : UiState
    data class Loaded(val items: List<String>) : UiState
    data class Error(val message: String) : UiState
}

// Every branch is required
fun renderUi(state: UiState) {
    when (state) {
        UiState.Loading -> { /* render loading */ }
        is UiState.Loaded -> { /* render items */ }
        is UiState.Error -> { /* render error */ }
    }
    // No else needed - compiler ensures completeness
}
```

### Leverage Smart Casting

Take advantage of automatic type narrowing after type checks:

```kotlin
sealed class Shape {
    abstract val area: Double
}

data class Circle(val radius: Double) : Shape() {
    override val area = Math.PI * radius * radius
    fun circumference() = 2 * Math.PI * radius
}

data class Rectangle(val width: Double, val height: Double) : Shape() {
    override val area = width * height
    fun diagonal() = Math.sqrt(width * width + height * height)
}

fun shapeInfo(shape: Shape) {
    println("Area: ${shape.area}")

    when (shape) {
        is Circle -> {
            // Smart cast - shape is automatically Circle here
            println("Circumference: ${shape.circumference()}")
        }
        is Rectangle -> {
            // Smart cast - shape is automatically Rectangle here
            println("Diagonal: ${shape.diagonal()}")
        }
    }
}
```

### Use Object for Singleton Subclasses

When a sealed subclass has no state, use `object` instead of `class`:

```kotlin
// Good: Objects for stateless subclasses
sealed class Result<T> {
    object Idle : Result<Nothing>()
    object Loading : Result<Nothing>()
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Exception) : Result<Nothing>()
}

// Less ideal: Classes with empty constructors
sealed class Result<T> {
    class Idle : Result<Nothing>()  // Creates new instance each time
    class Loading : Result<Nothing>() // Creates new instance each time
}
```

### Consider Extension Functions for Behavior

Add behavior through extension functions rather than nesting methods:

```kotlin
sealed class HttpResponse<T> {
    data class Success<T>(val body: T, val headers: Map<String, String>) : HttpResponse<T>()
    data class Error<T>(val statusCode: Int, val message: String) : HttpResponse<T>()
}

// Add behavior as extension functions
fun <T> HttpResponse<T>.getStatusMessage(): String = when (this) {
    is HttpResponse.Success -> "Success (200)"
    is HttpResponse.Error -> "Error (${statusCode})"
}

fun <T> HttpResponse<T>.isSuccessful(): Boolean = this is HttpResponse.Success

val response: HttpResponse<String> = HttpResponse.Success("data", emptyMap())
println(response.getStatusMessage()) // "Success (200)"
println(response.isSuccessful()) // true
```

### Organize Sealed Types Logically

Group related sealed types together for better code organization:

```kotlin
// Good: Related sealed types in the same file/package
sealed interface DatabaseOperation
data class Insert(val table: String, val values: Map<String, Any>) : DatabaseOperation
data class Update(val table: String, val where: String, val values: Map<String, Any>) : DatabaseOperation
data class Delete(val table: String, val where: String) : DatabaseOperation

sealed interface DatabaseResult
data class OperationSuccess(val rowsAffected: Int) : DatabaseResult
data class OperationError(val code: Int, val message: String) : DatabaseResult
object OperationPending : DatabaseResult
```

---

## Common Pitfalls

### Pitfall 1: Forgetting sealed Modifier

```kotlin
// Wrong: Missing sealed keyword - allows external subclasses
open class Result<T> {
    data class Success<T>(val value: T) : Result<T>()
}

// In another file
class CustomResult : Result<String>() { } // Allowed! Loses type safety

// Correct: Use sealed modifier
sealed class Result<T> {
    data class Success<T>(val value: T) : Result<T>()
}

// In another file
class CustomResult : Result<String>() { } // Compilation error - cannot extend sealed class
```

### Pitfall 2: Forgetting when Expression Completeness

```kotlin
sealed class Status {
    object Active : Status()
    object Inactive : Status()
    data class Pending(val reason: String) : Status()
}

// Wrong: Adding new Status subclass but forgetting to update when expressions
class ProcessingStatus : Status() // Oops, sealed!

// Later, existing when expressions are incomplete
fun handleStatus(status: Status) {
    when (status) {
        is Status.Active -> {}
        is Status.Inactive -> {}
        is Status.Pending -> {}
        // Missing ProcessingStatus - but compiler forces you to add it!
    }
}
```

### Pitfall 3: Nested Sealed Subclasses

```kotlin
// Error: Nested sealed class - not allowed
sealed class Outer {
    sealed class Inner { // Compilation error!
        class DeepChild : Inner()
    }
}

// Correct: Direct children only
sealed class Outer {
    data class Child1(val value: String) : Outer()
    class Child2 : Outer()
}
```

### Pitfall 4: Trying to Instantiate Sealed Class

```kotlin
sealed class Result<T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
}

// Wrong: Cannot instantiate sealed class directly
val result: Result<String> = Result("data") // Compilation error!

// Correct: Use concrete subclass
val result: Result<String> = Result.Success("data")
```

### Pitfall 5: Public Visibility on Package-Private Sealed Classes

```kotlin
// Internal sealed class but public subclass - confusing
internal sealed class InternalResult {
    public data class Success(val data: String) : InternalResult() // Odd!
}

// Better: Match visibility levels
internal sealed class InternalResult {
    internal data class Success(val data: String) : InternalResult()
}
```

### Pitfall 6: Mixing Sealed and Non-sealed in Hierarchy

```kotlin
sealed class Animal {
    class Dog : Animal() // Sealed subclass
}

// In another file - this is allowed but breaks sealed intent
class Cat : Animal.Dog() { } // Can extend the already-sealed subclass

// Fix: Make subclasses final if they shouldn't be extended
sealed class Animal {
    final class Dog : Animal() // No further extension
}
```

### Pitfall 7: Over-using sealed for Simple Hierarchies

```kotlin
// Overkill: Sealed class for simple closed set
sealed class Color {
    object Red : Color()
    object Green : Color()
    object Blue : Color()
}

// Better: Use enum when values are simple constants
enum class Color {
    RED, GREEN, BLUE
}

// Use sealed when subclasses have different structures
sealed class Color {
    object Red : Color()
    data class Custom(val hex: String) : Color()
}
```

---

## Performance Considerations

### No Runtime Overhead

Sealed classes have zero runtime overhead compared to open classes:

```kotlin
sealed class Result<T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
}

// Sealed is compile-time only - identical bytecode to open class
open class OpenResult<T>

// Both compile to identical class hierarchies in bytecode
// The "sealed" information is only used during compilation for type checking
```

### When Expression Compilation

The compiler optimizes `when` expressions with sealed types:

```kotlin
sealed class Status { object A : Status(); object B : Status(); object C : Status() }

// Sealed when expressions compile to tableswitch or lookupswitch bytecode
// Very efficient - similar to switch statements in Java
when (status) {
    Status.A -> {}
    Status.B -> {}
    Status.C -> {}
}

// Without sealed, requires if-else chain (less efficient)
open class OpenStatus
when (status) {
    is A -> {}
    is B -> {}
    is C -> {}
    else -> {} // Required
}
```

### Type Erasure

Sealed interface type parameters are erased at runtime (like Java generics):

```kotlin
sealed interface Container<T> {
    val value: T
}

// At runtime, T is erased - you cannot access T's type
// But sealed allows compile-time checking of implementations

// These are the same at runtime but different at compile-time:
val intContainer: Container<Int>
val stringContainer: Container<String>
```

### Pattern Matching Optimization

The Kotlin compiler may optimize pattern matching with sealed types:

```kotlin
sealed class Expr {
    data class Num(val value: Int) : Expr()
    data class Add(val left: Expr, val right: Expr) : Expr()
}

// Compiler can optimize this to direct field access
// No virtual method dispatch needed for type check
fun eval(expr: Expr): Int = when (expr) {
    is Expr.Num -> expr.value
    is Expr.Add -> eval(expr.left) + eval(expr.right)
}
```

### Memory Considerations

Sealed subclasses follow standard object layout rules:

```kotlin
sealed class Base(val shared: String) {
    data class Derived(val specific: Int, val _shared: String) : Base(_shared)
}

// Memory layout is identical to any inheritance
// No special sealed class overhead
val obj = Base.Derived(42, "text")
// Object size = object header + shared string ref + int + string ref
```

### When Exhaustiveness vs Virtual Dispatch

Choose sealed for best performance when exhaustiveness is important:

```kotlin
sealed interface Visitor {
    fun visit(node: Node)
}

// Sealed allows compiler to ensure all node types are handled
// No performance penalty for sealed

// Compare with open interface - requires virtual dispatch + possible missing cases
open interface OpenVisitor {
    fun visit(node: Node)
}
```

---

## Real-world Scenarios

### Scenario 1: HTTP API Response Handling

```kotlin
sealed class ApiResponse<T> {
    data class Success<T>(
        val data: T,
        val statusCode: Int = 200
    ) : ApiResponse<T>()

    data class ClientError<T>(
        val statusCode: Int,
        val message: String,
        val details: Map<String, Any> = emptyMap()
    ) : ApiResponse<T>()

    data class ServerError<T>(
        val statusCode: Int,
        val message: String,
        val retryAfter: Long? = null
    ) : ApiResponse<T>()

    data class NetworkError<T>(
        val cause: Throwable
    ) : ApiResponse<T>()
}

// Repository function using sealed response
suspend fun fetchUsers(): ApiResponse<List<User>> {
    return try {
        val response = apiClient.getUsers()
        when {
            response.isSuccessful -> ApiResponse.Success(response.body()!!)
            response.code() in 400..499 -> ApiResponse.ClientError(
                response.code(),
                response.message()
            )
            response.code() in 500..599 -> ApiResponse.ServerError(
                response.code(),
                response.message()
            )
            else -> ApiResponse.ClientError(response.code(), "Unknown error")
        }
    } catch (e: IOException) {
        ApiResponse.NetworkError(e)
    }
}

// UI handling with guaranteed exhaustiveness
fun renderApiResponse(response: ApiResponse<List<User>>) {
    when (response) {
        is ApiResponse.Success -> {
            // Display users
            updateUserList(response.data)
        }
        is ApiResponse.ClientError -> {
            // Show user-friendly error
            showToast("Invalid request: ${response.message}")
        }
        is ApiResponse.ServerError -> {
            // Show server error and retry option
            showDialog("Server error. ${response.message}")
        }
        is ApiResponse.NetworkError -> {
            // Handle offline mode
            showError("No internet connection")
        }
    }
}
```

### Scenario 2: Permission System

```kotlin
sealed interface Permission {
    object ReadFile : Permission
    object WriteFile : Permission
    object DeleteFile : Permission
    data class CustomPermission(val name: String) : Permission
}

sealed interface PermissionCheck {
    object Granted : PermissionCheck
    object Denied : PermissionCheck
    data class RequiresExplanation(val reason: String) : PermissionCheck
}

class PermissionManager {
    private val grantedPermissions = mutableSetOf<Permission>()

    fun checkPermission(permission: Permission): PermissionCheck {
        return when {
            grantedPermissions.contains(permission) -> PermissionCheck.Granted
            permission == Permission.ReadFile -> {
                PermissionCheck.RequiresExplanation("Need to read your files")
            }
            else -> PermissionCheck.Denied
        }
    }

    fun handlePermissionResult(
        permission: Permission,
        check: PermissionCheck
    ) {
        when (check) {
            PermissionCheck.Granted -> grantedPermissions.add(permission)
            PermissionCheck.Denied -> { /* handle denial */ }
            is PermissionCheck.RequiresExplanation -> {
                // Show explanation dialog
            }
        }
    }
}
```

### Scenario 3: Database Query DSL

```kotlin
sealed interface QueryPart {
    data class Select(val columns: List<String>) : QueryPart
    data class From(val table: String) : QueryPart
    data class Where(val condition: String) : QueryPart
    data class OrderBy(val column: String, val ascending: Boolean) : QueryPart
    data class Limit(val count: Int) : QueryPart
}

class QueryBuilder {
    private val parts = mutableListOf<QueryPart>()

    fun select(vararg columns: String) = apply {
        parts.add(QueryPart.Select(columns.toList()))
    }

    fun from(table: String) = apply {
        parts.add(QueryPart.From(table))
    }

    fun where(condition: String) = apply {
        parts.add(QueryPart.Where(condition))
    }

    fun orderBy(column: String, ascending: Boolean = true) = apply {
        parts.add(QueryPart.OrderBy(column, ascending))
    }

    fun limit(count: Int) = apply {
        parts.add(QueryPart.Limit(count))
    }

    fun build(): String {
        val sql = StringBuilder()

        for (part in parts) {
            when (part) {
                is QueryPart.Select -> sql.append("SELECT ${part.columns.joinToString(", ")} ")
                is QueryPart.From -> sql.append("FROM ${part.table} ")
                is QueryPart.Where -> sql.append("WHERE ${part.condition} ")
                is QueryPart.OrderBy -> {
                    val direction = if (part.ascending) "ASC" else "DESC"
                    sql.append("ORDER BY ${part.column} $direction ")
                }
                is QueryPart.Limit -> sql.append("LIMIT ${part.count}")
            }
        }

        return sql.toString().trim()
    }
}

// Usage
val query = QueryBuilder()
    .select("id", "name", "email")
    .from("users")
    .where("age > 18")
    .orderBy("name")
    .limit(10)
    .build()
// Output: SELECT id, name, email FROM users WHERE age > 18 ORDER BY name ASC LIMIT 10
```

### Scenario 4: State Management in MVVM

```kotlin
sealed class UserLoadingState {
    object Idle : UserLoadingState()
    object Loading : UserLoadingState()
    data class Loaded(val user: User) : UserLoadingState()
    data class Error(val exception: Exception) : UserLoadingState()
}

class UserViewModel : ViewModel() {
    private val _state = MutableLiveData<UserLoadingState>(UserLoadingState.Idle)
    val state: LiveData<UserLoadingState> = _state

    fun loadUser(userId: String) {
        _state.value = UserLoadingState.Loading
        viewModelScope.launch {
            try {
                val user = userRepository.getUser(userId)
                _state.value = UserLoadingState.Loaded(user)
            } catch (e: Exception) {
                _state.value = UserLoadingState.Error(e)
            }
        }
    }
}

// In Fragment/Activity
viewModel.state.observe(this) { state ->
    when (state) {
        is UserLoadingState.Idle -> hideContent()
        is UserLoadingState.Loading -> showLoadingSpinner()
        is UserLoadingState.Loaded -> displayUserInfo(state.user)
        is UserLoadingState.Error -> showErrorMessage(state.exception.message)
    }
}
```

### Scenario 5: Validation Results

```kotlin
sealed interface ValidationResult {
    object Valid : ValidationResult
    data class Invalid(val errors: List<ValidationError>) : ValidationResult
}

data class ValidationError(val field: String, val message: String)

sealed interface ValidationError {
    data class EmptyField(val fieldName: String) : ValidationError
    data class InvalidFormat(val fieldName: String, val format: String) : ValidationError
    data class TooShort(val fieldName: String, val minLength: Int) : ValidationError
}

class FormValidator {
    fun validateEmail(email: String): ValidationResult {
        val errors = mutableListOf<ValidationError>()

        if (email.isEmpty()) {
            errors.add(ValidationError.EmptyField("email"))
        } else if (!email.contains("@")) {
            errors.add(ValidationError.InvalidFormat("email", "name@domain.com"))
        }

        return if (errors.isEmpty()) ValidationResult.Valid
               else ValidationResult.Invalid(errors)
    }
}

fun handleValidation(result: ValidationResult) {
    when (result) {
        ValidationResult.Valid -> submitForm()
        is ValidationResult.Invalid -> {
            result.errors.forEach { error ->
                when (error) {
                    is ValidationError.EmptyField ->
                        showFieldError(error.fieldName, "This field is required")
                    is ValidationError.InvalidFormat ->
                        showFieldError(error.fieldName, "Invalid format: ${error.format}")
                    is ValidationError.TooShort ->
                        showFieldError(error.fieldName, "Must be at least ${error.minLength} characters")
                }
            }
        }
    }
}
```

---

## Interview Points

### Q1: What is the difference between a sealed class and an abstract class?

**Answer:**
- **Abstract Class**: Allows any number of unknown subclasses anywhere in your codebase
- **Sealed Class**: Restricts inheritance to a known, fixed set of classes in the same package

Abstract classes are more flexible but less type-safe. Sealed classes enforce a closed hierarchy that the compiler can verify.

```kotlin
// Abstract: Anyone can extend
abstract class AbstractAnimal { }
class Dog : AbstractAnimal() // OK
class CustomAnimal : AbstractAnimal() // OK - defined anywhere

// Sealed: Only specific subclasses
sealed class SealedAnimal { }
class Cat : SealedAnimal() // OK - in same package/file
// In different file
class CustomAnimal : SealedAnimal() // Error!
```

### Q2: Why use sealed interfaces instead of sealed classes?

**Answer:**
Sealed interfaces provide the exhaustiveness benefits of sealed classes while allowing:
1. Multiple interface implementations on one class
2. More flexible composition over inheritance
3. Better support for mixin patterns

```kotlin
sealed interface Repository
sealed interface Cacheable

class UserRepository : Repository, Cacheable {
    // Can implement multiple sealed interfaces
}
```

### Q3: How does the compiler handle exhaustiveness checking with sealed classes?

**Answer:**
The compiler maintains a list of all direct subclasses of a sealed type at compile-time. When it encounters a `when` expression using the sealed type, it verifies that all subclasses are covered. If new subclasses are added, existing `when` expressions will fail to compile until they're updated.

This prevents the runtime bug where new subtypes break existing code without warning.

### Q4: Can you extend a sealed class subclass outside its package?

**Answer:**
Yes, if the subclass is not marked `final`. While the sealed parent restricts direct extension in other packages, subclasses can be further extended unless explicitly marked final.

```kotlin
sealed class Result<T> {
    open class Error(val message: String) : Result<Nothing>() // Can be extended
}

// In another file
class CustomError(val code: Int, message: String) : Result.Error(message) {
    // This is allowed!
}
```

### Q5: What are the performance implications of sealed classes vs open classes?

**Answer:**
There are no runtime performance differences. The `sealed` modifier is purely a compile-time constraint. Both generate identical bytecode. The compiler may optimize `when` expressions on sealed types to use more efficient bytecode instructions (tableswitch vs lookupswitch), but both are very efficient.

### Q6: When should you use enums vs sealed classes?

**Answer:**
- **Enum**: Use when you have a small, fixed set of simple constant values
- **Sealed Class**: Use when subtypes have different data structures or behavior

```kotlin
// Enum: Simple constants
enum class Color { RED, GREEN, BLUE }

// Sealed: Different structures
sealed class Result<T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Error(val exception: Exception) : Result<Nothing>()
}
```

### Q7: Can sealed classes have mutable state?

**Answer:**
Yes, sealed classes can have mutable properties just like any class. However, for data classes (commonly used as sealed subclasses), it's better to use immutable properties with `val`.

```kotlin
sealed class Mutable {
    data class Data(val immutableField: String, var mutableField: String) : Mutable()
}
```

### Q8: How do sealed interfaces differ from regular interfaces?

**Answer:**
Sealed interfaces restrict which classes can implement them (same package only), enabling exhaustiveness checking. Regular interfaces allow any class to implement them anywhere. The method signatures and behavior contracts are identical; only the implementation restriction differs.

### Q9: What is the relationship between sealed classes and algebraic data types?

**Answer:**
Sealed classes enable algebraic data types (ADTs) - a functional programming pattern where types are composed from a fixed set of constructors. This allows representing data structures and their transformations in a type-safe, composable way.

```kotlin
// ADT: Expression can be one of Const, Binary, or Unary
sealed class Expr {
    data class Const(val value: Int) : Expr()
    data class Binary(val left: Expr, val op: String, val right: Expr) : Expr()
    data class Unary(val op: String, val expr: Expr) : Expr()
}
```

### Q10: Can you have a sealed class without any subclasses?

**Answer:**
Technically yes, but it's pointless since you can never instantiate it and can't extend it. The compiler would flag any `when` expression on such a type as incomplete (no cases to handle). Always define at least one subclass.

---

## Further Reading

### Official Resources
- [Kotlin Sealed Classes Documentation](https://kotlinlang.org/docs/sealed-classes.html)
- [Kotlin Sealed Interfaces (1.5+)](https://kotlinlang.org/docs/sealed-classes.html#sealed-interfaces)
- [Kotlin When Expression](https://kotlinlang.org/docs/control-flow.html#when-expression)
- [Kotlin Pattern Matching](https://kotlinlang.org/docs/pattern-matching.html)

### Related Concepts
- [Kotlin Data Classes](https://kotlinlang.org/docs/data-classes.html) - Often used with sealed classes
- [Kotlin Generics and Type Variance](https://kotlinlang.org/docs/generics.html) - Using sealed with generics
- [Kotlin Enum Classes](https://kotlinlang.org/docs/enum-classes.html) - Alternative to sealed for simple constants
- [Abstract Classes](https://kotlinlang.org/docs/classes.html#abstract-classes) - More flexible alternative

### Design Patterns
- [Algebraic Data Types (ADT)](https://en.wikipedia.org/wiki/Algebraic_data_type) - Functional programming pattern
- [Discriminated Union / Tagged Union](https://en.wikipedia.org/wiki/Tagged_union) - Type theory concept
- [Visitor Pattern with Sealed Classes](https://kotlinlang.org/docs/sealed-classes.html#use-cases-for-sealed-classes)

### Advanced Topics
- [Sealed Classes with Coroutines](https://kotlinlang.org/docs/coroutines-basics.html) - State management patterns
- [Sealed Classes in Arrow-kt](https://arrow-kt.io/) - Functional programming library for Kotlin
- [Result Type Libraries](https://github.com/michaelbull/kotlin-result) - Common sealed class patterns

### Books and Articles
- "Kotlin in Action" - Chapter on Sealed Classes and Pattern Matching
- "Functional Programming in Kotlin" - Using sealed classes for ADTs
- Medium articles on Sealed Classes for Domain-Driven Design
- Blog posts on Sealed Classes for Error Handling Patterns

### Tools and Libraries
- [kotlinx.serialization](https://github.com/Kotlin/kotlinx.serialization) - Serializing sealed classes
- [Arrow](https://arrow-kt.io/) - Functional programming with sealed types
- [KotlinPoet](https://square.github.io/kotlinpoet/) - Code generation involving sealed classes
