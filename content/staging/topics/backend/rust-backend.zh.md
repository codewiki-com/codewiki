---
title: Rust 后端开发
description: 学习使用Rust构建高性能后端服务
track: backend
section: http-apis
difficulty: advanced
tags:
  - Rust
  - Actix-web
  - Tokio
  - 高性能
status: imported
origin: old/src/content/docs/backend/rust-backend.zh.md
divergence: 0.228
issues: []
legacy:
  category: Backend
  subcategory: Languages
  order: 20
  lastUpdated: 2026-01-07
---

## 为什么选择 Rust 进行后端开发？

Rust 是一门系统级编程语言，以其卓越的性能、内存安全性和并发能力而闻名。在后端开发领域，Rust 正在成为构建高性能、高可靠性服务的首选语言之一。

### Rust 的核心优势

| 特性 | 描述 | 对后端开发的影响 |
|------|------|------------------|
| 零成本抽象 | 高级抽象不带来运行时开销 | 代码优雅且性能极致 |
| 内存安全 | 编译时保证内存安全，无需 GC | 消除内存泄漏和数据竞争 |
| 并发安全 | 所有权系统防止数据竞争 | 安全的多线程编程 |
| 高性能 | 接近 C/C++ 的执行效率 | 低延迟、高吞吐量服务 |
| 强类型系统 | 丰富的类型系统和模式匹配 | 编译时捕获更多错误 |

### 性能对比

```
框架性能基准测试 (requests/sec):
┌─────────────────────────────────────────────────────┐
│ Actix-web (Rust)  ████████████████████████  ~650,000│
│ Axum (Rust)       ███████████████████████   ~580,000│
│ Go (net/http)     ████████████████          ~400,000│
│ Fastify (Node.js) ████████████              ~300,000│
│ Express (Node.js) ████████                  ~200,000│
│ FastAPI (Python)  ███                       ~30,000 │
└─────────────────────────────────────────────────────┘
```

### Rust 适用场景

- **高性能 API 服务**：需要极低延迟和高吞吐量的场景
- **实时系统**：WebSocket 服务、游戏服务器、交易系统
- **基础设施服务**：代理服务器、负载均衡器、消息队列
- **资源受限环境**：边缘计算、嵌入式系统
- **安全关键系统**：金融服务、医疗系统、区块链

## Rust 基础回顾

### 所有权与借用

Rust 的所有权系统是其内存安全的核心，理解这一概念对于编写后端代码至关重要：

```rust
// 所有权基础
fn main() {
    // 每个值都有一个所有者
    let s1 = String::from("hello");

    // 所有权转移 (move)
    let s2 = s1;
    // println!("{}", s1); // 错误! s1 的所有权已转移

    // 克隆 (深拷贝)
    let s3 = s2.clone();
    println!("s2: {}, s3: {}", s2, s3); // 正确

    // 借用 (引用)
    let s4 = String::from("world");
    let len = calculate_length(&s4); // 借用 s4
    println!("'{}' 的长度是 {}", s4, len); // s4 仍然有效
}

fn calculate_length(s: &String) -> usize {
    s.len()
} // s 离开作用域，但因为它没有所有权，所以什么也不会发生

// 可变借用
fn append_world(s: &mut String) {
    s.push_str(", world!");
}

fn main() {
    let mut greeting = String::from("Hello");
    append_world(&mut greeting);
    println!("{}", greeting); // "Hello, world!"
}
```

### 生命周期

生命周期确保引用的有效性，在后端开发中尤其重要：

```rust
// 生命周期标注
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

// 结构体中的生命周期
struct Request<'a> {
    path: &'a str,
    method: &'a str,
    headers: Vec<(&'a str, &'a str)>,
}

impl<'a> Request<'a> {
    fn new(path: &'a str, method: &'a str) -> Self {
        Request {
            path,
            method,
            headers: Vec::new(),
        }
    }

    fn add_header(&mut self, key: &'a str, value: &'a str) {
        self.headers.push((key, value));
    }
}

// 静态生命周期
const API_VERSION: &'static str = "v1";
```

### 错误处理

Rust 使用 `Result` 和 `Option` 类型进行错误处理：

```rust
use std::fs::File;
use std::io::{self, Read};

// Result 类型用于可能失败的操作
fn read_config_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?; // ? 运算符传播错误
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

// 自定义错误类型
#[derive(Debug)]
enum ApiError {
    NotFound(String),
    Unauthorized,
    BadRequest(String),
    InternalError(String),
}

impl std::fmt::Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ApiError::NotFound(msg) => write!(f, "Not Found: {}", msg),
            ApiError::Unauthorized => write!(f, "Unauthorized"),
            ApiError::BadRequest(msg) => write!(f, "Bad Request: {}", msg),
            ApiError::InternalError(msg) => write!(f, "Internal Error: {}", msg),
        }
    }
}

impl std::error::Error for ApiError {}

// 使用 thiserror 简化错误定义
use thiserror::Error;

#[derive(Error, Debug)]
enum ServiceError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("User not found: {id}")]
    UserNotFound { id: i64 },

    #[error("Invalid input: {0}")]
    ValidationError(String),

    #[error("Authentication failed")]
    AuthError,
}

// 使用 anyhow 进行错误处理
use anyhow::{Context, Result};

fn load_config() -> Result<Config> {
    let content = std::fs::read_to_string("config.toml")
        .context("Failed to read config file")?;

    let config: Config = toml::from_str(&content)
        .context("Failed to parse config")?;

    Ok(config)
}
```

## Tokio 异步运行时

Tokio 是 Rust 生态系统中最流行的异步运行时，为构建高性能异步应用提供了基础设施。

### 异步编程基础

```rust
use tokio;
use std::time::Duration;

// async/await 基础
async fn fetch_data(url: &str) -> Result<String, reqwest::Error> {
    let response = reqwest::get(url).await?;
    let body = response.text().await?;
    Ok(body)
}

// 使用 tokio::main 宏启动异步运行时
#[tokio::main]
async fn main() {
    println!("Starting async operations...");

    // 并发执行多个异步任务
    let (result1, result2) = tokio::join!(
        fetch_data("https://api.example.com/data1"),
        fetch_data("https://api.example.com/data2")
    );

    println!("Results: {:?}, {:?}", result1, result2);
}

// 异步睡眠
async fn delayed_operation() {
    println!("Starting...");
    tokio::time::sleep(Duration::from_secs(1)).await;
    println!("Done after 1 second!");
}
```

