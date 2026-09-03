---
title: Go 反射机制深度解析
description: 全面掌握 Go 语言反射包 reflect 的核心概念与实践，包括 Type、Value、结构体标签、动态值修改与方法调用
track: go
section: types-interfaces
difficulty: advanced
tags:
  - Go
  - 反射
  - reflect
  - 元编程
  - 运行时类型
status: imported
origin: old/src/content/docs/go/reflect.en.md
divergence: 0.186
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 高级特性
  order: 17
  lastUpdated: 2026-01-07
---

## Concept Explanation

Reflection is the ability of a program to examine and modify its own structure and behavior at runtime. Go provides complete reflection support through the standard library `reflect` package, enabling programs to dynamically obtain type information, manipulate arbitrary values, call methods, and more at runtime.

### What is Reflection

In statically typed languages, variable types are determined at compile time. However, sometimes we need to write generic code that can handle arbitrary types, such as JSON serialization, ORM mapping, dependency injection, and similar scenarios. Reflection is the powerful tool for solving these problems.

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    // Regular variable
    var x float64 = 3.14159

    // Get type and value information through reflection
    t := reflect.TypeOf(x)
    v := reflect.ValueOf(x)

    fmt.Println("Type:", t)           // float64
    fmt.Println("Value:", v)          // 3.14159
    fmt.Println("Kind:", t.Kind())    // float64
    fmt.Println("Is addressable:", v.CanAddr()) // false
}
```

### History and Background of Reflection

The concept of reflection can be traced back to Brian Cantwell Smith's doctoral thesis in 1982. Go's reflection design was influenced by languages like Java and C#, but adopted a more concise API design. When designing Go's reflection, Rob Pike followed the principle of "simplicity over complexity," condensing reflection functionality into two core types: `reflect.Type` and `reflect.Value`.

### Problems Solved by Reflection

1. **Generic serialization/deserialization**: Encoding and decoding formats like JSON, XML, YAML
2. **ORM frameworks**: Mapping between database fields and struct fields
3. **Dependency injection**: Dynamically creating and injecting dependencies at runtime
4. **Configuration parsing**: Mapping configuration files to structs
5. **Testing frameworks**: Automatically discovering and executing test functions
6. **RPC frameworks**: Dynamically calling remote methods

## Core Principles

### The Three Laws of Reflection

Go reflection follows three fundamental laws. Understanding these three laws is key to mastering reflection.

#### Law 1: From Interface Value to Reflection Object

Reflection can convert an `interface{}` value to reflection objects (`reflect.Type` and `reflect.Value`).

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    var x int = 42

    // From concrete value to interface value (implicit conversion)
    var i interface{} = x

    // From interface value to reflection object
    t := reflect.TypeOf(i)
    v := reflect.ValueOf(i)

    fmt.Printf("Type: %v, Kind: %v\n", t, t.Kind())  // int, int
    fmt.Printf("Value: %v, Type: %v\n", v, v.Type()) // 42, int
}
```

#### Law 2: From Reflection Object to Interface Value

Reflection can convert reflection objects back to `interface{}` values.

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    var x float64 = 3.14

    // To reflection object
    v := reflect.ValueOf(x)

    // From reflection object back to interface value
    i := v.Interface()

    // Type assertion to get original value
    f := i.(float64)
    fmt.Printf("Original value: %v\n", f) // 3.14

    // Or use Float() method directly
    fmt.Printf("Float(): %v\n", v.Float()) // 3.14
}
```

#### Law 3: Modifying Reflection Objects Requires Settability

To modify the value represented by a reflection object, the value must be settable. Settability is determined by whether the value is addressable and whether it was obtained from an exported field.

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    var x float64 = 3.14

    // Wrong example: v is a copy of x, not settable
    v := reflect.ValueOf(x)
    fmt.Println("Direct value, CanSet:", v.CanSet()) // false

    // Correct approach: pass pointer
    p := reflect.ValueOf(&x)
    fmt.Println("Pointer type:", p.Type())         // *float64
    fmt.Println("Pointer itself CanSet:", p.CanSet()) // false

    // Get the value pointed to by the pointer
    e := p.Elem()
    fmt.Println("After Elem() CanSet:", e.CanSet()) // true

    // Now we can modify the value
    e.SetFloat(2.71828)
    fmt.Println("After modification x =", x) // 2.71828
}
```

### Internal Structure of the Type System

Go's type system is represented at runtime by the `runtime._type` structure, and `reflect.Type` is a wrapper around it.

```go
// Simplified internal representation (actual implementation is more complex)
type _type struct {
    size       uintptr  // Type size
    ptrdata    uintptr  // Number of bytes containing pointers
    hash       uint32   // Type hash
    tflag      tflag    // Type flags
    align      uint8    // Alignment
    fieldAlign uint8    // Field alignment
    kind       uint8    // Kind
    // ...
}
```

### Internal Structure of interface{}

An empty interface at runtime consists of two pointers:

```go
// Internal representation of empty interface
type eface struct {
    _type *_type       // Type information
    data  unsafe.Pointer // Data pointer
}

// Internal representation of non-empty interface
type iface struct {
    tab  *itab         // Type and method table
    data unsafe.Pointer // Data pointer
}
```

This is why `reflect.TypeOf` and `reflect.ValueOf` both accept `interface{}` parameters - they extract type and value information from the interface's internal structure.

## Key Points

### Core Methods of reflect.Type

| Method | Description | Applicable Types |
|------|------|----------|
| `Name()` | Returns type name | All types |
| `Kind()` | Returns underlying type kind | All types |
| `Size()` | Returns type size (bytes) | All types |
| `NumField()` | Returns number of fields | struct |
| `Field(i)` | Returns the i-th field | struct |
| `FieldByName(name)` | Finds field by name | struct |
| `NumMethod()` | Returns number of methods | All types |
| `Method(i)` | Returns the i-th method | All types |
| `Elem()` | Returns element type | Array, Chan, Map, Ptr, Slice |
| `Key()` | Returns key type | Map |
| `NumIn()` | Returns number of function parameters | Func |
| `NumOut()` | Returns number of function return values | Func |

### Core Methods of reflect.Value

| Method | Description | Notes |
|------|------|----------|
| `Interface()` | Returns interface value | Requires CanInterface() to be true |
| `Type()` | Returns value's type | Always available |
| `Kind()` | Returns value's kind | Always available |
| `IsValid()` | Whether value is valid | Zero Value returns false |
| `IsNil()` | Whether value is nil | Only for chan, func, interface, map, ptr, slice |
| `IsZero()` | Whether is zero value | Go 1.13+ |
| `CanSet()` | Whether settable | Addressable and exported fields |
| `CanAddr()` | Whether addressable | Values obtained from pointer Elem() |
| `Elem()` | Gets pointer/interface element | Ptr, Interface |
| `Set(v)` | Sets value | Requires CanSet() to be true |
| `Call(args)` | Calls function/method | Func type |

