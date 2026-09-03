---
title: JSON 处理
description: Go JSON 完全指南，encoding/json 包、结构体标签和自定义序列化
track: go
section: stdlib
difficulty: beginner
tags:
  - Go
  - JSON
  - 序列化
  - API
status: imported
origin: old/src/content/docs/go/json.zh.md
divergence: 0.207
issues: []
legacy:
  category: Go
  subcategory: Standard Library
  order: 12
  lastUpdated: 2026-01-07
---

JSON（JavaScript Object Notation）是 Web 应用和 API 中数据交换的事实标准。Go 通过 `encoding/json` 包提供了出色的内置 JSON 支持，既简单易用又灵活强大。本指南涵盖了在 Go 中处理 JSON 所需的一切知识。

## encoding/json 包

`encoding/json` 包提供了将 Go 值编码为 JSON 以及将 JSON 解码为 Go 值的函数。两个主要操作是：

- **Marshal**：将 Go 值转换为 JSON 字节
- **Unmarshal**：将 JSON 字节转换为 Go 值

```go
package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    // 简单的 marshal 示例
    data := map[string]string{"hello": "world"}

    jsonBytes, err := json.Marshal(data)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println(string(jsonBytes))  // {"hello":"world"}
}
```

## 基本编组（Marshaling）

编组将 Go 数据结构转换为 JSON 格式。

### 编组基本类型

```go
package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    // 字符串
    strJSON, _ := json.Marshal("hello")
    fmt.Println(string(strJSON))  // "hello"

    // 数字
    numJSON, _ := json.Marshal(42)
    fmt.Println(string(numJSON))  // 42

    // 布尔值
    boolJSON, _ := json.Marshal(true)
    fmt.Println(string(boolJSON))  // true

    // Nil 变成 null
    var ptr *int
    nilJSON, _ := json.Marshal(ptr)
    fmt.Println(string(nilJSON))  // null

    // 切片
    sliceJSON, _ := json.Marshal([]int{1, 2, 3})
    fmt.Println(string(sliceJSON))  // [1,2,3]

    // Map
    mapJSON, _ := json.Marshal(map[string]int{"a": 1, "b": 2})
    fmt.Println(string(mapJSON))  // {"a":1,"b":2}
}
```

### 编组结构体

结构体是最常编组的类型。默认情况下，导出的字段名成为 JSON 键：

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Person struct {
    Name    string
    Age     int
    Email   string
    Active  bool
}

func main() {
    person := Person{
        Name:   "Alice",
        Age:    30,
        Email:  "alice@example.com",
        Active: true,
    }

    jsonBytes, err := json.Marshal(person)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println(string(jsonBytes))
    // {"Name":"Alice","Age":30,"Email":"alice@example.com","Active":true}
}
```

### 使用 MarshalIndent 格式化输出

对于人类可读的输出，使用 `json.MarshalIndent`：

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Config struct {
    Database struct {
        Host string
        Port int
    }
    Features []string
}

func main() {
    config := Config{
        Features: []string{"auth", "logging", "metrics"},
    }
    config.Database.Host = "localhost"
    config.Database.Port = 5432

    // 第二个参数是前缀，第三个是缩进
    jsonBytes, err := json.MarshalIndent(config, "", "  ")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println(string(jsonBytes))
    // {
    //   "Database": {
    //     "Host": "localhost",
    //     "Port": 5432
    //   },
    //   "Features": [
    //     "auth",
    //     "logging",
    //     "metrics"
    //   ]
    // }
}
```

## 基本解组（Unmarshaling）

解组将 JSON 数据转换为 Go 值。

### 解组到结构体

```go
package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    ID       int
    Username string
    Email    string
}

func main() {
    jsonData := `{"ID":1,"Username":"johndoe","Email":"john@example.com"}`

    var user User
    err := json.Unmarshal([]byte(jsonData), &user)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Printf("ID: %d, Username: %s, Email: %s\n",
        user.ID, user.Username, user.Email)
    // ID: 1, Username: johndoe, Email: john@example.com
}
```

