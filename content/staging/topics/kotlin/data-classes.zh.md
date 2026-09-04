---
title: Kotlin 数据类
description: 深入理解 Kotlin 数据类的核心原理、自动生成方法、copy() 函数、解构声明、equals/hashCode 实现及最佳实践
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - Kotlin
  - 数据类
  - OOP
  - 不可变性
  - 解构
status: imported
origin: old/src/content/docs/kotlin/data-classes.zh.md
divergence: 0.199
issues:
  - title-lang-en
  - title-language
legacy:
  category: Kotlin
  subcategory: 核心概念
  order: 12
  lastUpdated: 2026-01-07
---

数据类（Data Class）是 Kotlin 语言中最具特色的特性之一，它通过编译器自动生成常用方法，极大地减少了样板代码，让开发者能够专注于业务逻辑而非重复的基础设施代码。

## 概念解释

### 什么是数据类

数据类是 Kotlin 专门为保存数据而设计的类。在传统的面向对象编程中，我们经常需要创建一些主要用于存储数据的类，这些类通常被称为"值对象"（Value Object）、"数据传输对象"（DTO）或"实体"（Entity）。

在 Java 中，创建这样一个简单的数据容器类需要编写大量样板代码：

```java
// Java 中的数据类
public class User {
    private final String name;
    private final int age;

    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return age == user.age && Objects.equals(name, user.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }

    @Override
    public String toString() {
        return "User{name='" + name + "', age=" + age + "}";
    }
}
```

而在 Kotlin 中，只需一行代码：

```kotlin
data class User(val name: String, val age: Int)
```

这一行代码会让编译器自动生成：

- `equals()` / `hashCode()` 方法
- `toString()` 方法
- `componentN()` 函数（用于解构声明）
- `copy()` 函数（用于复制对象并修改部分属性）

### 历史背景

数据类的设计理念源于函数式编程中的不可变数据结构和代数数据类型（ADT）。在 Scala 中有 case class，在 Haskell 中有 data 类型，Java 14 引入了 record 类型，这些都是类似的概念。

Kotlin 从 1.0 版本开始就支持数据类，并在后续版本中不断增强：

- Kotlin 1.0：引入数据类基础功能
- Kotlin 1.1：支持数据类继承密封类
- Kotlin 1.5：引入 `value class`（内联类）作为补充
- Kotlin 1.9：引入 `data object` 用于单例数据对象

### 解决的问题

1. **消除样板代码**：自动生成 equals、hashCode、toString 等方法
2. **保证一致性**：编译器生成的方法不会出错，且随属性变化自动更新
3. **支持不可变性**：配合 `val` 关键字实现真正的不可变数据
4. **简化复制操作**：copy() 函数让创建修改后的副本变得简单
5. **支持解构**：可以将对象属性直接解包到多个变量

## 核心原理

### 编译器生成机制

当编译器遇到 `data` 关键字时，会执行以下步骤：

1. **验证约束**：检查数据类是否满足所有要求
2. **分析主构造函数**：提取所有属性信息
3. **生成方法**：基于主构造函数参数生成标准方法

```kotlin
data class Point(val x: Int, val y: Int)

// 编译器实际生成的代码（简化版）
class Point(val x: Int, val y: Int) {

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Point) return false
        return x == other.x && y == other.y
    }

    override fun hashCode(): Int {
        var result = x
        result = 31 * result + y
        return result
    }

    override fun toString(): String = "Point(x=$x, y=$y)"

    operator fun component1(): Int = x
    operator fun component2(): Int = y

    fun copy(x: Int = this.x, y: Int = this.y): Point = Point(x, y)
}
```

### equals() 和 hashCode() 的实现原理

编译器生成的 `equals()` 方法遵循以下规则：

1. **同一性检查**：首先检查是否是同一对象引用
2. **类型检查**：检查参数是否为相同类型
3. **属性比较**：逐一比较主构造函数中的所有属性

```kotlin
data class Person(val name: String, val age: Int)

// 生成的 equals 实现
override fun equals(other: Any?): Boolean {
    if (this === other) return true                    // 同一引用
    if (other !is Person) return false                 // 类型检查
    return name == other.name && age == other.age      // 属性比较
}
```

`hashCode()` 的实现使用标准的哈希码计算公式：

```kotlin
override fun hashCode(): Int {
    var result = name.hashCode()
    result = 31 * result + age    // 31 是常用的素数乘数
    return result
}
```

选择 31 作为乘数的原因：

- 31 是一个奇素数，减少哈希冲突
- `31 * i` 可以被优化为 `(i << 5) - i`，运算效率高

