---
title: Kotlin 协程基础入门
description: 深入浅出讲解Kotlin协程核心概念，涵盖suspend函数、launch、async、runBlocking与coroutineScope
track: kotlin
section: coroutines
difficulty: intermediate
tags:
  - Kotlin
  - 协程
  - suspend
  - async
  - 并发入门
status: imported
origin: old/src/content/docs/kotlin/coroutine-basics.zh.md
divergence: 0.309
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Kotlin
  subcategory: 并发
  order: 1
  lastUpdated: 2026-01-07
---

协程（Coroutine）是 Kotlin 中处理异步编程的现代化方案，它让异步代码像同步代码一样简洁易读。本文将从零开始，带你掌握协程的五大核心概念：`suspend` 函数、`launch`、`async`、`runBlocking` 和 `coroutineScope`。

## 概念解释

### 什么是协程

协程是一种轻量级的"线程"，但它并不是真正的线程。协程可以在执行过程中**挂起**（暂停），稍后再**恢复**执行，而且这个过程不会阻塞底层线程。

想象一下餐厅服务员的工作方式：

- **线程模式**：一个服务员只服务一桌客人，客人点餐时服务员站在旁边等待，直到客人点完才能去服务下一桌。
- **协程模式**：一个服务员同时服务多桌客人，客人 A 在看菜单时，服务员可以先去服务客人 B，等客人 A 准备好了再回来。

这就是协程的核心思想：**在等待时释放资源，让其他任务得以执行**。

### 协程解决什么问题

在传统的异步编程中，我们常常面临以下困境：

**1. 回调地狱（Callback Hell）**

```kotlin
// 回调方式：代码嵌套层层深入，难以阅读和维护
fetchUser(userId) { user ->
    fetchPosts(user.id) { posts ->
        fetchComments(posts[0].id) { comments ->
            updateUI(user, posts, comments)
        }
    }
}
```

**2. 线程管理复杂**

```kotlin
// 传统线程方式：需要手动管理线程切换
Thread {
    val data = fetchDataFromNetwork() // 网络请求
    runOnUiThread {
        updateUI(data) // 切回主线程更新UI
    }
}.start()
```

**协程的解决方案**

```kotlin
// 协程方式：代码顺序执行，清晰易懂
suspend fun loadData() {
    val user = fetchUser(userId)         // 挂起，等待结果
    val posts = fetchPosts(user.id)      // 挂起，等待结果
    val comments = fetchComments(posts[0].id)
    updateUI(user, posts, comments)      // 自动切回主线程
}
```

### 协程 vs 线程

| 特性 | 线程 | 协程 |
|------|------|------|
| 创建成本 | 高（约 1MB 栈空间） | 极低（约几KB） |
| 数量限制 | 受系统资源限制（通常几千个） | 可创建数十万个 |
| 切换方式 | 由操作系统调度，开销大 | 由程序控制，开销极小 |
| 阻塞行为 | 阻塞线程 | 挂起但不阻塞线程 |
| 编程模型 | 复杂（需处理同步问题） | 简单（顺序代码风格） |

## 核心原理

### 挂起与恢复机制

协程的核心机制是**挂起（Suspend）**和**恢复（Resume）**：

1. **挂起**：当协程遇到耗时操作（如网络请求）时，它会"挂起"自己，释放当前线程
2. **恢复**：当耗时操作完成后，协程会在某个线程上"恢复"执行

```
线程 A: [协程1开始] -> [协程1挂起] -----> [协程1恢复] -> [协程1结束]
                           |                   ^
                           v                   |
        释放线程，执行其他任务           耗时操作完成，恢复执行
```

### 状态机转换

Kotlin 编译器会将 `suspend` 函数转换为状态机。每个挂起点都是一个状态：

```kotlin
// 原始代码
suspend fun fetchData(): Data {
    val user = fetchUser()    // 挂起点1
    val posts = fetchPosts()  // 挂起点2
    return combine(user, posts)
}

// 编译器转换后的伪代码（简化）
fun fetchData(continuation: Continuation<Data>) {
    when (continuation.state) {
        0 -> {
            continuation.state = 1
            fetchUser(continuation)  // 返回后从状态1继续
        }
        1 -> {
            val user = continuation.result
            continuation.state = 2
            fetchPosts(continuation)
        }
        2 -> {
            val posts = continuation.result
            continuation.resume(combine(user, posts))
        }
    }
}
```

