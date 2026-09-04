---
title: Rust anyhow 与 thiserror 错误处理库
description: 深入掌握 Rust 错误处理生态核心库 anyhow 与 thiserror：应用场景、API 详解、错误组合与实战模式
track: rust
section: error-handling
difficulty: intermediate
tags:
  - Rust
  - anyhow
  - thiserror
  - 错误处理
  - Result
status: imported
origin: old/src/content/docs/rust/anyhow-thiserror.zh.md
divergence: 0.188
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 错误处理
  order: 4
  lastUpdated: 2026-01-07
---

在 Rust 生态系统中，`anyhow` 和 `thiserror` 是两个互补的错误处理库，由 David Tolnay 开发维护。它们解决了不同场景下的错误处理需求：`thiserror` 用于定义结构化的自定义错误类型，适合库开发；`anyhow` 提供便捷的错误处理方式，适合应用程序开发。

## 概念解释

### 为什么需要这两个库

Rust 标准库的 `std::error::Error` trait 提供了错误处理的基础设施，但手动实现它需要大量样板代码：

```rust
use std::error::Error;
use std::fmt;

#[derive(Debug)]
struct MyError {
    message: String,
}

// 手动实现需要写大量代码
impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl Error for MyError {}
```

`thiserror` 通过派生宏自动生成这些实现，而 `anyhow` 则提供了一个通用的错误类型来简化错误传播。

### thiserror：为库作者设计

`thiserror` 的核心功能是通过 `#[derive(Error)]` 宏自动实现 `std::error::Error` trait。它适用于：

- 需要定义明确错误类型的库
- 需要让调用者能够匹配和处理特定错误的场景
- 需要保持向后兼容的公共 API

### anyhow：为应用开发者设计

`anyhow` 提供了 `anyhow::Error` 类型，可以包装任何实现了 `std::error::Error` 的类型。它适用于：

- 应用程序的顶层错误处理
- 快速原型开发
- 不需要调用者区分具体错误类型的场景

## 核心原理

### thiserror 的宏展开机制

`thiserror` 使用过程宏在编译时生成代码。以下是一个宏展开的示例：

```rust
// 你编写的代码
use thiserror::Error;

#[derive(Error, Debug)]
#[error("数据解析失败: {message}")]
struct ParseError {
    message: String,
}

// thiserror 自动生成的代码（简化版）
impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "数据解析失败: {}", self.message)
    }
}

impl std::error::Error for ParseError {}
```

### anyhow::Error 的内部结构

`anyhow::Error` 是一个智能指针类型，内部包含：

1. **错误对象**：实现了 `std::error::Error` 的原始错误
2. **错误链（backtrace）**：可选的堆栈追踪信息
3. **上下文链**：通过 `.context()` 添加的额外信息

```rust
// anyhow::Error 的概念模型
struct Error {
    inner: Box<dyn std::error::Error + Send + Sync + 'static>,
    backtrace: Option<Backtrace>,
    context: Vec<String>,
}
```

### From trait 与错误转换

两个库都大量使用 `From` trait 实现自动错误转换：

```rust
use thiserror::Error;
use std::io;

#[derive(Error, Debug)]
enum AppError {
    #[error("IO 错误")]
    Io(#[from] io::Error),  // 自动生成 From<io::Error> 实现
}

// thiserror 生成的 From 实现
impl From<io::Error> for AppError {
    fn from(source: io::Error) -> Self {
        AppError::Io(source)
    }
}
```

## 核心要点

### thiserror 属性一览

| 属性 | 作用 | 示例 |
|------|------|------|
| `#[error("...")]` | 定义 Display 输出 | `#[error("文件未找到: {path}")]` |
| `#[from]` | 自动实现 From trait | `Io(#[from] io::Error)` |
| `#[source]` | 标记错误源 | `#[source] inner: io::Error` |
| `#[backtrace]` | 捕获 backtrace | `backtrace: std::backtrace::Backtrace` |
| `transparent` | 透明委托 | `#[error(transparent)]` |

### anyhow API 一览

| API | 作用 | 示例 |
|-----|------|------|
| `anyhow!()` | 创建即时错误 | `anyhow!("发生错误")` |
| `bail!()` | 提前返回错误 | `bail!("验证失败")` |
| `ensure!()` | 条件检查 | `ensure!(x > 0, "必须为正数")` |
| `.context()` | 添加上下文 | `result.context("处理配置时")?` |
| `.with_context()` | 懒加载上下文 | `.with_context(\|\| format!("行 {}", n))?` |
| `Error::downcast_ref()` | 向下转型 | `err.downcast_ref::<IoError>()` |