### 解组到 Map

当 JSON 结构未知或动态时，使用 map：

```go
package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    jsonData := `{"name":"Alice","age":30,"active":true}`

    // map[string]interface{} 用于任意 JSON
    var data map[string]interface{}
    err := json.Unmarshal([]byte(jsonData), &data)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println("Name:", data["name"])
    fmt.Println("Age:", data["age"])
    fmt.Println("Active:", data["active"])

    // 类型断言获取特定类型
    if name, ok := data["name"].(string); ok {
        fmt.Println("Name (string):", name)
    }

    // 注意：JSON 数字默认变成 float64
    if age, ok := data["age"].(float64); ok {
        fmt.Println("Age (int):", int(age))
    }
}
```

### 解组数组

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Product struct {
    ID    int
    Name  string
    Price float64
}

func main() {
    jsonData := `[
        {"ID":1,"Name":"Laptop","Price":999.99},
        {"ID":2,"Name":"Mouse","Price":29.99},
        {"ID":3,"Name":"Keyboard","Price":79.99}
    ]`

    var products []Product
    err := json.Unmarshal([]byte(jsonData), &products)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    for _, p := range products {
        fmt.Printf("Product: %s ($%.2f)\n", p.Name, p.Price)
    }
}
```

## 结构体标签

结构体标签控制字段的编码和解码方式。它们是微调 JSON 行为的关键。

### 基本字段命名

使用 `json` 标签指定 JSON 键名：

```go
package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    ID        int    `json:"id"`
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
    Email     string `json:"email"`
}

func main() {
    user := User{
        ID:        1,
        FirstName: "John",
        LastName:  "Doe",
        Email:     "john@example.com",
    }

    jsonBytes, _ := json.Marshal(user)
    fmt.Println(string(jsonBytes))
    // {"id":1,"first_name":"John","last_name":"Doe","email":"john@example.com"}
}
```

### omitempty 选项

`omitempty` 选项从 JSON 输出中省略零值字段：

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Profile struct {
    Name     string `json:"name"`
    Bio      string `json:"bio,omitempty"`
    Age      int    `json:"age,omitempty"`
    Verified bool   `json:"verified,omitempty"`
    Website  string `json:"website,omitempty"`
}

func main() {
    // 完整的 profile
    full := Profile{
        Name:     "Alice",
        Bio:      "Software developer",
        Age:      30,
        Verified: true,
        Website:  "https://alice.dev",
    }

    // 最小 profile（空字段被省略）
    minimal := Profile{
        Name: "Bob",
    }

    fullJSON, _ := json.MarshalIndent(full, "", "  ")
    minimalJSON, _ := json.MarshalIndent(minimal, "", "  ")

    fmt.Println("完整 profile:")
    fmt.Println(string(fullJSON))

    fmt.Println("\n最小 profile:")
    fmt.Println(string(minimalJSON))
    // {
    //   "name": "Bob"
    // }
}
```

### 忽略字段

使用 `-` 完全忽略字段：

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Account struct {
    Username     string `json:"username"`
    Email        string `json:"email"`
    Password     string `json:"-"`           // 永远不包含在 JSON 中
    PasswordHash string `json:"-"`           // 永远不包含在 JSON 中
    InternalID   int    `json:"-"`           // 永远不包含在 JSON 中
}

func main() {
    account := Account{
        Username:     "johndoe",
        Email:        "john@example.com",
        Password:     "secret123",
        PasswordHash: "abc123hash",
        InternalID:   999,
    }

    jsonBytes, _ := json.Marshal(account)
    fmt.Println(string(jsonBytes))
    // {"username":"johndoe","email":"john@example.com"}
}
```

### 数字的字符串编码

强制将数值字段编码为字符串：

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Item struct {
    ID       int64   `json:"id,string"`
    Price    float64 `json:"price,string"`
    Quantity int     `json:"quantity,string"`
}

func main() {
    item := Item{
        ID:       9007199254740993,  // 可能在 JS 中丢失精度的大数
        Price:    19.99,
        Quantity: 5,
    }

    jsonBytes, _ := json.Marshal(item)
    fmt.Println(string(jsonBytes))
    // {"id":"9007199254740993","price":"19.99","quantity":"5"}
}
```

