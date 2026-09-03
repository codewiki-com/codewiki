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
origin: old/src/content/docs/go/benchmark.en.md
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

## Concept Explanation

Benchmark Testing is a systematic method for measuring code performance, used to evaluate the execution speed, memory allocation, and resource consumption of functions or code segments. In Go, benchmark testing is one of the core features of the `testing` package, equally important as unit testing.

### What is Benchmark Testing

Benchmark testing collects statistical data by repeatedly executing target code multiple times to derive reliable performance metrics. Unlike unit testing which focuses on "whether the code is correct," benchmark testing focuses on "how fast the code runs and how many resources it consumes."

### Why Benchmark Testing is Needed

1. **Performance Verification**: Verify whether optimizations are actually effective
2. **Regression Detection**: Discover performance degradation issues
3. **Solution Comparison**: Compare performance differences between different implementations
4. **Bottleneck Identification**: Locate performance hotspots in conjunction with profiling
5. **Capacity Planning**: Provide data support for system capacity planning

### Historical Background

Go has had built-in benchmark testing support since version 1.0, reflecting Go's emphasis on performance. With version iterations, benchmark testing functionality has been continuously enhanced:

- Go 1.0: Basic benchmark testing support
- Go 1.3: Added `b.ReportAllocs()`
- Go 1.5: Added `b.Run()` sub-benchmarks
- Go 1.7: Improved parallel benchmarks
- Go 1.18+: Integration of fuzz testing with benchmark testing

## Core Principles

### testing.B Struct

`testing.B` is the core type for benchmark testing, controlling the execution flow and collecting performance data:

```go
// Key fields of testing.B (simplified version)
type B struct {
    N int // Number of iterations, dynamically adjusted by the framework

    // Internal fields
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

### Automatic Adjustment Mechanism of b.N

`b.N` is the core of benchmark testing, representing the number of loop iterations. The Go runtime automatically adjusts the value of `b.N` to make the benchmark run long enough to obtain accurate measurement results:

```
1. Initial N = 1
2. Run benchmark, measure total time
3. If time < benchtime (default 1 second):
   - Estimate new N value based on measured performance
   - New N is usually 2-10 times the previous value
   - Repeat step 2
4. If time >= benchtime:
   - Calculate final results
   - Report ns/op, B/op, allocs/op
```

```go
// Example of automatic N adjustment
func BenchmarkAutoN(b *testing.B) {
    // The framework will call this function multiple times with different b.N values:
    // 1st time: N = 1
    // 2nd time: N = 100
    // 3rd time: N = 10000
    // 4th time: N = 1000000
    // ...until runtime >= 1 second

    for i := 0; i < b.N; i++ {
        // Code being tested
        _ = fmt.Sprintf("hello %d", i)
    }
}
```

### Timer Control Principle

The benchmark testing framework internally maintains a timer for accurately measuring the execution time of the code being tested:

```go
// Timer state machine
//
// Initial state: timerOn = true (automatically started when test begins)
//
// b.StopTimer()  -> timerOn = false (pause timing)
// b.StartTimer() -> timerOn = true (resume timing)
// b.ResetTimer() -> reset all counters, timerOn = true
```

```go
func BenchmarkTimerControl(b *testing.B) {
    // 1. Test starts, timer automatically starts

    // 2. Pause timer, perform preparation work
    b.StopTimer()
    data := prepareTestData() // This time is not counted
    b.StartTimer()

    // 3. Or use ResetTimer to reset
    // b.ResetTimer() // Reset all counts, restart timing

    for i := 0; i < b.N; i++ {
        processData(data)
    }
}
```

### Memory Allocation Statistics Principle

When memory allocation statistics are enabled, the framework records memory allocation before and after the test:

```go
// Memory statistics process
//
// 1. Record before test: startAllocs, startBytes
// 2. Execute b.N iterations
// 3. Record after test: endAllocs, endBytes
// 4. Calculate:
//    - netAllocs = endAllocs - startAllocs
//    - netBytes = endBytes - startBytes
//    - allocs/op = netAllocs / N
//    - B/op = netBytes / N
```

## Key Points

### Benchmark Function Signature

```go
// Benchmark functions must start with Benchmark
// Parameter must be *testing.B
// No return value
func BenchmarkXxx(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Code being tested
    }
}
```

### Core Methods of testing.B

| Method | Description | Use Case |
|--------|-------------|----------|
| `b.N` | Number of iterations | Must be used in the loop |
| `b.ResetTimer()` | Reset timer | Reset after setup |
| `b.StopTimer()` | Pause timer | Preparation work for each iteration |
| `b.StartTimer()` | Resume timer | Resume timing |
| `b.ReportAllocs()` | Report memory allocations | Analyze memory usage |
| `b.SetBytes(n)` | Set bytes processed | Calculate throughput |
| `b.Run(name, f)` | Sub-benchmark | Parameterized testing |
| `b.RunParallel(f)` | Parallel benchmark | Test concurrent performance |
| `b.SetParallelism(p)` | Set parallelism | Control goroutine count |
| `b.ReportMetric(n, unit)` | Report custom metrics | Custom measurements |

### Run Commands

```bash
# Basic execution
go test -bench=.                    # Run all benchmarks
go test -bench=BenchmarkXxx         # Run specific test
go test -bench="Benchmark.*Add"     # Regex matching