### 选择决策树

```
需要定义错误类型吗?
├── 是：你在开发库吗?
│   ├── 是 → 使用 thiserror
│   └── 否：调用者需要匹配具体错误吗?
│       ├── 是 → 使用 thiserror
│       └── 否 → 使用 anyhow
└── 否：只需要传播和展示错误
    └── 使用 anyhow
```

## 代码示例

### thiserror 基础用法

```rust
use thiserror::Error;
use std::io;
use std::num::ParseIntError;

/// 应用程序错误类型
#[derive(Error, Debug)]
pub enum AppError {
    /// IO 操作失败
    #[error("IO 错误: {0}")]
    Io(#[from] io::Error),

    /// 解析整数失败
    #[error("解析错误: {0}")]
    Parse(#[from] ParseIntError),

    /// 配置验证失败
    #[error("配置无效: {field} - {reason}")]
    Config { field: String, reason: String },

    /// 资源未找到
    #[error("未找到 {resource_type}: {id}")]
    NotFound {
        resource_type: &'static str,
        id: String,
    },

    /// 权限不足
    #[error("权限不足: 需要 {required} 权限")]
    PermissionDenied { required: String },
}

// 使用自定义错误
fn load_config(path: &str) -> Result<Config, AppError> {
    let content = std::fs::read_to_string(path)?; // io::Error 自动转换

    let port: u16 = content
        .lines()
        .find(|l| l.starts_with("port="))
        .ok_or_else(|| AppError::Config {
            field: "port".to_string(),
            reason: "缺少端口配置".to_string(),
        })?
        .trim_start_matches("port=")
        .parse()?; // ParseIntError 自动转换

    Ok(Config { port })
}

#[derive(Debug)]
struct Config {
    port: u16,
}
```

### thiserror 高级特性

```rust
use thiserror::Error;
use std::backtrace::Backtrace;

/// 带源错误和 backtrace 的错误类型
#[derive(Error, Debug)]
pub enum DatabaseError {
    /// 连接失败，保留原始错误
    #[error("数据库连接失败")]
    Connection {
        #[source]
        source: std::io::Error,
        host: String,
        port: u16,
    },

    /// 查询执行失败，带 backtrace
    #[error("查询执行失败: {query}")]
    Query {
        query: String,
        #[backtrace]
        backtrace: Backtrace,
    },

    /// 透明包装其他错误
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

/// 泛型错误类型
#[derive(Error, Debug)]
#[error("处理 {item} 时失败: {source}")]
pub struct ProcessError<T: std::fmt::Debug> {
    pub item: T,
    #[source]
    pub source: std::io::Error,
}

/// 枚举变体的格式化
#[derive(Error, Debug)]
pub enum ValidationError {
    #[error("字段 `{0}` 不能为空")]
    EmptyField(String),

    #[error("字段 `{field}` 的值 `{value}` 超出范围 [{min}, {max}]")]
    OutOfRange {
        field: String,
        value: i64,
        min: i64,
        max: i64,
    },

    #[error("格式错误: 期望 {expected}，实际 {actual}")]
    FormatMismatch { expected: String, actual: String },
}
```

### anyhow 基础用法

