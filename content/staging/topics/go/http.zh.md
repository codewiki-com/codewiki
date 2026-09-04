---
title: HTTP服务
description: Go HTTP服务完全指南，net/http包、路由与中间件
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - HTTP
  - Web
  - 服务器
status: imported
origin: old/src/content/docs/go/http.zh.md
divergence: 0.212
issues: []
legacy:
  category: Go
  subcategory: Web开发
  order: 13
  lastUpdated: 2026-01-07
---

Go 语言的 `net/http` 包提供了构建 HTTP 服务器和客户端的完整功能。它设计简洁、性能优异，是 Go 生态系统中 Web 开发的基础。无论是构建简单的 API 服务还是复杂的 Web 应用，`net/http` 都能满足需求。

## net/http 包概述

`net/http` 包的核心组件包括：

- **Server**：HTTP 服务器，处理传入的请求
- **Client**：HTTP 客户端，发送请求到其他服务
- **Handler**：请求处理接口，定义如何处理请求
- **ServeMux**：路由多路复用器，将请求路由到对应的处理器
- **Request/Response**：请求和响应的数据结构

## 创建基础 HTTP 服务器

### 最简单的服务器

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    // 注册处理函数
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World!")
    })

    // 启动服务器
    fmt.Println("服务器启动在 http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

### 使用自定义 Server

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

    // 创建自定义服务器配置
    server := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    fmt.Println("服务器启动在 http://localhost:8080")
    if err := server.ListenAndServe(); err != nil {
        fmt.Printf("服务器启动失败: %v\n", err)
    }
}
```

## Handler 接口详解

### Handler 接口定义

```go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}
```

任何实现了 `ServeHTTP` 方法的类型都可以作为 HTTP 处理器。

### 自定义 Handler

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "sync/atomic"
)

// 访问计数器
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

// 健康检查处理器
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

    fmt.Println("服务器启动在 http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

### HandlerFunc 适配器

`HandlerFunc` 是一个函数类型，它实现了 `Handler` 接口，让普通函数也能作为处理器使用。

```go
package main

import (
    "fmt"
    "net/http"
)

// 普通函数
func helloHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello from handler function!")
}

func main() {
    // 方式1：使用 HandleFunc
    http.HandleFunc("/hello1", helloHandler)

    // 方式2：使用 Handle + HandlerFunc 类型转换
    http.Handle("/hello2", http.HandlerFunc(helloHandler))

    // 方式3：直接使用匿名函数
    http.HandleFunc("/hello3", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello from anonymous function!")
    })

    http.ListenAndServe(":8080", nil)
}
```

## ServeMux 路由

### 默认路由器

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    // 使用默认的 DefaultServeMux
    http.HandleFunc("/", homeHandler)
    http.HandleFunc("/about", aboutHandler)
    http.HandleFunc("/contact", contactHandler)

    http.ListenAndServe(":8080", nil)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    // "/" 会匹配所有未匹配的路径
    if r.URL.Path != "/" {
        http.NotFound(w, r)
        return
    }
    fmt.Fprintf(w, "首页")
}

func aboutHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "关于我们")
}

func contactHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "联系我们")
}
```

### 自定义 ServeMux

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    // 创建自定义路由器
    mux := http.NewServeMux()

    // 精确匹配
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        if r.URL.Path != "/" {
            http.NotFound(w, r)
            return
        }
        fmt.Fprintf(w, "首页")
    })

    // 前缀匹配（注意结尾的斜杠）
    mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "API路径: %s", r.URL.Path)
    })

    // 精确匹配
    mux.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "用户列表")
    })

    http.ListenAndServe(":8080", mux)
}
```

### Go 1.22+ 增强路由

Go 1.22 引入了增强的路由模式，支持 HTTP 方法和路径参数。

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // 指定 HTTP 方法
    mux.HandleFunc("GET /users", listUsers)
    mux.HandleFunc("POST /users", createUser)

    // 路径参数
    mux.HandleFunc("GET /users/{id}", getUser)
    mux.HandleFunc("PUT /users/{id}", updateUser)
    mux.HandleFunc("DELETE /users/{id}", deleteUser)

    // 通配符参数（匹配剩余路径）
    mux.HandleFunc("GET /files/{path...}", serveFiles)

    // 精确匹配根路径
    mux.HandleFunc("GET /{$}", home)

    fmt.Println("服务器启动在 http://localhost:8080")
    http.ListenAndServe(":8080", mux)
}

func listUsers(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "获取用户列表")
}

func createUser(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "创建用户")
}

func getUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    fmt.Fprintf(w, "获取用户: %s", id)
}

func updateUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    fmt.Fprintf(w, "更新用户: %s", id)
}

func deleteUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    fmt.Fprintf(w, "删除用户: %s", id)
}

func serveFiles(w http.ResponseWriter, r *http.Request) {
    path := r.PathValue("path")
    fmt.Fprintf(w, "请求文件: %s", path)
}

func home(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "首页")
}
```

