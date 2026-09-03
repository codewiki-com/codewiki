---
title: "Go Fiber Framework: Complete Guide"
description: Master the Go Fiber web framework - a high-performance Express.js-inspired framework built on Fasthttp with zero-memory allocation design
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Fiber
  - Web Framework
  - High Performance
  - Fasthttp
  - REST API
status: imported
origin: old/src/content/docs/go/fiber.en.md
divergence: 0.184
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: go
  subcategory: ""
  order: 12
  lastUpdated: 2026-01-07
---

## Concept Introduction

### What is Fiber?

Fiber is an Express.js-inspired Go web framework built on top of Fasthttp. Fasthttp is the fastest HTTP engine in Go, giving Fiber significant performance advantages. Fiber's design goal is to enable Node.js developers to quickly adopt Go web development while leveraging Go's performance and type safety.

**Key Characteristics:**
- Express.js-like API - familiar for JavaScript developers
- Built on Fasthttp - orders of magnitude faster than net/http
- Zero-copy design - minimal memory allocations
- Rich middleware ecosystem
- Type-safe with Go's static typing

### Why Choose Fiber?

**Performance:** Fiber routinely outperforms other Go frameworks:
- ~120,000 requests/sec vs Gin's ~90,000 and Echo's ~85,000
- Sub-millisecond latency
- Zero memory allocations per request

**Developer Experience:** Express.js developers feel at home:
- Similar API design
- Chainable middleware
- Intuitive routing

**Practicality:** Production-ready with:
- Rich built-in middleware
- Comprehensive error handling
- Native HTTP/2 support

### Solving Real Problems

1. **Development Velocity**: Familiar API reduces learning curve for Express developers
2. **Performance Requirements**: Fasthttp foundation handles extreme concurrency
3. **Type Safety**: Go's static typing prevents runtime errors
4. **Resource Efficiency**: Zero-allocation design crucial for high-frequency trading, real-time systems

## Core Principles

### Fasthttp Foundation

Fiber's performance comes from Fasthttp, which uses object pooling and strategic memory management:

```go
// Fasthttp request/response reuse pattern
// Each connection reuses RequestCtx, avoiding allocations
type RequestCtx struct {
    Request  Request      // Reused across requests
    Response Response     // Reused across requests
    conn     net.Conn
}

// Fiber wraps Fasthttp's RequestCtx
type Ctx struct {
    *fasthttp.RequestCtx
    route    *Route
    values   [maxParams]string  // Pre-allocated param storage
    matched  string
}
```

**Implication:** Strings from `c.Params()` and `c.Query()` are not copied - they reference pooled buffers that get reused. This requires careful memory management.

### Radix Tree Routing

Fiber uses a Radix Tree for efficient route matching:

```
/
├── users
│   ├── :id (params)
│   └── :id/posts (nested)
└── posts
    └── :id/comments (nested)

Time Complexity: O(n) where n = path length
Space Complexity: O(m) where m = number of routes
```

### Middleware Execution Model

Fiber implements the "onion" middleware model:

```
Request Flow:
Request → Middleware1.before → Middleware2.before → Handler
Response ← Middleware1.after ← Middleware2.after ← Handler

Each middleware wraps the next, enabling request/response processing
```

### Immutability vs. Performance Trade-off

By default, Fiber trades safety for speed:

```go
// Default: Fast but requires careful memory management
app := fiber.New(fiber.Config{
    Immutable: false,  // Context values are reused
})

// Alternative: Slower but safer
app := fiber.New(fiber.Config{
    Immutable: true,   // Context values are copied
})
```

## Key Points

