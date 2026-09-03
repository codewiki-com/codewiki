---
title: Kotlin Flow 响应式流
description: 学习 Kotlin Flow 响应式编程，包括构建器、操作符、上下文和异常处理
track: kotlin
section: coroutines
difficulty: advanced
tags:
  - Kotlin
  - Flow
  - reactive
  - coroutines
status: imported
origin: old/src/content/docs/kotlin/flow.zh.md
divergence: 0.314
issues: []
legacy:
  category: Kotlin
  subcategory: Async Programming
  order: 14
  lastUpdated: 2026-01-07
---

Kotlin Flow 是一个建立在协程之上的强大响应式流 API。它提供了一种声明式的方式来处理具有背压支持的异步数据流，非常适合处理随时间变化的值序列。本综合指南涵盖了从基本概念到高级模式的所有内容，用于构建响应式应用程序。

## 理解 Flow

### 什么是 Flow？

Flow 是一个冷异步数据流，按顺序发射值并正常完成或带有异常。与同步的序列不同，Flow 与协程无缝集成，并提供用于转换、组合和处理数据流的操作符。

```kotlin
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

fun simpleFlow(): Flow<Int> = flow {
    for (i in 1..3) {
        delay(100) // 模拟异步工作
        emit(i)    // 发射下一个值
    }
}

fun main() = runBlocking {
    simpleFlow().collect { value ->
        println("Received: $value")
    }
}
// 输出：
// Received: 1
// Received: 2
// Received: 3
```

### 冷流 vs 热流

**冷流**（常规 Flow）只有在收集时才开始产生值。每个收集器都获得自己独立的流：

```kotlin
fun coldFlow(): Flow<Int> = flow {
    println("Flow started")
    emit(1)
    emit(2)
    emit(3)
}

fun main() = runBlocking {
    val flow = coldFlow()

    println("Collecting first time:")
    flow.collect { println(it) }

    println("\nCollecting second time:")
    flow.collect { println(it) }
}
// 输出：
// Collecting first time:
// Flow started
// 1
// 2
// 3
//
// Collecting second time:
// Flow started
// 1
// 2
// 3
```

**热流**（StateFlow、SharedFlow）无论收集器如何都会发射值，并在多个收集器之间共享发射。

### Flow vs Sequences vs Channels

| 特性 | Sequence | Flow | Channel |
|---------|----------|------|---------|
| 执行 | 同步 | 异步 | 异步 |
| 发射 | 拉取式 | 推送式（冷） | 推送式（热） |
| 背压 | 自然 | 支持 | 可配置 |
| 取消 | 通过迭代器 | 协作式 | 协作式 |
| 多个收集器 | 独立 | 独立 | 共享 |

### 设置和依赖

在 `build.gradle.kts` 中添加 Flow：

```kotlin
dependencies {
    // 核心协程库（包含 Flow）
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.0")

    // Android 特定（包含生命周期感知收集）
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")

    // 测试
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
    testImplementation("app.cash.turbine:turbine:1.0.0")
}
```

## Flow 构建器

### flow 构建器

创建 Flow 最常见的方式是使用 `flow` 构建器：

```kotlin
fun numbersFlow(): Flow<Int> = flow {
    println("Flow execution started")
    for (i in 1..5) {
        delay(100)
        emit(i) // 向流发射值
    }
    println("Flow execution completed")
}

fun main() = runBlocking {
    val flow = numbersFlow()
    println("Flow created, not yet started")

    flow.collect { value ->
        println("Collected: $value")
    }
}
```

`flow` 构建器创建一个冷流。构建器内的代码只在调用 `collect` 时才执行。

### flowOf

从固定值集创建流：

```kotlin
fun main() = runBlocking {
    val flow = flowOf(1, 2, 3, 4, 5)

    flow.collect { println(it) }
}
```

### asFlow 扩展

将集合、序列或范围转换为流：

```kotlin
fun main() = runBlocking {
    // 从列表
    listOf("A", "B", "C").asFlow()
        .collect { println(it) }

    // 从范围
    (1..10).asFlow()
        .collect { println(it) }

    // 从序列
    generateSequence(1) { it * 2 }
        .take(5)
        .asFlow()
        .collect { println(it) } // 1, 2, 4, 8, 16

    // 从数组
    arrayOf("x", "y", "z").asFlow()
        .collect { println(it) }
}
```

### emptyFlow

创建一个立即完成的空流：

```kotlin
fun main() = runBlocking {
    emptyFlow<Int>()
        .onCompletion { println("Completed") }
        .collect { println("Never printed") }
    // 输出：Completed
}
```

### channelFlow

使用通道创建具有并发发射的流：

```kotlin
fun concurrentFlow(): Flow<Int> = channelFlow {
    launch {
        delay(100)
        send(1)
    }
    launch {
        delay(50)
        send(2)
    }
    send(3) // 立即
}

fun main() = runBlocking {
    concurrentFlow().collect { println(it) }
    // 输出顺序：3, 2, 1（基于时序）
}
```

### callbackFlow

将基于回调的 API 桥接到 Flow：

```kotlin
fun locationUpdates(): Flow<Location> = callbackFlow {
    val callback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { location ->
                trySend(location)
            }
        }
    }

    locationClient.requestLocationUpdates(request, callback, Looper.getMainLooper())

    awaitClose {
        locationClient.removeLocationUpdates(callback)
    }
}

// 用法
fun main() = runBlocking {
    locationUpdates()
        .take(5) // 获取前 5 个更新
        .collect { location ->
            println("Location: ${location.latitude}, ${location.longitude}")
        }
}
```

### MutableSharedFlow 和 MutableStateFlow

创建可以命令式发射值的热流：

```kotlin
class EventEmitter {
    private val _events = MutableSharedFlow<Event>()
    val events: SharedFlow<Event> = _events.asSharedFlow()

    suspend fun emit(event: Event) {
        _events.emit(event)
    }
}

class StateHolder {
    private val _state = MutableStateFlow<State>(State.Initial)
    val state: StateFlow<State> = _state.asStateFlow()

    fun updateState(newState: State) {
        _state.value = newState
    }
}
```

## 中间操作符

中间操作符转换流而不消费它。它们返回一个新的 Flow，在收集时应用转换。

### map

转换每个发射的值：

```kotlin
fun main() = runBlocking {
    (1..5).asFlow()
        .map { value -> value * value }
        .collect { println(it) }
    // 输出：1, 4, 9, 16, 25
}

// 使用挂起函数
suspend fun performRequest(id: Int): String {
    delay(100)
    return "Response for $id"
}

fun main() = runBlocking {
    (1..3).asFlow()
        .map { id -> performRequest(id) }
        .collect { println(it) }
}
```

