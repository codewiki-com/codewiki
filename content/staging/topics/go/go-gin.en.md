---
title: Go Gin Framework Complete Guide
description: Master Go and Gin for high-performance backend services
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Gin
  - High Performance
  - Microservices
status: imported
origin: old/src/content/docs/backend/go-gin.en.md
divergence: 0.155
issues: []
legacy:
  category: Backend
  subcategory: Go
  order: 11
  lastUpdated: 2026-01-07
---

## Go Basics Review

### Core Features of Go

Go (also known as Golang) is a statically typed, compiled programming language developed by Google. It is renowned for its simplicity, efficiency, and powerful concurrency support, making it particularly suitable for building high-performance backend services.

```go
// Go language basic syntax example
package main

import (
    "fmt"
    "sync"
)

// Struct definition
type User struct {
    ID       int    `json:"id"`
    Username string `json:"username"`
    Email    string `json:"email"`
}

// Method definition
func (u *User) GetDisplayName() string {
    return fmt.Sprintf("%s (%s)", u.Username, u.Email)
}

// Interface definition
type Repository interface {
    FindByID(id int) (*User, error)
    Save(user *User) error
}

func main() {
    // Variable declaration
    var name string = "Gin Framework"
    age := 10 // Type inference

    // Slice operations
    users := []User{
        {ID: 1, Username: "alice", Email: "alice@example.com"},
        {ID: 2, Username: "bob", Email: "bob@example.com"},
    }

    // Map operations
    userMap := make(map[int]*User)
    for i := range users {
        userMap[users[i].ID] = &users[i]
    }

    fmt.Printf("Framework: %s, Version: %d\n", name, age)
}
```

### Goroutines and Concurrency

Go's concurrency model is based on CSP (Communicating Sequential Processes), implemented through Goroutines and Channels:

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// Using Goroutines for concurrent processing
func processTask(id int, wg *sync.WaitGroup) {
    defer wg.Done()

    fmt.Printf("Task %d started\n", id)
    time.Sleep(100 * time.Millisecond) // Simulate time-consuming operation
    fmt.Printf("Task %d completed\n", id)
}

// Using Channels for communication
func producer(ch chan<- int) {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch)
}

func consumer(ch <-chan int, done chan<- bool) {
    for num := range ch {
        fmt.Printf("Received: %d\n", num)
    }
    done <- true
}

func main() {
    // Goroutine example
    var wg sync.WaitGroup
    for i := 1; i <= 3; i++ {
        wg.Add(1)
        go processTask(i, &wg)
    }
    wg.Wait()

    // Channel example
    ch := make(chan int, 5)
    done := make(chan bool)

    go producer(ch)
    go consumer(ch, done)

    <-done
}
```

### Error Handling Patterns

Go uses explicit error return values rather than exceptions:

```go
package main

import (
    "errors"
    "fmt"
)

// Custom error type
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on field '%s': %s", e.Field, e.Message)
}

// Sentinel errors
var (
    ErrNotFound     = errors.New("resource not found")
    ErrUnauthorized = errors.New("unauthorized access")
)

// Error wrapping
func findUser(id int) (*User, error) {
    if id <= 0 {
        return nil, &ValidationError{Field: "id", Message: "must be positive"}
    }
    if id > 1000 {
        return nil, fmt.Errorf("findUser: %w", ErrNotFound)
    }
    return &User{ID: id, Username: "test"}, nil
}

func main() {
    user, err := findUser(-1)
    if err != nil {
        // Type assertion to check error type
        var validationErr *ValidationError
        if errors.As(err, &validationErr) {
            fmt.Printf("Validation failed: %s\n", validationErr.Message)
            return
        }

        // Check specific error
        if errors.Is(err, ErrNotFound) {
            fmt.Println("User not found")
            return
        }

        fmt.Printf("Unexpected error: %v\n", err)
        return
    }
    fmt.Printf("Found user: %s\n", user.Username)
}
```

## Gin Framework Features

### What is Gin

Gin is a high-performance HTTP web framework written in Go. It provides a Martini-like API but with performance up to 40 times faster. Gin uses httprouter as its routing engine, achieving zero memory allocation routing.

### Core Advantages

- **Ultimate Performance**: Radix tree-based routing with zero memory allocation
- **Middleware Support**: Flexible middleware chain invocation
- **Crash Recovery**: Built-in Recovery middleware for automatic panic recovery
- **JSON Validation**: Integrated go-playground/validator for request validation
- **Route Grouping**: Support for API versioning and modular organization
- **Rendering Support**: Built-in JSON, XML, HTML, and other rendering methods

### Installation and Quick Start

```bash
# Initialize Go module
go mod init myproject

# Install Gin
go get -u github.com/gin-gonic/gin
```

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    // Create default Gin engine (includes Logger and Recovery middleware)
    r := gin.Default()

    // Define route
    r.GET("/ping", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "pong",
        })
    })

    // Start server
    r.Run(":8080") // Listen on 0.0.0.0:8080
}
```

