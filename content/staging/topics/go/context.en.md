---
title: Context
description: "Complete Guide to Go Context: Request Cancellation, Timeout Control, and Value Propagation"
track: go
section: stdlib
difficulty: intermediate
tags:
  - Go
  - Context
  - 取消
  - 超时
status: imported
origin: old/src/content/docs/go/context.en.md
divergence: 0.2
issues: []
legacy:
  category: Go
  subcategory: 核心概念
  order: 7
  lastUpdated: 2026-01-07
---

Context is a core mechanism in Go for propagating cancellation signals, timeout control, and request-scoped values between goroutines. It defines the standard way to pass deadlines, cancellation signals, and other request-scoped values across API boundaries and between processes.

## Why Context is Needed

When building Go services, we often face the following scenarios:

1. **Request Cancellation**: When a user cancels a request, all related background work needs to stop
2. **Timeout Control**: Database queries and HTTP requests need to complete within a specified time
3. **Request Tracing**: Propagating request IDs, user information, and other metadata throughout the call chain
4. **Resource Cleanup**: Ensuring goroutines can exit gracefully to avoid resource leaks

Context provides a unified, standard solution.

## Context Interface Explained

```go
type Context interface {
    // Deadline returns the time when the context will be cancelled
    // If no deadline is set, ok returns false
    Deadline() (deadline time.Time, ok bool)

    // Done returns a channel that is closed when the context is cancelled
    // If the context can never be cancelled, Done returns nil
    Done() <-chan struct{}

    // Err returns the reason why the context was cancelled
    // If the Done channel is not yet closed, returns nil
    // If cancelled, returns Canceled
    // If timed out, returns DeadlineExceeded
    Err() error

    // Value returns the value associated with key
    // If there is no associated value, returns nil
    Value(key any) any
}
```

## Creating Root Context

Go provides two functions to create root Context: `context.Background()` and `context.TODO()`.

### context.Background()

`Background` returns a non-nil, empty Context. It is never cancelled, has no values, and has no deadline.

```go
package main

import (
    "context"
    "fmt"
)

func main() {
    // Create root context
    ctx := context.Background()

    // Check context status
    deadline, ok := ctx.Deadline()
    fmt.Printf("Has deadline: %v\n", ok)           // false
    fmt.Printf("Deadline: %v\n", deadline)         // 0001-01-01 00:00:00 +0000 UTC
    fmt.Printf("Done channel: %v\n", ctx.Done())   // <nil>
    fmt.Printf("Error: %v\n", ctx.Err())           // <nil>
}
```

**Use Cases**:
- As the top-level Context in the main function
- In initialization code
- In test code
- As the top-level Context for incoming requests

### context.TODO()

`TODO` also returns a non-nil, empty Context, semantically indicating "I'm not sure which Context to use".

```go
func processData() {
    // When unsure which context to use, use TODO
    // This is usually temporary and should be replaced with a proper context later
    ctx := context.TODO()

    // Use ctx for operations
    doWork(ctx)
}
```

**Use Cases**:
- During code refactoring when the correct Context is not yet determined
- Static analysis tools can detect TODO usage and remind developers to address it

**Important Note**: Never pass a nil Context. If you're unsure what Context to use, use `context.TODO()`.

## WithCancel: Manual Cancellation Control

`WithCancel` returns a derived Context and a cancel function. Calling the cancel function closes the Context's Done channel.

### Basic Usage

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
            fmt.Printf("Worker %d: received cancellation signal, reason: %v\n", id, ctx.Err())
            done <- true
            return
        default:
            fmt.Printf("Worker %d: working...\n", id)
            time.Sleep(300 * time.Millisecond)
        }
    }
}

