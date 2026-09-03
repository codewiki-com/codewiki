---
title: Kotlin Coroutine Basics
description: Comprehensive guide to Kotlin coroutines - learn suspend functions, launch, async, structured concurrency, and Flow for modern asynchronous programming without callbacks.
track: kotlin
section: coroutines
difficulty: intermediate
tags:
  - coroutines
  - async
  - concurrency
  - suspend
  - Flow
  - structured-concurrency
status: imported
origin: old/src/content/docs/kotlin/coroutine-basics.en.md
divergence: 0.309
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Kotlin
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---

## Concept Explanation

Kotlin coroutines represent a paradigm shift in asynchronous programming, providing a way to write asynchronous, non-blocking code that looks and behaves like synchronous code. Unlike traditional callback-based approaches or thread management, coroutines offer lightweight concurrency primitives that make it easier to handle multiple concurrent operations without the overhead of creating numerous threads.

### Historical Context

Before coroutines, developers had to choose between:

- **Threads**: Heavy resources, synchronization overhead, difficult scaling
- **Callbacks**: "Callback hell," hard to maintain, exception handling complexity
- **Reactive streams**: Steep learning curve, additional library dependency

Kotlin coroutines, introduced in version 1.0 and building upon research in other languages like Python and Lua, provide a middle ground: the ability to suspend execution without blocking threads, resuming when needed.

### The Problem Solved

Coroutines solve the fundamental problem of coordinating multiple concurrent tasks efficiently:

- **Non-blocking I/O operations**: Network requests, database queries, file operations can happen concurrently
- **Simplified asynchronous code**: Write sequential logic without nested callbacks
- **Resource efficiency**: Thousands of coroutines can run on a handful of threads
- **Structured concurrency**: Proper lifecycle management and cancellation propagation
- **Exception handling**: Traditional try-catch works with asynchronous code

## Core Principles

### Suspension and Resumption

The core concept of coroutines is **suspension** - the ability to pause execution at specific points (marked by `suspend` functions) and resume later without consuming a thread.

```kotlin
suspend fun fetchData(): String = "data"
// Execution can pause here, thread is released
```

### Structured Concurrency

Coroutines operate within scopes that define their lifetime and cancellation behavior. A parent coroutine waiting for its children ensures proper resource cleanup.

```kotlin
launch {  // Coroutine scope
    launch { }  // Child coroutine
    async { }   // Child coroutine
}
// All children complete or are cancelled before scope exits
```

### Dispatchers and Context

Coroutines execute on specific `Dispatcher` which determines which thread or thread pool runs the coroutine. The `CoroutineContext` carries configuration like dispatcher, job, and exception handler.

```kotlin
launch(Dispatchers.IO) {
    // Executes on IO thread pool
}
```

### Light Weight

A coroutine is not a thread. Thousands can run efficiently on a small number of threads through suspension and switching.

### Cancellation Propagation

Cancellation flows hierarchically through parent-child relationships, providing clean resource cleanup.

## Key Points

### Suspend Functions

- Special functions marked with `suspend` keyword that can only be called from other `suspend` functions or coroutine builders
- They can be paused and resumed without blocking the underlying thread
- Enable writing async code in a sequential style

### Coroutine Builders

- **`launch`**: Fire-and-forget coroutine, returns `Job`
- **`async`**: Returns a `Deferred<T>` with result, can be awaited
- **`runBlocking`**: Blocking version for bridges between sync and async (rarely needed in production)

### Context Elements

- **Dispatcher**: Specifies execution thread (Main, IO, Default, Unconfined)
- **Job**: Represents coroutine lifecycle with cancellation and parent-child relationships
- **ExceptionHandler**: Catches uncaught exceptions in coroutines

### Coroutine State

Coroutines have distinct states:
- **New**: Created but not started
- **Active**: Running or suspended but not completed
- **Completed**: Finished successfully
- **Cancelled**: Terminated via cancellation
- **Failed**: Terminated with exception

### Flow for Reactive Streams

- **Cold flow**: Emits values only when collected, restarted for each collector
- **Hot flow**: StateFlow and SharedFlow emit whether or not there are collectors
- **Back-pressure**: Handles cases where producer is faster than consumer

## Code Examples

