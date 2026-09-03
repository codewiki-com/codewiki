---
title: Go HTTP 服务器深度解析
description: 深入理解 Go 语言 HTTP 服务器核心机制，包括 Handler 接口、ServeMux 路由、中间件模式、优雅关闭和 HTTP/2 支持
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - HTTP
  - 服务器
  - 中间件
  - HTTP/2
  - 并发
status: imported
origin: old/src/content/docs/go/http-server.zh.md
divergence: 0.196
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: Web开发
  order: 14
  lastUpdated: 2026-01-07
---

## 概念解释

Go 语言的 `net/http` 包提供了一个功能完备、性能卓越的 HTTP 服务器实现。与许多其他语言需要依赖第三方框架不同，Go 的标准库就能满足生产环境的 HTTP 服务需求。

### 什么是 HTTP 服务器

HTTP 服务器是一个监听网络端口、接收 HTTP 请求并返回 HTTP 响应的程序。Go 的 HTTP 服务器具有以下特点：

- **原生并发**：每个请求在独立的 Goroutine 中处理，天然支持高并发
- **简洁的 API**：核心接口只有一个方法，学习成本低
- **生产级质量**：标准库实现经过严格测试，性能优异
- **内置 HTTP/2**：自动支持 HTTP/2 协议，无需额外配置

### 历史背景

Go 的 `net/http` 包从 Go 1.0 开始就是标准库的一部分。随着版本演进，它不断增强：

- **Go 1.6**：引入 HTTP/2 支持
- **Go 1.8**：添加 `Server.Shutdown` 优雅关闭功能
- **Go 1.20**：引入 `ResponseController` 用于细粒度响应控制
- **Go 1.22**：增强 `ServeMux` 支持 HTTP 方法和路径参数

### 解决什么问题

Go HTTP 服务器解决了以下问题：

1. **简化 Web 开发**：无需引入重量级框架即可构建 Web 服务
2. **高并发处理**：利用 Goroutine 轻松处理大量并发请求
3. **跨平台部署**：编译为单一二进制文件，部署简单
4. **标准化接口**：统一的 Handler 接口使组件可复用

## 核心原理

### HTTP 服务器架构

```
                    ┌─────────────────────────────────────────┐
                    │              http.Server                │
                    │  ┌─────────────────────────────────┐   │
   HTTP 请求        │  │           Listener              │   │
   ──────────────►  │  │      (net.Listener)             │   │
                    │  └────────────┬────────────────────┘   │
                    │               │                         │
                    │               ▼                         │
                    │  ┌─────────────────────────────────┐   │
                    │  │       Accept Connection          │   │
                    │  └────────────┬────────────────────┘   │
                    │               │                         │
                    │               ▼                         │
                    │  ┌─────────────────────────────────┐   │
                    │  │      Spawn Goroutine            │   │
                    │  │   (每个连接一个 Goroutine)       │   │
                    │  └────────────┬────────────────────┘   │
                    │               │                         │
                    │               ▼                         │
                    │  ┌─────────────────────────────────┐   │
                    │  │      Parse HTTP Request         │   │
                    │  └────────────┬────────────────────┘   │
                    │               │                         │
                    │               ▼                         │
                    │  ┌─────────────────────────────────┐   │
                    │  │        Handler.ServeHTTP        │   │
                    │  │     (路由到具体处理器)           │   │
                    │  └────────────┬────────────────────┘   │
                    │               │                         │
                    │               ▼                         │
   HTTP 响应        │  ┌─────────────────────────────────┐   │
   ◄──────────────  │  │      Write Response             │   │
                    │  └─────────────────────────────────┘   │
                    └─────────────────────────────────────────┘
```

### Handler 接口

Handler 是 Go HTTP 服务器的核心抽象。它的定义极其简洁：

```go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}
```

这个简单的接口是整个 HTTP 处理机制的基石：

```go
// ResponseWriter 用于构建 HTTP 响应
type ResponseWriter interface {
    Header() Header           // 获取响应头
    Write([]byte) (int, error) // 写入响应体
    WriteHeader(statusCode int) // 设置状态码
}

// Request 包含 HTTP 请求的所有信息
type Request struct {
    Method string           // GET, POST, PUT 等
    URL    *url.URL         // 请求 URL
    Header Header           // 请求头
    Body   io.ReadCloser    // 请求体
    // ... 更多字段
}
```

### ServeMux 路由原理

ServeMux 是一个 HTTP 请求多路复用器，它将请求 URL 匹配到对应的处理器：

```
                    请求 URL
                        │
                        ▼
            ┌───────────────────────┐
            │      ServeMux         │
            │  ┌─────────────────┐  │
            │  │   Pattern Tree  │  │
            │  │                 │  │
            │  │  /api/          │──┼──► apiHandler
            │  │  /api/users     │──┼──► usersHandler
            │  │  /api/users/{id}│──┼──► userHandler
            │  │  /static/       │──┼──► staticHandler
            │  │  /              │──┼──► rootHandler
            │  │                 │  │
            │  └─────────────────┘  │
            └───────────────────────┘
```

ServeMux 的路由匹配规则（Go 1.22+）：

1. **精确匹配优先**：`/api/users` 优先于 `/api/`
2. **最长前缀匹配**：`/api/users/` 优先于 `/api/`
3. **方法匹配**：`GET /users` 只匹配 GET 请求
4. **路径参数**：`/users/{id}` 捕获动态路径段
5. **通配符**：`/files/{path...}` 匹配剩余所有路径

### 中间件工作原理

中间件是一个包装 Handler 的函数，形成处理链：