```rust
use anyhow::{anyhow, bail, Context, Result};
use std::fs::File;
use std::io::Read;

/// 使用 anyhow::Result<T> 简化返回类型
fn read_config_file(path: &str) -> Result<String> {
    let mut file = File::open(path)
        .context(format!("无法打开配置文件: {}", path))?;

    let mut content = String::new();
    file.read_to_string(&mut content)
        .context("读取配置内容失败")?;

    if content.is_empty() {
        bail!("配置文件为空");
    }

    Ok(content)
}

/// 解析配置并验证
fn parse_server_config(content: &str) -> Result<ServerConfig> {
    let port = content
        .lines()
        .find(|l| l.starts_with("port="))
        .ok_or_else(|| anyhow!("缺少 port 配置项"))?
        .trim_start_matches("port=")
        .parse::<u16>()
        .context("port 必须是有效的端口号")?;

    let host = content
        .lines()
        .find(|l| l.starts_with("host="))
        .map(|l| l.trim_start_matches("host=").to_string())
        .unwrap_or_else(|| "127.0.0.1".to_string());

    Ok(ServerConfig { host, port })
}

#[derive(Debug)]
struct ServerConfig {
    host: String,
    port: u16,
}

/// 组合多个可能失败的操作
fn initialize_server(config_path: &str) -> Result<()> {
    let content = read_config_file(config_path)
        .context("加载配置阶段失败")?;

    let config = parse_server_config(&content)
        .context("解析配置阶段失败")?;

    println!("服务器配置: {}:{}", config.host, config.port);
    Ok(())
}

fn main() {
    if let Err(e) = initialize_server("config.toml") {
        // 打印完整错误链
        eprintln!("错误: {:#}", e);

        // 或逐级打印
        eprintln!("\n详细错误链:");
        for (i, cause) in e.chain().enumerate() {
            eprintln!("  {}: {}", i, cause);
        }
    }
}
```

### anyhow 高级用法

```rust
use anyhow::{anyhow, ensure, Context, Result};
use std::collections::HashMap;

/// ensure! 宏进行条件验证
fn validate_user(data: &HashMap<String, String>) -> Result<User> {
    ensure!(data.contains_key("name"), "缺少必需字段: name");
    ensure!(data.contains_key("email"), "缺少必需字段: email");
    ensure!(data.contains_key("age"), "缺少必需字段: age");

    let name = data["name"].clone();
    ensure!(!name.is_empty(), "name 不能为空");
    ensure!(name.len() <= 100, "name 长度不能超过 100 字符");

    let email = data["email"].clone();
    ensure!(email.contains('@'), "email 格式无效");

    let age: u8 = data["age"]
        .parse()
        .context("age 必须是有效数字")?;
    ensure!(age >= 18, "用户必须年满 18 岁");
    ensure!(age <= 150, "age 值不合理");

    Ok(User { name, email, age })
}

#[derive(Debug)]
struct User {
    name: String,
    email: String,
    age: u8,
}

/// with_context 进行懒加载上下文（性能优化）
fn process_items(items: &[String]) -> Result<Vec<i32>> {
    items
        .iter()
        .enumerate()
        .map(|(i, item)| {
            item.parse::<i32>()
                .with_context(|| format!("解析第 {} 项失败: '{}'", i + 1, item))
        })
        .collect()
}

/// 错误降级处理
fn get_cached_value(key: &str) -> Result<String> {
    // 主要获取路径
    match fetch_from_primary(key) {
        Ok(value) => return Ok(value),
        Err(e) => {
            eprintln!("主路径失败，尝试备用: {}", e);
        }
    }

    // 备用路径
    fetch_from_backup(key)
        .context("主路径和备用路径均失败")
}

fn fetch_from_primary(_key: &str) -> Result<String> {
    Err(anyhow!("主服务不可用"))
}

fn fetch_from_backup(_key: &str) -> Result<String> {
    Ok("备用值".to_string())
}

/// 向下转型获取原始错误
fn handle_error_with_downcast(err: &anyhow::Error) {
    // 检查是否是特定类型的错误
    if let Some(io_err) = err.downcast_ref::<std::io::Error>() {
        match io_err.kind() {
            std::io::ErrorKind::NotFound => {
                println!("文件未找到，将创建默认配置");
            }
            std::io::ErrorKind::PermissionDenied => {
                println!("权限不足，请以管理员身份运行");
            }
            _ => {
                println!("其他 IO 错误: {}", io_err);
            }
        }
    } else {
        println!("未知错误类型: {}", err);
    }
}
```

### 两者结合使用

