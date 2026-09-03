---
title: JSON Handling
description: Complete guide to Go JSON, encoding/json package, struct tags and custom serialization
track: go
section: stdlib
difficulty: beginner
tags:
  - Go
  - JSON
  - Serialization
  - API
status: imported
origin: old/src/content/docs/go/json.en.md
divergence: 0.207
issues: []
legacy:
  category: Go
  subcategory: Standard Library
  order: 12
  lastUpdated: 2026-01-07
---

JSON (JavaScript Object Notation) is the de facto standard for data interchange in web applications and APIs. Go provides excellent built-in support for JSON through the `encoding/json` package, offering both simplicity for common use cases and flexibility for advanced scenarios. We cover everything you need to know about working with JSON in Go.

## The encoding/json Package

The `encoding/json` package provides functions for encoding Go values to JSON and decoding JSON into Go values. The two primary operations are:

- **Marshal**: Convert Go values to JSON bytes
- **Unmarshal**: Convert JSON bytes to Go values

```go
package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    // Simple marshal example
    data := map[string]string{"hello": "world"}

    jsonBytes, err := json.Marshal(data)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println(string(jsonBytes))  // {"hello":"world"}
}
```

## Basic Marshaling (Encoding)

Marshaling converts Go data structures into JSON format.

### Marshaling Basic Types

```go
package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    // String
    strJSON, _ := json.Marshal("hello")
    fmt.Println(string(strJSON))  // "hello"

    // Number
    numJSON, _ := json.Marshal(42)
    fmt.Println(string(numJSON))  // 42

    // Boolean
    boolJSON, _ := json.Marshal(true)
    fmt.Println(string(boolJSON))  // true

    // Nil becomes null
    var ptr *int
    nilJSON, _ := json.Marshal(ptr)
    fmt.Println(string(nilJSON))  // null

    // Slice
    sliceJSON, _ := json.Marshal([]int{1, 2, 3})
    fmt.Println(string(sliceJSON))  // [1,2,3]

    // Map
    mapJSON, _ := json.Marshal(map[string]int{"a": 1, "b": 2})
    fmt.Println(string(mapJSON))  // {"a":1,"b":2}
}
```

### Marshaling Structs

Structs are the most common type to marshal. By default, exported field names become JSON keys:

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

### Pretty Printing with MarshalIndent

For human-readable output, use `json.MarshalIndent`:

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

    // Second argument is prefix, third is indent
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

## Basic Unmarshaling (Decoding)

Unmarshaling converts JSON data into Go values.

### Unmarshaling into Structs

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

### Unmarshaling into Maps

When the JSON structure is unknown or dynamic, use maps:

```go
package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    jsonData := `{"name":"Alice","age":30,"active":true}`

    // map[string]interface{} for arbitrary JSON
    var data map[string]interface{}
    err := json.Unmarshal([]byte(jsonData), &data)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    fmt.Println("Name:", data["name"])
    fmt.Println("Age:", data["age"])
    fmt.Println("Active:", data["active"])

    // Type assertions for specific types
    if name, ok := data["name"].(string); ok {
        fmt.Println("Name (string):", name)
    }

    // Note: JSON numbers become float64 by default
    if age, ok := data["age"].(float64); ok {
        fmt.Println("Age (int):", int(age))
    }
}
```

### Unmarshaling Arrays

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

## Struct Tags

Struct tags control how fields are encoded and decoded. They are the key to fine-tuning JSON behavior.

### Basic Field Naming

Use the `json` tag to specify JSON key names:

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

### The omitempty Option