func main() {
    // Derive a cancellable context from Background
    ctx, cancel := context.WithCancel(context.Background())

    done := make(chan bool, 3)

    // Start multiple workers
    for i := 1; i <= 3; i++ {
        go worker(ctx, i, done)
    }

    // Let workers work for 1 second
    time.Sleep(1 * time.Second)

    // Cancel all workers
    fmt.Println("\nMain: sending cancellation signal")
    cancel()

    // Wait for all workers to exit
    for i := 0; i < 3; i++ {
        <-done
    }
    fmt.Println("All workers have exited")
}
```

### Cascading Cancellation

When a parent Context is cancelled, all child Contexts derived from it are also cancelled.

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    // Create context hierarchy
    rootCtx := context.Background()

    parentCtx, parentCancel := context.WithCancel(rootCtx)
    childCtx1, childCancel1 := context.WithCancel(parentCtx)
    childCtx2, childCancel2 := context.WithCancel(parentCtx)
    grandchildCtx, grandchildCancel := context.WithCancel(childCtx1)

    // Monitor all contexts
    go func() {
        <-grandchildCtx.Done()
        fmt.Println("Grandchild context cancelled:", grandchildCtx.Err())
    }()

    go func() {
        <-childCtx1.Done()
        fmt.Println("Child context 1 cancelled:", childCtx1.Err())
    }()

    go func() {
        <-childCtx2.Done()
        fmt.Println("Child context 2 cancelled:", childCtx2.Err())
    }()

    time.Sleep(100 * time.Millisecond)

    // Cancelling the parent context cascades to all descendants
    fmt.Println("Cancelling parent context...")
    parentCancel()

    time.Sleep(100 * time.Millisecond)

    // These calls are safe but have no additional effect
    childCancel1()
    childCancel2()
    grandchildCancel()
}
```

**Output**:
```
Cancelling parent context...
Grandchild context cancelled: context canceled
Child context 1 cancelled: context canceled
Child context 2 cancelled: context canceled
```

### WithCancelCause: Cancellation with Reason

Go 1.20 introduced `WithCancelCause`, which allows specifying a reason when cancelling.

```go
package main

import (
    "context"
    "errors"
    "fmt"
)

var ErrUserCanceled = errors.New("user actively cancelled the operation")

func main() {
    ctx, cancel := context.WithCancelCause(context.Background())

    go func() {
        <-ctx.Done()
        fmt.Println("Context error:", ctx.Err())
        fmt.Println("Cancellation reason:", context.Cause(ctx))
    }()

    // Provide reason when cancelling
    cancel(ErrUserCanceled)

    // Give goroutine time to print
    select {}
}
```

**Output**:
```
Context error: context canceled
Cancellation reason: user actively cancelled the operation
```

## WithTimeout: Timeout Control

`WithTimeout` creates a Context that is automatically cancelled after a specified duration. This is the most common way to handle timeouts.

### Basic Usage

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func slowOperation(ctx context.Context) (string, error) {
    // Simulate a time-consuming operation
    select {
    case <-time.After(3 * time.Second):
        return "Operation completed", nil
    case <-ctx.Done():
        return "", ctx.Err()
    }
}

func main() {
    // Create context with 2-second timeout
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel() // Important: always call cancel to release resources

    fmt.Println("Starting operation...")
    start := time.Now()

    result, err := slowOperation(ctx)

    elapsed := time.Since(start)
    if err != nil {
        fmt.Printf("Operation failed (took %.2fs): %v\n", elapsed.Seconds(), err)
    } else {
        fmt.Printf("Operation succeeded (took %.2fs): %s\n", elapsed.Seconds(), result)
    }
}
```

**Output**:
```
Starting operation...
Operation failed (took 2.00s): context deadline exceeded
```

### HTTP Request Timeout

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
    // Create context with timeout
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()

    // Create request with context
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    // Send request
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    // Read response
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, fmt.Errorf("failed to read response: %w", err)
    }

    return body, nil
}

func main() {
    url := "https://httpbin.org/delay/5" // 5-second delayed response

    fmt.Println("Sending request (3-second timeout)...")
    start := time.Now()

    _, err := fetchWithTimeout(url, 3*time.Second)

    elapsed := time.Since(start)
    if err != nil {
        fmt.Printf("Request failed (took %.2fs): %v\n", elapsed.Seconds(), err)
    }
}
```

### Nested Timeouts