### 任务 (Tasks) 和并发

```rust
use tokio::task;
use tokio::sync::{mpsc, oneshot};

// 创建并发任务
async fn process_items(items: Vec<i32>) -> Vec<i32> {
    let mut handles = Vec::new();

    for item in items {
        // spawn 创建一个新的异步任务
        let handle = task::spawn(async move {
            // 模拟异步处理
            tokio::time::sleep(Duration::from_millis(100)).await;
            item * 2
        });
        handles.push(handle);
    }

    // 等待所有任务完成
    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await.unwrap());
    }
    results
}

// 使用 channel 进行任务间通信
async fn producer_consumer_example() {
    // 创建多生产者单消费者通道
    let (tx, mut rx) = mpsc::channel::<String>(100);

    // 生产者任务
    let producer = task::spawn(async move {
        for i in 0..10 {
            tx.send(format!("Message {}", i)).await.unwrap();
            tokio::time::sleep(Duration::from_millis(50)).await;
        }
    });

    // 消费者任务
    let consumer = task::spawn(async move {
        while let Some(msg) = rx.recv().await {
            println!("Received: {}", msg);
        }
    });

    // 等待任务完成
    let _ = tokio::join!(producer, consumer);
}

// 使用 oneshot 进行一次性响应
async fn request_response_pattern() {
    let (tx, rx) = oneshot::channel::<String>();

    // 处理请求的任务
    task::spawn(async move {
        // 模拟处理
        tokio::time::sleep(Duration::from_millis(100)).await;
        tx.send("Response data".to_string()).unwrap();
    });

    // 等待响应
    let response = rx.await.unwrap();
    println!("Got response: {}", response);
}
```

### 异步同步原语

```rust
use tokio::sync::{Mutex, RwLock, Semaphore};
use std::sync::Arc;

// 异步互斥锁
struct SharedState {
    counter: Mutex<i32>,
    data: RwLock<Vec<String>>,
}

impl SharedState {
    fn new() -> Self {
        SharedState {
            counter: Mutex::new(0),
            data: RwLock::new(Vec::new()),
        }
    }

    async fn increment(&self) {
        let mut counter = self.counter.lock().await;
        *counter += 1;
    }

    async fn add_data(&self, item: String) {
        let mut data = self.data.write().await;
        data.push(item);
    }

    async fn get_data(&self) -> Vec<String> {
        let data = self.data.read().await;
        data.clone()
    }
}

// 使用信号量限制并发
async fn limited_concurrency() {
    let semaphore = Arc::new(Semaphore::new(3)); // 最多3个并发任务
    let mut handles = Vec::new();

    for i in 0..10 {
        let permit = semaphore.clone().acquire_owned().await.unwrap();

        let handle = task::spawn(async move {
            println!("Task {} started", i);
            tokio::time::sleep(Duration::from_millis(500)).await;
            println!("Task {} completed", i);
            drop(permit); // 释放许可
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.await.unwrap();
    }
}
```

### 定时器和超时

```rust
use tokio::time::{timeout, interval, Duration};

// 超时处理
async fn with_timeout() {
    let result = timeout(
        Duration::from_secs(5),
        long_running_operation()
    ).await;

    match result {
        Ok(value) => println!("Operation completed: {:?}", value),
        Err(_) => println!("Operation timed out!"),
    }
}

async fn long_running_operation() -> String {
    tokio::time::sleep(Duration::from_secs(10)).await;
    "Done".to_string()
}

// 周期性任务
async fn periodic_task() {
    let mut interval = interval(Duration::from_secs(1));

    loop {
        interval.tick().await;
        println!("Tick at {:?}", std::time::Instant::now());

        // 执行周期性操作
        perform_health_check().await;
    }
}

async fn perform_health_check() {
    // 健康检查逻辑
    println!("Health check passed");
}
```

## Actix-web 框架

Actix-web 是 Rust 生态中性能最高的 Web 框架，基于 Actor 模型构建。

### 快速开始

```toml
# Cargo.toml
[dependencies]
actix-web = "4"
actix-rt = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
```

```rust
use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct User {
    id: u64,
    username: String,
    email: String,
}

// 简单的处理函数
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello, World!")
}

// 返回 JSON
async fn get_user(path: web::Path<u64>) -> impl Responder {
    let user_id = path.into_inner();
    let user = User {
        id: user_id,
        username: "alice".to_string(),
        email: "alice@example.com".to_string(),
    };
    HttpResponse::Ok().json(user)
}

// 接收 JSON 请求体
async fn create_user(user: web::Json<User>) -> impl Responder {
    println!("Creating user: {:?}", user.username);
    HttpResponse::Created().json(&user.0)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(hello))
            .route("/users/{id}", web::get().to(get_user))
            .route("/users", web::post().to(create_user))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

### 路由和提取器

```rust
use actix_web::{web, HttpRequest, HttpResponse};
use serde::Deserialize;

// 路径参数提取
#[derive(Deserialize)]
struct PathParams {
    user_id: u64,
    post_id: u64,
}

async fn get_user_post(path: web::Path<PathParams>) -> HttpResponse {
    HttpResponse::Ok().body(format!(
        "User {} Post {}",
        path.user_id,
        path.post_id
    ))
}

// 查询参数提取
#[derive(Deserialize)]
struct QueryParams {
    page: Option<u32>,
    limit: Option<u32>,
    search: Option<String>,
}

async fn list_items(query: web::Query<QueryParams>) -> HttpResponse {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(10);
    HttpResponse::Ok().body(format!("Page: {}, Limit: {}", page, limit))
}

