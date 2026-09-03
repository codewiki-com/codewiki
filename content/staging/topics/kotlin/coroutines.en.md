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
origin: old/src/content/docs/kotlin/coroutines.en.md
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

Kotlin coroutines represent a paradigm shift in how we write asynchronous code. They enable developers to write non-blocking code in a sequential, readable manner while maintaining the performance benefits of asynchronous programming. This comprehensive guide covers everything from basic concepts to advanced patterns.

## Understanding Coroutines

### What Are Coroutines?

Coroutines are lightweight, suspendable computations that can be paused and resumed without blocking the underlying thread. Unlike traditional threads, which are expensive system resources, you can run thousands or even millions of coroutines concurrently on a limited thread pool.

Think of coroutines as cooperative multitasking: they voluntarily yield control at suspension points, allowing other coroutines to run on the same thread.

### Why Coroutines?

Traditional approaches to asynchronous programming have significant drawbacks:

**Callbacks** lead to deeply nested code (callback hell):

```kotlin
// Callback hell - hard to read and maintain
fetchUser(userId) { user ->
    fetchPosts(user.id) { posts ->
        fetchComments(posts[0].id) { comments ->
            updateUI(user, posts, comments)
        }
    }
}
```

**Futures/Promises** improve readability but still require chaining:

```kotlin
// Promise chaining - better but still complex
fetchUser(userId)
    .thenCompose { user -> fetchPosts(user.id) }
    .thenCompose { posts -> fetchComments(posts[0].id) }
    .thenAccept { comments -> updateUI(comments) }
```

**Coroutines** provide sequential, synchronous-looking code:

```kotlin
// Coroutine approach - clean and readable
suspend fun loadData(userId: String) {
    val user = fetchUser(userId)
    val posts = fetchPosts(user.id)
    val comments = fetchComments(posts[0].id)
    updateUI(user, posts, comments)
}
```

### Setup and Dependencies

Add coroutines to your project in `build.gradle.kts`:

```kotlin
dependencies {
    // Core coroutines library
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.0")

    // Android-specific (if needed)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")

    // Testing
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
}
```

## Suspend Functions

### The Foundation of Coroutines

Suspend functions are the building blocks of coroutines. The `suspend` keyword marks a function that can be paused and resumed. When a suspend function is called, it can suspend execution without blocking the thread.

```kotlin
suspend fun fetchUserData(userId: String): User {
    // This delay suspends the coroutine, not the thread
    delay(1000L)
    return User(userId, "John Doe", "john@example.com")
}
```

### How Suspension Works

When a suspend function reaches a suspension point (like `delay()` or another suspend function call), the coroutine:

1. Saves its current state (local variables, execution point)
2. Releases the thread back to the pool
3. Resumes later when the suspended operation completes
4. Continues execution from where it left off

```kotlin
suspend fun demonstrateSuspension() {
    println("Before suspension - Thread: ${Thread.currentThread().name}")
    delay(100) // Suspension point
    println("After suspension - Thread: ${Thread.currentThread().name}")
    // Thread may be different after resumption!
}
```

### Calling Suspend Functions

Suspend functions can only be called from:
- Other suspend functions
- Coroutine builders (launch, async, runBlocking)

```kotlin
// Suspend function calling another suspend function
suspend fun getUserProfile(userId: String): UserProfile {
    val user = fetchUserData(userId)       // Suspend call
    val preferences = fetchPreferences(userId) // Another suspend call
    return UserProfile(user, preferences)
}

// Cannot call from regular function - compile error
fun regularFunction() {
    // fetchUserData("123") // ERROR: Suspend function can only be called from coroutine
}
```

### Sequential vs Concurrent Execution

By default, suspend functions execute sequentially:

```kotlin
suspend fun sequentialCalls(): Pair<User, List<Post>> {
    val startTime = System.currentTimeMillis()

    val user = fetchUser()  // Takes 1000ms
    val posts = fetchPosts() // Takes 1000ms

    val elapsed = System.currentTimeMillis() - startTime
    println("Sequential execution took: $elapsed ms") // ~2000ms

    return Pair(user, posts)
}
```

For concurrent execution, use `async`:

```kotlin
suspend fun concurrentCalls(): Pair<User, List<Post>> = coroutineScope {
    val startTime = System.currentTimeMillis()

    val userDeferred = async { fetchUser() }   // Starts immediately
    val postsDeferred = async { fetchPosts() } // Starts immediately

    val user = userDeferred.await()
    val posts = postsDeferred.await()

    val elapsed = System.currentTimeMillis() - startTime
    println("Concurrent execution took: $elapsed ms") // ~1000ms

    Pair(user, posts)
}
```

## Coroutine Builders

Coroutine builders are functions that create and start coroutines. Each serves a specific purpose.

### launch

`launch` starts a new coroutine and returns a `Job`. It's used for fire-and-forget operations that don't return a result.

```kotlin
fun main() = runBlocking {
    println("Main program starts: ${Thread.currentThread().name}")

    val job = launch {
        println("Coroutine starts: ${Thread.currentThread().name}")
        delay(1000)
        println("Coroutine ends: ${Thread.currentThread().name}")
    }

    println("Main program continues...")
    job.join() // Wait for coroutine to complete
    println("Main program ends")
}
```

Output:
```
Main program starts: main
Main program continues...
Coroutine starts: main
Coroutine ends: main
Main program ends
```

### async

`async` starts a coroutine and returns a `Deferred<T>`, which is a future that will hold the result. Use `await()` to get the result.

```kotlin
suspend fun computeAnswer(): Int {
    delay(1000)
    return 42
}

suspend fun computeQuestion(): String {
    delay(1000)
    return "What is the meaning of life?"
}

fun main() = runBlocking {
    val answerDeferred = async { computeAnswer() }
    val questionDeferred = async { computeQuestion() }

    // Both computations run concurrently
    val answer = answerDeferred.await()
    val question = questionDeferred.await()

    println("$question -> $answer")
}
```

### Lazy Async

You can defer the start of an async coroutine:

```kotlin
fun main() = runBlocking {
    val deferred = async(start = CoroutineStart.LAZY) {
        println("Computing...")
        delay(1000)
        42
    }

    println("Async created but not started")
    delay(500)

    println("Starting async...")
    deferred.start() // Explicitly start

    println("Result: ${deferred.await()}")
}
```

### runBlocking

`runBlocking` bridges blocking and non-blocking code. It blocks the current thread until all coroutines inside complete.

```kotlin
fun main() = runBlocking {
    // This blocks main thread until everything completes
    launch {
        delay(1000)
        println("World!")
    }
    println("Hello,")
}
```

**Important**: Use `runBlocking` only for:
- Main functions
- Tests
- Bridging from blocking APIs (use sparingly)

Never use it inside other coroutines - it defeats the purpose.

### withContext

`withContext` switches the coroutine context and waits for the block to complete. It's commonly used to switch dispatchers.

```kotlin
suspend fun fetchDataFromNetwork(): String = withContext(Dispatchers.IO) {
    // Runs on IO dispatcher
    URL("https://api.example.com/data").readText()
}

suspend fun processData(data: String): Result = withContext(Dispatchers.Default) {
    // Runs on Default dispatcher (CPU-intensive)
    parseAndProcess(data)
}

suspend fun updateUI(result: Result) = withContext(Dispatchers.Main) {
    // Runs on Main dispatcher (UI thread)
    displayResult(result)
}
```

### coroutineScope

`coroutineScope` creates a new scope and suspends until all children complete. It propagates exceptions.

```kotlin
suspend fun loadUserWithPosts(userId: String): UserWithPosts = coroutineScope {
    val user = async { fetchUser(userId) }
    val posts = async { fetchPosts(userId) }

    UserWithPosts(user.await(), posts.await())
}
```

### supervisorScope

Like `coroutineScope`, but child failures don't cancel siblings or the parent.

```kotlin
suspend fun fetchMultipleResources() = supervisorScope {
    val resource1 = async {
        delay(100)
        throw Exception("Resource 1 failed")
    }

    val resource2 = async {
        delay(200)
        "Resource 2 data"
    }

    // resource1 failure doesn't cancel resource2
    val result1 = runCatching { resource1.await() }
    val result2 = resource2.await()

    println("Resource 1: $result1")
    println("Resource 2: $result2")
}
```