### Continuation 传递风格（CPS）

协程使用 **Continuation Passing Style** 实现挂起恢复。每个 `suspend` 函数在编译后都会增加一个 `Continuation` 参数：

```kotlin
// 我们写的代码
suspend fun greet(): String

// 编译后
fun greet(continuation: Continuation<String>): Any?
```

`Continuation` 封装了"接下来要做什么"的信息，包括恢复点和上下文。

## 核心要点

### 五大核心概念速览

| 概念 | 用途 | 返回值 | 特点 |
|------|------|--------|------|
| `suspend` | 声明可挂起函数 | 函数定义的返回类型 | 只能在协程或其他suspend函数中调用 |
| `launch` | 启动协程 | `Job` | 不返回结果，"发射后不管" |
| `async` | 启动协程并获取结果 | `Deferred<T>` | 返回结果，需调用await() |
| `runBlocking` | 桥接阻塞与非阻塞 | 协程返回值 | 阻塞当前线程 |
| `coroutineScope` | 创建结构化作用域 | 协程返回值 | 等待所有子协程完成 |

### suspend 函数

`suspend` 关键字标记一个函数可以被挂起。它是协程的基础构建块。

```kotlin
// 声明一个挂起函数
suspend fun fetchUserData(): User {
    delay(1000L)  // delay 也是挂起函数
    return User("张三", 25)
}
```

**关键规则**：`suspend` 函数只能从以下位置调用：
- 另一个 `suspend` 函数
- 协程作用域（如 `launch`、`async` 块内）

### launch：启动"发射后不管"的协程

`launch` 用于启动一个不需要返回结果的协程，返回 `Job` 对象用于控制协程生命周期。

```kotlin
val job: Job = launch {
    // 协程体
    println("Hello from coroutine!")
}
```

### async：启动需要返回结果的协程

`async` 用于启动需要返回结果的协程，返回 `Deferred<T>` 对象，通过 `await()` 获取结果。

```kotlin
val deferred: Deferred<Int> = async {
    computeValue()
}
val result = deferred.await()  // 获取结果
```

### runBlocking：阻塞式协程桥接器

`runBlocking` 创建一个协程并阻塞当前线程，直到协程完成。主要用于 `main` 函数和测试。

```kotlin
fun main() = runBlocking {
    // 在这里可以调用 suspend 函数
    delay(1000L)
    println("Hello!")
}
```

### coroutineScope：结构化并发作用域

`coroutineScope` 创建一个新的协程作用域，等待所有子协程完成后才返回。

```kotlin
suspend fun loadAll() = coroutineScope {
    val users = async { fetchUsers() }
    val posts = async { fetchPosts() }
    Pair(users.await(), posts.await())
}
```

## 代码示例

### 环境准备

首先添加协程依赖：

```kotlin
// build.gradle.kts
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.0")
    // Android 项目额外添加
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
}
```

### 示例1：第一个协程程序

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    println("主协程开始 - ${Thread.currentThread().name}")

    launch {
        delay(1000L)
        println("子协程执行 - ${Thread.currentThread().name}")
    }

    println("主协程继续执行")
    delay(2000L)  // 等待子协程完成
    println("主协程结束")
}

// 输出：
// 主协程开始 - main
// 主协程继续执行
// 子协程执行 - main
// 主协程结束
```

**代码解析**：
- `runBlocking` 启动主协程，阻塞 main 线程
- `launch` 在主协程内启动子协程，但不等待其完成
- `delay` 是挂起函数，挂起当前协程但不阻塞线程
- 子协程在 1 秒后执行打印

### 示例2：suspend 函数的使用

```kotlin
import kotlinx.coroutines.*

// 定义挂起函数
suspend fun fetchUser(): String {
    delay(1000L)  // 模拟网络请求
    return "用户: 张三"
}

