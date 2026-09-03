---
title: Go 语言 Map 详解
description: 深入理解 Go 语言中的 map 数据结构：创建、操作、迭代、comma ok 惯用法及底层实现原理
track: go
section: types-interfaces
difficulty: intermediate
tags:
  - Go
  - Map
  - 哈希表
  - 数据结构
status: imported
origin: old/src/content/docs/go/maps.zh.md
divergence: 0.192
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 复合类型
  order: 5
  lastUpdated: 2026-01-07
---

## 概念解释

Map 是 Go 语言中的一种内置数据结构，也称为字典、哈希表或关联数组。它提供了键值对（key-value pair）的存储方式，能够通过键快速查找对应的值。

### 什么是 Map

Map 是一种无序的键值对集合，其中每个键都是唯一的。在 Go 中，map 的类型表示为 `map[KeyType]ValueType`，其中：

- `KeyType`：键的类型，必须是可比较的类型（支持 `==` 和 `!=` 操作）
- `ValueType`：值的类型，可以是任意类型

```go
// map 类型声明示例
var ages map[string]int           // 键为 string，值为 int
var scores map[int]float64        // 键为 int，值为 float64
var config map[string]interface{} // 键为 string，值为任意类型
```

### Map 解决的问题

Map 主要解决以下问题：

1. **快速查找**：通过键在 O(1) 平均时间复杂度内查找值
2. **去重存储**：键的唯一性保证了数据不会重复
3. **关联存储**：将相关的数据通过键值对的形式组织在一起
4. **动态扩容**：自动处理容量增长，无需手动管理内存

### 可作为键的类型

在 Go 中，只有可比较的类型才能作为 map 的键：

```go
// 可以作为键的类型
map[string]int    // 字符串
map[int]string    // 整数
map[float64]bool  // 浮点数（不推荐，精度问题）
map[bool]string   // 布尔值
map[[3]int]string // 数组（固定长度）

// 不能作为键的类型
// map[[]int]string     // 切片（编译错误）
// map[map[int]int]int  // map（编译错误）
// map[func()]int       // 函数（编译错误）
```

## 核心原理

### Map 的底层结构

Go 语言的 map 底层实现是哈希表（Hash Table）。在 `runtime/map.go` 中，map 的核心结构定义如下：

```go
// hmap 是 map 的运行时表示
type hmap struct {
    count     int    // 元素个数
    flags     uint8  // 状态标志
    B         uint8  // 桶的对数（buckets 数量 = 2^B）
    noverflow uint16 // 溢出桶的近似数量
    hash0     uint32 // 哈希种子

    buckets    unsafe.Pointer // 桶数组指针
    oldbuckets unsafe.Pointer // 扩容时的旧桶数组
    nevacuate  uintptr        // 扩容进度
    extra      *mapextra      // 溢出桶相关
}

// bmap 是桶的结构
type bmap struct {
    tophash [8]uint8 // 存储键哈希值的高 8 位
    // 后面紧跟 8 个键和 8 个值
    // keys   [8]keyType
    // values [8]valueType
    // overflow *bmap // 溢出桶指针
}
```

### 哈希计算与定位

当对 map 进行操作时，Go 会经历以下步骤：

```
1. 计算键的哈希值（使用 hash0 作为种子）
2. 用哈希值的低 B 位确定桶的索引
3. 用哈希值的高 8 位（tophash）在桶内快速定位
4. 比较完整的键来确认匹配
```

```go
// 哈希定位过程示意
func mapAccess(key string) {
    // 1. 计算哈希值
    hash := hashFunc(key, h.hash0)

    // 2. 定位桶
    bucketIndex := hash & (1<<h.B - 1)  // 低 B 位
    bucket := h.buckets[bucketIndex]

    // 3. 在桶内搜索
    tophash := uint8(hash >> 56)  // 高 8 位
    for i := 0; i < 8; i++ {
        if bucket.tophash[i] == tophash {
            // 4. 比较完整的键
            if bucket.keys[i] == key {
                return bucket.values[i]
            }
        }
    }

    // 5. 检查溢出桶
    // ...
}
```

### 扩容机制

Map 在以下情况会触发扩容：

1. **负载因子过大**：元素数量 / 桶数量 > 6.5（翻倍扩容）
2. **溢出桶过多**：溢出桶数量 >= 桶数量（等量扩容，整理数据）

```go
// 扩容条件判断
func tooManyOverflowBuckets(noverflow uint16, B uint8) bool {
    if B > 15 {
        B = 15
    }
    return noverflow >= uint16(1)<<(B&15)
}

// 负载因子
const loadFactorNum = 13
const loadFactorDen = 2
// loadFactor = 13/2 = 6.5
```

