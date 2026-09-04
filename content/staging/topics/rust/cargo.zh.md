---
title: Cargo包管理器
description: Cargo完全指南，Rust项目管理、依赖管理与发布
track: rust
section: cargo-tooling
difficulty: beginner
tags:
  - Rust
  - Cargo
  - 包管理
  - 构建系统
status: imported
origin: old/src/content/docs/rust/cargo.zh.md
divergence: 0.208
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 工具链
  order: 9
  lastUpdated: 2026-01-07
---

Cargo 是 Rust 的官方包管理器和构建系统，是 Rust 开发工作流程的核心。它负责项目创建、依赖管理、编译构建、测试运行、文档生成以及包发布等几乎所有开发任务。掌握 Cargo 是成为高效 Rust 开发者的必经之路。

## Cargo 基础

### 安装与验证

Cargo 随 Rust 一同安装。当你通过 rustup 安装 Rust 时，Cargo 会自动包含在内。

```bash
# 验证 Cargo 安装
cargo --version
# 输出示例: cargo 1.75.0 (1d8b05cdd 2023-11-20)

# 查看帮助信息
cargo help

# 查看特定命令的帮助
cargo help build
```

### 常用命令速查

```bash
# 项目创建
cargo new my_project          # 创建二进制项目
cargo new my_library --lib    # 创建库项目
cargo init                    # 在当前目录初始化项目

# 构建与运行
cargo build                   # 编译项目(debug 模式)
cargo build --release         # 编译项目(release 模式，带优化)
cargo run                     # 编译并运行项目
cargo run --release           # 以 release 模式运行
cargo run -- arg1 arg2        # 传递参数给程序

# 代码检查
cargo check                   # 快速检查代码(不生成可执行文件)
cargo clippy                  # 运行 lint 检查
cargo fmt                     # 格式化代码

# 测试与文档
cargo test                    # 运行所有测试
cargo test test_name          # 运行特定测试
cargo doc --open              # 生成并打开文档
cargo bench                   # 运行基准测试

# 依赖管理
cargo update                  # 更新依赖到最新兼容版本
cargo tree                    # 显示依赖树
cargo search serde            # 在 crates.io 搜索包

# 清理
cargo clean                   # 清理构建产物
```

### 创建第一个项目

```bash
# 创建新项目
cargo new hello_cargo
cd hello_cargo

# 查看项目结构
tree .
# .
# ├── Cargo.toml
# └── src
#     └── main.rs
```

**Cargo.toml 内容:**

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2021"

[dependencies]
```

**src/main.rs 内容:**

```rust
fn main() {
    println!("Hello, world!");
}
```

```bash
# 运行项目
cargo run
# 输出:
#    Compiling hello_cargo v0.1.0 (/path/to/hello_cargo)
#     Finished dev [unoptimized + debuginfo] target(s) in 0.50s
#      Running `target/debug/hello_cargo`
# Hello, world!
```

## Cargo.toml 详解

`Cargo.toml` 是项目的清单文件，使用 TOML (Tom's Obvious, Minimal Language) 格式。它定义了项目的元数据、依赖关系和构建配置。

### [package] 部分

```toml
[package]
# 必需字段
name = "my_project"           # 包名(用于 crates.io 和导入)
version = "0.1.0"             # 版本号(遵循语义化版本)
edition = "2021"              # Rust 版本(2015, 2018, 2021)

# 作者信息
authors = ["张三 <zhangsan@example.com>", "李四 <lisi@example.com>"]

# 项目描述(发布到 crates.io 时必需)
description = "一个用于演示的 Rust 项目"

# 许可证(发布时必需)
license = "MIT"
# 或使用许可证文件
license-file = "LICENSE"

# 项目链接
homepage = "https://example.com/my_project"
repository = "https://github.com/username/my_project"
documentation = "https://docs.rs/my_project"

# README 文件
readme = "README.md"

# 关键词和分类(用于 crates.io 搜索)
keywords = ["cli", "tool", "utility", "parser"]  # 最多 5 个
categories = ["command-line-utilities", "development-tools"]

# Rust 版本要求(MSRV - Minimum Supported Rust Version)
rust-version = "1.70"

# 其他选项
publish = true                # 是否允许发布到 crates.io
default-run = "main"          # 默认运行的二进制文件
autobins = true               # 自动发现 bin 目标
autoexamples = true           # 自动发现 examples
autotests = true              # 自动发现 tests
autobenches = true            # 自动发现 benches
```

### 定义多个可执行文件

```toml
# 默认的 main.rs 会自动成为一个 bin 目标
# 可以定义额外的二进制目标

[[bin]]
name = "server"
path = "src/bin/server.rs"

[[bin]]
name = "client"
path = "src/bin/client.rs"
required-features = ["network"]  # 依赖特定 feature

# 库目标配置
[lib]
name = "my_lib"               # 库名称
path = "src/lib.rs"           # 库源文件路径
crate-type = ["lib"]          # 可选: lib, dylib, staticlib, cdylib, rlib
```

**项目结构示例:**

```
my_project/
├── Cargo.toml
├── src/
│   ├── main.rs           # 默认二进制
│   ├── lib.rs            # 库
│   └── bin/
│       ├── server.rs     # server 二进制
│       └── client.rs     # client 二进制
├── examples/
│   └── demo.rs           # 示例程序
├── tests/
│   └── integration.rs    # 集成测试
└── benches/
    └── benchmark.rs      # 基准测试
