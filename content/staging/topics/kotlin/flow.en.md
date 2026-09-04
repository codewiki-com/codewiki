---
title: Kotlin Flow Reactive Streams
description: Learn Kotlin Flow for reactive programming including builders, operators, context and exception handling
track: kotlin
section: coroutines
difficulty: advanced
tags:
  - Kotlin
  - Flow
  - reactive
  - coroutines
status: imported
origin: old/src/content/docs/kotlin/flow.en.md
divergence: 0.314
issues: []
legacy:
  category: Kotlin
  subcategory: Async Programming
  order: 14
  lastUpdated: 2026-01-07
---

Kotlin Flow is a powerful reactive streams API built on top of coroutines. It provides a declarative way to handle asynchronous data streams with backpressure support, making it ideal for handling sequences of values over time. This comprehensive guide covers everything from basic concepts to advanced patterns for building reactive applications.

## Understanding Flow

### What is Flow?

Flow is a cold asynchronous data stream that sequentially emits values and completes normally or with an exception. Unlike sequences which are synchronous, Flow integrates seamlessly with coroutines and provides operators for transforming, combining, and handling data streams.

```kotlin
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

fun simpleFlow(): Flow<Int> = flow {
    for (i in 1..3) {
        delay(100) // Simulate async work
        emit(i)    // Emit next value
    }
}

fun main() = runBlocking {
    simpleFlow().collect { value ->
        println("Received: $value")
    }
}
// Output:
// Received: 1
// Received: 2
// Received: 3
```

### Cold vs Hot Streams

**Cold streams** (regular Flow) start producing values only when collected. Each collector gets its own independent stream:

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
// Output:
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

**Hot streams** (StateFlow, SharedFlow) emit values regardless of collectors and share emissions among multiple collectors.

### Flow vs Sequences vs Channels

| Feature | Sequence | Flow | Channel |
|---------|----------|------|---------|
| Execution | Synchronous | Asynchronous | Asynchronous |
| Emissions | Pull-based | Push-based (cold) | Push-based (hot) |
| Backpressure | Natural | Supported | Configurable |
| Cancellation | Via iterator | Cooperative | Cooperative |
| Multiple collectors | Independent | Independent | Shared |

### Setup and Dependencies

Add Flow to your project in `build.gradle.kts`:

```kotlin
dependencies {
    // Core coroutines library (includes Flow)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.0")

    // Android-specific (includes lifecycle-aware collection)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")

    // Testing
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
    testImplementation("app.cash.turbine:turbine:1.0.0")
}
```

## Flow Builders

### The flow Builder

The most common way to create a Flow is using the `flow` builder:

```kotlin
fun numbersFlow(): Flow<Int> = flow {
    println("Flow execution started")
    for (i in 1..5) {
        delay(100)
        emit(i) // Emit values to the stream
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

The `flow` builder creates a cold flow. Code inside the builder only executes when `collect` is called.

### flowOf

Create a flow from a fixed set of values:

```kotlin
fun main() = runBlocking {
    val flow = flowOf(1, 2, 3, 4, 5)

    flow.collect { println(it) }
}
```

### asFlow Extension

Convert collections, sequences, or ranges to flows:

```kotlin
fun main() = runBlocking {
    // From list
    listOf("A", "B", "C").asFlow()
        .collect { println(it) }

    // From range
    (1..10).asFlow()
        .collect { println(it) }

    // From sequence
    generateSequence(1) { it * 2 }
        .take(5)
        .asFlow()
        .collect { println(it) } // 1, 2, 4, 8, 16

    // From array
    arrayOf("x", "y", "z").asFlow()
        .collect { println(it) }
}
```

### emptyFlow

Create an empty flow that completes immediately:

```kotlin
fun main() = runBlocking {
    emptyFlow<Int>()
        .onCompletion { println("Completed") }
        .collect { println("Never printed") }
    // Output: Completed
}
```

### channelFlow

Create a flow with concurrent emissions using channels:

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
    send(3) // Immediate
}

fun main() = runBlocking {
    concurrentFlow().collect { println(it) }
    // Output order: 3, 2, 1 (based on timing)
}
```