# Memory analysis
go test -bench=. -benchmem          # Show memory allocations

# Run control
go test -bench=. -benchtime=5s      # Set run time
go test -bench=. -benchtime=1000x   # Set fixed iteration count
go test -bench=. -count=5           # Run 5 times for average
go test -bench=. -cpu=1,2,4,8       # Test with different CPU core counts

# Output control
go test -bench=. -v                 # Verbose output
go test -bench=. -benchmem -json    # JSON format output
```

### Output Format Interpretation

```
BenchmarkAdd-8     1000000000    0.25 ns/op    0 B/op    0 allocs/op
     ^         ^        ^            ^            ^           ^
     |         |        |            |            |           |
   Name    CPU cores  Iterations  Time per op  Memory per op  Allocs per op
```

## Code Examples

### Basic Benchmark Test

```go
package benchmark

import (
    "testing"
)

// Functions being tested
func Add(a, b int) int {
    return a + b
}

func Multiply(a, b int) int {
    return a * b
}

// Basic benchmark tests
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

### Preventing Compiler Optimization

The compiler may optimize away code without side effects, causing inaccurate test results:

```go
// Wrong example: result may be optimized away
func BenchmarkAddWrong(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(1, 2) // Compiler may completely optimize this away
    }
}

// Correct example: use global variable or sink
var result int

func BenchmarkAddCorrect(b *testing.B) {
    var r int
    for i := 0; i < b.N; i++ {
        r = Add(1, 2)
    }
    result = r // Prevent compiler optimization
}

// Another approach: use runtime.KeepAlive
func BenchmarkAddWithKeepAlive(b *testing.B) {
    for i := 0; i < b.N; i++ {
        r := Add(1, 2)
        runtime.KeepAlive(r)
    }
}
```

### Benchmark Test with Setup

```go
func BenchmarkWithSetup(b *testing.B) {
    // Preparation work (not counted in test time)
    data := make([]int, 10000)
    for i := range data {
        data[i] = i
    }

    // Reset timer, exclude preparation time
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        // Code being tested
        sum := 0
        for _, v := range data {
            sum += v
        }
    }
}

// When each iteration needs preparation
func BenchmarkWithIterationSetup(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Pause timer
        b.StopTimer()
        data := generateTestData() // Not counted in test time
        b.StartTimer()

        // Code being tested
        processData(data)
    }
}
```

### Memory Allocation Benchmark Test

```go
// Compare performance of different string concatenation methods
func BenchmarkStringConcatPlus(b *testing.B) {
    b.ReportAllocs() // Report memory allocations

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

// Example output:
// BenchmarkStringConcatPlus-8       5000   234567 ns/op   53000 B/op   99 allocs/op
// BenchmarkStringConcatBuilder-8  500000     3456 ns/op     512 B/op    4 allocs/op
// BenchmarkStringConcatBuffer-8   300000     4567 ns/op     640 B/op    5 allocs/op
// BenchmarkStringConcatJoin-8    1000000     1234 ns/op     112 B/op    1 allocs/op
```

### Sub-benchmarks

```go
func BenchmarkSort(b *testing.B) {
    // Test sorting performance with different input sizes
    sizes := []int{10, 100, 1000, 10000}

    for _, size := range sizes {
        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            // Prepare data
            data := make([]int, size)
            for i := range data {
                data[i] = rand.Intn(size)
            }

            b.ResetTimer()
            for i := 0; i < b.N; i++ {
                // Need a new copy of data each time
                b.StopTimer()
                dataCopy := make([]int, len(data))
                copy(dataCopy, data)
                b.StartTimer()

                sort.Ints(dataCopy)
            }
        })
    }
}

// Multi-dimensional parameterized testing
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
                b.SetBytes(int64(size)) // Set throughput calculation base

                for i := 0; i < b.N; i++ {
                    hasher.Reset()
                    hasher.Write(data)
                    hasher.Sum(nil)
                }
            })
        }
    }
}

// Run specific sub-tests
// go test -bench="BenchmarkSort/size=1000"
// go test -bench="BenchmarkHashFunction/sha256"
```

