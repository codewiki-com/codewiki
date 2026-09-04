---
title: Go 类型参数 (Type Parameters)
description: 深入理解 Go 泛型类型参数：约束定义、类型集合、any/comparable 约束、泛型数据结构设计与实战应用
track: go
section: types-interfaces
difficulty: intermediate
tags:
  - Go
  - 泛型
  - 类型参数
  - 约束
  - 类型集
  - comparable
  - any
status: imported
origin: old/src/content/docs/go/type-parameters.zh.md
divergence: 0.133
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Go
  subcategory: 泛型
  order: 5
  lastUpdated: 2026-01-07
---

## 概念解释

类型参数（Type Parameters）是 Go 1.18 引入的泛型核心机制，允许函数和类型在定义时使用占位符类型，在使用时由具体类型替代。这一特性彻底改变了 Go 代码复用的方式，使开发者能够编写类型安全、高度可复用的通用代码。

### 历史背景

Go 语言诞生之初，设计者有意省略了泛型特性，原因包括：

1. **简化语言设计**：避免引入复杂的类型系统
2. **快速编译**：泛型可能影响编译速度
3. **代码可读性**：担心泛型滥用导致代码晦涩

然而，随着 Go 社区的发展，泛型需求日益强烈：

- **代码重复**：相同逻辑需要为不同类型编写多份代码
- **类型安全**：使用 `interface{}` 丢失编译时类型检查
- **标准库限制**：sort、container 等包的 API 不够优雅

经过多年讨论和设计，Go 团队在 2022 年发布的 Go 1.18 中正式引入泛型，采用类型参数方案。

### 解决的问题

```go
// 问题一：代码重复
// 没有泛型时，需要为每种类型编写相同逻辑
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

// 问题二：类型不安全
// 使用 interface{} 丢失类型信息
func MaxAny(a, b interface{}) interface{} {
    // 运行时可能 panic，编译器无法检查
    switch av := a.(type) {
    case int:
        if av > b.(int) {
            return a
        }
        return b
    // ... 需要处理所有类型
    default:
        panic("unsupported type")
    }
}

// 解决方案：类型参数
// 一次编写，多处使用，类型安全
func Max[T cmp.Ordered](a, b T) T {
    if a > b {
        return a
    }
    return b
}
```

## 核心原理

### 类型参数的工作机制

Go 泛型采用**部分单态化（Partial Monomorphization）** 策略，结合 **GCShape stenciling** 技术：

```
源代码                    编译过程                     运行时
+---------------+        +---------------+        +---------------+
| func Max[T]   |   =>   | 类型检查      |   =>   | 共享相同      |
| (a, b T) T    |        | 约束验证      |        | GCShape 的    |
+---------------+        | 代码生成      |        | 实例代码      |
                         +---------------+        +---------------+
```

#### GCShape 概念

GCShape（Garbage Collection Shape）是 Go 编译器用于分组类型的概念：

```go
// 相同 GCShape 的类型共享代码
// GCShape 由以下因素决定：
// 1. 类型大小
// 2. 指针布局
// 3. 内存对齐要求

// 这些类型可能共享 GCShape（都是指针）
type A struct{ x *int }
type B struct{ y *string }

// 这些类型可能共享 GCShape（都是 8 字节整数）
type Int64Alias int64
type MyInt int64
```

### 类型参数语法结构

```go
// 完整的类型参数语法
func FunctionName[TypeParam1 Constraint1, TypeParam2 Constraint2](params) returns {
    // 函数体
}

type TypeName[TypeParam1 Constraint1, TypeParam2 Constraint2] struct {
    // 类型定义
}

// 语法元素说明：
// [...]       - 类型参数列表，使用方括号
// TypeParam   - 类型参数名称，通常使用大写字母
// Constraint  - 类型约束，限制可接受的类型
```

### 类型推断机制

Go 编译器能够从函数参数自动推断类型参数：

