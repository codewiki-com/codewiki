---
title: Go 错误包装
description: 深入理解 Go 错误包装机制：fmt.Errorf %w、errors.Is、errors.As、错误链与自定义错误类型
track: go
section: basics
difficulty: intermediate
tags:
  - Go
  - 错误处理
  - error
  - 错误包装
  - errors.Is
  - errors.As
status: imported
origin: old/src/content/docs/go/error-wrapping.zh.md
divergence: 0.194
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: 错误处理
  order: 6
  lastUpdated: 2026-01-07
---

错误包装是 Go 1.13 引入的重要特性,它允许在保留原始错误的同时添加上下文信息,形成错误链。这种机制极大地提升了错误处理的可追溯性和可调试性。

## 概念解释

### 什么是错误包装

错误包装(Error Wrapping)是一种将原始错误嵌入到新错误中的技术。被包装的错误保持完整,同时外层错误可以添加额外的上下文信息。这形成了一个错误链(Error Chain),允许调用者既能看到高层错误描述,也能追溯到底层根本原因。

```go
// 原始错误
err := os.Open("config.json")
// open config.json: no such file or directory

// 包装后的错误
wrappedErr := fmt.Errorf("加载配置失败: %w", err)
// 加载配置失败: open config.json: no such file or directory
```

### 历史背景

在 Go 1.13 之前,错误处理存在以下痛点:

1. **上下文丢失**: 使用 `fmt.Errorf("xxx: %v", err)` 只保留错误字符串,丢失原始错误类型
2. **类型判断困难**: 无法判断错误链中是否包含特定错误
3. **第三方库依赖**: 需要使用 `github.com/pkg/errors` 等第三方库实现错误包装

Go 1.13 通过引入 `%w` 动词、`errors.Is` 和 `errors.As` 函数,将错误包装能力纳入标准库。Go 1.20 进一步增强,支持同时包装多个错误。

### 解决的问题

| 问题 | 传统方式 | 错误包装方式 |
|------|---------|-------------|
| 添加上下文 | 丢失原始错误类型 | 保留完整错误链 |
| 错误判断 | 字符串比较(不可靠) | `errors.Is` 精确匹配 |
| 类型提取 | 类型断言(仅顶层) | `errors.As` 遍历错误链 |
| 根因追溯 | 无法实现 | `errors.Unwrap` 逐层解包 |

## 核心原理

### Unwrap 接口

错误包装的核心是 `Unwrap` 接口。任何实现了 `Unwrap() error` 方法的错误类型都支持解包:

```go
// 标准库中的 Unwrap 接口(隐式接口)
type unwrapper interface {
    Unwrap() error
}

// Go 1.20+ 支持多错误包装
type multiUnwrapper interface {
    Unwrap() []error
}
```

### fmt.Errorf 的 %w 实现

当使用 `%w` 动词时,`fmt.Errorf` 返回一个实现了 `Unwrap` 方法的内部类型:

```go
// 简化的内部实现原理
type wrapError struct {
    msg string
    err error
}

func (e *wrapError) Error() string {
    return e.msg
}

func (e *wrapError) Unwrap() error {
    return e.err
}
```

### errors.Is 的工作原理

`errors.Is` 通过递归解包错误链来查找目标错误:

```go
// 简化的 errors.Is 实现原理
func Is(err, target error) bool {
    if target == nil {
        return err == target
    }

    // 1. 直接比较
    if err == target {
        return true
    }

    // 2. 检查是否实现了 Is 方法
    if x, ok := err.(interface{ Is(error) bool }); ok {
        if x.Is(target) {
            return true
        }
    }

    // 3. 递归解包
    if unwrapped := Unwrap(err); unwrapped != nil {
        return Is(unwrapped, target)
    }

    return false
}
```

### errors.As 的工作原理

`errors.As` 遍历错误链寻找可赋值给目标类型的错误:

```go
// 简化的 errors.As 实现原理
func As(err error, target any) bool {
    // target 必须是非空指针
    val := reflect.ValueOf(target)
    typ := val.Type().Elem()

    for err != nil {
        // 检查是否可赋值
        if reflect.TypeOf(err).AssignableTo(typ) {
            val.Elem().Set(reflect.ValueOf(err))
            return true
        }

        // 检查是否实现了 As 方法
        if x, ok := err.(interface{ As(any) bool }); ok {
            if x.As(target) {
                return true
            }
        }

        // 继续解包
        err = Unwrap(err)
    }

    return false
}
```

### 错误链结构

```
                    ┌─────────────────────────────────────┐
                    │         最外层错误                   │
                    │  "服务启动失败: 加载配置失败: ..."    │
                    └─────────────────┬───────────────────┘
                                      │ Unwrap()
                    ┌─────────────────▼───────────────────┐
                    │         中间层错误                   │
                    │  "加载配置失败: open config.json..." │
                    └─────────────────┬───────────────────┘
                                      │ Unwrap()
                    ┌─────────────────▼───────────────────┐
                    │         原始错误                     │
                    │  *os.PathError                      │
                    │  {Op: "open", Path: "config.json"}  │
                    └─────────────────────────────────────┘
```