suspend fun fetchOrders(): String {
    delay(1000L)  // 模拟网络请求
    return "订单: [订单1, 订单2]"
}

fun main() = runBlocking {
    println("开始加载数据...")

    // 顺序执行：总耗时约 2 秒
    val user = fetchUser()
    println(user)

    val orders = fetchOrders()
    println(orders)

    println("数据加载完成")
}

// 输出：
// 开始加载数据...
// 用户: 张三
// 订单: [订单1, 订单2]
// 数据加载完成
```

### 示例3：launch 的使用

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    println("=== launch 示例 ===")

    // 启动多个并发任务
    val job1 = launch {
        repeat(3) { i ->
            println("任务1 - 第 $i 次")
            delay(500L)
        }
    }

    val job2 = launch {
        repeat(3) { i ->
            println("任务2 - 第 $i 次")
            delay(300L)
        }
    }

    // 等待所有任务完成
    job1.join()
    job2.join()

    println("所有任务完成")
}

// 输出（交错执行）：
// === launch 示例 ===
// 任务1 - 第 0 次
// 任务2 - 第 0 次
// 任务2 - 第 1 次
// 任务1 - 第 1 次
// 任务2 - 第 2 次
// 任务1 - 第 2 次
// 所有任务完成
```

**Job 的常用方法**：

```kotlin
val job = launch { ... }

job.start()        // 启动（如果使用 LAZY 模式）
job.cancel()       // 取消任务
job.join()         // 等待任务完成
job.cancelAndJoin() // 取消并等待完成
job.isActive       // 是否正在执行
job.isCompleted    // 是否已完成
job.isCancelled    // 是否已取消
```

### 示例4：async 实现并发

```kotlin
import kotlinx.coroutines.*
import kotlin.system.measureTimeMillis

suspend fun fetchUserInfo(): String {
    delay(1000L)
    return "用户信息"
}

suspend fun fetchUserPosts(): List<String> {
    delay(1000L)
    return listOf("文章1", "文章2", "文章3")
}

fun main() = runBlocking {
    // 顺序执行
    val sequentialTime = measureTimeMillis {
        val user = fetchUserInfo()
        val posts = fetchUserPosts()
        println("顺序: $user, $posts")
    }
    println("顺序执行耗时: ${sequentialTime}ms\n")  // 约 2000ms

    // 并发执行
    val concurrentTime = measureTimeMillis {
        val userDeferred = async { fetchUserInfo() }
        val postsDeferred = async { fetchUserPosts() }

        // 两个请求并行执行，await 获取结果
        val user = userDeferred.await()
        val posts = postsDeferred.await()
        println("并发: $user, $posts")
    }
    println("并发执行耗时: ${concurrentTime}ms")  // 约 1000ms
}

// 输出：
// 顺序: 用户信息, [文章1, 文章2, 文章3]
// 顺序执行耗时: 2012ms
//
// 并发: 用户信息, [文章1, 文章2, 文章3]
// 并发执行耗时: 1008ms
```

### 示例5：coroutineScope 结构化并发

```kotlin
import kotlinx.coroutines.*

// 使用 coroutineScope 创建结构化作用域
suspend fun loadDashboard(): Map<String, String> = coroutineScope {
    println("开始加载仪表盘...")

    // 并发请求多个数据源
    val userInfoDeferred = async {
        delay(1000L)
        "用户: 张三"
    }

    val statsDeferred = async {
        delay(800L)
        "统计: 100条消息"
    }

    val notificationsDeferred = async {
        delay(600L)
        "通知: 5条未读"
    }

    // 等待所有结果
    mapOf(
        "user" to userInfoDeferred.await(),
        "stats" to statsDeferred.await(),
        "notifications" to notificationsDeferred.await()
    )
}

fun main() = runBlocking {
    val time = measureTimeMillis {
        val dashboard = loadDashboard()
        dashboard.forEach { (key, value) ->
            println("$key -> $value")
        }
    }
    println("总耗时: ${time}ms")  // 约 1000ms（取决于最慢的请求）
}

// 输出：
// 开始加载仪表盘...
// user -> 用户: 张三
// stats -> 统计: 100条消息
// notifications -> 通知: 5条未读
// 总耗时: 1015ms
```