## 请求处理

### 解析请求信息

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

func requestInfoHandler(w http.ResponseWriter, r *http.Request) {
    // 请求方法
    method := r.Method

    // URL 信息
    path := r.URL.Path
    rawQuery := r.URL.RawQuery

    // 查询参数
    name := r.URL.Query().Get("name")
    ages := r.URL.Query()["age"] // 多值参数

    // 请求头
    userAgent := r.Header.Get("User-Agent")
    contentType := r.Header.Get("Content-Type")

    // 客户端信息
    remoteAddr := r.RemoteAddr
    host := r.Host

    // 构造响应
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

### 解析请求体

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

// JSON 请求体
func createUserJSON(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "仅支持POST方法", http.StatusMethodNotAllowed)
        return
    }

    // 限制请求体大小
    r.Body = http.MaxBytesReader(w, r.Body, 1024*1024) // 1MB

    var user User
    decoder := json.NewDecoder(r.Body)
    decoder.DisallowUnknownFields() // 禁止未知字段

    if err := decoder.Decode(&user); err != nil {
        http.Error(w, "无效的JSON: "+err.Error(), http.StatusBadRequest)
        return
    }

    // 验证数据
    if user.Name == "" {
        http.Error(w, "名称不能为空", http.StatusBadRequest)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "用户创建成功",
        "user":    user,
    })
}

// 表单请求体
func createUserForm(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "仅支持POST方法", http.StatusMethodNotAllowed)
        return
    }

    // 解析表单
    if err := r.ParseForm(); err != nil {
        http.Error(w, "表单解析失败", http.StatusBadRequest)
        return
    }

    name := r.FormValue("name")
    email := r.FormValue("email")

    fmt.Fprintf(w, "创建用户: %s <%s>", name, email)
}

// 原始请求体
func rawBodyHandler(w http.ResponseWriter, r *http.Request) {
    body, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "读取请求体失败", http.StatusInternalServerError)
        return
    }
    defer r.Body.Close()

    fmt.Fprintf(w, "接收到 %d 字节数据", len(body))
}