### Basic Launch Example

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    println("Start")

    launch {
        delay(1000)  // Non-blocking delay
        println("Hello from coroutine")
    }

    println("Main continues")
    // Main waits for all children before exiting
}

// Output:
// Start
// Main continues
// Hello from coroutine (after 1 second)
```

### Async with Result

```kotlin
suspend fun fetchUserData(): String = "User123"
suspend fun fetchPosts(): List<String> = listOf("Post1", "Post2")

fun main() = runBlocking {
    val userData = async { fetchUserData() }
    val posts = async { fetchPosts() }

    println("User: ${userData.await()}")
    println("Posts: ${posts.await()}")
}
```

### Dispatcher Selection

```kotlin
fun main() = runBlocking {
    // Default dispatcher - suitable for CPU-intensive work
    launch(Dispatchers.Default) {
        println("Running on: ${Thread.currentThread().name}")
        heavyComputation()
    }

    // IO dispatcher - optimized for I/O operations
    launch(Dispatchers.IO) {
        println("Running on: ${Thread.currentThread().name}")
        val response = fetchFromNetwork()
    }

    // Main dispatcher - UI updates (Android)
    launch(Dispatchers.Main) {
        println("Running on: ${Thread.currentThread().name}")
        updateUI()
    }
}
```

### Suspend Functions

```kotlin
suspend fun getUserProfile(userId: String): UserProfile {
    // Can only be called from suspend function or coroutine
    val response = fetchFromServer(userId)
    val posts = getUserPosts(userId)
    return UserProfile(response, posts)
}

// Calling from coroutine
launch {
    val profile = getUserProfile("123")
}

// Calling from another suspend function
suspend fun loadDashboard(userId: String): Dashboard {
    val profile = getUserProfile(userId)
    return Dashboard(profile)
}
```

### Exception Handling

```kotlin
fun main() = runBlocking {
    try {
        val result = async {
            throw Exception("Operation failed")
        }.await()
    } catch (e: Exception) {
        println("Caught exception: ${e.message}")
    }
}

// With CoroutineExceptionHandler
val exceptionHandler = CoroutineExceptionHandler { _, exception ->
    println("Caught: $exception")
}

launch(exceptionHandler) {
    throw Exception("This will be caught")
}
```

### Flow Example

```kotlin
fun numbers(): Flow<Int> = flow {
    for (i in 1..5) {
        delay(100)
        emit(i)  // Emit values to collectors
    }
}

fun main() = runBlocking {
    numbers()
        .map { it * 2 }          // Transform values
        .filter { it > 4 }       // Filter values
        .collect { value ->      // Consume values
            println(value)
        }
}

// Output:
// 6
// 8
// 10
```

### Timeout and Cancellation

```kotlin
fun main() = runBlocking {
    try {
        withTimeout(1000) {
            repeat(3) {
                println("Item $it")
                delay(500)
            }
        }
    } catch (e: TimeoutCancellationException) {
        println("Timeout occurred")
    }
}

// Explicit cancellation
val job = launch {
    repeat(10) {
        println("Task $it")
        delay(500)
    }
}

delay(1500)
job.cancel()  // Cancel after 1.5 seconds
```

### Context and Parent-Child Relationship

```kotlin
fun main() = runBlocking {
    launch {
        println("Parent started")

        launch {
            delay(100)
            println("Child 1 completed")
        }

        launch {
            delay(200)
            println("Child 2 completed")
        }

        println("Parent continues (children still running)")
    }

    println("Main ends")
    // Main waits for parent to complete
}

// Output:
// Parent started
// Parent continues (children still running)
// Child 1 completed
// Child 2 completed
// Main ends
```

### StateFlow for State Management

```kotlin
class CounterViewModel {
    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count.asStateFlow()

    fun increment() {
        _count.value += 1
    }
}

fun main() = runBlocking {
    val viewModel = CounterViewModel()

    launch {
        viewModel.count.collect { value ->
            println("Count: $value")
        }
    }

    viewModel.increment()
    delay(100)
    viewModel.increment()
    delay(100)
}
```

## Best Practices

### Use Structured Concurrency

Always launch coroutines within a proper scope - never use `GlobalScope`.

```kotlin
// Good
fun loadData() = viewModelScope.launch {
    val data = fetchData()
}

