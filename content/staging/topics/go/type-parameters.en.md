---
title: Go Type Parameters and Generics
description: "Deep dive into Go generic type parameters: constraint definitions, type sets, any/comparable constraints, generic data structures design, and practical applications"
track: go
section: types-interfaces
difficulty: intermediate
tags:
  - Go
  - generics
  - type parameters
  - constraints
  - type sets
  - comparable
  - any
status: imported
origin: old/src/content/docs/go/type-parameters.en.md
divergence: 0.133
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Go
  subcategory: ""
  order: 5
  lastUpdated: 2026-01-07
---

## Concept Explanation

Type Parameters are the core mechanism of Go 1.18's generics feature, allowing functions and types to use placeholder types during definition, which are substituted with concrete types during usage. This capability fundamentally transforms how Go code is reused, enabling developers to write type-safe, highly reusable generic code.

### Historical Background

When Go was first designed, its creators intentionally omitted generics for several reasons:

1. **Language Simplicity**: Avoiding complex type systems
2. **Fast Compilation**: Generics could impact compilation speed
3. **Code Readability**: Concerns about generics abuse leading to obscure code

However, as the Go community grew, the demand for generics became increasingly strong:

- **Code Duplication**: Same logic needs to be written multiple times for different types
- **Type Safety**: Using `interface{}` loses compile-time type checking
- **Standard Library Limitations**: Packages like sort and container lack elegant APIs

After years of discussion and design, the Go team officially introduced generics through type parameters in Go 1.18, released in 2022.

### Problems Solved

```go
// Problem One: Code Duplication
// Without generics, the same logic must be written for each type
func MaxInt(a, b int) int {
    if a > b {
        return a
    }
    return b
}

func MaxFloat64(a, b float64) float64 {
    if a > b {
        return a
    }
    return b
}

func MaxString(a, b string) string {
    if a > b {
        return a
    }
    return b
}

// Problem Two: Type Unsafety
// Using interface{} loses type information
func MaxAny(a, b interface{}) interface{} {
    // Might panic at runtime, compiler cannot check
    switch av := a.(type) {
    case int:
        if av > b.(int) {
            return a
        }
        return b
    // ... Need to handle all types
    default:
        panic("unsupported type")
    }
}

// Solution: Type Parameters
// Write once, use everywhere, type-safe
func Max[T cmp.Ordered](a, b T) T {
    if a > b {
        return a
    }
    return b
}
```

## Core Principles

### How Type Parameters Work

Go generics employ a **Partial Monomorphization** strategy, combined with **GCShape stenciling** technique:

```
Source Code                    Compilation                     Runtime
+---------------+        +---------------+        +---------------+
| func Max[T]   |   =>   | Type checking      |   =>   | Shared code      |
| (a, b T) T    |        | Constraint validation      |        | for same    |
+---------------+        | Code generation      |        | GCShape      |
                         +---------------+        +---------------+
```

#### GCShape Concept

GCShape (Garbage Collection Shape) is a concept used by the Go compiler to group types:

```go
// Types with the same GCShape share code
// GCShape is determined by:
// 1. Type size
// 2. Pointer layout
// 3. Memory alignment requirements

// These types might share GCShape (both are pointers)
type A struct{ x *int }
type B struct{ y *string }

// These types might share GCShape (both are 8-byte integers)
type Int64Alias int64
type MyInt int64
```

### Type Parameter Syntax Structure

```go
// Complete type parameter syntax
func FunctionName[TypeParam1 Constraint1, TypeParam2 Constraint2](params) returns {
    // Function body
}

type TypeName[TypeParam1 Constraint1, TypeParam2 Constraint2] struct {
    // Type definition
}

// Syntax elements explanation:
// [...]       - Type parameter list, using square brackets
// TypeParam   - Type parameter name, usually uppercase letters
// Constraint  - Type constraint, limiting acceptable types
```

### Type Inference Mechanism

The Go compiler can automatically infer type parameters from function arguments:

```go
func Print[T any](value T) {
    fmt.Printf("%v\n", value)
}

func main() {
    // Explicit type parameter specification
    Print[int](42)
    Print[string]("hello")

    // Type inference (recommended)
    Print(42)       // T inferred as int
    Print("hello")  // T inferred as string
    Print(3.14)     // T inferred as float64

    // Complex inference
    pairs := map[string]int{"a": 1}
    Keys(pairs)     // K inferred as string, V inferred as int
}

func Keys[K comparable, V any](m map[K]V) []K {
    keys := make([]K, 0, len(m))
    for k := range m {
        keys = append(keys, k)
    }
    return keys
}
```

### Implementation of Constraints

Constraints are essentially interfaces, but Go 1.18 extends interface semantics:

```go
// Traditional interface: defines method set
type Stringer interface {
    String() string
}

// Extended interface: defines type set
type Integer interface {
    int | int8 | int16 | int32 | int64
}

// Combined interface: method set + type set
type StringableInt interface {
    ~int | ~int64
    String() string
}
```

## Key Points

### Predefined Constraints

#### any Constraint

`any` is an alias for `interface{}`, representing any type:

```go
// Definition of any (in builtin package)
type any = interface{}

// Using any constraint
func Identity[T any](value T) T {
    return value
}

// Applicable when no type-specific operations are needed
func Ptr[T any](v T) *T {
    return &v
}

func Zero[T any]() T {
    var zero T
    return zero
}
```

#### comparable Constraint

`comparable` represents types that can be compared using `==` and `!=`:

```go
// comparable is a built-in constraint
// Includes: numeric types, strings, pointers, channels, interfaces,
//           structs and arrays containing only comparable fields

func Contains[T comparable](slice []T, target T) bool {
    for _, v := range slice {
        if v == target {
            return true
        }
    }
    return false
}

func Index[T comparable](slice []T, target T) int {
    for i, v := range slice {
        if v == target {
            return i
        }
    }
    return -1
}

// Usage example
func main() {
    nums := []int{1, 2, 3, 4, 5}
    fmt.Println(Contains(nums, 3))  // true
    fmt.Println(Index(nums, 4))     // 3

    // Note: slices, maps, functions are not comparable
    // slices := [][]int{{1}, {2}}
    // Contains(slices, []int{1})  // Compilation error
}
```

### Custom Constraints

#### Type Union Constraints

Using `|` to define type unions:

```go
// Numeric types constraint
type Numeric interface {
    int | int8 | int16 | int32 | int64 |
    uint | uint8 | uint16 | uint32 | uint64 | uintptr |
    float32 | float64
}

// Signed integer constraint
type Signed interface {
    int | int8 | int16 | int32 | int64
}

// Unsigned integer constraint
type Unsigned interface {
    uint | uint8 | uint16 | uint32 | uint64 | uintptr
}

// Floating point constraint
type Float interface {
    float32 | float64
}

// Complex number constraint
type Complex interface {
    complex64 | complex128
}
```

