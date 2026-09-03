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
origin: old/src/content/docs/go/http-server.en.md
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

## Concept Overview

Go's `net/http` package provides a fully-featured, high-performance HTTP server implementation. Unlike many other languages that require third-party frameworks, Go's standard library can meet production-level HTTP service requirements.

### What is an HTTP Server

An HTTP server is a program that listens on a network port, receives HTTP requests, and returns HTTP responses. Go's HTTP server has the following characteristics:

- **Native Concurrency**: Each request is processed in an independent Goroutine, naturally supporting high concurrency
- **Simple API**: The core interface has only one method, with a low learning curve
- **Production-Grade Quality**: The standard library implementation is thoroughly tested with excellent performance
- **Built-in HTTP/2**: Automatic HTTP/2 protocol support without additional configuration

### Historical Background

Go's `net/http` package has been part of the standard library since Go 1.0. It has continuously improved with version updates:

- **Go 1.6**: Introduced HTTP/2 support
- **Go 1.8**: Added `Server.Shutdown` for graceful shutdown
- **Go 1.20**: Introduced `ResponseController` for fine-grained response control
- **Go 1.22**: Enhanced `ServeMux` with HTTP method and path parameter support

### Problems Solved

Go HTTP server solves the following problems:

1. **Simplifies Web Development**: Build web services without heavy frameworks
2. **High Concurrency Handling**: Easily handle massive concurrent requests using Goroutines
3. **Cross-Platform Deployment**: Compiles to a single binary for simple deployment
4. **Standardized Interface**: Unified Handler interface enables component reusability

## Core Principles

### HTTP Server Architecture

```
                    ┌─────────────────────────────────────────┐
                    │              http.Server                │
                    │  ┌─────────────────────────────────┐   │
   HTTP Request     │  │           Listener              │   │
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
                    │  │   (One Goroutine per connection) │   │
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
                    │  │     (Route to specific handler)  │   │
                    │  └────────────┬────────────────────┘   │
                    │               │                         │
                    │               ▼                         │
   HTTP Response    │  ┌─────────────────────────────────┐   │
   ◄──────────────  │  │      Write Response             │   │
                    │  └─────────────────────────────────┘   │
                    └─────────────────────────────────────────┘
```

### Handler Interface

Handler is the core abstraction of Go's HTTP server. Its definition is extremely simple:

```go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}
```

This simple interface is the foundation of the entire HTTP handling mechanism:

```go
// ResponseWriter is used to build HTTP responses
type ResponseWriter interface {
    Header() Header           // Get response headers
    Write([]byte) (int, error) // Write response body
    WriteHeader(statusCode int) // Set status code
}

// Request contains all information about the HTTP request
type Request struct {
    Method string           // GET, POST, PUT, etc.
    URL    *url.URL         // Request URL
    Header Header           // Request headers
    Body   io.ReadCloser    // Request body
    // ... more fields
}
```

### ServeMux Routing Mechanism

ServeMux is an HTTP request multiplexer that matches request URLs to corresponding handlers:

```
                    Request URL
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

ServeMux routing rules (Go 1.22+):

1. **Exact Match Priority**: `/api/users` takes priority over `/api/`
2. **Longest Prefix Match**: `/api/users/` takes priority over `/api/`
3. **Method Matching**: `GET /users` only matches GET requests
4. **Path Parameters**: `/users/{id}` captures dynamic path segments
5. **Wildcards**: `/files/{path...}` matches all remaining path segments

### Middleware Working Principle

Middleware is a function that wraps a Handler, forming a processing chain:

```
Request ──► Middleware1 ──► Middleware2 ──► Middleware3 ──► Final Handler
                                              │
Response ◄── Middleware1 ◄── Middleware2 ◄── Middleware3 ◄──┘
```

The core middleware signature:

```go
type Middleware func(http.Handler) http.Handler
```

Execution flow illustration:

```go
// Middleware A
func MiddlewareA(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 1. Pre-processing
        log.Println("A: entering")

        next.ServeHTTP(w, r)  // 2. Call next handler

        // 3. Post-processing
        log.Println("A: exiting")
    })
}

