---
title: Gin Web Framework
description: Complete guide to Gin, high-performance Go web framework routing, middleware and request handling
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Gin
  - Web Framework
  - HTTP
status: imported
origin: old/src/content/docs/go/gin.en.md
divergence: 0.174
issues: []
legacy:
  category: Go
  subcategory: Web Frameworks
  order: 10
  lastUpdated: 2026-01-07
---

Gin is a high-performance HTTP web framework written in Go (Golang). It features a Martini-like API with significantly better performance - up to 40 times faster thanks to its radix tree-based routing. Gin is one of the most popular Go web frameworks, known for its speed, zero-allocation router, middleware support, and crash-free operation through built-in recovery.

## Key Features

- **Zero Allocation Router**: Gin uses a radix tree-based router that allocates no memory during request handling
- **High Performance**: Benchmarks consistently show Gin outperforming other Go web frameworks
- **Middleware Support**: Extensible middleware chain for logging, authentication, CORS, and more
- **Crash Recovery**: Built-in recovery middleware prevents panics from crashing your server
- **JSON Validation**: Automatic request/response JSON binding with struct tag validation
- **Route Grouping**: Organize related routes and apply common middleware
- **Error Management**: Centralized error handling and logging capabilities
- **Built-in Rendering**: Support for JSON, XML, HTML templates, and more

## Installation

Install Gin using Go modules:

```bash
go get -u github.com/gin-gonic/gin
```

Ensure your Go version is 1.18 or higher for the latest Gin features.

## Basic Application Setup

A minimal Gin application:

```go
package main

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

func main() {
    // Create a Gin router with default middleware (Logger and Recovery)
    router := gin.Default()

    // Define a simple endpoint
    router.GET("/ping", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "pong",
        })
    })

    // Start the server on port 8080
    router.Run(":8080")
}
```

For production environments where you want full control over middleware:

```go
// Create a router without any middleware
router := gin.New()

// Add only the middleware you need
router.Use(gin.Logger())
router.Use(gin.Recovery())
```

## Routing

Gin provides a powerful and flexible routing system that supports all HTTP methods, path parameters, wildcards, and route grouping.

### HTTP Methods

Gin supports all standard HTTP methods:

```go
func main() {
    router := gin.Default()

    router.GET("/resource", getHandler)
    router.POST("/resource", createHandler)
    router.PUT("/resource/:id", updateHandler)
    router.PATCH("/resource/:id", patchHandler)
    router.DELETE("/resource/:id", deleteHandler)
    router.HEAD("/resource", headHandler)
    router.OPTIONS("/resource", optionsHandler)

    // Handle multiple methods for the same route
    router.Any("/multi", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "method": c.Request.Method,
        })
    })

    router.Run(":8080")
}
```

### Path Parameters

Extract dynamic segments from URLs using named parameters:

```go
func main() {
    router := gin.Default()

    // Named parameter - matches /users/john, /users/123, etc.
    router.GET("/users/:name", func(c *gin.Context) {
        name := c.Param("name")
        c.JSON(http.StatusOK, gin.H{
            "user": name,
        })
    })

    // Multiple parameters
    router.GET("/posts/:postID/comments/:commentID", func(c *gin.Context) {
        postID := c.Param("postID")
        commentID := c.Param("commentID")
        c.JSON(http.StatusOK, gin.H{
            "post_id":    postID,
            "comment_id": commentID,
        })
    })

    router.Run(":8080")
}
```

### Wildcard Parameters

Capture multiple path segments using wildcard parameters:

```go
func main() {
    router := gin.Default()

    // Wildcard parameter - matches /files/images/logo.png, /files/docs/readme.txt
    router.GET("/files/*filepath", func(c *gin.Context) {
        filepath := c.Param("filepath")
        c.JSON(http.StatusOK, gin.H{
            "filepath": filepath, // includes leading slash: /images/logo.png
        })
    })

    // Combination of named and wildcard
    router.GET("/users/:name/*action", func(c *gin.Context) {
        name := c.Param("name")
        action := c.Param("action")
        c.String(http.StatusOK, "%s is %s", name, action)
    })

    router.Run(":8080")
}
```

### Query String Parameters

Extract query parameters from the URL:

