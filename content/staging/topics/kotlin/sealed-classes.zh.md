---
title: Kotlin 密封类与密封接口
description: 深入掌握 Kotlin 密封类 (Sealed Class) 和密封接口 (Sealed Interface)，理解受限类层次结构、when 表达式穷尽匹配及其在状态管理、结果处理中的实战应用
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - Kotlin
  - 密封类
  - 模式匹配
  - 类型安全
  - 状态管理
status: imported
origin: old/src/content/docs/kotlin/sealed-classes.zh.md
divergence: 0.219
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Kotlin
  subcategory: 面向对象
  order: 1
  lastUpdated: 2026-01-07
---

密封类 (Sealed Class) 是 Kotlin 类型系统中一个独特而强大的特性。它允许开发者定义受限的类层次结构，确保所有直接子类在编译时已知，从而实现类型安全的模式匹配。

## 概念解释

### 什么是密封类

密封类是一种特殊的抽象类，它限制了哪些类可以继承它。使用 `sealed` 修饰符声明的类，其所有直接子类必须在编译时已知。从 Kotlin 1.5 开始，子类可以定义在同一包的不同文件中（之前版本要求在同一文件中）。

```kotlin
// 定义密封类
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String, val cause: Exception? = null) : Result<Nothing>()
    data object Loading : Result<Nothing>()
}

// 使用 when 表达式处理所有情况
fun handleResult(result: Result<String>) {
    when (result) {
        is Result.Success -> println("成功: ${result.data}")
        is Result.Error -> println("错误: ${result.message}")
        is Result.Loading -> println("加载中...")
        // 无需 else 分支，编译器知道所有子类型
    }
}
```

### 密封类的历史背景

密封类的概念源自函数式编程语言中的代数数据类型 (Algebraic Data Types, ADT)。Scala 率先在 JVM 平台引入了 `sealed` 关键字，Kotlin 随后采用了类似的设计，但进行了更符合 Kotlin 风格的优化。

密封类解决了传统面向对象编程中的一个核心问题：如何在保持开放扩展性的同时，确保类型匹配的完整性。在没有密封类之前，开发者常常需要使用 `else` 分支来处理"不可能"的情况，这不仅冗余，还可能隐藏潜在的逻辑错误。

### 密封类解决的问题

1. **类型安全的模式匹配**：编译器强制要求处理所有可能的子类型
2. **消除冗余的 else 分支**：无需编写处理"不可能"情况的代码
3. **重构安全性**：添加新子类时，编译器会提示所有需要更新的位置
4. **表达有限状态集**：优雅地建模状态机、结果类型、事件等

## 核心原理

### 编译时子类型检查

密封类的核心机制是编译时子类型检查。Kotlin 编译器会追踪密封类的所有直接子类，并在 `when` 表达式中验证是否覆盖了所有情况。

```kotlin
sealed class NetworkState {
    data object Idle : NetworkState()
    data object Loading : NetworkState()
    data class Success<T>(val data: T) : NetworkState()
    data class Error(val message: String) : NetworkState()
}

// 编译器检查 when 表达式的完整性
fun render(state: NetworkState): String = when (state) {
    is NetworkState.Idle -> "等待中"
    is NetworkState.Loading -> "加载中"
    is NetworkState.Success<*> -> "成功: ${state.data}"
    is NetworkState.Error -> "错误: ${state.message}"
    // 所有情况已覆盖，无需 else
}

// 如果遗漏某个分支，编译器会报错：
// 'when' expression must be exhaustive, add necessary 'is Error' branch
```

### 密封类的继承层次

密封类本身是抽象的，不能直接实例化。其子类可以是：

- **数据类 (data class)**：最常用，自动生成 equals、hashCode、toString
- **普通类 (class)**：需要额外逻辑或可变状态时使用
- **对象声明 (object/data object)**：单例，表示无状态的情况
- **嵌套密封类**：创建多层次的类型结构

