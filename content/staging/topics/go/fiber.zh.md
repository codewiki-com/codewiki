---
title: Go Fiber 框架完全指南
description: 深入掌握Go语言高性能Web框架Fiber，基于Fasthttp构建的Express风格框架，零内存分配设计
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Fiber
  - Web框架
  - 高性能
  - Fasthttp
  - REST API
status: imported
origin: old/src/content/docs/go/fiber.zh.md
divergence: 0.184
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Backend
  subcategory: Go
  order: 12
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Fiber

Fiber 是一个受 Express.js 启发的 Go 语言 Web 框架，构建于 Fasthttp 之上。Fasthttp 是 Go 语言中最快的 HTTP 引擎，这使得 Fiber 在性能方面具有显著优势。Fiber 的设计目标是让 Node.js 开发者能够快速上手 Go 语言的 Web 开发，同时享受 Go 语言的高性能和类型安全。

### 历史背景

Fiber 于 2020 年首次发布，迅速成为 Go 语言 Web 框架生态中的重要成员。它的出现填补了 Go 语言中缺少类似 Express.js 简洁 API 的空白。与 Gin、Echo 等框架相比，Fiber 选择了不同的底层实现路径——使用 Fasthttp 而非标准库的 net/http。

### 解决的问题

1. **开发效率**：提供类似 Express.js 的直观 API，降低学习曲线
2. **极致性能**：基于 Fasthttp 的零内存分配设计，适合高并发场景
3. **内置功能**：丰富的中间件生态和内置功能，减少依赖管理
4. **类型安全**：充分利用 Go 语言的静态类型系统，减少运行时错误

## 核心原理

### Fasthttp 引擎

Fiber 的核心优势来自于 Fasthttp，其关键特性包括：

```go
// Fasthttp 使用对象池复用请求/响应对象
// 这是零内存分配的关键
type RequestCtx struct {
    // 请求和响应被复用，避免频繁的内存分配
    Request  Request
    Response Response
    // ...
}

// Fiber 的 Ctx 封装了 Fasthttp 的 RequestCtx
type Ctx struct {
    *fasthttp.RequestCtx
    // Fiber 添加的扩展功能
    route    *Route
    values   [maxParams]string
    // ...
}
```

### 路由引擎

Fiber 使用自己实现的高效路由树，支持参数路由和通配符匹配：

```go
// 路由树结构示意
type Route struct {
    Method   string           // HTTP 方法
    Path     string           // 路由路径
    Handlers []Handler        // 处理器链
    Params   []string         // 参数名称列表
}

// 路由匹配采用 Radix Tree 算法
// 时间复杂度 O(n)，n 为路径长度
```

### 中间件机制

Fiber 的中间件采用洋葱模型，请求从外向内穿过中间件，响应从内向外返回：

```go
// 中间件执行流程
// Request → Middleware1 → Middleware2 → Handler
//                ↓               ↓           ↓
// Response ← Middleware1 ← Middleware2 ← Handler

func middleware(c *fiber.Ctx) error {
    // 请求前处理
    fmt.Println("Before handler")

    // 调用下一个处理器
    err := c.Next()

    // 响应后处理
    fmt.Println("After handler")

    return err
}
```

### 零内存分配设计

Fiber 的零内存分配特性意味着从上下文获取的值在请求结束后会被复用。这是性能的来源，也是需要特别注意的地方：

```go
// 重要：上下文值在 handler 返回后会被复用
func handler(c *fiber.Ctx) error {
    // 这个值只在当前 handler 中有效
    name := c.Params("name")

    // 如果需要在 handler 外使用，必须复制
    nameCopy := string([]byte(name))

    // 或使用 utils.CopyString
    // nameCopy := utils.CopyString(name)

    return c.SendString(nameCopy)
}
```

## 核心要点

### 安装与快速开始

```bash
# 初始化 Go 模块
go mod init myproject

# 安装 Fiber v2
go get github.com/gofiber/fiber/v2
```

```go
package main

import (
    "github.com/gofiber/fiber/v2"
)

func main() {
    // 创建 Fiber 应用实例
    app := fiber.New()

    // 定义根路由
    app.Get("/", func(c *fiber.Ctx) error {
        return c.SendString("Hello, Fiber!")
    })

    // 启动服务器，监听 3000 端口
    app.Listen(":3000")
}
```

### 应用配置

```go
package main

import (
    "time"
    "github.com/gofiber/fiber/v2"
)

func main() {
    // 自定义配置
    app := fiber.New(fiber.Config{
        // 应用名称，用于调试
        AppName: "My API v1.0.0",

        // 服务器头信息
        ServerHeader: "Fiber",

        // 严格路由模式：/foo 和 /foo/ 是不同的路由
        StrictRouting: false,

        // 大小写敏感：/Foo 和 /foo 是不同的路由
        CaseSensitive: false,

        // 不可变模式：上下文值不会被复用（牺牲性能换安全）
        Immutable: false,

        // 启用 ETag 生成
        ETag: true,

        // 请求体大小限制（默认 4MB）
        BodyLimit: 4 * 1024 * 1024,

        // 读取超时
        ReadTimeout: 10 * time.Second,

        // 写入超时
        WriteTimeout: 10 * time.Second,

        // 空闲超时
        IdleTimeout: 120 * time.Second,

        // 启用请求体预读
        EnablePrintRoutes: true,

        // 自定义错误处理器
        ErrorHandler: func(c *fiber.Ctx, err error) error {
            code := fiber.StatusInternalServerError

            // 检查是否为 Fiber 错误
            if e, ok := err.(*fiber.Error); ok {
                code = e.Code
            }

            return c.Status(code).JSON(fiber.Map{
                "error": err.Error(),
            })
        },
    })

    app.Get("/", func(c *fiber.Ctx) error {
        return c.SendString("Hello!")
    })

    app.Listen(":3000")
}
```

## 代码示例

### 路由系统

#### 基础路由

