---
title: Cargo Workspaces 工作区
description: 深入理解 Rust Cargo Workspaces：多包项目管理、共享依赖、构建优化与最佳实践
track: rust
section: cargo-tooling
difficulty: intermediate
tags:
  - Rust
  - Cargo
  - Workspaces
  - 多包管理
  - Monorepo
status: imported
origin: old/src/content/docs/rust/cargo-workspaces.zh.md
divergence: 0.201
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 工具链
  order: 10
  lastUpdated: 2026-01-07
---

## 概念解释

Cargo Workspace（工作区）是 Rust 中管理多个相关 crate 的机制。它允许将多个包组织在一个统一的项目结构中，共享依赖版本、构建输出目录和锁文件，从而实现高效的多包项目管理。

### 什么是 Workspace

Workspace 是一组共享同一 `Cargo.lock` 和输出目录的包集合。它解决了以下核心问题：

- **代码复用**：将公共功能提取到独立的库 crate 中
- **关注点分离**：将大型项目拆分为多个职责明确的模块
- **依赖一致性**：确保所有成员使用相同版本的外部依赖
- **构建效率**：共享编译缓存，避免重复编译

### Workspace 与普通项目的区别

| 特性 | 普通项目 | Workspace |
|------|---------|-----------|
| Cargo.lock | 每个项目独立 | 所有成员共享 |
| target 目录 | 每个项目独立 | 所有成员共享 |
| 依赖版本 | 各自管理 | 可统一管理 |
| 构建缓存 | 无法共享 | 自动共享 |
| 内部依赖 | 通过 path 或发布 | 直接引用 |

### 适用场景

Workspace 特别适合以下场景：

1. **Monorepo 架构**：将整个产品线放在一个仓库中
2. **微服务项目**：多个服务共享核心库
3. **CLI + 库**：同时提供命令行工具和 API
4. **插件系统**：核心框架与可选插件分离
5. **前后端分离**：共享类型定义和验证逻辑

## 核心原理

### Workspace 解析机制

当 Cargo 执行命令时，会按以下顺序查找 workspace 根目录：

```
1. 当前目录的 Cargo.toml 是否包含 [workspace]
2. 向上遍历父目录查找包含 [workspace] 的 Cargo.toml
3. 如果 Cargo.toml 包含 [package]，检查是否有 package.workspace = true
```

**查找过程示意图：**

```
my_workspace/
├── Cargo.toml          <- [workspace] 定义在这里
├── app/
│   ├── Cargo.toml      <- cargo build 从这里执行
│   └── src/
└── lib/
    ├── Cargo.toml
    └── src/
```

当在 `app/` 目录执行 `cargo build` 时，Cargo 会向上查找并识别 `my_workspace/Cargo.toml` 为 workspace 根。

### 依赖解析策略

Workspace 使用统一的依赖解析器（Resolver），所有成员的依赖被合并解析：

```rust
// 依赖解析过程（伪代码）
fn resolve_workspace_dependencies(workspace: &Workspace) {
    let mut all_deps = DependencyGraph::new();

    // 1. 收集所有成员的依赖
    for member in workspace.members() {
        all_deps.merge(member.dependencies());
    }

    // 2. 统一版本解析
    let resolved = resolve_versions(all_deps);

    // 3. 写入共享的 Cargo.lock
    workspace.write_lock_file(resolved);
}
```

### Resolver 版本差异

Cargo 支持两种解析器版本：

```toml
[workspace]
resolver = "2"  # 推荐使用
```

**Resolver 1 vs Resolver 2：**

| 特性 | Resolver 1 | Resolver 2 |
|------|-----------|-----------|
| Feature 统一 | 是 | 否（更精确） |
| 平台特定依赖 | 全部包含 | 仅目标平台 |
| dev-dependencies | 影响 normal | 独立处理 |
| 默认版本 | edition 2018 及之前 | edition 2021 |

**Resolver 2 的优势示例：**

```toml
# 假设有以下依赖
[dependencies]
tokio = { version = "1.0", features = ["rt"] }

[dev-dependencies]
tokio = { version = "1.0", features = ["rt-multi-thread"] }

# Resolver 1: 发布版本也会包含 rt-multi-thread
# Resolver 2: 发布版本仅包含 rt，测试时才启用 rt-multi-thread
```