```rust
use anyhow::{Context, Result};
use thiserror::Error;
use std::io;

/// 库层面使用 thiserror 定义明确的错误类型
#[derive(Error, Debug)]
pub enum StorageError {
    #[error("存储连接失败: {0}")]
    Connection(#[from] io::Error),

    #[error("数据序列化失败: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("键 '{key}' 不存在")]
    KeyNotFound { key: String },

    #[error("存储容量已满")]
    CapacityExceeded,
}

/// 库的公共 API
pub struct Storage {
    // ...
}

impl Storage {
    pub fn get(&self, key: &str) -> Result<String, StorageError> {
        // 返回具体的错误类型，调用者可以匹配
        Err(StorageError::KeyNotFound {
            key: key.to_string(),
        })
    }

    pub fn set(&self, _key: &str, _value: &str) -> Result<(), StorageError> {
        Ok(())
    }
}

/// 应用层面使用 anyhow 处理所有错误
fn application_logic() -> Result<()> {
    let storage = Storage {};

    // StorageError 自动转换为 anyhow::Error
    let value = storage
        .get("config")
        .context("获取配置失败")?;

    println!("配置值: {}", value);
    Ok(())
}

/// 需要时可以向下转型回原始错误
fn handle_storage_error() -> Result<()> {
    let storage = Storage {};

    match storage.get("user_id") {
        Ok(v) => println!("用户ID: {}", v),
        Err(StorageError::KeyNotFound { key }) => {
            println!("键 {} 不存在，使用默认值", key);
        }
        Err(e) => {
            // 其他错误向上传播
            return Err(e.into());
        }
    }

    Ok(())
}
```

## 最佳实践

### 库与应用的分层设计

```rust
// ===== 库层 (使用 thiserror) =====
// lib.rs
use thiserror::Error;

/// 公开的错误类型，允许调用者模式匹配
#[derive(Error, Debug)]
#[non_exhaustive]  // 保留向后兼容性
pub enum LibError {
    #[error("无效的输入: {0}")]
    InvalidInput(String),

    #[error("操作超时")]
    Timeout,

    #[error("内部错误")]
    Internal(#[source] Box<dyn std::error::Error + Send + Sync>),
}

pub fn library_function() -> Result<String, LibError> {
    // 库函数返回具体错误类型
    Ok("result".to_string())
}

// ===== 应用层 (使用 anyhow) =====
// main.rs
use anyhow::{Context, Result};

fn main() -> Result<()> {
    let result = library_function()
        .context("调用库函数失败")?;

    println!("{}", result);
    Ok(())
}
```

### 错误消息设计原则

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ConfigError {
    // 好：说明发生了什么，在哪里，以及可能的原因
    #[error("解析配置文件 '{path}' 的第 {line} 行失败: {reason}")]
    ParseError {
        path: String,
        line: usize,
        reason: String,
    },

    // 好：提供足够上下文
    #[error("环境变量 '{name}' 未设置 (需要用于 {purpose})")]
    MissingEnvVar {
        name: String,
        purpose: String,
    },

    // 避免：过于模糊
    // #[error("配置错误")]
    // Generic,

    // 避免：暴露内部实现细节
    // #[error("HashMap 索引越界")]
    // InternalError,
}
```

### 上下文添加策略

```rust
use anyhow::{Context, Result};

fn process_user_data(user_id: u32) -> Result<()> {
    // 策略 1：在边界处添加上下文
    let user = fetch_user(user_id)
        .with_context(|| format!("获取用户 {} 数据失败", user_id))?;

    // 策略 2：为循环中的操作添加迭代信息
    for (i, item) in user.items.iter().enumerate() {
        process_item(item)
            .with_context(|| format!("处理用户 {} 的第 {} 项数据", user_id, i + 1))?;
    }

    // 策略 3：在高层操作处汇总
    save_results(&user)
        .context("保存用户处理结果失败")?;

    Ok(())
}

fn fetch_user(_id: u32) -> Result<User> {
    Ok(User { items: vec![] })
}

fn process_item(_item: &str) -> Result<()> {
    Ok(())
}

fn save_results(_user: &User) -> Result<()> {
    Ok(())
}

struct User {
    items: Vec<String>,
}
```

### 错误处理与日志集成

```rust
use anyhow::{Context, Result};
use tracing::{error, info, instrument, warn};

#[instrument(skip(config))]
fn process_request(request_id: &str, config: &Config) -> Result<Response> {
    info!("开始处理请求");

    let data = fetch_data(request_id)
        .inspect_err(|e| warn!("获取数据失败，将使用缓存: {}", e))
        .or_else(|_| get_cached_data(request_id))
        .context("获取数据失败且缓存不可用")?;

    let result = transform_data(&data)
        .context("数据转换失败")?;

    info!("请求处理完成");
    Ok(result)
}

fn fetch_data(_id: &str) -> Result<String> {
    Ok("data".to_string())
}

fn get_cached_data(_id: &str) -> Result<String> {
    Ok("cached".to_string())
}

fn transform_data(_data: &str) -> Result<Response> {
    Ok(Response {})
}

