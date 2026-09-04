---
title: Go Generics
description: "Master Go 1.18+ generics: type parameters, constraints and best practices"
track: go
section: types-interfaces
difficulty: intermediate
tags:
  - Go
  - Generics
  - Type Parameters
  - Constraints
status: imported
origin: old/src/content/docs/go/generics.en.md
divergence: 0.368
issues:
  - divergent
legacy:
  category: Go
  subcategory: Generics
  order: 4
  lastUpdated: 2026-01-07
---

Generics, introduced in Go 1.18, allow you to write functions and types that can work with multiple types while maintaining type safety. This feature enables more reusable and flexible code without sacrificing Go's strong typing guarantees.

## Introduction to Generics

Before generics, Go developers had to choose between:
- Writing type-specific functions (code duplication)
- Using `interface{}` (losing type safety)
- Code generation (complexity)

Generics provide a better solution by allowing you to write code that works with multiple types in a type-safe manner.

## Generic Functions

Generic functions use type parameters to work with different types.

### Basic Syntax

```go
// Simple generic function
func Print[T any](value T) {
    fmt.Println(value)
}

// Usage
Print[int](42)        // Explicit type argument
Print[string]("hello") // Explicit type argument
Print(3.14)           // Type inference
```

### Multiple Type Parameters

```go
func Map[T any, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}

// Usage
numbers := []int{1, 2, 3, 4, 5}
strings := Map(numbers, func(n int) string {
    return fmt.Sprintf("Number: %d", n)
})
// strings: ["Number: 1", "Number: 2", ...]
```

### Practical Example: Min Function

```go
package main

import "fmt"

func Min[T comparable](a, b T) T {
    // Note: This won't compile because comparable doesn't support < operator
    // This is just for illustration
    // Use constraints.Ordered instead
    if a < b {
        return a
    }
    return b
}

// Correct implementation using constraints.Ordered
import "golang.org/x/exp/constraints"

func MinCorrect[T constraints.Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}

func main() {
    fmt.Println(MinCorrect(3, 5))       // 3
    fmt.Println(MinCorrect(3.14, 2.71)) // 2.71
    fmt.Println(MinCorrect("apple", "banana")) // "apple"
}
```

## Generic Types

You can define generic types like structs, interfaces, and custom types.

### Generic Struct

```go
// Generic stack implementation
type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
    if len(s.items) == 0 {
        var zero T
        return zero, false
    }

    item := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return item, true
}

func (s *Stack[T]) IsEmpty() bool {
    return len(s.items) == 0
}

// Usage
func main() {
    intStack := &Stack[int]{}
    intStack.Push(1)
    intStack.Push(2)

    val, ok := intStack.Pop()
    fmt.Println(val, ok) // 2 true

    stringStack := &Stack[string]{}
    stringStack.Push("hello")
    stringStack.Push("world")
}
```

### Generic Slice Type

```go
type Vector[T any] []T

func (v Vector[T]) Map(fn func(T) T) Vector[T] {
    result := make(Vector[T], len(v))
    for i, item := range v {
        result[i] = fn(item)
    }
    return result
}

func (v Vector[T]) Filter(predicate func(T) bool) Vector[T] {
    result := Vector[T]{}
    for _, item := range v {
        if predicate(item) {
            result = append(result, item)
        }
    }
    return result
}

// Usage
numbers := Vector[int]{1, 2, 3, 4, 5}
doubled := numbers.Map(func(n int) int { return n * 2 })
evens := numbers.Filter(func(n int) bool { return n%2 == 0 })
```

## Type Constraints

Type constraints specify what operations are allowed on type parameters.

### The `any` Constraint

`any` is an alias for `interface{}` and allows any type:

```go
func PrintValue[T any](value T) {
    fmt.Println(value) // Only operations available for all types
}
```

### The `comparable` Constraint

`comparable` allows types that support `==` and `!=`:

```go
func Contains[T comparable](slice []T, target T) bool {
    for _, item := range slice {
        if item == target {
            return true
        }
    }
    return false
}

// Usage
numbers := []int{1, 2, 3, 4, 5}
fmt.Println(Contains(numbers, 3)) // true

words := []string{"apple", "banana", "cherry"}
fmt.Println(Contains(words, "banana")) // true
```

### Built-in Constraint Interfaces

Go provides several useful constraints in the `constraints` package:

```go
import "golang.org/x/exp/constraints"

// Ordered: types that support <, <=, >, >=
func Max[T constraints.Ordered](a, b T) T {
    if a > b {
        return a
    }
    return b
}

// Integer: all integer types
func Sum[T constraints.Integer](numbers []T) T {
    var sum T
    for _, n := range numbers {
        sum += n
    }
    return sum
}

// Float: all float types
func Average[T constraints.Float](numbers []T) T {
    if len(numbers) == 0 {
        return 0
    }
    var sum T
    for _, n := range numbers {
        sum += n
    }
    return sum / T(len(numbers))
}

// Signed: all signed numeric types
func Abs[T constraints.Signed](n T) T {
    if n < 0 {
        return -n
    }
    return n
}
```

## Custom Constraints

You can define your own constraints using interfaces.

### Interface-based Constraints

```go
// Constraint requiring a String method
type Stringer interface {
    String() string
}

func PrintAll[T Stringer](items []T) {
    for _, item := range items {
        fmt.Println(item.String())
    }
}

// Custom type implementing Stringer
type Person struct {
    Name string
    Age  int
}

func (p Person) String() string {
    return fmt.Sprintf("%s (%d)", p.Name, p.Age)
}

// Usage
people := []Person{
    {"Alice", 30},
    {"Bob", 25},
}
PrintAll(people)
```

### Method Set Constraints

```go
type Number interface {
    int | int32 | int64 | float32 | float64
}

func Add[T Number](a, b T) T {
    return a + b
}

// More complex constraint
type Numeric interface {
    ~int | ~int32 | ~int64 | ~float32 | ~float64
}

// Custom type with underlying numeric type
type Meters float64

func Distance[T Numeric](a, b T) T {
    diff := a - b
    if diff < 0 {
        return -diff
    }
    return diff
}
```

### Combining Constraints

```go
// Constraint combining multiple interfaces
type ComparableStringer interface {
    comparable
    fmt.Stringer
}

func FindByString[T ComparableStringer](items []T, target T) (T, bool) {
    for _, item := range items {
        if item == target {
            return item, true
        }
    }
    var zero T
    return zero, false
}
```

## Type Sets

Type sets define which types satisfy a constraint.

### Union Types

```go
// Type set using union (|)
type Integer interface {
    int | int8 | int16 | int32 | int64
}

func SumIntegers[T Integer](numbers []T) T {
    var sum T
    for _, n := range numbers {
        sum += n
    }
    return sum
}
```

### Approximation Constraint (~)

The `~` operator includes all types with the same underlying type:

```go
// Without ~: only exact type matches
type ExactInt interface {
    int
}

// With ~: includes custom types with int underlying type
type ApproxInt interface {
    ~int
}

type CustomInt int

func ProcessExact[T ExactInt](n T) T {
    return n * 2
}

func ProcessApprox[T ApproxInt](n T) T {
    return n * 2
}

// Usage
var regularInt int = 5
var customInt CustomInt = 5

ProcessExact(regularInt)  // OK
// ProcessExact(customInt) // Error: CustomInt doesn't satisfy ExactInt

ProcessApprox(regularInt) // OK
ProcessApprox(customInt)  // OK
```

### Complex Type Sets

```go
type SignedInteger interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64
}

type UnsignedInteger interface {
    ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64
}

type AnyInteger interface {
    SignedInteger | UnsignedInteger
}

func CountBits[T AnyInteger](n T) int {
    count := 0
    for n > 0 {
        count++
        n >>= 1
    }
    return count
}
```