### filter

只保留匹配谓词的值：

```kotlin
fun main() = runBlocking {
    (1..10).asFlow()
        .filter { it % 2 == 0 }
        .collect { println(it) }
    // 输出：2, 4, 6, 8, 10
}

// 使用挂起谓词的过滤
fun main() = runBlocking {
    flowOf("apple", "banana", "cherry")
        .filter { fruit ->
            delay(50) // 异步验证
            fruit.length > 5
        }
        .collect { println(it) }
    // 输出：banana, cherry
}
```

### transform

具有多次发射的任意转换：

```kotlin
fun main() = runBlocking {
    (1..3).asFlow()
        .transform { value ->
            emit("Processing $value")
            delay(100)
            emit("Completed $value")
        }
        .collect { println(it) }
    // 输出：
    // Processing 1
    // Completed 1
    // Processing 2
    // Completed 2
    // Processing 3
    // Completed 3
}
```

### take 和 drop

限制发射数量：

```kotlin
fun main() = runBlocking {
    // 获取前 n 个值
    (1..10).asFlow()
        .take(3)
        .collect { println(it) }
    // 输出：1, 2, 3

    println("---")

    // 丢弃前 n 个值
    (1..10).asFlow()
        .drop(7)
        .collect { println(it) }
    // 输出：8, 9, 10
}
```

### takeWhile 和 dropWhile

条件性获取和丢弃：

```kotlin
fun main() = runBlocking {
    // 当条件为真时获取
    (1..10).asFlow()
        .takeWhile { it < 5 }
        .collect { println(it) }
    // 输出：1, 2, 3, 4

    println("---")

    // 当条件为真时丢弃
    (1..10).asFlow()
        .dropWhile { it < 5 }
        .collect { println(it) }
    // 输出：5, 6, 7, 8, 9, 10
}
```

### distinctUntilChanged

跳过连续重复：

```kotlin
fun main() = runBlocking {
    flowOf(1, 1, 2, 2, 2, 3, 1, 1)
        .distinctUntilChanged()
        .collect { println(it) }
    // 输出：1, 2, 3, 1
}

// 使用自定义比较
data class User(val id: Int, val name: String)

fun main() = runBlocking {
    flowOf(
        User(1, "Alice"),
        User(1, "Alice Updated"),
        User(2, "Bob")
    )
    .distinctUntilChangedBy { it.id }
    .collect { println(it) }
    // 输出：User(1, Alice), User(2, Bob)
}
```

### onEach

执行副作用而不修改值：

```kotlin
fun main() = runBlocking {
    (1..5).asFlow()
        .onEach { value ->
            println("About to emit: $value")
            delay(50)
        }
        .collect { println("Collected: $it") }
}
```

### scan 和 runningFold

累积值并发射中间结果：

```kotlin
fun main() = runBlocking {
    // scan（别名：runningFold）
    (1..5).asFlow()
        .scan(0) { accumulator, value ->
            accumulator + value
        }
        .collect { println(it) }
    // 输出：0, 1, 3, 6, 10, 15（累计和）
}
```

### withIndex

用索引包装值：

```kotlin
fun main() = runBlocking {
    flowOf("a", "b", "c")
        .withIndex()
        .collect { (index, value) ->
            println("$index: $value")
        }
    // 输出：
    // 0: a
    // 1: b
    // 2: c
}
```

### 链接多个操作符

```kotlin
data class User(val id: Int, val name: String, val active: Boolean)

fun getUsersFlow(): Flow<User> = flowOf(
    User(1, "Alice", true),
    User(2, "Bob", false),
    User(3, "Charlie", true),
    User(4, "Diana", true)
)

fun main() = runBlocking {
    getUsersFlow()
        .filter { it.active }
        .map { it.name.uppercase() }
        .take(2)
        .withIndex()
        .collect { (index, name) ->
            println("$index: $name")
        }
    // 输出：
    // 0: ALICE
    // 1: CHARLIE
}
```

## 终端操作符

终端操作符开始流收集并返回结果。

### collect

最基本的终端操作符：

```kotlin
fun main() = runBlocking {
    flowOf(1, 2, 3).collect { value ->
        println("Received: $value")
    }
}
```

### collectLatest

当新值到达时取消前一个收集器：

```kotlin
fun main() = runBlocking {
    flow {
        emit(1)
        delay(50)
        emit(2)
        delay(50)
        emit(3)
    }.collectLatest { value ->
        println("Collecting $value")
        delay(100) // 慢处理
        println("Done with $value")
    }
}
// 输出：
// Collecting 1
// Collecting 2
// Collecting 3
// Done with 3
```

### toList 和 toSet

将所有值收集到集合中：

```kotlin
fun main() = runBlocking {
    val list: List<Int> = (1..5).asFlow().toList()
    println(list) // [1, 2, 3, 4, 5]

    val set: Set<String> = flowOf("a", "b", "a", "c").toSet()
    println(set) // [a, b, c]
}
```

### first 和 firstOrNull

获取第一个值：

```kotlin
fun main() = runBlocking {
    val first = (1..10).asFlow().first()
    println(first) // 1

    val firstEven = (1..10).asFlow().first { it % 2 == 0 }
    println(firstEven) // 2

    val empty = emptyFlow<Int>().firstOrNull()
    println(empty) // null
}
```

### last 和 lastOrNull

获取最后一个值：

```kotlin
fun main() = runBlocking {
    val last = (1..10).asFlow().last()
    println(last) // 10

    val lastOdd = (1..10).asFlow().last { it % 2 != 0 }
    println(lastOdd) // 9
}
```

### single 和 singleOrNull

期望恰好一个值：

```kotlin
fun main() = runBlocking {
    val single = flowOf(42).single()
    println(single) // 42

    try {
        flowOf(1, 2).single() // 抛出 IllegalArgumentException
    } catch (e: Exception) {
        println("Error: ${e.message}")
    }

    val singleOrNull = emptyFlow<Int>().singleOrNull()
    println(singleOrNull) // null
}
```

### reduce 和 fold

将值累积为单个结果：

```kotlin
fun main() = runBlocking {
    // reduce - 无初始值
    val sum = (1..5).asFlow().reduce { acc, value -> acc + value }
    println("Sum: $sum") // 15

    // fold - 有初始值
    val product = (1..5).asFlow().fold(1) { acc, value -> acc * value }
    println("Product: $product") // 120

    // 使用不同结果类型的 fold
    val concatenated = (1..5).asFlow()
        .fold(StringBuilder()) { acc, value ->
            acc.append(value).append("-")
        }
    println(concatenated) // 1-2-3-4-5-
}
```

