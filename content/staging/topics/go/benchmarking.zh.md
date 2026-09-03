---
title: Go 性能基准测试
description: 掌握 Go 基准测试，包括编写基准、运行测试、分析结果和优化
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - 基准测试
  - 性能
  - 测试
status: imported
origin: old/src/content/docs/go/benchmarking.zh.md
divergence: 0.235
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 测试
  order: 18
  lastUpdated: 2026-01-07
---

性能基准测试是软件开发中不可或缺的一环。Go 语言通过内置的 `testing` 包提供了强大而简洁的基准测试支持，让开发者能够精确测量代码性能、发现瓶颈并验证优化效果。本文将全面介绍 Go 基准测试的核心概念、编写技巧和最佳实践。

## 基准测试基础

### 什么是基准测试

基准测试（Benchmark）是一种通过重复执行代码来测量其性能的方法。与单元测试关注"代码是否正确"不同，基准测试关注"代码运行得多快、消耗多少资源"。

Go 的基准测试具有以下特点：

- **内置支持**：无需第三方库，`testing` 包原生支持
- **自动迭代**：框架自动调整迭代次数以获得稳定结果
- **精确测量**：支持纳秒级时间精度和字节级内存统计
- **易于集成**：与单元测试共用相同的工具链

### 基准测试函数签名

基准测试函数必须遵循以下规范：

```go
// 函数名必须以 Benchmark 开头
// 参数必须是 *testing.B 类型
// 无返回值
func BenchmarkXxx(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // 被测试的代码
    }
}
```

### 第一个基准测试

让我们从一个简单的例子开始：

```go
// math.go
package math

func Add(a, b int) int {
    return a + b
}

func Multiply(a, b int) int {
    return a * b
}

func Fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return Fibonacci(n-1) + Fibonacci(n-2)
}
```

```go
// math_test.go
package math

import "testing"

func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(10, 20)
    }
}

func BenchmarkMultiply(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Multiply(10, 20)
    }
}

func BenchmarkFibonacci(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Fibonacci(20)
    }
}
```

### 运行基准测试

```bash
# 运行所有基准测试
go test -bench=.

# 运行特定基准测试（正则匹配）
go test -bench=BenchmarkAdd

# 运行包含 "Fib" 的基准测试
go test -bench=".*Fib.*"

# 同时显示内存分配信息
go test -bench=. -benchmem

# 设置基准测试运行时间（默认1秒）
go test -bench=. -benchtime=5s

# 设置固定迭代次数
go test -bench=. -benchtime=1000x

# 多次运行取平均值
go test -bench=. -count=5

# 测试不同 CPU 核心数
go test -bench=. -cpu=1,2,4,8

# 跳过单元测试，只运行基准测试
go test -bench=. -run=^$
```

### 输出格式解读

```
BenchmarkAdd-8          1000000000           0.25 ns/op
BenchmarkMultiply-8     1000000000           0.26 ns/op
BenchmarkFibonacci-8       30856             38965 ns/op
```

各字段含义：

| 字段 | 说明 |
|------|------|
| `BenchmarkAdd-8` | 测试名称，`-8` 表示使用 8 个 CPU 核心 |
| `1000000000` | 迭代次数（b.N 的最终值） |
| `0.25 ns/op` | 每次操作的平均耗时（纳秒） |

当使用 `-benchmem` 时，还会显示内存信息：

```
BenchmarkStringBuilder-8    5000000    234 ns/op    512 B/op    4 allocs/op
```

| 字段 | 说明 |
|------|------|
| `512 B/op` | 每次操作分配的内存字节数 |
| `4 allocs/op` | 每次操作的内存分配次数 |

## 理解 b.N

### b.N 的自动调整机制

`b.N` 是基准测试的核心，它表示循环执行的次数。Go 运行时会自动调整这个值，使测试运行足够长的时间以获得准确的统计结果。

调整过程如下：

```
1. 初始 N = 1，运行测试
2. 如果运行时间 < benchtime（默认1秒）：
   - 根据已测量的性能估算新的 N 值
   - N 通常增长为 2x, 5x, 10x, 20x, 50x, 100x...
   - 重复测试
3. 如果运行时间 >= benchtime：
   - 计算并报告最终结果
```

```go
func BenchmarkDemonstrate(b *testing.B) {
    // 框架会多次调用此函数，每次 b.N 值不同：
    // 第1次: N = 1
    // 第2次: N = 100
    // 第3次: N = 10000
    // 第4次: N = 1000000
    // ...直到累计运行时间 >= 1秒

    for i := 0; i < b.N; i++ {
        // 被测代码
        _ = make([]byte, 1024)
    }
}
```

