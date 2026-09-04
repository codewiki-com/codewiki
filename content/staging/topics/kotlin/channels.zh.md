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
origin: old/src/content/docs/kotlin/channels.zh.md
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

Channel 是 Kotlin 协程中用于协程间通信的核心原语。它实现了 CSP（Communicating Sequential Processes）并发模型，提供了一种类型安全、非阻塞的方式在协程之间传递数据。本文将深入探讨 Channel 的各个方面，从基础概念到高级应用模式。

## 概念解释

### 什么是 Channel

Channel（通道）是一个类似于队列的数据结构，允许在不同协程之间安全地传递数据。与 `BlockingQueue` 不同，Channel 使用挂起操作而非阻塞操作，这意味着它不会阻塞线程，而是挂起协程直到操作可以完成。

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // 创建一个 Channel
    val channel = Channel<Int>()

    // 生产者协程
    launch {
        for (x in 1..5) {
            println("发送: $x")
            channel.send(x) // 发送数据到通道
        }
        channel.close() // 关闭通道
    }

    // 消费者协程
    launch {
        for (value in channel) { // 从通道接收数据
            println("接收: $value")
        }
    }
}
```

### Channel vs Flow

Channel 和 Flow 都用于处理异步数据流，但它们有本质区别：

| 特性 | Channel | Flow |
|------|---------|------|
| 温度 | 热（Hot） | 冷（Cold） |
| 数据消费 | 值被消费后即消失 | 每次收集独立执行 |
| 多订阅者 | 共享消费 | 独立执行 |
| 主要用途 | 协程间通信 | 数据转换流 |
| 背压处理 | 需手动配置 | 内置支持 |

### CSP 模型

Channel 实现了 CSP（Communicating Sequential Processes）并发模型，其核心思想是：

> 不要通过共享内存来通信，而要通过通信来共享内存。

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// CSP 风格：通过 Channel 通信
fun main() = runBlocking {
    val channel = Channel<String>()

    // 进程 1：生产数据
    launch {
        channel.send("Hello")
        channel.send("World")
        channel.close()
    }

    // 进程 2：消费数据
    launch {
        for (msg in channel) {
            println(msg)
        }
    }
}
```

## 核心原理

### Channel 内部结构

Channel 内部维护了一个缓冲区和两个等待队列：

```
┌─────────────────────────────────────────────────┐
│                   Channel                       │
├─────────────────────────────────────────────────┤
│  发送者等待队列    缓冲区        接收者等待队列  │
│  ┌─────────┐    ┌───────────┐   ┌─────────┐    │
│  │ S1 │ S2 │ -> │ D1│D2│D3│ -> │ R1 │ R2 │    │
│  └─────────┘    └───────────┘   └─────────┘    │
├─────────────────────────────────────────────────┤
│  状态: 打开/关闭                                │
└─────────────────────────────────────────────────┘
```

工作流程：
1. **发送操作**：如果缓冲区有空间，数据入队；否则发送者挂起
2. **接收操作**：如果缓冲区有数据，数据出队；否则接收者挂起
3. **关闭操作**：标记通道关闭，唤醒所有等待者

### 挂起与恢复机制

Channel 的 `send` 和 `receive` 都是挂起函数：

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // 无缓冲通道（Rendezvous Channel）
    val channel = Channel<Int>()

    launch {
        println("准备发送...")
        channel.send(1) // 挂起，直到有接收者
        println("发送完成")
    }

    delay(1000L)
    println("准备接收...")
    val value = channel.receive() // 此时发送者恢复
    println("接收到: $value")
}
// 输出:
// 准备发送...
// （等待 1 秒）
// 准备接收...
// 发送完成
// 接收到: 1
```

### 公平性保证

Channel 保证 FIFO（先进先出）顺序：

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()

    // 多个发送者
    repeat(3) { id ->
        launch {
            channel.send(id)
            println("发送者 $id 完成发送")
        }
    }

    delay(100L)

    // 按发送顺序接收
    repeat(3) {
        val value = channel.receive()
        println("接收到: $value")
    }
}
```

## 核心要点

### Channel 类型

Kotlin 提供了多种 Channel 类型，通过 `capacity` 参数区分：

