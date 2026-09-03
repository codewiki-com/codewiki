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
origin: old/src/content/docs/kotlin/lambdas.zh.md
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

Lambda 表达式是 Kotlin 函数式编程的核心构建块。它是一种简洁的方式来表示可以作为值传递的函数。理解 Lambda 表达式对于写出优雅、简洁的 Kotlin 代码至关重要，无论是使用集合操作、作用域函数，还是构建 DSL，Lambda 都无处不在。

## 概念解释

### 什么是 Lambda 表达式

Lambda 表达式（也称为匿名函数）是一种没有名称的函数，可以作为表达式直接传递。它本质上是"代码块即数据"的实现，让函数成为一等公民。

```kotlin
// 普通函数
fun double(x: Int): Int {
    return x * 2
}

// 等价的 Lambda 表达式
val double: (Int) -> Int = { x: Int -> x * 2 }

// 简化写法
val double = { x: Int -> x * 2 }
```

### Lambda 的历史背景

Lambda 表达式起源于 1930 年代 Alonzo Church 提出的 Lambda 演算（Lambda Calculus），这是一套用于研究函数定义、函数应用和递归的形式系统。现代编程语言中的 Lambda 表达式是这一数学概念的实际应用。

Kotlin 从设计之初就将 Lambda 作为语言的核心特性，借鉴了 Java 8、Scala 等语言的经验，同时引入了独特的语法糖，如尾随 Lambda 和 `it` 关键字，使得 Lambda 的使用更加自然流畅。

### Lambda 解决的问题

1. **减少样板代码**：替代匿名内部类，减少冗余代码
2. **支持函数式编程**：让函数可以作为值传递和返回
3. **提高代码表达力**：用声明式的方式表达"做什么"而非"怎么做"
4. **延迟执行**：将计算逻辑封装起来，在需要时才执行

```kotlin
// Java 风格（匿名内部类）
button.setOnClickListener(object : View.OnClickListener {
    override fun onClick(v: View) {
        println("Button clicked")
    }
})

// Kotlin Lambda
button.setOnClickListener { println("Button clicked") }
```

## 核心原理

### Lambda 的内部结构

在 Kotlin 中，每个 Lambda 表达式在编译时都会被转换为一个 `Function` 接口的实现。Kotlin 标准库定义了一系列 `FunctionN` 接口：

```kotlin
// Kotlin 标准库中的函数接口
interface Function0<out R> : Function<R> {
    operator fun invoke(): R
}

interface Function1<in P1, out R> : Function<R> {
    operator fun invoke(p1: P1): R
}

interface Function2<in P1, in P2, out R> : Function<R> {
    operator fun invoke(p1: P1, p2: P2): R
}
// ... 最多支持 Function22
```

当你写一个 Lambda 时，编译器会生成一个实现相应 `FunctionN` 接口的匿名类：

```kotlin
// 源代码
val sum = { a: Int, b: Int -> a + b }

// 编译后（概念上）
val sum = object : Function2<Int, Int, Int> {
    override fun invoke(a: Int, b: Int): Int = a + b
}
```

### 闭包机制

Lambda 表达式可以捕获其定义作用域中的变量，这就是闭包（Closure）。与 Java 不同，Kotlin 的 Lambda 可以捕获并修改外部变量：

```kotlin
fun createCounter(): () -> Int {
    var count = 0
    return {
        count++  // 捕获并修改外部变量
        count
    }
}

val counter = createCounter()
println(counter()) // 1
println(counter()) // 2
println(counter()) // 3
```

闭包的实现原理是将捕获的变量包装在一个持有者对象中：

```kotlin
// 源代码
fun example() {
    var x = 10
    val lambda = { println(x) }
    x = 20
    lambda() // 输出 20
}

// 编译后（概念上）
fun example() {
    val x = Ref<Int>()
    x.element = 10
    val lambda = { println(x.element) }
    x.element = 20
    lambda()
}
```

### 函数类型的本质