### callbackFlow

Bridge callback-based APIs to Flow:

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

// Usage
fun main() = runBlocking {
    locationUpdates()
        .take(5) // Take first 5 updates
        .collect { location ->
            println("Location: ${location.latitude}, ${location.longitude}")
        }
}
```

### MutableSharedFlow and MutableStateFlow

Create hot flows that can emit values imperatively:

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

## Intermediate Operators

Intermediate operators transform the flow without consuming it. They return a new Flow that applies the transformation when collected.

### map

Transform each emitted value:

```kotlin
fun main() = runBlocking {
    (1..5).asFlow()
        .map { value -> value * value }
        .collect { println(it) }
    // Output: 1, 4, 9, 16, 25
}

// With suspend functions
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

Keep only values matching a predicate:

```kotlin
fun main() = runBlocking {
    (1..10).asFlow()
        .filter { it % 2 == 0 }
        .collect { println(it) }
    // Output: 2, 4, 6, 8, 10
}

// Filter with suspend predicate
fun main() = runBlocking {
    flowOf("apple", "banana", "cherry")
        .filter { fruit ->
            delay(50) // Async validation
            fruit.length > 5
        }
        .collect { println(it) }
    // Output: banana, cherry
}
```

### transform

Arbitrary transformation with multiple emissions:

```kotlin
fun main() = runBlocking {
    (1..3).asFlow()
        .transform { value ->
            emit("Processing $value")
            delay(100)
            emit("Completed $value")
        }
        .collect { println(it) }
    // Output:
    // Processing 1
    // Completed 1
    // Processing 2
    // Completed 2
    // Processing 3
    // Completed 3
}
```

### take and drop

Limit the number of emissions:

```kotlin
fun main() = runBlocking {
    // Take first n values
    (1..10).asFlow()
        .take(3)
        .collect { println(it) }
    // Output: 1, 2, 3

    println("---")

    // Drop first n values
    (1..10).asFlow()
        .drop(7)
        .collect { println(it) }
    // Output: 8, 9, 10
}
```

### takeWhile and dropWhile

Conditional take and drop:

```kotlin
fun main() = runBlocking {
    // Take while condition is true
    (1..10).asFlow()
        .takeWhile { it < 5 }
        .collect { println(it) }
    // Output: 1, 2, 3, 4

    println("---")

    // Drop while condition is true
    (1..10).asFlow()
        .dropWhile { it < 5 }
        .collect { println(it) }
    // Output: 5, 6, 7, 8, 9, 10
}
```

### distinctUntilChanged

Skip consecutive duplicates:

```kotlin
fun main() = runBlocking {
    flowOf(1, 1, 2, 2, 2, 3, 1, 1)
        .distinctUntilChanged()
        .collect { println(it) }
    // Output: 1, 2, 3, 1
}

// With custom comparison
data class User(val id: Int, val name: String)

fun main() = runBlocking {
    flowOf(
        User(1, "Alice"),
        User(1, "Alice Updated"),
        User(2, "Bob")
    )
    .distinctUntilChangedBy { it.id }
    .collect { println(it) }
    // Output: User(1, Alice), User(2, Bob)
}
```

### onEach

Perform side effects without modifying values:

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

### scan and runningFold

Accumulate values and emit intermediate results:

```kotlin
fun main() = runBlocking {
    // scan (alias: runningFold)
    (1..5).asFlow()
        .scan(0) { accumulator, value ->
            accumulator + value
        }
        .collect { println(it) }
    // Output: 0, 1, 3, 6, 10, 15 (running sum)
}
```

### withIndex

Wrap values with their index:

```kotlin
fun main() = runBlocking {
    flowOf("a", "b", "c")
        .withIndex()
        .collect { (index, value) ->
            println("$index: $value")
        }
    // Output:
    // 0: a
    // 1: b
    // 2: c
}
```

### Chaining Multiple Operators

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
    // Output:
    // 0: ALICE
    // 1: CHARLIE
}
```

## Terminal Operators

Terminal operators start the flow collection and return a result.

### collect

The most basic terminal operator:

```kotlin
fun main() = runBlocking {
    flowOf(1, 2, 3).collect { value ->
        println("Received: $value")
    }
}
```

### collectLatest

Cancel the previous collector when a new value arrives:

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
        delay(100) // Slow processing
        println("Done with $value")
    }
}
// Output:
// Collecting 1
// Collecting 2
// Collecting 3
// Done with 3
```

### toList and toSet

Collect all values into a collection:

```kotlin
fun main() = runBlocking {
    val list: List<Int> = (1..5).asFlow().toList()
    println(list) // [1, 2, 3, 4, 5]

    val set: Set<String> = flowOf("a", "b", "a", "c").toSet()
    println(set) // [a, b, c]
}
```

### first and firstOrNull

Get the first value:

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

### last and lastOrNull

Get the last value:

```kotlin
fun main() = runBlocking {
    val last = (1..10).asFlow().last()
    println(last) // 10

    val lastOdd = (1..10).asFlow().last { it % 2 != 0 }
    println(lastOdd) // 9
}
```

### single and singleOrNull

Expect exactly one value:

```kotlin
fun main() = runBlocking {
    val single = flowOf(42).single()
    println(single) // 42

    try {
        flowOf(1, 2).single() // Throws IllegalArgumentException
    } catch (e: Exception) {
        println("Error: ${e.message}")
    }

    val singleOrNull = emptyFlow<Int>().singleOrNull()
    println(singleOrNull) // null
}
```

### reduce and fold

Accumulate values into a single result:

```kotlin
fun main() = runBlocking {
    // reduce - no initial value
    val sum = (1..5).asFlow().reduce { acc, value -> acc + value }
    println("Sum: $sum") // 15

    // fold - with initial value
    val product = (1..5).asFlow().fold(1) { acc, value -> acc * value }
    println("Product: $product") // 120

    // fold with different result type
    val concatenated = (1..5).asFlow()
        .fold(StringBuilder()) { acc, value ->
            acc.append(value).append("-")
        }
    println(concatenated) // 1-2-3-4-5-
}
```

### count

Count emissions:

```kotlin
fun main() = runBlocking {
    val total = (1..100).asFlow().count()
    println("Total: $total") // 100

    val evenCount = (1..100).asFlow().count { it % 2 == 0 }
    println("Even count: $evenCount") // 50
}
```

### launchIn

Launch collection in a separate coroutine:

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

## Flow Context

### Context Preservation

Flow preserves the context of the collector and runs emissions in that context by default:

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
// All operations run on the main thread
```

### flowOn Operator

Change the upstream context:

```kotlin
fun dataFlow(): Flow<Int> = flow {
    logThread("Emitting")
    for (i in 1..3) {
        Thread.sleep(100) // Blocking operation
        emit(i)
    }
}

fun main() = runBlocking {
    dataFlow()
        .flowOn(Dispatchers.IO) // Upstream runs on IO
        .map { value ->
            logThread("Mapping $value")
            value * 2
        }
        .flowOn(Dispatchers.Default) // Map runs on Default
        .collect { value ->
            logThread("Collecting $value")
        }
}
// Emitting: DefaultDispatcher-worker-1
// Mapping: DefaultDispatcher-worker-2
// Collecting: main
```

**Important**: `flowOn` only affects upstream operations. It changes the context for code above it in the chain.

### Multiple Context Switches

```kotlin
fun processedFlow(): Flow<String> = flow {
    emit(fetchDataFromNetwork()) // Runs on IO
}
.flowOn(Dispatchers.IO)
.map { data ->
    parseData(data) // Runs on Default
}
.flowOn(Dispatchers.Default)

