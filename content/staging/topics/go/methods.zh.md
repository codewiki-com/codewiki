---
title: Go 方法详解
description: 深入理解 Go 方法：值接收者、指针接收者、方法集与嵌入方法
track: go
section: types-interfaces
difficulty: intermediate
tags:
  - Go
  - 方法
  - 接收者
  - 方法集
  - 嵌入
status: imported
origin: old/src/content/docs/go/methods.zh.md
divergence: 0.209
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 面向对象
  order: 4
  lastUpdated: 2026-01-07
---

方法（Method）是 Go 语言实现面向对象编程的核心机制。与传统面向对象语言不同，Go 没有类的概念，而是通过为类型定义方法来实现类似的功能。理解方法的工作原理，特别是值接收者和指针接收者的区别，是掌握 Go 语言的关键。

## 概念解释

### 什么是方法

方法是一种特殊的函数，它与特定类型关联。方法的定义语法在函数名之前添加一个接收者（receiver）参数，这个接收者指定了方法所属的类型。

```go
// 普通函数
func Add(a, b int) int {
    return a + b
}

// 方法：与 Rectangle 类型关联
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}
```

### 方法与函数的区别

| 特性 | 函数 | 方法 |
|------|------|------|
| 定义方式 | `func 函数名(参数) 返回值` | `func (接收者) 方法名(参数) 返回值` |
| 调用方式 | `函数名(参数)` | `实例.方法名(参数)` |
| 关联类型 | 无 | 有（通过接收者） |
| 命名空间 | 全局唯一 | 不同类型可以有同名方法 |

### 历史背景

Go 语言的方法设计借鉴了多种语言的思想，但采用了更简洁的方式。Go 的设计者（Rob Pike、Ken Thompson 等）认为传统的类继承体系过于复杂，因此选择了基于组合和接口的方式来实现面向对象编程。方法是这一设计理念的核心组成部分。

## 核心原理

### 方法的本质

在 Go 语言中，方法本质上是一个以接收者为第一个参数的函数。编译器会将方法调用转换为普通函数调用。

```go
type Point struct {
    X, Y float64
}

// 方法定义
func (p Point) Distance() float64 {
    return math.Sqrt(p.X*p.X + p.Y*p.Y)
}

// 上面的方法在内部等价于：
// func PointDistance(p Point) float64 {
//     return math.Sqrt(p.X*p.X + p.Y*p.Y)
// }

func main() {
    p := Point{3, 4}

    // 方法调用
    d1 := p.Distance()

    // 等价的函数式调用（方法表达式）
    d2 := Point.Distance(p)

    fmt.Println(d1, d2) // 5 5
}
```

### 接收者类型

Go 支持两种接收者类型：

1. **值接收者**：方法操作的是接收者的副本
2. **指针接收者**：方法操作的是接收者本身

```go
type Counter struct {
    count int
}

// 值接收者：无法修改原始值
func (c Counter) ValueIncrement() {
    c.count++ // 修改的是副本
}

// 指针接收者：可以修改原始值
func (c *Counter) PointerIncrement() {
    c.count++ // 修改的是原始值
}
```

### 方法集规则

方法集（Method Set）决定了一个类型可以调用哪些方法，这对接口实现至关重要：

| 类型 | 方法集 |
|------|--------|
| `T`（值类型） | 所有值接收者方法 |
| `*T`（指针类型） | 所有值接收者方法 + 所有指针接收者方法 |

```go
type Animal interface {
    Speak() string
    Move()
}

type Dog struct {
    Name string
}

func (d Dog) Speak() string {  // 值接收者
    return "汪汪"
}

func (d *Dog) Move() {  // 指针接收者
    fmt.Printf("%s 在跑\n", d.Name)
}

func main() {
    dog := Dog{Name: "旺财"}

    // Dog 类型只有 Speak 方法在方法集中
    // var a Animal = dog  // 编译错误：Dog 没有实现 Animal

    // *Dog 类型同时有 Speak 和 Move 方法
    var a Animal = &dog  // 正确
    fmt.Println(a.Speak())
    a.Move()
}
```

## 核心要点

### 值接收者

值接收者方法接收调用者的副本，不会影响原始值。

**特点：**
- 方法内部修改不影响原始结构体
- 适合只读操作
- 可以被值类型和指针类型调用