## Routing and Middleware

### Basic Routing

Gin supports all standard HTTP methods:

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // Basic routing methods
    r.GET("/users", getUsers)
    r.POST("/users", createUser)
    r.PUT("/users/:id", updateUser)
    r.DELETE("/users/:id", deleteUser)
    r.PATCH("/users/:id", patchUser)

    // Match any HTTP method
    r.Any("/any", handleAny)

    // Match specific methods
    r.Handle("CONNECT", "/connect", handleConnect)

    r.Run(":8080")
}

func getUsers(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"users": []string{"alice", "bob"}})
}

func createUser(c *gin.Context) {
    c.JSON(http.StatusCreated, gin.H{"message": "user created"})
}

func updateUser(c *gin.Context) {
    id := c.Param("id")
    c.JSON(http.StatusOK, gin.H{"message": "user updated", "id": id})
}

func deleteUser(c *gin.Context) {
    id := c.Param("id")
    c.JSON(http.StatusOK, gin.H{"message": "user deleted", "id": id})
}

func patchUser(c *gin.Context) {
    id := c.Param("id")
    c.JSON(http.StatusOK, gin.H{"message": "user patched", "id": id})
}

func handleAny(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"method": c.Request.Method})
}

func handleConnect(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"message": "connected"})
}
```

### Route Parameters

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // Path parameters - must exist
    r.GET("/user/:name", func(c *gin.Context) {
        name := c.Param("name")
        c.String(http.StatusOK, "Hello %s", name)
    })

    // Wildcard parameters - match all remaining paths
    r.GET("/files/*filepath", func(c *gin.Context) {
        filepath := c.Param("filepath")
        c.String(http.StatusOK, "File path: %s", filepath)
    })

    // Exact match takes priority over wildcards
    r.GET("/user/profile", func(c *gin.Context) {
        c.String(http.StatusOK, "User Profile Page")
    })

    r.Run(":8080")
}
```

### Route Grouping

Route grouping is a best practice for organizing APIs, especially suitable for API version management:

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // API v1 group
    v1 := r.Group("/api/v1")
    {
        v1.GET("/users", getV1Users)
        v1.GET("/users/:id", getV1User)
        v1.POST("/users", createV1User)

        // Nested groups
        admin := v1.Group("/admin")
        admin.Use(AdminAuthMiddleware()) // Group-level middleware
        {
            admin.GET("/stats", getAdminStats)
            admin.DELETE("/users/:id", deleteUser)
        }
    }

    // API v2 group
    v2 := r.Group("/api/v2")
    {
        v2.GET("/users", getV2Users)
        v2.GET("/users/:id", getV2User)
    }

    r.Run(":8080")
}

func AdminAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("X-Admin-Token")
        if token != "secret-admin-token" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": "admin authentication required",
            })
            return
        }
        c.Next()
    }
}

func getV1Users(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"version": "v1", "users": []string{}})
}

func getV1User(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"version": "v1", "id": c.Param("id")})
}

func createV1User(c *gin.Context) {
    c.JSON(http.StatusCreated, gin.H{"message": "created"})
}

func getV2Users(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"version": "v2", "data": []string{}})
}

func getV2User(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"version": "v2", "id": c.Param("id")})
}

func getAdminStats(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"total_users": 100})
}
```

### Middleware Deep Dive

Middleware is one of Gin's core features, used to execute common logic before and after request processing:

```go
package main

import (
    "log"
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
)

// Custom logging middleware
func LoggerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Before request
        startTime := time.Now()
        path := c.Request.URL.Path
        method := c.Request.Method

        // Process request
        c.Next()

        // After request
        latency := time.Since(startTime)
        statusCode := c.Writer.Status()

        log.Printf("[%s] %s %d %v", method, path, statusCode, latency)
    }
}

// Authentication middleware
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": "authorization header required",
            })
            return
        }

        // Validate token (simplified example)
        if token != "Bearer valid-token" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": "invalid token",
            })
            return
        }

        // Store user info in context
        c.Set("userID", 123)
        c.Set("username", "alice")

        c.Next()
    }
}

// CORS middleware
func CORSMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }

        c.Next()
    }
}

// Rate limiting middleware
func RateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
    requests := make(map[string][]time.Time)

    return func(c *gin.Context) {
        clientIP := c.ClientIP()
        now := time.Now()

        // Clean expired records
        if times, exists := requests[clientIP]; exists {
            var valid []time.Time
            for _, t := range times {
                if now.Sub(t) < window {
                    valid = append(valid, t)
                }
            }
            requests[clientIP] = valid
        }

        // Check rate limit
        if len(requests[clientIP]) >= maxRequests {
            c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
                "error": "rate limit exceeded",
            })
            return
        }

        requests[clientIP] = append(requests[clientIP], now)
        c.Next()
    }
}

