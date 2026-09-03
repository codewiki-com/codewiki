---
title: Go Reflection
description: Master Go reflection with the reflect package including Type, Value, dynamic calls and best practices
track: go
section: types-interfaces
difficulty: advanced
tags:
  - Go
  - reflection
  - reflect
  - metaprogramming
status: imported
origin: old/src/content/docs/go/reflection.en.md
divergence: 0.213
issues: []
legacy:
  category: Go
  subcategory: Advanced Features
  order: 16
  lastUpdated: 2026-01-07
---

Reflection is a powerful feature in Go that allows programs to examine, modify, and create values, types, and functions at runtime. While Go is a statically typed language, the `reflect` package provides mechanisms to work with types dynamically, enabling generic programming patterns, serialization libraries, and framework development.

## What is Reflection?

Reflection is the ability of a program to inspect and manipulate its own structure and behavior at runtime. In Go, the `reflect` package provides this capability by allowing you to:

- Examine the type and value of variables at runtime
- Modify values dynamically
- Call functions and methods by name
- Create new values and types programmatically

### When to Use Reflection

Reflection is useful in several scenarios:

- **Serialization/Deserialization**: JSON, XML, and other encoding libraries use reflection to convert between Go structs and external formats
- **ORM Libraries**: Database mappers use reflection to map struct fields to database columns
- **Dependency Injection**: Frameworks inspect types to automatically wire dependencies
- **Testing Frameworks**: Test utilities examine struct fields and call methods dynamically
- **Generic Utilities**: Functions that work with any type (before generics were introduced)

However, reflection comes with trade-offs:

- **Performance**: Reflection is slower than static code
- **Type Safety**: Errors are discovered at runtime, not compile time
- **Complexity**: Reflective code is harder to read and maintain

## The reflect Package Basics

The `reflect` package provides two fundamental types: `Type` and `Value`.

### reflect.Type

`reflect.Type` represents a Go type. You can obtain it using `reflect.TypeOf()`:

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    var x int = 42
    var s string = "hello"
    var f float64 = 3.14

    fmt.Println(reflect.TypeOf(x)) // int
    fmt.Println(reflect.TypeOf(s)) // string
    fmt.Println(reflect.TypeOf(f)) // float64

    // Type information for complex types
    slice := []int{1, 2, 3}
    m := map[string]int{"a": 1}

    fmt.Println(reflect.TypeOf(slice)) // []int
    fmt.Println(reflect.TypeOf(m))     // map[string]int
}
```

### reflect.Value

`reflect.Value` represents the value of a variable. You can obtain it using `reflect.ValueOf()`:

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    x := 42
    v := reflect.ValueOf(x)

    fmt.Println("Value:", v)           // Value: 42
    fmt.Println("Type:", v.Type())     // Type: int
    fmt.Println("Kind:", v.Kind())     // Kind: int
    fmt.Println("Int value:", v.Int()) // Int value: 42
}
```

### Kind vs Type

`Kind` represents the underlying category of a type, while `Type` represents the specific type:

```go
package main

import (
    "fmt"
    "reflect"
)

type MyInt int

func main() {
    var x MyInt = 42
    t := reflect.TypeOf(x)

    fmt.Println("Type:", t)        // Type: main.MyInt
    fmt.Println("Kind:", t.Kind()) // Kind: int
    fmt.Println("Name:", t.Name()) // Name: MyInt

    // Kind categories
    fmt.Println(reflect.TypeOf(42).Kind())           // int
    fmt.Println(reflect.TypeOf("hello").Kind())      // string
    fmt.Println(reflect.TypeOf([]int{}).Kind())      // slice
    fmt.Println(reflect.TypeOf(map[string]int{}).Kind()) // map
    fmt.Println(reflect.TypeOf(struct{}{}).Kind())   // struct
    fmt.Println(reflect.TypeOf(func() {}).Kind())    // func
}
```

The available `Kind` constants include:

```go
const (
    Invalid Kind = iota
    Bool
    Int, Int8, Int16, Int32, Int64
    Uint, Uint8, Uint16, Uint32, Uint64, Uintptr
    Float32, Float64
    Complex64, Complex128
    Array
    Chan
    Func
    Interface
    Map
    Pointer
    Slice
    String
    Struct
    UnsafePointer
)
```

## Examining Types

### Basic Type Information

```go
package main

import (
    "fmt"
    "reflect"
)

func examineType(x interface{}) {
    t := reflect.TypeOf(x)

    fmt.Printf("Type: %v\n", t)
    fmt.Printf("Name: %v\n", t.Name())
    fmt.Printf("Kind: %v\n", t.Kind())
    fmt.Printf("Size: %v bytes\n", t.Size())
    fmt.Printf("Alignment: %v\n", t.Align())
    fmt.Printf("String: %v\n", t.String())
    fmt.Println("---")
}

func main() {
    examineType(42)
    examineType("hello")
    examineType([]int{1, 2, 3})
    examineType(struct{ Name string }{})
}
```

### Examining Struct Types

Reflection is particularly powerful for examining struct types:

