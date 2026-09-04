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
origin: old/src/content/docs/go/benchmarking.en.md
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

Performance benchmarking is an essential part of software development. Go provides powerful and concise benchmarking support through its built-in `testing` package, enabling developers to accurately measure code performance, identify bottlenecks, and verify optimization results. This article comprehensively introduces the core concepts, writing techniques, and best practices for Go benchmarking.

## Benchmarking Basics

### What is Benchmarking

Benchmarking is a method of measuring code performance by repeatedly executing code. Unlike unit tests that focus on "is the code correct," benchmarks focus on "how fast does the code run and how many resources does it consume."

Go benchmarking has the following characteristics:

- **Built-in support**: No third-party libraries needed, native support in the `testing` package
- **Automatic iteration**: The framework automatically adjusts iteration count for stable results
- **Precise measurement**: Supports nanosecond-level time precision and byte-level memory statistics
- **Easy integration**: Shares the same toolchain with unit tests

### Benchmark Function Signature

Benchmark functions must follow these specifications:

```go
// Function name must start with Benchmark
// Parameter must be of type *testing.B
// No return value
func BenchmarkXxx(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Code being tested
    }
}
```

### Your First Benchmark

Let's start with a simple example:

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

### Running Benchmarks

```bash
# Run all benchmarks
go test -bench=.

# Run specific benchmark (regex matching)
go test -bench=BenchmarkAdd

# Run benchmarks containing "Fib"
go test -bench=".*Fib.*"

# Also display memory allocation info
go test -bench=. -benchmem

# Set benchmark run time (default 1 second)
go test -bench=. -benchtime=5s

# Set fixed iteration count
go test -bench=. -benchtime=1000x

# Run multiple times for average
go test -bench=. -count=5

# Test with different CPU core counts
go test -bench=. -cpu=1,2,4,8

# Skip unit tests, only run benchmarks
go test -bench=. -run=^$
```

### Understanding Output Format

```
BenchmarkAdd-8          1000000000           0.25 ns/op
BenchmarkMultiply-8     1000000000           0.26 ns/op
BenchmarkFibonacci-8       30856             38965 ns/op
```

Field meanings:

| Field | Description |
|-------|-------------|
| `BenchmarkAdd-8` | Test name, `-8` indicates 8 CPU cores used |
| `1000000000` | Iteration count (final value of b.N) |
| `0.25 ns/op` | Average time per operation (nanoseconds) |

When using `-benchmem`, memory info is also displayed:

```
BenchmarkStringBuilder-8    5000000    234 ns/op    512 B/op    4 allocs/op
```

| Field | Description |
|-------|-------------|
| `512 B/op` | Bytes allocated per operation |
| `4 allocs/op` | Memory allocations per operation |

## Understanding b.N

### The Auto-adjustment Mechanism of b.N

`b.N` is the core of benchmarking, representing the number of loop iterations. The Go runtime automatically adjusts this value to run the test long enough to obtain accurate statistical results.

The adjustment process:

```
1. Initial N = 1, run test
2. If runtime < benchtime (default 1 second):
   - Estimate new N value based on measured performance
   - N typically grows to 2x, 5x, 10x, 20x, 50x, 100x...
   - Repeat test
3. If runtime >= benchtime:
   - Calculate and report final results
```

```go
func BenchmarkDemonstrate(b *testing.B) {
    // The framework calls this function multiple times with different b.N values:
    // 1st time: N = 1
    // 2nd time: N = 100
    // 3rd time: N = 10000
    // 4th time: N = 1000000
    // ...until cumulative runtime >= 1 second

    for i := 0; i < b.N; i++ {
        // Code being tested
        _ = make([]byte, 1024)
    }
}
```

### Using b.N Correctly

**Correct example**: Loop must use `b.N`

```go
func BenchmarkCorrect(b *testing.B) {
    for i := 0; i < b.N; i++ {
        operation()
    }
}
```

**Wrong example**: Using fixed count

```go
func BenchmarkWrong(b *testing.B) {
    for i := 0; i < 1000; i++ { // Wrong! Should use b.N
        operation()
    }
}
```

**Wrong example**: Executing outside the loop

```go
func BenchmarkAlsoWrong(b *testing.B) {
    operation() // Only executes once, cannot measure accurately
}
```

### Timer Control

`testing.B` provides three methods to control timing:

| Method | Description | Use Case |
|--------|-------------|----------|
| `b.ResetTimer()` | Reset timer and memory counters | After setup completes |
| `b.StopTimer()` | Pause timing | Preparation work in each iteration |
| `b.StartTimer()` | Resume timing | After preparation completes |