```
请求 ──► 中间件1 ──► 中间件2 ──► 中间件3 ──► 最终Handler
                                              │
响应 ◄── 中间件1 ◄── 中间件2 ◄── 中间件3 ◄──┘
```

中间件的核心签名：

```go
type Middleware func(http.Handler) http.Handler
```

执行流程示意：

```go
// 中间件 A
func MiddlewareA(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 1. 请求前处理 (Pre-processing)
        log.Println("A: 进入")

        next.ServeHTTP(w, r)  // 2. 调用下一个处理器

        // 3. 响应后处理 (Post-processing)
        log.Println("A: 退出")
    })
}

// 执行顺序: A进入 → B进入 → Handler → B退出 → A退出
```

### 优雅关闭机制

优雅关闭确保服务器在停止时不会丢失正在处理的请求：

```
                    收到关闭信号
                         │
                         ▼
            ┌────────────────────────┐
            │   停止接受新连接        │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   等待活跃连接完成      │
            │   (最多等待超时时间)    │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   关闭所有空闲连接      │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   返回 (服务器已关闭)   │
            └────────────────────────┘
```

### HTTP/2 协议支持

Go 的 HTTP 服务器在启用 TLS 时自动支持 HTTP/2：

```
HTTP/1.1:
  请求1 ──────────────────────────────► 响应1
  请求2 (等待响应1) ──────────────────► 响应2
  请求3 (等待响应2) ──────────────────► 响应3

HTTP/2 (多路复用):
  请求1 ──┬──────────────────────────► 响应1
  请求2 ──┤ (并行传输)                 响应2
  请求3 ──┘                            响应3
```

HTTP/2 的主要优势：

- **多路复用**：单一连接上并行处理多个请求
- **头部压缩**：使用 HPACK 压缩 HTTP 头部
- **服务器推送**：主动推送资源到客户端
- **二进制协议**：更高效的解析和传输

## 核心要点

### Handler 接口实现

任何实现了 `ServeHTTP` 方法的类型都是 Handler：

```go
// 结构体实现
type MyHandler struct {
    message string
}

func (h *MyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, h.message)
}

// 函数实现 (使用 HandlerFunc)
func myFunc(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello")
}

// HandlerFunc 是一个适配器，让函数实现 Handler 接口
// type HandlerFunc func(ResponseWriter, *Request)
// func (f HandlerFunc) ServeHTTP(w ResponseWriter, r *Request) { f(w, r) }
```

### ServeMux 路由模式

Go 1.22+ 的增强路由：

```go
mux := http.NewServeMux()

// HTTP 方法限定
mux.HandleFunc("GET /users", listUsers)
mux.HandleFunc("POST /users", createUser)

// 路径参数
mux.HandleFunc("GET /users/{id}", getUser)
mux.HandleFunc("PUT /users/{id}", updateUser)

// 通配符参数
mux.HandleFunc("GET /files/{path...}", serveFiles)

// 精确匹配根路径
mux.HandleFunc("GET /{$}", home)

// 主机匹配
mux.HandleFunc("GET api.example.com/", apiHandler)
```

### 中间件链式调用

```go
// 中间件定义
type Middleware func(http.Handler) http.Handler

// 链式组合
func Chain(middlewares ...Middleware) Middleware {
    return func(final http.Handler) http.Handler {
        for i := len(middlewares) - 1; i >= 0; i-- {
            final = middlewares[i](final)
        }
        return final
    }
}

// 使用
chain := Chain(Logging, Recovery, CORS, Auth)
handler := chain(finalHandler)
```

### 超时配置

```go
server := &http.Server{
    Addr:              ":8080",
    Handler:           handler,
    ReadTimeout:       15 * time.Second,  // 读取请求超时
    ReadHeaderTimeout: 5 * time.Second,   // 读取请求头超时
    WriteTimeout:      15 * time.Second,  // 写入响应超时
    IdleTimeout:       60 * time.Second,  // 空闲连接超时
    MaxHeaderBytes:    1 << 20,           // 请求头最大字节数
}
```

### 优雅关闭

```go
// 启动服务器
go server.ListenAndServe()

// 监听信号
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

// 优雅关闭
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
server.Shutdown(ctx)
```

## 代码示例

### 基础 HTTP 服务器

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "time"
)

func main() {
    // 创建路由器
    mux := http.NewServeMux()

    // 注册处理器
    mux.HandleFunc("GET /", homeHandler)
    mux.HandleFunc("GET /health", healthHandler)
    mux.HandleFunc("GET /api/time", timeHandler)

    // 创建服务器
    server := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    log.Printf("服务器启动在 http://localhost%s", server.Addr)
    if err := server.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "欢迎访问 Go HTTP 服务器!")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "status": "healthy",
    })
}

func timeHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "time": time.Now().Format(time.RFC3339),
    })
}
```

### 自定义 Handler 结构体

```go
package main

import (
    "encoding/json"
    "net/http"
    "sync"
    "sync/atomic"
)

// 带状态的 Handler
type CounterHandler struct {
    count int64
}

func (h *CounterHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    newCount := atomic.AddInt64(&h.count, 1)
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]int64{
        "count": newCount,
    })
}

// 带依赖的 Handler
type UserHandler struct {
    store *UserStore
}

func NewUserHandler(store *UserStore) *UserHandler {
    return &UserHandler{store: store}
}

func (h *UserHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        h.list(w, r)
    case http.MethodPost:
        h.create(w, r)
    default:
        http.Error(w, "方法不允许", http.StatusMethodNotAllowed)
    }
}

