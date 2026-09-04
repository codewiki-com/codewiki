---
title: Coroutines
description: Complete guide to Kotlin coroutines, suspend functions, coroutine scope and structured concurrency
track: kotlin
section: coroutines
difficulty: advanced
tags:
  - Kotlin
  - Coroutines
  - suspend
  - Concurrency
status: imported
origin: old/src/content/docs/kotlin/coroutines.zh.md
divergence: 0.222
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Kotlin
  subcategory: Concurrency
  order: 2
  lastUpdated: 2026-01-07
---

Kotlin 协程代表了我们编写异步代码方式的范式转变。它们使开发者能够以顺序、可读的方式编写非阻塞代码，同时保持异步编程的性能优势。本综合指南涵盖了从基本概念到高级模式的所有内容。

## 理解协程

### 什么是协程？

协程是轻量级的、可挂起的计算单元，可以在不阻塞底层线程的情况下暂停和恢复。与消耗大量系统资源的传统线程不同，你可以在有限的线程池上同时运行数千甚至数百万个协程。

可以将协程理解为协作式多任务处理：它们在挂起点自愿让出控制权，允许其他协程在同一线程上运行。

### 为什么使用协程？

传统的异步编程方法存在显著的缺点：

**回调**会导致深度嵌套的代码（回调地狱）：

```kotlin
// 回调地狱 - 难以阅读和维护
fetchUser(userId) { user ->
    fetchPosts(user.id) { posts ->
        fetchComments(posts[0].id) { comments ->
            updateUI(user, posts, comments)
        }
    }
}
```

**Futures/Promises** 提高了可读性，但仍需要链式调用：

```kotlin
// Promise 链式调用 - 更好但仍然复杂
fetchUser(userId)
    .thenCompose { user -> fetchPosts(user.id) }
    .thenCompose { posts -> fetchComments(posts[0].id) }
    .thenAccept { comments -> updateUI(comments) }
```

**协程**提供顺序的、看起来像同步的代码：

```kotlin
// 协程方式 - 简洁易读
suspend fun loadData(userId: String) {
    val user = fetchUser(userId)
    val posts = fetchPosts(user.id)
    val comments = fetchComments(posts[0].id)
    updateUI(user, posts, comments)
}
```

### 设置和依赖

在 `build.gradle.kts` 中添加协程依赖：

```kotlin
dependencies {
    // 核心协程库
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.0")

    // Android 特定（如需要）
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")

    // 测试
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
}
```

## 挂起函数

### 协程的基础

挂起函数是协程的构建块。`suspend` 关键字标记一个可以暂停和恢复的函数。当调用挂起函数时，它可以在不阻塞线程的情况下暂停执行。

```kotlin
suspend fun fetchUserData(userId: String): User {
    // 这个 delay 挂起协程，而不是线程
    delay(1000L)
    return User(userId, "John Doe", "john@example.com")
}
```

### 挂起如何工作

当挂起函数到达挂起点（如 `delay()` 或另一个挂起函数调用）时，协程会：

1. 保存当前状态（局部变量、执行点）
2. 将线程释放回线程池
3. 在挂起操作完成后恢复
4. 从停止的地方继续执行

```kotlin
suspend fun demonstrateSuspension() {
    println("挂起前 - 线程: ${Thread.currentThread().name}")
    delay(100) // 挂起点
    println("挂起后 - 线程: ${Thread.currentThread().name}")
    // 恢复后线程可能不同！
}
```

### 调用挂起函数

挂起函数只能从以下位置调用：
- 其他挂起函数
- 协程构建器（launch、async、runBlocking）

```kotlin
// 挂起函数调用另一个挂起函数
suspend fun getUserProfile(userId: String): UserProfile {
    val user = fetchUserData(userId)       // 挂起调用
    val preferences = fetchPreferences(userId) // 另一个挂起调用
    return UserProfile(user, preferences)
}

// 不能从普通函数调用 - 编译错误
fun regularFunction() {
    // fetchUserData("123") // 错误：挂起函数只能从协程中调用
}
```

### 顺序执行 vs 并发执行

默认情况下，挂起函数顺序执行：

```kotlin
suspend fun sequentialCalls(): Pair<User, List<Post>> {
    val startTime = System.currentTimeMillis()

    val user = fetchUser()  // 耗时 1000ms
    val posts = fetchPosts() // 耗时 1000ms

    val elapsed = System.currentTimeMillis() - startTime
    println("顺序执行耗时: $elapsed ms") // ~2000ms

    return Pair(user, posts)
}
```

对于并发执行，使用 `async`：

```kotlin
suspend fun concurrentCalls(): Pair<User, List<Post>> = coroutineScope {
    val startTime = System.currentTimeMillis()

    val userDeferred = async { fetchUser() }   // 立即开始
    val postsDeferred = async { fetchPosts() } // 立即开始

    val user = userDeferred.await()
    val posts = postsDeferred.await()

    val elapsed = System.currentTimeMillis() - startTime
    println("并发执行耗时: $elapsed ms") // ~1000ms

    Pair(user, posts)
}
```

## 协程构建器

