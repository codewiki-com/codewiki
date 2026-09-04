---
title: 面向对象编程
description: Kotlin OOP 完整指南，类、继承、接口和数据类
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - Kotlin
  - OOP
  - Classes
  - Inheritance
status: imported
origin: old/src/content/docs/kotlin/oop.zh.md
divergence: 0.23
issues: []
legacy:
  category: Kotlin
  subcategory: Object-Oriented
  order: 3
  lastUpdated: 2026-01-07
---

Kotlin 是一种现代的静态类型语言，在采用面向对象编程的同时引入了强大的功能，以减少样板代码并提高类型安全性。本综合指南涵盖了 Kotlin 中所有基础和高级的 OOP 概念，为实际开发提供实用示例。

---

## 类和对象

在 Kotlin 中，类是面向对象编程的基本构建块。它们将数据和行为封装到可重用的单元中。

### 基本类声明

最简单的类声明只需要 `class` 关键字和名称：

```kotlin
class Empty
```

带有属性和方法的类：

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
    person.introduce() // 输出：Hi, I'm Alice and I'm 28 years old.
}
```

### 创建实例

Kotlin 不使用 `new` 关键字。通过直接调用构造函数来创建对象：

```kotlin
val car = Car()
val user = User("john@example.com")
val point = Point(10, 20)
```

### 类成员

类可以包含：
- **属性**（带有自动 getter/setter 的字段）
- **方法**（操作对象的函数）
- **初始化块**（在对象创建期间运行的代码）
- **嵌套类和内部类**
- **对象声明**（伴生对象）

```kotlin
class BankAccount(val accountNumber: String) {
    // 属性
    var balance: Double = 0.0
        private set

    // 初始化块
    init {
        println("Account $accountNumber created")
    }

    // 方法
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

    // 嵌套类
    class TransactionRecord(val type: String, val amount: Double)
}
```

---

## 属性

Kotlin 中的属性将字段、getter 和 setter 组合到单个声明中。这消除了 Java 中常见的冗长 getter/setter 模式。

### 声明属性

```kotlin
class Rectangle(val width: Int, val height: Int) {
    // 只读计算属性
    val area: Int
        get() = width * height

    // 带有支持字段的只读属性
    val perimeter: Int = 2 * (width + height)

    // 可变属性
    var name: String = "Rectangle"
}
```

### Val vs Var

- `val` 声明只读属性（类似 Java 中的 `final`）
- `var` 声明可变属性

```kotlin
class User(val id: Long) {  // id 在构造后不能更改
    var email: String = ""  // email 可以修改
    var isActive: Boolean = true
}
```

### 自定义 Getter 和 Setter

```kotlin
class Temperature {
    var celsius: Double = 0.0

    // 基于另一个属性的计算属性
    var fahrenheit: Double
        get() = celsius * 9 / 5 + 32
        set(value) {
            celsius = (value - 32) * 5 / 9
        }

    // 在 setter 中带有验证的属性
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
    // 输出：25.0C = 77.0F = 298.15K

    temp.fahrenheit = 100.0
    println("Celsius: ${temp.celsius}") // 输出：Celsius: 37.77...
}
```

### 支持字段

当你需要在自定义访问器中引用实际存储的值时，使用 `field` 标识符：

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

### 延迟初始化属性

对于无法在构造函数中初始化但会在首次使用前设置的属性：

```kotlin
class DatabaseService {
    lateinit var connection: Connection

    fun connect(url: String) {
        connection = DriverManager.getConnection(url)
    }

    fun isConnected(): Boolean = ::connection.isInitialized
}
```

**注意：**`lateinit` 只能用于非空、非原始类型的 `var` 属性。

### 惰性属性

对于应该延迟到首次访问时才执行的昂贵计算：

```kotlin
class DataProcessor {
    val expensiveData: List<String> by lazy {
        println("Computing expensive data...")
        loadDataFromDatabase()
    }

    private fun loadDataFromDatabase(): List<String> {
        // 模拟昂贵操作
        return listOf("data1", "data2", "data3")
    }
}