## Practical Examples

### Generic Data Structures

#### Generic Linked List

```go
type Node[T any] struct {
    Value T
    Next  *Node[T]
}

type LinkedList[T any] struct {
    head *Node[T]
    tail *Node[T]
    size int
}

func (l *LinkedList[T]) Append(value T) {
    node := &Node[T]{Value: value}

    if l.head == nil {
        l.head = node
        l.tail = node
    } else {
        l.tail.Next = node
        l.tail = node
    }
    l.size++
}

func (l *LinkedList[T]) ToSlice() []T {
    result := make([]T, 0, l.size)
    current := l.head
    for current != nil {
        result = append(result, current.Value)
        current = current.Next
    }
    return result
}

func (l *LinkedList[T]) Size() int {
    return l.size
}
```

#### Generic Binary Tree

```go
type TreeNode[T constraints.Ordered] struct {
    Value T
    Left  *TreeNode[T]
    Right *TreeNode[T]
}

type BinaryTree[T constraints.Ordered] struct {
    root *TreeNode[T]
}

func (t *BinaryTree[T]) Insert(value T) {
    t.root = insert(t.root, value)
}

func insert[T constraints.Ordered](node *TreeNode[T], value T) *TreeNode[T] {
    if node == nil {
        return &TreeNode[T]{Value: value}
    }

    if value < node.Value {
        node.Left = insert(node.Left, value)
    } else {
        node.Right = insert(node.Right, value)
    }

    return node
}

func (t *BinaryTree[T]) Contains(value T) bool {
    return contains(t.root, value)
}

func contains[T constraints.Ordered](node *TreeNode[T], value T) bool {
    if node == nil {
        return false
    }

    if value == node.Value {
        return true
    } else if value < node.Value {
        return contains(node.Left, value)
    } else {
        return contains(node.Right, value)
    }
}
```

### Generic Algorithms

#### Sorting

```go
import "golang.org/x/exp/constraints"

func BubbleSort[T constraints.Ordered](slice []T) {
    n := len(slice)
    for i := 0; i < n-1; i++ {
        for j := 0; j < n-i-1; j++ {
            if slice[j] > slice[j+1] {
                slice[j], slice[j+1] = slice[j+1], slice[j]
            }
        }
    }
}

// Generic sort with custom comparator
func Sort[T any](slice []T, less func(a, b T) bool) {
    n := len(slice)
    for i := 0; i < n-1; i++ {
        for j := 0; j < n-i-1; j++ {
            if !less(slice[j], slice[j+1]) {
                slice[j], slice[j+1] = slice[j+1], slice[j]
            }
        }
    }
}
```

#### Filtering and Mapping

```go
func Filter[T any](slice []T, predicate func(T) bool) []T {
    result := []T{}
    for _, item := range slice {
        if predicate(item) {
            result = append(result, item)
        }
    }
    return result
}

func Map[T, U any](slice []T, transform func(T) U) []U {
    result := make([]U, len(slice))
    for i, item := range slice {
        result[i] = transform(item)
    }
    return result
}

func Reduce[T, U any](slice []T, initial U, reducer func(U, T) U) U {
    result := initial
    for _, item := range slice {
        result = reducer(result, item)
    }
    return result
}

// Usage example
numbers := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

evens := Filter(numbers, func(n int) bool {
    return n%2 == 0
})

squared := Map(evens, func(n int) int {
    return n * n
})

sum := Reduce(squared, 0, func(acc, n int) int {
    return acc + n
})

fmt.Println(sum) // 220 (4 + 16 + 36 + 64 + 100)
```

### Generic Cache

