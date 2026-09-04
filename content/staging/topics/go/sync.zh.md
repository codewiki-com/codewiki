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
origin: old/src/content/docs/go/sync.zh.md
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

在并发编程中，多个 goroutine 同时访问共享资源时，必须使用同步机制来保证数据的一致性和程序的正确性。Go 语言的 `sync` 包提供了一系列强大的同步原语，本文将深入讲解每一种原语的使用方法和最佳实践。

## 为什么需要同步原语

在没有同步机制的情况下，多个 goroutine 同时读写共享变量会导致**数据竞争（Data Race）**：

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
            counter++ // 数据竞争！
        }()
    }

    time.Sleep(time.Second)
    fmt.Println("Counter:", counter) // 结果不确定，可能小于1000
}
```

运行 `go run -race main.go` 可以检测到数据竞争。解决这个问题就需要使用同步原语。

## Mutex（互斥锁）

`sync.Mutex` 是最基本的同步原语，它保证同一时刻只有一个 goroutine 能够访问临界区。

### 基本用法

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
    fmt.Println("Counter:", counter) // 始终输出 1000
}
```

### 使用 defer 确保解锁

推荐使用 `defer` 来确保锁一定会被释放，即使发生 panic：

```go
func safeIncrement(mu *sync.Mutex, counter *int) {
    mu.Lock()
    defer mu.Unlock()

    // 即使这里发生 panic，锁也会被释放
    *counter++
}
```

### 将 Mutex 嵌入结构体

更优雅的做法是将 Mutex 嵌入到需要保护的数据结构中：

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

### Mutex 使用注意事项

1. **不要复制 Mutex**：Mutex 在使用后不能被复制，否则会导致未定义行为
2. **不要递归加锁**：同一个 goroutine 对同一个 Mutex 加锁两次会导致死锁
3. **锁的粒度**：锁的范围应该尽可能小，只保护必要的临界区

```go
// 错误：复制了 Mutex
func bad(mu sync.Mutex) { // 传值会复制
    mu.Lock()
    defer mu.Unlock()
}

// 正确：传递指针
func good(mu *sync.Mutex) {
    mu.Lock()
    defer mu.Unlock()
}
```

## RWMutex（读写锁）

当读操作远多于写操作时，使用 `sync.RWMutex` 可以提高性能。它允许多个读操作同时进行，但写操作是互斥的。

### 基本用法

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

// 写操作使用写锁
func (m *SafeMap) Set(key, value string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.data[key] = value
}

// 读操作使用读锁
func (m *SafeMap) Get(key string) (string, bool) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    value, ok := m.data[key]
    return value, ok
}

// 删除操作使用写锁
func (m *SafeMap) Delete(key string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    delete(m.data, key)
}

// 遍历操作使用读锁
func (m *SafeMap) Len() int {
    m.mu.RLock()
    defer m.mu.RUnlock()
    return len(m.data)
}
```

### 读写锁的规则

| 操作 | 读锁持有 | 写锁持有 |
|------|----------|----------|
| 获取读锁 | 允许 | 阻塞 |
| 获取写锁 | 阻塞 | 阻塞 |

### 性能对比示例

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

在读多写少的场景下，RWMutex 的性能明显优于 Mutex。

## WaitGroup（等待组）

`sync.WaitGroup` 用于等待一组 goroutine 完成执行。

### 基本用法

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
            // 模拟网络请求
            time.Sleep(100 * time.Millisecond)
            fmt.Println("Fetched:", u)
        }(url)
    }

    wg.Wait() // 等待所有请求完成
    fmt.Println("All done!")
}
```

### WaitGroup 的三个方法

- `Add(delta int)`：增加计数器的值，通常在启动 goroutine 前调用
- `Done()`：减少计数器的值，等价于 `Add(-1)`
- `Wait()`：阻塞直到计数器变为 0

### 常见错误