### Kind Enum Values

```go
const (
    Invalid Kind = iota  // Invalid
    Bool                 // Boolean
    Int                  // int
    Int8                 // int8
    Int16                // int16
    Int32                // int32
    Int64                // int64
    Uint                 // uint
    Uint8                // uint8
    Uint16               // uint16
    Uint32               // uint32
    Uint64               // uint64
    Uintptr              // uintptr
    Float32              // float32
    Float64              // float64
    Complex64            // complex64
    Complex128           // complex128
    Array                // Array
    Chan                 // Channel
    Func                 // Function
    Interface            // Interface
    Map                  // Map
    Pointer              // Pointer (alias for Ptr)
    Slice                // Slice
    String               // String
    Struct               // Struct
    UnsafePointer        // unsafe.Pointer
)
```

## Code Examples

### reflect.Type in Detail

```go
package main

import (
    "fmt"
    "reflect"
)

type Address struct {
    City    string `json:"city"`
    Country string `json:"country"`
}

type Person struct {
    Name    string  `json:"name" validate:"required,min=2"`
    Age     int     `json:"age" validate:"min=0,max=150"`
    Email   string  `json:"email,omitempty" validate:"email"`
    Address Address `json:"address"`
    private string  // Unexported field
}

func (p Person) Greet() string {
    return fmt.Sprintf("Hello, I am %s", p.Name)
}

func (p *Person) SetName(name string) {
    p.Name = name
}

func main() {
    p := Person{
        Name:  "John",
        Age:   30,
        Email: "john@example.com",
        Address: Address{
            City:    "Beijing",
            Country: "China",
        },
    }

    t := reflect.TypeOf(p)

    // Basic type information
    fmt.Println("=== Basic Type Information ===")
    fmt.Printf("Type name: %s\n", t.Name())       // Person
    fmt.Printf("Package path: %s\n", t.PkgPath()) // main
    fmt.Printf("Type kind: %s\n", t.Kind())       // struct
    fmt.Printf("Type size: %d bytes\n", t.Size()) // Platform dependent
    fmt.Printf("Alignment: %d\n", t.Align())
    fmt.Printf("Comparable: %t\n", t.Comparable())

    // Field information
    fmt.Println("\n=== Field Information ===")
    fmt.Printf("Number of fields: %d\n", t.NumField())

    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        fmt.Printf("\nField %d: %s\n", i, field.Name)
        fmt.Printf("  Type: %v\n", field.Type)
        fmt.Printf("  Offset: %d\n", field.Offset)
        fmt.Printf("  Anonymous: %t\n", field.Anonymous)
        fmt.Printf("  Exported: %t\n", field.IsExported())
        fmt.Printf("  JSON tag: %s\n", field.Tag.Get("json"))
        fmt.Printf("  Validate tag: %s\n", field.Tag.Get("validate"))
    }

    // Find field by name
    fmt.Println("\n=== Find Field by Name ===")
    if field, ok := t.FieldByName("Email"); ok {
        fmt.Printf("Found field Email: %v\n", field.Type)
    }

    // Find nested field (using index path)
    if field, ok := t.FieldByName("City"); ok {
        fmt.Printf("Found nested field City: %v, index path: %v\n", field.Type, field.Index)
    }

    // Method information
    fmt.Println("\n=== Method Information ===")
    fmt.Printf("Value type method count: %d\n", t.NumMethod())
    for i := 0; i < t.NumMethod(); i++ {
        m := t.Method(i)
        fmt.Printf("Method %d: %s, type: %v\n", i, m.Name, m.Type)
    }

    // Pointer type methods (includes value type methods)
    pt := reflect.TypeOf(&p)
    fmt.Printf("\nPointer type method count: %d\n", pt.NumMethod())
    for i := 0; i < pt.NumMethod(); i++ {
        m := pt.Method(i)
        fmt.Printf("Method %d: %s, type: %v\n", i, m.Name, m.Type)
    }
}
```

### reflect.Value in Detail

```go
package main

import (
    "fmt"
    "reflect"
)

type Config struct {
    Host     string
    Port     int
    Debug    bool
    Timeout  float64
    Tags     []string
    Metadata map[string]string
}

func main() {
    cfg := &Config{
        Host:     "localhost",
        Port:     8080,
        Debug:    true,
        Timeout:  30.5,
        Tags:     []string{"api", "v1"},
        Metadata: map[string]string{"env": "prod"},
    }

    // Get reflection object of value
    v := reflect.ValueOf(cfg)

    fmt.Println("=== Basic Checks ===")
    fmt.Printf("IsValid: %t\n", v.IsValid())
    fmt.Printf("Kind: %s\n", v.Kind())
    fmt.Printf("Type: %v\n", v.Type())
    fmt.Printf("CanSet: %t\n", v.CanSet())

    // Get value pointed to by pointer
    elem := v.Elem()
    fmt.Printf("\nAfter Elem() CanSet: %t\n", elem.CanSet())

    // Read field values
    fmt.Println("\n=== Reading Field Values ===")
    for i := 0; i < elem.NumField(); i++ {
        field := elem.Field(i)
        fieldType := elem.Type().Field(i)
        fmt.Printf("%s: %v (Kind: %s)\n", fieldType.Name, field.Interface(), field.Kind())
    }

    // Modify field values
    fmt.Println("\n=== Modifying Field Values ===")

    // Modify string
    hostField := elem.FieldByName("Host")
    if hostField.CanSet() {
        hostField.SetString("0.0.0.0")
        fmt.Printf("Host modified to: %s\n", cfg.Host)
    }

    // Modify integer
    portField := elem.FieldByName("Port")
    if portField.CanSet() {
        portField.SetInt(9090)
        fmt.Printf("Port modified to: %d\n", cfg.Port)
    }

    // Modify boolean
    debugField := elem.FieldByName("Debug")
    if debugField.CanSet() {
        debugField.SetBool(false)
        fmt.Printf("Debug modified to: %t\n", cfg.Debug)
    }

    // Modify float
    timeoutField := elem.FieldByName("Timeout")
    if timeoutField.CanSet() {
        timeoutField.SetFloat(60.0)
        fmt.Printf("Timeout modified to: %.1f\n", cfg.Timeout)
    }

    // Modify slice
    fmt.Println("\n=== Modifying Slice ===")
    tagsField := elem.FieldByName("Tags")
    if tagsField.CanSet() {
        // Append element
        newTags := reflect.Append(tagsField, reflect.ValueOf("v2"))
        tagsField.Set(newTags)
        fmt.Printf("Tags: %v\n", cfg.Tags)

        // Modify single element
        tagsField.Index(0).SetString("core-api")
        fmt.Printf("Modified Tags: %v\n", cfg.Tags)
    }

    // Modify map
    fmt.Println("\n=== Modifying Map ===")
    metaField := elem.FieldByName("Metadata")
    // Set key-value pair
    metaField.SetMapIndex(reflect.ValueOf("version"), reflect.ValueOf("1.0"))
    fmt.Printf("Metadata: %v\n", cfg.Metadata)

    // Delete key-value pair (set to zero Value)
    metaField.SetMapIndex(reflect.ValueOf("env"), reflect.Value{})
    fmt.Printf("Metadata after deleting env: %v\n", cfg.Metadata)

    // Check special states
    fmt.Println("\n=== Special State Checks ===")
    var nilPtr *Config
    nilV := reflect.ValueOf(nilPtr)
    fmt.Printf("nil pointer IsNil: %t\n", nilV.IsNil())

    var zeroConfig Config
    zeroV := reflect.ValueOf(zeroConfig)
    fmt.Printf("Zero value struct IsZero: %t\n", zeroV.IsZero())
}
```

