---
title: Go 接口
description: 深入理解 Go 接口：隐式实现、空接口、类型断言与组合
track: go
section: types-interfaces
difficulty: intermediate
tags:
  - Go
  - 接口
  - 类型断言
  - 组合
status: imported
origin: old/src/content/docs/go/interfaces.zh.md
divergence: 0.256
issues: []
legacy:
  category: Go
  subcategory: 面向对象
  order: 3
  lastUpdated: 2026-01-07
---

接口（Interface）是 Go 语言中实现多态和抽象的核心机制。与传统面向对象语言不同，Go 采用了隐式实现的方式，使得代码更加灵活和解耦。

## 接口定义

接口是一组方法签名的集合。在 Go 中，接口定义了行为规范，而不关心具体实现。

### 基本语法

```go
type 接口名 interface {
    方法名1(参数列表) 返回值列表
    方法名2(参数列表) 返回值列表
    // ...
}
```

### 实际示例

```go
package main

import "fmt"

// 定义一个 Shape 接口
type Shape interface {
    Area() float64
    Perimeter() float64
}

// 矩形结构体
type Rectangle struct {
    Width  float64
    Height float64
}

// 矩形实现 Area 方法
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// 矩形实现 Perimeter 方法
func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

// 圆形结构体
type Circle struct {
    Radius float64
}

// 圆形实现 Area 方法
func (c Circle) Area() float64 {
    return 3.14159 * c.Radius * c.Radius
}

// 圆形实现 Perimeter 方法
func (c Circle) Perimeter() float64 {
    return 2 * 3.14159 * c.Radius
}

func main() {
    var s Shape

    s = Rectangle{Width: 10, Height: 5}
    fmt.Printf("矩形面积: %.2f, 周长: %.2f\n", s.Area(), s.Perimeter())

    s = Circle{Radius: 7}
    fmt.Printf("圆形面积: %.2f, 周长: %.2f\n", s.Area(), s.Perimeter())
}
```

**输出：**
```
矩形面积: 50.00, 周长: 30.00
圆形面积: 153.94, 周长: 43.98
```

## 隐式实现

Go 接口最大的特点是**隐式实现**（Duck Typing）。一个类型只要实现了接口中的所有方法，就自动实现了该接口，无需显式声明。

### 优势

1. **解耦**：类型和接口定义可以在不同的包中
2. **灵活**：可以为已有类型添加接口支持
3. **简洁**：减少了样板代码

### 示例

```go
package main

import "fmt"

// 定义接口
type Writer interface {
    Write(data string) error
}

// 文件写入器
type FileWriter struct {
    filename string
}

// 隐式实现 Writer 接口
func (f FileWriter) Write(data string) error {
    fmt.Printf("写入文件 %s: %s\n", f.filename, data)
    return nil
}

// 控制台写入器
type ConsoleWriter struct{}

// 隐式实现 Writer 接口
func (c ConsoleWriter) Write(data string) error {
    fmt.Println("控制台输出:", data)
    return nil
}

// 通用保存函数，接受任何实现了 Writer 接口的类型
func SaveData(w Writer, data string) {
    w.Write(data)
}

func main() {
    file := FileWriter{filename: "data.txt"}
    console := ConsoleWriter{}

    SaveData(file, "Hello, File!")
    SaveData(console, "Hello, Console!")
}
```

**输出：**
```
写入文件 data.txt: Hello, File!
控制台输出: Hello, Console!
```

## 空接口

空接口（`interface{}`）是不包含任何方法的接口，因此所有类型都实现了空接口。在 Go 1.18+ 中，推荐使用 `any` 作为 `interface{}` 的别名。

### 用途

- 存储任意类型的值
- 实现泛型功能（Go 1.18 之前）
- 反射操作的基础

### 示例

