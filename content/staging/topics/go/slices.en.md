---
title: "Go Slices: Complete Guide"
description: "Master Go slices: understand internal structure, core principles, best practices, and advanced patterns for efficient data handling"
track: go
section: basics
difficulty: beginner
tags:
  - Go
  - Slice
  - Data Structures
  - Memory Management
  - Performance
status: imported
origin: old/src/content/docs/go/slices.en.md
divergence: 0.296
issues: []
legacy:
  category: Go
  subcategory: Language Basics
  order: 3
  lastUpdated: 2026-01-07
---

Slices are one of the most important and frequently used data structures in Go. Unlike arrays with their fixed length, slices provide a dynamic, flexible, and efficient way to work with sequences of data. This comprehensive guide explores slice internals, working principles, best practices, and real-world applications.

## Concept Explanation

### What is a Slice?

A slice is a reference to a contiguous segment of an underlying array. It provides a dynamic-sized, flexible view of array elements. Crucially, a slice does not store data itself—it only describes a portion of an underlying array.

```go
package main

import "fmt"

func main() {
    // Arrays have fixed length
    arr := [5]int{1, 2, 3, 4, 5}

    // Slices are dynamic, providing a view of array elements
    slice := arr[1:4] // [2, 3, 4]

    fmt.Println("Array:", arr)
    fmt.Println("Slice:", slice)
    fmt.Printf("Slice length: %d, capacity: %d\n", len(slice), cap(slice))
}
```

Output:
```
Array: [1 2 3 4 5]
Slice: [2 3 4]
Slice length: 3, capacity: 4
```

### Slices vs Arrays

| Feature | Array | Slice |
|---------|-------|-------|
| Length | Fixed, compile-time | Dynamic, runtime |
| Type | `[n]T` (length is part of type) | `[]T` (length not part of type) |
| Passing | Value (copies entire array) | Value (copies slice header only) |
| Memory | Stack or heap | Heap (underlying array) |
| Comparison | Can use `==` | Only comparable with `nil` |

```go
package main

import "fmt"

func main() {
    // Arrays: type includes length
    var arr1 [3]int = [3]int{1, 2, 3}
    var arr2 [4]int = [4]int{1, 2, 3, 4}
    // arr1 and arr2 are different types

    // Slices: length is not part of type
    var slice1 []int = []int{1, 2, 3}
    var slice2 []int = []int{1, 2, 3, 4}
    // slice1 and slice2 are the same type

    fmt.Printf("arr1 type: %T\n", arr1)        // [3]int
    fmt.Printf("arr2 type: %T\n", arr2)        // [4]int
    fmt.Printf("slice1 type: %T\n", slice1)    // []int
    fmt.Printf("slice2 type: %T\n", slice2)    // []int
}
```

## Core Principles

### Slice Internal Structure

At runtime, a slice consists of three fields, defined in the `reflect` package as `SliceHeader`:

```go
type SliceHeader struct {
    Data uintptr  // Pointer to the underlying array
    Len  int      // Current number of elements
    Cap  int      // Capacity from slice start to array end
}
```

Visual representation:

```
Slice variable s
+-------+-------+-------+
| ptr   | len   | cap   |
+-------+-------+-------+
    |
    v
+---+---+---+---+---+---+---+
| 0 | 1 | 2 | 3 | 4 | 5 | 6 |  Underlying array
+---+---+---+---+---+---+---+
    ^           ^
    |           |
  s[0]        s[len-1]
```

```go
package main

import (
    "fmt"
    "reflect"
    "unsafe"
)

func main() {
    slice := []int{10, 20, 30, 40, 50}

    // Access internal structure
    header := (*reflect.SliceHeader)(unsafe.Pointer(&slice))

    fmt.Printf("Data pointer: %v\n", header.Data)
    fmt.Printf("Length: %d\n", header.Len)
    fmt.Printf("Capacity: %d\n", header.Cap)

    // Slice header size
    fmt.Printf("Slice header size: %d bytes\n", unsafe.Sizeof(slice))
    // On 64-bit systems: 24 bytes (3 × 8-byte fields)
}
```

### Length vs Capacity

- **Length (len)**: Current number of elements in the slice
- **Capacity (cap)**: Maximum elements from slice start to underlying array end

```go
package main

import "fmt"

func main() {
    arr := [10]int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}

    // Create different slices
    s1 := arr[2:5]   // [2, 3, 4]
    s2 := arr[2:5:7] // [2, 3, 4], capacity limited to 5
    s3 := arr[5:]    // [5, 6, 7, 8, 9]

    fmt.Printf("s1: %v, len=%d, cap=%d\n", s1, len(s1), cap(s1))
    // s1: [2 3 4], len=3, cap=8

    fmt.Printf("s2: %v, len=%d, cap=%d\n", s2, len(s2), cap(s2))
    // s2: [2 3 4], len=3, cap=5

    fmt.Printf("s3: %v, len=%d, cap=%d\n", s3, len(s3), cap(s3))
    // s3: [5 6 7 8 9], len=5, cap=5
}
```

### Slice Expressions

Go supports two types of slice expressions:

#### Simple Slice Expression `a[low:high]`

