---
title: Go 错误处理
description: 掌握 Go 错误处理：error 接口、错误包装、panic 与 recover
track: go
section: basics
difficulty: intermediate
tags:
  - Go
  - 错误处理
  - error
  - panic
status: imported
origin: old/src/content/docs/go/error-handling.zh.md
divergence: 0.163
issues: []
legacy:
  category: Go
  subcategory: 错误处理
  order: 5
  lastUpdated: 2026-01-07
---

Go 语言采用显式错误处理的方式,通过返回值而非异常来处理错误。这种设计哲学使得错误处理更加清晰和可控。

## error 接口

Go 中的 `error` 是一个内置接口类型,定义非常简单:

```go
type error interface {
    Error() string
}
```

任何实现了 `Error()` 方法的类型都可以作为错误使用。

### 基本错误处理

```go
package main

import (
    "fmt"
    "os"
)

func readFile(filename string) ([]byte, error) {
    data, err := os.ReadFile(filename)
    if err != nil {
        return nil, err
    }
    return data, nil
}

func main() {
    data, err := readFile("test.txt")
    if err != nil {
        fmt.Printf("读取文件失败: %v\n", err)
        return
    }
    fmt.Printf("文件内容: %s\n", data)
}
```

## 错误创建

### 使用 errors.New

最简单的创建错误的方法:

```go
package main

import (
    "errors"
    "fmt"
)

var (
    ErrNotFound     = errors.New("资源未找到")
    ErrUnauthorized = errors.New("未授权访问")
    ErrInvalidInput = errors.New("无效的输入")
)

func findUser(id int) error {
    if id <= 0 {
        return ErrInvalidInput
    }
    if id > 1000 {
        return ErrNotFound
    }
    return nil
}

func main() {
    err := findUser(1001)
    if err != nil {
        fmt.Printf("错误: %v\n", err) // 错误: 资源未找到
    }
}
```

### 使用 fmt.Errorf

可以格式化错误消息:

```go
package main

import (
    "fmt"
)

func validateAge(age int) error {
    if age < 0 {
        return fmt.Errorf("年龄不能为负数: %d", age)
    }
    if age > 150 {
        return fmt.Errorf("年龄超出合理范围: %d", age)
    }
    return nil
}

func main() {
    err := validateAge(-5)
    if err != nil {
        fmt.Println(err) // 年龄不能为负数: -5
    }
}
```

## 错误包装 (Go 1.13+)

### 使用 %w 包装错误

`%w` 动词用于包装错误,保留原始错误信息:

```go
package main

import (
    "fmt"
    "os"
)

func readConfig(filename string) error {
    _, err := os.ReadFile(filename)
    if err != nil {
        // 使用 %w 包装原始错误
        return fmt.Errorf("读取配置文件失败 %s: %w", filename, err)
    }
    return nil
}

func loadApp() error {
    err := readConfig("config.json")
    if err != nil {
        return fmt.Errorf("应用初始化失败: %w", err)
    }
    return nil
}

func main() {
    err := loadApp()
    if err != nil {
        fmt.Printf("错误: %v\n", err)
        // 错误: 应用初始化失败: 读取配置文件失败 config.json: open config.json: no such file or directory
    }
}
```

### errors.Is 检查错误

`errors.Is` 用于检查错误链中是否包含特定错误:

```go
package main

import (
    "errors"
    "fmt"
    "os"
)

var ErrNotFound = errors.New("未找到")

func getUser(id int) error {
    if id == 0 {
        return fmt.Errorf("用户查询失败: %w", ErrNotFound)
    }
    return nil
}

func main() {
    err := getUser(0)

    // 使用 errors.Is 检查错误
    if errors.Is(err, ErrNotFound) {
        fmt.Println("用户不存在")
    }

    // 也可以检查系统错误
    _, err = os.Open("nonexistent.txt")
    if errors.Is(err, os.ErrNotExist) {
        fmt.Println("文件不存在")
    }
}
```

### errors.As 提取错误类型

`errors.As` 用于从错误链中提取特定类型的错误:

```go
package main

import (
    "errors"
    "fmt"
    "os"
)

func processFile(filename string) error {
    _, err := os.Open(filename)
    if err != nil {
        return fmt.Errorf("处理文件失败: %w", err)
    }
    return nil
}

func main() {
    err := processFile("test.txt")

    // 使用 errors.As 提取 *os.PathError
    var pathErr *os.PathError
    if errors.As(err, &pathErr) {
        fmt.Printf("操作: %s\n", pathErr.Op)   // 操作: open
        fmt.Printf("路径: %s\n", pathErr.Path) // 路径: test.txt
        fmt.Printf("错误: %v\n", pathErr.Err)  // 错误: no such file or directory
    }
}
```

## 自定义错误类型

### 结构体错误类型

