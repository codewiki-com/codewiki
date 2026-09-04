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
origin: old/src/content/docs/go/reflect.zh.md
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

## 概念解释

反射（Reflection）是程序在运行时检查、修改自身结构和行为的能力。Go 语言通过标准库 `reflect` 包提供了完整的反射支持，使得程序能够在运行时动态地获取类型信息、操作任意值、调用方法等。

### 什么是反射

在静态类型语言中，变量的类型在编译时就已确定。但有时我们需要编写能够处理任意类型的通用代码，比如 JSON 序列化、ORM 映射、依赖注入等场景。反射正是解决这类问题的利器。

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    // 普通变量
    var x float64 = 3.14159

    // 通过反射获取类型和值信息
    t := reflect.TypeOf(x)
    v := reflect.ValueOf(x)

    fmt.Println("类型:", t)           // float64
    fmt.Println("值:", v)             // 3.14159
    fmt.Println("种类:", t.Kind())    // float64
    fmt.Println("是否可寻址:", v.CanAddr()) // false
}
```

### 反射的历史与背景

反射概念最早可追溯到 1982 年 Brian Cantwell Smith 的博士论文。Go 的反射设计受到了 Java、C# 等语言的影响，但采用了更加简洁的 API 设计。Rob Pike 在设计 Go 反射时，遵循了"简单优于复杂"的原则，将反射功能浓缩在两个核心类型中：`reflect.Type` 和 `reflect.Value`。

### 反射解决的问题

1. **通用序列化/反序列化**：JSON、XML、YAML 等格式的编解码
2. **ORM 框架**：数据库字段与结构体字段的映射
3. **依赖注入**：运行时动态创建和注入依赖
4. **配置解析**：将配置文件映射到结构体
5. **测试框架**：自动发现和执行测试函数
6. **RPC 框架**：动态调用远程方法

## 核心原理

### 反射三定律

Go 反射遵循三条基本定律，理解这三条定律是掌握反射的关键。

#### 定律一：从接口值到反射对象

反射可以将 `interface{}` 值转换为反射对象（`reflect.Type` 和 `reflect.Value`）。

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    var x int = 42

    // 从具体值到接口值（隐式转换）
    var i interface{} = x

    // 从接口值到反射对象
    t := reflect.TypeOf(i)
    v := reflect.ValueOf(i)

    fmt.Printf("Type: %v, Kind: %v\n", t, t.Kind())  // int, int
    fmt.Printf("Value: %v, Type: %v\n", v, v.Type()) // 42, int
}
```

#### 定律二：从反射对象到接口值

反射可以将反射对象转换回 `interface{}` 值。

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    var x float64 = 3.14

    // 到反射对象
    v := reflect.ValueOf(x)

    // 从反射对象回到接口值
    i := v.Interface()

    // 类型断言获取原始值
    f := i.(float64)
    fmt.Printf("原始值: %v\n", f) // 3.14

    // 或者直接使用 Float() 方法
    fmt.Printf("Float(): %v\n", v.Float()) // 3.14
}
```

#### 定律三：修改反射对象需要可设置性

要修改反射对象表示的值，该值必须是可设置的（settable）。可设置性由值是否可寻址（addressable）以及是否从导出字段获取决定。

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    var x float64 = 3.14

    // 错误示例：v 是 x 的副本，不可设置
    v := reflect.ValueOf(x)
    fmt.Println("直接传值，CanSet:", v.CanSet()) // false

    // 正确做法：传递指针
    p := reflect.ValueOf(&x)
    fmt.Println("传指针类型:", p.Type())         // *float64
    fmt.Println("指针本身 CanSet:", p.CanSet()) // false

    // 获取指针指向的值
    e := p.Elem()
    fmt.Println("Elem() 后 CanSet:", e.CanSet()) // true

    // 现在可以修改值了
    e.SetFloat(2.71828)
    fmt.Println("修改后 x =", x) // 2.71828
}
```

### 类型系统内部结构

Go 的类型系统在运行时由 `runtime._type` 结构表示，`reflect.Type` 是对它的封装。

```go
// 简化的内部表示（实际实现更复杂）
type _type struct {
    size       uintptr  // 类型大小
    ptrdata    uintptr  // 包含指针的字节数
    hash       uint32   // 类型哈希
    tflag      tflag    // 类型标志
    align      uint8    // 对齐
    fieldAlign uint8    // 字段对齐
    kind       uint8    // 种类
    // ...
}
```

### interface{} 的内部结构

空接口在运行时由两个指针组成：

```go
// 空接口的内部表示
type eface struct {
    _type *_type       // 类型信息
    data  unsafe.Pointer // 数据指针
}

// 非空接口的内部表示
type iface struct {
    tab  *itab         // 类型和方法表
    data unsafe.Pointer // 数据指针
}
```

这就是为什么 `reflect.TypeOf` 和 `reflect.ValueOf` 都接受 `interface{}` 参数——它们从接口的内部结构中提取类型和值信息。

## 核心要点

### reflect.Type 核心方法