### componentN() 函数的工作方式

编译器为主构造函数中的每个参数按顺序生成 `component1()`、`component2()` 等函数：

```kotlin
data class Triple(val first: String, val second: Int, val third: Boolean)

// 生成的 componentN 函数
operator fun component1(): String = first
operator fun component2(): Int = second
operator fun component3(): Boolean = third
```

这些函数被声明为 `operator`，使得 Kotlin 可以在解构声明中使用它们：

```kotlin
val (a, b, c) = Triple("hello", 42, true)
// 等价于：
// val a = triple.component1()
// val b = triple.component2()
// val c = triple.component3()
```

### copy() 函数的实现机制

`copy()` 函数利用 Kotlin 的默认参数特性：

```kotlin
data class User(val name: String, val age: Int, val email: String)

// 生成的 copy 函数
fun copy(
    name: String = this.name,
    age: Int = this.age,
    email: String = this.email
): User = User(name, age, email)
```

这使得我们可以选择性地修改部分属性：

```kotlin
val user = User("张三", 25, "zhangsan@example.com")
val updated = user.copy(age = 26)  // 只修改 age
```

## 核心要点

### 数据类的定义要求

| 要求 | 说明 |
|------|------|
| data 关键字 | 类声明必须以 `data` 开头 |
| 主构造函数 | 必须有至少一个参数 |
| 参数修饰 | 所有参数必须用 `val` 或 `var` 标记 |
| 类修饰符限制 | 不能是 abstract、open、sealed 或 inner |
| 接口实现 | 可以实现接口 |
| 密封类继承 | 可以继承密封类或密封接口 |

### 自动生成方法一览

| 方法 | 作用 | 参与属性 |
|------|------|----------|
| `equals()` | 结构相等性比较 | 主构造函数参数 |
| `hashCode()` | 计算哈希码 | 主构造函数参数 |
| `toString()` | 生成可读字符串 | 主构造函数参数 |
| `component1()`...`componentN()` | 支持解构声明 | 主构造函数参数 |
| `copy()` | 创建修改后的副本 | 主构造函数参数 |

### 主构造函数参数 vs 类体属性

只有主构造函数中的参数会参与自动生成的方法：

```kotlin
data class Employee(val id: Int, val name: String) {
    var department: String = ""        // 不参与 equals/hashCode
    val joinDate: Long = System.currentTimeMillis()  // 不参与
}

val e1 = Employee(1, "张三").apply { department = "技术部" }
val e2 = Employee(1, "张三").apply { department = "市场部" }

println(e1 == e2)  // true - department 不参与比较
println(e1.copy()) // Employee(id=1, name=张三) - department 不会复制
```

### 不可变性最佳实践

推荐使用 `val` 声明所有属性，实现真正的不可变数据类：

```kotlin
// 推荐：不可变数据类
data class ImmutableUser(val id: Int, val name: String, val email: String)

// 不推荐：可变数据类（除非有充分理由）
data class MutableUser(var id: Int, var name: String, var email: String)
```

## 代码示例

### 基础数据类定义

```kotlin
// 简单数据类
data class Point(val x: Double, val y: Double)

// 带默认值的数据类
data class Configuration(
    val host: String = "localhost",
    val port: Int = 8080,
    val timeout: Long = 30_000L,
    val enableSsl: Boolean = false
)

// 带可空类型的数据类
data class Profile(
    val username: String,
    val displayName: String?,
    val avatarUrl: String?,
    val bio: String = ""
)

fun main() {
    // 使用位置参数
    val point = Point(3.0, 4.0)

    // 使用命名参数
    val config = Configuration(host = "api.example.com", enableSsl = true)

    // 混合使用
    val profile = Profile(username = "zhangsan", displayName = "张三", avatarUrl = null)

    println(point)   // Point(x=3.0, y=4.0)
    println(config)  // Configuration(host=api.example.com, port=8080, timeout=30000, enableSsl=true)
    println(profile) // Profile(username=zhangsan, displayName=张三, avatarUrl=null, bio=)
}
```

### copy() 函数实战