```go
package main

import "fmt"

func main() {
    arr := [6]int{0, 1, 2, 3, 4, 5}

    s1 := arr[1:4]  // [1, 2, 3]
    s2 := arr[:3]   // [0, 1, 2] - low defaults to 0
    s3 := arr[2:]   // [2, 3, 4, 5] - high defaults to len
    s4 := arr[:]    // [0, 1, 2, 3, 4, 5] - full slice

    fmt.Println("s1:", s1)
    fmt.Println("s2:", s2)
    fmt.Println("s3:", s3)
    fmt.Println("s4:", s4)
}
```

#### Full Slice Expression `a[low:high:max]`

The full slice expression controls capacity:

```go
package main

import "fmt"

func main() {
    arr := [10]int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}

    // a[low:high:max]
    // length = high - low
    // capacity = max - low

    s1 := arr[2:5]    // length=3, capacity=8
    s2 := arr[2:5:6]  // length=3, capacity=4
    s3 := arr[2:5:5]  // length=3, capacity=3

    fmt.Printf("s1: len=%d, cap=%d\n", len(s1), cap(s1))
    fmt.Printf("s2: len=%d, cap=%d\n", len(s2), cap(s2))
    fmt.Printf("s3: len=%d, cap=%d\n", len(s3), cap(s3))

    // Why limit capacity?
    // Prevents accidental modification of other parts of the array via append
}
```

### Shared Underlying Array

Multiple slices can share the same underlying array. Modifying one slice affects others:

```go
package main

import "fmt"

func main() {
    arr := [5]int{1, 2, 3, 4, 5}

    s1 := arr[1:4] // [2, 3, 4]
    s2 := arr[2:5] // [3, 4, 5]

    fmt.Println("Before modification:")
    fmt.Println("arr:", arr)
    fmt.Println("s1:", s1)
    fmt.Println("s2:", s2)

    // Modifying s1 affects arr and s2
    s1[1] = 100

    fmt.Println("\nAfter s1[1] = 100:")
    fmt.Println("arr:", arr) // [1, 2, 100, 4, 5]
    fmt.Println("s1:", s1)   // [2, 100, 4]
    fmt.Println("s2:", s2)   // [100, 4, 5]
}
```

## Key Points

### Creating Slices

Go provides multiple ways to create slices:

```go
package main

import "fmt"

func main() {
    // Method 1: Slice literal
    s1 := []int{1, 2, 3, 4, 5}

    // Method 2: From array
    arr := [5]int{10, 20, 30, 40, 50}
    s2 := arr[1:4]

    // Method 3: Using make function
    s3 := make([]int, 5)      // length=5, capacity=5
    s4 := make([]int, 3, 10)  // length=3, capacity=10

    // Method 4: From another slice
    s5 := s1[1:3]

    // Method 5: Using new (uncommon)
    s6 := new([5]int)[:]

    fmt.Println("s1:", s1)
    fmt.Println("s2:", s2)
    fmt.Println("s3:", s3)
    fmt.Println("s4:", s4, "len:", len(s4), "cap:", cap(s4))
    fmt.Println("s5:", s5)
    fmt.Println("s6:", s6)
}
```

### The make Function

`make` is the recommended way to create slices:

```go
package main

import "fmt"

func main() {
    // make([]T, length) - slice with specified length
    s1 := make([]int, 5)
    fmt.Printf("s1: %v, len=%d, cap=%d\n", s1, len(s1), cap(s1))
    // s1: [0 0 0 0 0], len=5, cap=5

    // make([]T, length, capacity) - with explicit capacity
    s2 := make([]int, 3, 10)
    fmt.Printf("s2: %v, len=%d, cap=%d\n", s2, len(s2), cap(s2))
    // s2: [0 0 0], len=3, cap=10

    // Capacity cannot be less than length
    // s3 := make([]int, 10, 5) // Compile error

    // Create empty slice (length 0)
    s4 := make([]int, 0, 5)
    fmt.Printf("s4: %v, len=%d, cap=%d\n", s4, len(s4), cap(s4))
    // s4: [], len=0, cap=5
}
```

### nil Slices vs Empty Slices

This distinction is important but often confusing:

```go
package main

import (
    "fmt"
    "reflect"
    "unsafe"
)

func main() {
    // nil slice: no underlying array
    var nilSlice []int

    // empty slice: has underlying array, but length is 0
    emptySlice1 := []int{}
    emptySlice2 := make([]int, 0)

    fmt.Println("nil slice:")
    fmt.Printf("  value: %v\n", nilSlice)
    fmt.Printf("  == nil: %t\n", nilSlice == nil)
    fmt.Printf("  len: %d, cap: %d\n", len(nilSlice), cap(nilSlice))

    fmt.Println("\nempty slice (literal):")
    fmt.Printf("  value: %v\n", emptySlice1)
    fmt.Printf("  == nil: %t\n", emptySlice1 == nil)
    fmt.Printf("  len: %d, cap: %d\n", len(emptySlice1), cap(emptySlice1))

    fmt.Println("\nempty slice (make):")
    fmt.Printf("  value: %v\n", emptySlice2)
    fmt.Printf("  == nil: %t\n", emptySlice2 == nil)
    fmt.Printf("  len: %d, cap: %d\n", len(emptySlice2), cap(emptySlice2))

    // Print data pointers
    printSliceHeader := func(name string, s []int) {
        header := (*reflect.SliceHeader)(unsafe.Pointer(&s))
        fmt.Printf("%s data pointer: %v\n", name, header.Data)
    }

    fmt.Println("\nData pointer comparison:")
    printSliceHeader("nilSlice", nilSlice)
    printSliceHeader("emptySlice1", emptySlice1)
    printSliceHeader("emptySlice2", emptySlice2)

    // Functionally equivalent
    fmt.Println("\nFunctional equivalence:")
    for _, v := range nilSlice {
        fmt.Println(v) // Won't execute
    }
    nilSlice = append(nilSlice, 1, 2, 3)
    fmt.Println("After append to nil slice:", nilSlice)
}
```

