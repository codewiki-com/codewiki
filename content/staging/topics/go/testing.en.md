---
title: Testing
description: Complete guide to Go testing, unit tests, table-driven tests and benchmarks
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Testing
  - Unit Tests
  - Benchmarks
status: imported
origin: old/src/content/docs/go/testing.en.md
divergence: 0.113
issues: []
legacy:
  category: Go
  subcategory: Testing
  order: 6
  lastUpdated: 2026-01-07
---

Testing is a first-class citizen in Go, with built-in support through the `testing` package. Unlike many other languages that require external testing frameworks, Go provides everything you need to write comprehensive tests right out of the box. This philosophy reflects Go's commitment to simplicity and self-contained tooling.

## The Testing Package

The `testing` package provides support for automated testing of Go packages. Test files live alongside the code they test and follow a simple naming convention.

### Test File Naming

Test files must end with `_test.go`. They can be in the same package as the code being tested (white-box testing) or in a separate package with `_test` suffix (black-box testing).

```
mypackage/
    calculator.go       # Production code
    calculator_test.go  # Test code
```

### Running Tests

The `go test` command automatically discovers and runs tests.

```bash
# Run all tests in the current package
go test

# Run tests with verbose output
go test -v

# Run tests in all subdirectories
go test ./...

# Run a specific test by name
go test -run TestFunctionName

# Run tests matching a pattern
go test -run "Test.*Integration"

# Run tests with a timeout
go test -timeout 30s

# Run tests and fail fast on first failure
go test -failfast

# Run tests multiple times (useful for detecting flaky tests)
go test -count=5

# Skip cached test results
go test -count=1
```

## Writing Unit Tests

A test function must have a name starting with `Test`, followed by a capital letter, and accept a single `*testing.T` parameter.

### Basic Test Structure

```go
// math.go
package math

import "errors"

// Add returns the sum of two integers
func Add(a, b int) int {
    return a + b
}

// Subtract returns the difference of two integers
func Subtract(a, b int) int {
    return a - b
}

// Divide returns the quotient of two numbers
func Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}
```

```go
// math_test.go
package math

import "testing"

func TestAdd(t *testing.T) {
    result := Add(2, 3)
    expected := 5

    if result != expected {
        t.Errorf("Add(2, 3) = %d; want %d", result, expected)
    }
}

func TestSubtract(t *testing.T) {
    result := Subtract(10, 4)
    expected := 6

    if result != expected {
        t.Errorf("Subtract(10, 4) = %d; want %d", result, expected)
    }
}

func TestDivide(t *testing.T) {
    result, err := Divide(10, 2)
    if err != nil {
        t.Fatalf("Divide(10, 2) returned unexpected error: %v", err)
    }

    expected := 5.0
    if result != expected {
        t.Errorf("Divide(10, 2) = %f; want %f", result, expected)
    }
}

func TestDivideByZero(t *testing.T) {
    _, err := Divide(10, 0)
    if err == nil {
        t.Error("Divide(10, 0) expected error, got nil")
    }
}
```

### Testing.T Methods

The `*testing.T` type provides several methods for controlling test execution:

| Method | Description |
|--------|-------------|
| `t.Error(args...)` | Mark test as failed, continue execution |
| `t.Errorf(format, args...)` | Mark test as failed with formatted message |
| `t.Fatal(args...)` | Mark test as failed, stop immediately |
| `t.Fatalf(format, args...)` | Mark test as failed with format, stop immediately |
| `t.Log(args...)` | Log a message (shown with `-v` or on failure) |
| `t.Logf(format, args...)` | Log formatted message |
| `t.Skip(args...)` | Skip the test |
| `t.Skipf(format, args...)` | Skip with formatted message |
| `t.Parallel()` | Run test in parallel with other parallel tests |
| `t.Helper()` | Mark function as test helper |
| `t.Cleanup(func())` | Register cleanup function |

### Test Helpers

Use `t.Helper()` to mark functions as test helpers. This improves error reporting by showing the line number of the test rather than the helper.

