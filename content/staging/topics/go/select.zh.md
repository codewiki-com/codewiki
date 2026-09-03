---
title: Go Select 语句
description: 深入理解 Go select 语句：多路复用、超时控制、非阻塞操作与并发模式
track: go
section: concurrency
difficulty: intermediate
tags:
  - Go
  - select
  - channel
  - 并发
  - 超时
status: imported
origin: old/src/content/docs/go/select.zh.md
divergence: 0.184
issues: []
legacy:
  category: Go
  subcategory: 并发编程
  order: 3
  lastUpdated: 2026-01-07
---

select 是 Go 语言并发编程的核心控制结构之一，它允许一个 goroutine 同时等待多个 channel 操作。通过 select，我们可以实现超时控制、非阻塞通信、任务取消等关键并发模式。

## 概念解释

### 什么是 Select？

select 语句类似于 switch 语句，但它专门用于 channel 操作。每个 case 必须是一个 channel 的发送或接收操作，select 会阻塞直到其中一个 case 可以执行。

```go
select {
case msg := <-ch1:
    // 从 ch1 接收到数据
    fmt.Println("Received:", msg)
case ch2 <- value:
    // 向 ch2 发送数据成功
    fmt.Println("Sent:", value)
case <-time.After(time.Second):
    // 超时
    fmt.Println("Timeout")
default:
    // 非阻塞：当所有 case 都不满足时执行
    fmt.Println("No activity")
}
```

### 为什么需要 Select？

在并发编程中，我们经常需要：

1. **多路复用**：同时监听多个 channel，响应最先到达的数据
2. **超时控制**：避免操作无限期阻塞
3. **非阻塞操作**：尝试发送或接收，失败时立即返回
4. **优雅取消**：响应取消信号，清理资源并退出

select 提供了优雅、高效的解决方案。

### 历史背景

select 的设计灵感来源于 Tony Hoare 的 CSP（Communicating Sequential Processes，通信顺序进程）理论。在 CSP 中，进程通过通信来同步和交换数据，而不是通过共享内存。Go 的 select 直接实现了 CSP 中的"选择性通信"概念，使开发者能够简洁地表达"等待多个事件中的任意一个"这一常见并发需求。

## 核心原理

### Select 的执行流程

1. **评估所有 case**：所有 channel 表达式和发送值表达式都会被求值
2. **检查就绪状态**：确定哪些 case 可以立即执行（channel 可读或可写）
3. **选择执行**：
   - 如果有一个或多个 case 就绪，随机选择一个执行
   - 如果没有 case 就绪但有 default，执行 default
   - 如果没有 case 就绪也没有 default，阻塞等待
4. **唤醒**：当某个 channel 就绪时，执行对应的 case

### 随机选择机制

当多个 case 同时就绪时，Go 运行时使用伪随机算法选择其中一个执行。这是有意为之的设计，目的是：

- **避免饥饿**：防止某些 case 永远得不到执行
- **公平性**：确保每个就绪的 case 都有机会被选中
- **不可预测性**：避免依赖特定的执行顺序

```go
package main

import "fmt"

func main() {
    ch1 := make(chan string, 1)
    ch2 := make(chan string, 1)

    ch1 <- "one"
    ch2 <- "two"

    // 多次执行，结果可能不同
    for i := 0; i < 5; i++ {
        // 重新填充 channel
        select {
        case <-ch1:
        default:
        }
        select {
        case <-ch2:
        default:
        }
        ch1 <- "one"
        ch2 <- "two"

        // 随机选择
        select {
        case msg := <-ch1:
            fmt.Printf("第 %d 次: 选择 ch1, 值: %s\n", i+1, msg)
        case msg := <-ch2:
            fmt.Printf("第 %d 次: 选择 ch2, 值: %s\n", i+1, msg)
        }
    }
}
```

### 底层实现

在 Go 运行时中，select 语句的实现涉及以下关键步骤：

