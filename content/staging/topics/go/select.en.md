---
title: Go Select Statement
description: "Deep Understanding of Go select Statement: Multiplexing, Timeout Control, Non-blocking Operations and Concurrency Patterns"
track: go
section: concurrency
difficulty: intermediate
tags:
  - Go
  - select
  - channel
  - concurrency
  - timeout
status: imported
origin: old/src/content/docs/go/select.en.md
divergence: 0.184
issues: []
legacy:
  category: Go
  subcategory: Concurrency
  order: 3
  lastUpdated: 2026-01-07
---

Select is one of the core control structures for concurrent programming in Go. It allows a goroutine to wait on multiple channel operations simultaneously. Through select, we can implement key concurrency patterns such as timeout control, non-blocking communication, and task cancellation.

## Concept Explanation

### What is Select?

The select statement is similar to the switch statement, but it is specifically designed for channel operations. Each case must be a channel send or receive operation. Select blocks until one of the cases can execute.

```go
select {
case msg := <-ch1:
    // Received data from ch1
    fmt.Println("Received:", msg)
case ch2 <- value:
    // Successfully sent data to ch2
    fmt.Println("Sent:", value)
case <-time.After(time.Second):
    // Timeout
    fmt.Println("Timeout")
default:
    // Non-blocking: executes when all cases are blocked
    fmt.Println("No activity")
}
```

### Why Do We Need Select?

In concurrent programming, we often need to:

1. **Multiplex**: Monitor multiple channels simultaneously, responding to whichever data arrives first
2. **Timeout Control**: Prevent operations from blocking indefinitely
3. **Non-blocking Operations**: Attempt to send or receive, returning immediately on failure
4. **Graceful Cancellation**: Respond to cancellation signals, clean up resources and exit

Select provides an elegant and efficient solution.

### Historical Background

The design of select was inspired by Tony Hoare's CSP (Communicating Sequential Processes) theory. In CSP, processes synchronize and exchange data through communication rather than shared memory. Go's select directly implements the "selective communication" concept from CSP, allowing developers to concisely express the common concurrent need of "waiting for any one of multiple events".

## Core Principles

### Select Execution Flow

1. **Evaluate all cases**: All channel expressions and send value expressions are evaluated
2. **Check ready status**: Determine which cases can execute immediately (channel readable or writable)
3. **Select for execution**:
   - If one or more cases are ready, randomly select one to execute
   - If no case is ready but there is a default, execute default
   - If no case is ready and there is no default, block and wait
4. **Wake up**: When a channel becomes ready, execute the corresponding case

### Random Selection Mechanism

When multiple cases are ready simultaneously, the Go runtime uses a pseudo-random algorithm to select one of them. This is intentional design, aimed at:

- **Avoiding starvation**: Preventing some cases from never executing
- **Fairness**: Ensuring every ready case has a chance to be selected
- **Unpredictability**: Avoiding dependence on a specific execution order

```go
package main

import "fmt"

func main() {
    ch1 := make(chan string, 1)
    ch2 := make(chan string, 1)

    ch1 <- "one"
    ch2 <- "two"

    // Multiple executions may produce different results
    for i := 0; i < 5; i++ {
        // Refill channels
        select {
        case <-ch1:
        default:
        }
        select {
        case <-ch2:
        default:
        }
        ch1 <- "one"
        ch2 <- "two"

        // Random selection
        select {
        case msg := <-ch1:
            fmt.Printf("Iteration %d: selected ch1, value: %s
", i+1, msg)
        case msg := <-ch2:
            fmt.Printf("Iteration %d: selected ch2, value: %s
", i+1, msg)
        }
    }
}
```

### Underlying Implementation

In the Go runtime, the implementation of the select statement involves the following key steps:

1. **Build scase array**: Each case corresponds to an scase structure
2. **Lock all related channels**: Sorted by address to avoid deadlock
3. **Check ready cases**: Iterate through all cases, collect ready ones
4. **Random select or block**: If there are ready cases, randomly select one; otherwise, add the goroutine to each channel's wait queue
5. **Cleanup after waking**: Remove from other channels' wait queues

## Key Points

### Basic Syntax

```go
select {
case v := <-ch:      // Receive operation
    // Process received value
case ch <- v:        // Send operation
    // Send successful
case v, ok := <-ch:  // Receive and check channel status
    if !ok {
        // Channel is closed
    }
default:             // Optional default branch
    // Executes when all cases are blocked
}
```

