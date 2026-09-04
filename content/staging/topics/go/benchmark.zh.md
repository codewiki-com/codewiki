---
title: 基准测试
description: Go基准测试深入指南，testing.B详解、性能分析与优化技巧
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - 基准测试
  - 性能优化
  - testing.B
  - benchmem
status: imported
origin: old/src/content/docs/go/benchmark.zh.md
divergence: 0.208
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 测试与性能
  order: 7
  lastUpdated: 2026-01-07
---

## 概念解释

基准测试 (Benchmark Testing) 是一种系统性地测量代码性能的方法，用于评估函数或代码段的执行速度、内存分配和资源消耗。在 Go 语言中，基准测试是 `testing` 包的核心功能之一，与单元测试同等重要。

### 什么是基准测试

基准测试通过重复执行目标代码多次，收集统计数据来得出可靠的性能指标。与单元测试关注"代码是否正确"不同，基准测试关注"代码运行得多快、消耗多少资源"。

### 为什么需要基准测试

1. **性能验证**：验证优化是否真正有效
2. **回归检测**：发现性能退化问题
3. **方案对比**：比较不同实现的性能差异
4. **瓶颈定位**：配合 profiling 定位性能热点
5. **容量规划**：为系统容量规划提供数据支撑

### 历史背景

Go 从 1.0 版本开始就内置了基准测试支持，这体现了 Go 语言对性能的重视。随着版本迭代，基准测试功能不断增强：

- Go 1.0：基本基准测试支持
- Go 1.3：添加 `b.ReportAllocs()`
- Go 1.5：添加 `b.Run()` 子基准测试
- Go 1.7：改进并行基准测试
- Go 1.18+：模糊测试与基准测试的结合

## 核心原理

### testing.B 结构体

`testing.B` 是基准测试的核心类型，它控制基准测试的执行流程并收集性能数据：

```go
// testing.B 的关键字段（简化版）
type B struct {
    N int // 迭代次数，由框架动态调整

    // 内部字段
    benchFunc func(b *B)
    benchTime durationOrCountFlag
    bytes     int64
    timerOn   bool
    startAllocs uint64
    startBytes  uint64
    netAllocs   uint64
    netBytes    uint64
    // ...
}
```

### b.N 的自动调整机制

`b.N` 是基准测试的核心，表示循环执行的次数。Go 运行时会自动调整 `b.N` 的值，使基准测试运行足够长的时间以获得准确的测量结果：

```
1. 初始 N = 1
2. 运行基准测试，测量总时间
3. 如果时间 < benchtime（默认1秒）：
   - 根据已测量的性能估算新的 N 值
   - 新 N 通常是之前的 2-10 倍
   - 重复步骤 2
4. 如果时间 >= benchtime：
   - 计算最终结果
   - 报告 ns/op, B/op, allocs/op
```

```go
// N 的自动调整示例
func BenchmarkAutoN(b *testing.B) {
    // 框架会多次调用此函数，每次 b.N 的值不同：
    // 第1次: N = 1
    // 第2次: N = 100
    // 第3次: N = 10000
    // 第4次: N = 1000000
    // ...直到运行时间 >= 1秒

    for i := 0; i < b.N; i++ {
        // 被测试的代码
        _ = fmt.Sprintf("hello %d", i)
    }
}
```

### 计时器控制原理

基准测试框架内部维护一个计时器，用于准确测量被测代码的执行时间：

```go
// 计时器状态机
//
// 初始状态: timerOn = true（测试开始时自动开启）
//
// b.StopTimer()  -> timerOn = false（暂停计时）
// b.StartTimer() -> timerOn = true（恢复计时）
// b.ResetTimer() -> 重置所有计数器，timerOn = true
```

```go
func BenchmarkTimerControl(b *testing.B) {
    // 1. 测试开始，计时器自动开启

    // 2. 暂停计时，执行准备工作
    b.StopTimer()
    data := prepareTestData() // 这段时间不计入
    b.StartTimer()

    // 3. 或者使用 ResetTimer 重置
    // b.ResetTimer() // 重置所有计数，重新开始计时

    for i := 0; i < b.N; i++ {
        processData(data)
    }
}
```

