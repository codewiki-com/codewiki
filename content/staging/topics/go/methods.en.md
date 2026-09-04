---
title: Go 方法详解
description: 深入理解 Go 方法：值接收者、指针接收者、方法集与嵌入方法
track: go
section: types-interfaces
difficulty: intermediate
tags:
  - Go
  - 方法
  - 接收者
  - 方法集
  - 嵌入
status: imported
origin: old/src/content/docs/go/methods.en.md
divergence: 0.209
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 面向对象
  order: 4
  lastUpdated: 2026-01-07
---

Methods are the core mechanism for implementing object-oriented programming in Go. Unlike traditional object-oriented languages, Go doesn't have the concept of classes. Instead, it achieves similar functionality by defining methods on types. Understanding how methods work, especially the difference between value receivers and pointer receivers, is key to mastering the Go language.

## Concept Explanation

### What is a Method

A method is a special kind of function that is associated with a specific type. The syntax for defining a method adds a receiver parameter before the function name, and this receiver specifies the type to which the method belongs.

```go
// Regular function
func Add(a, b int) int {
    return a + b
}

// Method: associated with Rectangle type
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}
```

### Difference Between Methods and Functions

| Feature | Function | Method |
|---------|----------|--------|
| Definition | `func FunctionName(params) ReturnType` | `func (receiver) MethodName(params) ReturnType` |
| Invocation | `FunctionName(args)` | `instance.MethodName(args)` |
| Associated Type | None | Yes (through receiver) |
| Namespace | Globally unique | Different types can have methods with the same name |

### Historical Background

Go's method design draws inspiration from various languages but adopts a more concise approach. Go's designers (Rob Pike, Ken Thompson, et al.) believed that traditional class inheritance hierarchies were overly complex, so they chose a composition and interface-based approach to implement object-oriented programming. Methods are a core component of this design philosophy.

## Core Principles

### The Essence of Methods

In Go, a method is essentially a function with the receiver as its first parameter. The compiler transforms method calls into regular function calls.

```go
type Point struct {
    X, Y float64
}

// Method definition
func (p Point) Distance() float64 {
    return math.Sqrt(p.X*p.X + p.Y*p.Y)
}

// The above method is internally equivalent to:
// func PointDistance(p Point) float64 {
//     return math.Sqrt(p.X*p.X + p.Y*p.Y)
// }

func main() {
    p := Point{3, 4}

    // Method call
    d1 := p.Distance()

    // Equivalent function-style call (method expression)
    d2 := Point.Distance(p)

    fmt.Println(d1, d2) // 5 5
}
```

### Receiver Types

Go supports two types of receivers:

1. **Value receiver**: The method operates on a copy of the receiver
2. **Pointer receiver**: The method operates on the receiver itself

```go
type Counter struct {
    count int
}

// Value receiver: cannot modify the original value
func (c Counter) ValueIncrement() {
    c.count++ // Modifies the copy
}

// Pointer receiver: can modify the original value
func (c *Counter) PointerIncrement() {
    c.count++ // Modifies the original value
}
```

### Method Set Rules

The method set determines which methods a type can call, which is crucial for interface implementation:

| Type | Method Set |
|------|------------|
| `T` (value type) | All value receiver methods |
| `*T` (pointer type) | All value receiver methods + All pointer receiver methods |

```go
type Animal interface {
    Speak() string
    Move()
}

type Dog struct {
    Name string
}

func (d Dog) Speak() string {  // Value receiver
    return "Woof"
}

func (d *Dog) Move() {  // Pointer receiver
    fmt.Printf("%s is running\n", d.Name)
}

func main() {
    dog := Dog{Name: "Buddy"}

    // Dog type only has Speak method in its method set
    // var a Animal = dog  // Compile error: Dog does not implement Animal

    // *Dog type has both Speak and Move methods
    var a Animal = &dog  // Correct
    fmt.Println(a.Speak())
    a.Move()
}
```

## Key Points

### Value Receiver

Value receiver methods receive a copy of the caller and do not affect the original value.

**Characteristics:**
- Internal modifications do not affect the original struct
- Suitable for read-only operations
- Can be called by both value types and pointer types

