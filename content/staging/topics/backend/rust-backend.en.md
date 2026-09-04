---
title: Rust Backend Development
description: Learn to build high-performance backend services with Rust
track: backend
section: http-apis
difficulty: advanced
tags:
  - Rust
  - Actix-web
  - Tokio
  - High-performance
status: imported
origin: old/src/content/docs/backend/rust-backend.en.md
divergence: 0.228
issues: []
legacy:
  category: Backend
  subcategory: Languages
  order: 20
  lastUpdated: 2026-01-07
---

## Why Choose Rust for Backend Development?

Rust is a systems-level programming language renowned for its exceptional performance, memory safety, and concurrency capabilities. In the backend development domain, Rust is becoming one of the preferred languages for building high-performance, highly reliable services.

### Core Advantages of Rust

| Feature | Description | Impact on Backend Development |
|---------|-------------|-------------------------------|
| Zero-cost abstractions | High-level abstractions incur no runtime overhead | Elegant code with optimal performance |
| Memory safety | Compile-time memory safety guarantees without GC | Eliminates memory leaks and data races |
| Concurrency safety | Ownership system prevents data races | Safe multi-threaded programming |
| High performance | Execution efficiency close to C/C++ | Low-latency, high-throughput services |
| Strong type system | Rich type system and pattern matching | Catches more errors at compile time |

### Performance Comparison

```
Framework Benchmark (requests/sec):
┌─────────────────────────────────────────────────────┐
│ Actix-web (Rust)  ████████████████████████  ~650,000│
│ Axum (Rust)       ███████████████████████   ~580,000│
│ Go (net/http)     ████████████████          ~400,000│
│ Fastify (Node.js) ████████████              ~300,000│
│ Express (Node.js) ████████                  ~200,000│
│ FastAPI (Python)  ███                       ~30,000 │
└─────────────────────────────────────────────────────┘
```

### Ideal Use Cases for Rust

- **High-performance API services**: Scenarios requiring extremely low latency and high throughput
- **Real-time systems**: WebSocket services, game servers, trading systems
- **Infrastructure services**: Proxy servers, load balancers, message queues
- **Resource-constrained environments**: Edge computing, embedded systems
- **Safety-critical systems**: Financial services, healthcare systems, blockchain

## Rust Fundamentals Review

### Ownership and Borrowing

Rust's ownership system is the core of its memory safety, and understanding this concept is crucial for writing backend code:

```rust
// Ownership basics
fn main() {
    // Every value has an owner
    let s1 = String::from("hello");

    // Ownership transfer (move)
    let s2 = s1;
    // println!("{}", s1); // Error! s1's ownership has been moved

    // Clone (deep copy)
    let s3 = s2.clone();
    println!("s2: {}, s3: {}", s2, s3); // OK

    // Borrowing (references)
    let s4 = String::from("world");
    let len = calculate_length(&s4); // Borrow s4
    println!("The length of '{}' is {}", s4, len); // s4 is still valid
}

fn calculate_length(s: &String) -> usize {
    s.len()
} // s goes out of scope, but since it doesn't have ownership, nothing happens

// Mutable borrowing
fn append_world(s: &mut String) {
    s.push_str(", world!");
}

fn main() {
    let mut greeting = String::from("Hello");
    append_world(&mut greeting);
    println!("{}", greeting); // "Hello, world!"
}
```

### Lifetimes

Lifetimes ensure reference validity and are especially important in backend development:

```rust
// Lifetime annotations
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

// Lifetimes in structs
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

// Static lifetime
const API_VERSION: &'static str = "v1";
```

### Error Handling

Rust uses `Result` and `Option` types for error handling:

```rust
use std::fs::File;
use std::io::{self, Read};

// Result type for fallible operations
fn read_config_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?; // ? operator propagates errors
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

// Custom error types
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

// Using thiserror to simplify error definitions
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

// Using anyhow for error handling
use anyhow::{Context, Result};

fn load_config() -> Result<Config> {
    let content = std::fs::read_to_string("config.toml")
        .context("Failed to read config file")?;

    let config: Config = toml::from_str(&content)
        .context("Failed to parse config")?;

    Ok(config)
}
```

## Tokio Async Runtime

Tokio is the most popular async runtime in the Rust ecosystem, providing infrastructure for building high-performance async applications.

### Async Programming Basics

