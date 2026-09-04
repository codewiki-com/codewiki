---
title: Serde序列化
description: Rust Serde完全指南，序列化、反序列化与自定义实现
track: rust
section: cargo-tooling
difficulty: intermediate
tags:
  - Rust
  - Serde
  - 序列化
  - JSON
status: imported
origin: old/src/content/docs/rust/serde.zh.md
divergence: 0.301
issues: []
legacy:
  category: Rust
  subcategory: 第三方库
  order: 14
  lastUpdated: 2026-01-07
---

Serde 是 Rust 生态系统中最重要的序列化框架，名称来源于 **Ser**ialize（序列化）和 **De**serialize（反序列化）的组合。它提供了高效、通用的数据结构序列化和反序列化能力，是 Rust 中处理数据交换的首选方案。

## Serde 核心概念

### 什么是 Serde

Serde 的设计理念是将数据结构与数据格式解耦。它由两部分组成：

1. **数据结构层**：知道如何序列化和反序列化自身的数据结构
2. **数据格式层**：知道如何序列化和反序列化其他数据的格式实现

Serde 提供了连接这两层的桥梁，使得任何支持的数据结构都可以与任何支持的数据格式无缝配合。

```rust
// 数据结构只需实现一次 Serialize/Deserialize
#[derive(Serialize, Deserialize)]
struct User {
    name: String,
    age: u32,
}

// 即可与任意格式配合使用
let json = serde_json::to_string(&user)?;      // JSON
let yaml = serde_yaml::to_string(&user)?;      // YAML
let toml = toml::to_string(&user)?;            // TOML
let msgpack = rmp_serde::to_vec(&user)?;       // MessagePack
```

### Serde 数据模型

Serde 定义了一个中间数据模型，包含以下类型：

| 类型 | 描述 |
|------|------|
| bool | 布尔值 |
| i8, i16, i32, i64, i128 | 有符号整数 |
| u8, u16, u32, u64, u128 | 无符号整数 |
| f32, f64 | 浮点数 |
| char | Unicode 字符 |
| string | UTF-8 字符串 |
| byte array | 字节数组 |
| option | 可选值 |
| unit | 空类型 |
| unit_struct | 单元结构体 |
| unit_variant | 单元枚举变体 |
| newtype_struct | 新类型结构体 |
| newtype_variant | 新类型枚举变体 |
| seq | 序列（如 Vec） |
| tuple | 元组 |
| tuple_struct | 元组结构体 |
| tuple_variant | 元组枚举变体 |
| map | 映射（如 HashMap） |
| struct | 结构体 |
| struct_variant | 结构体枚举变体 |

## 快速入门

### 添加依赖

在 `Cargo.toml` 中添加 Serde 依赖：

```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"  # JSON 格式支持
```

`derive` feature 启用了派生宏功能，这是最常用的方式。

### 基础示例

```rust
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
struct Point {
    x: i32,
    y: i32,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let point = Point { x: 1, y: 2 };

    // 序列化为 JSON 字符串
    let serialized = serde_json::to_string(&point)?;
    println!("序列化结果: {}", serialized);
    // 输出: {"x":1,"y":2}

    // 从 JSON 字符串反序列化
    let deserialized: Point = serde_json::from_str(&serialized)?;
    println!("反序列化结果: {:?}", deserialized);
    // 输出: Point { x: 1, y: 2 }

    Ok(())
}
```

## Serialize 和 Deserialize Trait

### Serialize Trait

`Serialize` trait 定义了类型如何被序列化：

```rust
pub trait Serialize {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer;
}
```

这个方法将类型映射到 Serde 数据模型中，通过调用 `Serializer` 的相应方法来完成序列化。

### Deserialize Trait

`Deserialize` trait 定义了类型如何被反序列化：

```rust
pub trait Deserialize<'de>: Sized {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>;
}
```

注意生命周期参数 `'de`，它表示反序列化数据的生命周期，允许零拷贝反序列化。

## 派生宏详解

### 自动派生

