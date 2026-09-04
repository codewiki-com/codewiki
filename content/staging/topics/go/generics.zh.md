---
title: Go 泛型
description: 掌握 Go 1.18+ 泛型：类型参数、约束与泛型最佳实践
track: go
section: types-interfaces
difficulty: intermediate
tags:
  - Go
  - 泛型
  - 类型参数
  - 约束
status: imported
origin: old/src/content/docs/go/generics.zh.md
divergence: 0.368
issues:
  - divergent
legacy:
  category: Go
  subcategory: 泛型
  order: 4
  lastUpdated: 2026-01-07
---

Go 1.18 引入了泛型（Generics），这是 Go 语言历史上最重大的特性更新之一。泛型允许我们编写可重用的、类型安全的代码，而无需为每种类型重复编写相同的逻辑。

## 为什么需要泛型？

在泛型出现之前，Go 开发者面临两个选择：

1. **为每种类型编写重复代码**
2. **使用 `interface{}` 并进行类型断言**

```go
// 没有泛型时的做法
func MinInt(a, b int) int {
    if a < b {
        return a
    }
    return b
}

func MinFloat64(a, b float64) float64 {
    if a < b {
        return a
    }
    return b
}

// 或使用 interface{} (不够类型安全)
func Min(a, b interface{}) interface{} {
    // 需要类型断言，容易出错
    // ...
}
```

泛型解决了这些问题，让我们可以编写一次代码，适用于多种类型。

## 泛型函数

### 基础语法

泛型函数使用类型参数（Type Parameters）来表示可以接受多种类型的参数。

```go
// 基本的泛型函数
func Min[T comparable](a, b T) T {
    if a < b {
        return a
    }
    return b
}

// 使用泛型函数
func main() {
    fmt.Println(Min(10, 20))           // 10
    fmt.Println(Min(1.5, 2.3))         // 1.5
    fmt.Println(Min("apple", "banana")) // apple
}
```

**语法说明**：
- `[T comparable]`：类型参数声明，`T` 是类型参数名，`comparable` 是类型约束
- `(a, b T)`：函数参数使用类型参数 `T`
- `T`：返回类型也是 `T`

### 多个类型参数

函数可以有多个类型参数：

```go
// 将 map 的键值对转换为切片
func MapToSlice[K comparable, V any](m map[K]V) []struct {
    Key   K
    Value V
} {
    result := make([]struct {
        Key   K
        Value V
    }, 0, len(m))

    for k, v := range m {
        result = append(result, struct {
            Key   K
            Value V
        }{k, v})
    }

    return result
}

// 使用示例
func main() {
    m := map[string]int{
        "apple":  5,
        "banana": 3,
    }

    pairs := MapToSlice(m)
    for _, p := range pairs {
        fmt.Printf("%s: %d\n", p.Key, p.Value)
    }
}
```

### 类型推断

Go 编译器可以自动推断类型参数，无需显式指定：

```go
func Print[T any](value T) {
    fmt.Printf("Value: %v, Type: %T\n", value, value)
}

func main() {
    // 类型推断 - 推荐方式
    Print(42)        // T 推断为 int
    Print("hello")   // T 推断为 string
    Print(3.14)      // T 推断为 float64

    // 显式指定类型
    Print[string]("hello")
    Print[int](42)
}
```

## 泛型类型

### 泛型结构体

可以定义使用类型参数的结构体：

```go
// 泛型栈实现
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

func (s *Stack[T]) IsEmpty() bool {
    return len(s.items) == 0
}

// 使用示例
func main() {
    // 整数栈
    intStack := Stack[int]{}
    intStack.Push(1)
    intStack.Push(2)
    intStack.Push(3)

    if val, ok := intStack.Pop(); ok {
        fmt.Println(val) // 3
    }

    // 字符串栈
    strStack := Stack[string]{}
    strStack.Push("hello")
    strStack.Push("world")

    if val, ok := strStack.Pop(); ok {
        fmt.Println(val) // world
    }
}
```

### 泛型链表

