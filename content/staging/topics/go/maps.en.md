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
origin: old/src/content/docs/go/maps.en.md
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

## Concept Explanation

Map is a built-in data structure in Go, also known as dictionary, hash table, or associative array. It provides key-value pair storage that enables fast lookup of values by their keys.

### What is a Map

A map is an unordered collection of key-value pairs where each key is unique. In Go, map types are expressed as `map[KeyType]ValueType`, where:

- `KeyType`: The type of the key, must be a comparable type (supports `==` and `!=` operations)
- `ValueType`: The type of the value, can be any type

```go
// Map type declaration examples
var ages map[string]int           // Key is string, value is int
var scores map[int]float64        // Key is int, value is float64
var config map[string]interface{} // Key is string, value is any type
```

### Problems Maps Solve

Maps primarily solve the following problems:

1. **Fast Lookup**: Find values by key in O(1) average time complexity
2. **Unique Storage**: Key uniqueness ensures no duplicate data
3. **Associative Storage**: Organize related data together through key-value pairs
4. **Dynamic Resizing**: Automatically handles capacity growth without manual memory management

### Types That Can Be Used as Keys

In Go, only comparable types can be used as map keys:

```go
// Types that can be used as keys
map[string]int    // String
map[int]string    // Integer
map[float64]bool  // Floating point (not recommended due to precision issues)
map[bool]string   // Boolean
map[[3]int]string // Array (fixed length)

// Types that cannot be used as keys
// map[[]int]string     // Slice (compile error)
// map[map[int]int]int  // Map (compile error)
// map[func()]int       // Function (compile error)
```

## Core Principles

### Map's Underlying Structure

Go's map implementation is based on a hash table. In `runtime/map.go`, the core map structure is defined as follows:

```go
// hmap is the runtime representation of a map
type hmap struct {
    count     int    // Number of elements
    flags     uint8  // Status flags
    B         uint8  // Log2 of number of buckets (bucket count = 2^B)
    noverflow uint16 // Approximate number of overflow buckets
    hash0     uint32 // Hash seed

    buckets    unsafe.Pointer // Pointer to bucket array
    oldbuckets unsafe.Pointer // Old bucket array during expansion
    nevacuate  uintptr        // Expansion progress
    extra      *mapextra      // Overflow bucket related
}

// bmap is the bucket structure
type bmap struct {
    tophash [8]uint8 // Stores the high 8 bits of key hash values
    // Followed by 8 keys and 8 values
    // keys   [8]keyType
    // values [8]valueType
    // overflow *bmap // Overflow bucket pointer
}
```

### Hash Calculation and Location

When operating on a map, Go goes through the following steps:

```
1. Calculate the key's hash value (using hash0 as seed)
2. Use the low B bits of the hash value to determine the bucket index
3. Use the high 8 bits of the hash value (tophash) for fast location within the bucket
4. Compare the complete key to confirm the match
```

```go
// Hash location process illustration
func mapAccess(key string) {
    // 1. Calculate hash value
    hash := hashFunc(key, h.hash0)

    // 2. Locate bucket
    bucketIndex := hash & (1<<h.B - 1)  // Low B bits
    bucket := h.buckets[bucketIndex]

    // 3. Search within bucket
    tophash := uint8(hash >> 56)  // High 8 bits
    for i := 0; i < 8; i++ {
        if bucket.tophash[i] == tophash {
            // 4. Compare complete key
            if bucket.keys[i] == key {
                return bucket.values[i]
            }
        }
    }

    // 5. Check overflow buckets
    // ...
}
```

### Expansion Mechanism

A map triggers expansion in the following situations:

1. **Load Factor Too High**: Element count / bucket count > 6.5 (double expansion)
2. **Too Many Overflow Buckets**: Overflow bucket count >= bucket count (same-size expansion, reorganize data)