对于大多数情况，使用 `#[derive]` 宏即可自动生成实现：

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Config {
    host: String,
    port: u16,
    enabled: bool,
    tags: Vec<String>,
}

#[derive(Serialize, Deserialize)]
enum Status {
    Active,
    Inactive,
    Pending { reason: String },
}
```

### 支持的类型

派生宏支持以下类型的自动实现：

```rust
// 普通结构体
#[derive(Serialize, Deserialize)]
struct Regular {
    field1: String,
    field2: i32,
}

// 元组结构体
#[derive(Serialize, Deserialize)]
struct Tuple(i32, String, bool);

// 新类型结构体
#[derive(Serialize, Deserialize)]
struct Newtype(String);

// 单元结构体
#[derive(Serialize, Deserialize)]
struct Unit;

// 枚举
#[derive(Serialize, Deserialize)]
enum Message {
    Quit,                           // 单元变体
    Move { x: i32, y: i32 },        // 结构体变体
    Write(String),                  // 新类型变体
    Color(u8, u8, u8),              // 元组变体
}
```

## Serde 属性详解

Serde 提供了丰富的属性来自定义序列化和反序列化行为。属性分为三类：

### 容器属性（Container Attributes）

应用于结构体或枚举的属性：

#### rename 和 rename_all

```rust
// 重命名整个类型
#[derive(Serialize, Deserialize)]
#[serde(rename = "user_info")]
struct User {
    name: String,
}

// 统一重命名所有字段
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApiResponse {
    user_name: String,      // 序列化为 "userName"
    created_at: String,     // 序列化为 "createdAt"
    is_active: bool,        // 序列化为 "isActive"
}
```

`rename_all` 支持的命名约定：
- `lowercase`
- `UPPERCASE`
- `PascalCase`
- `camelCase`
- `snake_case`
- `SCREAMING_SNAKE_CASE`
- `kebab-case`
- `SCREAMING-KEBAB-CASE`

#### deny_unknown_fields

```rust
// 反序列化时遇到未知字段会报错
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct StrictConfig {
    host: String,
    port: u16,
}

// 尝试反序列化包含 "extra" 字段的数据会失败
```

#### default

```rust
// 缺失字段使用 Default::default()
#[derive(Serialize, Deserialize, Default)]
#[serde(default)]
struct Settings {
    theme: String,
    font_size: u32,
    auto_save: bool,
}

// 或使用自定义默认值函数
fn default_settings() -> Settings {
    Settings {
        theme: "dark".to_string(),
        font_size: 14,
        auto_save: true,
    }
}

#[derive(Serialize, Deserialize)]
#[serde(default = "default_settings")]
struct Settings {
    theme: String,
    font_size: u32,
    auto_save: bool,
}
```

#### transparent

```rust
// 序列化时忽略外层包装
#[derive(Serialize, Deserialize)]
#[serde(transparent)]
struct UserId(String);

// 序列化结果就是内部的 String，而不是对象
```

### 字段属性（Field Attributes）

应用于结构体字段的属性：

#### rename

```rust
#[derive(Serialize, Deserialize)]
struct Post {
    #[serde(rename = "postId")]
    id: u64,

    #[serde(rename = "type")]  // 处理 Rust 关键字
    post_type: String,

    // 序列化和反序列化使用不同名称
    #[serde(rename(serialize = "authorName", deserialize = "author_name"))]
    author: String,
}
```

#### alias

```rust
#[derive(Deserialize)]
struct User {
    // 可以从 "name" 或 "username" 或 "user_name" 反序列化
    #[serde(alias = "username", alias = "user_name")]
    name: String,
}
```

#### default

```rust
fn default_port() -> u16 {
    8080
}

#[derive(Serialize, Deserialize)]
struct ServerConfig {
    host: String,

    #[serde(default = "default_port")]
    port: u16,

    #[serde(default)]  // 使用 Vec::default()
    allowed_origins: Vec<String>,
}
```

#### skip 系列

```rust
#[derive(Serialize, Deserialize)]
struct Session {
    user_id: u64,