// Execution order: A enter → B enter → Handler → B exit → A exit
```

### Graceful Shutdown Mechanism

Graceful shutdown ensures the server doesn't lose in-flight requests when stopping:

```
                    Receive shutdown signal
                         │
                         ▼
            ┌────────────────────────┐
            │   Stop accepting new   │
            │   connections          │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   Wait for active      │
            │   connections to finish│
            │   (up to timeout)      │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   Close all idle       │
            │   connections          │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   Return (server       │
            │   has shut down)       │
            └────────────────────────┘
```

### HTTP/2 Protocol Support

Go's HTTP server automatically supports HTTP/2 when TLS is enabled:

```
HTTP/1.1:
  Request1 ──────────────────────────────► Response1
  Request2 (wait for Response1) ──────────► Response2
  Request3 (wait for Response2) ──────────► Response3

HTTP/2 (Multiplexing):
  Request1 ──┬──────────────────────────► Response1
  Request2 ──┤ (parallel transfer)        Response2
  Request3 ──┘                            Response3
```

Key advantages of HTTP/2:

- **Multiplexing**: Process multiple requests in parallel over a single connection
- **Header Compression**: Use HPACK to compress HTTP headers
- **Server Push**: Proactively push resources to the client
- **Binary Protocol**: More efficient parsing and transmission

## Key Points

### Handler Interface Implementation

Any type that implements the `ServeHTTP` method is a Handler:

```go
// Struct implementation
type MyHandler struct {
    message string
}

func (h *MyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, h.message)
}

// Function implementation (using HandlerFunc)
func myFunc(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello")
}

// HandlerFunc is an adapter that lets functions implement the Handler interface
// type HandlerFunc func(ResponseWriter, *Request)
// func (f HandlerFunc) ServeHTTP(w ResponseWriter, r *Request) { f(w, r) }
```

### ServeMux Routing Patterns

Enhanced routing in Go 1.22+:

```go
mux := http.NewServeMux()

// HTTP method restriction
mux.HandleFunc("GET /users", listUsers)
mux.HandleFunc("POST /users", createUser)

// Path parameters
mux.HandleFunc("GET /users/{id}", getUser)
mux.HandleFunc("PUT /users/{id}", updateUser)

// Wildcard parameters
mux.HandleFunc("GET /files/{path...}", serveFiles)

// Exact root path match
mux.HandleFunc("GET /{$}", home)

// Host matching
mux.HandleFunc("GET api.example.com/", apiHandler)
```

### Middleware Chaining

```go
// Middleware definition
type Middleware func(http.Handler) http.Handler

// Chain composition
func Chain(middlewares ...Middleware) Middleware {
    return func(final http.Handler) http.Handler {
        for i := len(middlewares) - 1; i >= 0; i-- {
            final = middlewares[i](final)
        }
        return final
    }
}

// Usage
chain := Chain(Logging, Recovery, CORS, Auth)
handler := chain(finalHandler)
```

### Timeout Configuration

```go
server := &http.Server{
    Addr:              ":8080",
    Handler:           handler,
    ReadTimeout:       15 * time.Second,  // Read request timeout
    ReadHeaderTimeout: 5 * time.Second,   // Read request header timeout
    WriteTimeout:      15 * time.Second,  // Write response timeout
    IdleTimeout:       60 * time.Second,  // Idle connection timeout
    MaxHeaderBytes:    1 << 20,           // Maximum request header bytes
}
```

### Graceful Shutdown

```go
// Start server
go server.ListenAndServe()

// Listen for signals
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

// Graceful shutdown
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
server.Shutdown(ctx)
```

## Code Examples

### Basic HTTP Server

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
    // Create router
    mux := http.NewServeMux()

    // Register handlers
    mux.HandleFunc("GET /", homeHandler)
    mux.HandleFunc("GET /health", healthHandler)
    mux.HandleFunc("GET /api/time", timeHandler)

    // Create server
    server := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    log.Printf("Server starting at http://localhost%s", server.Addr)
    if err := server.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Welcome to Go HTTP Server!")
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

### Custom Handler Struct

```go
package main

import (
    "encoding/json"
    "net/http"
    "sync"
    "sync/atomic"
)

// Stateful Handler
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

// Handler with dependencies
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
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
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

// Simple user store
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

### Complete Middleware System

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

