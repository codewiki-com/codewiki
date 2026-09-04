---
title: Echo Web框架
description: Echo完全指南，高性能Go Web框架的路由、中间件、请求绑定、验证与响应处理
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Echo
  - Web框架
  - HTTP
  - RESTful
status: imported
origin: old/src/content/docs/go/echo.en.md
divergence: 0.201
issues:
  - title-lang-en
  - title-language
legacy:
  category: Go
  subcategory: Web框架
  order: 11
  lastUpdated: 2026-01-07
---

## Concept Overview

Echo is a high-performance, extensible, and minimalist Go web framework. Created by Vishal Rana in 2015, Echo has become one of the popular choices for Go web development due to its clean API design, excellent performance, and rich feature set.

### What is Echo

Echo is a web framework that follows the "convention over configuration" philosophy, providing all the core functionality needed to build RESTful APIs and web applications:

- **High-Performance Routing**: Fast request matching based on optimized routing algorithms
- **Middleware Architecture**: Flexible middleware system with full control over the request lifecycle
- **Data Binding**: Automatic binding of request data to Go structs
- **Data Validation**: Built-in request data validation mechanism
- **Rendering Engine**: Support for multiple response formats including JSON, XML, and HTML
- **HTTP/2 Support**: Native support for the HTTP/2 protocol

### Historical Background

Echo's development timeline:

- **2015**: Echo 1.0 released, providing basic routing and middleware functionality
- **2016**: Echo 2.0 introduced Context interface, data binding, and validation
- **2018**: Echo 3.0 refactored the routing system, improving performance
- **2020**: Echo 4.0 released with Go Modules support and improved error handling
- **Present**: Continues to iterate and optimize, maintaining active community support

### Problems Solved

Echo framework primarily addresses the following development pain points:

1. **Standard Library Complexity**: Go's `net/http` is powerful but verbose; Echo encapsulates common operations
2. **Complex Route Management**: Provides intuitive route definition and grouping mechanisms
3. **Code Duplication**: Implements cross-cutting concerns reuse through middleware
4. **Request Handling Redundancy**: Automated data binding and validation reduce boilerplate code
5. **Scattered Error Handling**: Centralized error handling mechanism

### Comparison with Other Frameworks

| Feature | Echo | Gin | Fiber | Chi |
|---------|------|-----|-------|-----|
| Performance | Very High | Very High | Highest | High |
| API Style | Clean | Clean | Express-like | stdlib Compatible |
| Learning Curve | Low | Low | Low | Low |
| Feature Completeness | High | High | High | Medium |
| Community Activity | High | Highest | High | Medium |
| stdlib Compatibility | Partial | Partial | No | Yes |

## Core Principles

### Architecture Design

Echo adopts the classic MVC architectural concept, with core components including:

```
┌─────────────────────────────────────────────────────────────┐
│                      Echo Framework                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Router    │  │ Middleware  │  │      Context        │  │
│  │             │──│   Chain     │──│ (Request Context)   │  │
│  │             │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │               │                    │               │
│         ▼               ▼                    ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Group     │  │   Binder    │  │     Renderer        │  │
│  │(Route Group)│  │(Data Binding)│  │ (Response Render)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │               │                    │               │
│         ▼               ▼                    ▼               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Validator (Data Validation)          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Routing Principles

Echo uses an optimized prefix tree (Radix Tree) as its routing data structure:

```go
// Routing tree node structure (simplified)
type node struct {
    prefix    string     // Path prefix
    children  []*node    // Child nodes
    handlers  []Handler  // Handler functions
    pnames    []string   // Parameter name list
    kind      kind       // Node type: static/param/wildcard
}

// Route matching process
// 1. Start from the root node
// 2. Match level by level according to path prefix
// 3. Extract parameter values when encountering param nodes (:param)
// 4. Match remaining path when encountering wildcards (*)
// 5. Find the matching handler chain
```

### Middleware Execution Flow

Echo's middleware follows the Onion Model:

```
Request ──▶ Middleware A Pre ──▶ Middleware B Pre ──▶ Handler ──▶ Middleware B Post ──▶ Middleware A Post ──▶ Response
            │                    │                    │              │                    │
            │  Logger Pre        │  Auth Pre          │   Business   │  Auth Post         │  Logger Post
            └────────────────────┴────────────────────┴──────────────┴────────────────────┘
                                          call next()
```

```go
// Middleware execution example
func MiddlewareExample(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        // Pre-processing (executed when request enters)
        fmt.Println("Before handler")

        // Call the next middleware or handler
        err := next(c)

        // Post-processing (executed when response returns)
        fmt.Println("After handler")

        return err
    }
}
```

### Context Lifecycle

```go
// Context lifecycle in each request
// 1. Creation: Get from Context pool or create new
// 2. Initialization: Bind Request and ResponseWriter
// 3. Route matching: Set path parameters
// 4. Middleware execution: Call middleware chain in order
// 5. Handler: Execute business logic
// 6. Response: Write response data
// 7. Recycle: Reset state and return to pool

// Echo uses sync.Pool to reuse Context objects
type Echo struct {
    pool sync.Pool
    // ...
}

func (e *Echo) NewContext(r *http.Request, w http.ResponseWriter) Context {
    return e.pool.Get().(*context)
}
```

## Key Points

### Quick Installation and Startup

```bash
# Install Echo v4
go get github.com/labstack/echo/v4

# Install common middleware
go get github.com/labstack/echo/v4/middleware
```

```go
package main