| 方法 | 说明 | 适用类型 |
|------|------|----------|
| `Name()` | 返回类型名称 | 所有类型 |
| `Kind()` | 返回底层类型种类 | 所有类型 |
| `Size()` | 返回类型大小（字节） | 所有类型 |
| `NumField()` | 返回字段数量 | struct |
| `Field(i)` | 返回第 i 个字段 | struct |
| `FieldByName(name)` | 按名称查找字段 | struct |
| `NumMethod()` | 返回方法数量 | 所有类型 |
| `Method(i)` | 返回第 i 个方法 | 所有类型 |
| `Elem()` | 返回元素类型 | Array, Chan, Map, Ptr, Slice |
| `Key()` | 返回键类型 | Map |
| `NumIn()` | 返回函数参数数量 | Func |
| `NumOut()` | 返回函数返回值数量 | Func |

### reflect.Value 核心方法

| 方法 | 说明 | 注意事项 |
|------|------|----------|
| `Interface()` | 返回接口值 | 需要 CanInterface() 为 true |
| `Type()` | 返回值的类型 | 总是可用 |
| `Kind()` | 返回值的种类 | 总是可用 |
| `IsValid()` | 值是否有效 | 零值 Value 返回 false |
| `IsNil()` | 值是否为 nil | 仅适用于 chan, func, interface, map, ptr, slice |
| `IsZero()` | 是否为零值 | Go 1.13+ |
| `CanSet()` | 是否可设置 | 可寻址且导出的字段 |
| `CanAddr()` | 是否可寻址 | 从指针 Elem() 获取的值 |
| `Elem()` | 获取指针/接口的元素 | Ptr, Interface |
| `Set(v)` | 设置值 | 需要 CanSet() 为 true |
| `Call(args)` | 调用函数/方法 | Func 类型 |

### Kind 枚举值

```go
const (
    Invalid Kind = iota  // 无效
    Bool                 // 布尔
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
    Array                // 数组
    Chan                 // 通道
    Func                 // 函数
    Interface            // 接口
    Map                  // 映射
    Pointer              // 指针（Ptr 的别名）
    Slice                // 切片
    String               // 字符串
    Struct               // 结构体
    UnsafePointer        // unsafe.Pointer
)
```

## 代码示例

### reflect.Type 详解

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
    private string  // 未导出字段
}

func (p Person) Greet() string {
    return fmt.Sprintf("你好，我是 %s", p.Name)
}

func (p *Person) SetName(name string) {
    p.Name = name
}

func main() {
    p := Person{
        Name:  "张三",
        Age:   30,
        Email: "zhangsan@example.com",
        Address: Address{
            City:    "北京",
            Country: "中国",
        },
    }

    t := reflect.TypeOf(p)

    // 基本类型信息
    fmt.Println("=== 基本类型信息 ===")
    fmt.Printf("类型名称: %s\n", t.Name())       // Person
    fmt.Printf("包路径: %s\n", t.PkgPath())      // main
    fmt.Printf("类型种类: %s\n", t.Kind())       // struct
    fmt.Printf("类型大小: %d 字节\n", t.Size())  // 平台相关
    fmt.Printf("对齐边界: %d\n", t.Align())
    fmt.Printf("可比较: %t\n", t.Comparable())

    // 字段信息
    fmt.Println("\n=== 字段信息 ===")
    fmt.Printf("字段数量: %d\n", t.NumField())

    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        fmt.Printf("\n字段 %d: %s\n", i, field.Name)
        fmt.Printf("  类型: %v\n", field.Type)
        fmt.Printf("  偏移量: %d\n", field.Offset)
        fmt.Printf("  是否匿名: %t\n", field.Anonymous)
        fmt.Printf("  是否导出: %t\n", field.IsExported())
        fmt.Printf("  JSON 标签: %s\n", field.Tag.Get("json"))
        fmt.Printf("  验证标签: %s\n", field.Tag.Get("validate"))
    }

    // 按名称查找字段
    fmt.Println("\n=== 按名称查找字段 ===")
    if field, ok := t.FieldByName("Email"); ok {
        fmt.Printf("找到字段 Email: %v\n", field.Type)
    }

    // 查找嵌套字段（使用索引路径）
    if field, ok := t.FieldByName("City"); ok {
        fmt.Printf("找到嵌套字段 City: %v, 索引路径: %v\n", field.Type, field.Index)
    }

    // 方法信息
    fmt.Println("\n=== 方法信息 ===")
    fmt.Printf("值类型方法数: %d\n", t.NumMethod())
    for i := 0; i < t.NumMethod(); i++ {
        m := t.Method(i)
        fmt.Printf("方法 %d: %s, 类型: %v\n", i, m.Name, m.Type)
    }

    // 指针类型的方法（包含值类型的方法）
    pt := reflect.TypeOf(&p)
    fmt.Printf("\n指针类型方法数: %d\n", pt.NumMethod())
    for i := 0; i < pt.NumMethod(); i++ {
        m := pt.Method(i)
        fmt.Printf("方法 %d: %s, 类型: %v\n", i, m.Name, m.Type)
    }
}
```

### reflect.Value 详解

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

    // 获取值的反射对象
    v := reflect.ValueOf(cfg)

    fmt.Println("=== 基本检查 ===")
    fmt.Printf("IsValid: %t\n", v.IsValid())
    fmt.Printf("Kind: %s\n", v.Kind())
    fmt.Printf("Type: %v\n", v.Type())
    fmt.Printf("CanSet: %t\n", v.CanSet())

    // 获取指针指向的值
    elem := v.Elem()
    fmt.Printf("\nElem() 后 CanSet: %t\n", elem.CanSet())

    // 读取字段值
    fmt.Println("\n=== 读取字段值 ===")
    for i := 0; i < elem.NumField(); i++ {
        field := elem.Field(i)
        fieldType := elem.Type().Field(i)
        fmt.Printf("%s: %v (Kind: %s)\n", fieldType.Name, field.Interface(), field.Kind())
    }

    // 修改字段值
    fmt.Println("\n=== 修改字段值 ===")

    // 修改字符串
    hostField := elem.FieldByName("Host")
    if hostField.CanSet() {
        hostField.SetString("0.0.0.0")
        fmt.Printf("Host 已修改为: %s\n", cfg.Host)
    }

    // 修改整数
    portField := elem.FieldByName("Port")
    if portField.CanSet() {
        portField.SetInt(9090)
        fmt.Printf("Port 已修改为: %d\n", cfg.Port)
    }

    // 修改布尔值
    debugField := elem.FieldByName("Debug")
    if debugField.CanSet() {
        debugField.SetBool(false)
        fmt.Printf("Debug 已修改为: %t\n", cfg.Debug)
    }

    // 修改浮点数
    timeoutField := elem.FieldByName("Timeout")
    if timeoutField.CanSet() {
        timeoutField.SetFloat(60.0)
        fmt.Printf("Timeout 已修改为: %.1f\n", cfg.Timeout)
    }

    // 修改切片
    fmt.Println("\n=== 修改切片 ===")
    tagsField := elem.FieldByName("Tags")
    if tagsField.CanSet() {
        // 追加元素
        newTags := reflect.Append(tagsField, reflect.ValueOf("v2"))
        tagsField.Set(newTags)
        fmt.Printf("Tags: %v\n", cfg.Tags)

        // 修改单个元素
        tagsField.Index(0).SetString("core-api")
        fmt.Printf("修改后 Tags: %v\n", cfg.Tags)
    }

    // 修改映射
    fmt.Println("\n=== 修改映射 ===")
    metaField := elem.FieldByName("Metadata")
    // 设置键值对
    metaField.SetMapIndex(reflect.ValueOf("version"), reflect.ValueOf("1.0"))
    fmt.Printf("Metadata: %v\n", cfg.Metadata)

    // 删除键值对（设置为零值 Value）
    metaField.SetMapIndex(reflect.ValueOf("env"), reflect.Value{})
    fmt.Printf("删除 env 后 Metadata: %v\n", cfg.Metadata)

    // 检查特殊状态
    fmt.Println("\n=== 特殊状态检查 ===")
    var nilPtr *Config
    nilV := reflect.ValueOf(nilPtr)
    fmt.Printf("nil 指针 IsNil: %t\n", nilV.IsNil())

    var zeroConfig Config
    zeroV := reflect.ValueOf(zeroConfig)
    fmt.Printf("零值结构体 IsZero: %t\n", zeroV.IsZero())
}
```