func main() {
    http.HandleFunc("/users/json", createUserJSON)
    http.HandleFunc("/users/form", createUserForm)
    http.HandleFunc("/raw", rawBodyHandler)
    http.ListenAndServe(":8080", nil)
}
```

### 文件上传

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
        http.Error(w, "仅支持POST方法", http.StatusMethodNotAllowed)
        return
    }

    // 限制上传大小为 10MB
    r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

    // 解析多部分表单
    if err := r.ParseMultipartForm(10 << 20); err != nil {
        http.Error(w, "文件过大或解析失败", http.StatusBadRequest)
        return
    }

    // 获取上传的文件
    file, header, err := r.FormFile("file")
    if err != nil {
        http.Error(w, "获取文件失败: "+err.Error(), http.StatusBadRequest)
        return
    }
    defer file.Close()

    // 验证文件类型
    buffer := make([]byte, 512)
    _, err = file.Read(buffer)
    if err != nil {
        http.Error(w, "读取文件失败", http.StatusInternalServerError)
        return
    }
    file.Seek(0, 0) // 重置读取位置

    contentType := http.DetectContentType(buffer)
    allowedTypes := map[string]bool{
        "image/jpeg": true,
        "image/png":  true,
        "image/gif":  true,
    }
    if !allowedTypes[contentType] {
        http.Error(w, "不支持的文件类型: "+contentType, http.StatusBadRequest)
        return
    }

    // 创建保存目录
    uploadDir := "./uploads"
    if err := os.MkdirAll(uploadDir, 0755); err != nil {
        http.Error(w, "创建目录失败", http.StatusInternalServerError)
        return
    }

    // 保存文件
    filename := filepath.Base(header.Filename)
    dst, err := os.Create(filepath.Join(uploadDir, filename))
    if err != nil {
        http.Error(w, "创建文件失败", http.StatusInternalServerError)
        return
    }
    defer dst.Close()

    written, err := io.Copy(dst, file)
    if err != nil {
        http.Error(w, "保存文件失败", http.StatusInternalServerError)
        return
    }

    fmt.Fprintf(w, "文件上传成功: %s (%d 字节)", filename, written)
}

// 多文件上传
func multiUploadHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "仅支持POST方法", http.StatusMethodNotAllowed)
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

    fmt.Fprintf(w, "成功上传 %d 个文件: %v", len(uploaded), uploaded)
}

func main() {
    http.HandleFunc("/upload", uploadHandler)
    http.HandleFunc("/upload-multi", multiUploadHandler)
    fmt.Println("服务器启动在 http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

## 响应处理

### 设置响应头和状态码

```go
package main

import (
    "encoding/json"
    "net/http"
)

func responseHandler(w http.ResponseWriter, r *http.Request) {
    // 设置响应头（必须在 WriteHeader 之前）
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("X-Custom-Header", "custom-value")
    w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

    // 添加多值响应头
    w.Header().Add("Set-Cookie", "session=abc123; Path=/")
    w.Header().Add("Set-Cookie", "user=john; Path=/")

    // 设置状态码
    w.WriteHeader(http.StatusOK)

    // 写入响应体
    json.NewEncoder(w).Encode(map[string]string{
        "status": "success",
    })
}

func errorHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusNotFound)
    json.NewEncoder(w).Encode(map[string]string{
        "error": "资源不存在",
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

### 不同类型的响应

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

// JSON 响应
func jsonResponse(w http.ResponseWriter, r *http.Request) {
    user := User{ID: 1, Name: "张三", Email: "zhangsan@example.com"}

    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    json.NewEncoder(w).Encode(user)
}

// XML 响应
func xmlResponse(w http.ResponseWriter, r *http.Request) {
    user := User{ID: 1, Name: "张三", Email: "zhangsan@example.com"}

    w.Header().Set("Content-Type", "application/xml; charset=utf-8")
    xml.NewEncoder(w).Encode(user)
}

// HTML 响应
func htmlResponse(w http.ResponseWriter, r *http.Request) {
    tmpl := `
    <!DOCTYPE html>
    <html>
    <head><title>用户信息</title></head>
    <body>
        <h1>用户: {{.Name}}</h1>
        <p>邮箱: {{.Email}}</p>
    </body>
    </html>
    `
    t := template.Must(template.New("user").Parse(tmpl))
    user := User{ID: 1, Name: "张三", Email: "zhangsan@example.com"}

    w.Header().Set("Content-Type", "text/html; charset=utf-8")
    t.Execute(w, user)
}

// 文件下载
func fileDownload(w http.ResponseWriter, r *http.Request) {
    content := "这是文件内容..."

    w.Header().Set("Content-Type", "application/octet-stream")
    w.Header().Set("Content-Disposition", "attachment; filename=\"download.txt\"")
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

### 流式响应

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
        http.Error(w, "不支持流式响应", http.StatusInternalServerError)
        return
    }

    for i := 0; i < 10; i++ {
        select {
        case <-r.Context().Done():
            return
        default:
            fmt.Fprintf(w, "data: 消息 %d - %s\n\n", i, time.Now().Format(time.RFC3339))
            flusher.Flush()
            time.Sleep(1 * time.Second)
        }
    }
}

// 分块传输
func chunkedHandler(w http.ResponseWriter, r *http.Request) {
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "不支持流式响应", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Transfer-Encoding", "chunked")
    w.Header().Set("Content-Type", "text/plain")

    for i := 0; i < 5; i++ {
        fmt.Fprintf(w, "块 %d: %s\n", i, time.Now().Format(time.RFC3339))
        flusher.Flush()
        time.Sleep(500 * time.Millisecond)
    }
}

func main() {
    http.HandleFunc("/sse", sseHandler)
    http.HandleFunc("/chunked", chunkedHandler)
    fmt.Println("服务器启动在 http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

## 中间件模式

中间件是在请求处理前后执行的函数，用于实现横切关注点如日志、认证、限流等。

### 基础中间件

```go
package main

import (
    "fmt"
    "log"
    "net/http"
    "time"
)

// 中间件类型定义
type Middleware func(http.Handler) http.Handler

// 日志中间件
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // 创建包装的 ResponseWriter 以捕获状态码
        wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

        // 调用下一个处理器
        next.ServeHTTP(wrapped, r)

        // 记录请求信息
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

// 恢复中间件
func RecoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic recovered: %v", err)
                http.Error(w, "服务器内部错误", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}

// 请求 ID 中间件
func RequestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := fmt.Sprintf("req-%d", time.Now().UnixNano())
        w.Header().Set("X-Request-ID", requestID)

        // 将 request ID 添加到请求上下文
        ctx := r.Context()
        // 可以使用 context.WithValue 传递
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World!")
    })

    mux.HandleFunc("/panic", func(w http.ResponseWriter, r *http.Request) {
        panic("故意触发panic")
    })

    // 应用中间件（从内到外）
    handler := LoggingMiddleware(RecoveryMiddleware(RequestIDMiddleware(mux)))

    fmt.Println("服务器启动在 http://localhost:8080")
    http.ListenAndServe(":8080", handler)
}
```

### 中间件链

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

// Chain 将多个中间件串联起来
func Chain(middlewares ...Middleware) Middleware {
    return func(final http.Handler) http.Handler {
        for i := len(middlewares) - 1; i >= 0; i-- {
            final = middlewares[i](final)
        }
        return final
    }
}

// 各种中间件
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        log.Printf("开始处理 %s %s", r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
        log.Printf("完成处理 %s %s 耗时 %v", r.Method, r.URL.Path, time.Since(start))
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
            http.Error(w, "未提供认证令牌", http.StatusUnauthorized)
            return
        }

        if !strings.HasPrefix(token, "Bearer ") {
            http.Error(w, "无效的令牌格式", http.StatusUnauthorized)
            return
        }

        // 验证 token...
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
                http.Error(w, "请求过于频繁", http.StatusTooManyRequests)
            }
        })
    }
}

func main() {
    mux := http.NewServeMux()

    // 公开路由
    mux.HandleFunc("/public", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "公开内容")
    })

    // 受保护路由
    protectedHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "受保护内容")
    })

    // 创建中间件链
    publicChain := Chain(LoggingMiddleware, CORSMiddleware)
    protectedChain := Chain(LoggingMiddleware, CORSMiddleware, AuthMiddleware)

    // 应用中间件
    http.Handle("/public", publicChain(mux))
    http.Handle("/protected", protectedChain(protectedHandler))

    fmt.Println("服务器启动在 http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

### 实用中间件示例

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

// Gzip 压缩中间件
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

// 超时中间件
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
                http.Error(w, "请求超时", http.StatusGatewayTimeout)
            }
        })
    }
}

// 简单的令牌桶限流器
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
                http.Error(w, "请求过于频繁，请稍后重试", http.StatusTooManyRequests)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