#### One-time Setup

```go
func BenchmarkWithSetup(b *testing.B) {
    // Setup (may be time-consuming)
    data := make([]int, 1000000)
    for i := range data {
        data[i] = i
    }

    // Reset timer to exclude setup time
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        sum := 0
        for _, v := range data {
            sum += v
        }
    }
}
```

#### Per-iteration Setup

```go
func BenchmarkWithIterationSetup(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Pause timing
        b.StopTimer()
        data := generateRandomData(1000) // Not counted in test time
        b.StartTimer()

        // Code being tested
        sort.Ints(data)
    }
}
```

### Preventing Compiler Optimization

The compiler may optimize away code without side effects, causing inaccurate test results:

```go
// Wrong: Result may be optimized away
func BenchmarkOptimizedAway(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(1, 2) // Compiler may completely optimize this away
    }
}

// Correct: Use global variable to store result
var result int

func BenchmarkNotOptimized(b *testing.B) {
    var r int
    for i := 0; i < b.N; i++ {
        r = Add(1, 2)
    }
    result = r // Ensure result is used
}

// Alternative: Use runtime.KeepAlive
func BenchmarkWithKeepAlive(b *testing.B) {
    for i := 0; i < b.N; i++ {
        r := Add(1, 2)
        runtime.KeepAlive(r)
    }
}
```

## Sub-benchmarks

Sub-benchmarks are created using the `b.Run()` method, a feature introduced in Go 1.7 that provides better test organization and parameterization capabilities.

### Basic Usage

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

Running specific sub-tests:

```bash
go test -bench="BenchmarkOperations/Add"
go test -bench="BenchmarkOperations/Fib"
```

### Parameterized Tests

The most powerful use of sub-benchmarks is parameterized testing:

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

// Output:
// BenchmarkFibonacciSizes/n=5-8     30000000    45.3 ns/op
// BenchmarkFibonacciSizes/n=10-8     3000000   512 ns/op
// BenchmarkFibonacciSizes/n=15-8      200000  5678 ns/op
// BenchmarkFibonacciSizes/n=20-8       30000 38965 ns/op
// BenchmarkFibonacciSizes/n=25-8        3000 432000 ns/op
```

### Multi-dimensional Parameterization

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
                    // Prepare data
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
    // "sorted" keeps original order
    }
    return data
}
```

### Parallel Sub-benchmarks

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

## Memory Allocation Analysis

Memory allocation is an important factor affecting Go program performance. Benchmarking provides detailed memory allocation statistics.

### Enabling Memory Analysis

There are two ways to enable memory allocation reporting:

```go
// Method 1: Call b.ReportAllocs() in code
func BenchmarkWithAllocs(b *testing.B) {
    b.ReportAllocs() // Report memory allocations

    for i := 0; i < b.N; i++ {
        _ = make([]byte, 1024)
    }
}
```

```bash
# Method 2: Use command line argument
go test -bench=. -benchmem
```

### String Concatenation Performance Comparison

This is a classic memory analysis case:

```go
package stringbench

import (
    "bytes"
    "strings"
    "testing"
)

// Using + operator
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

// Using strings.Builder (recommended)
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

// Using bytes.Buffer
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

// Pre-allocated strings.Builder
func BenchmarkStringBuilderPrealloc(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var builder strings.Builder
        builder.Grow(100) // Pre-allocate capacity
        for j := 0; j < 100; j++ {
            builder.WriteString("a")
        }
        _ = builder.String()
    }
}

// Using strings.Join
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

Typical output:

```
BenchmarkStringConcatPlus-8          5000   234567 ns/op   53000 B/op   99 allocs/op
BenchmarkStringBuilder-8           500000     3456 ns/op     512 B/op    4 allocs/op
BenchmarkBytesBuffer-8             300000     4567 ns/op     640 B/op    5 allocs/op
BenchmarkStringBuilderPrealloc-8   800000     2345 ns/op     224 B/op    2 allocs/op
BenchmarkStringsJoin-8            1000000     1234 ns/op     112 B/op    1 allocs/op
```

### Setting Bytes Processed

Use `b.SetBytes()` to calculate throughput:

```go
func BenchmarkIOThroughput(b *testing.B) {
    data := make([]byte, 1024*1024) // 1MB
    rand.Read(data)

    b.SetBytes(int64(len(data))) // 1MB processed per operation
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        // Simulate processing data
        for j := range data {
            data[j] = data[j] ^ 0xFF
        }
    }
}