### 示例6：runBlocking vs coroutineScope 对比

```kotlin
import kotlinx.coroutines.*

fun main() {
    println("=== runBlocking ===")
    println("开始 - ${Thread.currentThread().name}")

    runBlocking {
        println("runBlocking 内部 - ${Thread.currentThread().name}")
        delay(1000L)
        println("runBlocking 延迟后")
    }

    println("runBlocking 之后 - 线程被阻塞直到协程完成")
    println()

    // coroutineScope 必须在协程内使用
    runBlocking {
        println("=== coroutineScope ===")

        launch {
            delay(200L)
            println("launch 1 完成")
        }

        // coroutineScope 不阻塞线程，但会等待其子协程
        coroutineScope {
            launch {
                delay(500L)
                println("coroutineScope 内的 launch 完成")
            }
            println("coroutineScope 内部开始")
        }

        println("coroutineScope 之后 - 等待其内部所有协程完成")
    }
}
```

### 示例7：综合实战 - 用户资料加载

```kotlin
import kotlinx.coroutines.*

// 模拟数据类
data class User(val id: String, val name: String)
data class Profile(val bio: String, val avatar: String)
data class Posts(val items: List<String>)
data class UserPage(val user: User, val profile: Profile, val posts: Posts)

// 模拟 API 调用
suspend fun fetchUser(userId: String): User {
    delay(800L)
    return User(userId, "张三")
}

suspend fun fetchProfile(userId: String): Profile {
    delay(600L)
    return Profile("Kotlin 开发者", "avatar.png")
}

suspend fun fetchPosts(userId: String): Posts {
    delay(1000L)
    return Posts(listOf("协程入门", "Flow 教程", "Compose 实战"))
}

// 使用 coroutineScope 组织并发请求
suspend fun loadUserPage(userId: String): UserPage = coroutineScope {
    // 用户信息必须先获取（其他请求可能依赖）
    val user = fetchUser(userId)

    // Profile 和 Posts 可以并发获取
    val profileDeferred = async { fetchProfile(userId) }
    val postsDeferred = async { fetchPosts(userId) }

    UserPage(
        user = user,
        profile = profileDeferred.await(),
        posts = postsDeferred.await()
    )
}

fun main() = runBlocking {
    println("加载用户页面...")

    val time = measureTimeMillis {
        val userPage = loadUserPage("user_001")

        println("用户: ${userPage.user.name}")
        println("简介: ${userPage.profile.bio}")
        println("文章: ${userPage.posts.items}")
    }

    // 总耗时 = fetchUser(800ms) + max(fetchProfile, fetchPosts) = 800 + 1000 = 1800ms
    println("总耗时: ${time}ms")
}
```

## 最佳实践

### 选择正确的协程构建器

```kotlin
// 不需要结果 -> 使用 launch
launch {
    saveToDatabase(data)
    logAnalytics(event)
}

// 需要结果 -> 使用 async
val result = async { computeExpensiveValue() }.await()

// 需要并发获取多个结果 -> 使用多个 async
coroutineScope {
    val a = async { fetchA() }
    val b = async { fetchB() }
    process(a.await(), b.await())
}
```

### 避免使用 GlobalScope

```kotlin
// 不推荐：生命周期不受控制
GlobalScope.launch {
    // 这个协程会一直运行，可能导致内存泄漏
}

// 推荐：使用受控的作用域
class UserRepository(private val scope: CoroutineScope) {
    fun fetchUser() {
        scope.launch {
            // 与作用域生命周期绑定
        }
    }
}

// Android 中推荐使用 lifecycleScope 或 viewModelScope
viewModelScope.launch {
    // 与 ViewModel 生命周期绑定
}
```

### suspend 函数应该是主线程安全的

```kotlin
// 推荐：在函数内部切换到合适的调度器
suspend fun fetchFromNetwork(): Data = withContext(Dispatchers.IO) {
    // 网络请求在 IO 调度器执行
    api.fetchData()
}

suspend fun processData(data: Data): Result = withContext(Dispatchers.Default) {
    // CPU 密集型操作在 Default 调度器执行
    heavyComputation(data)
}

// 调用者无需关心线程切换
suspend fun loadAndProcess() {
    val data = fetchFromNetwork()  // 自动在 IO 线程
    val result = processData(data)  // 自动在 Default 线程
    updateUI(result)  // 自动回到原来的线程
}
```

