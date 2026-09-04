---
title: 同步原语
description: Go sync包完全指南，Mutex、RWMutex、WaitGroup与Once
track: go
section: concurrency
difficulty: intermediate
tags:
  - Go
  - sync
  - Mutex
  - WaitGroup
status: imported
origin: old/src/content/docs/go/sync.en.md
divergence: 0.197
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 并发编程
  order: 8
  lastUpdated: 2026-01-07
---

In concurrent programming, when multiple goroutines access shared resources simultaneously, synchronization mechanisms must be used to ensure data consistency and program correctness. Go's `sync` package provides a series of powerful synchronization primitives. We explain in depth how to use each primitive and best practices.

## Why We Need Synchronization Primitives

Without synchronization mechanisms, multiple goroutines reading and writing shared variables simultaneously will cause **Data Race**:

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    counter := 0

    for i := 0; i < 1000; i++ {
        go func() {
            counter++ // Data race!
        }()
    }

    time.Sleep(time.Second)
    fmt.Println("Counter:", counter) // Result is unpredictable, may be less than 1000
}
```

Run `go run -race main.go` to detect data races. Solving this problem requires the use of synchronization primitives.

## Mutex

`sync.Mutex` is the most basic synchronization primitive, ensuring that only one goroutine can access the critical section at any given time.

### Basic Usage

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var mu sync.Mutex
    counter := 0
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()

            mu.Lock()
            counter++
            mu.Unlock()
        }()
    }

    wg.Wait()
    fmt.Println("Counter:", counter) // Always outputs 1000
}
```

### Using defer to Ensure Unlock

It's recommended to use `defer` to ensure the lock is always released, even if a panic occurs:

```go
func safeIncrement(mu *sync.Mutex, counter *int) {
    mu.Lock()
    defer mu.Unlock()

    // Even if a panic occurs here, the lock will be released
    *counter++
}
```

### Embedding Mutex in Structs

A more elegant approach is to embed the Mutex in the data structure that needs protection:

```go
type SafeCounter struct {
    mu    sync.Mutex
    value int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.value
}

func main() {
    counter := &SafeCounter{}
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Increment()
        }()
    }

    wg.Wait()
    fmt.Println("Counter:", counter.Value())
}
```

### Mutex Usage Considerations

1. **Do not copy Mutex**: A Mutex cannot be copied after use, otherwise undefined behavior will occur
2. **Do not recursively lock**: The same goroutine locking the same Mutex twice will cause a deadlock
3. **Lock granularity**: The scope of the lock should be as small as possible, only protecting the necessary critical section

```go
// Wrong: Mutex is copied
func bad(mu sync.Mutex) { // Pass by value copies
    mu.Lock()
    defer mu.Unlock()
}

// Correct: Pass pointer
func good(mu *sync.Mutex) {
    mu.Lock()
    defer mu.Unlock()
}
```

## RWMutex (Read-Write Lock)

When read operations far outnumber write operations, using `sync.RWMutex` can improve performance. It allows multiple read operations to proceed simultaneously, but write operations are mutually exclusive.

### Basic Usage

```go
type SafeMap struct {
    mu   sync.RWMutex
    data map[string]string
}

func NewSafeMap() *SafeMap {
    return &SafeMap{
        data: make(map[string]string),
    }
}

// Write operations use write lock
func (m *SafeMap) Set(key, value string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.data[key] = value
}

// Read operations use read lock
func (m *SafeMap) Get(key string) (string, bool) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    value, ok := m.data[key]
    return value, ok
}

// Delete operations use write lock
func (m *SafeMap) Delete(key string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    delete(m.data, key)
}

// Iteration operations use read lock
func (m *SafeMap) Len() int {
    m.mu.RLock()
    defer m.mu.RUnlock()
    return len(m.data)
}
```

### Read-Write Lock Rules

