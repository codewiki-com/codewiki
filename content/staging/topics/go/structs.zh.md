---
title: Go Structs Explained
description: Deep dive into Go structs including definition, methods, embedding, tags and best practices
track: go
section: basics
difficulty: beginner
tags:
  - Go
  - structs
  - methods
  - composition
status: imported
origin: old/src/content/docs/go/structs.zh.md
divergence: 0.234
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Go
  subcategory: Core Concepts
  order: 15
  lastUpdated: 2026-01-07
---

结构体是 Go 语言中最基础且最强大的特性之一。它们允许你创建自定义数据类型，将相关的数据组合在一个名称下。与面向对象语言中的类不同，Go 结构体简单、轻量，并且能够优雅地组合在一起。本文将提供一份全面的指南，帮助你理解并有效地使用 Go 中的结构体。

## 什么是结构体？

结构体（structure 的缩写）是一种复合数据类型，它将零个或多个不同类型的值组合在一个类型名称下。结构体中的每个值称为字段。结构体类似于其他编程语言中的记录或对象。

### 基本结构体定义

```go
package main

import "fmt"

// 定义一个结构体类型
type Person struct {
    FirstName string
    LastName  string
    Age       int
    Email     string
}

func main() {
    // 创建 Person 的实例
    p := Person{
        FirstName: "John",
        LastName:  "Doe",
        Age:       30,
        Email:     "john.doe@example.com",
    }

    fmt.Println(p)
    // 输出: {John Doe 30 john.doe@example.com}
}
```

### 结构体字段命名规范

Go 对结构体字段命名有特定的规范：

- 以大写字母开头的字段是导出的（公开的）
- 以小写字母开头的字段是未导出的（包内私有的）

```go
type User struct {
    ID        int    // 导出的 - 可以从其他包访问
    Username  string // 导出的
    password  string // 未导出的 - 只能在同一个包内访问
    createdAt time.Time // 未导出的
}
```

## 创建和初始化结构体

Go 提供了多种创建和初始化结构体实例的方式。

### 命名字段初始化

最明确且推荐的创建结构体方式：

```go
package main

import "fmt"

type Point struct {
    X int
    Y int
}

func main() {
    // 命名字段初始化
    p1 := Point{X: 10, Y: 20}
    fmt.Println(p1) // 输出: {10 20}

    // 使用命名字段时顺序无关紧要
    p2 := Point{Y: 30, X: 40}
    fmt.Println(p2) // 输出: {40 30}

    // 可以省略字段（它们会获得零值）
    p3 := Point{X: 50}
    fmt.Println(p3) // 输出: {50 0}
}
```

### 位置初始化

你可以使用位置值来初始化结构体，但这种方式可读性较差且更容易出错：

```go
package main

import "fmt"

type Point struct {
    X int
    Y int
}

func main() {
    // 位置初始化（必须按顺序提供所有字段）
    p := Point{10, 20}
    fmt.Println(p) // 输出: {10 20}
}
```

### 零值初始化

当你声明一个结构体变量而不进行初始化时，所有字段都会被设置为它们的零值：

```go
package main

import "fmt"

type Config struct {
    Host    string
    Port    int
    Enabled bool
}

func main() {
    var config Config
    fmt.Printf("Host: '%s', Port: %d, Enabled: %t\n", config.Host, config.Port, config.Enabled)
    // 输出: Host: '', Port: 0, Enabled: false
}
```

### 使用 `new` 函数

`new` 函数为结构体分配内存并返回指向它的指针：

```go
package main

import "fmt"

type Rectangle struct {
    Width  float64
    Height float64
}

func main() {
    // new() 返回一个指向零值结构体的指针
    rect := new(Rectangle)
    fmt.Printf("Type: %T, Value: %+v\n", rect, rect)
    // 输出: Type: *main.Rectangle, Value: &{Width:0 Height:0}

    rect.Width = 10.5
    rect.Height = 5.5
    fmt.Printf("Rectangle: %+v\n", rect)
    // 输出: Rectangle: &{Width:10.5 Height:5.5}
}
```

### 使用取地址运算符 (&)

你可以使用取地址运算符创建指向结构体的指针：