### Parsing Struct Tags

```go
package main

import (
    "fmt"
    "reflect"
    "strconv"
    "strings"
)

// Field metadata
type FieldMeta struct {
    Name       string
    JSONName   string
    DBColumn   string
    Required   bool
    Min        *int
    Max        *int
    Default    string
    OmitEmpty  bool
}

// Parse struct tags
func ParseStructTags(v interface{}) []FieldMeta {
    t := reflect.TypeOf(v)
    if t.Kind() == reflect.Ptr {
        t = t.Elem()
    }

    if t.Kind() != reflect.Struct {
        return nil
    }

    var metas []FieldMeta

    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)

        meta := FieldMeta{
            Name: field.Name,
        }

        // Parse json tag
        if jsonTag := field.Tag.Get("json"); jsonTag != "" {
            parts := strings.Split(jsonTag, ",")
            if parts[0] != "-" {
                meta.JSONName = parts[0]
            }
            for _, opt := range parts[1:] {
                if opt == "omitempty" {
                    meta.OmitEmpty = true
                }
            }
        }

        // Parse db tag
        meta.DBColumn = field.Tag.Get("db")

        // Parse validate tag
        if validateTag := field.Tag.Get("validate"); validateTag != "" {
            rules := strings.Split(validateTag, ",")
            for _, rule := range rules {
                if rule == "required" {
                    meta.Required = true
                } else if strings.HasPrefix(rule, "min=") {
                    if v, err := strconv.Atoi(rule[4:]); err == nil {
                        meta.Min = &v
                    }
                } else if strings.HasPrefix(rule, "max=") {
                    if v, err := strconv.Atoi(rule[4:]); err == nil {
                        meta.Max = &v
                    }
                }
            }
        }

        // Parse default tag
        meta.Default = field.Tag.Get("default")

        metas = append(metas, meta)
    }

    return metas
}

type User struct {
    ID       int64  `json:"id" db:"user_id"`
    Username string `json:"username" db:"user_name" validate:"required,min=3,max=20"`
    Email    string `json:"email,omitempty" db:"email" validate:"required"`
    Age      int    `json:"age" db:"age" validate:"min=0,max=150" default:"18"`
    Password string `json:"-" db:"password_hash" validate:"required,min=8"`
}

func main() {
    metas := ParseStructTags(User{})

    fmt.Println("=== User Struct Field Metadata ===")
    for _, meta := range metas {
        fmt.Printf("\nField: %s\n", meta.Name)
        fmt.Printf("  JSON name: %s\n", meta.JSONName)
        fmt.Printf("  Database column: %s\n", meta.DBColumn)
        fmt.Printf("  Required: %t\n", meta.Required)
        if meta.Min != nil {
            fmt.Printf("  Min value: %d\n", *meta.Min)
        }
        if meta.Max != nil {
            fmt.Printf("  Max value: %d\n", *meta.Max)
        }
        if meta.Default != "" {
            fmt.Printf("  Default value: %s\n", meta.Default)
        }
        fmt.Printf("  Omit empty: %t\n", meta.OmitEmpty)
    }
}
```

### Dynamic Value Setting

```go
package main

import (
    "fmt"
    "reflect"
)

// Generic value setting function
func SetField(obj interface{}, fieldName string, value interface{}) error {
    v := reflect.ValueOf(obj)

    // Must be a pointer
    if v.Kind() != reflect.Ptr {
        return fmt.Errorf("obj must be a pointer type")
    }

    // Get value pointed to by pointer
    v = v.Elem()

    // Must be a struct
    if v.Kind() != reflect.Struct {
        return fmt.Errorf("obj must point to a struct")
    }

    // Find field
    field := v.FieldByName(fieldName)
    if !field.IsValid() {
        return fmt.Errorf("field %s does not exist", fieldName)
    }

    // Check if settable
    if !field.CanSet() {
        return fmt.Errorf("field %s is not settable (may be unexported)", fieldName)
    }

    // Get value to set
    val := reflect.ValueOf(value)

    // Type check
    if !val.Type().AssignableTo(field.Type()) {
        // Try type conversion
        if val.Type().ConvertibleTo(field.Type()) {
            val = val.Convert(field.Type())
        } else {
            return fmt.Errorf("type mismatch: expected %v, got %v", field.Type(), val.Type())
        }
    }

    field.Set(val)
    return nil
}

// Batch set fields
func SetFields(obj interface{}, fields map[string]interface{}) []error {
    var errs []error
    for name, value := range fields {
        if err := SetField(obj, name, value); err != nil {
            errs = append(errs, err)
        }
    }
    return errs
}

type Server struct {
    Host    string
    Port    int
    Timeout float64
    Debug   bool
}

func main() {
    server := &Server{}

    // Single field setting
    fmt.Println("=== Single Field Setting ===")
    SetField(server, "Host", "127.0.0.1")
    SetField(server, "Port", 8080)
    SetField(server, "Timeout", 30.5)
    SetField(server, "Debug", true)
    fmt.Printf("Server: %+v\n", server)

    // Batch setting
    fmt.Println("\n=== Batch Setting ===")
    server2 := &Server{}
    errs := SetFields(server2, map[string]interface{}{
        "Host":    "0.0.0.0",
        "Port":    9090,
        "Timeout": 60.0,
        "Debug":   false,
    })
    if len(errs) > 0 {
        for _, err := range errs {
            fmt.Printf("Error: %v\n", err)
        }
    }
    fmt.Printf("Server2: %+v\n", server2)

    // Error handling demo
    fmt.Println("\n=== Error Handling ===")
    err := SetField(server, "InvalidField", "test")
    fmt.Printf("Setting non-existent field: %v\n", err)

    err = SetField(server, "Port", "not a number")
    fmt.Printf("Type mismatch: %v\n", err)
}
```

### Dynamic Method Invocation