## 核心要点

### %w vs %v 的区别

```go
err := os.Open("file.txt")

// %v: 只保留字符串,丢失错误链
errV := fmt.Errorf("操作失败: %v", err)
errors.Is(errV, os.ErrNotExist) // false - 无法匹配

// %w: 保留原始错误,形成错误链
errW := fmt.Errorf("操作失败: %w", err)
errors.Is(errW, os.ErrNotExist) // true - 可以匹配
```

### errors.Is vs == 的区别

```go
var ErrNotFound = errors.New("not found")

err := fmt.Errorf("查询用户失败: %w", ErrNotFound)

// 直接比较: 失败
if err == ErrNotFound {
    // 不会执行 - err 是包装后的新错误
}

// errors.Is: 成功
if errors.Is(err, ErrNotFound) {
    // 会执行 - 遍历错误链找到 ErrNotFound
}
```

### errors.As vs 类型断言的区别

```go
err := fmt.Errorf("处理失败: %w", &os.PathError{
    Op:   "open",
    Path: "/etc/config",
    Err:  os.ErrPermission,
})

// 类型断言: 失败(只检查顶层)
if pathErr, ok := err.(*os.PathError); ok {
    // 不会执行
}

// errors.As: 成功(遍历错误链)
var pathErr *os.PathError
if errors.As(err, &pathErr) {
    // 会执行
    fmt.Println(pathErr.Path) // /etc/config
}
```

### 单一 %w 规则(Go 1.13-1.19)

在 Go 1.20 之前,`fmt.Errorf` 只能包含一个 `%w`:

```go
// Go 1.13-1.19: 只支持一个 %w
err := fmt.Errorf("错误1: %w, 错误2: %v", err1, err2)
```

### 多错误包装(Go 1.20+)

Go 1.20 支持同时包装多个错误:

```go
// Go 1.20+: 支持多个 %w
err := fmt.Errorf("多个错误: %w, %w", err1, err2)

// 或使用 errors.Join
err := errors.Join(err1, err2, err3)
```

## 代码示例

### 基本错误包装

```go
package main

import (
    "errors"
    "fmt"
    "os"
)

// 预定义错误
var (
    ErrConfigNotFound = errors.New("配置文件未找到")
    ErrInvalidConfig  = errors.New("配置格式无效")
)

// 读取配置文件
func readConfig(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        if os.IsNotExist(err) {
            // 包装为业务错误,同时保留原始错误
            return nil, fmt.Errorf("%w: %w", ErrConfigNotFound, err)
        }
        return nil, fmt.Errorf("读取配置失败: %w", err)
    }
    return data, nil
}

// 解析配置
func parseConfig(data []byte) (map[string]string, error) {
    if len(data) == 0 {
        return nil, ErrInvalidConfig
    }
    // 简化的解析逻辑
    return map[string]string{"key": "value"}, nil
}

// 加载配置(组合多个操作)
func loadConfig(path string) (map[string]string, error) {
    data, err := readConfig(path)
    if err != nil {
        return nil, fmt.Errorf("加载配置 %s 失败: %w", path, err)
    }

    config, err := parseConfig(data)
    if err != nil {
        return nil, fmt.Errorf("解析配置 %s 失败: %w", path, err)
    }

    return config, nil
}

func main() {
    config, err := loadConfig("app.json")
    if err != nil {
        // 完整错误信息
        fmt.Printf("错误: %v\n", err)

        // 检查是否是配置未找到
        if errors.Is(err, ErrConfigNotFound) {
            fmt.Println("-> 请检查配置文件是否存在")
        }

        // 检查是否是系统级文件不存在
        if errors.Is(err, os.ErrNotExist) {
            fmt.Println("-> 文件系统报告文件不存在")
        }

        // 提取 PathError 获取详细信息
        var pathErr *os.PathError
        if errors.As(err, &pathErr) {
            fmt.Printf("-> 操作: %s, 路径: %s\n", pathErr.Op, pathErr.Path)
        }
        return
    }

    fmt.Printf("配置加载成功: %v\n", config)
}
```

### 自定义可包装错误类型

