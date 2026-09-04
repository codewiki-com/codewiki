---
title: Go slog Structured Logging (Go 1.21+)
description: Master Go's built-in structured logging with slog for observable and debuggable applications
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Logging
  - slog
  - Structured Logging
  - Observability
  - Go 1.21
status: imported
origin: old/src/content/docs/go/slog.zh.md
divergence: 0.232
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Go
  subcategory: Logging & Observability
  order: 45
  lastUpdated: 2026-01-07
---

## 概念概述

Go 1.21 引入了 `slog`，一个用于结构化日志的内置包，已成为现代 Go 应用程序的标准日志方法。与产生非结构化文本的传统日志不同，slog 以 JSON 等格式输出结构化的键值对，使日志可被机器解析且高度可查询。

### 为什么 slog 很重要

在 slog 出现之前，Go 开发者必须在第三方日志库（如 zap、zerolog 或 logrus）和基础的 `log` 包之间做出选择。`slog` 的引入提供了：

- **官方标准库支持** - 无需外部依赖
- **开箱即用的结构化日志** - 内置 JSON 输出能力
- **性能优化** - 尽可能实现零分配操作
- **灵活的处理器** - 易于扩展自定义输出格式
- **日志级别** - 多种严重级别用于更好的过滤

### 常见使用场景

```
1. 开发环境中的应用程序调试
2. 生产环境的可观测性和监控
3. 审计跟踪和合规日志
4. 性能分析和瓶颈识别
5. 安全事件跟踪和异常检测
6. 跨服务的分布式追踪关联
```

## 核心原则

### 结构化日志概念

结构化日志从字符串格式化转向可被机器解析的键值对：

```go
// 传统日志（非结构化）
log.Printf("User %s logged in from %s at %s", username, ipAddress, time.Now())
// 输出: "User alice logged in from 192.168.1.1 at 2024-01-15 10:30:45"

// 使用 slog 的结构化日志
slog.Info("user login",
    "username", username,
    "ipAddress", ipAddress,
    "timestamp", time.Now(),
)
// 输出: {"time":"2024-01-15T10:30:45.123Z","level":"INFO","msg":"user login","username":"alice","ipAddress":"192.168.1.1","timestamp":"2024-01-15T10:30:45.000Z"}
```

### slog 中的日志级别

slog 定义了四个标准日志级别，按严重程度排序：

```
┌──────────────────────────────────────────────────────────────┐
│                    slog 日志级别                               │
├──────────────────────────────────────────────────────────────┤
│  DEBUG  │ 详细的诊断信息（默认关闭）                           │
│  INFO   │ 一般操作事件和状态变化                               │
│  WARN   │ 需要关注的警告条件                                   │
│  ERROR  │ 需要立即处理的错误条件                               │
└──────────────────────────────────────────────────────────────┘
```

每个级别都有一个关联的整数值：
- DEBUG: -4
- INFO: 0
- WARN: 4
- ERROR: 8

### 处理器架构

处理器决定日志的输出位置和方式。slog 提供两个内置处理器：

- **TextHandler** - 人类可读的文本格式（最适合开发环境）
- **JSONHandler** - 结构化的 JSON 格式（最适合生产环境/日志聚合）

```go
// TextHandler 输出
2024-01-15T10:30:45.123Z INFO "user login" username=alice ipAddress=192.168.1.1

// JSONHandler 输出
{"time":"2024-01-15T10:30:45.123Z","level":"INFO","msg":"user login","username":"alice","ipAddress":"192.168.1.1"}
```

### 属性和记录数据

slog 使用两个主要概念来处理日志数据：

- **属性** - 在日志调用时添加的键值对
- **分组** - 可嵌套的相关属性集合

```go
// 简单属性
slog.Info("payment processed",
    "orderId", "order_123",
    "amount", 99.99,
    "currency", "USD",
)

// 分组属性
slog.Info("payment processed",
    slog.Group("order",
        "id", "order_123",
        "amount", 99.99,
        "currency", "USD",
    ),
)
```

### 上下文感知日志

slog 日志记录器可以使用 `WithAttrs` 和 `WithGroup` 绑定上下文：

```go
// 创建带有请求上下文的日志记录器
logger := slog.Default().With(
    "requestId", "req_123",
    "userId", "user_456",
)

// 所有后续日志都包含此上下文
logger.Info("processing request")
logger.Error("request failed", "error", err)
```