```go
func main() {
    router := gin.Default()

    // URL: /search?q=golang&page=1&limit=10
    router.GET("/search", func(c *gin.Context) {
        // Get query parameter (returns empty string if not present)
        query := c.Query("q")

        // Get query parameter with default value
        page := c.DefaultQuery("page", "1")

        // Check if parameter exists
        limit, exists := c.GetQuery("limit")

        // Get all values for a parameter (for repeated parameters)
        tags := c.QueryArray("tags") // /search?tags=go&tags=web

        // Get as map (for nested parameters)
        filters := c.QueryMap("filter") // /search?filter[name]=john&filter[age]=30

        c.JSON(http.StatusOK, gin.H{
            "query":        query,
            "page":         page,
            "limit":        limit,
            "limit_exists": exists,
            "tags":         tags,
            "filters":      filters,
        })
    })

    router.Run(":8080")
}
```

### Route Groups

Organize routes and apply middleware to specific groups:

```go
func main() {
    router := gin.Default()

    // API version 1
    v1 := router.Group("/api/v1")
    {
        v1.GET("/users", listUsersV1)
        v1.GET("/users/:id", getUserV1)
        v1.POST("/users", createUserV1)
    }

    // API version 2
    v2 := router.Group("/api/v2")
    {
        v2.GET("/users", listUsersV2)
        v2.GET("/users/:id", getUserV2)
        v2.POST("/users", createUserV2)
    }

    // Protected routes with authentication middleware
    authorized := router.Group("/admin")
    authorized.Use(AuthMiddleware())
    {
        authorized.GET("/dashboard", dashboardHandler)
        authorized.GET("/settings", settingsHandler)

        // Nested group
        users := authorized.Group("/users")
        {
            users.GET("/", listAdminUsers)
            users.DELETE("/:id", deleteUser)
        }
    }

    router.Run(":8080")
}
```

## Middleware

Middleware functions execute before or after the main handler, enabling cross-cutting concerns like logging, authentication, and error handling.

### Built-in Middleware

Gin includes several built-in middleware functions:

```go
func main() {
    // gin.Default() includes Logger and Recovery
    router := gin.Default()

    // Equivalent to:
    router = gin.New()
    router.Use(gin.Logger())   // Logs request details
    router.Use(gin.Recovery()) // Recovers from panics

    router.Run(":8080")
}
```

### Custom Middleware

Create custom middleware for specific requirements:

```go
// Timing middleware - measures request duration
func TimingMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()

        // Process request
        c.Next()

        // After request
        duration := time.Since(start)
        c.Writer.Header().Set("X-Response-Time", duration.String())

        log.Printf("Request %s %s took %v", c.Request.Method, c.Request.URL.Path, duration)
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

func main() {
    router := gin.Default()

    // Apply globally
    router.Use(TimingMiddleware())
    router.Use(RequestIDMiddleware())

    router.GET("/test", func(c *gin.Context) {
        requestID := c.GetString("request_id")
        c.JSON(http.StatusOK, gin.H{
            "request_id": requestID,
        })
    })

    router.Run(":8080")
}
```

### Authentication Middleware

Implement authentication using middleware:

```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")

        if token == "" {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Authorization header is required",
            })
            c.Abort()
            return
        }

        // Remove "Bearer " prefix if present
        if len(token) > 7 && token[:7] == "Bearer " {
            token = token[7:]
        }

        // Validate token (replace with your validation logic)
        claims, err := validateToken(token)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "Invalid or expired token",
            })
            c.Abort()
            return
        }

        // Store user info in context
        c.Set("user_id", claims.UserID)
        c.Set("user_role", claims.Role)

        c.Next()
    }
}

func main() {
    router := gin.Default()

    // Public routes
    router.GET("/health", healthCheck)
    router.POST("/login", loginHandler)

    // Protected routes
    protected := router.Group("/api")
    protected.Use(AuthMiddleware())
    {
        protected.GET("/profile", func(c *gin.Context) {
            userID := c.GetString("user_id")
            c.JSON(http.StatusOK, gin.H{
                "user_id": userID,
            })
        })
    }

    router.Run(":8080")
}
```

### Basic Authentication

Gin provides built-in basic authentication middleware:

```go
func main() {
    router := gin.Default()

    // Define user credentials
    accounts := gin.Accounts{
        "admin": "secret123",
        "user":  "password456",
    }

    // Protected group with basic auth
    authorized := router.Group("/admin", gin.BasicAuth(accounts))
    {
        authorized.GET("/secrets", func(c *gin.Context) {
            // Get authenticated user
            user := c.MustGet(gin.AuthUserKey).(string)
            c.JSON(http.StatusOK, gin.H{
                "user":   user,
                "secret": "This is confidential data",
            })
        })
    }

    router.Run(":8080")
}
```

