---
title: Kotlin Channel 通道
description: 深入理解 Kotlin Channel 通道机制，掌握协程间通信、缓冲策略、扇出扇入等高级并发模式
track: kotlin
section: coroutines
difficulty: advanced
tags:
  - Kotlin
  - Channel
  - 协程
  - 并发
  - CSP
status: imported
origin: old/src/content/docs/kotlin/channels.en.md
divergence: 0.204
issues:
  - title-lang-en
  - title-language
legacy:
  category: Kotlin
  subcategory: 并发
  order: 15
  lastUpdated: 2026-01-07
---

Channel is the core primitive in Kotlin coroutines for inter-coroutine communication. It implements the CSP (Communicating Sequential Processes) concurrency model, providing a type-safe, non-blocking way to pass data between coroutines. We'll cover all aspects of Channels in depth, from basic concepts to advanced application patterns.

## Concept Explanation

### What is a Channel

A Channel is a queue-like data structure that allows safe data transfer between different coroutines. Unlike `BlockingQueue`, Channel uses suspending operations instead of blocking operations, meaning it doesn't block threads but suspends coroutines until the operation can complete.

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // Create a Channel
    val channel = Channel<Int>()

    // Producer coroutine
    launch {
        for (x in 1..5) {
            println("Sending: $x")
            channel.send(x) // Send data to channel
        }
        channel.close() // Close the channel
    }

    // Consumer coroutine
    launch {
        for (value in channel) { // Receive data from channel
            println("Received: $value")
        }
    }
}
```

### Channel vs Flow

Both Channel and Flow are used for handling asynchronous data streams, but they have fundamental differences:

| Feature | Channel | Flow |
|---------|---------|------|
| Temperature | Hot | Cold |
| Data Consumption | Values disappear after consumption | Each collection executes independently |
| Multiple Subscribers | Shared consumption | Independent execution |
| Primary Use | Inter-coroutine communication | Data transformation streams |
| Backpressure Handling | Requires manual configuration | Built-in support |

### CSP Model

Channel implements the CSP (Communicating Sequential Processes) concurrency model, whose core idea is:

> Don't communicate by sharing memory; share memory by communicating.

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// CSP style: communicate through Channel
fun main() = runBlocking {
    val channel = Channel<String>()

    // Process 1: Produce data
    launch {
        channel.send("Hello")
        channel.send("World")
        channel.close()
    }

    // Process 2: Consume data
    launch {
        for (msg in channel) {
            println(msg)
        }
    }
}
```

## Core Principles

### Channel Internal Structure

A Channel internally maintains a buffer and two waiting queues:

```
┌─────────────────────────────────────────────────┐
│                   Channel                       │
├─────────────────────────────────────────────────┤
│  Sender Queue        Buffer       Receiver Queue│
│  ┌─────────┐    ┌───────────┐   ┌─────────┐    │
│  │ S1 │ S2 │ -> │ D1│D2│D3│ -> │ R1 │ R2 │    │
│  └─────────┘    └───────────┘   └─────────┘    │
├─────────────────────────────────────────────────┤
│  State: Open/Closed                             │
└─────────────────────────────────────────────────┘
```

Workflow:
1. **Send operation**: If the buffer has space, data is enqueued; otherwise the sender suspends
2. **Receive operation**: If the buffer has data, data is dequeued; otherwise the receiver suspends
3. **Close operation**: Marks the channel as closed and wakes up all waiters

### Suspension and Resumption Mechanism

Channel's `send` and `receive` are both suspending functions:

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // Unbuffered channel (Rendezvous Channel)
    val channel = Channel<Int>()

    launch {
        println("Preparing to send...")
        channel.send(1) // Suspends until there's a receiver
        println("Send complete")
    }

    delay(1000L)
    println("Preparing to receive...")
    val value = channel.receive() // Sender resumes at this point
    println("Received: $value")
}
// Output:
// Preparing to send...
// (waits 1 second)
// Preparing to receive...
// Send complete
// Received: 1
```

### Fairness Guarantee

Channel guarantees FIFO (First-In-First-Out) order:

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()

    // Multiple senders
    repeat(3) { id ->
        launch {
            channel.send(id)
            println("Sender $id completed sending")
        }
    }

    delay(100L)

    // Receive in send order
    repeat(3) {
        val value = channel.receive()
        println("Received: $value")
    }
}
```