```go
package main

import (
    "errors"
    "fmt"
)

// HTTPError 带状态码的 HTTP 错误
type HTTPError struct {
    Code    int
    Message string
    Err     error // 被包装的原始错误
}

func (e *HTTPError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("HTTP %d: %s: %v", e.Code, e.Message, e.Err)
    }
    return fmt.Sprintf("HTTP %d: %s", e.Code, e.Message)
}

// Unwrap 实现错误解包
func (e *HTTPError) Unwrap() error {
    return e.Err
}

// 预定义 HTTP 错误
var (
    ErrNotFound     = &HTTPError{Code: 404, Message: "资源未找到"}
    ErrUnauthorized = &HTTPError{Code: 401, Message: "未授权"}
    ErrForbidden    = &HTTPError{Code: 403, Message: "禁止访问"}
)

// 创建带原因的 HTTP 错误
func NewHTTPError(code int, message string, cause error) *HTTPError {
    return &HTTPError{
        Code:    code,
        Message: message,
        Err:     cause,
    }
}

// 模拟 API 调用
func fetchUser(id int) (*User, error) {
    if id <= 0 {
        return nil, NewHTTPError(400, "无效的用户ID",
            fmt.Errorf("ID必须为正数, 收到: %d", id))
    }
    if id > 1000 {
        return nil, ErrNotFound
    }
    return &User{ID: id, Name: "张三"}, nil
}

type User struct {
    ID   int
    Name string
}

func main() {
    _, err := fetchUser(-1)
    if err != nil {
        fmt.Printf("错误: %v\n", err)

        // 提取 HTTPError
        var httpErr *HTTPError
        if errors.As(err, &httpErr) {
            fmt.Printf("状态码: %d\n", httpErr.Code)
            fmt.Printf("消息: %s\n", httpErr.Message)

            // 获取被包装的原始错误
            if httpErr.Err != nil {
                fmt.Printf("原因: %v\n", httpErr.Err)
            }
        }
    }
}
```

### 实现 Is 和 As 方法的自定义错误

```go
package main

import (
    "errors"
    "fmt"
)

// ErrorCode 错误码类型
type ErrorCode int

const (
    CodeUnknown ErrorCode = iota
    CodeNotFound
    CodeInvalidInput
    CodePermissionDenied
)

// AppError 应用错误
type AppError struct {
    Code    ErrorCode
    Message string
    Err     error
}

func (e *AppError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Err)
    }
    return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
    return e.Err
}

// Is 自定义相等判断
// 允许只通过 Code 判断错误类型
func (e *AppError) Is(target error) bool {
    t, ok := target.(*AppError)
    if !ok {
        return false
    }
    // 只比较错误码
    return e.Code == t.Code
}

// 预定义错误模板(用于 errors.Is 匹配)
var (
    ErrAppNotFound    = &AppError{Code: CodeNotFound}
    ErrAppInvalidInput = &AppError{Code: CodeInvalidInput}
    ErrAppPermission   = &AppError{Code: CodePermissionDenied}
)

// 创建具体错误
func NewNotFoundError(resource string) error {
    return &AppError{
        Code:    CodeNotFound,
        Message: fmt.Sprintf("%s 未找到", resource),
    }
}

func NewInvalidInputError(field string, reason error) error {
    return &AppError{
        Code:    CodeInvalidInput,
        Message: fmt.Sprintf("字段 %s 无效", field),
        Err:     reason,
    }
}

func main() {
    // 创建具体错误
    err := NewNotFoundError("用户")

    // 使用预定义模板匹配
    if errors.Is(err, ErrAppNotFound) {
        fmt.Println("匹配成功: 这是一个 NotFound 错误")
    }

    // 创建带原因的错误
    inputErr := NewInvalidInputError("email", errors.New("格式不正确"))

    if errors.Is(inputErr, ErrAppInvalidInput) {
        fmt.Println("匹配成功: 这是一个 InvalidInput 错误")
    }

    // 提取完整错误信息
    var appErr *AppError
    if errors.As(inputErr, &appErr) {
        fmt.Printf("错误详情: Code=%d, Message=%s\n", appErr.Code, appErr.Message)
    }
}
```

### errors.Join 多错误包装(Go 1.20+)

```go
package main

import (
    "errors"
    "fmt"
)

// 验证错误
type ValidationErrors struct {
    Errors []error
}

func (v *ValidationErrors) Error() string {
    return fmt.Sprintf("验证失败: %d 个错误", len(v.Errors))
}

// Unwrap 返回所有错误(Go 1.20+)
func (v *ValidationErrors) Unwrap() []error {
    return v.Errors
}

// 批量验证
func validateUser(name, email string, age int) error {
    var errs []error

    if name == "" {
        errs = append(errs, errors.New("姓名不能为空"))
    }
    if email == "" {
        errs = append(errs, errors.New("邮箱不能为空"))
    }
    if age < 0 {
        errs = append(errs, fmt.Errorf("年龄无效: %d", age))
    }

    if len(errs) > 0 {
        // 方式1: 使用 errors.Join
        return errors.Join(errs...)

        // 方式2: 使用自定义类型
        // return &ValidationErrors{Errors: errs}
    }

    return nil
}

// 定义特定错误用于检查
var ErrNameEmpty = errors.New("姓名不能为空")

func validateUserV2(name, email string, age int) error {
    var errs []error

    if name == "" {
        errs = append(errs, ErrNameEmpty)
    }
    if email == "" {
        errs = append(errs, errors.New("邮箱不能为空"))
    }

    if len(errs) > 0 {
        return errors.Join(errs...)
    }
    return nil
}

func main() {
    // 测试多错误
    err := validateUser("", "", -5)
    if err != nil {
        fmt.Printf("错误: %v\n", err)
        // 输出: 错误: 姓名不能为空
        //       邮箱不能为空
        //       年龄无效: -5
    }

    // 使用 errors.Is 检查特定错误
    err2 := validateUserV2("", "test@example.com", 25)
    if errors.Is(err2, ErrNameEmpty) {
        fmt.Println("检测到姓名为空错误")
    }
}
```