A child Context's timeout cannot exceed its parent Context's timeout.

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    // Parent context: 2-second timeout
    parentCtx, parentCancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer parentCancel()

    // Child context attempts to set 5-second timeout
    // But will actually be limited by parent's 2-second timeout
    childCtx, childCancel := context.WithTimeout(parentCtx, 5*time.Second)
    defer childCancel()

    // Check the actual deadline
    if deadline, ok := childCtx.Deadline(); ok {
        remaining := time.Until(deadline)
        fmt.Printf("Child context actual remaining time: %.2f seconds\n", remaining.Seconds())
    }

    // Wait for child context to timeout
    <-childCtx.Done()
    fmt.Println("Child context timed out:", childCtx.Err())
}
```

**Output**:
```
Child context actual remaining time: 2.00 seconds
Child context timed out: context deadline exceeded
```

## WithDeadline: Deadline Control

`WithDeadline` is similar to `WithTimeout`, but uses an absolute time rather than a relative duration.

### Basic Usage

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func processTask(ctx context.Context, taskName string) error {
    // Check remaining time
    if deadline, ok := ctx.Deadline(); ok {
        remaining := time.Until(deadline)
        fmt.Printf("%s: %.2f seconds remaining\n", taskName, remaining.Seconds())

        if remaining < 100*time.Millisecond {
            return fmt.Errorf("insufficient time remaining")
        }
    }

    // Simulate task execution
    select {
    case <-time.After(500 * time.Millisecond):
        fmt.Printf("%s: completed\n", taskName)
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}

func main() {
    // Set deadline 1.2 seconds from now
    deadline := time.Now().Add(1200 * time.Millisecond)
    ctx, cancel := context.WithDeadline(context.Background(), deadline)
    defer cancel()

    fmt.Printf("Deadline: %s\n", deadline.Format("15:04:05.000"))

    // Execute multiple tasks
    tasks := []string{"Task A", "Task B", "Task C"}
    for _, task := range tasks {
        if err := processTask(ctx, task); err != nil {
            fmt.Printf("%s failed: %v\n", task, err)
            break
        }
    }
}
```

### WithTimeout vs WithDeadline

```go
// These two approaches are functionally equivalent
timeout := 5 * time.Second

ctx1, cancel1 := context.WithTimeout(context.Background(), timeout)
defer cancel1()

deadline := time.Now().Add(timeout)
ctx2, cancel2 := context.WithDeadline(context.Background(), deadline)
defer cancel2()
```

**Selection Guidelines**:
- **WithTimeout**: Use when you know "how long the operation should take"
- **WithDeadline**: Use when you know "the operation must complete by a certain time"

## WithValue: Passing Request-Scoped Values

`WithValue` is used to propagate request-related metadata through the call chain.

### Basic Usage

```go
package main

import (
    "context"
    "fmt"
)

// Use custom types as keys to avoid collisions
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

    fmt.Printf("Processing request:\n")
    fmt.Printf("  User ID: %v\n", userID)
    fmt.Printf("  Request ID: %v\n", requestID)
    fmt.Printf("  Trace ID: %v\n", traceID)
}

func main() {
    // Add values layer by layer
    ctx := context.Background()
    ctx = context.WithValue(ctx, userIDKey, "user-12345")
    ctx = context.WithValue(ctx, requestIDKey, "req-67890")
    ctx = context.WithValue(ctx, traceIDKey, "trace-abcdef")

    handleRequest(ctx)
}
```

### Type-Safe Wrapper

The best practice is to provide type-safe accessor functions for Context values.

