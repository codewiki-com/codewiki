---
title: 委托属性
description: Kotlin委托属性完全指南，lazy、observable与自定义委托
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - Kotlin
  - 委托
  - 属性
  - lazy
status: imported
origin: old/src/content/docs/kotlin/delegated-properties.zh.md
divergence: 0.214
issues:
  - title-lang-en
  - title-language
legacy:
  category: Kotlin
  subcategory: 语言特性
  order: 7
  lastUpdated: 2026-01-07
---

委托属性（Delegated Properties）是 Kotlin 中一个强大的特性，它允许你将属性的 getter 和 setter 逻辑委托给另一个对象处理。这种机制可以帮助你复用常见的属性逻辑，避免重复代码，使代码更加简洁优雅。

## 什么是委托属性

在日常开发中，有一些常见的属性模式会反复出现：

- **延迟初始化属性**：值只在第一次访问时计算
- **可观察属性**：当属性值发生变化时通知监听器
- **将属性存储在 Map 中**：而不是为每个属性单独创建字段

Kotlin 的委托属性机制正是为了优雅地处理这些场景而设计的。

## by 关键字基础

委托属性的语法非常简洁：

```kotlin
val/var <属性名>: <类型> by <委托表达式>
```

`by` 关键字后面的表达式就是委托对象。属性的 `get()`（以及 `var` 属性的 `set()`）会被委托给这个对象的 `getValue()` 和 `setValue()` 方法。

### 基本示例

```kotlin
import kotlin.reflect.KProperty

class Delegate {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): String {
        return "$thisRef 的属性 '${property.name}' 已委托给我！"
    }

    operator fun setValue(thisRef: Any?, property: KProperty<*>, value: String) {
        println("属性 '${property.name}' 被赋值为: $value")
    }
}

class Example {
    var message: String by Delegate()
}

fun main() {
    val example = Example()
    println(example.message)  // 输出: Example@... 的属性 'message' 已委托给我！
    example.message = "Hello" // 输出: 属性 'message' 被赋值为: Hello
}
```

## lazy 延迟委托

`lazy` 是 Kotlin 标准库中最常用的委托之一。它接收一个 lambda 表达式，返回一个 `Lazy<T>` 实例，用于实现延迟初始化属性。

### 基本用法

```kotlin
val lazyValue: String by lazy {
    println("正在计算...")
    "Hello, Lazy!"
}

fun main() {
    println(lazyValue)  // 第一次访问，输出 "正在计算..." 然后输出 "Hello, Lazy!"
    println(lazyValue)  // 第二次访问，直接输出 "Hello, Lazy!"（不再计算）
}
```

### 线程安全模式

`lazy` 默认是线程安全的，但你可以根据需要选择不同的模式：

```kotlin
// 1. 默认模式 - 同步锁，线程安全（默认）
val synchronized: String by lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
    "线程安全的初始化"
}

// 2. 发布模式 - 允许多个线程同时初始化，但只有第一个完成的值会被使用
val publication: String by lazy(LazyThreadSafetyMode.PUBLICATION) {
    "多线程初始化，第一个完成的获胜"
}

// 3. 无锁模式 - 无线程安全保证，性能最好
val none: String by lazy(LazyThreadSafetyMode.NONE) {
    "单线程使用，无锁"
}
```

### 实际应用场景

#### 场景一：延迟加载配置

```kotlin
class AppConfig {
    // 只在第一次访问时读取配置文件
    val databaseUrl: String by lazy {
        println("正在加载数据库配置...")
        Properties().apply {
            load(FileInputStream("config.properties"))
        }.getProperty("database.url")
    }

    val maxConnections: Int by lazy {
        println("正在加载连接池配置...")
        Properties().apply {
            load(FileInputStream("config.properties"))
        }.getProperty("pool.maxConnections").toInt()
    }
}
```

#### 场景二：Android View 绑定

```kotlin
class MainActivity : AppCompatActivity() {
    // 延迟初始化 View，避免在 onCreate 之前访问
    private val textView: TextView by lazy {
        findViewById(R.id.textView)
    }

    private val recyclerView: RecyclerView by lazy {
        findViewById<RecyclerView>(R.id.recyclerView).apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        textView.text = "Hello!"  // 此时才会初始化 textView
    }
}
```