### 使用 coroutineScope 而非 supervisorScope（除非特别需要）

```kotlin
// 标准行为：子协程失败会取消兄弟协程
suspend fun loadData() = coroutineScope {
    val a = async { fetchA() }  // 如果 fetchA 失败
    val b = async { fetchB() }  // fetchB 也会被取消
    Pair(a.await(), b.await())
}

// 特殊需求：子协程失败不影响其他协程
suspend fun loadDataIndependently() = supervisorScope {
    val a = async { fetchA() }  // 如果 fetchA 失败
    val b = async { fetchB() }  // fetchB 仍继续执行
    // 需要单独处理每个异常
}
```

### 正确处理协程取消

```kotlin
suspend fun cancellableOperation() {
    while (true) {
        // 方式1：检查 isActive
        if (!coroutineContext.isActive) break

        // 方式2：调用 ensureActive()
        ensureActive()

        // 方式3：调用可取消的挂起函数（如 delay、yield）
        delay(100L)

        doWork()
    }
}
```

## 常见陷阱

### 陷阱1：在普通函数中调用 suspend 函数

```kotlin
// 错误：编译错误
fun loadData() {
    val user = fetchUser()  // 无法调用 suspend 函数
}

// 正确：使用协程作用域
fun loadData() {
    CoroutineScope(Dispatchers.Main).launch {
        val user = fetchUser()  // 在协程内调用
    }
}
```

### 陷阱2：忘记 await() 导致并发未生效

```kotlin
// 错误：实际上是顺序执行
suspend fun loadSequentially() = coroutineScope {
    val a = async { fetchA() }.await()  // 启动后立即等待
    val b = async { fetchB() }.await()  // fetchA 完成后才启动 fetchB
}

// 正确：先启动所有任务，再等待结果
suspend fun loadConcurrently() = coroutineScope {
    val aDeferred = async { fetchA() }  // 立即启动
    val bDeferred = async { fetchB() }  // 立即启动
    val a = aDeferred.await()  // 等待结果
    val b = bDeferred.await()  // 等待结果
}
```

### 陷阱3：runBlocking 导致主线程阻塞

```kotlin
// 错误：在 Android 主线程使用 runBlocking 会导致 ANR
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        runBlocking {  // 阻塞主线程！
            delay(5000L)
        }
    }
}

// 正确：使用 lifecycleScope
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        lifecycleScope.launch {  // 不阻塞主线程
            delay(5000L)
        }
    }
}
```

### 陷阱4：异常处理不当

```kotlin
// 错误：异常被静默吞掉
launch {
    try {
        riskyOperation()
    } catch (e: Exception) {
        // 异常被捕获，但没有处理
    }
}

// 正确：正确处理异常
launch {
    try {
        riskyOperation()
    } catch (e: CancellationException) {
        throw e  // 重新抛出取消异常
    } catch (e: Exception) {
        handleError(e)  // 处理其他异常
    }
}

// 或使用 CoroutineExceptionHandler
val handler = CoroutineExceptionHandler { _, exception ->
    println("捕获异常: $exception")
}
CoroutineScope(Dispatchers.Main + handler).launch {
    riskyOperation()
}
```

### 陷阱5：协程泄漏

```kotlin
// 错误：Activity 销毁后协程仍在运行
class MyActivity : AppCompatActivity() {
    private val scope = CoroutineScope(Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        scope.launch {
            while (true) {
                updateUI()  // Activity 销毁后仍在更新 UI
                delay(1000L)
            }
        }
    }
    // 忘记取消协程
}

// 正确：在 onDestroy 中取消
class MyActivity : AppCompatActivity() {
    private val scope = CoroutineScope(Dispatchers.Main + Job())

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()  // 取消所有协程
    }
}

// 更好：使用 lifecycleScope（自动处理生命周期）
class MyActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        lifecycleScope.launch {
            // 自动在 Activity 销毁时取消
        }
    }
}
```