协程构建器是创建和启动协程的函数。每个都有特定的用途。

### launch

`launch` 启动一个新协程并返回一个 `Job`。它用于不返回结果的即发即忘操作。

```kotlin
fun main() = runBlocking {
    println("主程序开始: ${Thread.currentThread().name}")

    val job = launch {
        println("协程开始: ${Thread.currentThread().name}")
        delay(1000)
        println("协程结束: ${Thread.currentThread().name}")
    }

    println("主程序继续...")
    job.join() // 等待协程完成
    println("主程序结束")
}
```

输出：
```
主程序开始: main
主程序继续...
协程开始: main
协程结束: main
主程序结束
```

### async

`async` 启动一个协程并返回一个 `Deferred<T>`，这是一个将持有结果的 future。使用 `await()` 获取结果。

```kotlin
suspend fun computeAnswer(): Int {
    delay(1000)
    return 42
}

suspend fun computeQuestion(): String {
    delay(1000)
    return "生命的意义是什么？"
}

fun main() = runBlocking {
    val answerDeferred = async { computeAnswer() }
    val questionDeferred = async { computeQuestion() }

    // 两个计算并发运行
    val answer = answerDeferred.await()
    val question = questionDeferred.await()

    println("$question -> $answer")
}
```

### 延迟启动的 Async

你可以延迟 async 协程的启动：

```kotlin
fun main() = runBlocking {
    val deferred = async(start = CoroutineStart.LAZY) {
        println("计算中...")
        delay(1000)
        42
    }

    println("Async 已创建但未启动")
    delay(500)

    println("启动 async...")
    deferred.start() // 显式启动

    println("结果: ${deferred.await()}")
}
```

### runBlocking

`runBlocking` 连接阻塞和非阻塞代码。它阻塞当前线程直到内部所有协程完成。

```kotlin
fun main() = runBlocking {
    // 这会阻塞主线程直到所有内容完成
    launch {
        delay(1000)
        println("World!")
    }
    println("Hello,")
}
```

**重要**：仅在以下情况使用 `runBlocking`：
- main 函数
- 测试
- 从阻塞 API 桥接（谨慎使用）

永远不要在其他协程内部使用它——这会破坏其目的。

### withContext

`withContext` 切换协程上下文并等待代码块完成。它通常用于切换调度器。

```kotlin
suspend fun fetchDataFromNetwork(): String = withContext(Dispatchers.IO) {
    // 在 IO 调度器上运行
    URL("https://api.example.com/data").readText()
}

suspend fun processData(data: String): Result = withContext(Dispatchers.Default) {
    // 在 Default 调度器上运行（CPU 密集型）
    parseAndProcess(data)
}

suspend fun updateUI(result: Result) = withContext(Dispatchers.Main) {
    // 在 Main 调度器上运行（UI 线程）
    displayResult(result)
}
```

### coroutineScope

`coroutineScope` 创建一个新作用域并挂起直到所有子协程完成。它会传播异常。

```kotlin
suspend fun loadUserWithPosts(userId: String): UserWithPosts = coroutineScope {
    val user = async { fetchUser(userId) }
    val posts = async { fetchPosts(userId) }

    UserWithPosts(user.await(), posts.await())
}
```

### supervisorScope

类似于 `coroutineScope`，但子协程失败不会取消兄弟协程或父协程。

```kotlin
suspend fun fetchMultipleResources() = supervisorScope {
    val resource1 = async {
        delay(100)
        throw Exception("资源 1 失败")
    }

    val resource2 = async {
        delay(200)
        "资源 2 数据"
    }

    // resource1 的失败不会取消 resource2
    val result1 = runCatching { resource1.await() }
    val result2 = resource2.await()

    println("资源 1: $result1")
    println("资源 2: $result2")
}
```

## 协程上下文和调度器

### CoroutineContext

每个协程都有一个关联的上下文，包含各种元素：

```kotlin
fun main() = runBlocking {
    println("上下文: $coroutineContext")
    println("Job: ${coroutineContext[Job]}")
    println("调度器: ${coroutineContext[ContinuationInterceptor]}")

    launch(CoroutineName("MyCoroutine") + Dispatchers.Default) {
        println("命名协程: ${coroutineContext[CoroutineName]}")
    }
}
```

### 上下文元素

常见的上下文元素包括：

- **Job**：控制生命周期和取消
- **CoroutineDispatcher**：决定执行线程
- **CoroutineName**：协程的调试名称
- **CoroutineExceptionHandler**：处理未捕获的异常

```kotlin
val customContext = Job() +
                    Dispatchers.Default +
                    CoroutineName("CustomCoroutine") +
                    CoroutineExceptionHandler { _, e ->
                        println("捕获: $e")
                    }

launch(customContext) {
    // 使用所有上下文元素
}
```

### 调度器

调度器决定哪个线程或线程池执行协程。

#### Dispatchers.Default

针对 CPU 密集型工作优化。使用大小与 CPU 核心数相同的共享线程池。

```kotlin
launch(Dispatchers.Default) {
    // 排序、解析、复杂计算
    val sorted = hugeList.sorted()
    val parsed = parseComplexJson(data)
}
```

