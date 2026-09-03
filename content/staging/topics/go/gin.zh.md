---
title: Gin Web框架
description: Gin完全指南，高性能Go Web框架的路由、中间件与请求处理
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Gin
  - Web框架
  - HTTP
status: imported
origin: old/src/content/docs/go/gin.zh.md
divergence: 0.174
issues: []
legacy:
  category: Go
  subcategory: Web框架
  order: 10
  lastUpdated: 2026-01-07
---

Gin是一个用Go语言编写的高性能HTTP Web框架。它具有类似Martini的API，但性能比Martini快40倍。Gin采用httprouter实现零内存分配路由，提供中间件支持、JSON验证、路由分组等功能，是构建RESTful API和Web应用的理想选择。

## 核心特性

- **零内存分配路由**：基于radix tree的高效路由
- **高性能**：比同类框架快40倍
- **中间件支持**：可扩展的中间件系统
- **崩溃恢复**：内置Recovery中间件防止服务器崩溃
- **JSON验证**：自动请求/响应JSON绑定与验证
- **路由分组**：组织相关路由并应用通用中间件
- **错误管理**：集中式错误处理和日志记录

## 快速开始

### 安装

```bash
go get -u github.com/gin-gonic/gin
```

### 第一个Gin应用

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    // 创建默认路由引擎（包含Logger和Recovery中间件）
    r := gin.Default()

    // 定义GET路由
    r.GET("/ping", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "pong",
        })
    })

    // 启动服务器，默认监听 :8080
    r.Run()
}
```

## 路由系统

### 基本路由

Gin支持所有标准的HTTP方法：

```go
func main() {
    r := gin.Default()

    // 各种HTTP方法
    r.GET("/users", getUsers)
    r.POST("/users", createUser)
    r.PUT("/users/:id", updateUser)
    r.PATCH("/users/:id", patchUser)
    r.DELETE("/users/:id", deleteUser)
    r.HEAD("/users", headUsers)
    r.OPTIONS("/users", optionsUsers)

    // 匹配任意HTTP方法
    r.Any("/any", handleAny)

    // 无路由处理
    r.NoRoute(func(c *gin.Context) {
        c.JSON(http.StatusNotFound, gin.H{
            "error": "页面不存在",
        })
    })

    r.Run(":8080")
}
```

### 路径参数

```go
// 路径参数 - 匹配 /users/123
r.GET("/users/:id", func(c *gin.Context) {
    id := c.Param("id")
    c.JSON(http.StatusOK, gin.H{
        "user_id": id,
    })
})

// 多个路径参数
r.GET("/users/:userId/posts/:postId", func(c *gin.Context) {
    userId := c.Param("userId")
    postId := c.Param("postId")
    c.JSON(http.StatusOK, gin.H{
        "user_id": userId,
        "post_id": postId,
    })
})

// 通配符参数 - 匹配 /files/css/style.css
r.GET("/files/*filepath", func(c *gin.Context) {
    filepath := c.Param("filepath")
    c.JSON(http.StatusOK, gin.H{
        "filepath": filepath, // 值为 /css/style.css
    })
})
```

### 查询参数

```go
// 查询参数处理 - /search?q=keyword&page=1
r.GET("/search", func(c *gin.Context) {
    // 获取查询参数
    query := c.Query("q")

    // 带默认值
    page := c.DefaultQuery("page", "1")

    // 获取可选参数并检查是否存在
    sort, exists := c.GetQuery("sort")

    // 获取数组参数 - /search?tags=go&tags=web
    tags := c.QueryArray("tags")

    // 获取map参数 - /search?filter[name]=john&filter[age]=25
    filters := c.QueryMap("filter")

    c.JSON(http.StatusOK, gin.H{
        "query":   query,
        "page":    page,
        "sort":    sort,
        "exists":  exists,
        "tags":    tags,
        "filters": filters,
    })
})
```

### 路由组

路由组用于组织具有相同前缀或中间件的路由：

```go
func main() {
    r := gin.Default()

    // API v1 路由组
    v1 := r.Group("/api/v1")
    {
        v1.GET("/users", listUsersV1)
        v1.GET("/users/:id", getUserV1)
        v1.POST("/users", createUserV1)
    }

    // API v2 路由组
    v2 := r.Group("/api/v2")
    {
        v2.GET("/users", listUsersV2)
        v2.GET("/users/:id", getUserV2)
        v2.POST("/users", createUserV2)
    }

    // 带认证的管理员路由组
    admin := r.Group("/admin")
    admin.Use(AuthRequired())
    {
        admin.GET("/dashboard", dashboard)
        admin.GET("/users", adminListUsers)
        admin.DELETE("/users/:id", adminDeleteUser)
    }

    r.Run(":8080")
}
```

### 嵌套路由组

```go
func setupRouter() *gin.Engine {
    r := gin.Default()

    api := r.Group("/api")
    {
        v1 := api.Group("/v1")
        {
            users := v1.Group("/users")
            {
                users.GET("", listUsers)
                users.GET("/:id", getUser)
                users.POST("", createUser)
                users.PUT("/:id", updateUser)
                users.DELETE("/:id", deleteUser)

                // 嵌套资源
                posts := users.Group("/:userId/posts")
                {
                    posts.GET("", listUserPosts)
                    posts.POST("", createUserPost)
                }
            }

            products := v1.Group("/products")
            {
                products.GET("", listProducts)
                products.GET("/:id", getProduct)
            }
        }
    }

    return r
}
```

## 中间件

### 使用内置中间件

```go
func main() {
    // 创建不带任何中间件的引擎
    r := gin.New()

    // 全局中间件
    r.Use(gin.Logger())   // 日志中间件
    r.Use(gin.Recovery()) // 恢复中间件，从panic恢复

    r.GET("/test", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"message": "test"})
    })

    r.Run(":8080")
}