```go
package main

import "fmt"

type Book struct {
    Title  string
    Author string
    Pages  int
}

func main() {
    // 创建指向结构体字面量的指针
    book := &Book{
        Title:  "The Go Programming Language",
        Author: "Alan A. A. Donovan",
        Pages:  380,
    }

    fmt.Printf("Type: %T\n", book)   // 输出: Type: *main.Book
    fmt.Println("Title:", book.Title) // 输出: Title: The Go Programming Language
}
```

## 访问结构体字段

你可以使用点号表示法访问结构体字段：

```go
package main

import "fmt"

type Employee struct {
    Name       string
    Department string
    Salary     float64
}

func main() {
    emp := Employee{
        Name:       "Alice",
        Department: "Engineering",
        Salary:     75000.00,
    }

    // 访问字段
    fmt.Println("Name:", emp.Name)
    fmt.Println("Department:", emp.Department)
    fmt.Println("Salary:", emp.Salary)

    // 修改字段
    emp.Salary = 80000.00
    fmt.Println("New Salary:", emp.Salary)
}
```

### 通过指针访问字段

Go 在访问结构体字段时会自动解引用指针：

```go
package main

import "fmt"

type Coordinates struct {
    Latitude  float64
    Longitude float64
}

func main() {
    coords := &Coordinates{
        Latitude:  40.7128,
        Longitude: -74.0060,
    }

    // 两种方式效果相同
    fmt.Println(coords.Latitude)    // 自动解引用
    fmt.Println((*coords).Latitude) // 显式解引用

    // 通过指针修改
    coords.Latitude = 41.8781
    fmt.Println("New Latitude:", coords.Latitude)
}
```

## 匿名结构体

匿名结构体是没有名称的结构体类型。它们对于一次性的数据结构很有用：

```go
package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    // 内联匿名结构体
    person := struct {
        Name string
        Age  int
    }{
        Name: "Bob",
        Age:  25,
    }

    fmt.Println(person) // 输出: {Bob 25}

    // 用于 JSON 解析
    jsonData := `{"name": "Charlie", "email": "charlie@example.com"}`

    var result struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }

    json.Unmarshal([]byte(jsonData), &result)
    fmt.Printf("Name: %s, Email: %s\n", result.Name, result.Email)
}
```

### 匿名结构体的使用场景

```go
package main

import "fmt"

func main() {
    // 测试数据
    tests := []struct {
        input    int
        expected int
    }{
        {1, 2},
        {2, 4},
        {3, 6},
    }

    for _, test := range tests {
        result := double(test.input)
        if result != test.expected {
            fmt.Printf("double(%d) = %d; expected %d\n",
                test.input, result, test.expected)
        }
    }

    // 带有嵌套匿名结构体的配置
    config := struct {
        Server struct {
            Host string
            Port int
        }
        Database struct {
            Driver string
            DSN    string
        }
    }{
        Server: struct {
            Host string
            Port int
        }{
            Host: "localhost",
            Port: 8080,
        },
        Database: struct {
            Driver string
            DSN    string
        }{
            Driver: "postgres",
            DSN:    "host=localhost dbname=mydb",
        },
    }

    fmt.Printf("Server: %s:%d\n", config.Server.Host, config.Server.Port)
}

func double(x int) int {
    return x * 2
}
```

## 结构体方法

方法是与特定类型关联的函数。在 Go 中，你可以在结构体类型上定义方法。

### 值接收器方法

值接收器方法接收结构体的副本：

```go
package main

import (
    "fmt"
    "math"
)

type Circle struct {
    Radius float64
}

// 值接收器方法
func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

func (c Circle) Circumference() float64 {
    return 2 * math.Pi * c.Radius
}

func (c Circle) String() string {
    return fmt.Sprintf("Circle{Radius: %.2f}", c.Radius)
}

func main() {
    circle := Circle{Radius: 5}

    fmt.Println("Area:", circle.Area())
    fmt.Println("Circumference:", circle.Circumference())
    fmt.Println(circle.String())
}
```

### 指针接收器方法

指针接收器方法可以修改原始结构体：