### 正确使用 b.N

**正确示例**：循环必须使用 `b.N`

```go
func BenchmarkCorrect(b *testing.B) {
    for i := 0; i < b.N; i++ {
        operation()
    }
}
```

**错误示例**：使用固定次数

```go
func BenchmarkWrong(b *testing.B) {
    for i := 0; i < 1000; i++ { // 错误！应该用 b.N
        operation()
    }
}
```

**错误示例**：循环外执行

```go
func BenchmarkAlsoWrong(b *testing.B) {
    operation() // 只执行一次，无法准确测量
}
```

### 计时器控制

`testing.B` 提供了三个方法来控制计时：

| 方法 | 说明 | 使用场景 |
|------|------|----------|
| `b.ResetTimer()` | 重置计时器和内存计数器 | setup 完成后 |
| `b.StopTimer()` | 暂停计时 | 每次迭代的准备工作 |
| `b.StartTimer()` | 恢复计时 | 准备工作完成后 |

#### 一次性准备工作

```go
func BenchmarkWithSetup(b *testing.B) {
    // 准备工作（可能很耗时）
    data := make([]int, 1000000)
    for i := range data {
        data[i] = i
    }

    // 重置计时器，排除准备时间
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        sum := 0
        for _, v := range data {
            sum += v
        }
    }
}
```

#### 每次迭代的准备工作

```go
func BenchmarkWithIterationSetup(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // 暂停计时
        b.StopTimer()
        data := generateRandomData(1000) // 不计入测试时间
        b.StartTimer()

        // 被测代码
        sort.Ints(data)
    }
}
```

### 防止编译器优化

编译器可能会优化掉没有副作用的代码，导致测试结果失真：

```go
// 错误：结果可能被优化掉
func BenchmarkOptimizedAway(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(1, 2) // 编译器可能完全优化掉这行
    }
}

// 正确：使用全局变量存储结果
var result int

func BenchmarkNotOptimized(b *testing.B) {
    var r int
    for i := 0; i < b.N; i++ {
        r = Add(1, 2)
    }
    result = r // 确保结果被使用
}

// 另一种方式：使用 runtime.KeepAlive
func BenchmarkWithKeepAlive(b *testing.B) {
    for i := 0; i < b.N; i++ {
        r := Add(1, 2)
        runtime.KeepAlive(r)
    }
}
```

## 子基准测试

子基准测试（Sub-benchmarks）使用 `b.Run()` 方法创建，是 Go 1.7 引入的功能，提供了更好的测试组织和参数化能力。

### 基本用法

```go
func BenchmarkOperations(b *testing.B) {
    b.Run("Add", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            Add(10, 20)
        }
    })

    b.Run("Multiply", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            Multiply(10, 20)
        }
    })

    b.Run("Fibonacci", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            Fibonacci(20)
        }
    })
}
```

运行特定子测试：

```bash
go test -bench="BenchmarkOperations/Add"
go test -bench="BenchmarkOperations/Fib"
```

### 参数化测试

子基准测试最强大的用途是参数化测试：

```go
func BenchmarkFibonacciSizes(b *testing.B) {
    sizes := []int{5, 10, 15, 20, 25}

    for _, size := range sizes {
        b.Run(fmt.Sprintf("n=%d", size), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                Fibonacci(size)
            }
        })
    }
}

// 输出：
// BenchmarkFibonacciSizes/n=5-8     30000000    45.3 ns/op
// BenchmarkFibonacciSizes/n=10-8     3000000   512 ns/op
// BenchmarkFibonacciSizes/n=15-8      200000  5678 ns/op
// BenchmarkFibonacciSizes/n=20-8       30000 38965 ns/op
// BenchmarkFibonacciSizes/n=25-8        3000 432000 ns/op
```

### 多维度参数化

```go
func BenchmarkSort(b *testing.B) {
    algorithms := map[string]func([]int){
        "stdlib":    func(data []int) { sort.Ints(data) },
        "quicksort": quickSort,
        "mergesort": mergeSort,
    }

    sizes := []int{100, 1000, 10000}
    orders := []string{"random", "sorted", "reversed"}

    for alg, sortFunc := range algorithms {
        for _, size := range sizes {
            for _, order := range orders {
                name := fmt.Sprintf("%s/size=%d/order=%s", alg, size, order)
                b.Run(name, func(b *testing.B) {
                    // 准备数据
                    original := generateData(size, order)

                    b.ResetTimer()
                    for i := 0; i < b.N; i++ {
                        b.StopTimer()
                        data := make([]int, len(original))
                        copy(data, original)
                        b.StartTimer()

                        sortFunc(data)
                    }
                })
            }
        }
    }
}

func generateData(size int, order string) []int {
    data := make([]int, size)
    for i := range data {
        data[i] = i
    }

    switch order {
    case "random":
        rand.Shuffle(len(data), func(i, j int) {
            data[i], data[j] = data[j], data[i]
        })
    case "reversed":
        for i, j := 0, len(data)-1; i < j; i, j = i+1, j-1 {
            data[i], data[j] = data[j], data[i]
        }
    // "sorted" 保持原样
    }
    return data
}
```