扩容采用**渐进式扩容**策略，不会一次性迁移所有数据，而是在每次访问时迁移一部分：

```go
// 每次操作时迁移数据
func growWork(t *maptype, h *hmap, bucket uintptr) {
    // 迁移当前操作的桶
    evacuate(t, h, bucket&h.oldbucketmask())

    // 额外迁移一个桶
    if h.growing() {
        evacuate(t, h, h.nevacuate)
    }
}
```

## 核心要点

### Map 的特性

| 特性 | 说明 |
|------|------|
| 引用类型 | map 是引用类型，传递时不会复制数据 |
| 非线程安全 | 并发读写需要加锁或使用 sync.Map |
| 无序性 | 遍历顺序是随机的，不保证顺序 |
| 零值为 nil | 未初始化的 map 为 nil，不能直接使用 |
| 动态增长 | 自动扩容，无需手动管理容量 |
| 键唯一 | 相同的键会覆盖之前的值 |

### 关键操作的时间复杂度

| 操作 | 平均时间复杂度 | 最坏时间复杂度 |
|------|---------------|---------------|
| 查找 | O(1) | O(n) |
| 插入 | O(1) | O(n) |
| 删除 | O(1) | O(n) |
| 遍历 | O(n) | O(n) |

### 零值与 nil map

```go
func main() {
    // nil map
    var m1 map[string]int
    fmt.Println(m1 == nil)     // true
    fmt.Println(len(m1))       // 0
    fmt.Println(m1["key"])     // 0（返回值类型的零值）
    // m1["key"] = 1           // panic: 不能向 nil map 写入

    // 空 map（已初始化）
    m2 := map[string]int{}
    fmt.Println(m2 == nil)     // false
    fmt.Println(len(m2))       // 0
    m2["key"] = 1              // 正常工作

    // 使用 make 创建
    m3 := make(map[string]int)
    fmt.Println(m3 == nil)     // false
}
```

## 代码示例

### Map 的创建

```go
package main

import "fmt"

func main() {
    // 方式 1: 使用 make 函数创建
    ages := make(map[string]int)
    ages["Alice"] = 25
    ages["Bob"] = 30

    // 方式 2: 使用 make 并指定初始容量（推荐）
    scores := make(map[string]float64, 100) // 预分配 100 个元素的空间
    scores["Math"] = 95.5
    scores["English"] = 88.0

    // 方式 3: 使用字面量创建
    colors := map[string]string{
        "red":   "#FF0000",
        "green": "#00FF00",
        "blue":  "#0000FF",
    }

    // 方式 4: 空 map 字面量
    empty := map[string]int{}

    // 方式 5: 嵌套 map
    students := map[string]map[string]int{
        "class1": {
            "Alice": 90,
            "Bob":   85,
        },
        "class2": {
            "Carol": 92,
            "David": 88,
        },
    }

    fmt.Println("ages:", ages)
    fmt.Println("scores:", scores)
    fmt.Println("colors:", colors)
    fmt.Println("empty:", empty)
    fmt.Println("students:", students)
}
```

### 基本操作

```go
package main

import "fmt"

func main() {
    // 创建 map
    person := make(map[string]interface{})

    // 添加/修改元素
    person["name"] = "张三"
    person["age"] = 28
    person["city"] = "北京"
    person["hobbies"] = []string{"读书", "游泳"}

    fmt.Println("初始数据:", person)

    // 访问元素
    name := person["name"]
    fmt.Println("姓名:", name)

    // 获取 map 长度
    fmt.Println("元素个数:", len(person))

    // 修改元素
    person["age"] = 29
    fmt.Println("修改后:", person)

    // 删除元素
    delete(person, "city")
    fmt.Println("删除后:", person)

    // 删除不存在的键（不会报错）
    delete(person, "nonexistent")

    // 清空 map（Go 1.21+）
    // clear(person)

    // 传统清空方式
    for key := range person {
        delete(person, key)
    }
    fmt.Println("清空后:", person, "长度:", len(person))
}
```

### Comma Ok 惯用法

Comma ok 惯用法是 Go 中检查 map 键是否存在的标准方式：