```kotlin
data class Order(
    val id: String,
    val customerId: String,
    val items: List<String>,
    val status: OrderStatus,
    val totalAmount: Double
)

enum class OrderStatus {
    CREATED, PAID, SHIPPED, DELIVERED, CANCELLED
}

fun main() {
    val order = Order(
        id = "ORD-001",
        customerId = "CUST-123",
        items = listOf("商品A", "商品B"),
        status = OrderStatus.CREATED,
        totalAmount = 299.0
    )

    // 更新订单状态
    val paidOrder = order.copy(status = OrderStatus.PAID)
    println("支付后: $paidOrder")

    // 添加商品（注意：这里创建了新的 List）
    val updatedOrder = order.copy(
        items = order.items + "商品C",
        totalAmount = order.totalAmount + 99.0
    )
    println("添加商品后: $updatedOrder")

    // 原订单保持不变
    println("原订单: $order")
}
```

### 解构声明详解

```kotlin
data class Student(
    val id: Int,
    val name: String,
    val grade: Int,
    val score: Double
)

fun main() {
    val student = Student(1, "李明", 3, 92.5)

    // 基本解构
    val (id, name, grade, score) = student
    println("$name (ID: $id) 在 $grade 年级，成绩 $score")

    // 使用 _ 忽略不需要的值
    val (_, studentName, _, studentScore) = student
    println("$studentName 的成绩是 $studentScore")

    // 在 lambda 中解构
    val students = listOf(
        Student(1, "张三", 2, 88.0),
        Student(2, "李四", 3, 95.0),
        Student(3, "王五", 2, 76.5)
    )

    // for 循环中解构
    for ((_, name, grade, score) in students) {
        println("$name ($grade 年级): $score 分")
    }

    // map 操作中解构
    val summaries = students.map { (id, name, _, score) ->
        "学号$id-$name: $score"
    }
    println(summaries)
}
```

### 与集合框架配合

```kotlin
data class Product(val sku: String, val name: String, val price: Double)

fun main() {
    val products = listOf(
        Product("SKU001", "手机", 4999.0),
        Product("SKU002", "平板", 3299.0),
        Product("SKU001", "手机", 4999.0),  // 重复
        Product("SKU003", "笔记本", 6999.0)
    )

    // 去重（基于 equals）
    val uniqueProducts = products.distinct()
    println("去重后数量: ${uniqueProducts.size}")  // 3

    // 在 Set 中使用
    val productSet = products.toSet()
    println("Set 大小: ${productSet.size}")  // 3

    // 作为 Map 的键
    val inventory = mutableMapOf<Product, Int>()
    inventory[Product("SKU001", "手机", 4999.0)] = 100
    inventory[Product("SKU002", "平板", 3299.0)] = 50

    // 可以用相同内容的新对象查询
    val queryProduct = Product("SKU001", "手机", 4999.0)
    println("手机库存: ${inventory[queryProduct]}")  // 100

    // 分组
    data class Employee(val name: String, val department: String, val salary: Double)

    val employees = listOf(
        Employee("张三", "技术部", 15000.0),
        Employee("李四", "市场部", 12000.0),
        Employee("王五", "技术部", 18000.0),
        Employee("赵六", "市场部", 14000.0)
    )

    val byDepartment = employees.groupBy { it.department }
    byDepartment.forEach { (dept, emps) ->
        println("$dept: ${emps.map { it.name }}")
    }
}
```

### 嵌套数据类与深层复制

```kotlin
data class Address(
    val street: String,
    val city: String,
    val zipCode: String,
    val country: String = "中国"
)

data class ContactInfo(
    val email: String,
    val phone: String,
    val address: Address
)

data class Customer(
    val id: String,
    val name: String,
    val contact: ContactInfo,
    val vipLevel: Int = 0
)

fun main() {
    val customer = Customer(
        id = "C001",
        name = "张三",
        contact = ContactInfo(
            email = "zhangsan@example.com",
            phone = "13800138000",
            address = Address(
                street = "中关村大街1号",
                city = "北京",
                zipCode = "100080"
            )
        )
    )

    // 更新嵌套属性需要逐层 copy
    val updatedCustomer = customer.copy(
        contact = customer.contact.copy(
            address = customer.contact.address.copy(
                city = "上海",
                street = "南京路100号",
                zipCode = "200000"
            )
        )
    )

    println("原客户城市: ${customer.contact.address.city}")      // 北京
    println("新客户城市: ${updatedCustomer.contact.address.city}") // 上海

    // 提取嵌套信息
    val (_, name, contact) = customer
    val (email, phone, address) = contact
    val (street, city, _, country) = address

    println("$name 住在 $country$city$street")
}
```

### 数据类与密封类结合