## Coroutine Context and Dispatchers

### CoroutineContext

Every coroutine has an associated context that contains various elements:

```kotlin
fun main() = runBlocking {
    println("Context: $coroutineContext")
    println("Job: ${coroutineContext[Job]}")
    println("Dispatcher: ${coroutineContext[ContinuationInterceptor]}")

    launch(CoroutineName("MyCoroutine") + Dispatchers.Default) {
        println("Named coroutine: ${coroutineContext[CoroutineName]}")
    }
}
```

### Context Elements

Common context elements include:

- **Job**: Controls lifecycle and cancellation
- **CoroutineDispatcher**: Determines execution thread
- **CoroutineName**: Debug name for the coroutine
- **CoroutineExceptionHandler**: Handles uncaught exceptions

```kotlin
val customContext = Job() +
                    Dispatchers.Default +
                    CoroutineName("CustomCoroutine") +
                    CoroutineExceptionHandler { _, e ->
                        println("Caught: $e")
                    }

launch(customContext) {
    // Uses all context elements
}
```

### Dispatchers

Dispatchers determine which thread or thread pool executes a coroutine.

#### Dispatchers.Default

Optimized for CPU-intensive work. Uses a shared thread pool sized to the number of CPU cores.

```kotlin
launch(Dispatchers.Default) {
    // Sorting, parsing, complex calculations
    val sorted = hugeList.sorted()
    val parsed = parseComplexJson(data)
}
```

#### Dispatchers.IO

Optimized for I/O operations. Uses a larger thread pool that can grow as needed.

```kotlin
launch(Dispatchers.IO) {
    // File operations, network calls, database queries
    val content = File("data.txt").readText()
    val response = httpClient.get("https://api.example.com")
    val users = database.query("SELECT * FROM users")
}
```

#### Dispatchers.Main

Confined to the main/UI thread. Available on Android and other UI frameworks.

```kotlin
launch(Dispatchers.Main) {
    // UI updates only
    textView.text = "Updated!"
    progressBar.visibility = View.GONE
}
```

#### Dispatchers.Unconfined

Starts in the caller's thread but may resume in a different thread. Use with caution.

```kotlin
launch(Dispatchers.Unconfined) {
    println("Started in: ${Thread.currentThread().name}")
    delay(100)
    println("Resumed in: ${Thread.currentThread().name}") // May differ!
}
```

#### Custom Dispatchers

Create limited-parallelism dispatchers for resource control:

```kotlin
// Limit concurrent database connections
val databaseDispatcher = Dispatchers.IO.limitedParallelism(4)

// Single-threaded for thread-unsafe operations
val singleThreadDispatcher = Dispatchers.Default.limitedParallelism(1)

// From executor service
val customDispatcher = Executors.newFixedThreadPool(10).asCoroutineDispatcher()
```

## Structured Concurrency

Structured concurrency is a design paradigm that ensures coroutines are properly managed within a defined scope, preventing leaks and ensuring proper cleanup.

### Core Principles

1. **Every coroutine has a scope**: Coroutines are launched within a `CoroutineScope`
2. **Parent-child relationship**: Child coroutines inherit context from parents
3. **Cancellation propagates**: Canceling a parent cancels all children
4. **Parents wait for children**: A scope completes only when all children complete

```kotlin
suspend fun demonstrateStructuredConcurrency() = coroutineScope {
    launch {
        delay(1000)
        println("Child 1 completed")
    }

    launch {
        delay(500)
        println("Child 2 completed")
    }

    println("Parent waiting for children...")
    // Automatically waits for both children
}
// Both children are guaranteed to complete before this function returns
```

### Creating Custom Scopes

For classes that manage coroutines, implement `CoroutineScope`:

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
        job.cancel() // Cancels all coroutines in this scope
    }
}
```

### Android ViewModel Example

```kotlin
class UserViewModel : ViewModel() {
    // viewModelScope is automatically cancelled when ViewModel is cleared

    private val _users = MutableStateFlow<List<User>>(emptyList())
    val users: StateFlow<List<User>> = _users.asStateFlow()