### 构建缓存机制

Workspace 的所有成员共享 `target/` 目录，这意味着：

```
my_workspace/
└── target/
    ├── debug/
    │   ├── deps/           # 所有依赖的编译产物
    │   ├── build/          # build.rs 输出
    │   ├── app             # app 二进制
    │   └── libcore.rlib    # core 库
    └── release/
        └── ...
```

共享缓存带来的好处：

1. **避免重复编译**：公共依赖只编译一次
2. **增量构建**：修改一个 crate 只重新编译受影响的部分
3. **磁盘空间**：大幅减少存储占用

## 核心要点

### Workspace 配置结构

**虚拟 Workspace（推荐）：**

```toml
# 根目录 Cargo.toml - 不包含 [package]
[workspace]
members = [
    "crates/*",           # 通配符匹配
    "apps/server",
    "apps/cli",
]

exclude = [
    "crates/deprecated",  # 排除特定目录
    "experiments",
]

resolver = "2"
```

**非虚拟 Workspace：**

```toml
# 根目录 Cargo.toml - 同时是一个包
[package]
name = "my_app"
version = "0.1.0"
edition = "2021"

[workspace]
members = ["core", "utils"]
```

### 成员配置

每个成员包有自己的 `Cargo.toml`：

```toml
# crates/core/Cargo.toml
[package]
name = "my-core"
version = "0.1.0"
edition = "2021"

# 引用同一 workspace 的其他成员
[dependencies]
my-utils = { path = "../utils" }
```

### 工作区级依赖（Cargo 1.64+）

使用 `[workspace.dependencies]` 统一管理依赖版本：

```toml
# 根 Cargo.toml
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.35", features = ["full"] }
thiserror = "1.0"
anyhow = "1.0"

# 本地成员也可以定义
my-core = { path = "crates/core" }
my-utils = { path = "crates/utils", default-features = false }
```

```toml
# crates/app/Cargo.toml
[dependencies]
serde.workspace = true           # 继承版本和 features
tokio.workspace = true
my-core.workspace = true

# 可以添加额外的 features
serde = { workspace = true, features = ["rc"] }
```

### 工作区级元数据

共享包元数据以减少重复：

```toml
# 根 Cargo.toml
[workspace.package]
version = "0.1.0"
edition = "2021"
authors = ["Team <team@example.com>"]
license = "MIT OR Apache-2.0"
repository = "https://github.com/org/project"
rust-version = "1.75"
```

```toml
# crates/core/Cargo.toml
[package]
name = "my-core"
version.workspace = true
edition.workspace = true
authors.workspace = true
license.workspace = true
repository.workspace = true
rust-version.workspace = true

# 可以覆盖特定字段
description = "核心功能库"
```

### Workspace 命令

```bash
# 构建
cargo build --workspace              # 构建所有成员
cargo build -p my-core               # 构建特定成员
cargo build -p my-core -p my-utils   # 构建多个成员

# 测试
cargo test --workspace               # 测试所有成员
cargo test -p my-core                # 测试特定成员
cargo test --workspace --exclude my-app  # 排除某些成员

# 运行
cargo run -p my-app                  # 运行特定二进制
cargo run -p my-cli -- --help        # 传递参数

# 检查
cargo check --workspace
cargo clippy --workspace -- -D warnings

# 文档
cargo doc --workspace --no-deps
```

## 代码示例

### 完整 Workspace 项目结构

```
my_project/
├── Cargo.toml                 # Workspace 根配置
├── Cargo.lock                 # 共享锁文件
├── README.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── crates/
│   ├── core/                  # 核心业务逻辑
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── error.rs
│   │       └── models/
│   │           ├── mod.rs
│   │           └── user.rs
│   ├── db/                    # 数据库层
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── lib.rs
│   └── utils/                 # 工具函数
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
├── apps/
│   ├── server/                # Web 服务器
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── main.rs
│   └── cli/                   # 命令行工具
│       ├── Cargo.toml
│       └── src/
│           └── main.rs
└── tests/
    └── integration/           # 集成测试
        ├── Cargo.toml
        └── tests/
            └── api_test.rs
```

### Workspace 根配置