#### Underlying Type Constraint (~)

The `~` operator represents all types with the same underlying type:

```go
// Without ~: accepts only the exact int type
type ExactInt interface {
    int
}

// With ~: accepts all types with underlying type int
type ApproxInt interface {
    ~int
}

// Custom types
type UserID int
type Age int
type Score int

func ProcessExact[T ExactInt](v T) T { return v }
func ProcessApprox[T ApproxInt](v T) T { return v }

func main() {
    var id UserID = 100
    var age Age = 25

    // ProcessExact(id)   // Compilation error: UserID is not int
    ProcessApprox(id)     // Correct: UserID's underlying type is int
    ProcessApprox(age)    // Correct: Age's underlying type is int
}
```

#### Method Constraints

Requiring types to implement specific methods:

```go
// Requires String() method
type Stringer interface {
    String() string
}

// Requires Compare method
type Comparable[T any] interface {
    Compare(T) int
}

// Combined method constraint
type StringerComparable[T any] interface {
    Stringer
    Comparable[T]
}

func PrintSorted[T StringerComparable[T]](items []T) {
    // Can call String() and Compare()
    sort.Slice(items, func(i, j int) bool {
        return items[i].Compare(items[j]) < 0
    })
    for _, item := range items {
        fmt.Println(item.String())
    }
}
```

### Type Sets

Go 1.18 redefines interface semantics, with each interface defining a type set:

```go
// Type set concept
// Type set of interface I = set of all types satisfying I's requirements

// Type set of empty interface = all types
type Any interface{}  // Equivalent to any

// Type set of method interface = all types implementing the method
type Reader interface {
    Read([]byte) (int, error)
}

// Type set of type union = all types in the union
type IntOrString interface {
    int | string
}

// Type set of combined interface = intersection of component type sets
type SignedInteger interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64
}
```

#### Type Set Operations

```go
// Intersection: type must satisfy multiple constraints
type OrderedStringer interface {
    ~int | ~string  // Must be int or string
    String() string // Must have String method
}
// Type set = (~int ∪ ~string) ∩ {types with String() method}

// Implementation example
type MyInt int

func (m MyInt) String() string {
    return fmt.Sprintf("MyInt(%d)", m)
}

func Display[T OrderedStringer](v T) {
    fmt.Println(v.String())
}

func main() {
    var mi MyInt = 42
    Display(mi)  // 正确：MyInt 满足两个条件

    // Display(42)  // Error: int has no String() method
}
```

### cmp and slices Package Constraints

Standard library constraints introduced in Go 1.21:

```go
import (
    "cmp"
    "slices"
)

// cmp.Ordered - types that can be ordered
// Includes all integer, floating point, and string types
func SortSlice[T cmp.Ordered](s []T) {
    slices.Sort(s)
}

// Using cmp.Compare for comparison
func Min[T cmp.Ordered](a, b T) T {
    if cmp.Compare(a, b) < 0 {
        return a
    }
    return b
}

// Using slices package generic functions
func main() {
    nums := []int{3, 1, 4, 1, 5, 9, 2, 6}
    slices.Sort(nums)
    fmt.Println(nums)  // [1 1 2 3 4 5 6 9]

    // Search
    idx, found := slices.BinarySearch(nums, 4)
    fmt.Println(idx, found)  // 4 true

    // Min/Max
    fmt.Println(slices.Min(nums))  // 1
    fmt.Println(slices.Max(nums))  // 9
}
```

## Code Examples

### Basic Generic Functions

```go
package main

import (
    "cmp"
    "fmt"
)

// Swap two values
func Swap[T any](a, b *T) {
    *a, *b = *b, *a
}

// Return pointer
func Ptr[T any](v T) *T {
    return &v
}

// Get zero value
func Zero[T any]() T {
    var zero T
    return zero
}

// Conditional selection
func If[T any](cond bool, trueVal, falseVal T) T {
    if cond {
        return trueVal
    }
    return falseVal
}

// Range limiting
func Clamp[T cmp.Ordered](value, min, max T) T {
    if value < min {
        return min
    }
    if value > max {
        return max
    }
    return value
}

func main() {
    // Swap example
    x, y := 10, 20
    Swap(&x, &y)
    fmt.Println(x, y)  // 20 10

    // Ptr example
    p := Ptr(42)
    fmt.Println(*p)  // 42

    // Zero example
    fmt.Println(Zero[int]())     // 0
    fmt.Println(Zero[string]())  // ""
    fmt.Println(Zero[bool]())    // false

    // If example
    result := If(10 > 5, "yes", "no")
    fmt.Println(result)  // yes

    // Clamp example
    fmt.Println(Clamp(15, 0, 10))   // 10
    fmt.Println(Clamp(-5, 0, 10))   // 0
    fmt.Println(Clamp(5, 0, 10))    // 5
}
```

### Generic Slice Operations

```go
package main

import "fmt"

// Map applies a function to each element in a slice
func Map[T, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}

// Filter filters a slice
func Filter[T any](slice []T, predicate func(T) bool) []T {
    result := make([]T, 0)
    for _, v := range slice {
        if predicate(v) {
            result = append(result, v)
        }
    }
    return result
}

// Reduce reduces a slice
func Reduce[T, U any](slice []T, initial U, fn func(U, T) U) U {
    result := initial
    for _, v := range slice {
        result = fn(result, v)
    }
    return result
}

// Find finds the first element matching the predicate
func Find[T any](slice []T, predicate func(T) bool) (T, bool) {
    for _, v := range slice {
        if predicate(v) {
            return v, true
        }
    }
    var zero T
    return zero, false
}

// All checks if all elements satisfy the predicate
func All[T any](slice []T, predicate func(T) bool) bool {
    for _, v := range slice {
        if !predicate(v) {
            return false
        }
    }
    return true
}

// Any checks if any element satisfies the predicate
func Any[T any](slice []T, predicate func(T) bool) bool {
    for _, v := range slice {
        if predicate(v) {
            return true
        }
    }
    return false
}

// GroupBy groups elements by key
func GroupBy[T any, K comparable](slice []T, keyFn func(T) K) map[K][]T {
    result := make(map[K][]T)
    for _, v := range slice {
        key := keyFn(v)
        result[key] = append(result[key], v)
    }
    return result
}

// Chunk divides a slice into chunks
func Chunk[T any](slice []T, size int) [][]T {
    if size <= 0 {
        return nil
    }

    var chunks [][]T
    for i := 0; i < len(slice); i += size {
        end := i + size
        if end > len(slice) {
            end = len(slice)
        }
        chunks = append(chunks, slice[i:end])
    }
    return chunks
}

// Unique removes duplicates (maintains order)
func Unique[T comparable](slice []T) []T {
    seen := make(map[T]bool)
    result := make([]T, 0)
    for _, v := range slice {
        if !seen[v] {
            seen[v] = true
            result = append(result, v)
        }
    }
    return result
}

func main() {
    numbers := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

    // Map: square numbers
    squares := Map(numbers, func(n int) int { return n * n })
    fmt.Println("Squares:", squares)
    // [1 4 9 16 25 36 49 64 81 100]

    // Filter: even numbers
    evens := Filter(numbers, func(n int) bool { return n%2 == 0 })
    fmt.Println("Evens:", evens)
    // [2 4 6 8 10]

    // Reduce: sum
    sum := Reduce(numbers, 0, func(acc, n int) int { return acc + n })
    fmt.Println("Sum:", sum)
    // 55

    // Find: first number greater than 5
    first, found := Find(numbers, func(n int) bool { return n > 5 })
    fmt.Println("First > 5:", first, found)
    // 6 true

    // GroupBy: group by age
    type Person struct {
        Name string
        Age  int
    }
    people := []Person{
        {"Alice", 25}, {"Bob", 30}, {"Charlie", 25}, {"David", 30},
    }
    byAge := GroupBy(people, func(p Person) int { return p.Age })
    fmt.Println("By Age:", byAge)

    // Chunk: divide into chunks
    chunks := Chunk(numbers, 3)
    fmt.Println("Chunks:", chunks)
    // [[1 2 3] [4 5 6] [7 8 9] [10]]

    // Unique: remove duplicates
    dups := []int{1, 2, 2, 3, 3, 3, 4, 4, 4, 4}
    unique := Unique(dups)
    fmt.Println("Unique:", unique)
    // [1 2 3 4]
}
```