```go
package main

import (
    "context"
    "fmt"
)

// key type is unexported to prevent direct external access
type ctxKey int

const (
    userKey ctxKey = iota
    requestKey
)

// User represents user information
type User struct {
    ID       string
    Name     string
    Email    string
    IsAdmin  bool
}

// Request represents request information
type Request struct {
    ID        string
    IP        string
    UserAgent string
}

// WithUser adds user information to context
func WithUser(ctx context.Context, user *User) context.Context {
    return context.WithValue(ctx, userKey, user)
}

// GetUser retrieves user information from context
func GetUser(ctx context.Context) (*User, bool) {
    user, ok := ctx.Value(userKey).(*User)
    return user, ok
}

// WithRequest adds request information to context
func WithRequest(ctx context.Context, req *Request) context.Context {
    return context.WithValue(ctx, requestKey, req)
}

// GetRequest retrieves request information from context
func GetRequest(ctx context.Context) (*Request, bool) {
    req, ok := ctx.Value(requestKey).(*Request)
    return req, ok
}

func processRequest(ctx context.Context) {
    // Type-safe value retrieval
    if user, ok := GetUser(ctx); ok {
        fmt.Printf("User: %s (%s)\n", user.Name, user.Email)
        if user.IsAdmin {
            fmt.Println("Privileges: Administrator")
        }
    }

    if req, ok := GetRequest(ctx); ok {
        fmt.Printf("Request ID: %s\n", req.ID)
        fmt.Printf("Client IP: %s\n", req.IP)
    }
}

func main() {
    ctx := context.Background()

    // Add user information
    user := &User{
        ID:      "u-001",
        Name:    "John Doe",
        Email:   "johndoe@example.com",
        IsAdmin: true,
    }
    ctx = WithUser(ctx, user)

    // Add request information
    req := &Request{
        ID:        "req-123456",
        IP:        "192.168.1.100",
        UserAgent: "Mozilla/5.0",
    }
    ctx = WithRequest(ctx, req)

    processRequest(ctx)
}
```

### WithValue Usage Principles

**Suitable data to store**:
- Request ID, Trace ID
- User authentication information
- Source IP, User-Agent
- Request start time
- Logging-related metadata

**Data that should NOT be stored**:
- Optional function parameters
- Business logic data
- Database connections, configuration objects
- Mutable shared state

```go
// Bad practice: using context to pass optional parameters
func badExample(ctx context.Context) {
    debug := ctx.Value("debug").(bool) // Dangerous and unclear
    if debug {
        // ...
    }
}

// Good practice: explicit parameters
func goodExample(ctx context.Context, debug bool) {
    if debug {
        // ...
    }
}
```

## Practical Use Cases

### Database Query Timeout

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
    // Set query timeout
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
            return nil, fmt.Errorf("query timeout")
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
        // Check context on each iteration
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

### Concurrent Task Coordination

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
            Data:   fmt.Sprintf("Data from %s", source),
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
        {"Cache", 100 * time.Millisecond},
        {"Database", 500 * time.Millisecond},
        {"External API", 2 * time.Second},
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

    // Close channel after all requests complete
    go func() {
        wg.Wait()
        close(results)
    }()

    // Collect results
    var allResults []Result
    for result := range results {
        allResults = append(allResults, result)
    }

    return allResults
}

func main() {
    // Set 1-second timeout
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel()

    fmt.Println("Starting concurrent data fetch...")
    results := fetchAll(ctx)

    fmt.Println("\nResults:")
    for _, r := range results {
        if r.Err != nil {
            fmt.Printf("  %s: failed - %v\n", r.Source, r.Err)
        } else {
            fmt.Printf("  %s: %s\n", r.Source, r.Data)
        }
    }
}
```

**Output**:
```
Starting concurrent data fetch...

Results:
  Cache: Data from Cache
  Database: Data from Database
  External API: failed - context deadline exceeded
```

### HTTP Server Middleware

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

// Request ID middleware
func requestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := fmt.Sprintf("req-%d", time.Now().UnixNano())
        ctx := context.WithValue(r.Context(), requestIDKey, requestID)

        // Add to response header
        w.Header().Set("X-Request-ID", requestID)

        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Timeout middleware
func timeoutMiddleware(timeout time.Duration) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            ctx, cancel := context.WithTimeout(r.Context(), timeout)
            defer cancel()

            // Use channel to wait for completion or timeout
            done := make(chan struct{})
            go func() {
                next.ServeHTTP(w, r.WithContext(ctx))
                close(done)
            }()

            select {
            case <-done:
                // Completed normally
            case <-ctx.Done():
                // Timeout
                http.Error(w, "Request timeout", http.StatusGatewayTimeout)
            }
        })
    }
}

// Logging middleware
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        requestID := r.Context().Value(requestIDKey)

        log.Printf("[%v] Started processing %s %s", requestID, r.Method, r.URL.Path)

        next.ServeHTTP(w, r)

        log.Printf("[%v] Completed processing, duration: %v", requestID, time.Since(start))
    })
}

// Business handler
func handleAPI(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    requestID := ctx.Value(requestIDKey)

    // Simulate time-consuming operation
    select {
    case <-time.After(2 * time.Second):
        fmt.Fprintf(w, "Request %v processed successfully", requestID)
    case <-ctx.Done():
        log.Printf("[%v] Request cancelled: %v", requestID, ctx.Err())
        return
    }
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/api", handleAPI)

    // Apply middleware chain
    handler := requestIDMiddleware(
        loggingMiddleware(
            timeoutMiddleware(3*time.Second)(mux),
        ),
    )

    fmt.Println("Server started on :8080")
    log.Fatal(http.ListenAndServe(":8080", handler))
}
```