```go
package main

import "fmt"

type Rectangle struct {
    Width  float64
    Height float64
}

// Value receiver method
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

// Attempted modification (will not take effect)
func (r Rectangle) Scale(factor float64) {
    r.Width *= factor   // Modifies the copy
    r.Height *= factor  // Modifies the copy
}

func main() {
    rect := Rectangle{Width: 10, Height: 5}

    fmt.Println("Area:", rect.Area())       // Area: 50
    fmt.Println("Perimeter:", rect.Perimeter()) // Perimeter: 30

    rect.Scale(2)
    fmt.Println("Area after scaling:", rect.Area()) // Area: 50 (unchanged)

    // Pointer can also call value receiver methods
    ptr := &rect
    fmt.Println("Called via pointer:", ptr.Area()) // Area: 50
}
```

### Pointer Receiver

Pointer receiver methods receive the address of the caller and can modify the original value.

**Characteristics:**
- Can modify the original struct
- Avoids copy overhead for large structs
- Can be called by pointer types; value types are automatically addressed

```go
package main

import "fmt"

type Account struct {
    Balance float64
    Owner   string
}

// Pointer receiver method: can modify state
func (a *Account) Deposit(amount float64) error {
    if amount <= 0 {
        return fmt.Errorf("deposit amount must be greater than 0")
    }
    a.Balance += amount
    return nil
}

func (a *Account) Withdraw(amount float64) error {
    if amount <= 0 {
        return fmt.Errorf("withdrawal amount must be greater than 0")
    }
    if a.Balance < amount {
        return fmt.Errorf("insufficient balance")
    }
    a.Balance -= amount
    return nil
}

// Value receiver method: read-only operation
func (a Account) GetBalance() float64 {
    return a.Balance
}

func main() {
    account := Account{Balance: 1000, Owner: "John"}

    account.Deposit(500)
    fmt.Printf("Balance after deposit: %.2f\n", account.GetBalance()) // 1500.00

    account.Withdraw(200)
    fmt.Printf("Balance after withdrawal: %.2f\n", account.GetBalance()) // 1300.00

    // Even for value types, Go automatically takes the address to call pointer receiver methods
    // account.Deposit(100) is equivalent to (&account).Deposit(100)
}
```

### Method Sets and Interfaces

Method sets determine whether a type implements a particular interface:

```go
package main

import "fmt"

// Define interfaces
type Resizable interface {
    Resize(factor float64)
}

type Measurable interface {
    Area() float64
}

type Shape interface {
    Resizable
    Measurable
}

type Square struct {
    Side float64
}

// Value receiver
func (s Square) Area() float64 {
    return s.Side * s.Side
}

// Pointer receiver
func (s *Square) Resize(factor float64) {
    s.Side *= factor
}

func main() {
    s := Square{Side: 10}

    // Square only implements Measurable (only has value receiver method)
    var m Measurable = s
    fmt.Println("Area:", m.Area())

    // *Square implements Shape (has all methods)
    var shape Shape = &s
    fmt.Println("Area:", shape.Area())
    shape.Resize(2)
    fmt.Println("Area after resize:", shape.Area())

    // Compile error example:
    // var shape2 Shape = s  // Square does not implement Shape
}
```

### Embedded Methods

Through struct embedding, methods of the embedded type are "promoted" to the outer type:

```go
package main

import "fmt"

// Base type
type Logger struct {
    Prefix string
}

func (l *Logger) Log(message string) {
    fmt.Printf("[%s] %s\n", l.Prefix, message)
}

func (l *Logger) Error(message string) {
    fmt.Printf("[%s] ERROR: %s\n", l.Prefix, message)
}

// Embed Logger
type Service struct {
    *Logger  // Embedded pointer
    Name string
}

func (s *Service) Start() {
    s.Log(fmt.Sprintf("%s service started", s.Name))
}

func (s *Service) Stop() {
    s.Log(fmt.Sprintf("%s service stopped", s.Name))
}

func main() {
    service := &Service{
        Logger: &Logger{Prefix: "INFO"},
        Name:   "UserService",
    }

    // Directly call methods of embedded type
    service.Log("Initialization complete")
    service.Error("An error occurred")

    // Call methods of outer type
    service.Start()
    service.Stop()

    // Can also access explicitly
    service.Logger.Log("Explicit call")
}
```