**Key Differences:**

| Feature | nil Slice | Empty Slice |
|---------|-----------|-------------|
| Declaration | `var s []int` | `s := []int{}` or `make([]int, 0)` |
| `== nil` | `true` | `false` |
| `len()` | `0` | `0` |
| `cap()` | `0` | `0` or larger |
| Data pointer | `nil` (0) | Non-nil (points to zero-length array) |
| JSON serialization | `null` | `[]` |

### append Function

`append` is the core function for adding elements to slices:

```go
package main

import "fmt"

func main() {
    // Basic usage
    s := []int{1, 2, 3}
    s = append(s, 4)        // Add single element
    s = append(s, 5, 6, 7)  // Add multiple elements
    fmt.Println("Basic append:", s)

    // Append another slice (using ...)
    s2 := []int{8, 9, 10}
    s = append(s, s2...)
    fmt.Println("Append slice:", s)

    // append return value must be assigned
    // because append may reallocate the underlying array

    // Demonstrate capacity extension
    s3 := make([]int, 0, 2)
    fmt.Printf("\nCapacity growth demo:\n")
    for i := 1; i <= 10; i++ {
        oldCap := cap(s3)
        s3 = append(s3, i)
        if cap(s3) != oldCap {
            fmt.Printf("Added %d: len=%d, cap: %d -> %d\n",
                i, len(s3), oldCap, cap(s3))
        }
    }
}
```

### append Growth Strategy

When a slice's capacity is insufficient, `append` creates a new underlying array:

```go
package main

import (
    "fmt"
    "reflect"
    "unsafe"
)

func main() {
    s := make([]int, 0, 4)

    fmt.Println("Observing growth behavior:")
    fmt.Printf("Initial: len=%d, cap=%d\n\n", len(s), cap(s))

    for i := 1; i <= 20; i++ {
        oldPtr := (*reflect.SliceHeader)(unsafe.Pointer(&s)).Data
        oldCap := cap(s)

        s = append(s, i)

        newPtr := (*reflect.SliceHeader)(unsafe.Pointer(&s)).Data
        newCap := cap(s)

        if oldCap != newCap {
            fmt.Printf("Append %2d: cap %d -> %d, ", i, oldCap, newCap)
            if oldPtr != newPtr {
                fmt.Println("underlying array changed")
            }
        }
    }

    // Go 1.18+ growth strategy:
    // - When capacity < 256: newCap = oldCap * 2
    // - When capacity >= 256: newCap = oldCap + (oldCap + 3*256) / 4
    // This formula smoothly transitions from 2x to ~1.25x growth
}
```

### copy Function

`copy` transfers elements between slices:

```go
package main

import "fmt"

func main() {
    // Basic copy
    src := []int{1, 2, 3, 4, 5}
    dst := make([]int, 5)
    n := copy(dst, src)
    fmt.Printf("Copied %d elements: %v\n", n, dst)

    // Copy to smaller destination
    smallDst := make([]int, 3)
    n = copy(smallDst, src)
    fmt.Printf("Copy to smaller slice: copied %d: %v\n", n, smallDst)

    // Copy to larger destination
    largeDst := make([]int, 10)
    n = copy(largeDst, src)
    fmt.Printf("Copy to larger slice: copied %d: %v\n", n, largeDst)

    // Partial copy
    partialDst := make([]int, 10)
    n = copy(partialDst[3:], src[1:4])
    fmt.Printf("Partial copy: copied %d: %v\n", n, partialDst)

    // Safe copy with overlapping slices
    overlap := []int{1, 2, 3, 4, 5}
    copy(overlap[2:], overlap[:3])
    fmt.Println("Overlapping copy:", overlap)

    // Copy string to byte slice
    str := "Hello"
    bytes := make([]byte, len(str))
    copy(bytes, str)
    fmt.Println("String copy:", string(bytes))
}
```

## Code Examples

### Complete Slice Operations

