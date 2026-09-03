---
title: Context上下文
description: Go Context完全指南，请求取消、超时控制与值传递
track: go
section: stdlib
difficulty: intermediate
tags:
  - Go
  - Context
  - 取消
  - 超时
status: imported
origin: old/src/content/docs/go/context.zh.md
divergence: 0.2
issues: []
legacy:
  category: Go
  subcategory: 核心概念
  order: 7
  lastUpdated: 2026-01-07
---

Context 是 Go 语言中用于在 goroutine 之间传递取消信号、超时控制和请求范围值的核心机制。它定义了 API 边界和进程之间传递截止时间、取消信号和其他请求范围值的标准方式。

## 为什么需要 Context

在构建 Go 服务时，我们经常面临以下场景：

1. **请求取消**：用户取消了请求，需要停止所有相关的后台工作
2. **超时控制**：数据库查询、HTTP 请求需要在指定时间内完成
3. **请求追踪**：在整个调用链中传递请求 ID、用户信息等元数据
4. **资源清理**：确保 goroutine 能够优雅退出，避免资源泄漏

Context 提供了统一、标准的解决方案。

## Context 接口详解

```go
type Context interface {
    // Deadline 返回 context 被取消的截止时间
    // 如果没有设置截止时间，ok 返回 false
    Deadline() (deadline time.Time, ok bool)

    // Done 返回一个 channel，当 context 被取消时关闭
    // 如果 context 永远不会被取消，Done 返回 nil
    Done() <-chan struct{}

    // Err 返回 context 被取消的原因
    // 如果 Done channel 未关闭，返回 nil
    // 如果被取消，返回 Canceled
    // 如果超时，返回 DeadlineExceeded
    Err() error

    // Value 返回与 key 关联的值
    // 如果没有关联的值，返回 nil
    Value(key any) any
}
```

## 创建根 Context

Go 提供了两个函数来创建根 Context：`context.Background()` 和 `context.TODO()`。

### context.Background()

`Background` 返回一个非 nil 的空 Context。它永远不会被取消，没有值，也没有截止时间。

```go
package main

import (
    "context"
    "fmt"
)

func main() {
    // 创建根 context
    ctx := context.Background()

    // 查看 context 的状态
    deadline, ok := ctx.Deadline()
    fmt.Printf("有截止时间: %v\n", ok)           // false
    fmt.Printf("截止时间: %v\n", deadline)        // 0001-01-01 00:00:00 +0000 UTC
    fmt.Printf("Done channel: %v\n", ctx.Done()) // <nil>
    fmt.Printf("错误: %v\n", ctx.Err())           // <nil>
}
```

**使用场景**：
- main 函数中作为顶级 Context
- 初始化代码中
- 测试代码中
- 作为传入请求的顶级 Context

### context.TODO()

`TODO` 也返回一个非 nil 的空 Context，语义上表示"我不确定该使用哪个 Context"。

```go
func processData() {
    // 当不确定该用什么 context 时，使用 TODO
    // 这通常是临时的，之后应该替换为合适的 context
    ctx := context.TODO()

    // 使用 ctx 进行操作
    doWork(ctx)
}
```

**使用场景**：
- 代码重构过程中，尚未确定正确的 Context
- 静态分析工具可以检测到 TODO 的使用，提醒开发者处理

**重要提示**：永远不要传递 nil Context。如果不确定该使用什么 Context，使用 `context.TODO()`。

## WithCancel：手动取消控制

`WithCancel` 返回一个派生的 Context 和一个取消函数。调用取消函数会关闭 Context 的 Done channel。

### 基本用法

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func worker(ctx context.Context, id int, done chan<- bool) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %d: 收到取消信号，原因: %v\n", id, ctx.Err())
            done <- true
            return
        default:
            fmt.Printf("Worker %d: 正在工作...\n", id)
            time.Sleep(300 * time.Millisecond)
        }
    }
}