```go
package main

import "fmt"

// 可以接收任意类型的函数
func PrintAnything(v interface{}) {
    fmt.Printf("类型: %T, 值: %v\n", v, v)
}

// 使用 any（Go 1.18+）
func PrintAnythingNew(v any) {
    fmt.Printf("类型: %T, 值: %v\n", v, v)
}

func main() {
    PrintAnything(42)
    PrintAnything("Hello")
    PrintAnything(3.14)
    PrintAnything([]int{1, 2, 3})

    // 存储不同类型的切片
    var mixed []interface{}
    mixed = append(mixed, 1, "two", 3.0, true)

    for i, v := range mixed {
        fmt.Printf("mixed[%d] = %v (类型: %T)\n", i, v, v)
    }
}
```

**输出：**
```
类型: int, 值: 42
类型: string, 值: Hello
类型: float64, 值: 3.14
类型: []int, 值: [1 2 3]
mixed[0] = 1 (类型: int)
mixed[1] = two (类型: string)
mixed[2] = 3 (类型: float64)
mixed[3] = true (类型: bool)
```

## 类型断言

类型断言用于从接口值中提取具体类型的值。

### 语法

```go
// 不安全的断言（如果类型不匹配会 panic）
value := interfaceValue.(Type)

// 安全的断言（返回两个值）
value, ok := interfaceValue.(Type)
```

### 示例

```go
package main

import "fmt"

func main() {
    var i interface{} = "Hello, World!"

    // 安全的类型断言
    str, ok := i.(string)
    if ok {
        fmt.Printf("字符串: %s (长度: %d)\n", str, len(str))
    }

    // 尝试断言为 int（会失败）
    num, ok := i.(int)
    if ok {
        fmt.Printf("整数: %d\n", num)
    } else {
        fmt.Println("不是整数类型")
    }

    // 不安全的断言（会 panic）
    // num := i.(int) // panic: interface conversion: interface {} is string, not int
}
```

**输出：**
```
字符串: Hello, World! (长度: 13)
不是整数类型
```

### 实际应用场景

```go
package main

import "fmt"

type Animal interface {
    Speak() string
}

type Dog struct {
    Name string
}

func (d Dog) Speak() string {
    return "汪汪汪"
}

func (d Dog) Fetch() {
    fmt.Printf("%s 去捡球了！\n", d.Name)
}

type Cat struct {
    Name string
}

func (c Cat) Speak() string {
    return "喵喵喵"
}

func (c Cat) Climb() {
    fmt.Printf("%s 爬树了！\n", c.Name)
}

func PlayWithAnimal(a Animal) {
    fmt.Println(a.Speak())

    // 使用类型断言调用特定类型的方法
    if dog, ok := a.(Dog); ok {
        dog.Fetch()
    }

    if cat, ok := a.(Cat); ok {
        cat.Climb()
    }
}

func main() {
    dog := Dog{Name: "旺财"}
    cat := Cat{Name: "咪咪"}

    PlayWithAnimal(dog)
    fmt.Println()
    PlayWithAnimal(cat)
}
```

**输出：**
```
汪汪汪
旺财 去捡球了！

喵喵喵
咪咪 爬树了！
```

## 类型开关

类型开关（Type Switch）是一种特殊的 switch 语句，用于根据接口值的实际类型执行不同的逻辑。

### 语法

```go
switch v := interfaceValue.(type) {
case Type1:
    // v 的类型是 Type1
case Type2:
    // v 的类型是 Type2
default:
    // 其他类型
}
```

### 示例

```go
package main

import "fmt"

func ProcessValue(v interface{}) {
    switch val := v.(type) {
    case int:
        fmt.Printf("整数: %d, 平方: %d\n", val, val*val)
    case string:
        fmt.Printf("字符串: %s, 长度: %d\n", val, len(val))
    case bool:
        fmt.Printf("布尔值: %t\n", val)
    case []int:
        sum := 0
        for _, n := range val {
            sum += n
        }
        fmt.Printf("整数切片: %v, 总和: %d\n", val, sum)
    default:
        fmt.Printf("未知类型: %T\n", val)
    }
}

func main() {
    ProcessValue(42)
    ProcessValue("Go语言")
    ProcessValue(true)
    ProcessValue([]int{1, 2, 3, 4, 5})
    ProcessValue(3.14)
}
```