#### Dispatchers.IO

针对 I/O 操作优化。使用可按需增长的较大线程池。

```kotlin
launch(Dispatchers.IO) {
    // 文件操作、网络调用、数据库查询
    val content = File("data.txt").readText()
    val response = httpClient.get("https://api.example.com")
    val users = database.query("SELECT * FROM users")
}
```

#### Dispatchers.Main

限制在主线程/UI 线程。在 Android 和其他 UI 框架上可用。

```kotlin
launch(Dispatchers.Main) {
    // 仅 UI 更新
    textView.text = "已更新！"
    progressBar.visibility = View.GONE
}
```

#### Dispatchers.Unconfined

在调用者的线程中启动，但可能在不同的线程中恢复。谨慎使用。

```kotlin
launch(Dispatchers.Unconfined) {
    println("启动于: ${Thread.currentThread().name}")
    delay(100)
    println("恢复于: ${Thread.currentThread().name}") // 可能不同！
}
```

#### 自定义调度器

创建有限并行度的调度器以控制资源：

```kotlin
// 限制并发数据库连接
val databaseDispatcher = Dispatchers.IO.limitedParallelism(4)

// 单线程用于非线程安全操作
val singleThreadDispatcher = Dispatchers.Default.limitedParallelism(1)

// 从 executor service 创建
val customDispatcher = Executors.newFixedThreadPool(10).asCoroutineDispatcher()
```

## 结构化并发

结构化并发是一种设计范式，确保协程在定义的作用域内被正确管理，防止泄漏并确保正确清理。

### 核心原则

1. **每个协程都有一个作用域**：协程在 `CoroutineScope` 内启动
2. **父子关系**：子协程从父协程继承上下文
3. **取消传播**：取消父协程会取消所有子协程
4. **父协程等待子协程**：作用域只有在所有子协程完成后才完成

```kotlin
suspend fun demonstrateStructuredConcurrency() = coroutineScope {
    launch {
        delay(1000)
        println("子协程 1 完成")
    }

    launch {
        delay(500)
        println("子协程 2 完成")
    }

    println("父协程等待子协程...")
    // 自动等待两个子协程
}
// 在此函数返回之前，两个子协程都保证完成
```

### 创建自定义作用域

对于管理协程的类，实现 `CoroutineScope`：

```kotlin
class NetworkService : CoroutineScope {
    private val job = SupervisorJob()
    override val coroutineContext: CoroutineContext
        get() = Dispatchers.IO + job + CoroutineName("NetworkService")

    fun fetchData(url: String) {
        launch {
            val data = httpClient.get(url)
            processData(data)
        }
    }

    fun close() {
        job.cancel() // 取消此作用域中的所有协程
    }
}
```

### Android ViewModel 示例

```kotlin
class UserViewModel : ViewModel() {
    // viewModelScope 在 ViewModel 清除时自动取消

    private val _users = MutableStateFlow<List<User>>(emptyList())
    val users: StateFlow<List<User>> = _users.asStateFlow()

    fun loadUsers() {
        viewModelScope.launch {
            try {
                val result = repository.fetchUsers()
                _users.value = result
            } catch (e: Exception) {
                // 处理错误
            }
        }
    }
}
```

### 作用域函数比较

| 函数 | 创建作用域 | 等待子协程 | 异常行为 |
|----------|--------------|-------------------|-------------------|
| `coroutineScope` | 是 | 是 | 传播给父协程 |
| `supervisorScope` | 是 | 是 | 不从子协程传播 |
| `withContext` | 否（使用现有的） | 是 | 传播给父协程 |
| `launch` | 否（使用父协程的） | 父协程等待 | 根据 Job 类型传播 |
| `async` | 否（使用父协程的） | 父协程等待 | 通过 await() 暴露 |

## Job 和生命周期管理

### Job 层次结构

Job 形成父子层次结构，实现结构化并发：

```kotlin
fun main() = runBlocking {
    val parentJob = launch {
        val child1 = launch {
            delay(1000)
            println("子协程 1 完成")
        }

        val child2 = launch {
            delay(500)
            println("子协程 2 完成")
        }

        println("父协程有 ${coroutineContext[Job]?.children?.count()} 个子协程")
    }

    parentJob.join()
}
```

### Job 状态

Job 经历以下状态：

```
New -> Active -> Completing -> Completed
         |            |
         v            v
      Cancelling -> Cancelled
```

```kotlin
fun main() = runBlocking {
    val job = launch(start = CoroutineStart.LAZY) {
        delay(1000)
    }

    println("已创建: isActive=${job.isActive}, isCompleted=${job.isCompleted}")

    job.start()
    println("已启动: isActive=${job.isActive}, isCompleted=${job.isCompleted}")

    job.join()
    println("已完成: isActive=${job.isActive}, isCompleted=${job.isCompleted}")
}
```

### 取消

取消是协作式的——协程必须检查它：