func main() {
    // 从 Background 派生一个可取消的 context
    ctx, cancel := context.WithCancel(context.Background())

    done := make(chan bool, 3)

    // 启动多个 worker
    for i := 1; i <= 3; i++ {
        go worker(ctx, i, done)
    }

    // 让 worker 工作 1 秒
    time.Sleep(1 * time.Second)

    // 取消所有 worker
    fmt.Println("\n主程序: 发送取消信号")
    cancel()

    // 等待所有 worker 退出
    for i := 0; i < 3; i++ {
        <-done
    }
    fmt.Println("所有 worker 已退出")
}
```

### 级联取消

当父 Context 被取消时，所有从它派生的子 Context 也会被取消。

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    // 创建 context 层级
    rootCtx := context.Background()

    parentCtx, parentCancel := context.WithCancel(rootCtx)
    childCtx1, childCancel1 := context.WithCancel(parentCtx)
    childCtx2, childCancel2 := context.WithCancel(parentCtx)
    grandchildCtx, grandchildCancel := context.WithCancel(childCtx1)

    // 监控所有 context
    go func() {
        <-grandchildCtx.Done()
        fmt.Println("孙子 context 被取消:", grandchildCtx.Err())
    }()

    go func() {
        <-childCtx1.Done()
        fmt.Println("子 context 1 被取消:", childCtx1.Err())
    }()

    go func() {
        <-childCtx2.Done()
        fmt.Println("子 context 2 被取消:", childCtx2.Err())
    }()

    time.Sleep(100 * time.Millisecond)

    // 取消父 context 会级联取消所有子孙 context
    fmt.Println("取消父 context...")
    parentCancel()

    time.Sleep(100 * time.Millisecond)

    // 这些调用是安全的，但不会有额外效果
    childCancel1()
    childCancel2()
    grandchildCancel()
}
```

**输出**：
```
取消父 context...
孙子 context 被取消: context canceled
子 context 1 被取消: context canceled
子 context 2 被取消: context canceled
```

### WithCancelCause：带原因的取消

Go 1.20 引入了 `WithCancelCause`，允许在取消时指定原因。

```go
package main

import (
    "context"
    "errors"
    "fmt"
)

var ErrUserCanceled = errors.New("用户主动取消操作")

func main() {
    ctx, cancel := context.WithCancelCause(context.Background())

    go func() {
        <-ctx.Done()
        fmt.Println("Context 错误:", ctx.Err())
        fmt.Println("取消原因:", context.Cause(ctx))
    }()

    // 取消时提供原因
    cancel(ErrUserCanceled)

    // 给 goroutine 时间打印
    select {}
}
```

**输出**：
```
Context 错误: context canceled
取消原因: 用户主动取消操作
```

## WithTimeout：超时控制

`WithTimeout` 创建一个在指定时间后自动取消的 Context。这是处理超时最常用的方式。

### 基本用法

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func slowOperation(ctx context.Context) (string, error) {
    // 模拟耗时操作
    select {
    case <-time.After(3 * time.Second):
        return "操作完成", nil
    case <-ctx.Done():
        return "", ctx.Err()
    }
}

func main() {
    // 创建 2 秒超时的 context
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel() // 重要：始终调用 cancel 释放资源

    fmt.Println("开始执行操作...")
    start := time.Now()

    result, err := slowOperation(ctx)

    elapsed := time.Since(start)
    if err != nil {
        fmt.Printf("操作失败 (耗时 %.2fs): %v\n", elapsed.Seconds(), err)
    } else {
        fmt.Printf("操作成功 (耗时 %.2fs): %s\n", elapsed.Seconds(), result)
    }
}
```

**输出**：
```
开始执行操作...
操作失败 (耗时 2.00s): context deadline exceeded
```

### HTTP 请求超时

```go
package main

import (
    "context"
    "fmt"
    "io"
    "net/http"
    "time"
)

func fetchWithTimeout(url string, timeout time.Duration) ([]byte, error) {
    // 创建带超时的 context
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()

    // 创建带 context 的请求
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("创建请求失败: %w", err)
    }

    // 发送请求
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("请求失败: %w", err)
    }
    defer resp.Body.Close()

    // 读取响应
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, fmt.Errorf("读取响应失败: %w", err)
    }

    return body, nil
}

