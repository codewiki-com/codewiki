---
title: pprof性能分析
description: Go pprof完全指南，CPU分析、内存分析与性能优化
track: go
section: services-tooling
difficulty: advanced
tags:
  - Go
  - pprof
  - 性能
  - 分析
status: imported
origin: old/src/content/docs/go/pprof.zh.md
divergence: 0.422
issues:
  - divergent
legacy:
  category: Go
  subcategory: 性能优化
  order: 11
  lastUpdated: 2026-01-07
---

pprof 是 Go 语言内置的强大性能分析工具，它可以帮助开发者深入了解程序的运行时行为和资源消耗。通过 pprof，我们可以收集 CPU、内存、goroutine、阻塞和互斥锁等多种类型的性能数据，并以可视化的方式呈现，从而快速定位性能瓶颈。

## pprof 概述

pprof 是 Go 标准库中 `runtime/pprof` 包提供的性能分析工具。它可以收集各种类型的 Profile 数据，包括 CPU 使用情况、内存分配、goroutine 状态等，并将这些数据以特定格式输出，供 `go tool pprof` 工具进行分析和可视化。

### 为什么需要 pprof

在生产环境中定位性能问题是一项极具挑战性的工作。pprof 之所以成为 Go 开发者的必备工具，原因在于：

1. **零成本集成**：Go 运行时默认启用了性能分析支持，无需额外配置
2. **低开销采样**：基于采样的分析方式对程序性能影响极小
3. **精确定位**：可以精确到代码行级别显示性能热点
4. **可视化支持**：支持火焰图、调用图等多种可视化方式
5. **实时分析**：支持通过 HTTP 接口实时获取运行中程序的性能数据

### 核心包

```go
import (
    "runtime/pprof"  // 基础 pprof 功能
    "net/http/pprof" // HTTP 接口支持
    "runtime"        // 运行时控制
)
```

## Profile 类型详解

Go 预定义了以下几种 Profile 类型：

| Profile 类型 | 描述 | 采集方式 |
|-------------|------|---------|
| `goroutine` | 所有当前 goroutine 的堆栈跟踪 | 快照 |
| `heap` | 存活对象的内存分配采样 | 采样 |
| `allocs` | 所有历史内存分配的采样 | 采样 |
| `threadcreate` | 导致创建新 OS 线程的堆栈跟踪 | 快照 |
| `block` | 导致阻塞在同步原语上的堆栈跟踪 | 采样 |
| `mutex` | 竞争互斥锁持有者的堆栈跟踪 | 采样 |

```go
package main

import (
    "fmt"
    "runtime/pprof"
)

func main() {
    // 列出所有可用的 Profile
    profiles := pprof.Profiles()
    for _, p := range profiles {
        fmt.Printf("Profile: %s, Count: %d\n", p.Name(), p.Count())
    }
}
```

### 获取特定 Profile

```go
package main

import (
    "os"
    "runtime/pprof"
)

func main() {
    // 获取 goroutine profile
    goroutineProfile := pprof.Lookup("goroutine")

    // 写入到文件
    f, _ := os.Create("goroutine.prof")
    defer f.Close()

    // debug 参数：0=二进制格式，1=文本格式，2=详细文本格式
    goroutineProfile.WriteTo(f, 1)
}
```

## CPU 性能分析

CPU Profile 用于分析程序在哪些函数上花费了最多的 CPU 时间。它通过定期采样程序的调用栈来收集数据。

### 基础用法

```go
package main

import (
    "flag"
    "log"
    "os"
    "runtime/pprof"
)

var cpuprofile = flag.String("cpuprofile", "", "将 CPU profile 写入指定文件")

func main() {
    flag.Parse()

    if *cpuprofile != "" {
        f, err := os.Create(*cpuprofile)
        if err != nil {
            log.Fatal("无法创建 CPU profile 文件: ", err)
        }
        defer f.Close()

        // 开始 CPU 分析
        if err := pprof.StartCPUProfile(f); err != nil {
            log.Fatal("无法启动 CPU profile: ", err)
        }
        defer pprof.StopCPUProfile()
    }

    // 你的程序逻辑
    doWork()
}

func doWork() {
    // 模拟 CPU 密集型操作
    result := 0
    for i := 0; i < 100000000; i++ {
        result += i * i
    }
}
```

