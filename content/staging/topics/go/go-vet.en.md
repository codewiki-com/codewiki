---
title: Go Vet Static Analysis
description: Complete guide to go vet, Go's built-in static analysis tool for detecting suspicious constructs, common mistakes, and potential bugs in Go code
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Static Analysis
  - Testing
  - Code Quality
  - Linting
status: imported
origin: old/src/content/docs/go/go-vet.en.md
divergence: 0.225
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Go
  subcategory: ""
  order: 51
  lastUpdated: 2026-01-22
---

Go vet is a powerful static analysis tool included with the Go toolchain that examines Go source code and reports suspicious constructs. Unlike compilers that only check syntax, go vet detects errors that are syntactically valid but likely incorrect, making it an essential part of any Go development workflow.

## Concept Explanation

Static analysis examines code without executing it, finding potential bugs, style issues, and suspicious patterns. Go vet performs several analyses simultaneously, each targeting a specific class of errors that compilers cannot catch.

The tool is designed to have a very low false-positive rate. When go vet reports an issue, it's almost certainly a genuine problem that needs attention. This philosophy makes it practical to run go vet on every build without being overwhelmed by noise.

```bash
# Basic usage
go vet ./...

# Run on specific package
go vet mypackage

# Run on specific file
go vet main.go

# Verbose output
go vet -v ./...
```

## Core Principles

### How Go Vet Works

Go vet operates on type-checked Go packages, giving it access to complete type information. This enables sophisticated analyses that simple text-based linters cannot perform.

```go
package main

import "fmt"

func main() {
    // go vet catches this: Printf format %d has arg "hello" of wrong type string
    fmt.Printf("%d", "hello")

    // go vet catches this: unreachable code after return
    return
    fmt.Println("never executed")
}
```

### Built-in Analyzers

Go vet includes numerous analyzers, each checking for specific issues:

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    // 1. Printf analyzer - format string issues
    fmt.Printf("%s %s", "hello") // Missing argument for %s

    // 2. Copylocks analyzer - copying locks
    var mu sync.Mutex
    mu2 := mu // Copies lock value
    _ = mu2

    // 3. Unreachable analyzer - dead code
    if true {
        return
    }
    fmt.Println("unreachable") // Dead code
}
```

## Key Concepts

### Printf Format String Checking

One of the most valuable checks examines printf-style format strings:

```go
package main

import (
    "fmt"
    "log"
)

type User struct {
    Name string
    Age  int
}

func demonstratePrintfChecks() {
    user := User{Name: "Alice", Age: 30}

    // WRONG: go vet reports these issues
    fmt.Printf("%d", "string")           // wrong type for %d
    fmt.Printf("%s %s", "one")           // missing argument
    fmt.Printf("%s", 123, 456)           // extra argument
    fmt.Sprintf("%w", nil)               // %w requires error type

    // CORRECT: proper format usage
    fmt.Printf("%s is %d years old\n", user.Name, user.Age)
    fmt.Printf("%+v\n", user)            // struct with field names
    fmt.Printf("%#v\n", user)            // Go syntax representation

    // log.Printf follows the same rules
    log.Printf("User: %s", user.Name)
}

// Custom printf-style function
// The //go:printf directive tells go vet to check format strings
//
//go:noinline
func logf(format string, args ...interface{}) {
    fmt.Printf("[LOG] "+format+"\n", args...)
}
```

### Lock Copying Detection

The copylocks analyzer prevents copying of sync primitives:

```go
package main

import (
    "sync"
)

type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

// WRONG: Copying struct with mutex
func copyCounter(c SafeCounter) { // go vet: passes lock by value
    c.Increment()
}

// CORRECT: Pass by pointer
func useCounter(c *SafeCounter) {
    c.Increment()
}

// WRONG: Copying mutex directly
func wrongCopy() {
    var mu1 sync.Mutex
    mu2 := mu1 // go vet: copies lock value
    _ = mu2
}

// WRONG: Range over channel of mutexes
func wrongRange(ch chan sync.Mutex) {
    for m := range ch { // go vet: copies lock value
        _ = m
    }
}
```

### Struct Tag Validation

Go vet checks struct tags for common mistakes:

```go
package main

import (
    "encoding/json"
    "fmt"
)

// WRONG: Invalid struct tags
type BadTags struct {
    Name string `json:"name" xml:"name"` // OK
    Age  int    `json:name`              // Missing quotes
    City string `json:"city" json:"loc"` // Duplicate key
    Zip  string `json: "zip"`            // Space after colon
}

// CORRECT: Valid struct tags
type GoodTags struct {
    Name    string `json:"name" xml:"name"`
    Age     int    `json:"age,omitempty"`
    City    string `json:"city"`
    Private string `json:"-"` // Ignored by JSON
}