// 请求头提取
async fn with_headers(req: HttpRequest) -> HttpResponse {
    let user_agent = req
        .headers()
        .get("User-Agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("Unknown");

    HttpResponse::Ok().body(format!("User-Agent: {}", user_agent))
}

// 表单数据提取
#[derive(Deserialize)]
struct LoginForm {
    username: String,
    password: String,
}

async fn login(form: web::Form<LoginForm>) -> HttpResponse {
    // 处理登录逻辑
    HttpResponse::Ok().body(format!("Welcome, {}", form.username))
}

// 路由配置
fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            .route("/users/{user_id}/posts/{post_id}", web::get().to(get_user_post))
            .route("/items", web::get().to(list_items))
            .route("/login", web::post().to(login))
    );
}
```

### 中间件

```rust
use actix_web::{web, App, HttpServer, HttpResponse, middleware};
use actix_web::dev::{ServiceRequest, ServiceResponse, Transform, Service};
use futures::future::{ok, Ready, LocalBoxFuture};
use std::time::Instant;

// 使用内置中间件
fn create_app() -> App<impl actix_web::dev::ServiceFactory> {
    App::new()
        .wrap(middleware::Logger::default())
        .wrap(middleware::Compress::default())
        .wrap(middleware::NormalizePath::trim())
}

// 自定义中间件 - 请求计时
struct TimingMiddleware;

impl<S, B> Transform<S, ServiceRequest> for TimingMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Transform = TimingMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(TimingMiddlewareService { service })
    }
}

struct TimingMiddlewareService<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for TimingMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let start = Instant::now();
        let path = req.path().to_string();
        let method = req.method().to_string();

        let fut = self.service.call(req);

        Box::pin(async move {
            let res = fut.await?;
            let elapsed = start.elapsed();
            println!("{} {} - {:?}", method, path, elapsed);
            Ok(res)
        })
    }
}

// 认证中间件
use actix_web::FromRequest;
use actix_web::error::ErrorUnauthorized;

struct AuthenticatedUser {
    user_id: u64,
    username: String,
}

impl FromRequest for AuthenticatedUser {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut actix_web::dev::Payload) -> Self::Future {
        // 从请求头获取令牌
        let token = req
            .headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|s| s.strip_prefix("Bearer "));

        match token {
            Some(token) if validate_token(token) => {
                // 解析令牌获取用户信息
                ok(Ok(AuthenticatedUser {
                    user_id: 1,
                    username: "alice".to_string(),
                }))
            }
            _ => ok(Err(ErrorUnauthorized("Invalid or missing token"))),
        }
    }
}

fn validate_token(token: &str) -> bool {
    // 实际的令牌验证逻辑
    !token.is_empty()
}

// 使用认证提取器
async fn protected_route(user: AuthenticatedUser) -> HttpResponse {
    HttpResponse::Ok().body(format!("Hello, {}!", user.username))
}
```

### 应用状态和依赖注入

```rust
use actix_web::{web, App, HttpServer, HttpResponse};
use std::sync::Mutex;

// 应用状态
struct AppState {
    app_name: String,
    request_count: Mutex<u64>,
}

// 数据库连接池状态
struct DbPool {
    pool: sqlx::PgPool,
}

async fn get_app_info(data: web::Data<AppState>) -> HttpResponse {
    let mut count = data.request_count.lock().unwrap();
    *count += 1;

    HttpResponse::Ok().json(serde_json::json!({
        "app_name": data.app_name,
        "request_count": *count
    }))
}