import (
    "net/http"
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

func main() {
    // Create Echo instance
    e := echo.New()

    // Register middleware
    e.Use(middleware.Logger())
    e.Use(middleware.Recover())

    // Define routes
    e.GET("/", func(c echo.Context) error {
        return c.String(http.StatusOK, "Hello, Echo!")
    })

    // Start server
    e.Logger.Fatal(e.Start(":8080"))
}
```

### Routing System Key Points

```go
// 1. HTTP method support
e.GET("/users", getUsers)
e.POST("/users", createUser)
e.PUT("/users/:id", updateUser)
e.DELETE("/users/:id", deleteUser)
e.PATCH("/users/:id", patchUser)
e.OPTIONS("/users", optionsUsers)
e.HEAD("/users", headUsers)

// 2. Any HTTP method
e.Any("/any", handleAny)
e.Match([]string{"GET", "POST"}, "/match", handleMatch)

// 3. Static file serving
e.Static("/static", "assets")
e.File("/favicon.ico", "images/favicon.ico")
```

### Data Binding Key Points

Echo supports automatic binding from multiple data sources:

```go
type User struct {
    Name  string `json:"name" form:"name" query:"name"`
    Email string `json:"email" form:"email" query:"email"`
    Age   int    `json:"age" form:"age" query:"age"`
}

// Binding methods
c.Bind(&user)        // Automatically select based on Content-Type
c.QueryParams()      // Get all query parameters
c.FormParams()       // Get all form parameters
c.PathParam("id")    // Get path parameter
```

### Response Handling Key Points

```go
// String response
c.String(http.StatusOK, "Hello")

// JSON response
c.JSON(http.StatusOK, user)

// XML response
c.XML(http.StatusOK, user)

// HTML response
c.HTML(http.StatusOK, "<h1>Hello</h1>")

// File response
c.File("path/to/file")

// Stream response
c.Stream(http.StatusOK, "text/plain", reader)

// Redirect
c.Redirect(http.StatusMovedPermanently, "https://example.com")
```

## Code Examples

### Basic Routing Example

```go
package main

import (
    "net/http"
    "strconv"

    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

// User model
type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

// Simulated data store
var users = map[int]*User{
    1: {ID: 1, Name: "John", Email: "john@example.com"},
    2: {ID: 2, Name: "Jane", Email: "jane@example.com"},
}
var nextID = 3

func main() {
    e := echo.New()

    // Middleware
    e.Use(middleware.Logger())
    e.Use(middleware.Recover())

    // User routes
    e.GET("/users", getAllUsers)
    e.GET("/users/:id", getUser)
    e.POST("/users", createUser)
    e.PUT("/users/:id", updateUser)
    e.DELETE("/users/:id", deleteUser)

    e.Logger.Fatal(e.Start(":8080"))
}

// getAllUsers retrieves all users
func getAllUsers(c echo.Context) error {
    list := make([]*User, 0, len(users))
    for _, u := range users {
        list = append(list, u)
    }
    return c.JSON(http.StatusOK, list)
}

// getUser retrieves a single user
func getUser(c echo.Context) error {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID")
    }

    user, ok := users[id]
    if !ok {
        return echo.NewHTTPError(http.StatusNotFound, "User not found")
    }

    return c.JSON(http.StatusOK, user)
}

// createUser creates a user
func createUser(c echo.Context) error {
    user := new(User)
    if err := c.Bind(user); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid request format")
    }

    user.ID = nextID
    nextID++
    users[user.ID] = user

    return c.JSON(http.StatusCreated, user)
}

// updateUser updates a user
func updateUser(c echo.Context) error {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID")
    }

    if _, ok := users[id]; !ok {
        return echo.NewHTTPError(http.StatusNotFound, "User not found")
    }

    user := new(User)
    if err := c.Bind(user); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid request format")
    }

    user.ID = id
    users[id] = user

    return c.JSON(http.StatusOK, user)
}

// deleteUser deletes a user
func deleteUser(c echo.Context) error {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID")
    }

    if _, ok := users[id]; !ok {
        return echo.NewHTTPError(http.StatusNotFound, "User not found")
    }

    delete(users, id)
    return c.NoContent(http.StatusNoContent)
}
```

### Route Groups and Nesting Example

```go
package main

import (
    "net/http"

    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

func main() {
    e := echo.New()

    // Global middleware
    e.Use(middleware.Logger())
    e.Use(middleware.Recover())

    // API v1 route group
    v1 := e.Group("/api/v1")
    {
        // Public routes
        v1.POST("/login", loginHandler)
        v1.POST("/register", registerHandler)

        // Routes requiring authentication
        auth := v1.Group("")
        auth.Use(authMiddleware)
        {
            // User related
            users := auth.Group("/users")
            users.GET("", listUsers)
            users.GET("/:id", getUser)
            users.PUT("/:id", updateUser)

            // Post related
            posts := auth.Group("/posts")
            posts.GET("", listPosts)
            posts.GET("/:id", getPost)
            posts.POST("", createPost)
            posts.PUT("/:id", updatePost)
            posts.DELETE("/:id", deletePost)

            // Admin routes
            admin := auth.Group("/admin")
            admin.Use(adminMiddleware)
            {
                admin.GET("/stats", getStats)
                admin.GET("/users", adminListUsers)
                admin.DELETE("/users/:id", adminDeleteUser)
            }
        }
    }

    // API v2 route group
    v2 := e.Group("/api/v2")
    {
        v2.GET("/users", listUsersV2)
        v2.GET("/users/:id", getUserV2)
    }

    e.Logger.Fatal(e.Start(":8080"))
}

// Authentication middleware
func authMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        token := c.Request().Header.Get("Authorization")
        if token == "" {
            return echo.NewHTTPError(http.StatusUnauthorized, "Missing authentication token")
        }

        // Token validation logic...
        if !isValidToken(token) {
            return echo.NewHTTPError(http.StatusUnauthorized, "Invalid authentication token")
        }

        // Set user info in context
        c.Set("userID", 123)
        c.Set("role", "user")

        return next(c)
    }
}

// Admin middleware
func adminMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        role := c.Get("role")
        if role != "admin" {
            return echo.NewHTTPError(http.StatusForbidden, "Admin privileges required")
        }
        return next(c)
    }
}

func isValidToken(token string) bool {
    // In production, validate JWT etc.
    return token == "Bearer valid-token"
}

// Handler placeholders
func loginHandler(c echo.Context) error    { return c.JSON(http.StatusOK, "login") }
func registerHandler(c echo.Context) error { return c.JSON(http.StatusOK, "register") }
func listUsers(c echo.Context) error       { return c.JSON(http.StatusOK, "users list") }
func getUser(c echo.Context) error         { return c.JSON(http.StatusOK, "user") }
func updateUser(c echo.Context) error      { return c.JSON(http.StatusOK, "user updated") }
func listPosts(c echo.Context) error       { return c.JSON(http.StatusOK, "posts") }
func getPost(c echo.Context) error         { return c.JSON(http.StatusOK, "post") }
func createPost(c echo.Context) error      { return c.JSON(http.StatusCreated, "post created") }
func updatePost(c echo.Context) error      { return c.JSON(http.StatusOK, "post updated") }
func deletePost(c echo.Context) error      { return c.NoContent(http.StatusNoContent) }
func getStats(c echo.Context) error        { return c.JSON(http.StatusOK, "stats") }
func adminListUsers(c echo.Context) error  { return c.JSON(http.StatusOK, "admin users") }
func adminDeleteUser(c echo.Context) error { return c.NoContent(http.StatusNoContent) }
func listUsersV2(c echo.Context) error     { return c.JSON(http.StatusOK, "v2 users") }
func getUserV2(c echo.Context) error       { return c.JSON(http.StatusOK, "v2 user") }
```

### Middleware Deep Dive Example

```go
package main