```kotlin
sealed class UIComponent {
    // 数据类 - 携带数据，不可变
    data class Button(val text: String, val onClick: () -> Unit) : UIComponent()

    // 普通类 - 可变状态
    class TextField(val hint: String) : UIComponent() {
        private var _value: String = ""
        var value: String
            get() = _value
            set(v) { _value = v }
    }

    // 对象声明 - 单例
    data object Divider : UIComponent()

    // 嵌套密封类 - 分组
    sealed class Container : UIComponent() {
        data class Row(val children: List<UIComponent>) : Container()
        data class Column(val children: List<UIComponent>) : Container()
    }
}
```

### 密封接口 (Kotlin 1.5+)

密封接口与密封类类似，但允许类实现多个密封接口：

```kotlin
sealed interface Error {
    val message: String
}

sealed interface Recoverable {
    fun retry(): Boolean
}

// 可以实现多个密封接口
class NetworkError(
    override val message: String,
    val url: String
) : Error, Recoverable {
    override fun retry(): Boolean {
        println("重试连接: $url")
        return true
    }
}

class ValidationError(
    override val message: String,
    val field: String
) : Error {
    // 验证错误不可恢复
}
```

### 子类定义范围

| Kotlin 版本 | 子类定义范围 |
|------------|-------------|
| < 1.1 | 必须是密封类的嵌套类 |
| 1.1 - 1.4 | 同一文件内 |
| >= 1.5 | 同一包内（编译单元） |

```kotlin
// 文件: result/Result.kt
package com.example.result

sealed class Result<out T>

// 文件: result/Success.kt
package com.example.result

data class Success<T>(val data: T) : Result<T>()

// 文件: result/Error.kt
package com.example.result

data class Failure(val error: Throwable) : Result<Nothing>()
```

## 核心要点

### 密封类 vs 枚举类

| 特性 | 枚举类 (enum) | 密封类 (sealed) |
|------|--------------|----------------|
| 实例数量 | 每个常量只有一个实例 | 每个子类可有多个实例 |
| 携带数据 | 所有常量共享相同属性 | 每个子类可有不同属性 |
| 继承 | 不支持 | 支持多层继承 |
| 适用场景 | 固定的无状态常量集 | 有状态的类型集 |

```kotlin
// 枚举：固定常量，无法携带不同数据
enum class Color { RED, GREEN, BLUE }

// 密封类：每个形状携带不同的数据
sealed class Shape {
    data class Circle(val radius: Double) : Shape()
    data class Rectangle(val width: Double, val height: Double) : Shape()
    data class Triangle(val a: Double, val b: Double, val c: Double) : Shape()
}
```

### 密封类 vs 抽象类

```kotlin
// 抽象类：可在任何地方被继承
abstract class Animal {
    abstract fun speak(): String
}

// 任意模块都可以添加新的 Animal 子类
class Dog : Animal() {
    override fun speak() = "汪汪"
}

// 密封类：继承受限于同一包
sealed class PaymentMethod {
    data class CreditCard(val number: String) : PaymentMethod()
    data class BankTransfer(val accountNumber: String) : PaymentMethod()
    data object Cash : PaymentMethod()
}
// 其他包无法添加新的支付方式
```

### when 表达式的穷尽匹配

```kotlin
sealed class Event {
    data class Click(val x: Int, val y: Int) : Event()
    data class KeyPress(val keyCode: Int) : Event()
    data object Scroll : Event()
}

// 作为表达式使用时，必须穷尽所有分支
val description: String = when (event) {
    is Event.Click -> "点击 (${event.x}, ${event.y})"
    is Event.KeyPress -> "按键 ${event.keyCode}"
    Event.Scroll -> "滚动"
}

// 作为语句使用时，可以不穷尽（但建议穷尽）
when (event) {
    is Event.Click -> handleClick(event)
    else -> { /* 忽略其他事件 */ }
}
```

### 智能类型转换

在 `when` 分支中，编译器自动进行类型转换：

