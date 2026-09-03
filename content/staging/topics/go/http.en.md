---
title: HTTP Services
description: Complete Guide to Go HTTP Services, net/http Package, Routing and Middleware
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - HTTP
  - Web
  - Server
status: imported
origin: old/src/content/docs/go/http.en.md
divergence: 0.212
issues: []
legacy:
  category: Go
  subcategory: Web Development
  order: 13
  lastUpdated: 2026-01-07
---

Go's `net/http` package provides complete functionality for building HTTP servers and clients. It is designed to be simple, performant, and serves as the foundation for web development in the Go ecosystem. Whether building simple API services or complex web applications, `net/http` can meet your needs.

## net/http Package Overview

The core components of the `net/http` package include:

- **Server**: HTTP server that handles incoming requests
- **Client**: HTTP client that sends requests to other services
- **Handler**: Request handling interface that defines how to handle requests
- **ServeMux**: Router multiplexer that routes requests to corresponding handlers
- **Request/Response**: Data structures for requests and responses

## Creating a Basic HTTP Server

### The Simplest Server

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    // Register handler function
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World!")
    })

    // Start server
    fmt.Println("Server starting at http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

### Using a Custom Server

```go
package main

import (
    "fmt"
    "net/http"
    "time"
)

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World!")
    })

    // Create custom server configuration
    server := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    fmt.Println("Server starting at http://localhost:8080")
    if err := server.ListenAndServe(); err != nil {
        fmt.Printf("Server failed to start: %v
", err)
    }
}
```

## Handler Interface Explained

### Handler Interface Definition

```go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}
```

Any type that implements the `ServeHTTP` method can serve as an HTTP handler.

### Custom Handler

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "sync/atomic"
)

// Visit counter
type CounterHandler struct {
    count int64
}

func (h *CounterHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    newCount := atomic.AddInt64(&h.count, 1)
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]int64{
        "visits": newCount,
    })
}

// Health check handler
type HealthHandler struct {
    serviceName string
}

func (h *HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status":  "healthy",
        "service": h.serviceName,
    })
}

func main() {
    counter := &CounterHandler{}
    health := &HealthHandler{serviceName: "my-api"}

    http.Handle("/counter", counter)
    http.Handle("/health", health)

    fmt.Println("Server starting at http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

### HandlerFunc Adapter

`HandlerFunc` is a function type that implements the `Handler` interface, allowing regular functions to be used as handlers.

```go
package main

import (
    "fmt"
    "net/http"
)

// Regular function
func helloHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello from handler function!")
}

func main() {
    // Method 1: Using HandleFunc
    http.HandleFunc("/hello1", helloHandler)

    // Method 2: Using Handle + HandlerFunc type conversion
    http.Handle("/hello2", http.HandlerFunc(helloHandler))

    // Method 3: Using anonymous function directly
    http.HandleFunc("/hello3", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello from anonymous function!")
    })

    http.ListenAndServe(":8080", nil)
}
```

## ServeMux Routing

### Default Router

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    // Using default DefaultServeMux
    http.HandleFunc("/", homeHandler)
    http.HandleFunc("/about", aboutHandler)
    http.HandleFunc("/contact", contactHandler)

    http.ListenAndServe(":8080", nil)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    // "/" matches all unmatched paths
    if r.URL.Path != "/" {
        http.NotFound(w, r)
        return
    }
    fmt.Fprintf(w, "Home")
}

func aboutHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "About Us")
}

func contactHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Contact Us")
}
```

### Custom ServeMux

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    // Create custom router
    mux := http.NewServeMux()

    // Exact match
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        if r.URL.Path != "/" {
            http.NotFound(w, r)
            return
        }
        fmt.Fprintf(w, "Home")
    })

    // Prefix match (note the trailing slash)
    mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "API Path: %s", r.URL.Path)
    })

    // Exact match
    mux.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "User List")
    })

    http.ListenAndServe(":8080", mux)
}
```

### Go 1.22+ Enhanced Routing

Go 1.22 introduced enhanced routing patterns with support for HTTP methods and path parameters.

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // Specify HTTP method
    mux.HandleFunc("GET /users", listUsers)
    mux.HandleFunc("POST /users", createUser)

    // Path parameters
    mux.HandleFunc("GET /users/{id}", getUser)
    mux.HandleFunc("PUT /users/{id}", updateUser)
    mux.HandleFunc("DELETE /users/{id}", deleteUser)

    // Wildcard parameter (matches remaining path)
    mux.HandleFunc("GET /files/{path...}", serveFiles)

    // Exact match root path
    mux.HandleFunc("GET /{\$}", home)

    fmt.Println("Server starting at http://localhost:8080")
    http.ListenAndServe(":8080", mux)
}

func listUsers(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Get user list")
}

func createUser(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Create user")
}

func getUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    fmt.Fprintf(w, "Get user: %s", id)
}

func updateUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    fmt.Fprintf(w, "Update user: %s", id)
}

func deleteUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    fmt.Fprintf(w, "Delete user: %s", id)
}

func serveFiles(w http.ResponseWriter, r *http.Request) {
    path := r.PathValue("path")
    fmt.Fprintf(w, "Requested file: %s", path)
}