```rust
use tokio;
use std::time::Duration;

// async/await basics
async fn fetch_data(url: &str) -> Result<String, reqwest::Error> {
    let response = reqwest::get(url).await?;
    let body = response.text().await?;
    Ok(body)
}

// Using tokio::main macro to start the async runtime
#[tokio::main]
async fn main() {
    println!("Starting async operations...");

    // Execute multiple async tasks concurrently
    let (result1, result2) = tokio::join!(
        fetch_data("https://api.example.com/data1"),
        fetch_data("https://api.example.com/data2")
    );

    println!("Results: {:?}, {:?}", result1, result2);
}

// Async sleep
async fn delayed_operation() {
    println!("Starting...");
    tokio::time::sleep(Duration::from_secs(1)).await;
    println!("Done after 1 second!");
}
```

### Tasks and Concurrency

```rust
use tokio::task;
use tokio::sync::{mpsc, oneshot};

// Creating concurrent tasks
async fn process_items(items: Vec<i32>) -> Vec<i32> {
    let mut handles = Vec::new();

    for item in items {
        // spawn creates a new async task
        let handle = task::spawn(async move {
            // Simulate async processing
            tokio::time::sleep(Duration::from_millis(100)).await;
            item * 2
        });
        handles.push(handle);
    }

    // Wait for all tasks to complete
    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await.unwrap());
    }
    results
}

// Using channels for inter-task communication
async fn producer_consumer_example() {
    // Create multi-producer single-consumer channel
    let (tx, mut rx) = mpsc::channel::<String>(100);

    // Producer task
    let producer = task::spawn(async move {
        for i in 0..10 {
            tx.send(format!("Message {}", i)).await.unwrap();
            tokio::time::sleep(Duration::from_millis(50)).await;
        }
    });

    // Consumer task
    let consumer = task::spawn(async move {
        while let Some(msg) = rx.recv().await {
            println!("Received: {}", msg);
        }
    });

    // Wait for tasks to complete
    let _ = tokio::join!(producer, consumer);
}

// Using oneshot for one-time responses
async fn request_response_pattern() {
    let (tx, rx) = oneshot::channel::<String>();

    // Task handling the request
    task::spawn(async move {
        // Simulate processing
        tokio::time::sleep(Duration::from_millis(100)).await;
        tx.send("Response data".to_string()).unwrap();
    });

    // Wait for response
    let response = rx.await.unwrap();
    println!("Got response: {}", response);
}
```

### Async Synchronization Primitives

```rust
use tokio::sync::{Mutex, RwLock, Semaphore};
use std::sync::Arc;

// Async mutex
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

// Using semaphores to limit concurrency
async fn limited_concurrency() {
    let semaphore = Arc::new(Semaphore::new(3)); // Max 3 concurrent tasks
    let mut handles = Vec::new();

    for i in 0..10 {
        let permit = semaphore.clone().acquire_owned().await.unwrap();

        let handle = task::spawn(async move {
            println!("Task {} started", i);
            tokio::time::sleep(Duration::from_millis(500)).await;
            println!("Task {} completed", i);
            drop(permit); // Release permit
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.await.unwrap();
    }
}
```

### Timers and Timeouts

```rust
use tokio::time::{timeout, interval, Duration};

// Timeout handling
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

// Periodic tasks
async fn periodic_task() {
    let mut interval = interval(Duration::from_secs(1));

    loop {
        interval.tick().await;
        println!("Tick at {:?}", std::time::Instant::now());

        // Execute periodic operation
        perform_health_check().await;
    }
}

async fn perform_health_check() {
    // Health check logic
    println!("Health check passed");
}
```

## Actix-web Framework

Actix-web is the highest-performance web framework in the Rust ecosystem, built on the Actor model.

### Quick Start

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

// Simple handler function
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello, World!")
}

// Return JSON
async fn get_user(path: web::Path<u64>) -> impl Responder {
    let user_id = path.into_inner();
    let user = User {
        id: user_id,
        username: "alice".to_string(),
        email: "alice@example.com".to_string(),
    };
    HttpResponse::Ok().json(user)
}

// Receive JSON request body
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

### Routing and Extractors

```rust
use actix_web::{web, HttpRequest, HttpResponse};
use serde::Deserialize;

// Path parameter extraction
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

// Query parameter extraction
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

// Header extraction
async fn with_headers(req: HttpRequest) -> HttpResponse {
    let user_agent = req
        .headers()
        .get("User-Agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("Unknown");

    HttpResponse::Ok().body(format!("User-Agent: {}", user_agent))
}

// Form data extraction
#[derive(Deserialize)]
struct LoginForm {
    username: String,
    password: String,
}

async fn login(form: web::Form<LoginForm>) -> HttpResponse {
    // Handle login logic
    HttpResponse::Ok().body(format!("Welcome, {}", form.username))
}

// Route configuration
fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            .route("/users/{user_id}/posts/{post_id}", web::get().to(get_user_post))
            .route("/items", web::get().to(list_items))
            .route("/login", web::post().to(login))
    );
}
```

