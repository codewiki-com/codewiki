---
title: Go 切片（Slice）完全指南
description: 深入理解 Go 切片的内部结构、底层原理、操作方法与性能优化
track: go
section: basics
difficulty: beginner
tags:
  - Go
  - Slice
  - 切片
  - 数据结构
  - 内存管理
status: imported
origin: old/src/content/docs/go/slices.zh.md
divergence: 0.296
issues: []
legacy:
  category: Go
  subcategory: 语言基础
  order: 3
  lastUpdated: 2026-01-07
---

切片（Slice）是 Go 语言中最重要、最常用的数据结构之一。它提供了一种灵活、强大且高效的方式来处理序列数据。与数组不同，切片是动态的，可以根据需要增长或缩小。本文将深入探讨切片的内部结构、工作原理以及最佳实践。

## 概念解释

### 什么是切片

切片是对底层数组的一个连续片段的引用，它提供了一个动态大小的、灵活的视图。切片本身不存储任何数据，它只是描述了底层数组的一部分。

```go
package main

import "fmt"

func main() {
    // 数组是固定长度的
    arr := [5]int{1, 2, 3, 4, 5}

    // 切片是动态的，基于数组的一个视图
    slice := arr[1:4] // [2, 3, 4]

    fmt.Println("数组:", arr)
    fmt.Println("切片:", slice)
    fmt.Printf("切片长度: %d, 容量: %d\n", len(slice), cap(slice))
}
```

### 切片与数组的区别

| 特性 | 数组 | 切片 |
|------|------|------|
| 长度 | 固定，编译时确定 | 动态，运行时可变 |
| 类型 | `[n]T`，长度是类型的一部分 | `[]T`，长度不是类型的一部分 |
| 传递方式 | 值传递（复制整个数组） | 引用传递（复制切片头） |
| 内存分配 | 栈或堆 | 堆（底层数组） |
| 比较 | 可以使用 `==` 比较 | 只能与 `nil` 比较 |

```go
package main

import "fmt"

func main() {
    // 数组：类型包含长度
    var arr1 [3]int = [3]int{1, 2, 3}
    var arr2 [4]int = [4]int{1, 2, 3, 4}
    // arr1 和 arr2 是不同的类型

    // 切片：长度不是类型的一部分
    var slice1 []int = []int{1, 2, 3}
    var slice2 []int = []int{1, 2, 3, 4}
    // slice1 和 slice2 是相同的类型

    fmt.Printf("arr1 类型: %T\n", arr1)   // [3]int
    fmt.Printf("arr2 类型: %T\n", arr2)   // [4]int
    fmt.Printf("slice1 类型: %T\n", slice1) // []int
    fmt.Printf("slice2 类型: %T\n", slice2) // []int
}
```

### 历史背景

切片的设计灵感来自于其他语言中的动态数组概念，但 Go 的实现更加精简和高效。Go 的创始人们设计切片时有以下考量：

1. **简洁性**：切片比链表更简单，避免了指针操作的复杂性
2. **效率**：切片头只有三个字段，传递成本低
3. **灵活性**：可以方便地引用数组的任意连续部分
4. **安全性**：内置边界检查，防止越界访问

## 核心原理

### 切片的内部结构

切片在运行时由三个字段组成，这个结构在 `reflect` 包中定义为 `SliceHeader`：

```go
type SliceHeader struct {
    Data uintptr  // 指向底层数组的指针
    Len  int      // 切片的长度
    Cap  int      // 切片的容量
}
```

可视化表示：

```
切片变量 s
+-------+-------+-------+
|  ptr  |  len  |  cap  |
+-------+-------+-------+
    |
    v
+---+---+---+---+---+---+---+
| 0 | 1 | 2 | 3 | 4 | 5 | 6 |  底层数组
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

    // 获取切片的内部结构
    header := (*reflect.SliceHeader)(unsafe.Pointer(&slice))

    fmt.Printf("数据指针: %v\n", header.Data)
    fmt.Printf("长度: %d\n", header.Len)
    fmt.Printf("容量: %d\n", header.Cap)

    // 切片头的大小
    fmt.Printf("切片头大小: %d 字节\n", unsafe.Sizeof(slice))
    // 在 64 位系统上是 24 字节（3 个 8 字节的字段）
}
```

### 长度与容量

- **长度（len）**：切片中当前元素的数量
- **容量（cap）**：从切片起始位置到底层数组末尾的元素数量

```go
package main

import "fmt"

func main() {
    arr := [10]int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}

    // 创建不同的切片
    s1 := arr[2:5]   // [2, 3, 4]
    s2 := arr[2:5:7] // [2, 3, 4]，容量限制为 5
    s3 := arr[5:]    // [5, 6, 7, 8, 9]

    fmt.Printf("s1: %v, len=%d, cap=%d\n", s1, len(s1), cap(s1))
    // s1: [2 3 4], len=3, cap=8

    fmt.Printf("s2: %v, len=%d, cap=%d\n", s2, len(s2), cap(s2))
    // s2: [2 3 4], len=3, cap=5

    fmt.Printf("s3: %v, len=%d, cap=%d\n", s3, len(s3), cap(s3))
    // s3: [5 6 7 8 9], len=5, cap=5
}
```