```go
// Expansion condition check
func tooManyOverflowBuckets(noverflow uint16, B uint8) bool {
    if B > 15 {
        B = 15
    }
    return noverflow >= uint16(1)<<(B&15)
}

// Load factor
const loadFactorNum = 13
const loadFactorDen = 2
// loadFactor = 13/2 = 6.5
```

Expansion uses an **incremental expansion** strategy, not migrating all data at once, but migrating a portion during each access:

```go
// Migrate data during each operation
func growWork(t *maptype, h *hmap, bucket uintptr) {
    // Migrate the current operation's bucket
    evacuate(t, h, bucket&h.oldbucketmask())

    // Migrate one additional bucket
    if h.growing() {
        evacuate(t, h, h.nevacuate)
    }
}
```

## Key Points

### Map Characteristics

| Characteristic | Description |
|----------------|-------------|
| Reference Type | Map is a reference type, data is not copied when passed |
| Not Thread-Safe | Concurrent read/write requires locks or sync.Map |
| Unordered | Iteration order is random, order is not guaranteed |
| Zero Value is nil | Uninitialized map is nil, cannot be used directly |
| Dynamic Growth | Automatic expansion, no manual capacity management needed |
| Unique Keys | Same key overwrites previous value |

### Time Complexity of Key Operations

| Operation | Average Time Complexity | Worst Time Complexity |
|-----------|------------------------|----------------------|
| Lookup | O(1) | O(n) |
| Insert | O(1) | O(n) |
| Delete | O(1) | O(n) |
| Iterate | O(n) | O(n) |

### Zero Value and nil Map

```go
func main() {
    // nil map
    var m1 map[string]int
    fmt.Println(m1 == nil)     // true
    fmt.Println(len(m1))       // 0
    fmt.Println(m1["key"])     // 0 (returns zero value of value type)
    // m1["key"] = 1           // panic: cannot write to nil map

    // Empty map (initialized)
    m2 := map[string]int{}
    fmt.Println(m2 == nil)     // false
    fmt.Println(len(m2))       // 0
    m2["key"] = 1              // Works normally

    // Create using make
    m3 := make(map[string]int)
    fmt.Println(m3 == nil)     // false
}
```

## Code Examples

### Creating Maps

```go
package main

import "fmt"

func main() {
    // Method 1: Create using make function
    ages := make(map[string]int)
    ages["Alice"] = 25
    ages["Bob"] = 30

    // Method 2: Use make with initial capacity (recommended)
    scores := make(map[string]float64, 100) // Pre-allocate space for 100 elements
    scores["Math"] = 95.5
    scores["English"] = 88.0

    // Method 3: Create using literal
    colors := map[string]string{
        "red":   "#FF0000",
        "green": "#00FF00",
        "blue":  "#0000FF",
    }

    // Method 4: Empty map literal
    empty := map[string]int{}

    // Method 5: Nested map
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

### Basic Operations

```go
package main

import "fmt"

func main() {
    // Create map
    person := make(map[string]interface{})

    // Add/modify elements
    person["name"] = "Zhang San"
    person["age"] = 28
    person["city"] = "Beijing"
    person["hobbies"] = []string{"reading", "swimming"}

    fmt.Println("Initial data:", person)

    // Access elements
    name := person["name"]
    fmt.Println("Name:", name)

    // Get map length
    fmt.Println("Element count:", len(person))

    // Modify element
    person["age"] = 29
    fmt.Println("After modification:", person)

    // Delete element
    delete(person, "city")
    fmt.Println("After deletion:", person)

    // Deleting non-existent key (no error)
    delete(person, "nonexistent")

    // Clear map (Go 1.21+)
    // clear(person)

    // Traditional way to clear
    for key := range person {
        delete(person, key)
    }
    fmt.Println("After clearing:", person, "Length:", len(person))
}
```

### Comma Ok Idiom

The comma ok idiom is the standard way in Go to check if a map key exists:

```go
package main

import "fmt"