- **Installation**: `go get github.com/gofiber/fiber/v2`
- **Port Configuration**: Listen on specified port with `app.Listen(":3000")`
- **HTTP Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD supported
- **Route Parameters**: Define with `:paramName` syntax, retrieve with `c.Params("paramName")`
- **Middleware Chain**: Use `c.Next()` to pass control to next handler
- **Request Parsing**: BodyParser auto-detects JSON, XML, form data
- **Error Handling**: Custom ErrorHandler in Config for unified error responses
- **Context Values**: Use `c.Locals()` to store request-scoped data
- **Static Files**: Serve with `app.Static("/path", "./directory")`
- **Graceful Shutdown**: Use `app.ShutdownWithTimeout()` for clean server termination
- **Memory Safety**: Copy values from `c.Params()`, `c.Query()` before async use
- **Prefork Mode**: Enable multi-core utilization with `Config.Prefork: true`
- **Streaming**: Use `c.Context().SetBodyStreamWriter()` for Server-Sent Events
- **Route Groups**: Organize routes with `app.Group()` for better structure
- **CORS**: Use `middleware/cors` for cross-origin requests
- **Rate Limiting**: Use `middleware/limiter` to throttle requests
- **Compression**: Use `middleware/compress` for response compression
- **Caching**: Use `middleware/cache` for response caching
- **Request ID**: Use `middleware/requestid` for request tracking
- **Helmet**: Use `middleware/helmet` for security headers

## Code Examples

### Basic Setup and Routing

```go
package main

import (
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/logger"
    "github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
    // Create app with custom config
    app := fiber.New(fiber.Config{
        AppName:       "My API v1.0.0",
        ServerHeader:  "Fiber",
        StrictRouting: false,
        CaseSensitive: false,
    })

    // Add global middleware
    app.Use(recover.New())
    app.Use(logger.New(logger.Config{
        Format: "${time} | ${status} | ${latency} | ${method} | ${path}\n",
    }))

    // Basic routes
    app.Get("/", func(c *fiber.Ctx) error {
        return c.SendString("Hello, Fiber!")
    })

    app.Get("/json", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "message": "Hello from Fiber",
            "time":    time.Now(),
        })
    })

    // Route with parameters
    app.Get("/users/:id", func(c *fiber.Ctx) error {
        id := c.Params("id")
        return c.JSON(fiber.Map{
            "user_id": id,
        })
    })

    // Health check
    app.Get("/health", func(c *fiber.Ctx) error {
        return c.SendStatus(fiber.StatusOK)
    })

    // 404 handler
    app.Use(func(c *fiber.Ctx) error {
        return fiber.NewError(fiber.StatusNotFound, "Route not found")
    })

    app.Listen(":3000")
}
```

### RESTful API Implementation

```go
package main

import (
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

var users = []User{
    {ID: 1, Name: "Alice", Email: "alice@example.com"},
    {ID: 2, Name: "Bob", Email: "bob@example.com"},
}

func main() {
    app := fiber.New()
    app.Use(cors.New())

    // Get all users
    app.Get("/api/users", func(c *fiber.Ctx) error {
        return c.JSON(users)
    })

    // Get single user
    app.Get("/api/users/:id", func(c *fiber.Ctx) error {
        id, err := c.ParamsInt("id")
        if err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid ID")
        }

        for _, user := range users {
            if user.ID == id {
                return c.JSON(user)
            }
        }

        return fiber.NewError(fiber.StatusNotFound, "User not found")
    })

    // Create user
    app.Post("/api/users", func(c *fiber.Ctx) error {
        var user User
        if err := c.BodyParser(&user); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid request")
        }

        user.ID = len(users) + 1
        users = append(users, user)

        return c.Status(fiber.StatusCreated).JSON(user)
    })

    // Update user
    app.Put("/api/users/:id", func(c *fiber.Ctx) error {
        id, err := c.ParamsInt("id")
        if err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid ID")
        }

        var updatedUser User
        if err := c.BodyParser(&updatedUser); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid request")
        }

        for i, user := range users {
            if user.ID == id {
                updatedUser.ID = id
                users[i] = updatedUser
                return c.JSON(updatedUser)
            }
        }

        return fiber.NewError(fiber.StatusNotFound, "User not found")
    })

    // Delete user
    app.Delete("/api/users/:id", func(c *fiber.Ctx) error {
        id, err := c.ParamsInt("id")
        if err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid ID")
        }

        for i, user := range users {
            if user.ID == id {
                users = append(users[:i], users[i+1:]...)
                return c.SendStatus(fiber.StatusNoContent)
            }
        }

        return fiber.NewError(fiber.StatusNotFound, "User not found")
    })

    app.Listen(":3000")
}
```