```go
package main

import "fmt"

type Rectangle struct {
    Width  float64
    Height float64
}

// 值接收者方法
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

// 尝试修改（不会生效）
func (r Rectangle) Scale(factor float64) {
    r.Width *= factor   // 修改的是副本
    r.Height *= factor  // 修改的是副本
}

func main() {
    rect := Rectangle{Width: 10, Height: 5}

    fmt.Println("面积:", rect.Area())       // 面积: 50
    fmt.Println("周长:", rect.Perimeter()) // 周长: 30

    rect.Scale(2)
    fmt.Println("缩放后面积:", rect.Area()) // 面积: 50（未改变）

    // 指针也可以调用值接收者方法
    ptr := &rect
    fmt.Println("通过指针调用:", ptr.Area()) // 面积: 50
}
```

### 指针接收者

指针接收者方法接收调用者的地址，可以修改原始值。

**特点：**
- 可以修改原始结构体
- 避免大结构体的复制开销
- 可以被指针类型调用，值类型会自动取地址

```go
package main

import "fmt"

type Account struct {
    Balance float64
    Owner   string
}

// 指针接收者方法：可以修改状态
func (a *Account) Deposit(amount float64) error {
    if amount <= 0 {
        return fmt.Errorf("存款金额必须大于0")
    }
    a.Balance += amount
    return nil
}

func (a *Account) Withdraw(amount float64) error {
    if amount <= 0 {
        return fmt.Errorf("取款金额必须大于0")
    }
    if a.Balance < amount {
        return fmt.Errorf("余额不足")
    }
    a.Balance -= amount
    return nil
}

// 值接收者方法：只读操作
func (a Account) GetBalance() float64 {
    return a.Balance
}

func main() {
    account := Account{Balance: 1000, Owner: "张三"}

    account.Deposit(500)
    fmt.Printf("存款后余额: %.2f\n", account.GetBalance()) // 1500.00

    account.Withdraw(200)
    fmt.Printf("取款后余额: %.2f\n", account.GetBalance()) // 1300.00

    // 即使是值类型，Go 也会自动取地址来调用指针接收者方法
    // account.Deposit(100) 等价于 (&account).Deposit(100)
}
```

### 方法集与接口

方法集决定了类型是否实现了某个接口：

```go
package main

import "fmt"

// 定义接口
type Resizable interface {
    Resize(factor float64)
}

type Measurable interface {
    Area() float64
}

type Shape interface {
    Resizable
    Measurable
}

type Square struct {
    Side float64
}

// 值接收者
func (s Square) Area() float64 {
    return s.Side * s.Side
}

// 指针接收者
func (s *Square) Resize(factor float64) {
    s.Side *= factor
}

func main() {
    s := Square{Side: 10}

    // Square 只实现了 Measurable（只有值接收者方法）
    var m Measurable = s
    fmt.Println("面积:", m.Area())

    // *Square 实现了 Shape（有所有方法）
    var shape Shape = &s
    fmt.Println("面积:", shape.Area())
    shape.Resize(2)
    fmt.Println("缩放后面积:", shape.Area())

    // 编译错误示例：
    // var shape2 Shape = s  // Square 没有实现 Shape
}
```

### 嵌入方法

通过结构体嵌入，被嵌入类型的方法会被"提升"到外层类型：

```go
package main

import "fmt"

// 基础类型
type Logger struct {
    Prefix string
}

func (l *Logger) Log(message string) {
    fmt.Printf("[%s] %s\n", l.Prefix, message)
}

func (l *Logger) Error(message string) {
    fmt.Printf("[%s] ERROR: %s\n", l.Prefix, message)
}

// 嵌入 Logger
type Service struct {
    *Logger  // 嵌入指针
    Name string
}

func (s *Service) Start() {
    s.Log(fmt.Sprintf("%s 服务启动", s.Name))
}

func (s *Service) Stop() {
    s.Log(fmt.Sprintf("%s 服务停止", s.Name))
}

func main() {
    service := &Service{
        Logger: &Logger{Prefix: "INFO"},
        Name:   "UserService",
    }

    // 直接调用嵌入类型的方法
    service.Log("初始化完成")
    service.Error("发生错误")

    // 调用外层类型的方法
    service.Start()
    service.Stop()

    // 也可以显式访问
    service.Logger.Log("显式调用")
}
```