创建包含更多上下文信息的错误类型:

```go
package main

import (
    "fmt"
)

// ValidationError 自定义验证错误
type ValidationError struct {
    Field   string
    Value   interface{}
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("验证失败 [%s=%v]: %s", e.Field, e.Value, e.Message)
}

// 验证用户输入
func validateUser(name string, age int) error {
    if name == "" {
        return &ValidationError{
            Field:   "name",
            Value:   name,
            Message: "姓名不能为空",
        }
    }
    if age < 0 || age > 150 {
        return &ValidationError{
            Field:   "age",
            Value:   age,
            Message: "年龄必须在 0-150 之间",
        }
    }
    return nil
}

func main() {
    err := validateUser("", 25)
    if err != nil {
        fmt.Println(err) // 验证失败 [name=]: 姓名不能为空

        // 类型断言获取详细信息
        if verr, ok := err.(*ValidationError); ok {
            fmt.Printf("字段: %s, 值: %v\n", verr.Field, verr.Value)
        }
    }
}
```

### 带状态码的错误

```go
package main

import (
    "errors"
    "fmt"
)

// AppError 应用错误类型
type AppError struct {
    Code    int
    Message string
    Err     error
}

func (e *AppError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Err)
    }
    return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

// Unwrap 实现 Unwrap 方法以支持 errors.Is 和 errors.As
func (e *AppError) Unwrap() error {
    return e.Err
}

// 预定义错误码
const (
    CodeNotFound      = 404
    CodeUnauthorized  = 401
    CodeInternalError = 500
)

func getResource(id int) error {
    if id == 0 {
        return &AppError{
            Code:    CodeNotFound,
            Message: "资源未找到",
        }
    }
    return nil
}

func main() {
    err := getResource(0)
    if err != nil {
        var appErr *AppError
        if errors.As(err, &appErr) {
            fmt.Printf("错误码: %d\n", appErr.Code)    // 错误码: 404
            fmt.Printf("消息: %s\n", appErr.Message)   // 消息: 资源未找到
        }
    }
}
```

### 多错误处理

```go
package main

import (
    "errors"
    "fmt"
    "strings"
)

// MultiError 存储多个错误
type MultiError struct {
    Errors []error
}

func (m *MultiError) Error() string {
    var msgs []string
    for _, err := range m.Errors {
        msgs = append(msgs, err.Error())
    }
    return strings.Join(msgs, "; ")
}

func (m *MultiError) Add(err error) {
    if err != nil {
        m.Errors = append(m.Errors, err)
    }
}

func (m *MultiError) HasErrors() bool {
    return len(m.Errors) > 0
}

// 批量验证
func validateForm(name, email string, age int) error {
    var merr MultiError

    if name == "" {
        merr.Add(errors.New("姓名不能为空"))
    }
    if email == "" {
        merr.Add(errors.New("邮箱不能为空"))
    }
    if age < 18 {
        merr.Add(errors.New("年龄必须大于 18"))
    }

    if merr.HasErrors() {
        return &merr
    }
    return nil
}

func main() {
    err := validateForm("", "", 15)
    if err != nil {
        fmt.Println(err)
        // 输出: 姓名不能为空; 邮箱不能为空; 年龄必须大于 18

        if merr, ok := err.(*MultiError); ok {
            fmt.Printf("共有 %d 个错误:\n", len(merr.Errors))
            for i, e := range merr.Errors {
                fmt.Printf("  %d. %v\n", i+1, e)
            }
        }
    }
}
```

## panic 与 recover

### panic 基础

`panic` 用于处理不可恢复的错误:

```go
package main

import "fmt"

func divide(a, b int) int {
    if b == 0 {
        panic("除数不能为零")
    }
    return a / b
}

func main() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Printf("捕获到 panic: %v\n", r)
        }
    }()

    result := divide(10, 2)
    fmt.Println("10 / 2 =", result) // 10 / 2 = 5

    result = divide(10, 0) // 这里会 panic
    fmt.Println("不会执行到这里")
}
```

### recover 恢复 panic

```go
package main

import "fmt"

func riskyOperation() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Printf("从 panic 中恢复: %v\n", r)
        }
    }()

    panic("出现了严重错误!")
}

func main() {
    fmt.Println("开始")
    riskyOperation()
    fmt.Println("继续执行") // 会执行
}
```

### panic 与 error 的选择

```go
package main

import (
    "errors"
    "fmt"
)

// 错误示例: 不应该使用 panic
func badExample(value int) int {
    if value < 0 {
        panic("value 不能为负数") // 不推荐
    }
    return value * 2
}

// 正确示例: 使用 error
func goodExample(value int) (int, error) {
    if value < 0 {
        return 0, errors.New("value 不能为负数") // 推荐
    }
    return value * 2, nil
}

func main() {
    // 使用 error 的方式
    result, err := goodExample(-5)
    if err != nil {
        fmt.Printf("错误: %v\n", err)
    }

    // panic 只用于真正无法恢复的情况
    defer func() {
        if r := recover(); r != nil {
            fmt.Printf("程序遇到严重错误: %v\n", r)
        }
    }()
}
```