### 并行子基准测试

```go
func BenchmarkParallel(b *testing.B) {
    b.Run("Sequential", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            operation()
        }
    })

    b.Run("Parallel", func(b *testing.B) {
        b.RunParallel(func(pb *testing.PB) {
            for pb.Next() {
                operation()
            }
        })
    })
}
```

## 内存分配分析

内存分配是影响 Go 程序性能的重要因素。基准测试提供了详细的内存分配统计功能。

### 启用内存分析

有两种方式启用内存分配报告：

```go
// 方式1：在代码中调用 b.ReportAllocs()
func BenchmarkWithAllocs(b *testing.B) {
    b.ReportAllocs() // 报告内存分配

    for i := 0; i < b.N; i++ {
        _ = make([]byte, 1024)
    }
}
```

```bash
# 方式2：使用命令行参数
go test -bench=. -benchmem
```

### 字符串拼接性能对比

这是一个经典的内存分析案例：

```go
package stringbench

import (
    "bytes"
    "strings"
    "testing"
)

// 使用 + 操作符
func BenchmarkStringConcatPlus(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        s := ""
        for j := 0; j < 100; j++ {
            s += "a"
        }
        _ = s
    }
}

// 使用 strings.Builder（推荐）
func BenchmarkStringBuilder(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var builder strings.Builder
        for j := 0; j < 100; j++ {
            builder.WriteString("a")
        }
        _ = builder.String()
    }
}

// 使用 bytes.Buffer
func BenchmarkBytesBuffer(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var buf bytes.Buffer
        for j := 0; j < 100; j++ {
            buf.WriteString("a")
        }
        _ = buf.String()
    }
}

// 预分配容量的 strings.Builder
func BenchmarkStringBuilderPrealloc(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var builder strings.Builder
        builder.Grow(100) // 预分配容量
        for j := 0; j < 100; j++ {
            builder.WriteString("a")
        }
        _ = builder.String()
    }
}

// 使用 strings.Join
func BenchmarkStringsJoin(b *testing.B) {
    b.ReportAllocs()

    strs := make([]string, 100)
    for i := range strs {
        strs[i] = "a"
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _ = strings.Join(strs, "")
    }
}
```

典型输出：

```
BenchmarkStringConcatPlus-8          5000   234567 ns/op   53000 B/op   99 allocs/op
BenchmarkStringBuilder-8           500000     3456 ns/op     512 B/op    4 allocs/op
BenchmarkBytesBuffer-8             300000     4567 ns/op     640 B/op    5 allocs/op
BenchmarkStringBuilderPrealloc-8   800000     2345 ns/op     224 B/op    2 allocs/op
BenchmarkStringsJoin-8            1000000     1234 ns/op     112 B/op    1 allocs/op
```

### 设置处理字节数

使用 `b.SetBytes()` 可以计算吞吐量：

```go
func BenchmarkIOThroughput(b *testing.B) {
    data := make([]byte, 1024*1024) // 1MB
    rand.Read(data)

    b.SetBytes(int64(len(data))) // 每次操作处理 1MB
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        // 模拟处理数据
        for j := range data {
            data[j] = data[j] ^ 0xFF
        }
    }
}

// 输出会包含吞吐量：
// BenchmarkIOThroughput-8    1000    1234567 ns/op    850.00 MB/s
```

### 自定义指标

Go 1.13+ 支持报告自定义指标：

```go
func BenchmarkWithCustomMetrics(b *testing.B) {
    var totalItems int64
    var totalErrors int64

    for i := 0; i < b.N; i++ {
        items, errors := processWorkload()
        totalItems += int64(items)
        totalErrors += int64(errors)
    }

    // 报告自定义指标
    b.ReportMetric(float64(totalItems)/float64(b.N), "items/op")
    b.ReportMetric(float64(totalErrors)/float64(b.N), "errors/op")
    b.ReportMetric(float64(totalItems)/b.Elapsed().Seconds(), "items/s")
}
```

## 基准测试对比