### Advanced Middleware and Authentication

```go
package main

import (
    "fmt"
    "time"
    "github.com/gofiber/fiber/v2"
    "github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-secret-key-change-this")

type Claims struct {
    UserID   int    `json:"user_id"`
    Username string `json:"username"`
    jwt.RegisteredClaims
}

// Custom authentication middleware
func authMiddleware(c *fiber.Ctx) error {
    authHeader := c.Get("Authorization")
    if authHeader == "" {
        return fiber.NewError(fiber.StatusUnauthorized, "Missing token")
    }

    tokenString := authHeader[7:] // Remove "Bearer " prefix
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        return jwtSecret, nil
    })

    if err != nil || !token.Valid {
        return fiber.NewError(fiber.StatusUnauthorized, "Invalid token")
    }

    claims := token.Claims.(*Claims)
    c.Locals("userID", claims.UserID)
    c.Locals("username", claims.Username)

    return c.Next()
}

// Timing middleware
func timingMiddleware(c *fiber.Ctx) error {
    start := time.Now()
    err := c.Next()
    duration := time.Since(start)
    c.Set("X-Response-Time", fmt.Sprintf("%dms", duration.Milliseconds()))
    return err
}

func main() {
    app := fiber.New(fiber.Config{
        ErrorHandler: func(c *fiber.Ctx, err error) error {
            code := fiber.StatusInternalServerError
            if e, ok := err.(*fiber.Error); ok {
                code = e.Code
            }
            return c.Status(code).JSON(fiber.Map{
                "error": err.Error(),
            })
        },
    })

    // Global middleware
    app.Use(timingMiddleware)

    // Public routes
    app.Post("/login", func(c *fiber.Ctx) error {
        var input struct {
            Username string `json:"username"`
            Password string `json:"password"`
        }

        if err := c.BodyParser(&input); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid request")
        }

        // Simple validation (in production, verify against database)
        if input.Username != "admin" || input.Password != "password" {
            return fiber.NewError(fiber.StatusUnauthorized, "Invalid credentials")
        }

        claims := Claims{
            UserID:   1,
            Username: input.Username,
            RegisteredClaims: jwt.RegisteredClaims{
                ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            },
        }

        token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
        tokenString, err := token.SignedString(jwtSecret)
        if err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, "Token generation failed")
        }

        return c.JSON(fiber.Map{
            "token": tokenString,
            "type":  "Bearer",
        })
    })

    // Protected routes
    protected := app.Group("/api", authMiddleware)

    protected.Get("/profile", func(c *fiber.Ctx) error {
        userID := c.Locals("userID").(int)
        username := c.Locals("username").(string)

        return c.JSON(fiber.Map{
            "user_id":  userID,
            "username": username,
        })
    })

    protected.Get("/data", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "data": "sensitive information",
        })
    })

    app.Listen(":3000")
}
```

### Request Validation and Error Handling