// 请求日志中间件（结构化日志）
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

    // 创建限流器：最大 10 个令牌，每秒补充 2 个
    bucket := NewTokenBucket(10, 2)

    // 应用中间件链
    handler := StructuredLoggingMiddleware(
        RateLimitMiddleware(bucket)(
            TimeoutMiddleware(5*time.Second)(
                GzipMiddleware(mux),
            ),
        ),
    )

    log.Println("服务器启动在 http://localhost:8080")
    http.ListenAndServe(":8080", handler)
}
```

## HTTP 客户端

### 基本请求

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
    // GET 请求
    getExample()

    // POST JSON 请求
    postJSONExample()

    // POST 表单请求
    postFormExample()
}

func getExample() {
    resp, err := http.Get("https://httpbin.org/get")
    if err != nil {
        fmt.Printf("请求失败: %v\n", err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("GET 响应: %s\n", body)
}

func postJSONExample() {
    data := map[string]string{
        "name":  "张三",
        "email": "zhangsan@example.com",
    }

    jsonData, _ := json.Marshal(data)

    resp, err := http.Post(
        "https://httpbin.org/post",
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    if err != nil {
        fmt.Printf("请求失败: %v\n", err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("POST JSON 响应: %s\n", body)
}

func postFormExample() {
    formData := url.Values{
        "username": {"zhangsan"},
        "password": {"123456"},
    }

    resp, err := http.PostForm("https://httpbin.org/post", formData)
    if err != nil {
        fmt.Printf("请求失败: %v\n", err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("POST 表单响应: %s\n", body)
}
```

### 自定义客户端

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
    // 创建自定义客户端
    client := &http.Client{
        Timeout: 10 * time.Second,
        Transport: &http.Transport{
            MaxIdleConns:        100,
            MaxIdleConnsPerHost: 10,
            IdleConnTimeout:     90 * time.Second,
        },
    }

    // 创建请求
    req, err := http.NewRequest("GET", "https://httpbin.org/get", nil)
    if err != nil {
        fmt.Printf("创建请求失败: %v\n", err)
        return
    }

    // 设置请求头
    req.Header.Set("User-Agent", "My-App/1.0")
    req.Header.Set("Accept", "application/json")
    req.Header.Set("Authorization", "Bearer token123")

    // 发送请求
    resp, err := client.Do(req)
    if err != nil {
        fmt.Printf("请求失败: %v\n", err)
        return
    }
    defer resp.Body.Close()

    // 检查状态码
    if resp.StatusCode != http.StatusOK {
        fmt.Printf("请求失败，状态码: %d\n", resp.StatusCode)
        return
    }

    // 读取响应
    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("响应: %s\n", body)
}
```

### 带上下文的请求

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
        return nil, fmt.Errorf("创建请求失败: %w", err)
    }

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("请求失败: %w", err)
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}

func main() {
    // 创建带超时的上下文
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    body, err := fetchWithContext(ctx, "https://httpbin.org/delay/2")
    if err != nil {
        fmt.Printf("错误: %v\n", err)
        return
    }

    fmt.Printf("响应: %s\n", body)
}
```

### HTTP 客户端封装

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

// APIClient HTTP 客户端封装
type APIClient struct {
    baseURL    string
    httpClient *http.Client
    headers    map[string]string
}

// NewAPIClient 创建新的 API 客户端
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

// SetHeader 设置默认请求头
func (c *APIClient) SetHeader(key, value string) {
    c.headers[key] = value
}

// Request 发送请求
func (c *APIClient) Request(ctx context.Context, method, path string, body interface{}) (*http.Response, error) {
    var bodyReader io.Reader
    if body != nil {
        jsonData, err := json.Marshal(body)
        if err != nil {
            return nil, fmt.Errorf("序列化请求体失败: %w", err)
        }
        bodyReader = bytes.NewBuffer(jsonData)
    }

    req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bodyReader)
    if err != nil {
        return nil, fmt.Errorf("创建请求失败: %w", err)
    }

    // 设置默认请求头
    for k, v := range c.headers {
        req.Header.Set(k, v)
    }

    if body != nil {
        req.Header.Set("Content-Type", "application/json")
    }

    return c.httpClient.Do(req)
}

// Get 发送 GET 请求
func (c *APIClient) Get(ctx context.Context, path string, result interface{}) error {
    resp, err := c.Request(ctx, http.MethodGet, path, nil)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        body, _ := io.ReadAll(resp.Body)
        return fmt.Errorf("请求失败 [%d]: %s", resp.StatusCode, body)
    }

    return json.NewDecoder(resp.Body).Decode(result)
}

