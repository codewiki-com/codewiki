---
title: Go 语言基础
description: 深入理解 Go 基础：变量、常量、数据类型、函数与控制流
track: go
section: basics
difficulty: beginner
tags:
  - Go
  - 基础
  - 变量
  - 函数
status: imported
origin: old/src/content/docs/go/fundamentals.zh.md
divergence: 0.277
issues: []
legacy:
  category: Go
  subcategory: 语言基础
  order: 1
  lastUpdated: 2026-01-07
---

Go 语言是一门现代化的编程语言，由 Google 开发，以其简洁、高效和强大的并发特性而闻名。本文将深入介绍 Go 语言的基础知识，帮助你建立扎实的编程基础。

## 包与导入

### 包的概念

在 Go 中，每个程序都是由包（package）构成的。包是 Go 代码组织的基本单位，用于将相关的功能组织在一起。

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
```

**重点说明：**
- 每个 Go 文件必须以 `package` 声明开始
- `main` 包是程序的入口点，包含 `main()` 函数
- 可执行程序必须有一个 `main` 包

### 导入包

Go 提供了多种导入包的方式：

```go
// 单个导入
import "fmt"
import "math"

// 分组导入（推荐）
import (
    "fmt"
    "math"
    "strings"
)

// 导入别名
import (
    f "fmt"
    m "math"
)

// 匿名导入（只执行包的 init 函数）
import _ "image/png"

// 点导入（不推荐，会污染命名空间）
import . "fmt"
```

### 包的可见性

Go 使用大小写来控制标识符的可见性：

```go
package mypackage

// 公开函数（首字母大写）
func PublicFunction() {
    fmt.Println("可以被其他包访问")
}

// 私有函数（首字母小写）
func privateFunction() {
    fmt.Println("只能在本包内访问")
}
```

## 变量与常量

### 变量声明

Go 提供了多种声明变量的方式：

```go
package main

import "fmt"

func main() {
    // 方式 1: var 关键字声明
    var name string
    name = "张三"

    // 方式 2: 声明并初始化
    var age int = 25

    // 方式 3: 类型推断
    var city = "北京"

    // 方式 4: 短变量声明（只能在函数内使用）
    country := "中国"

    // 多变量声明
    var (
        username = "user123"
        password = "secret"
        isActive = true
    )

    // 同时声明多个变量
    var x, y, z int = 1, 2, 3
    a, b, c := 10, 20, 30

    fmt.Println(name, age, city, country)
    fmt.Println(username, password, isActive)
    fmt.Println(x, y, z, a, b, c)
}
```

### 零值

在 Go 中，声明但未初始化的变量会被赋予零值：

```go
func main() {
    var i int       // 0
    var f float64   // 0.0
    var b bool      // false
    var s string    // ""（空字符串）
    var p *int      // nil

    fmt.Printf("int: %d, float: %f, bool: %t, string: %q, pointer: %v\n",
        i, f, b, s, p)
}
```

### 常量

常量使用 `const` 关键字声明，在编译时确定值：

```go
package main

import "fmt"

func main() {
    // 单个常量
    const Pi = 3.14159

    // 多个常量
    const (
        StatusOK       = 200
        StatusNotFound = 404
        StatusError    = 500
    )

    // 枚举（使用 iota）
    const (
        Sunday = iota    // 0
        Monday           // 1
        Tuesday          // 2
        Wednesday        // 3
        Thursday         // 4
        Friday           // 5
        Saturday         // 6
    )

    // iota 的高级用法
    const (
        _  = iota             // 0（跳过）
        KB = 1 << (10 * iota) // 1024
        MB                     // 1048576
        GB                     // 1073741824
    )

    fmt.Println(Pi, StatusOK)
    fmt.Println(Monday, Friday)
    fmt.Println(KB, MB, GB)
}
```

## 基本数据类型

### 数值类型

```go
package main

import "fmt"

