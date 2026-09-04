---
title: encoding/gob Serialization
description: Complete guide to Go gob encoding, binary serialization for Go-to-Go communication, and efficient data interchange
track: go
section: stdlib
difficulty: intermediate
tags:
  - Go
  - gob
  - Serialization
  - Binary
  - RPC
status: imported
origin: old/src/content/docs/go/encoding-gob.en.md
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

The `encoding/gob` package provides a powerful binary serialization format designed specifically for Go. Unlike JSON or XML, gob is optimized for Go-to-Go communication, making it ideal for RPC systems, caching, and persistent storage where both ends are Go programs.

## Concept Explanation

Gob (short for "Go binary") is a self-describing binary format that efficiently encodes Go data structures. It was designed with several goals in mind:

- **Efficiency**: Binary format is more compact than text-based formats
- **Type Safety**: Preserves Go's type system during serialization
- **Self-Describing**: The stream contains type information
- **Streaming**: Supports encoding multiple values in sequence

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

func main() {
    // Create a buffer to hold the encoded data
    var buf bytes.Buffer

    // Create an encoder
    enc := gob.NewEncoder(&buf)

    // Encode a value
    data := map[string]int{"foo": 1, "bar": 2}
    err := enc.Encode(data)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Printf("Encoded %d bytes\n", buf.Len())

    // Decode the value
    dec := gob.NewDecoder(&buf)
    var result map[string]int
    err = dec.Decode(&result)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println("Decoded:", result) // map[bar:2 foo:1]
}
```

## Core Principles

### Type Encoding

Gob transmits type information along with data. The first time a type is sent, its description is transmitted. Subsequent values of the same type only need to reference the type definition.

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

    // First encode: includes type definition
    p1 := Point{1, 2}
    enc.Encode(p1)
    sizeFirst := buf.Len()

    // Second encode: only data, type already known
    p2 := Point{3, 4}
    enc.Encode(p2)
    sizeSecond := buf.Len() - sizeFirst

    fmt.Printf("First encode: %d bytes\n", sizeFirst)
    fmt.Printf("Second encode: %d bytes\n", sizeSecond)
    // Second encode is smaller because type info was already sent
}
```

### Struct Field Matching

Gob matches struct fields by name, not by position. This allows for schema evolution:

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

// Version 1 of the struct
type UserV1 struct {
    Name  string
    Email string
}

// Version 2 adds a field
type UserV2 struct {
    Name    string
    Email   string
    Age     int    // New field
    Country string // New field
}

func main() {
    var buf bytes.Buffer

    // Encode with V1
    enc := gob.NewEncoder(&buf)
    v1 := UserV1{Name: "Alice", Email: "alice@example.com"}
    enc.Encode(v1)

    // Decode into V2
    dec := gob.NewDecoder(&buf)
    var v2 UserV2
    dec.Decode(&v2)

    fmt.Printf("Name: %s\n", v2.Name)     // Alice
    fmt.Printf("Email: %s\n", v2.Email)   // alice@example.com
    fmt.Printf("Age: %d\n", v2.Age)       // 0 (zero value)
    fmt.Printf("Country: %s\n", v2.Country) // "" (zero value)
}
```

## Key Concepts

### Supported Types

Gob supports most Go types with some limitations:

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

    // Basic types
    enc.Encode(42)
    enc.Encode(3.14)
    enc.Encode("hello")
    enc.Encode(true)

    // Slices and arrays
    enc.Encode([]int{1, 2, 3})
    enc.Encode([3]int{4, 5, 6})

    // Maps
    enc.Encode(map[string]int{"a": 1})

    // Structs
    type Data struct {
        Value int
    }
    enc.Encode(Data{Value: 100})

    // Pointers (encoded as the pointed-to value)
    val := 42
    enc.Encode(&val)

    fmt.Printf("Encoded %d bytes total\n", buf.Len())
}
```

### Type Registration for Interfaces