性能优化的关键是能够准确比较优化前后的结果。

### 使用 benchstat 工具

`benchstat` 是官方推荐的基准测试结果分析工具：

```bash
# 安装 benchstat
go install golang.org/x/perf/cmd/benchstat@latest

# 运行基准测试并保存结果（优化前）
go test -bench=. -count=10 > old.txt

# 修改代码后再次运行
go test -bench=. -count=10 > new.txt

# 比较结果
benchstat old.txt new.txt
```

输出示例：

```
name           old time/op    new time/op    delta
Process-8        45.2ms ± 3%    32.1ms ± 2%   -29.0%  (p=0.000 n=10+10)
Transform-8      12.3ms ± 4%    11.8ms ± 3%    -4.1%  (p=0.023 n=10+10)
Validate-8       2.34ms ± 2%    2.31ms ± 2%     ~     (p=0.156 n=10+10)

name           old alloc/op   new alloc/op   delta
Process-8        1.23MB ± 0%    0.92MB ± 0%   -25.2%  (p=0.000 n=10+10)
Transform-8       256KB ± 0%     256KB ± 0%     ~     (all equal)
```

各字段说明：

| 字段 | 说明 |
|------|------|
| `± 3%` | 结果的变异系数 |
| `delta` | 性能变化百分比 |
| `p=0.000` | 统计显著性（p < 0.05 表示显著） |
| `n=10+10` | 有效样本数 |
| `~` | 变化不显著 |

### 多次运行的重要性

单次运行的结果可能受到系统状态的影响，建议多次运行：

```bash
# 至少运行 5-10 次
go test -bench=. -count=10

# 对于高变异的测试，可以运行更多次
go test -bench=. -count=20
```

### 比较不同实现

```go
// 优化前
func processDataNaive(data []int) int {
    sum := 0
    for i := 0; i < len(data); i++ {
        sum += data[i]
    }
    return sum
}

// 优化后：使用 range
func processDataRange(data []int) int {
    sum := 0
    for _, v := range data {
        sum += v
    }
    return sum
}

// 优化后：循环展开
func processDataUnrolled(data []int) int {
    sum := 0
    n := len(data)
    i := 0

    // 每次处理 4 个元素
    for ; i <= n-4; i += 4 {
        sum += data[i] + data[i+1] + data[i+2] + data[i+3]
    }

    // 处理剩余元素
    for ; i < n; i++ {
        sum += data[i]
    }
    return sum
}

func BenchmarkProcessData(b *testing.B) {
    data := make([]int, 10000)
    for i := range data {
        data[i] = i
    }

    b.Run("Naive", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            processDataNaive(data)
        }
    })

    b.Run("Range", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            processDataRange(data)
        }
    })

    b.Run("Unrolled", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            processDataUnrolled(data)
        }
    })
}
```

## 性能分析集成

基准测试可以与 Go 的性能分析工具（pprof）无缝集成。

### 生成 CPU Profile

```bash
# 运行基准测试并生成 CPU profile
go test -bench=BenchmarkProcess -cpuprofile=cpu.prof

# 分析 profile
go tool pprof cpu.prof

# 或者使用 web 界面
go tool pprof -http=:8080 cpu.prof
```

### 生成内存 Profile

```bash
# 生成内存 profile
go test -bench=BenchmarkProcess -memprofile=mem.prof

# 分析内存分配
go tool pprof mem.prof

# 查看分配热点
go tool pprof -alloc_space mem.prof
go tool pprof -inuse_space mem.prof
```

### 同时生成多个 Profile

```bash
go test -bench=. -cpuprofile=cpu.prof -memprofile=mem.prof -blockprofile=block.prof
```

### 在代码中集成 pprof

```go
package main

import (
    "flag"
    "log"
    "os"
    "runtime/pprof"
    "testing"
)

var cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")
var memprofile = flag.String("memprofile", "", "write memory profile to file")

func BenchmarkWithProfiling(b *testing.B) {
    if *cpuprofile != "" {
        f, err := os.Create(*cpuprofile)
        if err != nil {
            log.Fatal(err)
        }
        defer f.Close()
        pprof.StartCPUProfile(f)
        defer pprof.StopCPUProfile()
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        operation()
    }
    b.StopTimer()

    if *memprofile != "" {
        f, err := os.Create(*memprofile)
        if err != nil {
            log.Fatal(err)
        }
        defer f.Close()
        runtime.GC()
        pprof.WriteHeapProfile(f)
    }
}
```

### 交互式分析命令