    fun loadUsers() {
        viewModelScope.launch {
            try {
                val result = repository.fetchUsers()
                _users.value = result
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}
```

### Scope Functions Comparison

| Function | Creates Scope | Waits for Children | Exception Behavior |
|----------|--------------|-------------------|-------------------|
| `coroutineScope` | Yes | Yes | Propagates to parent |
| `supervisorScope` | Yes | Yes | Doesn't propagate from children |
| `withContext` | No (uses existing) | Yes | Propagates to parent |
| `launch` | No (uses parent's) | Parent waits | Propagates based on Job type |
| `async` | No (uses parent's) | Parent waits | Exposed via await() |

## Job and Lifecycle Management

### Job Hierarchy

Jobs form a parent-child hierarchy that enables structured concurrency:

```kotlin
fun main() = runBlocking {
    val parentJob = launch {
        val child1 = launch {
            delay(1000)
            println("Child 1 done")
        }

        val child2 = launch {
            delay(500)
            println("Child 2 done")
        }

        println("Parent has ${coroutineContext[Job]?.children?.count()} children")
    }

    parentJob.join()
}
```

### Job States

A Job progresses through these states:

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

    println("Created: isActive=${job.isActive}, isCompleted=${job.isCompleted}")

    job.start()
    println("Started: isActive=${job.isActive}, isCompleted=${job.isCompleted}")

    job.join()
    println("Completed: isActive=${job.isActive}, isCompleted=${job.isCompleted}")
}
```

### Cancellation

Cancellation is cooperative - coroutines must check for it:

```kotlin
suspend fun cancellableWork() = coroutineScope {
    val job = launch {
        repeat(1000) { i ->
            // Check for cancellation
            if (!isActive) {
                println("Cancelled at iteration $i")
                return@launch
            }

            println("Working: $i")
            delay(100) // Also checks for cancellation
        }
    }

    delay(350)
    println("Cancelling...")
    job.cancelAndJoin()
    println("Cancelled")
}
```

### Making Code Cancellable

Use these functions to check for cancellation:

```kotlin
suspend fun processItems(items: List<Item>) {
    for (item in items) {
        // Option 1: Check isActive
        if (!coroutineContext.isActive) break

        // Option 2: Use ensureActive() - throws if cancelled
        ensureActive()

        // Option 3: Use yield() - suspends and checks
        yield()

        processItem(item)
    }
}
```

### NonCancellable Context

For cleanup code that must run even when cancelled:

```kotlin
suspend fun performWithCleanup() {
    try {
        while (true) {
            doWork()
            delay(100)
        }
    } finally {
        // This cleanup must complete even if cancelled
        withContext(NonCancellable) {
            println("Cleaning up...")
            delay(500) // Allowed because of NonCancellable
            releaseResources()
            println("Cleanup complete")
        }
    }
}
```

### Cancellation with Timeout

```kotlin
suspend fun fetchWithTimeout() {
    try {
        withTimeout(3000) {
            val result = longRunningOperation()
            println("Result: $result")
        }
    } catch (e: TimeoutCancellationException) {
        println("Operation timed out")
    }
}

// Or use withTimeoutOrNull to return null instead of throwing
suspend fun fetchWithTimeoutOrNull(): String? {
    return withTimeoutOrNull(3000) {
        longRunningOperation()
    }
}
```

## Exception Handling

### Exception Propagation

Exceptions in coroutines propagate differently based on the builder:

```kotlin
fun main() = runBlocking {
    // launch: exception propagates to parent
    val job = launch {
        throw Exception("Failed in launch")
    }

    // async: exception is stored, thrown on await()
    val deferred = async {
        throw Exception("Failed in async")
    }

    try {
        deferred.await()
    } catch (e: Exception) {
        println("Caught from async: ${e.message}")
    }
}
```

### CoroutineExceptionHandler

Handle uncaught exceptions at the scope level:

```kotlin
val handler = CoroutineExceptionHandler { context, exception ->
    println("Caught in handler: ${exception.message}")
    println("Coroutine: ${context[CoroutineName]}")
}

fun main() = runBlocking {
    val scope = CoroutineScope(SupervisorJob() + handler)

    scope.launch(CoroutineName("FailingCoroutine")) {
        throw RuntimeException("Something went wrong")
    }

    delay(100)
    println("Main continues")
}
```

**Note**: `CoroutineExceptionHandler` only works with:
- `launch` (not `async`)
- Root coroutines (not children of other coroutines)

### SupervisorJob

`SupervisorJob` prevents child failures from canceling siblings:

```kotlin
fun main() = runBlocking {
    val supervisor = SupervisorJob()
    val scope = CoroutineScope(coroutineContext + supervisor)

    val child1 = scope.launch {
        delay(100)
        throw Exception("Child 1 failed")
    }

    val child2 = scope.launch {
        delay(200)
        println("Child 2 completed successfully")
    }

    // Wait for both to complete or fail
    joinAll(child1, child2)
    println("Supervisor scope completed")
}
```

### Try-Catch in Coroutines

Standard try-catch works within coroutines:

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

### Exception Handling Best Practices

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
                is CancellationException -> throw e // Re-throw cancellation
                is IOException -> logNetworkError(e)
                else -> logUnexpectedError(e)
            }
        }
    }
}
```

## Channels

Channels provide a way for coroutines to communicate by sending and receiving values. They're similar to blocking queues but with suspending operations.

### Basic Channel Usage

```kotlin
fun main() = runBlocking {
    val channel = Channel<Int>()

    // Producer
    launch {
        for (x in 1..5) {
            println("Sending $x")
            channel.send(x)
        }
        channel.close()
    }

    // Consumer
    for (value in channel) {
        println("Received $value")
    }
}
```

### Channel Types

#### Rendezvous Channel (default)

No buffer - sender suspends until receiver is ready:

```kotlin
val rendezvousChannel = Channel<Int>() // Capacity = 0
```

#### Buffered Channel

Has a fixed buffer size:

```kotlin
val bufferedChannel = Channel<Int>(capacity = 10)
```

#### Conflated Channel

Only keeps the most recent value:

```kotlin
val conflatedChannel = Channel<Int>(Channel.CONFLATED)

