---
title: Go defer, panic and recover
description: Deep understanding of Go's defer, panic and recover mechanisms, and error handling strategies
track: go
section: basics
difficulty: intermediate
tags:
  - Go
  - defer
  - panic
  - recover
  - error handling
status: imported
origin: old/src/content/docs/go/defer-panic-recover.en.md
divergence: 0.198
issues: []
legacy:
  category: Go
  subcategory: Core Concepts
  order: 17
  lastUpdated: 2026-01-07
---

Go provides unique `defer`, `panic`, and `recover` mechanisms to handle cleanup work and exceptional situations when functions exit. These three keywords work together to form an important part of Go's error handling and resource management. We explore their working principles, use cases, and best practices in depth.

## defer Basics

The `defer` statement is used to delay function execution. The deferred function will execute before the containing function returns. This is one of the most commonly used features in Go, primarily used for resource cleanup and finishing work.

### Basic Syntax

```go
package main

import "fmt"

func main() {
    defer fmt.Println("world")
    fmt.Println("hello")
}

// Output:
// hello
// world
```

The `defer` statement pushes function calls onto a stack. When the outer function returns, the deferred functions execute in **Last-In-First-Out (LIFO)** order.

### Resource Cleanup Example

The most common use of `defer` is ensuring resources are properly released:

```go
package main

import (
    "fmt"
    "os"
)

func readFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return fmt.Errorf("failed to open file: %w", err)
    }
    defer file.Close() // Ensure the file will be closed

    // Read file contents...
    buf := make([]byte, 1024)
    n, err := file.Read(buf)
    if err != nil {
        return fmt.Errorf("failed to read file: %w", err)
    }

    fmt.Printf("Read %d bytes\n", n)
    return nil
}

func main() {
    if err := readFile("test.txt"); err != nil {
        fmt.Println("Error:", err)
    }
}
```

### Execution Order of Multiple defers

When there are multiple `defer` statements, they execute in Last-In-First-Out order:

```go
package main

import "fmt"

func main() {
    fmt.Println("Start")

    defer fmt.Println("First defer")
    defer fmt.Println("Second defer")
    defer fmt.Println("Third defer")

    fmt.Println("End")
}

// Output:
// Start
// End
// Third defer
// Second defer
// First defer
```

## defer Stack Mechanism

### How the defer Stack Works

Each goroutine has a defer stack. When a `defer` statement is executed, the Go runtime pushes the deferred function and its arguments onto the stack. When the function returns, these deferred functions are popped and executed in LIFO order.

```go
package main

import "fmt"

func countdown() {
    for i := 1; i <= 5; i++ {
        defer fmt.Printf("%d ", i)
    }
}

func main() {
    countdown()
    fmt.Println()
}

// Output: 5 4 3 2 1
```

### defer Argument Evaluation Timing

Function arguments in `defer` statements are evaluated immediately when the `defer` statement executes, not when the deferred function executes:

```go
package main

import "fmt"

func main() {
    x := 10

    // Argument is evaluated at defer time, x's value is 10
    defer fmt.Println("Value of x in defer:", x)

    x = 20
    fmt.Println("Value of x after modification:", x)
}

// Output:
// Value of x after modification: 20
// Value of x in defer: 10
```

### Using Closures to Capture Variables

If you need to use the latest variable value in a deferred function, you can use a closure:

```go
package main

import "fmt"

func main() {
    x := 10

    // Use closure to capture variable reference
    defer func() {
        fmt.Println("Value of x in closure:", x)
    }()

    x = 20
    fmt.Println("Value of x after modification:", x)
}

// Output:
// Value of x after modification: 20
// Value of x in closure: 20
```

### defer and Return Values

`defer` can modify named return values:

```go
package main

import "fmt"

func deferredReturn() (result int) {
    defer func() {
        result = result * 2 // Modify named return value
    }()
    return 10 // result is set to 10
}

func main() {
    fmt.Println(deferredReturn()) // Output: 20
}
```

This feature is very useful in error handling:

```go
package main

import (
    "fmt"
    "os"
)

func writeFile(filename string, data []byte) (err error) {
    file, err := os.Create(filename)
    if err != nil {
        return err
    }

    defer func() {
        closeErr := file.Close()
        if err == nil {
            err = closeErr // Only report close error if no other errors
        }
    }()

    _, err = file.Write(data)
    return err
}

func main() {
    err := writeFile("output.txt", []byte("Hello, World!"))
    if err != nil {
        fmt.Println("Write failed:", err)
    }
}
```