### CORS Middleware

Handle Cross-Origin Resource Sharing:

```go
func CORSMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
        c.Writer.Header().Set("Access-Control-Allow-Headers",
            "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
        c.Writer.Header().Set("Access-Control-Allow-Methods",
            "POST, OPTIONS, GET, PUT, DELETE, PATCH")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }

        c.Next()
    }
}

func main() {
    router := gin.Default()
    router.Use(CORSMiddleware())

    router.GET("/api/data", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"data": "accessible from any origin"})
    })

    router.Run(":8080")
}
```

## Request Binding and Validation

Gin provides powerful request binding that maps request data to Go structs with automatic validation.

### JSON Binding

```go
type CreateUserRequest struct {
    Username string `json:"username" binding:"required,min=3,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
    Age      int    `json:"age" binding:"required,gte=18,lte=120"`
}

func createUser(c *gin.Context) {
    var req CreateUserRequest

    // ShouldBindJSON returns error if binding fails
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
        })
        return
    }

    // Process the validated data
    c.JSON(http.StatusCreated, gin.H{
        "message":  "User created successfully",
        "username": req.Username,
    })
}
```

### XML Binding

```go
type XMLRequest struct {
    XMLName xml.Name `xml:"request"`
    Name    string   `xml:"name" binding:"required"`
    Value   int      `xml:"value" binding:"required,gt=0"`
}

func handleXML(c *gin.Context) {
    var req XMLRequest

    if err := c.ShouldBindXML(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "name":  req.Name,
        "value": req.Value,
    })
}
```

### Form Binding

```go
type LoginForm struct {
    Username string `form:"username" binding:"required"`
    Password string `form:"password" binding:"required"`
    Remember bool   `form:"remember"`
}

func login(c *gin.Context) {
    var form LoginForm

    // ShouldBind automatically detects content type
    if err := c.ShouldBind(&form); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message":  "Login successful",
        "remember": form.Remember,
    })
}
```

### Query String Binding

```go
type SearchParams struct {
    Query    string   `form:"q" binding:"required,min=1"`
    Page     int      `form:"page" binding:"omitempty,min=1"`
    Limit    int      `form:"limit" binding:"omitempty,min=1,max=100"`
    Sort     string   `form:"sort" binding:"omitempty,oneof=asc desc"`
    Tags     []string `form:"tags"`
}

func search(c *gin.Context) {
    var params SearchParams

    if err := c.ShouldBindQuery(&params); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Set defaults
    if params.Page == 0 {
        params.Page = 1
    }
    if params.Limit == 0 {
        params.Limit = 10
    }
    if params.Sort == "" {
        params.Sort = "desc"
    }

    c.JSON(http.StatusOK, gin.H{
        "params": params,
    })
}
```

### URI Binding

```go
type UserURI struct {
    ID   int    `uri:"id" binding:"required,min=1"`
    Slug string `uri:"slug" binding:"required"`
}

func getUser(c *gin.Context) {
    var uri UserURI

    if err := c.ShouldBindUri(&uri); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "id":   uri.ID,
        "slug": uri.Slug,
    })
}

func main() {
    router := gin.Default()
    router.GET("/users/:id/:slug", getUser)
    router.Run(":8080")
}
```

### Header Binding

```go
type HeaderParams struct {
    Authorization string `header:"Authorization" binding:"required"`
    ContentType   string `header:"Content-Type"`
    UserAgent     string `header:"User-Agent"`
}

func handleRequest(c *gin.Context) {
    var headers HeaderParams

    if err := c.ShouldBindHeader(&headers); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "user_agent": headers.UserAgent,
    })
}
```

### File Upload

```go
// Single file upload
func uploadFile(c *gin.Context) {
    file, err := c.FormFile("file")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
        return
    }

    // Check file size (e.g., max 10MB)
    if file.Size > 10<<20 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "File too large"})
        return
    }

    // Save the file
    filename := filepath.Base(file.Filename)
    dst := filepath.Join("./uploads", filename)

    if err := c.SaveUploadedFile(file, dst); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message":  "File uploaded successfully",
        "filename": filename,
        "size":     file.Size,
    })
}

// Multiple file upload
func uploadMultipleFiles(c *gin.Context) {
    form, err := c.MultipartForm()
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    files := form.File["files"]
    var uploaded []string

    for _, file := range files {
        filename := filepath.Base(file.Filename)
        dst := filepath.Join("./uploads", filename)

        if err := c.SaveUploadedFile(file, dst); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "Failed to save " + filename,
            })
            return
        }
        uploaded = append(uploaded, filename)
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "Files uploaded successfully",
        "files":   uploaded,
    })
}