### Generic Data Structures

#### Generic Stack

```go
package main

import (
    "errors"
    "fmt"
)

// Stack generic stack implementation
type Stack[T any] struct {
    items []T
}

// NewStack creates a new stack
func NewStack[T any](capacity int) *Stack[T] {
    return &Stack[T]{
        items: make([]T, 0, capacity),
    }
}

// Push pushes an item onto the stack
func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

// Pop pops an item from the stack
func (s *Stack[T]) Pop() (T, error) {
    if len(s.items) == 0 {
        var zero T
        return zero, errors.New("stack is empty")
    }

    index := len(s.items) - 1
    item := s.items[index]
    s.items = s.items[:index]
    return item, nil
}

// Peek peeks at the top element
func (s *Stack[T]) Peek() (T, error) {
    if len(s.items) == 0 {
        var zero T
        return zero, errors.New("stack is empty")
    }
    return s.items[len(s.items)-1], nil
}

// IsEmpty checks if the stack is empty
func (s *Stack[T]) IsEmpty() bool {
    return len(s.items) == 0
}

// Size returns the stack size
func (s *Stack[T]) Size() int {
    return len(s.items)
}

// Clear clears the stack
func (s *Stack[T]) Clear() {
    s.items = s.items[:0]
}

func main() {
    // Integer stack
    intStack := NewStack[int](10)
    intStack.Push(1)
    intStack.Push(2)
    intStack.Push(3)

    for !intStack.IsEmpty() {
        val, _ := intStack.Pop()
        fmt.Println(val)  // 3, 2, 1
    }

    // String stack
    strStack := NewStack[string](10)
    strStack.Push("hello")
    strStack.Push("world")

    top, _ := strStack.Peek()
    fmt.Println("Top:", top)  // world
}
```

#### Generic Queue

```go
package main

import (
    "errors"
    "fmt"
)

// Queue generic queue implementation
type Queue[T any] struct {
    items []T
}

// NewQueue creates a new queue
func NewQueue[T any](capacity int) *Queue[T] {
    return &Queue[T]{
        items: make([]T, 0, capacity),
    }
}

// Enqueue enqueues an item
func (q *Queue[T]) Enqueue(item T) {
    q.items = append(q.items, item)
}

// Dequeue dequeues an item
func (q *Queue[T]) Dequeue() (T, error) {
    if len(q.items) == 0 {
        var zero T
        return zero, errors.New("queue is empty")
    }

    item := q.items[0]
    q.items = q.items[1:]
    return item, nil
}

// Front peeks at the front element
func (q *Queue[T]) Front() (T, error) {
    if len(q.items) == 0 {
        var zero T
        return zero, errors.New("queue is empty")
    }
    return q.items[0], nil
}

// IsEmpty checks if the queue is empty
func (q *Queue[T]) IsEmpty() bool {
    return len(q.items) == 0
}

// Size returns the queue size
func (q *Queue[T]) Size() int {
    return len(q.items)
}

func main() {
    queue := NewQueue[int](10)
    queue.Enqueue(1)
    queue.Enqueue(2)
    queue.Enqueue(3)

    for !queue.IsEmpty() {
        val, _ := queue.Dequeue()
        fmt.Println(val)  // 1, 2, 3
    }
}
```

#### Generic Linked List

```go
package main

import "fmt"

// Node linked list node
type Node[T any] struct {
    Value T
    Next  *Node[T]
    Prev  *Node[T]
}

// LinkedList doubly linked list
type LinkedList[T any] struct {
    head *Node[T]
    tail *Node[T]
    size int
}

// NewLinkedList creates a new linked list
func NewLinkedList[T any]() *LinkedList[T] {
    return &LinkedList[T]{}
}

// PushFront adds an element at the front
func (l *LinkedList[T]) PushFront(value T) {
    node := &Node[T]{Value: value}

    if l.head == nil {
        l.head = node
        l.tail = node
    } else {
        node.Next = l.head
        l.head.Prev = node
        l.head = node
    }
    l.size++
}

// PushBack adds an element at the back
func (l *LinkedList[T]) PushBack(value T) {
    node := &Node[T]{Value: value}

    if l.tail == nil {
        l.head = node
        l.tail = node
    } else {
        node.Prev = l.tail
        l.tail.Next = node
        l.tail = node
    }
    l.size++
}

// PopFront removes an element from the front
func (l *LinkedList[T]) PopFront() (T, bool) {
    if l.head == nil {
        var zero T
        return zero, false
    }

    value := l.head.Value
    l.head = l.head.Next

    if l.head == nil {
        l.tail = nil
    } else {
        l.head.Prev = nil
    }

    l.size--
    return value, true
}

// PopBack removes an element from the back
func (l *LinkedList[T]) PopBack() (T, bool) {
    if l.tail == nil {
        var zero T
        return zero, false
    }

    value := l.tail.Value
    l.tail = l.tail.Prev

    if l.tail == nil {
        l.head = nil
    } else {
        l.tail.Next = nil
    }

    l.size--
    return value, true
}

// ForEach iterates over the list
func (l *LinkedList[T]) ForEach(fn func(T)) {
    current := l.head
    for current != nil {
        fn(current.Value)
        current = current.Next
    }
}

// ToSlice converts to slice
func (l *LinkedList[T]) ToSlice() []T {
    result := make([]T, 0, l.size)
    l.ForEach(func(v T) {
        result = append(result, v)
    })
    return result
}

// Size returns the list size
func (l *LinkedList[T]) Size() int {
    return l.size
}

func main() {
    list := NewLinkedList[int]()

    list.PushBack(1)
    list.PushBack(2)
    list.PushBack(3)
    list.PushFront(0)

    fmt.Println("List:", list.ToSlice())  // [0 1 2 3]

    if val, ok := list.PopFront(); ok {
        fmt.Println("PopFront:", val)  // 0
    }

    if val, ok := list.PopBack(); ok {
        fmt.Println("PopBack:", val)  // 3
    }

    fmt.Println("Final:", list.ToSlice())  // [1 2]
}
```