### count

计数发射：

```kotlin
fun main() = runBlocking {
    val total = (1..100).asFlow().count()
    println("Total: $total") // 100

    val evenCount = (1..100).asFlow().count { it % 2 == 0 }
    println("Even count: $evenCount") // 50
}
```

### launchIn

在单独的协程中启动收集：

```kotlin
fun main() = runBlocking {
    val job = (1..5).asFlow()
        .onEach { delay(100) }
        .onEach { println("Emitting: $it") }
        .launchIn(this)

    println("Flow launched")
    job.join()
    println("Flow completed")
}
```

## Flow 上下文

### 上下文保持

Flow 保持收集器的上下文，默认在该上下文中运行发射：

```kotlin
fun logThread(msg: String) = println("[$msg] ${Thread.currentThread().name}")

fun simpleFlow(): Flow<Int> = flow {
    logThread("Flow started")
    for (i in 1..3) {
        emit(i)
    }
}

fun main() = runBlocking {
    logThread("Main")
    simpleFlow().collect { value ->
        logThread("Collected $value")
    }
}
// 所有操作在主线程上运行
```

### flowOn 操作符

更改上游上下文：

```kotlin
fun dataFlow(): Flow<Int> = flow {
    logThread("Emitting")
    for (i in 1..3) {
        Thread.sleep(100) // 阻塞操作
        emit(i)
    }
}

fun main() = runBlocking {
    dataFlow()
        .flowOn(Dispatchers.IO) // 上游在 IO 上运行
        .map { value ->
            logThread("Mapping $value")
            value * 2
        }
        .flowOn(Dispatchers.Default) // Map 在 Default 上运行
        .collect { value ->
            logThread("Collecting $value")
        }
}
// Emitting: DefaultDispatcher-worker-1
// Mapping: DefaultDispatcher-worker-2
// Collecting: main
```

**重要**：`flowOn` 只影响上游操作。它改变链中其上方代码的上下文。

### 多次上下文切换

```kotlin
fun processedFlow(): Flow<String> = flow {
    emit(fetchDataFromNetwork()) // 在 IO 上运行
}
.flowOn(Dispatchers.IO)
.map { data ->
    parseData(data) // 在 Default 上运行
}
.flowOn(Dispatchers.Default)

// 收集在收集器的上下文中运行
fun main() = runBlocking(Dispatchers.Main) {
    processedFlow().collect { result ->
        updateUI(result) // 在 Main 上运行
    }
}
```

### 违反上下文保持

Flow 不允许从不同上下文发射：

```kotlin
// 这将抛出 IllegalStateException！
fun wrongFlow(): Flow<Int> = flow {
    withContext(Dispatchers.Default) {
        emit(1) // 错误：Flow 不变性被违反
    }
}

// 正确方法：使用 flowOn
fun correctFlow(): Flow<Int> = flow {
    emit(1)
}.flowOn(Dispatchers.Default)

// 或使用 channelFlow 进行并发发射
fun concurrentFlow(): Flow<Int> = channelFlow {
    withContext(Dispatchers.Default) {
        send(1) // 在 channelFlow 中 OK
    }
}
```

## 异常处理

### 收集器 Try-Catch

在收集站点处理异常：

```kotlin
fun riskyFlow(): Flow<Int> = flow {
    emit(1)
    emit(2)
    throw RuntimeException("Flow failed!")
}

fun main() = runBlocking {
    try {
        riskyFlow().collect { value ->
            println("Received: $value")
        }
    } catch (e: Exception) {
        println("Caught: ${e.message}")
    }
}
// 输出：
// Received: 1
// Received: 2
// Caught: Flow failed!
```

### catch 操作符

声明式处理异常：

```kotlin
fun main() = runBlocking {
    riskyFlow()
        .catch { e ->
            println("Caught: ${e.message}")
            emit(-1) // 发射回退值
        }
        .collect { println("Collected: $it") }
}
// 输出：
// Collected: 1
// Collected: 2
// Caught: Flow failed!
// Collected: -1
```

### 异常透明性

`catch` 操作符只捕获上游异常：

```kotlin
fun main() = runBlocking {
    flow {
        emit(1)
        emit(2)
    }
    .map { value ->
        check(value != 2) { "Value 2 is not allowed!" }
        value
    }
    .catch { e ->
        println("Caught in catch: ${e.message}")
    }
    .collect { value ->
        println("Collected: $value")
        // 这里的异常不会被 catch 操作符捕获！
    }
}
```

### 在收集器中捕获异常

使用 `onEach` + `catch` + `collect` 模式：

```kotlin
fun main() = runBlocking {
    flow {
        emit(1)
        emit(2)
    }
    .onEach { value ->
        check(value != 2) { "Cannot process 2" }
        println("Processing: $value")
    }
    .catch { e -> println("Caught: ${e.message}") }
    .collect() // 空 collect
}
```

### retryWhen

使用自定义逻辑在失败时重试：

```kotlin
fun unreliableFlow(): Flow<Int> = flow {
    emit(1)
    if (Random.nextBoolean()) {
        throw IOException("Network error")
    }
    emit(2)
}

fun main() = runBlocking {
    unreliableFlow()
        .retryWhen { cause, attempt ->
            if (cause is IOException && attempt < 3) {
                println("Retry attempt $attempt after ${cause.message}")
                delay(1000 * attempt) // 指数退避
                true // 重试
            } else {
                false // 不重试
            }
        }
        .catch { e -> println("Failed after retries: ${e.message}") }
        .collect { println("Received: $it") }
}
```

### retry

简化的带次数重试：

```kotlin
fun main() = runBlocking {
    var attempts = 0

    flow {
        attempts++
        if (attempts < 3) {
            throw IOException("Attempt $attempts failed")
        }
        emit("Success on attempt $attempts")
    }
    .retry(3) { cause ->
        println("Retrying due to: ${cause.message}")
        cause is IOException
    }
    .collect { println(it) }
}
```

## Flow 完成

### onCompletion 操作符

当流完成时（正常或异常）执行代码：

```kotlin
fun main() = runBlocking {
    flowOf(1, 2, 3)
        .onCompletion { cause ->
            if (cause == null) {
                println("Flow completed successfully")
            } else {
                println("Flow completed with exception: ${cause.message}")
            }
        }
        .collect { println(it) }
}
```

### onCompletion 处理上游异常

```kotlin
fun main() = runBlocking {
    flow {
        emit(1)
        throw RuntimeException("Oops!")
    }
    .onCompletion { cause ->
        if (cause != null) {
            println("Completing with error: ${cause.message}")
        }
    }
    .catch { e -> println("Caught: ${e.message}") }
    .collect { println(it) }
}
// 输出：
// 1
// Completing with error: Oops!
// Caught: Oops!
```

