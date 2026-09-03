---
title: encoding/gob 序列化
description: Go gob 编码完整指南，用于 Go 程序间通信的二进制序列化和高效数据交换
track: go
section: stdlib
difficulty: intermediate
tags:
  - Go
  - gob
  - 序列化
  - 二进制
  - RPC
status: imported
origin: old/src/content/docs/go/encoding-gob.zh.md
divergence: 0.224
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Go
  subcategory: ""
  order: 50
  lastUpdated: 2026-01-21
---

`encoding/gob` 包提供了一种专为 Go 设计的强大二进制序列化格式。与 JSON 或 XML 不同，gob 针对 Go 程序间通信进行了优化，非常适合 RPC 系统、缓存和持久化存储等场景，前提是通信双方都是 Go 程序。

## 概念解释

Gob（"Go binary"的缩写）是一种自描述的二进制格式，可以高效地编码 Go 数据结构。它的设计目标包括：

- **高效性**：二进制格式比基于文本的格式更紧凑
- **类型安全**：在序列化过程中保留 Go 的类型系统
- **自描述**：数据流包含类型信息
- **流式传输**：支持按顺序编码多个值

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

func main() {
    // 创建一个缓冲区来保存编码后的数据
    var buf bytes.Buffer

    // 创建编码器
    enc := gob.NewEncoder(&buf)

    // 编码一个值
    data := map[string]int{"foo": 1, "bar": 2}
    err := enc.Encode(data)
    if err != nil {
        fmt.Println("错误:", err)
        return
    }

    fmt.Printf("编码了 %d 字节\n", buf.Len())

    // 解码值
    dec := gob.NewDecoder(&buf)
    var result map[string]int
    err = dec.Decode(&result)
    if err != nil {
        fmt.Println("错误:", err)
        return
    }

    fmt.Println("解码结果:", result) // map[bar:2 foo:1]
}
```

## 核心原理

### 类型编码

Gob 会将类型信息与数据一起传输。首次发送某类型时，会传输其描述信息。后续相同类型的值只需引用该类型定义即可。

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

type Point struct {
    X, Y int
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    // 首次编码：包含类型定义
    p1 := Point{1, 2}
    enc.Encode(p1)
    sizeFirst := buf.Len()

    // 第二次编码：仅数据，类型已知
    p2 := Point{3, 4}
    enc.Encode(p2)
    sizeSecond := buf.Len() - sizeFirst

    fmt.Printf("首次编码: %d 字节\n", sizeFirst)
    fmt.Printf("第二次编码: %d 字节\n", sizeSecond)
    // 第二次编码更小，因为类型信息已经发送过了
}
```

### 结构体字段匹配

Gob 按名称而非位置匹配结构体字段。这允许进行模式演进：

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

// 结构体版本 1
type UserV1 struct {
    Name  string
    Email string
}

// 版本 2 添加了字段
type UserV2 struct {
    Name    string
    Email   string
    Age     int    // 新字段
    Country string // 新字段
}

func main() {
    var buf bytes.Buffer

    // 使用 V1 编码
    enc := gob.NewEncoder(&buf)
    v1 := UserV1{Name: "Alice", Email: "alice@example.com"}
    enc.Encode(v1)

    // 解码到 V2
    dec := gob.NewDecoder(&buf)
    var v2 UserV2
    dec.Decode(&v2)

    fmt.Printf("Name: %s\n", v2.Name)     // Alice
    fmt.Printf("Email: %s\n", v2.Email)   // alice@example.com
    fmt.Printf("Age: %d\n", v2.Age)       // 0 (零值)
    fmt.Printf("Country: %s\n", v2.Country) // "" (零值)
}
```

## 关键概念

### 支持的类型

Gob 支持大多数 Go 类型，但有一些限制：

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    // 基本类型
    enc.Encode(42)
    enc.Encode(3.14)
    enc.Encode("hello")
    enc.Encode(true)

    // 切片和数组
    enc.Encode([]int{1, 2, 3})
    enc.Encode([3]int{4, 5, 6})

    // Map
    enc.Encode(map[string]int{"a": 1})

    // 结构体
    type Data struct {
        Value int
    }
    enc.Encode(Data{Value: 100})

    // 指针（编码为指向的值）
    val := 42
    enc.Encode(&val)

    fmt.Printf("总共编码了 %d 字节\n", buf.Len())
}
```

