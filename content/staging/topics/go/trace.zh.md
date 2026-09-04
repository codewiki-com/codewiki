---
title: Go 执行跟踪器 (Execution Tracer)
description: 深入理解 Go runtime/trace 执行跟踪器，掌握 goroutine 调度分析、延迟诊断与程序行为可视化
track: go
section: services-tooling
difficulty: advanced
tags:
  - Go
  - trace
  - 性能分析
  - 并发
  - 调度器
status: imported
origin: old/src/content/docs/go/trace.zh.md
divergence: 0.206
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 性能优化
  order: 12
  lastUpdated: 2026-01-07
---

Go 执行跟踪器 (Execution Tracer) 是 Go 运行时提供的一种强大的诊断工具，它可以捕获程序运行期间发生的各种事件，包括 goroutine 的创建、阻塞、唤醒，系统调用，GC 活动，处理器调度等。与 pprof 采样分析不同，执行跟踪器记录的是精确的事件时间线，能够帮助开发者深入理解程序的并发行为和延迟来源。

## 概念解释

### 什么是执行跟踪器

执行跟踪器是 Go 标准库 `runtime/trace` 包提供的功能，它通过在 Go 运行时的关键位置插入追踪点，记录程序执行过程中的各种事件。这些事件被收集到一个二进制格式的 trace 文件中，然后可以使用 `go tool trace` 工具进行可视化分析。

### 与 pprof 的区别

| 特性 | pprof | trace |
|-----|-------|-------|
| 数据收集方式 | 采样 (Sampling) | 事件记录 (Event-based) |
| 时间精度 | 统计近似值 | 精确时间戳 |
| 分析维度 | 资源消耗热点 | 事件时间线 |
| 性能开销 | 较低 | 较高 |
| 适用场景 | CPU/内存热点定位 | 延迟分析、调度问题 |
| 输出格式 | Profile 数据 | 事件流 |

### 执行跟踪器能解决的问题

1. **延迟分析**：请求为什么慢？时间花在哪里？
2. **调度问题**：goroutine 为什么没有被及时调度？
3. **阻塞分析**：goroutine 在等待什么？
4. **并行度分析**：程序是否充分利用了多核？
5. **GC 影响**：GC 对程序延迟的影响有多大？
6. **系统调用**：哪些系统调用造成了阻塞？

## 核心原理

### 追踪事件类型

Go 运行时在以下关键点记录追踪事件：

```
1. Goroutine 事件
   - GoCreate: goroutine 创建
   - GoStart: goroutine 开始执行
   - GoEnd: goroutine 结束
   - GoStop: goroutine 停止（让出处理器）
   - GoBlock: goroutine 阻塞
   - GoUnblock: goroutine 解除阻塞
   - GoSched: goroutine 主动让出
   - GoPreempt: goroutine 被抢占
   - GoSleep: goroutine 休眠
   - GoWaiting: goroutine 等待中

2. 处理器 (P) 事件
   - ProcStart: 处理器开始运行
   - ProcStop: 处理器停止

3. GC 事件
   - GCStart: GC 开始
   - GCDone: GC 结束
   - GCSTWStart: Stop-The-World 开始
   - GCSTWDone: Stop-The-World 结束
   - GCSweepStart: 清扫开始
   - GCSweepDone: 清扫结束

4. 系统调用事件
   - GoSysCall: 进入系统调用
   - GoSysExit: 退出系统调用
   - GoSysBlock: 系统调用阻塞

5. 网络事件
   - GoBlockNet: 网络阻塞
   - GoUnblockNet: 网络解除阻塞

6. 用户自定义事件
   - UserLog: 用户日志
   - UserTaskCreate: 用户任务创建
   - UserTaskEnd: 用户任务结束
   - UserRegionStart: 用户区域开始
   - UserRegionEnd: 用户区域结束
```

### 追踪数据收集机制