```go
package main

import (
    "fmt"
    "reflect"
)

type Person struct {
    Name    string `json:"name" validate:"required"`
    Age     int    `json:"age" validate:"min=0,max=150"`
    Email   string `json:"email,omitempty"`
    private string // unexported field
}

func examineStruct(x interface{}) {
    t := reflect.TypeOf(x)

    if t.Kind() != reflect.Struct {
        fmt.Println("Not a struct")
        return
    }

    fmt.Printf("Struct: %s\n", t.Name())
    fmt.Printf("Number of fields: %d\n\n", t.NumField())

    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        fmt.Printf("Field %d:\n", i)
        fmt.Printf("  Name: %s\n", field.Name)
        fmt.Printf("  Type: %s\n", field.Type)
        fmt.Printf("  Tag: %s\n", field.Tag)
        fmt.Printf("  JSON tag: %s\n", field.Tag.Get("json"))
        fmt.Printf("  Validate tag: %s\n", field.Tag.Get("validate"))
        fmt.Printf("  Exported: %v\n", field.IsExported())
        fmt.Printf("  Offset: %d\n", field.Offset)
        fmt.Println()
    }
}

func main() {
    p := Person{Name: "Alice", Age: 30, Email: "alice@example.com"}
    examineStruct(p)
}
```

Output:
```
Struct: Person
Number of fields: 4

Field 0:
  Name: Name
  Type: string
  Tag: json:"name" validate:"required"
  JSON tag: name
  Validate tag: required
  Exported: true
  Offset: 0

Field 1:
  Name: Age
  Type: int
  Tag: json:"age" validate:"min=0,max=150"
  JSON tag: age
  Validate tag: min=0,max=150
  Exported: true
  Offset: 16

...
```

### Examining Methods

```go
package main

import (
    "fmt"
    "reflect"
)

type Calculator struct {
    value float64
}

func (c Calculator) Add(x float64) float64 {
    return c.value + x
}

func (c Calculator) Multiply(x float64) float64 {
    return c.value * x
}

func (c *Calculator) SetValue(x float64) {
    c.value = x
}

func examineMethods(x interface{}) {
    t := reflect.TypeOf(x)

    fmt.Printf("Type: %s\n", t)
    fmt.Printf("Number of methods: %d\n\n", t.NumMethod())

    for i := 0; i < t.NumMethod(); i++ {
        method := t.Method(i)
        fmt.Printf("Method %d:\n", i)
        fmt.Printf("  Name: %s\n", method.Name)
        fmt.Printf("  Type: %s\n", method.Type)
        fmt.Printf("  Index: %d\n", method.Index)

        // Examine method signature
        mt := method.Type
        fmt.Printf("  Input parameters: %d\n", mt.NumIn())
        for j := 0; j < mt.NumIn(); j++ {
            fmt.Printf("    In[%d]: %s\n", j, mt.In(j))
        }
        fmt.Printf("  Output parameters: %d\n", mt.NumOut())
        for j := 0; j < mt.NumOut(); j++ {
            fmt.Printf("    Out[%d]: %s\n", j, mt.Out(j))
        }
        fmt.Println()
    }
}

func main() {
    c := Calculator{value: 10}
    fmt.Println("=== Value receiver methods ===")
    examineMethods(c)

    fmt.Println("=== Pointer receiver methods ===")
    examineMethods(&c)
}
```

## Working with Values

### Reading Values

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    // Basic types
    x := 42
    v := reflect.ValueOf(x)
    fmt.Printf("Int value: %d\n", v.Int())

    s := "hello"
    sv := reflect.ValueOf(s)
    fmt.Printf("String value: %s\n", sv.String())

    f := 3.14
    fv := reflect.ValueOf(f)
    fmt.Printf("Float value: %f\n", fv.Float())

    b := true
    bv := reflect.ValueOf(b)
    fmt.Printf("Bool value: %t\n", bv.Bool())

    // Slice
    slice := []int{1, 2, 3, 4, 5}
    sliceV := reflect.ValueOf(slice)
    fmt.Printf("Slice length: %d\n", sliceV.Len())
    fmt.Printf("Slice capacity: %d\n", sliceV.Cap())
    for i := 0; i < sliceV.Len(); i++ {
        fmt.Printf("  slice[%d] = %d\n", i, sliceV.Index(i).Int())
    }

    // Map
    m := map[string]int{"a": 1, "b": 2, "c": 3}
    mapV := reflect.ValueOf(m)
    fmt.Printf("Map length: %d\n", mapV.Len())
    for _, key := range mapV.MapKeys() {
        value := mapV.MapIndex(key)
        fmt.Printf("  m[%s] = %d\n", key.String(), value.Int())
    }
}
```

### Reading Struct Fields

```go
package main

import (
    "fmt"
    "reflect"
)

type User struct {
    ID       int
    Name     string
    Email    string
    IsActive bool
}