```go
// 错误 1：在 goroutine 内部调用 Add
for i := 0; i < 10; i++ {
    go func() {
        wg.Add(1) // 错误！可能在 Wait() 之后才执行
        defer wg.Done()
        // ...
    }()
}
wg.Wait()

// 正确：在启动 goroutine 前调用 Add
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
// 错误 2：忘记调用 Done
wg.Add(1)
go func() {
    // 忘记 defer wg.Done()
    // ...
}()
wg.Wait() // 永远阻塞！
```

### 带错误收集的 WaitGroup 模式

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

## Once（单次执行）

`sync.Once` 确保某个操作只执行一次，常用于单例模式和延迟初始化。

### 基本用法

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

    // 多个 goroutine 同时获取实例
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

输出显示 "Initializing database..." 只会打印一次，所有 goroutine 获取到的是同一个实例。

### Once 的特性

1. **线程安全**：多个 goroutine 同时调用 `Do` 是安全的
2. **只执行一次**：即使传入不同的函数，也只有第一个会被执行
3. **阻塞等待**：后续调用会等待第一次执行完成

```go
var once sync.Once

func main() {
    once.Do(func() {
        fmt.Println("First")
    })

    once.Do(func() {
        fmt.Println("Second") // 永远不会执行
    })
}
```

### 带返回值的 Once 模式

Go 1.21 引入了 `sync.OnceValue` 和 `sync.OnceValues`：

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
    // 第一次调用会执行初始化
    config1 := getConfig()
    fmt.Println("Config:", config1)

    // 后续调用直接返回缓存的值
    config2 := getConfig()
    fmt.Println("Same instance:", config1["host"] == config2["host"])
}
```

对于可能返回错误的情况：

```go
var loadData = sync.OnceValues(func() ([]byte, error) {
    return os.ReadFile("config.json")
})

func GetData() ([]byte, error) {
    return loadData()
}
```

## Cond（条件变量）

`sync.Cond` 用于 goroutine 之间的条件等待和通知，适用于生产者-消费者模式。

### 基本用法

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
    q.cond.Signal() // 通知一个等待的 goroutine
}

func (q *Queue) Get() int {
    q.cond.L.Lock()
    defer q.cond.L.Unlock()

    // 使用 for 循环而不是 if，防止虚假唤醒
    for len(q.items) == 0 {
        q.cond.Wait() // 等待通知
    }

    item := q.items[0]
    q.items = q.items[1:]
    return item
}

func main() {
    queue := NewQueue()

    // 消费者
    go func() {
        for i := 0; i < 5; i++ {
            item := queue.Get()
            fmt.Println("Got:", item)
        }
    }()

    // 生产者
    for i := 1; i <= 5; i++ {
        time.Sleep(100 * time.Millisecond)
        queue.Put(i)
        fmt.Println("Put:", i)
    }

    time.Sleep(time.Second)
}
```

### Cond 的三个方法

- `Wait()`：释放锁并等待通知，被唤醒后重新获取锁
- `Signal()`：唤醒一个等待的 goroutine
- `Broadcast()`：唤醒所有等待的 goroutine

### 广播通知示例

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

    // 启动多个等待的 goroutine
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

    // 通知所有等待的 goroutine
    cond.L.Lock()
    ready = true
    cond.L.Unlock()
    cond.Broadcast()

    time.Sleep(time.Second)
}
```

### 注意事项

1. 必须在持有锁的情况下调用 `Wait()`
2. 使用 `for` 循环检查条件，而不是 `if`，以防止虚假唤醒
3. 在大多数情况下，channel 是更好的选择

## Pool（对象池）

`sync.Pool` 是一个临时对象池，用于存储和复用临时对象，减少内存分配和 GC 压力。

### 基本用法

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
    // 从池中获取对象
    buf := bufferPool.Get().(*bytes.Buffer)
    buf.WriteString("Hello, ")
    buf.WriteString("World!")
    fmt.Println(buf.String())

    // 重置并放回池中
    buf.Reset()
    bufferPool.Put(buf)

    // 再次获取（可能是同一个对象）
    buf2 := bufferPool.Get().(*bytes.Buffer)
    buf2.WriteString("Reused!")
    fmt.Println(buf2.String())
}
```