Kotlin 中的函数类型是一种特殊类型，用于描述函数的签名：

```kotlin
// 函数类型语法
(参数类型列表) -> 返回类型

// 示例
val action: () -> Unit                    // 无参数，无返回值
val predicate: (Int) -> Boolean           // 一个 Int 参数，返回 Boolean
val transformer: (String, Int) -> String  // 两个参数，返回 String
val factory: () -> List<String>           // 无参数，返回 List<String>

// 带接收者的函数类型
val builderAction: StringBuilder.() -> Unit
```

## 核心要点

### Lambda 基本语法

Lambda 表达式的完整语法形式：

```kotlin
val lambda: (参数类型) -> 返回类型 = { 参数名: 参数类型 ->
    // 函数体
    返回值表达式
}
```

语法要点：
1. Lambda 始终用花括号 `{}` 包围
2. 参数列表在 `->` 之前
3. 函数体在 `->` 之后
4. 最后一个表达式的值作为返回值

```kotlin
// 完整形式
val sum: (Int, Int) -> Int = { a: Int, b: Int -> a + b }

// 类型推断，省略 Lambda 中的参数类型
val sum: (Int, Int) -> Int = { a, b -> a + b }

// 类型推断，省略变量的类型注解
val sum = { a: Int, b: Int -> a + b }

// 多行 Lambda
val process = { x: Int ->
    val doubled = x * 2
    val squared = doubled * doubled
    squared  // 返回值
}
```

### it 关键字

当 Lambda 只有一个参数时，可以省略参数声明和 `->`，使用隐式参数名 `it`：

```kotlin
// 显式参数
val square: (Int) -> Int = { x -> x * x }

// 使用 it
val square: (Int) -> Int = { it * it }

// 实际应用
val numbers = listOf(1, 2, 3, 4, 5)
numbers.filter { it > 2 }           // 过滤大于 2 的元素
numbers.map { it * 2 }              // 每个元素乘以 2
numbers.forEach { println(it) }     // 打印每个元素
```

`it` 的使用场景和限制：

```kotlin
// 适合使用 it 的情况
list.filter { it.isNotEmpty() }
list.map { it.uppercase() }

// 应该使用命名参数的情况
// 1. Lambda 嵌套时
list.flatMap { outer ->
    other.map { inner ->
        outer + inner  // 使用命名参数避免混淆
    }
}

// 2. 参数含义不明显时
users.sortedBy { user -> user.age }  // 比 it.age 更清晰

// 3. Lambda 体较长时
data.process { item ->
    val validated = validate(item)
    val transformed = transform(validated)
    store(transformed)
    transformed
}
```

### 尾随 Lambda（Trailing Lambda）

当函数的最后一个参数是 Lambda 时，可以将 Lambda 放在括号外面：

```kotlin
// 标准写法
list.fold(0, { acc, i -> acc + i })

// 尾随 Lambda
list.fold(0) { acc, i -> acc + i }

// 当 Lambda 是唯一参数时，可以省略括号
list.forEach { println(it) }

// 等价于
list.forEach({ println(it) })
```

这种语法让代码看起来更像内置语言结构：

```kotlin
// 看起来像控制结构
repeat(3) {
    println("Hello!")
}

// DSL 风格
html {
    head {
        title("My Page")
    }
    body {
        p("Hello, World!")
    }
}
```

### 函数类型详解

函数类型的完整形式和变体：

```kotlin
// 1. 基本函数类型
val f1: (Int) -> Int = { it * 2 }

// 2. 多参数函数类型
val f2: (Int, String) -> Boolean = { num, str -> str.length > num }

// 3. 无参数函数类型
val f3: () -> String = { "Hello" }

// 4. 返回 Unit 的函数类型
val f4: (String) -> Unit = { println(it) }

// 5. 可空函数类型
val f5: ((Int) -> Int)? = null

// 6. 返回可空值的函数类型
val f6: (Int) -> Int? = { if (it > 0) it else null }

// 7. 可空参数的函数类型
val f7: (Int?) -> Int = { it ?: 0 }

// 8. 带接收者的函数类型
val f8: Int.() -> Int = { this * 2 }

// 9. 挂起函数类型（协程）
val f9: suspend () -> String = { delay(1000); "Done" }
```