```kotlin
suspend fun cancellableWork() = coroutineScope {
    val job = launch {
        repeat(1000) { i ->
            // 检查取消
            if (!isActive) {
                println("在迭代 $i 处取消")
                return@launch
            }

            println("工作中: $i")
            delay(100) // 也检查取消
        }
    }

    delay(350)
    println("取消中...")
    job.cancelAndJoin()
    println("已取消")
}
```

### 使代码可取消

使用这些函数检查取消：

```kotlin
suspend fun processItems(items: List<Item>) {
    for (item in items) {
        // 选项 1：检查 isActive
        if (!coroutineContext.isActive) break

        // 选项 2：使用 ensureActive() - 如果取消则抛出异常
        ensureActive()

        // 选项 3：使用 yield() - 挂起并检查
        yield()

        processItem(item)
    }
}
```

### NonCancellable 上下文

对于即使取消也必须运行的清理代码：

```kotlin
suspend fun performWithCleanup() {
    try {
        while (true) {
            doWork()
            delay(100)
        }
    } finally {
        // 即使取消也必须完成此清理
        withContext(NonCancellable) {
            println("清理中...")
            delay(500) // 因为 NonCancellable 所以允许
            releaseResources()
            println("清理完成")
        }
    }
}
```

### 带超时的取消

```kotlin
suspend fun fetchWithTimeout() {
    try {
        withTimeout(3000) {
            val result = longRunningOperation()
            println("结果: $result")
        }
    } catch (e: TimeoutCancellationException) {
        println("操作超时")
    }
}

// 或使用 withTimeoutOrNull 返回 null 而不是抛出异常
suspend fun fetchWithTimeoutOrNull(): String? {
    return withTimeoutOrNull(3000) {
        longRunningOperation()
    }
}
```

## 异常处理

### 异常传播

协程中的异常根据构建器的不同而有不同的传播方式：

```kotlin
fun main() = runBlocking {
    // launch：异常传播给父协程
    val job = launch {
        throw Exception("在 launch 中失败")
    }

    // async：异常被存储，在 await() 时抛出
    val deferred = async {
        throw Exception("在 async 中失败")
    }

    try {
        deferred.await()
    } catch (e: Exception) {
        println("从 async 捕获: ${e.message}")
    }
}
```

### CoroutineExceptionHandler

在作用域级别处理未捕获的异常：

```kotlin
val handler = CoroutineExceptionHandler { context, exception ->
    println("在处理器中捕获: ${exception.message}")
    println("协程: ${context[CoroutineName]}")
}

fun main() = runBlocking {
    val scope = CoroutineScope(SupervisorJob() + handler)

    scope.launch(CoroutineName("FailingCoroutine")) {
        throw RuntimeException("出错了")
    }

    delay(100)
    println("主程序继续")
}
```

**注意**：`CoroutineExceptionHandler` 仅适用于：
- `launch`（不是 `async`）
- 根协程（不是其他协程的子协程）

### SupervisorJob

`SupervisorJob` 防止子协程失败取消兄弟协程：

```kotlin
fun main() = runBlocking {
    val supervisor = SupervisorJob()
    val scope = CoroutineScope(coroutineContext + supervisor)

    val child1 = scope.launch {
        delay(100)
        throw Exception("子协程 1 失败")
    }

    val child2 = scope.launch {
        delay(200)
        println("子协程 2 成功完成")
    }

    // 等待两者完成或失败
    joinAll(child1, child2)
    println("Supervisor 作用域完成")
}
```

### 协程中的 Try-Catch

标准的 try-catch 在协程内工作：

```kotlin
suspend fun safeOperation(): Result<Data> {
    return try {
        val data = riskyNetworkCall()
        Result.success(data)
    } catch (e: IOException) {
        Result.failure(e)
    } catch (e: HttpException) {
        Result.failure(e)
    }
}
```

### 异常处理最佳实践

```kotlin
class DataRepository(
    private val api: ApiService,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    suspend fun fetchData(): Result<Data> = withContext(dispatcher) {
        runCatching {
            api.getData()
        }.onFailure { e ->
            when (e) {
                is CancellationException -> throw e // 重新抛出取消
                is IOException -> logNetworkError(e)
                else -> logUnexpectedError(e)
            }
        }
    }
}
```

## 通道

通道为协程提供了一种通过发送和接收值进行通信的方式。它们类似于阻塞队列，但具有挂起操作。

### 基本通道用法

```kotlin
fun main() = runBlocking {
    val channel = Channel<Int>()

    // 生产者
    launch {
        for (x in 1..5) {
            println("发送 $x")
            channel.send(x)
        }
        channel.close()
    }

    // 消费者
    for (value in channel) {
        println("接收 $value")
    }
}
```

### 通道类型

#### 会合通道（默认）

无缓冲——发送者挂起直到接收者准备好：

```kotlin
val rendezvousChannel = Channel<Int>() // 容量 = 0
```

#### 缓冲通道

具有固定的缓冲区大小：

```kotlin
val bufferedChannel = Channel<Int>(capacity = 10)
```

#### 合并通道

只保留最新的值：

```kotlin
val conflatedChannel = Channel<Int>(Channel.CONFLATED)

launch {
    conflatedChannel.send(1)
    conflatedChannel.send(2)
    conflatedChannel.send(3) // 只保留这个
}

delay(100)
println(conflatedChannel.receive()) // 输出: 3
```