```

```bash
# 运行特定二进制
cargo run --bin server
cargo run --bin client

# 运行示例
cargo run --example demo
```

### 示例和测试配置

```toml
# 示例配置
[[example]]
name = "advanced_demo"
path = "examples/advanced.rs"
required-features = ["advanced"]

# 测试配置
[[test]]
name = "integration"
path = "tests/integration.rs"

# 基准测试配置
[[bench]]
name = "my_benchmark"
path = "benches/benchmark.rs"
harness = false  # 不使用默认的测试框架
```

## 依赖管理

依赖管理是 Cargo 最核心的功能之一。Cargo 从 crates.io (Rust 官方包注册表) 下载和管理依赖。

### 添加依赖

```toml
[dependencies]
# 最简形式 - 指定版本
serde = "1.0"

# 完整形式 - 带额外选项
serde = { version = "1.0", features = ["derive"] }

# 多种依赖来源

# 从 crates.io (默认)
regex = "1.10"

# 从 Git 仓库
my_lib = { git = "https://github.com/user/my_lib" }
my_lib = { git = "https://github.com/user/my_lib", branch = "develop" }
my_lib = { git = "https://github.com/user/my_lib", tag = "v1.0.0" }
my_lib = { git = "https://github.com/user/my_lib", rev = "a1b2c3d" }

# 从本地路径
local_lib = { path = "../local_lib" }

# 从其他注册表
my_crate = { version = "1.0", registry = "my-registry" }
```

### 版本语法详解

Cargo 使用语义化版本(SemVer)，格式为 `MAJOR.MINOR.PATCH`:

- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的新功能
- **PATCH**: 向后兼容的错误修复

```toml
[dependencies]
# 插入符号(^) - 默认行为
# 允许不修改最左边非零数字的更新
serde = "^1.2.3"    # >=1.2.3, <2.0.0
serde = "^0.2.3"    # >=0.2.3, <0.3.0 (0.x 版本特殊处理)
serde = "^0.0.3"    # >=0.0.3, <0.0.4 (0.0.x 版本更严格)

# 波浪号(~) - 允许最小版本更新
serde = "~1.2.3"    # >=1.2.3, <1.3.0
serde = "~1.2"      # >=1.2.0, <1.3.0
serde = "~1"        # >=1.0.0, <2.0.0

# 通配符(*)
serde = "1.*"       # >=1.0.0, <2.0.0
serde = "1.2.*"     # >=1.2.0, <1.3.0

# 精确版本
serde = "=1.2.3"    # 必须是 1.2.3

# 比较运算符
serde = ">1.2.3"
serde = ">=1.2.3"
serde = "<2.0.0"
serde = "<=2.0.0"