```go
// 简化的追踪机制原理
// 每个 P (处理器) 维护一个本地事件缓冲区

// 1. 事件记录
func traceEvent(ev byte, skip int, args ...uint64) {
    // 获取当前 P 的追踪缓冲区
    buf := getg().m.p.ptr().tracebuf

    // 记录时间戳
    timestamp := nanotime()

    // 写入事件类型和参数
    buf.write(ev, timestamp, args...)

    // 缓冲区满时刷新到全局
    if buf.full() {
        traceFlush(buf)
    }
}

// 2. 数据刷新
func traceFlush(buf *traceBuf) {
    // 将本地缓冲区追加到全局追踪数据
    lock(&trace.lock)
    trace.fullBufs = append(trace.fullBufs, buf)
    unlock(&trace.lock)
}
```

### 时间戳精度

执行跟踪器使用纳秒级时间戳，这使得它能够精确测量：

- goroutine 调度延迟
- 系统调用耗时
- GC 停顿时间
- 网络 I/O 等待时间

## 核心要点

### 基础 API

```go
import "runtime/trace"

// 核心函数
trace.Start(w io.Writer) error  // 开始追踪
trace.Stop()                     // 停止追踪

// 用户注解
trace.Log(ctx context.Context, category, message string)
trace.Logf(ctx context.Context, category, format string, args ...interface{})

// 任务和区域（用于结构化追踪）
trace.NewTask(ctx context.Context, name string) (context.Context, *trace.Task)
trace.StartRegion(ctx context.Context, name string) *trace.Region
trace.WithRegion(ctx context.Context, name string, fn func())
```

### trace 文件格式

trace 文件是一个二进制格式文件，包含：
- 文件头：版本信息、时间戳基准
- 事件流：按时间顺序的事件序列
- 栈信息：事件对应的调用栈
- 字符串表：事件中使用的字符串

### go tool trace 视图

| 视图 | 功能 | 用途 |
|-----|------|-----|
| View trace | 时间线视图 | 查看事件时间线 |
| Goroutine analysis | Goroutine 分析 | 分析 goroutine 行为 |
| Network blocking profile | 网络阻塞分析 | 网络延迟问题 |
| Synchronization blocking profile | 同步阻塞分析 | 锁竞争问题 |
| Syscall blocking profile | 系统调用分析 | 系统调用延迟 |
| Scheduler latency profile | 调度延迟分析 | 调度问题 |
| User-defined tasks | 用户任务 | 自定义任务追踪 |
| User-defined regions | 用户区域 | 自定义区域追踪 |
| Minimum mutator utilization | MMU | GC 影响分析 |

## 代码示例

### 基础用法

```go
package main

import (
    "fmt"
    "os"
    "runtime/trace"
    "sync"
    "time"
)

func main() {
    // 创建 trace 文件
    f, err := os.Create("trace.out")
    if err != nil {
        panic(err)
    }
    defer f.Close()

    // 开始追踪
    if err := trace.Start(f); err != nil {
        panic(err)
    }
    defer trace.Stop()

    // 执行需要追踪的代码
    doWork()
}

func doWork() {
    var wg sync.WaitGroup

    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            fmt.Printf("Worker %d starting\n", id)
            time.Sleep(100 * time.Millisecond)
            fmt.Printf("Worker %d done\n", id)
        }(i)
    }

    wg.Wait()
}
```

运行和分析：

```bash
# 运行程序生成 trace 文件
go run main.go

# 使用 go tool trace 分析
go tool trace trace.out
```

### 使用用户注解