## Key Points

### Channel Types

Kotlin provides multiple Channel types, distinguished by the `capacity` parameter:

#### Rendezvous Channel (Unbuffered)

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // Default is unbuffered channel
    val channel = Channel<Int>() // Equivalent to Channel<Int>(Channel.RENDEZVOUS)

    launch {
        println("Sending 1")
        channel.send(1) // Suspends until received
        println("Sending 2")
        channel.send(2)
        channel.close()
    }

    delay(500L)
    println("Starting to receive")
    for (x in channel) {
        println("Received: $x")
        delay(500L)
    }
}
```

Characteristics:
- Capacity of 0
- Send and receive must "rendezvous"
- Similar to direct handoff

#### Buffered Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // Buffer capacity of 3
    val channel = Channel<Int>(3)

    launch {
        repeat(5) {
            println("Sending $it")
            channel.send(it) // First 3 won't suspend
        }
        channel.close()
    }

    delay(1000L)
    for (x in channel) {
        println("Received: $x")
    }
}
// Output:
// Sending 0
// Sending 1
// Sending 2
// Sending 3  <- suspends here
// Received: 0
// Sending 4
// Received: 1
// ...
```

Characteristics:
- Specified fixed capacity
- Sender suspends when buffer is full
- Receiver suspends when buffer is empty

#### Conflated Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // Conflated channel, keeps only the latest value
    val channel = Channel<Int>(Channel.CONFLATED)

    launch {
        repeat(5) {
            println("Sending $it")
            channel.send(it)
        }
        channel.close()
    }

    delay(100L) // Wait for all sends to complete

    for (x in channel) {
        println("Received: $x")
    }
}
// Output:
// Sending 0
// Sending 1
// Sending 2
// Sending 3
// Sending 4
// Received: 4  <- only receives the last one
```

Characteristics:
- New values overwrite old values
- Send never suspends
- Only keeps the latest value

#### Unlimited Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // Unlimited capacity channel
    val channel = Channel<Int>(Channel.UNLIMITED)

    launch {
        repeat(100) {
            channel.send(it) // Never suspends
        }
        println("Sending complete")
        channel.close()
    }

    delay(100L)
    var count = 0
    for (x in channel) {
        count++
    }
    println("Received $count elements total")
}
```

Characteristics:
- Theoretically unlimited capacity
- Send never suspends
- May cause memory issues

### Channel Capacity Comparison

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // Compare behavior of different capacities
    val capacities = mapOf(
        "RENDEZVOUS" to Channel.RENDEZVOUS,  // 0
        "BUFFERED(3)" to 3,
        "CONFLATED" to Channel.CONFLATED,
        "UNLIMITED" to Channel.UNLIMITED
    )

    for ((name, capacity) in capacities) {
        println("\n=== $name ===")
        val channel = Channel<Int>(capacity)
        val startTime = System.currentTimeMillis()

        launch {
            repeat(5) {
                val time = System.currentTimeMillis() - startTime
                println("[$time ms] Sending $it")
                channel.send(it)
            }
            channel.close()
        }

        delay(10L) // Give sender some time
        for (x in channel) {
            val time = System.currentTimeMillis() - startTime
            println("[$time ms] Received $x")
        }
    }
}
```

## Code Examples

### Basic Send and Receive

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<String>()

    // Producer
    launch {
        val fruits = listOf("Apple", "Banana", "Orange", "Grape")
        for (fruit in fruits) {
            delay(100L)
            println("Sending: $fruit")
            channel.send(fruit)
        }
        channel.close()
        println("Channel closed")
    }

    // Consumer
    launch {
        // Method 1: Using for loop
        for (fruit in channel) {
            println("Received: $fruit")
        }
        println("Receiving complete")
    }
}
```

### Using the produce Builder

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// produce returns ReceiveChannel
fun CoroutineScope.produceNumbers(): ReceiveChannel<Int> = produce {
    var x = 1
    while (true) {
        send(x++)
        delay(100L)
    }
}

