---
title: Go 错误包装
description: 深入理解 Go 错误包装机制：fmt.Errorf %w、errors.Is、errors.As、错误链与自定义错误类型
track: go
section: basics
difficulty: intermediate
tags:
  - Go
  - 错误处理
  - error
  - 错误包装
  - errors.Is
  - errors.As
status: imported
origin: old/src/content/docs/go/error-wrapping.en.md
divergence: 0.194
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 错误处理
  order: 6
  lastUpdated: 2026-01-07
---

Error wrapping is an important feature introduced in Go 1.13 that allows adding context information while preserving the original error, forming an error chain. This mechanism significantly improves the traceability and debuggability of error handling.

## Concept Explanation

### What is Error Wrapping

Error Wrapping is a technique that embeds the original error into a new error. The wrapped error remains intact while the outer error can add additional context information. This forms an Error Chain that allows callers to see both high-level error descriptions and trace back to the underlying root cause.

```go
// Original error
err := os.Open("config.json")
// open config.json: no such file or directory

// Wrapped error
wrappedErr := fmt.Errorf("failed to load config: %w", err)
// failed to load config: open config.json: no such file or directory
```

### Historical Background

Before Go 1.13, error handling had the following pain points:

1. **Context Loss**: Using `fmt.Errorf("xxx: %v", err)` only preserves the error string, losing the original error type
2. **Type Checking Difficulty**: Unable to determine if the error chain contains a specific error
3. **Third-party Library Dependency**: Required third-party libraries like `github.com/pkg/errors` to implement error wrapping

Go 1.13 incorporated error wrapping capabilities into the standard library by introducing the `%w` verb, `errors.Is`, and `errors.As` functions. Go 1.20 further enhanced this by supporting wrapping multiple errors simultaneously.

### Problems Solved

| Problem | Traditional Approach | Error Wrapping Approach |
|---------|---------------------|------------------------|
| Adding Context | Loses original error type | Preserves complete error chain |
| Error Checking | String comparison (unreliable) | `errors.Is` for precise matching |
| Type Extraction | Type assertion (top-level only) | `errors.As` traverses error chain |
| Root Cause Tracing | Not possible | `errors.Unwrap` for layer-by-layer unwrapping |

## Core Principles

### The Unwrap Interface

The core of error wrapping is the `Unwrap` interface. Any error type that implements the `Unwrap() error` method supports unwrapping:

```go
// Unwrap interface in standard library (implicit interface)
type unwrapper interface {
    Unwrap() error
}

// Go 1.20+ supports multi-error wrapping
type multiUnwrapper interface {
    Unwrap() []error
}
```

### fmt.Errorf's %w Implementation

When using the `%w` verb, `fmt.Errorf` returns an internal type that implements the `Unwrap` method:

```go
// Simplified internal implementation principle
type wrapError struct {
    msg string
    err error
}

func (e *wrapError) Error() string {
    return e.msg
}

func (e *wrapError) Unwrap() error {
    return e.err
}
```

### How errors.Is Works

`errors.Is` finds the target error by recursively unwrapping the error chain:

```go
// Simplified errors.Is implementation principle
func Is(err, target error) bool {
    if target == nil {
        return err == target
    }

    // 1. Direct comparison
    if err == target {
        return true
    }

    // 2. Check if it implements the Is method
    if x, ok := err.(interface{ Is(error) bool }); ok {
        if x.Is(target) {
            return true
        }
    }

    // 3. Recursive unwrapping
    if unwrapped := Unwrap(err); unwrapped != nil {
        return Is(unwrapped, target)
    }

    return false
}
```

### How errors.As Works

`errors.As` traverses the error chain looking for an error assignable to the target type:

```go
// Simplified errors.As implementation principle
func As(err error, target any) bool {
    // target must be a non-nil pointer
    val := reflect.ValueOf(target)
    typ := val.Type().Elem()

    for err != nil {
        // Check if assignable
        if reflect.TypeOf(err).AssignableTo(typ) {
            val.Elem().Set(reflect.ValueOf(err))
            return true
        }

        // Check if it implements the As method
        if x, ok := err.(interface{ As(any) bool }); ok {
            if x.As(target) {
                return true
            }
        }

        // Continue unwrapping
        err = Unwrap(err)
    }

    return false
}
```

### Error Chain Structure

```
                    ┌─────────────────────────────────────┐
                    │         Outermost Error             │
                    │  "service startup failed: failed    │
                    │   to load config: ..."              │
                    └─────────────────┬───────────────────┘
                                      │ Unwrap()
                    ┌─────────────────▼───────────────────┐
                    │         Middle Layer Error          │
                    │  "failed to load config: open       │
                    │   config.json..."                   │
                    └─────────────────┬───────────────────┘
                                      │ Unwrap()
                    ┌─────────────────▼───────────────────┐
                    │         Original Error              │
                    │  *os.PathError                      │
                    │  {Op: "open", Path: "config.json"}  │
                    └─────────────────────────────────────┘
```

