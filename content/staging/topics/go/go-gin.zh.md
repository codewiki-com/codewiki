---
title: Go Gin 框架完全指南
description: 掌握Go语言高性能Web框架Gin，构建高并发后端服务
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Gin
  - 高并发
  - 微服务
status: imported
origin: old/src/content/docs/backend/go-gin.zh.md
divergence: 0.155
issues: []
legacy:
  category: Backend
  subcategory: Go
  order: 11
  lastUpdated: 2026-01-07
---

## Go 语言基础回顾

### Go 语言核心特性

Go（又称 Golang）是 Google 开发的一门静态类型、编译型语言。它以简洁、高效和强大的并发支持著称，特别适合构建高性能后端服务。

```go
// Go 语言基础语法示例
package main

import (
    "fmt"
    "sync"
)

// 结构体定义
type User struct {
    ID       int    `json:"id"`
    Username string `json:"username"`
    Email    string `json:"email"`
}

// 方法定义
func (u *User) GetDisplayName() string {
    return fmt.Sprintf("%s (%s)", u.Username, u.Email)
}

// 接口定义
type Repository interface {
    FindByID(id int) (*User, error)
    Save(user *User) error
}

func main() {
    // 变量声明
    var name string = "Gin Framework"
    age := 10 // 类型推断

    // 切片操作
    users := []User{
        {ID: 1, Username: "alice", Email: "alice@example.com"},
        {ID: 2, Username: "bob", Email: "bob@example.com"},
    }

    // Map 操作
    userMap := make(map[int]*User)
    for i := range users {
        userMap[users[i].ID] = &users[i]
    }

    fmt.Printf("Framework: %s, Version: %d\n", name, age)
}
```

### Goroutine 与并发

Go 的并发模型基于 CSP（Communicating Sequential Processes），通过 Goroutine 和 Channel 实现：

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// 使用 Goroutine 进行并发处理
func processTask(id int, wg *sync.WaitGroup) {
    defer wg.Done()

    fmt.Printf("Task %d started\n", id)
    time.Sleep(100 * time.Millisecond) // 模拟耗时操作
    fmt.Printf("Task %d completed\n", id)
}

// 使用 Channel 进行通信
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
    // Goroutine 示例
    var wg sync.WaitGroup
    for i := 1; i <= 3; i++ {
        wg.Add(1)
        go processTask(i, &wg)
    }
    wg.Wait()

    // Channel 示例
    ch := make(chan int, 5)
    done := make(chan bool)

    go producer(ch)
    go consumer(ch, done)

    <-done
}
```

### 错误处理模式

Go 使用显式的错误返回值，而非异常机制：

```go
package main

import (
    "errors"
    "fmt"
)

// 自定义错误类型
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on field '%s': %s", e.Field, e.Message)
}

// 哨兵错误
var (
    ErrNotFound     = errors.New("resource not found")
    ErrUnauthorized = errors.New("unauthorized access")
)

// 错误包装
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
        // 类型断言检查错误类型
        var validationErr *ValidationError
        if errors.As(err, &validationErr) {
            fmt.Printf("Validation failed: %s\n", validationErr.Message)
            return
        }

        // 检查特定错误
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

## Gin 框架特性

### 什么是 Gin

Gin 是一个用 Go 语言编写的高性能 HTTP Web 框架。它提供了类似 Martini 的 API，但性能提升了近 40 倍。Gin 使用 httprouter 作为路由引擎，实现了零内存分配的路由匹配。

### 核心优势

- **极致性能**：基于 Radix 树的路由，零内存分配
- **中间件支持**：灵活的中间件链式调用
- **崩溃恢复**：内置 Recovery 中间件，自动恢复 panic
- **JSON 验证**：集成 go-playground/validator 进行请求验证
- **路由分组**：支持 API 版本管理和模块化组织
- **渲染支持**：内置 JSON、XML、HTML 等多种渲染方式

### 安装与快速开始