1. **构建 scase 数组**：每个 case 对应一个 scase 结构
2. **锁定所有相关 channel**：按地址排序，避免死锁
3. **检查就绪 case**：遍历所有 case，收集就绪的
4. **随机选择或阻塞**：如果有就绪 case 则随机选择，否则将 goroutine 加入各 channel 的等待队列
5. **被唤醒后清理**：从其他 channel 的等待队列中移除

## 核心要点

### 基本语法

```go
select {
case v := <-ch:      // 接收操作
    // 处理接收到的值
case ch <- v:        // 发送操作
    // 发送成功
case v, ok := <-ch:  // 接收并检查 channel 状态
    if !ok {
        // channel 已关闭
    }
default:             // 可选的默认分支
    // 当所有 case 都阻塞时执行
}
```

### 空 Select

空 select 会永久阻塞：

```go
select {}  // 永久阻塞，常用于保持 main goroutine 运行
```

### nil Channel 行为

对 nil channel 的操作在 select 中会被忽略：

```go
var ch chan int  // nil channel

select {
case <-ch:       // 永远不会被选中
    fmt.Println("received")
default:
    fmt.Println("ch is nil, default executed")
}
```

这个特性常用于动态启用/禁用 case：

```go
func process(enableA, enableB bool) {
    var chA, chB chan int

    if enableA {
        chA = make(chan int, 1)
        chA <- 1
    }
    if enableB {
        chB = make(chan int, 1)
        chB <- 2
    }

    select {
    case v := <-chA:  // 当 enableA 为 false 时，chA 为 nil，此 case 被禁用
        fmt.Println("A:", v)
    case v := <-chB:  // 当 enableB 为 false 时，chB 为 nil，此 case 被禁用
        fmt.Println("B:", v)
    default:
        fmt.Println("No channel enabled")
    }
}
```

### 单 Case Select

只有一个 case 的 select 等价于直接对 channel 操作：

```go
// 这两种写法等价
select {
case msg := <-ch:
    fmt.Println(msg)
}

msg := <-ch
fmt.Println(msg)
```

但加上 default 就有意义了：

```go
// 非阻塞接收
select {
case msg := <-ch:
    fmt.Println(msg)
default:
    fmt.Println("No message available")
}
```

## 代码示例

### 示例 1：基本的多路复用

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)

    // 模拟两个并发任务
    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "来自服务 A 的响应"
    }()

    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "来自服务 B 的响应"
    }()

    // 等待两个响应
    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println("收到:", msg1)
        case msg2 := <-ch2:
            fmt.Println("收到:", msg2)
        }
    }
}
```

### 示例 2：Default Case - 非阻塞操作

```go
package main

import "fmt"

func main() {
    messages := make(chan string)
    signals := make(chan bool)

    // 非阻塞接收：尝试接收，如果没有消息立即返回
    select {
    case msg := <-messages:
        fmt.Println("收到消息:", msg)
    default:
        fmt.Println("没有消息可接收")
    }

    // 非阻塞发送：尝试发送，如果 channel 满或无接收者立即返回
    msg := "hello"
    select {
    case messages <- msg:
        fmt.Println("消息已发送:", msg)
    default:
        fmt.Println("无法发送消息（无接收者）")
    }

    // 多路非阻塞选择
    select {
    case msg := <-messages:
        fmt.Println("收到消息:", msg)
    case sig := <-signals:
        fmt.Println("收到信号:", sig)
    default:
        fmt.Println("没有活动")
    }
}
```

### 示例 3：超时模式

```go
package main

import (
    "fmt"
    "time"
)

// 模拟可能耗时的操作
func slowOperation(result chan<- string) {
    time.Sleep(3 * time.Second)  // 模拟耗时 3 秒
    result <- "操作完成"
}

func main() {
    result := make(chan string)

    go slowOperation(result)

    // 使用 time.After 实现超时
    select {
    case res := <-result:
        fmt.Println("结果:", res)
    case <-time.After(2 * time.Second):
        fmt.Println("操作超时!")
    }
}
```

**多次超时重试：**

```go
package main