#### Generic Set

```go
package main

import "fmt"

// Set generic set
type Set[T comparable] struct {
    items map[T]struct{}
}

// NewSet creates a new set
func NewSet[T comparable](values ...T) *Set[T] {
    s := &Set[T]{
        items: make(map[T]struct{}),
    }
    for _, v := range values {
        s.Add(v)
    }
    return s
}

// Add adds an element
func (s *Set[T]) Add(value T) {
    s.items[value] = struct{}{}
}

// Remove removes an element
func (s *Set[T]) Remove(value T) {
    delete(s.items, value)
}

// Contains checks if the tree contains an element
func (s *Set[T]) Contains(value T) bool {
    _, ok := s.items[value]
    return ok
}

// Size returns the set size
func (s *Set[T]) Size() int {
    return len(s.items)
}

// ToSlice converts to slice
func (s *Set[T]) ToSlice() []T {
    result := make([]T, 0, len(s.items))
    for k := range s.items {
        result = append(result, k)
    }
    return result
}

// Union returns the union
func (s *Set[T]) Union(other *Set[T]) *Set[T] {
    result := NewSet[T]()
    for k := range s.items {
        result.Add(k)
    }
    for k := range other.items {
        result.Add(k)
    }
    return result
}

// Intersection returns the intersection
func (s *Set[T]) Intersection(other *Set[T]) *Set[T] {
    result := NewSet[T]()
    for k := range s.items {
        if other.Contains(k) {
            result.Add(k)
        }
    }
    return result
}

// Difference returns the difference
func (s *Set[T]) Difference(other *Set[T]) *Set[T] {
    result := NewSet[T]()
    for k := range s.items {
        if !other.Contains(k) {
            result.Add(k)
        }
    }
    return result
}

func main() {
    set1 := NewSet(1, 2, 3, 4, 5)
    set2 := NewSet(4, 5, 6, 7, 8)

    fmt.Println("Set1:", set1.ToSlice())
    fmt.Println("Set2:", set2.ToSlice())

    union := set1.Union(set2)
    fmt.Println("Union:", union.ToSlice())

    intersection := set1.Intersection(set2)
    fmt.Println("Intersection:", intersection.ToSlice())

    difference := set1.Difference(set2)
    fmt.Println("Difference:", difference.ToSlice())
}
```

#### Generic Binary Search Tree

```go
package main

import (
    "cmp"
    "fmt"
)

// TreeNode tree node
type TreeNode[T cmp.Ordered] struct {
    Value T
    Left  *TreeNode[T]
    Right *TreeNode[T]
}

// BST binary search tree
type BST[T cmp.Ordered] struct {
    root *TreeNode[T]
    size int
}

// NewBST creates a new binary search tree
func NewBST[T cmp.Ordered]() *BST[T] {
    return &BST[T]{}
}

// Insert inserts an element
func (t *BST[T]) Insert(value T) {
    t.root = t.insert(t.root, value)
    t.size++
}

func (t *BST[T]) insert(node *TreeNode[T], value T) *TreeNode[T] {
    if node == nil {
        return &TreeNode[T]{Value: value}
    }

    if value < node.Value {
        node.Left = t.insert(node.Left, value)
    } else if value > node.Value {
        node.Right = t.insert(node.Right, value)
    }

    return node
}

// Contains checks if the tree contains an element
func (t *BST[T]) Contains(value T) bool {
    return t.contains(t.root, value)
}

func (t *BST[T]) contains(node *TreeNode[T], value T) bool {
    if node == nil {
        return false
    }

    if value == node.Value {
        return true
    } else if value < node.Value {
        return t.contains(node.Left, value)
    } else {
        return t.contains(node.Right, value)
    }
}

// InOrder in-order traversal
func (t *BST[T]) InOrder() []T {
    result := make([]T, 0, t.size)
    t.inOrder(t.root, &result)
    return result
}

func (t *BST[T]) inOrder(node *TreeNode[T], result *[]T) {
    if node == nil {
        return
    }
    t.inOrder(node.Left, result)
    *result = append(*result, node.Value)
    t.inOrder(node.Right, result)
}

// Min returns the minimum value
func (t *BST[T]) Min() (T, bool) {
    if t.root == nil {
        var zero T
        return zero, false
    }

    node := t.root
    for node.Left != nil {
        node = node.Left
    }
    return node.Value, true
}

// Max returns the maximum value
func (t *BST[T]) Max() (T, bool) {
    if t.root == nil {
        var zero T
        return zero, false
    }

    node := t.root
    for node.Right != nil {
        node = node.Right
    }
    return node.Value, true
}

func main() {
    tree := NewBST[int]()

    values := []int{5, 3, 7, 1, 4, 6, 8}
    for _, v := range values {
        tree.Insert(v)
    }

    fmt.Println("InOrder:", tree.InOrder())  // [1 3 4 5 6 7 8]

    fmt.Println("Contains 4:", tree.Contains(4))  // true
    fmt.Println("Contains 9:", tree.Contains(9))  // false

    if min, ok := tree.Min(); ok {
        fmt.Println("Min:", min)  // 1
    }

    if max, ok := tree.Max(); ok {
        fmt.Println("Max:", max)  // 8
    }
}
```

### Generic Thread-Safe Container