```go
package main

import (
    "github.com/gofiber/fiber/v2"
)

func main() {
    app := fiber.New()

    // HTTP 方法对应的路由
    app.Get("/api/users", getUsers)       // 获取用户列表
    app.Post("/api/users", createUser)    // 创建用户
    app.Put("/api/users/:id", updateUser) // 更新用户
    app.Delete("/api/users/:id", deleteUser) // 删除用户
    app.Patch("/api/users/:id", patchUser)   // 部分更新

    // 匹配所有 HTTP 方法
    app.All("/api/all", func(c *fiber.Ctx) error {
        return c.SendString("Method: " + c.Method())
    })

    // 自定义 HTTP 方法
    app.Add("CUSTOM", "/custom", func(c *fiber.Ctx) error {
        return c.SendString("Custom method")
    })

    app.Listen(":3000")
}

func getUsers(c *fiber.Ctx) error {
    users := []map[string]interface{}{
        {"id": 1, "name": "Alice"},
        {"id": 2, "name": "Bob"},
    }
    return c.JSON(users)
}

func createUser(c *fiber.Ctx) error {
    return c.Status(fiber.StatusCreated).JSON(fiber.Map{
        "message": "User created",
    })
}

func updateUser(c *fiber.Ctx) error {
    id := c.Params("id")
    return c.JSON(fiber.Map{
        "message": "User updated",
        "id":      id,
    })
}

func deleteUser(c *fiber.Ctx) error {
    id := c.Params("id")
    return c.JSON(fiber.Map{
        "message": "User deleted",
        "id":      id,
    })
}

func patchUser(c *fiber.Ctx) error {
    id := c.Params("id")
    return c.JSON(fiber.Map{
        "message": "User patched",
        "id":      id,
    })
}
```

#### 路由参数

```go
package main

import (
    "github.com/gofiber/fiber/v2"
)

func main() {
    app := fiber.New()

    // 必需参数
    app.Get("/user/:name", func(c *fiber.Ctx) error {
        name := c.Params("name")
        return c.SendString("Hello, " + name)
    })

    // 可选参数（使用 ? 后缀）
    app.Get("/user/:name?", func(c *fiber.Ctx) error {
        name := c.Params("name", "Guest") // 提供默认值
        return c.SendString("Hello, " + name)
    })

    // 多个参数
    app.Get("/users/:userId/posts/:postId", func(c *fiber.Ctx) error {
        userId := c.Params("userId")
        postId := c.Params("postId")
        return c.JSON(fiber.Map{
            "userId": userId,
            "postId": postId,
        })
    })

    // 通配符参数
    app.Get("/files/*", func(c *fiber.Ctx) error {
        filepath := c.Params("*")
        return c.SendString("File path: " + filepath)
    })

    // 带约束的参数
    app.Get("/api/:version<int>", func(c *fiber.Ctx) error {
        version := c.Params("version")
        return c.SendString("API version: " + version)
    })

    // 正则约束
    app.Get("/user/:id<regex(^\\d+$)>", func(c *fiber.Ctx) error {
        id := c.Params("id")
        return c.SendString("User ID: " + id)
    })

    app.Listen(":3000")
}
```

#### 路由分组

```go
package main

import (
    "github.com/gofiber/fiber/v2"
)

func main() {
    app := fiber.New()

    // API v1 分组
    v1 := app.Group("/api/v1")
    {
        // 用户相关路由
        users := v1.Group("/users")
        users.Get("/", listUsers)
        users.Get("/:id", getUser)
        users.Post("/", createUser)
        users.Put("/:id", updateUser)
        users.Delete("/:id", deleteUser)

        // 文章相关路由
        posts := v1.Group("/posts")
        posts.Get("/", listPosts)
        posts.Get("/:id", getPost)
        posts.Post("/", createPost)
    }

    // API v2 分组
    v2 := app.Group("/api/v2")
    {
        v2.Get("/users", listUsersV2)
    }

    // 带中间件的分组
    admin := app.Group("/admin", authMiddleware)
    {
        admin.Get("/dashboard", dashboard)
        admin.Get("/users", adminListUsers)
    }

    app.Listen(":3000")
}

func authMiddleware(c *fiber.Ctx) error {
    token := c.Get("Authorization")
    if token == "" {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "Unauthorized",
        })
    }
    return c.Next()
}

func listUsers(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{"users": []string{}})
}

func getUser(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{"id": c.Params("id")})
}

func createUser(c *fiber.Ctx) error {
    return c.Status(201).JSON(fiber.Map{"created": true})
}

func updateUser(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{"updated": true})
}

func deleteUser(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{"deleted": true})
}

func listPosts(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{"posts": []string{}})
}

func getPost(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{"id": c.Params("id")})
}

func createPost(c *fiber.Ctx) error {
    return c.Status(201).JSON(fiber.Map{"created": true})
}

func listUsersV2(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{"version": "v2", "users": []string{}})
}

func dashboard(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{"dashboard": true})
}

func adminListUsers(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{"admin": true})
}
```

### 中间件

#### 内置中间件

```go
package main

import (
    "time"
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/logger"
    "github.com/gofiber/fiber/v2/middleware/recover"
    "github.com/gofiber/fiber/v2/middleware/limiter"
    "github.com/gofiber/fiber/v2/middleware/compress"
    "github.com/gofiber/fiber/v2/middleware/cache"
    "github.com/gofiber/fiber/v2/middleware/requestid"
    "github.com/gofiber/fiber/v2/middleware/helmet"
)

func main() {
    app := fiber.New()

    // 崩溃恢复中间件
    app.Use(recover.New(recover.Config{
        EnableStackTrace: true,
    }))

    // 请求日志中间件
    app.Use(logger.New(logger.Config{
        Format:     "${time} | ${status} | ${latency} | ${ip} | ${method} | ${path}\n",
        TimeFormat: "2006-01-02 15:04:05",
        TimeZone:   "Asia/Shanghai",
    }))

    // 请求 ID 中间件
    app.Use(requestid.New())

    // CORS 中间件
    app.Use(cors.New(cors.Config{
        AllowOrigins:     "https://example.com, https://api.example.com",
        AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
        AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
        AllowCredentials: true,
        ExposeHeaders:    "Content-Length",
        MaxAge:           3600,
    }))

    // 安全头中间件
    app.Use(helmet.New())

    // 压缩中间件
    app.Use(compress.New(compress.Config{
        Level: compress.LevelBestSpeed,
    }))

    // 限流中间件
    app.Use(limiter.New(limiter.Config{
        Max:        100,              // 最大请求数
        Expiration: 1 * time.Minute,  // 时间窗口
        KeyGenerator: func(c *fiber.Ctx) string {
            return c.IP()
        },
        LimitReached: func(c *fiber.Ctx) error {
            return c.Status(429).JSON(fiber.Map{
                "error": "Too many requests",
            })
        },
    }))

    // 缓存中间件（仅用于 GET 请求）
    app.Use(cache.New(cache.Config{
        Next: func(c *fiber.Ctx) bool {
            return c.Method() != fiber.MethodGet
        },
        Expiration:   30 * time.Second,
        CacheControl: true,
    }))

    app.Get("/", func(c *fiber.Ctx) error {
        return c.SendString("Hello with middleware!")
    })

    app.Listen(":3000")
}
```