### 接口的类型注册

编码接口值时，必须注册具体类型：

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

type Shape interface {
    Area() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return 3.14159 * c.Radius * c.Radius
}

type Rectangle struct {
    Width, Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func init() {
    // 注册实现接口的具体类型
    gob.Register(Circle{})
    gob.Register(Rectangle{})
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    // 编码接口值
    shapes := []Shape{
        Circle{Radius: 5},
        Rectangle{Width: 3, Height: 4},
    }
    enc.Encode(shapes)

    // 解码
    dec := gob.NewDecoder(&buf)
    var decoded []Shape
    dec.Decode(&decoded)

    for _, s := range decoded {
        fmt.Printf("类型: %T, 面积: %.2f\n", s, s.Area())
    }
}
```

### 自定义 GobEncoder 和 GobDecoder

实现这些接口以进行自定义序列化：

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
    "time"
)

type Timestamp struct {
    time time.Time
}

// GobEncode 实现 gob.GobEncoder
func (t Timestamp) GobEncode() ([]byte, error) {
    return t.time.MarshalBinary()
}

// GobDecode 实现 gob.GobDecoder
func (t *Timestamp) GobDecode(data []byte) error {
    return t.time.UnmarshalBinary(data)
}

func (t Timestamp) String() string {
    return t.time.Format(time.RFC3339)
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    ts := Timestamp{time: time.Now()}
    enc.Encode(ts)

    dec := gob.NewDecoder(&buf)
    var decoded Timestamp
    dec.Decode(&decoded)

    fmt.Println("原始:", ts)
    fmt.Println("解码:", decoded)
}
```

## 代码示例

### 基于文件的持久化

```go
package main

import (
    "encoding/gob"
    "fmt"
    "os"
)

type Config struct {
    ServerAddr string
    Port       int
    Debug      bool
    Features   []string
}

func saveConfig(filename string, config *Config) error {
    file, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer file.Close()

    encoder := gob.NewEncoder(file)
    return encoder.Encode(config)
}

func loadConfig(filename string) (*Config, error) {
    file, err := os.Open(filename)
    if err != nil {
        return nil, err
    }
    defer file.Close()

    var config Config
    decoder := gob.NewDecoder(file)
    err = decoder.Decode(&config)
    if err != nil {
        return nil, err
    }

    return &config, nil
}

func main() {
    config := &Config{
        ServerAddr: "localhost",
        Port:       8080,
        Debug:      true,
        Features:   []string{"auth", "logging", "metrics"},
    }

    // 保存到文件
    err := saveConfig("config.gob", config)
    if err != nil {
        fmt.Println("保存错误:", err)
        return
    }

    // 从文件加载
    loaded, err := loadConfig("config.gob")
    if err != nil {
        fmt.Println("加载错误:", err)
        return
    }

    fmt.Printf("服务器: %s:%d\n", loaded.ServerAddr, loaded.Port)
    fmt.Printf("调试模式: %v\n", loaded.Debug)
    fmt.Printf("功能: %v\n", loaded.Features)

    // 清理
    os.Remove("config.gob")
}
```

### 网络通信

```go
package main

import (
    "encoding/gob"
    "fmt"
    "net"
    "time"
)

type Message struct {
    ID        int
    Type      string
    Payload   string
    Timestamp time.Time
}

func server(listener net.Listener) {
    conn, err := listener.Accept()
    if err != nil {
        fmt.Println("接受连接错误:", err)
        return
    }
    defer conn.Close()

    decoder := gob.NewDecoder(conn)
    encoder := gob.NewEncoder(conn)

    var msg Message
    err = decoder.Decode(&msg)
    if err != nil {
        fmt.Println("解码错误:", err)
        return
    }

    fmt.Printf("服务器收到: %+v\n", msg)

    // 发送响应
    response := Message{
        ID:        msg.ID,
        Type:      "response",
        Payload:   "消息已收到",
        Timestamp: time.Now(),
    }
    encoder.Encode(response)
}

func client(addr string) {
    conn, err := net.Dial("tcp", addr)
    if err != nil {
        fmt.Println("连接错误:", err)
        return
    }
    defer conn.Close()

    encoder := gob.NewEncoder(conn)
    decoder := gob.NewDecoder(conn)

    // 发送消息
    msg := Message{
        ID:        1,
        Type:      "request",
        Payload:   "你好，服务器！",
        Timestamp: time.Now(),
    }
    encoder.Encode(msg)

    // 接收响应
    var response Message
    decoder.Decode(&response)
    fmt.Printf("客户端收到: %+v\n", response)
}

func main() {
    listener, err := net.Listen("tcp", "localhost:0")
    if err != nil {
        fmt.Println("监听错误:", err)
        return
    }
    defer listener.Close()

    addr := listener.Addr().String()

    go server(listener)
    time.Sleep(100 * time.Millisecond)
    client(addr)
}
```

### 使用 Gob 进行缓存

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
    "sync"
    "time"
)