```go
package main

import (
    "fmt"
    "sync"
)

// SafeMap thread-safe generic Map
type SafeMap[K comparable, V any] struct {
    mu sync.RWMutex
    m  map[K]V
}

// NewSafeMap creates a new thread-safe Map
func NewSafeMap[K comparable, V any]() *SafeMap[K, V] {
    return &SafeMap[K, V]{
        m: make(map[K]V),
    }
}

// Set sets a key-value pair
func (sm *SafeMap[K, V]) Set(key K, value V) {
    sm.mu.Lock()
    defer sm.mu.Unlock()
    sm.m[key] = value
}

// Get retrieves a value
func (sm *SafeMap[K, V]) Get(key K) (V, bool) {
    sm.mu.RLock()
    defer sm.mu.RUnlock()
    val, ok := sm.m[key]
    return val, ok
}

// Delete deletes a key
func (sm *SafeMap[K, V]) Delete(key K) {
    sm.mu.Lock()
    defer sm.mu.Unlock()
    delete(sm.m, key)
}

// GetOrSet gets or sets a value
func (sm *SafeMap[K, V]) GetOrSet(key K, defaultValue V) V {
    sm.mu.Lock()
    defer sm.mu.Unlock()

    if val, ok := sm.m[key]; ok {
        return val
    }
    sm.m[key] = defaultValue
    return defaultValue
}

// Compute atomically computes and updates a value
func (sm *SafeMap[K, V]) Compute(key K, fn func(V, bool) V) V {
    sm.mu.Lock()
    defer sm.mu.Unlock()

    oldVal, ok := sm.m[key]
    newVal := fn(oldVal, ok)
    sm.m[key] = newVal
    return newVal
}

// ForEach iterates over all key-value pairs
func (sm *SafeMap[K, V]) ForEach(fn func(K, V)) {
    sm.mu.RLock()
    defer sm.mu.RUnlock()

    for k, v := range sm.m {
        fn(k, v)
    }
}

// Keys returns all keys
func (sm *SafeMap[K, V]) Keys() []K {
    sm.mu.RLock()
    defer sm.mu.RUnlock()

    keys := make([]K, 0, len(sm.m))
    for k := range sm.m {
        keys = append(keys, k)
    }
    return keys
}

// Values returns all values
func (sm *SafeMap[K, V]) Values() []V {
    sm.mu.RLock()
    defer sm.mu.RUnlock()

    values := make([]V, 0, len(sm.m))
    for _, v := range sm.m {
        values = append(values, v)
    }
    return values
}

// Len returns the length
func (sm *SafeMap[K, V]) Len() int {
    sm.mu.RLock()
    defer sm.mu.RUnlock()
    return len(sm.m)
}

func main() {
    cache := NewSafeMap[string, int]()

    // Basic operations
    cache.Set("a", 1)
    cache.Set("b", 2)

    if val, ok := cache.Get("a"); ok {
        fmt.Println("a:", val)  // a: 1
    }

    // GetOrSet
    val := cache.GetOrSet("c", 3)
    fmt.Println("c:", val)  // c: 3

    // Compute - atomic increment
    cache.Compute("a", func(old int, exists bool) int {
        if exists {
            return old + 10
        }
        return 10
    })

    if val, ok := cache.Get("a"); ok {
        fmt.Println("a after compute:", val)  // a after compute: 11
    }

    // Iteration
    cache.ForEach(func(k string, v int) {
        fmt.Printf("%s: %d\n", k, v)
    })
}
```

## Best Practices

### Naming Conventions

```go
// 单个类型参数：使用 T
func First[T any](slice []T) T

// 键值对：使用 K 和 V
func MapKeys[K comparable, V any](m map[K]V) []K

// 元素类型：使用 E
func Contains[E comparable](slice []E, elem E) bool

// 输入输出转换：使用描述性名称
func Transform[In, Out any](input In, fn func(In) Out) Out

// 约束类型参数：名称反映约束
func Sort[T cmp.Ordered](slice []T)
func Print[T fmt.Stringer](value T)
```

### Constraint Design Principles

```go
// 原则一：最小约束原则
// 只使用必需的约束，不要过度限制

// 不好：约束太强
func Process[T int](value T) T {
    return value
}

// 好：使用合适的约束
func Process[T cmp.Ordered](value T) T {
    return value
}

// 原则二：组合优于继承
// 使用接口组合创建复杂约束

type Reader interface {
    Read([]byte) (int, error)
}

type Writer interface {
    Write([]byte) (int, error)
}

type ReadWriter interface {
    Reader
    Writer
}

// 原则三：使用标准库约束
// 优先使用 cmp.Ordered 等标准约束
import "cmp"

func Min[T cmp.Ordered](a, b T) T {
    if cmp.Less(a, b) {
        return a
    }
    return b
}
```

### Zero Value Handling

```go
// 正确处理零值
func First[T any](slice []T) (T, bool) {
    if len(slice) == 0 {
        var zero T  // 获取类型的零值
        return zero, false
    }
    return slice[0], true
}

// 使用指针区分零值和缺失
func Find[T comparable](slice []T, target T) *T {
    for i := range slice {
        if slice[i] == target {
            return &slice[i]
        }
    }
    return nil  // 明确表示未找到
}

// 使用 Option 类型
type Option[T any] struct {
    value   T
    present bool
}

func Some[T any](v T) Option[T] {
    return Option[T]{value: v, present: true}
}

func None[T any]() Option[T] {
    return Option[T]{present: false}
}
```

### Choosing Between Generics and Interfaces

```go
// 使用泛型：编译时确定类型，更好的性能
func SortGeneric[T cmp.Ordered](slice []T) {
    // 编译时知道具体类型，可以优化
}

// 使用接口：Runtime多态，更灵活
type Sorter interface {
    Len() int
    Less(i, j int) bool
    Swap(i, j int)
}

func SortInterface(data Sorter) {
    // Runtime确定具体类型
}

// 选择指南：
// - 性能关键 + 类型固定 => 泛型
// - 需要Runtime多态 => 接口
// - 算法通用 + 类型安全 => 泛型
// - 插件式架构 => 接口
```

### Documentation Standards

```go
// Sum 计算切片中所有元素的和。
//
// 类型参数:
//   - T: 必须是数值类型，支持 + 运算符
//
// 参数:
//   - values: 要求和的数值切片
//
// 返回值:
//   - 所有元素的和，如果切片为空则返回零值
//
// 示例:
//
//	nums := []int{1, 2, 3, 4, 5}
//	sum := Sum(nums) // 返回 15
//
//	floats := []float64{1.1, 2.2, 3.3}
//	sum := Sum(floats) // 返回 6.6
func Sum[T Numeric](values []T) T {
    var sum T
    for _, v := range values {
        sum += v
    }
    return sum
}
```

## Common Pitfalls

### Methods Cannot Have Additional Type Parameters

```go
type Container[T any] struct {
    value T
}

// 错误：方法不能有自己的类型参数
// func (c Container[T]) Map[U any](fn func(T) U) Container[U] {
//     return Container[U]{value: fn(c.value)}
// }

// 解决方案一：使用普通函数
func Map[T, U any](c Container[T], fn func(T) U) Container[U] {
    return Container[U]{value: fn(c.value)}
}

// 解决方案二：在类型定义时包含所有需要的类型参数
type Mappable[T, U any] struct {
    value T
    fn    func(T) U
}

func (m Mappable[T, U]) Map() U {
    return m.fn(m.value)
}
```

### Type Parameters Cannot Be Used for Type Assertions