### 运行和分析

```bash
# 运行程序并生成 CPU profile
go build -o myapp
./myapp -cpuprofile=cpu.prof

# 分析 profile
go tool pprof cpu.prof
```

### 使用 go test 生成 CPU Profile

```bash
# 运行基准测试并生成 CPU profile
go test -cpuprofile cpu.prof -bench .

# 同时生成内存 profile
go test -cpuprofile cpu.prof -memprofile mem.prof -bench .

# 分析结果
go tool pprof cpu.prof
```

### CPU Profile 实战示例

```go
package main

import (
    "crypto/md5"
    "fmt"
    "log"
    "os"
    "runtime/pprof"
    "strings"
)

func main() {
    f, err := os.Create("cpu.prof")
    if err != nil {
        log.Fatal(err)
    }
    defer f.Close()

    pprof.StartCPUProfile(f)
    defer pprof.StopCPUProfile()

    // 模拟一些 CPU 密集型操作
    for i := 0; i < 1000; i++ {
        expensiveOperation(i)
    }
}

func expensiveOperation(n int) string {
    // 字符串拼接（低效方式，用于演示）
    s := ""
    for i := 0; i < 1000; i++ {
        s += fmt.Sprintf("%d", n+i)
    }

    // 计算 MD5
    hash := md5.Sum([]byte(s))
    return fmt.Sprintf("%x", hash)
}

// 优化后的版本
func efficientOperation(n int) string {
    var builder strings.Builder
    for i := 0; i < 1000; i++ {
        fmt.Fprintf(&builder, "%d", n+i)
    }

    hash := md5.Sum([]byte(builder.String()))
    return fmt.Sprintf("%x", hash)
}
```

## 内存性能分析

内存 Profile 用于分析程序的内存分配模式，帮助发现内存泄漏或过度分配的问题。

### 理解内存 Profile 指标

Go 的内存 Profile 提供四种查看方式：

| 指标 | 描述 | 用途 |
|-----|------|-----|
| `inuse_space` | 当前使用中的内存大小 | 检测内存泄漏（默认） |
| `inuse_objects` | 当前使用中的对象数量 | 分析对象生命周期 |
| `alloc_space` | 累计分配的内存大小 | 发现分配热点 |
| `alloc_objects` | 累计分配的对象数量 | 分析分配频率 |

**关键区别**：
- `alloc_space`：显示程序生命周期内分配的总内存，用于识别分配密集的代码路径
- `inuse_space`：显示当前仍在使用的内存，用于检测内存泄漏

### 基础用法

```go
package main

import (
    "flag"
    "log"
    "os"
    "runtime"
    "runtime/pprof"
)

var memprofile = flag.String("memprofile", "", "将内存 profile 写入指定文件")

func main() {
    flag.Parse()

    // 你的程序逻辑
    doMemoryIntensiveWork()

    if *memprofile != "" {
        f, err := os.Create(*memprofile)
        if err != nil {
            log.Fatal("无法创建内存 profile 文件: ", err)
        }
        defer f.Close()

        // 在采集前运行 GC，获取更准确的数据
        runtime.GC()

        // 使用 "allocs" 获取类似 go test -memprofile 的结果
        // 使用 "heap" 默认显示 inuse_space
        if err := pprof.Lookup("heap").WriteTo(f, 0); err != nil {
            log.Fatal("无法写入内存 profile: ", err)
        }
    }
}

func doMemoryIntensiveWork() {
    // 模拟内存分配
    data := make([][]byte, 1000)
    for i := range data {
        data[i] = make([]byte, 10000)
    }
}
```

### 内存泄漏检测示例