func main() {
    url := "https://httpbin.org/delay/5" // 延迟 5 秒响应

    fmt.Println("发送请求 (3秒超时)...")
    start := time.Now()

    _, err := fetchWithTimeout(url, 3*time.Second)

    elapsed := time.Since(start)
    if err != nil {
        fmt.Printf("请求失败 (耗时 %.2fs): %v\n", elapsed.Seconds(), err)
    }
}
```

### 嵌套超时

子 Context 的超时不能超过父 Context。

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    // 父 context: 2 秒超时
    parentCtx, parentCancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer parentCancel()

    // 子 context 尝试设置 5 秒超时
    // 但实际会被父 context 的 2 秒限制
    childCtx, childCancel := context.WithTimeout(parentCtx, 5*time.Second)
    defer childCancel()

    // 检查实际的截止时间
    if deadline, ok := childCtx.Deadline(); ok {
        remaining := time.Until(deadline)
        fmt.Printf("子 context 实际剩余时间: %.2f 秒\n", remaining.Seconds())
    }

    // 等待子 context 超时
    <-childCtx.Done()
    fmt.Println("子 context 已超时:", childCtx.Err())
}
```

**输出**：
```
子 context 实际剩余时间: 2.00 秒
子 context 已超时: context deadline exceeded
```

## WithDeadline：截止时间控制

`WithDeadline` 与 `WithTimeout` 类似，但使用绝对时间而非相对时间。