func main() {
    r := gin.New() // Don't use default middleware

    // Global middleware
    r.Use(gin.Recovery())      // Crash recovery
    r.Use(LoggerMiddleware())  // Custom logging
    r.Use(CORSMiddleware())    // CORS

    // Public routes
    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "ok"})
    })

    // Protected route group
    protected := r.Group("/api")
    protected.Use(AuthMiddleware())
    protected.Use(RateLimitMiddleware(100, time.Minute))
    {
        protected.GET("/profile", func(c *gin.Context) {
            userID := c.MustGet("userID").(int)
            username := c.MustGet("username").(string)
            c.JSON(http.StatusOK, gin.H{
                "userID":   userID,
                "username": username,
            })
        })
    }

    r.Run(":8080")
}
```

## Request Handling and Parameter Binding

### Getting Request Parameters

Gin provides multiple ways to get request parameters:

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // Query parameters
    r.GET("/search", func(c *gin.Context) {
        keyword := c.Query("keyword")              // Get parameter, returns empty string if not exists
        page := c.DefaultQuery("page", "1")        // With default value
        limit, exists := c.GetQuery("limit")       // Check if parameter exists

        c.JSON(http.StatusOK, gin.H{
            "keyword":     keyword,
            "page":        page,
            "limit":       limit,
            "limitExists": exists,
        })
    })

    // Path parameters
    r.GET("/users/:id/posts/:postId", func(c *gin.Context) {
        userID := c.Param("id")
        postID := c.Param("postId")

        c.JSON(http.StatusOK, gin.H{
            "userID": userID,
            "postID": postID,
        })
    })

    // Form parameters
    r.POST("/form", func(c *gin.Context) {
        name := c.PostForm("name")
        email := c.DefaultPostForm("email", "unknown@example.com")

        c.JSON(http.StatusOK, gin.H{
            "name":  name,
            "email": email,
        })
    })

    // Get all query parameters
    r.GET("/params", func(c *gin.Context) {
        queryParams := c.Request.URL.Query()
        c.JSON(http.StatusOK, queryParams)
    })

    r.Run(":8080")
}
```

### Model Binding

Gin supports binding request data to structs, which is the recommended approach for handling complex requests:

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

// Login request struct
type LoginRequest struct {
    Username string `json:"username" form:"username" binding:"required"`
    Password string `json:"password" form:"password" binding:"required,min=6"`
}

// User creation request
type CreateUserRequest struct {
    Name     string `json:"name" binding:"required,min=2,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"required,gte=18,lte=120"`
    Phone    string `json:"phone" binding:"omitempty,len=11"`
}

// URI parameter binding
type UserURI struct {
    ID   string `uri:"id" binding:"required,uuid"`
    Name string `uri:"name" binding:"required"`
}

// Query parameter binding
type SearchQuery struct {
    Keyword  string `form:"keyword" binding:"required"`
    Page     int    `form:"page" binding:"omitempty,min=1"`
    PageSize int    `form:"page_size" binding:"omitempty,min=10,max=100"`
}

func main() {
    r := gin.Default()

    // JSON binding
    r.POST("/login/json", func(c *gin.Context) {
        var req LoginRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusOK, gin.H{
            "message":  "login successful",
            "username": req.Username,
        })
    })

    // Form binding
    r.POST("/login/form", func(c *gin.Context) {
        var req LoginRequest
        if err := c.ShouldBind(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusOK, gin.H{
            "message":  "login successful",
            "username": req.Username,
        })
    })

    // URI parameter binding
    r.GET("/users/:name/:id", func(c *gin.Context) {
        var uri UserURI
        if err := c.ShouldBindUri(&uri); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusOK, gin.H{
            "name": uri.Name,
            "id":   uri.ID,
        })
    })

    // Query parameter binding
    r.GET("/search", func(c *gin.Context) {
        var query SearchQuery
        query.Page = 1       // Default value
        query.PageSize = 20  // Default value

        if err := c.ShouldBindQuery(&query); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusOK, gin.H{
            "keyword":   query.Keyword,
            "page":      query.Page,
            "page_size": query.PageSize,
        })
    })

    // Create user (complete validation example)
    r.POST("/users", func(c *gin.Context) {
        var req CreateUserRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusCreated, gin.H{
            "message": "user created",
            "user":    req,
        })
    })

    r.Run(":8080")
}
```

## Data Validation

### Built-in Validation Rules

Gin uses the go-playground/validator library for data validation, supporting rich validation rules:

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/gin-gonic/gin/binding"
    "github.com/go-playground/validator/v10"
)

// Complete user registration request
type RegisterRequest struct {
    // Basic validation
    Username string `json:"username" binding:"required,min=3,max=20,alphanum"`
    Password string `json:"password" binding:"required,min=8,containsany=!@#$%"`
    Email    string `json:"email" binding:"required,email"`

    // Numeric validation
    Age      int     `json:"age" binding:"required,gte=18,lte=120"`
    Height   float64 `json:"height" binding:"omitempty,gt=0,lt=300"`

    // Conditional validation
    Phone    string `json:"phone" binding:"required_without=Email,omitempty,len=11"`

    // Enum validation
    Gender   string `json:"gender" binding:"required,oneof=male female other"`

    // Time validation
    Birthday string `json:"birthday" binding:"omitempty,datetime=2006-01-02"`

    // URL validation
    Website  string `json:"website" binding:"omitempty,url"`

    // IP validation
    IP       string `json:"ip" binding:"omitempty,ip"`

    // Custom validation
    Nickname string `json:"nickname" binding:"required,nickname"`
}

// Password confirmation request
type PasswordRequest struct {
    Password        string `json:"password" binding:"required,min=8"`
    ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
}

// Custom validator
func nicknameValidator(fl validator.FieldLevel) bool {
    nickname := fl.Field().String()
    // Nickname cannot contain sensitive words
    sensitiveWords := []string{"admin", "root", "system"}
    for _, word := range sensitiveWords {
        if nickname == word {
            return false
        }
    }
    return len(nickname) >= 2 && len(nickname) <= 20
}

func main() {
    r := gin.Default()

    // Register custom validator
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterValidation("nickname", nicknameValidator)
    }

    r.POST("/register", func(c *gin.Context) {
        var req RegisterRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error":   "validation failed",
                "details": err.Error(),
            })
            return
        }

        c.JSON(http.StatusCreated, gin.H{
            "message": "registration successful",
            "user":    req.Username,
        })
    })

    r.POST("/change-password", func(c *gin.Context) {
        var req PasswordRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusOK, gin.H{"message": "password changed"})
    })

    r.Run(":8080")
}
```