```toml
# Cargo.toml
[workspace]
members = [
    "crates/*",
    "apps/*",
    "tests/*",
]
resolver = "2"

# 共享依赖版本
[workspace.dependencies]
# 序列化
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# 异步运行时
tokio = { version = "1.35", features = ["full"] }

# Web 框架
axum = "0.7"
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }

# 数据库
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid"] }

# 错误处理
thiserror = "1.0"
anyhow = "1.0"

# 日志
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# 测试
tokio-test = "0.4"
mockall = "0.12"

# 本地 crates
my-core = { path = "crates/core" }
my-db = { path = "crates/db" }
my-utils = { path = "crates/utils" }

# 共享元数据
[workspace.package]
version = "0.1.0"
edition = "2021"
authors = ["开发团队 <dev@example.com>"]
license = "MIT"
repository = "https://github.com/org/my_project"
rust-version = "1.75"
```

### 核心库配置

```toml
# crates/core/Cargo.toml
[package]
name = "my-core"
version.workspace = true
edition.workspace = true
authors.workspace = true
license.workspace = true

description = "核心业务逻辑库"

[dependencies]
serde.workspace = true
thiserror.workspace = true
tracing.workspace = true
my-utils.workspace = true

[dev-dependencies]
tokio-test.workspace = true
```

```rust
// crates/core/src/lib.rs
//! 核心业务逻辑库
//!
//! 提供用户管理、权限验证等核心功能。

pub mod error;
pub mod models;

pub use error::{CoreError, Result};
pub use models::user::User;
```

```rust
// crates/core/src/error.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CoreError {
    #[error("用户不存在: {0}")]
    UserNotFound(String),

    #[error("验证失败: {0}")]
    ValidationError(String),

    #[error("权限不足")]
    Unauthorized,

    #[error("内部错误: {0}")]
    Internal(#[from] anyhow::Error),
}

pub type Result<T> = std::result::Result<T, CoreError>;
```

```rust
// crates/core/src/models/user.rs
use serde::{Deserialize, Serialize};
use my_utils::validation;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: uuid::Uuid,
    pub email: String,
    pub name: String,
    pub role: UserRole,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    User,
    Guest,
}

impl User {
    pub fn new(email: String, name: String) -> crate::Result<Self> {
        if !validation::is_valid_email(&email) {
            return Err(crate::CoreError::ValidationError(
                "无效的邮箱格式".into()
            ));
        }

        Ok(Self {
            id: uuid::Uuid::new_v4(),
            email,
            name,
            role: UserRole::User,
        })
    }

    pub fn is_admin(&self) -> bool {
        self.role == UserRole::Admin
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_user() {
        let user = User::new(
            "test@example.com".into(),
            "Test User".into()
        ).unwrap();

        assert_eq!(user.email, "test@example.com");
        assert_eq!(user.role, UserRole::User);
    }

    #[test]
    fn test_invalid_email() {
        let result = User::new("invalid".into(), "Test".into());
        assert!(result.is_err());
    }
}
```

### 工具库配置

```toml
# crates/utils/Cargo.toml
[package]
name = "my-utils"
version.workspace = true
edition.workspace = true

description = "通用工具函数库"

[dependencies]
# 这个库尽量保持轻量，减少依赖
regex = "1.10"

[features]
default = []
full = ["async"]
async = ["tokio"]

[dependencies.tokio]
workspace = true
optional = true
```

```rust
// crates/utils/src/lib.rs
//! 通用工具函数库

pub mod validation;

#[cfg(feature = "async")]
pub mod async_utils;
```

```rust
// crates/utils/src/validation.rs
use regex::Regex;
use std::sync::LazyLock;

static EMAIL_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
        .expect("无效的正则表达式")
});

/// 验证邮箱格式
///
/// # 示例
///
/// ```
/// use my_utils::validation::is_valid_email;
///
/// assert!(is_valid_email("user@example.com"));
/// assert!(!is_valid_email("invalid-email"));
/// ```
pub fn is_valid_email(email: &str) -> bool {
    EMAIL_REGEX.is_match(email)
}