type CacheItem struct {
    Value     interface{}
    ExpiresAt time.Time
}

type Cache struct {
    mu    sync.RWMutex
    items map[string][]byte
}

func NewCache() *Cache {
    return &Cache{
        items: make(map[string][]byte),
    }
}

func (c *Cache) Set(key string, value interface{}, ttl time.Duration) error {
    item := CacheItem{
        Value:     value,
        ExpiresAt: time.Now().Add(ttl),
    }

    var buf bytes.Buffer
    encoder := gob.NewEncoder(&buf)
    if err := encoder.Encode(item); err != nil {
        return err
    }

    c.mu.Lock()
    c.items[key] = buf.Bytes()
    c.mu.Unlock()

    return nil
}

func (c *Cache) Get(key string, dest interface{}) (bool, error) {
    c.mu.RLock()
    data, exists := c.items[key]
    c.mu.RUnlock()

    if !exists {
        return false, nil
    }

    var item CacheItem
    item.Value = dest // 预设类型用于解码

    decoder := gob.NewDecoder(bytes.NewReader(data))
    if err := decoder.Decode(&item); err != nil {
        return false, err
    }

    if time.Now().After(item.ExpiresAt) {
        c.mu.Lock()
        delete(c.items, key)
        c.mu.Unlock()
        return false, nil
    }

    return true, nil
}

func init() {
    // 注册将被缓存的类型
    gob.Register(map[string]interface{}{})
    gob.Register([]string{})
}

func main() {
    cache := NewCache()

    // 缓存一些数据
    userData := map[string]interface{}{
        "name": "Alice",
        "age":  30,
    }

    cache.Set("user:1", userData, 5*time.Minute)

    // 获取缓存数据
    var result map[string]interface{}
    found, err := cache.Get("user:1", &result)
    if err != nil {
        fmt.Println("错误:", err)
        return
    }

    if found {
        fmt.Println("缓存命中:", result)
    } else {
        fmt.Println("缓存未命中")
    }
}
```

## 最佳实践

### 1. 尽早注册类型

```go
package main

import (
    "encoding/gob"
)

type User struct {
    ID   int
    Name string
}

type Product struct {
    ID    int
    Price float64
}

// 在 init() 中注册所有类型以保持一致性
func init() {
    gob.Register(User{})
    gob.Register(Product{})
    gob.Register([]User{})
    gob.Register(map[string]Product{})
}
```

### 2. 一致地使用指针类型

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

type Data struct {
    Value int
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)
    dec := gob.NewDecoder(&buf)

    // 编码指针
    original := &Data{Value: 42}
    enc.Encode(original)

    // 解码到指针
    var decoded *Data
    dec.Decode(&decoded)

    fmt.Printf("原始: %+v\n", original)
    fmt.Printf("解码: %+v\n", decoded)
}
```

### 3. 正确处理错误

```go
package main

import (
    "bytes"
    "encoding/gob"
    "errors"
    "fmt"
    "io"
)

func decodeAll(data []byte) ([]interface{}, error) {
    decoder := gob.NewDecoder(bytes.NewReader(data))
    var results []interface{}

    for {
        var value interface{}
        err := decoder.Decode(&value)
        if errors.Is(err, io.EOF) {
            break // 正常的流结束
        }
        if err != nil {
            return nil, fmt.Errorf("解码错误: %w", err)
        }
        results = append(results, value)
    }

    return results, nil
}
```

### 4. 为数据结构添加版本控制

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

// 包含版本字段以支持迁移
type Document struct {
    Version int
    // V1 字段
    Title   string
    Content string
    // V2 字段（后来添加）
    Author string
    Tags   []string
}