## Advanced defer Usage

### Paired Resource Operations

`defer` is ideal for handling operations that come in pairs:

```go
package main

import (
    "fmt"
    "sync"
)

func safeOperation(mu *sync.Mutex) {
    mu.Lock()
    defer mu.Unlock()

    // Critical section code
    fmt.Println("Executing safe operation")
}

func main() {
    var mu sync.Mutex
    safeOperation(&mu)
}
```

### Performance Tracing

Using `defer` to implement function execution time tracing:

```go
package main

import (
    "fmt"
    "time"
)

func trace(name string) func() {
    start := time.Now()
    fmt.Printf("%s started\n", name)
    return func() {
        fmt.Printf("%s completed, took %v\n", name, time.Since(start))
    }
}

func slowOperation() {
    defer trace("slowOperation")()

    // Simulate time-consuming operation
    time.Sleep(100 * time.Millisecond)
}

func main() {
    slowOperation()
}

// Output:
// slowOperation started
// slowOperation completed, took 100.xxxms
```

### Database Transaction Handling

```go
package main

import (
    "database/sql"
    "fmt"
)

func executeTransaction(db *sql.DB) error {
    tx, err := db.Begin()
    if err != nil {
        return err
    }

    // Use defer to handle transaction commit or rollback
    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p) // Re-throw panic
        } else if err != nil {
            tx.Rollback()
        } else {
            err = tx.Commit()
        }
    }()

    // Execute database operations
    _, err = tx.Exec("INSERT INTO users (name) VALUES (?)", "Alice")
    if err != nil {
        return err
    }

    _, err = tx.Exec("INSERT INTO profiles (user_id, bio) VALUES (?, ?)", 1, "Hello")
    return err
}
```

### defer and Loops

Special attention is needed when using `defer` in loops, as deferred functions don't execute after each iteration:

```go
package main

import (
    "fmt"
    "os"
)

// Bad example: File handles accumulate
func badExample(files []string) error {
    for _, filename := range files {
        file, err := os.Open(filename)
        if err != nil {
            return err
        }
        defer file.Close() // All files closed only when function ends
        // Process file...
    }
    return nil
}

// Good example: Use closure for immediate handling
func goodExample(files []string) error {
    for _, filename := range files {
        err := func() error {
            file, err := os.Open(filename)
            if err != nil {
                return err
            }
            defer file.Close() // Closed immediately after each iteration

            // Process file...
            return nil
        }()
        if err != nil {
            return err
        }
    }
    return nil
}

// Another approach: Extract to separate function
func processFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    // Process file...
    return nil
}

func betterExample(files []string) error {
    for _, filename := range files {
        if err := processFile(filename); err != nil {
            return err
        }
    }
    return nil
}
```

## panic Mechanism

`panic` is Go's runtime panic mechanism, used to handle unrecoverable error situations. When a program encounters a situation where it cannot continue execution, it can call `panic` to interrupt normal execution flow.

### Triggering panic

`panic` can be triggered explicitly by the program or by runtime errors:

```go
package main

import "fmt"

func main() {
    // Explicitly call panic
    // panic("A serious error occurred")

    // Runtime error triggers panic
    var arr [5]int
    _ = arr[10] // index out of range: will trigger panic

    fmt.Println("This line won't execute")
}
```

### Common Runtime panics

```go
package main

func main() {
    // 1. Array/slice out of bounds
    arr := []int{1, 2, 3}
    _ = arr[10] // panic: runtime error: index out of range

    // 2. Nil pointer dereference
    var ptr *int
    _ = *ptr // panic: runtime error: invalid memory address or nil pointer dereference

    // 3. Type assertion failure
    var i interface{} = "hello"
    _ = i.(int) // panic: interface conversion: interface {} is string, not int

    // 4. Sending to closed channel
    ch := make(chan int)
    close(ch)
    ch <- 1 // panic: send on closed channel

    // 5. Concurrent map read and write
    m := make(map[int]int)
    go func() {
        for {
            m[1] = 1
        }
    }()
    for {
        _ = m[1] // panic: concurrent map read and map write
    }
}
```