// Post 发送 POST 请求
func (c *APIClient) Post(ctx context.Context, path string, body, result interface{}) error {
    resp, err := c.Request(ctx, http.MethodPost, path, body)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        respBody, _ := io.ReadAll(resp.Body)
        return fmt.Errorf("请求失败 [%d]: %s", resp.StatusCode, respBody)
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

    // GET 请求
    var getResult map[string]interface{}
    if err := client.Get(ctx, "/get", &getResult); err != nil {
        fmt.Printf("GET 失败: %v\n", err)
        return
    }
    fmt.Printf("GET 结果: %v\n", getResult["url"])

    // POST 请求
    postData := map[string]string{"name": "张三"}
    var postResult map[string]interface{}
    if err := client.Post(ctx, "/post", postData, &postResult); err != nil {
        fmt.Printf("POST 失败: %v\n", err)
        return
    }
    fmt.Printf("POST 结果: %v\n", postResult["json"])
}
```

## 超时配置

### 服务器超时

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

        // 读取整个请求（包括body）的超时时间
        ReadTimeout: 15 * time.Second,

        // 读取请求头的超时时间
        ReadHeaderTimeout: 5 * time.Second,

        // 写入响应的超时时间
        WriteTimeout: 15 * time.Second,

        // 保持连接的空闲超时时间
        IdleTimeout: 60 * time.Second,

        // 请求头最大字节数
        MaxHeaderBytes: 1 << 20, // 1 MB
    }

    fmt.Println("服务器启动在 http://localhost:8080")
    if err := server.ListenAndServe(); err != nil {
        fmt.Printf("服务器启动失败: %v\n", err)
    }
}
```

### 客户端超时

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
    // 方式1：简单超时
    simpleClient := &http.Client{
        Timeout: 10 * time.Second,
    }

    // 方式2：细粒度超时控制
    transport := &http.Transport{
        // 连接超时
        DialContext: (&net.Dialer{
            Timeout:   5 * time.Second,
            KeepAlive: 30 * time.Second,
        }).DialContext,

        // TLS 握手超时
        TLSHandshakeTimeout: 5 * time.Second,

        // 等待响应头的超时
        ResponseHeaderTimeout: 10 * time.Second,

        // 期望 100-continue 响应的超时
        ExpectContinueTimeout: 1 * time.Second,

        // 连接池配置
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 10,
        MaxConnsPerHost:     100,
        IdleConnTimeout:     90 * time.Second,
    }

    detailedClient := &http.Client{
        Transport: transport,
        Timeout:   30 * time.Second, // 整体超时
    }

    // 方式3：使用 context 控制单个请求超时
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    req, _ := http.NewRequestWithContext(ctx, "GET", "https://httpbin.org/delay/2", nil)

    resp, err := detailedClient.Do(req)
    if err != nil {
        fmt.Printf("请求失败: %v\n", err)
        return
    }
    defer resp.Body.Close()

    fmt.Printf("请求成功，状态码: %d\n", resp.StatusCode)

    _ = simpleClient // 避免未使用警告
}
```

### 超时处理模式

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "time"
)

// 带重试的请求
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
        fmt.Printf("尝试 %d 失败: %v\n", i+1, err)

        // 指数退避
        select {
        case <-ctx.Done():
            return nil, ctx.Err()
        case <-time.After(time.Duration(1<<i) * time.Second):
            // 继续重试
        }
    }

    return nil, fmt.Errorf("重试 %d 次后失败: %w", maxRetries, lastErr)
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    resp, err := requestWithRetry(ctx, "https://httpbin.org/get", 3)
    if err != nil {
        fmt.Printf("请求失败: %v\n", err)
        return
    }
    defer resp.Body.Close()

    fmt.Printf("请求成功，状态码: %d\n", resp.StatusCode)
}
```

## TLS/HTTPS 配置