```kotlin
sealed class ApiResponse<out T> {
    data class Success<T>(val data: T, val code: Int) : ApiResponse<T>()
    data class Error(val message: String, val code: Int) : ApiResponse<Nothing>()
}

fun <T> process(response: ApiResponse<T>) {
    when (response) {
        is ApiResponse.Success -> {
            // 自动转换为 Success 类型，可直接访问 data 和 code
            println("数据: ${response.data}, 状态码: ${response.code}")
        }
        is ApiResponse.Error -> {
            // 自动转换为 Error 类型
            println("错误: ${response.message}")
        }
    }
}
```

### 泛型与协变

密封类可以使用泛型，配合 `out` 修饰符实现协变：

```kotlin
sealed class Either<out L, out R> {
    data class Left<L>(val value: L) : Either<L, Nothing>()
    data class Right<R>(val value: R) : Either<Nothing, R>()
}

fun <L, R, T> Either<L, R>.fold(
    onLeft: (L) -> T,
    onRight: (R) -> T
): T = when (this) {
    is Either.Left -> onLeft(value)
    is Either.Right -> onRight(value)
}
```

## 代码示例

### 基础示例：Result 类型

```kotlin
/**
 * 通用的结果类型，用于表示操作的成功或失败
 */
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String, val cause: Throwable? = null) : Result<Nothing>()
    data object Loading : Result<Nothing>()

    // 辅助方法
    val isSuccess: Boolean get() = this is Success
    val isError: Boolean get() = this is Error
    val isLoading: Boolean get() = this is Loading

    fun getOrNull(): T? = (this as? Success)?.data

    fun getOrDefault(default: @UnsafeVariance T): T = getOrNull() ?: default

    fun getOrThrow(): T = when (this) {
        is Success -> data
        is Error -> throw cause ?: IllegalStateException(message)
        is Loading -> throw IllegalStateException("Still loading")
    }

    inline fun <R> map(transform: (T) -> R): Result<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> this
        is Loading -> this
    }

    inline fun <R> flatMap(transform: (T) -> Result<R>): Result<R> = when (this) {
        is Success -> transform(data)
        is Error -> this
        is Loading -> this
    }

    inline fun onSuccess(action: (T) -> Unit): Result<T> {
        if (this is Success) action(data)
        return this
    }

    inline fun onError(action: (String, Throwable?) -> Unit): Result<T> {
        if (this is Error) action(message, cause)
        return this
    }
}

// 使用示例
fun fetchUser(id: Int): Result<User> {
    return try {
        val user = api.getUser(id)
        Result.Success(user)
    } catch (e: IOException) {
        Result.Error("网络错误", e)
    } catch (e: Exception) {
        Result.Error("未知错误", e)
    }
}

fun main() {
    fetchUser(1)
        .map { it.name }
        .onSuccess { println("用户名: $it") }
        .onError { msg, _ -> println("错误: $msg") }
}
```

### 状态机示例：订单状态

