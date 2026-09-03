---
title: Go Error Handling
description: "Master Go error handling: error interface, error wrapping, panic and recover"
track: go
section: basics
difficulty: intermediate
tags:
  - Go
  - Error Handling
  - error
  - panic
status: imported
origin: old/src/content/docs/go/error-handling.en.md
divergence: 0.163
issues: []
legacy:
  category: Go
  subcategory: Error Handling
  order: 5
  lastUpdated: 2026-01-07
---

Error handling is a fundamental aspect of Go programming. Unlike many other languages that use exceptions, Go treats errors as values that must be explicitly handled. This approach makes error handling visible and forces developers to think about error cases, leading to more robust code.

## The Error Interface

At the core of Go's error handling is the built-in `error` interface:

```go
type error interface {
    Error() string
}
```

Any type that implements the `Error() string` method satisfies the error interface. This simple design makes it easy to create custom error types while maintaining consistency across the language.

### Basic Error Handling

The idiomatic way to handle errors in Go is to check the error value returned by functions:

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    file, err := os.Open("config.txt")
    if err != nil {
        fmt.Println("Error opening file:", err)
        return
    }
    defer file.Close()

    // Use the file
    fmt.Println("File opened successfully")
}
```

### Multiple Return Values

Go functions commonly return both a result and an error:

```go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("cannot divide by zero")
    }
    return a / b, nil
}

func main() {
    result, err := divide(10, 2)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Result:", result)
}
```

## Creating Errors

Go provides several ways to create error values.

### Using errors.New

The simplest way to create an error is with `errors.New`:

```go
import "errors"

var ErrNotFound = errors.New("resource not found")
var ErrInvalidInput = errors.New("invalid input provided")

func findUser(id int) error {
    if id <= 0 {
        return ErrInvalidInput
    }
    // Database lookup logic
    return ErrNotFound
}
```

### Using fmt.Errorf

For formatted error messages, use `fmt.Errorf`:

```go
import "fmt"

func processRequest(userID int) error {
    if userID < 0 {
        return fmt.Errorf("invalid user ID: %d", userID)
    }
    return nil
}
```

### Sentinel Errors

Sentinel errors are predefined error variables that can be compared using `==`:

```go
package main

import (
    "errors"
    "fmt"
)

var (
    ErrInsufficientFunds = errors.New("insufficient funds")
    ErrAccountLocked     = errors.New("account is locked")
)

func withdraw(amount float64, balance float64) error {
    if balance < amount {
        return ErrInsufficientFunds
    }
    return nil
}

func main() {
    err := withdraw(100, 50)
    if err == ErrInsufficientFunds {
        fmt.Println("Cannot complete withdrawal: insufficient funds")
    }
}
```

## Error Wrapping

Go 1.13 introduced error wrapping, which allows you to add context to errors while preserving the original error.

### Using fmt.Errorf with %w

The `%w` verb in `fmt.Errorf` wraps an error:

```go
package main

import (
    "errors"
    "fmt"
    "os"
)

func readConfig(filename string) error {
    _, err := os.Open(filename)
    if err != nil {
        return fmt.Errorf("failed to read config: %w", err)
    }
    return nil
}

func main() {
    err := readConfig("config.yaml")
    if err != nil {
        fmt.Println("Error:", err)
        // Output: Error: failed to read config: open config.yaml: no such file or directory
    }
}
```

### errors.Is

`errors.Is` checks if an error matches a specific error value in the error chain:

```go
package main

import (
    "errors"
    "fmt"
    "os"
)

func processFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return fmt.Errorf("processing failed: %w", err)
    }
    defer file.Close()
    return nil
}

func main() {
    err := processFile("missing.txt")
    if errors.Is(err, os.ErrNotExist) {
        fmt.Println("File does not exist")
    } else if err != nil {
        fmt.Println("Other error:", err)
    }
}
```

### errors.As

`errors.As` attempts to find a specific error type in the error chain:

```go
package main