func main() {
    inventory := map[string]int{
        "apple":  100,
        "banana": 50,
        "orange": 0, // Note: value is 0 but key exists
    }

    // Method 1: Direct access (cannot distinguish between non-existent key and zero value)
    count1 := inventory["apple"]
    count2 := inventory["grape"] // Does not exist, returns 0
    fmt.Printf("apple: %d, grape: %d\n", count1, count2)

    // Method 2: Comma ok idiom (recommended)
    if count, ok := inventory["apple"]; ok {
        fmt.Printf("apple exists, count: %d\n", count)
    } else {
        fmt.Println("apple does not exist")
    }

    // Distinguish between non-existent key and zero value
    if count, ok := inventory["orange"]; ok {
        fmt.Printf("orange exists, count: %d\n", count) // Output: count 0
    }

    if count, ok := inventory["grape"]; ok {
        fmt.Printf("grape exists, count: %d\n", count)
    } else {
        fmt.Println("grape does not exist") // This line is output
    }

    // Only check existence
    if _, exists := inventory["banana"]; exists {
        fmt.Println("banana is in inventory")
    }

    // Practical application: Safe value retrieval
    getInventory := func(item string) int {
        if count, ok := inventory[item]; ok {
            return count
        }
        return -1 // Indicates non-existent
    }

    fmt.Println("mango inventory:", getInventory("mango"))
}
```

### Map Iteration

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

    // Iterate over keys and values
    fmt.Println("=== Iterate Key-Value Pairs ===")
    for name, score := range scores {
        fmt.Printf("%s: %d\n", name, score)
    }

    // Iterate over keys only
    fmt.Println("\n=== Iterate Keys Only ===")
    for name := range scores {
        fmt.Println(name)
    }

    // Iterate over values only
    fmt.Println("\n=== Iterate Values Only ===")
    for _, score := range scores {
        fmt.Println(score)
    }

    // Ordered iteration (sort keys first)
    fmt.Println("\n=== Iterate Sorted by Key ===")
    keys := make([]string, 0, len(scores))
    for k := range scores {
        keys = append(keys, k)
    }
    sort.Strings(keys)

    for _, k := range keys {
        fmt.Printf("%s: %d\n", k, scores[k])
    }

    // Iterate sorted by value
    fmt.Println("\n=== Iterate Sorted by Value ===")
    type kv struct {
        Key   string
        Value int
    }

    pairs := make([]kv, 0, len(scores))
    for k, v := range scores {
        pairs = append(pairs, kv{k, v})
    }

    sort.Slice(pairs, func(i, j int) bool {
        return pairs[i].Value > pairs[j].Value // Descending order
    })

    for _, pair := range pairs {
        fmt.Printf("%s: %d\n", pair.Key, pair.Value)
    }
}
```

### Complex Data Structures

```go
package main

import "fmt"

// Using struct as value
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
    // Map with struct values
    employees := make(map[int]Person)

    employees[1001] = Person{
        Name:  "Zhang San",
        Age:   30,
        Email: "zhangsan@example.com",
        Address: Address{
            City:    "Beijing",
            Country: "China",
        },
    }

    employees[1002] = Person{
        Name:  "Li Si",
        Age:   28,
        Email: "lisi@example.com",
        Address: Address{
            City:    "Shanghai",
            Country: "China",
        },
    }

    // Access nested fields
    fmt.Println("Employee 1001 Name:", employees[1001].Name)
    fmt.Println("Employee 1001 City:", employees[1001].Address.City)

    // Modify nested fields (requires full replacement)
    emp := employees[1001]
    emp.Age = 31
    emp.Address.City = "Shenzhen"
    employees[1001] = emp

    fmt.Println("After modification:", employees[1001])

    // Use pointers to avoid copying
    employeesPtr := make(map[int]*Person)
    employeesPtr[1001] = &Person{Name: "Wang Wu", Age: 25}

    // Direct modification
    employeesPtr[1001].Age = 26
    fmt.Println("Pointer modification:", employeesPtr[1001])

    // Nested maps
    departments := map[string]map[string][]string{
        "Tech Dept": {
            "Backend Team":  {"Zhang San", "Li Si"},
            "Frontend Team": {"Wang Wu", "Zhao Liu"},
        },
        "Product Dept": {
            "Product Team": {"Sun Qi", "Zhou Ba"},
        },
    }

    // Safe access to nested map
    if dept, ok := departments["Tech Dept"]; ok {
        if team, ok := dept["Backend Team"]; ok {
            fmt.Println("Backend Team members:", team)
        }
    }

    // Add data to nested map
    if departments["Tech Dept"] == nil {
        departments["Tech Dept"] = make(map[string][]string)
    }
    departments["Tech Dept"]["QA Team"] = []string{"Wu Jiu"}

    fmt.Println("Tech Dept:", departments["Tech Dept"])
}
```