// gin.Default() 等价于
func defaultEngine() *gin.Engine {
    r := gin.New()
    r.Use(gin.Logger())
    r.Use(gin.Recovery())
    return r
}
```

### 自定义中间件

```go
// 日志中间件
func RequestLogger() gin.HandlerFunc {
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
        clientIP := c.ClientIP()

        log.Printf("[%s] %s %s %d %v",
            clientIP, method, path, statusCode, latency)
    }
}

// 认证中间件
func AuthRequired() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")

        if token == "" {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "未提供认证令牌",
            })
            c.Abort() // 终止请求链
            return
        }

        // 验证token
        claims, err := validateToken(token)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "无效的认证令牌",
            })
            c.Abort()
            return
        }

        // 将用户信息存入上下文
        c.Set("userID", claims.UserID)
        c.Set("username", claims.Username)
        c.Next()
    }
}

// 超时中间件
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
    return func(c *gin.Context) {
        ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
        defer cancel()

        c.Request = c.Request.WithContext(ctx)
        c.Next()
    }
}
```

### CORS中间件

```go
func CORSMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
        c.Writer.Header().Set("Access-Control-Allow-Headers",
            "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
        c.Writer.Header().Set("Access-Control-Allow-Methods",
            "POST, OPTIONS, GET, PUT, DELETE, PATCH")
        c.Writer.Header().Set("Access-Control-Max-Age", "86400")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }

        c.Next()
    }
}

func main() {
    r := gin.Default()
    r.Use(CORSMiddleware())

    r.GET("/api/data", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"data": "some data"})
    })

    r.Run(":8080")
}
```

### 路由级别中间件

```go
func main() {
    r := gin.Default()

    // 单个路由使用中间件
    r.GET("/profile", AuthRequired(), func(c *gin.Context) {
        userID := c.GetString("userID")
        c.JSON(http.StatusOK, gin.H{
            "user_id": userID,
        })
    })

    // 多个中间件链
    r.GET("/admin/dashboard",
        AuthRequired(),
        RoleRequired("admin"),
        RateLimiter(100),
        func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"message": "dashboard"})
        },
    )

    // 路由组使用中间件
    authorized := r.Group("/")
    authorized.Use(AuthRequired())
    {
        authorized.POST("/submit", submitHandler)
        authorized.POST("/read", readHandler)
    }

    r.Run(":8080")
}
```

### 自定义Recovery

```go
func main() {
    r := gin.New()
    r.Use(gin.Logger())

    // 自定义Recovery处理
    r.Use(gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
        if err, ok := recovered.(string); ok {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error":   "服务器内部错误",
                "message": err,
            })
        }
        c.AbortWithStatus(http.StatusInternalServerError)
    }))

    r.GET("/panic", func(c *gin.Context) {
        panic("发生了严重错误")
    })

    r.Run(":8080")
}
```

## 请求绑定

### JSON绑定

```go
type CreateUserRequest struct {
    Username string `json:"username" binding:"required,min=3,max=20"`
    Email    string `json:"email" binding:"required,email"`
    Age      int    `json:"age" binding:"required,gte=0,lte=130"`
    Password string `json:"password" binding:"required,min=6"`
}

func createUser(c *gin.Context) {
    var req CreateUserRequest

    // ShouldBindJSON - 绑定失败返回错误，由开发者处理
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "用户创建成功",
        "user":    req,
    })
}

// BindJSON - 绑定失败自动返回400错误
func createUserAuto(c *gin.Context) {
    var req CreateUserRequest

    if err := c.BindJSON(&req); err != nil {
        // 错误已经被自动处理，Content-Type设为text/plain
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "用户创建成功",
    })
}
```

### 表单绑定

```go
type LoginForm struct {
    Username string `form:"username" binding:"required"`
    Password string `form:"password" binding:"required"`
    Remember bool   `form:"remember"`
}

func login(c *gin.Context) {
    var form LoginForm

    // ShouldBind根据Content-Type自动选择绑定器
    if err := c.ShouldBind(&form); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
        })
        return
    }

    // 处理登录逻辑
    if form.Username == "admin" && form.Password == "password" {
        c.JSON(http.StatusOK, gin.H{
            "message":  "登录成功",
            "remember": form.Remember,
        })
    } else {
        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "用户名或密码错误",
        })
    }
}
```

### 查询字符串绑定

```go
type SearchQuery struct {
    Keyword  string   `form:"q" binding:"required"`
    Page     int      `form:"page" binding:"omitempty,gte=1"`
    PageSize int      `form:"page_size" binding:"omitempty,gte=1,lte=100"`
    Sort     string   `form:"sort" binding:"omitempty,oneof=asc desc"`
    Tags     []string `form:"tags"`
}

func search(c *gin.Context) {
    var query SearchQuery

    if err := c.ShouldBindQuery(&query); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
        })
        return
    }

    // 设置默认值
    if query.Page == 0 {
        query.Page = 1
    }
    if query.PageSize == 0 {
        query.PageSize = 10
    }

    c.JSON(http.StatusOK, gin.H{
        "query": query,
    })
}
```

### URI绑定

```go
type UserURI struct {
    ID   string `uri:"id" binding:"required,uuid"`
    Name string `uri:"name" binding:"required"`
}