**Output:**
```
[INFO] Initialization complete
[INFO] ERROR: An error occurred
[INFO] UserService service started
[INFO] UserService service stopped
[INFO] Explicit call
```

## Code Examples

### Complete Example: Shape Calculator

```go
package main

import (
    "fmt"
    "math"
)

// Define interface
type Shape interface {
    Area() float64
    Perimeter() float64
    String() string
}

// Circle
type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
    return 2 * math.Pi * c.Radius
}

func (c Circle) String() string {
    return fmt.Sprintf("Circle(radius=%.2f)", c.Radius)
}

func (c *Circle) Scale(factor float64) {
    c.Radius *= factor
}

// Rectangle
type Rectangle struct {
    Width, Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

func (r Rectangle) String() string {
    return fmt.Sprintf("Rectangle(%.2f x %.2f)", r.Width, r.Height)
}

func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}

// Triangle
type Triangle struct {
    A, B, C float64 // Side lengths
}

func (t Triangle) Area() float64 {
    // Heron's formula
    s := (t.A + t.B + t.C) / 2
    return math.Sqrt(s * (s - t.A) * (s - t.B) * (s - t.C))
}

func (t Triangle) Perimeter() float64 {
    return t.A + t.B + t.C
}

func (t Triangle) String() string {
    return fmt.Sprintf("Triangle(sides=%.2f, %.2f, %.2f)", t.A, t.B, t.C)
}

func (t *Triangle) Scale(factor float64) {
    t.A *= factor
    t.B *= factor
    t.C *= factor
}

// Print shape information
func PrintShapeInfo(s Shape) {
    fmt.Printf("%s\n", s.String())
    fmt.Printf("  Area: %.2f\n", s.Area())
    fmt.Printf("  Perimeter: %.2f\n", s.Perimeter())
}

// Calculate total area
func TotalArea(shapes []Shape) float64 {
    total := 0.0
    for _, s := range shapes {
        total += s.Area()
    }
    return total
}

func main() {
    shapes := []Shape{
        Circle{Radius: 5},
        Rectangle{Width: 10, Height: 5},
        Triangle{A: 3, B: 4, C: 5},
    }

    fmt.Println("=== Shape Information ===")
    for _, shape := range shapes {
        PrintShapeInfo(shape)
        fmt.Println()
    }

    fmt.Printf("Total area: %.2f\n", TotalArea(shapes))

    // Demonstrate scaling
    fmt.Println("\n=== Scaling Demo ===")
    circle := &Circle{Radius: 5}
    fmt.Printf("Before scaling: %s, Area: %.2f\n", circle.String(), circle.Area())
    circle.Scale(2)
    fmt.Printf("After scaling: %s, Area: %.2f\n", circle.String(), circle.Area())
}
```

**Output:**
```
=== Shape Information ===
Circle(radius=5.00)
  Area: 78.54
  Perimeter: 31.42

Rectangle(10.00 x 5.00)
  Area: 50.00
  Perimeter: 30.00

Triangle(sides=3.00, 4.00, 5.00)
  Area: 6.00
  Perimeter: 12.00

Total area: 134.54

=== Scaling Demo ===
Before scaling: Circle(radius=5.00), Area: 78.54
After scaling: Circle(radius=10.00), Area: 314.16
```

### Example: Method Chaining

```go
package main

import (
    "fmt"
    "strings"
)

type StringBuilder struct {
    data []string
}

func NewStringBuilder() *StringBuilder {
    return &StringBuilder{
        data: make([]string, 0),
    }
}

// Return pointer to support method chaining
func (sb *StringBuilder) Append(s string) *StringBuilder {
    sb.data = append(sb.data, s)
    return sb
}

func (sb *StringBuilder) AppendLine(s string) *StringBuilder {
    sb.data = append(sb.data, s+"\n")
    return sb
}

func (sb *StringBuilder) Clear() *StringBuilder {
    sb.data = sb.data[:0]
    return sb
}

func (sb *StringBuilder) String() string {
    return strings.Join(sb.data, "")
}

func (sb *StringBuilder) Length() int {
    return len(sb.String())
}

func main() {
    builder := NewStringBuilder()

    // Method chaining
    result := builder.
        Append("Hello, ").
        Append("World!").
        AppendLine("").
        Append("Go method").
        AppendLine(" chaining").
        String()

    fmt.Println(result)
    fmt.Printf("Total length: %d\n", builder.Length())
}
```