```go
func Print[T any](value T) {
    fmt.Printf("%v\n", value)
}

func main() {
    // 显式指定类型参数
    Print[int](42)
    Print[string]("hello")

    // 类型推断（推荐）
    Print(42)       // T 推断为 int
    Print("hello")  // T 推断为 string
    Print(3.14)     // T 推断为 float64

    // 复杂推断
    pairs := map[string]int{"a": 1}
    Keys(pairs)     // K 推断为 string，V 推断为 int
}

func Keys[K comparable, V any](m map[K]V) []K {
    keys := make([]K, 0, len(m))
    for k := range m {
        keys = append(keys, k)
    }
    return keys
}
```

### 约束的实现原理

约束本质上是接口，但 Go 1.18 扩展了接口的语义：

```go
// 传统接口：定义方法集
type Stringer interface {
    String() string
}

// 扩展接口：定义类型集
type Integer interface {
    int | int8 | int16 | int32 | int64
}

// 组合接口：方法集 + 类型集
type StringableInt interface {
    ~int | ~int64
    String() string
}
```

## 核心要点

### 预定义约束

#### any 约束

`any` 是 `interface{}` 的别名，表示任意类型：

```go
// any 的定义（在 builtin 包中）
type any = interface{}

// 使用 any 约束
func Identity[T any](value T) T {
    return value
}

// 适用于不需要对类型进行任何操作的场景
func Ptr[T any](v T) *T {
    return &v
}

func Zero[T any]() T {
    var zero T
    return zero
}
```

#### comparable 约束

`comparable` 表示可以使用 `==` 和 `!=` 比较的类型：

```go
// comparable 是内置约束
// 包括：数值类型、字符串、指针、通道、接口、
//       只包含可比较字段的结构体和数组

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

// 使用示例
func main() {
    nums := []int{1, 2, 3, 4, 5}
    fmt.Println(Contains(nums, 3))  // true
    fmt.Println(Index(nums, 4))     // 3

    // 注意：切片、映射、函数不是 comparable
    // slices := [][]int{{1}, {2}}
    // Contains(slices, []int{1})  // 编译错误
}
```

### 自定义约束

#### 类型联合约束

使用 `|` 定义类型联合：

```go
// 数值类型约束
type Numeric interface {
    int | int8 | int16 | int32 | int64 |
    uint | uint8 | uint16 | uint32 | uint64 | uintptr |
    float32 | float64
}

// 有符号整数约束
type Signed interface {
    int | int8 | int16 | int32 | int64
}

// 无符号整数约束
type Unsigned interface {
    uint | uint8 | uint16 | uint32 | uint64 | uintptr
}

// 浮点数约束
type Float interface {
    float32 | float64
}

// 复数约束
type Complex interface {
    complex64 | complex128
}
```

#### 底层类型约束（~）

`~` 操作符表示包含底层类型相同的所有类型：

```go
// 不使用 ~：只接受精确的 int 类型
type ExactInt interface {
    int
}

// 使用 ~：接受底层类型为 int 的所有类型
type ApproxInt interface {
    ~int
}

// 自定义类型
type UserID int
type Age int
type Score int

func ProcessExact[T ExactInt](v T) T { return v }
func ProcessApprox[T ApproxInt](v T) T { return v }

func main() {
    var id UserID = 100
    var age Age = 25

    // ProcessExact(id)   // 编译错误：UserID 不是 int
    ProcessApprox(id)     // 正确：UserID 的底层类型是 int
    ProcessApprox(age)    // 正确：Age 的底层类型是 int
}
```

#### 方法约束

要求类型必须实现特定方法：

```go
// 要求实现 String() 方法
type Stringer interface {
    String() string
}

// 要求实现 Compare 方法
type Comparable[T any] interface {
    Compare(T) int
}

// 组合方法约束
type StringerComparable[T any] interface {
    Stringer
    Comparable[T]
}

func PrintSorted[T StringerComparable[T]](items []T) {
    // 可以调用 String() 和 Compare()
    sort.Slice(items, func(i, j int) bool {
        return items[i].Compare(items[j]) < 0
    })
    for _, item := range items {
        fmt.Println(item.String())
    }
}
```