### 切片表达式

Go 支持两种切片表达式：

#### 简单切片表达式 `a[low:high]`

```go
package main

import "fmt"

func main() {
    arr := [6]int{0, 1, 2, 3, 4, 5}

    s1 := arr[1:4]  // [1, 2, 3]
    s2 := arr[:3]   // [0, 1, 2] - low 默认为 0
    s3 := arr[2:]   // [2, 3, 4, 5] - high 默认为 len
    s4 := arr[:]    // [0, 1, 2, 3, 4, 5] - 完整切片

    fmt.Println("s1:", s1)
    fmt.Println("s2:", s2)
    fmt.Println("s3:", s3)
    fmt.Println("s4:", s4)
}
```

#### 完整切片表达式 `a[low:high:max]`

完整切片表达式可以控制切片的容量：

```go
package main

import "fmt"

func main() {
    arr := [10]int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}

    // a[low:high:max]
    // 长度 = high - low
    // 容量 = max - low

    s1 := arr[2:5]    // 长度=3, 容量=8
    s2 := arr[2:5:6]  // 长度=3, 容量=4
    s3 := arr[2:5:5]  // 长度=3, 容量=3

    fmt.Printf("s1: len=%d, cap=%d\n", len(s1), cap(s1))
    fmt.Printf("s2: len=%d, cap=%d\n", len(s2), cap(s2))
    fmt.Printf("s3: len=%d, cap=%d\n", len(s3), cap(s3))

    // 为什么要限制容量？
    // 防止通过 append 意外修改底层数组的其他部分
}
```

### 底层数组共享

多个切片可以共享同一个底层数组，修改一个切片会影响其他切片：

```go
package main

import "fmt"

func main() {
    arr := [5]int{1, 2, 3, 4, 5}

    s1 := arr[1:4] // [2, 3, 4]
    s2 := arr[2:5] // [3, 4, 5]

    fmt.Println("修改前:")
    fmt.Println("arr:", arr)
    fmt.Println("s1:", s1)
    fmt.Println("s2:", s2)

    // 修改 s1 会影响 arr 和 s2
    s1[1] = 100

    fmt.Println("\n修改 s1[1] = 100 后:")
    fmt.Println("arr:", arr) // [1, 2, 100, 4, 5]
    fmt.Println("s1:", s1)   // [2, 100, 4]
    fmt.Println("s2:", s2)   // [100, 4, 5]
}
```

## 核心要点

### 创建切片的方式

Go 提供了多种创建切片的方式：

```go
package main

import "fmt"

func main() {
    // 方式 1: 切片字面量
    s1 := []int{1, 2, 3, 4, 5}

    // 方式 2: 从数组创建
    arr := [5]int{10, 20, 30, 40, 50}
    s2 := arr[1:4]

    // 方式 3: 使用 make 函数
    s3 := make([]int, 5)      // 长度和容量都是 5
    s4 := make([]int, 3, 10)  // 长度 3，容量 10

    // 方式 4: 从另一个切片创建
    s5 := s1[1:3]

    // 方式 5: 使用 new（不常用）
    s6 := new([5]int)[:]

    fmt.Println("s1:", s1)
    fmt.Println("s2:", s2)
    fmt.Println("s3:", s3)
    fmt.Println("s4:", s4, "len:", len(s4), "cap:", cap(s4))
    fmt.Println("s5:", s5)
    fmt.Println("s6:", s6)
}
```

### make 函数详解

`make` 是创建切片的推荐方式，它会初始化底层数组：

```go
package main

import "fmt"

func main() {
    // make([]T, length) - 创建指定长度的切片，容量等于长度
    s1 := make([]int, 5)
    fmt.Printf("s1: %v, len=%d, cap=%d\n", s1, len(s1), cap(s1))
    // s1: [0 0 0 0 0], len=5, cap=5

    // make([]T, length, capacity) - 创建指定长度和容量的切片
    s2 := make([]int, 3, 10)
    fmt.Printf("s2: %v, len=%d, cap=%d\n", s2, len(s2), cap(s2))
    // s2: [0 0 0], len=3, cap=10

    // 容量不能小于长度
    // s3 := make([]int, 10, 5) // 编译错误

    // 创建空切片（长度为 0）
    s4 := make([]int, 0, 5)
    fmt.Printf("s4: %v, len=%d, cap=%d\n", s4, len(s4), cap(s4))
    // s4: [], len=0, cap=5
}
```

### nil 切片与空切片

这是一个容易混淆但非常重要的概念：