```kotlin
/**
 * 订单状态机
 */
sealed class OrderState {
    data class Created(val orderId: String, val items: List<String>) : OrderState()
    data class Pending(val orderId: String, val paymentMethod: String) : OrderState()
    data class Paid(val orderId: String, val transactionId: String) : OrderState()
    data class Shipped(val orderId: String, val trackingNumber: String) : OrderState()
    data class Delivered(val orderId: String, val deliveryTime: Long) : OrderState()
    data class Cancelled(val orderId: String, val reason: String) : OrderState()
}

sealed class OrderEvent {
    data class Submit(val paymentMethod: String) : OrderEvent()
    data class Pay(val transactionId: String) : OrderEvent()
    data class Ship(val trackingNumber: String) : OrderEvent()
    data class Deliver(val time: Long) : OrderEvent()
    data class Cancel(val reason: String) : OrderEvent()
}

class OrderStateMachine {
    fun transition(state: OrderState, event: OrderEvent): OrderState {
        return when (state) {
            is OrderState.Created -> when (event) {
                is OrderEvent.Submit -> OrderState.Pending(state.orderId, event.paymentMethod)
                is OrderEvent.Cancel -> OrderState.Cancelled(state.orderId, event.reason)
                else -> throw IllegalStateException("无效操作: $state + $event")
            }
            is OrderState.Pending -> when (event) {
                is OrderEvent.Pay -> OrderState.Paid(state.orderId, event.transactionId)
                is OrderEvent.Cancel -> OrderState.Cancelled(state.orderId, event.reason)
                else -> throw IllegalStateException("无效操作")
            }
            is OrderState.Paid -> when (event) {
                is OrderEvent.Ship -> OrderState.Shipped(state.orderId, event.trackingNumber)
                else -> throw IllegalStateException("无效操作")
            }
            is OrderState.Shipped -> when (event) {
                is OrderEvent.Deliver -> OrderState.Delivered(state.orderId, event.time)
                else -> throw IllegalStateException("无效操作")
            }
            is OrderState.Delivered,
            is OrderState.Cancelled -> throw IllegalStateException("终态不可转换")
        }
    }
}

// 使用
fun main() {
    val machine = OrderStateMachine()
    var state: OrderState = OrderState.Created("ORD001", listOf("商品A", "商品B"))

    state = machine.transition(state, OrderEvent.Submit("支付宝"))
    println(state) // Pending(orderId=ORD001, paymentMethod=支付宝)

    state = machine.transition(state, OrderEvent.Pay("TXN123"))
    println(state) // Paid(orderId=ORD001, transactionId=TXN123)
}
```

### 表达式求值器

```kotlin
/**
 * 算术表达式 AST
 */
sealed class Expr {
    data class Num(val value: Double) : Expr()
    data class Var(val name: String) : Expr()
    data class Add(val left: Expr, val right: Expr) : Expr()
    data class Sub(val left: Expr, val right: Expr) : Expr()
    data class Mul(val left: Expr, val right: Expr) : Expr()
    data class Div(val left: Expr, val right: Expr) : Expr()
    data class Neg(val expr: Expr) : Expr()
}

class ExprEvaluator(private val variables: Map<String, Double> = emptyMap()) {

    fun evaluate(expr: Expr): Double = when (expr) {
        is Expr.Num -> expr.value
        is Expr.Var -> variables[expr.name]
            ?: throw IllegalArgumentException("未定义变量: ${expr.name}")
        is Expr.Add -> evaluate(expr.left) + evaluate(expr.right)
        is Expr.Sub -> evaluate(expr.left) - evaluate(expr.right)
        is Expr.Mul -> evaluate(expr.left) * evaluate(expr.right)
        is Expr.Div -> {
            val divisor = evaluate(expr.right)
            require(divisor != 0.0) { "除数不能为零" }
            evaluate(expr.left) / divisor
        }
        is Expr.Neg -> -evaluate(expr.expr)
    }

    fun stringify(expr: Expr): String = when (expr) {
        is Expr.Num -> expr.value.toString()
        is Expr.Var -> expr.name
        is Expr.Add -> "(${stringify(expr.left)} + ${stringify(expr.right)})"
        is Expr.Sub -> "(${stringify(expr.left)} - ${stringify(expr.right)})"
        is Expr.Mul -> "(${stringify(expr.left)} * ${stringify(expr.right)})"
        is Expr.Div -> "(${stringify(expr.left)} / ${stringify(expr.right)})"
        is Expr.Neg -> "(-${stringify(expr.expr)})"
    }
}

// 使用: 计算 (x + 2) * 3，其中 x = 5
fun main() {
    val expr = Expr.Mul(
        Expr.Add(Expr.Var("x"), Expr.Num(2.0)),
        Expr.Num(3.0)
    )

    val evaluator = ExprEvaluator(mapOf("x" to 5.0))
    println(evaluator.stringify(expr))  // ((x + 2.0) * 3.0)
    println(evaluator.evaluate(expr))   // 21.0
}
```

### UI 状态管理