func main() {
    // 整数类型
    var i8 int8 = 127           // -128 到 127
    var i16 int16 = 32767       // -32768 到 32767
    var i32 int32 = 2147483647
    var i64 int64 = 9223372036854775807

    // 无符号整数
    var ui8 uint8 = 255         // 0 到 255
    var ui16 uint16 = 65535
    var ui32 uint32 = 4294967295
    var ui64 uint64 = 18446744073709551615

    // 平台相关的整数类型
    var i int       // 32 位或 64 位
    var ui uint     // 32 位或 64 位
    var uptr uintptr // 存储指针的无符号整数

    // 浮点数
    var f32 float32 = 3.14
    var f64 float64 = 3.14159265359

    // 复数
    var c64 complex64 = 1 + 2i
    var c128 complex128 = 3 + 4i

    // 字节和符文（rune）
    var b byte = 'A'    // uint8 的别名
    var r rune = '中'   // int32 的别名，表示 Unicode 码点

    fmt.Println(i8, i16, i32, i64)
    fmt.Println(ui8, ui16, ui32, ui64)
    fmt.Println(i, ui, uptr)
    fmt.Println(f32, f64)
    fmt.Println(c64, c128)
    fmt.Println(b, r)
}
```

### 字符串

```go
package main

import (
    "fmt"
    "strings"
)

func main() {
    // 字符串声明
    var str1 string = "Hello, World!"
    str2 := "你好，世界！"

    // 多行字符串（原始字符串）
    str3 := `这是一个
多行
字符串`

    // 字符串是不可变的
    // str1[0] = 'h' // 编译错误

    // 字符串长度
    fmt.Println("长度:", len(str1))      // 字节长度
    fmt.Println("字符数:", len([]rune(str2))) // 字符数量

    // 字符串拼接
    greeting := "你好" + "，" + "Go"
    fmt.Println(greeting)

    // 字符串索引和切片
    fmt.Println("首字符:", str1[0])
    fmt.Println("子串:", str1[0:5])

    // 字符串遍历
    for i, ch := range "Go语言" {
        fmt.Printf("索引 %d: %c\n", i, ch)
    }

    // 常用字符串操作
    fmt.Println("包含:", strings.Contains(str1, "World"))
    fmt.Println("前缀:", strings.HasPrefix(str1, "Hello"))
    fmt.Println("后缀:", strings.HasSuffix(str1, "!"))
    fmt.Println("分割:", strings.Split("a,b,c", ","))
    fmt.Println("连接:", strings.Join([]string{"a", "b", "c"}, "-"))
    fmt.Println("替换:", strings.Replace(str1, "World", "Go", 1))
    fmt.Println("大写:", strings.ToUpper(str1))
    fmt.Println("小写:", strings.ToLower(str1))
}
```

### 布尔类型

```go
package main

import "fmt"

func main() {
    var isTrue bool = true
    var isFalse bool = false

    // 逻辑运算
    fmt.Println("与:", isTrue && isFalse)  // false
    fmt.Println("或:", isTrue || isFalse)  // true
    fmt.Println("非:", !isTrue)            // false

    // 比较运算
    fmt.Println("等于:", 5 == 5)      // true
    fmt.Println("不等于:", 5 != 3)    // true
    fmt.Println("大于:", 5 > 3)       // true
    fmt.Println("小于:", 5 < 3)       // false
    fmt.Println("大于等于:", 5 >= 5)  // true
    fmt.Println("小于等于:", 5 <= 3)  // false
}
```

### 类型转换

Go 要求显式类型转换：

```go
package main

import (
    "fmt"
    "strconv"
)

func main() {
    // 数值类型转换
    var i int = 42
    var f float64 = float64(i)
    var u uint = uint(f)

    fmt.Printf("i = %d, f = %f, u = %d\n", i, f, u)

    // 字符串转换
    num := 123
    str := strconv.Itoa(num)                    // int 转 string
    fmt.Printf("字符串: %s\n", str)

    str2 := "456"
    num2, err := strconv.Atoi(str2)             // string 转 int
    if err == nil {
        fmt.Printf("数字: %d\n", num2)
    }

    // 其他转换
    f64 := 3.14
    str3 := strconv.FormatFloat(f64, 'f', 2, 64) // float 转 string
    fmt.Println("浮点数字符串:", str3)

    str4 := "3.14"
    f64_2, _ := strconv.ParseFloat(str4, 64)     // string 转 float
    fmt.Println("解析的浮点数:", f64_2)
}
```

## 函数

### 基本函数

```go
package main

import "fmt"

// 无参数无返回值
func sayHello() {
    fmt.Println("Hello!")
}

// 有参数有返回值
func add(a int, b int) int {
    return a + b
}

// 相同类型参数简写
func multiply(a, b int) int {
    return a * b
}

// 多返回值
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("除数不能为零")
    }
    return a / b, nil
}