```go
package main

import "fmt"

func main() {
    inventory := map[string]int{
        "apple":  100,
        "banana": 50,
        "orange": 0, // 注意：值为 0 但键存在
    }

    // 方式 1: 直接访问（无法区分键不存在和值为零值）
    count1 := inventory["apple"]
    count2 := inventory["grape"] // 不存在，返回 0
    fmt.Printf("apple: %d, grape: %d\n", count1, count2)

    // 方式 2: comma ok 惯用法（推荐）
    if count, ok := inventory["apple"]; ok {
        fmt.Printf("apple 存在，数量: %d\n", count)
    } else {
        fmt.Println("apple 不存在")
    }

    // 区分键不存在和值为零
    if count, ok := inventory["orange"]; ok {
        fmt.Printf("orange 存在，数量: %d\n", count) // 输出: 数量 0
    }

    if count, ok := inventory["grape"]; ok {
        fmt.Printf("grape 存在，数量: %d\n", count)
    } else {
        fmt.Println("grape 不存在") // 输出这行
    }

    // 只检查存在性
    if _, exists := inventory["banana"]; exists {
        fmt.Println("banana 在库存中")
    }

    // 实际应用：安全获取值
    getInventory := func(item string) int {
        if count, ok := inventory[item]; ok {
            return count
        }
        return -1 // 表示不存在
    }

    fmt.Println("mango 库存:", getInventory("mango"))
}
```

### Map 的迭代

```go
package main

import (
    "fmt"
    "sort"
)

func main() {
    scores := map[string]int{
        "Alice":   95,
        "Bob":     87,
        "Carol":   92,
        "David":   88,
        "Eve":     91,
    }

    // 遍历键和值
    fmt.Println("=== 遍历键值对 ===")
    for name, score := range scores {
        fmt.Printf("%s: %d\n", name, score)
    }

    // 只遍历键
    fmt.Println("\n=== 只遍历键 ===")
    for name := range scores {
        fmt.Println(name)
    }

    // 只遍历值
    fmt.Println("\n=== 只遍历值 ===")
    for _, score := range scores {
        fmt.Println(score)
    }

    // 有序遍历（先排序键）
    fmt.Println("\n=== 按键排序遍历 ===")
    keys := make([]string, 0, len(scores))
    for k := range scores {
        keys = append(keys, k)
    }
    sort.Strings(keys)

    for _, k := range keys {
        fmt.Printf("%s: %d\n", k, scores[k])
    }

    // 按值排序遍历
    fmt.Println("\n=== 按值排序遍历 ===")
    type kv struct {
        Key   string
        Value int
    }

    pairs := make([]kv, 0, len(scores))
    for k, v := range scores {
        pairs = append(pairs, kv{k, v})
    }

    sort.Slice(pairs, func(i, j int) bool {
        return pairs[i].Value > pairs[j].Value // 降序
    })

    for _, pair := range pairs {
        fmt.Printf("%s: %d\n", pair.Key, pair.Value)
    }
}
```

### 复杂数据结构

```go
package main

import "fmt"

// 使用结构体作为值
type Person struct {
    Name    string
    Age     int
    Email   string
    Address Address
}

type Address struct {
    City    string
    Country string
}

func main() {
    // map 的值为结构体
    employees := make(map[int]Person)

    employees[1001] = Person{
        Name:  "张三",
        Age:   30,
        Email: "zhangsan@example.com",
        Address: Address{
            City:    "北京",
            Country: "中国",
        },
    }

    employees[1002] = Person{
        Name:  "李四",
        Age:   28,
        Email: "lisi@example.com",
        Address: Address{
            City:    "上海",
            Country: "中国",
        },
    }

    // 访问嵌套字段
    fmt.Println("员工 1001 姓名:", employees[1001].Name)
    fmt.Println("员工 1001 城市:", employees[1001].Address.City)

    // 修改嵌套字段（需要整体替换）
    emp := employees[1001]
    emp.Age = 31
    emp.Address.City = "深圳"
    employees[1001] = emp

    fmt.Println("修改后:", employees[1001])

    // 使用指针避免复制
    employeesPtr := make(map[int]*Person)
    employeesPtr[1001] = &Person{Name: "王五", Age: 25}

    // 直接修改
    employeesPtr[1001].Age = 26
    fmt.Println("指针方式修改:", employeesPtr[1001])

    // 嵌套 map
    departments := map[string]map[string][]string{
        "技术部": {
            "后端组": {"张三", "李四"},
            "前端组": {"王五", "赵六"},
        },
        "产品部": {
            "产品组": {"孙七", "周八"},
        },
    }

    // 安全访问嵌套 map
    if dept, ok := departments["技术部"]; ok {
        if team, ok := dept["后端组"]; ok {
            fmt.Println("后端组成员:", team)
        }
    }

    // 向嵌套 map 添加数据
    if departments["技术部"] == nil {
        departments["技术部"] = make(map[string][]string)
    }
    departments["技术部"]["测试组"] = []string{"吴九"}

    fmt.Println("技术部:", departments["技术部"])
}
```