### Custom Error Messages

```go
package main

import (
    "net/http"
    "reflect"
    "github.com/gin-gonic/gin"
    "github.com/gin-gonic/gin/binding"
    "github.com/go-playground/validator/v10"
)

type User struct {
    Name  string `json:"name" binding:"required" label:"Name"`
    Email string `json:"email" binding:"required,email" label:"Email"`
    Age   int    `json:"age" binding:"required,gte=18" label:"Age"`
}

// Custom error message mapping
var validationMessages = map[string]string{
    "required": "%s is required",
    "email":    "%s must be a valid email address",
    "gte":      "%s must be greater than or equal to %s",
    "lte":      "%s must be less than or equal to %s",
    "min":      "%s must be at least %s characters",
    "max":      "%s must be at most %s characters",
}

func translateError(err error) map[string]string {
    errs := err.(validator.ValidationErrors)
    result := make(map[string]string)
    for _, e := range errs {
        field := e.Field()
        tag := e.Tag()
        if msg, ok := validationMessages[tag]; ok {
            result[field] = fmt.Sprintf(msg, field, e.Param())
        } else {
            result[field] = e.Error()
        }
    }
    return result
}

func main() {
    r := gin.Default()

    // Register custom tag name function
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterTagNameFunc(func(fld reflect.StructField) string {
            label := fld.Tag.Get("label")
            if label == "" {
                return fld.Name
            }
            return label
        })
    }

    r.POST("/users", func(c *gin.Context) {
        var user User
        if err := c.ShouldBindJSON(&user); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error":  "validation failed",
                "fields": translateError(err),
            })
            return
        }
        c.JSON(http.StatusCreated, user)
    })

    r.Run(":8080")
}
```

## Database Operations (GORM)

### GORM Introduction and Configuration

GORM is the most popular ORM library in Go, providing complete database operation functionality:

```go
package main

import (
    "fmt"
    "log"
    "time"
    "gorm.io/driver/mysql"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

// Database configuration
type DBConfig struct {
    Host         string
    Port         int
    User         string
    Password     string
    DBName       string
    MaxIdleConns int
    MaxOpenConns int
    MaxLifetime  time.Duration
}

// Initialize MySQL connection
func InitMySQL(config DBConfig) (*gorm.DB, error) {
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        config.User, config.Password, config.Host, config.Port, config.DBName)

    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        return nil, err
    }

    sqlDB, err := db.DB()
    if err != nil {
        return nil, err
    }

    // Connection pool configuration
    sqlDB.SetMaxIdleConns(config.MaxIdleConns)
    sqlDB.SetMaxOpenConns(config.MaxOpenConns)
    sqlDB.SetConnMaxLifetime(config.MaxLifetime)

    return db, nil
}

// Initialize PostgreSQL connection
func InitPostgres(config DBConfig) (*gorm.DB, error) {
    dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
        config.Host, config.Port, config.User, config.Password, config.DBName)

    return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}
```

### Model Definition and Associations

```go
package models

import (
    "time"
    "gorm.io/gorm"
)

// User model
type User struct {
    ID        uint           `gorm:"primaryKey" json:"id"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

    Username  string `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
    Email     string `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
    Password  string `gorm:"type:varchar(255);not null" json:"-"`
    Avatar    string `gorm:"type:varchar(255)" json:"avatar"`
    Status    int    `gorm:"type:tinyint;default:1" json:"status"`

    // Associations
    Profile   *Profile  `gorm:"foreignKey:UserID" json:"profile,omitempty"`
    Posts     []Post    `gorm:"foreignKey:AuthorID" json:"posts,omitempty"`
    Roles     []Role    `gorm:"many2many:user_roles" json:"roles,omitempty"`
}

