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
origin: old/src/content/docs/go/structs.en.md
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

Structs are one of the most fundamental and powerful features in Go. They allow you to create custom data types that group together related data under a single name. Unlike classes in object-oriented languages, Go structs are simple, lightweight, and compose together elegantly. We provide a comprehensive guide to understanding and using structs effectively in Go.

## What is a Struct?

A struct (short for "structure") is a composite data type that groups together zero or more values with different types under a single type name. Each value in a struct is called a field. Structs are similar to records or objects in other programming languages.

### Basic Struct Definition

```go
package main

import "fmt"

// Define a struct type
type Person struct {
    FirstName string
    LastName  string
    Age       int
    Email     string
}

func main() {
    // Create an instance of Person
    p := Person{
        FirstName: "John",
        LastName:  "Doe",
        Age:       30,
        Email:     "john.doe@example.com",
    }

    fmt.Println(p)
    // Output: {John Doe 30 john.doe@example.com}
}
```

### Struct Field Naming Conventions

Go follows specific conventions for naming struct fields:

- Fields starting with an uppercase letter are exported (public)
- Fields starting with a lowercase letter are unexported (private to the package)

```go
type User struct {
    ID        int    // Exported - accessible from other packages
    Username  string // Exported
    password  string // Unexported - only accessible within the same package
    createdAt time.Time // Unexported
}
```

## Creating and Initializing Structs

Go provides several ways to create and initialize struct instances.

### Named Field Initialization

The most explicit and recommended way to create a struct:

```go
package main

import "fmt"

type Point struct {
    X int
    Y int
}

func main() {
    // Named field initialization
    p1 := Point{X: 10, Y: 20}
    fmt.Println(p1) // Output: {10 20}

    // Order doesn't matter with named fields
    p2 := Point{Y: 30, X: 40}
    fmt.Println(p2) // Output: {40 30}

    // You can omit fields (they get zero values)
    p3 := Point{X: 50}
    fmt.Println(p3) // Output: {50 0}
}
```

### Positional Initialization

You can initialize structs using positional values, but this is less readable and more error-prone:

```go
package main

import "fmt"

type Point struct {
    X int
    Y int
}

func main() {
    // Positional initialization (must provide all fields in order)
    p := Point{10, 20}
    fmt.Println(p) // Output: {10 20}
}
```

### Zero Value Initialization

When you declare a struct variable without initialization, all fields are set to their zero values:

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
    // Output: Host: '', Port: 0, Enabled: false
}
```

### Using the `new` Function

The `new` function allocates memory for a struct and returns a pointer to it:

```go
package main

import "fmt"

type Rectangle struct {
    Width  float64
    Height float64
}

func main() {
    // new() returns a pointer to a zeroed struct
    rect := new(Rectangle)
    fmt.Printf("Type: %T, Value: %+v\n", rect, rect)
    // Output: Type: *main.Rectangle, Value: &{Width:0 Height:0}

    rect.Width = 10.5
    rect.Height = 5.5
    fmt.Printf("Rectangle: %+v\n", rect)
    // Output: Rectangle: &{Width:10.5 Height:5.5}
}
```

### Using Address Operator (&)

You can create a pointer to a struct using the address operator:

```go
package main

import "fmt"

type Book struct {
    Title  string
    Author string
    Pages  int
}

func main() {
    // Create a pointer to a struct literal
    book := &Book{
        Title:  "The Go Programming Language",
        Author: "Alan A. A. Donovan",
        Pages:  380,
    }

    fmt.Printf("Type: %T\n", book)   // Output: Type: *main.Book
    fmt.Println("Title:", book.Title) // Output: Title: The Go Programming Language
}
```

## Accessing Struct Fields

You access struct fields using dot notation:

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

    // Accessing fields
    fmt.Println("Name:", emp.Name)
    fmt.Println("Department:", emp.Department)
    fmt.Println("Salary:", emp.Salary)

    // Modifying fields
    emp.Salary = 80000.00
    fmt.Println("New Salary:", emp.Salary)
}
```

### Accessing Fields Through Pointers

Go automatically dereferences pointers when accessing struct fields:

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

    // Both work the same way
    fmt.Println(coords.Latitude)    // Automatic dereference
    fmt.Println((*coords).Latitude) // Explicit dereference

    // Modifying through pointer
    coords.Latitude = 41.8781
    fmt.Println("New Latitude:", coords.Latitude)
}
```

## Anonymous Structs

Anonymous structs are struct types without a name. They are useful for one-off data structures:

```go
package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    // Anonymous struct inline
    person := struct {
        Name string
        Age  int
    }{
        Name: "Bob",
        Age:  25,
    }

    fmt.Println(person) // Output: {Bob 25}

    // Useful for JSON parsing
    jsonData := `{"name": "Charlie", "email": "charlie@example.com"}`

    var result struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }

    json.Unmarshal([]byte(jsonData), &result)
    fmt.Printf("Name: %s, Email: %s\n", result.Name, result.Email)
}
```

### Anonymous Struct Use Cases

```go
package main