func (h *UserHandler) list(w http.ResponseWriter, r *http.Request) {
    users := h.store.List()
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(users)
}

func (h *UserHandler) create(w http.ResponseWriter, r *http.Request) {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    h.store.Create(&user)
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}

// 简单的用户存储
type User struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

type UserStore struct {
    mu     sync.RWMutex
    users  map[int]*User
    nextID int
}

func NewUserStore() *UserStore {
    return &UserStore{
        users:  make(map[int]*User),
        nextID: 1,
    }
}

func (s *UserStore) List() []*User {
    s.mu.RLock()
    defer s.mu.RUnlock()
    result := make([]*User, 0, len(s.users))
    for _, u := range s.users {
        result = append(result, u)
    }
    return result
}

func (s *UserStore) Create(user *User) {
    s.mu.Lock()
    defer s.mu.Unlock()
    user.ID = s.nextID
    s.nextID++
    s.users[user.ID] = user
}

func main() {
    store := NewUserStore()
    counter := &CounterHandler{}
    userHandler := NewUserHandler(store)

    mux := http.NewServeMux()
    mux.Handle("/counter", counter)
    mux.Handle("/users", userHandler)

    http.ListenAndServe(":8080", mux)
}
```

### 完整的中间件系统

```go
package main

import (
    "context"
    "encoding/json"
    "log"
    "net/http"
    "runtime/debug"
    "time"

    "github.com/google/uuid"
)

// 中间件类型
type Middleware func(http.Handler) http.Handler

// 链式组合中间件
func Chain(middlewares ...Middleware) Middleware {
    return func(final http.Handler) http.Handler {
        for i := len(middlewares) - 1; i >= 0; i-- {
            final = middlewares[i](final)
        }
        return final
    }
}

// 上下文键类型
type contextKey string

const (
    requestIDKey contextKey = "request_id"
    startTimeKey contextKey = "start_time"
)

// 请求 ID 中间件
func RequestID(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := r.Header.Get("X-Request-ID")
        if requestID == "" {
            requestID = uuid.New().String()
        }

        ctx := context.WithValue(r.Context(), requestIDKey, requestID)
        w.Header().Set("X-Request-ID", requestID)

        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// 获取请求 ID
func GetRequestID(ctx context.Context) string {
    if id, ok := ctx.Value(requestIDKey).(string); ok {
        return id
    }
    return ""
}

// 响应包装器 - 捕获状态码和响应大小
type responseWriter struct {
    http.ResponseWriter
    statusCode int
    size       int
}

func newResponseWriter(w http.ResponseWriter) *responseWriter {
    return &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
}

func (rw *responseWriter) WriteHeader(code int) {
    rw.statusCode = code
    rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
    size, err := rw.ResponseWriter.Write(b)
    rw.size += size
    return size, err
}

// 支持 Flush 接口
func (rw *responseWriter) Flush() {
    if f, ok := rw.ResponseWriter.(http.Flusher); ok {
        f.Flush()
    }
}

// 日志中间件
func Logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        wrapped := newResponseWriter(w)

        next.ServeHTTP(wrapped, r)

        log.Printf(
            "[%s] %s %s %d %d %v",
            GetRequestID(r.Context()),
            r.Method,
            r.URL.Path,
            wrapped.statusCode,
            wrapped.size,
            time.Since(start),
        )
    })
}

// 恢复中间件
func Recovery(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf(
                    "[%s] PANIC: %v\n%s",
                    GetRequestID(r.Context()),
                    err,
                    debug.Stack(),
                )
                http.Error(w, "内部服务器错误", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}

// CORS 中间件
func CORS(allowedOrigins []string) Middleware {
    allowedOriginsMap := make(map[string]bool)
    for _, origin := range allowedOrigins {
        allowedOriginsMap[origin] = true
    }

    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            origin := r.Header.Get("Origin")

            // 检查是否允许的源
            if allowedOriginsMap["*"] || allowedOriginsMap[origin] {
                w.Header().Set("Access-Control-Allow-Origin", origin)
            }

            w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
            w.Header().Set("Access-Control-Max-Age", "86400")

            if r.Method == http.MethodOptions {
                w.WriteHeader(http.StatusNoContent)
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}

// 超时中间件
func Timeout(timeout time.Duration) Middleware {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            ctx, cancel := context.WithTimeout(r.Context(), timeout)
            defer cancel()

            done := make(chan struct{})
            go func() {
                next.ServeHTTP(w, r.WithContext(ctx))
                close(done)
            }()

            select {
            case <-done:
                return
            case <-ctx.Done():
                if ctx.Err() == context.DeadlineExceeded {
                    http.Error(w, "请求超时", http.StatusGatewayTimeout)
                }
            }
        })
    }
}

// 认证中间件
func Auth(tokenValidator func(string) bool) Middleware {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            token := r.Header.Get("Authorization")
            if token == "" {
                w.Header().Set("WWW-Authenticate", "Bearer")
                http.Error(w, "需要认证", http.StatusUnauthorized)
                return
            }

            // 移除 "Bearer " 前缀
            if len(token) > 7 && token[:7] == "Bearer " {
                token = token[7:]
            }

            if !tokenValidator(token) {
                http.Error(w, "无效的令牌", http.StatusUnauthorized)
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}

// 限流中间件 (令牌桶算法)
type RateLimiter struct {
    tokens     chan struct{}
    refillRate time.Duration
}

func NewRateLimiter(maxTokens int, refillRate time.Duration) *RateLimiter {
    rl := &RateLimiter{
        tokens:     make(chan struct{}, maxTokens),
        refillRate: refillRate,
    }

    // 初始填满令牌
    for i := 0; i < maxTokens; i++ {
        rl.tokens <- struct{}{}
    }

    // 启动令牌补充
    go func() {
        ticker := time.NewTicker(refillRate)
        for range ticker.C {
            select {
            case rl.tokens <- struct{}{}:
            default:
            }
        }
    }()

    return rl
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        select {
        case <-rl.tokens:
            next.ServeHTTP(w, r)
        default:
            w.Header().Set("Retry-After", "1")
            http.Error(w, "请求过于频繁", http.StatusTooManyRequests)
        }
    })
}