// User profile
type Profile struct {
    ID        uint   `gorm:"primaryKey" json:"id"`
    UserID    uint   `gorm:"uniqueIndex" json:"user_id"`
    Bio       string `gorm:"type:text" json:"bio"`
    Location  string `gorm:"type:varchar(100)" json:"location"`
    Website   string `gorm:"type:varchar(255)" json:"website"`
    Birthday  *time.Time `json:"birthday"`
}

// Post model
type Post struct {
    ID        uint           `gorm:"primaryKey" json:"id"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

    Title     string `gorm:"type:varchar(200);not null" json:"title"`
    Content   string `gorm:"type:text" json:"content"`
    AuthorID  uint   `gorm:"index" json:"author_id"`

    Author    *User      `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
    Tags      []Tag      `gorm:"many2many:post_tags" json:"tags,omitempty"`
    Comments  []Comment  `gorm:"foreignKey:PostID" json:"comments,omitempty"`
}

// Tag model
type Tag struct {
    ID   uint   `gorm:"primaryKey" json:"id"`
    Name string `gorm:"type:varchar(50);uniqueIndex" json:"name"`
}

// Comment model
type Comment struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    CreatedAt time.Time `json:"created_at"`
    PostID    uint      `gorm:"index" json:"post_id"`
    UserID    uint      `gorm:"index" json:"user_id"`
    Content   string    `gorm:"type:text;not null" json:"content"`

    User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// Role model
type Role struct {
    ID   uint   `gorm:"primaryKey" json:"id"`
    Name string `gorm:"type:varchar(50);uniqueIndex" json:"name"`
}

// Auto migration
func AutoMigrate(db *gorm.DB) error {
    return db.AutoMigrate(
        &User{},
        &Profile{},
        &Post{},
        &Tag{},
        &Comment{},
        &Role{},
    )
}
```

### CRUD Operations

```go
package repository

import (
    "context"
    "gorm.io/gorm"
)

type UserRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
    return &UserRepository{db: db}
}

// Create user
func (r *UserRepository) Create(ctx context.Context, user *User) error {
    return r.db.WithContext(ctx).Create(user).Error
}

// Batch create
func (r *UserRepository) CreateBatch(ctx context.Context, users []User) error {
    return r.db.WithContext(ctx).CreateInBatches(users, 100).Error
}

// Find by ID
func (r *UserRepository) FindByID(ctx context.Context, id uint) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).
        Preload("Profile").
        Preload("Roles").
        First(&user, id).Error
    if err != nil {
        return nil, err
    }
    return &user, nil
}

// Find by username
func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).
        Where("username = ?", username).
        First(&user).Error
    return &user, err
}

// Paginated query
func (r *UserRepository) FindAll(ctx context.Context, page, pageSize int) ([]User, int64, error) {
    var users []User
    var total int64

    db := r.db.WithContext(ctx).Model(&User{})

    // Count total
    if err := db.Count(&total).Error; err != nil {
        return nil, 0, err
    }

    // Paginated query
    offset := (page - 1) * pageSize
    err := db.Offset(offset).Limit(pageSize).
        Preload("Profile").
        Find(&users).Error

    return users, total, err
}

// Update user
func (r *UserRepository) Update(ctx context.Context, user *User) error {
    return r.db.WithContext(ctx).Save(user).Error
}

// Partial update
func (r *UserRepository) UpdateFields(ctx context.Context, id uint, fields map[string]interface{}) error {
    return r.db.WithContext(ctx).
        Model(&User{}).
        Where("id = ?", id).
        Updates(fields).Error
}

// Delete user (soft delete)
func (r *UserRepository) Delete(ctx context.Context, id uint) error {
    return r.db.WithContext(ctx).Delete(&User{}, id).Error
}

// Hard delete
func (r *UserRepository) HardDelete(ctx context.Context, id uint) error {
    return r.db.WithContext(ctx).Unscoped().Delete(&User{}, id).Error
}

// Transaction operation
func (r *UserRepository) CreateWithProfile(ctx context.Context, user *User, profile *Profile) error {
    return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        if err := tx.Create(user).Error; err != nil {
            return err
        }

        profile.UserID = user.ID
        if err := tx.Create(profile).Error; err != nil {
            return err
        }

        return nil
    })
}