### Map 作为集合使用

```go
package main

import "fmt"

// 使用 map 实现集合
type Set map[string]struct{}

func NewSet() Set {
    return make(Set)
}

func (s Set) Add(item string) {
    s[item] = struct{}{}
}

func (s Set) Remove(item string) {
    delete(s, item)
}

func (s Set) Contains(item string) bool {
    _, ok := s[item]
    return ok
}

func (s Set) Size() int {
    return len(s)
}

func (s Set) Items() []string {
    items := make([]string, 0, len(s))
    for item := range s {
        items = append(items, item)
    }
    return items
}

// 集合运算
func (s Set) Union(other Set) Set {
    result := NewSet()
    for item := range s {
        result.Add(item)
    }
    for item := range other {
        result.Add(item)
    }
    return result
}

func (s Set) Intersection(other Set) Set {
    result := NewSet()
    for item := range s {
        if other.Contains(item) {
            result.Add(item)
        }
    }
    return result
}

func (s Set) Difference(other Set) Set {
    result := NewSet()
    for item := range s {
        if !other.Contains(item) {
            result.Add(item)
        }
    }
    return result
}

func main() {
    // 创建集合
    fruits := NewSet()
    fruits.Add("apple")
    fruits.Add("banana")
    fruits.Add("orange")
    fruits.Add("apple") // 重复添加无效

    fmt.Println("集合大小:", fruits.Size())
    fmt.Println("包含 apple:", fruits.Contains("apple"))
    fmt.Println("包含 grape:", fruits.Contains("grape"))

    // 集合运算
    tropical := NewSet()
    tropical.Add("banana")
    tropical.Add("mango")
    tropical.Add("pineapple")

    fmt.Println("\n水果集合:", fruits.Items())
    fmt.Println("热带水果:", tropical.Items())
    fmt.Println("并集:", fruits.Union(tropical).Items())
    fmt.Println("交集:", fruits.Intersection(tropical).Items())
    fmt.Println("差集:", fruits.Difference(tropical).Items())
}
```

## 最佳实践

### 预分配容量

当知道大致元素数量时，使用 `make` 预分配容量可以避免频繁扩容：

```go
// 推荐：预分配容量
userMap := make(map[int]User, 10000)

// 不推荐：频繁扩容
userMap := make(map[int]User)
for i := 0; i < 10000; i++ {
    userMap[i] = User{} // 多次触发扩容
}
```

### 检查键是否存在

始终使用 comma ok 惯用法检查键是否存在：

```go
// 推荐
if value, ok := m[key]; ok {
    // 键存在，使用 value
}

// 不推荐（无法区分键不存在和值为零值）
value := m[key]
if value != 0 {
    // 可能误判
}
```

### 安全操作嵌套 map

```go
// 不安全
data := make(map[string]map[string]int)
data["outer"]["inner"] = 1 // panic: 内层 map 为 nil

// 安全方式
data := make(map[string]map[string]int)
if data["outer"] == nil {
    data["outer"] = make(map[string]int)
}
data["outer"]["inner"] = 1
```

### 遍历时不要修改

```go
// 不推荐：遍历时修改可能导致未定义行为
for k := range m {
    if shouldDelete(k) {
        delete(m, k) // 可能有问题
    }
}

// 推荐：收集要删除的键，之后再删除
toDelete := []string{}
for k := range m {
    if shouldDelete(k) {
        toDelete = append(toDelete, k)
    }
}
for _, k := range toDelete {
    delete(m, k)
}
```

### 使用适当的键类型

```go
// 推荐：使用自定义类型增加类型安全
type UserID int
type ProductID int

users := make(map[UserID]User)
products := make(map[ProductID]Product)

// users[ProductID(1)] = User{} // 编译错误

// 不推荐：容易混淆
users := make(map[int]User)
products := make(map[int]Product)
```

## 常见陷阱

### 向 nil map 写入

```go
var m map[string]int
m["key"] = 1 // panic: assignment to entry in nil map

// 正确做法
m := make(map[string]int)
m["key"] = 1
```

### 并发读写