### 完整的分层错误处理示例

```go
package main

import (
    "context"
    "database/sql"
    "errors"
    "fmt"
    "time"
)

// 定义领域错误
var (
    ErrUserNotFound   = errors.New("用户不存在")
    ErrDuplicateEmail = errors.New("邮箱已被使用")
    ErrDBConnection   = errors.New("数据库连接失败")
)

// User 用户模型
type User struct {
    ID    int64
    Name  string
    Email string
}

// Repository 层
type UserRepository struct {
    db *sql.DB
}

func (r *UserRepository) FindByID(ctx context.Context, id int64) (*User, error) {
    // 模拟数据库查询
    if id == 0 {
        // 模拟 sql.ErrNoRows
        return nil, fmt.Errorf("查询用户 %d: %w", id, sql.ErrNoRows)
    }
    if id < 0 {
        // 模拟连接错误
        return nil, fmt.Errorf("数据库操作失败: %w", ErrDBConnection)
    }

    return &User{ID: id, Name: "测试用户", Email: "test@example.com"}, nil
}

// Service 层
type UserService struct {
    repo *UserRepository
}

func (s *UserService) GetUser(ctx context.Context, id int64) (*User, error) {
    user, err := s.repo.FindByID(ctx, id)
    if err != nil {
        // 转换仓储层错误为领域错误
        if errors.Is(err, sql.ErrNoRows) {
            return nil, fmt.Errorf("获取用户失败: %w",
                fmt.Errorf("%w (id=%d)", ErrUserNotFound, id))
        }
        // 保留其他错误
        return nil, fmt.Errorf("用户服务错误: %w", err)
    }
    return user, nil
}

// Handler 层
type UserHandler struct {
    service *UserService
}

type APIResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   *APIError   `json:"error,omitempty"`
}

type APIError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
}

func (h *UserHandler) GetUser(ctx context.Context, id int64) APIResponse {
    user, err := h.service.GetUser(ctx, id)
    if err != nil {
        return h.handleError(err)
    }

    return APIResponse{
        Success: true,
        Data:    user,
    }
}

func (h *UserHandler) handleError(err error) APIResponse {
    // 根据错误类型返回不同的 API 错误
    switch {
    case errors.Is(err, ErrUserNotFound):
        return APIResponse{
            Success: false,
            Error: &APIError{
                Code:    "USER_NOT_FOUND",
                Message: "请求的用户不存在",
            },
        }
    case errors.Is(err, ErrDBConnection):
        // 记录详细错误日志
        fmt.Printf("数据库错误: %v\n", err)
        return APIResponse{
            Success: false,
            Error: &APIError{
                Code:    "INTERNAL_ERROR",
                Message: "服务暂时不可用,请稍后重试",
            },
        }
    default:
        fmt.Printf("未知错误: %v\n", err)
        return APIResponse{
            Success: false,
            Error: &APIError{
                Code:    "UNKNOWN_ERROR",
                Message: "发生未知错误",
            },
        }
    }
}

func main() {
    // 构建依赖
    repo := &UserRepository{}
    service := &UserService{repo: repo}
    handler := &UserHandler{service: service}

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // 测试正常情况
    fmt.Println("=== 测试正常查询 ===")
    resp := handler.GetUser(ctx, 1)
    fmt.Printf("响应: %+v\n", resp)

    // 测试用户不存在
    fmt.Println("\n=== 测试用户不存在 ===")
    resp = handler.GetUser(ctx, 0)
    fmt.Printf("响应: %+v\n", resp)

    // 测试数据库错误
    fmt.Println("\n=== 测试数据库错误 ===")
    resp = handler.GetUser(ctx, -1)
    fmt.Printf("响应: %+v\n", resp)
}
```

## 最佳实践

### 在错误发生处添加上下文

```go
// 不好: 直接返回原始错误
func readFile(path string) ([]byte, error) {
    return os.ReadFile(path)
}

// 好: 添加操作上下文
func readFile(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("读取文件 %s: %w", path, err)
    }
    return data, nil
}
```

### 定义包级别的哨兵错误

```go
package user

import "errors"

// 包级别的哨兵错误,用于 errors.Is 检查
var (
    ErrNotFound       = errors.New("user: not found")
    ErrAlreadyExists  = errors.New("user: already exists")
    ErrInvalidInput   = errors.New("user: invalid input")
    ErrPermissionDeny = errors.New("user: permission denied")
)
```

### 使用错误类型携带结构化信息