```go
package main

import (
    "fmt"
    "reflect"
)

type Calculator struct {
    precision int
}

func (c Calculator) Add(a, b float64) float64 {
    return a + b
}

func (c Calculator) Multiply(a, b float64) float64 {
    return a * b
}

func (c Calculator) Divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}

func (c *Calculator) SetPrecision(p int) {
    c.precision = p
}

func (c Calculator) GetPrecision() int {
    return c.precision
}

// Generic method invoker
func InvokeMethod(obj interface{}, methodName string, args ...interface{}) ([]interface{}, error) {
    v := reflect.ValueOf(obj)

    // Find method
    method := v.MethodByName(methodName)
    if !method.IsValid() {
        return nil, fmt.Errorf("method %s does not exist", methodName)
    }

    // Check parameter count
    methodType := method.Type()
    if len(args) != methodType.NumIn() {
        return nil, fmt.Errorf("parameter count mismatch: expected %d, got %d", methodType.NumIn(), len(args))
    }

    // Convert parameters
    in := make([]reflect.Value, len(args))
    for i, arg := range args {
        argVal := reflect.ValueOf(arg)
        expectedType := methodType.In(i)

        // Type check and conversion
        if !argVal.Type().AssignableTo(expectedType) {
            if argVal.Type().ConvertibleTo(expectedType) {
                argVal = argVal.Convert(expectedType)
            } else {
                return nil, fmt.Errorf("parameter %d type mismatch", i)
            }
        }
        in[i] = argVal
    }

    // Call method
    results := method.Call(in)

    // Convert return values
    out := make([]interface{}, len(results))
    for i, result := range results {
        out[i] = result.Interface()
    }

    return out, nil
}

// Get method info with type checking
func GetMethodInfo(obj interface{}) {
    t := reflect.TypeOf(obj)

    fmt.Printf("Methods of type %v:\n", t)
    for i := 0; i < t.NumMethod(); i++ {
        m := t.Method(i)
        fmt.Printf("\n  %s:\n", m.Name)
        fmt.Printf("    Signature: %v\n", m.Type)

        // Parameter info (skip receiver)
        fmt.Printf("    Parameters: ")
        for j := 1; j < m.Type.NumIn(); j++ {
            if j > 1 {
                fmt.Print(", ")
            }
            fmt.Printf("%v", m.Type.In(j))
        }
        fmt.Println()

        // Return value info
        fmt.Printf("    Return values: ")
        for j := 0; j < m.Type.NumOut(); j++ {
            if j > 0 {
                fmt.Print(", ")
            }
            fmt.Printf("%v", m.Type.Out(j))
        }
        fmt.Println()
    }
}

func main() {
    calc := &Calculator{precision: 2}

    // Get method info
    fmt.Println("=== Method Information ===")
    GetMethodInfo(calc)

    // Call methods
    fmt.Println("\n=== Calling Methods ===")

    // Call Add
    result, err := InvokeMethod(calc, "Add", 10.5, 20.3)
    if err != nil {
        fmt.Printf("Error: %v\n", err)
    } else {
        fmt.Printf("Add(10.5, 20.3) = %v\n", result[0])
    }

    // Call Multiply
    result, err = InvokeMethod(calc, "Multiply", 6.0, 7.0)
    if err != nil {
        fmt.Printf("Error: %v\n", err)
    } else {
        fmt.Printf("Multiply(6.0, 7.0) = %v\n", result[0])
    }

    // Call Divide (has multiple return values)
    result, err = InvokeMethod(calc, "Divide", 10.0, 3.0)
    if err != nil {
        fmt.Printf("Error: %v\n", err)
    } else {
        fmt.Printf("Divide(10.0, 3.0) = %v, error = %v\n", result[0], result[1])
    }

    // Call Divide (division by zero error)
    result, err = InvokeMethod(calc, "Divide", 10.0, 0.0)
    if err != nil {
        fmt.Printf("Error: %v\n", err)
    } else {
        fmt.Printf("Divide(10.0, 0.0) = %v, error = %v\n", result[0], result[1])
    }

    // Call pointer receiver method
    _, err = InvokeMethod(calc, "SetPrecision", 4)
    if err != nil {
        fmt.Printf("Error: %v\n", err)
    } else {
        fmt.Printf("SetPrecision(4) succeeded, current precision: %d\n", calc.precision)
    }
}
```

### Dynamically Creating Type Instances

```go
package main

import (
    "fmt"
    "reflect"
)

type User struct {
    ID   int
    Name string
    Age  int
}

func main() {
    // Get type
    userType := reflect.TypeOf(User{})

    // Create new instance (returns pointer)
    fmt.Println("=== Creating Instance ===")
    newUserPtr := reflect.New(userType)
    fmt.Printf("Type: %v\n", newUserPtr.Type()) // *main.User

    // Set field values
    newUser := newUserPtr.Elem()
    newUser.FieldByName("ID").SetInt(1)
    newUser.FieldByName("Name").SetString("John")
    newUser.FieldByName("Age").SetInt(25)

    // Convert back to concrete type
    user := newUserPtr.Interface().(*User)
    fmt.Printf("Created user: %+v\n", user)

    // Create zero value
    fmt.Println("\n=== Creating Zero Value ===")
    zeroUser := reflect.Zero(userType)
    fmt.Printf("Zero value user: %+v\n", zeroUser.Interface())

    // Create slice
    fmt.Println("\n=== Creating Slice ===")
    sliceType := reflect.SliceOf(userType)
    slice := reflect.MakeSlice(sliceType, 0, 10)

    // Append elements
    slice = reflect.Append(slice, reflect.ValueOf(User{ID: 1, Name: "User1", Age: 20}))
    slice = reflect.Append(slice, reflect.ValueOf(User{ID: 2, Name: "User2", Age: 25}))

    fmt.Printf("Slice type: %v\n", slice.Type())
    fmt.Printf("Slice content: %v\n", slice.Interface())

    // Create map
    fmt.Println("\n=== Creating Map ===")
    mapType := reflect.MapOf(reflect.TypeOf(""), userType)
    m := reflect.MakeMap(mapType)

    m.SetMapIndex(reflect.ValueOf("user1"), reflect.ValueOf(User{ID: 1, Name: "Alice", Age: 30}))
    m.SetMapIndex(reflect.ValueOf("user2"), reflect.ValueOf(User{ID: 2, Name: "Bob", Age: 28}))

    fmt.Printf("Map type: %v\n", m.Type())
    fmt.Printf("Map content: %v\n", m.Interface())

    // Iterate map
    fmt.Println("\nMap iteration:")
    iter := m.MapRange()
    for iter.Next() {
        fmt.Printf("  %v: %+v\n", iter.Key().Interface(), iter.Value().Interface())
    }

    // Create channel
    fmt.Println("\n=== Creating Channel ===")
    chanType := reflect.ChanOf(reflect.BothDir, reflect.TypeOf(0))
    ch := reflect.MakeChan(chanType, 5)

    // Send and receive
    ch.Send(reflect.ValueOf(42))
    ch.Send(reflect.ValueOf(100))

    val, ok := ch.TryRecv()
    fmt.Printf("Received: %v, ok: %v\n", val.Interface(), ok)

    // Create function
    fmt.Println("\n=== Dynamically Creating Function ===")
    funcType := reflect.FuncOf(
        []reflect.Type{reflect.TypeOf(0), reflect.TypeOf(0)},
        []reflect.Type{reflect.TypeOf(0)},
        false,
    )

    addFunc := reflect.MakeFunc(funcType, func(args []reflect.Value) []reflect.Value {
        a := args[0].Int()
        b := args[1].Int()
        return []reflect.Value{reflect.ValueOf(int(a + b))}
    })

    result := addFunc.Call([]reflect.Value{
        reflect.ValueOf(10),
        reflect.ValueOf(20),
    })
    fmt.Printf("Dynamic function add(10, 20) = %v\n", result[0].Interface())

    // Convert to concrete function type
    add := addFunc.Interface().(func(int, int) int)
    fmt.Printf("After type assertion: add(5, 3) = %d\n", add(5, 3))
}
```