### 内存分配统计原理

当启用内存分配统计时，框架会在测试前后记录内存分配情况：

```go
// 内存统计过程
//
// 1. 测试开始前记录: startAllocs, startBytes
// 2. 执行 b.N 次循环
// 3. 测试结束后记录: endAllocs, endBytes
// 4. 计算:
//    - netAllocs = endAllocs - startAllocs
//    - netBytes = endBytes - startBytes
//    - allocs/op = netAllocs / N
//    - B/op = netBytes / N
```

## 核心要点

### 基准测试函数签名

```go
// 基准测试函数必须以 Benchmark 开头
// 参数必须是 *testing.B
// 无返回值
func BenchmarkXxx(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // 被测代码
    }
}
```

### testing.B 核心方法

| 方法 | 说明 | 使用场景 |
|------|------|----------|
| `b.N` | 迭代次数 | 必须在循环中使用 |
| `b.ResetTimer()` | 重置计时器 | setup 后重置 |
| `b.StopTimer()` | 暂停计时 | 每次迭代的准备工作 |
| `b.StartTimer()` | 恢复计时 | 恢复计时 |
| `b.ReportAllocs()` | 报告内存分配 | 分析内存使用 |
| `b.SetBytes(n)` | 设置处理的字节数 | 计算吞吐量 |
| `b.Run(name, f)` | 子基准测试 | 参数化测试 |
| `b.RunParallel(f)` | 并行基准测试 | 测试并发性能 |
| `b.SetParallelism(p)` | 设置并行度 | 控制 goroutine 数量 |
| `b.ReportMetric(n, unit)` | 报告自定义指标 | 自定义度量 |

### 运行命令

```bash
# 基本运行
go test -bench=.                    # 运行所有基准测试
go test -bench=BenchmarkXxx         # 运行指定测试
go test -bench="Benchmark.*Add"     # 正则匹配

# 内存分析
go test -bench=. -benchmem          # 显示内存分配

# 运行控制
go test -bench=. -benchtime=5s      # 设置运行时间
go test -bench=. -benchtime=1000x   # 设置固定迭代次数
go test -bench=. -count=5           # 运行5次取平均
go test -bench=. -cpu=1,2,4,8       # 测试不同CPU核心数

# 输出控制
go test -bench=. -v                 # 详细输出
go test -bench=. -benchmem -json    # JSON格式输出
```

### 输出格式解读

```
BenchmarkAdd-8     1000000000    0.25 ns/op    0 B/op    0 allocs/op
     ^         ^        ^            ^            ^           ^
     |         |        |            |            |           |
   名称      CPU核心  迭代次数  每次操作耗时  每次内存分配  每次分配次数
```

## 代码示例

### 基本基准测试

```go
package benchmark

import (
    "testing"
)

// 被测函数
func Add(a, b int) int {
    return a + b
}

func Multiply(a, b int) int {
    return a * b
}

// 基本基准测试
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(1, 2)
    }
}

func BenchmarkMultiply(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Multiply(3, 4)
    }
}
```

### 防止编译器优化

编译器可能会优化掉没有副作用的代码，导致测试结果失真：

```go
// 错误示例：结果可能被优化掉
func BenchmarkAddWrong(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(1, 2) // 编译器可能完全优化掉
    }
}

// 正确示例：使用全局变量或 sink
var result int

func BenchmarkAddCorrect(b *testing.B) {
    var r int
    for i := 0; i < b.N; i++ {
        r = Add(1, 2)
    }
    result = r // 防止编译器优化
}

// 另一种方式：使用 runtime.KeepAlive
func BenchmarkAddWithKeepAlive(b *testing.B) {
    for i := 0; i < b.N; i++ {
        r := Add(1, 2)
        runtime.KeepAlive(r)
    }
}
```

### 带 Setup 的基准测试