# 组合条件
serde = ">=1.2.3, <1.5.0"
serde = ">=1.2, <1.5"
```

### 依赖类型

```toml
# 普通依赖 - 编译和运行时都需要
[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.35", features = ["rt-multi-thread", "macros"] }
reqwest = { version = "0.11", default-features = false, features = ["json", "rustls-tls"] }

# 开发依赖 - 仅用于测试、示例和基准测试
[dev-dependencies]
criterion = "0.5"        # 基准测试框架
proptest = "1.4"         # 属性测试
mockito = "1.2"          # HTTP mock
tempfile = "3.9"         # 临时文件
pretty_assertions = "1.4" # 更好的断言输出

# 构建依赖 - 仅用于 build.rs 脚本
[build-dependencies]
cc = "1.0"               # 编译 C/C++ 代码
bindgen = "0.69"         # 生成 FFI 绑定
prost-build = "0.12"     # 编译 Protocol Buffers
```

### 平台特定依赖

```toml
# Windows 专用依赖
[target.'cfg(windows)'.dependencies]
winapi = { version = "0.3", features = ["winuser", "processthreadsapi"] }

# Unix 专用依赖
[target.'cfg(unix)'.dependencies]
libc = "0.2"
nix = "0.27"

# macOS 专用依赖
[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.25"

# Linux 专用依赖
[target.'cfg(target_os = "linux")'.dependencies]
inotify = "0.10"

# 特定架构依赖
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "0.2"
js-sys = "0.3"
web-sys = { version = "0.3", features = ["Window", "Document"] }

# 组合条件
[target.'cfg(all(unix, target_pointer_width = "64"))'.dependencies]
special_lib = "1.0"
```

### 重命名和多版本依赖

```toml
[dependencies]
# 重命名依赖
rand_crate = { package = "rand", version = "0.8" }

# 使用不同版本的同一个包
tokio_old = { package = "tokio", version = "0.2" }
tokio = "1.35"
```

```rust
// 在代码中使用重命名后的名称
use rand_crate::Rng;
use tokio_old::runtime::Runtime as OldRuntime;
use tokio::runtime::Runtime;
```

### Cargo.lock 文件

`Cargo.lock` 记录了所有依赖的精确版本，确保构建的可重复性。

```bash
# 更新所有依赖到兼容的最新版本
cargo update

# 更新特定依赖
cargo update -p serde

# 查看过时的依赖(需要安装 cargo-outdated)
cargo install cargo-outdated
cargo outdated
```

**最佳实践:**
- **二进制项目**: 提交 `Cargo.lock` 到版本控制
- **库项目**: 通常不提交 `Cargo.lock`(让用户决定版本)

## Features 特性系统

Features 是 Cargo 的条件编译机制，允许启用或禁用代码的特定部分。

### 定义 Features

```toml
[package]
name = "my_http_client"
version = "0.1.0"

[features]
# 默认启用的 features
default = ["std", "json"]

# 基本 features
std = []                      # 标准库支持
json = ["serde_json"]         # JSON 支持
xml = ["quick-xml"]           # XML 支持
yaml = ["serde_yaml"]         # YAML 支持

# 网络后端选择(互斥)
native-tls = ["reqwest/native-tls"]
rustls-tls = ["reqwest/rustls-tls"]

# 组合 feature
full = ["std", "json", "xml", "yaml", "native-tls"]

# 依赖其他 features
logging = ["log", "env_logger"]
tracing-support = ["tracing", "tracing-subscriber"]

[dependencies]
# 始终包含的依赖
reqwest = { version = "0.11", default-features = false }

# 可选依赖(与 feature 关联)
serde_json = { version = "1.0", optional = true }
quick-xml = { version = "0.31", optional = true }
serde_yaml = { version = "0.9", optional = true }
log = { version = "0.4", optional = true }
env_logger = { version = "0.10", optional = true }
tracing = { version = "0.1", optional = true }
tracing-subscriber = { version = "0.3", optional = true }
```

### 使用条件编译

```rust
// lib.rs

// 模块级条件编译
#[cfg(feature = "json")]
pub mod json_support {
    use serde_json::Value;

    pub fn parse_json(input: &str) -> Result<Value, serde_json::Error> {
        serde_json::from_str(input)
    }
}

#[cfg(feature = "xml")]
pub mod xml_support {
    pub fn parse_xml(input: &str) -> Result<String, Box<dyn std::error::Error>> {
        // XML 解析逻辑
        Ok(input.to_string())
    }
}

// 函数级条件编译
pub struct Client {
    base_url: String,
}

impl Client {
    pub fn new(base_url: &str) -> Self {
        #[cfg(feature = "logging")]
        log::info!("创建新的 HTTP 客户端: {}", base_url);

        Client {
            base_url: base_url.to_string(),
        }
    }

    // 仅在启用 json feature 时可用
    #[cfg(feature = "json")]
    pub fn get_json<T: serde::de::DeserializeOwned>(
        &self,
        path: &str
    ) -> Result<T, Box<dyn std::error::Error>> {
        let url = format!("{}{}", self.base_url, path);
        // 获取并解析 JSON
        todo!()
    }
}

// 使用 cfg_attr 进行条件派生
#[derive(Debug, Clone)]
#[cfg_attr(feature = "json", derive(serde::Serialize, serde::Deserialize))]
pub struct Config {
    pub timeout: u64,
    pub retries: u32,
}

// 使用 cfg! 宏在运行时检查
pub fn print_features() {
    println!("启用的 features:");

    if cfg!(feature = "json") {
        println!("  - json");
    }
    if cfg!(feature = "xml") {
        println!("  - xml");
    }
    if cfg!(feature = "yaml") {
        println!("  - yaml");
    }
}
```

### 使用 Features

```bash
# 使用默认 features
cargo build

# 禁用默认 features
cargo build --no-default-features

# 启用特定 features
cargo build --features "json,xml"

# 禁用默认并启用特定 features
cargo build --no-default-features --features "json"

# 启用所有 features
cargo build --all-features
```

**在依赖中指定 features:**

```toml
[dependencies]
# 使用默认 features
my_http_client = "0.1"

# 启用额外 features
my_http_client = { version = "0.1", features = ["xml", "yaml"] }

# 禁用默认 features
my_http_client = { version = "0.1", default-features = false }

# 禁用默认并启用特定 features
my_http_client = { version = "0.1", default-features = false, features = ["json"] }
```

### Feature 设计最佳实践

```toml
[features]
# 提供合理的默认值
default = ["std"]

# 避免 feature 之间的冲突
# 不好的做法: backend-a 和 backend-b 互斥但没有明确说明
# 好的做法: 在文档中明确说明或使用编译时检查

# 使用有意义的名称
# 不好: f1, f2, extra
# 好: json-support, async-runtime, native-tls

# 提供 "full" feature 方便用户
full = ["std", "json", "xml", "yaml", "logging"]

# 保持 feature 的可加性
# 启用更多 features 不应导致编译失败
```

```rust
// 编译时检查互斥 features
#[cfg(all(feature = "native-tls", feature = "rustls-tls"))]
compile_error!("features 'native-tls' 和 'rustls-tls' 不能同时启用");
```

## 工作区 (Workspace)

工作区允许在一个项目中管理多个相关的包，共享依赖和构建输出。

### 工作区结构

```
my_workspace/
├── Cargo.toml              # 工作区根配置
├── Cargo.lock              # 共享的锁文件
├── target/                 # 共享的构建目录
├── app/                    # 主应用程序
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── core/                   # 核心库
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── utils/                  # 工具库
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── cli/                    # CLI 工具
    ├── Cargo.toml
    └── src/
        └── main.rs
```

### 工作区配置

**根目录 Cargo.toml:**

```toml
[workspace]
# 工作区成员
members = [
    "app",
    "core",
    "utils",
    "cli",
]

# 排除某些目录
exclude = [
    "experiments",
    "deprecated",
]

# 解析器版本(推荐使用 "2")
resolver = "2"

# 工作区级别的依赖(Cargo 1.64+)
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.35", features = ["full"] }
thiserror = "1.0"
anyhow = "1.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# 工作区级别的包元数据
[workspace.package]
version = "0.1.0"
edition = "2021"
authors = ["开发团队 <team@example.com>"]
license = "MIT"
repository = "https://github.com/team/my_workspace"
rust-version = "1.70"
```

**子包 Cargo.toml (app/Cargo.toml):**

```toml
[package]
name = "app"
# 继承工作区配置
version.workspace = true
edition.workspace = true
authors.workspace = true
license.workspace = true

[dependencies]
# 使用工作区依赖
serde.workspace = true
serde_json.workspace = true
tokio.workspace = true
tracing.workspace = true

# 工作区内的本地依赖
core = { path = "../core" }
utils = { path = "../utils" }

# 此包特有的依赖
clap = { version = "4.4", features = ["derive"] }
```

**子包 Cargo.toml (core/Cargo.toml):**

```toml
[package]
name = "core"
version.workspace = true
edition.workspace = true
authors.workspace = true
license.workspace = true

[dependencies]
serde.workspace = true
thiserror.workspace = true

# 内部依赖
utils = { path = "../utils" }
```

### 工作区命令

```bash
# 构建整个工作区
cargo build --workspace
cargo build -p app -p core   # 构建特定包

# 运行特定包
cargo run -p app
cargo run -p cli -- --help

# 测试整个工作区
cargo test --workspace

# 测试特定包
cargo test -p core
cargo test -p utils --lib    # 仅测试库代码

# 检查整个工作区
cargo check --workspace

# 文档
cargo doc --workspace --no-deps

# 发布工作区中的包
cargo publish -p utils       # 先发布底层依赖
cargo publish -p core
cargo publish -p app
```

### 工作区实践示例

**utils/src/lib.rs:**

```rust
//! 通用工具函数库

/// 格式化时间戳
pub fn format_timestamp(timestamp: u64) -> String {
    // 简单实现
    format!("{}秒", timestamp)
}

/// 验证电子邮件格式
pub fn validate_email(email: &str) -> bool {
    email.contains('@') && email.contains('.')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_email() {
        assert!(validate_email("user@example.com"));
        assert!(!validate_email("invalid-email"));
    }
}
```

**core/src/lib.rs:**

```rust
//! 核心业务逻辑库

use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CoreError {
    #[error("用户未找到: {0}")]
    UserNotFound(String),
    #[error("验证失败: {0}")]
    ValidationError(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

impl User {
    pub fn new(id: u64, name: String, email: String) -> Result<Self, CoreError> {
        if !utils::validate_email(&email) {
            return Err(CoreError::ValidationError(
                "无效的邮箱格式".to_string()
            ));
        }
        Ok(User { id, name, email })
    }
}

pub struct UserService {
    users: Vec<User>,
}

impl UserService {
    pub fn new() -> Self {
        UserService { users: Vec::new() }
    }

    pub fn add_user(&mut self, user: User) {
        self.users.push(user);
    }

    pub fn find_user(&self, id: u64) -> Result<&User, CoreError> {
        self.users
            .iter()
            .find(|u| u.id == id)
            .ok_or_else(|| CoreError::UserNotFound(format!("ID: {}", id)))
    }
}
```

**app/src/main.rs:**

```rust
use clap::Parser;
use core::{User, UserService};
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[derive(Parser)]
#[command(name = "app")]
#[command(about = "用户管理应用")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Parser)]
enum Commands {
    /// 添加新用户
    Add {
        #[arg(short, long)]
        name: String,
        #[arg(short, long)]
        email: String,
    },
    /// 列出所有用户
    List,
}

fn main() {
    // 初始化日志
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber).unwrap();

    let cli = Cli::parse();
    let mut service = UserService::new();

    match cli.command {
        Commands::Add { name, email } => {
            match User::new(1, name.clone(), email) {
                Ok(user) => {
                    service.add_user(user);
                    info!("用户 {} 添加成功", name);
                }
                Err(e) => {
                    eprintln!("错误: {}", e);
                }
            }
        }
        Commands::List => {
            info!("列出所有用户...");
            // 实际应用中会从存储读取
        }
    }
}
```

## 构建配置与 Profiles

Profiles 允许为不同场景(开发、发布、测试)配置不同的编译选项。

### 内置 Profiles

```toml
# 开发 profile(cargo build, cargo run)
[profile.dev]
opt-level = 0        # 无优化，编译快
debug = true         # 包含调试信息
split-debuginfo = "..."  # 调试信息分割方式
debug-assertions = true  # 启用调试断言
overflow-checks = true   # 整数溢出检查
lto = false              # 链接时优化
panic = "unwind"         # panic 时展开栈
incremental = true       # 增量编译
codegen-units = 256      # 并行代码生成单元

# 发布 profile(cargo build --release)
[profile.release]
opt-level = 3        # 最大优化
debug = false        # 不包含调试信息
debug-assertions = false
overflow-checks = false
lto = false          # 可设为 true 或 "thin"
panic = "unwind"
incremental = false
codegen-units = 16

# 测试 profile(cargo test)
[profile.test]
inherits = "dev"     # 继承 dev profile
opt-level = 0

# 基准测试 profile(cargo bench)
[profile.bench]
inherits = "release" # 继承 release profile
debug = false
```

### 优化选项详解

```toml
[profile.release]
# 优化级别
opt-level = 3        # 0: 无优化
                     # 1: 基本优化
                     # 2: 更多优化
                     # 3: 所有优化(默认 release)
                     # "s": 优化体积
                     # "z": 最小体积

# 链接时优化(LTO)
lto = "fat"          # false: 禁用
                     # true/"fat": 完整 LTO(最慢编译，最佳性能)
                     # "thin": 更快的 LTO
                     # "off": 禁用

# 代码生成单元
codegen-units = 1    # 减少可提高优化效果，但编译更慢

# Panic 行为
panic = "abort"      # "unwind": 展开栈(支持 catch_unwind)
                     # "abort": 直接终止(更小的二进制)

# 剥离符号
strip = "symbols"    # "none": 不剥离
                     # "debuginfo": 仅剥离调试信息
                     # "symbols": 剥离所有符号
```

### 自定义 Profiles

```toml
# 性能分析 profile
[profile.profiling]
inherits = "release"
debug = true         # 保留调试符号供分析器使用
strip = "none"

# 快速发布(折中方案)
[profile.release-fast]
inherits = "release"
lto = "thin"
codegen-units = 4

# 最小体积
[profile.min-size]
inherits = "release"
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
strip = "symbols"

# CI 测试(稍微优化以加快测试)
[profile.ci-test]
inherits = "test"
opt-level = 1
```

```bash
# 使用自定义 profile
cargo build --profile profiling
cargo build --profile min-size
```

### 依赖优化

```toml
# 为特定依赖设置不同的优化级别
[profile.dev.package."*"]
opt-level = 2        # 所有依赖使用 opt-level 2

[profile.dev.package.image]
opt-level = 3        # 图像处理库使用最高优化

[profile.dev.package.regex]
opt-level = 2        # 正则表达式库适度优化

# 在 dev 模式下优化所有依赖，但自己的代码不优化
[profile.dev.package.my_project]
opt-level = 0
debug = true
```

## 发布 Crate

将 crate 发布到 crates.io 供其他开发者使用。

### 准备发布

**必需的 Cargo.toml 字段:**

```toml
[package]
name = "my_awesome_crate"
version = "0.1.0"
edition = "2021"
license = "MIT OR Apache-2.0"    # 必需
description = "一个实用的 Rust 库"  # 必需
repository = "https://github.com/user/my_awesome_crate"
documentation = "https://docs.rs/my_awesome_crate"
readme = "README.md"
keywords = ["utility", "tool"]    # 最多 5 个
categories = ["development-tools"]

# 包含/排除文件
include = [
    "src/**/*",
    "Cargo.toml",
    "README.md",
    "LICENSE-*",
    "CHANGELOG.md",
]

# 或使用排除
exclude = [
    ".github/**",
    "tests/fixtures/**",
    "*.sh",
    ".gitignore",
]
```

### 编写文档

```rust
//! # My Awesome Crate
//!
//! `my_awesome_crate` 提供了一系列实用的工具函数。
//!
//! ## 功能特性
//!
//! - 高性能字符串处理
//! - 类型安全的配置管理
//! - 异步支持
//!
//! ## 快速开始
//!
//! ```rust
//! use my_awesome_crate::StringUtils;
//!
//! let result = StringUtils::reverse("hello");
//! assert_eq!(result, "olleh");
//! ```
//!
//! ## Feature Flags
//!
//! - `async`: 启用异步支持
//! - `serde`: 启用序列化支持

/// 字符串工具集
///
/// 提供各种字符串处理功能。
///
/// # 示例
///
/// ```rust
/// use my_awesome_crate::StringUtils;
///
/// // 反转字符串
/// let reversed = StringUtils::reverse("Rust");
/// assert_eq!(reversed, "tsuR");
///
/// // 检查回文
/// assert!(StringUtils::is_palindrome("madam"));
/// ```
pub struct StringUtils;

impl StringUtils {
    /// 反转字符串
    ///
    /// # 参数
    ///
    /// * `s` - 要反转的字符串切片
    ///
    /// # 返回值
    ///
    /// 返回反转后的新字符串
    ///
    /// # 示例
    ///
    /// ```rust
    /// use my_awesome_crate::StringUtils;
    ///
    /// let result = StringUtils::reverse("hello");
    /// assert_eq!(result, "olleh");
    /// ```
    pub fn reverse(s: &str) -> String {
        s.chars().rev().collect()
    }

    /// 检查字符串是否为回文
    ///
    /// 忽略大小写进行比较。
    ///
    /// # 示例
    ///
    /// ```rust
    /// use my_awesome_crate::StringUtils;
    ///
    /// assert!(StringUtils::is_palindrome("Madam"));
    /// assert!(!StringUtils::is_palindrome("Hello"));
    /// ```
    pub fn is_palindrome(s: &str) -> bool {
        let s = s.to_lowercase();
        s == Self::reverse(&s)
    }
}

/// 错误类型
///
/// 表示可能发生的各种错误。
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// 无效的输入
    #[error("无效输入: {0}")]
    InvalidInput(String),

    /// IO 错误
    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),
}

/// 类型别名简化 Result
pub type Result<T> = std::result::Result<T, Error>;
```

### 版本管理

遵循语义化版本 (SemVer):

```
version = "MAJOR.MINOR.PATCH"
```

**何时增加版本号:**

| 变更类型 | 版本 | 示例 |
|---------|------|------|
| 不兼容的 API 变更 | MAJOR | 1.0.0 -> 2.0.0 |
| 向后兼容的新功能 | MINOR | 1.0.0 -> 1.1.0 |
| 向后兼容的 bug 修复 | PATCH | 1.0.0 -> 1.0.1 |

**0.x.y 版本的特殊规则:**

- `0.0.z`: 每次变更都可能不兼容
- `0.y.z`: 次版本号变更可能不兼容

### 发布流程

```bash
# 注册 crates.io 账号并获取 API token
# 访问 https://crates.io/me

# 登录
cargo login <your-api-token>

# 验证包内容
cargo package --list        # 查看将包含的文件
cargo package               # 创建 .crate 文件

# 模拟发布
cargo publish --dry-run

# 发布
cargo publish

# 查看发布结果
# https://crates.io/crates/my_awesome_crate
# https://docs.rs/my_awesome_crate
```

### 版本管理命令

```bash
# 撤回版本(标记为不推荐，但不删除)
cargo yank --version 0.1.0

# 取消撤回
cargo yank --version 0.1.0 --undo

# 查看已发布的版本
cargo search my_awesome_crate
```

### 发布检查清单

- [ ] 更新 `Cargo.toml` 中的版本号
- [ ] 更新 `CHANGELOG.md`
- [ ] 确保所有测试通过: `cargo test`
- [ ] 运行 clippy 检查: `cargo clippy`
- [ ] 格式化代码: `cargo fmt`
- [ ] 检查文档: `cargo doc --open`
- [ ] 验证 README 和示例代码
- [ ] 测试干运行: `cargo publish --dry-run`
- [ ] 创建 Git 标签: `git tag v0.1.0`
- [ ] 发布: `cargo publish`

## Cargo 常用命令详解

### 构建命令

```bash
# 基本构建
cargo build                      # Debug 构建
cargo build --release            # Release 构建
cargo build --target x86_64-unknown-linux-gnu  # 交叉编译

# 构建选项
cargo build --jobs 4             # 指定并行任务数
cargo build --verbose            # 详细输出
cargo build --timings            # 显示编译时间分析

# 检查代码(不生成二进制)
cargo check                      # 快速类型检查
cargo check --all-targets        # 检查所有目标
cargo check --all-features       # 检查所有 features
```

### 运行与测试

```bash
# 运行
cargo run                        # 运行默认二进制
cargo run --bin app              # 运行指定二进制
cargo run --example demo         # 运行示例
cargo run -- arg1 arg2           # 传递参数

# 测试
cargo test                       # 运行所有测试
cargo test test_name             # 运行匹配名称的测试
cargo test -- --nocapture        # 显示 println! 输出
cargo test -- --test-threads=1   # 单线程运行测试
cargo test --doc                 # 仅运行文档测试
cargo test --lib                 # 仅运行库测试
cargo test --test integration    # 运行特定集成测试

# 基准测试
cargo bench                      # 运行所有基准测试
cargo bench bench_name           # 运行特定基准测试
```

### 文档与格式

```bash
# 文档
cargo doc                        # 生成文档
cargo doc --open                 # 生成并打开
cargo doc --no-deps              # 不包含依赖的文档
cargo doc --document-private-items  # 包含私有项

# 格式化
cargo fmt                        # 格式化代码
cargo fmt -- --check             # 检查格式(不修改)

# Lint
cargo clippy                     # 运行 clippy
cargo clippy -- -D warnings      # 将警告视为错误
cargo clippy --fix               # 自动修复
```

### 依赖管理

```bash
# 更新依赖
cargo update                     # 更新所有依赖
cargo update -p serde            # 更新特定包
cargo update --dry-run           # 模拟更新

# 查看依赖
cargo tree                       # 显示依赖树
cargo tree -d                    # 显示重复依赖
cargo tree -i serde              # 查看谁依赖 serde
cargo tree --format "{p} {f}"    # 自定义格式

# 搜索
cargo search serde               # 搜索 crates.io
```

### 清理与缓存

```bash
# 清理
cargo clean                      # 删除 target 目录
cargo clean --release            # 仅清理 release 构建
cargo clean -p my_crate          # 清理特定包

# 缓存管理(需要安装 cargo-cache)
cargo install cargo-cache
cargo cache                      # 查看缓存信息
cargo cache --autoclean          # 自动清理
```

## 配置文件与环境

### .cargo/config.toml

在项目根目录或 `~/.cargo/` 创建配置文件:

```toml
# 构建设置
[build]
target = "x86_64-unknown-linux-gnu"  # 默认目标
jobs = 4                              # 并行任务数
incremental = true                    # 增量编译
rustflags = ["-C", "target-cpu=native"]  # 编译器标志

# 命令别名
[alias]
b = "build"
br = "build --release"
c = "check"
t = "test"
r = "run"
d = "doc --open"
lint = "clippy -- -W clippy::pedantic"
expand = "rustc -- -Zunpretty=expanded"

# 替换源(使用国内镜像)
[source.crates-io]
replace-with = "ustc"

[source.ustc]
registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"

# 也可以使用其他镜像
# [source.tuna]
# registry = "sparse+https://mirrors.tuna.tsinghua.edu.cn/crates.io-index/"

# [source.rsproxy]
# registry = "sparse+https://rsproxy.cn/index/"

# 目标特定设置
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=lld"]

[target.aarch64-linux-android]
linker = "aarch64-linux-android-clang"

# 环境变量
[env]
RUST_BACKTRACE = "1"
RUST_LOG = "info"

# 网络设置
[net]
retry = 3                             # 重试次数
git-fetch-with-cli = true             # 使用系统 git
offline = false                       # 离线模式

# 注册表设置
[registries]
my-registry = { index = "https://my-registry.com/index" }
```

### 环境变量

```bash
# 构建相关
CARGO_BUILD_JOBS=4                   # 并行任务数
CARGO_BUILD_TARGET=x86_64-unknown-linux-gnu
CARGO_INCREMENTAL=1                  # 增量编译

# 编译器设置
RUSTFLAGS="-C target-cpu=native"     # rustc 标志
RUSTDOCFLAGS="--cfg docsrs"          # rustdoc 标志

# 缓存目录
CARGO_HOME=/path/to/cargo            # Cargo 主目录
CARGO_TARGET_DIR=/path/to/target     # 构建输出目录

# 调试
RUST_BACKTRACE=1                     # 显示 backtrace
RUST_LOG=debug                       # 日志级别

# 网络
CARGO_HTTP_PROXY=http://proxy:8080
CARGO_HTTPS_PROXY=https://proxy:8080
```

### build.rs 构建脚本

```rust
// build.rs
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // 获取环境变量
    let out_dir = env::var("OUT_DIR").unwrap();
    let profile = env::var("PROFILE").unwrap();

    println!("cargo:warning=构建模式: {}", profile);

    // 生成代码
    let dest_path = Path::new(&out_dir).join("generated.rs");
    fs::write(
        &dest_path,
        format!(
            r#"
            pub const BUILD_TIME: &str = "{}";
            pub const GIT_HASH: &str = "{}";
            "#,
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S"),
            get_git_hash()
        ),
    ).unwrap();

    // 链接 C 库
    println!("cargo:rustc-link-lib=ssl");
    println!("cargo:rustc-link-lib=crypto");
    println!("cargo:rustc-link-search=native=/usr/lib");

    // 设置环境变量(可在代码中通过 env! 访问)
    println!("cargo:rustc-env=BUILD_PROFILE={}", profile);

    // 条件编译
    if cfg!(target_os = "linux") {
        println!("cargo:rustc-cfg=linux_specific");
    }

    // 重新运行条件
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=src/bindings.h");
    println!("cargo:rerun-if-env-changed=MY_ENV_VAR");
}