## Key Points

### Difference Between %w and %v

```go
err := os.Open("file.txt")

// %v: Only preserves string, loses error chain
errV := fmt.Errorf("operation failed: %v", err)
errors.Is(errV, os.ErrNotExist) // false - cannot match

// %w: Preserves original error, forms error chain
errW := fmt.Errorf("operation failed: %w", err)
errors.Is(errW, os.ErrNotExist) // true - can match
```

### Difference Between errors.Is and ==

```go
var ErrNotFound = errors.New("not found")

err := fmt.Errorf("failed to query user: %w", ErrNotFound)

// Direct comparison: fails
if err == ErrNotFound {
    // Won't execute - err is a new wrapped error
}

// errors.Is: succeeds
if errors.Is(err, ErrNotFound) {
    // Will execute - traverses error chain to find ErrNotFound
}
```

### Difference Between errors.As and Type Assertion

```go
err := fmt.Errorf("processing failed: %w", &os.PathError{
    Op:   "open",
    Path: "/etc/config",
    Err:  os.ErrPermission,
})

// Type assertion: fails (only checks top level)
if pathErr, ok := err.(*os.PathError); ok {
    // Won't execute
}

// errors.As: succeeds (traverses error chain)
var pathErr *os.PathError
if errors.As(err, &pathErr) {
    // Will execute
    fmt.Println(pathErr.Path) // /etc/config
}
```

### Single %w Rule (Go 1.13-1.19)

Before Go 1.20, `fmt.Errorf` could only contain one `%w`:

```go
// Go 1.13-1.19: Only supports one %w
err := fmt.Errorf("error1: %w, error2: %v", err1, err2)
```

### Multi-error Wrapping (Go 1.20+)

Go 1.20 supports wrapping multiple errors simultaneously:

```go
// Go 1.20+: Supports multiple %w
err := fmt.Errorf("multiple errors: %w, %w", err1, err2)

// Or use errors.Join
err := errors.Join(err1, err2, err3)
```

## Code Examples

### Basic Error Wrapping

```go
package main

import (
    "errors"
    "fmt"
    "os"
)

// Predefined errors
var (
    ErrConfigNotFound = errors.New("config file not found")
    ErrInvalidConfig  = errors.New("invalid config format")
)

// Read config file
func readConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        if os.IsNotExist(err) {
            // Wrap as business error while preserving original error
            return nil, fmt.Errorf("%w: %w", ErrConfigNotFound, err)
        }
        return nil, fmt.Errorf("failed to read config: %w", err)
    }
    return data, nil
}

// Parse config
func parseConfig(data []byte) (map[string]string, error) {
    if len(data) == 0 {
        return nil, ErrInvalidConfig
    }
    // Simplified parsing logic
    return map[string]string{"key": "value"}, nil
}

// Load config (combining multiple operations)
func loadConfig(path string) (map[string]string, error) {
    data, err := readConfig(path)
    if err != nil {
        return nil, fmt.Errorf("failed to load config %s: %w", path, err)
    }

    config, err := parseConfig(data)
    if err != nil {
        return nil, fmt.Errorf("failed to parse config %s: %w", path, err)
    }

    return config, nil
}

func main() {
    config, err := loadConfig("app.json")
    if err != nil {
        // Complete error message
        fmt.Printf("Error: %v\n", err)

        // Check if config not found
        if errors.Is(err, ErrConfigNotFound) {
            fmt.Println("-> Please check if the config file exists")
        }

        // Check if system-level file not found
        if errors.Is(err, os.ErrNotExist) {
            fmt.Println("-> File system reports file does not exist")
        }

        // Extract PathError for detailed info
        var pathErr *os.PathError
        if errors.As(err, &pathErr) {
            fmt.Printf("-> Operation: %s, Path: %s\n", pathErr.Op, pathErr.Path)
        }
        return
    }

    fmt.Printf("Config loaded successfully: %v\n", config)
}
```

### Custom Wrappable Error Type