```go
func BenchmarkWithSetup(b *testing.B) {
    // 准备工作（不计入测试时间）
    data := make([]int, 10000)
    for i := range data {
        data[i] = i
    }

    // 重置计时器，排除准备时间
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        // 被测代码
        sum := 0
        for _, v := range data {
            sum += v
        }
    }
}

// 每次迭代都需要准备的情况
func BenchmarkWithIterationSetup(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // 暂停计时
        b.StopTimer()
        data := generateTestData() // 不计入测试时间
        b.StartTimer()

        // 被测代码
        processData(data)
    }
}
```

### 内存分配基准测试

```go
// 比较不同字符串拼接方式的性能
func BenchmarkStringConcatPlus(b *testing.B) {
    b.ReportAllocs() // 报告内存分配

    for i := 0; i < b.N; i++ {
        s := ""
        for j := 0; j < 100; j++ {
            s += "a"
        }
        _ = s
    }
}

func BenchmarkStringConcatBuilder(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var builder strings.Builder
        for j := 0; j < 100; j++ {
            builder.WriteString("a")
        }
        _ = builder.String()
    }
}

func BenchmarkStringConcatBuffer(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var buf bytes.Buffer
        for j := 0; j < 100; j++ {
            buf.WriteString("a")
        }
        _ = buf.String()
    }
}

func BenchmarkStringConcatJoin(b *testing.B) {
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

// 输出示例：
// BenchmarkStringConcatPlus-8       5000   234567 ns/op   53000 B/op   99 allocs/op
// BenchmarkStringConcatBuilder-8  500000     3456 ns/op     512 B/op    4 allocs/op
// BenchmarkStringConcatBuffer-8   300000     4567 ns/op     640 B/op    5 allocs/op
// BenchmarkStringConcatJoin-8    1000000     1234 ns/op     112 B/op    1 allocs/op
```

### 子基准测试 (Sub-benchmarks)

```go
func BenchmarkSort(b *testing.B) {
    // 测试不同大小输入的排序性能
    sizes := []int{10, 100, 1000, 10000}

    for _, size := range sizes {
        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            // 准备数据
            data := make([]int, size)
            for i := range data {
                data[i] = rand.Intn(size)
            }

            b.ResetTimer()
            for i := 0; i < b.N; i++ {
                // 每次需要新的数据副本
                b.StopTimer()
                dataCopy := make([]int, len(data))
                copy(dataCopy, data)
                b.StartTimer()

                sort.Ints(dataCopy)
            }
        })
    }
}

// 多维度参数化测试
func BenchmarkHashFunction(b *testing.B) {
    algorithms := []string{"md5", "sha1", "sha256"}
    sizes := []int{64, 256, 1024, 4096}

    for _, alg := range algorithms {
        for _, size := range sizes {
            name := fmt.Sprintf("%s/size=%d", alg, size)
            b.Run(name, func(b *testing.B) {
                data := make([]byte, size)
                rand.Read(data)

                var hasher hash.Hash
                switch alg {
                case "md5":
                    hasher = md5.New()
                case "sha1":
                    hasher = sha1.New()
                case "sha256":
                    hasher = sha256.New()
                }

                b.ResetTimer()
                b.SetBytes(int64(size)) // 设置吞吐量计算基准

                for i := 0; i < b.N; i++ {
                    hasher.Reset()
                    hasher.Write(data)
                    hasher.Sum(nil)
                }
            })
        }
    }
}

// 运行特定子测试
// go test -bench="BenchmarkSort/size=1000"
// go test -bench="BenchmarkHashFunction/sha256"
```

### 并行基准测试

```go
// 测试并发安全的数据结构
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

// 比较普通 map（带锁）和 sync.Map 的并发性能
func BenchmarkRegularMapWithMutex(b *testing.B) {
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

// 控制并行度
func BenchmarkWithParallelism(b *testing.B) {
    b.SetParallelism(100) // GOMAXPROCS * 100 个 goroutine

    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            // 并发执行的代码
            time.Sleep(time.Microsecond)
        }
    })
}

// 测试不同 CPU 核心数
// go test -bench=BenchmarkMapConcurrent -cpu=1,2,4,8,16
```

### 吞吐量测试