```go
package main

import (
    "fmt"
    "sort"
)

func main() {
    // 1. Create and initialize
    numbers := []int{5, 2, 8, 1, 9, 3, 7, 4, 6}
    fmt.Println("Original slice:", numbers)

    // 2. Access and modify elements
    fmt.Println("First element:", numbers[0])
    fmt.Println("Last element:", numbers[len(numbers)-1])
    numbers[0] = 100
    fmt.Println("After modification:", numbers)

    // 3. Slice operations
    subSlice := numbers[2:5]
    fmt.Println("Sub-slice [2:5]:", subSlice)

    // 4. Append elements
    numbers = append(numbers, 10, 11, 12)
    fmt.Println("After append:", numbers)

    // 5. Copy slice
    copied := make([]int, len(numbers))
    copy(copied, numbers)
    fmt.Println("Copied slice:", copied)

    // 6. Sort
    sort.Ints(copied)
    fmt.Println("Sorted:", copied)

    // 7. Reverse slice
    for i, j := 0, len(copied)-1; i < j; i, j = i+1, j-1 {
        copied[i], copied[j] = copied[j], copied[i]
    }
    fmt.Println("Reversed:", copied)

    // 8. Filter (keep even numbers)
    evens := []int{}
    for _, v := range copied {
        if v%2 == 0 {
            evens = append(evens, v)
        }
    }
    fmt.Println("Even numbers:", evens)

    // 9. Map (multiply by 2)
    doubled := make([]int, len(evens))
    for i, v := range evens {
        doubled[i] = v * 2
    }
    fmt.Println("Doubled:", doubled)

    // 10. Search for element
    target := 12
    found := -1
    for i, v := range numbers {
        if v == target {
            found = i
            break
        }
    }
    if found != -1 {
        fmt.Printf("Found %d at index %d\n", target, found)
    }
}
```

### Deleting Slice Elements

```go
package main

import "fmt"

func main() {
    // Method 1: Using append (unordered deletion)
    s1 := []int{1, 2, 3, 4, 5}
    i := 2 // Delete index 2 (value 3)
    s1[i] = s1[len(s1)-1] // Overwrite with last element
    s1 = s1[:len(s1)-1]   // Truncate
    fmt.Println("Method 1 (unordered):", s1) // [1 2 5 4]

    // Method 2: Using append (ordered deletion)
    s2 := []int{1, 2, 3, 4, 5}
    i = 2
    s2 = append(s2[:i], s2[i+1:]...)
    fmt.Println("Method 2 (ordered):", s2) // [1 2 4 5]

    // Method 3: Using copy (ordered, prevents memory leak)
    s3 := []int{1, 2, 3, 4, 5}
    i = 2
    copy(s3[i:], s3[i+1:])
    s3[len(s3)-1] = 0 // Clean up last element (important for reference types)
    s3 = s3[:len(s3)-1]
    fmt.Println("Method 3 (copy):", s3) // [1 2 4 5]

    // Range deletion
    s4 := []int{1, 2, 3, 4, 5, 6, 7}
    start, end := 2, 5 // Delete indices 2-4
    s4 = append(s4[:start], s4[end:]...)
    fmt.Println("Range deletion:", s4) // [1 2 6 7]

    // Delete elements matching condition
    s5 := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    // Remove all even numbers
    n := 0
    for _, v := range s5 {
        if v%2 != 0 {
            s5[n] = v
            n++
        }
    }
    s5 = s5[:n]
    fmt.Println("Remove evens:", s5) // [1 3 5 7 9]
}
```

### Inserting Elements

```go
package main

import "fmt"

func main() {
    // Insert single element at index
    s := []int{1, 2, 3, 4, 5}
    i := 2
    element := 100

    // Method 1: Using append
    s = append(s[:i], append([]int{element}, s[i:]...)...)
    fmt.Println("After insert:", s) // [1 2 100 3 4 5]

    // Method 2: More efficient (avoids temporary slice)
    s2 := []int{1, 2, 3, 4, 5}
    s2 = append(s2, 0)      // Extend by one
    copy(s2[i+1:], s2[i:])  // Shift elements
    s2[i] = element
    fmt.Println("Efficient insert:", s2)

    // Insert multiple elements
    s3 := []int{1, 2, 5, 6}
    elements := []int{3, 4}
    i = 2

    // Create new slice
    result := make([]int, len(s3)+len(elements))
    copy(result, s3[:i])
    copy(result[i:], elements)
    copy(result[i+len(elements):], s3[i:])
    fmt.Println("Insert multiple:", result) // [1 2 3 4 5 6]
}
```

### Slices as Function Parameters

```go
package main

import "fmt"

// Slices are reference types; modifications affect original
func modifySlice(s []int) {
    for i := range s {
        s[i] *= 2
    }
}

// append may change the slice reference
func appendToSlice(s []int) []int {
    return append(s, 100, 200)
}

// Wrong: no return value, modification won't affect caller
func wrongAppend(s []int) {
    s = append(s, 100)
}

// Use pointer to modify the slice itself
func appendWithPointer(s *[]int) {
    *s = append(*s, 100)
}

func main() {
    // Modify elements
    s1 := []int{1, 2, 3, 4, 5}
    fmt.Println("Before:", s1)
    modifySlice(s1)
    fmt.Println("After:", s1) // Elements modified

    // append needs return value
    s2 := []int{1, 2, 3}
    s2 = appendToSlice(s2)
    fmt.Println("Correct append:", s2)

    // Wrong append
    s3 := []int{1, 2, 3}
    wrongAppend(s3)
    fmt.Println("Wrong append:", s3) // Unchanged

    // Using pointer
    s4 := []int{1, 2, 3}
    appendWithPointer(&s4)
    fmt.Println("Pointer append:", s4)
}
```