```go
// 当需要携带额外信息时,使用自定义错误类型
type NotFoundError struct {
    Resource string
    ID       string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s not found: %s", e.Resource, e.ID)
}

// 提供 Is 方法支持通用匹配
func (e *NotFoundError) Is(target error) bool {
    _, ok := target.(*NotFoundError)
    return ok
}

// 哨兵值用于 errors.Is
var ErrNotFound = &NotFoundError{}
```

### 在边界处转换错误

```go
// Repository 层: 使用数据库特定错误
func (r *Repo) FindByID(id int64) (*User, error) {
    err := r.db.QueryRow(...).Scan(...)
    if err == sql.ErrNoRows {
        return nil, fmt.Errorf("查询用户 %d: %w", id, sql.ErrNoRows)
    }
    return user, err
}

// Service 层: 转换为领域错误
func (s *Service) GetUser(id int64) (*User, error) {
    user, err := s.repo.FindByID(id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            // 转换为领域错误
            return nil, ErrUserNotFound
        }
        return nil, fmt.Errorf("获取用户失败: %w", err)
    }
    return user, nil
}
```

### 避免过度包装

```go
// 不好: 每一层都包装,信息冗余
// "处理请求: 调用服务: 查询数据: 读取数据库: sql: no rows"

// 好: 只在有意义的地方包装
func (s *Service) GetUser(id int64) (*User, error) {
    user, err := s.repo.FindByID(id)
    if err != nil {
        // 只添加这一层上下文
        return nil, fmt.Errorf("获取用户 %d: %w", id, err)
    }
    return user, nil
}
```

### 日志记录完整错误链

```go
import "log/slog"

func handleRequest(w http.ResponseWriter, r *http.Request) {
    user, err := service.GetUser(ctx, id)
    if err != nil {
        // 记录完整错误链用于调试
        slog.Error("请求处理失败",
            "error", err,
            "user_id", id,
            "request_id", requestID,
        )

        // 返回给用户的错误信息应该简洁
        if errors.Is(err, ErrNotFound) {
            http.Error(w, "用户不存在", http.StatusNotFound)
            return
        }
        http.Error(w, "服务器错误", http.StatusInternalServerError)
    }
}
```

## 常见陷阱

### 混淆 %w 和 %v

```go
var ErrPermission = errors.New("权限不足")

// 错误: 使用 %v 丢失错误链
err := fmt.Errorf("操作失败: %v", ErrPermission)
errors.Is(err, ErrPermission) // false!

// 正确: 使用 %w 保留错误链
err := fmt.Errorf("操作失败: %w", ErrPermission)
errors.Is(err, ErrPermission) // true
```

### errors.As 参数错误

```go
var pathErr *os.PathError

// 错误: 传递值而非指针
errors.As(err, pathErr)  // panic!

// 正确: 传递指针的指针
errors.As(err, &pathErr)
```

### 比较包装后的错误

```go
var ErrNotFound = errors.New("not found")

err1 := fmt.Errorf("a: %w", ErrNotFound)
err2 := fmt.Errorf("b: %w", ErrNotFound)

// 错误: 直接比较
if err1 == err2 { // false - 它们是不同的错误实例
}

// 正确: 使用 errors.Is 检查是否包含相同的原始错误
if errors.Is(err1, ErrNotFound) && errors.Is(err2, ErrNotFound) {
    // 两个错误都源自 ErrNotFound
}
```

### 忘记实现 Unwrap

```go
// 错误: 自定义错误没有实现 Unwrap
type MyError struct {
    Msg string
    Err error
}

func (e *MyError) Error() string {
    return e.Msg
}

err := &MyError{Msg: "失败", Err: os.ErrNotExist}
errors.Is(err, os.ErrNotExist) // false - 无法解包!

// 正确: 实现 Unwrap 方法
func (e *MyError) Unwrap() error {
    return e.Err
}

errors.Is(err, os.ErrNotExist) // true
```

### 在 goroutine 中丢失错误上下文

```go
// 错误: 错误上下文在 goroutine 中丢失
func processItems(items []Item) error {
    var wg sync.WaitGroup
    var firstErr error

    for _, item := range items {
        wg.Add(1)
        go func(item Item) {
            defer wg.Done()
            if err := process(item); err != nil {
                firstErr = err // 竞态条件且丢失上下文
            }
        }(item)
    }
    wg.Wait()
    return firstErr
}

// 正确: 使用 channel 收集错误并保留上下文
func processItems(items []Item) error {
    errCh := make(chan error, len(items))
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        go func(item Item) {
            defer wg.Done()
            if err := process(item); err != nil {
                errCh <- fmt.Errorf("处理 %s: %w", item.ID, err)
            }
        }(item)
    }

    wg.Wait()
    close(errCh)

    var errs []error
    for err := range errCh {
        errs = append(errs, err)
    }

    if len(errs) > 0 {
        return errors.Join(errs...)
    }
    return nil
}
```

### 暴露内部实现细节

