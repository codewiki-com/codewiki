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
origin: old/src/content/docs/kotlin/delegated-properties.en.md
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

Delegated Properties are a powerful feature in Kotlin that allows you to delegate the getter and setter logic of a property to another object. This mechanism helps you reuse common property logic, avoid repetitive code, and make your code more concise and elegant.

## What Are Delegated Properties

In daily development, certain common property patterns appear repeatedly:

- **Lazy initialization properties**: Values are computed only on first access
- **Observable properties**: Listeners are notified when property values change
- **Storing properties in a Map**: Rather than creating separate fields for each property

Kotlin's delegated property mechanism is designed to handle these scenarios elegantly.

## The `by` Keyword Basics

The syntax for delegated properties is very concise:

```kotlin
val/var <property name>: <Type> by <delegate expression>
```

The expression after the `by` keyword is the delegate object. The property's `get()` (and `set()` for `var` properties) will be delegated to this object's `getValue()` and `setValue()` methods.

### Basic Example

```kotlin
import kotlin.reflect.KProperty

class Delegate {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): String {
        return "$thisRef's property '${property.name}' has been delegated to me!"
    }

    operator fun setValue(thisRef: Any?, property: KProperty<*>, value: String) {
        println("Property '${property.name}' is being set to: $value")
    }
}

class Example {
    var message: String by Delegate()
}

fun main() {
    val example = Example()
    println(example.message)  // Output: Example@...'s property 'message' has been delegated to me!
    example.message = "Hello" // Output: Property 'message' is being set to: Hello
}
```

## lazy Delegation

`lazy` is one of the most commonly used delegates in Kotlin's standard library. It takes a lambda expression and returns a `Lazy<T>` instance for implementing lazy initialization of properties.

### Basic Usage

```kotlin
val lazyValue: String by lazy {
    println("Computing...")
    "Hello, Lazy!"
}

fun main() {
    println(lazyValue)  // First access, outputs "Computing..." then "Hello, Lazy!"
    println(lazyValue)  // Second access, directly outputs "Hello, Lazy!" (no recomputation)
}
```

### Thread Safety Modes

`lazy` is thread-safe by default, but you can choose different modes based on your needs:

```kotlin
// 1. Default mode - synchronized lock, thread-safe (default)
val synchronized: String by lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
    "Thread-safe initialization"
}

// 2. Publication mode - allows multiple threads to initialize simultaneously, but only the first completed value is used
val publication: String by lazy(LazyThreadSafetyMode.PUBLICATION) {
    "Multi-threaded initialization, first to complete wins"
}

// 3. None mode - no thread safety guarantee, best performance
val none: String by lazy(LazyThreadSafetyMode.NONE) {
    "Single-threaded use, no locks"
}
```

### Practical Use Cases

#### Case 1: Lazy Loading Configuration

```kotlin
class AppConfig {
    // Only reads the config file on first access
    val databaseUrl: String by lazy {
        println("Loading database configuration...")
        Properties().apply {
            load(FileInputStream("config.properties"))
        }.getProperty("database.url")
    }

    val maxConnections: Int by lazy {
        println("Loading connection pool configuration...")
        Properties().apply {
            load(FileInputStream("config.properties"))
        }.getProperty("pool.maxConnections").toInt()
    }
}
```

#### Case 2: Android View Binding

```kotlin
class MainActivity : AppCompatActivity() {
    // Lazy initialization of Views, avoiding access before onCreate
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

        textView.text = "Hello!"  // textView is initialized at this point
    }
}
```

#### Case 3: On-Demand Creation of Expensive Objects

```kotlin
class ImageProcessor {
    // Only creates the processor when actually needed for image processing
    private val heavyProcessor: NeuralNetworkProcessor by lazy {
        println("Loading neural network model (this may take a few seconds)...")
        NeuralNetworkProcessor().apply {
            loadModel("model.pb")
            warmUp()
        }
    }

    fun processImage(image: Image): ProcessedImage {
        return heavyProcessor.process(image)
    }

    fun quickResize(image: Image, width: Int, height: Int): Image {
        // Simple operations don't need the neural network processor
        return image.resize(width, height)
    }
}
```

## observable Delegation

`Delegates.observable()` allows you to monitor property value changes. Whenever a property is assigned (after the assignment is complete), the specified handler is called.