#### 自定义中间件

```go
package main

import (
    "fmt"
    "time"
    "github.com/gofiber/fiber/v2"
)

// 请求计时中间件
func TimerMiddleware() fiber.Handler {
    return func(c *fiber.Ctx) error {
        start := time.Now()

        // 继续处理请求
        err := c.Next()

        // 计算处理时间
        duration := time.Since(start)

        // 添加响应头
        c.Set("X-Response-Time", duration.String())

        fmt.Printf("Request processed in %v\n", duration)

        return err
    }
}

// 认证中间件
func AuthMiddleware() fiber.Handler {
    return func(c *fiber.Ctx) error {
        // 获取 Authorization 头
        token := c.Get("Authorization")

        if token == "" {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
                "error": "Missing authorization header",
            })
        }

        // 验证 token（简化示例）
        if token != "Bearer valid-token" {
            return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
                "error": "Invalid token",
            })
        }

        // 将用户信息存入 Locals
        c.Locals("userId", 123)
        c.Locals("username", "alice")

        return c.Next()
    }
}

// 角色验证中间件
func RoleMiddleware(roles ...string) fiber.Handler {
    return func(c *fiber.Ctx) error {
        userRole := c.Locals("role")

        if userRole == nil {
            return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
                "error": "No role assigned",
            })
        }

        roleStr := userRole.(string)
        for _, role := range roles {
            if roleStr == role {
                return c.Next()
            }
        }

        return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "Insufficient permissions",
        })
    }
}

// 请求日志中间件
func LoggerMiddleware() fiber.Handler {
    return func(c *fiber.Ctx) error {
        start := time.Now()

        // 请求信息
        method := c.Method()
        path := c.Path()
        ip := c.IP()

        // 处理请求
        err := c.Next()

        // 响应信息
        status := c.Response().StatusCode()
        duration := time.Since(start)

        fmt.Printf("[%s] %s %s - %d (%v) from %s\n",
            time.Now().Format("2006-01-02 15:04:05"),
            method,
            path,
            status,
            duration,
            ip,
        )

        return err
    }
}

func main() {
    app := fiber.New()

    // 全局中间件
    app.Use(LoggerMiddleware())
    app.Use(TimerMiddleware())

    // 公开路由
    app.Get("/public", func(c *fiber.Ctx) error {
        return c.SendString("Public endpoint")
    })

    // 受保护路由组
    protected := app.Group("/api", AuthMiddleware())
    {
        protected.Get("/profile", func(c *fiber.Ctx) error {
            userId := c.Locals("userId")
            username := c.Locals("username")
            return c.JSON(fiber.Map{
                "userId":   userId,
                "username": username,
            })
        })
    }

    // 管理员路由组
    admin := app.Group("/admin", AuthMiddleware(), RoleMiddleware("admin"))
    {
        admin.Get("/dashboard", func(c *fiber.Ctx) error {
            return c.JSON(fiber.Map{"dashboard": "admin"})
        })
    }

    app.Listen(":3000")
}
```

### 请求处理

#### 获取请求数据

```go
package main

import (
    "github.com/gofiber/fiber/v2"
)

func main() {
    app := fiber.New()

    // 查询参数
    app.Get("/search", func(c *fiber.Ctx) error {
        // 获取单个查询参数
        keyword := c.Query("keyword")

        // 带默认值
        page := c.Query("page", "1")
        limit := c.Query("limit", "10")

        return c.JSON(fiber.Map{
            "keyword": keyword,
            "page":    page,
            "limit":   limit,
        })
    })

    // 路径参数
    app.Get("/users/:id", func(c *fiber.Ctx) error {
        id := c.Params("id")

        // 转换为整数
        idInt, err := c.ParamsInt("id")
        if err != nil {
            return c.Status(400).JSON(fiber.Map{
                "error": "Invalid ID",
            })
        }

        return c.JSON(fiber.Map{
            "id":    id,
            "idInt": idInt,
        })
    })

    // 请求头
    app.Get("/headers", func(c *fiber.Ctx) error {
        contentType := c.Get("Content-Type")
        userAgent := c.Get("User-Agent")
        customHeader := c.Get("X-Custom-Header", "default")

        return c.JSON(fiber.Map{
            "contentType":  contentType,
            "userAgent":    userAgent,
            "customHeader": customHeader,
        })
    })

    // Cookie
    app.Get("/cookies", func(c *fiber.Ctx) error {
        sessionId := c.Cookies("session_id")
        theme := c.Cookies("theme", "light")

        return c.JSON(fiber.Map{
            "sessionId": sessionId,
            "theme":     theme,
        })
    })

    // 表单数据
    app.Post("/form", func(c *fiber.Ctx) error {
        name := c.FormValue("name")
        email := c.FormValue("email")

        return c.JSON(fiber.Map{
            "name":  name,
            "email": email,
        })
    })

    // 文件上传
    app.Post("/upload", func(c *fiber.Ctx) error {
        // 单文件上传
        file, err := c.FormFile("file")
        if err != nil {
            return c.Status(400).JSON(fiber.Map{
                "error": "No file uploaded",
            })
        }

        // 保存文件
        destination := "./uploads/" + file.Filename
        if err := c.SaveFile(file, destination); err != nil {
            return c.Status(500).JSON(fiber.Map{
                "error": "Failed to save file",
            })
        }

        return c.JSON(fiber.Map{
            "filename": file.Filename,
            "size":     file.Size,
        })
    })

    // 多文件上传
    app.Post("/upload-multiple", func(c *fiber.Ctx) error {
        form, err := c.MultipartForm()
        if err != nil {
            return c.Status(400).JSON(fiber.Map{
                "error": "Invalid form data",
            })
        }

        files := form.File["files"]
        var uploaded []string

        for _, file := range files {
            destination := "./uploads/" + file.Filename
            if err := c.SaveFile(file, destination); err != nil {
                continue
            }
            uploaded = append(uploaded, file.Filename)
        }

        return c.JSON(fiber.Map{
            "uploaded": uploaded,
            "count":    len(uploaded),
        })
    })

    // 获取原始请求体
    app.Post("/raw", func(c *fiber.Ctx) error {
        body := c.Body()
        return c.JSON(fiber.Map{
            "raw":  string(body),
            "size": len(body),
        })
    })

    app.Listen(":3000")
}
```