launch {
    conflatedChannel.send(1)
    conflatedChannel.send(2)
    conflatedChannel.send(3) // Only this is kept
}

delay(100)
println(conflatedChannel.receive()) // Prints: 3
```

#### Unlimited Channel

Unbounded buffer (use with caution):

```kotlin
val unlimitedChannel = Channel<Int>(Channel.UNLIMITED)
```

### Producer-Consumer Pattern

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

    numbers.cancel() // Cancel the producer
}
```

### Fan-Out and Fan-In

#### Fan-Out (Multiple consumers)

```kotlin
fun main() = runBlocking {
    val channel = Channel<Int>()

    // Producer
    launch {
        repeat(10) {
            channel.send(it)
            delay(50)
        }
        channel.close()
    }

    // Multiple consumers (fan-out)
    repeat(3) { consumerId ->
        launch {
            for (value in channel) {
                println("Consumer $consumerId received $value")
            }
        }
    }
}
```

#### Fan-In (Multiple producers)

```kotlin
fun main() = runBlocking {
    val channel = Channel<String>()

    // Multiple producers (fan-in)
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

### Select Expression

Choose between multiple channel operations:

```kotlin
suspend fun selectExample() = coroutineScope {
    val channel1 = Channel<String>()
    val channel2 = Channel<String>()

    launch {
        delay(100)
        channel1.send("From channel 1")
    }

    launch {
        delay(50)
        channel2.send("From channel 2")
    }

    val result = select<String> {
        channel1.onReceive { it }
        channel2.onReceive { it }
    }

    println("First received: $result") // "From channel 2"
}
```

## Flow

Flow is a cold asynchronous stream that emits values sequentially. Unlike channels, flows are cold - they don't produce values until collected.

### Creating Flows

```kotlin
// flow builder
fun numberFlow(): Flow<Int> = flow {
    for (i in 1..5) {
        delay(100)
        emit(i)
    }
}

// flowOf - from values
val simpleFlow = flowOf(1, 2, 3, 4, 5)