### 带接收者的 Lambda

带接收者的 Lambda 让你可以在 Lambda 内部直接访问接收者对象的成员：

```kotlin
// 带接收者的函数类型
val greet: String.() -> String = { "Hello, $this!" }

// 调用方式
val result = "World".greet()  // "Hello, World!"
// 或
val result = greet("World")   // "Hello, World!"
```

这是 Kotlin DSL 的基础：

```kotlin
// HTML DSL 示例
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

// 使用 DSL
val page = html {
    body {
        p("Hello, World!")
    }
}
```

### 匿名函数

除了 Lambda 表达式，Kotlin 还支持匿名函数，它提供了显式指定返回类型和使用 `return` 的能力：

```kotlin
// Lambda 表达式
val lambda = { x: Int -> x * 2 }

// 匿名函数
val anonymous = fun(x: Int): Int { return x * 2 }

// 匿名函数的简写形式
val anonymous = fun(x: Int) = x * 2
```

Lambda 与匿名函数的区别：

```kotlin
// 1. 返回行为不同
listOf(1, 2, 3).forEach {
    if (it == 2) return  // 从外层函数返回！
    println(it)
}

listOf(1, 2, 3).forEach(fun(value) {
    if (value == 2) return  // 只从匿名函数返回
    println(value)
})

// 2. 匿名函数可以显式指定返回类型
val parser = fun(s: String): Int? {
    return s.toIntOrNull()
}
```

## 代码示例

### 基础 Lambda 操作

```kotlin
// 1. 定义和调用 Lambda
val greet = { name: String -> "Hello, $name!" }
println(greet("Kotlin"))  // Hello, Kotlin!

// 2. 高阶函数：函数作为参数
fun operateOnNumbers(a: Int, b: Int, operation: (Int, Int) -> Int): Int {
    return operation(a, b)
}

val sum = operateOnNumbers(5, 3) { x, y -> x + y }      // 8
val product = operateOnNumbers(5, 3) { x, y -> x * y }  // 15
val max = operateOnNumbers(5, 3) { x, y -> maxOf(x, y) } // 5

// 3. 高阶函数：函数作为返回值
fun createMultiplier(factor: Int): (Int) -> Int {
    return { number -> number * factor }
}

val triple = createMultiplier(3)
println(triple(7))  // 21
```

### 集合操作中的 Lambda

```kotlin
data class Person(val name: String, val age: Int, val city: String)

val people = listOf(
    Person("张三", 28, "北京"),
    Person("李四", 35, "上海"),
    Person("王五", 22, "广州"),
    Person("赵六", 28, "北京"),
    Person("钱七", 40, "深圳")
)

// filter: 筛选
val adults = people.filter { it.age >= 30 }
val beijingPeople = people.filter { it.city == "北京" }

// map: 转换
val names = people.map { it.name }
val ageStrings = people.map { "${it.name}: ${it.age}岁" }

// flatMap: 扁平化映射
val cities = listOf(
    listOf("北京", "上海"),
    listOf("广州", "深圳")
)
val allCities = cities.flatMap { it }  // [北京, 上海, 广州, 深圳]

// groupBy: 分组
val byCity = people.groupBy { it.city }
val byAge = people.groupBy { it.age }

// sortedBy: 排序
val sortedByAge = people.sortedBy { it.age }
val sortedByNameDesc = people.sortedByDescending { it.name }

// reduce: 归约
val totalAge = people.map { it.age }.reduce { acc, age -> acc + age }

// fold: 带初始值的归约
val ageSum = people.fold(0) { acc, person -> acc + person.age }

// partition: 分区
val (young, old) = people.partition { it.age < 30 }

// any, all, none: 判断
val hasAdult = people.any { it.age >= 18 }
val allAdults = people.all { it.age >= 18 }
val noChildren = people.none { it.age < 10 }

// find, first, last
val firstBeijing = people.find { it.city == "北京" }
val lastPerson = people.last { it.age > 25 }

// associate: 转换为 Map
val nameToAge = people.associate { it.name to it.age }
val nameToCity = people.associateWith { it.city }

// 链式操作
val result = people
    .filter { it.age >= 25 }
    .sortedBy { it.age }
    .take(3)
    .map { "${it.name} (${it.age})" }
    .joinToString(", ")

println(result)  // 张三 (28), 赵六 (28), 李四 (35)
```