func getUser(c *gin.Context) {
    var uri UserURI

    if err := c.ShouldBindUri(&uri); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "id":   uri.ID,
        "name": uri.Name,
    })
}

// 路由定义
// r.GET("/users/:name/:id", getUser)
```

### Header绑定

```go
type RequestHeaders struct {
    Token     string `header:"Authorization" binding:"required"`
    UserAgent string `header:"User-Agent"`
    Language  string `header:"Accept-Language"`
}

func handleRequest(c *gin.Context) {
    var headers RequestHeaders

    if err := c.ShouldBindHeader(&headers); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "token":      headers.Token,
        "user_agent": headers.UserAgent,
        "language":   headers.Language,
    })
}
```

### 文件上传

```go
// 单个文件上传
func uploadFile(c *gin.Context) {
    file, err := c.FormFile("file")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "文件上传失败: " + err.Error(),
        })
        return
    }

    // 验证文件类型
    allowedTypes := map[string]bool{
        "image/jpeg": true,
        "image/png":  true,
        "image/gif":  true,
    }

    fileHeader, _ := file.Open()
    defer fileHeader.Close()
    buffer := make([]byte, 512)
    fileHeader.Read(buffer)
    contentType := http.DetectContentType(buffer)

    if !allowedTypes[contentType] {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "不支持的文件类型",
        })
        return
    }

    // 生成唯一文件名
    ext := filepath.Ext(file.Filename)
    newFilename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)

    // 保存文件
    if err := c.SaveUploadedFile(file, "./uploads/"+newFilename); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "文件保存失败",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message":  "文件上传成功",
        "filename": newFilename,
        "size":     file.Size,
    })
}

// 多个文件上传
func uploadMultipleFiles(c *gin.Context) {
    // 设置最大内存
    // r.MaxMultipartMemory = 8 << 20 // 8 MB

    form, err := c.MultipartForm()
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": "获取表单失败",
        })
        return
    }

    files := form.File["files"]
    var uploadedFiles []string

    for _, file := range files {
        filename := filepath.Base(file.Filename)
        dst := fmt.Sprintf("./uploads/%d_%s", time.Now().UnixNano(), filename)

        if err := c.SaveUploadedFile(file, dst); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "error": "文件保存失败: " + filename,
            })
            return
        }
        uploadedFiles = append(uploadedFiles, filename)
    }

    c.JSON(http.StatusOK, gin.H{
        "message": "所有文件上传成功",
        "files":   uploadedFiles,
        "count":   len(uploadedFiles),
    })
}

// 带表单数据的文件上传
type FileUploadForm struct {
    Name  string                `form:"name" binding:"required"`
    Email string                `form:"email" binding:"required,email"`
    File  *multipart.FileHeader `form:"file" binding:"required"`
}

func uploadWithForm(c *gin.Context) {
    var form FileUploadForm

    if err := c.ShouldBind(&form); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
        })
        return
    }

    dst := filepath.Join("./uploads", form.File.Filename)
    if err := c.SaveUploadedFile(form.File, dst); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "文件保存失败",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message":  "上传成功",
        "name":     form.Name,
        "email":    form.Email,
        "filename": form.File.Filename,
    })
}
```

## 验证

### 内置验证标签

Gin使用`go-playground/validator/v10`进行验证：

```go
type Product struct {
    // 必填字段
    Name string `json:"name" binding:"required"`

    // 字符串长度验证
    Description string `json:"description" binding:"min=10,max=500"`

    // 数字范围验证
    Price float64 `json:"price" binding:"required,gt=0"`
    Stock int     `json:"stock" binding:"gte=0"`

    // 枚举验证
    Category string `json:"category" binding:"required,oneof=electronics clothing food books"`

    // 正则表达式验证
    SKU string `json:"sku" binding:"required,alphanum,len=10"`

    // 邮箱验证
    ContactEmail string `json:"contact_email" binding:"omitempty,email"`

    // URL验证
    Website string `json:"website" binding:"omitempty,url"`

    // 日期验证
    LaunchDate time.Time `json:"launch_date" binding:"required" time_format:"2006-01-02"`

    // 条件验证
    DiscountPrice float64 `json:"discount_price" binding:"omitempty,ltfield=Price"`

    // UUID验证
    ExternalID string `json:"external_id" binding:"omitempty,uuid"`

    // IP地址验证
    ServerIP string `json:"server_ip" binding:"omitempty,ip"`

    // 嵌套结构验证
    Dimensions Dimensions `json:"dimensions" binding:"required,dive"`
}

type Dimensions struct {
    Length float64 `json:"length" binding:"required,gt=0"`
    Width  float64 `json:"width" binding:"required,gt=0"`
    Height float64 `json:"height" binding:"required,gt=0"`
}
```

### 常用验证标签

| 标签 | 描述 | 示例 |
|------|------|------|
| `required` | 必填字段 | `binding:"required"` |
| `omitempty` | 空值时跳过验证 | `binding:"omitempty,email"` |
| `min` | 最小值/长度 | `binding:"min=3"` |
| `max` | 最大值/长度 | `binding:"max=100"` |
| `len` | 精确长度 | `binding:"len=10"` |
| `eq` | 等于 | `binding:"eq=admin"` |
| `ne` | 不等于 | `binding:"ne=0"` |
| `gt` | 大于 | `binding:"gt=0"` |
| `gte` | 大于等于 | `binding:"gte=18"` |
| `lt` | 小于 | `binding:"lt=100"` |
| `lte` | 小于等于 | `binding:"lte=130"` |
| `oneof` | 枚举值 | `binding:"oneof=male female"` |
| `email` | 邮箱格式 | `binding:"email"` |
| `url` | URL格式 | `binding:"url"` |
| `uuid` | UUID格式 | `binding:"uuid"` |
| `alphanum` | 字母数字 | `binding:"alphanum"` |
| `numeric` | 数字字符串 | `binding:"numeric"` |
| `contains` | 包含子串 | `binding:"contains=admin"` |
| `excludes` | 不包含子串 | `binding:"excludes=admin"` |
| `eqfield` | 等于另一字段 | `binding:"eqfield=Password"` |
| `gtfield` | 大于另一字段 | `binding:"gtfield=StartDate"` |
| `dive` | 验证切片/数组元素 | `binding:"dive,required"` |

### 自定义验证器

```go
import (
    "regexp"
    "unicode"

    "github.com/gin-gonic/gin/binding"
    "github.com/go-playground/validator/v10"
)