import (
    "fmt"
    "net/http"
    "time"

    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

func main() {
    e := echo.New()

    // 1. Built-in logger middleware (custom format)
    e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
        Format: "[${time_rfc3339}] ${status} ${method} ${uri} ${latency_human}\n",
        Output: e.Logger.Output(),
    }))

    // 2. Recover middleware (custom config)
    e.Use(middleware.RecoverWithConfig(middleware.RecoverConfig{
        StackSize: 1 << 10, // 1 KB
        LogLevel:  4,       // ERROR
    }))

    // 3. CORS middleware
    e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
        AllowOrigins: []string{"https://example.com", "https://www.example.com"},
        AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
        AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAuthorization},
        MaxAge:       3600,
    }))

    // 4. Request ID middleware
    e.Use(middleware.RequestID())

    // 5. Gzip compression middleware
    e.Use(middleware.GzipWithConfig(middleware.GzipConfig{
        Level: 5,
        Skipper: func(c echo.Context) bool {
            return c.Path() == "/health"
        },
    }))

    // 6. Custom timing middleware
    e.Use(timingMiddleware)

    // 7. Custom rate limiting middleware
    e.Use(rateLimitMiddleware(100, time.Minute))

    e.GET("/", func(c echo.Context) error {
        return c.String(http.StatusOK, "Hello, Middleware!")
    })

    e.GET("/health", func(c echo.Context) error {
        return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
    })

    e.Logger.Fatal(e.Start(":8080"))
}

// Custom timing middleware
func timingMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        start := time.Now()

        err := next(c)

        duration := time.Since(start)
        c.Response().Header().Set("X-Response-Time", duration.String())

        return err
    }
}

// Custom rate limiting middleware (simplified)
func rateLimitMiddleware(limit int, window time.Duration) echo.MiddlewareFunc {
    requests := make(map[string][]time.Time)

    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            ip := c.RealIP()
            now := time.Now()

            // Clean expired records
            if times, exists := requests[ip]; exists {
                var valid []time.Time
                for _, t := range times {
                    if now.Sub(t) < window {
                        valid = append(valid, t)
                    }
                }
                requests[ip] = valid
            }

            // Check rate limit
            if len(requests[ip]) >= limit {
                return echo.NewHTTPError(http.StatusTooManyRequests, "Too many requests")
            }

            requests[ip] = append(requests[ip], now)
            return next(c)
        }
    }
}
```

### Request Binding and Validation Example

```go
package main

import (
    "net/http"

    "github.com/go-playground/validator/v10"
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

// Custom validator
type CustomValidator struct {
    validator *validator.Validate
}

func (cv *CustomValidator) Validate(i interface{}) error {
    if err := cv.validator.Struct(i); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, err.Error())
    }
    return nil
}

// User registration request
type RegisterRequest struct {
    Username string `json:"username" form:"username" validate:"required,min=3,max=20,alphanum"`
    Email    string `json:"email" form:"email" validate:"required,email"`
    Password string `json:"password" form:"password" validate:"required,min=8,containsany=!@#$%^&*"`
    Age      int    `json:"age" form:"age" validate:"required,gte=18,lte=120"`
    Phone    string `json:"phone" form:"phone" validate:"omitempty,len=11,numeric"`
    Gender   string `json:"gender" form:"gender" validate:"required,oneof=male female other"`
}

// Query parameters struct
type SearchQuery struct {
    Keyword  string `query:"keyword" validate:"required,min=1"`
    Page     int    `query:"page" validate:"omitempty,min=1"`
    PageSize int    `query:"page_size" validate:"omitempty,min=1,max=100"`
    SortBy   string `query:"sort_by" validate:"omitempty,oneof=created_at updated_at name"`
    Order    string `query:"order" validate:"omitempty,oneof=asc desc"`
}

// Path parameters struct
type UserParams struct {
    ID string `param:"id" validate:"required,uuid"`
}

// Form file upload
type UploadRequest struct {
    Title       string `form:"title" validate:"required,max=100"`
    Description string `form:"description" validate:"max=500"`
}

func main() {
    e := echo.New()

    // Register custom validator
    e.Validator = &CustomValidator{validator: validator.New()}

    e.Use(middleware.Logger())
    e.Use(middleware.Recover())

    // JSON binding
    e.POST("/register", registerHandler)

    // Query parameter binding
    e.GET("/search", searchHandler)

    // Path parameter binding
    e.GET("/users/:id", getUserHandler)

    // Form binding
    e.POST("/form", formHandler)

    // File upload
    e.POST("/upload", uploadHandler)

    // Multiple file upload
    e.POST("/upload-multiple", uploadMultipleHandler)

    e.Logger.Fatal(e.Start(":8080"))
}

// Registration handler
func registerHandler(c echo.Context) error {
    req := new(RegisterRequest)

    // Bind request data
    if err := c.Bind(req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid request format")
    }

    // Validate data
    if err := c.Validate(req); err != nil {
        return err
    }

    // Process business logic...
    return c.JSON(http.StatusCreated, map[string]interface{}{
        "message": "Registration successful",
        "user": map[string]interface{}{
            "username": req.Username,
            "email":    req.Email,
        },
    })
}

// Search handler
func searchHandler(c echo.Context) error {
    query := &SearchQuery{
        Page:     1,   // Default value
        PageSize: 20,  // Default value
        Order:    "desc",
    }

    if err := c.Bind(query); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid query parameters")
    }

    if err := c.Validate(query); err != nil {
        return err
    }

    return c.JSON(http.StatusOK, map[string]interface{}{
        "keyword":   query.Keyword,
        "page":      query.Page,
        "page_size": query.PageSize,
        "sort_by":   query.SortBy,
        "order":     query.Order,
    })
}

// Get user handler
func getUserHandler(c echo.Context) error {
    params := new(UserParams)

    // Bind path parameters
    if err := c.Bind(params); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid path parameters")
    }

    if err := c.Validate(params); err != nil {
        return err
    }

    return c.JSON(http.StatusOK, map[string]interface{}{
        "id": params.ID,
    })
}

// Form handler
func formHandler(c echo.Context) error {
    // Get form values directly
    name := c.FormValue("name")
    email := c.FormValue("email")

    // Get multiple values
    interests := c.Request().Form["interests"]

    return c.JSON(http.StatusOK, map[string]interface{}{
        "name":      name,
        "email":     email,
        "interests": interests,
    })
}

// Single file upload handler
func uploadHandler(c echo.Context) error {
    req := new(UploadRequest)
    if err := c.Bind(req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid form data")
    }

    // Get the uploaded file
    file, err := c.FormFile("file")
    if err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Please select a file to upload")
    }

    // File size limit (10MB)
    if file.Size > 10*1024*1024 {
        return echo.NewHTTPError(http.StatusBadRequest, "File size cannot exceed 10MB")
    }

    // Save file
    src, err := file.Open()
    if err != nil {
        return err
    }
    defer src.Close()

    // In production, save to appropriate location
    // dst, err := os.Create("uploads/" + file.Filename)
    // io.Copy(dst, src)

    return c.JSON(http.StatusOK, map[string]interface{}{
        "message":  "Upload successful",
        "filename": file.Filename,
        "size":     file.Size,
        "title":    req.Title,
    })
}

// Multiple file upload handler
func uploadMultipleHandler(c echo.Context) error {
    form, err := c.MultipartForm()
    if err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Form parsing failed")
    }

    files := form.File["files"]

    var uploaded []map[string]interface{}
    for _, file := range files {
        uploaded = append(uploaded, map[string]interface{}{
            "filename": file.Filename,
            "size":     file.Size,
        })
    }

    return c.JSON(http.StatusOK, map[string]interface{}{
        "message": "Upload successful",
        "files":   uploaded,
    })
}
```

### Custom Error Handling Example

```go
package main