// Common tag formats
type AllTags struct {
    Field1 string `json:"field1" xml:"field1" yaml:"field1"`
    Field2 int    `json:"field2,omitempty" db:"field_2"`
    Field3 bool   `json:"field3,string"` // Marshal as string
    Field4 string `json:",inline"`       // Embed fields
}

func main() {
    g := GoodTags{Name: "Test", Age: 25, City: "NYC"}
    data, _ := json.Marshal(g)
    fmt.Println(string(data))
}
```

### Boolean Condition Checks

The bools analyzer finds suspicious boolean expressions:

```go
package main

func checkBooleans(a, b bool) {
    // WRONG: Redundant boolean expressions
    if a == true {  // go vet: comparison to bool constant
        // ...
    }

    if b == false { // go vet: comparison to bool constant
        // ...
    }

    // CORRECT: Direct boolean usage
    if a {
        // ...
    }

    if !b {
        // ...
    }

    // WRONG: Duplicate conditions
    if a && a { // go vet: redundant condition
        // ...
    }

    // WRONG: Impossible conditions
    if a && !a { // go vet: condition is always false
        // ...
    }
}
```

### Nil Function Comparison

```go
package main

import "fmt"

func nilFunctionCheck() {
    var f func()

    // WRONG: Comparing function to nil incorrectly
    // This is actually valid but potentially confusing
    if f == nil {
        fmt.Println("f is nil")
    }

    // Be careful with method expressions
    type T struct{}
    var t *T

    // This checks if t is nil, not if the method is nil
    if t == nil {
        fmt.Println("t is nil")
    }
}

func main() {
    nilFunctionCheck()
}
```

## Code Examples

### Unreachable Code Detection

```go
package main

import "fmt"

func unreachableExamples(x int) int {
    // Example 1: Code after return
    if x > 0 {
        return x
        fmt.Println("never printed") // go vet: unreachable code
    }

    // Example 2: Code after panic
    if x < 0 {
        panic("negative value")
        return -1 // go vet: unreachable code
    }

    // Example 3: Infinite loop without break
    for {
        if x == 0 {
            return 0
        }
        x--
    }
    fmt.Println("unreachable") // go vet: unreachable code

    return x // This is also unreachable
}

// Example 4: Dead code in switch
func switchUnreachable(x int) string {
    switch x {
    case 1:
        return "one"
        fmt.Println("dead") // go vet: unreachable code
    case 2:
        return "two"
    default:
        return "other"
    }
}
```

### Shift Bound Checking

```go
package main

import "fmt"

func shiftExamples() {
    var x uint8 = 1

    // WRONG: Shift exceeds type width
    y := x << 8  // go vet: x (type uint8) too small for shift of 8
    z := x << 10 // go vet: x (type uint8) too small for shift of 10

    // CORRECT: Shift within bounds
    a := x << 7  // Maximum safe shift for uint8

    var b uint64 = 1
    c := b << 63 // Maximum safe shift for uint64

    fmt.Println(y, z, a, c)
}

// Platform-specific shift issues
func platformShift() {
    var x int = 1
    // On 32-bit platforms, this could be problematic
    // go vet may warn on some platforms
    y := x << 32
    _ = y
}
```

### Method Signature Issues

```go
package main

import "fmt"

type MyError struct {
    Message string
}

// WRONG: Error method with wrong signature
func (e MyError) Error() { // go vet: method Error() should have signature Error() string
    fmt.Println(e.Message)
}

// CORRECT: Proper error interface implementation
type CorrectError struct {
    Message string
}

func (e CorrectError) Error() string {
    return e.Message
}

// WRONG: String method with wrong signature
type BadStringer struct {
    Value int
}

func (b BadStringer) String() int { // go vet: method String() should have signature String() string
    return b.Value
}

// CORRECT: Proper Stringer interface
type GoodStringer struct {
    Value int
}

func (g GoodStringer) String() string {
    return fmt.Sprintf("Value: %d", g.Value)
}
```

### Context Cancelation Checks

```go
package main

import (
    "context"
    "fmt"
    "time"
)

// WRONG: Ignoring context cancelation
func badContextUsage(ctx context.Context) {
    // go vet: the cancel function returned by context.WithCancel should be called
    ctx, _ = context.WithCancel(ctx)

    // go vet: the cancel function returned by context.WithTimeout should be called
    ctx, _ = context.WithTimeout(ctx, time.Second)

    _ = ctx
}

// CORRECT: Always call cancel
func goodContextUsage(ctx context.Context) {
    ctx, cancel := context.WithCancel(ctx)
    defer cancel() // Always defer cancel

    ctx2, cancel2 := context.WithTimeout(ctx, time.Second)
    defer cancel2()

    select {
    case <-ctx2.Done():
        fmt.Println("Context cancelled")
    case <-time.After(500 * time.Millisecond):
        fmt.Println("Work completed")
    }
}