## Best Practices

### Preallocate Capacity

When the final size is known, preallocating avoids multiple allocations:

```go
package main

import (
    "fmt"
    "time"
)

func withoutPrealloc(n int) []int {
    var result []int
    for i := 0; i < n; i++ {
        result = append(result, i)
    }
    return result
}

func withPrealloc(n int) []int {
    result := make([]int, 0, n)
    for i := 0; i < n; i++ {
        result = append(result, i)
    }
    return result
}

func main() {
    n := 1000000

    start := time.Now()
    withoutPrealloc(n)
    fmt.Printf("Without prealloc: %v\n", time.Since(start))

    start = time.Now()
    withPrealloc(n)
    fmt.Printf("With prealloc: %v\n", time.Since(start))
}
```

### Use Full Slice Expression to Prevent Accidental Modifications

```go
package main

import "fmt"

func main() {
    original := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

    // Unsafe: sub-slice can modify original via append
    unsafeSlice := original[2:5]
    unsafeSlice = append(unsafeSlice, 100) // Modifies original[5]
    fmt.Println("Original (modified):", original)

    // Reset
    original = []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

    // Safe: full expression limits capacity
    safeSlice := original[2:5:5] // capacity = 3
    safeSlice = append(safeSlice, 100) // Allocates new array
    fmt.Println("Original (unmodified):", original)
    fmt.Println("Safe slice:", safeSlice)
}
```

### Copy Slices Correctly

```go
package main

import "fmt"

func main() {
    original := []int{1, 2, 3, 4, 5}

    // Wrong: only copies slice header
    wrongCopy := original
    wrongCopy[0] = 100
    fmt.Println("After wrong copy:", original) // Modified!

    // Reset
    original = []int{1, 2, 3, 4, 5}

    // Correct method 1: make + copy
    correctCopy1 := make([]int, len(original))
    copy(correctCopy1, original)
    correctCopy1[0] = 100
    fmt.Println("After correct copy 1:", original) // Unmodified

    // Correct method 2: append
    correctCopy2 := append([]int(nil), original...)
    correctCopy2[0] = 200
    fmt.Println("After correct copy 2:", original) // Unmodified

    // Correct method 3: Go 1.21+ slices.Clone
    // correctCopy3 := slices.Clone(original)
}
```

### Avoid Memory Leaks

```go
package main

import (
    "fmt"
    "runtime"
)

type LargeStruct struct {
    data [1024 * 1024]byte // 1MB
}

func main() {
    // Problem: sub-slice holds reference to entire array
    largeSlice := make([]*LargeStruct, 1000)
    for i := range largeSlice {
        largeSlice[i] = &LargeStruct{}
    }

    // Problem: subSlice still holds reference to entire array
    // even though we only need the first 10 elements
    subSlice := largeSlice[:10]

    // Most memory cannot be garbage collected
    largeSlice = nil
    runtime.GC()

    // Solution: copy needed elements to new slice
    properSubSlice := make([]*LargeStruct, len(subSlice))
    copy(properSubSlice, subSlice)
    subSlice = nil
    runtime.GC()

    fmt.Println("Proper sub-slice length:", len(properSubSlice))

    // For deletion, clean up references
    slice := []*LargeStruct{{}, {}, {}}
    // Delete last element
    slice[len(slice)-1] = nil // Important: clear reference
    slice = slice[:len(slice)-1]
}
```

### Prefer Value Slices Over Pointer Slices (When Appropriate)

```go
package main

import "fmt"

type Point struct {
    X, Y float64
}

func main() {
    // Value slice: better cache locality
    points := []Point{
        {1, 2},
        {3, 4},
        {5, 6},
    }

    // Pointer slice: elements scattered in memory
    pointPtrs := []*Point{
        {1, 2},
        {3, 4},
        {5, 6},
    }

    // For small structs, value slices are usually more efficient
    fmt.Println("Value slice:", points)
    fmt.Println("Pointer slice:", *pointPtrs[0], *pointPtrs[1], *pointPtrs[2])

    // Use pointer slices when:
    // 1. Struct is large (>64 bytes)
    // 2. Need nil to represent missing values
    // 3. Need shared modifications
}
```

## Common Pitfalls

### append Creates New Arrays

```go
package main

import "fmt"

func main() {
    // Original slice
    original := make([]int, 3, 3)
    original[0], original[1], original[2] = 1, 2, 3

    // Create sub-slice
    sub := original[:2]

    fmt.Println("Before append:")
    fmt.Println("original:", original)
    fmt.Println("sub:", sub)

    // Key: append may change underlying array
    sub = append(sub, 100)

    fmt.Println("\nAfter append:")
    fmt.Println("original:", original) // Modified! Still has capacity
    fmt.Println("sub:", sub)

    // Second append
    sub = append(sub, 200)

    fmt.Println("\nAfter second append:")
    fmt.Println("original:", original) // Unchanged, sub allocated new array
    fmt.Println("sub:", sub)
}
```

### Loop Variable Capture in Closures