### 自定义高阶函数

```kotlin
// 重试机制
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
            println("尝试 ${attempt + 1} 失败: ${e.message}")
        }
        Thread.sleep(currentDelay)
        currentDelay = (currentDelay * factor).toLong().coerceAtMost(maxDelay)
    }
    return block() // 最后一次尝试
}

// 使用
val result = retry(times = 3) {
    fetchDataFromNetwork()
}

// 计时函数
inline fun <T> measureTimeAndReturn(block: () -> T): Pair<T, Long> {
    val start = System.currentTimeMillis()
    val result = block()
    val end = System.currentTimeMillis()
    return result to (end - start)
}

val (data, time) = measureTimeAndReturn {
    loadLargeFile()
}
println("加载完成，耗时 ${time}ms")

// 资源管理
inline fun <T : AutoCloseable, R> T.useAndTransform(block: (T) -> R): R {
    return try {
        block(this)
    } finally {
        close()
    }
}

// 条件执行
inline fun <T> T.applyIf(condition: Boolean, block: T.() -> Unit): T {
    if (condition) block()
    return this
}

val config = Config()
    .applyIf(isDebug) { enableLogging() }
    .applyIf(isProduction) { enableMinification() }
```

### Lambda 与 SAM 转换

Kotlin 可以将 Lambda 自动转换为 Java 的单抽象方法（SAM）接口：

```kotlin
// Java 接口
// public interface Runnable {
//     void run();
// }

// Kotlin 中使用
val runnable = Runnable { println("Running!") }

// 传递给 Java 方法
Thread { println("Thread running") }.start()

// Comparator 接口
val comparator = Comparator<String> { a, b -> a.length - b.length }
val sorted = listOf("apple", "pie", "banana").sortedWith(comparator)

// 完整的 SAM 转换示例
button.setOnClickListener { view ->
    handleClick(view)
}

executor.submit {
    processData()
}
```

### 函数引用

Kotlin 允许使用 `::` 操作符引用现有函数：

```kotlin
// 1. 顶层函数引用
fun isEven(n: Int) = n % 2 == 0
val numbers = listOf(1, 2, 3, 4, 5)
val evens = numbers.filter(::isEven)

// 2. 成员函数引用
class StringProcessor {
    fun process(s: String) = s.uppercase()
}

val processor = StringProcessor()
val strings = listOf("hello", "world")
val processed = strings.map(processor::process)

// 3. 扩展函数引用
fun String.addPrefix(prefix: String) = "$prefix$this"
val addHello: (String) -> String = String::addPrefix.let {
    { s: String -> s.addPrefix("Hello, ") }
}

// 4. 构造函数引用
data class User(val name: String, val age: Int)
val createUser: (String, Int) -> User = ::User
val users = names.zip(ages).map { (name, age) -> createUser(name, age) }

// 5. 属性引用
data class Person(val name: String, val age: Int)
val people = listOf(Person("Alice", 30), Person("Bob", 25))
val names = people.map(Person::name)
val ages = people.sortedBy(Person::age)

// 6. 绑定引用
val str = "Hello"
val getLength: () -> Int = str::length
println(getLength())  // 5
```

## 最佳实践

### 保持 Lambda 简洁