struct Config {}
struct Response {}
```

## 常见陷阱

### 在库中使用 anyhow

```rust
// 错误：库使用 anyhow 导致调用者无法匹配具体错误
// lib.rs
pub fn library_fn() -> anyhow::Result<()> {
    // 调用者无法区分不同的错误情况
    Err(anyhow::anyhow!("失败了"))
}

// 正确：库使用 thiserror 定义明确的错误类型
use thiserror::Error;

#[derive(Error, Debug)]
pub enum LibError {
    #[error("类型 A 错误")]
    TypeA,
    #[error("类型 B 错误")]
    TypeB,
}

pub fn library_fn() -> Result<(), LibError> {
    Err(LibError::TypeA)
}
```

### 丢失错误链

```rust
use anyhow::{anyhow, Context, Result};

// 错误：创建新错误时丢失原始错误
fn bad_error_handling() -> Result<()> {
    let result = std::fs::read_to_string("file.txt");
    match result {
        Ok(s) => Ok(()),
        // 丢失了原始的 io::Error
        Err(_) => Err(anyhow!("读取文件失败")),
    }
}

// 正确：保留错误链
fn good_error_handling() -> Result<()> {
    std::fs::read_to_string("file.txt")
        .context("读取文件失败")?;
    Ok(())
}
```

### 过度使用 context

```rust
use anyhow::{Context, Result};

// 不好：每一步都添加上下文导致冗余
fn over_contexted() -> Result<i32> {
    let s = "42";
    let trimmed = s.trim();  // 不会失败，不需要 context
    let parsed = trimmed
        .parse::<i32>()
        .context("解析失败")?;  // 这里 context 有意义
    let result = parsed
        .checked_add(1)
        .ok_or_else(|| anyhow::anyhow!("溢出"))
        .context("加法失败")?;  // 冗余：已有明确错误消息

    Ok(result)
}

// 好：在有意义的地方添加上下文
fn properly_contexted(input: &str) -> Result<i32> {
    input
        .trim()
        .parse::<i32>()
        .context("输入必须是有效的整数")?
        .checked_add(1)
        .ok_or_else(|| anyhow::anyhow!("计算结果溢出"))
}
```

### 忽略 #[from] 和 #[source] 的区别

```rust
use thiserror::Error;
use std::io;