```bash
# 初始化 Go 模块
go mod init myproject

# 安装 Gin
go get -u github.com/gin-gonic/gin
```

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    // 创建默认的 Gin 引擎（包含 Logger 和 Recovery 中间件）
    r := gin.Default()

    // 定义路由
    r.GET("/ping", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "pong",
        })
    })

    // 启动服务器
    r.Run(":8080") // 监听 0.0.0.0:8080
}
```

## 路由与中间件

### 基础路由

Gin 支持所有标准的 HTTP 方法：

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // 基础路由方法
    r.GET("/users", getUsers)
    r.POST("/users", createUser)
    r.PUT("/users/:id", updateUser)
    r.DELETE("/users/:id", deleteUser)
    r.PATCH("/users/:id", patchUser)

    // 匹配任意 HTTP 方法
    r.Any("/any", handleAny)

    // 匹配指定方法
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

### 路由参数

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // 路径参数 - 必须存在
    r.GET("/user/:name", func(c *gin.Context) {
        name := c.Param("name")
        c.String(http.StatusOK, "Hello %s", name)
    })

    // 通配符参数 - 匹配剩余所有路径
    r.GET("/files/*filepath", func(c *gin.Context) {
        filepath := c.Param("filepath")
        c.String(http.StatusOK, "File path: %s", filepath)
    })

    // 精确匹配优先于通配符
    r.GET("/user/profile", func(c *gin.Context) {
        c.String(http.StatusOK, "User Profile Page")
    })

    r.Run(":8080")
}
```

### 路由分组

路由分组是组织 API 的最佳实践，特别适合 API 版本管理：

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // API v1 分组
    v1 := r.Group("/api/v1")
    {
        v1.GET("/users", getV1Users)
        v1.GET("/users/:id", getV1User)
        v1.POST("/users", createV1User)

        // 嵌套分组
        admin := v1.Group("/admin")
        admin.Use(AdminAuthMiddleware()) // 分组级中间件
        {
            admin.GET("/stats", getAdminStats)
            admin.DELETE("/users/:id", deleteUser)
        }
    }

    // API v2 分组
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

func deleteUser(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"deleted": c.Param("id")})
}
```

### 中间件详解

中间件是 Gin 的核心特性之一，用于在请求处理前后执行通用逻辑：

```go
package main

import (
    "log"
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
)

// 自定义日志中间件
func LoggerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 请求前
        startTime := time.Now()
        path := c.Request.URL.Path
        method := c.Request.Method

        // 处理请求
        c.Next()

        // 请求后
        latency := time.Since(startTime)
        statusCode := c.Writer.Status()

        log.Printf("[%s] %s %d %v", method, path, statusCode, latency)
    }
}

// 认证中间件
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": "authorization header required",
            })
            return
        }

        // 验证 token（简化示例）
        if token != "Bearer valid-token" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": "invalid token",
            })
            return
        }

        // 将用户信息存入上下文
        c.Set("userID", 123)
        c.Set("username", "alice")

        c.Next()
    }
}

// CORS 中间件
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

// 限流中间件
func RateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
    requests := make(map[string][]time.Time)

    return func(c *gin.Context) {
        clientIP := c.ClientIP()
        now := time.Now()

        // 清理过期记录
        if times, exists := requests[clientIP]; exists {
            var valid []time.Time
            for _, t := range times {
                if now.Sub(t) < window {
                    valid = append(valid, t)
                }
            }
            requests[clientIP] = valid
        }

        // 检查限流
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
    r := gin.New() // 不使用默认中间件

    // 全局中间件
    r.Use(gin.Recovery())      // 崩溃恢复
    r.Use(LoggerMiddleware())  // 自定义日志
    r.Use(CORSMiddleware())    // CORS

    // 公开路由
    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "ok"})
    })

    // 需要认证的路由组
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

## 请求处理与参数绑定

### 获取请求参数