### Basic Usage

```kotlin
import kotlin.properties.Delegates

class User {
    var name: String by Delegates.observable("<not set>") { property, oldValue, newValue ->
        println("${property.name}: $oldValue -> $newValue")
    }
}

fun main() {
    val user = User()
    user.name = "John"    // Output: name: <not set> -> John
    user.name = "Jane"    // Output: name: John -> Jane
}
```

### Practical Use Cases

#### Case 1: UI Data Binding

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

    private fun updateUI() { /* Update the interface */ }
    private fun showLoadingIndicator() { /* Show loading indicator */ }
    private fun hideLoadingIndicator() { /* Hide loading indicator */ }
}
```

#### Case 2: Logging and Auditing

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

#### Case 3: Form State Management

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

## vetoable Delegation

`Delegates.vetoable()` is similar to `observable`, but it is called before the assignment, allowing you to veto (reject) certain assignment operations.

### Basic Usage

```kotlin
import kotlin.properties.Delegates

class Person {
    var age: Int by Delegates.vetoable(0) { _, oldValue, newValue ->
        println("Attempting to change age from $oldValue to $newValue")
        newValue >= 0 && newValue <= 150  // Return true to accept, false to reject
    }
}

fun main() {
    val person = Person()
    person.age = 25    // Success, age = 25
    println(person.age) // Output: 25

    person.age = -5    // Rejected, age remains 25
    println(person.age) // Output: 25

    person.age = 200   // Rejected, age remains 25
    println(person.age) // Output: 25
}
```

### Practical Use Cases

#### Case 1: Data Validation

```kotlin
class BankAccount {
    var balance: Double by Delegates.vetoable(0.0) { _, old, new ->
        when {
            new < 0 -> {
                println("Error: Balance cannot be negative")
                false
            }
            new - old > 100000 -> {
                println("Warning: Single change exceeds 100,000, additional approval required")
                requestApproval()
            }
            else -> true
        }
    }

    var dailyLimit: Int by Delegates.vetoable(5000) { _, _, new ->
        new in 1000..50000  // Limit must be within reasonable range
    }
}
```

#### Case 2: State Machine Constraints

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
            println("Invalid state transition: $old -> $new")
        }
        allowed
    }
}

fun main() {
    val order = Order()
    order.status = OrderStatus.PAID       // Success
    order.status = OrderStatus.DELIVERED  // Fails: must ship first
    order.status = OrderStatus.SHIPPED    // Success
    order.status = OrderStatus.DELIVERED  // Success
    order.status = OrderStatus.CREATED    // Fails: completed orders cannot go back
}
```

#### Case 3: Input Filtering

```kotlin
class UserProfile {
    var username: String by Delegates.vetoable("") { _, _, new ->
        val isValid = new.length in 3..20 &&
                      new.all { it.isLetterOrDigit() || it == '_' }
        if (!isValid) {
            println("Invalid username format: 3-20 characters, only letters, numbers, and underscores allowed")
        }
        isValid
    }

    var email: String by Delegates.vetoable("") { _, _, new ->
        val emailRegex = Regex("^[A-Za-z0-9+_.-]+@(.+)$")
        val isValid = emailRegex.matches(new)
        if (!isValid) {
            println("Invalid email format")
        }
        isValid
    }
}
```

## Storing Properties in a Map

Kotlin allows you to store property values in a Map, which is particularly useful when handling JSON data or dynamic properties.

### Read-Only Properties with Map

```kotlin
class User(val map: Map<String, Any?>) {
    val name: String by map
    val age: Int by map
    val email: String by map
}

fun main() {
    val user = User(mapOf(
        "name" to "John",
        "age" to 25,
        "email" to "john@example.com"
    ))

    println(user.name)   // Output: John
    println(user.age)    // Output: 25
    println(user.email)  // Output: john@example.com
}
```

### Mutable Properties with MutableMap

```kotlin
class MutableUser(val map: MutableMap<String, Any?>) {
    var name: String by map
    var age: Int by map
}

fun main() {
    val map = mutableMapOf<String, Any?>(
        "name" to "John",
        "age" to 25
    )
    val user = MutableUser(map)

    println(user.name)  // Output: John
    user.name = "Jane"
    println(map["name"]) // Output: Jane (the value in the Map also changed)
}
```

