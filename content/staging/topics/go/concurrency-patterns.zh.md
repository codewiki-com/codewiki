---
title: Go 并发模式
description: 深入理解 Go 并发模式：Generator、Fan-In/Fan-Out、Pipeline、Worker Pool、Rate Limiting
track: go
section: concurrency
difficulty: advanced
tags:
  - Go
  - 并发模式
  - goroutine
  - channel
  - 设计模式
status: imported
origin: old/src/content/docs/go/concurrency-patterns.zh.md
divergence: 0.184
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 并发编程
  order: 3
  lastUpdated: 2026-01-07
---

Go 语言以其优雅的并发模型著称，goroutine 和 channel 的组合为开发者提供了强大的并发编程能力。本文将深入探讨五种核心并发模式：Generator、Fan-In/Fan-Out、Pipeline、Worker Pool 和 Rate Limiting，帮助你构建高效、可靠的并发程序。

## 概念解释

### 什么是并发模式？

并发模式是解决常见并发编程问题的可复用方案。它们是经过实践验证的设计模板，帮助开发者避免常见的并发陷阱，如死锁、竞态条件和资源泄漏。

Go 的并发模式建立在 CSP（Communicating Sequential Processes，通信顺序进程）理论基础之上，核心思想是：

> "不要通过共享内存来通信，而要通过通信来共享内存。"

### 五大核心模式概览

| 模式 | 核心思想 | 典型应用场景 |
|------|----------|--------------|
| Generator | 函数返回 channel，按需生成数据 | 数据流生成、迭代器 |
| Fan-In | 多个 channel 合并为一个 | 合并多个数据源 |
| Fan-Out | 一个 channel 分发到多个 worker | 并行处理任务 |
| Pipeline | 多阶段数据处理链 | ETL、流式处理 |
| Worker Pool | 固定数量的 worker 处理任务队列 | 限制并发、资源复用 |
| Rate Limiting | 控制操作频率 | API 限流、防止过载 |

## 核心原理

### Go 调度器与 Goroutine

理解并发模式之前，需要了解 Go 运行时调度器的工作原理。Go 使用 GMP 模型：

- **G (Goroutine)**：轻量级线程，初始栈仅 2KB
- **M (Machine)**：操作系统线程
- **P (Processor)**：逻辑处理器，默认数量等于 CPU 核心数

```
┌─────────────────────────────────────────────┐
│                 Go Runtime                   │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐        │
│  │  G  │  │  G  │  │  G  │  │  G  │ ...    │
│  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘        │
│     │        │        │        │            │
│  ┌──┴────────┴────────┴────────┴──┐        │
│  │       Local Run Queue           │        │
│  └─────────────┬───────────────────┘        │
│                │                            │
│  ┌─────────────┴───────────────────┐       │
│  │              P                   │       │
│  └─────────────┬───────────────────┘       │
│                │                            │
│  ┌─────────────┴───────────────────┐       │
│  │              M                   │       │
│  └─────────────────────────────────┘       │
└─────────────────────────────────────────────┘
```

### Channel 的内部结构

Channel 是 Go 并发的核心，其内部包含：

- **buf**：环形缓冲区（带缓冲 channel）
- **sendq/recvq**：等待发送/接收的 goroutine 队列
- **lock**：保护内部状态的互斥锁

```go
// runtime/chan.go 简化结构
type hchan struct {
    qcount   uint           // 当前队列中的元素数量
    dataqsiz uint           // 环形队列的大小
    buf      unsafe.Pointer // 指向环形缓冲区
    elemsize uint16         // 元素大小
    closed   uint32         // 是否已关闭
    sendx    uint           // 发送索引
    recvx    uint           // 接收索引
    recvq    waitq          // 等待接收的 goroutine 队列
    sendq    waitq          // 等待发送的 goroutine 队列
    lock     mutex          // 互斥锁
}
```

### 并发模式的通信机制

所有并发模式都基于以下基本操作：

1. **发送**：`ch <- value`（可能阻塞）
2. **接收**：`value := <-ch`（可能阻塞）
3. **关闭**：`close(ch)`（只能由发送方执行）
4. **选择**：`select` 语句实现多路复用

## 核心要点

### Generator 模式

Generator 模式将数据生成逻辑封装在函数中，返回一个只读 channel。调用者可以按需消费数据，实现惰性求值。

**核心特点**：
- 生产者和消费者解耦
- 支持惰性计算
- 函数返回 `<-chan T` 类型

### Fan-In 模式

将多个输入 channel 合并成一个输出 channel，所有输入的数据最终流向同一个出口。

**核心特点**：
- 多对一的数据聚合
- 不保证输入顺序
- 常与 `sync.WaitGroup` 配合使用

### Fan-Out 模式

将一个输入 channel 的数据分发给多个 worker 并行处理。

**核心特点**：
- 一对多的任务分发
- 提高处理吞吐量
- worker 数量可配置

### Pipeline 模式

将数据处理分解为多个阶段，每个阶段由独立的 goroutine 执行，通过 channel 连接。

**核心特点**：
- 阶段间通过 channel 连接
- 每个阶段可独立扩展
- 支持并行和流水线处理

### Worker Pool 模式

维护固定数量的 worker goroutine，从共享的任务队列中获取任务执行。

**核心特点**：
- 限制并发度
- 复用 goroutine
- 避免资源耗尽

### Rate Limiting 模式

控制操作的执行频率，防止系统过载。

**核心特点**：
- 基于 `time.Ticker` 或令牌桶
- 支持突发流量
- 可配置限流策略

## 代码示例

### Generator 模式

Generator 模式是最基础的并发模式，它将数据生成逻辑封装在一个函数中，返回一个 channel 供消费者使用。