// Avoid
fun loadData() {
    GlobalScope.launch {  // Bad: no cancellation, hard to test
        val data = fetchData()
    }
}
```

### Choose the Right Dispatcher

- **Dispatchers.Main**: UI updates
- **Dispatchers.IO**: Network, database, file operations
- **Dispatchers.Default**: CPU-intensive work
- **Dispatchers.Unconfined**: Rarely needed, use only for special cases

```kotlin
launch(Dispatchers.IO) {
    val data = database.query()
    withContext(Dispatchers.Main) {
        updateUI(data)
    }
}
```

### Proper Exception Handling

Use `CoroutineExceptionHandler` for global error handling in `launch`. For `async`, handle exceptions explicitly.

```kotlin
// launch with exception handler
val handler = CoroutineExceptionHandler { _, exception ->
    logError(exception)
}

launch(handler) {
    riskyOperation()
}

// async should have try-catch
try {
    val result = async { riskyOperation() }.await()
} catch (e: Exception) {
    handleError(e)
}
```

### Cancel Properly

Store references to jobs and cancel them when needed. Use scopes that auto-cancel.

```kotlin
class DataManager {
    private val scope = CoroutineScope(Job() + Dispatchers.Main)

    fun loadData() {
        scope.launch {
            val data = fetchData()
        }
    }

    fun cleanup() {
        scope.cancel()  // Cancels all running coroutines
    }
}
```

### Use withContext for Context Switching

When you need to switch dispatchers, use `withContext` instead of nested `launch`.

```kotlin
// Good
suspend fun loadUserData(userId: String) {
    val user = withContext(Dispatchers.IO) {
        fetchUser(userId)
    }
    // User is loaded here, context switched back
    updateUI(user)
}

// Less efficient
suspend fun loadUserData(userId: String) {
    var user: User? = null
    launch(Dispatchers.IO) {
        user = fetchUser(userId)
    }.join()  // Blocking wait
    updateUI(user!!)
}
```

### Leverage Scope Functions with Coroutines

Kotlin's scope functions (`apply`, `also`) work well with coroutines for concise code.

```kotlin
launch {
    val users = fetchUsers().apply {
        forEach { user ->
            println("Processing $user")
        }
    }
}
```

## Common Pitfalls

### Blocking Inside Coroutines

```kotlin
// Bad: Blocks the thread
launch {
    Thread.sleep(1000)  // Don't do this
    println("Done")
}

// Good: Suspends without blocking
launch {
    delay(1000)  // This is the coroutine way
    println("Done")
}
```

### Missing Exception Handling

```kotlin
// Bad: Exceptions are silently lost
launch {
    throw Exception("This is swallowed")  // Will crash unless there's a handler
}

// Good: Explicit handling
launch {
    try {
        riskyOperation()
    } catch (e: Exception) {
        handleError(e)
    }
}
```

### Returning from Suspend Functions Incorrectly

```kotlin
// Bad: Can't call suspend function from regular function
fun loadData() {
    val data = fetchData()  // Compile error
}

// Good: Use coroutine scope
fun loadData() = viewModelScope.launch {
    val data = fetchData()
}
```

### Not Respecting Cancellation

```kotlin
// Bad: Ignores cancellation
launch {
    try {
        repeat(1000000) { i ->
            doWork(i)  // Won't exit early if cancelled
        }
    } catch (e: CancellationException) {
        throw e  // Must re-throw cancellation
    }
}

// Good: Check for cancellation
launch {
    repeat(1000000) { i ->
        if (!isActive) return@launch  // Exit early on cancellation
        doWork(i)
    }
}
```

### Using launch When async is More Appropriate

```kotlin
// Bad: Can't get result
val job = launch {
    val result = fetchData()
}
val data = job.result  // No such property

// Good: Use async for results
val deferred = async {
    fetchData()
}
val data = deferred.await()
```

### Sharing Mutable State Unsafely

```kotlin
// Bad: Race condition
var count = 0
launch {
    repeat(1000) { count++ }
}
launch {
    repeat(1000) { count++ }
}

// Good: Use atomic or mutex
val count = AtomicInteger(0)
launch {
    repeat(1000) { count.incrementAndGet() }
}
launch {
    repeat(1000) { count.incrementAndGet() }
}
```

### Ignoring Flow Collection Differences

```kotlin
// Bad: Creates separate Flow instances
fun getNumbers(): Flow<Int> = flow {
    // ...
}