async fn get_users_from_db(db: web::Data<DbPool>) -> HttpResponse {
    let users: Vec<User> = sqlx::query_as!(
        User,
        "SELECT id, username, email FROM users"
    )
    .fetch_all(&db.pool)
    .await
    .unwrap();

    HttpResponse::Ok().json(users)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 初始化应用状态
    let app_state = web::Data::new(AppState {
        app_name: "My API".to_string(),
        request_count: Mutex::new(0),
    });

    // 初始化数据库连接池
    let pool = sqlx::PgPool::connect("postgres://localhost/mydb")
        .await
        .unwrap();
    let db_pool = web::Data::new(DbPool { pool });

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .app_data(db_pool.clone())
            .route("/info", web::get().to(get_app_info))
            .route("/users", web::get().to(get_users_from_db))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

## Axum 框架

Axum 是由 Tokio 团队开发的现代 Web 框架，以其简洁的 API 和出色的类型安全性著称。

### 快速开始

```toml
# Cargo.toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }
```

```rust
use axum::{
    routing::{get, post},
    Router, Json, Extension,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Clone)]
struct AppState {
    db_pool: sqlx::PgPool,
}

#[derive(Serialize)]
struct User {
    id: u64,
    username: String,
    email: String,
}

#[derive(Deserialize)]
struct CreateUser {
    username: String,
    email: String,
}

// 简单的处理函数
async fn hello() -> &'static str {
    "Hello, World!"
}

// 返回 JSON
async fn get_user(Path(id): Path<u64>) -> Json<User> {
    Json(User {
        id,
        username: "alice".to_string(),
        email: "alice@example.com".to_string(),
    })
}

// 接收 JSON 并返回
async fn create_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateUser>,
) -> impl IntoResponse {
    // 在实际应用中，这里会将用户保存到数据库
    let user = User {
        id: 1,
        username: payload.username,
        email: payload.email,
    };

    (StatusCode::CREATED, Json(user))
}

#[tokio::main]
async fn main() {
    let pool = sqlx::PgPool::connect("postgres://localhost/mydb")
        .await
        .unwrap();

    let state = Arc::new(AppState { db_pool: pool });

    let app = Router::new()
        .route("/", get(hello))
        .route("/users/:id", get(get_user))
        .route("/users", post(create_user))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080")
        .await
        .unwrap();

    println!("Server running on http://127.0.0.1:8080");
    axum::serve(listener, app).await.unwrap();
}
```

### 提取器 (Extractors)

```rust
use axum::{
    extract::{Path, Query, State, Json, Request, ConnectInfo},
    http::{header::HeaderMap, Method},
};
use std::net::SocketAddr;

// 路径参数
async fn get_user_post(
    Path((user_id, post_id)): Path<(u64, u64)>,
) -> String {
    format!("User {} Post {}", user_id, post_id)
}

// 查询参数
#[derive(Deserialize)]
struct Pagination {
    page: Option<u32>,
    per_page: Option<u32>,
}

async fn list_items(Query(pagination): Query<Pagination>) -> String {
    let page = pagination.page.unwrap_or(1);
    let per_page = pagination.per_page.unwrap_or(10);
    format!("Page: {}, Per page: {}", page, per_page)
}

// 请求头
async fn with_headers(headers: HeaderMap) -> String {
    let user_agent = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("Unknown");

    format!("User-Agent: {}", user_agent)
}

// 多个提取器组合
async fn complex_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<u64>,
    Query(params): Query<Pagination>,
    headers: HeaderMap,
    Json(body): Json<CreateUser>,
) -> impl IntoResponse {
    // 可以同时访问状态、路径参数、查询参数、请求头和请求体
    Json(serde_json::json!({
        "id": id,
        "page": params.page,
        "username": body.username
    }))
}

// 自定义提取器
struct AuthUser {
    user_id: u64,
    roles: Vec<String>,
}

#[async_trait::async_trait]
impl<S> axum::extract::FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(
        parts: &mut http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or((StatusCode::UNAUTHORIZED, "Missing Authorization header".to_string()))?;

        // 验证令牌并提取用户信息
        // 这里简化了实际的验证逻辑
        if auth_header.starts_with("Bearer ") {
            Ok(AuthUser {
                user_id: 1,
                roles: vec!["user".to_string()],
            })
        } else {
            Err((StatusCode::UNAUTHORIZED, "Invalid token".to_string()))
        }
    }
}
```

### 路由和嵌套

```rust
use axum::{
    routing::{get, post, put, delete},
    Router,
};

// 模块化路由
fn user_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_users).post(create_user))
        .route("/:id", get(get_user).put(update_user).delete(delete_user))
        .route("/:id/posts", get(get_user_posts))
}

fn post_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_posts).post(create_post))
        .route("/:id", get(get_post).put(update_post).delete(delete_post))
        .route("/:id/comments", get(get_post_comments).post(create_comment))
}

fn admin_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/users", get(admin_list_users))
        .route("/stats", get(get_stats))
}

// 组合所有路由
fn create_app(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .nest("/api/v1/users", user_routes())
        .nest("/api/v1/posts", post_routes())
        .nest("/admin", admin_routes())
        .with_state(state)
}

// API 版本管理
fn api_v1() -> Router<Arc<AppState>> {
    Router::new()
        .nest("/users", user_routes())
        .nest("/posts", post_routes())
}

fn api_v2() -> Router<Arc<AppState>> {
    // V2 API 可能有不同的结构
    Router::new()
        .nest("/users", user_routes_v2())
}

fn create_versioned_app(state: Arc<AppState>) -> Router {
    Router::new()
        .nest("/api/v1", api_v1())
        .nest("/api/v2", api_v2())
        .with_state(state)
}
```

### 中间件和层 (Tower Layers)

```rust
use axum::{
    Router,
    middleware::{self, Next},
    extract::Request,
    response::Response,
};
use tower_http::{
    cors::{CorsLayer, Any},
    trace::TraceLayer,
    compression::CompressionLayer,
    timeout::TimeoutLayer,
};
use std::time::Duration;

// 使用 tower-http 中间件
fn create_app_with_middleware(state: Arc<AppState>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/", get(hello))
        .nest("/api", api_routes())
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .layer(CompressionLayer::new())
        .layer(TimeoutLayer::new(Duration::from_secs(30)))
        .with_state(state)
}

// 自定义中间件函数
async fn logging_middleware(
    req: Request,
    next: Next,
) -> Response {
    let method = req.method().clone();
    let uri = req.uri().clone();
    let start = std::time::Instant::now();

    let response = next.run(req).await;

    let elapsed = start.elapsed();
    println!("{} {} - {:?} - {}", method, uri, elapsed, response.status());

    response
}

// 认证中间件
async fn auth_middleware(
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok());

    match auth_header {
        Some(token) if token.starts_with("Bearer ") => {
            // 验证令牌
            Ok(next.run(req).await)
        }
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}

// 应用中间件到特定路由
fn create_app_selective_middleware(state: Arc<AppState>) -> Router {
    let public_routes = Router::new()
        .route("/", get(hello))
        .route("/health", get(health_check));

    let protected_routes = Router::new()
        .route("/users", get(list_users))
        .route("/profile", get(get_profile))
        .layer(middleware::from_fn(auth_middleware));

    Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .layer(middleware::from_fn(logging_middleware))
        .with_state(state)
}
```

## 数据库访问

### SQLx - 编译时检查的 SQL

```toml
# Cargo.toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "macros"] }
```

```rust
use sqlx::{PgPool, FromRow, postgres::PgPoolOptions};

// 数据库模型
#[derive(Debug, FromRow, Serialize)]
struct User {
    id: i64,
    username: String,
    email: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
struct CreateUserRequest {
    username: String,
    email: String,
}

// 初始化连接池
async fn init_db() -> PgPool {
    PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect("postgres://user:password@localhost/mydb")
        .await
        .expect("Failed to create pool")
}

// 使用 query_as! 宏（编译时类型检查）
async fn get_user_by_id(pool: &PgPool, id: i64) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as!(
        User,
        r#"
        SELECT id, username, email, created_at
        FROM users
        WHERE id = $1
        "#,
        id
    )
    .fetch_optional(pool)
    .await
}

// 插入数据
async fn create_user(pool: &PgPool, req: CreateUserRequest) -> Result<User, sqlx::Error> {
    sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (username, email)
        VALUES ($1, $2)
        RETURNING id, username, email, created_at
        "#,
        req.username,
        req.email
    )
    .fetch_one(pool)
    .await
}

// 更新数据
async fn update_user_email(
    pool: &PgPool,
    id: i64,
    email: &str,
) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as!(
        User,
        r#"
        UPDATE users
        SET email = $2
        WHERE id = $1
        RETURNING id, username, email, created_at
        "#,
        id,
        email
    )
    .fetch_optional(pool)
    .await
}

// 删除数据
async fn delete_user(pool: &PgPool, id: i64) -> Result<bool, sqlx::Error> {
    let result = sqlx::query!(
        "DELETE FROM users WHERE id = $1",
        id
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

// 分页查询
async fn list_users(
    pool: &PgPool,
    page: i64,
    per_page: i64,
) -> Result<Vec<User>, sqlx::Error> {
    let offset = (page - 1) * per_page;

    sqlx::query_as!(
        User,
        r#"
        SELECT id, username, email, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        "#,
        per_page,
        offset
    )
    .fetch_all(pool)
    .await
}

// 事务处理
async fn transfer_funds(
    pool: &PgPool,
    from_account: i64,
    to_account: i64,
    amount: i64,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    // 扣款
    sqlx::query!(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
        amount,
        from_account
    )
    .execute(&mut *tx)
    .await?;

    // 入款
    sqlx::query!(
        "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
        amount,
        to_account
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}
```

### Diesel - 类型安全的 ORM

```toml
# Cargo.toml
[dependencies]
diesel = { version = "2.1", features = ["postgres", "r2d2", "chrono"] }
```

```rust
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};

// 定义表结构 (通过 diesel migration 生成)
diesel::table! {
    users (id) {
        id -> Int8,
        username -> Varchar,
        email -> Varchar,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    posts (id) {
        id -> Int8,
        user_id -> Int8,
        title -> Varchar,
        content -> Text,
        published -> Bool,
        created_at -> Timestamptz,
    }
}

// 模型定义
#[derive(Queryable, Selectable, Debug)]
#[diesel(table_name = users)]
struct User {
    id: i64,
    username: String,
    email: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Insertable)]
#[diesel(table_name = users)]
struct NewUser<'a> {
    username: &'a str,
    email: &'a str,
}

// 连接池设置
type DbPool = Pool<ConnectionManager<PgConnection>>;

fn init_pool(database_url: &str) -> DbPool {
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    Pool::builder()
        .max_size(10)
        .build(manager)
        .expect("Failed to create pool")
}

// CRUD 操作
fn get_user_by_id(conn: &mut PgConnection, user_id: i64) -> QueryResult<User> {
    use self::users::dsl::*;

    users
        .filter(id.eq(user_id))
        .select(User::as_select())
        .first(conn)
}

fn create_user(conn: &mut PgConnection, new_user: &NewUser) -> QueryResult<User> {
    use self::users::dsl::*;

    diesel::insert_into(users)
        .values(new_user)
        .returning(User::as_returning())
        .get_result(conn)
}

fn update_user_email(
    conn: &mut PgConnection,
    user_id: i64,
    new_email: &str,
) -> QueryResult<User> {
    use self::users::dsl::*;

    diesel::update(users.filter(id.eq(user_id)))
        .set(email.eq(new_email))
        .returning(User::as_returning())
        .get_result(conn)
}

fn delete_user(conn: &mut PgConnection, user_id: i64) -> QueryResult<usize> {
    use self::users::dsl::*;

    diesel::delete(users.filter(id.eq(user_id)))
        .execute(conn)
}

// 复杂查询
fn get_users_with_posts(
    conn: &mut PgConnection,
    limit: i64,
) -> QueryResult<Vec<(User, Vec<Post>)>> {
    use self::users::dsl::*;

    let all_users: Vec<User> = users
        .order(created_at.desc())
        .limit(limit)
        .select(User::as_select())
        .load(conn)?;

    let user_posts: Vec<Post> = Post::belonging_to(&all_users)
        .select(Post::as_select())
        .load(conn)?;

    let grouped = user_posts
        .grouped_by(&all_users)
        .into_iter()
        .zip(all_users)
        .map(|(posts, user)| (user, posts))
        .collect();

    Ok(grouped)
}
```

### 数据库迁移

```bash
# 使用 sqlx-cli
cargo install sqlx-cli

# 创建迁移
sqlx migrate add create_users_table

# 运行迁移
sqlx migrate run

# 回滚迁移
sqlx migrate revert
```

```sql
-- migrations/20240101000000_create_users_table.sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 构建 REST API

### 完整的 API 示例

```rust
use axum::{
    routing::{get, post, put, delete},
    Router, Json, Extension,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::sync::Arc;
use validator::Validate;

// 应用状态
#[derive(Clone)]
struct AppState {
    db: PgPool,
}

// 数据传输对象 (DTOs)
#[derive(Serialize)]
struct UserResponse {
    id: i64,
    username: String,
    email: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize, Validate)]
struct CreateUserRequest {
    #[validate(length(min = 3, max = 50))]
    username: String,
    #[validate(email)]
    email: String,
    #[validate(length(min = 8))]
    password: String,
}

#[derive(Deserialize, Validate)]
struct UpdateUserRequest {
    #[validate(length(min = 3, max = 50))]
    username: Option<String>,
    #[validate(email)]
    email: Option<String>,
}

#[derive(Deserialize)]
struct PaginationParams {
    page: Option<i64>,
    per_page: Option<i64>,
}

#[derive(Serialize)]
struct PaginatedResponse<T> {
    data: Vec<T>,
    page: i64,
    per_page: i64,
    total: i64,
}

// 错误处理
#[derive(Debug)]
enum ApiError {
    NotFound,
    BadRequest(String),
    InternalError(String),
    Conflict(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            ApiError::NotFound => (StatusCode::NOT_FOUND, "Resource not found".to_string()),
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            ApiError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            ApiError::Conflict(msg) => (StatusCode::CONFLICT, msg),
        };

        let body = Json(serde_json::json!({
            "error": message
        }));

        (status, body).into_response()
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => ApiError::NotFound,
            sqlx::Error::Database(db_err) => {
                if db_err.constraint().is_some() {
                    ApiError::Conflict("Resource already exists".to_string())
                } else {
                    ApiError::InternalError(db_err.to_string())
                }
            }
            _ => ApiError::InternalError(err.to_string()),
        }
    }
}