```go
// 不好: 暴露数据库实现细节
func (s *Service) GetUser(id int64) (*User, error) {
    user, err := s.repo.Find(id)
    if err != nil {
        // 直接返回 sql.ErrNoRows 泄露实现细节
        return nil, err
    }
    return user, nil
}

// 好: 转换为领域错误
func (s *Service) GetUser(id int64) (*User, error) {
    user, err := s.repo.Find(id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrUserNotFound
        }
        return nil, fmt.Errorf("查询用户失败: %w", err)
    }
    return user, nil
}
```

## 性能考量

### errors.Is 和 errors.As 的性能

```go
// errors.Is 需要遍历错误链,性能与链长度成正比
// 通常错误链不会太长,性能影响可忽略

// 基准测试
func BenchmarkErrorsIs(b *testing.B) {
    target := errors.New("target")
    // 创建深度为 10 的错误链
    err := target
    for i := 0; i < 10; i++ {
        err = fmt.Errorf("wrap %d: %w", i, err)
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        errors.Is(err, target)
    }
}
// 结果: 约 100-200 ns/op (错误链深度为 10)
```

### 错误创建的性能

```go
// fmt.Errorf 有一定开销,热路径应避免
func BenchmarkErrorCreation(b *testing.B) {
    existingErr := errors.New("existing")

    b.Run("errors.New", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _ = errors.New("error")
        }
    }) // ~20 ns/op

    b.Run("fmt.Errorf-simple", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _ = fmt.Errorf("error: %d", i)
        }
    }) // ~100 ns/op

    b.Run("fmt.Errorf-wrap", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _ = fmt.Errorf("wrapped: %w", existingErr)
        }
    }) // ~150 ns/op
}
```

### 性能优化建议

```go
// 1. 预定义哨兵错误,避免重复创建
var ErrNotFound = errors.New("not found")

// 好: 返回预定义错误
func Find(id int) error {
    if id == 0 {
        return ErrNotFound
    }
    return nil
}

// 2. 只在需要上下文时使用 fmt.Errorf
func Find(id int) error {
    if id == 0 {
        return ErrNotFound // 简单场景直接返回
    }
    if id < 0 {
        return fmt.Errorf("无效ID %d: %w", id, ErrInvalidInput) // 需要上下文
    }
    return nil
}

// 3. 缓存需要频繁使用的包装错误
type CachedErrors struct {
    notFound map[string]error
    mu       sync.RWMutex
}

func (c *CachedErrors) NotFound(resource string) error {
    c.mu.RLock()
    if err, ok := c.notFound[resource]; ok {
        c.mu.RUnlock()
        return err
    }
    c.mu.RUnlock()

    c.mu.Lock()
    defer c.mu.Unlock()
    err := fmt.Errorf("%s: %w", resource, ErrNotFound)
    c.notFound[resource] = err
    return err
}
```

## 实战场景

### 场景1: REST API 错误处理

```go
package main

import (
    "encoding/json"
    "errors"
    "fmt"
    "net/http"
)

// 业务错误定义
var (
    ErrValidation   = errors.New("validation error")
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrForbidden    = errors.New("forbidden")
)

// APIError API 错误响应
type APIError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}

// 错误到 HTTP 状态码映射
func errorToStatusCode(err error) int {
    switch {
    case errors.Is(err, ErrValidation):
        return http.StatusBadRequest
    case errors.Is(err, ErrNotFound):
        return http.StatusNotFound
    case errors.Is(err, ErrUnauthorized):
        return http.StatusUnauthorized
    case errors.Is(err, ErrForbidden):
        return http.StatusForbidden
    default:
        return http.StatusInternalServerError
    }
}

// 统一错误处理中间件
func errorHandler(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 使用 defer + recover 捕获 panic
        defer func() {
            if rec := recover(); rec != nil {
                writeError(w, http.StatusInternalServerError, APIError{
                    Code:    "INTERNAL_ERROR",
                    Message: "服务器内部错误",
                })
            }
        }()
        next.ServeHTTP(w, r)
    })
}

func writeError(w http.ResponseWriter, status int, apiErr APIError) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(apiErr)
}

// 业务处理函数
func getUserHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("id")

    user, err := getUser(userID)
    if err != nil {
        status := errorToStatusCode(err)

        var apiErr APIError
        switch {
        case errors.Is(err, ErrNotFound):
            apiErr = APIError{Code: "USER_NOT_FOUND", Message: "用户不存在"}
        case errors.Is(err, ErrValidation):
            apiErr = APIError{Code: "INVALID_INPUT", Message: err.Error()}
        default:
            apiErr = APIError{Code: "INTERNAL_ERROR", Message: "服务器错误"}
        }

        writeError(w, status, apiErr)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

func getUser(id string) (*User, error) {
    if id == "" {
        return nil, fmt.Errorf("用户ID不能为空: %w", ErrValidation)
    }
    if id == "0" {
        return nil, fmt.Errorf("用户 %s: %w", id, ErrNotFound)
    }
    return &User{ID: id, Name: "张三"}, nil
}

type User struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/user", getUserHandler)

    handler := errorHandler(mux)

    fmt.Println("服务器启动在 :8080")
    http.ListenAndServe(":8080", handler)
}
```