```go
func assertEqual(t *testing.T, got, want int) {
    t.Helper() // Mark as helper
    if got != want {
        t.Errorf("got %d; want %d", got, want)
    }
}

func TestWithHelper(t *testing.T) {
    result := Add(2, 2)
    assertEqual(t, result, 4) // Error reports this line, not the helper
}
```

### Cleanup Functions

Use `t.Cleanup()` to register cleanup functions that run after the test completes.

```go
func TestWithCleanup(t *testing.T) {
    // Create a temporary file
    f, err := os.CreateTemp("", "test")
    if err != nil {
        t.Fatalf("failed to create temp file: %v", err)
    }

    // Register cleanup - runs even if test fails or panics
    t.Cleanup(func() {
        os.Remove(f.Name())
    })

    // Use the file in tests
    // ...
}
```

## Table-Driven Tests

Table-driven tests are a Go idiom for testing multiple scenarios with a single test function. This pattern reduces code duplication and makes it easy to add new test cases.

### Basic Table-Driven Test

```go
func TestAdd_TableDriven(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive numbers", 2, 3, 5},
        {"negative numbers", -2, -3, -5},
        {"mixed signs", -2, 3, 1},
        {"zeros", 0, 0, 0},
        {"large numbers", 1000000, 1000000, 2000000},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d",
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}
```

### Using Maps for Test Cases

Maps provide a clean alternative for test tables, especially when test names are unique identifiers.

```go
func TestIsPalindrome(t *testing.T) {
    tests := map[string]struct {
        input    string
        expected bool
    }{
        "empty string":   {input: "", expected: true},
        "single char":    {input: "a", expected: true},
        "palindrome":     {input: "racecar", expected: true},
        "not palindrome": {input: "hello", expected: false},
        "mixed case":     {input: "RaceCar", expected: true},
        "with spaces":    {input: "was it a car or a cat i saw", expected: true},
    }

    for name, tc := range tests {
        t.Run(name, func(t *testing.T) {
            result := IsPalindrome(tc.input)
            if result != tc.expected {
                t.Errorf("IsPalindrome(%q) = %v; want %v",
                    tc.input, result, tc.expected)
            }
        })
    }
}
```

### Table-Driven Tests with Error Cases

```go
func TestParse(t *testing.T) {
    tests := []struct {
        name      string
        input     string
        want      int
        wantErr   bool
        errString string
    }{
        {
            name:  "valid positive",
            input: "42",
            want:  42,
        },
        {
            name:  "valid negative",
            input: "-17",
            want:  -17,
        },
        {
            name:      "invalid format",
            input:     "abc",
            wantErr:   true,
            errString: "invalid syntax",
        },
        {
            name:      "empty string",
            input:     "",
            wantErr:   true,
            errString: "invalid syntax",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := Parse(tt.input)

            if tt.wantErr {
                if err == nil {
                    t.Errorf("Parse(%q) expected error, got nil", tt.input)
                    return
                }
                if !strings.Contains(err.Error(), tt.errString) {
                    t.Errorf("Parse(%q) error = %v; want error containing %q",
                        tt.input, err, tt.errString)
                }
                return
            }

            if err != nil {
                t.Errorf("Parse(%q) unexpected error: %v", tt.input, err)
                return
            }

            if got != tt.want {
                t.Errorf("Parse(%q) = %d; want %d", tt.input, got, tt.want)
            }
        })
    }
}
```

## Subtests

Subtests allow you to organize tests hierarchically and run specific subsets of tests.

### Creating Subtests

```go
func TestDatabase(t *testing.T) {
    // Setup shared resources
    db := setupTestDB(t)

    t.Run("Insert", func(t *testing.T) {
        err := db.Insert("key1", "value1")
        if err != nil {
            t.Errorf("Insert failed: %v", err)
        }
    })

    t.Run("Get", func(t *testing.T) {
        t.Run("ExistingKey", func(t *testing.T) {
            value, err := db.Get("key1")
            if err != nil {
                t.Errorf("Get failed: %v", err)
            }
            if value != "value1" {
                t.Errorf("Get returned %q; want %q", value, "value1")
            }
        })

        t.Run("NonExistingKey", func(t *testing.T) {
            _, err := db.Get("nonexistent")
            if err == nil {
                t.Error("Expected error for nonexistent key")
            }
        })
    })

    t.Run("Delete", func(t *testing.T) {
        err := db.Delete("key1")
        if err != nil {
            t.Errorf("Delete failed: %v", err)
        }
    })
}
```