```go
package main

import (
    "sync"
)

func main() {
    m := make(map[int]int)

    // 错误：并发读写会 panic
    go func() {
        for i := 0; i < 1000; i++ {
            m[i] = i
        }
    }()

    go func() {
        for i := 0; i < 1000; i++ {
            _ = m[i]
        }
    }()

    // fatal error: concurrent map read and map write
}

// 正确做法 1：使用互斥锁
type SafeMap struct {
    mu sync.RWMutex
    m  map[int]int
}

func (sm *SafeMap) Set(key, value int) {
    sm.mu.Lock()
    defer sm.mu.Unlock()
    sm.m[key] = value
}

func (sm *SafeMap) Get(key int) (int, bool) {
    sm.mu.RLock()
    defer sm.mu.RUnlock()
    v, ok := sm.m[key]
    return v, ok
}

// 正确做法 2：使用 sync.Map
func useSyncMap() {
    var m sync.Map

    m.Store("key", "value")

    if v, ok := m.Load("key"); ok {
        _ = v.(string)
    }

    m.Delete("key")

    m.Range(func(key, value interface{}) bool {
        // 遍历所有键值对
        return true // 返回 false 停止遍历
    })
}
```

### 遍历顺序不确定

```go
m := map[string]int{
    "a": 1,
    "b": 2,
    "c": 3,
}

// 每次运行顺序可能不同
for k, v := range m {
    fmt.Println(k, v)
}

// 如需固定顺序，必须先排序键
```

### 值为结构体时的修改

```go
type Point struct {
    X, Y int
}

m := map[string]Point{
    "origin": {0, 0},
}

// 错误：不能直接修改 map 中结构体的字段
// m["origin"].X = 10 // 编译错误

// 正确做法 1：整体替换
p := m["origin"]
p.X = 10
m["origin"] = p

// 正确做法 2：使用指针
m2 := map[string]*Point{
    "origin": {0, 0},
}
m2["origin"].X = 10 // 正确
```

### 比较 map

```go
m1 := map[string]int{"a": 1}
m2 := map[string]int{"a": 1}

// 错误：map 不能直接比较
// if m1 == m2 {} // 编译错误

// 只能与 nil 比较
if m1 == nil {}

// 正确做法：使用 reflect.DeepEqual 或手动比较
import "reflect"
equal := reflect.DeepEqual(m1, m2)

// 或者手动比较
func mapsEqual(m1, m2 map[string]int) bool {
    if len(m1) != len(m2) {
        return false
    }
    for k, v := range m1 {
        if v2, ok := m2[k]; !ok || v != v2 {
            return false
        }
    }
    return true
}
```

### 浮点数作为键

```go
// 不推荐：浮点数精度问题
m := map[float64]string{}
m[0.1+0.2] = "a"
m[0.3] = "b"

// 0.1 + 0.2 != 0.3（浮点数精度问题）
fmt.Println(0.1+0.2 == 0.3)  // false
fmt.Println(len(m))          // 2，不是 1
```

## 性能考量

### 内存占用

Map 的内存占用主要包括：

1. **hmap 结构体**：约 48 字节
2. **桶数组**：每个桶约 208 字节（对于 `map[string]int`）
3. **溢出桶**：额外的溢出桶占用

```go
package main

import (
    "fmt"
    "runtime"
)

func main() {
    var m runtime.MemStats

    runtime.ReadMemStats(&m)
    before := m.Alloc

    data := make(map[int]int)
    for i := 0; i < 100000; i++ {
        data[i] = i
    }

    runtime.ReadMemStats(&m)
    after := m.Alloc

    fmt.Printf("100000 个元素占用内存: %d KB\n", (after-before)/1024)
    fmt.Printf("每个元素平均占用: %d 字节\n", (after-before)/100000)
}
```

### 基准测试

```go
package main

import (
    "testing"
)

var result int

func BenchmarkMapLookup(b *testing.B) {
    m := make(map[int]int, 1000)
    for i := 0; i < 1000; i++ {
        m[i] = i
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        result = m[i%1000]
    }
}

func BenchmarkMapInsert(b *testing.B) {
    m := make(map[int]int)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        m[i] = i
    }
}

func BenchmarkMapDelete(b *testing.B) {
    m := make(map[int]int, b.N)
    for i := 0; i < b.N; i++ {
        m[i] = i
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        delete(m, i)
    }
}

func BenchmarkMapWithPrealloc(b *testing.B) {
    b.Run("NoPrealloc", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            m := make(map[int]int)
            for j := 0; j < 1000; j++ {
                m[j] = j
            }
        }
    })

    b.Run("WithPrealloc", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            m := make(map[int]int, 1000)
            for j := 0; j < 1000; j++ {
                m[j] = j
            }
        }
    })
}
```

### 性能优化建议