import (
    "fmt"
    "net/http"

    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

// Business error codes
const (
    ErrCodeSuccess       = 0
    ErrCodeInvalidParams = 10001
    ErrCodeUnauthorized  = 10002
    ErrCodeForbidden     = 10003
    ErrCodeNotFound      = 10004
    ErrCodeInternal      = 10005
    ErrCodeDuplicate     = 10006
)

// Unified response structure
type Response struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}

// Custom business error
type BusinessError struct {
    Code       int
    Message    string
    HTTPStatus int
}

func (e *BusinessError) Error() string {
    return fmt.Sprintf("code: %d, message: %s", e.Code, e.Message)
}

// Predefined errors
var (
    ErrInvalidParams = &BusinessError{ErrCodeInvalidParams, "Invalid parameters", http.StatusBadRequest}
    ErrUnauthorized  = &BusinessError{ErrCodeUnauthorized, "Unauthorized", http.StatusUnauthorized}
    ErrForbidden     = &BusinessError{ErrCodeForbidden, "Forbidden", http.StatusForbidden}
    ErrNotFound      = &BusinessError{ErrCodeNotFound, "Resource not found", http.StatusNotFound}
    ErrInternal      = &BusinessError{ErrCodeInternal, "Internal server error", http.StatusInternalServerError}
    ErrDuplicate     = &BusinessError{ErrCodeDuplicate, "Duplicate data", http.StatusConflict}
)

// Create new business error
func NewBusinessError(code int, message string, httpStatus int) *BusinessError {
    return &BusinessError{
        Code:       code,
        Message:    message,
        HTTPStatus: httpStatus,
    }
}

func main() {
    e := echo.New()

    // Custom error handler
    e.HTTPErrorHandler = customHTTPErrorHandler

    e.Use(middleware.Logger())
    e.Use(middleware.Recover())

    e.GET("/users/:id", getUser)
    e.POST("/users", createUser)

    e.Logger.Fatal(e.Start(":8080"))
}

// Custom error handler
func customHTTPErrorHandler(err error, c echo.Context) {
    var response Response
    var httpStatus int

    switch e := err.(type) {
    case *BusinessError:
        // Business error
        response = Response{
            Code:    e.Code,
            Message: e.Message,
        }
        httpStatus = e.HTTPStatus

    case *echo.HTTPError:
        // Echo HTTP error
        response = Response{
            Code:    e.Code,
            Message: fmt.Sprintf("%v", e.Message),
        }
        httpStatus = e.Code

    default:
        // Unknown error
        response = Response{
            Code:    ErrCodeInternal,
            Message: "Internal server error",
        }
        httpStatus = http.StatusInternalServerError

        // Log detailed error
        c.Logger().Error(err)
    }

    // Avoid duplicate response writes
    if !c.Response().Committed {
        if c.Request().Method == http.MethodHead {
            c.NoContent(httpStatus)
        } else {
            c.JSON(httpStatus, response)
        }
    }
}

// Success response helper function
func success(c echo.Context, data interface{}) error {
    return c.JSON(http.StatusOK, Response{
        Code:    ErrCodeSuccess,
        Message: "success",
        Data:    data,
    })
}

// Created response helper function
func created(c echo.Context, data interface{}) error {
    return c.JSON(http.StatusCreated, Response{
        Code:    ErrCodeSuccess,
        Message: "success",
        Data:    data,
    })
}

func getUser(c echo.Context) error {
    id := c.Param("id")
    if id == "" {
        return ErrInvalidParams
    }

    // Simulate user not found
    if id == "999" {
        return ErrNotFound
    }

    return success(c, map[string]interface{}{
        "id":   id,
        "name": "John",
    })
}

func createUser(c echo.Context) error {
    type CreateUserRequest struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }

    req := new(CreateUserRequest)
    if err := c.Bind(req); err != nil {
        return ErrInvalidParams
    }

    // Simulate duplicate email
    if req.Email == "exists@example.com" {
        return NewBusinessError(ErrCodeDuplicate, "Email already registered", http.StatusConflict)
    }

    return created(c, map[string]interface{}{
        "id":    1,
        "name":  req.Name,
        "email": req.Email,
    })
}
```

### Complete Project Structure Example

```go
// Project structure
// myapp/
// ├── cmd/
// │   └── server/
// │       └── main.go
// ├── internal/
// │   ├── config/
// │   │   └── config.go
// │   ├── handler/
// │   │   ├── handler.go
// │   │   ├── user_handler.go
// │   │   └── post_handler.go
// │   ├── middleware/
// │   │   ├── auth.go
// │   │   ├── cors.go
// │   │   └── logger.go
// │   ├── model/
// │   │   ├── user.go
// │   │   └── post.go
// │   ├── repository/
// │   │   ├── user_repository.go
// │   │   └── post_repository.go
// │   ├── service/
// │   │   ├── user_service.go
// │   │   └── post_service.go
// │   └── router/
// │       └── router.go
// ├── pkg/
// │   ├── errors/
// │   │   └── errors.go
// │   └── response/
// │       └── response.go
// ├── go.mod
// └── go.sum

// cmd/server/main.go
package main