```kotlin
sealed class Result<out T> {
    data class Success<T>(val data: T, val message: String = "操作成功") : Result<T>()
    data class Error(val code: Int, val message: String, val cause: Throwable? = null) : Result<Nothing>()
    data object Loading : Result<Nothing>()
}

// API 响应模型
data class User(val id: Int, val name: String, val email: String)
data class PageInfo(val page: Int, val pageSize: Int, val total: Int)
data class PaginatedData<T>(val items: List<T>, val pageInfo: PageInfo)

fun fetchUsers(page: Int): Result<PaginatedData<User>> {
    return try {
        // 模拟 API 调用
        val users = listOf(
            User(1, "张三", "zhangsan@example.com"),
            User(2, "李四", "lisi@example.com")
        )
        Result.Success(
            data = PaginatedData(
                items = users,
                pageInfo = PageInfo(page = page, pageSize = 10, total = 2)
            )
        )
    } catch (e: Exception) {
        Result.Error(code = 500, message = "获取用户列表失败", cause = e)
    }
}

fun handleResult(result: Result<PaginatedData<User>>) {
    when (result) {
        is Result.Success -> {
            val (data, message) = result
            val (items, pageInfo) = data
            println("$message，共 ${pageInfo.total} 条记录")
            items.forEach { (id, name, email) ->
                println("  - $name ($email)")
            }
        }
        is Result.Error -> {
            val (code, message, _) = result
            println("错误 [$code]: $message")
        }
        Result.Loading -> println("加载中...")
    }
}

fun main() {
    val result = fetchUsers(1)
    handleResult(result)
}
```

### 数据类与序列化

```kotlin
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString

@Serializable
data class ApiRequest(
    val method: String,
    val path: String,
    val headers: Map<String, String> = emptyMap(),
    val body: String? = null
)

@Serializable
data class ApiResponse<T>(
    val code: Int,
    val message: String,
    val data: T?,
    val timestamp: Long = System.currentTimeMillis()
)

@Serializable
data class UserDto(
    val id: Int,
    val username: String,
    val email: String,
    val roles: List<String> = listOf("user")
)

fun main() {
    val user = UserDto(
        id = 1,
        username = "zhangsan",
        email = "zhangsan@example.com",
        roles = listOf("user", "admin")
    )

    // 序列化
    val json = Json { prettyPrint = true }
    val jsonString = json.encodeToString(user)
    println("序列化结果:")
    println(jsonString)

    // 反序列化
    val decoded = json.decodeFromString<UserDto>(jsonString)
    println("\n反序列化结果: $decoded")
    println("对象相等: ${user == decoded}")  // true
}
```

## 最佳实践

### 优先使用 val 保证不可变性

```kotlin
// 推荐：不可变数据类
data class ImmutableOrder(
    val id: String,
    val items: List<String>,  // 使用不可变 List
    val createdAt: Instant
)

// 不推荐：可变数据类
data class MutableOrder(
    var id: String,
    var items: MutableList<String>,  // 可变集合
    var createdAt: Instant
)
```

### 使用 List 替代 Array

```kotlin
// 推荐：使用 List
data class Tags(val values: List<String>)

// 不推荐：使用 Array（equals 行为不符合预期）
data class TagsWithArray(val values: Array<String>)

fun main() {
    val t1 = Tags(listOf("a", "b"))
    val t2 = Tags(listOf("a", "b"))
    println(t1 == t2)  // true - 正确

    val a1 = TagsWithArray(arrayOf("a", "b"))
    val a2 = TagsWithArray(arrayOf("a", "b"))
    println(a1 == a2)  // false - Array 比较引用！
}
```

### 为可选属性提供合理的默认值

```kotlin
data class HttpRequest(
    val url: String,
    val method: String = "GET",
    val headers: Map<String, String> = emptyMap(),
    val body: String? = null,
    val timeout: Duration = Duration.ofSeconds(30),
    val retryCount: Int = 3
)

// 简化调用
val simpleGet = HttpRequest(url = "https://api.example.com/users")

// 完整配置
val complexPost = HttpRequest(
    url = "https://api.example.com/users",
    method = "POST",
    headers = mapOf("Content-Type" to "application/json"),
    body = """{"name": "张三"}""",
    timeout = Duration.ofSeconds(60)
)
```

### 数据类专注于数据，业务逻辑外置