// Output will include throughput:
// BenchmarkIOThroughput-8    1000    1234567 ns/op    850.00 MB/s
```

### Custom Metrics

Go 1.13+ supports reporting custom metrics:

```go
func BenchmarkWithCustomMetrics(b *testing.B) {
    var totalItems int64
    var totalErrors int64

    for i := 0; i < b.N; i++ {
        items, errors := processWorkload()
        totalItems += int64(items)
        totalErrors += int64(errors)
    }

    // Report custom metrics
    b.ReportMetric(float64(totalItems)/float64(b.N), "items/op")
    b.ReportMetric(float64(totalErrors)/float64(b.N), "errors/op")
    b.ReportMetric(float64(totalItems)/b.Elapsed().Seconds(), "items/s")
}
```

## Benchmark Comparison

The key to performance optimization is being able to accurately compare results before and after optimization.

### Using the benchstat Tool

`benchstat` is the officially recommended benchmark result analysis tool:

```bash
# Install benchstat
go install golang.org/x/perf/cmd/benchstat@latest

# Run benchmarks and save results (before optimization)
go test -bench=. -count=10 > old.txt

# Run again after code changes
go test -bench=. -count=10 > new.txt

# Compare results
benchstat old.txt new.txt
```

Example output:

```
name           old time/op    new time/op    delta
Process-8        45.2ms ± 3%    32.1ms ± 2%   -29.0%  (p=0.000 n=10+10)
Transform-8      12.3ms ± 4%    11.8ms ± 3%    -4.1%  (p=0.023 n=10+10)
Validate-8       2.34ms ± 2%    2.31ms ± 2%     ~     (p=0.156 n=10+10)

name           old alloc/op   new alloc/op   delta
Process-8        1.23MB ± 0%    0.92MB ± 0%   -25.2%  (p=0.000 n=10+10)
Transform-8       256KB ± 0%     256KB ± 0%     ~     (all equal)
```

Field descriptions:

| Field | Description |
|-------|-------------|
| `+/- 3%` | Coefficient of variation |
| `delta` | Performance change percentage |
| `p=0.000` | Statistical significance (p < 0.05 indicates significant) |
| `n=10+10` | Number of valid samples |
| `~` | Change not significant |

### Importance of Multiple Runs

Single run results may be affected by system state, multiple runs are recommended:

```bash
# Run at least 5-10 times
go test -bench=. -count=10

# For high-variance tests, run more times
go test -bench=. -count=20
```

### Comparing Different Implementations

```go
// Before optimization
func processDataNaive(data []int) int {
    sum := 0
    for i := 0; i < len(data); i++ {
        sum += data[i]
    }
    return sum
}

// After optimization: using range
func processDataRange(data []int) int {
    sum := 0
    for _, v := range data {
        sum += v
    }
    return sum
}

// After optimization: loop unrolling
func processDataUnrolled(data []int) int {
    sum := 0
    n := len(data)
    i := 0

    // Process 4 elements at a time
    for ; i <= n-4; i += 4 {
        sum += data[i] + data[i+1] + data[i+2] + data[i+3]
    }

    // Process remaining elements
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

## Performance Profiling Integration

Benchmarks can seamlessly integrate with Go's profiling tools (pprof).

### Generating CPU Profile

```bash
# Run benchmark and generate CPU profile
go test -bench=BenchmarkProcess -cpuprofile=cpu.prof

# Analyze profile
go tool pprof cpu.prof

# Or use web interface
go tool pprof -http=:8080 cpu.prof
```

### Generating Memory Profile

```bash
# Generate memory profile
go test -bench=BenchmarkProcess -memprofile=mem.prof

# Analyze memory allocations
go tool pprof mem.prof

# View allocation hotspots
go tool pprof -alloc_space mem.prof
go tool pprof -inuse_space mem.prof
```

### Generating Multiple Profiles Simultaneously

```bash
go test -bench=. -cpuprofile=cpu.prof -memprofile=mem.prof -blockprofile=block.prof
```

### Integrating pprof in Code

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

### Interactive Analysis Commands

```bash
# Enter interactive mode
go tool pprof cpu.prof

# Common commands
(pprof) top           # Show most resource-consuming functions
(pprof) top10         # Show top 10
(pprof) top -cum      # Sort by cumulative value
(pprof) list funcName # Show line-by-line analysis of function
(pprof) web           # Open call graph in browser
(pprof) svg           # Generate SVG format call graph
(pprof) flamegraph    # Generate flame graph
```

## Advanced Techniques and Best Practices

### Parallel Benchmarking

Testing code performance in concurrent scenarios:

```go
func BenchmarkMapConcurrent(b *testing.B) {
    m := sync.Map{}

    // Pre-populate data
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

// Compare with mutex-protected regular map performance
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

### Controlling Parallelism

```go
func BenchmarkWithParallelism(b *testing.B) {
    // GOMAXPROCS * 100 goroutines
    b.SetParallelism(100)

    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            operation()
        }
    })
}
```

Testing with different CPU core counts:

```bash
go test -bench=BenchmarkParallel -cpu=1,2,4,8,16
```

### Stable Testing Environment

To obtain reliable benchmark results:

1. **Close unnecessary background programs**
2. **Avoid testing on laptop battery mode**
3. **Disable CPU frequency scaling** (if possible)
4. **Run multiple times for average**
5. **Use dedicated test machines**

```bash
# Disable CPU frequency scaling on Linux
sudo cpupower frequency-set -g performance