**输出：**
```
整数: 42, 平方: 1764
字符串: Go语言, 长度: 9
布尔值: true
整数切片: [1 2 3 4 5], 总和: 15
未知类型: float64
```

### 复杂示例：JSON 解析处理

```go
package main

import (
    "encoding/json"
    "fmt"
)

func PrintJSON(data interface{}) {
    switch v := data.(type) {
    case map[string]interface{}:
        fmt.Println("对象:")
        for key, value := range v {
            fmt.Printf("  %s: %v\n", key, value)
        }
    case []interface{}:
        fmt.Println("数组:")
        for i, item := range v {
            fmt.Printf("  [%d]: %v\n", i, item)
        }
    case string:
        fmt.Printf("字符串: %s\n", v)
    case float64:
        fmt.Printf("数字: %.2f\n", v)
    case bool:
        fmt.Printf("布尔值: %t\n", v)
    case nil:
        fmt.Println("空值")
    default:
        fmt.Printf("未知类型: %T\n", v)
    }
}

func main() {
    jsonStr := `{
        "name": "张三",
        "age": 30,
        "active": true,
        "tags": ["Go", "Python", "Java"]
    }`

    var data interface{}
    json.Unmarshal([]byte(jsonStr), &data)

    PrintJSON(data)
}
```

**输出：**
```
对象:
  name: 张三
  age: 30
  active: true
  tags: [Go Python Java]
```

## 接口组合

Go 支持接口组合（Interface Embedding），可以通过嵌入其他接口来创建新接口。

### 基本组合

```go
package main

import "fmt"

// 基础接口
type Reader interface {
    Read() string
}

type Writer interface {
    Write(data string)
}

type Closer interface {
    Close()
}

// 组合接口
type ReadWriter interface {
    Reader
    Writer
}

type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}

// 实现类型
type File struct {
    name string
    data string
}

func (f *File) Read() string {
    return f.data
}

func (f *File) Write(data string) {
    f.data = data
}

func (f *File) Close() {
    fmt.Printf("关闭文件: %s\n", f.name)
}

func main() {
    file := &File{name: "test.txt"}

    // File 实现了 ReadWriteCloser 接口
    var rwc ReadWriteCloser = file

    rwc.Write("Hello, Go!")
    fmt.Println("读取内容:", rwc.Read())
    rwc.Close()
}
```

**输出：**
```
读取内容: Hello, Go!
关闭文件: test.txt
```

### 标准库中的接口组合

Go 标准库广泛使用接口组合，例如 `io` 包：

```go
package main

import (
    "fmt"
    "io"
    "strings"
)

func main() {
    // strings.Reader 实现了 io.Reader 接口
    reader := strings.NewReader("Hello, World!")

    // 读取数据
    buf := make([]byte, 5)
    for {
        n, err := reader.Read(buf)
        if err == io.EOF {
            break
        }
        fmt.Printf("读取 %d 字节: %s\n", n, string(buf[:n]))
    }
}
```

**输出：**
```
读取 5 字节: Hello
读取 5 字节: , Wor
读取 3 字节: ld!
```

### 实际应用：构建灵活的中间件系统