```kotlin
// 不推荐：过长的 Lambda
users.filter { user ->
    val isActive = user.status == "active"
    val isVerified = user.verified
    val hasPermission = user.permissions.contains("read")
    val isNotExpired = user.expiryDate > Date()
    isActive && isVerified && hasPermission && isNotExpired
}

// 推荐：提取为函数
fun User.isEligible(): Boolean {
    return status == "active" &&
           verified &&
           permissions.contains("read") &&
           expiryDate > Date()
}

users.filter { it.isEligible() }
// 或使用函数引用
users.filter(User::isEligible)
```

### 合理使用 it

```kotlin
// 推荐：简单操作使用 it
list.filter { it > 0 }.map { it * 2 }

// 推荐：复杂或嵌套时使用命名参数
list.flatMap { outer ->
    otherList.map { inner ->
        combine(outer, inner)
    }
}

// 推荐：Lambda 体较长时使用命名参数
items.forEach { item ->
    validate(item)
    process(item)
    save(item)
    log(item)
}
```

### 优先使用函数引用

```kotlin
// 不推荐
list.map { it.toString() }
list.filter { isValid(it) }

// 推荐
list.map(Any::toString)
list.filter(::isValid)

// 但当需要额外逻辑时使用 Lambda
list.map { it.toString().uppercase() }
```

### 使用尾随 Lambda 增强可读性

```kotlin
// 推荐：尾随 Lambda
list.fold(0) { acc, item -> acc + item }

repeat(3) {
    println("Hello")
}

with(config) {
    timeout = 30
    retryCount = 3
}

// 不推荐：不使用尾随 Lambda（可读性差）
list.fold(0, { acc, item -> acc + item })
```

### 考虑使用序列处理大集合

```kotlin
// 对于大集合，使用序列避免中间集合
val result = largeList.asSequence()
    .filter { it.isValid() }
    .map { it.transform() }
    .take(10)
    .toList()
```

## 常见陷阱

### Lambda 中的 return

```kotlin
fun processItems(items: List<Int>) {
    items.forEach {
        if (it == 0) return  // 从 processItems 返回！不是从 Lambda 返回
        println(it)
    }
    println("处理完成")  // it == 0 时不会执行
}

// 解决方案 1: 使用标签返回
fun processItems(items: List<Int>) {
    items.forEach label@{
        if (it == 0) return@label  // 只从 Lambda 返回
        println(it)
    }
    println("处理完成")  // 会执行
}

// 解决方案 2: 使用隐式标签
fun processItems(items: List<Int>) {
    items.forEach {
        if (it == 0) return@forEach  // 使用函数名作为标签
        println(it)
    }
    println("处理完成")
}

// 解决方案 3: 使用匿名函数
fun processItems(items: List<Int>) {
    items.forEach(fun(item) {
        if (item == 0) return  // 从匿名函数返回
        println(item)
    })
    println("处理完成")
}
```

### 闭包捕获的变量问题

```kotlin
// 问题：所有 Lambda 捕获同一个变量
fun createFunctions(): List<() -> Int> {
    val functions = mutableListOf<() -> Int>()
    for (i in 0..2) {
        functions.add { i }  // 所有 Lambda 都返回 3！
    }
    return functions
}

// Kotlin 中实际上不存在这个问题，因为 for 循环每次迭代创建新变量
// 但使用 while 或手动管理变量时需要注意

// 潜在问题场景
var counter = 0
val functions = mutableListOf<() -> Int>()
while (counter < 3) {
    functions.add { counter }  // 所有都捕获同一个 counter
    counter++
}

// 解决方案：创建局部副本
while (counter < 3) {
    val current = counter
    functions.add { current }
    counter++
}
```

### 内联函数与 non-local return