### Practical Use Cases

#### Case 1: JSON Data Mapping

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
    println(config.appName)  // Output: MyApp
    println(config.features) // Output: [dark_mode, notifications, sync]
}
```

#### Case 2: Flexible Entity Classes

```kotlin
open class DynamicEntity(protected val data: MutableMap<String, Any?> = mutableMapOf()) {
    fun toMap(): Map<String, Any?> = data.toMap()
}

class Product(data: MutableMap<String, Any?> = mutableMapOf()) : DynamicEntity(data) {
    var id: Long by data
    var name: String by data
    var price: Double by data
    var stock: Int by data

    // Support for additional dynamic properties
    operator fun get(key: String): Any? = data[key]
    operator fun set(key: String, value: Any?) { data[key] = value }
}

fun main() {
    val product = Product(mutableMapOf(
        "id" to 1L,
        "name" to "Laptop",
        "price" to 5999.0,
        "stock" to 100
    ))

    // Using type-safe properties
    println(product.name)   // Output: Laptop
    product.price = 5499.0

    // Using dynamic properties
    product["brand"] = "Lenovo"
    product["warranty"] = "3 years"

    println(product.toMap())
}
```

## Delegating to Another Property

Kotlin 1.4+ supports delegating one property to another property, which is very useful in scenarios like property renaming.

### Basic Syntax

```kotlin
var topLevelInt: Int = 0

class MyClass(var memberInt: Int) {
    // Delegate to a member property of the same class
    var delegatedToMember: Int by this::memberInt

    // Delegate to a top-level property
    var delegatedToTopLevel: Int by ::topLevelInt
}
```

### Backward Compatibility for Property Renaming

```kotlin
class UserSettings {
    var newPropertyName: String = "default"

    @Deprecated(
        message = "Use newPropertyName instead",
        replaceWith = ReplaceWith("newPropertyName")
    )
    var oldPropertyName: String by this::newPropertyName
}

fun main() {
    val settings = UserSettings()

    // New code uses the new property name
    settings.newPropertyName = "value"

    // Old code continues to work, but receives deprecation warnings
    println(settings.oldPropertyName)  // Output: value
}
```

### Extension Property Delegation

```kotlin
class Container {
    var value: Int = 0
}

// Extension property delegates to member property
var Container.alias: Int by Container::value

fun main() {
    val container = Container()
    container.value = 42
    println(container.alias)  // Output: 42

    container.alias = 100
    println(container.value)  // Output: 100
}
```

## Custom Delegates

Creating custom delegates allows you to encapsulate complex property logic and achieve code reuse.

### Basic Requirements for Delegates

For read-only properties (`val`), the delegate must provide a `getValue()` method:

```kotlin
operator fun getValue(thisRef: R, property: KProperty<*>): T
```

For mutable properties (`var`), a `setValue()` method is also required:

```kotlin
operator fun setValue(thisRef: R, property: KProperty<*>, value: T)
```

### Implementation Using Interfaces

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
    form.username = "  John  "
    form.email = "  john@example.com   "

    println("'${form.username}'")  // Output: 'John'
    println("'${form.email}'")     // Output: 'john@example.com'
}
```

### Practical Custom Delegate Examples

#### Example 1: Non-Null Validation Delegate

```kotlin
class NotNull<T : Any> : ReadWriteProperty<Any?, T> {
    private var value: T? = null

    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        return value ?: throw IllegalStateException(
            "Property ${property.name} has not been initialized"
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

#### Example 2: Range Restriction Delegate

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
    player.volume = 150  // Will be clamped to 100
    player.volume = -50  // Will be clamped to 0
    println(player.volume)  // Output: 0
}
```

#### Example 3: SharedPreferences Delegate (Android)

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
            else -> throw IllegalArgumentException("Unsupported type")
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
                else -> throw IllegalArgumentException("Unsupported type")
            }
            apply()
        }
    }
}

// Factory function to simplify creation
fun <T> SharedPreferences.delegate(key: String, default: T) =
    PreferenceDelegate(this, key, default)