### onStart 操作符

当收集开始时执行代码：

```kotlin
fun main() = runBlocking {
    (1..3).asFlow()
        .onStart {
            println("Starting collection...")
            emit(0) // 可以发射值！
        }
        .onCompletion { println("Collection completed") }
        .collect { println("Value: $it") }
}
// 输出：
// Starting collection...
// Value: 0
// Value: 1
// Value: 2
// Value: 3
// Collection completed
```

### collect 中的 finally

使用 Kotlin 的标准 `finally` 块：

```kotlin
fun main() = runBlocking {
    try {
        flowOf(1, 2, 3).collect { value ->
            println("Collected: $value")
        }
    } finally {
        println("Cleanup in finally block")
    }
}
```

## 缓冲和合并

### buffer 操作符

并发运行收集器和发射器：

```kotlin
fun measureTime(block: suspend () -> Unit): Long {
    val start = System.currentTimeMillis()
    runBlocking { block() }
    return System.currentTimeMillis() - start
}

fun slowFlow(): Flow<Int> = flow {
    for (i in 1..3) {
        delay(100) // 模拟慢发射
        emit(i)
    }
}

fun main() {
    // 没有 buffer：~600ms（每个 3 个值 100+100）
    val timeWithoutBuffer = measureTime {
        slowFlow().collect { value ->
            delay(100) // 模拟慢收集
            println("Collected: $value")
        }
    }
    println("Without buffer: ${timeWithoutBuffer}ms")

    // 有 buffer：~400ms（发射和收集重叠）
    val timeWithBuffer = measureTime {
        slowFlow()
            .buffer()
            .collect { value ->
                delay(100)
                println("Collected: $value")
            }
    }
    println("With buffer: ${timeWithBuffer}ms")
}
```

### 缓冲容量

控制缓冲大小和溢出行为：

```kotlin
fun main() = runBlocking {
    flow {
        repeat(10) {
            println("Emitting $it")
            emit(it)
        }
    }
    .buffer(capacity = 2, onBufferOverflow = BufferOverflow.SUSPEND)
    .collect { value ->
        delay(100)
        println("Collected: $value")
    }
}

// BufferOverflow 选项：
// SUSPEND - 缓冲满时挂起发射器（默认）
// DROP_OLDEST - 丢弃缓冲中最旧的值
// DROP_LATEST - 丢弃正在发射的值
```

### conflate 操作符

只保留最新值，丢弃中间值：

```kotlin
fun main() = runBlocking {
    flow {
        for (i in 1..10) {
            emit(i)
            delay(50) // 每 50ms 发射
        }
    }
    .conflate() // 只保留最新
    .collect { value ->
        println("Collecting $value")
        delay(150) // 处理慢
        println("Processed $value")
    }
}
// 一些值会被跳过
```

### collectLatest

当新值到达时取消前一个收集：

```kotlin
fun main() = runBlocking {
    flow {
        emit("A")
        delay(100)
        emit("B")
        delay(100)
        emit("C")
    }
    .collectLatest { value ->
        println("Started processing $value")
        delay(200) // 慢处理
        println("Finished processing $value")
    }
}
// 输出：
// Started processing A
// Started processing B
// Started processing C
// Finished processing C
```

### 背压策略比较

| 策略 | 行为 | 用例 |
|----------|----------|----------|
| `buffer()` | 缓冲发射 | 提高吞吐量 |
| `buffer(CONFLATED)` | 只保留最新 | UI 状态更新 |
| `conflate()` | 丢弃中间值 | 实时数据 |
| `collectLatest` | 取消前一个 | 搜索建议 |

## 组合 Flow

### zip

配对两个流中的对应元素：

```kotlin
fun main() = runBlocking {
    val numbers = flowOf(1, 2, 3)
    val letters = flowOf("A", "B", "C")

    numbers.zip(letters) { num, letter ->
        "$num$letter"
    }.collect { println(it) }
    // 输出：1A, 2B, 3C
}
```

zip 在较短的流完成时完成：

```kotlin
fun main() = runBlocking {
    val flow1 = flowOf(1, 2, 3, 4, 5)
    val flow2 = flowOf("A", "B")

    flow1.zip(flow2) { a, b -> "$a-$b" }
        .collect { println(it) }
    // 输出：1-A, 2-B（在 2 之后停止）
}
```

### combine

当任何流发射时发射，使用最新值：

```kotlin
fun main() = runBlocking {
    val flow1 = flow {
        emit(1)
        delay(150)
        emit(2)
    }

    val flow2 = flow {
        emit("A")
        delay(100)
        emit("B")
        delay(100)
        emit("C")
    }

    flow1.combine(flow2) { num, letter -> "$num$letter" }
        .collect { println(it) }
}
// 输出：1A, 1B, 2B, 2C
```

### combineTransform

使用自定义转换逻辑组合：

```kotlin
fun main() = runBlocking {
    val userFlow = flowOf(User("Alice"), User("Bob"))
    val settingsFlow = flowOf(Settings(theme = "dark"))

    userFlow.combineTransform(settingsFlow) { user, settings ->
        emit("Loading ${user.name}'s profile...")
        delay(100) // 模拟加载
        emit("${user.name} with ${settings.theme} theme")
    }.collect { println(it) }
}
```

### merge

将多个流合并为一个：

```kotlin
fun main() = runBlocking {
    val flow1 = flow {
        delay(100)
        emit("A1")
        delay(200)
        emit("A2")
    }

    val flow2 = flow {
        delay(50)
        emit("B1")
        delay(150)
        emit("B2")
    }

    merge(flow1, flow2).collect { println(it) }
}
// 输出顺序取决于时序：B1, A1, B2, A2
```

### 多 Flow 组合

```kotlin
fun main() = runBlocking {
    val searchQuery = MutableStateFlow("")
    val sortOrder = MutableStateFlow(SortOrder.NAME)
    val filterActive = MutableStateFlow(true)

    combine(
        searchQuery,
        sortOrder,
        filterActive
    ) { query, sort, active ->
        SearchParams(query, sort, active)
    }
    .flatMapLatest { params ->
        searchRepository.search(params)
    }
    .collect { results ->
        displayResults(results)
    }
}
```

## 展平 Flow

### flatMapConcat

将每个值转换为流并顺序连接：

