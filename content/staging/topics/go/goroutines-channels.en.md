---
title: Go Goroutines and Channels
description: "Master Go concurrency: goroutines, channels, select and concurrency patterns"
track: go
section: concurrency
difficulty: intermediate
tags:
  - Go
  - goroutine
  - channel
  - Concurrency
status: imported
origin: old/src/content/docs/go/goroutines-channels.en.md
divergence: 0.333
issues: []
legacy:
  category: Go
  subcategory: Concurrent Programming
  order: 2
  lastUpdated: 2026-01-07
---

Go's concurrency model is one of its most powerful features, built around goroutines and channels. This guide will help you master concurrent programming in Go.

## Introduction to Concurrency in Go

Go implements concurrency through **CSP (Communicating Sequential Processes)**, where independent processes communicate by passing messages rather than sharing memory. This is encapsulated in Go's famous motto:

> "Don't communicate by sharing memory; share memory by communicating."

The two core primitives for concurrency in Go are:
- **Goroutines**: Lightweight threads managed by the Go runtime
- **Channels**: Typed conduits for communication between goroutines

## Goroutines

### What is a Goroutine?

A goroutine is a lightweight thread of execution managed by the Go runtime. Goroutines are extremely cheap compared to OS threads:
- Initial stack size: ~2KB (vs ~1MB for OS threads)
- Multiplexed onto OS threads by the Go scheduler
- Can have hundreds of thousands running concurrently

### Creating Goroutines

Starting a goroutine is simple - just use the `go` keyword before a function call:

```go
package main

import (
    "fmt"
    "time"
)

func sayHello(name string) {
    fmt.Printf("Hello, %s!\n", name)
}

func main() {
    // Regular function call (synchronous)
    sayHello("World")

    // Goroutine (asynchronous)
    go sayHello("Alice")
    go sayHello("Bob")

    // Wait for goroutines to complete
    time.Sleep(time.Second)
    fmt.Println("Main function exits")
}
```

**Output:**
```
Hello, World!
Hello, Alice!
Hello, Bob!
Main function exits
```

### Anonymous Goroutines

You can also use anonymous functions with goroutines:

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    // Anonymous goroutine
    go func() {
        fmt.Println("Running in a goroutine")
    }()

    // Anonymous goroutine with parameters
    message := "Hello from closure"
    go func(msg string) {
        fmt.Println(msg)
    }(message)

    time.Sleep(time.Second)
}
```

### Important Goroutine Considerations

1. **Main goroutine termination**: When the main function exits, all goroutines are terminated, even if they haven't completed
2. **No return values**: Goroutines don't return values directly; use channels for communication
3. **Closure variables**: Be careful with closures in loops

**Common mistake with loop variables:**

```go
// WRONG: All goroutines might print the same value
for i := 0; i < 5; i++ {
    go func() {
        fmt.Println(i) // Captures reference to i, not value
    }()
}

// CORRECT: Pass value as parameter
for i := 0; i < 5; i++ {
    go func(n int) {
        fmt.Println(n) // Each goroutine gets its own copy
    }(i)
}
```

## Channels

Channels are the pipes that connect goroutines, allowing them to communicate and synchronize execution.

### Creating Channels

```go
// Unbuffered channel
ch := make(chan int)

// Buffered channel with capacity 5
ch := make(chan int, 5)

// Read-only channel
var roCh <-chan int

// Write-only channel
var woCh chan<- int
```

### Unbuffered Channels

Unbuffered channels are synchronous - the sender blocks until a receiver is ready, and vice versa.

```go
package main

import "fmt"

func main() {
    ch := make(chan string)

    // Send in goroutine
    go func() {
        ch <- "Hello, Channel!" // Blocks until received
        fmt.Println("Sent message")
    }()

    // Receive in main
    msg := <-ch // Blocks until sent
    fmt.Println("Received:", msg)
}
```

**Output:**
```
Received: Hello, Channel!
Sent message
```

### Buffered Channels

Buffered channels allow sending without blocking until the buffer is full:

```go
package main

import "fmt"