## 关键要点

### 基本 slog 用法

使用 slog 最简单的方式是使用默认日志记录器：

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    // 使用默认日志记录器（TextHandler）
    slog.Info("application started", "version", "1.0.0")
    slog.Warn("configuration missing", "key", "DATABASE_URL")
    slog.Error("database connection failed", "error", "connection timeout")

    // Debug 日志默认关闭（最低级别是 INFO）
    slog.Debug("debug info") // 这不会出现在输出中
}
```

### 日志记录器配置

为不同目的创建和配置自定义日志记录器：

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    // 用于结构化输出的 JSON 处理器
    jsonHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug, // 包含 debug 日志
    })
    jsonLogger := slog.New(jsonHandler)

    // 用于开发的文本处理器（更易读）
    textHandler := slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    })
    textLogger := slog.New(textHandler)

    // 替换默认日志记录器
    slog.SetDefault(jsonLogger)

    jsonLogger.Info("this goes to JSON")
    textLogger.Info("this goes to text format")
}
```

### 添加属性

在不同级别向日志添加上下文信息：

```go
package main

import (
    "log/slog"
    "os"
    "time"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // 单次调用属性
    logger.Info("user login",
        "username", "alice",
        "ip", "192.168.1.1",
        "duration_ms", 45,
    )

    // 创建带有持久属性的子日志记录器
    requestLogger := logger.With(
        "requestId", "req_12345",
        "userId", "user_456",
    )

    // 这些日志自动包含 requestId 和 userId
    requestLogger.Info("request started")
    requestLogger.Info("database query", "table", "users", "duration_ms", 12)
    requestLogger.Error("request failed", "error", "timeout")
}
```

### 日志级别和过滤

根据严重程度控制哪些消息被记录：

```go
package main

import (
    "flag"
    "log/slog"
    "os"
)

func main() {
    var level string
    flag.StringVar(&level, "log", "info", "log level")
    flag.Parse()

    // 从字符串解析日志级别
    var logLevel slog.Level
    if err := logLevel.UnmarshalText([]byte(level)); err != nil {
        logLevel = slog.LevelInfo
    }

    handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: logLevel,
    })
    logger := slog.New(handler)
    slog.SetDefault(logger)

    slog.Debug("debug message")    // 仅在级别为 debug 时显示
    slog.Info("info message")      // 在 info 及以上级别显示
    slog.Warn("warning message")   // 在 warn 及以上级别显示
    slog.Error("error message")    // 始终显示

    // 在执行昂贵操作前检查级别
    if logger.Enabled(nil, slog.LevelDebug) {
        slog.Debug("expensive debug info", "data", complexCalculation())
    }
}

func complexCalculation() string {
    return "expensive result"
}
```

### 错误日志

带上下文的正确错误日志记录：

```go
package main

import (
    "errors"
    "log/slog"
    "os"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // 记录错误
    err := errors.New("database connection failed")
    logger.Error("operation failed",
        "error", err,
        "operation", "fetch_user",
        "userId", "user_123",
    )

    // 记录错误详情
    var appErr *AppError
    if errors.As(err, &appErr) {
        logger.Error("app error occurred",
            "code", appErr.Code,
            "message", appErr.Message,
            "details", appErr.Details,
        )
    }

    // 结构化错误信息
    logger.Error("request processing failed",
        "error", "invalid input",
        "request_id", "req_456",
        "validation_errors", map[string]string{
            "email": "invalid email format",
            "age":   "must be >= 18",
        },
    )
}

type AppError struct {
    Code    string
    Message string
    Details interface{}
}
```

## 代码示例

### 示例 1：完整的应用程序设置