// asFlow - from collections/sequences
val listFlow = listOf(1, 2, 3).asFlow()
val rangeFlow = (1..10).asFlow()
```

### Collecting Flows

```kotlin
fun main() = runBlocking {
    numberFlow().collect { value ->
        println("Received: $value")
    }
}
```

### Flow Operators

#### Intermediate Operators

Transform the flow without consuming it:

```kotlin
fun main() = runBlocking {
    (1..10).asFlow()
        .filter { it % 2 == 0 }      // 2, 4, 6, 8, 10
        .map { it * it }              // 4, 16, 36, 64, 100
        .take(3)                      // 4, 16, 36
        .collect { println(it) }
}
```

Common intermediate operators:

```kotlin
flow
    .map { transform(it) }           // Transform each value
    .filter { condition(it) }        // Filter values
    .take(n)                         // Take first n values
    .drop(n)                         // Skip first n values
    .transform { emit(process(it)) } // Custom transformation
    .onEach { sideEffect(it) }       // Perform action on each
    .distinctUntilChanged()          // Skip consecutive duplicates
```

#### Terminal Operators

Consume the flow and produce a result:

```kotlin
val flow = flowOf(1, 2, 3, 4, 5)

val list = flow.toList()              // [1, 2, 3, 4, 5]
val sum = flow.reduce { a, b -> a + b } // 15
val first = flow.first()              // 1
val count = flow.count()              // 5
val single = flowOf(1).single()       // 1 (throws if not exactly one)
```

### Flow Context

Flows preserve context and are transparent to the caller:

```kotlin
fun dataFlow(): Flow<Int> = flow {
    // This will run on whatever dispatcher collects it
    println("Flow on: ${Thread.currentThread().name}")
    emit(1)
}

fun main() = runBlocking {
    dataFlow()
        .flowOn(Dispatchers.IO) // Change UPSTREAM context
        .collect { value ->
            println("Collecting on: ${Thread.currentThread().name}")
        }
}
```

**Important**: `flowOn` changes the context for upstream operations only:

```kotlin
flow {
    emit(1) // Runs on IO
}
.map { it * 2 } // Runs on IO
.flowOn(Dispatchers.IO)
.filter { it > 0 } // Runs on Default
.flowOn(Dispatchers.Default)
.collect { } // Runs on caller's context
```

### Exception Handling in Flow

```kotlin
fun riskyFlow(): Flow<Int> = flow {
    emit(1)
    emit(2)
    throw RuntimeException("Flow failed")
}

fun main() = runBlocking {
    riskyFlow()
        .catch { e ->
            println("Caught: ${e.message}")
            emit(-1) // Emit fallback value
        }
        .collect { println(it) }
}
```

### Flow Completion

```kotlin
fun main() = runBlocking {
    flowOf(1, 2, 3)
        .onStart { println("Starting flow") }
        .onEach { println("Emitting: $it") }
        .onCompletion { cause ->
            if (cause != null) {
                println("Completed with error: $cause")
            } else {
                println("Completed successfully")
            }
        }
        .collect { println("Collected: $it") }
}
```

### Combining Flows

```kotlin
fun main() = runBlocking {
    val nums = flowOf(1, 2, 3)
    val strs = flowOf("one", "two", "three")

    // zip - pairs corresponding elements
    nums.zip(strs) { n, s -> "$n -> $s" }
        .collect { println(it) }
    // Output: 1 -> one, 2 -> two, 3 -> three

    // combine - latest from each flow
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
    // Emits whenever either flow emits, using latest values
}
```

### Flattening Flows

```kotlin
fun main() = runBlocking {
    val flow = flowOf(1, 2, 3)

    // flatMapConcat - sequential processing
    flow.flatMapConcat { value ->
        flow {
            emit("$value-A")
            delay(100)
            emit("$value-B")
        }
    }.collect { println(it) }
    // 1-A, 1-B, 2-A, 2-B, 3-A, 3-B

    // flatMapMerge - concurrent processing
    flow.flatMapMerge(concurrency = 2) { value ->
        flow {
            delay(100)
            emit(value * 2)
        }
    }.collect { println(it) }

    // flatMapLatest - cancels previous on new emission
    flow.flatMapLatest { value ->
        flow {
            delay(100)
            emit(value)
        }
    }.collect { println(it) }
}
```

### Buffer and Conflate

```kotlin
// Buffer - run collector and emitter concurrently
flow {
    repeat(5) {
        delay(100) // Emit every 100ms
        emit(it)
    }
}
.buffer() // Don't wait for collector
.collect {
    delay(200) // Process slowly
    println(it)
}