**Output:**
```
Hello, World!
Go method chaining

Total length: 29
```

### Example: Method Expressions and Method Values

```go
package main

import "fmt"

type Calculator struct {
    Value float64
}

func (c Calculator) Add(n float64) float64 {
    return c.Value + n
}

func (c Calculator) Multiply(n float64) float64 {
    return c.Value * n
}

func (c *Calculator) Set(n float64) {
    c.Value = n
}

func main() {
    calc := Calculator{Value: 10}

    // 1. Normal method call
    fmt.Println("Normal call:", calc.Add(5))  // 15

    // 2. Method Expression
    // Convert method to function, first parameter is the receiver
    addFunc := Calculator.Add
    fmt.Println("Method expression:", addFunc(calc, 5))  // 15

    // Method expression for pointer receiver
    setFunc := (*Calculator).Set
    setFunc(&calc, 20)
    fmt.Println("After Set:", calc.Value)  // 20

    // 3. Method Value
    // Method bound to a specific receiver
    addMethod := calc.Add
    multiplyMethod := calc.Multiply

    fmt.Println("Method value Add:", addMethod(5))       // 25
    fmt.Println("Method value Multiply:", multiplyMethod(3))  // 60

    // Method values can be used as callback functions
    operations := []func(float64) float64{addMethod, multiplyMethod}
    for i, op := range operations {
        fmt.Printf("Operation %d result: %.2f\n", i+1, op(2))
    }
}
```

**Output:**
```
Normal call: 15
Method expression: 15
After Set: 20
Method value Add: 25
Method value Multiply: 60
Operation 1 result: 22.00
Operation 2 result: 40.00
```

## Best Practices

### Choose the Correct Receiver Type

```go
// When to use pointer receiver:

// 1. Need to modify the receiver
func (u *User) UpdateName(name string) {
    u.Name = name
}

// 2. Receiver is a large struct
type LargeStruct struct {
    Data [1000]int
}

func (ls *LargeStruct) Process() {
    // Avoid copying 1000 ints
}

// 3. Consistency: if other methods of the type use pointer receivers
func (u *User) Save() error { ... }
func (u *User) Delete() error { ... }
func (u *User) Validate() error { ... }  // Keep consistent

// 4. Receiver contains sync.Mutex or similar fields
type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}
```

```go
// When to use value receiver:

// 1. No need to modify the receiver
func (p Point) Distance(other Point) float64 {
    dx := p.X - other.X
    dy := p.Y - other.Y
    return math.Sqrt(dx*dx + dy*dy)
}

// 2. Receiver is a small struct
type Point struct {
    X, Y float64
}

func (p Point) String() string {
    return fmt.Sprintf("(%v, %v)", p.X, p.Y)
}

// 3. Receiver is a basic type, slice, or map (which are reference types themselves)
type MySlice []int

func (s MySlice) Sum() int {
    sum := 0
    for _, v := range s {
        sum += v
    }
    return sum
}
```

### Maintain Consistency in Method Sets

```go
// Good practice: all methods use the same receiver type
type User struct {
    ID   int
    Name string
}

func (u *User) Save() error { ... }
func (u *User) Update() error { ... }
func (u *User) Delete() error { ... }
func (u *User) Validate() error { ... }

// Avoid: mixing receiver types (unless there's a clear reason)
func (u *User) Save() error { ... }
func (u User) GetName() string { ... }  // Inconsistent
```

### Document Your Methods

```go
// User represents a user in the system.
type User struct {
    ID        int
    Name      string
    Email     string
    CreatedAt time.Time
}

// Validate validates the user data.
// Checks include:
//   - Name cannot be empty and must be between 2-50 characters
//   - Email format must be valid
//
// Returns an error if validation fails, otherwise returns nil.
func (u *User) Validate() error {
    if u.Name == "" {
        return errors.New("name cannot be empty")
    }
    if len(u.Name) < 2 || len(u.Name) > 50 {
        return errors.New("name length must be between 2-50")
    }
    if !isValidEmail(u.Email) {
        return errors.New("invalid email format")
    }
    return nil
}
```