func main() {
    ch := make(chan int, 3) // Buffer size 3

    // These don't block because buffer isn't full
    ch <- 1
    ch <- 2
    ch <- 3

    fmt.Println(<-ch) // 1
    fmt.Println(<-ch) // 2
    fmt.Println(<-ch) // 3
}
```

**When to use buffered channels:**
- When you know the number of messages in advance
- To reduce synchronization overhead
- For asynchronous communication patterns

```go
package main

import (
    "fmt"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        fmt.Printf("Worker %d processing job %d\n", id, j)
        time.Sleep(time.Second)
        results <- j * 2
    }
}

func main() {
    jobs := make(chan int, 5)
    results := make(chan int, 5)

    // Start 3 workers
    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }

    // Send 5 jobs
    for j := 1; j <= 5; j++ {
        jobs <- j
    }
    close(jobs)

    // Collect results
    for a := 1; a <= 5; a++ {
        fmt.Println("Result:", <-results)
    }
}
```

### Channel Direction

You can specify whether a channel is for sending or receiving:

```go
// Send-only channel
func send(ch chan<- int) {
    ch <- 42
}

// Receive-only channel
func receive(ch <-chan int) {
    value := <-ch
    fmt.Println(value)
}

func main() {
    ch := make(chan int)

    go send(ch)
    receive(ch)
}
```

**Benefits:**
- Type safety at compile time
- Clear intent in function signatures
- Prevents misuse of channels

### Closing Channels

Closing a channel indicates no more values will be sent:

```go
package main

import "fmt"

func main() {
    ch := make(chan int, 3)

    ch <- 1
    ch <- 2
    ch <- 3
    close(ch) // Close the channel

    // Receive all values
    for v := range ch {
        fmt.Println(v)
    }

    // Check if channel is closed
    v, ok := <-ch
    if !ok {
        fmt.Println("Channel is closed")
    }
}
```

**Important rules:**
- Only the sender should close a channel
- Sending on a closed channel causes a panic
- Receiving from a closed channel returns zero value
- Closing a nil channel causes a panic

## The Select Statement

The `select` statement lets a goroutine wait on multiple channel operations:

### Basic Select

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)

    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "from channel 1"
    }()

    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "from channel 2"
    }()

    // Wait for both channels
    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println("Received", msg1)
        case msg2 := <-ch2:
            fmt.Println("Received", msg2)
        }
    }
}
```

### Select with Default

The `default` case runs if no other case is ready:

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch := make(chan int)

    select {
    case v := <-ch:
        fmt.Println("Received:", v)
    default:
        fmt.Println("No value ready, non-blocking")
    }

    // Non-blocking send
    select {
    case ch <- 42:
        fmt.Println("Sent value")
    default:
        fmt.Println("Channel not ready for send")
    }
}
```

### Select with Timeout

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch := make(chan string)

    go func() {
        time.Sleep(2 * time.Second)
        ch <- "result"
    }()

    select {
    case res := <-ch:
        fmt.Println("Received:", res)
    case <-time.After(1 * time.Second):
        fmt.Println("Timeout!")
    }
}
```

### Select for Cancellation

```go
package main

import (
    "fmt"
    "time"
)

func worker(done <-chan bool) {
    for {
        select {
        case <-done:
            fmt.Println("Worker stopping")
            return
        default:
            fmt.Println("Working...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    done := make(chan bool)

    go worker(done)

    time.Sleep(2 * time.Second)
    done <- true
    time.Sleep(1 * time.Second)
}
```

## Common Concurrency Patterns

### Worker Pool Pattern

Distribute work among multiple workers:

```go
package main

import (
    "fmt"
    "sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        fmt.Printf("Worker %d started job %d\n", id, j)
        results <- j * 2
        fmt.Printf("Worker %d finished job %d\n", id, j)
    }
}

func main() {
    const numJobs = 10
    const numWorkers = 3

    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)

    var wg sync.WaitGroup

    // Start workers
    for w := 1; w <= numWorkers; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    // Send jobs
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)

    // Wait for workers to finish
    wg.Wait()
    close(results)

    // Collect results
    for result := range results {
        fmt.Println("Result:", result)
    }
}
```