#### 无限通道

无界缓冲（谨慎使用）：

```kotlin
val unlimitedChannel = Channel<Int>(Channel.UNLIMITED)
```

### 生产者-消费者模式

```kotlin
fun CoroutineScope.produceNumbers(): ReceiveChannel<Int> = produce {
    var x = 1
    while (true) {
        send(x++)
        delay(100)
    }
}

fun main() = runBlocking {
    val numbers = produceNumbers()

    repeat(5) {
        println(numbers.receive())
    }

    numbers.cancel() // 取消生产者
}
```

### 扇出和扇入

#### 扇出（多个消费者）

```kotlin
fun main() = runBlocking {
    val channel = Channel<Int>()

    // 生产者
    launch {
        repeat(10) {
            channel.send(it)
            delay(50)
        }
        channel.close()
    }

    // 多个消费者（扇出）
    repeat(3) { consumerId ->
        launch {
            for (value in channel) {
                println("消费者 $consumerId 接收 $value")
            }
        }
    }
}
```

#### 扇入（多个生产者）

```kotlin
fun main() = runBlocking {
    val channel = Channel<String>()

    // 多个生产者（扇入）
    launch { sendStrings(channel, "A", 200) }
    launch { sendStrings(channel, "B", 300) }

    repeat(10) {
        println(channel.receive())
    }

    coroutineContext.cancelChildren()
}

suspend fun sendStrings(channel: SendChannel<String>, prefix: String, delay: Long) {
    var count = 0
    while (true) {
        channel.send("$prefix${count++}")
        delay(delay)
    }
}
```

### Select 表达式

在多个通道操作之间选择：

```kotlin
suspend fun selectExample() = coroutineScope {
    val channel1 = Channel<String>()
    val channel2 = Channel<String>()

    launch {
        delay(100)
        channel1.send("来自通道 1")
    }

    launch {
        delay(50)
        channel2.send("来自通道 2")
    }

    val result = select<String> {
        channel1.onReceive { it }
        channel2.onReceive { it }
    }

    println("首先接收: $result") // "来自通道 2"
}
```

## Flow

Flow 是一个冷异步流，按顺序发射值。与通道不同，流是冷的——它们在被收集之前不会产生值。

### 创建 Flow

```kotlin
// flow 构建器
fun numberFlow(): Flow<Int> = flow {
    for (i in 1..5) {
        delay(100)
        emit(i)
    }
}

// flowOf - 从值创建
val simpleFlow = flowOf(1, 2, 3, 4, 5)

// asFlow - 从集合/序列创建
val listFlow = listOf(1, 2, 3).asFlow()
val rangeFlow = (1..10).asFlow()
```

### 收集 Flow

```kotlin
fun main() = runBlocking {
    numberFlow().collect { value ->
        println("接收: $value")
    }
}
```

### Flow 操作符

#### 中间操作符

转换流而不消费它：

```kotlin
fun main() = runBlocking {
    (1..10).asFlow()
        .filter { it % 2 == 0 }      // 2, 4, 6, 8, 10
        .map { it * it }              // 4, 16, 36, 64, 100
        .take(3)                      // 4, 16, 36
        .collect { println(it) }
}
```

常见的中间操作符：

```kotlin
flow
    .map { transform(it) }           // 转换每个值
    .filter { condition(it) }        // 过滤值
    .take(n)                         // 取前 n 个值
    .drop(n)                         // 跳过前 n 个值
    .transform { emit(process(it)) } // 自定义转换
    .onEach { sideEffect(it) }       // 对每个值执行操作
    .distinctUntilChanged()          // 跳过连续重复
```

#### 终端操作符

消费流并产生结果：

```kotlin
val flow = flowOf(1, 2, 3, 4, 5)

val list = flow.toList()              // [1, 2, 3, 4, 5]
val sum = flow.reduce { a, b -> a + b } // 15
val first = flow.first()              // 1
val count = flow.count()              // 5
val single = flowOf(1).single()       // 1（如果不是恰好一个则抛出异常）
```

### Flow 上下文

Flow 保持上下文并对调用者透明：

```kotlin
fun dataFlow(): Flow<Int> = flow {
    // 这将在收集它的任何调度器上运行
    println("Flow 在: ${Thread.currentThread().name}")
    emit(1)
}

fun main() = runBlocking {
    dataFlow()
        .flowOn(Dispatchers.IO) // 改变上游上下文
        .collect { value ->
            println("收集在: ${Thread.currentThread().name}")
        }
}
```

**重要**：`flowOn` 仅改变上游操作的上下文：

```kotlin
flow {
    emit(1) // 在 IO 上运行
}
.map { it * 2 } // 在 IO 上运行
.flowOn(Dispatchers.IO)
.filter { it > 0 } // 在 Default 上运行
.flowOn(Dispatchers.Default)
.collect { } // 在调用者的上下文中运行
```

### Flow 中的异常处理