### 场景2: 数据库事务错误处理

```go
package main

import (
    "context"
    "database/sql"
    "errors"
    "fmt"
)

// 事务错误
var (
    ErrTxBegin    = errors.New("事务开始失败")
    ErrTxCommit   = errors.New("事务提交失败")
    ErrTxRollback = errors.New("事务回滚失败")
)

// WithTransaction 事务包装器
func WithTransaction(ctx context.Context, db *sql.DB, fn func(*sql.Tx) error) (err error) {
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("%w: %v", ErrTxBegin, err)
    }

    defer func() {
        if p := recover(); p != nil {
            // 发生 panic 时回滚
            if rbErr := tx.Rollback(); rbErr != nil {
                err = fmt.Errorf("panic 后回滚失败: %w (panic: %v)", ErrTxRollback, p)
            } else {
                err = fmt.Errorf("事务因 panic 回滚: %v", p)
            }
        } else if err != nil {
            // 发生错误时回滚
            if rbErr := tx.Rollback(); rbErr != nil {
                err = fmt.Errorf("回滚失败: %w (原始错误: %v)", ErrTxRollback, err)
            }
            // 保留原始错误
        } else {
            // 成功时提交
            if cmErr := tx.Commit(); cmErr != nil {
                err = fmt.Errorf("%w: %v", ErrTxCommit, cmErr)
            }
        }
    }()

    err = fn(tx)
    return
}

// 使用示例
func transferMoney(ctx context.Context, db *sql.DB, from, to int64, amount float64) error {
    return WithTransaction(ctx, db, func(tx *sql.Tx) error {
        // 扣除发送方余额
        result, err := tx.ExecContext(ctx,
            "UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?",
            amount, from, amount)
        if err != nil {
            return fmt.Errorf("扣除余额失败: %w", err)
        }

        rows, err := result.RowsAffected()
        if err != nil {
            return fmt.Errorf("获取影响行数失败: %w", err)
        }
        if rows == 0 {
            return fmt.Errorf("账户 %d 余额不足: %w", from, ErrInsufficientBalance)
        }

        // 增加接收方余额
        _, err = tx.ExecContext(ctx,
            "UPDATE accounts SET balance = balance + ? WHERE id = ?",
            amount, to)
        if err != nil {
            return fmt.Errorf("增加余额失败: %w", err)
        }

        return nil
    })
}

var ErrInsufficientBalance = errors.New("余额不足")

func main() {
    // 使用示例
    ctx := context.Background()
    var db *sql.DB // 实际使用时需要初始化

    err := transferMoney(ctx, db, 1, 2, 100.0)
    if err != nil {
        switch {
        case errors.Is(err, ErrInsufficientBalance):
            fmt.Println("转账失败: 余额不足")
        case errors.Is(err, ErrTxCommit):
            fmt.Println("转账失败: 请重试")
        default:
            fmt.Printf("转账失败: %v\n", err)
        }
    }
}
```

### 场景3: 重试机制中的错误处理

```go
package main

import (
    "context"
    "errors"
    "fmt"
    "math/rand"
    "time"
)

// 可重试错误标记
type RetryableError struct {
    Err error
}

func (e *RetryableError) Error() string {
    return e.Err.Error()
}

func (e *RetryableError) Unwrap() error {
    return e.Err
}

// IsRetryable 判断是否为可重试错误
var ErrRetryable = &RetryableError{}

func (e *RetryableError) Is(target error) bool {
    _, ok := target.(*RetryableError)
    return ok
}

// Retryable 标记错误为可重试
func Retryable(err error) error {
    if err == nil {
        return nil
    }
    return &RetryableError{Err: err}
}

// RetryConfig 重试配置
type RetryConfig struct {
    MaxAttempts int
    InitialWait time.Duration
    MaxWait     time.Duration
    Multiplier  float64
}

// WithRetry 重试包装器
func WithRetry(ctx context.Context, cfg RetryConfig, fn func() error) error {
    var lastErr error
    wait := cfg.InitialWait

    for attempt := 1; attempt <= cfg.MaxAttempts; attempt++ {
        err := fn()
        if err == nil {
            return nil
        }

        lastErr = fmt.Errorf("第 %d 次尝试失败: %w", attempt, err)

        // 检查是否可重试
        if !errors.Is(err, ErrRetryable) {
            return fmt.Errorf("不可重试的错误: %w", lastErr)
        }

        // 最后一次尝试不等待
        if attempt == cfg.MaxAttempts {
            break
        }

        // 等待后重试
        select {
        case <-ctx.Done():
            return fmt.Errorf("重试被取消: %w (最后错误: %v)", ctx.Err(), lastErr)
        case <-time.After(wait):
            // 指数退避
            wait = time.Duration(float64(wait) * cfg.Multiplier)
            if wait > cfg.MaxWait {
                wait = cfg.MaxWait
            }
        }
    }

    return fmt.Errorf("达到最大重试次数 %d: %w", cfg.MaxAttempts, lastErr)
}

// 模拟不稳定的服务调用
func callUnstableService() error {
    if rand.Float32() < 0.7 { // 70% 失败率
        return Retryable(errors.New("服务暂时不可用"))
    }
    return nil
}

func main() {
    rand.Seed(time.Now().UnixNano())

    ctx := context.Background()
    cfg := RetryConfig{
        MaxAttempts: 5,
        InitialWait: 100 * time.Millisecond,
        MaxWait:     2 * time.Second,
        Multiplier:  2.0,
    }

    err := WithRetry(ctx, cfg, callUnstableService)
    if err != nil {
        fmt.Printf("最终失败: %v\n", err)

        // 检查是否因为上下文取消
        if errors.Is(err, context.Canceled) {
            fmt.Println("操作被用户取消")
        }
    } else {
        fmt.Println("调用成功!")
    }
}
```

