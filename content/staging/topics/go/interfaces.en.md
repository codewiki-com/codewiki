---
title: Go Interfaces
description: "Deep dive into Go interfaces: implicit implementation, empty interface, type assertion and composition"
track: go
section: types-interfaces
difficulty: intermediate
tags:
  - Go
  - Interfaces
  - Type Assertion
  - Composition
status: imported
origin: old/src/content/docs/go/interfaces.en.md
divergence: 0.256
issues: []
legacy:
  category: Go
  subcategory: Object-Oriented
  order: 3
  lastUpdated: 2026-01-07
---

Interfaces are one of the most powerful and distinctive features in Go. Unlike many other languages, Go interfaces are satisfied implicitly, making them a flexible tool for achieving polymorphism and decoupling code. We explore the core concepts of Go interfaces, from basic definitions to advanced patterns.

## What is an Interface?

An interface in Go is a type that specifies a set of method signatures. Any type that implements all the methods in an interface automatically satisfies that interface, without needing to explicitly declare the relationship.

### Basic Interface Definition

```go
type Writer interface {
    Write([]byte) (int, error)
}

type Reader interface {
    Read([]byte) (int, error)
}
```

In this example, any type with a `Write` method matching the signature will satisfy the `Writer` interface.

## Implicit Implementation

One of Go's most elegant features is implicit interface satisfaction. A type doesn't need to declare that it implements an interface—if it has the required methods, it automatically satisfies the interface.

```go
package main

import "fmt"

// Define an interface
type Speaker interface {
    Speak() string
}

// Define a type
type Dog struct {
    Name string
}

// Implement the method (no explicit declaration needed)
func (d Dog) Speak() string {
    return "Woof! My name is " + d.Name
}

type Cat struct {
    Name string
}

func (c Cat) Speak() string {
    return "Meow! I'm " + c.Name
}

// Function that accepts any Speaker
func MakeSound(s Speaker) {
    fmt.Println(s.Speak())
}

func main() {
    dog := Dog{Name: "Buddy"}
    cat := Cat{Name: "Whiskers"}

    MakeSound(dog) // Output: Woof! My name is Buddy
    MakeSound(cat) // Output: Meow! I'm Whiskers
}
```

This implicit satisfaction allows for great flexibility and makes it easy to adapt existing types to new interfaces without modifying their original definitions.

## The Empty Interface

The empty interface `interface{}` is a special interface that has zero methods. Since every type implements at least zero methods, every type satisfies the empty interface.

```go
package main

import "fmt"

func PrintAnything(v interface{}) {
    fmt.Printf("Value: %v, Type: %T\n", v, v)
}

func main() {
    PrintAnything(42)           // Value: 42, Type: int
    PrintAnything("hello")      // Value: hello, Type: string
    PrintAnything(3.14)         // Value: 3.14, Type: float64
    PrintAnything([]int{1, 2})  // Value: [1 2], Type: []int
}
```

In Go 1.18+, the `any` type was introduced as an alias for `interface{}`, making code more readable:

```go
func PrintAnything(v any) {
    fmt.Printf("Value: %v, Type: %T\n", v, v)
}
```

## Type Assertion

Type assertion provides access to an interface value's underlying concrete value. It allows you to extract the dynamic value stored in an interface.

### Basic Type Assertion

```go
package main

import "fmt"

func main() {
    var i interface{} = "hello"

    // Type assertion
    s := i.(string)
    fmt.Println(s) // Output: hello

    // This would panic: s := i.(int)
}
```

### Safe Type Assertion

To avoid panics, use the two-value form of type assertion:

```go
package main

import "fmt"

func main() {
    var i interface{} = "hello"

    // Safe type assertion
    s, ok := i.(string)
    if ok {
        fmt.Println("String value:", s)
    }

    n, ok := i.(int)
    if ok {
        fmt.Println("Int value:", n)
    } else {
        fmt.Println("Not an int") // This will execute
    }
}
```

### Practical Example