### 嵌入结构体

嵌入的结构体默认在 JSON 中被展平：

```go
package main

import (
    "encoding/json"
    "fmt"
    "time"
)

type Timestamps struct {
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type Article struct {
    ID      int    `json:"id"`
    Title   string `json:"title"`
    Content string `json:"content"`
    Timestamps      // 嵌入 - 字段被提升
}

func main() {
    article := Article{
        ID:      1,
        Title:   "Go JSON 指南",
        Content: "学习 Go 中的 JSON 处理...",
        Timestamps: Timestamps{
            CreatedAt: time.Now(),
            UpdatedAt: time.Now(),
        },
    }

    jsonBytes, _ := json.MarshalIndent(article, "", "  ")
    fmt.Println(string(jsonBytes))
    // {
    //   "id": 1,
    //   "title": "Go JSON 指南",
    //   "content": "学习 Go 中的 JSON 处理...",
    //   "created_at": "2024-01-15T10:30:00Z",
    //   "updated_at": "2024-01-15T10:30:00Z"
    // }
}
```

## 自定义 Marshaler 和 Unmarshaler

实现 `json.Marshaler` 和 `json.Unmarshaler` 接口以完全控制序列化。

### 自定义 Marshaler

```go
package main

import (
    "encoding/json"
    "fmt"
    "time"
)

type CustomTime struct {
    time.Time
}

// MarshalJSON 实现 json.Marshaler
func (ct CustomTime) MarshalJSON() ([]byte, error) {
    formatted := ct.Format("2006-01-02")
    return json.Marshal(formatted)
}

type Event struct {
    Name string     `json:"name"`
    Date CustomTime `json:"date"`
}

func main() {
    event := Event{
        Name: "Go Conference",
        Date: CustomTime{time.Now()},
    }

    jsonBytes, _ := json.Marshal(event)
    fmt.Println(string(jsonBytes))
    // {"name":"Go Conference","date":"2024-01-15"}
}
```

### 自定义 Unmarshaler

```go
package main

import (
    "encoding/json"
    "fmt"
    "strings"
    "time"
)

type FlexibleTime struct {
    time.Time
}

// UnmarshalJSON 实现 json.Unmarshaler
func (ft *FlexibleTime) UnmarshalJSON(data []byte) error {
    // 移除引号
    s := strings.Trim(string(data), `"`)

    // 尝试不同的格式
    formats := []string{
        "2006-01-02T15:04:05Z07:00",
        "2006-01-02T15:04:05",
        "2006-01-02",
        "01/02/2006",
    }

    var err error
    for _, format := range formats {
        ft.Time, err = time.Parse(format, s)
        if err == nil {
            return nil
        }
    }

    return fmt.Errorf("cannot parse %q as time", s)
}

type Task struct {
    Title   string       `json:"title"`
    DueDate FlexibleTime `json:"due_date"`
}