### 实际应用：JSON 编码器池

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

    // 复制结果，因为 buf 会被重用
    result := make([]byte, buf.Len())
    copy(result, buf.Bytes())
    return result, nil
}
```

### Pool 的特性

1. **线程安全**：Get 和 Put 可以被多个 goroutine 同时调用
2. **不保证存活**：池中的对象可能在任何时候被 GC 回收
3. **无大小限制**：池会自动伸缩

### 性能对比

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

在高并发场景下，使用 Pool 可以显著减少内存分配次数。

## sync/atomic（原子操作）

`sync/atomic` 包提供了低级别的原子操作，适用于简单的计数器和标志位。

### 基本原子类型（Go 1.19+）

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

### 常用原子类型

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
    // Int64 操作
    int64Val.Store(100)
    int64Val.Add(50)
    old := int64Val.Swap(200)
    fmt.Printf("Old: %d, New: %d\n", old, int64Val.Load())

    // Bool 操作
    boolVal.Store(true)
    if boolVal.Load() {
        fmt.Println("Flag is true")
    }

    // Pointer 操作
    s := "hello"
    ptrVal.Store(&s)
    fmt.Println("Pointer value:", *ptrVal.Load())

    // CompareAndSwap
    swapped := int64Val.CompareAndSwap(200, 300)
    fmt.Println("Swapped:", swapped, "Value:", int64Val.Load())
}
```

### 原子操作 vs Mutex

| 特性 | atomic | Mutex |
|------|--------|-------|
| 适用场景 | 简单操作 | 复杂操作 |
| 性能 | 更高 | 较低 |
| 灵活性 | 较低 | 更高 |
| 可组合性 | 差 | 好 |

### 实现自旋锁

```go
type SpinLock struct {
    locked atomic.Bool
}

func (s *SpinLock) Lock() {
    for !s.locked.CompareAndSwap(false, true) {
        // 自旋等待
    }
}

func (s *SpinLock) Unlock() {
    s.locked.Store(false)
}
```

### 无锁计数器

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

## sync.Map（并发安全的 Map）

`sync.Map` 是专门为并发场景设计的 Map，适用于特定的使用模式。

### 基本用法

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var m sync.Map

    // 存储
    m.Store("name", "Alice")
    m.Store("age", 30)

    // 加载
    if name, ok := m.Load("name"); ok {
        fmt.Println("Name:", name)
    }

    // 加载或存储
    actual, loaded := m.LoadOrStore("city", "Beijing")
    fmt.Printf("City: %v, Loaded: %v\n", actual, loaded)

    // 删除
    m.Delete("age")

    // 遍历
    m.Range(func(key, value interface{}) bool {
        fmt.Printf("%v: %v\n", key, value)
        return true // 返回 false 停止遍历
    })
}
```

### sync.Map 的适用场景

1. **键值对只写入一次，但读取多次**（如缓存）
2. **多个 goroutine 读写不同的键**

```go
// 场景 1：缓存
var cache sync.Map

func GetFromCache(key string) (interface{}, bool) {
    return cache.Load(key)
}

func SetToCache(key string, value interface{}) {
    cache.Store(key, value)
}