import "fmt"

func main() {
    // Test data
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

    // Configuration with nested anonymous struct
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

## Methods on Structs

Methods are functions associated with a particular type. In Go, you can define methods on struct types.

### Value Receiver Methods

Value receiver methods receive a copy of the struct:

```go
package main

import (
    "fmt"
    "math"
)

type Circle struct {
    Radius float64
}

// Value receiver method
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

### Pointer Receiver Methods

Pointer receiver methods can modify the original struct:

```go
package main

import "fmt"

type Counter struct {
    Value int
}

// Pointer receiver - can modify the struct
func (c *Counter) Increment() {
    c.Value++
}

func (c *Counter) Add(n int) {
    c.Value += n
}

func (c *Counter) Reset() {
    c.Value = 0
}

// Value receiver - cannot modify the struct
func (c Counter) GetValue() int {
    return c.Value
}

func main() {
    counter := Counter{Value: 0}

    counter.Increment()
    fmt.Println("After increment:", counter.Value) // Output: 1

    counter.Add(10)
    fmt.Println("After add:", counter.Value) // Output: 11

    counter.Reset()
    fmt.Println("After reset:", counter.Value) // Output: 0
}
```

### When to Use Pointer vs Value Receivers

Use pointer receivers when:
- The method needs to modify the receiver
- The struct is large (copying would be expensive)
- Consistency: if some methods need pointers, use pointers for all methods

Use value receivers when:
- The method doesn't modify the receiver
- The struct is small and cheap to copy
- You want immutability guarantees

```go
package main

import "fmt"

// Small struct - value receivers are fine
type Point struct {
    X, Y int
}

func (p Point) Distance(other Point) float64 {
    dx := float64(p.X - other.X)
    dy := float64(p.Y - other.Y)
    return (dx*dx + dy*dy)
}

// Large struct - use pointer receivers
type LargeData struct {
    Data [1000]int
    Name string
}

func (ld *LargeData) Process() {
    // Process the data
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

## Struct Embedding (Composition)

Go doesn't have inheritance, but it supports composition through struct embedding. When you embed a struct, its fields and methods are promoted to the embedding struct.

### Basic Embedding

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
    Address // Embedded struct (anonymous field)
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

    // Access embedded fields directly
    fmt.Println("Name:", p.Name)
    fmt.Println("City:", p.City)    // Promoted field
    fmt.Println("Country:", p.Country) // Promoted field

    // Or access through the embedded type
    fmt.Println("Address:", p.Address)
}
```

### Method Promotion

Methods of embedded types are also promoted:

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
    Engine // Embedded
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

    // Methods are promoted
    car.Start() // Output: Starting V6 engine with 200 HP
    car.Stop()  // Output: Engine stopped

    // You can still access through the embedded type
    car.Engine.Start()
}
```

### Multiple Embedding

You can embed multiple types:

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

    // Both methods are available
    data := rw.Read()
    rw.Write(data)
}
```

### Overriding Embedded Methods

The embedding type can define its own methods that override embedded methods:

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

// Override the Speak method
func (d Dog) Speak() string {
    return "Woof!"
}

func main() {
    dog := Dog{
        Animal: Animal{Name: "Buddy"},
        Breed:  "Golden Retriever",
    }

    fmt.Println(dog.Name)   // From Animal
    fmt.Println(dog.Speak()) // Overridden: Woof!
    fmt.Println(dog.Animal.Speak()) // Original: ...
}
```

### Named vs Anonymous Embedding

```go
package main

import "fmt"

type Logger struct{}

func (l Logger) Log(message string) {
    fmt.Println("LOG:", message)
}

// Anonymous embedding - fields and methods promoted
type ServiceA struct {
    Logger // Anonymous
}

// Named embedding - must access through field name
type ServiceB struct {
    logger Logger // Named field
}

func main() {
    a := ServiceA{}
    a.Log("message from A") // Direct access

    b := ServiceB{logger: Logger{}}
    b.logger.Log("message from B") // Must use field name
}
```

## Struct Tags

Struct tags are small pieces of metadata attached to struct fields. They are commonly used for serialization, validation, and ORM mapping.