```go
package main

import (
    "context"
    "log/slog"
    "os"
)

// 根据环境配置日志记录器
func setupLogger(env string) *slog.Logger {
    var opts *slog.HandlerOptions

    if env == "production" {
        // 用于聚合系统的 JSON 输出
        opts = &slog.HandlerOptions{
            Level: slog.LevelInfo,
        }
        handler := slog.NewJSONHandler(os.Stdout, opts)
        return slog.New(handler)
    } else {
        // 用于开发的文本输出
        opts = &slog.HandlerOptions{
            Level: slog.LevelDebug,
            AddSource: true, // 显示文件和行号
        }
        handler := slog.NewTextHandler(os.Stdout, opts)
        return slog.New(handler)
    }
}

func main() {
    env := os.Getenv("ENVIRONMENT")
    if env == "" {
        env = "development"
    }

    logger := setupLogger(env)
    slog.SetDefault(logger)

    slog.Info("application started",
        "environment", env,
        "version", "1.0.0",
    )

    // 在整个应用程序中使用日志记录器
    processOrder(logger, "order_123", 99.99)
}

func processOrder(logger *slog.Logger, orderId string, amount float64) {
    // 创建带有请求上下文的子日志记录器
    ctx := context.Background()
    orderLogger := logger.WithGroup("order").With(
        "id", orderId,
        "amount", amount,
    )

    orderLogger.Info("processing order")

    if err := validateOrder(orderId); err != nil {
        orderLogger.Error("validation failed",
            "error", err,
        )
        return
    }

    orderLogger.Info("order validated")

    if err := processPayment(ctx, orderId, amount); err != nil {
        orderLogger.Error("payment failed",
            "error", err,
            "paymentMethod", "credit_card",
        )
        return
    }

    orderLogger.Info("order completed")
}

func validateOrder(orderId string) error {
    return nil // 成功
}

func processPayment(ctx context.Context, orderId string, amount float64) error {
    return nil // 成功
}
```

### 示例 2：带请求日志的 HTTP 服务器

```go
package main

import (
    "context"
    "log/slog"
    "net/http"
    "os"
    "time"
)

// 请求日志中间件
func requestLoggingMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            requestId := r.Header.Get("X-Request-ID")
            if requestId == "" {
                requestId = generateID()
            }

            // 创建包含请求 ID 的日志记录器上下文
            ctx := context.WithValue(r.Context(), "requestId", requestId)
            r = r.WithContext(ctx)

            // 创建响应写入器包装器以捕获状态码
            wrapped := &responseWriter{ResponseWriter: w}

            // 记录请求
            logger.InfoContext(ctx, "request started",
                "method", r.Method,
                "path", r.URL.Path,
                "remoteAddr", r.RemoteAddr,
                "userAgent", r.UserAgent(),
            )

            // 调用处理器
            next.ServeHTTP(wrapped, r)

            // 记录响应
            duration := time.Since(start)
            logger.InfoContext(ctx, "request completed",
                "method", r.Method,
                "path", r.URL.Path,
                "status", wrapped.statusCode,
                "duration_ms", duration.Milliseconds(),
                "bytes", wrapped.bytes,
            )
        })
    }
}

type responseWriter struct {
    http.ResponseWriter
    statusCode int
    bytes      int
}

func (w *responseWriter) WriteHeader(code int) {
    w.statusCode = code
    w.ResponseWriter.WriteHeader(code)
}

func (w *responseWriter) Write(b []byte) (int, error) {
    w.bytes += len(b)
    return w.ResponseWriter.Write(b)
}

func generateID() string {
    return "req_" + time.Now().Format("20060102150405")
}

func handleUser(w http.ResponseWriter, r *http.Request) {
    logger := slog.Default()
    requestId := r.Context().Value("requestId")

    ctx := context.Background()
    if requestId != nil {
        logger = logger.With("requestId", requestId)
    }

    userId := r.PathValue("id")
    logger = logger.With("userId", userId)

    logger.DebugContext(ctx, "fetching user details")

    // 模拟数据库查询
    if userId == "invalid" {
        logger.ErrorContext(ctx, "user not found")
        w.WriteHeader(http.StatusNotFound)
        return
    }

    logger.InfoContext(ctx, "user found")
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"id":"` + userId + `","name":"Alice"}`))
}

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    }))
    slog.SetDefault(logger)

    mux := http.NewServeMux()
    mux.HandleFunc("GET /user/{id}", handleUser)

    handler := requestLoggingMiddleware(logger)(mux)

    slog.Info("server starting", "port", 8080)
    if err := http.ListenAndServe(":8080", handler); err != nil {
        slog.Error("server failed", "error", err)
    }
}
```

### 示例 3：文件轮转的自定义处理器

```go
package main

import (
    "fmt"
    "io"
    "log/slog"
    "os"
    "os/user"
    "path/filepath"
    "sync"
    "time"
)

// RotatingFileHandler 将日志写入按日轮转的文件
type RotatingFileHandler struct {
    mu          sync.Mutex
    opts        *slog.HandlerOptions
    baseDir     string
    currentFile *os.File
    currentDate string
}