1. **预分配容量**：减少扩容次数
2. **使用小的键**：减少哈希计算和比较开销
3. **避免频繁的 map 创建**：复用 map 对象
4. **考虑使用数组/切片**：如果键是连续整数，切片更高效
5. **大量数据考虑分片**：减少锁竞争

```go
// 分片 map 示例
type ShardedMap struct {
    shards [256]struct {
        sync.RWMutex
        m map[string]interface{}
    }
}

func (sm *ShardedMap) getShard(key string) *struct {
    sync.RWMutex
    m map[string]interface{}
} {
    hash := fnv32(key)
    return &sm.shards[hash%256]
}

func (sm *ShardedMap) Set(key string, value interface{}) {
    shard := sm.getShard(key)
    shard.Lock()
    defer shard.Unlock()
    shard.m[key] = value
}

func (sm *ShardedMap) Get(key string) (interface{}, bool) {
    shard := sm.getShard(key)
    shard.RLock()
    defer shard.RUnlock()
    v, ok := shard.m[key]
    return v, ok
}
```

## 实战场景

### 场景 1：缓存实现

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type CacheItem struct {
    Value      interface{}
    Expiration int64
}

type Cache struct {
    items map[string]CacheItem
    mu    sync.RWMutex
}

func NewCache() *Cache {
    c := &Cache{
        items: make(map[string]CacheItem),
    }
    go c.cleanupLoop()
    return c
}

func (c *Cache) Set(key string, value interface{}, ttl time.Duration) {
    c.mu.Lock()
    defer c.mu.Unlock()

    expiration := time.Now().Add(ttl).UnixNano()
    c.items[key] = CacheItem{
        Value:      value,
        Expiration: expiration,
    }
}

func (c *Cache) Get(key string) (interface{}, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()

    item, ok := c.items[key]
    if !ok {
        return nil, false
    }

    if time.Now().UnixNano() > item.Expiration {
        return nil, false
    }

    return item.Value, true
}

func (c *Cache) Delete(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    delete(c.items, key)
}

func (c *Cache) cleanupLoop() {
    ticker := time.NewTicker(time.Minute)
    for range ticker.C {
        c.cleanup()
    }
}

func (c *Cache) cleanup() {
    c.mu.Lock()
    defer c.mu.Unlock()

    now := time.Now().UnixNano()
    for key, item := range c.items {
        if now > item.Expiration {
            delete(c.items, key)
        }
    }
}

func main() {
    cache := NewCache()

    cache.Set("user:1", "张三", 5*time.Second)

    if value, ok := cache.Get("user:1"); ok {
        fmt.Println("缓存命中:", value)
    }

    time.Sleep(6 * time.Second)

    if _, ok := cache.Get("user:1"); !ok {
        fmt.Println("缓存已过期")
    }
}
```

### 场景 2：计数器和统计

```go
package main

import (
    "fmt"
    "strings"
)

func main() {
    text := `Go is an open source programming language that makes
    it easy to build simple reliable and efficient software.
    Go is designed at Google.`

    // 词频统计
    wordCount := make(map[string]int)
    words := strings.Fields(strings.ToLower(text))

    for _, word := range words {
        // 清理标点符号
        word = strings.Trim(word, ".,!?;:")
        wordCount[word]++
    }

    fmt.Println("词频统计:")
    for word, count := range wordCount {
        if count > 1 {
            fmt.Printf("  %s: %d\n", word, count)
        }
    }

    // 字符频率统计
    charCount := make(map[rune]int)
    for _, char := range text {
        if char != ' ' && char != '\n' {
            charCount[char]++
        }
    }

    fmt.Println("\n字符频率 (前5):")
    // 找出出现最多的字符
    type charFreq struct {
        char  rune
        count int
    }
    freqs := make([]charFreq, 0, len(charCount))
    for char, count := range charCount {
        freqs = append(freqs, charFreq{char, count})
    }

    // 简单排序
    for i := 0; i < len(freqs)-1; i++ {
        for j := i + 1; j < len(freqs); j++ {
            if freqs[j].count > freqs[i].count {
                freqs[i], freqs[j] = freqs[j], freqs[i]
            }
        }
    }

    for i := 0; i < 5 && i < len(freqs); i++ {
        fmt.Printf("  '%c': %d\n", freqs[i].char, freqs[i].count)
    }
}
```

### 场景 3：路由映射

```go
package main

import (
    "fmt"
    "net/http"
    "strings"
)

type HandlerFunc func(w http.ResponseWriter, r *http.Request, params map[string]string)

type Router struct {
    routes map[string]map[string]HandlerFunc // method -> path -> handler
}