// 自定义验证函数 - 中国手机号
var validatePhone validator.Func = func(fl validator.FieldLevel) bool {
    phone := fl.Field().String()
    matched, _ := regexp.MatchString(`^1[3-9]\d{9}$`, phone)
    return matched
}

// 自定义验证函数 - 强密码
var validateStrongPassword validator.Func = func(fl validator.FieldLevel) bool {
    password := fl.Field().String()
    if len(password) < 8 {
        return false
    }

    var hasUpper, hasLower, hasDigit, hasSpecial bool
    for _, char := range password {
        switch {
        case unicode.IsUpper(char):
            hasUpper = true
        case unicode.IsLower(char):
            hasLower = true
        case unicode.IsDigit(char):
            hasDigit = true
        case unicode.IsPunct(char) || unicode.IsSymbol(char):
            hasSpecial = true
        }
    }

    return hasUpper && hasLower && hasDigit && hasSpecial
}

// 自定义验证函数 - 预约日期（必须是将来的日期）
var validateBookableDate validator.Func = func(fl validator.FieldLevel) bool {
    date, ok := fl.Field().Interface().(time.Time)
    if !ok {
        return false
    }
    return date.After(time.Now())
}

// 注册自定义验证器
func setupValidators() {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterValidation("phone", validatePhone)
        v.RegisterValidation("strongpassword", validateStrongPassword)
        v.RegisterValidation("bookabledate", validateBookableDate)
    }
}

type UserRegistration struct {
    Username string `json:"username" binding:"required,min=3,max=20,alphanum"`
    Phone    string `json:"phone" binding:"required,phone"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,strongpassword"`
}

type Booking struct {
    CheckIn  time.Time `form:"check_in" binding:"required,bookabledate" time_format:"2006-01-02"`
    CheckOut time.Time `form:"check_out" binding:"required,gtfield=CheckIn" time_format:"2006-01-02"`
}

func main() {
    setupValidators()

    r := gin.Default()

    r.POST("/register", func(c *gin.Context) {
        var user UserRegistration

        if err := c.ShouldBindJSON(&user); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
            })
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "message": "注册成功",
        })
    })

    r.GET("/bookable", func(c *gin.Context) {
        var booking Booking

        if err := c.ShouldBindQuery(&booking); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
            })
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "message":   "预约日期有效",
            "check_in":  booking.CheckIn,
            "check_out": booking.CheckOut,
        })
    })

    r.Run(":8080")
}
```

### 自定义验证错误消息

```go
import (
    "github.com/go-playground/validator/v10"
)

func translateValidationErrors(err error) map[string]string {
    errors := make(map[string]string)

    if validationErrors, ok := err.(validator.ValidationErrors); ok {
        for _, e := range validationErrors {
            field := e.Field()
            tag := e.Tag()
            param := e.Param()

            switch tag {
            case "required":
                errors[field] = fmt.Sprintf("%s是必填字段", field)
            case "min":
                errors[field] = fmt.Sprintf("%s长度不能小于%s", field, param)
            case "max":
                errors[field] = fmt.Sprintf("%s长度不能大于%s", field, param)
            case "email":
                errors[field] = fmt.Sprintf("%s必须是有效的邮箱地址", field)
            case "phone":
                errors[field] = fmt.Sprintf("%s必须是有效的手机号码", field)
            case "oneof":
                errors[field] = fmt.Sprintf("%s必须是以下值之一: %s", field, param)
            default:
                errors[field] = fmt.Sprintf("%s验证失败: %s", field, tag)
            }
        }
    }

    return errors
}

func createUser(c *gin.Context) {
    var user UserRegistration

    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "errors": translateValidationErrors(err),
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "成功"})
}
```

## 响应处理

### JSON响应

```go
// 使用gin.H (map[string]interface{}的别名)
r.GET("/json1", func(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "message": "hello",
        "status":  200,
    })
})

// 使用结构体
type Response struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}

r.GET("/json2", func(c *gin.Context) {
    c.JSON(http.StatusOK, Response{
        Code:    0,
        Message: "success",
        Data: map[string]string{
            "name": "张三",
        },
    })
})

// 安全JSON (防止JSON劫持)
r.GET("/secure-json", func(c *gin.Context) {
    c.SecureJSON(http.StatusOK, []string{"a", "b", "c"})
    // 输出: while(1);["a","b","c"]
})

// 纯JSON (不转义HTML)
r.GET("/pure-json", func(c *gin.Context) {
    c.PureJSON(http.StatusOK, gin.H{
        "html": "<b>Hello, world!</b>",
    })
})