// Collection runs on the collector's context
fun main() = runBlocking(Dispatchers.Main) {
    processedFlow().collect { result ->
        updateUI(result) // Runs on Main
    }
}
```

### Violating Context Preservation

Flow does not allow emitting from a different context:

```kotlin
// This will throw an IllegalStateException!
fun wrongFlow(): Flow<Int> = flow {
    withContext(Dispatchers.Default) {
        emit(1) // Error: Flow invariant is violated
    }
}

// Correct approach: use flowOn
fun correctFlow(): Flow<Int> = flow {
    emit(1)
}.flowOn(Dispatchers.Default)

// Or use channelFlow for concurrent emissions
fun concurrentFlow(): Flow<Int> = channelFlow {
    withContext(Dispatchers.Default) {
        send(1) // OK in channelFlow
    }
}
```

## Exception Handling

### Collector Try-Catch

Handle exceptions at the collection site:

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
// Output:
// Received: 1
// Received: 2
// Caught: Flow failed!
```

### catch Operator

Handle exceptions declaratively:

```kotlin
fun main() = runBlocking {
    riskyFlow()
        .catch { e ->
            println("Caught: ${e.message}")
            emit(-1) // Emit fallback value
        }
        .collect { println("Collected: $it") }
}
// Output:
// Collected: 1
// Collected: 2
// Caught: Flow failed!
// Collected: -1
```

### Exception Transparency

The `catch` operator only catches upstream exceptions:

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
        // Exceptions here are NOT caught by catch operator!
    }
}
```

### Catching Exceptions in Collectors

Use `onEach` + `catch` + `collect` pattern:

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
    .collect() // Empty collect
}
```

### retryWhen

Retry on failures with custom logic:

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
                delay(1000 * attempt) // Exponential backoff
                true // Retry
            } else {
                false // Don't retry
            }
        }
        .catch { e -> println("Failed after retries: ${e.message}") }
        .collect { println("Received: $it") }
}
```

### retry

Simplified retry with count:

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

## Flow Completion

### onCompletion Operator

Execute code when flow completes (normally or exceptionally):

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

### onCompletion with Upstream Exceptions

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
// Output:
// 1
// Completing with error: Oops!
// Caught: Oops!
```

### onStart Operator

Execute code when collection starts:

```kotlin
fun main() = runBlocking {
    (1..3).asFlow()
        .onStart {
            println("Starting collection...")
            emit(0) // Can emit values!
        }
        .onCompletion { println("Collection completed") }
        .collect { println("Value: $it") }
}
// Output:
// Starting collection...
// Value: 0
// Value: 1
// Value: 2
// Value: 3
// Collection completed
```

### finally in Collect

Use Kotlin's standard `finally` block:

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

## Buffering and Conflation

### buffer Operator

Run collector and emitter concurrently:

```kotlin
fun measureTime(block: suspend () -> Unit): Long {
    val start = System.currentTimeMillis()
    runBlocking { block() }
    return System.currentTimeMillis() - start
}

fun slowFlow(): Flow<Int> = flow {
    for (i in 1..3) {
        delay(100) // Simulate slow emission
        emit(i)
    }
}

fun main() {
    // Without buffer: ~600ms (100+100 for each of 3 values)
    val timeWithoutBuffer = measureTime {
        slowFlow().collect { value ->
            delay(100) // Simulate slow collection
            println("Collected: $value")
        }
    }
    println("Without buffer: ${timeWithoutBuffer}ms")

    // With buffer: ~400ms (emissions and collections overlap)
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

### Buffer Capacity

Control buffer size and overflow behavior:

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

// BufferOverflow options:
// SUSPEND - suspend emitter when buffer is full (default)
// DROP_OLDEST - drop oldest value in buffer
// DROP_LATEST - drop the value being emitted
```

### conflate Operator