fun main() = runBlocking {
    val numbers = produceNumbers()

    // Take only first 5
    repeat(5) {
        println(numbers.receive())
    }

    numbers.cancel() // Cancel the producer
    println("Producer cancelled")
}
```

### Using the actor Builder

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// Define message types
sealed class CounterMsg
object IncCounter : CounterMsg()
class GetCounter(val response: CompletableDeferred<Int>) : CounterMsg()

// actor is a coroutine that receives messages
fun CoroutineScope.counterActor() = actor<CounterMsg> {
    var counter = 0
    for (msg in channel) {
        when (msg) {
            is IncCounter -> counter++
            is GetCounter -> msg.response.complete(counter)
        }
    }
}

fun main() = runBlocking {
    val counter = counterActor()

    // Concurrently increment counter
    repeat(100) {
        launch {
            counter.send(IncCounter)
        }
    }

    delay(100L)

    // Get counter value
    val response = CompletableDeferred<Int>()
    counter.send(GetCounter(response))
    println("Counter value: ${response.await()}")

    counter.close()
}
```

### trySend and tryReceive

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>(2) // Capacity of 2

    // trySend: attempt to send, doesn't suspend
    repeat(5) {
        val result = channel.trySend(it)
        println("Attempt to send $it: ${if (result.isSuccess) "success" else "failed"}")
    }

    println("---")

    // tryReceive: attempt to receive, doesn't suspend
    repeat(5) {
        val result = channel.tryReceive()
        println("Attempt to receive: ${if (result.isSuccess) result.getOrNull() else "failed"}")
    }
}
// Output:
// Attempt to send 0: success
// Attempt to send 1: success
// Attempt to send 2: failed
// Attempt to send 3: failed
// Attempt to send 4: failed
// ---
// Attempt to receive: 0
// Attempt to receive: 1
// Attempt to receive: failed
// Attempt to receive: failed
// Attempt to receive: failed
```

### Closing a Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()

    launch {
        repeat(3) {
            channel.send(it)
        }
        channel.close() // Close the channel
        println("After closing isClosedForSend: ${channel.isClosedForSend}")
    }

    // Receive all values
    for (value in channel) {
        println("Received: $value")
    }

    println("After closing isClosedForReceive: ${channel.isClosedForReceive}")

    // Receiving after close returns null or throws exception
    val result = channel.tryReceive()
    println("tryReceive after close: $result")
}
```

### Closing with Exception

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()

    launch {
        try {
            repeat(5) {
                if (it == 3) {
                    // Close with exception
                    channel.close(IllegalStateException("Error occurred"))
                    return@launch
                }
                channel.send(it)
            }
        } catch (e: Exception) {
            println("Send exception: $e")
        }
    }

    try {
        for (value in channel) {
            println("Received: $value")
        }
    } catch (e: Exception) {
        println("Receive exception: $e")
    }
}
```

## Best Practices

### Always Close the Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// Recommended: Use produce to automatically manage closing
fun CoroutineScope.produceData(): ReceiveChannel<Int> = produce {
    repeat(5) {
        send(it)
    }
    // produce automatically closes when finished
}

// Or close manually
suspend fun manualClose() = coroutineScope {
    val channel = Channel<Int>()

    launch {
        try {
            repeat(5) {
                channel.send(it)
            }
        } finally {
            channel.close() // Ensure closing
        }
    }

    for (x in channel) {
        println(x)
    }
}
```

### Use consumeEach Instead of for Loop

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()

    launch {
        repeat(5) { channel.send(it) }
        channel.close()
    }

    // consumeEach automatically cancels channel on exception
    channel.consumeEach { value ->
        println("Processing: $value")
        if (value == 2) {
            throw RuntimeException("Simulated error")
        }
    }
}
```

### Choose the Right Channel Type

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// Scenario 1: Need backpressure -> Rendezvous or Buffered
fun backpressureExample() = runBlocking {
    val channel = Channel<Int>(10) // Limited buffer
    // Producer will suspend when buffer is full
}

// Scenario 2: Only care about latest state -> Conflated
fun latestStateExample() = runBlocking {
    val channel = Channel<Int>(Channel.CONFLATED)
    // Suitable for UI state updates
}

// Scenario 3: High throughput with controlled memory -> Buffered
fun highThroughputExample() = runBlocking {
    val channel = Channel<Int>(1000)
    // Large buffer reduces suspensions
}
```