## Best Practices

### Prefer Interfaces Over Reflection

```go
// Good practice: use interfaces
type Serializer interface {
    Serialize() ([]byte, error)
}

func Save(s Serializer) error {
    data, err := s.Serialize()
    if err != nil {
        return err
    }
    // Save data...
    return nil
}

// Avoid: using reflection for known types
func SaveBad(v interface{}) error {
    val := reflect.ValueOf(v)
    // Lots of reflection code...
    return nil
}
```

### Cache Reflection Information

```go
package main

import (
    "reflect"
    "sync"
)

// Type info cache
type TypeInfo struct {
    Type       reflect.Type
    Fields     map[string]int      // Field name to index mapping
    FieldTypes map[string]reflect.Type
}

var (
    typeCache = make(map[reflect.Type]*TypeInfo)
    cacheMu   sync.RWMutex
)

// Get or create type info
func GetTypeInfo(t reflect.Type) *TypeInfo {
    if t.Kind() == reflect.Ptr {
        t = t.Elem()
    }

    // Try to read cache first
    cacheMu.RLock()
    info, ok := typeCache[t]
    cacheMu.RUnlock()
    if ok {
        return info
    }

    // Create new type info
    cacheMu.Lock()
    defer cacheMu.Unlock()

    // Double check
    if info, ok = typeCache[t]; ok {
        return info
    }

    info = &TypeInfo{
        Type:       t,
        Fields:     make(map[string]int),
        FieldTypes: make(map[string]reflect.Type),
    }

    if t.Kind() == reflect.Struct {
        for i := 0; i < t.NumField(); i++ {
            field := t.Field(i)
            info.Fields[field.Name] = i
            info.FieldTypes[field.Name] = field.Type
        }
    }

    typeCache[t] = info
    return info
}

// Fast field access using cached type info
func GetFieldFast(v reflect.Value, info *TypeInfo, fieldName string) reflect.Value {
    if idx, ok := info.Fields[fieldName]; ok {
        return v.Field(idx)
    }
    return reflect.Value{}
}
```

### Safe Reflection Operations

```go
package main

import (
    "fmt"
    "reflect"
)

// Safely get field value
func SafeGetField(v interface{}, name string) (interface{}, error) {
    val := reflect.ValueOf(v)

    // Handle pointer
    if val.Kind() == reflect.Ptr {
        if val.IsNil() {
            return nil, fmt.Errorf("nil pointer")
        }
        val = val.Elem()
    }

    // Check if struct
    if val.Kind() != reflect.Struct {
        return nil, fmt.Errorf("not a struct type: %v", val.Kind())
    }

    // Find field
    field := val.FieldByName(name)
    if !field.IsValid() {
        return nil, fmt.Errorf("field %s does not exist", name)
    }

    // Check if accessible
    if !field.CanInterface() {
        return nil, fmt.Errorf("field %s is not accessible (unexported)", name)
    }

    return field.Interface(), nil
}

// Safely set field value
func SafeSetField(v interface{}, name string, value interface{}) error {
    val := reflect.ValueOf(v)

    // Must be pointer
    if val.Kind() != reflect.Ptr {
        return fmt.Errorf("must pass a pointer")
    }

    if val.IsNil() {
        return fmt.Errorf("nil pointer")
    }

    val = val.Elem()

    if val.Kind() != reflect.Struct {
        return fmt.Errorf("not a struct type")
    }

    field := val.FieldByName(name)
    if !field.IsValid() {
        return fmt.Errorf("field %s does not exist", name)
    }

    if !field.CanSet() {
        return fmt.Errorf("field %s is not settable", name)
    }

    newVal := reflect.ValueOf(value)
    if !newVal.Type().AssignableTo(field.Type()) {
        return fmt.Errorf("type mismatch: expected %v, got %v", field.Type(), newVal.Type())
    }

    field.Set(newVal)
    return nil
}

// Safely invoke method
func SafeInvokeMethod(v interface{}, name string, args ...interface{}) (results []interface{}, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("method call panic: %v", r)
        }
    }()

    val := reflect.ValueOf(v)
    method := val.MethodByName(name)

    if !method.IsValid() {
        return nil, fmt.Errorf("method %s does not exist", name)
    }

    // Convert parameters
    in := make([]reflect.Value, len(args))
    for i, arg := range args {
        in[i] = reflect.ValueOf(arg)
    }

    // Call method
    out := method.Call(in)

    // Convert return values
    results = make([]interface{}, len(out))
    for i, r := range out {
        results[i] = r.Interface()
    }

    return results, nil
}
```

### Minimize Reflection in Hot Paths

```go
// Complete reflection operations during initialization
type Encoder struct {
    fieldIndices map[string][]int
    fieldTypes   map[string]reflect.Type
}

func NewEncoder(t reflect.Type) *Encoder {
    enc := &Encoder{
        fieldIndices: make(map[string][]int),
        fieldTypes:   make(map[string]reflect.Type),
    }

    // Parse all field info once
    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        tag := field.Tag.Get("json")
        if tag != "" && tag != "-" {
            enc.fieldIndices[tag] = field.Index
            enc.fieldTypes[tag] = field.Type
        }
    }

    return enc
}

// Fast access using precomputed indices
func (e *Encoder) GetField(v reflect.Value, name string) reflect.Value {
    if idx, ok := e.fieldIndices[name]; ok {
        return v.FieldByIndex(idx)
    }
    return reflect.Value{}
}
```

## Common Pitfalls