```go
package main

import "fmt"

func main() {
    // Pitfall: loop variable reused
    slice := []int{1, 2, 3, 4, 5}

    // Wrong: all closures capture the same variable
    funcs := []func(){}
    for _, v := range slice {
        funcs = append(funcs, func() {
            fmt.Println(v) // Captures variable, not value
        })
    }

    fmt.Println("Wrong result:")
    for _, f := range funcs {
        f() // All print 5
    }

    // Correct: create new variable in loop
    funcs2 := []func(){}
    for _, v := range slice {
        v := v // Create new variable
        funcs2 = append(funcs2, func() {
            fmt.Println(v)
        })
    }

    fmt.Println("\nCorrect result:")
    for _, f := range funcs2 {
        f() // Print 1, 2, 3, 4, 5
    }

    // Go 1.22+ fixes this: loop variables are fresh each iteration
}
```

### range Returns Element Copies

```go
package main

import "fmt"

type Item struct {
    Value int
}

func main() {
    items := []Item{{1}, {2}, {3}}

    // Wrong: modifying copy, not original
    for _, item := range items {
        item.Value *= 10 // Doesn't modify original slice
    }
    fmt.Println("Wrong way:", items) // [{1} {2} {3}]

    // Correct: use index
    for i := range items {
        items[i].Value *= 10
    }
    fmt.Println("Correct way:", items) // [{10} {20} {30}]

    // Or use pointer slice
    itemPtrs := []*Item{{1}, {2}, {3}}
    for _, item := range itemPtrs {
        item.Value *= 10 // Modify through pointer
    }
    fmt.Println("Pointer way:", *itemPtrs[0], *itemPtrs[1], *itemPtrs[2])
}
```

### Slice Comparison

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    s1 := []int{1, 2, 3}
    s2 := []int{1, 2, 3}

    // Compile error: slices cannot be directly compared
    // fmt.Println(s1 == s2)

    // Only comparable with nil
    var s3 []int
    fmt.Println("s3 == nil:", s3 == nil)

    // Methods to compare slice contents

    // Method 1: reflect.DeepEqual (slow)
    fmt.Println("DeepEqual:", reflect.DeepEqual(s1, s2))

    // Method 2: manual comparison
    equal := len(s1) == len(s2)
    if equal {
        for i := range s1 {
            if s1[i] != s2[i] {
                equal = false
                break
            }
        }
    }
    fmt.Println("Manual comparison:", equal)

    // Method 3: Go 1.21+ slices.Equal
    // fmt.Println("slices.Equal:", slices.Equal(s1, s2))
}
```

### Concurrent Access to Slices

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    // Wrong: concurrent writes (data race)
    // var slice []int
    // var wg sync.WaitGroup
    // for i := 0; i < 1000; i++ {
    //     wg.Add(1)
    //     go func(v int) {
    //         defer wg.Done()
    //         slice = append(slice, v) // Data race!
    //     }(i)
    // }
    // wg.Wait()

    // Correct method 1: Using mutex
    var slice1 []int
    var mu sync.Mutex
    var wg sync.WaitGroup

    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func(v int) {
            defer wg.Done()
            mu.Lock()
            slice1 = append(slice1, v)
            mu.Unlock()
        }(i)
    }
    wg.Wait()
    fmt.Println("Mutex way, length:", len(slice1))

    // Correct method 2: Using channel
    ch := make(chan int, 100)
    for i := 0; i < 100; i++ {
        go func(v int) {
            ch <- v
        }(i)
    }

    slice2 := make([]int, 0, 100)
    for i := 0; i < 100; i++ {
        slice2 = append(slice2, <-ch)
    }
    fmt.Println("Channel way, length:", len(slice2))
}
```

## Performance Considerations

### Preallocation vs Dynamic Growth

```go
package main

import (
    "fmt"
    "time"
)

func withoutPrealloc(n int) []int {
    var s []int
    for i := 0; i < n; i++ {
        s = append(s, i)
    }
    return s
}

func withPrealloc(n int) []int {
    s := make([]int, 0, n)
    for i := 0; i < n; i++ {
        s = append(s, i)
    }
    return s
}

func withIndex(n int) []int {
    s := make([]int, n)
    for i := 0; i < n; i++ {
        s[i] = i
    }
    return s
}

func main() {
    n := 100000

    start := time.Now()
    withoutPrealloc(n)
    fmt.Printf("No prealloc: %v\n", time.Since(start))

    start = time.Now()
    withPrealloc(n)
    fmt.Printf("With prealloc: %v\n", time.Since(start))

    start = time.Now()
    withIndex(n)
    fmt.Printf("Direct index: %v\n", time.Since(start))

    // Performance order: Direct index > Prealloc > Dynamic growth
}
```

### copy vs append for Copying

```go
package main

import "fmt"

func copyWithMakeCopy(src []int) []int {
    dst := make([]int, len(src))
    copy(dst, src)
    return dst
}

func copyWithAppend(src []int) []int {
    return append([]int(nil), src...)
}

func copyWithAppendMake(src []int) []int {
    return append(make([]int, 0, len(src)), src...)
}

func main() {
    src := []int{1, 2, 3, 4, 5}

    c1 := copyWithMakeCopy(src)
    c2 := copyWithAppend(src)
    c3 := copyWithAppendMake(src)

    fmt.Println("make+copy:", c1)
    fmt.Println("append nil:", c2)
    fmt.Println("append make:", c3)

    // Performance: make+copy and append+make typically fastest
}
```