### Avoid Modifying Unrelated State in Methods

```go
// Good practice: method only modifies state related to itself
func (o *Order) Cancel() error {
    if o.Status == "shipped" {
        return errors.New("cannot cancel shipped orders")
    }
    o.Status = "cancelled"
    o.CancelledAt = time.Now()
    return nil
}

// Avoid: method modifies unrelated global state
var globalCounter int

func (o *Order) Cancel() error {
    globalCounter++  // Bad practice
    o.Status = "cancelled"
    return nil
}
```

### Use Embedding for Code Reuse

```go
// Base functionality
type Timestamps struct {
    CreatedAt time.Time
    UpdatedAt time.Time
}

func (t *Timestamps) Touch() {
    t.UpdatedAt = time.Now()
}

func (t *Timestamps) SetCreated() {
    t.CreatedAt = time.Now()
    t.UpdatedAt = t.CreatedAt
}

// Reuse timestamp functionality
type User struct {
    Timestamps
    ID   int
    Name string
}

type Article struct {
    Timestamps
    ID      int
    Title   string
    Content string
}

func main() {
    user := &User{ID: 1, Name: "John"}
    user.SetCreated()

    article := &Article{ID: 1, Title: "Go Methods"}
    article.SetCreated()

    // When updating
    article.Touch()
}
```

## Common Pitfalls

### nil Receiver

Methods can be called on nil receivers (if using pointer receivers):

```go
package main

import "fmt"

type List struct {
    Value int
    Next  *List
}

// Can safely handle nil
func (l *List) Length() int {
    if l == nil {
        return 0
    }
    return 1 + l.Next.Length()
}

// Unsafe: will panic on nil
func (l *List) UnsafeGet() int {
    return l.Value  // Will panic if l is nil
}

func main() {
    var list *List
    fmt.Println("Empty list length:", list.Length())  // 0

    list = &List{Value: 1, Next: &List{Value: 2, Next: nil}}
    fmt.Println("List length:", list.Length())  // 2

    // The following will panic
    // var nilList *List
    // fmt.Println(nilList.UnsafeGet())
}
```

### Value Receiver Modifications Don't Take Effect

```go
package main

import "fmt"

type Point struct {
    X, Y int
}

// Wrong: value receiver cannot modify original value
func (p Point) MoveWrong(dx, dy int) {
    p.X += dx
    p.Y += dy
    // p is a copy, modifications won't affect original
}

// Correct: use pointer receiver
func (p *Point) MoveRight(dx, dy int) {
    p.X += dx
    p.Y += dy
}

func main() {
    p := Point{X: 0, Y: 0}

    p.MoveWrong(10, 20)
    fmt.Printf("After MoveWrong: %+v\n", p)  // {X:0 Y:0}

    p.MoveRight(10, 20)
    fmt.Printf("After MoveRight: %+v\n", p)  // {X:10 Y:20}
}
```

### Method Set Issues with Interface Implementation

```go
package main

import "fmt"

type Modifier interface {
    Modify()
}

type Data struct {
    Value int
}

func (d *Data) Modify() {
    d.Value++
}

func main() {
    d := Data{Value: 1}

    // Error: Data does not implement Modifier (only *Data does)
    // var m Modifier = d  // Compile error

    // Correct: use pointer
    var m Modifier = &d
    m.Modify()
    fmt.Println(d.Value)  // 2

    // Note: although you can call pointer receiver methods on values
    d.Modify()  // Go automatically converts to (&d).Modify()
    // This doesn't mean Data implements the Modifier interface
}
```

### Method Shadowing with Embedded Fields

```go
package main

import "fmt"

type Base struct {
    Name string
}

func (b Base) Describe() string {
    return "Base: " + b.Name
}

type Derived struct {
    Base
    Name string  // Same-named field as embedded type
}

// Same-named method shadows the embedded type's method
func (d Derived) Describe() string {
    return "Derived: " + d.Name
}

func main() {
    d := Derived{
        Base: Base{Name: "base-name"},
        Name: "derived-name",
    }

    fmt.Println(d.Describe())       // Derived: derived-name
    fmt.Println(d.Base.Describe())  // Base: base-name

    fmt.Println(d.Name)       // derived-name
    fmt.Println(d.Base.Name)  // base-name
}
```