func main() {
    testCases := []string{
        `{"title":"Task 1","due_date":"2024-01-15"}`,
        `{"title":"Task 2","due_date":"01/20/2024"}`,
        `{"title":"Task 3","due_date":"2024-02-01T14:30:00"}`,
    }

    for _, jsonData := range testCases {
        var task Task
        if err := json.Unmarshal([]byte(jsonData), &task); err != nil {
            fmt.Println("Error:", err)
            continue
        }
        fmt.Printf("%s: %s\n", task.Title, task.DueDate.Format("2006-01-02"))
    }
}
```

### 自定义类型示例：状态枚举

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Status int

const (
    StatusPending Status = iota
    StatusActive
    StatusCompleted
    StatusCancelled
)

var statusNames = map[Status]string{
    StatusPending:   "pending",
    StatusActive:    "active",
    StatusCompleted: "completed",
    StatusCancelled: "cancelled",
}

var statusValues = map[string]Status{
    "pending":   StatusPending,
    "active":    StatusActive,
    "completed": StatusCompleted,
    "cancelled": StatusCancelled,
}

func (s Status) MarshalJSON() ([]byte, error) {
    return json.Marshal(statusNames[s])
}

func (s *Status) UnmarshalJSON(data []byte) error {
    var name string
    if err := json.Unmarshal(data, &name); err != nil {
        return err
    }
    if val, ok := statusValues[name]; ok {
        *s = val
        return nil
    }
    return fmt.Errorf("invalid status: %s", name)
}

type Order struct {
    ID     int    `json:"id"`
    Status Status `json:"status"`
}

func main() {
    // Marshal
    order := Order{ID: 123, Status: StatusActive}
    jsonBytes, _ := json.Marshal(order)
    fmt.Println(string(jsonBytes))  // {"id":123,"status":"active"}

    // Unmarshal
    jsonData := `{"id":456,"status":"completed"}`
    var order2 Order
    json.Unmarshal([]byte(jsonData), &order2)
    fmt.Printf("Order %d status: %v\n", order2.ID, statusNames[order2.Status])
}
```

## json.RawMessage

`json.RawMessage` 允许你延迟 JSON 解析或原样传递 JSON 数据。

### 延迟 JSON 解析

```go
package main

import (
    "encoding/json"
    "fmt"
)

type APIResponse struct {
    Type    string          `json:"type"`
    Payload json.RawMessage `json:"payload"`
}

type UserPayload struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

type OrderPayload struct {
    OrderID string  `json:"order_id"`
    Total   float64 `json:"total"`
}

func main() {
    responses := []string{
        `{"type":"user","payload":{"id":1,"name":"Alice"}}`,
        `{"type":"order","payload":{"order_id":"ORD-123","total":99.99}}`,
    }

    for _, jsonData := range responses {
        var resp APIResponse
        if err := json.Unmarshal([]byte(jsonData), &resp); err != nil {
            fmt.Println("Error:", err)
            continue
        }

        // 根据类型解析 payload
        switch resp.Type {
        case "user":
            var user UserPayload
            json.Unmarshal(resp.Payload, &user)
            fmt.Printf("User: %s (ID: %d)\n", user.Name, user.ID)
        case "order":
            var order OrderPayload
            json.Unmarshal(resp.Payload, &order)
            fmt.Printf("Order: %s ($%.2f)\n", order.OrderID, order.Total)
        }
    }
}
```

### 保留未知字段

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Config struct {
    Name     string          `json:"name"`
    Version  string          `json:"version"`
    Settings json.RawMessage `json:"settings"` // 原样保留
}

func main() {
    // 带复杂 settings 的原始 JSON
    jsonData := `{
        "name": "myapp",
        "version": "1.0.0",
        "settings": {
            "database": {"host": "localhost", "port": 5432},
            "cache": {"enabled": true, "ttl": 3600},
            "features": ["auth", "logging"]
        }
    }`

    var config Config
    json.Unmarshal([]byte(jsonData), &config)

    // 修改已知字段
    config.Version = "1.1.0"

    // Settings 保持不变
    output, _ := json.MarshalIndent(config, "", "  ")
    fmt.Println(string(output))
}
```

### 构建动态 JSON

```go
package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    // 预编码的 JSON 片段
    userJSON := json.RawMessage(`{"id":1,"name":"Alice"}`)
    metaJSON := json.RawMessage(`{"version":"1.0","timestamp":"2024-01-15T10:00:00Z"}`)

    response := map[string]interface{}{
        "success": true,
        "user":    userJSON,
        "meta":    metaJSON,
    }

    output, _ := json.MarshalIndent(response, "", "  ")
    fmt.Println(string(output))
}
```

## 使用 Encoder 和 Decoder 进行流式 JSON

对于处理流（文件、网络连接），使用 `json.Encoder` 和 `json.Decoder`。

### 编码到 Writer

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "os"
)

type LogEntry struct {
    Level   string `json:"level"`
    Message string `json:"message"`
}

func main() {
    // 编码到 stdout
    encoder := json.NewEncoder(os.Stdout)
    encoder.SetIndent("", "  ")

    entry := LogEntry{Level: "info", Message: "Application started"}
    encoder.Encode(entry)

    // 编码到 buffer
    var buf bytes.Buffer
    bufEncoder := json.NewEncoder(&buf)

    entries := []LogEntry{
        {Level: "info", Message: "Processing request"},
        {Level: "warn", Message: "High memory usage"},
        {Level: "error", Message: "Connection failed"},
    }

    for _, e := range entries {
        bufEncoder.Encode(e)
    }

    fmt.Println("\nBuffer 内容:")
    fmt.Println(buf.String())
}
```