func home(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Home")
}
```

## Request Handling

### Parsing Request Information

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func requestInfoHandler(w http.ResponseWriter, r *http.Request) {
    // Request method
    method := r.Method

    // URL information
    path := r.URL.Path
    rawQuery := r.URL.RawQuery

    // Query parameters
    name := r.URL.Query().Get("name")
    ages := r.URL.Query()["age"] // Multi-value parameter

    // Request headers
    userAgent := r.Header.Get("User-Agent")
    contentType := r.Header.Get("Content-Type")

    // Client information
    remoteAddr := r.RemoteAddr
    host := r.Host

    // Build response
    info := map[string]interface{}{
        "method":       method,
        "path":         path,
        "raw_query":    rawQuery,
        "name":         name,
        "ages":         ages,
        "user_agent":   userAgent,
        "content_type": contentType,
        "remote_addr":  remoteAddr,
        "host":         host,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(info)
}

func main() {
    http.HandleFunc("/info", requestInfoHandler)
    http.ListenAndServe(":8080", nil)
}
```

### Parsing Request Body

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

type User struct {
    Name  string `json:"name"`
    Email string `json:"email"`
    Age   int    `json:"age"`
}

// JSON request body
func createUserJSON(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Only POST method is supported", http.StatusMethodNotAllowed)
        return
    }

    // Limit request body size
    r.Body = http.MaxBytesReader(w, r.Body, 1024*1024) // 1MB

    var user User
    decoder := json.NewDecoder(r.Body)
    decoder.DisallowUnknownFields() // Disallow unknown fields

    if err := decoder.Decode(&user); err != nil {
        http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
        return
    }

    // Validate data
    if user.Name == "" {
        http.Error(w, "Name cannot be empty", http.StatusBadRequest)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "User created successfully",
        "user":    user,
    })
}

// Form request body
func createUserForm(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Only POST method is supported", http.StatusMethodNotAllowed)
        return
    }

    // Parse form
    if err := r.ParseForm(); err != nil {
        http.Error(w, "Form parsing failed", http.StatusBadRequest)
        return
    }

    name := r.FormValue("name")
    email := r.FormValue("email")

    fmt.Fprintf(w, "Create user: %s <%s>", name, email)
}

// Raw request body
func rawBodyHandler(w http.ResponseWriter, r *http.Request) {
    body, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Failed to read request body", http.StatusInternalServerError)
        return
    }
    defer r.Body.Close()

    fmt.Fprintf(w, "Received %d bytes of data", len(body))
}

func main() {
    http.HandleFunc("/users/json", createUserJSON)
    http.HandleFunc("/users/form", createUserForm)
    http.HandleFunc("/raw", rawBodyHandler)
    http.ListenAndServe(":8080", nil)
}
```

### File Upload

```go
package main

import (
    "fmt"
    "io"
    "net/http"
    "os"
    "path/filepath"
)

func uploadHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Only POST method is supported", http.StatusMethodNotAllowed)
        return
    }

    // Limit upload size to 10MB
    r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

    // Parse multipart form
    if err := r.ParseMultipartForm(10 << 20); err != nil {
        http.Error(w, "File too large or parsing failed", http.StatusBadRequest)
        return
    }

    // Get uploaded file
    file, header, err := r.FormFile("file")
    if err != nil {
        http.Error(w, "Failed to get file: "+err.Error(), http.StatusBadRequest)
        return
    }
    defer file.Close()

    // Validate file type
    buffer := make([]byte, 512)
    _, err = file.Read(buffer)
    if err != nil {
        http.Error(w, "Failed to read file", http.StatusInternalServerError)
        return
    }
    file.Seek(0, 0) // Reset read position

    contentType := http.DetectContentType(buffer)
    allowedTypes := map[string]bool{
        "image/jpeg": true,
        "image/png":  true,
        "image/gif":  true,
    }
    if !allowedTypes[contentType] {
        http.Error(w, "Unsupported file type: "+contentType, http.StatusBadRequest)
        return
    }

    // Create upload directory
    uploadDir := "./uploads"
    if err := os.MkdirAll(uploadDir, 0755); err != nil {
        http.Error(w, "Failed to create directory", http.StatusInternalServerError)
        return
    }

    // Save file
    filename := filepath.Base(header.Filename)
    dst, err := os.Create(filepath.Join(uploadDir, filename))
    if err != nil {
        http.Error(w, "Failed to create file", http.StatusInternalServerError)
        return
    }
    defer dst.Close()

    written, err := io.Copy(dst, file)
    if err != nil {
        http.Error(w, "Failed to save file", http.StatusInternalServerError)
        return
    }

    fmt.Fprintf(w, "File uploaded successfully: %s (%d bytes)", filename, written)
}

// Multiple file upload
func multiUploadHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Only POST method is supported", http.StatusMethodNotAllowed)
        return
    }

    r.ParseMultipartForm(32 << 20) // 32MB

    files := r.MultipartForm.File["files"]
    var uploaded []string

    for _, fileHeader := range files {
        file, err := fileHeader.Open()
        if err != nil {
            continue
        }
        defer file.Close()

        dst, err := os.Create(filepath.Join("./uploads", fileHeader.Filename))
        if err != nil {
            continue
        }
        defer dst.Close()

        io.Copy(dst, file)
        uploaded = append(uploaded, fileHeader.Filename)
    }

    fmt.Fprintf(w, "Successfully uploaded %d files: %v", len(uploaded), uploaded)
}