// JSONP
r.GET("/jsonp", func(c *gin.Context) {
    c.JSONP(http.StatusOK, gin.H{
        "message": "jsonp",
    })
    // 请求 /jsonp?callback=x 输出: x({"message":"jsonp"})
})

// 缩进JSON
r.GET("/indent-json", func(c *gin.Context) {
    c.IndentedJSON(http.StatusOK, gin.H{
        "message": "hello",
        "data": gin.H{
            "name": "张三",
            "age":  25,
        },
    })
})

// ASCII JSON
r.GET("/ascii-json", func(c *gin.Context) {
    c.AsciiJSON(http.StatusOK, gin.H{
        "message": "你好世界",
    })
    // 输出: {"message":"\u4f60\u597d\u4e16\u754c"}
})
```

### XML响应

```go
type User struct {
    XMLName xml.Name `xml:"user"`
    Name    string   `xml:"name"`
    Email   string   `xml:"email"`
    Age     int      `xml:"age"`
}

r.GET("/xml", func(c *gin.Context) {
    c.XML(http.StatusOK, User{
        Name:  "张三",
        Email: "zhangsan@example.com",
        Age:   30,
    })
})
```

### YAML响应

```go
r.GET("/yaml", func(c *gin.Context) {
    c.YAML(http.StatusOK, gin.H{
        "name":  "张三",
        "email": "zhangsan@example.com",
        "age":   30,
    })
})
```

### 文件响应

```go
// 返回文件内容
r.GET("/file", func(c *gin.Context) {
    c.File("./assets/document.pdf")
})

// 文件下载（设置Content-Disposition）
r.GET("/download", func(c *gin.Context) {
    c.FileAttachment("./assets/document.pdf", "下载文档.pdf")
})

// 从Reader返回文件
r.GET("/reader", func(c *gin.Context) {
    data, _ := ioutil.ReadFile("./assets/data.json")
    reader := bytes.NewReader(data)
    contentLength := int64(len(data))
    contentType := "application/json"
    extraHeaders := map[string]string{
        "Content-Disposition": `attachment; filename="data.json"`,
    }

    c.DataFromReader(http.StatusOK, contentLength, contentType, reader, extraHeaders)
})

// 静态文件服务
r.Static("/assets", "./assets")
r.StaticFile("/favicon.ico", "./resources/favicon.ico")
r.StaticFS("/static", http.Dir("./static"))
```

### HTML渲染

```go
func main() {
    r := gin.Default()

    // 加载HTML模板
    r.LoadHTMLGlob("templates/*")
    // 或指定多个目录
    // r.LoadHTMLGlob("templates/**/*")

    // 自定义模板函数
    r.SetFuncMap(template.FuncMap{
        "formatDate": func(t time.Time) string {
            return t.Format("2006-01-02")
        },
        "upper": strings.ToUpper,
    })

    r.GET("/index", func(c *gin.Context) {
        c.HTML(http.StatusOK, "index.html", gin.H{
            "title": "主页",
            "user":  "张三",
            "items": []string{"项目1", "项目2", "项目3"},
        })
    })

    r.Run(":8080")
}
```

### 重定向

```go
// HTTP重定向
r.GET("/redirect", func(c *gin.Context) {
    c.Redirect(http.StatusMovedPermanently, "https://www.example.com")
})

// 临时重定向
r.GET("/temp-redirect", func(c *gin.Context) {
    c.Redirect(http.StatusFound, "/new-location")
})

// 内部路由重定向
r.GET("/test", func(c *gin.Context) {
    c.Request.URL.Path = "/test2"
    r.HandleContext(c)
})

r.GET("/test2", func(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"message": "test2"})
})
```

### 流式响应

```go
// Server-Sent Events
r.GET("/stream", func(c *gin.Context) {
    c.Writer.Header().Set("Content-Type", "text/event-stream")
    c.Writer.Header().Set("Cache-Control", "no-cache")
    c.Writer.Header().Set("Connection", "keep-alive")

    chanStream := make(chan int, 10)

    go func() {
        defer close(chanStream)
        for i := 0; i < 10; i++ {
            chanStream <- i
            time.Sleep(time.Second)
        }
    }()

    c.Stream(func(w io.Writer) bool {
        if msg, ok := <-chanStream; ok {
            c.SSEvent("message", gin.H{
                "count": msg,
                "time":  time.Now().Format(time.RFC3339),
            })
            return true
        }
        return false
    })
})

// 分块传输
r.GET("/chunked", func(c *gin.Context) {
    c.Writer.Header().Set("Transfer-Encoding", "chunked")
    c.Writer.Header().Set("Content-Type", "text/plain")

    for i := 0; i < 5; i++ {
        c.Writer.Write([]byte(fmt.Sprintf("chunk %d\n", i)))
        c.Writer.Flush()
        time.Sleep(time.Second)
    }
})
```

## 错误处理

### 基本错误处理

```go
func getUserByID(c *gin.Context) {
    id := c.Param("id")

    user, err := findUserByID(id)
    if err != nil {
        // 记录错误到上下文
        c.Error(err)

        if errors.Is(err, ErrNotFound) {
            c.JSON(http.StatusNotFound, gin.H{
                "error": "用户不存在",
            })
            return
        }

        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "服务器内部错误",
        })
        return
    }

    c.JSON(http.StatusOK, user)
}
```

### 自定义错误类型

```go
type AppError struct {
    Code       int    `json:"code"`
    Message    string `json:"message"`
    Details    string `json:"details,omitempty"`
    HTTPStatus int    `json:"-"`
}

func (e *AppError) Error() string {
    return e.Message
}