```go
package main

import (
    "errors"
    "fmt"
)

// HTTPError - HTTP error with status code
type HTTPError struct {
    Code    int
    Message string
    Err     error // Wrapped original error
}

func (e *HTTPError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("HTTP %d: %s: %v", e.Code, e.Message, e.Err)
    }
    return fmt.Sprintf("HTTP %d: %s", e.Code, e.Message)
}

// Unwrap implements error unwrapping
func (e *HTTPError) Unwrap() error {
    return e.Err
}

// Predefined HTTP errors
var (
    ErrNotFound     = &HTTPError{Code: 404, Message: "resource not found"}
    ErrUnauthorized = &HTTPError{Code: 401, Message: "unauthorized"}
    ErrForbidden    = &HTTPError{Code: 403, Message: "forbidden"}
)

// Create HTTP error with cause
func NewHTTPError(code int, message string, cause error) *HTTPError {
    return &HTTPError{
        Code:    code,
        Message: message,
        Err:     cause,
    }
}

// Simulate API call
func fetchUser(id int) (*User, error) {
    if id <= 0 {
        return nil, NewHTTPError(400, "invalid user ID",
            fmt.Errorf("ID must be positive, got: %d", id))
    }
    if id > 1000 {
        return nil, ErrNotFound
    }
    return &User{ID: id, Name: "John"}, nil
}

type User struct {
    ID   int
    Name string
}

func main() {
    _, err := fetchUser(-1)
    if err != nil {
        fmt.Printf("Error: %v\n", err)

        // Extract HTTPError
        var httpErr *HTTPError
        if errors.As(err, &httpErr) {
            fmt.Printf("Status Code: %d\n", httpErr.Code)
            fmt.Printf("Message: %s\n", httpErr.Message)

            // Get the wrapped original error
            if httpErr.Err != nil {
                fmt.Printf("Cause: %v\n", httpErr.Err)
            }
        }
    }
}
```

### Custom Error Implementing Is and As Methods

```go
package main

import (
    "errors"
    "fmt"
)

// ErrorCode error code type
type ErrorCode int

const (
    CodeUnknown ErrorCode = iota
    CodeNotFound
    CodeInvalidInput
    CodePermissionDenied
)

// AppError application error
type AppError struct {
    Code    ErrorCode
    Message string
    Err     error
}

func (e *AppError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Err)
    }
    return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
    return e.Err
}

// Is custom equality check
// Allows checking error type by Code only
func (e *AppError) Is(target error) bool {
    t, ok := target.(*AppError)
    if !ok {
        return false
    }
    // Only compare error codes
    return e.Code == t.Code
}

// Predefined error templates (for errors.Is matching)
var (
    ErrAppNotFound    = &AppError{Code: CodeNotFound}
    ErrAppInvalidInput = &AppError{Code: CodeInvalidInput}
    ErrAppPermission   = &AppError{Code: CodePermissionDenied}
)

// Create specific errors
func NewNotFoundError(resource string) error {
    return &AppError{
        Code:    CodeNotFound,
        Message: fmt.Sprintf("%s not found", resource),
    }
}

func NewInvalidInputError(field string, reason error) error {
    return &AppError{
        Code:    CodeInvalidInput,
        Message: fmt.Sprintf("field %s is invalid", field),
        Err:     reason,
    }
}

func main() {
    // Create specific error
    err := NewNotFoundError("user")

    // Match using predefined template
    if errors.Is(err, ErrAppNotFound) {
        fmt.Println("Match successful: this is a NotFound error")
    }

    // Create error with cause
    inputErr := NewInvalidInputError("email", errors.New("invalid format"))

    if errors.Is(inputErr, ErrAppInvalidInput) {
        fmt.Println("Match successful: this is an InvalidInput error")
    }

    // Extract complete error info
    var appErr *AppError
    if errors.As(inputErr, &appErr) {
        fmt.Printf("Error details: Code=%d, Message=%s\n", appErr.Code, appErr.Message)
    }
}
```

### errors.Join Multi-error Wrapping (Go 1.20+)

```go
package main

import (
    "errors"
    "fmt"
)

// Validation errors
type ValidationErrors struct {
    Errors []error
}

func (v *ValidationErrors) Error() string {
    return fmt.Sprintf("validation failed: %d errors", len(v.Errors))
}

// Unwrap returns all errors (Go 1.20+)
func (v *ValidationErrors) Unwrap() []error {
    return v.Errors
}

// Batch validation
func validateUser(name, email string, age int) error {
    var errs []error

    if name == "" {
        errs = append(errs, errors.New("name cannot be empty"))
    }
    if email == "" {
        errs = append(errs, errors.New("email cannot be empty"))
    }
    if age < 0 {
        errs = append(errs, fmt.Errorf("invalid age: %d", age))
    }

    if len(errs) > 0 {
        // Method 1: Use errors.Join
        return errors.Join(errs...)

        // Method 2: Use custom type
        // return &ValidationErrors{Errors: errs}
    }

    return nil
}

// Define specific error for checking
var ErrNameEmpty = errors.New("name cannot be empty")

func validateUserV2(name, email string, age int) error {
    var errs []error

    if name == "" {
        errs = append(errs, ErrNameEmpty)
    }
    if email == "" {
        errs = append(errs, errors.New("email cannot be empty"))
    }

    if len(errs) > 0 {
        return errors.Join(errs...)
    }
    return nil
}

func main() {
    // Test multiple errors
    err := validateUser("", "", -5)
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        // Output: Error: name cannot be empty
        //         email cannot be empty
        //         invalid age: -5
    }

    // Use errors.Is to check for specific error
    err2 := validateUserV2("", "test@example.com", 25)
    if errors.Is(err2, ErrNameEmpty) {
        fmt.Println("Detected name empty error")
    }
}
```