### Calling Set on Non-addressable Values

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    x := 42

    // Wrong: passing value creates a copy, not settable
    v := reflect.ValueOf(x)
    fmt.Println("CanSet:", v.CanSet()) // false
    // v.SetInt(100) // panic!

    // Correct: pass pointer
    v = reflect.ValueOf(&x).Elem()
    fmt.Println("CanSet:", v.CanSet()) // true
    v.SetInt(100)
    fmt.Println("x =", x) // 100
}
```

### Calling Reflection Methods on nil Interface

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    var i interface{}

    // TypeOf returns nil
    t := reflect.TypeOf(i)
    fmt.Println("TypeOf nil:", t) // <nil>

    // ValueOf returns invalid Value
    v := reflect.ValueOf(i)
    fmt.Println("IsValid:", v.IsValid()) // false
    // v.Kind() // panic if we don't check IsValid first

    // Correct approach: check first
    if v.IsValid() {
        fmt.Println("Kind:", v.Kind())
    }
}
```

### The Interface Value nil Pitfall

```go
package main

import (
    "fmt"
    "reflect"
)

type Writer interface {
    Write([]byte) (int, error)
}

type MyWriter struct{}

func (m *MyWriter) Write(b []byte) (int, error) {
    return len(b), nil
}

func main() {
    var w *MyWriter = nil
    var i Writer = w

    // i is NOT nil! Because interface has type information
    fmt.Println("i == nil:", i == nil) // false

    v := reflect.ValueOf(i)
    fmt.Println("IsValid:", v.IsValid()) // true
    fmt.Println("IsNil:", v.IsNil())     // true
    fmt.Println("Type:", v.Type())       // *main.MyWriter

    // Correct way to check for nil
    if v.IsValid() && (v.Kind() == reflect.Ptr || v.Kind() == reflect.Interface) && v.IsNil() {
        fmt.Println("Actually nil")
    }
}
```

### Modifying Unexported Fields

```go
package main

import (
    "fmt"
    "reflect"
    "unsafe"
)

type secret struct {
    public  string
    private string // Unexported
}

func main() {
    s := &secret{public: "Public", private: "Secret"}

    v := reflect.ValueOf(s).Elem()

    // Can read unexported field (using unsafe)
    privateField := v.FieldByName("private")
    fmt.Println("CanSet:", privateField.CanSet())       // false
    fmt.Println("CanInterface:", privateField.CanInterface()) // false

    // Not recommended: use unsafe to read (for debugging only)
    ptr := unsafe.Pointer(privateField.UnsafeAddr())
    realValue := *(*string)(ptr)
    fmt.Println("Secret value (unsafe):", realValue)

    // Cannot modify unexported field normally
    // privateField.SetString("new value") // panic!
}
```

### Ignoring Method Set Differences

```go
package main

import (
    "fmt"
    "reflect"
)

type Counter struct {
    count int
}

func (c Counter) Get() int {
    return c.count
}

func (c *Counter) Inc() {
    c.count++
}

func main() {
    c := Counter{count: 0}

    // Value type only has value receiver methods
    vt := reflect.TypeOf(c)
    fmt.Printf("Counter method count: %d\n", vt.NumMethod()) // 1 (only Get)

    // Pointer type has all methods
    pt := reflect.TypeOf(&c)
    fmt.Printf("*Counter method count: %d\n", pt.NumMethod()) // 2 (Get and Inc)

    // Calling pointer method through value will fail
    v := reflect.ValueOf(c)
    incMethod := v.MethodByName("Inc")
    fmt.Println("Value type has Inc:", incMethod.IsValid()) // false

    // Can call all methods through pointer
    pv := reflect.ValueOf(&c)
    incMethod = pv.MethodByName("Inc")
    fmt.Println("Pointer type has Inc:", incMethod.IsValid()) // true
}
```

## Performance Considerations

### Reflection Performance Comparison

```go
package main

import (
    "reflect"
    "testing"
)

type Point struct {
    X, Y int
}

// Direct access
func BenchmarkDirect(b *testing.B) {
    p := Point{X: 10, Y: 20}
    for i := 0; i < b.N; i++ {
        _ = p.X + p.Y
    }
}

// Reflection access (get each time)
func BenchmarkReflect(b *testing.B) {
    p := Point{X: 10, Y: 20}
    for i := 0; i < b.N; i++ {
        v := reflect.ValueOf(p)
        _ = v.FieldByName("X").Int() + v.FieldByName("Y").Int()
    }
}

// Reflection access (cache Value)
func BenchmarkReflectCached(b *testing.B) {
    p := Point{X: 10, Y: 20}
    v := reflect.ValueOf(p)
    for i := 0; i < b.N; i++ {
        _ = v.FieldByName("X").Int() + v.FieldByName("Y").Int()
    }
}

// Reflection access (cache index)
func BenchmarkReflectIndex(b *testing.B) {
    p := Point{X: 10, Y: 20}
    v := reflect.ValueOf(p)
    for i := 0; i < b.N; i++ {
        _ = v.Field(0).Int() + v.Field(1).Int()
    }
}
```

Typical results:
- Direct access: ~0.3 ns/op
- Reflection (get each time): ~200 ns/op
- Reflection (cache Value): ~100 ns/op
- Reflection (use index): ~50 ns/op

### Performance Optimization Strategies

1. **Cache reflect.Type and field indices**
2. **Avoid calling TypeOf/ValueOf in loops**
3. **Use Field(i) instead of FieldByName**
4. **Consider code generation instead of runtime reflection**
5. **Use interfaces for performance-sensitive code**

```go
// Optimization example: precompute field info
type OptimizedMapper struct {
    fieldIndices map[string]int
}

func NewOptimizedMapper(t reflect.Type) *OptimizedMapper {
    m := &OptimizedMapper{
        fieldIndices: make(map[string]int),
    }
    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        m.fieldIndices[field.Name] = i
    }
    return m
}

func (m *OptimizedMapper) GetFieldIndex(name string) (int, bool) {
    idx, ok := m.fieldIndices[name]
    return idx, ok
}
```

## Practical Scenarios

### Scenario 1: Simple JSON Serializer