class Settings(prefs: SharedPreferences) {
    var isDarkMode: Boolean by prefs.delegate("dark_mode", false)
    var fontSize: Int by prefs.delegate("font_size", 14)
    var username: String by prefs.delegate("username", "")
}
```

#### Example 4: Caching Delegate

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
    // Weather data cached for 5 minutes
    val currentWeather: Weather by cached(5 * 60 * 1000) {
        println("Fetching weather data...")
        fetchWeatherFromApi()
    }
}
```

#### Example 5: Formatting Delegate

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

## The provideDelegate Operator

`provideDelegate` allows you to perform additional logic when the delegate is bound, such as validating property names.

```kotlin
class ResourceLoader<T>(private val resourceId: String) {
    operator fun provideDelegate(
        thisRef: Any?,
        prop: KProperty<*>
    ): ReadOnlyProperty<Any?, T> {
        // Validation at binding time
        require(prop.name.startsWith("resource")) {
            "Properties using ResourceLoader must start with 'resource'"
        }
        println("Loading resource '$resourceId' for property '${prop.name}'")
        return ResourceDelegate(loadResource(resourceId))
    }

    private fun loadResource(id: String): T {
        // Simulate loading a resource
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
    // val invalidName: String by ResourceLoader("test")  // Would throw an exception
}
```

## Local Delegated Properties

Delegated properties can be used for both class members and local variables:

```kotlin
fun computeValue(): String {
    println("Computing value...")
    return "Computed result"
}

fun example(condition: Boolean) {
    // Only computed when condition is true
    val memoizedValue by lazy { computeValue() }

    if (condition) {
        println(memoizedValue)  // Triggers computation at this point
        println(memoizedValue)  // Uses cached value
    }
    // If condition is false, computeValue() is never called
}
```

## Compiler Optimizations

The Kotlin compiler applies some optimizations to delegated properties. The compiler omits the `$delegate` auxiliary field in the following cases:

1. **Property references**: `by ::property`
2. **Named objects**: `by NamedObject`
3. **Final val properties with default getters**
4. **Constant expressions, enum entries, this, null**

```kotlin
object StringDelegate {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): String = "value"
}

class Optimized {
    // The compiler optimizes this case by not generating an extra delegate field
    val s: String by StringDelegate
}
```

## Best Practices

### Choose the Appropriate Delegate Type

| Scenario | Recommended Delegate |
|----------|---------------------|
| Lazy initialization | `lazy` |
| Monitor property changes | `Delegates.observable` |
| Validate/intercept assignments | `Delegates.vetoable` |
| Dynamic/JSON data | Map delegation |
| Custom complex logic | Custom delegate |

### Pay Attention to Thread Safety

```kotlin
// Use the default SYNCHRONIZED mode in multi-threaded environments
val threadSafe: String by lazy { "safe" }

// Use NONE in single-threaded environments for better performance
val singleThread: String by lazy(LazyThreadSafetyMode.NONE) { "fast" }
```

### Avoid Heavy Operations in Delegates

```kotlin
// Bad practice - observable executes on every assignment
var value: Int by Delegates.observable(0) { _, _, new ->
    database.save(new)  // Saves to database on every assignment, poor performance
}

// Better approach - use debouncing or batch processing
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

### Leverage Generic Delegates

```kotlin
// Generic logging delegate
class LoggingDelegate<T>(
    private var value: T,
    private val name: String
) : ReadWriteProperty<Any?, T> {
    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        println("Reading $name: $value")
        return value
    }

    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        println("Setting $name: ${this.value} -> $value")
        this.value = value
    }
}

fun <T> logged(initialValue: T, name: String) = LoggingDelegate(initialValue, name)

class Debug {
    var counter: Int by logged(0, "counter")
    var message: String by logged("", "message")
}
```

## Summary

Kotlin's delegated properties are a powerful and flexible feature that allows you to:

- Use `lazy` for lazy initialization to improve performance
- Use `observable` to monitor property changes for reactive programming
- Use `vetoable` to validate and intercept assignment operations
- Use Map delegation to handle dynamic data
- Create custom delegates to encapsulate complex property logic
- Use `provideDelegate` to execute additional logic when delegates are bound

By properly using delegated properties, you can write more concise, maintainable, and powerful Kotlin code. Remember, the core idea of delegation is "separation of concerns" - separating property storage and access logic from business code to achieve better code organization and reuse.