#### 请求体解析与验证

```go
package main

import (
    "github.com/gofiber/fiber/v2"
    "github.com/go-playground/validator/v10"
)

// 用户注册请求
type RegisterRequest struct {
    Username string `json:"username" validate:"required,min=3,max=20"`
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
    Age      int    `json:"age" validate:"required,gte=18,lte=120"`
}

// 用户更新请求
type UpdateUserRequest struct {
    Name    string `json:"name" validate:"omitempty,min=2,max=50"`
    Email   string `json:"email" validate:"omitempty,email"`
    Phone   string `json:"phone" validate:"omitempty,len=11"`
    Website string `json:"website" validate:"omitempty,url"`
}

// 查询参数结构体
type SearchParams struct {
    Keyword  string `query:"keyword" validate:"required"`
    Page     int    `query:"page" validate:"omitempty,min=1"`
    PageSize int    `query:"page_size" validate:"omitempty,min=10,max=100"`
    Sort     string `query:"sort" validate:"omitempty,oneof=asc desc"`
}

// 全局验证器
var validate = validator.New()

// 验证错误响应
type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}

// 格式化验证错误
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
        return "This field is required"
    case "email":
        return "Invalid email format"
    case "min":
        return "Value is too short"
    case "max":
        return "Value is too long"
    case "gte":
        return "Value is too small"
    case "lte":
        return "Value is too large"
    case "url":
        return "Invalid URL format"
    case "oneof":
        return "Value must be one of: " + err.Param()
    default:
        return "Invalid value"
    }
}

func main() {
    app := fiber.New()

    // JSON 请求体解析与验证
    app.Post("/register", func(c *fiber.Ctx) error {
        var req RegisterRequest

        // 解析 JSON
        if err := c.BodyParser(&req); err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "Invalid JSON",
            })
        }

        // 验证
        if err := validate.Struct(&req); err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error":  "Validation failed",
                "errors": formatValidationErrors(err),
            })
        }

        return c.Status(fiber.StatusCreated).JSON(fiber.Map{
            "message":  "User registered",
            "username": req.Username,
        })
    })

    // 查询参数解析与验证
    app.Get("/search", func(c *fiber.Ctx) error {
        var params SearchParams
        params.Page = 1       // 默认值
        params.PageSize = 20  // 默认值

        // 解析查询参数
        if err := c.QueryParser(&params); err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "Invalid query parameters",
            })
        }

        // 验证
        if err := validate.Struct(&params); err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error":  "Validation failed",
                "errors": formatValidationErrors(err),
            })
        }

        return c.JSON(fiber.Map{
            "keyword":   params.Keyword,
            "page":      params.Page,
            "page_size": params.PageSize,
            "sort":      params.Sort,
        })
    })

    // 表单数据解析
    app.Post("/form", func(c *fiber.Ctx) error {
        var req UpdateUserRequest

        if err := c.BodyParser(&req); err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "Invalid form data",
            })
        }

        if err := validate.Struct(&req); err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error":  "Validation failed",
                "errors": formatValidationErrors(err),
            })
        }

        return c.JSON(req)
    })

    // XML 请求体解析
    app.Post("/xml", func(c *fiber.Ctx) error {
        type XMLRequest struct {
            Name  string `xml:"name"`
            Value int    `xml:"value"`
        }

        var req XMLRequest
        if err := c.BodyParser(&req); err != nil {
            return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
                "error": "Invalid XML",
            })
        }

        return c.JSON(req)
    })

    app.Listen(":3000")
}
```

### 响应处理

```go
package main

import (
    "github.com/gofiber/fiber/v2"
)

type User struct {
    ID       int    `json:"id"`
    Username string `json:"username"`
    Email    string `json:"email"`
}

func main() {
    app := fiber.New()

    // 字符串响应
    app.Get("/text", func(c *fiber.Ctx) error {
        return c.SendString("Hello, World!")
    })

    // JSON 响应
    app.Get("/json", func(c *fiber.Ctx) error {
        user := User{
            ID:       1,
            Username: "alice",
            Email:    "alice@example.com",
        }
        return c.JSON(user)
    })

    // 使用 fiber.Map
    app.Get("/map", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "status":  "success",
            "message": "Data retrieved",
            "data": fiber.Map{
                "id":   1,
                "name": "Alice",
            },
        })
    })

    // XML 响应
    app.Get("/xml", func(c *fiber.Ctx) error {
        user := User{ID: 1, Username: "alice", Email: "alice@example.com"}
        return c.XML(user)
    })

    // 自定义状态码
    app.Post("/created", func(c *fiber.Ctx) error {
        return c.Status(fiber.StatusCreated).JSON(fiber.Map{
            "message": "Resource created",
        })
    })

    // 设置响应头
    app.Get("/headers", func(c *fiber.Ctx) error {
        c.Set("X-Custom-Header", "CustomValue")
        c.Set("X-Request-Id", "12345")
        return c.JSON(fiber.Map{"status": "ok"})
    })

    // 设置 Cookie
    app.Get("/set-cookie", func(c *fiber.Ctx) error {
        cookie := new(fiber.Cookie)
        cookie.Name = "session_id"
        cookie.Value = "abc123"
        cookie.Expires = time.Now().Add(24 * time.Hour)
        cookie.HTTPOnly = true
        cookie.Secure = true
        cookie.SameSite = "Lax"

        c.Cookie(cookie)

        return c.JSON(fiber.Map{"message": "Cookie set"})
    })

    // 清除 Cookie
    app.Get("/clear-cookie", func(c *fiber.Ctx) error {
        c.ClearCookie("session_id")
        return c.JSON(fiber.Map{"message": "Cookie cleared"})
    })

    // 重定向
    app.Get("/redirect", func(c *fiber.Ctx) error {
        return c.Redirect("/new-location", fiber.StatusMovedPermanently)
    })

    // 临时重定向
    app.Get("/temp-redirect", func(c *fiber.Ctx) error {
        return c.Redirect("/temporary", fiber.StatusTemporaryRedirect)
    })

    // 文件下载
    app.Get("/download", func(c *fiber.Ctx) error {
        return c.Download("./files/document.pdf", "download.pdf")
    })

    // 发送文件
    app.Get("/file", func(c *fiber.Ctx) error {
        return c.SendFile("./public/image.png")
    })

    // 流式响应
    app.Get("/stream", func(c *fiber.Ctx) error {
        c.Set("Content-Type", "text/event-stream")
        c.Set("Cache-Control", "no-cache")
        c.Set("Connection", "keep-alive")

        c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
            for i := 0; i < 5; i++ {
                fmt.Fprintf(w, "data: Message %d\n\n", i)
                w.Flush()
                time.Sleep(1 * time.Second)
            }
        })

        return nil
    })

    // 统一响应格式
    app.Get("/api/users", func(c *fiber.Ctx) error {
        users := []User{
            {ID: 1, Username: "alice", Email: "alice@example.com"},
            {ID: 2, Username: "bob", Email: "bob@example.com"},
        }

        return c.JSON(fiber.Map{
            "code":    0,
            "message": "success",
            "data":    users,
            "meta": fiber.Map{
                "total":    2,
                "page":     1,
                "pageSize": 10,
            },
        })
    })

    app.Listen(":3000")
}
```