```go
// 错误：不能直接对类型参数进行类型断言
func Convert[T any](value interface{}) T {
    // return value.(T)  // 编译错误

    // 正确方式
    if v, ok := value.(T); ok {
        return v
    }
    var zero T
    return zero
}

// 更安全的实现
func Convert[T any](value interface{}) (T, bool) {
    v, ok := value.(T)
    return v, ok
}
```

### Generic Types Must Be Instantiated

```go
type Stack[T any] struct {
    items []T
}

// 错误：不能使用未实例化的泛型类型
// var s Stack  // 编译错误

// 正确：必须指定类型参数
var s1 Stack[int]
var s2 Stack[string]

// 使用工厂函数时类型推断有效
func NewStack[T any]() *Stack[T] {
    return &Stack[T]{}
}

s3 := NewStack[int]()  // 必须显式指定类型
```

### 不能在Runtime获取类型参数

```go
func TypeName[T any]() string {
    // 错误：不能在Runtime获取 T 的类型名
    // return fmt.Sprintf("%T", T)  // 编译错误

    // 需要通过值来获取类型信息
    var zero T
    return fmt.Sprintf("%T", zero)
}

// 或使用反射
import "reflect"

func TypeInfo[T any]() reflect.Type {
    var zero T
    return reflect.TypeOf(zero)
}
```

### Methods in Constraints Must Use Consistent Receivers

```go
type Incrementer interface {
    Increment()  // 方法签名
}

type Counter struct {
    value int
}

// 指针接收者
func (c *Counter) Increment() {
    c.value++
}

// 使用泛型函数时需要注意
func DoIncrement[T Incrementer](v T) {
    v.Increment()
}

func main() {
    c := Counter{value: 0}

    // 错误：Counter 不满足 Incrementer（方法在 *Counter 上）
    // DoIncrement(c)

    // 正确：使用指针
    DoIncrement(&c)
}
```

### Method Limitations in Union Constraints

```go
// 联合约束的类型只能使用交集方法
type IntOrFloat interface {
    int | float64
}

func Process[T IntOrFloat](v T) T {
    // 可以使用 + - * / 运算符（int 和 float64 都支持）
    return v + v

    // 不能调用特定类型的方法
    // v.SomeMethod()  // 错误：类型联合没有共同方法
}
```

## Performance Considerations

### Compile-Time Overhead of Generics

```go
// 泛型会增加编译时间
// 每个不同的类型实例化都需要生成代码

// 原始代码
func Max[T cmp.Ordered](a, b T) T {
    if a > b {
        return a
    }
    return b
}

// 使用时
Max(1, 2)      // 生成 Max[int]
Max(1.0, 2.0)  // 生成 Max[float64]
Max("a", "b")  // 生成 Max[string]

// 优化建议：减少类型实例化数量
```

### GCShape and Code Sharing

```go
// 相同 for same类型可能共享代码
// 这减少了二进制大小但可能影响性能

// 指针类型通常Shared code的代码
type A struct{ x int }
type B struct{ y string }

func Process[T any](v *T) *T {
    return v
}

// Process[*A] 和 Process[*B] 可能共享代码
// 因为它们的 GCShape 相同（都是指针）
```

### Inlining Optimization

```go
// 泛型函数可能影响内联
// 小型泛型函数通常会被内联

// 可能被内联
func Add[T Numeric](a, b T) T {
    return a + b
}

// 复杂函数可能不被内联
func ComplexProcess[T any](items []T) []T {
    // 复杂逻辑...
    result := make([]T, 0, len(items))
    for _, item := range items {
        // 多层处理
        result = append(result, item)
    }
    return result
}
```

### Benchmark Comparison

```go
package main

import (
    "testing"
)

// 泛型版本
func SumGeneric[T int | float64](values []T) T {
    var sum T
    for _, v := range values {
        sum += v
    }
    return sum
}

// 具体类型版本
func SumInt(values []int) int {
    var sum int
    for _, v := range values {
        sum += v
    }
    return sum
}

func BenchmarkGeneric(b *testing.B) {
    values := make([]int, 1000)
    for i := range values {
        values[i] = i
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _ = SumGeneric(values)
    }
}

func BenchmarkSpecific(b *testing.B) {
    values := make([]int, 1000)
    for i := range values {
        values[i] = i
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _ = SumInt(values)
    }
}

// 运行：go test -bench=. -benchmem
// 通常泛型版本性能与具体类型版本相当
```

### Memory Allocation Optimization

```go
// 预分配容量减少内存分配
func Map[T, U any](slice []T, fn func(T) U) []U {
    // 好：预分配准确容量
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}

// 避免不必要的中间分配
func FilterMap[T, U any](slice []T, fn func(T) (U, bool)) []U {
    // 预估容量，避免多次扩容
    result := make([]U, 0, len(slice)/2)
    for _, v := range slice {
        if u, ok := fn(v); ok {
            result = append(result, u)
        }
    }
    return result
}
```

## Real-World Scenarios

### Scenario One: Generic HTTP Client

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

// Response 通用响应结构
type Response[T any] struct {
    Data      T         `json:"data"`
    Error     string    `json:"error,omitempty"`
    Timestamp time.Time `json:"timestamp"`
}

// APIClient 泛型 API 客户端
type APIClient struct {
    baseURL    string
    httpClient *http.Client
}

func NewAPIClient(baseURL string) *APIClient {
    return &APIClient{
        baseURL: baseURL,
        httpClient: &http.Client{
            Timeout: 30 * time.Second,
        },
    }
}

// Get 发送 GET 请求并解析响应
func Get[T any](client *APIClient, endpoint string) (*Response[T], error) {
    url := client.baseURL + endpoint

    resp, err := client.httpClient.Get(url)
    if err != nil {
        return nil, fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    var result Response[T]
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("decode failed: %w", err)
    }

    return &result, nil
}

// Usage example
type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

type Product struct {
    ID    int     `json:"id"`
    Name  string  `json:"name"`
    Price float64 `json:"price"`
}

func main() {
    client := NewAPIClient("https://api.example.com")

    // 获取用户
    userResp, err := Get[User](client, "/users/1")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Printf("User: %+v\n", userResp.Data)

    // 获取产品
    productResp, err := Get[Product](client, "/products/1")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Printf("Product: %+v\n", productResp.Data)

    // 获取用户列表
    usersResp, err := Get[[]User](client, "/users")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Printf("Users count: %d\n", len(usersResp.Data))
}
```

### Scenario Two: Generic Repository Pattern

```go
package main

import (
    "errors"
    "fmt"
    "sync"
)

// Entity 实体接口
type Entity interface {
    GetID() int
}

// Repository 泛型仓储接口
type Repository[T Entity] interface {
    Create(entity T) error
    FindByID(id int) (T, error)
    FindAll() ([]T, error)
    Update(entity T) error
    Delete(id int) error
}