import (
    "errors"
    "fmt"
    "os"
)

func readFile(filename string) error {
    _, err := os.Open(filename)
    if err != nil {
        return fmt.Errorf("read operation failed: %w", err)
    }
    return nil
}

func main() {
    err := readFile("test.txt")

    var pathErr *os.PathError
    if errors.As(err, &pathErr) {
        fmt.Printf("Failed operation: %s\n", pathErr.Op)
        fmt.Printf("Path: %s\n", pathErr.Path)
        fmt.Printf("Error: %s\n", pathErr.Err)
    }
}
```

### Unwrapping Errors

You can manually unwrap errors using `errors.Unwrap`:

```go
package main

import (
    "errors"
    "fmt"
)

func main() {
    err1 := errors.New("original error")
    err2 := fmt.Errorf("wrapped: %w", err1)
    err3 := fmt.Errorf("double wrapped: %w", err2)

    fmt.Println("err3:", err3)
    fmt.Println("Unwrap once:", errors.Unwrap(err3))
    fmt.Println("Unwrap twice:", errors.Unwrap(errors.Unwrap(err3)))
}
```

## Custom Error Types

Creating custom error types allows you to include additional context and implement custom behavior.

### Basic Custom Error

```go
package main

import "fmt"

type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on field '%s': %s", e.Field, e.Message)
}

func validateEmail(email string) error {
    if len(email) == 0 {
        return &ValidationError{
            Field:   "email",
            Message: "email cannot be empty",
        }
    }
    if !contains(email, "@") {
        return &ValidationError{
            Field:   "email",
            Message: "email must contain @",
        }
    }
    return nil
}

func contains(s, substr string) bool {
    return len(s) > 0 && len(substr) > 0 && s != substr
}

func main() {
    if err := validateEmail("invalid"); err != nil {
        if valErr, ok := err.(*ValidationError); ok {
            fmt.Printf("Field: %s, Issue: %s\n", valErr.Field, valErr.Message)
        }
    }
}
```

### Custom Error with Unwrap

For custom errors that wrap other errors, implement the `Unwrap` method:

```go
package main

import (
    "errors"
    "fmt"
)

type DatabaseError struct {
    Query string
    Err   error
}

func (e *DatabaseError) Error() string {
    return fmt.Sprintf("database error executing query '%s': %v", e.Query, e.Err)
}

func (e *DatabaseError) Unwrap() error {
    return e.Err
}

func executeQuery(query string) error {
    // Simulate a database error
    originalErr := errors.New("connection timeout")
    return &DatabaseError{
        Query: query,
        Err:   originalErr,
    }
}

func main() {
    err := executeQuery("SELECT * FROM users")
    if err != nil {
        fmt.Println(err)

        // Can still unwrap to get the original error
        fmt.Println("Original error:", errors.Unwrap(err))
    }
}
```

### Custom Error with Multiple Contexts

```go
package main

import (
    "fmt"
    "time"
)

type RequestError struct {
    StatusCode int
    Method     string
    URL        string
    Timestamp  time.Time
    Err        error
}

func (e *RequestError) Error() string {
    return fmt.Sprintf("[%s] %s %s failed with status %d: %v",
        e.Timestamp.Format(time.RFC3339),
        e.Method,
        e.URL,
        e.StatusCode,
        e.Err,
    )
}

func (e *RequestError) Unwrap() error {
    return e.Err
}

func makeRequest(url string) error {
    return &RequestError{
        StatusCode: 404,
        Method:     "GET",
        URL:        url,
        Timestamp:  time.Now(),
        Err:        fmt.Errorf("resource not found"),
    }
}

func main() {
    if err := makeRequest("https://api.example.com/users/123"); err != nil {
        if reqErr, ok := err.(*RequestError); ok {
            fmt.Printf("Status: %d\n", reqErr.StatusCode)
            fmt.Printf("URL: %s\n", reqErr.URL)
            fmt.Printf("Time: %s\n", reqErr.Timestamp.Format(time.RFC3339))
        }
    }
}
```

## Panic and Recover

While Go emphasizes explicit error handling, it also provides `panic` and `recover` for exceptional situations.

### Understanding Panic

`panic` is a built-in function that stops the normal execution of a goroutine:

```go
package main