Gin 提供了多种方式获取请求参数：

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // 查询参数
    r.GET("/search", func(c *gin.Context) {
        keyword := c.Query("keyword")              // 获取参数，不存在返回空字符串
        page := c.DefaultQuery("page", "1")        // 带默认值
        limit, exists := c.GetQuery("limit")       // 检查参数是否存在

        c.JSON(http.StatusOK, gin.H{
            "keyword":     keyword,
            "page":        page,
            "limit":       limit,
            "limitExists": exists,
        })
    })

    // 路径参数
    r.GET("/users/:id/posts/:postId", func(c *gin.Context) {
        userID := c.Param("id")
        postID := c.Param("postId")

        c.JSON(http.StatusOK, gin.H{
            "userID": userID,
            "postID": postID,
        })
    })

    // 表单参数
    r.POST("/form", func(c *gin.Context) {
        name := c.PostForm("name")
        email := c.DefaultPostForm("email", "unknown@example.com")

        c.JSON(http.StatusOK, gin.H{
            "name":  name,
            "email": email,
        })
    })

    // 获取所有查询参数
    r.GET("/params", func(c *gin.Context) {
        queryParams := c.Request.URL.Query()
        c.JSON(http.StatusOK, queryParams)
    })

    r.Run(":8080")
}
```

### 模型绑定

Gin 支持将请求数据绑定到结构体，这是处理复杂请求的推荐方式：

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

// 登录请求结构体
type LoginRequest struct {
    Username string `json:"username" form:"username" binding:"required"`
    Password string `json:"password" form:"password" binding:"required,min=6"`
}

// 用户创建请求
type CreateUserRequest struct {
    Name     string `json:"name" binding:"required,min=2,max=50"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"required,gte=18,lte=120"`
    Phone    string `json:"phone" binding:"omitempty,len=11"`
}

// URI 参数绑定
type UserURI struct {
    ID   string `uri:"id" binding:"required,uuid"`
    Name string `uri:"name" binding:"required"`
}

// 查询参数绑定
type SearchQuery struct {
    Keyword  string `form:"keyword" binding:"required"`
    Page     int    `form:"page" binding:"omitempty,min=1"`
    PageSize int    `form:"page_size" binding:"omitempty,min=10,max=100"`
}

func main() {
    r := gin.Default()

    // JSON 绑定
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

    // 表单绑定
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

    // XML 绑定
    r.POST("/login/xml", func(c *gin.Context) {
        var req LoginRequest
        if err := c.ShouldBindXML(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusOK, gin.H{
            "message":  "login successful",
            "username": req.Username,
        })
    })

    // URI 参数绑定
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

    // 查询参数绑定
    r.GET("/search", func(c *gin.Context) {
        var query SearchQuery
        query.Page = 1       // 默认值
        query.PageSize = 20  // 默认值

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

    // 创建用户（完整验证示例）
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

## 数据验证

### 内置验证规则

Gin 使用 go-playground/validator 库进行数据验证，支持丰富的验证规则：

```go
package main

import (
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/gin-gonic/gin/binding"
    "github.com/go-playground/validator/v10"
)

// 完整的用户注册请求
type RegisterRequest struct {
    // 基础验证
    Username string `json:"username" binding:"required,min=3,max=20,alphanum"`
    Password string `json:"password" binding:"required,min=8,containsany=!@#$%"`
    Email    string `json:"email" binding:"required,email"`

    // 数值验证
    Age      int     `json:"age" binding:"required,gte=18,lte=120"`
    Height   float64 `json:"height" binding:"omitempty,gt=0,lt=300"`

    // 条件验证
    Phone    string `json:"phone" binding:"required_without=Email,omitempty,len=11"`

    // 枚举验证
    Gender   string `json:"gender" binding:"required,oneof=male female other"`

    // 时间验证
    Birthday string `json:"birthday" binding:"omitempty,datetime=2006-01-02"`

    // URL 验证
    Website  string `json:"website" binding:"omitempty,url"`

    // IP 验证
    IP       string `json:"ip" binding:"omitempty,ip"`

    // 自定义验证
    Nickname string `json:"nickname" binding:"required,nickname"`
}