// 命名返回值
func getCoordinates() (x, y int) {
    x = 10
    y = 20
    return // 裸返回
}

// 可变参数
func sum(numbers ...int) int {
    total := 0
    for _, num := range numbers {
        total += num
    }
    return total
}

func main() {
    sayHello()

    fmt.Println("加法:", add(3, 5))
    fmt.Println("乘法:", multiply(4, 6))

    result, err := divide(10, 2)
    if err != nil {
        fmt.Println("错误:", err)
    } else {
        fmt.Println("除法:", result)
    }

    x, y := getCoordinates()
    fmt.Printf("坐标: (%d, %d)\n", x, y)

    fmt.Println("求和:", sum(1, 2, 3, 4, 5))
}
```

### 函数作为值

```go
package main

import "fmt"

func main() {
    // 函数赋值给变量
    add := func(a, b int) int {
        return a + b
    }

    fmt.Println("匿名函数:", add(3, 4))

    // 函数作为参数
    operate := func(a, b int, op func(int, int) int) int {
        return op(a, b)
    }

    fmt.Println("函数参数:", operate(10, 5, add))

    // 闭包
    counter := func() func() int {
        count := 0
        return func() int {
            count++
            return count
        }
    }

    increment := counter()
    fmt.Println("闭包:", increment()) // 1
    fmt.Println("闭包:", increment()) // 2
    fmt.Println("闭包:", increment()) // 3
}
```

### 方法

方法是带有接收者的函数：

```go
package main

import (
    "fmt"
    "math"
)

// 定义结构体
type Circle struct {
    Radius float64
}

// 值接收者方法
func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

// 指针接收者方法
func (c *Circle) Scale(factor float64) {
    c.Radius *= factor
}

func main() {
    circle := Circle{Radius: 5}

    fmt.Printf("面积: %.2f\n", circle.Area())

    circle.Scale(2)
    fmt.Printf("缩放后半径: %.2f\n", circle.Radius)
    fmt.Printf("缩放后面积: %.2f\n", circle.Area())
}
```

## defer 语句

`defer` 用于延迟函数的执行，通常用于清理资源。

### 基本用法

```go
package main

import "fmt"

func main() {
    defer fmt.Println("世界")
    fmt.Println("你好")
    // 输出:
    // 你好
    // 世界
}
```

### defer 执行顺序

defer 遵循后进先出（LIFO）的顺序：

```go
package main

import "fmt"

func main() {
    fmt.Println("开始")

    defer fmt.Println("defer 1")
    defer fmt.Println("defer 2")
    defer fmt.Println("defer 3")

    fmt.Println("结束")

    // 输出:
    // 开始
    // 结束
    // defer 3
    // defer 2
    // defer 1
}
```

### defer 的实际应用

```go
package main

import (
    "fmt"
    "os"
)

// 文件操作示例
func readFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close() // 确保文件被关闭

    // 读取文件内容
    // ...

    return nil
}

// defer 与参数求值
func deferExample() {
    i := 1
    defer fmt.Println("defer 中的 i:", i) // i = 1（立即求值）
    i++
    fmt.Println("函数中的 i:", i) // i = 2

    // 输出:
    // 函数中的 i: 2
    // defer 中的 i: 1
}

// defer 与返回值
func returnValue() (result int) {
    defer func() {
        result++
    }()
    return 5
    // 实际返回 6
}

func main() {
    deferExample()
    fmt.Println("返回值:", returnValue())
}
```

### defer 的陷阱

```go
package main

import "fmt"

func main() {
    // 陷阱 1: 循环中的 defer
    for i := 0; i < 5; i++ {
        defer fmt.Println("循环 defer:", i)
    }
    // 所有 defer 在函数结束时执行，可能导致资源堆积

    // 解决方案：使用匿名函数
    for i := 0; i < 5; i++ {
        func() {
            defer fmt.Println("正确的循环 defer:", i)
        }()
    }

    // 陷阱 2: defer 与闭包
    x := 10
    defer func() {
        fmt.Println("闭包中的 x:", x) // x = 20（引用）
    }()
    x = 20
}
```

## 控制流

### if 语句

```go
package main

import (
    "fmt"
    "math"
)