func main() {
    router := gin.Default()

    // Set max multipart memory (default is 32 MiB)
    router.MaxMultipartMemory = 8 << 20 // 8 MiB

    router.POST("/upload", uploadFile)
    router.POST("/upload-multiple", uploadMultipleFiles)
    router.Run(":8080")
}
```

## Validation

Gin uses the `go-playground/validator` package for validation. Common validation tags and techniques:

### Common Validation Tags

```go
type Product struct {
    // Required fields
    Name string `json:"name" binding:"required"`

    // String length
    Description string `json:"description" binding:"min=10,max=1000"`

    // Numeric constraints
    Price    float64 `json:"price" binding:"required,gt=0"`
    Quantity int     `json:"quantity" binding:"required,gte=0,lte=10000"`

    // Email validation
    ContactEmail string `json:"contact_email" binding:"omitempty,email"`

    // URL validation
    Website string `json:"website" binding:"omitempty,url"`

    // Enum validation
    Category string `json:"category" binding:"required,oneof=electronics clothing food furniture"`

    // UUID validation
    SKU string `json:"sku" binding:"required,uuid"`

    // Date/time validation
    ExpiresAt string `json:"expires_at" binding:"omitempty,datetime=2006-01-02"`

    // Array validation
    Tags []string `json:"tags" binding:"required,min=1,max=5,dive,min=2,max=30"`

    // Nested struct
    Dimensions Dimensions `json:"dimensions" binding:"required,dive"`

    // Conditional validation
    DiscountCode string `json:"discount_code" binding:"required_if=HasDiscount true"`
    HasDiscount  bool   `json:"has_discount"`
}

type Dimensions struct {
    Length float64 `json:"length" binding:"required,gt=0"`
    Width  float64 `json:"width" binding:"required,gt=0"`
    Height float64 `json:"height" binding:"required,gt=0"`
    Unit   string  `json:"unit" binding:"required,oneof=cm inch m"`
}
```

### Custom Validators

Register custom validation functions:

```go
import (
    "regexp"

    "github.com/gin-gonic/gin/binding"
    "github.com/go-playground/validator/v10"
)

// Custom validator for usernames
func isValidUsername(fl validator.FieldLevel) bool {
    username := fl.Field().String()
    // Only alphanumeric and underscores, 3-30 characters
    matched, _ := regexp.MatchString(`^[a-zA-Z0-9_]{3,30}$`, username)
    return matched
}

// Custom validator for phone numbers
func isValidPhone(fl validator.FieldLevel) bool {
    phone := fl.Field().String()
    matched, _ := regexp.MatchString(`^\+?[1-9]\d{1,14}$`, phone)
    return matched
}

func main() {
    router := gin.Default()

    // Register custom validators
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterValidation("username", isValidUsername)
        v.RegisterValidation("phone", isValidPhone)
    }

    router.POST("/register", func(c *gin.Context) {
        var req struct {
            Username string `json:"username" binding:"required,username"`
            Phone    string `json:"phone" binding:"required,phone"`
        }

        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        c.JSON(http.StatusOK, gin.H{"message": "Valid input"})
    })

    router.Run(":8080")
}
```

### Custom Error Messages

Provide user-friendly validation error messages:

```go
import "github.com/go-playground/validator/v10"

func formatValidationErrors(err error) map[string]string {
    errors := make(map[string]string)

    if validationErrors, ok := err.(validator.ValidationErrors); ok {
        for _, e := range validationErrors {
            field := strings.ToLower(e.Field())

            switch e.Tag() {
            case "required":
                errors[field] = fmt.Sprintf("%s is required", field)
            case "email":
                errors[field] = fmt.Sprintf("%s must be a valid email address", field)
            case "min":
                if e.Kind() == reflect.String {
                    errors[field] = fmt.Sprintf("%s must be at least %s characters", field, e.Param())
                } else {
                    errors[field] = fmt.Sprintf("%s must be at least %s", field, e.Param())
                }
            case "max":
                if e.Kind() == reflect.String {
                    errors[field] = fmt.Sprintf("%s must be at most %s characters", field, e.Param())
                } else {
                    errors[field] = fmt.Sprintf("%s must be at most %s", field, e.Param())
                }
            case "oneof":
                errors[field] = fmt.Sprintf("%s must be one of: %s", field, e.Param())
            case "gt":
                errors[field] = fmt.Sprintf("%s must be greater than %s", field, e.Param())
            case "gte":
                errors[field] = fmt.Sprintf("%s must be greater than or equal to %s", field, e.Param())
            case "lt":
                errors[field] = fmt.Sprintf("%s must be less than %s", field, e.Param())
            case "lte":
                errors[field] = fmt.Sprintf("%s must be less than or equal to %s", field, e.Param())
            default:
                errors[field] = fmt.Sprintf("%s is invalid", field)
            }
        }
    }

    return errors
}