```kotlin
fun riskyFlow(): Flow<Int> = flow {
    emit(1)
    emit(2)
    throw RuntimeException("Flow 失败")
}

fun main() = runBlocking {
    riskyFlow()
        .catch { e ->
            println("捕获: ${e.message}")
            emit(-1) // 发射回退值
        }
        .collect { println(it) }
}
```

### Flow 完成

```kotlin
fun main() = runBlocking {
    flowOf(1, 2, 3)
        .onStart { println("开始 flow") }
        .onEach { println("发射: $it") }
        .onCompletion { cause ->
            if (cause != null) {
                println("带错误完成: $cause")
            } else {
                println("成功完成")
            }
        }
        .collect { println("收集: $it") }
}
```

### 组合 Flow

```kotlin
fun main() = runBlocking {
    val nums = flowOf(1, 2, 3)
    val strs = flowOf("one", "two", "three")

    // zip - 配对对应元素
    nums.zip(strs) { n, s -> "$n -> $s" }
        .collect { println(it) }
    // 输出: 1 -> one, 2 -> two, 3 -> three

    // combine - 每个流的最新值
    val flow1 = flow {
        emit(1); delay(100)
        emit(2); delay(100)
    }
    val flow2 = flow {
        emit("A"); delay(150)
        emit("B")
    }

    flow1.combine(flow2) { n, s -> "$n$s" }
        .collect { println(it) }
    // 每当任一流发射时，使用最新值发射
}
```

### 扁平化 Flow

```kotlin
fun main() = runBlocking {
    val flow = flowOf(1, 2, 3)

    // flatMapConcat - 顺序处理
    flow.flatMapConcat { value ->
        flow {
            emit("$value-A")
            delay(100)
            emit("$value-B")
        }
    }.collect { println(it) }
    // 1-A, 1-B, 2-A, 2-B, 3-A, 3-B

    // flatMapMerge - 并发处理
    flow.flatMapMerge(concurrency = 2) { value ->
        flow {
            delay(100)
            emit(value * 2)
        }
    }.collect { println(it) }

    // flatMapLatest - 新发射时取消之前的
    flow.flatMapLatest { value ->
        flow {
            delay(100)
            emit(value)
        }
    }.collect { println(it) }
}
```

### Buffer 和 Conflate

```kotlin
// Buffer - 并发运行收集器和发射器
flow {
    repeat(5) {
        delay(100) // 每 100ms 发射
        emit(it)
    }
}
.buffer() // 不等待收集器
.collect {
    delay(200) // 慢速处理
    println(it)
}

// Conflate - 跳过中间值
flow {
    repeat(5) {
        delay(100)
        emit(it)
    }
}
.conflate() // 只保留最新未处理的
.collect {
    delay(200)
    println(it) // 跳过一些值
}
```

## StateFlow 和 SharedFlow

StateFlow 和 SharedFlow 是用于共享状态和事件的热流。

### StateFlow

StateFlow 始终有一个当前值并向收集器发射更新：

```kotlin
class CounterViewModel {
    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count.asStateFlow()

    fun increment() {
        _count.update { it + 1 } // 线程安全更新
    }

    fun decrement() {
        _count.update { it - 1 }
    }

    fun reset() {
        _count.value = 0
    }
}

fun main() = runBlocking {
    val viewModel = CounterViewModel()

    // 收集器
    val job = launch {
        viewModel.count.collect { value ->
            println("计数: $value")
        }
    }

    viewModel.increment() // 计数: 1
    viewModel.increment() // 计数: 2
    viewModel.decrement() // 计数: 1

    delay(100)
    job.cancel()
}
```

### StateFlow 特性

- 始终有一个值（需要初始值）
- 仅在值实际改变时发射（相等性检查）
- 合并发射（收集器只看到最新的）
- 线程安全
- 重放 1（新收集器获取当前值）

```kotlin
// StateFlow 仅在改变时发射
val stateFlow = MutableStateFlow(1)

launch {
    stateFlow.collect { println("接收: $it") }
}

stateFlow.value = 1 // 不发射（相同值）
stateFlow.value = 2 // 发射 2
stateFlow.value = 2 // 不发射（相同值）
```

### SharedFlow

SharedFlow 更可配置，不需要初始值：

```kotlin
class EventBus {
    private val _events = MutableSharedFlow<Event>()
    val events: SharedFlow<Event> = _events.asSharedFlow()

    suspend fun emit(event: Event) {
        _events.emit(event)
    }
}

fun main() = runBlocking {
    val eventBus = EventBus()

    // 多个收集器
    launch {
        eventBus.events.collect { println("收集器 1: $it") }
    }

    launch {
        eventBus.events.collect { println("收集器 2: $it") }
    }

    delay(50)
    eventBus.emit(Event("UserLoggedIn"))
    eventBus.emit(Event("DataLoaded"))

    delay(100)
}
```

### SharedFlow 配置

```kotlin
val sharedFlow = MutableSharedFlow<Event>(
    replay = 1,                          // 重放给新收集器的值数量
    extraBufferCapacity = 10,            // 挂起前的额外缓冲
    onBufferOverflow = BufferOverflow.DROP_OLDEST  // 满时的策略
)

// 缓冲区溢出策略：
// - SUSPEND：挂起发射器直到有空间
// - DROP_OLDEST：丢弃缓冲区中最旧的值
// - DROP_LATEST：丢弃正在发射的值
```