```go
package main

import (
    "fmt"
    "reflect"
    "unsafe"
)

func main() {
    // nil 切片：没有底层数组
    var nilSlice []int

    // 空切片：有底层数组，但长度为 0
    emptySlice1 := []int{}
    emptySlice2 := make([]int, 0)

    fmt.Println("nil 切片:")
    fmt.Printf("  值: %v\n", nilSlice)
    fmt.Printf("  == nil: %t\n", nilSlice == nil)
    fmt.Printf("  len: %d, cap: %d\n", len(nilSlice), cap(nilSlice))

    fmt.Println("\n空切片 (字面量):")
    fmt.Printf("  值: %v\n", emptySlice1)
    fmt.Printf("  == nil: %t\n", emptySlice1 == nil)
    fmt.Printf("  len: %d, cap: %d\n", len(emptySlice1), cap(emptySlice1))

    fmt.Println("\n空切片 (make):")
    fmt.Printf("  值: %v\n", emptySlice2)
    fmt.Printf("  == nil: %t\n", emptySlice2 == nil)
    fmt.Printf("  len: %d, cap: %d\n", len(emptySlice2), cap(emptySlice2))

    // 查看底层数据指针
    printSliceHeader := func(name string, s []int) {
        header := (*reflect.SliceHeader)(unsafe.Pointer(&s))
        fmt.Printf("%s 数据指针: %v\n", name, header.Data)
    }

    fmt.Println("\n数据指针比较:")
    printSliceHeader("nilSlice", nilSlice)
    printSliceHeader("emptySlice1", emptySlice1)
    printSliceHeader("emptySlice2", emptySlice2)

    // 功能上它们是等价的
    fmt.Println("\n功能等价性:")
    for _, v := range nilSlice {
        fmt.Println(v) // 不会执行
    }
    nilSlice = append(nilSlice, 1, 2, 3)
    fmt.Println("append 到 nil 切片:", nilSlice)
}
```

**关键区别：**

| 特性 | nil 切片 | 空切片 |
|------|----------|--------|
| 声明方式 | `var s []int` | `s := []int{}` 或 `make([]int, 0)` |
| `== nil` | `true` | `false` |
| `len()` | `0` | `0` |
| `cap()` | `0` | `0` 或更大 |
| 数据指针 | `nil` (0) | 非 nil（指向零长度数组） |
| JSON 序列化 | `null` | `[]` |

### append 函数

`append` 是向切片添加元素的核心函数：

```go
package main

import "fmt"

func main() {
    // 基本用法
    s := []int{1, 2, 3}
    s = append(s, 4)        // 添加单个元素
    s = append(s, 5, 6, 7)  // 添加多个元素
    fmt.Println("基本 append:", s)

    // 追加另一个切片（使用 ... 展开）
    s2 := []int{8, 9, 10}
    s = append(s, s2...)
    fmt.Println("追加切片:", s)

    // append 的返回值必须接收
    // 因为 append 可能导致底层数组重新分配

    // 演示容量扩展
    s3 := make([]int, 0, 2)
    fmt.Printf("\n容量扩展演示:\n")
    for i := 1; i <= 10; i++ {
        oldCap := cap(s3)
        s3 = append(s3, i)
        if cap(s3) != oldCap {
            fmt.Printf("添加 %d: len=%d, cap: %d -> %d\n",
                i, len(s3), oldCap, cap(s3))
        }
    }
}
```

### append 的扩容机制

当切片容量不足时，`append` 会创建新的底层数组：

```go
package main

import (
    "fmt"
    "reflect"
    "unsafe"
)

func main() {
    s := make([]int, 0, 4)

    fmt.Println("观察扩容行为:")
    fmt.Printf("初始: len=%d, cap=%d\n\n", len(s), cap(s))

    for i := 1; i <= 20; i++ {
        oldPtr := (*reflect.SliceHeader)(unsafe.Pointer(&s)).Data
        oldCap := cap(s)

        s = append(s, i)

        newPtr := (*reflect.SliceHeader)(unsafe.Pointer(&s)).Data
        newCap := cap(s)

        if oldCap != newCap {
            fmt.Printf("第 %2d 次 append: cap %d -> %d, ", i, oldCap, newCap)
            if oldPtr != newPtr {
                fmt.Println("底层数组已更换")
            }
        }
    }

    // Go 1.18+ 扩容策略：
    // - 当容量 < 256 时，新容量 = 旧容量 * 2
    // - 当容量 >= 256 时，新容量 = 旧容量 + (旧容量 + 3*256) / 4
    // 这个公式使得增长率从 2x 平滑过渡到 1.25x
}
```

### copy 函数

`copy` 用于在切片之间复制元素：

```go
package main

import "fmt"

func main() {
    // 基本复制
    src := []int{1, 2, 3, 4, 5}
    dst := make([]int, 5)
    n := copy(dst, src)
    fmt.Printf("复制了 %d 个元素: %v\n", n, dst)

    // 复制到较小的目标
    smallDst := make([]int, 3)
    n = copy(smallDst, src)
    fmt.Printf("复制到较小切片: 复制了 %d 个: %v\n", n, smallDst)

    // 复制到较大的目标
    largeDst := make([]int, 10)
    n = copy(largeDst, src)
    fmt.Printf("复制到较大切片: 复制了 %d 个: %v\n", n, largeDst)

    // 部分复制
    partialDst := make([]int, 10)
    n = copy(partialDst[3:], src[1:4])
    fmt.Printf("部分复制: 复制了 %d 个: %v\n", n, partialDst)

    // 切片重叠时的复制（安全的）
    overlap := []int{1, 2, 3, 4, 5}
    copy(overlap[2:], overlap[:3])
    fmt.Println("重叠复制:", overlap)

    // 复制字符串到字节切片
    str := "Hello"
    bytes := make([]byte, len(str))
    copy(bytes, str)
    fmt.Println("字符串复制:", string(bytes))
}
```

## 代码示例

### 切片操作完整示例