func createUser(c *gin.Context) {
    var req CreateUserRequest

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "message": "Validation failed",
            "errors":  formatValidationErrors(err),
        })
        return
    }

    c.JSON(http.StatusCreated, gin.H{"message": "User created"})
}
```

## Response Handling

Gin provides multiple methods for sending responses in various formats.

### JSON Responses

```go
func main() {
    router := gin.Default()

    // Using gin.H (shortcut for map[string]interface{})
    router.GET("/json1", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "success",
            "data": gin.H{
                "id":   1,
                "name": "John Doe",
            },
        })
    })

    // Using struct
    router.GET("/json2", func(c *gin.Context) {
        type Response struct {
            Success bool        `json:"success"`
            Data    interface{} `json:"data"`
        }

        c.JSON(http.StatusOK, Response{
            Success: true,
            Data:    map[string]string{"name": "John"},
        })
    })

    // Indented JSON (development/debugging)
    router.GET("/json3", func(c *gin.Context) {
        c.IndentedJSON(http.StatusOK, gin.H{
            "formatted": true,
            "data":      []int{1, 2, 3},
        })
    })

    // SecureJSON (prevents JSON hijacking)
    router.GET("/json4", func(c *gin.Context) {
        c.SecureJSON(http.StatusOK, gin.H{
            "data": "sensitive",
        })
    })

    // PureJSON (doesn't escape HTML characters)
    router.GET("/json5", func(c *gin.Context) {
        c.PureJSON(http.StatusOK, gin.H{
            "html": "<b>Hello, world!</b>",
        })
    })

    // JSONP (with callback)
    router.GET("/jsonp", func(c *gin.Context) {
        c.JSONP(http.StatusOK, gin.H{
            "data": "value",
        })
        // Response: callback({"data":"value"}) if ?callback=callback
    })

    router.Run(":8080")
}
```

### XML Responses

```go
type User struct {
    XMLName xml.Name `xml:"user"`
    ID      int      `xml:"id"`
    Name    string   `xml:"name"`
    Email   string   `xml:"email"`
}