// InMemoryRepository 内存仓储实现
type InMemoryRepository[T Entity] struct {
    mu      sync.RWMutex
    storage map[int]T
}

func NewInMemoryRepository[T Entity]() *InMemoryRepository[T] {
    return &InMemoryRepository[T]{
        storage: make(map[int]T),
    }
}

func (r *InMemoryRepository[T]) Create(entity T) error {
    r.mu.Lock()
    defer r.mu.Unlock()

    id := entity.GetID()
    if _, exists := r.storage[id]; exists {
        return errors.New("entity already exists")
    }

    r.storage[id] = entity
    return nil
}

func (r *InMemoryRepository[T]) FindByID(id int) (T, error) {
    r.mu.RLock()
    defer r.mu.RUnlock()

    entity, ok := r.storage[id]
    if !ok {
        var zero T
        return zero, errors.New("entity not found")
    }
    return entity, nil
}

func (r *InMemoryRepository[T]) FindAll() ([]T, error) {
    r.mu.RLock()
    defer r.mu.RUnlock()

    entities := make([]T, 0, len(r.storage))
    for _, entity := range r.storage {
        entities = append(entities, entity)
    }
    return entities, nil
}

func (r *InMemoryRepository[T]) Update(entity T) error {
    r.mu.Lock()
    defer r.mu.Unlock()

    id := entity.GetID()
    if _, exists := r.storage[id]; !exists {
        return errors.New("entity not found")
    }

    r.storage[id] = entity
    return nil
}

func (r *InMemoryRepository[T]) Delete(id int) error {
    r.mu.Lock()
    defer r.mu.Unlock()

    if _, exists := r.storage[id]; !exists {
        return errors.New("entity not found")
    }

    delete(r.storage, id)
    return nil
}

// Usage example
type User struct {
    ID    int
    Name  string
    Email string
}

func (u User) GetID() int {
    return u.ID
}

type Product struct {
    ID    int
    Name  string
    Price float64
}

func (p Product) GetID() int {
    return p.ID
}

func main() {
    // 用户仓储
    userRepo := NewInMemoryRepository[User]()

    userRepo.Create(User{ID: 1, Name: "Alice", Email: "alice@example.com"})
    userRepo.Create(User{ID: 2, Name: "Bob", Email: "bob@example.com"})

    user, _ := userRepo.FindByID(1)
    fmt.Printf("User: %+v\n", user)

    users, _ := userRepo.FindAll()
    fmt.Printf("All users: %+v\n", users)

    // 产品仓储
    productRepo := NewInMemoryRepository[Product]()

    productRepo.Create(Product{ID: 1, Name: "Laptop", Price: 999.99})
    productRepo.Create(Product{ID: 2, Name: "Phone", Price: 599.99})

    product, _ := productRepo.FindByID(1)
    fmt.Printf("Product: %+v\n", product)
}
```

### Scenario Three: Generic Event System

```go
package main

import (
    "fmt"
    "sync"
)

// Event 事件接口
type Event interface {
    Name() string
}

// EventHandler 事件处理器类型
type EventHandler[E Event] func(E)

// EventBus 泛型事件总线
type EventBus[E Event] struct {
    mu       sync.RWMutex
    handlers map[string][]EventHandler[E]
}

func NewEventBus[E Event]() *EventBus[E] {
    return &EventBus[E]{
        handlers: make(map[string][]EventHandler[E]),
    }
}

// Subscribe 订阅事件
func (eb *EventBus[E]) Subscribe(eventName string, handler EventHandler[E]) {
    eb.mu.Lock()
    defer eb.mu.Unlock()

    eb.handlers[eventName] = append(eb.handlers[eventName], handler)
}

// Publish 发布事件
func (eb *EventBus[E]) Publish(event E) {
    eb.mu.RLock()
    handlers := eb.handlers[event.Name()]
    eb.mu.RUnlock()

    for _, handler := range handlers {
        handler(event)
    }
}

// PublishAsync 异步发布事件
func (eb *EventBus[E]) PublishAsync(event E) {
    eb.mu.RLock()
    handlers := eb.handlers[event.Name()]
    eb.mu.RUnlock()

    for _, handler := range handlers {
        go handler(event)
    }
}

// Usage example
type UserEvent struct {
    EventName string
    UserID    int
    Action    string
}

func (e UserEvent) Name() string {
    return e.EventName
}

type OrderEvent struct {
    EventName string
    OrderID   int
    Status    string
}

func (e OrderEvent) Name() string {
    return e.EventName
}

func main() {
    // 用户事件总线
    userBus := NewEventBus[UserEvent]()

    userBus.Subscribe("user.created", func(e UserEvent) {
        fmt.Printf("User created: %d\n", e.UserID)
    })

    userBus.Subscribe("user.created", func(e UserEvent) {
        fmt.Printf("Send welcome email to user: %d\n", e.UserID)
    })

    userBus.Publish(UserEvent{
        EventName: "user.created",
        UserID:    1,
        Action:    "create",
    })

    // 订单事件总线
    orderBus := NewEventBus[OrderEvent]()

    orderBus.Subscribe("order.completed", func(e OrderEvent) {
        fmt.Printf("Order completed: %d, status: %s\n", e.OrderID, e.Status)
    })

    orderBus.Publish(OrderEvent{
        EventName: "order.completed",
        OrderID:   100,
        Status:    "completed",
    })
}
```

### Scenario Four: Generic Cache Implementation

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// CacheItem 缓存项
type CacheItem[V any] struct {
    Value      V
    Expiration time.Time
}

// IsExpired 检查是否过期
func (item CacheItem[V]) IsExpired() bool {
    if item.Expiration.IsZero() {
        return false
    }
    return time.Now().After(item.Expiration)
}

// Cache 泛型缓存
type Cache[K comparable, V any] struct {
    mu    sync.RWMutex
    items map[K]CacheItem[V]
}

// NewCache 创建新缓存
func NewCache[K comparable, V any]() *Cache[K, V] {
    cache := &Cache[K, V]{
        items: make(map[K]CacheItem[V]),
    }
    go cache.cleanup()
    return cache
}

// Set 设置缓存（带过期时间）
func (c *Cache[K, V]) Set(key K, value V, ttl time.Duration) {
    c.mu.Lock()
    defer c.mu.Unlock()

    var expiration time.Time
    if ttl > 0 {
        expiration = time.Now().Add(ttl)
    }

    c.items[key] = CacheItem[V]{
        Value:      value,
        Expiration: expiration,
    }
}

// Get 获取缓存
func (c *Cache[K, V]) Get(key K) (V, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()

    item, ok := c.items[key]
    if !ok || item.IsExpired() {
        var zero V
        return zero, false
    }
    return item.Value, true
}

// GetOrCompute 获取或计算缓存
func (c *Cache[K, V]) GetOrCompute(key K, compute func() (V, time.Duration)) V {
    if value, ok := c.Get(key); ok {
        return value
    }

    value, ttl := compute()
    c.Set(key, value, ttl)
    return value
}

// Delete 删除缓存
func (c *Cache[K, V]) Delete(key K) {
    c.mu.Lock()
    defer c.mu.Unlock()
    delete(c.items, key)
}

// cleanup 定期清理过期缓存
func (c *Cache[K, V]) cleanup() {
    ticker := time.NewTicker(time.Minute)
    defer ticker.Stop()

    for range ticker.C {
        c.mu.Lock()
        for key, item := range c.items {
            if item.IsExpired() {
                delete(c.items, key)
            }
        }
        c.mu.Unlock()
    }
}

// Usage example
type User struct {
    ID   int
    Name string
}

func main() {
    // 用户缓存
    userCache := NewCache[int, User]()

    // 设置缓存，5秒过期
    userCache.Set(1, User{ID: 1, Name: "Alice"}, 5*time.Second)

    // 获取缓存
    if user, ok := userCache.Get(1); ok {
        fmt.Printf("Found user: %+v\n", user)
    }

    // GetOrCompute 模式
    user := userCache.GetOrCompute(2, func() (User, time.Duration) {
        // 模拟从数据库加载
        fmt.Println("Loading user from database...")
        return User{ID: 2, Name: "Bob"}, 10 * time.Second
    })
    fmt.Printf("User: %+v\n", user)

    // 再次获取，使用缓存
    user = userCache.GetOrCompute(2, func() (User, time.Duration) {
        fmt.Println("This won't be called")
        return User{}, 0
    })
    fmt.Printf("Cached user: %+v\n", user)
}
```