// Middleware type
type Middleware func(http.Handler) http.Handler

// Chain middlewares together
func Chain(middlewares ...Middleware) Middleware {
    return func(final http.Handler) http.Handler {
        for i := len(middlewares) - 1; i >= 0; i-- {
            final = middlewares[i](final)
        }
        return final
    }
}

// Context key type
type contextKey string

const (
    requestIDKey contextKey = "request_id"
    startTimeKey contextKey = "start_time"
)

// Request ID middleware
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

// Get request ID
func GetRequestID(ctx context.Context) string {
    if id, ok := ctx.Value(requestIDKey).(string); ok {
        return id
    }
    return ""
}

// Response writer wrapper - captures status code and response size
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

// Support Flush interface
func (rw *responseWriter) Flush() {
    if f, ok := rw.ResponseWriter.(http.Flusher); ok {
        f.Flush()
    }
}

// Logging middleware
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

// Recovery middleware
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
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}

// CORS middleware
func CORS(allowedOrigins []string) Middleware {
    allowedOriginsMap := make(map[string]bool)
    for _, origin := range allowedOrigins {
        allowedOriginsMap[origin] = true
    }

    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            origin := r.Header.Get("Origin")

            // Check if origin is allowed
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

// Timeout middleware
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
                    http.Error(w, "Request Timeout", http.StatusGatewayTimeout)
                }
            }
        })
    }
}

// Auth middleware
func Auth(tokenValidator func(string) bool) Middleware {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            token := r.Header.Get("Authorization")
            if token == "" {
                w.Header().Set("WWW-Authenticate", "Bearer")
                http.Error(w, "Authentication required", http.StatusUnauthorized)
                return
            }

            // Remove "Bearer " prefix
            if len(token) > 7 && token[:7] == "Bearer " {
                token = token[7:]
            }

            if !tokenValidator(token) {
                http.Error(w, "Invalid token", http.StatusUnauthorized)
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}

// Rate limiting middleware (Token Bucket algorithm)
type RateLimiter struct {
    tokens     chan struct{}
    refillRate time.Duration
}

func NewRateLimiter(maxTokens int, refillRate time.Duration) *RateLimiter {
    rl := &RateLimiter{
        tokens:     make(chan struct{}, maxTokens),
        refillRate: refillRate,
    }

    // Initially fill with tokens
    for i := 0; i < maxTokens; i++ {
        rl.tokens <- struct{}{}
    }

    // Start token refill
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
            http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
        }
    })
}

func main() {
    // Create rate limiter
    rateLimiter := NewRateLimiter(100, 10*time.Millisecond)

    // Simple token validation
    tokenValidator := func(token string) bool {
        return token == "valid-token"
    }

    // Compose middlewares
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

    // Routes
    mux := http.NewServeMux()

    // Public routes
    mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{"message": "Hello, World!"})
    })

    mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
    })

    // Protected routes
    protectedMux := http.NewServeMux()
    protectedMux.HandleFunc("GET /api/profile", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{
            "request_id": GetRequestID(r.Context()),
            "user":       "authenticated_user",
        })
    })

    // Apply middlewares
    mux.Handle("/", publicChain(mux))
    mux.Handle("/api/", protectedChain(protectedMux))

    // Start server
    log.Println("Server starting at http://localhost:8080")
    http.ListenAndServe(":8080", mux)
}
```

### Complete Graceful Shutdown Example

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

// Application structure
type App struct {
    server *http.Server
    wg     sync.WaitGroup
}

// Create application
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

// Start server
func (app *App) Start() error {
    log.Printf("Server starting at %s", app.server.Addr)

    err := app.server.ListenAndServe()
    if errors.Is(err, http.ErrServerClosed) {
        return nil
    }
    return err
}

// Graceful shutdown
func (app *App) Shutdown(ctx context.Context) error {
    log.Println("Starting graceful shutdown...")

    // Shutdown HTTP server
    if err := app.server.Shutdown(ctx); err != nil {
        return err
    }

    // Wait for all background tasks to complete
    done := make(chan struct{})
    go func() {
        app.wg.Wait()
        close(done)
    }()

    select {
    case <-done:
        log.Println("All background tasks completed")
    case <-ctx.Done():
        log.Println("Shutdown timeout, forcing exit")
        return ctx.Err()
    }

    return nil
}

// Add background task
func (app *App) AddBackgroundTask(task func()) {
    app.wg.Add(1)
    go func() {
        defer app.wg.Done()
        task()
    }()
}

func main() {
    // Create routes
    mux := http.NewServeMux()

    mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{
            "message": "Hello, World!",
        })
    })

    // Simulate slow request
    mux.HandleFunc("GET /slow", func(w http.ResponseWriter, r *http.Request) {
        select {
        case <-time.After(5 * time.Second):
            json.NewEncoder(w).Encode(map[string]string{
                "message": "Slow request completed",
            })
        case <-r.Context().Done():
            log.Println("Request cancelled")
            return
        }
    })

    mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{
            "status": "healthy",
        })
    })

    // Create application
    app := NewApp(":8080", mux)

    // Example background task
    app.AddBackgroundTask(func() {
        ticker := time.NewTicker(10 * time.Second)
        defer ticker.Stop()
        for {
            select {
            case <-ticker.C:
                log.Println("Executing periodic task...")
            }
        }
    })

    // Start server in goroutine
    go func() {
        if err := app.Start(); err != nil {
            log.Fatalf("Server failed to start: %v", err)
        }
    }()

    // Listen for shutdown signals
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    sig := <-quit
    log.Printf("Received signal: %v", sig)

    // Create shutdown timeout context
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // Graceful shutdown
    if err := app.Shutdown(ctx); err != nil {
        log.Printf("Shutdown error: %v", err)
        os.Exit(1)
    }

    log.Println("Server gracefully shut down")
}
```