import (
    "fmt"
    "math/rand"
    "time"
)

func fetchData(id int) <-chan string {
    ch := make(chan string)
    go func() {
        // 随机延迟 0-500ms
        delay := time.Duration(rand.Intn(500)) * time.Millisecond
        time.Sleep(delay)
        ch <- fmt.Sprintf("数据 %d (耗时 %v)", id, delay)
    }()
    return ch
}

func main() {
    const maxRetries = 3
    timeout := 200 * time.Millisecond

    for i := 1; i <= maxRetries; i++ {
        ch := fetchData(i)

        select {
        case data := <-ch:
            fmt.Printf("成功: %s\n", data)
            return
        case <-time.After(timeout):
            fmt.Printf("第 %d 次尝试超时\n", i)
        }
    }
    fmt.Println("所有重试均失败")
}
```

### 示例 4：Done Channel 模式

```go
package main

import (
    "fmt"
    "time"
)

// worker 持续工作直到收到停止信号
func worker(id int, done <-chan struct{}) {
    for {
        select {
        case <-done:
            fmt.Printf("Worker %d: 收到停止信号，正在退出...\n", id)
            return
        default:
            fmt.Printf("Worker %d: 正在工作...\n", id)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    done := make(chan struct{})

    // 启动 3 个 worker
    for i := 1; i <= 3; i++ {
        go worker(i, done)
    }

    // 让 worker 运行 2 秒
    time.Sleep(2 * time.Second)

    // 关闭 done channel 通知所有 worker 停止
    fmt.Println("\n主程序: 发送停止信号")
    close(done)

    // 等待 worker 退出
    time.Sleep(1 * time.Second)
    fmt.Println("主程序: 退出")
}
```

### 示例 5：心跳模式

```go
package main

import (
    "fmt"
    "time"
)

func workerWithHeartbeat(done <-chan struct{}, heartbeat chan<- struct{}) {
    ticker := time.NewTicker(500 * time.Millisecond)
    defer ticker.Stop()

    for {
        select {
        case <-done:
            fmt.Println("Worker: 停止")
            return
        case <-ticker.C:
            // 发送心跳
            select {
            case heartbeat <- struct{}{}:
                fmt.Println("Worker: 发送心跳")
            default:
                // 心跳 channel 满了，跳过
            }
            // 模拟工作
            fmt.Println("Worker: 执行任务...")
        }
    }
}

func monitor(heartbeat <-chan struct{}, alert chan<- string) {
    timeout := time.Second

    for {
        select {
        case <-heartbeat:
            // 收到心跳，重置超时
            fmt.Println("Monitor: 收到心跳")
        case <-time.After(timeout):
            // 超时未收到心跳
            alert <- "警告: Worker 可能已停止响应!"
            return
        }
    }
}

func main() {
    done := make(chan struct{})
    heartbeat := make(chan struct{}, 1)
    alert := make(chan string)

    go workerWithHeartbeat(done, heartbeat)
    go monitor(heartbeat, alert)

    // 运行 3 秒后停止 worker
    time.Sleep(3 * time.Second)
    close(done)

    // 等待监控报警
    select {
    case msg := <-alert:
        fmt.Println(msg)
    case <-time.After(2 * time.Second):
        fmt.Println("测试完成")
    }
}
```

### 示例 6：组合使用 Context

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func processWithContext(ctx context.Context, data <-chan int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("处理器退出: %v\n", ctx.Err())
            return
        case value, ok := <-data:
            if !ok {
                fmt.Println("数据 channel 已关闭")
                return
            }
            fmt.Printf("处理数据: %d\n", value)
        }
    }
}

func main() {
    // 创建带超时的 context
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()

    data := make(chan int)

    // 启动处理器
    go processWithContext(ctx, data)

    // 发送一些数据
    go func() {
        for i := 1; i <= 10; i++ {
            select {
            case <-ctx.Done():
                fmt.Println("发送者退出")
                return
            case data <- i:
                time.Sleep(500 * time.Millisecond)
            }
        }
        close(data)
    }()

    // 等待 context 超时
    <-ctx.Done()
    time.Sleep(100 * time.Millisecond)  // 等待 goroutine 打印退出信息
}
```

### 示例 7：优先级选择

虽然 select 是随机选择的，但可以通过嵌套 select 实现优先级：

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    highPriority := make(chan string, 1)
    lowPriority := make(chan string, 1)
    done := make(chan struct{})

    // 优先级处理器
    go func() {
        for {
            select {
            case <-done:
                return
            default:
            }

            // 首先检查高优先级
            select {
            case msg := <-highPriority:
                fmt.Println("[高优先级]", msg)
            default:
                // 高优先级为空，检查两者
                select {
                case msg := <-highPriority:
                    fmt.Println("[高优先级]", msg)
                case msg := <-lowPriority:
                    fmt.Println("[低优先级]", msg)
                case <-done:
                    return
                }
            }
        }
    }()

    // 发送消息
    highPriority <- "紧急任务 1"
    lowPriority <- "普通任务 1"
    highPriority <- "紧急任务 2"
    lowPriority <- "普通任务 2"

    time.Sleep(100 * time.Millisecond)
    close(done)
}
```

## 最佳实践

### 始终处理 channel 关闭

```go
// 推荐：检查 channel 是否关闭
select {
case value, ok := <-ch:
    if !ok {
        // channel 已关闭，进行清理
        return
    }
    process(value)
case <-done:
    return
}
```

### 使用 time.After 注意内存泄漏

```go
// 不推荐：在循环中使用 time.After 会导致内存泄漏
for {
    select {
    case <-ch:
        // 处理
    case <-time.After(time.Second):  // 每次循环创建新的 Timer
        // 超时处理
    }
}

// 推荐：使用 time.NewTimer 并手动管理
timer := time.NewTimer(time.Second)
defer timer.Stop()

for {
    select {
    case <-ch:
        // 处理
        if !timer.Stop() {
            <-timer.C
        }
        timer.Reset(time.Second)
    case <-timer.C:
        // 超时处理
        timer.Reset(time.Second)
    }
}

// 或者使用 Ticker 进行定期检查
ticker := time.NewTicker(time.Second)
defer ticker.Stop()

for {
    select {
    case <-ch:
        // 处理
    case <-ticker.C:
        // 定期处理
    }
}
```

### 避免在 select 中进行耗时操作

```go
// 不推荐：case 中执行耗时操作
select {
case msg := <-ch:
    time.Sleep(10 * time.Second)  // 阻塞其他 case
    process(msg)
}

// 推荐：快速接收，异步处理
select {
case msg := <-ch:
    go process(msg)  // 异步处理
case <-done:
    return
}
```

### 使用 done channel 而非裸 context

```go
// 推荐：封装 done channel，提供更清晰的语义
type Worker struct {
    done chan struct{}
}

func (w *Worker) Start() {
    w.done = make(chan struct{})
    go w.run()
}

func (w *Worker) Stop() {
    close(w.done)
}

func (w *Worker) run() {
    for {
        select {
        case <-w.done:
            return
        default:
            // 工作
        }
    }
}
```

### 合理使用 default

```go
// 场景 1：非阻塞发送（日志、监控等可丢弃的数据）
select {
case logCh <- entry:
    // 发送成功
default:
    // channel 满了，丢弃日志条目
}

// 场景 2：轮询模式
for {
    select {
    case <-done:
        return
    case task := <-taskCh:
        process(task)
    default:
        // 没有任务，执行其他操作或短暂休眠
        time.Sleep(10 * time.Millisecond)
    }
}
```

## 常见陷阱

### time.After 内存泄漏

```go
// 问题：time.After 创建的 Timer 在触发前不会被 GC
func problematic() {
    ch := make(chan int)
    for {
        select {
        case <-ch:
            // 处理
        case <-time.After(time.Hour):  // 每次迭代创建新 Timer，持续占用内存
            // 超时
        }
    }
}

// 解决方案：使用可复用的 Timer
func improved() {
    ch := make(chan int)
    timer := time.NewTimer(time.Hour)
    defer timer.Stop()

    for {
        select {
        case <-ch:
            // 处理
            if !timer.Stop() {
                select {
                case <-timer.C:
                default:
                }
            }
            timer.Reset(time.Hour)
        case <-timer.C:
            // 超时
            timer.Reset(time.Hour)
        }
    }
}
```

### 忽略发送失败

```go
// 问题：使用 default 发送时忽略失败
select {
case ch <- important_data:
    // 发送成功
default:
    // 静默丢弃重要数据！
}

// 改进：记录或处理失败
select {
case ch <- important_data:
    // 发送成功
default:
    log.Warn("channel 满，数据丢失:", important_data)
    // 或者使用备用策略
    handleFailedSend(important_data)
}
```

### 死锁风险

```go
// 问题：没有 default 的 select 在所有 channel 都阻塞时会死锁
func deadlock() {
    ch1 := make(chan int)
    ch2 := make(chan int)

    select {
    case <-ch1:  // 阻塞
    case <-ch2:  // 阻塞
    }  // 死锁！
}

// 解决方案：添加超时或 default
func safe() {
    ch1 := make(chan int)
    ch2 := make(chan int)

    select {
    case <-ch1:
    case <-ch2:
    case <-time.After(time.Second):
        fmt.Println("超时")
    }
}
```

### for-select 中的 break

```go
// 问题：break 只跳出 select，不跳出 for
for {
    select {
    case <-done:
        break  // 只跳出 select！循环继续
    case v := <-ch:
        process(v)
    }
}

// 解决方案 1：使用 return
func worker(done <-chan struct{}, ch <-chan int) {
    for {
        select {
        case <-done:
            return  // 退出整个函数
        case v := <-ch:
            process(v)
        }
    }
}

// 解决方案 2：使用标签
func process() {
loop:
    for {
        select {
        case <-done:
            break loop  // 跳出标签对应的 for 循环
        case v := <-ch:
            handle(v)
        }
    }
    // 继续执行清理代码
    cleanup()
}
```

### select 中的求值顺序

```go
// 问题：channel 和发送值都会在 select 开始时被求值
func issue() {
    var ch chan int
    value := getValue()  // 即使 ch 为 nil，getValue 也会被调用

    select {
    case ch <- value:  // ch 为 nil，永远不会执行，但 value 已经计算过了
    default:
    }
}

// 注意：所有 case 的表达式都会被求值，包括函数调用
select {
case ch1 <- expensive1():  // expensive1() 会被调用
case ch2 <- expensive2():  // expensive2() 也会被调用
}
```

## 性能考量

### Select 的开销

select 语句有一定的运行时开销，主要来自：

1. **case 评估**：所有 case 的 channel 和值表达式都会被求值
2. **锁操作**：需要锁定所有相关的 channel
3. **调度**：可能涉及 goroutine 的休眠和唤醒

### 基准测试对比

```go
package main

import (
    "testing"
)

func BenchmarkDirectReceive(b *testing.B) {
    ch := make(chan int, 1)
    for i := 0; i < b.N; i++ {
        ch <- i
        <-ch
    }
}

func BenchmarkSelectSingleCase(b *testing.B) {
    ch := make(chan int, 1)
    for i := 0; i < b.N; i++ {
        ch <- i
        select {
        case <-ch:
        }
    }
}

func BenchmarkSelectMultipleCases(b *testing.B) {
    ch1 := make(chan int, 1)
    ch2 := make(chan int, 1)
    for i := 0; i < b.N; i++ {
        ch1 <- i
        select {
        case <-ch1:
        case <-ch2:
        }
    }
}

func BenchmarkSelectWithDefault(b *testing.B) {
    ch := make(chan int, 1)
    for i := 0; i < b.N; i++ {
        ch <- i
        select {
        case <-ch:
        default:
        }
    }
}
```

### 优化建议

1. **减少 case 数量**：case 越多，开销越大
2. **使用带缓冲的 channel**：减少阻塞和上下文切换
3. **避免在热路径中使用 select**：对于性能关键代码，考虑使用单一 channel
4. **批量处理**：减少 select 的执行次数

```go
// 优化前：每条消息一次 select
for msg := range input {
    select {
    case <-done:
        return
    case output <- process(msg):
    }
}

// 优化后：批量处理
batch := make([]Message, 0, 100)
ticker := time.NewTicker(100 * time.Millisecond)
defer ticker.Stop()

for {
    select {
    case <-done:
        return
    case msg := <-input:
        batch = append(batch, msg)
        if len(batch) >= 100 {
            sendBatch(output, batch)
            batch = batch[:0]
        }
    case <-ticker.C:
        if len(batch) > 0 {
            sendBatch(output, batch)
            batch = batch[:0]
        }
    }
}
```

## 实战场景

### 场景 1：HTTP 请求竞速

同时请求多个镜像源，返回最快的响应：

```go
package main

import (
    "context"
    "fmt"
    "io"
    "net/http"
    "time"
)

func fetchFromMirror(ctx context.Context, url string) ([]byte, error) {
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}

func fetchWithRace(mirrors []string, timeout time.Duration) ([]byte, error) {
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()

    results := make(chan []byte, len(mirrors))
    errs := make(chan error, len(mirrors))

    for _, mirror := range mirrors {
        go func(url string) {
            data, err := fetchFromMirror(ctx, url)
            if err != nil {
                errs <- err
                return
            }
            results <- data
        }(mirror)
    }

    // 返回最快的结果
    var lastErr error
    for i := 0; i < len(mirrors); i++ {
        select {
        case data := <-results:
            return data, nil  // 收到第一个成功结果就返回
        case err := <-errs:
            lastErr = err
        case <-ctx.Done():
            return nil, ctx.Err()
        }
    }

    return nil, lastErr
}

func main() {
    mirrors := []string{
        "https://example1.com/data",
        "https://example2.com/data",
        "https://example3.com/data",
    }

    data, err := fetchWithRace(mirrors, 5*time.Second)
    if err != nil {
        fmt.Println("错误:", err)
        return
    }
    fmt.Println("获取到数据:", len(data), "字节")
}
```

### 场景 2：限流器

使用 select 实现令牌桶限流：

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type RateLimiter struct {
    tokens    chan struct{}
    done      chan struct{}
    rate      int
    capacity  int
    once      sync.Once
}

func NewRateLimiter(rate, capacity int) *RateLimiter {
    rl := &RateLimiter{
        tokens:   make(chan struct{}, capacity),
        done:     make(chan struct{}),
        rate:     rate,
        capacity: capacity,
    }

    // 初始填满令牌桶
    for i := 0; i < capacity; i++ {
        rl.tokens <- struct{}{}
    }

    // 启动令牌生成器
    go rl.refill()

    return rl
}

func (rl *RateLimiter) refill() {
    ticker := time.NewTicker(time.Second / time.Duration(rl.rate))
    defer ticker.Stop()

    for {
        select {
        case <-rl.done:
            return
        case <-ticker.C:
            select {
            case rl.tokens <- struct{}{}:
                // 添加令牌成功
            default:
                // 桶满，丢弃令牌
            }
        }
    }
}

func (rl *RateLimiter) Allow() bool {
    select {
    case <-rl.tokens:
        return true
    default:
        return false
    }
}

func (rl *RateLimiter) Wait() {
    <-rl.tokens
}

func (rl *RateLimiter) WaitWithTimeout(timeout time.Duration) bool {
    select {
    case <-rl.tokens:
        return true
    case <-time.After(timeout):
        return false
    }
}

func (rl *RateLimiter) Stop() {
    rl.once.Do(func() {
        close(rl.done)
    })
}

func main() {
    // 每秒 5 个请求，最多积累 10 个
    limiter := NewRateLimiter(5, 10)
    defer limiter.Stop()

    // 模拟 20 个请求
    for i := 1; i <= 20; i++ {
        if limiter.Allow() {
            fmt.Printf("请求 %d: 允许\n", i)
        } else {
            fmt.Printf("请求 %d: 拒绝，等待...\n", i)
            limiter.Wait()
            fmt.Printf("请求 %d: 现在允许\n", i)
        }
    }
}
```

### 场景 3：事件分发器

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Event struct {
    Type    string
    Payload interface{}
}

type EventDispatcher struct {
    subscribers map[string][]chan Event
    events      chan Event
    done        chan struct{}
    mu          sync.RWMutex
}

func NewEventDispatcher() *EventDispatcher {
    ed := &EventDispatcher{
        subscribers: make(map[string][]chan Event),
        events:      make(chan Event, 100),
        done:        make(chan struct{}),
    }
    go ed.run()
    return ed
}

func (ed *EventDispatcher) Subscribe(eventType string) <-chan Event {
    ed.mu.Lock()
    defer ed.mu.Unlock()

    ch := make(chan Event, 10)
    ed.subscribers[eventType] = append(ed.subscribers[eventType], ch)
    return ch
}

func (ed *EventDispatcher) Publish(event Event) {
    select {
    case ed.events <- event:
    default:
        fmt.Println("警告: 事件队列已满，丢弃事件")
    }
}

func (ed *EventDispatcher) run() {
    for {
        select {
        case <-ed.done:
            ed.cleanup()
            return
        case event := <-ed.events:
            ed.dispatch(event)
        }
    }
}

func (ed *EventDispatcher) dispatch(event Event) {
    ed.mu.RLock()
    defer ed.mu.RUnlock()

    // 发送给特定类型的订阅者
    if subs, ok := ed.subscribers[event.Type]; ok {
        for _, ch := range subs {
            select {
            case ch <- event:
            default:
                // 订阅者 channel 满，跳过
            }
        }
    }

    // 发送给通配符订阅者
    if subs, ok := ed.subscribers["*"]; ok {
        for _, ch := range subs {
            select {
            case ch <- event:
            default:
            }
        }
    }
}

func (ed *EventDispatcher) cleanup() {
    ed.mu.Lock()
    defer ed.mu.Unlock()

    for _, subs := range ed.subscribers {
        for _, ch := range subs {
            close(ch)
        }
    }
}

func (ed *EventDispatcher) Stop() {
    close(ed.done)
}

func main() {
    dispatcher := NewEventDispatcher()
    defer dispatcher.Stop()

    // 订阅用户事件
    userEvents := dispatcher.Subscribe("user")
    go func() {
        for event := range userEvents {
            fmt.Printf("用户事件处理器: %s - %v\n", event.Type, event.Payload)
        }
    }()

    // 订阅所有事件
    allEvents := dispatcher.Subscribe("*")
    go func() {
        for event := range allEvents {
            fmt.Printf("日志记录器: %s - %v\n", event.Type, event.Payload)
        }
    }()

    // 发布事件
    dispatcher.Publish(Event{Type: "user", Payload: "用户登录"})
    dispatcher.Publish(Event{Type: "order", Payload: "新订单"})
    dispatcher.Publish(Event{Type: "user", Payload: "用户退出"})

    time.Sleep(100 * time.Millisecond)
}
```

## 面试要点

### 常见面试问题

#### select 语句的执行流程是什么？

**答案要点**：
- 所有 case 的 channel 表达式和发送值都会被求值
- 检查哪些 case 可以立即执行（不阻塞）
- 如果有多个 case 就绪，随机选择一个执行
- 如果没有 case 就绪但有 default，执行 default
- 如果没有 case 就绪也没有 default，阻塞等待直到某个 case 就绪

#### 为什么多个 case 就绪时是随机选择？

**答案要点**：
- 避免饥饿：防止某些 case 永远得不到执行
- 保证公平性：所有就绪的 case 有相等的机会被选中
- 不可预测性：防止依赖特定的执行顺序，避免隐藏的 bug

#### 如何实现非阻塞的 channel 操作？

**答案**：使用带 default 的 select：

```go
// 非阻塞发送
select {
case ch <- value:
    // 发送成功
default:
    // 发送失败（channel 满或无接收者）
}

// 非阻塞接收
select {
case value := <-ch:
    // 接收成功
default:
    // 没有数据可接收
}
```

#### select 中对 nil channel 的操作会怎样？

**答案**：对 nil channel 的操作在 select 中会被忽略，永远不会被选中。这个特性可以用来动态启用或禁用某些 case。

#### 空 select 会发生什么？

**答案**：空 select（`select {}`）会永久阻塞，因为没有 case 也没有 default。常用于保持 main goroutine 运行。

#### time.After 在循环中使用有什么问题？

**答案**：每次调用 time.After 都会创建一个新的 Timer，如果在循环中使用而 Timer 未触发，这些 Timer 在触发前不会被垃圾回收，导致内存泄漏。应该使用 time.NewTimer 并手动管理。

#### 如何用 select 实现超时？

**答案**：

```go
select {
case result := <-ch:
    // 正常接收
case <-time.After(timeout):
    // 超时处理
}

// 或使用 context
ctx, cancel := context.WithTimeout(context.Background(), timeout)
defer cancel()

select {
case result := <-ch:
    // 正常接收
case <-ctx.Done():
    // 超时或取消
}
```

#### for-select 中如何正确退出循环？

**答案**：
- 使用 return 直接退出函数
- 使用带标签的 break：`break label`
- 使用布尔变量控制

```go
loop:
    for {
        select {
        case <-done:
            break loop  // 跳出 for 循环
        case v := <-ch:
            process(v)
        }
    }
```

### 设计题

#### 实现一个带超时的信号量

```go
type Semaphore struct {
    sem chan struct{}
}

func NewSemaphore(n int) *Semaphore {
    return &Semaphore{
        sem: make(chan struct{}, n),
    }
}

func (s *Semaphore) Acquire() {
    s.sem <- struct{}{}
}

func (s *Semaphore) AcquireWithTimeout(timeout time.Duration) bool {
    select {
    case s.sem <- struct{}{}:
        return true
    case <-time.After(timeout):
        return false
    }
}

func (s *Semaphore) Release() {
    <-s.sem
}
```

## 延伸阅读

### 官方文档

- [The Go Programming Language Specification - Select statements](https://go.dev/ref/spec#Select_statements)
- [Effective Go - Channels](https://go.dev/doc/effective_go#channels)

### 推荐文章

- [Go Concurrency Patterns: Pipelines and cancellation](https://go.dev/blog/pipelines)
- [Go Concurrency Patterns: Context](https://go.dev/blog/context)
- [Go Concurrency Patterns: Timing out, moving on](https://go.dev/blog/concurrency-timeouts)
- [Advanced Go Concurrency Patterns](https://go.dev/blog/io2013-talk-concurrency)

### 经典书籍

- 《Concurrency in Go》Katherine Cox-Buday - 深入讲解 Go 并发模式
- 《Go 语言设计与实现》左书祺 - 详细解析 select 的底层实现
- 《The Go Programming Language》Alan Donovan & Brian Kernighan - 第 8 章 Goroutines 和 Channels

### 源码阅读

- [runtime/select.go](https://github.com/golang/go/blob/master/src/runtime/select.go) - select 的运行时实现
- [runtime/chan.go](https://github.com/golang/go/blob/master/src/runtime/chan.go) - channel 的运行时实现
