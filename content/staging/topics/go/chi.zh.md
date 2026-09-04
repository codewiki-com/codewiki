---
title: Chi 路由框架指南
description: Chi 完全指南，一个轻量级、符合 Go 风格且可组合的 HTTP 服务路由器
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Chi
  - 路由器
  - HTTP
  - REST
  - 中间件
status: imported
origin: old/src/content/docs/go/chi.zh.md
divergence: 0.251
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Go
  subcategory: ""
  order: 53
  lastUpdated: 2026-01-21
---

Chi 是一个轻量级、符合 Go 语言风格且可组合的路由器，用于构建 Go HTTP 服务。它围绕 Go 的 `net/http` 标准库设计，提供了一种简单而强大的方式来构建带中间件支持的 RESTful API。

## 概念解释

Chi（发音为"chai"）是一个强调以下特点的路由器：

- **轻量级**：除 Go 标准库外无外部依赖
- **符合 Go 风格**：基于 `net/http` 构建，使用标准的 `http.Handler` 和 `http.HandlerFunc`
- **可组合**：中间件栈和子路由器支持模块化设计
- **100% 兼容 net/http**：可与任何 `http.Handler` 中间件配合使用

```go
package main

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func main() {
    r := chi.NewRouter()

    // 添加中间件
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    // 路由
    r.Get("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("你好，Chi！"))
    })

    r.Get("/users/{id}", func(w http.ResponseWriter, r *http.Request) {
        id := chi.URLParam(r, "id")
        w.Write([]byte("用户 ID: " + id))
    })

    http.ListenAndServe(":3000", r)
}
```

## 核心原理

### 路由树结构

Chi 使用基数树（Radix Tree）实现高效的 URL 路由：

```go
package main

import (
    "fmt"
    "net/http"

    "github.com/go-chi/chi/v5"
)

func main() {
    r := chi.NewRouter()

    // 静态路由
    r.Get("/", homeHandler)
    r.Get("/about", aboutHandler)

    // 参数化路由
    r.Get("/users/{userID}", getUserHandler)
    r.Get("/users/{userID}/posts/{postID}", getPostHandler)

    // 通配符路由
    r.Get("/files/*", fileHandler)

    // 正则约束
    r.Get("/articles/{articleID:[0-9]+}", articleHandler)
    r.Get("/categories/{slug:[a-z-]+}", categoryHandler)

    // 打印路由
    chi.Walk(r, func(method, route string, handler http.Handler, middlewares ...func(http.Handler) http.Handler) error {
        fmt.Printf("[%s] %s\n", method, route)
        return nil
    })

    http.ListenAndServe(":3000", r)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("首页"))
}

func aboutHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("关于"))
}

func getUserHandler(w http.ResponseWriter, r *http.Request) {
    userID := chi.URLParam(r, "userID")
    w.Write([]byte("用户: " + userID))
}

func getPostHandler(w http.ResponseWriter, r *http.Request) {
    userID := chi.URLParam(r, "userID")
    postID := chi.URLParam(r, "postID")
    w.Write([]byte(fmt.Sprintf("用户 %s，文章 %s", userID, postID)))
}

func fileHandler(w http.ResponseWriter, r *http.Request) {
    path := chi.URLParam(r, "*")
    w.Write([]byte("文件路径: " + path))
}

func articleHandler(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "articleID")
    w.Write([]byte("文章 ID（数字）: " + id))
}

func categoryHandler(w http.ResponseWriter, r *http.Request) {
    slug := chi.URLParam(r, "slug")
    w.Write([]byte("分类别名: " + slug))
}
```

### 中间件链

Chi 中的中间件遵循标准的 `http.Handler` 模式：

```go
package main

import (
    "context"
    "log"
    "net/http"
    "time"

    "github.com/go-chi/chi/v5"
)

// 自定义日志中间件
func RequestLogger(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // 创建响应写入器包装器以捕获状态码
        ww := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

        next.ServeHTTP(ww, r)

        log.Printf(
            "%s %s %d %v",
            r.Method,
            r.URL.Path,
            ww.statusCode,
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

// 向 context 添加值的中间件
func UserContext(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        userID := r.Header.Get("X-User-ID")
        if userID == "" {
            userID = "anonymous"
        }

        ctx := context.WithValue(r.Context(), "userID", userID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// 超时中间件
func Timeout(timeout time.Duration) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            ctx, cancel := context.WithTimeout(r.Context(), timeout)
            defer cancel()

            r = r.WithContext(ctx)
            next.ServeHTTP(w, r)
        })
    }
}

func main() {
    r := chi.NewRouter()

    // 全局中间件
    r.Use(RequestLogger)
    r.Use(UserContext)
    r.Use(Timeout(30 * time.Second))

    r.Get("/", func(w http.ResponseWriter, r *http.Request) {
        userID := r.Context().Value("userID").(string)
        w.Write([]byte("你好, " + userID))
    })

    http.ListenAndServe(":3000", r)
}
```