func main() {
    // 创建限流器
    rateLimiter := NewRateLimiter(100, 10*time.Millisecond)

    // 简单的令牌验证
    tokenValidator := func(token string) bool {
        return token == "valid-token"
    }

    // 组合中间件
    publicChain := Chain(
        RequestID,
        Logging,
        Recovery,
        CORS([]string{"*"}),
        rateLimiter.Middleware,
    )

    protectedChain := Chain(
        RequestID,
        Logging,
        Recovery,
        CORS([]string{"*"}),
        Auth(tokenValidator),
        Timeout(30*time.Second),
    )

    // 路由
    mux := http.NewServeMux()

    // 公开路由
    mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{"message": "Hello, World!"})
    })

    mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
    })

    // 受保护路由
    protectedMux := http.NewServeMux()
    protectedMux.HandleFunc("GET /api/profile", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{
            "request_id": GetRequestID(r.Context()),
            "user":       "authenticated_user",
        })
    })

    // 应用中间件
    mux.Handle("/", publicChain(mux))
    mux.Handle("/api/", protectedChain(protectedMux))

    // 启动服务器
    log.Println("服务器启动在 http://localhost:8080")
    http.ListenAndServe(":8080", mux)
}
```

### 优雅关闭完整示例

```go
package main

import (
    "context"
    "encoding/json"
    "errors"
    "log"
    "net/http"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

// 应用程序结构
type App struct {
    server *http.Server
    wg     sync.WaitGroup
}

// 创建应用
func NewApp(addr string, handler http.Handler) *App {
    return &App{
        server: &http.Server{
            Addr:         addr,
            Handler:      handler,
            ReadTimeout:  15 * time.Second,
            WriteTimeout: 15 * time.Second,
            IdleTimeout:  60 * time.Second,
        },
    }
}

// 启动服务器
func (app *App) Start() error {
    log.Printf("服务器启动在 %s", app.server.Addr)

    err := app.server.ListenAndServe()
    if errors.Is(err, http.ErrServerClosed) {
        return nil
    }
    return err
}

// 优雅关闭
func (app *App) Shutdown(ctx context.Context) error {
    log.Println("开始优雅关闭...")

    // 关闭 HTTP 服务器
    if err := app.server.Shutdown(ctx); err != nil {
        return err
    }

    // 等待所有后台任务完成
    done := make(chan struct{})
    go func() {
        app.wg.Wait()
        close(done)
    }()

    select {
    case <-done:
        log.Println("所有后台任务已完成")
    case <-ctx.Done():
        log.Println("关闭超时，强制退出")
        return ctx.Err()
    }

    return nil
}

// 添加后台任务
func (app *App) AddBackgroundTask(task func()) {
    app.wg.Add(1)
    go func() {
        defer app.wg.Done()
        task()
    }()
}

func main() {
    // 创建路由
    mux := http.NewServeMux()

    mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{
            "message": "Hello, World!",
        })
    })

    // 模拟慢请求
    mux.HandleFunc("GET /slow", func(w http.ResponseWriter, r *http.Request) {
        select {
        case <-time.After(5 * time.Second):
            json.NewEncoder(w).Encode(map[string]string{
                "message": "慢请求完成",
            })
        case <-r.Context().Done():
            log.Println("请求被取消")
            return
        }
    })

    mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{
            "status": "healthy",
        })
    })

    // 创建应用
    app := NewApp(":8080", mux)

    // 启动后台任务示例
    app.AddBackgroundTask(func() {
        ticker := time.NewTicker(10 * time.Second)
        defer ticker.Stop()
        for {
            select {
            case <-ticker.C:
                log.Println("执行定期任务...")
            }
        }
    })

    // 在 goroutine 中启动服务器
    go func() {
        if err := app.Start(); err != nil {
            log.Fatalf("服务器启动失败: %v", err)
        }
    }()

    // 监听关闭信号
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    sig := <-quit
    log.Printf("收到信号: %v", sig)

    // 创建关闭超时上下文
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // 优雅关闭
    if err := app.Shutdown(ctx); err != nil {
        log.Printf("关闭出错: %v", err)
        os.Exit(1)
    }

    log.Println("服务器已优雅关闭")
}
```

### HTTP/2 服务器配置

```go
package main

import (
    "crypto/tls"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "time"

    "golang.org/x/net/http2"
    "golang.org/x/net/http2/h2c"
)