/// 验证密码强度
pub fn is_strong_password(password: &str) -> bool {
    password.len() >= 8
        && password.chars().any(|c| c.is_uppercase())
        && password.chars().any(|c| c.is_lowercase())
        && password.chars().any(|c| c.is_numeric())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_email_validation() {
        assert!(is_valid_email("test@example.com"));
        assert!(is_valid_email("user.name@domain.org"));
        assert!(!is_valid_email("invalid"));
        assert!(!is_valid_email("@example.com"));
    }

    #[test]
    fn test_password_strength() {
        assert!(is_strong_password("Password123"));
        assert!(!is_strong_password("weak"));
        assert!(!is_strong_password("alllowercase123"));
    }
}
```

### 数据库层配置

```toml
# crates/db/Cargo.toml
[package]
name = "my-db"
version.workspace = true
edition.workspace = true

description = "数据库访问层"

[dependencies]
sqlx.workspace = true
tokio.workspace = true
thiserror.workspace = true
tracing.workspace = true
my-core.workspace = true

[dev-dependencies]
tokio-test.workspace = true
```

```rust
// crates/db/src/lib.rs
use my_core::{User, CoreError};
use sqlx::{PgPool, postgres::PgPoolOptions};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("数据库连接失败: {0}")]
    Connection(#[from] sqlx::Error),

    #[error("记录不存在")]
    NotFound,
}

pub type Result<T> = std::result::Result<T, DbError>;

/// 数据库连接池
pub struct Database {
    pool: PgPool,
}

impl Database {
    /// 创建新的数据库连接
    pub async fn connect(database_url: &str) -> Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(10)
            .connect(database_url)
            .await?;

        tracing::info!("数据库连接成功");

        Ok(Self { pool })
    }

    /// 根据 ID 获取用户
    pub async fn get_user(&self, id: uuid::Uuid) -> Result<User> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, name, role as "role: _"
            FROM users
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?
        .ok_or(DbError::NotFound)?;

        Ok(user)
    }

    /// 创建用户
    pub async fn create_user(&self, user: &User) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO users (id, email, name, role)
            VALUES ($1, $2, $3, $4)
            "#,
            user.id,
            user.email,
            user.name,
            user.role as _
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
```

### Web 服务器配置

```toml
# apps/server/Cargo.toml
[package]
name = "my-server"
version.workspace = true
edition.workspace = true

description = "Web API 服务器"

[[bin]]
name = "server"
path = "src/main.rs"

[dependencies]
# Workspace 依赖
axum.workspace = true
tower.workspace = true
tower-http.workspace = true
tokio.workspace = true
serde.workspace = true
serde_json.workspace = true
tracing.workspace = true
tracing-subscriber.workspace = true
anyhow.workspace = true

# 本地 crates
my-core.workspace = true
my-db.workspace = true
my-utils.workspace = true

# 服务器特定依赖
uuid = { version = "1.6", features = ["v4", "serde"] }
dotenvy = "0.15"
```

```rust
// apps/server/src/main.rs
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use my_core::User;
use my_db::Database;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

// 应用状态
struct AppState {
    db: Database,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 初始化日志
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    // 加载环境变量
    dotenvy::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL 必须设置");

    // 连接数据库
    let db = Database::connect(&database_url).await?;
    let state = Arc::new(AppState { db });

    // 构建路由
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/users", post(create_user))
        .route("/users/:id", get(get_user))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // 启动服务器
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("服务器启动在 http://0.0.0.0:3000");
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}

#[derive(Deserialize)]
struct CreateUserRequest {
    email: String,
    name: String,
}

#[derive(Serialize)]
struct UserResponse {
    id: uuid::Uuid,
    email: String,
    name: String,
}

async fn create_user(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateUserRequest>,
) -> Result<Json<UserResponse>, StatusCode> {
    let user = User::new(req.email, req.name)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    state.db.create_user(&user).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(UserResponse {
        id: user.id,
        email: user.email,
        name: user.name,
    }))
}

async fn get_user(
    State(state): State<Arc<AppState>>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<UserResponse>, StatusCode> {
    let user = state.db.get_user(id).await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(UserResponse {
        id: user.id,
        email: user.email,
        name: user.name,
    }))
}
```

### CLI 工具配置

```toml
# apps/cli/Cargo.toml
[package]
name = "my-cli"
version.workspace = true
edition.workspace = true

description = "命令行管理工具"

[[bin]]
name = "myctl"
path = "src/main.rs"

[dependencies]
tokio.workspace = true
serde.workspace = true
serde_json.workspace = true
anyhow.workspace = true
my-core.workspace = true
my-db.workspace = true