```kotlin
// inline 函数允许 non-local return
inline fun performOperation(action: () -> Unit) {
    println("开始")
    action()
    println("结束")  // 如果 action 中有 return，这行不会执行
}

fun main() {
    performOperation {
        println("执行操作")
        return  // 从 main 返回！
    }
    println("main 结束")  // 不会执行
}

// 使用 crossinline 禁止 non-local return
inline fun safeOperation(crossinline action: () -> Unit) {
    println("开始")
    action()  // action 中不能使用 non-local return
    println("结束")
}
```

### Lambda 参数遮蔽

```kotlin
val it = "外部变量"

listOf(1, 2, 3).forEach {
    // 这里的 it 是 Lambda 参数，遮蔽了外部的 it
    println(it)  // 1, 2, 3
}

// 更清晰的写法
listOf(1, 2, 3).forEach { number ->
    println(number)
    println(it)  // 现在可以访问外部的 it
}
```

### 忘记返回值

```kotlin
// 问题：map 需要返回值
val result = list.map {
    println(it)  // 返回 Unit，不是想要的结果
}

// 正确写法
val result = list.map {
    println(it)
    it * 2  // 明确返回值
}

// 或者使用 also 进行副作用操作
val result = list.map { it * 2 }.also {
    it.forEach { println(it) }
}
```

## 性能考量

### 内联函数（Inline Functions）

Lambda 表达式在编译时会生成匿名类，每次调用都可能创建新对象。内联函数通过在调用处展开函数体来消除这种开销：

```kotlin
// 非内联函数
fun nonInlined(block: () -> Unit) {
    block()
}

// 内联函数
inline fun inlined(block: () -> Unit) {
    block()
}

fun main() {
    // 非内联：每次调用创建一个 Function0 对象
    nonInlined { println("Hello") }

    // 内联：Lambda 代码直接插入到调用处
    inlined { println("Hello") }

    // 内联后等价于
    println("Hello")
}
```

### 何时使用内联

```kotlin
// 适合内联的情况
// 1. 接受 Lambda 参数的小函数
inline fun <T> measureTime(block: () -> T): T {
    val start = System.currentTimeMillis()
    val result = block()
    println("耗时: ${System.currentTimeMillis() - start}ms")
    return result
}

// 2. 需要具体化类型参数的函数
inline fun <reified T> isInstance(value: Any): Boolean {
    return value is T
}

// 不适合内联的情况
// 1. 大型函数（会增加字节码大小）
// 2. 函数被多处调用
// 3. Lambda 被存储或传递给其他非内联函数
```

### noinline 和 crossinline

```kotlin
// noinline: 阻止特定 Lambda 参数被内联
inline fun execute(
    inlinedAction: () -> Unit,
    noinline storedAction: () -> Unit  // 这个不会被内联
) {
    inlinedAction()
    saveForLater(storedAction)  // 可以传递给其他函数
}

// crossinline: 允许内联但禁止 non-local return
inline fun runInThread(crossinline action: () -> Unit) {
    Thread {
        action()  // action 中不能使用 return
    }.start()
}
```

### 序列 vs 集合

```kotlin
// 集合操作：每个操作创建中间集合
val result1 = (1..1000000)
    .filter { it % 2 == 0 }    // 创建新 List
    .map { it * 2 }            // 创建新 List
    .take(10)                  // 创建新 List
    .toList()

// 序列操作：惰性求值，无中间集合
val result2 = (1..1000000)
    .asSequence()
    .filter { it % 2 == 0 }    // 返回 Sequence
    .map { it * 2 }            // 返回 Sequence
    .take(10)                  // 返回 Sequence
    .toList()                  // 最终创建 List
```

### 内存影响

```kotlin
// 问题：Lambda 捕获大对象
fun createProcessor(): () -> Unit {
    val largeData = ByteArray(10_000_000)
    return {
        // 即使只用了 size，整个 largeData 都被捕获
        println(largeData.size)
    }
}

// 优化：只捕获需要的值
fun createProcessor(): () -> Unit {
    val largeData = ByteArray(10_000_000)
    val size = largeData.size
    return {
        println(size)  // 只捕获 size
    }
}
```