```kotlin
fun getItemDetails(id: Int): Flow<String> = flow {
    delay(100)
    emit("Details for item $id")
    delay(50)
    emit("Extra info for $id")
}

fun main() = runBlocking {
    (1..3).asFlow()
        .flatMapConcat { id ->
            getItemDetails(id)
        }
        .collect { println(it) }
}
// 输出（顺序）：
// Details for item 1
// Extra info for 1
// Details for item 2
// Extra info for 2
// Details for item 3
// Extra info for 3
```

### flatMapMerge

并发转换和合并：

```kotlin
fun main() = runBlocking {
    (1..3).asFlow()
        .flatMapMerge(concurrency = 2) { id ->
            flow {
                delay(100)
                emit("Result $id")
            }
        }
        .collect { println(it) }
}
// 结果可能基于时序交错
```

### flatMapLatest

当新值到达时取消前一个内部流：

```kotlin
fun searchItems(query: String): Flow<List<Item>> = flow {
    delay(200) // 模拟网络延迟
    emit(repository.search(query))
}

fun main() = runBlocking {
    queryFlow
        .debounce(300)
        .flatMapLatest { query ->
            if (query.isEmpty()) {
                flowOf(emptyList())
            } else {
                searchItems(query)
            }
        }
        .collect { results ->
            displaySearchResults(results)
        }
}
```

### 展平操作符比较

| 操作符 | 并发 | 取消前一个 | 保持顺序 |
|----------|-------------|-----------------|-----------------|
| `flatMapConcat` | 顺序 | 否 | 是 |
| `flatMapMerge` | 并发 | 否 | 否 |
| `flatMapLatest` | 一次一个 | 是 | N/A |

## StateFlow

StateFlow 是一个热的、可观察的状态持有者，始终有值并向收集器发射更新。

### 创建 StateFlow

```kotlin
class CounterViewModel {
    // 私有可变状态
    private val _count = MutableStateFlow(0)

    // 公共只读状态
    val count: StateFlow<Int> = _count.asStateFlow()

    fun increment() {
        _count.value++
    }

    fun decrement() {
        _count.update { current -> current - 1 }
    }

    fun reset() {
        _count.value = 0
    }
}
```

### StateFlow 特性

```kotlin
fun main() = runBlocking {
    val stateFlow = MutableStateFlow(1)

    // 始终有值
    println("Current value: ${stateFlow.value}") // 1

    // 新收集器立即获得当前值
    launch {
        stateFlow.collect { println("Collector 1: $it") }
    }

    delay(50)

    // 只在实际更改时发射（相等性检查）
    stateFlow.value = 1 // 不发射（相同值）
    stateFlow.value = 2 // 发射 2
    stateFlow.value = 2 // 不发射（相同值）

    delay(100)
    coroutineContext.cancelChildren()
}
```

### 线程安全更新

```kotlin
class SafeCounter {
    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count.asStateFlow()

    // 使用 update 函数进行原子更新
    fun incrementSafely() {
        _count.update { it + 1 }
    }

    // 比较并设置
    fun compareAndSet(expect: Int, update: Int): Boolean {
        return _count.compareAndSet(expect, update)
    }

    // 更新并获取
    fun incrementAndGet(): Int {
        return _count.updateAndGet { it + 1 }
    }
}
```

### 将 Flow 转换为 StateFlow

```kotlin
class DataRepository {
    fun observeData(): Flow<Data> = flow {
        while (true) {
            emit(fetchLatestData())
            delay(5000)
        }
    }
}

class ViewModel(
    private val repository: DataRepository,
    private val scope: CoroutineScope
) {
    val data: StateFlow<Data> = repository.observeData()
        .stateIn(
            scope = scope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = Data.EMPTY
        )
}
```

### SharingStarted 选项

```kotlin
// 立即开始并永远保持活动
SharingStarted.Eagerly

// 在第一个订阅者时开始，永远保持活动
SharingStarted.Lazily

// 在第一个订阅者时开始，在最后一个订阅者之后延迟停止
SharingStarted.WhileSubscribed(
    stopTimeoutMillis = 5000,  // 停止前等待
    replayExpirationMillis = 0 // 无限期保留重放缓存
)
```

## SharedFlow

SharedFlow 是一个热流，可以有多个订阅者和可配置的重放和缓冲。

### 创建 SharedFlow

```kotlin
class EventBus {
    private val _events = MutableSharedFlow<Event>(
        replay = 0,                    // 新订阅者无重放
        extraBufferCapacity = 10,      // 缓冲 10 个事件
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )

    val events: SharedFlow<Event> = _events.asSharedFlow()

    suspend fun emit(event: Event) {
        _events.emit(event)
    }

    fun tryEmit(event: Event): Boolean {
        return _events.tryEmit(event)
    }
}
```

### 用于事件的 SharedFlow

```kotlin
sealed class UiEvent {
    data class ShowSnackbar(val message: String) : UiEvent()
    data class Navigate(val route: String) : UiEvent()
    object GoBack : UiEvent()
}

class ViewModel {
    private val _events = MutableSharedFlow<UiEvent>()
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()

    fun onSaveClicked() {
        viewModelScope.launch {
            try {
                repository.save(data)
                _events.emit(UiEvent.ShowSnackbar("Saved successfully"))
                _events.emit(UiEvent.Navigate("home"))
            } catch (e: Exception) {
                _events.emit(UiEvent.ShowSnackbar("Save failed: ${e.message}"))
            }
        }
    }
}

// 在 Activity/Fragment 中
lifecycleScope.launch {
    viewModel.events.collect { event ->
        when (event) {
            is UiEvent.ShowSnackbar -> showSnackbar(event.message)
            is UiEvent.Navigate -> navigateTo(event.route)
            UiEvent.GoBack -> onBackPressed()
        }
    }
}
```

### 带重放的 SharedFlow

```kotlin
class RecentEventsRepository {
    private val _recentEvents = MutableSharedFlow<Event>(
        replay = 10 // 新订阅者获取最后 10 个事件
    )

    val recentEvents: SharedFlow<Event> = _recentEvents.asSharedFlow()

    suspend fun recordEvent(event: Event) {
        _recentEvents.emit(event)
    }

    fun getRecentEvents(): List<Event> {
        return _recentEvents.replayCache
    }
}
```

### 将 Flow 转换为 SharedFlow

```kotlin
class LocationRepository {
    fun observeLocation(): Flow<Location> = callbackFlow {
        // ... 位置回调设置
        awaitClose { /* 清理 */ }
    }
}

class ViewModel(
    private val locationRepository: LocationRepository,
    private val scope: CoroutineScope
) {
    val location: SharedFlow<Location> = locationRepository.observeLocation()
        .shareIn(
            scope = scope,
            started = SharingStarted.WhileSubscribed(),
            replay = 1  // 新订阅者获取最后已知位置
        )
}
```