```go
package main

import (
    "fmt"
    "reflect"
    "strconv"
    "strings"
)

func ToJSON(v interface{}) string {
    return toJSONValue(reflect.ValueOf(v))
}

func toJSONValue(v reflect.Value) string {
    switch v.Kind() {
    case reflect.Invalid:
        return "null"
    case reflect.Bool:
        return strconv.FormatBool(v.Bool())
    case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
        return strconv.FormatInt(v.Int(), 10)
    case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
        return strconv.FormatUint(v.Uint(), 10)
    case reflect.Float32, reflect.Float64:
        return strconv.FormatFloat(v.Float(), 'f', -1, 64)
    case reflect.String:
        return `"` + escapeJSON(v.String()) + `"`
    case reflect.Ptr, reflect.Interface:
        if v.IsNil() {
            return "null"
        }
        return toJSONValue(v.Elem())
    case reflect.Slice, reflect.Array:
        return toJSONArray(v)
    case reflect.Map:
        return toJSONMap(v)
    case reflect.Struct:
        return toJSONStruct(v)
    default:
        return "null"
    }
}

func toJSONArray(v reflect.Value) string {
    var parts []string
    for i := 0; i < v.Len(); i++ {
        parts = append(parts, toJSONValue(v.Index(i)))
    }
    return "[" + strings.Join(parts, ",") + "]"
}

func toJSONMap(v reflect.Value) string {
    var parts []string
    iter := v.MapRange()
    for iter.Next() {
        key := toJSONValue(iter.Key())
        val := toJSONValue(iter.Value())
        parts = append(parts, key+":"+val)
    }
    return "{" + strings.Join(parts, ",") + "}"
}

func toJSONStruct(v reflect.Value) string {
    t := v.Type()
    var parts []string

    for i := 0; i < v.NumField(); i++ {
        field := t.Field(i)
        if !field.IsExported() {
            continue
        }

        jsonTag := field.Tag.Get("json")
        if jsonTag == "-" {
            continue
        }

        name := field.Name
        omitempty := false

        if jsonTag != "" {
            tagParts := strings.Split(jsonTag, ",")
            if tagParts[0] != "" {
                name = tagParts[0]
            }
            for _, opt := range tagParts[1:] {
                if opt == "omitempty" {
                    omitempty = true
                }
            }
        }

        fieldValue := v.Field(i)
        if omitempty && fieldValue.IsZero() {
            continue
        }

        parts = append(parts, `"`+name+`":`+toJSONValue(fieldValue))
    }

    return "{" + strings.Join(parts, ",") + "}"
}

func escapeJSON(s string) string {
    s = strings.ReplaceAll(s, `\`, `\\`)
    s = strings.ReplaceAll(s, `"`, `\"`)
    s = strings.ReplaceAll(s, "\n", `\n`)
    s = strings.ReplaceAll(s, "\t", `\t`)
    return s
}

type Address struct {
    City    string `json:"city"`
    Country string `json:"country"`
}

type Person struct {
    Name    string   `json:"name"`
    Age     int      `json:"age"`
    Email   string   `json:"email,omitempty"`
    Address *Address `json:"address"`
    Tags    []string `json:"tags"`
    secret  string   // Unexported, not serialized
}

func main() {
    person := Person{
        Name: "John",
        Age:  30,
        Address: &Address{
            City:    "Beijing",
            Country: "China",
        },
        Tags:   []string{"Go", "Reflection"},
        secret: "hidden data",
    }

    json := ToJSON(person)
    fmt.Println("JSON output:")
    fmt.Println(json)
}
```

### Scenario 2: Configuration Parser

```go
package main

import (
    "fmt"
    "os"
    "reflect"
    "strconv"
    "strings"
)

// Fill configuration struct from environment variables
func LoadConfigFromEnv(cfg interface{}, prefix string) error {
    v := reflect.ValueOf(cfg)
    if v.Kind() != reflect.Ptr || v.IsNil() {
        return fmt.Errorf("cfg must be a non-nil pointer")
    }

    v = v.Elem()
    if v.Kind() != reflect.Struct {
        return fmt.Errorf("cfg must point to a struct")
    }

    t := v.Type()

    for i := 0; i < v.NumField(); i++ {
        field := t.Field(i)
        fieldValue := v.Field(i)

        if !fieldValue.CanSet() {
            continue
        }

        // Get environment variable name
        envName := field.Tag.Get("env")
        if envName == "" {
            envName = strings.ToUpper(prefix + "_" + toSnakeCase(field.Name))
        }

        // Get environment variable value
        envValue := os.Getenv(envName)
        if envValue == "" {
            // Use default value
            if defaultVal := field.Tag.Get("default"); defaultVal != "" {
                envValue = defaultVal
            } else {
                continue
            }
        }

        // Set field value
        if err := setFieldValue(fieldValue, envValue); err != nil {
            return fmt.Errorf("failed to set field %s: %v", field.Name, err)
        }
    }

    return nil
}

func setFieldValue(field reflect.Value, value string) error {
    switch field.Kind() {
    case reflect.String:
        field.SetString(value)
    case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
        v, err := strconv.ParseInt(value, 10, 64)
        if err != nil {
            return err
        }
        field.SetInt(v)
    case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
        v, err := strconv.ParseUint(value, 10, 64)
        if err != nil {
            return err
        }
        field.SetUint(v)
    case reflect.Float32, reflect.Float64:
        v, err := strconv.ParseFloat(value, 64)
        if err != nil {
            return err
        }
        field.SetFloat(v)
    case reflect.Bool:
        v, err := strconv.ParseBool(value)
        if err != nil {
            return err
        }
        field.SetBool(v)
    case reflect.Slice:
        // Simple handling of string slice
        if field.Type().Elem().Kind() == reflect.String {
            parts := strings.Split(value, ",")
            slice := reflect.MakeSlice(field.Type(), len(parts), len(parts))
            for i, part := range parts {
                slice.Index(i).SetString(strings.TrimSpace(part))
            }
            field.Set(slice)
        }
    default:
        return fmt.Errorf("unsupported type: %v", field.Kind())
    }
    return nil
}

func toSnakeCase(s string) string {
    var result strings.Builder
    for i, r := range s {
        if i > 0 && r >= 'A' && r <= 'Z' {
            result.WriteRune('_')
        }
        result.WriteRune(r)
    }
    return strings.ToUpper(result.String())
}

type DatabaseConfig struct {
    Host     string   `env:"DB_HOST" default:"localhost"`
    Port     int      `env:"DB_PORT" default:"5432"`
    Username string   `env:"DB_USER" default:"postgres"`
    Password string   `env:"DB_PASS"`
    Database string   `env:"DB_NAME" default:"myapp"`
    SSLMode  bool     `env:"DB_SSL" default:"false"`
    Options  []string `env:"DB_OPTIONS" default:"sslmode=disable,timezone=UTC"`
}

func main() {
    // Simulate setting environment variables
    os.Setenv("DB_HOST", "db.example.com")
    os.Setenv("DB_PORT", "3306")
    os.Setenv("DB_USER", "admin")

    cfg := &DatabaseConfig{}
    if err := LoadConfigFromEnv(cfg, "APP"); err != nil {
        fmt.Printf("Failed to load config: %v\n", err)
        return
    }

    fmt.Printf("Database configuration:\n")
    fmt.Printf("  Host: %s\n", cfg.Host)
    fmt.Printf("  Port: %d\n", cfg.Port)
    fmt.Printf("  Username: %s\n", cfg.Username)
    fmt.Printf("  Database: %s\n", cfg.Database)
    fmt.Printf("  SSLMode: %t\n", cfg.SSLMode)
    fmt.Printf("  Options: %v\n", cfg.Options)
}
```

### Scenario 3: Simple Dependency Injection Container

```go
package main