```go
package main

import (
    "fmt"
    "net/http"
    _ "net/http/pprof"
    "time"
)

// 模拟内存泄漏的全局缓存
var cache = make(map[string][]byte)

func main() {
    go func() {
        // 启动 pprof HTTP 服务
        http.ListenAndServe("localhost:6060", nil)
    }()

    // 模拟持续的内存泄漏
    for i := 0; ; i++ {
        key := fmt.Sprintf("key-%d", i)
        // 持续添加数据但从不清理
        cache[key] = make([]byte, 1024)

        if i%1000 == 0 {
            fmt.Printf("Cache size: %d entries\n", len(cache))
        }
        time.Sleep(time.Millisecond)
    }
}
```

检测内存泄漏：

```bash
# 获取初始 heap profile
curl -o heap1.prof http://localhost:6060/debug/pprof/heap

# 等待一段时间
sleep 30

# 获取第二个 heap profile
curl -o heap2.prof http://localhost:6060/debug/pprof/heap

# 对比两个 profile
go tool pprof -base=heap1.prof heap2.prof
```

### 控制内存采样率

```go
package main

import "runtime"

func main() {
    // 设置内存采样率（默认 512KB）
    // 值越小，采样越精确，但开销越大
    runtime.MemProfileRate = 1024 // 每分配 1KB 采样一次

    // 设置为 1 可以记录所有分配（仅用于调试）
    // runtime.MemProfileRate = 1

    // 你的程序逻辑
}
```

## Goroutine 分析

Goroutine Profile 用于分析程序中所有 goroutine 的状态，帮助发现 goroutine 泄漏或死锁问题。

### 基础用法

```go
package main

import (
    "fmt"
    "os"
    "runtime/pprof"
    "sync"
    "time"
)

func main() {
    // 启动一些 goroutine
    var wg sync.WaitGroup
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            time.Sleep(time.Second)
        }(i)
    }

    // 写入 goroutine profile
    f, _ := os.Create("goroutine.prof")
    defer f.Close()

    // debug=2 提供完整的堆栈信息
    pprof.Lookup("goroutine").WriteTo(f, 2)

    wg.Wait()
}
```

### Goroutine 泄漏检测

```go
package main

import (
    "fmt"
    "net/http"
    _ "net/http/pprof"
    "runtime"
    "time"
)

func main() {
    go func() {
        http.ListenAndServe("localhost:6060", nil)
    }()

    // 模拟 goroutine 泄漏
    for i := 0; ; i++ {
        go leakyGoroutine()

        if i%100 == 0 {
            fmt.Printf("Goroutine count: %d\n", runtime.NumGoroutine())
        }
        time.Sleep(10 * time.Millisecond)
    }
}

func leakyGoroutine() {
    ch := make(chan int)
    // 永远阻塞，goroutine 无法退出
    <-ch
}
```

检测 goroutine 泄漏：

```bash
# 查看 goroutine 状态
go tool pprof http://localhost:6060/debug/pprof/goroutine

# 或者直接在浏览器查看
# http://localhost:6060/debug/pprof/goroutine?debug=1
```

### 分析 Goroutine 堆栈

```go
package main

import (
    "bytes"
    "fmt"
    "runtime/pprof"
)

func main() {
    // 获取 goroutine 堆栈信息
    var buf bytes.Buffer
    pprof.Lookup("goroutine").WriteTo(&buf, 1)

    fmt.Println(buf.String())
}
```

## 阻塞分析

Block Profile 用于分析 goroutine 在同步原语（如 channel、mutex、WaitGroup）上的阻塞时间。

### 启用阻塞分析

```go
package main

import (
    "os"
    "runtime"
    "runtime/pprof"
    "sync"
    "time"
)

func main() {
    // 启用阻塞分析
    // 参数表示采样率：1 = 100% 采样，N = 每 N 纳秒阻塞采样一次
    runtime.SetBlockProfileRate(1)

    // 模拟阻塞操作
    var mu sync.Mutex
    var wg sync.WaitGroup

    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            mu.Lock()
            time.Sleep(100 * time.Millisecond) // 持有锁时间
            mu.Unlock()
        }()
    }

    wg.Wait()

    // 写入 block profile
    f, _ := os.Create("block.prof")
    defer f.Close()
    pprof.Lookup("block").WriteTo(f, 0)
}
```

