---
title: Chi Router Framework Guide
description: Complete guide to Chi, a lightweight, idiomatic, and composable router for building Go HTTP services
track: go
section: services-tooling
difficulty: intermediate
tags:
  - Go
  - Chi
  - Router
  - HTTP
  - REST
  - Middleware
status: imported
origin: old/src/content/docs/go/chi.en.md
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

Chi is a lightweight, idiomatic, and composable router for building Go HTTP services. It's designed around Go's `net/http` standard library and provides a simple yet powerful way to build RESTful APIs with middleware support.

## Concept Explanation

Chi (pronounced "chai") is a router that emphasizes:

- **Lightweight**: No external dependencies beyond the Go standard library
- **Idiomatic**: Built on `net/http`, using standard `http.Handler` and `http.HandlerFunc`
- **Composable**: Middleware stack and sub-routers for modular design
- **100% compatible with net/http**: Works with any `http.Handler` middleware

```go
package main

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func main() {
    r := chi.NewRouter()

    // Add middleware
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    // Routes
    r.Get("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello, Chi!"))
    })

    r.Get("/users/{id}", func(w http.ResponseWriter, r *http.Request) {
        id := chi.URLParam(r, "id")
        w.Write([]byte("User ID: " + id))
    })

    http.ListenAndServe(":3000", r)
}
```

## Core Principles

### Router Tree Structure

Chi uses a radix tree for efficient URL routing:

```go
package main

import (
    "fmt"
    "net/http"

    "github.com/go-chi/chi/v5"
)

func main() {
    r := chi.NewRouter()

    // Static routes
    r.Get("/", homeHandler)
    r.Get("/about", aboutHandler)

    // Parameterized routes
    r.Get("/users/{userID}", getUserHandler)
    r.Get("/users/{userID}/posts/{postID}", getPostHandler)

    // Wildcard routes
    r.Get("/files/*", fileHandler)

    // Regex constraints
    r.Get("/articles/{articleID:[0-9]+}", articleHandler)
    r.Get("/categories/{slug:[a-z-]+}", categoryHandler)

    // Print routes
    chi.Walk(r, func(method, route string, handler http.Handler, middlewares ...func(http.Handler) http.Handler) error {
        fmt.Printf("[%s] %s\n", method, route)
        return nil
    })

    http.ListenAndServe(":3000", r)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Home"))
}

func aboutHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("About"))
}

func getUserHandler(w http.ResponseWriter, r *http.Request) {
    userID := chi.URLParam(r, "userID")
    w.Write([]byte("User: " + userID))
}

func getPostHandler(w http.ResponseWriter, r *http.Request) {
    userID := chi.URLParam(r, "userID")
    postID := chi.URLParam(r, "postID")
    w.Write([]byte(fmt.Sprintf("User %s, Post %s", userID, postID)))
}

func fileHandler(w http.ResponseWriter, r *http.Request) {
    path := chi.URLParam(r, "*")
    w.Write([]byte("File path: " + path))
}

func articleHandler(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "articleID")
    w.Write([]byte("Article ID (numeric): " + id))
}

func categoryHandler(w http.ResponseWriter, r *http.Request) {
    slug := chi.URLParam(r, "slug")
    w.Write([]byte("Category slug: " + slug))
}
```

### Middleware Chain

Middleware in Chi follows the standard `http.Handler` pattern:

```go
package main

import (
    "context"
    "log"
    "net/http"
    "time"

    "github.com/go-chi/chi/v5"
)

// Custom middleware for logging
func RequestLogger(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // Create a response writer wrapper to capture status code
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

// Middleware that adds value to context
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

// Timeout middleware
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

    // Global middleware
    r.Use(RequestLogger)
    r.Use(UserContext)
    r.Use(Timeout(30 * time.Second))

    r.Get("/", func(w http.ResponseWriter, r *http.Request) {
        userID := r.Context().Value("userID").(string)
        w.Write([]byte("Hello, " + userID))
    })

    http.ListenAndServe(":3000", r)
}
```

## Key Concepts

### Sub-Routers and Grouping

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

    // Global middleware
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    // Public routes
    r.Group(func(r chi.Router) {
        r.Get("/", homeHandler)
        r.Get("/health", healthHandler)
    })

    // API routes with versioning
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

    // Admin routes with auth
    r.Route("/admin", func(r chi.Router) {
        r.Use(adminAuthMiddleware)
        r.Get("/dashboard", adminDashboard)
        r.Get("/users", adminUsers)
    })

    http.ListenAndServe(":3000", r)
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Home"))
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
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        next.ServeHTTP(w, r)
    })
}