### 从 Reader 解码

```go
package main

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Message struct {
    Type    string `json:"type"`
    Content string `json:"content"`
}

func main() {
    // 多个 JSON 对象（换行分隔的 JSON / NDJSON）
    jsonStream := `{"type":"greeting","content":"Hello"}
{"type":"question","content":"How are you?"}
{"type":"farewell","content":"Goodbye"}`

    decoder := json.NewDecoder(strings.NewReader(jsonStream))

    for decoder.More() {
        var msg Message
        if err := decoder.Decode(&msg); err != nil {
            fmt.Println("Error:", err)
            break
        }
        fmt.Printf("[%s] %s\n", msg.Type, msg.Content)
    }
}
```

### 从 HTTP 响应流式读取

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

type GitHubUser struct {
    Login     string `json:"login"`
    ID        int    `json:"id"`
    AvatarURL string `json:"avatar_url"`
}

func main() {
    resp, err := http.Get("https://api.github.com/users/golang")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    defer resp.Body.Close()

    var user GitHubUser
    decoder := json.NewDecoder(resp.Body)
    if err := decoder.Decode(&user); err != nil {
        fmt.Println("Error decoding:", err)
        return
    }

    fmt.Printf("User: %s (ID: %d)\n", user.Login, user.ID)
}
```

### 写入 JSON 到文件

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

type Settings struct {
    Theme    string   `json:"theme"`
    Language string   `json:"language"`
    Features []string `json:"features"`
}

func main() {
    settings := Settings{
        Theme:    "dark",
        Language: "en",
        Features: []string{"notifications", "autosave", "sync"},
    }

    file, err := os.Create("settings.json")
    if err != nil {
        fmt.Println("Error creating file:", err)
        return
    }
    defer file.Close()

    encoder := json.NewEncoder(file)
    encoder.SetIndent("", "  ")

    if err := encoder.Encode(settings); err != nil {
        fmt.Println("Error encoding:", err)
        return
    }

    fmt.Println("Settings 已保存到 settings.json")
}
```

### 从文件读取 JSON

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

type Settings struct {
    Theme    string   `json:"theme"`
    Language string   `json:"language"`
    Features []string `json:"features"`
}

func main() {
    file, err := os.Open("settings.json")
    if err != nil {
        fmt.Println("Error opening file:", err)
        return
    }
    defer file.Close()

    var settings Settings
    decoder := json.NewDecoder(file)

    if err := decoder.Decode(&settings); err != nil {
        fmt.Println("Error decoding:", err)
        return
    }

    fmt.Printf("Theme: %s, Language: %s\n", settings.Theme, settings.Language)
    fmt.Println("Features:", settings.Features)
}
```

## 处理 Null 和可选值

### 使用指针表示可选字段

```go
package main

import (
    "encoding/json"
    "fmt"
)

type UserProfile struct {
    Name     string  `json:"name"`
    Bio      *string `json:"bio"`       // 可以为 null
    Age      *int    `json:"age"`       // 可以为 null
    Verified *bool   `json:"verified"`  // 可以为 null
}