## 核心要点

### 子路由器和分组

```go
package main

import (
    "encoding/json"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func main() {
    r := chi.NewRouter()

    // 全局中间件
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    // 公开路由
    r.Group(func(r chi.Router) {
        r.Get("/", homeHandler)
        r.Get("/health", healthHandler)
    })

    // 带版本的 API 路由
    r.Route("/api", func(r chi.Router) {
        r.Use(apiMiddleware)

        // v1 API
        r.Route("/v1", func(r chi.Router) {
            r.Mount("/users", usersResource{}.Routes())
            r.Mount("/posts", postsResource{}.Routes())
        })

        // v2 API
        r.Route("/v2", func(r chi.Router) {
            r.Mount("/users", usersResourceV2{}.Routes())
        })
    })

    // 带认证的管理路由
    r.Route("/admin", func(r chi.Router) {
        r.Use(adminAuthMiddleware)
        r.Get("/dashboard", adminDashboard)
        r.Get("/users", adminUsers)
    })

    http.ListenAndServe(":3000", r)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("首页"))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func apiMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        next.ServeHTTP(w, r)
    })
}

func adminAuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token != "Bearer admin-token" {
            http.Error(w, "未授权", http.StatusUnauthorized)
            return
        }
        next.ServeHTTP(w, r)
    })
}

func adminDashboard(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("管理仪表板"))
}

func adminUsers(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("管理用户"))
}

// 资源模式
type usersResource struct{}

func (rs usersResource) Routes() chi.Router {
    r := chi.NewRouter()

    r.Get("/", rs.List)
    r.Post("/", rs.Create)
    r.Route("/{id}", func(r chi.Router) {
        r.Get("/", rs.Get)
        r.Put("/", rs.Update)
        r.Delete("/", rs.Delete)
    })

    return r
}

func (rs usersResource) List(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode([]string{"user1", "user2"})
}

func (rs usersResource) Create(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusCreated)
    w.Write([]byte(`{"id": "new-user"}`))
}

func (rs usersResource) Get(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    json.NewEncoder(w).Encode(map[string]string{"id": id})
}

func (rs usersResource) Update(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    json.NewEncoder(w).Encode(map[string]string{"id": id, "updated": "true"})
}

func (rs usersResource) Delete(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusNoContent)
}

type postsResource struct{}

func (rs postsResource) Routes() chi.Router {
    r := chi.NewRouter()
    r.Get("/", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode([]string{"post1", "post2"})
    })
    return r
}

type usersResourceV2 struct{}

func (rs usersResourceV2) Routes() chi.Router {
    r := chi.NewRouter()
    r.Get("/", func(w http.ResponseWriter, r *http.Request) {
        json.NewEncoder(w).Encode(map[string]interface{}{
            "version": "v2",
            "users":   []string{"user1", "user2"},
        })
    })
    return r
}
```

### Context 值和 URL 参数

```go
package main

import (
    "context"
    "encoding/json"
    "net/http"

    "github.com/go-chi/chi/v5"
)

type contextKey string

const (
    userContextKey contextKey = "user"
    postContextKey contextKey = "post"
)

type User struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}

type Post struct {
    ID      string `json:"id"`
    Title   string `json:"title"`
    UserID  string `json:"user_id"`
}

// 模拟数据库
var users = map[string]User{
    "1": {ID: "1", Name: "Alice"},
    "2": {ID: "2", Name: "Bob"},
}

var posts = map[string]Post{
    "101": {ID: "101", Title: "Hello World", UserID: "1"},
    "102": {ID: "102", Title: "Go is great", UserID: "1"},
}

// 用户 Context 中间件
func UserCtx(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        userID := chi.URLParam(r, "userID")

        user, ok := users[userID]
        if !ok {
            http.Error(w, "用户未找到", http.StatusNotFound)
            return
        }

        ctx := context.WithValue(r.Context(), userContextKey, user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// 文章 Context 中间件
func PostCtx(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        postID := chi.URLParam(r, "postID")

        post, ok := posts[postID]
        if !ok {
            http.Error(w, "文章未找到", http.StatusNotFound)
            return
        }

        // 验证文章属于 context 中的用户
        if user, ok := r.Context().Value(userContextKey).(User); ok {
            if post.UserID != user.ID {
                http.Error(w, "文章未找到", http.StatusNotFound)
                return
            }
        }

        ctx := context.WithValue(r.Context(), postContextKey, post)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func main() {
    r := chi.NewRouter()

    r.Route("/users/{userID}", func(r chi.Router) {
        r.Use(UserCtx)

        r.Get("/", getUser)
        r.Get("/posts", getUserPosts)

        r.Route("/posts/{postID}", func(r chi.Router) {
            r.Use(PostCtx)
            r.Get("/", getPost)
        })
    })

    http.ListenAndServe(":3000", r)
}

func getUser(w http.ResponseWriter, r *http.Request) {
    user := r.Context().Value(userContextKey).(User)
    json.NewEncoder(w).Encode(user)
}

func getUserPosts(w http.ResponseWriter, r *http.Request) {
    user := r.Context().Value(userContextKey).(User)

    var userPosts []Post
    for _, post := range posts {
        if post.UserID == user.ID {
            userPosts = append(userPosts, post)
        }
    }

    json.NewEncoder(w).Encode(userPosts)
}

func getPost(w http.ResponseWriter, r *http.Request) {
    post := r.Context().Value(postContextKey).(Post)
    json.NewEncoder(w).Encode(post)
}
```