// CORRECT: Cancel in all code paths
func conditionalCancel(ctx context.Context, shouldWork bool) error {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel() // Called regardless of code path

    if !shouldWork {
        return fmt.Errorf("not working")
    }

    // Do work with ctx
    _ = ctx
    return nil
}
```

### Atomic Operation Checks

```go
package main

import (
    "sync/atomic"
)

// WRONG: Non-atomic operations on atomic values
func badAtomic() {
    var counter int64

    // Direct assignment - not atomic
    counter = 1

    // Direct read - not atomic
    value := counter
    _ = value

    // This is a data race if used concurrently
    counter++
}

// CORRECT: Using atomic operations
func goodAtomic() {
    var counter int64

    // Atomic store
    atomic.StoreInt64(&counter, 1)

    // Atomic load
    value := atomic.LoadInt64(&counter)

    // Atomic increment
    atomic.AddInt64(&counter, 1)

    // Atomic compare and swap
    atomic.CompareAndSwapInt64(&counter, value, value+1)
}

// Go 1.19+ atomic types
func modernAtomic() {
    var counter atomic.Int64

    counter.Store(1)
    value := counter.Load()
    counter.Add(1)
    counter.CompareAndSwap(value, value+1)
}
```

## Best Practices

### 1. Run Go Vet in CI/CD

```yaml
# .github/workflows/go.yml
name: Go

on: [push, pull_request]

jobs:
  vet:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Set up Go
      uses: actions/setup-go@v5
      with:
        go-version: '1.22'

    - name: Run go vet
      run: go vet ./...

    - name: Run go vet with all analyzers
      run: |
        go vet -all ./...
```

### 2. Combine with Other Tools

```makefile
# Makefile
.PHONY: lint
lint:
	go vet ./...
	staticcheck ./...
	golangci-lint run

.PHONY: check
check: lint
	go test -race ./...

.PHONY: pre-commit
pre-commit: check
	@echo "All checks passed"
```

### 3. Custom Printf Functions

```go
package main

import (
    "fmt"
    "io"
)

// Tell go vet this is a printf-style function
// The format parameter is at index 0, args start at index 1

// Logf is a printf-style logging function.
func Logf(format string, args ...interface{}) {
    fmt.Printf("[LOG] "+format+"\n", args...)
}

// Errorf returns a formatted error.
func Errorf(format string, args ...interface{}) error {
    return fmt.Errorf(format, args...)
}

// Fprintf wrapper that go vet understands
func Fprintf(w io.Writer, format string, args ...interface{}) (int, error) {
    return fmt.Fprintf(w, format, args...)
}

// For custom types, use wrapper methods
type Logger struct {
    prefix string
}

func (l *Logger) Printf(format string, args ...interface{}) {
    fmt.Printf(l.prefix+format+"\n", args...)
}
```

### 4. Selective Analysis

```bash
# Run only specific analyzers
go vet -printf=true -copylocks=true ./...

# Disable specific analyzer
go vet -printf=false ./...

# List all available analyzers
go tool vet help

# Run shadow analyzer (not included by default)
go install golang.org/x/tools/go/analysis/passes/shadow/cmd/shadow@latest
shadow ./...
```

## Common Pitfalls

### 1. Ignoring Vet Warnings

```go
package main

import "fmt"

// DON'T ignore go vet warnings - they're almost always real bugs
func ignoredWarnings() {
    // "It works in my tests" - but it's still wrong
    fmt.Printf("%d", "string") // This will print garbage
}

// DO fix all go vet warnings immediately
func fixedWarnings() {
    fmt.Printf("%s", "string") // Correct format specifier
}
```

### 2. Misunderstanding Printf Verbs

```go
package main

import "fmt"

type MyType struct {
    Value int
}

func printfVerbs() {
    m := MyType{Value: 42}

    // %v - default format (usually what you want)
    fmt.Printf("%v\n", m)  // {42}

    // %+v - includes field names
    fmt.Printf("%+v\n", m) // {Value:42}

    // %#v - Go syntax
    fmt.Printf("%#v\n", m) // main.MyType{Value:42}

    // %T - type
    fmt.Printf("%T\n", m)  // main.MyType

    // %p - pointer (requires pointer type)
    fmt.Printf("%p\n", &m) // 0x...

    // WRONG: Using %p with non-pointer
    fmt.Printf("%p\n", m)  // go vet warning
}
```

### 3. Lock Copies in Loops

```go
package main

import "sync"

type Item struct {
    mu   sync.Mutex
    data string
}