func main() {
    router := gin.Default()

    router.GET("/xml", func(c *gin.Context) {
        user := User{
            ID:    1,
            Name:  "John Doe",
            Email: "john@example.com",
        }
        c.XML(http.StatusOK, user)
    })

    router.Run(":8080")
}
```

### HTML Template Responses

```go
func main() {
    router := gin.Default()

    // Load templates from directory
    router.LoadHTMLGlob("templates/*")
    // Or load specific files
    // router.LoadHTMLFiles("templates/index.html", "templates/about.html")

    router.GET("/", func(c *gin.Context) {
        c.HTML(http.StatusOK, "index.html", gin.H{
            "title": "Home Page",
            "user":  "John",
        })
    })

    // Serve static files
    router.Static("/assets", "./assets")
    router.StaticFS("/static", http.Dir("./static"))
    router.StaticFile("/favicon.ico", "./resources/favicon.ico")

    router.Run(":8080")
}
```

### File Responses

```go
func main() {
    router := gin.Default()

    // Serve a file
    router.GET("/file", func(c *gin.Context) {
        c.File("./documents/report.pdf")
    })

    // Serve file with custom download name
    router.GET("/download", func(c *gin.Context) {
        c.FileAttachment("./documents/report.pdf", "monthly-report.pdf")
    })

    // Serve from file system
    router.GET("/data/:filename", func(c *gin.Context) {
        filename := c.Param("filename")
        c.FileFromFS(filename, http.Dir("./data"))
    })

    router.Run(":8080")
}
```

### String and Data Responses

```go
func main() {
    router := gin.Default()

    // Plain text
    router.GET("/text", func(c *gin.Context) {
        c.String(http.StatusOK, "Hello, %s!", "World")
    })

    // Raw bytes
    router.GET("/data", func(c *gin.Context) {
        data := []byte{0x48, 0x65, 0x6c, 0x6c, 0x6f}
        c.Data(http.StatusOK, "application/octet-stream", data)
    })

    // Reader (streaming)
    router.GET("/stream", func(c *gin.Context) {
        file, _ := os.Open("large-file.zip")
        defer file.Close()

        fileInfo, _ := file.Stat()
        c.DataFromReader(http.StatusOK, fileInfo.Size(), "application/zip", file, nil)
    })

    router.Run(":8080")
}
```

### Redirects

```go
func main() {
    router := gin.Default()

    // HTTP redirect
    router.GET("/redirect", func(c *gin.Context) {
        c.Redirect(http.StatusMovedPermanently, "https://example.com")
    })

    // Temporary redirect
    router.GET("/temp-redirect", func(c *gin.Context) {
        c.Redirect(http.StatusTemporaryRedirect, "/new-location")
    })

    // Internal redirect (router redirect)
    router.GET("/internal", func(c *gin.Context) {
        c.Request.URL.Path = "/destination"
        router.HandleContext(c)
    })

    router.GET("/destination", func(c *gin.Context) {
        c.String(http.StatusOK, "You were redirected here")
    })

    router.Run(":8080")
}
```

### Streaming Responses

```go
func main() {
    router := gin.Default()

    // Server-Sent Events (SSE)
    router.GET("/events", func(c *gin.Context) {
        c.Header("Content-Type", "text/event-stream")
        c.Header("Cache-Control", "no-cache")
        c.Header("Connection", "keep-alive")

        c.Stream(func(w io.Writer) bool {
            for i := 0; i < 10; i++ {
                c.SSEvent("message", gin.H{
                    "count": i,
                    "time":  time.Now().Format(time.RFC3339),
                })
                time.Sleep(time.Second)
            }
            return false
        })
    })

    router.Run(":8080")
}
```

## Error Handling

Gin provides several mechanisms for handling errors gracefully.

### Basic Error Responses

```go
func getUser(c *gin.Context) {
    id := c.Param("id")

    user, err := userService.FindByID(id)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            c.JSON(http.StatusNotFound, gin.H{
                "error": "User not found",
            })
            return
        }

        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Internal server error",
        })
        return
    }

    c.JSON(http.StatusOK, user)
}
```

### Using c.Error() and Error Middleware

```go
import (
    "errors"
    "net/http"

    "github.com/gin-gonic/gin"
)

// ErrorHandler middleware captures and formats errors
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()

        // Check for errors after request processing
        if len(c.Errors) > 0 {
            err := c.Errors.Last().Err

            c.JSON(http.StatusInternalServerError, gin.H{
                "success": false,
                "message": err.Error(),
            })
        }
    }
}

func main() {
    router := gin.Default()
    router.Use(ErrorHandler())

    router.GET("/ok", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "success": true,
            "message": "Everything is fine!",
        })
    })

    router.GET("/error", func(c *gin.Context) {
        // Add error to context
        c.Error(errors.New("something went wrong"))
    })

    router.Run(":8080")
}
```

### Custom Error Types

```go
type AppError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}

func (e *AppError) Error() string {
    return e.Message
}

// Predefined errors
var (
    ErrNotFound = &AppError{
        Code:    404,
        Message: "Resource not found",
    }
    ErrUnauthorized = &AppError{
        Code:    401,
        Message: "Unauthorized access",
    }
    ErrBadRequest = &AppError{
        Code:    400,
        Message: "Invalid request",
    }
    ErrForbidden = &AppError{
        Code:    403,
        Message: "Access forbidden",
    }
)

// Error handler that understands AppError
func AppErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()

        if len(c.Errors) > 0 {
            err := c.Errors.Last().Err

            switch e := err.(type) {
            case *AppError:
                c.JSON(e.Code, gin.H{
                    "success": false,
                    "error":   e,
                })
            default:
                c.JSON(http.StatusInternalServerError, gin.H{
                    "success": false,
                    "error": AppError{
                        Code:    500,
                        Message: "Internal server error",
                    },
                })
            }
        }
    }
}

func getUserHandler(c *gin.Context) {
    id := c.Param("id")

    user, err := userService.FindByID(id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            c.Error(ErrNotFound)
            c.Abort()
            return
        }
        c.Error(err)
        c.Abort()
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    user,
    })
}
```

### Panic Recovery

Gin's recovery middleware catches panics and returns a 500 error:

```go
func main() {
    // gin.Default() includes recovery middleware
    router := gin.Default()

    router.GET("/panic", func(c *gin.Context) {
        panic("Something went terribly wrong!")
    })

    // Custom recovery handler
    router = gin.New()
    router.Use(gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
        if err, ok := recovered.(string); ok {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error":   "Internal server error",
                "message": err,
            })
        }
        c.AbortWithStatus(http.StatusInternalServerError)
    }))

    router.Run(":8080")
}
```

## Complete REST API Example

A complete example demonstrating all concepts together:

```go
package main