```go
package main

import (
    "github.com/gofiber/fiber/v2"
    "github.com/go-playground/validator/v10"
)

var validate = validator.New()

type CreateUserRequest struct {
    Username string `json:"username" validate:"required,min=3,max=20"`
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
    Age      int    `json:"age" validate:"required,gte=18,lte=120"`
}

type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}

func formatValidationErrors(err error) []ValidationError {
    var errors []ValidationError
    for _, err := range err.(validator.ValidationErrors) {
        errors = append(errors, ValidationError{
            Field:   err.Field(),
            Message: getValidationMessage(err),
        })
    }
    return errors
}

func getValidationMessage(err validator.FieldError) string {
    switch err.Tag() {
    case "required":
        return "Field is required"
    case "email":
        return "Invalid email format"
    case "min":
        return "Value is too short"
    case "max":
        return "Value is too long"
    default:
        return "Invalid value"
    }
}

func main() {
    app := fiber.New()

    app.Post("/register", func(c *fiber.Ctx) error {
        var req CreateUserRequest

        if err := c.BodyParser(&req); err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "Invalid JSON body",
            })
        }

        if err := validate.Struct(&req); err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error":  "Validation failed",
                "errors": formatValidationErrors(err),
            })
        }

        return c.Status(fiber.StatusCreated).JSON(fiber.Map{
            "message":  "User registered successfully",
            "username": req.Username,
        })
    })

    app.Listen(":3000")
}
```

## Best Practices

### Project Structure

```
myproject/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/
│   │   └── config.go            # Configuration management
│   ├── handler/
│   │   ├── user.go              # User handlers
│   │   └── post.go              # Post handlers
│   ├── middleware/
│   │   ├── auth.go              # Authentication
│   │   ├── cors.go              # CORS configuration
│   │   └── logger.go            # Custom logging
│   ├── model/
│   │   ├── user.go              # User model
│   │   └── post.go              # Post model
│   ├── repository/
│   │   ├── user.go              # User data layer
│   │   └── post.go              # Post data layer
│   ├── service/
│   │   ├── user.go              # User business logic
│   │   └── post.go              # Post business logic
│   └── router/
│       └── router.go            # Route configuration
├── pkg/
│   ├── response/
│   │   └── response.go          # Unified response format
│   └── errors/
│       └── errors.go            # Custom error types
├── config/
│   ├── config.yaml              # Configuration file
│   └── config.prod.yaml         # Production config
├── Dockerfile
├── docker-compose.yml
├── go.mod
└── go.sum
```

### Graceful Shutdown

```go
package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "syscall"
    "time"
    "github.com/gofiber/fiber/v2"
)

func main() {
    app := fiber.New()

    app.Get("/", func(c *fiber.Ctx) error {
        return c.SendString("Hello, World!")
    })

    // Start server in goroutine
    go func() {
        if err := app.Listen(":3000"); err != nil {
            log.Printf("Server error: %v", err)
        }
    }()

    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Shutting down server...")

    // Graceful shutdown with 30 second timeout
    if err := app.ShutdownWithTimeout(30 * time.Second); err != nil {
        log.Printf("Server forced to shutdown: %v", err)
    }

    log.Println("Server exited")
}
```

### Unified Error Handling

```go
type ErrorResponse struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}

type AppError struct {
    Code    int
    Message string
    Details string
}

func (e *AppError) Error() string {
    return e.Message
}

func errorHandler(c *fiber.Ctx, err error) error {
    code := fiber.StatusInternalServerError
    response := ErrorResponse{
        Code:    5000,
        Message: "Internal server error",
    }

    var appErr *AppError
    if errors.As(err, &appErr) {
        code = appErr.Code
        response = ErrorResponse{
            Code:    appErr.Code,
            Message: appErr.Message,
            Details: appErr.Details,
        }
    }

    var fiberErr *fiber.Error
    if errors.As(err, &fiberErr) {
        code = fiberErr.Code
        response.Code = fiberErr.Code
        response.Message = fiberErr.Message
    }

    return c.Status(code).JSON(response)
}
```

### Middleware Chain Management

```go
// Order matters! More restrictive middleware should come first
app.Use(recover.New())              // Catch panics first
app.Use(logger.New())               // Log all requests
app.Use(cors.New())                 // Handle CORS
app.Use(helmet.New())               // Security headers
app.Use(limiter.New())              // Rate limiting
app.Use(compress.New())             // Response compression
```