### 结构体标签解析

```go
package main

import (
    "fmt"
    "reflect"
    "strconv"
    "strings"
)

// 字段元数据
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

// 解析结构体标签
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

        // 解析 json 标签
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

        // 解析 db 标签
        meta.DBColumn = field.Tag.Get("db")

        // 解析 validate 标签
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

        // 解析 default 标签
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

    fmt.Println("=== User 结构体字段元数据 ===")
    for _, meta := range metas {
        fmt.Printf("\n字段: %s\n", meta.Name)
        fmt.Printf("  JSON 名称: %s\n", meta.JSONName)
        fmt.Printf("  数据库列: %s\n", meta.DBColumn)
        fmt.Printf("  必填: %t\n", meta.Required)
        if meta.Min != nil {
            fmt.Printf("  最小值: %d\n", *meta.Min)
        }
        if meta.Max != nil {
            fmt.Printf("  最大值: %d\n", *meta.Max)
        }
        if meta.Default != "" {
            fmt.Printf("  默认值: %s\n", meta.Default)
        }
        fmt.Printf("  忽略空值: %t\n", meta.OmitEmpty)
    }
}
```

### 动态设置值

```go
package main

import (
    "fmt"
    "reflect"
)

// 通用的值设置函数
func SetField(obj interface{}, fieldName string, value interface{}) error {
    v := reflect.ValueOf(obj)

    // 必须是指针
    if v.Kind() != reflect.Ptr {
        return fmt.Errorf("obj 必须是指针类型")
    }

    // 获取指针指向的值
    v = v.Elem()

    // 必须是结构体
    if v.Kind() != reflect.Struct {
        return fmt.Errorf("obj 必须指向结构体")
    }

    // 查找字段
    field := v.FieldByName(fieldName)
    if !field.IsValid() {
        return fmt.Errorf("字段 %s 不存在", fieldName)
    }

    // 检查是否可设置
    if !field.CanSet() {
        return fmt.Errorf("字段 %s 不可设置（可能是未导出字段）", fieldName)
    }

    // 获取要设置的值
    val := reflect.ValueOf(value)

    // 类型检查
    if !val.Type().AssignableTo(field.Type()) {
        // 尝试类型转换
        if val.Type().ConvertibleTo(field.Type()) {
            val = val.Convert(field.Type())
        } else {
            return fmt.Errorf("类型不匹配: 期望 %v, 得到 %v", field.Type(), val.Type())
        }
    }

    field.Set(val)
    return nil
}

// 批量设置字段
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

    // 单个字段设置
    fmt.Println("=== 单个字段设置 ===")
    SetField(server, "Host", "127.0.0.1")
    SetField(server, "Port", 8080)
    SetField(server, "Timeout", 30.5)
    SetField(server, "Debug", true)
    fmt.Printf("Server: %+v\n", server)

    // 批量设置
    fmt.Println("\n=== 批量设置 ===")
    server2 := &Server{}
    errs := SetFields(server2, map[string]interface{}{
        "Host":    "0.0.0.0",
        "Port":    9090,
        "Timeout": 60.0,
        "Debug":   false,
    })
    if len(errs) > 0 {
        for _, err := range errs {
            fmt.Printf("错误: %v\n", err)
        }
    }
    fmt.Printf("Server2: %+v\n", server2)

    // 错误处理演示
    fmt.Println("\n=== 错误处理 ===")
    err := SetField(server, "InvalidField", "test")
    fmt.Printf("设置不存在的字段: %v\n", err)

    err = SetField(server, "Port", "not a number")
    fmt.Printf("类型不匹配: %v\n", err)
}
```