When encoding interface values, you must register the concrete types:

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
    // Register concrete types that implement the interface
    gob.Register(Circle{})
    gob.Register(Rectangle{})
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    // Encode interface values
    shapes := []Shape{
        Circle{Radius: 5},
        Rectangle{Width: 3, Height: 4},
    }
    enc.Encode(shapes)

    // Decode
    dec := gob.NewDecoder(&buf)
    var decoded []Shape
    dec.Decode(&decoded)

    for _, s := range decoded {
        fmt.Printf("Type: %T, Area: %.2f\n", s, s.Area())
    }
}
```

### Custom GobEncoder and GobDecoder

Implement these interfaces for custom serialization:

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

// GobEncode implements gob.GobEncoder
func (t Timestamp) GobEncode() ([]byte, error) {
    return t.time.MarshalBinary()
}

// GobDecode implements gob.GobDecoder
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

    fmt.Println("Original:", ts)
    fmt.Println("Decoded:", decoded)
}
```

## Code Examples

### File-based Persistence

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

    // Save to file
    err := saveConfig("config.gob", config)
    if err != nil {
        fmt.Println("Save error:", err)
        return
    }

    // Load from file
    loaded, err := loadConfig("config.gob")
    if err != nil {
        fmt.Println("Load error:", err)
        return
    }

    fmt.Printf("Server: %s:%d\n", loaded.ServerAddr, loaded.Port)
    fmt.Printf("Debug: %v\n", loaded.Debug)
    fmt.Printf("Features: %v\n", loaded.Features)

    // Cleanup
    os.Remove("config.gob")
}
```

### Network Communication

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
        fmt.Println("Accept error:", err)
        return
    }
    defer conn.Close()

    decoder := gob.NewDecoder(conn)
    encoder := gob.NewEncoder(conn)

    var msg Message
    err = decoder.Decode(&msg)
    if err != nil {
        fmt.Println("Decode error:", err)
        return
    }

    fmt.Printf("Server received: %+v\n", msg)

    // Send response
    response := Message{
        ID:        msg.ID,
        Type:      "response",
        Payload:   "Message received",
        Timestamp: time.Now(),
    }
    encoder.Encode(response)
}

func client(addr string) {
    conn, err := net.Dial("tcp", addr)
    if err != nil {
        fmt.Println("Dial error:", err)
        return
    }
    defer conn.Close()

    encoder := gob.NewEncoder(conn)
    decoder := gob.NewDecoder(conn)

    // Send message
    msg := Message{
        ID:        1,
        Type:      "request",
        Payload:   "Hello, server!",
        Timestamp: time.Now(),
    }
    encoder.Encode(msg)

    // Receive response
    var response Message
    decoder.Decode(&response)
    fmt.Printf("Client received: %+v\n", response)
}

func main() {
    listener, err := net.Listen("tcp", "localhost:0")
    if err != nil {
        fmt.Println("Listen error:", err)
        return
    }
    defer listener.Close()

    addr := listener.Addr().String()

    go server(listener)
    time.Sleep(100 * time.Millisecond)
    client(addr)
}
```

### Caching with Gob

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
    item.Value = dest // Pre-set the type for decoding

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
    // Register types that will be cached
    gob.Register(map[string]interface{}{})
    gob.Register([]string{})
}

func main() {
    cache := NewCache()

    // Cache some data
    userData := map[string]interface{}{
        "name": "Alice",
        "age":  30,
    }

    cache.Set("user:1", userData, 5*time.Minute)

    // Retrieve cached data
    var result map[string]interface{}
    found, err := cache.Get("user:1", &result)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    if found {
        fmt.Println("Cache hit:", result)
    } else {
        fmt.Println("Cache miss")
    }
}
```

## Best Practices

### 1. Register Types Early

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

// Register all types in init() for consistency
func init() {
    gob.Register(User{})
    gob.Register(Product{})
    gob.Register([]User{})
    gob.Register(map[string]Product{})
}
```

### 2. Use Pointer Types Consistently

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

    // Encode pointer
    original := &Data{Value: 42}
    enc.Encode(original)

    // Decode into pointer
    var decoded *Data
    dec.Decode(&decoded)

    fmt.Printf("Original: %+v\n", original)
    fmt.Printf("Decoded: %+v\n", decoded)
}
```

### 3. Handle Errors Properly

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
            break // Normal end of stream
        }
        if err != nil {
            return nil, fmt.Errorf("decode error: %w", err)
        }
        results = append(results, value)
    }

    return results, nil
}
```