### Graceful Server Shutdown

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
        // Simulate processing
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
    fmt.Printf("Server started on %s\n", s.httpServer.Addr)
    return s.httpServer.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
    fmt.Println("Gracefully shutting down server...")
    return s.httpServer.Shutdown(ctx)
}

func main() {
    server := NewServer(":8080")

    // Start server in goroutine
    go func() {
        if err := server.Start(); err != http.ErrServerClosed {
            fmt.Printf("Server error: %v\n", err)
        }
    }()

    // Listen for system signals
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

    // Wait for signal
    sig := <-sigChan
    fmt.Printf("\nReceived signal: %v\n", sig)

    // Create context with shutdown timeout
    // Give in-progress requests 30 seconds to complete
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // Graceful shutdown
    if err := server.Shutdown(ctx); err != nil {
        fmt.Printf("Shutdown error: %v\n", err)
    } else {
        fmt.Println("Server gracefully shut down")
    }
}
```

### Cancellation Propagation in Pipeline Pattern

```go
package main

import (
    "context"
    "fmt"
    "time"
)

// Generator: produces a series of numbers
func generator(ctx context.Context) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        n := 0
        for {
            select {
            case <-ctx.Done():
                fmt.Println("Generator: received cancellation signal")
                return
            case out <- n:
                n++
                time.Sleep(100 * time.Millisecond)
            }
        }
    }()
    return out
}