```go
package main

import (
    "fmt"
    "math/rand"
    "time"
)

// 基础 Generator：生成整数序列
func generateIntegers(max int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for i := 0; i < max; i++ {
            out <- i
        }
    }()
    return out
}

// 无限 Generator：生成斐波那契数列
func generateFibonacci(done <-chan struct{}) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        a, b := 0, 1
        for {
            select {
            case <-done:
                return
            case out <- a:
                a, b = b, a+b
            }
        }
    }()
    return out
}

// 带延迟的 Generator：模拟数据流
func generateWithDelay(data []string, delay time.Duration) <-chan string {
    out := make(chan string)
    go func() {
        defer close(out)
        for _, item := range data {
            time.Sleep(delay)
            out <- item
        }
    }()
    return out
}

// 随机数 Generator
func generateRandomNumbers(done <-chan struct{}, count int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        r := rand.New(rand.NewSource(time.Now().UnixNano()))
        for i := 0; i < count; i++ {
            select {
            case <-done:
                return
            case out <- r.Intn(100):
            }
        }
    }()
    return out
}

func main() {
    // 示例 1：基础整数生成器
    fmt.Println("=== 整数生成器 ===")
    for num := range generateIntegers(5) {
        fmt.Printf("%d ", num)
    }
    fmt.Println()

    // 示例 2：斐波那契数列（取前 10 个）
    fmt.Println("\n=== 斐波那契数列 ===")
    done := make(chan struct{})
    fib := generateFibonacci(done)
    for i := 0; i < 10; i++ {
        fmt.Printf("%d ", <-fib)
    }
    close(done)
    fmt.Println()

    // 示例 3：带延迟的数据流
    fmt.Println("\n=== 延迟数据流 ===")
    data := []string{"Alice", "Bob", "Charlie"}
    for name := range generateWithDelay(data, 100*time.Millisecond) {
        fmt.Printf("Received: %s\n", name)
    }
}
```

### Fan-In 模式

Fan-In 模式将多个 channel 的输出合并到一个 channel 中。

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// 基础 Fan-In：合并两个 channel
func fanIn(ch1, ch2 <-chan string) <-chan string {
    out := make(chan string)
    go func() {
        defer close(out)
        for ch1 != nil || ch2 != nil {
            select {
            case v, ok := <-ch1:
                if !ok {
                    ch1 = nil
                    continue
                }
                out <- v
            case v, ok := <-ch2:
                if !ok {
                    ch2 = nil
                    continue
                }
                out <- v
            }
        }
    }()
    return out
}

// 通用 Fan-In：合并任意数量的 channel
func fanInMultiple(channels ...<-chan string) <-chan string {
    out := make(chan string)
    var wg sync.WaitGroup

    // 为每个输入 channel 启动一个 goroutine
    multiplex := func(ch <-chan string) {
        defer wg.Done()
        for msg := range ch {
            out <- msg
        }
    }

    wg.Add(len(channels))
    for _, ch := range channels {
        go multiplex(ch)
    }

    // 等待所有输入完成后关闭输出
    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}

// 带优先级的 Fan-In
func fanInWithPriority(high, low <-chan string) <-chan string {
    out := make(chan string)
    go func() {
        defer close(out)
        for high != nil || low != nil {
            select {
            case v, ok := <-high:
                if !ok {
                    high = nil
                    continue
                }
                out <- "[HIGH] " + v
            default:
                select {
                case v, ok := <-high:
                    if !ok {
                        high = nil
                        continue
                    }
                    out <- "[HIGH] " + v
                case v, ok := <-low:
                    if !ok {
                        low = nil
                        continue
                    }
                    out <- "[LOW] " + v
                }
            }
        }
    }()
    return out
}

// 数据源模拟
func generateSource(name string, count int, delay time.Duration) <-chan string {
    out := make(chan string)
    go func() {
        defer close(out)
        for i := 0; i < count; i++ {
            time.Sleep(delay)
            out <- fmt.Sprintf("%s-%d", name, i)
        }
    }()
    return out
}

func main() {
    // 示例 1：合并两个数据源
    fmt.Println("=== 基础 Fan-In ===")
    ch1 := generateSource("Source1", 3, 100*time.Millisecond)
    ch2 := generateSource("Source2", 3, 150*time.Millisecond)

    for msg := range fanIn(ch1, ch2) {
        fmt.Println(msg)
    }

    // 示例 2：合并多个数据源
    fmt.Println("\n=== 多源 Fan-In ===")
    sources := make([]<-chan string, 3)
    for i := 0; i < 3; i++ {
        sources[i] = generateSource(fmt.Sprintf("Worker%d", i), 2, 50*time.Millisecond)
    }

    for msg := range fanInMultiple(sources...) {
        fmt.Println(msg)
    }

    // 示例 3：优先级 Fan-In
    fmt.Println("\n=== 优先级 Fan-In ===")
    highPriority := generateSource("Urgent", 2, 200*time.Millisecond)
    lowPriority := generateSource("Normal", 4, 100*time.Millisecond)

    for msg := range fanInWithPriority(highPriority, lowPriority) {
        fmt.Println(msg)
    }
}
```

### Fan-Out 模式

Fan-Out 模式将任务分发给多个 worker 并行处理。

```go
package main

import (
    "context"
    "fmt"
    "math/rand"
    "sync"
    "time"
)

// Task 定义任务结构
type Task struct {
    ID   int
    Data string
}

// Result 定义结果结构
type Result struct {
    TaskID   int
    WorkerID int
    Output   string
}

// 基础 Fan-Out：分发任务给多个 worker
func fanOut(input <-chan Task, workerCount int) <-chan Result {
    results := make(chan Result)
    var wg sync.WaitGroup

    // 启动指定数量的 worker
    for i := 0; i < workerCount; i++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            for task := range input {
                // 模拟处理耗时
                time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond)
                results <- Result{
                    TaskID:   task.ID,
                    WorkerID: workerID,
                    Output:   fmt.Sprintf("Processed: %s", task.Data),
                }
            }
        }(i)
    }

    // 等待所有 worker 完成后关闭结果 channel
    go func() {
        wg.Wait()
        close(results)
    }()

    return results
}