### panic Propagation

When a `panic` occurs, the program immediately stops executing the current function and begins executing that function's defer statements. Then the panic propagates up to the next level in the call stack, repeating this process until reaching the top of the goroutine or being caught by recover.

```go
package main

import "fmt"

func level1() {
    defer fmt.Println("level1 defer")
    level2()
    fmt.Println("level1 end") // Won't execute
}

func level2() {
    defer fmt.Println("level2 defer")
    level3()
    fmt.Println("level2 end") // Won't execute
}

func level3() {
    defer fmt.Println("level3 defer")
    panic("panic occurred in level3")
    fmt.Println("level3 end") // Won't execute
}

func main() {
    defer fmt.Println("main defer")
    level1()
    fmt.Println("main end") // Won't execute
}

// Output:
// level3 defer
// level2 defer
// level1 defer
// main defer
// panic: panic occurred in level3
// ...stack trace...
```

### panic Arguments

`panic` can accept arguments of any type:

```go
package main

import "fmt"

// Custom error type
type CustomError struct {
    Code    int
    Message string
}

func (e CustomError) Error() string {
    return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

func main() {
    defer func() {
        if r := recover(); r != nil {
            switch v := r.(type) {
            case string:
                fmt.Println("String panic:", v)
            case error:
                fmt.Println("Error panic:", v)
            case CustomError:
                fmt.Printf("Custom error panic: Code=%d, Message=%s\n", v.Code, v.Message)
            default:
                fmt.Printf("Unknown type panic: %v\n", v)
            }
        }
    }()

    // Trigger panic with custom type
    panic(CustomError{Code: 500, Message: "Internal server error"})
}
```

## recover Usage

`recover` is a built-in function used to recover from panic. It can only be effectively called within a defer function.

### Basic Usage

```go
package main

import "fmt"

func riskyOperation() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Printf("Recovered from panic: %v\n", r)
        }
    }()

    panic("A serious error occurred!")
}

func main() {
    fmt.Println("Start")
    riskyOperation()
    fmt.Println("Continue execution") // Will execute because panic was recovered
}

// Output:
// Start
// Recovered from panic: A serious error occurred!
// Continue execution
```

### Rules of recover

1. `recover` can only be called within a defer function
2. If no panic occurred, `recover` returns nil
3. `recover` can only catch panics from the current goroutine

```go
package main

import "fmt"

func main() {
    // Rule 1: Must be called within defer
    if r := recover(); r != nil { // Invalid, not in defer
        fmt.Println("This won't catch anything")
    }

    // Rule 2: Returns nil when no panic
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Caught panic:", r)
        } else {
            fmt.Println("No panic occurred")
        }
    }()

    fmt.Println("Normal execution")
}

// Output:
// Normal execution
// No panic occurred
```

### panic Across Goroutines

Each goroutine must have its own recover mechanism. A recover in one goroutine cannot catch a panic from another goroutine:

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    // Main goroutine's recover cannot catch child goroutine's panic
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Main goroutine caught:", r)
        }
    }()

    go func() {
        // Must set up recover in child goroutine
        defer func() {
            if r := recover(); r != nil {
                fmt.Println("Child goroutine caught:", r)
            }
        }()

        panic("child goroutine panic")
    }()

    time.Sleep(time.Second)
    fmt.Println("Main goroutine continues execution")
}

// Output:
// Child goroutine caught: child goroutine panic
// Main goroutine continues execution
```

### Converting panic to error

A common pattern is converting panic to a regular error return:

```go
package main

import (
    "fmt"
)

func safeCall(fn func()) (err error) {
    defer func() {
        if r := recover(); r != nil {
            switch v := r.(type) {
            case error:
                err = v
            case string:
                err = fmt.Errorf("%s", v)
            default:
                err = fmt.Errorf("panic: %v", v)
            }
        }
    }()

    fn()
    return nil
}

func riskyFunction() {
    panic("function execution failed")
}

func main() {
    err := safeCall(riskyFunction)
    if err != nil {
        fmt.Println("Caught error:", err)
    }
}

// Output: Caught error: function execution failed
```

## Error Handling Patterns

### Pattern 1: Boundary Protection

Use recover at program boundaries (such as HTTP handlers, RPC methods) to prevent the entire service from crashing:

```go
package main