func loopCopies() {
    items := []Item{
        {data: "a"},
        {data: "b"},
    }

    // WRONG: Range copies the struct including mutex
    for _, item := range items { // go vet: copies lock value
        item.mu.Lock()
        _ = item.data
        item.mu.Unlock()
    }

    // CORRECT: Use index to avoid copy
    for i := range items {
        items[i].mu.Lock()
        _ = items[i].data
        items[i].mu.Unlock()
    }

    // CORRECT: Use pointers
    itemPtrs := []*Item{{data: "a"}, {data: "b"}}
    for _, item := range itemPtrs {
        item.mu.Lock()
        _ = item.data
        item.mu.Unlock()
    }
}
```

### 4. Struct Tag Typos

```go
package main

// Common struct tag mistakes
type CommonMistakes struct {
    // WRONG: Space after colon
    Field1 string `json: "field1"` // go vet: struct field tag has space

    // WRONG: Missing quotes
    Field2 string `json:field2`    // go vet: struct field tag is not compatible

    // WRONG: Wrong quote type
    Field3 string `json:'field3'`  // go vet: struct field tag uses single quotes

    // WRONG: Duplicate keys
    Field4 string `json:"field4" json:"f4"` // go vet: duplicate field tag
}

// Correct versions
type CorrectTags struct {
    Field1 string `json:"field1"`
    Field2 string `json:"field2"`
    Field3 string `json:"field3"`
    Field4 string `json:"field4"`
}
```

## Performance Considerations

### Running Vet Efficiently

```bash
# Run on changed files only (in CI)
git diff --name-only HEAD~1 | grep '\.go$' | xargs -r go vet

# Parallel vet for large codebases
go vet -n ./... 2>&1 | parallel

# Cache-friendly vet (uses Go build cache)
go build ./... && go vet ./...
```

### Integration with Build Process

```go
// build.go
//go:build ignore

package main

import (
    "log"
    "os"
    "os/exec"
)

func main() {
    // Run go vet as part of build
    cmd := exec.Command("go", "vet", "./...")
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr

    if err := cmd.Run(); err != nil {
        log.Fatalf("go vet failed: %v", err)
    }

    // Continue with build
    cmd = exec.Command("go", "build", "-o", "app", "./cmd/app")
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr

    if err := cmd.Run(); err != nil {
        log.Fatalf("go build failed: %v", err)
    }
}
```

## Real-World Scenarios

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running go vet..."
go vet ./...
if [ $? -ne 0 ]; then
    echo "go vet failed. Please fix the issues before committing."
    exit 1
fi

echo "Running go test..."
go test -short ./...
if [ $? -ne 0 ]; then
    echo "Tests failed. Please fix the issues before committing."
    exit 1
fi

echo "All checks passed!"
exit 0
```

### Custom Analyzer Integration

```go
package main

import (
    "golang.org/x/tools/go/analysis"
    "golang.org/x/tools/go/analysis/multichecker"
    "golang.org/x/tools/go/analysis/passes/printf"
    "golang.org/x/tools/go/analysis/passes/shadow"
    "golang.org/x/tools/go/analysis/passes/structtag"
)

func main() {
    // Run multiple analyzers
    multichecker.Main(
        printf.Analyzer,
        shadow.Analyzer,
        structtag.Analyzer,
        // Add custom analyzers here
    )
}
```

### Configuring golangci-lint

```yaml
# .golangci.yml
linters:
  enable:
    - govet
    - staticcheck
    - errcheck
    - gosimple
    - ineffassign

linters-settings:
  govet:
    check-shadowing: true
    enable-all: true
    disable:
      - fieldalignment  # Too noisy for some projects

run:
  timeout: 5m

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - errcheck
```

## Interview Key Points

1. **What is go vet?**
   - Built-in static analysis tool that detects suspicious constructs
   - Low false-positive rate by design
   - Runs on type-checked packages for accuracy

2. **What issues does go vet detect?**
   - Printf format string mismatches
   - Copying locks (sync.Mutex, sync.RWMutex)
   - Invalid struct tags
   - Unreachable code
   - Suspicious boolean expressions
   - Atomic operation misuse

3. **How is go vet different from the compiler?**
   - Compiler checks syntax and type correctness
   - Go vet finds semantically suspicious but syntactically valid code
   - Go vet catches bugs the compiler cannot

4. **When should you run go vet?**
   - On every commit (pre-commit hook)
   - In CI/CD pipelines
   - Before code review
   - As part of the build process

5. **Can go vet be extended?**
   - Yes, using the golang.org/x/tools/go/analysis framework
   - Custom analyzers can be written and integrated
   - Tools like golangci-lint bundle many analyzers

## Further Reading

- [Go Vet Documentation](https://pkg.go.dev/cmd/vet)
- [Go Analysis Package](https://pkg.go.dev/golang.org/x/tools/go/analysis)
- [Writing Custom Analyzers](https://arslan.io/2019/06/13/using-go-analysis-to-write-a-custom-linter/)
- [golangci-lint](https://golangci-lint.run/)
- [staticcheck](https://staticcheck.io/)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