// 带 context 的 Fan-Out：支持取消
func fanOutWithContext(ctx context.Context, input <-chan Task, workerCount int) <-chan Result {
    results := make(chan Result)
    var wg sync.WaitGroup

    for i := 0; i < workerCount; i++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            for {
                select {
                case <-ctx.Done():
                    fmt.Printf("Worker %d: cancelled\n", workerID)
                    return
                case task, ok := <-input:
                    if !ok {
                        return
                    }
                    // 处理任务
                    time.Sleep(50 * time.Millisecond)
                    select {
                    case <-ctx.Done():
                        return
                    case results <- Result{
                        TaskID:   task.ID,
                        WorkerID: workerID,
                        Output:   fmt.Sprintf("Done: %s", task.Data),
                    }:
                    }
                }
            }
        }(i)
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    return results
}

// 动态 Fan-Out：根据负载调整 worker 数量
type DynamicFanOut struct {
    input       chan Task
    results     chan Result
    workerCount int
    maxWorkers  int
    mu          sync.Mutex
    wg          sync.WaitGroup
    ctx         context.Context
    cancel      context.CancelFunc
}

func NewDynamicFanOut(maxWorkers int) *DynamicFanOut {
    ctx, cancel := context.WithCancel(context.Background())
    d := &DynamicFanOut{
        input:      make(chan Task, 100),
        results:    make(chan Result, 100),
        maxWorkers: maxWorkers,
        ctx:        ctx,
        cancel:     cancel,
    }
    return d
}

func (d *DynamicFanOut) AddWorker() {
    d.mu.Lock()
    defer d.mu.Unlock()

    if d.workerCount >= d.maxWorkers {
        return
    }

    d.workerCount++
    d.wg.Add(1)

    go func(id int) {
        defer d.wg.Done()
        for {
            select {
            case <-d.ctx.Done():
                return
            case task, ok := <-d.input:
                if !ok {
                    return
                }
                time.Sleep(50 * time.Millisecond)
                d.results <- Result{
                    TaskID:   task.ID,
                    WorkerID: id,
                    Output:   task.Data,
                }
            }
        }
    }(d.workerCount)
}

func main() {
    rand.Seed(time.Now().UnixNano())

    // 示例 1：基础 Fan-Out
    fmt.Println("=== 基础 Fan-Out ===")
    tasks := make(chan Task, 10)
    go func() {
        defer close(tasks)
        for i := 0; i < 10; i++ {
            tasks <- Task{ID: i, Data: fmt.Sprintf("Task-%d", i)}
        }
    }()

    results := fanOut(tasks, 3)
    for result := range results {
        fmt.Printf("Task %d processed by Worker %d: %s\n",
            result.TaskID, result.WorkerID, result.Output)
    }

    // 示例 2：带取消的 Fan-Out
    fmt.Println("\n=== 可取消的 Fan-Out ===")
    ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
    defer cancel()

    tasks2 := make(chan Task, 20)
    go func() {
        defer close(tasks2)
        for i := 0; i < 20; i++ {
            select {
            case <-ctx.Done():
                return
            case tasks2 <- Task{ID: i, Data: fmt.Sprintf("Task-%d", i)}:
            }
        }
    }()

    results2 := fanOutWithContext(ctx, tasks2, 4)
    count := 0
    for result := range results2 {
        count++
        fmt.Printf("Completed: Task %d by Worker %d\n", result.TaskID, result.WorkerID)
    }
    fmt.Printf("Total completed: %d\n", count)
}
```

### Pipeline 模式

Pipeline 模式将数据处理分解为多个阶段，形成处理流水线。

```go
package main

import (
    "context"
    "fmt"
    "strings"
    "sync"
)

// 阶段 1：数据生成
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            out <- n
        }
    }()
    return out
}

// 阶段 2：平方运算
func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            out <- n * n
        }
    }()
    return out
}

// 阶段 3：过滤偶数
func filterEven(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            if n%2 == 0 {
                out <- n
            }
        }
    }()
    return out
}

// 阶段 4：加倍
func double(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            out <- n * 2
        }
    }()
    return out
}

// 通用 Pipeline 构建器
type Stage func(<-chan int) <-chan int

func buildPipeline(source <-chan int, stages ...Stage) <-chan int {
    current := source
    for _, stage := range stages {
        current = stage(current)
    }
    return current
}

// 带 Context 的 Pipeline 阶段
func squareWithContext(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for {
            select {
            case <-ctx.Done():
                return
            case n, ok := <-in:
                if !ok {
                    return
                }
                select {
                case <-ctx.Done():
                    return
                case out <- n * n:
                }
            }
        }
    }()
    return out
}

// 字符串处理 Pipeline
func generateStrings(strs ...string) <-chan string {
    out := make(chan string)
    go func() {
        defer close(out)
        for _, s := range strs {
            out <- s
        }
    }()
    return out
}

func toUpper(in <-chan string) <-chan string {
    out := make(chan string)
    go func() {
        defer close(out)
        for s := range in {
            out <- strings.ToUpper(s)
        }
    }()
    return out
}

func addPrefix(prefix string) func(<-chan string) <-chan string {
    return func(in <-chan string) <-chan string {
        out := make(chan string)
        go func() {
            defer close(out)
            for s := range in {
                out <- prefix + s
            }
        }()
        return out
    }
}

func filterLength(minLen int) func(<-chan string) <-chan string {
    return func(in <-chan string) <-chan string {
        out := make(chan string)
        go func() {
            defer close(out)
            for s := range in {
                if len(s) >= minLen {
                    out <- s
                }
            }
        }()
        return out
    }
}

// 并行 Pipeline：多个 worker 处理同一阶段
func parallelSquare(in <-chan int, workerCount int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup

    for i := 0; i < workerCount; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for n := range in {
                out <- n * n
            }
        }()
    }

    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}