func NewRouter() *Router {
    return &Router{
        routes: make(map[string]map[string]HandlerFunc),
    }
}

func (r *Router) Handle(method, path string, handler HandlerFunc) {
    if r.routes[method] == nil {
        r.routes[method] = make(map[string]HandlerFunc)
    }
    r.routes[method][path] = handler
}

func (r *Router) GET(path string, handler HandlerFunc) {
    r.Handle("GET", path, handler)
}

func (r *Router) POST(path string, handler HandlerFunc) {
    r.Handle("POST", path, handler)
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
    method := req.Method
    path := req.URL.Path

    if handlers, ok := r.routes[method]; ok {
        // 简单路由匹配
        for pattern, handler := range handlers {
            if params, matched := matchPath(pattern, path); matched {
                handler(w, req, params)
                return
            }
        }
    }

    http.NotFound(w, req)
}

func matchPath(pattern, path string) (map[string]string, bool) {
    patternParts := strings.Split(pattern, "/")
    pathParts := strings.Split(path, "/")

    if len(patternParts) != len(pathParts) {
        return nil, false
    }

    params := make(map[string]string)
    for i, part := range patternParts {
        if strings.HasPrefix(part, ":") {
            params[part[1:]] = pathParts[i]
        } else if part != pathParts[i] {
            return nil, false
        }
    }

    return params, true
}

func main() {
    router := NewRouter()

    router.GET("/users/:id", func(w http.ResponseWriter, r *http.Request, params map[string]string) {
        fmt.Fprintf(w, "获取用户: %s\n", params["id"])
    })

    router.POST("/users", func(w http.ResponseWriter, r *http.Request, params map[string]string) {
        fmt.Fprintf(w, "创建用户\n")
    })

    router.GET("/users/:id/posts/:postId", func(w http.ResponseWriter, r *http.Request, params map[string]string) {
        fmt.Fprintf(w, "用户 %s 的文章 %s\n", params["id"], params["postId"])
    })

    fmt.Println("服务器启动在 :8080")
    http.ListenAndServe(":8080", router)
}
```

### 场景 4：配置管理

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
    "strconv"
    "sync"
)

type Config struct {
    data map[string]interface{}
    mu   sync.RWMutex
}

func NewConfig() *Config {
    return &Config{
        data: make(map[string]interface{}),
    }
}

func (c *Config) LoadFromJSON(filename string) error {
    c.mu.Lock()
    defer c.mu.Unlock()

    file, err := os.ReadFile(filename)
    if err != nil {
        return err
    }

    return json.Unmarshal(file, &c.data)
}

func (c *Config) Get(key string) (interface{}, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()

    value, ok := c.data[key]
    return value, ok
}

func (c *Config) GetString(key string, defaultValue string) string {
    if value, ok := c.Get(key); ok {
        if str, ok := value.(string); ok {
            return str
        }
    }
    return defaultValue
}

func (c *Config) GetInt(key string, defaultValue int) int {
    if value, ok := c.Get(key); ok {
        switch v := value.(type) {
        case float64:
            return int(v)
        case int:
            return v
        case string:
            if i, err := strconv.Atoi(v); err == nil {
                return i
            }
        }
    }
    return defaultValue
}

func (c *Config) GetBool(key string, defaultValue bool) bool {
    if value, ok := c.Get(key); ok {
        if b, ok := value.(bool); ok {
            return b
        }
    }
    return defaultValue
}

func (c *Config) Set(key string, value interface{}) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = value
}

func (c *Config) GetNested(keys ...string) (interface{}, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()

    var current interface{} = c.data
    for _, key := range keys {
        if m, ok := current.(map[string]interface{}); ok {
            if value, ok := m[key]; ok {
                current = value
            } else {
                return nil, false
            }
        } else {
            return nil, false
        }
    }
    return current, true
}

func main() {
    config := NewConfig()

    // 模拟配置数据
    config.Set("app_name", "MyApp")
    config.Set("port", 8080)
    config.Set("debug", true)
    config.Set("database", map[string]interface{}{
        "host":     "localhost",
        "port":     5432,
        "name":     "mydb",
        "user":     "admin",
        "password": "secret",
    })

    fmt.Println("应用名称:", config.GetString("app_name", "DefaultApp"))
    fmt.Println("端口:", config.GetInt("port", 3000))
    fmt.Println("调试模式:", config.GetBool("debug", false))

    if dbHost, ok := config.GetNested("database", "host"); ok {
        fmt.Println("数据库主机:", dbHost)
    }

    if dbPort, ok := config.GetNested("database", "port"); ok {
        fmt.Println("数据库端口:", dbPort)
    }
}
```