#### Rendezvous Channel（无缓冲）

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // 默认是无缓冲通道
    val channel = Channel<Int>() // 等同于 Channel<Int>(Channel.RENDEZVOUS)

    launch {
        println("发送 1")
        channel.send(1) // 挂起直到接收
        println("发送 2")
        channel.send(2)
        channel.close()
    }

    delay(500L)
    println("开始接收")
    for (x in channel) {
        println("收到: $x")
        delay(500L)
    }
}
```

特点：
- 容量为 0
- 发送和接收必须"会合"
- 类似于直接传递

#### Buffered Channel（缓冲）

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // 缓冲容量为 3
    val channel = Channel<Int>(3)

    launch {
        repeat(5) {
            println("发送 $it")
            channel.send(it) // 前 3 个不会挂起
        }
        channel.close()
    }

    delay(1000L)
    for (x in channel) {
        println("收到: $x")
    }
}
// 输出:
// 发送 0
// 发送 1
// 发送 2
// 发送 3  <- 此时挂起
// 收到: 0
// 发送 4
// 收到: 1
// ...
```

特点：
- 指定固定容量
- 缓冲区满时发送者挂起
- 缓冲区空时接收者挂起

#### Conflated Channel（合并）

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // 合并通道，只保留最新值
    val channel = Channel<Int>(Channel.CONFLATED)

    launch {
        repeat(5) {
            println("发送 $it")
            channel.send(it)
        }
        channel.close()
    }

    delay(100L) // 等待所有发送完成

    for (x in channel) {
        println("收到: $x")
    }
}
// 输出:
// 发送 0
// 发送 1
// 发送 2
// 发送 3
// 发送 4
// 收到: 4  <- 只收到最后一个
```

特点：
- 新值覆盖旧值
- 发送永不挂起
- 只保留最新值

#### Unlimited Channel（无限）

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // 无限容量通道
    val channel = Channel<Int>(Channel.UNLIMITED)

    launch {
        repeat(100) {
            channel.send(it) // 永不挂起
        }
        println("发送完成")
        channel.close()
    }

    delay(100L)
    var count = 0
    for (x in channel) {
        count++
    }
    println("共收到 $count 个元素")
}
```

特点：
- 理论上无限容量
- 发送永不挂起
- 可能导致内存问题

### Channel 容量对比

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    // 对比不同容量的行为
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
                println("[$time ms] 发送 $it")
                channel.send(it)
            }
            channel.close()
        }

        delay(10L) // 给发送者一点时间
        for (x in channel) {
            val time = System.currentTimeMillis() - startTime
            println("[$time ms] 收到 $x")
        }
    }
}
```

## 代码示例

### 基本发送和接收

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<String>()

    // 生产者
    launch {
        val fruits = listOf("苹果", "香蕉", "橙子", "葡萄")
        for (fruit in fruits) {
            delay(100L)
            println("发送: $fruit")
            channel.send(fruit)
        }
        channel.close()
        println("通道已关闭")
    }

    // 消费者
    launch {
        // 方式 1：使用 for 循环
        for (fruit in channel) {
            println("收到: $fruit")
        }
        println("接收完毕")
    }
}
```

### 使用 produce 构建器

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// produce 返回 ReceiveChannel
fun CoroutineScope.produceNumbers(): ReceiveChannel<Int> = produce {
    var x = 1
    while (true) {
        send(x++)
        delay(100L)
    }
}

fun main() = runBlocking {
    val numbers = produceNumbers()

    // 只取前 5 个
    repeat(5) {
        println(numbers.receive())
    }

    numbers.cancel() // 取消生产者
    println("生产者已取消")
}
```

### 使用 actor 构建器

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// 定义消息类型
sealed class CounterMsg
object IncCounter : CounterMsg()
class GetCounter(val response: CompletableDeferred<Int>) : CounterMsg()

// actor 是一个接收消息的协程
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

    // 并发增加计数器
    repeat(100) {
        launch {
            counter.send(IncCounter)
        }
    }

    delay(100L)

    // 获取计数器值
    val response = CompletableDeferred<Int>()
    counter.send(GetCounter(response))
    println("计数器值: ${response.await()}")

    counter.close()
}
```