### Empty Select

An empty select will block forever:

```go
select {}  // Blocks forever, commonly used to keep main goroutine running
```

### nil Channel Behavior

Operations on nil channels are ignored in select:

```go
var ch chan int  // nil channel

select {
case <-ch:       // Will never be selected
    fmt.Println("received")
default:
    fmt.Println("ch is nil, default executed")
}
```

This feature is commonly used to dynamically enable/disable cases:

```go
func process(enableA, enableB bool) {
    var chA, chB chan int

    if enableA {
        chA = make(chan int, 1)
        chA <- 1
    }
    if enableB {
        chB = make(chan int, 1)
        chB <- 2
    }

    select {
    case v := <-chA:  // When enableA is false, chA is nil, this case is disabled
        fmt.Println("A:", v)
    case v := <-chB:  // When enableB is false, chB is nil, this case is disabled
        fmt.Println("B:", v)
    default:
        fmt.Println("No channel enabled")
    }
}
```

### Single Case Select

A select with only one case is equivalent to a direct channel operation:

```go
// These two are equivalent
select {
case msg := <-ch:
    fmt.Println(msg)
}

msg := <-ch
fmt.Println(msg)
```

But adding default makes it meaningful:

```go
// Non-blocking receive
select {
case msg := <-ch:
    fmt.Println(msg)
default:
    fmt.Println("No message available")
}
```

## Code Examples

### Example 1: Basic Multiplexing

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)

    // Simulate two concurrent tasks
    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "Response from Service A"
    }()

    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "Response from Service B"
    }()

    // Wait for both responses
    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println("Received:", msg1)
        case msg2 := <-ch2:
            fmt.Println("Received:", msg2)
        }
    }
}
```

### Example 2: Default Case - Non-blocking Operations

```go
package main

import "fmt"

func main() {
    messages := make(chan string)
    signals := make(chan bool)

    // Non-blocking receive: try to receive, return immediately if no message
    select {
    case msg := <-messages:
        fmt.Println("Received message:", msg)
    default:
        fmt.Println("No message to receive")
    }

    // Non-blocking send: try to send, return immediately if channel is full or no receiver
    msg := "hello"
    select {
    case messages <- msg:
        fmt.Println("Message sent:", msg)
    default:
        fmt.Println("Cannot send message (no receiver)")
    }

    // Multi-way non-blocking select
    select {
    case msg := <-messages:
        fmt.Println("Received message:", msg)
    case sig := <-signals:
        fmt.Println("Received signal:", sig)
    default:
        fmt.Println("No activity")
    }
}
```

### Example 3: Timeout Pattern

```go
package main

import (
    "fmt"
    "time"
)

// Simulate a potentially slow operation
func slowOperation(result chan<- string) {
    time.Sleep(3 * time.Second)  // Simulate 3 second delay
    result <- "Operation completed"
}

func main() {
    result := make(chan string)

    go slowOperation(result)

    // Implement timeout using time.After
    select {
    case res := <-result:
        fmt.Println("Result:", res)
    case <-time.After(2 * time.Second):
        fmt.Println("Operation timed out!")
    }
}
```

**Multiple timeout retries:**

```go
package main

import (
    "fmt"
    "math/rand"
    "time"
)

func fetchData(id int) <-chan string {
    ch := make(chan string)
    go func() {
        // Random delay 0-500ms
        delay := time.Duration(rand.Intn(500)) * time.Millisecond
        time.Sleep(delay)
        ch <- fmt.Sprintf("Data %d (took %v)", id, delay)
    }()
    return ch
}