```go
// 测试 I/O 吞吐量
func BenchmarkIOThroughput(b *testing.B) {
    data := make([]byte, 1024*1024) // 1MB
    rand.Read(data)

    tmpFile, _ := os.CreateTemp("", "bench-*")
    defer os.Remove(tmpFile.Name())
    defer tmpFile.Close()

    b.SetBytes(int64(len(data))) // 设置每次操作处理的字节数
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        tmpFile.Seek(0, 0)
        tmpFile.Write(data)
        tmpFile.Sync()
    }
    // 输出会包含 MB/s 吞吐量指标
}

// 网络吞吐量测试
func BenchmarkHTTPThroughput(b *testing.B) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        data := make([]byte, 1024)
        w.Write(data)
    }))
    defer server.Close()

    b.SetBytes(1024)
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        resp, _ := http.Get(server.URL)
        io.Copy(io.Discard, resp.Body)
        resp.Body.Close()
    }
}
```

### 自定义指标报告

```go
func BenchmarkWithCustomMetrics(b *testing.B) {
    var totalItems int64
    var totalErrors int64

    for i := 0; i < b.N; i++ {
        items, errors := processWorkload()
        atomic.AddInt64(&totalItems, int64(items))
        atomic.AddInt64(&totalErrors, int64(errors))
    }

    // 报告自定义指标
    b.ReportMetric(float64(totalItems)/float64(b.N), "items/op")
    b.ReportMetric(float64(totalErrors)/float64(b.N), "errors/op")
    b.ReportMetric(float64(totalItems)/b.Elapsed().Seconds(), "items/s")
}
```

### 算法对比测试

```go
// 比较不同排序算法
func BenchmarkSortAlgorithms(b *testing.B) {
    sizes := []int{100, 1000, 10000}

    for _, size := range sizes {
        // 准备测试数据
        original := make([]int, size)
        for i := range original {
            original[i] = rand.Intn(size)
        }

        b.Run(fmt.Sprintf("stdlib/size=%d", size), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                data := make([]int, len(original))
                copy(data, original)
                sort.Ints(data)
            }
        })

        b.Run(fmt.Sprintf("quicksort/size=%d", size), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                data := make([]int, len(original))
                copy(data, original)
                quickSort(data)
            }
        })

        b.Run(fmt.Sprintf("mergesort/size=%d", size), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                data := make([]int, len(original))
                copy(data, original)
                mergeSort(data)
            }
        })
    }
}
```

## 最佳实践

### 循环必须使用 b.N

```go
// 正确
func BenchmarkCorrect(b *testing.B) {
    for i := 0; i < b.N; i++ {
        operation()
    }
}

// 错误：固定循环次数
func BenchmarkWrong(b *testing.B) {
    for i := 0; i < 1000; i++ { // 错误！
        operation()
    }
}
```

### 合理使用计时器控制

```go
func BenchmarkProperTimerUsage(b *testing.B) {
    // 情况1：一次性准备工作 - 使用 ResetTimer
    expensiveSetup()
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        operation()
    }
}

func BenchmarkIterationSetup(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // 情况2：每次迭代都需要准备 - 使用 Stop/Start
        b.StopTimer()
        data := prepareData()
        b.StartTimer()

        process(data)
    }
}
```

### 避免编译器优化陷阱

```go
var globalResult interface{}

func BenchmarkAvoidOptimization(b *testing.B) {
    var result int
    for i := 0; i < b.N; i++ {
        result = expensiveComputation()
    }
    globalResult = result // 确保结果被使用
}
```

### 使用子基准测试组织代码

```go
func BenchmarkOrganized(b *testing.B) {
    // 使用子测试提高可读性和可维护性
    b.Run("SmallInput", func(b *testing.B) {
        benchmarkWithSize(b, 100)
    })

    b.Run("MediumInput", func(b *testing.B) {
        benchmarkWithSize(b, 10000)
    })

    b.Run("LargeInput", func(b *testing.B) {
        benchmarkWithSize(b, 1000000)
    })
}

func benchmarkWithSize(b *testing.B, size int) {
    data := generateData(size)
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        process(data)
    }
}
```

### 启用内存分配报告