### Complete Layered Error Handling Example

```go
package main

import (
    "context"
    "database/sql"
    "errors"
    "fmt"
    "time"
)

// Define domain errors
var (
    ErrUserNotFound   = errors.New("user not found")
    ErrDuplicateEmail = errors.New("email already in use")
    ErrDBConnection   = errors.New("database connection failed")
)

// User model
type User struct {
    ID    int64
    Name  string
    Email string
}

// Repository layer
type UserRepository struct {
    db *sql.DB
}

func (r *UserRepository) FindByID(ctx context.Context, id int64) (*User, error) {
    // Simulate database query
    if id == 0 {
        // Simulate sql.ErrNoRows
        return nil, fmt.Errorf("query user %d: %w", id, sql.ErrNoRows)
    }
    if id < 0 {
        // Simulate connection error
        return nil, fmt.Errorf("database operation failed: %w", ErrDBConnection)
    }

    return &User{ID: id, Name: "Test User", Email: "test@example.com"}, nil
}

// Service layer
type UserService struct {
    repo *UserRepository
}

func (s *UserService) GetUser(ctx context.Context, id int64) (*User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        // Convert repository layer error to domain error
        if errors.Is(err, sql.ErrNoRows) {
            return nil, fmt.Errorf("failed to get user: %w",
                fmt.Errorf("%w (id=%d)", ErrUserNotFound, id))
        }
        // Preserve other errors
        return nil, fmt.Errorf("user service error: %w", err)
    }
    return user, nil
}

// Handler layer
type UserHandler struct {
    service *UserService
}

type APIResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   *APIError   `json:"error,omitempty"`
}

type APIError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
}

func (h *UserHandler) GetUser(ctx context.Context, id int64) APIResponse {
    user, err := h.service.GetUser(ctx, id)
    if err != nil {
        return h.handleError(err)
    }

    return APIResponse{
        Success: true,
        Data:    user,
    }
}

func (h *UserHandler) handleError(err error) APIResponse {
    // Return different API errors based on error type
    switch {
    case errors.Is(err, ErrUserNotFound):
        return APIResponse{
            Success: false,
            Error: &APIError{
                Code:    "USER_NOT_FOUND",
                Message: "The requested user does not exist",
            },
        }
    case errors.Is(err, ErrDBConnection):
        // Log detailed error
        fmt.Printf("Database error: %v\n", err)
        return APIResponse{
            Success: false,
            Error: &APIError{
                Code:    "INTERNAL_ERROR",
                Message: "Service temporarily unavailable, please try again later",
            },
        }
    default:
        fmt.Printf("Unknown error: %v\n", err)
        return APIResponse{
            Success: false,
            Error: &APIError{
                Code:    "UNKNOWN_ERROR",
                Message: "An unknown error occurred",
            },
        }
    }
}

func main() {
    // Build dependencies
    repo := &UserRepository{}
    service := &UserService{repo: repo}
    handler := &UserHandler{service: service}

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // Test normal case
    fmt.Println("=== Test Normal Query ===")
    resp := handler.GetUser(ctx, 1)
    fmt.Printf("Response: %+v\n", resp)

    // Test user not found
    fmt.Println("\n=== Test User Not Found ===")
    resp = handler.GetUser(ctx, 0)
    fmt.Printf("Response: %+v\n", resp)

    // Test database error
    fmt.Println("\n=== Test Database Error ===")
    resp = handler.GetUser(ctx, -1)
    fmt.Printf("Response: %+v\n", resp)
}
```

## Best Practices

### Add Context at the Error Source

```go
// Bad: Return raw error directly
func readFile(path string) ([]byte, error) {
    return os.ReadFile(path)
}

// Good: Add operation context
func readFile(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("read file %s: %w", path, err)
    }
    return data, nil
}
```

### Define Package-level Sentinel Errors

```go
package user

import "errors"

// Package-level sentinel errors for errors.Is checking
var (
    ErrNotFound       = errors.New("user: not found")
    ErrAlreadyExists  = errors.New("user: already exists")
    ErrInvalidInput   = errors.New("user: invalid input")
    ErrPermissionDeny = errors.New("user: permission denied")
)
```

### Use Error Types to Carry Structured Information

```go
// When you need to carry additional information, use custom error types
type NotFoundError struct {
    Resource string
    ID       string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s not found: %s", e.Resource, e.ID)
}

// Provide Is method for generic matching
func (e *NotFoundError) Is(target error) bool {
    _, ok := target.(*NotFoundError)
    return ok
}

// Sentinel value for errors.Is
var ErrNotFound = &NotFoundError{}
```