func migrateDocument(doc *Document) {
    switch doc.Version {
    case 0, 1:
        // 从 v1 迁移到 v2
        if doc.Author == "" {
            doc.Author = "Unknown"
        }
        if doc.Tags == nil {
            doc.Tags = []string{}
        }
        doc.Version = 2
    }
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    // 旧文档 (v1)
    old := Document{Version: 1, Title: "Test", Content: "Hello"}
    enc.Encode(old)

    // 解码并迁移
    dec := gob.NewDecoder(&buf)
    var loaded Document
    dec.Decode(&loaded)
    migrateDocument(&loaded)

    fmt.Printf("迁移后的文档: %+v\n", loaded)
}
```

## 常见陷阱

### 1. 忘记注册接口类型

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

type Animal interface {
    Speak() string
}

type Dog struct {
    Name string
}

func (d Dog) Speak() string { return "汪！" }

func main() {
    // 错误：忘记注册 Dog
    // gob.Register(Dog{}) // 取消注释以修复

    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    var animal Animal = Dog{Name: "Rex"}
    err := enc.Encode(&animal)
    if err != nil {
        fmt.Println("错误:", err) // gob: type not registered for interface: main.Dog
    }
}
```

### 2. 编码 nil 指针

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

type Container struct {
    Data *string
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    // 结构体内的 nil 指针是可以的
    c := Container{Data: nil}
    err := enc.Encode(c)
    if err != nil {
        fmt.Println("错误:", err)
        return
    }

    dec := gob.NewDecoder(&buf)
    var result Container
    dec.Decode(&result)

    fmt.Printf("Data 是 nil: %v\n", result.Data == nil) // true
}
```

### 3. 未导出的字段

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

type Data struct {
    Public  string
    private string // 不会被编码 - 未导出
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    original := Data{Public: "可见", private: "不可见"}
    enc.Encode(original)

    dec := gob.NewDecoder(&buf)
    var decoded Data
    dec.Decode(&decoded)

    fmt.Printf("Public: %s\n", decoded.Public)   // 可见
    fmt.Printf("private: %s\n", decoded.private) // "" (空 - 未编码)
}
```

### 4. 通道和函数类型

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

type BadStruct struct {
    Ch   chan int         // 无法编码
    Fn   func() error     // 无法编码
    Good string           // 可以
}

type GoodStruct struct {
    Good string
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    // 这会失败
    bad := BadStruct{Good: "test"}
    err := enc.Encode(bad)
    if err != nil {
        fmt.Println("通道/函数错误:", err)
    }

    // 这可以工作
    good := GoodStruct{Good: "test"}
    err = enc.Encode(good)
    if err != nil {
        fmt.Println("错误:", err)
    } else {
        fmt.Println("编码成功")
    }
}
```

## 性能考虑

### 编码器/解码器重用

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
    "time"
)

type Item struct {
    ID   int
    Data string
}

func benchmarkNewEncoder(items []Item) time.Duration {
    start := time.Now()
    for _, item := range items {
        var buf bytes.Buffer
        enc := gob.NewEncoder(&buf)
        enc.Encode(item)
    }
    return time.Since(start)
}

func benchmarkReuseEncoder(items []Item) time.Duration {
    start := time.Now()
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)
    for _, item := range items {
        buf.Reset()
        enc.Encode(item)
    }
    return time.Since(start)
}

func main() {
    items := make([]Item, 10000)
    for i := range items {
        items[i] = Item{ID: i, Data: "测试数据"}
    }

    newEnc := benchmarkNewEncoder(items)
    reuseEnc := benchmarkReuseEncoder(items)

    fmt.Printf("每次新建编码器: %v\n", newEnc)
    fmt.Printf("重用编码器: %v\n", reuseEnc)
    fmt.Printf("加速比: %.2fx\n", float64(newEnc)/float64(reuseEnc))
}
```

### 与 JSON 的比较

