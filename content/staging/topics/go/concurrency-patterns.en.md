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
origin: old/src/content/docs/go/concurrency-patterns.en.md
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

Go is renowned for its elegant concurrency model. The combination of goroutines and channels provides developers with powerful concurrent programming capabilities. This article delves into five core concurrency patterns: Generator, Fan-In/Fan-Out, Pipeline, Worker Pool, and Rate Limiting, to help you build efficient and reliable concurrent programs.

## Concept Explanation

### What Are Concurrency Patterns?

Concurrency patterns are reusable solutions for solving common concurrent programming problems. They are battle-tested design templates that help developers avoid common concurrency pitfalls such as deadlocks, race conditions, and resource leaks.

Go's concurrency patterns are built on the foundation of CSP (Communicating Sequential Processes) theory, with the core idea being:

> "Don't communicate by sharing memory; share memory by communicating."

### Overview of Six Core Patterns

| Pattern | Core Idea | Typical Use Cases |
|---------|-----------|-------------------|
| Generator | Function returns a channel, generating data on demand | Data stream generation, iterators |
| Fan-In | Multiple channels merged into one | Aggregating multiple data sources |
| Fan-Out | One channel distributed to multiple workers | Parallel task processing |
| Pipeline | Multi-stage data processing chain | ETL, stream processing |
| Worker Pool | Fixed number of workers processing a task queue | Limiting concurrency, resource reuse |
| Rate Limiting | Controlling operation frequency | API throttling, overload prevention |

## Core Principles

### Go Scheduler and Goroutines

Before understanding concurrency patterns, you need to understand how the Go runtime scheduler works. Go uses the GMP model:

- **G (Goroutine)**: Lightweight thread, initial stack of only 2KB
- **M (Machine)**: Operating system thread
- **P (Processor)**: Logical processor, default count equals CPU core count

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

### Internal Structure of Channels

Channels are the core of Go concurrency, internally containing:

- **buf**: Ring buffer (for buffered channels)
- **sendq/recvq**: Queues of goroutines waiting to send/receive
- **lock**: Mutex protecting internal state

```go
// runtime/chan.go simplified structure
type hchan struct {
    qcount   uint           // Number of elements currently in the queue
    dataqsiz uint           // Size of the ring buffer
    buf      unsafe.Pointer // Pointer to the ring buffer
    elemsize uint16         // Element size
    closed   uint32         // Whether closed
    sendx    uint           // Send index
    recvx    uint           // Receive index
    recvq    waitq          // Queue of goroutines waiting to receive
    sendq    waitq          // Queue of goroutines waiting to send
    lock     mutex          // Mutex
}
```

### Communication Mechanisms of Concurrency Patterns

All concurrency patterns are based on the following basic operations:

1. **Send**: `ch <- value` (may block)
2. **Receive**: `value := <-ch` (may block)
3. **Close**: `close(ch)` (can only be executed by the sender)
4. **Select**: `select` statement implements multiplexing

## Key Points

### Generator Pattern

The Generator pattern encapsulates data generation logic in a function and returns a read-only channel. Callers can consume data on demand, enabling lazy evaluation.

**Key Characteristics**:
- Decouples producer and consumer
- Supports lazy computation
- Function returns `<-chan T` type

### Fan-In Pattern

Merges multiple input channels into a single output channel, with all input data flowing to the same outlet.

**Key Characteristics**:
- Many-to-one data aggregation
- Does not guarantee input order
- Often used with `sync.WaitGroup`

### Fan-Out Pattern

Distributes data from a single input channel to multiple workers for parallel processing.

**Key Characteristics**:
- One-to-many task distribution
- Increases processing throughput
- Worker count is configurable

### Pipeline Pattern

Decomposes data processing into multiple stages, each executed by independent goroutines, connected through channels.

**Key Characteristics**:
- Stages connected through channels
- Each stage can be independently scaled
- Supports parallel and pipelined processing

### Worker Pool Pattern

Maintains a fixed number of worker goroutines that fetch and execute tasks from a shared task queue.

**Key Characteristics**:
- Limits concurrency
- Reuses goroutines
- Prevents resource exhaustion

### Rate Limiting Pattern

Controls the execution frequency of operations to prevent system overload.

**Key Characteristics**:
- Based on `time.Ticker` or token bucket
- Supports burst traffic
- Configurable throttling strategies

## Code Examples