### 动态方法调用

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
        return 0, fmt.Errorf("除数不能为零")
    }
    return a / b, nil
}

func (c *Calculator) SetPrecision(p int) {
    c.precision = p
}

func (c Calculator) GetPrecision() int {
    return c.precision
}

// 通用方法调用器
func InvokeMethod(obj interface{}, methodName string, args ...interface{}) ([]interface{}, error) {
    v := reflect.ValueOf(obj)

    // 查找方法
    method := v.MethodByName(methodName)
    if !method.IsValid() {
        return nil, fmt.Errorf("方法 %s 不存在", methodName)
    }

    // 检查参数数量
    methodType := method.Type()
    if len(args) != methodType.NumIn() {
        return nil, fmt.Errorf("参数数量不匹配: 期望 %d, 得到 %d", methodType.NumIn(), len(args))
    }

    // 转换参数
    in := make([]reflect.Value, len(args))
    for i, arg := range args {
        argVal := reflect.ValueOf(arg)
        expectedType := methodType.In(i)

        // 类型检查和转换
        if !argVal.Type().AssignableTo(expectedType) {
            if argVal.Type().ConvertibleTo(expectedType) {
                argVal = argVal.Convert(expectedType)
            } else {
                return nil, fmt.Errorf("参数 %d 类型不匹配", i)
            }
        }
        in[i] = argVal
    }

    // 调用方法
    results := method.Call(in)

    // 转换返回值
    out := make([]interface{}, len(results))
    for i, result := range results {
        out[i] = result.Interface()
    }

    return out, nil
}