```go
package main

import (
    "fmt"
    "time"
)

// 基础接口
type Handler interface {
    Handle(request string) string
}

type Logger interface {
    Log(message string)
}

type Validator interface {
    Validate(request string) bool
}

// 组合接口
type FullHandler interface {
    Handler
    Logger
    Validator
}

// 业务处理器
type BusinessHandler struct {
    name string
}

func (b *BusinessHandler) Handle(request string) string {
    return fmt.Sprintf("处理请求: %s", request)
}

func (b *BusinessHandler) Log(message string) {
    fmt.Printf("[%s] %s: %s\n", time.Now().Format("15:04:05"), b.name, message)
}

func (b *BusinessHandler) Validate(request string) bool {
    return len(request) > 0
}

// 使用组合接口的处理函数
func ProcessRequest(handler FullHandler, request string) {
    handler.Log(fmt.Sprintf("收到请求: %s", request))

    if !handler.Validate(request) {
        handler.Log("请求验证失败")
        return
    }

    result := handler.Handle(request)
    handler.Log(fmt.Sprintf("处理结果: %s", result))
}

func main() {
    handler := &BusinessHandler{name: "订单服务"}

    ProcessRequest(handler, "创建订单")
    fmt.Println()
    ProcessRequest(handler, "")
}
```

**输出：**
```
[当前时间] 订单服务: 收到请求: 创建订单
[当前时间] 订单服务: 处理结果: 处理请求: 创建订单

[当前时间] 订单服务: 收到请求:
[当前时间] 订单服务: 请求验证失败
```

## 接口的零值

接口的零值是 `nil`。一个 `nil` 接口既没有值也没有具体类型。

```go
package main

import "fmt"

type Printer interface {
    Print()
}

func main() {
    var p Printer

    // 接口为 nil
    if p == nil {
        fmt.Println("接口为 nil")
    }

    // 调用 nil 接口的方法会 panic
    // p.Print() // panic: runtime error: invalid memory address or nil pointer dereference
}
```

### 注意：接口值为 nil 的陷阱

```go
package main

import "fmt"

type Printer interface {
    Print()
}

type MyPrinter struct{}

func (m *MyPrinter) Print() {
    fmt.Println("打印中...")
}

func main() {
    var p *MyPrinter = nil
    var i Printer = p

    // i 不为 nil，因为它有具体类型（*MyPrinter）
    fmt.Printf("i == nil: %v\n", i == nil)           // false
    fmt.Printf("i 的类型: %T, 值: %v\n", i, i)        // *MyPrinter, <nil>

    // 但调用方法是安全的（如果方法处理了 nil 接收者）
    i.Print()
}
```

**输出：**
```
i == nil: false
i 的类型: *MyPrinter, 值: <nil>
打印中...
```

## 最佳实践

### 接口应该小而专注

遵循"接口隔离原则"，每个接口应该只包含相关的方法。

```go
// 好的设计
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// 避免的设计
type ReaderWriter interface {
    Read(p []byte) (n int, err error)
    Write(p []byte) (n int, err error)
    Close() error
    Seek(offset int64, whence int) (int64, error)
    // 太多方法...
}
```

### 接受接口，返回结构体

函数参数使用接口类型，返回值使用具体类型。

```go
// 推荐
func Process(r io.Reader) *Result {
    // 处理逻辑
    return &Result{}
}

// 避免
func Process(r *os.File) io.Reader {
    // ...
}
```

### 在使用方定义接口

接口应该在需要它的地方定义，而不是在实现方定义。

```go
// consumer.go (使用方)
package consumer

type DataStore interface {
    Save(data string) error
}

func ProcessData(store DataStore, data string) {
    store.Save(data)
}

// provider.go (实现方)
package provider

type Database struct{}

func (d *Database) Save(data string) error {
    // 实现保存逻辑
    return nil
}
```

## 总结

Go 接口是一个强大而灵活的特性：

- **隐式实现**：无需显式声明，降低耦合
- **空接口**：可以表示任意类型，是泛型和反射的基础
- **类型断言**：安全地从接口中提取具体类型
- **类型开关**：根据运行时类型执行不同逻辑
- **接口组合**：通过嵌入构建复杂接口

合理使用接口可以让代码更加模块化、可测试和易于维护。记住 Go 的设计哲学：**少即是多**，保持接口简洁，让代码自然而然地实现多态。