func NewRotatingFileHandler(baseDir string, opts *slog.HandlerOptions) (*RotatingFileHandler, error) {
    if opts == nil {
        opts = &slog.HandlerOptions{Level: slog.LevelInfo}
    }

    h := &RotatingFileHandler{
        baseDir: baseDir,
        opts:    opts,
    }

    if err := h.rotate(); err != nil {
        return nil, err
    }

    return h, nil
}

func (h *RotatingFileHandler) rotate() error {
    h.mu.Lock()
    defer h.mu.Unlock()

    if h.currentFile != nil {
        h.currentFile.Close()
    }

    today := time.Now().Format("2006-01-02")
    if today == h.currentDate {
        return nil // 已经在使用今天的文件
    }

    filename := filepath.Join(h.baseDir, fmt.Sprintf("app-%s.log", today))
    file, err := os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
    if err != nil {
        return err
    }

    h.currentFile = file
    h.currentDate = today
    return nil
}

func (h *RotatingFileHandler) Handle(ctx context.Context, record slog.Record) error {
    // 检查是否需要轮转
    if time.Now().Format("2006-01-02") != h.currentDate {
        if err := h.rotate(); err != nil {
            return err
        }
    }

    h.mu.Lock()
    defer h.mu.Unlock()

    // 使用 JSONHandler 格式化记录
    jsonHandler := slog.NewJSONHandler(h.currentFile, h.opts)
    return jsonHandler.Handle(ctx, record)
}

func (h *RotatingFileHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
    jsonHandler := slog.NewJSONHandler(io.Discard, h.opts)
    return h // 简化实现 - 实际实现需要更新 opts
}

func (h *RotatingFileHandler) WithGroup(name string) slog.Handler {
    return h // 简化实现 - 实际实现需要处理分组
}

func (h *RotatingFileHandler) Enabled(ctx context.Context, level slog.Level) bool {
    return level >= h.opts.Level
}

func main() {
    logDir := "./logs"
    os.MkdirAll(logDir, 0755)

    handler, err := NewRotatingFileHandler(logDir, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    })
    if err != nil {
        panic(err)
    }

    logger := slog.New(handler)
    slog.SetDefault(logger)

    slog.Info("application started")
    slog.Debug("debug information")
    slog.Warn("warning message")
    slog.Error("error occurred")
}

// 添加缺失的导入
import "context"
```

### 示例 4：错误跟踪和报告

```go
package main

import (
    "errors"
    "log/slog"
    "os"
)

// 应用程序错误类型
type ErrorCode string

const (
    ErrCodeInvalidInput    ErrorCode = "INVALID_INPUT"
    ErrCodeNotFound        ErrorCode = "NOT_FOUND"
    ErrCodeUnauthorized    ErrorCode = "UNAUTHORIZED"
    ErrCodeInternalServer  ErrorCode = "INTERNAL_SERVER"
)

type AppError struct {
    Code    ErrorCode
    Message string
    Details map[string]interface{}
}

func (e *AppError) Error() string {
    return e.Message
}

// 结构化错误日志记录
func logError(logger *slog.Logger, err error, context ...interface{}) {
    var appErr *AppError

    if errors.As(err, &appErr) {
        attrs := []interface{}{
            "errorCode", appErr.Code,
            "errorMessage", appErr.Message,
        }

        if appErr.Details != nil {
            attrs = append(attrs, "errorDetails", appErr.Details)
        }

        attrs = append(attrs, context...)

        logger.Error("application error", attrs...)
    } else {
        logger.Error("unexpected error",
            append([]interface{}{"error", err}, context...)...,
        )
    }
}

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // 示例 1：验证错误
    validationErr := &AppError{
        Code:    ErrCodeInvalidInput,
        Message: "validation failed",
        Details: map[string]interface{}{
            "field":  "email",
            "reason": "invalid format",
        },
    }
    logError(logger, validationErr, "userId", "user_123", "operation", "signup")

    // 示例 2：未找到错误
    notFoundErr := &AppError{
        Code:    ErrCodeNotFound,
        Message: "user not found",
    }
    logError(logger, notFoundErr, "userId", "user_999", "operation", "fetch")

    // 示例 3：包装错误
    originalErr := errors.New("network timeout")
    wrappedErr := &AppError{
        Code:    ErrCodeInternalServer,
        Message: "database connection failed",
        Details: map[string]interface{}{
            "originalError": originalErr.Error(),
            "database":      "primary",
            "timeout_ms":    5000,
        },
    }
    logError(logger, wrappedErr, "operation", "query_users")
}
```

## 最佳实践

### 使用适当的日志级别

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    }))

    // DEBUG：开发和详细诊断
    logger.Debug("function called",
        "functionName", "calculateTotal",
        "inputSize", 100,
    )

    // INFO：重要事件和状态变化
    logger.Info("user registered",
        "userId", "user_123",
        "email", "alice@example.com",
    )

    // WARN：可能需要关注的潜在问题
    logger.Warn("cache miss",
        "key", "user_456",
        "hitRate", "45%",
    )

    // ERROR：影响功能的失败操作
    logger.Error("payment processing failed",
        "orderId", "order_789",
        "error", "gateway_timeout",
    )
}
```