## 性能考量

### 协程的内存开销

协程非常轻量，每个协程只需要几KB内存：

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    val startMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()

    // 创建 100,000 个协程
    val jobs = List(100_000) {
        launch {
            delay(5000L)
        }
    }

    val endMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()
    println("内存增长: ${(endMemory - startMemory) / 1024 / 1024} MB")

    jobs.forEach { it.cancel() }
}
// 约增长几十 MB（如果用线程，可能需要几十 GB）
```

### 调度器选择对性能的影响

```kotlin
// Dispatchers.Default: 适合 CPU 密集型任务
// 线程数 = CPU 核心数
withContext(Dispatchers.Default) {
    heavyComputation()
}

// Dispatchers.IO: 适合 I/O 密集型任务
// 线程数可动态增长（默认最多 64 个）
withContext(Dispatchers.IO) {
    networkRequest()
    fileOperation()
}

// Dispatchers.Main: 用于 UI 操作
// 只有一个线程
withContext(Dispatchers.Main) {
    updateUI()
}

// Dispatchers.Unconfined: 不推荐在生产环境使用
// 不限定线程，会在恢复时继承调用者的线程
```

### 避免不必要的协程创建

```kotlin
// 不推荐：为每个元素创建协程
suspend fun processItems(items: List<Item>) {
    items.forEach { item ->
        launch { process(item) }  // 创建大量协程
    }
}

// 推荐：使用 Flow 或批量处理
suspend fun processItems(items: List<Item>) {
    items.chunked(100).forEach { batch ->
        launch { processBatch(batch) }  // 减少协程数量
    }
}

// 或使用 Flow
suspend fun processItems(items: List<Item>) {
    items.asFlow()
        .buffer(64)  // 控制并发数
        .collect { process(it) }
}
```

## 实战场景

### 场景1：Android 网络请求

```kotlin
class UserViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState

    fun loadUser(userId: String) {
        viewModelScope.launch {
            _uiState.value = UiState.Loading

            try {
                val user = withContext(Dispatchers.IO) {
                    userRepository.fetchUser(userId)
                }
                _uiState.value = UiState.Success(user)
            } catch (e: Exception) {
                _uiState.value = UiState.Error(e.message ?: "未知错误")
            }
        }
    }
}

sealed class UiState {
    object Loading : UiState()
    data class Success(val user: User) : UiState()
    data class Error(val message: String) : UiState()
}
```

### 场景2：并发批量下载

```kotlin
suspend fun downloadImages(urls: List<String>): List<ByteArray> = coroutineScope {
    urls.map { url ->
        async(Dispatchers.IO) {
            downloadImage(url)
        }
    }.awaitAll()  // 等待所有下载完成
}

// 带并发限制的下载
suspend fun downloadImagesWithLimit(
    urls: List<String>,
    concurrency: Int = 5
): List<ByteArray> = coroutineScope {
    val semaphore = Semaphore(concurrency)

    urls.map { url ->
        async(Dispatchers.IO) {
            semaphore.withPermit {
                downloadImage(url)
            }
        }
    }.awaitAll()
}
```

### 场景3：超时处理

```kotlin
suspend fun fetchWithTimeout(): Result<Data> {
    return try {
        val data = withTimeout(5000L) {
            fetchData()
        }
        Result.success(data)
    } catch (e: TimeoutCancellationException) {
        Result.failure(Exception("请求超时"))
    }
}

// 或使用 withTimeoutOrNull
suspend fun fetchWithTimeoutOrNull(): Data? {
    return withTimeoutOrNull(5000L) {
        fetchData()
    }
}
```

### 场景4：定时任务

```kotlin
fun startPeriodicTask(interval: Long) {
    CoroutineScope(Dispatchers.Default).launch {
        while (isActive) {
            doPeriodicWork()
            delay(interval)
        }
    }
}

