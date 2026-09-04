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
origin: old/src/content/docs/go/trace.en.md
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

The Go Execution Tracer is a powerful diagnostic tool provided by the Go runtime that captures various events occurring during program execution, including goroutine creation, blocking, waking, system calls, GC activity, and processor scheduling. Unlike pprof sampling analysis, the execution tracer records a precise timeline of events, helping developers fully understand program concurrency behavior and latency sources.

## Concept Explanation

### What is the Execution Tracer

The Execution Tracer is functionality provided by Go's standard library `runtime/trace` package. It records various events during program execution by inserting trace points at key locations in the Go runtime. These events are collected into a binary format trace file, which can then be visualized and analyzed using the `go tool trace` tool.

### Differences from pprof

| Feature | pprof | trace |
|---------|-------|-------|
| Data Collection Method | Sampling | Event-based |
| Time Precision | Statistical approximation | Precise timestamps |
| Analysis Dimension | Resource consumption hotspots | Event timeline |
| Performance Overhead | Lower | Higher |
| Use Cases | CPU/memory hotspot identification | Latency analysis, scheduling issues |
| Output Format | Profile data | Event stream |

### Problems the Execution Tracer Can Solve

1. **Latency Analysis**: Why is a request slow? Where is time being spent?
2. **Scheduling Issues**: Why isn't a goroutine being scheduled promptly?
3. **Blocking Analysis**: What is a goroutine waiting for?
4. **Parallelism Analysis**: Is the program fully utilizing multiple cores?
5. **GC Impact**: How much does GC affect program latency?
6. **System Calls**: Which system calls are causing blocking?

## Core Principles

### Trace Event Types

The Go runtime records trace events at the following key points:

```
1. Goroutine Events
   - GoCreate: goroutine creation
   - GoStart: goroutine starts executing
   - GoEnd: goroutine ends
   - GoStop: goroutine stops (yields processor)
   - GoBlock: goroutine blocks
   - GoUnblock: goroutine unblocks
   - GoSched: goroutine voluntarily yields
   - GoPreempt: goroutine is preempted
   - GoSleep: goroutine sleeps
   - GoWaiting: goroutine is waiting

2. Processor (P) Events
   - ProcStart: processor starts running
   - ProcStop: processor stops

3. GC Events
   - GCStart: GC starts
   - GCDone: GC ends
   - GCSTWStart: Stop-The-World starts
   - GCSTWDone: Stop-The-World ends
   - GCSweepStart: sweep starts
   - GCSweepDone: sweep ends

4. System Call Events
   - GoSysCall: enters system call
   - GoSysExit: exits system call
   - GoSysBlock: system call blocks

5. Network Events
   - GoBlockNet: network blocking
   - GoUnblockNet: network unblocking

6. User-Defined Events
   - UserLog: user log
   - UserTaskCreate: user task creation
   - UserTaskEnd: user task end
   - UserRegionStart: user region start
   - UserRegionEnd: user region end
```

### Trace Data Collection Mechanism

```go
// Simplified trace mechanism principle
// Each P (processor) maintains a local event buffer

// 1. Event recording
func traceEvent(ev byte, skip int, args ...uint64) {
    // Get the trace buffer of the current P
    buf := getg().m.p.ptr().tracebuf

    // Record timestamp
    timestamp := nanotime()

    // Write event type and arguments
    buf.write(ev, timestamp, args...)

    // Flush to global when buffer is full
    if buf.full() {
        traceFlush(buf)
    }
}

// 2. Data flushing
func traceFlush(buf *traceBuf) {
    // Append local buffer to global trace data
    lock(&trace.lock)
    trace.fullBufs = append(trace.fullBufs, buf)
    unlock(&trace.lock)
}
```

### Timestamp Precision

The execution tracer uses nanosecond-precision timestamps, enabling precise measurement of:

- Goroutine scheduling latency
- System call duration
- GC pause time
- Network I/O wait time

## Key Points

### Basic API