func readStructFields(x interface{}) {
    v := reflect.ValueOf(x)

    // Handle pointer to struct
    if v.Kind() == reflect.Pointer {
        v = v.Elem()
    }

    if v.Kind() != reflect.Struct {
        fmt.Println("Not a struct")
        return
    }

    t := v.Type()
    for i := 0; i < v.NumField(); i++ {
        field := v.Field(i)
        fieldType := t.Field(i)

        if !fieldType.IsExported() {
            fmt.Printf("%s: (unexported)\n", fieldType.Name)
            continue
        }

        fmt.Printf("%s (%s): %v\n", fieldType.Name, field.Type(), field.Interface())
    }
}

func main() {
    user := User{
        ID:       1,
        Name:     "Alice",
        Email:    "alice@example.com",
        IsActive: true,
    }

    readStructFields(user)
    fmt.Println("---")
    readStructFields(&user) // Also works with pointer
}
```

### Modifying Values

To modify values using reflection, you need to pass a pointer and use `Elem()` to get the underlying value:

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    // Basic value modification
    x := 42
    v := reflect.ValueOf(&x).Elem() // Must pass pointer and call Elem()

    if v.CanSet() {
        v.SetInt(100)
    }
    fmt.Println("Modified x:", x) // Modified x: 100

    // String modification
    s := "hello"
    sv := reflect.ValueOf(&s).Elem()
    sv.SetString("world")
    fmt.Println("Modified s:", s) // Modified s: world

    // Why Elem() is needed
    ptr := reflect.ValueOf(&x)
    fmt.Printf("ptr.CanSet(): %v\n", ptr.CanSet())        // false
    fmt.Printf("ptr.Elem().CanSet(): %v\n", ptr.Elem().CanSet()) // true
}
```

### Modifying Struct Fields

```go
package main

import (
    "fmt"
    "reflect"
)

type Person struct {
    Name string
    Age  int
}

func modifyStruct(x interface{}) {
    v := reflect.ValueOf(x)

    // Must be a pointer
    if v.Kind() != reflect.Pointer {
        fmt.Println("Must pass a pointer")
        return
    }

    v = v.Elem()
    if v.Kind() != reflect.Struct {
        fmt.Println("Must be a pointer to struct")
        return
    }

    // Modify by field name
    nameField := v.FieldByName("Name")
    if nameField.IsValid() && nameField.CanSet() {
        nameField.SetString("Modified Name")
    }

    ageField := v.FieldByName("Age")
    if ageField.IsValid() && ageField.CanSet() {
        ageField.SetInt(99)
    }
}

func main() {
    p := Person{Name: "Alice", Age: 30}
    fmt.Printf("Before: %+v\n", p)

    modifyStruct(&p)
    fmt.Printf("After: %+v\n", p)
}
```

Output:
```
Before: {Name:Alice Age:30}
After: {Name:Modified Name Age:99}
```

### Modifying Slices and Maps

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    // Modifying slice elements
    slice := []int{1, 2, 3, 4, 5}
    sliceV := reflect.ValueOf(slice)

    // Slice elements are addressable
    sliceV.Index(0).SetInt(100)
    sliceV.Index(4).SetInt(500)
    fmt.Println("Modified slice:", slice) // [100 2 3 4 500]

    // Appending to slice (need pointer)
    slicePtr := reflect.ValueOf(&slice).Elem()
    newSlice := reflect.Append(sliceV, reflect.ValueOf(6))
    slicePtr.Set(newSlice)
    fmt.Println("Appended slice:", slice) // [100 2 3 4 500 6]

    // Modifying map
    m := map[string]int{"a": 1, "b": 2}
    mapV := reflect.ValueOf(m)

    // Set new key-value pair
    mapV.SetMapIndex(reflect.ValueOf("c"), reflect.ValueOf(3))
    // Modify existing value
    mapV.SetMapIndex(reflect.ValueOf("a"), reflect.ValueOf(100))
    // Delete key (set to zero value)
    mapV.SetMapIndex(reflect.ValueOf("b"), reflect.Value{})

    fmt.Println("Modified map:", m) // map[a:100 c:3]
}
```

## Creating New Values

### Creating Basic Values

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    // Create new int
    intType := reflect.TypeOf(0)
    intValue := reflect.New(intType).Elem()
    intValue.SetInt(42)
    fmt.Printf("New int: %v\n", intValue.Interface())

    // Create new string
    stringType := reflect.TypeOf("")
    stringValue := reflect.New(stringType).Elem()
    stringValue.SetString("hello")
    fmt.Printf("New string: %v\n", stringValue.Interface())

    // Create zero value
    zeroInt := reflect.Zero(intType)
    fmt.Printf("Zero int: %v\n", zeroInt.Interface())
}
```