#[derive(Error, Debug)]
enum MyError {
    // #[from]: 同时实现 From trait 和标记为 source
    // 适用于错误变体只包含单个错误时
    #[error("IO 错误")]
    Io(#[from] io::Error),

    // #[source]: 仅标记为错误源，不实现 From
    // 适用于需要额外字段的情况
    #[error("处理文件 {path} 时发生错误")]
    FileProcess {
        path: String,
        #[source]
        source: io::Error,
    },
}

// 使用 #[from] 变体
fn use_from() -> Result<(), MyError> {
    std::fs::read_to_string("test.txt")?;  // 自动转换
    Ok(())
}

// 使用 #[source] 变体
fn use_source(path: &str) -> Result<(), MyError> {
    std::fs::read_to_string(path)
        .map_err(|e| MyError::FileProcess {
            path: path.to_string(),
            source: e,
        })?;
    Ok(())
}
```

### 在异步代码中的 Send 问题

```rust
use anyhow::Result;
use std::rc::Rc;

// 错误：Rc 不是 Send，无法跨 await 点
async fn bad_async() -> Result<()> {
    let data = Rc::new(vec![1, 2, 3]);
    // 编译错误：future 不是 Send
    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    println!("{:?}", data);
    Ok(())
}

// 正确：使用 Arc 替代 Rc
use std::sync::Arc;

async fn good_async() -> Result<()> {
    let data = Arc::new(vec![1, 2, 3]);
    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    println!("{:?}", data);
    Ok(())
}
```

## 性能考量

### 错误路径的成本

```rust
use anyhow::{anyhow, Context, Result};
use std::hint::black_box;

// anyhow::Error 在堆上分配，有一定开销
fn error_allocation_cost() -> Result<()> {
    // 每次创建 anyhow::Error 都会进行堆分配
    Err(anyhow!("错误消息"))
}

// context() 每次调用都会分配新的包装
fn context_cost(path: &str) -> Result<String> {
    std::fs::read_to_string(path)
        .context("读取失败")  // 错误时分配
        .context("处理配置")  // 错误时再次分配
        .context("初始化")?;  // 错误时再次分配
    Ok(String::new())
}

// 优化：使用 with_context 进行懒加载
fn lazy_context(path: &str) -> Result<String> {
    std::fs::read_to_string(path)
        // 只有在错误发生时才会执行闭包
        .with_context(|| format!("读取配置文件 {} 失败", path))?;
    Ok(String::new())
}
```

### thiserror vs anyhow 内存占用

```rust
use std::mem::size_of;
use thiserror::Error;

#[derive(Error, Debug)]
enum SmallError {
    #[error("错误 A")]
    A,
    #[error("错误 B")]
    B,
}

fn compare_sizes() {
    // thiserror 枚举：大小等于最大变体
    println!("SmallError: {} bytes", size_of::<SmallError>());

    // anyhow::Error: 固定 8 bytes (一个指针)
    println!("anyhow::Error: {} bytes", size_of::<anyhow::Error>());

    // Result<(), SmallError>: 通常 1-2 bytes
    println!("Result<(), SmallError>: {} bytes",
             size_of::<Result<(), SmallError>>());

    // Result<(), anyhow::Error>: 8 bytes
    println!("Result<(), anyhow::Error>: {} bytes",
             size_of::<anyhow::Result<()>>());
}
```

### Backtrace 的性能影响

```rust
// Cargo.toml 中启用 backtrace
// [dependencies]
// anyhow = { version = "1.0", features = ["backtrace"] }

use anyhow::Result;

// RUST_BACKTRACE=1 时，每个错误都会捕获 backtrace
// 这会有显著的性能开销

fn with_backtrace() -> Result<()> {
    // 当启用 backtrace 时，创建错误的成本更高
    Err(anyhow::anyhow!("带有 backtrace 的错误"))
}

// 生产环境建议：
// 1. 开发时启用 RUST_BACKTRACE=1
// 2. 生产环境不设置该变量
// 3. 或使用 RUST_BACKTRACE=0 显式禁用
```

### 热路径优化

```rust
use anyhow::{bail, Result};

// 避免在热路径上频繁创建错误
fn hot_path(items: &[i32]) -> Result<i32> {
    let mut sum = 0i32;
    for &item in items {
        // 不好：每次迭代都可能创建错误对象
        // sum = sum.checked_add(item)
        //     .ok_or_else(|| anyhow!("溢出"))?;

        // 好：使用更轻量的检查
        if let Some(new_sum) = sum.checked_add(item) {
            sum = new_sum;
        } else {
            bail!("计算总和时发生溢出");
        }
    }
    Ok(sum)
}

// 对于极高性能要求，考虑使用自定义错误类型
#[derive(Debug)]
struct OverflowError;

fn hot_path_custom(items: &[i32]) -> Result<i32, OverflowError> {
    let mut sum = 0i32;
    for &item in items {
        sum = sum.checked_add(item).ok_or(OverflowError)?;
    }
    Ok(sum)
}
```

## 实战场景

### 场景一：Web 服务错误处理

```rust
use anyhow::{Context, Result};
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;

/// API 错误类型（用于对外响应）
#[derive(Error, Debug)]
pub enum ApiError {
    #[error("资源未找到: {0}")]
    NotFound(String),

    #[error("请求参数无效: {0}")]
    BadRequest(String),

    #[error("未授权访问")]
    Unauthorized,

    #[error("内部服务器错误")]
    Internal(#[from] anyhow::Error),
}

/// API 错误响应
#[derive(Serialize)]
struct ErrorResponse {
    code: u16,
    message: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "未授权".to_string()),
            ApiError::Internal(e) => {
                // 记录内部错误详情
                tracing::error!("内部错误: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "内部服务器错误".to_string())
            }
        };

        let body = Json(ErrorResponse {
            code: status.as_u16(),
            message,
        });

        (status, body).into_response()
    }
}

/// 处理器函数
async fn get_user(user_id: u32) -> Result<Json<User>, ApiError> {
    let user = find_user_by_id(user_id)
        .await
        .context("查询用户数据库失败")?
        .ok_or_else(|| ApiError::NotFound(format!("用户 {} 不存在", user_id)))?;

    Ok(Json(user))
}

async fn find_user_by_id(_id: u32) -> Result<Option<User>> {
    Ok(Some(User { id: 1, name: "Alice".to_string() }))
}