# Or set fixed frequency
sudo cpupower frequency-set -f 3.5GHz
```

### Avoiding Test Data Affecting Results

```go
// Problem: Ordered data may cause sorting to be faster than expected
func BenchmarkSortOrdered(b *testing.B) {
    data := make([]int, 10000)
    for i := range data {
        data[i] = i // Already sorted!
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        sort.Ints(data) // Almost no work needed
    }
}

// Correct: Use random data each time
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

// Better: Pre-generate data, copy each time
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

### Handling CPU Cache Effects

Different data sizes trigger different levels of CPU cache:

```go
func BenchmarkCacheEffect(b *testing.B) {
    sizes := []struct {
        name string
        size int
    }{
        {"L1-fit", 1 << 14},      // 16KB - fits in L1 cache
        {"L1-exceed", 1 << 16},   // 64KB - exceeds L1
        {"L2-fit", 1 << 18},      // 256KB - fits in L2 cache
        {"L2-exceed", 1 << 21},   // 2MB - exceeds L2
        {"L3-exceed", 1 << 24},   // 16MB - exceeds L3
        {"RAM", 1 << 27},         // 128MB - main memory
    }

    for _, tc := range sizes {
        b.Run(tc.name, func(b *testing.B) {
            data := make([]byte, tc.size)
            b.SetBytes(int64(tc.size))
            b.ResetTimer()

            for i := 0; i < b.N; i++ {
                // Sequential access
                for j := 0; j < len(data); j++ {
                    data[j]++
                }
            }
        })
    }
}
```

## Practical Examples

### Example 1: JSON Serialization Performance Comparison

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
        Name:      "John Doe",
        Email:     "johndoe@example.com",
        CreatedAt: time.Now(),
        Tags:      []string{"developer", "golang", "backend"},
        Settings: Settings{
            Theme:    "dark",
            Language: "en-US",
            Timezone: "America/New_York",
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

### Example 2: HTTP Handler Performance Testing

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

### Example 3: Algorithm Optimization Verification

```go
package algobench

import (
    "testing"
)

// Naive recursive implementation
func fibNaive(n int) int {
    if n <= 1 {
        return n
    }
    return fibNaive(n-1) + fibNaive(n-2)
}

// Dynamic programming implementation
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

// Memoized recursion
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

// Matrix exponentiation implementation
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
    result := [2][2]int{{1, 0}, {0, 1}} // Identity matrix

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
        // Only test naive algorithm for small sizes
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

### Example 4: Object Pool Performance

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
            // Use buffer
            for j := range buf.data {
                buf.data[j] = byte(j)
            }
        }
    })

    b.Run("SyncPool", func(b *testing.B) {
        b.ReportAllocs()
        for i := 0; i < b.N; i++ {
            buf := bufferPool.Get().(*Buffer)
            // Use buffer
            for j := range buf.data {
                buf.data[j] = byte(j)
            }
            // Reset and return
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

## Common Pitfalls and Solutions

### Pitfall 1: Forgetting to Loop b.N Times

```go
// Wrong
func BenchmarkWrong(b *testing.B) {
    operation() // Only executes once!
}

// Correct
func BenchmarkCorrect(b *testing.B) {
    for i := 0; i < b.N; i++ {
        operation()
    }
}
```

### Pitfall 2: Allocating Large Amounts of Memory Inside the Loop

```go
// May cause GC interference with test results
func BenchmarkGCInterference(b *testing.B) {
    for i := 0; i < b.N; i++ {
        data := make([]byte, 10*1024*1024) // Allocate 10MB each time
        process(data)
    }
}

// Improvement: Reuse memory
func BenchmarkReuse(b *testing.B) {
    data := make([]byte, 10*1024*1024)
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        // Clear and reuse
        for j := range data {
            data[j] = 0
        }
        process(data)
    }
}
```

### Pitfall 3: Improper Timer Control

```go
// Wrong: Calling StopTimer/StartTimer outside the loop
func BenchmarkWrongTimer(b *testing.B) {
    b.StopTimer() // Wrong position
    for i := 0; i < b.N; i++ {
        operation()
    }
    b.StartTimer() // Wrong position
}