    #[serde(skip)]  // 完全跳过
    internal_state: String,

    #[serde(skip_serializing)]  // 只在序列化时跳过
    password_hash: String,

    #[serde(skip_deserializing)]  // 只在反序列化时跳过
    computed_value: i32,

    // 条件跳过
    #[serde(skip_serializing_if = "Option::is_none")]
    optional_field: Option<String>,

    #[serde(skip_serializing_if = "Vec::is_empty")]
    tags: Vec<String>,
}
```

#### flatten

```rust
#[derive(Serialize, Deserialize)]
struct Pagination {
    page: u32,
    per_page: u32,
}

#[derive(Serialize, Deserialize)]
struct UserQuery {
    #[serde(flatten)]
    pagination: Pagination,

    search: Option<String>,
}

// 序列化结果：{"page":1,"per_page":10,"search":"test"}
// 而不是：{"pagination":{"page":1,"per_page":10},"search":"test"}
```

#### serialize_with 和 deserialize_with

```rust
use serde::{Serialize, Deserialize, Serializer, Deserializer};
use chrono::{DateTime, Utc};

fn serialize_datetime<S>(date: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_str(&date.format("%Y-%m-%d %H:%M:%S").to_string())
}

fn deserialize_datetime<'de, D>(deserializer: D) -> Result<DateTime<Utc>, D::Error>
where
    D: Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    DateTime::parse_from_str(&s, "%Y-%m-%d %H:%M:%S")
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(serde::de::Error::custom)
}

#[derive(Serialize, Deserialize)]
struct Event {
    name: String,

    #[serde(serialize_with = "serialize_datetime", deserialize_with = "deserialize_datetime")]
    timestamp: DateTime<Utc>,
}
```

#### with

```rust
// 使用模块同时指定序列化和反序列化函数
mod timestamp_format {
    use serde::{self, Deserialize, Deserializer, Serializer};
    use chrono::{DateTime, Utc, TimeZone};

    pub fn serialize<S>(date: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_i64(date.timestamp())
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<DateTime<Utc>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let timestamp = i64::deserialize(deserializer)?;
        Ok(Utc.timestamp_opt(timestamp, 0).unwrap())
    }
}

#[derive(Serialize, Deserialize)]
struct LogEntry {
    message: String,

    #[serde(with = "timestamp_format")]
    created_at: DateTime<Utc>,
}
```

### 枚举变体属性（Variant Attributes）

应用于枚举变体的属性：

#### rename

```rust
#[derive(Serialize, Deserialize)]
enum TaskStatus {
    #[serde(rename = "pending")]
    Pending,

    #[serde(rename = "in_progress")]
    InProgress,

    #[serde(rename = "completed")]
    Completed,
}
```

#### skip

```rust
#[derive(Serialize, Deserialize)]
enum InternalStatus {
    Public,

    #[serde(skip)]  // 此变体不参与序列化/反序列化
    Internal,
}
```

#### other

```rust
#[derive(Serialize, Deserialize)]
enum Version {
    V1,
    V2,

    #[serde(other)]  // 匹配所有未知值
    Unknown,
}
```

## 枚举表示形式

Serde 支持四种枚举序列化表示形式：

### 外部标签（Externally Tagged）- 默认

```rust
#[derive(Serialize, Deserialize)]
enum Message {
    Request { id: String, method: String },
    Response { id: String, result: String },
}

// JSON 表示：
// {"Request": {"id": "1", "method": "get"}}
```

### 内部标签（Internally Tagged）

```rust
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
enum Message {
    Request { id: String, method: String },
    Response { id: String, result: String },
}

// JSON 表示：
// {"type": "Request", "id": "1", "method": "get"}
```

### 相邻标签（Adjacently Tagged）

```rust
#[derive(Serialize, Deserialize)]
#[serde(tag = "t", content = "c")]
enum Block {
    Text(String),
    Image { url: String, alt: String },
}