// 密码确认请求
type PasswordRequest struct {
    Password        string `json:"password" binding:"required,min=8"`
    ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
}

// 日期范围请求
type DateRangeRequest struct {
    StartDate string `json:"start_date" binding:"required,datetime=2006-01-02"`
    EndDate   string `json:"end_date" binding:"required,datetime=2006-01-02,gtfield=StartDate"`
}

// 自定义验证器
func nicknameValidator(fl validator.FieldLevel) bool {
    nickname := fl.Field().String()
    // 昵称不能包含敏感词
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

    // 注册自定义验证器
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

### 自定义错误消息

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/gin-gonic/gin/binding"
    "github.com/go-playground/validator/v10"
    "github.com/go-playground/locales/zh"
    ut "github.com/go-playground/universal-translator"
    zh_translations "github.com/go-playground/validator/v10/translations/zh"
)

var (
    uni      *ut.UniversalTranslator
    trans    ut.Translator
)

type User struct {
    Name  string `json:"name" binding:"required" label:"用户名"`
    Email string `json:"email" binding:"required,email" label:"邮箱"`
    Age   int    `json:"age" binding:"required,gte=18" label:"年龄"`
}

func initTranslator() {
    zhLocale := zh.New()
    uni = ut.New(zhLocale, zhLocale)
    trans, _ = uni.GetTranslator("zh")

    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        // 注册中文翻译
        zh_translations.RegisterDefaultTranslations(v, trans)

        // 注册自定义标签名
        v.RegisterTagNameFunc(func(fld reflect.StructField) string {
            label := fld.Tag.Get("label")
            if label == "" {
                return fld.Name
            }
            return label
        })
    }
}

func translateError(err error) map[string]string {
    errs := err.(validator.ValidationErrors)
    result := make(map[string]string)
    for _, e := range errs {
        result[e.Field()] = e.Translate(trans)
    }
    return result
}

func main() {
    initTranslator()

    r := gin.Default()

    r.POST("/users", func(c *gin.Context) {
        var user User
        if err := c.ShouldBindJSON(&user); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error":  "验证失败",
                "fields": translateError(err),
            })
            return
        }
        c.JSON(http.StatusCreated, user)
    })

    r.Run(":8080")
}
```

## 数据库操作（GORM）

### GORM 简介与配置

GORM 是 Go 语言中最流行的 ORM 库，提供了完整的数据库操作功能：

```go
package main

import (
    "log"
    "time"
    "gorm.io/driver/mysql"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

// 数据库配置
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

// 初始化 MySQL 连接
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

    // 连接池配置
    sqlDB.SetMaxIdleConns(config.MaxIdleConns)
    sqlDB.SetMaxOpenConns(config.MaxOpenConns)
    sqlDB.SetConnMaxLifetime(config.MaxLifetime)

    return db, nil
}

// 初始化 PostgreSQL 连接
func InitPostgres(config DBConfig) (*gorm.DB, error) {
    dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
        config.Host, config.Port, config.User, config.Password, config.DBName)

    return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}
```

### 模型定义与关联

```go
package models

import (
    "time"
    "gorm.io/gorm"
)

// 用户模型
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

    // 关联
    Profile   *Profile  `gorm:"foreignKey:UserID" json:"profile,omitempty"`
    Posts     []Post    `gorm:"foreignKey:AuthorID" json:"posts,omitempty"`
    Roles     []Role    `gorm:"many2many:user_roles" json:"roles,omitempty"`
}

// 用户资料
type Profile struct {
    ID        uint   `gorm:"primaryKey" json:"id"`
    UserID    uint   `gorm:"uniqueIndex" json:"user_id"`
    Bio       string `gorm:"type:text" json:"bio"`
    Location  string `gorm:"type:varchar(100)" json:"location"`
    Website   string `gorm:"type:varchar(255)" json:"website"`
    Birthday  *time.Time `json:"birthday"`
}