### StateFlow vs SharedFlow

| 特性 | StateFlow | SharedFlow |
|---------|-----------|------------|
| 初始值 | 必需 | 可选 |
| 当前值 | `value` 属性 | 无 |
| 相等性检查 | 过滤重复 | 发射所有 |
| 重放 | 始终为 1 | 可配置 |
| 用例 | 状态 | 事件 |

```kotlin
class UserViewModel {
    // StateFlow 用于状态
    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()

    // SharedFlow 用于一次性事件
    private val _messages = MutableSharedFlow<String>()
    val messages: SharedFlow<String> = _messages.asSharedFlow()

    suspend fun login(credentials: Credentials) {
        try {
            val user = authService.login(credentials)
            _user.value = user
            _messages.emit("登录成功！")
        } catch (e: Exception) {
            _messages.emit("登录失败: ${e.message}")
        }
    }
}
```

### Flow 之间的转换

```kotlin
// 冷 Flow 转 StateFlow
val coldFlow: Flow<Int> = flow {
    emit(1)
    delay(100)
    emit(2)
}

val stateFlow: StateFlow<Int> = coldFlow.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = 0
)

// 冷 Flow 转 SharedFlow
val sharedFlow: SharedFlow<Int> = coldFlow.shareIn(
    scope = viewModelScope,
    started = SharingStarted.Lazily,
    replay = 1
)
```

## 高级模式

### 带指数退避的重试

```kotlin
fun <T> Flow<T>.retryWithExponentialBackoff(
    maxAttempts: Int = 3,
    initialDelay: Long = 100,
    maxDelay: Long = 10000,
    factor: Double = 2.0
): Flow<T> = retryWhen { cause, attempt ->
    if (attempt < maxAttempts && cause is IOException) {
        val delayTime = (initialDelay * factor.pow(attempt.toDouble()))
            .toLong()
            .coerceAtMost(maxDelay)
        delay(delayTime)
        true
    } else {
        false
    }
}

// 用法
fetchDataFlow()
    .retryWithExponentialBackoff()
    .collect { data -> process(data) }
```

### 防抖和节流

```kotlin
// Debounce - 在静默期后发射
fun searchFlow(query: StateFlow<String>): Flow<SearchResult> =
    query
        .debounce(300) // 在最后一次发射后等待 300ms
        .filter { it.isNotBlank() }
        .distinctUntilChanged()
        .flatMapLatest { searchQuery ->
            flow { emit(searchApi.search(searchQuery)) }
        }

// Throttle/Sample - 以固定间隔发射
fun sensorFlow(): Flow<SensorData> = flow {
    while (true) {
        emit(readSensor())
        delay(10) // 快速发射
    }
}.sample(100) // 每 100ms 只发射一次
```

### 并行处理

```kotlin
suspend fun <T, R> Iterable<T>.parallelMap(
    dispatcher: CoroutineDispatcher = Dispatchers.Default,
    transform: suspend (T) -> R
): List<R> = coroutineScope {
    map { item ->
        async(dispatcher) {
            transform(item)
        }
    }.awaitAll()
}

// 用法
val urls = listOf("url1", "url2", "url3")
val results = urls.parallelMap { url ->
    fetchData(url)
}
```

### 资源管理

```kotlin
suspend fun <T : Closeable, R> T.useWithSuspend(block: suspend (T) -> R): R {
    var exception: Throwable? = null
    try {
        return block(this)
    } catch (e: Throwable) {
        exception = e
        throw e
    } finally {
        withContext(NonCancellable) {
            try {
                close()
            } catch (closeException: Throwable) {
                exception?.addSuppressed(closeException)
            }
        }
    }
}

// 用法
FileInputStream("data.txt").useWithSuspend { stream ->
    // 带挂起点读取
    delay(100)
    processStream(stream)
}
```

### 速率限制

```kotlin
class RateLimiter(
    private val permits: Int,
    private val period: Duration
) {
    private val semaphore = Semaphore(permits)

    suspend fun <T> execute(block: suspend () -> T): T {
        semaphore.acquire()
        return try {
            block()
        } finally {
            CoroutineScope(Dispatchers.Default).launch {
                delay(period)
                semaphore.release()
            }
        }
    }
}

// 用法
val rateLimiter = RateLimiter(permits = 10, period = 1.seconds)

suspend fun makeApiCall() {
    rateLimiter.execute {
        api.call()
    }
}
```

## 协程测试

### 测试设置

```kotlin
dependencies {
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
}
```

### runTest

使用 `runTest` 测试挂起函数：

```kotlin
class UserRepositoryTest {
    private val testDispatcher = StandardTestDispatcher()

    @Test
    fun `fetchUser returns user data`() = runTest {
        val repository = UserRepository(testDispatcher)

        val user = repository.fetchUser("123")

        assertEquals("John", user.name)
    }
}
```

### 测试延迟