## 代码示例

### RESTful CRUD API

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "sync"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

type Article struct {
    ID        string    `json:"id"`
    Title     string    `json:"title"`
    Content   string    `json:"content"`
    Author    string    `json:"author"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type ArticleStore struct {
    mu       sync.RWMutex
    articles map[string]Article
    nextID   int
}

func NewArticleStore() *ArticleStore {
    return &ArticleStore{
        articles: make(map[string]Article),
        nextID:   1,
    }
}

func (s *ArticleStore) List() []Article {
    s.mu.RLock()
    defer s.mu.RUnlock()

    articles := make([]Article, 0, len(s.articles))
    for _, a := range s.articles {
        articles = append(articles, a)
    }
    return articles
}

func (s *ArticleStore) Get(id string) (Article, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()

    a, ok := s.articles[id]
    return a, ok
}

func (s *ArticleStore) Create(a Article) Article {
    s.mu.Lock()
    defer s.mu.Unlock()

    a.ID = fmt.Sprintf("%d", s.nextID)
    s.nextID++
    a.CreatedAt = time.Now()
    a.UpdatedAt = a.CreatedAt
    s.articles[a.ID] = a
    return a
}

func (s *ArticleStore) Update(id string, a Article) (Article, bool) {
    s.mu.Lock()
    defer s.mu.Unlock()

    existing, ok := s.articles[id]
    if !ok {
        return Article{}, false
    }

    a.ID = id
    a.CreatedAt = existing.CreatedAt
    a.UpdatedAt = time.Now()
    s.articles[id] = a
    return a, true
}

func (s *ArticleStore) Delete(id string) bool {
    s.mu.Lock()
    defer s.mu.Unlock()

    _, ok := s.articles[id]
    if ok {
        delete(s.articles, id)
    }
    return ok
}

type ArticleHandler struct {
    store *ArticleStore
}

func (h *ArticleHandler) Routes() chi.Router {
    r := chi.NewRouter()

    r.Get("/", h.List)
    r.Post("/", h.Create)

    r.Route("/{id}", func(r chi.Router) {
        r.Get("/", h.Get)
        r.Put("/", h.Update)
        r.Patch("/", h.PartialUpdate)
        r.Delete("/", h.Delete)
    })

    return r
}

func (h *ArticleHandler) List(w http.ResponseWriter, r *http.Request) {
    articles := h.store.List()

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(articles)
}

func (h *ArticleHandler) Get(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")

    article, ok := h.store.Get(id)
    if !ok {
        http.Error(w, "文章未找到", http.StatusNotFound)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(article)
}

func (h *ArticleHandler) Create(w http.ResponseWriter, r *http.Request) {
    var article Article
    if err := json.NewDecoder(r.Body).Decode(&article); err != nil {
        http.Error(w, "无效的 JSON", http.StatusBadRequest)
        return
    }

    created := h.store.Create(article)

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(created)
}

func (h *ArticleHandler) Update(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")

    var article Article
    if err := json.NewDecoder(r.Body).Decode(&article); err != nil {
        http.Error(w, "无效的 JSON", http.StatusBadRequest)
        return
    }

    updated, ok := h.store.Update(id, article)
    if !ok {
        http.Error(w, "文章未找到", http.StatusNotFound)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(updated)
}

func (h *ArticleHandler) PartialUpdate(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")

    existing, ok := h.store.Get(id)
    if !ok {
        http.Error(w, "文章未找到", http.StatusNotFound)
        return
    }

    var updates map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
        http.Error(w, "无效的 JSON", http.StatusBadRequest)
        return
    }

    // 应用部分更新
    if title, ok := updates["title"].(string); ok {
        existing.Title = title
    }
    if content, ok := updates["content"].(string); ok {
        existing.Content = content
    }
    if author, ok := updates["author"].(string); ok {
        existing.Author = author
    }

    updated, _ := h.store.Update(id, existing)

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(updated)
}

func (h *ArticleHandler) Delete(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")

    if !h.store.Delete(id) {
        http.Error(w, "文章未找到", http.StatusNotFound)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

func main() {
    store := NewArticleStore()
    handler := &ArticleHandler{store: store}

    r := chi.NewRouter()

    // 中间件
    r.Use(middleware.RequestID)
    r.Use(middleware.RealIP)
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.Timeout(60 * time.Second))

    // 挂载路由
    r.Mount("/api/articles", handler.Routes())

    // 健康检查
    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("OK"))
    })

    http.ListenAndServe(":3000", r)
}
```

### 认证和授权

```go
package main

import (
    "context"
    "encoding/json"
    "net/http"
    "strings"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-secret-key")

type Claims struct {
    UserID string   `json:"user_id"`
    Roles  []string `json:"roles"`
    jwt.RegisteredClaims
}

type User struct {
    ID    string   `json:"id"`
    Email string   `json:"email"`
    Roles []string `json:"roles"`
}

// JWT 认证中间件
func JWTAuth(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "缺少授权头", http.StatusUnauthorized)
            return
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            http.Error(w, "无效的授权头", http.StatusUnauthorized)
            return
        }

        tokenString := parts[1]
        claims := &Claims{}

        token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
            return jwtSecret, nil
        })

        if err != nil || !token.Valid {
            http.Error(w, "无效的令牌", http.StatusUnauthorized)
            return
        }

        // 将用户信息添加到 context
        ctx := context.WithValue(r.Context(), "claims", claims)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// 基于角色的授权中间件
func RequireRoles(roles ...string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            claims, ok := r.Context().Value("claims").(*Claims)
            if !ok {
                http.Error(w, "未授权", http.StatusUnauthorized)
                return
            }

            hasRole := false
            for _, requiredRole := range roles {
                for _, userRole := range claims.Roles {
                    if userRole == requiredRole {
                        hasRole = true
                        break
                    }
                }
            }

            if !hasRole {
                http.Error(w, "禁止访问", http.StatusForbidden)
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}

func main() {
    r := chi.NewRouter()

    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    // 公开路由
    r.Post("/login", loginHandler)

    // 受保护的路由
    r.Group(func(r chi.Router) {
        r.Use(JWTAuth)

        r.Get("/profile", profileHandler)

        // 仅管理员路由
        r.Route("/admin", func(r chi.Router) {
            r.Use(RequireRoles("admin"))
            r.Get("/users", adminUsersHandler)
            r.Delete("/users/{id}", adminDeleteUserHandler)
        })

        // 编辑者路由
        r.Route("/content", func(r chi.Router) {
            r.Use(RequireRoles("admin", "editor"))
            r.Post("/articles", createArticleHandler)
            r.Put("/articles/{id}", updateArticleHandler)
        })
    })

    http.ListenAndServe(":3000", r)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
    var creds struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }

    if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
        http.Error(w, "无效的请求", http.StatusBadRequest)
        return
    }

    // 在实际应用中，应该验证凭据
    // 这只是演示
    var roles []string
    if creds.Email == "admin@example.com" {
        roles = []string{"admin", "editor"}
    } else {
        roles = []string{"user"}
    }

    claims := &Claims{
        UserID: "user-123",
        Roles:  roles,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, _ := token.SignedString(jwtSecret)

    json.NewEncoder(w).Encode(map[string]string{
        "token": tokenString,
    })
}

func profileHandler(w http.ResponseWriter, r *http.Request) {
    claims := r.Context().Value("claims").(*Claims)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "user_id": claims.UserID,
        "roles":   claims.Roles,
    })
}

func adminUsersHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("管理员：列出所有用户"))
}

func adminDeleteUserHandler(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    w.Write([]byte("管理员：删除用户 " + id))
}

func createArticleHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("创建文章"))
}

func updateArticleHandler(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    w.Write([]byte("更新文章 " + id))
}
```

## 最佳实践

### 1. 使用资源模式组织路由

```go
package main

import (
    "github.com/go-chi/chi/v5"
)

// Resource 接口用于一致的 API 设计
type Resource interface {
    Routes() chi.Router
}

// BaseResource 提供通用的 CRUD 操作
type BaseResource struct {
    name string
}

func (rs *BaseResource) Routes() chi.Router {
    r := chi.NewRouter()

    r.Get("/", rs.List)
    r.Post("/", rs.Create)

    r.Route("/{id}", func(r chi.Router) {
        r.Use(rs.ItemCtx)
        r.Get("/", rs.Get)
        r.Put("/", rs.Update)
        r.Delete("/", rs.Delete)
    })

    return r
}

// 实现方法...
```

### 2. 结构化错误处理

```go
package main

import (
    "encoding/json"
    "net/http"
)

type APIError struct {
    Status  int    `json:"status"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}