### StateFlow vs SharedFlow

| 特性 | StateFlow | SharedFlow |
|---------|-----------|------------|
| 初始值 | 必需 | 非必需 |
| 访问当前值 | `value` 属性 | 通过 `replayCache` |
| 重复过滤 | 是（结构相等） | 否 |
| 重放次数 | 总是 1 | 可配置 |
| 用例 | UI 状态 | 事件/命令 |

```kotlin
class ViewModel {
    // StateFlow 用于状态（始终有值，过滤重复）
    private val _uiState = MutableStateFlow(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    // SharedFlow 用于一次性事件（无初始值，无过滤）
    private val _events = MutableSharedFlow<UiEvent>()
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()
}
```

## 基于 Channel 的 Flow

### channelFlow 构建器

创建具有类似通道语义的流：

```kotlin
fun multiSourceFlow(): Flow<Data> = channelFlow {
    launch {
        dataSource1.observe().collect { send(it) }
    }
    launch {
        dataSource2.observe().collect { send(it) }
    }
}
```

### produceIn

将流转换为通道：

```kotlin
fun main() = runBlocking {
    val channel = (1..5).asFlow()
        .onEach { delay(100) }
        .produceIn(this)

    repeat(5) {
        println(channel.receive())
    }

    channel.cancel()
}
```

### consumeAsFlow

将通道转换为流：

```kotlin
fun main() = runBlocking {
    val channel = Channel<Int>()

    launch {
        for (x in 1..5) {
            channel.send(x)
        }
        channel.close()
    }

    channel.consumeAsFlow()
        .map { it * 2 }
        .collect { println(it) }
}
```

### receiveAsFlow

与 consumeAsFlow 类似但可重用：

```kotlin
class DataProducer {
    private val channel = Channel<Data>()

    val dataFlow: Flow<Data> = channel.receiveAsFlow()

    suspend fun produce(data: Data) {
        channel.send(data)
    }
}
```

## 测试 Flow

### 基本 Flow 测试

```kotlin
class FlowTest {
    @Test
    fun `flow emits expected values`() = runTest {
        val flow = flowOf(1, 2, 3)
        val result = flow.toList()
        assertEquals(listOf(1, 2, 3), result)
    }

    @Test
    fun `mapped flow transforms values`() = runTest {
        val flow = flowOf(1, 2, 3).map { it * 2 }
        assertEquals(listOf(2, 4, 6), flow.toList())
    }
}
```

### 使用 Turbine 测试

```kotlin
class ViewModelTest {
    @Test
    fun `state updates correctly`() = runTest {
        val viewModel = CounterViewModel()

        viewModel.count.test {
            assertEquals(0, awaitItem())
            viewModel.increment()
            assertEquals(1, awaitItem())
            cancelAndConsumeRemainingEvents()
        }
    }
}
```

### 使用虚拟时间测试

```kotlin
class DelayedFlowTest {
    @Test
    fun `flow with delays works correctly`() = runTest {
        val flow = flow {
            emit(1)
            delay(1000)
            emit(2)
        }

        val values = mutableListOf<Int>()
        launch { flow.collect { values.add(it) } }

        advanceTimeBy(500)
        assertEquals(listOf(1), values)

        advanceUntilIdle()
        assertEquals(listOf(1, 2), values)
    }
}
```

## 实际模式

### 带防抖的搜索

```kotlin
class SearchViewModel(private val repository: SearchRepository) : ViewModel() {
    private val _query = MutableStateFlow("")

    val searchResults: StateFlow<SearchState> = _query
        .debounce(300)
        .distinctUntilChanged()
        .flatMapLatest { query ->
            if (query.isBlank()) flowOf(SearchState.Empty)
            else flow {
                emit(SearchState.Loading)
                emit(SearchState.Success(repository.search(query)))
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SearchState.Empty)
}
```

### 组合多个数据源

```kotlin
val dashboardState: StateFlow<DashboardState> = combine(
    userRepository.observeUser(),
    statsRepository.observeStats(),
    notificationsRepository.observeUnreadCount()
) { user, stats, unreadCount ->
    DashboardState(user.name, stats.orderCount, unreadCount)
}.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DashboardState.loading())
```

## 最佳实践

### 对 UI 状态使用 StateFlow

```kotlin
class ViewModel {
    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()
}
```

### 对一次性事件使用 SharedFlow

```kotlin
class ViewModel {
    private val _events = MutableSharedFlow<UiEvent>()
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()
}
```

### 生命周期感知收集

```kotlin
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.state.collect { render(it) }
    }
}
```

### 使用适当的操作符

```kotlin
searchQuery.debounce(300).flatMapLatest { search(it) }
stateFlow.map { it.selectedItem }.distinctUntilChanged()
sensorData.conflate().collect { updateDisplay(it) }
```

## 总结

Kotlin Flow 提供了一个强大的、声明式的 API 来处理异步数据流：

- **Flow 构建器**（`flow`、`flowOf`、`channelFlow`）创建冷流
- **中间操作符**（`map`、`filter`、`transform`）转换数据
- **终端操作符**（`collect`、`toList`、`first`）消费流
- **上下文操作符**（`flowOn`）控制执行上下文
- **异常处理**（`catch`、`retry`）管理错误
- **缓冲**（`buffer`、`conflate`、`collectLatest`）处理背压
- **组合操作符**（`zip`、`combine`、`merge`）处理多个流
- **StateFlow** 提供可观察状态
- **SharedFlow** 启用事件广播

通过掌握 Flow，你可以构建响应式、高效且可维护的 Kotlin 应用程序。

## 基于 Channel 的 Flow

### channelFlow 构建器

创建具有类似通道语义的流：

```kotlin
fun multiSourceFlow(): Flow<Data> = channelFlow {
    // 启动多个协程发送到同一通道
    launch {
        dataSource1.observe().collect { send(it) }
    }
    launch {
        dataSource2.observe().collect { send(it) }
    }

    // 当 channelFlow 作用域完成时通道关闭
}
```

### produceIn

将流转换为通道：

```kotlin
fun main() = runBlocking {
    val channel = (1..5).asFlow()
        .onEach { delay(100) }
        .produceIn(this)

    repeat(5) {
        println(channel.receive())
    }

    channel.cancel()
}
```

### consumeAsFlow

将通道转换为流：

```kotlin
fun main() = runBlocking {
    val channel = Channel<Int>()

    launch {
        for (x in 1..5) {
            channel.send(x)
        }
        channel.close()
    }

    channel.consumeAsFlow()
        .map { it * 2 }
        .collect { println(it) }
}
```

