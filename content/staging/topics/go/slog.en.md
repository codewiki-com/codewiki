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
origin: old/src/content/docs/go/slog.en.md
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

## Concept Overview

Go 1.21 introduced `slog`, a built-in package for structured logging that has become the standard logging approach in modern Go applications. Unlike traditional logging which produces unstructured text, slog outputs structured key-value pairs in formats like JSON, making logs machine-parseable and highly queryable.

### Why slog Matters

Before slog, Go developers had to choose between third-party logging libraries (like zap, zerolog, or logrus) or use the basic `log` package. The introduction of `slog` provides:

- **Official standard library support** - No need for external dependencies
- **Structured logging out of the box** - Built-in JSON output capability
- **Performance optimized** - Zero-allocation operations where possible
- **Flexible handlers** - Easy to extend with custom output formats
- **Log levels** - Multiple severity levels for better filtering

### Common Use Cases

```
1. Application debugging in development environments
2. Production observability and monitoring
3. Audit trail and compliance logging
4. Performance profiling and bottleneck identification
5. Security event tracking and anomaly detection
6. Distributed tracing correlation across services
```

## Core Principles

### Structured Logging Concept

Structured logging moves away from string formatting to key-value pairs that are machine-parseable:

```go
// Traditional logging (unstructured)
log.Printf("User %s logged in from %s at %s", username, ipAddress, time.Now())
// Output: "User alice logged in from 192.168.1.1 at 2024-01-15 10:30:45"

// Structured logging with slog
slog.Info("user login",
    "username", username,
    "ipAddress", ipAddress,
    "timestamp", time.Now(),
)
// Output: {"time":"2024-01-15T10:30:45.123Z","level":"INFO","msg":"user login","username":"alice","ipAddress":"192.168.1.1","timestamp":"2024-01-15T10:30:45.000Z"}
```

### Log Levels in slog

slog defines four standard log levels, ordered by severity:

```
┌──────────────────────────────────────────────────────────────┐
│                    slog Log Levels                            │
├──────────────────────────────────────────────────────────────┤
│  DEBUG  │ Verbose diagnostic information (off by default)    │
│  INFO   │ General operational events and state changes       │
│  WARN   │ Warning conditions requiring attention            │
│  ERROR  │ Error conditions that need immediate action       │
└──────────────────────────────────────────────────────────────┘
```

Each level has an associated integer value:
- DEBUG: -4
- INFO: 0
- WARN: 4
- ERROR: 8

### Handler Architecture

Handlers determine where and how logs are output. slog provides two built-in handlers:

- **TextHandler** - Human-readable text format (best for development)
- **JSONHandler** - Structured JSON format (best for production/aggregation)

```go
// TextHandler output
2024-01-15T10:30:45.123Z INFO "user login" username=alice ipAddress=192.168.1.1

// JSONHandler output
{"time":"2024-01-15T10:30:45.123Z","level":"INFO","msg":"user login","username":"alice","ipAddress":"192.168.1.1"}
```

### Attributes and Record Data

slog uses two main concepts for log data:

- **Attributes** - Key-value pairs added at log call time
- **Groups** - Collections of related attributes that can be nested

```go
// Simple attributes
slog.Info("payment processed",
    "orderId", "order_123",
    "amount", 99.99,
    "currency", "USD",
)

// Grouped attributes
slog.Info("payment processed",
    slog.Group("order",
        "id", "order_123",
        "amount", 99.99,
        "currency", "USD",
    ),
)
```

### Context-Aware Logging

slog loggers can be bound with context using `WithAttrs` and `WithGroup`:

```go
// Create a logger with request context
logger := slog.Default().With(
    "requestId", "req_123",
    "userId", "user_456",
)

// All subsequent logs include this context
logger.Info("processing request")
logger.Error("request failed", "error", err)
```

## Key Points

### Basic slog Usage