// Correct
func BenchmarkCorrectTimer(b *testing.B) {
    setup()
    b.ResetTimer() // Reset after setup completes

    for i := 0; i < b.N; i++ {
        operation()
    }
}
```

### Pitfall 4: Data Races in Parallel Tests

```go
// Wrong: Shared mutable state
func BenchmarkRace(b *testing.B) {
    counter := 0
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            counter++ // Data race!
        }
    })
}

// Correct: Use atomic operations
func BenchmarkNoRace(b *testing.B) {
    var counter int64
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            atomic.AddInt64(&counter, 1)
        }
    })
}
```

Use `-race` to detect races:

```bash
go test -bench=. -race
```

### Pitfall 5: Ignoring Compiler Optimization

```go
// Compiler may completely optimize away computations without side effects
func BenchmarkOptimizedAway(b *testing.B) {
    for i := 0; i < b.N; i++ {
        _ = fibonacci(10) // Result discarded, may be optimized
    }
}

// Solution: Use global variable to store result
var sink int

func BenchmarkNotOptimized(b *testing.B) {
    var r int
    for i := 0; i < b.N; i++ {
        r = fibonacci(10)
    }
    sink = r
}
```

### Pitfall 6: Benchmark Duration Too Short

```go
// For extremely fast operations, batch execution can help
func BenchmarkTinyOperation(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Batch execute for more stable results
        for j := 0; j < 1000; j++ {
            tinyOperation()
        }
    }
    // Note: Actual ns/op needs to be divided by 1000
}
```

Or increase benchmark duration:

```bash
go test -bench=. -benchtime=10s
```

## Interview Key Points Summary

### Basic Concepts

**Q: What is the function signature for Go benchmarks?**

```go
func BenchmarkXxx(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Code being tested
    }
}
```

**Q: What is b.N? How is its value determined?**

A: `b.N` is the iteration count, dynamically adjusted by the Go runtime. The framework gradually increases N until the test runtime reaches `benchtime` (default 1 second).

### Timer Control

| Method | Purpose | Use Case |
|--------|---------|----------|
| `ResetTimer()` | Reset timer | After setup completes |
| `StopTimer()` | Pause timing | Per-iteration preparation |
| `StartTimer()` | Resume timing | After preparation completes |

### Key Commands

```bash
go test -bench=.                  # Run all benchmarks
go test -bench=. -benchmem        # Show memory allocations
go test -bench=. -count=10        # Run 10 times
go test -bench=. -cpuprofile=cpu.prof  # Generate CPU profile
```

### Common Pitfalls

1. Forgetting to use `b.N` loop
2. Compiler optimizing away tested code
3. Allocating large amounts of memory inside the loop
4. Test data not representative
5. Data races in parallel tests

## Further Reading

### Official Documentation

- [Go testing package documentation](https://pkg.go.dev/testing)
- [Go command documentation - test](https://pkg.go.dev/cmd/go#hdr-Testing_flags)

### Tools

- [benchstat](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat) - Benchmark result analysis tool
- [go tool pprof](https://go.dev/blog/pprof) - Performance profiling tool

### Related Topics

- pprof CPU and memory profiling
- trace tool
- Race detection (`-race`)
- Escape analysis (`-gcflags="-m"`)

## Summary

Go's benchmarking framework is simple yet powerful:

| Feature | Description |
|---------|-------------|
| `b.N` | Auto-adjusted iteration count |
| `b.Run()` | Sub-benchmarks, supports parameterization |
| `b.ReportAllocs()` | Memory allocation statistics |
| `b.SetBytes()` | Throughput calculation |
| `b.RunParallel()` | Parallel testing |
| `b.ResetTimer()` | Timer control |
| `b.ReportMetric()` | Custom metrics |

With these concepts, you can:

1. **Write effective benchmarks**: Correctly use b.N and timer control
2. **Analyze performance data**: Understand ns/op, B/op, allocs/op meanings
3. **Compare optimization effects**: Use benchstat for scientific comparison
4. **Locate performance bottlenecks**: Combine with pprof for in-depth analysis
5. **Avoid common pitfalls**: Compiler optimization, data races, and other issues

Performance optimization is an ongoing process, and benchmarking is an indispensable tool in this process. Through systematic measurement and analysis, you can make data-driven optimization decisions rather than guessing based on intuition.