// 带类型检查的方法信息获取
func GetMethodInfo(obj interface{}) {
    t := reflect.TypeOf(obj)

    fmt.Printf("类型 %v 的方法:\n", t)
    for i := 0; i < t.NumMethod(); i++ {
        m := t.Method(i)
        fmt.Printf("\n  %s:\n", m.Name)
        fmt.Printf("    签名: %v\n", m.Type)

        // 参数信息（跳过接收者）
        fmt.Printf("    参数: ")
        for j := 1; j < m.Type.NumIn(); j++ {
            if j > 1 {
                fmt.Print(", ")
            }
            fmt.Printf("%v", m.Type.In(j))
        }
        fmt.Println()

        // 返回值信息
        fmt.Printf("    返回值: ")
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

    // 获取方法信息
    fmt.Println("=== 方法信息 ===")
    GetMethodInfo(calc)

    // 调用方法
    fmt.Println("\n=== 调用方法 ===")

    // 调用 Add
    result, err := InvokeMethod(calc, "Add", 10.5, 20.3)
    if err != nil {
        fmt.Printf("错误: %v\n", err)
    } else {
        fmt.Printf("Add(10.5, 20.3) = %v\n", result[0])
    }

    // 调用 Multiply
    result, err = InvokeMethod(calc, "Multiply", 6.0, 7.0)
    if err != nil {
        fmt.Printf("错误: %v\n", err)
    } else {
        fmt.Printf("Multiply(6.0, 7.0) = %v\n", result[0])
    }

    // 调用 Divide（有多个返回值）
    result, err = InvokeMethod(calc, "Divide", 10.0, 3.0)
    if err != nil {
        fmt.Printf("错误: %v\n", err)
    } else {
        fmt.Printf("Divide(10.0, 3.0) = %v, error = %v\n", result[0], result[1])
    }

    // 调用 Divide（除零错误）
    result, err = InvokeMethod(calc, "Divide", 10.0, 0.0)
    if err != nil {
        fmt.Printf("错误: %v\n", err)
    } else {
        fmt.Printf("Divide(10.0, 0.0) = %v, error = %v\n", result[0], result[1])
    }

    // 调用指针接收者方法
    _, err = InvokeMethod(calc, "SetPrecision", 4)
    if err != nil {
        fmt.Printf("错误: %v\n", err)
    } else {
        fmt.Printf("SetPrecision(4) 成功, 当前精度: %d\n", calc.precision)
    }
}
```

### 动态创建类型实例

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
    // 获取类型
    userType := reflect.TypeOf(User{})

    // 创建新实例（返回指针）
    fmt.Println("=== 创建实例 ===")
    newUserPtr := reflect.New(userType)
    fmt.Printf("类型: %v\n", newUserPtr.Type()) // *main.User

    // 设置字段值
    newUser := newUserPtr.Elem()
    newUser.FieldByName("ID").SetInt(1)
    newUser.FieldByName("Name").SetString("张三")
    newUser.FieldByName("Age").SetInt(25)

    // 转换回具体类型
    user := newUserPtr.Interface().(*User)
    fmt.Printf("创建的用户: %+v\n", user)

    // 创建零值
    fmt.Println("\n=== 创建零值 ===")
    zeroUser := reflect.Zero(userType)
    fmt.Printf("零值用户: %+v\n", zeroUser.Interface())

    // 创建切片
    fmt.Println("\n=== 创建切片 ===")
    sliceType := reflect.SliceOf(userType)
    slice := reflect.MakeSlice(sliceType, 0, 10)

    // 追加元素
    slice = reflect.Append(slice, reflect.ValueOf(User{ID: 1, Name: "用户1", Age: 20}))
    slice = reflect.Append(slice, reflect.ValueOf(User{ID: 2, Name: "用户2", Age: 25}))

    fmt.Printf("切片类型: %v\n", slice.Type())
    fmt.Printf("切片内容: %v\n", slice.Interface())

    // 创建映射
    fmt.Println("\n=== 创建映射 ===")
    mapType := reflect.MapOf(reflect.TypeOf(""), userType)
    m := reflect.MakeMap(mapType)

    m.SetMapIndex(reflect.ValueOf("user1"), reflect.ValueOf(User{ID: 1, Name: "Alice", Age: 30}))
    m.SetMapIndex(reflect.ValueOf("user2"), reflect.ValueOf(User{ID: 2, Name: "Bob", Age: 28}))

    fmt.Printf("映射类型: %v\n", m.Type())
    fmt.Printf("映射内容: %v\n", m.Interface())

    // 遍历映射
    fmt.Println("\n映射遍历:")
    iter := m.MapRange()
    for iter.Next() {
        fmt.Printf("  %v: %+v\n", iter.Key().Interface(), iter.Value().Interface())
    }

    // 创建通道
    fmt.Println("\n=== 创建通道 ===")
    chanType := reflect.ChanOf(reflect.BothDir, reflect.TypeOf(0))
    ch := reflect.MakeChan(chanType, 5)

    // 发送和接收
    ch.Send(reflect.ValueOf(42))
    ch.Send(reflect.ValueOf(100))

    val, ok := ch.TryRecv()
    fmt.Printf("接收: %v, ok: %v\n", val.Interface(), ok)

    // 创建函数
    fmt.Println("\n=== 动态创建函数 ===")
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
    fmt.Printf("动态函数 add(10, 20) = %v\n", result[0].Interface())

    // 转换为具体函数类型
    add := addFunc.Interface().(func(int, int) int)
    fmt.Printf("类型断言后调用: add(5, 3) = %d\n", add(5, 3))
}
```

## 最佳实践

### 优先使用接口而非反射

```go
// 好的做法：使用接口
type Serializer interface {
    Serialize() ([]byte, error)
}

func Save(s Serializer) error {
    data, err := s.Serialize()
    if err != nil {
        return err
    }
    // 保存 data...
    return nil
}

// 避免的做法：使用反射处理已知类型
func SaveBad(v interface{}) error {
    val := reflect.ValueOf(v)
    // 大量反射代码...
    return nil
}
```

### 缓存反射信息

```go
package main

import (
    "reflect"
    "sync"
)

// 类型信息缓存
type TypeInfo struct {
    Type       reflect.Type
    Fields     map[string]int      // 字段名到索引的映射
    FieldTypes map[string]reflect.Type
}

var (
    typeCache = make(map[reflect.Type]*TypeInfo)
    cacheMu   sync.RWMutex
)

// 获取或创建类型信息
func GetTypeInfo(t reflect.Type) *TypeInfo {
    if t.Kind() == reflect.Ptr {
        t = t.Elem()
    }

    // 先尝试读取缓存
    cacheMu.RLock()
    info, ok := typeCache[t]
    cacheMu.RUnlock()
    if ok {
        return info
    }

    // 创建新的类型信息
    cacheMu.Lock()
    defer cacheMu.Unlock()

    // 双重检查
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

// 使用缓存的类型信息快速访问字段
func GetFieldFast(v reflect.Value, info *TypeInfo, fieldName string) reflect.Value {
    if idx, ok := info.Fields[fieldName]; ok {
        return v.Field(idx)
    }
    return reflect.Value{}
}
```

### 安全的反射操作

```go
package main

import (
    "fmt"
    "reflect"
)

// 安全地获取字段值
func SafeGetField(v interface{}, name string) (interface{}, error) {
    val := reflect.ValueOf(v)

    // 处理指针
    if val.Kind() == reflect.Ptr {
        if val.IsNil() {
            return nil, fmt.Errorf("nil 指针")
        }
        val = val.Elem()
    }

    // 检查是否为结构体
    if val.Kind() != reflect.Struct {
        return nil, fmt.Errorf("不是结构体类型: %v", val.Kind())
    }

    // 查找字段
    field := val.FieldByName(name)
    if !field.IsValid() {
        return nil, fmt.Errorf("字段 %s 不存在", name)
    }

    // 检查是否可访问
    if !field.CanInterface() {
        return nil, fmt.Errorf("字段 %s 不可访问（未导出）", name)
    }

    return field.Interface(), nil
}

// 安全地设置字段值
func SafeSetField(v interface{}, name string, value interface{}) error {
    val := reflect.ValueOf(v)

    // 必须是指针
    if val.Kind() != reflect.Ptr {
        return fmt.Errorf("必须传入指针")
    }

    if val.IsNil() {
        return fmt.Errorf("nil 指针")
    }

    val = val.Elem()

    if val.Kind() != reflect.Struct {
        return fmt.Errorf("不是结构体类型")
    }

    field := val.FieldByName(name)
    if !field.IsValid() {
        return fmt.Errorf("字段 %s 不存在", name)
    }

    if !field.CanSet() {
        return fmt.Errorf("字段 %s 不可设置", name)
    }

    newVal := reflect.ValueOf(value)
    if !newVal.Type().AssignableTo(field.Type()) {
        return fmt.Errorf("类型不匹配: 期望 %v, 得到 %v", field.Type(), newVal.Type())
    }

    field.Set(newVal)
    return nil
}

// 安全地调用方法
func SafeInvokeMethod(v interface{}, name string, args ...interface{}) (results []interface{}, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("方法调用 panic: %v", r)
        }
    }()

    val := reflect.ValueOf(v)
    method := val.MethodByName(name)

    if !method.IsValid() {
        return nil, fmt.Errorf("方法 %s 不存在", name)
    }

    // 转换参数
    in := make([]reflect.Value, len(args))
    for i, arg := range args {
        in[i] = reflect.ValueOf(arg)
    }

    // 调用方法
    out := method.Call(in)

    // 转换返回值
    results = make([]interface{}, len(out))
    for i, r := range out {
        results[i] = r.Interface()
    }

    return results, nil
}
```

### 减少热路径中的反射

```go
// 在初始化时完成反射操作
type Encoder struct {
    fieldIndices map[string][]int
    fieldTypes   map[string]reflect.Type
}

func NewEncoder(t reflect.Type) *Encoder {
    enc := &Encoder{
        fieldIndices: make(map[string][]int),
        fieldTypes:   make(map[string]reflect.Type),
    }

    // 一次性解析所有字段信息
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

// 使用预计算的索引快速访问
func (e *Encoder) GetField(v reflect.Value, name string) reflect.Value {
    if idx, ok := e.fieldIndices[name]; ok {
        return v.FieldByIndex(idx)
    }
    return reflect.Value{}
}
```

## 常见陷阱

### 对不可寻址的值调用 Set

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    x := 42

    // 错误：传值产生副本，不可设置
    v := reflect.ValueOf(x)
    fmt.Println("CanSet:", v.CanSet()) // false
    // v.SetInt(100) // panic!

    // 正确：传指针
    v = reflect.ValueOf(&x).Elem()
    fmt.Println("CanSet:", v.CanSet()) // true
    v.SetInt(100)
    fmt.Println("x =", x) // 100
}
```

### 对 nil 接口调用反射方法

```go
package main

