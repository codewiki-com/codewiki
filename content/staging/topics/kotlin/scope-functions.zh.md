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
origin: old/src/content/docs/kotlin/scope-functions.zh.md
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

作用域函数（Scope Functions）是 Kotlin 标准库中最具特色的功能之一。它们允许你在对象的上下文中执行代码块，使代码更加简洁和富有表现力。Kotlin 提供了五个作用域函数：`let`、`run`、`with`、`apply` 和 `also`。

## 什么是作用域函数

作用域函数的核心思想是：在对象上调用这些函数时，会形成一个临时的作用域。在这个作用域内，你可以访问该对象而无需使用其名称。

```kotlin
// 不使用作用域函数
val person = Person()
person.name = "张三"
person.age = 25
person.city = "北京"
println(person)

// 使用作用域函数 apply
val person = Person().apply {
    name = "张三"
    age = 25
    city = "北京"
}.also { println(it) }
```

## 五个作用域函数的区别

每个作用域函数有两个主要区别点：

1. **引用上下文对象的方式**：`this` 或 `it`
2. **返回值**：上下文对象本身或 Lambda 表达式的结果

| 函数 | 对象引用 | 返回值 | 是否为扩展函数 |
|------|----------|--------|----------------|
| `let` | `it` | Lambda 结果 | 是 |
| `run` | `this` | Lambda 结果 | 是 |
| `with` | `this` | Lambda 结果 | 否（将对象作为参数） |
| `apply` | `this` | 上下文对象 | 是 |
| `also` | `it` | 上下文对象 | 是 |

## let 函数

`let` 函数使用 `it` 引用上下文对象，返回 Lambda 表达式的结果。它是处理可空类型和链式调用的理想选择。

### 基本语法

```kotlin
public inline fun <T, R> T.let(block: (T) -> R): R
```

### 使用场景

#### 空安全调用

```kotlin
val name: String? = "Kotlin"

// 传统方式
if (name != null) {
    println("名字长度: ${name.length}")
}

// 使用 let
name?.let {
    println("名字长度: ${it.length}")
}

// let 内部 it 是非空的
name?.let { nonNullName ->
    println("名字长度: ${nonNullName.length}")
}
```

#### 将表达式结果引入局部作用域

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

numbers.filter { it > 2 }.let { filtered ->
    println("过滤后的列表: $filtered")
    println("元素个数: ${filtered.size}")
}

// 避免中间变量污染外部作用域
val result = numbers.map { it * 2 }
    .filter { it > 5 }
    .let { list ->
        list.sum() / list.size
    }
println("平均值: $result")
```

#### 链式转换

```kotlin
data class User(val name: String, val email: String)
data class UserDTO(val displayName: String, val contact: String)

fun getUserFromDb(id: Int): User? = User("张三", "zhangsan@example.com")

val userDTO = getUserFromDb(1)?.let { user ->
    UserDTO(
        displayName = user.name.uppercase(),
        contact = user.email
    )
}
```

### 实际示例

```kotlin
// 处理网络请求结果
fun processResponse(response: Response?) {
    response?.let { res ->
        when (res.code) {
            200 -> parseData(res.body)
            404 -> showError("资源未找到")
            else -> showError("未知错误: ${res.code}")
        }
    } ?: showError("响应为空")
}

// 字符串处理
val input = "  Hello Kotlin  "
val processed = input.let {
    it.trim()
}.let {
    it.lowercase()
}.let {
    it.replace("kotlin", "World")
}
println(processed) // 输出: hello world
```

## run 函数

`run` 函数使用 `this` 引用上下文对象，返回 Lambda 表达式的结果。它结合了对象配置和结果计算的能力。

### 基本语法

```kotlin
// 扩展函数形式
public inline fun <T, R> T.run(block: T.() -> R): R

// 非扩展函数形式
public inline fun <R> run(block: () -> R): R
```

### 使用场景

#### 对象配置并返回结果

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
    connectionString() // 返回连接字符串
}
println(connectionString)
```

#### 需要表达式的地方运行语句块

```kotlin
// 非扩展函数形式的 run
val hexColor = run {
    val red = 255
    val green = 128
    val blue = 0
    String.format("#%02X%02X%02X", red, green, blue)
}
println(hexColor) // 输出: #FF8000
```