// Complex query
func (r *UserRepository) SearchUsers(ctx context.Context, keyword string, status int, page, pageSize int) ([]User, int64, error) {
    var users []User
    var total int64

    db := r.db.WithContext(ctx).Model(&User{})

    // Dynamic conditions
    if keyword != "" {
        db = db.Where("username LIKE ? OR email LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
    }
    if status > 0 {
        db = db.Where("status = ?", status)
    }

    // Count
    if err := db.Count(&total).Error; err != nil {
        return nil, 0, err
    }

    // Paginate
    offset := (page - 1) * pageSize
    err := db.Offset(offset).Limit(pageSize).
        Order("created_at DESC").
        Find(&users).Error

    return users, total, err
}
```

## Error Handling

### Unified Error Handling

```go
package errors

import (
    "fmt"
    "net/http"
)

// Business error codes
const (
    CodeSuccess          = 0
    CodeInvalidParams    = 10001
    CodeUnauthorized     = 10002
    CodeForbidden        = 10003
    CodeNotFound         = 10004
    CodeInternalError    = 10005
    CodeDuplicateEntry   = 10006
    CodeValidationFailed = 10007
)

// Error message mapping
var codeMessages = map[int]string{
    CodeSuccess:          "success",
    CodeInvalidParams:    "invalid parameters",
    CodeUnauthorized:     "unauthorized",
    CodeForbidden:        "forbidden",
    CodeNotFound:         "resource not found",
    CodeInternalError:    "internal server error",
    CodeDuplicateEntry:   "duplicate entry",
    CodeValidationFailed: "validation failed",
}

// Custom error type
type AppError struct {
    Code       int         `json:"code"`
    Message    string      `json:"message"`
    Details    interface{} `json:"details,omitempty"`
    HTTPStatus int         `json:"-"`
}

func (e *AppError) Error() string {
    return fmt.Sprintf("code: %d, message: %s", e.Code, e.Message)
}

// Convenience functions for creating errors
func NewAppError(code int, message string) *AppError {
    return &AppError{
        Code:       code,
        Message:    message,
        HTTPStatus: http.StatusBadRequest,
    }
}

func NewAppErrorWithDetails(code int, message string, details interface{}) *AppError {
    return &AppError{
        Code:       code,
        Message:    message,
        Details:    details,
        HTTPStatus: http.StatusBadRequest,
    }
}

// Predefined errors
var (
    ErrInvalidParams    = &AppError{Code: CodeInvalidParams, Message: codeMessages[CodeInvalidParams], HTTPStatus: http.StatusBadRequest}
    ErrUnauthorized     = &AppError{Code: CodeUnauthorized, Message: codeMessages[CodeUnauthorized], HTTPStatus: http.StatusUnauthorized}
    ErrForbidden        = &AppError{Code: CodeForbidden, Message: codeMessages[CodeForbidden], HTTPStatus: http.StatusForbidden}
    ErrNotFound         = &AppError{Code: CodeNotFound, Message: codeMessages[CodeNotFound], HTTPStatus: http.StatusNotFound}
    ErrInternalError    = &AppError{Code: CodeInternalError, Message: codeMessages[CodeInternalError], HTTPStatus: http.StatusInternalServerError}
    ErrDuplicateEntry   = &AppError{Code: CodeDuplicateEntry, Message: codeMessages[CodeDuplicateEntry], HTTPStatus: http.StatusConflict}
    ErrValidationFailed = &AppError{Code: CodeValidationFailed, Message: codeMessages[CodeValidationFailed], HTTPStatus: http.StatusBadRequest}
)
```

### Error Handling Middleware

```go
package middleware

import (
    "log"
    "net/http"
    "runtime/debug"
    "github.com/gin-gonic/gin"
)

// Unified response format
type Response struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}

// Success response
func Success(c *gin.Context, data interface{}) {
    c.JSON(http.StatusOK, Response{
        Code:    0,
        Message: "success",
        Data:    data,
    })
}

// Error response
func Error(c *gin.Context, err *AppError) {
    c.JSON(err.HTTPStatus, Response{
        Code:    err.Code,
        Message: err.Message,
        Data:    err.Details,
    })
}

// Recovery middleware
func RecoveryMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                // Log error stack trace
                log.Printf("Panic recovered: %v\n%s", err, debug.Stack())

                c.AbortWithStatusJSON(http.StatusInternalServerError, Response{
                    Code:    CodeInternalError,
                    Message: "internal server error",
                })
            }
        }()
        c.Next()
    }
}

// Error handler middleware
func ErrorHandlerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()

        // Handle errors in Gin context
        if len(c.Errors) > 0 {
            err := c.Errors.Last().Err

            // Check if it's a custom error
            if appErr, ok := err.(*AppError); ok {
                Error(c, appErr)
                return
            }

            // Default internal error
            Error(c, ErrInternalError)
        }
    }
}
```

### Using in Handlers

```go
package handler

import (
    "errors"
    "log"
    "net/http"
    "strings"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type UserHandler struct {
    userService *UserService
}

func (h *UserHandler) GetUser(c *gin.Context) {
    id := c.Param("id")

    user, err := h.userService.GetByID(c.Request.Context(), id)
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            Error(c, ErrNotFound)
            return
        }
        log.Printf("Failed to get user: %v", err)
        Error(c, ErrInternalError)
        return
    }

    Success(c, user)
}