### Creating Slices and Maps

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    // Create new slice
    sliceType := reflect.TypeOf([]int{})
    slice := reflect.MakeSlice(sliceType, 5, 10) // length 5, capacity 10

    for i := 0; i < slice.Len(); i++ {
        slice.Index(i).SetInt(int64(i * 10))
    }
    fmt.Println("New slice:", slice.Interface()) // [0 10 20 30 40]

    // Create new map
    mapType := reflect.TypeOf(map[string]int{})
    m := reflect.MakeMap(mapType)

    m.SetMapIndex(reflect.ValueOf("one"), reflect.ValueOf(1))
    m.SetMapIndex(reflect.ValueOf("two"), reflect.ValueOf(2))
    m.SetMapIndex(reflect.ValueOf("three"), reflect.ValueOf(3))
    fmt.Println("New map:", m.Interface()) // map[one:1 three:3 two:2]

    // Create map with initial capacity
    mWithCap := reflect.MakeMapWithSize(mapType, 100)
    fmt.Println("Map with capacity:", mWithCap.Interface())
}
```

### Creating Structs

```go
package main

import (
    "fmt"
    "reflect"
)

type Person struct {
    Name string
    Age  int
}

func main() {
    // Create new struct instance
    personType := reflect.TypeOf(Person{})
    personPtr := reflect.New(personType)
    person := personPtr.Elem()

    person.FieldByName("Name").SetString("Alice")
    person.FieldByName("Age").SetInt(30)

    fmt.Printf("New person: %+v\n", person.Interface())
    // New person: {Name:Alice Age:30}

    // Create struct using StructOf (dynamic struct creation)
    fields := []reflect.StructField{
        {
            Name: "ID",
            Type: reflect.TypeOf(0),
            Tag:  `json:"id"`,
        },
        {
            Name: "Name",
            Type: reflect.TypeOf(""),
            Tag:  `json:"name"`,
        },
        {
            Name: "Active",
            Type: reflect.TypeOf(false),
            Tag:  `json:"active"`,
        },
    }

    dynamicType := reflect.StructOf(fields)
    dynamicValue := reflect.New(dynamicType).Elem()

    dynamicValue.Field(0).SetInt(123)
    dynamicValue.Field(1).SetString("Dynamic")
    dynamicValue.Field(2).SetBool(true)

    fmt.Printf("Dynamic struct: %+v\n", dynamicValue.Interface())
    fmt.Printf("Dynamic type: %v\n", dynamicType)
}
```

## Calling Functions and Methods

### Calling Functions Dynamically

```go
package main

import (
    "fmt"
    "reflect"
)

func Add(a, b int) int {
    return a + b
}

func Greet(name string) string {
    return "Hello, " + name + "!"
}

func MultiReturn(x int) (int, string) {
    return x * 2, fmt.Sprintf("doubled: %d", x*2)
}

func main() {
    // Call Add function
    addFn := reflect.ValueOf(Add)
    args := []reflect.Value{
        reflect.ValueOf(10),
        reflect.ValueOf(20),
    }
    result := addFn.Call(args)
    fmt.Printf("Add(10, 20) = %v\n", result[0].Int())

    // Call Greet function
    greetFn := reflect.ValueOf(Greet)
    result = greetFn.Call([]reflect.Value{reflect.ValueOf("World")})
    fmt.Printf("Greet(\"World\") = %v\n", result[0].String())

    // Call function with multiple return values
    multiFn := reflect.ValueOf(MultiReturn)
    result = multiFn.Call([]reflect.Value{reflect.ValueOf(21)})
    fmt.Printf("MultiReturn(21) = (%v, %v)\n", result[0].Int(), result[1].String())
}
```

### Calling Methods Dynamically

```go
package main

import (
    "fmt"
    "reflect"
)

type Calculator struct {
    value float64
}

func (c Calculator) Add(x float64) float64 {
    return c.value + x
}

func (c Calculator) Multiply(x float64) float64 {
    return c.value * x
}

func (c *Calculator) SetValue(x float64) {
    c.value = x
}

func (c Calculator) GetValue() float64 {
    return c.value
}

func main() {
    calc := Calculator{value: 10}

    // Call method by name on value
    v := reflect.ValueOf(calc)
    addMethod := v.MethodByName("Add")
    result := addMethod.Call([]reflect.Value{reflect.ValueOf(5.0)})
    fmt.Printf("calc.Add(5.0) = %v\n", result[0].Float())

    // Call method by name on pointer (for pointer receiver methods)
    pv := reflect.ValueOf(&calc)
    setMethod := pv.MethodByName("SetValue")
    setMethod.Call([]reflect.Value{reflect.ValueOf(100.0)})
    fmt.Printf("After SetValue(100.0): calc.value = %v\n", calc.value)

    // Call method by index
    t := reflect.TypeOf(calc)
    for i := 0; i < t.NumMethod(); i++ {
        method := t.Method(i)
        fmt.Printf("Method %d: %s\n", i, method.Name)
    }

    // Dynamic method invocation
    methodName := "Multiply"
    method := v.MethodByName(methodName)
    if method.IsValid() {
        result := method.Call([]reflect.Value{reflect.ValueOf(3.0)})
        fmt.Printf("calc.%s(3.0) = %v\n", methodName, result[0].Float())
    }
}
```

### Creating Functions Dynamically

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    // Define function type
    fnType := reflect.FuncOf(
        []reflect.Type{reflect.TypeOf(0), reflect.TypeOf(0)}, // input types
        []reflect.Type{reflect.TypeOf(0)},                     // output types
        false, // not variadic
    )

    // Create function that adds two numbers
    addFn := reflect.MakeFunc(fnType, func(args []reflect.Value) []reflect.Value {
        a := args[0].Int()
        b := args[1].Int()
        return []reflect.Value{reflect.ValueOf(int(a + b))}
    })

    // Call the dynamically created function
    result := addFn.Call([]reflect.Value{
        reflect.ValueOf(10),
        reflect.ValueOf(20),
    })
    fmt.Printf("Dynamic add(10, 20) = %v\n", result[0].Int())

    // Convert to regular function
    regularFn := addFn.Interface().(func(int, int) int)
    fmt.Printf("Regular call: %v\n", regularFn(30, 40))
}
```