### Channel 阻塞分析

```go
package main

import (
    "os"
    "runtime"
    "runtime/pprof"
    "time"
)

func main() {
    runtime.SetBlockProfileRate(1)

    ch := make(chan int)

    // 消费者
    go func() {
        for range ch {
            time.Sleep(50 * time.Millisecond)
        }
    }()

    // 生产者（会因 channel 满而阻塞）
    for i := 0; i < 100; i++ {
        ch <- i
    }
    close(ch)

    // 写入 block profile
    f, _ := os.Create("block.prof")
    defer f.Close()
    pprof.Lookup("block").WriteTo(f, 0)
}
```

### 分析阻塞数据

```bash
go tool pprof block.prof

# 在 pprof 交互界面中
(pprof) top
(pprof) list main
```

## 互斥锁分析

Mutex Profile 用于分析互斥锁的竞争情况，找出导致性能瓶颈的锁。

### 启用互斥锁分析

```go
package main

import (
    "os"
    "runtime"
    "runtime/pprof"
    "sync"
    "time"
)

func main() {
    // 启用 mutex 分析
    // 参数表示采样分数：1 = 100% 采样，N = 1/N 概率采样
    runtime.SetMutexProfileFraction(1)

    var mu sync.Mutex
    var wg sync.WaitGroup

    // 模拟锁竞争
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := 0; j < 100; j++ {
                mu.Lock()
                time.Sleep(time.Millisecond)
                mu.Unlock()
            }
        }()
    }

    wg.Wait()

    // 写入 mutex profile
    f, _ := os.Create("mutex.prof")
    defer f.Close()
    pprof.Lookup("mutex").WriteTo(f, 0)
}
```

### 读写锁分析

```go
package main

import (
    "os"
    "runtime"
    "runtime/pprof"
    "sync"
    "time"
)

func main() {
    runtime.SetMutexProfileFraction(1)

    var rwmu sync.RWMutex
    var wg sync.WaitGroup

    // 模拟读写锁竞争
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            rwmu.Lock()
            time.Sleep(100 * time.Millisecond) // 写操作
            rwmu.Unlock()
        }()
    }

    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            rwmu.RLock()
            time.Sleep(10 * time.Millisecond) // 读操作
            rwmu.RUnlock()
        }()
    }

    wg.Wait()

    f, _ := os.Create("mutex.prof")
    defer f.Close()
    pprof.Lookup("mutex").WriteTo(f, 0)
}
```

## net/http/pprof 集成

`net/http/pprof` 包提供了通过 HTTP 接口获取 pprof 数据的能力，非常适合分析运行中的服务。

### 基本集成

```go
package main

import (
    "fmt"
    "net/http"
    _ "net/http/pprof" // 自动注册到 DefaultServeMux
)

func main() {
    // 注册业务处理器
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World!")
    })

    // 启动服务器
    // pprof 端点自动可用于 /debug/pprof/
    http.ListenAndServe(":8080", nil)
}
```

### 独立的 pprof 服务器

```go
package main

import (
    "net/http"
    _ "net/http/pprof"
)

func main() {
    // 在独立端口启动 pprof 服务器（推荐生产环境使用）
    go func() {
        // 仅监听本地，避免暴露到外网
        http.ListenAndServe("localhost:6060", nil)
    }()

    // 主服务器使用自定义 mux
    mux := http.NewServeMux()
    mux.HandleFunc("/", handleRequest)
    http.ListenAndServe(":8080", mux)
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
    // 业务逻辑
}
```

### 自定义 ServeMux 集成