### 基本用法

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func processTask(ctx context.Context, taskName string) error {
    // 检查剩余时间
    if deadline, ok := ctx.Deadline(); ok {
        remaining := time.Until(deadline)
        fmt.Printf("%s: 剩余时间 %.2f 秒\n", taskName, remaining.Seconds())

        if remaining < 100*time.Millisecond {
            return fmt.Errorf("剩余时间不足")
        }
    }

    // 模拟任务执行
    select {
    case <-time.After(500 * time.Millisecond):
        fmt.Printf("%s: 完成\n", taskName)
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}

func main() {
    // 设置 1.2 秒后的截止时间
    deadline := time.Now().Add(1200 * time.Millisecond)
    ctx, cancel := context.WithDeadline(context.Background(), deadline)
    defer cancel()

    fmt.Printf("截止时间: %s\n", deadline.Format("15:04:05.000"))

    // 执行多个任务
    tasks := []string{"任务A", "任务B", "任务C"}
    for _, task := range tasks {
        if err := processTask(ctx, task); err != nil {
            fmt.Printf("%s 失败: %v\n", task, err)
            break
        }
    }
}
```

### WithTimeout vs WithDeadline

```go
// 这两种写法在功能上等价
timeout := 5 * time.Second

ctx1, cancel1 := context.WithTimeout(context.Background(), timeout)
defer cancel1()

deadline := time.Now().Add(timeout)
ctx2, cancel2 := context.WithDeadline(context.Background(), deadline)
defer cancel2()
```

**选择建议**：
- **WithTimeout**：当你知道"操作需要多长时间"时使用
- **WithDeadline**：当你知道"操作必须在某个时刻前完成"时使用

## WithValue：传递请求范围值

`WithValue` 用于在调用链中传递请求相关的元数据。

### 基本用法

```go
package main

import (
    "context"
    "fmt"
)

// 使用自定义类型作为 key，避免冲突
type contextKey string

const (
    userIDKey    contextKey = "userID"
    requestIDKey contextKey = "requestID"
    traceIDKey   contextKey = "traceID"
)

func handleRequest(ctx context.Context) {
    userID := ctx.Value(userIDKey)
    requestID := ctx.Value(requestIDKey)
    traceID := ctx.Value(traceIDKey)

    fmt.Printf("处理请求:\n")
    fmt.Printf("  用户ID: %v\n", userID)
    fmt.Printf("  请求ID: %v\n", requestID)
    fmt.Printf("  追踪ID: %v\n", traceID)
}

func main() {
    // 逐层添加值
    ctx := context.Background()
    ctx = context.WithValue(ctx, userIDKey, "user-12345")
    ctx = context.WithValue(ctx, requestIDKey, "req-67890")
    ctx = context.WithValue(ctx, traceIDKey, "trace-abcdef")

    handleRequest(ctx)
}
```

### 类型安全的封装

最佳实践是为 Context 值提供类型安全的访问函数。

```go
package main

import (
    "context"
    "fmt"
)

// key 类型不导出，防止外部直接访问
type ctxKey int

const (
    userKey ctxKey = iota
    requestKey
)

// User 表示用户信息
type User struct {
    ID       string
    Name     string
    Email    string
    IsAdmin  bool
}

// Request 表示请求信息
type Request struct {
    ID        string
    IP        string
    UserAgent string
}

// WithUser 将用户信息添加到 context
func WithUser(ctx context.Context, user *User) context.Context {
    return context.WithValue(ctx, userKey, user)
}

// GetUser 从 context 获取用户信息
func GetUser(ctx context.Context) (*User, bool) {
    user, ok := ctx.Value(userKey).(*User)
    return user, ok
}

// WithRequest 将请求信息添加到 context
func WithRequest(ctx context.Context, req *Request) context.Context {
    return context.WithValue(ctx, requestKey, req)
}

// GetRequest 从 context 获取请求信息
func GetRequest(ctx context.Context) (*Request, bool) {
    req, ok := ctx.Value(requestKey).(*Request)
    return req, ok
}

func processRequest(ctx context.Context) {
    // 类型安全地获取值
    if user, ok := GetUser(ctx); ok {
        fmt.Printf("用户: %s (%s)\n", user.Name, user.Email)
        if user.IsAdmin {
            fmt.Println("权限: 管理员")
        }
    }

    if req, ok := GetRequest(ctx); ok {
        fmt.Printf("请求ID: %s\n", req.ID)
        fmt.Printf("客户端IP: %s\n", req.IP)
    }
}

func main() {
    ctx := context.Background()

    // 添加用户信息
    user := &User{
        ID:      "u-001",
        Name:    "张三",
        Email:   "zhangsan@example.com",
        IsAdmin: true,
    }
    ctx = WithUser(ctx, user)

    // 添加请求信息
    req := &Request{
        ID:        "req-123456",
        IP:        "192.168.1.100",
        UserAgent: "Mozilla/5.0",
    }
    ctx = WithRequest(ctx, req)

    processRequest(ctx)
}
```

### WithValue 使用原则

**适合存储的数据**：
- 请求 ID、追踪 ID
- 用户身份认证信息
- 来源 IP、User-Agent
- 请求开始时间
- 日志相关的元数据

**不应该存储的数据**：
- 函数的可选参数
- 业务逻辑数据
- 数据库连接、配置对象
- 可变的共享状态

```go
// 不好的做法：使用 context 传递可选参数
func badExample(ctx context.Context) {
    debug := ctx.Value("debug").(bool) // 危险且不清晰
    if debug {
        // ...
    }
}

// 好的做法：显式参数
func goodExample(ctx context.Context, debug bool) {
    if debug {
        // ...
    }
}
```

## 实战应用场景

### 数据库查询超时

```go
package main

import (
    "context"
    "database/sql"
    "fmt"
    "time"

    _ "github.com/go-sql-driver/mysql"
)

type UserRepository struct {
    db *sql.DB
}

func (r *UserRepository) FindByID(ctx context.Context, id int64) (*User, error) {
    // 设置查询超时
    ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
    defer cancel()

    var user User
    query := "SELECT id, name, email, created_at FROM users WHERE id = ?"

    err := r.db.QueryRowContext(ctx, query, id).Scan(
        &user.ID,
        &user.Name,
        &user.Email,
        &user.CreatedAt,
    )

    if err != nil {
        if err == context.DeadlineExceeded {
            return nil, fmt.Errorf("查询超时")
        }
        return nil, err
    }

    return &user, nil
}

func (r *UserRepository) FindAll(ctx context.Context) ([]*User, error) {
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()

    query := "SELECT id, name, email, created_at FROM users"
    rows, err := r.db.QueryContext(ctx, query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []*User
    for rows.Next() {
        // 每次迭代检查 context
        select {
        case <-ctx.Done():
            return nil, ctx.Err()
        default:
        }

        var user User
        if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt); err != nil {
            return nil, err
        }
        users = append(users, &user)
    }

    return users, rows.Err()
}

type User struct {
    ID        int64
    Name      string
    Email     string
    CreatedAt time.Time
}
```

### 并发任务协调

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

type Result struct {
    Source string
    Data   string
    Err    error
}

func fetchFromSource(ctx context.Context, source string, delay time.Duration) Result {
    select {
    case <-time.After(delay):
        return Result{
            Source: source,
            Data:   fmt.Sprintf("来自 %s 的数据", source),
        }
    case <-ctx.Done():
        return Result{
            Source: source,
            Err:    ctx.Err(),
        }
    }
}

func fetchAll(ctx context.Context) []Result {
    sources := []struct {
        name  string
        delay time.Duration
    }{
        {"缓存", 100 * time.Millisecond},
        {"数据库", 500 * time.Millisecond},
        {"外部API", 2 * time.Second},
    }

    results := make(chan Result, len(sources))
    var wg sync.WaitGroup

    for _, src := range sources {
        wg.Add(1)
        go func(name string, delay time.Duration) {
            defer wg.Done()
            results <- fetchFromSource(ctx, name, delay)
        }(src.name, src.delay)
    }

    // 等待所有请求完成后关闭 channel
    go func() {
        wg.Wait()
        close(results)
    }()

    // 收集结果
    var allResults []Result
    for result := range results {
        allResults = append(allResults, result)
    }

    return allResults
}

func main() {
    // 设置 1 秒超时
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel()

    fmt.Println("开始并发获取数据...")
    results := fetchAll(ctx)

    fmt.Println("\n结果:")
    for _, r := range results {
        if r.Err != nil {
            fmt.Printf("  %s: 失败 - %v\n", r.Source, r.Err)
        } else {
            fmt.Printf("  %s: %s\n", r.Source, r.Data)
        }
    }
}
```

**输出**：
```
开始并发获取数据...

结果:
  缓存: 来自 缓存 的数据
  数据库: 来自 数据库 的数据
  外部API: 失败 - context deadline exceeded
```

### HTTP 服务器中间件

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "time"
)