Keep only the latest value, dropping intermediate ones:

```kotlin
fun main() = runBlocking {
    flow {
        for (i in 1..10) {
            emit(i)
            delay(50) // Emit every 50ms
        }
    }
    .conflate() // Keep only latest
    .collect { value ->
        println("Collecting $value")
        delay(150) // Process slowly
        println("Processed $value")
    }
}
// Some values will be skipped
```

### collectLatest

Cancel previous collection when new value arrives:

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
        delay(200) // Slow processing
        println("Finished processing $value")
    }
}
// Output:
// Started processing A
// Started processing B
// Started processing C
// Finished processing C
```

### Comparison of Backpressure Strategies

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `buffer()` | Buffers emissions | Improve throughput |
| `buffer(CONFLATED)` | Keep latest only | UI state updates |
| `conflate()` | Drop intermediate | Real-time data |
| `collectLatest` | Cancel previous | Search suggestions |

## Combining Flows

### zip

Pair corresponding elements from two flows:

```kotlin
fun main() = runBlocking {
    val numbers = flowOf(1, 2, 3)
    val letters = flowOf("A", "B", "C")

    numbers.zip(letters) { num, letter ->
        "$num$letter"
    }.collect { println(it) }
    // Output: 1A, 2B, 3C
}
```

Zip completes when the shorter flow completes:

```kotlin
fun main() = runBlocking {
    val flow1 = flowOf(1, 2, 3, 4, 5)
    val flow2 = flowOf("A", "B")

    flow1.zip(flow2) { a, b -> "$a-$b" }
        .collect { println(it) }
    // Output: 1-A, 2-B (stops after 2)
}
```

### combine

Emit whenever any flow emits, using latest values:

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
// Output: 1A, 1B, 2B, 2C
```

### combineTransform

Combine with custom transformation logic:

```kotlin
fun main() = runBlocking {
    val userFlow = flowOf(User("Alice"), User("Bob"))
    val settingsFlow = flowOf(Settings(theme = "dark"))

    userFlow.combineTransform(settingsFlow) { user, settings ->
        emit("Loading ${user.name}'s profile...")
        delay(100) // Simulate loading
        emit("${user.name} with ${settings.theme} theme")
    }.collect { println(it) }
}
```

### merge

Merge multiple flows into one:

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
// Output order depends on timing: B1, A1, B2, A2
```

### Multiple Flow Combination

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

## Flattening Flows

### flatMapConcat

Transform each value to a flow and concatenate sequentially:

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
// Output (sequential):
// Details for item 1
// Extra info for 1
// Details for item 2
// Extra info for 2
// Details for item 3
// Extra info for 3
```

### flatMapMerge