func main() {
    http.HandleFunc("/upload", uploadHandler)
    http.HandleFunc("/upload-multi", multiUploadHandler)
    fmt.Println("Server starting at http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

## Response Handling

### Setting Response Headers and Status Codes

```go
package main

import (
    "encoding/json"
    "net/http"
)

func responseHandler(w http.ResponseWriter, r *http.Request) {
    // Set response headers (must be before WriteHeader)
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("X-Custom-Header", "custom-value")
    w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

    // Add multi-value response headers
    w.Header().Add("Set-Cookie", "session=abc123; Path=/")
    w.Header().Add("Set-Cookie", "user=john; Path=/")

    // Set status code
    w.WriteHeader(http.StatusOK)

    // Write response body
    json.NewEncoder(w).Encode(map[string]string{
        "status": "success",
    })
}

func errorHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusNotFound)
    json.NewEncoder(w).Encode(map[string]string{
        "error": "Resource not found",
    })
}

func redirectHandler(w http.ResponseWriter, r *http.Request) {
    http.Redirect(w, r, "/new-location", http.StatusMovedPermanently)
}

func main() {
    http.HandleFunc("/response", responseHandler)
    http.HandleFunc("/error", errorHandler)
    http.HandleFunc("/redirect", redirectHandler)
    http.ListenAndServe(":8080", nil)
}
```

### Different Types of Responses

```go
package main

import (
    "encoding/json"
    "encoding/xml"
    "html/template"
    "net/http"
)

type User struct {
    XMLName xml.Name `xml:"user" json:"-"`
    ID      int      `json:"id" xml:"id"`
    Name    string   `json:"name" xml:"name"`
    Email   string   `json:"email" xml:"email"`
}

// JSON response
func jsonResponse(w http.ResponseWriter, r *http.Request) {
    user := User{ID: 1, Name: "John Doe", Email: "john@example.com"}

    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    json.NewEncoder(w).Encode(user)
}

// XML response
func xmlResponse(w http.ResponseWriter, r *http.Request) {
    user := User{ID: 1, Name: "John Doe", Email: "john@example.com"}

    w.Header().Set("Content-Type", "application/xml; charset=utf-8")
    xml.NewEncoder(w).Encode(user)
}

// HTML response
func htmlResponse(w http.ResponseWriter, r *http.Request) {
    tmpl := `
    <!DOCTYPE html>
    <html>
    <head><title>User Info</title></head>
    <body>
        <h1>User: {{.Name}}</h1>
        <p>Email: {{.Email}}</p>
    </body>
    </html>
    `
    t := template.Must(template.New("user").Parse(tmpl))
    user := User{ID: 1, Name: "John Doe", Email: "john@example.com"}

    w.Header().Set("Content-Type", "text/html; charset=utf-8")
    t.Execute(w, user)
}

// File download
func fileDownload(w http.ResponseWriter, r *http.Request) {
    content := "This is the file content..."

    w.Header().Set("Content-Type", "application/octet-stream")
    w.Header().Set("Content-Disposition", "attachment; filename="download.txt"")
    w.Write([]byte(content))
}

func main() {
    http.HandleFunc("/json", jsonResponse)
    http.HandleFunc("/xml", xmlResponse)
    http.HandleFunc("/html", htmlResponse)
    http.HandleFunc("/download", fileDownload)
    http.ListenAndServe(":8080", nil)
}
```

### Streaming Responses

```go
package main

import (
    "fmt"
    "net/http"
    "time"
)

// Server-Sent Events
func sseHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")

    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming not supported", http.StatusInternalServerError)
        return
    }

    for i := 0; i < 10; i++ {
        select {
        case <-r.Context().Done():
            return
        default:
            fmt.Fprintf(w, "data: Message %d - %s

", i, time.Now().Format(time.RFC3339))
            flusher.Flush()
            time.Sleep(1 * time.Second)
        }
    }
}

// Chunked transfer
func chunkedHandler(w http.ResponseWriter, r *http.Request) {
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming not supported", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Transfer-Encoding", "chunked")
    w.Header().Set("Content-Type", "text/plain")

    for i := 0; i < 5; i++ {
        fmt.Fprintf(w, "Chunk %d: %s
", i, time.Now().Format(time.RFC3339))
        flusher.Flush()
        time.Sleep(500 * time.Millisecond)
    }
}

func main() {
    http.HandleFunc("/sse", sseHandler)
    http.HandleFunc("/chunked", chunkedHandler)
    fmt.Println("Server starting at http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

## Middleware Pattern

Middleware are functions that execute before and after request handling, used to implement cross-cutting concerns like logging, authentication, rate limiting, etc.

### Basic Middleware

```go
package main

import (
    "fmt"
    "log"
    "net/http"
    "time"
)

// Middleware type definition
type Middleware func(http.Handler) http.Handler

// Logging middleware
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // Create wrapped ResponseWriter to capture status code
        wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

        // Call next handler
        next.ServeHTTP(wrapped, r)

        // Log request information
        log.Printf(
            "%s %s %d %v",
            r.Method,
            r.URL.Path,
            wrapped.statusCode,
            time.Since(start),
        )
    })
}

type responseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
    rw.statusCode = code
    rw.ResponseWriter.WriteHeader(code)
}

// Recovery middleware
func RecoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic recovered: %v", err)
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}