import (
    "fmt"
    "log"
    "net/http"
    "runtime/debug"
)

// Recovery middleware
func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                // Log stack information
                log.Printf("panic recovered: %v\n%s", err, debug.Stack())

                // Return 500 error
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()

        next.ServeHTTP(w, r)
    })
}

func riskyHandler(w http.ResponseWriter, r *http.Request) {
    panic("error occurred while handling request")
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/risky", riskyHandler)

    // Wrap with middleware
    handler := recoveryMiddleware(mux)

    fmt.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", handler))
}
```

### Pattern 2: Internal panic to Error Conversion

Use panic internally in a library for control flow, but convert to error at public API boundaries:

```go
package main

import (
    "fmt"
)

// Internal parse error
type parseError struct {
    pos int
    msg string
}

func (e parseError) Error() string {
    return fmt.Sprintf("parse error at position %d: %s", e.pos, e.msg)
}

// Parser
type Parser struct {
    input string
    pos   int
}

// Internal method, uses panic
func (p *Parser) expect(ch byte) {
    if p.pos >= len(p.input) || p.input[p.pos] != ch {
        panic(parseError{pos: p.pos, msg: fmt.Sprintf("expected '%c'", ch)})
    }
    p.pos++
}

func (p *Parser) parseNumber() int {
    start := p.pos
    for p.pos < len(p.input) && p.input[p.pos] >= '0' && p.input[p.pos] <= '9' {
        p.pos++
    }
    if start == p.pos {
        panic(parseError{pos: p.pos, msg: "expected number"})
    }

    result := 0
    for i := start; i < p.pos; i++ {
        result = result*10 + int(p.input[i]-'0')
    }
    return result
}

// Public API, uses recover to convert to error
func (p *Parser) Parse(input string) (result int, err error) {
    defer func() {
        if r := recover(); r != nil {
            if pe, ok := r.(parseError); ok {
                err = pe
            } else {
                panic(r) // Re-throw non-parse errors
            }
        }
    }()

    p.input = input
    p.pos = 0

    result = p.parseNumber()
    return result, nil
}

func main() {
    p := &Parser{}

    // Successful parse
    num, err := p.Parse("12345")
    if err != nil {
        fmt.Println("Error:", err)
    } else {
        fmt.Println("Parse result:", num)
    }

    // Failed parse
    num, err = p.Parse("abc")
    if err != nil {
        fmt.Println("Error:", err)
    } else {
        fmt.Println("Parse result:", num)
    }
}

// Output:
// Parse result: 12345
// Error: parse error at position 0: expected number
```

### Pattern 3: Error with Stack Trace

Record stack information when panic occurs for debugging:

```go
package main

import (
    "fmt"
    "runtime"
)

// Error with stack trace
type StackError struct {
    Err   error
    Stack []byte
}

func (e *StackError) Error() string {
    return fmt.Sprintf("%v\nStack trace:\n%s", e.Err, e.Stack)
}

func (e *StackError) Unwrap() error {
    return e.Err
}

// Capture stack information
func captureStack() []byte {
    buf := make([]byte, 4096)
    n := runtime.Stack(buf, false)
    return buf[:n]
}

// Safe execute function
func safeExecute(fn func()) (err error) {
    defer func() {
        if r := recover(); r != nil {
            var e error
            switch v := r.(type) {
            case error:
                e = v
            default:
                e = fmt.Errorf("%v", v)
            }
            err = &StackError{
                Err:   e,
                Stack: captureStack(),
            }
        }
    }()

    fn()
    return nil
}

func causePanic() {
    var arr []int
    _ = arr[0] // Trigger panic
}

func main() {
    err := safeExecute(causePanic)
    if err != nil {
        fmt.Println("Caught error:")
        fmt.Println(err)
    }
}
```

### Pattern 4: Goroutine Pool Error Handling

```go
package main

import (
    "context"
    "fmt"
    "sync"
)

// Task result
type TaskResult struct {
    ID    int
    Value interface{}
    Err   error
}

// Worker pool
type WorkerPool struct {
    workers int
    tasks   chan func() (interface{}, error)
    results chan TaskResult
    wg      sync.WaitGroup
}

func NewWorkerPool(workers int) *WorkerPool {
    return &WorkerPool{
        workers: workers,
        tasks:   make(chan func() (interface{}, error), 100),
        results: make(chan TaskResult, 100),
    }
}