```go
package main

import (
    "fmt"
    "sort"
)

func main() {
    // 1. 创建和初始化
    numbers := []int{5, 2, 8, 1, 9, 3, 7, 4, 6}
    fmt.Println("原始切片:", numbers)

    // 2. 访问和修改元素
    fmt.Println("第一个元素:", numbers[0])
    fmt.Println("最后一个元素:", numbers[len(numbers)-1])
    numbers[0] = 100
    fmt.Println("修改后:", numbers)

    // 3. 切片操作
    subSlice := numbers[2:5]
    fmt.Println("子切片 [2:5]:", subSlice)

    // 4. 追加元素
    numbers = append(numbers, 10, 11, 12)
    fmt.Println("追加后:", numbers)

    // 5. 复制切片
    copied := make([]int, len(numbers))
    copy(copied, numbers)
    fmt.Println("复制的切片:", copied)

    // 6. 排序
    sort.Ints(copied)
    fmt.Println("排序后:", copied)

    // 7. 反转切片
    for i, j := 0, len(copied)-1; i < j; i, j = i+1, j-1 {
        copied[i], copied[j] = copied[j], copied[i]
    }
    fmt.Println("反转后:", copied)

    // 8. 过滤（保留偶数）
    evens := []int{}
    for _, v := range copied {
        if v%2 == 0 {
            evens = append(evens, v)
        }
    }
    fmt.Println("偶数:", evens)

    // 9. 映射（每个元素乘以 2）
    doubled := make([]int, len(evens))
    for i, v := range evens {
        doubled[i] = v * 2
    }
    fmt.Println("加倍:", doubled)

    // 10. 查找元素
    target := 12
    found := -1
    for i, v := range numbers {
        if v == target {
            found = i
            break
        }
    }
    if found != -1 {
        fmt.Printf("找到 %d 在索引 %d\n", target, found)
    }
}
```

### 删除切片元素

```go
package main

import "fmt"

func main() {
    // 删除指定索引的元素

    // 方法 1: 使用 append（不保持顺序）
    s1 := []int{1, 2, 3, 4, 5}
    i := 2 // 删除索引 2 的元素（值为 3）
    s1[i] = s1[len(s1)-1] // 用最后一个元素覆盖
    s1 = s1[:len(s1)-1]   // 截断最后一个
    fmt.Println("方法1 (不保持顺序):", s1) // [1 2 5 4]

    // 方法 2: 使用 append（保持顺序）
    s2 := []int{1, 2, 3, 4, 5}
    i = 2
    s2 = append(s2[:i], s2[i+1:]...)
    fmt.Println("方法2 (保持顺序):", s2) // [1 2 4 5]

    // 方法 3: 使用 copy（保持顺序，避免内存泄漏）
    s3 := []int{1, 2, 3, 4, 5}
    i = 2
    copy(s3[i:], s3[i+1:])
    s3[len(s3)-1] = 0 // 清理最后一个元素（对于引用类型很重要）
    s3 = s3[:len(s3)-1]
    fmt.Println("方法3 (copy):", s3) // [1 2 4 5]

    // 删除多个元素（范围删除）
    s4 := []int{1, 2, 3, 4, 5, 6, 7}
    start, end := 2, 5 // 删除索引 2-4 的元素
    s4 = append(s4[:start], s4[end:]...)
    fmt.Println("范围删除:", s4) // [1 2 6 7]

    // 删除满足条件的元素
    s5 := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    // 删除所有偶数
    n := 0
    for _, v := range s5 {
        if v%2 != 0 {
            s5[n] = v
            n++
        }
    }
    s5 = s5[:n]
    fmt.Println("删除偶数:", s5) // [1 3 5 7 9]
}
```

### 插入元素

```go
package main

import "fmt"

func main() {
    // 在指定位置插入单个元素
    s := []int{1, 2, 3, 4, 5}
    i := 2
    element := 100

    // 方法 1: 使用 append
    s = append(s[:i], append([]int{element}, s[i:]...)...)
    fmt.Println("插入后:", s) // [1 2 100 3 4 5]

    // 方法 2: 更高效的方式（避免创建临时切片）
    s2 := []int{1, 2, 3, 4, 5}
    s2 = append(s2, 0) // 先扩展一个位置
    copy(s2[i+1:], s2[i:]) // 移动元素
    s2[i] = element
    fmt.Println("高效插入:", s2)

    // 插入多个元素
    s3 := []int{1, 2, 5, 6}
    elements := []int{3, 4}
    i = 2

    // 创建新切片
    result := make([]int, len(s3)+len(elements))
    copy(result, s3[:i])
    copy(result[i:], elements)
    copy(result[i+len(elements):], s3[i:])
    fmt.Println("插入多个元素:", result) // [1 2 3 4 5 6]
}
```

### 切片作为函数参数