```go
package main

import (
    "bytes"
    "encoding/gob"
    "encoding/json"
    "fmt"
)

type Record struct {
    ID        int
    Name      string
    Email     string
    Age       int
    Active    bool
    Tags      []string
    Metadata  map[string]string
}

func main() {
    record := Record{
        ID:       1,
        Name:     "Alice Johnson",
        Email:    "alice@example.com",
        Age:      30,
        Active:   true,
        Tags:     []string{"admin", "developer", "tester"},
        Metadata: map[string]string{"dept": "工程部", "level": "高级"},
    }

    // JSON 编码
    jsonData, _ := json.Marshal(record)

    // Gob 编码
    var gobBuf bytes.Buffer
    gob.NewEncoder(&gobBuf).Encode(record)

    fmt.Printf("JSON 大小: %d 字节\n", len(jsonData))
    fmt.Printf("Gob 大小: %d 字节\n", gobBuf.Len())

    // 注意：首次 gob 编码包含类型信息
    // 相同类型的后续编码会更小
    gobBuf.Reset()
    enc := gob.NewEncoder(&gobBuf)
    enc.Encode(record)
    first := gobBuf.Len()
    enc.Encode(record)
    second := gobBuf.Len() - first

    fmt.Printf("Gob 首次编码: %d 字节\n", first)
    fmt.Printf("Gob 第二次编码: %d 字节\n", second)
}
```

### 缓冲区内存池

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
    "sync"
)

var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

type Encoder struct {
    pool *sync.Pool
}

func NewPooledEncoder() *Encoder {
    return &Encoder{pool: &bufferPool}
}

func (e *Encoder) Encode(v interface{}) ([]byte, error) {
    buf := e.pool.Get().(*bytes.Buffer)
    buf.Reset()
    defer e.pool.Put(buf)

    enc := gob.NewEncoder(buf)
    if err := enc.Encode(v); err != nil {
        return nil, err
    }

    // 复制一份，因为我们要把缓冲区归还到池中
    result := make([]byte, buf.Len())
    copy(result, buf.Bytes())
    return result, nil
}

func main() {
    encoder := NewPooledEncoder()

    data := map[string]int{"a": 1, "b": 2}
    encoded, err := encoder.Encode(data)
    if err != nil {
        fmt.Println("错误:", err)
        return
    }

    fmt.Printf("编码了 %d 字节\n", len(encoded))
}
```

## 实际场景

### RPC 系统

```go
package main

import (
    "encoding/gob"
    "fmt"
    "net"
    "reflect"
)

// Request 表示 RPC 请求
type Request struct {
    ServiceMethod string
    Seq           uint64
    Args          interface{}
}

// Response 表示 RPC 响应
type Response struct {
    ServiceMethod string
    Seq           uint64
    Error         string
    Reply         interface{}
}

// 注册常用类型
func init() {
    gob.Register(map[string]interface{}{})
    gob.Register([]interface{}{})
}

// SimpleRPCServer 处理 RPC 请求
type SimpleRPCServer struct {
    services map[string]interface{}
}

func NewRPCServer() *SimpleRPCServer {
    return &SimpleRPCServer{
        services: make(map[string]interface{}),
    }
}

func (s *SimpleRPCServer) Register(name string, service interface{}) {
    s.services[name] = service
}

func (s *SimpleRPCServer) HandleConnection(conn net.Conn) {
    defer conn.Close()

    decoder := gob.NewDecoder(conn)
    encoder := gob.NewEncoder(conn)

    for {
        var req Request
        if err := decoder.Decode(&req); err != nil {
            return
        }

        resp := Response{
            ServiceMethod: req.ServiceMethod,
            Seq:           req.Seq,
        }

        // 简单的方法分发（实际中使用反射）
        if req.ServiceMethod == "Math.Add" {
            args := req.Args.(map[string]interface{})
            a := int(args["a"].(int64))
            b := int(args["b"].(int64))
            resp.Reply = a + b
        } else {
            resp.Error = "未知方法"
        }

        encoder.Encode(resp)
    }
}

func main() {
    // 为 gob 注册 int64
    gob.Register(int64(0))

    fmt.Println("使用 gob 编码的 RPC 系统")
    fmt.Println("Request 和 Response 类型都是 gob 编码的")

    // 演示编码
    req := Request{
        ServiceMethod: "Math.Add",
        Seq:           1,
        Args:          map[string]interface{}{"a": int64(5), "b": int64(3)},
    }

    fmt.Printf("请求: %+v\n", req)
    fmt.Printf("Args 的类型: %v\n", reflect.TypeOf(req.Args))
}
```

### 会话存储

```go
package main

import (
    "bytes"
    "crypto/rand"
    "encoding/gob"
    "encoding/hex"
    "fmt"
    "sync"
    "time"
)