func (p *WorkerPool) Start(ctx context.Context) {
    for i := 0; i < p.workers; i++ {
        p.wg.Add(1)
        go p.worker(ctx, i)
    }
}

func (p *WorkerPool) worker(ctx context.Context, id int) {
    defer p.wg.Done()

    for {
        select {
        case <-ctx.Done():
            return
        case task, ok := <-p.tasks:
            if !ok {
                return
            }

            result := p.executeTask(id, task)
            p.results <- result
        }
    }
}

func (p *WorkerPool) executeTask(id int, task func() (interface{}, error)) (result TaskResult) {
    result.ID = id

    defer func() {
        if r := recover(); r != nil {
            result.Err = fmt.Errorf("worker %d panic: %v", id, r)
        }
    }()

    result.Value, result.Err = task()
    return result
}

func (p *WorkerPool) Submit(task func() (interface{}, error)) {
    p.tasks <- task
}

func (p *WorkerPool) Results() <-chan TaskResult {
    return p.results
}

func (p *WorkerPool) Close() {
    close(p.tasks)
    p.wg.Wait()
    close(p.results)
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    pool := NewWorkerPool(3)
    pool.Start(ctx)

    // Submit tasks
    pool.Submit(func() (interface{}, error) {
        return "Task 1 succeeded", nil
    })

    pool.Submit(func() (interface{}, error) {
        panic("Task 2 crashed")
    })

    pool.Submit(func() (interface{}, error) {
        return "Task 3 succeeded", nil
    })

    // Collect results
    go func() {
        for result := range pool.Results() {
            if result.Err != nil {
                fmt.Printf("Worker %d error: %v\n", result.ID, result.Err)
            } else {
                fmt.Printf("Worker %d result: %v\n", result.ID, result.Value)
            }
        }
    }()

    pool.Close()
}
```

## Best Practices

### When to Use panic

`panic` should only be used in the following situations:

1. **Program initialization failure**: Unrecoverable configuration errors

```go
func init() {
    cfg, err := loadConfig()
    if err != nil {
        panic(fmt.Sprintf("failed to load config: %v", err))
    }
    globalConfig = cfg
}
```

2. **Programming errors**: Indicates a program logic error that should be fixed

```go
func MustCompile(pattern string) *regexp.Regexp {
    re, err := regexp.Compile(pattern)
    if err != nil {
        panic(fmt.Sprintf("invalid regex pattern: %s", pattern))
    }
    return re
}
```

3. **Unrecoverable system errors**: Such as memory exhaustion

### When Not to Use panic

1. **Regular error handling**: Use error return values

```go
// Bad practice
func readConfig(path string) Config {
    data, err := os.ReadFile(path)
    if err != nil {
        panic(err) // Should not use panic
    }
    // ...
}

// Good practice
func readConfig(path string) (Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return Config{}, fmt.Errorf("failed to read config: %w", err)
    }
    // ...
}
```

2. **User input validation**: User input errors should not cause panic

```go
// Bad practice
func parseUserAge(input string) int {
    age, err := strconv.Atoi(input)
    if err != nil {
        panic("invalid age input")
    }
    return age
}

// Good practice
func parseUserAge(input string) (int, error) {
    age, err := strconv.Atoi(input)
    if err != nil {
        return 0, fmt.Errorf("invalid age input: %s", input)
    }
    return age, nil
}
```

### defer Best Practices

1. **defer immediately after resource acquisition**

```go
func processResource() error {
    resource, err := acquire()
    if err != nil {
        return err
    }
    defer resource.Release() // defer immediately after acquisition

    // Use resource...
    return nil
}
```

2. **Check errors in defer**

```go
func writeFile(filename string, data []byte) (err error) {
    file, err := os.Create(filename)
    if err != nil {
        return err
    }

    defer func() {
        if cerr := file.Close(); cerr != nil && err == nil {
            err = cerr
        }
    }()

    _, err = file.Write(data)
    return err
}
```

3. **Avoid using defer in loops**

```go
// Extract to separate function
func processFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    // Process file...
    return nil
}