| Operation | Read Lock Held | Write Lock Held |
|-----------|----------------|-----------------|
| Acquire Read Lock | Allowed | Blocked |
| Acquire Write Lock | Blocked | Blocked |

### Performance Comparison Example

```go
package main

import (
    "sync"
    "testing"
)

type MutexMap struct {
    mu   sync.Mutex
    data map[string]int
}

type RWMutexMap struct {
    mu   sync.RWMutex
    data map[string]int
}

func BenchmarkMutexRead(b *testing.B) {
    m := &MutexMap{data: map[string]int{"key": 1}}
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            m.mu.Lock()
            _ = m.data["key"]
            m.mu.Unlock()
        }
    })
}

func BenchmarkRWMutexRead(b *testing.B) {
    m := &RWMutexMap{data: map[string]int{"key": 1}}
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            m.mu.RLock()
            _ = m.data["key"]
            m.mu.RUnlock()
        }
    })
}
```

In read-heavy, write-light scenarios, RWMutex performs significantly better than Mutex.

## WaitGroup

`sync.WaitGroup` is used to wait for a group of goroutines to complete execution.

### Basic Usage

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func main() {
    var wg sync.WaitGroup

    urls := []string{
        "https://example.com",
        "https://example.org",
        "https://example.net",
    }

    for _, url := range urls {
        wg.Add(1)
        go func(u string) {
            defer wg.Done()
            // Simulate network request
            time.Sleep(100 * time.Millisecond)
            fmt.Println("Fetched:", u)
        }(url)
    }

    wg.Wait() // Wait for all requests to complete
    fmt.Println("All done!")
}
```

### The Three Methods of WaitGroup

- `Add(delta int)`: Increases the counter value, usually called before starting a goroutine
- `Done()`: Decreases the counter value, equivalent to `Add(-1)`
- `Wait()`: Blocks until the counter becomes 0

### Common Mistakes

```go
// Mistake 1: Calling Add inside the goroutine
for i := 0; i < 10; i++ {
    go func() {
        wg.Add(1) // Wrong! May execute after Wait()
        defer wg.Done()
        // ...
    }()
}
wg.Wait()

// Correct: Call Add before starting the goroutine
for i := 0; i < 10; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        // ...
    }()
}
wg.Wait()
```

```go
// Mistake 2: Forgetting to call Done
wg.Add(1)
go func() {
    // Forgot defer wg.Done()
    // ...
}()
wg.Wait() // Blocks forever!
```

### WaitGroup Pattern with Error Collection

```go
package main

import (
    "errors"
    "fmt"
    "sync"
)

func main() {
    var wg sync.WaitGroup
    var mu sync.Mutex
    var errs []error

    tasks := []func() error{
        func() error { return nil },
        func() error { return errors.New("task 2 failed") },
        func() error { return nil },
        func() error { return errors.New("task 4 failed") },
    }

    for i, task := range tasks {
        wg.Add(1)
        go func(id int, t func() error) {
            defer wg.Done()
            if err := t(); err != nil {
                mu.Lock()
                errs = append(errs, fmt.Errorf("task %d: %w", id, err))
                mu.Unlock()
            }
        }(i+1, task)
    }

    wg.Wait()

    if len(errs) > 0 {
        fmt.Println("Errors occurred:")
        for _, err := range errs {
            fmt.Println(" -", err)
        }
    } else {
        fmt.Println("All tasks completed successfully")
    }
}
```

## Once (Single Execution)

`sync.Once` ensures that an operation is executed only once, commonly used for singleton patterns and lazy initialization.

### Basic Usage

```go
package main

import (
    "fmt"
    "sync"
)

var (
    instance *Database
    once     sync.Once
)

type Database struct {
    connection string
}

func GetDatabase() *Database {
    once.Do(func() {
        fmt.Println("Initializing database...")
        instance = &Database{
            connection: "mysql://localhost:3306",
        }
    })
    return instance
}