```go
package main

import "fmt"

type Shape interface {
    Area() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return 3.14159 * c.Radius * c.Radius
}

func (c Circle) Circumference() float64 {
    return 2 * 3.14159 * c.Radius
}

func DescribeShape(s Shape) {
    fmt.Printf("Area: %.2f\n", s.Area())

    // Type assertion to access Circle-specific methods
    if circle, ok := s.(Circle); ok {
        fmt.Printf("Circumference: %.2f\n", circle.Circumference())
    }
}

func main() {
    c := Circle{Radius: 5}
    DescribeShape(c)
}
```

## Type Switch

A type switch is a construct that permits several type assertions in series. It's like a regular switch statement, but the cases specify types rather than values.

```go
package main

import "fmt"

func ClassifyType(i interface{}) {
    switch v := i.(type) {
    case int:
        fmt.Printf("Integer: %d\n", v)
    case string:
        fmt.Printf("String: %s\n", v)
    case bool:
        fmt.Printf("Boolean: %t\n", v)
    case []int:
        fmt.Printf("Slice of ints: %v\n", v)
    default:
        fmt.Printf("Unknown type: %T\n", v)
    }
}

func main() {
    ClassifyType(42)
    ClassifyType("hello")
    ClassifyType(true)
    ClassifyType([]int{1, 2, 3})
    ClassifyType(3.14)
}
```

Output:
```
Integer: 42
String: hello
Boolean: true
Slice of ints: [1 2 3]
Unknown type: float64
```

### Advanced Type Switch Example

```go
package main

import "fmt"

type Shape interface {
    Area() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return 3.14159 * c.Radius * c.Radius
}

type Rectangle struct {
    Width, Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

type Triangle struct {
    Base, Height float64
}

func (t Triangle) Area() float64 {
    return 0.5 * t.Base * t.Height
}

func DescribeShape(s Shape) {
    fmt.Printf("Area: %.2f\n", s.Area())

    switch shape := s.(type) {
    case Circle:
        fmt.Printf("Circle with radius: %.2f\n", shape.Radius)
    case Rectangle:
        fmt.Printf("Rectangle with width: %.2f, height: %.2f\n",
            shape.Width, shape.Height)
    case Triangle:
        fmt.Printf("Triangle with base: %.2f, height: %.2f\n",
            shape.Base, shape.Height)
    default:
        fmt.Println("Unknown shape type")
    }
}

func main() {
    shapes := []Shape{
        Circle{Radius: 5},
        Rectangle{Width: 4, Height: 6},
        Triangle{Base: 3, Height: 4},
    }

    for _, shape := range shapes {
        DescribeShape(shape)
        fmt.Println("---")
    }
}
```

## Interface Composition

Go allows you to compose interfaces by embedding one interface into another. This creates a new interface that requires all methods from the embedded interfaces.

```go
package main

import "fmt"

type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type Closer interface {
    Close() error
}

// Composed interface
type ReadWriter interface {
    Reader
    Writer
}

// Composed interface with multiple embedded interfaces
type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}
```

### Practical Composition Example

```go
package main

import (
    "fmt"
    "strings"
)

type DataSource interface {
    Read() (string, error)
}

type DataSink interface {
    Write(data string) error
}

type DataProcessor interface {
    Process(data string) string
}

// Composed interface
type Pipeline interface {
    DataSource
    DataProcessor
    DataSink
}

// Implementing the composed interface
type TextPipeline struct {
    input  string
    output strings.Builder
}

func (tp *TextPipeline) Read() (string, error) {
    return tp.input, nil
}

func (tp *TextPipeline) Process(data string) string {
    return strings.ToUpper(data)
}

func (tp *TextPipeline) Write(data string) error {
    tp.output.WriteString(data)
    return nil
}

func (tp *TextPipeline) GetOutput() string {
    return tp.output.String()
}

func RunPipeline(p Pipeline) error {
    // Read data
    data, err := p.Read()
    if err != nil {
        return err
    }

    // Process data
    processed := p.Process(data)

    // Write data
    return p.Write(processed)
}

func main() {
    pipeline := &TextPipeline{input: "hello world"}

    if err := RunPipeline(pipeline); err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println("Output:", pipeline.GetOutput())
    // Output: HELLO WORLD
}
```