import (
    "errors"
    "net/http"
    "strconv"
    "sync"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
)

// Models
type User struct {
    ID        int       `json:"id"`
    Username  string    `json:"username"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type CreateUserRequest struct {
    Username string `json:"username" binding:"required,min=3,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
}

type UpdateUserRequest struct {
    Username string `json:"username" binding:"omitempty,min=3,max=50"`
    Email    string `json:"email" binding:"omitempty,email"`
}

// In-memory storage (replace with database in production)
var (
    users   = make(map[int]*User)
    usersMu sync.RWMutex
    nextID  = 1
)

// Error types
type APIError struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Details interface{} `json:"details,omitempty"`
}

func (e *APIError) Error() string {
    return e.Message
}

var (
    ErrNotFound   = &APIError{Code: 404, Message: "Resource not found"}
    ErrBadRequest = &APIError{Code: 400, Message: "Invalid request"}
)

// Middleware
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()

        if len(c.Errors) > 0 {
            err := c.Errors.Last().Err

            switch e := err.(type) {
            case *APIError:
                c.JSON(e.Code, gin.H{"success": false, "error": e})
            case validator.ValidationErrors:
                c.JSON(http.StatusBadRequest, gin.H{
                    "success": false,
                    "error": APIError{
                        Code:    400,
                        Message: "Validation failed",
                        Details: formatValidationErrors(e),
                    },
                })
            default:
                c.JSON(http.StatusInternalServerError, gin.H{
                    "success": false,
                    "error":   APIError{Code: 500, Message: "Internal server error"},
                })
            }
        }
    }
}

func formatValidationErrors(errs validator.ValidationErrors) map[string]string {
    result := make(map[string]string)
    for _, e := range errs {
        result[e.Field()] = e.Error()
    }
    return result
}

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

func RequestLogger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()

        c.Next()

        duration := time.Since(start)
        gin.DefaultWriter.Write([]byte(
            c.Request.Method + " " +
                c.Request.URL.Path + " " +
                strconv.Itoa(c.Writer.Status()) + " " +
                duration.String() + "\n",
        ))
    }
}

// Handlers
func listUsers(c *gin.Context) {
    usersMu.RLock()
    defer usersMu.RUnlock()

    result := make([]*User, 0, len(users))
    for _, user := range users {
        result = append(result, user)
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    result,
        "total":   len(result),
    })
}

func getUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.Error(&APIError{Code: 400, Message: "Invalid user ID"})
        c.Abort()
        return
    }

    usersMu.RLock()
    user, exists := users[id]
    usersMu.RUnlock()

    if !exists {
        c.Error(ErrNotFound)
        c.Abort()
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    user,
    })
}

func createUser(c *gin.Context) {
    var req CreateUserRequest

    if err := c.ShouldBindJSON(&req); err != nil {
        c.Error(err)
        c.Abort()
        return
    }

    usersMu.Lock()
    user := &User{
        ID:        nextID,
        Username:  req.Username,
        Email:     req.Email,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    users[nextID] = user
    nextID++
    usersMu.Unlock()

    c.JSON(http.StatusCreated, gin.H{
        "success": true,
        "data":    user,
    })
}

func updateUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.Error(&APIError{Code: 400, Message: "Invalid user ID"})
        c.Abort()
        return
    }

    var req UpdateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.Error(err)
        c.Abort()
        return
    }

    usersMu.Lock()
    user, exists := users[id]
    if !exists {
        usersMu.Unlock()
        c.Error(ErrNotFound)
        c.Abort()
        return
    }

    if req.Username != "" {
        user.Username = req.Username
    }
    if req.Email != "" {
        user.Email = req.Email
    }
    user.UpdatedAt = time.Now()
    usersMu.Unlock()

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    user,
    })
}

func deleteUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.Error(&APIError{Code: 400, Message: "Invalid user ID"})
        c.Abort()
        return
    }

    usersMu.Lock()
    _, exists := users[id]
    if !exists {
        usersMu.Unlock()
        c.Error(ErrNotFound)
        c.Abort()
        return
    }
    delete(users, id)
    usersMu.Unlock()

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "message": "User deleted successfully",
    })
}