**输出：**
```
[INFO] 初始化完成
[INFO] ERROR: 发生错误
[INFO] UserService 服务启动
[INFO] UserService 服务停止
[INFO] 显式调用
```

## 代码示例

### 完整示例：图形计算器

```go
package main

import (
    "fmt"
    "math"
)

// 定义接口
type Shape interface {
    Area() float64
    Perimeter() float64
    String() string
}

// 圆形
type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
    return 2 * math.Pi * c.Radius
}

func (c Circle) String() string {
    return fmt.Sprintf("圆形(半径=%.2f)", c.Radius)
}

func (c *Circle) Scale(factor float64) {
    c.Radius *= factor
}

// 矩形
type Rectangle struct {
    Width, Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

func (r Rectangle) String() string {
    return fmt.Sprintf("矩形(%.2f x %.2f)", r.Width, r.Height)
}

func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}

// 三角形
type Triangle struct {
    A, B, C float64 // 三边长度
}

func (t Triangle) Area() float64 {
    // 海伦公式
    s := (t.A + t.B + t.C) / 2
    return math.Sqrt(s * (s - t.A) * (s - t.B) * (s - t.C))
}

func (t Triangle) Perimeter() float64 {
    return t.A + t.B + t.C
}

func (t Triangle) String() string {
    return fmt.Sprintf("三角形(边长=%.2f, %.2f, %.2f)", t.A, t.B, t.C)
}

func (t *Triangle) Scale(factor float64) {
    t.A *= factor
    t.B *= factor
    t.C *= factor
}

// 打印形状信息
func PrintShapeInfo(s Shape) {
    fmt.Printf("%s\n", s.String())
    fmt.Printf("  面积: %.2f\n", s.Area())
    fmt.Printf("  周长: %.2f\n", s.Perimeter())
}

// 计算总面积
func TotalArea(shapes []Shape) float64 {
    total := 0.0
    for _, s := range shapes {
        total += s.Area()
    }
    return total
}

func main() {
    shapes := []Shape{
        Circle{Radius: 5},
        Rectangle{Width: 10, Height: 5},
        Triangle{A: 3, B: 4, C: 5},
    }

    fmt.Println("=== 图形信息 ===")
    for _, shape := range shapes {
        PrintShapeInfo(shape)
        fmt.Println()
    }

    fmt.Printf("总面积: %.2f\n", TotalArea(shapes))

    // 演示缩放
    fmt.Println("\n=== 缩放演示 ===")
    circle := &Circle{Radius: 5}
    fmt.Printf("缩放前: %s, 面积: %.2f\n", circle.String(), circle.Area())
    circle.Scale(2)
    fmt.Printf("缩放后: %s, 面积: %.2f\n", circle.String(), circle.Area())
}
```

**输出：**
```
=== 图形信息 ===
圆形(半径=5.00)
  面积: 78.54
  周长: 31.42

矩形(10.00 x 5.00)
  面积: 50.00
  周长: 30.00

三角形(边长=3.00, 4.00, 5.00)
  面积: 6.00
  周长: 12.00

总面积: 134.54

=== 缩放演示 ===
缩放前: 圆形(半径=5.00), 面积: 78.54
缩放后: 圆形(半径=10.00), 面积: 314.16
```

### 示例：链式方法调用

```go
package main

import (
    "fmt"
    "strings"
)

type StringBuilder struct {
    data []string
}

func NewStringBuilder() *StringBuilder {
    return &StringBuilder{
        data: make([]string, 0),
    }
}

// 返回指针以支持链式调用
func (sb *StringBuilder) Append(s string) *StringBuilder {
    sb.data = append(sb.data, s)
    return sb
}

func (sb *StringBuilder) AppendLine(s string) *StringBuilder {
    sb.data = append(sb.data, s+"\n")
    return sb
}

func (sb *StringBuilder) Clear() *StringBuilder {
    sb.data = sb.data[:0]
    return sb
}

func (sb *StringBuilder) String() string {
    return strings.Join(sb.data, "")
}

func (sb *StringBuilder) Length() int {
    return len(sb.String())
}

func main() {
    builder := NewStringBuilder()

    // 链式调用
    result := builder.
        Append("Hello, ").
        Append("World!").
        AppendLine("").
        Append("Go 语言").
        AppendLine(" 方法链").
        String()

    fmt.Println(result)
    fmt.Printf("总长度: %d\n", builder.Length())
}
```