#### 场景三：昂贵对象的按需创建

```kotlin
class ImageProcessor {
    // 只在实际需要处理图片时才创建处理器
    private val heavyProcessor: NeuralNetworkProcessor by lazy {
        println("加载神经网络模型（这可能需要几秒钟）...")
        NeuralNetworkProcessor().apply {
            loadModel("model.pb")
            warmUp()
        }
    }

    fun processImage(image: Image): ProcessedImage {
        return heavyProcessor.process(image)
    }

    fun quickResize(image: Image, width: Int, height: Int): Image {
        // 简单操作不需要神经网络处理器
        return image.resize(width, height)
    }
}
```

## observable 可观察委托

`Delegates.observable()` 让你可以监听属性值的变化。每当属性被赋值时（赋值完成后），指定的处理器会被调用。

### 基本用法

```kotlin
import kotlin.properties.Delegates

class User {
    var name: String by Delegates.observable("<未设置>") { property, oldValue, newValue ->
        println("${property.name}: $oldValue -> $newValue")
    }
}

fun main() {
    val user = User()
    user.name = "张三"    // 输出: name: <未设置> -> 张三
    user.name = "李四"    // 输出: name: 张三 -> 李四
}
```

### 实际应用场景

#### 场景一：UI 数据绑定

```kotlin
class ViewModel {
    var userName: String by Delegates.observable("") { _, old, new ->
        if (old != new) {
            updateUI()
        }
    }

    var isLoading: Boolean by Delegates.observable(false) { _, _, isLoading ->
        if (isLoading) {
            showLoadingIndicator()
        } else {
            hideLoadingIndicator()
        }
    }

    private fun updateUI() { /* 更新界面 */ }
    private fun showLoadingIndicator() { /* 显示加载指示器 */ }
    private fun hideLoadingIndicator() { /* 隐藏加载指示器 */ }
}
```

#### 场景二：日志记录与审计

```kotlin
class AuditableEntity {
    var status: String by Delegates.observable("CREATED") { prop, old, new ->
        auditLog.record(
            entityId = this.id,
            field = prop.name,
            oldValue = old,
            newValue = new,
            timestamp = System.currentTimeMillis(),
            userId = getCurrentUserId()
        )
    }

    var amount: Double by Delegates.observable(0.0) { prop, old, new ->
        if (new > 10000) {
            alertService.notifyHighValueChange(this.id, old, new)
        }
        auditLog.record(entityId = this.id, field = prop.name, oldValue = old, newValue = new)
    }
}
```

#### 场景三：表单状态管理

```kotlin
class FormState {
    private val listeners = mutableListOf<(String) -> Unit>()

    var email: String by Delegates.observable("") { _, _, new ->
        notifyListeners("email: $new")
        validateEmail(new)
    }

    var password: String by Delegates.observable("") { _, _, new ->
        notifyListeners("password changed")
        validatePassword(new)
    }

    var isValid: Boolean by Delegates.observable(false) { _, _, isValid ->
        submitButton.isEnabled = isValid
    }

    fun addListener(listener: (String) -> Unit) {
        listeners.add(listener)
    }

    private fun notifyListeners(message: String) {
        listeners.forEach { it(message) }
    }
}
```

## vetoable 可否决委托

`Delegates.vetoable()` 与 `observable` 类似，但它在赋值之前被调用，允许你否决（拒绝）某些赋值操作。

### 基本用法

```kotlin
import kotlin.properties.Delegates

class Person {
    var age: Int by Delegates.vetoable(0) { _, oldValue, newValue ->
        println("尝试将年龄从 $oldValue 改为 $newValue")
        newValue >= 0 && newValue <= 150  // 返回 true 接受，false 拒绝
    }
}

fun main() {
    val person = Person()
    person.age = 25    // 成功，age = 25
    println(person.age) // 输出: 25

    person.age = -5    // 被拒绝，age 仍为 25
    println(person.age) // 输出: 25

    person.age = 200   // 被拒绝，age 仍为 25
    println(person.age) // 输出: 25
}
```