clap = { version = "4.4", features = ["derive"] }
colored = "2.1"
```

```rust
// apps/cli/src/main.rs
use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::Colorize;
use my_core::User;

#[derive(Parser)]
#[command(name = "myctl")]
#[command(about = "项目管理命令行工具")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// 用户管理
    User {
        #[command(subcommand)]
        action: UserAction,
    },
    /// 显示系统信息
    Info,
}

#[derive(Subcommand)]
enum UserAction {
    /// 创建用户
    Create {
        #[arg(short, long)]
        email: String,
        #[arg(short, long)]
        name: String,
    },
    /// 列出用户
    List,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::User { action } => {
            match action {
                UserAction::Create { email, name } => {
                    match User::new(email.clone(), name.clone()) {
                        Ok(user) => {
                            println!("{} 用户创建成功", "✓".green());
                            println!("  ID: {}", user.id);
                            println!("  Email: {}", user.email);
                            println!("  Name: {}", user.name);
                        }
                        Err(e) => {
                            eprintln!("{} 创建失败: {}", "✗".red(), e);
                        }
                    }
                }
                UserAction::List => {
                    println!("{}", "用户列表功能待实现".yellow());
                }
            }
        }
        Commands::Info => {
            println!("{}", "系统信息".cyan().bold());
            println!("  版本: {}", env!("CARGO_PKG_VERSION"));
            println!("  Rust: {}", rustc_version());
        }
    }

    Ok(())
}

fn rustc_version() -> &'static str {
    env!("CARGO_PKG_RUST_VERSION")
}
```

## 最佳实践

### 目录结构规范

```
project/
├── Cargo.toml              # Workspace 配置
├── Cargo.lock              # 必须提交到版本控制
├── .cargo/
│   └── config.toml         # Cargo 配置
├── crates/                  # 库 crates
│   ├── core/               # 按职责命名
│   ├── api/
│   └── storage/
├── apps/                    # 可执行程序
│   ├── server/
│   └── cli/
├── examples/                # 示例代码
└── tests/                   # 集成测试
```

### 依赖管理策略

**版本统一原则：**

```toml
# 根 Cargo.toml
[workspace.dependencies]
# 所有成员使用相同版本
serde = { version = "1.0.195", features = ["derive"] }

# 避免版本碎片化
# 不好：成员 A 用 serde 1.0.190，成员 B 用 serde 1.0.195
```

**Feature 管理：**

```toml
[workspace.dependencies]
# 在 workspace 级别定义基础 features
tokio = { version = "1.35", features = ["rt", "macros"] }

# 成员可以扩展但不能移除
[dependencies]
tokio = { workspace = true, features = ["rt-multi-thread"] }
```

### 内部依赖规范

```toml
# 使用 workspace 引用内部 crate
[workspace.dependencies]
my-core = { path = "crates/core" }
my-utils = { path = "crates/utils", default-features = false }

# 成员中使用
[dependencies]
my-core.workspace = true
```

### 发布顺序管理

发布 workspace 成员时需要按依赖顺序：

```bash
# 先发布没有内部依赖的 crates
cargo publish -p my-utils

# 发布依赖已发布包的 crates
cargo publish -p my-core    # 依赖 my-utils

# 最后发布应用层
cargo publish -p my-db      # 依赖 my-core
cargo publish -p my-server  # 依赖所有
```

使用工具自动化：

```bash
cargo install cargo-workspaces
cargo ws publish --from-git
```

### CI/CD 配置

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

env:
  CARGO_TERM_COLOR: always
  RUSTFLAGS: "-D warnings"

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt

      - name: 缓存依赖
        uses: Swatinem/rust-cache@v2
        with:
          workspaces: ". -> target"

      - name: 检查格式
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy --workspace --all-targets --all-features

      - name: 测试
        run: cargo test --workspace --all-features

      - name: 构建
        run: cargo build --workspace --release
```

## 常见陷阱

### 循环依赖

```
错误示例：
crates/a 依赖 crates/b
crates/b 依赖 crates/a

解决方案：
1. 提取共享代码到第三个 crate
2. 使用 trait 和泛型解耦
3. 重新设计模块边界
```