```go
package main

import (
    "net/http"
    "net/http/pprof"
)

func main() {
    mux := http.NewServeMux()

    // 手动注册 pprof 处理器
    mux.HandleFunc("/debug/pprof/", pprof.Index)
    mux.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
    mux.HandleFunc("/debug/pprof/profile", pprof.Profile)
    mux.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
    mux.HandleFunc("/debug/pprof/trace", pprof.Trace)

    // 业务处理器
    mux.HandleFunc("/", handleRequest)

    http.ListenAndServe(":8080", mux)
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
    // 业务逻辑
}
```

### 可用的 HTTP 端点

| 端点 | 描述 |
|------|------|
| `/debug/pprof/` | pprof 索引页面 |
| `/debug/pprof/heap` | 堆内存 profile |
| `/debug/pprof/goroutine` | goroutine profile |
| `/debug/pprof/allocs` | 内存分配 profile |
| `/debug/pprof/block` | 阻塞 profile |
| `/debug/pprof/mutex` | 互斥锁 profile |
| `/debug/pprof/threadcreate` | 线程创建 profile |
| `/debug/pprof/profile` | CPU profile（需要指定时长） |
| `/debug/pprof/trace` | 执行跟踪 |

### 使用示例

```bash
# 获取 30 秒 CPU profile
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 获取 heap profile
go tool pprof http://localhost:6060/debug/pprof/heap

# 获取 goroutine profile
go tool pprof http://localhost:6060/debug/pprof/goroutine

# 获取 block profile
go tool pprof http://localhost:6060/debug/pprof/block

# 下载 profile 文件
curl -o heap.prof http://localhost:6060/debug/pprof/heap
```

## 分析 Profile 数据

`go tool pprof` 是分析 profile 数据的核心工具。

### 交互模式

```bash
# 进入交互模式
go tool pprof cpu.prof

# 常用命令
(pprof) help           # 查看帮助
(pprof) top            # 显示最耗资源的函数
(pprof) top10          # 显示前 10 个
(pprof) top -cum       # 按累计值排序
(pprof) list funcName  # 显示函数的逐行分析
(pprof) disasm funcName # 显示汇编代码
(pprof) web            # 在浏览器中打开调用图
(pprof) svg            # 生成 SVG 格式的调用图
(pprof) png            # 生成 PNG 格式的调用图
(pprof) quit           # 退出
```

### top 命令详解

```bash
(pprof) top
Showing nodes accounting for 2.50s, 89.29% of 2.80s total
Dropped 15 nodes (cum <= 0.01s)
      flat  flat%   sum%        cum   cum%
     1.50s 53.57% 53.57%      1.50s 53.57%  main.expensiveFunction
     0.60s 21.43% 75.00%      0.60s 21.43%  runtime.memclrNoHeapPointers
     0.40s 14.29% 89.29%      2.10s 75.00%  main.processData
```

- **flat**: 函数自身消耗的时间/内存
- **flat%**: flat 占总量的百分比
- **sum%**: 累计百分比
- **cum**: 函数及其调用的所有函数消耗的时间/内存
- **cum%**: cum 占总量的百分比

### list 命令详解

```bash
(pprof) list expensiveFunction
Total: 2.80s
ROUTINE ======================== main.expensiveFunction in /path/to/main.go
     1.50s      1.50s (flat, cum) 53.57% of Total
         .          .     10:func expensiveFunction() {
     0.20s      0.20s     11:    for i := 0; i < 1000000; i++ {
     1.30s      1.30s     12:        result += i * i
         .          .     13:    }
         .          .     14:}
```

### Web 界面

```bash
# 启动 web 界面
go tool pprof -http=:8080 cpu.prof

# 指定端口
go tool pprof -http=localhost:9090 heap.prof
```

### 比较两个 Profile

```bash
# 比较两个 profile
go tool pprof -base=old.prof new.prof

# 在 web 界面比较
go tool pprof -http=:8080 -diff_base=old.prof new.prof
```

### 常用过滤选项