**输出：**
```
Hello, World!
Go 语言 方法链

总长度: 27
```

### 示例：方法表达式与方法值

```go
package main

import "fmt"

type Calculator struct {
    Value float64
}

func (c Calculator) Add(n float64) float64 {
    return c.Value + n
}

func (c Calculator) Multiply(n float64) float64 {
    return c.Value * n
}

func (c *Calculator) Set(n float64) {
    c.Value = n
}

func main() {
    calc := Calculator{Value: 10}

    // 1. 普通方法调用
    fmt.Println("普通调用:", calc.Add(5))  // 15

    // 2. 方法表达式（Method Expression）
    // 将方法转换为函数，第一个参数是接收者
    addFunc := Calculator.Add
    fmt.Println("方法表达式:", addFunc(calc, 5))  // 15

    // 指针接收者的方法表达式
    setFunc := (*Calculator).Set
    setFunc(&calc, 20)
    fmt.Println("设置后:", calc.Value)  // 20

    // 3. 方法值（Method Value）
    // 绑定到特定接收者的方法
    addMethod := calc.Add
    multiplyMethod := calc.Multiply

    fmt.Println("方法值 Add:", addMethod(5))       // 25
    fmt.Println("方法值 Multiply:", multiplyMethod(3))  // 60

    // 方法值可以作为回调函数使用
    operations := []func(float64) float64{addMethod, multiplyMethod}
    for i, op := range operations {
        fmt.Printf("操作%d结果: %.2f\n", i+1, op(2))
    }
}
```

**输出：**
```
普通调用: 15
方法表达式: 15
设置后: 20
方法值 Add: 25
方法值 Multiply: 60
操作1结果: 22.00
操作2结果: 40.00
```

## 最佳实践

### 选择正确的接收者类型

```go
// 使用指针接收者的情况：

// 1. 需要修改接收者
func (u *User) UpdateName(name string) {
    u.Name = name
}

// 2. 接收者是大型结构体
type LargeStruct struct {
    Data [1000]int
}

func (ls *LargeStruct) Process() {
    // 避免复制 1000 个 int
}

// 3. 一致性：如果类型的其他方法使用指针接收者
func (u *User) Save() error { ... }
func (u *User) Delete() error { ... }
func (u *User) Validate() error { ... }  // 保持一致

// 4. 接收者包含 sync.Mutex 或类似字段
type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}
```

```go
// 使用值接收者的情况：

// 1. 不需要修改接收者
func (p Point) Distance(other Point) float64 {
    dx := p.X - other.X
    dy := p.Y - other.Y
    return math.Sqrt(dx*dx + dy*dy)
}

// 2. 接收者是小型结构体
type Point struct {
    X, Y float64
}

func (p Point) String() string {
    return fmt.Sprintf("(%v, %v)", p.X, p.Y)
}

// 3. 接收者是基本类型、切片或 map（本身就是引用类型）
type MySlice []int

func (s MySlice) Sum() int {
    sum := 0
    for _, v := range s {
        sum += v
    }
    return sum
}
```

### 保持方法集的一致性

```go
// 好的做法：所有方法使用相同的接收者类型
type User struct {
    ID   int
    Name string
}

func (u *User) Save() error { ... }
func (u *User) Update() error { ... }
func (u *User) Delete() error { ... }
func (u *User) Validate() error { ... }

// 避免：混合使用接收者类型（除非有明确理由）
func (u *User) Save() error { ... }
func (u User) GetName() string { ... }  // 不一致
```

### 为方法编写文档

```go
// User 表示系统中的用户。
type User struct {
    ID        int
    Name      string
    Email     string
    CreatedAt time.Time
}

// Validate 验证用户数据的有效性。
// 检查内容包括：
//   - 名称不能为空且长度在 2-50 之间
//   - 邮箱格式必须正确
//
// 返回错误如果验证失败，否则返回 nil。
func (u *User) Validate() error {
    if u.Name == "" {
        return errors.New("名称不能为空")
    }
    if len(u.Name) < 2 || len(u.Name) > 50 {
        return errors.New("名称长度必须在 2-50 之间")
    }
    if !isValidEmail(u.Email) {
        return errors.New("邮箱格式不正确")
    }
    return nil
}
```