func processAllFiles(files []string) error {
    for _, f := range files {
        if err := processFile(f); err != nil {
            return err
        }
    }
    return nil
}
```

### recover Best Practices

1. **Only use at necessary boundaries**

```go
// HTTP handler boundary
func httpHandler(w http.ResponseWriter, r *http.Request) {
    defer func() {
        if err := recover(); err != nil {
            log.Printf("request handling panic: %v", err)
            http.Error(w, "Internal Server Error", 500)
        }
    }()

    // Handle request...
}
```

2. **Log sufficient debugging information**

```go
defer func() {
    if err := recover(); err != nil {
        log.Printf("panic: %v\nstack: %s", err, debug.Stack())
    }
}()
```

3. **Consider whether recovery is really needed**

```go
// Some panics may need to let the program crash
defer func() {
    if err := recover(); err != nil {
        // Check if it's a recoverable error
        if _, ok := err.(recoverableError); ok {
            log.Printf("recovered: %v", err)
            return
        }
        // Unrecoverable error, re-panic
        panic(err)
    }
}()
```

## Common Pitfalls and Considerations

### Pitfall 1: defer Evaluation Timing

```go
package main

import "fmt"

func main() {
    i := 0
    defer fmt.Println(i) // i is evaluated here, value is 0
    i++
}

// Output: 0, not 1
```

### Pitfall 2: Loop Variable Capture

```go
package main

import "fmt"

func main() {
    for i := 0; i < 3; i++ {
        defer func() {
            fmt.Println(i) // Captures reference to variable i
        }()
    }
}

// Output: 3 3 3 (behavior before Go 1.22)
// Starting from Go 1.22, loop variables create new copies on each iteration
```

### Pitfall 3: nil Function Call

```go
package main

func main() {
    var fn func()
    defer fn() // panic: runtime error: invalid memory address or nil pointer dereference
}
```

### Pitfall 4: recover Scope

```go
package main

import "fmt"

func main() {
    defer func() {
        // recover in nested defer is ineffective
        defer func() {
            recover() // Cannot catch the outer panic
        }()
    }()

    panic("test")
}
```

### Pitfall 5: Modifying Non-Named Return Values

```go
package main

import "fmt"

// Cannot modify non-named return values through defer
func nonNamedReturn() int {
    result := 10
    defer func() {
        result = 20 // Won't affect return value
    }()
    return result
}

// Can modify named return values through defer
func namedReturn() (result int) {
    result = 10
    defer func() {
        result = 20 // Will affect return value
    }()
    return result
}

func main() {
    fmt.Println(nonNamedReturn()) // Output: 10
    fmt.Println(namedReturn())    // Output: 20
}
```

## Performance Considerations

### defer Performance Overhead

Starting from Go 1.14, the compiler significantly optimized defer, and most defer calls have almost no extra overhead:

```go
package main

import "testing"

func withDefer() int {
    defer func() {}()
    return 1
}

func withoutDefer() int {
    return 1
}

func BenchmarkWithDefer(b *testing.B) {
    for i := 0; i < b.N; i++ {
        withDefer()
    }
}

func BenchmarkWithoutDefer(b *testing.B) {
    for i := 0; i < b.N; i++ {
        withoutDefer()
    }
}
```

### When to Avoid defer

In extremely performance-sensitive scenarios, consider manually managing resources:

```go
// Performance-sensitive scenario
func processData(data []byte) error {
    // Approach without defer
    result, err := parse(data)
    if err != nil {
        cleanup(result)
        return err
    }

    err = validate(result)
    if err != nil {
        cleanup(result)
        return err
    }

    err = save(result)
    cleanup(result)
    return err
}
```

## Summary

Go's `defer`, `panic`, and `recover` mechanisms provide powerful error handling and resource management capabilities:

| Feature | Purpose | Best Practice |
|---------|---------|---------------|
| `defer` | Delayed execution, resource cleanup | defer release immediately after acquiring resource |
| `panic` | Unrecoverable errors | Only use for programming errors and initialization failures |
| `recover` | Catch panic | Only use at boundaries, log debugging information |

Key points:

1. **defer** is Last-In-First-Out, arguments are evaluated at declaration time
2. **panic** should be used sparingly, prefer error return values
3. **recover** can only be called within a defer function and can only catch panics from the current goroutine
4. In production code, add recover at service boundaries to prevent the entire service from crashing
5. Always log sufficient debugging information, including stack traces

Mastering the correct usage of these three mechanisms is an important foundation for writing robust, maintainable Go programs.