```bash
# 只显示包含特定关键词的节点
go tool pprof -focus="main" cpu.prof

# 排除特定关键词
go tool pprof -ignore="runtime" cpu.prof

# 显示特定时间范围
go tool pprof -cum -nodecount=10 cpu.prof
```

## 火焰图

火焰图是一种强大的可视化工具，可以直观地展示程序的调用栈和时间分布。

### 使用 go tool pprof 生成火焰图

```bash
# 启动 web 界面后，选择 Flame Graph 视图
go tool pprof -http=:8080 cpu.prof

# 然后在浏览器中访问
# http://localhost:8080/ui/flamegraph
```

### 解读火焰图

火焰图的特点：

1. **横轴**：表示 CPU 采样占比，宽度越宽表示消耗越多
2. **纵轴**：表示调用栈深度，从下到上是调用关系
3. **颜色**：随机分配，仅用于区分不同函数

阅读技巧：

- 寻找"平顶"：顶部越平的函数，消耗的资源越多
- 关注宽度：宽度直接反映资源消耗比例
- 从上往下：从顶部找到最热的函数，向下追溯调用路径

### 使用 flamegraph.pl 生成

```bash
# 安装 flamegraph 工具
git clone https://github.com/brendangregg/FlameGraph.git

# 生成折叠栈
go tool pprof -raw cpu.prof > cpu.raw
# 或者从 HTTP 接口
curl http://localhost:6060/debug/pprof/profile?seconds=30 > cpu.prof
go tool pprof -raw cpu.prof > cpu.raw

# 生成火焰图
./FlameGraph/stackcollapse-go.pl cpu.raw | ./FlameGraph/flamegraph.pl > cpu.svg
```

## 实战案例

### 案例 1：CPU 热点优化

```go
package main

import (
    "crypto/sha256"
    "fmt"
    "os"
    "runtime/pprof"
    "strings"
)

func main() {
    f, _ := os.Create("cpu.prof")
    pprof.StartCPUProfile(f)
    defer pprof.StopCPUProfile()

    // 低效实现
    data := generateData(100000)
    fmt.Println("Data generated:", len(data))
}

// 低效：字符串拼接
func generateData(n int) []string {
    result := make([]string, n)
    for i := 0; i < n; i++ {
        // 问题：字符串拼接创建大量临时对象
        s := ""
        for j := 0; j < 100; j++ {
            s += fmt.Sprintf("%d", j)
        }
        result[i] = s
    }
    return result
}

// 优化后：使用 strings.Builder
func generateDataOptimized(n int) []string {
    result := make([]string, n)
    for i := 0; i < n; i++ {
        var builder strings.Builder
        for j := 0; j < 100; j++ {
            fmt.Fprintf(&builder, "%d", j)
        }
        result[i] = builder.String()
    }
    return result
}
```

分析步骤：

```bash
# 运行并生成 profile
go build -o app && ./app

# 分析
go tool pprof cpu.prof
(pprof) top
(pprof) list generateData
```

### 案例 2：内存泄漏排查

```go
package main

import (
    "net/http"
    _ "net/http/pprof"
    "sync"
    "time"
)

type Cache struct {
    mu    sync.RWMutex
    items map[string]*Item
}

type Item struct {
    Data      []byte
    CreatedAt time.Time
}

var globalCache = &Cache{
    items: make(map[string]*Item),
}

func main() {
    go func() {
        http.ListenAndServe("localhost:6060", nil)
    }()

    // 模拟缓存使用
    go func() {
        for i := 0; ; i++ {
            key := fmt.Sprintf("key-%d", i)
            globalCache.Set(key, make([]byte, 10240))
            time.Sleep(time.Millisecond)
        }
    }()

    select {} // 永久阻塞
}

func (c *Cache) Set(key string, data []byte) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.items[key] = &Item{
        Data:      data,
        CreatedAt: time.Now(),
    }
}

// 缺少清理机制！应该添加过期清理
func (c *Cache) CleanExpired(maxAge time.Duration) {
    c.mu.Lock()
    defer c.mu.Unlock()
    now := time.Now()
    for key, item := range c.items {
        if now.Sub(item.CreatedAt) > maxAge {
            delete(c.items, key)
        }
    }
}
```