Transform and merge concurrently:

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
// Results may interleave based on timing
```

### flatMapLatest

Cancel previous inner flow when new value arrives:

```kotlin
fun searchItems(query: String): Flow<List<Item>> = flow {
    delay(200) // Simulate network delay
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

### Comparison of Flattening Operators

| Operator | Concurrency | Cancels Previous | Order Preserved |
|----------|-------------|-----------------|-----------------|
| `flatMapConcat` | Sequential | No | Yes |
| `flatMapMerge` | Concurrent | No | No |
| `flatMapLatest` | One at a time | Yes | N/A |

## StateFlow

StateFlow is a hot, observable state holder that always has a value and emits updates to collectors.

### Creating StateFlow

```kotlin
class CounterViewModel {
    // Private mutable state
    private val _count = MutableStateFlow(0)

    // Public read-only state
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

### StateFlow Characteristics

```kotlin
fun main() = runBlocking {
    val stateFlow = MutableStateFlow(1)

    // Always has a value
    println("Current value: ${stateFlow.value}") // 1

    // New collectors get current value immediately
    launch {
        stateFlow.collect { println("Collector 1: $it") }
    }

    delay(50)

    // Only emits on actual changes (equality check)
    stateFlow.value = 1 // No emission (same value)
    stateFlow.value = 2 // Emits 2
    stateFlow.value = 2 // No emission (same value)

    delay(100)
    coroutineContext.cancelChildren()
}
```

### Thread-Safe Updates

```kotlin
class SafeCounter {
    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count.asStateFlow()

    // Atomic update using update function
    fun incrementSafely() {
        _count.update { it + 1 }
    }

    // Compare and set
    fun compareAndSet(expect: Int, update: Int): Boolean {
        return _count.compareAndSet(expect, update)
    }

    // Update and get
    fun incrementAndGet(): Int {
        return _count.updateAndGet { it + 1 }
    }
}
```

### Converting Flow to StateFlow

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

### SharingStarted Options

```kotlin
// Start immediately and keep active forever
SharingStarted.Eagerly

// Start on first subscriber, keep active forever
SharingStarted.Lazily

// Start on first subscriber, stop after last subscriber with delay
SharingStarted.WhileSubscribed(
    stopTimeoutMillis = 5000,  // Wait before stopping
    replayExpirationMillis = 0 // Keep replay cache indefinitely
)
```

## SharedFlow

SharedFlow is a hot flow that can have multiple subscribers and configurable replay and buffer.

### Creating SharedFlow

```kotlin
class EventBus {
    private val _events = MutableSharedFlow<Event>(
        replay = 0,                    // No replay for new subscribers
        extraBufferCapacity = 10,      // Buffer 10 events
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

### SharedFlow for Events

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

// In Activity/Fragment
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

### SharedFlow with Replay

```kotlin
class RecentEventsRepository {
    private val _recentEvents = MutableSharedFlow<Event>(
        replay = 10 // New subscribers get last 10 events
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

### Converting Flow to SharedFlow

```kotlin
class LocationRepository {
    fun observeLocation(): Flow<Location> = callbackFlow {
        // ... location callback setup
        awaitClose { /* cleanup */ }
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
            replay = 1  // New subscribers get last known location
        )
}
```

### StateFlow vs SharedFlow

| Feature | StateFlow | SharedFlow |
|---------|-----------|------------|
| Initial value | Required | Not required |
| Access current value | `value` property | Via `replayCache` |
| Duplicate filtering | Yes (structural equality) | No |
| Replay count | Always 1 | Configurable |
| Use case | UI state | Events/commands |

```kotlin
class ViewModel {
    // StateFlow for state (always has value, filters duplicates)
    private val _uiState = MutableStateFlow(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    // SharedFlow for one-time events (no initial value, no filtering)
    private val _events = MutableSharedFlow<UiEvent>()
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()
}
```

## Channel-Based Flows

### channelFlow Builder

Create flows with channel-like semantics:

```kotlin
fun multiSourceFlow(): Flow<Data> = channelFlow {
    // Launch multiple coroutines that send to the same channel
    launch {
        dataSource1.observe().collect { send(it) }
    }
    launch {
        dataSource2.observe().collect { send(it) }
    }

    // Channel closes when channelFlow scope completes
}
```

### produceIn

Convert a flow to a channel:

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

Convert a channel to a flow:

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

Similar to consumeAsFlow but reusable:

```kotlin
class DataProducer {
    private val channel = Channel<Data>()

    val dataFlow: Flow<Data> = channel.receiveAsFlow()

    suspend fun produce(data: Data) {
        channel.send(data)
    }
}
```

## Testing Flows

### Basic Flow Testing

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

### Testing with Turbine

Turbine provides a convenient DSL for testing flows:

```kotlin
// Add dependency: testImplementation("app.cash.turbine:turbine:1.0.0")

class ViewModelTest {
    @Test
    fun `state updates correctly`() = runTest {
        val viewModel = CounterViewModel()

        viewModel.count.test {
            assertEquals(0, awaitItem()) // Initial value

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

### Testing StateFlow

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

### Testing with Virtual Time

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

### Testing Exception Handling

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

## Real-World Patterns

### Search with Debounce

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

### Polling with Automatic Retry

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
            // Let retry handle it
            throw e
        }
        delay(intervalMs)
    }
}.retryWhen { cause, attempt ->
    if (attempt < maxRetries && cause is IOException) {
        delay(1000 * (attempt + 1)) // Exponential backoff
        true
    } else {
        false
    }
}

// Usage
class StockPriceRepository {
    fun observeStockPrice(symbol: String): Flow<StockPrice> = pollingFlow(
        intervalMs = 5000,
        maxRetries = 3
    ) {
        api.getStockPrice(symbol)
    }
}
```

### Combining Multiple Data Sources

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

### Pagination Flow

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

### Form Validation Flow

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

### WebSocket Connection Flow

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

## Best Practices

### Prefer Flow Over Callbacks

```kotlin
// Avoid: Callback-based API
interface DataCallback {
    fun onData(data: Data)
    fun onError(error: Throwable)
}

fun fetchData(callback: DataCallback) { ... }

// Prefer: Flow-based API
fun observeData(): Flow<Data> = callbackFlow {
    val callback = object : DataCallback {
        override fun onData(data: Data) { trySend(data) }
        override fun onError(error: Throwable) { close(error) }
    }
    registerCallback(callback)
    awaitClose { unregisterCallback(callback) }
}
```

### Use StateFlow for UI State

```kotlin
class ViewModel {
    // Good: Single state object with StateFlow
    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun updateState(transform: (UiState) -> UiState) {
        _state.update(transform)
    }
}

// Collect safely in UI
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.state.collect { state ->
            render(state)
        }
    }
}
```

### Use SharedFlow for One-Time Events

```kotlin
class ViewModel {
    private val _events = MutableSharedFlow<UiEvent>()
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()

    suspend fun navigate(route: String) {
        _events.emit(UiEvent.Navigate(route))
    }
}
```

### Handle Errors Appropriately

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

// Or use runCatching
fun observeData(): Flow<kotlin.Result<Data>> = flow {
    emit(runCatching { fetchData() })
}
```

### Cancel Flows Properly

```kotlin
class MyActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Good: Lifecycle-aware collection
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

### Use Appropriate Operators

```kotlin
// Use debounce for search input
searchQuery
    .debounce(300)
    .flatMapLatest { query -> search(query) }

// Use distinctUntilChanged to avoid redundant processing
stateFlow
    .map { it.selectedItem }
    .distinctUntilChanged()

// Use conflate for real-time updates where latest matters
sensorData
    .conflate()
    .collect { updateDisplay(it) }
```

### Test Flows Thoroughly

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

### Document Flow Behavior

```kotlin
/**
 * Observes user data changes.
 *
 * This flow:
 * - Emits the current user immediately upon collection
 * - Emits updates whenever user data changes
 * - Completes when user logs out
 * - Throws [AuthException] if authentication fails
 *
 * Runs on [Dispatchers.IO] internally.
 */
fun observeUser(): Flow<User>
```

## Summary

Kotlin Flow provides a powerful, declarative API for handling asynchronous data streams:

- **Flow builders** (`flow`, `flowOf`, `channelFlow`) create cold streams
- **Intermediate operators** (`map`, `filter`, `transform`) transform data without consumption
- **Terminal operators** (`collect`, `toList`, `first`) consume and process the stream
- **Context operators** (`flowOn`) control execution context
- **Exception handling** (`catch`, `retry`) manage errors gracefully
- **Buffering** (`buffer`, `conflate`, `collectLatest`) handle backpressure
- **Combining operators** (`zip`, `combine`, `merge`) work with multiple flows
- **StateFlow** provides observable state with current value access
- **SharedFlow** enables event broadcasting to multiple subscribers

By mastering Flow, you can build reactive, efficient, and maintainable Kotlin applications that handle asynchronous data elegantly.