func main() {
    // 示例 1：基础 Pipeline
    fmt.Println("=== 基础数字 Pipeline ===")
    // 1, 2, 3, 4, 5 -> square -> 1, 4, 9, 16, 25 -> filterEven -> 4, 16 -> double -> 8, 32
    source := generate(1, 2, 3, 4, 5)
    squared := square(source)
    filtered := filterEven(squared)
    doubled := double(filtered)

    for result := range doubled {
        fmt.Printf("%d ", result)
    }
    fmt.Println()

    // 示例 2：使用 Pipeline 构建器
    fmt.Println("\n=== Pipeline 构建器 ===")
    source2 := generate(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    pipeline := buildPipeline(source2, square, filterEven, double)

    for result := range pipeline {
        fmt.Printf("%d ", result)
    }
    fmt.Println()

    // 示例 3：字符串处理 Pipeline
    fmt.Println("\n=== 字符串 Pipeline ===")
    strings := generateStrings("hello", "go", "pipeline", "pattern", "concurrency")
    upper := toUpper(strings)
    prefixed := addPrefix(">> ")(upper)
    long := filterLength(10)(prefixed)

    for s := range long {
        fmt.Println(s)
    }

    // 示例 4：带取消的 Pipeline
    fmt.Println("\n=== 可取消的 Pipeline ===")
    ctx, cancel := context.WithCancel(context.Background())

    source3 := generate(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    result3 := squareWithContext(ctx, source3)

    count := 0
    for n := range result3 {
        fmt.Printf("%d ", n)
        count++
        if count >= 5 {
            cancel()
        }
    }
    fmt.Println()
}
```

### Worker Pool 模式

Worker Pool 模式维护固定数量的 worker，从共享任务队列获取任务处理。

```go
package main

import (
    "context"
    "fmt"
    "math/rand"
    "sync"
    "time"
)

// Job 定义任务
type Job struct {
    ID       int
    Payload  string
    Priority int
}

// JobResult 定义任务结果
type JobResult struct {
    JobID    int
    WorkerID int
    Result   string
    Duration time.Duration
    Error    error
}

// 基础 Worker Pool
type WorkerPool struct {
    workerCount int
    jobs        chan Job
    results     chan JobResult
    wg          sync.WaitGroup
}

func NewWorkerPool(workerCount, jobQueueSize int) *WorkerPool {
    return &WorkerPool{
        workerCount: workerCount,
        jobs:        make(chan Job, jobQueueSize),
        results:     make(chan JobResult, jobQueueSize),
    }
}

func (p *WorkerPool) Start() {
    for i := 0; i < p.workerCount; i++ {
        p.wg.Add(1)
        go p.worker(i)
    }
}

func (p *WorkerPool) worker(id int) {
    defer p.wg.Done()
    for job := range p.jobs {
        start := time.Now()

        // 模拟处理任务
        time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond)

        p.results <- JobResult{
            JobID:    job.ID,
            WorkerID: id,
            Result:   fmt.Sprintf("Processed: %s", job.Payload),
            Duration: time.Since(start),
        }
    }
}

func (p *WorkerPool) Submit(job Job) {
    p.jobs <- job
}

func (p *WorkerPool) Close() {
    close(p.jobs)
    p.wg.Wait()
    close(p.results)
}

func (p *WorkerPool) Results() <-chan JobResult {
    return p.results
}

// 带 Context 的 Worker Pool
type ContextWorkerPool struct {
    workerCount int
    jobs        chan Job
    results     chan JobResult
    ctx         context.Context
    cancel      context.CancelFunc
    wg          sync.WaitGroup
}

func NewContextWorkerPool(ctx context.Context, workerCount, queueSize int) *ContextWorkerPool {
    ctx, cancel := context.WithCancel(ctx)
    return &ContextWorkerPool{
        workerCount: workerCount,
        jobs:        make(chan Job, queueSize),
        results:     make(chan JobResult, queueSize),
        ctx:         ctx,
        cancel:      cancel,
    }
}

func (p *ContextWorkerPool) Start() {
    for i := 0; i < p.workerCount; i++ {
        p.wg.Add(1)
        go func(id int) {
            defer p.wg.Done()
            for {
                select {
                case <-p.ctx.Done():
                    fmt.Printf("Worker %d: shutting down\n", id)
                    return
                case job, ok := <-p.jobs:
                    if !ok {
                        return
                    }
                    start := time.Now()
                    time.Sleep(time.Duration(rand.Intn(50)) * time.Millisecond)

                    select {
                    case <-p.ctx.Done():
                        return
                    case p.results <- JobResult{
                        JobID:    job.ID,
                        WorkerID: id,
                        Result:   fmt.Sprintf("Done: %s", job.Payload),
                        Duration: time.Since(start),
                    }:
                    }
                }
            }
        }(i)
    }
}

func (p *ContextWorkerPool) Submit(job Job) bool {
    select {
    case <-p.ctx.Done():
        return false
    case p.jobs <- job:
        return true
    }
}

func (p *ContextWorkerPool) Shutdown() {
    p.cancel()
    close(p.jobs)
    p.wg.Wait()
    close(p.results)
}

// 带重试的 Worker Pool
type RetryableWorkerPool struct {
    pool       *WorkerPool
    maxRetries int
    retryDelay time.Duration
}

func processWithRetry(job Job, maxRetries int) (string, error) {
    var lastErr error
    for i := 0; i <= maxRetries; i++ {
        // 模拟可能失败的处理
        if rand.Float32() < 0.3 { // 30% 失败率
            lastErr = fmt.Errorf("random failure on attempt %d", i+1)
            time.Sleep(10 * time.Millisecond)
            continue
        }
        return fmt.Sprintf("Success: %s", job.Payload), nil
    }
    return "", fmt.Errorf("max retries exceeded: %w", lastErr)
}

func main() {
    rand.Seed(time.Now().UnixNano())

    // 示例 1：基础 Worker Pool
    fmt.Println("=== 基础 Worker Pool ===")
    pool := NewWorkerPool(3, 10)
    pool.Start()

    // 提交任务
    go func() {
        for i := 0; i < 10; i++ {
            pool.Submit(Job{
                ID:      i,
                Payload: fmt.Sprintf("Task-%d", i),
            })
        }
        pool.Close()
    }()

    // 收集结果
    for result := range pool.Results() {
        fmt.Printf("Job %d by Worker %d: %s (took %v)\n",
            result.JobID, result.WorkerID, result.Result, result.Duration)
    }

    // 示例 2：带 Context 的 Worker Pool
    fmt.Println("\n=== Context Worker Pool ===")
    ctx, cancel := context.WithTimeout(context.Background(), 300*time.Millisecond)
    defer cancel()

    ctxPool := NewContextWorkerPool(ctx, 4, 20)
    ctxPool.Start()

    // 提交任务
    submitted := 0
    for i := 0; i < 30; i++ {
        if ctxPool.Submit(Job{ID: i, Payload: fmt.Sprintf("Job-%d", i)}) {
            submitted++
        } else {
            break
        }
    }
    fmt.Printf("Submitted %d jobs\n", submitted)

    // 收集结果直到超时
    go func() {
        time.Sleep(350 * time.Millisecond)
        ctxPool.Shutdown()
    }()

    completed := 0
    for result := range ctxPool.results {
        completed++
        fmt.Printf("Completed Job %d by Worker %d\n", result.JobID, result.WorkerID)
    }
    fmt.Printf("Completed %d jobs\n", completed)

    // 示例 3：Worker Pool 统计
    fmt.Println("\n=== Worker Pool 统计 ===")
    statsPool := NewWorkerPool(5, 100)
    statsPool.Start()

    var totalDuration time.Duration
    var mu sync.Mutex
    var statsWg sync.WaitGroup

    // 收集统计
    statsWg.Add(1)
    go func() {
        defer statsWg.Done()
        for result := range statsPool.Results() {
            mu.Lock()
            totalDuration += result.Duration
            mu.Unlock()
        }
    }()

    // 提交任务
    jobCount := 50
    for i := 0; i < jobCount; i++ {
        statsPool.Submit(Job{ID: i, Payload: fmt.Sprintf("Job-%d", i)})
    }
    statsPool.Close()
    statsWg.Wait()

    fmt.Printf("Total jobs: %d\n", jobCount)
    fmt.Printf("Total processing time: %v\n", totalDuration)
    fmt.Printf("Average time per job: %v\n", totalDuration/time.Duration(jobCount))
}
```

### Rate Limiting 模式

Rate Limiting 模式用于控制操作的执行频率，防止系统过载。

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

// 基础速率限制器（基于 time.Ticker）
type BasicRateLimiter struct {
    ticker *time.Ticker
    done   chan struct{}
}

func NewBasicRateLimiter(rate time.Duration) *BasicRateLimiter {
    return &BasicRateLimiter{
        ticker: time.NewTicker(rate),
        done:   make(chan struct{}),
    }
}

func (r *BasicRateLimiter) Wait() bool {
    select {
    case <-r.ticker.C:
        return true
    case <-r.done:
        return false
    }
}

func (r *BasicRateLimiter) Stop() {
    close(r.done)
    r.ticker.Stop()
}

// 令牌桶速率限制器
type TokenBucket struct {
    tokens     chan struct{}
    refillRate time.Duration
    capacity   int
    done       chan struct{}
    wg         sync.WaitGroup
}

func NewTokenBucket(capacity int, refillRate time.Duration) *TokenBucket {
    tb := &TokenBucket{
        tokens:     make(chan struct{}, capacity),
        refillRate: refillRate,
        capacity:   capacity,
        done:       make(chan struct{}),
    }

    // 初始化令牌
    for i := 0; i < capacity; i++ {
        tb.tokens <- struct{}{}
    }

    // 启动令牌补充 goroutine
    tb.wg.Add(1)
    go tb.refill()

    return tb
}

func (tb *TokenBucket) refill() {
    defer tb.wg.Done()
    ticker := time.NewTicker(tb.refillRate)
    defer ticker.Stop()

    for {
        select {
        case <-tb.done:
            return
        case <-ticker.C:
            select {
            case tb.tokens <- struct{}{}:
                // 添加令牌成功
            default:
                // 桶已满，丢弃令牌
            }
        }
    }
}

func (tb *TokenBucket) Take() bool {
    select {
    case <-tb.tokens:
        return true
    case <-tb.done:
        return false
    }
}

func (tb *TokenBucket) TakeWithTimeout(timeout time.Duration) bool {
    select {
    case <-tb.tokens:
        return true
    case <-time.After(timeout):
        return false
    case <-tb.done:
        return false
    }
}

func (tb *TokenBucket) Stop() {
    close(tb.done)
    tb.wg.Wait()
}

// 滑动窗口速率限制器
type SlidingWindowLimiter struct {
    requests   []time.Time
    windowSize time.Duration
    maxReqs    int
    mu         sync.Mutex
}

func NewSlidingWindowLimiter(maxReqs int, windowSize time.Duration) *SlidingWindowLimiter {
    return &SlidingWindowLimiter{
        requests:   make([]time.Time, 0),
        windowSize: windowSize,
        maxReqs:    maxReqs,
    }
}

func (l *SlidingWindowLimiter) Allow() bool {
    l.mu.Lock()
    defer l.mu.Unlock()

    now := time.Now()
    windowStart := now.Add(-l.windowSize)

    // 清理过期请求
    valid := make([]time.Time, 0)
    for _, t := range l.requests {
        if t.After(windowStart) {
            valid = append(valid, t)
        }
    }
    l.requests = valid

    // 检查是否超过限制
    if len(l.requests) >= l.maxReqs {
        return false
    }

    l.requests = append(l.requests, now)
    return true
}

// 带突发的速率限制器
type BurstRateLimiter struct {
    ticker   *time.Ticker
    burst    chan struct{}
    done     chan struct{}
    wg       sync.WaitGroup
}

func NewBurstRateLimiter(rate time.Duration, burstSize int) *BurstRateLimiter {
    bl := &BurstRateLimiter{
        ticker: time.NewTicker(rate),
        burst:  make(chan struct{}, burstSize),
        done:   make(chan struct{}),
    }

    // 填充突发容量
    for i := 0; i < burstSize; i++ {
        bl.burst <- struct{}{}
    }

    // 持续补充
    bl.wg.Add(1)
    go func() {
        defer bl.wg.Done()
        for {
            select {
            case <-bl.done:
                return
            case <-bl.ticker.C:
                select {
                case bl.burst <- struct{}{}:
                default:
                }
            }
        }
    }()

    return bl
}

func (bl *BurstRateLimiter) Allow() bool {
    select {
    case <-bl.burst:
        return true
    default:
        return false
    }
}

func (bl *BurstRateLimiter) Wait(ctx context.Context) bool {
    select {
    case <-bl.burst:
        return true
    case <-ctx.Done():
        return false
    case <-bl.done:
        return false
    }
}

func (bl *BurstRateLimiter) Stop() {
    close(bl.done)
    bl.ticker.Stop()
    bl.wg.Wait()
}

// 请求处理函数
func processRequest(id int) {
    fmt.Printf("[%s] Processing request %d\n",
        time.Now().Format("15:04:05.000"), id)
}

func main() {
    // 示例 1：基础速率限制
    fmt.Println("=== 基础速率限制 (每 200ms 一个请求) ===")
    limiter := NewBasicRateLimiter(200 * time.Millisecond)

    for i := 0; i < 5; i++ {
        limiter.Wait()
        processRequest(i)
    }
    limiter.Stop()

    // 示例 2：令牌桶
    fmt.Println("\n=== 令牌桶 (容量 3, 每 200ms 补充) ===")
    bucket := NewTokenBucket(3, 200*time.Millisecond)

    // 快速消耗初始令牌
    for i := 0; i < 5; i++ {
        if bucket.TakeWithTimeout(100 * time.Millisecond) {
            processRequest(i)
        } else {
            fmt.Printf("[%s] Request %d: rate limited\n",
                time.Now().Format("15:04:05.000"), i)
        }
    }

    // 等待令牌补充
    time.Sleep(500 * time.Millisecond)

    for i := 5; i < 8; i++ {
        if bucket.Take() {
            processRequest(i)
        }
    }
    bucket.Stop()

    // 示例 3：滑动窗口
    fmt.Println("\n=== 滑动窗口 (1秒内最多 3 个请求) ===")
    window := NewSlidingWindowLimiter(3, time.Second)

    for i := 0; i < 10; i++ {
        if window.Allow() {
            processRequest(i)
        } else {
            fmt.Printf("[%s] Request %d: rejected\n",
                time.Now().Format("15:04:05.000"), i)
        }
        time.Sleep(200 * time.Millisecond)
    }

    // 示例 4：突发速率限制
    fmt.Println("\n=== 突发速率限制 (突发 5, 每 500ms 补充) ===")
    burstLimiter := NewBurstRateLimiter(500*time.Millisecond, 5)

    // 突发请求
    fmt.Println("--- 突发请求 ---")
    for i := 0; i < 8; i++ {
        if burstLimiter.Allow() {
            processRequest(i)
        } else {
            fmt.Printf("[%s] Request %d: burst limit reached\n",
                time.Now().Format("15:04:05.000"), i)
        }
    }

    // 等待补充
    fmt.Println("--- 等待补充后继续 ---")
    time.Sleep(1500 * time.Millisecond)

    for i := 8; i < 12; i++ {
        ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
        if burstLimiter.Wait(ctx) {
            processRequest(i)
        }
        cancel()
    }
    burstLimiter.Stop()
}
```

## 最佳实践

### 始终关闭 Channel

发送方负责关闭 channel，避免向已关闭的 channel 发送数据导致 panic。

```go
// 正确的做法
func producer(out chan<- int) {
    defer close(out) // 发送方关闭
    for i := 0; i < 10; i++ {
        out <- i
    }
}

// 消费者只接收，不关闭
func consumer(in <-chan int) {
    for v := range in {
        process(v)
    }
}
```

### 使用 Context 控制生命周期

```go
func worker(ctx context.Context, jobs <-chan Job) {
    for {
        select {
        case <-ctx.Done():
            return // 优雅退出
        case job, ok := <-jobs:
            if !ok {
                return
            }
            processJob(job)
        }
    }
}
```

### 避免 Goroutine 泄漏

```go
// 不好：goroutine 可能永远阻塞
func bad() <-chan int {
    ch := make(chan int)
    go func() {
        for i := 0; ; i++ {
            ch <- i // 如果没人接收，永远阻塞
        }
    }()
    return ch
}

// 好：可取消的 goroutine
func good(done <-chan struct{}) <-chan int {
    ch := make(chan int)
    go func() {
        defer close(ch)
        for i := 0; ; i++ {
            select {
            case <-done:
                return
            case ch <- i:
            }
        }
    }()
    return ch
}
```

### 合理设置缓冲大小

```go
// 无缓冲：强同步，适合信号传递
signal := make(chan struct{})

// 小缓冲：减少阻塞，适合生产消费速度接近的场景
jobs := make(chan Job, 10)

// 大缓冲：吸收突发流量，适合生产速度波动大的场景
events := make(chan Event, 1000)
```

### 使用 sync.WaitGroup 等待完成

```go
func processAll(items []Item) {
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        go func(it Item) {
            defer wg.Done()
            process(it)
        }(item)
    }

    wg.Wait() // 等待所有处理完成
}
```

## 常见陷阱

### Channel 的 nil 陷阱

```go
var ch chan int // nil channel

// 向 nil channel 发送会永久阻塞
ch <- 1 // 永久阻塞

// 从 nil channel 接收也会永久阻塞
<-ch // 永久阻塞

// 关闭 nil channel 会 panic
close(ch) // panic: close of nil channel
```

### 向已关闭的 Channel 发送数据

```go
ch := make(chan int)
close(ch)
ch <- 1 // panic: send on closed channel
```

### 循环变量捕获问题

```go
// 错误：所有 goroutine 可能都使用相同的 i 值
for i := 0; i < 10; i++ {
    go func() {
        fmt.Println(i) // 可能都打印 10
    }()
}

// 正确：通过参数传递
for i := 0; i < 10; i++ {
    go func(n int) {
        fmt.Println(n)
    }(i)
}
```

### select 的随机性

```go
// 当多个 case 都准备好时，select 随机选择一个
select {
case ch1 <- 1:
case ch2 <- 2:
case ch3 <- 3:
}
// 无法保证执行顺序
```

### 死锁场景

```go
// 单一 goroutine 死锁
func main() {
    ch := make(chan int)
    ch <- 1 // 死锁：没有接收者
    <-ch
}

// 循环依赖死锁
func deadlock() {
    ch1 := make(chan int)
    ch2 := make(chan int)

    go func() {
        <-ch1
        ch2 <- 1
    }()

    go func() {
        <-ch2
        ch1 <- 1
    }()
    // 两个 goroutine 互相等待
}
```

## 性能考量

### Goroutine 开销

```go
// Goroutine 初始栈约 2KB，按需增长
// 创建百万级 goroutine 是可行的，但要注意内存

func benchmark() {
    var wg sync.WaitGroup
    start := time.Now()

    for i := 0; i < 1000000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            time.Sleep(time.Millisecond)
        }()
    }

    wg.Wait()
    fmt.Printf("Created 1M goroutines in %v\n", time.Since(start))
}
```

### Channel vs Mutex

```go
// Channel 适合数据传递和同步
// Mutex 适合保护共享状态

// 使用 Channel
type Counter struct {
    ch chan int
}

func (c *Counter) Inc() {
    c.ch <- 1
}

// 使用 Mutex（通常更快）
type MutexCounter struct {
    mu    sync.Mutex
    count int
}

func (c *MutexCounter) Inc() {
    c.mu.Lock()
    c.count++
    c.mu.Unlock()
}
```

### 缓冲 Channel 的吞吐量

```go
// 增加缓冲可以减少阻塞，提高吞吐量
// 但过大的缓冲会占用内存，延迟问题发现

// 基准测试不同缓冲大小
func BenchmarkBufferSize(b *testing.B) {
    sizes := []int{0, 1, 10, 100, 1000}
    for _, size := range sizes {
        b.Run(fmt.Sprintf("size-%d", size), func(b *testing.B) {
            ch := make(chan int, size)
            go func() {
                for i := 0; i < b.N; i++ {
                    ch <- i
                }
                close(ch)
            }()
            for range ch {
            }
        })
    }
}
```

### 使用 sync.Pool 减少分配

```go
var bufPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 1024)
    },
}

func processWithPool() {
    buf := bufPool.Get().([]byte)
    defer bufPool.Put(buf)

    // 使用 buf 处理数据
}
```

## 实战场景

### 场景 1：Web 爬虫

```go
type Crawler struct {
    workerCount int
    maxDepth    int
    visited     sync.Map
    results     chan *Page
    jobs        chan *CrawlJob
    wg          sync.WaitGroup
}

type CrawlJob struct {
    URL   string
    Depth int
}

type Page struct {
    URL     string
    Title   string
    Links   []string
}

func (c *Crawler) Start(ctx context.Context, seedURLs []string) <-chan *Page {
    c.results = make(chan *Page, 100)
    c.jobs = make(chan *CrawlJob, 1000)

    // 启动 workers
    for i := 0; i < c.workerCount; i++ {
        c.wg.Add(1)
        go c.worker(ctx)
    }

    // 提交种子 URL
    go func() {
        for _, url := range seedURLs {
            c.jobs <- &CrawlJob{URL: url, Depth: 0}
        }
    }()

    // 等待完成并关闭结果 channel
    go func() {
        c.wg.Wait()
        close(c.results)
    }()

    return c.results
}

func (c *Crawler) worker(ctx context.Context) {
    defer c.wg.Done()
    for {
        select {
        case <-ctx.Done():
            return
        case job, ok := <-c.jobs:
            if !ok {
                return
            }
            c.processJob(ctx, job)
        }
    }
}

func (c *Crawler) processJob(ctx context.Context, job *CrawlJob) {
    if job.Depth > c.maxDepth {
        return
    }

    if _, loaded := c.visited.LoadOrStore(job.URL, true); loaded {
        return
    }

    // 模拟抓取页面
    page := &Page{
        URL:   job.URL,
        Title: fmt.Sprintf("Page: %s", job.URL),
        Links: []string{job.URL + "/link1", job.URL + "/link2"},
    }

    select {
    case <-ctx.Done():
        return
    case c.results <- page:
    }

    // 提交新发现的链接
    for _, link := range page.Links {
        select {
        case <-ctx.Done():
            return
        case c.jobs <- &CrawlJob{URL: link, Depth: job.Depth + 1}:
        default:
            // 任务队列满，跳过
        }
    }
}
```

### 场景 2：实时数据处理 Pipeline

```go
type DataPipeline struct {
    input   chan RawData
    output  chan ProcessedData
    errors  chan error
    workers int
}

type RawData struct {
    ID        string
    Timestamp time.Time
    Payload   []byte
}

type ProcessedData struct {
    ID        string
    Timestamp time.Time
    Result    interface{}
}

func (p *DataPipeline) Start(ctx context.Context) {
    // 阶段 1：验证
    validated := p.validate(ctx, p.input)

    // 阶段 2：转换（Fan-Out）
    transformed := make([]<-chan ProcessedData, p.workers)
    for i := 0; i < p.workers; i++ {
        transformed[i] = p.transform(ctx, validated)
    }

    // 阶段 3：合并（Fan-In）
    merged := p.merge(ctx, transformed...)

    // 阶段 4：输出
    go func() {
        for data := range merged {
            select {
            case <-ctx.Done():
                return
            case p.output <- data:
            }
        }
        close(p.output)
    }()
}

func (p *DataPipeline) validate(ctx context.Context, in <-chan RawData) <-chan RawData {
    out := make(chan RawData)
    go func() {
        defer close(out)
        for data := range in {
            select {
            case <-ctx.Done():
                return
            default:
                if len(data.Payload) > 0 {
                    out <- data
                }
            }
        }
    }()
    return out
}

func (p *DataPipeline) transform(ctx context.Context, in <-chan RawData) <-chan ProcessedData {
    out := make(chan ProcessedData)
    go func() {
        defer close(out)
        for data := range in {
            select {
            case <-ctx.Done():
                return
            case out <- ProcessedData{
                ID:        data.ID,
                Timestamp: data.Timestamp,
                Result:    string(data.Payload),
            }:
            }
        }
    }()
    return out
}

func (p *DataPipeline) merge(ctx context.Context, channels ...<-chan ProcessedData) <-chan ProcessedData {
    out := make(chan ProcessedData)
    var wg sync.WaitGroup

    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan ProcessedData) {
            defer wg.Done()
            for data := range c {
                select {
                case <-ctx.Done():
                    return
                case out <- data:
                }
            }
        }(ch)
    }

    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}
```

### 场景 3：API 网关限流

```go
type APIGateway struct {
    limiters map[string]*TokenBucket
    mu       sync.RWMutex
    config   RateLimitConfig
}

type RateLimitConfig struct {
    DefaultRate   int           // 每秒请求数
    DefaultBurst  int           // 突发容量
    RefillPeriod  time.Duration // 补充周期
}

func NewAPIGateway(config RateLimitConfig) *APIGateway {
    return &APIGateway{
        limiters: make(map[string]*TokenBucket),
        config:   config,
    }
}

func (g *APIGateway) getLimiter(clientID string) *TokenBucket {
    g.mu.RLock()
    limiter, exists := g.limiters[clientID]
    g.mu.RUnlock()

    if exists {
        return limiter
    }

    g.mu.Lock()
    defer g.mu.Unlock()

    // 双重检查
    if limiter, exists = g.limiters[clientID]; exists {
        return limiter
    }

    limiter = NewTokenBucket(g.config.DefaultBurst, g.config.RefillPeriod)
    g.limiters[clientID] = limiter
    return limiter
}

func (g *APIGateway) HandleRequest(ctx context.Context, clientID string, handler func() (interface{}, error)) (interface{}, error) {
    limiter := g.getLimiter(clientID)

    if !limiter.TakeWithTimeout(100 * time.Millisecond) {
        return nil, fmt.Errorf("rate limit exceeded for client: %s", clientID)
    }

    return handler()
}
```

## 面试要点

### Goroutine 与线程的区别

**问：Goroutine 和操作系统线程有什么区别？**

答：
| 特性 | Goroutine | OS 线程 |
|------|-----------|---------|
| 内存占用 | 初始 2KB，可动态增长 | 通常 1-8MB 固定栈 |
| 创建成本 | 几十纳秒 | 几微秒 |
| 切换成本 | 几百纳秒（用户态） | 几微秒（内核态） |
| 调度器 | Go 运行时（GMP 模型） | 操作系统内核 |
| 数量限制 | 可创建百万级 | 通常数千个 |

### Channel 的底层实现

**问：Channel 是如何实现的？什么时候会阻塞？**

答：Channel 底层是一个包含环形缓冲区、发送/接收等待队列和互斥锁的结构体。

阻塞情况：
- 向无缓冲 channel 发送，没有接收者
- 向满的缓冲 channel 发送
- 从空 channel 接收
- 从 nil channel 发送或接收

### select 的工作原理

**问：select 语句是如何工作的？多个 case 同时满足时怎么处理？**

答：
- select 会等待任意一个 case 满足条件
- 当多个 case 同时满足时，Go 运行时会使用伪随机算法选择一个执行
- 如果有 default case，当所有其他 case 都阻塞时会执行 default
- 空的 select {} 会永久阻塞

### 如何避免 Goroutine 泄漏

**问：什么是 Goroutine 泄漏？如何避免？**

答：Goroutine 泄漏是指 goroutine 无法正常退出，持续占用资源。

避免方法：
1. 使用 context 传递取消信号
2. 确保 channel 最终会被关闭
3. 使用 select 监听 done channel
4. 设置超时机制
5. 使用 errgroup 管理 goroutine 生命周期

### Worker Pool 与直接创建 Goroutine 的区别

**问：什么时候使用 Worker Pool？什么时候直接创建 Goroutine？**

答：
- **使用 Worker Pool**：
  - 任务数量大且持续
  - 需要限制并发度
  - 任务处理时间较短
  - 需要复用资源

- **直接创建 Goroutine**：
  - 任务数量少
  - 任务之间相互独立
  - 任务执行时间较长
  - 简单场景

### Pipeline 模式的优缺点

**问：Pipeline 模式有什么优缺点？什么场景适合使用？**

答：
优点：
- 阶段解耦，易于维护
- 可以并行处理不同阶段
- 支持背压机制
- 便于添加新阶段

缺点：
- 增加代码复杂度
- 可能引入延迟
- 需要处理 channel 关闭和错误传播

适用场景：
- ETL 数据处理
- 流式数据处理
- 图像/视频处理
- 日志处理管道

## 延伸阅读

### 官方资源
- [Go 并发模式（Go Blog）](https://go.dev/blog/pipelines)
- [高级 Go 并发模式（GopherCon 2013）](https://go.dev/blog/advanced-go-concurrency-patterns)
- [Go 内存模型](https://go.dev/ref/mem)

### 经典文章
- [Go Concurrency Patterns: Context](https://go.dev/blog/context)
- [Go Concurrency Patterns: Timing out, moving on](https://go.dev/blog/concurrency-timeouts)
- [Share Memory By Communicating](https://go.dev/blog/share-memory-by-communicating)

### 推荐书籍
- 《Concurrency in Go》Katherine Cox-Buday
- 《Go 语言高级编程》柴树杉、曹春晖
- 《Go 语言设计与实现》左书祺

### 工具与库
- [golang.org/x/sync/errgroup](https://pkg.go.dev/golang.org/x/sync/errgroup)
- [golang.org/x/time/rate](https://pkg.go.dev/golang.org/x/time/rate)
- [uber-go/ratelimit](https://github.com/uber-go/ratelimit)

## 总结

Go 并发模式是构建高效并发程序的基石。本文详细介绍了六种核心模式：

1. **Generator**：封装数据生成逻辑，返回只读 channel
2. **Fan-In**：合并多个数据源到单一输出
3. **Fan-Out**：分发任务给多个 worker 并行处理
4. **Pipeline**：构建多阶段数据处理流水线
5. **Worker Pool**：限制并发度，复用 goroutine
6. **Rate Limiting**：控制操作频率，防止过载

掌握这些模式，结合 context 进行生命周期管理，使用 sync 包进行同步协调，你就能编写出高效、可靠、可维护的 Go 并发程序。记住 Go 的并发哲学：

> "Don't communicate by sharing memory; share memory by communicating."

实践中，选择合适的模式取决于具体场景。从简单开始，逐步优化，持续测试，是构建健壮并发系统的正确方法。