import "fmt"

func main() {
    fmt.Println("Starting program")
    panic("something went wrong")
    fmt.Println("This line will never execute")
}
```

### When to Use Panic

Use `panic` only for truly exceptional situations:

```go
package main

import "fmt"

func initializeDatabase() {
    // If database initialization fails, the application cannot continue
    connected := false
    if !connected {
        panic("failed to connect to database: application cannot start")
    }
}

func main() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Application failed to start:", r)
        }
    }()

    initializeDatabase()
}
```

### Recover from Panic

`recover` is a built-in function that regains control of a panicking goroutine:

```go
package main

import "fmt"

func mightPanic() {
    panic("something went wrong")
}

func safeExecute() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered from panic:", r)
        }
    }()

    mightPanic()
    fmt.Println("This line won't execute")
}

func main() {
    safeExecute()
    fmt.Println("Program continues after recovery")
}
```

### Practical Recovery Example

```go
package main

import (
    "fmt"
    "log"
)

func processItem(item interface{}) (result string, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("panic occurred: %v", r)
        }
    }()

    // This might panic if item is not a string
    result = item.(string)
    return result, nil
}

func main() {
    items := []interface{}{"hello", 42, "world"}

    for _, item := range items {
        result, err := processItem(item)
        if err != nil {
            log.Printf("Error processing item: %v\n", err)
            continue
        }
        fmt.Printf("Processed: %s\n", result)
    }
}
```

### Panic with Stack Trace

When a panic occurs without recovery, Go prints a stack trace:

```go
package main

func level3() {
    panic("critical error")
}

func level2() {
    level3()
}

func level1() {
    level2()
}

func main() {
    level1()
}
```

### Defer, Panic, and Recover Together

The combination of defer, panic, and recover provides a powerful error handling mechanism:

```go
package main

import (
    "fmt"
    "log"
)

type Server struct {
    name string
}

func (s *Server) handleRequest(request string) (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("server %s: panic handling request '%s': %v",
                s.name, request, r)
            log.Println(err)
        }
    }()

    if request == "crash" {
        panic("intentional crash")
    }

    fmt.Printf("Server %s processed: %s\n", s.name, request)
    return nil
}

func main() {
    server := &Server{name: "API-1"}

    requests := []string{"ping", "crash", "status"}

    for _, req := range requests {
        err := server.handleRequest(req)
        if err != nil {
            fmt.Printf("Request failed but server continues: %v\n", err)
        }
    }

    fmt.Println("Server still running after panic recovery")
}
```

## Best Practices

### Always Check Errors

```go
// Bad
result, _ := someFunction()

// Good
result, err := someFunction()
if err != nil {
    return fmt.Errorf("failed to execute someFunction: %w", err)
}
```

### Provide Context When Wrapping Errors

```go
func loadConfig(filename string) error {
    data, err := os.ReadFile(filename)
    if err != nil {
        // Add context about what we were trying to do
        return fmt.Errorf("loading config from %s: %w", filename, err)
    }
    // Process data...
    return nil
}
```

### Define Errors at Package Level

```go
package user

import "errors"

var (
    ErrNotFound        = errors.New("user not found")
    ErrInvalidPassword = errors.New("invalid password")
    ErrAccountLocked   = errors.New("account locked")
)
```

### Use Custom Error Types for Rich Context

```go
type AuthError struct {
    UserID   int
    Reason   string
    Attempt  int
    Err      error
}

func (e *AuthError) Error() string {
    return fmt.Sprintf("authentication failed for user %d (attempt %d): %s: %v",
        e.UserID, e.Attempt, e.Reason, e.Err)
}