// 预定义错误
var (
    ErrNotFound = &AppError{
        Code:       10001,
        Message:    "资源不存在",
        HTTPStatus: http.StatusNotFound,
    }
    ErrUnauthorized = &AppError{
        Code:       10002,
        Message:    "未授权访问",
        HTTPStatus: http.StatusUnauthorized,
    }
    ErrBadRequest = &AppError{
        Code:       10003,
        Message:    "请求参数错误",
        HTTPStatus: http.StatusBadRequest,
    }
    ErrInternal = &AppError{
        Code:       10004,
        Message:    "服务器内部错误",
        HTTPStatus: http.StatusInternalServerError,
    }
)

func NewAppError(code int, message string, httpStatus int) *AppError {
    return &AppError{
        Code:       code,
        Message:    message,
        HTTPStatus: httpStatus,
    }
}

func (e *AppError) WithDetails(details string) *AppError {
    return &AppError{
        Code:       e.Code,
        Message:    e.Message,
        Details:    details,
        HTTPStatus: e.HTTPStatus,
    }
}
```

### 全局错误处理中间件

```go
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()

        // 检查是否有错误
        if len(c.Errors) == 0 {
            return
        }

        err := c.Errors.Last().Err

        // 检查是否是自定义错误
        var appErr *AppError
        if errors.As(err, &appErr) {
            c.JSON(appErr.HTTPStatus, appErr)
            return
        }

        // 检查是否是验证错误
        var validationErrors validator.ValidationErrors
        if errors.As(err, &validationErrors) {
            c.JSON(http.StatusBadRequest, gin.H{
                "code":    10003,
                "message": "请求参数验证失败",
                "errors":  translateValidationErrors(validationErrors),
            })
            return
        }

        // 默认错误处理
        log.Printf("未处理的错误: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{
            "code":    10000,
            "message": "服务器内部错误",
        })
    }
}

func main() {
    r := gin.New()
    r.Use(gin.Logger())
    r.Use(gin.Recovery())
    r.Use(ErrorHandler())

    r.GET("/user/:id", func(c *gin.Context) {
        id := c.Param("id")
        user, err := findUser(id)
        if err != nil {
            c.Error(err)
            return
        }
        c.JSON(http.StatusOK, user)
    })

    r.Run(":8080")
}

func findUser(id string) (*User, error) {
    if id == "0" {
        return nil, ErrNotFound.WithDetails("用户ID: " + id)
    }
    return &User{ID: id, Name: "张三"}, nil
}
```

### Panic恢复

```go
func main() {
    r := gin.New()
    r.Use(gin.Logger())

    // 自定义Recovery中间件
    r.Use(gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
        // 记录错误
        log.Printf("Panic recovered: %v\n%s", recovered, debug.Stack())

        // 返回友好的错误响应
        c.JSON(http.StatusInternalServerError, gin.H{
            "code":    50000,
            "message": "服务器发生异常，请稍后重试",
        })
    }))

    r.GET("/panic", func(c *gin.Context) {
        panic("发生了严重错误")
    })

    r.Run(":8080")
}
```

## 认证

### Basic Auth

```go
func main() {
    r := gin.Default()

    // 模拟用户数据
    secrets := gin.H{
        "admin": gin.H{"email": "admin@example.com", "role": "admin"},
        "user":  gin.H{"email": "user@example.com", "role": "user"},
    }

    // 使用BasicAuth中间件
    authorized := r.Group("/admin", gin.BasicAuth(gin.Accounts{
        "admin": "admin123",
        "user":  "user123",
    }))

    authorized.GET("/secrets", func(c *gin.Context) {
        // 获取认证用户名
        user := c.MustGet(gin.AuthUserKey).(string)

        if secret, ok := secrets[user]; ok {
            c.JSON(http.StatusOK, gin.H{
                "user":   user,
                "secret": secret,
            })
        } else {
            c.JSON(http.StatusOK, gin.H{
                "user":   user,
                "secret": "无特殊信息",
            })
        }
    })

    r.Run(":8080")
}
```

### JWT认证

```go
import (
    "time"
    "github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-secret-key")