// 处理函数
async fn list_users(
    State(state): State<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<PaginatedResponse<UserResponse>>, ApiError> {
    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(10).min(100);
    let offset = (page - 1) * per_page;

    let users = sqlx::query_as!(
        UserResponse,
        r#"
        SELECT id, username, email, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        "#,
        per_page,
        offset
    )
    .fetch_all(&state.db)
    .await?;

    let total = sqlx::query_scalar!("SELECT COUNT(*) FROM users")
        .fetch_one(&state.db)
        .await?
        .unwrap_or(0);

    Ok(Json(PaginatedResponse {
        data: users,
        page,
        per_page,
        total,
    }))
}

async fn get_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<Json<UserResponse>, ApiError> {
    let user = sqlx::query_as!(
        UserResponse,
        r#"
        SELECT id, username, email, created_at
        FROM users
        WHERE id = $1
        "#,
        id
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(Json(user))
}

async fn create_user(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<UserResponse>), ApiError> {
    // 验证输入
    req.validate()
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;

    // 哈希密码
    let password_hash = hash_password(&req.password)
        .map_err(|e| ApiError::InternalError(e.to_string()))?;

    let user = sqlx::query_as!(
        UserResponse,
        r#"
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, created_at
        "#,
        req.username,
        req.email,
        password_hash
    )
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(user)))
}