The `omitempty` option omits fields with zero values from the JSON output:

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
    // Full profile
    full := Profile{
        Name:     "Alice",
        Bio:      "Software developer",
        Age:      30,
        Verified: true,
        Website:  "https://alice.dev",
    }

    // Minimal profile (empty fields omitted)
    minimal := Profile{
        Name: "Bob",
    }

    fullJSON, _ := json.MarshalIndent(full, "", "  ")
    minimalJSON, _ := json.MarshalIndent(minimal, "", "  ")

    fmt.Println("Full profile:")
    fmt.Println(string(fullJSON))
    // {
    //   "name": "Alice",
    //   "bio": "Software developer",
    //   "age": 30,
    //   "verified": true,
    //   "website": "https://alice.dev"
    // }

    fmt.Println("\nMinimal profile:")
    fmt.Println(string(minimalJSON))
    // {
    //   "name": "Bob"
    // }
}
```

### Ignoring Fields

Use `-` to completely ignore a field:

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Account struct {
    Username     string `json:"username"`
    Email        string `json:"email"`
    Password     string `json:"-"`           // Never include in JSON
    PasswordHash string `json:"-"`           // Never include in JSON
    InternalID   int    `json:"-"`           // Never include in JSON
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

### String Encoding for Numbers

Force numeric fields to be encoded as strings:

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
        ID:       9007199254740993,  // Large number that might lose precision in JS
        Price:    19.99,
        Quantity: 5,
    }

    jsonBytes, _ := json.Marshal(item)
    fmt.Println(string(jsonBytes))
    // {"id":"9007199254740993","price":"19.99","quantity":"5"}
}
```

### Embedded Structs

Embedded structs are flattened in JSON by default:

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
    Timestamps      // Embedded - fields are promoted
}

func main() {
    article := Article{
        ID:      1,
        Title:   "Go JSON Guide",
        Content: "Learn JSON handling in Go...",
        Timestamps: Timestamps{
            CreatedAt: time.Now(),
            UpdatedAt: time.Now(),
        },
    }

    jsonBytes, _ := json.MarshalIndent(article, "", "  ")
    fmt.Println(string(jsonBytes))
    // {
    //   "id": 1,
    //   "title": "Go JSON Guide",
    //   "content": "Learn JSON handling in Go...",
    //   "created_at": "2024-01-15T10:30:00Z",
    //   "updated_at": "2024-01-15T10:30:00Z"
    // }
}
```

## Custom Marshaler and Unmarshaler

Implement `json.Marshaler` and `json.Unmarshaler` interfaces for complete control over serialization.

### Custom Marshaler

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

// MarshalJSON implements json.Marshaler
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

### Custom Unmarshaler

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

// UnmarshalJSON implements json.Unmarshaler
func (ft *FlexibleTime) UnmarshalJSON(data []byte) error {
    // Remove quotes
    s := strings.Trim(string(data), `"`)

    // Try different formats
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

### Custom Type Example: Status Enum

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

`json.RawMessage` allows you to delay JSON parsing or pass through JSON data unchanged.

### Deferring JSON Parsing

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

        // Parse payload based on type
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

### Preserving Unknown Fields

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Config struct {
    Name     string          `json:"name"`
    Version  string          `json:"version"`
    Settings json.RawMessage `json:"settings"` // Preserve as-is
}

func main() {
    // Original JSON with complex settings
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

    // Modify known fields
    config.Version = "1.1.0"

    // Settings are preserved unchanged
    output, _ := json.MarshalIndent(config, "", "  ")
    fmt.Println(string(output))
}
```

### Building Dynamic JSON

```go
package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    // Pre-encoded JSON fragments
    userJSON := json.RawMessage(`{"id":1,"name":"Alice"}`)
    metaJSON := json.RawMessage(`{"version":"1.0","timestamp":"2024-01-15T10:00:00Z"}`)

    response := map[string]interface{}{
        "success": true,
        "user":    userJSON,
        "meta":    metaJSON,
    }

    output, _ := json.MarshalIndent(response, "", "  ")
    fmt.Println(string(output))
    // {
    //   "meta": {"version":"1.0","timestamp":"2024-01-15T10:00:00Z"},
    //   "success": true,
    //   "user": {"id":1,"name":"Alice"}
    // }
}
```

## Streaming JSON with Encoder and Decoder

For working with streams (files, network connections), use `json.Encoder` and `json.Decoder`.

### Encoding to a Writer

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
    // Encode to stdout
    encoder := json.NewEncoder(os.Stdout)
    encoder.SetIndent("", "  ")

    entry := LogEntry{Level: "info", Message: "Application started"}
    encoder.Encode(entry)

    // Encode to a buffer
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

    fmt.Println("\nBuffer contents:")
    fmt.Println(buf.String())
}
```