```go
// 链表节点
type Node[T any] struct {
    Value T
    Next  *Node[T]
}

// 链表
type LinkedList[T any] struct {
    Head *Node[T]
    Tail *Node[T]
    Size int
}

func (l *LinkedList[T]) Append(value T) {
    newNode := &Node[T]{Value: value}

    if l.Head == nil {
        l.Head = newNode
        l.Tail = newNode
    } else {
        l.Tail.Next = newNode
        l.Tail = newNode
    }

    l.Size++
}

func (l *LinkedList[T]) ToSlice() []T {
    result := make([]T, 0, l.Size)
    current := l.Head

    for current != nil {
        result = append(result, current.Value)
        current = current.Next
    }

    return result
}

// 使用示例
func main() {
    list := LinkedList[int]{}
    list.Append(10)
    list.Append(20)
    list.Append(30)

    fmt.Println(list.ToSlice()) // [10 20 30]
    fmt.Println(list.Size)      // 3
}
```

### 泛型 Map 包装

```go
// 线程安全的泛型 Map
type SafeMap[K comparable, V any] struct {
    mu sync.RWMutex
    m  map[K]V
}

func NewSafeMap[K comparable, V any]() *SafeMap[K, V] {
    return &SafeMap[K, V]{
        m: make(map[K]V),
    }
}

func (sm *SafeMap[K, V]) Set(key K, value V) {
    sm.mu.Lock()
    defer sm.mu.Unlock()
    sm.m[key] = value
}

func (sm *SafeMap[K, V]) Get(key K) (V, bool) {
    sm.mu.RLock()
    defer sm.mu.RUnlock()
    val, ok := sm.m[key]
    return val, ok
}

func (sm *SafeMap[K, V]) Delete(key K) {
    sm.mu.Lock()
    defer sm.mu.Unlock()
    delete(sm.m, key)
}

func (sm *SafeMap[K, V]) Len() int {
    sm.mu.RLock()
    defer sm.mu.RUnlock()
    return len(sm.m)
}

// 使用示例
func main() {
    cache := NewSafeMap[string, int]()

    cache.Set("score", 100)
    cache.Set("level", 5)

    if score, ok := cache.Get("score"); ok {
        fmt.Println("Score:", score) // Score: 100
    }

    fmt.Println("Length:", cache.Len()) // Length: 2
}
```

## 类型约束

类型约束（Type Constraints）限制了类型参数可以是哪些类型。

### 预定义约束

Go 提供了两个常用的预定义约束：

```go
// any - 任意类型（interface{} 的别名）
func PrintAny[T any](value T) {
    fmt.Println(value)
}

// comparable - 可比较的类型（支持 == 和 !=）
func Contains[T comparable](slice []T, value T) bool {
    for _, item := range slice {
        if item == value {
            return true
        }
    }
    return false
}

func main() {
    // any 示例
    PrintAny(42)
    PrintAny("hello")
    PrintAny([]int{1, 2, 3})

    // comparable 示例
    numbers := []int{1, 2, 3, 4, 5}
    fmt.Println(Contains(numbers, 3))    // true
    fmt.Println(Contains(numbers, 10))   // false

    words := []string{"apple", "banana", "cherry"}
    fmt.Println(Contains(words, "banana")) // true
}
```

### 接口约束

可以使用接口作为类型约束：

```go
// 定义 Stringer 接口约束
type Stringer interface {
    String() string
}

// 只接受实现了 String() 方法的类型
func PrintString[T Stringer](value T) {
    fmt.Println(value.String())
}

// 实现 Stringer 接口的类型
type Person struct {
    Name string
    Age  int
}

func (p Person) String() string {
    return fmt.Sprintf("%s (%d years old)", p.Name, p.Age)
}

type Book struct {
    Title  string
    Author string
}

func (b Book) String() string {
    return fmt.Sprintf("%s by %s", b.Title, b.Author)
}

func main() {
    person := Person{Name: "Alice", Age: 30}
    book := Book{Title: "Go Programming", Author: "John Doe"}

    PrintString(person) // Alice (30 years old)
    PrintString(book)   // Go Programming by John Doe
}
```

### 自定义类型约束

#### 使用接口定义约束