async fn update_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
    Json(req): Json<UpdateUserRequest>,
) -> Result<Json<UserResponse>, ApiError> {
    req.validate()
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;

    // 动态构建更新查询
    let user = sqlx::query_as!(
        UserResponse,
        r#"
        UPDATE users
        SET
            username = COALESCE($2, username),
            email = COALESCE($3, email)
        WHERE id = $1
        RETURNING id, username, email, created_at
        "#,
        id,
        req.username,
        req.email
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(Json(user))
}

async fn delete_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<StatusCode, ApiError> {
    let result = sqlx::query!("DELETE FROM users WHERE id = $1", id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}

// 路由配置
fn user_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_users).post(create_user))
        .route("/:id", get(get_user).put(update_user).delete(delete_user))
}

// 主函数
#[tokio::main]
async fn main() {
    // 初始化日志
    tracing_subscriber::init();

    // 加载配置
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    // 初始化数据库连接池
    let pool = sqlx::PgPool::connect(&database_url)
        .await
        .expect("Failed to create pool");

    // 运行迁移
    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let state = Arc::new(AppState { db: pool });

    // 构建应用
    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .nest("/api/v1/users", user_routes())
        .with_state(state);

    // 启动服务器
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080")
        .await
        .unwrap();

    println!("Server running on http://0.0.0.0:8080");
    axum::serve(listener, app).await.unwrap();
}

// 辅助函数
fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    use argon2::{Argon2, PasswordHasher};
    use argon2::password_hash::rand_core::OsRng;
    use argon2::password_hash::SaltString;

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2.hash_password(password.as_bytes(), &salt)?;
    Ok(hash.to_string())
}
```

### 认证和授权

```rust
use axum::{
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode},
    response::IntoResponse,
    Json,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

// JWT Claims
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: i64,           // 用户ID
    username: String,
    roles: Vec<String>,
    exp: usize,         // 过期时间
    iat: usize,         // 签发时间
}

// 认证配置
struct AuthConfig {
    secret: String,
    token_expiry: i64,
}

// 已认证用户
#[derive(Debug, Clone)]
struct AuthUser {
    user_id: i64,
    username: String,
    roles: Vec<String>,
}

// 从请求中提取认证用户
#[async_trait::async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or(AuthError::MissingToken)?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AuthError::InvalidToken)?;

        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| AuthError::InvalidToken)?;

        Ok(AuthUser {
            user_id: token_data.claims.sub,
            username: token_data.claims.username,
            roles: token_data.claims.roles,
        })
    }
}

// 认证错误
#[derive(Debug)]
enum AuthError {
    MissingToken,
    InvalidToken,
    InsufficientPermissions,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            AuthError::MissingToken => (StatusCode::UNAUTHORIZED, "Missing authentication token"),
            AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid authentication token"),
            AuthError::InsufficientPermissions => (StatusCode::FORBIDDEN, "Insufficient permissions"),
        };

        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}

// 生成 JWT
fn generate_token(user_id: i64, username: &str, roles: Vec<String>) -> Result<String, AuthError> {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let now = chrono::Utc::now().timestamp() as usize;

    let claims = Claims {
        sub: user_id,
        username: username.to_string(),
        roles,
        exp: now + 3600 * 24, // 24小时过期
        iat: now,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|_| AuthError::InvalidToken)
}

// 登录处理
#[derive(Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Serialize)]
struct LoginResponse {
    token: String,
    expires_in: i64,
}

async fn login(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AuthError> {
    // 查找用户
    let user = sqlx::query!(
        "SELECT id, username, password_hash, roles FROM users WHERE username = $1",
        req.username
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AuthError::InvalidToken)?
    .ok_or(AuthError::InvalidToken)?;

    // 验证密码
    use argon2::{Argon2, PasswordHash, PasswordVerifier};
    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| AuthError::InvalidToken)?;

    Argon2::default()
        .verify_password(req.password.as_bytes(), &parsed_hash)
        .map_err(|_| AuthError::InvalidToken)?;

    // 生成令牌
    let token = generate_token(user.id, &user.username, user.roles)?;

    Ok(Json(LoginResponse {
        token,
        expires_in: 3600 * 24,
    }))
}

// 受保护的路由
async fn protected_route(user: AuthUser) -> impl IntoResponse {
    Json(serde_json::json!({
        "message": format!("Hello, {}!", user.username),
        "user_id": user.user_id
    }))
}

// 基于角色的访问控制
struct RequireRole(String);

#[async_trait::async_trait]
impl<S> FromRequestParts<S> for RequireRole
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AuthUser::from_request_parts(parts, state).await?;

        // 这里检查角色 - 实际实现需要从扩展中获取所需角色
        if user.roles.contains(&"admin".to_string()) {
            Ok(RequireRole("admin".to_string()))
        } else {
            Err(AuthError::InsufficientPermissions)
        }
    }
}