```go
import "runtime/trace"

// Core functions
trace.Start(w io.Writer) error  // Start tracing
trace.Stop()                     // Stop tracing

// User annotations
trace.Log(ctx context.Context, category, message string)
trace.Logf(ctx context.Context, category, format string, args ...interface{})

// Tasks and regions (for structured tracing)
trace.NewTask(ctx context.Context, name string) (context.Context, *trace.Task)
trace.StartRegion(ctx context.Context, name string) *trace.Region
trace.WithRegion(ctx context.Context, name string, fn func())
```

### Trace File Format

The trace file is a binary format file containing:
- Header: version information, timestamp baseline
- Event stream: sequence of events in chronological order
- Stack information: call stacks corresponding to events
- String table: strings used in events

### go tool trace Views

| View | Function | Purpose |
|------|----------|---------|
| View trace | Timeline view | View event timeline |
| Goroutine analysis | Goroutine analysis | Analyze goroutine behavior |
| Network blocking profile | Network blocking analysis | Network latency issues |
| Synchronization blocking profile | Sync blocking analysis | Lock contention issues |
| Syscall blocking profile | System call analysis | System call latency |
| Scheduler latency profile | Scheduler latency analysis | Scheduling issues |
| User-defined tasks | User tasks | Custom task tracing |
| User-defined regions | User regions | Custom region tracing |
| Minimum mutator utilization | MMU | GC impact analysis |

## Code Examples

### Basic Usage

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
    // Create trace file
    f, err := os.Create("trace.out")
    if err != nil {
        panic(err)
    }
    defer f.Close()

    // Start tracing
    if err := trace.Start(f); err != nil {
        panic(err)
    }
    defer trace.Stop()

    // Execute code to be traced
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

Running and analyzing:

```bash
# Run program to generate trace file
go run main.go

# Analyze with go tool trace
go tool trace trace.out
```

### Using User Annotations

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

    // Create task: for tracing a logical work unit
    ctx, task := trace.NewTask(ctx, "main-task")
    defer task.End()

    // Process request
    processRequest(ctx, "user-123")
}

func processRequest(ctx context.Context, userID string) {
    // Create subtask
    ctx, task := trace.NewTask(ctx, "process-request")
    defer task.End()

    // Log message
    trace.Log(ctx, "info", "processing request for user: "+userID)

    // Use Region to mark code regions
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

### HTTP Server Integration

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
    // Trace control endpoint
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

        // Auto-stop after 10 seconds
        go func() {
            time.Sleep(10 * time.Second)
            trace.Stop()
            f.Close()
        }()

        w.Write([]byte("Trace started, will stop in 10 seconds"))
    })

    // Get trace data
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

    // Business endpoint (with tracing)
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

    // Simulate processing
    time.Sleep(100 * time.Millisecond)

    w.Write([]byte("OK"))
}
```

### Using go test to Generate Trace

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
# Run tests and generate trace
go test -trace=trace.out -run=TestMyFunction
go test -trace=trace.out -bench=.

# Analyze
go tool trace trace.out
```

### Concurrency Issue Diagnosis

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

    // Simulate producer-consumer problem
    ch := make(chan int, 10)
    var wg sync.WaitGroup

    // Producers
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

    // Consumers
    for i := 0; i < 2; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            ctx, task := trace.NewTask(ctx, "consumer")
            defer task.End()

            for j := 0; j < 150; j++ {
                trace.WithRegion(ctx, "consume", func() {
                    <-ch
                    time.Sleep(2 * time.Millisecond) // Consumer is slower
                })
            }
        }(i)
    }

    wg.Wait()
}
```

### Analyzing Scheduler Latency

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
    // Limit GOMAXPROCS to observe scheduling behavior
    runtime.GOMAXPROCS(2)

    f, _ := os.Create("trace.out")
    defer f.Close()
    trace.Start(f)
    defer trace.Stop()

    ctx := context.Background()
    var wg sync.WaitGroup

    // Create many goroutines competing for processors
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()

            ctx, task := trace.NewTask(ctx, "worker")
            defer task.End()

            // CPU-intensive work
            trace.WithRegion(ctx, "compute", func() {
                result := 0
                for j := 0; j < 1000000; j++ {
                    result += j
                }
            })

            // Yield processor
            runtime.Gosched()

            // More work
            trace.WithRegion(ctx, "more-compute", func() {
                time.Sleep(time.Millisecond)
            })
        }(i)
    }

    wg.Wait()
}
```