func adminDashboard(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Admin Dashboard"))
}

func adminUsers(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Admin Users"))
}

// Resource pattern
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

### Context Values and URL Parameters

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

// Simulate database
var users = map[string]User{
    "1": {ID: "1", Name: "Alice"},
    "2": {ID: "2", Name: "Bob"},
}

var posts = map[string]Post{
    "101": {ID: "101", Title: "Hello World", UserID: "1"},
    "102": {ID: "102", Title: "Go is great", UserID: "1"},
}

// Context middleware for user
func UserCtx(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        userID := chi.URLParam(r, "userID")

        user, ok := users[userID]
        if !ok {
            http.Error(w, "User not found", http.StatusNotFound)
            return
        }

        ctx := context.WithValue(r.Context(), userContextKey, user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Context middleware for post
func PostCtx(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        postID := chi.URLParam(r, "postID")

        post, ok := posts[postID]
        if !ok {
            http.Error(w, "Post not found", http.StatusNotFound)
            return
        }

        // Verify post belongs to user in context
        if user, ok := r.Context().Value(userContextKey).(User); ok {
            if post.UserID != user.ID {
                http.Error(w, "Post not found", http.StatusNotFound)
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

## Code Examples

### RESTful CRUD API

```go
package main

import (
    "encoding/json"
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
        http.Error(w, "Article not found", http.StatusNotFound)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(article)
}

func (h *ArticleHandler) Create(w http.ResponseWriter, r *http.Request) {
    var article Article
    if err := json.NewDecoder(r.Body).Decode(&article); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
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
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    updated, ok := h.store.Update(id, article)
    if !ok {
        http.Error(w, "Article not found", http.StatusNotFound)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(updated)
}

func (h *ArticleHandler) PartialUpdate(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")

    existing, ok := h.store.Get(id)
    if !ok {
        http.Error(w, "Article not found", http.StatusNotFound)
        return
    }

    var updates map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    // Apply partial updates
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
        http.Error(w, "Article not found", http.StatusNotFound)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

func main() {
    store := NewArticleStore()
    handler := &ArticleHandler{store: store}

    r := chi.NewRouter()

    // Middleware
    r.Use(middleware.RequestID)
    r.Use(middleware.RealIP)
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.Timeout(60 * time.Second))

    // Mount routes
    r.Mount("/api/articles", handler.Routes())

    // Health check
    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("OK"))
    })

    http.ListenAndServe(":3000", r)
}
```

### Authentication and Authorization

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

// JWT Authentication middleware
func JWTAuth(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "Missing authorization header", http.StatusUnauthorized)
            return
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
            return
        }

        tokenString := parts[1]
        claims := &Claims{}

        token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
            return jwtSecret, nil
        })

        if err != nil || !token.Valid {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }

        // Add user info to context
        ctx := context.WithValue(r.Context(), "claims", claims)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Role-based authorization middleware
func RequireRoles(roles ...string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            claims, ok := r.Context().Value("claims").(*Claims)
            if !ok {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
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
                http.Error(w, "Forbidden", http.StatusForbidden)
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

    // Public routes
    r.Post("/login", loginHandler)

    // Protected routes
    r.Group(func(r chi.Router) {
        r.Use(JWTAuth)

        r.Get("/profile", profileHandler)

        // Admin only routes
        r.Route("/admin", func(r chi.Router) {
            r.Use(RequireRoles("admin"))
            r.Get("/users", adminUsersHandler)
            r.Delete("/users/{id}", adminDeleteUserHandler)
        })

        // Editor routes
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
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }

    // In real app, verify credentials against database
    // This is just a demo
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
    w.Write([]byte("Admin: List all users"))
}

func adminDeleteUserHandler(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    w.Write([]byte("Admin: Delete user " + id))
}

func createArticleHandler(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("Create article"))
}

func updateArticleHandler(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    w.Write([]byte("Update article " + id))
}
```

### File Upload Handler

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "path/filepath"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

const (
    maxUploadSize = 10 << 20 // 10 MB
    uploadDir     = "./uploads"
)

type UploadResponse struct {
    Filename string `json:"filename"`
    Size     int64  `json:"size"`
    URL      string `json:"url"`
}

func main() {
    // Ensure upload directory exists
    os.MkdirAll(uploadDir, os.ModePerm)

    r := chi.NewRouter()

    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    // File upload
    r.Post("/upload", uploadHandler)
    r.Post("/upload/multiple", multipleUploadHandler)

    // Serve uploaded files
    fileServer := http.FileServer(http.Dir(uploadDir))
    r.Handle("/files/*", http.StripPrefix("/files", fileServer))

    http.ListenAndServe(":3000", r)
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
    // Limit request size
    r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

    // Parse multipart form
    if err := r.ParseMultipartForm(maxUploadSize); err != nil {
        http.Error(w, "File too large", http.StatusBadRequest)
        return
    }

    file, header, err := r.FormFile("file")
    if err != nil {
        http.Error(w, "Error retrieving file", http.StatusBadRequest)
        return
    }
    defer file.Close()

    // Validate file type
    buff := make([]byte, 512)
    _, err = file.Read(buff)
    if err != nil {
        http.Error(w, "Error reading file", http.StatusInternalServerError)
        return
    }

    contentType := http.DetectContentType(buff)
    allowedTypes := map[string]bool{
        "image/jpeg": true,
        "image/png":  true,
        "image/gif":  true,
        "application/pdf": true,
    }

    if !allowedTypes[contentType] {
        http.Error(w, "File type not allowed", http.StatusBadRequest)
        return
    }

    // Reset file pointer
    file.Seek(0, io.SeekStart)

    // Generate unique filename
    ext := filepath.Ext(header.Filename)
    newFilename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
    filePath := filepath.Join(uploadDir, newFilename)

    // Create destination file
    dst, err := os.Create(filePath)
    if err != nil {
        http.Error(w, "Error saving file", http.StatusInternalServerError)
        return
    }
    defer dst.Close()

    // Copy file
    size, err := io.Copy(dst, file)
    if err != nil {
        http.Error(w, "Error saving file", http.StatusInternalServerError)
        return
    }

    response := UploadResponse{
        Filename: newFilename,
        Size:     size,
        URL:      "/files/" + newFilename,
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(response)
}

func multipleUploadHandler(w http.ResponseWriter, r *http.Request) {
    r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize*10)

    if err := r.ParseMultipartForm(maxUploadSize * 10); err != nil {
        http.Error(w, "Files too large", http.StatusBadRequest)
        return
    }

    files := r.MultipartForm.File["files"]
    var responses []UploadResponse

    for _, fileHeader := range files {
        file, err := fileHeader.Open()
        if err != nil {
            continue
        }

        ext := filepath.Ext(fileHeader.Filename)
        newFilename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
        filePath := filepath.Join(uploadDir, newFilename)

        dst, err := os.Create(filePath)
        if err != nil {
            file.Close()
            continue
        }

        size, err := io.Copy(dst, file)
        file.Close()
        dst.Close()

        if err == nil {
            responses = append(responses, UploadResponse{
                Filename: newFilename,
                Size:     size,
                URL:      "/files/" + newFilename,
            })
        }
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(responses)
}
```

## Best Practices

### 1. Organize Routes with Resource Pattern

```go
package main

import (
    "github.com/go-chi/chi/v5"
)

// Resource interface for consistent API design
type Resource interface {
    Routes() chi.Router
}

// BaseResource provides common CRUD operations
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

// Implementation methods would follow...
```

### 2. Use Render Package for Responses

```go
package main

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/render"
)

type ErrResponse struct {
    Err            error `json:"-"`
    HTTPStatusCode int   `json:"-"`

    StatusText string `json:"status"`
    AppCode    int64  `json:"code,omitempty"`
    ErrorText  string `json:"error,omitempty"`
}

func (e *ErrResponse) Render(w http.ResponseWriter, r *http.Request) error {
    render.Status(r, e.HTTPStatusCode)
    return nil
}

func ErrNotFound() render.Renderer {
    return &ErrResponse{
        HTTPStatusCode: 404,
        StatusText:     "Resource not found",
    }
}

func ErrBadRequest(err error) render.Renderer {
    return &ErrResponse{
        Err:            err,
        HTTPStatusCode: 400,
        StatusText:     "Bad request",
        ErrorText:      err.Error(),
    }
}

type ArticleResponse struct {
    *Article
}

func (a *ArticleResponse) Render(w http.ResponseWriter, r *http.Request) error {
    return nil
}

func NewArticleResponse(article *Article) *ArticleResponse {
    return &ArticleResponse{Article: article}
}
```

### 3. Structured Error Handling

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
            Message: "Internal server error",
        }
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(apiErr.Status)
    json.NewEncoder(w).Encode(apiErr)
}

// Usage in handler
func handler(w http.ResponseWriter, r *http.Request) {
    // ...
    if err != nil {
        WriteError(w, APIError{
            Status:  http.StatusBadRequest,
            Message: "Invalid input",
            Details: err.Error(),
        })
        return
    }
}
```

## Common Pitfalls

### 1. Middleware Order Matters

```go
package main

import (
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func main() {
    r := chi.NewRouter()

    // CORRECT order: Logger should be early to capture all requests
    r.Use(middleware.RequestID)  // 1. Generate request ID
    r.Use(middleware.RealIP)     // 2. Get real IP
    r.Use(middleware.Logger)     // 3. Log requests
    r.Use(middleware.Recoverer)  // 4. Recover from panics
    r.Use(middleware.Timeout(60 * time.Second))  // 5. Set timeout

    // INCORRECT: Logger after Recoverer won't log panics properly
    // r.Use(middleware.Recoverer)
    // r.Use(middleware.Logger)
}
```

### 2. Context Value Type Safety

```go
package main

import (
    "context"
    "net/http"
)

// BAD: Using string as context key
func badMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx := context.WithValue(r.Context(), "user", user) // String key - collision risk
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// GOOD: Using custom type as context key
type contextKey string

const userContextKey contextKey = "user"

func goodMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ctx := context.WithValue(r.Context(), userContextKey, user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### 3. Not Handling URL Parameter Absence

```go
package main

import (
    "net/http"

    "github.com/go-chi/chi/v5"
)

// BAD: Assumes parameter always exists
func badHandler(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    // Use id directly - could be empty string
}

// GOOD: Validate parameter
func goodHandler(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    if id == "" {
        http.Error(w, "Missing id parameter", http.StatusBadRequest)
        return
    }
    // Use validated id
}
```

## Performance Considerations

### Middleware Efficiency

```go
package main

import (
    "net/http"
    "sync"
)

// Use sync.Pool for frequently allocated objects
var bufferPool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 1024)
    },
}

func EfficientMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        buf := bufferPool.Get().([]byte)
        defer bufferPool.Put(buf)

        // Use buffer...

        next.ServeHTTP(w, r)
    })
}
```

### Route Caching

Chi's radix tree provides O(k) routing where k is the length of the URL path, which is very efficient. However, for extremely high-traffic applications:

```go
package main

import (
    "github.com/go-chi/chi/v5"
)

func main() {
    r := chi.NewRouter()

    // Static routes are faster than parameterized routes
    // If possible, use static routes for hot paths
    r.Get("/api/v1/health", healthHandler)
    r.Get("/api/v1/ready", readyHandler)

    // Parameterized routes for dynamic content
    r.Get("/api/v1/users/{id}", getUserHandler)
}
```

## Interview Key Points

1. **Chi vs other routers**:
   - Chi: Lightweight, stdlib compatible, no dependencies
   - Gin: More features, faster, not stdlib compatible
   - Gorilla Mux: Feature-rich but heavier

2. **Middleware pattern**:
   - Standard `func(http.Handler) http.Handler` signature
   - Executed in order of `r.Use()` calls
   - Can be applied globally, to groups, or individual routes

3. **URL parameters**:
   - `{param}` - named parameter
   - `{param:[regex]}` - with regex constraint
   - `*` - wildcard

4. **Context usage**:
   - Use custom types for context keys
   - Keep context values small
   - Don't store mutable state in context

5. **Sub-routers**:
   - `r.Route()` for inline sub-routing
   - `r.Mount()` for mounting external routers
   - `r.Group()` for grouping with shared middleware

## Further Reading

- [Chi GitHub Repository](https://github.com/go-chi/chi)
- [Chi Documentation](https://go-chi.io/)
- [Chi Examples](https://github.com/go-chi/chi/tree/master/_examples)
- [Go net/http Documentation](https://pkg.go.dev/net/http)
- [RESTful API Design Best Practices](https://restfulapi.net/)