### Element Deletion Performance

```go
package main

import "fmt"

// O(1) deletion - unordered
func deleteUnordered(s []int, i int) []int {
    s[i] = s[len(s)-1]
    return s[:len(s)-1]
}

// O(n) deletion - ordered
func deleteOrdered(s []int, i int) []int {
    return append(s[:i], s[i+1:]...)
}

// O(n) deletion - using copy
func deleteCopy(s []int, i int) []int {
    copy(s[i:], s[i+1:])
    return s[:len(s)-1]
}

func main() {
    s1 := []int{1, 2, 3, 4, 5}
    s2 := []int{1, 2, 3, 4, 5}
    s3 := []int{1, 2, 3, 4, 5}

    s1 = deleteUnordered(s1, 2)
    s2 = deleteOrdered(s2, 2)
    s3 = deleteCopy(s3, 2)

    fmt.Println("Unordered delete:", s1)
    fmt.Println("Ordered delete (append):", s2)
    fmt.Println("Ordered delete (copy):", s3)

    // Unordered deletion is O(1), use when order doesn't matter
}
```

### Cache Locality in Slice Memory Layout

```go
package main

import (
    "fmt"
    "time"
)

const size = 100

func sumByRow(matrix [][]int) int {
    sum := 0
    for i := 0; i < len(matrix); i++ {
        for j := 0; j < len(matrix[i]); j++ {
            sum += matrix[i][j]
        }
    }
    return sum
}

func sumByColumn(matrix [][]int) int {
    sum := 0
    cols := len(matrix[0])
    rows := len(matrix)
    for j := 0; j < cols; j++ {
        for i := 0; i < rows; i++ {
            sum += matrix[i][j]
        }
    }
    return sum
}

func main() {
    // Create matrix
    rows, cols := 1000, 1000
    matrix := make([][]int, rows)
    for i := range matrix {
        matrix[i] = make([]int, cols)
        for j := range matrix[i] {
            matrix[i][j] = i + j
        }
    }

    // Row traversal (cache friendly)
    start := time.Now()
    for i := 0; i < 100; i++ {
        sumByRow(matrix)
    }
    fmt.Printf("Row traversal: %v\n", time.Since(start))

    // Column traversal (cache unfriendly)
    start = time.Now()
    for i := 0; i < 100; i++ {
        sumByColumn(matrix)
    }
    fmt.Printf("Column traversal: %v\n", time.Since(start))

    // Row traversal typically faster due to sequential memory access
}
```

## Real-world Scenarios

### Scenario 1: Implementing Stack and Queue

```go
package main

import "fmt"

// Stack implementation using slices
type Stack struct {
    data []int
}

func NewStack() *Stack {
    return &Stack{data: make([]int, 0)}
}

func (s *Stack) Push(v int) {
    s.data = append(s.data, v)
}

func (s *Stack) Pop() (int, bool) {
    if len(s.data) == 0 {
        return 0, false
    }
    v := s.data[len(s.data)-1]
    s.data = s.data[:len(s.data)-1]
    return v, true
}

func (s *Stack) Size() int {
    return len(s.data)
}

// Queue implementation using slices
type Queue struct {
    data []int
}

func NewQueue() *Queue {
    return &Queue{data: make([]int, 0)}
}

func (q *Queue) Enqueue(v int) {
    q.data = append(q.data, v)
}

func (q *Queue) Dequeue() (int, bool) {
    if len(q.data) == 0 {
        return 0, false
    }
    v := q.data[0]
    q.data = q.data[1:]
    return v, true
}

func (q *Queue) Size() int {
    return len(q.data)
}

func main() {
    // Stack example
    stack := NewStack()
    stack.Push(1)
    stack.Push(2)
    stack.Push(3)

    fmt.Println("Stack operations:")
    for stack.Size() > 0 {
        if v, ok := stack.Pop(); ok {
            fmt.Printf("Popped: %d\n", v)
        }
    }

    // Queue example
    queue := NewQueue()
    queue.Enqueue(1)
    queue.Enqueue(2)
    queue.Enqueue(3)

    fmt.Println("\nQueue operations:")
    for queue.Size() > 0 {
        if v, ok := queue.Dequeue(); ok {
            fmt.Printf("Dequeued: %d\n", v)
        }
    }
}
```

### Scenario 2: Pagination

```go
package main

import "fmt"

type Item struct {
    ID   int
    Name string
}

func paginate(items []Item, page, pageSize int) ([]Item, int) {
    total := len(items)

    if page < 1 {
        page = 1
    }

    start := (page - 1) * pageSize
    if start >= total {
        return []Item{}, total
    }

    end := start + pageSize
    if end > total {
        end = total
    }

    return items[start:end], total
}

func totalPages(total, pageSize int) int {
    return (total + pageSize - 1) / pageSize
}

func main() {
    // Create test data
    items := make([]Item, 100)
    for i := range items {
        items[i] = Item{ID: i + 1, Name: fmt.Sprintf("Item-%d", i+1)}
    }

    pageSize := 10

    // Iterate through all pages
    pages := totalPages(len(items), pageSize)
    fmt.Printf("Total records: %d, Per page: %d, Total pages: %d\n\n",
        len(items), pageSize, pages)

    for page := 1; page <= pages; page++ {
        result, total := paginate(items, page, pageSize)
        fmt.Printf("Page %d (of %d):\n", page, total)
        for _, item := range result {
            fmt.Printf("  %s\n", item.Name)
        }
    }
}
```