```go
package main

import (
    "context"
    "os"
    "runtime/trace"
    "time"
)

func main() {
    f, _ := os.Create("trace.out")
    defer f.Close()
    trace.Start(f)
    defer trace.Stop()

    ctx := context.Background()

    // 创建任务：用于追踪一个逻辑工作单元
    ctx, task := trace.NewTask(ctx, "main-task")
    defer task.End()

    // 处理请求
    processRequest(ctx, "user-123")
}

func processRequest(ctx context.Context, userID string) {
    // 创建子任务
    ctx, task := trace.NewTask(ctx, "process-request")
    defer task.End()

    // 记录日志
    trace.Log(ctx, "info", "processing request for user: "+userID)

    // 使用 Region 标记代码区域
    trace.WithRegion(ctx, "validate", func() {
        validateRequest(ctx)
    })

    trace.WithRegion(ctx, "fetch-data", func() {
        fetchData(ctx)
    })

    trace.WithRegion(ctx, "process", func() {
        process(ctx)
    })
}

func validateRequest(ctx context.Context) {
    trace.Log(ctx, "step", "validating request")
    time.Sleep(10 * time.Millisecond)
}

func fetchData(ctx context.Context) {
    trace.Log(ctx, "step", "fetching data from database")
    time.Sleep(50 * time.Millisecond)
}

func process(ctx context.Context) {
    trace.Log(ctx, "step", "processing data")
    time.Sleep(30 * time.Millisecond)
}
```

### HTTP 服务器集成

```go
package main

import (
    "context"
    "io"
    "net/http"
    "os"
    "runtime/trace"
    "time"
)

func main() {
    // 追踪控制端点
    http.HandleFunc("/debug/trace/start", func(w http.ResponseWriter, r *http.Request) {
        f, err := os.Create("trace.out")
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }

        if err := trace.Start(f); err != nil {
            f.Close()
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }

        // 10秒后自动停止
        go func() {
            time.Sleep(10 * time.Second)
            trace.Stop()
            f.Close()
        }()

        w.Write([]byte("Trace started, will stop in 10 seconds"))
    })

    // 获取 trace 数据
    http.HandleFunc("/debug/trace/download", func(w http.ResponseWriter, r *http.Request) {
        f, err := os.Open("trace.out")
        if err != nil {
            http.Error(w, err.Error(), http.StatusNotFound)
            return
        }
        defer f.Close()

        w.Header().Set("Content-Type", "application/octet-stream")
        w.Header().Set("Content-Disposition", "attachment; filename=trace.out")
        io.Copy(w, f)
    })

    // 业务端点（带追踪）
    http.HandleFunc("/api/data", func(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()
        ctx, task := trace.NewTask(ctx, "api-data")
        defer task.End()

        trace.WithRegion(ctx, "handle-request", func() {
            handleDataRequest(ctx, w, r)
        })
    })

    http.ListenAndServe(":8080", nil)
}

func handleDataRequest(ctx context.Context, w http.ResponseWriter, r *http.Request) {
    trace.Log(ctx, "request", r.URL.Path)

    // 模拟处理
    time.Sleep(100 * time.Millisecond)

    w.Write([]byte("OK"))
}
```

### 使用 go test 生成 trace

```go
// mypackage_test.go
package mypackage

import (
    "testing"
)

func BenchmarkMyFunction(b *testing.B) {
    for i := 0; i < b.N; i++ {
        MyFunction()
    }
}

func TestMyFunction(t *testing.T) {
    result := MyFunction()
    if result != expected {
        t.Errorf("got %v, want %v", result, expected)
    }
}
```

```bash
# 运行测试并生成 trace
go test -trace=trace.out -run=TestMyFunction
go test -trace=trace.out -bench=.

# 分析
go tool trace trace.out
```

### 并发问题诊断

```go
package main

import (
    "context"
    "os"
    "runtime/trace"
    "sync"
    "time"
)

func main() {
    f, _ := os.Create("trace.out")
    defer f.Close()
    trace.Start(f)
    defer trace.Stop()

    ctx := context.Background()

    // 模拟生产者-消费者问题
    ch := make(chan int, 10)
    var wg sync.WaitGroup

    // 生产者
    for i := 0; i < 3; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            ctx, task := trace.NewTask(ctx, "producer")
            defer task.End()

            for j := 0; j < 100; j++ {
                trace.WithRegion(ctx, "produce", func() {
                    ch <- j
                    time.Sleep(time.Millisecond)
                })
            }
        }(i)
    }

    // 消费者
    for i := 0; i < 2; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            ctx, task := trace.NewTask(ctx, "consumer")
            defer task.End()

            for j := 0; j < 150; j++ {
                trace.WithRegion(ctx, "consume", func() {
                    <-ch
                    time.Sleep(2 * time.Millisecond) // 消费者较慢
                })
            }
        }(i)
    }

    wg.Wait()
}
```