func main() {
    mux := http.NewServeMux()

    // 显示连接协议
    mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{
            "protocol": r.Proto,
            "message":  "Hello, HTTP/2!",
        })
    })

    // Server Push 示例 (仅 HTTPS)
    mux.HandleFunc("GET /page", func(w http.ResponseWriter, r *http.Request) {
        // 尝试推送资源
        if pusher, ok := w.(http.Pusher); ok {
            // 推送 CSS 文件
            if err := pusher.Push("/static/style.css", nil); err != nil {
                log.Printf("推送失败: %v", err)
            }
            // 推送 JS 文件
            if err := pusher.Push("/static/app.js", nil); err != nil {
                log.Printf("推送失败: %v", err)
            }
        }

        w.Header().Set("Content-Type", "text/html")
        fmt.Fprintf(w, `
            <!DOCTYPE html>
            <html>
            <head>
                <link rel="stylesheet" href="/static/style.css">
            </head>
            <body>
                <h1>HTTP/2 Server Push Demo</h1>
                <script src="/static/app.js"></script>
            </body>
            </html>
        `)
    })

    mux.HandleFunc("GET /static/style.css", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "text/css")
        fmt.Fprintf(w, "body { font-family: sans-serif; }")
    })

    mux.HandleFunc("GET /static/app.js", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/javascript")
        fmt.Fprintf(w, "console.log('Hello from HTTP/2!');")
    })

    // 方式1: HTTPS HTTP/2 (自动启用)
    go func() {
        server := &http.Server{
            Addr:    ":443",
            Handler: mux,
            TLSConfig: &tls.Config{
                MinVersion: tls.VersionTLS12,
                CipherSuites: []uint16{
                    tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
                    tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
                    tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
                    tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
                },
            },
        }

        log.Println("HTTPS HTTP/2 服务器启动在 https://localhost:443")
        if err := server.ListenAndServeTLS("cert.pem", "key.pem"); err != nil {
            log.Printf("HTTPS 服务器错误: %v", err)
        }
    }()

    // 方式2: 明文 HTTP/2 (h2c) - 用于开发和内部服务
    h2cHandler := h2c.NewHandler(mux, &http2.Server{})

    server := &http.Server{
        Addr:         ":8080",
        Handler:      h2cHandler,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
    }

    log.Println("HTTP/2 (h2c) 服务器启动在 http://localhost:8080")
    log.Println("测试命令: curl -v --http2-prior-knowledge http://localhost:8080/")

    if err := server.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}
```

### RESTful API 完整示例

```go
package main

import (
    "context"
    "encoding/json"
    "log"
    "net/http"
    "os"
    "os/signal"
    "strconv"
    "sync"
    "syscall"
    "time"
)

// ============ 数据模型 ============

type User struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type CreateUserRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

type UpdateUserRequest struct {
    Name  string `json:"name,omitempty"`
    Email string `json:"email,omitempty"`
}

type APIResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Meta    *Meta       `json:"meta,omitempty"`
}

type Meta struct {
    Total int `json:"total,omitempty"`
    Page  int `json:"page,omitempty"`
    Limit int `json:"limit,omitempty"`
}

// ============ 数据存储 ============

type UserStore struct {
    mu     sync.RWMutex
    users  map[int]*User
    nextID int
}

func NewUserStore() *UserStore {
    return &UserStore{
        users:  make(map[int]*User),
        nextID: 1,
    }
}

func (s *UserStore) Create(req *CreateUserRequest) *User {
    s.mu.Lock()
    defer s.mu.Unlock()

    now := time.Now()
    user := &User{
        ID:        s.nextID,
        Name:      req.Name,
        Email:     req.Email,
        CreatedAt: now,
        UpdatedAt: now,
    }
    s.users[user.ID] = user
    s.nextID++
    return user
}

func (s *UserStore) Get(id int) (*User, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    user, ok := s.users[id]
    return user, ok
}

func (s *UserStore) List(page, limit int) ([]*User, int) {
    s.mu.RLock()
    defer s.mu.RUnlock()

    total := len(s.users)
    users := make([]*User, 0, len(s.users))
    for _, u := range s.users {
        users = append(users, u)
    }

    // 简单分页
    start := (page - 1) * limit
    if start >= len(users) {
        return []*User{}, total
    }
    end := start + limit
    if end > len(users) {
        end = len(users)
    }

    return users[start:end], total
}

func (s *UserStore) Update(id int, req *UpdateUserRequest) (*User, bool) {
    s.mu.Lock()
    defer s.mu.Unlock()

    user, ok := s.users[id]
    if !ok {
        return nil, false
    }

    if req.Name != "" {
        user.Name = req.Name
    }
    if req.Email != "" {
        user.Email = req.Email
    }
    user.UpdatedAt = time.Now()

    return user, true
}

func (s *UserStore) Delete(id int) bool {
    s.mu.Lock()
    defer s.mu.Unlock()

    if _, ok := s.users[id]; !ok {
        return false
    }
    delete(s.users, id)
    return true
}

// ============ HTTP 处理器 ============

type UserHandler struct {
    store *UserStore
}

func NewUserHandler(store *UserStore) *UserHandler {
    return &UserHandler{store: store}
}

// 响应辅助函数
func (h *UserHandler) jsonResponse(w http.ResponseWriter, status int, data interface{}, meta *Meta) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(APIResponse{
        Success: true,
        Data:    data,
        Meta:    meta,
    })
}

func (h *UserHandler) jsonError(w http.ResponseWriter, status int, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(APIResponse{
        Success: false,
        Error:   message,
    })
}

// 获取用户列表
func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
    page, _ := strconv.Atoi(r.URL.Query().Get("page"))
    if page < 1 {
        page = 1
    }
    limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
    if limit < 1 || limit > 100 {
        limit = 10
    }

    users, total := h.store.List(page, limit)
    h.jsonResponse(w, http.StatusOK, users, &Meta{
        Total: total,
        Page:  page,
        Limit: limit,
    })
}