// JSON 表示：
// {"t": "Text", "c": "Hello"}
// {"t": "Image", "c": {"url": "...", "alt": "..."}}
```

### 无标签（Untagged）

```rust
#[derive(Serialize, Deserialize)]
#[serde(untagged)]
enum StringOrInt {
    Int(i64),
    String(String),
}

// JSON 表示（根据实际值决定）：
// 42
// "hello"
```

## serde_json 详解

`serde_json` 是 Serde 生态中最常用的 JSON 格式实现。

### 基础用法

```rust
use serde::{Serialize, Deserialize};
use serde_json::{json, Value};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
    email: String,
}

fn main() -> Result<(), serde_json::Error> {
    // 序列化
    let user = User {
        id: 1,
        name: "Alice".to_string(),
        email: "alice@example.com".to_string(),
    };

    // 转为字符串
    let json_str = serde_json::to_string(&user)?;
    println!("JSON: {}", json_str);

    // 转为格式化字符串
    let json_pretty = serde_json::to_string_pretty(&user)?;
    println!("Pretty JSON:\n{}", json_pretty);

    // 转为字节数组
    let json_bytes = serde_json::to_vec(&user)?;

    // 反序列化
    let parsed: User = serde_json::from_str(&json_str)?;
    println!("Parsed: {:?}", parsed);

    Ok(())
}
```

### json! 宏

`json!` 宏允许使用类似 JSON 的语法创建 `serde_json::Value`：

```rust
use serde_json::json;

let value = json!({
    "name": "Alice",
    "age": 30,
    "address": {
        "city": "Beijing",
        "country": "China"
    },
    "phones": [
        "+86 123 4567 8900",
        "+86 098 7654 3210"
    ],
    "active": true,
    "balance": null
});

// 访问字段
println!("Name: {}", value["name"]);
println!("City: {}", value["address"]["city"]);
println!("First phone: {}", value["phones"][0]);
```

### 动态 JSON（Value 类型）

处理结构未知的 JSON：

```rust
use serde_json::Value;

fn process_json(json_str: &str) -> Result<(), serde_json::Error> {
    let value: Value = serde_json::from_str(json_str)?;

    // 类型检查和访问
    if let Some(name) = value.get("name") {
        if let Some(name_str) = name.as_str() {
            println!("Name: {}", name_str);
        }
    }

    // 使用 match 处理不同类型
    match &value["age"] {
        Value::Number(n) => println!("Age: {}", n),
        Value::String(s) => println!("Age (as string): {}", s),
        Value::Null => println!("Age not provided"),
        _ => println!("Unexpected age type"),
    }

    // 迭代数组
    if let Some(items) = value["items"].as_array() {
        for item in items {
            println!("Item: {}", item);
        }
    }

    // 迭代对象
    if let Some(obj) = value.as_object() {
        for (key, val) in obj {
            println!("{}: {}", key, val);
        }
    }

    Ok(())
}
```

### 流式处理

处理大型 JSON 文件：

```rust
use serde::Deserialize;
use serde_json::Deserializer;
use std::io::BufReader;
use std::fs::File;

#[derive(Debug, Deserialize)]
struct Record {
    id: u64,
    data: String,
}

fn process_large_json_array(path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let stream = Deserializer::from_reader(reader).into_iter::<Record>();

    for result in stream {
        let record = result?;
        println!("Processing record: {:?}", record);
    }

    Ok(())
}
```

## 自定义序列化器

### 实现 Serialize

手动实现 `Serialize` trait：

```rust
use serde::ser::{Serialize, Serializer, SerializeStruct};

struct Color {
    r: u8,
    g: u8,
    b: u8,
}

impl Serialize for Color {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // 方式一：作为结构体序列化
        let mut state = serializer.serialize_struct("Color", 3)?;
        state.serialize_field("r", &self.r)?;
        state.serialize_field("g", &self.g)?;
        state.serialize_field("b", &self.b)?;
        state.end()
    }
}