```kotlin
/**
 * 适用于 Android/Compose 的 UI 状态管理
 */
sealed class UiState<out T> {
    data object Initial : UiState<Nothing>()

    sealed class Loading : UiState<Nothing>() {
        data object Default : Loading()
        data class WithProgress(val percent: Int) : Loading()
    }

    data class Success<T>(val data: T) : UiState<T>()

    sealed class Error : UiState<Nothing>() {
        abstract val message: String

        data class Network(override val message: String) : Error()
        data class Server(override val message: String, val code: Int) : Error()
        data class Validation(
            override val message: String,
            val fieldErrors: Map<String, String>
        ) : Error()
    }
}

// ViewModel 示例
class ProductViewModel {
    private var _state: UiState<List<Product>> = UiState.Initial
    val state: UiState<List<Product>> get() = _state

    suspend fun loadProducts() {
        _state = UiState.Loading.Default

        _state = try {
            val products = repository.getProducts()
            UiState.Success(products)
        } catch (e: IOException) {
            UiState.Error.Network("网络连接失败")
        } catch (e: HttpException) {
            UiState.Error.Server("服务器错误", e.code())
        }
    }
}

// UI 渲染
fun renderState(state: UiState<List<Product>>): String = when (state) {
    is UiState.Initial -> "等待加载"
    is UiState.Loading.Default -> "加载中..."
    is UiState.Loading.WithProgress -> "加载中 ${state.percent}%"
    is UiState.Success -> "共 ${state.data.size} 个商品"
    is UiState.Error.Network -> "网络错误: ${state.message}"
    is UiState.Error.Server -> "服务器错误 (${state.code}): ${state.message}"
    is UiState.Error.Validation -> buildString {
        append("验证失败: ${state.message}\n")
        state.fieldErrors.forEach { (field, error) ->
            append("  $field: $error\n")
        }
    }
}
```

## 最佳实践

### 选择合适的子类类型

```kotlin
sealed class PaymentResult {
    // 使用 data class 携带数据
    data class Success(val transactionId: String, val amount: Double) : PaymentResult()

    // 使用 data object 表示无数据的状态
    data object Processing : PaymentResult()

    // 使用普通 class 需要额外逻辑时
    class Failure(val reason: String) : PaymentResult() {
        val retryCount: Int = 0
        fun canRetry(): Boolean = retryCount < 3
    }
}
```

### 使用有意义的命名

```kotlin
// 好的命名 - 清晰表达含义
sealed class AuthState {
    data object Unauthenticated : AuthState()
    data class Authenticated(val user: User) : AuthState()
    data class AuthenticationFailed(val reason: String) : AuthState()
}

// 避免过于通用的命名
// sealed class State { ... }  // 不推荐
// sealed class Type { ... }   // 不推荐
```

### 利用扩展函数增强功能

```kotlin
sealed class Option<out T> {
    data class Some<T>(val value: T) : Option<T>()
    data object None : Option<Nothing>()
}

// 通过扩展函数添加功能
fun <T> Option<T>.getOrNull(): T? = when (this) {
    is Option.Some -> value
    is Option.None -> null
}

fun <T> Option<T>.getOrDefault(default: @UnsafeVariance T): T = when (this) {
    is Option.Some -> value
    is Option.None -> default
}

inline fun <T, R> Option<T>.map(transform: (T) -> R): Option<R> = when (this) {
    is Option.Some -> Option.Some(transform(value))
    is Option.None -> Option.None
}

fun <T> T?.toOption(): Option<T> = if (this != null) Option.Some(this) else Option.None
```

### 合理使用嵌套

```kotlin
// 适当嵌套可以更好地组织代码
sealed class Permission {
    sealed class Resource(val name: String) : Permission() {
        data class Read(val resourceName: String) : Resource(resourceName)
        data class Write(val resourceName: String) : Resource(resourceName)
        data class Delete(val resourceName: String) : Resource(resourceName)
    }

    sealed class Feature : Permission() {
        data object Dashboard : Feature()
        data object Reports : Feature()
        data object Settings : Feature()
    }

    data object Admin : Permission()
}

// 可以分层处理
fun checkPermission(permission: Permission): Boolean = when (permission) {
    is Permission.Resource -> checkResourcePermission(permission)
    is Permission.Feature -> checkFeaturePermission(permission)
    is Permission.Admin -> isAdmin()
}
```