type contextKey string

const (
    requestIDKey contextKey = "requestID"
    userKey      contextKey = "user"
)

// 请求 ID 中间件
func requestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := fmt.Sprintf("req-%d", time.Now().UnixNano())
        ctx := context.WithValue(r.Context(), requestIDKey, requestID)

        // 添加到响应头
        w.Header().Set("X-Request-ID", requestID)

        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// 超时中间件
func timeoutMiddleware(timeout time.Duration) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            ctx, cancel := context.WithTimeout(r.Context(), timeout)
            defer cancel()

            // 使用 channel 等待处理完成或超时
            done := make(chan struct{})
            go func() {
                next.ServeHTTP(w, r.WithContext(ctx))
                close(done)
            }()

            select {
            case <-done:
                // 正常完成
            case <-ctx.Done():
                // 超时
                http.Error(w, "请求超时", http.StatusGatewayTimeout)
            }
        })
    }
}

// 日志中间件
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        requestID := r.Context().Value(requestIDKey)

        log.Printf("[%v] 开始处理 %s %s", requestID, r.Method, r.URL.Path)

        next.ServeHTTP(w, r)

        log.Printf("[%v] 完成处理，耗时: %v", requestID, time.Since(start))
    })
}

// 业务处理函数
func handleAPI(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    requestID := ctx.Value(requestIDKey)

    // 模拟耗时操作
    select {
    case <-time.After(2 * time.Second):
        fmt.Fprintf(w, "请求 %v 处理成功", requestID)
    case <-ctx.Done():
        log.Printf("[%v] 请求被取消: %v", requestID, ctx.Err())
        return
    }
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/api", handleAPI)

    // 应用中间件链
    handler := requestIDMiddleware(
        loggingMiddleware(
            timeoutMiddleware(3*time.Second)(mux),
        ),
    )

    fmt.Println("服务器启动在 :8080")
    log.Fatal(http.ListenAndServe(":8080", handler))
}
```

### 优雅关闭服务

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

type Server struct {
    httpServer *http.Server
}

func NewServer(addr string) *Server {
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        // 模拟处理
        time.Sleep(1 * time.Second)
        fmt.Fprintf(w, "Hello, World!")
    })

    return &Server{
        httpServer: &http.Server{
            Addr:    addr,
            Handler: mux,
        },
    }
}

func (s *Server) Start() error {
    fmt.Printf("服务器启动在 %s\n", s.httpServer.Addr)
    return s.httpServer.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
    fmt.Println("正在优雅关闭服务器...")
    return s.httpServer.Shutdown(ctx)
}

func main() {
    server := NewServer(":8080")

    // 在 goroutine 中启动服务器
    go func() {
        if err := server.Start(); err != http.ErrServerClosed {
            fmt.Printf("服务器错误: %v\n", err)
        }
    }()

    // 监听系统信号
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

    // 等待信号
    sig := <-sigChan
    fmt.Printf("\n收到信号: %v\n", sig)

    // 创建关闭超时的 context
    // 给正在处理的请求 30 秒完成
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // 优雅关闭
    if err := server.Shutdown(ctx); err != nil {
        fmt.Printf("关闭错误: %v\n", err)
    } else {
        fmt.Println("服务器已优雅关闭")
    }
}
```