### Using Map as a Set

```go
package main

import "fmt"

// Implement set using map
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

// Set operations
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
    // Create set
    fruits := NewSet()
    fruits.Add("apple")
    fruits.Add("banana")
    fruits.Add("orange")
    fruits.Add("apple") // Duplicate add has no effect

    fmt.Println("Set size:", fruits.Size())
    fmt.Println("Contains apple:", fruits.Contains("apple"))
    fmt.Println("Contains grape:", fruits.Contains("grape"))

    // Set operations
    tropical := NewSet()
    tropical.Add("banana")
    tropical.Add("mango")
    tropical.Add("pineapple")

    fmt.Println("\nFruits set:", fruits.Items())
    fmt.Println("Tropical fruits:", tropical.Items())
    fmt.Println("Union:", fruits.Union(tropical).Items())
    fmt.Println("Intersection:", fruits.Intersection(tropical).Items())
    fmt.Println("Difference:", fruits.Difference(tropical).Items())
}
```

## Best Practices

### Pre-allocate Capacity

When you know the approximate number of elements, using `make` to pre-allocate capacity can avoid frequent expansions:

```go
// Recommended: Pre-allocate capacity
userMap := make(map[int]User, 10000)

// Not recommended: Frequent expansions
userMap := make(map[int]User)
for i := 0; i < 10000; i++ {
    userMap[i] = User{} // Triggers expansion multiple times
}
```

### Check If Key Exists

Always use the comma ok idiom to check if a key exists:

```go
// Recommended
if value, ok := m[key]; ok {
    // Key exists, use value
}

// Not recommended (cannot distinguish between non-existent key and zero value)
value := m[key]
if value != 0 {
    // May cause incorrect judgment
}
```

### Safe Operations on Nested Maps

```go
// Unsafe
data := make(map[string]map[string]int)
data["outer"]["inner"] = 1 // panic: inner map is nil

// Safe approach
data := make(map[string]map[string]int)
if data["outer"] == nil {
    data["outer"] = make(map[string]int)
}
data["outer"]["inner"] = 1
```

### Don't Modify During Iteration

```go
// Not recommended: Modifying during iteration may cause undefined behavior
for k := range m {
    if shouldDelete(k) {
        delete(m, k) // May cause issues
    }
}

// Recommended: Collect keys to delete, then delete afterwards
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

### Use Appropriate Key Types

```go
// Recommended: Use custom types for type safety
type UserID int
type ProductID int

users := make(map[UserID]User)
products := make(map[ProductID]Product)

// users[ProductID(1)] = User{} // Compile error

// Not recommended: Easy to confuse
users := make(map[int]User)
products := make(map[int]Product)
```

## Common Pitfalls

### Writing to nil Map

```go
var m map[string]int
m["key"] = 1 // panic: assignment to entry in nil map

// Correct approach
m := make(map[string]int)
m["key"] = 1
```

### Concurrent Read/Write

```go
package main

import (
    "sync"
)