### Basic Struct Tags

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
    Password  string `json:"-"` // Exclude from JSON
    CreatedAt string `json:"created_at,omitempty"`
}

func main() {
    user := User{
        ID:       1,
        Username: "johndoe",
        Email:    "john@example.com",
        Password: "secret123",
    }

    // Marshal to JSON
    jsonData, _ := json.Marshal(user)
    fmt.Println(string(jsonData))
    // Output: {"id":1,"username":"johndoe","email":"john@example.com"}

    // Unmarshal from JSON
    jsonInput := `{"id":2,"username":"janedoe","email":"jane@example.com"}`
    var user2 User
    json.Unmarshal([]byte(jsonInput), &user2)
    fmt.Printf("%+v\n", user2)
}
```

### Multiple Tag Keys

You can include multiple tag keys for different purposes:

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

    // JSON output
    jsonData, _ := json.Marshal(product)
    fmt.Println("JSON:", string(jsonData))

    // XML output
    xmlData, _ := xml.Marshal(product)
    fmt.Println("XML:", string(xmlData))
}
```

### Reading Struct Tags with Reflection

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

### Common Tag Patterns

```go
type Model struct {
    // JSON tags
    Name string `json:"name"`                    // Renamed
    Age  int    `json:"age,omitempty"`           // Omit if zero
    Pass string `json:"-"`                       // Always omit
    Data []byte `json:"data,string"`             // Encode as string

    // Database tags (GORM example)
    ID        uint   `gorm:"primaryKey"`
    Email     string `gorm:"uniqueIndex;size:255"`
    CreatedAt time.Time `gorm:"autoCreateTime"`

    // Validation tags (go-playground/validator)
    Username string `validate:"required,alphanum,min=3,max=20"`
    Email    string `validate:"required,email"`
    Age      int    `validate:"gte=0,lte=120"`

    // Form tags (gin/echo)
    Query  string `form:"q" query:"q"`
    Header string `header:"X-Custom-Header"`

    // Environment variable tags
    Port string `env:"PORT" envDefault:"8080"`
}
```

## Comparing Structs

Structs are comparable if all their fields are comparable:

```go
package main

import "fmt"

type Point struct {
    X, Y int
}

type Data struct {
    Values []int // Slices are not comparable
}

func main() {
    // Comparable structs
    p1 := Point{1, 2}
    p2 := Point{1, 2}
    p3 := Point{3, 4}

    fmt.Println(p1 == p2) // Output: true
    fmt.Println(p1 == p3) // Output: false

    // Can use as map keys
    points := make(map[Point]string)
    points[p1] = "origin adjacent"
    points[p3] = "far point"

    fmt.Println(points[p1])

    // Non-comparable structs (contain slices, maps, or functions)
    // d1 := Data{Values: []int{1, 2}}
    // d2 := Data{Values: []int{1, 2}}
    // fmt.Println(d1 == d2) // Compile error!
}
```

### Deep Comparison with reflect.DeepEqual

For structs with non-comparable fields, use `reflect.DeepEqual`:

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

## Copying Structs

Understanding struct copying behavior is crucial for avoiding bugs.

### Value Copy

When you assign a struct to a new variable, a copy is created:

```go
package main

import "fmt"

type Person struct {
    Name string
    Age  int
}

func main() {
    original := Person{Name: "Alice", Age: 30}
    copy := original // Creates a copy

    copy.Name = "Bob"
    copy.Age = 25

    fmt.Println("Original:", original) // {Alice 30}
    fmt.Println("Copy:", copy)         // {Bob 25}
}
```

### Shallow Copy with Pointers and Slices

Be careful with fields that are pointers or slices:

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

    // Shallow copy - slice header is copied, but underlying array is shared
    copy := original

    copy.Name = "Beta"
    copy.Members[0] = "Charlie" // This modifies both!

    fmt.Println("Original:", original) // {Alpha [Charlie Bob]}
    fmt.Println("Copy:", copy)         // {Beta [Charlie Bob]}
}
```

### Deep Copy

For deep copies, you need to manually copy slice and map fields:

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

## Constructor Functions

Go doesn't have constructors, but it's idiomatic to create factory functions:

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

// Simple constructor
func NewServer(host string, port int) *Server {
    return &Server{
        host: host,
        port: port,
    }
}

// Constructor with validation
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

// Constructor with default values
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

### Functional Options Pattern

For structs with many optional fields, the functional options pattern is elegant:

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

// Option is a function that configures a Client
type Option func(*Client)

// Option functions
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

// Constructor with options
func NewClient(host string, opts ...Option) *Client {
    // Default values
    client := &Client{
        host:     host,
        port:     443,
        timeout:  30 * time.Second,
        retries:  3,
        insecure: false,
    }

    // Apply options
    for _, opt := range opts {
        opt(client)
    }

    return client
}

func main() {
    // With defaults
    client1 := NewClient("api.example.com")
    fmt.Printf("Client 1: %+v\n", client1)

    // With custom options
    client2 := NewClient("api.example.com",
        WithPort(8443),
        WithTimeout(10*time.Second),
        WithRetries(5),
        WithInsecure(),
    )
    fmt.Printf("Client 2: %+v\n", client2)
}
```

