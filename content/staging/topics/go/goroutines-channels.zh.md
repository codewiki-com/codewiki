---
title: Go Goroutines 与 Channels
description: 掌握 Go 并发：goroutine、channel、select 与并发模式
track: go
section: concurrency
difficulty: intermediate
tags:
  - Go
  - goroutine
  - channel
  - 并发
status: imported
origin: old/src/content/docs/go/goroutines-channels.zh.md
divergence: 0.333
issues: []
legacy:
  category: Go
  subcategory: 并发编程
  order: 2
  lastUpdated: 2026-01-07
---

Go 语言的并发模型是其最强大的特性之一。通过 goroutines 和 channels，Go 提供了一种简单而优雅的方式来编写并发程序。本文将深入探讨这些核心概念及其实际应用。

## Goroutine 基础

### 什么是 Goroutine?

Goroutine 是 Go 运行时管理的轻量级线程。与操作系统线程相比，goroutine 的创建和销毁成本非常低，初始栈大小仅为几 KB，可以根据需要动态增长和收缩。

### 创建 Goroutine

使用 `go` 关键字可以启动一个新的 goroutine：

```go
package main

import (
    "fmt"
    "time"
)

func sayHello() {
    fmt.Println("Hello from goroutine!")
}

func main() {
    // 启动一个新的 goroutine
    go sayHello()

    // 主 goroutine 继续执行
    fmt.Println("Hello from main!")

    // 等待 goroutine 执行完成
    time.Sleep(time.Second)
}
```

### 匿名函数的 Goroutine

通常使用匿名函数来启动 goroutine：

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    // 使用匿名函数启动 goroutine
    go func() {
        fmt.Println("Anonymous goroutine")
    }()

    // 带参数的匿名 goroutine
    message := "Hello"
    go func(msg string) {
        fmt.Println(msg)
    }(message)

    time.Sleep(time.Second)
}
```

### 多个 Goroutine

轻松启动多个 goroutine：

```go
package main

import (
    "fmt"
    "time"
)

func worker(id int) {
    fmt.Printf("Worker %d starting\n", id)
    time.Sleep(time.Second)
    fmt.Printf("Worker %d done\n", id)
}

func main() {
    // 启动 5 个 worker goroutines
    for i := 1; i <= 5; i++ {
        go worker(i)
    }

    // 等待所有 workers 完成
    time.Sleep(2 * time.Second)
}
```

## Channel 概述

Channel 是 Go 提供的用于 goroutine 之间通信的管道。它遵循 CSP (Communicating Sequential Processes) 模型，提倡"通过通信来共享内存，而不是通过共享内存来通信"。

### 创建 Channel

使用 `make` 函数创建 channel：

```go
// 创建一个传递 int 类型的 channel
ch := make(chan int)

// 创建一个传递 string 类型的 channel
messages := make(chan string)

// 创建一个传递自定义类型的 channel
type Person struct {
    Name string
    Age  int
}
personCh := make(chan Person)
```

### Channel 的基本操作

```go
package main

import "fmt"

func main() {
    // 创建 channel
    messages := make(chan string)

    // 在 goroutine 中发送数据
    go func() {
        messages <- "ping" // 发送数据到 channel
    }()

    // 从 channel 接收数据
    msg := <-messages // 接收数据
    fmt.Println(msg)
}
```

## 无缓冲 Channel

无缓冲 channel（也称为同步 channel）在发送和接收操作上都会阻塞，直到另一端准备好。

### 特性

- 发送操作会阻塞，直到有接收者准备接收
- 接收操作会阻塞，直到有发送者发送数据
- 提供了强同步保证

### 示例：同步通信

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    done := make(chan bool)

    go func() {
        fmt.Println("Working...")
        time.Sleep(time.Second)
        fmt.Println("Done!")

        // 发送完成信号
        done <- true
    }()

    // 阻塞等待完成信号
    <-done
    fmt.Println("Main exiting")
}
```

### 示例：数据传递

```go
package main

import "fmt"

func sum(a, b int, result chan int) {
    result <- a + b
}

func main() {
    result := make(chan int)

    go sum(10, 20, result)

    // 等待并接收结果
    total := <-result
    fmt.Printf("Sum: %d\n", total)
}
```

## 带缓冲 Channel

带缓冲 channel 有一个容量限制，可以在不阻塞的情况下发送多个值。

### 创建带缓冲 Channel

```go
// 创建容量为 3 的缓冲 channel
ch := make(chan int, 3)

// 创建容量为 10 的缓冲 channel
messages := make(chan string, 10)
```