### 类型集（Type Sets）

Go 1.18 重新定义了接口的语义，每个接口定义一个类型集：

```go
// 类型集的概念
// 接口 I 的类型集 = 满足 I 所有要求的类型集合

// 空接口的类型集 = 所有类型
type Any interface{}  // 等同于 any

// 方法接口的类型集 = 实现该方法的所有类型
type Reader interface {
    Read([]byte) (int, error)
}

// 类型联合的类型集 = 联合中所有类型
type IntOrString interface {
    int | string
}

// 组合接口的类型集 = 各部分类型集的交集
type SignedInteger interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64
}
```

#### 类型集运算

```go
// 交集：类型必须同时满足多个约束
type OrderedStringer interface {
    ~int | ~string  // 必须是 int 或 string
    String() string // 必须有 String 方法
}
// 类型集 = (~int ∪ ~string) ∩ {有 String() 方法的类型}

// 实现示例
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

    // Display(42)  // 错误：int 没有 String() 方法
}
```

### cmp 和 slices 包的约束

Go 1.21 引入的标准库约束：

```go
import (
    "cmp"
    "slices"
)

// cmp.Ordered - 可排序类型
// 包括所有整数、浮点数和字符串类型
func SortSlice[T cmp.Ordered](s []T) {
    slices.Sort(s)
}

// 使用 cmp.Compare 进行比较
func Min[T cmp.Ordered](a, b T) T {
    if cmp.Compare(a, b) < 0 {
        return a
    }
    return b
}

// 使用 slices 包的泛型函数
func main() {
    nums := []int{3, 1, 4, 1, 5, 9, 2, 6}
    slices.Sort(nums)
    fmt.Println(nums)  // [1 1 2 3 4 5 6 9]

    // 查找
    idx, found := slices.BinarySearch(nums, 4)
    fmt.Println(idx, found)  // 4 true

    // 最大最小值
    fmt.Println(slices.Min(nums))  // 1
    fmt.Println(slices.Max(nums))  // 9
}
```

## 代码示例

### 基础泛型函数

```go
package main

import (
    "cmp"
    "fmt"
)

// 交换两个值
func Swap[T any](a, b *T) {
    *a, *b = *b, *a
}

// 返回指针
func Ptr[T any](v T) *T {
    return &v
}

// 获取零值
func Zero[T any]() T {
    var zero T
    return zero
}

// 条件选择
func If[T any](cond bool, trueVal, falseVal T) T {
    if cond {
        return trueVal
    }
    return falseVal
}

// 范围限制
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
    // Swap 示例
    x, y := 10, 20
    Swap(&x, &y)
    fmt.Println(x, y)  // 20 10

    // Ptr 示例
    p := Ptr(42)
    fmt.Println(*p)  // 42

    // Zero 示例
    fmt.Println(Zero[int]())     // 0
    fmt.Println(Zero[string]())  // ""
    fmt.Println(Zero[bool]())    // false

    // If 示例
    result := If(10 > 5, "yes", "no")
    fmt.Println(result)  // yes

    // Clamp 示例
    fmt.Println(Clamp(15, 0, 10))   // 10
    fmt.Println(Clamp(-5, 0, 10))   // 0
    fmt.Println(Clamp(5, 0, 10))    // 5
}
```

### 泛型切片操作