import (
    "fmt"
    "reflect"
)

func main() {
    var i interface{}

    // TypeOf 返回 nil
    t := reflect.TypeOf(i)
    fmt.Println("TypeOf nil:", t) // <nil>

    // ValueOf 返回无效 Value
    v := reflect.ValueOf(i)
    fmt.Println("IsValid:", v.IsValid()) // false
    // v.Kind() // panic if we don't check IsValid first

    // 正确做法：先检查
    if v.IsValid() {
        fmt.Println("Kind:", v.Kind())
    }
}
```

### 接口值为 nil 的陷阱

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

    // i 不为 nil！因为接口有类型信息
    fmt.Println("i == nil:", i == nil) // false

    v := reflect.ValueOf(i)
    fmt.Println("IsValid:", v.IsValid()) // true
    fmt.Println("IsNil:", v.IsNil())     // true
    fmt.Println("Type:", v.Type())       // *main.MyWriter

    // 正确检查 nil 的方式
    if v.IsValid() && (v.Kind() == reflect.Ptr || v.Kind() == reflect.Interface) && v.IsNil() {
        fmt.Println("实际上是 nil")
    }
}
```

### 修改未导出字段

```go
package main

import (
    "fmt"
    "reflect"
    "unsafe"
)

type secret struct {
    public  string
    private string // 未导出
}

func main() {
    s := &secret{public: "公开", private: "私密"}

    v := reflect.ValueOf(s).Elem()

    // 可以读取未导出字段（使用 unsafe）
    privateField := v.FieldByName("private")
    fmt.Println("CanSet:", privateField.CanSet())       // false
    fmt.Println("CanInterface:", privateField.CanInterface()) // false

    // 不推荐：使用 unsafe 读取（仅用于调试）
    ptr := unsafe.Pointer(privateField.UnsafeAddr())
    realValue := *(*string)(ptr)
    fmt.Println("私密值（unsafe）:", realValue)

    // 正常方式无法修改未导出字段
    // privateField.SetString("新值") // panic!
}
```

### 忽略方法集的差异

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

    // 值类型只有值接收者的方法
    vt := reflect.TypeOf(c)
    fmt.Printf("Counter 方法数: %d\n", vt.NumMethod()) // 1 (只有 Get)

    // 指针类型有所有方法
    pt := reflect.TypeOf(&c)
    fmt.Printf("*Counter 方法数: %d\n", pt.NumMethod()) // 2 (Get 和 Inc)

    // 通过值调用指针方法会失败
    v := reflect.ValueOf(c)
    incMethod := v.MethodByName("Inc")
    fmt.Println("值类型有 Inc:", incMethod.IsValid()) // false

    // 通过指针可以调用所有方法
    pv := reflect.ValueOf(&c)
    incMethod = pv.MethodByName("Inc")
    fmt.Println("指针类型有 Inc:", incMethod.IsValid()) // true
}
```

## 性能考量

### 反射性能对比

```go
package main