### 错误处理

```go
package main

import (
    "errors"
    "github.com/gofiber/fiber/v2"
)

// 业务错误码
const (
    CodeSuccess          = 0
    CodeInvalidParams    = 10001
    CodeUnauthorized     = 10002
    CodeNotFound         = 10004
    CodeInternalError    = 10005
    CodeDuplicateEntry   = 10006
)

// 自定义业务错误
type AppError struct {
    Code       int    `json:"code"`
    Message    string `json:"message"`
    HTTPStatus int    `json:"-"`
}

func (e *AppError) Error() string {
    return e.Message
}

// 预定义错误
var (
    ErrInvalidParams  = &AppError{Code: CodeInvalidParams, Message: "Invalid parameters", HTTPStatus: 400}
    ErrUnauthorized   = &AppError{Code: CodeUnauthorized, Message: "Unauthorized", HTTPStatus: 401}
    ErrNotFound       = &AppError{Code: CodeNotFound, Message: "Resource not found", HTTPStatus: 404}
    ErrInternalError  = &AppError{Code: CodeInternalError, Message: "Internal server error", HTTPStatus: 500}
    ErrDuplicateEntry = &AppError{Code: CodeDuplicateEntry, Message: "Duplicate entry", HTTPStatus: 409}
)

// 创建新错误
func NewAppError(code int, message string, httpStatus int) *AppError {
    return &AppError{
        Code:       code,
        Message:    message,
        HTTPStatus: httpStatus,
    }
}

// 自定义错误处理器
func CustomErrorHandler(c *fiber.Ctx, err error) error {
    // 默认状态码
    code := fiber.StatusInternalServerError
    response := fiber.Map{
        "code":    CodeInternalError,
        "message": "Internal server error",
    }

    // 检查是否为 Fiber 错误
    var e *fiber.Error
    if errors.As(err, &e) {
        code = e.Code
        response["code"] = e.Code
        response["message"] = e.Message
    }

    // 检查是否为业务错误
    var appErr *AppError
    if errors.As(err, &appErr) {
        code = appErr.HTTPStatus
        response["code"] = appErr.Code
        response["message"] = appErr.Message
    }

    // 返回 JSON 错误响应
    return c.Status(code).JSON(response)
}

func main() {
    app := fiber.New(fiber.Config{
        ErrorHandler: CustomErrorHandler,
    })

    // 成功请求
    app.Get("/success", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "code":    CodeSuccess,
            "message": "success",
            "data":    "Hello, World!",
        })
    })

    // 返回 Fiber 内置错误
    app.Get("/fiber-error", func(c *fiber.Ctx) error {
        return fiber.NewError(fiber.StatusBadRequest, "Bad request example")
    })

    // 返回业务错误
    app.Get("/not-found", func(c *fiber.Ctx) error {
        return ErrNotFound
    })

    // 返回自定义业务错误
    app.Get("/custom-error", func(c *fiber.Ctx) error {
        return NewAppError(20001, "Custom business error", 400)
    })

    // 根据参数返回不同错误
    app.Get("/users/:id", func(c *fiber.Ctx) error {
        id, err := c.ParamsInt("id")
        if err != nil {
            return ErrInvalidParams
        }

        if id <= 0 {
            return NewAppError(CodeInvalidParams, "ID must be positive", 400)
        }

        if id > 1000 {
            return ErrNotFound
        }

        return c.JSON(fiber.Map{
            "code":    CodeSuccess,
            "message": "success",
            "data": fiber.Map{
                "id":       id,
                "username": "user_" + string(rune(id)),
            },
        })
    })

    // Panic 恢复（Fiber 默认处理）
    app.Get("/panic", func(c *fiber.Ctx) error {
        panic("Something went wrong!")
    })

    app.Listen(":3000")
}
```

### 静态文件服务