// 文章模型
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

// 标签模型
type Tag struct {
    ID   uint   `gorm:"primaryKey" json:"id"`
    Name string `gorm:"type:varchar(50);uniqueIndex" json:"name"`
}

// 评论模型
type Comment struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    CreatedAt time.Time `json:"created_at"`
    PostID    uint      `gorm:"index" json:"post_id"`
    UserID    uint      `gorm:"index" json:"user_id"`
    Content   string    `gorm:"type:text;not null" json:"content"`

    User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// 角色模型
type Role struct {
    ID   uint   `gorm:"primaryKey" json:"id"`
    Name string `gorm:"type:varchar(50);uniqueIndex" json:"name"`
}

// 自动迁移
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

### CRUD 操作

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

// 创建用户
func (r *UserRepository) Create(ctx context.Context, user *User) error {
    return r.db.WithContext(ctx).Create(user).Error
}

// 批量创建
func (r *UserRepository) CreateBatch(ctx context.Context, users []User) error {
    return r.db.WithContext(ctx).CreateInBatches(users, 100).Error
}

// 根据 ID 查询
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

// 根据用户名查询
func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).
        Where("username = ?", username).
        First(&user).Error
    return &user, err
}

// 分页查询
func (r *UserRepository) FindAll(ctx context.Context, page, pageSize int) ([]User, int64, error) {
    var users []User
    var total int64

    db := r.db.WithContext(ctx).Model(&User{})

    // 计算总数
    if err := db.Count(&total).Error; err != nil {
        return nil, 0, err
    }

    // 分页查询
    offset := (page - 1) * pageSize
    err := db.Offset(offset).Limit(pageSize).
        Preload("Profile").
        Find(&users).Error

    return users, total, err
}

// 条件查询
func (r *UserRepository) FindByCondition(ctx context.Context, condition map[string]interface{}) ([]User, error) {
    var users []User
    err := r.db.WithContext(ctx).Where(condition).Find(&users).Error
    return users, err
}

// 更新用户
func (r *UserRepository) Update(ctx context.Context, user *User) error {
    return r.db.WithContext(ctx).Save(user).Error
}

// 部分更新
func (r *UserRepository) UpdateFields(ctx context.Context, id uint, fields map[string]interface{}) error {
    return r.db.WithContext(ctx).
        Model(&User{}).
        Where("id = ?", id).
        Updates(fields).Error
}

// 删除用户（软删除）
func (r *UserRepository) Delete(ctx context.Context, id uint) error {
    return r.db.WithContext(ctx).Delete(&User{}, id).Error
}

// 永久删除
func (r *UserRepository) HardDelete(ctx context.Context, id uint) error {
    return r.db.WithContext(ctx).Unscoped().Delete(&User{}, id).Error
}

// 事务操作
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