#### 空安全调用并返回结果

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

### run vs let 的选择

```kotlin
data class Person(var name: String, var age: Int)

val person = Person("张三", 25)

// 使用 run - 需要频繁访问对象属性时更简洁
person.run {
    println("姓名: $name")  // 直接访问，无需 it.name
    println("年龄: $age")
    "$name, $age 岁"
}

// 使用 let - 需要明确区分上下文对象时
person.let {
    println("姓名: ${it.name}")
    println("年龄: ${it.age}")
    "${it.name}, ${it.age} 岁"
}
```

## with 函数

`with` 是一个非扩展函数，它将上下文对象作为参数传入。在 Lambda 内部使用 `this` 引用对象。

### 基本语法

```kotlin
public inline fun <T, R> with(receiver: T, block: T.() -> R): R
```

### 使用场景

#### 对同一对象调用多个函数

```kotlin
data class Canvas(var width: Int = 0, var height: Int = 0) {
    fun setBackground(color: String) = println("背景色: $color")
    fun drawLine(x1: Int, y1: Int, x2: Int, y2: Int) =
        println("画线: ($x1,$y1) -> ($x2,$y2)")
    fun drawCircle(x: Int, y: Int, radius: Int) =
        println("画圆: 圆心($x,$y), 半径$radius")
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

#### 辅助对象用于计算结果

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

val stats = with(numbers) {
    """
    列表: $this
    大小: $size
    最小值: ${minOrNull()}
    最大值: ${maxOrNull()}
    平均值: ${average()}
    总和: ${sum()}
    """.trimIndent()
}
println(stats)
```

#### 构建字符串

```kotlin
fun buildReport(title: String, items: List<String>): String {
    return with(StringBuilder()) {
        appendLine("====== $title ======")
        appendLine()
        items.forEachIndexed { index, item ->
            appendLine("${index + 1}. $item")
        }
        appendLine()
        appendLine("共 ${items.size} 项")
        toString()
    }
}

val report = buildReport("任务清单", listOf("学习 Kotlin", "写代码", "测试"))
println(report)
```

### with 的注意事项

```kotlin
// with 不适合处理可空对象
val nullableList: List<Int>? = listOf(1, 2, 3)

// 不推荐
with(nullableList) {
    this?.forEach { println(it) }  // 需要空安全调用
}

// 推荐使用 let 或 run
nullableList?.let { list ->
    list.forEach { println(it) }
}
```

## apply 函数

`apply` 函数使用 `this` 引用上下文对象，**返回对象本身**。它是对象配置的首选函数。

### 基本语法

```kotlin
public inline fun <T> T.apply(block: T.() -> Unit): T
```

### 使用场景

#### 对象初始化和配置

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
    body = """{"name": "张三", "age": 25}"""
}
```

#### Builder 模式的替代

```kotlin
class AlertDialog {
    var title: String = ""
    var message: String = ""
    var positiveButton: String = ""
    var negativeButton: String = ""
    var onPositiveClick: (() -> Unit)? = null
    var onNegativeClick: (() -> Unit)? = null

    fun show() {
        println("显示对话框:")
        println("标题: $title")
        println("内容: $message")
        println("确定按钮: $positiveButton")
        println("取消按钮: $negativeButton")
    }
}

val dialog = AlertDialog().apply {
    title = "确认删除"
    message = "确定要删除这条记录吗？"
    positiveButton = "确定"
    negativeButton = "取消"
    onPositiveClick = { println("执行删除") }
    onNegativeClick = { println("取消操作") }
}.also { it.show() }
```

#### 链式配置

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

### 实际应用示例

```kotlin
// Android 风格的 View 配置
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

## also 函数

`also` 函数使用 `it` 引用上下文对象，**返回对象本身**。它适合执行不改变对象的附加操作。

### 基本语法

```kotlin
public inline fun <T> T.also(block: (T) -> Unit): T
```

### 使用场景

#### 执行额外操作（如日志记录）

```kotlin
fun generateToken(): String {
    return UUID.randomUUID().toString()
        .also { println("生成的 Token: $it") }
}

fun fetchUser(id: Int): User {
    return database.findUser(id)
        .also { user -> logger.info("获取用户: ${user.name}") }
}
```