### 避免在方法中修改不相关的状态

```go
// 好的做法：方法只修改与自身相关的状态
func (o *Order) Cancel() error {
    if o.Status == "shipped" {
        return errors.New("已发货的订单不能取消")
    }
    o.Status = "cancelled"
    o.CancelledAt = time.Now()
    return nil
}

// 避免：方法修改了不相关的全局状态
var globalCounter int

func (o *Order) Cancel() error {
    globalCounter++  // 不好的做法
    o.Status = "cancelled"
    return nil
}
```

### 使用嵌入实现代码复用

```go
// 基础功能
type Timestamps struct {
    CreatedAt time.Time
    UpdatedAt time.Time
}

func (t *Timestamps) Touch() {
    t.UpdatedAt = time.Now()
}

func (t *Timestamps) SetCreated() {
    t.CreatedAt = time.Now()
    t.UpdatedAt = t.CreatedAt
}

// 复用时间戳功能
type User struct {
    Timestamps
    ID   int
    Name string
}

type Article struct {
    Timestamps
    ID      int
    Title   string
    Content string
}

func main() {
    user := &User{ID: 1, Name: "张三"}
    user.SetCreated()

    article := &Article{ID: 1, Title: "Go 方法"}
    article.SetCreated()

    // 更新时
    article.Touch()
}
```

## 常见陷阱

### nil 接收者

方法可以在 nil 接收者上调用（如果是指针接收者）：

```go
package main

import "fmt"

type List struct {
    Value int
    Next  *List
}

// 可以安全处理 nil
func (l *List) Length() int {
    if l == nil {
        return 0
    }
    return 1 + l.Next.Length()
}

// 不安全：会在 nil 上 panic
func (l *List) UnsafeGet() int {
    return l.Value  // 如果 l 是 nil，这里会 panic
}

func main() {
    var list *List
    fmt.Println("空链表长度:", list.Length())  // 0

    list = &List{Value: 1, Next: &List{Value: 2, Next: nil}}
    fmt.Println("链表长度:", list.Length())  // 2

    // 下面会 panic
    // var nilList *List
    // fmt.Println(nilList.UnsafeGet())
}
```

### 值接收者的修改不生效

```go
package main

import "fmt"

type Point struct {
    X, Y int
}

// 错误：值接收者无法修改原始值
func (p Point) MoveWrong(dx, dy int) {
    p.X += dx
    p.Y += dy
    // p 是副本，修改不会影响原始值
}

// 正确：使用指针接收者
func (p *Point) MoveRight(dx, dy int) {
    p.X += dx
    p.Y += dy
}

func main() {
    p := Point{X: 0, Y: 0}

    p.MoveWrong(10, 20)
    fmt.Printf("MoveWrong 后: %+v\n", p)  // {X:0 Y:0}

    p.MoveRight(10, 20)
    fmt.Printf("MoveRight 后: %+v\n", p)  // {X:10 Y:20}
}
```

### 接口实现的方法集问题

```go
package main

import "fmt"

type Modifier interface {
    Modify()
}

type Data struct {
    Value int
}

func (d *Data) Modify() {
    d.Value++
}

func main() {
    d := Data{Value: 1}

    // 错误：Data 没有实现 Modifier（只有 *Data 实现了）
    // var m Modifier = d  // 编译错误

    // 正确：使用指针
    var m Modifier = &d
    m.Modify()
    fmt.Println(d.Value)  // 2

    // 注意：虽然可以在值上调用指针接收者方法
    d.Modify()  // Go 自动转换为 (&d).Modify()
    // 但这不意味着 Data 实现了 Modifier 接口
}
```

### 嵌入字段的方法遮蔽

```go
package main

import "fmt"

type Base struct {
    Name string
}

func (b Base) Describe() string {
    return "Base: " + b.Name
}

type Derived struct {
    Base
    Name string  // 与嵌入类型有同名字段
}

// 同名方法会遮蔽嵌入类型的方法
func (d Derived) Describe() string {
    return "Derived: " + d.Name
}

func main() {
    d := Derived{
        Base: Base{Name: "base-name"},
        Name: "derived-name",
    }

    fmt.Println(d.Describe())       // Derived: derived-name
    fmt.Println(d.Base.Describe())  // Base: base-name

    fmt.Println(d.Name)       // derived-name
    fmt.Println(d.Base.Name)  // base-name
}
```