// 获取单个用户
func (h *UserHandler) Get(w http.ResponseWriter, r *http.Request) {
    id, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        h.jsonError(w, http.StatusBadRequest, "无效的用户 ID")
        return
    }

    user, ok := h.store.Get(id)
    if !ok {
        h.jsonError(w, http.StatusNotFound, "用户不存在")
        return
    }

    h.jsonResponse(w, http.StatusOK, user, nil)
}

// 创建用户
func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        h.jsonError(w, http.StatusBadRequest, "无效的请求体")
        return
    }

    if req.Name == "" {
        h.jsonError(w, http.StatusBadRequest, "名称不能为空")
        return
    }
    if req.Email == "" {
        h.jsonError(w, http.StatusBadRequest, "邮箱不能为空")
        return
    }

    user := h.store.Create(&req)
    h.jsonResponse(w, http.StatusCreated, user, nil)
}

// 更新用户
func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
    id, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        h.jsonError(w, http.StatusBadRequest, "无效的用户 ID")
        return
    }

    var req UpdateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        h.jsonError(w, http.StatusBadRequest, "无效的请求体")
        return
    }

    user, ok := h.store.Update(id, &req)
    if !ok {
        h.jsonError(w, http.StatusNotFound, "用户不存在")
        return
    }

    h.jsonResponse(w, http.StatusOK, user, nil)
}

// 删除用户
func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
    id, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        h.jsonError(w, http.StatusBadRequest, "无效的用户 ID")
        return
    }

    if !h.store.Delete(id) {
        h.jsonError(w, http.StatusNotFound, "用户不存在")
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

// ============ 中间件 ============

func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        log.Printf("→ %s %s", r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
        log.Printf("← %s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}

func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("PANIC: %v", err)
                w.Header().Set("Content-Type", "application/json")
                w.WriteHeader(http.StatusInternalServerError)
                json.NewEncoder(w).Encode(APIResponse{
                    Success: false,
                    Error:   "内部服务器错误",
                })
            }
        }()
        next.ServeHTTP(w, r)
    })
}

func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }

        next.ServeHTTP(w, r)
    })
}

// ============ 主函数 ============

func main() {
    // 初始化
    store := NewUserStore()
    userHandler := NewUserHandler(store)

    // 添加测试数据
    store.Create(&CreateUserRequest{Name: "张三", Email: "zhangsan@example.com"})
    store.Create(&CreateUserRequest{Name: "李四", Email: "lisi@example.com"})
    store.Create(&CreateUserRequest{Name: "王五", Email: "wangwu@example.com"})

    // 创建路由
    mux := http.NewServeMux()

    // 健康检查
    mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
    })

    // 用户 API
    mux.HandleFunc("GET /api/v1/users", userHandler.List)
    mux.HandleFunc("GET /api/v1/users/{id}", userHandler.Get)
    mux.HandleFunc("POST /api/v1/users", userHandler.Create)
    mux.HandleFunc("PUT /api/v1/users/{id}", userHandler.Update)
    mux.HandleFunc("DELETE /api/v1/users/{id}", userHandler.Delete)

    // 应用中间件
    handler := recoveryMiddleware(corsMiddleware(loggingMiddleware(mux)))

    // 创建服务器
    server := &http.Server{
        Addr:         ":8080",
        Handler:      handler,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // 启动服务器
    go func() {
        log.Printf("服务器启动在 http://localhost%s", server.Addr)
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("服务器错误: %v", err)
        }
    }()

    // 优雅关闭
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("正在关闭服务器...")
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Printf("关闭错误: %v", err)
    }
    log.Println("服务器已关闭")
}
```

## 最佳实践

### 始终配置超时

```go
// 不好：没有超时配置
server := &http.Server{
    Addr: ":8080",
}

// 好：配置所有相关超时
server := &http.Server{
    Addr:              ":8080",
    ReadTimeout:       15 * time.Second,
    ReadHeaderTimeout: 5 * time.Second,
    WriteTimeout:      15 * time.Second,
    IdleTimeout:       60 * time.Second,
    MaxHeaderBytes:    1 << 20,
}
```

### 使用自定义 ServeMux

```go
// 不好：使用默认的 DefaultServeMux
http.HandleFunc("/", handler)
http.ListenAndServe(":8080", nil)

// 好：使用自定义 ServeMux
mux := http.NewServeMux()
mux.HandleFunc("GET /", handler)
server := &http.Server{
    Addr:    ":8080",
    Handler: mux,
}
server.ListenAndServe()
```

### 限制请求体大小

```go
func handler(w http.ResponseWriter, r *http.Request) {
    // 限制请求体大小为 1MB
    r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

    var data MyStruct
    if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
        http.Error(w, "请求体过大或格式错误", http.StatusBadRequest)
        return
    }
}
```

### 正确处理响应写入顺序

```go
func handler(w http.ResponseWriter, r *http.Request) {
    // 必须先设置响应头
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("X-Custom-Header", "value")

    // 然后设置状态码
    w.WriteHeader(http.StatusOK)

    // 最后写入响应体
    json.NewEncoder(w).Encode(data)
}
```

### 实现优雅关闭

```go
// 监听系统信号
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

// 创建超时上下文
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

// 优雅关闭
if err := server.Shutdown(ctx); err != nil {
    log.Printf("关闭错误: %v", err)
}
```

### 使用中间件分离关注点

```go
// 将横切关注点提取为中间件
chain := Chain(
    RequestID,      // 请求追踪
    Logging,        // 日志记录
    Recovery,       // 异常恢复
    CORS,           // 跨域处理
    RateLimit,      // 限流
    Auth,           // 认证
    Timeout,        // 超时控制
)