### Generator Pattern

The Generator pattern is the most fundamental concurrency pattern. It encapsulates data generation logic in a function and returns a channel for consumers to use.

```go
package main

import (
    "fmt"
    "math/rand"
    "time"
)

// Basic Generator: generates integer sequence
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

// Infinite Generator: generates Fibonacci sequence
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

// Generator with delay: simulates data stream
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

// Random number Generator
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
    // Example 1: Basic integer generator
    fmt.Println("=== Integer Generator ===")
    for num := range generateIntegers(5) {
        fmt.Printf("%d ", num)
    }
    fmt.Println()

    // Example 2: Fibonacci sequence (first 10 numbers)
    fmt.Println("\n=== Fibonacci Sequence ===")
    done := make(chan struct{})
    fib := generateFibonacci(done)
    for i := 0; i < 10; i++ {
        fmt.Printf("%d ", <-fib)
    }
    close(done)
    fmt.Println()

    // Example 3: Delayed data stream
    fmt.Println("\n=== Delayed Data Stream ===")
    data := []string{"Alice", "Bob", "Charlie"}
    for name := range generateWithDelay(data, 100*time.Millisecond) {
        fmt.Printf("Received: %s\n", name)
    }
}
```

### Fan-In Pattern

The Fan-In pattern merges output from multiple channels into a single channel.

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// Basic Fan-In: merge two channels
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

// Generic Fan-In: merge any number of channels
func fanInMultiple(channels ...<-chan string) <-chan string {
    out := make(chan string)
    var wg sync.WaitGroup

    // Start a goroutine for each input channel
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

    // Close output after all inputs complete
    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}

// Fan-In with priority
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

// Data source simulation
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
    // Example 1: Merge two data sources
    fmt.Println("=== Basic Fan-In ===")
    ch1 := generateSource("Source1", 3, 100*time.Millisecond)
    ch2 := generateSource("Source2", 3, 150*time.Millisecond)

    for msg := range fanIn(ch1, ch2) {
        fmt.Println(msg)
    }

    // Example 2: Merge multiple data sources
    fmt.Println("\n=== Multi-source Fan-In ===")
    sources := make([]<-chan string, 3)
    for i := 0; i < 3; i++ {
        sources[i] = generateSource(fmt.Sprintf("Worker%d", i), 2, 50*time.Millisecond)
    }

    for msg := range fanInMultiple(sources...) {
        fmt.Println(msg)
    }

    // Example 3: Priority Fan-In
    fmt.Println("\n=== Priority Fan-In ===")
    highPriority := generateSource("Urgent", 2, 200*time.Millisecond)
    lowPriority := generateSource("Normal", 4, 100*time.Millisecond)

    for msg := range fanInWithPriority(highPriority, lowPriority) {
        fmt.Println(msg)
    }
}
```

### Fan-Out Pattern

The Fan-Out pattern distributes tasks to multiple workers for parallel processing.

```go
package main

import (
    "context"
    "fmt"
    "math/rand"
    "sync"
    "time"
)

// Task defines the task structure
type Task struct {
    ID   int
    Data string
}

// Result defines the result structure
type Result struct {
    TaskID   int
    WorkerID int
    Output   string
}

// Basic Fan-Out: distribute tasks to multiple workers
func fanOut(input <-chan Task, workerCount int) <-chan Result {
    results := make(chan Result)
    var wg sync.WaitGroup

    // Start specified number of workers
    for i := 0; i < workerCount; i++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            for task := range input {
                // Simulate processing time
                time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond)
                results <- Result{
                    TaskID:   task.ID,
                    WorkerID: workerID,
                    Output:   fmt.Sprintf("Processed: %s", task.Data),
                }
            }
        }(i)
    }

    // Close results channel after all workers complete
    go func() {
        wg.Wait()
        close(results)
    }()

    return results
}

// Fan-Out with context: supports cancellation
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
                    // Process task
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

// Dynamic Fan-Out: adjust worker count based on load
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

    // Example 1: Basic Fan-Out
    fmt.Println("=== Basic Fan-Out ===")
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

    // Example 2: Fan-Out with cancellation
    fmt.Println("\n=== Cancellable Fan-Out ===")
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

### Pipeline Pattern

The Pipeline pattern decomposes data processing into multiple stages, forming a processing pipeline.