### trySend 和 tryReceive

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>(2) // 容量为 2

    // trySend：尝试发送，不挂起
    repeat(5) {
        val result = channel.trySend(it)
        println("尝试发送 $it: ${if (result.isSuccess) "成功" else "失败"}")
    }

    println("---")

    // tryReceive：尝试接收，不挂起
    repeat(5) {
        val result = channel.tryReceive()
        println("尝试接收: ${if (result.isSuccess) result.getOrNull() else "失败"}")
    }
}
// 输出:
// 尝试发送 0: 成功
// 尝试发送 1: 成功
// 尝试发送 2: 失败
// 尝试发送 3: 失败
// 尝试发送 4: 失败
// ---
// 尝试接收: 0
// 尝试接收: 1
// 尝试接收: 失败
// 尝试接收: 失败
// 尝试接收: 失败
```

### 关闭 Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()

    launch {
        repeat(3) {
            channel.send(it)
        }
        channel.close() // 关闭通道
        println("通道关闭后 isClosedForSend: ${channel.isClosedForSend}")
    }

    // 接收所有值
    for (value in channel) {
        println("收到: $value")
    }

    println("通道关闭后 isClosedForReceive: ${channel.isClosedForReceive}")

    // 关闭后再接收会返回 null 或抛出异常
    val result = channel.tryReceive()
    println("关闭后 tryReceive: $result")
}
```

### 带异常关闭

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()

    launch {
        try {
            repeat(5) {
                if (it == 3) {
                    // 带异常关闭
                    channel.close(IllegalStateException("发生错误"))
                    return@launch
                }
                channel.send(it)
            }
        } catch (e: Exception) {
            println("发送异常: $e")
        }
    }

    try {
        for (value in channel) {
            println("收到: $value")
        }
    } catch (e: Exception) {
        println("接收异常: $e")
    }
}
```

## 最佳实践

### 总是关闭 Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// 推荐：使用 produce 自动管理关闭
fun CoroutineScope.produceData(): ReceiveChannel<Int> = produce {
    repeat(5) {
        send(it)
    }
    // produce 结束时自动关闭
}

// 或手动关闭
suspend fun manualClose() = coroutineScope {
    val channel = Channel<Int>()

    launch {
        try {
            repeat(5) {
                channel.send(it)
            }
        } finally {
            channel.close() // 确保关闭
        }
    }

    for (x in channel) {
        println(x)
    }
}
```

### 使用 consumeEach 替代 for 循环

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()

    launch {
        repeat(5) { channel.send(it) }
        channel.close()
    }

    // consumeEach 在异常时自动取消通道
    channel.consumeEach { value ->
        println("处理: $value")
        if (value == 2) {
            throw RuntimeException("模拟错误")
        }
    }
}
```

### 合理选择 Channel 类型

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// 场景 1：需要背压 -> Rendezvous 或 Buffered
fun backpressureExample() = runBlocking {
    val channel = Channel<Int>(10) // 有限缓冲
    // 当缓冲区满时，生产者会挂起等待
}

// 场景 2：只关心最新状态 -> Conflated
fun latestStateExample() = runBlocking {
    val channel = Channel<Int>(Channel.CONFLATED)
    // 适合 UI 状态更新
}

// 场景 3：高吞吐量且可控内存 -> Buffered
fun highThroughputExample() = runBlocking {
    val channel = Channel<Int>(1000)
    // 大缓冲区减少挂起
}
```

### 处理取消

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
            println("生产者被取消")
            throw e
        } finally {
            channel.close()
            println("资源已清理")
        }
    }

    repeat(5) {
        println(channel.receive())
    }

    job.cancel()
    job.join()
}
```

### 使用 select 处理多个 Channel

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

    // 使用 select 同时监听多个通道
    repeat(6) {
        val result = select<String> {
            channel1.onReceiveCatching { result ->
                result.getOrNull() ?: "channel1 closed"
            }
            channel2.onReceiveCatching { result ->
                result.getOrNull() ?: "channel2 closed"
            }
        }
        println("收到: $result")
    }
}
```

## 常见陷阱

### 忘记关闭 Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// 错误：忘记关闭，导致接收者永久挂起
fun wrongExample() = runBlocking {
    val channel = Channel<Int>()

    launch {
        repeat(5) {
            channel.send(it)
        }
        // 忘记 channel.close()
    }

    // 这里会永远等待
    for (x in channel) {
        println(x)
    }
    println("永远不会执行到这里")
}