## 面试要点

### errors.Is 和 == 有什么区别?

**回答要点**:
- `==` 只比较两个错误是否为同一个实例
- `errors.Is` 会遍历整个错误链,检查链中是否包含目标错误
- `errors.Is` 还会检查错误是否实现了 `Is(error) bool` 方法进行自定义匹配

```go
var ErrNotFound = errors.New("not found")
err := fmt.Errorf("query failed: %w", ErrNotFound)

err == ErrNotFound      // false - 不同实例
errors.Is(err, ErrNotFound) // true - 遍历错误链
```

### errors.As 的参数为什么是 `any` 而不是 `error`?

**回答要点**:
- `errors.As` 需要将找到的错误赋值给目标变量
- 参数必须是指针类型,且指向的类型需要实现 error 接口或是接口类型
- 使用 `any` 允许传入 `*ConcreteError` 或 `*error` 等多种形式

```go
var pathErr *os.PathError
errors.As(err, &pathErr) // pathErr 的类型是 *os.PathError
```

### 如何实现自定义错误类型支持 errors.Is 的特殊匹配逻辑?

**回答要点**:
实现 `Is(target error) bool` 方法:

```go
type AppError struct {
    Code int
}

func (e *AppError) Is(target error) bool {
    t, ok := target.(*AppError)
    if !ok {
        return false
    }
    return e.Code == t.Code // 只比较 Code
}
```

### %w 和 %v 在错误处理中有什么区别?

**回答要点**:
- `%v`: 将错误转为字符串嵌入,丢失原始错误类型和链
- `%w`: 包装原始错误,保留完整错误链,支持 `Unwrap`、`errors.Is`、`errors.As`

### Go 1.20 的 errors.Join 解决了什么问题?

**回答要点**:
- 解决了需要同时返回多个错误的场景
- 返回的错误实现了 `Unwrap() []error` 方法
- `errors.Is` 和 `errors.As` 会检查所有被包装的错误

```go
err := errors.Join(err1, err2, err3)
errors.Is(err, err1) // true
errors.Is(err, err2) // true
```

### 什么时候应该用 error,什么时候用 panic?

**回答要点**:
- **error**: 可预期的错误,如用户输入无效、资源不存在、网络超时
- **panic**: 不可恢复的程序错误,如数组越界、空指针、不应该发生的逻辑错误
- 库代码应该优先使用 error,只在真正的程序 bug 时使用 panic
- 应用入口可以使用 recover 捕获 panic 防止程序崩溃

### 错误包装的最佳实践是什么?

**回答要点**:
1. 在错误发生处添加有意义的上下文
2. 使用预定义的哨兵错误支持 `errors.Is` 检查
3. 在模块边界转换错误,不暴露内部实现
4. 避免过度包装导致错误信息冗余
5. 自定义错误类型时实现 `Unwrap` 方法

## 延伸阅读

### 官方文档
- [Go Blog: Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
- [Go Blog: Error handling and Go](https://go.dev/blog/error-handling-and-go)
- [errors 包文档](https://pkg.go.dev/errors)
- [fmt.Errorf 文档](https://pkg.go.dev/fmt#Errorf)

### 提案与设计
- [Error Handling Proposal](https://go.dev/design/go2draft-error-handling-overview)
- [errors.Is/As 提案](https://github.com/golang/go/issues/29934)
- [errors.Join 提案](https://github.com/golang/go/issues/53435)

### 优质文章
- [Dave Cheney: Don't just check errors, handle them gracefully](https://dave.cheney.net/2016/04/27/dont-just-check-errors-handle-them-gracefully)
- [Error handling in Upspin](https://commandcenter.blogspot.com/2017/12/error-handling-in-upspin.html)

### 相关库
- [github.com/pkg/errors](https://github.com/pkg/errors) - Go 1.13 之前的标准方案
- [github.com/cockroachdb/errors](https://github.com/cockroachdb/errors) - 功能更丰富的错误处理库
- [github.com/hashicorp/go-multierror](https://github.com/hashicorp/go-multierror) - 多错误处理