### Running Specific Subtests

```bash
# Run all subtests
go test -v -run TestDatabase

# Run a specific subtest
go test -v -run TestDatabase/Insert

# Run nested subtest
go test -v -run TestDatabase/Get/ExistingKey

# Run subtests matching pattern
go test -v -run "TestDatabase/Get/.*Key"
```

### Parallel Subtests

Subtests can run in parallel for improved test execution time.

```go
func TestParallel(t *testing.T) {
    tests := []struct {
        name  string
        value int
    }{
        {"test1", 1},
        {"test2", 2},
        {"test3", 3},
        {"test4", 4},
    }

    for _, tc := range tests {
        tc := tc // Capture range variable (important!)
        t.Run(tc.name, func(t *testing.T) {
            t.Parallel() // Mark test as parallel

            // Simulate work
            time.Sleep(100 * time.Millisecond)

            result := Process(tc.value)
            if result != tc.value*2 {
                t.Errorf("Process(%d) = %d; want %d",
                    tc.value, result, tc.value*2)
            }
        })
    }
}
```

## Benchmarks

Benchmark tests measure the performance of code. They help identify bottlenecks and compare different implementations.

### Writing Benchmarks

Benchmark functions start with `Benchmark` and accept `*testing.B`.

```go
// fibonacci.go
package fib

// Fibonacci calculates the nth Fibonacci number recursively
func Fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return Fibonacci(n-1) + Fibonacci(n-2)
}

// FibonacciIterative calculates using iteration
func FibonacciIterative(n int) int {
    if n <= 1 {
        return n
    }
    a, b := 0, 1
    for i := 2; i <= n; i++ {
        a, b = b, a+b
    }
    return b
}

// FibonacciMemoized uses memoization
func FibonacciMemoized(n int) int {
    memo := make(map[int]int)
    var fib func(n int) int
    fib = func(n int) int {
        if n <= 1 {
            return n
        }
        if v, ok := memo[n]; ok {
            return v
        }
        memo[n] = fib(n-1) + fib(n-2)
        return memo[n]
    }
    return fib(n)
}
```

```go
// fibonacci_test.go
package fib

import "testing"

func BenchmarkFibonacci(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Fibonacci(20)
    }
}

func BenchmarkFibonacciIterative(b *testing.B) {
    for i := 0; i < b.N; i++ {
        FibonacciIterative(20)
    }
}

func BenchmarkFibonacciMemoized(b *testing.B) {
    for i := 0; i < b.N; i++ {
        FibonacciMemoized(20)
    }
}
```

### Running Benchmarks

```bash
# Run all benchmarks
go test -bench=.

# Run specific benchmark
go test -bench=BenchmarkFibonacci

# Run benchmarks with memory allocation stats
go test -bench=. -benchmem

# Run benchmarks for specific duration
go test -bench=. -benchtime=5s

# Run benchmarks multiple times for stability
go test -bench=. -count=5

# Skip regular tests, only run benchmarks
go test -bench=. -run=^$
```

### Benchmark Output

```
BenchmarkFibonacci-8              30814     38429 ns/op
BenchmarkFibonacciIterative-8  317523642     3.784 ns/op
BenchmarkFibonacciMemoized-8    4842126     247.8 ns/op
```

The output shows:
- Function name and GOMAXPROCS value (`-8`)
- Number of iterations (`b.N`)
- Time per operation (`ns/op`)

### Sub-Benchmarks

```go
func BenchmarkFibonacciSizes(b *testing.B) {
    sizes := []int{5, 10, 15, 20, 25}

    for _, size := range sizes {
        b.Run(fmt.Sprintf("n=%d", size), func(b *testing.B) {
            for i := 0; i < b.N; i++ {
                Fibonacci(size)
            }
        })
    }
}
```

### Benchmark with Setup