## Interface Design Best Practices

### Keep Interfaces Small

The smaller the interface, the more powerful it is. Many Go interfaces contain just one or two methods.

```go
// Good: Small, focused interface
type Stringer interface {
    String() string
}

// Less ideal: Large interface
type Database interface {
    Connect() error
    Disconnect() error
    Query(sql string) ([]Row, error)
    Execute(sql string) error
    BeginTransaction() error
    CommitTransaction() error
    RollbackTransaction() error
}

// Better: Compose smaller interfaces
type Connector interface {
    Connect() error
    Disconnect() error
}

type Querier interface {
    Query(sql string) ([]Row, error)
}

type Executor interface {
    Execute(sql string) error
}
```

### Accept Interfaces, Return Concrete Types

This principle makes your code more flexible and testable.

```go
package main

import (
    "fmt"
    "io"
    "strings"
)

// Accept interface
func ProcessData(r io.Reader) (string, error) {
    data := make([]byte, 100)
    n, err := r.Read(data)
    if err != nil && err != io.EOF {
        return "", err
    }
    return string(data[:n]), nil
}

// Return concrete type
func NewStringReader(s string) *strings.Reader {
    return strings.NewReader(s)
}

func main() {
    reader := NewStringReader("Hello, interfaces!")
    result, err := ProcessData(reader)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println(result)
}
```

### Define Interfaces Where They're Used

Define interfaces in the package that uses them, not the package that implements them. This is known as the "consumer-driven" interface pattern.

```go
// In package consumer
package consumer

// Define the interface where it's used
type DataStore interface {
    Save(data string) error
    Load(id string) (string, error)
}

func ProcessAndStore(ds DataStore, data string) error {
    // Use the interface
    return ds.Save(data)
}

// In package provider
package provider

type FileStore struct {
    // implementation details
}

// Just implement the methods; no need to reference the interface
func (fs *FileStore) Save(data string) error {
    // implementation
    return nil
}

func (fs *FileStore) Load(id string) (string, error) {
    // implementation
    return "", nil
}
```

## Common Standard Library Interfaces

### io.Reader and io.Writer

```go
package main

import (
    "fmt"
    "io"
    "os"
    "strings"
)

func CountBytes(r io.Reader) (int, error) {
    buf := make([]byte, 1024)
    total := 0

    for {
        n, err := r.Read(buf)
        total += n
        if err == io.EOF {
            break
        }
        if err != nil {
            return total, err
        }
    }

    return total, nil
}

func main() {
    // Works with strings.Reader
    sr := strings.NewReader("Hello, World!")
    count, _ := CountBytes(sr)
    fmt.Printf("String reader: %d bytes\n", count)

    // Works with files
    file, _ := os.Open("example.txt")
    defer file.Close()
    count, _ = CountBytes(file)
    fmt.Printf("File: %d bytes\n", count)
}
```

### fmt.Stringer

```go
package main

import "fmt"

type Person struct {
    Name string
    Age  int
}

// Implementing fmt.Stringer
func (p Person) String() string {
    return fmt.Sprintf("%s (%d years old)", p.Name, p.Age)
}

func main() {
    p := Person{Name: "Alice", Age: 30}
    fmt.Println(p) // Automatically calls String() method
    // Output: Alice (30 years old)
}
```

### error Interface

```go
package main

import "fmt"

// error is a built-in interface
// type error interface {
//     Error() string
// }

type ValidationError struct {
    Field   string
    Message string
}

func (e ValidationError) Error() string {
    return fmt.Sprintf("validation error on field '%s': %s", e.Field, e.Message)
}

func ValidateAge(age int) error {
    if age < 0 {
        return ValidationError{
            Field:   "age",
            Message: "must be non-negative",
        }
    }
    if age > 150 {
        return ValidationError{
            Field:   "age",
            Message: "must be realistic",
        }
    }
    return nil
}

func main() {
    if err := ValidateAge(-5); err != nil {
        fmt.Println(err)
        // Output: validation error on field 'age': must be non-negative
    }
}
```