func main() {
    var wg sync.WaitGroup

    // Multiple goroutines getting the instance simultaneously
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            db := GetDatabase()
            fmt.Printf("Goroutine %d got: %p\n", id, db)
        }(i)
    }

    wg.Wait()
}
```

The output shows that "Initializing database..." will only be printed once, and all goroutines get the same instance.

### Characteristics of Once

1. **Thread-safe**: Multiple goroutines calling `Do` simultaneously is safe
2. **Executes only once**: Even if different functions are passed, only the first one will be executed
3. **Blocks and waits**: Subsequent calls wait for the first execution to complete

```go
var once sync.Once

func main() {
    once.Do(func() {
        fmt.Println("First")
    })

    once.Do(func() {
        fmt.Println("Second") // Will never execute
    })
}
```

### Once Pattern with Return Values

Go 1.21 introduced `sync.OnceValue` and `sync.OnceValues`:

```go
package main

import (
    "fmt"
    "sync"
)

var getConfig = sync.OnceValue(func() map[string]string {
    fmt.Println("Loading config...")
    return map[string]string{
        "host": "localhost",
        "port": "8080",
    }
})

func main() {
    // First call executes initialization
    config1 := getConfig()
    fmt.Println("Config:", config1)

    // Subsequent calls return the cached value directly
    config2 := getConfig()
    fmt.Println("Same instance:", config1["host"] == config2["host"])
}
```

For cases that might return errors:

```go
var loadData = sync.OnceValues(func() ([]byte, error) {
    return os.ReadFile("config.json")
})

func GetData() ([]byte, error) {
    return loadData()
}
```

## Cond (Condition Variable)

`sync.Cond` is used for condition waiting and notification between goroutines, suitable for producer-consumer patterns.

### Basic Usage

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Queue struct {
    items []int
    cond  *sync.Cond
}

func NewQueue() *Queue {
    return &Queue{
        cond: sync.NewCond(&sync.Mutex{}),
    }
}

func (q *Queue) Put(item int) {
    q.cond.L.Lock()
    defer q.cond.L.Unlock()

    q.items = append(q.items, item)
    q.cond.Signal() // Notify one waiting goroutine
}

func (q *Queue) Get() int {
    q.cond.L.Lock()
    defer q.cond.L.Unlock()

    // Use for loop instead of if to prevent spurious wakeups
    for len(q.items) == 0 {
        q.cond.Wait() // Wait for notification
    }

    item := q.items[0]
    q.items = q.items[1:]
    return item
}

func main() {
    queue := NewQueue()

    // Consumer
    go func() {
        for i := 0; i < 5; i++ {
            item := queue.Get()
            fmt.Println("Got:", item)
        }
    }()

    // Producer
    for i := 1; i <= 5; i++ {
        time.Sleep(100 * time.Millisecond)
        queue.Put(i)
        fmt.Println("Put:", i)
    }

    time.Sleep(time.Second)
}
```

### The Three Methods of Cond

- `Wait()`: Releases the lock and waits for notification, reacquires the lock when awakened
- `Signal()`: Wakes up one waiting goroutine
- `Broadcast()`: Wakes up all waiting goroutines

### Broadcast Notification Example

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func main() {
    var mu sync.Mutex
    cond := sync.NewCond(&mu)
    ready := false

    // Start multiple waiting goroutines
    for i := 1; i <= 3; i++ {
        go func(id int) {
            cond.L.Lock()
            for !ready {
                fmt.Printf("Worker %d waiting...\n", id)
                cond.Wait()
            }
            cond.L.Unlock()
            fmt.Printf("Worker %d started!\n", id)
        }(i)
    }

    time.Sleep(time.Second)

    // Notify all waiting goroutines
    cond.L.Lock()
    ready = true
    cond.L.Unlock()
    cond.Broadcast()

    time.Sleep(time.Second)
}
```

### Important Notes

1. `Wait()` must be called while holding the lock
2. Use a `for` loop to check conditions, not `if`, to prevent spurious wakeups
3. In most cases, channels are a better choice

## Pool (Object Pool)

`sync.Pool` is a temporary object pool used to store and reuse temporary objects, reducing memory allocation and GC pressure.

### Basic Usage

```go
package main