### 避免记录敏感数据

```go
package main

import (
    "log/slog"
    "os"
    "strings"
)

// 掩码敏感数据的辅助函数
func maskEmail(email string) string {
    parts := strings.Split(email, "@")
    if len(parts) != 2 {
        return "***"
    }
    return parts[0][:1] + "***@" + parts[1]
}

func maskCardNumber(card string) string {
    if len(card) < 4 {
        return "****"
    }
    return "****" + card[len(card)-4:]
}

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // 永远不要记录密码或完整卡号
    // logger.Info("user login", "password", password) // 错误！

    // 应该使用脱敏/掩码的敏感数据记录
    logger.Info("user login",
        "email", maskEmail("user@example.com"),
        "method", "password",
    )

    logger.Info("payment processed",
        "cardNumber", maskCardNumber("4111111111111111"),
        "amount", 99.99,
    )

    // 使用分组分离个人身份信息
    logger.InfoContext(nil, "customer profile",
        slog.Group("pii",
            "firstName", "***",
            "lastName", "***",
            "ssn", "***",
        ),
        "customerId", "cust_123",
    )
}
```

### 向日志添加请求上下文

```go
package main

import (
    "context"
    "log/slog"
    "os"
)

// 向日志记录器添加上下文值
func loggerFromContext(ctx context.Context, logger *slog.Logger) *slog.Logger {
    requestId, ok := ctx.Value("requestId").(string)
    if ok {
        logger = logger.With("requestId", requestId)
    }

    userId, ok := ctx.Value("userId").(string)
    if ok {
        logger = logger.With("userId", userId)
    }

    traceId, ok := ctx.Value("traceId").(string)
    if ok {
        logger = logger.With("traceId", traceId)
    }

    return logger
}

func processRequest(ctx context.Context) {
    logger := slog.Default()
    logger = loggerFromContext(ctx, logger)

    logger.Info("request processing started")
    logger.Debug("request parameters", "page", 1, "limit", 20)
    logger.Info("request processing completed")
}

func main() {
    slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

    ctx := context.Background()
    ctx = context.WithValue(ctx, "requestId", "req_12345")
    ctx = context.WithValue(ctx, "userId", "user_456")
    ctx = context.WithValue(ctx, "traceId", "trace_789")

    processRequest(ctx)
}
```

### 使用分组组织输出

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // 扁平属性
    logger.Info("payment completed",
        "orderId", "order_123",
        "amount", 99.99,
        "currency", "USD",
        "paymentMethod", "credit_card",
        "transactionId", "txn_456",
    )

    // 使用分组组织 - 产生嵌套 JSON
    logger.Info("payment completed",
        slog.Group("order",
            "id", "order_123",
            "amount", 99.99,
            "currency", "USD",
        ),
        slog.Group("payment",
            "method", "credit_card",
            "transactionId", "txn_456",
        ),
    )

    // 嵌套分组
    logger.Info("user action",
        slog.Group("user",
            "id", "user_123",
            slog.Group("profile",
                "name", "Alice",
                "email", "alice@example.com",
            ),
        ),
    )
}
```

## 常见陷阱

### 陷阱 1：在昂贵操作前不检查日志级别

```go
// 错误 - 昂贵操作总是运行
logger.Debug("debug info", "data", expensiveOperation())