```rust
// 使用 trait 解耦
// crates/common/src/lib.rs
pub trait Storage {
    fn save(&self, data: &[u8]) -> Result<(), Error>;
}

// crates/core/src/lib.rs
use common::Storage;

pub struct Service<S: Storage> {
    storage: S,
}

// crates/storage/src/lib.rs
use common::Storage;

pub struct FileStorage;
impl Storage for FileStorage { ... }
```

### Feature 冲突

```toml
# 问题：不同成员需要同一依赖的不同 features
# 成员 A
tokio = { version = "1", features = ["rt"] }

# 成员 B
tokio = { version = "1", features = ["rt-multi-thread"] }

# Resolver 2 会正确处理，但可能导致意外行为

# 解决方案：在 workspace 级别统一
[workspace.dependencies]
tokio = { version = "1", features = ["rt", "rt-multi-thread"] }
```

### Path 依赖发布问题

```toml
# 问题：path 依赖无法发布
[dependencies]
my-utils = { path = "../utils" }  # 发布时会失败

# 解决方案：同时指定版本
[dependencies]
my-utils = { path = "../utils", version = "0.1.0" }
# Cargo 会在发布时使用 version，本地开发使用 path
```

### Workspace 成员找不到

```toml
# 问题：通配符可能不匹配预期目录
[workspace]
members = ["crates/*"]  # 只匹配一级子目录

# 解决方案：明确列出或使用多级通配符
members = [
    "crates/*",
    "crates/plugins/*",  # 嵌套目录需要单独列出
]
```

### 构建脚本冲突

```rust
// 问题：多个成员的 build.rs 可能冲突

// 解决方案：使用 OUT_DIR 隔离输出
// build.rs
fn main() {
    let out_dir = std::env::var("OUT_DIR").unwrap();
    // 所有生成文件写入 OUT_DIR
    // 每个成员有独立的 OUT_DIR
}
```

## 性能考量

### 编译时间优化

**增量编译配置：**

```toml
# .cargo/config.toml
[build]
incremental = true

# 开发时依赖优化
[profile.dev.package."*"]
opt-level = 2

# 自己的代码保持快速编译
[profile.dev.package.my-core]
opt-level = 0
```

**使用更快的链接器：**

```toml
# Linux (使用 mold)
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]

# macOS (使用 zld 或 lld)
[target.x86_64-apple-darwin]
rustflags = ["-C", "link-arg=-fuse-ld=/usr/local/bin/zld"]
```

### 构建缓存利用

```bash
# 使用 sccache 加速编译
cargo install sccache
export RUSTC_WRAPPER=sccache

# 查看缓存状态
sccache --show-stats
```

### 并行构建

```bash
# 增加并行任务数
cargo build -j 8

# 或在配置中设置
[build]
jobs = 8
```

### 依赖树精简

```bash
# 分析依赖
cargo tree -d  # 显示重复依赖
cargo tree -e features  # 显示 feature 依赖

# 使用 cargo-machete 查找未使用依赖
cargo install cargo-machete
cargo machete
```

### 分层构建策略

```dockerfile
# Dockerfile - 利用 Docker 缓存层
FROM rust:1.75 as builder

# 先复制 Cargo 文件
COPY Cargo.toml Cargo.lock ./
COPY crates/core/Cargo.toml crates/core/
COPY crates/utils/Cargo.toml crates/utils/
COPY apps/server/Cargo.toml apps/server/

# 创建虚拟源文件触发依赖下载
RUN mkdir -p crates/core/src && echo "pub fn dummy() {}" > crates/core/src/lib.rs
RUN mkdir -p crates/utils/src && echo "pub fn dummy() {}" > crates/utils/src/lib.rs
RUN mkdir -p apps/server/src && echo "fn main() {}" > apps/server/src/main.rs

# 构建依赖（这一层会被缓存）
RUN cargo build --release -p my-server

# 复制真实源码
COPY . .
RUN touch crates/*/src/*.rs apps/*/src/*.rs

# 最终构建
RUN cargo build --release -p my-server
```

## 实战场景

### 场景一：微服务项目

```
microservices/
├── Cargo.toml
├── proto/                      # Protocol Buffers
│   └── api.proto
├── crates/
│   ├── proto/                  # 生成的代码
│   ├── shared/                 # 共享类型
│   └── client/                 # 服务间调用客户端
└── services/
    ├── user-service/
    ├── order-service/
    └── payment-service/
```