import (
    "bytes"
    "fmt"
    "sync"
)

var bufferPool = sync.Pool{
    New: func() interface{} {
        fmt.Println("Creating new buffer")
        return new(bytes.Buffer)
    },
}

func main() {
    // Get object from pool
    buf := bufferPool.Get().(*bytes.Buffer)
    buf.WriteString("Hello, ")
    buf.WriteString("World!")
    fmt.Println(buf.String())

    // Reset and put back in pool
    buf.Reset()
    bufferPool.Put(buf)

    // Get again (may be the same object)
    buf2 := bufferPool.Get().(*bytes.Buffer)
    buf2.WriteString("Reused!")
    fmt.Println(buf2.String())
}
```

### Practical Application: JSON Encoder Pool

```go
package main

import (
    "bytes"
    "encoding/json"
    "sync"
)

var encoderPool = sync.Pool{
    New: func() interface{} {
        return &bytes.Buffer{}
    },
}

func MarshalJSON(v interface{}) ([]byte, error) {
    buf := encoderPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        encoderPool.Put(buf)
    }()

    encoder := json.NewEncoder(buf)
    if err := encoder.Encode(v); err != nil {
        return nil, err
    }

    // Copy result because buf will be reused
    result := make([]byte, buf.Len())
    copy(result, buf.Bytes())
    return result, nil
}
```

### Characteristics of Pool

1. **Thread-safe**: Get and Put can be called by multiple goroutines simultaneously
2. **No survival guarantee**: Objects in the pool may be garbage collected at any time
3. **No size limit**: The pool scales automatically

### Performance Comparison

```go
func BenchmarkWithoutPool(b *testing.B) {
    for i := 0; i < b.N; i++ {
        buf := new(bytes.Buffer)
        buf.WriteString("Hello, World!")
        _ = buf.String()
    }
}

func BenchmarkWithPool(b *testing.B) {
    pool := sync.Pool{
        New: func() interface{} {
            return new(bytes.Buffer)
        },
    }

    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            buf := pool.Get().(*bytes.Buffer)
            buf.WriteString("Hello, World!")
            _ = buf.String()
            buf.Reset()
            pool.Put(buf)
        }
    })
}
```

In high-concurrency scenarios, using Pool can significantly reduce memory allocation frequency.

## sync/atomic (Atomic Operations)

The `sync/atomic` package provides low-level atomic operations, suitable for simple counters and flags.

### Basic Atomic Types (Go 1.19+)

```go
package main

import (
    "fmt"
    "sync"
    "sync/atomic"
)

func main() {
    var counter atomic.Int64
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Add(1)
        }()
    }

    wg.Wait()
    fmt.Println("Counter:", counter.Load())
}
```

### Common Atomic Types

```go
var (
    intVal    atomic.Int32
    int64Val  atomic.Int64
    uintVal   atomic.Uint32
    uint64Val atomic.Uint64
    boolVal   atomic.Bool
    ptrVal    atomic.Pointer[string]
)

func main() {
    // Int64 operations
    int64Val.Store(100)
    int64Val.Add(50)
    old := int64Val.Swap(200)
    fmt.Printf("Old: %d, New: %d\n", old, int64Val.Load())

    // Bool operations
    boolVal.Store(true)
    if boolVal.Load() {
        fmt.Println("Flag is true")
    }

    // Pointer operations
    s := "hello"
    ptrVal.Store(&s)
    fmt.Println("Pointer value:", *ptrVal.Load())

    // CompareAndSwap
    swapped := int64Val.CompareAndSwap(200, 300)
    fmt.Println("Swapped:", swapped, "Value:", int64Val.Load())
}
```

### Atomic Operations vs Mutex

| Feature | atomic | Mutex |
|---------|--------|-------|
| Use Case | Simple operations | Complex operations |
| Performance | Higher | Lower |
| Flexibility | Lower | Higher |
| Composability | Poor | Good |

### Implementing a Spin Lock

```go
type SpinLock struct {
    locked atomic.Bool
}