// 正确 - 先检查级别
if logger.Enabled(nil, slog.LevelDebug) {
    logger.Debug("debug info", "data", expensiveOperation())
}
```

### 陷阱 2：传递不正确的参数类型

```go
// 错误 - 持续时间作为整数
logger.Info("request completed",
    "duration", 1234, // 这是毫秒还是微秒？
)

// 正确 - 使用明确的类型和单位
logger.Info("request completed",
    "duration_ms", 1234,
    "duration", time.Duration(1234)*time.Millisecond,
)
```

### 陷阱 3：忘记奇数参数

```go
// 错误 - 属性没有值（会 panic！）
// logger.Info("message", "key") // Panics!

// 正确 - 提供键和值
logger.Info("message", "key", "value")

// 正确 - 对复杂值使用 slog.Attr
logger.Info("message",
    slog.Attr{Key: "data", Value: slog.StringValue("value")},
)
```

### 陷阱 4：创建太多日志记录器实例

```go
// 错误 - 频繁创建新日志记录器
func handleRequest(w http.ResponseWriter, r *http.Request) {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)) // 太昂贵！
    logger.Info("handling request")
}

// 正确 - 重用日志记录器实例
var logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

func handleRequest(w http.ResponseWriter, r *http.Request) {
    requestLogger := logger.With("requestId", generateID())
    requestLogger.Info("handling request")
}
```

### 陷阱 5：错误地混合处理器类型

```go
// 错误 - TextHandler 输出与 JSON 预期混合
handler := slog.NewTextHandler(os.Stdout, nil)
// 之后：期望日志是 JSON，但得到的是文本格式

// 正确 - 一致的处理器配置
var handler slog.Handler
if os.Getenv("LOG_FORMAT") == "json" {
    handler = slog.NewJSONHandler(os.Stdout, nil)
} else {
    handler = slog.NewTextHandler(os.Stdout, nil)
}
logger := slog.New(handler)
```

## 性能考虑

### 处理器性能

```go
// 对不同处理器进行基准测试
package main

import (
    "io"
    "log/slog"
    "testing"
)

func BenchmarkJSONHandler(b *testing.B) {
    handler := slog.NewJSONHandler(io.Discard, nil)
    logger := slog.New(handler)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        logger.Info("test message",
            "key1", "value1",
            "key2", "value2",
            "key3", 123,
        )
    }
}

func BenchmarkTextHandler(b *testing.B) {
    handler := slog.NewTextHandler(io.Discard, nil)
    logger := slog.New(handler)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        logger.Info("test message",
            "key1", "value1",
            "key2", "value2",
            "key3", 123,
        )
    }
}
```

### 属性分配

```go
// 错误 - 每次分配新切片
func logRequest(logger *slog.Logger, method, path string, status int) {
    attrs := []interface{}{
        "method", method,
        "path", path,
        "status", status,
    }
    logger.Info("request", attrs...) // 分配！
}

// 正确 - 使用 slog.Attr 避免分配
func logRequest(logger *slog.Logger, method, path string, status int) {
    logger.Info("request",
        "method", method,
        "path", path,
        "status", status,
    )
}
```

### 避免不必要的分配

```go
package main

import (
    "fmt"
    "log/slog"
    "os"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // 错误 - 字符串拼接分配
    userId := "user_123"
    logger.Info("user action", "id", fmt.Sprintf("User: %s", userId))

    // 正确 - 传递单独的值
    logger.Info("user action", "userId", userId, "prefix", "User")

    // 错误 - JSON 序列化开销
    type User struct {
        ID   string
        Name string
    }
    user := User{ID: "123", Name: "Alice"}
    logger.Info("user data", "user", user) // 序列化开销

    // 正确 - 记录单独的字段
    logger.Info("user data",
        "userId", user.ID,
        "userName", user.Name,
    )
}
```

## 实际场景

### 场景 1：电商订单处理

```go
package main

import (
    "context"
    "log/slog"
    "os"
)

type Order struct {
    ID     string
    UserID string
    Amount float64
    Items  int
}