```kotlin
// 数据类只存储数据
data class Invoice(
    val id: String,
    val items: List<InvoiceItem>,
    val discount: Double,
    val taxRate: Double
)

data class InvoiceItem(
    val productId: String,
    val quantity: Int,
    val unitPrice: Double
)

// 业务逻辑放在服务类或扩展函数中
class InvoiceCalculator {
    fun calculateSubtotal(invoice: Invoice): Double =
        invoice.items.sumOf { it.quantity * it.unitPrice }

    fun calculateTax(invoice: Invoice): Double =
        calculateSubtotal(invoice) * invoice.taxRate

    fun calculateTotal(invoice: Invoice): Double {
        val subtotal = calculateSubtotal(invoice)
        val afterDiscount = subtotal * (1 - invoice.discount)
        return afterDiscount * (1 + invoice.taxRate)
    }
}

// 或使用扩展函数
fun Invoice.subtotal(): Double = items.sumOf { it.quantity * it.unitPrice }
fun Invoice.total(): Double = subtotal() * (1 - discount) * (1 + taxRate)
```

### 使用 data object 表示单例状态

```kotlin
// Kotlin 1.9+
sealed interface UiState {
    data object Loading : UiState
    data object Empty : UiState
    data class Success(val data: List<String>) : UiState
    data class Error(val message: String, val retryAction: (() -> Unit)? = null) : UiState
}

fun render(state: UiState) {
    when (state) {
        UiState.Loading -> println("显示加载动画")
        UiState.Empty -> println("显示空状态图")
        is UiState.Success -> println("显示数据: ${state.data}")
        is UiState.Error -> println("显示错误: ${state.message}")
    }
}
```

### 合理使用嵌套与扁平结构

```kotlin
// 适度嵌套：层级清晰
data class Order(
    val id: String,
    val customer: Customer,
    val shipping: ShippingInfo,
    val payment: PaymentInfo
)

data class Customer(val id: String, val name: String)
data class ShippingInfo(val address: Address, val method: String)
data class PaymentInfo(val method: String, val amount: Double)
data class Address(val street: String, val city: String)

// 过度嵌套：更新困难
// data class DeepNested(val a: A) where A contains B contains C contains D...

// 扁平化：适合简单场景
data class FlatOrder(
    val id: String,
    val customerId: String,
    val customerName: String,
    val shippingStreet: String,
    val shippingCity: String,
    val paymentMethod: String,
    val paymentAmount: Double
)
```

## 常见陷阱

### Array 类型的 equals 陷阱

```kotlin
data class Container(val items: Array<String>)

fun main() {
    val c1 = Container(arrayOf("a", "b"))
    val c2 = Container(arrayOf("a", "b"))

    println(c1 == c2)  // false! Array 使用引用比较

    // 如果必须使用 Array，需要手动重写 equals/hashCode
    data class SafeContainer(val items: Array<String>) {
        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (other !is SafeContainer) return false
            return items.contentEquals(other.items)
        }

        override fun hashCode(): Int = items.contentHashCode()
    }

    // 更好的方案：使用 List
    data class BetterContainer(val items: List<String>)
}
```

### 类体属性不参与 copy()

```kotlin
data class Message(val id: Int, val content: String) {
    var readCount: Int = 0
    val createdAt: Long = System.currentTimeMillis()
}

fun main() {
    val original = Message(1, "Hello")
    original.readCount = 5

    val copied = original.copy(content = "Hi")

    println("原始 readCount: ${original.readCount}")  // 5
    println("复制 readCount: ${copied.readCount}")    // 0 - 未复制！

    // 解决方案：将需要复制的属性放入主构造函数
    data class BetterMessage(
        val id: Int,
        val content: String,
        val readCount: Int = 0,
        val createdAt: Long = System.currentTimeMillis()
    )
}
```

### 继承限制

```kotlin
// 数据类是 final 的，不能被继承
data class BaseUser(val name: String, val age: Int)
// class ExtendedUser(name: String, age: Int, val role: String) : BaseUser(name, age) // 编译错误

// 解决方案 1：使用组合
data class ExtendedUser(val user: BaseUser, val role: String)

// 解决方案 2：使用接口
interface UserInfo {
    val name: String
    val age: Int
}

data class BasicUser(override val name: String, override val age: Int) : UserInfo
data class AdminUser(
    override val name: String,
    override val age: Int,
    val permissions: List<String>
) : UserInfo

// 解决方案 3：使用密封类
sealed class User {
    abstract val name: String
    abstract val age: Int

    data class Regular(override val name: String, override val age: Int) : User()
    data class Admin(override val name: String, override val age: Int, val level: Int) : User()
}
```

### hashCode 与可变属性

```kotlin
data class MutableKey(var value: String)

fun main() {
    val map = mutableMapOf<MutableKey, String>()
    val key = MutableKey("original")

    map[key] = "data"
    println(map[key])  // "data"

    key.value = "modified"  // 修改了 key
    println(map[key])  // null! hashCode 变了，找不到了

    // 教训：用作 Map key 或 Set 元素的数据类必须使用 val
}
```