### 实际应用场景

#### 场景一：数据验证

```kotlin
class BankAccount {
    var balance: Double by Delegates.vetoable(0.0) { _, old, new ->
        when {
            new < 0 -> {
                println("错误: 余额不能为负数")
                false
            }
            new - old > 100000 -> {
                println("警告: 单次变动超过10万，需要额外审批")
                requestApproval()
            }
            else -> true
        }
    }

    var dailyLimit: Int by Delegates.vetoable(5000) { _, _, new ->
        new in 1000..50000  // 限额必须在合理范围内
    }
}
```

#### 场景二：状态机约束

```kotlin
enum class OrderStatus {
    CREATED, PAID, SHIPPED, DELIVERED, CANCELLED
}

class Order {
    var status: OrderStatus by Delegates.vetoable(OrderStatus.CREATED) { _, old, new ->
        val validTransitions = mapOf(
            OrderStatus.CREATED to setOf(OrderStatus.PAID, OrderStatus.CANCELLED),
            OrderStatus.PAID to setOf(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED to setOf(OrderStatus.DELIVERED),
            OrderStatus.DELIVERED to emptySet(),
            OrderStatus.CANCELLED to emptySet()
        )

        val allowed = validTransitions[old]?.contains(new) ?: false
        if (!allowed) {
            println("非法状态转换: $old -> $new")
        }
        allowed
    }
}

fun main() {
    val order = Order()
    order.status = OrderStatus.PAID       // 成功
    order.status = OrderStatus.DELIVERED  // 失败：必须先发货
    order.status = OrderStatus.SHIPPED    // 成功
    order.status = OrderStatus.DELIVERED  // 成功
    order.status = OrderStatus.CREATED    // 失败：已完成订单不能回退
}
```

#### 场景三：输入过滤

```kotlin
class UserProfile {
    var username: String by Delegates.vetoable("") { _, _, new ->
        val isValid = new.length in 3..20 &&
                      new.all { it.isLetterOrDigit() || it == '_' }
        if (!isValid) {
            println("用户名格式不正确：3-20个字符，只能包含字母、数字和下划线")
        }
        isValid
    }

    var email: String by Delegates.vetoable("") { _, _, new ->
        val emailRegex = Regex("^[A-Za-z0-9+_.-]+@(.+)$")
        val isValid = emailRegex.matches(new)
        if (!isValid) {
            println("邮箱格式不正确")
        }
        isValid
    }
}
```

## 将属性存储在 Map 中

Kotlin 允许你将属性值存储在 Map 中，这在处理 JSON 数据或动态属性时特别有用。

### 只读属性与 Map

```kotlin
class User(val map: Map<String, Any?>) {
    val name: String by map
    val age: Int by map
    val email: String by map
}

fun main() {
    val user = User(mapOf(
        "name" to "张三",
        "age" to 25,
        "email" to "zhangsan@example.com"
    ))

    println(user.name)   // 输出: 张三
    println(user.age)    // 输出: 25
    println(user.email)  // 输出: zhangsan@example.com
}
```

### 可变属性与 MutableMap

```kotlin
class MutableUser(val map: MutableMap<String, Any?>) {
    var name: String by map
    var age: Int by map
}

fun main() {
    val map = mutableMapOf<String, Any?>(
        "name" to "张三",
        "age" to 25
    )
    val user = MutableUser(map)

    println(user.name)  // 输出: 张三
    user.name = "李四"
    println(map["name"]) // 输出: 李四（Map 中的值也变了）
}
```

### 实际应用场景

#### 场景一：JSON 数据映射

```kotlin
import com.google.gson.Gson

class DynamicConfig(private val json: String) {
    private val map: Map<String, Any?> = Gson().fromJson(json, Map::class.java) as Map<String, Any?>

    val appName: String by map
    val version: String by map
    val features: List<String> by map
}

fun main() {
    val json = """
        {
            "appName": "MyApp",
            "version": "1.0.0",
            "features": ["dark_mode", "notifications", "sync"]
        }
    """.trimIndent()

    val config = DynamicConfig(json)
    println(config.appName)  // 输出: MyApp
    println(config.features) // 输出: [dark_mode, notifications, sync]
}
```