### 管道模式中的取消传播

```go
package main

import (
    "context"
    "fmt"
    "time"
)

// 生成器：生成一系列数字
func generator(ctx context.Context) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        n := 0
        for {
            select {
            case <-ctx.Done():
                fmt.Println("生成器: 收到取消信号")
                return
            case out <- n:
                n++
                time.Sleep(100 * time.Millisecond)
            }
        }
    }()
    return out
}

// 平方：计算平方值
func square(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for {
            select {
            case <-ctx.Done():
                fmt.Println("平方器: 收到取消信号")
                return
            case n, ok := <-in:
                if !ok {
                    return
                }
                select {
                case out <- n * n:
                case <-ctx.Done():
                    return
                }
            }
        }
    }()
    return out
}

// 打印：输出结果
func printer(ctx context.Context, in <-chan int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("打印器: 收到取消信号")
            return
        case n, ok := <-in:
            if !ok {
                return
            }
            fmt.Printf("结果: %d\n", n)
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
    defer cancel()

    // 构建管道
    numbers := generator(ctx)
    squares := square(ctx, numbers)

    // 消费结果
    printer(ctx, squares)

    fmt.Println("程序结束")
}
```

## Context 最佳实践

### Context 作为第一个参数

```go
// 正确
func FetchUser(ctx context.Context, id int64) (*User, error) {
    // ...
}

// 错误
func FetchUser(id int64, ctx context.Context) (*User, error) {
    // ...
}
```

### 不要在结构体中存储 Context

```go
// 错误
type Server struct {
    ctx context.Context // 不要这样做
}

// 正确
type Server struct {
    // 其他字段
}

func (s *Server) Process(ctx context.Context) error {
    // 通过参数传递 context
}
```

### 始终调用 cancel 函数

```go
func process(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel() // 始终调用，即使函数提前返回

    // 业务逻辑
    return nil
}
```

调用 `cancel()` 的重要性：
- 释放与 Context 关联的资源
- 停止内部的计时器
- 允许垃圾回收器回收相关内存

### 检查 Context 错误

```go
func worker(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            err := ctx.Err()
            switch err {
            case context.Canceled:
                return fmt.Errorf("工作被取消")
            case context.DeadlineExceeded:
                return fmt.Errorf("工作超时")
            default:
                return err
            }
        default:
            // 继续工作
            if err := doWork(); err != nil {
                return err
            }
        }
    }
}
```

### 合理设置超时时间

```go
// 分层超时设计
func handleRequest(ctx context.Context) error {
    // 总超时 10 秒
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()

    // 数据库查询 3 秒
    dbCtx, dbCancel := context.WithTimeout(ctx, 3*time.Second)
    defer dbCancel()
    user, err := queryUser(dbCtx)

    // 外部 API 调用 5 秒
    apiCtx, apiCancel := context.WithTimeout(ctx, 5*time.Second)
    defer apiCancel()
    data, err := callExternalAPI(apiCtx)

    // ...
}
```

### 避免滥用 WithValue