```go
package main

import (
    "context"
    "fmt"
    "strings"
    "sync"
)

// Stage 1: Data generation
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

// Stage 2: Square operation
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

// Stage 3: Filter even numbers
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

// Stage 4: Double
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

// Generic Pipeline builder
type Stage func(<-chan int) <-chan int

func buildPipeline(source <-chan int, stages ...Stage) <-chan int {
    current := source
    for _, stage := range stages {
        current = stage(current)
    }
    return current
}

// Pipeline stage with Context
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

// String processing Pipeline
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

// Parallel Pipeline: multiple workers processing the same stage
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
    // Example 1: Basic Pipeline
    fmt.Println("=== Basic Number Pipeline ===")
    // 1, 2, 3, 4, 5 -> square -> 1, 4, 9, 16, 25 -> filterEven -> 4, 16 -> double -> 8, 32
    source := generate(1, 2, 3, 4, 5)
    squared := square(source)
    filtered := filterEven(squared)
    doubled := double(filtered)

    for result := range doubled {
        fmt.Printf("%d ", result)
    }
    fmt.Println()

    // Example 2: Using Pipeline builder
    fmt.Println("\n=== Pipeline Builder ===")
    source2 := generate(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    pipeline := buildPipeline(source2, square, filterEven, double)

    for result := range pipeline {
        fmt.Printf("%d ", result)
    }
    fmt.Println()

    // Example 3: String processing Pipeline
    fmt.Println("\n=== String Pipeline ===")
    strings := generateStrings("hello", "go", "pipeline", "pattern", "concurrency")
    upper := toUpper(strings)
    prefixed := addPrefix(">> ")(upper)
    long := filterLength(10)(prefixed)

    for s := range long {
        fmt.Println(s)
    }

    // Example 4: Cancellable Pipeline
    fmt.Println("\n=== Cancellable Pipeline ===")
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

### Worker Pool Pattern

The Worker Pool pattern maintains a fixed number of workers that fetch tasks from a shared task queue for processing.

```go
package main

import (
    "context"
    "fmt"
    "math/rand"
    "sync"
    "time"
)

// Job defines a task
type Job struct {
    ID       int
    Payload  string
    Priority int
}

// JobResult defines task result
type JobResult struct {
    JobID    int
    WorkerID int
    Result   string
    Duration time.Duration
    Error    error
}

// Basic Worker Pool
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

        // Simulate processing task
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

// Worker Pool with Context
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

// Worker Pool with retry
type RetryableWorkerPool struct {
    pool       *WorkerPool
    maxRetries int
    retryDelay time.Duration
}