### 与协程和 Flow 结合

```kotlin
sealed class Resource<out T> {
    data object Loading : Resource<Nothing>()
    data class Success<T>(val data: T) : Resource<T>()
    data class Error(val exception: Throwable) : Resource<Nothing>()
}

// 与 Flow 结合
fun <T> Flow<T>.asResource(): Flow<Resource<T>> = flow {
    emit(Resource.Loading)
    try {
        collect { value ->
            emit(Resource.Success(value))
        }
    } catch (e: Exception) {
        emit(Resource.Error(e))
    }
}

// 使用
suspend fun observeUsers(): Flow<Resource<List<User>>> {
    return userRepository.getUsers().asResource()
}
```

## 常见陷阱

### 忘记处理新增的子类

```kotlin
sealed class Status {
    data object Active : Status()
    data object Inactive : Status()
    // 新增子类
    data object Pending : Status()  // 添加后，所有 when 表达式都会编译错误
}

// 错误：使用 else 会隐藏问题
fun getColor(status: Status): String = when (status) {
    is Status.Active -> "green"
    is Status.Inactive -> "gray"
    else -> "unknown"  // 危险！新增的 Pending 会被忽略
}

// 正确：穷尽匹配
fun getColorSafe(status: Status): String = when (status) {
    is Status.Active -> "green"
    is Status.Inactive -> "gray"
    is Status.Pending -> "yellow"
}
```

### 在不同包中定义子类

```kotlin
// 文件: package1/Base.kt
package com.example.package1

sealed class Base  // 定义在 package1

// 文件: package2/Derived.kt
package com.example.package2

import com.example.package1.Base

// 编译错误！子类必须在同一包中
class Derived : Base()
```

### 混淆 object 和 data object

```kotlin
sealed class Event {
    // object - 需要手动实现 toString
    object Click : Event() {
        override fun toString() = "Click"
    }

    // data object (Kotlin 1.9+) - 自动生成 toString
    data object Scroll : Event()
}

fun main() {
    println(Event.Click)   // Click（需手动实现）
    println(Event.Scroll)  // Scroll（自动生成）
}
```

### 过度使用密封类

```kotlin
// 不适合：可能无限扩展的类型
// sealed class Animal { ... }  // 动物种类太多，不适合用密封类

// 适合：有限且已知的状态集
sealed class ConnectionState {
    data object Disconnected : ConnectionState()
    data object Connecting : ConnectionState()
    data class Connected(val sessionId: String) : ConnectionState()
}
```

### 泛型擦除问题

```kotlin
sealed class Container<T> {
    data class Box<T>(val item: T) : Container<T>()
    data object Empty : Container<Nothing>()
}

fun process(container: Container<String>) = when (container) {
    is Container.Box<*> -> container.item  // 类型是 Any?，不是 String
    is Container.Empty -> null
}

// 解决方案：使用具体化类型参数的内联函数
inline fun <reified T> Container<T>.getItem(): T? = when (this) {
    is Container.Box -> item as T
    is Container.Empty -> null
}
```

## 性能考量

### 编译时开销

密封类的穷尽性检查在编译时进行，不会影响运行时性能。编译器会生成高效的分发代码。

### 与枚举的性能对比

```kotlin
// 枚举：内存更小，但功能受限
enum class Direction { NORTH, SOUTH, EAST, WEST }

// 密封类：更灵活，但每个实例占用更多内存
sealed class DirectionWithData {
    data class North(val distance: Int) : DirectionWithData()
    data class South(val distance: Int) : DirectionWithData()
}
```

对于无状态的固定常量集，枚举的内存效率更高。密封类适合需要携带不同数据的场景。

### when 表达式的编译优化