### 启用 HTTPS 服务器

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

    // 方式1：简单的 HTTPS 服务器
    // http.ListenAndServeTLS(":443", "cert.pem", "key.pem", mux)

    // 方式2：自定义 TLS 配置
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

    fmt.Println("HTTPS 服务器启动在 https://localhost:443")
    if err := server.ListenAndServeTLS("cert.pem", "key.pem"); err != nil {
        fmt.Printf("服务器启动失败: %v\n", err)
    }
}
```

### HTTP 到 HTTPS 重定向

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    // HTTPS 服务器
    httpsMux := http.NewServeMux()
    httpsMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "安全连接!")
    })

    go func() {
        httpsServer := &http.Server{
            Addr:    ":443",
            Handler: httpsMux,
        }
        httpsServer.ListenAndServeTLS("cert.pem", "key.pem")
    }()

    // HTTP 重定向到 HTTPS
    httpHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        target := "https://" + r.Host + r.URL.Path
        if r.URL.RawQuery != "" {
            target += "?" + r.URL.RawQuery
        }
        http.Redirect(w, r, target, http.StatusMovedPermanently)
    })

    fmt.Println("HTTP 重定向服务器启动在 :80")
    http.ListenAndServe(":80", httpHandler)
}
```

### HTTPS 客户端

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
    // 方式1：跳过证书验证（仅用于测试）
    insecureClient := &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: &tls.Config{
                InsecureSkipVerify: true, // 不安全！仅用于测试
            },
        },
    }

    // 方式2：使用自定义 CA 证书
    caCert, err := os.ReadFile("ca-cert.pem")
    if err != nil {
        fmt.Printf("读取 CA 证书失败: %v\n", err)
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

    // 方式3：双向 TLS（mTLS）
    clientCert, err := tls.LoadX509KeyPair("client-cert.pem", "client-key.pem")
    if err != nil {
        fmt.Printf("加载客户端证书失败: %v\n", err)
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

    // 使用客户端
    resp, err := secureClient.Get("https://example.com")
    if err != nil {
        fmt.Printf("请求失败: %v\n", err)
        return
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Printf("响应: %s\n", body)

    _ = insecureClient
    _ = mtlsClient
}
```

## 优雅关闭

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
        // 模拟耗时处理
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

    // 在 goroutine 中启动服务器
    go func() {
        fmt.Println("服务器启动在 http://localhost:8080")
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            fmt.Printf("服务器启动失败: %v\n", err)
        }
    }()

    // 监听系统信号
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    // 等待信号
    sig := <-quit
    fmt.Printf("\n收到信号: %v\n", sig)
    fmt.Println("正在优雅关闭服务器...")

    // 创建关闭超时上下文
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // 优雅关闭
    if err := server.Shutdown(ctx); err != nil {
        fmt.Printf("服务器关闭出错: %v\n", err)
    } else {
        fmt.Println("服务器已优雅关闭")
    }
}
```

## 完整 RESTful API 示例

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

// 数据模型
type User struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
}

// 响应结构
type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

// 用户存储（内存模拟）
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

// 响应辅助函数
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

// 中间件
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        log.Printf("开始 %s %s", r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
        log.Printf("完成 %s %s 耗时 %v", r.Method, r.URL.Path, time.Since(start))
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
                jsonError(w, http.StatusInternalServerError, "服务器内部错误")
            }
        }()
        next.ServeHTTP(w, r)
    })
}

// API 处理器
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
        jsonError(w, http.StatusBadRequest, "无效的用户ID")
        return
    }

    user, ok := h.store.Get(id)
    if !ok {
        jsonError(w, http.StatusNotFound, "用户不存在")
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
        jsonError(w, http.StatusBadRequest, "无效的请求体")
        return
    }

    if input.Name == "" || input.Email == "" {
        jsonError(w, http.StatusBadRequest, "名称和邮箱不能为空")
        return
    }

    user := h.store.Create(input.Name, input.Email)
    jsonResponse(w, http.StatusCreated, user)
}

func (h *APIHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
    idStr := r.PathValue("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        jsonError(w, http.StatusBadRequest, "无效的用户ID")
        return
    }

    var input struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }

    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        jsonError(w, http.StatusBadRequest, "无效的请求体")
        return
    }

    user, ok := h.store.Update(id, input.Name, input.Email)
    if !ok {
        jsonError(w, http.StatusNotFound, "用户不存在")
        return
    }

    jsonResponse(w, http.StatusOK, user)
}

func (h *APIHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
    idStr := r.PathValue("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        jsonError(w, http.StatusBadRequest, "无效的用户ID")
        return
    }

    if !h.store.Delete(id) {
        jsonError(w, http.StatusNotFound, "用户不存在")
        return
    }

    jsonResponse(w, http.StatusOK, map[string]string{"message": "用户已删除"})
}