func processOrder(ctx context.Context, logger *slog.Logger, order *Order) error {
    // 创建上下文日志记录器
    orderLogger := logger.WithGroup("order").With(
        "orderId", order.ID,
        "userId", order.UserID,
        "amount", order.Amount,
    )

    orderLogger.InfoContext(ctx, "order processing started")

    // 验证
    if err := validateOrder(order); err != nil {
        orderLogger.ErrorContext(ctx, "validation failed",
            "error", err,
        )
        return err
    }

    orderLogger.DebugContext(ctx, "validation passed")

    // 处理支付
    if err := processPayment(ctx, order); err != nil {
        orderLogger.ErrorContext(ctx, "payment failed",
            "error", err,
            "retryable", true,
        )
        return err
    }

    orderLogger.InfoContext(ctx, "payment succeeded",
        "transactionId", "txn_123",
    )

    // 更新库存
    if err := updateInventory(ctx, order); err != nil {
        orderLogger.WarnContext(ctx, "inventory update failed",
            "error", err,
            "severity", "low",
        )
        // 不返回 - 这不是关键错误
    }

    orderLogger.InfoContext(ctx, "order completed successfully")
    return nil
}

func validateOrder(order *Order) error { return nil }
func processPayment(ctx context.Context, order *Order) error { return nil }
func updateInventory(ctx context.Context, order *Order) error { return nil }

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    }))
    slog.SetDefault(logger)

    ctx := context.Background()
    order := &Order{
        ID:     "order_123",
        UserID: "user_456",
        Amount: 99.99,
        Items:  3,
    }

    processOrder(ctx, logger, order)
}
```

### 场景 2：数据库操作日志

```go
package main

import (
    "context"
    "log/slog"
    "os"
    "time"
)

type QueryMetrics struct {
    Duration    time.Duration
    RowsAffected int
    RowsReturned int
}

func logDatabaseOperation(ctx context.Context, logger *slog.Logger, operation string, query string, metrics QueryMetrics) {
    severity := slog.LevelInfo
    message := "database operation"

    // 如果查询慢则警告
    if metrics.Duration > 1*time.Second {
        severity = slog.LevelWarn
        message = "slow database operation"
    }

    logger.Log(ctx, severity, message,
        "operation", operation,
        "duration_ms", metrics.Duration.Milliseconds(),
        "rowsAffected", metrics.RowsAffected,
        "rowsReturned", metrics.RowsReturned,
    )
}

func executeQuery(ctx context.Context, logger *slog.Logger, query string) (int, error) {
    start := time.Now()

    // 模拟查询执行
    time.Sleep(100 * time.Millisecond)
    rowsReturned := 42

    metrics := QueryMetrics{
        Duration:    time.Since(start),
        RowsAffected: 0,
        RowsReturned: rowsReturned,
    }

    logDatabaseOperation(ctx, logger, "select", query, metrics)
    return rowsReturned, nil
}

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    ctx := context.Background()
    executeQuery(ctx, logger, "SELECT * FROM users WHERE status = ?")
}
```

### 场景 3：认证和安全日志

```go
package main

import (
    "context"
    "log/slog"
    "os"
    "time"
)

type LoginAttempt struct {
    Username  string
    IPAddress string
    Success   bool
    Error     string
    Timestamp time.Time
}

func logLoginAttempt(ctx context.Context, logger *slog.Logger, attempt LoginAttempt) {
    // 安全敏感，始终记录
    attrs := []interface{}{
        "username", attempt.Username,
        "ipAddress", attempt.IPAddress,
        "success", attempt.Success,
        "timestamp", attempt.Timestamp,
    }

    if attempt.Success {
        logger.InfoContext(ctx, "user authenticated", attrs...)
    } else {
        logger.WarnContext(ctx, "authentication failed",
            append(attrs, "error", attempt.Error)...,
        )
    }
}

func logFailedLoginThreshold(ctx context.Context, logger *slog.Logger, username, ipAddress string, attempts int) {
    logger.WarnContext(ctx, "failed login threshold exceeded",
        "username", username,
        "ipAddress", ipAddress,
        "attempts", attempts,
        "action", "account_locked",
    )
}