func (s *SpinLock) Lock() {
    for !s.locked.CompareAndSwap(false, true) {
        // Spin wait
    }
}

func (s *SpinLock) Unlock() {
    s.locked.Store(false)
}
```

### Lock-Free Counter

```go
type Counter struct {
    value atomic.Int64
}

func (c *Counter) Increment() int64 {
    return c.value.Add(1)
}

func (c *Counter) Decrement() int64 {
    return c.value.Add(-1)
}

func (c *Counter) Value() int64 {
    return c.value.Load()
}

func (c *Counter) Reset() {
    c.value.Store(0)
}
```

## sync.Map (Concurrent-Safe Map)

`sync.Map` is a Map specifically designed for concurrent scenarios, suitable for specific usage patterns.

### Basic Usage

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var m sync.Map

    // Store
    m.Store("name", "Alice")
    m.Store("age", 30)

    // Load
    if name, ok := m.Load("name"); ok {
        fmt.Println("Name:", name)
    }

    // LoadOrStore
    actual, loaded := m.LoadOrStore("city", "Beijing")
    fmt.Printf("City: %v, Loaded: %v\n", actual, loaded)

    // Delete
    m.Delete("age")

    // Range
    m.Range(func(key, value interface{}) bool {
        fmt.Printf("%v: %v\n", key, value)
        return true // Return false to stop iteration
    })
}
```

### Suitable Scenarios for sync.Map

1. **Key-value pairs are written once but read many times** (like caches)
2. **Multiple goroutines read and write different keys**

```go
// Scenario 1: Cache
var cache sync.Map

func GetFromCache(key string) (interface{}, bool) {
    return cache.Load(key)
}

func SetToCache(key string, value interface{}) {
    cache.Store(key, value)
}

// Scenario 2: Each goroutine operates on its own keys
func worker(id int, m *sync.Map) {
    key := fmt.Sprintf("worker-%d", id)
    m.Store(key, id*100)
    if v, ok := m.Load(key); ok {
        fmt.Printf("Worker %d: %v\n", id, v)
    }
}
```

### When Not to Use sync.Map

When frequently reading and writing the same key, using `map` + `RWMutex` may be more efficient:

```go
type SafeMap struct {
    mu   sync.RWMutex
    data map[string]interface{}
}

func (m *SafeMap) Load(key string) (interface{}, bool) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    v, ok := m.data[key]
    return v, ok
}

func (m *SafeMap) Store(key string, value interface{}) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.data[key] = value
}
```

## Practical Example: Concurrent-Safe Rate Limiter

Combining multiple synchronization primitives to implement a production-grade rate limiter:

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "sync/atomic"
    "time"
)

// RateLimiter Token bucket rate limiter
type RateLimiter struct {
    rate       float64       // Tokens generated per second
    burst      int64         // Bucket capacity
    tokens     atomic.Int64  // Current tokens (stored multiplied by 1000000)
    lastUpdate atomic.Int64  // Last update time (nanoseconds)
    mu         sync.Mutex    // Protects token updates
    once       sync.Once     // Ensures initialization only once
}

// NewRateLimiter creates a rate limiter
func NewRateLimiter(rate float64, burst int) *RateLimiter {
    rl := &RateLimiter{
        rate:  rate,
        burst: int64(burst),
    }
    rl.tokens.Store(int64(burst) * 1000000)
    rl.lastUpdate.Store(time.Now().UnixNano())
    return rl
}