import (
    "context"
    "os"
    "os/signal"
    "syscall"
    "time"

    "myapp/internal/config"
    "myapp/internal/handler"
    "myapp/internal/repository"
    "myapp/internal/router"
    "myapp/internal/service"

    "github.com/labstack/echo/v4"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

func main() {
    // Load configuration
    cfg := config.Load()

    // Initialize database
    db, err := initDB(cfg)
    if err != nil {
        panic(err)
    }

    // Dependency injection
    userRepo := repository.NewUserRepository(db)
    postRepo := repository.NewPostRepository(db)

    userService := service.NewUserService(userRepo)
    postService := service.NewPostService(postRepo, userRepo)

    userHandler := handler.NewUserHandler(userService)
    postHandler := handler.NewPostHandler(postService)

    // Create Echo instance
    e := echo.New()

    // Setup routes
    router.Setup(e, cfg, userHandler, postHandler)

    // Start server
    go func() {
        if err := e.Start(":" + cfg.Port); err != nil {
            e.Logger.Info("shutting down the server")
        }
    }()

    // Graceful shutdown
    gracefulShutdown(e)
}

func initDB(cfg *config.Config) (*gorm.DB, error) {
    return gorm.Open(mysql.Open(cfg.DatabaseDSN), &gorm.Config{})
}

func gracefulShutdown(e *echo.Echo) {
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := e.Shutdown(ctx); err != nil {
        e.Logger.Fatal(err)
    }
}
```

```go
// internal/router/router.go
package router

import (
    "myapp/internal/config"
    "myapp/internal/handler"
    "myapp/internal/middleware"

    "github.com/labstack/echo/v4"
    echomiddleware "github.com/labstack/echo/v4/middleware"
)

func Setup(e *echo.Echo, cfg *config.Config, userHandler *handler.UserHandler, postHandler *handler.PostHandler) {
    // Global middleware
    e.Use(echomiddleware.Logger())
    e.Use(echomiddleware.Recover())
    e.Use(middleware.RequestID())
    e.Use(middleware.CORS())

    // Health check
    e.GET("/health", func(c echo.Context) error {
        return c.JSON(200, map[string]string{"status": "ok"})
    })

    // API routes
    api := e.Group("/api")

    // v1 version
    v1 := api.Group("/v1")
    {
        // Public routes
        v1.POST("/auth/login", userHandler.Login)
        v1.POST("/auth/register", userHandler.Register)

        // Routes requiring authentication
        auth := v1.Group("")
        auth.Use(middleware.JWT(cfg.JWTSecret))
        {
            // Users
            users := auth.Group("/users")
            users.GET("", userHandler.List)
            users.GET("/:id", userHandler.Get)
            users.PUT("/:id", userHandler.Update)
            users.DELETE("/:id", userHandler.Delete)

            // Posts
            posts := auth.Group("/posts")
            posts.GET("", postHandler.List)
            posts.GET("/:id", postHandler.Get)
            posts.POST("", postHandler.Create)
            posts.PUT("/:id", postHandler.Update)
            posts.DELETE("/:id", postHandler.Delete)
        }
    }
}
```

## Best Practices

### Project Organization Structure

```
Recommended project structure following Clean Architecture principles:

myapp/
├── cmd/                    # Application entry points
│   └── server/
│       └── main.go
├── internal/               # Private code
│   ├── config/            # Configuration management
│   ├── handler/           # HTTP handlers (Controller layer)
│   ├── service/           # Business logic layer
│   ├── repository/        # Data access layer
│   ├── model/             # Data models
│   ├── middleware/        # Custom middleware
│   └── router/            # Route configuration
├── pkg/                    # Reusable public code
│   ├── errors/            # Error definitions
│   ├── response/          # Response wrappers
│   └── validator/         # Validators
├── api/                    # API documentation
│   └── openapi.yaml
├── configs/                # Configuration files
├── scripts/                # Scripts
├── Dockerfile
├── docker-compose.yaml
└── Makefile
```

### Middleware Best Practices

```go
// 1. Middleware order matters
e.Use(middleware.RequestID())     // First: Request tracking
e.Use(middleware.Logger())        // Second: Logging
e.Use(middleware.Recover())       // Then: Recover from panic
e.Use(middleware.CORS())          // Last: CORS handling

// 2. Use middleware configuration instead of hardcoding
e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
    Format: "${time_rfc3339} ${method} ${uri} ${status} ${latency_human}\n",
}))

// 3. Use different middleware for different route groups
public := e.Group("/public")
auth := e.Group("/api", authMiddleware)
admin := e.Group("/admin", authMiddleware, adminMiddleware)

// 4. Avoid blocking operations in middleware
func asyncLogMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        go func() {
            // Async logging
        }()
        return next(c)
    }
}
```

### Error Handling Best Practices

```go
// 1. Use unified error response format
type ErrorResponse struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}

// 2. Distinguish between business errors and system errors
type BusinessError struct {
    Code    int
    Message string
    Status  int
}

// 3. Centralized error handling
e.HTTPErrorHandler = func(err error, c echo.Context) {
    switch e := err.(type) {
    case *BusinessError:
        c.JSON(e.Status, ErrorResponse{Code: e.Code, Message: e.Message})
    case *echo.HTTPError:
        c.JSON(e.Code, ErrorResponse{Code: e.Code, Message: fmt.Sprint(e.Message)})
    default:
        c.Logger().Error(err)
        c.JSON(500, ErrorResponse{Code: 500, Message: "Internal server error"})
    }
}

// 4. Don't expose internal error details to clients
if err != nil {
    c.Logger().Error("database error:", err) // Log detailed error
    return ErrInternal // Return generic error to client
}
```

### Validation Best Practices

```go
// 1. Use struct tags for validation
type CreateUserRequest struct {
    Username string `json:"username" validate:"required,min=3,max=20"`
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
}

// 2. Register custom validators
func init() {
    v := validator.New()

    // Custom validation rule
    v.RegisterValidation("phone", validatePhone)

    // Custom error messages
    v.RegisterTranslation("required", trans,
        func(ut ut.Translator) error { return nil },
        func(ut ut.Translator, fe validator.FieldError) string {
            return fe.Field() + " is required"
        })
}

// 3. Separate validation logic
func (r *CreateUserRequest) Validate() error {
    if len(r.Username) < 3 {
        return NewBusinessError(ErrCodeInvalidParams, "Username must be at least 3 characters", 400)
    }
    return nil
}
```

### Configuration Management Best Practices

```go
// 1. Use environment variables
type Config struct {
    Port        string `env:"PORT" envDefault:"8080"`
    DatabaseDSN string `env:"DATABASE_DSN" envRequired:"true"`
    JWTSecret   string `env:"JWT_SECRET" envRequired:"true"`
    LogLevel    string `env:"LOG_LEVEL" envDefault:"info"`
}

// 2. Support multi-environment configuration
func Load() *Config {
    env := os.Getenv("APP_ENV")
    if env == "" {
        env = "development"
    }

    // Load corresponding environment config file
    viper.SetConfigName("config." + env)
    viper.SetConfigType("yaml")
    viper.AddConfigPath("./configs")

    // Environment variables override config files
    viper.AutomaticEnv()

    var cfg Config
    viper.Unmarshal(&cfg)
    return &cfg
}
```

## Common Pitfalls

### Improper Context Usage

```go
// Wrong: Using request Context in goroutine
func handler(c echo.Context) error {
    go func() {
        // Dangerous! Request may have ended, c may have been reused
        userID := c.Get("userID")
        processAsync(userID)
    }()
    return c.String(200, "OK")
}

// Correct: Copy the values you need
func handler(c echo.Context) error {
    userID := c.Get("userID")
    go func(uid interface{}) {
        processAsync(uid)
    }(userID)
    return c.String(200, "OK")
}

// Or use context.Context
func handler(c echo.Context) error {
    ctx := c.Request().Context()
    go func(ctx context.Context) {
        // Use standard context
    }(ctx)
    return c.String(200, "OK")
}
```

### Separating Binding and Validation

```go
// Wrong: Only binding without validation
func handler(c echo.Context) error {
    req := new(CreateUserRequest)
    c.Bind(req) // May fail binding but continue execution
    // Processing req that may contain invalid data
}

// Correct: Bind first, then validate
func handler(c echo.Context) error {
    req := new(CreateUserRequest)
    if err := c.Bind(req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid data format")
    }
    if err := c.Validate(req); err != nil {
        return err
    }
    // Process validated req
}
```

### Duplicate Response Writes

```go
// Wrong: Duplicate response writes
func handler(c echo.Context) error {
    if err := doSomething(); err != nil {
        c.JSON(500, map[string]string{"error": err.Error()})
        // return forgotten, continues execution
    }
    return c.JSON(200, map[string]string{"status": "ok"}) // Duplicate write
}