### 在循环中使用方法值

```go
package main

import "fmt"

type Handler struct {
    ID int
}

func (h *Handler) Handle() {
    fmt.Printf("Handler %d\n", h.ID)
}

func main() {
    handlers := []Handler{{ID: 1}, {ID: 2}, {ID: 3}}

    // 错误：所有函数都引用同一个变量
    var funcs []func()
    for _, h := range handlers {
        funcs = append(funcs, h.Handle)
        // h.Handle 捕获的是 h 的地址，但 h 在每次迭代中是同一个变量
    }

    // 全部输出 Handler 3
    for _, f := range funcs {
        f()
    }

    fmt.Println("---")

    // 正确：创建局部变量
    var funcs2 []func()
    for _, h := range handlers {
        h := h  // 创建新变量
        funcs2 = append(funcs2, h.Handle)
    }

    // 正确输出 1, 2, 3
    for _, f := range funcs2 {
        f()
    }
}
```

## 性能考量

### 值接收者 vs 指针接收者的性能

```go
package main

import (
    "testing"
)

type SmallStruct struct {
    X, Y int
}

type LargeStruct struct {
    Data [1000]int
}

func (s SmallStruct) ValueMethod() int {
    return s.X + s.Y
}

func (s *SmallStruct) PointerMethod() int {
    return s.X + s.Y
}

func (l LargeStruct) ValueMethod() int {
    return l.Data[0]
}

func (l *LargeStruct) PointerMethod() int {
    return l.Data[0]
}

// 基准测试
func BenchmarkSmallStructValue(b *testing.B) {
    s := SmallStruct{X: 1, Y: 2}
    for i := 0; i < b.N; i++ {
        _ = s.ValueMethod()
    }
}

func BenchmarkSmallStructPointer(b *testing.B) {
    s := SmallStruct{X: 1, Y: 2}
    for i := 0; i < b.N; i++ {
        _ = s.PointerMethod()
    }
}

func BenchmarkLargeStructValue(b *testing.B) {
    l := LargeStruct{}
    for i := 0; i < b.N; i++ {
        _ = l.ValueMethod()
    }
}

func BenchmarkLargeStructPointer(b *testing.B) {
    l := LargeStruct{}
    for i := 0; i < b.N; i++ {
        _ = l.PointerMethod()
    }
}
```

**性能建议：**

1. **小型结构体（< 64 字节）**：值接收者和指针接收者性能差异不大
2. **大型结构体**：使用指针接收者避免复制开销
3. **频繁调用的方法**：考虑使用指针接收者
4. **需要修改状态**：必须使用指针接收者

### 避免不必要的内存分配

```go
// 避免：每次调用都创建新字符串
func (u User) GetFullNameBad() string {
    return fmt.Sprintf("%s %s", u.FirstName, u.LastName)
}

// 优化：使用 strings.Builder
func (u User) GetFullName() string {
    var b strings.Builder
    b.WriteString(u.FirstName)
    b.WriteByte(' ')
    b.WriteString(u.LastName)
    return b.String()
}

// 更好：预分配容量
func (u User) GetFullNameOptimized() string {
    var b strings.Builder
    b.Grow(len(u.FirstName) + 1 + len(u.LastName))
    b.WriteString(u.FirstName)
    b.WriteByte(' ')
    b.WriteString(u.LastName)
    return b.String()
}
```

## 实战场景

### 场景1：数据库模型