## Interface Values and Nil

Understanding how interfaces work with nil values is crucial to avoiding bugs.

```go
package main

import "fmt"

type MyError struct {
    Message string
}

func (e *MyError) Error() string {
    if e == nil {
        return "no error"
    }
    return e.Message
}

func MayReturnError(shouldError bool) error {
    var err *MyError // nil pointer
    if shouldError {
        err = &MyError{Message: "something went wrong"}
    }
    return err // Returns interface value
}

func main() {
    err := MayReturnError(false)

    // This might be surprising: err is not nil!
    // The interface contains a nil pointer, but the interface itself is not nil
    if err != nil {
        fmt.Println("Error occurred:", err) // This will execute!
        fmt.Printf("Error is nil pointer: %v\n", err.(*MyError) == nil)
    }

    // Correct way
    if err != nil && err.(*MyError) != nil {
        fmt.Println("Error occurred:", err)
    }
}
```

To avoid this issue, return nil explicitly:

```go
func MayReturnError(shouldError bool) error {
    if shouldError {
        return &MyError{Message: "something went wrong"}
    }
    return nil // Return nil interface, not nil pointer
}
```

## Advanced Pattern: Interface Segregation

Following the Interface Segregation Principle, create specific interfaces for specific use cases rather than one large interface.

```go
package main

import "fmt"

// Instead of one large interface
type BadDatabase interface {
    Connect() error
    Disconnect() error
    Query(sql string) ([]Row, error)
    Execute(sql string) error
    BeginTransaction() error
    Commit() error
    Rollback() error
    Backup() error
    Restore(path string) error
}

// Create segregated interfaces
type Connector interface {
    Connect() error
    Disconnect() error
}

type Querier interface {
    Query(sql string) ([]Row, error)
}

type Executor interface {
    Execute(sql string) error
}

type Transactional interface {
    BeginTransaction() error
    Commit() error
    Rollback() error
}

type Row struct {
    Data map[string]interface{}
}

// Implementations can choose which interfaces to satisfy
type ReadOnlyDB struct{}

func (db ReadOnlyDB) Connect() error    { return nil }
func (db ReadOnlyDB) Disconnect() error { return nil }
func (db ReadOnlyDB) Query(sql string) ([]Row, error) {
    return []Row{}, nil
}

// ReadOnlyDB satisfies Connector and Querier, but not Executor

type FullDB struct{}

func (db FullDB) Connect() error              { return nil }
func (db FullDB) Disconnect() error           { return nil }
func (db FullDB) Query(sql string) ([]Row, error) { return []Row{}, nil }
func (db FullDB) Execute(sql string) error   { return nil }
func (db FullDB) BeginTransaction() error    { return nil }
func (db FullDB) Commit() error              { return nil }
func (db FullDB) Rollback() error            { return nil }

// FullDB satisfies all interfaces

func main() {
    var q Querier = ReadOnlyDB{}
    q.Query("SELECT * FROM users")

    var t Transactional = FullDB{}
    t.BeginTransaction()

    fmt.Println("Interface segregation example")
}
```

## Conclusion

Go interfaces are a powerful feature that enables flexible, decoupled, and testable code. Key takeaways:

- Interfaces are satisfied implicitly, requiring no explicit declaration
- The empty interface (`interface{}` or `any`) can hold any value
- Type assertions and type switches allow you to work with dynamic types safely
- Interface composition creates powerful abstractions from smaller interfaces
- Follow best practices: keep interfaces small, define them where they're used, and accept interfaces while returning concrete types

By mastering interfaces, you unlock one of Go's most powerful capabilities for writing clean, maintainable, and idiomatic code.