```toml
# 根 Cargo.toml
[workspace]
members = ["crates/*", "services/*"]
resolver = "2"

[workspace.dependencies]
tonic = "0.10"
prost = "0.12"
shared = { path = "crates/shared" }
```

### 场景二：CLI + GUI + Library

```
my_app/
├── Cargo.toml
├── crates/
│   └── core/                   # 核心库
├── apps/
│   ├── cli/                    # 命令行版本
│   └── gui/                    # 图形界面版本
└── bindings/
    ├── python/                 # Python 绑定
    └── wasm/                   # WebAssembly
```

### 场景三：插件系统

```
plugin_system/
├── Cargo.toml
├── crates/
│   ├── core/                   # 核心框架
│   └── plugin-api/             # 插件 API trait
└── plugins/
    ├── plugin-a/
    ├── plugin-b/
    └── plugin-c/
```

```rust
// crates/plugin-api/src/lib.rs
pub trait Plugin: Send + Sync {
    fn name(&self) -> &str;
    fn execute(&self, input: &str) -> Result<String, PluginError>;
}

// plugins/plugin-a/src/lib.rs
use plugin_api::Plugin;

pub struct PluginA;

impl Plugin for PluginA {
    fn name(&self) -> &str { "Plugin A" }
    fn execute(&self, input: &str) -> Result<String, PluginError> {
        Ok(format!("Processed by A: {}", input))
    }
}
```

## 面试要点

### 常见面试问题

**1. Workspace 解决了什么问题？**

Workspace 解决了多包项目的以下问题：
- 依赖版本碎片化
- 重复编译开销
- 磁盘空间浪费
- 内部依赖管理复杂

**2. workspace.dependencies 的优势是什么？**

- 中心化版本管理，一处修改全局生效
- 减少配置重复
- 强制版本一致性
- 简化升级维护

**3. Resolver 1 和 2 的区别？**

Resolver 2（推荐）：
- Feature 不会跨 crate 统一
- dev-dependencies 的 features 不影响 release 构建
- 平台特定依赖只在目标平台解析

**4. 如何处理 workspace 成员的发布顺序？**

需要按依赖图的拓扑顺序发布：
1. 先发布叶子节点（无内部依赖的 crate）
2. 逐层向上发布
3. 使用 cargo-workspaces 自动化

**5. Path 依赖如何发布？**

```toml
# 同时指定 path 和 version
my-lib = { path = "../lib", version = "1.0" }
# 本地开发用 path，发布时用 version
```

### 代码考察题

**实现 workspace 级别的 feature 传递：**

```toml
# 根 Cargo.toml
[workspace.dependencies]
tokio = { version = "1", default-features = false }

[features]
default = ["async-full"]
async-full = []
async-minimal = []

# 成员 Cargo.toml
[features]
default = []
async-full = ["tokio/rt-multi-thread", "tokio/macros"]
async-minimal = ["tokio/rt"]

[dependencies.tokio]
workspace = true
optional = true
```

## 延伸阅读

### 官方资源

- [Cargo Book - Workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html)
- [Cargo Reference - Resolver](https://doc.rust-lang.org/cargo/reference/resolver.html)
- [Cargo Reference - Features](https://doc.rust-lang.org/cargo/reference/features.html)

### 工具推荐

- [cargo-workspaces](https://github.com/pksunkara/cargo-workspaces) - Workspace 管理工具
- [cargo-release](https://github.com/crate-ci/cargo-release) - 自动化发布
- [cargo-deny](https://github.com/EmbarkStudios/cargo-deny) - 依赖审计
- [cargo-machete](https://github.com/bnjbvr/cargo-machete) - 未使用依赖检测

### 优秀开源项目参考

- [Tokio](https://github.com/tokio-rs/tokio) - 异步运行时，workspace 典范
- [Rust-analyzer](https://github.com/rust-lang/rust-analyzer) - IDE 支持，复杂 workspace
- [Bevy](https://github.com/bevyengine/bevy) - 游戏引擎，大型 workspace

---

> Cargo Workspace 是管理复杂 Rust 项目的基石。通过合理的模块划分、统一的依赖管理和优化的构建配置，可以大幅提升开发效率和代码质量。掌握 Workspace 的使用是成为高效 Rust 开发者的重要一步。