```go
// 数值类型约束
type Number interface {
    int | int8 | int16 | int32 | int64 |
    uint | uint8 | uint16 | uint32 | uint64 |
    float32 | float64
}

// 求和函数
func Sum[T Number](numbers []T) T {
    var sum T
    for _, num := range numbers {
        sum += num
    }
    return sum
}

// 平均值函数
func Average[T Number](numbers []T) float64 {
    if len(numbers) == 0 {
        return 0
    }
    sum := Sum(numbers)
    return float64(sum) / float64(len(numbers))
}

func main() {
    ints := []int{1, 2, 3, 4, 5}
    fmt.Println("Sum:", Sum(ints))        // Sum: 15
    fmt.Println("Avg:", Average(ints))    // Avg: 3

    floats := []float64{1.5, 2.5, 3.5}
    fmt.Println("Sum:", Sum(floats))      // Sum: 7.5
    fmt.Println("Avg:", Average(floats))  // Avg: 2.5
}
```

#### 组合约束

```go
// 组合多个约束
type Ordered interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
    ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
    ~float32 | ~float64 | ~string
}

// 查找最大值
func Max[T Ordered](values []T) T {
    if len(values) == 0 {
        var zero T
        return zero
    }

    max := values[0]
    for _, v := range values[1:] {
        if v > max {
            max = v
        }
    }
    return max
}

// 查找最小值
func Min[T Ordered](values []T) T {
    if len(values) == 0 {
        var zero T
        return zero
    }

    min := values[0]
    for _, v := range values[1:] {
        if v < min {
            min = v
        }
    }
    return min
}

func main() {
    numbers := []int{5, 2, 8, 1, 9, 3}
    fmt.Println("Max:", Max(numbers)) // Max: 9
    fmt.Println("Min:", Min(numbers)) // Min: 1

    words := []string{"zebra", "apple", "mango", "banana"}
    fmt.Println("Max:", Max(words)) // Max: zebra
    fmt.Println("Min:", Min(words)) // Min: apple
}
```

### 底层类型约束（~）

`~` 符号表示"底层类型"，允许自定义类型：

```go
// 不使用 ~ 的约束
type StrictNumber interface {
    int | float64
}

// 使用 ~ 的约束（允许底层类型）
type FlexibleNumber interface {
    ~int | ~float64
}

// 自定义类型
type MyInt int
type MyFloat float64

func StrictSum[T StrictNumber](a, b T) T {
    return a + b
}

func FlexibleSum[T FlexibleNumber](a, b T) T {
    return a + b
}

func main() {
    // StrictSum 只接受 int 和 float64
    fmt.Println(StrictSum(1, 2))       // ✓ 可以
    fmt.Println(StrictSum(1.5, 2.5))   // ✓ 可以
    // fmt.Println(StrictSum(MyInt(1), MyInt(2))) // ✗ 编译错误

    // FlexibleSum 接受底层类型为 int 或 float64 的类型
    fmt.Println(FlexibleSum(1, 2))           // ✓
    fmt.Println(FlexibleSum(1.5, 2.5))       // ✓
    fmt.Println(FlexibleSum(MyInt(1), MyInt(2)))     // ✓
    fmt.Println(FlexibleSum(MyFloat(1.5), MyFloat(2.5))) // ✓
}
```

## 类型集（Type Sets）

Go 1.18+ 中，接口不仅定义方法集，还定义类型集。

### 方法约束

```go
// 要求类型必须有 Len() 方法
type HasLen interface {
    Len() int
}

func PrintLength[T HasLen](value T) {
    fmt.Printf("Length: %d\n", value.Len())
}

type MySlice []int

func (s MySlice) Len() int {
    return len(s)
}

func main() {
    slice := MySlice{1, 2, 3, 4, 5}
    PrintLength(slice) // Length: 5
}
```

### 类型集和方法的组合

```go
// 数值类型且必须实现 String() 方法
type NumericStringer interface {
    ~int | ~float64
    String() string
}

type Score int

func (s Score) String() string {
    return fmt.Sprintf("Score: %d", s)
}

type Rating float64

func (r Rating) String() string {
    return fmt.Sprintf("Rating: %.1f", r)
}

func Display[T NumericStringer](value T) {
    fmt.Println(value.String())
}

func main() {
    score := Score(95)
    rating := Rating(4.5)

    Display(score)   // Score: 95
    Display(rating)  // Rating: 4.5
}
```