### Handle Cancellation

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()

    val job = launch {
        try {
            var i = 0
            while (true) {
                channel.send(i++)
                delay(100L)
            }
        } catch (e: CancellationException) {
            println("Producer cancelled")
            throw e
        } finally {
            channel.close()
            println("Resources cleaned up")
        }
    }

    repeat(5) {
        println(channel.receive())
    }

    job.cancel()
    job.join()
}
```

### Use select to Handle Multiple Channels

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlinx.coroutines.selects.*

fun main() = runBlocking {
    val channel1 = Channel<String>()
    val channel2 = Channel<String>()

    launch {
        repeat(3) {
            delay(100L)
            channel1.send("A$it")
        }
        channel1.close()
    }

    launch {
        repeat(3) {
            delay(150L)
            channel2.send("B$it")
        }
        channel2.close()
    }

    // Use select to listen to multiple channels simultaneously
    repeat(6) {
        val result = select<String> {
            channel1.onReceiveCatching { result ->
                result.getOrNull() ?: "channel1 closed"
            }
            channel2.onReceiveCatching { result ->
                result.getOrNull() ?: "channel2 closed"
            }
        }
        println("Received: $result")
    }
}
```

## Common Pitfalls

### Forgetting to Close the Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// Wrong: Forgetting to close causes receiver to suspend forever
fun wrongExample() = runBlocking {
    val channel = Channel<Int>()

    launch {
        repeat(5) {
            channel.send(it)
        }
        // Forgot channel.close()
    }

    // This will wait forever
    for (x in channel) {
        println(x)
    }
    println("This will never execute")
}

// Correct: Always close
fun correctExample() = runBlocking {
    val channel = Channel<Int>()

    launch {
        repeat(5) {
            channel.send(it)
        }
        channel.close() // Properly closed
    }

    for (x in channel) {
        println(x)
    }
    println("Completed normally")
}
```

### Sending to a Closed Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()
    channel.close()

    try {
        channel.send(1) // Throws ClosedSendChannelException
    } catch (e: ClosedSendChannelException) {
        println("Error: Sending to closed channel")
    }

    // Use trySend to check
    val result = channel.trySend(1)
    if (result.isFailure) {
        println("Send failed: ${result.exceptionOrNull()}")
    }
}
```

### Unlimited Channel Causing Memory Issues

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// Dangerous: Producer much faster than consumer
fun dangerousExample() = runBlocking {
    val channel = Channel<ByteArray>(Channel.UNLIMITED)

    launch {
        while (true) {
            channel.send(ByteArray(1024 * 1024)) // 1MB
            // No delay, fast production
        }
    }

    // Consumer is slow
    for (data in channel) {
        delay(1000L)
        println("Processed ${data.size} bytes")
    }
}

// Safe: Use limited buffer
fun safeExample() = runBlocking {
    val channel = Channel<ByteArray>(10) // Limited buffer

    launch {
        while (true) {
            channel.send(ByteArray(1024 * 1024))
            // Suspends when buffer is full, creating backpressure
        }
    }

    for (data in channel) {
        delay(1000L)
        println("Processed ${data.size} bytes")
    }
}
```

### Using Channel in Wrong Scope

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// Wrong: Channel outlives scope
fun wrongScope() = runBlocking {
    val channel = coroutineScope {
        val ch = Channel<Int>()
        launch {
            ch.send(1)
        }
        ch
    }
    // After coroutineScope ends, internal coroutines have completed
    // but channel state may be uncertain
}

// Correct: Manage in same scope
fun correctScope() = runBlocking {
    val channel = Channel<Int>()

    launch {
        channel.send(1)
        channel.close()
    }

    launch {
        for (x in channel) {
            println(x)
        }
    }
}
```

### Fairness Issues in select

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlinx.coroutines.selects.*

fun main() = runBlocking {
    val channel1 = Channel<String>(Channel.UNLIMITED)
    val channel2 = Channel<String>(Channel.UNLIMITED)

    // Fill with data
    repeat(100) { channel1.send("A") }
    repeat(100) { channel2.send("B") }

    var aCount = 0
    var bCount = 0

    // Note: select favors the first ready branch
    repeat(200) {
        select<Unit> {
            channel1.onReceive { aCount++ }
            channel2.onReceive { bCount++ }
        }
    }

    println("A: $aCount, B: $bCount")
    // May output A: 200, B: 0 (unfair)
}
```

## Performance Considerations

### Buffer Size Selection

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlin.system.*

fun main() = runBlocking {
    val sizes = listOf(0, 1, 10, 100, 1000)

    for (size in sizes) {
        val time = measureTimeMillis {
            val channel = if (size == 0) Channel<Int>() else Channel<Int>(size)

            launch {
                repeat(10000) {
                    channel.send(it)
                }
                channel.close()
            }

            var sum = 0L
            for (x in channel) {
                sum += x
            }
        }
        println("Buffer size $size: ${time}ms")
    }
}
```