### Pipeline Pattern

Chain goroutines together where each stage processes data:

```go
package main

import "fmt"

func generator(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

func filter(in <-chan int, threshold int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            if n > threshold {
                out <- n
            }
        }
        close(out)
    }()
    return out
}

func main() {
    // Build pipeline
    nums := generator(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    squared := square(nums)
    filtered := filter(squared, 30)

    // Consume results
    for result := range filtered {
        fmt.Println(result)
    }
}
```

**Output:**
```
36
49
64
81
100
```

### Fan-Out, Fan-In Pattern

Distribute work to multiple goroutines (fan-out) and combine results (fan-in):

```go
package main

import (
    "fmt"
    "sync"
)

func producer(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

func fanOut(in <-chan int, workers int) []<-chan int {
    channels := make([]<-chan int, workers)
    for i := 0; i < workers; i++ {
        channels[i] = worker(in)
    }
    return channels
}

func worker(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

func fanIn(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup

    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for n := range c {
                out <- n
            }
        }(ch)
    }

    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}

func main() {
    input := producer(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)

    // Fan-out to 3 workers
    workers := fanOut(input, 3)

    // Fan-in results
    results := fanIn(workers...)

    // Consume results
    for result := range results {
        fmt.Println(result)
    }
}
```

### Pub-Sub Pattern

One publisher sends messages to multiple subscribers:

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type PubSub struct {
    mu          sync.RWMutex
    subscribers map[string][]chan string
}

func NewPubSub() *PubSub {
    return &PubSub{
        subscribers: make(map[string][]chan string),
    }
}

func (ps *PubSub) Subscribe(topic string) <-chan string {
    ps.mu.Lock()
    defer ps.mu.Unlock()

    ch := make(chan string, 10)
    ps.subscribers[topic] = append(ps.subscribers[topic], ch)
    return ch
}

func (ps *PubSub) Publish(topic, msg string) {
    ps.mu.RLock()
    defer ps.mu.RUnlock()

    for _, ch := range ps.subscribers[topic] {
        go func(c chan string) {
            c <- msg
        }(ch)
    }
}

func main() {
    ps := NewPubSub()

    // Create subscribers
    sub1 := ps.Subscribe("news")
    sub2 := ps.Subscribe("news")

    // Start subscribers
    go func() {
        for msg := range sub1 {
            fmt.Println("Subscriber 1:", msg)
        }
    }()

    go func() {
        for msg := range sub2 {
            fmt.Println("Subscriber 2:", msg)
        }
    }()

    // Publish messages
    ps.Publish("news", "Breaking news!")
    ps.Publish("news", "More updates...")

    time.Sleep(time.Second)
}
```

### Rate Limiting Pattern

Control the rate of operations:

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    requests := make(chan int, 5)
    for i := 1; i <= 5; i++ {
        requests <- i
    }
    close(requests)

    // Rate limiter: 1 request per 200ms
    limiter := time.Tick(200 * time.Millisecond)

    for req := range requests {
        <-limiter // Wait for rate limiter
        fmt.Println("Request", req, time.Now())
    }
}
```

**Bursty rate limiting:**

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    requests := make(chan int, 10)
    for i := 1; i <= 10; i++ {
        requests <- i
    }
    close(requests)

    // Allow bursts of 3 requests
    burstyLimiter := make(chan time.Time, 3)
    for i := 0; i < 3; i++ {
        burstyLimiter <- time.Now()
    }

    // Refill at 200ms intervals
    go func() {
        for t := range time.Tick(200 * time.Millisecond) {
            burstyLimiter <- t
        }
    }()

    for req := range requests {
        <-burstyLimiter
        fmt.Println("Request", req, time.Now())
    }
}
```

### Context-Based Cancellation

Using context for cancellation and timeout:

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func worker(ctx context.Context, id int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %d cancelled: %v\n", id, ctx.Err())
            return
        default:
            fmt.Printf("Worker %d working...\n", id)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    // Context with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    for i := 1; i <= 3; i++ {
        go worker(ctx, i)
    }

    // Wait for context to be cancelled
    <-ctx.Done()
    time.Sleep(1 * time.Second)
    fmt.Println("Main exiting")
}
```