// Each collector restarts the flow
getNumbers().collect { }

// Good: Hot flow when needed
val numbers = MutableSharedFlow<Int>()
// All collectors see the same emissions
```

## Performance Considerations

### Context Switching Overhead

Each `withContext` call involves context switching. Minimize unnecessary switches.

```kotlin
// Inefficient: Multiple context switches
launch(Dispatchers.IO) {
    val user = withContext(Dispatchers.Default) { parseUser() }
    val posts = withContext(Dispatchers.Default) { parsePosts() }
    val comments = withContext(Dispatchers.Default) { parseComments() }
}

// Better: Batch operations
launch(Dispatchers.IO) {
    val user = parseUser()
    val posts = parsePosts()
    val comments = parseComments()
}
```

### Dispatcher Thread Pool Size

The IO dispatcher maintains a larger thread pool than Default, suitable for blocking I/O but not CPU work.

```kotlin
// Good distribution
launch(Dispatchers.IO) { networkCall() }
launch(Dispatchers.Default) { heavyComputation() }
```

### Flow Collector Efficiency

Cold flows are recreated for each collector. Cache when needed.

```kotlin
// Inefficient if multiple collectors
val data = fetchData()  // Cold flow, created fresh each time
data.collect { }
data.collect { }

// Better: Use SharedFlow or cache
val cachedData = fetchData().shareIn(
    scope = viewModelScope,
    started = SharingStarted.Lazily,
    replay = 1
)
cachedData.collect { }
cachedData.collect { }
```

### Memory Usage

Long-running coroutines retain references to objects. Be mindful of memory:

```kotlin
// Potential memory leak if coroutine runs indefinitely
launch {
    while (true) {
        val data = expensiveObject()
        // If this never completes, expensiveObject is held
        delay(1000)
    }
}

// Better: Explicit cleanup
launch {
    try {
        while (isActive) {
            val data = expensiveObject()
            delay(1000)
        }
    } finally {
        cleanup()
    }
}
```

### Batching Async Operations

```kotlin
// Inefficient: Sequential
val users = userIds.map { async { fetchUser(it) } }.awaitAll()