fun main() {
    val processor = DataProcessor()
    println("Processor created")
    println(processor.expensiveData) // "Computing expensive data..." 在这里打印
    println(processor.expensiveData) // 使用缓存值，无需重新计算
}
```

---

## 构造函数

Kotlin 区分主构造函数（在类头中声明）和次构造函数（在类体中声明）。

### 主构造函数

主构造函数是类头的一部分：

```kotlin
class Person(val name: String, var age: Int)
```

这个简洁的声明创建了一个带有两个属性的类和一个初始化它们的构造函数。

### 带有 Init 块的主构造函数

对于初始化逻辑，使用 `init` 块：

```kotlin
class Person(val name: String, var age: Int) {
    init {
        require(name.isNotBlank()) { "Name cannot be blank" }
        require(age >= 0) { "Age cannot be negative" }
        println("Created person: $name, $age")
    }
}
```

多个 `init` 块按出现顺序执行：

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
// 输出顺序：
// First: Demo
// First init block: Demo
// Second: Demo
// Second init block: Demo
```

### 默认参数值

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
    val conn4 = Connection(port = 3000)  // 命名参数
}
```

### 次构造函数

次构造函数提供创建对象的替代方式：

```kotlin
class Person(val name: String, val age: Int) {
    var email: String = ""
    var phone: String = ""

    // 次构造函数必须委托给主构造函数
    constructor(name: String, age: Int, email: String) : this(name, age) {
        this.email = email
    }

    constructor(name: String, age: Int, email: String, phone: String) : this(name, age, email) {
        this.phone = phone
    }
}
```

### 私有构造函数

使用私有构造函数来控制对象创建（工厂模式）：

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

## 继承

Kotlin 中的类**默认是 final 的**。要允许继承，请将类标记为 `open`。

### 基本继承

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

### 调用父类方法

使用 `super` 关键字调用父类实现：

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

### 抽象类

抽象类不能被实例化，可以包含抽象成员：

```kotlin
abstract class Shape(val name: String) {
    // 抽象属性 - 必须被重写
    abstract val area: Double

    // 抽象方法 - 必须被重写
    abstract fun draw()

    // 具体方法 - 按原样继承
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

### 可见性修饰符

Kotlin 提供四种可见性修饰符：

| 修饰符 | 类成员 | 顶级声明 |
|--------|--------|----------|
| `public`（默认） | 处处可见 | 处处可见 |
| `private` | 仅在类内可见 | 仅在文件内可见 |
| `protected` | 在类和子类中可见 | N/A |
| `internal` | 在同一模块中可见 | 在同一模块中可见 |

```kotlin
open class Base {
    private val privateVal = 1      // 仅在 Base 中
    protected val protectedVal = 2  // Base 和子类
    internal val internalVal = 3    // 同一模块
    val publicVal = 4               // 处处

    protected fun protectedMethod() {
        println("Protected method called")
    }
}

class Derived : Base() {
    fun accessParent() {
        // println(privateVal)    // 错误：private
        println(protectedVal)     // OK：protected 在子类中可访问
        println(internalVal)      // OK
        println(publicVal)        // OK
        protectedMethod()         // OK
    }
}
```

---

## 接口

接口定义类可以实现的契约。Kotlin 接口可以包含抽象方法、默认实现和抽象属性。

### 基本接口

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

### 带有默认实现的接口

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

    // 抽象方法 - 必须被实现
    fun getLogLevel(): Int
}

class FileLogger(private val filename: String) : Logger {
    override val tag: String = "FileLogger"

    override fun getLogLevel(): Int = 2

    override fun log(message: String) {
        // 自定义实现
        println("Writing to $filename: $message")
    }
    // logError 使用默认实现
}
```

### 多接口实现

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

### 解决接口冲突

当多个接口有相同签名的方法时：

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
    // 输出：
    // Hello from A
    // Hello from B
    // Hello from C
}
```

### 接口继承

接口可以扩展其他接口：

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

### 函数式接口（SAM）

单抽象方法接口可以用 lambda 实现：

```kotlin
fun interface ClickListener {
    fun onClick(x: Int, y: Int)
}

fun setClickListener(listener: ClickListener) {
    listener.onClick(100, 200)
}

fun main() {
    // Lambda 语法
    setClickListener { x, y ->
        println("Clicked at ($x, $y)")
    }

    // 匿名对象语法
    setClickListener(object : ClickListener {
        override fun onClick(x: Int, y: Int) {
            println("Clicked at ($x, $y)")
        }
    })
}
```