### Using Method Values in Loops

```go
package main

import "fmt"

type Handler struct {
    ID int
}

func (h *Handler) Handle() {
    fmt.Printf("Handler %d\n", h.ID)
}

func main() {
    handlers := []Handler{{ID: 1}, {ID: 2}, {ID: 3}}

    // Wrong: all functions reference the same variable
    var funcs []func()
    for _, h := range handlers {
        funcs = append(funcs, h.Handle)
        // h.Handle captures the address of h, but h is the same variable in each iteration
    }

    // All output Handler 3
    for _, f := range funcs {
        f()
    }

    fmt.Println("---")

    // Correct: create a local variable
    var funcs2 []func()
    for _, h := range handlers {
        h := h  // Create new variable
        funcs2 = append(funcs2, h.Handle)
    }

    // Correctly outputs 1, 2, 3
    for _, f := range funcs2 {
        f()
    }
}
```

## Performance Considerations

### Performance of Value Receiver vs Pointer Receiver

```go
package main

import (
    "testing"
)

type SmallStruct struct {
    X, Y int
}

type LargeStruct struct {
    Data [1000]int
}

func (s SmallStruct) ValueMethod() int {
    return s.X + s.Y
}

func (s *SmallStruct) PointerMethod() int {
    return s.X + s.Y
}

func (l LargeStruct) ValueMethod() int {
    return l.Data[0]
}

func (l *LargeStruct) PointerMethod() int {
    return l.Data[0]
}

// Benchmark tests
func BenchmarkSmallStructValue(b *testing.B) {
    s := SmallStruct{X: 1, Y: 2}
    for i := 0; i < b.N; i++ {
        _ = s.ValueMethod()
    }
}

func BenchmarkSmallStructPointer(b *testing.B) {
    s := SmallStruct{X: 1, Y: 2}
    for i := 0; i < b.N; i++ {
        _ = s.PointerMethod()
    }
}

func BenchmarkLargeStructValue(b *testing.B) {
    l := LargeStruct{}
    for i := 0; i < b.N; i++ {
        _ = l.ValueMethod()
    }
}

func BenchmarkLargeStructPointer(b *testing.B) {
    l := LargeStruct{}
    for i := 0; i < b.N; i++ {
        _ = l.PointerMethod()
    }
}
```

**Performance Recommendations:**

1. **Small structs (< 64 bytes)**: Little performance difference between value and pointer receivers
2. **Large structs**: Use pointer receivers to avoid copy overhead
3. **Frequently called methods**: Consider using pointer receivers
4. **Need to modify state**: Must use pointer receivers

### Avoid Unnecessary Memory Allocations

```go
// Avoid: creates a new string on every call
func (u User) GetFullNameBad() string {
    return fmt.Sprintf("%s %s", u.FirstName, u.LastName)
}

// Optimized: use strings.Builder
func (u User) GetFullName() string {
    var b strings.Builder
    b.WriteString(u.FirstName)
    b.WriteByte(' ')
    b.WriteString(u.LastName)
    return b.String()
}

// Better: pre-allocate capacity
func (u User) GetFullNameOptimized() string {
    var b strings.Builder
    b.Grow(len(u.FirstName) + 1 + len(u.LastName))
    b.WriteString(u.FirstName)
    b.WriteByte(' ')
    b.WriteString(u.LastName)
    return b.String()
}
```

## Real-World Scenarios

### Scenario 1: Database Models