type Session struct {
    ID        string
    UserID    int
    Data      map[string]interface{}
    CreatedAt time.Time
    ExpiresAt time.Time
}

type SessionStore struct {
    mu       sync.RWMutex
    sessions map[string][]byte
}

func NewSessionStore() *SessionStore {
    return &SessionStore{
        sessions: make(map[string][]byte),
    }
}

func (s *SessionStore) generateID() string {
    b := make([]byte, 16)
    rand.Read(b)
    return hex.EncodeToString(b)
}

func (s *SessionStore) Create(userID int, ttl time.Duration) (*Session, error) {
    session := &Session{
        ID:        s.generateID(),
        UserID:    userID,
        Data:      make(map[string]interface{}),
        CreatedAt: time.Now(),
        ExpiresAt: time.Now().Add(ttl),
    }

    var buf bytes.Buffer
    if err := gob.NewEncoder(&buf).Encode(session); err != nil {
        return nil, err
    }

    s.mu.Lock()
    s.sessions[session.ID] = buf.Bytes()
    s.mu.Unlock()

    return session, nil
}

func (s *SessionStore) Get(id string) (*Session, error) {
    s.mu.RLock()
    data, exists := s.sessions[id]
    s.mu.RUnlock()

    if !exists {
        return nil, fmt.Errorf("会话未找到")
    }

    var session Session
    if err := gob.NewDecoder(bytes.NewReader(data)).Decode(&session); err != nil {
        return nil, err
    }

    if time.Now().After(session.ExpiresAt) {
        s.Delete(id)
        return nil, fmt.Errorf("会话已过期")
    }

    return &session, nil
}

func (s *SessionStore) Update(session *Session) error {
    var buf bytes.Buffer
    if err := gob.NewEncoder(&buf).Encode(session); err != nil {
        return err
    }

    s.mu.Lock()
    s.sessions[session.ID] = buf.Bytes()
    s.mu.Unlock()

    return nil
}

func (s *SessionStore) Delete(id string) {
    s.mu.Lock()
    delete(s.sessions, id)
    s.mu.Unlock()
}

func init() {
    gob.Register(map[string]interface{}{})
}

func main() {
    store := NewSessionStore()

    // 创建会话
    session, err := store.Create(123, 24*time.Hour)
    if err != nil {
        fmt.Println("错误:", err)
        return
    }

    // 在会话中存储数据
    session.Data["role"] = "admin"
    session.Data["preferences"] = map[string]interface{}{
        "theme": "dark",
        "lang":  "zh",
    }
    store.Update(session)

    // 获取会话
    retrieved, err := store.Get(session.ID)
    if err != nil {
        fmt.Println("错误:", err)
        return
    }

    fmt.Printf("会话 ID: %s\n", retrieved.ID)
    fmt.Printf("用户 ID: %d\n", retrieved.UserID)
    fmt.Printf("数据: %v\n", retrieved.Data)
    fmt.Printf("过期时间: %v\n", retrieved.ExpiresAt)
}
```

## 面试要点

1. **何时使用 gob 而非 JSON**：
   - Go 程序间通信时使用 gob（通信双方都是同一语言）
   - 需要与其他语言互操作时使用 JSON
   - Gob 更高效但不可人工阅读

2. **类型注册**：
   - 接口类型必须注册
   - 在 `init()` 函数中使用 `gob.Register()`
   - 注册具体类型，而非接口

3. **模式演进**：
   - Gob 支持添加新字段（它们会获得零值）
   - 删除字段是安全的（多余数据会被忽略）
   - 更改字段类型是不安全的

4. **性能特征**：
   - 首次编码包含类型信息
   - 相同类型的后续编码更小
   - 重用编码器/解码器可提高性能

5. **限制**：
   - 无法编码通道或函数
   - 仅编码导出的字段
   - 不适合跨语言通信

## 延伸阅读

- [Go 文档：encoding/gob](https://pkg.go.dev/encoding/gob)
- [Gobs of Data - Go 博客](https://blog.golang.org/gob)
- [Effective Go：接口](https://golang.org/doc/effective_go#interfaces)
- [Go RPC 包](https://pkg.go.dev/net/rpc)
- [二进制序列化格式比较](https://github.com/alecthomas/go_serialization_benchmarks)