## Practical Examples

### Generic JSON-like Serialization

```go
package main

import (
    "fmt"
    "reflect"
    "strings"
)

func ToMap(obj interface{}) map[string]interface{} {
    result := make(map[string]interface{})
    v := reflect.ValueOf(obj)

    if v.Kind() == reflect.Pointer {
        v = v.Elem()
    }

    if v.Kind() != reflect.Struct {
        return result
    }

    t := v.Type()
    for i := 0; i < v.NumField(); i++ {
        field := v.Field(i)
        fieldType := t.Field(i)

        if !fieldType.IsExported() {
            continue
        }

        // Get JSON tag or use field name
        key := fieldType.Tag.Get("json")
        if key == "" {
            key = strings.ToLower(fieldType.Name)
        } else {
            // Handle json tag options like "name,omitempty"
            if idx := strings.Index(key, ","); idx != -1 {
                key = key[:idx]
            }
        }

        // Skip if tag is "-"
        if key == "-" {
            continue
        }

        result[key] = field.Interface()
    }

    return result
}

type User struct {
    ID       int    `json:"id"`
    Name     string `json:"name"`
    Email    string `json:"email,omitempty"`
    Password string `json:"-"`
    internal string
}

func main() {
    user := User{
        ID:       1,
        Name:     "Alice",
        Email:    "alice@example.com",
        Password: "secret123",
        internal: "internal data",
    }

    result := ToMap(user)
    fmt.Printf("Serialized: %v\n", result)
    // Serialized: map[email:alice@example.com id:1 name:Alice]
}
```

### Struct Validator

```go
package main

import (
    "fmt"
    "reflect"
    "regexp"
    "strconv"
    "strings"
)

type ValidationError struct {
    Field   string
    Message string
}

func (e ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

func Validate(obj interface{}) []ValidationError {
    var errors []ValidationError
    v := reflect.ValueOf(obj)

    if v.Kind() == reflect.Pointer {
        v = v.Elem()
    }

    if v.Kind() != reflect.Struct {
        return errors
    }

    t := v.Type()
    for i := 0; i < v.NumField(); i++ {
        field := v.Field(i)
        fieldType := t.Field(i)

        if !fieldType.IsExported() {
            continue
        }

        tag := fieldType.Tag.Get("validate")
        if tag == "" {
            continue
        }

        fieldErrors := validateField(fieldType.Name, field, tag)
        errors = append(errors, fieldErrors...)
    }

    return errors
}

func validateField(name string, field reflect.Value, tag string) []ValidationError {
    var errors []ValidationError
    rules := strings.Split(tag, ",")

    for _, rule := range rules {
        parts := strings.SplitN(rule, "=", 2)
        ruleName := parts[0]
        var ruleValue string
        if len(parts) > 1 {
            ruleValue = parts[1]
        }

        switch ruleName {
        case "required":
            if isZero(field) {
                errors = append(errors, ValidationError{
                    Field:   name,
                    Message: "is required",
                })
            }

        case "min":
            minVal, _ := strconv.Atoi(ruleValue)
            switch field.Kind() {
            case reflect.String:
                if len(field.String()) < minVal {
                    errors = append(errors, ValidationError{
                        Field:   name,
                        Message: fmt.Sprintf("must be at least %d characters", minVal),
                    })
                }
            case reflect.Int, reflect.Int64:
                if field.Int() < int64(minVal) {
                    errors = append(errors, ValidationError{
                        Field:   name,
                        Message: fmt.Sprintf("must be at least %d", minVal),
                    })
                }
            }

        case "max":
            maxVal, _ := strconv.Atoi(ruleValue)
            switch field.Kind() {
            case reflect.String:
                if len(field.String()) > maxVal {
                    errors = append(errors, ValidationError{
                        Field:   name,
                        Message: fmt.Sprintf("must be at most %d characters", maxVal),
                    })
                }
            case reflect.Int, reflect.Int64:
                if field.Int() > int64(maxVal) {
                    errors = append(errors, ValidationError{
                        Field:   name,
                        Message: fmt.Sprintf("must be at most %d", maxVal),
                    })
                }
            }

        case "email":
            if field.Kind() == reflect.String {
                emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
                if !emailRegex.MatchString(field.String()) {
                    errors = append(errors, ValidationError{
                        Field:   name,
                        Message: "must be a valid email address",
                    })
                }
            }
        }
    }

    return errors
}

func isZero(v reflect.Value) bool {
    switch v.Kind() {
    case reflect.String:
        return v.String() == ""
    case reflect.Int, reflect.Int64:
        return v.Int() == 0
    case reflect.Bool:
        return !v.Bool()
    case reflect.Slice, reflect.Map:
        return v.IsNil() || v.Len() == 0
    default:
        return false
    }
}

type User struct {
    Name  string `validate:"required,min=2,max=50"`
    Age   int    `validate:"required,min=0,max=150"`
    Email string `validate:"required,email"`
}

func main() {
    user := User{
        Name:  "A",
        Age:   200,
        Email: "invalid-email",
    }

    errors := Validate(user)
    for _, err := range errors {
        fmt.Println(err)
    }
}
```