```bash
# 进入交互模式
go tool pprof cpu.prof

# 常用命令
(pprof) top           # 显示最耗资源的函数
(pprof) top10         # 显示前 10 个
(pprof) top -cum      # 按累计值排序
(pprof) list funcName # 显示函数的逐行分析
(pprof) web           # 在浏览器中打开调用图
(pprof) svg           # 生成 SVG 格式的调用图
(pprof) flamegraph    # 生成火焰图
```

## 高级技巧与最佳实践

### 并行基准测试

测试代码在并发场景下的性能：

```go
func BenchmarkMapConcurrent(b *testing.B) {
    m := sync.Map{}

    // 预填充数据
    for i := 0; i < 1000; i++ {
        m.Store(i, i)
    }

    b.ResetTimer()
    b.RunParallel(func(pb *testing.PB) {
        i := 0
        for pb.Next() {
            if i%2 == 0 {
                m.Load(i % 1000)
            } else {
                m.Store(i%1000, i)
            }
            i++
        }
    })
}

// 对比普通 map 加锁的性能
func BenchmarkMapWithMutex(b *testing.B) {
    var mu sync.RWMutex
    m := make(map[int]int)

    for i := 0; i < 1000; i++ {
        m[i] = i
    }

    b.ResetTimer()
    b.RunParallel(func(pb *testing.PB) {
        i := 0
        for pb.Next() {
            if i%2 == 0 {
                mu.RLock()
                _ = m[i%1000]
                mu.RUnlock()
            } else {
                mu.Lock()
                m[i%1000] = i
                mu.Unlock()
            }
            i++
        }
    })
}
```

### 控制并行度

```go
func BenchmarkWithParallelism(b *testing.B) {
    // GOMAXPROCS * 100 个 goroutine
    b.SetParallelism(100)

    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            operation()
        }
    })
}
```

测试不同 CPU 核心数：

```bash
go test -bench=BenchmarkParallel -cpu=1,2,4,8,16
```

### 稳定的测试环境

为了获得可靠的基准测试结果：

1. **关闭不必要的后台程序**
2. **避免在笔记本电池模式下测试**
3. **禁用 CPU 频率调节**（如果可能）
4. **多次运行取平均值**
5. **使用专用的测试机器**

```bash
# Linux 下禁用 CPU 频率调节
sudo cpupower frequency-set -g performance

# 或者设置固定频率
sudo cpupower frequency-set -f 3.5GHz
```

### 避免测试数据影响结果

```go
// 问题：有序数据可能导致排序快于预期
func BenchmarkSortOrdered(b *testing.B) {
    data := make([]int, 10000)
    for i := range data {
        data[i] = i // 已排序！
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        sort.Ints(data) // 几乎不需要工作
    }
}

// 正确：每次使用随机数据
func BenchmarkSortRandom(b *testing.B) {
    for i := 0; i < b.N; i++ {
        b.StopTimer()
        data := make([]int, 10000)
        for j := range data {
            data[j] = rand.Intn(10000)
        }
        b.StartTimer()

        sort.Ints(data)
    }
}

// 更好：预生成数据，每次复制
func BenchmarkSortBetter(b *testing.B) {
    original := make([]int, 10000)
    for i := range original {
        original[i] = rand.Intn(10000)
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        b.StopTimer()
        data := make([]int, len(original))
        copy(data, original)
        b.StartTimer()

        sort.Ints(data)
    }
}
```

### 处理 CPU 缓存效应

不同数据规模会触发不同级别的 CPU 缓存：

```go
func BenchmarkCacheEffect(b *testing.B) {
    sizes := []struct {
        name string
        size int
    }{
        {"L1-fit", 1 << 14},      // 16KB - 适合 L1 缓存
        {"L1-exceed", 1 << 16},   // 64KB - 超过 L1
        {"L2-fit", 1 << 18},      // 256KB - 适合 L2 缓存
        {"L2-exceed", 1 << 21},   // 2MB - 超过 L2
        {"L3-exceed", 1 << 24},   // 16MB - 超过 L3
        {"RAM", 1 << 27},         // 128MB - 主内存
    }

    for _, tc := range sizes {
        b.Run(tc.name, func(b *testing.B) {
            data := make([]byte, tc.size)
            b.SetBytes(int64(tc.size))
            b.ResetTimer()

            for i := 0; i < b.N; i++ {
                // 顺序访问
                for j := 0; j < len(data); j++ {
                    data[j]++
                }
            }
        })
    }
}
```

## 实战案例

### 案例 1：JSON 序列化性能对比

```go
package jsonbench

import (
    "encoding/json"
    "testing"
    "time"

    jsoniter "github.com/json-iterator/go"
)

type User struct {
    ID        int64     `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
    Tags      []string  `json:"tags"`
    Settings  Settings  `json:"settings"`
}