```go
func BenchmarkMapAccess(b *testing.B) {
    // Setup - not measured
    m := make(map[string]int)
    for i := 0; i < 1000; i++ {
        m[fmt.Sprintf("key%d", i)] = i
    }

    b.ResetTimer() // Reset timer after setup

    for i := 0; i < b.N; i++ {
        _ = m["key500"]
    }
}
```

### Memory Allocation Benchmarks

```go
func BenchmarkStringConcatenation(b *testing.B) {
    b.ReportAllocs() // Report memory allocations

    for i := 0; i < b.N; i++ {
        s := ""
        for j := 0; j < 100; j++ {
            s += "x"
        }
        _ = s
    }
}

func BenchmarkStringBuilder(b *testing.B) {
    b.ReportAllocs()

    for i := 0; i < b.N; i++ {
        var sb strings.Builder
        for j := 0; j < 100; j++ {
            sb.WriteString("x")
        }
        _ = sb.String()
    }
}
```

Output with `-benchmem`:
```
BenchmarkStringConcatenation-8     19762     60589 ns/op    5248 B/op    99 allocs/op
BenchmarkStringBuilder-8         3038306       395 ns/op     248 B/op     4 allocs/op
```

### Comparing Benchmarks

Use `benchstat` to compare benchmark results:

```bash
# Install benchstat
go install golang.org/x/perf/cmd/benchstat@latest

# Run benchmarks and save results
go test -bench=. -count=10 > old.txt

# Make changes, then run again
go test -bench=. -count=10 > new.txt

# Compare results
benchstat old.txt new.txt
```

## Example Tests

Example functions serve dual purposes: they provide runnable documentation and are executed as tests.

### Writing Examples

```go
// format.go
package format

import "strings"

// Reverse reverses a string
func Reverse(s string) string {
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    return string(runes)
}

// Capitalize capitalizes the first letter
func Capitalize(s string) string {
    if len(s) == 0 {
        return s
    }
    return strings.ToUpper(s[:1]) + strings.ToLower(s[1:])
}
```

```go
// format_test.go
package format

import "fmt"

func ExampleReverse() {
    fmt.Println(Reverse("hello"))
    // Output: olleh
}

func ExampleCapitalize() {
    fmt.Println(Capitalize("hello"))
    fmt.Println(Capitalize("WORLD"))
    // Output:
    // Hello
    // World
}

// Example for a specific case
func ExampleReverse_unicode() {
    fmt.Println(Reverse("Hello, World"))
    // Output: dlroW ,olleH
}

// Example for empty string
func ExampleCapitalize_empty() {
    fmt.Println(Capitalize(""))
    // Output:
    //
}
```

### Unordered Output

For outputs where order is not guaranteed (like maps):

```go
func ExamplePrintMap() {
    m := map[string]int{"b": 2, "a": 1, "c": 3}
    for k, v := range m {
        fmt.Println(k, v)
    }
    // Unordered output:
    // a 1
    // b 2
    // c 3
}
```

### Example Naming Convention

| Pattern | Description |
|---------|-------------|
| `Example()` | Package-level example |
| `ExampleF()` | Example for function F |
| `ExampleT()` | Example for type T |
| `ExampleT_M()` | Example for method M on type T |
| `ExampleF_suffix()` | Example for F with description suffix |

## Test Coverage

Test coverage measures which parts of your code are executed during tests.

### Generating Coverage

```bash
# Run tests with coverage summary
go test -cover

# Generate detailed coverage profile
go test -coverprofile=coverage.out

# View coverage by function
go tool cover -func=coverage.out

# Generate HTML coverage report
go tool cover -html=coverage.out

# Save HTML report to file
go tool cover -html=coverage.out -o coverage.html

# Coverage for all packages
go test -coverprofile=coverage.out ./...
```

### Coverage Modes

```bash
# Set mode (default is "set")
go test -covermode=set -coverprofile=coverage.out    # Boolean: executed or not
go test -covermode=count -coverprofile=coverage.out  # Count of executions
go test -covermode=atomic -coverprofile=coverage.out # Count with atomics (for concurrent tests)
```