```kotlin
@Test
fun `debounced search waits for input to settle`() = runTest {
    val viewModel = SearchViewModel()
    val results = mutableListOf<String>()

    val job = launch {
        viewModel.searchResults.collect { results.add(it) }
    }

    viewModel.onSearchQueryChanged("kot")
    advanceTimeBy(100)
    viewModel.onSearchQueryChanged("kotl")
    advanceTimeBy(100)
    viewModel.onSearchQueryChanged("kotlin")
    advanceTimeBy(500) // 防抖超时

    assertEquals(1, results.size)
    assertEquals("kotlin", viewModel.lastQuery)

    job.cancel()
}
```

### 测试 Flow

```kotlin
@Test
fun `flow emits correct sequence`() = runTest {
    val flow = numberFlow()

    val emissions = flow.toList()

    assertEquals(listOf(1, 2, 3, 4, 5), emissions)
}

@Test
fun `stateFlow updates correctly`() = runTest {
    val viewModel = CounterViewModel()

    assertEquals(0, viewModel.count.value)

    viewModel.increment()
    assertEquals(1, viewModel.count.value)

    viewModel.increment()
    assertEquals(2, viewModel.count.value)
}
```

### 使用 Turbine 测试 Flow

```kotlin
// 添加依赖: testImplementation("app.cash.turbine:turbine:1.0.0")

@Test
fun `user flow emits loading then data`() = runTest {
    val viewModel = UserViewModel()

    viewModel.userState.test {
        assertEquals(UiState.Loading, awaitItem())

        viewModel.loadUser("123")

        val dataState = awaitItem()
        assertTrue(dataState is UiState.Success)
        assertEquals("John", (dataState as UiState.Success).user.name)

        cancelAndConsumeRemainingEvents()
    }
}
```

## 最佳实践

### 优先使用结构化并发

始终在适当的作用域内启动协程：

```kotlin
// 不好 - GlobalScope 会泄漏且无法取消
GlobalScope.launch {
    doWork()
}

// 好 - 作用域绑定到生命周期
class MyService(private val scope: CoroutineScope) {
    fun doWork() {
        scope.launch {
            // 当作用域取消时自动取消
        }
    }
}
```

### 使用适当的调度器

```kotlin
class Repository(
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    suspend fun fetchData(): Data = withContext(ioDispatcher) {
        // IO 操作
    }

    suspend fun processData(data: Data): Result = withContext(Dispatchers.Default) {
        // CPU 密集型工作
    }
}
```

### 处理取消

```kotlin
suspend fun processLargeDataset(items: List<Item>) {
    for (item in items) {
        ensureActive() // 检查取消
        process(item)
    }
}
```

### 避免捕获 CancellationException

```kotlin
suspend fun safeOperation() {
    try {
        riskyOperation()
    } catch (e: CancellationException) {
        throw e // 始终重新抛出！
    } catch (e: Exception) {
        handleError(e)
    }
}

// 或谨慎使用 runCatching
suspend fun saferOperation() = runCatching {
    riskyOperation()
}.onFailure { e ->
    if (e is CancellationException) throw e
    handleError(e)
}
```

### 为测试注入调度器

```kotlin
class UserRepository(
    private val api: UserApi,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    suspend fun getUser(id: String): User = withContext(dispatcher) {
        api.fetchUser(id)
    }
}

// 在测试中
@Test
fun test() = runTest {
    val repository = UserRepository(mockApi, StandardTestDispatcher())
    // 测试同步运行
}
```

### 使用 StateFlow 表示可观察状态

```kotlin
class ViewModel {
    private val _state = MutableStateFlow<UiState>(UiState.Initial)
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun loadData() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            try {
                val data = repository.fetchData()
                _state.value = UiState.Success(data)
            } catch (e: Exception) {
                _state.value = UiState.Error(e.message)
            }
        }
    }
}
```

### 使用 SharedFlow 表示事件

```kotlin
class ViewModel {
    private val _events = MutableSharedFlow<UiEvent>()
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()

    fun onButtonClicked() {
        viewModelScope.launch {
            _events.emit(UiEvent.NavigateToDetail)
        }
    }
}
```

### 优先使用 Flow 而非 Channel

```kotlin
// 优先使用
fun observeData(): Flow<Data> = flow {
    while (true) {
        emit(fetchData())
        delay(refreshInterval)
    }
}

// 除非需要多个生产者
fun fanInExample() = channelFlow {
    launch { sendDataFrom(source1) }
    launch { sendDataFrom(source2) }
}
```

## 总结

Kotlin 协程提供了一种强大、高效的方式来处理异步编程：

- **挂起函数**是基础，实现非阻塞代码
- **协程构建器**（`launch`、`async`、`runBlocking`）创建和管理协程
- **结构化并发**确保正确的生命周期管理
- **调度器**控制执行线程
- **通道**实现协程之间的通信
- **Flow** 提供冷异步流
- **StateFlow 和 SharedFlow** 为状态和事件提供热流

通过遵循最佳实践并理解这些概念，你可以编写简洁、高效且可维护的异步 Kotlin 代码。