// 方式二：作为字符串序列化
impl Serialize for Color {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let hex = format!("#{:02x}{:02x}{:02x}", self.r, self.g, self.b);
        serializer.serialize_str(&hex)
    }
}
```

### 实现 Deserialize

手动实现 `Deserialize` trait：

```rust
use serde::de::{self, Deserialize, Deserializer, Visitor, MapAccess};
use std::fmt;

struct Color {
    r: u8,
    g: u8,
    b: u8,
}

impl<'de> Deserialize<'de> for Color {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct ColorVisitor;

        impl<'de> Visitor<'de> for ColorVisitor {
            type Value = Color;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a color as RGB object or hex string")
            }

            // 从对象反序列化
            fn visit_map<M>(self, mut map: M) -> Result<Color, M::Error>
            where
                M: MapAccess<'de>,
            {
                let mut r = None;
                let mut g = None;
                let mut b = None;

                while let Some(key) = map.next_key::<String>()? {
                    match key.as_str() {
                        "r" => r = Some(map.next_value()?),
                        "g" => g = Some(map.next_value()?),
                        "b" => b = Some(map.next_value()?),
                        _ => { let _: serde_json::Value = map.next_value()?; }
                    }
                }

                Ok(Color {
                    r: r.ok_or_else(|| de::Error::missing_field("r"))?,
                    g: g.ok_or_else(|| de::Error::missing_field("g"))?,
                    b: b.ok_or_else(|| de::Error::missing_field("b"))?,
                })
            }

            // 从十六进制字符串反序列化
            fn visit_str<E>(self, value: &str) -> Result<Color, E>
            where
                E: de::Error,
            {
                if value.starts_with('#') && value.len() == 7 {
                    let r = u8::from_str_radix(&value[1..3], 16)
                        .map_err(|_| de::Error::custom("invalid hex"))?;
                    let g = u8::from_str_radix(&value[3..5], 16)
                        .map_err(|_| de::Error::custom("invalid hex"))?;
                    let b = u8::from_str_radix(&value[5..7], 16)
                        .map_err(|_| de::Error::custom("invalid hex"))?;
                    Ok(Color { r, g, b })
                } else {
                    Err(de::Error::custom("invalid color format"))
                }
            }
        }

        deserializer.deserialize_any(ColorVisitor)
    }
}
```

## 常见数据格式

### YAML

```toml
[dependencies]
serde_yaml = "0.9"
```

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Config {
    database: DatabaseConfig,
    server: ServerConfig,
}

#[derive(Serialize, Deserialize)]
struct DatabaseConfig {
    host: String,
    port: u16,
    name: String,
}

#[derive(Serialize, Deserialize)]
struct ServerConfig {
    host: String,
    port: u16,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let yaml_str = r#"
database:
  host: localhost
  port: 5432
  name: mydb
server:
  host: 0.0.0.0
  port: 8080
"#;

    let config: Config = serde_yaml::from_str(yaml_str)?;
    println!("Database: {}:{}", config.database.host, config.database.port);

    // 序列化为 YAML
    let yaml_output = serde_yaml::to_string(&config)?;
    println!("{}", yaml_output);

    Ok(())
}
```

### TOML

```toml
[dependencies]
toml = "0.8"
```

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct CargoToml {
    package: Package,
    dependencies: std::collections::HashMap<String, Dependency>,
}

#[derive(Serialize, Deserialize)]
struct Package {
    name: String,
    version: String,
    edition: String,
}

#[derive(Serialize, Deserialize)]
#[serde(untagged)]
enum Dependency {
    Simple(String),
    Detailed {
        version: Option<String>,
        features: Option<Vec<String>>,
        optional: Option<bool>,
    },
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let toml_str = r#"
[package]
name = "my-project"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = "1.0"
"#;

    let cargo: CargoToml = toml::from_str(toml_str)?;
    println!("Package: {} v{}", cargo.package.name, cargo.package.version);

    Ok(())
}
```

### MessagePack

```toml
[dependencies]
rmp-serde = "1.1"
```

```rust
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
struct Message {
    id: u64,
    payload: Vec<u8>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let msg = Message {
        id: 42,
        payload: vec![1, 2, 3, 4, 5],
    };