fn get_git_hash() -> String {
    std::process::Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .unwrap_or_else(|| "unknown".to_string())
        .trim()
        .to_string()
}
```

```rust
// src/lib.rs
// 包含生成的代码
include!(concat!(env!("OUT_DIR"), "/generated.rs"));

pub fn print_build_info() {
    println!("构建时间: {}", BUILD_TIME);
    println!("Git Hash: {}", GIT_HASH);
    println!("构建模式: {}", env!("BUILD_PROFILE"));
}
```

## 常用 Cargo 扩展

### 必备扩展

```bash
# cargo-edit: 依赖管理增强
cargo install cargo-edit
cargo add serde                      # 添加依赖
cargo add tokio --features full      # 带 features
cargo rm serde                       # 删除依赖
cargo upgrade                        # 升级依赖

# cargo-watch: 文件监视
cargo install cargo-watch
cargo watch -x check                 # 文件变化时检查
cargo watch -x test                  # 文件变化时测试
cargo watch -x 'run -- --port 8080'  # 文件变化时运行

# cargo-expand: 宏展开
cargo install cargo-expand
cargo expand                         # 展开所有宏
cargo expand my_module::my_fn        # 展开特定项
```

### 代码质量工具

```bash
# cargo-audit: 安全审计
cargo install cargo-audit
cargo audit                          # 检查已知漏洞