handler := chain(finalHandler)
```

### 生产环境使用 HTTPS

```go
// 使用 Let's Encrypt 自动证书
import "golang.org/x/crypto/acme/autocert"

m := &autocert.Manager{
    Cache:      autocert.DirCache("certs"),
    Prompt:     autocert.AcceptTOS,
    HostPolicy: autocert.HostWhitelist("example.com"),
}

server := &http.Server{
    Addr:      ":443",
    Handler:   handler,
    TLSConfig: m.TLSConfig(),
}

server.ListenAndServeTLS("", "")
```

## 常见陷阱

### 忘记关闭响应体

```go
// 错误：没有关闭响应体，导致连接泄漏
resp, err := http.Get(url)
if err != nil {
    return err
}
// 忘记 defer resp.Body.Close()

// 正确
resp, err := http.Get(url)
if err != nil {
    return err
}
defer resp.Body.Close()
```

### 在 WriteHeader 后设置 Header

```go
// 错误：WriteHeader 后设置 Header 无效
func handler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Header().Set("Content-Type", "application/json") // 无效！
}

// 正确：先设置 Header
func handler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
}
```

### 多次调用 WriteHeader

```go
// 错误：多次调用 WriteHeader
func handler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.WriteHeader(http.StatusCreated) // 警告：多次调用
}

// Write 会隐式调用 WriteHeader(200)
func handler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Hello")) // 隐式 WriteHeader(200)
    w.WriteHeader(http.StatusCreated) // 警告：多次调用
}
```

### 在 Goroutine 中使用 ResponseWriter

```go
// 错误：在 goroutine 中使用 ResponseWriter
func handler(w http.ResponseWriter, r *http.Request) {
    go func() {
        time.Sleep(time.Second)
        w.Write([]byte("Hello")) // 危险！handler 可能已返回
    }()
}

// 正确：使用 channel 或在 handler 中等待
func handler(w http.ResponseWriter, r *http.Request) {
    result := make(chan string)
    go func() {
        time.Sleep(time.Second)
        result <- "Hello"
    }()

    select {
    case msg := <-result:
        w.Write([]byte(msg))
    case <-r.Context().Done():
        return
    }
}
```

### 不检查 Context 取消

```go
// 错误：忽略 context 取消
func handler(w http.ResponseWriter, r *http.Request) {
    time.Sleep(10 * time.Second) // 客户端断开也继续执行
    w.Write([]byte("Done"))
}

// 正确：检查 context
func handler(w http.ResponseWriter, r *http.Request) {
    select {
    case <-time.After(10 * time.Second):
        w.Write([]byte("Done"))
    case <-r.Context().Done():
        return // 客户端断开，立即返回
    }
}
```

### 默认 Client 没有超时

```go
// 错误：使用默认 Client（没有超时）
resp, err := http.Get(url) // 可能永远阻塞

// 正确：使用带超时的 Client
client := &http.Client{
    Timeout: 30 * time.Second,
}
resp, err := client.Get(url)
```

### ServeMux 路由匹配问题

```go
mux := http.NewServeMux()

// 注意：带尾部斜杠的路由会匹配所有子路径
mux.HandleFunc("/api/", apiHandler)      // 匹配 /api/xxx
mux.HandleFunc("/api/users", usersHandler) // 精确匹配 /api/users

// Go 1.22+ 使用方法前缀更明确
mux.HandleFunc("GET /api/users", usersHandler)
mux.HandleFunc("GET /api/users/{id}", userHandler)
```

## 性能考量

### 连接复用

```go
// 配置 Transport 以复用连接
transport := &http.Transport{
    MaxIdleConns:        100,
    MaxIdleConnsPerHost: 10,
    MaxConnsPerHost:     100,
    IdleConnTimeout:     90 * time.Second,
}

client := &http.Client{
    Transport: transport,
}
```

### 响应缓冲

```go
// 使用 bufio 提高写入性能
func handler(w http.ResponseWriter, r *http.Request) {
    buf := bufio.NewWriter(w)
    defer buf.Flush()

    // 写入大量数据
    for i := 0; i < 1000; i++ {
        buf.WriteString("line\n")
    }
}
```

### JSON 编码优化

```go
// 预分配 JSON encoder
var jsonEncoder = json.NewEncoder

// 使用 sync.Pool 复用 buffer
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func handler(w http.ResponseWriter, r *http.Request) {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufferPool.Put(buf)
    }()

    json.NewEncoder(buf).Encode(data)
    w.Header().Set("Content-Type", "application/json")
    w.Write(buf.Bytes())
}
```

### 压缩响应

```go
import "compress/gzip"

func gzipMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
            next.ServeHTTP(w, r)
            return
        }

        w.Header().Set("Content-Encoding", "gzip")
        gz := gzip.NewWriter(w)
        defer gz.Close()

        gzw := &gzipResponseWriter{Writer: gz, ResponseWriter: w}
        next.ServeHTTP(gzw, r)
    })
}
```

### 使用 HTTP/2

```go
// HTTPS 自动启用 HTTP/2
server.ListenAndServeTLS(certFile, keyFile)

// 或明确配置 HTTP/2
import "golang.org/x/net/http2"

http2.ConfigureServer(server, &http2.Server{})
```

### 性能基准

```go
// 使用 httptest 进行基准测试
func BenchmarkHandler(b *testing.B) {
    handler := http.HandlerFunc(myHandler)

    for i := 0; i < b.N; i++ {
        req := httptest.NewRequest("GET", "/", nil)
        rec := httptest.NewRecorder()
        handler.ServeHTTP(rec, req)
    }
}
```

## 实战场景

### 场景 1：API 网关

```go
// 简单的 API 网关实现
type Gateway struct {
    routes map[string]*url.URL
}