```go
type Cache[K comparable, V any] struct {
    data map[K]V
    mu   sync.RWMutex
}

func NewCache[K comparable, V any]() *Cache[K, V] {
    return &Cache[K, V]{
        data: make(map[K]V),
    }
}

func (c *Cache[K, V]) Set(key K, value V) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = value
}

func (c *Cache[K, V]) Get(key K) (V, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    value, exists := c.data[key]
    return value, exists
}

func (c *Cache[K, V]) Delete(key K) {
    c.mu.Lock()
    defer c.mu.Unlock()
    delete(c.data, key)
}

func (c *Cache[K, V]) Clear() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data = make(map[K]V)
}

// Usage
userCache := NewCache[int, string]()
userCache.Set(1, "Alice")
userCache.Set(2, "Bob")

name, exists := userCache.Get(1)
if exists {
    fmt.Println(name) // "Alice"
}
```

### Generic Result Type

```go
type Result[T any] struct {
    value T
    err   error
}

func Ok[T any](value T) Result[T] {
    return Result[T]{value: value}
}

func Err[T any](err error) Result[T] {
    return Result[T]{err: err}
}

func (r Result[T]) IsOk() bool {
    return r.err == nil
}

func (r Result[T]) IsErr() bool {
    return r.err != nil
}

func (r Result[T]) Unwrap() (T, error) {
    return r.value, r.err
}

func (r Result[T]) UnwrapOr(defaultValue T) T {
    if r.IsErr() {
        return defaultValue
    }
    return r.value
}

func (r Result[T]) Map(fn func(T) T) Result[T] {
    if r.IsErr() {
        return r
    }
    return Ok(fn(r.value))
}

// Usage
func Divide(a, b float64) Result[float64] {
    if b == 0 {
        return Err[float64](fmt.Errorf("division by zero"))
    }
    return Ok(a / b)
}

result := Divide(10, 2)
if result.IsOk() {
    value, _ := result.Unwrap()
    fmt.Println(value) // 5
}

result2 := Divide(10, 0)
fmt.Println(result2.UnwrapOr(0)) // 0
```

## Best Practices

### Use Generics When Appropriate

```go
// Good: Generic function for common operations
func Keys[K comparable, V any](m map[K]V) []K {
    keys := make([]K, 0, len(m))
    for k := range m {
        keys = append(keys, k)
    }
    return keys
}

// Bad: Over-engineering simple cases
// Don't use generics for single-use, type-specific logic
```

### Choose Appropriate Constraints

```go
// Too restrictive: only works with int
func Sum[T int](numbers []T) T {
    var sum T
    for _, n := range numbers {
        sum += n
    }
    return sum
}

// Better: works with all numeric types
import "golang.org/x/exp/constraints"

func SumBetter[T constraints.Integer | constraints.Float](numbers []T) T {
    var sum T
    for _, n := range numbers {
        sum += n
    }
    return sum
}
```

### Leverage Type Inference

```go
// Explicit type arguments (verbose)
result := Map[int, string](numbers, toString)

// Type inference (cleaner)
result := Map(numbers, toString)
```

### Avoid Generic Overuse

```go
// Bad: Unnecessary generic
func AddOne[T int](n T) T {
    return n + 1
}

// Good: Simple function
func AddOne(n int) int {
    return n + 1
}
```

### Document Generic Functions

```go
// Transform applies a transformation function to each element in the slice.
// It returns a new slice containing the transformed values.
//
// Type Parameters:
//   T - the type of elements in the input slice
//   U - the type of elements in the output slice
//
// Example:
//   numbers := []int{1, 2, 3}
//   strings := Transform(numbers, strconv.Itoa)
func Transform[T any, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}
```

## Common Patterns

### Optional/Nullable Type

```go
type Optional[T any] struct {
    value   T
    present bool
}

func Some[T any](value T) Optional[T] {
    return Optional[T]{value: value, present: true}
}

func None[T any]() Optional[T] {
    return Optional[T]{present: false}
}

func (o Optional[T]) IsPresent() bool {
    return o.present
}

func (o Optional[T]) Get() (T, bool) {
    return o.value, o.present
}

func (o Optional[T]) OrElse(defaultValue T) T {
    if o.present {
        return o.value
    }
    return defaultValue
}

func (o Optional[T]) Map(fn func(T) T) Optional[T] {
    if !o.present {
        return o
    }
    return Some(fn(o.value))
}

// Usage
func FindUser(id int) Optional[string] {
    if id == 1 {
        return Some("Alice")
    }
    return None[string]()
}

user := FindUser(1)
name := user.OrElse("Unknown")
```