#### 调试和验证

```kotlin
val numbers = mutableListOf(1, 2, 3)

numbers
    .also { println("初始列表: $it") }
    .add(4)

numbers
    .also { println("添加 4 后: $it") }
    .removeAt(0)

println("最终列表: $numbers")
```

#### 链式调用中的中间操作

```kotlin
data class Order(
    var items: MutableList<String> = mutableListOf(),
    var total: Double = 0.0,
    var status: String = "pending"
)

fun processOrder(order: Order): Order {
    return order
        .also { it.items.add("包装服务") }
        .also { it.total += 5.0 }
        .also { it.status = "processing" }
        .also { sendNotification(it) }
}

fun sendNotification(order: Order) {
    println("发送通知: 订单状态已更新为 ${order.status}")
}
```

### also vs apply 的选择

```kotlin
data class User(var name: String, var email: String)

// apply - 配置对象属性
val user1 = User("", "").apply {
    name = "张三"
    email = "zhangsan@example.com"
}

// also - 执行额外操作，不直接修改属性
val user2 = User("李四", "lisi@example.com").also {
    validateEmail(it.email)
    saveToDatabase(it)
    println("创建用户: ${it.name}")
}

fun validateEmail(email: String) = require(email.contains("@"))
fun saveToDatabase(user: User) = println("保存用户到数据库")
```

## 作用域函数的链式使用

作用域函数可以组合使用，创建流畅的处理链。

### 常见组合模式

```kotlin
data class User(
    var id: Int = 0,
    var name: String = "",
    var email: String = "",
    var isActive: Boolean = false
)

// apply + also 组合
fun createUser(name: String, email: String): User {
    return User()
        .apply {
            this.name = name
            this.email = email
            this.isActive = true
        }
        .also {
            println("用户创建成功: ${it.name}")
            audit("用户创建", it)
        }
}

fun audit(action: String, user: User) {
    println("审计日志: $action - ${user.name}")
}
```

### let + apply 组合

```kotlin
data class Config(
    var apiUrl: String = "",
    var timeout: Int = 0,
    var retryCount: Int = 0
)

fun loadConfig(path: String): Config? {
    // 模拟从文件加载配置
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
        println("应用配置: ${it.apiUrl}, 超时: ${it.timeout}ms")
    } ?: println("配置加载失败，使用默认配置")
}
```

### 复杂数据处理链

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
        ?.also { println("有效商品数: ${it.size}") }
        ?.map { item ->
            item.apply {
                if (quantity >= 10) discount = 0.1
                if (quantity >= 50) discount = 0.2
            }
        }
        ?.also { items ->
            items.forEach { println("${it.product.name}: 折扣 ${it.discount * 100}%") }
        }
        ?.let { cartItems ->
            val total = cartItems.sumOf {
                it.product.price * it.quantity * (1 - it.discount)
            }
            "总计: ¥%.2f".format(total)
        }
        ?: "购物车为空"
}
```

## 空安全与作用域函数

作用域函数在处理可空类型时非常有用。

### 安全调用模式

```kotlin
data class Address(val city: String, val street: String)
data class Company(val name: String, val address: Address?)
data class Employee(val name: String, val company: Company?)

fun getEmployeeCity(employee: Employee?): String {
    return employee?.company?.address?.let { address ->
        "员工 ${employee.name} 在 ${address.city} 工作"
    } ?: "未知位置"
}

// 使用 run 的方式
fun getEmployeeCityWithRun(employee: Employee?): String {
    return employee?.run {
        company?.address?.run {
            "员工 $name 在 $city 工作"
        }
    } ?: "未知位置"
}
```

### Elvis 操作符结合

```kotlin
fun processNullableString(input: String?): String {
    return input?.let { str ->
        str.trim().takeIf { it.isNotEmpty() }
    }?.let { trimmed ->
        trimmed.uppercase()
    } ?: "默认值"
}

// 更简洁的写法
fun processNullableStringSimple(input: String?): String {
    return input
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.uppercase()
        ?: "默认值"
}
```

### takeIf 和 takeUnless

这两个函数与作用域函数配合使用效果很好。

```kotlin
fun validateAndProcess(value: Int?): String {
    return value
        ?.takeIf { it > 0 }
        ?.let { "有效值: $it" }
        ?: "无效值"
}