### 缓冲 Channel 的行为

```go
package main

import "fmt"

func main() {
    // 创建容量为 2 的缓冲 channel
    messages := make(chan string, 2)

    // 可以发送最多 2 个值而不阻塞
    messages <- "buffered"
    messages <- "channel"

    // 接收这两个值
    fmt.Println(<-messages)
    fmt.Println(<-messages)
}
```

### 示例：生产者-消费者模式

```go
package main

import (
    "fmt"
    "time"
)

func producer(ch chan int) {
    for i := 0; i < 10; i++ {
        fmt.Printf("Producing: %d\n", i)
        ch <- i
        time.Sleep(100 * time.Millisecond)
    }
    close(ch)
}

func consumer(ch chan int) {
    for num := range ch {
        fmt.Printf("Consuming: %d\n", num)
        time.Sleep(200 * time.Millisecond)
    }
}

func main() {
    ch := make(chan int, 5)

    go producer(ch)
    consumer(ch)
}
```

### 检查 Channel 状态

```go
package main

import "fmt"

func main() {
    ch := make(chan int, 3)

    ch <- 1
    ch <- 2

    fmt.Printf("Length: %d\n", len(ch)) // 当前元素数量: 2
    fmt.Printf("Capacity: %d\n", cap(ch)) // 容量: 3
}
```

## Channel 方向

可以指定 channel 的方向，限制其只能发送或只能接收数据，提高类型安全性。

### 只发送 Channel

```go
// chan<- 表示只能发送
func sendOnly(ch chan<- int) {
    ch <- 42
    // x := <-ch // 编译错误：不能从只发送 channel 接收
}
```

### 只接收 Channel

```go
// <-chan 表示只能接收
func receiveOnly(ch <-chan int) {
    x := <-ch
    fmt.Println(x)
    // ch <- 10 // 编译错误：不能向只接收 channel 发送
}
```

### 完整示例

```go
package main

import "fmt"

// producer 只能发送到 channel
func producer(ch chan<- int) {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch)
}

// consumer 只能从 channel 接收
func consumer(ch <-chan int) {
    for num := range ch {
        fmt.Printf("Received: %d\n", num)
    }
}

func main() {
    ch := make(chan int)

    go producer(ch)
    consumer(ch)
}
```

### 双向转单向

双向 channel 可以隐式转换为单向 channel：

```go
package main

import "fmt"

func process(ch chan int) {
    // 双向 channel
    ch <- 10

    // 转换为只发送 channel
    sendOnly(ch)

    // 转换为只接收 channel
    receiveOnly(ch)
}

func sendOnly(ch chan<- int) {
    ch <- 20
}

func receiveOnly(ch <-chan int) {
    fmt.Println(<-ch)
}

func main() {
    ch := make(chan int, 2)
    go process(ch)

    fmt.Println(<-ch)
}
```

## Select 语句

`select` 语句让一个 goroutine 可以等待多个 channel 操作。它会阻塞直到其中一个 case 可以执行。

### 基本用法

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)

    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "one"
    }()

    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "two"
    }()

    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println("Received", msg1)
        case msg2 := <-ch2:
            fmt.Println("Received", msg2)
        }
    }
}
```

### Default Case

使用 `default` case 实现非阻塞操作：

```go
package main

import "fmt"

func main() {
    messages := make(chan string)
    signals := make(chan bool)

    // 非阻塞接收
    select {
    case msg := <-messages:
        fmt.Println("Received message:", msg)
    default:
        fmt.Println("No message received")
    }

    // 非阻塞发送
    msg := "hi"
    select {
    case messages <- msg:
        fmt.Println("Sent message:", msg)
    default:
        fmt.Println("No message sent")
    }

    // 多路非阻塞选择
    select {
    case msg := <-messages:
        fmt.Println("Received message:", msg)
    case sig := <-signals:
        fmt.Println("Received signal:", sig)
    default:
        fmt.Println("No activity")
    }
}
```

### Timeout 模式

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch := make(chan string)

    go func() {
        time.Sleep(2 * time.Second)
        ch <- "result"
    }()

    select {
    case res := <-ch:
        fmt.Println(res)
    case <-time.After(1 * time.Second):
        fmt.Println("Timeout!")
    }
}
```

### 随机选择

当多个 case 都准备好时，`select` 会随机选择一个执行：

```go
package main

import "fmt"

func main() {
    ch1 := make(chan string, 1)
    ch2 := make(chan string, 1)

    ch1 <- "one"
    ch2 <- "two"

    // 随机选择一个准备好的 case
    select {
    case msg1 := <-ch1:
        fmt.Println(msg1)
    case msg2 := <-ch2:
        fmt.Println(msg2)
    }
}
```