Kotlin 编译器会将 `when` 表达式优化为高效的字节码：

- 对于小型密封类（2-5 个子类），通常生成一系列 `instanceof` 检查
- 对于大型密封类，可能使用跳转表优化

```kotlin
// 编译后大致等价于
fun handleOptimized(result: Result<String>): String {
    return if (result is Result.Success) {
        "成功: ${result.data}"
    } else if (result is Result.Error) {
        "错误: ${result.message}"
    } else {
        "加载中"
    }
}
```

### 内存分配

```kotlin
sealed class Event {
    // 每次调用都创建新实例
    data class Click(val x: Int, val y: Int) : Event()

    // 单例，无内存分配
    data object Refresh : Event()
}

// 对于频繁触发的事件，考虑使用对象池或单例
val refreshEvent = Event.Refresh  // 复用同一实例
```

## 实战场景

### API 响应处理

```kotlin
sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class HttpError(val code: Int, val message: String) : ApiResult<Nothing>()
    data class NetworkError(val cause: IOException) : ApiResult<Nothing>()
    data class ParseError(val cause: Exception) : ApiResult<Nothing>()
}

suspend fun <T> safeApiCall(call: suspend () -> T): ApiResult<T> {
    return try {
        ApiResult.Success(call())
    } catch (e: HttpException) {
        ApiResult.HttpError(e.code(), e.message())
    } catch (e: IOException) {
        ApiResult.NetworkError(e)
    } catch (e: Exception) {
        ApiResult.ParseError(e)
    }
}
```

### 表单验证

```kotlin
sealed class ValidationResult {
    data object Valid : ValidationResult()
    data class Invalid(val errors: List<ValidationError>) : ValidationResult()
}

sealed class ValidationError {
    data class Required(val field: String) : ValidationError()
    data class TooShort(val field: String, val minLength: Int) : ValidationError()
    data class TooLong(val field: String, val maxLength: Int) : ValidationError()
    data class InvalidFormat(val field: String, val expectedFormat: String) : ValidationError()
    data class Custom(val field: String, val message: String) : ValidationError()
}

fun validateUser(user: UserInput): ValidationResult {
    val errors = mutableListOf<ValidationError>()

    if (user.name.isBlank()) {
        errors.add(ValidationError.Required("name"))
    } else if (user.name.length < 2) {
        errors.add(ValidationError.TooShort("name", 2))
    }

    if (!user.email.matches(emailRegex)) {
        errors.add(ValidationError.InvalidFormat("email", "xxx@xxx.xxx"))
    }

    return if (errors.isEmpty()) ValidationResult.Valid
           else ValidationResult.Invalid(errors)
}
```

### 路由导航

```kotlin
sealed class Screen {
    data object Home : Screen()
    data object Settings : Screen()
    data class UserProfile(val userId: String) : Screen()
    data class ProductDetail(val productId: String) : Screen()
    data class Search(val query: String) : Screen()
}

sealed class NavigationAction {
    data class NavigateTo(val screen: Screen) : NavigationAction()
    data object Back : NavigationAction()
    data class PopUpTo(val screen: Screen, val inclusive: Boolean) : NavigationAction()
}

class Navigator {
    private val backStack = mutableListOf<Screen>()

    fun navigate(action: NavigationAction) {
        when (action) {
            is NavigationAction.NavigateTo -> {
                backStack.add(action.screen)
            }
            is NavigationAction.Back -> {
                if (backStack.isNotEmpty()) backStack.removeLast()
            }
            is NavigationAction.PopUpTo -> {
                val index = backStack.indexOfLast { it == action.screen }
                if (index >= 0) {
                    val removeFrom = if (action.inclusive) index else index + 1
                    backStack.subList(removeFrom, backStack.size).clear()
                }
            }
        }
    }
}
```

### 消息系统