import (
    "fmt"
    "reflect"
)

type Container struct {
    services map[reflect.Type]interface{}
}

func NewContainer() *Container {
    return &Container{
        services: make(map[reflect.Type]interface{}),
    }
}

// Register service
func (c *Container) Register(service interface{}) {
    t := reflect.TypeOf(service)
    c.services[t] = service
}

// Register interface implementation
func (c *Container) RegisterAs(interfaceType reflect.Type, service interface{}) {
    c.services[interfaceType] = service
}

// Resolve dependencies and create instance
func (c *Container) Resolve(targetType reflect.Type) (interface{}, error) {
    // If pointer, get element type
    isPtr := targetType.Kind() == reflect.Ptr
    elemType := targetType
    if isPtr {
        elemType = targetType.Elem()
    }

    if elemType.Kind() != reflect.Struct {
        // Try to get directly from container
        if service, ok := c.services[targetType]; ok {
            return service, nil
        }
        return nil, fmt.Errorf("cannot resolve type: %v", targetType)
    }

    // Create new instance
    instance := reflect.New(elemType).Elem()

    // Inject dependencies
    for i := 0; i < elemType.NumField(); i++ {
        field := elemType.Field(i)

        // Check if injection needed
        if _, ok := field.Tag.Lookup("inject"); !ok {
            continue
        }

        // Find matching service
        fieldType := field.Type
        service, ok := c.services[fieldType]
        if !ok {
            return nil, fmt.Errorf("service not found for type %v", fieldType)
        }

        // Set field
        fieldValue := instance.Field(i)
        if fieldValue.CanSet() {
            fieldValue.Set(reflect.ValueOf(service))
        }
    }

    if isPtr {
        return instance.Addr().Interface(), nil
    }
    return instance.Interface(), nil
}

// Example services
type Logger interface {
    Log(message string)
}

type ConsoleLogger struct {
    prefix string
}

func (l *ConsoleLogger) Log(message string) {
    fmt.Printf("[%s] %s\n", l.prefix, message)
}

type Database struct {
    connectionString string
}

func (d *Database) Query(sql string) {
    fmt.Printf("Executing query: %s\n", sql)
}

// Service that needs injection
type UserService struct {
    Logger   Logger    `inject:""`
    Database *Database `inject:""`
}

func (s *UserService) CreateUser(name string) {
    s.Logger.Log(fmt.Sprintf("Creating user: %s", name))
    s.Database.Query(fmt.Sprintf("INSERT INTO users (name) VALUES ('%s')", name))
}

func main() {
    container := NewContainer()

    // Register services
    logger := &ConsoleLogger{prefix: "APP"}
    container.RegisterAs(reflect.TypeOf((*Logger)(nil)).Elem(), logger)
    container.Register(&Database{connectionString: "localhost:5432"})

    // Resolve service
    service, err := container.Resolve(reflect.TypeOf(&UserService{}))
    if err != nil {
        fmt.Printf("Resolution failed: %v\n", err)
        return
    }

    userService := service.(*UserService)
    userService.CreateUser("John")
}
```

## Interview Key Points

### Q1: What is the difference between reflect.TypeOf and reflect.ValueOf?

**Answer**:
- `reflect.TypeOf(x)` returns `reflect.Type`, representing variable type information (metadata), which is static
- `reflect.ValueOf(x)` returns `reflect.Value`, representing the variable's value, can be used for reading or modifying
- TypeOf is mainly used for type checking, getting field and method information
- ValueOf is mainly used for reading/writing values, calling methods

```go
x := 42
t := reflect.TypeOf(x)  // int (type info)
v := reflect.ValueOf(x) // 42 (value)
```

### Q2: How do you modify a variable's value through reflection?

**Answer**:
1. Must pass a pointer to the variable
2. Use `Elem()` to get the value pointed to by the pointer
3. Use the corresponding `Set*` method to modify

```go
x := 10
v := reflect.ValueOf(&x).Elem()
v.SetInt(20)
fmt.Println(x) // 20
```

### Q3: What is the difference between Kind and Type?

**Answer**:
- `Type` is the concrete type name, like `main.Person`, `int`
- `Kind` is the underlying type kind, like `struct`, `int`, `ptr`
- For custom type `type MyInt int`, Type is `MyInt`, Kind is `int`

### Q4: How significant is reflection's performance overhead? How to optimize?

**Answer**:
- Reflection is typically 10-100 times slower than direct access
- Optimization strategies:
  1. Cache Type and field indices
  2. Avoid calling TypeOf/ValueOf repeatedly in loops
  3. Use Field(i) instead of FieldByName
  4. Consider code generation instead of runtime reflection

### Q5: When should reflection be used?

**Answer**:
Suitable use cases:
- Generic serialization/deserialization frameworks
- ORM and database mapping
- Dependency injection containers
- Configuration parsing
- Testing frameworks

Not suitable:
- Performance-sensitive hot path code
- When types are known at compile time
- When polymorphism can be achieved with interfaces

### Q6: How do you determine if an interface value is nil?

**Answer**:
```go
func isNil(i interface{}) bool {
    if i == nil {
        return true
    }
    v := reflect.ValueOf(i)
    switch v.Kind() {
    case reflect.Ptr, reflect.Map, reflect.Slice, reflect.Chan, reflect.Func, reflect.Interface:
        return v.IsNil()
    }
    return false
}
```

Note: An interface value being nil is different from an interface holding a nil value.

## Further Reading

### Official Documentation
- [reflect package official documentation](https://pkg.go.dev/reflect)
- [The Laws of Reflection](https://go.dev/blog/laws-of-reflection) - Rob Pike's three laws of reflection

### Recommended Books
- "The Go Programming Language" - Alan Donovan, Brian Kernighan
- "Go Programming Advanced" - Chai Shusong, Cao Chunhui

### Quality Articles
- [Go Reflection Mechanism Explained](https://draveness.me/golang/docs/part2-foundation/ch04-basic/golang-reflect/)
- [Deep Understanding of Go Interfaces and Reflection](https://research.swtch.com/interfaces)

### Related Source Code
- [encoding/json](https://github.com/golang/go/tree/master/src/encoding/json) - Standard library JSON implementation
- [jinzhu/copier](https://github.com/jinzhu/copier) - Struct copy library
- [mitchellh/mapstructure](https://github.com/mitchellh/mapstructure) - Map to struct conversion

### Code Generation Alternatives
- [go generate](https://go.dev/blog/generate) - Go code generation
- [easyjson](https://github.com/mailru/easyjson) - High-performance JSON library (uses code generation)