// 复杂查询
func (r *UserRepository) SearchUsers(ctx context.Context, keyword string, status int, page, pageSize int) ([]User, int64, error) {
    var users []User
    var total int64

    db := r.db.WithContext(ctx).Model(&User{})

    // 动态条件
    if keyword != "" {
        db = db.Where("username LIKE ? OR email LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
    }
    if status > 0 {
        db = db.Where("status = ?", status)
    }

    // 计数
    if err := db.Count(&total).Error; err != nil {
        return nil, 0, err
    }

    // 分页
    offset := (page - 1) * pageSize
    err := db.Offset(offset).Limit(pageSize).
        Order("created_at DESC").
        Find(&users).Error

    return users, total, err
}
```

## 错误处理

### 统一错误处理

```go
package errors

import (
    "fmt"
    "net/http"
)

// 业务错误码
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

// 错误消息映射
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

// 自定义错误类型
type AppError struct {
    Code       int         `json:"code"`
    Message    string      `json:"message"`
    Details    interface{} `json:"details,omitempty"`
    HTTPStatus int         `json:"-"`
}

func (e *AppError) Error() string {
    return fmt.Sprintf("code: %d, message: %s", e.Code, e.Message)
}

// 创建错误的便捷函数
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

// 预定义错误
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

### 错误处理中间件

```go
package middleware

import (
    "log"
    "net/http"
    "runtime/debug"
    "github.com/gin-gonic/gin"
)

// 统一响应格式
type Response struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}

// 成功响应
func Success(c *gin.Context, data interface{}) {
    c.JSON(http.StatusOK, Response{
        Code:    0,
        Message: "success",
        Data:    data,
    })
}

// 错误响应
func Error(c *gin.Context, err *AppError) {
    c.JSON(err.HTTPStatus, Response{
        Code:    err.Code,
        Message: err.Message,
        Data:    err.Details,
    })
}

// 错误恢复中间件
func RecoveryMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                // 记录错误堆栈
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

// 错误处理中间件
func ErrorHandlerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()

        // 处理 Gin 上下文中的错误
        if len(c.Errors) > 0 {
            err := c.Errors.Last().Err

            // 检查是否为自定义错误
            if appErr, ok := err.(*AppError); ok {
                Error(c, appErr)
                return
            }

            // 默认内部错误
            Error(c, ErrInternalError)
        }
    }
}
```

### 在 Handler 中使用

```go
package handler

import (
    "net/http"
    "github.com/gin-gonic/gin"
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
        // 检查重复键错误
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

## 日志与监控

### 结构化日志

```go
package logger

import (
    "os"
    "time"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

var Logger *zap.Logger

// 初始化日志
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

// Gin 日志中间件
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

        // 结构化日志
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

        // 记录错误
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

// 请求追踪中间件
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

### Prometheus 监控

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

// Prometheus 中间件
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

// 设置 metrics 端点
func SetupMetrics(r *gin.Engine) {
    r.GET("/metrics", gin.WrapH(promhttp.Handler()))
}
```

## 项目结构最佳实践

### 推荐的项目结构

```
myproject/
├── cmd/
│   └── server/
│       └── main.go              # 应用入口
├── internal/
│   ├── config/
│   │   └── config.go            # 配置管理
│   ├── handler/
│   │   ├── user_handler.go      # 用户处理器
│   │   ├── post_handler.go      # 文章处理器
│   │   └── handler.go           # 处理器初始化
│   ├── middleware/
│   │   ├── auth.go              # 认证中间件
│   │   ├── cors.go              # CORS 中间件
│   │   ├── logger.go            # 日志中间件
│   │   └── recovery.go          # 恢复中间件
│   ├── model/
│   │   ├── user.go              # 用户模型
│   │   ├── post.go              # 文章模型
│   │   └── response.go          # 响应结构
│   ├── repository/
│   │   ├── user_repository.go   # 用户仓储
│   │   └── post_repository.go   # 文章仓储
│   ├── service/
│   │   ├── user_service.go      # 用户服务
│   │   └── post_service.go      # 文章服务
│   ├── router/
│   │   └── router.go            # 路由配置
│   └── pkg/
│       ├── errors/
│       │   └── errors.go        # 错误定义
│       ├── logger/
│       │   └── logger.go        # 日志工具
│       └── utils/
│           └── utils.go         # 工具函数
├── pkg/                         # 可导出的公共包
│   └── validator/
│       └── validator.go
├── api/
│   └── openapi.yaml             # API 文档
├── configs/
│   ├── config.yaml              # 默认配置
│   ├── config.dev.yaml          # 开发配置
│   └── config.prod.yaml         # 生产配置
├── scripts/
│   ├── migrate.sh               # 数据库迁移
│   └── build.sh                 # 构建脚本
├── Dockerfile
├── docker-compose.yaml
├── Makefile
├── go.mod
└── go.sum
```

### 依赖注入与初始化

```go
// cmd/server/main.go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "myproject/internal/config"
    "myproject/internal/handler"
    "myproject/internal/middleware"
    "myproject/internal/repository"
    "myproject/internal/router"
    "myproject/internal/service"
    "myproject/pkg/logger"

    "github.com/gin-gonic/gin"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

func main() {
    // 加载配置
    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    // 初始化日志
    logger.InitLogger(cfg.Env)
    defer logger.Logger.Sync()

    // 初始化数据库
    db, err := initDB(cfg)
    if err != nil {
        log.Fatalf("Failed to connect database: %v", err)
    }

    // 依赖注入
    userRepo := repository.NewUserRepository(db)
    postRepo := repository.NewPostRepository(db)

    userService := service.NewUserService(userRepo)
    postService := service.NewPostService(postRepo, userRepo)

    userHandler := handler.NewUserHandler(userService)
    postHandler := handler.NewPostHandler(postService)

    // 设置 Gin 模式
    if cfg.Env == "production" {
        gin.SetMode(gin.ReleaseMode)
    }

    // 初始化路由
    r := router.Setup(cfg, userHandler, postHandler)

    // 创建服务器
    srv := &http.Server{
        Addr:         ":" + cfg.Port,
        Handler:      r,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 10 * time.Second,
    }

    // 启动服务器
    go func() {
        logger.Logger.Info("Server starting on port " + cfg.Port)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server failed: %v", err)
        }
    }()

    // 优雅关闭
    gracefulShutdown(srv)
}

func initDB(cfg *config.Config) (*gorm.DB, error) {
    dsn := cfg.Database.DSN()
    return gorm.Open(mysql.Open(dsn), &gorm.Config{})
}

func gracefulShutdown(srv *http.Server) {
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    logger.Logger.Info("Shutting down server...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        logger.Logger.Error("Server forced to shutdown: " + err.Error())
    }

    logger.Logger.Info("Server exited")
}
```

### 路由配置

```go
// internal/router/router.go
package router

import (
    "myproject/internal/config"
    "myproject/internal/handler"
    "myproject/internal/middleware"
    "myproject/internal/metrics"

    "github.com/gin-gonic/gin"
)

func Setup(cfg *config.Config, userHandler *handler.UserHandler, postHandler *handler.PostHandler) *gin.Engine {
    r := gin.New()

    // 全局中间件
    r.Use(middleware.RequestIDMiddleware())
    r.Use(middleware.GinLogger())
    r.Use(middleware.RecoveryMiddleware())
    r.Use(middleware.CORSMiddleware())
    r.Use(metrics.PrometheusMiddleware())

    // 健康检查
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok"})
    })

    // Metrics 端点
    metrics.SetupMetrics(r)

    // API 路由
    api := r.Group("/api")
    {
        // v1 版本
        v1 := api.Group("/v1")
        {
            // 公开路由
            v1.POST("/auth/login", userHandler.Login)
            v1.POST("/auth/register", userHandler.Register)

            // 需要认证的路由
            protected := v1.Group("")
            protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
            {
                // 用户相关
                users := protected.Group("/users")
                {
                    users.GET("", userHandler.List)
                    users.GET("/:id", userHandler.Get)
                    users.PUT("/:id", userHandler.Update)
                    users.DELETE("/:id", userHandler.Delete)
                }

                // 文章相关
                posts := protected.Group("/posts")
                {
                    posts.GET("", postHandler.List)
                    posts.GET("/:id", postHandler.Get)
                    posts.POST("", postHandler.Create)
                    posts.PUT("/:id", postHandler.Update)
                    posts.DELETE("/:id", postHandler.Delete)
                }
            }
        }
    }

    return r
}
```

## 面试要点

### Gin 框架核心原理

**Q: Gin 的路由是如何实现的？**

Gin 使用 httprouter 作为路由引擎，基于 Radix Tree（压缩前缀树）实现。这种数据结构的优势是：
- 路由匹配时间复杂度为 O(n)，n 为路径长度
- 内存占用小，相同前缀的路径共享节点
- 支持路径参数和通配符匹配

**Q: Gin 中间件的执行顺序是怎样的？**

```go
// 中间件执行顺序示例
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