### Middleware

```rust
use actix_web::{web, App, HttpServer, HttpResponse, middleware};
use actix_web::dev::{ServiceRequest, ServiceResponse, Transform, Service};
use futures::future::{ok, Ready, LocalBoxFuture};
use std::time::Instant;

// Using built-in middleware
fn create_app() -> App<impl actix_web::dev::ServiceFactory> {
    App::new()
        .wrap(middleware::Logger::default())
        .wrap(middleware::Compress::default())
        .wrap(middleware::NormalizePath::trim())
}

// Custom middleware - Request timing
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

// Authentication middleware
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
        // Get token from request header
        let token = req
            .headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|s| s.strip_prefix("Bearer "));

        match token {
            Some(token) if validate_token(token) => {
                // Parse token to get user info
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
    // Actual token validation logic
    !token.is_empty()
}

// Using the authentication extractor
async fn protected_route(user: AuthenticatedUser) -> HttpResponse {
    HttpResponse::Ok().body(format!("Hello, {}!", user.username))
}
```

### Application State and Dependency Injection

```rust
use actix_web::{web, App, HttpServer, HttpResponse};
use std::sync::Mutex;

// Application state
struct AppState {
    app_name: String,
    request_count: Mutex<u64>,
}

// Database connection pool state
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
    // Initialize application state
    let app_state = web::Data::new(AppState {
        app_name: "My API".to_string(),
        request_count: Mutex::new(0),
    });

    // Initialize database connection pool
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

## Axum Framework

Axum is a modern web framework developed by the Tokio team, known for its clean API and excellent type safety.

### Quick Start

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

// Simple handler function
async fn hello() -> &'static str {
    "Hello, World!"
}

// Return JSON
async fn get_user(Path(id): Path<u64>) -> Json<User> {
    Json(User {
        id,
        username: "alice".to_string(),
        email: "alice@example.com".to_string(),
    })
}

// Receive JSON and return
async fn create_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateUser>,
) -> impl IntoResponse {
    // In a real application, this would save the user to the database
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

### Extractors

```rust
use axum::{
    extract::{Path, Query, State, Json, Request, ConnectInfo},
    http::{header::HeaderMap, Method},
};
use std::net::SocketAddr;

// Path parameters
async fn get_user_post(
    Path((user_id, post_id)): Path<(u64, u64)>,
) -> String {
    format!("User {} Post {}", user_id, post_id)
}

// Query parameters
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

// Request headers
async fn with_headers(headers: HeaderMap) -> String {
    let user_agent = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("Unknown");

    format!("User-Agent: {}", user_agent)
}

// Combining multiple extractors
async fn complex_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<u64>,
    Query(params): Query<Pagination>,
    headers: HeaderMap,
    Json(body): Json<CreateUser>,
) -> impl IntoResponse {
    // Can access state, path params, query params, headers, and body simultaneously
    Json(serde_json::json!({
        "id": id,
        "page": params.page,
        "username": body.username
    }))
}

// Custom extractor
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

        // Validate token and extract user info
        // Simplified actual validation logic here
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

### Routing and Nesting

```rust
use axum::{
    routing::{get, post, put, delete},
    Router,
};

// Modular routing
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

// Combining all routes
fn create_app(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .nest("/api/v1/users", user_routes())
        .nest("/api/v1/posts", post_routes())
        .nest("/admin", admin_routes())
        .with_state(state)
}

// API version management
fn api_v1() -> Router<Arc<AppState>> {
    Router::new()
        .nest("/users", user_routes())
        .nest("/posts", post_routes())
}

fn api_v2() -> Router<Arc<AppState>> {
    // V2 API may have different structure
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

### Middleware and Tower Layers

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

// Using tower-http middleware
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

// Custom middleware function
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

// Authentication middleware
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
            // Validate token
            Ok(next.run(req).await)
        }
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}

// Applying middleware to specific routes
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

## Database Access

### SQLx - Compile-time Checked SQL

```toml
# Cargo.toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "macros"] }
```

```rust
use sqlx::{PgPool, FromRow, postgres::PgPoolOptions};

// Database model
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

// Initialize connection pool
async fn init_db() -> PgPool {
    PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect("postgres://user:password@localhost/mydb")
        .await
        .expect("Failed to create pool")
}

// Using query_as! macro (compile-time type checking)
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