func main() {
    // 基本 if
    x := 10
    if x > 5 {
        fmt.Println("x 大于 5")
    }

    // if-else
    if x%2 == 0 {
        fmt.Println("x 是偶数")
    } else {
        fmt.Println("x 是奇数")
    }

    // if-else if-else
    score := 85
    if score >= 90 {
        fmt.Println("优秀")
    } else if score >= 80 {
        fmt.Println("良好")
    } else if score >= 60 {
        fmt.Println("及格")
    } else {
        fmt.Println("不及格")
    }

    // if 简短语句
    if num := 9; num < 0 {
        fmt.Println("负数")
    } else if num < 10 {
        fmt.Println("一位数")
    } else {
        fmt.Println("多位数")
    }
    // num 只在 if 作用域内有效

    // 实际应用：错误处理
    if result, err := math.Sqrt(-1), error(nil); err != nil {
        fmt.Println("错误:", err)
    } else {
        fmt.Println("结果:", result)
    }
}
```

### switch 语句

```go
package main

import (
    "fmt"
    "runtime"
    "time"
)

func main() {
    // 基本 switch
    day := 3
    switch day {
    case 1:
        fmt.Println("星期一")
    case 2:
        fmt.Println("星期二")
    case 3:
        fmt.Println("星期三")
    case 4:
        fmt.Println("星期四")
    case 5:
        fmt.Println("星期五")
    case 6, 7:
        fmt.Println("周末")
    default:
        fmt.Println("无效的日期")
    }

    // 无表达式的 switch（相当于 if-else 链）
    score := 85
    switch {
    case score >= 90:
        fmt.Println("A")
    case score >= 80:
        fmt.Println("B")
    case score >= 70:
        fmt.Println("C")
    case score >= 60:
        fmt.Println("D")
    default:
        fmt.Println("F")
    }

    // switch 简短语句
    switch hour := time.Now().Hour(); {
    case hour < 12:
        fmt.Println("早上好")
    case hour < 18:
        fmt.Println("下午好")
    default:
        fmt.Println("晚上好")
    }

    // 类型 switch
    var i interface{} = "hello"
    switch v := i.(type) {
    case int:
        fmt.Printf("整数: %d\n", v)
    case string:
        fmt.Printf("字符串: %s\n", v)
    case bool:
        fmt.Printf("布尔值: %t\n", v)
    default:
        fmt.Printf("未知类型: %T\n", v)
    }

    // fallthrough 关键字
    switch runtime.GOOS {
    case "darwin":
        fmt.Println("macOS")
        fallthrough
    case "linux":
        fmt.Println("类 Unix 系统")
    case "windows":
        fmt.Println("Windows")
    }
}
```

### for 循环

Go 只有 `for` 一种循环结构：

```go
package main

import "fmt"

func main() {
    // 传统 for 循环
    for i := 0; i < 5; i++ {
        fmt.Println("计数:", i)
    }

    // while 风格的 for 循环
    sum := 1
    for sum < 100 {
        sum += sum
    }
    fmt.Println("sum:", sum)

    // 无限循环
    count := 0
    for {
        count++
        if count > 3 {
            break
        }
        fmt.Println("无限循环:", count)
    }

    // range 循环（遍历数组、切片）
    numbers := []int{10, 20, 30, 40, 50}
    for index, value := range numbers {
        fmt.Printf("索引 %d: %d\n", index, value)
    }

    // 只要索引
    for index := range numbers {
        fmt.Println("索引:", index)
    }

    // 只要值
    for _, value := range numbers {
        fmt.Println("值:", value)
    }

    // range 循环（遍历 map）
    ages := map[string]int{
        "Alice": 25,
        "Bob":   30,
        "Carol": 28,
    }
    for name, age := range ages {
        fmt.Printf("%s 的年龄是 %d\n", name, age)
    }

    // range 循环（遍历字符串）
    for index, char := range "Go语言" {
        fmt.Printf("索引 %d: %c\n", index, char)
    }

    // continue 和 break
    for i := 0; i < 10; i++ {
        if i%2 == 0 {
            continue // 跳过偶数
        }
        if i > 7 {
            break // 大于 7 时终止
        }
        fmt.Println("奇数:", i)
    }

    // 嵌套循环与标签
outer:
    for i := 0; i < 3; i++ {
        for j := 0; j < 3; j++ {
            if i == 1 && j == 1 {
                break outer // 跳出外层循环
            }
            fmt.Printf("(%d, %d) ", i, j)
        }
        fmt.Println()
    }
}
```

### goto 语句

虽然不推荐使用，但 Go 支持 `goto`：

```go
package main