#### 场景二：灵活的实体类

```kotlin
open class DynamicEntity(protected val data: MutableMap<String, Any?> = mutableMapOf()) {
    fun toMap(): Map<String, Any?> = data.toMap()
}

class Product(data: MutableMap<String, Any?> = mutableMapOf()) : DynamicEntity(data) {
    var id: Long by data
    var name: String by data
    var price: Double by data
    var stock: Int by data

    // 支持额外的动态属性
    operator fun get(key: String): Any? = data[key]
    operator fun set(key: String, value: Any?) { data[key] = value }
}

fun main() {
    val product = Product(mutableMapOf(
        "id" to 1L,
        "name" to "笔记本电脑",
        "price" to 5999.0,
        "stock" to 100
    ))

    // 使用类型安全的属性
    println(product.name)   // 输出: 笔记本电脑
    product.price = 5499.0

    // 使用动态属性
    product["brand"] = "联想"
    product["warranty"] = "3年"

    println(product.toMap())
}
```

## 委托到另一个属性

Kotlin 1.4+ 支持将一个属性委托给另一个属性，这在属性重命名等场景下非常有用。

### 基本语法

```kotlin
var topLevelInt: Int = 0

class MyClass(var memberInt: Int) {
    // 委托给同一类的成员属性
    var delegatedToMember: Int by this::memberInt

    // 委托给顶级属性
    var delegatedToTopLevel: Int by ::topLevelInt
}
```

### 属性重命名的向后兼容

```kotlin
class UserSettings {
    var newPropertyName: String = "default"

    @Deprecated(
        message = "使用 newPropertyName 代替",
        replaceWith = ReplaceWith("newPropertyName")
    )
    var oldPropertyName: String by this::newPropertyName
}

fun main() {
    val settings = UserSettings()

    // 新代码使用新属性名
    settings.newPropertyName = "value"

    // 旧代码继续工作，但会收到废弃警告
    println(settings.oldPropertyName)  // 输出: value
}
```

### 扩展属性委托

```kotlin
class Container {
    var value: Int = 0
}

// 扩展属性委托给成员属性
var Container.alias: Int by Container::value

fun main() {
    val container = Container()
    container.value = 42
    println(container.alias)  // 输出: 42

    container.alias = 100
    println(container.value)  // 输出: 100
}
```

## 自定义委托

创建自定义委托可以封装复杂的属性逻辑，实现代码复用。

### 委托的基本要求

对于只读属性（`val`），委托必须提供 `getValue()` 方法：

```kotlin
operator fun getValue(thisRef: R, property: KProperty<*>): T
```

对于可变属性（`var`），还需要提供 `setValue()` 方法：

```kotlin
operator fun setValue(thisRef: R, property: KProperty<*>, value: T)
```

### 使用接口实现

```kotlin
import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

class TrimmedString : ReadWriteProperty<Any?, String> {
    private var value: String = ""

    override fun getValue(thisRef: Any?, property: KProperty<*>): String {
        return value
    }

    override fun setValue(thisRef: Any?, property: KProperty<*>, value: String) {
        this.value = value.trim()
    }
}

class Form {
    var username: String by TrimmedString()
    var email: String by TrimmedString()
}

fun main() {
    val form = Form()
    form.username = "  张三  "
    form.email = "  zhangsan@example.com   "

    println("'${form.username}'")  // 输出: '张三'
    println("'${form.email}'")     // 输出: 'zhangsan@example.com'
}
```

### 实用自定义委托示例

#### 示例一：非空验证委托

```kotlin
class NotNull<T : Any> : ReadWriteProperty<Any?, T> {
    private var value: T? = null

    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        return value ?: throw IllegalStateException(
            "属性 ${property.name} 还未初始化"
        )
    }

    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        this.value = value
    }
}

class Config {
    var databaseUrl: String by NotNull()
    var apiKey: String by NotNull()
}
```

#### 示例二：范围限制委托