```go
package main

import "fmt"

type Counter struct {
    Value int
}

// 指针接收器 - 可以修改结构体
func (c *Counter) Increment() {
    c.Value++
}

func (c *Counter) Add(n int) {
    c.Value += n
}

func (c *Counter) Reset() {
    c.Value = 0
}

// 值接收器 - 不能修改结构体
func (c Counter) GetValue() int {
    return c.Value
}

func main() {
    counter := Counter{Value: 0}

    counter.Increment()
    fmt.Println("After increment:", counter.Value) // 输出: 1

    counter.Add(10)
    fmt.Println("After add:", counter.Value) // 输出: 11

    counter.Reset()
    fmt.Println("After reset:", counter.Value) // 输出: 0
}
```

### 何时使用指针接收器与值接收器

使用指针接收器的情况：
- 方法需要修改接收器
- 结构体很大（复制开销很大）
- 一致性：如果某些方法需要指针，则所有方法都使用指针

使用值接收器的情况：
- 方法不修改接收器
- 结构体很小，复制开销很低
- 你想要不可变性保证

```go
package main

import "fmt"

// 小结构体 - 使用值接收器没问题
type Point struct {
    X, Y int
}

func (p Point) Distance(other Point) float64 {
    dx := float64(p.X - other.X)
    dy := float64(p.Y - other.Y)
    return (dx*dx + dy*dy)
}

// 大结构体 - 使用指针接收器
type LargeData struct {
    Data [1000]int
    Name string
}

func (ld *LargeData) Process() {
    // 处理数据
    ld.Data[0] = 1
}

func main() {
    p1 := Point{0, 0}
    p2 := Point{3, 4}
    fmt.Println("Distance:", p1.Distance(p2))

    data := LargeData{Name: "test"}
    data.Process()
}
```

## 结构体嵌入（组合）

Go 没有继承，但它通过结构体嵌入支持组合。当你嵌入一个结构体时，它的字段和方法会被提升到嵌入它的结构体中。

### 基本嵌入

```go
package main

import "fmt"

type Address struct {
    Street  string
    City    string
    Country string
}

type Person struct {
    Name string
    Age  int
    Address // 嵌入的结构体（匿名字段）
}

func main() {
    p := Person{
        Name: "Jane",
        Age:  28,
        Address: Address{
            Street:  "123 Main St",
            City:    "San Francisco",
            Country: "USA",
        },
    }

    // 直接访问嵌入的字段
    fmt.Println("Name:", p.Name)
    fmt.Println("City:", p.City)    // 提升的字段
    fmt.Println("Country:", p.Country) // 提升的字段

    // 或者通过嵌入类型访问
    fmt.Println("Address:", p.Address)
}
```

### 方法提升

嵌入类型的方法也会被提升：

```go
package main

import "fmt"

type Engine struct {
    Horsepower int
    Type       string
}

func (e Engine) Start() {
    fmt.Printf("Starting %s engine with %d HP\n", e.Type, e.Horsepower)
}

func (e Engine) Stop() {
    fmt.Println("Engine stopped")
}

type Car struct {
    Brand string
    Model string
    Engine // 嵌入
}

func main() {
    car := Car{
        Brand: "Toyota",
        Model: "Camry",
        Engine: Engine{
            Horsepower: 200,
            Type:       "V6",
        },
    }

    // 方法被提升
    car.Start() // 输出: Starting V6 engine with 200 HP
    car.Stop()  // 输出: Engine stopped

    // 你仍然可以通过嵌入类型访问
    car.Engine.Start()
}
```

### 多重嵌入

你可以嵌入多个类型：

```go
package main

import "fmt"

type Writer struct{}

func (w Writer) Write(data string) {
    fmt.Println("Writing:", data)
}

type Reader struct{}

func (r Reader) Read() string {
    return "data from reader"
}

type ReadWriter struct {
    Reader
    Writer
}

func main() {
    rw := ReadWriter{}

    // 两个方法都可用
    data := rw.Read()
    rw.Write(data)
}
```

### 覆盖嵌入的方法

嵌入类型可以定义自己的方法来覆盖嵌入的方法：