### receiveAsFlow

与 consumeAsFlow 类似但可重用：

```kotlin
class DataProducer {
    private val channel = Channel<Data>()

    val dataFlow: Flow<Data> = channel.receiveAsFlow()

    suspend fun produce(data: Data) {
        channel.send(data)
    }
}
```

## 测试 Flow

### 基本 Flow 测试

```kotlin
class FlowTest {
    @Test
    fun `flow emits expected values`() = runTest {
        val flow = flowOf(1, 2, 3)

        val result = flow.toList()

        assertEquals(listOf(1, 2, 3), result)
    }

    @Test
    fun `mapped flow transforms values`() = runTest {
        val flow = flowOf(1, 2, 3)
            .map { it * 2 }

        assertEquals(listOf(2, 4, 6), flow.toList())
    }
}
```

### 使用 Turbine 测试

Turbine 提供了方便的 DSL 来测试流：

```kotlin
// 添加依赖：testImplementation("app.cash.turbine:turbine:1.0.0")

class ViewModelTest {
    @Test
    fun `state updates correctly`() = runTest {
        val viewModel = CounterViewModel()

        viewModel.count.test {
            assertEquals(0, awaitItem()) // 初始值

            viewModel.increment()
            assertEquals(1, awaitItem())

            viewModel.increment()
            assertEquals(2, awaitItem())

            cancelAndConsumeRemainingEvents()
        }
    }

    @Test
    fun `events are emitted`() = runTest {
        val viewModel = MyViewModel()

        viewModel.events.test {
            viewModel.performAction()

            val event = awaitItem()
            assertTrue(event is UiEvent.ShowMessage)

            expectNoEvents()
        }
    }
}
```

### 测试 StateFlow

```kotlin
class StateFlowTest {
    @Test
    fun `stateFlow has correct initial value`() = runTest {
        val stateFlow = MutableStateFlow(0)

        assertEquals(0, stateFlow.value)
    }

    @Test
    fun `stateFlow emits updates`() = runTest {
        val stateFlow = MutableStateFlow(0)
        val values = mutableListOf<Int>()

        val job = launch(UnconfinedTestDispatcher(testScheduler)) {
            stateFlow.collect { values.add(it) }
        }

        stateFlow.value = 1
        stateFlow.value = 2
        stateFlow.value = 3

        assertEquals(listOf(0, 1, 2, 3), values)

        job.cancel()
    }
}
```

### 使用虚拟时间测试

```kotlin
class DelayedFlowTest {
    @Test
    fun `flow with delays works correctly`() = runTest {
        val flow = flow {
            emit(1)
            delay(1000)
            emit(2)
            delay(1000)
            emit(3)
        }

        val values = mutableListOf<Int>()

        launch {
            flow.collect { values.add(it) }
        }

        advanceTimeBy(500)
        assertEquals(listOf(1), values)

        advanceTimeBy(1000)
        assertEquals(listOf(1, 2), values)

        advanceUntilIdle()
        assertEquals(listOf(1, 2, 3), values)
    }
}
```

### 测试异常处理

```kotlin
class ExceptionTest {
    @Test
    fun `catch handles exception`() = runTest {
        val flow = flow {
            emit(1)
            throw RuntimeException("Test error")
        }.catch { emit(-1) }

        assertEquals(listOf(1, -1), flow.toList())
    }

    @Test
    fun `retry attempts correct number of times`() = runTest {
        var attempts = 0

        val flow = flow {
            attempts++
            if (attempts < 3) throw IOException()
            emit("Success")
        }.retry(3)

        assertEquals("Success", flow.first())
        assertEquals(3, attempts)
    }
}
```

## 实际模式

### 带防抖的搜索

```kotlin
class SearchViewModel(
    private val repository: SearchRepository
) : ViewModel() {

    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    val searchResults: StateFlow<SearchState> = _query
        .debounce(300)
        .distinctUntilChanged()
        .flatMapLatest { query ->
            if (query.isBlank()) {
                flowOf(SearchState.Empty)
            } else {
                flow {
                    emit(SearchState.Loading)
                    try {
                        val results = repository.search(query)
                        emit(SearchState.Success(results))
                    } catch (e: Exception) {
                        emit(SearchState.Error(e.message ?: "Unknown error"))
                    }
                }
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = SearchState.Empty
        )

    fun onQueryChanged(newQuery: String) {
        _query.value = newQuery
    }
}

sealed class SearchState {
    object Empty : SearchState()
    object Loading : SearchState()
    data class Success(val results: List<SearchResult>) : SearchState()
    data class Error(val message: String) : SearchState()
}
```

### 带自动重试的轮询

```kotlin
fun <T> pollingFlow(
    intervalMs: Long,
    maxRetries: Int = 3,
    fetch: suspend () -> T
): Flow<T> = flow {
    while (true) {
        try {
            emit(fetch())
        } catch (e: Exception) {
            // 让重试处理它
            throw e
        }
        delay(intervalMs)
    }
}.retryWhen { cause, attempt ->
    if (attempt < maxRetries && cause is IOException) {
        delay(1000 * (attempt + 1)) // 指数退避
        true
    } else {
        false
    }
}

// 用法
class StockPriceRepository {
    fun observeStockPrice(symbol: String): Flow<StockPrice> = pollingFlow(
        intervalMs = 5000,
        maxRetries = 3
    ) {
        api.getStockPrice(symbol)
    }
}
```

### 组合多个数据源

```kotlin
class DashboardViewModel(
    private val userRepository: UserRepository,
    private val statsRepository: StatsRepository,
    private val notificationsRepository: NotificationsRepository
) : ViewModel() {

    val dashboardState: StateFlow<DashboardState> = combine(
        userRepository.observeUser(),
        statsRepository.observeStats(),
        notificationsRepository.observeUnreadCount()
    ) { user, stats, unreadCount ->
        DashboardState(
            userName = user.name,
            totalOrders = stats.orderCount,
            revenue = stats.totalRevenue,
            unreadNotifications = unreadCount
        )
    }
    .catch { e ->
        emit(DashboardState.error(e.message))
    }
    .stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = DashboardState.loading()
    )
}
```

### 分页 Flow