### 分析调度延迟

```go
package main

import (
    "context"
    "os"
    "runtime"
    "runtime/trace"
    "sync"
    "time"
)

func main() {
    // 限制 GOMAXPROCS 以便观察调度行为
    runtime.GOMAXPROCS(2)

    f, _ := os.Create("trace.out")
    defer f.Close()
    trace.Start(f)
    defer trace.Stop()

    ctx := context.Background()
    var wg sync.WaitGroup

    // 创建大量 goroutine 竞争处理器
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()

            ctx, task := trace.NewTask(ctx, "worker")
            defer task.End()

            // CPU 密集型工作
            trace.WithRegion(ctx, "compute", func() {
                result := 0
                for j := 0; j < 1000000; j++ {
                    result += j
                }
            })

            // 让出处理器
            runtime.Gosched()

            // 更多工作
            trace.WithRegion(ctx, "more-compute", func() {
                time.Sleep(time.Millisecond)
            })
        }(i)
    }

    wg.Wait()
}
```

### GC 影响分析

```go
package main

import (
    "os"
    "runtime"
    "runtime/trace"
    "time"
)

func main() {
    f, _ := os.Create("trace.out")
    defer f.Close()
    trace.Start(f)
    defer trace.Stop()

    // 分配大量内存以触发 GC
    var data [][]byte
    for i := 0; i < 100; i++ {
        // 分配 1MB
        chunk := make([]byte, 1024*1024)
        data = append(data, chunk)

        // 主动触发 GC
        if i%10 == 0 {
            runtime.GC()
        }

        time.Sleep(10 * time.Millisecond)
    }

    // 释放引用
    data = nil
    runtime.GC()
}
```

## 最佳实践

### 控制追踪时长

```go
package main

import (
    "context"
    "os"
    "runtime/trace"
    "time"
)

func startTimedTrace(duration time.Duration, filename string) (stop func()) {
    f, err := os.Create(filename)
    if err != nil {
        return func() {}
    }

    if err := trace.Start(f); err != nil {
        f.Close()
        return func() {}
    }

    done := make(chan struct{})

    go func() {
        select {
        case <-time.After(duration):
            trace.Stop()
            f.Close()
        case <-done:
            trace.Stop()
            f.Close()
        }
    }()

    return func() {
        close(done)
    }
}

func main() {
    // 追踪 5 秒
    stop := startTimedTrace(5*time.Second, "trace.out")
    defer stop()

    // 程序逻辑
    doWork()
}
```

### 生产环境安全追踪

```go
package main

import (
    "net/http"
    "os"
    "runtime/trace"
    "sync"
    "time"
)

var (
    traceMu     sync.Mutex
    traceFile   *os.File
    traceActive bool
)

func startTrace(w http.ResponseWriter, r *http.Request) {
    traceMu.Lock()
    defer traceMu.Unlock()

    if traceActive {
        http.Error(w, "Trace already active", http.StatusConflict)
        return
    }

    // 认证检查
    if r.Header.Get("X-Trace-Token") != os.Getenv("TRACE_TOKEN") {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    f, err := os.CreateTemp("", "trace-*.out")
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    if err := trace.Start(f); err != nil {
        f.Close()
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    traceFile = f
    traceActive = true

    // 最长追踪 30 秒
    go func() {
        time.Sleep(30 * time.Second)
        stopTraceInternal()
    }()

    w.Write([]byte("Trace started (max 30s)"))
}

func stopTrace(w http.ResponseWriter, r *http.Request) {
    traceMu.Lock()
    defer traceMu.Unlock()

    if !traceActive {
        http.Error(w, "No active trace", http.StatusBadRequest)
        return
    }

    stopTraceInternal()
    w.Write([]byte("Trace stopped: " + traceFile.Name()))
}

func stopTraceInternal() {
    if traceActive {
        trace.Stop()
        traceFile.Close()
        traceActive = false
    }
}
```