## 常见并发模式

### Worker Pool 模式

使用固定数量的 worker goroutines 处理任务队列：

```go
package main

import (
    "fmt"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        fmt.Printf("Worker %d started job %d\n", id, j)
        time.Sleep(time.Second)
        fmt.Printf("Worker %d finished job %d\n", id, j)
        results <- j * 2
    }
}

func main() {
    const numJobs = 5
    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)

    // 启动 3 个 worker
    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }

    // 发送 jobs
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)

    // 收集 results
    for a := 1; a <= numJobs; a++ {
        <-results
    }
}
```

### Pipeline 模式

将数据处理分为多个阶段，每个阶段由独立的 goroutine 处理：

```go
package main

import "fmt"

// 第一阶段：生成数字
func generator(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

// 第二阶段：平方
func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

// 第三阶段：加倍
func double(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * 2
        }
        close(out)
    }()
    return out
}

func main() {
    // 构建 pipeline
    ch := generator(1, 2, 3, 4)
    ch = square(ch)
    ch = double(ch)

    // 输出结果
    for result := range ch {
        fmt.Println(result)
    }
}
```

### Fan-Out, Fan-In 模式

Fan-Out：将任务分发给多个 worker。Fan-In：将多个 worker 的结果合并。

```go
package main

import (
    "fmt"
    "sync"
)

func producer(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

func merge(cs ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    out := make(chan int)

    // 为每个输入 channel 启动一个 goroutine
    output := func(c <-chan int) {
        for n := range c {
            out <- n
        }
        wg.Done()
    }

    wg.Add(len(cs))
    for _, c := range cs {
        go output(c)
    }

    // 等待所有输入完成后关闭输出 channel
    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}

func main() {
    in := producer(1, 2, 3, 4, 5, 6, 7, 8)

    // Fan-out: 启动多个 square workers
    c1 := square(in)
    c2 := square(in)
    c3 := square(in)

    // Fan-in: 合并结果
    for n := range merge(c1, c2, c3) {
        fmt.Println(n)
    }
}
```

### 取消模式（Context）

使用 channel 实现优雅的取消机制：

```go
package main

import (
    "fmt"
    "time"
)

func worker(done <-chan bool) {
    for {
        select {
        case <-done:
            fmt.Println("Worker: Received cancel signal")
            return
        default:
            fmt.Println("Worker: Working...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    done := make(chan bool)

    go worker(done)

    time.Sleep(2 * time.Second)

    fmt.Println("Main: Sending cancel signal")
    done <- true

    time.Sleep(1 * time.Second)
    fmt.Println("Main: Exiting")
}
```

### 信号量模式

使用缓冲 channel 实现信号量，限制并发数量：

```go
package main

import (
    "fmt"
    "time"
)

func worker(id int, semaphore chan struct{}) {
    // 获取信号量
    semaphore <- struct{}{}

    fmt.Printf("Worker %d: Starting\n", id)
    time.Sleep(2 * time.Second)
    fmt.Printf("Worker %d: Done\n", id)

    // 释放信号量
    <-semaphore
}

func main() {
    // 最多允许 3 个并发 worker
    maxConcurrent := 3
    semaphore := make(chan struct{}, maxConcurrent)

    // 启动 10 个 workers
    for i := 1; i <= 10; i++ {
        go worker(i, semaphore)
    }

    time.Sleep(10 * time.Second)
}
```

### 通知模式

使用关闭 channel 来广播通知：

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, start <-chan struct{}, wg *sync.WaitGroup) {
    defer wg.Done()

    // 等待开始信号
    <-start

    fmt.Printf("Worker %d: Started\n", id)
    time.Sleep(time.Second)
    fmt.Printf("Worker %d: Done\n", id)
}

func main() {
    start := make(chan struct{})
    var wg sync.WaitGroup

    // 启动 5 个 workers，它们都在等待
    for i := 1; i <= 5; i++ {
        wg.Add(1)
        go worker(i, start, &wg)
    }

    fmt.Println("Main: Preparing...")
    time.Sleep(2 * time.Second)

    fmt.Println("Main: Broadcasting start signal")
    close(start) // 关闭 channel 会通知所有等待的 goroutines

    wg.Wait()
    fmt.Println("Main: All workers done")
}
```

## 最佳实践

### 关闭 Channel

- 只有发送者应该关闭 channel
- 接收者永远不应该关闭 channel
- 向已关闭的 channel 发送数据会导致 panic
- 从已关闭的 channel 接收会立即返回零值

```go
package main