type Settings struct {
    Theme    string `json:"theme"`
    Language string `json:"language"`
    Timezone string `json:"timezone"`
}

func createTestUser() *User {
    return &User{
        ID:        12345,
        Name:      "张三",
        Email:     "zhangsan@example.com",
        CreatedAt: time.Now(),
        Tags:      []string{"developer", "golang", "backend"},
        Settings: Settings{
            Theme:    "dark",
            Language: "zh-CN",
            Timezone: "Asia/Shanghai",
        },
    }
}

func BenchmarkJSONMarshal(b *testing.B) {
    user := createTestUser()

    b.Run("encoding/json", func(b *testing.B) {
        b.ReportAllocs()
        for i := 0; i < b.N; i++ {
            _, _ = json.Marshal(user)
        }
    })

    b.Run("json-iterator", func(b *testing.B) {
        b.ReportAllocs()
        var json = jsoniter.ConfigCompatibleWithStandardLibrary
        for i := 0; i < b.N; i++ {
            _, _ = json.Marshal(user)
        }
    })
}

func BenchmarkJSONUnmarshal(b *testing.B) {
    user := createTestUser()
    data, _ := json.Marshal(user)

    b.Run("encoding/json", func(b *testing.B) {
        b.ReportAllocs()
        for i := 0; i < b.N; i++ {
            var u User
            _ = json.Unmarshal(data, &u)
        }
    })

    b.Run("json-iterator", func(b *testing.B) {
        b.ReportAllocs()
        var json = jsoniter.ConfigCompatibleWithStandardLibrary
        for i := 0; i < b.N; i++ {
            var u User
            _ = json.Unmarshal(data, &u)
        }
    })
}
```

### 案例 2：HTTP 处理器性能测试

```go
package httpbench

import (
    "bytes"
    "io"
    "net/http"
    "net/http/httptest"
    "testing"
)

func handleHealth(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ok"}`))
}

func handleCreate(w http.ResponseWriter, r *http.Request) {
    body, _ := io.ReadAll(r.Body)
    defer r.Body.Close()

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    w.Write(body)
}

func BenchmarkHTTPHandler(b *testing.B) {
    b.Run("GET/health", func(b *testing.B) {
        req := httptest.NewRequest("GET", "/health", nil)

        b.ReportAllocs()
        b.ResetTimer()
        for i := 0; i < b.N; i++ {
            w := httptest.NewRecorder()
            handleHealth(w, req)
        }
    })

    b.Run("POST/create", func(b *testing.B) {
        body := []byte(`{"name":"test","email":"test@example.com"}`)

        b.ReportAllocs()
        b.ResetTimer()
        for i := 0; i < b.N; i++ {
            req := httptest.NewRequest("POST", "/users", bytes.NewReader(body))
            req.Header.Set("Content-Type", "application/json")
            w := httptest.NewRecorder()
            handleCreate(w, req)
        }
    })

    b.Run("Parallel/health", func(b *testing.B) {
        b.ReportAllocs()
        b.RunParallel(func(pb *testing.PB) {
            for pb.Next() {
                req := httptest.NewRequest("GET", "/health", nil)
                w := httptest.NewRecorder()
                handleHealth(w, req)
            }
        })
    })
}
```

### 案例 3：算法优化验证

```go
package algobench

import (
    "testing"
)

// 朴素递归实现
func fibNaive(n int) int {
    if n <= 1 {
        return n
    }
    return fibNaive(n-1) + fibNaive(n-2)
}

// 动态规划实现
func fibDP(n int) int {
    if n <= 1 {
        return n
    }
    prev, curr := 0, 1
    for i := 2; i <= n; i++ {
        prev, curr = curr, prev+curr
    }
    return curr
}

// 带记忆化的递归
func fibMemo(n int) int {
    memo := make(map[int]int)
    var fib func(n int) int
    fib = func(n int) int {
        if n <= 1 {
            return n
        }
        if v, ok := memo[n]; ok {
            return v
        }
        memo[n] = fib(n-1) + fib(n-2)
        return memo[n]
    }
    return fib(n)
}

// 矩阵快速幂实现
func fibMatrix(n int) int {
    if n <= 1 {
        return n
    }

    // [[F(n+1), F(n)], [F(n), F(n-1)]] = [[1,1], [1,0]]^n
    matrix := [2][2]int{{1, 1}, {1, 0}}
    result := matrixPow(matrix, n-1)
    return result[0][0]
}