### Convert Errors at Boundaries

```go
// Repository layer: Use database-specific errors
func (r *Repo) FindByID(id int64) (*User, error) {
    err := r.db.QueryRow(...).Scan(...)
    if err == sql.ErrNoRows {
        return nil, fmt.Errorf("query user %d: %w", id, sql.ErrNoRows)
    }
    return user, err
}

// Service layer: Convert to domain errors
func (s *Service) GetUser(id int64) (*User, error) {
    user, err := s.repo.FindByID(id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            // Convert to domain error
            return nil, ErrUserNotFound
        }
        return nil, fmt.Errorf("failed to get user: %w", err)
    }
    return user, nil
}
```

### Avoid Over-wrapping

```go
// Bad: Wrapping at every layer, redundant information
// "handle request: call service: query data: read database: sql: no rows"

// Good: Only wrap where meaningful
func (s *Service) GetUser(id int64) (*User, error) {
    user, err := s.repo.FindByID(id)
    if err != nil {
        // Only add this layer of context
        return nil, fmt.Errorf("get user %d: %w", id, err)
    }
    return user, nil
}
```

### Log Complete Error Chain

```go
import "log/slog"

func handleRequest(w http.ResponseWriter, r *http.Request) {
    user, err := service.GetUser(ctx, id)
    if err != nil {
        // Log complete error chain for debugging
        slog.Error("request processing failed",
            "error", err,
            "user_id", id,
            "request_id", requestID,
        )

        // Error message returned to user should be concise
        if errors.Is(err, ErrNotFound) {
            http.Error(w, "User not found", http.StatusNotFound)
            return
        }
        http.Error(w, "Server error", http.StatusInternalServerError)
    }
}
```

## Common Pitfalls

### Confusing %w and %v

```go
var ErrPermission = errors.New("permission denied")

// Wrong: Using %v loses error chain
err := fmt.Errorf("operation failed: %v", ErrPermission)
errors.Is(err, ErrPermission) // false!

// Correct: Using %w preserves error chain
err := fmt.Errorf("operation failed: %w", ErrPermission)
errors.Is(err, ErrPermission) // true
```

### Wrong Parameter for errors.As

```go
var pathErr *os.PathError

// Wrong: Passing value instead of pointer
errors.As(err, pathErr)  // panic!

// Correct: Pass pointer to pointer
errors.As(err, &pathErr)
```

### Comparing Wrapped Errors

```go
var ErrNotFound = errors.New("not found")

err1 := fmt.Errorf("a: %w", ErrNotFound)
err2 := fmt.Errorf("b: %w", ErrNotFound)

// Wrong: Direct comparison
if err1 == err2 { // false - they are different error instances
}

// Correct: Use errors.Is to check if they contain the same original error
if errors.Is(err1, ErrNotFound) && errors.Is(err2, ErrNotFound) {
    // Both errors originate from ErrNotFound
}
```

### Forgetting to Implement Unwrap

```go
// Wrong: Custom error doesn't implement Unwrap
type MyError struct {
    Msg string
    Err error
}

func (e *MyError) Error() string {
    return e.Msg
}

err := &MyError{Msg: "failed", Err: os.ErrNotExist}
errors.Is(err, os.ErrNotExist) // false - cannot unwrap!

// Correct: Implement Unwrap method
func (e *MyError) Unwrap() error {
    return e.Err
}

errors.Is(err, os.ErrNotExist) // true
```

### Losing Error Context in Goroutines

```go
// Wrong: Error context lost in goroutine
func processItems(items []Item) error {
    var wg sync.WaitGroup
    var firstErr error

    for _, item := range items {
        wg.Add(1)
        go func(item Item) {
            defer wg.Done()
            if err := process(item); err != nil {
                firstErr = err // Race condition and loses context
            }
        }(item)
    }
    wg.Wait()
    return firstErr
}

// Correct: Use channel to collect errors and preserve context
func processItems(items []Item) error {
    errCh := make(chan error, len(items))
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        go func(item Item) {
            defer wg.Done()
            if err := process(item); err != nil {
                errCh <- fmt.Errorf("process %s: %w", item.ID, err)
            }
        }(item)
    }

    wg.Wait()
    close(errCh)

    var errs []error
    for err := range errCh {
        errs = append(errs, err)
    }

    if len(errs) > 0 {
        return errors.Join(errs...)
    }
    return nil
}
```

### Exposing Internal Implementation Details

```go
// Bad: Exposing database implementation details
func (s *Service) GetUser(id int64) (*User, error) {
    user, err := s.repo.Find(id)
    if err != nil {
        // Returning sql.ErrNoRows directly leaks implementation details
        return nil, err
    }
    return user, nil
}

// Good: Convert to domain error
func (s *Service) GetUser(id int64) (*User, error) {
    user, err := s.repo.Find(id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrUserNotFound
        }
        return nil, fmt.Errorf("failed to query user: %w", err)
    }
    return user, nil
}
```