```kotlin
sealed class Message {
    abstract val id: String
    abstract val timestamp: Long
    abstract val senderId: String

    data class Text(
        override val id: String,
        override val timestamp: Long,
        override val senderId: String,
        val content: String
    ) : Message()

    data class Image(
        override val id: String,
        override val timestamp: Long,
        override val senderId: String,
        val url: String,
        val width: Int,
        val height: Int
    ) : Message()

    data class Voice(
        override val id: String,
        override val timestamp: Long,
        override val senderId: String,
        val url: String,
        val duration: Int
    ) : Message()

    data class System(
        override val id: String,
        override val timestamp: Long,
        override val senderId: String = "system",
        val content: String
    ) : Message()
}

fun renderMessage(message: Message): String = when (message) {
    is Message.Text -> message.content
    is Message.Image -> "[图片 ${message.width}x${message.height}]"
    is Message.Voice -> "[语音 ${message.duration}秒]"
    is Message.System -> "[系统消息] ${message.content}"
}
```

## 面试要点

### 常见面试问题

**1. 密封类和枚举类有什么区别？**

- 枚举类的每个常量只有一个实例，密封类的每个子类可以有多个实例
- 枚举常量共享相同的属性结构，密封类的子类可以有不同的属性
- 密封类支持继承层次结构，枚举不支持
- 使用场景：枚举适合无状态的固定常量集，密封类适合有状态的类型集

**2. 密封类的子类可以定义在哪里？**

- Kotlin 1.5 之前：必须在同一文件中
- Kotlin 1.5 及之后：可以在同一包的不同文件中
- 不能在不同包中定义子类

**3. when 表达式对密封类的穷尽性检查是如何工作的？**

编译器追踪密封类的所有直接子类。当 `when` 作为表达式使用时，编译器会验证是否覆盖了所有子类。如果有遗漏，编译会报错。

**4. 什么时候应该使用密封类而不是抽象类？**

- 当子类集合是有限且已知的
- 当需要在 `when` 表达式中进行穷尽匹配
- 当想确保添加新子类时所有使用处都被更新

**5. 密封接口和密封类的区别？**

- 密封接口支持多继承（一个类可以实现多个密封接口）
- 密封类只能单继承
- 密封接口不能有构造函数参数
- 密封接口从 Kotlin 1.5 开始支持

### 进阶问题

**1. 如何在密封类中处理泛型？**

```kotlin
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
}
```

使用 `out` 修饰符实现协变，`Nothing` 作为协变类型的底部类型。

**2. 密封类的编译产物是什么？**

密封类编译为带有私有构造函数的抽象类，子类编译为继承该抽象类的普通类。

**3. 如何测试密封类的 when 表达式是否完整？**

添加新子类后，如果 `when` 表达式不完整，编译会直接报错。可以通过 CI 中的编译检查确保完整性。

## 延伸阅读

### 官方文档

- [Kotlin 密封类官方文档](https://kotlinlang.org/docs/sealed-classes.html)
- [Kotlin 密封接口](https://kotlinlang.org/docs/sealed-classes.html#sealed-interfaces)
- [Kotlin When 表达式](https://kotlinlang.org/docs/control-flow.html#when-expression)

### 推荐书籍

- 《Kotlin 实战》(Kotlin in Action) - Dmitry Jemerov, Svetlana Isakova
- 《Kotlin 编程权威指南》(Kotlin Programming: The Big Nerd Ranch Guide)
- 《Atomic Kotlin》 - Bruce Eckel, Svetlana Isakova

### 相关技术

- [Arrow-kt](https://arrow-kt.io/) - Kotlin 函数式编程库，提供更多 ADT 支持
- [Kotlin Result](https://github.com/michaelbull/kotlin-result) - 增强的 Result 类型库
- [Kotlin 协程](https://kotlinlang.org/docs/coroutines-overview.html) - 与密封类结合处理异步结果

### 设计模式

- 访问者模式 (Visitor Pattern) - 密封类提供了更类型安全的替代方案
- 状态模式 (State Pattern) - 密封类是实现状态机的理想选择
- 代数数据类型 (ADT) - 密封类是 Kotlin 对 ADT 的实现