### 解构顺序依赖

```kotlin
data class Person(val name: String, val age: Int)

// 如果将来修改了参数顺序
data class PersonV2(val age: Int, val name: String)  // 危险！

fun main() {
    val p = PersonV2(25, "张三")
    val (name, age) = p  // 解构仍按位置，但含义变了！
    println("$name 岁的 $age")  // 25 岁的 张三 - 逻辑错误

    // 最佳实践：使用属性访问而非解构，或确保 API 稳定
}
```

### 深拷贝与浅拷贝

```kotlin
data class Team(val name: String, val members: MutableList<String>)

fun main() {
    val team1 = Team("A组", mutableListOf("张三", "李四"))
    val team2 = team1.copy()  // 浅拷贝

    team2.members.add("王五")  // 修改 team2 的 members

    println("team1: ${team1.members}")  // [张三, 李四, 王五] - team1 也被修改了！
    println("team2: ${team2.members}")  // [张三, 李四, 王五]

    // 解决方案：手动深拷贝
    val team3 = team1.copy(members = team1.members.toMutableList())
    team3.members.add("赵六")

    println("team1: ${team1.members}")  // [张三, 李四, 王五] - 不受影响
    println("team3: ${team3.members}")  // [张三, 李四, 王五, 赵六]

    // 更好的方案：使用不可变集合
    data class ImmutableTeam(val name: String, val members: List<String>)
}
```

## 性能考量

### 编译时生成 vs 运行时反射

数据类的方法在编译时生成，没有运行时反射开销：

```kotlin
data class Point(val x: Int, val y: Int)

// 编译后的字节码与手写的普通类几乎相同
// 没有额外的运行时开销
```

### hashCode 计算优化

频繁使用对象作为 Map key 时，可以缓存 hashCode：

```kotlin
// 普通数据类每次计算 hashCode
data class FrequentKey(val a: String, val b: String, val c: String)

// 缓存 hashCode 的版本
class CachedHashKey(val a: String, val b: String, val c: String) {
    private val cachedHash: Int = computeHash()

    private fun computeHash(): Int {
        var result = a.hashCode()
        result = 31 * result + b.hashCode()
        result = 31 * result + c.hashCode()
        return result
    }

    override fun hashCode(): Int = cachedHash

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is CachedHashKey) return false
        return a == other.a && b == other.b && c == other.c
    }
}
```

### copy() 的内存影响

每次 `copy()` 都会创建新对象，在热路径中需要注意：

```kotlin
data class State(val count: Int, val items: List<String>)

// 不推荐：循环中频繁 copy
fun updateAllItems(state: State, transform: (String) -> String): State {
    var current = state
    for (i in state.items.indices) {
        current = current.copy(
            items = current.items.toMutableList().apply { set(i, transform(get(i))) }
        )
    }
    return current  // 创建了 n 个中间对象
}

// 推荐：一次性更新
fun updateAllItemsOptimized(state: State, transform: (String) -> String): State {
    return state.copy(items = state.items.map(transform))  // 只创建 1 个新对象
}
```

### 大型数据类的考量

属性较多的数据类会生成较大的 equals/hashCode 方法：

```kotlin
// 属性多时考虑是否都需要参与比较
data class LargeEntity(
    val id: String,           // 唯一标识
    val name: String,
    val description: String,
    val metadata: Map<String, Any>,
    val tags: List<String>,
    // ... 更多属性
)

// 如果只需要按 id 比较，考虑手动实现
data class OptimizedEntity(
    val id: String,
    val name: String,
    val description: String
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is OptimizedEntity) return false
        return id == other.id  // 只比较 id
    }

    override fun hashCode(): Int = id.hashCode()
}
```

## 实战场景

### 场景一：API 响应模型

```kotlin
// 通用 API 响应
@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val code: Int,
    val message: String,
    val data: T?,
    val timestamp: Long = System.currentTimeMillis()
)

// 分页响应
@Serializable
data class PagedResponse<T>(
    val items: List<T>,
    val page: Int,
    val pageSize: Int,
    val totalItems: Long,
    val totalPages: Int
)

// 用户相关 DTO
@Serializable
data class UserDto(
    val id: Long,
    val username: String,
    val email: String,
    val avatar: String?,
    val roles: List<String>,
    val createdAt: String
)

@Serializable
data class CreateUserRequest(
    val username: String,
    val email: String,
    val password: String
)

@Serializable
data class UpdateUserRequest(
    val username: String? = null,
    val email: String? = null,
    val avatar: String? = null
)
```