```go
package main

import (
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/filesystem"
    "net/http"
)

func main() {
    app := fiber.New()

    // 基础静态文件服务
    // 访问 /static/css/style.css 会返回 ./public/css/style.css
    app.Static("/static", "./public")

    // 多个静态目录
    app.Static("/assets", "./assets")
    app.Static("/uploads", "./uploads")

    // 配置静态文件选项
    app.Static("/files", "./files", fiber.Static{
        Compress:      true,              // 启用压缩
        ByteRange:     true,              // 支持范围请求
        Browse:        false,             // 禁用目录浏览
        Index:         "index.html",      // 默认文件
        CacheDuration: 24 * time.Hour,    // 缓存时间
        MaxAge:        86400,             // 浏览器缓存时间（秒）
    })

    // 使用 filesystem 中间件（支持嵌入文件）
    app.Use("/embed", filesystem.New(filesystem.Config{
        Root:       http.Dir("./static"),
        Browse:     true,
        Index:      "index.html",
        NotFoundFile: "404.html",
    }))

    // 单文件路由
    app.Get("/favicon.ico", func(c *fiber.Ctx) error {
        return c.SendFile("./public/favicon.ico")
    })

    // 下载文件
    app.Get("/download/:filename", func(c *fiber.Ctx) error {
        filename := c.Params("filename")
        filepath := "./downloads/" + filename
        return c.Download(filepath, filename)
    })

    // SPA（单页应用）支持
    app.Static("/", "./dist")

    // SPA 回退路由
    app.Get("/*", func(c *fiber.Ctx) error {
        return c.SendFile("./dist/index.html")
    })

    app.Listen(":3000")
}
```

## 最佳实践

### 项目结构

```
myproject/
├── cmd/
│   └── api/
│       └── main.go              # 应用入口
├── internal/
│   ├── config/
│   │   └── config.go            # 配置管理
│   ├── handler/
│   │   ├── user.go              # 用户处理器
│   │   ├── post.go              # 文章处理器
│   │   └── handler.go           # 处理器初始化
│   ├── middleware/
│   │   ├── auth.go              # 认证中间件
│   │   ├── cors.go              # CORS 中间件
│   │   └── logger.go            # 日志中间件
│   ├── model/
│   │   ├── user.go              # 用户模型
│   │   └── post.go              # 文章模型
│   ├── repository/
│   │   ├── user.go              # 用户仓储
│   │   └── post.go              # 文章仓储
│   ├── service/
│   │   ├── user.go              # 用户服务
│   │   └── post.go              # 文章服务
│   └── router/
│       └── router.go            # 路由配置
├── pkg/
│   ├── response/
│   │   └── response.go          # 统一响应
│   └── validator/
│       └── validator.go         # 验证器
├── config/
│   ├── config.yaml              # 配置文件
│   └── config.prod.yaml         # 生产配置
├── Dockerfile
├── docker-compose.yaml
├── go.mod
└── go.sum
```

### 分层架构示例

```go
// internal/handler/user.go
package handler

import (
    "github.com/gofiber/fiber/v2"
    "myproject/internal/service"
)

type UserHandler struct {
    userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
    return &UserHandler{userService: userService}
}

func (h *UserHandler) GetUser(c *fiber.Ctx) error {
    id, err := c.ParamsInt("id")
    if err != nil {
        return fiber.NewError(fiber.StatusBadRequest, "Invalid user ID")
    }

    user, err := h.userService.GetByID(c.Context(), id)
    if err != nil {
        return err
    }

    return c.JSON(fiber.Map{
        "code":    0,
        "message": "success",
        "data":    user,
    })
}

func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
    var req service.CreateUserRequest
    if err := c.BodyParser(&req); err != nil {
        return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
    }

    user, err := h.userService.Create(c.Context(), &req)
    if err != nil {
        return err
    }

    return c.Status(fiber.StatusCreated).JSON(fiber.Map{
        "code":    0,
        "message": "User created",
        "data":    user,
    })
}
```

```go
// internal/service/user.go
package service

import (
    "context"
    "myproject/internal/model"
    "myproject/internal/repository"
)

type UserService struct {
    userRepo *repository.UserRepository
}

func NewUserService(userRepo *repository.UserRepository) *UserService {
    return &UserService{userRepo: userRepo}
}

type CreateUserRequest struct {
    Username string `json:"username" validate:"required,min=3,max=20"`
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
}

func (s *UserService) GetByID(ctx context.Context, id int) (*model.User, error) {
    return s.userRepo.FindByID(ctx, id)
}

func (s *UserService) Create(ctx context.Context, req *CreateUserRequest) (*model.User, error) {
    user := &model.User{
        Username: req.Username,
        Email:    req.Email,
        Password: req.Password, // 实际应用中需要加密
    }

    return s.userRepo.Create(ctx, user)
}
```

```go
// internal/router/router.go
package router

import (
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/logger"
    "github.com/gofiber/fiber/v2/middleware/recover"
    "myproject/internal/handler"
    "myproject/internal/middleware"
)

func Setup(
    userHandler *handler.UserHandler,
    postHandler *handler.PostHandler,
) *fiber.App {
    app := fiber.New(fiber.Config{
        ErrorHandler: middleware.ErrorHandler,
    })

    // 全局中间件
    app.Use(recover.New())
    app.Use(logger.New())
    app.Use(cors.New())

    // 健康检查
    app.Get("/health", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{"status": "ok"})
    })

    // API 路由
    api := app.Group("/api/v1")
    {
        // 用户路由
        users := api.Group("/users")
        users.Get("/:id", userHandler.GetUser)
        users.Post("/", userHandler.CreateUser)

        // 受保护的路由
        protected := api.Group("", middleware.AuthMiddleware())
        {
            protected.Get("/profile", userHandler.GetProfile)
            protected.Put("/profile", userHandler.UpdateProfile)
        }
    }

    return app
}
```

### 优雅关闭

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

    // 在后台启动服务器
    go func() {
        if err := app.Listen(":3000"); err != nil {
            log.Printf("Server error: %v", err)
        }
    }()

    // 创建信号通道
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    // 阻塞直到收到信号
    <-quit
    log.Println("Shutting down server...")

    // 优雅关闭，等待最多 30 秒
    if err := app.ShutdownWithTimeout(30 * time.Second); err != nil {
        log.Printf("Server forced to shutdown: %v", err)
    }

    log.Println("Server exited")
}
```

## 常见陷阱

### 上下文值复用问题

```go
// 错误：在 Goroutine 中使用上下文值
func handler(c *fiber.Ctx) error {
    name := c.Params("name") // 这个值会被复用！

    go func() {
        // 危险：name 可能已经被下一个请求覆盖
        processAsync(name)
    }()

    return c.SendString("OK")
}