### 有意义的任务和区域命名

```go
package main

import (
    "context"
    "runtime/trace"
)

// 好的命名实践
func processOrder(ctx context.Context, orderID string) {
    // 使用描述性任务名
    ctx, task := trace.NewTask(ctx, "order:"+orderID)
    defer task.End()

    // 区域名反映业务逻辑
    trace.WithRegion(ctx, "validate-order", func() {
        validateOrder(orderID)
    })

    trace.WithRegion(ctx, "check-inventory", func() {
        checkInventory(orderID)
    })

    trace.WithRegion(ctx, "process-payment", func() {
        processPayment(orderID)
    })

    trace.WithRegion(ctx, "create-shipment", func() {
        createShipment(orderID)
    })

    // 记录关键信息
    trace.Log(ctx, "order", "completed: "+orderID)
}
```

### 结合 context 传播

```go
package main

import (
    "context"
    "runtime/trace"
)

// 中间件风格的追踪
func withTracing(ctx context.Context, name string, fn func(context.Context)) {
    ctx, task := trace.NewTask(ctx, name)
    defer task.End()
    fn(ctx)
}

// 在调用链中传递 context
func handleRequest(ctx context.Context) {
    ctx, task := trace.NewTask(ctx, "request")
    defer task.End()

    // 子操作自动关联到父任务
    withTracing(ctx, "auth", func(ctx context.Context) {
        authenticate(ctx)
    })

    withTracing(ctx, "process", func(ctx context.Context) {
        processData(ctx)
    })

    withTracing(ctx, "respond", func(ctx context.Context) {
        sendResponse(ctx)
    })
}
```

### 采样追踪以降低开销

```go
package main

import (
    "context"
    "math/rand"
    "os"
    "runtime/trace"
    "sync"
    "time"
)

var (
    sampleRate  = 0.01 // 1% 采样率
    traceWriter *traceBuffer
    traceMu     sync.Mutex
)

type traceBuffer struct {
    f *os.File
}

func shouldTrace() bool {
    return rand.Float64() < sampleRate
}

func maybeStartTrace(ctx context.Context, name string) (context.Context, func()) {
    if !shouldTrace() {
        return ctx, func() {}
    }

    ctx, task := trace.NewTask(ctx, name)
    return ctx, task.End
}

// 使用采样追踪
func handleRequest(ctx context.Context) {
    ctx, cleanup := maybeStartTrace(ctx, "request")
    defer cleanup()

    // 处理逻辑
    processRequest(ctx)
}
```

## 常见陷阱

### 追踪开销过大

```go
// 错误：在生产环境长时间追踪
func badPractice() {
    f, _ := os.Create("trace.out")
    trace.Start(f)
    // 程序运行数小时...
    // trace 文件会变得巨大，性能下降严重
}

// 正确：限制追踪时长
func goodPractice() {
    f, _ := os.Create("trace.out")
    trace.Start(f)

    time.AfterFunc(10*time.Second, func() {
        trace.Stop()
        f.Close()
    })
}
```

### 忘记传递 context

```go
// 错误：不传递 context，任务无法关联
func badContextUsage() {
    ctx := context.Background()
    ctx, task := trace.NewTask(ctx, "parent")
    defer task.End()

    go func() {
        // 创建新 context，与父任务断开
        newCtx := context.Background()
        _, childTask := trace.NewTask(newCtx, "child")
        defer childTask.End()
        // child 不会显示为 parent 的子任务
    }()
}

// 正确：传递 context
func goodContextUsage() {
    ctx := context.Background()
    ctx, task := trace.NewTask(ctx, "parent")
    defer task.End()

    go func(ctx context.Context) {
        _, childTask := trace.NewTask(ctx, "child")
        defer childTask.End()
        // child 正确关联到 parent
    }(ctx)
}
```

### trace 文件过大

```go
// 问题：trace 文件可能快速增长
func problem() {
    f, _ := os.Create("trace.out")
    trace.Start(f)

    // 高频操作产生大量事件
    for i := 0; i < 1000000; i++ {
        go func() {
            time.Sleep(time.Microsecond)
        }()
    }
}

// 解决方案 1：限制追踪时长
// 解决方案 2：减少追踪期间的工作量
// 解决方案 3：使用采样策略
```