### Decoding from a Reader

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
    // Multiple JSON objects (newline-delimited JSON / NDJSON)
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

### Streaming from HTTP Response

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

### Writing JSON to a File

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

    fmt.Println("Settings saved to settings.json")
}
```

### Reading JSON from a File

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

## Handling Null and Optional Values

### Using Pointers for Optional Fields

```go
package main

import (
    "encoding/json"
    "fmt"
)

type UserProfile struct {
    Name     string  `json:"name"`
    Bio      *string `json:"bio"`       // Can be null
    Age      *int    `json:"age"`       // Can be null
    Verified *bool   `json:"verified"`  // Can be null
}

func main() {
    // JSON with null values
    jsonData := `{"name":"Alice","bio":null,"age":30,"verified":null}`

    var profile UserProfile
    json.Unmarshal([]byte(jsonData), &profile)

    fmt.Println("Name:", profile.Name)

    if profile.Bio != nil {
        fmt.Println("Bio:", *profile.Bio)
    } else {
        fmt.Println("Bio: (not set)")
    }

    if profile.Age != nil {
        fmt.Println("Age:", *profile.Age)
    } else {
        fmt.Println("Age: (not set)")
    }

    if profile.Verified != nil {
        fmt.Println("Verified:", *profile.Verified)
    } else {
        fmt.Println("Verified: (not set)")
    }
}
```

### Distinguishing Absent vs Null Fields

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
        `{"title":"Doc 1"}`,                          // description absent
        `{"title":"Doc 2","description":null}`,       // description explicitly null
        `{"title":"Doc 3","description":"Some text"}`, // description has value
    }

    for _, jsonData := range testCases {
        var doc Document
        json.Unmarshal([]byte(jsonData), &doc)

        fmt.Printf("Title: %s\n", doc.Title)
        if !doc.Description.IsSet {
            fmt.Println("  Description: (absent)")
        } else if doc.Description.IsNull {
            fmt.Println("  Description: (null)")
        } else {
            fmt.Printf("  Description: %s\n", doc.Description.Value)
        }
        fmt.Println()
    }
}
```

## Validation and Error Handling

### Handling Unmarshal Errors

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
                fmt.Printf("%s: syntax error at position %d\n", tc.name, e.Offset)
            case *json.UnmarshalTypeError:
                fmt.Printf("%s: type error for field %s (expected %s, got %s)\n",
                    tc.name, e.Field, e.Type, e.Value)
            default:
                fmt.Printf("%s: %v\n", tc.name, err)
            }
        } else {
            fmt.Printf("%s: parsed successfully - %+v\n", tc.name, user)
        }
    }
}
```

### Strict Unmarshaling with DisallowUnknownFields

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
    // JSON with unknown field
    jsonData := `{"name":"myapp","version":"1.0","unknown_field":"value"}`

    // Standard unmarshal (ignores unknown fields)
    var config1 Config
    json.Unmarshal([]byte(jsonData), &config1)
    fmt.Printf("Standard: %+v\n", config1)

    // Strict unmarshal (errors on unknown fields)
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

### Validating JSON Structure

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

## Performance Tips

### Use Decoder for Large Files

For large JSON files, use `json.Decoder` to stream data instead of loading everything into memory:

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

    // Read opening bracket
    if _, err := decoder.Token(); err != nil {
        return err
    }

    // Process items one by one
    for decoder.More() {
        var record Record
        if err := decoder.Decode(&record); err != nil {
            return err
        }
        // Process record without keeping all in memory
        fmt.Printf("Processing record %d\n", record.ID)
    }

    return nil
}

func main() {
    // Example usage
    if err := processLargeFile("large_data.json"); err != nil {
        fmt.Println("Error:", err)
    }
}
```