func (g *Gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    // 根据路径选择后端
    for prefix, target := range g.routes {
        if strings.HasPrefix(r.URL.Path, prefix) {
            g.proxy(w, r, target)
            return
        }
    }
    http.NotFound(w, r)
}

func (g *Gateway) proxy(w http.ResponseWriter, r *http.Request, target *url.URL) {
    proxy := httputil.NewSingleHostReverseProxy(target)
    proxy.ServeHTTP(w, r)
}
```

### 场景 2：文件服务器

```go
func fileServer() http.Handler {
    fs := http.FileServer(http.Dir("./static"))

    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 禁止目录列表
        if strings.HasSuffix(r.URL.Path, "/") {
            http.NotFound(w, r)
            return
        }

        // 添加缓存头
        w.Header().Set("Cache-Control", "public, max-age=31536000")

        fs.ServeHTTP(w, r)
    })
}
```

### 场景 3：WebSocket 升级

```go
import "github.com/gorilla/websocket"

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    defer conn.Close()

    for {
        messageType, message, err := conn.ReadMessage()
        if err != nil {
            break
        }
        conn.WriteMessage(messageType, message)
    }
}
```

### 场景 4：健康检查端点

```go
type HealthChecker struct {
    checks map[string]func() error
}

func (h *HealthChecker) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    results := make(map[string]string)
    healthy := true

    for name, check := range h.checks {
        if err := check(); err != nil {
            results[name] = err.Error()
            healthy = false
        } else {
            results[name] = "ok"
        }
    }

    status := http.StatusOK
    if !healthy {
        status = http.StatusServiceUnavailable
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "healthy": healthy,
        "checks":  results,
    })
}
```

## 面试要点

### Handler 接口

**Q: 什么是 http.Handler 接口？为什么它的设计如此简单？**

A: `http.Handler` 是 Go HTTP 服务器的核心接口，只有一个方法：

```go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}
```

简单设计的优点：
- **易于实现**：任何类型只需实现一个方法
- **组合友好**：中间件可以轻松包装 Handler
- **通用性强**：适用于所有 HTTP 处理场景

### ServeMux 路由原理

**Q: ServeMux 是如何匹配路由的？**

A: ServeMux 使用最长前缀匹配：
1. 精确匹配优先于前缀匹配
2. 更长的模式优先于更短的模式
3. Go 1.22+ 支持方法和路径参数匹配

```go
// 匹配优先级示例
mux.HandleFunc("GET /users/{id}", ...)  // 最高优先级
mux.HandleFunc("GET /users", ...)       // 次优先级
mux.HandleFunc("/users", ...)           // 最低优先级
```

### 中间件模式

**Q: 如何实现和组合中间件？**

A: 中间件是一个接收 Handler 返回 Handler 的函数：

```go
type Middleware func(http.Handler) http.Handler

func Chain(middlewares ...Middleware) Middleware {
    return func(final http.Handler) http.Handler {
        for i := len(middlewares) - 1; i >= 0; i-- {
            final = middlewares[i](final)
        }
        return final
    }
}
```

### 优雅关闭

**Q: 什么是优雅关闭？如何实现？**

A: 优雅关闭是指在停止服务器时：
1. 停止接受新连接
2. 等待现有请求完成
3. 超时后强制关闭

```go
// 监听信号
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

// 优雅关闭
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
server.Shutdown(ctx)
```

### HTTP/2 支持

**Q: Go 如何支持 HTTP/2？**

A:
- HTTPS 自动支持 HTTP/2（基于 ALPN 协议协商）
- 可使用 h2c 支持明文 HTTP/2
- 支持 Server Push（仅 HTTPS）

```go
// 检测 HTTP/2 Pusher
if pusher, ok := w.(http.Pusher); ok {
    pusher.Push("/static/style.css", nil)
}
```

### 性能优化

**Q: 如何优化 HTTP 服务器性能？**

A:
1. **配置连接池**：复用 TCP 连接
2. **启用压缩**：gzip 压缩响应
3. **使用 HTTP/2**：多路复用
4. **设置超时**：防止慢连接
5. **响应缓冲**：减少系统调用
6. **对象池**：减少 GC 压力

## 延伸阅读

### 官方文档

- [net/http 包文档](https://pkg.go.dev/net/http)
- [Go HTTP/2 文档](https://pkg.go.dev/golang.org/x/net/http2)
- [Go 1.22 Release Notes (增强路由)](https://go.dev/doc/go1.22)

### 推荐书籍

- 《The Go Programming Language》- Alan A. A. Donovan
- 《Go Web Programming》- Sau Sheong Chang
- 《Concurrency in Go》- Katherine Cox-Buday

### 优质文章

- [How I write HTTP services in Go after 13 years](https://grafana.com/blog/2024/02/09/how-i-write-http-services-in-go-after-13-years/)
- [The complete guide to Go net/http timeouts](https://blog.cloudflare.com/the-complete-guide-to-golang-net-http-timeouts/)
- [Go HTTP Server Best Practices](https://blog.golang.org/http-servers)

### 相关项目

- [Chi Router](https://github.com/go-chi/chi) - 轻量级路由器
- [Gorilla Mux](https://github.com/gorilla/mux) - 功能丰富的路由器
- [Gin Framework](https://github.com/gin-gonic/gin) - 高性能 Web 框架
- [Echo Framework](https://github.com/labstack/echo) - 高性能、极简 Web 框架