// Correct: Ensure return
func handler(c echo.Context) error {
    if err := doSomething(); err != nil {
        return c.JSON(500, map[string]string{"error": err.Error()})
    }
    return c.JSON(200, map[string]string{"status": "ok"})
}
```

### Incorrect Middleware Execution Order

```go
// Wrong: Auth middleware after logger, cannot log auth failures
e.Use(authMiddleware)
e.Use(loggerMiddleware)

// Correct: Logger first, can log all requests
e.Use(loggerMiddleware)
e.Use(authMiddleware)
```

### Ignoring Middleware Errors

```go
// Wrong: Ignoring next() error
func middleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        next(c) // Error ignored
        doAfter()
        return nil
    }
}

// Correct: Handle error
func middleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        if err := next(c); err != nil {
            c.Error(err)
            return err
        }
        doAfter()
        return nil
    }
}
```

### Route Parameter Type Conversion

```go
// Wrong: Not checking type conversion error
func handler(c echo.Context) error {
    id, _ := strconv.Atoi(c.Param("id")) // Error ignored
    user := getUser(id) // May use id=0
}

// Correct: Check and handle error
func handler(c echo.Context) error {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid ID")
    }
    user := getUser(id)
}
```

## Performance Considerations

### Benchmark Comparison

```
Framework performance comparison (for reference only, actual depends on use case):

| Framework | Requests/sec | Latency (avg) | Memory Alloc |
|-----------|--------------|---------------|--------------|
| Echo      | ~130,000     | ~7.5us        | 0 allocs     |
| Gin       | ~130,000     | ~7.5us        | 0 allocs     |
| Fiber     | ~160,000     | ~6.0us        | 0 allocs     |
| Chi       | ~100,000     | ~10us         | 0 allocs     |
| net/http  | ~80,000      | ~12us         | 2 allocs     |
```

### Performance Optimization Tips

```go
// 1. Use object pools to reduce memory allocation
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func handler(c echo.Context) error {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufferPool.Put(buf)
    }()
    // Use buf
}

// 2. Pre-allocate slice capacity
func listUsers(c echo.Context) error {
    users := make([]User, 0, 100) // Pre-allocate capacity
    // Fill users
    return c.JSON(200, users)
}

// 3. Avoid unnecessary JSON serialization
func handler(c echo.Context) error {
    // Use JSONBlob to return already serialized data
    return c.JSONBlob(200, cachedJSON)
}

// 4. Enable Gzip compression
e.Use(middleware.GzipWithConfig(middleware.GzipConfig{
    Level: 5,
    Skipper: func(c echo.Context) bool {
        return strings.Contains(c.Path(), "/metrics")
    },
}))

// 5. Configure server properly
server := &http.Server{
    Addr:         ":8080",
    ReadTimeout:  10 * time.Second,
    WriteTimeout: 10 * time.Second,
    IdleTimeout:  120 * time.Second,
}
e.StartServer(server)

// 6. Use connection pools
db.SetMaxIdleConns(10)
db.SetMaxOpenConns(100)
db.SetConnMaxLifetime(time.Hour)

// 7. Cache frequently accessed data
var configCache atomic.Value

func getConfig(c echo.Context) error {
    cfg := configCache.Load()
    if cfg == nil {
        // Reload configuration
    }
    return c.JSON(200, cfg)
}
```

### Production Environment Configuration

```go
func main() {
    e := echo.New()

    // Production mode
    e.Debug = false
    e.HideBanner = true

    // Custom logging
    e.Logger.SetLevel(log.INFO)

    // Limit request body size
    e.Use(middleware.BodyLimit("2M"))

    // Timeout configuration
    e.Use(middleware.TimeoutWithConfig(middleware.TimeoutConfig{
        Timeout: 30 * time.Second,
    }))

    // Rate limiting
    e.Use(middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(20)))

    // Security headers
    e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
        XSSProtection:         "1; mode=block",
        ContentTypeNosniff:    "nosniff",
        XFrameOptions:         "SAMEORIGIN",
        HSTSMaxAge:            31536000,
        ContentSecurityPolicy: "default-src 'self'",
    }))

    // HTTP/2
    e.StartTLS(":443", "cert.pem", "key.pem")
}
```

## Practical Scenarios

### Scenario 1: JWT Authentication System

```go
package main