### Example Coverage Output

```
ok      example.com/mypackage    0.005s  coverage: 85.7% of statements
```

Detailed function coverage:
```
example.com/mypackage/math.go:5:        Add             100.0%
example.com/mypackage/math.go:9:        Subtract        100.0%
example.com/mypackage/math.go:13:       Multiply        0.0%
example.com/mypackage/math.go:17:       Divide          80.0%
total:                                  (statements)    85.7%
```

### Coverage in CI/CD

```bash
# Generate coverage with minimum threshold
go test -cover -coverprofile=coverage.out ./...
COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}')
echo "Coverage: $COVERAGE"

# Fail if coverage is below threshold
MIN_COVERAGE=80
if (( $(echo "$COVERAGE < $MIN_COVERAGE" | bc -l) )); then
    echo "Coverage $COVERAGE% is below minimum $MIN_COVERAGE%"
    exit 1
fi
```

## Mocking and Test Doubles

Go's interface-based design makes it easy to create test doubles without external frameworks.

### Interface-Based Mocking

```go
// service.go
package service

// EmailSender defines the interface for sending emails
type EmailSender interface {
    Send(to, subject, body string) error
}

// UserService handles user operations
type UserService struct {
    emailSender EmailSender
}

func NewUserService(sender EmailSender) *UserService {
    return &UserService{emailSender: sender}
}

func (s *UserService) RegisterUser(email, name string) error {
    // ... user registration logic ...

    // Send welcome email
    return s.emailSender.Send(
        email,
        "Welcome!",
        fmt.Sprintf("Hello %s, welcome to our service!", name),
    )
}
```

```go
// service_test.go
package service

import (
    "errors"
    "testing"
)

// Mock implementation
type MockEmailSender struct {
    SendFunc   func(to, subject, body string) error
    SendCalls  []EmailCall
}

type EmailCall struct {
    To      string
    Subject string
    Body    string
}

func (m *MockEmailSender) Send(to, subject, body string) error {
    m.SendCalls = append(m.SendCalls, EmailCall{to, subject, body})
    if m.SendFunc != nil {
        return m.SendFunc(to, subject, body)
    }
    return nil
}

func TestUserService_RegisterUser(t *testing.T) {
    t.Run("sends welcome email", func(t *testing.T) {
        mock := &MockEmailSender{}
        service := NewUserService(mock)

        err := service.RegisterUser("user@example.com", "John")
        if err != nil {
            t.Fatalf("unexpected error: %v", err)
        }

        if len(mock.SendCalls) != 1 {
            t.Fatalf("expected 1 email, got %d", len(mock.SendCalls))
        }

        call := mock.SendCalls[0]
        if call.To != "user@example.com" {
            t.Errorf("email sent to %q; want %q", call.To, "user@example.com")
        }
        if call.Subject != "Welcome!" {
            t.Errorf("subject = %q; want %q", call.Subject, "Welcome!")
        }
    })

    t.Run("handles email error", func(t *testing.T) {
        mock := &MockEmailSender{
            SendFunc: func(to, subject, body string) error {
                return errors.New("SMTP error")
            },
        }
        service := NewUserService(mock)

        err := service.RegisterUser("user@example.com", "John")
        if err == nil {
            t.Error("expected error, got nil")
        }
    })
}
```

### Spy Pattern

A spy records calls for later verification.

```go
type SpyLogger struct {
    Messages []string
}

func (s *SpyLogger) Log(msg string) {
    s.Messages = append(s.Messages, msg)
}

func (s *SpyLogger) AssertLogged(t *testing.T, expected string) {
    t.Helper()
    for _, msg := range s.Messages {
        if msg == expected {
            return
        }
    }
    t.Errorf("expected log message %q not found", expected)
}
```

### Stub Pattern

A stub returns predefined values.

```go
type StubUserRepository struct {
    Users map[string]*User
}

func (s *StubUserRepository) FindByID(id string) (*User, error) {
    user, ok := s.Users[id]
    if !ok {
        return nil, ErrNotFound
    }
    return user, nil
}

func TestGetUser(t *testing.T) {
    repo := &StubUserRepository{
        Users: map[string]*User{
            "123": {ID: "123", Name: "John"},
        },
    }

    service := NewService(repo)
    user, err := service.GetUser("123")
    // ... assertions ...
}
```