```go
package main

import (
    "database/sql"
    "errors"
    "time"
)

type Model struct {
    ID        int64
    CreatedAt time.Time
    UpdatedAt time.Time
}

func (m *Model) BeforeCreate() {
    now := time.Now()
    m.CreatedAt = now
    m.UpdatedAt = now
}

func (m *Model) BeforeUpdate() {
    m.UpdatedAt = time.Now()
}

type User struct {
    Model
    Name     string
    Email    string
    Password string
    Active   bool
}

func (u *User) Validate() error {
    if u.Name == "" {
        return errors.New("name cannot be empty")
    }
    if u.Email == "" {
        return errors.New("email cannot be empty")
    }
    if len(u.Password) < 8 {
        return errors.New("password must be at least 8 characters")
    }
    return nil
}

func (u *User) Save(db *sql.DB) error {
    if err := u.Validate(); err != nil {
        return err
    }

    if u.ID == 0 {
        u.BeforeCreate()
        // INSERT operation
        result, err := db.Exec(
            "INSERT INTO users (name, email, password, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            u.Name, u.Email, u.Password, u.Active, u.CreatedAt, u.UpdatedAt,
        )
        if err != nil {
            return err
        }
        u.ID, _ = result.LastInsertId()
    } else {
        u.BeforeUpdate()
        // UPDATE operation
        _, err := db.Exec(
            "UPDATE users SET name=?, email=?, password=?, active=?, updated_at=? WHERE id=?",
            u.Name, u.Email, u.Password, u.Active, u.UpdatedAt, u.ID,
        )
        if err != nil {
            return err
        }
    }
    return nil
}

func (u *User) Delete(db *sql.DB) error {
    if u.ID == 0 {
        return errors.New("cannot delete unsaved user")
    }
    _, err := db.Exec("DELETE FROM users WHERE id=?", u.ID)
    return err
}
```

### Scenario 2: HTTP Handlers

```go
package main

import (
    "encoding/json"
    "net/http"
)

type APIHandler struct {
    userService *UserService
    logger      *Logger
}

func NewAPIHandler(us *UserService, l *Logger) *APIHandler {
    return &APIHandler{
        userService: us,
        logger:      l,
    }
}

func (h *APIHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    if id == "" {
        h.respondError(w, http.StatusBadRequest, "missing user ID")
        return
    }

    user, err := h.userService.GetByID(id)
    if err != nil {
        h.logger.Error("failed to get user: " + err.Error())
        h.respondError(w, http.StatusInternalServerError, "server error")
        return
    }

    if user == nil {
        h.respondError(w, http.StatusNotFound, "user not found")
        return
    }

    h.respondJSON(w, http.StatusOK, user)
}

func (h *APIHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        h.respondError(w, http.StatusBadRequest, "invalid request data")
        return
    }

    if err := h.userService.Create(&user); err != nil {
        h.logger.Error("failed to create user: " + err.Error())
        h.respondError(w, http.StatusInternalServerError, "creation failed")
        return
    }

    h.logger.Info("user created successfully: " + user.Name)
    h.respondJSON(w, http.StatusCreated, user)
}

func (h *APIHandler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func (h *APIHandler) respondError(w http.ResponseWriter, status int, message string) {
    h.respondJSON(w, status, map[string]string{"error": message})
}

// Register routes
func (h *APIHandler) RegisterRoutes(mux *http.ServeMux) {
    mux.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        case http.MethodGet:
            h.GetUser(w, r)
        case http.MethodPost:
            h.CreateUser(w, r)
        default:
            h.respondError(w, http.StatusMethodNotAllowed, "method not allowed")
        }
    })
}
```

### Scenario 3: State Machine