#[derive(Serialize)]
struct User {
    id: u32,
    name: String,
}
```

### 场景二：CLI 工具错误处理

```rust
use anyhow::{bail, Context, Result};
use clap::Parser;
use std::path::PathBuf;

#[derive(Parser)]
struct Cli {
    /// 配置文件路径
    #[arg(short, long, default_value = "config.toml")]
    config: PathBuf,

    /// 输出目录
    #[arg(short, long)]
    output: PathBuf,

    /// 是否详细输出
    #[arg(short, long)]
    verbose: bool,
}

fn main() {
    let cli = Cli::parse();

    if let Err(e) = run(cli) {
        // 根据是否 verbose 决定输出格式
        if std::env::var("RUST_BACKTRACE").is_ok() {
            eprintln!("错误: {:?}", e);
        } else {
            eprintln!("错误: {:#}", e);
            eprintln!("\n提示: 设置 RUST_BACKTRACE=1 查看详细信息");
        }
        std::process::exit(1);
    }
}

fn run(cli: Cli) -> Result<()> {
    // 验证配置文件存在
    if !cli.config.exists() {
        bail!(
            "配置文件不存在: {}\n\
             请创建配置文件或使用 --config 指定路径",
            cli.config.display()
        );
    }

    // 读取配置
    let config_content = std::fs::read_to_string(&cli.config)
        .with_context(|| format!("无法读取配置文件: {}", cli.config.display()))?;

    // 解析配置
    let config: Config = toml::from_str(&config_content)
        .context("配置文件格式错误")?;

    // 验证输出目录
    if !cli.output.exists() {
        std::fs::create_dir_all(&cli.output)
            .with_context(|| format!("无法创建输出目录: {}", cli.output.display()))?;
    }

    // 执行主逻辑
    process(&config, &cli.output)
        .context("处理过程中发生错误")?;

    println!("处理完成！输出目录: {}", cli.output.display());
    Ok(())
}

#[derive(serde::Deserialize)]
struct Config {
    name: String,
}

fn process(_config: &Config, _output: &PathBuf) -> Result<()> {
    Ok(())
}
```

### 场景三：库的分层错误设计

```rust
use thiserror::Error;
use std::io;