## 实用泛型示例

### 泛型切片工具函数

```go
// 映射函数
func Map[T any, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}

// 过滤函数
func Filter[T any](slice []T, fn func(T) bool) []T {
    result := make([]T, 0)
    for _, v := range slice {
        if fn(v) {
            result = append(result, v)
        }
    }
    return result
}

// 归约函数
func Reduce[T any, U any](slice []T, initial U, fn func(U, T) U) U {
    result := initial
    for _, v := range slice {
        result = fn(result, v)
    }
    return result
}

func main() {
    numbers := []int{1, 2, 3, 4, 5}

    // Map: 每个数字乘以 2
    doubled := Map(numbers, func(n int) int {
        return n * 2
    })
    fmt.Println("Doubled:", doubled) // [2 4 6 8 10]

    // Filter: 只保留偶数
    evens := Filter(numbers, func(n int) bool {
        return n%2 == 0
    })
    fmt.Println("Evens:", evens) // [2 4]

    // Reduce: 求和
    sum := Reduce(numbers, 0, func(acc, n int) int {
        return acc + n
    })
    fmt.Println("Sum:", sum) // 15

    // Map: 转换为字符串
    strings := Map(numbers, func(n int) string {
        return fmt.Sprintf("num_%d", n)
    })
    fmt.Println("Strings:", strings) // [num_1 num_2 num_3 num_4 num_5]
}
```

### 泛型 Option 类型

```go
// Option 类型 - 表示可能存在或不存在的值
type Option[T any] struct {
    value   T
    present bool
}

func Some[T any](value T) Option[T] {
    return Option[T]{value: value, present: true}
}

func None[T any]() Option[T] {
    return Option[T]{present: false}
}

func (o Option[T]) IsSome() bool {
    return o.present
}

func (o Option[T]) IsNone() bool {
    return !o.present
}

func (o Option[T]) Unwrap() T {
    if !o.present {
        panic("called Unwrap on None value")
    }
    return o.value
}

func (o Option[T]) UnwrapOr(defaultValue T) T {
    if o.present {
        return o.value
    }
    return defaultValue
}

func (o Option[T]) Map(fn func(T) T) Option[T] {
    if o.present {
        return Some(fn(o.value))
    }
    return None[T]()
}

// 使用示例
func FindUser(id int) Option[string] {
    users := map[int]string{
        1: "Alice",
        2: "Bob",
        3: "Charlie",
    }

    if name, ok := users[id]; ok {
        return Some(name)
    }
    return None[string]()
}

func main() {
    // 找到用户
    user1 := FindUser(1)
    if user1.IsSome() {
        fmt.Println("Found:", user1.Unwrap()) // Found: Alice
    }

    // 未找到用户
    user99 := FindUser(99)
    fmt.Println("User 99:", user99.UnwrapOr("Unknown")) // User 99: Unknown

    // 使用 Map 转换
    upperUser := user1.Map(func(name string) string {
        return strings.ToUpper(name)
    })
    fmt.Println("Upper:", upperUser.Unwrap()) // Upper: ALICE
}
```

### 泛型 Result 类型

```go
// Result 类型 - 表示成功或错误
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

func (r Result[T]) Unwrap() T {
    if r.err != nil {
        panic(fmt.Sprintf("called Unwrap on Err value: %v", r.err))
    }
    return r.value
}

func (r Result[T]) UnwrapOr(defaultValue T) T {
    if r.err != nil {
        return defaultValue
    }
    return r.value
}

func (r Result[T]) Error() error {
    return r.err
}

// 使用示例
func Divide(a, b float64) Result[float64] {
    if b == 0 {
        return Err[float64](fmt.Errorf("division by zero"))
    }
    return Ok(a / b)
}

func ParseInt(s string) Result[int] {
    val, err := strconv.Atoi(s)
    if err != nil {
        return Err[int](err)
    }
    return Ok(val)
}

func main() {
    // 成功的除法
    result1 := Divide(10, 2)
    if result1.IsOk() {
        fmt.Println("Result:", result1.Unwrap()) // Result: 5
    }

    // 除以零
    result2 := Divide(10, 0)
    if result2.IsErr() {
        fmt.Println("Error:", result2.Error()) // Error: division by zero
    }
    fmt.Println("Result:", result2.UnwrapOr(0)) // Result: 0

    // 解析整数
    num := ParseInt("123")
    if num.IsOk() {
        fmt.Println("Parsed:", num.Unwrap()) // Parsed: 123
    }

    invalid := ParseInt("abc")
    if invalid.IsErr() {
        fmt.Println("Parse error:", invalid.Error())
    }
}
```