The simplest way to use slog is with the default logger:

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    // Use default logger (TextHandler)
    slog.Info("application started", "version", "1.0.0")
    slog.Warn("configuration missing", "key", "DATABASE_URL")
    slog.Error("database connection failed", "error", "connection timeout")

    // Debug logs are off by default (minimum level is INFO)
    slog.Debug("debug info") // This won't appear in output
}
```

### Logger Configuration

Create and configure custom loggers for different purposes:

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    // JSON handler for structured output
    jsonHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug, // Include debug logs
    })
    jsonLogger := slog.New(jsonHandler)

    // Text handler for development (more readable)
    textHandler := slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    })
    textLogger := slog.New(textHandler)

    // Replace default logger
    slog.SetDefault(jsonLogger)

    jsonLogger.Info("this goes to JSON")
    textLogger.Info("this goes to text format")
}
```

### Adding Attributes

Add contextual information to logs at different levels:

```go
package main

import (
    "log/slog"
    "os"
    "time"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // Single call attributes
    logger.Info("user login",
        "username", "alice",
        "ip", "192.168.1.1",
        "duration_ms", 45,
    )

    // Create child loggers with persistent attributes
    requestLogger := logger.With(
        "requestId", "req_12345",
        "userId", "user_456",
    )

    // These logs automatically include requestId and userId
    requestLogger.Info("request started")
    requestLogger.Info("database query", "table", "users", "duration_ms", 12)
    requestLogger.Error("request failed", "error", "timeout")
}
```

### Log Levels and Filtering

Control which messages get logged based on severity:

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

    // Parse log level from string
    var logLevel slog.Level
    if err := logLevel.UnmarshalText([]byte(level)); err != nil {
        logLevel = slog.LevelInfo
    }

    handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: logLevel,
    })
    logger := slog.New(handler)
    slog.SetDefault(logger)

    slog.Debug("debug message")    // Only shows if level is debug
    slog.Info("info message")      // Shows for info and above
    slog.Warn("warning message")   // Shows for warn and above
    slog.Error("error message")    // Always shown

    // Check level before expensive operations
    if logger.Enabled(nil, slog.LevelDebug) {
        slog.Debug("expensive debug info", "data", complexCalculation())
    }
}

func complexCalculation() string {
    return "expensive result"
}
```

### Error Logging

Proper error logging with context:

```go
package main