func matrixPow(m [2][2]int, n int) [2][2]int {
    result := [2][2]int{{1, 0}, {0, 1}} // 单位矩阵

    for n > 0 {
        if n&1 == 1 {
            result = matrixMul(result, m)
        }
        m = matrixMul(m, m)
        n >>= 1
    }
    return result
}

func matrixMul(a, b [2][2]int) [2][2]int {
    return [2][2]int{
        {a[0][0]*b[0][0] + a[0][1]*b[1][0], a[0][0]*b[0][1] + a[0][1]*b[1][1]},
        {a[1][0]*b[0][0] + a[1][1]*b[1][0], a[1][0]*b[0][1] + a[1][1]*b[1][1]},
    }
}

var result int

func BenchmarkFibonacci(b *testing.B) {
    ns := []int{10, 20, 30, 40}

    for _, n := range ns {
        // 朴素算法只测试小规模
        if n <= 30 {
            b.Run(fmt.Sprintf("Naive/n=%d", n), func(b *testing.B) {
                var r int
                for i := 0; i < b.N; i++ {
                    r = fibNaive(n)
                }
                result = r
            })
        }

        b.Run(fmt.Sprintf("DP/n=%d", n), func(b *testing.B) {
            var r int
            for i := 0; i < b.N; i++ {
                r = fibDP(n)
            }
            result = r
        })

        b.Run(fmt.Sprintf("Memo/n=%d", n), func(b *testing.B) {
            var r int
            for i := 0; i < b.N; i++ {
                r = fibMemo(n)
            }
            result = r
        })

        b.Run(fmt.Sprintf("Matrix/n=%d", n), func(b *testing.B) {
            var r int
            for i := 0; i < b.N; i++ {
                r = fibMatrix(n)
            }
            result = r
        })
    }
}
```

### 案例 4：对象池性能

```go
package poolbench

import (
    "sync"
    "testing"
)

type Buffer struct {
    data []byte
}

var bufferPool = sync.Pool{
    New: func() interface{} {
        return &Buffer{data: make([]byte, 1024)}
    },
}

func BenchmarkBufferAllocation(b *testing.B) {
    b.Run("NewEachTime", func(b *testing.B) {
        b.ReportAllocs()
        for i := 0; i < b.N; i++ {
            buf := &Buffer{data: make([]byte, 1024)}
            // 使用 buffer
            for j := range buf.data {
                buf.data[j] = byte(j)
            }
        }
    })

    b.Run("SyncPool", func(b *testing.B) {
        b.ReportAllocs()
        for i := 0; i < b.N; i++ {
            buf := bufferPool.Get().(*Buffer)
            // 使用 buffer
            for j := range buf.data {
                buf.data[j] = byte(j)
            }
            // 重置并归还
            for j := range buf.data {
                buf.data[j] = 0
            }
            bufferPool.Put(buf)
        }
    })

    b.Run("Parallel/NewEachTime", func(b *testing.B) {
        b.ReportAllocs()
        b.RunParallel(func(pb *testing.PB) {
            for pb.Next() {
                buf := &Buffer{data: make([]byte, 1024)}
                for j := range buf.data {
                    buf.data[j] = byte(j)
                }
            }
        })
    })

    b.Run("Parallel/SyncPool", func(b *testing.B) {
        b.ReportAllocs()
        b.RunParallel(func(pb *testing.PB) {
            for pb.Next() {
                buf := bufferPool.Get().(*Buffer)
                for j := range buf.data {
                    buf.data[j] = byte(j)
                }
                for j := range buf.data {
                    buf.data[j] = 0
                }
                bufferPool.Put(buf)
            }
        })
    })
}
```

## 常见陷阱与解决方案

### 陷阱 1：忘记循环 b.N 次

```go
// 错误
func BenchmarkWrong(b *testing.B) {
    operation() // 只执行一次！
}

// 正确
func BenchmarkCorrect(b *testing.B) {
    for i := 0; i < b.N; i++ {
        operation()
    }
}
```

### 陷阱 2：在循环内分配大量内存

```go
// 可能导致 GC 干扰测试结果
func BenchmarkGCInterference(b *testing.B) {
    for i := 0; i < b.N; i++ {
        data := make([]byte, 10*1024*1024) // 每次分配 10MB
        process(data)
    }
}

// 改进：复用内存
func BenchmarkReuse(b *testing.B) {
    data := make([]byte, 10*1024*1024)
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        // 清空并复用
        for j := range data {
            data[j] = 0
        }
        process(data)
    }
}
```

### 陷阱 3：计时器控制不当

```go
// 错误：在循环外调用 StopTimer/StartTimer
func BenchmarkWrongTimer(b *testing.B) {
    b.StopTimer() // 错误位置
    for i := 0; i < b.N; i++ {
        operation()
    }
    b.StartTimer() // 错误位置
}