```kotlin
class Clamped(
    private val min: Int,
    private val max: Int
) : ReadWriteProperty<Any?, Int> {
    private var value: Int = min

    override fun getValue(thisRef: Any?, property: KProperty<*>): Int = value

    override fun setValue(thisRef: Any?, property: KProperty<*>, value: Int) {
        this.value = value.coerceIn(min, max)
    }
}

class AudioPlayer {
    var volume: Int by Clamped(0, 100)
    var bass: Int by Clamped(-10, 10)
    var treble: Int by Clamped(-10, 10)
}

fun main() {
    val player = AudioPlayer()
    player.volume = 150  // 会被限制为 100
    player.volume = -50  // 会被限制为 0
    println(player.volume)  // 输出: 0
}
```

#### 示例三：SharedPreferences 委托（Android）

```kotlin
class PreferenceDelegate<T>(
    private val prefs: SharedPreferences,
    private val key: String,
    private val defaultValue: T
) : ReadWriteProperty<Any?, T> {

    @Suppress("UNCHECKED_CAST")
    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        return when (defaultValue) {
            is Boolean -> prefs.getBoolean(key, defaultValue) as T
            is Int -> prefs.getInt(key, defaultValue) as T
            is Long -> prefs.getLong(key, defaultValue) as T
            is Float -> prefs.getFloat(key, defaultValue) as T
            is String -> prefs.getString(key, defaultValue) as T
            else -> throw IllegalArgumentException("不支持的类型")
        }
    }

    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        with(prefs.edit()) {
            when (value) {
                is Boolean -> putBoolean(key, value)
                is Int -> putInt(key, value)
                is Long -> putLong(key, value)
                is Float -> putFloat(key, value)
                is String -> putString(key, value)
                else -> throw IllegalArgumentException("不支持的类型")
            }
            apply()
        }
    }
}

// 使用工厂函数简化创建
fun <T> SharedPreferences.delegate(key: String, default: T) =
    PreferenceDelegate(this, key, default)

class Settings(prefs: SharedPreferences) {
    var isDarkMode: Boolean by prefs.delegate("dark_mode", false)
    var fontSize: Int by prefs.delegate("font_size", 14)
    var username: String by prefs.delegate("username", "")
}
```

#### 示例四：缓存委托

```kotlin
class Cached<T>(
    private val ttlMillis: Long,
    private val loader: () -> T
) : ReadOnlyProperty<Any?, T> {
    private var cachedValue: T? = null
    private var lastLoadTime: Long = 0

    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        val now = System.currentTimeMillis()
        if (cachedValue == null || now - lastLoadTime > ttlMillis) {
            cachedValue = loader()
            lastLoadTime = now
        }
        return cachedValue!!
    }
}

fun <T> cached(ttlMillis: Long, loader: () -> T) = Cached(ttlMillis, loader)

class WeatherService {
    // 天气数据缓存 5 分钟
    val currentWeather: Weather by cached(5 * 60 * 1000) {
        println("正在获取天气数据...")
        fetchWeatherFromApi()
    }
}
```

#### 示例五：格式化委托

```kotlin
class Formatted<T>(
    private val format: (T) -> String,
    private val parse: (String) -> T
) : ReadWriteProperty<Any?, T> {
    private var rawValue: String = ""

    override fun getValue(thisRef: Any?, property: KProperty<*>): T = parse(rawValue)

    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        rawValue = format(value)
    }
}

class Money(private var cents: Long = 0) {
    var amount: Double by Formatted(
        format = { "%.2f".format(it) },
        parse = { it.toDoubleOrNull() ?: 0.0 }
    )
}
```

## provideDelegate 操作符

`provideDelegate` 允许你在委托绑定时进行额外的逻辑处理，比如验证属性名称。

```kotlin
class ResourceLoader<T>(private val resourceId: String) {
    operator fun provideDelegate(
        thisRef: Any?,
        prop: KProperty<*>
    ): ReadOnlyProperty<Any?, T> {
        // 在绑定时验证
        require(prop.name.startsWith("resource")) {
            "使用 ResourceLoader 的属性名必须以 'resource' 开头"
        }
        println("正在为属性 '${prop.name}' 加载资源 '$resourceId'")
        return ResourceDelegate(loadResource(resourceId))
    }

    private fun loadResource(id: String): T {
        // 模拟加载资源
        @Suppress("UNCHECKED_CAST")
        return "Resource: $id" as T
    }
}

class ResourceDelegate<T>(private val resource: T) : ReadOnlyProperty<Any?, T> {
    override fun getValue(thisRef: Any?, property: KProperty<*>): T = resource
}

class MyUI {
    val resourceImage: String by ResourceLoader("image_1")
    val resourceText: String by ResourceLoader("text_1")
    // val invalidName: String by ResourceLoader("test")  // 会抛出异常
}
```