// 管理员专用路由
async fn admin_only(
    user: AuthUser,
    _role: RequireRole,
) -> impl IntoResponse {
    Json(serde_json::json!({
        "message": "Welcome, admin!",
        "user": user.username
    }))
}
```

## 测试

### 单元测试

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_creation() {
        let user = User {
            id: 1,
            username: "testuser".to_string(),
            email: "test@example.com".to_string(),
            created_at: chrono::Utc::now(),
        };

        assert_eq!(user.username, "testuser");
        assert_eq!(user.email, "test@example.com");
    }

    #[test]
    fn test_validation() {
        let valid_request = CreateUserRequest {
            username: "validuser".to_string(),
            email: "valid@example.com".to_string(),
            password: "password123".to_string(),
        };

        assert!(valid_request.validate().is_ok());

        let invalid_request = CreateUserRequest {
            username: "ab".to_string(), // 太短
            email: "invalid-email".to_string(), // 无效邮箱
            password: "short".to_string(), // 密码太短
        };

        assert!(invalid_request.validate().is_err());
    }
}
```

### 集成测试

```rust
#[cfg(test)]
mod integration_tests {
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use tower::ServiceExt;
    use sqlx::PgPool;

    async fn setup_test_db() -> PgPool {
        let database_url = std::env::var("TEST_DATABASE_URL")
            .unwrap_or_else(|_| "postgres://localhost/test_db".to_string());

        let pool = PgPool::connect(&database_url).await.unwrap();

        // 运行迁移
        sqlx::migrate!().run(&pool).await.unwrap();

        // 清理测试数据
        sqlx::query!("TRUNCATE users CASCADE")
            .execute(&pool)
            .await
            .unwrap();

        pool
    }

    #[tokio::test]
    async fn test_create_and_get_user() {
        let pool = setup_test_db().await;
        let state = Arc::new(AppState { db: pool });
        let app = create_app(state);

        // 创建用户
        let create_response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/users")
                    .header("Content-Type", "application/json")
                    .body(Body::from(
                        r#"{"username":"testuser","email":"test@example.com","password":"password123"}"#
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(create_response.status(), StatusCode::CREATED);

        // 获取创建的用户
        let body = axum::body::to_bytes(create_response.into_body(), 1024 * 1024)
            .await
            .unwrap();
        let user: serde_json::Value = serde_json::from_slice(&body).unwrap();
        let user_id = user["id"].as_i64().unwrap();

        // 验证可以通过 ID 获取用户
        let get_response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/api/v1/users/{}", user_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(get_response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_list_users_pagination() {
        let pool = setup_test_db().await;
        let state = Arc::new(AppState { db: pool.clone() });

        // 创建多个测试用户
        for i in 0..15 {
            sqlx::query!(
                "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)",
                format!("user{}", i),
                format!("user{}@example.com", i),
                "hashed"
            )
            .execute(&pool)
            .await
            .unwrap();
        }

        let app = create_app(state);

        // 测试分页
        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/api/v1/users?page=1&per_page=10")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), 1024 * 1024)
            .await
            .unwrap();
        let result: PaginatedResponse<UserResponse> =
            serde_json::from_slice(&body).unwrap();

        assert_eq!(result.data.len(), 10);
        assert_eq!(result.total, 15);
        assert_eq!(result.page, 1);
        assert_eq!(result.per_page, 10);
    }
}
```

### 模拟 (Mocking)

```rust
use mockall::predicate::*;
use mockall::mock;

// 定义 trait
#[async_trait::async_trait]
trait UserRepository {
    async fn find_by_id(&self, id: i64) -> Result<Option<User>, sqlx::Error>;
    async fn create(&self, user: &NewUser) -> Result<User, sqlx::Error>;
    async fn delete(&self, id: i64) -> Result<bool, sqlx::Error>;
}

// 生成 mock
mock! {
    UserRepo {}

    #[async_trait::async_trait]
    impl UserRepository for UserRepo {
        async fn find_by_id(&self, id: i64) -> Result<Option<User>, sqlx::Error>;
        async fn create(&self, user: &NewUser) -> Result<User, sqlx::Error>;
        async fn delete(&self, id: i64) -> Result<bool, sqlx::Error>;
    }
}

#[cfg(test)]
mod mock_tests {
    use super::*;

    #[tokio::test]
    async fn test_user_service_with_mock() {
        let mut mock_repo = MockUserRepo::new();

        // 设置期望
        mock_repo
            .expect_find_by_id()
            .with(eq(1))
            .times(1)
            .returning(|_| Ok(Some(User {
                id: 1,
                username: "testuser".to_string(),
                email: "test@example.com".to_string(),
                created_at: chrono::Utc::now(),
            })));

        // 使用 mock 进行测试
        let result = mock_repo.find_by_id(1).await.unwrap();
        assert!(result.is_some());
        assert_eq!(result.unwrap().username, "testuser");
    }
}
```

## 部署和运维

### Docker 部署

```dockerfile
# Dockerfile
# 构建阶段
FROM rust:1.75 as builder

WORKDIR /usr/src/app

# 复制 Cargo 文件并缓存依赖
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# 复制源代码并构建
COPY . .
RUN touch src/main.rs
RUN cargo build --release

# 运行阶段
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/target/release/myapp /usr/local/bin/myapp

EXPOSE 8080

CMD ["myapp"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:password@db:5432/mydb
      - JWT_SECRET=your-secret-key
      - RUST_LOG=info
    depends_on:
      - db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 配置管理

```rust
use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Settings {
    pub server: ServerSettings,
    pub database: DatabaseSettings,
    pub jwt: JwtSettings,
    pub logging: LoggingSettings,
}

#[derive(Debug, Deserialize)]
pub struct ServerSettings {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Deserialize)]
pub struct DatabaseSettings {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
}

#[derive(Debug, Deserialize)]
pub struct JwtSettings {
    pub secret: String,
    pub expiry_hours: i64,
}

#[derive(Debug, Deserialize)]
pub struct LoggingSettings {
    pub level: String,
    pub format: String,
}