```go
package main

import "fmt"

type Animal struct {
    Name string
}

func (a Animal) Speak() string {
    return "..."
}

type Dog struct {
    Animal
    Breed string
}

// 覆盖 Speak 方法
func (d Dog) Speak() string {
    return "Woof!"
}

func main() {
    dog := Dog{
        Animal: Animal{Name: "Buddy"},
        Breed:  "Golden Retriever",
    }

    fmt.Println(dog.Name)   // 来自 Animal
    fmt.Println(dog.Speak()) // 被覆盖的: Woof!
    fmt.Println(dog.Animal.Speak()) // 原始的: ...
}
```

### 命名嵌入与匿名嵌入

```go
package main

import "fmt"

type Logger struct{}

func (l Logger) Log(message string) {
    fmt.Println("LOG:", message)
}

// 匿名嵌入 - 字段和方法被提升
type ServiceA struct {
    Logger // 匿名
}

// 命名嵌入 - 必须通过字段名访问
type ServiceB struct {
    logger Logger // 命名字段
}

func main() {
    a := ServiceA{}
    a.Log("message from A") // 直接访问

    b := ServiceB{logger: Logger{}}
    b.logger.Log("message from B") // 必须使用字段名
}
```

## 结构体标签

结构体标签是附加到结构体字段的小段元数据。它们通常用于序列化、验证和 ORM 映射。

### 基本结构体标签

```go
package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    ID        int    `json:"id"`
    Username  string `json:"username"`
    Email     string `json:"email"`
    Password  string `json:"-"` // 从 JSON 中排除
    CreatedAt string `json:"created_at,omitempty"`
}

func main() {
    user := User{
        ID:       1,
        Username: "johndoe",
        Email:    "john@example.com",
        Password: "secret123",
    }

    // 序列化为 JSON
    jsonData, _ := json.Marshal(user)
    fmt.Println(string(jsonData))
    // 输出: {"id":1,"username":"johndoe","email":"john@example.com"}

    // 从 JSON 反序列化
    jsonInput := `{"id":2,"username":"janedoe","email":"jane@example.com"}`
    var user2 User
    json.Unmarshal([]byte(jsonInput), &user2)
    fmt.Printf("%+v\n", user2)
}
```

### 多个标签键

你可以为不同目的包含多个标签键：

```go
package main

import (
    "encoding/json"
    "encoding/xml"
    "fmt"
)

type Product struct {
    ID          int     `json:"id" xml:"id" db:"product_id"`
    Name        string  `json:"name" xml:"name" db:"product_name"`
    Price       float64 `json:"price" xml:"price" db:"price"`
    Description string  `json:"description,omitempty" xml:"desc" db:"description"`
}

func main() {
    product := Product{
        ID:    1,
        Name:  "Laptop",
        Price: 999.99,
    }

    // JSON 输出
    jsonData, _ := json.Marshal(product)
    fmt.Println("JSON:", string(jsonData))

    // XML 输出
    xmlData, _ := xml.Marshal(product)
    fmt.Println("XML:", string(xmlData))
}
```

### 使用反射读取结构体标签

```go
package main

import (
    "fmt"
    "reflect"
)

type Article struct {
    Title   string `json:"title" validate:"required,min=1,max=100"`
    Content string `json:"content" validate:"required"`
    Author  string `json:"author" validate:"required"`
}

func main() {
    article := Article{}
    t := reflect.TypeOf(article)

    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        fmt.Printf("Field: %s\n", field.Name)
        fmt.Printf("  JSON tag: %s\n", field.Tag.Get("json"))
        fmt.Printf("  Validate tag: %s\n", field.Tag.Get("validate"))
        fmt.Println()
    }
}
```

### 常见标签模式

```go
type Model struct {
    // JSON 标签
    Name string `json:"name"`                    // 重命名
    Age  int    `json:"age,omitempty"`           // 零值时省略
    Pass string `json:"-"`                       // 始终省略
    Data []byte `json:"data,string"`             // 编码为字符串

    // 数据库标签（GORM 示例）
    ID        uint   `gorm:"primaryKey"`
    Email     string `gorm:"uniqueIndex;size:255"`
    CreatedAt time.Time `gorm:"autoCreateTime"`

    // 验证标签（go-playground/validator）
    Username string `validate:"required,alphanum,min=3,max=20"`
    Email    string `validate:"required,email"`
    Age      int    `validate:"gte=0,lte=120"`

    // 表单标签（gin/echo）
    Query  string `form:"q" query:"q"`
    Header string `header:"X-Custom-Header"`

    // 环境变量标签
    Port string `env:"PORT" envDefault:"8080"`
}
```