import "fmt"

func main() {
    ch := make(chan int, 3)

    // 发送数据
    ch <- 1
    ch <- 2
    ch <- 3

    // 关闭 channel
    close(ch)

    // 可以继续接收，直到 channel 为空
    for num := range ch {
        fmt.Println(num)
    }

    // 从已关闭的 channel 接收返回零值
    num, ok := <-ch
    fmt.Printf("Value: %d, Channel open: %v\n", num, ok)
}
```

### 检查 Channel 是否关闭

```go
package main

import "fmt"

func main() {
    ch := make(chan int, 2)
    ch <- 1
    ch <- 2
    close(ch)

    // 使用 two-value 接收检查 channel 状态
    for {
        val, ok := <-ch
        if !ok {
            fmt.Println("Channel closed")
            break
        }
        fmt.Printf("Received: %d\n", val)
    }
}
```

### 使用 WaitGroup 等待 Goroutines

避免使用 `time.Sleep`，使用 `sync.WaitGroup`：

```go
package main

import (
    "fmt"
    "sync"
)

func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()

    fmt.Printf("Worker %d starting\n", id)
    // 模拟工作
    fmt.Printf("Worker %d done\n", id)
}

func main() {
    var wg sync.WaitGroup

    for i := 1; i <= 5; i++ {
        wg.Add(1)
        go worker(i, &wg)
    }

    // 等待所有 workers 完成
    wg.Wait()
    fmt.Println("All workers done")
}
```

### 避免 Goroutine 泄漏

确保所有启动的 goroutines 都能正常退出：

```go
package main

import (
    "fmt"
    "time"
)

// 不好的例子：goroutine 泄漏
func badExample() <-chan int {
    ch := make(chan int)
    go func() {
        for i := 0; ; i++ {
            ch <- i // 如果没有接收者，会永久阻塞
        }
    }()
    return ch
}

// 好的例子：可以取消的 goroutine
func goodExample(done <-chan struct{}) <-chan int {
    ch := make(chan int)
    go func() {
        defer close(ch)
        for i := 0; ; i++ {
            select {
            case ch <- i:
            case <-done:
                return
            }
        }
    }()
    return ch
}

func main() {
    done := make(chan struct{})
    ch := goodExample(done)

    // 接收几个值
    for i := 0; i < 5; i++ {
        fmt.Println(<-ch)
    }

    // 发送取消信号
    close(done)
    time.Sleep(100 * time.Millisecond)
    fmt.Println("Done")
}
```

### 合理选择 Channel 容量

- 无缓冲 channel：需要强同步时使用
- 小缓冲：减少 goroutine 阻塞，提高吞吐量
- 大缓冲：批处理场景，但要注意内存占用

```go
package main

import "fmt"

func main() {
    // 无缓冲：强同步
    unbuffered := make(chan int)

    // 小缓冲：常见场景
    small := make(chan int, 10)

    // 大缓冲：批处理
    large := make(chan int, 1000)

    fmt.Printf("Unbuffered cap: %d\n", cap(unbuffered))
    fmt.Printf("Small cap: %d\n", cap(small))
    fmt.Printf("Large cap: %d\n", cap(large))
}
```

### 使用 Context 进行取消控制

在实际项目中，推荐使用 `context` 包：

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func worker(ctx context.Context, id int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %d: Cancelled\n", id)
            return
        default:
            fmt.Printf("Worker %d: Working...\n", id)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    for i := 1; i <= 3; i++ {
        go worker(ctx, i)
    }

    time.Sleep(3 * time.Second)
    fmt.Println("Main: Exiting")
}
```

## 总结

Go 的 goroutines 和 channels 提供了强大而优雅的并发编程模型：

1. **Goroutines** 是轻量级的并发执行单元，使用 `go` 关键字轻松创建
2. **Channels** 是 goroutines 之间安全通信的管道
3. **无缓冲 channel** 提供同步保证，适合需要严格协调的场景
4. **带缓冲 channel** 允许异步通信，提高吞吐量
5. **Channel 方向** 增强类型安全性，明确数据流向
6. **Select 语句** 实现多路复用，支持超时和非阻塞操作
7. **并发模式** 如 worker pool、pipeline、fan-out/fan-in 解决常见并发问题

掌握这些概念和模式，你就能编写出高效、安全、可维护的并发 Go 程序。记住："不要通过共享内存来通信，而要通过通信来共享内存"——这是 Go 并发哲学的核心。