## Interview Questions

### Basic Concept Questions

**Q: Go 泛型中的类型参数和约束是什么？**

A: 类型参数是泛型函数或类型中的占位符类型，用方括号声明（如 `[T any]`）。约束是对类型参数的限制，规定了类型参数必须满足的条件。常见约束包括：
- `any`：任意类型
- `comparable`：支持 `==` 和 `!=` 运算的类型
- `cmp.Ordered`：支持排序运算的类型
- 自定义接口约束

**Q: `any` 和 `comparable` 有什么区别？**

A:
- `any` 是 `interface{}` 的别名，表示任意类型，但不能进行任何类型特定操作
- `comparable` 表示可以用 `==` 和 `!=` 比较的类型，包括数值、字符串、指针、通道、可比较的结构体和数组，但不包括切片、映射和函数

**Q: `~` 操作符的作用是什么？**

A: `~T` 表示底层类型为 `T` 的所有类型。例如，`~int` 不仅匹配 `int`，还匹配所有底层类型为 `int` 的自定义类型（如 `type MyInt int`）。

### Implementation Questions

**Q: 实现一个泛型的 `Contains` 函数**

```go
func Contains[T comparable](slice []T, target T) bool {
    for _, v := range slice {
        if v == target {
            return true
        }
    }
    return false
}
```

**Q: 实现一个泛型的 `Map` 函数**

```go
func Map[T, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}
```

**Q: 实现一个简单的泛型栈**

```go
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
    index := len(s.items) - 1
    item := s.items[index]
    s.items = s.items[:index]
    return item, true
}
```

### Advanced Questions

**Q: Go 泛型的实现原理是什么？**

A: Go 泛型采用部分单态化策略，结合 GCShape stenciling：
1. **GCShape**：根据类型的内存布局（大小、指针位置、对齐）对类型分组
2. **Code generation**：相同 for same类型共享实例化代码
3. **字典传递**：通过隐藏的字典参数传递类型特定信息
4. 这种方式平衡了编译时间、二进制大小和Runtime性能

**Q: 为什么方法不能有额外的类型参数？**

A: Go 设计者认为允许方法有额外类型参数会导致：
1. 复杂的类型推断
2. 难以理解的接口匹配规则
3. 潜在的 API 设计问题

解决方案是使用泛型函数而不是方法，或在类型定义时包含所有需要的类型参数。

**Q: 什么情况下应该使用泛型而不是接口？**

A:
- **使用泛型**：类型安全的容器、算法函数、避免类型断言、性能关键代码
- **使用接口**：需要Runtime多态、插件式架构、类型不确定
- **组合使用**：泛型函数接收实现某接口的类型参数

### Pitfall Questions

**Q: 这段代码有什么问题？**

```go
func Convert[T any](value interface{}) T {
    return value.(T)  // 问题：编译错误
}
```

A: 类型参数不能直接用于类型断言。正确做法：

```go
func Convert[T any](value interface{}) (T, bool) {
    v, ok := value.(T)
    return v, ok
}
```

**Q: 这段代码为什么编译失败？**

```go
type Adder interface {
    Add(int) int
}

type MyInt int

func (m MyInt) Add(n int) int {
    return int(m) + n
}

func DoAdd[T Adder](v T, n int) int {
    return v.Add(n)
}

func main() {
    DoAdd(MyInt(5), 3)  // 可以工作
    DoAdd(5, 3)         // 编译错误
}
```

A: `int` 类型没有 `Add` 方法，不满足 `Adder` 约束。只有 `MyInt` 实现了 `Add` 方法。

## Further Reading

### Official Documentation

1. [Go Generics Tutorial](https://go.dev/doc/tutorial/generics) - Official getting started guide
2. [Type Parameters Proposal](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.zh.md) - Design document
3. [Go 1.18 Release Notes](https://go.dev/doc/go1.18) - Generics release notes

### Standard Library Reference

1. [cmp Package](https://pkg.go.dev/cmp) - Comparison constraints and functions
2. [slices Package](https://pkg.go.dev/slices) - Generic slice operations
3. [maps Package](https://pkg.go.dev/maps) - Generic map operations

### Deep Learning

1. [GopherCon 2021: Robert Griesemer - Generics!](https://www.youtube.com/watch?v=Pa_e9EeCdy8) - Generics designer talk
2. [Go Generics Implementation](https://go.dev/blog/intro-generics) - Official blog
3. [Effective Go with Generics](https://go.dev/blog/when-generics) - When to use generics

### Community Resources

1. [Go Generics Examples](https://github.com/golang/go/wiki/Go-Generics-Examples) - Official examples
2. [samber/lo](https://github.com/samber/lo) - Generic utility library (like Lodash)
3. [golang-standards/project-layout](https://github.com/golang-standards/project-layout) - Project structure best practices

### Related Tools

1. [gopls](https://pkg.go.dev/golang.org/x/tools/gopls) - Go language server with generics support
2. [staticcheck](https://staticcheck.io/) - Static analysis tool
3. [golangci-lint](https://golangci-lint.run/) - Code linting tool