### 4. Version Your Data Structures

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

// Include version field for migration support
type Document struct {
    Version int
    // V1 fields
    Title   string
    Content string
    // V2 fields (added later)
    Author string
    Tags   []string
}

func migrateDocument(doc *Document) {
    switch doc.Version {
    case 0, 1:
        // Migration from v1 to v2
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

    // Old document (v1)
    old := Document{Version: 1, Title: "Test", Content: "Hello"}
    enc.Encode(old)

    // Decode and migrate
    dec := gob.NewDecoder(&buf)
    var loaded Document
    dec.Decode(&loaded)
    migrateDocument(&loaded)

    fmt.Printf("Migrated document: %+v\n", loaded)
}
```

## Common Pitfalls

### 1. Forgetting to Register Interface Types

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

func (d Dog) Speak() string { return "Woof!" }

func main() {
    // WRONG: Forgot to register Dog
    // gob.Register(Dog{}) // Uncomment to fix

    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    var animal Animal = Dog{Name: "Rex"}
    err := enc.Encode(&animal)
    if err != nil {
        fmt.Println("Error:", err) // gob: type not registered for interface: main.Dog
    }
}
```

### 2. Encoding Nil Pointers

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

    // nil pointer inside struct is OK
    c := Container{Data: nil}
    err := enc.Encode(c)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    dec := gob.NewDecoder(&buf)
    var result Container
    dec.Decode(&result)

    fmt.Printf("Data is nil: %v\n", result.Data == nil) // true
}
```

### 3. Unexported Fields

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

type Data struct {
    Public  string
    private string // NOT encoded - unexported
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    original := Data{Public: "visible", private: "invisible"}
    enc.Encode(original)

    dec := gob.NewDecoder(&buf)
    var decoded Data
    dec.Decode(&decoded)

    fmt.Printf("Public: %s\n", decoded.Public)   // visible
    fmt.Printf("private: %s\n", decoded.private) // "" (empty - not encoded)
}
```

### 4. Channel and Function Types

```go
package main

import (
    "bytes"
    "encoding/gob"
    "fmt"
)

type BadStruct struct {
    Ch   chan int         // Cannot encode
    Fn   func() error     // Cannot encode
    Good string           // OK
}

type GoodStruct struct {
    Good string
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    // This will fail
    bad := BadStruct{Good: "test"}
    err := enc.Encode(bad)
    if err != nil {
        fmt.Println("Error with channels/functions:", err)
    }

    // This works
    good := GoodStruct{Good: "test"}
    err = enc.Encode(good)
    if err != nil {
        fmt.Println("Error:", err)
    } else {
        fmt.Println("Encoded successfully")
    }
}
```

## Performance Considerations

### Encoder/Decoder Reuse

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
        items[i] = Item{ID: i, Data: "test data"}
    }

    newEnc := benchmarkNewEncoder(items)
    reuseEnc := benchmarkReuseEncoder(items)

    fmt.Printf("New encoder each time: %v\n", newEnc)
    fmt.Printf("Reused encoder: %v\n", reuseEnc)
    fmt.Printf("Speedup: %.2fx\n", float64(newEnc)/float64(reuseEnc))
}
```

### Comparison with JSON

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
        Metadata: map[string]string{"dept": "Engineering", "level": "Senior"},
    }

    // JSON encoding
    jsonData, _ := json.Marshal(record)

    // Gob encoding
    var gobBuf bytes.Buffer
    gob.NewEncoder(&gobBuf).Encode(record)

    fmt.Printf("JSON size: %d bytes\n", len(jsonData))
    fmt.Printf("Gob size: %d bytes\n", gobBuf.Len())

    // Note: First gob encoding includes type info
    // Subsequent encodings of same type are smaller
    gobBuf.Reset()
    enc := gob.NewEncoder(&gobBuf)
    enc.Encode(record)
    first := gobBuf.Len()
    enc.Encode(record)
    second := gobBuf.Len() - first

    fmt.Printf("Gob first encode: %d bytes\n", first)
    fmt.Printf("Gob second encode: %d bytes\n", second)
}
```