### HTTP/2 Server Configuration

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

    // Display connection protocol
    mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{
            "protocol": r.Proto,
            "message":  "Hello, HTTP/2!",
        })
    })

    // Server Push example (HTTPS only)
    mux.HandleFunc("GET /page", func(w http.ResponseWriter, r *http.Request) {
        // Try to push resources
        if pusher, ok := w.(http.Pusher); ok {
            // Push CSS file
            if err := pusher.Push("/static/style.css", nil); err != nil {
                log.Printf("Push failed: %v", err)
            }
            // Push JS file
            if err := pusher.Push("/static/app.js", nil); err != nil {
                log.Printf("Push failed: %v", err)
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

    // Method 1: HTTPS HTTP/2 (automatically enabled)
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

        log.Println("HTTPS HTTP/2 server starting at https://localhost:443")
        if err := server.ListenAndServeTLS("cert.pem", "key.pem"); err != nil {
            log.Printf("HTTPS server error: %v", err)
        }
    }()

    // Method 2: Cleartext HTTP/2 (h2c) - for development and internal services
    h2cHandler := h2c.NewHandler(mux, &http2.Server{})

    server := &http.Server{
        Addr:         ":8080",
        Handler:      h2cHandler,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
    }

    log.Println("HTTP/2 (h2c) server starting at http://localhost:8080")
    log.Println("Test command: curl -v --http2-prior-knowledge http://localhost:8080/")

    if err := server.ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}
```

### Complete RESTful API Example

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

// ============ Data Models ============

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

// ============ Data Store ============

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

    // Simple pagination
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

// ============ HTTP Handlers ============

type UserHandler struct {
    store *UserStore
}

func NewUserHandler(store *UserStore) *UserHandler {
    return &UserHandler{store: store}
}

// Response helper functions
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

// Get user list
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

// Get single user
func (h *UserHandler) Get(w http.ResponseWriter, r *http.Request) {
    id, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        h.jsonError(w, http.StatusBadRequest, "Invalid user ID")
        return
    }

    user, ok := h.store.Get(id)
    if !ok {
        h.jsonError(w, http.StatusNotFound, "User not found")
        return
    }

    h.jsonResponse(w, http.StatusOK, user, nil)
}

// Create user
func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        h.jsonError(w, http.StatusBadRequest, "Invalid request body")
        return
    }

    if req.Name == "" {
        h.jsonError(w, http.StatusBadRequest, "Name cannot be empty")
        return
    }
    if req.Email == "" {
        h.jsonError(w, http.StatusBadRequest, "Email cannot be empty")
        return
    }

    user := h.store.Create(&req)
    h.jsonResponse(w, http.StatusCreated, user, nil)
}

// Update user
func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
    id, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        h.jsonError(w, http.StatusBadRequest, "Invalid user ID")
        return
    }

    var req UpdateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        h.jsonError(w, http.StatusBadRequest, "Invalid request body")
        return
    }

    user, ok := h.store.Update(id, &req)
    if !ok {
        h.jsonError(w, http.StatusNotFound, "User not found")
        return
    }

    h.jsonResponse(w, http.StatusOK, user, nil)
}

// Delete user
func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
    id, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        h.jsonError(w, http.StatusBadRequest, "Invalid user ID")
        return
    }

    if !h.store.Delete(id) {
        h.jsonError(w, http.StatusNotFound, "User not found")
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

// ============ Middleware ============

func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        log.Printf("-> %s %s", r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
        log.Printf("<- %s %s %v", r.Method, r.URL.Path, time.Since(start))
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
                    Error:   "Internal Server Error",
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

// ============ Main Function ============

func main() {
    // Initialize
    store := NewUserStore()
    userHandler := NewUserHandler(store)

    // Add test data
    store.Create(&CreateUserRequest{Name: "John Doe", Email: "john@example.com"})
    store.Create(&CreateUserRequest{Name: "Jane Smith", Email: "jane@example.com"})
    store.Create(&CreateUserRequest{Name: "Bob Wilson", Email: "bob@example.com"})

    // Create routes
    mux := http.NewServeMux()

    // Health check
    mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
    })

    // User API
    mux.HandleFunc("GET /api/v1/users", userHandler.List)
    mux.HandleFunc("GET /api/v1/users/{id}", userHandler.Get)
    mux.HandleFunc("POST /api/v1/users", userHandler.Create)
    mux.HandleFunc("PUT /api/v1/users/{id}", userHandler.Update)
    mux.HandleFunc("DELETE /api/v1/users/{id}", userHandler.Delete)

    // Apply middleware
    handler := recoveryMiddleware(corsMiddleware(loggingMiddleware(mux)))

    // Create server
    server := &http.Server{
        Addr:         ":8080",
        Handler:      handler,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Start server
    go func() {
        log.Printf("Server starting at http://localhost%s", server.Addr)
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("Server error: %v", err)
        }
    }()

    // Graceful shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down server...")
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Printf("Shutdown error: %v", err)
    }
    log.Println("Server shut down")
}
```

## Best Practices

### Always Configure Timeouts

```go
// Bad: No timeout configuration
server := &http.Server{
    Addr: ":8080",
}

// Good: Configure all relevant timeouts
server := &http.Server{
    Addr:              ":8080",
    ReadTimeout:       15 * time.Second,
    ReadHeaderTimeout: 5 * time.Second,
    WriteTimeout:      15 * time.Second,
    IdleTimeout:       60 * time.Second,
    MaxHeaderBytes:    1 << 20,
}
```

### Use Custom ServeMux

```go
// Bad: Using default DefaultServeMux
http.HandleFunc("/", handler)
http.ListenAndServe(":8080", nil)

// Good: Use custom ServeMux
mux := http.NewServeMux()
mux.HandleFunc("GET /", handler)
server := &http.Server{
    Addr:    ":8080",
    Handler: mux,
}
server.ListenAndServe()
```

### Limit Request Body Size

```go
func handler(w http.ResponseWriter, r *http.Request) {
    // Limit request body size to 1MB
    r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

    var data MyStruct
    if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
        http.Error(w, "Request body too large or invalid format", http.StatusBadRequest)
        return
    }
}
```

### Handle Response Write Order Correctly

```go
func handler(w http.ResponseWriter, r *http.Request) {
    // Must set response headers first
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("X-Custom-Header", "value")

    // Then set status code
    w.WriteHeader(http.StatusOK)

    // Finally write response body
    json.NewEncoder(w).Encode(data)
}
```

### Implement Graceful Shutdown

```go
// Listen for system signals
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

// Create timeout context
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

// Graceful shutdown
if err := server.Shutdown(ctx); err != nil {
    log.Printf("Shutdown error: %v", err)
}
```

### Use Middleware to Separate Concerns

```go
// Extract cross-cutting concerns into middleware
chain := Chain(
    RequestID,      // Request tracing
    Logging,        // Logging
    Recovery,       // Panic recovery
    CORS,           // Cross-origin handling
    RateLimit,      // Rate limiting
    Auth,           // Authentication
    Timeout,        // Timeout control
)

handler := chain(finalHandler)
```

### Use HTTPS in Production

```go
// Use Let's Encrypt automatic certificates
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

## Common Pitfalls

### Forgetting to Close Response Body

```go
// Wrong: Not closing response body, causing connection leak
resp, err := http.Get(url)
if err != nil {
    return err
}
// Forgot defer resp.Body.Close()

// Correct
resp, err := http.Get(url)
if err != nil {
    return err
}
defer resp.Body.Close()
```

### Setting Headers After WriteHeader

```go
// Wrong: Setting Header after WriteHeader has no effect
func handler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Header().Set("Content-Type", "application/json") // Ineffective!
}

// Correct: Set Header first
func handler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
}
```

### Calling WriteHeader Multiple Times

```go
// Wrong: Calling WriteHeader multiple times
func handler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.WriteHeader(http.StatusCreated) // Warning: multiple calls
}