func main() {
    const maxRetries = 3
    timeout := 200 * time.Millisecond

    for i := 1; i <= maxRetries; i++ {
        ch := fetchData(i)

        select {
        case data := <-ch:
            fmt.Printf("Success: %s
", data)
            return
        case <-time.After(timeout):
            fmt.Printf("Attempt %d timed out
", i)
        }
    }
    fmt.Println("All retries failed")
}
```

### Example 4: Done Channel Pattern

```go
package main

import (
    "fmt"
    "time"
)

// worker keeps working until receiving stop signal
func worker(id int, done <-chan struct{}) {
    for {
        select {
        case <-done:
            fmt.Printf("Worker %d: received stop signal, exiting...
", id)
            return
        default:
            fmt.Printf("Worker %d: working...
", id)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    done := make(chan struct{})

    // Start 3 workers
    for i := 1; i <= 3; i++ {
        go worker(i, done)
    }

    // Let workers run for 2 seconds
    time.Sleep(2 * time.Second)

    // Close done channel to notify all workers to stop
    fmt.Println("
Main: sending stop signal")
    close(done)

    // Wait for workers to exit
    time.Sleep(1 * time.Second)
    fmt.Println("Main: exiting")
}
```

### Example 5: Heartbeat Pattern

```go
package main

import (
    "fmt"
    "time"
)

func workerWithHeartbeat(done <-chan struct{}, heartbeat chan<- struct{}) {
    ticker := time.NewTicker(500 * time.Millisecond)
    defer ticker.Stop()

    for {
        select {
        case <-done:
            fmt.Println("Worker: stopping")
            return
        case <-ticker.C:
            // Send heartbeat
            select {
            case heartbeat <- struct{}{}:
                fmt.Println("Worker: heartbeat sent")
            default:
                // Heartbeat channel full, skip
            }
            // Simulate work
            fmt.Println("Worker: executing task...")
        }
    }
}

func monitor(heartbeat <-chan struct{}, alert chan<- string) {
    timeout := time.Second

    for {
        select {
        case <-heartbeat:
            // Received heartbeat, reset timeout
            fmt.Println("Monitor: heartbeat received")
        case <-time.After(timeout):
            // Timeout without heartbeat
            alert <- "Warning: Worker may have stopped responding!"
            return
        }
    }
}

func main() {
    done := make(chan struct{})
    heartbeat := make(chan struct{}, 1)
    alert := make(chan string)

    go workerWithHeartbeat(done, heartbeat)
    go monitor(heartbeat, alert)

    // Stop worker after 3 seconds
    time.Sleep(3 * time.Second)
    close(done)

    // Wait for monitor alert
    select {
    case msg := <-alert:
        fmt.Println(msg)
    case <-time.After(2 * time.Second):
        fmt.Println("Test completed")
    }
}
```

### Example 6: Combined Use with Context

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func processWithContext(ctx context.Context, data <-chan int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Processor exiting: %v
", ctx.Err())
            return
        case value, ok := <-data:
            if !ok {
                fmt.Println("Data channel closed")
                return
            }
            fmt.Printf("Processing data: %d
", value)
        }
    }
}

func main() {
    // Create context with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()

    data := make(chan int)

    // Start processor
    go processWithContext(ctx, data)

    // Send some data
    go func() {
        for i := 1; i <= 10; i++ {
            select {
            case <-ctx.Done():
                fmt.Println("Sender exiting")
                return
            case data <- i:
                time.Sleep(500 * time.Millisecond)
            }
        }
        close(data)
    }()

    // Wait for context timeout
    <-ctx.Done()
    time.Sleep(100 * time.Millisecond)  // Wait for goroutine to print exit message
}
```

### Example 7: Priority Selection

Although select chooses randomly, priority can be implemented through nested select:

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    highPriority := make(chan string, 1)
    lowPriority := make(chan string, 1)
    done := make(chan struct{})

    // Priority handler
    go func() {
        for {
            select {
            case <-done:
                return
            default:
            }

            // Check high priority first
            select {
            case msg := <-highPriority:
                fmt.Println("[High Priority]", msg)
            default:
                // High priority empty, check both
                select {
                case msg := <-highPriority:
                    fmt.Println("[High Priority]", msg)
                case msg := <-lowPriority:
                    fmt.Println("[Low Priority]", msg)
                case <-done:
                    return
                }
            }
        }
    }()

    // Send messages
    highPriority <- "Urgent task 1"
    lowPriority <- "Normal task 1"
    highPriority <- "Urgent task 2"
    lowPriority <- "Normal task 2"

    time.Sleep(100 * time.Millisecond)
    close(done)
}
```

## Best Practices

### Always Handle Channel Closure

```go
// Recommended: Check if channel is closed
select {
case value, ok := <-ch:
    if !ok {
        // Channel is closed, perform cleanup
        return
    }
    process(value)
case <-done:
    return
}
```

### Beware of Memory Leaks with time.After

```go
// Not recommended: Using time.After in loop causes memory leak
for {
    select {
    case <-ch:
        // Process
    case <-time.After(time.Second):  // Creates new Timer each iteration
        // Timeout handling
    }
}

// Recommended: Use time.NewTimer and manage manually
timer := time.NewTimer(time.Second)
defer timer.Stop()

for {
    select {
    case <-ch:
        // Process
        if !timer.Stop() {
            <-timer.C
        }
        timer.Reset(time.Second)
    case <-timer.C:
        // Timeout handling
        timer.Reset(time.Second)
    }
}

// Or use Ticker for periodic checks
ticker := time.NewTicker(time.Second)
defer ticker.Stop()

for {
    select {
    case <-ch:
        // Process
    case <-ticker.C:
        // Periodic processing
    }
}
```

### Avoid Time-consuming Operations in select

```go
// Not recommended: Time-consuming operations in case
select {
case msg := <-ch:
    time.Sleep(10 * time.Second)  // Blocks other cases
    process(msg)
}

// Recommended: Receive quickly, process asynchronously
select {
case msg := <-ch:
    go process(msg)  // Async processing
case <-done:
    return
}
```

### Use done Channel Rather Than Raw Context

```go
// Recommended: Encapsulate done channel for clearer semantics
type Worker struct {
    done chan struct{}
}

func (w *Worker) Start() {
    w.done = make(chan struct{})
    go w.run()
}

func (w *Worker) Stop() {
    close(w.done)
}

func (w *Worker) run() {
    for {
        select {
        case <-w.done:
            return
        default:
            // Work
        }
    }
}
```

### Use default Appropriately

```go
// Scenario 1: Non-blocking send (for discardable data like logs, metrics)
select {
case logCh <- entry:
    // Send successful
default:
    // Channel full, discard log entry
}

// Scenario 2: Polling pattern
for {
    select {
    case <-done:
        return
    case task := <-taskCh:
        process(task)
    default:
        // No task, do other work or sleep briefly
        time.Sleep(10 * time.Millisecond)
    }
}
```

## Common Pitfalls

### time.After Memory Leak

```go
// Problem: Timers created by time.After won't be GC'd until they fire
func problematic() {
    ch := make(chan int)
    for {
        select {
        case <-ch:
            // Process
        case <-time.After(time.Hour):  // Creates new Timer each iteration, consuming memory
            // Timeout
        }
    }
}

// Solution: Use reusable Timer
func improved() {
    ch := make(chan int)
    timer := time.NewTimer(time.Hour)
    defer timer.Stop()

    for {
        select {
        case <-ch:
            // Process
            if !timer.Stop() {
                select {
                case <-timer.C:
                default:
                }
            }
            timer.Reset(time.Hour)
        case <-timer.C:
            // Timeout
            timer.Reset(time.Hour)
        }
    }
}
```

### Ignoring Send Failures

```go
// Problem: Silently ignoring failures when using default to send
select {
case ch <- important_data:
    // Send successful
default:
    // Silently discarding important data!
}

// Improvement: Log or handle failures
select {
case ch <- important_data:
    // Send successful
default:
    log.Warn("Channel full, data lost:", important_data)
    // Or use fallback strategy
    handleFailedSend(important_data)
}
```

### Deadlock Risk

```go
// Problem: select without default deadlocks when all channels block
func deadlock() {
    ch1 := make(chan int)
    ch2 := make(chan int)

    select {
    case <-ch1:  // Blocks
    case <-ch2:  // Blocks
    }  // Deadlock!
}

// Solution: Add timeout or default
func safe() {
    ch1 := make(chan int)
    ch2 := make(chan int)

    select {
    case <-ch1:
    case <-ch2:
    case <-time.After(time.Second):
        fmt.Println("Timeout")
    }
}
```

### break in for-select

```go
// Problem: break only exits select, not for
for {
    select {
    case <-done:
        break  // Only exits select! Loop continues
    case v := <-ch:
        process(v)
    }
}

// Solution 1: Use return
func worker(done <-chan struct{}, ch <-chan int) {
    for {
        select {
        case <-done:
            return  // Exit the entire function
        case v := <-ch:
            process(v)
        }
    }
}

// Solution 2: Use labeled break
func process() {
loop:
    for {
        select {
        case <-done:
            break loop  // Exit the for loop labeled by loop
        case v := <-ch:
            handle(v)
        }
    }
    // Continue with cleanup code
    cleanup()
}
```

### Evaluation Order in select

```go
// Problem: Both channel and send value are evaluated when select starts
func issue() {
    var ch chan int
    value := getValue()  // getValue is called even though ch is nil

    select {
    case ch <- value:  // ch is nil, will never execute, but value was already computed
    default:
    }
}

// Note: All case expressions are evaluated, including function calls
select {
case ch1 <- expensive1():  // expensive1() will be called
case ch2 <- expensive2():  // expensive2() will also be called
}
```

## Performance Considerations

### Select Overhead

The select statement has some runtime overhead, mainly from:

1. **Case evaluation**: All case channel and value expressions are evaluated
2. **Lock operations**: Need to lock all related channels
3. **Scheduling**: May involve goroutine sleep and wake up

### Benchmark Comparison

```go
package main

import (
    "testing"
)

func BenchmarkDirectReceive(b *testing.B) {
    ch := make(chan int, 1)
    for i := 0; i < b.N; i++ {
        ch <- i
        <-ch
    }
}

func BenchmarkSelectSingleCase(b *testing.B) {
    ch := make(chan int, 1)
    for i := 0; i < b.N; i++ {
        ch <- i
        select {
        case <-ch:
        }
    }
}

func BenchmarkSelectMultipleCases(b *testing.B) {
    ch1 := make(chan int, 1)
    ch2 := make(chan int, 1)
    for i := 0; i < b.N; i++ {
        ch1 <- i
        select {
        case <-ch1:
        case <-ch2:
        }
    }
}

func BenchmarkSelectWithDefault(b *testing.B) {
    ch := make(chan int, 1)
    for i := 0; i < b.N; i++ {
        ch <- i
        select {
        case <-ch:
        default:
        }
    }
}
```

### Optimization Suggestions

1. **Reduce case count**: More cases mean more overhead
2. **Use buffered channels**: Reduce blocking and context switching
3. **Avoid select in hot paths**: For performance-critical code, consider using single channel
4. **Batch processing**: Reduce select execution count

```go
// Before optimization: One select per message
for msg := range input {
    select {
    case <-done:
        return
    case output <- process(msg):
    }
}

// After optimization: Batch processing
batch := make([]Message, 0, 100)
ticker := time.NewTicker(100 * time.Millisecond)
defer ticker.Stop()

for {
    select {
    case <-done:
        return
    case msg := <-input:
        batch = append(batch, msg)
        if len(batch) >= 100 {
            sendBatch(output, batch)
            batch = batch[:0]
        }
    case <-ticker.C:
        if len(batch) > 0 {
            sendBatch(output, batch)
            batch = batch[:0]
        }
    }
}
```

## Practical Scenarios

### Scenario 1: HTTP Request Racing

Request multiple mirror sources simultaneously, return the fastest response:

```go
package main

import (
    "context"
    "fmt"
    "io"
    "net/http"
    "time"
)

func fetchFromMirror(ctx context.Context, url string) ([]byte, error) {
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}

func fetchWithRace(mirrors []string, timeout time.Duration) ([]byte, error) {
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()

    results := make(chan []byte, len(mirrors))
    errs := make(chan error, len(mirrors))

    for _, mirror := range mirrors {
        go func(url string) {
            data, err := fetchFromMirror(ctx, url)
            if err != nil {
                errs <- err
                return
            }
            results <- data
        }(mirror)
    }

    // Return the fastest result
    var lastErr error
    for i := 0; i < len(mirrors); i++ {
        select {
        case data := <-results:
            return data, nil  // Return on first successful result
        case err := <-errs:
            lastErr = err
        case <-ctx.Done():
            return nil, ctx.Err()
        }
    }

    return nil, lastErr
}

func main() {
    mirrors := []string{
        "https://example1.com/data",
        "https://example2.com/data",
        "https://example3.com/data",
    }

    data, err := fetchWithRace(mirrors, 5*time.Second)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Fetched data:", len(data), "bytes")
}
```

### Scenario 2: Rate Limiter

Implementing token bucket rate limiting using select:

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type RateLimiter struct {
    tokens    chan struct{}
    done      chan struct{}
    rate      int
    capacity  int
    once      sync.Once
}

func NewRateLimiter(rate, capacity int) *RateLimiter {
    rl := &RateLimiter{
        tokens:   make(chan struct{}, capacity),
        done:     make(chan struct{}),
        rate:     rate,
        capacity: capacity,
    }

    // Initially fill the token bucket
    for i := 0; i < capacity; i++ {
        rl.tokens <- struct{}{}
    }

    // Start token generator
    go rl.refill()

    return rl
}

func (rl *RateLimiter) refill() {
    ticker := time.NewTicker(time.Second / time.Duration(rl.rate))
    defer ticker.Stop()

    for {
        select {
        case <-rl.done:
            return
        case <-ticker.C:
            select {
            case rl.tokens <- struct{}{}:
                // Token added successfully
            default:
                // Bucket full, discard token
            }
        }
    }
}

func (rl *RateLimiter) Allow() bool {
    select {
    case <-rl.tokens:
        return true
    default:
        return false
    }
}

func (rl *RateLimiter) Wait() {
    <-rl.tokens
}

func (rl *RateLimiter) WaitWithTimeout(timeout time.Duration) bool {
    select {
    case <-rl.tokens:
        return true
    case <-time.After(timeout):
        return false
    }
}

func (rl *RateLimiter) Stop() {
    rl.once.Do(func() {
        close(rl.done)
    })
}

func main() {
    // 5 requests per second, max accumulation of 10
    limiter := NewRateLimiter(5, 10)
    defer limiter.Stop()

    // Simulate 20 requests
    for i := 1; i <= 20; i++ {
        if limiter.Allow() {
            fmt.Printf("Request %d: allowed
", i)
        } else {
            fmt.Printf("Request %d: denied, waiting...
", i)
            limiter.Wait()
            fmt.Printf("Request %d: now allowed
", i)
        }
    }
}
```

### Scenario 3: Event Dispatcher

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Event struct {
    Type    string
    Payload interface{}
}

type EventDispatcher struct {
    subscribers map[string][]chan Event
    events      chan Event
    done        chan struct{}
    mu          sync.RWMutex
}

func NewEventDispatcher() *EventDispatcher {
    ed := &EventDispatcher{
        subscribers: make(map[string][]chan Event),
        events:      make(chan Event, 100),
        done:        make(chan struct{}),
    }
    go ed.run()
    return ed
}

func (ed *EventDispatcher) Subscribe(eventType string) <-chan Event {
    ed.mu.Lock()
    defer ed.mu.Unlock()

    ch := make(chan Event, 10)
    ed.subscribers[eventType] = append(ed.subscribers[eventType], ch)
    return ch
}

func (ed *EventDispatcher) Publish(event Event) {
    select {
    case ed.events <- event:
    default:
        fmt.Println("Warning: Event queue full, discarding event")
    }
}

func (ed *EventDispatcher) run() {
    for {
        select {
        case <-ed.done:
            ed.cleanup()
            return
        case event := <-ed.events:
            ed.dispatch(event)
        }
    }
}

func (ed *EventDispatcher) dispatch(event Event) {
    ed.mu.RLock()
    defer ed.mu.RUnlock()

    // Send to specific type subscribers
    if subs, ok := ed.subscribers[event.Type]; ok {
        for _, ch := range subs {
            select {
            case ch <- event:
            default:
                // Subscriber channel full, skip
            }
        }
    }

    // Send to wildcard subscribers
    if subs, ok := ed.subscribers["*"]; ok {
        for _, ch := range subs {
            select {
            case ch <- event:
            default:
            }
        }
    }
}

func (ed *EventDispatcher) cleanup() {
    ed.mu.Lock()
    defer ed.mu.Unlock()

    for _, subs := range ed.subscribers {
        for _, ch := range subs {
            close(ch)
        }
    }
}

func (ed *EventDispatcher) Stop() {
    close(ed.done)
}

func main() {
    dispatcher := NewEventDispatcher()
    defer dispatcher.Stop()

    // Subscribe to user events
    userEvents := dispatcher.Subscribe("user")
    go func() {
        for event := range userEvents {
            fmt.Printf("User event handler: %s - %v
", event.Type, event.Payload)
        }
    }()

    // Subscribe to all events
    allEvents := dispatcher.Subscribe("*")
    go func() {
        for event := range allEvents {
            fmt.Printf("Logger: %s - %v
", event.Type, event.Payload)
        }
    }()

    // Publish events
    dispatcher.Publish(Event{Type: "user", Payload: "User logged in"})
    dispatcher.Publish(Event{Type: "order", Payload: "New order"})
    dispatcher.Publish(Event{Type: "user", Payload: "User logged out"})

    time.Sleep(100 * time.Millisecond)
}
```

## Interview Key Points

### Common Interview Questions

#### What is the execution flow of a select statement?

**Key Answer Points**:
- All case channel expressions and send values are evaluated
- Check which cases can execute immediately (not blocking)
- If multiple cases are ready, randomly select one to execute
- If no case is ready but there is a default, execute default
- If no case is ready and there is no default, block until a case becomes ready

#### Why is random selection used when multiple cases are ready?

**Key Answer Points**:
- Avoid starvation: Prevent some cases from never executing
- Ensure fairness: All ready cases have equal chance of being selected
- Unpredictability: Prevent dependency on specific execution order, avoid hidden bugs

#### How to implement non-blocking channel operations?

**Answer**: Use select with default:

```go
// Non-blocking send
select {
case ch <- value:
    // Send successful
default:
    // Send failed (channel full or no receiver)
}

// Non-blocking receive
select {
case value := <-ch:
    // Receive successful
default:
    // No data to receive
}
```

#### What happens with nil channel operations in select?

**Answer**: Operations on nil channels are ignored in select and will never be selected. This feature can be used to dynamically enable or disable certain cases.

#### What happens with an empty select?

**Answer**: An empty select (`select {}`) blocks forever because there are no cases and no default. It is commonly used to keep the main goroutine running.

#### What is the problem with using time.After in a loop?

**Answer**: Each call to time.After creates a new Timer. If used in a loop and the Timer hasn't fired, these Timers won't be garbage collected until they fire, causing memory leaks. Use time.NewTimer and manage it manually instead.

#### How to implement timeout with select?

**Answer**:

```go
select {
case result := <-ch:
    // Normal receive
case <-time.After(timeout):
    // Timeout handling
}

// Or use context
ctx, cancel := context.WithTimeout(context.Background(), timeout)
defer cancel()

select {
case result := <-ch:
    // Normal receive
case <-ctx.Done():
    // Timeout or cancelled
}
```

#### How to correctly exit a for-select loop?

**Answer**:
- Use return to exit the function directly
- Use labeled break: `break label`
- Use boolean variable control

```go
loop:
    for {
        select {
        case <-done:
            break loop  // Exit the for loop
        case v := <-ch:
            process(v)
        }
    }
```

### Design Question

#### Implement a semaphore with timeout

```go
type Semaphore struct {
    sem chan struct{}
}

func NewSemaphore(n int) *Semaphore {
    return &Semaphore{
        sem: make(chan struct{}, n),
    }
}

func (s *Semaphore) Acquire() {
    s.sem <- struct{}{}
}

func (s *Semaphore) AcquireWithTimeout(timeout time.Duration) bool {
    select {
    case s.sem <- struct{}{}:
        return true
    case <-time.After(timeout):
        return false
    }
}

func (s *Semaphore) Release() {
    <-s.sem
}
```

## Further Reading

### Official Documentation

- [The Go Programming Language Specification - Select statements](https://go.dev/ref/spec#Select_statements)
- [Effective Go - Channels](https://go.dev/doc/effective_go#channels)

### Recommended Articles

- [Go Concurrency Patterns: Pipelines and cancellation](https://go.dev/blog/pipelines)
- [Go Concurrency Patterns: Context](https://go.dev/blog/context)
- [Go Concurrency Patterns: Timing out, moving on](https://go.dev/blog/concurrency-timeouts)
- [Advanced Go Concurrency Patterns](https://go.dev/blog/io2013-talk-concurrency)

### Classic Books

- "Concurrency in Go" by Katherine Cox-Buday - In-depth coverage of Go concurrency patterns
- "The Go Programming Language" by Alan Donovan & Brian Kernighan - Chapter 8 on Goroutines and Channels

### Source Code Reading

- [runtime/select.go](https://github.com/golang/go/blob/master/src/runtime/select.go) - Runtime implementation of select
- [runtime/chan.go](https://github.com/golang/go/blob/master/src/runtime/chan.go) - Runtime implementation of channel