func main() {
    // 带 null 值的 JSON
    jsonData := `{"name":"Alice","bio":null,"age":30,"verified":null}`

    var profile UserProfile
    json.Unmarshal([]byte(jsonData), &profile)

    fmt.Println("Name:", profile.Name)

    if profile.Bio != nil {
        fmt.Println("Bio:", *profile.Bio)
    } else {
        fmt.Println("Bio: (未设置)")
    }

    if profile.Age != nil {
        fmt.Println("Age:", *profile.Age)
    } else {
        fmt.Println("Age: (未设置)")
    }

    if profile.Verified != nil {
        fmt.Println("Verified:", *profile.Verified)
    } else {
        fmt.Println("Verified: (未设置)")
    }
}
```

### 区分缺失和 Null 字段

```go
package main

import (
    "encoding/json"
    "fmt"
)

type NullableString struct {
    Value   string
    IsSet   bool
    IsNull  bool
}

func (ns *NullableString) UnmarshalJSON(data []byte) error {
    ns.IsSet = true
    if string(data) == "null" {
        ns.IsNull = true
        return nil
    }
    return json.Unmarshal(data, &ns.Value)
}

func (ns NullableString) MarshalJSON() ([]byte, error) {
    if ns.IsNull {
        return []byte("null"), nil
    }
    return json.Marshal(ns.Value)
}

type Document struct {
    Title       string         `json:"title"`
    Description NullableString `json:"description"`
}

func main() {
    testCases := []string{
        `{"title":"Doc 1"}`,                          // description 缺失
        `{"title":"Doc 2","description":null}`,       // description 显式为 null
        `{"title":"Doc 3","description":"Some text"}`, // description 有值
    }

    for _, jsonData := range testCases {
        var doc Document
        json.Unmarshal([]byte(jsonData), &doc)

        fmt.Printf("Title: %s\n", doc.Title)
        if !doc.Description.IsSet {
            fmt.Println("  Description: (缺失)")
        } else if doc.Description.IsNull {
            fmt.Println("  Description: (null)")
        } else {
            fmt.Printf("  Description: %s\n", doc.Description.Value)
        }
        fmt.Println()
    }
}
```

## 验证和错误处理

### 处理 Unmarshal 错误

```go
package main

import (
    "encoding/json"
    "fmt"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func main() {
    testCases := []struct {
        name string
        json string
    }{
        {"valid", `{"id":1,"name":"Alice","email":"alice@example.com"}`},
        {"invalid JSON", `{"id":1,"name":"Alice"`},
        {"wrong type", `{"id":"not a number","name":"Bob"}`},
    }

    for _, tc := range testCases {
        var user User
        err := json.Unmarshal([]byte(tc.json), &user)

        if err != nil {
            switch e := err.(type) {
            case *json.SyntaxError:
                fmt.Printf("%s: 语法错误在位置 %d\n", tc.name, e.Offset)
            case *json.UnmarshalTypeError:
                fmt.Printf("%s: 字段 %s 类型错误 (期望 %s, 得到 %s)\n",
                    tc.name, e.Field, e.Type, e.Value)
            default:
                fmt.Printf("%s: %v\n", tc.name, err)
            }
        } else {
            fmt.Printf("%s: 解析成功 - %+v\n", tc.name, user)
        }
    }
}
```

### 使用 DisallowUnknownFields 进行严格解组

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
)

type Config struct {
    Name    string `json:"name"`
    Version string `json:"version"`
}

func main() {
    // 带未知字段的 JSON
    jsonData := `{"name":"myapp","version":"1.0","unknown_field":"value"}`

    // 标准解组（忽略未知字段）
    var config1 Config
    json.Unmarshal([]byte(jsonData), &config1)
    fmt.Printf("Standard: %+v\n", config1)

    // 严格解组（对未知字段报错）
    var config2 Config
    decoder := json.NewDecoder(bytes.NewReader([]byte(jsonData)))
    decoder.DisallowUnknownFields()

    if err := decoder.Decode(&config2); err != nil {
        fmt.Println("Strict error:", err)
    } else {
        fmt.Printf("Strict: %+v\n", config2)
    }
}
```

### 验证 JSON 结构

```go
package main

import (
    "encoding/json"
    "fmt"
)

func isValidJSON(data []byte) bool {
    var js json.RawMessage
    return json.Unmarshal(data, &js) == nil
}

func main() {
    testCases := []string{
        `{"valid": true}`,
        `[1, 2, 3]`,
        `"just a string"`,
        `{invalid}`,
        `{"missing": "quote}`,
    }

    for _, tc := range testCases {
        valid := isValidJSON([]byte(tc))
        fmt.Printf("'%s' - valid: %v\n", tc, valid)
    }
}
```

## 性能技巧

### 对大文件使用 Decoder

对于大型 JSON 文件，使用 `json.Decoder` 流式处理数据而不是将所有内容加载到内存：

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

type Record struct {
    ID   int    `json:"id"`
    Data string `json:"data"`
}

func processLargeFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    decoder := json.NewDecoder(file)

    // 读取开始括号
    if _, err := decoder.Token(); err != nil {
        return err
    }

    // 逐个处理项目
    for decoder.More() {
        var record Record
        if err := decoder.Decode(&record); err != nil {
            return err
        }
        // 处理记录而不将所有内容保存在内存中
        fmt.Printf("Processing record %d\n", record.ID)
    }

    return nil
}

func main() {
    // 示例用法
    if err := processLargeFile("large_data.json"); err != nil {
        fmt.Println("Error:", err)
    }
}
```