import (
    "reflect"
    "testing"
)

type Point struct {
    X, Y int
}

// 直接访问
func BenchmarkDirect(b *testing.B) {
    p := Point{X: 10, Y: 20}
    for i := 0; i < b.N; i++ {
        _ = p.X + p.Y
    }
}

// 反射访问（每次都获取）
func BenchmarkReflect(b *testing.B) {
    p := Point{X: 10, Y: 20}
    for i := 0; i < b.N; i++ {
        v := reflect.ValueOf(p)
        _ = v.FieldByName("X").Int() + v.FieldByName("Y").Int()
    }
}

// 反射访问（缓存 Value）
func BenchmarkReflectCached(b *testing.B) {
    p := Point{X: 10, Y: 20}
    v := reflect.ValueOf(p)
    for i := 0; i < b.N; i++ {
        _ = v.FieldByName("X").Int() + v.FieldByName("Y").Int()
    }
}

// 反射访问（缓存索引）
func BenchmarkReflectIndex(b *testing.B) {
    p := Point{X: 10, Y: 20}
    v := reflect.ValueOf(p)
    for i := 0; i < b.N; i++ {
        _ = v.Field(0).Int() + v.Field(1).Int()
    }
}
```

典型结果：
- 直接访问：~0.3 ns/op
- 反射（每次获取）：~200 ns/op
- 反射（缓存 Value）：~100 ns/op
- 反射（使用索引）：~50 ns/op

### 性能优化策略

1. **缓存 reflect.Type 和字段索引**
2. **避免在循环中调用 TypeOf/ValueOf**
3. **使用 Field(i) 而非 FieldByName**
4. **考虑代码生成替代运行时反射**
5. **对性能敏感的代码使用接口**

```go
// 优化示例：预计算字段信息
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

## 实战场景

### 场景一：简易 JSON 序列化器

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
    secret  string   // 未导出，不序列化
}

func main() {
    person := Person{
        Name: "张三",
        Age:  30,
        Address: &Address{
            City:    "北京",
            Country: "中国",
        },
        Tags:   []string{"Go", "反射"},
        secret: "隐藏数据",
    }

    json := ToJSON(person)
    fmt.Println("JSON 输出:")
    fmt.Println(json)
}
```

### 场景二：配置解析器

```go
package main

import (
    "fmt"
    "os"
    "reflect"
    "strconv"
    "strings"
)