# cargo-outdated: 检查过时依赖
cargo install cargo-outdated
cargo outdated                       # 显示过时依赖

# cargo-deny: 依赖检查
cargo install cargo-deny
cargo deny check                     # 运行所有检查
cargo deny check licenses            # 仅检查许可证
cargo deny check bans                # 检查禁用包
```

### 性能与分析

```bash
# cargo-flamegraph: 火焰图
cargo install flamegraph
cargo flamegraph                     # 生成火焰图

# cargo-bloat: 二进制体积分析
cargo install cargo-bloat
cargo bloat --release                # 分析体积
cargo bloat --release --crates       # 按 crate 分析

# cargo-llvm-lines: 代码膨胀分析
cargo install cargo-llvm-lines
cargo llvm-lines --release           # 分析 LLVM IR 行数
```

### 发布与版本

```bash
# cargo-release: 自动化发布
cargo install cargo-release
cargo release patch                  # 发布补丁版本
cargo release minor                  # 发布次版本
cargo release major                  # 发布主版本

# cargo-make: 任务运行器
cargo install cargo-make
cargo make build                     # 运行构建任务
cargo make test                      # 运行测试任务
```

## 最佳实践

### 项目结构

```
my_project/
├── Cargo.toml
├── Cargo.lock                 # 二进制项目应提交
├── README.md
├── LICENSE
├── CHANGELOG.md
├── .gitignore
├── .cargo/
│   └── config.toml           # 项目级 Cargo 配置
├── src/
│   ├── main.rs               # 或 lib.rs
│   ├── lib.rs                # 可同时有 main.rs 和 lib.rs
│   └── bin/
│       └── other_binary.rs
├── tests/
│   ├── common/
│   │   └── mod.rs            # 测试共享代码
│   └── integration_test.rs
├── examples/
│   └── demo.rs
├── benches/
│   └── benchmark.rs
└── docs/
    └── architecture.md