func (e APIError) Error() string {
    return e.Message
}

func WriteError(w http.ResponseWriter, err error) {
    var apiErr APIError

    switch e := err.(type) {
    case APIError:
        apiErr = e
    default:
        apiErr = APIError{
            Status:  http.StatusInternalServerError,
            Message: "内部服务器错误",
        }
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(apiErr.Status)
    json.NewEncoder(w).Encode(apiErr)
}

// 在处理器中使用
func handler(w http.ResponseWriter, r *http.Request) {
    // ...
    if err != nil {
        WriteError(w, APIError{
            Status:  http.StatusBadRequest,
            Message: "无效输入",
            Details: err.Error(),
        })
        return
    }
}
```

## 常见陷阱

### 1. 中间件顺序很重要

```go
package main

import (
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func main() {
    r := chi.NewRouter()

    // 正确的顺序：Logger 应该早于其他中间件以捕获所有请求
    r.Use(middleware.RequestID)  // 1. 生成请求 ID
    r.Use(middleware.RealIP)     // 2. 获取真实 IP
    r.Use(middleware.Logger)     // 3. 记录请求
    r.Use(middleware.Recoverer)  // 4. 从 panic 恢复
    r.Use(middleware.Timeout(60 * time.Second))  // 5. 设置超时

    // 错误：Logger 在 Recoverer 之后无法正确记录 panic
    // r.Use(middleware.Recoverer)
    // r.Use(middleware.Logger)
}
```

### 2. Context 值类型安全

```go
package main

import (
    "context"
    "net/http"
)

// 错误：使用字符串作为 context 键
func badMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx := context.WithValue(r.Context(), "user", user) // 字符串键 - 有冲突风险
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// 正确：使用自定义类型作为 context 键
type contextKey string

const userContextKey contextKey = "user"

func goodMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx := context.WithValue(r.Context(), userContextKey, user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### 3. 未处理 URL 参数缺失

```go
package main

import (
    "net/http"

    "github.com/go-chi/chi/v5"
)

// 错误：假设参数总是存在
func badHandler(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    // 直接使用 id - 可能是空字符串
}

// 正确：验证参数
func goodHandler(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    if id == "" {
        http.Error(w, "缺少 id 参数", http.StatusBadRequest)
        return
    }
    // 使用已验证的 id
}
```

## 性能考量

### 中间件效率

```go
package main

import (
    "net/http"
    "sync"
)

// 使用 sync.Pool 复用频繁分配的对象
var bufferPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 1024)
    },
}

func EfficientMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        buf := bufferPool.Get().([]byte)
        defer bufferPool.Put(buf)

        // 使用缓冲区...

        next.ServeHTTP(w, r)
    })
}
```

## 面试要点

1. **Chi 与其他路由器对比**：
   - Chi：轻量级、兼容标准库、无依赖
   - Gin：功能更多、更快、不兼容标准库
   - Gorilla Mux：功能丰富但更重

2. **中间件模式**：
   - 标准 `func(http.Handler) http.Handler` 签名
   - 按 `r.Use()` 调用顺序执行
   - 可应用于全局、组或单个路由

3. **URL 参数**：
   - `{param}` - 命名参数
   - `{param:[regex]}` - 带正则约束
   - `*` - 通配符

4. **Context 使用**：
   - 使用自定义类型作为 context 键
   - 保持 context 值小
   - 不要在 context 中存储可变状态

5. **子路由器**：
   - `r.Route()` 用于内联子路由
   - `r.Mount()` 用于挂载外部路由器
   - `r.Group()` 用于共享中间件的分组

## 延伸阅读

- [Chi GitHub 仓库](https://github.com/go-chi/chi)
- [Chi 文档](https://go-chi.io/)
- [Chi 示例](https://github.com/go-chi/chi/tree/master/_examples)
- [Go net/http 文档](https://pkg.go.dev/net/http)
- [RESTful API 设计最佳实践](https://restfulapi.net/)