```go
package main

import "fmt"

// Map 对切片中每个元素应用函数
func Map[T, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}

// Filter 过滤切片
func Filter[T any](slice []T, predicate func(T) bool) []T {
    result := make([]T, 0)
    for _, v := range slice {
        if predicate(v) {
            result = append(result, v)
        }
    }
    return result
}

// Reduce 归约切片
func Reduce[T, U any](slice []T, initial U, fn func(U, T) U) U {
    result := initial
    for _, v := range slice {
        result = fn(result, v)
    }
    return result
}

// Find 查找第一个满足条件的元素
func Find[T any](slice []T, predicate func(T) bool) (T, bool) {
    for _, v := range slice {
        if predicate(v) {
            return v, true
        }
    }
    var zero T
    return zero, false
}

// All 检查是否所有元素都满足条件
func All[T any](slice []T, predicate func(T) bool) bool {
    for _, v := range slice {
        if !predicate(v) {
            return false
        }
    }
    return true
}

// Any 检查是否存在满足条件的元素
func Any[T any](slice []T, predicate func(T) bool) bool {
    for _, v := range slice {
        if predicate(v) {
            return true
        }
    }
    return false
}

// GroupBy 按键分组
func GroupBy[T any, K comparable](slice []T, keyFn func(T) K) map[K][]T {
    result := make(map[K][]T)
    for _, v := range slice {
        key := keyFn(v)
        result[key] = append(result[key], v)
    }
    return result
}

// Chunk 将切片分块
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

// Unique 去重（保持顺序）
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

    // Map: 平方
    squares := Map(numbers, func(n int) int { return n * n })
    fmt.Println("Squares:", squares)
    // [1 4 9 16 25 36 49 64 81 100]

    // Filter: 偶数
    evens := Filter(numbers, func(n int) bool { return n%2 == 0 })
    fmt.Println("Evens:", evens)
    // [2 4 6 8 10]

    // Reduce: 求和
    sum := Reduce(numbers, 0, func(acc, n int) int { return acc + n })
    fmt.Println("Sum:", sum)
    // 55

    // Find: 第一个大于 5 的数
    first, found := Find(numbers, func(n int) bool { return n > 5 })
    fmt.Println("First > 5:", first, found)
    // 6 true

    // GroupBy: 按奇偶分组
    type Person struct {
        Name string
        Age  int
    }
    people := []Person{
        {"Alice", 25}, {"Bob", 30}, {"Charlie", 25}, {"David", 30},
    }
    byAge := GroupBy(people, func(p Person) int { return p.Age })
    fmt.Println("By Age:", byAge)

    // Chunk: 分块
    chunks := Chunk(numbers, 3)
    fmt.Println("Chunks:", chunks)
    // [[1 2 3] [4 5 6] [7 8 9] [10]]

    // Unique: 去重
    dups := []int{1, 2, 2, 3, 3, 3, 4, 4, 4, 4}
    unique := Unique(dups)
    fmt.Println("Unique:", unique)
    // [1 2 3 4]
}
```

### 泛型数据结构

#### 泛型栈

```go
package main

import (
    "errors"
    "fmt"
)

// Stack 泛型栈实现
type Stack[T any] struct {
    items []T
}

// NewStack 创建新栈
func NewStack[T any](capacity int) *Stack[T] {
    return &Stack[T]{
        items: make([]T, 0, capacity),
    }
}

// Push 入栈
func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

// Pop 出栈
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

// Peek 查看栈顶元素
func (s *Stack[T]) Peek() (T, error) {
    if len(s.items) == 0 {
        var zero T
        return zero, errors.New("stack is empty")
    }
    return s.items[len(s.items)-1], nil
}

// IsEmpty 判断栈是否为空
func (s *Stack[T]) IsEmpty() bool {
    return len(s.items) == 0
}

// Size 获取栈大小
func (s *Stack[T]) Size() int {
    return len(s.items)
}

// Clear 清空栈
func (s *Stack[T]) Clear() {
    s.items = s.items[:0]
}

func main() {
    // 整数栈
    intStack := NewStack[int](10)
    intStack.Push(1)
    intStack.Push(2)
    intStack.Push(3)

    for !intStack.IsEmpty() {
        val, _ := intStack.Pop()
        fmt.Println(val)  // 3, 2, 1
    }

    // 字符串栈
    strStack := NewStack[string](10)
    strStack.Push("hello")
    strStack.Push("world")

    top, _ := strStack.Peek()
    fmt.Println("Top:", top)  // world
}
```

#### 泛型队列