    // 序列化为 MessagePack 二进制格式
    let packed = rmp_serde::to_vec(&msg)?;
    println!("MessagePack bytes: {:?}", packed);

    // 反序列化
    let unpacked: Message = rmp_serde::from_slice(&packed)?;
    assert_eq!(msg, unpacked);

    Ok(())
}
```

## 高级技巧

### 零拷贝反序列化

借用数据而非复制：

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Document<'a> {
    #[serde(borrow)]
    title: &'a str,

    #[serde(borrow)]
    content: &'a str,
}

fn main() -> Result<(), serde_json::Error> {
    let json_data = r#"{"title": "Hello", "content": "World"}"#;

    // 反序列化借用原始数据中的字符串
    let doc: Document = serde_json::from_str(json_data)?;
    println!("Title: {}", doc.title);

    Ok(())
}
```

### 泛型支持

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct PaginatedResponse<T> {
    items: Vec<T>,
    total: u64,
    page: u32,
    per_page: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
}

fn main() -> Result<(), serde_json::Error> {
    let response: ApiResponse<Vec<User>> = ApiResponse {
        success: true,
        data: Some(vec![
            User { id: 1, name: "Alice".to_string() },
            User { id: 2, name: "Bob".to_string() },
        ]),
        error: None,
    };

    let json = serde_json::to_string_pretty(&response)?;
    println!("{}", json);

    Ok(())
}
```

### 远程类型派生

为不属于自己的类型实现 Serde：

```rust
use serde::{Serialize, Deserialize};

// 假设这是外部库的类型
mod external {
    pub struct Point {
        pub x: f64,
        pub y: f64,
    }
}

// 定义远程派生
#[derive(Serialize, Deserialize)]
#[serde(remote = "external::Point")]
struct PointDef {
    x: f64,
    y: f64,
}

// 在自己的结构体中使用
#[derive(Serialize, Deserialize)]
struct Geometry {
    name: String,

    #[serde(with = "PointDef")]
    origin: external::Point,
}
```

### 条件编译

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Config {
    name: String,

    // 仅在 debug 模式下包含
    #[cfg(debug_assertions)]
    #[serde(skip_serializing_if = "Option::is_none")]
    debug_info: Option<String>,
}
```

## 错误处理

### 自定义错误消息

```rust
use serde::{Deserialize, Deserializer};
use serde::de::Error;

fn deserialize_positive<'de, D>(deserializer: D) -> Result<i32, D::Error>
where
    D: Deserializer<'de>,
{
    let value = i32::deserialize(deserializer)?;
    if value <= 0 {
        return Err(D::Error::custom("value must be positive"));
    }
    Ok(value)
}

#[derive(Deserialize)]
struct PositiveNumber {
    #[serde(deserialize_with = "deserialize_positive")]
    value: i32,
}
```

### 优雅处理错误

```rust
use serde::Deserialize;

fn parse_config(json: &str) -> Result<Config, ConfigError> {
    serde_json::from_str(json).map_err(|e| {
        ConfigError::ParseError {
            message: e.to_string(),
            line: e.line(),
            column: e.column(),
        }
    })
}

#[derive(Debug)]
enum ConfigError {
    ParseError {
        message: String,
        line: usize,
        column: usize,
    },
}

#[derive(Deserialize)]
struct Config {
    name: String,
}
```

## 性能优化

### 避免不必要的分配

```rust
use serde::{Serialize, Deserialize};
use std::borrow::Cow;

#[derive(Serialize, Deserialize)]
struct Document<'a> {
    // 使用 Cow 在需要时才分配
    #[serde(borrow)]
    title: Cow<'a, str>,

    #[serde(borrow)]
    content: Cow<'a, str>,
}
```

### 使用 serde_bytes 高效处理字节

```rust
use serde::{Serialize, Deserialize};
use serde_bytes;

#[derive(Serialize, Deserialize)]
struct BinaryData {
    // 更高效的字节序列化
    #[serde(with = "serde_bytes")]
    data: Vec<u8>,
}
```