## 比较结构体

如果所有字段都是可比较的，则结构体是可比较的：

```go
package main

import "fmt"

type Point struct {
    X, Y int
}

type Data struct {
    Values []int // 切片是不可比较的
}

func main() {
    // 可比较的结构体
    p1 := Point{1, 2}
    p2 := Point{1, 2}
    p3 := Point{3, 4}

    fmt.Println(p1 == p2) // 输出: true
    fmt.Println(p1 == p3) // 输出: false

    // 可以用作 map 的键
    points := make(map[Point]string)
    points[p1] = "origin adjacent"
    points[p3] = "far point"

    fmt.Println(points[p1])

    // 不可比较的结构体（包含切片、map 或函数）
    // d1 := Data{Values: []int{1, 2}}
    // d2 := Data{Values: []int{1, 2}}
    // fmt.Println(d1 == d2) // 编译错误！
}
```

### 使用 reflect.DeepEqual 进行深度比较

对于包含不可比较字段的结构体，使用 `reflect.DeepEqual`：

```go
package main

import (
    "fmt"
    "reflect"
)

type Config struct {
    Name    string
    Options []string
    Settings map[string]int
}

func main() {
    c1 := Config{
        Name:    "test",
        Options: []string{"a", "b"},
        Settings: map[string]int{"x": 1},
    }

    c2 := Config{
        Name:    "test",
        Options: []string{"a", "b"},
        Settings: map[string]int{"x": 1},
    }

    c3 := Config{
        Name:    "test",
        Options: []string{"a", "c"},
        Settings: map[string]int{"x": 1},
    }

    fmt.Println(reflect.DeepEqual(c1, c2)) // true
    fmt.Println(reflect.DeepEqual(c1, c3)) // false
}
```

## 复制结构体

理解结构体复制行为对于避免 bug 至关重要。

### 值复制

当你将结构体赋值给新变量时，会创建一个副本：

```go
package main

import "fmt"

type Person struct {
    Name string
    Age  int
}

func main() {
    original := Person{Name: "Alice", Age: 30}
    copy := original // 创建副本

    copy.Name = "Bob"
    copy.Age = 25

    fmt.Println("Original:", original) // {Alice 30}
    fmt.Println("Copy:", copy)         // {Bob 25}
}
```

### 指针和切片的浅复制

对于指针或切片字段要小心：

```go
package main

import "fmt"

type Team struct {
    Name    string
    Members []string
}

func main() {
    original := Team{
        Name:    "Alpha",
        Members: []string{"Alice", "Bob"},
    }

    // 浅复制 - 切片头被复制，但底层数组是共享的
    copy := original

    copy.Name = "Beta"
    copy.Members[0] = "Charlie" // 这会同时修改两者！

    fmt.Println("Original:", original) // {Alpha [Charlie Bob]}
    fmt.Println("Copy:", copy)         // {Beta [Charlie Bob]}
}
```

### 深复制

对于深复制，你需要手动复制切片和 map 字段：

```go
package main

import "fmt"

type Team struct {
    Name    string
    Members []string
}

func (t Team) DeepCopy() Team {
    membersCopy := make([]string, len(t.Members))
    copy(membersCopy, t.Members)

    return Team{
        Name:    t.Name,
        Members: membersCopy,
    }
}

func main() {
    original := Team{
        Name:    "Alpha",
        Members: []string{"Alice", "Bob"},
    }

    deepCopy := original.DeepCopy()
    deepCopy.Members[0] = "Charlie"

    fmt.Println("Original:", original)   // {Alpha [Alice Bob]}
    fmt.Println("Deep Copy:", deepCopy)  // {Alpha [Charlie Bob]}
}
```

## 构造函数

Go 没有构造函数，但创建工厂函数是惯用做法：