### 在热路径添加追踪

```go
// 错误：在性能关键路径添加过多追踪
func hotPath(ctx context.Context, data []byte) {
    for i := 0; i < len(data); i++ {
        // 每个迭代都创建 Region，开销太大
        trace.WithRegion(ctx, "process-byte", func() {
            processByte(data[i])
        })
    }
}

// 正确：在适当粒度追踪
func hotPathFixed(ctx context.Context, data []byte) {
    // 追踪整个处理过程
    trace.WithRegion(ctx, "process-data", func() {
        for i := 0; i < len(data); i++ {
            processByte(data[i])
        }
    })
}
```

### 忽略 trace.Stop() 的调用

```go
// 错误：程序退出时没有停止追踪
func badShutdown() {
    f, _ := os.Create("trace.out")
    trace.Start(f)

    // 程序逻辑
    doWork()

    // 直接退出，trace 数据可能不完整
}

// 正确：确保正确停止
func goodShutdown() {
    f, _ := os.Create("trace.out")
    defer f.Close()

    trace.Start(f)
    defer trace.Stop() // 确保停止

    doWork()
}
```

## 性能考量

### 追踪开销

执行跟踪器的开销主要来自：

1. **事件记录**：每个事件需要写入缓冲区
2. **时间戳获取**：nanotime() 调用
3. **栈信息收集**：用于关联事件和代码位置
4. **缓冲区管理**：分配和刷新

```go
// 开销评估代码
package main

import (
    "os"
    "runtime/trace"
    "testing"
    "time"
)

func BenchmarkWithoutTrace(b *testing.B) {
    for i := 0; i < b.N; i++ {
        doSimpleWork()
    }
}

func BenchmarkWithTrace(b *testing.B) {
    f, _ := os.Create("bench-trace.out")
    defer f.Close()
    trace.Start(f)
    defer trace.Stop()

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        doSimpleWork()
    }
}

func doSimpleWork() {
    time.Sleep(time.Microsecond)
}
```

### 典型开销数据

| 场景 | 开销增加 |
|-----|---------|
| 低 goroutine 数量 | 5-10% |
| 高 goroutine 数量 | 10-25% |
| 高频 goroutine 创建 | 20-50% |
| 用户注解密集 | 依赖使用频率 |

### 优化建议

```go
package main

import (
    "context"
    "runtime/trace"
    "time"
)

// 1. 批量操作减少事件数量
func batchOperations(ctx context.Context, items []Item) {
    // 而不是每个 item 一个 region
    trace.WithRegion(ctx, "process-batch", func() {
        for _, item := range items {
            processItem(item)
        }
    })
}

// 2. 条件追踪
var tracingEnabled = false

func conditionalTrace(ctx context.Context, name string, fn func()) {
    if tracingEnabled {
        trace.WithRegion(ctx, name, fn)
    } else {
        fn()
    }
}

// 3. 缩短追踪窗口
func shortTraceWindow() {
    f, _ := os.Create("trace.out")
    trace.Start(f)

    // 只追踪感兴趣的时间段
    time.Sleep(5 * time.Second)

    trace.Stop()
    f.Close()
}
```

## 实战场景

### 场景 1：API 延迟分析