### 泛型缓存

```go
// 泛型 LRU 缓存（简化版）
type LRUCache[K comparable, V any] struct {
    capacity int
    cache    map[K]*cacheEntry[V]
    order    []K
}

type cacheEntry[V any] struct {
    value V
}

func NewLRUCache[K comparable, V any](capacity int) *LRUCache[K, V] {
    return &LRUCache[K, V]{
        capacity: capacity,
        cache:    make(map[K]*cacheEntry[V]),
        order:    make([]K, 0, capacity),
    }
}

func (c *LRUCache[K, V]) Get(key K) (V, bool) {
    entry, ok := c.cache[key]
    if !ok {
        var zero V
        return zero, false
    }

    // 移到最前面（最近使用）
    c.moveToFront(key)
    return entry.value, true
}

func (c *LRUCache[K, V]) Put(key K, value V) {
    if _, ok := c.cache[key]; ok {
        c.cache[key].value = value
        c.moveToFront(key)
        return
    }

    // 如果缓存已满，删除最久未使用的
    if len(c.cache) >= c.capacity {
        oldest := c.order[len(c.order)-1]
        delete(c.cache, oldest)
        c.order = c.order[:len(c.order)-1]
    }

    c.cache[key] = &cacheEntry[V]{value: value}
    c.order = append([]K{key}, c.order...)
}

func (c *LRUCache[K, V]) moveToFront(key K) {
    for i, k := range c.order {
        if k == key {
            c.order = append([]K{key}, append(c.order[:i], c.order[i+1:]...)...)
            break
        }
    }
}

func main() {
    // 字符串到整数的缓存
    cache := NewLRUCache[string, int](3)

    cache.Put("a", 1)
    cache.Put("b", 2)
    cache.Put("c", 3)

    if val, ok := cache.Get("a"); ok {
        fmt.Println("a:", val) // a: 1
    }

    cache.Put("d", 4) // 会删除最久未使用的 "b"

    if _, ok := cache.Get("b"); !ok {
        fmt.Println("b was evicted") // b was evicted
    }
}
```

## 泛型的最佳实践

### 何时使用泛型

**适合使用泛型**：
- 实现通用的数据结构（栈、队列、树等）
- 编写适用于多种类型的工具函数
- 类型安全的容器和集合
- 需要避免类型断言和反射的场景

```go
// 好的使用场景：通用数据结构
type Queue[T any] struct {
    items []T
}

// 好的使用场景：通用工具函数
func Reverse[T any](slice []T) []T {
    result := make([]T, len(slice))
    for i, v := range slice {
        result[len(slice)-1-i] = v
    }
    return result
}
```

**不适合使用泛型**：
- 只用于一两种类型时
- 增加复杂性而无明显收益时
- 使用 interface{} 更简单时

```go
// 不好的使用：过度泛型化
func Add[T int | float64](a, b T) T {
    return a + b
}

// 更好：直接写两个函数
func AddInt(a, b int) int {
    return a + b
}

func AddFloat64(a, b float64) float64 {
    return a + b
}
```

### 选择合适的约束

```go
// 约束太宽松
func Process[T any](value T) {
    // 无法对 T 进行任何操作
}

// 约束太严格
func OnlyInts[T int](value T) T {
    return value * 2
}

// 合适的约束
type Number interface {
    ~int | ~int64 | ~float64
}

func Double[T Number](value T) T {
    return value * 2
}
```

### 命名约定