## 局部委托属性

委托属性不仅可以用于类成员，还可以用于局部变量：

```kotlin
fun computeValue(): String {
    println("计算值...")
    return "计算结果"
}

fun example(condition: Boolean) {
    // 只有当 condition 为 true 时才会计算
    val memoizedValue by lazy { computeValue() }

    if (condition) {
        println(memoizedValue)  // 此时才会触发计算
        println(memoizedValue)  // 使用缓存值
    }
    // 如果 condition 为 false，computeValue() 永远不会被调用
}
```

## 编译器优化

Kotlin 编译器对委托属性做了一些优化。在以下情况下，编译器会省略 `$delegate` 辅助字段：

1. **属性引用**：`by ::property`
2. **命名对象**：`by NamedObject`
3. **带有默认 getter 的 final val 属性**
4. **常量表达式、枚举项、this、null**

```kotlin
object StringDelegate {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): String = "value"
}

class Optimized {
    // 编译器会优化这种情况，不生成额外的委托字段
    val s: String by StringDelegate
}
```

## 最佳实践

### 选择合适的委托类型

| 场景 | 推荐委托 |
|------|---------|
| 延迟初始化 | `lazy` |
| 监听属性变化 | `Delegates.observable` |
| 验证/拦截赋值 | `Delegates.vetoable` |
| 动态/JSON数据 | Map 委托 |
| 自定义复杂逻辑 | 自定义委托 |

### 注意线程安全

```kotlin
// 多线程环境使用默认的 SYNCHRONIZED 模式
val threadSafe: String by lazy { "safe" }

// 单线程环境可以使用 NONE 提高性能
val singleThread: String by lazy(LazyThreadSafetyMode.NONE) { "fast" }
```

### 避免在委托中执行重操作

```kotlin
// 不好的做法 - observable 每次赋值都会执行
var value: Int by Delegates.observable(0) { _, _, new ->
    database.save(new)  // 每次赋值都保存数据库，性能差
}

// 更好的做法 - 使用防抖或批量处理
class DebouncedSave<T>(
    initialValue: T,
    private val delayMs: Long,
    private val onSave: (T) -> Unit
) : ReadWriteProperty<Any?, T> {
    private var value: T = initialValue
    private var job: Job? = null

    override fun getValue(thisRef: Any?, property: KProperty<*>): T = value

    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        this.value = value
        job?.cancel()
        job = GlobalScope.launch {
            delay(delayMs)
            onSave(value)
        }
    }
}
```

### 善用泛型委托

```kotlin
// 通用的日志委托
class LoggingDelegate<T>(
    private var value: T,
    private val name: String
) : ReadWriteProperty<Any?, T> {
    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        println("读取 $name: $value")
        return value
    }

    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        println("设置 $name: ${this.value} -> $value")
        this.value = value
    }
}

fun <T> logged(initialValue: T, name: String) = LoggingDelegate(initialValue, name)

class Debug {
    var counter: Int by logged(0, "counter")
    var message: String by logged("", "message")
}
```

## 总结

Kotlin 的委托属性是一个强大而灵活的特性，它允许你：

- 使用 `lazy` 实现延迟初始化，提高性能
- 使用 `observable` 监听属性变化，实现响应式编程
- 使用 `vetoable` 验证和拦截赋值操作
- 使用 Map 委托处理动态数据
- 创建自定义委托封装复杂的属性逻辑
- 使用 `provideDelegate` 在委托绑定时执行额外逻辑

通过合理使用委托属性，你可以写出更加简洁、可维护且功能强大的 Kotlin 代码。记住，委托的核心思想是"关注点分离"——将属性的存储和访问逻辑从业务代码中分离出来，实现更好的代码组织和复用。