### Memory Pool for Buffers

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

    // Make a copy since we're returning the buffer to the pool
    result := make([]byte, buf.Len())
    copy(result, buf.Bytes())
    return result, nil
}

func main() {
    encoder := NewPooledEncoder()

    data := map[string]int{"a": 1, "b": 2}
    encoded, err := encoder.Encode(data)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Printf("Encoded %d bytes\n", len(encoded))
}
```

## Real-World Scenarios

### RPC System

```go
package main

import (
    "encoding/gob"
    "fmt"
    "net"
    "reflect"
)

// Request represents an RPC request
type Request struct {
    ServiceMethod string
    Seq           uint64
    Args          interface{}
}

// Response represents an RPC response
type Response struct {
    ServiceMethod string
    Seq           uint64
    Error         string
    Reply         interface{}
}

// Register common types
func init() {
    gob.Register(map[string]interface{}{})
    gob.Register([]interface{}{})
}

// SimpleRPCServer handles RPC requests
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

        // Simple method dispatch (in practice, use reflection)
        if req.ServiceMethod == "Math.Add" {
            args := req.Args.(map[string]interface{})
            a := int(args["a"].(int64))
            b := int(args["b"].(int64))
            resp.Reply = a + b
        } else {
            resp.Error = "unknown method"
        }

        encoder.Encode(resp)
    }
}

func main() {
    // Register int64 for gob
    gob.Register(int64(0))

    fmt.Println("RPC system using gob encoding")
    fmt.Println("Request and Response types are gob-encoded")

    // Demonstrate encoding
    req := Request{
        ServiceMethod: "Math.Add",
        Seq:           1,
        Args:          map[string]interface{}{"a": int64(5), "b": int64(3)},
    }

    fmt.Printf("Request: %+v\n", req)
    fmt.Printf("Type of Args: %v\n", reflect.TypeOf(req.Args))
}
```

### Session Store

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
        return nil, fmt.Errorf("session not found")
    }

    var session Session
    if err := gob.NewDecoder(bytes.NewReader(data)).Decode(&session); err != nil {
        return nil, err
    }

    if time.Now().After(session.ExpiresAt) {
        s.Delete(id)
        return nil, fmt.Errorf("session expired")
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

    // Create session
    session, err := store.Create(123, 24*time.Hour)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    // Store data in session
    session.Data["role"] = "admin"
    session.Data["preferences"] = map[string]interface{}{
        "theme": "dark",
        "lang":  "en",
    }
    store.Update(session)

    // Retrieve session
    retrieved, err := store.Get(session.ID)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Printf("Session ID: %s\n", retrieved.ID)
    fmt.Printf("User ID: %d\n", retrieved.UserID)
    fmt.Printf("Data: %v\n", retrieved.Data)
    fmt.Printf("Expires: %v\n", retrieved.ExpiresAt)
}
```

## Interview Key Points

1. **When to use gob vs JSON**:
   - Use gob for Go-to-Go communication (same language on both ends)
   - Use JSON for interoperability with other languages
   - Gob is more efficient but not human-readable

2. **Type registration**:
   - Required for interface types
   - Use `gob.Register()` in `init()` functions
   - Register the concrete type, not the interface

3. **Schema evolution**:
   - Gob supports adding new fields (they get zero values)
   - Removing fields is safe (extra data is ignored)
   - Changing field types is NOT safe

4. **Performance characteristics**:
   - First encode includes type information
   - Subsequent encodes of same type are smaller
   - Reusing encoders/decoders improves performance

5. **Limitations**:
   - Cannot encode channels or functions
   - Only exported fields are encoded
   - Not suitable for cross-language communication

## Further Reading

- [Go Documentation: encoding/gob](https://pkg.go.dev/encoding/gob)
- [Gobs of Data - Go Blog](https://blog.golang.org/gob)
- [Effective Go: Interfaces](https://golang.org/doc/effective_go#interfaces)
- [Go RPC Package](https://pkg.go.dev/net/rpc)
- [Binary Serialization Formats Comparison](https://github.com/alecthomas/go_serialization_benchmarks)