import "fmt"

func main() {
    i := 0

Loop:
    if i < 5 {
        fmt.Println("i =", i)
        i++
        goto Loop
    }

    fmt.Println("循环结束")
}
```

## 综合示例

下面是一个综合运用以上知识的完整示例：

```go
package main

import (
    "fmt"
    "math"
)

// 计算器结构体
type Calculator struct {
    history []string
}

// 添加历史记录
func (c *Calculator) addHistory(operation string) {
    c.history = append(c.history, operation)
}

// 加法
func (c *Calculator) Add(a, b float64) float64 {
    result := a + b
    c.addHistory(fmt.Sprintf("%.2f + %.2f = %.2f", a, b, result))
    return result
}

// 减法
func (c *Calculator) Subtract(a, b float64) float64 {
    result := a - b
    c.addHistory(fmt.Sprintf("%.2f - %.2f = %.2f", a, b, result))
    return result
}

// 乘法
func (c *Calculator) Multiply(a, b float64) float64 {
    result := a * b
    c.addHistory(fmt.Sprintf("%.2f * %.2f = %.2f", a, b, result))
    return result
}

// 除法
func (c *Calculator) Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("除数不能为零")
    }
    result := a / b
    c.addHistory(fmt.Sprintf("%.2f / %.2f = %.2f", a, b, result))
    return result, nil
}

// 幂运算
func (c *Calculator) Power(base, exponent float64) float64 {
    result := math.Pow(base, exponent)
    c.addHistory(fmt.Sprintf("%.2f ^ %.2f = %.2f", base, exponent, result))
    return result
}

// 显示历史记录
func (c *Calculator) ShowHistory() {
    fmt.Println("\n计算历史:")
    for i, record := range c.history {
        fmt.Printf("%d. %s\n", i+1, record)
    }
}

// 清空历史记录
func (c *Calculator) ClearHistory() {
    c.history = nil
    fmt.Println("历史记录已清空")
}

func main() {
    // 创建计算器实例
    calc := &Calculator{}

    defer func() {
        fmt.Println("\n程序结束，感谢使用!")
    }()

    // 执行各种运算
    fmt.Println("=== Go 语言计算器 ===\n")

    // 加法
    sum := calc.Add(10, 5)
    fmt.Printf("加法结果: %.2f\n", sum)

    // 减法
    diff := calc.Subtract(20, 8)
    fmt.Printf("减法结果: %.2f\n", diff)

    // 乘法
    product := calc.Multiply(6, 7)
    fmt.Printf("乘法结果: %.2f\n", product)

    // 除法（正常情况）
    if quotient, err := calc.Divide(100, 4); err != nil {
        fmt.Println("错误:", err)
    } else {
        fmt.Printf("除法结果: %.2f\n", quotient)
    }

    // 除法（错误情况）
    if _, err := calc.Divide(10, 0); err != nil {
        fmt.Println("除法错误:", err)
    }

    // 幂运算
    power := calc.Power(2, 8)
    fmt.Printf("幂运算结果: %.2f\n", power)

    // 显示历史记录
    calc.ShowHistory()

    // 使用循环批量计算
    fmt.Println("\n批量计算平方:")
    for i := 1; i <= 5; i++ {
        result := calc.Power(float64(i), 2)
        fmt.Printf("%d 的平方 = %.2f\n", i, result)
    }

    // 最终历史记录
    calc.ShowHistory()
}
```

## 总结

本文介绍了 Go 语言的基础知识，包括：

1. **包与导入**：Go 代码的组织方式，包的可见性规则
2. **变量与常量**：多种声明方式，零值概念，常量和 iota 的使用
3. **基本数据类型**：数值类型、字符串、布尔类型及类型转换
4. **函数**：函数声明、多返回值、可变参数、闭包和方法
5. **defer**：延迟执行机制，执行顺序和实际应用
6. **控制流**：if、switch、for 循环及其各种用法

掌握这些基础知识是学习 Go 语言的关键第一步。通过实践和编写代码，你将能够更深入地理解这些概念，并为学习更高级的主题（如并发、接口、错误处理等）打下坚实的基础。

## 推荐学习资源

- [Go 官方文档](https://go.dev/doc/)
- [Go 语言之旅](https://tour.golang.org/zh-cn/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go by Example](https://gobyexample.com/)

继续探索 Go 语言的世界，享受编程的乐趣！