### Configuration Management

```go
type Config struct {
    Server struct {
        Port            string
        ReadTimeout     time.Duration
        WriteTimeout    time.Duration
        IdleTimeout     time.Duration
        MaxHeaderBytes  int
        Prefork         bool
    }
    Database struct {
        Host     string
        Port     string
        User     string
        Password string
        DBName   string
    }
    JWT struct {
        Secret string
        Expiry time.Duration
    }
}

// Load from environment or config file
func LoadConfig() (*Config, error) {
    // Implementation depends on your config library
}
```

## Common Pitfalls

### Context Value Reuse in Goroutines

**Problem:** Values from `c.Params()` are reused after handler returns.

```go
// WRONG: Value will be corrupted in async code
func handler(c *fiber.Ctx) error {
    name := c.Params("name")

    go func() {
        // DANGER: name may be overwritten by next request
        saveToDatabase(name)
    }()

    return c.SendString("OK")
}

// CORRECT: Copy the value
func handler(c *fiber.Ctx) error {
    // Copy to new string
    name := string([]byte(c.Params("name")))

    go func() {
        // Safe: name is independent copy
        saveToDatabase(name)
    }()

    return c.SendString("OK")
}
```

### Forgetting to Return After Sending Response

```go
// WRONG: Code continues after response sent
func handler(c *fiber.Ctx) error {
    if someError {
        c.Status(400).JSON(fiber.Map{"error": "bad"})
        // Handler continues! Response headers already sent
    }

    return c.JSON(fiber.Map{"data": "ok"})  // Writes twice!
}

// CORRECT: Always return immediately
func handler(c *fiber.Ctx) error {
    if someError {
        return c.Status(400).JSON(fiber.Map{"error": "bad"})
    }

    return c.JSON(fiber.Map{"data": "ok"})
}
```

### Calling BodyParser Multiple Times

```go
// WRONG: Body can only be read once
func handler(c *fiber.Ctx) error {
    var user User
    c.BodyParser(&user)  // First read consumes body

    var post Post
    c.BodyParser(&post)  // Second read gets empty body

    return c.SendString("OK")
}

// CORRECT: Read body once and parse multiple times
func handler(c *fiber.Ctx) error {
    body := c.Body()

    var user User
    json.Unmarshal(body, &user)

    var post Post
    json.Unmarshal(body, &post)

    return c.SendString("OK")
}
```

### Incorrect Middleware Ordering

```go
// WRONG: Authentication middleware blocks logging
app.Use(authMiddleware)    // Blocks unauthorized requests
app.Use(logger.New())      // Doesn't log failed auth attempts

// CORRECT: Logging should be first
app.Use(logger.New())      // Logs everything
app.Use(authMiddleware)    // Blocks after logging
```

### Not Handling Parameter Conversion Errors

```go
// WRONG: No error handling
func handler(c *fiber.Ctx) error {
    id, _ := c.ParamsInt("id")  // Ignoring error
    return c.JSON(fiber.Map{"id": id})
}

// CORRECT: Validate parameters
func handler(c *fiber.Ctx) error {
    id, err := c.ParamsInt("id")
    if err != nil {
        return fiber.NewError(fiber.StatusBadRequest, "Invalid ID format")
    }
    return c.JSON(fiber.Map{"id": id})
}
```

## Performance Considerations

### Prefork Mode for Multi-Core

```go
app := fiber.New(fiber.Config{
    Prefork: true,  // Creates N processes for N CPU cores
})
```

**Trade-off:** Slightly higher memory usage but better CPU utilization on multi-core systems.

### Object Pooling

```go
var userPool = sync.Pool{
    New: func() interface{} {
        return new(User)
    },
}

func handler(c *fiber.Ctx) error {
    user := userPool.Get().(*User)
    defer func() {
        *user = User{}  // Reset
        userPool.Put(user)
    }()

    c.BodyParser(user)
    // Use user...

    return c.JSON(user)
}
```