```go
func BenchmarkWithAllocs(b *testing.B) {
    b.ReportAllocs() // 始终报告内存分配

    for i := 0; i < b.N; i++ {
        operation()
    }
}
```

### 多次运行取稳定值

```bash
# 运行多次取平均，减少噪声
go test -bench=. -count=10
```

### 在稳定环境下测试

- 关闭不必要的后台程序
- 避免在笔记本电池模式下测试
- 考虑 CPU 频率调节的影响
- 多次运行，排除异常值

## 常见陷阱

### 忘记循环 b.N 次

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

### 在循环内部分配大量内存

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

### 计时器控制不当

```go
// 错误：在循环外调用 StopTimer/StartTimer
func BenchmarkWrongTimer(b *testing.B) {
    b.StopTimer() // 这里是错误的
    for i := 0; i < b.N; i++ {
        operation()
    }
    b.StartTimer() // 这里也是错误的
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

### 并行测试中的数据竞争

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

// 正确：使用原子操作或局部变量
func BenchmarkNoRace(b *testing.B) {
    var counter int64
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            atomic.AddInt64(&counter, 1)
        }
    })
}
```

### 测试数据影响结果

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

// 正确：使用随机数据
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
```

### 忽略编译器优化

```go
// 编译器可能完全优化掉无副作用的计算
func BenchmarkOptimizedAway(b *testing.B) {
    for i := 0; i < b.N; i++ {
        _ = fibonacci(10) // 结果被丢弃，可能被优化
    }
}

// 解决方案
var sink int