// Request ID middleware
func RequestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := fmt.Sprintf("req-%d", time.Now().UnixNano())
        w.Header().Set("X-Request-ID", requestID)

        // Add request ID to request context
        ctx := r.Context()
        // Can use context.WithValue to pass
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World!")
    })

    mux.HandleFunc("/panic", func(w http.ResponseWriter, r *http.Request) {
        panic("Intentionally triggered panic")
    })

    // Apply middleware (from inside to outside)
    handler := LoggingMiddleware(RecoveryMiddleware(RequestIDMiddleware(mux)))

    fmt.Println("Server starting at http://localhost:8080")
    http.ListenAndServe(":8080", handler)
}
```

### Middleware Chain

```go
package main

import (
    "fmt"
    "log"
    "net/http"
    "strings"
    "time"
)

type Middleware func(http.Handler) http.Handler

// Chain chains multiple middlewares together
func Chain(middlewares ...Middleware) Middleware {
    return func(final http.Handler) http.Handler {
        for i := len(middlewares) - 1; i >= 0; i-- {
            final = middlewares[i](final)
        }
        return final
    }
}

// Various middlewares
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        log.Printf("Starting %s %s", r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
        log.Printf("Completed %s %s in %v", r.Method, r.URL.Path, time.Since(start))
    })
}

func CORSMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusOK)
            return
        }

        next.ServeHTTP(w, r)
    })
}

func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")

        if token == "" {
            http.Error(w, "No authentication token provided", http.StatusUnauthorized)
            return
        }

        if !strings.HasPrefix(token, "Bearer ") {
            http.Error(w, "Invalid token format", http.StatusUnauthorized)
            return
        }

        // Validate token...
        next.ServeHTTP(w, r)
    })
}

func RateLimitMiddleware(requestsPerSecond int) Middleware {
    ticker := time.NewTicker(time.Second / time.Duration(requestsPerSecond))
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            select {
            case <-ticker.C:
                next.ServeHTTP(w, r)
            default:
                http.Error(w, "Too many requests", http.StatusTooManyRequests)
            }
        })
    }
}

func main() {
    mux := http.NewServeMux()

    // Public route
    mux.HandleFunc("/public", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Public content")
    })

    // Protected route
    protectedHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Protected content")
    })

    // Create middleware chains
    publicChain := Chain(LoggingMiddleware, CORSMiddleware)
    protectedChain := Chain(LoggingMiddleware, CORSMiddleware, AuthMiddleware)

    // Apply middleware
    http.Handle("/public", publicChain(mux))
    http.Handle("/protected", protectedChain(protectedHandler))

    fmt.Println("Server starting at http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

### Practical Middleware Examples

```go
package main

import (
    "compress/gzip"
    "context"
    "encoding/json"
    "io"
    "log"
    "net/http"
    "strings"
    "sync"
    "time"
)

// Gzip compression middleware
type gzipResponseWriter struct {
    io.Writer
    http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
    return w.Writer.Write(b)
}

func GzipMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
            next.ServeHTTP(w, r)
            return
        }

        w.Header().Set("Content-Encoding", "gzip")
        gz := gzip.NewWriter(w)
        defer gz.Close()

        gzw := gzipResponseWriter{Writer: gz, ResponseWriter: w}
        next.ServeHTTP(gzw, r)
    })
}

// Timeout middleware
func TimeoutMiddleware(timeout time.Duration) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            ctx, cancel := context.WithTimeout(r.Context(), timeout)
            defer cancel()

            done := make(chan struct{})
            go func() {
                next.ServeHTTP(w, r.WithContext(ctx))
                close(done)
            }()

            select {
            case <-done:
                return
            case <-ctx.Done():
                http.Error(w, "Request timeout", http.StatusGatewayTimeout)
            }
        })
    }
}

// Simple token bucket rate limiter
type TokenBucket struct {
    mu         sync.Mutex
    tokens     float64
    maxTokens  float64
    refillRate float64
    lastRefill time.Time
}

func NewTokenBucket(maxTokens, refillRate float64) *TokenBucket {
    return &TokenBucket{
        tokens:     maxTokens,
        maxTokens:  maxTokens,
        refillRate: refillRate,
        lastRefill: time.Now(),
    }
}

func (tb *TokenBucket) Allow() bool {
    tb.mu.Lock()
    defer tb.mu.Unlock()

    now := time.Now()
    elapsed := now.Sub(tb.lastRefill).Seconds()
    tb.tokens += elapsed * tb.refillRate
    if tb.tokens > tb.maxTokens {
        tb.tokens = tb.maxTokens
    }
    tb.lastRefill = now

    if tb.tokens >= 1 {
        tb.tokens--
        return true
    }
    return false
}

func RateLimitMiddleware(bucket *TokenBucket) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if !bucket.Allow() {
                w.Header().Set("Retry-After", "1")
                http.Error(w, "Too many requests, please try again later", http.StatusTooManyRequests)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

// Structured logging middleware
func StructuredLoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        wrapped := &statusResponseWriter{ResponseWriter: w, statusCode: 200}

        next.ServeHTTP(wrapped, r)

        logEntry := map[string]interface{}{
            "method":     r.Method,
            "path":       r.URL.Path,
            "status":     wrapped.statusCode,
            "duration":   time.Since(start).String(),
            "ip":         r.RemoteAddr,
            "user_agent": r.UserAgent(),
        }

        logJSON, _ := json.Marshal(logEntry)
        log.Println(string(logJSON))
    })
}

type statusResponseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (w *statusResponseWriter) WriteHeader(code int) {
    w.statusCode = code
    w.ResponseWriter.WriteHeader(code)
}

func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]string{
            "message": "Hello, World!",
        })
    })

    // Create rate limiter: max 10 tokens, refill 2 per second
    bucket := NewTokenBucket(10, 2)

    // Apply middleware chain
    handler := StructuredLoggingMiddleware(
        RateLimitMiddleware(bucket)(
            TimeoutMiddleware(5*time.Second)(
                GzipMiddleware(mux),
            ),
        ),
    )

    log.Println("Server starting at http://localhost:8080")
    http.ListenAndServe(":8080", handler)
}
```

## HTTP Client

### Basic Requests

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "time"
)