### 场景二：状态管理（Android/Compose）

```kotlin
// UI 状态
data class HomeUiState(
    val isLoading: Boolean = false,
    val users: List<User> = emptyList(),
    val error: String? = null,
    val searchQuery: String = "",
    val selectedFilter: Filter = Filter.ALL
)

enum class Filter { ALL, ACTIVE, INACTIVE }

data class User(val id: Int, val name: String, val isActive: Boolean)

// ViewModel 中使用
class HomeViewModel {
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    fun onSearchQueryChange(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun onFilterChange(filter: Filter) {
        _uiState.update { it.copy(selectedFilter = filter) }
    }

    fun loadUsers() {
        _uiState.update { it.copy(isLoading = true, error = null) }

        viewModelScope.launch {
            try {
                val users = repository.getUsers()
                _uiState.update { it.copy(isLoading = false, users = users) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }
}
```

### 场景三：领域驱动设计值对象

```kotlin
// 值对象：通过值相等而非引用相等
data class Money(val amount: BigDecimal, val currency: Currency) {
    init {
        require(amount >= BigDecimal.ZERO) { "金额不能为负" }
    }

    operator fun plus(other: Money): Money {
        require(currency == other.currency) { "货币单位不同" }
        return Money(amount + other.amount, currency)
    }

    operator fun times(multiplier: Int): Money {
        return Money(amount * multiplier.toBigDecimal(), currency)
    }
}

data class EmailAddress(val value: String) {
    init {
        require(value.matches(Regex("^[\\w-.]+@[\\w-]+\\.[a-z]{2,}$"))) {
            "邮箱格式无效"
        }
    }
}

data class PhoneNumber(val countryCode: String, val number: String) {
    val formatted: String get() = "+$countryCode $number"
}

// 实体中使用值对象
data class Order(
    val id: OrderId,
    val customer: CustomerId,
    val items: List<OrderItem>,
    val shippingAddress: Address,
    val totalAmount: Money,
    val status: OrderStatus
)

data class OrderItem(
    val product: ProductId,
    val quantity: Int,
    val unitPrice: Money
) {
    val subtotal: Money get() = unitPrice * quantity
}
```

### 场景四：配置与构建器模式

```kotlin
data class HttpClientConfig(
    val baseUrl: String,
    val timeout: Duration = Duration.ofSeconds(30),
    val maxRetries: Int = 3,
    val headers: Map<String, String> = emptyMap(),
    val interceptors: List<Interceptor> = emptyList(),
    val enableLogging: Boolean = false
)

// 使用 copy 实现流式配置
fun HttpClientConfig.withTimeout(timeout: Duration) = copy(timeout = timeout)
fun HttpClientConfig.withHeader(key: String, value: String) = copy(headers = headers + (key to value))
fun HttpClientConfig.withLogging(enabled: Boolean = true) = copy(enableLogging = enabled)

// 使用
val config = HttpClientConfig(baseUrl = "https://api.example.com")
    .withTimeout(Duration.ofSeconds(60))
    .withHeader("Authorization", "Bearer token")
    .withHeader("Accept", "application/json")
    .withLogging()
```

### 场景五：事件溯源

```kotlin
sealed class OrderEvent {
    abstract val orderId: String
    abstract val timestamp: Instant

    data class Created(
        override val orderId: String,
        override val timestamp: Instant,
        val customerId: String,
        val items: List<OrderItem>
    ) : OrderEvent()

    data class ItemAdded(
        override val orderId: String,
        override val timestamp: Instant,
        val item: OrderItem
    ) : OrderEvent()

    data class Paid(
        override val orderId: String,
        override val timestamp: Instant,
        val amount: BigDecimal,
        val paymentMethod: String
    ) : OrderEvent()

    data class Shipped(
        override val orderId: String,
        override val timestamp: Instant,
        val trackingNumber: String,
        val carrier: String
    ) : OrderEvent()

    data class Cancelled(
        override val orderId: String,
        override val timestamp: Instant,
        val reason: String
    ) : OrderEvent()
}

// 事件重放
fun rebuildOrder(events: List<OrderEvent>): Order? {
    return events.fold<OrderEvent, Order?>(null) { order, event ->
        when (event) {
            is OrderEvent.Created -> Order(
                id = event.orderId,
                customerId = event.customerId,
                items = event.items,
                status = OrderStatus.CREATED
            )
            is OrderEvent.ItemAdded -> order?.copy(
                items = order.items + event.item
            )
            is OrderEvent.Paid -> order?.copy(status = OrderStatus.PAID)
            is OrderEvent.Shipped -> order?.copy(status = OrderStatus.SHIPPED)
            is OrderEvent.Cancelled -> order?.copy(status = OrderStatus.CANCELLED)
        }
    }
}
```