### Pre-allocate Slices

```go
// WRONG: Dynamic allocation
var results []User

// CORRECT: Pre-allocate if size known
results := make([]User, 0, expectedSize)
```

### Connection Timeouts

```go
app := fiber.New(fiber.Config{
    ReadTimeout:  10 * time.Second,    // Abort slow clients
    WriteTimeout: 10 * time.Second,    // Abort slow sends
    IdleTimeout:  120 * time.Second,   // Close idle connections
})
```

### Response Compression

```go
import "github.com/gofiber/fiber/v2/middleware/compress"

app.Use(compress.New(compress.Config{
    Level: compress.LevelBestSpeed,  // Balance compression vs CPU
}))
```

### Performance Benchmarks

| Metric | Fiber | Gin | Echo | net/http |
|--------|-------|-----|------|----------|
| Requests/sec | ~120,000 | ~90,000 | ~85,000 | ~60,000 |
| Avg Latency | 0.82ms | 1.1ms | 1.2ms | 1.6ms |
| Allocations | 0 allocs/op | 4 allocs/op | 3 allocs/op | 6 allocs/op |
| Memory/req | 0 bytes | ~700 bytes | ~600 bytes | ~900 bytes |

*Benchmarks vary by scenario; always test your specific workload.*

## Real-world Scenarios

### Building a Content Management API

```go
type Post struct {
    ID        int       `json:"id"`
    Title     string    `json:"title" validate:"required,min=5"`
    Content   string    `json:"content" validate:"required,min=50"`
    Author    string    `json:"author"`
    Published bool      `json:"published"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

func setupPostRoutes(app *fiber.App, postService *PostService) {
    posts := app.Group("/api/posts")

    posts.Get("/", func(c *fiber.Ctx) error {
        page, _ := strconv.Atoi(c.Query("page", "1"))
        limit, _ := strconv.Atoi(c.Query("limit", "10"))

        items, total, err := postService.List(c.Context(), page, limit)
        if err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, err.Error())
        }

        return c.JSON(fiber.Map{
            "data": items,
            "pagination": fiber.Map{
                "page":  page,
                "limit": limit,
                "total": total,
            },
        })
    })

    posts.Get("/:id", func(c *fiber.Ctx) error {
        id, _ := c.ParamsInt("id")
        post, err := postService.GetByID(c.Context(), id)
        if err != nil {
            return fiber.NewError(fiber.StatusNotFound, "Post not found")
        }
        return c.JSON(post)
    })

    posts.Post("/", func(c *fiber.Ctx) error {
        var post Post
        if err := c.BodyParser(&post); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid request")
        }

        if err := validate.Struct(&post); err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "errors": err.Error(),
            })
        }

        created, err := postService.Create(c.Context(), &post)
        if err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, err.Error())
        }

        return c.Status(fiber.StatusCreated).JSON(created)
    })
}
```

### WebSocket Chat Application

```go
import "github.com/gofiber/contrib/websocket"