### Pair/Tuple Type

```go
type Pair[T, U any] struct {
    First  T
    Second U
}

func NewPair[T, U any](first T, second U) Pair[T, U] {
    return Pair[T, U]{First: first, Second: second}
}

func (p Pair[T, U]) Swap() Pair[U, T] {
    return Pair[U, T]{First: p.Second, Second: p.First}
}

// Usage
coordinates := NewPair(10, 20)
fmt.Printf("X: %d, Y: %d\n", coordinates.First, coordinates.Second)

nameAge := NewPair("Alice", 30)
```

### Either Type

```go
type Either[L, R any] struct {
    left    L
    right   R
    isRight bool
}

func Left[L, R any](value L) Either[L, R] {
    return Either[L, R]{left: value, isRight: false}
}

func Right[L, R any](value R) Either[L, R] {
    return Either[L, R]{right: value, isRight: true}
}

func (e Either[L, R]) IsLeft() bool {
    return !e.isRight
}

func (e Either[L, R]) IsRight() bool {
    return e.isRight
}

func (e Either[L, R]) GetLeft() (L, bool) {
    return e.left, !e.isRight
}

func (e Either[L, R]) GetRight() (R, bool) {
    return e.right, e.isRight
}

// Usage: representing success or error
func ParseInt(s string) Either[error, int] {
    val, err := strconv.Atoi(s)
    if err != nil {
        return Left[error, int](err)
    }
    return Right[error, int](val)
}
```

## Limitations and Considerations

### No Type Parameter Methods

```go
// Not allowed: methods cannot have their own type parameters
type Container[T any] struct {
    value T
}

// This is NOT valid Go
// func (c Container[T]) Transform[U any](fn func(T) U) Container[U] {
//     return Container[U]{value: fn(c.value)}
// }

// Workaround: use a standalone function
func Transform[T, U any](c Container[T], fn func(T) U) Container[U] {
    return Container[U]{value: fn(c.value)}
}
```

### No Operator Constraints

```go
// You cannot constrain operators directly
// This is a limitation of the current implementation

// Workaround: use existing constraints or define methods
type Addable interface {
    Add(other Addable) Addable
}
```

### Performance Considerations

Generics in Go are implemented using a combination of:
- **Stenciling**: Creating specialized versions for different types
- **GC Shape**: Grouping similar types together

This means:
- No runtime type assertions (like `interface{}`)
- Potential code bloat for many type instantiations
- Generally good performance

### Complexity Trade-offs

```go
// Simple, clear, but specific
func MaxInt(a, b int) int {
    if a > b {
        return a
    }
    return b
}

// Generic, flexible, but more complex
func Max[T constraints.Ordered](a, b T) T {
    if a > b {
        return a
    }
    return b
}

// Use generics when the flexibility is worth the complexity
```

## Conclusion

Go generics provide a powerful tool for writing reusable, type-safe code. Key takeaways:

- **Use type parameters** to write functions and types that work with multiple types
- **Apply constraints** to specify what operations are allowed on generic types
- **Leverage built-in constraints** like `any`, `comparable`, and those from `constraints` package
- **Define custom constraints** using interfaces and type sets
- **Follow best practices** to avoid over-engineering and maintain code clarity

Generics are most valuable for:
- Data structures (stacks, queues, trees, caches)
- Collection operations (map, filter, reduce)
- Utility functions (min, max, contains)
- Generic algorithms

Use them judiciously, and your Go code will be more flexible and maintainable without sacrificing type safety or performance.