```go
package main

import (
    "database/sql"
    "errors"
    "time"
)

type Model struct {
    ID        int64
    CreatedAt time.Time
    UpdatedAt time.Time
}

func (m *Model) BeforeCreate() {
    now := time.Now()
    m.CreatedAt = now
    m.UpdatedAt = now
}

func (m *Model) BeforeUpdate() {
    m.UpdatedAt = time.Now()
}

type User struct {
    Model
    Name     string
    Email    string
    Password string
    Active   bool
}

func (u *User) Validate() error {
    if u.Name == "" {
        return errors.New("名称不能为空")
    }
    if u.Email == "" {
        return errors.New("邮箱不能为空")
    }
    if len(u.Password) < 8 {
        return errors.New("密码长度不能少于8位")
    }
    return nil
}

func (u *User) Save(db *sql.DB) error {
    if err := u.Validate(); err != nil {
        return err
    }

    if u.ID == 0 {
        u.BeforeCreate()
        // INSERT 操作
        result, err := db.Exec(
            "INSERT INTO users (name, email, password, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            u.Name, u.Email, u.Password, u.Active, u.CreatedAt, u.UpdatedAt,
        )
        if err != nil {
            return err
        }
        u.ID, _ = result.LastInsertId()
    } else {
        u.BeforeUpdate()
        // UPDATE 操作
        _, err := db.Exec(
            "UPDATE users SET name=?, email=?, password=?, active=?, updated_at=? WHERE id=?",
            u.Name, u.Email, u.Password, u.Active, u.UpdatedAt, u.ID,
        )
        if err != nil {
            return err
        }
    }
    return nil
}

func (u *User) Delete(db *sql.DB) error {
    if u.ID == 0 {
        return errors.New("无法删除未保存的用户")
    }
    _, err := db.Exec("DELETE FROM users WHERE id=?", u.ID)
    return err
}
```

### 场景2：HTTP 处理器

```go
package main

import (
    "encoding/json"
    "net/http"
)

type APIHandler struct {
    userService *UserService
    logger      *Logger
}

func NewAPIHandler(us *UserService, l *Logger) *APIHandler {
    return &APIHandler{
        userService: us,
        logger:      l,
    }
}

func (h *APIHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := r.URL.Query().Get("id")
    if id == "" {
        h.respondError(w, http.StatusBadRequest, "缺少用户ID")
        return
    }

    user, err := h.userService.GetByID(id)
    if err != nil {
        h.logger.Error("获取用户失败: " + err.Error())
        h.respondError(w, http.StatusInternalServerError, "服务器错误")
        return
    }

    if user == nil {
        h.respondError(w, http.StatusNotFound, "用户不存在")
        return
    }

    h.respondJSON(w, http.StatusOK, user)
}

func (h *APIHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        h.respondError(w, http.StatusBadRequest, "无效的请求数据")
        return
    }

    if err := h.userService.Create(&user); err != nil {
        h.logger.Error("创建用户失败: " + err.Error())
        h.respondError(w, http.StatusInternalServerError, "创建失败")
        return
    }

    h.logger.Info("创建用户成功: " + user.Name)
    h.respondJSON(w, http.StatusCreated, user)
}

func (h *APIHandler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func (h *APIHandler) respondError(w http.ResponseWriter, status int, message string) {
    h.respondJSON(w, status, map[string]string{"error": message})
}

// 注册路由
func (h *APIHandler) RegisterRoutes(mux *http.ServeMux) {
    mux.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        case http.MethodGet:
            h.GetUser(w, r)
        case http.MethodPost:
            h.CreateUser(w, r)
        default:
            h.respondError(w, http.StatusMethodNotAllowed, "方法不允许")
        }
    })
}
```

### 场景3：状态机

```go
package main

import (
    "errors"
    "fmt"
)

type OrderStatus string

const (
    StatusPending   OrderStatus = "pending"
    StatusPaid      OrderStatus = "paid"
    StatusShipped   OrderStatus = "shipped"
    StatusDelivered OrderStatus = "delivered"
    StatusCancelled OrderStatus = "cancelled"
)

type Order struct {
    ID     string
    Status OrderStatus
    Items  []string
    Total  float64
}

func NewOrder(id string, items []string, total float64) *Order {
    return &Order{
        ID:     id,
        Status: StatusPending,
        Items:  items,
        Total:  total,
    }
}

func (o *Order) Pay() error {
    if o.Status != StatusPending {
        return errors.New("只有待付款的订单才能支付")
    }
    o.Status = StatusPaid
    return nil
}

func (o *Order) Ship() error {
    if o.Status != StatusPaid {
        return errors.New("只有已付款的订单才能发货")
    }
    o.Status = StatusShipped
    return nil
}

func (o *Order) Deliver() error {
    if o.Status != StatusShipped {
        return errors.New("只有已发货的订单才能确认收货")
    }
    o.Status = StatusDelivered
    return nil
}

func (o *Order) Cancel() error {
    if o.Status == StatusShipped || o.Status == StatusDelivered {
        return errors.New("已发货或已收货的订单不能取消")
    }
    if o.Status == StatusCancelled {
        return errors.New("订单已取消")
    }
    o.Status = StatusCancelled
    return nil
}

func (o *Order) CanCancel() bool {
    return o.Status == StatusPending || o.Status == StatusPaid
}

func (o *Order) String() string {
    return fmt.Sprintf("订单[%s] 状态: %s, 金额: ¥%.2f", o.ID, o.Status, o.Total)
}

func main() {
    order := NewOrder("ORD001", []string{"商品A", "商品B"}, 299.99)
    fmt.Println(order)

    // 正常流程
    order.Pay()
    fmt.Println(order)

    order.Ship()
    fmt.Println(order)

    // 尝试取消已发货订单
    if err := order.Cancel(); err != nil {
        fmt.Println("取消失败:", err)
    }

    order.Deliver()
    fmt.Println(order)
}
```