// Insert data
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

// Update data
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

// Delete data
async fn delete_user(pool: &PgPool, id: i64) -> Result<bool, sqlx::Error> {
    let result = sqlx::query!(
        "DELETE FROM users WHERE id = $1",
        id
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected() > 0)
}

// Paginated query
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

// Transaction handling
async fn transfer_funds(
    pool: &PgPool,
    from_account: i64,
    to_account: i64,
    amount: i64,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;

    // Debit
    sqlx::query!(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
        amount,
        from_account
    )
    .execute(&mut *tx)
    .await?;

    // Credit
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

### Diesel - Type-safe ORM

```toml
# Cargo.toml
[dependencies]
diesel = { version = "2.1", features = ["postgres", "r2d2", "chrono"] }
```

```rust
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};

// Define table schema (generated via diesel migration)
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

// Model definitions
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

// Connection pool setup
type DbPool = Pool<ConnectionManager<PgConnection>>;

fn init_pool(database_url: &str) -> DbPool {
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    Pool::builder()
        .max_size(10)
        .build(manager)
        .expect("Failed to create pool")
}

// CRUD operations
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

// Complex queries
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

### Database Migrations

```bash
# Using sqlx-cli
cargo install sqlx-cli

# Create migration
sqlx migrate add create_users_table

# Run migrations
sqlx migrate run

# Revert migrations
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

-- Auto-update updated_at
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

## Building REST APIs

### Complete API Example

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

// Application state
#[derive(Clone)]
struct AppState {
    db: PgPool,
}

// Data Transfer Objects (DTOs)
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

// Error handling
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

// Handler functions
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
    // Validate input
    req.validate()
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;

    // Hash password
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

    // Dynamically build update query
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

// Route configuration
fn user_routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_users).post(create_user))
        .route("/:id", get(get_user).put(update_user).delete(delete_user))
}

// Main function
#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::init();

    // Load configuration
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    // Initialize database connection pool
    let pool = sqlx::PgPool::connect(&database_url)
        .await
        .expect("Failed to create pool");

    // Run migrations
    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let state = Arc::new(AppState { db: pool });

    // Build application
    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .nest("/api/v1/users", user_routes())
        .with_state(state);

    // Start server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080")
        .await
        .unwrap();

    println!("Server running on http://0.0.0.0:8080");
    axum::serve(listener, app).await.unwrap();
}

// Helper function
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

### Authentication and Authorization

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
    sub: i64,           // User ID
    username: String,
    roles: Vec<String>,
    exp: usize,         // Expiration time
    iat: usize,         // Issued at
}

// Authentication configuration
struct AuthConfig {
    secret: String,
    token_expiry: i64,
}

// Authenticated user
#[derive(Debug, Clone)]
struct AuthUser {
    user_id: i64,
    username: String,
    roles: Vec<String>,
}

// Extract authenticated user from request
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

// Authentication errors
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

// Generate JWT
fn generate_token(user_id: i64, username: &str, roles: Vec<String>) -> Result<String, AuthError> {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let now = chrono::Utc::now().timestamp() as usize;

    let claims = Claims {
        sub: user_id,
        username: username.to_string(),
        roles,
        exp: now + 3600 * 24, // 24-hour expiration
        iat: now,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|_| AuthError::InvalidToken)
}

// Login handler
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
    // Find user
    let user = sqlx::query!(
        "SELECT id, username, password_hash, roles FROM users WHERE username = $1",
        req.username
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AuthError::InvalidToken)?
    .ok_or(AuthError::InvalidToken)?;

    // Verify password
    use argon2::{Argon2, PasswordHash, PasswordVerifier};
    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| AuthError::InvalidToken)?;

    Argon2::default()
        .verify_password(req.password.as_bytes(), &parsed_hash)
        .map_err(|_| AuthError::InvalidToken)?;

    // Generate token
    let token = generate_token(user.id, &user.username, user.roles)?;

    Ok(Json(LoginResponse {
        token,
        expires_in: 3600 * 24,
    }))
}

// Protected route
async fn protected_route(user: AuthUser) -> impl IntoResponse {
    Json(serde_json::json!({
        "message": format!("Hello, {}!", user.username),
        "user_id": user.user_id
    }))
}

// Role-based access control
struct RequireRole(String);

#[async_trait::async_trait]
impl<S> FromRequestParts<S> for RequireRole
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let user = AuthUser::from_request_parts(parts, state).await?;

        // Check role here - actual implementation would get required role from extension
        if user.roles.contains(&"admin".to_string()) {
            Ok(RequireRole("admin".to_string()))
        } else {
            Err(AuthError::InsufficientPermissions)
        }
    }
}