## 实战场景

### 场景一：事件处理系统

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

// 使用
val bus = EventBus()

bus.on<String>("message") { msg ->
    println("收到消息: $msg")
}

bus.on<Int>("count") { count ->
    println("计数: $count")
}

bus.emit("message", "Hello!")
bus.emit("count", 42)
```

### 场景二：数据验证框架

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

// 使用
val userValidator = Validator<User>()
    .rule("用户名不能为空") { it.username.isNotBlank() }
    .rule("用户名长度必须在 3-20 之间") { it.username.length in 3..20 }
    .rule("邮箱格式不正确") { it.email.contains("@") }
    .rule("年龄必须在 0-150 之间") { it.age in 0..150 }

val user = User("ab", "invalid", 200)
val result = userValidator.validate(user)
if (!result.isValid) {
    result.errors.forEach { println("验证失败: $it") }
}
```

### 场景三：流式 API 构建器

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

// 使用
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

### 场景四：配置 DSL

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

// 使用
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

### 场景五：异步任务编排

```kotlin
class TaskChain<T>(private val initial: T) {
    private val tasks = mutableListOf<suspend (Any?) -> Any?>()

    @Suppress("UNCHECKED_CAST")
    fun <R> then(task: suspend (T) -> R): TaskChain<R> {
        tasks.add(task as suspend (Any?) -> Any?)
        return this as TaskChain<R>
    }

    fun catch(handler: (Throwable) -> Unit): TaskChain<T> {
        // 错误处理逻辑
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

// 使用
suspend fun main() {
    val result = startWith(1)
        .then { it + 1 }
        .then { it * 2 }
        .then { "Result: $it" }
        .execute()

    println(result)  // Result: 4
}
```

## 面试要点

### 常见面试问题

**Q1: Kotlin 中 Lambda 表达式和匿名函数有什么区别？**

```kotlin
// Lambda 表达式
val lambda = { x: Int -> x * 2 }

// 匿名函数
val anonymous = fun(x: Int): Int { return x * 2 }
```

主要区别：
1. **return 行为**：Lambda 中的 `return` 从外层函数返回（non-local return），匿名函数的 `return` 只从自身返回
2. **类型推断**：匿名函数可以显式指定返回类型，Lambda 依赖推断
3. **语法**：匿名函数有 `fun` 关键字，Lambda 更简洁

**Q2: 什么是内联函数？为什么要使用它？**

```kotlin
inline fun performAction(action: () -> Unit) {
    action()
}
```

内联函数在编译时将函数体直接插入到调用处。优点：
1. 消除 Lambda 对象创建的开销
2. 支持 non-local return
3. 支持具体化类型参数（`reified`）

**Q3: 解释尾随 Lambda 语法**

当函数的最后一个参数是 Lambda 时，可以将 Lambda 放在括号外面：

```kotlin
// 常规语法
list.fold(0, { acc, item -> acc + item })

// 尾随 Lambda
list.fold(0) { acc, item -> acc + item }

// 如果 Lambda 是唯一参数，可以省略括号
list.forEach { println(it) }
```

**Q4: 什么是带接收者的 Lambda？它有什么用途？**

```kotlin
// 带接收者的 Lambda
val greet: String.() -> String = { "Hello, $this!" }
"World".greet()  // "Hello, World!"
```

用途：
1. 构建 DSL（如 HTML 构建器、配置构建器）
2. 作用域函数（apply、run、with）的实现基础
3. 允许在 Lambda 内部直接访问接收者成员

**Q5: 什么是 SAM 转换？**

SAM（Single Abstract Method）转换允许将 Lambda 自动转换为只有一个抽象方法的 Java 接口实例：

```kotlin
// Java Runnable 接口
val runnable: Runnable = Runnable { println("Running") }

// 等价于
val runnable: Runnable = object : Runnable {
    override fun run() {
        println("Running")
    }
}
```