### Avoiding Unnecessary Suspensions

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlin.system.*

fun main() = runBlocking {
    // Batch sending reduces suspension count
    val singleChannel = Channel<Int>(100)
    val batchChannel = Channel<List<Int>>(10)

    // Single sending
    val singleTime = measureTimeMillis {
        launch {
            repeat(10000) { singleChannel.send(it) }
            singleChannel.close()
        }
        for (x in singleChannel) { /* process */ }
    }

    // Batch sending
    val batchTime = measureTimeMillis {
        launch {
            (0 until 10000).chunked(100).forEach { batch ->
                batchChannel.send(batch)
            }
            batchChannel.close()
        }
        for (batch in batchChannel) {
            batch.forEach { /* process */ }
        }
    }

    println("Single sending: ${singleTime}ms")
    println("Batch sending: ${batchTime}ms")
}
```

### Channel vs Other Synchronization Mechanisms

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlinx.coroutines.sync.*
import kotlin.system.*

fun main() = runBlocking {
    val iterations = 100000

    // Using Channel
    val channelTime = measureTimeMillis {
        val channel = Channel<Int>(64)
        launch {
            repeat(iterations) { channel.send(it) }
            channel.close()
        }
        var sum = 0L
        for (x in channel) { sum += x }
    }

    // Using Mutex
    val mutexTime = measureTimeMillis {
        val mutex = Mutex()
        var sum = 0L
        val jobs = (0 until iterations).map { i ->
            launch {
                mutex.withLock {
                    sum += i
                }
            }
        }
        jobs.forEach { it.join() }
    }

    println("Channel: ${channelTime}ms")
    println("Mutex: ${mutexTime}ms")
}
```

## Real-World Scenarios

### Fan-out Pattern

Multiple consumers receiving from the same Channel:

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun CoroutineScope.produceJobs(): ReceiveChannel<Int> = produce {
    repeat(10) {
        delay(100L)
        send(it)
    }
}

fun CoroutineScope.launchWorker(id: Int, channel: ReceiveChannel<Int>) = launch {
    for (job in channel) {
        println("Worker $id processing task $job")
        delay(150L) // Simulate processing time
    }
}

fun main() = runBlocking {
    val jobs = produceJobs()

    // Launch 3 workers
    repeat(3) { id ->
        launchWorker(id, jobs)
    }

    delay(2000L)
    jobs.cancel()
}
// Tasks are distributed among different workers
```

### Fan-in Pattern

Multiple producers sending to the same Channel:

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun CoroutineScope.produceFrom(id: Int, channel: SendChannel<String>) = launch {
    repeat(5) {
        delay((100L * (id + 1)))
        channel.send("Producer $id: Message $it")
    }
}

fun main() = runBlocking {
    val channel = Channel<String>()

    // Launch 3 producers
    repeat(3) { id ->
        produceFrom(id, channel)
    }

    // Single consumer
    launch {
        repeat(15) {
            println(channel.receive())
        }
    }

    delay(3000L)
    channel.close()
}
```

### Pipeline Pattern

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// Generate numbers
fun CoroutineScope.produceNumbers(): ReceiveChannel<Int> = produce {
    var x = 1
    while (true) {
        send(x++)
        delay(100L)
    }
}

// Filter even numbers
fun CoroutineScope.filterEven(input: ReceiveChannel<Int>): ReceiveChannel<Int> = produce {
    for (x in input) {
        if (x % 2 == 0) {
            send(x)
        }
    }
}

// Calculate square
fun CoroutineScope.square(input: ReceiveChannel<Int>): ReceiveChannel<Int> = produce {
    for (x in input) {
        send(x * x)
    }
}