## Performance Considerations

### Performance of errors.Is and errors.As

```go
// errors.Is needs to traverse the error chain, performance is proportional to chain length
// Usually error chains are not too long, performance impact is negligible

// Benchmark test
func BenchmarkErrorsIs(b *testing.B) {
    target := errors.New("target")
    // Create error chain with depth 10
    err := target
    for i := 0; i < 10; i++ {
        err = fmt.Errorf("wrap %d: %w", i, err)
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        errors.Is(err, target)
    }
}
// Result: approximately 100-200 ns/op (error chain depth 10)
```

### Performance of Error Creation

```go
// fmt.Errorf has some overhead, avoid in hot paths
func BenchmarkErrorCreation(b *testing.B) {
    existingErr := errors.New("existing")

    b.Run("errors.New", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _ = errors.New("error")
        }
    }) // ~20 ns/op

    b.Run("fmt.Errorf-simple", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _ = fmt.Errorf("error: %d", i)
        }
    }) // ~100 ns/op

    b.Run("fmt.Errorf-wrap", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _ = fmt.Errorf("wrapped: %w", existingErr)
        }
    }) // ~150 ns/op
}
```

### Performance Optimization Tips

```go
// 1. Predefine sentinel errors, avoid repeated creation
var ErrNotFound = errors.New("not found")

// Good: Return predefined error
func Find(id int) error {
    if id == 0 {
        return ErrNotFound
    }
    return nil
}

// 2. Only use fmt.Errorf when context is needed
func Find(id int) error {
    if id == 0 {
        return ErrNotFound // Simple case, return directly
    }
    if id < 0 {
        return fmt.Errorf("invalid ID %d: %w", id, ErrInvalidInput) // Need context
    }
    return nil
}

// 3. Cache frequently used wrapped errors
type CachedErrors struct {
    notFound map[string]error
    mu       sync.RWMutex
}

func (c *CachedErrors) NotFound(resource string) error {
    c.mu.RLock()
    if err, ok := c.notFound[resource]; ok {
        c.mu.RUnlock()
        return err
    }
    c.mu.RUnlock()

    c.mu.Lock()
    defer c.mu.Unlock()
    err := fmt.Errorf("%s: %w", resource, ErrNotFound)
    c.notFound[resource] = err
    return err
}
```

## Real-world Scenarios

### Scenario 1: REST API Error Handling

```go
package main

import (
    "encoding/json"
    "errors"
    "fmt"
    "net/http"
)

// Business error definitions
var (
    ErrValidation   = errors.New("validation error")
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrForbidden    = errors.New("forbidden")
)

// APIError API error response
type APIError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}

// Error to HTTP status code mapping
func errorToStatusCode(err error) int {
    switch {
    case errors.Is(err, ErrValidation):
        return http.StatusBadRequest
    case errors.Is(err, ErrNotFound):
        return http.StatusNotFound
    case errors.Is(err, ErrUnauthorized):
        return http.StatusUnauthorized
    case errors.Is(err, ErrForbidden):
        return http.StatusForbidden
    default:
        return http.StatusInternalServerError
    }
}

// Unified error handling middleware
func errorHandler(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Use defer + recover to catch panic
        defer func() {
            if rec := recover(); rec != nil {
                writeError(w, http.StatusInternalServerError, APIError{
                    Code:    "INTERNAL_ERROR",
                    Message: "Internal server error",
                })
            }
        }()
        next.ServeHTTP(w, r)
    })
}

func writeError(w http.ResponseWriter, status int, apiErr APIError) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(apiErr)
}

// Business handler function
func getUserHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("id")

    user, err := getUser(userID)
    if err != nil {
        status := errorToStatusCode(err)

        var apiErr APIError
        switch {
        case errors.Is(err, ErrNotFound):
            apiErr = APIError{Code: "USER_NOT_FOUND", Message: "User not found"}
        case errors.Is(err, ErrValidation):
            apiErr = APIError{Code: "INVALID_INPUT", Message: err.Error()}
        default:
            apiErr = APIError{Code: "INTERNAL_ERROR", Message: "Server error"}
        }

        writeError(w, status, apiErr)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

func getUser(id string) (*User, error) {
    if id == "" {
        return nil, fmt.Errorf("user ID cannot be empty: %w", ErrValidation)
    }
    if id == "0" {
        return nil, fmt.Errorf("user %s: %w", id, ErrNotFound)
    }
    return &User{ID: id, Name: "John"}, nil
}

type User struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/user", getUserHandler)

    handler := errorHandler(mux)

    fmt.Println("Server starting on :8080")
    http.ListenAndServe(":8080", handler)
}
```