### Scenario 3: Batch Processing

```go
package main

import (
    "fmt"
    "sync"
)

func batch(items []int, batchSize int) [][]int {
    batches := make([][]int, 0, (len(items)+batchSize-1)/batchSize)

    for batchSize < len(items) {
        items, batches = items[batchSize:], append(batches, items[:batchSize:batchSize])
    }

    if len(items) > 0 {
        batches = append(batches, items)
    }

    return batches
}

func processBatches(items []int, batchSize int, process func([]int) int) int {
    batches := batch(items, batchSize)

    results := make(chan int, len(batches))
    var wg sync.WaitGroup

    for _, b := range batches {
        wg.Add(1)
        go func(batch []int) {
            defer wg.Done()
            results <- process(batch)
        }(b)
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    total := 0
    for r := range results {
        total += r
    }

    return total
}

func main() {
    // Create test data
    items := make([]int, 100)
    for i := range items {
        items[i] = i + 1
    }

    // Batch processing
    batchSize := 10
    batches := batch(items, batchSize)

    fmt.Printf("Total: %d, Batch size: %d, Total batches: %d\n",
        len(items), batchSize, len(batches))

    for i, b := range batches {
        fmt.Printf("Batch %d: %v\n", i+1, b)
    }

    // Concurrent sum calculation
    sum := processBatches(items, batchSize, func(batch []int) int {
        s := 0
        for _, v := range batch {
            s += v
        }
        return s
    })

    fmt.Printf("\nConcurrent sum: %d\n", sum)
}
```

## Interview Points

### Slice Internal Structure

**Q: Describe the internal structure of a Go slice.**

**A:** A slice at runtime consists of three fields:
- `Data`: Pointer to the underlying array
- `Len`: Current number of elements
- `Cap`: Capacity (elements from slice start to array end)

In the `reflect` package: `SliceHeader` with three fields totaling 24 bytes on 64-bit systems.

### nil vs Empty Slices

**Q: What's the difference between `var s []int` and `s := []int{}`?**

**A:**
- `var s []int`: nil slice, Data is nil, `s == nil` returns true
- `s := []int{}`: empty slice, Data points to zero-length array, `s == nil` returns false

Functionally equivalent but JSON serialization differs: nil → `null`, empty → `[]`.

### append Growth Strategy

**Q: How does append reallocate when capacity is insufficient?**

**A:** Go 1.18+ strategy:
- Capacity < 256: `newCap = oldCap * 2`
- Capacity >= 256: `newCap = oldCap + (oldCap + 3*256) / 4`

Smoothly transitions from 2x to ~1.25x growth rate.

### Slices as Parameters

**Q: Are slices passed by value or reference?**

**A:** Go has only value semantics. Slices are passed by value (24 bytes copied), but share the underlying array. Thus:
- Element modifications affect the original
- append might not affect original if reallocation occurs

### Safe Slice Copying

**Q: How do you create an independent copy of a slice?**

**A:**
```go
// Method 1: make + copy
dst := make([]int, len(src))
copy(dst, src)

// Method 2: append
dst := append([]int(nil), src...)

// Method 3: Go 1.21+ slices.Clone
dst := slices.Clone(src)
```

### Common Pitfalls

**Q: What pitfalls should you avoid with slices?**

**A:**
1. Shared underlying array between slices
2. append may allocate new arrays
3. Loop variable capture in closures
4. range yields value copies, not references
5. Sub-slices prevent garbage collection of large arrays
6. Slices are not concurrency-safe

## Further Reading

### Official Resources

- [Go Language Specification - Slice Types](https://go.dev/ref/spec#Slice_types)
- [Go Blog - Go Slices: Usage and Internals](https://go.dev/blog/slices-intro)
- [Go Blog - Arrays, Slices, and Strings](https://go.dev/blog/slices)
- [Effective Go - Slices](https://go.dev/doc/effective_go#slices)

### Recommended Articles

- [Go Slice Secrets](https://go.dev/blog/slices)
- [Slice Tricks](https://github.com/golang/go/wiki/SliceTricks)
- [Go Data Structures](https://research.swtch.com/godata)

### Standard Library Reference

- [slices package](https://pkg.go.dev/slices) (Go 1.21+)
- [sort package](https://pkg.go.dev/sort)
- [reflect.SliceHeader](https://pkg.go.dev/reflect#SliceHeader)

### Source Code

- [runtime/slice.go](https://github.com/golang/go/blob/master/src/runtime/slice.go) - Slice runtime implementation
- [builtin/builtin.go](https://github.com/golang/go/blob/master/src/builtin/builtin.go) - append, copy documentation

## Conclusion

Mastering slices is fundamental to proficient Go programming. Understanding their internal structure and behavior enables you to write efficient, safe code that leverages Go's powerful data handling capabilities. Continue practicing these concepts in real projects to develop intuition and expertise in Go slice usage.