func main() {
    m := make(map[int]int)

    // Error: Concurrent read/write will panic
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

// Correct approach 1: Use mutex
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

// Correct approach 2: Use sync.Map
func useSyncMap() {
    var m sync.Map

    m.Store("key", "value")

    if v, ok := m.Load("key"); ok {
        _ = v.(string)
    }

    m.Delete("key")

    m.Range(func(key, value interface{}) bool {
        // Iterate all key-value pairs
        return true // Return false to stop iteration
    })
}
```

### Iteration Order is Undefined

```go
m := map[string]int{
    "a": 1,
    "b": 2,
    "c": 3,
}

// Order may differ on each run
for k, v := range m {
    fmt.Println(k, v)
}

// If fixed order is needed, sort keys first
```

### Modifying Struct Values in Maps

```go
type Point struct {
    X, Y int
}

m := map[string]Point{
    "origin": {0, 0},
}

// Error: Cannot directly modify struct fields in map
// m["origin"].X = 10 // Compile error

// Correct approach 1: Full replacement
p := m["origin"]
p.X = 10
m["origin"] = p

// Correct approach 2: Use pointers
m2 := map[string]*Point{
    "origin": {0, 0},
}
m2["origin"].X = 10 // Correct
```

### Comparing Maps

```go
m1 := map[string]int{"a": 1}
m2 := map[string]int{"a": 1}

// Error: Maps cannot be directly compared
// if m1 == m2 {} // Compile error

// Can only compare with nil
if m1 == nil {}

// Correct approach: Use reflect.DeepEqual or compare manually
import "reflect"
equal := reflect.DeepEqual(m1, m2)

// Or compare manually
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

### Floating Point Numbers as Keys

```go
// Not recommended: Floating point precision issues
m := map[float64]string{}
m[0.1+0.2] = "a"
m[0.3] = "b"

// 0.1 + 0.2 != 0.3 (floating point precision issue)
fmt.Println(0.1+0.2 == 0.3)  // false
fmt.Println(len(m))          // 2, not 1
```

## Performance Considerations

### Memory Usage

Map memory usage mainly includes:

1. **hmap struct**: About 48 bytes
2. **Bucket array**: Each bucket is about 208 bytes (for `map[string]int`)
3. **Overflow buckets**: Additional overflow bucket usage

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

    fmt.Printf("100000 elements use memory: %d KB\n", (after-before)/1024)
    fmt.Printf("Average per element: %d bytes\n", (after-before)/100000)
}
```

### Benchmarks

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

### Performance Optimization Tips

1. **Pre-allocate capacity**: Reduce expansion times
2. **Use small keys**: Reduce hash computation and comparison overhead
3. **Avoid frequent map creation**: Reuse map objects
4. **Consider using arrays/slices**: If keys are consecutive integers, slices are more efficient
5. **Consider sharding for large data**: Reduce lock contention

```go
// Sharded map example
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

## Real-World Scenarios

### Scenario 1: Cache Implementation

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

    cache.Set("user:1", "Zhang San", 5*time.Second)

    if value, ok := cache.Get("user:1"); ok {
        fmt.Println("Cache hit:", value)
    }

    time.Sleep(6 * time.Second)

    if _, ok := cache.Get("user:1"); !ok {
        fmt.Println("Cache expired")
    }
}
```

### Scenario 2: Counters and Statistics

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

    // Word frequency count
    wordCount := make(map[string]int)
    words := strings.Fields(strings.ToLower(text))

    for _, word := range words {
        // Clean punctuation
        word = strings.Trim(word, ".,!?;:")
        wordCount[word]++
    }

    fmt.Println("Word frequency:")
    for word, count := range wordCount {
        if count > 1 {
            fmt.Printf("  %s: %d\n", word, count)
        }
    }

    // Character frequency count
    charCount := make(map[rune]int)
    for _, char := range text {
        if char != ' ' && char != '\n' {
            charCount[char]++
        }
    }

    fmt.Println("\nCharacter frequency (top 5):")
    // Find most frequent characters
    type charFreq struct {
        char  rune
        count int
    }
    freqs := make([]charFreq, 0, len(charCount))
    for char, count := range charCount {
        freqs = append(freqs, charFreq{char, count})
    }

    // Simple sort
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

### Scenario 3: Route Mapping

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
        // Simple route matching
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
        fmt.Fprintf(w, "Get user: %s\n", params["id"])
    })

    router.POST("/users", func(w http.ResponseWriter, r *http.Request, params map[string]string) {
        fmt.Fprintf(w, "Create user\n")
    })

    router.GET("/users/:id/posts/:postId", func(w http.ResponseWriter, r *http.Request, params map[string]string) {
        fmt.Fprintf(w, "User %s's post %s\n", params["id"], params["postId"])
    })

    fmt.Println("Server started on :8080")
    http.ListenAndServe(":8080", router)
}
```