// Conflate - skip intermediate values
flow {
    repeat(5) {
        delay(100)
        emit(it)
    }
}
.conflate() // Keep only latest unprocessed
.collect {
    delay(200)
    println(it) // Skips some values
}
```

## StateFlow and SharedFlow

StateFlow and SharedFlow are hot flows designed for sharing state and events.

### StateFlow

StateFlow always has a current value and emits updates to collectors:

```kotlin
class CounterViewModel {
    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count.asStateFlow()

    fun increment() {
        _count.update { it + 1 } // Thread-safe update
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

    // Collector
    val job = launch {
        viewModel.count.collect { value ->
            println("Count: $value")
        }
    }

    viewModel.increment() // Count: 1
    viewModel.increment() // Count: 2
    viewModel.decrement() // Count: 1

    delay(100)
    job.cancel()
}
```

### StateFlow Characteristics

- Always has a value (requires initial value)
- Only emits when value actually changes (equality check)
- Conflates emissions (collectors only see latest)
- Thread-safe
- Replay of 1 (new collectors get current value)

```kotlin
// StateFlow only emits on change
val stateFlow = MutableStateFlow(1)

launch {
    stateFlow.collect { println("Received: $it") }
}

stateFlow.value = 1 // No emission (same value)
stateFlow.value = 2 // Emits 2
stateFlow.value = 2 // No emission (same value)
```

### SharedFlow

SharedFlow is more configurable and doesn't require an initial value:

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

    // Multiple collectors
    launch {
        eventBus.events.collect { println("Collector 1: $it") }
    }

    launch {
        eventBus.events.collect { println("Collector 2: $it") }
    }

    delay(50)
    eventBus.emit(Event("UserLoggedIn"))
    eventBus.emit(Event("DataLoaded"))

    delay(100)
}
```

### SharedFlow Configuration

```kotlin
val sharedFlow = MutableSharedFlow<Event>(
    replay = 1,                          // Number of values replayed to new collectors
    extraBufferCapacity = 10,            // Additional buffer before suspending
    onBufferOverflow = BufferOverflow.DROP_OLDEST  // Strategy when full
)

// Buffer overflow strategies:
// - SUSPEND: Suspend emitter until space available
// - DROP_OLDEST: Drop oldest value in buffer
// - DROP_LATEST: Drop value being emitted
```

### StateFlow vs SharedFlow

| Feature | StateFlow | SharedFlow |
|---------|-----------|------------|
| Initial value | Required | Optional |
| Current value | `value` property | No |
| Equality check | Filters duplicates | Emits all |
| Replay | Always 1 | Configurable |
| Use case | State | Events |

```kotlin
class UserViewModel {
    // StateFlow for state
    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()

    // SharedFlow for one-time events
    private val _messages = MutableSharedFlow<String>()
    val messages: SharedFlow<String> = _messages.asSharedFlow()

    suspend fun login(credentials: Credentials) {
        try {
            val user = authService.login(credentials)
            _user.value = user
            _messages.emit("Login successful!")
        } catch (e: Exception) {
            _messages.emit("Login failed: ${e.message}")
        }
    }
}
```

### Converting Between Flows

```kotlin
// Cold Flow to StateFlow
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

// Cold Flow to SharedFlow
val sharedFlow: SharedFlow<Int> = coldFlow.shareIn(
    scope = viewModelScope,
    started = SharingStarted.Lazily,
    replay = 1
)
```

## Advanced Patterns

### Retry with Exponential Backoff

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

// Usage
fetchDataFlow()
    .retryWithExponentialBackoff()
    .collect { data -> process(data) }
```

### Debounce and Throttle

```kotlin
// Debounce - emit after silence period
fun searchFlow(query: StateFlow<String>): Flow<SearchResult> =
    query
        .debounce(300) // Wait 300ms after last emission
        .filter { it.isNotBlank() }
        .distinctUntilChanged()
        .flatMapLatest { searchQuery ->
            flow { emit(searchApi.search(searchQuery)) }
        }

// Throttle/Sample - emit at fixed intervals
fun sensorFlow(): Flow<SensorData> = flow {
    while (true) {
        emit(readSensor())
        delay(10) // Rapid emissions
    }
}.sample(100) // Only emit every 100ms
```

### Parallel Processing

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

// Usage
val urls = listOf("url1", "url2", "url3")
val results = urls.parallelMap { url ->
    fetchData(url)
}
```

### Resource Management

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

// Usage
FileInputStream("data.txt").useWithSuspend { stream ->
    // Read with suspension points
    delay(100)
    processStream(stream)
}
```

### Rate Limiting

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

// Usage
val rateLimiter = RateLimiter(permits = 10, period = 1.seconds)

suspend fun makeApiCall() {
    rateLimiter.execute {
        api.call()
    }
}
```

## Testing Coroutines

### Test Setup

```kotlin
dependencies {
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
}
```

### runTest

Use `runTest` for testing suspend functions:

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

### Testing with Delays

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
    advanceTimeBy(500) // Debounce timeout