### Reuse Encoder/Decoder

```go
package main

import (
    "bytes"
    "encoding/json"
    "sync"
)

// Pool of encoders for reuse
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

    // Make a copy since we're returning the buffer to the pool
    result := make([]byte, buf.Len())
    copy(result, buf.Bytes())
    return result, nil
}
```

### Avoid Reflection with Code Generation

For performance-critical applications, consider using code generation tools:

```go
// Example with easyjson (requires installing easyjson tool)
// go install github.com/mailru/easyjson/...@latest

//go:generate easyjson -all model.go

package main

// FastUser will have generated MarshalJSON/UnmarshalJSON methods
type FastUser struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

// After running: go generate
// Use: user.MarshalJSON() and user.UnmarshalJSON()
```

### Benchmark Comparison

```go
package main

import (
    "encoding/json"
    "testing"
)

type BenchmarkData struct {
    ID      int      `json:"id"`
    Name    string   `json:"name"`
    Tags    []string `json:"tags"`
    Active  bool     `json:"active"`
}

var testData = BenchmarkData{
    ID:     12345,
    Name:   "Test Item",
    Tags:   []string{"tag1", "tag2", "tag3"},
    Active: true,
}

func BenchmarkMarshal(b *testing.B) {
    for i := 0; i < b.N; i++ {
        json.Marshal(testData)
    }
}

func BenchmarkMarshalIndent(b *testing.B) {
    for i := 0; i < b.N; i++ {
        json.MarshalIndent(testData, "", "  ")
    }
}

// Run with: go test -bench=. -benchmem
```

## Common Patterns and Best Practices

### API Response Wrapper

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
    // Success response
    user := map[string]interface{}{
        "id":   1,
        "name": "Alice",
    }
    success, _ := SuccessResponse(user)
    fmt.Println(string(success))
    // {"success":true,"data":{"id":1,"name":"Alice"}}

    // Error response
    errResp, _ := ErrorResponse("NOT_FOUND", "User not found")
    fmt.Println(string(errResp))
    // {"success":false,"error":{"code":"NOT_FOUND","message":"User not found"}}
}
```

### Configuration File Handling

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

### JSON Merge/Patch

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

    // Apply patch to base
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

### Working with JSON in HTTP Handlers

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

    // Validation
    if req.Name == "" || req.Email == "" {
        writeError(w, http.StatusBadRequest, "Name and email are required")
        return
    }

    // Create user (simulated)
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

## Summary

This guide covered comprehensive JSON handling in Go:

- **Basic Operations**: Marshal and Unmarshal for encoding/decoding JSON
- **Struct Tags**: Customize field names with `json:"name"`, omit empty values with `omitempty`, and ignore fields with `-`
- **Custom Marshalers**: Implement `MarshalJSON` and `UnmarshalJSON` for complete control
- **json.RawMessage**: Delay parsing, preserve unknown fields, and build dynamic JSON
- **Streaming**: Use `Encoder` and `Decoder` for files and network streams
- **Error Handling**: Handle syntax errors, type errors, and validate JSON structure
- **Performance**: Stream large files, reuse buffers, and consider code generation

Key takeaways:
- Always handle errors from Marshal and Unmarshal operations
- Use struct tags to match your API's naming conventions
- Consider using pointers for optional/nullable fields
- Use `json.Decoder` with `DisallowUnknownFields()` for strict parsing
- Stream large files instead of loading them entirely into memory
- Implement custom marshalers for complex types like enums and custom date formats

The `encoding/json` package provides a solid foundation for JSON handling in Go. For performance-critical applications, consider alternatives like `json-iterator/go` or code generation with `easyjson`, but for most use cases, the standard library is sufficient and well-tested.