// 正确：复制需要在 handler 外使用的值
func handler(c *fiber.Ctx) error {
    // 方法1：手动复制
    name := string([]byte(c.Params("name")))

    // 方法2：使用 CopyString
    // name := utils.CopyString(c.Params("name"))

    go func() {
        processAsync(name) // 安全
    }()

    return c.SendString("OK")
}
```

### 响应后继续执行

```go
// 错误：返回响应后继续执行
func handler(c *fiber.Ctx) error {
    if someCondition {
        c.Status(400).JSON(fiber.Map{"error": "bad request"})
        // 注意：这里没有 return，代码会继续执行！
    }

    // 这段代码仍会执行
    return c.JSON(fiber.Map{"data": "success"})
}

// 正确：立即返回
func handler(c *fiber.Ctx) error {
    if someCondition {
        return c.Status(400).JSON(fiber.Map{"error": "bad request"})
    }

    return c.JSON(fiber.Map{"data": "success"})
}
```

### 中间件顺序问题

```go
// 错误：认证中间件在日志之前
app.Use(authMiddleware)  // 失败的请求不会被记录
app.Use(loggerMiddleware)

// 正确：日志中间件应该在最前面
app.Use(loggerMiddleware)  // 所有请求都会被记录
app.Use(authMiddleware)
```

### BodyParser 多次调用

```go
// 错误：多次调用 BodyParser
func handler(c *fiber.Ctx) error {
    var req1 Request1
    c.BodyParser(&req1) // 第一次读取 body

    var req2 Request2
    c.BodyParser(&req2) // 第二次读取会失败，body 已被消费

    return c.SendString("OK")
}

// 正确：只调用一次或使用原始 body
func handler(c *fiber.Ctx) error {
    body := c.Body() // 获取原始 body

    var req1 Request1
    json.Unmarshal(body, &req1)

    var req2 Request2
    json.Unmarshal(body, &req2)

    return c.SendString("OK")
}
```

### 忘记处理可选参数

```go
// 潜在问题：不检查可选参数
func handler(c *fiber.Ctx) error {
    id := c.Params("id") // 如果 id 是可选的，可能为空

    // 直接使用可能导致问题
    result := processById(id)

    return c.JSON(result)
}

// 正确：处理空值情况
func handler(c *fiber.Ctx) error {
    id := c.Params("id")
    if id == "" {
        id = "default"
    }

    result := processById(id)

    return c.JSON(result)
}
```

## 性能考量

### 性能优化建议

1. **使用对象池**：

```go
var userPool = sync.Pool{
    New: func() interface{} {
        return new(User)
    },
}

func handler(c *fiber.Ctx) error {
    user := userPool.Get().(*User)
    defer func() {
        *user = User{} // 重置
        userPool.Put(user)
    }()

    c.BodyParser(user)
    // 处理...

    return c.JSON(user)
}
```

2. **预分配切片**：

```go
// 避免动态扩容
users := make([]User, 0, expectedSize)
```

3. **使用 Prefork 模式**（利用多核）：

```go
app := fiber.New(fiber.Config{
    Prefork: true, // 启用 prefork 模式
})
```

4. **合理设置超时**：

```go
app := fiber.New(fiber.Config{
    ReadTimeout:  10 * time.Second,
    WriteTimeout: 10 * time.Second,
    IdleTimeout:  120 * time.Second,
})
```

### 基准测试对比

| 框架 | 请求/秒 | 延迟 (avg) | 内存分配 |
|------|---------|-----------|----------|
| Fiber | ~120,000 | 0.82ms | 0 allocs/op |
| Gin | ~90,000 | 1.1ms | 4 allocs/op |
| Echo | ~85,000 | 1.2ms | 3 allocs/op |
| net/http | ~60,000 | 1.6ms | 6 allocs/op |

*注：实际性能取决于具体场景和配置*

### 监控与性能分析

```go
package main

import (
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/monitor"
    "github.com/gofiber/fiber/v2/middleware/pprof"
)

func main() {
    app := fiber.New()

    // 添加监控面板
    app.Get("/dashboard", monitor.New())

    // 添加 pprof 端点
    app.Use(pprof.New())

    // 你的路由...

    app.Listen(":3000")
}
```

## 实战场景

### RESTful API 完整示例

```go
package main

import (
    "time"
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/logger"
    "github.com/gofiber/fiber/v2/middleware/recover"
)

type Todo struct {
    ID        int       `json:"id"`
    Title     string    `json:"title"`
    Completed bool      `json:"completed"`
    CreatedAt time.Time `json:"created_at"`
}

var todos = []Todo{
    {ID: 1, Title: "Learn Fiber", Completed: false, CreatedAt: time.Now()},
    {ID: 2, Title: "Build API", Completed: false, CreatedAt: time.Now()},
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

    // 中间件
    app.Use(recover.New())
    app.Use(logger.New())
    app.Use(cors.New())

    // 路由
    api := app.Group("/api/v1")

    // 获取所有 Todo
    api.Get("/todos", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "data":  todos,
            "total": len(todos),
        })
    })

    // 获取单个 Todo
    api.Get("/todos/:id", func(c *fiber.Ctx) error {
        id, err := c.ParamsInt("id")
        if err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid ID")
        }

        for _, todo := range todos {
            if todo.ID == id {
                return c.JSON(todo)
            }
        }

        return fiber.NewError(fiber.StatusNotFound, "Todo not found")
    })

    // 创建 Todo
    api.Post("/todos", func(c *fiber.Ctx) error {
        var input struct {
            Title string `json:"title"`
        }

        if err := c.BodyParser(&input); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
        }

        if input.Title == "" {
            return fiber.NewError(fiber.StatusBadRequest, "Title is required")
        }

        todo := Todo{
            ID:        len(todos) + 1,
            Title:     input.Title,
            Completed: false,
            CreatedAt: time.Now(),
        }

        todos = append(todos, todo)

        return c.Status(fiber.StatusCreated).JSON(todo)
    })

    // 更新 Todo
    api.Put("/todos/:id", func(c *fiber.Ctx) error {
        id, err := c.ParamsInt("id")
        if err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid ID")
        }

        var input struct {
            Title     string `json:"title"`
            Completed bool   `json:"completed"`
        }

        if err := c.BodyParser(&input); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
        }

        for i, todo := range todos {
            if todo.ID == id {
                todos[i].Title = input.Title
                todos[i].Completed = input.Completed
                return c.JSON(todos[i])
            }
        }

        return fiber.NewError(fiber.StatusNotFound, "Todo not found")
    })

    // 删除 Todo
    api.Delete("/todos/:id", func(c *fiber.Ctx) error {
        id, err := c.ParamsInt("id")
        if err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid ID")
        }

        for i, todo := range todos {
            if todo.ID == id {
                todos = append(todos[:i], todos[i+1:]...)
                return c.SendStatus(fiber.StatusNoContent)
            }
        }

        return fiber.NewError(fiber.StatusNotFound, "Todo not found")
    })

    app.Listen(":3000")
}
```

### JWT 认证示例

```go
package main