```

### 依赖管理建议

```toml
[dependencies]
# 使用精确的版本范围
serde = "1.0"                        # 好: 兼容 1.x
# serde = "*"                        # 避免: 太宽松

# 仅启用需要的 features
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
# tokio = { version = "1", features = ["full"] }  # 避免全启用

# 分离开发依赖
[dev-dependencies]
criterion = "0.5"
proptest = "1.4"

# 使用工作区统一版本
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
```

### 性能优化配置

```toml
[profile.release]
opt-level = 3
lto = "thin"                         # 平衡编译速度和性能
codegen-units = 1                    # 更好的优化
strip = true                         # 减小体积
panic = "abort"                      # 更小的二进制

# 开发时优化依赖
[profile.dev.package."*"]
opt-level = 2

# 保持自己的代码不优化以加快编译
[profile.dev.package.my_project]
opt-level = 0
```

### CI/CD 配置示例

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

env:
  CARGO_TERM_COLOR: always

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt

      - name: 检查格式
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

      - name: 测试
        run: cargo test --all-features

      - name: 构建文档
        run: cargo doc --no-deps --all-features
```

## 常见问题与解决方案

### 编译速度优化

```bash
# 使用 cargo check 代替 cargo build
cargo check

# 使用 sccache 缓存编译结果
cargo install sccache
export RUSTC_WRAPPER=sccache

# 使用更快的链接器
# Linux: mold
# macOS: zld
# Windows: lld

# 在 .cargo/config.toml 中配置
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]

# 减少依赖
cargo tree -d  # 查找重复依赖
```