func processWithRetry(job Job, maxRetries int) (string, error) {
    var lastErr error
    for i := 0; i <= maxRetries; i++ {
        // Simulate potentially failing processing
        if rand.Float32() < 0.3 { // 30% failure rate
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

    // Example 1: Basic Worker Pool
    fmt.Println("=== Basic Worker Pool ===")
    pool := NewWorkerPool(3, 10)
    pool.Start()

    // Submit tasks
    go func() {
        for i := 0; i < 10; i++ {
            pool.Submit(Job{
                ID:      i,
                Payload: fmt.Sprintf("Task-%d", i),
            })
        }
        pool.Close()
    }()

    // Collect results
    for result := range pool.Results() {
        fmt.Printf("Job %d by Worker %d: %s (took %v)\n",
            result.JobID, result.WorkerID, result.Result, result.Duration)
    }

    // Example 2: Worker Pool with Context
    fmt.Println("\n=== Context Worker Pool ===")
    ctx, cancel := context.WithTimeout(context.Background(), 300*time.Millisecond)
    defer cancel()

    ctxPool := NewContextWorkerPool(ctx, 4, 20)
    ctxPool.Start()

    // Submit tasks
    submitted := 0
    for i := 0; i < 30; i++ {
        if ctxPool.Submit(Job{ID: i, Payload: fmt.Sprintf("Job-%d", i)}) {
            submitted++
        } else {
            break
        }
    }
    fmt.Printf("Submitted %d jobs\n", submitted)

    // Collect results until timeout
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

    // Example 3: Worker Pool statistics
    fmt.Println("\n=== Worker Pool Statistics ===")
    statsPool := NewWorkerPool(5, 100)
    statsPool.Start()

    var totalDuration time.Duration
    var mu sync.Mutex
    var statsWg sync.WaitGroup

    // Collect statistics
    statsWg.Add(1)
    go func() {
        defer statsWg.Done()
        for result := range statsPool.Results() {
            mu.Lock()
            totalDuration += result.Duration
            mu.Unlock()
        }
    }()

    // Submit tasks
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

### Rate Limiting Pattern

The Rate Limiting pattern is used to control the execution frequency of operations and prevent system overload.

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

// Basic rate limiter (based on time.Ticker)
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

// Token bucket rate limiter
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

    // Initialize tokens
    for i := 0; i < capacity; i++ {
        tb.tokens <- struct{}{}
    }

    // Start token refill goroutine
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
                // Token added successfully
            default:
                // Bucket is full, discard token
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

// Sliding window rate limiter
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

    // Clean up expired requests
    valid := make([]time.Time, 0)
    for _, t := range l.requests {
        if t.After(windowStart) {
            valid = append(valid, t)
        }
    }
    l.requests = valid

    // Check if limit exceeded
    if len(l.requests) >= l.maxReqs {
        return false
    }

    l.requests = append(l.requests, now)
    return true
}

// Rate limiter with burst
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

    // Fill burst capacity
    for i := 0; i < burstSize; i++ {
        bl.burst <- struct{}{}
    }

    // Continuous refill
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

// Request processing function
func processRequest(id int) {
    fmt.Printf("[%s] Processing request %d\n",
        time.Now().Format("15:04:05.000"), id)
}

func main() {
    // Example 1: Basic rate limiting
    fmt.Println("=== Basic Rate Limiting (one request per 200ms) ===")
    limiter := NewBasicRateLimiter(200 * time.Millisecond)

    for i := 0; i < 5; i++ {
        limiter.Wait()
        processRequest(i)
    }
    limiter.Stop()

    // Example 2: Token bucket
    fmt.Println("\n=== Token Bucket (capacity 3, refill every 200ms) ===")
    bucket := NewTokenBucket(3, 200*time.Millisecond)

    // Quickly consume initial tokens
    for i := 0; i < 5; i++ {
        if bucket.TakeWithTimeout(100 * time.Millisecond) {
            processRequest(i)
        } else {
            fmt.Printf("[%s] Request %d: rate limited\n",
                time.Now().Format("15:04:05.000"), i)
        }
    }

    // Wait for token refill
    time.Sleep(500 * time.Millisecond)

    for i := 5; i < 8; i++ {
        if bucket.Take() {
            processRequest(i)
        }
    }
    bucket.Stop()

    // Example 3: Sliding window
    fmt.Println("\n=== Sliding Window (max 3 requests per second) ===")
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

    // Example 4: Burst rate limiting
    fmt.Println("\n=== Burst Rate Limiting (burst 5, refill every 500ms) ===")
    burstLimiter := NewBurstRateLimiter(500*time.Millisecond, 5)

    // Burst requests
    fmt.Println("--- Burst Requests ---")
    for i := 0; i < 8; i++ {
        if burstLimiter.Allow() {
            processRequest(i)
        } else {
            fmt.Printf("[%s] Request %d: burst limit reached\n",
                time.Now().Format("15:04:05.000"), i)
        }
    }

    // Wait for refill
    fmt.Println("--- Continue After Refill ---")
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

## Best Practices

### Always Close Channels

The sender is responsible for closing the channel to avoid panics from sending to a closed channel.

```go
// Correct approach
func producer(out chan<- int) {
    defer close(out) // Sender closes
    for i := 0; i < 10; i++ {
        out <- i
    }
}

// Consumer only receives, does not close
func consumer(in <-chan int) {
    for v := range in {
        process(v)
    }
}
```

### Use Context to Control Lifecycle

```go
func worker(ctx context.Context, jobs <-chan Job) {
    for {
        select {
        case <-ctx.Done():
            return // Graceful exit
        case job, ok := <-jobs:
            if !ok {
                return
            }
            processJob(job)
        }
    }
}
```

### Avoid Goroutine Leaks

```go
// Bad: goroutine may block forever
func bad() <-chan int {
    ch := make(chan int)
    go func() {
        for i := 0; ; i++ {
            ch <- i // Blocks forever if no receiver
        }
    }()
    return ch
}

// Good: cancellable goroutine
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

### Set Buffer Size Appropriately

```go
// Unbuffered: strong synchronization, suitable for signal passing
signal := make(chan struct{})

// Small buffer: reduces blocking, suitable for similar producer/consumer speeds
jobs := make(chan Job, 10)

// Large buffer: absorbs burst traffic, suitable for high production rate variance
events := make(chan Event, 1000)
```

### Use sync.WaitGroup to Wait for Completion

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

    wg.Wait() // Wait for all processing to complete
}
```

## Common Pitfalls

### The nil Channel Pitfall

```go
var ch chan int // nil channel

// Sending to nil channel blocks forever
ch <- 1 // Blocks forever

// Receiving from nil channel also blocks forever
<-ch // Blocks forever

// Closing nil channel panics
close(ch) // panic: close of nil channel
```

### Sending to a Closed Channel

```go
ch := make(chan int)
close(ch)
ch <- 1 // panic: send on closed channel
```

### Loop Variable Capture Issue

```go
// Wrong: all goroutines may use the same value of i
for i := 0; i < 10; i++ {
    go func() {
        fmt.Println(i) // May all print 10
    }()
}

// Correct: pass through parameter
for i := 0; i < 10; i++ {
    go func(n int) {
        fmt.Println(n)
    }(i)
}
```

### Randomness of select

```go
// When multiple cases are ready, select randomly chooses one
select {
case ch1 <- 1:
case ch2 <- 2:
case ch3 <- 3:
}
// Execution order is not guaranteed
```

### Deadlock Scenarios

```go
// Single goroutine deadlock
func main() {
    ch := make(chan int)
    ch <- 1 // Deadlock: no receiver
    <-ch
}

// Circular dependency deadlock
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
    // Two goroutines waiting for each other
}
```

## Performance Considerations

### Goroutine Overhead

```go
// Goroutine initial stack is about 2KB, grows as needed
// Creating millions of goroutines is feasible, but watch memory usage

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
// Channel is suitable for data transfer and synchronization
// Mutex is suitable for protecting shared state

// Using Channel
type Counter struct {
    ch chan int
}

func (c *Counter) Inc() {
    c.ch <- 1
}

// Using Mutex (usually faster)
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

### Buffered Channel Throughput

```go
// Increasing buffer reduces blocking, improves throughput
// But excessive buffering consumes memory and delays problem detection

// Benchmark different buffer sizes
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

### Use sync.Pool to Reduce Allocations

```go
var bufPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 1024)
    },
}

func processWithPool() {
    buf := bufPool.Get().([]byte)
    defer bufPool.Put(buf)

    // Use buf to process data
}
```

## Real-World Scenarios

### Scenario 1: Web Crawler

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

    // Start workers
    for i := 0; i < c.workerCount; i++ {
        c.wg.Add(1)
        go c.worker(ctx)
    }

    // Submit seed URLs
    go func() {
        for _, url := range seedURLs {
            c.jobs <- &CrawlJob{URL: url, Depth: 0}
        }
    }()

    // Wait for completion and close results channel
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

    // Simulate page fetching
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

    // Submit newly discovered links
    for _, link := range page.Links {
        select {
        case <-ctx.Done():
            return
        case c.jobs <- &CrawlJob{URL: link, Depth: job.Depth + 1}:
        default:
            // Task queue full, skip
        }
    }
}
```

### Scenario 2: Real-time Data Processing Pipeline

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
    // Stage 1: Validation
    validated := p.validate(ctx, p.input)

    // Stage 2: Transform (Fan-Out)
    transformed := make([]<-chan ProcessedData, p.workers)
    for i := 0; i < p.workers; i++ {
        transformed[i] = p.transform(ctx, validated)
    }

    // Stage 3: Merge (Fan-In)
    merged := p.merge(ctx, transformed...)

    // Stage 4: Output
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

### Scenario 3: API Gateway Rate Limiting

```go
type APIGateway struct {
    limiters map[string]*TokenBucket
    mu       sync.RWMutex
    config   RateLimitConfig
}

type RateLimitConfig struct {
    DefaultRate   int           // Requests per second
    DefaultBurst  int           // Burst capacity
    RefillPeriod  time.Duration // Refill period
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

    // Double check
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

## Interview Key Points

### Difference Between Goroutines and Threads

**Q: What are the differences between goroutines and OS threads?**

A:
| Feature | Goroutine | OS Thread |
|---------|-----------|-----------|
| Memory usage | Initial 2KB, dynamically grows | Usually 1-8MB fixed stack |
| Creation cost | Tens of nanoseconds | Microseconds |
| Context switch cost | Hundreds of nanoseconds (user space) | Microseconds (kernel space) |
| Scheduler | Go runtime (GMP model) | OS kernel |
| Quantity limit | Can create millions | Usually thousands |

### Underlying Implementation of Channels

**Q: How are channels implemented? When do they block?**

A: A channel is internally a struct containing a ring buffer, send/receive wait queues, and a mutex.

Blocking situations:
- Sending to an unbuffered channel with no receiver
- Sending to a full buffered channel
- Receiving from an empty channel
- Sending or receiving from a nil channel

### How select Works

**Q: How does the select statement work? What happens when multiple cases are ready simultaneously?**

A:
- select waits for any case to be ready
- When multiple cases are ready simultaneously, Go runtime uses a pseudo-random algorithm to choose one
- If there's a default case, it executes when all other cases are blocked
- Empty select {} blocks forever

### How to Avoid Goroutine Leaks

**Q: What is a goroutine leak? How do you avoid it?**

A: A goroutine leak occurs when a goroutine cannot exit normally and continues to consume resources.

Prevention methods:
1. Use context to pass cancellation signals
2. Ensure channels are eventually closed
3. Use select to listen for done channel
4. Set timeout mechanisms
5. Use errgroup to manage goroutine lifecycle

### Difference Between Worker Pool and Direct Goroutine Creation

**Q: When should you use a Worker Pool? When should you create goroutines directly?**

A:
- **Use Worker Pool**:
  - Large and continuous task volume
  - Need to limit concurrency
  - Short task processing time
  - Need to reuse resources

- **Create Goroutines Directly**:
  - Small number of tasks
  - Tasks are independent of each other
  - Long task execution time
  - Simple scenarios

### Pros and Cons of Pipeline Pattern

**Q: What are the pros and cons of the Pipeline pattern? What scenarios is it suitable for?**

A:
Pros:
- Decoupled stages, easy to maintain
- Can process different stages in parallel
- Supports backpressure mechanism
- Easy to add new stages

Cons:
- Increases code complexity
- May introduce latency
- Need to handle channel closing and error propagation

Suitable scenarios:
- ETL data processing
- Stream data processing
- Image/video processing
- Log processing pipelines

## Further Reading

### Official Resources
- [Go Concurrency Patterns (Go Blog)](https://go.dev/blog/pipelines)
- [Advanced Go Concurrency Patterns (GopherCon 2013)](https://go.dev/blog/advanced-go-concurrency-patterns)
- [The Go Memory Model](https://go.dev/ref/mem)

### Classic Articles
- [Go Concurrency Patterns: Context](https://go.dev/blog/context)
- [Go Concurrency Patterns: Timing out, moving on](https://go.dev/blog/concurrency-timeouts)
- [Share Memory By Communicating](https://go.dev/blog/share-memory-by-communicating)

### Recommended Books
- "Concurrency in Go" by Katherine Cox-Buday
- "Advanced Go Programming" by Chai Shusang, Cao Chunhui
- "Go Language Design and Implementation" by Zuo Shuqi

### Tools and Libraries
- [golang.org/x/sync/errgroup](https://pkg.go.dev/golang.org/x/sync/errgroup)
- [golang.org/x/time/rate](https://pkg.go.dev/golang.org/x/time/rate)
- [uber-go/ratelimit](https://github.com/uber-go/ratelimit)

## Summary

Go concurrency patterns are the foundation for building efficient concurrent programs. This article covered six core patterns in detail:

1. **Generator**: Encapsulates data generation logic, returns a read-only channel
2. **Fan-In**: Merges multiple data sources into a single output
3. **Fan-Out**: Distributes tasks to multiple workers for parallel processing
4. **Pipeline**: Builds multi-stage data processing pipelines
5. **Worker Pool**: Limits concurrency, reuses goroutines
6. **Rate Limiting**: Controls operation frequency, prevents overload

By mastering these patterns, combined with context for lifecycle management and the sync package for synchronization, you can write efficient, reliable, and maintainable Go concurrent programs. Remember Go's concurrency philosophy:

> "Don't communicate by sharing memory; share memory by communicating."

In practice, choosing the right pattern depends on the specific scenario. Start simple, optimize gradually, and test continuously - this is the right approach to building robust concurrent systems.