fun main() = runBlocking {
    val numbers = produceNumbers()
    val evens = filterEven(numbers)
    val squares = square(evens)

    repeat(5) {
        println(squares.receive())
    }

    coroutineContext.cancelChildren()
}
// Output: 4, 16, 36, 64, 100
```

### Worker Pool Pattern

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

data class Task(val id: Int, val data: String)
data class Result(val taskId: Int, val result: String)

fun main() = runBlocking {
    val taskChannel = Channel<Task>(100)
    val resultChannel = Channel<Result>(100)

    // Launch worker pool
    repeat(4) { workerId ->
        launch {
            for (task in taskChannel) {
                delay(100L) // Simulate processing
                resultChannel.send(
                    Result(task.id, "Worker $workerId processed: ${task.data}")
                )
            }
        }
    }

    // Submit tasks
    launch {
        repeat(20) {
            taskChannel.send(Task(it, "Data$it"))
        }
        taskChannel.close()
    }

    // Collect results
    launch {
        repeat(20) {
            val result = resultChannel.receive()
            println("Result: ${result.result}")
        }
        resultChannel.close()
    }

    delay(3000L)
}
```

### Rate Limiter

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

class RateLimiter(
    private val permitsPerSecond: Int
) {
    private val permitChannel = Channel<Unit>(permitsPerSecond)

    fun start(scope: CoroutineScope) {
        // Periodically replenish tokens
        scope.launch {
            while (isActive) {
                repeat(permitsPerSecond) {
                    permitChannel.trySend(Unit)
                }
                delay(1000L)
            }
        }
    }

    suspend fun acquire() {
        permitChannel.receive()
    }
}

fun main() = runBlocking {
    val limiter = RateLimiter(5) // 5 requests per second
    limiter.start(this)

    val startTime = System.currentTimeMillis()

    // Try to send 15 requests
    repeat(15) { i ->
        limiter.acquire()
        val elapsed = System.currentTimeMillis() - startTime
        println("[${elapsed}ms] Request $i")
    }
}
```

### Broadcast Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

@OptIn(ObsoleteCoroutinesApi::class)
fun main() = runBlocking {
    // Create broadcast channel
    val broadcastChannel = BroadcastChannel<String>(Channel.BUFFERED)

    // Subscriber 1
    launch {
        val subscription = broadcastChannel.openSubscription()
        for (msg in subscription) {
            println("Subscriber1: $msg")
        }
    }

    // Subscriber 2
    launch {
        val subscription = broadcastChannel.openSubscription()
        for (msg in subscription) {
            println("Subscriber2: $msg")
        }
    }

    delay(100L)

    // Send messages
    broadcastChannel.send("MessageA")
    delay(100L)
    broadcastChannel.send("MessageB")
    delay(100L)
    broadcastChannel.send("MessageC")

    delay(100L)
    broadcastChannel.close()
}

// Modern alternative: Use SharedFlow
fun modernBroadcast() = runBlocking {
    val sharedFlow = MutableSharedFlow<String>()

    launch {
        sharedFlow.collect { println("Subscriber1: $it") }
    }

    launch {
        sharedFlow.collect { println("Subscriber2: $it") }
    }

    delay(100L)
    sharedFlow.emit("MessageA")
    delay(100L)
    sharedFlow.emit("MessageB")
}
```

### Event Bus

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlinx.coroutines.flow.*

// Define events
sealed class AppEvent {
    data class UserLogin(val userId: String) : AppEvent()
    data class UserLogout(val userId: String) : AppEvent()
    data class DataUpdate(val data: Any) : AppEvent()
}

// Event bus implementation
object EventBus {
    private val _events = MutableSharedFlow<AppEvent>(
        extraBufferCapacity = 64,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )

    val events: SharedFlow<AppEvent> = _events.asSharedFlow()

    suspend fun post(event: AppEvent) {
        _events.emit(event)
    }

    fun postBlocking(event: AppEvent) {
        _events.tryEmit(event)
    }
}

fun main() = runBlocking {
    // Listen for user events
    launch {
        EventBus.events
            .filterIsInstance<AppEvent.UserLogin>()
            .collect { event ->
                println("User logged in: ${event.userId}")
            }
    }

    // Listen for all events
    launch {
        EventBus.events.collect { event ->
            println("Received event: $event")
        }
    }

    delay(100L)
    EventBus.post(AppEvent.UserLogin("user123"))
    delay(100L)
    EventBus.post(AppEvent.DataUpdate("New data"))
    delay(100L)
    EventBus.post(AppEvent.UserLogout("user123"))
    delay(100L)
}
```

## Interview Key Points

### Basic Concept Questions

**1. What are the differences between Channel and Flow?**

- Channel is "hot", it exists once created, values disappear after consumption
- Flow is "cold", it only executes when collected, each collection executes independently
- Channel is suitable for inter-coroutine communication, Flow is suitable for data transformation streams
- Channel supports multiple producers/consumers, Flow naturally supports multiple subscribers executing independently

**2. What are the capacity types for Channel?**

- `RENDEZVOUS` (0): Unbuffered, send and receive must occur simultaneously
- `BUFFERED` (default 64): Limited buffer, suspends when full
- `CONFLATED`: Only keeps the latest value, send never suspends
- `UNLIMITED`: Unlimited buffer, send never suspends, may cause memory issues

**3. How to handle Channel closing?**

```kotlin
// Method 1: Using for loop
for (x in channel) {
    // Automatically exits after channel closes
}