// 正确：总是关闭
fun correctExample() = runBlocking {
    val channel = Channel<Int>()

    launch {
        repeat(5) {
            channel.send(it)
        }
        channel.close() // 正确关闭
    }

    for (x in channel) {
        println(x)
    }
    println("正常完成")
}
```

### 向已关闭的 Channel 发送

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()
    channel.close()

    try {
        channel.send(1) // 抛出 ClosedSendChannelException
    } catch (e: ClosedSendChannelException) {
        println("错误：向已关闭的通道发送")
    }

    // 使用 trySend 检查
    val result = channel.trySend(1)
    if (result.isFailure) {
        println("发送失败: ${result.exceptionOrNull()}")
    }
}
```

### 无限 Channel 导致内存问题

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// 危险：生产者比消费者快得多
fun dangerousExample() = runBlocking {
    val channel = Channel<ByteArray>(Channel.UNLIMITED)

    launch {
        while (true) {
            channel.send(ByteArray(1024 * 1024)) // 1MB
            // 没有延迟，快速生产
        }
    }

    // 消费者很慢
    for (data in channel) {
        delay(1000L)
        println("处理了 ${data.size} 字节")
    }
}

// 安全：使用有限缓冲
fun safeExample() = runBlocking {
    val channel = Channel<ByteArray>(10) // 有限缓冲

    launch {
        while (true) {
            channel.send(ByteArray(1024 * 1024))
            // 缓冲区满时会挂起，形成背压
        }
    }

    for (data in channel) {
        delay(1000L)
        println("处理了 ${data.size} 字节")
    }
}
```

### 在错误的作用域使用 Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// 错误：Channel 超出作用域
fun wrongScope() = runBlocking {
    val channel = coroutineScope {
        val ch = Channel<Int>()
        launch {
            ch.send(1)
        }
        ch
    }
    // coroutineScope 结束后，内部协程已完成
    // 但 channel 可能状态不确定
}

// 正确：在相同作用域管理
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

### select 中的公平性问题

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlinx.coroutines.selects.*

fun main() = runBlocking {
    val channel1 = Channel<String>(Channel.UNLIMITED)
    val channel2 = Channel<String>(Channel.UNLIMITED)

    // 填充数据
    repeat(100) { channel1.send("A") }
    repeat(100) { channel2.send("B") }

    var aCount = 0
    var bCount = 0

    // 注意：select 偏向第一个就绪的分支
    repeat(200) {
        select<Unit> {
            channel1.onReceive { aCount++ }
            channel2.onReceive { bCount++ }
        }
    }

    println("A: $aCount, B: $bCount")
    // 可能输出 A: 200, B: 0（不公平）
}
```

## 性能考量

### 缓冲区大小选择

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
        println("缓冲区大小 $size: ${time}ms")
    }
}
```

### 避免不必要的挂起

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlin.system.*

fun main() = runBlocking {
    // 批量发送减少挂起次数
    val singleChannel = Channel<Int>(100)
    val batchChannel = Channel<List<Int>>(10)

    // 单个发送
    val singleTime = measureTimeMillis {
        launch {
            repeat(10000) { singleChannel.send(it) }
            singleChannel.close()
        }
        for (x in singleChannel) { /* 处理 */ }
    }

    // 批量发送
    val batchTime = measureTimeMillis {
        launch {
            (0 until 10000).chunked(100).forEach { batch ->
                batchChannel.send(batch)
            }
            batchChannel.close()
        }
        for (batch in batchChannel) {
            batch.forEach { /* 处理 */ }
        }
    }

    println("单个发送: ${singleTime}ms")
    println("批量发送: ${batchTime}ms")
}
```

### Channel vs 其他同步机制

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlinx.coroutines.sync.*
import kotlin.system.*

fun main() = runBlocking {
    val iterations = 100000

    // 使用 Channel
    val channelTime = measureTimeMillis {
        val channel = Channel<Int>(64)
        launch {
            repeat(iterations) { channel.send(it) }
            channel.close()
        }
        var sum = 0L
        for (x in channel) { sum += x }
    }

    // 使用 Mutex
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

## 实战场景

### 扇出（Fan-out）模式

多个消费者从同一个 Channel 接收：

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
        println("Worker $id 处理任务 $job")
        delay(150L) // 模拟处理时间
    }
}