import (
    "time"
    "github.com/gofiber/fiber/v2"
    "github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-secret-key")

type Claims struct {
    UserID   int    `json:"user_id"`
    Username string `json:"username"`
    jwt.RegisteredClaims
}

func generateToken(userID int, username string) (string, error) {
    claims := Claims{
        UserID:   userID,
        Username: username,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

func authMiddleware(c *fiber.Ctx) error {
    authHeader := c.Get("Authorization")
    if authHeader == "" {
        return fiber.NewError(fiber.StatusUnauthorized, "Missing authorization header")
    }

    // 提取 token
    tokenString := ""
    if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
        tokenString = authHeader[7:]
    } else {
        return fiber.NewError(fiber.StatusUnauthorized, "Invalid authorization format")
    }

    // 解析 token
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

func main() {
    app := fiber.New()

    // 登录
    app.Post("/login", func(c *fiber.Ctx) error {
        var input struct {
            Username string `json:"username"`
            Password string `json:"password"`
        }

        if err := c.BodyParser(&input); err != nil {
            return fiber.NewError(fiber.StatusBadRequest, "Invalid request")
        }

        // 验证用户（简化示例）
        if input.Username != "admin" || input.Password != "password" {
            return fiber.NewError(fiber.StatusUnauthorized, "Invalid credentials")
        }

        token, err := generateToken(1, input.Username)
        if err != nil {
            return fiber.NewError(fiber.StatusInternalServerError, "Failed to generate token")
        }

        return c.JSON(fiber.Map{
            "token": token,
            "type":  "Bearer",
        })
    })

    // 受保护的路由
    protected := app.Group("/api", authMiddleware)

    protected.Get("/profile", func(c *fiber.Ctx) error {
        userID := c.Locals("userID").(int)
        username := c.Locals("username").(string)

        return c.JSON(fiber.Map{
            "user_id":  userID,
            "username": username,
        })
    })

    app.Listen(":3000")
}
```

## 面试要点

### Fiber vs Gin 的选择

**Q: 什么时候选择 Fiber，什么时候选择 Gin？**

选择 Fiber：
- 需要极致性能，对延迟敏感
- 团队熟悉 Express.js
- 项目需要利用 Fasthttp 的特性
- 能够接受非标准库的 http 实现

选择 Gin：
- 需要与标准库 http 生态兼容
- 需要使用依赖 net/http 的第三方库
- 对稳定性和社区成熟度有较高要求

### 关于零内存分配

**Q: 解释 Fiber 的零内存分配设计？**

```go
// Fiber 使用对象池复用 Ctx
// 这意味着：
// 1. 从 Ctx 获取的字符串值会被复用
// 2. 在 handler 外使用这些值需要复制
// 3. 显著减少 GC 压力

// 权衡：
// - 优点：更高的吞吐量，更低的延迟
// - 缺点：需要开发者注意值的生命周期
```

### 中间件执行机制

**Q: Fiber 中间件是如何执行的？**

```go
// 洋葱模型执行
func middleware1(c *fiber.Ctx) error {
    // 1. 请求进入
    log.Println("middleware1: before")

    err := c.Next()  // 2. 调用下一个

    // 5. 响应返回
    log.Println("middleware1: after")
    return err
}

func middleware2(c *fiber.Ctx) error {
    // 3. 请求进入
    log.Println("middleware2: before")

    err := c.Next()  // 调用 handler

    // 4. 响应返回
    log.Println("middleware2: after")
    return err
}

// 执行顺序：
// middleware1: before → middleware2: before → handler
// → middleware2: after → middleware1: after
```

### 错误处理最佳实践

**Q: 如何在 Fiber 中实现统一的错误处理？**

```go
// 1. 定义业务错误类型
type AppError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Status  int    `json:"-"`
}

// 2. 实现 error 接口
func (e *AppError) Error() string {
    return e.Message
}

// 3. 自定义错误处理器
func errorHandler(c *fiber.Ctx, err error) error {
    var appErr *AppError
    if errors.As(err, &appErr) {
        return c.Status(appErr.Status).JSON(appErr)
    }

    // 处理其他错误类型...
    return c.Status(500).JSON(fiber.Map{"error": "Internal error"})
}

// 4. 配置到应用
app := fiber.New(fiber.Config{
    ErrorHandler: errorHandler,
})
```

### 性能优化技巧

**Q: 如何优化 Fiber 应用的性能？**

1. 使用 Prefork 模式利用多核
2. 合理设置连接超时
3. 使用对象池减少内存分配
4. 启用响应压缩
5. 使用缓存中间件
6. 避免在热路径上进行不必要的内存分配

## 延伸阅读

### 官方资源
- [Fiber 官方文档](https://docs.gofiber.io/)
- [Fiber GitHub 仓库](https://github.com/gofiber/fiber)
- [Fiber 示例集合](https://github.com/gofiber/recipes)

### 相关框架对比
- [Gin 框架文档](https://gin-gonic.com/)
- [Echo 框架文档](https://echo.labstack.com/)
- [Fasthttp 文档](https://github.com/valyala/fasthttp)

### 进阶学习
- [Fiber 中间件生态](https://github.com/gofiber/fiber#-middleware--feature)
- [Fiber WebSocket 支持](https://github.com/gofiber/websocket)
- [Fiber 模板引擎](https://github.com/gofiber/template)

### 社区资源
- [Fiber Discord 社区](https://gofiber.io/discord)
- [Go 语言官方文档](https://go.dev/doc/)
- [Effective Go](https://go.dev/doc/effective_go)