排查步骤：

```bash
# 获取初始 heap profile
curl -o heap1.prof http://localhost:6060/debug/pprof/heap

# 等待一段时间
sleep 60

# 获取第二个 heap profile
curl -o heap2.prof http://localhost:6060/debug/pprof/heap

# 对比分析
go tool pprof -http=:8080 -diff_base=heap1.prof heap2.prof

# 或者使用命令行
go tool pprof -base=heap1.prof heap2.prof
(pprof) top
(pprof) list Set
```

### 案例 3：Goroutine 泄漏检测

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    _ "net/http/pprof"
    "runtime"
    "time"
)

func main() {
    go func() {
        http.ListenAndServe("localhost:6060", nil)
    }()

    // 打印 goroutine 数量
    go func() {
        for {
            fmt.Printf("Goroutines: %d\n", runtime.NumGoroutine())
            time.Sleep(time.Second)
        }
    }()

    // 模拟请求处理
    for {
        // 问题：没有正确取消 context
        ctx := context.Background()
        go handleRequest(ctx)
        time.Sleep(10 * time.Millisecond)
    }
}

// 问题代码：goroutine 可能永远阻塞
func handleRequest(ctx context.Context) {
    ch := make(chan int)

    go func() {
        // 模拟耗时操作
        time.Sleep(time.Hour)
        ch <- 1
    }()

    // 永远等待
    <-ch
}

// 修复后的代码
func handleRequestFixed(ctx context.Context) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    ch := make(chan int)

    go func() {
        time.Sleep(time.Hour)
        select {
        case ch <- 1:
        case <-ctx.Done():
            return
        }
    }()

    select {
    case <-ch:
        // 处理结果
    case <-ctx.Done():
        // 超时处理
    }
}
```

排查步骤：

```bash
# 查看 goroutine 堆栈
curl http://localhost:6060/debug/pprof/goroutine?debug=2 > goroutine.txt

# 使用 pprof 分析
go tool pprof http://localhost:6060/debug/pprof/goroutine
(pprof) top
(pprof) traces
```

### 案例 4：锁竞争分析

```go
package main

import (
    "net/http"
    _ "net/http/pprof"
    "runtime"
    "sync"
    "time"
)

type Counter struct {
    mu    sync.Mutex
    value int
}

func main() {
    // 启用 mutex profiling
    runtime.SetMutexProfileFraction(1)

    go func() {
        http.ListenAndServe("localhost:6060", nil)
    }()

    counter := &Counter{}

    // 模拟高并发
    for i := 0; i < 100; i++ {
        go func() {
            for {
                counter.Increment()
                time.Sleep(time.Microsecond)
            }
        }()
    }

    select {}
}

func (c *Counter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}

// 优化方案：使用分片减少竞争
type ShardedCounter struct {
    shards [16]struct {
        mu    sync.Mutex
        value int
    }
}

func (c *ShardedCounter) Increment(id int) {
    shard := &c.shards[id%16]
    shard.mu.Lock()
    shard.value++
    shard.mu.Unlock()
}

func (c *ShardedCounter) Value() int {
    total := 0
    for i := range c.shards {
        c.shards[i].mu.Lock()
        total += c.shards[i].value
        c.shards[i].mu.Unlock()
    }
    return total
}
```

分析步骤：

```bash
# 获取 mutex profile
go tool pprof http://localhost:6060/debug/pprof/mutex

(pprof) top
(pprof) list Increment
```

## 最佳实践

### 生产环境注意事项

```go
package main

import (
    "net/http"
    _ "net/http/pprof"
)

func main() {
    // 在独立端口启动 pprof，仅监听本地
    go func() {
        // 重要：只绑定到 localhost
        http.ListenAndServe("localhost:6060", nil)
    }()

    // 主服务器
    // ...
}
```

### 安全考虑

```go
package main