func (h *UserHandler) CreateUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        Error(c, NewAppErrorWithDetails(
            CodeValidationFailed,
            "validation failed",
            translateError(err),
        ))
        return
    }

    user, err := h.userService.Create(c.Request.Context(), &req)
    if err != nil {
        // Check for duplicate key error
        if strings.Contains(err.Error(), "duplicate") {
            Error(c, ErrDuplicateEntry)
            return
        }
        Error(c, ErrInternalError)
        return
    }

    c.JSON(http.StatusCreated, Response{
        Code:    0,
        Message: "user created successfully",
        Data:    user,
    })
}
```

## Logging and Monitoring

### Structured Logging

```go
package logger

import (
    "time"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

var Logger *zap.Logger

// Initialize logger
func InitLogger(env string) {
    var config zap.Config

    if env == "production" {
        config = zap.NewProductionConfig()
        config.OutputPaths = []string{"stdout", "/var/log/app/app.log"}
    } else {
        config = zap.NewDevelopmentConfig()
        config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
    }

    config.EncoderConfig.TimeKey = "timestamp"
    config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

    var err error
    Logger, err = config.Build()
    if err != nil {
        panic(err)
    }
}

// Gin logging middleware
func GinLogger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        query := c.Request.URL.RawQuery

        c.Next()

        latency := time.Since(start)
        statusCode := c.Writer.Status()
        clientIP := c.ClientIP()
        method := c.Request.Method
        userAgent := c.Request.UserAgent()

        // Structured logging
        Logger.Info("HTTP Request",
            zap.Int("status", statusCode),
            zap.String("method", method),
            zap.String("path", path),
            zap.String("query", query),
            zap.String("ip", clientIP),
            zap.String("user_agent", userAgent),
            zap.Duration("latency", latency),
            zap.Int("body_size", c.Writer.Size()),
        )

        // Log errors
        if len(c.Errors) > 0 {
            for _, e := range c.Errors {
                Logger.Error("Request error",
                    zap.String("path", path),
                    zap.Error(e.Err),
                )
            }
        }
    }
}

// Request ID middleware
func RequestIDMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        requestID := c.GetHeader("X-Request-ID")
        if requestID == "" {
            requestID = uuid.New().String()
        }

        c.Set("request_id", requestID)
        c.Writer.Header().Set("X-Request-ID", requestID)

        c.Next()
    }
}
```

### Prometheus Monitoring

```go
package metrics

import (
    "strconv"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )

    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "endpoint"},
    )

    httpRequestsInFlight = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "http_requests_in_flight",
            Help: "Number of HTTP requests currently being processed",
        },
    )
)

func init() {
    prometheus.MustRegister(httpRequestsTotal)
    prometheus.MustRegister(httpRequestDuration)
    prometheus.MustRegister(httpRequestsInFlight)
}

// Prometheus middleware
func PrometheusMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        httpRequestsInFlight.Inc()
        defer httpRequestsInFlight.Dec()

        start := time.Now()
        path := c.FullPath()
        if path == "" {
            path = "unknown"
        }

        c.Next()

        duration := time.Since(start).Seconds()
        status := strconv.Itoa(c.Writer.Status())

        httpRequestsTotal.WithLabelValues(c.Request.Method, path, status).Inc()
        httpRequestDuration.WithLabelValues(c.Request.Method, path).Observe(duration)
    }
}

// Setup metrics endpoint
func SetupMetrics(r *gin.Engine) {
    r.GET("/metrics", gin.WrapH(promhttp.Handler()))
}
```

## Interview Key Points

### Gin Framework Core Principles

**Q: How does Gin implement routing?**

Gin uses httprouter as its routing engine, based on a Radix Tree (compressed prefix tree). The advantages of this data structure are:
- Route matching time complexity is O(n), where n is the path length
- Low memory usage - paths with common prefixes share nodes
- Supports path parameters and wildcard matching

**Q: What is the execution order of Gin middleware?**

```go
// Middleware execution order example
func MiddlewareA() gin.HandlerFunc {
    return func(c *gin.Context) {
        fmt.Println("A - before")  // 1
        c.Next()
        fmt.Println("A - after")   // 6
    }
}

func MiddlewareB() gin.HandlerFunc {
    return func(c *gin.Context) {
        fmt.Println("B - before")  // 2
        c.Next()
        fmt.Println("B - after")   // 5
    }
}

func Handler(c *gin.Context) {
    fmt.Println("Handler")         // 3, 4
}

// Execution order: A-before -> B-before -> Handler -> B-after -> A-after
```

### Go Language Concurrency

**Q: What's the difference between Goroutines and threads?**

| Feature | Goroutine | Thread |
|---------|-----------|--------|
| Memory footprint | ~2KB | ~1MB |
| Creation/destruction | Very fast (user space) | Slower (kernel space) |
| Scheduling | Go runtime (GMP model) | Operating system |
| Context switch cost | Low (~hundreds of nanoseconds) | High (~microseconds) |
| Communication | Channels | Shared memory |

**Q: How to prevent Goroutine leaks?**

```go
// Use context to control Goroutine lifecycle
func worker(ctx context.Context, jobs <-chan int) {
    for {
        select {
        case <-ctx.Done():
            return // Exit
        case job, ok := <-jobs:
            if !ok {
                return
            }
            process(job)
        }
    }
}