```go
package main

import "fmt"

// 切片是引用类型，修改会影响原切片
func modifySlice(s []int) {
    for i := range s {
        s[i] *= 2
    }
}

// append 可能改变切片引用
func appendToSlice(s []int) []int {
    return append(s, 100, 200)
}

// 错误示例：没有返回新切片
func wrongAppend(s []int) {
    s = append(s, 100) // 这个修改不会影响调用者
}

// 使用指针可以修改切片本身
func appendWithPointer(s *[]int) {
    *s = append(*s, 100)
}

func main() {
    // 修改元素
    s1 := []int{1, 2, 3, 4, 5}
    fmt.Println("修改前:", s1)
    modifySlice(s1)
    fmt.Println("修改后:", s1) // 元素被修改

    // append 需要返回值
    s2 := []int{1, 2, 3}
    s2 = appendToSlice(s2)
    fmt.Println("正确的 append:", s2)

    // 错误的 append
    s3 := []int{1, 2, 3}
    wrongAppend(s3)
    fmt.Println("错误的 append:", s3) // 不变

    // 使用指针
    s4 := []int{1, 2, 3}
    appendWithPointer(&s4)
    fmt.Println("指针 append:", s4)
}
```

## 最佳实践

### 预分配容量

当知道切片的最终大小时，预分配可以避免多次扩容：

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
    fmt.Printf("无预分配: %v\n", time.Since(start))

    start = time.Now()
    withPrealloc(n)
    fmt.Printf("有预分配: %v\n", time.Since(start))
}
```

### 使用完整切片表达式防止意外修改

```go
package main

import "fmt"

func main() {
    original := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

    // 不安全：子切片可以通过 append 修改原始数组
    unsafeSlice := original[2:5]
    unsafeSlice = append(unsafeSlice, 100) // 会修改 original[5]
    fmt.Println("原始数组（被修改）:", original)

    // 重置
    original = []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

    // 安全：使用完整切片表达式限制容量
    safeSlice := original[2:5:5] // 容量 = 3
    safeSlice = append(safeSlice, 100) // 会分配新数组
    fmt.Println("原始数组（未修改）:", original)
    fmt.Println("安全切片:", safeSlice)
}
```

### 正确复制切片

```go
package main

import "fmt"

func main() {
    original := []int{1, 2, 3, 4, 5}

    // 错误方式：只复制切片头
    wrongCopy := original
    wrongCopy[0] = 100
    fmt.Println("错误复制后原始:", original) // 被修改了

    // 重置
    original = []int{1, 2, 3, 4, 5}

    // 正确方式 1：使用 make + copy
    correctCopy1 := make([]int, len(original))
    copy(correctCopy1, original)
    correctCopy1[0] = 100
    fmt.Println("正确复制1后原始:", original) // 未修改

    // 正确方式 2：使用 append
    correctCopy2 := append([]int(nil), original...)
    correctCopy2[0] = 200
    fmt.Println("正确复制2后原始:", original) // 未修改

    // 正确方式 3：使用切片表达式（Go 1.21+）
    // correctCopy3 := slices.Clone(original)
}
```

### 避免内存泄漏

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
    // 问题场景：切片持有大数组的引用
    largeSlice := make([]*LargeStruct, 1000)
    for i := range largeSlice {
        largeSlice[i] = &LargeStruct{}
    }

    // 截取子切片
    // 问题：subSlice 仍然持有对整个底层数组的引用
    // 即使我们只需要前 10 个元素
    subSlice := largeSlice[:10]

    // 大部分内存无法被回收
    largeSlice = nil
    runtime.GC()

    // 解决方案：复制需要的元素到新切片
    properSubSlice := make([]*LargeStruct, len(subSlice))
    copy(properSubSlice, subSlice)
    subSlice = nil
    runtime.GC()

    fmt.Println("正确的子切片长度:", len(properSubSlice))

    // 对于删除元素的场景，记得清理引用
    slice := []*LargeStruct{{}, {}, {}}
    // 删除最后一个元素
    slice[len(slice)-1] = nil // 重要：清理引用
    slice = slice[:len(slice)-1]
}
```

### 使用切片而不是指针切片（当合适时）

```go
package main

import "fmt"

// 值类型切片：更好的缓存局部性
type Point struct {
    X, Y float64
}

// 指针切片：每个元素可能在不同的内存位置
type PointPtr = *Point

func main() {
    // 值切片 - 连续内存布局
    points := []Point{
        {1, 2},
        {3, 4},
        {5, 6},
    }

    // 指针切片 - 分散的内存布局
    pointPtrs := []*Point{
        {1, 2},
        {3, 4},
        {5, 6},
    }

    // 对于小型结构体，值切片通常更高效
    fmt.Println("值切片:", points)
    fmt.Println("指针切片:", *pointPtrs[0], *pointPtrs[1], *pointPtrs[2])

    // 使用指针切片的场景：
    // 1. 结构体很大（超过 64 字节）
    // 2. 需要 nil 值表示缺失
    // 3. 需要共享修改
}
```

## 常见陷阱

### append 可能创建新数组

```go
package main

import "fmt"

func main() {
    // 原始切片
    original := make([]int, 3, 3)
    original[0], original[1], original[2] = 1, 2, 3

    // 创建子切片
    sub := original[:2]

    fmt.Println("append 前:")
    fmt.Println("original:", original)
    fmt.Println("sub:", sub)

    // 关键点：append 可能改变底层数组
    sub = append(sub, 100)

    fmt.Println("\nappend 后:")
    fmt.Println("original:", original) // 被修改！因为还有容量
    fmt.Println("sub:", sub)

    // 再次 append
    sub = append(sub, 200)

    fmt.Println("\n再次 append 后:")
    fmt.Println("original:", original) // 不变，因为 sub 已经分配了新数组
    fmt.Println("sub:", sub)
}
```