### GC Impact Analysis

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

    // Allocate lots of memory to trigger GC
    var data [][]byte
    for i := 0; i < 100; i++ {
        // Allocate 1MB
        chunk := make([]byte, 1024*1024)
        data = append(data, chunk)

        // Manually trigger GC
        if i%10 == 0 {
            runtime.GC()
        }

        time.Sleep(10 * time.Millisecond)
    }

    // Release references
    data = nil
    runtime.GC()
}
```

## Best Practices

### Control Trace Duration

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
    // Trace for 5 seconds
    stop := startTimedTrace(5*time.Second, "trace.out")
    defer stop()

    // Program logic
    doWork()
}
```

### Safe Tracing in Production

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

    // Authentication check
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

    // Maximum trace time of 30 seconds
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

### Meaningful Task and Region Naming

```go
package main

import (
    "context"
    "runtime/trace"
)

// Good naming practices
func processOrder(ctx context.Context, orderID string) {
    // Use descriptive task name
    ctx, task := trace.NewTask(ctx, "order:"+orderID)
    defer task.End()

    // Region names reflect business logic
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

    // Log key information
    trace.Log(ctx, "order", "completed: "+orderID)
}
```

### Context Propagation

```go
package main

import (
    "context"
    "runtime/trace"
)

// Middleware-style tracing
func withTracing(ctx context.Context, name string, fn func(context.Context)) {
    ctx, task := trace.NewTask(ctx, name)
    defer task.End()
    fn(ctx)
}

// Propagate context through call chain
func handleRequest(ctx context.Context) {
    ctx, task := trace.NewTask(ctx, "request")
    defer task.End()

    // Child operations automatically associate with parent task
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

### Sampled Tracing to Reduce Overhead

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
    sampleRate  = 0.01 // 1% sample rate
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

// Using sampled tracing
func handleRequest(ctx context.Context) {
    ctx, cleanup := maybeStartTrace(ctx, "request")
    defer cleanup()

    // Processing logic
    processRequest(ctx)
}
```

## Common Pitfalls

### Excessive Tracing Overhead

```go
// Wrong: Long-running trace in production
func badPractice() {
    f, _ := os.Create("trace.out")
    trace.Start(f)
    // Program runs for hours...
    // Trace file becomes huge, severe performance degradation
}

// Correct: Limit trace duration
func goodPractice() {
    f, _ := os.Create("trace.out")
    trace.Start(f)

    time.AfterFunc(10*time.Second, func() {
        trace.Stop()
        f.Close()
    })
}
```

### Forgetting to Pass Context

```go
// Wrong: Not passing context, tasks cannot be associated
func badContextUsage() {
    ctx := context.Background()
    ctx, task := trace.NewTask(ctx, "parent")
    defer task.End()

    go func() {
        // Creating new context, disconnected from parent task
        newCtx := context.Background()
        _, childTask := trace.NewTask(newCtx, "child")
        defer childTask.End()
        // child will not show as a child of parent
    }()
}

// Correct: Pass context
func goodContextUsage() {
    ctx := context.Background()
    ctx, task := trace.NewTask(ctx, "parent")
    defer task.End()

    go func(ctx context.Context) {
        _, childTask := trace.NewTask(ctx, "child")
        defer childTask.End()
        // child correctly associated with parent
    }(ctx)
}
```

### Trace File Too Large

```go
// Problem: Trace file can grow rapidly
func problem() {
    f, _ := os.Create("trace.out")
    trace.Start(f)

    // High-frequency operations produce many events
    for i := 0; i < 1000000; i++ {
        go func() {
            time.Sleep(time.Microsecond)
        }()
    }
}

// Solution 1: Limit trace duration
// Solution 2: Reduce workload during tracing
// Solution 3: Use sampling strategy
```

### Adding Tracing in Hot Paths