// 执行顺序: A-before -> B-before -> Handler -> B-after -> A-after
```

### Go 语言并发相关

**Q: Goroutine 和线程的区别？**

| 特性 | Goroutine | 线程 |
|------|-----------|------|
| 内存占用 | 约 2KB | 约 1MB |
| 创建/销毁 | 非常快（用户态） | 较慢（内核态） |
| 调度 | Go 运行时（GMP 模型） | 操作系统 |
| 切换成本 | 低（几百纳秒） | 高（几微秒） |
| 通信方式 | Channel | 共享内存 |

**Q: 如何防止 Goroutine 泄漏？**

```go
// 使用 context 控制 Goroutine 生命周期
func worker(ctx context.Context, jobs <-chan int) {
    for {
        select {
        case <-ctx.Done():
            return // 退出
        case job, ok := <-jobs:
            if !ok {
                return
            }
            process(job)
        }
    }
}

// 使用 WaitGroup 等待完成
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

### 数据库优化

**Q: GORM 中如何避免 N+1 查询问题？**

```go
// 错误方式 - 会产生 N+1 查询
var users []User
db.Find(&users)
for _, user := range users {
    var profile Profile
    db.Where("user_id = ?", user.ID).First(&profile)
}

// 正确方式 - 使用 Preload 预加载
var users []User
db.Preload("Profile").Find(&users)

// 条件预加载
db.Preload("Posts", "status = ?", "published").Find(&users)

// 嵌套预加载
db.Preload("Posts.Comments").Find(&users)
```