### 重用 Encoder/Decoder

```go
package main

import (
    "bytes"
    "encoding/json"
    "sync"
)

// 用于重用的编码器池
var encoderPool = sync.Pool{
    New: func() interface{} {
        return &bytes.Buffer{}
    },
}

func encodeToJSON(v interface{}) ([]byte, error) {
    buf := encoderPool.Get().(*bytes.Buffer)
    buf.Reset()
    defer encoderPool.Put(buf)

    encoder := json.NewEncoder(buf)
    if err := encoder.Encode(v); err != nil {
        return nil, err
    }

    // 复制一份因为我们要将 buffer 返回到池中
    result := make([]byte, buf.Len())
    copy(result, buf.Bytes())
    return result, nil
}
```

### 使用代码生成避免反射

对于性能关键的应用，考虑使用代码生成工具：

```go
// 使用 easyjson 的示例（需要安装 easyjson 工具）
// go install github.com/mailru/easyjson/...@latest

//go:generate easyjson -all model.go

package main

// FastUser 将会有生成的 MarshalJSON/UnmarshalJSON 方法
type FastUser struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

// 运行后：go generate
// 使用：user.MarshalJSON() 和 user.UnmarshalJSON()
```

## 常见模式和最佳实践

### API 响应封装

```go
package main

import (
    "encoding/json"
    "fmt"
)

type APIResponse struct {
    Success bool            `json:"success"`
    Data    json.RawMessage `json:"data,omitempty"`
    Error   *APIError       `json:"error,omitempty"`
}

type APIError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
}

func SuccessResponse(data interface{}) ([]byte, error) {
    dataJSON, err := json.Marshal(data)
    if err != nil {
        return nil, err
    }

    return json.Marshal(APIResponse{
        Success: true,
        Data:    dataJSON,
    })
}

func ErrorResponse(code, message string) ([]byte, error) {
    return json.Marshal(APIResponse{
        Success: false,
        Error: &APIError{
            Code:    code,
            Message: message,
        },
    })
}

func main() {
    // 成功响应
    user := map[string]interface{}{
        "id":   1,
        "name": "Alice",
    }
    success, _ := SuccessResponse(user)
    fmt.Println(string(success))
    // {"success":true,"data":{"id":1,"name":"Alice"}}

    // 错误响应
    errResp, _ := ErrorResponse("NOT_FOUND", "User not found")
    fmt.Println(string(errResp))
    // {"success":false,"error":{"code":"NOT_FOUND","message":"User not found"}}
}
```

### 配置文件处理

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

type DatabaseConfig struct {
    Host     string `json:"host"`
    Port     int    `json:"port"`
    Username string `json:"username"`
    Password string `json:"password"`
    Database string `json:"database"`
}