// Method 2: Check isClosedForReceive
while (!channel.isClosedForReceive) {
    val value = channel.receiveCatching()
    // Process
}

// Method 3: Using consumeEach
channel.consumeEach { value ->
    // Process
}
```

### Advanced Questions

**4. Explain the purpose of select expression**

```kotlin
select<Unit> {
    channel1.onReceive { value -> /* handle channel1's value */ }
    channel2.onReceive { value -> /* handle channel2's value */ }
    channel3.onSend(data) { /* send successful */ }
}
// select waits for the first ready branch and executes it
```

**5. How to implement fan-out/fan-in patterns?**

```kotlin
// Fan-out: Multiple consumers receiving from same channel
val channel = produce { ... }
repeat(n) { launchWorker(channel) }

// Fan-in: Multiple producers sending to same channel
val channel = Channel<T>()
repeat(n) { launchProducer(channel) }
```

**6. How does Channel handle backpressure?**

Channel naturally supports backpressure through buffer and suspension mechanism:
- Buffered Channel: Sender suspends when buffer is full
- Conflated Channel: Discards old values, keeps new values
- Buffer size can be configured to balance throughput and memory usage

### Practical Coding Questions

**Implement a simple task scheduler**

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

class TaskScheduler(private val concurrency: Int) {
    private val taskChannel = Channel<suspend () -> Unit>(Channel.UNLIMITED)

    fun start(scope: CoroutineScope) {
        repeat(concurrency) { workerId ->
            scope.launch {
                for (task in taskChannel) {
                    try {
                        task()
                    } catch (e: Exception) {
                        println("Worker $workerId task failed: $e")
                    }
                }
            }
        }
    }

    suspend fun schedule(task: suspend () -> Unit) {
        taskChannel.send(task)
    }

    fun close() {
        taskChannel.close()
    }
}

fun main() = runBlocking {
    val scheduler = TaskScheduler(3)
    scheduler.start(this)

    repeat(10) { i ->
        scheduler.schedule {
            println("Executing task $i")
            delay(100L)
        }
    }

    delay(1000L)
    scheduler.close()
}
```

## Further Reading

### Official Resources

- [Kotlin Coroutines Official Documentation - Channels](https://kotlinlang.org/docs/channels.html)
- [kotlinx.coroutines GitHub](https://github.com/Kotlin/kotlinx.coroutines)
- [Kotlin Coroutines Guide](https://kotlinlang.org/docs/coroutines-guide.html)

### Related Topics

- **Flow**: Cold data streams, suitable for data transformation
- **StateFlow**: State holder, suitable for state management
- **SharedFlow**: Hot stream broadcasting, suitable for event distribution
- **Select**: Multiple Channel selection operations

### Design Patterns

- **CSP (Communicating Sequential Processes)**: Theoretical foundation of Channel
- **Actor Pattern**: Message-passing based concurrency model
- **Producer-Consumer Pattern**: Typical Channel application
- **Pipeline Pattern**: Data stream processing

### Recommended Reading

- "Kotlin Coroutines Core Principles"
- [Roman Elizarov's Coroutines Articles](https://elizarov.medium.com/)
- "Kotlin in Action" Second Edition
- [Google Coroutines Best Practices](https://developer.android.com/kotlin/coroutines/coroutines-best-practices)

---

> Channel is the core component implementing the CSP concurrency model in Kotlin coroutines. Understanding Channel's working principles, type selection, and common patterns helps you write efficient, reliable concurrent code. In real projects, Channel is usually used together with Flow, where Channel handles inter-coroutine communication and Flow handles data transformation and reactive programming.