### 依赖冲突解决

```bash
# 查看依赖树找出冲突
cargo tree -d

# 查看特定包的依赖者
cargo tree -i serde

# 强制更新特定包
cargo update -p serde --precise 1.0.200
```

### 离线构建

```bash
# 下载所有依赖供离线使用
cargo fetch

# 离线构建
cargo build --offline

# 或在配置中设置
[net]
offline = true
```

### 清理磁盘空间

```bash
# 清理当前项目
cargo clean

# 清理全局缓存
cargo install cargo-cache
cargo cache --info
cargo cache --autoclean

# 手动清理
rm -rf ~/.cargo/registry/cache
rm -rf ~/.cargo/git/checkouts
```

## 总结

Cargo 是 Rust 生态系统的核心，掌握它对于高效的 Rust 开发至关重要:

1. **项目管理**: 使用 `cargo new` 创建项目，遵循标准目录结构
2. **依赖管理**: 理解版本语义，合理使用 features，定期更新依赖
3. **构建配置**: 使用 profiles 优化开发和发布构建
4. **工作区**: 管理复杂的多包项目
5. **发布流程**: 遵循 SemVer，编写完善的文档
6. **工具扩展**: 使用 cargo-edit、cargo-watch 等提升效率

通过熟练掌握这些概念和工具，您将能够更高效地管理 Rust 项目，与社区协作，并发布高质量的 crate。

## 参考资源

- [Cargo 官方文档](https://doc.rust-lang.org/cargo/)
- [The Cargo Book](https://doc.rust-lang.org/cargo/index.html)
- [crates.io](https://crates.io/)
- [docs.rs](https://docs.rs/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