func (e *AuthError) Unwrap() error {
    return e.Err
}
```

### Reserve Panic for Unrecoverable Situations

```go
// Good use of panic
func NewServer(config *Config) *Server {
    if config == nil {
        panic("server config cannot be nil")
    }
    // ...
}

// Bad use of panic - should return error instead
func getUser(id int) *User {
    user, err := db.Query(id)
    if err != nil {
        panic(err) // Don't do this
    }
    return user
}
```

### Handle Errors at the Appropriate Level

```go
func processFile(filename string) error {
    data, err := readFile(filename)
    if err != nil {
        // Handle or wrap error at appropriate level
        if errors.Is(err, os.ErrNotExist) {
            // Handle specific case
            return fmt.Errorf("configuration file missing: %w", err)
        }
        return err
    }
    // Process data...
    return nil
}
```

### Use errors.Is and errors.As Instead of Type Assertions

```go
// Good
if errors.Is(err, os.ErrNotExist) {
    // Handle not found
}

var pathErr *os.PathError
if errors.As(err, &pathErr) {
    // Use pathErr
}

// Avoid
if err == os.ErrNotExist { // Doesn't work with wrapped errors
    // ...
}
```

## Error Handling Patterns

### Error Aggregation

Collecting multiple errors:

```go
package main

import (
    "errors"
    "fmt"
)

type MultiError struct {
    Errors []error
}

func (m *MultiError) Error() string {
    return fmt.Sprintf("multiple errors occurred: %d errors", len(m.Errors))
}

func (m *MultiError) Add(err error) {
    if err != nil {
        m.Errors = append(m.Errors, err)
    }
}

func (m *MultiError) HasErrors() bool {
    return len(m.Errors) > 0
}

func validateUser(username, email, password string) error {
    var errs MultiError

    if len(username) < 3 {
        errs.Add(errors.New("username too short"))
    }
    if !contains(email, "@") {
        errs.Add(errors.New("invalid email"))
    }
    if len(password) < 8 {
        errs.Add(errors.New("password too short"))
    }

    if errs.HasErrors() {
        return &errs
    }
    return nil
}

func main() {
    err := validateUser("ab", "invalid", "123")
    if err != nil {
        if multiErr, ok := err.(*MultiError); ok {
            fmt.Printf("Validation failed with %d errors:\n", len(multiErr.Errors))
            for i, e := range multiErr.Errors {
                fmt.Printf("  %d. %v\n", i+1, e)
            }
        }
    }
}
```

### Retry Logic with Errors

```go
package main

import (
    "errors"
    "fmt"
    "time"
)

func retryOperation(maxAttempts int, operation func() error) error {
    var lastErr error

    for attempt := 1; attempt <= maxAttempts; attempt++ {
        err := operation()
        if err == nil {
            return nil
        }

        lastErr = err
        fmt.Printf("Attempt %d failed: %v\n", attempt, err)

        if attempt < maxAttempts {
            time.Sleep(time.Second * time.Duration(attempt))
        }
    }

    return fmt.Errorf("operation failed after %d attempts: %w", maxAttempts, lastErr)
}

func main() {
    attempts := 0
    err := retryOperation(3, func() error {
        attempts++
        if attempts < 3 {
            return errors.New("temporary failure")
        }
        return nil
    })

    if err != nil {
        fmt.Println("Final error:", err)
    } else {
        fmt.Println("Operation succeeded")
    }
}
```

## Conclusion

Go's error handling approach emphasizes explicitness and simplicity. By treating errors as values, Go makes error handling visible and forces developers to consider error cases explicitly. Key takeaways:

- Use the error interface for standard error handling
- Wrap errors with `fmt.Errorf` and `%w` to add context
- Use `errors.Is` and `errors.As` to check for specific errors in wrapped chains
- Create custom error types for rich error context
- Reserve `panic` and `recover` for truly exceptional situations
- Always check and handle errors explicitly

This approach leads to more robust, maintainable code where error handling is a first-class concern rather than an afterthought.