// Square: calculates square values
func square(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for {
            select {
            case <-ctx.Done():
                fmt.Println("Squarer: received cancellation signal")
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

// Printer: outputs results
func printer(ctx context.Context, in <-chan int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("Printer: received cancellation signal")
            return
        case n, ok := <-in:
            if !ok {
                return
            }
            fmt.Printf("Result: %d\n", n)
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
    defer cancel()

    // Build pipeline
    numbers := generator(ctx)
    squares := square(ctx, numbers)

    // Consume results
    printer(ctx, squares)

    fmt.Println("Program ended")
}
```

## Context Best Practices

### Context as First Parameter

```go
// Correct
func FetchUser(ctx context.Context, id int64) (*User, error) {
    // ...
}

// Incorrect
func FetchUser(id int64, ctx context.Context) (*User, error) {
    // ...
}
```

### Don't Store Context in Structs

```go
// Incorrect
type Server struct {
    ctx context.Context // Don't do this
}

// Correct
type Server struct {
    // Other fields
}

func (s *Server) Process(ctx context.Context) error {
    // Pass context through parameters
}
```

### Always Call the Cancel Function

```go
func process(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel() // Always call, even if function returns early

    // Business logic
    return nil
}
```

The importance of calling `cancel()`:
- Releases resources associated with the Context
- Stops internal timers
- Allows the garbage collector to reclaim related memory

### Check Context Errors

```go
func worker(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            err := ctx.Err()
            switch err {
            case context.Canceled:
                return fmt.Errorf("work was cancelled")
            case context.DeadlineExceeded:
                return fmt.Errorf("work timed out")
            default:
                return err
            }
        default:
            // Continue working
            if err := doWork(); err != nil {
                return err
            }
        }
    }
}
```

### Set Reasonable Timeout Values

```go
// Layered timeout design
func handleRequest(ctx context.Context) error {
    // Total timeout 10 seconds
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()

    // Database query 3 seconds
    dbCtx, dbCancel := context.WithTimeout(ctx, 3*time.Second)
    defer dbCancel()
    user, err := queryUser(dbCtx)

    // External API call 5 seconds
    apiCtx, apiCancel := context.WithTimeout(ctx, 5*time.Second)
    defer apiCancel()
    data, err := callExternalAPI(apiCtx)

    // ...
}
```

### Avoid Overusing WithValue

```go
// Bad: passing business parameters
func bad(ctx context.Context) {
    limit := ctx.Value("limit").(int) // Unclear, not type-safe
}

// Good: explicit parameters
func good(ctx context.Context, limit int) {
    // Clear and obvious
}

// Appropriate use case for WithValue
func middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Request trace ID
        ctx := context.WithValue(r.Context(), traceIDKey, generateTraceID())
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

## Common Mistakes and Pitfalls

### Goroutine Leaks

```go
// Incorrect: goroutine never exits
func leak() {
    ch := make(chan int)
    go func() {
        for v := range ch {
            fmt.Println(v)
        }
    }()
    // ch is never closed, goroutine blocks forever
}

// Correct: use context to control lifecycle
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

### Forgetting to Propagate Context

```go
// Incorrect: creating new context, losing cancellation capability
func bad(ctx context.Context) {
    newCtx := context.Background() // Wrong!
    callExternalService(newCtx)
}

// Correct: continue passing or derive
func good(ctx context.Context) {
    // Pass directly
    callExternalService(ctx)

    // Or derive
    childCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    callExternalService(childCtx)
}
```

### Cancelling at the Wrong Time

```go
// Incorrect: premature cancellation
func bad() error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    cancel() // Cancelled immediately!
    return doWork(ctx) // ctx is already cancelled
}

// Correct: use defer
func good() error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel() // Cancel when function returns
    return doWork(ctx)
}
```

### Context Value Type Assertion Failures

```go
// Dangerous: not checking type assertion
func dangerous(ctx context.Context) {
    user := ctx.Value(userKey).(*User) // Panics if value doesn't exist or wrong type
}

// Safe: check ok
func safe(ctx context.Context) {
    user, ok := ctx.Value(userKey).(*User)
    if !ok {
        // Handle missing or wrong type case
        return
    }
    // Use user
}
```

## Performance Considerations

### Context Creation Overhead

```go
// Context creation is very lightweight
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

### WithValue Lookup Performance

WithValue lookup is O(n), where n is the depth of the value chain.

```go
// Deep nesting affects performance
func deepNesting() {
    ctx := context.Background()
    for i := 0; i < 100; i++ {
        ctx = context.WithValue(ctx, i, i)
    }
    // Looking up early-added values requires traversing the entire chain
    _ = ctx.Value(0) // O(100)
}
```

**Optimization suggestions**:
- Avoid deeply nested WithValue chains
- Consider putting multiple values into a single struct

## Summary

Context is the core infrastructure for concurrent programming in Go. Mastering it is essential for building robust Go applications.

### Key Points

| Function | Purpose | Key Points |
|----------|---------|------------|
| `Background()` | Create root Context | Use in main, init, tests |
| `TODO()` | Temporary placeholder | Use during refactoring, replace later |
| `WithCancel()` | Manual cancellation | Always call the returned cancel function |
| `WithTimeout()` | Relative timeout | Uses relative duration (e.g., 5 seconds) |
| `WithDeadline()` | Absolute deadline | Uses absolute time point |
| `WithValue()` | Pass values | Only for request-scoped metadata |

### Golden Rules

1. **Pass Explicitly**: Context is passed through function parameters, not stored in structs
2. **First Parameter**: Context is always the first parameter of a function
3. **Don't Pass nil**: Use `Background()` or `TODO()` instead of nil
4. **Always Cancel**: Use `defer cancel()` to ensure resource release
5. **Use Values Sparingly**: WithValue is only for request-scoped data

By using Context correctly, you can build responsive, resource-efficient, and maintainable Go applications.