// Allow attempts to acquire one token
func (rl *RateLimiter) Allow() bool {
    return rl.AllowN(1)
}

// AllowN attempts to acquire n tokens
func (rl *RateLimiter) AllowN(n int) bool {
    rl.mu.Lock()
    defer rl.mu.Unlock()

    now := time.Now().UnixNano()
    last := rl.lastUpdate.Load()
    elapsed := float64(now-last) / float64(time.Second)

    // Calculate new tokens
    newTokens := int64(elapsed * rl.rate * 1000000)
    current := rl.tokens.Load() + newTokens

    // Limit maximum tokens
    maxTokens := rl.burst * 1000000
    if current > maxTokens {
        current = maxTokens
    }

    // Check if there are enough tokens
    required := int64(n) * 1000000
    if current < required {
        return false
    }

    // Consume tokens
    rl.tokens.Store(current - required)
    rl.lastUpdate.Store(now)
    return true
}

// Wait waits until a token is acquired or context is canceled
func (rl *RateLimiter) Wait(ctx context.Context) error {
    for {
        if rl.Allow() {
            return nil
        }

        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(time.Millisecond * 10):
            // Continue trying
        }
    }
}

// Stats returns current state
func (rl *RateLimiter) Stats() (tokens float64, rate float64) {
    return float64(rl.tokens.Load()) / 1000000, rl.rate
}

func main() {
    // Create rate limiter: 10 requests per second, max accumulation of 20
    limiter := NewRateLimiter(10, 20)

    var wg sync.WaitGroup
    var allowed, denied atomic.Int64

    // Simulate 100 concurrent requests
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()

            if limiter.Allow() {
                allowed.Add(1)
                fmt.Printf("Request %d: allowed\n", id)
            } else {
                denied.Add(1)
                fmt.Printf("Request %d: denied\n", id)
            }
        }(i)
    }

    wg.Wait()

    tokens, rate := limiter.Stats()
    fmt.Printf("\nResults:\n")
    fmt.Printf("  Allowed: %d\n", allowed.Load())
    fmt.Printf("  Denied: %d\n", denied.Load())
    fmt.Printf("  Remaining tokens: %.2f\n", tokens)
    fmt.Printf("  Rate: %.2f/s\n", rate)
}
```

## Best Practices Summary

### Choosing the Right Synchronization Primitive

| Scenario | Recommended Solution |
|----------|---------------------|
| Simple counter | `atomic.Int64` |
| Protecting shared data | `sync.Mutex` |
| Read-heavy, write-light | `sync.RWMutex` |
| Waiting for multiple tasks | `sync.WaitGroup` |
| One-time initialization | `sync.Once` |
| Condition waiting | `sync.Cond` or channel |
| Object reuse | `sync.Pool` |
| Concurrent Map | `sync.Map` or `map` + `RWMutex` |

### Avoiding Common Mistakes

1. **Deadlock**: Ensure consistent lock acquisition order, use `defer` to release locks
2. **Copying locks**: Always pass lock pointers, don't copy
3. **Over-synchronization**: Only use locks when necessary, minimize critical sections
4. **Ignoring races**: Use `go run -race` to detect data races

### Performance Optimization Tips

1. Prefer channels for inter-goroutine communication
2. For simple operations, consider using atomic
3. Use RWMutex for read-heavy, write-light scenarios
4. Use Pool for frequently created temporary objects
5. Reduce lock granularity, avoid holding locks for long periods

## Conclusion

Go's synchronization primitives are designed to be simple yet powerful. Understanding the appropriate scenarios and correct usage of each primitive is fundamental to writing high-quality concurrent programs. In practice, choose the most suitable synchronization mechanism based on specific requirements while keeping the code simple and maintainable.

Remember Go's concurrency philosophy: **Don't communicate by sharing memory; share memory by communicating**. In many cases, channels are a more elegant solution than locks.