// 正确
func BenchmarkCorrectTimer(b *testing.B) {
    setup()
    b.ResetTimer() // 准备完成后重置

    for i := 0; i < b.N; i++ {
        operation()
    }
}
```

### 陷阱 4：并行测试中的数据竞争

```go
// 错误：共享可变状态
func BenchmarkRace(b *testing.B) {
    counter := 0
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            counter++ // 数据竞争！
        }
    })
}

// 正确：使用原子操作
func BenchmarkNoRace(b *testing.B) {
    var counter int64
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            atomic.AddInt64(&counter, 1)
        }
    })
}
```

使用 `-race` 检测竞争：

```bash
go test -bench=. -race
```

### 陷阱 5：忽略编译器优化

```go
// 编译器可能完全优化掉无副作用的计算
func BenchmarkOptimizedAway(b *testing.B) {
    for i := 0; i < b.N; i++ {
        _ = fibonacci(10) // 结果被丢弃，可能被优化
    }
}

// 解决方案：使用全局变量存储结果
var sink int

func BenchmarkNotOptimized(b *testing.B) {
    var r int
    for i := 0; i < b.N; i++ {
        r = fibonacci(10)
    }
    sink = r
}
```

### 陷阱 6：基准测试时间过短

```go
// 对于极快的操作，可以批量执行
func BenchmarkTinyOperation(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // 批量执行以获得更稳定的结果
        for j := 0; j < 1000; j++ {
            tinyOperation()
        }
    }
    // 注意：实际 ns/op 需要除以 1000
}
```

或者增加基准测试时间：

```bash
go test -bench=. -benchtime=10s
```

## 面试要点总结

### 基本概念

**Q: Go 基准测试的函数签名是什么？**

```go
func BenchmarkXxx(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // 被测代码
    }
}
```

**Q: b.N 是什么？如何确定其值？**

A: `b.N` 是迭代次数，由 Go 运行时动态调整。框架会逐步增加 N 的值，直到测试运行时间达到 `benchtime`（默认1秒）。

### 计时器控制

| 方法 | 作用 | 使用场景 |
|------|------|----------|
| `ResetTimer()` | 重置计时器 | setup 完成后 |
| `StopTimer()` | 暂停计时 | 每次迭代准备 |
| `StartTimer()` | 恢复计时 | 准备完成后 |

### 关键命令

```bash
go test -bench=.                  # 运行所有基准测试
go test -bench=. -benchmem        # 显示内存分配
go test -bench=. -count=10        # 运行10次
go test -bench=. -cpuprofile=cpu.prof  # 生成 CPU profile
```

### 常见陷阱

1. 忘记使用 `b.N` 循环
2. 编译器优化掉被测代码
3. 在循环内部大量分配内存
4. 测试数据不具代表性
5. 并行测试中的数据竞争

## 延伸阅读

### 官方文档

- [Go testing 包文档](https://pkg.go.dev/testing)
- [Go 命令文档 - test](https://pkg.go.dev/cmd/go#hdr-Testing_flags)

### 工具

- [benchstat](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat) - 基准测试结果分析工具
- [go tool pprof](https://go.dev/blog/pprof) - 性能分析工具

### 相关主题

- pprof CPU 和内存分析
- trace 工具
- 竞态检测（`-race`）
- 逃逸分析（`-gcflags="-m"`）

## 总结

Go 的基准测试框架虽然简洁，但功能强大：

| 功能 | 说明 |
|------|------|
| `b.N` | 自动调整的迭代次数 |
| `b.Run()` | 子基准测试，支持参数化 |
| `b.ReportAllocs()` | 内存分配统计 |
| `b.SetBytes()` | 吞吐量计算 |
| `b.RunParallel()` | 并行测试 |
| `b.ResetTimer()` | 计时器控制 |
| `b.ReportMetric()` | 自定义指标 |

掌握这些知识点，你将能够：

1. **编写有效的基准测试**：正确使用 b.N 和计时器控制
2. **分析性能数据**：理解 ns/op、B/op、allocs/op 的含义
3. **比较优化效果**：使用 benchstat 进行科学对比
4. **定位性能瓶颈**：结合 pprof 进行深入分析
5. **避免常见陷阱**：编译器优化、数据竞争等问题

性能优化是一个持续的过程，基准测试是这个过程中不可或缺的工具。通过系统性地测量和分析，你可以做出数据驱动的优化决策，而不是凭直觉猜测。