// 场景 2：每个 goroutine 操作自己的键
func worker(id int, m *sync.Map) {
    key := fmt.Sprintf("worker-%d", id)
    m.Store(key, id*100)
    if v, ok := m.Load(key); ok {
        fmt.Printf("Worker %d: %v\n", id, v)
    }
}
```

### 何时不使用 sync.Map

当需要频繁读写同一个键时，使用 `map` + `RWMutex` 可能更高效：

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

## 综合实战：并发安全的限速器

结合多种同步原语实现一个生产级别的限速器：

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "sync/atomic"
    "time"
)

// RateLimiter 令牌桶限速器
type RateLimiter struct {
    rate       float64       // 每秒生成的令牌数
    burst      int64         // 桶容量
    tokens     atomic.Int64  // 当前令牌数（乘以1000000存储）
    lastUpdate atomic.Int64  // 上次更新时间（纳秒）
    mu         sync.Mutex    // 保护令牌更新
    once       sync.Once     // 确保只初始化一次
}

// NewRateLimiter 创建限速器
func NewRateLimiter(rate float64, burst int) *RateLimiter {
    rl := &RateLimiter{
        rate:  rate,
        burst: int64(burst),
    }
    rl.tokens.Store(int64(burst) * 1000000)
    rl.lastUpdate.Store(time.Now().UnixNano())
    return rl
}

// Allow 尝试获取一个令牌
func (rl *RateLimiter) Allow() bool {
    return rl.AllowN(1)
}

// AllowN 尝试获取 n 个令牌
func (rl *RateLimiter) AllowN(n int) bool {
    rl.mu.Lock()
    defer rl.mu.Unlock()

    now := time.Now().UnixNano()
    last := rl.lastUpdate.Load()
    elapsed := float64(now-last) / float64(time.Second)

    // 计算新增的令牌
    newTokens := int64(elapsed * rl.rate * 1000000)
    current := rl.tokens.Load() + newTokens

    // 限制最大令牌数
    maxTokens := rl.burst * 1000000
    if current > maxTokens {
        current = maxTokens
    }

    // 检查是否有足够的令牌
    required := int64(n) * 1000000
    if current < required {
        return false
    }

    // 消费令牌
    rl.tokens.Store(current - required)
    rl.lastUpdate.Store(now)
    return true
}

// Wait 等待直到获取令牌或上下文取消
func (rl *RateLimiter) Wait(ctx context.Context) error {
    for {
        if rl.Allow() {
            return nil
        }

        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(time.Millisecond * 10):
            // 继续尝试
        }
    }
}

// Stats 返回当前状态
func (rl *RateLimiter) Stats() (tokens float64, rate float64) {
    return float64(rl.tokens.Load()) / 1000000, rl.rate
}

func main() {
    // 创建限速器：每秒10个请求，最多积累20个
    limiter := NewRateLimiter(10, 20)

    var wg sync.WaitGroup
    var allowed, denied atomic.Int64

    // 模拟100个并发请求
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

## 最佳实践总结

### 选择合适的同步原语

| 场景 | 推荐方案 |
|------|----------|
| 简单计数器 | `atomic.Int64` |
| 保护共享数据 | `sync.Mutex` |
| 读多写少 | `sync.RWMutex` |
| 等待多个任务 | `sync.WaitGroup` |
| 单次初始化 | `sync.Once` |
| 条件等待 | `sync.Cond` 或 channel |
| 对象复用 | `sync.Pool` |
| 并发 Map | `sync.Map` 或 `map` + `RWMutex` |

### 避免常见错误

1. **死锁**：确保锁的获取顺序一致，使用 `defer` 释放锁
2. **复制锁**：始终传递锁的指针，不要复制
3. **过度同步**：只在必要时使用锁，缩小临界区
4. **忽略竞态**：使用 `go run -race` 检测数据竞争

### 性能优化建议

1. 优先使用 channel 进行 goroutine 间通信
2. 对于简单操作，考虑使用 atomic
3. 读多写少时使用 RWMutex
4. 高频创建临时对象时使用 Pool
5. 减小锁的粒度，避免长时间持有锁

## 结语

Go 的同步原语设计简洁而强大。理解每种原语的适用场景和正确用法，是编写高质量并发程序的基础。在实际开发中，应该根据具体需求选择最合适的同步机制，同时保持代码的简洁和可维护性。

记住 Go 的并发哲学：**不要通过共享内存来通信，而要通过通信来共享内存**。在很多情况下，channel 是比锁更优雅的解决方案。