```go
// 单个类型参数：使用 T
func First[T any](slice []T) T {
    return slice[0]
}

// 键值对：使用 K 和 V
func Keys[K comparable, V any](m map[K]V) []K {
    keys := make([]K, 0, len(m))
    for k := range m {
        keys = append(keys, k)
    }
    return keys
}

// 多个不同类型：使用描述性名称
func Transform[Input any, Output any](value Input, fn func(Input) Output) Output {
    return fn(value)
}
```

### 避免过度泛型化

```go
// 过度泛型化
type Container[T any, U any, V any] struct {
    first  T
    second U
    third  V
}

// 更好：按需定义
type Pair[T any, U any] struct {
    First  T
    Second U
}

type Triple[T any, U any, V any] struct {
    First  T
    Second U
    Third  V
}
```

### 文档和示例

为泛型函数和类型添加清晰的文档：

```go
// Max 返回切片中的最大值。
// 类型参数 T 必须是可排序的类型。
// 如果切片为空，返回该类型的零值。
//
// 示例：
//   numbers := []int{1, 5, 3, 9, 2}
//   max := Max(numbers) // 返回 9
func Max[T Ordered](values []T) T {
    if len(values) == 0 {
        var zero T
        return zero
    }

    max := values[0]
    for _, v := range values[1:] {
        if v > max {
            max = v
        }
    }
    return max
}
```

## 性能考虑

### 泛型的性能

Go 泛型使用**单态化（Monomorphization）** 和 **GCShape stenciling** 的混合方法：

- 编译器为不同的类型生成专门的代码
- 相似的类型可能共享代码
- 性能通常接近手写的类型特定代码

```go
// 泛型版本
func Sum[T Number](values []T) T {
    var sum T
    for _, v := range values {
        sum += v
    }
    return sum
}

// 性能通常与手写版本相当
func SumInt(values []int) int {
    var sum int
    for _, v := range values {
        sum += v
    }
    return sum
}
```

### 基准测试示例

```go
func BenchmarkGenericSum(b *testing.B) {
    numbers := make([]int, 1000)
    for i := range numbers {
        numbers[i] = i
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _ = Sum(numbers)
    }
}

func BenchmarkSpecificSum(b *testing.B) {
    numbers := make([]int, 1000)
    for i := range numbers {
        numbers[i] = i
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _ = SumInt(numbers)
    }
}
```

## 常见陷阱和解决方案

### 不能使用类型参数作为类型断言

```go
// 错误：不能这样做
func GetValue[T any](value interface{}) T {
    return value.(T) // 编译错误
}

// 正确：使用类型参数的零值
func GetValue[T any](value interface{}) (T, bool) {
    v, ok := value.(T)
    return v, ok
}
```

### 方法不能有类型参数

```go
// 错误：方法不能有自己的类型参数
type Container[T any] struct {
    value T
}

// 这样不行
// func (c Container[T]) Transform[U any](fn func(T) U) U {
//     return fn(c.value)
// }

// 正确：在结构体级别定义类型参数
type Container2[T any, U any] struct {
    value T
    fn    func(T) U
}

func (c Container2[T, U]) Transform() U {
    return c.fn(c.value)
}
```

### 泛型类型必须指定类型参数

```go
// 错误：泛型类型必须实例化
// var stack Stack // 编译错误

// 正确
var stack Stack[int]
var stack2 Stack[string]
```

## 总结

Go 泛型为语言带来了强大的代码重用能力，同时保持了类型安全：

**核心概念**：
- **类型参数**：`[T any]` 语法定义泛型
- **类型约束**：限制可用类型（`any`、`comparable`、自定义接口）
- **类型集**：使用 `|` 和 `~` 定义类型集合
- **类型推断**：编译器自动推断类型参数

**适用场景**：
- 通用数据结构（容器、集合）
- 工具函数（映射、过滤、归约）
- 类型安全的包装器
- 避免代码重复

**最佳实践**：
- 仅在真正需要时使用泛型
- 选择合适的约束级别
- 使用清晰的命名约定
- 提供完善的文档
- 避免过度泛型化

Go 泛型让我们能够编写更简洁、类型安全且可重用的代码，是现代 Go 开发的重要工具。