```go
package main

import (
    "context"
    "database/sql"
    "encoding/json"
    "net/http"
    "os"
    "runtime/trace"
    "time"
)

var db *sql.DB

func main() {
    // 启动追踪
    f, _ := os.Create("api-trace.out")
    defer f.Close()
    trace.Start(f)
    defer trace.Stop()

    http.HandleFunc("/users", handleUsers)
    http.ListenAndServe(":8080", nil)
}

func handleUsers(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    ctx, task := trace.NewTask(ctx, "GET /users")
    defer task.End()

    // 记录请求信息
    trace.Log(ctx, "request", r.URL.Query().Encode())

    var users []User

    // 数据库查询
    trace.WithRegion(ctx, "db-query", func() {
        users = queryUsers(ctx)
    })

    // 序列化
    var data []byte
    trace.WithRegion(ctx, "json-marshal", func() {
        data, _ = json.Marshal(users)
    })

    // 响应
    trace.WithRegion(ctx, "write-response", func() {
        w.Header().Set("Content-Type", "application/json")
        w.Write(data)
    })

    trace.Log(ctx, "response", "sent successfully")
}

func queryUsers(ctx context.Context) []User {
    trace.Log(ctx, "db", "querying users table")

    // 模拟数据库查询
    time.Sleep(50 * time.Millisecond)

    return []User{{ID: 1, Name: "Alice"}}
}
```

### 场景 2：并发工作池分析

```go
package main

import (
    "context"
    "os"
    "runtime/trace"
    "sync"
    "time"
)

type Job struct {
    ID   int
    Data []byte
}

func main() {
    f, _ := os.Create("worker-trace.out")
    defer f.Close()
    trace.Start(f)
    defer trace.Stop()

    ctx := context.Background()
    jobs := make(chan Job, 100)
    results := make(chan int, 100)

    // 启动工作池
    var wg sync.WaitGroup
    for i := 0; i < 4; i++ {
        wg.Add(1)
        go worker(ctx, i, jobs, results, &wg)
    }

    // 提交任务
    ctx, task := trace.NewTask(ctx, "submit-jobs")
    for i := 0; i < 50; i++ {
        trace.WithRegion(ctx, "submit", func() {
            jobs <- Job{ID: i, Data: make([]byte, 1000)}
        })
    }
    close(jobs)
    task.End()

    // 收集结果
    go func() {
        wg.Wait()
        close(results)
    }()

    for range results {
    }
}

func worker(ctx context.Context, id int, jobs <-chan Job, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()

    ctx, task := trace.NewTask(ctx, "worker")
    defer task.End()

    for job := range jobs {
        trace.WithRegion(ctx, "process-job", func() {
            trace.Log(ctx, "job", fmt.Sprintf("processing job %d", job.ID))

            // 模拟处理
            time.Sleep(10 * time.Millisecond)

            results <- job.ID
        })
    }
}
```

### 场景 3：GC 压力诊断

```go
package main

import (
    "context"
    "os"
    "runtime"
    "runtime/trace"
    "time"
)

func main() {
    f, _ := os.Create("gc-trace.out")
    defer f.Close()
    trace.Start(f)
    defer trace.Stop()

    ctx := context.Background()
    ctx, task := trace.NewTask(ctx, "gc-pressure-test")
    defer task.End()

    // 场景 1：大量小对象分配
    trace.WithRegion(ctx, "small-allocations", func() {
        for i := 0; i < 1000000; i++ {
            _ = make([]byte, 100)
        }
    })

    runtime.GC()
    time.Sleep(100 * time.Millisecond)

    // 场景 2：少量大对象分配
    trace.WithRegion(ctx, "large-allocations", func() {
        for i := 0; i < 1000; i++ {
            _ = make([]byte, 100000)
        }
    })

    runtime.GC()
    time.Sleep(100 * time.Millisecond)

    // 场景 3：长期持有对象
    trace.WithRegion(ctx, "retained-objects", func() {
        data := make([][]byte, 10000)
        for i := range data {
            data[i] = make([]byte, 1000)
        }

        runtime.GC()
        time.Sleep(100 * time.Millisecond)

        // 使用数据防止优化掉
        _ = len(data)
    })
}
```

### 场景 4：网络 I/O 分析