// 更精确的定时（考虑任务执行时间）
fun startFixedRateTask(interval: Long) {
    CoroutineScope(Dispatchers.Default).launch {
        while (isActive) {
            val startTime = System.currentTimeMillis()
            doPeriodicWork()
            val elapsed = System.currentTimeMillis() - startTime
            val delayTime = (interval - elapsed).coerceAtLeast(0)
            delay(delayTime)
        }
    }
}
```

## 面试要点

### Q1: 什么是协程？它与线程有什么区别？

**答**：协程是一种轻量级的并发原语，可以在执行过程中挂起和恢复。主要区别：
- **资源消耗**：线程需要约1MB栈空间，协程只需几KB
- **调度方式**：线程由操作系统调度，协程由程序控制
- **阻塞行为**：线程阻塞会占用资源，协程挂起会释放线程
- **数量限制**：线程受系统限制（几千个），协程可创建数十万个

### Q2: suspend 关键字的作用是什么？

**答**：`suspend` 标记函数为可挂起函数，表示该函数可能会暂停执行。编译器会将其转换为状态机，添加 `Continuation` 参数实现挂起/恢复机制。`suspend` 函数只能从协程或其他 `suspend` 函数中调用。

### Q3: launch 和 async 的区别？

**答**：
| 特性 | launch | async |
|------|--------|-------|
| 返回值 | `Job` | `Deferred<T>` |
| 获取结果 | 无法获取 | 通过 `await()` |
| 异常处理 | 立即传播 | 在 `await()` 时传播 |
| 使用场景 | "发射后不管" | 需要返回值 |

### Q4: runBlocking 和 coroutineScope 的区别？

**答**：
- `runBlocking` 阻塞当前线程，用于桥接阻塞代码和协程
- `coroutineScope` 不阻塞线程，只挂起协程，等待子协程完成
- `runBlocking` 用于 `main` 函数和测试，`coroutineScope` 用于 `suspend` 函数中创建子作用域

### Q5: 什么是结构化并发？

**答**：结构化并发是 Kotlin 协程的核心原则，确保：
1. 协程有明确的作用域和生命周期
2. 父协程等待所有子协程完成
3. 取消父协程会自动取消所有子协程
4. 子协程异常会传播到父协程

这避免了协程泄漏和资源管理问题。

### Q6: 如何处理协程中的异常？

**答**：
1. 使用 `try-catch` 包裹可能抛出异常的代码
2. 使用 `CoroutineExceptionHandler` 处理未捕获异常
3. 对于 `async`，异常在 `await()` 时抛出
4. 使用 `SupervisorJob` 防止子协程异常影响兄弟协程
5. 注意：`CancellationException` 需要重新抛出，不应被捕获后忽略

## 延伸阅读

### 官方资源

- [Kotlin 协程官方文档](https://kotlinlang.org/docs/coroutines-overview.html)
- [kotlinx.coroutines GitHub 仓库](https://github.com/Kotlin/kotlinx.coroutines)
- [Kotlin 协程设计文档](https://github.com/Kotlin/KEEP/blob/master/proposals/coroutines.zh.md)

### 推荐书籍

- 《Kotlin 协程》- Marcin Moskala
- 《Kotlin 实战》- Dmitry Jemerov & Svetlana Isakova

### 进阶主题

- [Flow 深入理解](/kotlin/flow) - 响应式数据流
- [协程完全指南](/kotlin/coroutines) - 协程高级用法
- Channel 与 Actor - 协程间通信
- 协程调试与测试技巧

### 相关工具

- **kotlinx.coroutines** - 官方协程库
- **Ktor** - 基于协程的异步 Web 框架
- **Room** - 支持 Flow 的 Android 数据库
- **Retrofit** - 支持 suspend 函数的网络库

## 总结

Kotlin 协程通过简洁的语法和强大的抽象，让异步编程变得简单直观。掌握这五个核心概念是学习协程的基础：

1. **suspend 函数**：声明可挂起的函数，是协程的基本构建块
2. **launch**：启动不需要返回值的协程，返回 `Job`
3. **async**：启动需要返回值的协程，返回 `Deferred`
4. **runBlocking**：阻塞式桥接器，用于 main 函数和测试
5. **coroutineScope**：创建结构化并发作用域

理解这些概念后，你就能编写高效、可维护的异步代码。下一步可以深入学习 Flow、Channel 等更高级的协程特性。