import (
    "net/http"
    "time"

    "github.com/golang-jwt/jwt/v5"
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

type JWTCustomClaims struct {
    UserID   int    `json:"user_id"`
    Username string `json:"username"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}

var jwtSecret = []byte("your-secret-key")

func main() {
    e := echo.New()

    // Public routes
    e.POST("/login", login)
    e.POST("/refresh", refreshToken)

    // Protected routes
    r := e.Group("/api")
    r.Use(middleware.JWTWithConfig(middleware.JWTConfig{
        SigningKey: jwtSecret,
        Claims:     &JWTCustomClaims{},
        ContextKey: "user",
    }))

    r.GET("/profile", getProfile)
    r.GET("/admin", adminOnly, requireRole("admin"))

    e.Logger.Fatal(e.Start(":8080"))
}

type LoginRequest struct {
    Username string `json:"username"`
    Password string `json:"password"`
}

func login(c echo.Context) error {
    req := new(LoginRequest)
    if err := c.Bind(req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
    }

    // Validate user (in production, query database)
    if req.Username != "admin" || req.Password != "password" {
        return echo.NewHTTPError(http.StatusUnauthorized, "Invalid username or password")
    }

    // Generate tokens
    accessToken, err := generateToken(1, "admin", "admin", 15*time.Minute)
    if err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, "Failed to generate token")
    }

    refreshToken, err := generateToken(1, "admin", "admin", 7*24*time.Hour)
    if err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, "Failed to generate token")
    }

    return c.JSON(http.StatusOK, map[string]string{
        "access_token":  accessToken,
        "refresh_token": refreshToken,
        "token_type":    "Bearer",
    })
}

func generateToken(userID int, username, role string, expiry time.Duration) (string, error) {
    claims := &JWTCustomClaims{
        UserID:   userID,
        Username: username,
        Role:     role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

func refreshToken(c echo.Context) error {
    type RefreshRequest struct {
        RefreshToken string `json:"refresh_token"`
    }

    req := new(RefreshRequest)
    if err := c.Bind(req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
    }

    // Validate refresh token
    token, err := jwt.ParseWithClaims(req.RefreshToken, &JWTCustomClaims{}, func(t *jwt.Token) (interface{}, error) {
        return jwtSecret, nil
    })

    if err != nil || !token.Valid {
        return echo.NewHTTPError(http.StatusUnauthorized, "Invalid refresh token")
    }

    claims := token.Claims.(*JWTCustomClaims)

    // Generate new access token
    newAccessToken, err := generateToken(claims.UserID, claims.Username, claims.Role, 15*time.Minute)
    if err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, "Failed to generate token")
    }

    return c.JSON(http.StatusOK, map[string]string{
        "access_token": newAccessToken,
        "token_type":   "Bearer",
    })
}

func getProfile(c echo.Context) error {
    user := c.Get("user").(*jwt.Token)
    claims := user.Claims.(*JWTCustomClaims)

    return c.JSON(http.StatusOK, map[string]interface{}{
        "user_id":  claims.UserID,
        "username": claims.Username,
        "role":     claims.Role,
    })
}

func requireRole(role string) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            user := c.Get("user").(*jwt.Token)
            claims := user.Claims.(*JWTCustomClaims)

            if claims.Role != role {
                return echo.NewHTTPError(http.StatusForbidden, "Insufficient privileges")
            }

            return next(c)
        }
    }
}

func adminOnly(c echo.Context) error {
    return c.JSON(http.StatusOK, map[string]string{
        "message": "Welcome, Admin",
    })
}
```

### Scenario 2: File Upload Service

```go
package main

import (
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
    "os"
    "path/filepath"
    "strings"
    "time"

    "github.com/google/uuid"
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

const (
    uploadDir    = "./uploads"
    maxFileSize  = 10 << 20 // 10MB
)

var allowedTypes = map[string]bool{
    "image/jpeg": true,
    "image/png":  true,
    "image/gif":  true,
    "application/pdf": true,
}

func main() {
    e := echo.New()

    e.Use(middleware.Logger())
    e.Use(middleware.Recover())

    // Ensure upload directory exists
    os.MkdirAll(uploadDir, 0755)

    // Static file serving
    e.Static("/files", uploadDir)

    // Upload routes
    e.POST("/upload", uploadFile)
    e.POST("/upload/multiple", uploadMultipleFiles)
    e.DELETE("/files/:filename", deleteFile)

    e.Logger.Fatal(e.Start(":8080"))
}

type UploadResponse struct {
    Filename string `json:"filename"`
    URL      string `json:"url"`
    Size     int64  `json:"size"`
    Type     string `json:"type"`
}

func uploadFile(c echo.Context) error {
    // Get the uploaded file
    file, err := c.FormFile("file")
    if err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Please select a file to upload")
    }

    // Validate file
    if err := validateFile(file); err != nil {
        return err
    }

    // Save file
    result, err := saveFile(file)
    if err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, "Failed to save file")
    }

    return c.JSON(http.StatusOK, result)
}

func uploadMultipleFiles(c echo.Context) error {
    form, err := c.MultipartForm()
    if err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Failed to parse form")
    }

    files := form.File["files"]
    if len(files) == 0 {
        return echo.NewHTTPError(http.StatusBadRequest, "Please select files to upload")
    }

    var results []UploadResponse
    var errors []string

    for _, file := range files {
        if err := validateFile(file); err != nil {
            errors = append(errors, fmt.Sprintf("%s: %s", file.Filename, err.Error()))
            continue
        }

        result, err := saveFile(file)
        if err != nil {
            errors = append(errors, fmt.Sprintf("%s: Failed to save", file.Filename))
            continue
        }

        results = append(results, *result)
    }

    return c.JSON(http.StatusOK, map[string]interface{}{
        "uploaded": results,
        "errors":   errors,
    })
}

func validateFile(file *multipart.FileHeader) error {
    // Check file size
    if file.Size > maxFileSize {
        return echo.NewHTTPError(http.StatusBadRequest,
            fmt.Sprintf("File size cannot exceed %dMB", maxFileSize>>20))
    }

    // Check file type
    src, err := file.Open()
    if err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, "Unable to read file")
    }
    defer src.Close()

    // Read file header to determine actual type
    buffer := make([]byte, 512)
    n, err := src.Read(buffer)
    if err != nil && err != io.EOF {
        return echo.NewHTTPError(http.StatusInternalServerError, "Unable to read file")
    }

    contentType := http.DetectContentType(buffer[:n])
    if !allowedTypes[contentType] {
        return echo.NewHTTPError(http.StatusBadRequest,
            fmt.Sprintf("Unsupported file type: %s", contentType))
    }

    return nil
}

func saveFile(file *multipart.FileHeader) (*UploadResponse, error) {
    // Generate unique filename
    ext := filepath.Ext(file.Filename)
    newFilename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)

    // Organize by date directories
    dateDir := time.Now().Format("2006/01/02")
    fullDir := filepath.Join(uploadDir, dateDir)
    os.MkdirAll(fullDir, 0755)

    filePath := filepath.Join(fullDir, newFilename)

    // Open source file
    src, err := file.Open()
    if err != nil {
        return nil, err
    }
    defer src.Close()

    // Create destination file
    dst, err := os.Create(filePath)
    if err != nil {
        return nil, err
    }
    defer dst.Close()

    // Copy file
    if _, err := io.Copy(dst, src); err != nil {
        return nil, err
    }

    return &UploadResponse{
        Filename: newFilename,
        URL:      fmt.Sprintf("/files/%s/%s", dateDir, newFilename),
        Size:     file.Size,
        Type:     file.Header.Get("Content-Type"),
    }, nil
}

func deleteFile(c echo.Context) error {
    filename := c.Param("filename")

    // Prevent directory traversal attack
    if strings.Contains(filename, "..") || strings.Contains(filename, "/") {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid filename")
    }

    // Find and delete file (simplified, should find correct path in production)
    // ...

    return c.NoContent(http.StatusNoContent)
}
```

### Scenario 3: WebSocket Real-time Communication

```go
package main

import (
    "net/http"
    "sync"

    "github.com/gorilla/websocket"
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true // Should check Origin in production
    },
}

// Client management
type Hub struct {
    clients    map[*Client]bool
    broadcast  chan []byte
    register   chan *Client
    unregister chan *Client
    mu         sync.RWMutex
}

type Client struct {
    hub  *Hub
    conn *websocket.Conn
    send chan []byte
    room string
}

var hub = &Hub{
    clients:    make(map[*Client]bool),
    broadcast:  make(chan []byte),
    register:   make(chan *Client),
    unregister: make(chan *Client),
}

func (h *Hub) run() {
    for {
        select {
        case client := <-h.register:
            h.mu.Lock()
            h.clients[client] = true
            h.mu.Unlock()

        case client := <-h.unregister:
            h.mu.Lock()
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.send)
            }
            h.mu.Unlock()

        case message := <-h.broadcast:
            h.mu.RLock()
            for client := range h.clients {
                select {
                case client.send <- message:
                default:
                    close(client.send)
                    delete(h.clients, client)
                }
            }
            h.mu.RUnlock()
        }
    }
}

func main() {
    e := echo.New()

    e.Use(middleware.Logger())
    e.Use(middleware.Recover())

    // Start Hub
    go hub.run()

    // WebSocket endpoints
    e.GET("/ws", handleWebSocket)
    e.GET("/ws/:room", handleRoomWebSocket)

    // Broadcast message
    e.POST("/broadcast", broadcastMessage)

    e.Logger.Fatal(e.Start(":8080"))
}

func handleWebSocket(c echo.Context) error {
    ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
    if err != nil {
        return err
    }

    client := &Client{
        hub:  hub,
        conn: ws,
        send: make(chan []byte, 256),
    }

    hub.register <- client

    // Read/write goroutines
    go client.writePump()
    go client.readPump()

    return nil
}

func handleRoomWebSocket(c echo.Context) error {
    room := c.Param("room")

    ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
    if err != nil {
        return err
    }

    client := &Client{
        hub:  hub,
        conn: ws,
        send: make(chan []byte, 256),
        room: room,
    }

    hub.register <- client

    go client.writePump()
    go client.readPump()

    return nil
}

func (c *Client) readPump() {
    defer func() {
        c.hub.unregister <- c
        c.conn.Close()
    }()

    for {
        _, message, err := c.conn.ReadMessage()
        if err != nil {
            break
        }
        c.hub.broadcast <- message
    }
}

func (c *Client) writePump() {
    defer c.conn.Close()

    for message := range c.send {
        if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
            break
        }
    }
}

type BroadcastRequest struct {
    Message string `json:"message"`
}

func broadcastMessage(c echo.Context) error {
    req := new(BroadcastRequest)
    if err := c.Bind(req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
    }

    hub.broadcast <- []byte(req.Message)

    return c.JSON(http.StatusOK, map[string]string{
        "status": "sent",
    })
}
```

## Interview Key Points

### Echo vs Gin Selection

**Q: What are the differences between Echo and Gin? When should you choose Echo?**

```go
// Main differences:
// 1. API design style
// Echo: Returns error, more idiomatic Go
func handler(c echo.Context) error {
    return c.JSON(200, data)
}

// Gin: Doesn't return error
func handler(c *gin.Context) {
    c.JSON(200, data)
}

// 2. Context interface
// Echo uses interface, easier to mock for testing
type Context interface {
    Request() *http.Request
    Response() *Response
    // ...
}

// 3. When to choose Echo:
// - Need better testability
// - Prefer returning error style
// - Need more flexible Context extension
// - Project already uses labstack ecosystem
```

### Middleware Principles

**Q: How is Echo middleware implemented? What is the execution order?**

```go
// Middleware is essentially a higher-order function
type MiddlewareFunc func(HandlerFunc) HandlerFunc
type HandlerFunc func(Context) error

// Onion model execution order
// Request: A Pre -> B Pre -> C Pre -> Handler -> C Post -> B Post -> A Post

// Middleware chain building
func (e *Echo) Use(middleware ...MiddlewareFunc) {
    e.middleware = append(e.middleware, middleware...)
}

// Builds into chain calls during execution
func applyMiddleware(h HandlerFunc, middleware ...MiddlewareFunc) HandlerFunc {
    for i := len(middleware) - 1; i >= 0; i-- {
        h = middleware[i](h)
    }
    return h
}
```

### Data Binding Implementation

**Q: How does Echo's Bind work? What data sources does it support?**

```go
// Data source priority
// 1. Path parameters (param tag)
// 2. Query parameters (query tag)
// 3. Form data (form tag)
// 4. JSON/XML Body (json/xml tags)

// Automatically selects based on Content-Type
func (b *DefaultBinder) Bind(i interface{}, c Context) error {
    // 1. Bind path parameters
    if err := b.bindData(i, c.PathParams(), "param"); err != nil {
        return err
    }
    // 2. Bind query parameters
    if err := b.bindData(i, c.QueryParams(), "query"); err != nil {
        return err
    }
    // 3. Bind Body based on Content-Type
    return b.bindBody(i, c)
}
```

### Context Reuse

**Q: Does Echo reuse Context? What should you be aware of?**

```go
// Echo uses sync.Pool to reuse Context
// After request ends, Context is reset and returned to pool

// Dangerous usage
func handler(c echo.Context) error {
    go func() {
        time.Sleep(time.Second)
        c.Logger().Info("log") // Dangerous: c may have been reused
    }()
    return nil
}

// Safe usage
func handler(c echo.Context) error {
    logger := c.Logger()
    data := c.Get("data")
    go func() {
        time.Sleep(time.Second)
        logger.Info("log", data) // Safe: using copied values
    }()
    return nil
}
```

### Error Handling Strategy

**Q: How should you design error handling in Echo?**

```go
// 1. Use custom error type
type AppError struct {
    Code    int
    Message string
    Err     error
}

// 2. Centralized error handling
e.HTTPErrorHandler = func(err error, c echo.Context) {
    switch e := err.(type) {
    case *AppError:
        c.JSON(e.Code, map[string]string{"error": e.Message})
    case *echo.HTTPError:
        c.JSON(e.Code, map[string]interface{}{"error": e.Message})
    default:
        c.JSON(500, map[string]string{"error": "Internal Server Error"})
    }
}

// 3. Don't expose internal errors
if err != nil {
    log.Error(err) // Log details
    return &AppError{500, "Server error", err} // Return generic error
}
```

### Common Interview Questions

1. **How is Echo's routing implemented?**
   - Based on prefix tree (Radix Tree)
   - Supports static routes, parameter routes, wildcard routes
   - Route matching time complexity O(n), where n is path length

2. **How do you implement graceful shutdown?**
   - Listen for system signals (SIGINT, SIGTERM)
   - Call e.Shutdown(ctx)
   - Set timeout context to wait for requests to complete

3. **Is next() required in middleware?**
   - Not required
   - Not calling next() interrupts the request chain
   - Used for auth failures, insufficient permissions, etc.

4. **How do you handle large file uploads?**
   - Use streaming to avoid memory overflow
   - Set request body size limits
   - Use multipart parsing

5. **Echo performance optimization tips?**
   - Use sync.Pool to reuse objects
   - Enable Gzip compression
   - Configure timeouts properly
   - Use caching

## Further Reading

### Official Resources
- [Echo Official Documentation](https://echo.labstack.com/)
- [Echo GitHub Repository](https://github.com/labstack/echo)
- [Echo Cookbook](https://echo.labstack.com/cookbook/)

### Recommended Books
- "Go Web Programming" - Sau Sheong Chang
- "Let's Go" - Alex Edwards
- "Building Web Apps with Go" - Jeremy Saenz

### Community Resources
- [Echo Awesome List](https://github.com/labstack/awesome-echo)
- [Go Web Examples](https://gowebexamples.com/)
- [Golang Weekly Newsletter](https://golangweekly.com/)

### Related Technologies
- [GORM](https://gorm.io/) - Go ORM library
- [Validator](https://github.com/go-playground/validator) - Data validation library
- [JWT-Go](https://github.com/golang-jwt/jwt) - JWT library
- [Zap](https://github.com/uber-go/zap) - High-performance logging library
- [Viper](https://github.com/spf13/viper) - Configuration management library