fun findActiveUser(users: List<User>): User? {
    return users
        .firstOrNull()
        ?.takeIf { it.isActive }
        ?.also { println("找到活跃用户: ${it.name}") }
}

// takeUnless - 条件为 false 时返回对象
fun getNonEmptyList(list: List<Int>): List<Int>? {
    return list.takeUnless { it.isEmpty() }
}
```

## 选择正确的作用域函数

### 决策指南

```kotlin
// 1. 需要配置对象？
//    -> 使用 apply（不需要返回值）
val config = Config().apply {
    host = "localhost"
    port = 8080
}

// 2. 需要配置并返回结果？
//    -> 使用 run
val connection = Config().run {
    host = "localhost"
    port = 8080
    createConnection() // 返回 Connection
}

// 3. 处理可空对象并转换？
//    -> 使用 let
val length = nullableString?.let { it.length }

// 4. 对非空对象分组调用？
//    -> 使用 with
with(canvas) {
    drawRect(0, 0, 100, 100)
    drawCircle(50, 50, 25)
}

// 5. 执行副作用但保持对象不变？
//    -> 使用 also
val user = createUser()
    .also { logger.info("Created: $it") }
```

### 完整对比示例

```kotlin
data class Person(var name: String = "", var age: Int = 0)

fun main() {
    val person = Person()

    // let: 转换并返回结果
    val nameLength = person.let {
        it.name = "张三"
        it.name.length  // 返回长度
    }

    // run: 配置并返回结果
    val description = person.run {
        age = 25
        "$name, $age 岁"  // 返回描述
    }

    // with: 对象分组调用
    val info = with(person) {
        "姓名: $name, 年龄: $age"
    }

    // apply: 配置并返回对象
    val configured = person.apply {
        name = "李四"
        age = 30
    }  // 返回 person

    // also: 附加操作并返回对象
    val logged = person.also {
        println("当前: ${it.name}, ${it.age}")
    }  // 返回 person
}
```

## 性能考虑

作用域函数都是内联函数（inline function），这意味着在编译时，Lambda 表达式会被内联到调用处，不会产生额外的对象分配或方法调用开销。

```kotlin
// 编译前
val result = "Hello".let { it.length }

// 编译后（概念上）
val temp = "Hello"
val result = temp.length
```

## 最佳实践

### 避免过度嵌套

```kotlin
// 不推荐 - 嵌套太深
obj?.let { a ->
    a.process()?.let { b ->
        b.transform()?.let { c ->
            c.finalize()
        }
    }
}

// 推荐 - 使用链式调用
obj?.process()
    ?.transform()
    ?.finalize()
```

### 选择合适的函数

```kotlin
// 不推荐 - 使用 let 配置对象
val view = TextView().let {
    it.text = "Hello"
    it.textSize = 16f
    it
}

// 推荐 - 使用 apply 配置对象
val view = TextView().apply {
    text = "Hello"
    textSize = 16f
}
```

### 保持 Lambda 简洁

```kotlin
// 不推荐 - Lambda 过长
obj.apply {
    // 50 行配置代码...
}

// 推荐 - 提取为函数
obj.apply(::configure)

fun configure(obj: MyObject) {
    // 配置逻辑
}
```

### 命名 Lambda 参数提高可读性

```kotlin
// 当上下文不清晰时，给 it 命名
users.firstOrNull()?.let { user ->
    orders.filter { order -> order.userId == user.id }
}
```

## 总结

Kotlin 的作用域函数是强大而灵活的工具，能够让代码更加简洁和表达力更强。关键是理解每个函数的特点：

- **let**: 使用 `it` 引用，返回 Lambda 结果，适合空安全调用和转换
- **run**: 使用 `this` 引用，返回 Lambda 结果，适合对象配置并计算结果
- **with**: 非扩展函数，使用 `this` 引用，适合对象分组调用
- **apply**: 使用 `this` 引用，返回对象本身，适合对象初始化配置
- **also**: 使用 `it` 引用，返回对象本身，适合执行附加操作

掌握这些函数的使用场景，能够帮助你写出更加 Kotlin 风格（Idiomatic）的代码。