// Use WaitGroup to wait for completion
func processItems(items []int) {
    var wg sync.WaitGroup
    for _, item := range items {
        wg.Add(1)
        go func(i int) {
            defer wg.Done()
            process(i)
        }(item)
    }
    wg.Wait()
}
```

### Database Optimization

**Q: How to avoid N+1 query problem in GORM?**

```go
// Wrong approach - generates N+1 queries
var users []User
db.Find(&users)
for _, user := range users {
    var profile Profile
    db.Where("user_id = ?", user.ID).First(&profile)
}

// Correct approach - use Preload for eager loading
var users []User
db.Preload("Profile").Find(&users)

// Conditional preload
db.Preload("Posts", "status = ?", "published").Find(&users)

// Nested preload
db.Preload("Posts.Comments").Find(&users)
```

**Q: How to optimize database connections under high concurrency?**

```go
// Connection pool configuration
sqlDB, _ := db.DB()
sqlDB.SetMaxIdleConns(10)           // Maximum idle connections
sqlDB.SetMaxOpenConns(100)          // Maximum open connections
sqlDB.SetConnMaxLifetime(time.Hour) // Maximum connection lifetime

// Use read/write separation
// Write to primary, read from replicas
```

### Performance Optimization Tips

```go
// 1. Use object pools to reduce GC pressure
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func ProcessRequest(data []byte) {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufferPool.Put(buf)
    }()
    // Use buf to process data
}

// 2. Avoid unnecessary memory allocations
// Pre-allocate slice capacity
users := make([]User, 0, 100)

// Use strings.Builder for string concatenation
var builder strings.Builder
builder.WriteString("Hello")
builder.WriteString(" World")
result := builder.String()

// 3. Use sync.Once for one-time initialization
var (
    instance *Singleton
    once     sync.Once
)

func GetInstance() *Singleton {
    once.Do(func() {
        instance = &Singleton{}
    })
    return instance
}
```

### Common Interview Questions

1. **What's the difference between c.JSON and c.String in Gin?**
   - c.JSON sets Content-Type to application/json and serializes data
   - c.String sets Content-Type to text/plain and returns the string directly

2. **How to implement request timeout in Gin?**
```go
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
    return func(c *gin.Context) {
        ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
        defer cancel()

        c.Request = c.Request.WithContext(ctx)
        c.Next()
    }
}
```

3. **How to implement graceful shutdown in Go?**
   - Listen for system signals (SIGINT, SIGTERM)
   - Stop accepting new requests
   - Wait for existing requests to complete
   - Close database connections and other resources

4. **How does GORM implement soft delete?**
   - Uses the gorm.DeletedAt field
   - Updates the field to current time on delete
   - Automatically adds `deleted_at IS NULL` condition on queries

## Further Reading

To deepen your understanding of Go and Gin, consider exploring these topics:

### Official Documentation
- [Go Official Documentation](https://golang.org/doc/)
- [Gin Framework Documentation](https://gin-gonic.com/docs/)
- [GORM Documentation](https://gorm.io/docs/)

### Recommended Books
- "The Go Programming Language" by Alan A. A. Donovan and Brian W. Kernighan
- "Concurrency in Go" by Katherine Cox-Buday
- "Go Web Programming" by Sau Sheong Chang

### Advanced Topics
- **Go Internals**: Understanding the Go runtime, garbage collector, and scheduler
- **Microservices with Go**: Building distributed systems using gRPC, message queues
- **Testing in Go**: Unit testing, integration testing, benchmarking
- **Security**: JWT authentication, OAuth2, HTTPS/TLS implementation
- **Cloud-Native Go**: Kubernetes operators, serverless functions

### Community Resources
- Go Blog: https://blog.golang.org/
- Golang Weekly Newsletter
- GopherCon conference talks
- r/golang subreddit

## Summary

This comprehensive guide covered the essential knowledge points for Go and the Gin framework:

1. **Go Language Basics**: Type system, concurrency model, error handling
2. **Gin Framework Features**: High performance, middleware support, rich functionality
3. **Routing and Middleware**: RESTful routes, route grouping, middleware chains
4. **Request Handling**: Parameter retrieval, model binding, data validation
5. **Database Operations**: GORM ORM, CRUD operations, transaction handling
6. **Error Handling**: Unified error format, custom error types
7. **Logging and Monitoring**: Structured logging, Prometheus integration
8. **Project Structure**: Layered architecture, dependency injection, code organization

By mastering these concepts, you will be able to build high-performance, maintainable backend services using Go and Gin. In real-world development, choose appropriate design patterns and best practices based on project requirements, and continuously optimize code quality and system performance.

The combination of Go's simplicity and Gin's performance makes them an excellent choice for building modern web services, APIs, and microservices. Whether you're building a small API or a large-scale distributed system, the patterns and practices covered in this guide will serve as a solid foundation for your development journey.