// Write implicitly calls WriteHeader(200)
func handler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Hello")) // Implicit WriteHeader(200)
    w.WriteHeader(http.StatusCreated) // Warning: multiple calls
}
```

### Using ResponseWriter in Goroutine

```go
// Wrong: Using ResponseWriter in goroutine
func handler(w http.ResponseWriter, r *http.Request) {
    go func() {
        time.Sleep(time.Second)
        w.Write([]byte("Hello")) // Dangerous! Handler may have returned
    }()
}

// Correct: Use channel or wait in handler
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

### Not Checking Context Cancellation

```go
// Wrong: Ignoring context cancellation
func handler(w http.ResponseWriter, r *http.Request) {
    time.Sleep(10 * time.Second) // Continues even if client disconnects
    w.Write([]byte("Done"))
}

// Correct: Check context
func handler(w http.ResponseWriter, r *http.Request) {
    select {
    case <-time.After(10 * time.Second):
        w.Write([]byte("Done"))
    case <-r.Context().Done():
        return // Client disconnected, return immediately
    }
}
```

### Default Client Has No Timeout

```go
// Wrong: Using default Client (no timeout)
resp, err := http.Get(url) // May block forever

// Correct: Use Client with timeout
client := &http.Client{
    Timeout: 30 * time.Second,
}
resp, err := client.Get(url)
```