```go
package main

import (
    "context"
    "io"
    "net/http"
    "os"
    "runtime/trace"
    "sync"
    "time"
)

func main() {
    f, _ := os.Create("network-trace.out")
    defer f.Close()
    trace.Start(f)
    defer trace.Stop()

    ctx := context.Background()
    ctx, task := trace.NewTask(ctx, "network-test")
    defer task.End()

    urls := []string{
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/2",
        "https://httpbin.org/get",
    }

    // 串行请求
    trace.WithRegion(ctx, "sequential", func() {
        for _, url := range urls {
            fetchURL(ctx, url)
        }
    })

    // 并行请求
    trace.WithRegion(ctx, "parallel", func() {
        var wg sync.WaitGroup
        for _, url := range urls {
            wg.Add(1)
            go func(url string) {
                defer wg.Done()
                fetchURL(ctx, url)
            }(url)
        }
        wg.Wait()
    })
}

func fetchURL(ctx context.Context, url string) {
    ctx, task := trace.NewTask(ctx, "fetch")
    defer task.End()

    trace.Log(ctx, "url", url)

    client := &http.Client{Timeout: 10 * time.Second}

    var resp *http.Response
    var err error

    trace.WithRegion(ctx, "http-get", func() {
        resp, err = client.Get(url)
    })

    if err != nil {
        trace.Log(ctx, "error", err.Error())
        return
    }
    defer resp.Body.Close()

    trace.WithRegion(ctx, "read-body", func() {
        io.Copy(io.Discard, resp.Body)
    })

    trace.Log(ctx, "status", resp.Status)
}
```

## 面试要点

### 执行跟踪器与 pprof 的区别是什么？

**答**：
- **pprof** 基于采样，记录统计信息（如 CPU 时间、内存分配量），适合发现热点
- **trace** 基于事件，记录精确的事件时间线，适合分析延迟和并发行为
- pprof 开销更低，trace 信息更详细
- pprof 回答"资源消耗在哪里"，trace 回答"程序执行时发生了什么"

### 如何在生产环境安全地使用执行跟踪器？

**答**：
- 限制追踪时长（如最多 30 秒）
- 添加认证机制
- 只在需要时启用
- 监听本地端口
- 使用采样策略减少开销
- 避免在高负载时期追踪

### trace 文件包含哪些信息？

**答**：
- Goroutine 创建、调度、阻塞事件
- GC 事件（开始、结束、STW）
- 系统调用事件
- 网络 I/O 事件
- 用户定义的任务和区域
- 事件时间戳和调用栈

### 如何使用 trace 分析 goroutine 泄漏？

**答**：
```go
// 1. 收集 trace 数据
trace.Start(f)
// 运行程序
trace.Stop()

// 2. 使用 go tool trace 分析
// go tool trace trace.out
// 查看 Goroutine analysis 视图
// 关注长时间阻塞的 goroutine
```

### Task 和 Region 有什么区别？

**答**：
- **Task**：代表一个完整的逻辑工作单元，可以跨越多个 goroutine
- **Region**：代表代码中的一个执行区域，在单个 goroutine 内
- Task 适合追踪请求处理、事务等
- Region 适合追踪函数执行、代码块

### 如何减少追踪开销？

**答**：
- 缩短追踪时间窗口
- 使用采样策略
- 减少用户注解密度
- 避免在热路径添加细粒度追踪
- 在非高峰时期追踪
- 批量处理减少事件数量

## 延伸阅读

### 官方文档

- [runtime/trace 包文档](https://pkg.go.dev/runtime/trace)
- [Go Execution Tracer 设计文档](https://docs.google.com/document/d/1FP5apqzBgr7ahCCgFO-yoVhk4YZrNIDNf9RybngBc14)
- [Go Diagnostics](https://go.dev/doc/diagnostics)

### 相关博客

- [Go 执行追踪器深入分析](https://blog.gopheracademy.com/advent-2017/go-execution-tracer/)
- [使用 Go 追踪器分析延迟](https://making.pusher.com/go-tool-trace/)

### 工具

- [go tool trace 源码](https://github.com/golang/go/tree/master/src/cmd/trace)
- [trace 包源码](https://github.com/golang/go/tree/master/src/runtime/trace)

### 相关主题

- [pprof 性能分析](/go/pprof) - CPU 和内存分析
- [Goroutine 和 Channel](/go/goroutines-channels) - 并发基础
- [Context](/go/context) - 上下文传递
- [sync 包](/go/sync) - 同步原语