---

## 数据类

数据类是专门用于保存数据的类。Kotlin 会根据主构造函数中声明的属性自动生成有用的方法。

### 基本数据类

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
    // 输出：User(id=1, username=johndoe, email=john@example.com, isActive=true)
}
```

### 生成的方法

数据类自动生成：

1. **`equals()`/`hashCode()`** - 基于主构造函数属性
2. **`toString()`** - 人类可读的表示
3. **`copy()`** - 创建修改后的副本
4. **`componentN()`** - 用于解构

```kotlin
data class Point(val x: Int, val y: Int)

fun main() {
    val p1 = Point(1, 2)
    val p2 = Point(1, 2)
    val p3 = Point(3, 4)

    // equals()
    println(p1 == p2)  // true（结构相等）
    println(p1 === p2) // false（引用相等）
    println(p1 == p3)  // false

    // hashCode() - 相等的对象有相同的哈希值
    println(p1.hashCode() == p2.hashCode()) // true

    // toString()
    println(p1) // Point(x=1, y=2)

    // copy() - 创建修改后的副本
    val p4 = p1.copy(x = 10)
    println(p4) // Point(x=10, y=2)

    val p5 = p1.copy(x = 5, y = 5)
    println(p5) // Point(x=5, y=5)

    // 使用 componentN() 解构
    val (x, y) = p1
    println("x=$x, y=$y") // x=1, y=2
}
```

### 数据类要求

- 主构造函数必须至少有一个参数
- 所有主构造函数参数必须是 `val` 或 `var`
- 不能是 abstract、open、sealed 或 inner

### 构造函数外的属性

在主构造函数外声明的属性不包含在生成的方法中：

```kotlin
data class Person(val name: String, val age: Int) {
    var nickname: String = ""  // 不在 equals/hashCode/toString/copy 中
}

fun main() {
    val p1 = Person("Alice", 30)
    val p2 = Person("Alice", 30)

    p1.nickname = "Ali"
    p2.nickname = "Alice"

    println(p1 == p2) // true - nickname 不参与比较
    println(p1)       // Person(name=Alice, age=30) - nickname 不显示
}
```

### 带有复杂类型的数据类

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

    // 带修改的深拷贝
    val modifiedOrder = order.copy(
        items = order.items + OrderItem("PROD-3", 1, 19.99)
    )

    println(modifiedOrder.items.size) // 3
}
```

### 解构声明

在各种上下文中使用数据类的解构：

```kotlin
data class Coordinates(val lat: Double, val lng: Double)

fun main() {
    val coords = Coordinates(40.7128, -74.0060)

    // 变量解构
    val (latitude, longitude) = coords

    // 在循环中
    val locations = listOf(
        Coordinates(40.7128, -74.0060),
        Coordinates(34.0522, -118.2437),
        Coordinates(51.5074, -0.1278)
    )

    for ((lat, lng) in locations) {
        println("Location: $lat, $lng")
    }

    // 在 lambda 中
    locations.forEach { (lat, lng) ->
        println("Lat: $lat, Lng: $lng")
    }

    // 用下划线忽略组件
    val (_, lng) = coords
    println("Longitude only: $lng")
}
```

---

## 密封类

密封类表示受限的类层次结构，其中所有子类在编译时都是已知的。这使得 `when` 表达式可以穷尽所有情况，并支持类型安全的状态建模。

### 基本密封类

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
        // 不需要 else - 编译器知道所有情况
    }
}

fun main() {
    handleResult(Result.Success("Data loaded"))
    handleResult(Result.Error("Network error"))
    handleResult(Result.Loading)
}
```

### 密封类 vs 枚举

| 特性 | 枚举 | 密封类 |
|------|------|--------|
| 实例 | 每个常量单个实例 | 可以有多个实例 |
| 状态 | 每个常量结构相同 | 子类可以有不同属性 |
| 层次结构 | 扁平 | 可以有嵌套层次 |

```kotlin
// 枚举 - 所有变体结构相同
enum class Color(val rgb: Int) {
    RED(0xFF0000),
    GREEN(0x00FF00),
    BLUE(0x0000FF)
}