## Best Practices

### Always Handle Goroutine Termination

Don't let goroutines leak. Ensure they have a way to exit:

```go
// WRONG: Goroutine might leak
func badExample() {
    ch := make(chan int)
    go func() {
        for {
            val := <-ch // Blocks forever if no one sends
            process(val)
        }
    }()
}

// CORRECT: Use context or done channel
func goodExample(ctx context.Context) {
    ch := make(chan int)
    go func() {
        for {
            select {
            case val := <-ch:
                process(val)
            case <-ctx.Done():
                return
            }
        }
    }()
}
```

### Close Channels Responsibly

Only the sender should close channels:

```go
func producer(ch chan<- int) {
    defer close(ch) // Close when done sending
    for i := 0; i < 10; i++ {
        ch <- i
    }
}

func consumer(ch <-chan int) {
    for val := range ch { // Exits when channel closes
        fmt.Println(val)
    }
}
```

### Use Buffered Channels Appropriately

```go
// For request-response patterns
ch := make(chan Response, 1)

// For fixed worker pools
jobs := make(chan Job, numWorkers)

// Don't over-buffer
ch := make(chan int, 1000000) // Usually unnecessary
```

### Avoid Sharing Memory

```go
// WRONG: Sharing memory
var counter int
for i := 0; i < 1000; i++ {
    go func() {
        counter++ // Race condition!
    }()
}

// CORRECT: Use channels or sync primitives
ch := make(chan int)
go func() {
    count := 0
    for range ch {
        count++
    }
}()
```

### Use sync.WaitGroup for Coordination

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done()
    fmt.Printf("Worker %d starting\n", id)
    time.Sleep(time.Second)
    fmt.Printf("Worker %d done\n", id)
}

func main() {
    var wg sync.WaitGroup

    for i := 1; i <= 5; i++ {
        wg.Add(1)
        go worker(i, &wg)
    }

    wg.Wait()
    fmt.Println("All workers completed")
}
```

### Design for Graceful Shutdown

```go
package main

import (
    "context"
    "fmt"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    ctx, cancel := context.WithCancel(context.Background())

    // Setup signal handling
    sigCh := make(chan os.Signal, 1)
    signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

    go func() {
        <-sigCh
        fmt.Println("\nReceived shutdown signal")
        cancel()
    }()

    // Start workers
    go worker(ctx, "A")
    go worker(ctx, "B")

    <-ctx.Done()
    time.Sleep(time.Second) // Allow cleanup
    fmt.Println("Shutdown complete")
}

func worker(ctx context.Context, name string) {
    ticker := time.NewTicker(500 * time.Millisecond)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %s shutting down\n", name)
            return
        case <-ticker.C:
            fmt.Printf("Worker %s tick\n", name)
        }
    }
}
```

### Avoid Goroutine Leaks

```go
// Use context for cancellation
func search(ctx context.Context, term string) (Result, error) {
    resultCh := make(chan Result, 1)

    go func() {
        result := performSearch(term)
        select {
        case resultCh <- result:
        case <-ctx.Done():
            // Cancelled, exit goroutine
        }
    }()

    select {
    case result := <-resultCh:
        return result, nil
    case <-ctx.Done():
        return Result{}, ctx.Err()
    }
}
```

## Summary

- **Goroutines** are lightweight threads perfect for concurrent execution
- **Channels** enable safe communication between goroutines
- **Unbuffered channels** provide synchronization; **buffered channels** allow asynchronous communication
- **Select** statement multiplexes channel operations
- Common patterns: worker pools, pipelines, fan-out/fan-in, pub-sub, rate limiting
- Always handle goroutine termination and avoid leaks
- Use `sync.WaitGroup` for coordination and `context` for cancellation
- Follow the principle: "Share memory by communicating, don't communicate by sharing memory"

Mastering goroutines and channels will enable you to write efficient, scalable concurrent programs in Go.