### Fake Implementation

A fake is a working implementation suitable for testing.

```go
// FakeStore is an in-memory implementation for testing
type FakeStore struct {
    mu    sync.RWMutex
    data  map[string][]byte
}

func NewFakeStore() *FakeStore {
    return &FakeStore{data: make(map[string][]byte)}
}

func (f *FakeStore) Get(key string) ([]byte, error) {
    f.mu.RLock()
    defer f.mu.RUnlock()

    data, ok := f.data[key]
    if !ok {
        return nil, ErrNotFound
    }
    return data, nil
}

func (f *FakeStore) Set(key string, value []byte) error {
    f.mu.Lock()
    defer f.mu.Unlock()

    f.data[key] = value
    return nil
}

func (f *FakeStore) Delete(key string) error {
    f.mu.Lock()
    defer f.mu.Unlock()

    delete(f.data, key)
    return nil
}
```

## Testing HTTP Handlers

The `net/http/httptest` package provides utilities for testing HTTP servers and clients.

### Testing HTTP Handlers

```go
// handlers.go
package api

import (
    "encoding/json"
    "net/http"
)

type User struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}

type UserHandler struct {
    store UserStore
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    if id == "" {
        http.Error(w, "missing id parameter", http.StatusBadRequest)
        return
    }

    user, err := h.store.FindByID(id)
    if err != nil {
        http.Error(w, "user not found", http.StatusNotFound)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, "invalid request body", http.StatusBadRequest)
        return
    }

    if err := h.store.Create(&user); err != nil {
        http.Error(w, "failed to create user", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}
```

```go
// handlers_test.go
package api

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestGetUser(t *testing.T) {
    store := &FakeUserStore{
        users: map[string]*User{
            "123": {ID: "123", Name: "John"},
        },
    }
    handler := &UserHandler{store: store}

    t.Run("returns user when found", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, "/user?id=123", nil)
        rec := httptest.NewRecorder()

        handler.GetUser(rec, req)

        if rec.Code != http.StatusOK {
            t.Errorf("status = %d; want %d", rec.Code, http.StatusOK)
        }

        var user User
        if err := json.NewDecoder(rec.Body).Decode(&user); err != nil {
            t.Fatalf("failed to decode response: %v", err)
        }

        if user.Name != "John" {
            t.Errorf("name = %q; want %q", user.Name, "John")
        }
    })

    t.Run("returns 404 when not found", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, "/user?id=999", nil)
        rec := httptest.NewRecorder()

        handler.GetUser(rec, req)

        if rec.Code != http.StatusNotFound {
            t.Errorf("status = %d; want %d", rec.Code, http.StatusNotFound)
        }
    })

    t.Run("returns 400 when id missing", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, "/user", nil)
        rec := httptest.NewRecorder()

        handler.GetUser(rec, req)

        if rec.Code != http.StatusBadRequest {
            t.Errorf("status = %d; want %d", rec.Code, http.StatusBadRequest)
        }
    })
}

func TestCreateUser(t *testing.T) {
    store := &FakeUserStore{users: make(map[string]*User)}
    handler := &UserHandler{store: store}

    body := bytes.NewBufferString(`{"id":"456","name":"Jane"}`)
    req := httptest.NewRequest(http.MethodPost, "/user", body)
    req.Header.Set("Content-Type", "application/json")
    rec := httptest.NewRecorder()

    handler.CreateUser(rec, req)

    if rec.Code != http.StatusCreated {
        t.Errorf("status = %d; want %d", rec.Code, http.StatusCreated)
    }

    // Verify user was stored
    stored, _ := store.FindByID("456")
    if stored == nil || stored.Name != "Jane" {
        t.Error("user was not stored correctly")
    }
}
```

### Testing HTTP Servers