// 密封类 - 变体有不同结构
sealed class NetworkState {
    object Disconnected : NetworkState()
    object Connecting : NetworkState()
    data class Connected(val ip: String, val speed: Int) : NetworkState()
    data class Error(val code: Int, val message: String) : NetworkState()
}
```

### 实际示例：UI 状态

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
        // 模拟网络调用
        return User(1, "John", "john@example.com", true)
    }
}

// 在 UI 层
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

### 密封接口

Kotlin 也支持密封接口：

```kotlin
sealed interface Command {
    data class Execute(val action: String) : Command
    data class Undo(val steps: Int) : Command
    data class Redo(val steps: Int) : Command
    object Save : Command
    object Load : Command
}

// 一个类可以实现多个密封接口
sealed interface Loggable {
    fun log(): String
}

data class ExecuteCommand(val action: String) : Command, Loggable {
    override fun log() = "Executing: $action"
}
```

### 嵌套密封类

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
    // 表达式：sqrt(x^2 + y^2)
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

## 对象声明

对象声明创建单例实例——只有一个实例的类。

### 基本单例

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

### 实现接口的对象

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

### 对象表达式（匿名对象）

创建一次性对象而不声明命名类：

```kotlin
interface EventListener {
    fun onEvent(event: String)
}

fun registerListener(listener: EventListener) {
    listener.onEvent("Test Event")
}

fun main() {
    // 实现接口的匿名对象
    registerListener(object : EventListener {
        override fun onEvent(event: String) {
            println("Received: $event")
        }
    })

    // 带有多个接口的匿名对象
    val combined = object : Runnable, EventListener {
        override fun run() {
            println("Running...")
        }

        override fun onEvent(event: String) {
            println("Event: $event")
        }
    }

    // 没有超类型的匿名对象
    val adhoc = object {
        val x = 10
        val y = 20
        fun sum() = x + y
    }
    println(adhoc.sum()) // 30
}
```

### 从类继承的对象

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

## 伴生对象

伴生对象提供了一种定义类级功能的方式，类似于 Java 中的静态成员，但功能更强大。

### 基本伴生对象

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

### 命名伴生对象

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
    // 两种方式都可以
}
```

### 带有接口的伴生对象

```kotlin
interface JsonFactory<T> {
    fun fromJson(json: String): T
    fun toJson(obj: T): String
}

data class User(val id: Long, val name: String) {
    companion object : JsonFactory<User> {
        override fun fromJson(json: String): User {
            // 简化解析
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

### 使用伴生对象的工厂模式

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

### 伴生对象上的扩展函数

```kotlin
class Host(val hostname: String) {
    companion object
}

// 伴生对象上的扩展函数
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

### 带有惰性初始化的伴生对象

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
    // "Initializing resource map..." 在这里打印
    println(ResourceManager.getResource("config"))
}
```

---

## 高级模式

### 委托模式

Kotlin 使用 `by` 关键字提供对委托模式的内置支持：

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

// 将实现委托给另一个对象
class PrefixedPrinter(
    private val prefix: String,
    printer: Printer
) : Printer by printer {
    // 仍然可以重写特定方法
    override fun print(message: String) {
        // 添加前缀然后委托
        (printer as Printer).print("[$prefix] $message")
    }
}

// 多重委托
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

### 属性委托

```kotlin
import kotlin.properties.Delegates
import kotlin.reflect.KProperty

// 可观察属性
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

// 自定义委托
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

// 惰性委托
class ExpensiveResource {
    val data: List<String> by lazy {
        println("Loading expensive data...")
        (1..1000).map { "Item $it" }
    }
}

fun main() {
    val user = User()
    user.name = "Alice"    // 打印：name changed from 'Unknown' to 'Alice'
    user.age = 25          // OK
    user.age = 200         // 打印：Invalid age: 200, keeping 25
    println(user.age)      // 25

    val form = Form()
    form.firstName = "  John  "
    println("'${form.firstName}'") // 'John'
}
```

### 类型安全构建器（DSL）

```kotlin
// HTML DSL 示例
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

### 泛型类