## Structs and JSON

Working with JSON is extremely common in Go applications:

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
    // Struct to JSON
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

    // JSON to Struct
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

### Custom JSON Marshaling

You can implement custom JSON marshaling and unmarshaling:

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

// Custom time type with different JSON format
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
    // Output: {"Name":"Meeting","Timestamp":"2024-01-15 14:30:45"}

    // Parse back
    jsonInput := `{"Name":"Conference","Timestamp":"2024-06-20 09:00:00"}`
    var parsedEvent Event
    json.Unmarshal([]byte(jsonInput), &parsedEvent)
    fmt.Printf("Parsed: %+v\n", parsedEvent)
}
```

## Best Practices

### Keep Structs Focused

Each struct should represent a single concept:

```go
// Good: Focused structs
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

// Avoid: Struct doing too much
type BadUser struct {
    ID      int
    Name    string
    Street  string
    City    string
    Country string
    Email   string
    Phone   string
    // ... many more fields
}
```

### Use Meaningful Field Names

```go
// Good
type Order struct {
    CustomerID    int
    ProductSKU    string
    Quantity      int
    UnitPrice     float64
    TotalAmount   float64
    OrderDate     time.Time
    DeliveryDate  time.Time
}

// Avoid
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

### Consider Zero Values

Design structs so that zero values are useful:

```go
package main

import "fmt"

// Good: Zero value is useful
type Counter struct {
    value int // Zero value (0) is a valid starting point
}

func (c *Counter) Increment() {
    c.value++
}

func (c Counter) Value() int {
    return c.value
}

// Works immediately with zero value
func main() {
    var c Counter // No initialization needed
    c.Increment()
    c.Increment()
    fmt.Println(c.Value()) // Output: 2
}
```

### Document Exported Types and Fields

```go
// User represents a registered user in the system.
// Users are created through the registration process and can
// have various roles and permissions assigned to them.
type User struct {
    // ID is the unique identifier for the user.
    ID int

    // Email is the user's email address, used for login and notifications.
    // Must be unique across all users.
    Email string

    // CreatedAt is the timestamp when the user account was created.
    CreatedAt time.Time
}
```

### Use Pointer Receivers Consistently

If any method needs a pointer receiver, use pointer receivers for all methods:

```go
type Account struct {
    balance float64
}

// All methods use pointer receivers for consistency
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

## Common Patterns

### Builder Pattern

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

### Repository Pattern

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

    // Create users
    repo.Create(&User{Name: "Alice", Email: "alice@example.com"})
    repo.Create(&User{Name: "Bob", Email: "bob@example.com"})

    // Find all
    users, _ := repo.FindAll()
    for _, u := range users {
        fmt.Printf("User: %+v\n", u)
    }

    // Find by ID
    user, _ := repo.FindByID(1)
    fmt.Printf("Found: %+v\n", user)
}
```

## Summary

This guide covered the essential aspects of Go structs:

- **Definition and Initialization**: How to define structs and create instances using various methods
- **Field Access**: Accessing and modifying struct fields, including through pointers
- **Anonymous Structs**: Creating one-off struct types for specific use cases
- **Methods**: Defining methods with value and pointer receivers
- **Embedding**: Achieving composition through struct embedding
- **Struct Tags**: Using metadata for JSON, database mapping, and validation
- **Comparison and Copying**: Understanding how structs are compared and copied
- **Constructor Functions**: Creating idiomatic factory functions
- **Best Practices**: Writing clean, maintainable struct code

Structs are the foundation for building complex data structures and domain models in Go. By mastering structs, you'll be well-equipped to write idiomatic, efficient, and maintainable Go code.

## Next Steps

After mastering structs, explore these related topics:

- Interfaces and polymorphism
- Concurrency patterns with structs
- Testing struct-based code
- Working with databases (GORM, sqlx)
- Protocol Buffers and gRPC
- Design patterns in Go