```go
package main

import (
    "errors"
    "fmt"
)

type OrderStatus string

const (
    StatusPending   OrderStatus = "pending"
    StatusPaid      OrderStatus = "paid"
    StatusShipped   OrderStatus = "shipped"
    StatusDelivered OrderStatus = "delivered"
    StatusCancelled OrderStatus = "cancelled"
)

type Order struct {
    ID     string
    Status OrderStatus
    Items  []string
    Total  float64
}

func NewOrder(id string, items []string, total float64) *Order {
    return &Order{
        ID:     id,
        Status: StatusPending,
        Items:  items,
        Total:  total,
    }
}

func (o *Order) Pay() error {
    if o.Status != StatusPending {
        return errors.New("only pending orders can be paid")
    }
    o.Status = StatusPaid
    return nil
}

func (o *Order) Ship() error {
    if o.Status != StatusPaid {
        return errors.New("only paid orders can be shipped")
    }
    o.Status = StatusShipped
    return nil
}

func (o *Order) Deliver() error {
    if o.Status != StatusShipped {
        return errors.New("only shipped orders can be delivered")
    }
    o.Status = StatusDelivered
    return nil
}

func (o *Order) Cancel() error {
    if o.Status == StatusShipped || o.Status == StatusDelivered {
        return errors.New("shipped or delivered orders cannot be cancelled")
    }
    if o.Status == StatusCancelled {
        return errors.New("order already cancelled")
    }
    o.Status = StatusCancelled
    return nil
}

func (o *Order) CanCancel() bool {
    return o.Status == StatusPending || o.Status == StatusPaid
}

func (o *Order) String() string {
    return fmt.Sprintf("Order[%s] Status: %s, Amount: $%.2f", o.ID, o.Status, o.Total)
}

func main() {
    order := NewOrder("ORD001", []string{"Product A", "Product B"}, 299.99)
    fmt.Println(order)

    // Normal flow
    order.Pay()
    fmt.Println(order)

    order.Ship()
    fmt.Println(order)

    // Try to cancel shipped order
    if err := order.Cancel(); err != nil {
        fmt.Println("Cancel failed:", err)
    }

    order.Deliver()
    fmt.Println(order)
}
```

## Interview Key Points

### What is the difference between value receivers and pointer receivers?

**Key Points:**
- Value receivers operate on a copy, pointer receivers operate on the original value
- Value receiver methods can be called by both values and pointers; pointer receiver methods can also be called by both (Go auto-converts)
- However, for interface implementation, type `T` only has value receiver methods in its method set, while `*T` has both value and pointer receiver methods

```go
type T struct{ value int }

func (t T) ValueMethod() {}   // Both T and *T can call
func (t *T) PointerMethod() {} // Both T and *T can call

// But T only implements interfaces with ValueMethod
// *T implements interfaces with both ValueMethod and PointerMethod
```

### When should you use pointer receivers?

**Key Points:**
1. Need to modify the receiver's state
2. Receiver is a large struct to avoid copy overhead
3. Consistency: if other methods of the type use pointer receivers
4. Receiver contains non-copyable fields like `sync.Mutex`

### What are the method set rules?

**Key Points:**
- Method set of `T` only includes value receiver methods
- Method set of `*T` includes both value receiver and pointer receiver methods
- This rule mainly affects interface implementation determination

### Can methods be called on nil pointers?

**Key Points:**
- Yes, if it's a pointer receiver method
- The method body needs to check if the receiver is nil
- This is a common pattern that can make code more concise

```go
func (l *List) Length() int {
    if l == nil {
        return 0
    }
    return 1 + l.Next.Length()
}
```

### How are embedded field methods promoted?

**Key Points:**
- Embedded field methods are promoted to the outer type
- If the outer type has a method with the same name, it shadows the embedded field's method
- Can still explicitly call through the embedded field name

```go
type Inner struct{}
func (i Inner) Method() string { return "Inner" }

type Outer struct{ Inner }
func (o Outer) Method() string { return "Outer" }

func main() {
    o := Outer{}
    fmt.Println(o.Method())       // Outer
    fmt.Println(o.Inner.Method()) // Inner
}
```

## Further Reading

### Official Documentation
- [A Tour of Go - Methods](https://tour.golang.org/methods/1)
- [Effective Go - Methods](https://golang.org/doc/effective_go#methods)
- [Go Language Specification - Method declarations](https://golang.org/ref/spec#Method_declarations)

### Classic Articles
- [Go Data Structures: Interfaces](https://research.swtch.com/interfaces) - Russ Cox
- [Methods in Go](https://dave.cheney.net/2016/03/19/should-methods-be-declared-on-t-or-t) - Dave Cheney
- [Receiver Type - Pointer vs Value](https://github.com/golang/go/wiki/CodeReviewComments#receiver-type)

### Recommended Books
- "The Go Programming Language" - Alan A. A. Donovan, Brian W. Kernighan
- "Go in Action" - William Kennedy
- "Advanced Go Programming" - Chai Shusong, Cao Chunhui

### Related Topics
- [Go Interfaces](/go/interfaces) - Method sets and interface implementation
- [Go Structs](/go/structs) - Relationship between structs and methods
- [Go Composition and Embedding](/go/composition) - Code reuse through embedding