func main() {
    // GET request
    getExample()

    // POST JSON request
    postJSONExample()

    // POST form request
    postFormExample()
}

func getExample() {
    resp, err := http.Get("https://httpbin.org/get")
    if err != nil {
        fmt.Printf("Request failed: %v
", err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("GET response: %s
", body)
}

func postJSONExample() {
    data := map[string]string{
        "name":  "John Doe",
        "email": "john@example.com",
    }

    jsonData, _ := json.Marshal(data)

    resp, err := http.Post(
        "https://httpbin.org/post",
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    if err != nil {
        fmt.Printf("Request failed: %v
", err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("POST JSON response: %s
", body)
}

func postFormExample() {
    formData := url.Values{
        "username": {"johndoe"},
        "password": {"123456"},
    }

    resp, err := http.PostForm("https://httpbin.org/post", formData)
    if err != nil {
        fmt.Printf("Request failed: %v
", err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("POST form response: %s
", body)
}
```

### Custom Client

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

func main() {
    // Create custom client
    client := &http.Client{
        Timeout: 10 * time.Second,
        Transport: &http.Transport{
            MaxIdleConns:        100,
            MaxIdleConnsPerHost: 10,
            IdleConnTimeout:     90 * time.Second,
        },
    }

    // Create request
    req, err := http.NewRequest("GET", "https://httpbin.org/get", nil)
    if err != nil {
        fmt.Printf("Failed to create request: %v
", err)
        return
    }

    // Set request headers
    req.Header.Set("User-Agent", "My-App/1.0")
    req.Header.Set("Accept", "application/json")
    req.Header.Set("Authorization", "Bearer token123")

    // Send request
    resp, err := client.Do(req)
    if err != nil {
        fmt.Printf("Request failed: %v
", err)
        return
    }
    defer resp.Body.Close()

    // Check status code
    if resp.StatusCode != http.StatusOK {
        fmt.Printf("Request failed, status code: %d
", resp.StatusCode)
        return
    }

    // Read response
    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("Response: %s
", body)
}
```

### Requests with Context

```go
package main

import (
    "context"
    "fmt"
    "io"
    "net/http"
    "time"
)

func fetchWithContext(ctx context.Context, url string) ([]byte, error) {
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}

func main() {
    // Create context with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    body, err := fetchWithContext(ctx, "https://httpbin.org/delay/2")
    if err != nil {
        fmt.Printf("Error: %v
", err)
        return
    }

    fmt.Printf("Response: %s
", body)
}
```

### HTTP Client Wrapper

```go
package main

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

// APIClient HTTP client wrapper
type APIClient struct {
    baseURL    string
    httpClient *http.Client
    headers    map[string]string
}

// NewAPIClient creates a new API client
func NewAPIClient(baseURL string, timeout time.Duration) *APIClient {
    return &APIClient{
        baseURL: baseURL,
        httpClient: &http.Client{
            Timeout: timeout,
            Transport: &http.Transport{
                MaxIdleConns:        100,
                MaxIdleConnsPerHost: 10,
                IdleConnTimeout:     90 * time.Second,
            },
        },
        headers: make(map[string]string),
    }
}

// SetHeader sets default request header
func (c *APIClient) SetHeader(key, value string) {
    c.headers[key] = value
}

// Request sends a request
func (c *APIClient) Request(ctx context.Context, method, path string, body interface{}) (*http.Response, error) {
    var bodyReader io.Reader
    if body != nil {
        jsonData, err := json.Marshal(body)
        if err != nil {
            return nil, fmt.Errorf("failed to serialize request body: %w", err)
        }
        bodyReader = bytes.NewBuffer(jsonData)
    }

    req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bodyReader)
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    // Set default headers
    for k, v := range c.headers {
        req.Header.Set(k, v)
    }

    if body != nil {
        req.Header.Set("Content-Type", "application/json")
    }

    return c.httpClient.Do(req)
}

// Get sends a GET request
func (c *APIClient) Get(ctx context.Context, path string, result interface{}) error {
    resp, err := c.Request(ctx, http.MethodGet, path, nil)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        body, _ := io.ReadAll(resp.Body)
        return fmt.Errorf("request failed [%d]: %s", resp.StatusCode, body)
    }

    return json.NewDecoder(resp.Body).Decode(result)
}

// Post sends a POST request
func (c *APIClient) Post(ctx context.Context, path string, body, result interface{}) error {
    resp, err := c.Request(ctx, http.MethodPost, path, body)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        respBody, _ := io.ReadAll(resp.Body)
        return fmt.Errorf("request failed [%d]: %s", resp.StatusCode, respBody)
    }

    if result != nil {
        return json.NewDecoder(resp.Body).Decode(result)
    }
    return nil
}

func main() {
    client := NewAPIClient("https://httpbin.org", 10*time.Second)
    client.SetHeader("User-Agent", "MyApp/1.0")

    ctx := context.Background()

    // GET request
    var getResult map[string]interface{}
    if err := client.Get(ctx, "/get", &getResult); err != nil {
        fmt.Printf("GET failed: %v
", err)
        return
    }
    fmt.Printf("GET result: %v
", getResult["url"])

    // POST request
    postData := map[string]string{"name": "John Doe"}
    var postResult map[string]interface{}
    if err := client.Post(ctx, "/post", postData, &postResult); err != nil {
        fmt.Printf("POST failed: %v
", err)
        return
    }
    fmt.Printf("POST result: %v
", postResult["json"])
}
```

## Timeout Configuration

### Server Timeout

```go
package main

import (
    "fmt"
    "net/http"
    "time"
)

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World!")
    })

    server := &http.Server{
        Addr:    ":8080",
        Handler: mux,

        // Timeout for reading the entire request (including body)
        ReadTimeout: 15 * time.Second,

        // Timeout for reading request headers
        ReadHeaderTimeout: 5 * time.Second,

        // Timeout for writing response
        WriteTimeout: 15 * time.Second,

        // Idle connection timeout
        IdleTimeout: 60 * time.Second,

        // Maximum bytes for request headers
        MaxHeaderBytes: 1 << 20, // 1 MB
    }

    fmt.Println("Server starting at http://localhost:8080")
    if err := server.ListenAndServe(); err != nil {
        fmt.Printf("Server failed to start: %v
", err)
    }
}
```

### Client Timeout

```go
package main

import (
    "context"
    "fmt"
    "net"
    "net/http"
    "time"
)

func main() {
    // Method 1: Simple timeout
    simpleClient := &http.Client{
        Timeout: 10 * time.Second,
    }

    // Method 2: Fine-grained timeout control
    transport := &http.Transport{
        // Connection timeout
        DialContext: (&net.Dialer{
            Timeout:   5 * time.Second,
            KeepAlive: 30 * time.Second,
        }).DialContext,

        // TLS handshake timeout
        TLSHandshakeTimeout: 5 * time.Second,

        // Timeout for waiting for response headers
        ResponseHeaderTimeout: 10 * time.Second,

        // Timeout for expecting 100-continue response
        ExpectContinueTimeout: 1 * time.Second,

        // Connection pool configuration
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 10,
        MaxConnsPerHost:     100,
        IdleConnTimeout:     90 * time.Second,
    }

    detailedClient := &http.Client{
        Transport: transport,
        Timeout:   30 * time.Second, // Overall timeout
    }

    // Method 3: Using context to control individual request timeout
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    req, _ := http.NewRequestWithContext(ctx, "GET", "https://httpbin.org/delay/2", nil)

    resp, err := detailedClient.Do(req)
    if err != nil {
        fmt.Printf("Request failed: %v
", err)
        return
    }
    defer resp.Body.Close()

    fmt.Printf("Request successful, status code: %d
", resp.StatusCode)

    _ = simpleClient // Avoid unused warning
}
```

### Timeout Handling Patterns

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "time"
)

// Request with retry
func requestWithRetry(ctx context.Context, url string, maxRetries int) (*http.Response, error) {
    client := &http.Client{Timeout: 5 * time.Second}

    var lastErr error
    for i := 0; i < maxRetries; i++ {
        req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
        if err != nil {
            return nil, err
        }

        resp, err := client.Do(req)
        if err == nil {
            return resp, nil
        }

        lastErr = err
        fmt.Printf("Attempt %d failed: %v
", i+1, err)

        // Exponential backoff
        select {
        case <-ctx.Done():
            return nil, ctx.Err()
        case <-time.After(time.Duration(1<<i) * time.Second):
            // Continue retry
        }
    }

    return nil, fmt.Errorf("failed after %d retries: %w", maxRetries, lastErr)
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    resp, err := requestWithRetry(ctx, "https://httpbin.org/get", 3)
    if err != nil {
        fmt.Printf("Request failed: %v
", err)
        return
    }
    defer resp.Body.Close()

    fmt.Printf("Request successful, status code: %d
", resp.StatusCode)
}
```

## TLS/HTTPS Configuration

### Enabling HTTPS Server

```go
package main

import (
    "crypto/tls"
    "fmt"
    "net/http"
    "time"
)

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, HTTPS!")
    })

    // Method 1: Simple HTTPS server
    // http.ListenAndServeTLS(":443", "cert.pem", "key.pem", mux)

    // Method 2: Custom TLS configuration
    tlsConfig := &tls.Config{
        MinVersion:               tls.VersionTLS12,
        PreferServerCipherSuites: true,
        CipherSuites: []uint16{
            tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
            tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
            tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
            tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
        },
    }

    server := &http.Server{
        Addr:         ":443",
        Handler:      mux,
        TLSConfig:    tlsConfig,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    fmt.Println("HTTPS server starting at https://localhost:443")
    if err := server.ListenAndServeTLS("cert.pem", "key.pem"); err != nil {
        fmt.Printf("Server failed to start: %v
", err)
    }
}
```

### HTTP to HTTPS Redirect

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    // HTTPS server
    httpsMux := http.NewServeMux()
    httpsMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Secure connection!")
    })

    go func() {
        httpsServer := &http.Server{
            Addr:    ":443",
            Handler: httpsMux,
        }
        httpsServer.ListenAndServeTLS("cert.pem", "key.pem")
    }()

    // HTTP redirect to HTTPS
    httpHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        target := "https://" + r.Host + r.URL.Path
        if r.URL.RawQuery != "" {
            target += "?" + r.URL.RawQuery
        }
        http.Redirect(w, r, target, http.StatusMovedPermanently)
    })

    fmt.Println("HTTP redirect server starting at :80")
    http.ListenAndServe(":80", httpHandler)
}
```

### HTTPS Client

```go
package main

import (
    "crypto/tls"
    "crypto/x509"
    "fmt"
    "io"
    "net/http"
    "os"
)

func main() {
    // Method 1: Skip certificate verification (for testing only)
    insecureClient := &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: &tls.Config{
                InsecureSkipVerify: true, // Insecure! For testing only
            },
        },
    }

    // Method 2: Using custom CA certificate
    caCert, err := os.ReadFile("ca-cert.pem")
    if err != nil {
        fmt.Printf("Failed to read CA certificate: %v
", err)
        return
    }

    caCertPool := x509.NewCertPool()
    caCertPool.AppendCertsFromPEM(caCert)

    secureClient := &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: &tls.Config{
                RootCAs:    caCertPool,
                MinVersion: tls.VersionTLS12,
            },
        },
    }

    // Method 3: Mutual TLS (mTLS)
    clientCert, err := tls.LoadX509KeyPair("client-cert.pem", "client-key.pem")
    if err != nil {
        fmt.Printf("Failed to load client certificate: %v
", err)
        return
    }

    mtlsClient := &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: &tls.Config{
                RootCAs:      caCertPool,
                Certificates: []tls.Certificate{clientCert},
                MinVersion:   tls.VersionTLS12,
            },
        },
    }

    // Use client
    resp, err := secureClient.Get("https://example.com")
    if err != nil {
        fmt.Printf("Request failed: %v
", err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("Response: %s
", body)

    _ = insecureClient
    _ = mtlsClient
}
```

## Graceful Shutdown

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        // Simulate long processing
        time.Sleep(2 * time.Second)
        fmt.Fprintf(w, "Hello, World!")
    })

    server := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Start server in goroutine
    go func() {
        fmt.Println("Server starting at http://localhost:8080")
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            fmt.Printf("Server failed to start: %v
", err)
        }
    }()

    // Listen for system signals
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    // Wait for signal
    sig := <-quit
    fmt.Printf("
Received signal: %v
", sig)
    fmt.Println("Gracefully shutting down server...")

    // Create shutdown timeout context
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // Graceful shutdown
    if err := server.Shutdown(ctx); err != nil {
        fmt.Printf("Server shutdown error: %v
", err)
    } else {
        fmt.Println("Server gracefully shut down")
    }
}
```

## Complete RESTful API Example

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "strconv"
    "sync"
    "syscall"
    "time"
)

// Data model
type User struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
}

// Response structure
type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

// User store (in-memory simulation)
type UserStore struct {
    mu     sync.RWMutex
    users  map[int]*User
    nextID int
}

func NewUserStore() *UserStore {
    return &UserStore{
        users:  make(map[int]*User),
        nextID: 1,
    }
}

func (s *UserStore) Create(name, email string) *User {
    s.mu.Lock()
    defer s.mu.Unlock()

    user := &User{
        ID:        s.nextID,
        Name:      name,
        Email:     email,
        CreatedAt: time.Now(),
    }
    s.users[user.ID] = user
    s.nextID++
    return user
}

func (s *UserStore) Get(id int) (*User, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    user, ok := s.users[id]
    return user, ok
}

func (s *UserStore) List() []*User {
    s.mu.RLock()
    defer s.mu.RUnlock()

    users := make([]*User, 0, len(s.users))
    for _, user := range s.users {
        users = append(users, user)
    }
    return users
}

func (s *UserStore) Update(id int, name, email string) (*User, bool) {
    s.mu.Lock()
    defer s.mu.Unlock()

    user, ok := s.users[id]
    if !ok {
        return nil, false
    }

    user.Name = name
    user.Email = email
    return user, true
}

func (s *UserStore) Delete(id int) bool {
    s.mu.Lock()
    defer s.mu.Unlock()

    if _, ok := s.users[id]; !ok {
        return false
    }
    delete(s.users, id)
    return true
}

// Response helper functions
func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(Response{Success: true, Data: data})
}

func jsonError(w http.ResponseWriter, status int, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(Response{Success: false, Error: message})
}

// Middleware
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        log.Printf("Starting %s %s", r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
        log.Printf("Completed %s %s in %v", r.Method, r.URL.Path, time.Since(start))
    })
}

func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusOK)
            return
        }

        next.ServeHTTP(w, r)
    })
}

func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic: %v", err)
                jsonError(w, http.StatusInternalServerError, "Internal Server Error")
            }
        }()
        next.ServeHTTP(w, r)
    })
}

// API handlers
type APIHandler struct {
    store *UserStore
}

func NewAPIHandler(store *UserStore) *APIHandler {
    return &APIHandler{store: store}
}

func (h *APIHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
    users := h.store.List()
    jsonResponse(w, http.StatusOK, users)
}

func (h *APIHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    idStr := r.PathValue("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        jsonError(w, http.StatusBadRequest, "Invalid user ID")
        return
    }

    user, ok := h.store.Get(id)
    if !ok {
        jsonError(w, http.StatusNotFound, "User not found")
        return
    }

    jsonResponse(w, http.StatusOK, user)
}

func (h *APIHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var input struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }

    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        jsonError(w, http.StatusBadRequest, "Invalid request body")
        return
    }

    if input.Name == "" || input.Email == "" {
        jsonError(w, http.StatusBadRequest, "Name and email cannot be empty")
        return
    }

    user := h.store.Create(input.Name, input.Email)
    jsonResponse(w, http.StatusCreated, user)
}

func (h *APIHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
    idStr := r.PathValue("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        jsonError(w, http.StatusBadRequest, "Invalid user ID")
        return
    }

    var input struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }

    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        jsonError(w, http.StatusBadRequest, "Invalid request body")
        return
    }

    user, ok := h.store.Update(id, input.Name, input.Email)
    if !ok {
        jsonError(w, http.StatusNotFound, "User not found")
        return
    }

    jsonResponse(w, http.StatusOK, user)
}

func (h *APIHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
    idStr := r.PathValue("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        jsonError(w, http.StatusBadRequest, "Invalid user ID")
        return
    }

    if !h.store.Delete(id) {
        jsonError(w, http.StatusNotFound, "User not found")
        return
    }

    jsonResponse(w, http.StatusOK, map[string]string{"message": "User deleted"})
}

func main() {
    // Initialize store and handler
    store := NewUserStore()
    api := NewAPIHandler(store)

    // Add some test data
    store.Create("John Doe", "john@example.com")
    store.Create("Jane Smith", "jane@example.com")

    // Create routes (Go 1.22+)
    mux := http.NewServeMux()

    // Health check
    mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        jsonResponse(w, http.StatusOK, map[string]string{"status": "healthy"})
    })

    // User API
    mux.HandleFunc("GET /api/users", api.ListUsers)
    mux.HandleFunc("GET /api/users/{id}", api.GetUser)
    mux.HandleFunc("POST /api/users", api.CreateUser)
    mux.HandleFunc("PUT /api/users/{id}", api.UpdateUser)
    mux.HandleFunc("DELETE /api/users/{id}", api.DeleteUser)

    // Apply middleware
    handler := recoveryMiddleware(corsMiddleware(loggingMiddleware(mux)))

    // Create server
    server := &http.Server{
        Addr:         ":8080",
        Handler:      handler,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Start server
    go func() {
        fmt.Println("Server starting at http://localhost:8080")
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("Server failed to start: %v", err)
        }
    }()

    // Graceful shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    fmt.Println("
Shutting down server...")
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Printf("Server shutdown error: %v", err)
    }
    fmt.Println("Server shut down")
}
```

## Best Practices

### Always Close Response Body

```go
resp, err := http.Get(url)
if err != nil {
    return err
}
defer resp.Body.Close() // Always close

// Even if you don't need the body, read and discard it
io.Copy(io.Discard, resp.Body)
```

### Use Custom Client

```go
// Don't use http.DefaultClient
// It has no timeout settings and may cause requests to hang forever

client := &http.Client{
    Timeout: 30 * time.Second,
}
```

### Reuse HTTP Client

```go
// Bad: Creating new client for each request
func bad() {
    client := &http.Client{}
    client.Get(url)
}

// Good: Reuse client
var client = &http.Client{
    Timeout: 30 * time.Second,
}

func good() {
    client.Get(url)
}
```

### Limit Request Body Size

```go
func handler(w http.ResponseWriter, r *http.Request) {
    // Limit to 1MB
    r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

    if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
        // Handle error
    }
}
```

### Handle Timeouts Properly

```go
// Use context to control timeout
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
resp, err := client.Do(req)
```

### Configure Connection Pool

```go
transport := &http.Transport{
    MaxIdleConns:        100,              // Maximum idle connections
    MaxIdleConnsPerHost: 10,               // Maximum idle connections per host
    MaxConnsPerHost:     100,              // Maximum connections per host
    IdleConnTimeout:     90 * time.Second, // Idle connection timeout
}

client := &http.Client{
    Transport: transport,
}
```

## Summary

Go's `net/http` package provides complete functionality for building HTTP servers and clients:

| Component | Function | Key Points |
|-----------|----------|------------|
| `Handler` | Request handling interface | Implement `ServeHTTP` method |
| `ServeMux` | Router | Go 1.22+ supports methods and path parameters |
| `Server` | HTTP server | Configure timeouts, TLS |
| `Client` | HTTP client | Reuse, configure timeouts and connection pool |
| `Middleware` | Middleware pattern | Chain request handling |

### Key Takeaways

1. **Handler is the core**: All request handling goes through the Handler interface
2. **Middleware pattern**: Use function wrapping to implement cross-cutting concerns
3. **Timeout configuration**: Both server and client need reasonable timeout settings
4. **Connection reuse**: Reuse Client and Transport for optimal performance
5. **Graceful shutdown**: Use the `Shutdown` method to gracefully shut down the server
6. **TLS security**: Use HTTPS in production with proper TLS configuration

After mastering these core concepts, you can build high-performance, reliable HTTP services using Go's standard library. For more complex routing needs, consider using third-party frameworks like Gin or Echo.