Output:
```
Name: must be at least 2 characters
Age: must be at most 150
Email: must be a valid email address
```

### Dependency Injection Container

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

func (c *Container) Register(service interface{}) {
    t := reflect.TypeOf(service)
    c.services[t] = service
}

func (c *Container) Resolve(target interface{}) error {
    v := reflect.ValueOf(target)

    if v.Kind() != reflect.Pointer {
        return fmt.Errorf("target must be a pointer")
    }

    v = v.Elem()
    t := v.Type()

    service, ok := c.services[t]
    if !ok {
        // Try to find by interface
        for st, sv := range c.services {
            if st.Implements(t) || (t.Kind() == reflect.Interface && st.Implements(t)) {
                v.Set(reflect.ValueOf(sv))
                return nil
            }
        }
        return fmt.Errorf("service not found for type: %v", t)
    }

    v.Set(reflect.ValueOf(service))
    return nil
}

func (c *Container) Build(targetType reflect.Type) (interface{}, error) {
    if targetType.Kind() == reflect.Pointer {
        targetType = targetType.Elem()
    }

    if targetType.Kind() != reflect.Struct {
        return nil, fmt.Errorf("can only build struct types")
    }

    instance := reflect.New(targetType).Elem()

    for i := 0; i < targetType.NumField(); i++ {
        field := targetType.Field(i)
        if field.Tag.Get("inject") != "true" {
            continue
        }

        service, ok := c.services[field.Type]
        if ok {
            instance.Field(i).Set(reflect.ValueOf(service))
        }
    }

    return instance.Addr().Interface(), nil
}

// Services
type Logger struct{}

func (l *Logger) Log(msg string) {
    fmt.Println("[LOG]", msg)
}

type Database struct{}

func (d *Database) Query(sql string) string {
    return "Query result for: " + sql
}

// Target struct with dependencies
type UserService struct {
    Logger   *Logger   `inject:"true"`
    Database *Database `inject:"true"`
}

func (us *UserService) GetUser(id int) string {
    us.Logger.Log(fmt.Sprintf("Getting user %d", id))
    return us.Database.Query(fmt.Sprintf("SELECT * FROM users WHERE id = %d", id))
}

func main() {
    container := NewContainer()

    // Register services
    container.Register(&Logger{})
    container.Register(&Database{})

    // Build UserService with dependencies injected
    service, err := container.Build(reflect.TypeOf(UserService{}))
    if err != nil {
        fmt.Println("Error:", err)
        return
    }

    userService := service.(*UserService)
    result := userService.GetUser(123)
    fmt.Println("Result:", result)
}
```

### Deep Copy Implementation

```go
package main

import (
    "fmt"
    "reflect"
)

func DeepCopy(src interface{}) interface{} {
    srcVal := reflect.ValueOf(src)
    return deepCopyValue(srcVal).Interface()
}

func deepCopyValue(src reflect.Value) reflect.Value {
    switch src.Kind() {
    case reflect.Pointer:
        if src.IsNil() {
            return reflect.Zero(src.Type())
        }
        dst := reflect.New(src.Elem().Type())
        dst.Elem().Set(deepCopyValue(src.Elem()))
        return dst

    case reflect.Struct:
        dst := reflect.New(src.Type()).Elem()
        for i := 0; i < src.NumField(); i++ {
            if dst.Field(i).CanSet() {
                dst.Field(i).Set(deepCopyValue(src.Field(i)))
            }
        }
        return dst

    case reflect.Slice:
        if src.IsNil() {
            return reflect.Zero(src.Type())
        }
        dst := reflect.MakeSlice(src.Type(), src.Len(), src.Cap())
        for i := 0; i < src.Len(); i++ {
            dst.Index(i).Set(deepCopyValue(src.Index(i)))
        }
        return dst

    case reflect.Map:
        if src.IsNil() {
            return reflect.Zero(src.Type())
        }
        dst := reflect.MakeMap(src.Type())
        for _, key := range src.MapKeys() {
            dst.SetMapIndex(deepCopyValue(key), deepCopyValue(src.MapIndex(key)))
        }
        return dst

    case reflect.Interface:
        if src.IsNil() {
            return reflect.Zero(src.Type())
        }
        return deepCopyValue(src.Elem())

    default:
        // For basic types, return a copy
        dst := reflect.New(src.Type()).Elem()
        dst.Set(src)
        return dst
    }
}