func BenchmarkNotOptimized(b *testing.B) {
    var result int
    for i := 0; i < b.N; i++ {
        result = fibonacci(10)
    }
    sink = result
}
```

## 性能考量

### 基准测试本身的开销

基准测试框架本身有少量开销，对于极快的操作（< 1ns）可能会影响结果：

```go
// 对于非常快的操作，可以批量执行
func BenchmarkTinyOperation(b *testing.B) {
    for i := 0; i < b.N; i++ {
        for j := 0; j < 100; j++ {
            tinyOperation()
        }
    }
    // 实际 ns/op 需要除以 100
}
```

### 内存分配的影响

频繁的内存分配会触发 GC，影响测试稳定性：

```bash
# 查看 GC 对测试的影响
GODEBUG=gctrace=1 go test -bench=.
```

### CPU 缓存效应

小数据集可能完全在 CPU 缓存中，导致测试结果优于实际场景：

```go
// 测试不同数据规模以观察缓存效应
func BenchmarkCacheEffect(b *testing.B) {
    sizes := []int{
        1 << 10,  // 1KB - L1 cache
        1 << 15,  // 32KB - L1 cache boundary
        1 << 18,  // 256KB - L2 cache
        1 << 22,  // 4MB - L3 cache boundary
        1 << 26,  // 64MB - 主内存
    }

    for _, size := range sizes {
        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            data := make([]byte, size)
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

### 并发基准测试的扩展性

```go
func BenchmarkScalability(b *testing.B) {
    for _, procs := range []int{1, 2, 4, 8, 16} {
        b.Run(fmt.Sprintf("GOMAXPROCS=%d", procs), func(b *testing.B) {
            runtime.GOMAXPROCS(procs)

            b.RunParallel(func(pb *testing.PB) {
                for pb.Next() {
                    operation()
                }
            })
        })
    }
}
```

## 实战场景

### 场景1：JSON 序列化性能对比

```go
type User struct {
    ID        int64     `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
    Tags      []string  `json:"tags"`
}

func BenchmarkJSONMarshal(b *testing.B) {
    user := &User{
        ID:        12345,
        Name:      "张三",
        Email:     "zhangsan@example.com",
        CreatedAt: time.Now(),
        Tags:      []string{"developer", "golang", "backend"},
    }

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

    b.Run("easyjson", func(b *testing.B) {
        b.ReportAllocs()
        for i := 0; i < b.N; i++ {
            _, _ = user.MarshalJSON() // 需要生成的代码
        }
    })
}
```

### 场景2：数据库查询优化

```go
func BenchmarkDatabaseQuery(b *testing.B) {
    db := setupTestDB()
    defer db.Close()

    // 预填充数据
    seedTestData(db, 10000)

    b.Run("SingleQuery", func(b *testing.B) {
        b.ResetTimer()
        for i := 0; i < b.N; i++ {
            var user User
            db.First(&user, i%10000+1)
        }
    })

    b.Run("BatchQuery", func(b *testing.B) {
        b.ResetTimer()
        for i := 0; i < b.N; i++ {
            var users []User
            db.Where("id IN ?", []int{1, 2, 3, 4, 5}).Find(&users)
        }
    })

    b.Run("PreparedStatement", func(b *testing.B) {
        stmt := db.Session(&gorm.Session{PrepareStmt: true})
        b.ResetTimer()
        for i := 0; i < b.N; i++ {
            var user User
            stmt.First(&user, i%10000+1)
        }
    })
}
```

### 场景3：HTTP 服务性能测试

```go
func BenchmarkHTTPHandler(b *testing.B) {
    handler := setupHandler()

    b.Run("GET/simple", func(b *testing.B) {
        req := httptest.NewRequest("GET", "/api/health", nil)

        b.ResetTimer()
        for i := 0; i < b.N; i++ {
            w := httptest.NewRecorder()
            handler.ServeHTTP(w, req)
        }
    })

    b.Run("POST/json", func(b *testing.B) {
        body := []byte(`{"name":"test","email":"test@example.com"}`)

        b.ResetTimer()
        for i := 0; i < b.N; i++ {
            req := httptest.NewRequest("POST", "/api/users", bytes.NewReader(body))
            req.Header.Set("Content-Type", "application/json")
            w := httptest.NewRecorder()
            handler.ServeHTTP(w, req)
        }
    })

    // 并行测试
    b.Run("Parallel", func(b *testing.B) {
        b.RunParallel(func(pb *testing.PB) {
            for pb.Next() {
                req := httptest.NewRequest("GET", "/api/health", nil)
                w := httptest.NewRecorder()
                handler.ServeHTTP(w, req)
            }
        })
    })
}
```

### 场景4：算法优化前后对比

```go
// 优化前：朴素实现
func fibonacciNaive(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacciNaive(n-1) + fibonacciNaive(n-2)
}

// 优化后：动态规划
func fibonacciDP(n int) int {
    if n <= 1 {
        return n
    }
    prev, curr := 0, 1
    for i := 2; i <= n; i++ {
        prev, curr = curr, prev+curr
    }
    return curr
}

// 优化后：矩阵快速幂
func fibonacciMatrix(n int) int {
    if n <= 1 {
        return n
    }
    // 矩阵快速幂实现...
    return matrixPower(n)
}

func BenchmarkFibonacci(b *testing.B) {
    ns := []int{10, 20, 30, 40}

    for _, n := range ns {
        if n <= 30 { // 朴素算法对大 n 太慢
            b.Run(fmt.Sprintf("Naive/n=%d", n), func(b *testing.B) {
                for i := 0; i < b.N; i++ {
                    fibonacciNaive(n)
                }
            })
        }

        b.Run(fmt.Sprintf("DP/n=%d", n), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                fibonacciDP(n)
            }
        })

        b.Run(fmt.Sprintf("Matrix/n=%d", n), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                fibonacciMatrix(n)
            }
        })
    }
}
```

### 场景5：使用 benchstat 进行结果分析

```bash
# 安装 benchstat
go install golang.org/x/perf/cmd/benchstat@latest

# 运行基准测试并保存结果
go test -bench=. -count=10 > old.txt

# 修改代码后再次运行
go test -bench=. -count=10 > new.txt

# 比较结果
benchstat old.txt new.txt
```

输出示例：
```
name           old time/op    new time/op    delta
Process-8      45.2ms ± 3%    32.1ms ± 2%   -29.0%  (p=0.000 n=10+10)
Transform-8    12.3ms ± 4%    11.8ms ± 3%    -4.1%  (p=0.023 n=10+10)