### 使用 defer 清理资源

```go
package main

import (
    "fmt"
    "os"
)

func processFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return fmt.Errorf("打开文件失败: %w", err)
    }
    defer file.Close() // 确保文件会被关闭

    // 处理文件...
    // 即使发生 panic,defer 也会执行

    return nil
}

func safeProcess(filename string) (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("处理文件时发生 panic: %v", r)
        }
    }()

    return processFile(filename)
}

func main() {
    err := safeProcess("test.txt")
    if err != nil {
        fmt.Printf("错误: %v\n", err)
    }
}
```

## 错误处理最佳实践

### 始终检查错误

```go
package main

import (
    "fmt"
    "strconv"
)

func main() {
    // 不好的做法
    value, _ := strconv.Atoi("abc") // 忽略错误
    fmt.Println(value)

    // 好的做法
    value, err := strconv.Atoi("abc")
    if err != nil {
        fmt.Printf("转换失败: %v\n", err)
        return
    }
    fmt.Println(value)
}
```

### 提供错误上下文

```go
package main

import (
    "fmt"
    "os"
)

func loadConfig(path string) error {
    _, err := os.ReadFile(path)
    if err != nil {
        // 好: 提供上下文
        return fmt.Errorf("加载配置文件 %s 失败: %w", path, err)
    }
    return nil
}

func main() {
    err := loadConfig("/etc/app/config.json")
    if err != nil {
        fmt.Println(err)
    }
}
```

### 定义有意义的错误变量

```go
package main

import (
    "errors"
    "fmt"
)

var (
    ErrUserNotFound     = errors.New("用户未找到")
    ErrInvalidPassword  = errors.New("密码错误")
    ErrAccountLocked    = errors.New("账户已锁定")
)

func authenticate(username, password string) error {
    if username == "" {
        return ErrUserNotFound
    }
    if password != "correct" {
        return ErrInvalidPassword
    }
    return nil
}

func main() {
    err := authenticate("user", "wrong")

    switch {
    case errors.Is(err, ErrUserNotFound):
        fmt.Println("请检查用户名")
    case errors.Is(err, ErrInvalidPassword):
        fmt.Println("请检查密码")
    case errors.Is(err, ErrAccountLocked):
        fmt.Println("请联系管理员")
    case err != nil:
        fmt.Printf("未知错误: %v\n", err)
    default:
        fmt.Println("认证成功")
    }
}
```

### 错误日志记录

```go
package main

import (
    "fmt"
    "log"
    "os"
)

func criticalOperation() error {
    _, err := os.Open("important.dat")
    if err != nil {
        // 记录错误详情
        log.Printf("关键操作失败: %v", err)
        return fmt.Errorf("操作失败: %w", err)
    }
    return nil
}

func main() {
    err := criticalOperation()
    if err != nil {
        // 根据错误严重程度决定是否继续
        log.Printf("错误: %v", err)
    }
}
```

### 避免重复的错误检查

```go
package main

import (
    "bufio"
    "fmt"
    "io"
)

// 错误包装器
type errWriter struct {
    w   io.Writer
    err error
}

func (ew *errWriter) write(buf []byte) {
    if ew.err != nil {
        return // 如果已经有错误,跳过后续写入
    }
    _, ew.err = ew.w.Write(buf)
}

func writeData(w io.Writer) error {
    ew := &errWriter{w: w}

    // 多次写入,只需最后检查一次错误
    ew.write([]byte("第一行\n"))
    ew.write([]byte("第二行\n"))
    ew.write([]byte("第三行\n"))

    return ew.err
}

func main() {
    w := bufio.NewWriter(nil) // 会产生错误
    err := writeData(w)
    if err != nil {
        fmt.Printf("写入失败: %v\n", err)
    }
}
```

## 总结

Go 的错误处理机制有以下特点:

1. **显式处理**: 通过返回值明确传递错误,代码流程清晰
2. **错误接口**: 简单而强大的 `error` 接口设计
3. **错误包装**: `fmt.Errorf` 和 `%w` 支持错误链
4. **错误检查**: `errors.Is` 和 `errors.As` 提供灵活的错误判断
5. **自定义错误**: 可以创建丰富的错误类型
6. **panic/recover**: 用于处理真正的异常情况
7. **最佳实践**: 始终检查错误、提供上下文、定义有意义的错误变量

掌握这些错误处理技术,能够帮助你编写更加健壮和可维护的 Go 程序。