fun main() = runBlocking {
    val jobs = produceJobs()

    // 启动 3 个工作者
    repeat(3) { id ->
        launchWorker(id, jobs)
    }

    delay(2000L)
    jobs.cancel()
}
// 任务会分布到不同的 worker
```

### 扇入（Fan-in）模式

多个生产者向同一个 Channel 发送：

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun CoroutineScope.produceFrom(id: Int, channel: SendChannel<String>) = launch {
    repeat(5) {
        delay((100L * (id + 1)))
        channel.send("生产者 $id: 消息 $it")
    }
}

fun main() = runBlocking {
    val channel = Channel<String>()

    // 启动 3 个生产者
    repeat(3) { id ->
        produceFrom(id, channel)
    }

    // 单个消费者
    launch {
        repeat(15) {
            println(channel.receive())
        }
    }

    delay(3000L)
    channel.close()
}
```

### 管道（Pipeline）模式

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

// 生成数字
fun CoroutineScope.produceNumbers(): ReceiveChannel<Int> = produce {
    var x = 1
    while (true) {
        send(x++)
        delay(100L)
    }
}

// 过滤偶数
fun CoroutineScope.filterEven(input: ReceiveChannel<Int>): ReceiveChannel<Int> = produce {
    for (x in input) {
        if (x % 2 == 0) {
            send(x)
        }
    }
}

// 计算平方
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
// 输出: 4, 16, 36, 64, 100
```

### 工作池模式

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

data class Task(val id: Int, val data: String)
data class Result(val taskId: Int, val result: String)

fun main() = runBlocking {
    val taskChannel = Channel<Task>(100)
    val resultChannel = Channel<Result>(100)

    // 启动工作池
    repeat(4) { workerId ->
        launch {
            for (task in taskChannel) {
                delay(100L) // 模拟处理
                resultChannel.send(
                    Result(task.id, "Worker $workerId 处理: ${task.data}")
                )
            }
        }
    }

    // 提交任务
    launch {
        repeat(20) {
            taskChannel.send(Task(it, "数据$it"))
        }
        taskChannel.close()
    }

    // 收集结果
    launch {
        repeat(20) {
            val result = resultChannel.receive()
            println("结果: ${result.result}")
        }
        resultChannel.close()
    }

    delay(3000L)
}
```

### 限流器

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

class RateLimiter(
    private val permitsPerSecond: Int
) {
    private val permitChannel = Channel<Unit>(permitsPerSecond)

    fun start(scope: CoroutineScope) {
        // 定期补充令牌
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
    val limiter = RateLimiter(5) // 每秒 5 个请求
    limiter.start(this)

    val startTime = System.currentTimeMillis()

    // 尝试发送 15 个请求
    repeat(15) { i ->
        limiter.acquire()
        val elapsed = System.currentTimeMillis() - startTime
        println("[${elapsed}ms] 请求 $i")
    }
}
```

### 广播 Channel

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

@OptIn(ObsoleteCoroutinesApi::class)
fun main() = runBlocking {
    // 创建广播通道
    val broadcastChannel = BroadcastChannel<String>(Channel.BUFFERED)

    // 订阅者 1
    launch {
        val subscription = broadcastChannel.openSubscription()
        for (msg in subscription) {
            println("订阅者1: $msg")
        }
    }

    // 订阅者 2
    launch {
        val subscription = broadcastChannel.openSubscription()
        for (msg in subscription) {
            println("订阅者2: $msg")
        }
    }

    delay(100L)

    // 发送消息
    broadcastChannel.send("消息A")
    delay(100L)
    broadcastChannel.send("消息B")
    delay(100L)
    broadcastChannel.send("消息C")

    delay(100L)
    broadcastChannel.close()
}

// 现代替代方案：使用 SharedFlow
fun modernBroadcast() = runBlocking {
    val sharedFlow = MutableSharedFlow<String>()

    launch {
        sharedFlow.collect { println("订阅者1: $it") }
    }

    launch {
        sharedFlow.collect { println("订阅者2: $it") }
    }

    delay(100L)
    sharedFlow.emit("消息A")
    delay(100L)
    sharedFlow.emit("消息B")
}
```

### 事件总线

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*
import kotlinx.coroutines.flow.*

// 定义事件
sealed class AppEvent {
    data class UserLogin(val userId: String) : AppEvent()
    data class UserLogout(val userId: String) : AppEvent()
    data class DataUpdate(val data: Any) : AppEvent()
}

// 事件总线实现
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
    // 监听用户事件
    launch {
        EventBus.events
            .filterIsInstance<AppEvent.UserLogin>()
            .collect { event ->
                println("用户登录: ${event.userId}")
            }
    }

    // 监听所有事件
    launch {
        EventBus.events.collect { event ->
            println("收到事件: $event")
        }
    }

    delay(100L)
    EventBus.post(AppEvent.UserLogin("user123"))
    delay(100L)
    EventBus.post(AppEvent.DataUpdate("新数据"))
    delay(100L)
    EventBus.post(AppEvent.UserLogout("user123"))
    delay(100L)
}
```

## 面试要点

### 基础概念题

**1. Channel 和 Flow 有什么区别？**

- Channel 是"热"的，创建后就存在，值被消费后消失
- Flow 是"冷"的，只有被收集时才执行，每次收集独立执行
- Channel 适合协程间通信，Flow 适合数据转换流
- Channel 支持多生产者/多消费者，Flow 天然支持多订阅者独立执行

**2. Channel 的容量类型有哪些？**

- `RENDEZVOUS`（0）：无缓冲，发送和接收必须同时进行
- `BUFFERED`（默认 64）：有限缓冲，满时挂起
- `CONFLATED`：只保留最新值，发送永不挂起
- `UNLIMITED`：无限缓冲，发送永不挂起，可能导致内存问题

**3. 如何处理 Channel 关闭？**

```kotlin
// 方式 1：使用 for 循环
for (x in channel) {
    // 通道关闭后自动退出
}