// Admin-only route
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

## Testing

### Unit Tests

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
            username: "ab".to_string(), // Too short
            email: "invalid-email".to_string(), // Invalid email
            password: "short".to_string(), // Password too short
        };

        assert!(invalid_request.validate().is_err());
    }
}
```

### Integration Tests

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

        // Run migrations
        sqlx::migrate!().run(&pool).await.unwrap();

        // Clean up test data
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

        // Create user
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

        // Get created user
        let body = axum::body::to_bytes(create_response.into_body(), 1024 * 1024)
            .await
            .unwrap();
        let user: serde_json::Value = serde_json::from_slice(&body).unwrap();
        let user_id = user["id"].as_i64().unwrap();

        // Verify user can be fetched by ID
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

        // Create multiple test users
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

        // Test pagination
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

### Mocking

```rust
use mockall::predicate::*;
use mockall::mock;

// Define trait
#[async_trait::async_trait]
trait UserRepository {
    async fn find_by_id(&self, id: i64) -> Result<Option<User>, sqlx::Error>;
    async fn create(&self, user: &NewUser) -> Result<User, sqlx::Error>;
    async fn delete(&self, id: i64) -> Result<bool, sqlx::Error>;
}

// Generate mock
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

        // Set expectations
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

        // Test with mock
        let result = mock_repo.find_by_id(1).await.unwrap();
        assert!(result.is_some());
        assert_eq!(result.unwrap().username, "testuser");
    }
}
```

## Deployment and Operations

### Docker Deployment

```dockerfile
# Dockerfile
# Build stage
FROM rust:1.75 as builder

WORKDIR /usr/src/app

# Copy Cargo files and cache dependencies
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy source code and build
COPY . .
RUN touch src/main.rs
RUN cargo build --release

# Runtime stage
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

### Configuration Management

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
            // Default configuration
            .add_source(File::with_name("config/default"))
            // Environment-specific configuration
            .add_source(File::with_name(&format!("config/{}", run_mode)).required(false))
            // Local overrides (not committed to version control)
            .add_source(File::with_name("config/local").required(false))
            // Environment variable overrides (prefix APP_)
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

### Logging and Observability

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

// Structured logging
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

// Error logging
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

### Health Checks and Metrics

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

// Health check endpoint
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

// Metrics endpoint
async fn metrics() -> String {
    let encoder = TextEncoder::new();
    let metric_families = prometheus::gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    String::from_utf8(buffer).unwrap()
}

// Request counting middleware
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

## Best Practices Summary

### Code Organization

```
src/
├── main.rs                 # Application entry point
├── lib.rs                  # Library exports
├── config/                 # Configuration management
│   ├── mod.rs
│   └── settings.rs
├── api/                    # API layer
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
├── domain/                 # Business logic layer
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
├── infrastructure/         # Infrastructure layer
│   ├── mod.rs
│   ├── database/
│   │   ├── mod.rs
│   │   └── postgres.rs
│   └── external/
│       └── email.rs
└── errors/                 # Error handling
    ├── mod.rs
    └── api_error.rs
```

### Performance Optimization Tips

1. **Connection pool configuration**: Configure database connection pool size appropriately based on load
2. **Async operations**: Use async I/O whenever possible, avoid blocking
3. **Batch operations**: Use batch insert/update instead of looping single operations
4. **Caching**: Use Redis or other caches appropriately to reduce database pressure
5. **Index optimization**: Ensure queries have appropriate database index support
6. **Compile optimization**: Use `--release` flag for production builds

### Security Recommendations

1. **Input validation**: Always validate and sanitize user input
2. **Password hashing**: Use Argon2 or bcrypt for password hashing
3. **HTTPS**: Enforce HTTPS in production environments
4. **Rate limiting**: Implement API rate limiting to prevent abuse
5. **SQL injection**: Use parameterized queries (SQLx and Diesel support this by default)
6. **CORS**: Configure Cross-Origin Resource Sharing policies correctly

## Summary

Rust backend development combines exceptional performance, memory safety, and modern development experience. Through the Tokio async runtime, Actix-web or Axum frameworks, and SQLx or Diesel database access layers, you can build high-performance, reliable backend services.

While Rust has a relatively steep learning curve, its performance advantages, safety guarantees, and long-term maintainability make it an ideal choice for building mission-critical business systems. As the Rust ecosystem continues to mature, increasingly enterprises are adopting Rust for backend development, especially in scenarios requiring high performance and high reliability.