import (
    "errors"
    "log/slog"
    "os"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // Log with error
    err := errors.New("database connection failed")
    logger.Error("operation failed",
        "error", err,
        "operation", "fetch_user",
        "userId", "user_123",
    )

    // Log with error details
    var appErr *AppError
    if errors.As(err, &appErr) {
        logger.Error("app error occurred",
            "code", appErr.Code,
            "message", appErr.Message,
            "details", appErr.Details,
        )
    }

    // Structured error information
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

## Code Examples

### Example 1: Complete Application Setup

```go
package main

import (
    "context"
    "log/slog"
    "os"
)

// Logger configuration based on environment
func setupLogger(env string) *slog.Logger {
    var opts *slog.HandlerOptions

    if env == "production" {
        // JSON output for aggregation systems
        opts = &slog.HandlerOptions{
            Level: slog.LevelInfo,
        }
        handler := slog.NewJSONHandler(os.Stdout, opts)
        return slog.New(handler)
    } else {
        // Text output for development
        opts = &slog.HandlerOptions{
            Level: slog.LevelDebug,
            AddSource: true, // Show file and line number
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

    // Use logger throughout application
    processOrder(logger, "order_123", 99.99)
}

func processOrder(logger *slog.Logger, orderId string, amount float64) {
    // Create child logger with request context
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
    return nil // Success
}

func processPayment(ctx context.Context, orderId string, amount float64) error {
    return nil // Success
}
```

### Example 2: HTTP Server with Request Logging

```go
package main

import (
    "context"
    "log/slog"
    "net/http"
    "os"
    "time"
)

// Middleware for request logging
func requestLoggingMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            requestId := r.Header.Get("X-Request-ID")
            if requestId == "" {
                requestId = generateID()
            }

            // Create context with logger containing request ID
            ctx := context.WithValue(r.Context(), "requestId", requestId)
            r = r.WithContext(ctx)

            // Create response writer wrapper to capture status code
            wrapped := &responseWriter{ResponseWriter: w}

            // Log request
            logger.InfoContext(ctx, "request started",
                "method", r.Method,
                "path", r.URL.Path,
                "remoteAddr", r.RemoteAddr,
                "userAgent", r.UserAgent(),
            )

            // Call handler
            next.ServeHTTP(wrapped, r)

            // Log response
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

    // Simulate database query
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

### Example 3: Custom Handler for File Rotation

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

// RotatingFileHandler writes logs to files with daily rotation
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
        return nil // Already using today's file
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
    // Check if we need to rotate
    if time.Now().Format("2006-01-02") != h.currentDate {
        if err := h.rotate(); err != nil {
            return err
        }
    }

    h.mu.Lock()
    defer h.mu.Unlock()

    // Use JSONHandler to format the record
    jsonHandler := slog.NewJSONHandler(h.currentFile, h.opts)
    return jsonHandler.Handle(ctx, record)
}

func (h *RotatingFileHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
    jsonHandler := slog.NewJSONHandler(io.Discard, h.opts)
    return h // Simplified - actual implementation would update opts
}

func (h *RotatingFileHandler) WithGroup(name string) slog.Handler {
    return h // Simplified - actual implementation would handle groups
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

// Add the missing import
import "context"
```

### Example 4: Error Tracking and Reporting

```go
package main

import (
    "errors"
    "log/slog"
    "os"
)

// Error types for application
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

// Structured error logging
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

    // Example 1: Validation error
    validationErr := &AppError{
        Code:    ErrCodeInvalidInput,
        Message: "validation failed",
        Details: map[string]interface{}{
            "field":  "email",
            "reason": "invalid format",
        },
    }
    logError(logger, validationErr, "userId", "user_123", "operation", "signup")

    // Example 2: Not found error
    notFoundErr := &AppError{
        Code:    ErrCodeNotFound,
        Message: "user not found",
    }
    logError(logger, notFoundErr, "userId", "user_999", "operation", "fetch")

    // Example 3: Wrapped error
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

## Best Practices

### Use Appropriate Log Levels

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

    // DEBUG: Development and detailed diagnostics
    logger.Debug("function called",
        "functionName", "calculateTotal",
        "inputSize", 100,
    )

    // INFO: Significant events and state changes
    logger.Info("user registered",
        "userId", "user_123",
        "email", "alice@example.com",
    )

    // WARN: Potential issues that might require attention
    logger.Warn("cache miss",
        "key", "user_456",
        "hitRate", "45%",
    )

    // ERROR: Failed operations that affect functionality
    logger.Error("payment processing failed",
        "orderId", "order_789",
        "error", "gateway_timeout",
    )
}
```

### Avoid Logging Sensitive Data

```go
package main

import (
    "log/slog"
    "os"
    "strings"
)

// Helper function to mask sensitive data
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

    // NEVER log passwords or full card numbers
    // logger.Info("user login", "password", password) // WRONG!

    // DO log with redacted/masked sensitive data
    logger.Info("user login",
        "email", maskEmail("user@example.com"),
        "method", "password",
    )

    logger.Info("payment processed",
        "cardNumber", maskCardNumber("4111111111111111"),
        "amount", 99.99,
    )

    // Use group for PII separation
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

### Add Request Context to Logs

```go
package main

import (
    "context"
    "log/slog"
    "os"
)

// Add context values to logger
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

### Use Groups for Organized Output

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // Flat attributes
    logger.Info("payment completed",
        "orderId", "order_123",
        "amount", 99.99,
        "currency", "USD",
        "paymentMethod", "credit_card",
        "transactionId", "txn_456",
    )

    // Organized with groups - produces nested JSON
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

    // Nested groups
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

## Common Pitfalls

### Pitfall 1: Not Checking Log Level Before Expensive Operations

```go
// BAD - expensive operation always runs
logger.Debug("debug info", "data", expensiveOperation())

// GOOD - check level first
if logger.Enabled(nil, slog.LevelDebug) {
    logger.Debug("debug info", "data", expensiveOperation())
}
```

### Pitfall 2: Passing Incorrect Argument Types

```go
// BAD - duration as integer
logger.Info("request completed",
    "duration", 1234, // Should this be milliseconds or microseconds?
)

// GOOD - use explicit types and units
logger.Info("request completed",
    "duration_ms", 1234,
    "duration", time.Duration(1234)*time.Millisecond,
)
```

### Pitfall 3: Forgetting Odd Number of Arguments

```go
// BAD - attribute without value (panic!)
// logger.Info("message", "key") // Panics!

// GOOD - provide both key and value
logger.Info("message", "key", "value")

// GOOD - use slog.Attr for complex values
logger.Info("message",
    slog.Attr{Key: "data", Value: slog.StringValue("value")},
)
```

### Pitfall 4: Creating Too Many Logger Instances

```go
// BAD - creating new logger frequently
func handleRequest(w http.ResponseWriter, r *http.Request) {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil)) // Too expensive!
    logger.Info("handling request")
}

// GOOD - reuse logger instances
var logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

func handleRequest(w http.ResponseWriter, r *http.Request) {
    requestLogger := logger.With("requestId", generateID())
    requestLogger.Info("handling request")
}
```

### Pitfall 5: Mixing Handler Types Incorrectly

```go
// BAD - TextHandler output mixed with JSON expectation
handler := slog.NewTextHandler(os.Stdout, nil)
// Later: expecting JSON from logs, but got text format

// GOOD - consistent handler configuration
var handler slog.Handler
if os.Getenv("LOG_FORMAT") == "json" {
    handler = slog.NewJSONHandler(os.Stdout, nil)
} else {
    handler = slog.NewTextHandler(os.Stdout, nil)
}
logger := slog.New(handler)
```

## Performance Considerations

### Handler Performance

```go
// Benchmarking different handlers
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

### Attribute Allocation

```go
// BAD - allocates new slice each time
func logRequest(logger *slog.Logger, method, path string, status int) {
    attrs := []interface{}{
        "method", method,
        "path", path,
        "status", status,
    }
    logger.Info("request", attrs...) // Allocation!
}

// GOOD - use slog.Attr to avoid allocation
func logRequest(logger *slog.Logger, method, path string, status int) {
    logger.Info("request",
        "method", method,
        "path", path,
        "status", status,
    )
}
```

### Avoiding Unnecessary Allocations

```go
package main

import (
    "fmt"
    "log/slog"
    "os"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // BAD - string concatenation allocation
    userId := "user_123"
    logger.Info("user action", "id", fmt.Sprintf("User: %s", userId))

    // GOOD - pass individual values
    logger.Info("user action", "userId", userId, "prefix", "User")

    // BAD - JSON marshaling overhead
    type User struct {
        ID   string
        Name string
    }
    user := User{ID: "123", Name: "Alice"}
    logger.Info("user data", "user", user) // Marshal overhead

    // GOOD - log individual fields
    logger.Info("user data",
        "userId", user.ID,
        "userName", user.Name,
    )
}
```

## Real-world Scenarios

### Scenario 1: E-commerce Order Processing

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
    // Create contextual logger
    orderLogger := logger.WithGroup("order").With(
        "orderId", order.ID,
        "userId", order.UserID,
        "amount", order.Amount,
    )

    orderLogger.InfoContext(ctx, "order processing started")

    // Validate
    if err := validateOrder(order); err != nil {
        orderLogger.ErrorContext(ctx, "validation failed",
            "error", err,
        )
        return err
    }

    orderLogger.DebugContext(ctx, "validation passed")

    // Process payment
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

    // Update inventory
    if err := updateInventory(ctx, order); err != nil {
        orderLogger.WarnContext(ctx, "inventory update failed",
            "error", err,
            "severity", "low",
        )
        // Don't return - this is not critical
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

### Scenario 2: Database Operation Logging

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

    // Warn if query is slow
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

    // Simulate query execution
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

### Scenario 3: Authentication and Security Logging

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
    // Security-sensitive, always log
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

    // Successful login
    logLoginAttempt(ctx, logger, LoginAttempt{
        Username:  "alice",
        IPAddress: "192.168.1.1",
        Success:   true,
        Timestamp: time.Now(),
    })

    // Failed login
    logLoginAttempt(ctx, logger, LoginAttempt{
        Username:  "bob",
        IPAddress: "192.168.1.2",
        Success:   false,
        Error:     "invalid_password",
        Timestamp: time.Now(),
    })

    // Suspicious activity
    logSuspiciousActivity(ctx, logger, "user_123", "brute_force_attack",
        map[string]interface{}{
            "failedAttempts": 50,
            "timeWindow":     "5m",
            "location":       "unknown",
        },
    )
}
```

## Interview Points

### Point 1: slog vs Third-Party Logging Libraries

**Q: How does slog compare to zerolog or zap?**

```
slog Advantages:
- Built-in to standard library (no external dependencies)
- Simple, minimal API surface
- Zero-allocation design for core operations
- Standardization across Go ecosystem

Third-party (zerolog/zap) Advantages:
- More mature ecosystems with extensions
- Better integration with existing tools
- More output format options out of box
- Performance optimizations tailored to specific use cases

Choice depends on:
- Project complexity and requirements
- Team familiarity with existing libraries
- Performance requirements
- Ecosystem integrations needed
```

### Point 2: Handler Interface and Custom Handlers

**Q: What must a custom handler implement to work with slog?**

```go
type Handler interface {
    Enabled(ctx context.Context, level Level) bool
    Handle(ctx context.Context, record Record) error
    WithAttrs(attrs []Attr) Handler
    WithGroup(name string) Handler
}

Key implementation points:
1. Enabled() - determine if level passes filtering
2. Handle() - process the log record
3. WithAttrs() - return new handler with attributes
4. WithGroup() - return new handler with group name
```

### Point 3: Structured Logging Benefits

**Q: Why is structured logging better for production systems?**

```
Benefits:
1. Machine-parseable - easy for log aggregation systems
2. Queryable - efficient filtering and searching
3. Context preservation - all related data in one record
4. Performance - no string formatting overhead
5. Consistency - uniform data format across application
6. Integration - works seamlessly with monitoring tools
7. Correlation - easy to trace related events across services

Example query improvement:
Traditional:
  grep "error" app.log | grep "order_123" | grep "payment"

Structured:
  logs | where level="ERROR" AND orderId="order_123" AND operation="payment"
```

### Point 4: Log Level Selection

**Q: How should you choose log levels for different scenarios?**

```
DEBUG:
  - Detailed function arguments
  - Loop iterations
  - Variable values during computation
  - When debugging, NEVER in production

INFO:
  - Application startup/shutdown
  - Business events (login, purchase, etc.)
  - State changes
  - Configuration loaded

WARN:
  - Recoverable errors (retry, fallback used)
  - Deprecated usage
  - Performance concerns
  - Configuration issues

ERROR:
  - Failed operations (failed to save user)
  - Exceptions/panics
  - Dependency unavailable
  - Request processing failures
```

## Further Reading

### Official Documentation
- [slog Package Documentation](https://pkg.go.dev/log/slog)
- [Go Blog: slog Introduction](https://go.dev/blog/slog)
- [slog Handler Interface](https://pkg.go.dev/log/slog#Handler)

### Related Topics
- **Structured Logging Best Practices**: OpenTelemetry logging specification
- **Log Aggregation**: ELK Stack, Loki, Datadog
- **Distributed Tracing**: OpenTelemetry, Jaeger
- **Metrics Collection**: Prometheus integration with slog
- **Performance Profiling**: pprof with structured logging

### External Resources
- [Uber Go Style Guide - Logging](https://github.com/uber-go/guide/blob/master/style.md#structured-logging)
- [OpenTelemetry Logging Specification](https://opentelemetry.io/docs/specs/otel/logs/)
- [Twelve-Factor App Logs](https://12factor.net/logs)

### Community Tools
- [slog Handler Implementations](https://github.com/search?q=slog+handler)
- [slog Integration Packages](https://pkg.go.dev/search?q=slog)
- [Go Logging Best Practices Guide](https://golang.org/doc/)

---

> Structured logging with slog is the modern approach to application observability in Go. By adopting slog early and following best practices, you create applications that are easier to debug, monitor, and maintain in production. The combination of Go's simplicity and slog's structured approach provides a solid foundation for building observable systems.