```go
package main

import (
    "errors"
    "fmt"
)

// Queue 泛型队列实现
type Queue[T any] struct {
    items []T
}

// NewQueue 创建新队列
func NewQueue[T any](capacity int) *Queue[T] {
    return &Queue[T]{
        items: make([]T, 0, capacity),
    }
}

// Enqueue 入队
func (q *Queue[T]) Enqueue(item T) {
    q.items = append(q.items, item)
}

// Dequeue 出队
func (q *Queue[T]) Dequeue() (T, error) {
    if len(q.items) == 0 {
        var zero T
        return zero, errors.New("queue is empty")
    }

    item := q.items[0]
    q.items = q.items[1:]
    return item, nil
}

// Front 查看队首元素
func (q *Queue[T]) Front() (T, error) {
    if len(q.items) == 0 {
        var zero T
        return zero, errors.New("queue is empty")
    }
    return q.items[0], nil
}

// IsEmpty 判断队列是否为空
func (q *Queue[T]) IsEmpty() bool {
    return len(q.items) == 0
}

// Size 获取队列大小
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

#### 泛型链表

```go
package main

import "fmt"

// Node 链表节点
type Node[T any] struct {
    Value T
    Next  *Node[T]
    Prev  *Node[T]
}

// LinkedList 双向链表
type LinkedList[T any] struct {
    head *Node[T]
    tail *Node[T]
    size int
}

// NewLinkedList 创建新链表
func NewLinkedList[T any]() *LinkedList[T] {
    return &LinkedList[T]{}
}

// PushFront 在头部添加元素
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

// PushBack 在尾部添加元素
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

// PopFront 从头部移除元素
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

// PopBack 从尾部移除元素
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

// ForEach 遍历链表
func (l *LinkedList[T]) ForEach(fn func(T)) {
    current := l.head
    for current != nil {
        fn(current.Value)
        current = current.Next
    }
}

// ToSlice 转换为切片
func (l *LinkedList[T]) ToSlice() []T {
    result := make([]T, 0, l.size)
    l.ForEach(func(v T) {
        result = append(result, v)
    })
    return result
}

// Size 获取链表大小
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

#### 泛型集合（Set）

```go
package main

import "fmt"

// Set 泛型集合
type Set[T comparable] struct {
    items map[T]struct{}
}

// NewSet 创建新集合
func NewSet[T comparable](values ...T) *Set[T] {
    s := &Set[T]{
        items: make(map[T]struct{}),
    }
    for _, v := range values {
        s.Add(v)
    }
    return s
}

// Add 添加元素
func (s *Set[T]) Add(value T) {
    s.items[value] = struct{}{}
}

// Remove 移除元素
func (s *Set[T]) Remove(value T) {
    delete(s.items, value)
}

// Contains 判断是否包含元素
func (s *Set[T]) Contains(value T) bool {
    _, ok := s.items[value]
    return ok
}

// Size 获取集合大小
func (s *Set[T]) Size() int {
    return len(s.items)
}

// ToSlice 转换为切片
func (s *Set[T]) ToSlice() []T {
    result := make([]T, 0, len(s.items))
    for k := range s.items {
        result = append(result, k)
    }
    return result
}

// Union 并集
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

// Intersection 交集
func (s *Set[T]) Intersection(other *Set[T]) *Set[T] {
    result := NewSet[T]()
    for k := range s.items {
        if other.Contains(k) {
            result.Add(k)
        }
    }
    return result
}

// Difference 差集
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

#### 泛型二叉搜索树

```go
package main

import (
    "cmp"
    "fmt"
)

// TreeNode 树节点
type TreeNode[T cmp.Ordered] struct {
    Value T
    Left  *TreeNode[T]
    Right *TreeNode[T]
}

// BST 二叉搜索树
type BST[T cmp.Ordered] struct {
    root *TreeNode[T]
    size int
}

// NewBST 创建新的二叉搜索树
func NewBST[T cmp.Ordered]() *BST[T] {
    return &BST[T]{}
}

// Insert 插入元素
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

// Contains 判断是否包含元素
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

// InOrder 中序遍历
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

// Min 获取最小值
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

// Max 获取最大值
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

### 泛型并发安全容器