### Scenario 2: Database Transaction Error Handling

```go
package main

import (
    "context"
    "database/sql"
    "errors"
    "fmt"
)

// Transaction errors
var (
    ErrTxBegin    = errors.New("transaction begin failed")
    ErrTxCommit   = errors.New("transaction commit failed")
    ErrTxRollback = errors.New("transaction rollback failed")
)

// WithTransaction transaction wrapper
func WithTransaction(ctx context.Context, db *sql.DB, fn func(*sql.Tx) error) (err error) {
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("%w: %v", ErrTxBegin, err)
    }

    defer func() {
        if p := recover(); p != nil {
            // Rollback on panic
            if rbErr := tx.Rollback(); rbErr != nil {
                err = fmt.Errorf("rollback failed after panic: %w (panic: %v)", ErrTxRollback, p)
            } else {
                err = fmt.Errorf("transaction rolled back due to panic: %v", p)
            }
        } else if err != nil {
            // Rollback on error
            if rbErr := tx.Rollback(); rbErr != nil {
                err = fmt.Errorf("rollback failed: %w (original error: %v)", ErrTxRollback, err)
            }
            // Preserve original error
        } else {
            // Commit on success
            if cmErr := tx.Commit(); cmErr != nil {
                err = fmt.Errorf("%w: %v", ErrTxCommit, cmErr)
            }
        }
    }()

    err = fn(tx)
    return
}

// Usage example
func transferMoney(ctx context.Context, db *sql.DB, from, to int64, amount float64) error {
    return WithTransaction(ctx, db, func(tx *sql.Tx) error {
        // Deduct sender's balance
        result, err := tx.ExecContext(ctx,
            "UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?",
            amount, from, amount)
        if err != nil {
            return fmt.Errorf("failed to deduct balance: %w", err)
        }

        rows, err := result.RowsAffected()
        if err != nil {
            return fmt.Errorf("failed to get rows affected: %w", err)
        }
        if rows == 0 {
            return fmt.Errorf("account %d has insufficient balance: %w", from, ErrInsufficientBalance)
        }

        // Add to receiver's balance
        _, err = tx.ExecContext(ctx,
            "UPDATE accounts SET balance = balance + ? WHERE id = ?",
            amount, to)
        if err != nil {
            return fmt.Errorf("failed to add balance: %w", err)
        }

        return nil
    })
}

var ErrInsufficientBalance = errors.New("insufficient balance")

func main() {
    // Usage example
    ctx := context.Background()
    var db *sql.DB // Needs initialization in real use

    err := transferMoney(ctx, db, 1, 2, 100.0)
    if err != nil {
        switch {
        case errors.Is(err, ErrInsufficientBalance):
            fmt.Println("Transfer failed: insufficient balance")
        case errors.Is(err, ErrTxCommit):
            fmt.Println("Transfer failed: please retry")
        default:
            fmt.Printf("Transfer failed: %v\n", err)
        }
    }
}
```

### Scenario 3: Error Handling in Retry Mechanism

```go
package main

import (
    "context"
    "errors"
    "fmt"
    "math/rand"
    "time"
)

// Retryable error marker
type RetryableError struct {
    Err error
}

func (e *RetryableError) Error() string {
    return e.Err.Error()
}

func (e *RetryableError) Unwrap() error {
    return e.Err
}

// IsRetryable determines if error is retryable
var ErrRetryable = &RetryableError{}

func (e *RetryableError) Is(target error) bool {
    _, ok := target.(*RetryableError)
    return ok
}

// Retryable marks error as retryable
func Retryable(err error) error {
    if err == nil {
        return nil
    }
    return &RetryableError{Err: err}
}

// RetryConfig retry configuration
type RetryConfig struct {
    MaxAttempts int
    InitialWait time.Duration
    MaxWait     time.Duration
    Multiplier  float64
}

// WithRetry retry wrapper
func WithRetry(ctx context.Context, cfg RetryConfig, fn func() error) error {
    var lastErr error
    wait := cfg.InitialWait

    for attempt := 1; attempt <= cfg.MaxAttempts; attempt++ {
        err := fn()
        if err == nil {
            return nil
        }

        lastErr = fmt.Errorf("attempt %d failed: %w", attempt, err)

        // Check if retryable
        if !errors.Is(err, ErrRetryable) {
            return fmt.Errorf("non-retryable error: %w", lastErr)
        }

        // Don't wait on last attempt
        if attempt == cfg.MaxAttempts {
            break
        }

        // Wait before retry
        select {
        case <-ctx.Done():
            return fmt.Errorf("retry cancelled: %w (last error: %v)", ctx.Err(), lastErr)
        case <-time.After(wait):
            // Exponential backoff
            wait = time.Duration(float64(wait) * cfg.Multiplier)
            if wait > cfg.MaxWait {
                wait = cfg.MaxWait
            }
        }
    }

    return fmt.Errorf("reached max retry attempts %d: %w", cfg.MaxAttempts, lastErr)
}

// Simulate unstable service call
func callUnstableService() error {
    if rand.Float32() < 0.7 { // 70% failure rate
        return Retryable(errors.New("service temporarily unavailable"))
    }
    return nil
}

func main() {
    rand.Seed(time.Now().UnixNano())

    ctx := context.Background()
    cfg := RetryConfig{
        MaxAttempts: 5,
        InitialWait: 100 * time.Millisecond,
        MaxWait:     2 * time.Second,
        Multiplier:  2.0,
    }

    err := WithRetry(ctx, cfg, callUnstableService)
    if err != nil {
        fmt.Printf("Final failure: %v\n", err)

        // Check if cancelled by context
        if errors.Is(err, context.Canceled) {
            fmt.Println("Operation cancelled by user")
        }
    } else {
        fmt.Println("Call succeeded!")
    }
}
```