    assertEquals(1, results.size)
    assertEquals("kotlin", viewModel.lastQuery)

    job.cancel()
}
```

### Testing Flows

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

### Turbine for Flow Testing

```kotlin
// Add dependency: testImplementation("app.cash.turbine:turbine:1.0.0")

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

## Best Practices

### Prefer Structured Concurrency

Always launch coroutines within a proper scope:

```kotlin
// Bad - GlobalScope leaks and can't be cancelled
GlobalScope.launch {
    doWork()
}

// Good - scoped to lifecycle
class MyService(private val scope: CoroutineScope) {
    fun doWork() {
        scope.launch {
            // Automatically cancelled when scope is cancelled
        }
    }
}
```

### Use Appropriate Dispatchers

```kotlin
class Repository(
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    suspend fun fetchData(): Data = withContext(ioDispatcher) {
        // IO operations
    }

    suspend fun processData(data: Data): Result = withContext(Dispatchers.Default) {
        // CPU-intensive work
    }
}
```

### Handle Cancellation

```kotlin
suspend fun processLargeDataset(items: List<Item>) {
    for (item in items) {
        ensureActive() // Check for cancellation
        process(item)
    }
}
```

### Avoid Catching CancellationException

```kotlin
suspend fun safeOperation() {
    try {
        riskyOperation()
    } catch (e: CancellationException) {
        throw e // Always rethrow!
    } catch (e: Exception) {
        handleError(e)
    }
}

// Or use runCatching carefully
suspend fun saferOperation() = runCatching {
    riskyOperation()
}.onFailure { e ->
    if (e is CancellationException) throw e
    handleError(e)
}
```

### Inject Dispatchers for Testing

```kotlin
class UserRepository(
    private val api: UserApi,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    suspend fun getUser(id: String): User = withContext(dispatcher) {
        api.fetchUser(id)
    }
}

// In tests
@Test
fun test() = runTest {
    val repository = UserRepository(mockApi, StandardTestDispatcher())
    // Tests run synchronously
}
```

### Use StateFlow for Observable State

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

### Use SharedFlow for Events

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

### Prefer Flow Over Channels

```kotlin
// Prefer
fun observeData(): Flow<Data> = flow {
    while (true) {
        emit(fetchData())
        delay(refreshInterval)
    }
}

// Unless you need multiple producers
fun fanInExample() = channelFlow {
    launch { sendDataFrom(source1) }
    launch { sendDataFrom(source2) }
}
```

## Summary

Kotlin coroutines provide a powerful, efficient way to handle asynchronous programming:

- **Suspend functions** are the foundation, enabling non-blocking code
- **Coroutine builders** (`launch`, `async`, `runBlocking`) create and manage coroutines
- **Structured concurrency** ensures proper lifecycle management
- **Dispatchers** control execution threads
- **Channels** enable communication between coroutines
- **Flow** provides cold asynchronous streams
- **StateFlow and SharedFlow** offer hot streams for state and events

By following best practices and understanding these concepts, you can write clean, efficient, and maintainable asynchronous Kotlin code.