```go
package main

import (
    "fmt"
    "sync"
)

// SafeMap 线程安全的泛型 Map
type SafeMap[K comparable, V any] struct {
    mu sync.RWMutex
    m  map[K]V
}

// NewSafeMap 创建新的线程安全 Map
func NewSafeMap[K comparable, V any]() *SafeMap[K, V] {
    return &SafeMap[K, V]{
        m: make(map[K]V),
    }
}

// Set 设置键值对
func (sm *SafeMap[K, V]) Set(key K, value V) {
    sm.mu.Lock()
    defer sm.mu.Unlock()
    sm.m[key] = value
}

// Get 获取值
func (sm *SafeMap[K, V]) Get(key K) (V, bool) {
    sm.mu.RLock()
    defer sm.mu.RUnlock()
    val, ok := sm.m[key]
    return val, ok
}

// Delete 删除键
func (sm *SafeMap[K, V]) Delete(key K) {
    sm.mu.Lock()
    defer sm.mu.Unlock()
    delete(sm.m, key)
}

// GetOrSet 获取或设置值
func (sm *SafeMap[K, V]) GetOrSet(key K, defaultValue V) V {
    sm.mu.Lock()
    defer sm.mu.Unlock()

    if val, ok := sm.m[key]; ok {
        return val
    }
    sm.m[key] = defaultValue
    return defaultValue
}

// Compute 原子计算并更新值
func (sm *SafeMap[K, V]) Compute(key K, fn func(V, bool) V) V {
    sm.mu.Lock()
    defer sm.mu.Unlock()

    oldVal, ok := sm.m[key]
    newVal := fn(oldVal, ok)
    sm.m[key] = newVal
    return newVal
}

// ForEach 遍历所有键值对
func (sm *SafeMap[K, V]) ForEach(fn func(K, V)) {
    sm.mu.RLock()
    defer sm.mu.RUnlock()

    for k, v := range sm.m {
        fn(k, v)
    }
}

// Keys 获取所有键
func (sm *SafeMap[K, V]) Keys() []K {
    sm.mu.RLock()
    defer sm.mu.RUnlock()

    keys := make([]K, 0, len(sm.m))
    for k := range sm.m {
        keys = append(keys, k)
    }
    return keys
}

// Values 获取所有值
func (sm *SafeMap[K, V]) Values() []V {
    sm.mu.RLock()
    defer sm.mu.RUnlock()

    values := make([]V, 0, len(sm.m))
    for _, v := range sm.m {
        values = append(values, v)
    }
    return values
}

// Len 获取长度
func (sm *SafeMap[K, V]) Len() int {
    sm.mu.RLock()
    defer sm.mu.RUnlock()
    return len(sm.m)
}

func main() {
    cache := NewSafeMap[string, int]()

    // 基本操作
    cache.Set("a", 1)
    cache.Set("b", 2)

    if val, ok := cache.Get("a"); ok {
        fmt.Println("a:", val)  // a: 1
    }

    // GetOrSet
    val := cache.GetOrSet("c", 3)
    fmt.Println("c:", val)  // c: 3

    // Compute - 原子增加
    cache.Compute("a", func(old int, exists bool) int {
        if exists {
            return old + 10
        }
        return 10
    })

    if val, ok := cache.Get("a"); ok {
        fmt.Println("a after compute:", val)  // a after compute: 11
    }

    // 遍历
    cache.ForEach(func(k string, v int) {
        fmt.Printf("%s: %d\n", k, v)
    })
}
```

## 最佳实践

### 命名约定

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

### 约束设计原则

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

### 零值处理

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

### 泛型与接口的选择

```go
// 使用泛型：编译时确定类型，更好的性能
func SortGeneric[T cmp.Ordered](slice []T) {
    // 编译时知道具体类型，可以优化
}

// 使用接口：运行时多态，更灵活
type Sorter interface {
    Len() int
    Less(i, j int) bool
    Swap(i, j int)
}

func SortInterface(data Sorter) {
    // 运行时确定具体类型
}

// 选择指南：
// - 性能关键 + 类型固定 => 泛型
// - 需要运行时多态 => 接口
// - 算法通用 + 类型安全 => 泛型
// - 插件式架构 => 接口
```