type AppConfig struct {
    Environment string         `json:"environment"`
    Debug       bool           `json:"debug"`
    Port        int            `json:"port"`
    Database    DatabaseConfig `json:"database"`
}

func LoadConfig(filename string) (*AppConfig, error) {
    file, err := os.Open(filename)
    if err != nil {
        return nil, fmt.Errorf("opening config file: %w", err)
    }
    defer file.Close()

    var config AppConfig
    decoder := json.NewDecoder(file)
    decoder.DisallowUnknownFields()

    if err := decoder.Decode(&config); err != nil {
        return nil, fmt.Errorf("parsing config file: %w", err)
    }

    return &config, nil
}

func main() {
    config, err := LoadConfig("config.json")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Printf("Environment: %s\n", config.Environment)
    fmt.Printf("Server port: %d\n", config.Port)
    fmt.Printf("Database: %s@%s:%d\n",
        config.Database.Username,
        config.Database.Host,
        config.Database.Port)
}
```

### JSON 合并/补丁

```go
package main

import (
    "encoding/json"
    "fmt"
)

func mergeJSON(base, patch []byte) ([]byte, error) {
    var baseMap, patchMap map[string]interface{}

    if err := json.Unmarshal(base, &baseMap); err != nil {
        return nil, err
    }

    if err := json.Unmarshal(patch, &patchMap); err != nil {
        return nil, err
    }

    // 将补丁应用到基础
    for key, value := range patchMap {
        baseMap[key] = value
    }

    return json.Marshal(baseMap)
}

func main() {
    base := []byte(`{"name":"Alice","age":30,"city":"NYC"}`)
    patch := []byte(`{"age":31,"country":"USA"}`)

    result, err := mergeJSON(base, patch)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println(string(result))
    // {"age":31,"city":"NYC","country":"USA","name":"Alice"}
}
```

### 在 HTTP Handler 中使用 JSON

```go
package main

import (
    "encoding/json"
    "net/http"
)

type CreateUserRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
    writeJSON(w, status, map[string]string{"error": message})
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
        return
    }

    var req CreateUserRequest
    decoder := json.NewDecoder(r.Body)
    decoder.DisallowUnknownFields()

    if err := decoder.Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
        return
    }

    // 验证
    if req.Name == "" || req.Email == "" {
        writeError(w, http.StatusBadRequest, "Name and email are required")
        return
    }

    // 创建用户（模拟）
    user := User{
        ID:    1,
        Name:  req.Name,
        Email: req.Email,
    }

    writeJSON(w, http.StatusCreated, user)
}

func main() {
    http.HandleFunc("/users", createUserHandler)
    http.ListenAndServe(":8080", nil)
}
```

## 总结

本指南涵盖了 Go 中全面的 JSON 处理：

- **基本操作**：使用 Marshal 和 Unmarshal 进行 JSON 编码/解码
- **结构体标签**：使用 `json:"name"` 自定义字段名，使用 `omitempty` 省略空值，使用 `-` 忽略字段
- **自定义 Marshalers**：实现 `MarshalJSON` 和 `UnmarshalJSON` 以完全控制
- **json.RawMessage**：延迟解析、保留未知字段和构建动态 JSON
- **流式处理**：使用 `Encoder` 和 `Decoder` 处理文件和网络流
- **错误处理**：处理语法错误、类型错误和验证 JSON 结构
- **性能**：流式处理大文件、重用缓冲区和考虑代码生成

关键要点：
- 始终处理 Marshal 和 Unmarshal 操作的错误
- 使用结构体标签匹配 API 的命名约定
- 对于可选/可空字段考虑使用指针
- 使用 `json.Decoder` 和 `DisallowUnknownFields()` 进行严格解析
- 流式处理大文件而不是将它们完全加载到内存
- 为复杂类型如枚举和自定义日期格式实现自定义 marshaler

`encoding/json` 包为 Go 中的 JSON 处理提供了坚实的基础。对于性能关键的应用，可以考虑 `json-iterator/go` 等替代品或使用 `easyjson` 进行代码生成，但对于大多数用例，标准库已经足够且经过良好测试。