type Claims struct {
    UserID   string `json:"user_id"`
    Username string `json:"username"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}

// 生成JWT Token
func generateToken(userID, username, role string) (string, error) {
    claims := Claims{
        UserID:   userID,
        Username: username,
        Role:     role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
            Issuer:    "my-app",
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

// 解析JWT Token
func parseToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("无效的签名方法")
        }
        return jwtSecret, nil
    })

    if err != nil {
        return nil, err
    }

    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }

    return nil, fmt.Errorf("无效的token")
}

// JWT认证中间件
func JWTAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")

        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "未提供认证令牌",
            })
            c.Abort()
            return
        }

        // 解析 Bearer token
        parts := strings.SplitN(authHeader, " ", 2)
        if !(len(parts) == 2 && parts[0] == "Bearer") {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "认证令牌格式错误",
            })
            c.Abort()
            return
        }

        claims, err := parseToken(parts[1])
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{
                "error": "无效的认证令牌: " + err.Error(),
            })
            c.Abort()
            return
        }

        // 将用户信息存入上下文
        c.Set("userID", claims.UserID)
        c.Set("username", claims.Username)
        c.Set("role", claims.Role)
        c.Next()
    }
}

// 角色验证中间件
func RoleRequired(roles ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userRole := c.GetString("role")

        for _, role := range roles {
            if userRole == role {
                c.Next()
                return
            }
        }

        c.JSON(http.StatusForbidden, gin.H{
            "error": "权限不足",
        })
        c.Abort()
    }
}

func main() {
    r := gin.Default()

    // 登录路由
    r.POST("/login", func(c *gin.Context) {
        var loginReq struct {
            Username string `json:"username" binding:"required"`
            Password string `json:"password" binding:"required"`
        }

        if err := c.ShouldBindJSON(&loginReq); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        // 验证用户（示例）
        if loginReq.Username == "admin" && loginReq.Password == "123456" {
            token, _ := generateToken("1", "admin", "admin")
            c.JSON(http.StatusOK, gin.H{
                "token": token,
            })
            return
        }

        c.JSON(http.StatusUnauthorized, gin.H{
            "error": "用户名或密码错误",
        })
    })

    // 受保护的路由
    protected := r.Group("/api")
    protected.Use(JWTAuth())
    {
        protected.GET("/profile", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{
                "user_id":  c.GetString("userID"),
                "username": c.GetString("username"),
                "role":     c.GetString("role"),
            })
        })

        // 需要管理员权限
        admin := protected.Group("/admin")
        admin.Use(RoleRequired("admin"))
        {
            admin.GET("/users", func(c *gin.Context) {
                c.JSON(http.StatusOK, gin.H{
                    "users": []string{"user1", "user2"},
                })
            })
        }
    }

    r.Run(":8080")
}
```

### Token刷新

```go
// 刷新Token
func refreshToken(c *gin.Context) {
    var req struct {
        RefreshToken string `json:"refresh_token" binding:"required"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    claims, err := parseToken(req.RefreshToken)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的刷新令牌"})
        return
    }

    // 生成新的访问令牌
    newToken, _ := generateToken(claims.UserID, claims.Username, claims.Role)

    c.JSON(http.StatusOK, gin.H{
        "token": newToken,
    })
}
```

## 完整示例：RESTful API

```go
package main

import (
    "context"
    "errors"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "strconv"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/gin-gonic/gin/binding"
    "github.com/go-playground/validator/v10"
)