### 循环变量陷阱

```go
package main

import "fmt"

func main() {
    // 陷阱：循环变量被重用
    slice := []int{1, 2, 3, 4, 5}

    // 错误：所有闭包捕获同一个变量
    funcs := []func(){}
    for _, v := range slice {
        funcs = append(funcs, func() {
            fmt.Println(v) // 捕获的是变量 v，不是值
        })
    }

    fmt.Println("错误的结果:")
    for _, f := range funcs {
        f() // 全部打印 5
    }

    // 正确：在循环内创建新变量
    funcs2 := []func(){}
    for _, v := range slice {
        v := v // 创建新变量
        funcs2 = append(funcs2, func() {
            fmt.Println(v)
        })
    }

    fmt.Println("\n正确的结果:")
    for _, f := range funcs2 {
        f() // 打印 1, 2, 3, 4, 5
    }

    // Go 1.22+ 已修复此问题，循环变量每次迭代都是新的
}
```

### range 返回的是值的副本

```go
package main

import "fmt"

type Item struct {
    Value int
}

func main() {
    items := []Item{{1}, {2}, {3}}

    // 错误：修改的是副本
    for _, item := range items {
        item.Value *= 10 // 不会修改原切片
    }
    fmt.Println("错误方式:", items) // [{1} {2} {3}]

    // 正确：使用索引
    for i := range items {
        items[i].Value *= 10
    }
    fmt.Println("正确方式:", items) // [{10} {20} {30}]

    // 或者使用指针切片
    itemPtrs := []*Item{{1}, {2}, {3}}
    for _, item := range itemPtrs {
        item.Value *= 10 // 通过指针修改
    }
    fmt.Println("指针方式:", *itemPtrs[0], *itemPtrs[1], *itemPtrs[2])
}
```

### 切片比较

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    s1 := []int{1, 2, 3}
    s2 := []int{1, 2, 3}

    // 编译错误：切片不能直接比较
    // fmt.Println(s1 == s2)

    // 只能与 nil 比较
    var s3 []int
    fmt.Println("s3 == nil:", s3 == nil)

    // 比较切片内容的方法

    // 方法 1：使用 reflect.DeepEqual（慢）
    fmt.Println("DeepEqual:", reflect.DeepEqual(s1, s2))

    // 方法 2：手动比较
    equal := len(s1) == len(s2)
    if equal {
        for i := range s1 {
            if s1[i] != s2[i] {
                equal = false
                break
            }
        }
    }
    fmt.Println("手动比较:", equal)

    // 方法 3：Go 1.21+ 使用 slices.Equal
    // fmt.Println("slices.Equal:", slices.Equal(s1, s2))
}
```

### 并发访问切片

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    // 错误：并发写入切片（数据竞争）
    // var slice []int
    // var wg sync.WaitGroup
    // for i := 0; i < 1000; i++ {
    //     wg.Add(1)
    //     go func(v int) {
    //         defer wg.Done()
    //         slice = append(slice, v) // 数据竞争！
    //     }(i)
    // }
    // wg.Wait()

    // 正确方式 1：使用互斥锁
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
    fmt.Println("互斥锁方式，长度:", len(slice1))

    // 正确方式 2：使用 channel
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
    fmt.Println("Channel 方式，长度:", len(slice2))
}
```

## 性能考量

### 预分配 vs 动态增长

```go
package main

import (
    "fmt"
    "testing"
)

func BenchmarkWithoutPrealloc(b *testing.B) {
    for i := 0; i < b.N; i++ {
        var s []int
        for j := 0; j < 10000; j++ {
            s = append(s, j)
        }
    }
}

func BenchmarkWithPrealloc(b *testing.B) {
    for i := 0; i < b.N; i++ {
        s := make([]int, 0, 10000)
        for j := 0; j < 10000; j++ {
            s = append(s, j)
        }
    }
}

func BenchmarkWithIndex(b *testing.B) {
    for i := 0; i < b.N; i++ {
        s := make([]int, 10000)
        for j := 0; j < 10000; j++ {
            s[j] = j
        }
    }
}

func main() {
    // 运行基准测试：go test -bench=. -benchmem
    fmt.Println("性能比较:")
    fmt.Println("1. 无预分配：最慢，多次内存分配")
    fmt.Println("2. 预分配容量：中等，一次分配但使用 append")
    fmt.Println("3. 预分配长度：最快，一次分配直接索引赋值")
}
```

### copy vs append 复制

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

    // 性能：make+copy 和 append+make 通常最快
    // append nil 可能略慢因为需要从 0 开始增长
}
```

### 删除元素的性能

```go
package main

import "fmt"

// O(1) 删除 - 不保持顺序
func deleteUnordered(s []int, i int) []int {
    s[i] = s[len(s)-1]
    return s[:len(s)-1]
}

// O(n) 删除 - 保持顺序
func deleteOrdered(s []int, i int) []int {
    return append(s[:i], s[i+1:]...)
}