```go
package main

import (
    "errors"
    "fmt"
)

type Server struct {
    host string
    port int
}

// 简单构造函数
func NewServer(host string, port int) *Server {
    return &Server{
        host: host,
        port: port,
    }
}

// 带验证的构造函数
func NewServerWithValidation(host string, port int) (*Server, error) {
    if host == "" {
        return nil, errors.New("host cannot be empty")
    }
    if port < 1 || port > 65535 {
        return nil, errors.New("port must be between 1 and 65535")
    }

    return &Server{
        host: host,
        port: port,
    }, nil
}

// 带默认值的构造函数
func NewDefaultServer() *Server {
    return &Server{
        host: "localhost",
        port: 8080,
    }
}

func main() {
    server1 := NewServer("api.example.com", 443)
    fmt.Printf("Server 1: %+v\n", server1)

    server2, err := NewServerWithValidation("", 8080)
    if err != nil {
        fmt.Println("Error:", err)
    }

    server3 := NewDefaultServer()
    fmt.Printf("Server 3: %+v\n", server3)

    _ = server2
}
```

### 函数选项模式

对于具有许多可选字段的结构体，函数选项模式很优雅：

```go
package main

import (
    "fmt"
    "time"
)

type Client struct {
    host     string
    port     int
    timeout  time.Duration
    retries  int
    insecure bool
}

// Option 是一个配置 Client 的函数
type Option func(*Client)

// 选项函数
func WithPort(port int) Option {
    return func(c *Client) {
        c.port = port
    }
}

func WithTimeout(timeout time.Duration) Option {
    return func(c *Client) {
        c.timeout = timeout
    }
}

func WithRetries(retries int) Option {
    return func(c *Client) {
        c.retries = retries
    }
}

func WithInsecure() Option {
    return func(c *Client) {
        c.insecure = true
    }
}

// 带选项的构造函数
func NewClient(host string, opts ...Option) *Client {
    // 默认值
    client := &Client{
        host:     host,
        port:     443,
        timeout:  30 * time.Second,
        retries:  3,
        insecure: false,
    }

    // 应用选项
    for _, opt := range opts {
        opt(client)
    }

    return client
}

func main() {
    // 使用默认值
    client1 := NewClient("api.example.com")
    fmt.Printf("Client 1: %+v\n", client1)

    // 使用自定义选项
    client2 := NewClient("api.example.com",
        WithPort(8443),
        WithTimeout(10*time.Second),
        WithRetries(5),
        WithInsecure(),
    )
    fmt.Printf("Client 2: %+v\n", client2)
}
```

## 结构体与 JSON

在 Go 应用程序中处理 JSON 非常常见：

```go
package main

import (
    "encoding/json"
    "fmt"
    "time"
)

type APIResponse struct {
    Status    string    `json:"status"`
    Message   string    `json:"message,omitempty"`
    Data      *UserData `json:"data,omitempty"`
    Timestamp time.Time `json:"timestamp"`
}

type UserData struct {
    ID       int      `json:"id"`
    Name     string   `json:"name"`
    Email    string   `json:"email"`
    Active   bool     `json:"active"`
    Tags     []string `json:"tags,omitempty"`
    Metadata map[string]interface{} `json:"metadata,omitempty"`
}

func main() {
    // 结构体转 JSON
    response := APIResponse{
        Status:    "success",
        Timestamp: time.Now(),
        Data: &UserData{
            ID:     1,
            Name:   "John Doe",
            Email:  "john@example.com",
            Active: true,
            Tags:   []string{"admin", "developer"},
            Metadata: map[string]interface{}{
                "lastLogin": "2024-01-15",
                "loginCount": 42,
            },
        },
    }

    jsonBytes, _ := json.MarshalIndent(response, "", "  ")
    fmt.Println("JSON Output:")
    fmt.Println(string(jsonBytes))

    // JSON 转结构体
    jsonInput := `{
        "status": "success",
        "data": {
            "id": 2,
            "name": "Jane Smith",
            "email": "jane@example.com",
            "active": false
        },
        "timestamp": "2024-01-15T10:30:00Z"
    }`

    var parsedResponse APIResponse
    json.Unmarshal([]byte(jsonInput), &parsedResponse)
    fmt.Printf("\nParsed: %+v\n", parsedResponse)
}
```