**Q6: crossinline 和 noinline 有什么作用？**

```kotlin
inline fun example(
    noinline stored: () -> Unit,      // 不内联，可以存储
    crossinline noReturn: () -> Unit   // 内联但禁止 non-local return
) {
    saveForLater(stored)  // noinline 允许传递给其他函数
    Thread { noReturn() }.start()  // crossinline 允许在非直接调用处使用
}
```

**Q7: 如何在 Lambda 中实现"只从 Lambda 返回"？**

```kotlin
// 方法1：标签返回
list.forEach {
    if (condition) return@forEach  // 只从 Lambda 返回
    process(it)
}

// 方法2：匿名函数
list.forEach(fun(item) {
    if (condition) return  // 只从匿名函数返回
    process(item)
})
```

### 编程练习

**练习1：实现 memoize 函数**

```kotlin
fun <T, R> ((T) -> R).memoize(): (T) -> R {
    val cache = mutableMapOf<T, R>()
    return { input ->
        cache.getOrPut(input) { this(input) }
    }
}

// 使用
val expensiveOperation = { n: Int ->
    Thread.sleep(1000)
    n * n
}.memoize()

println(expensiveOperation(5))  // 慢
println(expensiveOperation(5))  // 快（从缓存）
```

**练习2：实现 compose 函数**

```kotlin
infix fun <A, B, C> ((B) -> C).compose(other: (A) -> B): (A) -> C {
    return { a -> this(other(a)) }
}

// 使用
val addOne: (Int) -> Int = { it + 1 }
val double: (Int) -> Int = { it * 2 }
val addOneThenDouble = double compose addOne
println(addOneThenDouble(3))  // 8
```

## 延伸阅读

### 官方文档

- [Kotlin 官方文档 - Lambdas](https://kotlinlang.org/docs/lambdas.html)
- [Kotlin 官方文档 - 内联函数](https://kotlinlang.org/docs/inline-functions.html)
- [Kotlin 官方文档 - 高阶函数](https://kotlinlang.org/docs/higher-order-functions.html)

### 相关主题

- **作用域函数**：let、run、with、apply、also 都是基于 Lambda 的实用工具
- **协程**：挂起 Lambda (`suspend () -> T`) 是协程的基础
- **DSL 构建**：带接收者的 Lambda 是 Kotlin DSL 的核心技术
- **集合操作**：filter、map、reduce 等都接受 Lambda 参数

### 推荐书籍

- 《Kotlin 实战》第 5 章：Lambda 编程
- 《Kotlin 核心编程》函数式编程章节
- 《Effective Kotlin》条目 46-50

### 进阶学习

- 函数式编程概念：纯函数、不可变性、高阶函数
- Lambda 演算理论基础
- JVM 字节码分析：理解 Lambda 编译后的实现
- Kotlin 编译器插件开发

## 总结

Lambda 表达式是 Kotlin 函数式编程的基石，掌握它对于写出优雅、简洁的 Kotlin 代码至关重要。

**核心要点回顾：**

1. **语法**：Lambda 用 `{}` 包围，参数在 `->` 前，最后一个表达式作为返回值
2. **it 关键字**：单参数 Lambda 可使用隐式参数名 `it`
3. **尾随 Lambda**：最后一个 Lambda 参数可放在括号外
4. **函数类型**：`(参数类型) -> 返回类型` 描述函数签名
5. **内联函数**：使用 `inline` 消除 Lambda 对象创建开销
6. **带接收者的 Lambda**：DSL 构建的基础

**实践建议：**

- 保持 Lambda 简洁，复杂逻辑提取为命名函数
- 根据场景选择 `it` 或命名参数
- 使用函数引用替代简单 Lambda
- 大集合处理考虑使用序列
- 注意 Lambda 中 `return` 的行为
- 合理使用内联函数优化性能

Lambda 表达式让 Kotlin 代码更加声明式和表达力更强，是构建现代 Kotlin 应用不可或缺的工具。