**Q: 如何优化高并发下的数据库连接？**

```go
// 连接池配置
sqlDB, _ := db.DB()
sqlDB.SetMaxIdleConns(10)          // 最大空闲连接数
sqlDB.SetMaxOpenConns(100)         // 最大打开连接数
sqlDB.SetConnMaxLifetime(time.Hour) // 连接最大生命周期

// 使用读写分离
// 主库写，从库读
```

### 性能优化技巧

```go
// 1. 使用对象池减少 GC 压力
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
    // 使用 buf 处理数据
}

// 2. 避免不必要的内存分配
// 预分配切片容量
users := make([]User, 0, 100)

// 使用 strings.Builder 拼接字符串
var builder strings.Builder
builder.WriteString("Hello")
builder.WriteString(" World")
result := builder.String()

// 3. 使用 sync.Once 进行单次初始化
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

### 常见面试问题

1. **Gin 的 c.JSON 和 c.String 有什么区别？**
   - c.JSON 会设置 Content-Type 为 application/json 并序列化数据
   - c.String 设置 Content-Type 为 text/plain 并直接返回字符串

2. **如何在 Gin 中实现请求超时？**
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

3. **Go 中如何实现优雅关闭？**
   - 监听系统信号（SIGINT, SIGTERM）
   - 停止接收新请求
   - 等待现有请求完成
   - 关闭数据库连接等资源

4. **GORM 的软删除是如何实现的？**
   - 使用 gorm.DeletedAt 字段
   - 删除时更新该字段为当前时间
   - 查询时自动添加 deleted_at IS NULL 条件

## 总结

本文全面介绍了 Go 语言和 Gin 框架的核心知识点，包括：

1. **Go 语言基础**：类型系统、并发模型、错误处理
2. **Gin 框架特性**：高性能、中间件支持、丰富的功能
3. **路由与中间件**：RESTful 路由、路由分组、中间件链
4. **请求处理**：参数获取、模型绑定、数据验证
5. **数据库操作**：GORM ORM、CRUD、事务处理
6. **错误处理**：统一错误格式、自定义错误类型
7. **日志监控**：结构化日志、Prometheus 集成
8. **项目结构**：分层架构、依赖注入、代码组织

掌握这些知识点，你将能够使用 Go 和 Gin 构建高性能、可维护的后端服务。在实际开发中，建议结合项目需求选择合适的设计模式和最佳实践，持续优化代码质量和系统性能。