// O(n) 删除 - 使用 copy
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

    fmt.Println("无序删除:", s1)
    fmt.Println("有序删除 (append):", s2)
    fmt.Println("有序删除 (copy):", s3)

    // 如果不需要保持顺序，无序删除是 O(1) 的
}
```

### 切片内存布局对缓存的影响

```go
package main

import (
    "fmt"
    "time"
)

const size = 10000000

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
    // 创建矩阵
    rows, cols := 1000, 1000
    matrix := make([][]int, rows)
    for i := range matrix {
        matrix[i] = make([]int, cols)
        for j := range matrix[i] {
            matrix[i][j] = i + j
        }
    }

    // 按行遍历（缓存友好）
    start := time.Now()
    for i := 0; i < 100; i++ {
        sumByRow(matrix)
    }
    fmt.Printf("按行遍历: %v\n", time.Since(start))

    // 按列遍历（缓存不友好）
    start = time.Now()
    for i := 0; i < 100; i++ {
        sumByColumn(matrix)
    }
    fmt.Printf("按列遍历: %v\n", time.Since(start))

    // 按行遍历通常更快，因为内存访问是连续的
}
```

## 实战场景

### 场景 1：实现栈和队列

```go
package main

import "fmt"

// 使用切片实现栈
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

func (s *Stack) Peek() (int, bool) {
    if len(s.data) == 0 {
        return 0, false
    }
    return s.data[len(s.data)-1], true
}

func (s *Stack) Size() int {
    return len(s.data)
}

// 使用切片实现队列
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
    // 栈示例
    stack := NewStack()
    stack.Push(1)
    stack.Push(2)
    stack.Push(3)

    fmt.Println("栈操作:")
    for stack.Size() > 0 {
        if v, ok := stack.Pop(); ok {
            fmt.Printf("弹出: %d\n", v)
        }
    }

    // 队列示例
    queue := NewQueue()
    queue.Enqueue(1)
    queue.Enqueue(2)
    queue.Enqueue(3)

    fmt.Println("\n队列操作:")
    for queue.Size() > 0 {
        if v, ok := queue.Dequeue(); ok {
            fmt.Printf("出队: %d\n", v)
        }
    }
}
```

### 场景 2：滑动窗口

```go
package main

import "fmt"

// 滑动窗口最大值
func maxSlidingWindow(nums []int, k int) []int {
    if len(nums) == 0 || k == 0 {
        return []int{}
    }

    result := make([]int, 0, len(nums)-k+1)
    deque := make([]int, 0, k) // 存储索引

    for i, num := range nums {
        // 移除超出窗口范围的元素
        for len(deque) > 0 && deque[0] <= i-k {
            deque = deque[1:]
        }

        // 移除所有小于当前元素的元素
        for len(deque) > 0 && nums[deque[len(deque)-1]] < num {
            deque = deque[:len(deque)-1]
        }

        deque = append(deque, i)

        // 当窗口形成后，记录最大值
        if i >= k-1 {
            result = append(result, nums[deque[0]])
        }
    }

    return result
}

func main() {
    nums := []int{1, 3, -1, -3, 5, 3, 6, 7}
    k := 3

    result := maxSlidingWindow(nums, k)
    fmt.Println("输入:", nums)
    fmt.Println("窗口大小:", k)
    fmt.Println("滑动窗口最大值:", result)
}
```

### 场景 3：内存池

```go
package main

import (
    "fmt"
    "sync"
)

// 切片内存池
type SlicePool struct {
    pool sync.Pool
    size int
}

func NewSlicePool(size int) *SlicePool {
    return &SlicePool{
        pool: sync.Pool{
            New: func() interface{} {
                s := make([]byte, size)
                return &s
            },
        },
        size: size,
    }
}

func (p *SlicePool) Get() *[]byte {
    return p.pool.Get().(*[]byte)
}

func (p *SlicePool) Put(s *[]byte) {
    // 重置切片
    *s = (*s)[:0]
    p.pool.Put(s)
}

func main() {
    pool := NewSlicePool(1024)

    // 获取切片
    buf := pool.Get()
    fmt.Printf("获取的切片: len=%d, cap=%d\n", len(*buf), cap(*buf))

    // 使用切片
    *buf = append(*buf, "Hello, World!"...)
    fmt.Printf("使用后: len=%d, 内容=%s\n", len(*buf), string(*buf))

    // 归还切片
    pool.Put(buf)

    // 再次获取（可能是同一个切片）
    buf2 := pool.Get()
    fmt.Printf("再次获取: len=%d, cap=%d\n", len(*buf2), cap(*buf2))
}
```

### 场景 4：分页处理

```go
package main

import "fmt"

type Item struct {
    ID   int
    Name string
}

// 分页函数
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

// 计算总页数
func totalPages(total, pageSize int) int {
    return (total + pageSize - 1) / pageSize
}

func main() {
    // 创建测试数据
    items := make([]Item, 100)
    for i := range items {
        items[i] = Item{ID: i + 1, Name: fmt.Sprintf("Item-%d", i+1)}
    }

    pageSize := 10

    // 遍历所有页
    pages := totalPages(len(items), pageSize)
    fmt.Printf("总记录数: %d, 每页 %d 条, 共 %d 页\n\n",
        len(items), pageSize, pages)

    for page := 1; page <= pages; page++ {
        result, total := paginate(items, page, pageSize)
        fmt.Printf("第 %d 页 (共 %d 条):\n", page, total)
        for _, item := range result {
            fmt.Printf("  %s\n", item.Name)
        }
        fmt.Println()
    }
}
```

### 场景 5：批处理

```go
package main