### 自定义 JSON 序列化

你可以实现自定义的 JSON 序列化和反序列化：

```go
package main

import (
    "encoding/json"
    "fmt"
    "time"
)

type Event struct {
    Name      string
    Timestamp CustomTime
}

// 带有不同 JSON 格式的自定义时间类型
type CustomTime struct {
    time.Time
}

const customTimeFormat = "2006-01-02 15:04:05"

func (ct CustomTime) MarshalJSON() ([]byte, error) {
    return json.Marshal(ct.Format(customTimeFormat))
}

func (ct *CustomTime) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }
    t, err := time.Parse(customTimeFormat, s)
    if err != nil {
        return err
    }
    ct.Time = t
    return nil
}

func main() {
    event := Event{
        Name:      "Meeting",
        Timestamp: CustomTime{time.Now()},
    }

    jsonBytes, _ := json.Marshal(event)
    fmt.Println(string(jsonBytes))
    // 输出: {"Name":"Meeting","Timestamp":"2024-01-15 14:30:45"}

    // 解析回来
    jsonInput := `{"Name":"Conference","Timestamp":"2024-06-20 09:00:00"}`
    var parsedEvent Event
    json.Unmarshal([]byte(jsonInput), &parsedEvent)
    fmt.Printf("Parsed: %+v\n", parsedEvent)
}
```

## 最佳实践

### 保持结构体专注

每个结构体应该代表单一概念：

```go
// 好的做法：专注的结构体
type Address struct {
    Street  string
    City    string
    Country string
}

type ContactInfo struct {
    Email string
    Phone string
}

type User struct {
    ID          int
    Name        string
    Address     Address
    ContactInfo ContactInfo
}

// 避免：承担太多职责的结构体
type BadUser struct {
    ID      int
    Name    string
    Street  string
    City    string
    Country string
    Email   string
    Phone   string
    // ... 更多字段
}
```

### 使用有意义的字段名

```go
// 好的做法
type Order struct {
    CustomerID    int
    ProductSKU    string
    Quantity      int
    UnitPrice     float64
    TotalAmount   float64
    OrderDate     time.Time
    DeliveryDate  time.Time
}

// 避免
type Order struct {
    CID  int
    PSKU string
    Qty  int
    UP   float64
    TA   float64
    OD   time.Time
    DD   time.Time
}
```

### 考虑零值

设计结构体使零值有用：

```go
package main

import "fmt"

// 好的做法：零值是有用的
type Counter struct {
    value int // 零值（0）是有效的起始点
}

func (c *Counter) Increment() {
    c.value++
}

func (c Counter) Value() int {
    return c.value
}

// 使用零值立即可用
func main() {
    var c Counter // 不需要初始化
    c.Increment()
    c.Increment()
    fmt.Println(c.Value()) // 输出: 2
}
```

### 为导出的类型和字段编写文档

```go
// User 表示系统中的注册用户。
// 用户通过注册流程创建，可以
// 被分配各种角色和权限。
type User struct {
    // ID 是用户的唯一标识符。
    ID int

    // Email 是用户的电子邮件地址，用于登录和通知。
    // 在所有用户中必须唯一。
    Email string

    // CreatedAt 是用户账户创建的时间戳。
    CreatedAt time.Time
}
```

### 一致地使用指针接收器

如果任何方法需要指针接收器，则所有方法都使用指针接收器：

```go
type Account struct {
    balance float64
}

// 所有方法都使用指针接收器以保持一致性
func (a *Account) Deposit(amount float64) {
    a.balance += amount
}

func (a *Account) Withdraw(amount float64) error {
    if amount > a.balance {
        return errors.New("insufficient funds")
    }
    a.balance -= amount
    return nil
}

func (a *Account) Balance() float64 {
    return a.balance
}
```

## 常见模式

### 建造者模式