## 面试要点

### 基础问题

**Q1: 数据类与普通类有什么区别？**

数据类通过 `data` 关键字声明，编译器会自动生成 `equals()`、`hashCode()`、`toString()`、`componentN()` 和 `copy()` 方法。普通类需要手动实现这些方法。数据类主要用于存储数据，而普通类可以包含更复杂的行为逻辑。

**Q2: 数据类的定义有哪些限制？**

- 主构造函数必须有至少一个参数
- 所有主构造函数参数必须用 `val` 或 `var` 标记
- 数据类不能是 abstract、open、sealed 或 inner
- 数据类可以实现接口，可以继承密封类

**Q3: copy() 函数是深拷贝还是浅拷贝？**

`copy()` 执行的是浅拷贝。它会创建一个新对象，但内部的引用类型属性（如集合、对象）仍然指向原来的对象。如果需要深拷贝，需要手动复制嵌套对象。

### 进阶问题

**Q4: 为什么推荐数据类使用 val 而非 var？**

- 不可变性使代码更安全，避免意外修改
- 不可变对象天然线程安全
- 便于推理程序状态
- 配合 `copy()` 可以优雅地创建修改后的副本
- 使用 `var` 可能导致 hashCode 变化，影响在 Set/Map 中的行为

**Q5: 类体中定义的属性与主构造函数属性有什么区别？**

主构造函数中的属性会参与 `equals()`、`hashCode()`、`toString()`、`componentN()` 和 `copy()` 的生成。类体中定义的属性不参与这些方法，`copy()` 时也不会复制。

**Q6: 如何解决数据类中使用 Array 的 equals 问题？**

有两种方案：
1. 使用 `List` 替代 `Array`（推荐）
2. 手动重写 `equals()` 和 `hashCode()`，使用 `contentEquals()` 和 `contentHashCode()`

### 场景问题

**Q7: 在 Android 开发中，数据类通常用在哪些场景？**

- UI 状态（ViewModel 中的 State）
- API 请求/响应 DTO
- 数据库实体（Room Entity）
- Intent/Bundle 传递的数据
- RecyclerView 的列表项数据

**Q8: 如何设计一个表示"加载中/成功/失败"三种状态的数据结构？**

使用密封类结合数据类：

```kotlin
sealed class LoadState<out T> {
    data object Loading : LoadState<Nothing>()
    data class Success<T>(val data: T) : LoadState<T>()
    data class Error(val exception: Throwable) : LoadState<Nothing>()
}
```

**Q9: 数据类可以被继承吗？如何实现类似继承的效果？**

数据类是 final 的，不能被继承。可以通过以下方式实现类似效果：
1. 组合：将基类作为数据类的属性
2. 接口：让多个数据类实现同一接口
3. 密封类：数据类作为密封类的子类

## 延伸阅读

### 官方文档

- [Kotlin 官方文档 - Data Classes](https://kotlinlang.org/docs/data-classes.html)
- [Kotlin 官方文档 - Destructuring Declarations](https://kotlinlang.org/docs/destructuring-declarations.html)
- [Kotlin 官方文档 - Sealed Classes](https://kotlinlang.org/docs/sealed-classes.html)

### 相关概念

- [Kotlin 密封类详解](/kotlin/sealed-classes) - 与数据类配合使用的代数数据类型
- [Kotlin 空安全](/kotlin/null-safety) - 数据类中处理可空类型
- [Kotlin 集合操作](/kotlin/collections) - 数据类与集合框架的配合

### 设计模式与架构

- 值对象（Value Object）模式 - DDD 中的核心概念
- 不可变性（Immutability）- 函数式编程的基础
- 状态管理模式 - 在 UI 开发中管理应用状态

### 对比学习

| 语言 | 类似特性 |
|------|----------|
| Java 14+ | record |
| Scala | case class |
| C# | record (C# 9+) |
| Python | @dataclass |
| TypeScript | 无原生支持，可用 class + readonly |

---

数据类是 Kotlin 最实用的特性之一，它体现了 Kotlin "简洁优雅"的设计哲学。通过自动生成样板代码，数据类让开发者能够专注于业务逻辑，同时保持代码的类型安全和可维护性。掌握数据类的使用及其背后的原理，是成为 Kotlin 高效开发者的重要一步。