```go
// Wrong: Adding too much tracing in performance-critical paths
func hotPath(ctx context.Context, data []byte) {
    for i := 0; i < len(data); i++ {
        // Creating Region for each iteration, too much overhead
        trace.WithRegion(ctx, "process-byte", func() {
            processByte(data[i])
        })
    }
}

// Correct: Trace at appropriate granularity
func hotPathFixed(ctx context.Context, data []byte) {
    // Trace the entire processing
    trace.WithRegion(ctx, "process-data", func() {
        for i := 0; i < len(data); i++ {
            processByte(data[i])
        }
    })
}
```

### Forgetting to Call trace.Stop()

```go
// Wrong: Not stopping trace when program exits
func badShutdown() {
    f, _ := os.Create("trace.out")
    trace.Start(f)

    // Program logic
    doWork()

    // Direct exit, trace data may be incomplete
}

// Correct: Ensure proper stopping
func goodShutdown() {
    f, _ := os.Create("trace.out")
    defer f.Close()

    trace.Start(f)
    defer trace.Stop() // Ensure stopping

    doWork()
}
```

## Performance Considerations

### Tracing Overhead

The execution tracer's overhead mainly comes from:

1. **Event recording**: Each event needs to be written to a buffer
2. **Timestamp acquisition**: nanotime() calls
3. **Stack information collection**: For associating events with code locations
4. **Buffer management**: Allocation and flushing

```go
// Overhead evaluation code
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

### Typical Overhead Data

| Scenario | Overhead Increase |
|----------|-------------------|
| Low goroutine count | 5-10% |
| High goroutine count | 10-25% |
| High-frequency goroutine creation | 20-50% |
| Dense user annotations | Depends on usage frequency |

### Optimization Suggestions

```go
package main

import (
    "context"
    "runtime/trace"
    "time"
)

// 1. Batch operations to reduce event count
func batchOperations(ctx context.Context, items []Item) {
    // Instead of one region per item
    trace.WithRegion(ctx, "process-batch", func() {
        for _, item := range items {
            processItem(item)
        }
    })
}

// 2. Conditional tracing
var tracingEnabled = false

func conditionalTrace(ctx context.Context, name string, fn func()) {
    if tracingEnabled {
        trace.WithRegion(ctx, name, fn)
    } else {
        fn()
    }
}

// 3. Shorten trace window
func shortTraceWindow() {
    f, _ := os.Create("trace.out")
    trace.Start(f)

    // Only trace the time period of interest
    time.Sleep(5 * time.Second)

    trace.Stop()
    f.Close()
}
```

## Practical Scenarios

### Scenario 1: API Latency Analysis

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
    // Start tracing
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

    // Log request information
    trace.Log(ctx, "request", r.URL.Query().Encode())

    var users []User

    // Database query
    trace.WithRegion(ctx, "db-query", func() {
        users = queryUsers(ctx)
    })

    // Serialization
    var data []byte
    trace.WithRegion(ctx, "json-marshal", func() {
        data, _ = json.Marshal(users)
    })

    // Response
    trace.WithRegion(ctx, "write-response", func() {
        w.Header().Set("Content-Type", "application/json")
        w.Write(data)
    })

    trace.Log(ctx, "response", "sent successfully")
}

func queryUsers(ctx context.Context) []User {
    trace.Log(ctx, "db", "querying users table")

    // Simulate database query
    time.Sleep(50 * time.Millisecond)

    return []User{{ID: 1, Name: "Alice"}}
}
```