func main() {
    // 初始化存储和处理器
    store := NewUserStore()
    api := NewAPIHandler(store)

    // 添加一些测试数据
    store.Create("张三", "zhangsan@example.com")
    store.Create("李四", "lisi@example.com")

    // 创建路由（Go 1.22+）
    mux := http.NewServeMux()

    // 健康检查
    mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        jsonResponse(w, http.StatusOK, map[string]string{"status": "healthy"})
    })

    // 用户 API
    mux.HandleFunc("GET /api/users", api.ListUsers)
    mux.HandleFunc("GET /api/users/{id}", api.GetUser)
    mux.HandleFunc("POST /api/users", api.CreateUser)
    mux.HandleFunc("PUT /api/users/{id}", api.UpdateUser)
    mux.HandleFunc("DELETE /api/users/{id}", api.DeleteUser)

    // 应用中间件
    handler := recoveryMiddleware(corsMiddleware(loggingMiddleware(mux)))

    // 创建服务器
    server := &http.Server{
        Addr:         ":8080",
        Handler:      handler,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // 启动服务器
    go func() {
        fmt.Println("服务器启动在 http://localhost:8080")
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("服务器启动失败: %v", err)
        }
    }()

    // 优雅关闭
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    fmt.Println("\n正在关闭服务器...")
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Printf("服务器关闭出错: %v", err)
    }
    fmt.Println("服务器已关闭")
}
```

## 最佳实践

### 始终关闭响应体

```go
resp, err := http.Get(url)
if err != nil {
    return err
}
defer resp.Body.Close() // 始终关闭

// 即使不需要响应体也要读取并丢弃
io.Copy(io.Discard, resp.Body)
```

### 使用自定义 Client

```go
// 不要使用 http.DefaultClient
// 它没有超时设置，可能导致请求永远挂起

client := &http.Client{
    Timeout: 30 * time.Second,
}
```

### 复用 HTTP Client

```go
// 不好：每次请求创建新客户端
func bad() {
    client := &http.Client{}
    client.Get(url)
}

// 好：复用客户端
var client = &http.Client{
    Timeout: 30 * time.Second,
}

func good() {
    client.Get(url)
}
```

### 限制请求体大小

```go
func handler(w http.ResponseWriter, r *http.Request) {
    // 限制为 1MB
    r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

    if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
        // 处理错误
    }
}
```

### 正确处理超时

```go
// 使用 context 控制超时
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
resp, err := client.Do(req)
```

### 配置连接池

```go
transport := &http.Transport{
    MaxIdleConns:        100,              // 最大空闲连接数
    MaxIdleConnsPerHost: 10,               // 每个主机的最大空闲连接数
    MaxConnsPerHost:     100,              // 每个主机的最大连接数
    IdleConnTimeout:     90 * time.Second, // 空闲连接超时
}

client := &http.Client{
    Transport: transport,
}
```

## 总结

Go 的 `net/http` 包提供了构建 HTTP 服务器和客户端的完整功能：

| 组件 | 功能 | 关键点 |
|------|------|--------|
| `Handler` | 请求处理接口 | 实现 `ServeHTTP` 方法 |
| `ServeMux` | 路由器 | Go 1.22+ 支持方法和路径参数 |
| `Server` | HTTP 服务器 | 配置超时、TLS |
| `Client` | HTTP 客户端 | 复用、配置超时和连接池 |
| `Middleware` | 中间件模式 | 链式处理请求 |

### 关键要点

1. **Handler 是核心**：所有请求处理都通过 Handler 接口
2. **中间件模式**：使用函数包装实现横切关注点
3. **超时配置**：服务器和客户端都需要配置合理的超时
4. **连接复用**：复用 Client 和 Transport 以获得最佳性能
5. **优雅关闭**：使用 `Shutdown` 方法优雅关闭服务器
6. **TLS 安全**：生产环境使用 HTTPS，配置合理的 TLS 参数

掌握这些核心概念后，你就可以使用 Go 标准库构建高性能、可靠的 HTTP 服务了。对于更复杂的路由需求，可以考虑使用 Gin、Echo 等第三方框架。