func main() {
    // Set Gin mode (debug, release, test)
    gin.SetMode(gin.ReleaseMode)

    router := gin.New()

    // Global middleware
    router.Use(gin.Recovery())
    router.Use(RequestLogger())
    router.Use(CORSMiddleware())
    router.Use(ErrorHandler())

    // Health check
    router.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "status": "healthy",
            "time":   time.Now().Format(time.RFC3339),
        })
    })

    // API routes
    api := router.Group("/api/v1")
    {
        users := api.Group("/users")
        {
            users.GET("", listUsers)
            users.GET("/:id", getUser)
            users.POST("", createUser)
            users.PUT("/:id", updateUser)
            users.DELETE("/:id", deleteUser)
        }
    }

    // Start server
    router.Run(":8080")
}
```

## Best Practices

### Use Appropriate Router Initialization

```go
// Development: includes logger and recovery
router := gin.Default()

// Production: explicit middleware for full control
router := gin.New()
router.Use(CustomLogger())
router.Use(gin.Recovery())
```

### Organize Routes with Groups

```go
func setupRoutes(router *gin.Engine) {
    // Public routes
    public := router.Group("/api")
    {
        public.POST("/login", loginHandler)
        public.POST("/register", registerHandler)
    }

    // Protected routes
    protected := router.Group("/api")
    protected.Use(AuthMiddleware())
    {
        protected.GET("/profile", profileHandler)
        protected.PUT("/profile", updateProfileHandler)
    }

    // Admin routes
    admin := router.Group("/api/admin")
    admin.Use(AuthMiddleware(), AdminMiddleware())
    {
        admin.GET("/users", listAllUsersHandler)
        admin.DELETE("/users/:id", deleteUserHandler)
    }
}
```

### Limit Request Size

```go
func main() {
    router := gin.Default()

    // Limit multipart form memory
    router.MaxMultipartMemory = 8 << 20 // 8 MiB

    // Custom body size limit middleware
    router.Use(func(c *gin.Context) {
        c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 10<<20) // 10 MiB
        c.Next()
    })

    router.Run(":8080")
}
```

### Implement Graceful Shutdown

```go
func main() {
    router := gin.Default()
    setupRoutes(router)

    srv := &http.Server{
        Addr:         ":8080",
        Handler:      router,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Start server in goroutine
    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("listen: %s\n", err)
        }
    }()

    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("Shutting down server...")

    // Give outstanding requests 5 seconds to complete
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }

    log.Println("Server exiting")
}
```

### Use Structured Logging

```go
import "go.uber.org/zap"

func StructuredLogger(logger *zap.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        query := c.Request.URL.RawQuery

        c.Next()

        logger.Info("request",
            zap.Int("status", c.Writer.Status()),
            zap.String("method", c.Request.Method),
            zap.String("path", path),
            zap.String("query", query),
            zap.String("ip", c.ClientIP()),
            zap.Duration("latency", time.Since(start)),
            zap.Int("size", c.Writer.Size()),
        )
    }
}
```

### Test Your Handlers

```go
import (
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func TestGetUser(t *testing.T) {
    gin.SetMode(gin.TestMode)

    router := gin.Default()
    router.GET("/users/:id", getUser)

    // Create test request
    req, _ := http.NewRequest("GET", "/users/1", nil)
    w := httptest.NewRecorder()

    router.ServeHTTP(w, req)

    assert.Equal(t, http.StatusOK, w.Code)
    assert.Contains(t, w.Body.String(), "success")
}

func TestCreateUser(t *testing.T) {
    gin.SetMode(gin.TestMode)

    router := gin.Default()
    router.POST("/users", createUser)

    body := `{"username":"john","email":"john@example.com","password":"secret123"}`
    req, _ := http.NewRequest("POST", "/users", strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")

    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)

    assert.Equal(t, http.StatusCreated, w.Code)
}
```

## Conclusion

Gin is a powerful, high-performance web framework for Go that provides everything needed to build production-ready web applications and APIs. Its intuitive API, comprehensive middleware system, robust validation capabilities, and excellent performance make it an ideal choice for building modern web services.

Key takeaways:
- Use `gin.Default()` for development and `gin.New()` with explicit middleware for production
- Leverage route groups for organizing code and applying middleware selectively
- Always validate user input using binding tags and custom validators
- Implement centralized error handling with custom error types
- Follow best practices for graceful shutdown, logging, and testing

With proper understanding of Gin's features and best practices, you can build scalable, maintainable, and high-performance web applications in Go.