### Scenario 2: Concurrent Worker Pool Analysis

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

    // Start worker pool
    var wg sync.WaitGroup
    for i := 0; i < 4; i++ {
        wg.Add(1)
        go worker(ctx, i, jobs, results, &wg)
    }

    // Submit jobs
    ctx, task := trace.NewTask(ctx, "submit-jobs")
    for i := 0; i < 50; i++ {
        trace.WithRegion(ctx, "submit", func() {
            jobs <- Job{ID: i, Data: make([]byte, 1000)}
        })
    }
    close(jobs)
    task.End()

    // Collect results
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

            // Simulate processing
            time.Sleep(10 * time.Millisecond)

            results <- job.ID
        })
    }
}
```

### Scenario 3: GC Pressure Diagnosis

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

    // Scenario 1: Many small object allocations
    trace.WithRegion(ctx, "small-allocations", func() {
        for i := 0; i < 1000000; i++ {
            _ = make([]byte, 100)
        }
    })

    runtime.GC()
    time.Sleep(100 * time.Millisecond)

    // Scenario 2: Few large object allocations
    trace.WithRegion(ctx, "large-allocations", func() {
        for i := 0; i < 1000; i++ {
            _ = make([]byte, 100000)
        }
    })

    runtime.GC()
    time.Sleep(100 * time.Millisecond)

    // Scenario 3: Long-lived objects
    trace.WithRegion(ctx, "retained-objects", func() {
        data := make([][]byte, 10000)
        for i := range data {
            data[i] = make([]byte, 1000)
        }

        runtime.GC()
        time.Sleep(100 * time.Millisecond)

        // Use data to prevent optimization
        _ = len(data)
    })
}
```

### Scenario 4: Network I/O Analysis

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

    // Sequential requests
    trace.WithRegion(ctx, "sequential", func() {
        for _, url := range urls {
            fetchURL(ctx, url)
        }
    })

    // Parallel requests
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

## Interview Points

### What are the differences between the Execution Tracer and pprof?

**Answer**:
- **pprof** is sampling-based, recording statistical information (like CPU time, memory allocation amounts), suitable for finding hotspots
- **trace** is event-based, recording precise event timelines, suitable for analyzing latency and concurrency behavior
- pprof has lower overhead, trace provides more detailed information
- pprof answers "where are resources being consumed", trace answers "what happened during program execution"

### How to safely use the Execution Tracer in production?

**Answer**:
- Limit trace duration (e.g., maximum 30 seconds)
- Add authentication mechanism
- Only enable when needed
- Listen on localhost
- Use sampling strategy to reduce overhead
- Avoid tracing during high-load periods

### What information does a trace file contain?

**Answer**:
- Goroutine creation, scheduling, blocking events
- GC events (start, end, STW)
- System call events
- Network I/O events
- User-defined tasks and regions
- Event timestamps and call stacks

### How to use trace to analyze goroutine leaks?

**Answer**:
```go
// 1. Collect trace data
trace.Start(f)
// Run program
trace.Stop()

// 2. Analyze with go tool trace
// go tool trace trace.out
// View Goroutine analysis view
// Focus on goroutines that are blocked for a long time
```

### What is the difference between Task and Region?

**Answer**:
- **Task**: Represents a complete logical work unit, can span multiple goroutines
- **Region**: Represents an execution region in code, within a single goroutine
- Task is suitable for tracing request handling, transactions, etc.
- Region is suitable for tracing function execution, code blocks

### How to reduce tracing overhead?

**Answer**:
- Shorten trace time window
- Use sampling strategy
- Reduce user annotation density
- Avoid adding fine-grained tracing in hot paths
- Trace during off-peak periods
- Batch processing to reduce event count

## Further Reading

### Official Documentation

- [runtime/trace Package Documentation](https://pkg.go.dev/runtime/trace)
- [Go Execution Tracer Design Document](https://docs.google.com/document/d/1FP5apqzBgr7ahCCgFO-yoVhk4YZrNIDNf9RybngBc14)
- [Go Diagnostics](https://go.dev/doc/diagnostics)

### Related Blog Posts

- [Go Execution Tracer Deep Dive](https://blog.gopheracademy.com/advent-2017/go-execution-tracer/)
- [Analyzing Latency with Go Tracer](https://making.pusher.com/go-tool-trace/)

### Tools

- [go tool trace Source Code](https://github.com/golang/go/tree/master/src/cmd/trace)
- [trace Package Source Code](https://github.com/golang/go/tree/master/src/runtime/trace)

### Related Topics

- [pprof Performance Analysis](/go/pprof) - CPU and memory analysis
- [Goroutines and Channels](/go/goroutines-channels) - Concurrency basics
- [Context](/go/context) - Context propagation
- [sync Package](/go/sync) - Synchronization primitives