// Better: Batch with concurrent limits
val users = userIds.map { userId ->
    async { fetchUser(userId) }
}.awaitAll()
// But control concurrency with custom implementation if needed
```

## Real-world Scenarios

### Scenario 1: Loading Data for UI

```kotlin
class UserViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    fun loadUser(userId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = UiState.Loading

                val user = withContext(Dispatchers.IO) {
                    apiService.getUser(userId)
                }

                _uiState.value = UiState.Success(user)
            } catch (e: Exception) {
                _uiState.value = UiState.Error(e.message ?: "Unknown error")
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

### Scenario 2: Parallel Data Fetching

```kotlin
suspend fun loadDashboard(userId: String): Dashboard {
    return withContext(Dispatchers.IO) {
        val userDeferred = async { fetchUser(userId) }
        val postsDeferred = async { fetchPosts(userId) }
        val statsDeferred = async { fetchStats(userId) }

        Dashboard(
            user = userDeferred.await(),
            posts = postsDeferred.await(),
            stats = statsDeferred.await()
        )
    }
}
```

### Scenario 3: Reactive Stream Processing

```kotlin
fun processUserUpdates(userIdFlow: Flow<String>): Flow<UserWithPosts> {
    return userIdFlow
        .distinctUntilChanged()
        .flatMapLatest { userId ->
            fetchUserWithPosts(userId)
        }
        .catch { e ->
            emit(UserWithPosts.Error(e))
        }
}

// Usage
viewModelScope.launch {
    searchQuery
        .flatMapLatest { query -> performSearch(query) }
        .collect { results -> displayResults(results) }
}
```

### Scenario 4: Timeout with Retry

```kotlin
suspend fun fetchWithRetry(
    maxRetries: Int = 3,
    timeoutMs: Long = 5000
): Result {
    repeat(maxRetries) { attempt ->
        try {
            return withTimeout(timeoutMs) {
                apiService.fetch()
            }
        } catch (e: TimeoutCancellationException) {
            if (attempt == maxRetries - 1) throw e
            delay(100 * (attempt + 1))  // Exponential backoff
        }
    }
}
```

### Scenario 5: Continuous Updates

```kotlin
fun startLocationUpdates(): Flow<Location> = flow {
    while (currentCoroutineContext().isActive) {
        val location = locationService.getLocation()
        emit(location)
        delay(1000)  // Update every second
    }
}

// Usage
viewModelScope.launch {
    startLocationUpdates()
        .collect { location ->
            updateMap(location)
        }
}
```

## Interview Points

### Q1: What's the difference between launch and async?

**Answer**: `launch` returns a `Job` and is fire-and-forget, useful when you don't need a result. `async` returns a `Deferred<T>` and allows you to retrieve the result via `await()`. Use `launch` when you don't care about the result, `async` when you do.

### Q2: Explain suspend functions

**Answer**: Suspend functions are marked with the `suspend` keyword and can be paused and resumed without blocking threads. They can only be called from other suspend functions or coroutine builders. They enable sequential-looking async code.

### Q3: What is structured concurrency?

**Answer**: Structured concurrency ensures coroutines operate within defined scopes with proper parent-child relationships. When a parent completes, all children are cancelled. This provides automatic resource cleanup and prevents resource leaks.

### Q4: How does withContext differ from launch?

**Answer**: `withContext` is a suspend function that switches the dispatcher and waits for its block to complete, returning the result. `launch` is a coroutine builder that returns immediately with a `Job`. Use `withContext` for dispatcher switches within a coroutine, `launch` to spawn new concurrent work.

### Q5: What happens if an exception is thrown in launch vs async?

**Answer**: In `launch`, uncaught exceptions crash the coroutine. Handle them with `CoroutineExceptionHandler` or try-catch. In `async`, exceptions are encapsulated in the `Deferred` and thrown when you call `await()`.

### Q6: How do you cancel coroutines?

**Answer**: Call `job.cancel()` on the Job, or use `scope.cancel()` to cancel all coroutines in a scope. Use `withTimeout` or `withTimeoutOrNull` for automatic cancellation. Check `isActive` in loops to respect cancellation.

### Q7: What is the difference between StateFlow and SharedFlow?

**Answer**: `StateFlow` holds a single state value, all new collectors immediately receive the current state. `SharedFlow` is more general with configurable replay and buffer size. StateFlow is for state management, SharedFlow for general event publishing.

### Q8: How does Flow differ from LiveData?

**Answer**: Flow is a cold, suspend-based reactive type. Each collector creates a new flow instance. LiveData is hot and lifecycle-aware (Android-specific). Flow is more functional and composable with operators.

### Q9: What are dispatchers and when to use each?

**Answer**: Dispatchers specify execution threads. Main (UI), IO (I/O operations), Default (CPU work), Unconfined (rarely used). Choose based on the operation type.

### Q10: How do you test coroutines?

**Answer**: Use `runTest` from `kotlinx-coroutines-test`, inject `TestDispatchers`, and use virtual time control to avoid actual delays in tests.

## Further Reading

### Official Documentation

- [Kotlin Coroutines Official Guide](https://kotlinlang.org/docs/coroutines-overview.html)
- [Structured Concurrency](https://kotlinlang.org/docs/composing-suspending-functions.html)
- [Coroutine Context and Dispatchers](https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html)
- [Flow API](https://kotlinlang.org/docs/flow.html)

### Advanced Topics

- [Channels](https://kotlinlang.org/docs/channels.html)
- [Shared Mutable State and Concurrency](https://kotlinlang.org/docs/shared-mutable-state-and-concurrency.html)

### Articles and Resources

- [Kotlin Coroutines: Design and Implementation](https://www.youtube.com/watch?v=Y_eMCLF-d-4) - Conference talk
- [Coroutine Exception Handling](https://kotlinlang.org/docs/exception-handling.html)
- [Testing Coroutines](https://kotlinlang.org/docs/debug-coroutines-with-idea.html)

### Libraries and Tools

- [kotlinx.coroutines on GitHub](https://github.com/Kotlin/kotlinx.coroutines)
- [Android Architecture Components](https://developer.android.com/topic/libraries/architecture) - Integration with coroutines
- [Ktor Client](https://ktor.io/docs/client.html) - Coroutine-based HTTP client

### Related Topics

- Java's Virtual Threads (Project Loom) - Similar concept in Java 19+
- Python's asyncio - Inspiration for Kotlin coroutines
- C# async/await - Early implementation of suspend function concept