## 面试要点

### 值接收者和指针接收者的区别是什么？

**答案要点：**
- 值接收者操作的是副本，指针接收者操作的是原值
- 值接收者方法可以被值和指针调用，指针接收者方法也可以被值和指针调用（Go 自动转换）
- 但在接口实现上，`T` 类型只有值接收者方法在其方法集中，`*T` 类型同时有值接收者和指针接收者方法

```go
type T struct{ value int }

func (t T) ValueMethod() {}   // T 和 *T 都能调用
func (t *T) PointerMethod() {} // T 和 *T 都能调用

// 但 T 只实现有 ValueMethod 的接口
// *T 实现有 ValueMethod 和 PointerMethod 的接口
```

### 什么时候应该使用指针接收者？

**答案要点：**
1. 需要修改接收者的状态
2. 接收者是大型结构体，避免复制开销
3. 保持一致性，如果类型的其他方法使用指针接收者
4. 接收者包含 `sync.Mutex` 等不可复制的字段

### 方法集的规则是什么？

**答案要点：**
- `T` 的方法集只包含值接收者方法
- `*T` 的方法集包含值接收者方法和指针接收者方法
- 这个规则主要影响接口实现的判断

### nil 指针可以调用方法吗？

**答案要点：**
- 可以，如果是指针接收者方法
- 方法内部需要检查接收者是否为 nil
- 这是一种常见的模式，可以让代码更简洁

```go
func (l *List) Length() int {
    if l == nil {
        return 0
    }
    return 1 + l.Next.Length()
}
```

### 嵌入字段的方法是如何提升的？

**答案要点：**
- 嵌入字段的方法会被提升到外层类型
- 如果外层类型有同名方法，会遮蔽嵌入字段的方法
- 仍可以通过嵌入字段名显式调用

```go
type Inner struct{}
func (i Inner) Method() string { return "Inner" }

type Outer struct{ Inner }
func (o Outer) Method() string { return "Outer" }

func main() {
    o := Outer{}
    fmt.Println(o.Method())       // Outer
    fmt.Println(o.Inner.Method()) // Inner
}
```

## 延伸阅读

### 官方文档
- [A Tour of Go - Methods](https://tour.golang.org/methods/1)
- [Effective Go - Methods](https://golang.org/doc/effective_go#methods)
- [Go 语言规范 - Method declarations](https://golang.org/ref/spec#Method_declarations)

### 经典文章
- [Go Data Structures: Interfaces](https://research.swtch.com/interfaces) - Russ Cox
- [Methods in Go](https://dave.cheney.net/2016/03/19/should-methods-be-declared-on-t-or-t) - Dave Cheney
- [Receiver Type - Pointer vs Value](https://github.com/golang/go/wiki/CodeReviewComments#receiver-type)

### 推荐书籍
- 《Go 程序设计语言》- Alan A. A. Donovan, Brian W. Kernighan
- 《Go 语言实战》- William Kennedy
- 《Go 语言高级编程》- 柴树杉、曹春晖

### 相关主题
- [Go 接口](/go/interfaces) - 方法集与接口实现
- [Go 结构体](/go/structs) - 结构体与方法的关系
- [Go 组合与嵌入](/go/composition) - 通过嵌入实现代码复用