### ServeMux Route Matching Issues

```go
mux := http.NewServeMux()

// Note: Routes with trailing slash match all subpaths
mux.HandleFunc("/api/", apiHandler)      // Matches /api/xxx
mux.HandleFunc("/api/users", usersHandler) // Exact match /api/users

// Go 1.22+ use method prefix for clarity
mux.HandleFunc("GET /api/users", usersHandler)
mux.HandleFunc("GET /api/users/{id}", userHandler)
```

## Performance Considerations

### Connection Reuse

```go
// Configure Transport to reuse connections
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

### Response Buffering

```go
// Use bufio to improve write performance
func handler(w http.ResponseWriter, r *http.Request) {
    buf := bufio.NewWriter(w)
    defer buf.Flush()

    // Write large amounts of data
    for i := 0; i < 1000; i++ {
        buf.WriteString("line\n")
    }
}
```

### JSON Encoding Optimization

```go
// Pre-allocate JSON encoder
var jsonEncoder = json.NewEncoder

// Use sync.Pool to reuse buffers
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

### Response Compression

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

### Using HTTP/2

```go
// HTTPS automatically enables HTTP/2
server.ListenAndServeTLS(certFile, keyFile)

// Or explicitly configure HTTP/2
import "golang.org/x/net/http2"

http2.ConfigureServer(server, &http2.Server{})
```

### Performance Benchmarking

```go
// Use httptest for benchmarking
func BenchmarkHandler(b *testing.B) {
    handler := http.HandlerFunc(myHandler)

    for i := 0; i < b.N; i++ {
        req := httptest.NewRequest("GET", "/", nil)
        rec := httptest.NewRecorder()
        handler.ServeHTTP(rec, req)
    }
}
```