func setupChatRoutes(app *fiber.App) {
    var clients = make(map[*websocket.Conn]bool)
    var broadcast = make(chan string)

    app.Get("/ws", websocket.New(func(c *websocket.Conn) {
        clients[c] = true

        for {
            var msg string
            if err := c.ReadMessage(&msg); err != nil {
                delete(clients, c)
                return
            }

            broadcast <- fmt.Sprintf("[%s]: %s", c.RemoteAddr(), msg)
        }
    }))

    go func() {
        for msg := range broadcast {
            for client := range clients {
                if err := client.WriteMessage(websocket.TextMessage, []byte(msg)); err != nil {
                    delete(clients, client)
                }
            }
        }
    }()
}
```

### File Upload with Validation

```go
func setupFileRoutes(app *fiber.App) {
    app.Post("/upload", func(c *fiber.Ctx) error {
        file, err := c.FormFile("file")
        if err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "No file provided")
        }

        // Validate file size (max 10MB)
        if file.Size > 10*1024*1024 {
            return fiber.NewError(fiber.StatusBadRequest, "File too large")
        }

        // Validate file type
        ext := filepath.Ext(file.Filename)
        validExts := map[string]bool{".pdf": true, ".doc": true, ".docx": true}
        if !validExts[ext] {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid file type")
        }

        // Save file
        path := filepath.Join("./uploads", file.Filename)
        if err := c.SaveFile(file, path); err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, "Failed to save file")
        }

        return c.JSON(fiber.Map{
            "filename": file.Filename,
            "size":     file.Size,
            "path":     path,
        })
    })
}
```

## Interview Points

### Q1: Explain Fiber's Zero-Memory Allocation Design

**Answer:** Fiber uses Fasthttp's object pooling to reuse request/response buffers across requests. This means:
- No memory allocation per request (in hot paths)
- Strings from `c.Params()` and `c.Query()` reference pooled buffers
- These buffers are recycled when the request ends
- Requires developers to copy values before async operations

**Trade-off:** Better performance but requires careful memory management.

### Q2: How Do You Handle Memory Safety in Fiber?

**Answer:**
```go
// Problem: Async code may see corrupted values
name := c.Params("name")
go func() {
    // name might change before goroutine runs
}()

// Solution: Copy the value
name := string([]byte(c.Params("name")))
// Or use utils.CopyString(c.Params("name"))
go func() {
    // Now safe
}()
```

### Q3: Fiber vs Gin - Which Do You Choose?

**Fiber When:**
- Ultra-low latency is critical
- Team familiar with Express.js
- Can handle non-standard HTTP implementation
- Handling tens of thousands of requests/sec

**Gin When:**
- Compatibility with net/http ecosystem
- Using libraries that require standard http.Handler
- Team prioritizes stability over raw performance
- Standard library is sufficient

### Q4: Explain Middleware Execution Order

**Answer:** Middleware follows the "onion" model:
```
Request → Middleware1 → Middleware2 → Handler
Response ← Middleware1 ← Middleware2 ← Handler
```

Each middleware's `c.Next()` passes control down. After handler returns, execution continues in reverse.

**Order matters:** Logging before auth, compression before caching, etc.

### Q5: How Do You Implement Proper Error Handling?

**Answer:** Use a custom error type and centralized error handler:
```go
type AppError struct {
    Code    int
    Message string
    Status  int
}

app := fiber.New(fiber.Config{
    ErrorHandler: func(c *fiber.Ctx, err error) error {
        var appErr *AppError
        if errors.As(err, &appErr) {
            return c.Status(appErr.Status).JSON(appErr)
        }
        // Handle other error types...
    },
})
```

## Further Reading

### Official Resources
- [Fiber Official Documentation](https://docs.gofiber.io/)
- [Fiber GitHub Repository](https://github.com/gofiber/fiber)
- [Fiber Examples](https://github.com/gofiber/recipes)

### Related Frameworks
- [Gin Web Framework](https://gin-gonic.com/)
- [Echo Framework](https://echo.labstack.com/)
- [Fasthttp Performance](https://github.com/valyala/fasthttp)

### Advanced Topics
- [Fiber Middleware Ecosystem](https://docs.gofiber.io/api/middleware)
- [WebSocket Support](https://docs.gofiber.io/api/middleware/websocket)
- [Template Engines](https://docs.gofiber.io/api/middleware/template)

### Go Resources
- [Go Official Documentation](https://go.dev/doc/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)

### Community
- [Fiber Discord Community](https://discord.gg/fgyhtTKKn6)
- [Go Community Forums](https://golang.org/wiki/Forums)
- [Fiber GitHub Discussions](https://github.com/gofiber/fiber/discussions)