```go
func TestServer(t *testing.T) {
    // Create test server
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("Hello, World!"))
    }))
    defer server.Close()

    // Make request to test server
    resp, err := http.Get(server.URL)
    if err != nil {
        t.Fatalf("failed to make request: %v", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        t.Errorf("status = %d; want %d", resp.StatusCode, http.StatusOK)
    }
}
```

### Testing HTTP Clients

```go
func TestHTTPClient(t *testing.T) {
    // Create mock server
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Verify request
        if r.Method != http.MethodPost {
            t.Errorf("method = %q; want POST", r.Method)
        }
        if r.Header.Get("Authorization") != "Bearer token123" {
            t.Error("missing or invalid authorization header")
        }

        // Return mock response
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
    }))
    defer server.Close()

    // Test client with mock server
    client := NewAPIClient(server.URL, "token123")
    result, err := client.DoSomething()

    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    // ... assertions on result ...
}
```

## Integration Testing

Integration tests verify that multiple components work together correctly.

### Build Tags for Integration Tests

```go
//go:build integration

package database

import (
    "testing"
)

func TestDatabaseIntegration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test in short mode")
    }

    db, err := ConnectToTestDatabase()
    if err != nil {
        t.Fatalf("failed to connect: %v", err)
    }
    defer db.Close()

    // Run integration tests
    t.Run("CreateAndRetrieve", func(t *testing.T) {
        // ... test logic ...
    })
}
```

Run integration tests:
```bash
# Run only integration tests
go test -tags=integration ./...

# Run without integration tests
go test ./...

# Skip long-running tests
go test -short ./...
```

### TestMain for Setup and Teardown

```go
package database

import (
    "log"
    "os"
    "testing"
)

var testDB *sql.DB

func TestMain(m *testing.M) {
    // Setup
    var err error
    testDB, err = setupTestDatabase()
    if err != nil {
        log.Fatalf("failed to setup test database: %v", err)
    }

    // Run tests
    code := m.Run()

    // Teardown
    testDB.Close()
    cleanupTestDatabase()

    os.Exit(code)
}

func setupTestDatabase() (*sql.DB, error) {
    db, err := sql.Open("postgres", os.Getenv("TEST_DATABASE_URL"))
    if err != nil {
        return nil, err
    }

    // Run migrations
    if err := runMigrations(db); err != nil {
        return nil, err
    }

    return db, nil
}

func cleanupTestDatabase() {
    // Drop test tables, etc.
}
```

### Golden File Testing

Golden files store expected outputs for comparison.

```go
var update = flag.Bool("update", false, "update golden files")

func TestRenderTemplate(t *testing.T) {
    data := TemplateData{
        Title: "Hello",
        Items: []string{"one", "two", "three"},
    }

    result, err := RenderTemplate(data)
    if err != nil {
        t.Fatalf("render failed: %v", err)
    }

    golden := filepath.Join("testdata", "template.golden")

    if *update {
        // Update golden file
        if err := os.WriteFile(golden, []byte(result), 0644); err != nil {
            t.Fatalf("failed to update golden file: %v", err)
        }
    }

    expected, err := os.ReadFile(golden)
    if err != nil {
        t.Fatalf("failed to read golden file: %v", err)
    }

    if result != string(expected) {
        t.Errorf("output mismatch:\ngot:\n%s\nwant:\n%s", result, expected)
    }
}
```

Update golden files:
```bash
go test -update
```

## Best Practices

### Test Organization

```go
func TestUserService(t *testing.T) {
    // Group related tests
    t.Run("Create", func(t *testing.T) {
        t.Run("valid input", func(t *testing.T) { /* ... */ })
        t.Run("duplicate email", func(t *testing.T) { /* ... */ })
        t.Run("invalid email format", func(t *testing.T) { /* ... */ })
    })

    t.Run("Delete", func(t *testing.T) {
        t.Run("existing user", func(t *testing.T) { /* ... */ })
        t.Run("non-existing user", func(t *testing.T) { /* ... */ })
    })
}
```

### Clear Error Messages

```go
// Bad: unclear error message
if result != expected {
    t.Error("wrong result")
}

// Good: informative error message
if result != expected {
    t.Errorf("Add(%d, %d) = %d; want %d", a, b, result, expected)
}

// Better: include context for debugging
if result != expected {
    t.Errorf("Add(%d, %d) = %d; want %d\nThis may indicate integer overflow",
        a, b, result, expected)
}
```