```kotlin
class PaginatedRepository(private val api: ApiService) {

    fun getPagedItems(): Flow<PagingState<Item>> = flow {
        var currentPage = 0
        var hasMore = true
        val items = mutableListOf<Item>()

        emit(PagingState.Loading(items.toList()))

        while (hasMore) {
            try {
                val response = api.getItems(page = currentPage)
                items.addAll(response.items)
                hasMore = response.hasNextPage
                currentPage++

                emit(PagingState.Success(
                    items = items.toList(),
                    hasMore = hasMore
                ))
            } catch (e: Exception) {
                emit(PagingState.Error(items.toList(), e.message))
                break
            }
        }
    }
}

sealed class PagingState<T> {
    abstract val items: List<T>

    data class Loading<T>(override val items: List<T>) : PagingState<T>()
    data class Success<T>(override val items: List<T>, val hasMore: Boolean) : PagingState<T>()
    data class Error<T>(override val items: List<T>, val message: String?) : PagingState<T>()
}
```

### 表单验证 Flow

```kotlin
class FormViewModel : ViewModel() {
    private val _email = MutableStateFlow("")
    private val _password = MutableStateFlow("")

    val email: StateFlow<String> = _email.asStateFlow()
    val password: StateFlow<String> = _password.asStateFlow()

    val emailError: StateFlow<String?> = _email
        .map { validateEmail(it) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(), null)

    val passwordError: StateFlow<String?> = _password
        .map { validatePassword(it) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(), null)

    val isFormValid: StateFlow<Boolean> = combine(
        emailError,
        passwordError
    ) { emailErr, passwordErr ->
        emailErr == null && passwordErr == null &&
        _email.value.isNotEmpty() && _password.value.isNotEmpty()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(), false)

    fun updateEmail(value: String) { _email.value = value }
    fun updatePassword(value: String) { _password.value = value }

    private fun validateEmail(email: String): String? {
        return when {
            email.isEmpty() -> null
            !email.contains("@") -> "Invalid email format"
            else -> null
        }
    }

    private fun validatePassword(password: String): String? {
        return when {
            password.isEmpty() -> null
            password.length < 8 -> "Password must be at least 8 characters"
            else -> null
        }
    }
}
```

### WebSocket 连接 Flow

```kotlin
class WebSocketRepository(private val client: OkHttpClient) {

    fun observeMessages(url: String): Flow<WebSocketMessage> = callbackFlow {
        val request = Request.Builder().url(url).build()

        val listener = object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                trySend(WebSocketMessage.Text(text))
            }

            override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                trySend(WebSocketMessage.Binary(bytes.toByteArray()))
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                close(t)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                close()
            }
        }

        val webSocket = client.newWebSocket(request, listener)

        awaitClose {
            webSocket.close(1000, "Flow cancelled")
        }
    }.retryWhen { cause, attempt ->
        if (attempt < 5) {
            delay(1000 * (attempt + 1))
            true
        } else {
            false
        }
    }
}

sealed class WebSocketMessage {
    data class Text(val content: String) : WebSocketMessage()
    data class Binary(val data: ByteArray) : WebSocketMessage()
}
```

## 最佳实践

### 优先使用 Flow 而非回调

```kotlin
// 避免：基于回调的 API
interface DataCallback {
    fun onData(data: Data)
    fun onError(error: Throwable)
}

fun fetchData(callback: DataCallback) { ... }

// 优先：基于 Flow 的 API
fun observeData(): Flow<Data> = callbackFlow {
    val callback = object : DataCallback {
        override fun onData(data: Data) { trySend(data) }
        override fun onError(error: Throwable) { close(error) }
    }
    registerCallback(callback)
    awaitClose { unregisterCallback(callback) }
}
```

### 对 UI 状态使用 StateFlow

```kotlin
class ViewModel {
    // 好：使用 StateFlow 的单一状态对象
    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun updateState(transform: (UiState) -> UiState) {
        _state.update(transform)
    }
}

// 在 UI 中安全收集
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.state.collect { state ->
            render(state)
        }
    }
}
```

### 对一次性事件使用 SharedFlow

```kotlin
class ViewModel {
    private val _events = MutableSharedFlow<UiEvent>()
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()

    suspend fun navigate(route: String) {
        _events.emit(UiEvent.Navigate(route))
    }
}
```

### 适当处理错误

```kotlin
fun observeData(): Flow<Result<Data>> = flow {
    emit(Result.Loading)
    try {
        val data = fetchData()
        emit(Result.Success(data))
    } catch (e: Exception) {
        emit(Result.Error(e))
    }
}

// 或使用 runCatching
fun observeData(): Flow<kotlin.Result<Data>> = flow {
    emit(runCatching { fetchData() })
}
```

### 正确取消 Flow

```kotlin
class MyActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 好：生命周期感知收集
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.data.collect { data ->
                    updateUI(data)
                }
            }
        }
    }
}
```

### 使用适当的操作符

```kotlin
// 对搜索输入使用 debounce
searchQuery
    .debounce(300)
    .flatMapLatest { query -> search(query) }

// 使用 distinctUntilChanged 避免冗余处理
stateFlow
    .map { it.selectedItem }
    .distinctUntilChanged()

// 对实时更新使用 conflate，只关心最新值
sensorData
    .conflate()
    .collect { updateDisplay(it) }
```

### 彻底测试 Flow

```kotlin
@Test
fun `search returns results after debounce`() = runTest {
    val viewModel = SearchViewModel(FakeRepository())

    viewModel.searchResults.test {
        assertEquals(SearchState.Empty, awaitItem())

        viewModel.onQueryChanged("kotlin")

        assertEquals(SearchState.Loading, awaitItem())
        assertEquals(SearchState.Success(expectedResults), awaitItem())

        cancelAndIgnoreRemainingEvents()
    }
}
```

### 文档化 Flow 行为

```kotlin
/**
 * 观察用户数据变化。
 *
 * 此流：
 * - 在收集时立即发射当前用户
 * - 每当用户数据变化时发射更新
 * - 当用户注销时完成
 * - 如果认证失败则抛出 [AuthException]
 *
 * 内部在 [Dispatchers.IO] 上运行。
 */
fun observeUser(): Flow<User>
```

## 总结

Kotlin Flow 提供了一个强大的、声明式的 API 来处理异步数据流：

- **Flow 构建器**（`flow`、`flowOf`、`channelFlow`）创建冷流
- **中间操作符**（`map`、`filter`、`transform`）转换数据而不消费
- **终端操作符**（`collect`、`toList`、`first`）消费和处理流
- **上下文操作符**（`flowOn`）控制执行上下文
- **异常处理**（`catch`、`retry`）优雅地管理错误
- **缓冲**（`buffer`、`conflate`、`collectLatest`）处理背压
- **组合操作符**（`zip`、`combine`、`merge`）处理多个流
- **StateFlow** 提供具有当前值访问的可观察状态
- **SharedFlow** 启用向多个订阅者广播事件

通过掌握 Flow，你可以构建响应式、高效且可维护的 Kotlin 应用程序，优雅地处理异步数据。