// 数据模型
type User struct {
    ID        int       `json:"id"`
    Username  string    `json:"username" binding:"required,min=3,max=20"`
    Email     string    `json:"email" binding:"required,email"`
    Age       int       `json:"age" binding:"omitempty,gte=0,lte=150"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

// 统一响应格式
type Response struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}

func Success(c *gin.Context, data interface{}) {
    c.JSON(http.StatusOK, Response{
        Code:    0,
        Message: "success",
        Data:    data,
    })
}

func Error(c *gin.Context, httpStatus int, code int, message string) {
    c.JSON(httpStatus, Response{
        Code:    code,
        Message: message,
    })
}

// 模拟数据库
var users = []User{
    {ID: 1, Username: "zhangsan", Email: "zhangsan@example.com", Age: 25, CreatedAt: time.Now(), UpdatedAt: time.Now()},
    {ID: 2, Username: "lisi", Email: "lisi@example.com", Age: 30, CreatedAt: time.Now(), UpdatedAt: time.Now()},
}
var nextID = 3

// 中间件
func RequestLogger() gin.HandlerFunc {
    return func(c *gin.Context) {
        startTime := time.Now()
        c.Next()
        latency := time.Since(startTime)
        log.Printf("[%s] %s %s %d %v",
            c.ClientIP(),
            c.Request.Method,
            c.Request.URL.Path,
            c.Writer.Status(),
            latency,
        )
    }
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

// 自定义验证器
func setupValidators() {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterValidation("username", func(fl validator.FieldLevel) bool {
            username := fl.Field().String()
            // 用户名只能包含字母、数字和下划线
            for _, char := range username {
                if !((char >= 'a' && char <= 'z') ||
                    (char >= 'A' && char <= 'Z') ||
                    (char >= '0' && char <= '9') ||
                    char == '_') {
                    return false
                }
            }
            return true
        })
    }
}

// 处理器
func listUsers(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

    start := (page - 1) * pageSize
    end := start + pageSize

    if start > len(users) {
        start = len(users)
    }
    if end > len(users) {
        end = len(users)
    }

    Success(c, gin.H{
        "users": users[start:end],
        "total": len(users),
        "page":  page,
        "size":  pageSize,
    })
}

func getUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        Error(c, http.StatusBadRequest, 10001, "无效的用户ID")
        return
    }

    for _, user := range users {
        if user.ID == id {
            Success(c, user)
            return
        }
    }

    Error(c, http.StatusNotFound, 10002, "用户不存在")
}

func createUser(c *gin.Context) {
    var newUser User

    if err := c.ShouldBindJSON(&newUser); err != nil {
        Error(c, http.StatusBadRequest, 10003, err.Error())
        return
    }

    // 检查用户名是否已存在
    for _, u := range users {
        if u.Username == newUser.Username {
            Error(c, http.StatusConflict, 10004, "用户名已存在")
            return
        }
    }

    newUser.ID = nextID
    nextID++
    newUser.CreatedAt = time.Now()
    newUser.UpdatedAt = time.Now()
    users = append(users, newUser)

    c.JSON(http.StatusCreated, Response{
        Code:    0,
        Message: "用户创建成功",
        Data:    newUser,
    })
}

func updateUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        Error(c, http.StatusBadRequest, 10001, "无效的用户ID")
        return
    }

    var updateData User
    if err := c.ShouldBindJSON(&updateData); err != nil {
        Error(c, http.StatusBadRequest, 10003, err.Error())
        return
    }

    for i, user := range users {
        if user.ID == id {
            users[i].Username = updateData.Username
            users[i].Email = updateData.Email
            users[i].Age = updateData.Age
            users[i].UpdatedAt = time.Now()

            Success(c, users[i])
            return
        }
    }

    Error(c, http.StatusNotFound, 10002, "用户不存在")
}

func deleteUser(c *gin.Context) {
    id, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        Error(c, http.StatusBadRequest, 10001, "无效的用户ID")
        return
    }

    for i, user := range users {
        if user.ID == id {
            users = append(users[:i], users[i+1:]...)
            Success(c, gin.H{"message": "用户删除成功"})
            return
        }
    }

    Error(c, http.StatusNotFound, 10002, "用户不存在")
}

func setupRouter() *gin.Engine {
    gin.SetMode(gin.ReleaseMode)
    r := gin.New()

    // 全局中间件
    r.Use(RequestLogger())
    r.Use(gin.Recovery())
    r.Use(CORSMiddleware())

    // 健康检查
    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "status": "ok",
            "time":   time.Now().Format(time.RFC3339),
        })
    })

    // API路由组
    api := r.Group("/api/v1")
    {
        userGroup := api.Group("/users")
        {
            userGroup.GET("", listUsers)
            userGroup.GET("/:id", getUser)
            userGroup.POST("", createUser)
            userGroup.PUT("/:id", updateUser)
            userGroup.DELETE("/:id", deleteUser)
        }
    }

    return r
}

func main() {
    setupValidators()
    r := setupRouter()

    srv := &http.Server{
        Addr:    ":8080",
        Handler: r,
    }

    // 在goroutine中启动服务器
    go func() {
        log.Printf("服务器启动在 http://localhost%s", srv.Addr)
        if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            log.Fatalf("监听失败: %s\n", err)
        }
    }()

    // 等待中断信号以优雅关闭服务器
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("正在关闭服务器...")

    // 设置5秒超时
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("服务器强制关闭:", err)
    }

    log.Println("服务器已退出")
}
```

## 最佳实践

### 项目结构

```
project/
├── main.go
├── config/
│   └── config.go
├── internal/
│   ├── handler/
│   │   ├── user.go
│   │   └── product.go
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── cors.go
│   │   └── logger.go
│   ├── model/
│   │   ├── user.go
│   │   └── product.go
│   ├── repository/
│   │   ├── user.go
│   │   └── product.go
│   ├── service/
│   │   ├── user.go
│   │   └── product.go
│   └── router/
│       └── router.go
├── pkg/
│   ├── response/
│   │   └── response.go
│   └── validator/
│       └── validator.go
└── go.mod
```

### 配置管理

```go
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    JWT      JWTConfig
}

type ServerConfig struct {
    Port         string
    Mode         string
    ReadTimeout  time.Duration
    WriteTimeout time.Duration
}

func LoadConfig() *Config {
    return &Config{
        Server: ServerConfig{
            Port:         getEnv("SERVER_PORT", ":8080"),
            Mode:         getEnv("GIN_MODE", "debug"),
            ReadTimeout:  30 * time.Second,
            WriteTimeout: 30 * time.Second,
        },
    }
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
```

### 优雅关闭

```go
func main() {
    r := setupRouter()

    srv := &http.Server{
        Addr:         ":8080",
        Handler:      r,
        ReadTimeout:  30 * time.Second,
        WriteTimeout: 30 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    go func() {
        if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            log.Fatalf("监听失败: %s\n", err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("关闭服务器...")

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("服务器强制关闭:", err)
    }

    log.Println("服务器退出")
}
```

### 性能优化

```go
func main() {
    // 设置发布模式
    gin.SetMode(gin.ReleaseMode)

    // 禁用控制台颜色
    gin.DisableConsoleColor()

    // 使用不带中间件的引擎
    r := gin.New()
    r.Use(gin.Recovery())

    // 设置受信任的代理
    r.SetTrustedProxies([]string{"127.0.0.1"})

    // 限制请求体大小
    r.MaxMultipartMemory = 8 << 20 // 8 MB

    // 使用连接池的HTTP服务器
    srv := &http.Server{
        Addr:           ":8080",
        Handler:        r,
        ReadTimeout:    10 * time.Second,
        WriteTimeout:   10 * time.Second,
        MaxHeaderBytes: 1 << 20,
    }

    srv.ListenAndServe()
}
```

### 日志配置

```go
import (
    "io"
    "os"

    "github.com/gin-gonic/gin"
)

func setupLogging() {
    // 创建日志文件
    f, _ := os.Create("gin.log")

    // 同时写入文件和控制台
    gin.DefaultWriter = io.MultiWriter(f, os.Stdout)

    // 自定义日志格式
    gin.DebugPrintRouteFunc = func(httpMethod, absolutePath, handlerName string, nuHandlers int) {
        log.Printf("路由: %v %v -> %v (%v 处理器)\n",
            httpMethod, absolutePath, handlerName, nuHandlers)
    }
}
```

## 总结

Gin是一个功能强大且高效的Web框架，具有以下特点：

- **高性能**：基于httprouter，比同类框架快40倍
- **中间件支持**：灵活的中间件系统，支持全局、路由组和单路由中间件
- **路由分组**：方便的路由组织方式，支持API版本控制
- **数据绑定与验证**：强大的请求处理能力，支持JSON、表单、URI等多种绑定方式
- **多种渲染方式**：支持JSON、XML、YAML、HTML等多种响应格式
- **错误处理**：完善的错误处理机制，支持自定义错误类型和全局错误处理
- **认证支持**：内置Basic Auth，易于集成JWT等认证方案

掌握这些核心功能后，你就可以使用Gin框架构建高质量的Web应用和RESTful API了。