```kotlin
// 带有类型参数的泛型类
class Box<T>(var content: T) {
    fun replace(newContent: T): T {
        val old = content
        content = newContent
        return old
    }
}

// 带有约束的泛型类
class NumberBox<T : Number>(val value: T) {
    fun toDouble(): Double = value.toDouble()
}

// 带有多个类型参数的泛型类
class Pair<A, B>(val first: A, val second: B) {
    fun swap(): Pair<B, A> = Pair(second, first)

    override fun toString(): String = "($first, $second)"
}

// 协变（out）- 只能产生 T
class Producer<out T>(private val value: T) {
    fun get(): T = value
}

// 逆变（in）- 只能消费 T
class Consumer<in T> {
    fun accept(value: T) {
        println("Consumed: $value")
    }
}

// 泛型函数
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
    println(intBox.replace(100)) // 返回 42

    val numbers = listOf(3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5)
    println(numbers.quickSort()) // [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]
}
```

---

## 最佳实践

### 优先使用不可变性

```kotlin
// 优先使用 val 而不是 var
data class User(val id: Long, val name: String)  // 好
data class User(var id: Long, var name: String)  // 避免，除非需要修改

// 使用不可变集合
val items: List<String> = listOf("a", "b", "c")  // 好
val items: MutableList<String> = mutableListOf() // 仅在需要时使用
```

### 对 DTO 使用数据类

```kotlin
// 好 - 自动 equals、hashCode、toString、copy
data class UserDto(
    val id: Long,
    val username: String,
    val email: String
)

// 避免 - 手动样板代码
class UserDto(val id: Long, val username: String, val email: String) {
    override fun equals(other: Any?): Boolean { /* ... */ }
    override fun hashCode(): Int { /* ... */ }
    override fun toString(): String { /* ... */ }
}
```

### 对状态使用密封类

```kotlin
// 好 - 穷尽 when，类型安全
sealed class ViewState {
    object Loading : ViewState()
    data class Success(val data: List<Item>) : ViewState()
    data class Error(val message: String) : ViewState()
}

// 避免 - 字符串类型的状态
class ViewState(
    val status: String,  // "loading", "success", "error"
    val data: List<Item>?,
    val error: String?
)
```

### 优先使用组合而不是继承

```kotlin
// 好 - 使用委托的组合
interface Logger { fun log(msg: String) }
class ConsoleLogger : Logger { /* ... */ }

class Service(private val logger: Logger) {
    fun doWork() {
        logger.log("Working...")
    }
}

// 避免深层继承层次结构
open class BaseService : Logger { /* ... */ }
open class LoggingService : BaseService() { /* ... */ }
class MyService : LoggingService() { /* ... */ }
```

### 使用有意义的名称

```kotlin
// 好
class OrderProcessor(private val orderRepository: OrderRepository)
data class Customer(val firstName: String, val lastName: String)
fun calculateTotalPrice(items: List<OrderItem>): Double

// 避免
class OP(private val repo: Any)
data class C(val fn: String, val ln: String)
fun calc(l: List<Any>): Double
```

### 显式处理可空性

```kotlin
// 好 - 显式可空处理
fun findUser(id: Long): User? {
    return userRepository.find(id)
}

val user = findUser(1) ?: throw UserNotFoundException(1)
val name = user?.name ?: "Unknown"

// 避免 - 不经过适当检查使用 !!
val user = findUser(1)!!  // 可能抛出 NPE
```

---

## 总结

Kotlin 的面向对象编程特性将传统 OOP 的精华与现代语言创新相结合：

| 特性 | 用途 | 关键优势 |
|------|------|----------|
| **类** | 封装 | 简洁的属性语法，主构造函数 |
| **属性** | 带行为的数据 | 自动 getter/setter，自定义访问器 |
| **继承** | 代码复用 | 默认 final，显式 `open` |
| **接口** | 契约 | 默认实现，多重继承 |
| **数据类** | 值对象 | 自动 equals、copy、解构 |
| **密封类** | 受限层次结构 | 穷尽 when，类型安全状态 |
| **对象** | 单例 | 线程安全，惰性初始化 |
| **伴生对象** | 类级成员 | 工厂方法，常量 |

通过掌握这些概念，你可以编写以下特点的 Kotlin 代码：
- **简洁** - 比传统 OOP 语言更少的样板代码
- **安全** - 空安全，穷尽的 when 表达式
- **表达力强** - DSL，属性委托，扩展函数
- **可维护** - 清晰的层次结构，不可变数据结构

Kotlin 的 OOP 特性与其函数式编程能力无缝协作，允许你为每种情况选择最佳范式，同时保持清晰、惯用的代码。