name           old alloc/op   new alloc/op   delta
Process-8      1.23MB ± 0%    0.92MB ± 0%   -25.2%  (p=0.000 n=10+10)
```

## 面试要点

### 基本概念

**Q: Go 基准测试的函数签名是什么？**

A: 基准测试函数必须以 `Benchmark` 开头，接收 `*testing.B` 参数，无返回值：
```go
func BenchmarkXxx(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // 被测代码
    }
}
```

**Q: b.N 是什么？如何确定其值？**

A: `b.N` 是基准测试的迭代次数，由 Go 运行时动态调整。框架会逐步增加 N 的值（1 -> 100 -> 10000 -> ...），直到测试运行时间达到 `benchtime`（默认1秒），以获得统计上有意义的结果。

### 计时器控制

**Q: ResetTimer、StopTimer、StartTimer 的区别和使用场景？**

| 方法 | 作用 | 使用场景 |
|------|------|----------|
| `ResetTimer()` | 重置所有计数器 | 准备工作完成后 |
| `StopTimer()` | 暂停计时 | 每次迭代的准备 |
| `StartTimer()` | 恢复计时 | 准备完成后恢复 |

```go
func BenchmarkExample(b *testing.B) {
    // 一次性准备
    setup()
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        // 每次迭代准备
        b.StopTimer()
        data := prepare()
        b.StartTimer()

        process(data)
    }
}
```

### 内存分析

**Q: 如何分析基准测试的内存分配？**

A: 使用 `b.ReportAllocs()` 或 `-benchmem` 标志：

```go
func BenchmarkMemory(b *testing.B) {
    b.ReportAllocs()
    for i := 0; i < b.N; i++ {
        _ = make([]byte, 1024)
    }
}
// go test -bench=. -benchmem
// 输出: BenchmarkMemory-8  1000000  1024 B/op  1 allocs/op
```

### 并行测试

**Q: 如何编写并行基准测试？**

```go
func BenchmarkParallel(b *testing.B) {
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            operation()
        }
    })
}
```

**Q: b.RunParallel 和普通循环有什么区别？**

A: `b.RunParallel` 会启动 `GOMAXPROCS` 个 goroutine 并发执行测试，用于评估代码在并发场景下的性能。`pb.Next()` 会自动分配工作给各个 goroutine。

### 子基准测试

**Q: 为什么使用子基准测试？**

A: 子基准测试提供：
- 更好的测试组织结构
- 支持参数化测试
- 可选择性运行（`-bench="Parent/Child"`）
- 独立的计时和内存统计

### 常见陷阱

**Q: 编写基准测试时有哪些常见错误？**

1. 忘记使用 `b.N` 循环
2. 编译器优化掉被测代码
3. 在循环内部进行大量内存分配
4. 测试数据不具代表性
5. 并行测试中的数据竞争

### 结果分析

**Q: 如何比较两次基准测试的结果？**

A: 使用 `benchstat` 工具：
```bash
go test -bench=. -count=10 > old.txt
# 修改代码
go test -bench=. -count=10 > new.txt
benchstat old.txt new.txt
```

## 延伸阅读

### 官方文档

- [Go testing 包文档](https://pkg.go.dev/testing)
- [Go 命令文档 - test](https://pkg.go.dev/cmd/go#hdr-Testing_flags)
- [Go Wiki: TableDrivenTests](https://github.com/golang/go/wiki/TableDrivenTests)

### 工具

- [benchstat](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat) - 基准测试结果分析工具
- [benchcmp](https://pkg.go.dev/golang.org/x/tools/cmd/benchcmp) - 基准测试比较工具（已废弃，推荐使用 benchstat）
- [go-torch](https://github.com/uber-archive/go-torch) - 火焰图生成工具

### 进阶阅读

- [High Performance Go Workshop](https://dave.cheney.net/high-performance-go-workshop/dotgo-paris.html) - Dave Cheney
- [Profiling Go Programs](https://go.dev/blog/pprof) - Go 官方博客
- [Go 性能优化](https://golang.org/doc/diagnostics.html) - Go 官方诊断文档

### 相关主题

- pprof CPU 和内存分析
- trace 工具
- 竞态检测（`-race`）
- 逃逸分析（`-gcflags="-m"`）