type Address struct {
    City    string
    Country string
}

type Person struct {
    Name      string
    Age       int
    Address   *Address
    Hobbies   []string
    Metadata  map[string]string
}

func main() {
    original := Person{
        Name: "Alice",
        Age:  30,
        Address: &Address{
            City:    "New York",
            Country: "USA",
        },
        Hobbies:  []string{"reading", "coding"},
        Metadata: map[string]string{"role": "admin"},
    }

    // Deep copy
    copied := DeepCopy(original).(Person)

    // Modify original
    original.Name = "Bob"
    original.Address.City = "Los Angeles"
    original.Hobbies[0] = "gaming"
    original.Metadata["role"] = "user"

    fmt.Printf("Original: %+v\n", original)
    fmt.Printf("Original Address: %+v\n", original.Address)

    fmt.Printf("Copied: %+v\n", copied)
    fmt.Printf("Copied Address: %+v\n", copied.Address)

    // Verify they are independent
    fmt.Printf("\nOriginal hobbies: %v\n", original.Hobbies)
    fmt.Printf("Copied hobbies: %v\n", copied.Hobbies)
}
```

## Performance Considerations

### Reflection Performance Impact

Reflection operations are significantly slower than direct operations:

```go
package main

import (
    "fmt"
    "reflect"
    "time"
)

type Point struct {
    X, Y int
}

func BenchmarkDirect() time.Duration {
    start := time.Now()
    p := Point{}
    for i := 0; i < 1000000; i++ {
        p.X = i
        p.Y = i * 2
        _ = p.X + p.Y
    }
    return time.Since(start)
}

func BenchmarkReflection() time.Duration {
    start := time.Now()
    p := Point{}
    v := reflect.ValueOf(&p).Elem()
    xField := v.FieldByName("X")
    yField := v.FieldByName("Y")

    for i := 0; i < 1000000; i++ {
        xField.SetInt(int64(i))
        yField.SetInt(int64(i * 2))
        _ = xField.Int() + yField.Int()
    }
    return time.Since(start)
}

func BenchmarkCachedReflection() time.Duration {
    start := time.Now()
    p := Point{}
    v := reflect.ValueOf(&p).Elem()

    // Cache field indices
    t := v.Type()
    xIdx := -1
    yIdx := -1
    for i := 0; i < t.NumField(); i++ {
        switch t.Field(i).Name {
        case "X":
            xIdx = i
        case "Y":
            yIdx = i
        }
    }

    for i := 0; i < 1000000; i++ {
        v.Field(xIdx).SetInt(int64(i))
        v.Field(yIdx).SetInt(int64(i * 2))
        _ = v.Field(xIdx).Int() + v.Field(yIdx).Int()
    }
    return time.Since(start)
}

func main() {
    fmt.Printf("Direct access: %v\n", BenchmarkDirect())
    fmt.Printf("Reflection: %v\n", BenchmarkReflection())
    fmt.Printf("Cached reflection: %v\n", BenchmarkCachedReflection())
}
```

### Optimization Techniques

```go
package main

import (
    "reflect"
    "sync"
)

// Cache type information to avoid repeated reflection
type TypeCache struct {
    mu    sync.RWMutex
    cache map[reflect.Type]*TypeInfo
}

type TypeInfo struct {
    Fields map[string]int // field name -> index
    Type   reflect.Type
}

var globalCache = &TypeCache{
    cache: make(map[reflect.Type]*TypeInfo),
}

func (tc *TypeCache) Get(t reflect.Type) *TypeInfo {
    tc.mu.RLock()
    info, ok := tc.cache[t]
    tc.mu.RUnlock()

    if ok {
        return info
    }

    // Build type info
    tc.mu.Lock()
    defer tc.mu.Unlock()

    // Double check
    if info, ok = tc.cache[t]; ok {
        return info
    }

    info = &TypeInfo{
        Fields: make(map[string]int),
        Type:   t,
    }

    for i := 0; i < t.NumField(); i++ {
        info.Fields[t.Field(i).Name] = i
    }

    tc.cache[t] = info
    return info
}

// Use interface{} with type switch for common types
func SetFieldFast(obj interface{}, fieldName string, value interface{}) {
    v := reflect.ValueOf(obj)
    if v.Kind() != reflect.Pointer {
        return
    }
    v = v.Elem()

    info := globalCache.Get(v.Type())
    idx, ok := info.Fields[fieldName]
    if !ok {
        return
    }

    field := v.Field(idx)
    if !field.CanSet() {
        return
    }

    // Fast path for common types
    switch fv := value.(type) {
    case string:
        field.SetString(fv)
    case int:
        field.SetInt(int64(fv))
    case int64:
        field.SetInt(fv)
    case float64:
        field.SetFloat(fv)
    case bool:
        field.SetBool(fv)
    default:
        field.Set(reflect.ValueOf(value))
    }
}
```

## Best Practices

### Avoid Reflection When Possible

```go
// Bad: Using reflection for type-specific logic
func ProcessValue(v interface{}) {
    rv := reflect.ValueOf(v)
    switch rv.Kind() {
    case reflect.Int:
        fmt.Println("Int:", rv.Int())
    case reflect.String:
        fmt.Println("String:", rv.String())
    }
}