```go
// 不好：传递业务参数
func bad(ctx context.Context) {
    limit := ctx.Value("limit").(int) // 不清晰，类型不安全
}

// 好：显式参数
func good(ctx context.Context, limit int) {
    // 清晰明了
}

// WithValue 适合的场景
func middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 请求追踪 ID
        ctx := context.WithValue(r.Context(), traceIDKey, generateTraceID())
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

## 常见错误与陷阱

### Goroutine 泄漏

```go
// 错误：goroutine 永远不会退出
func leak() {
    ch := make(chan int)
    go func() {
        for v := range ch {
            fmt.Println(v)
        }
    }()
    // ch 从未关闭，goroutine 永远阻塞
}

// 正确：使用 context 控制生命周期
func noLeak(ctx context.Context) {
    ch := make(chan int)
    go func() {
        for {
            select {
            case v, ok := <-ch:
                if !ok {
                    return
                }
                fmt.Println(v)
            case <-ctx.Done():
                return
            }
        }
    }()
}
```

### 忘记传播 Context

```go
// 错误：创建新的 context，丢失了取消能力
func bad(ctx context.Context) {
    newCtx := context.Background() // 错误！
    callExternalService(newCtx)
}

// 正确：继续传递或派生
func good(ctx context.Context) {
    // 直接传递
    callExternalService(ctx)

    // 或者派生
    childCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    callExternalService(childCtx)
}
```

### 在错误的时机取消

```go
// 错误：过早取消
func bad() error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    cancel() // 立即取消！
    return doWork(ctx) // ctx 已经被取消
}

// 正确：使用 defer
func good() error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel() // 函数返回时取消
    return doWork(ctx)
}
```

### Context 值的类型断言失败

```go
// 危险：没有检查类型断言
func dangerous(ctx context.Context) {
    user := ctx.Value(userKey).(*User) // 如果值不存在或类型错误会 panic
}

// 安全：检查 ok
func safe(ctx context.Context) {
    user, ok := ctx.Value(userKey).(*User)
    if !ok {
        // 处理缺失或类型错误的情况
        return
    }
    // 使用 user
}
```

## 性能考虑

### Context 创建开销

```go
// Context 创建非常轻量
func BenchmarkContext(b *testing.B) {
    b.Run("Background", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _ = context.Background()
        }
    })

    b.Run("WithCancel", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _, cancel := context.WithCancel(context.Background())
            cancel()
        }
    })

    b.Run("WithTimeout", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _, cancel := context.WithTimeout(context.Background(), time.Second)
            cancel()
        }
    })

    b.Run("WithValue", func(b *testing.B) {
        ctx := context.Background()
        for i := 0; i < b.N; i++ {
            _ = context.WithValue(ctx, "key", i)
        }
    })
}
```

### WithValue 查找性能

WithValue 的查找是 O(n)，其中 n 是值链的深度。

```go
// 深度嵌套会影响性能
func deepNesting() {
    ctx := context.Background()
    for i := 0; i < 100; i++ {
        ctx = context.WithValue(ctx, i, i)
    }
    // 查找早期添加的值需要遍历整个链
    _ = ctx.Value(0) // O(100)
}
```

**优化建议**：
- 避免过深的 WithValue 链
- 考虑将多个值放入一个结构体中

## 总结

Context 是 Go 并发编程的核心基础设施，掌握它对于构建健壮的 Go 应用至关重要。

### 核心要点

| 函数 | 用途 | 关键点 |
|------|------|--------|
| `Background()` | 创建根 Context | main、init、测试中使用 |
| `TODO()` | 临时占位 | 重构时使用，之后应替换 |
| `WithCancel()` | 手动取消 | 始终调用返回的 cancel 函数 |
| `WithTimeout()` | 相对超时 | 使用相对时间（如 5 秒） |
| `WithDeadline()` | 绝对截止 | 使用绝对时间点 |
| `WithValue()` | 传递值 | 只用于请求范围的元数据 |

### 黄金法则

1. **显式传递**：Context 通过函数参数传递，不存储在结构体中
2. **第一参数**：Context 始终是函数的第一个参数
3. **不传 nil**：使用 `Background()` 或 `TODO()` 代替 nil
4. **始终取消**：使用 `defer cancel()` 确保资源释放
5. **谨慎使用值**：WithValue 只用于请求范围的数据

通过正确使用 Context，你可以构建出响应迅速、资源高效、易于维护的 Go 应用程序。