### Scenario 4: Configuration Management

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

    // Simulate configuration data
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

    fmt.Println("App name:", config.GetString("app_name", "DefaultApp"))
    fmt.Println("Port:", config.GetInt("port", 3000))
    fmt.Println("Debug mode:", config.GetBool("debug", false))

    if dbHost, ok := config.GetNested("database", "host"); ok {
        fmt.Println("Database host:", dbHost)
    }

    if dbPort, ok := config.GetNested("database", "port"); ok {
        fmt.Println("Database port:", dbPort)
    }
}
```

## Interview Key Points

### Common Interview Questions

**1. What is the underlying implementation of Map?**

Go's map is implemented as a hash table, consisting of hmap struct and bmap (buckets). Each bucket can store 8 key-value pairs, using chaining to handle hash collisions (overflow buckets).

**2. Is Map thread-safe? How to implement concurrent-safe map?**

Map is not thread-safe. Concurrent safety can be achieved through:
- Using `sync.Mutex` or `sync.RWMutex` for locking
- Using `sync.Map` (suitable for read-heavy scenarios)
- Using sharded maps to reduce lock contention

**3. Why is map iteration order random?**

Go intentionally randomizes iteration order to prevent developers from relying on specific iteration order. Each iteration starts from a random bucket and random position.

**4. What is the map expansion mechanism?**

Trigger conditions:
- Load factor exceeds 6.5 (double expansion)
- Too many overflow buckets (same-size expansion)

Expansion uses incremental migration, not completing all at once, but migrating partial data during each access.

**5. What types can be used as map keys?**

Only comparable types can be used as keys, including: boolean, numeric, string, pointer, channel, interface, struct (all fields comparable), array (elements comparable). Not allowed: slice, map, function.

**6. How to check if a key exists in a map?**

Use the comma ok idiom:
```go
if value, ok := m[key]; ok {
    // Key exists
}
```

**7. What is the zero value of Map? Can you operate on a zero value map?**

Map's zero value is nil. You can read (returns zero value of value type) and delete, but cannot write (will panic).

### Coding Problems

**Implement LRU Cache**

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

## Further Reading

### Official Resources

- [Go Official Documentation - Maps](https://go.dev/blog/maps)
- [Go Language Specification - Map Types](https://go.dev/ref/spec#Map_types)
- [Effective Go - Maps](https://go.dev/doc/effective_go#maps)

### Source Code Reading

- [runtime/map.go](https://github.com/golang/go/blob/master/src/runtime/map.go) - Map runtime implementation
- [sync/map.go](https://github.com/golang/go/blob/master/src/sync/map.go) - Concurrent-safe Map

### Recommended Articles

- [Deep Dive into Go Map](https://draveness.me/golang/docs/part2-foundation/ch03-datastructure/golang-hashmap/)
- [Go Language Design and Implementation - Hash Table](https://draveness.me/golang/docs/part2-foundation/ch03-datastructure/golang-hashmap/)
- [Go Maps in Action](https://go.dev/blog/maps)

### Related Data Structures

- **sync.Map**: Concurrent-safe map implementation
- **container/list**: Doubly linked list, often used with map to implement LRU
- **sort package**: Used for map key sorting

---

> Map is one of the most frequently used data structures in Go. Understanding its underlying principles and best practices can help you write more efficient and safer code. Practice through real projects to deepen your understanding of various map usage patterns.