// 方式 2：检查 isClosedForReceive
while (!channel.isClosedForReceive) {
    val value = channel.receiveCatching()
    // 处理
}

// 方式 3：使用 consumeEach
channel.consumeEach { value ->
    // 处理
}
```

### 进阶问题

**4. 解释 select 表达式的作用**

```kotlin
select<Unit> {
    channel1.onReceive { value -> /* 处理 channel1 的值 */ }
    channel2.onReceive { value -> /* 处理 channel2 的值 */ }
    channel3.onSend(data) { /* 发送成功 */ }
}
// select 等待第一个就绪的分支并执行
```

**5. 如何实现扇出/扇入模式？**

```kotlin
// 扇出：多个消费者从同一通道接收
val channel = produce { ... }
repeat(n) { launchWorker(channel) }

// 扇入：多个生产者向同一通道发送
val channel = Channel<T>()
repeat(n) { launchProducer(channel) }
```

**6. Channel 如何处理背压？**

Channel 通过缓冲区和挂起机制天然支持背压：
- 有限缓冲 Channel：缓冲区满时发送者挂起
- Conflated Channel：丢弃旧值，保留新值
- 可以配置缓冲区大小来平衡吞吐量和内存使用

### 实践编码题

**实现一个简单的任务调度器**

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
                        println("Worker $workerId 任务失败: $e")
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
            println("执行任务 $i")
            delay(100L)
        }
    }

    delay(1000L)
    scheduler.close()
}
```

## 延伸阅读

### 官方资源

- [Kotlin 协程官方文档 - Channels](https://kotlinlang.org/docs/channels.html)
- [kotlinx.coroutines GitHub](https://github.com/Kotlin/kotlinx.coroutines)
- [Kotlin 协程指南](https://kotlinlang.org/docs/coroutines-guide.html)

### 相关主题

- **Flow**：冷数据流，适合数据转换
- **StateFlow**：状态持有者，适合状态管理
- **SharedFlow**：热流广播，适合事件分发
- **Select**：多 Channel 选择操作

### 设计模式

- **CSP（Communicating Sequential Processes）**：Channel 的理论基础
- **Actor 模式**：基于消息传递的并发模型
- **生产者-消费者模式**：Channel 的典型应用
- **管道模式**：数据流处理

### 推荐阅读

- 《Kotlin 协程核心原理》
- [Roman Elizarov 的协程文章](https://elizarov.medium.com/)
- 《Kotlin in Action》第二版
- [Google 协程最佳实践](https://developer.android.com/kotlin/coroutines/coroutines-best-practices)

---

> Channel 是 Kotlin 协程中实现 CSP 并发模型的核心组件。理解 Channel 的工作原理、类型选择和常见模式，可以帮助你编写高效、可靠的并发代码。在实际项目中，Channel 通常与 Flow 配合使用，Channel 负责协程间通信，Flow 负责数据转换和响应式编程。