### Parallel Benchmark Test

```go
// Test concurrent-safe data structure
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

// Compare concurrent performance of regular map (with lock) and sync.Map
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

// Control parallelism
func BenchmarkWithParallelism(b *testing.B) {
    b.SetParallelism(100) // GOMAXPROCS * 100 goroutines

    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            // Code executed concurrently
            time.Sleep(time.Microsecond)
        }
    })
}

// Test with different CPU core counts
// go test -bench=BenchmarkMapConcurrent -cpu=1,2,4,8,16
```

### Throughput Testing

```go
// Test I/O throughput
func BenchmarkIOThroughput(b *testing.B) {
    data := make([]byte, 1024*1024) // 1MB
    rand.Read(data)

    tmpFile, _ := os.CreateTemp("", "bench-*")
    defer os.Remove(tmpFile.Name())
    defer tmpFile.Close()

    b.SetBytes(int64(len(data))) // Set bytes processed per operation
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        tmpFile.Seek(0, 0)
        tmpFile.Write(data)
        tmpFile.Sync()
    }
    // Output will include MB/s throughput metric
}

// Network throughput testing
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

### Custom Metrics Reporting

```go
func BenchmarkWithCustomMetrics(b *testing.B) {
    var totalItems int64
    var totalErrors int64

    for i := 0; i < b.N; i++ {
        items, errors := processWorkload()
        atomic.AddInt64(&totalItems, int64(items))
        atomic.AddInt64(&totalErrors, int64(errors))
    }

    // Report custom metrics
    b.ReportMetric(float64(totalItems)/float64(b.N), "items/op")
    b.ReportMetric(float64(totalErrors)/float64(b.N), "errors/op")
    b.ReportMetric(float64(totalItems)/b.Elapsed().Seconds(), "items/s")
}
```

### Algorithm Comparison Testing

```go
// Compare different sorting algorithms
func BenchmarkSortAlgorithms(b *testing.B) {
    sizes := []int{100, 1000, 10000}

    for _, size := range sizes {
        // Prepare test data
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

## Best Practices

### Loop Must Use b.N

```go
// Correct
func BenchmarkCorrect(b *testing.B) {
    for i := 0; i < b.N; i++ {
        operation()
    }
}

// Wrong: fixed loop count
func BenchmarkWrong(b *testing.B) {
    for i := 0; i < 1000; i++ { // Wrong!
        operation()
    }
}
```

### Use Timer Control Properly

```go
func BenchmarkProperTimerUsage(b *testing.B) {
    // Case 1: One-time preparation - use ResetTimer
    expensiveSetup()
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        operation()
    }
}

func BenchmarkIterationSetup(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Case 2: Preparation needed for each iteration - use Stop/Start
        b.StopTimer()
        data := prepareData()
        b.StartTimer()

        process(data)
    }
}
```

### Avoid Compiler Optimization Pitfalls

```go
var globalResult interface{}

func BenchmarkAvoidOptimization(b *testing.B) {
    var result int
    for i := 0; i < b.N; i++ {
        result = expensiveComputation()
    }
    globalResult = result // Ensure result is used
}
```

### Use Sub-benchmarks to Organize Code

```go
func BenchmarkOrganized(b *testing.B) {
    // Use sub-tests for better readability and maintainability
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

### Enable Memory Allocation Reporting

```go
func BenchmarkWithAllocs(b *testing.B) {
    b.ReportAllocs() // Always report memory allocations

    for i := 0; i < b.N; i++ {
        operation()
    }
}
```

### Run Multiple Times for Stable Values

```bash
# Run multiple times for average, reduce noise
go test -bench=. -count=10
```

### Test in a Stable Environment

- Close unnecessary background programs
- Avoid testing on laptop battery mode
- Consider the impact of CPU frequency scaling
- Run multiple times, exclude outliers

## Common Pitfalls

### Forgetting to Loop b.N Times

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

### Allocating Large Amounts of Memory Inside the Loop

```go
// May cause GC to interfere with test results
func BenchmarkGCInterference(b *testing.B) {
    for i := 0; i < b.N; i++ {
        data := make([]byte, 10*1024*1024) // Allocate 10MB each time
        process(data)
    }
}

// Improved: reuse memory
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

### Improper Timer Control

```go
// Wrong: calling StopTimer/StartTimer outside the loop
func BenchmarkWrongTimer(b *testing.B) {
    b.StopTimer() // Wrong here
    for i := 0; i < b.N; i++ {
        operation()
    }
    b.StartTimer() // Wrong here too
}

// Correct
func BenchmarkCorrectTimer(b *testing.B) {
    setup()
    b.ResetTimer() // Reset after preparation is complete

    for i := 0; i < b.N; i++ {
        operation()
    }
}
```

### Data Race in Parallel Tests

```go
// Wrong: shared mutable state
func BenchmarkRace(b *testing.B) {
    counter := 0
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            counter++ // Data race!
        }
    })
}

// Correct: use atomic operations or local variables
func BenchmarkNoRace(b *testing.B) {
    var counter int64
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            atomic.AddInt64(&counter, 1)
        }
    })
}
```

### Test Data Affecting Results

```go
// Problem: sorted data may cause sorting to be faster than expected
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

// Correct: use random data
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

### Ignoring Compiler Optimization

```go
// Compiler may completely optimize away computations without side effects
func BenchmarkOptimizedAway(b *testing.B) {
    for i := 0; i < b.N; i++ {
        _ = fibonacci(10) // Result is discarded, may be optimized away
    }
}

// Solution
var sink int

func BenchmarkNotOptimized(b *testing.B) {
    var result int
    for i := 0; i < b.N; i++ {
        result = fibonacci(10)
    }
    sink = result
}
```

## Performance Considerations

### Overhead of Benchmark Testing Itself

The benchmark testing framework itself has a small amount of overhead, which may affect results for extremely fast operations (< 1ns):

```go
// For very fast operations, execute in batches
func BenchmarkTinyOperation(b *testing.B) {
    for i := 0; i < b.N; i++ {
        for j := 0; j < 100; j++ {
            tinyOperation()
        }
    }
    // Actual ns/op needs to be divided by 100
}
```

### Impact of Memory Allocation

Frequent memory allocation will trigger GC, affecting test stability:

```bash
# View GC impact on testing
GODEBUG=gctrace=1 go test -bench=.
```

### CPU Cache Effects

Small datasets may fit entirely in CPU cache, causing test results to be better than actual scenarios:

```go
// Test different data sizes to observe cache effects
func BenchmarkCacheEffect(b *testing.B) {
    sizes := []int{
        1 << 10,  // 1KB - L1 cache
        1 << 15,  // 32KB - L1 cache boundary
        1 << 18,  // 256KB - L2 cache
        1 << 22,  // 4MB - L3 cache boundary
        1 << 26,  // 64MB - Main memory
    }

    for _, size := range sizes {
        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            data := make([]byte, size)
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

### Scalability of Concurrent Benchmarks

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

## Real-World Scenarios

### Scenario 1: JSON Serialization Performance Comparison

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
        Name:      "John Doe",
        Email:     "johndoe@example.com",
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
            _, _ = user.MarshalJSON() // Requires generated code
        }
    })
}
```

### Scenario 2: Database Query Optimization

```go
func BenchmarkDatabaseQuery(b *testing.B) {
    db := setupTestDB()
    defer db.Close()

    // Pre-populate data
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

### Scenario 3: HTTP Service Performance Testing

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

    // Parallel testing
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

### Scenario 4: Algorithm Optimization Before and After Comparison

```go
// Before optimization: naive implementation
func fibonacciNaive(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacciNaive(n-1) + fibonacciNaive(n-2)
}

// After optimization: dynamic programming
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

// After optimization: matrix exponentiation
func fibonacciMatrix(n int) int {
    if n <= 1 {
        return n
    }
    // Matrix exponentiation implementation...
    return matrixPower(n)
}

func BenchmarkFibonacci(b *testing.B) {
    ns := []int{10, 20, 30, 40}

    for _, n := range ns {
        if n <= 30 { // Naive algorithm too slow for large n
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

### Scenario 5: Using benchstat for Result Analysis

```bash
# Install benchstat
go install golang.org/x/perf/cmd/benchstat@latest

# Run benchmark tests and save results
go test -bench=. -count=10 > old.txt

# Run again after modifying code
go test -bench=. -count=10 > new.txt

# Compare results
benchstat old.txt new.txt
```

Example output:
```
name           old time/op    new time/op    delta
Process-8      45.2ms +- 3%    32.1ms +- 2%   -29.0%  (p=0.000 n=10+10)
Transform-8    12.3ms +- 4%    11.8ms +- 3%    -4.1%  (p=0.023 n=10+10)

name           old alloc/op   new alloc/op   delta
Process-8      1.23MB +- 0%    0.92MB +- 0%   -25.2%  (p=0.000 n=10+10)
```

## Interview Key Points

### Basic Concepts

**Q: What is the function signature for Go benchmark tests?**

A: Benchmark functions must start with `Benchmark`, accept a `*testing.B` parameter, and have no return value:
```go
func BenchmarkXxx(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Code being tested
    }
}
```

**Q: What is b.N? How is its value determined?**

A: `b.N` is the number of iterations for the benchmark test, dynamically adjusted by the Go runtime. The framework gradually increases the value of N (1 -> 100 -> 10000 -> ...) until the test runtime reaches `benchtime` (default 1 second) to obtain statistically meaningful results.

### Timer Control

**Q: What are the differences between ResetTimer, StopTimer, and StartTimer, and their use cases?**

| Method | Effect | Use Case |
|--------|--------|----------|
| `ResetTimer()` | Reset all counters | After preparation work is complete |
| `StopTimer()` | Pause timing | Preparation for each iteration |
| `StartTimer()` | Resume timing | Resume after preparation |

```go
func BenchmarkExample(b *testing.B) {
    // One-time preparation
    setup()
    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        // Per-iteration preparation
        b.StopTimer()
        data := prepare()
        b.StartTimer()

        process(data)
    }
}
```

### Memory Analysis

**Q: How do you analyze memory allocation in benchmark tests?**

A: Use `b.ReportAllocs()` or the `-benchmem` flag:

```go
func BenchmarkMemory(b *testing.B) {
    b.ReportAllocs()
    for i := 0; i < b.N; i++ {
        _ = make([]byte, 1024)
    }
}
// go test -bench=. -benchmem
// Output: BenchmarkMemory-8  1000000  1024 B/op  1 allocs/op
```

### Parallel Testing

**Q: How do you write parallel benchmark tests?**

```go
func BenchmarkParallel(b *testing.B) {
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            operation()
        }
    })
}
```

**Q: What is the difference between b.RunParallel and a regular loop?**

A: `b.RunParallel` starts `GOMAXPROCS` goroutines to execute tests concurrently, used to evaluate code performance in concurrent scenarios. `pb.Next()` automatically distributes work to each goroutine.

### Sub-benchmarks

**Q: Why use sub-benchmarks?**

A: Sub-benchmarks provide:
- Better test organization
- Support for parameterized testing
- Selective execution (`-bench="Parent/Child"`)
- Independent timing and memory statistics

### Common Pitfalls

**Q: What are common mistakes when writing benchmark tests?**

1. Forgetting to use the `b.N` loop
2. Compiler optimizing away the code being tested
3. Large memory allocations inside the loop
4. Test data not being representative
5. Data races in parallel tests

### Result Analysis

**Q: How do you compare results from two benchmark tests?**

A: Use the `benchstat` tool:
```bash
go test -bench=. -count=10 > old.txt
# Modify code
go test -bench=. -count=10 > new.txt
benchstat old.txt new.txt
```

## Further Reading

### Official Documentation

- [Go testing Package Documentation](https://pkg.go.dev/testing)
- [Go Command Documentation - test](https://pkg.go.dev/cmd/go#hdr-Testing_flags)
- [Go Wiki: TableDrivenTests](https://github.com/golang/go/wiki/TableDrivenTests)

### Tools

- [benchstat](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat) - Benchmark result analysis tool
- [benchcmp](https://pkg.go.dev/golang.org/x/tools/cmd/benchcmp) - Benchmark comparison tool (deprecated, benchstat recommended)
- [go-torch](https://github.com/uber-archive/go-torch) - Flame graph generation tool

### Advanced Reading

- [High Performance Go Workshop](https://dave.cheney.net/high-performance-go-workshop/dotgo-paris.html) - Dave Cheney
- [Profiling Go Programs](https://go.dev/blog/pprof) - Go Official Blog
- [Go Performance Optimization](https://golang.org/doc/diagnostics.html) - Go Official Diagnostics Documentation

### Related Topics

- pprof CPU and Memory Profiling
- trace Tool
- Race Detection (`-race`)
- Escape Analysis (`-gcflags="-m"`)