### 文档规范

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

## 常见陷阱

### 方法不能有额外的类型参数

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

### 类型参数不能用于类型断言

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

### 泛型类型必须实例化

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

### 不能在运行时获取类型参数

```go
func TypeName[T any]() string {
    // 错误：不能在运行时获取 T 的类型名
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

### 约束中的方法必须使用值接收者或指针接收者一致

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

### 联合约束中的方法限制

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

## 性能考量

### 泛型的编译时开销

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

### GCShape 和代码共享

```go
// 相同 GCShape 的类型可能共享代码
// 这减少了二进制大小但可能影响性能

// 指针类型通常共享相同的代码
type A struct{ x int }
type B struct{ y string }

func Process[T any](v *T) *T {
    return v
}

// Process[*A] 和 Process[*B] 可能共享代码
// 因为它们的 GCShape 相同（都是指针）
```

### 内联优化

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

### 基准测试对比

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

### 内存分配优化

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

## 实战场景

### 场景一：通用 HTTP 客户端

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

// 使用示例
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

### 场景二：泛型仓储模式

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

// 使用示例
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

### 场景三：泛型事件系统

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

// 使用示例
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

### 场景四：泛型缓存实现

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

// 使用示例
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

## 面试要点

### 基础概念题

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

### 实现题

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

### 进阶题

**Q: Go 泛型的实现原理是什么？**

A: Go 泛型采用部分单态化策略，结合 GCShape stenciling：
1. **GCShape**：根据类型的内存布局（大小、指针位置、对齐）对类型分组
2. **代码生成**：相同 GCShape 的类型共享实例化代码
3. **字典传递**：通过隐藏的字典参数传递类型特定信息
4. 这种方式平衡了编译时间、二进制大小和运行时性能

**Q: 为什么方法不能有额外的类型参数？**

A: Go 设计者认为允许方法有额外类型参数会导致：
1. 复杂的类型推断
2. 难以理解的接口匹配规则
3. 潜在的 API 设计问题

解决方案是使用泛型函数而不是方法，或在类型定义时包含所有需要的类型参数。

**Q: 什么情况下应该使用泛型而不是接口？**

A:
- **使用泛型**：类型安全的容器、算法函数、避免类型断言、性能关键代码
- **使用接口**：需要运行时多态、插件式架构、类型不确定
- **组合使用**：泛型函数接收实现某接口的类型参数

### 陷阱题

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

## 延伸阅读

### 官方文档

1. [Go 泛型教程](https://go.dev/doc/tutorial/generics) - 官方入门教程
2. [类型参数提案](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.zh.md) - 设计文档
3. [Go 1.18 发布说明](https://go.dev/doc/go1.18) - 泛型发布说明

### 标准库参考

1. [cmp 包](https://pkg.go.dev/cmp) - 比较约束和函数
2. [slices 包](https://pkg.go.dev/slices) - 泛型切片操作
3. [maps 包](https://pkg.go.dev/maps) - 泛型映射操作

### 深入学习

1. [GopherCon 2021: Robert Griesemer - Generics!](https://www.youtube.com/watch?v=Pa_e9EeCdy8) - 泛型设计者演讲
2. [Go 泛型实现原理](https://go.dev/blog/intro-generics) - 官方博客
3. [Effective Go with Generics](https://go.dev/blog/when-generics) - 何时使用泛型

### 社区资源

1. [Go 泛型示例集](https://github.com/golang/go/wiki/Go-Generics-Examples) - 官方示例
2. [samber/lo](https://github.com/samber/lo) - 泛型工具库（类似 Lodash）
3. [golang-standards/project-layout](https://github.com/golang-standards/project-layout) - 项目结构最佳实践

### 相关工具

1. [gopls](https://pkg.go.dev/golang.org/x/tools/gopls) - Go 语言服务器，支持泛型
2. [staticcheck](https://staticcheck.io/) - 静态分析工具
3. [golangci-lint](https://golangci-lint.run/) - 代码检查工具