import (
    "fmt"
    "sync"
)

// 将切片分成批次
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

// 并发处理批次
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
    // 创建测试数据
    items := make([]int, 100)
    for i := range items {
        items[i] = i + 1
    }

    // 分批处理
    batchSize := 10
    batches := batch(items, batchSize)

    fmt.Printf("总数: %d, 批次大小: %d, 批次数: %d\n",
        len(items), batchSize, len(batches))

    for i, b := range batches {
        fmt.Printf("批次 %d: %v\n", i+1, b)
    }

    // 并发计算总和
    sum := processBatches(items, batchSize, func(batch []int) int {
        s := 0
        for _, v := range batch {
            s += v
        }
        return s
    })

    fmt.Printf("\n并发计算总和: %d\n", sum)
}
```

## 面试要点

### 切片的内部结构

**问题：请描述 Go 切片的内部结构。**

**答案：**
切片在运行时由三个字段组成：
- `Data`：指向底层数组的指针
- `Len`：切片的长度，表示当前元素数量
- `Cap`：切片的容量，表示从切片起始位置到底层数组末尾的元素数量

```go
// 在 reflect 包中定义
type SliceHeader struct {
    Data uintptr
    Len  int
    Cap  int
}
```

在 64 位系统上，切片头占用 24 字节（3 个 8 字节字段）。

### nil 切片与空切片的区别

**问题：`var s []int` 和 `s := []int{}` 有什么区别？**

**答案：**
- `var s []int`：声明 nil 切片，Data 指针为 nil，与 nil 比较返回 true
- `s := []int{}`：创建空切片，Data 指针指向一个零长度数组，与 nil 比较返回 false

两者功能等价（len、cap 都为 0，可以 append），但 JSON 序列化结果不同：nil 切片序列化为 `null`，空切片序列化为 `[]`。

### append 的扩容策略

**问题：当切片容量不足时，append 如何扩容？**

**答案：**
Go 1.18 之前：
- 容量 < 1024：新容量 = 旧容量 * 2
- 容量 >= 1024：新容量 = 旧容量 * 1.25

Go 1.18+：
- 容量 < 256：新容量 = 旧容量 * 2
- 容量 >= 256：新容量 = 旧容量 + (旧容量 + 3*256) / 4

新策略使增长率从 2x 平滑过渡到约 1.25x。

### 切片作为函数参数

**问题：切片是值传递还是引用传递？**

**答案：**
Go 只有值传递。切片作为参数时，复制的是切片头（24 字节），而不是底层数组。因此：
- 修改切片元素会影响原切片（共享底层数组）
- 使用 append 可能不会影响原切片（如果触发扩容，会创建新数组）

```go
func modify(s []int) {
    s[0] = 100      // 会影响原切片
    s = append(s, 4) // 不会影响原切片（如果扩容）
}
```

### 如何安全地复制切片

**问题：如何创建切片的独立副本？**

**答案：**
```go
// 方法 1: make + copy
dst := make([]int, len(src))
copy(dst, src)

// 方法 2: append
dst := append([]int(nil), src...)

// 方法 3: Go 1.21+ slices.Clone
dst := slices.Clone(src)
```

### 切片的常见陷阱

**问题：使用切片时需要注意哪些陷阱？**

**答案：**
1. **共享底层数组**：子切片修改会影响原切片
2. **append 可能创建新数组**：容量不足时会分配新内存
3. **循环变量捕获**：闭包捕获的是变量引用，不是值
4. **range 返回副本**：for-range 的值是元素的副本
5. **内存泄漏**：子切片持有大数组的引用
6. **并发访问**：切片不是并发安全的

## 延伸阅读

### 官方资源

- [Go 语言规范 - 切片](https://go.dev/ref/spec#Slice_types)
- [Go 博客 - Go 切片：用法和内部机制](https://go.dev/blog/slices-intro)
- [Go 博客 - 数组、切片和字符串](https://go.dev/blog/slices)
- [Effective Go - 切片](https://go.dev/doc/effective_go#slices)

### 推荐文章

- [Go 切片的秘密](https://go.dev/blog/slices)
- [切片技巧](https://github.com/golang/go/wiki/SliceTricks)
- [Go 数据结构](https://research.swtch.com/godata)

### 标准库参考

- [slices 包](https://pkg.go.dev/slices)（Go 1.21+）
- [sort 包](https://pkg.go.dev/sort)
- [reflect.SliceHeader](https://pkg.go.dev/reflect#SliceHeader)

### 源码阅读

- [runtime/slice.go](https://github.com/golang/go/blob/master/src/runtime/slice.go) - 切片运行时实现
- [builtin/builtin.go](https://github.com/golang/go/blob/master/src/builtin/builtin.go) - append、copy 等内置函数文档

掌握切片是精通 Go 语言的关键一步。通过理解其内部结构和工作原理，你将能够写出更高效、更安全的代码。继续实践和探索，将切片的知识运用到实际项目中！