## Interview Key Points

### What is the difference between errors.Is and ==?

**Key points**:
- `==` only compares if two errors are the same instance
- `errors.Is` traverses the entire error chain, checking if the chain contains the target error
- `errors.Is` also checks if the error implements the `Is(error) bool` method for custom matching

```go
var ErrNotFound = errors.New("not found")
err := fmt.Errorf("query failed: %w", ErrNotFound)

err == ErrNotFound      // false - different instances
errors.Is(err, ErrNotFound) // true - traverses error chain
```

### Why is the parameter of errors.As `any` instead of `error`?

**Key points**:
- `errors.As` needs to assign the found error to the target variable
- The parameter must be a pointer type, and the pointed type needs to implement the error interface or be an interface type
- Using `any` allows passing `*ConcreteError` or `*error` and other forms

```go
var pathErr *os.PathError
errors.As(err, &pathErr) // pathErr's type is *os.PathError
```

### How to implement custom error types that support special matching logic for errors.Is?

**Key points**:
Implement the `Is(target error) bool` method:

```go
type AppError struct {
    Code int
}

func (e *AppError) Is(target error) bool {
    t, ok := target.(*AppError)
    if !ok {
        return false
    }
    return e.Code == t.Code // Only compare Code
}
```

### What is the difference between %w and %v in error handling?

**Key points**:
- `%v`: Converts error to string for embedding, loses original error type and chain
- `%w`: Wraps original error, preserves complete error chain, supports `Unwrap`, `errors.Is`, `errors.As`

### What problem does Go 1.20's errors.Join solve?

**Key points**:
- Solves scenarios where multiple errors need to be returned simultaneously
- The returned error implements the `Unwrap() []error` method
- `errors.Is` and `errors.As` will check all wrapped errors

```go
err := errors.Join(err1, err2, err3)
errors.Is(err, err1) // true
errors.Is(err, err2) // true
```

### When should you use error vs panic?

**Key points**:
- **error**: Expected errors, such as invalid user input, resource not found, network timeout
- **panic**: Unrecoverable program errors, such as array out of bounds, null pointer, logic errors that should never happen
- Library code should prefer using error, only use panic for true program bugs
- Application entry points can use recover to catch panics to prevent program crashes

### What are the best practices for error wrapping?

**Key points**:
1. Add meaningful context at the error source
2. Use predefined sentinel errors to support `errors.Is` checking
3. Convert errors at module boundaries, don't expose internal implementation
4. Avoid over-wrapping that leads to redundant error messages
5. Implement `Unwrap` method for custom error types

## Further Reading

### Official Documentation
- [Go Blog: Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
- [Go Blog: Error handling and Go](https://go.dev/blog/error-handling-and-go)
- [errors package documentation](https://pkg.go.dev/errors)
- [fmt.Errorf documentation](https://pkg.go.dev/fmt#Errorf)

### Proposals and Design
- [Error Handling Proposal](https://go.dev/design/go2draft-error-handling-overview)
- [errors.Is/As proposal](https://github.com/golang/go/issues/29934)
- [errors.Join proposal](https://github.com/golang/go/issues/53435)

### Quality Articles
- [Dave Cheney: Don't just check errors, handle them gracefully](https://dave.cheney.net/2016/04/27/dont-just-check-errors-handle-them-gracefully)
- [Error handling in Upspin](https://commandcenter.blogspot.com/2017/12/error-handling-in-upspin.html)

### Related Libraries
- [github.com/pkg/errors](https://github.com/pkg/errors) - Standard solution before Go 1.13
- [github.com/cockroachdb/errors](https://github.com/cockroachdb/errors) - Feature-rich error handling library
- [github.com/hashicorp/go-multierror](https://github.com/hashicorp/go-multierror) - Multi-error handling