// 从环境变量填充配置结构体
func LoadConfigFromEnv(cfg interface{}, prefix string) error {
    v := reflect.ValueOf(cfg)
    if v.Kind() != reflect.Ptr || v.IsNil() {
        return fmt.Errorf("cfg 必须是非空指针")
    }

    v = v.Elem()
    if v.Kind() != reflect.Struct {
        return fmt.Errorf("cfg 必须指向结构体")
    }

    t := v.Type()

    for i := 0; i < v.NumField(); i++ {
        field := t.Field(i)
        fieldValue := v.Field(i)

        if !fieldValue.CanSet() {
            continue
        }

        // 获取环境变量名
        envName := field.Tag.Get("env")
        if envName == "" {
            envName = strings.ToUpper(prefix + "_" + toSnakeCase(field.Name))
        }

        // 获取环境变量值
        envValue := os.Getenv(envName)
        if envValue == "" {
            // 使用默认值
            if defaultVal := field.Tag.Get("default"); defaultVal != "" {
                envValue = defaultVal
            } else {
                continue
            }
        }

        // 设置字段值
        if err := setFieldValue(fieldValue, envValue); err != nil {
            return fmt.Errorf("设置字段 %s 失败: %v", field.Name, err)
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
        // 简单处理字符串切片
        if field.Type().Elem().Kind() == reflect.String {
            parts := strings.Split(value, ",")
            slice := reflect.MakeSlice(field.Type(), len(parts), len(parts))
            for i, part := range parts {
                slice.Index(i).SetString(strings.TrimSpace(part))
            }
            field.Set(slice)
        }
    default:
        return fmt.Errorf("不支持的类型: %v", field.Kind())
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
    // 模拟设置环境变量
    os.Setenv("DB_HOST", "db.example.com")
    os.Setenv("DB_PORT", "3306")
    os.Setenv("DB_USER", "admin")

    cfg := &DatabaseConfig{}
    if err := LoadConfigFromEnv(cfg, "APP"); err != nil {
        fmt.Printf("加载配置失败: %v\n", err)
        return
    }

    fmt.Printf("数据库配置:\n")
    fmt.Printf("  Host: %s\n", cfg.Host)
    fmt.Printf("  Port: %d\n", cfg.Port)
    fmt.Printf("  Username: %s\n", cfg.Username)
    fmt.Printf("  Database: %s\n", cfg.Database)
    fmt.Printf("  SSLMode: %t\n", cfg.SSLMode)
    fmt.Printf("  Options: %v\n", cfg.Options)
}
```

### 场景三：简易依赖注入容器

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

// 注册服务
func (c *Container) Register(service interface{}) {
    t := reflect.TypeOf(service)
    c.services[t] = service
}

// 注册接口实现
func (c *Container) RegisterAs(interfaceType reflect.Type, service interface{}) {
    c.services[interfaceType] = service
}

// 解析依赖并创建实例
func (c *Container) Resolve(targetType reflect.Type) (interface{}, error) {
    // 如果是指针，获取元素类型
    isPtr := targetType.Kind() == reflect.Ptr
    elemType := targetType
    if isPtr {
        elemType = targetType.Elem()
    }

    if elemType.Kind() != reflect.Struct {
        // 尝试直接从容器获取
        if service, ok := c.services[targetType]; ok {
            return service, nil
        }
        return nil, fmt.Errorf("无法解析类型: %v", targetType)
    }

    // 创建新实例
    instance := reflect.New(elemType).Elem()

    // 注入依赖
    for i := 0; i < elemType.NumField(); i++ {
        field := elemType.Field(i)

        // 检查是否需要注入
        if _, ok := field.Tag.Lookup("inject"); !ok {
            continue
        }

        // 查找匹配的服务
        fieldType := field.Type
        service, ok := c.services[fieldType]
        if !ok {
            return nil, fmt.Errorf("未找到类型 %v 的服务", fieldType)
        }

        // 设置字段
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

// 示例服务
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
    fmt.Printf("执行查询: %s\n", sql)
}

// 需要注入的服务
type UserService struct {
    Logger   Logger    `inject:""`
    Database *Database `inject:""`
}

func (s *UserService) CreateUser(name string) {
    s.Logger.Log(fmt.Sprintf("创建用户: %s", name))
    s.Database.Query(fmt.Sprintf("INSERT INTO users (name) VALUES ('%s')", name))
}

func main() {
    container := NewContainer()

    // 注册服务
    logger := &ConsoleLogger{prefix: "APP"}
    container.RegisterAs(reflect.TypeOf((*Logger)(nil)).Elem(), logger)
    container.Register(&Database{connectionString: "localhost:5432"})

    // 解析服务
    service, err := container.Resolve(reflect.TypeOf(&UserService{}))
    if err != nil {
        fmt.Printf("解析失败: %v\n", err)
        return
    }

    userService := service.(*UserService)
    userService.CreateUser("张三")
}
```

## 面试要点

### Q1: reflect.TypeOf 和 reflect.ValueOf 有什么区别？

**答案**：
- `reflect.TypeOf(x)` 返回 `reflect.Type`，表示变量的类型信息（元数据），是静态的
- `reflect.ValueOf(x)` 返回 `reflect.Value`，表示变量的值，可以用于读取或修改
- TypeOf 主要用于类型检查、获取字段和方法信息
- ValueOf 主要用于读写值、调用方法

```go
x := 42
t := reflect.TypeOf(x)  // int (类型信息)
v := reflect.ValueOf(x) // 42 (值)
```

### Q2: 如何通过反射修改变量的值？

**答案**：
1. 必须传递变量的指针
2. 使用 `Elem()` 获取指针指向的值
3. 使用对应的 `Set*` 方法修改

```go
x := 10
v := reflect.ValueOf(&x).Elem()
v.SetInt(20)
fmt.Println(x) // 20
```

### Q3: Kind 和 Type 有什么区别？

**答案**：
- `Type` 是具体的类型名，如 `main.Person`、`int`
- `Kind` 是底层类型种类，如 `struct`、`int`、`ptr`
- 自定义类型 `type MyInt int`，Type 是 `MyInt`，Kind 是 `int`

### Q4: 反射的性能开销有多大？如何优化？

**答案**：
- 反射通常比直接访问慢 10-100 倍
- 优化策略：
  1. 缓存 Type 和字段索引
  2. 避免在循环中重复调用 TypeOf/ValueOf
  3. 使用 Field(i) 代替 FieldByName
  4. 考虑代码生成替代运行时反射

### Q5: 什么情况下应该使用反射？

**答案**：
适合使用：
- 通用序列化/反序列化框架
- ORM 和数据库映射
- 依赖注入容器
- 配置解析
- 测试框架

不适合使用：
- 性能敏感的热路径代码
- 类型在编译时已知
- 可以用接口实现的多态

### Q6: 如何判断一个接口值是否为 nil？

**答案**：
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

注意：接口值为 nil 和接口持有 nil 值是不同的。

## 延伸阅读

### 官方文档
- [reflect 包官方文档](https://pkg.go.dev/reflect)
- [The Laws of Reflection](https://go.dev/blog/laws-of-reflection) - Rob Pike 的反射三定律

### 推荐书籍
- 《Go 语言程序设计》（The Go Programming Language）- Alan Donovan, Brian Kernighan
- 《Go 语言高级编程》- 柴树杉、曹春晖

### 优质文章
- [Go 反射机制详解](https://draveness.me/golang/docs/part2-foundation/ch04-basic/golang-reflect/)
- [深入理解 Go 接口与反射](https://research.swtch.com/interfaces)

### 相关源码
- [encoding/json](https://github.com/golang/go/tree/master/src/encoding/json) - 标准库 JSON 实现
- [jinzhu/copier](https://github.com/jinzhu/copier) - 结构体复制库
- [mitchellh/mapstructure](https://github.com/mitchellh/mapstructure) - map 到结构体转换

### 代码生成替代方案
- [go generate](https://go.dev/blog/generate) - Go 代码生成
- [easyjson](https://github.com/mailru/easyjson) - 高性能 JSON 库（使用代码生成）