import (
    "net/http"
    "net/http/pprof"
)

func main() {
    mux := http.NewServeMux()

    // 添加认证中间件
    pprofHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 简单的认证检查
        if r.Header.Get("X-Debug-Token") != "secret-token" {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        pprof.Index(w, r)
    })

    mux.Handle("/debug/pprof/", pprofHandler)

    http.ListenAndServe(":8080", mux)
}
```

### 性能分析工作流

```bash
# 收集基准数据
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/profile?seconds=30

# 识别热点
# 在 web 界面查看 Top、Graph、Flame Graph

# 优化代码

# 再次收集数据
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/profile?seconds=30

# 对比验证优化效果
go tool pprof -http=:8080 -diff_base=before.prof after.prof
```

### 避免常见陷阱

```go
// 陷阱 1：在热路径中使用 defer
func badExample() {
    mu.Lock()
    defer mu.Unlock() // 在热路径中 defer 有额外开销
    // ...
}

// 优化
func goodExample() {
    mu.Lock()
    // ...
    mu.Unlock() // 直接调用
}

// 陷阱 2：不必要的内存分配
func badAllocation() []byte {
    return make([]byte, 1024) // 每次调用都分配
}

// 优化：使用 sync.Pool
var bufferPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 1024)
    },
}

func goodAllocation() []byte {
    return bufferPool.Get().([]byte)
}

func returnBuffer(buf []byte) {
    bufferPool.Put(buf)
}
```

### 持续性能监控

```go
package main

import (
    "os"
    "runtime"
    "runtime/pprof"
    "time"
)

func startContinuousProfiling(dir string) {
    go func() {
        ticker := time.NewTicker(time.Hour)
        for range ticker.C {
            // 定期生成 heap profile
            timestamp := time.Now().Format("20060102_150405")

            f, err := os.Create(dir + "/heap_" + timestamp + ".prof")
            if err != nil {
                continue
            }

            runtime.GC()
            pprof.Lookup("heap").WriteTo(f, 0)
            f.Close()
        }
    }()
}
```

### 与基准测试结合

```go
package mypackage

import (
    "testing"
)

func BenchmarkMyFunction(b *testing.B) {
    for i := 0; i < b.N; i++ {
        MyFunction()
    }
}

// 运行并生成 profile
// go test -bench=. -cpuprofile=cpu.prof -memprofile=mem.prof
// go tool pprof cpu.prof
```

### 使用 Labels 进行精细分析

```go
package main

import (
    "context"
    "runtime/pprof"
)

func processRequest(ctx context.Context, userID string) {
    // 为这个 goroutine 添加标签
    labels := pprof.Labels("user_id", userID, "handler", "processRequest")
    pprof.Do(ctx, labels, func(ctx context.Context) {
        // 处理请求
        // 这个 goroutine 的所有 profile 数据都会带有这些标签
        doWork(ctx)
    })
}

func doWork(ctx context.Context) {
    // 工作逻辑
}
```

## 总结

pprof 是 Go 开发者进行性能优化的必备工具。通过本文，你应该掌握了：

1. **Profile 类型**：CPU、内存、goroutine、阻塞、互斥锁等不同类型的 profile
2. **数据收集**：使用 runtime/pprof 和 net/http/pprof 收集性能数据
3. **数据分析**：使用 go tool pprof 进行交互式分析
4. **可视化**：生成调用图、火焰图等可视化报告
5. **实战技巧**：定位和优化 CPU 热点、内存泄漏、goroutine 泄漏、锁竞争等问题

在生产环境中使用 pprof 时，请注意安全性和性能开销。建议将 pprof 端点部署在内网或添加认证机制，避免暴露敏感的性能数据。

## 参考资料

- [Go 官方 pprof 包文档](https://pkg.go.dev/runtime/pprof)
- [Profiling Go Programs - Go Blog](https://go.dev/blog/pprof)
- [Go Diagnostics](https://go.dev/doc/diagnostics)
- [Google pprof 工具](https://github.com/google/pprof)