impl Settings {
    pub fn new() -> Result<Self, ConfigError> {
        let run_mode = std::env::var("RUN_MODE").unwrap_or_else(|_| "development".into());

        let s = Config::builder()
            // 默认配置
            .add_source(File::with_name("config/default"))
            // 环境特定配置
            .add_source(File::with_name(&format!("config/{}", run_mode)).required(false))
            // 本地覆盖（不提交到版本控制）
            .add_source(File::with_name("config/local").required(false))
            // 环境变量覆盖（前缀 APP_）
            .add_source(Environment::with_prefix("APP").separator("__"))
            .build()?;

        s.try_deserialize()
    }
}
```

```toml
# config/default.toml
[server]
host = "0.0.0.0"
port = 8080

[database]
url = "postgres://localhost/mydb"
max_connections = 10
min_connections = 2

[jwt]
secret = "change-me-in-production"
expiry_hours = 24

[logging]
level = "info"
format = "json"
```

### 日志和可观测性

```rust
use tracing::{info, warn, error, instrument, Level};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn init_tracing() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "myapp=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();
}

// 结构化日志
#[instrument(skip(state))]
async fn get_user_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> Result<Json<UserResponse>, ApiError> {
    info!(user_id = id, "Fetching user");

    let user = get_user_by_id(&state.db, id).await?;

    match user {
        Some(u) => {
            info!(user_id = id, username = %u.username, "User found");
            Ok(Json(u))
        }
        None => {
            warn!(user_id = id, "User not found");
            Err(ApiError::NotFound)
        }
    }
}

// 错误日志
async fn process_payment(payment_id: &str) -> Result<(), PaymentError> {
    match do_payment(payment_id).await {
        Ok(_) => {
            info!(payment_id, "Payment processed successfully");
            Ok(())
        }
        Err(e) => {
            error!(
                payment_id,
                error = %e,
                "Payment processing failed"
            );
            Err(e)
        }
    }
}
```

### 健康检查和指标

```rust
use axum::{routing::get, Router, Json};
use prometheus::{Encoder, TextEncoder, Counter, Histogram, register_counter, register_histogram};
use lazy_static::lazy_static;

lazy_static! {
    static ref HTTP_REQUESTS_TOTAL: Counter = register_counter!(
        "http_requests_total",
        "Total number of HTTP requests"
    ).unwrap();

    static ref HTTP_REQUEST_DURATION: Histogram = register_histogram!(
        "http_request_duration_seconds",
        "HTTP request duration in seconds"
    ).unwrap();
}

// 健康检查端点
async fn health_check(
    State(state): State<Arc<AppState>>,
) -> Json<serde_json::Value> {
    let db_healthy = sqlx::query("SELECT 1")
        .execute(&state.db)
        .await
        .is_ok();

    Json(serde_json::json!({
        "status": if db_healthy { "healthy" } else { "unhealthy" },
        "checks": {
            "database": if db_healthy { "up" } else { "down" }
        }
    }))
}

// 指标端点
async fn metrics() -> String {
    let encoder = TextEncoder::new();
    let metric_families = prometheus::gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    String::from_utf8(buffer).unwrap()
}

// 请求计数中间件
async fn metrics_middleware(
    req: Request,
    next: Next,
) -> Response {
    HTTP_REQUESTS_TOTAL.inc();

    let timer = HTTP_REQUEST_DURATION.start_timer();
    let response = next.run(req).await;
    timer.observe_duration();

    response
}

fn create_app_with_observability(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/metrics", get(metrics))
        .nest("/api", api_routes())
        .layer(middleware::from_fn(metrics_middleware))
        .with_state(state)
}
```

## 最佳实践总结

### 代码组织

```
src/
├── main.rs                 # 应用入口
├── lib.rs                  # 库导出
├── config/                 # 配置管理
│   ├── mod.rs
│   └── settings.rs
├── api/                    # API 层
│   ├── mod.rs
│   ├── routes.rs
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── users.rs
│   │   └── posts.rs
│   ├── middleware/
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   └── logging.rs
│   └── extractors/
│       ├── mod.rs
│       └── auth.rs
├── domain/                 # 业务逻辑层
│   ├── mod.rs
│   ├── models/
│   │   ├── mod.rs
│   │   └── user.rs
│   ├── services/
│   │   ├── mod.rs
│   │   └── user_service.rs
│   └── repositories/
│       ├── mod.rs
│       └── user_repo.rs
├── infrastructure/         # 基础设施层
│   ├── mod.rs
│   ├── database/
│   │   ├── mod.rs
│   │   └── postgres.rs
│   └── external/
│       └── email.rs
└── errors/                 # 错误处理
    ├── mod.rs
    └── api_error.rs
```

### 性能优化建议

1. **连接池配置**：根据负载合理配置数据库连接池大小
2. **异步操作**：尽可能使用异步 I/O，避免阻塞
3. **批量操作**：使用批量插入/更新代替循环单条操作
4. **缓存**：合理使用 Redis 等缓存减少数据库压力
5. **索引优化**：确保查询有适当的数据库索引支持
6. **编译优化**：生产环境使用 `--release` 编译

### 安全建议

1. **输入验证**：始终验证和清理用户输入
2. **密码哈希**：使用 Argon2 或 bcrypt 进行密码哈希
3. **HTTPS**：生产环境强制使用 HTTPS
4. **速率限制**：实现 API 速率限制防止滥用
5. **SQL 注入**：使用参数化查询（SQLx 和 Diesel 默认支持）
6. **CORS**：正确配置跨域资源共享策略

## 总结

Rust 后端开发结合了卓越的性能、内存安全和现代化的开发体验。通过 Tokio 异步运行时、Actix-web 或 Axum 框架，以及 SQLx 或 Diesel 数据库访问层，你可以构建出高性能、可靠的后端服务。

虽然 Rust 的学习曲线相对陡峭，但其带来的性能优势、安全保证和长期维护性使其成为构建关键业务系统的理想选择。随着 Rust 生态系统的不断成熟，越来越多的企业开始将 Rust 应用于后端开发，特别是在需要高性能和高可靠性的场景中。