### 预分配容量

```rust
use serde_json;

fn serialize_large_vec(items: &[Item]) -> Result<String, serde_json::Error> {
    // 预估 JSON 大小并预分配
    let estimated_size = items.len() * 100;
    let mut buffer = Vec::with_capacity(estimated_size);

    serde_json::to_writer(&mut buffer, items)?;

    String::from_utf8(buffer).map_err(|e| {
        serde_json::Error::custom(e.to_string())
    })
}

#[derive(serde::Serialize)]
struct Item {
    id: u64,
    name: String,
}
```

## 实战示例

### RESTful API 响应处理

```rust
use serde::{Serialize, Deserialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "status")]
enum ApiResult<T> {
    #[serde(rename = "success")]
    Success { data: T },

    #[serde(rename = "error")]
    Error {
        code: String,
        message: String,
        details: Option<Value>,
    },
}

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    username: String,
    email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    avatar_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateUserRequest {
    username: String,
    email: String,
    password: String,
}

fn handle_api_response(json: &str) -> Result<User, String> {
    let result: ApiResult<User> = serde_json::from_str(json)
        .map_err(|e| format!("JSON parse error: {}", e))?;

    match result {
        ApiResult::Success { data } => Ok(data),
        ApiResult::Error { code, message, .. } => {
            Err(format!("API error [{}]: {}", code, message))
        }
    }
}
```

### 配置文件解析

```rust
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct AppConfig {
    #[serde(default = "default_app_name")]
    app_name: String,

    #[serde(default)]
    debug: bool,

    server: ServerConfig,

    #[serde(default)]
    database: Option<DatabaseConfig>,

    #[serde(default)]
    features: HashMap<String, bool>,

    #[serde(default)]
    log: LogConfig,
}

fn default_app_name() -> String {
    "MyApp".to_string()
}

#[derive(Debug, Serialize, Deserialize)]
struct ServerConfig {
    host: String,

    #[serde(default = "default_port")]
    port: u16,

    #[serde(default)]
    tls: Option<TlsConfig>,
}

fn default_port() -> u16 {
    8080
}

#[derive(Debug, Serialize, Deserialize)]
struct TlsConfig {
    cert_path: PathBuf,
    key_path: PathBuf,
}

#[derive(Debug, Serialize, Deserialize)]
struct DatabaseConfig {
    url: String,

    #[serde(default = "default_pool_size")]
    pool_size: u32,
}

fn default_pool_size() -> u32 {
    10
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct LogConfig {
    #[serde(default = "default_log_level")]
    level: String,

    #[serde(default)]
    file: Option<PathBuf>,
}

fn default_log_level() -> String {
    "info".to_string()
}

fn load_config(path: &str) -> Result<AppConfig, Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(path)?;

    // 根据文件扩展名选择解析器
    let config = if path.ends_with(".json") {
        serde_json::from_str(&content)?
    } else if path.ends_with(".yaml") || path.ends_with(".yml") {
        serde_yaml::from_str(&content)?
    } else if path.ends_with(".toml") {
        toml::from_str(&content)?
    } else {
        return Err("Unsupported config format".into());
    };

    Ok(config)
}
```

## 总结

Serde 是 Rust 生态中不可或缺的序列化框架，其核心优势包括：

1. **高性能**：基于 trait 系统，编译时生成高效代码，避免运行时反射开销
2. **格式无关**：一次实现，多种格式支持
3. **类型安全**：编译期检查，减少运行时错误
4. **灵活可定制**：丰富的属性系统满足各种需求
5. **零拷贝支持**：通过生命周期参数实现高效的数据借用

掌握 Serde 是 Rust 开发者的必备技能，无论是 Web 开发、系统编程还是数据处理，Serde 都能提供强大的数据序列化支持。

## 参考资源

- [Serde 官方网站](https://serde.rs/)
- [Serde GitHub 仓库](https://github.com/serde-rs/serde)
- [serde_json 文档](https://docs.rs/serde_json)
- [Serde API 文档](https://docs.rs/serde)