func logSuspiciousActivity(ctx context.Context, logger *slog.Logger, userId, activity string, details map[string]interface{}) {
    logger.ErrorContext(ctx, "suspicious activity detected",
        "userId", userId,
        "activity", activity,
        "details", details,
    )
}

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    ctx := context.Background()

    // 成功登录
    logLoginAttempt(ctx, logger, LoginAttempt{
        Username:  "alice",
        IPAddress: "192.168.1.1",
        Success:   true,
        Timestamp: time.Now(),
    })

    // 失败登录
    logLoginAttempt(ctx, logger, LoginAttempt{
        Username:  "bob",
        IPAddress: "192.168.1.2",
        Success:   false,
        Error:     "invalid_password",
        Timestamp: time.Now(),
    })

    // 可疑活动
    logSuspiciousActivity(ctx, logger, "user_123", "brute_force_attack",
        map[string]interface{}{
            "failedAttempts": 50,
            "timeWindow":     "5m",
            "location":       "unknown",
        },
    )
}
```

## 面试要点

### 要点 1：slog 与第三方日志库对比

**问：slog 与 zerolog 或 zap 相比如何？**

```
slog 优势：
- 内置于标准库（无需外部依赖）
- 简单、最小化的 API 表面
- 核心操作的零分配设计
- Go 生态系统的标准化

第三方库（zerolog/zap）优势：
- 更成熟的生态系统和扩展
- 与现有工具更好的集成
- 开箱即用的更多输出格式选项
- 针对特定用例的性能优化

选择取决于：
- 项目复杂度和需求
- 团队对现有库的熟悉程度
- 性能要求
- 所需的生态系统集成
```

### 要点 2：处理器接口和自定义处理器

**问：自定义处理器必须实现什么才能与 slog 配合使用？**

```go
type Handler interface {
    Enabled(ctx context.Context, level Level) bool
    Handle(ctx context.Context, record Record) error
    WithAttrs(attrs []Attr) Handler
    WithGroup(name string) Handler
}

关键实现要点：
1. Enabled() - 确定级别是否通过过滤
2. Handle() - 处理日志记录
3. WithAttrs() - 返回带属性的新处理器
4. WithGroup() - 返回带分组名称的新处理器
```

### 要点 3：结构化日志的好处

**问：为什么结构化日志对生产系统更好？**

```
好处：
1. 机器可解析 - 便于日志聚合系统
2. 可查询 - 高效的过滤和搜索
3. 上下文保留 - 所有相关数据在一条记录中
4. 性能 - 无字符串格式化开销
5. 一致性 - 应用程序中统一的数据格式
6. 集成 - 与监控工具无缝配合
7. 关联 - 易于跨服务追踪相关事件

查询改进示例：
传统方式：
  grep "error" app.log | grep "order_123" | grep "payment"

结构化方式：
  logs | where level="ERROR" AND orderId="order_123" AND operation="payment"
```

### 要点 4：日志级别选择

**问：如何为不同场景选择日志级别？**

```
DEBUG：
  - 详细的函数参数
  - 循环迭代
  - 计算过程中的变量值
  - 调试时使用，永远不要在生产环境中使用

INFO：
  - 应用程序启动/关闭
  - 业务事件（登录、购买等）
  - 状态变化
  - 配置加载

WARN：
  - 可恢复的错误（重试、使用了后备方案）
  - 弃用使用
  - 性能问题
  - 配置问题

ERROR：
  - 失败的操作（保存用户失败）
  - 异常/panic
  - 依赖不可用
  - 请求处理失败
```

## 延伸阅读

### 官方文档
- [slog 包文档](https://pkg.go.dev/log/slog)
- [Go 博客：slog 介绍](https://go.dev/blog/slog)
- [slog Handler 接口](https://pkg.go.dev/log/slog#Handler)

### 相关主题
- **结构化日志最佳实践**：OpenTelemetry 日志规范
- **日志聚合**：ELK Stack、Loki、Datadog
- **分布式追踪**：OpenTelemetry、Jaeger
- **指标收集**：Prometheus 与 slog 集成
- **性能分析**：pprof 与结构化日志

### 外部资源
- [Uber Go 风格指南 - 日志](https://github.com/uber-go/guide/blob/master/style.md#structured-logging)
- [OpenTelemetry 日志规范](https://opentelemetry.io/docs/specs/otel/logs/)
- [十二要素应用日志](https://12factor.net/logs)

### 社区工具
- [slog Handler 实现](https://github.com/search?q=slog+handler)
- [slog 集成包](https://pkg.go.dev/search?q=slog)
- [Go 日志最佳实践指南](https://golang.org/doc/)

---

> 使用 slog 进行结构化日志是 Go 应用程序可观测性的现代方法。通过尽早采用 slog 并遵循最佳实践，你可以创建更易于调试、监控和在生产环境中维护的应用程序。Go 的简洁性与 slog 的结构化方法相结合，为构建可观测系统提供了坚实的基础。