// ===== 底层：存储层错误 =====
#[derive(Error, Debug)]
pub enum StorageError {
    #[error("连接失败: {0}")]
    Connection(#[source] io::Error),

    #[error("读取失败: key={key}")]
    Read { key: String, #[source] source: io::Error },

    #[error("写入失败: key={key}")]
    Write { key: String, #[source] source: io::Error },

    #[error("数据损坏: {0}")]
    Corruption(String),
}

// ===== 中层：业务逻辑层错误 =====
#[derive(Error, Debug)]
pub enum ServiceError {
    #[error("存储错误")]
    Storage(#[from] StorageError),

    #[error("用户 {user_id} 不存在")]
    UserNotFound { user_id: u64 },

    #[error("权限不足: 用户 {user_id} 无法访问资源 {resource}")]
    PermissionDenied { user_id: u64, resource: String },

    #[error("验证失败: {0}")]
    Validation(String),
}

// ===== 顶层：API 层错误 =====
#[derive(Error, Debug)]
pub enum ApiError {
    #[error("服务错误")]
    Service(#[from] ServiceError),

    #[error("请求格式错误: {0}")]
    BadRequest(String),

    #[error("认证失败")]
    AuthenticationFailed,

    #[error("请求频率超限")]
    RateLimited,
}

// 业务逻辑层
mod service {
    use super::*;

    pub fn get_user(user_id: u64) -> Result<User, ServiceError> {
        // 调用存储层
        let data = storage::read_user(user_id)?;

        // 验证数据
        if data.is_empty() {
            return Err(ServiceError::UserNotFound { user_id });
        }

        Ok(User { id: user_id, data })
    }

    pub struct User {
        pub id: u64,
        pub data: String,
    }
}

// 存储层
mod storage {
    use super::*;

    pub fn read_user(_user_id: u64) -> Result<String, StorageError> {
        Ok("user_data".to_string())
    }
}
```

## 面试要点

### 基础问题

**Q1: thiserror 和 anyhow 的核心区别是什么？什么时候用哪个？**

A: `thiserror` 用于定义具体的错误类型，通过派生宏自动实现 `Error` trait，适合库开发，让调用者能够匹配处理特定错误。`anyhow` 提供通用的错误类型 `anyhow::Error`，可包装任何错误并添加上下文，适合应用程序开发。

选择原则：
- 开发库 -> thiserror
- 开发应用 -> anyhow
- 需要调用者区分错误类型 -> thiserror
- 只关心错误传播和展示 -> anyhow

**Q2: `#[from]` 和 `#[source]` 有什么区别？**

A: `#[from]` 会自动实现 `From` trait 并标记为错误源，适用于错误变体只包含单个错误类型的情况，支持 `?` 运算符自动转换。`#[source]` 只标记字段为错误源，不实现 `From`，适用于需要额外字段的情况，需要手动构造错误。

**Q3: anyhow 的 `context()` 和 `with_context()` 有什么区别？**

A: `context()` 立即计算上下文字符串，`with_context()` 接受闭包进行懒加载，只在错误发生时才计算。对于需要格式化的复杂上下文信息，`with_context()` 性能更好。

### 进阶问题

**Q4: 如何在 anyhow 中向下转型获取原始错误？**

```rust
use anyhow::Result;

fn handle_error(err: &anyhow::Error) {
    if let Some(io_err) = err.downcast_ref::<std::io::Error>() {
        // 处理 IO 错误
    }
}
```

**Q5: 如何设计一个既支持具体错误匹配又便于传播的错误类型？**

A: 使用 thiserror 定义具体错误，并实现 `From<具体错误> for anyhow::Error`（这是自动的），或在错误枚举中添加 `#[error(transparent)] Other(#[from] anyhow::Error)` 变体。

**Q6: anyhow::Error 的内存布局是怎样的？**

A: `anyhow::Error` 是一个单指针大小（8 bytes on 64-bit），指向堆上分配的错误对象。内部包含原始错误、可选的 backtrace 和上下文链。这使得 `Result<T, anyhow::Error>` 的大小固定，不受错误类型大小影响。

### 实战问题

**Q7: 如何在 Web 服务中优雅地处理错误？**

A: 定义 API 层的错误类型，实现 `IntoResponse`（Axum）或类似 trait，将内部错误转换为 HTTP 响应。对于 500 错误记录详细日志但不暴露给用户，对于 4xx 错误提供有用的错误信息。

**Q8: 如何测试错误处理代码？**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "test");
        let my_err: MyError = io_err.into();
        assert!(matches!(my_err, MyError::Io(_)));
    }

    #[test]
    fn test_error_message() {
        let err = MyError::NotFound { item: "user".to_string() };
        assert_eq!(err.to_string(), "未找到: user");
    }

    #[test]
    fn test_error_chain() {
        let result: anyhow::Result<()> = Err(anyhow!("inner"))
            .context("outer");
        let err = result.unwrap_err();
        assert_eq!(err.chain().count(), 2);
    }
}
```

## 延伸阅读

### 官方资源

- [thiserror GitHub 仓库](https://github.com/dtolnay/thiserror)
- [anyhow GitHub 仓库](https://github.com/dtolnay/anyhow)
- [thiserror crates.io](https://crates.io/crates/thiserror)
- [anyhow crates.io](https://crates.io/crates/anyhow)
- [Rust 错误处理 - The Book](https://doc.rust-lang.org/book/ch09-00-error-handling.html)

### 深度文章

- [Error Handling in Rust - Andrew Gallant](https://blog.burntsushi.net/rust-error-handling/)
- [Rust Error Handling - Nick Cameron](https://www.ncameron.org/blog/rust-error-handling/)
- [Designing error types in Rust](https://mmapped.blog/posts/12-rust-error-handling.html)

### 相关库

- [eyre](https://github.com/yaahc/eyre) - anyhow 的替代品，支持自定义报告格式
- [miette](https://github.com/zkat/miette) - 提供精美的诊断报告
- [color-eyre](https://github.com/yaahc/color-eyre) - 带颜色的错误报告
- [snafu](https://github.com/shepmaster/snafu) - 另一个错误处理库
- [error-stack](https://github.com/hashintel/hash/tree/main/libs/error-stack) - 提供丰富上下文的错误库

### 设计模式

- [Rust API Guidelines - Error Handling](https://rust-lang.github.io/api-guidelines/interoperability.html#c-common-traits)
- [Rust Design Patterns - Error Handling](https://rust-unofficial.github.io/patterns/idioms/error-handling.html)