## Real-World Scenarios

### Scenario 1: API Gateway

```go
// Simple API gateway implementation
type Gateway struct {
    routes map[string]*url.URL
}

func (g *Gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    // Select backend based on path
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

### Scenario 2: File Server

```go
func fileServer() http.Handler {
    fs := http.FileServer(http.Dir("./static"))

    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Disable directory listing
        if strings.HasSuffix(r.URL.Path, "/") {
            http.NotFound(w, r)
            return
        }

        // Add cache headers
        w.Header().Set("Cache-Control", "public, max-age=31536000")

        fs.ServeHTTP(w, r)
    })
}
```

### Scenario 3: WebSocket Upgrade

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

### Scenario 4: Health Check Endpoint

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

## Interview Points

### Handler Interface

**Q: What is the http.Handler interface? Why is its design so simple?**

A: `http.Handler` is the core interface of Go's HTTP server, with only one method:

```go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}
```

Advantages of simple design:
- **Easy to implement**: Any type only needs to implement one method
- **Composition-friendly**: Middleware can easily wrap Handlers
- **Highly versatile**: Applicable to all HTTP handling scenarios

### ServeMux Routing Mechanism

**Q: How does ServeMux match routes?**

A: ServeMux uses longest prefix matching:
1. Exact matches take priority over prefix matches
2. Longer patterns take priority over shorter patterns
3. Go 1.22+ supports method and path parameter matching

```go
// Matching priority example
mux.HandleFunc("GET /users/{id}", ...)  // Highest priority
mux.HandleFunc("GET /users", ...)       // Medium priority
mux.HandleFunc("/users", ...)           // Lowest priority
```

### Middleware Pattern

**Q: How to implement and compose middleware?**

A: Middleware is a function that receives a Handler and returns a Handler:

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

### Graceful Shutdown

**Q: What is graceful shutdown? How to implement it?**

A: Graceful shutdown means when stopping the server:
1. Stop accepting new connections
2. Wait for existing requests to complete
3. Force close after timeout

```go
// Listen for signals
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

// Graceful shutdown
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
server.Shutdown(ctx)
```

### HTTP/2 Support

**Q: How does Go support HTTP/2?**

A:
- HTTPS automatically supports HTTP/2 (based on ALPN protocol negotiation)
- Can use h2c for cleartext HTTP/2
- Supports Server Push (HTTPS only)

```go
// Detect HTTP/2 Pusher
if pusher, ok := w.(http.Pusher); ok {
    pusher.Push("/static/style.css", nil)
}
```

### Performance Optimization

**Q: How to optimize HTTP server performance?**

A:
1. **Configure connection pool**: Reuse TCP connections
2. **Enable compression**: gzip compress responses
3. **Use HTTP/2**: Multiplexing
4. **Set timeouts**: Prevent slow connections
5. **Response buffering**: Reduce system calls
6. **Object pooling**: Reduce GC pressure

## Further Reading

### Official Documentation

- [net/http Package Documentation](https://pkg.go.dev/net/http)
- [Go HTTP/2 Documentation](https://pkg.go.dev/golang.org/x/net/http2)
- [Go 1.22 Release Notes (Enhanced Routing)](https://go.dev/doc/go1.22)

### Recommended Books

- "The Go Programming Language" - Alan A. A. Donovan
- "Go Web Programming" - Sau Sheong Chang
- "Concurrency in Go" - Katherine Cox-Buday

### Quality Articles

- [How I write HTTP services in Go after 13 years](https://grafana.com/blog/2024/02/09/how-i-write-http-services-in-go-after-13-years/)
- [The complete guide to Go net/http timeouts](https://blog.cloudflare.com/the-complete-guide-to-golang-net-http-timeouts/)
- [Go HTTP Server Best Practices](https://blog.golang.org/http-servers)

### Related Projects

- [Chi Router](https://github.com/go-chi/chi) - Lightweight router
- [Gorilla Mux](https://github.com/gorilla/mux) - Feature-rich router
- [Gin Framework](https://github.com/gin-gonic/gin) - High-performance web framework
- [Echo Framework](https://github.com/labstack/echo) - High-performance, minimalist web framework