```go
package main

import "fmt"

type Query struct {
    table      string
    columns    []string
    conditions []string
    orderBy    string
    limit      int
}

type QueryBuilder struct {
    query *Query
}

func NewQueryBuilder() *QueryBuilder {
    return &QueryBuilder{query: &Query{}}
}

func (b *QueryBuilder) From(table string) *QueryBuilder {
    b.query.table = table
    return b
}

func (b *QueryBuilder) Select(columns ...string) *QueryBuilder {
    b.query.columns = columns
    return b
}

func (b *QueryBuilder) Where(condition string) *QueryBuilder {
    b.query.conditions = append(b.query.conditions, condition)
    return b
}

func (b *QueryBuilder) OrderBy(column string) *QueryBuilder {
    b.query.orderBy = column
    return b
}

func (b *QueryBuilder) Limit(n int) *QueryBuilder {
    b.query.limit = n
    return b
}

func (b *QueryBuilder) Build() *Query {
    return b.query
}

func main() {
    query := NewQueryBuilder().
        From("users").
        Select("id", "name", "email").
        Where("active = true").
        Where("age > 18").
        OrderBy("created_at DESC").
        Limit(10).
        Build()

    fmt.Printf("Query: %+v\n", query)
}
```

### 仓储模式

```go
package main

import (
    "errors"
    "fmt"
)

type User struct {
    ID    int
    Name  string
    Email string
}

type UserRepository interface {
    FindByID(id int) (*User, error)
    FindAll() ([]*User, error)
    Create(user *User) error
    Update(user *User) error
    Delete(id int) error
}

type InMemoryUserRepository struct {
    users  map[int]*User
    nextID int
}

func NewInMemoryUserRepository() *InMemoryUserRepository {
    return &InMemoryUserRepository{
        users:  make(map[int]*User),
        nextID: 1,
    }
}

func (r *InMemoryUserRepository) FindByID(id int) (*User, error) {
    user, ok := r.users[id]
    if !ok {
        return nil, errors.New("user not found")
    }
    return user, nil
}

func (r *InMemoryUserRepository) FindAll() ([]*User, error) {
    users := make([]*User, 0, len(r.users))
    for _, user := range r.users {
        users = append(users, user)
    }
    return users, nil
}

func (r *InMemoryUserRepository) Create(user *User) error {
    user.ID = r.nextID
    r.nextID++
    r.users[user.ID] = user
    return nil
}

func (r *InMemoryUserRepository) Update(user *User) error {
    if _, ok := r.users[user.ID]; !ok {
        return errors.New("user not found")
    }
    r.users[user.ID] = user
    return nil
}

func (r *InMemoryUserRepository) Delete(id int) error {
    if _, ok := r.users[id]; !ok {
        return errors.New("user not found")
    }
    delete(r.users, id)
    return nil
}

func main() {
    repo := NewInMemoryUserRepository()

    // 创建用户
    repo.Create(&User{Name: "Alice", Email: "alice@example.com"})
    repo.Create(&User{Name: "Bob", Email: "bob@example.com"})

    // 查找所有用户
    users, _ := repo.FindAll()
    for _, u := range users {
        fmt.Printf("User: %+v\n", u)
    }

    // 按 ID 查找
    user, _ := repo.FindByID(1)
    fmt.Printf("Found: %+v\n", user)
}
```

## 总结

本指南涵盖了 Go 结构体的核心方面：

- **定义和初始化**：如何定义结构体并使用各种方法创建实例
- **字段访问**：访问和修改结构体字段，包括通过指针
- **匿名结构体**：为特定用例创建一次性结构体类型
- **方法**：定义值接收器和指针接收器的方法
- **嵌入**：通过结构体嵌入实现组合
- **结构体标签**：使用元数据进行 JSON、数据库映射和验证
- **比较和复制**：理解结构体如何被比较和复制
- **构造函数**：创建惯用的工厂函数
- **最佳实践**：编写干净、可维护的结构体代码

结构体是在 Go 中构建复杂数据结构和领域模型的基础。通过掌握结构体，你将能够编写惯用、高效且可维护的 Go 代码。

## 下一步

掌握结构体后，探索以下相关主题：

- 接口和多态
- 结构体的并发模式
- 测试基于结构体的代码
- 使用数据库（GORM、sqlx）
- Protocol Buffers 和 gRPC
- Go 中的设计模式