### Use Test Fixtures

Store test data in the `testdata` directory, which is ignored by the Go tool.

```
mypackage/
    mypackage.go
    mypackage_test.go
    testdata/
        input.json
        expected_output.json
        config.yaml
```

```go
func TestProcessFile(t *testing.T) {
    input, err := os.ReadFile("testdata/input.json")
    if err != nil {
        t.Fatalf("failed to read test input: %v", err)
    }

    result, err := ProcessFile(input)
    // ... assertions ...
}
```

### Avoid Test Pollution

Each test should be independent and not rely on state from other tests.

```go
func TestIndependent(t *testing.T) {
    // Create fresh state for each test
    t.Run("test1", func(t *testing.T) {
        store := NewTestStore()
        // ... test with store ...
    })

    t.Run("test2", func(t *testing.T) {
        store := NewTestStore() // Fresh store, not affected by test1
        // ... test with store ...
    })
}
```

### Test Edge Cases

```go
func TestParseInt(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    int
        wantErr bool
    }{
        // Normal cases
        {"positive", "42", 42, false},
        {"negative", "-17", -17, false},
        {"zero", "0", 0, false},

        // Edge cases
        {"empty string", "", 0, true},
        {"whitespace", "  ", 0, true},
        {"leading zeros", "007", 7, false},
        {"max int", "9223372036854775807", 9223372036854775807, false},
        {"min int", "-9223372036854775808", -9223372036854775808, false},
        {"overflow", "9223372036854775808", 0, true},

        // Invalid input
        {"letters", "abc", 0, true},
        {"mixed", "12abc", 0, true},
        {"decimal", "12.34", 0, true},
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            got, err := ParseInt(tc.input)
            if (err != nil) != tc.wantErr {
                t.Errorf("error = %v; wantErr = %v", err, tc.wantErr)
            }
            if !tc.wantErr && got != tc.want {
                t.Errorf("ParseInt(%q) = %d; want %d", tc.input, got, tc.want)
            }
        })
    }
}
```

### Use t.Parallel() Wisely

```go
func TestParallelSafe(t *testing.T) {
    // These tests don't share state, safe to parallelize
    tests := []struct {
        name  string
        input int
    }{
        {"case1", 1},
        {"case2", 2},
    }

    for _, tc := range tests {
        tc := tc // Capture range variable!
        t.Run(tc.name, func(t *testing.T) {
            t.Parallel()
            // ... test logic ...
        })
    }
}

func TestParallelUnsafe(t *testing.T) {
    // These tests share state, don't parallelize or use proper synchronization
    shared := NewSharedResource()

    t.Run("test1", func(t *testing.T) {
        // Don't call t.Parallel() here
        shared.DoSomething()
    })

    t.Run("test2", func(t *testing.T) {
        // Don't call t.Parallel() here
        shared.DoSomethingElse()
    })
}
```

### Keep Tests Fast

```go
func TestSlow(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping slow test in short mode")
    }

    // Long-running test
    time.Sleep(5 * time.Second)
}
```

Run quick tests:
```bash
go test -short ./...
```

## Conclusion

Go's built-in testing framework provides a powerful yet simple approach to testing. Key takeaways:

- **Simplicity**: No external frameworks needed - the `testing` package has everything
- **Table-driven tests**: Efficiently test multiple scenarios with minimal code duplication
- **Subtests**: Organize tests hierarchically and run specific subsets
- **Benchmarks**: Measure and compare performance with `b.N` loops
- **Examples**: Create runnable documentation that doubles as tests
- **Coverage**: Use `go test -cover` to identify untested code paths
- **Mocking**: Leverage Go's interfaces for easy test doubles without frameworks
- **HTTP testing**: Use `httptest` for testing handlers and clients

By following Go's testing conventions and best practices, you can build reliable, maintainable test suites that give confidence in your code. Remember that test code deserves the same care and attention as production code - it is an investment in your project's long-term quality and maintainability.