// Good: Use type switch or generics
func ProcessValueBetter(v interface{}) {
    switch val := v.(type) {
    case int:
        fmt.Println("Int:", val)
    case string:
        fmt.Println("String:", val)
    }
}

// Best: Use generics (Go 1.18+)
func ProcessValueGeneric[T any](v T) {
    fmt.Printf("Value: %v\n", v)
}
```

### Cache Reflection Results

```go
// Bad: Repeated reflection in hot path
func GetFieldValue(obj interface{}, fieldName string) interface{} {
    v := reflect.ValueOf(obj)
    t := reflect.TypeOf(obj)
    for i := 0; i < t.NumField(); i++ {
        if t.Field(i).Name == fieldName {
            return v.Field(i).Interface()
        }
    }
    return nil
}

// Good: Cache field indices
type FieldAccessor struct {
    fieldIndex map[string]int
    structType reflect.Type
}

func NewFieldAccessor(t reflect.Type) *FieldAccessor {
    accessor := &FieldAccessor{
        fieldIndex: make(map[string]int),
        structType: t,
    }
    for i := 0; i < t.NumField(); i++ {
        accessor.fieldIndex[t.Field(i).Name] = i
    }
    return accessor
}

func (fa *FieldAccessor) GetFieldValue(obj interface{}, fieldName string) interface{} {
    if idx, ok := fa.fieldIndex[fieldName]; ok {
        return reflect.ValueOf(obj).Field(idx).Interface()
    }
    return nil
}
```

### Handle Errors Gracefully

```go
func SafeSetField(obj interface{}, fieldName string, value interface{}) error {
    v := reflect.ValueOf(obj)

    // Check if pointer
    if v.Kind() != reflect.Pointer {
        return fmt.Errorf("obj must be a pointer")
    }

    v = v.Elem()

    // Check if struct
    if v.Kind() != reflect.Struct {
        return fmt.Errorf("obj must be a pointer to struct")
    }

    // Find field
    field := v.FieldByName(fieldName)
    if !field.IsValid() {
        return fmt.Errorf("field %s not found", fieldName)
    }

    // Check if settable
    if !field.CanSet() {
        return fmt.Errorf("field %s cannot be set (unexported?)", fieldName)
    }

    // Check type compatibility
    valueV := reflect.ValueOf(value)
    if !valueV.Type().AssignableTo(field.Type()) {
        return fmt.Errorf("cannot assign %v to field %s of type %v",
            valueV.Type(), fieldName, field.Type())
    }

    field.Set(valueV)
    return nil
}
```

### Document Reflection Usage

```go
// ProcessStruct iterates over all exported fields of a struct and applies
// the given function to each field.
//
// Parameters:
//   - obj: Must be a struct or pointer to struct
//   - fn: Function called for each field with (fieldName, fieldValue, fieldTag)
//
// The function uses reflection to inspect struct fields at runtime.
// For performance-critical code, consider using code generation instead.
//
// Example:
//
//	type User struct {
//	    Name string `json:"name"`
//	    Age  int    `json:"age"`
//	}
//	ProcessStruct(User{Name: "Alice", Age: 30}, func(name string, value interface{}, tag string) {
//	    fmt.Printf("%s: %v (tag: %s)\n", name, value, tag)
//	})
func ProcessStruct(obj interface{}, fn func(name string, value interface{}, tag string)) {
    // Implementation
}
```

### Use Generics Where Applicable

With Go 1.18+, many use cases that previously required reflection can now use generics:

```go
// Before: Using reflection
func ContainsReflection(slice interface{}, target interface{}) bool {
    sv := reflect.ValueOf(slice)
    for i := 0; i < sv.Len(); i++ {
        if reflect.DeepEqual(sv.Index(i).Interface(), target) {
            return true
        }
    }
    return false
}

// After: Using generics
func Contains[T comparable](slice []T, target T) bool {
    for _, item := range slice {
        if item == target {
            return true
        }
    }
    return false
}
```

## Conclusion

Go reflection is a powerful feature that enables runtime type inspection and manipulation. Key takeaways:

- **reflect.Type** provides type information, while **reflect.Value** provides value access and modification
- **Kind** represents the underlying type category (int, string, struct, etc.)
- Use **Elem()** to access the underlying value of pointers and interfaces
- Values must be **addressable** and **settable** to be modified
- **Struct tags** can be accessed via reflection for building serializers and validators
- Functions and methods can be **called dynamically** using reflection
- **Performance impact** is significant; cache reflection results when possible
- Prefer **type switches** or **generics** over reflection when possible

Reflection should be used judiciously. While it enables powerful patterns like serialization libraries, ORM frameworks, and dependency injection containers, it comes with runtime performance costs and loss of compile-time type safety. Always consider whether simpler alternatives like interfaces, type switches, or generics can solve your problem before reaching for reflection.