## 面试要点

### 常见面试问题

**1. Map 的底层实现是什么？**

Go 的 map 底层是哈希表，由 hmap 结构体和 bmap（桶）组成。每个桶可以存储 8 个键值对，使用链地址法处理哈希冲突（溢出桶）。

**2. Map 是否线程安全？如何实现并发安全的 map？**

Map 不是线程安全的。并发安全可以通过以下方式实现：
- 使用 `sync.Mutex` 或 `sync.RWMutex` 加锁
- 使用 `sync.Map`（适合读多写少场景）
- 使用分片 map 减少锁竞争

**3. 为什么遍历 map 的顺序是随机的？**

Go 故意将遍历顺序随机化，防止开发者依赖特定的遍历顺序。每次遍历从随机的桶开始，随机的位置开始。

**4. Map 的扩容机制是什么？**

触发条件：
- 负载因子超过 6.5（翻倍扩容）
- 溢出桶过多（等量扩容）

扩容采用渐进式迁移，不会一次性完成，而是在每次访问时迁移部分数据。

**5. 哪些类型可以作为 map 的键？**

只有可比较的类型可以作为键，包括：布尔、数值、字符串、指针、通道、接口、结构体（所有字段可比较）、数组（元素可比较）。不可以：切片、map、函数。

**6. 如何判断 map 中某个键是否存在？**

使用 comma ok 惯用法：
```go
if value, ok := m[key]; ok {
    // 键存在
}
```

**7. Map 的零值是什么？可以对零值 map 进行操作吗？**

Map 的零值是 nil。可以读取（返回值类型的零值）和删除，但不能写入（会 panic）。

### 代码题

**实现 LRU 缓存**

```go
type LRUCache struct {
    capacity int
    cache    map[int]*Node
    head     *Node
    tail     *Node
}

type Node struct {
    key, value int
    prev, next *Node
}

func Constructor(capacity int) LRUCache {
    head := &Node{}
    tail := &Node{}
    head.next = tail
    tail.prev = head

    return LRUCache{
        capacity: capacity,
        cache:    make(map[int]*Node),
        head:     head,
        tail:     tail,
    }
}

func (this *LRUCache) Get(key int) int {
    if node, ok := this.cache[key]; ok {
        this.moveToHead(node)
        return node.value
    }
    return -1
}

func (this *LRUCache) Put(key int, value int) {
    if node, ok := this.cache[key]; ok {
        node.value = value
        this.moveToHead(node)
        return
    }

    node := &Node{key: key, value: value}
    this.cache[key] = node
    this.addToHead(node)

    if len(this.cache) > this.capacity {
        removed := this.removeTail()
        delete(this.cache, removed.key)
    }
}

func (this *LRUCache) addToHead(node *Node) {
    node.prev = this.head
    node.next = this.head.next
    this.head.next.prev = node
    this.head.next = node
}

func (this *LRUCache) removeNode(node *Node) {
    node.prev.next = node.next
    node.next.prev = node.prev
}

func (this *LRUCache) moveToHead(node *Node) {
    this.removeNode(node)
    this.addToHead(node)
}

func (this *LRUCache) removeTail() *Node {
    node := this.tail.prev
    this.removeNode(node)
    return node
}
```

## 延伸阅读

### 官方资源

- [Go 官方文档 - Maps](https://go.dev/blog/maps)
- [Go 语言规范 - Map 类型](https://go.dev/ref/spec#Map_types)
- [Effective Go - Maps](https://go.dev/doc/effective_go#maps)

### 源码阅读

- [runtime/map.go](https://github.com/golang/go/blob/master/src/runtime/map.go) - Map 的运行时实现
- [sync/map.go](https://github.com/golang/go/blob/master/src/sync/map.go) - 并发安全 Map

### 推荐文章

- [深入理解 Go Map](https://draveness.me/golang/docs/part2-foundation/ch03-datastructure/golang-hashmap/)
- [Go 语言设计与实现 - 哈希表](https://draveness.me/golang/docs/part2-foundation/ch03-datastructure/golang-hashmap/)
- [Go Maps in Action](https://go.dev/blog/maps)

### 相关数据结构

- **sync.Map**：并发安全的 map 实现
- **container/list**：双向链表，常与 map 配合实现 LRU
- **sort 包**：用于 map 键排序

---

> Map 是 Go 语言中使用频率最高的数据结构之一。理解其底层原理和最佳实践，能够帮助你编写更高效、更安全的代码。建议通过实际项目练习，加深对 map 各种用法的理解。
